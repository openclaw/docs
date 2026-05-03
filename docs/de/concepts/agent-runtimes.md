---
read_when:
    - Sie wählen zwischen PI, Codex, ACP oder einer anderen nativen Laufzeitumgebung für Agenten
    - Sie sind durch Provider-/Modell-/Runtime-Bezeichnungen in Status oder Konfiguration verwirrt
    - Sie dokumentieren die Support-Parität für ein natives Harness
summary: Wie OpenClaw Modell-Provider, Modelle, Kanäle und Agent-Runtimes trennt
title: Agent-Laufzeiten
x-i18n:
    generated_at: "2026-05-03T06:36:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Ein **Agent-Runtime** ist die Komponente, die eine vorbereitete Modellschleife besitzt: Sie
empfängt den Prompt, steuert die Modellausgabe, verarbeitet native Tool-Aufrufe und gibt
den abgeschlossenen Turn an OpenClaw zurück.

Runtimes werden leicht mit Providern verwechselt, weil beide in der Nähe der
Modellkonfiguration erscheinen. Es sind unterschiedliche Ebenen:

| Ebene         | Beispiele                             | Bedeutung                                                           |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | Wie OpenClaw authentifiziert, Modelle ermittelt und Modellrefs benennt. |
| Modell        | `gpt-5.5`, `claude-opus-4-6`          | Das für den Agent-Turn ausgewählte Modell.                          |
| Agent-Runtime | `pi`, `codex`, `claude-cli`           | Die Low-Level-Schleife oder das Backend, das den vorbereiteten Turn ausführt. |
| Kanal         | Telegram, Discord, Slack, WhatsApp    | Wo Nachrichten in OpenClaw eingehen und OpenClaw verlassen.         |

Im Code sehen Sie außerdem das Wort **Harness**. Ein Harness ist die Implementierung,
die eine Agent-Runtime bereitstellt. Der gebündelte Codex-Harness
implementiert beispielsweise die `codex`-Runtime. Öffentliche Konfiguration verwendet `agentRuntime.id`; `openclaw
doctor --fix` schreibt ältere Runtime-Policy-Schlüssel in diese Form um.

Es gibt zwei Runtime-Familien:

- **Eingebettete Harnesses** laufen innerhalb der vorbereiteten Agent-Schleife von OpenClaw. Heute ist dies
  die integrierte `pi`-Runtime plus registrierte Plugin-Harnesses wie
  `codex`.
- **CLI-Backends** führen einen lokalen CLI-Prozess aus, während die Modellref
  kanonisch bleibt. Beispielsweise bedeutet `anthropic/claude-opus-4-7` mit
  `agentRuntime.id: "claude-cli"`: „Anthropic-Modell auswählen, über
  Claude CLI ausführen.“ `claude-cli` ist keine eingebettete Harness-ID und darf nicht
  an die AgentHarness-Auswahl übergeben werden.

## Codex-Oberflächen

Die meiste Verwirrung entsteht, weil mehrere unterschiedliche Oberflächen den Namen Codex teilen:

| Oberfläche                                            | OpenClaw-Name/-Konfiguration              | Funktion                                                                                                  |
| ----------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Native Codex-App-Server-Runtime                       | `openai/*` plus `agentRuntime.id: "codex"` | Führt den eingebetteten Agent-Turn über den Codex-App-Server aus. Dies ist die übliche ChatGPT/Codex-Abonnement-Konfiguration. |
| Codex-OAuth-Provider-Route                            | `openai-codex/*`-Modellrefs               | Verwendet ChatGPT/Codex-Abonnement-OAuth über den normalen OpenClaw-PI-Runner.                            |
| Codex-ACP-Adapter                                     | `runtime: "acp"`, `agentId: "codex"`       | Führt Codex über die externe ACP/acpx-Steuerungsebene aus. Nur verwenden, wenn ausdrücklich ACP/acpx angefragt wird. |
| Nativer Codex-Chat-Steuerungsbefehlssatz              | `/codex ...`                              | Bindet, setzt fort, steuert, stoppt und inspiziert Codex-App-Server-Threads aus dem Chat.                 |
| OpenAI-Platform-API-Route für GPT-/Codex-artige Modelle | `openai/*`-Modellrefs                      | Verwendet OpenAI-API-Key-Authentifizierung, sofern kein Runtime-Override wie `agentRuntime.id: "codex"` den Turn ausführt. |

Diese Oberflächen sind absichtlich unabhängig. Das Aktivieren des `codex`-Plugins macht
die nativen App-Server-Funktionen verfügbar; es schreibt
`openai-codex/*` nicht in `openai/*` um, ändert keine bestehenden Sitzungen und macht
ACP nicht zum Codex-Standard. Die Auswahl von `openai-codex/*` bedeutet „die Codex-
OAuth-Provider-Route verwenden“, sofern Sie nicht separat eine Runtime erzwingen.

Die gängige ChatGPT/Codex-Abonnement-Konfiguration verwendet Codex OAuth für die Authentifizierung, behält
die Modellref aber als `openai/*` bei und wählt die `codex`-Runtime aus:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Das bedeutet, dass OpenClaw eine OpenAI-Modellref auswählt und dann die Codex-App-Server-
Runtime bittet, den eingebetteten Agent-Turn auszuführen. Es bedeutet nicht „API-Abrechnung verwenden“, und
es bedeutet nicht, dass der Kanal, der Modell-Provider-Katalog oder der OpenClaw-Sitzungsspeicher
zu Codex wird.

Wenn das gebündelte `codex`-Plugin aktiviert ist, sollte die natürlichsprachliche Codex-Steuerung
die native `/codex`-Befehlsoberfläche verwenden (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) statt ACP. Verwenden Sie ACP für
Codex nur, wenn der Benutzer ausdrücklich nach ACP/acpx fragt oder den ACP-
Adapterpfad testet. Claude Code, Gemini CLI, OpenCode, Cursor und ähnliche externe
Harnesses verwenden weiterhin ACP.

Dies ist der entscheidungsbaum für Agents:

1. Wenn der Benutzer nach **Codex bind/control/thread/resume/steer/stop** fragt, verwenden Sie die
   native `/codex`-Befehlsoberfläche, wenn das gebündelte `codex`-Plugin aktiviert ist.
2. Wenn der Benutzer nach **Codex als eingebetteter Runtime** fragt oder die normale
   abonnementgestützte Codex-Agent-Erfahrung möchte, verwenden Sie
   `openai/<model>` mit `agentRuntime.id: "codex"`.
3. Wenn der Benutzer nach **Codex-OAuth-/Abonnement-Authentifizierung auf dem normalen OpenClaw-
   Runner** fragt, verwenden Sie `openai-codex/<model>` und belassen die Runtime bei PI.
4. Wenn der Benutzer ausdrücklich **ACP**, **acpx** oder **Codex-ACP-Adapter** sagt, verwenden Sie
   ACP mit `runtime: "acp"` und `agentId: "codex"`.
5. Wenn sich die Anfrage auf **Claude Code, Gemini CLI, OpenCode, Cursor, Droid oder
   einen anderen externen Harness** bezieht, verwenden Sie ACP/acpx, nicht die native Sub-Agent-Runtime.

| Gemeint ist...                         | Verwenden Sie...                            |
| -------------------------------------- | ------------------------------------------- |
| Codex-App-Server-Chat-/Thread-Steuerung | `/codex ...` aus dem gebündelten `codex`-Plugin |
| Eingebettete Agent-Runtime des Codex-App-Servers | `agentRuntime.id: "codex"`                  |
| OpenAI Codex OAuth auf dem PI-Runner   | `openai-codex/*`-Modellrefs                 |
| Claude Code oder anderer externer Harness | ACP/acpx                                    |

Für die Aufteilung der OpenAI-Familienpräfixe siehe [OpenAI](/de/providers/openai) und
[Modell-Provider](/de/concepts/model-providers). Für den Support-Vertrag der Codex-Runtime
siehe [Codex-Harness](/de/plugins/codex-harness#v1-support-contract).

## Runtime-Verantwortung

Unterschiedliche Runtimes besitzen unterschiedliche Teile der Schleife.

| Oberfläche                  | OpenClaw PI eingebettet                | Codex-App-Server                                                           |
| --------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Besitzer der Modellschleife | OpenClaw über den eingebetteten PI-Runner | Codex-App-Server                                                           |
| Kanonischer Thread-Zustand  | OpenClaw-Transkript                    | Codex-Thread plus OpenClaw-Transkriptspiegel                               |
| Dynamische OpenClaw-Tools   | Native OpenClaw-Tool-Schleife          | Über den Codex-Adapter gebrückt                                            |
| Native Shell- und Datei-Tools | PI-/OpenClaw-Pfad                     | Codex-native Tools, über native Hooks gebrückt, wo unterstützt             |
| Kontext-Engine              | Native OpenClaw-Kontextzusammenstellung | OpenClaw projiziert zusammengestellten Kontext in den Codex-Turn           |
| Compaction                  | OpenClaw oder ausgewählte Kontext-Engine | Codex-native Compaction, mit OpenClaw-Benachrichtigungen und Spiegelpflege |
| Kanalauslieferung           | OpenClaw                               | OpenClaw                                                                   |

Diese Aufteilung der Verantwortung ist die wichtigste Designregel:

- Wenn OpenClaw die Oberfläche besitzt, kann OpenClaw normales Plugin-Hook-Verhalten bereitstellen.
- Wenn die native Runtime die Oberfläche besitzt, benötigt OpenClaw Runtime-Ereignisse oder native Hooks.
- Wenn die native Runtime den kanonischen Thread-Zustand besitzt, sollte OpenClaw Kontext spiegeln und projizieren, nicht nicht unterstützte Interna umschreiben.

## Runtime-Auswahl

OpenClaw wählt nach Provider- und Modellauflösung eine eingebettete Runtime aus:

1. Die aufgezeichnete Runtime einer Sitzung hat Vorrang. Konfigurationsänderungen schalten ein
   bestehendes Transkript nicht im laufenden Betrieb auf ein anderes natives Thread-System um.
2. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt diese Runtime für neue oder zurückgesetzte Sitzungen.
3. `agents.defaults.agentRuntime.id` oder `agents.list[].agentRuntime.id` kann
   `auto`, `pi`, eine registrierte eingebettete Harness-ID wie `codex` oder einen
   unterstützten CLI-Backend-Alias wie `claude-cli` setzen.
4. Im Modus `auto` können registrierte Plugin-Runtimes unterstützte Provider-/Modell-
   Paare beanspruchen.
5. Wenn im Modus `auto` keine Runtime einen Turn beansprucht, verwendet OpenClaw PI als
   Kompatibilitätsruntime. Verwenden Sie eine explizite Runtime-ID, wenn der Lauf
   strikt sein muss.

Explizite Plugin-Runtimes schlagen geschlossen fehl. Beispielsweise bedeutet `agentRuntime.id: "codex"`
Codex oder einen klaren Auswahl-/Runtime-Fehler; es wird niemals stillschweigend zurück
zu PI geroutet.

CLI-Backend-Aliase unterscheiden sich von eingebetteten Harness-IDs. Die bevorzugte
Claude-CLI-Form ist:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

Legacy-Refs wie `claude-cli/claude-opus-4-7` bleiben aus Kompatibilitätsgründen
unterstützt, aber neue Konfiguration sollte Provider/Modell kanonisch halten und das
Ausführungsbackend in `agentRuntime.id` ablegen.

Der Modus `auto` ist absichtlich konservativ. Plugin-Runtimes können
Provider-/Modellpaare beanspruchen, die sie verstehen, aber das Codex-Plugin beansprucht den
Provider `openai-codex` im Modus `auto` nicht. Dadurch bleibt
`openai-codex/*` die explizite PI-Codex-OAuth-Route und es wird vermieden, dass
Abonnement-Authentifizierungskonfigurationen stillschweigend auf den nativen App-Server-Harness
verschoben werden.

Wenn `openclaw doctor` warnt, dass das `codex`-Plugin aktiviert ist, während
`openai-codex/*` weiterhin über PI geroutet wird, behandeln Sie das als Diagnose, nicht als
Migration. Lassen Sie die Konfiguration unverändert, wenn PI Codex OAuth gewünscht ist.
Wechseln Sie zu `openai/<model>` plus `agentRuntime.id: "codex"` nur, wenn Sie native
Codex-App-Server-Ausführung wünschen.

## Kompatibilitätsvertrag

Wenn eine Runtime nicht PI ist, sollte sie dokumentieren, welche OpenClaw-Oberflächen sie unterstützt.
Verwenden Sie diese Form für Runtime-Dokumentation:

| Frage                                  | Warum es wichtig ist                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Wer besitzt die Modellschleife?        | Bestimmt, wo Wiederholungen, Tool-Fortsetzung und Entscheidungen zur endgültigen Antwort stattfinden. |
| Wer besitzt den kanonischen Thread-Verlauf? | Bestimmt, ob OpenClaw den Verlauf bearbeiten oder nur spiegeln kann.                           |
| Funktionieren dynamische OpenClaw-Tools? | Messaging, Sitzungen, Cron und OpenClaw-eigene Tools verlassen sich darauf.                    |
| Funktionieren dynamische Tool-Hooks?   | Plugins erwarten `before_tool_call`, `after_tool_call` und Middleware um OpenClaw-eigene Tools. |
| Funktionieren native Tool-Hooks?       | Shell-, Patch- und runtime-eigene Tools benötigen native Hook-Unterstützung für Policy und Beobachtung. |
| Läuft der Lebenszyklus der Kontext-Engine? | Speicher- und Kontext-Plugins hängen von Assemble-, Ingest-, After-Turn- und Compaction-Lebenszyklen ab. |
| Welche Compaction-Daten werden offengelegt? | Einige Plugins benötigen nur Benachrichtigungen, während andere Metadaten zu Behalten/Verwerfen benötigen. |
| Was wird absichtlich nicht unterstützt? | Benutzer sollten keine PI-Gleichwertigkeit annehmen, wo die native Runtime mehr Zustand besitzt. |

Der Support-Vertrag der Codex-Runtime ist dokumentiert in
[Codex-Harness](/de/plugins/codex-harness#v1-support-contract).

## Statuslabels

Die Statusausgabe kann sowohl die Bezeichnungen `Execution` als auch `Runtime` anzeigen. Lesen Sie sie als
Diagnosen, nicht als Provider-Namen.

- Eine Modellreferenz wie `openai/gpt-5.5` zeigt Ihnen den ausgewählten Provider/das ausgewählte Modell.
- Eine Runtime-ID wie `codex` zeigt Ihnen, welche Schleife den Turn ausführt.
- Eine Kanalbezeichnung wie Telegram oder Discord zeigt Ihnen, wo die Unterhaltung stattfindet.

Wenn eine Sitzung nach dem Ändern der Runtime-Konfiguration weiterhin PI anzeigt, starten Sie eine neue Sitzung
mit `/new` oder löschen Sie die aktuelle mit `/reset`. Bestehende Sitzungen behalten ihre
aufgezeichnete Runtime, damit ein Transkript nicht durch zwei inkompatible native
Sitzungssysteme erneut wiedergegeben wird.

## Verwandt

- [Codex-Harness](/de/plugins/codex-harness)
- [OpenAI](/de/providers/openai)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agentenschleife](/de/concepts/agent-loop)
- [Modelle](/de/concepts/models)
- [Status](/de/cli/status)
