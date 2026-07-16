---
read_when:
    - Quieres comprender OAuth de OpenClaw de principio a fin
    - Tienes problemas de invalidación de tokens o cierre de sesión
    - Se requieren flujos de autenticación de Claude CLI u OAuth
    - Se desean varias cuentas o el enrutamiento de perfiles
summary: 'OAuth en OpenClaw: intercambio y almacenamiento de tokens, y patrones de múltiples cuentas'
title: OAuth
x-i18n:
    generated_at: "2026-07-16T11:36:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ef94af0601b7d57bb7e2d53c3d8231708b401251eca7dc1bb1e7e4fc09b46da
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw admite OAuth ("autenticación mediante suscripción") para los proveedores que lo ofrecen,
en particular **OpenAI Codex (OAuth de ChatGPT)** y la **reutilización de Anthropic Claude CLI**.
Para Anthropic, la distinción práctica es:

- **Clave de API de Anthropic**: facturación normal de la API de Anthropic.
- **Anthropic Claude CLI/autenticación mediante suscripción dentro de OpenClaw**: el personal de Anthropic
  nos comunicó que este uso vuelve a estar permitido, por lo que OpenClaw considera que la reutilización de Claude CLI y
  el uso de `claude -p` están autorizados para esta integración, a menos que Anthropic
  publique una nueva política. Para Anthropic en producción, la autenticación mediante
  clave de API sigue siendo la opción recomendada más segura.

OpenClaw almacena tanto la autenticación mediante clave de API de OpenAI como el OAuth de ChatGPT/Codex bajo el
identificador de proveedor canónico `openai`. Los identificadores de perfil `openai-codex:*` y las
entradas `auth.order.openai-codex` anteriores son estados heredados que
`openclaw doctor --fix` repara; use identificadores de perfil `openai:*` y `auth.order.openai` para
la configuración nueva.

Esta página abarca:

- cómo funciona el **intercambio de tokens** de OAuth (PKCE)
- dónde se **almacenan** los tokens (y por qué)
- cómo gestionar **varias cuentas** (perfiles + reemplazos por sesión)

Los plugins de proveedor que incluyen su propio flujo de OAuth o de clave de API se ejecutan mediante el
mismo punto de entrada:

```bash
openclaw models auth login --provider <id>
```

## El sumidero de tokens (por qué existe)

Los proveedores de OAuth suelen emitir un token de actualización nuevo con cada inicio de sesión o actualización.
Algunos proveedores invalidan el token de actualización anterior cuando se
emite uno nuevo para el mismo usuario y aplicación. Síntoma práctico: se inicia sesión mediante OpenClaw _y_
mediante Claude Code/Codex CLI, y uno de ellos cierra la sesión de forma aleatoria más adelante.

Para reducir este problema, OpenClaw trata el almacén de perfiles de autenticación como un **sumidero de tokens**:

- el entorno de ejecución lee las credenciales de un único lugar por agente
- pueden coexistir varios perfiles y el enrutamiento es determinista
- la reutilización de una CLI externa es específica del proveedor: una vez que OpenClaw posee un perfil de OAuth
  local para un proveedor, el token de actualización local es el canónico. Si se rechaza ese
  token de actualización local, OpenClaw indica que el perfil requiere
  una nueva autenticación en lugar de recurrir al material de tokens de una CLI externa.
  La inicialización desde Codex CLI tiene un alcance aún más limitado: solo puede proporcionar datos iniciales a un perfil vacío
  de tipo `openai:default` antes de que OpenClaw controle el OAuth de ese
  proveedor; después, las actualizaciones gestionadas por OpenClaw siguen siendo canónicas
- las rutas de estado e inicio limitan la detección de CLI externas al conjunto de proveedores
  ya configurado, por lo que no se examina un almacén de inicio de sesión de una CLI
  no relacionada en una configuración con un único proveedor

## Almacenamiento (dónde se guardan los tokens)

Los secretos se almacenan por agente y se identifican mediante el nombre lógico `auth-profiles.json` (el
almacén subyacente es la base de datos SQLite del agente; el nombre JSON se conserva por
compatibilidad y para su visualización en las herramientas):

- Perfiles de autenticación (OAuth + claves de API + referencias opcionales a nivel de valor):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Archivo de compatibilidad heredado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (las entradas estáticas `api_key` se eliminan al detectarse)

Archivo heredado solo para importación (aún compatible, pero no es el almacén principal):

- `~/.openclaw/credentials/oauth.json` (se importa en el almacén de perfiles de autenticación la primera vez que se usa)

Todo lo anterior también respeta `$OPENCLAW_STATE_DIR` (reemplazo del directorio de estado). Referencia completa: [/gateway/configuration-reference#auth-storage](/es/gateway/configuration-reference#auth-storage)

Para obtener información sobre las referencias estáticas a secretos y el comportamiento de activación de instantáneas en tiempo de ejecución, consulte [Gestión de secretos](/es/gateway/secrets).

Cuando un agente secundario no tiene un perfil de autenticación local, OpenClaw utiliza una
herencia con lectura directa desde el almacén del agente predeterminado/principal; no clona el almacén
del agente principal al leer. Los tokens de actualización de OAuth son especialmente sensibles: los flujos normales
de copia los omiten de forma predeterminada porque algunos proveedores rotan o invalidan
los tokens de actualización después de usarlos. Configure un inicio de sesión de OAuth independiente para un agente cuando
necesite una cuenta independiente.

## Reutilización de Anthropic Claude CLI

OpenClaw admite la reutilización de Anthropic Claude CLI y `claude -p` como una vía de
autenticación autorizada. Si ya existe un inicio de sesión local de Claude en el host,
el proceso de incorporación/configuración puede reutilizarlo directamente. El token de configuración de Anthropic sigue
disponible como vía compatible de autenticación mediante token, pero OpenClaw prefiere reutilizar Claude CLI
cuando está disponible.

<Warning>
La documentación pública de Claude Code de Anthropic indica que el uso directo de Claude Code se mantiene dentro de
los límites de la suscripción a Claude, y el personal de Anthropic nos comunicó que el uso de Claude
CLI al estilo de OpenClaw vuelve a estar permitido. Por tanto, OpenClaw considera que la reutilización de Claude CLI y
el uso de `claude -p` están autorizados para esta integración, a menos que Anthropic
publique una nueva política.

Para consultar la documentación actual de Anthropic sobre los planes para el uso directo de Claude Code, consulte [Uso de Claude Code
con el plan Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
y [Uso de Claude Code con el plan Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Para conocer otras opciones basadas en suscripción en OpenClaw, consulte [OpenAI
Codex](/es/providers/openai), [Plan de programación de Qwen Cloud](/es/providers/qwen), [Plan de programación de MiniMax](/es/providers/minimax)
y [Plan de programación de Z.AI/GLM](/es/providers/zai).
</Warning>

## Intercambio de OAuth (cómo funciona el inicio de sesión)

Los flujos interactivos de inicio de sesión de OpenClaw están implementados en `openclaw/plugin-sdk/llm.ts` y conectados con los asistentes y comandos.

### Token de configuración de Anthropic

Estructura del flujo:

1. cree el token ejecutando `claude setup-token` en cualquier máquina con Claude Code y, después, inicie el flujo de token de configuración de Anthropic o pegue el token desde OpenClaw
2. OpenClaw almacena la credencial de Anthropic resultante en un perfil de autenticación
3. la selección del modelo permanece en `anthropic/...`
4. los perfiles de autenticación de Anthropic existentes siguen disponibles para controlar la reversión y el orden

### OpenAI Codex (OAuth de ChatGPT)

El OAuth de OpenAI Codex admite explícitamente su uso fuera de Codex CLI, incluidos los flujos de trabajo de OpenClaw.

El comando de inicio de sesión utiliza el identificador de proveedor canónico de OpenAI:

```bash
openclaw models auth login --provider openai
```

Use `--profile-id openai:<name>` para varias cuentas de OAuth de ChatGPT/Codex en
un mismo agente. No use `openai-codex:<name>` para perfiles nuevos. Doctor migra
ese prefijo anterior a un identificador de perfil `openai:*` sin colisiones; ejecute
`openclaw models auth list --provider openai` después de la reparación y antes de copiar
los identificadores de perfil en `auth.order` o `/model ...@<profileId>`.

Estructura del flujo (PKCE):

1. genere un verificador/desafío PKCE y un `state` aleatorio
2. abra `https://auth.openai.com/oauth/authorize?...` (ámbito
   `openid profile email offline_access`)
3. intente capturar la devolución de llamada en `http://localhost:1455/auth/callback` (el
   host de devolución de llamada tiene como valor predeterminado `localhost` y solo acepta hosts de bucle invertido;
   reemplácelo con `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. si puede pegar un código antes de que llegue la devolución de llamada (o el entorno es
   remoto/sin interfaz gráfica y la devolución de llamada no puede vincularse), pegue en su lugar la URL o el código de redirección;
   el pegado manual compite con la devolución de llamada del navegador y prevalece el que
   finalice primero
5. intercambie el código en `https://auth.openai.com/oauth/token`
6. extraiga `accountId` del token de acceso y almacene `{ access, refresh, expires, accountId }`

La ruta del asistente es `openclaw onboard` → opción de autenticación `openai`.

## Actualización + caducidad

Los perfiles almacenan una marca de tiempo `expires`. En tiempo de ejecución:

- si `expires` está en el futuro, use el token de acceso almacenado
- si ha caducado, actualícelo (con un bloqueo de archivo) y sobrescriba las credenciales almacenadas
- si un agente secundario lee un perfil de OAuth heredado del agente principal, la
  actualización se escribe en el almacén del agente principal en lugar de copiar el token de actualización
  en el almacén del agente secundario
- las credenciales de CLI gestionadas externamente (Claude CLI, inicialización limitada desde Codex CLI;
  consulte [El sumidero de tokens](#the-token-sink-why-it-exists)) se vuelven a leer en lugar de
  consumir un token de actualización copiado. Si falla una actualización gestionada, OpenClaw
  indica que el perfil afectado requiere una nueva autenticación en lugar de devolver
  material de tokens de una CLI externa.

El flujo de actualización es automático; por lo general, no es necesario gestionar los tokens manualmente.

## Varias cuentas (perfiles) + enrutamiento

Dos patrones:

### 1) Opción preferida: agentes separados

Si se desea que las cuentas «personal» y «trabajo» nunca interactúen, use agentes aislados (sesiones + credenciales + espacios de trabajo separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Después, configure la autenticación por agente (asistente) y dirija los chats al agente adecuado.

### 2) Opción avanzada: varios perfiles en un agente

El almacén de perfiles de autenticación admite varios identificadores de perfil para el mismo proveedor.
Seleccione cuál se utiliza:

- globalmente mediante el orden de configuración (`auth.order`)
- por sesión mediante `/model ...@<profileId>`

Ejemplo (reemplazo de sesión):

- `/model Opus@anthropic:work`

Enumere los identificadores de perfil existentes con:

```bash
openclaw models auth list --provider <id>
```

Documentación relacionada:

- [Conmutación por error de modelos](/es/concepts/model-failover) (reglas de rotación + tiempo de espera)
- [Comandos de barra](/es/tools/slash-commands) (superficie de comandos)

## Contenido relacionado

- [Autenticación](/es/gateway/authentication) - descripción general de la autenticación de proveedores de modelos
- [Secretos](/es/gateway/secrets) - almacenamiento de credenciales y SecretRef
- [Referencia de configuración](/es/gateway/configuration-reference#auth-storage) - claves de configuración de autenticación
