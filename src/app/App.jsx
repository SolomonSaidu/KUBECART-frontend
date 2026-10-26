import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import StoreLayout from "../components/layout/StoreLayout";
import HomePage from "../pages/Home";
import ProductsPage from "../pages/Products";
import NewArrivalsPage from "../pages/NewArrivals";
import SearchPage from "../pages/Search";
import ProductDetailPage from "../pages/ProductDetail";
import CartPage from "../pages/Cart";
import CheckoutPage from "../pages/Checkout";
import PaymentCallbackPage from "../pages/PaymentCallback";
import OrderStatusPage from "../pages/OrderStatus";
import ContactPage from "../pages/Contact";
import NotFoundPage from "../pages/NotFound";
import AdminLoginPage from "../pages/admin/AdminLogin";
import ProtectedAdmin from "../components/admin/ProtectedAdmin";
import AdminOverviewPage from "../pages/admin/AdminOverview";
import AdminOrdersPage from "../pages/admin/AdminOrders";
import AdminOrderDetailPage from "../pages/admin/AdminOrderDetail";
import AdminProductsPage from "../pages/admin/AdminProducts";
import AdminProductCreatePage from "../pages/admin/AdminProductCreate";
import AdminProductEditPage from "../pages/admin/AdminProductEdit";
import AdminCategoriesPage from "../pages/admin/AdminCategories";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="new-arrivals" element={<NewArrivalsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="payment/callback" element={<PaymentCallbackPage />} />
          <Route path="order" element={<OrderStatusPage />} />
          <Route path="order/:reference" element={<OrderStatusPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<ProtectedAdmin />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:reference" element={<AdminOrderDetailPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductCreatePage />} />
          <Route path="products/:slug/edit" element={<AdminProductEditPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </>
  );
}
