import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import jwt_decode from "jwt-decode";

function SocialLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      const user = jwt_decode(token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/");
    } else {
      navigate("/login");
    }
  }, [navigate, searchParams]);

  return <p className="text-center mt-5">Đang xử lý đăng nhập...</p>;
}
export default SocialLogin;
