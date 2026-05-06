---
read_when:
    - Sie möchten den mitgelieferten Codex-App-Server-Harness verwenden
    - Sie benötigen Beispiele für die Codex-Harness-Konfiguration
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, statt auf PI zurückzufallen
summary: Führen Sie eingebettete OpenClaw-Agentendurchläufe über den mitgelieferten Codex-App-Server-Harness aus
title: Codex-Ausführungsumgebung
x-i18n:
    generated_at: "2026-05-06T06:57:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353812c804c896eccc3415a108e8b9c4628adb8c98bba8978bfc6c3dc57587b5
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete Agent-Turns über den
Codex app-server statt über den integrierten PI-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung übernehmen soll:
Modellerkennung, native Thread-Fortsetzung, native Compaction und app-server-Ausführung.
OpenClaw bleibt weiterhin zuständig für Chat-Kanäle, Sitzungsdateien, Modellauswahl, Tools,
Genehmigungen, Medienbereitstellung und die sichtbare Transcript-Spiegelung.

Wenn ein Quell-Chat-Turn über den Codex-Harness ausgeführt wird, verwenden sichtbare Antworten standardmäßig
das OpenClaw-`message`-Tool, wenn das Deployment `messages.visibleReplies` nicht ausdrücklich konfiguriert hat. Der Agent kann seinen Codex-Turn weiterhin privat beenden;
er postet nur dann in den Kanal, wenn er `message(action="send")` aufruft. Setzen Sie
`messages.visibleReplies: "automatic"`, um finale Antworten in Direkt-Chats weiterhin über den
alten automatischen Bereitstellungspfad auszuliefern.

Codex-Heartbeat-Turns erhalten standardmäßig außerdem das Tool `heartbeat_respond`, damit der
Agent festhalten kann, ob das Aufwecken still bleiben oder benachrichtigen soll, ohne
diesen Kontrollfluss im finalen Text zu codieren.

Heartbeat-spezifische Leitlinien für Eigeninitiative werden als Codex-Entwicklerinstruktion im Collaboration-Modus
direkt im Heartbeat-Turn gesendet. Normale Chat-Turns stellen stattdessen den
Codex-Default-Modus wieder her, anstatt Heartbeat-Philosophie in ihrem normalen
Runtime-Prompt mitzunehmen.

Wenn Sie sich orientieren möchten, beginnen Sie mit
[Agent-Runtimes](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Runtime, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Schnellkonfiguration

Die meisten Benutzer, die „Codex in OpenClaw“ möchten, wollen diesen Pfad: Melden Sie sich mit einem
ChatGPT/Codex-Abonnement an und führen Sie dann eingebettete Agent-Turns über die native
Codex-app-server-Runtime aus. Die Modellreferenz bleibt weiterhin kanonisch als
`openai/gpt-*`; die Abonnement-Authentifizierung stammt aus dem Codex-Konto/-Profil, nicht
aus einem `openai-codex/*`-Modellpräfix.

Melden Sie sich zuerst mit Codex OAuth an, falls noch nicht geschehen:

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

Wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie `codex` dort ebenfalls auf:

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

Verwenden Sie `openai-codex/gpt-*` nicht in der Konfiguration. Dieses Präfix ist eine Legacy-Route, die
`openclaw doctor --fix` über primäre Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Overrides, Hooks, Kanal-Overrides
und veraltete persistierte Sitzungs-Routenpins hinweg zu `openai/gpt-*` umschreibt.

## Was dieses Plugin ändert

Das gebündelte `codex`-Plugin stellt mehrere getrennte Fähigkeiten bereit:

| Fähigkeit                         | So verwenden Sie sie                              | Was sie tut                                                                    |
| --------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Native eingebettete Runtime       | `agentRuntime.id: "codex"`                        | Führt eingebettete OpenClaw-Agent-Turns über den Codex app-server aus.         |
| Native Chat-Steuerbefehle         | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindet und steuert Codex-app-server-Threads aus einer Messaging-Unterhaltung. |
| Codex-app-server-Provider/-Katalog | `codex`-Interna, über den Harness verfügbar       | Ermöglicht der Runtime, app-server-Modelle zu erkennen und zu validieren.      |
| Codex-Pfad für Medienverständnis  | `codex/*`-Kompatibilitätspfade für Bildmodelle    | Führt begrenzte Codex-app-server-Turns für unterstützte Bildverständnis-Modelle aus. |
| Native Hook-Weiterleitung         | Plugin-Hooks um Codex-native Ereignisse           | Ermöglicht OpenClaw, unterstützte Codex-native Tool-/Finalisierungsereignisse zu beobachten oder zu blockieren. |

Das Aktivieren des Plugins stellt diese Fähigkeiten bereit. Es bewirkt **nicht** Folgendes:

- Codex für jedes OpenAI-Modell verwenden
- `openai-codex/*`-Modellreferenzen ohne doctor in die native Runtime umwandeln,
  der verifiziert, dass Codex installiert und aktiviert ist, den `codex`-Harness bereitstellt
  und OAuth-bereit ist
- ACP/acpx zum standardmäßigen Codex-Pfad machen
- bestehende Sitzungen hot-switchen, die bereits eine PI-Runtime aufgezeichnet haben
- OpenClaw-Kanalbereitstellung, Sitzungsdateien, Auth-Profil-Speicherung oder
  Nachrichtenrouting ersetzen

Dasselbe Plugin besitzt auch die native Chat-Steuerbefehlsoberfläche `/codex`. Wenn
das Plugin aktiviert ist und der Benutzer aus dem Chat heraus darum bittet, Codex-Threads zu binden, fortzusetzen, zu steuern, zu stoppen oder zu inspizieren,
sollten Agenten `/codex ...` gegenüber ACP bevorzugen. ACP bleibt
der ausdrückliche Fallback, wenn der Benutzer ACP/acpx anfordert oder den ACP-
Codex-Adapter testet.

Native Codex-Turns behalten OpenClaw-Plugin-Hooks als öffentliche Kompatibilitätsschicht bei.
Dies sind prozessinterne OpenClaw-Hooks, keine Codex-`hooks.json`-Befehlshooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transcript-Datensätze
- `before_agent_finalize` über Codex-`Stop`-Weiterleitung
- `agent_end`

Plugins können außerdem runtime-neutrale Middleware für Tool-Ergebnisse registrieren, um
dynamische OpenClaw-Tool-Ergebnisse umzuschreiben, nachdem OpenClaw das Tool ausgeführt hat und bevor das
Ergebnis an Codex zurückgegeben wird. Dies ist getrennt vom öffentlichen
`tool_result_persist`-Plugin-Hook, der OpenClaw-eigene Transcript-Schreibvorgänge für
Tool-Ergebnisse transformiert.

Für die Semantik der Plugin-Hooks selbst siehe [Plugin-Hooks](/de/plugins/hooks)
und [Plugin-Guard-Verhalten](/de/tools/plugin).

Der Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten OpenAI-Modellreferenzen
kanonisch als `openai/gpt-*` beibehalten und ausdrücklich
`agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen, wenn sie
native app-server-Ausführung wünschen. Legacy-`codex/*`-Modellreferenzen wählen den
Harness aus Kompatibilitätsgründen weiterhin automatisch aus, runtime-gestützte Legacy-Provider-Präfixe werden jedoch
nicht als normale Modell-/Provider-Auswahlmöglichkeiten angezeigt.

Wenn eine konfigurierte Modellroute noch `openai-codex/*` ist, schreibt `openclaw doctor --fix`
sie zu `openai/*` um. Für passende Agent-Routen setzt es die Agent-Runtime
nur dann auf `codex`, wenn das Codex-Plugin installiert und aktiviert ist, den
`codex`-Harness bereitstellt und nutzbares OAuth hat; andernfalls setzt es die Runtime auf `pi`.

## Routenübersicht

Verwenden Sie diese Tabelle, bevor Sie die Konfiguration ändern:

| Gewünschtes Verhalten                              | Modellreferenz             | Runtime-Konfiguration                 | Auth-/Profilroute            | Erwartetes Statuslabel          |
| -------------------------------------------------- | -------------------------- | ------------------------------------- | ---------------------------- | ------------------------------- |
| ChatGPT/Codex-Abonnement mit nativer Codex-Runtime | `openai/gpt-*`             | `agentRuntime.id: "codex"`            | Codex OAuth oder Codex-Konto | `Runtime: OpenAI Codex`         |
| OpenAI API über den normalen OpenClaw-Runner       | `openai/gpt-*`             | ausgelassen oder `runtime: "pi"`      | OpenAI-API-Schlüssel         | `Runtime: OpenClaw Pi Default`  |
| Legacy-Konfiguration, die doctor-Reparatur benötigt | `openai-codex/gpt-*`       | repariert zu `codex` oder `pi`        | Vorhandene konfigurierte Auth | Nach `doctor --fix` erneut prüfen |
| Gemischte Provider mit konservativem Auto-Modus    | providerspezifische Referenzen | `agentRuntime.id: "auto"`          | Pro ausgewähltem Provider    | Hängt von der ausgewählten Runtime ab |
| Explizite Codex-ACP-Adapter-Sitzung                | ACP-prompt-/modellabhängig | `sessions_spawn` mit `runtime: "acp"` | ACP-Backend-Auth             | ACP-Task-/Sitzungsstatus        |

Die wichtige Trennung ist Provider gegenüber Runtime:

- `openai-codex/*` ist eine Legacy-Route, die doctor umschreibt.
- `agentRuntime.id: "codex"` erfordert den Codex-Harness und schlägt geschlossen fehl, wenn er
  nicht verfügbar ist.
- `agentRuntime.id: "auto"` lässt registrierte Harnesses passende Provider-
  Routen beanspruchen, aber kanonische OpenAI-Referenzen bleiben weiterhin PI-eigen, sofern ein Harness
  dieses Provider-/Modellpaar nicht unterstützt.
- `/codex ...` beantwortet „welche native Codex-Unterhaltung soll dieser Chat binden
  oder steuern?“
- ACP beantwortet „welchen externen Harness-Prozess soll acpx starten?“

## Das richtige Modellpräfix wählen

OpenAI-Familienrouten sind präfixspezifisch. Für die übliche Einrichtung mit Abonnement plus
nativer Codex-Runtime verwenden Sie `openai/*` mit `agentRuntime.id: "codex"`.
Behandeln Sie `openai-codex/*` als Legacy-Konfiguration, die doctor umschreiben sollte:

| Modellreferenz                                | Runtime-Pfad                                | Verwenden, wenn                                                           |
| --------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI-Provider über OpenClaw-/PI-Plumbing  | Sie aktuellen direkten OpenAI-Platform-API-Zugriff mit `OPENAI_API_KEY` wünschen. |
| `openai-codex/gpt-5.5`                        | Legacy-Route, die durch doctor repariert wird | Sie eine alte Konfiguration verwenden; führen Sie `openclaw doctor --fix` aus, um sie umzuschreiben. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Codex-app-server-Harness                    | Sie ChatGPT/Codex-Abonnement-Auth mit nativer Codex-Ausführung wünschen.  |

GPT-5.5 kann sowohl auf direkten OpenAI-API-Schlüssel- als auch auf Codex-Abonnement-Routen
erscheinen, wenn Ihr Konto sie bereitstellt. Verwenden Sie `openai/gpt-5.5` mit dem Codex-app-server-
Harness für native Codex-Runtime oder `openai/gpt-5.5` ohne Codex-Runtime-
Override für direkten API-Schlüssel-Traffic.

Legacy-`codex/gpt-*`-Referenzen bleiben als Kompatibilitätsaliasse akzeptiert. Die doctor-
Kompatibilitätsmigration schreibt Legacy-Runtime-Referenzen zu kanonischen Modellreferenzen um
und zeichnet die Runtime-Richtlinie separat auf. Neue native app-server-Harness-Konfigurationen
sollten `openai/gpt-*` plus `agentRuntime.id: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfixtrennung. Verwenden Sie
`openai/gpt-*` für die normale OpenAI-Route und `codex/gpt-*`, wenn Bildverständnis
über einen begrenzten Codex-app-server-Turn laufen soll. Verwenden Sie nicht
`openai-codex/gpt-*`; doctor schreibt dieses Legacy-Präfix zu `openai/gpt-*` um. Das
Codex-app-server-Modell muss Unterstützung für Bildeingaben ausweisen; reine Text-Codex-
Modelle schlagen fehl, bevor der Medien-Turn startet.

Verwenden Sie `/status`, um den effektiven Harness für die aktuelle Sitzung zu bestätigen. Wenn die
Auswahl überraschend ist, aktivieren Sie Debug-Logging für das Subsystem `agents/harness`
und prüfen Sie den strukturierten Gateway-Datensatz `agent harness selected`. Er
enthält die ausgewählte Harness-ID, den Auswahlgrund, die Runtime-/Fallback-Richtlinie und
im Modus `auto` das Support-Ergebnis jedes Plugin-Kandidaten.

### Was doctor-Warnungen bedeuten

`openclaw doctor` warnt, wenn konfigurierte Modellreferenzen oder persistierter Sitzungsrouten-
Status noch `openai-codex/*` verwenden. `openclaw doctor --fix` schreibt diese Routen
um zu:

- `openai/<model>`
- `agentRuntime.id: "codex"`, wenn Codex installiert und aktiviert ist, den
  `codex`-Harness bereitstellt und nutzbares OAuth hat
- andernfalls `agentRuntime.id: "pi"`

Die Route `codex` erzwingt den nativen Codex-Harness. Die Route `pi` hält den
Agent auf dem standardmäßigen OpenClaw-Runner, anstatt Codex als Nebeneffekt der
Legacy-Routenbereinigung zu aktivieren oder zu installieren.
Doctor repariert außerdem veraltete persistierte Sitzungs-Pins über erkannte Agent-Sitzungs-
Stores hinweg, damit alte Unterhaltungen nicht auf der entfernten Route festhängen.

Die Harness-Auswahl ist keine Steuerung für Live-Sitzungen. Wenn ein eingebetteter Turn ausgeführt wird,
zeichnet OpenClaw die ausgewählte Harness-ID für diese Sitzung auf und verwendet sie für
spätere Turns mit derselben Sitzungs-ID weiter. Ändern Sie die `agentRuntime`-Konfiguration oder
`OPENCLAW_AGENT_RUNTIME`, wenn zukünftige Sitzungen einen anderen Harness verwenden sollen;
verwenden Sie `/new` oder `/reset`, um eine frische Sitzung zu starten, bevor Sie eine bestehende
Unterhaltung zwischen PI und Codex wechseln. So wird vermieden, ein Transkript durch
zwei inkompatible native Sitzungssysteme erneut abzuspielen.

Legacy-Sitzungen, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt behandelt, sobald sie
Transkriptverlauf haben. Verwenden Sie `/new` oder `/reset`, um diese Unterhaltung nach dem
Ändern der Konfiguration für Codex zu verwenden.

`/status` zeigt die effektive Modell-Laufzeit an. Der Standard-PI-Harness erscheint als
`Runtime: OpenClaw Pi Default`, und der Codex-App-Server-Harness erscheint als
`Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig eine kompatible
  Codex-App-Server-Binärdatei, sodass lokale `codex`-Befehle in `PATH`
  den normalen Harness-Start nicht beeinflussen.
- Codex-Authentifizierung, die für den App-Server-Prozess oder für OpenClaws Codex-Authentifizierungs-
  Bridge verfügbar ist. Lokale App-Server-Starts verwenden für jeden
  Agent ein von OpenClaw verwaltetes Codex-Home und ein isoliertes untergeordnetes `HOME`; daher lesen sie standardmäßig nicht Ihr persönliches
  `~/.codex`-Konto, Ihre Skills, Plugins, Konfiguration, Thread-Zustand oder nativen
  `$HOME/.agents/skills`.

Das Plugin blockiert ältere oder nicht versionierte App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung in der Regel aus dem Codex-CLI-Konto
oder einem OpenClaw-`openai-codex`-Authentifizierungsprofil. Lokale stdio-App-Server-Starts können
auch auf `CODEX_API_KEY` / `OPENAI_API_KEY` zurückfallen, wenn kein Konto vorhanden ist.

## Workspace-Bootstrap-Dateien

Codex verarbeitet `AGENTS.md` selbst über native Projekt-Dokumenterkennung. OpenClaw
schreibt keine synthetischen Codex-Projekt-Dokumentdateien und hängt nicht von Codex-Fallback-
Dateinamen für Persona-Dateien ab, da Codex-Fallbacks nur greifen, wenn
`AGENTS.md` fehlt.

Für OpenClaw-Workspace-Parität löst der Codex-Harness die anderen Bootstrap-Dateien
(`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`,
`BOOTSTRAP.md` und `MEMORY.md`, sofern vorhanden) auf und leitet sie über Codex-
Konfigurationsanweisungen bei `thread/start` und `thread/resume` weiter. Dadurch bleiben
`SOUL.md` und der zugehörige Workspace-Persona-/Profilkontext sichtbar, ohne
`AGENTS.md` zu duplizieren.

## Codex neben anderen Modellen hinzufügen

Setzen Sie `agentRuntime.id: "codex"` nicht global, wenn derselbe Agent frei
zwischen Codex- und Nicht-Codex-Provider-Modellen wechseln soll. Eine erzwungene Laufzeit gilt für jeden
eingebetteten Turn dieses Agent oder dieser Sitzung. Wenn Sie ein Anthropic-Modell auswählen, während
diese Laufzeit erzwungen ist, versucht OpenClaw weiterhin den Codex-Harness und schlägt geschlossen fehl,
statt diesen Turn stillschweigend über PI zu routen.

Verwenden Sie stattdessen eine dieser Formen:

- Legen Sie Codex auf einen dedizierten Agent mit `agentRuntime.id: "codex"`.
- Behalten Sie den Standard-Agent auf `agentRuntime.id: "auto"` und den PI-Fallback für normale gemischte
  Provider-Nutzung.
- Verwenden Sie Legacy-`codex/*`-Referenzen nur aus Kompatibilitätsgründen. Neue Konfigurationen sollten
  `openai/*` plus eine explizite Codex-Laufzeitrichtlinie bevorzugen.

Dieses Beispiel behält den Standard-Agent auf normaler automatischer Auswahl und
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

- Der Standard-`main`-Agent verwendet den normalen Provider-Pfad und den PI-Kompatibilitäts-Fallback.
- Der `codex`-Agent verwendet den Codex-App-Server-Harness.
- Wenn Codex für den `codex`-Agent fehlt oder nicht unterstützt wird, schlägt der Turn fehl,
  statt stillschweigend PI zu verwenden.

## Routing von Agent-Befehlen

Agents sollten Benutzeranfragen nach Absicht routen, nicht allein nach dem Wort „Codex“:

| Benutzer fragt nach...                                 | Agent sollte verwenden...                         |
| ------------------------------------------------------ | ------------------------------------------------ |
| „Diesen Chat an Codex binden“                          | `/codex bind`                                    |
| „Codex-Thread `<id>` hier fortsetzen“                  | `/codex resume <id>`                             |
| „Codex-Threads anzeigen“                               | `/codex threads`                                 |
| „Einen Supportbericht für einen fehlerhaften Codex-Lauf einreichen“ | `/diagnostics [note]`                            |
| „Nur Codex-Feedback für diesen angehängten Thread senden“ | `/codex diagnostics [note]`                      |
| „Mein ChatGPT-/Codex-Abonnement mit Codex-Laufzeit verwenden“ | `openai/*` plus `agentRuntime.id: "codex"`       |
| „Alte `openai-codex/*`-Konfigurations-/Sitzungs-Pins reparieren“ | `openclaw doctor --fix`                          |
| „Codex über ACP/acpx ausführen“                        | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Claude Code/Gemini/OpenCode/Cursor in einem Thread starten“ | ACP/acpx, nicht `/codex` und keine nativen Sub-Agents |

OpenClaw bewirbt ACP-Spawn-Anleitungen nur dann gegenüber Agents, wenn ACP aktiviert,
dispatchfähig und durch ein geladenes Laufzeit-Backend gestützt ist. Wenn ACP nicht verfügbar ist,
sollten der System-Prompt und Plugin-Skills dem Agent kein ACP-
Routing vermitteln.

## Reine Codex-Deployments

Erzwingen Sie den Codex-Harness, wenn Sie nachweisen müssen, dass jeder eingebettete Agent-Turn
Codex verwendet. Explizite Plugin-Laufzeiten schlagen geschlossen fehl und werden niemals stillschweigend
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

Wenn Codex erzwungen ist, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann.

## Codex pro Agent

Sie können einen Agent Codex-exklusiv machen, während der Standard-Agent die normale
automatische Auswahl beibehält:

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

Verwenden Sie normale Sitzungsbefehle, um Agents und Modelle zu wechseln. `/new` erstellt eine frische
OpenClaw-Sitzung, und der Codex-Harness erstellt oder setzt seinen Sidecar-App-Server-
Thread nach Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread
und lässt den nächsten Turn den Harness erneut aus der aktuellen Konfiguration auflösen.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn
die Erkennung fehlschlägt oder ein Timeout erreicht, verwendet es einen gebündelten Fallback-Katalog für:

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

Deaktivieren Sie die Erkennung, wenn der Start Codex nicht abfragen und beim
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

Standardmäßig startet das Plugin OpenClaws verwaltete Codex-Binärdatei lokal mit:

```bash
codex app-server --listen stdio://
```

Die verwaltete Binärdatei wird mit dem `codex`-Plugin-Paket ausgeliefert. Dadurch bleibt die
App-Server-Version an das gebündelte Plugin gebunden, statt an die separate
Codex-CLI, die zufällig lokal installiert ist. Setzen Sie `appServer.command` nur, wenn
Sie absichtlich eine andere ausführbare Datei ausführen möchten.

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung für
autonome Heartbeats: Codex kann Shell- und Netzwerktools verwenden, ohne bei nativen
Genehmigungsaufforderungen anzuhalten, die niemand beantworten kann.

Um Codex-Genehmigungen mit Guardian-Review zu aktivieren, setzen Sie `appServer.mode:
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

Der Guardian-Modus verwendet Codexs nativen Auto-Review-Genehmigungspfad. Wenn Codex anfordert,
die Sandbox zu verlassen, außerhalb des Workspace zu schreiben oder Berechtigungen wie Netzwerk-
zugriff hinzuzufügen, leitet Codex diese Genehmigungsanfrage an den nativen Reviewer weiter statt an eine
menschliche Aufforderung. Der Reviewer wendet Codexs Risikorahmen an und genehmigt oder verweigert
die konkrete Anfrage. Verwenden Sie Guardian, wenn Sie mehr Leitplanken als im YOLO-Modus möchten,
aber unbeaufsichtigte Agents dennoch Fortschritte machen müssen.

Das `guardian`-Preset wird zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert.
Einzelne Richtlinienfelder überschreiben `mode` weiterhin, sodass fortgeschrittene Deployments das
Preset mit expliziten Entscheidungen mischen können. Der ältere Reviewer-Wert `guardian_subagent` wird
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
aber OpenClaw besitzt die Codex-App-Server-Kontobridge und setzt sowohl
`CODEX_HOME` als auch `HOME` auf Agent-spezifische Verzeichnisse im OpenClaw-
Zustand dieses Agent. Codexs eigener Skill-Loader liest `$CODEX_HOME/skills` und
`$HOME/.agents/skills`, sodass beide Werte für lokale App-Server-
Starts isoliert sind. Dadurch bleiben Codex-native Skills, Plugins, Konfiguration, Konten und Thread-
Zustand auf den OpenClaw-Agent beschränkt, statt aus dem persönlichen
Codex-CLI-Home des Operators einzufließen.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots laufen weiterhin durch OpenClaws eigene
Plugin-Registry und Skill-Loader. Persönliche Codex-CLI-Assets tun das nicht. Wenn Sie
nützliche Codex-CLI-Skills oder Plugins haben, die Teil eines OpenClaw-Agent werden sollen,
inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Der Codex-Migrations-Provider kopiert Skills in den aktuellen OpenClaw-Agent-
Workspace. Codex-native Plugins, Hooks und Konfigurationsdateien werden gemeldet oder archiviert
und nicht automatisch aktiviert, weil sie Befehle ausführen,
MCP-Server bereitstellen oder Anmeldedaten enthalten können.

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agent.
2. Das vorhandene Konto des App-Servers im Codex-Home dieses Agent.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten Codex-Kindprozess. Dadurch
bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle
verfügbar, ohne dass native Codex-App-Server-Turns versehentlich über die API
abgerechnet werden. Explizite Codex-API-Schlüsselprofile und der lokale stdio-Fallback
für Umgebungsvariablen-Schlüssel verwenden die App-Server-Anmeldung statt der geerbten
Kindprozess-Umgebung. WebSocket-App-Server-Verbindungen erhalten keinen Gateway-Umgebungs-Fallback
für API-Schlüssel; verwenden Sie ein explizites Authentifizierungsprofil oder das
eigene Konto des Remote-App-Servers.

Wenn eine Bereitstellung zusätzliche Umgebungsisolierung benötigt, fügen Sie diese Variablen zu
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

Dynamische Codex-Tools verwenden standardmäßig das Profil `native-first`. In diesem Modus
stellt OpenClaw keine dynamischen Tools bereit, die native Codex-Workspace-Operationen
duplizieren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` und
`update_plan`. OpenClaw-Integrationstools wie Messaging, Sitzungen, Medien,
Cron, Browser, Nodes, Gateway, `heartbeat_respond` und `web_search` bleiben
verfügbar.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard         | Bedeutung                                                                                         |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Verwenden Sie `"openclaw-compat"`, um Codex-App-Servern den vollständigen dynamischen OpenClaw-Toolsatz bereitzustellen. |
| `codexDynamicToolsExclude` | `[]`             | Zusätzliche Namen dynamischer OpenClaw-Tools, die bei Codex-App-Server-Turns ausgelassen werden. |

Unterstützte `appServer`-Felder:

| Feld                | Standard                                 | Bedeutung                                                                                                                                                                                                                         |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` stellt eine Verbindung zu `url` her.                                                                                                                                                        |
| `command`           | verwaltete Codex-Binärdatei              | Ausführbare Datei für den stdio-Transport. Nicht setzen, um die verwaltete Binärdatei zu verwenden; nur für eine explizite Überschreibung setzen.                                                                                 |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den stdio-Transport.                                                                                                                                                                                                |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                                                                                                                                                                         |
| `authToken`         | nicht gesetzt                            | Bearer-Token für WebSocket-Transport.                                                                                                                                                                                             |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                                                                                                                                                     |
| `clearEnv`          | `[]`                                     | Zusätzliche Namen von Umgebungsvariablen, die aus dem erzeugten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat. `CODEX_HOME` und `HOME` sind für die Codex-Isolierung pro Agent von OpenClaw bei lokalen Starts reserviert. |
| `requestTimeoutMs`  | `60000`                                  | Zeitlimit für App-Server-Control-Plane-Aufrufe.                                                                                                                                                                                   |
| `mode`              | `"yolo"`                                 | Voreinstellung für YOLO- oder vom Guardian geprüfte Ausführung.                                                                                                                                                                   |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzen/Turn gesendet wird.                                                                                                                                           |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzen gesendet wird.                                                                                                                                                        |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                  |
| `serviceTier`       | nicht gesetzt                            | Optionale Codex-App-Server-Service-Stufe: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert.                                                                                                                |

OpenClaw-eigene dynamische Tool-Aufrufe sind unabhängig von
`appServer.requestTimeoutMs` begrenzt: Jede Codex-Anfrage vom Typ `item/tool/call` muss
innerhalb von 30 Sekunden eine OpenClaw-Antwort erhalten. Bei einem Zeitlimit bricht
OpenClaw das Tool-Signal ab, sofern unterstützt, und gibt eine fehlgeschlagene
Dynamische-Tool-Antwort an Codex zurück, damit der Turn fortgesetzt werden kann, statt
die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine turn-bezogene Codex-App-Server-Anfrage geantwortet hat, erwartet
das Harness außerdem, dass Codex den nativen Turn mit `turn/completed` abschließt. Wenn der
App-Server danach 60 Sekunden lang stumm bleibt, unterbricht OpenClaw nach bestem Aufwand
den Codex-Turn, zeichnet ein Diagnose-Zeitlimit auf und gibt die OpenClaw-Sitzungsspur frei,
damit nachfolgende Chat-Nachrichten nicht hinter einem veralteten nativen Turn eingereiht werden.

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
geprüften Datei wie den Rest der Codex-Harness-Einrichtung hält.

## Computernutzung

Computernutzung wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex-Computernutzung](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw vendort die Desktop-Control-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, prüft, ob der
MCP-Server `computer-use` verfügbar ist, und lässt Codex dann während Codex-Modus-Turns
die nativen MCP-Tool-Aufrufe ausführen.

Für direkten TryCua-Treiberzugriff außerhalb des Codex-Marketplace-Ablaufs registrieren Sie
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

Computernutzung ist macOS-spezifisch und kann lokale Betriebssystemberechtigungen erfordern,
bevor der Codex-MCP-Server Apps steuern kann. Wenn `computerUse.enabled` wahr ist und der
MCP-Server nicht verfügbar ist, schlagen Codex-Modus-Turns fehl, bevor der Thread startet,
statt stillschweigend ohne die nativen Computernutzungs-Tools zu laufen. Siehe
[Codex-Computernutzung](/de/plugins/codex-computer-use) für Marketplace-Optionen,
Remote-Katalogbeschränkungen, Statusgründe und Fehlerbehebung.

Wenn `computerUse.autoInstall` wahr ist, kann OpenClaw den standardmäßig gebündelten
Codex-Desktop-Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` registrieren, wenn Codex
noch keinen lokalen Marketplace entdeckt hat. Verwenden Sie `/new` oder `/reset`, nachdem
Sie Runtime- oder Computernutzungs-Konfiguration geändert haben, damit vorhandene Sitzungen
keine alte PI- oder Codex-Thread-Bindung behalten.

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

Vom Guardian geprüfte Codex-Genehmigungen:

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

Der Modellwechsel bleibt von OpenClaw gesteuert. Wenn eine OpenClaw-Sitzung an einen
bestehenden Codex-Thread angehängt ist, sendet der nächste Turn das aktuell ausgewählte
OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und die Service-Stufe
erneut an den App-Server. Der Wechsel von `openai/gpt-5.5` zu `openai/gpt-5.2` behält die
Thread-Bindung bei, fordert Codex aber auf, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert auf jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt die Live-Konnektivität zum app-server, Modelle, Konto, Rate Limits, MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex app-server auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen vorhandenen Codex-Thread an.
- `/codex compact` fordert den Codex app-server auf, den angehängten Thread zu compacten.
- `/codex review` startet die native Codex-Review für den angehängten Thread.
- `/codex diagnostics [note]` fragt vor dem Senden von Codex-Diagnose-Feedback für den angehängten Thread nach.
- `/codex computer-use status` prüft das konfigurierte Computer Use Plugin und den MCP-Server.
- `/codex computer-use install` installiert das konfigurierte Computer Use Plugin und lädt MCP-Server neu.
- `/codex account` zeigt Konto- und Rate-Limit-Status an.
- `/codex mcp` listet den MCP-Serverstatus des Codex app-server auf.
- `/codex skills` listet Skills des Codex app-server auf.

Wenn Codex einen Nutzungslimitfehler meldet, enthält OpenClaw die nächste
Zurücksetzungszeit des app-server, sofern Codex eine bereitgestellt hat. Verwenden Sie `/codex account` in derselben
Unterhaltung, um die aktuellen Konto- und Rate-Limit-Fenster zu prüfen.

### Häufiger Debugging-Workflow

Wenn ein Codex-gestützter Agent in Telegram, Discord, Slack
oder einem anderen Kanal etwas Unerwartetes tut, beginnen Sie mit der Unterhaltung, in der das Problem aufgetreten ist:

1. Führen Sie `/diagnostics bad tool choice after image upload` oder eine andere kurze Notiz aus,
   die beschreibt, was Sie gesehen haben.
2. Genehmigen Sie die Diagnoseanfrage einmal. Die Genehmigung erstellt die lokale Gateway-
   Diagnose-ZIP und sendet, da die Sitzung das Codex-Harness verwendet, außerdem
   das relevante Codex-Feedback-Bundle an OpenAI-Server.
3. Kopieren Sie die abgeschlossene Diagnoseantwort in den Fehlerbericht oder Support-Thread.
   Sie enthält den lokalen Bundle-Pfad, die Datenschutz-Zusammenfassung, OpenClaw-Sitzungs-IDs,
   Codex-Thread-IDs und eine Zeile `Inspect locally` für jeden Codex-Thread.
4. Wenn Sie den Lauf selbst debuggen möchten, führen Sie den ausgegebenen Befehl `Inspect locally`
   in einem Terminal aus. Er sieht wie `codex resume <thread-id>` aus und öffnet den
   nativen Codex-Thread, damit Sie die Unterhaltung prüfen, lokal fortsetzen
   oder Codex fragen können, warum er ein bestimmtes Tool oder einen bestimmten Plan gewählt hat.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie ausdrücklich den Codex-
Feedback-Upload für den aktuell angehängten Thread ohne das vollständige OpenClaw-
Gateway-Diagnose-Bundle wünschen. Für die meisten Supportberichte ist `/diagnostics [note]`
der bessere Ausgangspunkt, weil es den lokalen Gateway-Status und die Codex-
Thread-IDs in einer Antwort zusammenführt. Siehe [Diagnoseexport](/de/gateway/diagnostics)
für das vollständige Datenschutzmodell und das Verhalten in Gruppenchats.

Core OpenClaw stellt außerdem das nur für Owner verfügbare `/diagnostics [note]` als allgemeinen
Gateway-Diagnosebefehl bereit. Die Genehmigungsaufforderung zeigt den Hinweis zu sensiblen Daten,
verlinkt auf [Diagnoseexport](/de/gateway/diagnostics) und fordert
`openclaw gateway diagnostics export --json` jedes Mal über eine ausdrückliche exec-Genehmigung
an. Genehmigen Sie Diagnosen nicht mit einer Allow-all-Regel. Nach der Genehmigung
sendet OpenClaw einen einfügbaren Bericht mit dem lokalen Bundle-Pfad und der Manifest-
Zusammenfassung. Wenn die aktive OpenClaw-Sitzung das Codex-Harness verwendet, autorisiert
dieselbe Genehmigung außerdem das Senden der relevanten Codex-Feedback-Bundles an
OpenAI-Server. Die Genehmigungsaufforderung sagt, dass Codex-Feedback gesendet wird,
listet aber vor der Genehmigung keine Codex-Sitzungs- oder Thread-IDs auf.

Wenn `/diagnostics` von einem Owner in einem Gruppenchat aufgerufen wird, hält OpenClaw den
gemeinsamen Kanal sauber: Die Gruppe erhält nur eine kurze Mitteilung, während der
Diagnosehinweis, Genehmigungsaufforderungen und Codex-Sitzungs-/Thread-IDs über
die private Genehmigungsroute an den Owner gesendet werden. Wenn es keine private Owner-Route gibt,
lehnt OpenClaw die Gruppenanfrage ab und fordert den Owner auf, sie aus einer DM auszuführen.

Der genehmigte Codex-Upload ruft Codex app-server `feedback/upload` auf und fordert
den app-server auf, Protokolle für jeden aufgeführten Thread und gestartete Codex-Unterthreads
einzuschließen, sofern verfügbar. Der Upload läuft über den normalen Feedbackpfad von Codex zu OpenAI-
Servern; wenn Codex-Feedback in diesem app-server deaktiviert ist, gibt der Befehl
den app-server-Fehler zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle,
OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen `codex resume <thread-id>`-
Befehle für die gesendeten Threads auf. Wenn Sie die Genehmigung ablehnen oder ignorieren,
gibt OpenClaw diese Codex-IDs nicht aus. Dieser Upload ersetzt nicht den lokalen
Gateway-Diagnoseexport.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die das Harness für
normale Turns verwendet. Bei der nächsten Nachricht nimmt OpenClaw diesen Codex-Thread wieder auf, übergibt das
aktuell ausgewählte OpenClaw-Modell an den app-server und lässt den erweiterten Verlauf
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
jeden Codex-Thread auf und gibt einen Befehl `Inspect locally` aus, zum Beispiel
`codex resume <thread-id>`. Sie können diesen Befehl direkt in ein Terminal kopieren.

Sie können eine Thread-ID auch aus `/codex binding` für den aktuellen Chat oder
`/codex threads [filter]` für aktuelle Codex app-server-Threads abrufen und dann denselben
Befehl `codex resume` in Ihrer Shell ausführen.

Die Befehlsoberfläche erfordert Codex app-server `0.125.0` oder neuer. Einzelne
Steuerungsmethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder benutzerdefinierter app-server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Das Codex-Harness hat drei Hook-Schichten:

| Schicht                               | Owner                    | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Codex app-server-Erweiterungs-Middleware | Mit OpenClaw gebündelte Plugins | Adapterverhalten pro Turn rund um dynamische OpenClaw-Tools.        |
| Native Codex-Hooks                    | Codex                    | Low-Level-Codex-Lebenszyklus und native Tool-Policy aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien, um
OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte native Tool- und Berechtigungsbrücke
injiziert OpenClaw pro Thread Codex-Konfiguration für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`. Andere Codex-Hooks wie `SessionStart` und
`UserPromptSubmit` bleiben Codex-Level-Steuerelemente; sie werden im v1-Vertrag nicht als
OpenClaw-Plugin-Hooks offengelegt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den
Aufruf anfordert, sodass OpenClaw das Plugin- und Middleware-Verhalten auslöst, das es im
Harness-Adapter besitzt. Für Codex-native Tools besitzt Codex den kanonischen Tool-Datensatz.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber den nativen Codex-
Thread nicht umschreiben, es sei denn, Codex stellt diese Operation über app-server oder native Hook-
Callbacks bereit.

Compaction- und LLM-Lebenszyklusprojektionen stammen aus Benachrichtigungen des Codex app-server
und dem OpenClaw-Adapterstatus, nicht aus nativen Codex-Hook-Befehlen.
OpenClaws Ereignisse `before_compaction`, `after_compaction`, `llm_input` und
`llm_output` sind Beobachtungen auf Adapterebene, keine bytegenauen Erfassungen
der internen Anforderungs- oder Compaction-Payloads von Codex.

Native Codex-Benachrichtigungen `hook/started` und `hook/completed` des app-server werden
als Agent-Ereignisse `codex_app_server.hook` für Trajectory und Debugging projiziert.
Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Supportvertrag

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex besitzt größere Teile
des nativen Modell-Loops, und OpenClaw passt seine Plugin- und Sitzungsoberflächen
an diese Grenze an.

Unterstützt in Codex runtime v1:

| Oberfläche                                    | Support                                 | Warum                                                                                                                                                                                               |
| --------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modell-Loop über Codex                 | Unterstützt                             | Codex app-server besitzt den OpenAI-Turn, die native Thread-Wiederaufnahme und die native Tool-Fortsetzung.                                                                                         |
| OpenClaw-Kanalrouting und Zustellung          | Unterstützt                             | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modell-runtime.                                                                                                |
| Dynamische OpenClaw-Tools                     | Unterstützt                             | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                     |
| Prompt- und Kontext-Plugins                   | Unterstützt                             | OpenClaw baut Prompt-Overlays und projiziert Kontext in den Codex-Turn, bevor der Thread gestartet oder fortgesetzt wird.                                                                           |
| Kontext-Engine-Lebenszyklus                   | Unterstützt                             | Zusammenstellung, Aufnahme oder Wartung nach dem Turn sowie Koordination der Kontext-Engine-Compaction laufen für Codex-Turns.                                                                      |
| Dynamische Tool-Hooks                         | Unterstützt                             | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen rund um OpenClaw-eigene dynamische Tools.                                                                                 |
| Lebenszyklus-Hooks                            | Unterstützt als Adapterbeobachtungen    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                             |
| Gate zur Überarbeitung der finalen Antwort    | Unterstützt über das native Hook-Relay  | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                     |
| Native Shell-, Patch- und MCP-Blockierung oder -Beobachtung | Unterstützt über das native Hook-Relay | Codex `PreToolUse` und `PostToolUse` werden für festgelegte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex app-server `0.125.0` oder neuer. Blockieren wird unterstützt; Argumentumschreibung nicht. |
| Native Berechtigungs-Policy                   | Unterstützt über das native Hook-Relay  | Codex `PermissionRequest` kann über die OpenClaw-Policy geroutet werden, wo die runtime sie bereitstellt. Wenn OpenClaw keine Entscheidung zurückgibt, fährt Codex über seinen normalen Guardian- oder Benutzer-Genehmigungspfad fort. |
| app-server-Trajectory-Erfassung               | Unterstützt                             | OpenClaw zeichnet die Anfrage auf, die es an app-server gesendet hat, sowie die app-server-Benachrichtigungen, die es empfängt.                                                                     |

Nicht unterstützt in Codex runtime v1:

| Oberfläche                                         | V1-Grenze                                                                                                                                      | Zukünftiger Pfad                                                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Änderung nativer Tool-Argumente                    | Codex-native Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                    | Erfordert Codex-Hook-/Schema-Unterstützung für ersetzte Tool-Eingaben.                                   |
| Bearbeitbarer Codex-nativer Transkriptverlauf       | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber nicht unterstützte Interna nicht verändern. | Fügen Sie explizite Codex-App-Server-APIs hinzu, falls native Thread-Operationen benötigt werden.        |
| `tool_result_persist` für Codex-native Tool-Einträge | Dieser Hook transformiert OpenClaw-eigene Transkript-Schreibvorgänge, nicht Codex-native Tool-Einträge.                                        | Transformierte Einträge könnten gespiegelt werden, aber das kanonische Umschreiben erfordert Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten            | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Liste beibehaltener/verworfener Einträge, kein Token-Delta und keine Zusammenfassungsnutzlast. | Erfordert umfangreichere Codex-Compaction-Events.                                                        |
| Compaction-Eingriff                                 | Aktuelle OpenClaw-Compaction-Hooks haben im Codex-Modus Benachrichtigungsniveau.                                                               | Fügen Sie Codex-Pre-/Post-Compaction-Hooks hinzu, falls Plugins native Compaction ablehnen oder umschreiben müssen. |
| Bytegenaue Erfassung von Modell-API-Anfragen        | OpenClaw kann App-Server-Anfragen und Benachrichtigungen erfassen, aber der Codex-Kern erstellt die endgültige OpenAI-API-Anfrage intern.       | Erfordert ein Codex-Modellanfrage-Tracing-Event oder eine Debug-API.                                     |

## Tools, Medien und Compaction

Der Codex-Harness ändert nur den Low-Level-Executor für eingebettete Agenten.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools
laufen weiterhin über den normalen OpenClaw-Auslieferungspfad.

Das native Hook-Relay ist absichtlich generisch, aber der V1-Supportvertrag ist
auf die Codex-nativen Tool- und Berechtigungspfade beschränkt, die OpenClaw testet. In
der Codex-Laufzeit umfasst das Shell-, Patch- und MCP-`PreToolUse`-,
`PostToolUse`- und `PermissionRequest`-Nutzlasten. Gehen Sie nicht davon aus, dass jedes zukünftige
Codex-Hook-Event eine OpenClaw-Plugin-Oberfläche ist, bis der Laufzeitvertrag
es benennt.

Für `PermissionRequest` gibt OpenClaw nur dann explizite Zulassen- oder Ablehnen-Entscheidungen
zurück, wenn die Richtlinie entscheidet. Ein Ergebnis ohne Entscheidung ist keine Zulassung.
Codex behandelt es als keine Hook-Entscheidung und fällt auf seinen eigenen Guardian- oder Benutzerfreigabepfad zurück.

Genehmigungsabfragen für Codex-MCP-Tools werden über den Plugin-Genehmigungsfluss von OpenClaw
geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Eingabeaufforderungen werden an den
ursprünglichen Chat zurückgesendet, und die nächste eingereihte Follow-up-Nachricht beantwortet diese native
Serveranfrage, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Elicitation-
Anfragen scheitern weiterhin geschlossen.

Active-Run-Queue-Steuerung wird auf `turn/steer` des Codex-App-Servers abgebildet. Mit dem
Standard `messages.queue.mode: "steer"` bündelt OpenClaw eingereihte Chatnachrichten
für das konfigurierte Ruhefenster und sendet sie als eine `turn/steer`-Anfrage in
Eingangsreihenfolge. Der Legacy-`queue`-Modus sendet separate `turn/steer`-Anfragen. Codex-
Review- und manuelle Compaction-Turns können Same-Turn-Steuerung ablehnen; in diesem Fall
verwendet OpenClaw die Follow-up-Queue, wenn der ausgewählte Modus einen Fallback erlaubt. Siehe
[Steering-Queue](/de/concepts/queue-steering).

Wenn das ausgewählte Modell den Codex-Harness verwendet, wird native Thread-Compaction an den
Codex-App-Server delegiert. OpenClaw behält eine Transkriptspiegelung für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftiges Wechseln von Modell oder Harness. Die
Spiegelung enthält den Benutzerprompt, den endgültigen Assistant-Text und schlanke Codex-
Reasoning- oder Planeinträge, wenn der App-Server sie ausgibt. Derzeit zeichnet OpenClaw nur
Start- und Abschlusssignale nativer Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste bereit, welche Einträge Codex
nach der Compaction behalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit
Codex-native Tool-Ergebniseinträge nicht um. Es wird nur angewendet, wenn
OpenClaw ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungstranskript schreibt.

Medienerzeugung erfordert kein PI. Bild-, Video-, Musik-, PDF-, TTS- und Medienverständnis
verwenden weiterhin die passenden Provider-/Modell-Einstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist bei
neuen Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Modell mit
`agentRuntime.id: "codex"` (oder eine Legacy-`codex/*`-Referenz), aktivieren Sie
`plugins.entries.codex.enabled`, und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** `agentRuntime.id: "auto"` kann weiterhin PI als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Lauf beansprucht. Setzen Sie
`agentRuntime.id: "codex"`, um die Codex-Auswahl beim Testen zu erzwingen. Eine
erzwungene Codex-Laufzeit schlägt fehl, statt auf PI zurückzufallen. Sobald der Codex-App-Server
ausgewählt ist, werden seine Fehler direkt sichtbar.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, damit der App-Server-Handshake
Version `0.125.0` oder neuer meldet. Vorabversionen derselben Version oder Versionen mit Build-Suffix
wie `0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil die
stabile Protokolluntergrenze `0.125.0` von OpenClaw getestet wird.

**Modellerkennung ist langsam:** Verringern Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und ob der entfernte App-Server dieselbe Codex-App-Server-Protokollversion spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist erwartet, sofern Sie nicht
`agentRuntime.id: "codex"` für diesen Agenten erzwungen oder eine Legacy-
`codex/*`-Referenz ausgewählt haben. Einfache `openai/gpt-*`- und andere Provider-Referenzen bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad. Wenn Sie `agentRuntime.id: "codex"` erzwingen, muss jeder eingebettete
Turn für diesen Agenten ein von Codex unterstütztes OpenAI-Modell sein.

**Computer Use ist installiert, aber Tools werden nicht ausgeführt:** Prüfen Sie
`/codex computer-use status` aus einer frischen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; wenn das bestehen bleibt, starten Sie
das Gateway neu, um veraltete native Hook-Registrierungen zu löschen. Wenn `computer-use.list_apps`
eine Zeitüberschreitung hat, starten Sie Codex Computer Use oder Codex Desktop neu und versuchen Sie es erneut.

## Verwandte Themen

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin-Hooks](/de/plugins/hooks)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
