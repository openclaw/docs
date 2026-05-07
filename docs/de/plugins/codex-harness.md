---
read_when:
    - Sie möchten den mitgelieferten Codex-App-Server-Harness verwenden
    - Sie benötigen Beispiele für die Codex-Harness-Konfiguration
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, statt auf PI zurückzufallen
summary: Führen Sie eingebettete OpenClaw-Agentendurchläufe über die gebündelte Codex-App-Server-Testumgebung aus
title: Codex-Harness
x-i18n:
    generated_at: "2026-05-07T13:22:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9bc5e78b1c6737dad7037ef77cfa9f16d480f02671363591509696d232e2d52e
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete Agent-Durchläufe über den Codex App-Server statt über das integrierte PI-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung steuern soll: Modellerkennung, native Thread-Fortsetzung, native Compaction und App-Server-Ausführung. OpenClaw verwaltet weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl, Tools, Genehmigungen, Medienzustellung und die sichtbare Transkriptspiegelung.

Wenn ein Quell-Chat-Durchlauf über das Codex-Harness ausgeführt wird, verwenden sichtbare Antworten standardmäßig das OpenClaw-`message`-Tool, sofern die Bereitstellung `messages.visibleReplies` nicht ausdrücklich konfiguriert hat. Der Agent kann seinen Codex-Durchlauf weiterhin privat abschließen; er postet nur dann in den Kanal, wenn er `message(action="send")` aufruft. Setzen Sie `messages.visibleReplies: "automatic"`, um finale Antworten in direkten Chats weiterhin über den bisherigen automatischen Zustellungspfad auszuliefern.

Codex-Heartbeat-Durchläufe erhalten außerdem standardmäßig das Tool `heartbeat_respond`, sodass der Agent aufzeichnen kann, ob das Aufwecken still bleiben oder benachrichtigen soll, ohne diesen Kontrollfluss im finalen Text zu codieren.

Heartbeat-spezifische Initiative-Hinweise werden als Codex-Entwicklerinstruktion im Kollaborationsmodus auf dem Heartbeat-Durchlauf selbst gesendet. Normale Chat-Durchläufe stellen stattdessen den Codex Default-Modus wieder her, statt Heartbeat-Philosophie in ihrem normalen Runtime-Prompt mitzuführen.

Wenn Sie sich orientieren möchten, beginnen Sie mit [Agent-Runtimes](/de/concepts/agent-runtimes). Die Kurzfassung lautet: `openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Runtime, und Telegram, Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Schnellkonfiguration

Die meisten Benutzer, die „Codex in OpenClaw“ möchten, wollen diese Route: Melden Sie sich mit einem ChatGPT-/Codex-Abonnement an und führen Sie dann eingebettete Agent-Durchläufe über die native Codex App-Server-Runtime aus. Die Modellreferenz bleibt weiterhin kanonisch `openai/gpt-*`; die Abonnementauthentifizierung kommt aus dem Codex-Konto/-Profil, nicht aus einem `openai-codex/*`-Modellpräfix.

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

Verwenden Sie `openai-codex/gpt-*` nicht in der Konfiguration. Dieses Präfix ist eine Legacy-Route, die `openclaw doctor --fix` über primäre Modelle, Fallbacks, Heartbeat-/Subagent-/Compaction-Überschreibungen, Hooks, Kanalüberschreibungen und veraltete persistierte Sitzungs-Routen-Pins hinweg zu `openai/gpt-*` umschreibt.

## Was dieses Plugin ändert

Das gebündelte `codex`-Plugin stellt mehrere separate Fähigkeiten bereit:

| Fähigkeit                         | So verwenden Sie sie                                | Was sie bewirkt                                                              |
| --------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native eingebettete Runtime       | `agentRuntime.id: "codex"`                          | Führt eingebettete OpenClaw-Agent-Durchläufe über den Codex App-Server aus.  |
| Native Chat-Steuerungsbefehle     | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindet und steuert Codex-App-Server-Threads aus einer Messaging-Unterhaltung. |
| Codex App-Server-Provider/-Katalog | `codex`-Interna, über das Harness verfügbar gemacht | Ermöglicht der Runtime, App-Server-Modelle zu erkennen und zu validieren.     |
| Codex-Pfad für Medienverständnis  | `codex/*`-Kompatibilitätspfade für Bildmodelle      | Führt begrenzte Codex-App-Server-Durchläufe für unterstützte Modelle zum Bildverständnis aus. |
| Native Hook-Weiterleitung         | Plugin-Hooks um Codex-native Ereignisse             | Ermöglicht OpenClaw, unterstützte Codex-native Tool-/Finalisierungsereignisse zu beobachten/blockieren. |

Das Aktivieren des Plugins macht diese Fähigkeiten verfügbar. Es bewirkt **nicht**:

- direkte OpenAI-API-Key-Oberflächen wie Bilder, Embeddings, Sprache oder Realtime zu ersetzen
- `openai-codex/*`-Modellreferenzen ohne `openclaw doctor --fix` zu konvertieren
- ACP/acpx zum Standard-Codex-Pfad zu machen
- vorhandene Sitzungen, die bereits eine PI-Runtime aufgezeichnet haben, im laufenden Betrieb umzuschalten
- OpenClaw-Kanalzustellung, Sitzungsdateien, Auth-Profil-Speicherung oder Nachrichtenrouting zu ersetzen

Dasselbe Plugin besitzt auch die native `/codex`-Chat-Steuerungsoberfläche. Wenn das Plugin aktiviert ist und der Benutzer darum bittet, Codex-Threads aus dem Chat heraus zu binden, fortzusetzen, zu steuern, zu stoppen oder zu prüfen, sollten Agenten `/codex ...` gegenüber ACP bevorzugen. ACP bleibt der ausdrückliche Fallback, wenn der Benutzer nach ACP/acpx fragt oder den ACP-Codex-Adapter testet.

Native Codex-Durchläufe behalten OpenClaw-Plugin-Hooks als öffentliche Kompatibilitätsschicht bei. Dies sind prozessinterne OpenClaw-Hooks, keine Codex-`hooks.json`-Befehlshooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transkriptdatensätze
- `before_agent_finalize` über Codex-`Stop`-Weiterleitung
- `agent_end`

Plugins können außerdem runtime-neutrale Middleware für Tool-Ergebnisse registrieren, um dynamische OpenClaw-Tool-Ergebnisse umzuschreiben, nachdem OpenClaw das Tool ausgeführt hat und bevor das Ergebnis an Codex zurückgegeben wird. Dies ist getrennt vom öffentlichen `tool_result_persist`-Plugin-Hook, der von OpenClaw verwaltete Transkript-Schreibvorgänge für Tool-Ergebnisse transformiert.

Die Semantik der Plugin-Hooks selbst finden Sie unter [Plugin-Hooks](/de/plugins/hooks) und [Plugin-Guard-Verhalten](/de/tools/plugin).

OpenAI-Agent-Modellreferenzen verwenden standardmäßig das Harness. Neue Konfigurationen sollten OpenAI-Modellreferenzen kanonisch als `openai/gpt-*` beibehalten; `agentRuntime.id: "codex"` ist weiterhin gültig, aber für OpenAI-Agent-Durchläufe nicht mehr erforderlich. Legacy-`codex/*`-Modellreferenzen wählen aus Kompatibilitätsgründen weiterhin automatisch das Harness aus, aber runtime-gestützte Legacy-Provider-Präfixe werden nicht als normale Modell-/Provider-Auswahl angezeigt.

Wenn eine konfigurierte Modellroute noch `openai-codex/*` ist, schreibt `openclaw doctor --fix` sie zu `openai/*` um. Für passende Agent-Routen setzt es die Agent-Runtime auf `codex` und behält vorhandene `openai-codex`-Auth-Profil-Überschreibungen bei.

## Routenübersicht

Verwenden Sie diese Tabelle, bevor Sie die Konfiguration ändern:

| Gewünschtes Verhalten                                | Modellreferenz            | Runtime-Konfiguration                 | Auth-/Profilroute             | Erwartetes Statuslabel       |
| ---------------------------------------------------- | -------------------------- | -------------------------------------- | ------------------------------ | ---------------------------- |
| ChatGPT-/Codex-Abonnement mit nativer Codex-Runtime  | `openai/gpt-*`             | ausgelassen oder `agentRuntime.id: "codex"` | Codex OAuth oder Codex-Konto | `Runtime: OpenAI Codex`      |
| OpenAI-API-Key-Auth für Agent-Modelle                | `openai/gpt-*`             | ausgelassen oder `agentRuntime.id: "codex"` | `openai-codex`-API-Key-Profil | `Runtime: OpenAI Codex`      |
| Legacy-Konfiguration, die Doctor-Reparatur benötigt  | `openai-codex/gpt-*`       | repariert zu `codex`                   | Vorhandene konfigurierte Auth  | Nach `doctor --fix` erneut prüfen |
| Gemischte Provider mit konservativem Auto-Modus      | providerspezifische Referenzen | `agentRuntime.id: "auto"`           | Je ausgewähltem Provider       | Hängt von der ausgewählten Runtime ab |
| Explizite Codex-ACP-Adapter-Sitzung                  | abhängig von ACP-Prompt/-Modell | `sessions_spawn` mit `runtime: "acp"` | ACP-Backend-Auth            | ACP-Aufgaben-/Sitzungsstatus |

Die wichtige Trennung ist Provider versus Runtime:

- `openai-codex/*` ist eine Legacy-Route, die Doctor umschreibt.
- `agentRuntime.id: "codex"` erfordert das Codex-Harness und schlägt geschlossen fehl, wenn es nicht verfügbar ist.
- `agentRuntime.id: "auto"` lässt registrierte Harnesses passende Provider-Routen beanspruchen; OpenAI-Agent-Referenzen werden zu Codex statt PI aufgelöst.
- `/codex ...` beantwortet „welche native Codex-Unterhaltung soll dieser Chat binden oder steuern?“
- ACP beantwortet „welchen externen Harness-Prozess soll acpx starten?“

## Das richtige Modellpräfix wählen

OpenAI-Familienrouten sind präfixspezifisch. Verwenden Sie für die gängige Einrichtung aus Abonnement plus nativer Codex-Runtime `openai/*`. Behandeln Sie `openai-codex/*` als Legacy-Konfiguration, die Doctor umschreiben sollte:

| Modellreferenz                                   | Runtime-Pfad                            | Verwendung                                                       |
| ------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `openai/gpt-5.4`                                  | Codex App-Server-Harness für Agent-Durchläufe | Sie möchten OpenAI-Agent-Modelle über Codex verwenden.       |
| `openai-codex/gpt-5.5`                            | Legacy-Route, die von Doctor repariert wird | Sie verwenden alte Konfiguration; führen Sie `openclaw doctor --fix` aus, um sie umzuschreiben. |
| `openai/gpt-5.5` + `openai-codex`-API-Key-Profil | Codex App-Server-Harness                 | Sie möchten API-Key-Auth für ein OpenAI-Agent-Modell verwenden.  |

GPT-5.5 kann sowohl auf direkten OpenAI-API-Key- als auch auf Codex-Abonnementrouten erscheinen, wenn Ihr Konto diese bereitstellt. Verwenden Sie `openai/gpt-5.5` mit dem Codex-App-Server-Harness für native Codex-Runtime oder `openai/gpt-5.5` ohne Codex-Runtime-Überschreibung für direkten API-Key-Traffic.

Legacy-`codex/gpt-*`-Referenzen bleiben als Kompatibilitätsalias akzeptiert. Die Doctor-Kompatibilitätsmigration schreibt Legacy-Runtime-Referenzen zu kanonischen Modellreferenzen um und zeichnet die Runtime-Richtlinie separat auf. Neue native App-Server-Harness-Konfigurationen sollten `openai/gpt-*` plus `agentRuntime.id: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfixtrennung. Verwenden Sie `openai/gpt-*` für die normale OpenAI-Route und `codex/gpt-*`, wenn Bildverständnis über einen begrenzten Codex-App-Server-Durchlauf laufen soll. Verwenden Sie nicht `openai-codex/gpt-*`; Doctor schreibt dieses Legacy-Präfix zu `openai/gpt-*` um. Das Codex-App-Server-Modell muss Unterstützung für Bildeingaben ausweisen; reine Text-Codex-Modelle schlagen fehl, bevor der Mediendurchlauf startet.

Verwenden Sie `/status`, um das effektive Harness für die aktuelle Sitzung zu bestätigen. Wenn die Auswahl überraschend ist, aktivieren Sie Debug-Logging für das Subsystem `agents/harness` und prüfen Sie den strukturierten Gateway-Datensatz `agent harness selected`. Er enthält die ausgewählte Harness-ID, den Auswahlgrund, die Runtime-/Fallback-Richtlinie und im Modus `auto` das Support-Ergebnis jedes Plugin-Kandidaten.

### Was Doctor-Warnungen bedeuten

`openclaw doctor` warnt, wenn konfigurierte Modellreferenzen oder persistierter Sitzungs-Routenstatus noch `openai-codex/*` verwenden. `openclaw doctor --fix` schreibt diese Routen um zu:

- `openai/<model>`
- `agentRuntime.id: "codex"`

Die `codex`-Route erzwingt das native Codex-Harness. PI-Runtime-Konfiguration ist für OpenAI-Agent-Modell-Durchläufe nicht zulässig. Doctor repariert außerdem veraltete persistierte Sitzungs-Pins über erkannte Agent-Sitzungsspeicher hinweg, damit alte Unterhaltungen nicht auf der entfernten Route festhängen.

Harness-Auswahl ist keine Live-Sitzungssteuerung. Wenn ein eingebetteter Durchlauf ausgeführt wird, zeichnet OpenClaw die ausgewählte Harness-ID in dieser Sitzung auf und verwendet sie für spätere Durchläufe mit derselben Sitzungs-ID weiter. Ändern Sie die `agentRuntime`-Konfiguration oder `OPENCLAW_AGENT_RUNTIME`, wenn zukünftige Sitzungen ein anderes Harness verwenden sollen; verwenden Sie `/new` oder `/reset`, um eine frische Sitzung zu starten, bevor Sie eine vorhandene Unterhaltung zwischen PI und Codex umschalten. Dadurch wird vermieden, ein Transkript durch zwei inkompatible native Sitzungssysteme wiederzugeben.

Legacy-Sitzungen, die vor Harness-Pins erstellt wurden, werden als PI-gepinnt behandelt, sobald sie Transkriptverlauf haben. Verwenden Sie `/new` oder `/reset`, um diese Unterhaltung nach einer Konfigurationsänderung in Codex zu überführen.

`/status` zeigt die effektive Modell-Runtime. Das Standard-PI-Harness erscheint als `Runtime: OpenClaw Pi Default`, und das Codex App-Server-Harness erscheint als `Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig eine kompatible Codex App-Server-Binärdatei, daher wirken sich lokale `codex`-Befehle auf dem `PATH` nicht auf den normalen Harness-Start aus.
- Codex-Authentifizierung, die dem App-Server-Prozess oder der Codex-Auth-Bridge von OpenClaw zur Verfügung steht. Lokale App-Server-Starts verwenden für jeden Agent ein von OpenClaw verwaltetes Codex-Home und ein isoliertes untergeordnetes `HOME`, sodass sie standardmäßig weder Ihr persönliches `~/.codex`-Konto noch Skills, Plugins, Konfiguration, Thread-Zustand oder natives `$HOME/.agents/skills` lesen.

Das Plugin blockiert ältere oder unversionierte App-Server-Handshakes. Dadurch bleibt OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung normalerweise aus dem Codex CLI-Konto oder einem OpenClaw-Auth-Profil `openai-codex`. Lokale stdio-App-Server-Starts können auch auf `CODEX_API_KEY` / `OPENAI_API_KEY` zurückfallen, wenn kein Konto vorhanden ist.

## Workspace-Bootstrap-Dateien

Codex verarbeitet `AGENTS.md` selbst über die native Projekt-Dokumenterkennung. OpenClaw schreibt keine synthetischen Codex-Projektdokumentdateien und hängt nicht von Codex-Fallback-Dateinamen für Persona-Dateien ab, da Codex-Fallbacks nur greifen, wenn `AGENTS.md` fehlt.

Für Workspace-Parität in OpenClaw löst der Codex-Harness die anderen Bootstrap-Dateien (`SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md`, falls vorhanden) auf und leitet sie über Codex-Entwicklerinstruktionen bei `thread/start` und `thread/resume` weiter. Dadurch bleiben `SOUL.md` und zugehöriger Workspace-Persona-/Profilkontext auf der nativen verhaltensprägenden Codex-Spur sichtbar, ohne `AGENTS.md` zu duplizieren.

## Codex neben anderen Modellen hinzufügen

Setzen Sie `agentRuntime.id: "codex"` nicht global, wenn derselbe Agent frei zwischen Codex- und Nicht-Codex-Provider-Modellen wechseln soll. Eine erzwungene Laufzeit gilt für jede eingebettete Runde dieses Agents oder dieser Sitzung. Wenn Sie ein Anthropic-Modell auswählen, während diese Laufzeit erzwungen ist, versucht OpenClaw weiterhin den Codex-Harness und schlägt geschlossen fehl, statt diese Runde stillschweigend über PI weiterzuleiten.

Verwenden Sie stattdessen eine dieser Formen:

- Legen Sie Codex auf einen dedizierten Agent mit `agentRuntime.id: "codex"`.
- Behalten Sie den Standard-Agent auf `agentRuntime.id: "auto"` und den PI-Fallback für normale gemischte Provider-Nutzung bei.
- Verwenden Sie alte `codex/*`-Refs nur aus Kompatibilitätsgründen. Neue Konfigurationen sollten `openai/*` plus eine explizite Codex-Laufzeitrichtlinie bevorzugen.

Dieses Beispiel belässt den Standard-Agent bei der normalen automatischen Auswahl und fügt einen separaten Codex-Agent hinzu:

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
- Der Agent `codex` verwendet den Codex App-Server-Harness.
- Wenn Codex für den Agent `codex` fehlt oder nicht unterstützt wird, schlägt die Runde fehl, statt stillschweigend PI zu verwenden.

## Agent-Befehlsrouting

Agents sollten Benutzeranfragen nach Absicht routen, nicht allein nach dem Wort „Codex“:

| Benutzer fragt nach...                                      | Agent sollte verwenden...                         |
| ----------------------------------------------------------- | ------------------------------------------------- |
| „Diesen Chat an Codex binden“                               | `/codex bind`                                     |
| „Codex-Thread `<id>` hier fortsetzen“                       | `/codex resume <id>`                              |
| „Codex-Threads anzeigen“                                    | `/codex threads`                                  |
| „Supportbericht für einen fehlerhaften Codex-Lauf erstellen“ | `/diagnostics [note]`                             |
| „Nur Codex-Feedback für diesen angehängten Thread senden“    | `/codex diagnostics [note]`                       |
| „Mein ChatGPT/Codex-Abonnement mit Codex-Laufzeit verwenden“ | `openai/*`                                        |
| „Alte `openai-codex/*`-Konfigurations-/Sitzungs-Pins reparieren“ | `openclaw doctor --fix`                           |
| „Codex über ACP/acpx ausführen“                             | ACP `sessions_spawn({ runtime: "acp", ... })`     |
| „Claude Code/Gemini/OpenCode/Cursor in einem Thread starten“ | ACP/acpx, nicht `/codex` und keine nativen Sub-Agents |

OpenClaw bewirbt ACP-Spawn-Anleitung für Agents nur, wenn ACP aktiviert, dispatchbar und durch ein geladenes Laufzeit-Backend abgesichert ist. Wenn ACP nicht verfügbar ist, sollten System-Prompt und Plugin-Skills dem Agent kein ACP-Routing vermitteln.

## Nur-Codex-Bereitstellungen

Erzwingen Sie den Codex-Harness, wenn Sie nachweisen müssen, dass jede eingebettete Agent-Runde Codex verwendet. Explizite Plugin-Laufzeiten schlagen geschlossen fehl und werden nie stillschweigend über PI erneut versucht:

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

Wenn Codex erzwungen ist, schlägt OpenClaw früh fehl, falls das Codex-Plugin deaktiviert ist, der App-Server zu alt ist oder der App-Server nicht starten kann.

## Codex pro Agent

Sie können einen Agent nur für Codex konfigurieren, während der Standard-Agent die normale automatische Auswahl behält:

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

Verwenden Sie normale Sitzungsbefehle, um Agents und Modelle zu wechseln. `/new` erstellt eine neue OpenClaw-Sitzung, und der Codex-Harness erstellt oder setzt bei Bedarf seinen Sidecar-App-Server-Thread fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread und lässt die nächste Runde den Harness wieder aus der aktuellen Konfiguration auflösen.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn die Erkennung fehlschlägt oder abläuft, verwendet es einen gebündelten Fallback-Katalog für:

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

Deaktivieren Sie die Erkennung, wenn der Start Codex nicht prüfen und beim Fallback-Katalog bleiben soll:

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

Die verwaltete Binärdatei wird mit dem `codex`-Plugin-Paket ausgeliefert. Dadurch bleibt die App-Server-Version an das gebündelte Plugin gebunden, statt an irgendeine separate Codex CLI, die lokal installiert ist. Setzen Sie `appServer.command` nur, wenn Sie absichtlich eine andere ausführbare Datei ausführen möchten.

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus: `approvalPolicy: "never"`, `approvalsReviewer: "user"` und `sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung für autonome Heartbeats: Codex kann Shell- und Netzwerk-Tools verwenden, ohne an nativen Genehmigungsaufforderungen anzuhalten, die niemand beantworten kann.

Um Codex-Genehmigungen mit Guardian-Review zu aktivieren, setzen Sie `appServer.mode: "guardian"`:

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

Der Guardian-Modus verwendet den nativen Auto-Review-Genehmigungspfad von Codex. Wenn Codex darum bittet, die Sandbox zu verlassen, außerhalb des Workspaces zu schreiben oder Berechtigungen wie Netzwerkzugriff hinzuzufügen, leitet Codex diese Genehmigungsanfrage an den nativen Reviewer statt an eine menschliche Aufforderung weiter. Der Reviewer wendet das Risikomodell von Codex an und genehmigt oder verweigert die konkrete Anfrage. Verwenden Sie Guardian, wenn Sie mehr Leitplanken als im YOLO-Modus möchten, unbeaufsichtigte Agents aber trotzdem Fortschritt machen müssen.

Das Preset `guardian` wird zu `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert. Einzelne Richtlinienfelder überschreiben `mode` weiterhin, sodass fortgeschrittene Bereitstellungen das Preset mit expliziten Entscheidungen kombinieren können. Der ältere Reviewer-Wert `guardian_subagent` wird weiterhin als Kompatibilitätsalias akzeptiert, neue Konfigurationen sollten jedoch `auto_review` verwenden.

Verwenden Sie für einen bereits laufenden App-Server den WebSocket-Transport:

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

Stdio-App-Server-Starts erben standardmäßig die Prozessumgebung von OpenClaw, aber OpenClaw besitzt die Codex App-Server-Kontobrücke und setzt sowohl `CODEX_HOME` als auch `HOME` auf agentenspezifische Verzeichnisse unter dem OpenClaw-Zustand dieses Agents. Der Skill-Loader von Codex liest `$CODEX_HOME/skills` und `$HOME/.agents/skills`, daher sind beide Werte für lokale App-Server-Starts isoliert. Dadurch bleiben Codex-native Skills, Plugins, Konfiguration, Konten und Thread-Zustand auf den OpenClaw-Agent beschränkt, statt aus dem persönlichen Codex CLI-Home des Operators einzusickern.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots fließen weiterhin über OpenClaws eigene Plugin-Registry und den Skill-Loader. Persönliche Codex CLI-Assets tun das nicht. Wenn Sie nützliche Codex CLI-Skills oder Plugins haben, die Teil eines OpenClaw-Agents werden sollen, inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Der Codex-Migrations-Provider kopiert Skills in den aktuellen OpenClaw-Agent-Workspace. Codex-native Plugins, Hooks und Konfigurationsdateien werden für eine manuelle Prüfung gemeldet oder archiviert, statt automatisch aktiviert zu werden, da sie Befehle ausführen, MCP-Server offenlegen oder Zugangsdaten enthalten können.

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Auth-Profil für den Agent.
2. Das vorhandene Konto des App-Servers im Codex-Home dieses Agents.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Auth-Profil im Stil eines ChatGPT-Abonnements erkennt, entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten untergeordneten Codex-Prozess. Dadurch bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar, ohne dass native Codex App-Server-Runden versehentlich über die API abgerechnet werden. Explizite Codex-API-Schlüsselprofile und lokaler stdio-Env-Key-Fallback verwenden App-Server-Login statt geerbter untergeordneter Prozessumgebung. WebSocket-App-Server-Verbindungen erhalten keinen Gateway-Env-API-Key-Fallback; verwenden Sie ein explizites Auth-Profil oder das eigene Konto des entfernten App-Servers.

Wenn eine Bereitstellung zusätzliche Umgebungsisolation benötigt, fügen Sie diese Variablen zu `appServer.clearEnv` hinzu:

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

`appServer.clearEnv` wirkt sich nur auf den erzeugten untergeordneten Codex App-Server-Prozess aus.

Codex Dynamic Tools verwenden standardmäßig das Profil `native-first`. In diesem Modus
stellt OpenClaw keine dynamischen Tools bereit, die Codex-native Workspace-
Operationen duplizieren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` und
`update_plan`. OpenClaw-Integrationstools wie Messaging, Sessions, Medien,
Cron, Browser, Nodes, Gateway, `heartbeat_respond` und `web_search` bleiben
verfügbar.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard         | Bedeutung                                                                                                  |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsProfile` | `"native-first"` | Verwenden Sie `"openclaw-compat"`, um den vollständigen Satz dynamischer OpenClaw-Tools für den Codex app-server bereitzustellen. |
| `codexDynamicToolsExclude` | `[]`             | Zusätzliche Namen dynamischer OpenClaw-Tools, die in Codex app-server-Turns ausgelassen werden sollen.      |

Unterstützte `appServer`-Felder:

| Feld                          | Standard                                 | Bedeutung                                                                                                                                                                                                                              |
| ----------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                      |
| `command`                     | verwaltete Codex-Binärdatei              | Ausführbare Datei für den stdio-Transport. Nicht setzen, um die verwaltete Binärdatei zu verwenden; nur für eine explizite Überschreibung setzen.                                                                                      |
| `args`                        | `["app-server", "--listen", "stdio://"]` | Argumente für den stdio-Transport.                                                                                                                                                                                                     |
| `url`                         | nicht gesetzt                            | WebSocket-URL des app-server.                                                                                                                                                                                                          |
| `authToken`                   | nicht gesetzt                            | Bearer-Token für den WebSocket-Transport.                                                                                                                                                                                              |
| `headers`                     | `{}`                                     | Zusätzliche WebSocket-Header.                                                                                                                                                                                                          |
| `clearEnv`                    | `[]`                                     | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-app-server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung erstellt hat. `CODEX_HOME` und `HOME` sind für OpenClaws Codex-Isolation pro Agent bei lokalen Starts reserviert. |
| `requestTimeoutMs`            | `60000`                                  | Timeout für app-server-Control-Plane-Aufrufe.                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                  | Ruhefenster nach einer turn-bezogenen Codex-app-server-Anfrage, während OpenClaw auf `turn/completed` wartet. Erhöhen Sie diesen Wert für langsame Synthesephasen nach Tool-Aufrufen oder reine Statusphasen.                         |
| `mode`                        | `"yolo"`                                 | Voreinstellung für YOLO- oder durch Guardian geprüfte Ausführung.                                                                                                                                                                      |
| `approvalPolicy`              | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzung/Turn gesendet wird.                                                                                                                                               |
| `sandbox`                     | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzung gesendet wird.                                                                                                                                                            |
| `approvalsReviewer`           | `"user"`                                 | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                      |
| `serviceTier`                 | nicht gesetzt                            | Optionale Codex-app-server-Service-Stufe: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert.                                                                                                                    |

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt: Jede Codex-Anfrage `item/tool/call` muss
innerhalb von 30 Sekunden eine OpenClaw-Antwort erhalten. Bei Timeout bricht
OpenClaw das Tool-Signal ab, sofern unterstützt, und gibt eine fehlgeschlagene
Dynamic-Tool-Antwort an Codex zurück, damit der Turn fortgesetzt werden kann,
statt die Session in `processing` zu belassen.

Nachdem OpenClaw auf eine turn-bezogene Codex-app-server-Anfrage geantwortet
hat, erwartet das Harness außerdem, dass Codex den nativen Turn mit
`turn/completed` beendet. Wenn der app-server nach dieser Antwort für
`appServer.turnCompletionIdleTimeoutMs` ruhig bleibt, unterbricht OpenClaw den
Codex-Turn nach bestem Bemühen, zeichnet einen Diagnose-Timeout auf und gibt
die OpenClaw-Session-Lane frei, damit nachfolgende Chatnachrichten nicht hinter
einem veralteten nativen Turn eingereiht werden. Jede nicht-terminale
Benachrichtigung für denselben Turn, einschließlich `rawResponseItem/completed`,
deaktiviert diesen kurzen Watchdog, weil Codex nachgewiesen hat, dass der Turn
noch aktiv ist; der längere terminale Watchdog schützt weiterhin wirklich
hängende Turns. Timeout-Diagnosen enthalten die letzte app-server-
Benachrichtigungsmethode und, für rohe Assistant-Antwortelemente, den
Elementtyp, die Rolle, die ID und eine begrenzte Vorschau des Assistant-Texts.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration
wird für wiederholbare Deployments bevorzugt, weil sie das Plugin-Verhalten in
derselben geprüften Datei wie die übrige Einrichtung des Codex-Harness hält.

## Computernutzung

Computer Use wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex Computer Use](/de/plugins/codex-computer-use).

Kurzfassung: OpenClaw vendort die Desktop-Steuerungs-App nicht und führt selbst
keine Desktop-Aktionen aus. Es bereitet den Codex app-server vor, prüft, ob der
MCP-Server `computer-use` verfügbar ist, und lässt Codex dann während Turns im
Codex-Modus die nativen MCP-Tool-Aufrufe ausführen.

Für direkten TryCua-Treiberzugriff außerhalb des Codex-Marketplace-Flows
registrieren Sie `cua-driver mcp` mit `openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'`.
Siehe [Codex Computer Use](/de/plugins/codex-computer-use) zur Unterscheidung
zwischen Codex-eigener Computer Use und direkter MCP-Registrierung.

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

Computer Use ist macOS-spezifisch und kann lokale OS-Berechtigungen erfordern,
bevor der Codex-MCP-Server Apps steuern kann. Wenn `computerUse.enabled` true ist
und der MCP-Server nicht verfügbar ist, schlagen Turns im Codex-Modus fehl,
bevor der Thread startet, statt unbemerkt ohne die nativen Computer-Use-Tools zu
laufen. Siehe [Codex Computer Use](/de/plugins/codex-computer-use) für
Marketplace-Optionen, Remote-Katalog-Grenzen, Statusgründe und Fehlerbehebung.

Wenn `computerUse.autoInstall` true ist, kann OpenClaw den standardmäßig
gebündelten Codex Desktop Marketplace aus
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` registrieren,
falls Codex noch keinen lokalen Marketplace entdeckt hat. Verwenden Sie `/new`
oder `/reset`, nachdem Sie die Runtime- oder Computer-Use-Konfiguration geändert
haben, damit vorhandene Sessions keine alte PI- oder Codex-Thread-Bindung
beibehalten.

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

Codex-only-Harness-Validierung:

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

Durch Guardian geprüfte Codex-Genehmigungen:

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

Remote-app-server mit expliziten Headern:

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

Modellwechsel bleiben OpenClaw-gesteuert. Wenn eine OpenClaw-Session an einen
vorhandenen Codex-Thread angehängt ist, sendet der nächste Turn das aktuell
ausgewählte OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox
und die Service-Stufe erneut an den app-server. Beim Wechsel von
`openai/gpt-5.5` zu `openai/gpt-5.2` bleibt die Thread-Bindung bestehen, aber
Codex wird angewiesen, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er
ist generisch und funktioniert in jedem Kanal, der OpenClaw-Textbefehle
unterstützt.

Häufige Formen:

- `/codex status` zeigt die Live-Konnektivität zum App-Server, Modelle, Konto, Ratenlimits, MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex-App-Servers auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` verbindet die aktuelle OpenClaw-Sitzung mit einem vorhandenen Codex-Thread.
- `/codex compact` fordert den Codex-App-Server auf, den verbundenen Thread zu komprimieren.
- `/codex review` startet die native Codex-Review für den verbundenen Thread.
- `/codex diagnostics [note]` fragt nach, bevor Codex-Diagnosefeedback für den verbundenen Thread gesendet wird.
- `/codex computer-use status` prüft das konfigurierte Computer Use-Plugin und den MCP-Server.
- `/codex computer-use install` installiert das konfigurierte Computer Use-Plugin und lädt MCP-Server neu.
- `/codex account` zeigt Konto- und Ratenlimitstatus an.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet Skills des Codex-App-Servers auf.

Wenn Codex einen Nutzungslimit-Fehler meldet, fügt OpenClaw die nächste
Zurücksetzungszeit des App-Servers ein, sofern Codex eine bereitgestellt hat.
Verwenden Sie `/codex account` in derselben Unterhaltung, um das aktuelle Konto
und die Ratenlimitfenster zu prüfen.

### Allgemeiner Debugging-Workflow

Wenn ein Codex-gestützter Agent in Telegram, Discord, Slack oder einem anderen
Kanal etwas Unerwartetes tut, beginnen Sie mit der Unterhaltung, in der das
Problem aufgetreten ist:

1. Führen Sie `/diagnostics bad tool choice after image upload` oder eine andere
   kurze Notiz aus, die beschreibt, was Sie gesehen haben.
2. Genehmigen Sie die Diagnoseanfrage einmal. Die Genehmigung erstellt die lokale
   Gateway-Diagnose-ZIP-Datei und sendet, da die Sitzung den Codex-Harness
   verwendet, außerdem das relevante Codex-Feedbackpaket an OpenAI-Server.
3. Kopieren Sie die abgeschlossene Diagnoseantwort in den Fehlerbericht oder
   Support-Thread. Sie enthält den lokalen Bundle-Pfad, eine
   Datenschutz-Zusammenfassung, OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und eine
   Zeile `Inspect locally` für jeden Codex-Thread.
4. Wenn Sie den Lauf selbst debuggen möchten, führen Sie den ausgegebenen Befehl
   `Inspect locally` in einem Terminal aus. Er sieht wie `codex resume <thread-id>`
   aus und öffnet den nativen Codex-Thread, damit Sie die Unterhaltung prüfen,
   lokal fortsetzen oder Codex fragen können, warum ein bestimmtes Tool oder ein
   bestimmter Plan gewählt wurde.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie speziell den
Codex-Feedback-Upload für den aktuell verbundenen Thread ohne das vollständige
OpenClaw-Gateway-Diagnosepaket möchten. Für die meisten Supportberichte ist
`/diagnostics [note]` der bessere Ausgangspunkt, weil es den lokalen
Gateway-Zustand und Codex-Thread-IDs in einer Antwort zusammenführt. Siehe
[Diagnoseexport](/de/gateway/diagnostics) für das vollständige Datenschutzmodell
und das Verhalten in Gruppenchats.

OpenClaw Core stellt außerdem das nur für Owner verfügbare `/diagnostics [note]`
als allgemeinen Gateway-Diagnosebefehl bereit. Die Genehmigungsabfrage zeigt die
Präambel zu sensiblen Daten, verlinkt auf den
[Diagnoseexport](/de/gateway/diagnostics) und fordert jedes Mal
`openclaw gateway diagnostics export --json` über eine explizite
Exec-Genehmigung an. Genehmigen Sie Diagnosen nicht mit einer Allow-all-Regel.
Nach der Genehmigung sendet OpenClaw einen einfügbaren Bericht mit dem lokalen
Bundle-Pfad und der Manifest-Zusammenfassung. Wenn die aktive OpenClaw-Sitzung
den Codex-Harness verwendet, autorisiert dieselbe Genehmigung außerdem das
Senden der relevanten Codex-Feedbackpakete an OpenAI-Server. Die
Genehmigungsabfrage sagt, dass Codex-Feedback gesendet wird, listet aber vor der
Genehmigung keine Codex-Sitzungs- oder Thread-IDs auf.

Wenn `/diagnostics` von einem Owner in einem Gruppenchat aufgerufen wird, hält
OpenClaw den geteilten Kanal sauber: Die Gruppe erhält nur einen kurzen Hinweis,
während die Diagnosepräambel, Genehmigungsabfragen und Codex-Sitzungs-/
Thread-IDs über die private Genehmigungsroute an den Owner gesendet werden.
Wenn keine private Owner-Route vorhanden ist, lehnt OpenClaw die Gruppenanfrage
ab und fordert den Owner auf, sie aus einer Direktnachricht auszuführen.

Der genehmigte Codex-Upload ruft `feedback/upload` des Codex-App-Servers auf und
fordert den App-Server auf, Protokolle für jeden aufgeführten Thread und
erzeugte Codex-Subthreads einzuschließen, sofern verfügbar. Der Upload läuft
über den normalen Feedbackpfad von Codex zu OpenAI-Servern; wenn Codex-Feedback
in diesem App-Server deaktiviert ist, gibt der Befehl den App-Server-Fehler
zurück. Die abgeschlossene Diagnoseantwort listet die Kanäle,
OpenClaw-Sitzungs-IDs, Codex-Thread-IDs und lokalen
`codex resume <thread-id>`-Befehle für die gesendeten Threads auf. Wenn Sie die
Genehmigung ablehnen oder ignorieren, gibt OpenClaw diese Codex-IDs nicht aus.
Dieser Upload ersetzt nicht den lokalen Gateway-Diagnoseexport.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die der Harness für
normale Durchläufe verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen
Codex-Thread fort, übergibt das aktuell ausgewählte OpenClaw-Modell an den
App-Server und lässt den erweiterten Verlauf aktiviert.

### Einen Codex-Thread über die CLI prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu verstehen, besteht oft
darin, den nativen Codex-Thread direkt zu öffnen:

```sh
codex resume <thread-id>
```

Verwenden Sie dies, wenn Ihnen in einer Kanalunterhaltung ein Fehler auffällt
und Sie die problematische Codex-Sitzung prüfen, lokal fortsetzen oder Codex
fragen möchten, warum eine bestimmte Tool- oder Denkentscheidung getroffen
wurde. Der einfachste Weg ist üblicherweise, zuerst `/diagnostics [note]`
auszuführen: Nachdem Sie dies genehmigt haben, listet der abgeschlossene Bericht
jeden Codex-Thread auf und gibt einen `Inspect locally`-Befehl aus, zum Beispiel
`codex resume <thread-id>`. Sie können diesen Befehl direkt in ein Terminal
kopieren.

Sie können eine Thread-ID auch über `/codex binding` für den aktuellen Chat oder
`/codex threads [filter]` für aktuelle Threads des Codex-App-Servers abrufen und
dann denselben `codex resume`-Befehl in Ihrer Shell ausführen.

Die Befehlsoberfläche erfordert Codex-App-Server `0.125.0` oder neuer. Einzelne
Kontrollmethoden werden als `unsupported by this Codex app-server` gemeldet,
wenn ein zukünftiger oder benutzerdefinierter App-Server diese JSON-RPC-Methode
nicht bereitstellt.

## Hook-Grenzen

Der Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Owner                    | Zweck                                                               |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Codex-App-Server-Erweiterungsmiddleware | Mit OpenClaw gebündelte Plugins | Adapterverhalten pro Durchlauf rund um dynamische OpenClaw-Tools.   |
| Native Codex-Hooks                    | Codex                    | Low-Level-Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien,
um OpenClaw-Plugin-Verhalten zu routen. Für die unterstützte native Tool- und
Berechtigungsbrücke injiziert OpenClaw pro Thread Codex-Konfiguration für
`PreToolUse`, `PostToolUse`, `PermissionRequest` und `Stop`. Wenn
Codex-App-Server-Genehmigungen aktiviert sind (`approvalPolicy` ist nicht
`"never"`), lässt die standardmäßig injizierte native Hook-Konfiguration
`PermissionRequest` aus, damit der Codex-App-Server-Reviewer und die
Genehmigungsbrücke von OpenClaw echte Eskalationen nach der Review behandeln.
Betreiber können `permission_request` weiterhin explizit zu
`nativeHookRelay.events` hinzufügen, wenn sie die Kompatibilitätsweiterleitung
benötigen. Andere Codex-Hooks wie `SessionStart` und `UserPromptSubmit` bleiben
Kontrollen auf Codex-Ebene; sie werden im v1-Vertrag nicht als
OpenClaw-Plugin-Hooks offengelegt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den
Aufruf angefordert hat. Daher löst OpenClaw das Plugin- und Middleware-Verhalten,
das es besitzt, im Harness-Adapter aus. Für Codex-native Tools besitzt Codex den
kanonischen Tool-Datensatz. OpenClaw kann ausgewählte Ereignisse spiegeln, aber
den nativen Codex-Thread nicht umschreiben, es sei denn, Codex stellt diese
Operation über den App-Server oder native Hook-Callbacks bereit.

Compaction- und LLM-Lebenszyklusprojektionen stammen aus Benachrichtigungen des
Codex-App-Servers und dem OpenClaw-Adapterzustand, nicht aus nativen
Codex-Hook-Befehlen. Die OpenClaw-Ereignisse `before_compaction`,
`after_compaction`, `llm_input` und `llm_output` sind Beobachtungen auf
Adapterebene, keine Byte-für-Byte-Erfassungen der internen Anfrage- oder
Compaction-Payloads von Codex.

Native Codex-App-Server-Benachrichtigungen `hook/started` und `hook/completed`
werden als Agent-Ereignisse `codex_app_server.hook` für Trajektorie und
Debugging projiziert. Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Supportvertrag

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex
besitzt mehr vom nativen Modell-Loop, und OpenClaw passt seine Plugin- und
Sitzungsoberflächen an diese Grenze an.

Unterstützt in Codex Runtime v1:

| Oberfläche                                   | Unterstützung                                                                      | Warum                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modell-Loop über Codex                 | Unterstützt                                                                         | Der Codex App-Server besitzt den OpenAI-Turn, die native Thread-Wiederaufnahme und die native Tool-Fortsetzung.                                                                                                      |
| OpenClaw-Kanalrouting und -Zustellung         | Unterstützt                                                                         | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modelllaufzeitumgebung.                                                                                                         |
| Dynamische OpenClaw-Tools                     | Unterstützt                                                                         | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                                      |
| Prompt- und Kontext-Plugins                   | Unterstützt                                                                         | OpenClaw erstellt Prompt-Overlays und projiziert Kontext in den Codex-Turn, bevor der Thread gestartet oder wiederaufgenommen wird.                                                                                   |
| Lebenszyklus der Kontext-Engine               | Unterstützt                                                                         | Zusammenstellung, Aufnahme oder Wartung nach dem Turn sowie die Koordination der Kontext-Engine-Compaction laufen für Codex-Turns.                                                                                   |
| Dynamische Tool-Hooks                         | Unterstützt                                                                         | `before_tool_call`, `after_tool_call` und Tool-Ergebnis-Middleware laufen um dynamische Tools, die OpenClaw gehören.                                                                                                 |
| Lebenszyklus-Hooks                            | Als Adapter-Beobachtungen unterstützt                                                | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Codex-Modus-Payloads ausgelöst.                                                                               |
| Gate für die Überarbeitung der finalen Antwort | Über das native Hook-Relay unterstützt                                               | Codex `Stop` wird an `before_agent_finalize` weitergeleitet; `revise` fordert Codex vor der Finalisierung zu einem weiteren Modelldurchlauf auf.                                                                     |
| Native Shell-, Patch- und MCP-Blockierung oder -Beobachtung | Über das native Hook-Relay unterstützt                                               | Codex `PreToolUse` und `PostToolUse` werden für zugesagte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Payloads auf Codex App-Server `0.125.0` oder neuer. Blockieren wird unterstützt; Argumentumschreibung nicht. |
| Native Berechtigungsrichtlinie                | Über Codex App-Server-Genehmigungen und das native Kompatibilitäts-Hook-Relay unterstützt | Codex App-Server-Genehmigungsanforderungen werden nach der Codex-Prüfung durch OpenClaw geleitet. Das native Hook-Relay `PermissionRequest` ist für native Genehmigungsmodi opt-in, weil Codex es vor der Guardian-Prüfung ausgibt. |
| App-Server-Trajektorienerfassung              | Unterstützt                                                                         | OpenClaw zeichnet die Anfrage auf, die es an den App-Server gesendet hat, sowie die App-Server-Benachrichtigungen, die es empfängt.                                                                                  |

Nicht unterstützt in Codex-Laufzeitumgebung v1:

| Oberfläche                                           | V1-Grenze                                                                                                                                       | Zukünftiger Pfad                                                                         |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Native Mutation von Tool-Argumenten                 | Native Codex-Pre-Tool-Hooks können blockieren, aber OpenClaw schreibt Codex-native Tool-Argumente nicht um.                                     | Erfordert Codex-Hook-/Schema-Unterstützung für ersetzende Tool-Eingaben.                 |
| Bearbeitbarer Codex-nativer Transkriptverlauf       | Codex besitzt den kanonischen nativen Thread-Verlauf. OpenClaw besitzt eine Spiegelung und kann zukünftigen Kontext projizieren, sollte aber keine nicht unterstützten Interna mutieren. | Fügen Sie explizite Codex App-Server-APIs hinzu, falls native Thread-Chirurgie benötigt wird. |
| `tool_result_persist` für Codex-native Tool-Datensätze | Dieser Hook transformiert Transkript-Schreibvorgänge, die OpenClaw gehören, nicht Codex-native Tool-Datensätze.                                  | Transformierte Datensätze könnten gespiegelt werden, aber kanonisches Umschreiben benötigt Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten            | OpenClaw beobachtet Beginn und Abschluss der Compaction, erhält aber keine stabile Liste beibehaltener/verworfener Elemente, kein Token-Delta und keinen Zusammenfassungs-Payload. | Benötigt reichhaltigere Codex-Compaction-Ereignisse.                                     |
| Compaction-Eingriff                                 | Aktuelle OpenClaw-Compaction-Hooks haben im Codex-Modus Benachrichtigungsniveau.                                                                | Fügen Sie Codex-Pre-/Post-Compaction-Hooks hinzu, wenn Plugins native Compaction per Veto verhindern oder umschreiben müssen. |
| Bytegenaue Erfassung der Modell-API-Anfrage         | OpenClaw kann App-Server-Anfragen und -Benachrichtigungen erfassen, aber Codex Core erstellt die finale OpenAI-API-Anfrage intern.               | Benötigt ein Codex-Modellanfrage-Tracing-Ereignis oder eine Debug-API.                    |

## Tools, Medien und Compaction

Das Codex-Harness ändert nur den Low-Level-Executor des eingebetteten Agents.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools
laufen weiter über den normalen OpenClaw-Zustellungspfad.

Das native Hook-Relay ist absichtlich generisch, aber der v1-Supportvertrag ist
auf die Codex-nativen Tool- und Berechtigungspfade beschränkt, die OpenClaw testet. In
der Codex-Laufzeitumgebung umfasst dies Shell-, Patch- und MCP-`PreToolUse`-,
`PostToolUse`- und `PermissionRequest`-Payloads. Gehen Sie nicht davon aus, dass jedes zukünftige
Codex-Hook-Ereignis eine OpenClaw-Plugin-Oberfläche ist, bis der Laufzeitvertrag es
benennt.

Für `PermissionRequest` gibt OpenClaw nur dann explizite Erlauben- oder Ablehnen-Entscheidungen
zurück, wenn die Richtlinie entscheidet. Ein Ergebnis ohne Entscheidung ist keine Erlaubnis. Codex behandelt es als
keine Hook-Entscheidung und fällt auf seinen eigenen Guardian- oder Benutzer-Genehmigungspfad zurück.
Codex App-Server-Genehmigungsmodi lassen diesen nativen Hook standardmäßig aus; dieser Absatz
gilt, wenn `permission_request` explizit in
`nativeHookRelay.events` enthalten ist oder eine Kompatibilitätslaufzeit ihn installiert.
Wenn ein Operator `allow-always` für eine Codex-native Berechtigungsanforderung auswählt,
merkt sich OpenClaw diesen exakten Provider-/Sitzungs-/Tool-Eingabe-/cwd-Fingerabdruck für ein
begrenztes Sitzungsfenster. Die gemerkte Entscheidung ist absichtlich nur ein exakter Treffer:
Ein geänderter Befehl, geänderte Argumente, ein geänderter Tool-Payload oder ein geändertes cwd erzeugt eine neue
Genehmigung.

Codex-MCP-Tool-Genehmigungsaufforderungen werden durch den OpenClaw-Plugin-
Genehmigungsfluss geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden an den
ursprünglichen Chat zurückgesendet, und die nächste eingereihte Folgenachricht beantwortet diese native
Serveranforderung, anstatt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Aufforderungs-
anforderungen schlagen weiterhin geschlossen fehl.

Die Steuerung der aktiven Run-Warteschlange wird auf Codex App-Server `turn/steer` abgebildet. Mit dem
Standard `messages.queue.mode: "steer"` bündelt OpenClaw eingereihte Chatnachrichten
für das konfigurierte Ruhefenster und sendet sie in Eingangsreihenfolge als eine `turn/steer`-Anfrage.
Der Legacy-Modus `queue` sendet separate `turn/steer`-Anfragen. Codex-
Prüfung und manuelle Compaction-Turns können Same-Turn-Steering ablehnen; in diesem Fall
verwendet OpenClaw die Follow-up-Warteschlange, wenn der ausgewählte Modus Fallback erlaubt. Siehe
[Steering-Warteschlange](/de/concepts/queue-steering).

Wenn das ausgewählte Modell das Codex-Harness verwendet, wird native Thread-Compaction an
Codex App-Server delegiert. OpenClaw behält eine Transkriptspiegelung für Kanalverlauf,
Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Wechsel. Die
Spiegelung enthält den Benutzer-Prompt, den finalen Assistant-Text und schlanke Codex-
Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. Derzeit zeichnet OpenClaw nur
native Signale für Beginn und Abschluss der Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Zusammenfassung oder eine prüfbare Liste bereit, welche Einträge Codex
nach der Compaction behalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist`
derzeit keine Codex-nativen Tool-Ergebnisdatensätze um. Es greift nur, wenn
OpenClaw ein Tool-Ergebnis in ein Transkript einer OpenClaw-eigenen Sitzung schreibt.

Mediengenerierung erfordert kein PI. Bild, Video, Musik, PDF, TTS und Medien-
Verständnis verwenden weiterhin die passenden Provider-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist bei
neuen Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Modell mit
`agentRuntime.id: "codex"` (oder eine Legacy-`codex/*`-Referenz), aktivieren Sie
`plugins.entries.codex.enabled`, und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** `agentRuntime.id: "auto"` kann PI weiterhin als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Run beansprucht. Setzen Sie
`agentRuntime.id: "codex"`, um die Codex-Auswahl beim Testen zu erzwingen. Eine
erzwungene Codex-Laufzeitumgebung schlägt fehl, statt auf PI zurückzufallen. Sobald Codex App-Server
ausgewählt ist, treten dessen Fehler direkt zutage.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, sodass der App-Server-Handshake
Version `0.125.0` oder neuer meldet. Prereleases derselben Version oder Versionen mit Build-Suffix
wie `0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil die
stabile Protokolluntergrenze `0.125.0` das ist, was OpenClaw testet.

**Modellerkennung ist langsam:** Senken Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und ob der Remote-App-Server dieselbe Codex App-Server-Protokollversion spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist erwartet, sofern Sie nicht
`agentRuntime.id: "codex"` für diesen Agent erzwungen oder eine Legacy-
`codex/*`-Referenz ausgewählt haben. Einfache `openai/gpt-*`- und andere Provider-Referenzen bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad. Wenn Sie `agentRuntime.id: "codex"` erzwingen, muss jeder eingebettete
Turn für diesen Agent ein von Codex unterstütztes OpenAI-Modell sein.

**Computer Use ist installiert, aber Tools werden nicht ausgeführt:** Prüfen Sie
`/codex computer-use status` in einer neuen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; wenn das Problem bestehen bleibt, starten Sie
den Gateway neu, um veraltete native Hook-Registrierungen zu entfernen. Wenn bei `computer-use.list_apps`
ein Timeout auftritt, starten Sie Codex Computer Use oder Codex Desktop neu und versuchen Sie es erneut.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin-Hooks](/de/plugins/hooks)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
