---
read_when:
    - Configurar una máquina nueva
    - Quieres lo último y lo mejor sin romper tu configuración personal
summary: Configuración avanzada y flujos de trabajo de desarrollo para OpenClaw
title: Configuración
x-i18n:
    generated_at: "2026-04-20T05:21:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# Configuración

<Note>
Si vas a configurar por primera vez, empieza con [Primeros pasos](/es/start/getting-started).
Para obtener detalles sobre la incorporación, consulta [Incorporación (CLI)](/es/start/wizard).
</Note>

## Resumen rápido

- **La personalización vive fuera del repositorio:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (configuración).
- **Flujo de trabajo estable:** instala la app de macOS; deja que ejecute el Gateway incluido.
- **Flujo de trabajo de vanguardia:** ejecuta el Gateway tú mismo mediante `pnpm gateway:watch`, y luego deja que la app de macOS se conecte en modo Local.

## Requisitos previos (desde el código fuente)

- Se recomienda Node 24 (Node 22 LTS, actualmente `22.14+`, sigue siendo compatible)
- Se prefiere `pnpm` (o Bun si usas intencionalmente el [flujo de trabajo de Bun](/es/install/bun))
- Docker (opcional; solo para configuración en contenedores/e2e — consulta [Docker](/es/install/docker))

## Estrategia de personalización (para que las actualizaciones no perjudiquen)

Si quieres algo “100 % adaptado a mí” _y_ actualizaciones sencillas, mantén tu personalización en:

- **Configuración:** `~/.openclaw/openclaw.json` (tipo JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompts, memorias; conviértelo en un repositorio git privado)

Inicializa una vez:

```bash
openclaw setup
```

Desde dentro de este repositorio, usa la entrada de CLI local:

```bash
openclaw setup
```

Si aún no tienes una instalación global, ejecútalo con `pnpm openclaw setup` (o `bun run openclaw setup` si estás usando el flujo de trabajo de Bun).

## Ejecutar el Gateway desde este repositorio

Después de `pnpm build`, puedes ejecutar directamente la CLI empaquetada:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flujo de trabajo estable (primero la app de macOS)

1. Instala e inicia **OpenClaw.app** (barra de menús).
2. Completa la lista de comprobación de incorporación/permisos (avisos de TCC).
3. Asegúrate de que Gateway esté en **Local** y en ejecución (la app lo gestiona).
4. Vincula las superficies (ejemplo: WhatsApp):

```bash
openclaw channels login
```

5. Comprobación rápida:

```bash
openclaw health
```

Si la incorporación no está disponible en tu compilación:

- Ejecuta `openclaw setup`, luego `openclaw channels login` y después inicia el Gateway manualmente (`openclaw gateway`).

## Flujo de trabajo de vanguardia (Gateway en una terminal)

Objetivo: trabajar en el Gateway de TypeScript, obtener recarga en caliente y mantener conectada la interfaz de la app de macOS.

### 0) (Opcional) Ejecuta también la app de macOS desde el código fuente

Si también quieres la app de macOS en la versión más reciente:

```bash
./scripts/restart-mac.sh
```

### 1) Inicia el Gateway de desarrollo

```bash
pnpm install
# Solo en la primera ejecución (o después de restablecer la configuración/workspace local de OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` ejecuta el gateway en modo observación y recarga con cambios relevantes en el código fuente, la configuración y los metadatos de plugins incluidos.
`pnpm openclaw setup` es el paso único de inicialización de la configuración/workspace local para un checkout nuevo.
`pnpm gateway:watch` no recompila `dist/control-ui`, así que vuelve a ejecutar `pnpm ui:build` después de cambios en `ui/` o usa `pnpm ui:dev` mientras desarrollas la Control UI.

Si estás usando intencionalmente el flujo de trabajo de Bun, los comandos equivalentes son:

```bash
bun install
# Solo en la primera ejecución (o después de restablecer la configuración/workspace local de OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Apunta la app de macOS a tu Gateway en ejecución

En **OpenClaw.app**:

- Modo de conexión: **Local**
  La app se conectará al gateway en ejecución en el puerto configurado.

### 3) Verifica

- El estado de Gateway en la app debería mostrar **“Using existing gateway …”**
- O mediante la CLI:

```bash
openclaw health
```

### Errores comunes

- **Puerto incorrecto:** el WS de Gateway usa por defecto `ws://127.0.0.1:18789`; mantén la app y la CLI en el mismo puerto.
- **Dónde vive el estado:**
  - Estado de canales/proveedores: `~/.openclaw/credentials/`
  - Perfiles de autenticación de modelos: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesiones: `~/.openclaw/agents/<agentId>/sessions/`
  - Registros: `/tmp/openclaw/`

## Mapa de almacenamiento de credenciales

Úsalo al depurar autenticación o decidir qué respaldar:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot de Telegram**: config/env o `channels.telegram.tokenFile` (solo archivo normal; se rechazan los enlaces simbólicos)
- **Token de bot de Discord**: config/env o SecretRef (proveedores env/file/exec)
- **Tokens de Slack**: config/env (`channels.slack.*`)
- **Listas de permitidos de emparejamiento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas)
- **Perfiles de autenticación de modelos**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Carga útil de secretos respaldados por archivo (opcional)**: `~/.openclaw/secrets.json`
- **Importación heredada de OAuth**: `~/.openclaw/credentials/oauth.json`
  Más detalles: [Seguridad](/es/gateway/security#credential-storage-map).

## Actualización (sin destrozar tu configuración)

- Mantén `~/.openclaw/workspace` y `~/.openclaw/` como “tus cosas”; no pongas prompts/configuración personales en el repositorio `openclaw`.
- Para actualizar el código fuente: `git pull` + el paso de instalación del gestor de paquetes que elijas (`pnpm install` de forma predeterminada; `bun install` para el flujo de trabajo de Bun) + sigue usando el comando `gateway:watch` correspondiente.

## Linux (servicio de usuario systemd)

Las instalaciones de Linux usan un servicio de **usuario** de systemd. De forma predeterminada, systemd detiene los servicios de usuario al cerrar sesión o por inactividad, lo que mata el Gateway. La incorporación intenta habilitar el modo persistente por ti (puede pedir sudo). Si sigue desactivado, ejecuta:

```bash
sudo loginctl enable-linger $USER
```

Para servidores siempre activos o multiusuario, considera un servicio de **sistema** en lugar de un servicio de usuario (no hace falta habilitar persistencia). Consulta el [manual operativo de Gateway](/es/gateway) para ver las notas sobre systemd.

## Documentación relacionada

- [Manual operativo de Gateway](/es/gateway) (flags, supervisión, puertos)
- [Configuración de Gateway](/es/gateway/configuration) (esquema de configuración + ejemplos)
- [Discord](/es/channels/discord) y [Telegram](/es/channels/telegram) (etiquetas de respuesta + ajustes de replyToMode)
- [Configuración del asistente OpenClaw](/es/start/openclaw)
- [app de macOS](/es/platforms/macos) (ciclo de vida del gateway)
