import arcjet, { tokenBucket, shield } from "@arcjet/node";
import { ENV } from "./env.js";

export const aj = ENV.ARCJET_KEY
  ? arcjet({
      key: ENV.ARCJET_KEY,
      characteristics: ["ip.src"],
      rules: [
        // shield protects your app from common attacks e.g SQL injection, xss, CSRF attacks
        shield({ mode: "LIVE" }),

        // rate limiting with token bucket algorithm
        tokenBucket({
          mode: "LIVE",
          refillRate: 10, // token added per interval
          interval: 10, // interval in seconds (10 seconds)
          capacity: 15, // maximum tokens in bucket
        }),
      ],
    })
  : null;
