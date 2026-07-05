---
read_when:
    - Estás implementando OpenClaw en una VM en la nube con Docker
    - Necesitas el bake binario compartido, la persistencia y el flujo de actualización
summary: Pasos compartidos del entorno de ejecución de la máquina virtual Docker para hosts de Gateway de OpenClaw de larga duración
title: Tiempo de ejecución de VM de Docker
x-i18n:
    generated_at: "2026-07-05T11:23:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Pasos de runtime compartidos para instalaciones de Docker basadas en máquinas virtuales, como GCP, Hetzner y proveedores VPS similares.

## Incorpora los binarios requeridos en la imagen

Instalar binarios dentro de un contenedor en ejecución es una trampa: cualquier cosa instalada
en runtime se pierde al reiniciar. Incorpora en la imagen, durante la compilación,
todos los binarios externos que necesite una Skill.

Los ejemplos siguientes cubren solo tres binarios, en orden alfabético:

- `gog` (de `gogcli`) para acceso a Gmail
- `goplaces` para Google Places
- `wacli` para WhatsApp

Son ejemplos, no una lista completa. Instala tantos binarios como necesiten tus
Skills usando el mismo patrón. Cuando más adelante agregues una Skill que necesite
un binario nuevo:

1. Actualiza el Dockerfile.
2. Reconstruye la imagen.
3. Reinicia los contenedores.

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
Las URL anteriores son ejemplos. Para máquinas virtuales basadas en ARM, elige los recursos `arm64`. Para compilaciones reproducibles, fija URL de lanzamientos versionados.
</Note>

## Compilar y lanzar

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Si la compilación falla con `Killed` o el código de salida 137 durante `pnpm install --frozen-lockfile`, la máquina virtual no tiene memoria suficiente. Usa una clase de máquina más grande antes de reintentarlo.

Verifica los binarios:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

Salida esperada:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Verifica que el Gateway esté activo:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

Que `/healthz` devuelva una respuesta 200 confirma que el proceso del Gateway está escuchando y en buen estado; el `HEALTHCHECK` integrado de la imagen consulta el mismo endpoint.

## Qué persiste y dónde

OpenClaw se ejecuta en Docker, pero Docker no es la fuente de verdad. Todo el estado de larga duración debe sobrevivir a reinicios, reconstrucciones y reinicios del sistema.

| Componente             | Ubicación                                              | Mecanismo de persistencia | Notas                                                                                                                       |
| ---------------------- | ------------------------------------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Configuración Gateway  | `/home/node/.openclaw/`                                | Montaje de volumen host   | Incluye `openclaw.json`                                                                                                     |
| Creds canal/proveedor  | `/home/node/.openclaw/credentials/`                    | Montaje de volumen host   | Material de credenciales de canal y proveedor                                                                               |
| Perfiles auth modelo   | `/home/node/.openclaw/agents/`                         | Montaje de volumen host   | `agents/<agentId>/agent/auth-profiles.json` (OAuth, claves API)                                                             |
| Archivo clave OAuth heredado | `/home/node/.config/openclaw/`                    | Montaje de volumen host   | Compat de solo lectura para sidecars OAuth previos a la migración; `openclaw doctor --fix` los migra a `auth-profiles.json` |
| Configuraciones de Skills | `/home/node/.openclaw/skills/`                      | Montaje de volumen host   | Estado a nivel de Skill                                                                                                     |
| Workspace del agente   | `/home/node/.openclaw/workspace/`                      | Montaje de volumen host   | Código y artefactos del agente                                                                                              |
| Sesión de WhatsApp     | `/home/node/.openclaw/`                                | Montaje de volumen host   | Conserva el inicio de sesión por QR                                                                                         |
| Keyring de Gmail       | `/home/node/.openclaw/`                                | Volumen host + contraseña | Requiere `GOG_KEYRING_PASSWORD`                                                                                             |
| Paquetes Plugin        | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Montaje de volumen host   | Raíces de paquetes Plugin descargables                                                                                      |
| Binarios externos      | `/usr/local/bin/`                                      | Imagen Docker             | Deben incorporarse durante la compilación                                                                                   |
| Runtime de Node        | Sistema de archivos del contenedor                     | Imagen Docker             | Se reconstruye en cada compilación de imagen                                                                                |
| Paquetes del SO        | Sistema de archivos del contenedor                     | Imagen Docker             | No los instales en runtime                                                                                                  |
| Contenedor Docker      | Efímero                                                | Reiniciable               | Seguro de destruir                                                                                                          |

## Actualizaciones

Para actualizar OpenClaw en la máquina virtual:

```bash
git pull
docker compose build
docker compose up -d
```

## Relacionado

- [Docker](/es/install/docker)
- [Podman](/es/install/podman)
- [ClawDock](/es/install/clawdock)
