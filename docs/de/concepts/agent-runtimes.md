---
read_when:
    - Sie wählen zwischen PI, Codex, ACP oder einer anderen nativen Agent-Laufzeitumgebung
    - Sie sind durch Provider-/Modell-/Laufzeitbezeichnungen in Status oder Konfiguration verwirrt
    - Sie dokumentieren die Funktionsparität für ein natives Harness
summary: Wie OpenClaw Modell-Provider, Modelle, Kanäle und Agent-Laufzeitumgebungen voneinander trennt
title: Agent-Laufzeitumgebungen
x-i18n:
    generated_at: "2026-04-26T11:26:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 15
---

Eine **Agent-Laufzeitumgebung** ist die Komponente, die eine vorbereitete Modellschleife besitzt: Sie
empfängt den Prompt, steuert die Modellausgabe, verarbeitet native Tool-Aufrufe und gibt
den fertigen Durchlauf an OpenClaw zurück.

Laufzeitumgebungen lassen sich leicht mit Providern verwechseln, weil beide in der Nähe der Modell-
konfiguration erscheinen. Es sind unterschiedliche Ebenen:

| Ebene         | Beispiele                             | Bedeutung                                                           |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | Wie OpenClaw authentifiziert, Modelle erkennt und Modell-Refs benennt. |
| Modell        | `gpt-5.5`, `claude-opus-4-6`          | Das für den Agent-Durchlauf ausgewählte Modell.                     |
| Agent-Laufzeitumgebung | `pi`, `codex`, `claude-cli`   | Die Low-Level-Schleife oder das Backend, das den vorbereiteten Durchlauf ausführt. |
| Kanal         | Telegram, Discord, Slack, WhatsApp    | Wo Nachrichten in OpenClaw eingehen und es verlassen.              |

Im Code sehen Sie außerdem das Wort **Harness**. Ein Harness ist die Implementierung,
die eine Agent-Laufzeitumgebung bereitstellt. Zum Beispiel implementiert das mitgelieferte Codex-Harness
die Laufzeitumgebung `codex`. Die öffentliche Konfiguration verwendet `agentRuntime.id`; `openclaw
doctor --fix` schreibt ältere Schlüssel der Laufzeitrichtlinie in diese Form um.

Es gibt zwei Laufzeitfamilien:

- **Eingebettete Harnesses** laufen innerhalb der vorbereiteten Agent-Schleife von OpenClaw. Heute
  ist das die eingebaute Laufzeitumgebung `pi` plus registrierte Plugin-Harnesses wie
  `codex`.
- **CLI-Backends** führen einen lokalen CLI-Prozess aus, während sie die Modell-Ref
  kanonisch halten. Zum Beispiel bedeutet `anthropic/claude-opus-4-7` mit
  `agentRuntime.id: "claude-cli"`: „Anthropic-Modell auswählen, über
  Claude CLI ausführen.“ `claude-cli` ist keine ID für ein eingebettetes Harness und darf nicht an die Auswahl von AgentHarness übergeben werden.

## Drei Dinge namens Codex

Die meiste Verwirrung entsteht dadurch, dass drei verschiedene Oberflächen den Namen Codex teilen:

| Oberfläche                                           | OpenClaw-Name/-Konfiguration         | Funktion                                                                                             |
| ---------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| OAuth-Provider-Route für Codex                       | `openai-codex/*` Modell-Refs         | Verwendet ChatGPT-/Codex-Abonnement-OAuth über den normalen PI-Runner von OpenClaw.                 |
| Native App-Server-Laufzeitumgebung von Codex         | `agentRuntime.id: "codex"`           | Führt den eingebetteten Agent-Durchlauf über das mitgelieferte Codex-App-Server-Harness aus.        |
| Codex-ACP-Adapter                                    | `runtime: "acp"`, `agentId: "codex"` | Führt Codex über die externe ACP/acpx-Kontrollebene aus. Nur verwenden, wenn ACP/acpx ausdrücklich verlangt wird. |
| Nativer Chat-Steuerungsbefehlssatz von Codex         | `/codex ...`                         | Bindet, setzt fort, steuert, stoppt und prüft Codex-App-Server-Threads aus dem Chat heraus.         |
| OpenAI-Platform-API-Route für Modelle im GPT-/Codex-Stil | `openai/*` Modell-Refs            | Verwendet Authentifizierung mit OpenAI-API-Schlüssel, sofern keine Laufzeitüberschreibung wie `runtime: "codex"` den Durchlauf ausführt. |

Diese Oberflächen sind absichtlich unabhängig. Das Aktivieren des Plugins `codex` macht
die nativen App-Server-Funktionen verfügbar; es schreibt `openai-codex/*` nicht in `openai/*` um,
ändert keine bestehenden Sitzungen und macht ACP nicht zum Codex-Standard. Die Auswahl von `openai-codex/*` bedeutet „die OAuth-Provider-Route von Codex verwenden“, sofern Sie nicht separat eine Laufzeitumgebung erzwingen.

Das übliche Codex-Setup verwendet den Provider `openai` mit der Laufzeitumgebung `codex`:

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

Das bedeutet, dass OpenClaw eine OpenAI-Modell-Ref auswählt und dann die Laufzeitumgebung
des Codex-App-Servers auffordert, den eingebetteten Agent-Durchlauf auszuführen. Es bedeutet nicht, dass der Kanal, der Modell-
Provider-Katalog oder der Sitzungsspeicher von OpenClaw zu Codex werden.

Wenn das mitgelieferte Plugin `codex` aktiviert ist, sollte die natürliche Sprachsteuerung von Codex
die native Befehlsoberfläche `/codex` verwenden (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) statt ACP. Verwenden Sie ACP für
Codex nur, wenn der Benutzer ausdrücklich nach ACP/acpx fragt oder den ACP-
Adapterpfad testen möchte. Claude Code, Gemini CLI, OpenCode, Cursor und ähnliche externe
Harnesses verwenden weiterhin ACP.

Dies ist der entscheidungsbaum für Agents:

1. Wenn der Benutzer nach **Codex binden/steuern/thread/fortsetzen/lenken/stoppen** fragt, verwenden Sie die
   native Befehlsoberfläche `/codex`, wenn das mitgelieferte Plugin `codex` aktiviert ist.
2. Wenn der Benutzer nach **Codex als eingebetteter Laufzeitumgebung** fragt, verwenden Sie
   `openai/<model>` mit `agentRuntime.id: "codex"`.
3. Wenn der Benutzer nach **Codex OAuth/Abonnement-Authentifizierung auf dem normalen OpenClaw-
   Runner** fragt, verwenden Sie `openai-codex/<model>` und lassen Sie die Laufzeitumgebung auf PI.
4. Wenn der Benutzer ausdrücklich **ACP**, **acpx** oder **Codex ACP adapter** sagt, verwenden Sie
   ACP mit `runtime: "acp"` und `agentId: "codex"`.
5. Wenn die Anfrage **Claude Code, Gemini CLI, OpenCode, Cursor, Droid oder
   ein anderes externes Harness** betrifft, verwenden Sie ACP/acpx, nicht die native Sub-Agent-Laufzeitumgebung.

| Gemeint ist...                          | Verwenden Sie...                                |
| --------------------------------------- | ----------------------------------------------- |
| Chat-/Thread-Steuerung des Codex-App-Servers | `/codex ...` aus dem mitgelieferten Plugin `codex` |
| Eingebettete Agent-Laufzeitumgebung des Codex-App-Servers | `agentRuntime.id: "codex"`         |
| OpenAI Codex OAuth auf dem PI-Runner    | `openai-codex/*` Modell-Refs                    |
| Claude Code oder anderes externes Harness | ACP/acpx                                      |

Zur Aufteilung der OpenAI-Familienpräfixe siehe [OpenAI](/de/providers/openai) und
[Model providers](/de/concepts/model-providers). Für den Support-Vertrag der Codex-Laufzeitumgebung
siehe [Codex harness](/de/plugins/codex-harness#v1-support-contract).

## Besitz der Laufzeitumgebung

Verschiedene Laufzeitumgebungen besitzen unterschiedlich große Teile der Schleife.

| Oberfläche                  | OpenClaw PI eingebettet                | Codex-App-Server                                                           |
| -------------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| Besitzer der Modellschleife | OpenClaw über den eingebetteten PI-Runner | Codex-App-Server                                                         |
| Kanonischer Thread-Zustand | OpenClaw-Transkript                    | Codex-Thread plus OpenClaw-Transkriptspiegel                              |
| Dynamische OpenClaw-Tools  | Native OpenClaw-Tool-Schleife          | Über den Codex-Adapter überbrückt                                          |
| Native Shell- und Dateitools | PI-/OpenClaw-Pfad                    | Codex-native Tools, über native Hooks überbrückt, wo unterstützt          |
| Kontext-Engine             | Native Kontextzusammenstellung von OpenClaw | OpenClaw projiziert zusammengestellten Kontext in den Codex-Durchlauf  |
| Compaction                 | OpenClaw oder ausgewählte Kontext-Engine | Codex-native Compaction mit OpenClaw-Benachrichtigungen und Spiegelpflege |
| Kanalzustellung            | OpenClaw                               | OpenClaw                                                                   |

Diese Aufteilung des Besitzes ist die wichtigste Entwurfsregel:

- Wenn OpenClaw die Oberfläche besitzt, kann OpenClaw normales Verhalten für Plugin-Hooks bereitstellen.
- Wenn die native Laufzeitumgebung die Oberfläche besitzt, benötigt OpenClaw Laufzeitereignisse oder native Hooks.
- Wenn die native Laufzeitumgebung den kanonischen Thread-Zustand besitzt, sollte OpenClaw den Kontext spiegeln und projizieren, nicht nicht unterstützte Interna umschreiben.

## Auswahl der Laufzeitumgebung

OpenClaw wählt eine eingebettete Laufzeitumgebung nach der Auflösung von Provider und Modell:

1. Die aufgezeichnete Laufzeitumgebung einer Sitzung hat Vorrang. Konfigurationsänderungen schalten ein
   bestehendes Transkript nicht im laufenden Betrieb auf ein anderes natives Thread-System um.
2. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt diese Laufzeitumgebung für neue oder zurückgesetzte Sitzungen.
3. `agents.defaults.agentRuntime.id` oder `agents.list[].agentRuntime.id` können
   `auto`, `pi`, eine registrierte eingebettete Harness-ID wie `codex` oder ein
   unterstütztes CLI-Backend-Alias wie `claude-cli` setzen.
4. Im Modus `auto` können registrierte Plugin-Laufzeitumgebungen unterstützte Provider-/Modell-
   Paare beanspruchen.
5. Wenn im Modus `auto` keine Laufzeitumgebung einen Durchlauf beansprucht und `fallback: "pi"` gesetzt ist
   (der Standard), verwendet OpenClaw PI als Kompatibilitäts-Fallback. Setzen Sie
   `fallback: "none"`, damit eine nicht passende Auswahl im Modus `auto` stattdessen fehlschlägt.

Explizite Plugin-Laufzeitumgebungen schlagen standardmäßig fail-closed fehl. Zum Beispiel
bedeutet `runtime: "codex"` Codex oder einen klaren Auswahlfehler, es sei denn, Sie setzen
`fallback: "pi"` im selben Überschreibungsbereich. Eine Laufzeitüberschreibung übernimmt
keine breitere Fallback-Einstellung, daher wird ein `runtime: "codex"` auf Agent-Ebene nicht stillschweigend
zurück auf PI geleitet, nur weil die Standards `fallback: "pi"` verwendet haben.

CLI-Backend-Aliasse unterscheiden sich von IDs eingebetteter Harnesses. Die bevorzugte
Form für Claude CLI ist:

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

Alte Refs wie `claude-cli/claude-opus-4-7` bleiben aus Kompatibilitätsgründen unterstützt,
aber neue Konfigurationen sollten Provider/Modell kanonisch halten und das
Ausführungs-Backend in `agentRuntime.id` ablegen.

Der Modus `auto` ist absichtlich konservativ. Plugin-Laufzeitumgebungen können
Provider-/Modell-Paare beanspruchen, die sie verstehen, aber das Plugin Codex beansprucht den
Provider `openai-codex` im Modus `auto` nicht. Dadurch bleibt
`openai-codex/*` die explizite PI-Codex-OAuth-Route und es wird vermieden, Konfigurationen mit Abonnement-
Authentifizierung stillschweigend auf das native App-Server-Harness zu verschieben.

Wenn `openclaw doctor` warnt, dass das Plugin `codex` aktiviert ist, während
`openai-codex/*` weiterhin über PI geleitet wird, behandeln Sie das als Diagnose, nicht als
Migration. Lassen Sie die Konfiguration unverändert, wenn Sie PI Codex OAuth möchten.
Wechseln Sie nur zu `openai/<model>` plus `agentRuntime.id: "codex"`, wenn Sie die native
Ausführung über den Codex-App-Server möchten.

## Kompatibilitätsvertrag

Wenn eine Laufzeitumgebung nicht PI ist, sollte sie dokumentieren, welche OpenClaw-Oberflächen sie unterstützt.
Verwenden Sie für Laufzeitdokumentation diese Form:

| Frage                                 | Warum das wichtig ist                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Wem gehört die Modellschleife?        | Bestimmt, wo Wiederholungen, Tool-Fortsetzung und Entscheidungen zur endgültigen Antwort stattfinden. |
| Wem gehört der kanonische Thread-Verlauf? | Bestimmt, ob OpenClaw den Verlauf bearbeiten oder ihn nur spiegeln kann.                       |
| Funktionieren dynamische OpenClaw-Tools? | Messaging, Sitzungen, Cron und OpenClaw-eigene Tools hängen davon ab.                          |
| Funktionieren Hooks für dynamische Tools? | Plugins erwarten `before_tool_call`, `after_tool_call` und Middleware um OpenClaw-eigene Tools. |
| Funktionieren native Tool-Hooks?      | Shell-, Patch- und laufzeitumgebungseigene Tools benötigen native Hook-Unterstützung für Richtlinien und Beobachtung. |
| Läuft der Lebenszyklus der Kontext-Engine? | Speicher- und Kontext-Plugins hängen vom Lebenszyklus assemble, ingest, after-turn und Compaction ab. |
| Welche Compaction-Daten werden offengelegt? | Einige Plugins benötigen nur Benachrichtigungen, andere Metadaten zu behalten/verworfen.       |
| Was wird absichtlich nicht unterstützt? | Benutzer sollten keine PI-Gleichwertigkeit annehmen, wo die native Laufzeitumgebung mehr Zustand besitzt. |

Der Support-Vertrag für die Codex-Laufzeitumgebung ist dokumentiert in
[Codex harness](/de/plugins/codex-harness#v1-support-contract).

## Statusbezeichnungen

Die Statusausgabe kann sowohl die Bezeichnungen `Execution` als auch `Runtime` anzeigen. Lesen Sie diese als
Diagnoseangaben, nicht als Providernamen.

- Eine Modell-Ref wie `openai/gpt-5.5` zeigt Ihnen den ausgewählten Provider/das ausgewählte Modell.
- Eine Laufzeit-ID wie `codex` zeigt Ihnen, welche Schleife den Durchlauf ausführt.
- Eine Kanalbezeichnung wie Telegram oder Discord zeigt Ihnen, wo die Konversation stattfindet.

Wenn eine Sitzung nach dem Ändern der Laufzeitkonfiguration weiterhin PI anzeigt, starten Sie mit `/new` eine neue Sitzung
oder leeren Sie die aktuelle mit `/reset`. Bestehende Sitzungen behalten ihre
aufgezeichnete Laufzeitumgebung, damit ein Transkript nicht durch zwei inkompatible native
Sitzungssysteme erneut abgespielt wird.

## Verwandt

- [Codex harness](/de/plugins/codex-harness)
- [OpenAI](/de/providers/openai)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Schleife](/de/concepts/agent-loop)
- [Modelle](/de/concepts/models)
- [Status](/de/cli/status)
