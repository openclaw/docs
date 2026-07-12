---
read_when:
    - Sie benötigen einen Plugin-Hook oder ein Tool, um vor der Ausführung eines Nebeneffekts nachzufragen
    - Sie müssen konfigurieren, wohin Aufforderungen zur Plugin-Genehmigung gesendet werden.
    - Sie entscheiden zwischen optionalen Tools, Ausführungsgenehmigungen und Plugin-Genehmigungen
sidebarTitle: Permission requests
summary: Bitten Sie Benutzer, Tool-Aufrufe von Plugins und Plugin-eigene Berechtigungsanfragen zu genehmigen
title: Plugin-Berechtigungsanfragen
x-i18n:
    generated_at: "2026-07-12T15:36:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Plugin-Berechtigungsanfragen ermöglichen es Plugin-Code, einen Tool-Aufruf oder einen Plugin-eigenen
Vorgang anzuhalten, bis ein Benutzer ihn genehmigt oder ablehnt. Sie verwenden den Gateway-
Ablauf `plugin.approval.*` und dieselben Genehmigungsoberflächen, die Genehmigungsschaltflächen
im Chat und `/approve`-Befehle verarbeiten.

Verwenden Sie Plugin-Berechtigungsanfragen für Plugin-/App-Berechtigungen. Sie ersetzen weder
Host-Ausführungsgenehmigungen noch optionale Tool-Zulassungslisten oder die native Berechtigungsprüfung
von Codex.

## Das richtige Gate auswählen

Wählen Sie das Gate, das dem benötigten Entscheidungspunkt entspricht:

| Gate                                  | Verwenden, wenn                                                               | Gesteuerter Bereich                                                                                                                |
| ------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Optionale Tools                       | Ein Tool für das Modell erst nach Zustimmung des Benutzers sichtbar sein soll. | Tool-Bereitstellung über `tools.allow`.                                                                                            |
| Plugin-Berechtigungsanfragen          | Ein Plugin-Hook oder Plugin-eigener Vorgang vor einer Aktion fragen muss.     | Laufzeitgenehmigung über `plugin.approval.*`.                                                                                      |
| Ausführungsgenehmigungen              | Ein Host-Befehl oder Shell-ähnliches Tool die Genehmigung des Betreibers benötigt. | Host-Ausführungsrichtlinie und dauerhafte Ausführungs-Zulassungslisten.                                                            |
| Native Codex-Berechtigungsanfragen    | Codex vor nativen Shell-, Datei-, MCP- oder App-Server-Aktionen fragt.        | Genehmigungsverarbeitung des Codex-App-Servers oder nativer Hooks, über Plugin-Genehmigungen geleitet, wenn OpenClaw die Abfrage verwaltet. |
| MCP-Genehmigungsabfragen              | Ein Codex-MCP-Server eine Genehmigung für einen Tool-Aufruf anfordert.        | Über OpenClaw-Plugin-Genehmigungen vermittelte MCP-Genehmigungsantworten.                                                          |

Optionale Tools sind ein Gate zur Erkennungszeit. Plugin-Berechtigungsanfragen sind ein
Gate pro Aufruf. Verwenden Sie beides, wenn ein sensibles Tool eine ausdrückliche Zustimmung
erfordern soll, bevor das Modell es sehen kann, sowie eine Genehmigung, bevor die Aktion ausgeführt wird.

## Genehmigung vor einem Tool-Aufruf anfordern

Die meisten von Plugins erstellten Abfragen sollten in einem `before_tool_call`-Hook beginnen. Der Hook
wird ausgeführt, nachdem das Modell ein Tool ausgewählt hat und bevor OpenClaw es ausführt:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Bereitstellungsrichtlinie",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unbekannt";

      return {
        requireApproval: {
          title: "Dienst bereitstellen",
          description: `Dienst in ${environment} bereitstellen.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          onResolution(decision) {
            console.log(`Bereitstellungsgenehmigung entschieden: ${decision}`);
          },
        },
      };
    });
  },
});
```

Formulieren Sie den Abfragetext für die Person, die die Aktion genehmigen wird:

- Halten Sie `title` kurz und aktionsbezogen; der Gateway begrenzt ihn auf 80 Zeichen.
- Formulieren Sie `description` konkret und klar abgegrenzt; der Gateway begrenzt sie auf 512
  Zeichen.
- Nennen Sie Aktion, Ziel und Risiko. Geben Sie keine Geheimnisse, Token oder
  privaten Nutzdaten an, die nicht in Genehmigungsoberflächen im Chat erscheinen sollten.
- `severity` verwendet standardmäßig `"warning"`, wenn es weggelassen wird. Verwenden Sie `"critical"` nur für
  Aktionen, bei denen eine falsche Entscheidung Produktionsschäden oder Datenverlust verursachen könnte.
- `allowedDecisions` verwendet standardmäßig `["allow-once", "allow-always", "deny"]`, wenn es
  weggelassen wird. Übergeben Sie `["allow-once", "deny"]`, wenn dauerhaftes Vertrauen für
  diese Aktion unsicher ist.
- `timeoutMs` verwendet standardmäßig 120000 (2 Minuten) und ist unabhängig vom angeforderten Wert
  auf 600000 (10 Minuten) begrenzt.

## Entscheidungsverhalten

OpenClaw erstellt eine ausstehende Genehmigung mit einer `plugin:`-ID, übermittelt sie an die
verfügbaren Genehmigungsoberflächen und wartet auf eine Entscheidung.

| Entscheidung       | Ergebnis                                                                  |
| ------------------ | ------------------------------------------------------------------------- |
| `allow-once`       | Der aktuelle Aufruf wird fortgesetzt.                                     |
| `allow-always`     | Der aktuelle Aufruf wird fortgesetzt und die Entscheidung an das Plugin übergeben. |
| `deny`             | Der Aufruf wird mit einem abgelehnten Tool-Ergebnis blockiert.            |
| Zeitüberschreitung | Der Aufruf wird blockiert.                                                |
| Abbruch            | Der Aufruf wird blockiert, wenn die Ausführung abgebrochen wird.          |
| Kein Genehmigungsweg | Der Aufruf wird blockiert, weil keine verbundene Genehmigungsoberfläche ihn entscheiden kann. |

Nur die exakten, von der Anfrage zugelassenen Entscheidungen `allow-once` und
`allow-always` erlauben die Ausführung. Unbekannte, fehlerhafte, nicht übereinstimmende,
fehlende und abgelaufene Entscheidungen führen sicher zur Ablehnung. Das veraltete Feld
`timeoutBehavior` wird aus Gründen der Plugin-Kompatibilität weiterhin akzeptiert, ist jedoch
veraltet und wird ignoriert; legen Sie es in neuen Hooks nicht fest.

`allow-always` ist nur dauerhaft, wenn das anfragende Plugin oder die Laufzeit diese
Persistenz implementiert. Bei gewöhnlichen `before_tool_call.requireApproval`-Hooks
behandelt OpenClaw `allow-once` und `allow-always` als Genehmigungsentscheidungen für den
aktuellen Aufruf und übergibt den aufgelösten Wert an `onResolution`. Wenn Ihr Plugin
`allow-always` anbietet, dokumentieren und implementieren Sie genau, welchen zukünftigen Aufrufen es
vertraut.

Wenn der Hook zusätzlich `params` zurückgibt, wendet OpenClaw diese Parameteränderungen erst
nach erfolgreicher Genehmigung an. Ein Hook mit niedrigerer Priorität kann weiterhin blockieren,
nachdem ein Hook mit höherer Priorität eine Genehmigung angefordert hat.

`allowedDecisions` beschränkt die Schaltflächen und Befehle, die dem Benutzer angezeigt werden. Der
Gateway weist einen Entscheidungsversuch für jede Entscheidung zurück, die in der Anfrage nicht angeboten wurde.

## Genehmigungsabfragen weiterleiten

Genehmigungsabfragen können in lokalen Benutzeroberflächen oder in Chat-Kanälen entschieden werden,
die die Genehmigungsverarbeitung unterstützen. Um Plugin-Genehmigungsabfragen an ausdrückliche Chat-
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

`approvals.plugin` ist unabhängig von `approvals.exec`. Das Aktivieren der Weiterleitung von
Ausführungsgenehmigungen leitet keine Plugin-Genehmigungsabfragen weiter, und das Aktivieren der Weiterleitung von
Plugin-Genehmigungen ändert nicht die Host-Ausführungsrichtlinie.

Wenn eine Abfrage manuellen Genehmigungstext enthält, entscheiden Sie sie mit einer der angebotenen
Entscheidungen:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Siehe [Erweiterte Ausführungsgenehmigungen](/de/tools/exec-approvals-advanced#plugin-approval-forwarding)
für das vollständige Weiterleitungsmodell, Genehmigungsverhalten im selben Chat, native Kanal-
Zustellung und kanalspezifische Regeln für Genehmigende.

## Native Codex-Berechtigungen

Native Codex-Berechtigungsabfragen können ebenfalls über Plugin-Genehmigungen übertragen werden,
haben jedoch andere Zuständigkeiten als von Plugins erstellte Hooks.

- Genehmigungsanfragen des Codex-App-Servers werden nach der Codex-Prüfung über OpenClaw weitergeleitet.
- Die Weiterleitung des nativen Hooks `permission_request` kann über
  `plugin.approval.request` anfragen, wenn diese Weiterleitung aktiviert ist.
- Genehmigungsabfragen für MCP-Tools werden über Plugin-Genehmigungen weitergeleitet, wenn Codex
  `_meta.codex_approval_kind` als `"mcp_tool_call"` kennzeichnet.

Siehe [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
für Codex-spezifisches Verhalten und Rückfallregeln.

## Fehlerbehebung

**Das Tool meldet, dass Plugin-Genehmigungen nicht verfügbar sind.** Keine Genehmigungsoberfläche und kein konfigurierter
Genehmigungsweg hat die Anfrage angenommen. Verbinden Sie einen genehmigungsfähigen Client, verwenden Sie einen
Kanal, der `/approve` im selben Chat unterstützt, oder konfigurieren Sie `approvals.plugin`.

**`allow-always` wird angezeigt, aber beim nächsten Aufruf wird erneut gefragt.** Der generische Ablauf für
Plugin-Genehmigungen speichert Vertrauen für beliebige Hooks nicht automatisch dauerhaft. Speichern Sie
Plugin-eigenes Vertrauen nach `onResolution("allow-always")` dauerhaft in Ihrem Plugin oder
bieten Sie nur `allow-once` und `deny` an.

**`/approve` weist die Entscheidung zurück.** Die Anfrage hat
`allowedDecisions` eingeschränkt. Verwenden Sie eine der in der Abfrage ausgegebenen Entscheidungen.

**Eine Abfrage in Discord, Matrix, Slack oder Telegram wird anders weitergeleitet als Ausführungs-
genehmigungen.** Plugin-Genehmigungen und Ausführungsgenehmigungen verwenden getrennte Konfigurationen und können
unterschiedliche Autorisierungsprüfungen verwenden. Prüfen Sie `approvals.plugin` und die Unterstützung des Kanals
für Plugin-Genehmigungen, statt nur `approvals.exec` zu prüfen.

## Verwandte Themen

- [Plugin-Hooks](/de/plugins/hooks#tool-call-policy)
- [Plugins erstellen](/de/plugins/building-plugins#registering-tools)
- [Erweiterte Ausführungsgenehmigungen](/de/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway-Protokoll](/de/gateway/protocol)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
