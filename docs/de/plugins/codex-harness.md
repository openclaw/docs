---
read_when:
    - Sie möchten das mitgelieferte Codex-App-Server-Harness verwenden
    - Sie benötigen Beispiele für die Codex-Harness-Konfiguration
    - Sie möchten, dass Codex-only-Bereitstellungen fehlschlagen, statt auf PI zurückzufallen
summary: Eingebettete OpenClaw-Agent-Turns über den mitgelieferten Codex-App-Server-Harness ausführen
title: Codex-Testumgebung
x-i18n:
    generated_at: "2026-05-06T09:03:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a35ab08c1a7327437aadb6c2517bd962071bbb25982718d4c0b043680163ab70
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete Agent-Turns über den
Codex-App-Server statt über das integrierte PI-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung übernehmen soll:
Modellerkennung, native Thread-Fortsetzung, native Compaction und App-Server-Ausführung.
OpenClaw behält weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl, Tools,
Genehmigungen, Medienzustellung und die sichtbare Transkriptspiegelung.

Wenn ein Quell-Chat-Turn über das Codex-Harness läuft, verwenden sichtbare Antworten standardmäßig
das OpenClaw-`message`-Tool, sofern die Bereitstellung `messages.visibleReplies`
nicht explizit konfiguriert hat. Der Agent kann seinen Codex-Turn weiterhin privat
abschließen; er postet nur dann in den Kanal, wenn er `message(action="send")` aufruft.
Setzen Sie `messages.visibleReplies: "automatic"`, um finale Antworten in Direkt-Chats
weiterhin über den bisherigen automatischen Zustellungspfad auszuliefern.

Codex-Heartbeat-Turns erhalten standardmäßig auch das Tool `heartbeat_respond`, damit der
Agent aufzeichnen kann, ob das Aufwecken still bleiben oder benachrichtigen soll, ohne
diesen Kontrollfluss im finalen Text zu kodieren.

Heartbeat-spezifische Initiative-Hinweise werden als Codex-Entwicklerinstruktion im
Kollaborationsmodus beim Heartbeat-Turn selbst gesendet. Normale Chat-Turns stellen
stattdessen den Codex-Standardmodus wieder her, ohne die Heartbeat-Philosophie in ihrem
normalen Runtime-Prompt mitzuführen.

Wenn Sie sich orientieren möchten, beginnen Sie mit
[Agent-Runtimes](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Runtime, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Schnellkonfiguration

Die meisten Nutzer, die „Codex in OpenClaw“ möchten, wollen diesen Weg: Melden Sie sich mit einem
ChatGPT-/Codex-Abonnement an und führen Sie eingebettete Agent-Turns dann über die native
Codex-App-Server-Runtime aus. Die Modellreferenz bleibt weiterhin kanonisch
`openai/gpt-*`; die Abonnementauthentifizierung kommt aus dem Codex-Konto/-Profil, nicht
aus einem Modellpräfix `openai-codex/*`.

Melden Sie sich zuerst mit Codex OAuth an, falls Sie dies noch nicht getan haben:

```bash
openclaw models auth login --provider openai-codex
```

Aktivieren Sie dann das gebündelte `codex`-Plugin und erzwingen Sie die Codex-Runtime:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
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

Wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie dort ebenfalls `codex` auf:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Verwenden Sie `openai-codex/gpt-*` nicht in der Konfiguration. Dieses Präfix ist ein Legacy-Pfad, den
`openclaw doctor --fix` über primäre Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanal-Overrides
und veraltete persistierte Sitzungs-Routen-Pins hinweg zu `openai/gpt-*` umschreibt.

## Was dieses Plugin ändert

Das gebündelte `codex`-Plugin stellt mehrere getrennte Fähigkeiten bereit:

| Fähigkeit                         | Wie Sie sie verwenden                              | Was sie tut                                                                    |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Native eingebettete Runtime       | `agentRuntime.id: "codex"`                          | Führt eingebettete OpenClaw-Agent-Turns über den Codex-App-Server aus.         |
| Native Chat-Steuerbefehle         | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindet und steuert Codex-App-Server-Threads aus einer Messaging-Konversation. |
| Codex-App-Server-Provider/-Katalog | `codex` internals, surfaced through the harness     | Ermöglicht der Runtime, App-Server-Modelle zu erkennen und zu validieren.      |
| Codex-Pfad für Medienverständnis  | `codex/*` image-model compatibility paths           | Führt begrenzte Codex-App-Server-Turns für unterstützte Bildverständnis-Modelle aus. |
| Natives Hook-Relay                | Plugin hooks around Codex-native events             | Ermöglicht OpenClaw, unterstützte Codex-native Tool-/Finalisierungsereignisse zu beobachten/blockieren. |

Durch Aktivieren des Plugins werden diese Fähigkeiten verfügbar. Es bewirkt **nicht**:

- dass Codex für jedes OpenAI-Modell verwendet wird
- dass `openai-codex/*`-Modellreferenzen ohne Doctor-Prüfung in die native Runtime umgewandelt werden,
  die verifiziert, dass Codex installiert und aktiviert ist, das `codex`-Harness bereitstellt
  und OAuth-bereit ist
- dass ACP/acpx zum Standardpfad für Codex wird
- dass bestehende Sitzungen, die bereits eine PI-Runtime aufgezeichnet haben, im laufenden Betrieb umgeschaltet werden
- dass OpenClaw-Kanalzustellung, Sitzungsdateien, Auth-Profil-Speicherung oder
  Nachrichtenrouting ersetzt werden

Dasselbe Plugin besitzt außerdem die native `/codex`-Oberfläche für Chat-Steuerbefehle. Wenn
das Plugin aktiviert ist und der Nutzer darum bittet, Codex-Threads aus dem Chat zu binden,
fortzusetzen, zu steuern, zu stoppen oder zu inspizieren, sollten Agents `/codex ...` gegenüber ACP bevorzugen.
ACP bleibt der explizite Fallback, wenn der Nutzer ACP/acpx anfordert oder den ACP-Codex-Adapter testet.

Native Codex-Turns behalten OpenClaw-Plugin-Hooks als öffentliche Kompatibilitätsschicht bei.
Dies sind In-Process-OpenClaw-Hooks, nicht Codex-`hooks.json`-Befehlshooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transkriptdatensätze
- `before_agent_finalize` über Codex-`Stop`-Relay
- `agent_end`

Plugins können außerdem Runtime-neutrale Middleware für Tool-Ergebnisse registrieren, um
dynamische OpenClaw-Tool-Ergebnisse umzuschreiben, nachdem OpenClaw das Tool ausgeführt hat und bevor das
Ergebnis an Codex zurückgegeben wird. Dies ist getrennt vom öffentlichen
`tool_result_persist`-Plugin-Hook, der von OpenClaw verwaltete Tool-Ergebnis-Schreibvorgänge im Transkript transformiert.

Die Semantik der Plugin-Hooks selbst finden Sie unter [Plugin-Hooks](/de/plugins/hooks)
und [Plugin-Guard-Verhalten](/de/tools/plugin).

Das Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten OpenAI-Modellreferenzen
kanonisch als `openai/gpt-*` halten und explizit
`agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen, wenn sie
native App-Server-Ausführung wünschen. Legacy-`codex/*`-Modellreferenzen wählen aus Kompatibilitätsgründen weiterhin automatisch
das Harness aus, aber runtime-gestützte Legacy-Provider-Präfixe werden nicht als normale Modell-/Provider-Auswahl angezeigt.

Wenn eine konfigurierte Modellroute noch `openai-codex/*` ist, schreibt `openclaw doctor --fix`
sie zu `openai/*` um. Für passende Agent-Routen setzt es die Agent-Runtime
nur dann auf `codex`, wenn das Codex-Plugin installiert und aktiviert ist, das
`codex`-Harness bereitstellt und nutzbares OAuth hat; andernfalls setzt es die Runtime auf `pi`.

## Routenübersicht

Verwenden Sie diese Tabelle, bevor Sie die Konfiguration ändern:

| Gewünschtes Verhalten                              | Modellreferenz            | Runtime-Konfiguration                 | Auth-/Profilroute            | Erwartetes Statuslabel          |
| -------------------------------------------------- | -------------------------- | -------------------------------------- | ---------------------------- | ------------------------------- |
| ChatGPT-/Codex-Abonnement mit nativer Codex-Runtime | `openai/gpt-*`             | `agentRuntime.id: "codex"`             | Codex OAuth oder Codex-Konto | `Runtime: OpenAI Codex`         |
| OpenAI API über normalen OpenClaw-Runner           | `openai/gpt-*`             | omitted or `runtime: "pi"`             | OpenAI-API-Schlüssel         | `Runtime: OpenClaw Pi Default`  |
| Legacy-Konfiguration, die Doctor-Reparatur benötigt | `openai-codex/gpt-*`       | repaired to `codex` or `pi`            | Bestehende konfigurierte Auth | Nach `doctor --fix` erneut prüfen |
| Gemischte Provider mit konservativem Auto-Modus    | provider-specific refs     | `agentRuntime.id: "auto"`              | Je ausgewähltem Provider     | Hängt von der ausgewählten Runtime ab |
| Explizite Codex-ACP-Adapter-Sitzung                | ACP prompt/model dependent | `sessions_spawn` with `runtime: "acp"` | ACP-Backend-Auth             | ACP-Task-/Sitzungsstatus        |

Die wichtige Trennung ist Provider gegenüber Runtime:

- `openai-codex/*` ist eine Legacy-Route, die Doctor umschreibt.
- `agentRuntime.id: "codex"` erfordert das Codex-Harness und schlägt geschlossen fehl, wenn es
  nicht verfügbar ist.
- `agentRuntime.id: "auto"` lässt registrierte Harnesses passende Provider-Routen
  beanspruchen, aber kanonische OpenAI-Referenzen bleiben weiterhin PI-verwaltet, sofern ein Harness
  dieses Provider-/Modellpaar nicht unterstützt.
- `/codex ...` beantwortet: „Welche native Codex-Konversation soll dieser Chat binden
  oder steuern?“
- ACP beantwortet: „Welchen externen Harness-Prozess soll acpx starten?“

## Das richtige Modellpräfix wählen

OpenAI-Familienrouten sind präfixspezifisch. Für die übliche Einrichtung aus Abonnement plus
nativer Codex-Runtime verwenden Sie `openai/*` mit `agentRuntime.id: "codex"`.
Behandeln Sie `openai-codex/*` als Legacy-Konfiguration, die Doctor umschreiben sollte:

| Modellreferenz                              | Runtime-Pfad                                 | Verwendung, wenn                                                          |
| ------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                            | OpenAI-Provider über OpenClaw/PI-Plumbing    | Sie aktuellen direkten OpenAI-Platform-API-Zugriff mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.5`                      | Legacy-Route, die Doctor repariert           | Sie eine alte Konfiguration verwenden; führen Sie `openclaw doctor --fix` aus, um sie umzuschreiben. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex-App-Server-Harness                   | Sie ChatGPT-/Codex-Abonnementauthentifizierung mit nativer Codex-Ausführung möchten. |

GPT-5.5 kann sowohl auf direkten OpenAI-API-Schlüssel-Routen als auch auf Codex-Abonnementrouten
erscheinen, wenn Ihr Konto diese bereitstellt. Verwenden Sie `openai/gpt-5.5` mit dem Codex-App-Server-Harness
für native Codex-Runtime oder `openai/gpt-5.5` ohne Codex-Runtime-Override
für direkten API-Schlüssel-Traffic.

Legacy-`codex/gpt-*`-Referenzen bleiben als Kompatibilitätsaliasse akzeptiert. Die Doctor-Kompatibilitätsmigration
schreibt Legacy-Runtime-Referenzen zu kanonischen Modellreferenzen um
und zeichnet die Runtime-Richtlinie separat auf. Neue native App-Server-Harness-Konfigurationen
sollten `openai/gpt-*` plus `agentRuntime.id: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfixtrennung. Verwenden Sie
`openai/gpt-*` für die normale OpenAI-Route und `codex/gpt-*`, wenn Bildverständnis
über einen begrenzten Codex-App-Server-Turn laufen soll. Verwenden Sie
`openai-codex/gpt-*` nicht; Doctor schreibt dieses Legacy-Präfix zu `openai/gpt-*` um. Das
Codex-App-Server-Modell muss Unterstützung für Bildeingaben ausweisen; reine Text-Codex-Modelle
schlagen fehl, bevor der Medien-Turn startet.

Verwenden Sie `/status`, um das effektive Harness für die aktuelle Sitzung zu bestätigen. Wenn die
Auswahl unerwartet ist, aktivieren Sie Debug-Logging für das Subsystem `agents/harness`
und inspizieren Sie den strukturierten Gateway-Datensatz `agent harness selected`. Er
enthält die ausgewählte Harness-ID, den Auswahlgrund, die Runtime-/Fallback-Richtlinie und
im `auto`-Modus das Support-Ergebnis jedes Plugin-Kandidaten.

### Was Doctor-Warnungen bedeuten

`openclaw doctor` warnt, wenn konfigurierte Modellreferenzen oder persistierter Sitzungsroutenstatus
noch `openai-codex/*` verwenden. `openclaw doctor --fix` schreibt diese Routen um zu:

- `openai/<model>`
- `agentRuntime.id: "codex"`, wenn Codex installiert und aktiviert ist, das
  `codex`-Harness bereitstellt und nutzbares OAuth hat
- andernfalls `agentRuntime.id: "pi"`

Die `codex`-Route erzwingt das native Codex-Harness. Die `pi`-Route hält den
Agent auf dem standardmäßigen OpenClaw-Runner, anstatt Codex als Nebeneffekt der Legacy-Routenbereinigung
zu aktivieren oder zu installieren.
Doctor repariert außerdem veraltete persistierte Sitzungs-Pins in erkannten Agent-Sitzungsspeichern,
damit alte Konversationen nicht auf der entfernten Route festhängen.

Die Harness-Auswahl ist keine Steuerung für Live-Sitzungen. Wenn eine eingebettete Interaktion ausgeführt wird,
zeichnet OpenClaw die ausgewählte Harness-ID für diese Sitzung auf und verwendet sie
für spätere Interaktionen mit derselben Sitzungs-ID weiter. Ändern Sie die Konfiguration `agentRuntime` oder
`OPENCLAW_AGENT_RUNTIME`, wenn zukünftige Sitzungen ein anderes Harness verwenden sollen;
verwenden Sie `/new` oder `/reset`, um eine neue Sitzung zu starten, bevor Sie eine bestehende
Konversation zwischen PI und Codex wechseln. Dadurch wird vermieden, dass ein Transkript über
zwei inkompatible native Sitzungssysteme erneut abgespielt wird.

Legacy-Sitzungen, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt behandelt, sobald sie
Transkriptverlauf haben. Verwenden Sie `/new` oder `/reset`, um diese Konversation nach einer
Konfigurationsänderung auf Codex umzustellen.

`/status` zeigt die wirksame Modell-Laufzeitumgebung. Das Standard-PI-Harness erscheint als
`Runtime: OpenClaw Pi Default`, und das Codex-App-Server-Harness erscheint als
`Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig eine kompatible
  Codex-App-Server-Binärdatei, sodass lokale `codex`-Befehle auf `PATH` den
  normalen Harness-Start nicht beeinflussen.
- Codex-Authentifizierung, die für den App-Server-Prozess oder die Codex-Auth-Bridge von OpenClaw
  verfügbar ist. Lokale App-Server-Starts verwenden für jeden Agent ein von OpenClaw verwaltetes
  Codex-Home und ein isoliertes untergeordnetes `HOME`, sodass sie standardmäßig nicht Ihr persönliches
  `~/.codex`-Konto, Ihre Skills, Plugins, Konfiguration, Ihren Thread-Zustand oder native
  `$HOME/.agents/skills` lesen.

Das Plugin blockiert ältere oder unversionierte App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung normalerweise vom Codex-CLI-Konto
oder aus einem OpenClaw-Auth-Profil `openai-codex`. Lokale stdio-App-Server-Starts können
auch auf `CODEX_API_KEY` / `OPENAI_API_KEY` zurückfallen, wenn kein Konto vorhanden ist.

## Workspace-Bootstrap-Dateien

Codex verarbeitet `AGENTS.md` selbst über die native Projekt-Dokumenterkennung. OpenClaw
schreibt keine synthetischen Codex-Projekt-Dokumentdateien und hängt nicht von Codex-Fallback-
Dateinamen für Persona-Dateien ab, weil Codex-Fallbacks nur gelten, wenn
`AGENTS.md` fehlt.

Für OpenClaw-Workspace-Parität löst das Codex-Harness die anderen Bootstrap-Dateien
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` und `MEMORY.md`, wenn vorhanden) auf und leitet sie über Codex-
Entwickleranweisungen bei `thread/start` und `thread/resume` weiter. Dadurch bleiben
`SOUL.md` und verwandter Workspace-Persona-/Profilkontext auf der nativen
Codex-Verhaltenssteuerungsspur sichtbar, ohne `AGENTS.md` zu duplizieren.

## Codex neben anderen Modellen hinzufügen

Setzen Sie `agentRuntime.id: "codex"` nicht global, wenn derselbe Agent frei
zwischen Codex- und Nicht-Codex-Provider-Modellen wechseln soll. Eine erzwungene Laufzeitumgebung gilt für jede
eingebettete Interaktion dieses Agents oder dieser Sitzung. Wenn Sie ein Anthropic-Modell auswählen, während
diese Laufzeitumgebung erzwungen ist, versucht OpenClaw weiterhin das Codex-Harness und schlägt geschlossen fehl,
anstatt diese Interaktion stillschweigend über PI zu routen.

Verwenden Sie stattdessen eine dieser Formen:

- Legen Sie Codex auf einen dedizierten Agent mit `agentRuntime.id: "codex"`.
- Lassen Sie den Standard-Agent auf `agentRuntime.id: "auto"` und PI-Fallback für normale gemischte
  Provider-Nutzung.
- Verwenden Sie Legacy-Refs `codex/*` nur aus Kompatibilitätsgründen. Neue Konfigurationen sollten
  `openai/*` plus eine explizite Codex-Laufzeitrichtlinie bevorzugen.

Dieses Beispiel belässt den Standard-Agent bei normaler automatischer Auswahl und
fügt einen separaten Codex-Agent hinzu:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Mit dieser Form:

- Der Standard-Agent `main` verwendet den normalen Provider-Pfad und den PI-Kompatibilitäts-Fallback.
- Der Agent `codex` verwendet das Codex-App-Server-Harness.
- Wenn Codex für den Agent `codex` fehlt oder nicht unterstützt wird, schlägt die Interaktion fehl,
  anstatt stillschweigend PI zu verwenden.

## Routing von Agent-Befehlen

Agents sollten Benutzeranfragen nach Absicht routen, nicht allein nach dem Wort „Codex“:

| Benutzer fragt nach...                                 | Agent sollte verwenden...                        |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Diesen Chat an Codex binden“                          | `/codex bind`                                    |
| „Codex-Thread `<id>` hier fortsetzen“                  | `/codex resume <id>`                             |
| „Codex-Threads anzeigen“                               | `/codex threads`                                 |
| „Einen Supportbericht für einen fehlerhaften Codex-Lauf einreichen“ | `/diagnostics [note]`                            |
| „Nur Codex-Feedback für diesen angehängten Thread senden“ | `/codex diagnostics [note]`                      |
| „Meine ChatGPT/Codex-Subscription mit der Codex-Laufzeitumgebung verwenden“ | `openai/*` plus `agentRuntime.id: "codex"`       |
| „Alte `openai-codex/*`-Konfigurations-/Sitzungs-Pins reparieren“ | `openclaw doctor --fix`                          |
| „Codex über ACP/acpx ausführen“                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Claude Code/Gemini/OpenCode/Cursor in einem Thread starten“ | ACP/acpx, nicht `/codex` und keine nativen Sub-Agents |

OpenClaw bewirbt ACP-Spawn-Anleitungen für Agents nur, wenn ACP aktiviert,
dispatchfähig und durch ein geladenes Laufzeit-Backend abgesichert ist. Wenn ACP nicht verfügbar ist,
sollten der System-Prompt und Plugin-Skills den Agent nicht über ACP-
Routing unterrichten.

## Nur-Codex-Bereitstellungen

Erzwingen Sie das Codex-Harness, wenn Sie nachweisen müssen, dass jede eingebettete Agent-Interaktion
Codex verwendet. Explizite Plugin-Laufzeitumgebungen schlagen geschlossen fehl und werden nie stillschweigend
über PI erneut versucht:

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

Umgebungs-Override:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Wenn Codex erzwungen ist, schlägt OpenClaw früh fehl, falls das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann.

## Codex pro Agent

Sie können einen Agent ausschließlich auf Codex festlegen, während der Standard-Agent die normale
automatische Auswahl behält:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

Verwenden Sie normale Sitzungsbefehle, um Agents und Modelle zu wechseln. `/new` erstellt eine neue
OpenClaw-Sitzung, und das Codex-Harness erstellt oder setzt seinen Sidecar-App-Server-
Thread nach Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread
und lässt die nächste Interaktion das Harness wieder aus der aktuellen Konfiguration auflösen.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn
die Erkennung fehlschlägt oder eine Zeitüberschreitung erreicht, verwendet es einen gebündelten Fallback-Katalog für:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Sie können die Erkennung unter `plugins.entries.codex.config.discovery` anpassen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Deaktivieren Sie die Erkennung, wenn der Start Codex nicht sondieren und beim
Fallback-Katalog bleiben soll:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## App-Server-Verbindung und Richtlinie

Standardmäßig startet das Plugin die von OpenClaw verwaltete Codex-Binärdatei lokal mit:

```bash
codex app-server --listen stdio://
```

Die verwaltete Binärdatei wird mit dem `codex`-Plugin-Paket ausgeliefert. Dadurch bleibt die
App-Server-Version an das gebündelte Plugin gebunden und nicht an die separat
lokal installierte Codex-CLI. Setzen Sie `appServer.command` nur, wenn
Sie bewusst eine andere ausführbare Datei ausführen möchten.

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung für
autonome Heartbeats: Codex kann Shell- und Netzwerktools verwenden, ohne
bei nativen Genehmigungsaufforderungen anzuhalten, auf die niemand antworten kann.

Um sich für durch den Codex-Guardian geprüfte Genehmigungen zu entscheiden, setzen Sie `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Der Guardian-Modus verwendet den nativen Auto-Review-Genehmigungspfad von Codex. Wenn Codex darum bittet,
die Sandbox zu verlassen, außerhalb des Workspace zu schreiben oder Berechtigungen wie Netzwerkzugriff
hinzuzufügen, routet Codex diese Genehmigungsanfrage an den nativen Reviewer statt an eine
menschliche Eingabeaufforderung. Der Reviewer wendet das Risikorahmenwerk von Codex an und genehmigt oder verweigert
die konkrete Anfrage. Verwenden Sie Guardian, wenn Sie mehr Leitplanken als im YOLO-Modus wünschen,
aber weiterhin unbeaufsichtigte Agents Fortschritte machen sollen.

Das Preset `guardian` erweitert sich zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"`.
Einzelne Richtlinienfelder überschreiben weiterhin `mode`, sodass fortgeschrittene Bereitstellungen
das Preset mit expliziten Auswahlmöglichkeiten kombinieren können. Der ältere Reviewer-Wert `guardian_subagent` wird
weiterhin als Kompatibilitätsalias akzeptiert, neue Konfigurationen sollten jedoch
`auto_review` verwenden.

Für einen bereits laufenden App-Server verwenden Sie WebSocket-Transport:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Stdio-App-Server-Starts erben standardmäßig die Prozessumgebung von OpenClaw,
aber OpenClaw besitzt die Codex-App-Server-Konto-Bridge und setzt sowohl
`CODEX_HOME` als auch `HOME` auf agentbezogene Verzeichnisse unter dem OpenClaw-
Zustand dieses Agents. Der eigene Skill-Loader von Codex liest `$CODEX_HOME/skills` und
`$HOME/.agents/skills`, daher sind beide Werte für lokale App-Server-
Starts isoliert. Dadurch bleiben Codex-native Skills, Plugins, Konfiguration, Konten und Thread-
Zustand auf den OpenClaw-Agent begrenzt, anstatt aus dem persönlichen
Codex-CLI-Home des Operators einzudringen.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots fließen weiterhin über die OpenClaw-eigene
Plugin-Registry und den Skill-Loader. Persönliche Codex-CLI-Assets nicht. Wenn Sie
nützliche Codex-CLI-Skills oder Plugins haben, die Teil eines OpenClaw-Agents werden sollen,
inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Der Codex-Migrations-Provider kopiert Skills in den aktuellen OpenClaw-Agent-
Workspace. Native Codex-Plugins, Hooks und Konfigurationsdateien werden gemeldet oder archiviert
und nicht automatisch aktiviert, weil sie Befehle ausführen,
MCP-Server bereitstellen oder Zugangsdaten enthalten können.

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Auth-Profil für den Agent.
2. Das bestehende Konto des App-Servers im Codex-Home dieses Agents.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten Codex-Kindprozess. Dadurch
bleiben API-Schlüssel auf Gateway-Ebene für Einbettungen oder direkte OpenAI-Modelle
verfügbar, ohne dass native Codex-App-Server-Turns versehentlich über die API
abgerechnet werden. Explizite Codex-API-Schlüsselprofile und der lokale stdio-Env-Schlüssel-Fallback verwenden die App-Server-Anmeldung
statt geerbter Kindprozess-Umgebungsvariablen. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-Env-API-Schlüssel-Fallback; verwenden Sie ein explizites Authentifizierungsprofil oder das
eigene Konto des Remote-App-Servers.

Wenn eine Bereitstellung zusätzliche Umgebungsisolation benötigt, fügen Sie diese Variablen zu
`appServer.clearEnv` hinzu:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` wirkt sich nur auf den erzeugten Codex-App-Server-Kindprozess aus.

Codex-dynamische Tools verwenden standardmäßig das Profil `native-first`. In diesem Modus
stellt OpenClaw keine dynamischen Tools bereit, die Codex-native Workspace-Vorgänge
duplizieren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` und
`update_plan`. OpenClaw-Integrationstools wie Messaging, Sessions, Medien,
Cron, Browser, Nodes, Gateway, `heartbeat_respond` und `web_search` bleiben
verfügbar.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standardwert     | Bedeutung                                                                                             |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Verwenden Sie `"openclaw-compat"`, um Codex-App-Servern den vollständigen Satz dynamischer OpenClaw-Tools bereitzustellen. |
| `codexDynamicToolsExclude` | `[]`             | Zusätzliche Namen dynamischer OpenClaw-Tools, die bei Codex-App-Server-Turns ausgelassen werden.      |

Unterstützte `appServer`-Felder:

| Feld                | Standardwert                            | Bedeutung                                                                                                                                                                                                                           |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` erzeugt Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                    |
| `command`           | verwaltete Codex-Binärdatei              | Ausführbare Datei für den stdio-Transport. Lassen Sie dies unset, um die verwaltete Binärdatei zu verwenden; setzen Sie es nur für eine explizite Überschreibung.                                                                    |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den stdio-Transport.                                                                                                                                                                                                  |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                                                                                                                                                                           |
| `authToken`         | nicht gesetzt                            | Bearer-Token für WebSocket-Transport.                                                                                                                                                                                               |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                                                                                                                                                       |
| `clearEnv`          | `[]`                                     | Zusätzliche Namen von Umgebungsvariablen, die aus dem erzeugten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung erstellt hat. `CODEX_HOME` und `HOME` sind für OpenClaws agentenspezifische Codex-Isolation bei lokalen Starts reserviert. |
| `requestTimeoutMs`  | `60000`                                  | Timeout für App-Server-Control-Plane-Aufrufe.                                                                                                                                                                                       |
| `mode`              | `"yolo"`                                 | Voreinstellung für YOLO- oder Guardian-geprüfte Ausführung.                                                                                                                                                                         |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzen/Turn gesendet wird.                                                                                                                                             |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzen gesendet wird.                                                                                                                                                          |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen überprüft. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                |
| `serviceTier`       | nicht gesetzt                            | Optionaler Codex-App-Server-Service-Tier: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert.                                                                                                                  |

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt: Jede Codex-`item/tool/call`-Anforderung muss
innerhalb von 30 Sekunden eine OpenClaw-Antwort erhalten. Bei einem Timeout bricht OpenClaw das Tool-Signal
dort ab, wo dies unterstützt wird, und gibt eine fehlgeschlagene dynamische Tool-Antwort an Codex zurück, damit
der Turn fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine auf einen Codex-Turn beschränkte App-Server-Anforderung geantwortet hat, erwartet der Harness
außerdem, dass Codex den nativen Turn mit `turn/completed` abschließt. Wenn der
App-Server danach 60 Sekunden lang keine Aktivität zeigt, unterbricht OpenClaw nach bestem Bemühen
den Codex-Turn, zeichnet einen Diagnose-Timeout auf und gibt die
OpenClaw-Sitzungsspur frei, damit nachfolgende Chat-Nachrichten nicht hinter einem veralteten
nativen Turn in der Warteschlange stehen.

Umgebungsüberschreibungen bleiben für lokale Tests verfügbar:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` umgeht die verwaltete Binärdatei, wenn
`appServer.command` nicht gesetzt ist.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen
`plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration wird
für wiederholbare Bereitstellungen bevorzugt, weil sie das Plugin-Verhalten in derselben
geprüften Datei hält wie den Rest der Codex-Harness-Einrichtung.

## Computernutzung

Computernutzung wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex-Computernutzung](/de/plugins/codex-computer-use).

Kurzfassung: OpenClaw liefert die Desktop-Steuerungs-App nicht mit und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, prüft, ob der
`computer-use`-MCP-Server verfügbar ist, und lässt Codex dann die nativen
MCP-Tool-Aufrufe während Codex-Modus-Turns verarbeiten.

Für direkten TryCua-Treiberzugriff außerhalb des Codex-Marketplace-Flows registrieren Sie
`cua-driver mcp` mit `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Siehe [Codex-Computernutzung](/de/plugins/codex-computer-use) für die Unterscheidung
zwischen Codex-eigener Computernutzung und direkter MCP-Registrierung.

Minimale Konfiguration:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
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

Die Einrichtung kann über die Befehlsoberfläche geprüft oder installiert werden:

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computernutzung ist macOS-spezifisch und kann lokale OS-Berechtigungen erfordern, bevor der
Codex-MCP-Server Apps steuern kann. Wenn `computerUse.enabled` true ist und der MCP-
Server nicht verfügbar ist, schlagen Codex-Modus-Turns fehl, bevor der Thread startet, statt
still ohne die nativen Computernutzungs-Tools zu laufen. Siehe
[Codex-Computernutzung](/de/plugins/codex-computer-use) für Marketplace-Optionen,
Remote-Kataloggrenzen, Statusgründe und Fehlerbehebung.

Wenn `computerUse.autoInstall` true ist, kann OpenClaw den standardmäßig
gebündelten Codex-Desktop-Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` registrieren, wenn Codex
noch keinen lokalen Marketplace gefunden hat. Verwenden Sie `/new` oder `/reset`, nachdem Sie
Runtime- oder Computernutzungs-Konfiguration geändert haben, damit bestehende Sitzungen keine alte
PI- oder Codex-Thread-Bindung behalten.

## Häufige Rezepte

Lokaler Codex mit standardmäßigem stdio-Transport:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Nur-Codex-Harness-Validierung:

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
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Guardian-geprüfte Codex-Genehmigungen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Remote-App-Server mit expliziten Headern:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

Der Modellwechsel bleibt OpenClaw-gesteuert. Wenn eine OpenClaw-Sitzung an
einen bestehenden Codex-Thread angehängt ist, sendet der nächste Turn das aktuell ausgewählte
OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und den Service-Tier erneut an den
App-Server. Der Wechsel von `openai/gpt-5.5` zu `openai/gpt-5.2` behält die
Thread-Bindung bei, fordert Codex aber auf, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert in jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-Konnektivität zum App-Server, Modelle, Konto, Ratenlimits, MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex App-Servers auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` verbindet die aktuelle OpenClaw-Sitzung mit einem vorhandenen Codex-Thread.
- `/codex compact` fordert den Codex App-Server auf, den verbundenen Thread zu komprimieren.
- `/codex review` startet die native Codex-Review für den verbundenen Thread.
- `/codex diagnostics [note]` fragt nach, bevor Codex-Diagnosefeedback für den verbundenen Thread gesendet wird.
- `/codex computer-use status` prüft das konfigurierte Computer-Use-Plugin und den MCP-Server.
- `/codex computer-use install` installiert das konfigurierte Computer-Use-Plugin und lädt MCP-Server neu.
- `/codex account` zeigt Konto- und Ratenlimitstatus an.
- `/codex mcp` listet den MCP-Serverstatus des Codex App-Servers auf.
- `/codex skills` listet die Skills des Codex App-Servers auf.

Wenn Codex einen Fehler wegen eines Nutzungslimits meldet, fügt OpenClaw die nächste
Zurücksetzungszeit des App-Servers hinzu, sofern Codex eine bereitgestellt hat. Verwenden Sie `/codex account` in derselben
Unterhaltung, um das aktuelle Konto und die Ratenlimitfenster zu prüfen.

### Üblicher Debugging-Workflow

Wenn ein Codex-gestützter Agent in Telegram, Discord, Slack
oder einem anderen Kanal etwas Unerwartetes tut, beginnen Sie mit der Unterhaltung, in der das Problem aufgetreten ist:

1. Führen Sie `/diagnostics bad tool choice after image upload` oder eine andere kurze Notiz aus,
   die beschreibt, was Sie beobachtet haben.
2. Genehmigen Sie die Diagnoseanfrage einmal. Die Genehmigung erstellt die lokale Gateway-
   Diagnose-ZIP-Datei und sendet, da die Sitzung den Codex-Harness verwendet, außerdem
   das relevante Codex-Feedbackpaket an OpenAI-Server.
3. Kopieren Sie die abgeschlossene Diagnoseantwort in den Fehlerbericht oder Support-Thread.
   Sie enthält den lokalen Bundle-Pfad, die Datenschutz-Zusammenfassung, OpenClaw-Sitzungs-IDs,
   Codex-Thread-IDs und eine `Inspect locally`-Zeile für jeden Codex-Thread.
4. Wenn Sie den Lauf selbst debuggen möchten, führen Sie den ausgegebenen Befehl `Inspect locally`
   in einem Terminal aus. Er sieht aus wie `codex resume <thread-id>` und öffnet den
   nativen Codex-Thread, sodass Sie die Unterhaltung prüfen, lokal fortsetzen
   oder Codex fragen können, warum er ein bestimmtes Tool oder einen bestimmten Plan gewählt hat.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie speziell den Codex-
Feedback-Upload für den aktuell verbundenen Thread ohne das vollständige OpenClaw-
Gateway-Diagnosebundle wünschen. Für die meisten Supportberichte ist `/diagnostics [note]`
der bessere Ausgangspunkt, weil es den lokalen Gateway-Status und die Codex-
Thread-IDs in einer Antwort zusammenführt. Siehe [Diagnoseexport](/de/gateway/diagnostics)
für das vollständige Datenschutzmodell und das Verhalten in Gruppenchats.

Der Kern von OpenClaw stellt außerdem den nur für Besitzer verfügbaren Befehl `/diagnostics [note]` als allgemeinen
Gateway-Diagnosebefehl bereit. Seine Genehmigungsaufforderung zeigt die Einleitung zu sensiblen Daten,
verlinkt auf [Diagnoseexport](/de/gateway/diagnostics) und fordert
`openclaw gateway diagnostics export --json` jedes Mal über eine ausdrückliche Ausführungsgenehmigung an.
Genehmigen Sie Diagnosen nicht mit einer Allow-All-Regel. Nach der Genehmigung
sendet OpenClaw einen einfügbaren Bericht mit dem lokalen Bundle-Pfad und einer Manifest-
Zusammenfassung. Wenn die aktive OpenClaw-Sitzung den Codex-Harness verwendet, autorisiert
dieselbe Genehmigung auch das Senden der relevanten Codex-Feedbackpakete an
OpenAI-Server. Die Genehmigungsaufforderung sagt, dass Codex-Feedback gesendet wird, listet
aber vor der Genehmigung keine Codex-Sitzungs- oder Thread-IDs auf.

Wenn `/diagnostics` von einem Besitzer in einem Gruppenchat aufgerufen wird, hält OpenClaw den
geteilten Kanal übersichtlich: Die Gruppe erhält nur einen kurzen Hinweis, während die
Diagnoseeinleitung, Genehmigungsaufforderungen und Codex-Sitzungs-/Thread-IDs über die private Genehmigungsroute
an den Besitzer gesendet werden. Wenn es keine private Besitzerroute gibt,
lehnt OpenClaw die Gruppenanfrage ab und fordert den Besitzer auf, sie per DM auszuführen.

Der genehmigte Codex-Upload ruft `feedback/upload` des Codex App-Servers auf und fordert
den App-Server auf, Protokolle für jeden aufgeführten Thread und erzeugte Codex-Unterthreads
einzuschließen, sofern verfügbar. Der Upload läuft über den normalen Feedbackpfad von Codex zu OpenAI-
Servern; wenn Codex-Feedback in diesem App-Server deaktiviert ist, gibt der Befehl
den App-Server-Fehler zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle,
OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-
Befehle für die gesendeten Threads auf. Wenn Sie die Genehmigung ablehnen oder ignorieren,
gibt OpenClaw diese Codex-IDs nicht aus. Dieser Upload ersetzt nicht den lokalen
Gateway-Diagnoseexport.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die der Harness für
normale Durchläufe verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-Modell an den App-Server und lässt erweiterten Verlauf
aktiviert.

### Einen Codex-Thread über die CLI prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu verstehen, ist oft, den nativen Codex-
Thread direkt zu öffnen:

```sh
codex resume <thread-id>
```

Verwenden Sie dies, wenn Sie in einer Kanalunterhaltung einen Fehler bemerken und die
problematische Codex-Sitzung prüfen, lokal fortsetzen oder Codex fragen möchten, warum er eine
bestimmte Tool- oder Reasoning-Entscheidung getroffen hat. Der einfachste Weg ist normalerweise, zuerst
`/diagnostics [note]` auszuführen: Nachdem Sie es genehmigt haben, listet der abgeschlossene Bericht
jeden Codex-Thread auf und gibt einen `Inspect locally`-Befehl aus, zum Beispiel
`codex resume <thread-id>`. Sie können diesen Befehl direkt in ein Terminal kopieren.

Sie können auch eine Thread-ID aus `/codex binding` für den aktuellen Chat oder
`/codex threads [filter]` für aktuelle Threads des Codex App-Servers abrufen und dann denselben
Befehl `codex resume` in Ihrer Shell ausführen.

Die Befehlsoberfläche erfordert Codex App-Server `0.125.0` oder neuer. Einzelne
Steuermethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder angepasster App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Der Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Besitzer                    | Zweck                                                             |
| ------------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                    | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Erweiterungs-Middleware des Codex App-Servers | Gebündelte OpenClaw-Plugins | Adapterverhalten pro Durchlauf rund um dynamische OpenClaw-Tools. |
| Native Codex-Hooks                    | Codex                       | Codex-Lifecycle auf niedriger Ebene und native Tool-Policy aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte Bridge für native Tools und Berechtigungen
injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`. Andere Codex-Hooks wie `SessionStart` und
`UserPromptSubmit` bleiben Codex-Steuerelemente; sie werden im v1-Vertrag nicht als
OpenClaw-Plugin-Hooks bereitgestellt.

Bei dynamischen OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den
Aufruf angefordert hat, sodass OpenClaw das Plugin- und Middleware-Verhalten, das es besitzt, im
Harness-Adapter auslöst. Bei nativen Codex-Tools besitzt Codex den kanonischen Tool-Eintrag.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber den nativen Codex-
Thread nicht neu schreiben, sofern Codex diese Operation nicht über den App-Server oder native Hook-
Callbacks bereitstellt.

Compaction- und LLM-Lifecycle-Projektionen stammen aus Benachrichtigungen des Codex App-Servers
und dem OpenClaw-Adapterstatus, nicht aus nativen Codex-Hook-Befehlen.
OpenClaws Ereignisse `before_compaction`, `after_compaction`, `llm_input` und
`llm_output` sind Beobachtungen auf Adapterebene, keine bytegenauen Erfassungen
der internen Anfrage- oder Compaction-Payloads von Codex.

Die nativen Codex-Benachrichtigungen `hook/started` und `hook/completed` des App-Servers werden
als Agent-Ereignisse `codex_app_server.hook` für Trajektorie und Debugging projiziert.
Sie lösen keine OpenClaw-Plugin-Hooks aus.

## V1-Supportvertrag

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex besitzt mehr vom
nativen Modell-Loop, und OpenClaw passt seine Plugin- und Sitzungsoberflächen
an diese Grenze an.

Unterstützt in Codex-Laufzeit v1:

| Oberfläche                                    | Unterstützung                          | Warum                                                                                                                                                                                               |
| --------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modell-Loop über Codex                 | Unterstützt                            | Codex App-Server besitzt den OpenAI-Durchlauf, die native Thread-Fortsetzung und die native Tool-Fortsetzung.                                                                                       |
| OpenClaw-Kanalrouting und Zustellung          | Unterstützt                            | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modelllaufzeit.                                                                                                |
| Dynamische OpenClaw-Tools                     | Unterstützt                            | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                     |
| Prompt- und Kontext-Plugins                   | Unterstützt                            | OpenClaw erstellt Prompt-Overlays und projiziert Kontext in den Codex-Durchlauf, bevor der Thread gestartet oder fortgesetzt wird.                                                                  |
| Lifecycle der Kontext-Engine                  | Unterstützt                            | Zusammenstellung, Aufnahme oder Wartung nach dem Durchlauf sowie Koordination der Kontext-Engine-Compaction laufen für Codex-Durchläufe.                                                           |
| Hooks für dynamische Tools                    | Unterstützt                            | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen rund um dynamische Tools, die OpenClaw besitzt.                                                                           |
| Lifecycle-Hooks                               | Unterstützt als Adapterbeobachtungen   | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Payloads im Codex-Modus ausgelöst.                                                        |
| Revisions-Gate für finale Antworten           | Unterstützt über den nativen Hook-Relay | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` bittet Codex um einen weiteren Modell-Durchlauf vor der Finalisierung.                                                       |
| Native Shell-, Patch- und MCP-Blockierung oder -Beobachtung | Unterstützt über den nativen Hook-Relay | Codex `PreToolUse` und `PostToolUse` werden für festgelegte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex App-Server `0.125.0` oder neuer. Blockierung wird unterstützt; Umschreiben von Argumenten nicht. |
| Native Berechtigungs-Policy                   | Unterstützt über den nativen Hook-Relay | Codex `PermissionRequest` kann dort durch die OpenClaw-Policy geroutet werden, wo die Laufzeit dies bereitstellt. Wenn OpenClaw keine Entscheidung zurückgibt, fährt Codex über seinen normalen Guardian- oder Benutzer-Genehmigungspfad fort. |
| Trajektorienerfassung des App-Servers         | Unterstützt                            | OpenClaw zeichnet die Anfrage auf, die es an den App-Server gesendet hat, und die App-Server-Benachrichtigungen, die es empfängt.                                                                  |

Nicht unterstützt in Codex-Laufzeit v1:

| Oberfläche                                         | V1-Grenze                                                                                                                                      | Künftiger Pfad                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                    | Codex-native Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                    | Erfordert Codex-Hook-/Schema-Unterstützung für ersetzende Tool-Eingaben.                       |
| Bearbeitbare Codex-native Transkript-Historie       | Codex besitzt die kanonische native Thread-Historie. OpenClaw besitzt eine Spiegelung und kann künftigen Kontext projizieren, sollte aber keine nicht unterstützten Interna mutieren. | Fügen Sie explizite Codex-App-Server-APIs hinzu, wenn native Thread-Operationen benötigt werden. |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert OpenClaw-eigene Transkriptschreibvorgänge, nicht Codex-native Tool-Datensätze.                                       | Könnte transformierte Datensätze spiegeln, aber kanonisches Umschreiben benötigt Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten            | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Liste beibehaltener/verwerfener Einträge, kein Token-Delta und keine Zusammenfassungs-Payload. | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                           |
| Compaction-Eingriff                                | Aktuelle OpenClaw-Compaction-Hooks haben im Codex-Modus Benachrichtigungsniveau.                                                               | Fügen Sie Codex-Pre-/Post-Compaction-Hooks hinzu, wenn Plugins native Compaction ablehnen oder umschreiben müssen. |
| Bytegenaue Erfassung von Modell-API-Anfragen        | OpenClaw kann App-Server-Anfragen und Benachrichtigungen erfassen, aber der Codex-Kern erstellt die finale OpenAI-API-Anfrage intern.           | Benötigt ein Codex-Modellanfragen-Tracing-Ereignis oder eine Debug-API.                        |

## Tools, Medien und Compaction

Das Codex-Harness ändert nur den Low-Level-Ausführer für eingebettete Agenten.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Messaging-Tool-Ausgaben
laufen weiter über den normalen OpenClaw-Zustellpfad.

Das native Hook-Relay ist absichtlich generisch, aber der v1-Supportvertrag ist
auf die Codex-nativen Tool- und Berechtigungspfade beschränkt, die OpenClaw testet. In
der Codex-Runtime umfasst das Shell-, Patch- und MCP-`PreToolUse`-,
`PostToolUse`- und `PermissionRequest`-Payloads. Gehen Sie nicht davon aus, dass jedes künftige
Codex-Hook-Ereignis eine OpenClaw-Plugin-Oberfläche ist, bis der Runtime-Vertrag
es benennt.

Für `PermissionRequest` gibt OpenClaw nur dann explizite Zulassen- oder Ablehnen-Entscheidungen
zurück, wenn die Policy entscheidet. Ein Ergebnis ohne Entscheidung ist keine Zulassung.
Codex behandelt es so, als gäbe es keine Hook-Entscheidung, und fällt auf den eigenen Guardian- oder Benutzer-Genehmigungspfad zurück.

Codex-MCP-Tool-Genehmigungsaufforderungen werden durch den OpenClaw-Plugin-Genehmigungsfluss
geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden an den
ursprünglichen Chat zurückgesendet, und die nächste eingereihte Follow-up-Nachricht beantwortet diese native
Serveranfrage, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Aufforderungsanfragen
schlagen weiterhin geschlossen fehl.

Die Steuerung der Warteschlange aktiver Läufe wird auf Codex-App-Server-`turn/steer` abgebildet. Mit dem
Standard `messages.queue.mode: "steer"` bündelt OpenClaw eingereihte Chatnachrichten
für das konfigurierte Ruhefenster und sendet sie in Ankunftsreihenfolge als eine `turn/steer`-Anfrage.
Der Legacy-`queue`-Modus sendet separate `turn/steer`-Anfragen. Codex-
Review- und manuelle Compaction-Turns können Same-Turn-Steuerung ablehnen; in diesem Fall
verwendet OpenClaw die Follow-up-Warteschlange, wenn der ausgewählte Modus Fallback erlaubt. Siehe
[Steuerungswarteschlange](/de/concepts/queue-steering).

Wenn das ausgewählte Modell das Codex-Harness verwendet, wird die native Thread-Compaction an den
Codex-App-Server delegiert. OpenClaw hält eine Transkriptspiegelung für Kanalhistorie,
Suche, `/new`, `/reset` und künftige Modell- oder Harness-Wechsel vor. Die
Spiegelung enthält den Benutzer-Prompt, den finalen Assistententext sowie schlanke Codex-
Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. Heute zeichnet OpenClaw nur
native Compaction-Start- und Abschlusssignale auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder überprüfbare Liste darüber bereit, welche Einträge Codex
nach der Compaction beibehalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit
keine Codex-nativen Tool-Ergebnisdatensätze um. Es greift nur, wenn
OpenClaw ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungs-Transkript schreibt.

Mediengenerierung erfordert kein PI. Bild-, Video-, Musik-, PDF-, TTS- und Medienverständnis
verwenden weiterhin die passenden Provider-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist bei
neuen Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Modell mit
`agentRuntime.id: "codex"` (oder eine Legacy-`codex/*`-Referenz), aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** `agentRuntime.id: "auto"` kann weiterhin PI als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Lauf übernimmt. Setzen Sie
`agentRuntime.id: "codex"`, um die Codex-Auswahl beim Testen zu erzwingen. Eine
erzwungene Codex-Runtime schlägt fehl, statt auf PI zurückzufallen. Sobald der Codex-App-Server
ausgewählt ist, werden seine Fehler direkt sichtbar.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, sodass der App-Server-Handshake
Version `0.125.0` oder neuer meldet. Prereleases derselben Version oder Versionen mit Build-Suffix
wie `0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil die
stabile Protokoll-Untergrenze `0.125.0` das ist, was OpenClaw testet.

**Modellerkennung ist langsam:** Senken Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und ob der entfernte App-Server dieselbe Codex-App-Server-Protokollversion spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist erwartet, sofern Sie nicht
`agentRuntime.id: "codex"` für diesen Agenten erzwungen oder eine Legacy-
`codex/*`-Referenz ausgewählt haben. Normale `openai/gpt-*`- und andere Provider-Referenzen bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad. Wenn Sie `agentRuntime.id: "codex"` erzwingen, muss jeder eingebettete
Turn für diesen Agenten ein von Codex unterstütztes OpenAI-Modell sein.

**Computer Use ist installiert, aber Tools laufen nicht:** Prüfen Sie
`/codex computer-use status` aus einer frischen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; wenn es weiter besteht, starten Sie
den Gateway neu, um veraltete native Hook-Registrierungen zu löschen. Wenn `computer-use.list_apps`
eine Zeitüberschreitung hat, starten Sie Codex Computer Use oder Codex Desktop neu und versuchen Sie es erneut.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin-Hooks](/de/plugins/hooks)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
