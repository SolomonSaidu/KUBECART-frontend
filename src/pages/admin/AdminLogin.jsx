import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, LockKeyhole, Mail, ShieldCheck, User } from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { bootstrapSchema, loginSchema } from "../../lib/schemas";
import { bootstrapAdmin, login } from "../../services/adminAuth";
import { useAdminAuthStore } from "../../store/adminAuthStore";
import Button from "../../components/ui/Button";

export default function AdminLoginPage() {
  useDocumentTitle("Admin Login");
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAdminAuthStore((state) => state.token);
  const setSession = useAdminAuthStore((state) => state.setSession);
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mode === "login" ? loginSchema : bootstrapSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const authMutation = useMutation({
    mutationFn: async (values) => {
      if (mode === "login") {
        const response = await login(values);
        if (!response?.token) throw new Error("The server did not return an admin session token.");
        return { response };
      }
      const created = await bootstrapAdmin(values);
      const response = await login({ email: values.email, password: values.password });
      if (!response?.token) throw new Error("The server did not return an admin session token.");
      return { response, created };
    },
    onSuccess: ({ response }) => {
      setSession({
        token: response.token,
        csrfToken: response.csrfToken,
        admin: response.admin,
      });
      const target = location.state?.from?.pathname || "/admin";
      navigate(target, { replace: true });
    },
  });

  if (token) return <Navigate to="/admin" replace />;

  function switchMode(nextMode) {
    setMode(nextMode);
    authMutation.reset();
    reset({ name: "", email: "", password: "" });
  }

  const error = authMutation.error;
  const alreadyExists = mode === "bootstrap" && error?.status === 409;

  return (
    <main className="grid min-h-screen bg-page lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-deep p-10 text-white lg:flex">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl"
        />
        <Link to="/" className="relative z-10 inline-flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white">
            <img src="/logo.svg" alt="" className="h-8 w-8 object-contain" />
          </span>
          <span className="text-xl font-extrabold tracking-[-0.04em]">KubeCart</span>
        </Link>

        <div className="relative z-10 max-w-lg">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
            Operations workspace
          </span>
          <h1 className="mt-5 text-[clamp(2.6rem,4vw,4.5rem)] font-extrabold leading-[0.94] tracking-[-0.07em]">
            Run the store from one calm place.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/60">
            Manage catalogue availability, fulfil verified orders, and keep stock accurate. Access
            is limited to administrators of this KubeCart deployment.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-white/70">
            {[
              "Bearer session kept in this browser tab",
              "Orders and payments verified server-side",
              "Catalogue and fulfilment tools only",
            ].map((item) => (
              <p key={item} className="flex items-center gap-2.5">
                <ShieldCheck size={17} className="text-accent" aria-hidden="true" />
                {item}
              </p>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/35">
          KubeCart admin · Authorised personnel only
        </p>
      </section>

      <section className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition hover:text-ink"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to store
          </Link>
          <span className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-muted">
            Admin
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md rounded-[30px] border border-line bg-white p-6 shadow-soft sm:p-8">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-line bg-white">
                <img src="/logo.svg" alt="" className="h-7 w-7 object-contain" />
              </span>
              <span className="text-lg font-extrabold tracking-tight">KubeCart</span>
            </div>

            <span className="eyebrow-dark mt-5 lg:mt-0">
              {mode === "login" ? "Admin sign in" : "Initial setup"}
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.05em]">
              {mode === "login" ? "Welcome back" : "Create the first admin"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {mode === "login"
                ? "Use your administrator email and password. Sessions expire after 24 hours."
                : "Bootstrap only works when no admin exists. After setup you will be signed in."}
            </p>

            <form
              onSubmit={handleSubmit((values) => authMutation.mutate(values))}
              className="mt-6 space-y-4"
              noValidate
            >
              {mode === "bootstrap" && (
                <div>
                  <label htmlFor="admin-name" className="field-label">
                    Name
                  </label>
                  <div className="relative">
                    <User
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="admin-name"
                      className="field-input pl-10"
                      autoComplete="name"
                      placeholder="Admin name"
                      aria-invalid={Boolean(errors.name)}
                      {...register("name")}
                    />
                  </div>
                  {errors.name && <p className="field-error">{errors.name.message}</p>}
                </div>
              )}

              <div>
                <label htmlFor="admin-email" className="field-label">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <input
                    id="admin-email"
                    type="email"
                    className="field-input pl-10"
                    autoComplete="email"
                    placeholder="admin@example.com"
                    aria-invalid={Boolean(errors.email)}
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="field-error">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="admin-password" className="field-label">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    className="field-input pl-10 pr-20"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="At least 8 characters"
                    aria-invalid={Boolean(errors.password)}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-bold text-muted transition hover:text-ink"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && <p className="field-error">{errors.password.message}</p>}
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
                >
                  <p className="font-bold">
                    {alreadyExists ? "An admin already exists" : "Sign-in failed"}
                  </p>
                  <p className="mt-1">{error.message}</p>
                  {alreadyExists && (
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="mt-2 font-bold underline"
                    >
                      Go to admin sign in
                    </button>
                  )}
                  {error.status === 429 && (
                    <p className="mt-1 text-xs">
                      Too many attempts. Wait before trying again to avoid a longer lockout.
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={authMutation.isPending}
              >
                {mode === "login" ? "Sign in to admin" : "Create admin and sign in"}
              </Button>
            </form>

            <div className="mt-5 border-t border-line pt-4 text-center text-sm">
              {mode === "login" ? (
                <button
                  type="button"
                  onClick={() => switchMode("bootstrap")}
                  className="font-semibold text-muted transition hover:text-ink"
                >
                  First time here? <span className="text-accent">Create the initial admin</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-muted transition hover:text-ink"
                >
                  Already set up? <span className="text-accent">Sign in</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
