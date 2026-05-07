---
read_when:
    - Sie wählen zwischen PI, Codex, ACP oder einer anderen nativen Agent-Runtime
    - Sie sind durch Provider-/Modell-/Runtime-Bezeichnungen in Status oder Konfiguration verwirrt
    - Sie dokumentieren die Support-Parität für ein natives Harness
summary: Wie OpenClaw Modell-Provider, Modelle, Kanäle und Agent-Runtimes voneinander trennt
title: Agent-Laufzeitumgebungen
x-i18n:
    generated_at: "2026-05-07T13:15:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417a3a7e12a881bc33023cc87553dd3536a63ad955d1e93d26f1014032303469
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Eine **Agent-Runtime** ist die Komponente, die einen vorbereiteten Modell-Loop besitzt: Sie erhält den Prompt, steuert die Modellausgabe, verarbeitet native Tool-Aufrufe und gibt den abgeschlossenen Turn an OpenClaw zurück.

Runtimes lassen sich leicht mit Providern verwechseln, weil beide in der Nähe der Modellkonfiguration erscheinen. Es sind unterschiedliche Ebenen:

| Ebene         | Beispiele                              | Bedeutung                                                            |
| ------------- | -------------------------------------- | -------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex`  | Wie OpenClaw authentifiziert, Modelle ermittelt und Modellrefs benennt. |
| Modell        | `gpt-5.5`, `claude-opus-4-6`           | Das für den Agent-Turn ausgewählte Modell.                           |
| Agent-Runtime | `pi`, `codex`, `claude-cli`            | Der Low-Level-Loop oder das Backend, das den vorbereiteten Turn ausführt. |
| Channel       | Telegram, Discord, Slack, WhatsApp     | Wo Nachrichten in OpenClaw eingehen und es verlassen.                |

Im Code sehen Sie außerdem das Wort **Harness**. Ein Harness ist die Implementierung, die eine Agent-Runtime bereitstellt. Beispielsweise implementiert der gebündelte Codex-Harness die Runtime `codex`. Öffentliche Konfiguration verwendet `agentRuntime.id`; `openclaw doctor --fix` schreibt ältere Runtime-Policy-Schlüssel in diese Form um.

Es gibt zwei Runtime-Familien:

- **Eingebettete Harnesses** laufen innerhalb des vorbereiteten Agent-Loops von OpenClaw. Heute ist dies die integrierte Runtime `pi` plus registrierte Plugin-Harnesses wie `codex`.
- **CLI-Backends** führen einen lokalen CLI-Prozess aus, während die Modellref kanonisch bleibt. Beispielsweise bedeutet `anthropic/claude-opus-4-7` mit `agentRuntime.id: "claude-cli"`: „Anthropic-Modell auswählen, über Claude CLI ausführen.“ `claude-cli` ist keine eingebettete Harness-ID und darf nicht an die AgentHarness-Auswahl übergeben werden.

## Codex-Oberflächen

Die meiste Verwirrung entsteht, weil mehrere unterschiedliche Oberflächen den Namen Codex teilen:

| Oberfläche                                      | OpenClaw-Name/Konfiguration          | Funktion                                                                                                      |
| ----------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Native Codex-App-Server-Runtime                 | `openai/*`-Modellrefs                | Führt eingebettete OpenAI-Agent-Turns über den Codex-App-Server aus. Dies ist die übliche ChatGPT/Codex-Abonnementkonfiguration. |
| Codex-OAuth-Auth-Profile                        | `openai-codex`-Auth-Provider         | Speichert ChatGPT/Codex-Abonnementauthentifizierung, die der Codex-App-Server-Harness nutzt.                  |
| Codex-ACP-Adapter                               | `runtime: "acp"`, `agentId: "codex"` | Führt Codex über die externe ACP/acpx-Steuerungsebene aus. Nur verwenden, wenn ACP/acpx ausdrücklich angefordert wird. |
| Nativer Codex-Chat-Control-Befehlssatz          | `/codex ...`                         | Bindet, setzt fort, steuert, stoppt und inspiziert Codex-App-Server-Threads aus dem Chat.                     |
| OpenAI-Platform-API-Route für Nicht-Agent-Oberflächen | `openai/*` plus API-Key-Auth         | Wird für direkte OpenAI-APIs wie Bilder, Embeddings, Sprache und Realtime verwendet.                          |

Diese Oberflächen sind absichtlich unabhängig. Das Aktivieren des `codex`-Plugins macht die nativen App-Server-Funktionen verfügbar; `openclaw doctor --fix` ist für die Reparatur älterer `openai-codex/*`-Routen und die Bereinigung veralteter Session-Pins zuständig. Die Auswahl von `openai/*` für ein Agent-Modell bedeutet jetzt „dies über Codex ausführen“, sofern keine Nicht-Agent-OpenAI-API-Oberfläche verwendet wird.

Die übliche ChatGPT/Codex-Abonnementkonfiguration verwendet Codex OAuth für die Authentifizierung, behält aber die Modellref als `openai/*` bei und wählt die Runtime `codex` aus:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Das bedeutet, dass OpenClaw eine OpenAI-Modellref auswählt und dann die Codex-App-Server-Runtime bittet, den eingebetteten Agent-Turn auszuführen. Es bedeutet nicht „API-Abrechnung verwenden“, und es bedeutet nicht, dass Channel, Modell-Provider-Katalog oder OpenClaw-Session-Store zu Codex werden.

Wenn das gebündelte `codex`-Plugin aktiviert ist, sollte die natürlichsprachliche Codex-Steuerung die native `/codex`-Befehlsoberfläche (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) statt ACP verwenden. Verwenden Sie ACP für Codex nur, wenn der Benutzer ausdrücklich ACP/acpx anfordert oder den ACP-Adapterpfad testet. Claude Code, Gemini CLI, OpenCode, Cursor und ähnliche externe Harnesses verwenden weiterhin ACP.

Dies ist der agentenseitige Entscheidungsbaum:

1. Wenn der Benutzer **Codex bind/control/thread/resume/steer/stop** anfordert, verwenden Sie die native `/codex`-Befehlsoberfläche, wenn das gebündelte `codex`-Plugin aktiviert ist.
2. Wenn der Benutzer **Codex als eingebettete Runtime** anfordert oder die normale abonnementgestützte Codex-Agent-Erfahrung möchte, verwenden Sie `openai/<model>`.
3. Wenn der Benutzer ausdrücklich **PI für ein OpenAI-Modell** auswählt, behalten Sie die Modellref als `openai/<model>` bei und setzen Sie `agentRuntime.id: "pi"`. Ein ausgewähltes `openai-codex`-Auth-Profil wird intern über den Legacy-Codex-Auth-Transport von PI geroutet.
4. Wenn die Legacy-Konfiguration noch **`openai-codex/*`-Modellrefs** enthält, reparieren Sie sie mit `openclaw doctor --fix` zu `openai/<model>`.
5. Wenn der Benutzer ausdrücklich **ACP**, **acpx** oder **Codex-ACP-Adapter** sagt, verwenden Sie ACP mit `runtime: "acp"` und `agentId: "codex"`.
6. Wenn die Anfrage **Claude Code, Gemini CLI, OpenCode, Cursor, Droid oder einen anderen externen Harness** betrifft, verwenden Sie ACP/acpx, nicht die native Sub-Agent-Runtime.

| Sie meinen ...                         | Verwenden Sie ...                            |
| -------------------------------------- | -------------------------------------------- |
| Codex-App-Server-Chat-/Thread-Steuerung | `/codex ...` aus dem gebündelten `codex`-Plugin |
| Eingebettete Codex-App-Server-Agent-Runtime | `openai/*`-Agent-Modellrefs                  |
| OpenAI Codex OAuth                     | `openai-codex`-Auth-Profile                 |
| Claude Code oder anderer externer Harness | ACP/acpx                                     |

Zum OpenAI-Familien-Präfix-Split siehe [OpenAI](/de/providers/openai) und [Modell-Provider](/de/concepts/model-providers). Den Support-Vertrag für die Codex-Runtime finden Sie unter [Codex-Harness](/de/plugins/codex-harness#v1-support-contract).

## Runtime-Eigentümerschaft

Unterschiedliche Runtimes besitzen unterschiedliche Anteile des Loops.

| Oberfläche                 | OpenClaw PI eingebettet                 | Codex-App-Server                                                           |
| -------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| Besitzer des Modell-Loops  | OpenClaw über den eingebetteten PI-Runner | Codex-App-Server                                                           |
| Kanonischer Thread-Zustand | OpenClaw-Transkript                     | Codex-Thread plus OpenClaw-Transkriptspiegel                               |
| Dynamische OpenClaw-Tools  | Nativer OpenClaw-Tool-Loop              | Über den Codex-Adapter überbrückt                                          |
| Native Shell- und Datei-Tools | PI/OpenClaw-Pfad                     | Codex-native Tools, über native Hooks überbrückt, wo unterstützt           |
| Kontext-Engine             | Native OpenClaw-Kontextzusammenstellung | OpenClaw-Projekte stellen Kontext in den Codex-Turn zusammen               |
| Compaction                 | OpenClaw oder ausgewählte Kontext-Engine | Codex-native Compaction mit OpenClaw-Benachrichtigungen und Spiegelpflege  |
| Channel-Zustellung         | OpenClaw                                | OpenClaw                                                                   |

Diese Aufteilung der Eigentümerschaft ist die wichtigste Designregel:

- Wenn OpenClaw die Oberfläche besitzt, kann OpenClaw normales Plugin-Hook-Verhalten bereitstellen.
- Wenn die native Runtime die Oberfläche besitzt, benötigt OpenClaw Runtime-Ereignisse oder native Hooks.
- Wenn die native Runtime den kanonischen Thread-Zustand besitzt, sollte OpenClaw Kontext spiegeln und projizieren, nicht nicht unterstützte Interna umschreiben.

## Runtime-Auswahl

OpenClaw wählt nach Provider- und Modellauflösung eine eingebettete Runtime aus:

1. Die in einer Session aufgezeichnete Runtime gewinnt. Konfigurationsänderungen schalten ein bestehendes Transkript nicht unmittelbar auf ein anderes natives Thread-System um.
2. `OPENCLAW_AGENT_RUNTIME=<id>` erzwingt diese Runtime für neue oder zurückgesetzte Sessions.
3. `agents.defaults.agentRuntime.id` oder `agents.list[].agentRuntime.id` kann `auto`, `pi`, eine registrierte eingebettete Harness-ID wie `codex` oder einen unterstützten CLI-Backend-Alias wie `claude-cli` setzen.
4. Im Modus `auto` können registrierte Plugin-Runtimes unterstützte Provider-/Modellpaare beanspruchen.
5. Wenn im Modus `auto` keine Runtime einen Turn beansprucht, verwendet OpenClaw PI als Kompatibilitätsruntime. Verwenden Sie eine explizite Runtime-ID, wenn die Ausführung strikt sein muss.

Explizite Plugin-Runtimes schlagen geschlossen fehl. Beispielsweise bedeutet `agentRuntime.id: "codex"` Codex oder einen klaren Auswahl-/Runtime-Fehler; es wird nie stillschweigend zurück zu PI geroutet.

CLI-Backend-Aliase unterscheiden sich von eingebetteten Harness-IDs. Die bevorzugte Claude-CLI-Form ist:

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

Legacy-Refs wie `claude-cli/claude-opus-4-7` werden aus Kompatibilitätsgründen weiterhin unterstützt, aber neue Konfiguration sollte Provider/Modell kanonisch halten und das Ausführungsbackend in `agentRuntime.id` ablegen.

Der Modus `auto` ist für die meisten Provider absichtlich konservativ. OpenAI-Agent-Modelle sind die Ausnahme: Eine nicht gesetzte Runtime und `auto` werden beide zum Codex-Harness aufgelöst. Eine explizite PI-Runtime-Konfiguration bleibt ein Opt-in-Kompatibilitätspfad für `openai/*`-Agent-Turns; wenn sie mit einem ausgewählten `openai-codex`-Auth-Profil kombiniert wird, routet OpenClaw PI intern über den Legacy-Codex-Auth-Transport, während die öffentliche Modellref `openai/*` bleibt. Veraltete OpenAI-PI-Session-Pins ohne explizite Konfiguration werden zurück zu Codex repariert.

Wenn `openclaw doctor` warnt, dass das `codex`-Plugin aktiviert ist, während `openai-codex/*` in der Konfiguration verbleibt, behandeln Sie dies als Legacy-Routenstatus. Führen Sie `openclaw doctor --fix` aus, um es zu `openai/*` mit der Codex-Runtime umzuschreiben.

## Kompatibilitätsvertrag

Wenn eine Runtime nicht PI ist, sollte sie dokumentieren, welche OpenClaw-Oberflächen sie unterstützt. Verwenden Sie diese Form für Runtime-Dokumentation:

| Frage                                 | Warum es wichtig ist                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Wer besitzt den Modell-Loop?          | Bestimmt, wo Wiederholungen, Tool-Fortsetzung und Entscheidungen über die finale Antwort erfolgen. |
| Wer besitzt den kanonischen Thread-Verlauf? | Bestimmt, ob OpenClaw den Verlauf bearbeiten oder ihn nur spiegeln kann.                    |
| Funktionieren dynamische OpenClaw-Tools? | Messaging, Sessions, Cron und OpenClaw-eigene Tools hängen davon ab.                         |
| Funktionieren dynamische Tool-Hooks?  | Plugins erwarten `before_tool_call`, `after_tool_call` und Middleware um OpenClaw-eigene Tools. |
| Funktionieren native Tool-Hooks?      | Shell-, Patch- und Runtime-eigene Tools benötigen native Hook-Unterstützung für Policy und Beobachtung. |
| Läuft der Lifecycle der Kontext-Engine? | Memory- und Kontext-Plugins hängen von Assemble-, Ingest-, After-Turn- und Compaction-Lifecycle ab. |
| Welche Compaction-Daten werden offengelegt? | Manche Plugins benötigen nur Benachrichtigungen, andere benötigen Metadaten zu Beibehaltenem/Verworfenem. |
| Was wird absichtlich nicht unterstützt? | Benutzer sollten keine PI-Äquivalenz annehmen, wo die native Runtime mehr Zustand besitzt.       |

Die Unterstützungsvereinbarung für die Codex-Runtime ist dokumentiert unter
[Codex-Harness](/de/plugins/codex-harness#v1-support-contract).

## Statusbezeichnungen

Die Statusausgabe kann sowohl die Bezeichnungen `Execution` als auch `Runtime` anzeigen. Verstehen Sie sie als
Diagnosedaten, nicht als Provider-Namen.

- Eine Modellreferenz wie `openai/gpt-5.5` zeigt Ihnen den ausgewählten Provider und das ausgewählte Modell.
- Eine Runtime-ID wie `codex` zeigt Ihnen, welcher Loop den Turn ausführt.
- Eine Kanalbezeichnung wie Telegram oder Discord zeigt Ihnen, wo die Unterhaltung stattfindet.

Wenn eine Sitzung nach dem Ändern der Runtime-Konfiguration weiterhin PI anzeigt, starten Sie eine neue Sitzung
mit `/new` oder löschen Sie die aktuelle mit `/reset`. Bestehende Sitzungen behalten ihre
aufgezeichnete Runtime, damit ein Transkript nicht über zwei inkompatible native
Sitzungssysteme erneut abgespielt wird.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [OpenAI](/de/providers/openai)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Loop](/de/concepts/agent-loop)
- [Modelle](/de/concepts/models)
- [Status](/de/cli/status)
