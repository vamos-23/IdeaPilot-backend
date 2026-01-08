import axios from "axios";
type PushTokenTypes = {
  token: string;
  title: string;
  body: string;
};
export default async function sendPushToken(input: PushTokenTypes) {
  const { token, title, body } = input;
  await axios.post(
    "https://exp.host/--/api/v2/push/send",
    {
      to: token,
      sound: "default",
      title,
      body,
    },
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
