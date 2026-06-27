---
read_when:
    - Configurar una máquina nueva
    - Quieres lo "último y mejor" sin romper tu configuración personal
summary: Flujos de trabajo avanzados de configuración y desarrollo para OpenClaw
title: Configuración
x-i18n:
    generated_at: "2026-06-27T12:58:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
Si estás configurando por primera vez, empieza con [Primeros pasos](/es/start/getting-started).
Para detalles de incorporación, consulta [Incorporación (CLI)](/es/start/wizard).
</Note>

## Resumen rápido

Elige un flujo de configuración según la frecuencia con la que quieras recibir actualizaciones y si quieres ejecutar el Gateway tú mismo:

- **La personalización vive fuera del repositorio:** conserva tu configuración y espacio de trabajo en `~/.openclaw/openclaw.json` y `~/.openclaw/workspace/` para que las actualizaciones del repositorio no los toquen.
- **Flujo estable (recomendado para la mayoría):** instala la app de macOS y deja que ejecute el Gateway incluido.
- **Flujo de última generación (dev):** ejecuta el Gateway tú mismo mediante `pnpm gateway:watch` y luego deja que la app de macOS se conecte en modo Local.

## Requisitos previos (desde el código fuente)

- Node 24 recomendado (Node 22 LTS, actualmente `22.19+`, todavía compatible)
- Se requiere `pnpm` para checkouts desde el código fuente. OpenClaw carga los plugins incluidos desde los paquetes del espacio de trabajo pnpm
  `extensions/*` en modo dev, por lo que `npm install` en la raíz
  no prepara el árbol de código fuente completo.
- Docker (opcional; solo para configuración/e2e en contenedores; consulta [Docker](/es/install/docker))

## Estrategia de personalización (para que las actualizaciones no causen problemas)

Si quieres algo "100% adaptado a mí" _y_ actualizaciones fáciles, conserva tu personalización en:

- **Configuración:** `~/.openclaw/openclaw.json` (similar a JSON/JSON5)
- **Espacio de trabajo:** `~/.openclaw/workspace` (Skills, prompts, memorias; conviértelo en un repositorio git privado)

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
2. Completa la lista de incorporación/permisos (avisos de TCC).
3. Asegúrate de que Gateway esté en **Local** y ejecutándose (la app lo gestiona).
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

## Flujo de última generación (Gateway en una terminal)

Objetivo: trabajar en el Gateway de TypeScript, obtener recarga en caliente y mantener conectada la interfaz de la app de macOS.

### 0) (Opcional) Ejecuta también la app de macOS desde el código fuente

Si también quieres la app de macOS en la última generación:

```bash
./scripts/restart-mac.sh
```

### 1) Inicia el Gateway de desarrollo

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` inicia o reinicia el proceso de observación del Gateway en una sesión tmux
con nombre y se adjunta automáticamente desde terminales interactivas. Los shells no interactivos permanecen
separados e imprimen `tmux attach -t openclaw-gateway-watch-main`; usa
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` para mantener separada una ejecución interactiva,
o `pnpm gateway:watch:raw` para el modo de observación en primer plano. El observador
recarga ante cambios relevantes en el código fuente, la configuración y los metadatos de plugins incluidos. Si el
Gateway observado sale durante el inicio, `gateway:watch` ejecuta
`openclaw doctor --fix --non-interactive` una vez y reintenta; define
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para desactivar esa pasada de reparación solo para dev.
`pnpm openclaw setup` es el paso único de inicialización local de configuración/espacio de trabajo para un checkout nuevo.
`pnpm gateway:watch` no recompila `dist/control-ui`, así que vuelve a ejecutar `pnpm ui:build` después de cambios en `ui/` o usa `pnpm ui:dev` mientras desarrollas la interfaz de control.

### 2) Apunta la app de macOS a tu Gateway en ejecución

En **OpenClaw.app**:

- Modo de conexión: **Local**
  La app se conectará al gateway en ejecución en el puerto configurado.

### 3) Verifica

- El estado de Gateway en la app debería mostrar **"Usando gateway existente …"**
- O mediante la CLI:

```bash
openclaw health
```

### Errores comunes

- **Puerto incorrecto:** Gateway WS usa por defecto `ws://127.0.0.1:18789`; mantén la app y la CLI en el mismo puerto.
- **Dónde vive el estado:**
  - Estado de canal/proveedor: `~/.openclaw/credentials/`
  - Perfiles de autenticación de modelo: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesiones: `~/.openclaw/agents/<agentId>/sessions/`
  - Registros: `/tmp/openclaw/`

## Mapa de almacenamiento de credenciales

Usa esto al depurar autenticación o decidir qué respaldar:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot de Telegram**: config/env o `channels.telegram.tokenFile` (solo archivo normal; se rechazan enlaces simbólicos)
- **Token de bot de Discord**: config/env o SecretRef (proveedores env/file/exec)
- **Tokens de Slack**: config/env (`channels.slack.*`)
- **Listas de permitidos para emparejamiento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas)
- **Perfiles de autenticación de modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload de secretos respaldado por archivo (opcional)**: `~/.openclaw/secrets.json`
- **Importación OAuth heredada**: `~/.openclaw/credentials/oauth.json`
  Más detalle: [Seguridad](/es/gateway/security#credential-storage-map).

## Actualizar (sin arruinar tu configuración)

- Mantén `~/.openclaw/workspace` y `~/.openclaw/` como "tus cosas"; no pongas prompts/configuración personales en el repositorio `openclaw`.
- Actualizar el código fuente: `git pull` + `pnpm install` + seguir usando `pnpm gateway:watch`.

## Linux (servicio systemd de usuario)

Las instalaciones en Linux usan un servicio systemd de **usuario**. De forma predeterminada, systemd detiene los
servicios de usuario al cerrar sesión o durante inactividad, lo que mata el Gateway. La incorporación intenta habilitar
lingering por ti (puede pedir sudo). Si sigue desactivado, ejecuta:

```bash
sudo loginctl enable-linger $USER
```

Para servidores siempre activos o multiusuario, considera un servicio de **sistema** en lugar de un
servicio de usuario (no se necesita lingering). Consulta [Runbook de Gateway](/es/gateway) para las notas de systemd.

## Documentos relacionados

- [Runbook de Gateway](/es/gateway) (flags, supervisión, puertos)
- [Configuración de Gateway](/es/gateway/configuration) (esquema de configuración + ejemplos)
- [Discord](/es/channels/discord) y [Telegram](/es/channels/telegram) (etiquetas de respuesta + ajustes de replyToMode)
- [Configuración del asistente de OpenClaw](/es/start/openclaw)
- [App de macOS](/es/platforms/macos) (ciclo de vida de gateway)
