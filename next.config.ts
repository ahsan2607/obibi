import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production", // Add this line
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSerwist(nextConfig);
