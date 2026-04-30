---
read_when:
    - Configurar una máquina nueva
    - Quieres «lo último + lo mejor» sin romper tu configuración personal
summary: Configuración avanzada y flujos de trabajo de desarrollo para OpenClaw
title: Configuración
x-i18n:
    generated_at: "2026-04-30T06:02:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
Si estás configurando por primera vez, empieza con [Primeros pasos](/es/start/getting-started).
Para los detalles de incorporación, consulta [Incorporación (CLI)](/es/start/wizard).
</Note>

## Resumen rápido

Elige un flujo de configuración según la frecuencia con la que quieras actualizaciones y si quieres ejecutar el Gateway tú mismo:

- **La personalización vive fuera del repo:** mantén tu configuración y espacio de trabajo en `~/.openclaw/openclaw.json` y `~/.openclaw/workspace/` para que las actualizaciones del repo no los toquen.
- **Flujo estable (recomendado para la mayoría):** instala la app de macOS y deja que ejecute el Gateway incluido.
- **Flujo de desarrollo de última generación (dev):** ejecuta el Gateway tú mismo mediante `pnpm gateway:watch` y luego deja que la app de macOS se conecte en modo Local.

## Requisitos previos (desde el código fuente)

- Node 24 recomendado (Node 22 LTS, actualmente `22.14+`, sigue siendo compatible)
- Se prefiere `pnpm` (o Bun si usas intencionalmente el [flujo de Bun](/es/install/bun))
- Docker (opcional; solo para configuración/e2e en contenedores; consulta [Docker](/es/install/docker))

## Estrategia de personalización (para que las actualizaciones no causen problemas)

Si quieres algo “100 % adaptado a mí” _y_ actualizaciones sencillas, mantén tu personalización en:

- **Configuración:** `~/.openclaw/openclaw.json` (similar a JSON/JSON5)
- **Espacio de trabajo:** `~/.openclaw/workspace` (skills, prompts, memorias; conviértelo en un repo git privado)

Inicializa una vez:

```bash
openclaw setup
```

Desde dentro de este repo, usa la entrada local de la CLI:

```bash
openclaw setup
```

Si aún no tienes una instalación global, ejecútalo mediante `pnpm openclaw setup` (o `bun run openclaw setup` si estás usando el flujo de Bun).

## Ejecutar el Gateway desde este repo

Después de `pnpm build`, puedes ejecutar directamente la CLI empaquetada:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flujo estable (primero la app de macOS)

1. Instala e inicia **OpenClaw.app** (barra de menús).
2. Completa la lista de incorporación/permisos (avisos de TCC).
3. Asegúrate de que el Gateway esté en modo **Local** y en ejecución (la app lo gestiona).
4. Vincula superficies (ejemplo: WhatsApp):

```bash
openclaw channels login
```

5. Comprobación básica:

```bash
openclaw health
```

Si la incorporación no está disponible en tu build:

- Ejecuta `openclaw setup`, luego `openclaw channels login` y después inicia el Gateway manualmente (`openclaw gateway`).

## Flujo de desarrollo de última generación (Gateway en una terminal)

Objetivo: trabajar en el Gateway de TypeScript, obtener recarga en caliente y mantener conectada la interfaz de usuario de la app de macOS.

### 0) (Opcional) Ejecutar también la app de macOS desde el código fuente

Si también quieres la app de macOS en la versión de desarrollo más reciente:

```bash
./scripts/restart-mac.sh
```

### 1) Iniciar el Gateway de desarrollo

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` inicia o reinicia el proceso de observación del Gateway en una
sesión tmux con nombre y se adjunta automáticamente desde terminales interactivas.
Los shells no interactivos permanecen separados e imprimen `tmux attach -t openclaw-gateway-watch-main`;
usa `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` para mantener separada
una ejecución interactiva, o `pnpm gateway:watch:raw` para el modo de observación
en primer plano. El observador recarga ante cambios relevantes en el código fuente,
la configuración y los metadatos de plugins incluidos.
`pnpm openclaw setup` es el paso único de inicialización de configuración/espacio de trabajo local para un checkout nuevo.
`pnpm gateway:watch` no recompila `dist/control-ui`, así que vuelve a ejecutar `pnpm ui:build` después de cambios en `ui/` o usa `pnpm ui:dev` mientras desarrollas la interfaz de usuario de Control UI.

Si estás usando intencionalmente el flujo de Bun, los comandos equivalentes son:

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) Apuntar la app de macOS a tu Gateway en ejecución

En **OpenClaw.app**:

- Modo de conexión: **Local**
  La app se conectará al Gateway en ejecución en el puerto configurado.

### 3) Verificar

- El estado del Gateway en la app debería mostrar **“Usando gateway existente …”**
- O mediante la CLI:

```bash
openclaw health
```

### Problemas comunes

- **Puerto incorrecto:** el WS del Gateway usa de forma predeterminada `ws://127.0.0.1:18789`; mantén la app y la CLI en el mismo puerto.
- **Dónde vive el estado:**
  - Estado de canal/proveedor: `~/.openclaw/credentials/`
  - Perfiles de autenticación de modelo: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesiones: `~/.openclaw/agents/<agentId>/sessions/`
  - Registros: `/tmp/openclaw/`

## Mapa de almacenamiento de credenciales

Usa esto al depurar autenticación o decidir qué respaldar:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot de Telegram**: configuración/env o `channels.telegram.tokenFile` (solo archivo normal; se rechazan symlinks)
- **Token de bot de Discord**: configuración/env o SecretRef (proveedores env/file/exec)
- **Tokens de Slack**: configuración/env (`channels.slack.*`)
- **Listas de permitidos de emparejamiento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas)
- **Perfiles de autenticación de modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Carga útil de secretos respaldada por archivo (opcional)**: `~/.openclaw/secrets.json`
- **Importación OAuth heredada**: `~/.openclaw/credentials/oauth.json`
  Más detalles: [Seguridad](/es/gateway/security#credential-storage-map).

## Actualizar (sin estropear tu configuración)

- Mantén `~/.openclaw/workspace` y `~/.openclaw/` como “lo tuyo”; no pongas prompts/configuración personal en el repo `openclaw`.
- Actualizar el código fuente: `git pull` + el paso de instalación del gestor de paquetes que hayas elegido (`pnpm install` por defecto; `bun install` para el flujo de Bun) + seguir usando el comando `gateway:watch` correspondiente.

## Linux (servicio de usuario de systemd)

Las instalaciones de Linux usan un servicio de **usuario** de systemd. Por defecto, systemd detiene los
servicios de usuario al cerrar sesión o quedar inactivo, lo que mata el Gateway. La incorporación intenta habilitar
lingering por ti (puede pedir sudo). Si sigue desactivado, ejecuta:

```bash
sudo loginctl enable-linger $USER
```

Para servidores siempre activos o multiusuario, considera un servicio de **sistema** en lugar de un
servicio de usuario (no se necesita lingering). Consulta el [runbook del Gateway](/es/gateway) para las notas de systemd.

## Documentos relacionados

- [Runbook del Gateway](/es/gateway) (flags, supervisión, puertos)
- [Configuración del Gateway](/es/gateway/configuration) (esquema de configuración + ejemplos)
- [Discord](/es/channels/discord) y [Telegram](/es/channels/telegram) (etiquetas de respuesta + configuración de replyToMode)
- [Configuración del asistente de OpenClaw](/es/start/openclaw)
- [App de macOS](/es/platforms/macos) (ciclo de vida del gateway)
