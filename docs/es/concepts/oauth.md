---
read_when:
    - Quieres entender OAuth de OpenClaw de extremo a extremo
    - Te encontraste con problemas de invalidación de tokens / cierre de sesión
    - Quieres flujos de autenticación de Claude CLI u OAuth
    - Quieres varias cuentas o enrutamiento por perfil
summary: 'OAuth en OpenClaw: intercambio de tokens, almacenamiento y patrones de varias cuentas'
title: OAuth
x-i18n:
    generated_at: "2026-04-24T05:26:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw admite “autenticación por suscripción” mediante OAuth para proveedores que la ofrecen
(en particular **OpenAI Codex (OAuth de ChatGPT)**). Para Anthropic, la división práctica
ahora es:

- **Clave API de Anthropic**: facturación normal de la API de Anthropic
- **Claude CLI de Anthropic / autenticación por suscripción dentro de OpenClaw**: el personal de Anthropic
  nos dijo que este uso vuelve a estar permitido

OpenAI Codex OAuth es explícitamente compatible para su uso en herramientas externas como
OpenClaw. Esta página explica:

Para Anthropic en producción, la autenticación con clave API es la ruta recomendada y más segura.

- cómo funciona el **intercambio de tokens** de OAuth (PKCE)
- dónde se **almacenan** los tokens (y por qué)
- cómo manejar **varias cuentas** (perfiles + sobrescrituras por sesión)

OpenClaw también admite **Plugins de proveedor** que incluyen sus propios flujos
de OAuth o clave API. Ejecútalos mediante:

```bash
openclaw models auth login --provider <id>
```

## El sumidero de tokens (por qué existe)

Los proveedores OAuth suelen emitir un **nuevo refresh token** durante los flujos de inicio de sesión/actualización. Algunos proveedores (o clientes OAuth) pueden invalidar refresh tokens anteriores cuando se emite uno nuevo para el mismo usuario/app.

Síntoma práctico:

- inicias sesión mediante OpenClaw _y_ mediante Claude Code / Codex CLI → uno de ellos acaba “cerrando la sesión” aleatoriamente más tarde

Para reducir eso, OpenClaw trata `auth-profiles.json` como un **sumidero de tokens**:

- el tiempo de ejecución lee las credenciales desde **un único lugar**
- podemos mantener varios perfiles y enrutarlos de forma determinista
- cuando las credenciales se reutilizan desde una CLI externa como Codex CLI, OpenClaw
  las replica con procedencia y vuelve a leer esa fuente externa en lugar de
  rotar por sí mismo el refresh token

## Almacenamiento (dónde viven los tokens)

Los secretos se almacenan **por agente**:

- Perfiles de autenticación (OAuth + claves API + refs opcionales a nivel de valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Archivo heredado de compatibilidad: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (las entradas estáticas `api_key` se limpian cuando se detectan)

Archivo heredado solo de importación (sigue siendo compatible, pero no es el almacén principal):

- `~/.openclaw/credentials/oauth.json` (se importa a `auth-profiles.json` en el primer uso)

Todo lo anterior también respeta `$OPENCLAW_STATE_DIR` (sobrescritura del directorio de estado). Referencia completa: [/gateway/configuration](/es/gateway/configuration-reference#auth-storage)

Para refs de secretos estáticos y el comportamiento de activación de instantáneas en tiempo de ejecución, consulta [Gestión de secretos](/es/gateway/secrets).

## Compatibilidad heredada con tokens de Anthropic

<Warning>
La documentación pública de Claude Code de Anthropic dice que el uso directo de Claude Code permanece dentro de
los límites de suscripción de Claude, y el personal de Anthropic nos dijo que el uso de Claude
CLI al estilo OpenClaw vuelve a estar permitido. Por lo tanto, OpenClaw trata la reutilización de Claude CLI y
el uso de `claude -p` como autorizados para esta integración, salvo que Anthropic
publique una nueva política.

Para la documentación actual de Anthropic sobre los planes directos de Claude Code, consulta [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
y [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si quieres otras opciones de tipo suscripción en OpenClaw, consulta [OpenAI
Codex](/es/providers/openai), [Qwen Cloud Coding
Plan](/es/providers/qwen), [MiniMax Coding Plan](/es/providers/minimax),
y [Z.AI / GLM Coding Plan](/es/providers/glm).
</Warning>

OpenClaw también expone setup-token de Anthropic como una ruta compatible de autenticación por token, pero ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.

## Migración de Anthropic Claude CLI

OpenClaw vuelve a admitir la reutilización de Anthropic Claude CLI. Si ya tienes un inicio de sesión local
de Claude en el host, onboarding/configure puede reutilizarlo directamente.

## Intercambio de OAuth (cómo funciona el inicio de sesión)

Los flujos interactivos de inicio de sesión de OpenClaw están implementados en `@mariozechner/pi-ai` y conectados a los asistentes/comandos.

### Setup-token de Anthropic

Forma del flujo:

1. iniciar setup-token de Anthropic o pegar token desde OpenClaw
2. OpenClaw almacena la credencial resultante de Anthropic en un perfil de autenticación
3. la selección de modelo permanece en `anthropic/...`
4. los perfiles de autenticación existentes de Anthropic siguen disponibles para control de reversión/orden

### OpenAI Codex (OAuth de ChatGPT)

OpenAI Codex OAuth es explícitamente compatible para su uso fuera de Codex CLI, incluidos los flujos de trabajo de OpenClaw.

Forma del flujo (PKCE):

1. generar verificador/desafío PKCE + `state` aleatorio
2. abrir `https://auth.openai.com/oauth/authorize?...`
3. intentar capturar la devolución de llamada en `http://127.0.0.1:1455/auth/callback`
4. si no se puede enlazar la devolución de llamada (o estás en remoto/sin interfaz), pegar la URL/código de redirección
5. intercambiar en `https://auth.openai.com/oauth/token`
6. extraer `accountId` del access token y almacenar `{ access, refresh, expires, accountId }`

La ruta del asistente es `openclaw onboard` → opción de autenticación `openai-codex`.

## Actualización + caducidad

Los perfiles almacenan una marca de tiempo `expires`.

En tiempo de ejecución:

- si `expires` está en el futuro → usar el access token almacenado
- si está caducado → actualizar (bajo un bloqueo de archivo) y sobrescribir las credenciales almacenadas
- excepción: las credenciales reutilizadas de una CLI externa siguen gestionadas externamente; OpenClaw
  vuelve a leer el almacén de autenticación de la CLI y nunca consume por sí mismo el refresh token copiado

El flujo de actualización es automático; por lo general no necesitas gestionar los tokens manualmente.

## Varias cuentas (perfiles) + enrutamiento

Dos patrones:

### 1) Preferido: agentes separados

Si quieres que “personal” y “trabajo” nunca interactúen, usa agentes aislados (sesiones + credenciales + espacio de trabajo separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Luego configura la autenticación por agente (asistente) y enruta los chats al agente correcto.

### 2) Avanzado: varios perfiles en un agente

`auth-profiles.json` admite varios ID de perfil para el mismo proveedor.

Elige qué perfil se usa:

- globalmente mediante el orden de configuración (`auth.order`)
- por sesión mediante `/model ...@<profileId>`

Ejemplo (sobrescritura por sesión):

- `/model Opus@anthropic:work`

Cómo ver qué ID de perfil existen:

- `openclaw channels list --json` (muestra `auth[]`)

Documentación relacionada:

- [/concepts/model-failover](/es/concepts/model-failover) (reglas de rotación + enfriamiento)
- [/tools/slash-commands](/es/tools/slash-commands) (superficie de comandos)

## Relacionado

- [Autenticación](/es/gateway/authentication) — descripción general de autenticación de proveedores de modelos
- [Secretos](/es/gateway/secrets) — almacenamiento de credenciales y SecretRef
- [Referencia de configuración](/es/gateway/configuration-reference#auth-storage) — claves de configuración de autenticación
