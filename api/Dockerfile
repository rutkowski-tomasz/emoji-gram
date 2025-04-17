ARG PROJECT_NAME=SignalR.Api

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443
RUN apt-get update && apt-get install -y curl

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG PROJECT_NAME
WORKDIR /build
COPY ["*/*.csproj", "./"]
RUN for file in $(ls *.csproj); do mkdir -p ${file%.*}/ && mv $file ${file%.*}/; done
RUN dotnet restore "${PROJECT_NAME}/${PROJECT_NAME}.csproj"
COPY . .
RUN dotnet build "${PROJECT_NAME}/${PROJECT_NAME}.csproj" -c Release -o /app/build

FROM build AS publish
ARG PROJECT_NAME
RUN dotnet publish "${PROJECT_NAME}/${PROJECT_NAME}.csproj" -c Release -o /app/publish

FROM base AS final
ARG PROJECT_NAME
ENV PROJECT_DLL=${PROJECT_NAME}.dll
ENV ASPNETCORE_URLS=http://+:80
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["sh", "-c", "dotnet $PROJECT_DLL"]