---
read_when:
    - Quieres entender OAuth de OpenClaw de principio a fin
    - Tienes problemas de invalidación de tokens / cierre de sesión
    - Quieres usar flujos de autenticación de Claude CLI u OAuth
    - Quiere varias cuentas o enrutamiento de perfiles
summary: 'OAuth en OpenClaw: intercambio de tokens, almacenamiento y patrones para varias cuentas'
title: OAuth
x-i18n:
    generated_at: "2026-04-30T05:38:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw admite “autenticación de suscripción” mediante OAuth para proveedores que la ofrecen
(en particular **OpenAI Codex (ChatGPT OAuth)**). Para Anthropic, la división práctica
ahora es:

- **clave API de Anthropic**: facturación normal de la API de Anthropic
- **Anthropic Claude CLI / autenticación de suscripción dentro de OpenClaw**: el personal de Anthropic
  nos dijo que este uso vuelve a estar permitido

OpenAI Codex OAuth es compatible explícitamente para usarse en herramientas externas como
OpenClaw. Esta página explica:

Para Anthropic en producción, la autenticación con clave API es la vía recomendada más segura.

- cómo funciona el **intercambio de tokens** de OAuth (PKCE)
- dónde se **almacenan** los tokens (y por qué)
- cómo gestionar **varias cuentas** (perfiles + sobrescrituras por sesión)

OpenClaw también admite **plugins de proveedor** que incluyen sus propios flujos OAuth o de clave API.
Ejecútalos mediante:

```bash
openclaw models auth login --provider <id>
```

## El sumidero de tokens (por qué existe)

Los proveedores OAuth suelen emitir un **nuevo token de actualización** durante los flujos de inicio de sesión/actualización. Algunos proveedores (o clientes OAuth) pueden invalidar tokens de actualización anteriores cuando se emite uno nuevo para el mismo usuario/aplicación.

Síntoma práctico:

- inicias sesión mediante OpenClaw _y_ mediante Claude Code / Codex CLI → uno de ellos queda “desconectado” aleatoriamente más tarde

Para reducir eso, OpenClaw trata `auth-profiles.json` como un **sumidero de tokens**:

- el runtime lee credenciales desde **un solo lugar**
- podemos conservar varios perfiles y encaminarlos de forma determinista
- la reutilización de CLI externas es específica de cada proveedor: Codex CLI puede inicializar un perfil
  `openai-codex:default` vacío, pero una vez que OpenClaw tiene un perfil OAuth local,
  el token de actualización local es canónico; otras integraciones pueden permanecer
  gestionadas externamente y volver a leer su almacén de autenticación de CLI
- las rutas de estado e inicio que ya conocen el conjunto de proveedores configurado acotan
  el descubrimiento de CLI externas a ese conjunto, de modo que no se sondea un almacén de inicio de sesión
  de CLI no relacionado para una configuración de un solo proveedor

## Almacenamiento (dónde viven los tokens)

Los secretos se almacenan en los almacenes de autenticación del agente:

- Perfiles de autenticación (OAuth + claves API + referencias opcionales a nivel de valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Archivo de compatibilidad heredado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (las entradas estáticas `api_key` se eliminan cuando se descubren)

Archivo heredado solo de importación (sigue siendo compatible, pero no es el almacén principal):

- `~/.openclaw/credentials/oauth.json` (importado a `auth-profiles.json` en el primer uso)

Todo lo anterior también respeta `$OPENCLAW_STATE_DIR` (sobrescritura del directorio de estado). Referencia completa: [/gateway/configuration](/es/gateway/configuration-reference#auth-storage)

Para referencias a secretos estáticos y el comportamiento de activación de instantáneas en runtime, consulta [Gestión de secretos](/es/gateway/secrets).

Cuando un agente secundario no tiene perfil de autenticación local, OpenClaw usa herencia
de lectura directa desde el almacén del agente predeterminado/principal. No clona el
`auth-profiles.json` del agente principal al leer. Los tokens de actualización OAuth son especialmente
sensibles: los flujos normales de copia los omiten de forma predeterminada porque algunos proveedores rotan
o invalidan los tokens de actualización después de usarlos. Configura un inicio de sesión OAuth separado para un
agente cuando necesite una cuenta independiente.

## Compatibilidad con tokens heredados de Anthropic

<Warning>
La documentación pública de Claude Code de Anthropic dice que el uso directo de Claude Code permanece dentro de
los límites de la suscripción de Claude, y el personal de Anthropic nos dijo que el uso de Claude
CLI al estilo OpenClaw vuelve a estar permitido. Por lo tanto, OpenClaw trata la reutilización de Claude CLI y
el uso de `claude -p` como aprobados para esta integración salvo que Anthropic
publique una política nueva.

Para la documentación actual de planes de uso directo de Claude Code de Anthropic, consulta [Usar Claude Code
con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
y [Usar Claude Code con tu plan Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si quieres otras opciones de estilo suscripción en OpenClaw, consulta [OpenAI
Codex](/es/providers/openai), [Qwen Cloud Coding
Plan](/es/providers/qwen), [MiniMax Coding Plan](/es/providers/minimax),
y [Z.AI / GLM Coding Plan](/es/providers/glm).
</Warning>

OpenClaw también expone el token de configuración de Anthropic como una ruta de autenticación con token compatible, pero ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.

## Migración de Anthropic Claude CLI

OpenClaw vuelve a admitir la reutilización de Anthropic Claude CLI. Si ya tienes un inicio de sesión local
de Claude en el host, onboarding/configure puede reutilizarlo directamente.

## Intercambio OAuth (cómo funciona el inicio de sesión)

Los flujos de inicio de sesión interactivo de OpenClaw están implementados en `@mariozechner/pi-ai` y conectados a los asistentes/comandos.

### Token de configuración de Anthropic

Forma del flujo:

1. inicia el token de configuración o el pegado de token de Anthropic desde OpenClaw
2. OpenClaw almacena la credencial de Anthropic resultante en un perfil de autenticación
3. la selección de modelo permanece en `anthropic/...`
4. los perfiles de autenticación de Anthropic existentes siguen disponibles para control de reversión/orden

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth es compatible explícitamente para usarse fuera de Codex CLI, incluidos los flujos de trabajo de OpenClaw.

Forma del flujo (PKCE):

1. generar verificador/desafío PKCE + `state` aleatorio
2. abrir `https://auth.openai.com/oauth/authorize?...`
3. intentar capturar la devolución de llamada en `http://127.0.0.1:1455/auth/callback`
4. si la devolución de llamada no puede enlazarse (o estás en remoto/sin interfaz), pega la URL/código de redirección
5. intercambiar en `https://auth.openai.com/oauth/token`
6. extraer `accountId` del token de acceso y almacenar `{ access, refresh, expires, accountId }`

La ruta del asistente es `openclaw onboard` → opción de autenticación `openai-codex`.

## Actualización + caducidad

Los perfiles almacenan una marca de tiempo `expires`.

En runtime:

- si `expires` está en el futuro → usar el token de acceso almacenado
- si ha caducado → actualizar (bajo un bloqueo de archivo) y sobrescribir las credenciales almacenadas
- si un agente secundario lee un perfil OAuth heredado del agente principal, la actualización
  escribe de vuelta en el almacén del agente principal en lugar de copiar el token de actualización al
  almacén del agente secundario
- excepción: algunas credenciales de CLI externas permanecen gestionadas externamente; OpenClaw
  vuelve a leer esos almacenes de autenticación de CLI en lugar de gastar tokens de actualización copiados.
  La inicialización desde Codex CLI es intencionadamente más limitada: siembra un perfil
  `openai-codex:default` vacío, y luego las actualizaciones propiedad de OpenClaw mantienen canónico el
  perfil local.

El flujo de actualización es automático; por lo general no necesitas gestionar tokens manualmente.

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

`auth-profiles.json` admite varios IDs de perfil para el mismo proveedor.

Elige qué perfil se usa:

- globalmente mediante el orden de configuración (`auth.order`)
- por sesión mediante `/model ...@<profileId>`

Ejemplo (sobrescritura de sesión):

- `/model Opus@anthropic:work`

Cómo ver qué IDs de perfil existen:

- `openclaw channels list --json` (muestra `auth[]`)

Documentación relacionada:

- [Conmutación por error de modelos](/es/concepts/model-failover) (reglas de rotación + enfriamiento)
- [Comandos de barra](/es/tools/slash-commands) (superficie de comandos)

## Relacionado

- [Autenticación](/es/gateway/authentication) — resumen de autenticación de proveedores de modelos
- [Secretos](/es/gateway/secrets) — almacenamiento de credenciales y SecretRef
- [Referencia de configuración](/es/gateway/configuration-reference#auth-storage) — claves de configuración de autenticación
