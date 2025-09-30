import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter Username and Password");
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store the JWT token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleLogoError = (type) => {
    console.warn(`Logo ${type} failed to load`);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Section - Welcome Message (70% width) */}
      <div className="hidden lg:flex lg:w-[70%] relative overflow-hidden bg-[#eab676] bg-opacity-40">
        {/* Content */}
        <div className="flex flex-col justify-center items-center w-full px-12 text-center">
          {/* Large Welcome Text */}
          <div className="mb-12">
            <h1 className="text-6xl lg:text-7xl xl:text-8xl font-bold text-slate-800 leading-tight">
              Welcome to
              <br />
              <span className="bg-gradient-to-r text-slate-800 bg-clip-text ">
                Accuster Patho
              </span>
              <br />
              portal
            </h1>
          </div>

          {/* Subtitle */}
          <div className="max-w-md">
            <p className="text-slate-800 text-lg leading-relaxed">
              Your gateway to efficient laboratory management. 
              Access your dashboard, manage reports, and streamline your workflow.
            </p>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 border border-gray-400 rounded-full"></div>
          <div className="absolute bottom-32 right-16 w-24 h-24 border border-gray-400 rounded-full"></div>
          <div className="absolute top-1/2 left-8 w-16 h-16 border border-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Right Section - Login Form (30% width) */}
      <div className="w-full lg:w-[30%] flex flex-col justify-center px-6 sm:px-8 lg:px-12 bg-gray-900">
        <div className="w-full max-w-xs mx-auto">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <img
              src="/src/assets/AccusterLogoTransWhite.svg"
              alt="Accuster Logo Small"
              className="h-50 w-50"
              onError={() => handleLogoError('small')}
            />
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-1">Login</h1>
            <p className="text-gray-400 text-base">Enter your Login details</p>
          </div>

          {/* Login Form */}
          <div className="space-y-4">
            {/* Username Field */}
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:bg-gray-750 transition-colors text-base"
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:bg-gray-750 transition-colors text-base pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Forgot Password */}
            <div className="mt-6 mb-6">
              <button 
                className="text-gray-400 hover:text-gray-300 transition-colors text-sm"
                disabled={isLoading}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </div>

          {/* Test Credentials (Remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-gray-400 text-xs mb-2">Test Credentials:</p>
              <p className="text-gray-300 text-xs">Username: pathologist</p>
              <p className="text-gray-300 text-xs">Password: [original password]</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;