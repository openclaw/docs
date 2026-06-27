---
read_when:
    - Sie benötigen einen Plugin-Hook oder ein Tool, das nachfragt, bevor ein Nebeneffekt ausgeführt wird
    - Sie müssen konfigurieren, wohin Plugin-Genehmigungsaufforderungen gesendet werden
    - Sie entscheiden zwischen optionalen Tools, Ausführungsgenehmigungen und Plugin-Genehmigungen
sidebarTitle: Permission requests
summary: Benutzer auffordern, Plugin-Tool-Aufrufe und Plugin-eigene Berechtigungsaufforderungen zu genehmigen
title: Plugin-Berechtigungsanfragen
x-i18n:
    generated_at: "2026-06-27T17:51:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Plugin-Berechtigungsanfragen ermöglichen es Plugin-Code, einen Tool-Aufruf oder eine Plugin-eigene
Operation anzuhalten, bis ein Benutzer sie genehmigt oder ablehnt. Sie verwenden den Gateway-
`plugin.approval.*`-Flow und dieselben Genehmigungs-UI-Oberflächen, die Chat-
Genehmigungsbuttons und `/approve`-Befehle verarbeiten.

Verwenden Sie Plugin-Berechtigungsanfragen für Plugin-/App-Berechtigungen. Sie ersetzen keine
Host-Exec-Genehmigungen, optionalen Tool-Allowlists oder die native Berechtigungsprüfung
von Codex.

## Das richtige Gate auswählen

Wählen Sie das Gate, das zum benötigten Entscheidungspunkt passt:

| Gate                             | Verwenden, wenn                                                          | Was es steuert                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Optionale Tools                  | Ein Tool soll für das Modell erst sichtbar sein, nachdem der Benutzer zustimmt. | Tool-Sichtbarkeit über `tools.allow`.                                                                                  |
| Plugin-Berechtigungsanfragen     | Ein Plugin-Hook oder eine Plugin-eigene Operation muss vor einer Aktion fragen. | Laufzeitgenehmigung über `plugin.approval.*`.                                                                          |
| Exec-Genehmigungen               | Ein Host-Befehl oder shell-ähnliches Tool benötigt eine Operator-Genehmigung. | Host-Exec-Richtlinie und dauerhafte Exec-Allowlists.                                                                   |
| Native Codex-Berechtigungsanfragen | Codex fragt vor nativen Shell-, Datei-, MCP- oder App-Server-Aktionen.   | Genehmigungsverarbeitung für Codex-App-Server oder native Hooks, über Plugin-Genehmigungen geroutet, wenn OpenClaw den Prompt besitzt. |
| MCP-Genehmigungsaufforderungen   | Ein Codex-MCP-Server fordert Genehmigung für einen Tool-Aufruf an.       | MCP-Genehmigungsantworten, die über OpenClaw-Plugin-Genehmigungen überbrückt werden.                                   |

Optionale Tools sind ein Gate zur Discovery-Zeit. Plugin-Berechtigungsanfragen sind ein
Gate pro Aufruf. Verwenden Sie beides, wenn ein sensibles Tool explizite Zustimmung
erfordern soll, bevor das Modell es sehen kann, und eine Genehmigung, bevor die Aktion läuft.

## Genehmigung vor einem Tool-Aufruf anfordern

Die meisten von Plugins verfassten Prompts sollten in einem `before_tool_call`-Hook beginnen. Der Hook
läuft, nachdem das Modell ein Tool ausgewählt hat und bevor OpenClaw es ausführt:

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

Schreiben Sie Prompt-Text für die Person, die die Aktion genehmigen wird:

- Halten Sie `title` kurz und aktionsorientiert. Der Gateway akzeptiert bis zu 80
  Zeichen.
- Halten Sie `description` spezifisch und begrenzt. Der Gateway akzeptiert bis zu 256
  Zeichen.
- Geben Sie Aktion, Ziel und Risiko an. Geben Sie keine Geheimnisse, Token oder
  privaten Payloads an, die nicht in Chat-Genehmigungsoberflächen erscheinen sollten.
- Verwenden Sie `severity: "critical"` nur für Aktionen, bei denen eine falsche Entscheidung
  Produktionsschäden oder Datenverlust verursachen könnte.
- Verwenden Sie `allowedDecisions: ["allow-once", "deny"]`, wenn dauerhaftes Vertrauen
  für diese Aktion unsicher ist.

## Entscheidungsverhalten

OpenClaw erstellt eine ausstehende Genehmigung mit einer `plugin:`-ID, liefert sie an die
verfügbaren Genehmigungsoberflächen aus und wartet auf eine Entscheidung.

| Entscheidung     | Ergebnis                                                                  |
| ---------------- | ------------------------------------------------------------------------- |
| `allow-once`     | Der aktuelle Aufruf wird fortgesetzt.                                     |
| `allow-always`   | Der aktuelle Aufruf wird fortgesetzt und die Entscheidung wird an das Plugin übergeben. |
| `deny`           | Der Aufruf wird mit einem abgelehnten Tool-Ergebnis blockiert.            |
| Timeout          | Der Aufruf wird blockiert, sofern `timeoutBehavior` nicht `"allow"` ist.  |
| Abbruch          | Der Aufruf wird blockiert, wenn der Lauf abgebrochen wird.                |
| Keine Genehmigungsroute | Der Aufruf wird blockiert, weil keine verbundene Genehmigungsoberfläche ihn auflösen kann. |

`allow-always` ist nur dauerhaft, wenn das anfragende Plugin oder die Runtime
diese Persistenz implementiert. Für gewöhnliche `before_tool_call.requireApproval`-Hooks
behandelt OpenClaw `allow-once` und `allow-always` als Genehmigungsentscheidungen für den
aktuellen Aufruf und übergibt den aufgelösten Wert an `onResolution`. Wenn Ihr Plugin
`allow-always` anbietet, dokumentieren und implementieren Sie exakt, welchen zukünftigen Aufrufen es
vertraut.

Wenn der Hook auch `params` zurückgibt, wendet OpenClaw diese Parameteränderungen erst
nach erfolgreicher Genehmigung an. Ein Hook mit niedrigerer Priorität kann weiterhin blockieren, nachdem ein
Hook mit höherer Priorität eine Genehmigung angefordert hat.

`allowedDecisions` begrenzt die Buttons und Befehle, die dem Benutzer angezeigt werden. Der
Gateway lehnt einen Auflösungsversuch für jede Entscheidung ab, die die Anfrage nicht angeboten hat.

## Genehmigungs-Prompts routen

Genehmigungs-Prompts können in lokalen UI-Oberflächen oder in Chat-Kanälen aufgelöst werden, die
Genehmigungsverarbeitung unterstützen. Um Plugin-Genehmigungs-Prompts an explizite Chat-
Ziele weiterzuleiten, konfigurieren Sie `approvals.plugin`:

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

`approvals.plugin` ist unabhängig von `approvals.exec`. Das Aktivieren der Weiterleitung von Exec-Genehmigungen
routet keine Plugin-Genehmigungs-Prompts, und das Aktivieren der Weiterleitung von Plugin-Genehmigungen
ändert die Host-Exec-Richtlinie nicht.

Wenn ein Prompt manuellen Genehmigungstext enthält, lösen Sie ihn mit einer der angebotenen
Entscheidungen auf:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Siehe [Erweiterte Exec-Genehmigungen](/de/tools/exec-approvals-advanced#plugin-approval-forwarding)
für das vollständige Weiterleitungsmodell, Genehmigungsverhalten im selben Chat, native Kanal-
Auslieferung und kanalspezifische Genehmigerregeln.

## Native Codex-Berechtigungen

Native Codex-Berechtigungs-Prompts können ebenfalls über Plugin-Genehmigungen laufen, haben aber
eine andere Zuständigkeit als von Plugins verfasste Hooks.

- Genehmigungsanfragen des Codex-App-Servers werden nach der Codex-Prüfung über OpenClaw geroutet.
- Das native Hook-Relay `permission_request` kann über
  `plugin.approval.request` fragen, wenn dieses Relay aktiviert ist.
- MCP-Tool-Genehmigungsaufforderungen werden über Plugin-Genehmigungen geroutet, wenn Codex
  `_meta.codex_approval_kind` als `"mcp_tool_call"` markiert.

Siehe [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
für das Codex-spezifische Verhalten und die Fallback-Regeln.

## Fehlerbehebung

**Das Tool meldet, dass Plugin-Genehmigungen nicht verfügbar sind.** Keine Genehmigungs-UI oder konfigurierte
Genehmigungsroute hat die Anfrage akzeptiert. Verbinden Sie einen genehmigungsfähigen Client, verwenden Sie einen
Kanal, der `/approve` im selben Chat unterstützt, oder konfigurieren Sie `approvals.plugin`.

**`allow-always` erscheint, aber der nächste Aufruf fragt erneut.** Der generische Plugin-
Genehmigungsflow persistiert Vertrauen für beliebige Hooks nicht automatisch. Persistieren Sie
Plugin-eigenes Vertrauen in Ihrem Plugin nach `onResolution("allow-always")`, oder
bieten Sie nur `allow-once` und `deny` an.

**`/approve` lehnt die Entscheidung ab.** Die Anfrage hat
`allowedDecisions` eingeschränkt. Verwenden Sie eine der Entscheidungen, die im Prompt ausgegeben wurden.

**Ein Slack-, Discord-, Telegram- oder Matrix-Prompt wird anders geroutet als Exec-
Genehmigungen.** Plugin-Genehmigungen und Exec-Genehmigungen verwenden getrennte Konfiguration und können
unterschiedliche Autorisierungsprüfungen verwenden. Prüfen Sie `approvals.plugin` und die
Plugin-Genehmigungsunterstützung des Kanals, anstatt nur `approvals.exec` zu prüfen.

## Verwandt

- [Plugin-Hooks](/de/plugins/hooks#tool-call-policy)
- [Plugins erstellen](/de/plugins/building-plugins#registering-agent-tools)
- [Erweiterte Exec-Genehmigungen](/de/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway-Protokoll](/de/gateway/protocol)
- [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
