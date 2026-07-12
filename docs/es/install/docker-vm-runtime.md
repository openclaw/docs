---
read_when:
    - Estás implementando OpenClaw en una máquina virtual en la nube con Docker
    - Necesitas el flujo compartido de creación del binario, persistencia y actualización
summary: Pasos del entorno de ejecución de una máquina virtual Docker compartida para hosts del Gateway de OpenClaw de larga duración
title: Entorno de ejecución de máquina virtual Docker
x-i18n:
    generated_at: "2026-07-11T23:10:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

Pasos de ejecución compartidos para instalaciones de Docker basadas en máquinas virtuales, como GCP, Hetzner y proveedores de VPS similares.

## Incluir los binarios necesarios en la imagen

Instalar binarios dentro de un contenedor en ejecución es una trampa: todo lo instalado
durante la ejecución se pierde al reiniciar. Incluye en la imagen, durante la compilación,
todos los binarios externos que necesite una skill.

Los siguientes ejemplos abarcan únicamente tres binarios, en orden alfabético:

- `gog` (de `gogcli`) para acceder a Gmail
- `goplaces` para Google Places
- `wacli` para WhatsApp

Son ejemplos, no una lista completa. Instala tantos binarios como necesiten tus
skills siguiendo el mismo patrón. Cuando posteriormente añadas una skill que necesite
un binario nuevo:

1. Actualiza el Dockerfile.
2. Vuelve a compilar la imagen.
3. Reinicia los contenedores.

**Dockerfile de ejemplo**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Binario de ejemplo 1: CLI de Gmail (gogcli; se instala como `gog`)
# Copia la URL actual del recurso para Linux desde https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Binario de ejemplo 2: CLI de Google Places
# Copia la URL actual del recurso para Linux desde https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Binario de ejemplo 3: CLI de WhatsApp
# Copia la URL actual del recurso para Linux desde https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Añade más binarios a continuación siguiendo el mismo patrón

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
Las URL anteriores son ejemplos. Para máquinas virtuales basadas en ARM, elige los recursos `arm64`. Para obtener compilaciones reproducibles, fija las URL de versiones específicas.
</Note>

## Compilar e iniciar

```bash
docker compose build
docker compose up -d openclaw-gateway
```

Si la compilación falla con `Killed` o con el código de salida 137 durante `pnpm install --frozen-lockfile`, la máquina virtual se ha quedado sin memoria. Utiliza una clase de máquina más grande antes de volver a intentarlo.

Comprueba los binarios:

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

Comprueba que el Gateway esté en funcionamiento:

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

Que `/healthz` devuelva una respuesta 200 confirma que el proceso del Gateway está escuchando y funciona correctamente; la instrucción `HEALTHCHECK` integrada en la imagen consulta el mismo endpoint.

## Qué se conserva y dónde

OpenClaw se ejecuta en Docker, pero Docker no es la fuente de verdad. Todo el estado de larga duración debe sobrevivir a reinicios, recompilaciones y reinicios del sistema.

| Componente                     | Ubicación                                              | Mecanismo de persistencia      | Notas                                                                                                                         |
| ------------------------------ | ------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Configuración del Gateway      | `/home/node/.openclaw/`                                | Montaje de volumen del host    | Incluye `openclaw.json`                                                                                                       |
| Credenciales de canal/proveedor | `/home/node/.openclaw/credentials/`                   | Montaje de volumen del host    | Material de credenciales de canales y proveedores                                                                             |
| Perfiles de autenticación del modelo | `/home/node/.openclaw/agents/`                    | Montaje de volumen del host    | `agents/<agentId>/agent/auth-profiles.json` (OAuth, claves de API)                                                            |
| Archivo heredado de claves OAuth | `/home/node/.config/openclaw/`                       | Montaje de volumen del host    | Compatibilidad de solo lectura con archivos auxiliares OAuth anteriores a la migración; `openclaw doctor --fix` los migra a `auth-profiles.json` |
| Configuraciones de skills      | `/home/node/.openclaw/skills/`                         | Montaje de volumen del host    | Estado de cada skill                                                                                                          |
| Espacio de trabajo del agente  | `/home/node/.openclaw/workspace/`                      | Montaje de volumen del host    | Código y artefactos del agente                                                                                                |
| Sesión de WhatsApp             | `/home/node/.openclaw/`                                | Montaje de volumen del host    | Conserva el inicio de sesión mediante QR                                                                                      |
| Llavero de Gmail               | `/home/node/.openclaw/`                                | Volumen del host + contraseña  | Requiere `GOG_KEYRING_PASSWORD`                                                                                               |
| Paquetes de Plugins            | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | Montaje de volumen del host    | Raíces descargables de paquetes de Plugins                                                                                    |
| Binarios externos              | `/usr/local/bin/`                                      | Imagen de Docker               | Deben incluirse durante la compilación                                                                                        |
| Entorno de ejecución de Node   | Sistema de archivos del contenedor                     | Imagen de Docker               | Se reconstruye con cada compilación de la imagen                                                                              |
| Paquetes del sistema operativo | Sistema de archivos del contenedor                     | Imagen de Docker               | No los instales durante la ejecución                                                                                          |
| Contenedor de Docker           | Efímero                                                | Reiniciable                    | Se puede destruir de forma segura                                                                                             |

## Actualizaciones

Para actualizar OpenClaw en la máquina virtual:

```bash
git pull
docker compose build
docker compose up -d
```

## Contenido relacionado

- [Docker](/es/install/docker)
- [Podman](/es/install/podman)
- [ClawDock](/es/install/clawdock)
