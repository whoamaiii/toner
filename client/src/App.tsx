/**
 * Main application component for the TonerWeb AI Assistant client.
 * 
 * This is the root component that sets up the application structure including:
 * - Routing configuration using Wouter
 * - React Query provider for API state management
 * - UI providers for tooltips and notifications
 * - Dark theme configuration
 * 
 * The app uses a single-page application architecture with client-side routing
 * and provides a seamless user experience for product search and AI assistance.
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";

/**
 * Router component that defines the application's routing structure.
 * 
 * This component uses Wouter for lightweight client-side routing.
 * Currently supports:
 * - Home page route ("/")
 * - Catch-all route that defaults to Home
 * 
 * @returns {JSX.Element} The router component with defined routes
 */
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route>
        <Home />
      </Route>
    </Switch>
  );
}

/**
 * Main App component that provides the application context and renders the router.
 * 
 * This component sets up the essential providers for the application:
 * 
 * **QueryClientProvider**: Provides React Query functionality for:
 * - API state management
 * - Caching of API responses
 * - Background refetching
 * - Optimistic updates
 * 
 * **TooltipProvider**: Enables tooltip functionality throughout the app
 * 
 * **Toaster**: Provides toast notification system for user feedback
 * 
 * **Dark Theme**: Applies dark theme styling to the entire application
 * 
 * @returns {JSX.Element} The complete application with all providers and routing
 * 
 * @example
 * // App is typically used as the root component
 * import App from './App';
 * import { createRoot } from 'react-dom/client';
 * 
 * const root = createRoot(document.getElementById('root'));
 * root.render(<App />);
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
