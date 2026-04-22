const { GoogleGenAI } = require("@google/genai");

// Initialize Google GenAI only if API key is valid
let ai = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key-here") {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

async function getChatbotResponse(userId, userMessage) {
    // If no valid API key, use fallback immediately
    if (!ai) {
        console.log("Using fallback mode (no API key configured)");
        return getFallbackResponse(userMessage);
    }

    try {
        // Using gemini-2.0-flash-exp (the only model currently supported by @google/genai)
        // Free tier limits: 10 RPM, 4M TPM per day
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: `You are a helpful customer support assistant for an e-commerce store. Be friendly, concise (max 2-3 sentences), and helpful. Answer questions about products, shipping, returns, and general support.

Customer question: ${userMessage}

Your response:`,
        });

        const text = response.text;
        console.log("AI response generated successfully");
        return text;
    } catch (error) {
        // Check if it's a rate limit error
        if (error.message && error.message.includes("429")) {
            console.log("Rate limit reached, using fallback (will retry automatically later)");
        } else {
            console.error("Gemini AI Error:", error.message);
        }
        return getFallbackResponse(userMessage);
    }
}

// Enhanced fallback responses with better keyword matching
function getFallbackResponse(msg) {
    const lowerMsg = msg.toLowerCase();

    // Greetings
    if (lowerMsg.match(/\b(hello|hi|hey|greetings|good morning|good afternoon|good evening)\b/)) {
        return "Hello! Welcome to our store! How can I help you today?";
    }

    // Products
    if (lowerMsg.match(/\b(product|sell|what do you|catalog|items|available)\b/)) {
        return "We sell laptops, smartphones, cameras, monitors, and accessories. Browse our products page to see our full catalog with the latest tech! 💻📱";
    }

    // Pricing
    if (lowerMsg.match(/\b(price|cost|how much|expensive|cheap|affordable)\b/)) {
        return "Our prices are very competitive! Check our products page for detailed pricing. We often have special deals and discounts! 💰";
    }

    // Shipping
    if (lowerMsg.match(/\b(ship|delivery|deliver|send|arrive|when will)\b/)) {
        return "We offer FREE shipping on orders over $50! Standard delivery takes 3-5 business days. Express shipping is also available.";
    }

    // Returns
    if (lowerMsg.match(/\b(return|refund|exchange|money back|cancel)\b/)) {
        return "You can return products within 30 days of purchase for a full refund! Please visit our Returns page or contact support for assistance.";
    }

    // Payment
    if (lowerMsg.match(/\b(pay|payment|credit card|paypal|vnpay|checkout)\b/)) {
        return "We accept credit cards, PayPal, and VNPAY. All payments are secure and encrypted for your safety!";
    }

    // Order tracking
    if (lowerMsg.match(/\b(track|order|status|where is my|tracking number)\b/)) {
        return "You can track your order in your account dashboard! If you need help, contact our support team with your order number.";
    }

    // Contact/Support
    if (lowerMsg.match(/\b(contact|support|help|email|phone|call|reach)\b/)) {
        return "Our support team is here to help! Email: support@example.com | Phone: 1-800-123-4567 | We're available 24/7!";
    }

    // Account
    if (lowerMsg.match(/\b(account|login|register|sign up|password|profile)\b/)) {
        return "You can create an account or login at the top right of the page! This lets you track orders, save favorites, and checkout faster.";
    }

    // Warranty
    if (lowerMsg.match(/\b(warranty|guarantee|defect|broken|damaged)\b/)) {
        return "All our products come with a manufacturer's warranty! Contact support if you receive a defective or damaged item.";
    }

    // Default response
    return "I'm here to help! You can ask me about:\n• Products & Pricing\n• Shipping & Delivery\n• Returns & Refunds\n• Order Tracking\n• Payment Methods\n• Support & Contact\n\nWhat would you like to know?";
}

module.exports = {
    getChatbotResponse,
};
