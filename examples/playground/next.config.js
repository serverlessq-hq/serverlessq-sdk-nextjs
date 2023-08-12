const { withServerlessQ } = require('@serverlessq/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.node$/,
      loader: "node-loader",
    });

    return config
  },
};



module.exports = withServerlessQ(nextConfig);
