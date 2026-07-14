---
read_when:
    - Configuración de una máquina nueva
    - Quieres «lo último y lo mejor» sin estropear tu configuración personal
summary: Flujos de trabajo avanzados de configuración y desarrollo para OpenClaw
title: Configuración
x-i18n:
    generated_at: "2026-07-14T14:01:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
Si está realizando la configuración por primera vez, comience con [Primeros pasos](/es/start/getting-started).
Para obtener detalles sobre la incorporación, consulte [Incorporación (CLI)](/es/start/wizard).
</Note>

## Resumen

Elija un flujo de configuración según la frecuencia con la que desee recibir actualizaciones y si desea ejecutar el Gateway personalmente:

- **La personalización se encuentra fuera del repositorio:** mantenga la configuración y el espacio de trabajo en `~/.openclaw/openclaw.json` y `~/.openclaw/workspace/` para que las actualizaciones del repositorio no los afecten.
- **Flujo estable (recomendado para la mayoría):** instale la aplicación para macOS y deje que ejecute el Gateway incluido.
- **Flujo de vanguardia (desarrollo):** ejecute el Gateway personalmente mediante `pnpm gateway:watch` y, después, permita que la aplicación para macOS se conecte en modo Local.

## Requisitos previos (desde el código fuente)

- Se recomienda Node 24.15+ (Node 22 LTS, actualmente `22.22.3+`, sigue siendo compatible)
- Se requiere `pnpm` para las copias de trabajo del código fuente. OpenClaw carga los plugins incluidos desde los paquetes del espacio de trabajo pnpm
  `extensions/*` en modo de desarrollo, por lo que `npm install` en la raíz
  no prepara todo el árbol de código fuente.
- Docker (opcional; solo para configuración en contenedores/E2E; consulte [Docker](/es/install/docker))

## Estrategia de personalización (para que las actualizaciones no causen problemas)

Si desea que esté «100 % adaptado a sus necesidades» _y_ que las actualizaciones sean sencillas, mantenga sus personalizaciones en:

- **Configuración:** `~/.openclaw/openclaw.json` (similar a JSON/JSON5)
- **Espacio de trabajo:** `~/.openclaw/workspace` (Skills, indicaciones, memorias; conviértalo en un repositorio git privado)

Inicialice las carpetas de configuración y del espacio de trabajo una sola vez, sin ejecutar el asistente de incorporación completo:

```bash
openclaw setup --baseline
```

¿Aún no hay una instalación global? Ejecútelo desde este repositorio:

```bash
pnpm openclaw setup --baseline
```

(`openclaw setup` sin `--baseline` es un alias de `openclaw onboard` y ejecuta el asistente interactivo completo).

## Ejecutar el Gateway desde este repositorio

Después de `pnpm build`, puede ejecutar directamente la CLI empaquetada:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flujo estable (primero la aplicación para macOS)

1. Instale e inicie **OpenClaw.app** (barra de menús).
2. Complete la lista de comprobación de incorporación y permisos (solicitudes de TCC).
3. Asegúrese de que el Gateway esté en modo **Local** y en ejecución (la aplicación lo administra).
4. Vincule las plataformas (por ejemplo, WhatsApp):

```bash
openclaw channels login
```

5. Comprobación básica:

```bash
openclaw health
```

Si la incorporación no está disponible en su compilación:

- Ejecute `openclaw setup`, después `openclaw channels login` y, a continuación, inicie el Gateway manualmente (`openclaw gateway`).

## Flujo de vanguardia (Gateway en una terminal)

Objetivo: trabajar en el Gateway de TypeScript, disponer de recarga en caliente y mantener conectada la interfaz de la aplicación para macOS.

### 0) (Opcional) Ejecutar también la aplicación para macOS desde el código fuente

Si también desea usar la versión más reciente de la aplicación para macOS:

```bash
./scripts/restart-mac.sh
```

### 1) Iniciar el Gateway de desarrollo

```bash
pnpm install
# Solo en la primera ejecución (o después de restablecer la configuración o el espacio de trabajo local de OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` inicia o reinicia el proceso de supervisión del Gateway en una sesión de tmux
con nombre (`openclaw-gateway-watch-main`) y se conecta automáticamente desde terminales
interactivas. Los shells no interactivos permanecen desconectados y muestran
`tmux attach -t openclaw-gateway-watch-main`; use
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` para mantener desconectada una ejecución
interactiva o `pnpm gateway:watch:raw` para usar el modo de supervisión en primer plano. El supervisor
detiene el servicio de Gateway instalado del perfil activo antes de tomar el control de su
puerto configurado o predeterminado, lo que evita que el supervisor del servicio sustituya
el proceso iniciado desde el código fuente. El servicio permanece instalado; ejecute `pnpm openclaw gateway start`
cuando termine la supervisión. El panel de tmux permanece disponible después de un fallo de inicio
para que otra terminal u otro agente puedan conectarse o capturar sus registros. El supervisor
recarga cuando hay cambios relevantes en el código fuente, la configuración y los metadatos de los plugins incluidos. Si el
Gateway supervisado finaliza durante el inicio, `gateway:watch` ejecuta
`openclaw doctor --fix --non-interactive` una vez y vuelve a intentarlo; establezca
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para desactivar esa fase de reparación exclusiva del desarrollo.
`pnpm gateway:watch` no vuelve a compilar `dist/control-ui`, así que vuelva a ejecutar `pnpm ui:build` después de cambios en `ui/` o use `pnpm ui:dev` mientras desarrolla la interfaz de Control.

### 2) Dirigir la aplicación para macOS al Gateway en ejecución

En **OpenClaw.app**:

- Connection Mode: **Local**
  La aplicación se conectará al Gateway en ejecución en el puerto configurado.

### 3) Verificar

- El estado del Gateway en la aplicación debe mostrar **"Using existing gateway …"**
- O mediante la CLI:

```bash
openclaw health
```

### Errores comunes

- **Puerto incorrecto:** el WebSocket del Gateway usa `ws://127.0.0.1:18789` de forma predeterminada; mantenga la aplicación y la CLI en el mismo puerto.
- **Ubicación del estado:**
  - Estado del canal/proveedor: `~/.openclaw/credentials/`
  - Perfiles de autenticación del modelo: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesiones y transcripciones: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Artefactos de sesiones heredados o archivados: `~/.openclaw/agents/<agentId>/sessions/`
  - Registros: `/tmp/openclaw/`

## Mapa de almacenamiento de credenciales

Utilice esta información al depurar la autenticación o decidir qué debe incluirse en las copias de seguridad:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token del bot de Telegram**: configuración/entorno o `channels.telegram.tokenFile` (solo archivos normales; se rechazan los enlaces simbólicos)
- **Token del bot de Discord**: configuración/entorno o SecretRef (proveedores de entorno/archivo/ejecución)
- **Tokens de Slack**: configuración/entorno (`channels.slack.*`)
- **Listas de permitidos para el emparejamiento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas)
- **Perfiles de autenticación del modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Contenido de secretos respaldado por archivos (opcional)**: `~/.openclaw/secrets.json`
- **Importación de OAuth heredado**: `~/.openclaw/credentials/oauth.json`
  Más detalles: [Seguridad](/es/gateway/security#credential-storage-map).

## Actualización (sin estropear la configuración)

- Mantenga `~/.openclaw/workspace` y `~/.openclaw/` como «sus propios elementos»; no coloque indicaciones ni configuraciones personales en el repositorio `openclaw`.
- Actualización del código fuente: `git pull` + `pnpm install` + continúe usando `pnpm gateway:watch`.

## Linux (servicio de usuario de systemd)

Las instalaciones en Linux utilizan un servicio de **usuario** de systemd. De forma predeterminada, systemd detiene los servicios
del usuario al cerrar sesión o quedar inactivo, lo que finaliza el Gateway. La incorporación intenta habilitar
la persistencia de la sesión de usuario (puede solicitar sudo). Si aún está desactivada, ejecute:

```bash
sudo loginctl enable-linger $USER
```

Para servidores siempre activos o multiusuario, considere usar un servicio de **sistema** en lugar de un
servicio de usuario (no requiere persistencia de la sesión). Consulte el [manual operativo del Gateway](/es/gateway) para obtener información sobre systemd.

## Documentación relacionada

- [Manual operativo del Gateway](/es/gateway) (marcas, supervisión, puertos)
- [Configuración del Gateway](/es/gateway/configuration) (esquema de configuración y ejemplos)
- [Discord](/es/channels/discord) y [Telegram](/es/channels/telegram) (etiquetas de respuesta y ajustes de replyToMode)
- [Configuración del asistente de OpenClaw](/es/start/openclaw)
- [Aplicación para macOS](/es/platforms/macos) (ciclo de vida del Gateway)
