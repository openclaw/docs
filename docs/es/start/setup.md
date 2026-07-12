---
read_when:
    - Configurar una máquina nueva
    - Quieres «lo último y lo mejor» sin estropear tu configuración personal
summary: Configuración avanzada y flujos de trabajo de desarrollo para OpenClaw
title: Configuración
x-i18n:
    generated_at: "2026-07-12T14:49:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd35e9ab99de49a14f3d8673b2d11abe46aace18cc7edac43987826bbd1fd857
    source_path: start/setup.md
    workflow: 16
---

<Note>
Si realiza la configuración por primera vez, comience con [Primeros pasos](/es/start/getting-started).
Para obtener detalles sobre la incorporación, consulte [Incorporación (CLI)](/es/start/wizard).
</Note>

## Resumen rápido

Elija un flujo de configuración según la frecuencia con la que desee recibir actualizaciones y si desea ejecutar el Gateway usted mismo:

- **La personalización reside fuera del repositorio:** mantenga la configuración y el espacio de trabajo en `~/.openclaw/openclaw.json` y `~/.openclaw/workspace/` para que las actualizaciones del repositorio no los modifiquen.
- **Flujo estable (recomendado para la mayoría):** instale la aplicación para macOS y permita que ejecute el Gateway incluido.
- **Flujo de vanguardia (desarrollo):** ejecute el Gateway usted mismo mediante `pnpm gateway:watch` y, a continuación, permita que la aplicación para macOS se conecte en modo Local.

## Requisitos previos (desde el código fuente)

- Se recomienda Node 24 (Node 22 LTS, actualmente `22.19+`, sigue siendo compatible)
- Se requiere `pnpm` para las copias de trabajo del código fuente. OpenClaw carga los plugins incluidos desde los paquetes del espacio de trabajo pnpm
  `extensions/*` en modo de desarrollo, por lo que ejecutar `npm install` en la raíz
  no prepara todo el árbol de código fuente.
- Docker (opcional; solo para la configuración en contenedores o e2e; consulte [Docker](/es/install/docker))

## Estrategia de personalización (para que las actualizaciones no causen problemas)

Si desea una configuración «100 % adaptada a mí» _y_ actualizaciones sencillas, mantenga la personalización en:

- **Configuración:** `~/.openclaw/openclaw.json` (similar a JSON/JSON5)
- **Espacio de trabajo:** `~/.openclaw/workspace` (Skills, prompts y memorias; conviértalo en un repositorio git privado)

Inicialice una sola vez las carpetas de configuración y del espacio de trabajo, sin ejecutar el asistente de incorporación completo:

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
3. Asegúrese de que el Gateway esté en **Local** y en ejecución (la aplicación lo gestiona).
4. Vincule las plataformas (por ejemplo, WhatsApp):

```bash
openclaw channels login
```

5. Realice una comprobación básica:

```bash
openclaw health
```

Si la incorporación no está disponible en su compilación:

- Ejecute `openclaw setup`, después `openclaw channels login` y, por último, inicie el Gateway manualmente (`openclaw gateway`).

## Flujo de vanguardia (Gateway en una terminal)

Objetivo: trabajar en el Gateway de TypeScript, disponer de recarga en caliente y mantener conectada la interfaz de la aplicación para macOS.

### 0) (Opcional) Ejecutar también la aplicación para macOS desde el código fuente

Si también desea utilizar la versión de vanguardia de la aplicación para macOS:

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

`gateway:watch` inicia o reinicia el proceso de supervisión del Gateway en una sesión
con nombre de tmux (`openclaw-gateway-watch-main`) y se conecta automáticamente desde terminales
interactivas. Los shells no interactivos permanecen desconectados y muestran
`tmux attach -t openclaw-gateway-watch-main`; utilice
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` para mantener desconectada una ejecución
interactiva, o `pnpm gateway:watch:raw` para el modo de supervisión en primer plano. El supervisor
recarga al detectar cambios relevantes en el código fuente, la configuración y los metadatos de los plugins incluidos. Si el
Gateway supervisado se cierra durante el inicio, `gateway:watch` ejecuta
`openclaw doctor --fix --non-interactive` una vez y vuelve a intentarlo; establezca
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` para desactivar esa reparación exclusiva del entorno de desarrollo.
`pnpm gateway:watch` no recompila `dist/control-ui`, así que vuelva a ejecutar `pnpm ui:build` después de realizar cambios en `ui/` o utilice `pnpm ui:dev` mientras desarrolla la interfaz de control.

### 2) Hacer que la aplicación para macOS use el Gateway en ejecución

En **OpenClaw.app**:

- Connection Mode: **Local**
  La aplicación se conectará al Gateway en ejecución en el puerto configurado.

### 3) Verificar

- El estado del Gateway en la aplicación debería mostrar **"Using existing gateway …"**
- O mediante la CLI:

```bash
openclaw health
```

### Errores comunes

- **Puerto incorrecto:** el WebSocket del Gateway utiliza `ws://127.0.0.1:18789` de forma predeterminada; mantenga la aplicación y la CLI en el mismo puerto.
- **Ubicación del estado:**
  - Estado de canales/proveedores: `~/.openclaw/credentials/`
  - Perfiles de autenticación de modelos: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sesiones y transcripciones: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Artefactos de sesiones heredadas/archivadas: `~/.openclaw/agents/<agentId>/sessions/`
  - Registros: `/tmp/openclaw/`

## Mapa de almacenamiento de credenciales

Utilice esta información al depurar la autenticación o decidir qué debe incluir en una copia de seguridad:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot de Telegram**: configuración/entorno o `channels.telegram.tokenFile` (solo archivos normales; se rechazan los enlaces simbólicos)
- **Token de bot de Discord**: configuración/entorno o SecretRef (proveedores env/file/exec)
- **Tokens de Slack**: configuración/entorno (`channels.slack.*`)
- **Listas de permitidos para el emparejamiento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (cuenta predeterminada)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (cuentas no predeterminadas)
- **Perfiles de autenticación de modelos**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Contenido de secretos almacenado en un archivo (opcional)**: `~/.openclaw/secrets.json`
- **Importación de OAuth heredado**: `~/.openclaw/credentials/oauth.json`
  Más detalles: [Seguridad](/es/gateway/security#credential-storage-map).

## Actualización (sin arruinar la configuración)

- Considere `~/.openclaw/workspace` y `~/.openclaw/` como «sus archivos»; no coloque prompts ni configuraciones personales en el repositorio `openclaw`.
- Para actualizar el código fuente: `git pull` + `pnpm install` + siga utilizando `pnpm gateway:watch`.

## Linux (servicio de usuario de systemd)

Las instalaciones en Linux utilizan un servicio de **usuario** de systemd. De forma predeterminada, systemd detiene los
servicios de usuario al cerrar la sesión o durante la inactividad, lo que finaliza el Gateway. La incorporación intenta habilitar
la persistencia para el usuario (puede solicitar sudo). Si aún está desactivada, ejecute:

```bash
sudo loginctl enable-linger $USER
```

Para servidores siempre activos o con varios usuarios, considere un servicio de **sistema** en lugar de un
servicio de usuario (no requiere persistencia). Consulte la [guía operativa del Gateway](/es/gateway) para obtener información sobre systemd.

## Documentación relacionada

- [Guía operativa del Gateway](/es/gateway) (marcas, supervisión y puertos)
- [Configuración del Gateway](/es/gateway/configuration) (esquema de configuración y ejemplos)
- [Discord](/es/channels/discord) y [Telegram](/es/channels/telegram) (etiquetas de respuesta y ajustes de replyToMode)
- [Configuración del asistente de OpenClaw](/es/start/openclaw)
- [Aplicación para macOS](/es/platforms/macos) (ciclo de vida del Gateway)
