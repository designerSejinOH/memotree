import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: [],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lwakxoykfwlzvtfqnjyc.supabase.co",
        port: "",
        pathname: "/storage/v1/object/sign/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // ✅ Turbopack 설정: webpack rules → turbopack.rules 로 이관
  turbopack: {
    rules: {
      // SVG를 React Component로 import 하기 위한 SVGR
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            // options는 “plain JS primitives/objects”만 허용되는 쪽이라
            // 함수/require() 결과 같은 건 넣지 않는 게 안전합니다.
            options: {
              // 필요하면 설정 추가
              // icon: true,
            },
          },
        ],
        as: "*.js",
      },
    },
  },

  /**
   * ❗️오디오(ogg/mp3/wav) webpack 로더(url-loader/file-loader) 이관은 비추천:
   * Turbopack loader 실행은 emitFile()이 지원되지 않아 file-loader 계열이 깨질 수 있습니다.
   * → /public 로 옮기고 URL로 참조하세요.
   */
};

export default withPWA(withBundleAnalyzer(nextConfig));
