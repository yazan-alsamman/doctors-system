import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const submit = (event) => {
    event.preventDefault();
    const result = login({ username, password });
    if (!result.ok) {
      setError(result.message || "تعذر تسجيل الدخول");
      return;
    }
    setError("");
  };

  return (
    <div className="min-h-screen grid place-items-center bg-surface-low/60 p-4">
      <form onSubmit={submit} className="card-pad w-full max-w-md space-y-4">
        <div>
          <div className="label-caps text-primary">MediFlow</div>
          <h1 className="h2 mt-1">تسجيل الدخول</h1>
          <p className="text-sm text-ink-mute mt-1">نموذج محلي مؤقت قابل للاستبدال بواجهة API لاحقاً.</p>
        </div>
        <div>
          <label className="label-caps">اسم المستخدم</label>
          <input
            className="input mt-1.5"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="label-caps">كلمة المرور</label>
          <input
            className="input mt-1.5"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
        </div>
        {error ? <div className="text-sm text-danger">{error}</div> : null}
        <button className="btn-primary w-full">دخول</button>
      </form>
    </div>
  );
}
