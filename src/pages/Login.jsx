import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [displayName, setDisplayName] = useState(""); // ✅ NEW
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [accent, setAccent] = useState("gold");
  const [shake, setShake] = useState(false);
  const [popup, setPopup] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isLogin && password !== confirm) {
      setError("Passwords do not match");
      setAccent("red");
      setShake(true);
      setPopup("Passwords do not match");
      setTimeout(() => setShake(false), 500);
      setLoading(false);
      return;
    }

    // ================= LOGIN =================
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setAccent("red");
        setShake(true);
        setPopup("Invalid login credentials");
        setTimeout(() => {
          setShake(false);
          setAccent("gold");
        }, 800);
        setLoading(false);
        return;
      }

      setAccent("green");
      setPopup("Welcome to Lumina ✦");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    }

    // ================= REGISTER =================
    else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName, // ✅ SAVED HERE
          },
        },
      });

      if (error) {
        setError(error.message);
        setAccent("red");
        setShake(true);
        setPopup(error.message);
        setTimeout(() => {
          setShake(false);
          setAccent("gold");
        }, 800);
        setLoading(false);
        return;
      }

      setPopup("Account created successfully ✨");
      setIsLogin(true);
      setAccent("green");

      setTimeout(() => {
        setAccent("gold");
      }, 1500);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 relative">

      {popup && <div className={`popup ${accent}`}>{popup}</div>}

      <div className="form-frame">
        <div className={`auth-card ${accent} ${shake ? "shake" : ""}`}>

          <div className="logo">
            <div className="logo-icon">✦</div>
            <h1>LUMINA</h1>
            <p>YOUR PRIVATE GALLERY</p>
          </div>

          <div className="tabs">
            <button
              type="button"
              className={isLogin ? "active" : ""}
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </button>
            <button
              type="button"
              className={!isLogin ? "active" : ""}
              onClick={() => setIsLogin(false)}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form-layout">

            {/* ✅ DISPLAY NAME ONLY ON REGISTER */}
            {!isLogin && (
              <div className="form-group">
                <label>DISPLAY NAME</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label>EMAIL</label>
              <input
                type="email"
                placeholder="Enter Email"
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>PASSWORD</label>
              <input
                type="password"
                placeholder="Enter Password"
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>CONFIRM PASSWORD</label>
                <input
                  type="password"
                  placeholder="Confirm Password"
                  required
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            )}

            {error && <p className="error-text">{error}</p>}

            <button
              type="submit"
              className={`submit-btn ${accent}`}
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : isLogin
                ? "Enter Gallery ✦"
                : "Create Account ✦"}
            </button>

          </form>
        </div>
      </div>

      <style>{`
        .auth-card.gold { border: 2px solid #d4af37; }
        .auth-card.red { border: 2px solid #ff4d4d; }
        .auth-card.green { border: 2px solid #2ecc71; }

        .submit-btn.gold { background: #d4af37; }
        .submit-btn.red { background: #ff4d4d; }
        .submit-btn.green { background: #2ecc71; }

        .shake {
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-6px); }
          100% { transform: translateX(0); }
        }

        .popup {
          position: absolute;
          top: 40px;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: bold;
          animation: fadeIn 0.3s ease;
          background: rgba(0,0,0,0.8);
          color: white;
        }

        .popup.red { border-left: 5px solid #ff4d4d; }
        .popup.green { border-left: 5px solid #2ecc71; }
        .popup.gold { border-left: 5px solid #d4af37; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}