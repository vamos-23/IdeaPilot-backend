import createApp from "./app";

const server = createApp();
const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port:${PORT}, env:[${process.env.NODE_ENV}]`);
});
