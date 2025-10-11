# AI Assistant Rules for Restaurant Order System

This document outlines the core technologies used in this application and provides clear guidelines on which libraries and tools to use for specific functionalities.

## Tech Stack Overview

*   **React**: The primary JavaScript library for building the user interface.
*   **TypeScript**: Used for type safety and improved code maintainability. (Note: Existing files might be `.jsx`, but new components should be `.tsx`).
*   **Tailwind CSS**: A utility-first CSS framework for rapid and consistent styling.
*   **shadcn/ui**: A collection of reusable UI components built on Radix UI and styled with Tailwind CSS.
*   **React Router**: For declarative routing within the application.
*   **Supabase**: Used for backend services including database, real-time subscriptions, and authentication.
*   **Framer Motion**: For declarative animations and transitions.
*   **Lucide React**: A library providing a set of beautiful and customizable SVG icons.
*   **Vite**: The build tool used for a fast development experience.
*   **Local Storage Hook**: A custom `useLocalStorage` hook for persistent client-side state management.

## Library Usage Rules

To maintain consistency and efficiency, please adhere to the following rules when implementing features or making changes:

*   **UI Components**: Always use components from `shadcn/ui` (e.g., `Button`, `Card`, `Dialog`, `Input`, `Select`, `DropdownMenu`, `AlertDialog`, `Tabs`, `Popover`, `Command`, `Badge`, `Textarea`). If a required component is not available in `shadcn/ui`, create a new, small component following the existing styling conventions.
*   **Styling**: Exclusively use **Tailwind CSS** classes for all styling. Avoid writing custom CSS in `.css` files unless absolutely necessary for global styles or animations not covered by Tailwind.
*   **Icons**: Use icons from the `lucide-react` library.
*   **Routing**: Implement all client-side routing using `react-router-dom`. Keep main routes defined in `src/App.tsx`.
*   **State Management (Client-side Persistence)**: For data that needs to persist across sessions on the client-side, use the custom `useLocalStorage` hook. For transient component-level state, use React's `useState`.
*   **Backend Interaction (Data, Auth, Realtime)**: All interactions with the backend, including data fetching, real-time subscriptions, and user authentication, must be done using the `supabase` client.
*   **Animations**: Utilize `framer-motion` for any animations or transitions to ensure a smooth and consistent user experience.
*   **Responsive Design**: Employ Tailwind CSS's responsive utilities (e.g., `md:`, `lg:`) and the `react-responsive` and `react-use` (`useWindowSize`) hooks for creating adaptive layouts.
*   **Utility Functions**:
    *   For combining CSS classes, use `cn` (which wraps `clsx` and `tailwind-merge`).
    *   For specific application-level utilities like `generateShortOrderId`, `formatUzbekDateTime`, `formatQuantity`, `formatPrice`, and `getMapLinks`, use the functions provided in `src/lib/utils.js`.
*   **Error Notifications**: Use the `toast` component from `shadcn/ui` (via `useToast`) to inform users about important events, errors, or successful actions.