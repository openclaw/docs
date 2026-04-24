---
read_when:
    - Estás implementando OpenClaw en una VM en la nube con Docker
    - Necesitas el flujo compartido de horneado de binarios, persistencia y actualización
summary: Pasos compartidos del entorno de ejecución Docker VM para hosts de Gateway de OpenClaw de larga duración
title: Entorno de ejecución Docker VM
x-i18n:
    generated_at: "2026-04-24T05:34:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54e99e6186a3c13783922e4d1e4a55e9872514be23fa77ca869562dcd436ad2b
    source_path: install/docker-vm-runtime.md
    workflow: 15
---

Pasos compartidos del entorno de ejecución para instalaciones de Docker en VM como GCP, Hetzner y proveedores VPS similares.

## Incluir los binarios necesarios en la imagen

Instalar binarios dentro de un contenedor en ejecución es una trampa.
Todo lo que se instale en tiempo de ejecución se perderá al reiniciar.

Todos los binarios externos requeridos por Skills deben instalarse en tiempo de compilación de la imagen.

Los ejemplos siguientes muestran solo tres binarios comunes:

- `gog` para acceso a Gmail
- `goplaces` para Google Places
- `wacli` para WhatsApp

Son ejemplos, no una lista completa.
Puedes instalar tantos binarios como necesites usando el mismo patrón.

Si más adelante añades nuevas Skills que dependan de binarios adicionales, debes:

1. Actualizar el Dockerfile
2. Reconstruir la imagen
3. Reiniciar los contenedores

**Ejemplo de Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

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
Las URL de descarga anteriores son para x86_64 (amd64). Para VM basadas en ARM (por ejemplo, Hetzner ARM, GCP Tau T2A), sustituye las URL de descarga por las variantes ARM64 adecuadas desde la página de versiones de cada herramienta.
</Note>

## Compilar e iniciar

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Si la compilación falla con `Killed` o `exit code 137` durante `pnpm install --frozen-lockfile`, la VM se ha quedado sin memoria.
Usa una clase de máquina más grande antes de volver a intentarlo.

Verificar binarios:

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

Verificar Gateway:

```bash
docker compose logs -f openclaw-gateway
```

Salida esperada:

```
[gateway] listening on ws://0.0.0.0:18789
```

## Qué persiste y dónde

OpenClaw se ejecuta en Docker, pero Docker no es la fuente de verdad.
Todo el estado de larga duración debe sobrevivir a reinicios, reconstrucciones y reinicios del sistema.

| Component           | Location                          | Persistence mechanism  | Notes                                                         |
| ------------------- | --------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Configuración de Gateway | `/home/node/.openclaw/`           | Montaje de volumen del host | Incluye `openclaw.json`, `.env`                              |
| Perfiles de autenticación de modelos | `/home/node/.openclaw/agents/`    | Montaje de volumen del host | `agents/<agentId>/agent/auth-profiles.json` (OAuth, claves de API) |
| Configuraciones de Skills | `/home/node/.openclaw/skills/`    | Montaje de volumen del host | Estado a nivel de Skill                                       |
| Espacio de trabajo del agente | `/home/node/.openclaw/workspace/` | Montaje de volumen del host | Código y artefactos del agente                                |
| Sesión de WhatsApp  | `/home/node/.openclaw/`           | Montaje de volumen del host | Conserva el inicio de sesión por QR                           |
| Keyring de Gmail    | `/home/node/.openclaw/`           | Volumen del host + contraseña | Requiere `GOG_KEYRING_PASSWORD`                               |
| Binarios externos   | `/usr/local/bin/`                 | Imagen de Docker       | Deben incluirse en tiempo de compilación                      |
| Entorno de ejecución Node | Container filesystem              | Imagen de Docker       | Se reconstruye en cada compilación de imagen                  |
| Paquetes del SO     | Container filesystem              | Imagen de Docker       | No instalar en tiempo de ejecución                            |
| Contenedor de Docker | Efímero                         | Reiniciable            | Seguro de destruir                                            |

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
