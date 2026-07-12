---
read_when:
    - Se necesita un hook o una herramienta de Plugin para solicitar confirmación antes de que se ejecute un efecto secundario
    - Debe configurar dónde se envían las solicitudes de aprobación de plugins
    - Está decidiendo entre herramientas opcionales, aprobaciones de ejecución y aprobaciones de plugins
sidebarTitle: Permission requests
summary: Solicitar a los usuarios que aprueben las llamadas a herramientas de plugins y las solicitudes de permisos pertenecientes a plugins
title: Solicitudes de permisos de Plugin
x-i18n:
    generated_at: "2026-07-12T14:40:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Las solicitudes de permisos de Plugin permiten que el código del Plugin pause una llamada a una herramienta o una operación propiedad del Plugin hasta que un usuario la apruebe o la deniegue. Utilizan el flujo `plugin.approval.*` del Gateway y las mismas superficies de interfaz de aprobación que gestionan los botones de aprobación del chat y los comandos `/approve`.

Utilice las solicitudes de permisos de Plugin para los permisos de plugins y aplicaciones. No sustituyen las aprobaciones de ejecución del host, las listas opcionales de herramientas permitidas ni la revisión de permisos nativa de Codex.

## Elegir el control adecuado

Elija el control que corresponda al punto de decisión necesario:

| Control                          | Cuándo usarlo                                                                                   | Qué controla                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Herramientas opcionales          | Una herramienta no debe ser visible para el modelo hasta que el usuario acepte habilitarla.     | Exposición de herramientas mediante `tools.allow`.                                                                                      |
| Solicitudes de permisos de Plugin | Un hook de Plugin o una operación propiedad del Plugin debe solicitar permiso antes de ejecutarse. | Aprobación en tiempo de ejecución mediante `plugin.approval.*`.                                                                         |
| Aprobaciones de ejecución        | Un comando del host o una herramienta similar a un shell necesita la aprobación del operador.   | Política de ejecución del host y listas duraderas de ejecución permitida.                                                               |
| Solicitudes de permisos nativas de Codex | Codex solicita permiso antes de acciones nativas de shell, archivos, MCP o servidor de aplicaciones. | Gestión de aprobaciones del servidor de aplicaciones o de hooks nativos de Codex, enrutada mediante aprobaciones de Plugin cuando OpenClaw controla la solicitud. |
| Solicitudes de aprobación de MCP | Un servidor MCP de Codex solicita aprobación para una llamada a una herramienta.                 | Respuestas de aprobación de MCP transmitidas mediante las aprobaciones de Plugin de OpenClaw.                                           |

Las herramientas opcionales constituyen un control en el momento del descubrimiento. Las solicitudes de permisos de Plugin constituyen un control por llamada. Utilice ambos cuando una herramienta sensible deba requerir una habilitación explícita antes de que el modelo pueda verla y una aprobación antes de ejecutar la acción.

## Solicitar aprobación antes de una llamada a una herramienta

La mayoría de las solicitudes creadas por plugins deben iniciarse en un hook `before_tool_call`. El hook se ejecuta después de que el modelo seleccione una herramienta y antes de que OpenClaw la ejecute:

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
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Redacte el texto de la solicitud para la persona que aprobará la acción:

- Mantenga `title` breve y centrado en la acción; el Gateway lo limita a 80 caracteres.
- Mantenga `description` específico y acotado; el Gateway lo limita a 512 caracteres.
- Incluya la acción, el destino y el riesgo. No incluya secretos, tokens ni cargas útiles privadas que no deban aparecer en las superficies de aprobación del chat.
- `severity` tiene el valor predeterminado `"warning"` cuando se omite. Utilice `"critical"` únicamente para acciones en las que una decisión incorrecta pueda provocar daños en producción o pérdida de datos.
- `allowedDecisions` tiene el valor predeterminado `["allow-once", "allow-always", "deny"]` cuando se omite. Pase `["allow-once", "deny"]` cuando mantener la confianza no sea seguro para esa acción.
- `timeoutMs` tiene el valor predeterminado 120000 (2 minutos) y está limitado a 600000 (10 minutos), independientemente del valor solicitado.

## Comportamiento de las decisiones

OpenClaw crea una aprobación pendiente con un ID `plugin:`, la entrega a las superficies de aprobación disponibles y espera una decisión.

| Decisión          | Resultado                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| `allow-once`      | La llamada actual continúa.                                                                       |
| `allow-always`    | La llamada actual continúa y la decisión se pasa al Plugin.                                       |
| `deny`            | La llamada se bloquea con un resultado de herramienta denegado.                                   |
| Tiempo de espera  | La llamada se bloquea.                                                                            |
| Cancelación       | La llamada se bloquea cuando se aborta la ejecución.                                              |
| Sin ruta de aprobación | La llamada se bloquea porque ninguna superficie de aprobación conectada puede resolverla.    |

Solo las decisiones exactas `allow-once` y `allow-always` permitidas por la solicitud autorizan la ejecución. Las decisiones desconocidas, malformadas, no coincidentes, ausentes o cuyo tiempo de espera haya vencido provocan un bloqueo seguro. El campo heredado `timeoutBehavior` sigue aceptándose por compatibilidad con plugins, pero está obsoleto y se ignora; no lo establezca en hooks nuevos.

`allow-always` solo es duradero cuando el Plugin o el entorno de ejecución solicitante implementa esa persistencia. Para los hooks `before_tool_call.requireApproval` normales, OpenClaw trata `allow-once` y `allow-always` como decisiones de aprobación para la llamada actual y pasa el valor resuelto a `onResolution`. Si su Plugin ofrece `allow-always`, documente e implemente exactamente en qué llamadas futuras confía.

Si el hook también devuelve `params`, OpenClaw aplica esos cambios de parámetros únicamente después de que la aprobación sea satisfactoria. Un hook de menor prioridad aún puede bloquear después de que un hook de mayor prioridad haya solicitado aprobación.

`allowedDecisions` limita los botones y comandos que se muestran al usuario. El Gateway rechaza cualquier intento de resolución con una decisión que la solicitud no haya ofrecido.

## Enrutar las solicitudes de aprobación

Las solicitudes de aprobación pueden resolverse en superficies de interfaz locales o en canales de chat compatibles con la gestión de aprobaciones. Para reenviar las solicitudes de aprobación de Plugin a destinos de chat explícitos, configure `approvals.plugin`:

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

`approvals.plugin` es independiente de `approvals.exec`. Habilitar el reenvío de aprobaciones de ejecución no enruta las solicitudes de aprobación de Plugin, y habilitar el reenvío de aprobaciones de Plugin no cambia la política de ejecución del host.

Cuando una solicitud incluya texto para la aprobación manual, resuélvala con una de las decisiones ofrecidas:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Consulte [Aprobaciones de ejecución avanzadas](/es/tools/exec-approvals-advanced#plugin-approval-forwarding) para conocer el modelo completo de reenvío, el comportamiento de aprobación en el mismo chat, la entrega nativa del canal y las reglas de aprobación específicas de cada canal.

## Permisos nativos de Codex

Las solicitudes de permisos nativas de Codex también pueden transmitirse mediante aprobaciones de Plugin, pero su propiedad difiere de la de los hooks creados por plugins.

- Las solicitudes de aprobación del servidor de aplicaciones de Codex se enrutan mediante OpenClaw después de la revisión de Codex.
- El relé del hook nativo `permission_request` puede solicitar aprobación mediante `plugin.approval.request` cuando dicho relé está habilitado.
- Las solicitudes de aprobación de herramientas MCP se enrutan mediante aprobaciones de Plugin cuando Codex marca `_meta.codex_approval_kind` como `"mcp_tool_call"`.

Consulte [Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations) para conocer el comportamiento específico de Codex y las reglas de reserva.

## Solución de problemas

**La herramienta indica que las aprobaciones de Plugin no están disponibles.** Ninguna interfaz de aprobación ni ruta de aprobación configurada aceptó la solicitud. Conecte un cliente compatible con aprobaciones, utilice un canal que admita `/approve` en el mismo chat o configure `approvals.plugin`.

**Aparece `allow-always`, pero la siguiente llamada vuelve a solicitar aprobación.** El flujo genérico de aprobación de Plugin no conserva automáticamente la confianza para hooks arbitrarios. Conserve la confianza propiedad del Plugin en su Plugin después de `onResolution("allow-always")`, u ofrezca únicamente `allow-once` y `deny`.

**`/approve` rechaza la decisión.** La solicitud restringió `allowedDecisions`. Utilice una de las decisiones mostradas en la solicitud.

**Una solicitud de Discord, Matrix, Slack o Telegram se enruta de forma diferente a las aprobaciones de ejecución.** Las aprobaciones de Plugin y las aprobaciones de ejecución utilizan configuraciones separadas y pueden emplear comprobaciones de autorización diferentes. Verifique `approvals.plugin` y la compatibilidad del canal con las aprobaciones de Plugin en lugar de comprobar únicamente `approvals.exec`.

## Contenido relacionado

- [Hooks de Plugin](/es/plugins/hooks#tool-call-policy)
- [Creación de plugins](/es/plugins/building-plugins#registering-tools)
- [Aprobaciones de ejecución avanzadas](/es/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protocolo del Gateway](/es/gateway/protocol)
- [Entorno de ejecución del arnés de Codex](/es/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
