---
read_when:
    - Estás desplegando OpenClaw en una VM en la nube con Docker
    - Necesitas el flujo compartido de compilación del binario, persistencia y actualización
summary: Pasos de tiempo de ejecución de VM Docker compartida para hosts de OpenClaw Gateway de larga duración
title: Entorno de ejecución de la VM de Docker
x-i18n:
    generated_at: "2026-05-02T05:29:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7489d42e01199a7b5e6f3b98dcfe624d1b3133ef1682dda764b2c8ddd1324e78
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Pasos de runtime compartidos para instalaciones de Docker basadas en VM, como GCP, Hetzner y proveedores de VPS similares.

## Incluye los binarios requeridos en la imagen

Instalar binarios dentro de un contenedor en ejecución es una trampa.
Todo lo que se instale en runtime se perderá al reiniciar.

Todos los binarios externos requeridos por Skills deben instalarse durante la compilación de la imagen.

Los ejemplos siguientes muestran solo tres binarios comunes:

- `gog` (de `gogcli`) para acceso a Gmail
- `goplaces` para Google Places
- `wacli` para WhatsApp

Estos son ejemplos, no una lista completa.
Puedes instalar tantos binarios como necesites usando el mismo patrón.

Si más adelante agregas nuevas Skills que dependen de binarios adicionales, debes:

1. Actualizar el Dockerfile
2. Reconstruir la imagen
3. Reiniciar los contenedores

**Dockerfile de ejemplo**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
Las URLs anteriores son ejemplos. Para VM basadas en ARM, elige los assets `arm64`. Para compilaciones reproducibles, fija URLs de releases versionadas.
</Note>

## Compilar y lanzar

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Si la compilación falla con `Killed` o `exit code 137` durante `pnpm install --frozen-lockfile`, la VM no tiene memoria suficiente.
Usa una clase de máquina más grande antes de volver a intentarlo.

Verifica los binarios:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Salida esperada:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Verifica el Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Salida esperada:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Qué persiste y dónde

OpenClaw se ejecuta en Docker, pero Docker no es la fuente de la verdad.
Todo el estado de larga duración debe sobrevivir a reinicios, reconstrucciones y reinicios del sistema.

| Componente          | Ubicación                                              | Mecanismo de persistencia      | Notas                                                         |
| ------------------- | ------------------------------------------------------ | ------------------------------ | ------------------------------------------------------------- |
| Configuración del Gateway | `/home/node/.openclaw/`                                | Montaje de volumen del host    | Incluye `openclaw.json`, `.env`                               |
| Perfiles de autenticación del modelo | `/home/node/.openclaw/agents/`                         | Montaje de volumen del host    | `agents/<agentId>/agent/auth-profiles.json` (OAuth, claves de API) |
| Configuraciones de Skills | `/home/node/.openclaw/skills/`                         | Montaje de volumen del host    | Estado a nivel de Skill                                       |
| Workspace del agente | `/home/node/.openclaw/workspace/`                      | Montaje de volumen del host    | Código y artefactos del agente                                |
| Sesión de WhatsApp  | `/home/node/.openclaw/`                                | Montaje de volumen del host    | Conserva el inicio de sesión por QR                           |
| Keyring de Gmail    | `/home/node/.openclaw/`                                | Volumen del host + contraseña  | Requiere `GOG_KEYRING_PASSWORD`                               |
| Paquetes de Plugin  | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Montaje de volumen del host    | Raíces de paquetes de Plugin descargables                     |
| Binarios externos   | `/usr/local/bin/`                                      | Imagen de Docker               | Deben incluirse durante la compilación                        |
| Runtime de Node     | Sistema de archivos del contenedor                     | Imagen de Docker               | Se reconstruye en cada compilación de imagen                  |
| Paquetes del SO     | Sistema de archivos del contenedor                     | Imagen de Docker               | No los instales en runtime                                    |
| Contenedor de Docker | Efímero                                               | Reiniciable                    | Seguro de destruir                                            |

## Actualizaciones

Para actualizar OpenClaw en la VM:

```bash
git pull
docker compose build
docker compose up -d
```

## Relacionado

- [Docker](/es/install/docker)
- [Podman](/es/install/podman)
- [ClawDock](/es/install/clawdock)
