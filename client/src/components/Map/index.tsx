"use client";

import { GoogleMap } from "@react-google-maps/api";
import { useMemo, useCallback, useRef, memo, useState } from "react";
import { useGoogleMaps } from "@/app/providers/GoogleMapsProvider";
import { mapStyle as defaultMapStyle } from "./styles";
import { MapStyleDebugPanel } from "./MapStyleDebugPanel";

interface MapProps {
  defaultCenter?: { lat: number; lng: number } | null;
  defaultZoom?: number;
  children?: React.ReactNode;
  onIdle?: (map: google.maps.Map) => void;
}

function MapBase({
  defaultCenter,
  defaultZoom = 10,
  children,
  onIdle,
}: MapProps) {
  const { isLoaded } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map>(null);
  const [mapStyle, setMapStyle] = useState(defaultMapStyle);

  const center = useMemo(
    () => defaultCenter ?? ({ lat: 37.5665, lng: 126.978 } as const),
    [defaultCenter],
  );

  const onMapLoad = useCallback((m: google.maps.Map) => {
    mapRef.current = m;
  }, []);

  const handleIdle = useCallback(() => {
    if (!mapRef.current) return;
    onIdle?.(mapRef.current);
  }, [onIdle]);

  const handleStyleChange = useCallback(
    (newStyles: google.maps.MapTypeStyle[]) => {
      setMapStyle(newStyles);
      // 맵이 이미 로드된 경우 즉시 스타일 업데이트
      if (mapRef.current) {
        mapRef.current.setOptions({ styles: newStyles });
      }
    },
    [],
  );

  if (!isLoaded) {
    return (
      <div
        style={{
          width: "100%",
          height: `calc(100dvh)`,
          display: "grid",
          placeItems: "center",
        }}
      >
        로딩중...
      </div>
    );
  }

  return (
    <>
      <GoogleMap
        onLoad={onMapLoad}
        onIdle={handleIdle}
        mapContainerStyle={{ width: "100%", height: "100dvh" }}
        center={center}
        zoom={defaultZoom}
        options={{
          gestureHandling: "greedy",
          disableDefaultUI: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: false,
          clickableIcons: false,
          keyboardShortcuts: false,
          scaleControl: false,
          styles: mapStyle,
        }}
      >
        {children}
      </GoogleMap>

      {/* 개발 모드에서만 표시됨 */}
      <MapStyleDebugPanel
        initialStyles={defaultMapStyle}
        onStyleChange={handleStyleChange}
      />
    </>
  );
}

export const Map = memo(MapBase);
