# 😜 EmojiGram: Real-time Emoji Messaging

Express yourself in real-time with only emojis! EmojiGram is a platform for instant communication, offering both public and private emoji-only messaging, secured with robust authentication and designed for scalability.

## ⚙️ Key Mechanisms Demonstrated

* **↔️ Real-time Two-Way Communication:** Leverages ASP.NET Core SignalR for immediate bidirectional exchange of emojis over WebSockets.
* **📢 General and Targeted Messaging:** Enables broadcasting to everyone and sending private messages to specific users.
* **🛡️ WebSocket Authorization:** Ensures secure connections using JWT tokens obtained from Keycloak for authorized connections.
* **📈 Scalability:** Architected with horizontal scaling in mind, utilizing a Redis backplane for SignalR to handle increased traffic.
* **🐳 Containerization:** Simplifies setup and deployment through full containerization with Docker and Docker Compose for all components and dependencies.

## 💻 Development

**Note:** The API requires the Keycloak, PostgreSQL, and Redis dependencies to be running before it can start. See the "Dependencies" section below.

```sh
# Api
cd api/SignalR.Api
dotnet run
# App
cd app/signalr-app
npm install
npm start
```

## Dependecies

```sh
docker-compose -f compose.yml up keycloak postgres redis -d # Start only dependencies
docker-compose -f compose.yml up --build -d # Start all dependencies + app + api
```
