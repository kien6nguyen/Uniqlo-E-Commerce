require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("./config/passport");
const connectDB = require("./config/db");
const cors = require("cors");
const swaggerUi = require('swagger-ui-express');
const SwaggerParser = require('swagger-parser');

// routes
const authRoutes = require("./src/routes/authRoutes");
const pagesRoutes = require("./src/routes/pagesRoutes");
const userRoutes = require("./src/routes/userRoutes");
const productRoutes = require("./src/routes/productRoutes");
const reviewRoutes = require("./src/routes/reviewRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const cartRoutes = require("./src/routes/cartRoutes");
const discountRoutes = require("./src/routes/discountRoutes");
const checkoutRoutes = require("./src/routes/checkoutRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const loyaltyRoutes = require("./src/routes/loyaltyRoutes");
const socialRoutes = require("./src/routes/socialRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
// Health check endpoint for load balancer
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    instance: instanceId,
    timestamp: new Date().toISOString()
  });
});
// Redis Setup
const { createClient } = require("redis");
const { RedisStore } = require("connect-redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const url = require("url");

const rawRedisUrl = (process.env.REDIS_URL || "redis://127.0.0.1:6379").trim();
let redisUrlParsed;
try {
  redisUrlParsed = url.parse(rawRedisUrl);
} catch (e) {
  console.error("Malformed REDIS_URL:", e.message);
}

const redisConfig = {
  url: rawRedisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("Redis: Max retries reached, giving up.");
        return false; // Dừng thử lại
      }
      return Math.min(retries * 500, 5000);
    },
    connectTimeout: 20000,
    keepAlive: 5000,
    rejectUnauthorized: false
  },
  pingInterval: 5000,
};

const redisClient = createClient(redisConfig);
const pubClient = createClient(redisConfig);
const subClient = createClient(redisConfig);

// Error handlers
const handleError = (label) => (err) => console.error(`Redis ${label} Error:`, err);
redisClient.on("error", handleError("Main"));
pubClient.on("error", handleError("Pub"));
subClient.on("error", handleError("Sub"));

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log("Redis Client for Session connected");

    await Promise.all([pubClient.connect(), subClient.connect()]);
    console.log("Redis Clients for Socket.io connected");
  } catch (err) {
    console.error("Redis Initial Connection Error:", err);
  }
})();

// DB
connectDB();

// View engine
app.set("views", path.join(__dirname, "views"));

// Middleware parse body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ['Set-Cookie']
}));

// Session with Redis Store
app.use(
  session({
    store: new RedisStore({ client: redisClient, prefix: "sess:", disableTouch: true }),
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Instance identification for load balancing demo
const os = require('os');
const instanceId = os.hostname();
app.use((req, res, next) => {
  res.setHeader('X-Instance-Id', instanceId);
  next();
});



// Instance info endpoint for demo
app.get('/api/instance', (req, res) => {
  res.json({
    instance: instanceId,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Swagger
// Swagger setup
const swaggerFilePath = path.join(__dirname, 'docs', 'openAPI.yaml');
async function setupSwagger() {
  try {
    const api = await SwaggerParser.bundle(swaggerFilePath);
    const swaggerOptions = {
      customSiteTitle: "E-Commerce API Docs",
      customCss: `
        .topbar { display: none }
        .swagger-ui .info h2, .swagger-ui .info h1 { color: #2b4eff }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        displayRequestDuration: true,
      },
    };
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(api, swaggerOptions));
  } catch (err) {
    console.error("Lỗi khi xử lý file OpenAPI:", err.message || err);
  }
}

setupSwagger();


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/pages", pagesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api", loyaltyRoutes);
app.use("/api/auth", socialRoutes);


const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }
});

io.adapter(createAdapter(pubClient, subClient));

app.set("io", io);

const { getChatbotResponse } = require("./src/services/chatbotService");

const ChatMessage = require("./src/models/ChatMessage");

const supportModeUsers = new Set();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Admin joins the chat dashboard
  socket.on("join_admin", () => {
    socket.join("admin_room");
    console.log("Admin joined chat dashboard");
  });

  // User requests support
  socket.on("request_support", () => {
    supportModeUsers.add(socket.id);
    io.to("admin_room").emit("support_request", { userId: socket.id });
  });

  socket.on("end_support", () => {
    supportModeUsers.delete(socket.id);
  });
  socket.on("admin_reply", async ({ userId, message }) => {
    try {
      // Save to DB
      await ChatMessage.create({ sender: 'admin', userId, message });

      // Send to specific user
      io.to(userId).emit("receive_message", { message, sender: 'admin' });
    } catch (error) {
      console.error("Error sending admin reply:", error);
    }
  });

  socket.on("chat_message", async (msg) => {
    console.log("Message received:", msg);

    try {
      await ChatMessage.create({ sender: 'user', userId: socket.id, message: msg });

      if (supportModeUsers.has(socket.id)) {
        io.to("admin_room").emit("user_message", { userId: socket.id, message: msg });
      } else {
        const response = await getChatbotResponse(socket.id, msg);
        setTimeout(async () => {
          socket.emit("receive_message", { message: response, sender: 'bot' });
          await ChatMessage.create({ sender: 'bot', userId: socket.id, message: response });
        }, 500);
      }
    } catch (error) {
      console.error("Chat error:", error);
      socket.emit("receive_message", {
        message: "Sorry, I'm having trouble responding right now. Please try again."
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    supportModeUsers.delete(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
