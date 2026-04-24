---
read_when:
    - Configurar una máquina nueva
    - Quieres “lo último y lo mejor” sin romper tu configuración personal
summary: Configuración avanzada y flujos de trabajo de desarrollo para OpenClaw
title: Configuración
x-i18n:
    generated_at: "2026-04-24T05:51:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
Si lo estás configurando por primera vez, empieza con [Getting Started](/es/start/getting-started).
Para detalles de incorporación, consulta [Onboarding (CLI)](/es/start/wizard).
</Note>

## Resumen rápido

Elige un flujo de configuración según la frecuencia con la que quieras actualizaciones y si quieres ejecutar tú mismo el Gateway:

- **La personalización vive fuera del repositorio:** mantén tu configuración y espacio de trabajo en `~/.openclaw/openclaw.json` y `~/.openclaw/workspace/` para que las actualizaciones del repositorio no los toquen.
- **Flujo estable (recomendado para la mayoría):** instala la app de macOS y deja que ejecute el Gateway incluido.
- **Flujo de última versión (desarrollo):** ejecuta tú mismo el Gateway mediante `pnpm gateway:watch`, y luego deja que la app de macOS se conecte en modo local.

## Requisitos previos (desde código fuente)

- Node 24 recomendado (Node 22 LTS, actualmente `22.14+`, sigue siendo compatible)
- `pnpm` preferido (o Bun si usas intencionadamente el [flujo de trabajo con Bun](/es/install/bun))
- Docker (opcional; solo para configuración en contenedores/e2e — consulta [Docker](/es/install/docker))

## Estrategia de personalización (para que las actualizaciones no duelan)

Si quieres “100% adaptado a mí” _y_ actualizaciones fáciles, mantén tu personalización en:

- **Configuración:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Espacio de trabajo:** `~/.openclaw/workspace` (Skills, prompts, memorias; conviértelo en un repositorio git privado)

Inicialízalo una vez:

```bash
openclaw setup
```

Desde dentro de este repositorio, usa la entrada local de la CLI:

```bash
openclaw setup
```

Si todavía no tienes una instalación global, ejecútalo mediante `pnpm openclaw setup` (o `bun run openclaw setup` si estás usando el flujo de trabajo con Bun).

## Ejecutar el Gateway desde este repositorio

Después de `pnpm build`, puedes ejecutar directamente la CLI empaquetada:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flujo estable (primero la app de macOS)

1. Instala y lanza **OpenClaw.app** (barra de menú).
2. Completa la lista de comprobación de incorporación/permisos (prompts TCC).
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

- Ejecuta `openclaw setup`, luego `openclaw channels login`, y después inicia el Gateway manualmente (`openclaw gateway`).

## Flujo de última versión (Gateway en una terminal)

Objetivo: trabajar en el Gateway TypeScript, obtener recarga en caliente y mantener conectada la IU de la app de macOS.

### 0) (Opcional) Ejecutar también la app de macOS desde código fuente

Si también quieres que la app de macOS esté en la última versión:

```bash
./scripts/restart-mac.sh
```

### 1) Iniciar el Gateway de desarrollo

```bash
pnpm install
# Solo la primera vez (o después de restablecer la configuración/espacio de trabajo local de OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` ejecuta el gateway en modo watch y recarga con cambios relevantes en código fuente,
configuración y metadatos de plugins incluidos.
`pnpm openclaw setup` es el paso único de inicialización local de configuración/espacio de trabajo para un checkout nuevo.
`pnpm gateway:watch` no recompila `dist/control-ui`, así que vuelve a ejecutar `pnpm ui:build` después de cambios en `ui/` o usa `pnpm ui:dev` mientras desarrollas la IU de Control.

Si estás usando intencionadamente el flujo de trabajo con Bun, los comandos equivalentes son:

```bash
bun install
# Solo la primera vez (o después de restablecer la configuración/espacio de trabajo local de OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Apuntar la app de macOS a tu Gateway en ejecución

En **OpenClaw.app**:

- Modo de conexión: **Local**
  La app se conectará al gateway en ejecución en el puerto configurado.

### 3) Verificar

- En la app, el estado del Gateway debería decir **“Using existing gateway …”**
- O mediante CLI:

```bash
openclaw health
```

### Problemas comunes

- **Puerto incorrecto:** el WS del Gateway usa por defecto `ws://127.0.0.1:18789`; mantén app + CLI en el mismo puerto.
- **Dónde vive el estado:**
  - Estado de canal/proveedor: `~/.openclaw/credentials/`
  - Perfiles de autenticación de modelos: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesiones: `~/.openclaw/agents/<agentId>/sessions/`
  - Registros: `/tmp/openclaw/`

## Mapa de almacenamiento de credenciales

Úsalo al depurar autenticación o decidir qué respaldar:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token del bot de Telegram**: config/env o `channels.telegram.tokenFile` (solo archivo normal; se rechazan symlinks)
- **Token del bot de Discord**: config/env o SecretRef (proveedores env/file/exec)
- **Tokens de Slack**: config/env (`channels.slack.*`)
- **Allowlists de pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas)
- **Perfiles de autenticación de modelos**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Carga útil opcional de secretos basada en archivo**: `~/.openclaw/secrets.json`
- **Importación heredada de OAuth**: `~/.openclaw/credentials/oauth.json`
  Más detalle: [Seguridad](/es/gateway/security#credential-storage-map).

## Actualizar (sin destrozar tu configuración)

- Mantén `~/.openclaw/workspace` y `~/.openclaw/` como “tus cosas”; no pongas prompts/configuración personales en el repositorio `openclaw`.
- Para actualizar el código fuente: `git pull` + el paso de instalación del gestor de paquetes elegido (`pnpm install` por defecto; `bun install` para el flujo Bun) + seguir usando el comando `gateway:watch` correspondiente.

## Linux (servicio de usuario systemd)

Las instalaciones en Linux usan un servicio de usuario de systemd. Por defecto, systemd detiene los
servicios de usuario al cerrar sesión/por inactividad, lo que mata el Gateway. Onboarding intenta
habilitar lingering por ti (puede pedir sudo). Si sigue desactivado, ejecuta:

```bash
sudo loginctl enable-linger $USER
```

Para servidores siempre activos o multiusuario, considera usar un servicio **de sistema** en lugar de uno
de usuario (no hace falta lingering). Consulta [Runbook del Gateway](/es/gateway) para ver notas de systemd.

## Documentación relacionada

- [Runbook del Gateway](/es/gateway) (flags, supervisión, puertos)
- [Configuración del Gateway](/es/gateway/configuration) (esquema de configuración + ejemplos)
- [Discord](/es/channels/discord) y [Telegram](/es/channels/telegram) (etiquetas de respuesta + configuración de replyToMode)
- [Configuración del asistente OpenClaw](/es/start/openclaw)
- [app de macOS](/es/platforms/macos) (ciclo de vida del gateway)
