"use client";

import { createContext, useContext, PropsWithChildren } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

type Ctx = { isLoaded: boolean };
const GoogleMapsCtx = createContext<Ctx>({ isLoaded: false });

export function useGoogleMaps() {
  return useContext(GoogleMapsCtx);
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = [
  "places",
];
// places 라이브러리는 주소 자동완성, 장소 검색 등에 필요
// drawing 라이브러리는 지도 위에 도형 그리기 등에 필요
// geometry 라이브러리는 거리 계산 등에 필요
// visualization 라이브러리는 히트맵 등에 필요

export default function GoogleMapsProvider({ children }: PropsWithChildren) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script", // 고정된 id 필수
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
    language: "ko",
  });

  return (
    <GoogleMapsCtx.Provider value={{ isLoaded }}>
      {children}
    </GoogleMapsCtx.Provider>
  );
}
