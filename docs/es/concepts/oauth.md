---
read_when:
    - Quieres entender OAuth de OpenClaw de principio a fin
    - Tienes problemas de invalidación de tokens / cierre de sesión
    - Quieres flujos de autenticación de Claude CLI u OAuth
    - Quieres varias cuentas o enrutamiento de perfiles
summary: 'OAuth en OpenClaw: intercambio de tokens, almacenamiento y patrones de varias cuentas'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:22:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw admite "autenticación por suscripción" mediante OAuth para proveedores que la ofrecen
(en particular **OpenAI Codex (ChatGPT OAuth)**). Para Anthropic, la división práctica
ahora es:

- **Clave de API de Anthropic**: facturación normal de la API de Anthropic
- **Anthropic Claude CLI / autenticación por suscripción dentro de OpenClaw**: el personal de Anthropic
  nos dijo que este uso vuelve a estar permitido

OpenAI Codex OAuth está explícitamente admitido para su uso en herramientas externas como
OpenClaw.

OpenClaw almacena tanto la autenticación con clave de API de OpenAI como ChatGPT/Codex OAuth bajo el
id de proveedor canónico `openai`. Los ids de perfil `openai-codex:*` antiguos y las
entradas `auth.order.openai-codex` son estado heredado reparado por
`openclaw doctor --fix`; usa ids de perfil `openai:*` y `auth.order.openai` para
la configuración nueva.

Para Anthropic en producción, la autenticación con clave de API es la ruta recomendada más segura.

Esta página explica:

- cómo funciona el **intercambio de tokens** OAuth (PKCE)
- dónde se **almacenan** los tokens (y por qué)
- cómo gestionar **varias cuentas** (perfiles + anulaciones por sesión)

OpenClaw también admite **plugins de proveedor** que incluyen sus propios flujos OAuth o de clave de API.
Ejecútalos mediante:

```bash
openclaw models auth login --provider <id>
```

## El sumidero de tokens (por qué existe)

Los proveedores OAuth suelen emitir un **nuevo token de actualización** durante los flujos de inicio de sesión/actualización. Algunos proveedores (o clientes OAuth) pueden invalidar tokens de actualización anteriores cuando se emite uno nuevo para el mismo usuario/app.

Síntoma práctico:

- inicias sesión mediante OpenClaw _y_ mediante Claude Code / Codex CLI → uno de ellos se "cierra sesión" aleatoriamente más tarde

Para reducir eso, OpenClaw trata `auth-profiles.json` como un **sumidero de tokens**:

- el runtime lee credenciales desde **un solo lugar**
- podemos conservar varios perfiles y enrutarlos de forma determinista
- la reutilización de CLI externos depende del proveedor: Codex CLI puede inicializar un perfil
  `openai:default` vacío, pero una vez que OpenClaw tiene un perfil OAuth local,
  el token de actualización local es canónico. Si ese token de actualización local se rechaza,
  OpenClaw informa el perfil gestionado para volver a autenticarlo en lugar de usar
  material de token de Codex CLI como fallback de runtime hermano. Otras integraciones pueden
  seguir gestionadas externamente y releer su almacén de autenticación de CLI
- las rutas de estado y arranque que ya conocen el conjunto de proveedores configurados limitan
  el descubrimiento de CLI externos a ese conjunto, por lo que un almacén de inicio de sesión de CLI no relacionado no se
  sondea para una configuración de un solo proveedor

## Almacenamiento (dónde viven los tokens)

Los secretos se almacenan en almacenes de autenticación de agentes:

- Perfiles de autenticación (OAuth + claves de API + referencias opcionales a nivel de valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Archivo de compatibilidad heredado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (las entradas estáticas `api_key` se eliminan cuando se descubren)

Archivo heredado solo de importación (todavía admitido, pero no es el almacén principal):

- `~/.openclaw/credentials/oauth.json` (importado a `auth-profiles.json` en el primer uso)

Todo lo anterior también respeta `$OPENCLAW_STATE_DIR` (anulación del directorio de estado). Referencia completa: [/gateway/configuration](/es/gateway/configuration-reference#auth-storage)

Para referencias estáticas de secretos y comportamiento de activación de instantáneas de runtime, consulta [Gestión de secretos](/es/gateway/secrets).

Cuando un agente secundario no tiene perfil de autenticación local, OpenClaw usa herencia de lectura directa
desde el almacén del agente predeterminado/principal. No clona el
`auth-profiles.json` del agente principal al leer. Los tokens de actualización OAuth son especialmente
sensibles: los flujos de copia normales los omiten por defecto porque algunos proveedores rotan
o invalidan tokens de actualización después de usarlos. Configura un inicio de sesión OAuth separado para un
agente cuando necesite una cuenta independiente.

## Compatibilidad con tokens heredados de Anthropic

<Warning>
La documentación pública de Claude Code de Anthropic dice que el uso directo de Claude Code permanece dentro de
los límites de suscripción de Claude, y el personal de Anthropic nos dijo que el uso de Claude
CLI al estilo de OpenClaw vuelve a estar permitido. Por lo tanto, OpenClaw trata la reutilización de Claude CLI y
el uso de `claude -p` como autorizados para esta integración salvo que Anthropic
publique una nueva política.

Para la documentación actual de planes directos de Claude Code de Anthropic, consulta [Usar Claude Code
con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
y [Usar Claude Code con tu plan Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Si quieres otras opciones de estilo suscripción en OpenClaw, consulta [OpenAI
Codex](/es/providers/openai), [Qwen Cloud Coding
Plan](/es/providers/qwen), [MiniMax Coding Plan](/es/providers/minimax),
y [Z.AI / GLM Coding Plan](/es/providers/zai).
</Warning>

OpenClaw también expone el token de configuración de Anthropic como una ruta de autenticación por token admitida, pero ahora prefiere la reutilización de Claude CLI y `claude -p` cuando están disponibles.

## Migración de Anthropic Claude CLI

OpenClaw vuelve a admitir la reutilización de Anthropic Claude CLI. Si ya tienes un inicio de sesión local de
Claude en el host, onboarding/configure puede reutilizarlo directamente.

## Intercambio OAuth (cómo funciona el inicio de sesión)

Los flujos de inicio de sesión interactivos de OpenClaw están implementados en `openclaw/plugin-sdk/llm` y conectados a los asistentes/comandos.

### Token de configuración de Anthropic

Forma del flujo:

1. inicia setup-token o paste-token de Anthropic desde OpenClaw
2. OpenClaw almacena la credencial de Anthropic resultante en un perfil de autenticación
3. la selección de modelo permanece en `anthropic/...`
4. los perfiles de autenticación de Anthropic existentes siguen disponibles para reversión/control de orden

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth está explícitamente admitido para su uso fuera de Codex CLI, incluidos los flujos de trabajo de OpenClaw.

El comando de inicio de sesión sigue usando el id de proveedor canónico de OpenAI:

```bash
openclaw models auth login --provider openai
```

Usa `--profile-id openai:<name>` para varias cuentas ChatGPT/Codex OAuth en
un agente. No uses `openai-codex:<name>` para perfiles nuevos. Doctor migra
ese prefijo anterior a un id de perfil `openai:*` sin colisiones; ejecuta
`openclaw models auth list --provider openai` después de la reparación antes de copiar
ids de perfil en `auth.order` o `/model ...@<profileId>`.

Forma del flujo (PKCE):

1. generar verificador/desafío PKCE + `state` aleatorio
2. abrir `https://auth.openai.com/oauth/authorize?...`
3. intentar capturar la devolución de llamada en `http://127.0.0.1:1455/auth/callback`
4. si la devolución de llamada no puede enlazarse (o estás en remoto/sin interfaz), pega la URL/código de redirección
5. intercambiar en `https://auth.openai.com/oauth/token`
6. extraer `accountId` del token de acceso y almacenar `{ access, refresh, expires, accountId }`

La ruta del asistente es `openclaw onboard` → opción de autenticación `openai`.

## Actualización + caducidad

Los perfiles almacenan una marca de tiempo `expires`.

En runtime:

- si `expires` está en el futuro → usa el token de acceso almacenado
- si caducó → actualizar (bajo un bloqueo de archivo) y sobrescribir las credenciales almacenadas
- si un agente secundario lee un perfil OAuth heredado del agente principal, la actualización
  escribe de vuelta en el almacén del agente principal en lugar de copiar el token de actualización al
  almacén del agente secundario
- excepción: algunas credenciales de CLI externos siguen gestionadas externamente; OpenClaw
  relee esos almacenes de autenticación de CLI en lugar de gastar tokens de actualización copiados.
  La inicialización de Codex CLI es intencionalmente más limitada: puede sembrar un
  `openai:default` vacío o un perfil de OpenAI solicitado explícitamente solo antes de que OpenClaw
  sea propietario de OAuth para el proveedor. Después de eso, las actualizaciones propiedad de OpenClaw mantienen los perfiles
  locales como canónicos y el descubrimiento no añade autenticación de Codex CLI en ningún espacio
  hermano. Si una actualización gestionada falla, OpenClaw informa el perfil afectado para
  volver a autenticarlo en lugar de devolver material de token de CLI externo.

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

- [Failover de modelos](/es/concepts/model-failover) (reglas de rotación + enfriamiento)
- [Comandos de barra](/es/tools/slash-commands) (superficie de comandos)

## Relacionado

- [Autenticación](/es/gateway/authentication) - resumen de autenticación de proveedores de modelos
- [Secretos](/es/gateway/secrets) - almacenamiento de credenciales y SecretRef
- [Referencia de configuración](/es/gateway/configuration-reference#auth-storage) - claves de configuración de autenticación
