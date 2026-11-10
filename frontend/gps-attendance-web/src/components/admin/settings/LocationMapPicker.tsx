import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ExternalLink, Navigation } from "lucide-react";

interface LocationMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  radius?: number | null;
  address?: string;
  onLocationChange?: (lat: number, lng: number) => void;
  className?: string;
}

const customPinIcon = L.divIcon({
  className: "leaflet-custom-pulse-pin",
  html: `
    <div style="position: relative; width: 34px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <svg width="34" height="42" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 30 12 30C12 30 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="#00288e"/>
        <circle cx="12" cy="11" r="4.5" fill="#ffffff"/>
      </svg>
    </div>
  `,
  iconSize: [34, 42],
  iconAnchor: [17, 42],
  popupAnchor: [0, -42],
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function LocationMapPicker({
  latitude,
  longitude,
  radius = 100,
  address,
  onLocationChange,
  className = "",
}: LocationMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  const isValidLat = latitude !== null && !Number.isNaN(latitude) && latitude >= -90 && latitude <= 90;
  const isValidLng = longitude !== null && !Number.isNaN(longitude) && longitude >= -180 && longitude <= 180;
  const hasValidCoords = isValidLat && isValidLng;

  // 1. Initialize Leaflet map
  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = hasValidCoords
      ? [latitude as number, longitude as number]
      : [16.0544, 108.2022]; // Đà Nẵng / Trung tâm Việt Nam
    const initialZoom = hasValidCoords ? 15 : 6;

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // OpenStreetMap's public tile service does not require an API key.
    const osmLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }
    );

    // Một lớp dự phòng OpenStreetMap miễn phí nếu máy chủ tile chính tạm thời lỗi.
    const fallbackLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
      {
        maxZoom: 20,
        attribution: '&copy; OpenStreetMap contributors, Tiles courtesy of OSM France',
      }
    );

    osmLayer.addTo(map);
    let fallbackEnabled = false;
    osmLayer.on("tileerror", () => {
      if (!fallbackEnabled) {
        fallbackEnabled = true;
        fallbackLayer.addTo(map);
      }
    });

    // Map click listener to pick new coordinates
    map.on("click", (e: L.LeafletMouseEvent) => {
      onLocationChange?.(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    // Invalidate size after layout stabilization
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    const handleResize = () => map.invalidateSize({ pan: false });
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      osmLayer.off();
      fallbackLayer.off();
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // 2. Update marker & center when coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (hasValidCoords) {
      const lat = latitude as number;
      const lng = longitude as number;

      if (!markerRef.current) {
        const marker = L.marker([lat, lng], {
          icon: customPinIcon,
          draggable: true,
          title: "Kéo thả hoặc click bản đồ để chọn tọa độ",
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationChange?.(pos.lat, pos.lng);
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }

      const radiusInMeters = Number(radius);
      if (Number.isFinite(radiusInMeters) && radiusInMeters > 0) {
        if (!radiusCircleRef.current) {
          radiusCircleRef.current = L.circle([lat, lng], {
            radius: radiusInMeters,
            color: "#00288e",
            weight: 2,
            opacity: 0.9,
            fillColor: "#3b82f6",
            fillOpacity: 0.16,
          }).addTo(map);
        } else {
          radiusCircleRef.current.setLatLng([lat, lng]);
          radiusCircleRef.current.setRadius(radiusInMeters);
        }
      } else if (radiusCircleRef.current) {
        map.removeLayer(radiusCircleRef.current);
        radiusCircleRef.current = null;
      }

      if (address) {
        markerRef.current.bindPopup(
          `<div style="font-family: inherit; font-size: 13px; min-width: 160px; line-height: 1.4;">
            <div style="font-weight: 700; color: #00288e; margin-bottom: 2px;">Vị trí chấm công</div>
            <div style="color: #374151; font-size: 12px;">${escapeHtml(address)}</div>
            <div style="color: #6b7280; font-size: 11px; margin-top: 4px;">Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
          </div>`
        );
      }

      // Smoothly pan to the new position
      map.invalidateSize({ pan: false });
      map.setView([lat, lng], Math.max(map.getZoom(), 15), {
        animate: true,
      });
    } else {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (radiusCircleRef.current) {
        map.removeLayer(radiusCircleRef.current);
        radiusCircleRef.current = null;
      }
    }
  }, [latitude, longitude, radius, hasValidCoords, address]);

  // Handler to center map on current marker
  const handleRecenter = () => {
    if (mapInstanceRef.current && hasValidCoords) {
      mapInstanceRef.current.setView(
        [latitude as number, longitude as number],
        Math.max(mapInstanceRef.current.getZoom(), 16),
        { animate: true }
      );
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {/* Map Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Bản đồ OpenStreetMap (Click hoặc kéo ghim để chọn vị trí)</span>
        </div>

        <div className="flex items-center gap-3">
          {hasValidCoords && (
            <>
              <button
                type="button"
                onClick={handleRecenter}
                title="Tập trung vào vị trí đã chọn"
                className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition"
              >
                <Navigation size={12} className="text-[#00288e]" />
                Tâm điểm
              </button>

              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Xem trên Google Maps trong tab mới"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#00288e] hover:underline"
              >
                <ExternalLink size={12} />
                Google Maps
              </a>
            </>
          )}
        </div>
      </div>

      {/* Leaflet Container */}
      <div
        ref={containerRef}
        className="h-72 w-full bg-gray-100 z-0"
        style={{ minHeight: "280px" }}
      />
    </div>
  );
}
