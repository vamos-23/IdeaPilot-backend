import "dotenv/config";
import createApp from "./app";

const server = createApp();
const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
