# Imagen de compilacion (.NET 8 SDK)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar definicion de proyecto y restaurar dependencias
COPY Restaurante.csproj ./
RUN dotnet restore Restaurante.csproj

# Copiar el codigo fuente restante
COPY . ./

# Publicar la aplicacion en modo Release
RUN dotnet publish Restaurante.csproj -c Release -o /app/publish /p:UseAppHost=false

# Imagen final de ejecucion (ASP.NET Core 8.0 Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_HTTP_PORTS=8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Copiar los artefactos publicados desde la fase de build
COPY --from=build /app/publish .

# Exponer el puerto interno
EXPOSE 8080

# Iniciar la API
ENTRYPOINT ["dotnet", "Restaurante.dll"]
