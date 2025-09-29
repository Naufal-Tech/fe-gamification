import { HomeIcon } from "@heroicons/react/24/solid";
import { Link, useRouteError } from "react-router-dom";
import img from "../assets/images/not-found.svg";

const Error = () => {
  const error = useRouteError();

  // Log error safely
  console.error("Route error:", error || "No error details available");

  // Handle 404 for unmatched routes or explicit 404 errors
  const is404 = !error || error.status === 404;

  if (is404) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-200 to-indigo-300 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <img
            src={img}
            alt="img-not-found"
            className="w-full max-w-[300px] block mx-auto mb-8 animate-bounce"
          />
          <h3 className="mb-3 text-3xl font-extrabold text-gray-900 tracking-tight">
            Oops! Page Not Found
          </h3>
          <p className="leading-7 mt-2 mb-6 text-gray-600">
            We can't seem to find the page you're looking for. Please
            double-check the URL or return to the homepage.
          </p>
          <div className="mt-8">
            <Link
              to="/"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 flex items-center justify-center"
            >
              <HomeIcon className="h-5 w-5 mr-2" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle other errors
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-orange-200 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
        <h3 className="text-3xl font-extrabold text-red-700 tracking-tight mb-4">
          Something Went Wrong
        </h3>
        <p className="text-gray-600 mb-6">
          An unexpected error occurred. Please try again later or contact
          support.
        </p>
        {error?.status && (
          <p className="text-sm text-gray-500">Error Code: {error.status}</p>
        )}
        {error?.statusText && (
          <p className="text-sm text-gray-500">{error.statusText}</p>
        )}
        <Link
          to="/"
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          Go Back to Homepage
        </Link>
      </div>
    </div>
  );
};

export default Error;
