---
read_when:
    - Necesitas un hook o una herramienta de Plugin para preguntar antes de que se ejecute un efecto secundario
    - Debes configurar dónde se entregan las solicitudes de aprobación de plugins
    - Estás decidiendo entre herramientas opcionales, aprobaciones de ejecución y aprobaciones de plugins
sidebarTitle: Permission requests
summary: Pide a los usuarios que aprueben las llamadas a herramientas de plugins y las solicitudes de permiso propiedad del plugin
title: Solicitudes de permisos del Plugin
x-i18n:
    generated_at: "2026-06-27T12:17:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Las solicitudes de permisos de Plugin permiten que el código de Plugin pause una llamada de herramienta o una operación propiedad del Plugin hasta que un usuario la apruebe o la rechace. Usan el flujo `plugin.approval.*` del Gateway y las mismas superficies de interfaz de aprobación que manejan los botones de aprobación de chat y los comandos `/approve`.

Usa solicitudes de permisos de Plugin para permisos de plugins/aplicaciones. No sustituyen las aprobaciones de ejecución del host, las listas opcionales de herramientas permitidas ni la revisión de permisos nativa de Codex.

## Elige la puerta correcta

Elige la puerta que coincida con el punto de decisión que necesitas:

| Puerta                            | Úsala cuando                                                            | Qué controla                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Herramientas opcionales           | Una herramienta no debe ser visible para el modelo hasta que el usuario opte por habilitarla. | Exposición de herramientas mediante `tools.allow`.                                                                       |
| Solicitudes de permisos de Plugin | Un hook de Plugin o una operación propiedad del Plugin debe preguntar antes de ejecutar una acción. | Aprobación en runtime mediante `plugin.approval.*`.                                                                      |
| Aprobaciones de ejecución         | Un comando de host o una herramienta similar a shell necesita aprobación del operador. | Política de ejecución del host y listas duraderas de ejecución permitida.                                                |
| Solicitudes de permisos nativas de Codex | Codex pregunta antes de acciones nativas de shell, archivo, MCP o servidor de aplicaciones. | Manejo de aprobación del servidor de aplicaciones o hook nativo de Codex, enrutado mediante aprobaciones de Plugin cuando OpenClaw controla el prompt. |
| Elicitaciones de aprobación de MCP | Un servidor MCP de Codex solicita aprobación para una llamada de herramienta. | Respuestas de aprobación de MCP conectadas mediante aprobaciones de Plugin de OpenClaw.                                  |

Las herramientas opcionales son una puerta en tiempo de descubrimiento. Las solicitudes de permisos de Plugin son una puerta por llamada. Usa ambas cuando una herramienta sensible deba requerir habilitación explícita antes de que el modelo pueda verla y aprobación antes de que se ejecute la acción.

## Solicitar aprobación antes de una llamada de herramienta

La mayoría de los prompts creados por plugins deberían comenzar en un hook `before_tool_call`. El hook se ejecuta después de que el modelo selecciona una herramienta y antes de que OpenClaw la ejecute:

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

- Mantén `title` breve y centrado en la acción. El Gateway acepta hasta 80 caracteres.
- Mantén `description` específica y acotada. El Gateway acepta hasta 256 caracteres.
- Incluye la acción, el destino y el riesgo. No incluyas secretos, tokens ni cargas privadas que no deban aparecer en las superficies de aprobación de chat.
- Usa `severity: "critical"` solo para acciones en las que una decisión incorrecta podría causar daños en producción o pérdida de datos.
- Usa `allowedDecisions: ["allow-once", "deny"]` cuando la confianza persistente no sea segura para esa acción.

## Comportamiento de las decisiones

OpenClaw crea una aprobación pendiente con un ID `plugin:`, la entrega a las superficies de aprobación disponibles y espera una decisión.

| Decisión          | Resultado                                                                  |
| ----------------- | -------------------------------------------------------------------------- |
| `allow-once`      | La llamada actual continúa.                                                |
| `allow-always`    | La llamada actual continúa y la decisión se pasa al Plugin.                |
| `deny`            | La llamada se bloquea con un resultado de herramienta denegado.            |
| Tiempo de espera  | La llamada se bloquea salvo que `timeoutBehavior` sea `"allow"`.           |
| Cancelación       | La llamada se bloquea cuando se aborta la ejecución.                       |
| Sin ruta de aprobación | La llamada se bloquea porque ninguna superficie de aprobación conectada puede resolverla. |

`allow-always` solo es duradera cuando el Plugin o runtime solicitante implementa esa persistencia. Para hooks ordinarios `before_tool_call.requireApproval`, OpenClaw trata `allow-once` y `allow-always` como decisiones de aprobación para la llamada actual y pasa el valor resuelto a `onResolution`. Si tu Plugin ofrece `allow-always`, documenta e implementa exactamente en qué llamadas futuras confía.

Si el hook también devuelve `params`, OpenClaw aplica esos cambios de parámetros solo después de que la aprobación se complete correctamente. Un hook de menor prioridad aún puede bloquear después de que un hook de mayor prioridad haya solicitado aprobación.

`allowedDecisions` limita los botones y comandos que se muestran al usuario. El Gateway rechaza un intento de resolución para cualquier decisión que la solicitud no haya ofrecido.

## Enrutar prompts de aprobación

Los prompts de aprobación pueden resolverse en superficies de interfaz locales o en canales de chat que admiten manejo de aprobación. Para reenviar prompts de aprobación de Plugin a destinos de chat explícitos, configura `approvals.plugin`:

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

`approvals.plugin` es independiente de `approvals.exec`. Habilitar el reenvío de aprobación de ejecución no enruta los prompts de aprobación de Plugin, y habilitar el reenvío de aprobación de Plugin no cambia la política de ejecución del host.

Cuando un prompt incluya texto de aprobación manual, resuélvelo con una de las decisiones ofrecidas:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Consulta [Aprobaciones de ejecución avanzadas](/es/tools/exec-approvals-advanced#plugin-approval-forwarding) para ver el modelo completo de reenvío, el comportamiento de aprobación en el mismo chat, la entrega en canales nativos y las reglas de aprobadores específicas por canal.

## Permisos nativos de Codex

Los prompts de permisos nativos de Codex también pueden pasar por aprobaciones de Plugin, pero tienen una propiedad distinta a la de los hooks creados por plugins.

- Las solicitudes de aprobación del servidor de aplicaciones de Codex se enrutan mediante OpenClaw después de la revisión de Codex.
- El relay del hook nativo `permission_request` puede preguntar mediante `plugin.approval.request` cuando ese relay está habilitado.
- Las elicitaciones de aprobación de herramientas MCP se enrutan mediante aprobaciones de Plugin cuando Codex marca `_meta.codex_approval_kind` como `"mcp_tool_call"`.

Consulta [runtime del arnés de Codex](/es/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations) para ver el comportamiento específico de Codex y las reglas de fallback.

## Solución de problemas

**La herramienta dice que las aprobaciones de Plugin no están disponibles.** Ninguna interfaz de aprobación ni ruta de aprobación configurada aceptó la solicitud. Conecta un cliente con capacidad de aprobación, usa un canal que admita `/approve` en el mismo chat o configura `approvals.plugin`.

**Aparece `allow-always`, pero la siguiente llamada vuelve a pedir aprobación.** El flujo genérico de aprobación de Plugin no persiste automáticamente la confianza para hooks arbitrarios. Persiste la confianza propiedad del Plugin en tu Plugin después de `onResolution("allow-always")`, u ofrece solo `allow-once` y `deny`.

**`/approve` rechaza la decisión.** La solicitud restringió `allowedDecisions`. Usa una de las decisiones impresas en el prompt.

**Un prompt de Slack, Discord, Telegram o Matrix se enruta de forma diferente a las aprobaciones de ejecución.** Las aprobaciones de Plugin y las aprobaciones de ejecución usan configuraciones separadas y pueden usar comprobaciones de autorización diferentes. Verifica `approvals.plugin` y el soporte de aprobación de Plugin del canal en lugar de comprobar solo `approvals.exec`.

## Relacionado

- [Hooks de Plugin](/es/plugins/hooks#tool-call-policy)
- [Crear plugins](/es/plugins/building-plugins#registering-agent-tools)
- [Aprobaciones de ejecución avanzadas](/es/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protocolo del Gateway](/es/gateway/protocol)
- [runtime del arnés de Codex](/es/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
