import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./App.css";

import Home from "./Component/Home";
import AI from "./AI";
import Vertalyot from "./Component/Vertalyot";
import Robot from "./Component/Robot";
import Car from "./Component/Car";
import Game3D from "./Component/Game3D";

// ===============================
// LAYOUT
// ===============================

function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Outlet />
    </div>
  );
}

// ===============================
// ROUTER
// ===============================

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <AI />,
      }

      // {
      //   path: "games/vertalyot",
      //   element: <Vertalyot />,
      // },

      // {
      //   path: "games/ai",
      //   element: <Home />,
      // },

      // {
      //   path: "games/robot",
      //   element: <Robot />,
      // },

      // {
      //   path: "games/car",
      //   element: <Car />,
      // },

      // {
      //   path: "games/3d",
      //   element: <Game3D />,
      // },
    ],
  },
]);

// ===============================
// APP
// ===============================

function App() {
  return (
    <>
      <RouterProvider router={router} />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
      />
    </>
  );
}

export default App;