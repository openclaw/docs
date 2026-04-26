---
read_when:
    - Sie möchten das mitgelieferte Codex-App-Server-Harness verwenden
    - Sie benötigen Konfigurationsbeispiele für Codex harness
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, statt auf PI zurückzufallen
summary: OpenClaw eingebettete Agent-Durchläufe über das mitgelieferte Codex-App-Server-Harness ausführen
title: Codex harness
x-i18n:
    generated_at: "2026-04-26T11:34:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf54ee2eab64e611e50605e8fef24cc840b3246d0bddc18ae03730a05848e271
    source_path: plugins/codex-harness.md
    workflow: 15
---

Das mitgelieferte Plugin `codex` ermöglicht OpenClaw, eingebettete Agent-Durchläufe über den
Codex-App-Server statt über das integrierte PI-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung besitzen soll: Modell-
Erkennung, natives Fortsetzen von Threads, native Compaction und Ausführung über den App-Server.
OpenClaw besitzt weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl, Tools,
Genehmigungen, Medienzustellung und den sichtbaren Spiegel des Transkripts.

Wenn Sie sich erst orientieren möchten, beginnen Sie mit
[Agent runtimes](/de/concepts/agent-runtimes). Die Kurzversion ist:
`openai/gpt-5.5` ist die Modell-Ref, `codex` ist die Laufzeitumgebung und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Was dieses Plugin ändert

Das mitgelieferte Plugin `codex` trägt mehrere getrennte Fähigkeiten bei:

| Fähigkeit                        | Nutzung                                             | Funktion                                                                      |
| -------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Native eingebettete Laufzeitumgebung | `agentRuntime.id: "codex"`                      | Führt eingebettete Agent-Durchläufe von OpenClaw über den Codex-App-Server aus. |
| Native Befehle zur Chat-Steuerung | `/codex bind`, `/codex resume`, `/codex steer`, ... | Bindet und steuert Threads des Codex-App-Servers aus einer Nachrichtenkonversation. |
| Provider/Katalog des Codex-App-Servers | `codex`-Interna, über das Harness bereitgestellt | Ermöglicht der Laufzeitumgebung, Modelle des App-Servers zu erkennen und zu validieren. |
| Medienverständnis-Pfad von Codex | `codex/*`-Kompatibilitätspfade für Bildmodelle     | Führt begrenzte Codex-App-Server-Durchläufe für unterstützte Modelle zum Bildverständnis aus. |
| Native Hook-Weiterleitung        | Plugin-Hooks um Codex-native Ereignisse             | Ermöglicht OpenClaw, unterstützte Codex-native Tool-/Finalisierungsereignisse zu beobachten/zu blockieren. |

Das Aktivieren des Plugins macht diese Fähigkeiten verfügbar. Es bewirkt **nicht**:

- dass Codex für jedes OpenAI-Modell verwendet wird
- dass Modell-Refs `openai-codex/*` in die native Laufzeitumgebung umgewandelt werden
- dass ACP/acpx zum Standardpfad für Codex wird
- dass bestehende Sitzungen, die bereits eine PI-Laufzeit aufgezeichnet haben, live umgeschaltet werden
- dass Kanalzustellung, Sitzungsdateien, Auth-Profile-Speicherung oder
  Nachrichtenrouting von OpenClaw ersetzt werden

Dasselbe Plugin besitzt auch die native Befehlsoberfläche `/codex` zur Chat-Steuerung. Wenn
das Plugin aktiviert ist und der Benutzer Threads von Codex aus dem Chat heraus binden, fortsetzen, steuern, stoppen oder prüfen möchte, sollten Agents
`/codex ...` gegenüber ACP bevorzugen. ACP bleibt der explizite Fallback, wenn der Benutzer ACP/acpx verlangt oder den ACP-
Codex-Adapter testet.

Native Codex-Durchläufe behalten Plugin-Hooks von OpenClaw als öffentliche Kompatibilitätsschicht.
Dabei handelt es sich um In-Process-Hooks von OpenClaw, nicht um Befehls-Hooks `hooks.json` von Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transkript-Einträge
- `before_agent_finalize` über die `Stop`-Weiterleitung von Codex
- `agent_end`

Plugins können außerdem laufzeitneutrale Middleware für Tool-Ergebnisse registrieren, um Ergebnisse dynamischer OpenClaw-Tools umzuschreiben, nachdem OpenClaw das Tool ausgeführt hat und bevor das
Ergebnis an Codex zurückgegeben wird. Das ist getrennt vom öffentlichen
Plugin-Hook `tool_result_persist`, der Tool-Result-Schreibvorgänge in OpenClaw-eigenen Transkripten transformiert.

Zur Semantik der Plugin-Hooks selbst siehe [Plugin hooks](/de/plugins/hooks)
und [Plugin guard behavior](/de/tools/plugin).

Das Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten OpenAI-Modell-Refs
kanonisch als `openai/gpt-*` beibehalten und explizit
`agentRuntime.id: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen, wenn sie
native Ausführung über den App-Server möchten. Ältere Modell-Refs `codex/*` wählen
das Harness aus Kompatibilitätsgründen weiterhin automatisch aus, aber ältere providerpräfixe mit Laufzeitbindung werden
nicht als normale Modell-/Provider-Auswahl angezeigt.

Wenn das Plugin `codex` aktiviert ist, das primäre Modell aber weiterhin
`openai-codex/*` ist, warnt `openclaw doctor`, anstatt die Route zu ändern. Das ist
beabsichtigt: `openai-codex/*` bleibt der PI-Pfad für Codex-OAuth/Subscription, und
native Ausführung über den App-Server bleibt eine explizite Wahl der Laufzeitumgebung.

## Routenübersicht

Verwenden Sie diese Tabelle, bevor Sie die Konfiguration ändern:

| Gewünschtes Verhalten                          | Modell-Ref                 | Laufzeitkonfiguration                    | Plugin-Anforderung          | Erwartete Statusbezeichnung       |
| ---------------------------------------------- | -------------------------- | ---------------------------------------- | --------------------------- | --------------------------------- |
| OpenAI API über normalen OpenClaw-Runner       | `openai/gpt-*`             | weggelassen oder `runtime: "pi"`         | OpenAI-Provider             | `Runtime: OpenClaw Pi Default`    |
| Codex OAuth/Subscription über PI               | `openai-codex/gpt-*`       | weggelassen oder `runtime: "pi"`         | OpenAI Codex OAuth provider | `Runtime: OpenClaw Pi Default`    |
| Native eingebettete Durchläufe über Codex-App-Server | `openai/gpt-*`       | `agentRuntime.id: "codex"`               | Plugin `codex`              | `Runtime: OpenAI Codex`           |
| Gemischte Provider mit konservativem Auto-Modus | provider-spezifische Refs | `agentRuntime.id: "auto"`                | Optionale Plugin-Laufzeiten | Hängt von ausgewählter Laufzeit ab |
| Explizite Sitzung mit Codex ACP adapter        | ACP-Prompt/-Modell abhängig | `sessions_spawn` mit `runtime: "acp"` | gesundes `acpx`-Backend     | ACP-Aufgaben-/Sitzungsstatus      |

Die wichtige Trennung ist Provider versus Laufzeitumgebung:

- `openai-codex/*` beantwortet „welche Provider-/Auth-Route soll PI verwenden?“
- `agentRuntime.id: "codex"` beantwortet „welche Schleife soll diesen
  eingebetteten Durchlauf ausführen?“
- `/codex ...` beantwortet „an welche native Codex-Konversation soll dieser Chat binden
  oder welche soll er steuern?“
- ACP beantwortet „welchen externen Harness-Prozess soll acpx starten?“

## Das richtige Modellpräfix wählen

Routen der OpenAI-Familie sind präfixspezifisch. Verwenden Sie `openai-codex/*`, wenn Sie
Codex OAuth über PI möchten; verwenden Sie `openai/*`, wenn Sie direkten OpenAI-API-Zugriff möchten oder
wenn Sie das native Harness des Codex-App-Servers erzwingen:

| Modell-Ref                                    | Laufzeitpfad                                | Verwenden, wenn                                                           |
| --------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                              | OpenAI-Provider über OpenClaw/PI-Plumbing   | Sie aktuellen direkten OpenAI-Platform-API-Zugriff mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.5`                        | OpenAI Codex OAuth über OpenClaw/PI         | Sie Auth mit ChatGPT/Codex-Subscription beim Standard-PI-Runner möchten. |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"` | Harness des Codex-App-Servers               | Sie native Ausführung über den Codex-App-Server für den eingebetteten Agent-Durchlauf möchten. |

GPT-5.5 ist derzeit in OpenClaw nur per Subscription/OAuth verfügbar. Verwenden Sie
`openai-codex/gpt-5.5` für PI OAuth oder `openai/gpt-5.5` mit dem
Harness des Codex-App-Servers. Direkter Zugriff per API-Schlüssel auf `openai/gpt-5.5` wird unterstützt,
sobald OpenAI GPT-5.5 auf der öffentlichen API aktiviert.

Ältere Refs `codex/gpt-*` bleiben als Kompatibilitäts-Aliasse akzeptiert. Die
Kompatibilitätsmigration von Doctor schreibt ältere primäre Laufzeit-Refs in kanonische Modell-
Refs um und speichert die Laufzeitrichtlinie separat, während ältere Refs nur für Fallbacks unverändert bleiben, weil die Laufzeit für den gesamten Agent-Container konfiguriert wird.
Neue Konfigurationen für PI Codex OAuth sollten `openai-codex/gpt-*` verwenden; neue Konfigurationen für das native
Harness des App-Servers sollten `openai/gpt-*` plus
`agentRuntime.id: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Aufteilung nach Präfixen. Verwenden Sie
`openai-codex/gpt-*`, wenn Bildverständnis über den Provider-Pfad von OpenAI
Codex OAuth laufen soll. Verwenden Sie `codex/gpt-*`, wenn Bildverständnis über
einen begrenzten Durchlauf des Codex-App-Servers laufen soll. Das Modell des Codex-App-Servers muss
Unterstützung für Bildeingaben bewerben; reine Textmodelle von Codex schlagen fehl, bevor der Mediendurchlauf
beginnt.

Verwenden Sie `/status`, um das effektive Harness für die aktuelle Sitzung zu bestätigen. Wenn die
Auswahl überraschend ist, aktivieren Sie Debug-Logging für das Subsystem `agents/harness`
und prüfen Sie den strukturierten Eintrag `agent harness selected` des Gateway. Er
enthält die ID des ausgewählten Harness, den Grund für die Auswahl, die Richtlinie für Laufzeit/Fallback und
im Modus `auto` das Support-Ergebnis jedes Plugin-Kandidaten.

### Bedeutung der Doctor-Warnungen

`openclaw doctor` warnt, wenn alle folgenden Bedingungen zutreffen:

- das mitgelieferte Plugin `codex` ist aktiviert oder erlaubt
- das primäre Modell eines Agent ist `openai-codex/*`
- die effektive Laufzeitumgebung dieses Agent ist nicht `codex`

Diese Warnung existiert, weil Benutzer oft erwarten, dass „Codex-Plugin aktiviert“
impliziert, dass die „native Laufzeit des Codex-App-Servers“ verwendet wird. OpenClaw geht diesen Schritt nicht. Die Warnung bedeutet:

- **Es ist keine Änderung erforderlich**, wenn Sie ChatGPT/Codex OAuth über PI beabsichtigt haben.
- Ändern Sie das Modell zu `openai/<model>` und setzen Sie
  `agentRuntime.id: "codex"`, wenn Sie die native Ausführung über den App-Server
  beabsichtigt haben.
- Bestehende Sitzungen benötigen nach einer Änderung der Laufzeit weiterhin `/new` oder `/reset`,
  weil Laufzeit-Pins pro Sitzung sticky sind.

Die Auswahl des Harness ist keine Steuerung für Live-Sitzungen. Wenn ein eingebetteter Durchlauf läuft,
zeichnet OpenClaw die ID des ausgewählten Harness für diese Sitzung auf und verwendet
sie auch für spätere Durchläufe mit derselben Sitzungs-ID weiter. Ändern Sie die Konfiguration von `agentRuntime` oder
`OPENCLAW_AGENT_RUNTIME`, wenn zukünftige Sitzungen ein anderes Harness verwenden sollen;
verwenden Sie `/new` oder `/reset`, um eine frische Sitzung zu starten, bevor Sie eine bestehende
Konversation zwischen PI und Codex umschalten. Das vermeidet, dass ein Transkript
durch zwei inkompatible native Sitzungssysteme erneut abgespielt wird.

Ältere Sitzungen, die vor Laufzeit-Pins erstellt wurden, werden als an PI gepinnt behandelt, sobald sie
Transkriptverlauf haben. Verwenden Sie `/new` oder `/reset`, um diese Konversation nach einer Konfigurationsänderung für Codex zu aktivieren.

`/status` zeigt die effektive Modell-Laufzeit an. Das Standard-PI-Harness erscheint als
`Runtime: OpenClaw Pi Default`, und das Harness des Codex-App-Servers erscheint als
`Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit verfügbarem mitgeliefertem Plugin `codex`.
- Codex-App-Server `0.125.0` oder neuer. Das mitgelieferte Plugin verwaltet standardmäßig ein kompatibles
  Binary des Codex-App-Servers, sodass lokale `codex`-Befehle auf `PATH` den normalen Start des Harness nicht beeinflussen.
- Für den Prozess des App-Servers verfügbare Codex-Auth.

Das Plugin blockiert ältere oder versionslose Handshakes des App-Servers. Das hält
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests kommt Auth in der Regel aus `OPENAI_API_KEY` sowie
optional aus Codex-CLI-Dateien wie `~/.codex/auth.json` und
`~/.codex/config.toml`. Verwenden Sie dasselbe Auth-Material, das Ihr lokaler Codex-App-Server
verwendet.

## Minimale Konfiguration

Verwenden Sie `openai/gpt-5.5`, aktivieren Sie das mitgelieferte Plugin und erzwingen Sie das
Harness `codex`:

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

Ältere Konfigurationen, die `agents.defaults.model` oder ein Agent-Modell auf
`codex/<model>` setzen, aktivieren das mitgelieferte Plugin `codex` weiterhin automatisch. Neue Konfigurationen sollten
`openai/<model>` plus den expliziten Eintrag `agentRuntime` oben bevorzugen.

## Codex neben anderen Modellen hinzufügen

Setzen Sie `agentRuntime.id: "codex"` nicht global, wenn derselbe Agent frei zwischen
Codex- und Nicht-Codex-Provider-Modellen wechseln können soll. Eine erzwungene Laufzeit gilt für jeden
eingebetteten Durchlauf dieses Agent oder dieser Sitzung. Wenn Sie ein Anthropic-Modell auswählen, während
diese Laufzeit erzwungen ist, versucht OpenClaw weiterhin das Codex-Harness und schlägt fail-closed fehl,
statt diesen Durchlauf stillschweigend über PI zu routen.

Verwenden Sie stattdessen eine dieser Formen:

- Legen Sie Codex auf einen dedizierten Agent mit `agentRuntime.id: "codex"`.
- Belassen Sie den Standard-Agent auf `agentRuntime.id: "auto"` und PI-Fallback für normale gemischte
  Provider-Nutzung.
- Verwenden Sie ältere Refs `codex/*` nur aus Kompatibilitätsgründen. Neue Konfigurationen sollten
  `openai/*` plus eine explizite Codex-Laufzeitrichtlinie bevorzugen.

Zum Beispiel behält dies den Standard-Agent bei normaler automatischer Auswahl und
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
        fallback: "pi",
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
- Der Agent `codex` verwendet das Harness des Codex-App-Servers.
- Wenn Codex für den Agent `codex` fehlt oder nicht unterstützt wird, schlägt der Durchlauf
  fehl, statt stillschweigend PI zu verwenden.

## Routing von Agent-Befehlen

Agents sollten Benutzeranfragen nach Absicht routen, nicht allein nach dem Wort „Codex“:

| Benutzer fragt nach...                                    | Agent sollte verwenden...                         |
| --------------------------------------------------------- | ------------------------------------------------ |
| „Diesen Chat an Codex binden“                             | `/codex bind`                                    |
| „Codex-Thread `<id>` hier fortsetzen“                     | `/codex resume <id>`                             |
| „Codex-Threads anzeigen“                                  | `/codex threads`                                 |
| „Codex als Laufzeit für diesen Agent verwenden“           | Konfigurationsänderung für `agentRuntime.id`     |
| „Meine ChatGPT/Codex subscription mit normalem OpenClaw verwenden“ | Modell-Refs `openai-codex/*`          |
| „Codex über ACP/acpx ausführen“                           | ACP `sessions_spawn({ runtime: "acp", ... })`    |
| „Claude Code/Gemini/OpenCode/Cursor in einem Thread starten“ | ACP/acpx, nicht `/codex` und keine nativen Sub-Agents |

OpenClaw zeigt Agents Hinweise zum ACP-Start nur dann an, wenn ACP aktiviert,
dispatchbar und durch ein geladenes Laufzeit-Backend unterstützt ist. Wenn ACP nicht verfügbar ist,
sollten der System-Prompt und Plugin-Skills dem Agent nichts über ACP-
Routing beibringen.

## Reine Codex-Bereitstellungen

Erzwingen Sie das Codex-Harness, wenn Sie nachweisen müssen, dass jeder eingebettete Agent-Durchlauf
Codex verwendet. Explizite Plugin-Laufzeiten verwenden standardmäßig keinen PI-Fallback, daher ist
`fallback: "none"` optional, aber oft als Dokumentation nützlich:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

Überschreibung per Umgebungsvariable:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Wenn Codex erzwungen ist, schlägt OpenClaw früh fehl, wenn das Plugin Codex deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht gestartet werden kann. Setzen Sie
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` nur, wenn Sie absichtlich möchten, dass PI die
fehlende Auswahl des Harness übernimmt.

## Codex pro Agent

Sie können einen Agent nur für Codex konfigurieren, während der Standard-Agent normale
Auto-Auswahl beibehält:

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
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
          fallback: "none",
        },
      },
    ],
  },
}
```

Verwenden Sie normale Sitzungsbefehle, um Agents und Modelle zu wechseln. `/new` erstellt eine frische
OpenClaw-Sitzung und das Codex-Harness erstellt oder setzt bei Bedarf seinen Sidecar-App-Server-
Thread fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread
und lässt den nächsten Durchlauf das Harness erneut aus der aktuellen Konfiguration auflösen.

## Modellerkennung

Standardmäßig fragt das Plugin Codex den App-Server nach verfügbaren Modellen. Wenn
die Erkennung fehlschlägt oder ein Timeout erreicht, verwendet es einen mitgelieferten Fallback-Katalog für:

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

Deaktivieren Sie die Erkennung, wenn der Start Codex nicht prüfen soll und stattdessen der
Fallback-Katalog verwendet werden soll:

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

## Verbindung und Richtlinie des App-Servers

Standardmäßig startet das Plugin das verwaltete lokale Codex-Binary von OpenClaw mit:

```bash
codex app-server --listen stdio://
```

Das verwaltete Binary ist als mitgelieferte Laufzeitabhängigkeit des Plugins deklariert und wird
zusammen mit den übrigen Abhängigkeiten des Plugins `codex` bereitgestellt. Dadurch bleibt die Version des App-Servers
an das mitgelieferte Plugin gebunden statt an eine beliebige separat lokal installierte Codex CLI.
Setzen Sie `appServer.command` nur dann, wenn Sie absichtlich ein anderes ausführbares Programm verwenden möchten.

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Das ist die vertrauenswürdige lokale Operator-Haltung für
autonome Heartbeats: Codex kann Shell- und Netzwerk-Tools verwenden, ohne bei nativen
Genehmigungsaufforderungen anzuhalten, die niemand beantworten würde.

Um Guardian-geprüfte Genehmigungen von Codex zu aktivieren, setzen Sie `appServer.mode:
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

Der Guardian-Modus verwendet den nativen Auto-Review-Genehmigungspfad von Codex. Wenn Codex die
Sandbox verlassen, außerhalb des Workspace schreiben oder Berechtigungen wie Netzwerk-
Zugriff hinzufügen möchte, leitet Codex diese Genehmigungsanfrage an den nativen Reviewer statt an eine
menschliche Aufforderung weiter. Der Reviewer wendet das Risikoframework von Codex an und genehmigt oder verweigert die spezifische Anfrage. Verwenden Sie Guardian, wenn Sie mehr Leitplanken als im YOLO-Modus möchten,
aber dennoch unbeaufsichtigte Agents vorankommen sollen.

Das Preset `guardian` wird erweitert zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"`.
Einzelne Richtlinienfelder überschreiben weiterhin `mode`, sodass fortgeschrittene Bereitstellungen
das Preset mit expliziten Auswahlwerten kombinieren können. Der ältere Reviewer-Wert `guardian_subagent` wird
weiterhin als Kompatibilitätsalias akzeptiert, aber neue Konfigurationen sollten
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

Unterstützte Felder für `appServer`:

| Feld                | Standard                                  | Bedeutung                                                                                                      |
| ------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                 | `"stdio"` startet Codex; `"websocket"` verbindet mit `url`.                                                   |
| `command`           | verwaltetes Codex-Binary                  | Ausführbares Programm für stdio-Transport. Nicht setzen, um das verwaltete Binary zu verwenden; nur für eine explizite Überschreibung setzen. |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Argumente für stdio-Transport.                                                                                 |
| `url`               | nicht gesetzt                             | WebSocket-URL des App-Servers.                                                                                 |
| `authToken`         | nicht gesetzt                             | Bearer-Token für WebSocket-Transport.                                                                          |
| `headers`           | `{}`                                      | Zusätzliche WebSocket-Header.                                                                                  |
| `requestTimeoutMs`  | `60000`                                   | Timeout für Control-Plane-Aufrufe an den App-Server.                                                          |
| `mode`              | `"yolo"`                                  | Preset für YOLO- oder Guardian-geprüfte Ausführung.                                                            |
| `approvalPolicy`    | `"never"`                                 | Native Codex-Genehmigungsrichtlinie, die an Start/Fortsetzen/Durchlauf von Threads gesendet wird.            |
| `sandbox`           | `"danger-full-access"`                    | Nativer Codex-Sandbox-Modus, der an Start/Fortsetzen gesendet wird.                                            |
| `approvalsReviewer` | `"user"`                                  | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft. `guardian_subagent` bleibt ein älterer Alias. |
| `serviceTier`       | nicht gesetzt                             | Optionale Service-Stufe des Codex-App-Servers: `"fast"`, `"flex"` oder `null`. Ungültige ältere Werte werden ignoriert. |

Überschreibungen per Umgebungsvariable bleiben für lokale Tests verfügbar:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` umgeht das verwaltete Binary, wenn
`appServer.command` nicht gesetzt ist.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie
stattdessen `plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration wird
für reproduzierbare Bereitstellungen bevorzugt, weil das Verhalten des Plugins damit in derselben geprüften Datei wie der Rest des Setups des Codex-Harness verbleibt.

## Häufige Rezepte

Lokales Codex mit Standard-stdio-Transport:

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

Validierung nur des Codex-Harness:

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

Die Modellumschaltung bleibt unter der Kontrolle von OpenClaw. Wenn eine OpenClaw-Sitzung an einen bestehenden Codex-Thread angehängt ist, sendet der nächste Durchlauf das aktuell ausgewählte
OpenAI-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und die Service-Stufe erneut an den
App-Server. Beim Wechsel von `openai/gpt-5.5` zu `openai/gpt-5.2` bleibt die
Thread-Bindung erhalten, aber Codex wird aufgefordert, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das mitgelieferte Plugin registriert `/codex` als autorisierten Slash-Befehl. Es ist
generisch und funktioniert auf jedem Kanal, der Textbefehle von OpenClaw unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-Konnektivität zum App-Server, Modelle, Konto, Ratenlimits, MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex-App-Servers auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen bestehenden Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu komprimieren.
- `/codex review` startet die native Codex-Prüfung für den angehängten Thread.
- `/codex account` zeigt Konto- und Ratenlimitstatus.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet Skills des Codex-App-Servers auf.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die das Harness für
normale Durchläufe verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-Modell an den App-Server und hält den erweiterten Verlauf
aktiviert.

Die Befehlsoberfläche erfordert Codex-App-Server `0.125.0` oder neuer. Einzelne
Steuermethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder benutzerdefinierter App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Das Codex-Harness hat drei Hook-Ebenen:

| Ebene                                | Besitzer                 | Zweck                                                               |
| ------------------------------------ | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                | OpenClaw                 | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg. |
| Erweiterungs-Middleware des Codex-App-Servers | Mitgelieferte Plugins von OpenClaw | Verhalten des Adapters pro Durchlauf um dynamische OpenClaw-Tools. |
| Codex-native Hooks                   | Codex                    | Low-Level-Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektweiten oder globalen `hooks.json`-Dateien von Codex, um
Plugin-Verhalten von OpenClaw zu routen. Für die unterstützte Bridge für native Tools und Berechtigungen
injiziert OpenClaw Codex-Konfiguration pro Thread für `PreToolUse`, `PostToolUse`,
`PermissionRequest` und `Stop`. Andere Codex-Hooks wie `SessionStart` und
`UserPromptSubmit` bleiben Steuerelemente auf Codex-Ebene; sie werden im v1-Vertrag
nicht als OpenClaw-Plugin-Hooks bereitgestellt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den
Aufruf angefordert hat, sodass OpenClaw im
Harness-Adapter das Plugin- und Middleware-Verhalten ausführt, das es besitzt. Für Codex-native Tools besitzt Codex den kanonischen Tool-Eintrag.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber den nativen Codex-
Thread nicht umschreiben, es sei denn, Codex stellt diese Operation über App-Server oder native Hook-
Callbacks bereit.

Projektionen des Compaction- und LLM-Lebenszyklus stammen aus Benachrichtigungen des Codex-App-Servers
und dem Adapterzustand von OpenClaw, nicht aus nativen Hook-Befehlen von Codex.
Die Ereignisse `before_compaction`, `after_compaction`, `llm_input` und
`llm_output` von OpenClaw sind Beobachtungen auf Adapter-Ebene, keine Byte-für-Byte-Erfassungen
der internen Request- oder Compaction-Nutzlasten von Codex.

Native Benachrichtigungen `hook/started` und `hook/completed` des Codex-App-Servers werden
als Agent-Ereignisse `codex_app_server.hook` für Ablaufverfolgung und Debugging projiziert.
Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Support-Vertrag

Der Codex-Modus ist nicht PI mit einem anderen Modellaufruf darunter. Codex besitzt mehr von
der nativen Modellschleife, und OpenClaw passt seine Plugin- und Sitzungsoberflächen
an diese Grenze an.

Unterstützt in Codex runtime v1:

| Oberfläche                                    | Unterstützung                            | Warum                                                                                                                                                                                                     |
| --------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex              | Unterstützt                              | Der Codex-App-Server besitzt den OpenAI-Durchlauf, natives Fortsetzen von Threads und native Tool-Fortsetzung.                                                                                          |
| Kanal-Routing und Zustellung von OpenClaw     | Unterstützt                              | Telegram, Discord, Slack, WhatsApp, iMessage und andere Kanäle bleiben außerhalb der Modell-Laufzeitumgebung.                                                                                           |
| Dynamische OpenClaw-Tools                     | Unterstützt                              | Codex fordert OpenClaw auf, diese Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.                                                                                                          |
| Prompt- und Kontext-Plugins                   | Unterstützt                              | OpenClaw baut Prompt-Overlays auf und projiziert Kontext in den Codex-Durchlauf, bevor der Thread gestartet oder fortgesetzt wird.                                                                      |
| Lebenszyklus der Kontext-Engine               | Unterstützt                              | Assemble, Ingest bzw. After-Turn-Wartung und Koordination der Compaction der Kontext-Engine laufen auch für Codex-Durchläufe.                                                                           |
| Dynamische Tool-Hooks                         | Unterstützt                              | `before_tool_call`, `after_tool_call` und Middleware für Tool-Ergebnisse laufen um dynamische OpenClaw-Tools.                                                                                            |
| Lebenszyklus-Hooks                            | Unterstützt als Beobachtungen des Adapters | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` werden mit ehrlichen Nutzlasten im Codex-Modus ausgelöst.                                                          |
| Gate für die Überarbeitung finaler Antworten  | Unterstützt über die native Hook-Weiterleitung | `Stop` von Codex wird an `before_agent_finalize` weitergeleitet; `revise` fordert einen weiteren Modell-Durchlauf von Codex vor der Finalisierung an.                                                |
| Native Shell-, Patch- und MCP-Blockierung/-Beobachtung | Unterstützt über die native Hook-Weiterleitung | `PreToolUse` und `PostToolUse` von Codex werden für fest zugesicherte native Tool-Oberflächen weitergeleitet, einschließlich MCP-Nutzlasten auf Codex-App-Server `0.125.0` oder neuer. Blockieren wird unterstützt; Umschreiben von Argumenten nicht. |
| Native Berechtigungsrichtlinie                | Unterstützt über die native Hook-Weiterleitung | `PermissionRequest` von Codex kann über OpenClaw-Richtlinie geroutet werden, wo die Laufzeit dies bereitstellt. Wenn OpenClaw keine Entscheidung zurückgibt, setzt Codex seinen normalen Pfad für Guardian- oder Benutzer-Genehmigung fort. |
| Trajectory Capture des App-Servers            | Unterstützt                              | OpenClaw zeichnet die Anfrage auf, die es an den App-Server gesendet hat, und die Benachrichtigungen, die es vom App-Server erhält.                                                                     |

Nicht unterstützt in Codex runtime v1:

| Oberfläche                                            | V1-Grenze                                                                                                                                      | Zukünftiger Pfad                                                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                       | Native Pre-Tool-Hooks von Codex können blockieren, aber OpenClaw schreibt Argumente Codex-nativer Tools nicht um.                             | Erfordert Unterstützung von Hook/Schema in Codex für Ersetzung von Tool-Eingaben.      |
| Bearbeitbarer Verlauf Codex-nativer Transkripte       | Codex besitzt den kanonischen Verlauf nativer Threads. OpenClaw besitzt einen Spiegel und kann zukünftigen Kontext projizieren, sollte aber keine nicht unterstützten Interna mutieren. | Explizite APIs des Codex-App-Servers hinzufügen, wenn native Thread-Chirurgie nötig ist. |
| `tool_result_persist` für Codex-native Tool-Einträge  | Dieser Hook transformiert OpenClaw-eigene Transkript-Schreibvorgänge, nicht Einträge Codex-nativer Tools.                                      | Könnte transformierte Einträge spiegeln, aber kanonisches Umschreiben benötigt Codex-Unterstützung. |
| Umfangreiche native Compaction-Metadaten              | OpenClaw beobachtet Start und Abschluss der Compaction, erhält aber keine stabile Liste von behalten/verworfen, kein Token-Delta und keine Summary-Nutzlast. | Benötigt reichhaltigere Compaction-Ereignisse von Codex.                              |
| Eingriff in Compaction                                | Die aktuellen Compaction-Hooks von OpenClaw sind im Codex-Modus auf Benachrichtigungsebene.                                                    | Hooks vor/nach Compaction in Codex hinzufügen, wenn Plugins native Compaction ablehnen oder umschreiben müssen. |
| Byte-für-Byte-Erfassung von Modell-API-Requests       | OpenClaw kann App-Server-Anfragen und Benachrichtigungen erfassen, aber der Codex-Kern baut die finale OpenAI-API-Anfrage intern auf.         | Benötigt ein Tracing-Ereignis für Modell-Requests oder eine Debug-API in Codex.        |

## Tools, Medien und Compaction

Das Codex-Harness ändert nur den Low-Level-Executor für eingebettete Agents.

OpenClaw baut weiterhin die Tool-Liste auf und erhält dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools
laufen weiterhin über den normalen Zustellungspfad von OpenClaw.

Die native Hook-Weiterleitung ist absichtlich generisch, aber der v1-Support-Vertrag ist
auf die nativen Tool- und Berechtigungspfade von Codex begrenzt, die OpenClaw testet. Im
Codex-Runtime umfasst das die Nutzlasten von Shell, Patch und MCP `PreToolUse`,
`PostToolUse` und `PermissionRequest`. Gehen Sie nicht davon aus, dass jedes zukünftige
Hook-Ereignis von Codex eine Plugin-Oberfläche von OpenClaw ist, bis der Laufzeitvertrag
es ausdrücklich benennt.

Für `PermissionRequest` gibt OpenClaw nur dann explizite Allow- oder Deny-Entscheidungen zurück,
wenn die Richtlinie dies entscheidet. Ein Ergebnis ohne Entscheidung ist keine Erlaubnis. Codex behandelt es als fehlende
Hook-Entscheidung und fällt auf seinen eigenen Pfad für Guardian- oder Benutzer-Genehmigung zurück.

Genehmigungsanforderungen für MCP-Tools von Codex werden über den
Plugin-Genehmigungsablauf von OpenClaw geroutet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Prompts `request_user_input` von Codex werden an den
ursprünglichen Chat zurückgesendet, und die nächste eingereihte Folge-Nachricht beantwortet diese native
Server-Anfrage, statt als zusätzlicher Kontext gesteuert zu werden. Andere MCP-Anforderungs-
Anfragen schlagen weiterhin fail-closed fehl.

Wenn das ausgewählte Modell das Codex-Harness verwendet, wird native Thread-Compaction an den
Codex-App-Server delegiert. OpenClaw behält einen Spiegel des Transkripts für Kanal-
Verlauf, Suche, `/new`, `/reset` und zukünftige Wechsel von Modell oder Harness. Der
Spiegel enthält den Benutzer-Prompt, den finalen Assistant-Text und leichtgewichtige Codex-
Reasoning- oder Plan-Einträge, wenn der App-Server diese ausgibt. Aktuell zeichnet OpenClaw nur
native Signale für Start und Abschluss der Compaction auf. Es stellt noch keine
menschenlesbare Zusammenfassung der Compaction oder eine auditierbare Liste bereit, welche Einträge Codex
nach der Compaction behalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist`
derzeit keine Tool-Result-Einträge Codex-nativer Tools um. Es gilt nur dann, wenn
OpenClaw ein Tool-Ergebnis in ein OpenClaw-eigenes Sitzungstranskript schreibt.

Mediengenerierung erfordert kein PI. Bild, Video, Musik, PDF, TTS und Medien-
Verständnis verwenden weiterhin die passenden Provider-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist für
neue Konfigurationen zu erwarten. Wählen Sie ein Modell `openai/gpt-*` mit
`agentRuntime.id: "codex"` (oder eine ältere Ref `codex/*`), aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** `agentRuntime.id: "auto"` kann PI weiterhin als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Lauf beansprucht. Setzen Sie
`agentRuntime.id: "codex"`, um die Auswahl von Codex beim Testen zu erzwingen. Eine
erzwungene Codex-Laufzeit schlägt jetzt fehl, statt auf PI zurückzufallen, sofern Sie
nicht explizit `agentRuntime.fallback: "pi"` setzen. Sobald der Codex-App-Server
ausgewählt ist, werden seine Fehler direkt angezeigt, ohne zusätzliche Fallback-Konfiguration.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, sodass der Handshake des App-Servers
Version `0.125.0` oder neuer meldet. Vorabversionen derselben Version oder Versionen mit Build-Suffix
wie `0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil die stabile
Protokoll-Untergrenze `0.125.0` das ist, womit OpenClaw getestet wird.

**Die Modellerkennung ist langsam:** Verringern Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und dass der Remote-App-Server dieselbe Protokollversion des Codex-App-Servers spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist zu erwarten, sofern Sie nicht
`agentRuntime.id: "codex"` für diesen Agent erzwungen oder eine ältere
Ref `codex/*` ausgewählt haben. Reine Refs `openai/gpt-*` und andere Provider-Refs bleiben im Modus `auto` auf ihrem normalen
Provider-Pfad. Wenn Sie `agentRuntime.id: "codex"` erzwingen, muss jeder eingebettete
Durchlauf für diesen Agent ein von Codex unterstütztes OpenAI-Modell sein.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Agent-Laufzeitumgebungen](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin hooks](/de/plugins/hooks)
- [Configuration reference](/de/gateway/configuration-reference)
- [Testing](/de/help/testing-live#live-codex-app-server-harness-smoke)
