---
read_when:
    - Quieres entender OAuth de OpenClaw de extremo a extremo
    - Tienes problemas de invalidación de tokens / cierre de sesión
    - Quieres flujos de autenticación de Claude CLI u OAuth
    - Desea varias cuentas o enrutamiento de perfiles
summary: 'OAuth en OpenClaw: intercambio de tokens, almacenamiento y patrones multicuenta'
title: OAuth
x-i18n:
    generated_at: "2026-05-06T05:31:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 223480a24bd30f92f5d9fdc35e937e582f9e81f5bee2fb0e5c0ea445ac552a40
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw admite "autenticación por suscripción" mediante OAuth para proveedores que la ofrecen
(en particular **OpenAI Codex (OAuth de ChatGPT)**). Para Anthropic, la separación práctica
ahora es:

- **Clave de API de Anthropic**: facturación normal de la API de Anthropic
- **CLI de Anthropic Claude / autenticación por suscripción dentro de OpenClaw**: el personal de Anthropic
  nos dijo que este uso vuelve a estar permitido

OAuth de OpenAI Codex está admitido explícitamente para su uso en herramientas externas como
OpenClaw. Esta página explica:

Para Anthropic en producción, la autenticación con clave de API es la ruta recomendada más segura.

- cómo funciona el **intercambio de tokens** de OAuth (PKCE)
- dónde se **almacenan** los tokens (y por qué)
- cómo gestionar **varias cuentas** (perfiles + anulaciones por sesión)

OpenClaw también admite **Plugins de proveedor** que incluyen sus propios flujos de OAuth o de clave de API.
Ejecútalos mediante:

```bash
openclaw models auth login --provider <id>
```

## El sumidero de tokens (por qué existe)

Los proveedores de OAuth suelen emitir un **nuevo token de actualización** durante los flujos de inicio de sesión/actualización. Algunos proveedores (o clientes OAuth) pueden invalidar tokens de actualización anteriores cuando se emite uno nuevo para el mismo usuario/aplicación.

Síntoma práctico:

- inicias sesión mediante OpenClaw _y_ mediante Claude Code / Codex CLI → uno de ellos acaba "cerrando sesión" aleatoriamente más tarde

Para reducir eso, OpenClaw trata `auth-profiles.json` como un **sumidero de tokens**:

- el entorno de ejecución lee credenciales desde **un solo lugar**
- podemos conservar varios perfiles y enrutarlos de forma determinista
- la reutilización de CLI externas es específica del proveedor: Codex CLI puede inicializar un perfil
  `openai-codex:default` vacío, pero una vez que OpenClaw tiene un perfil OAuth local,
  el token de actualización local es canónico; otras integraciones pueden seguir
  gestionadas externamente y volver a leer su almacén de autenticación de CLI
- las rutas de estado e inicio que ya conocen el conjunto de proveedores configurados limitan
  la detección de CLI externas a ese conjunto, de modo que no se sondea un almacén de inicio de sesión de CLI no relacionado
  en una configuración de un solo proveedor

## Almacenamiento (dónde viven los tokens)

Los secretos se almacenan en los almacenes de autenticación del agente:

- Perfiles de autenticación (OAuth + claves de API + referencias opcionales a nivel de valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Archivo de compatibilidad heredada: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (las entradas estáticas `api_key` se limpian al descubrirse)

Archivo heredado solo para importación (aún admitido, pero no es el almacén principal):

- `~/.openclaw/credentials/oauth.json` (se importa a `auth-profiles.json` en el primer uso)

Todo lo anterior también respeta `$OPENCLAW_STATE_DIR` (anulación del directorio de estado). Referencia completa: [/gateway/configuration](/es/gateway/configuration-reference#auth-storage)

Para referencias de secretos estáticos y comportamiento de activación de instantáneas en tiempo de ejecución, consulta [Gestión de secretos](/es/gateway/secrets).

Cuando un agente secundario no tiene un perfil de autenticación local, OpenClaw usa herencia de lectura indirecta
desde el almacén del agente predeterminado/principal. No clona el
`auth-profiles.json` del agente principal al leer. Los tokens de actualización de OAuth son especialmente
sensibles: los flujos de copia normales los omiten de forma predeterminada porque algunos proveedores rotan
o invalidan tokens de actualización después de usarlos. Configura un inicio de sesión OAuth independiente para un
agente cuando necesite una cuenta independiente.

## Compatibilidad con tokens heredados de Anthropic

<Warning>
La documentación pública de Claude Code de Anthropic dice que el uso directo de Claude Code se mantiene dentro de
los límites de suscripción de Claude, y el personal de Anthropic nos dijo que el uso de CLI de Claude
al estilo de OpenClaw vuelve a estar permitido. Por lo tanto, OpenClaw trata la reutilización de CLI de Claude y el uso de
`claude -p` como autorizados para esta integración, salvo que Anthropic
publique una nueva política.

Para la documentación actual de planes directos de Claude Code de Anthropic, consulta [Usar Claude Code
con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
y [Usar Claude Code con tu plan Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si quieres otras opciones de estilo suscripción en OpenClaw, consulta [OpenAI
Codex](/es/providers/openai), [Qwen Cloud Coding
Plan](/es/providers/qwen), [MiniMax Coding Plan](/es/providers/minimax),
y [Z.AI / GLM Coding Plan](/es/providers/glm).
</Warning>

OpenClaw también expone el token de configuración de Anthropic como una ruta de autenticación por token admitida, pero ahora prefiere la reutilización de CLI de Claude y `claude -p` cuando están disponibles.

## Migración de CLI de Anthropic Claude

OpenClaw vuelve a admitir la reutilización de CLI de Anthropic Claude. Si ya tienes un inicio de sesión local de
Claude en el host, la incorporación/configuración puede reutilizarlo directamente.

## Intercambio de OAuth (cómo funciona el inicio de sesión)

Los flujos de inicio de sesión interactivo de OpenClaw están implementados en `@mariozechner/pi-ai` y conectados a los asistentes/comandos.

### Token de configuración de Anthropic

Forma del flujo:

1. iniciar token de configuración o pegado de token de Anthropic desde OpenClaw
2. OpenClaw almacena la credencial de Anthropic resultante en un perfil de autenticación
3. la selección de modelo permanece en `anthropic/...`
4. los perfiles de autenticación de Anthropic existentes siguen disponibles para reversión/control de orden

### OpenAI Codex (OAuth de ChatGPT)

OAuth de OpenAI Codex está admitido explícitamente para su uso fuera de Codex CLI, incluidos los flujos de trabajo de OpenClaw.

Forma del flujo (PKCE):

1. generar verificador/desafío PKCE + `state` aleatorio
2. abrir `https://auth.openai.com/oauth/authorize?...`
3. intentar capturar la devolución de llamada en `http://127.0.0.1:1455/auth/callback`
4. si la devolución de llamada no puede vincularse (o estás en remoto/sin interfaz), pegar la URL/código de redirección
5. intercambiar en `https://auth.openai.com/oauth/token`
6. extraer `accountId` del token de acceso y almacenar `{ access, refresh, expires, accountId }`

La ruta del asistente es `openclaw onboard` → opción de autenticación `openai-codex`.

## Actualización + caducidad

Los perfiles almacenan una marca de tiempo `expires`.

En tiempo de ejecución:

- si `expires` está en el futuro → usar el token de acceso almacenado
- si ha caducado → actualizar (bajo un bloqueo de archivo) y sobrescribir las credenciales almacenadas
- si un agente secundario lee un perfil OAuth heredado del agente principal, la actualización
  vuelve a escribir en el almacén del agente principal en lugar de copiar el token de actualización en
  el almacén del agente secundario
- excepción: algunas credenciales de CLI externas siguen gestionadas externamente; OpenClaw
  vuelve a leer esos almacenes de autenticación de CLI en lugar de gastar tokens de actualización copiados.
  La inicialización de Codex CLI es intencionadamente más estrecha: siembra un perfil
  `openai-codex:default` vacío, y después las actualizaciones propiedad de OpenClaw mantienen el perfil local
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

Después configura la autenticación por agente (asistente) y enruta los chats al agente correcto.

### 2) Avanzado: varios perfiles en un agente

`auth-profiles.json` admite varios ID de perfil para el mismo proveedor.

Elige qué perfil se usa:

- globalmente mediante ordenación de configuración (`auth.order`)
- por sesión mediante `/model ...@<profileId>`

Ejemplo (anulación de sesión):

- `/model Opus@anthropic:work`

Cómo ver qué ID de perfil existen:

- `openclaw channels list --json` (muestra `auth[]`)

Documentación relacionada:

- [Conmutación por error de modelos](/es/concepts/model-failover) (reglas de rotación + enfriamiento)
- [Comandos slash](/es/tools/slash-commands) (superficie de comandos)

## Relacionado

- [Autenticación](/es/gateway/authentication) - resumen de autenticación de proveedores de modelos
- [Secretos](/es/gateway/secrets) - almacenamiento de credenciales y SecretRef
- [Referencia de configuración](/es/gateway/configuration-reference#auth-storage) - claves de configuración de autenticación
