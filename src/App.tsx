/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { Home } from "./lib/pages/Home";
import { Admin } from "./lib/pages/Admin";
import { MatchDetails } from "./lib/pages/MatchDetails";
import { MediaDetails } from "./lib/pages/MediaDetails";
import { Favorites } from "./lib/pages/Favorites";
import { Search } from "./lib/pages/Search";
import { Explore } from "./lib/pages/Explore";
import { ChannelPlayer } from "./lib/pages/ChannelPlayer";
import { LatestAdditions } from "./lib/pages/LatestAdditions";
import { About } from "./lib/pages/About";
import { Settings } from "./lib/pages/Settings";
import { SettingsProvider } from "./lib/SettingsContext";

export default function App() {
  return (
    <SettingsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="match/:id" element={<MatchDetails />} />
            <Route path="media/:id" element={<MediaDetails />} />
            <Route path="channel/:id" element={<ChannelPlayer />} />
            <Route path="channels" element={<Explore />} />
            <Route path="matches" element={<Home />} />
            <Route path="media" element={<Explore />} />
            <Route path="latest" element={<LatestAdditions />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="search" element={<Search />} />
            <Route path="admin" element={<Admin />} />
            <Route path="about" element={<About />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<div className="p-20 text-center text-gray-500">جاري تطوير هذه الصفحة.. ابقَ قريباً</div>} />
          </Route>
        </Routes>
      </Router>
    </SettingsProvider>
  );
}

