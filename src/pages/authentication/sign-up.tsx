/* eslint-disable jsx-a11y/anchor-is-valid */
import { Button, Card, Checkbox, Label, TextInput } from "flowbite-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import LoadingPage from "../pages/loading";

const SignUpPage: React.FC = function () {
  const navigate = useNavigate();
  const { signUp, user, loading } = useAuthContext();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [acceptTerms, setAcceptTerms] = React.useState(false); // Assume you've defined a state to capture terms and conditions checkbox [optional]
  const [error, setError] = React.useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    setError(""); // Reset error state 
    e.preventDefault();

    // Validate password and confirm password
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Check if ticked the terms and conditions checkbox
    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }

    const result = await signUp(email, password);

    if (result.error) {
      console.error("Sign up error:", result.error.message);
      setError(result.error.message);
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (user) {
    navigate("/");
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 lg:h-screen lg:gap-y-12">
      <a href="/" className="my-6 flex items-center gap-x-1 lg:my-0">
        <img alt="Logo" src="../../images/logo.svg" className="mr-3 h-10" />
        <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white">
          NM Chatbot Gen
        </span>
      </a>
      <Card
        horizontal
        imgSrc="/images/authentication/create-account.jpg"
        imgAlt=""
        className="w-full md:max-w-[1024px] md:[&>*]:w-full md:[&>*]:p-16 [&>img]:hidden md:[&>img]:w-96 md:[&>img]:p-0 lg:[&>img]:block">
        <h1 className="mb-3 text-2xl font-bold dark:text-white md:text-3xl">
          Create a Free Account
        </h1>
        {error && (
          <div className="mb-6 p-3 text-sm text-center text-red-500 bg-red-100 dark:bg-red-500 dark:text-red-100 rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleSignUp}>
          <div className="mb-4 flex flex-col gap-y-3">
            <Label htmlFor="email">Your email</Label>
            <TextInput
              id="email"
              name="email"
              placeholder="name@company.com"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-6 flex flex-col gap-y-3">
            <Label htmlFor="password">Your password</Label>
            <TextInput
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-6 flex flex-col gap-y-3">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <TextInput
              id="confirmPassword"
              name="confirmPassword"
              placeholder="••••••••"
              type="password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="mb-6 flex items-center gap-x-3">
            <Checkbox
              id="acceptTerms"
              name="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <Label htmlFor="acceptTerms">
              I accept the&nbsp;
              <a href="#" className="text-primary-700 dark:text-primary-200">
                Terms and Conditions
              </a>
            </Label>
          </div>
          <div className="mb-7">
            <Button type="submit" className="w-full lg:w-auto">
              Create account
            </Button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Already have an account?&nbsp;
            <a
              href="/authentication/sign-in"
              className="text-primary-600 dark:text-primary-200">
              Login here
            </a>
          </p>
        </form>
      </Card>
    </div>
  );
};

export default SignUpPage;
