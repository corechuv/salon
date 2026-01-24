import { Routes, Route } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { Home } from "../pages/Home/Home";
import { Education } from "../pages/Education/Education";
import { About } from "../pages/About/About";
import { Master } from "../pages/Master/Master";
import { Services } from "../pages/Services/Services";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/education" element={<Education />} />
        <Route path="/masters" element={<Master />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  );
}
