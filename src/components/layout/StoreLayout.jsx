import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-deep focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to content
      </a>
      <Header />
      <div id="main-content" className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
