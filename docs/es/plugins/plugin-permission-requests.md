---
read_when:
    - Necesitas un hook de Plugin o una herramienta para preguntar antes de que se ejecute un efecto secundario
    - Debe configurar dónde se entregan las solicitudes de aprobación de plugins
    - Estás decidiendo entre herramientas opcionales, aprobaciones de exec y aprobaciones de Plugin
sidebarTitle: Permission requests
summary: Solicitar a los usuarios que aprueben llamadas a herramientas de Plugin y avisos de permisos propiedad de Plugin
title: Solicitudes de permisos de Plugin
x-i18n:
    generated_at: "2026-07-05T11:36:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aa8c26d84aef6518186e55674171bb46b3fa8710333c0da6ac16c01a78f678a7
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Las solicitudes de permisos de Plugin permiten que el código de Plugin pause una llamada de herramienta o una operación propiedad del Plugin hasta que un usuario la apruebe o la deniegue. Usan el flujo `plugin.approval.*` del Gateway y las mismas superficies de interfaz de aprobación que gestionan los botones de aprobación en el chat y los comandos `/approve`.

Usa solicitudes de permisos de Plugin para permisos de Plugin/aplicación. No sustituyen las aprobaciones de ejecución del host, las listas de permitidos opcionales de herramientas ni la revisión de permisos nativa de Codex.

## Elige la puerta correcta

Elige la puerta que coincida con el punto de decisión que necesitas:

| Puerta                            | Úsala cuando                                                                      | Qué controla                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Herramientas opcionales           | Una herramienta no debe ser visible para el modelo hasta que el usuario acepte.    | Exposición de herramientas mediante `tools.allow`.                                                                          |
| Solicitudes de permisos de Plugin | Un hook de Plugin o una operación propiedad del Plugin debe preguntar antes de ejecutar una acción. | Aprobación en tiempo de ejecución mediante `plugin.approval.*`.                                                             |
| Aprobaciones de exec              | Un comando de host o una herramienta similar a shell necesita aprobación del operador. | Política de exec del host y listas de permitidos duraderas de exec.                                                         |
| Solicitudes de permisos nativas de Codex | Codex pregunta antes de acciones nativas de shell, archivo, MCP o servidor de aplicación. | Gestión de aprobaciones de servidor de aplicación de Codex o de hooks nativos, enrutada mediante aprobaciones de Plugin cuando OpenClaw es dueño del prompt. |
| Solicitudes de aprobación de MCP  | Un servidor MCP de Codex solicita aprobación para una llamada de herramienta.       | Respuestas de aprobación de MCP enlazadas mediante aprobaciones de Plugin de OpenClaw.                                      |

Las herramientas opcionales son una puerta en el momento de descubrimiento. Las solicitudes de permisos de Plugin son una puerta por llamada. Usa ambas cuando una herramienta sensible deba requerir aceptación explícita antes de que el modelo pueda verla y aprobación antes de que la acción se ejecute.

## Solicitar aprobación antes de una llamada de herramienta

La mayoría de los prompts creados por Plugin deberían empezar en un hook `before_tool_call`. El hook se ejecuta después de que el modelo selecciona una herramienta y antes de que OpenClaw la ejecute:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Escribe el texto del prompt para la persona que aprobará la acción:

- Mantén `title` breve y centrado en la acción; el Gateway lo limita a 80 caracteres.
- Mantén `description` específica y acotada; el Gateway la limita a 256
  caracteres.
- Incluye la acción, el objetivo y el riesgo. No incluyas secretos, tokens ni
  cargas privadas que no deban aparecer en las superficies de aprobación del chat.
- `severity` usa `"warning"` de forma predeterminada cuando se omite. Usa `"critical"` solo para
  acciones en las que una decisión incorrecta podría causar daños en producción o pérdida de datos.
- `allowedDecisions` usa `["allow-once", "allow-always", "deny"]` de forma predeterminada cuando
  se omite. Pasa `["allow-once", "deny"]` cuando la confianza persistente no sea segura para
  esa acción.
- `timeoutMs` usa 120000 (2 minutos) de forma predeterminada y tiene un límite de 600000 (10
  minutos), independientemente del valor solicitado.

## Comportamiento de las decisiones

OpenClaw crea una aprobación pendiente con un ID `plugin:`, la entrega a las
superficies de aprobación disponibles y espera una decisión.

| Decisión          | Resultado                                                                    |
| ----------------- | ---------------------------------------------------------------------------- |
| `allow-once`      | La llamada actual continúa.                                                  |
| `allow-always`    | La llamada actual continúa y la decisión se pasa al Plugin.                  |
| `deny`            | La llamada se bloquea con un resultado de herramienta denegado.              |
| Tiempo de espera  | La llamada se bloquea salvo que `timeoutBehavior` sea `"allow"`.             |
| Cancelación       | La llamada se bloquea cuando se aborta la ejecución.                         |
| Sin ruta de aprobación | La llamada se bloquea porque ninguna superficie de aprobación conectada puede resolverla. |

`allow-always` solo es duradera cuando el Plugin o runtime solicitante implementa
esa persistencia. Para hooks `before_tool_call.requireApproval` ordinarios,
OpenClaw trata `allow-once` y `allow-always` como decisiones de aprobación para la
llamada actual y pasa el valor resuelto a `onResolution`. Si tu Plugin
ofrece `allow-always`, documenta e implementa exactamente en qué llamadas futuras confía.

Si el hook también devuelve `params`, OpenClaw aplica esos cambios de parámetros solo
después de que la aprobación se realiza correctamente. Un hook de menor prioridad aún puede bloquear después de que un
hook de mayor prioridad haya solicitado aprobación.

`allowedDecisions` limita los botones y comandos mostrados al usuario. El
Gateway rechaza cualquier intento de resolución para una decisión que la solicitud no ofreció.

## Enrutar prompts de aprobación

Los prompts de aprobación pueden resolverse en superficies de interfaz locales o en canales de chat que
admiten gestión de aprobaciones. Para reenviar prompts de aprobación de Plugin a destinos de chat
explícitos, configura `approvals.plugin`:

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` es independiente de `approvals.exec`. Habilitar el reenvío de aprobaciones de exec
no enruta prompts de aprobación de Plugin, y habilitar el reenvío de aprobaciones de Plugin
no cambia la política de exec del host.

Cuando un prompt incluya texto de aprobación manual, resuélvelo con una de las decisiones
ofrecidas:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Consulta [Aprobaciones avanzadas de exec](/es/tools/exec-approvals-advanced#plugin-approval-forwarding)
para ver el modelo completo de reenvío, el comportamiento de aprobación en el mismo chat, la entrega por canal
nativo y las reglas de aprobadores específicas de cada canal.

## Permisos nativos de Codex

Los prompts de permisos nativos de Codex también pueden pasar por aprobaciones de Plugin, pero
tienen una propiedad distinta de la de los hooks creados por Plugin.

- Las solicitudes de aprobación del servidor de aplicación de Codex se enrutan mediante OpenClaw después de la revisión de Codex.
- El relay del hook nativo `permission_request` puede preguntar mediante
  `plugin.approval.request` cuando ese relay está habilitado.
- Las solicitudes de aprobación de herramientas MCP se enrutan mediante aprobaciones de Plugin cuando Codex marca
  `_meta.codex_approval_kind` como `"mcp_tool_call"`.

Consulta [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
para ver el comportamiento específico de Codex y las reglas de fallback.

## Solución de problemas

**La herramienta dice que las aprobaciones de Plugin no están disponibles.** Ninguna interfaz de aprobación ni ruta de aprobación configurada
aceptó la solicitud. Conecta un cliente con capacidad de aprobación, usa un
canal que admita `/approve` en el mismo chat, o configura `approvals.plugin`.

**`allow-always` aparece, pero la siguiente llamada vuelve a pedir confirmación.** El flujo genérico de aprobación de Plugin
no persiste automáticamente la confianza para hooks arbitrarios. Persiste
la confianza propiedad del Plugin en tu Plugin después de `onResolution("allow-always")`, u
ofrece solo `allow-once` y `deny`.

**`/approve` rechaza la decisión.** La solicitud restringió
`allowedDecisions`. Usa una de las decisiones impresas en el prompt.

**Un prompt de Discord, Matrix, Slack o Telegram se enruta de forma distinta a las aprobaciones de exec.** Las aprobaciones de Plugin y las aprobaciones de exec usan configuraciones separadas y pueden usar
comprobaciones de autorización diferentes. Verifica `approvals.plugin` y el soporte de aprobación de Plugin del canal
en lugar de comprobar solo `approvals.exec`.

## Relacionado

- [Hooks de Plugin](/es/plugins/hooks#tool-call-policy)
- [Crear plugins](/es/plugins/building-plugins#registering-tools)
- [Aprobaciones avanzadas de exec](/es/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protocolo del Gateway](/es/gateway/protocol)
- [Runtime del arnés de Codex](/es/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
