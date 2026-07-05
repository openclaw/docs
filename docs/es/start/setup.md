---
read_when:
    - Configuración de una máquina nueva
    - Quieres "lo último y mejor" sin romper tu configuración personal
summary: Configuración avanzada y flujos de trabajo de desarrollo para OpenClaw
title: Configuración
x-i18n:
    generated_at: "2026-07-05T11:44:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae0dd0e8ea999367440898f54354a76405e310fee6e05846aab13cba14a65f37
    source_path: start/setup.md
    workflow: 16
---

<Note>
Si estás configurando por primera vez, empieza con [Introducción](/es/start/getting-started).
Para obtener detalles de incorporación, consulta [Incorporación (CLI)](/es/start/wizard).
</Note>

## TL;DR

Elige un flujo de configuración según la frecuencia con la que quieras recibir actualizaciones y si quieres ejecutar el Gateway tú mismo:

- **La personalización vive fuera del repositorio:** mantén tu configuración y espacio de trabajo en `~/.openclaw/openclaw.json` y `~/.openclaw/workspace/` para que las actualizaciones del repositorio no los modifiquen.
- **Flujo estable (recomendado para la mayoría):** instala la app para macOS y deja que ejecute el Gateway incluido.
- **Flujo de última generación (dev):** ejecuta el Gateway tú mismo mediante `pnpm gateway:watch` y luego permite que la app para macOS se conecte en modo Local.

## Requisitos previos (desde el código fuente)

- Node 24 recomendado (Node 22 LTS, actualmente `22.19+`, sigue siendo compatible)
- `pnpm` es obligatorio para checkouts del código fuente. OpenClaw carga plugins incluidos desde los paquetes del espacio de trabajo pnpm
  `extensions/*` en modo dev, por lo que `npm install` en la raíz
  no prepara el árbol de código fuente completo.
- Docker (opcional; solo para configuración/e2e en contenedores; consulta [Docker](/es/install/docker))

## Estrategia de personalización (para que las actualizaciones no duelan)

Si quieres algo "100% adaptado a mí" _y_ actualizaciones fáciles, mantén tu personalización en:

- **Configuración:** `~/.openclaw/openclaw.json` (similar a JSON/JSON5)
- **Espacio de trabajo:** `~/.openclaw/workspace` (Skills, prompts, memorias; conviértelo en un repositorio git privado)

Inicializa las carpetas de configuración/espacio de trabajo una vez, sin ejecutar el asistente de incorporación completo:

```bash
openclaw setup --baseline
```

¿Aún no tienes una instalación global? Ejecútalo desde este repositorio en su lugar:

```bash
pnpm openclaw setup --baseline
```

(`openclaw setup` sin argumentos, sin `--baseline`, es un alias de `openclaw onboard` y ejecuta el asistente interactivo completo).

## Ejecutar el Gateway desde este repositorio

Después de `pnpm build`, puedes ejecutar la CLI empaquetada directamente:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flujo estable (primero la app para macOS)

1. Instala e inicia **OpenClaw.app** (barra de menús).
2. Completa la lista de comprobación de incorporación/permisos (avisos de TCC).
3. Asegúrate de que Gateway esté en **Local** y en ejecución (la app lo gestiona).
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

Objetivo: trabajar en el Gateway de TypeScript, obtener recarga en caliente y mantener conectada la UI de la app para macOS.

### 0) (Opcional) Ejecutar también la app para macOS desde el código fuente

Si también quieres la app para macOS en la última generación:

```bash
./scripts/restart-mac.sh
```

### 1) Iniciar el Gateway de desarrollo

```bash
pnpm install
# Solo la primera ejecución (o después de restablecer la configuración/espacio de trabajo local de OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` inicia o reinicia el proceso de observación del Gateway en una sesión tmux
con nombre (`openclaw-gateway-watch-main`) y se adjunta automáticamente desde terminales
interactivas. Las shells no interactivas permanecen desacopladas e imprimen
`tmux attach -t openclaw-gateway-watch-main`; usa
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` para mantener desacoplada una ejecución interactiva,
o `pnpm gateway:watch:raw` para el modo de observación en primer plano. El observador
recarga ante cambios relevantes en el código fuente, la configuración y los metadatos de plugins incluidos. Si el
Gateway observado sale durante el arranque, `gateway:watch` ejecuta
`openclaw doctor --fix --non-interactive` una vez y reintenta; define
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para desactivar esa pasada de reparación exclusiva de dev.
`pnpm gateway:watch` no recompila `dist/control-ui`, así que vuelve a ejecutar `pnpm ui:build` después de cambios en `ui/` o usa `pnpm ui:dev` mientras desarrollas la UI de control.

### 2) Apuntar la app para macOS a tu Gateway en ejecución

En **OpenClaw.app**:

- Modo de conexión: **Local**
  La app se conectará al gateway en ejecución en el puerto configurado.

### 3) Verificar

- El estado del Gateway en la app debería mostrar **"Usando gateway existente …"**
- O mediante CLI:

```bash
openclaw health
```

### Errores comunes

- **Puerto incorrecto:** Gateway WS usa de forma predeterminada `ws://127.0.0.1:18789`; mantén la app y la CLI en el mismo puerto.
- **Dónde vive el estado:**
  - Estado de canal/proveedor: `~/.openclaw/credentials/`
  - Perfiles de autenticación del modelo: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesiones: `~/.openclaw/agents/<agentId>/sessions/`
  - Registros: `/tmp/openclaw/`

## Mapa de almacenamiento de credenciales

Usa esto al depurar autenticación o decidir de qué hacer copia de seguridad:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot de Telegram**: config/env o `channels.telegram.tokenFile` (solo archivo normal; se rechazan symlinks)
- **Token de bot de Discord**: config/env o SecretRef (proveedores env/file/exec)
- **Tokens de Slack**: config/env (`channels.slack.*`)
- **Listas de permitidos de emparejamiento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas)
- **Perfiles de autenticación del modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Carga útil de secretos respaldada por archivo (opcional)**: `~/.openclaw/secrets.json`
- **Importación OAuth heredada**: `~/.openclaw/credentials/oauth.json`
  Más detalle: [Seguridad](/es/gateway/security#credential-storage-map).

## Actualizar (sin estropear tu configuración)

- Mantén `~/.openclaw/workspace` y `~/.openclaw/` como "tus cosas"; no pongas prompts/configuración personales en el repositorio `openclaw`.
- Actualizar el código fuente: `git pull` + `pnpm install` + seguir usando `pnpm gateway:watch`.

## Linux (servicio de usuario systemd)

Las instalaciones de Linux usan un servicio de **usuario** de systemd. De forma predeterminada, systemd detiene los servicios de usuario
al cerrar sesión o durante inactividad, lo que mata el Gateway. La incorporación intenta habilitar
la persistencia por ti (puede pedir sudo). Si aún está desactivada, ejecuta:

```bash
sudo loginctl enable-linger $USER
```

Para servidores siempre activos o multiusuario, considera un servicio de **sistema** en lugar de un
servicio de usuario (no se necesita persistencia). Consulta [Runbook del Gateway](/es/gateway) para ver las notas de systemd.

## Documentación relacionada

- [Runbook del Gateway](/es/gateway) (flags, supervisión, puertos)
- [Configuración del Gateway](/es/gateway/configuration) (esquema de configuración + ejemplos)
- [Discord](/es/channels/discord) y [Telegram](/es/channels/telegram) (etiquetas de respuesta + ajustes de replyToMode)
- [Configuración del asistente de OpenClaw](/es/start/openclaw)
- [App para macOS](/es/platforms/macos) (ciclo de vida del gateway)
