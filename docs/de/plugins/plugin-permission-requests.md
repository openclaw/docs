---
read_when:
    - Sie benötigen einen Plugin-Hook oder ein Tool, um vor der Ausführung eines Nebeneffekts nachzufragen.
    - Sie müssen konfigurieren, wohin Aufforderungen zur Plugin-Genehmigung gesendet werden.
    - Sie entscheiden zwischen optionalen Tools, Ausführungsgenehmigungen und Plugin-Genehmigungen
sidebarTitle: Permission requests
summary: Fordern Sie Benutzer auf, Plugin-Tool-Aufrufe und Plugin-eigene Berechtigungsabfragen zu genehmigen
title: Plugin-Berechtigungsanfragen
x-i18n:
    generated_at: "2026-07-24T03:57:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Plugin-Berechtigungsanfragen ermöglichen es Plugin-Code, einen Tool-Aufruf oder einen Plugin-eigenen
Vorgang anzuhalten, bis eine Person ihn genehmigt oder ablehnt. Sie verwenden den Gateway-
`plugin.approval.*`-Ablauf und dieselben Genehmigungsoberflächen, die Chat-
Genehmigungsschaltflächen und `/approve`-Befehle verarbeiten.

Verwenden Sie Plugin-Berechtigungsanfragen für Plugin-/App-Berechtigungen. Sie ersetzen weder
Host-Ausführungsgenehmigungen noch optionale Tool-Zulassungslisten oder die native Berechtigungsprüfung
von Codex.

## Das richtige Gate auswählen

Wählen Sie das Gate, das zu Ihrem Entscheidungspunkt passt:

| Gate                             | Verwenden, wenn                                                          | Gesteuerter Bereich                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Optionale Tools                  | Ein Tool soll für das Modell erst sichtbar sein, nachdem die Person zugestimmt hat. | Tool-Bereitstellung über `tools.allow`.                                                                      |
| Plugin-Berechtigungsanfragen     | Ein Plugin-Hook oder Plugin-eigener Vorgang muss vor einer Aktion nachfragen. | Laufzeitgenehmigung über `plugin.approval.*`.                                                                      |
| Ausführungsgenehmigungen         | Ein Host-Befehl oder Shell-ähnliches Tool benötigt die Genehmigung des Betreibers. | Host-Ausführungsrichtlinie und dauerhafte Ausführungs-Zulassungslisten.                                            |
| Native Codex-Berechtigungsanfragen | Codex fragt vor nativen Shell-, Datei-, MCP- oder App-Server-Aktionen nach. | Verarbeitung von Codex-App-Server- oder nativen Hook-Genehmigungen, die über Plugin-Genehmigungen geleitet werden, wenn OpenClaw die Eingabeaufforderung verwaltet. |
| MCP-Genehmigungsabfragen         | Ein Codex-MCP-Server fordert die Genehmigung für einen Tool-Aufruf an.    | Über OpenClaw-Plugin-Genehmigungen vermittelte MCP-Genehmigungsantworten.                                          |

Optionale Tools bilden ein Gate zur Erkennungszeit. Plugin-Berechtigungsanfragen bilden ein
Gate pro Aufruf. Verwenden Sie beide, wenn ein sensibles Tool eine ausdrückliche Zustimmung
benötigt, bevor das Modell es sehen kann, und eine Genehmigung, bevor die Aktion ausgeführt wird.

## Genehmigung vor einem Tool-Aufruf anfordern

Die meisten von Plugins erstellten Eingabeaufforderungen sollten in einem `before_tool_call`-Hook beginnen. Der Hook
wird ausgeführt, nachdem das Modell ein Tool ausgewählt hat und bevor OpenClaw es ausführt:

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

Formulieren Sie den Text der Eingabeaufforderung für die Person, die die Aktion genehmigen wird:

- Halten Sie `title` kurz und aktionsbezogen; der Gateway begrenzt den Text auf 80 Zeichen.
- Halten Sie `description` konkret und klar abgegrenzt; der Gateway begrenzt den Text auf 512
  Zeichen.
- Geben Sie Aktion, Ziel und Risiko an. Fügen Sie keine Secrets, Token oder
  privaten Nutzdaten ein, die nicht auf Chat-Genehmigungsoberflächen erscheinen dürfen.
- `severity` verwendet standardmäßig `"warning"`, wenn es nicht angegeben ist. Verwenden Sie `"critical"` nur für
  Aktionen, bei denen eine falsche Entscheidung Produktionsschäden oder Datenverlust verursachen könnte.
- `allowedDecisions` verwendet standardmäßig `["allow-once", "allow-always", "deny"]`, wenn es
  nicht angegeben ist. Übergeben Sie `["allow-once", "deny"]`, wenn dauerhaftes Vertrauen für
  diese Aktion unsicher ist.
- `timeoutMs` verwendet standardmäßig 120000 (2 Minuten) und ist unabhängig vom angeforderten Wert auf 600000 (10
  Minuten) begrenzt.

## Entscheidungsverhalten

OpenClaw erstellt eine ausstehende Genehmigung mit einer `plugin:`-ID, übermittelt sie an die
verfügbaren Genehmigungsoberflächen und wartet auf eine Entscheidung.

| Entscheidung      | Ergebnis                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | Der aktuelle Aufruf wird fortgesetzt.                                     |
| `allow-always`    | Der aktuelle Aufruf wird fortgesetzt und die Entscheidung an das Plugin übergeben. |
| `deny`            | Der Aufruf wird mit einem abgelehnten Tool-Ergebnis blockiert.            |
| Zeitüberschreitung | Der Aufruf wird blockiert.                                                 |
| Abbruch            | Der Aufruf wird blockiert, wenn die Ausführung abgebrochen wird.          |
| Keine Genehmigungsroute | Der Aufruf wird blockiert, weil keine verbundene Genehmigungsoberfläche ihn bearbeiten kann. |

Nur die exakten Entscheidungen `allow-once` und `allow-always`, die von der
Anfrage zugelassen werden, ermöglichen die Ausführung. Unbekannte, fehlerhafte, nicht passende, fehlende und zeitlich überschrittene
Entscheidungen werden sicher abgelehnt. Das veraltete Feld `timeoutBehavior` wird aus Gründen der
Plugin-Kompatibilität weiterhin akzeptiert, ist jedoch veraltet und wird ignoriert; legen Sie es in neuen Hooks nicht fest.

`allow-always` ist nur dauerhaft, wenn das anfragende Plugin oder die Laufzeit
diese Persistenz implementiert. Bei gewöhnlichen `before_tool_call.requireApproval`-Hooks
behandelt OpenClaw `allow-once` und `allow-always` als Genehmigungsentscheidungen für den
aktuellen Aufruf und übergibt den aufgelösten Wert an `onResolution`. Wenn Ihr Plugin
`allow-always` anbietet, dokumentieren und implementieren Sie exakt, welchen zukünftigen Aufrufen es
vertraut.

Wenn der Hook außerdem `params` zurückgibt, wendet OpenClaw diese Parameteränderungen erst
nach erfolgreicher Genehmigung an. Ein Hook mit niedrigerer Priorität kann weiterhin blockieren, nachdem ein
Hook mit höherer Priorität eine Genehmigung angefordert hat.

`allowedDecisions` begrenzt die Schaltflächen und Befehle, die der Person angezeigt werden. Der
Gateway lehnt jeden Auflösungsversuch für eine Entscheidung ab, die von der Anfrage nicht angeboten wurde.

## Genehmigungsaufforderungen weiterleiten

Genehmigungsaufforderungen können auf lokalen Benutzeroberflächen oder in Chat-Kanälen aufgelöst werden, die
die Genehmigungsverarbeitung unterstützen. Um Plugin-Genehmigungsaufforderungen an explizite Chat-
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

`approvals.plugin` ist von `approvals.exec` unabhängig. Das Aktivieren der Weiterleitung von Ausführungsgenehmigungen
leitet keine Plugin-Genehmigungsaufforderungen weiter, und das Aktivieren der Weiterleitung von Plugin-Genehmigungen
ändert die Host-Ausführungsrichtlinie nicht.

Wenn eine Aufforderung manuellen Genehmigungstext enthält, lösen Sie sie mit einer der angebotenen
Entscheidungen auf:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Unter [Erweiterte Ausführungsgenehmigungen](/de/tools/exec-approvals-advanced#plugin-approval-forwarding)
finden Sie das vollständige Weiterleitungsmodell, das Genehmigungsverhalten im selben Chat, die native Kanal-
zustellung und kanalspezifische Regeln für genehmigende Personen.

## Native Codex-Berechtigungen

Native Codex-Berechtigungsaufforderungen können ebenfalls über Plugin-Genehmigungen geleitet werden, haben jedoch
eine andere Zuständigkeit als von Plugins erstellte Hooks.

- Genehmigungsanfragen des Codex-App-Servers werden nach der Codex-Prüfung über OpenClaw geleitet.
- Die Weiterleitung des nativen Hooks `permission_request` kann über
  `plugin.approval.request` nachfragen, wenn diese Weiterleitung aktiviert ist.
- MCP-Tool-Genehmigungsabfragen werden über Plugin-Genehmigungen geleitet, wenn Codex
  `_meta.codex_approval_kind` als `"mcp_tool_call"` kennzeichnet.

Unter [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
finden Sie das Codex-spezifische Verhalten und die Fallback-Regeln.

## Fehlerbehebung

**Das Tool meldet, dass Plugin-Genehmigungen nicht verfügbar sind.** Keine Genehmigungsoberfläche und keine konfigurierte
Genehmigungsroute hat die Anfrage angenommen. Verbinden Sie einen genehmigungsfähigen Client, verwenden Sie einen
Kanal, der `/approve` im selben Chat unterstützt, oder konfigurieren Sie `approvals.plugin`.

**`allow-always` erscheint, aber beim nächsten Aufruf wird erneut nachgefragt.** Der generische Plugin-
Genehmigungsablauf speichert Vertrauen für beliebige Hooks nicht automatisch dauerhaft. Speichern Sie
Plugin-eigenes Vertrauen nach `onResolution("allow-always")` dauerhaft in Ihrem Plugin oder
bieten Sie nur `allow-once` und `deny` an.

**`/approve` lehnt die Entscheidung ab.** Die Anfrage hat
`allowedDecisions` eingeschränkt. Verwenden Sie eine der in der Aufforderung ausgegebenen Entscheidungen.

**Eine Discord-, Matrix-, Slack- oder Telegram-Aufforderung wird anders weitergeleitet als Ausführungs-
genehmigungen.** Plugin-Genehmigungen und Ausführungsgenehmigungen verwenden separate Konfigurationen und möglicherweise
unterschiedliche Autorisierungsprüfungen. Überprüfen Sie `approvals.plugin` und die Unterstützung des Kanals für
Plugin-Genehmigungen, anstatt nur `approvals.exec` zu prüfen.

## Verwandte Themen

- [Plugin-Hooks](/de/plugins/hooks#tool-call-policy)
- [Plugins erstellen](/de/plugins/building-plugins#registering-tools)
- [Erweiterte Ausführungsgenehmigungen](/de/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway-Protokoll](/de/gateway/protocol)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
