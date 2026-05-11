---
read_when:
    - Quieres comprender OAuth de OpenClaw de extremo a extremo
    - Tienes problemas de invalidación de tokens / cierre de sesión
    - Quiere flujos de autenticación de Claude CLI u OAuth
    - Quieres varias cuentas o enrutamiento de perfiles
summary: 'OAuth en OpenClaw: intercambio de tokens, almacenamiento y patrones multicuenta'
title: OAuth
x-i18n:
    generated_at: "2026-05-11T20:31:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a7382fbcbe7e6034057da66a2dd8685df6d9345c36eeb8261eb12440d00a402
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw admite "autenticación de suscripción" mediante OAuth para proveedores que la ofrecen
(en particular **OpenAI Codex (ChatGPT OAuth)**). Para Anthropic, la división práctica
ahora es:

- **clave de API de Anthropic**: facturación normal de la API de Anthropic
- **Claude CLI de Anthropic / autenticación de suscripción dentro de OpenClaw**: el personal de Anthropic
  nos dijo que este uso está permitido de nuevo

OpenAI Codex OAuth está admitido explícitamente para su uso en herramientas externas como
OpenClaw. Esta página explica:

Para Anthropic en producción, la autenticación con clave de API es la ruta recomendada más segura.

- cómo funciona el **intercambio de tokens** de OAuth (PKCE)
- dónde se **almacenan** los tokens (y por qué)
- cómo gestionar **varias cuentas** (perfiles + anulaciones por sesión)

OpenClaw también admite **plugins de proveedor** que incluyen sus propios flujos de OAuth o de clave de API. Ejecútalos con:

```bash
openclaw models auth login --provider <id>
```

## El sumidero de tokens (por qué existe)

Los proveedores de OAuth suelen emitir un **nuevo refresh token** durante los flujos de inicio de sesión/actualización. Algunos proveedores (o clientes OAuth) pueden invalidar refresh tokens anteriores cuando se emite uno nuevo para el mismo usuario/aplicación.

Síntoma práctico:

- inicias sesión mediante OpenClaw _y_ mediante Claude Code / Codex CLI → uno de ellos queda "desconectado" aleatoriamente más tarde

Para reducir eso, OpenClaw trata `auth-profiles.json` como un **sumidero de tokens**:

- el entorno de ejecución lee credenciales desde **un solo lugar**
- podemos mantener varios perfiles y enrutarlos de forma determinista
- la reutilización de CLI externos es específica del proveedor: Codex CLI puede inicializar un perfil vacío
  `openai-codex:default`, pero una vez que OpenClaw tiene un perfil OAuth local,
  el refresh token local es canónico; otras integraciones pueden seguir
  gestionadas externamente y volver a leer su almacén de autenticación de CLI
- las rutas de estado e inicio que ya conocen el conjunto de proveedores configurados limitan
  el descubrimiento de CLI externos a ese conjunto, para que no se sondee un almacén de inicio de sesión
  de CLI no relacionado en una configuración de un solo proveedor

## Almacenamiento (dónde viven los tokens)

Los secretos se almacenan en los almacenes de autenticación del agente:

- Perfiles de autenticación (OAuth + claves de API + refs opcionales a nivel de valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Archivo de compatibilidad heredada: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (las entradas estáticas `api_key` se depuran cuando se descubren)

Archivo heredado solo de importación (todavía admitido, pero no es el almacén principal):

- `~/.openclaw/credentials/oauth.json` (se importa a `auth-profiles.json` en el primer uso)

Todo lo anterior también respeta `$OPENCLAW_STATE_DIR` (anulación del directorio de estado). Referencia completa: [/gateway/configuration](/es/gateway/configuration-reference#auth-storage)

Para refs de secretos estáticos y el comportamiento de activación de instantáneas en tiempo de ejecución, consulta [Gestión de secretos](/es/gateway/secrets).

Cuando un agente secundario no tiene un perfil de autenticación local, OpenClaw usa herencia de lectura directa
desde el almacén del agente predeterminado/principal. No clona el
`auth-profiles.json` del agente principal al leer. Los refresh tokens de OAuth son especialmente
sensibles: los flujos normales de copia los omiten de forma predeterminada porque algunos proveedores rotan
o invalidan refresh tokens después de usarlos. Configura un inicio de sesión OAuth separado para un
agente cuando necesite una cuenta independiente.

## Compatibilidad con tokens heredados de Anthropic

<Warning>
Los documentos públicos de Claude Code de Anthropic dicen que el uso directo de Claude Code permanece dentro de
los límites de suscripción de Claude, y el personal de Anthropic nos dijo que el uso de Claude
CLI al estilo OpenClaw está permitido de nuevo. Por lo tanto, OpenClaw trata la reutilización de Claude CLI y
el uso de `claude -p` como autorizados para esta integración salvo que Anthropic
publique una nueva política.

Para la documentación actual de planes directos de Claude Code de Anthropic, consulta [Usar Claude Code
con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
y [Usar Claude Code con tu plan Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si quieres otras opciones de estilo suscripción en OpenClaw, consulta [OpenAI
Codex](/es/providers/openai), [Plan de codificación en la nube de Qwen](/es/providers/qwen), [Plan de codificación de MiniMax](/es/providers/minimax),
y [Plan de codificación Z.AI / GLM](/es/providers/glm).
</Warning>

OpenClaw también expone el token de configuración de Anthropic como una ruta de autenticación con token admitida, pero ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.

## Migración de Claude CLI de Anthropic

OpenClaw vuelve a admitir la reutilización de Claude CLI de Anthropic. Si ya tienes un inicio de sesión local
de Claude en el host, onboarding/configure puede reutilizarlo directamente.

## Intercambio OAuth (cómo funciona el inicio de sesión)

Los flujos de inicio de sesión interactivo de OpenClaw están implementados en `@earendil-works/pi-ai` y conectados a los asistentes/comandos.

### Token de configuración de Anthropic

Forma del flujo:

1. inicia el token de configuración de Anthropic o pega el token desde OpenClaw
2. OpenClaw almacena la credencial de Anthropic resultante en un perfil de autenticación
3. la selección de modelo permanece en `anthropic/...`
4. los perfiles de autenticación existentes de Anthropic siguen disponibles para control de reversión/orden

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth está admitido explícitamente para su uso fuera de Codex CLI, incluidos los flujos de trabajo de OpenClaw.

Forma del flujo (PKCE):

1. genera el verificador/desafío PKCE + `state` aleatorio
2. abre `https://auth.openai.com/oauth/authorize?...`
3. intenta capturar la devolución de llamada en `http://127.0.0.1:1455/auth/callback`
4. si la devolución de llamada no puede enlazarse (o estás en remoto/sin interfaz), pega la URL/código de redirección
5. intercambia en `https://auth.openai.com/oauth/token`
6. extrae `accountId` del token de acceso y almacena `{ access, refresh, expires, accountId }`

La ruta del asistente es `openclaw onboard` → elección de autenticación `openai-codex`.

## Actualización + caducidad

Los perfiles almacenan una marca de tiempo `expires`.

En tiempo de ejecución:

- si `expires` está en el futuro → usa el token de acceso almacenado
- si caducó → actualiza (bajo un bloqueo de archivo) y sobrescribe las credenciales almacenadas
- si un agente secundario lee un perfil OAuth heredado del agente principal, la actualización
  escribe de vuelta en el almacén del agente principal en lugar de copiar el refresh token al
  almacén del agente secundario
- excepción: algunas credenciales de CLI externos siguen gestionadas externamente; OpenClaw
  vuelve a leer esos almacenes de autenticación de CLI en lugar de gastar refresh tokens copiados.
  La inicialización de Codex CLI es intencionalmente más estrecha: siembra un perfil vacío
  `openai-codex:default`, y luego las actualizaciones propiedad de OpenClaw mantienen el perfil local
  como canónico.

El flujo de actualización es automático; por lo general no necesitas gestionar tokens manualmente.

## Varias cuentas (perfiles) + enrutamiento

Dos patrones:

### 1) Preferido: agentes separados

Si quieres que "personal" y "trabajo" nunca interactúen, usa agentes aislados (sesiones + credenciales + espacio de trabajo separados):

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

Ejemplo (anulación de sesión):

- `/model Opus@anthropic:work`

Cómo ver qué IDs de perfil existen:

- `openclaw channels list --json` (muestra `auth[]`)

Documentos relacionados:

- [Conmutación por error de modelos](/es/concepts/model-failover) (reglas de rotación + enfriamiento)
- [Comandos de barra diagonal](/es/tools/slash-commands) (superficie de comandos)

## Relacionado

- [Autenticación](/es/gateway/authentication) - resumen de autenticación de proveedores de modelos
- [Secretos](/es/gateway/secrets) - almacenamiento de credenciales y SecretRef
- [Referencia de configuración](/es/gateway/configuration-reference#auth-storage) - claves de configuración de autenticación
