import { createApp } from "./app.mjs";
const { app, db } = createApp();
const server = app.listen(Number(process.env.API_PORT || 4000), "127.0.0.1", () =>
  console.log("AGAS API http://localhost:" + (process.env.API_PORT || 4000)),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
