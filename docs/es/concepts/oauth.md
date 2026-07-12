---
read_when:
    - Quieres entender OAuth de OpenClaw de principio a fin
    - Tienes problemas de invalidación de tokens o cierre de sesión.
    - Quieres flujos de autenticación mediante Claude CLI u OAuth
    - Quieres usar varias cuentas o el enrutamiento de perfiles
summary: 'OAuth en OpenClaw: intercambio y almacenamiento de tokens, y patrones de múltiples cuentas'
title: OAuth
x-i18n:
    generated_at: "2026-07-11T23:04:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw admite OAuth («autenticación mediante suscripción») para los proveedores que lo ofrecen,
en particular **OpenAI Codex (OAuth de ChatGPT)** y la **reutilización de Anthropic Claude CLI**.
Para Anthropic, la distinción práctica es:

- **Clave de API de Anthropic**: facturación normal de la API de Anthropic.
- **Anthropic Claude CLI / autenticación mediante suscripción dentro de OpenClaw**: el personal de Anthropic
  nos indicó que este uso vuelve a estar permitido, por lo que OpenClaw considera autorizados para esta integración
  tanto la reutilización de Claude CLI como el uso de `claude -p`, salvo que Anthropic
  publique una nueva política. Para Anthropic en producción, la autenticación con clave de API sigue siendo
  la opción recomendada más segura.

OpenClaw almacena tanto la autenticación mediante clave de API de OpenAI como el OAuth de ChatGPT/Codex bajo el
identificador canónico de proveedor `openai`. Los identificadores de perfil antiguos `openai-codex:*` y las
entradas `auth.order.openai-codex` son estados heredados que
`openclaw doctor --fix` repara; use identificadores de perfil `openai:*` y `auth.order.openai` para
la configuración nueva.

Esta página explica:

- cómo funciona el **intercambio de tokens** de OAuth (PKCE)
- dónde se **almacenan** los tokens (y por qué)
- cómo gestionar **varias cuentas** (perfiles + anulaciones por sesión)

Los Plugins de proveedor que incluyen su propio flujo de OAuth o de clave de API se ejecutan mediante el
mismo punto de entrada:

```bash
openclaw models auth login --provider <id>
```

## El sumidero de tokens (por qué existe)

Los proveedores de OAuth suelen emitir un nuevo token de actualización en cada inicio de sesión o actualización.
Algunos proveedores invalidan el token de actualización anterior cuando se
emite uno nuevo para el mismo usuario y aplicación. Síntoma práctico: se inicia sesión mediante OpenClaw _y_
mediante Claude Code / Codex CLI, y más adelante uno de ellos cierra la sesión de forma aparentemente aleatoria.

Para reducir este problema, OpenClaw trata el almacén de perfiles de autenticación como un **sumidero de tokens**:

- el entorno de ejecución lee las credenciales desde un único lugar por agente
- pueden coexistir varios perfiles y enrutarse de forma determinista
- la reutilización de una CLI externa es específica de cada proveedor: una vez que OpenClaw posee un perfil de OAuth
  local para un proveedor, el token de actualización local es el canónico. Si ese token de
  actualización local se rechaza, OpenClaw informa de que el perfil debe
  volver a autenticarse, en lugar de recurrir al material de tokens de una CLI externa.
  La inicialización desde Codex CLI es aún más limitada: solo puede proporcionar datos iniciales a un perfil vacío
  con el formato `openai:default` antes de que OpenClaw posea OAuth para ese
  proveedor; después, las actualizaciones gestionadas por OpenClaw siguen siendo las canónicas
- las rutas de estado e inicio limitan la detección de CLI externas al conjunto de proveedores
  ya configurados, por lo que no se examina el almacén de inicio de sesión de una CLI no relacionada en una
  configuración con un único proveedor

## Almacenamiento (dónde residen los tokens)

Los secretos residen por agente, asociados al nombre lógico `auth-profiles.json` (el
almacén subyacente es la base de datos SQLite del agente; el nombre JSON se conserva por
compatibilidad y para su visualización en herramientas):

- Perfiles de autenticación (OAuth + claves de API + referencias opcionales a valores):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Archivo de compatibilidad heredado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (las entradas estáticas `api_key` se eliminan al detectarse)

Archivo heredado solo para importación (todavía compatible, pero no es el almacén principal):

- `~/.openclaw/credentials/oauth.json` (se importa al almacén de perfiles de autenticación en el primer uso)

Todo lo anterior también respeta `$OPENCLAW_STATE_DIR` (anulación del directorio de estado). Referencia completa: [/gateway/configuration-reference#auth-storage](/es/gateway/configuration-reference#auth-storage)

Para obtener información sobre las referencias estáticas a secretos y el comportamiento de activación de instantáneas en tiempo de ejecución, consulte [Gestión de secretos](/es/gateway/secrets).

Cuando un agente secundario no tiene un perfil de autenticación local, OpenClaw utiliza una
herencia con lectura directa desde el almacén del agente predeterminado/principal; no clona el almacén del agente
principal durante la lectura. Los tokens de actualización de OAuth son especialmente sensibles: los flujos normales
de copia los omiten de forma predeterminada porque algunos proveedores rotan o invalidan los
tokens de actualización después de usarlos. Configure un inicio de sesión de OAuth independiente para un agente cuando
necesite una cuenta independiente.

## Reutilización de Anthropic Claude CLI

OpenClaw admite la reutilización de Anthropic Claude CLI y `claude -p` como una vía de
autenticación autorizada. Si ya tiene una sesión local de Claude iniciada en el equipo anfitrión,
los procesos de incorporación o configuración pueden reutilizarla directamente. El token de configuración de Anthropic sigue
disponible como una vía compatible de autenticación mediante token, pero OpenClaw prefiere la reutilización de Claude CLI
cuando está disponible.

<Warning>
La documentación pública de Claude Code de Anthropic indica que el uso directo de Claude Code se mantiene dentro de
los límites de la suscripción de Claude, y el personal de Anthropic nos indicó que el uso de Claude
CLI al estilo de OpenClaw vuelve a estar permitido. Por lo tanto, OpenClaw considera autorizados para esta integración
tanto la reutilización de Claude CLI como el uso de `claude -p`, salvo que Anthropic
publique una nueva política.

Para consultar la documentación actual de Anthropic sobre los planes para el uso directo de Claude Code, consulte [Uso de Claude Code
con su plan Pro o
Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
y [Uso de Claude Code con su plan Team o Enterprise
](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si desea otras opciones basadas en suscripción en OpenClaw, consulte [OpenAI
Codex](/es/providers/openai), [Plan de programación en la nube de Qwen
](/es/providers/qwen), [Plan de programación de MiniMax](/es/providers/minimax)
y [Plan de programación de Z.AI / GLM](/es/providers/zai).
</Warning>

## Intercambio de OAuth (cómo funciona el inicio de sesión)

Los flujos interactivos de inicio de sesión de OpenClaw están implementados en `openclaw/plugin-sdk/llm.ts` y conectados con los asistentes y comandos.

### Token de configuración de Anthropic

Estructura del flujo:

1. inicie el flujo de token de configuración o de pegado de token de Anthropic desde OpenClaw
2. OpenClaw almacena la credencial de Anthropic resultante en un perfil de autenticación
3. la selección de modelo permanece en `anthropic/...`
4. los perfiles de autenticación de Anthropic existentes siguen disponibles para controlar la reversión y el orden

### OpenAI Codex (OAuth de ChatGPT)

El OAuth de OpenAI Codex se admite explícitamente para su uso fuera de Codex CLI, incluidos los flujos de trabajo de OpenClaw.

El comando de inicio de sesión utiliza el identificador canónico del proveedor OpenAI:

```bash
openclaw models auth login --provider openai
```

Use `--profile-id openai:<name>` para utilizar varias cuentas OAuth de ChatGPT/Codex en
un mismo agente. No use `openai-codex:<name>` para perfiles nuevos. Doctor migra
ese prefijo antiguo a un identificador de perfil `openai:*` sin colisiones; ejecute
`openclaw models auth list --provider openai` después de la reparación y antes de copiar
los identificadores de perfil en `auth.order` o `/model ...@<profileId>`.

Estructura del flujo (PKCE):

1. genere un verificador/desafío PKCE y un `state` aleatorio
2. abra `https://auth.openai.com/oauth/authorize?...` (ámbito
   `openid profile email offline_access`)
3. intente capturar la devolución de llamada en `http://localhost:1455/auth/callback` (el
   equipo anfitrión de devolución de llamada es `localhost` de forma predeterminada y solo acepta equipos de local loopback;
   puede anularlo con `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. si puede pegar un código antes de que llegue la devolución de llamada (o se encuentra
   en un entorno remoto/sin interfaz gráfica y la devolución de llamada no puede enlazarse), pegue en su lugar la URL o el código
   de redirección; el pegado manual compite con la devolución de llamada del navegador y gana el que
   se complete primero
5. intercambie el código en `https://auth.openai.com/oauth/token`
6. extraiga `accountId` del token de acceso y almacene `{ access, refresh, expires, accountId }`

La ruta del asistente es `openclaw onboard` → opción de autenticación `openai`.

## Actualización y caducidad

Los perfiles almacenan una marca de tiempo `expires`. En tiempo de ejecución:

- si `expires` está en el futuro, se usa el token de acceso almacenado
- si ha caducado, se actualiza (bajo un bloqueo de archivo) y se sobrescriben las credenciales almacenadas
- si un agente secundario lee un perfil de OAuth heredado del agente principal, la
  actualización se escribe en el almacén del agente principal, en lugar de copiar el token de
  actualización al almacén del agente secundario
- las credenciales de CLI gestionadas externamente (Claude CLI e inicialización limitada desde Codex CLI;
  consulte [El sumidero de tokens](#the-token-sink-why-it-exists)) se vuelven a leer en lugar de
  consumir un token de actualización copiado. Si falla una actualización gestionada, OpenClaw
  informa del perfil afectado para que vuelva a autenticarse, en lugar de devolver
  material de tokens de una CLI externa.

El flujo de actualización es automático; por lo general, no es necesario gestionar los tokens manualmente.

## Varias cuentas (perfiles) y enrutamiento

Dos patrones:

### 1) Preferido: agentes separados

Si desea que las cuentas «personal» y «trabajo» nunca interactúen, use agentes aislados (sesiones + credenciales + espacio de trabajo separados):

```bash
openclaw agents add work
openclaw agents add personal
```

A continuación, configure la autenticación por agente mediante el asistente y enrute los chats al agente adecuado.

### 2) Avanzado: varios perfiles en un agente

El almacén de perfiles de autenticación admite varios identificadores de perfil para el mismo proveedor.
Elija cuál se utiliza:

- globalmente mediante el orden de configuración (`auth.order`)
- por sesión mediante `/model ...@<profileId>`

Ejemplo (anulación de sesión):

- `/model Opus@anthropic:work`

Enumere los identificadores de perfil existentes con:

```bash
openclaw models auth list --provider <id>
```

Documentación relacionada:

- [Conmutación por error de modelos](/es/concepts/model-failover) (reglas de rotación y tiempo de espera)
- [Comandos con barra](/es/tools/slash-commands) (superficie de comandos)

## Contenido relacionado

- [Autenticación](/es/gateway/authentication): descripción general de la autenticación de proveedores de modelos
- [Secretos](/es/gateway/secrets): almacenamiento de credenciales y SecretRef
- [Referencia de configuración](/es/gateway/configuration-reference#auth-storage): claves de configuración de autenticación
