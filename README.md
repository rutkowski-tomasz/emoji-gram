# EmojiGram: Real-time Emoji Messaging

Portfolio project for learning SignalR and Keycloak.

Express yourself in real-time with only emojis! EmojiGram is a platform for instant communication, offering both public and private emoji-only messaging, secured with robust authentication and designed for scalability.

![Screenshot of EmojiGram](https://github.com/rutkowski-tomasz/emoji-gram/blob/main/screenshot.png?raw=true)

## ⚙️ Key Mechanisms Demonstrated

* **↔️ Real-time Two-Way Communication:** Leverages ASP.NET Core SignalR for immediate bidirectional exchange of emojis over WebSockets.
* **📢 General and Targeted Messaging:** Enables broadcasting to everyone and sending private messages to specific users.
* **🛡️ WebSocket Authorization:** Ensures secure connections using JWT tokens obtained from Keycloak for authorized connections.
* **📈 Scalability:** Architected with horizontal scaling in mind, utilizing a Redis backplane for SignalR to handle increased traffic.
* **🐳 Containerization:** Simplifies setup and deployment through full containerization with Docker and Docker Compose for all components and dependencies.
* **📨 Requests**: Includes a set of requests for the API, demonstrating the functionality of the platform.

## 💻 Development

**Note:** The API requires the Keycloak, PostgreSQL, and Redis dependencies to be running before it can start. See the "Dependencies" section below.

```sh
# Api
cd api/SignalR.Api
dotnet run
# App
cd app/signalr-app
npm install
npm run dev
```

## 📤 Dependecies

```sh
docker-compose -f compose.yml up keycloak postgres-keycloak postgres-api redis -d # Start only dependencies
docker-compose -f compose.yml up --build -d # Start all dependencies + app + api
```

## 🔄 Migrations

```sh
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## 🧑🏻‍🚀 Testing

**Note**: There is a termination character with ASCII code `0X1E` at the end of each WS message.

🤝 Handshake
```json
{"protocol":"json","version":1}
```

💬 SendMessage
```json
{"arguments":["message from user 2"],"invocationId":"0","target":"SendMessage","type":1}
```

🤫 Whisper
```json
{"arguments":["test@example.com","whisper to user 1"],"invocationId":"0","target":"SendWhisper","type":1}
```

