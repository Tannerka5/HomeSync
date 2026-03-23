import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginForm) {
    setError(null);
    try {
      await login(data.email, data.password, rememberMe);
      navigate("/");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Login failed. Please try again.";
      setError(msg);
      setShakeKey((k) => k + 1);
    }
  }

  useEffect(() => {
    document.title = "Login · HomeSync";
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-background relative overflow-hidden">
      {/* Skip navigation link */}
      <a
        href="#login-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to login form
      </a>

      {/* Decorative blurred circle */}
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/8 blur-3xl"
        aria-hidden="true"
      />

      <Link
        href="/"
        className="mb-8 flex flex-col items-center gap-1 group"
        aria-label="HomeSync — Go to homepage"
      >
        <img
          src="/logo-full.png"
          alt=""
          className="h-20 sm:h-24 w-auto drop-shadow-md group-hover:scale-105 transition-transform duration-300 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </Link>

      <Card className="w-full max-w-md shadow-xl border-border/50 overflow-hidden">
        {/* Accent bar */}
        <div
          className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/50"
          aria-hidden="true"
        />

        <CardHeader className="space-y-1 text-center pt-7">
          <CardTitle
            className="text-2xl"
            id="login-title"
            role="heading"
            aria-level={1}
          >
            Welcome back
          </CardTitle>
          <CardDescription>
            Enter your email to sign in to your account
          </CardDescription>
        </CardHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          id="login-form"
          aria-labelledby="login-title"
          noValidate
        >
          <CardContent className="space-y-4">
            {error && (
              <div
                key={shakeKey}
                role="alert"
                className="text-sm text-destructive bg-destructive/10 p-3 rounded-md animate-shake"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-10"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Remember me
              </Label>
            </div>

            <Button
              className="w-full text-md py-5"
              size="lg"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Signing in…</span>
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </CardContent>
        </form>

        <CardFooter className="flex flex-col gap-4 pb-7">
          <div className="relative w-full" role="separator" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">Continue as Guest</Link>
          </Button>
          <p className="text-center text-sm text-foreground/70">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
