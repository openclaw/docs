---
read_when:
    - Configurar una máquina nueva
    - Quieres “lo último + lo mejor” sin romper tu configuración personal
summary: Configuración avanzada y flujos de trabajo de desarrollo para OpenClaw
title: Configuración
x-i18n:
    generated_at: "2026-05-03T21:38:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d12f319ab4c60be7ff6538ffd28626f425f7df1a10bbe08cceb59eef3662c75
    source_path: start/setup.md
    workflow: 16
---

<Note>
Si estás configurando por primera vez, empieza con [Primeros pasos](/es/start/getting-started).
Para ver detalles de incorporación, consulta [Incorporación (CLI)](/es/start/wizard).
</Note>

## Resumen

Elige un flujo de configuración según la frecuencia con la que quieras actualizaciones y si quieres ejecutar el Gateway por tu cuenta:

- **La personalización vive fuera del repositorio:** mantén tu configuración y espacio de trabajo en `~/.openclaw/openclaw.json` y `~/.openclaw/workspace/` para que las actualizaciones del repositorio no los toquen.
- **Flujo estable (recomendado para la mayoría):** instala la app de macOS y deja que ejecute el Gateway incluido.
- **Flujo de vanguardia (desarrollo):** ejecuta el Gateway por tu cuenta mediante `pnpm gateway:watch` y luego deja que la app de macOS se conecte en modo Local.

## Requisitos previos (desde el código fuente)

- Node 24 recomendado (Node 22 LTS, actualmente `22.14+`, sigue siendo compatible)
- `pnpm` es obligatorio para checkouts desde el código fuente. OpenClaw carga los plugins incluidos desde los paquetes del espacio de trabajo pnpm
  `extensions/*` en modo de desarrollo, por lo que `npm install` en la raíz
  no prepara todo el árbol de código fuente.
- Docker (opcional; solo para configuración/e2e en contenedores; consulta [Docker](/es/install/docker))

## Estrategia de personalización (para que las actualizaciones no causen problemas)

Si quieres “100% adaptado a mí” _y_ actualizaciones sencillas, mantén tu personalización en:

- **Configuración:** `~/.openclaw/openclaw.json` (similar a JSON/JSON5)
- **Espacio de trabajo:** `~/.openclaw/workspace` (skills, prompts, memorias; conviértelo en un repositorio git privado)

Inicializa una vez:

```bash
openclaw setup
```

Desde dentro de este repositorio, usa la entrada local de la CLI:

```bash
openclaw setup
```

Si aún no tienes una instalación global, ejecútalo mediante `pnpm openclaw setup`.

## Ejecutar el Gateway desde este repositorio

Después de `pnpm build`, puedes ejecutar la CLI empaquetada directamente:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flujo estable (primero la app de macOS)

1. Instala e inicia **OpenClaw.app** (barra de menús).
2. Completa la lista de comprobación de incorporación/permisos (solicitudes TCC).
3. Asegúrate de que el Gateway esté en **Local** y en ejecución (la app lo gestiona).
4. Vincula superficies (ejemplo: WhatsApp):

```bash
openclaw channels login
```

5. Comprobación básica:

```bash
openclaw health
```

Si la incorporación no está disponible en tu compilación:

- Ejecuta `openclaw setup`, luego `openclaw channels login` y después inicia el Gateway manualmente (`openclaw gateway`).

## Flujo de vanguardia (Gateway en una terminal)

Objetivo: trabajar en el Gateway de TypeScript, obtener recarga en caliente y mantener conectada la UI de la app de macOS.

### 0) (Opcional) Ejecutar también la app de macOS desde el código fuente

Si también quieres la app de macOS en la versión de vanguardia:

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
sesión tmux con nombre y se adjunta automáticamente desde terminales interactivas. Los shells no interactivos permanecen
desadjuntados e imprimen `tmux attach -t openclaw-gateway-watch-main`; usa
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` para mantener una ejecución interactiva
desadjuntada, o `pnpm gateway:watch:raw` para el modo de observación en primer plano. El observador
recarga ante cambios relevantes en el código fuente, la configuración y los metadatos de plugins incluidos. Si el
Gateway observado sale durante el arranque, `gateway:watch` ejecuta
`openclaw doctor --fix --non-interactive` una vez y vuelve a intentarlo; define
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para desactivar esa pasada de reparación solo para desarrollo.
`pnpm openclaw setup` es el paso único de inicialización local de configuración/espacio de trabajo para un checkout nuevo.
`pnpm gateway:watch` no recompila `dist/control-ui`, así que vuelve a ejecutar `pnpm ui:build` después de cambios en `ui/` o usa `pnpm ui:dev` mientras desarrollas la UI de control.

### 2) Apuntar la app de macOS a tu Gateway en ejecución

En **OpenClaw.app**:

- Modo de conexión: **Local**
  La app se conectará al gateway en ejecución en el puerto configurado.

### 3) Verificar

- El estado del Gateway dentro de la app debería indicar **“Usando gateway existente …”**
- O mediante la CLI:

```bash
openclaw health
```

### Problemas comunes

- **Puerto incorrecto:** el WS del Gateway usa por defecto `ws://127.0.0.1:18789`; mantén la app y la CLI en el mismo puerto.
- **Dónde vive el estado:**
  - Estado de canal/proveedor: `~/.openclaw/credentials/`
  - Perfiles de autenticación de modelo: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesiones: `~/.openclaw/agents/<agentId>/sessions/`
  - Registros: `/tmp/openclaw/`

## Mapa de almacenamiento de credenciales

Usa esto al depurar autenticación o decidir qué respaldar:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot de Telegram**: configuración/env o `channels.telegram.tokenFile` (solo archivo normal; los symlinks se rechazan)
- **Token de bot de Discord**: configuración/env o SecretRef (proveedores env/file/exec)
- **Tokens de Slack**: configuración/env (`channels.slack.*`)
- **Listas de permitidos de emparejamiento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas)
- **Perfiles de autenticación de modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Carga de secretos respaldada por archivo (opcional)**: `~/.openclaw/secrets.json`
- **Importación OAuth heredada**: `~/.openclaw/credentials/oauth.json`
  Más detalles: [Seguridad](/es/gateway/security#credential-storage-map).

## Actualizar (sin romper tu configuración)

- Mantén `~/.openclaw/workspace` y `~/.openclaw/` como “tus cosas”; no coloques prompts/configuración personales en el repositorio `openclaw`.
- Actualizar código fuente: `git pull` + `pnpm install` + sigue usando `pnpm gateway:watch`.

## Linux (servicio de usuario systemd)

Las instalaciones de Linux usan un servicio systemd de **usuario**. De forma predeterminada, systemd detiene los
servicios de usuario al cerrar sesión o quedar inactivo, lo que mata el Gateway. La incorporación intenta habilitar
lingering por ti (puede solicitar sudo). Si aún está desactivado, ejecuta:

```bash
sudo loginctl enable-linger $USER
```

Para servidores siempre activos o multiusuario, considera un servicio de **sistema** en lugar de un
servicio de usuario (no se necesita lingering). Consulta el [runbook del Gateway](/es/gateway) para ver las notas de systemd.

## Documentos relacionados

- [Runbook del Gateway](/es/gateway) (flags, supervisión, puertos)
- [Configuración del Gateway](/es/gateway/configuration) (esquema de configuración + ejemplos)
- [Discord](/es/channels/discord) y [Telegram](/es/channels/telegram) (etiquetas de respuesta + ajustes de replyToMode)
- [Configuración del asistente OpenClaw](/es/start/openclaw)
- [App de macOS](/es/platforms/macos) (ciclo de vida del gateway)
