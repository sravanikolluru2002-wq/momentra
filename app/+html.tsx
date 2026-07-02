import { ScrollViewStyleReset } from "expo-router/html";
import type { ReactNode } from "react";

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
        <meta
          content="width=device-width, initial-scale=1, viewport-fit=cover"
          name="viewport"
        />
        <meta content="#0D0905" name="theme-color" />
        <meta content="#0D0905" name="background-color" />
        <meta content="Momentra" name="apple-mobile-web-app-title" />
        <meta content="yes" name="apple-mobile-web-app-capable" />
        <meta content="black-translucent" name="apple-mobile-web-app-status-bar-style" />
        <link href="/manifest.json" rel="manifest" />
        <link href="/pwa-icon.png" rel="apple-touch-icon" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                min-height: 100%;
                width: 100%;
                margin: 0;
                background: #050302;
                overflow-x: hidden;
              }
              body {
                overflow: hidden;
                overscroll-behavior-y: none;
              }
              * {
                box-sizing: border-box;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
