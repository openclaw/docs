---
read_when:
    - Quieres entender OAuth de OpenClaw de extremo a extremo
    - Tienes problemas de invalidación de tokens / cierre de sesión
    - Desea flujos de autenticación de Claude CLI u OAuth
    - Quieres varias cuentas o enrutamiento de perfiles
summary: 'OAuth en OpenClaw: intercambio de tokens, almacenamiento y patrones multicuenta'
title: OAuth
x-i18n:
    generated_at: "2026-07-05T11:15:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw admite OAuth ("autenticación por suscripción") para los proveedores que lo ofrecen,
en particular **OpenAI Codex (OAuth de ChatGPT)** y **reutilización de Anthropic Claude CLI**.
Para Anthropic, la división práctica es:

- **Clave de API de Anthropic**: facturación normal de la API de Anthropic.
- **Anthropic Claude CLI / autenticación por suscripción dentro de OpenClaw**: el personal de Anthropic
  nos indicó que este uso vuelve a estar permitido, por lo que OpenClaw trata la reutilización de Claude CLI y
  el uso de `claude -p` como autorizados para esta integración, salvo que Anthropic
  publique una nueva política. Para Anthropic en producción, la autenticación con clave de API sigue siendo
  la ruta recomendada más segura.

OpenClaw almacena tanto la autenticación con clave de API de OpenAI como OAuth de ChatGPT/Codex bajo el
id de proveedor canónico `openai`. Los ids de perfil `openai-codex:*` antiguos y las entradas
`auth.order.openai-codex` son estado heredado que repara
`openclaw doctor --fix`; usa ids de perfil `openai:*` y `auth.order.openai` para
configuración nueva.

Esta página cubre:

- cómo funciona el **intercambio de tokens** OAuth (PKCE)
- dónde se **almacenan** los tokens (y por qué)
- cómo manejar **varias cuentas** (perfiles + anulaciones por sesión)

Los Plugins de proveedor que incluyen su propio flujo de OAuth o clave de API pasan por el
mismo punto de entrada:

```bash
openclaw models auth login --provider <id>
```

## El sumidero de tokens (por qué existe)

Los proveedores OAuth suelen emitir un token de actualización nuevo en cada inicio de sesión/actualización.
Algunos proveedores invalidan el token de actualización anterior cuando se emite uno nuevo
para el mismo usuario/aplicación. Síntoma práctico: inicia sesión mediante OpenClaw _y_
mediante Claude Code / Codex CLI, y uno de ellos se desconecta aleatoriamente más tarde.

Para reducir eso, OpenClaw trata el almacén de perfiles de autenticación como un **sumidero de tokens**:

- el runtime lee credenciales desde un único lugar por agente
- varios perfiles pueden coexistir y enrutarse de forma determinista
- la reutilización de CLI externa es específica del proveedor: una vez que OpenClaw posee un perfil OAuth
  local para un proveedor, el token de actualización local es canónico. Si ese token de actualización local
  se rechaza, OpenClaw informa el perfil para
  volver a autenticarse en lugar de recurrir al material de tokens de la CLI externa.
  El arranque de Codex CLI es aún más restringido: solo puede inicializar un perfil vacío de estilo
  `openai:default` antes de que OpenClaw posea OAuth para ese
  proveedor; después de eso, las actualizaciones propiedad de OpenClaw siguen siendo canónicas
- las rutas de estado/inicio limitan la detección de CLI externa al conjunto de proveedores
  ya configurado, por lo que no se sondea un almacén de inicio de sesión de CLI no relacionado para una
  configuración de un solo proveedor

## Almacenamiento (dónde viven los tokens)

Los secretos viven por agente, identificados por el nombre lógico `auth-profiles.json` (el
almacén subyacente es la base de datos SQLite del agente; el nombre JSON se conserva por
compatibilidad y visualización en herramientas):

- Perfiles de autenticación (OAuth + claves de API + referencias opcionales a nivel de valor):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Archivo de compatibilidad heredado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (las entradas estáticas `api_key` se limpian cuando se descubren)

Archivo heredado solo de importación (aún compatible, pero no es el almacén principal):

- `~/.openclaw/credentials/oauth.json` (importado al almacén de perfiles de autenticación en el primer uso)

Todo lo anterior también respeta `$OPENCLAW_STATE_DIR` (anulación del directorio de estado). Referencia completa: [/gateway/configuration-reference#auth-storage](/es/gateway/configuration-reference#auth-storage)

Para referencias estáticas de secretos y el comportamiento de activación de instantáneas de runtime, consulta [Gestión de secretos](/es/gateway/secrets).

Cuando un agente secundario no tiene un perfil de autenticación local, OpenClaw usa herencia de lectura directa
desde el almacén del agente predeterminado/principal; no clona el almacén principal
del agente al leer. Los tokens de actualización OAuth son especialmente sensibles: los flujos de copia normales
los omiten de forma predeterminada porque algunos proveedores rotan o invalidan
los tokens de actualización después del uso. Configura un inicio de sesión OAuth separado para un agente cuando
necesite una cuenta independiente.

## Reutilización de Anthropic Claude CLI

OpenClaw admite la reutilización de Anthropic Claude CLI y `claude -p` como una ruta de
autenticación autorizada. Si ya tienes un inicio de sesión local de Claude en el host,
onboarding/configure puede reutilizarlo directamente. El token de configuración de Anthropic sigue
disponible como ruta de autenticación por token compatible, pero OpenClaw prefiere la reutilización de Claude CLI
cuando está disponible.

<Warning>
La documentación pública de Claude Code de Anthropic dice que el uso directo de Claude Code se mantiene dentro de
los límites de suscripción de Claude, y el personal de Anthropic nos indicó que el uso de Claude
CLI al estilo OpenClaw vuelve a estar permitido. Por lo tanto, OpenClaw trata la reutilización de Claude CLI y
el uso de `claude -p` como autorizados para esta integración, salvo que Anthropic
publique una nueva política.

Para la documentación actual de Anthropic sobre planes directos de Claude Code, consulta [Usar Claude Code
con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
y [Usar Claude Code con tu plan Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si quieres otras opciones de estilo suscripción en OpenClaw, consulta [OpenAI
Codex](/es/providers/openai), [Qwen Cloud Coding
Plan](/es/providers/qwen), [MiniMax Coding Plan](/es/providers/minimax),
y [Z.AI / GLM Coding Plan](/es/providers/zai).
</Warning>

## Intercambio OAuth (cómo funciona el inicio de sesión)

Los flujos de inicio de sesión interactivos de OpenClaw se implementan en `openclaw/plugin-sdk/llm.ts` y se conectan con los asistentes/comandos.

### Token de configuración de Anthropic

Forma del flujo:

1. inicia el token de configuración de Anthropic o pega un token desde OpenClaw
2. OpenClaw almacena la credencial de Anthropic resultante en un perfil de autenticación
3. la selección de modelo permanece en `anthropic/...`
4. los perfiles de autenticación de Anthropic existentes siguen disponibles para control de reversión/orden

### OpenAI Codex (OAuth de ChatGPT)

OAuth de OpenAI Codex se admite explícitamente para su uso fuera de Codex CLI, incluidos los flujos de trabajo de OpenClaw.

El comando de inicio de sesión usa el id de proveedor canónico de OpenAI:

```bash
openclaw models auth login --provider openai
```

Usa `--profile-id openai:<name>` para varias cuentas OAuth de ChatGPT/Codex en
un agente. No uses `openai-codex:<name>` para perfiles nuevos. Doctor migra
ese prefijo antiguo a un id de perfil `openai:*` sin colisiones; ejecuta
`openclaw models auth list --provider openai` después de la reparación antes de copiar
ids de perfil en `auth.order` o `/model ...@<profileId>`.

Forma del flujo (PKCE):

1. genera un verificador/desafío PKCE y un `state` aleatorio
2. abre `https://auth.openai.com/oauth/authorize?...` (alcance
   `openid profile email offline_access`)
3. intenta capturar la devolución de llamada en `http://localhost:1455/auth/callback` (el
   host de devolución de llamada predeterminado es `localhost` y solo acepta hosts de loopback;
   anúlalo con `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. si puedes pegar un código antes de que llegue la devolución de llamada (o estás en remoto/sin interfaz y la devolución de llamada no puede enlazarse), pega la URL/código de redirección
   en su lugar; el pegado manual compite con la devolución de llamada del navegador y gana lo que se complete
   primero
5. intercambia el código en `https://auth.openai.com/oauth/token`
6. extrae `accountId` del token de acceso y almacena `{ access, refresh, expires, accountId }`

La ruta del asistente es `openclaw onboard` → elección de autenticación `openai`.

## Actualización + caducidad

Los perfiles almacenan una marca de tiempo `expires`. En runtime:

- si `expires` está en el futuro, usa el token de acceso almacenado
- si caducó, actualiza (bajo un bloqueo de archivo) y sobrescribe las credenciales almacenadas
- si un agente secundario lee un perfil OAuth heredado del agente principal, la
  actualización escribe de vuelta en el almacén del agente principal en lugar de copiar el token de actualización
  en el almacén del agente secundario
- las credenciales de CLI gestionadas externamente (Claude CLI, arranque restringido de Codex CLI;
  consulta [El sumidero de tokens](#the-token-sink-why-it-exists)) se vuelven a leer en lugar de
  gastar un token de actualización copiado. Si una actualización gestionada falla, OpenClaw
  informa el perfil afectado para volver a autenticarse en lugar de devolver
  material de tokens de la CLI externa.

El flujo de actualización es automático; por lo general no necesitas gestionar tokens manualmente.

## Varias cuentas (perfiles) + enrutamiento

Dos patrones:

### 1) Preferido: agentes separados

Si quieres que "personal" y "trabajo" nunca interactúen, usa agentes aislados (sesiones + credenciales + workspace separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Luego configura la autenticación por agente (asistente) y enruta los chats al agente correcto.

### 2) Avanzado: varios perfiles en un agente

El almacén de perfiles de autenticación admite varios IDs de perfil para el mismo proveedor.
Elige cuál se usa:

- globalmente mediante ordenación de configuración (`auth.order`)
- por sesión mediante `/model ...@<profileId>`

Ejemplo (anulación de sesión):

- `/model Opus@anthropic:work`

Lista los IDs de perfil existentes con:

```bash
openclaw models auth list --provider <id>
```

Documentación relacionada:

- [Conmutación por error de modelos](/es/concepts/model-failover) (reglas de rotación + enfriamiento)
- [Comandos Slash](/es/tools/slash-commands) (superficie de comandos)

## Relacionado

- [Autenticación](/es/gateway/authentication) - resumen de autenticación de proveedores de modelos
- [Secretos](/es/gateway/secrets) - almacenamiento de credenciales y SecretRef
- [Referencia de configuración](/es/gateway/configuration-reference#auth-storage) - claves de configuración de autenticación
