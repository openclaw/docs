---
read_when:
    - Sie möchten das gebündelte Codex-App-Server-Harness verwenden.
    - Sie benötigen Konfigurationsbeispiele für das Codex-Harness.
    - Sie möchten, dass reine Codex-Deployments fehlschlagen, statt auf PI zurückzufallen.
summary: OpenClaw-Embedded-Agent-Turns über das gebündelte Codex-App-Server-Harness ausführen
title: Codex-Harness
x-i18n:
    generated_at: "2026-04-25T13:51:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

Das gebündelte `codex`-Plugin ermöglicht es OpenClaw, eingebettete Agent-Turns über den
Codex-App-Server statt über das integrierte PI-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Agent-Session auf niedriger Ebene verwalten soll: Modell-
Erkennung, natives Thread-Resume, native Compaction und App-Server-Ausführung.
OpenClaw verwaltet weiterhin Chat-Channels, Session-Dateien, Modellauswahl, Tools,
Genehmigungen, Medienzustellung und die sichtbare Spiegelung des Transkripts.

Wenn Sie sich erst orientieren müssen, beginnen Sie mit
[Agent runtimes](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Laufzeit, und Telegram,
Discord, Slack oder ein anderer Channel bleibt die Kommunikationsoberfläche.

Native Codex-Turns behalten OpenClaw-Plugin-Hooks als öffentliche Kompatibilitätsschicht.
Dabei handelt es sich um In-Process-Hooks von OpenClaw, nicht um Codex-`hooks.json`-Befehlshooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` für gespiegelte Transcript-Datensätze
- `agent_end`

Plugins können außerdem laufzeitneutrale Middleware für Tool-Ergebnisse registrieren, um dynamische Tool-Ergebnisse von OpenClaw umzuschreiben, nachdem OpenClaw das Tool ausgeführt hat und bevor das Ergebnis an Codex zurückgegeben wird. Dies ist getrennt vom öffentlichen Plugin-Hook `tool_result_persist`, der von OpenClaw verwaltete Transcript-Schreibvorgänge für Tool-Ergebnisse transformiert.

Für die Semantik der Plugin-Hooks selbst siehe [Plugin hooks](/de/plugins/hooks)
und [Plugin guard behavior](/de/tools/plugin).

Das Harness ist standardmäßig deaktiviert. Neue Konfigurationen sollten OpenAI-Modellreferenzen
kanonisch als `openai/gpt-*` beibehalten und ausdrücklich
`embeddedHarness.runtime: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen, wenn sie
native App-Server-Ausführung möchten. Alte Modellreferenzen `codex/*` wählen das
Harness aus Kompatibilitätsgründen weiterhin automatisch aus, aber von Laufzeiten gestützte alte Anbieterpräfixe werden
nicht als normale Modell-/Anbieterauswahl angezeigt.

## Das richtige Modellpräfix wählen

Routen der OpenAI-Familie sind präfixspezifisch. Verwenden Sie `openai-codex/*`, wenn Sie
Codex OAuth über PI möchten; verwenden Sie `openai/*`, wenn Sie direkten OpenAI-API-Zugriff möchten oder
wenn Sie das native Codex-App-Server-Harness erzwingen:

| Modellreferenz                                       | Laufzeitpfad                                 | Verwenden, wenn                                                             |
| ---------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                     | OpenAI-Anbieter über OpenClaw/PI-Plumbing    | Sie aktuellen direkten OpenAI-Platform-API-Zugriff mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.5`                               | OpenAI Codex OAuth über OpenClaw/PI          | Sie ChatGPT-/Codex-Abonnement-Auth mit dem Standard-PI-Runner möchten.      |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex-App-Server-Harness                     | Sie native Codex-App-Server-Ausführung für den eingebetteten Agent-Turn möchten. |

GPT-5.5 ist derzeit in OpenClaw nur per Abonnement/OAuth verfügbar. Verwenden Sie
`openai-codex/gpt-5.5` für PI OAuth oder `openai/gpt-5.5` mit dem Codex-
App-Server-Harness. Direkter Zugriff per API-Key auf `openai/gpt-5.5` wird unterstützt,
sobald OpenAI GPT-5.5 auf der öffentlichen API aktiviert.

Alte Referenzen `codex/gpt-*` bleiben als Kompatibilitätsaliase akzeptiert. Die
Doctor-Kompatibilitätsmigration schreibt alte primäre Laufzeitreferenzen in kanonische Modell-
referenzen um und speichert die Laufzeitrichtlinie separat, während alte Referenzen nur für Fallback unverändert bleiben, weil die Laufzeit für den gesamten Agent-Container konfiguriert wird.
Neue PI-Codex-OAuth-Konfigurationen sollten `openai-codex/gpt-*` verwenden; neue native
App-Server-Harness-Konfigurationen sollten `openai/gpt-*` plus
`embeddedHarness.runtime: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfixtrennung. Verwenden Sie
`openai-codex/gpt-*`, wenn das Bildverständnis über den OpenAI-
Codex-OAuth-Anbieterpfad laufen soll. Verwenden Sie `codex/gpt-*`, wenn das Bildverständnis über
einen begrenzten Codex-App-Server-Turn laufen soll. Das Modell des Codex-App-Servers muss
Unterstützung für Bildeingaben ausweisen; reine Text-Codex-Modelle schlagen fehl, bevor der Medien-Turn
beginnt.

Verwenden Sie `/status`, um das effektive Harness für die aktuelle Session zu bestätigen. Wenn die
Auswahl überraschend ist, aktivieren Sie Debug-Logging für das Subsystem `agents/harness`
und prüfen Sie den strukturierten Datensatz `agent harness selected` des Gateway. Er
enthält die ID des ausgewählten Harness, den Auswahlgrund, die Laufzeit-/Fallback-Richtlinie und
im Modus `auto` das Unterstützungsergebnis jedes Plugin-Kandidaten.

Die Auswahl des Harness ist keine Live-Steuerung für Sessions. Wenn ein eingebetteter Turn ausgeführt wird,
zeichnet OpenClaw die ID des ausgewählten Harness für diese Session auf und verwendet sie weiterhin für
spätere Turns mit derselben Session-ID. Ändern Sie die Konfiguration `embeddedHarness` oder
`OPENCLAW_AGENT_RUNTIME`, wenn zukünftige Sessions ein anderes Harness verwenden sollen;
verwenden Sie `/new` oder `/reset`, um eine neue Session zu starten, bevor Sie eine bestehende
Unterhaltung zwischen PI und Codex umschalten. So wird vermieden, ein Transcript durch
zwei inkompatible native Session-Systeme erneut abzuspielen.

Alte Sessions, die vor Harness-Pins erstellt wurden, werden als an PI gebunden behandelt, sobald sie
Transcript-Verlauf haben. Verwenden Sie `/new` oder `/reset`, um diese Unterhaltung nach einer
Konfigurationsänderung für Codex zu aktivieren.

`/status` zeigt die effektive Modelllaufzeit. Das Standard-PI-Harness erscheint als
`Runtime: OpenClaw Pi Default`, und das Codex-App-Server-Harness erscheint als
`Runtime: OpenAI Codex`.

## Anforderungen

- OpenClaw mit dem gebündelten `codex`-Plugin.
- Codex-App-Server `0.118.0` oder neuer.
- Codex-Auth muss für den App-Server-Prozess verfügbar sein.

Das Plugin blockiert ältere oder versionslose App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests kommt die Authentifizierung normalerweise von `OPENAI_API_KEY`, plus
optionalen Codex-CLI-Dateien wie `~/.codex/auth.json` und
`~/.codex/config.toml`. Verwenden Sie dasselbe Auth-Material, das Ihr lokaler Codex-App-Server
verwendet.

## Minimale Konfiguration

Verwenden Sie `openai/gpt-5.5`, aktivieren Sie das gebündelte Plugin und erzwingen Sie das `codex`-Harness:

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
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Wenn Ihre Konfiguration `plugins.allow` verwendet, fügen Sie dort ebenfalls `codex` hinzu:

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

Alte Konfigurationen, die `agents.defaults.model` oder ein Agent-Modell auf
`codex/<model>` setzen, aktivieren das gebündelte `codex`-Plugin weiterhin automatisch. Neue Konfigurationen sollten
stattdessen `openai/<model>` plus den expliziten Eintrag `embeddedHarness`
oben bevorzugen.

## Codex zusammen mit anderen Modellen hinzufügen

Setzen Sie `runtime: "codex"` nicht global, wenn derselbe Agent frei zwischen
Codex- und Nicht-Codex-Anbietermodellen wechseln soll. Eine erzwungene Laufzeit gilt für jeden
eingebetteten Turn dieses Agenten oder dieser Session. Wenn Sie ein Anthropic-Modell auswählen, während
diese Laufzeit erzwungen ist, versucht OpenClaw weiterhin das Codex-Harness und schlägt geschlossen fehl,
statt diesen Turn stillschweigend über PI zu leiten.

Verwenden Sie stattdessen eine dieser Formen:

- Legen Sie Codex auf einen dedizierten Agenten mit `embeddedHarness.runtime: "codex"`.
- Behalten Sie den Standard-Agenten auf `runtime: "auto"` und PI-Fallback für normale gemischte
  Anbieternutzung.
- Verwenden Sie `codex/*` nur aus Kompatibilitätsgründen. Neue Konfigurationen sollten
  `openai/*` plus eine explizite Codex-Laufzeitrichtlinie bevorzugen.

Zum Beispiel bleibt so der Standard-Agent bei normaler automatischer Auswahl und
es wird ein separater Codex-Agent hinzugefügt:

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
      embeddedHarness: {
        runtime: "auto",
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
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

Mit dieser Form:

- Der Standard-Agent `main` verwendet den normalen Anbieterpfad und PI-Kompatibilitäts-Fallback.
- Der Agent `codex` verwendet das Codex-App-Server-Harness.
- Wenn Codex für den Agenten `codex` fehlt oder nicht unterstützt wird, schlägt der Turn
  fehl, statt stillschweigend PI zu verwenden.

## Reine Codex-Deployments

Erzwingen Sie das Codex-Harness, wenn Sie nachweisen müssen, dass jeder eingebettete Agent-Turn
Codex verwendet. Explizite Plugin-Laufzeiten verwenden standardmäßig keinen PI-Fallback, daher ist
`fallback: "none"` optional, aber oft als Dokumentation nützlich:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Umgebungsüberschreibung:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Wenn Codex erzwungen ist, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht gestartet werden kann. Setzen Sie
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` nur dann, wenn Sie ausdrücklich möchten, dass PI eine
fehlende Harness-Auswahl übernimmt.

## Codex pro Agent

Sie können einen Agenten nur für Codex konfigurieren, während der Standard-Agent die normale
automatische Auswahl beibehält:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
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
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Verwenden Sie normale Session-Befehle, um Agenten und Modelle zu wechseln. `/new` erstellt eine neue
OpenClaw-Session, und das Codex-Harness erstellt oder setzt seinen Sidecar-App-Server-
Thread bei Bedarf fort. `/reset` löscht die OpenClaw-Session-Bindung für diesen Thread
und lässt den nächsten Turn das Harness erneut aus der aktuellen Konfiguration auflösen.

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

Deaktivieren Sie die Erkennung, wenn beim Start Codex nicht geprüft werden soll und stattdessen der
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

## App-Server-Verbindung und Richtlinie

Standardmäßig startet das Plugin Codex lokal mit:

```bash
codex app-server --listen stdio://
```

Standardmäßig startet OpenClaw lokale Codex-Harness-Sessions im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung, die
für autonome Heartbeats verwendet wird: Codex kann Shell- und Netzwerk-Tools verwenden, ohne
bei nativen Genehmigungs-Prompts anzuhalten, die niemand beantworten kann.

Um von Codex guardian-geprüfte Genehmigungen zu aktivieren, setzen Sie `appServer.mode:
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

Der Guardian-Modus verwendet den nativen Auto-Review-Genehmigungspfad von Codex. Wenn Codex verlangt,
die Sandbox zu verlassen, außerhalb des Workspace zu schreiben oder Berechtigungen wie Netzwerkzugriff
hinzuzufügen, leitet Codex diese Genehmigungsanfrage an den nativen Prüfer weiter statt an eine
menschliche Eingabeaufforderung. Der Prüfer wendet das Risikoframework von Codex an und genehmigt oder verweigert
die konkrete Anfrage. Verwenden Sie Guardian, wenn Sie mehr Leitplanken als im YOLO-Modus wünschen,
unbeaufsichtigte Agenten aber dennoch Fortschritte machen sollen.

Das Preset `guardian` wird erweitert zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"`.
Einzelne Richtlinienfelder überschreiben weiterhin `mode`, sodass fortgeschrittene Deployments
das Preset mit expliziten Entscheidungen kombinieren können. Der ältere Reviewer-Wert `guardian_subagent` wird
weiterhin als Kompatibilitätsalias akzeptiert, aber neue Konfigurationen sollten
`auto_review` verwenden.

Verwenden Sie für einen bereits laufenden App-Server WebSocket-Transport:

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

Unterstützte `appServer`-Felder:

| Feld                | Standard                                 | Bedeutung                                                                                                      |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                              |
| `command`           | `"codex"`                                | Executable für den `stdio`-Transport.                                                                          |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den `stdio`-Transport.                                                                           |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                                                      |
| `authToken`         | nicht gesetzt                            | Bearer-Token für den WebSocket-Transport.                                                                      |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                                  |
| `requestTimeoutMs`  | `60000`                                  | Timeout für Control-Plane-Aufrufe an den App-Server.                                                           |
| `mode`              | `"yolo"`                                 | Preset für YOLO- oder guardian-geprüfte Ausführung.                                                            |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Start/Fortsetzen/Turn des Threads gesendet wird.                  |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Start/Fortsetzen des Threads gesendet wird.                               |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungs-Prompts prüft. `guardian_subagent` bleibt ein Legacy-Alias. |
| `serviceTier`       | nicht gesetzt                            | Optionales Service-Tier des Codex-App-Servers: `"fast"`, `"flex"` oder `null`. Ungültige alte Werte werden ignoriert. |

Die älteren Umgebungsvariablen funktionieren weiterhin als Fallbacks für lokales Testen, wenn
das entsprechende Konfigurationsfeld nicht gesetzt ist:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie
stattdessen `plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration wird
für wiederholbare Deployments bevorzugt, weil dadurch das Verhalten des Plugins in derselben
geprüften Datei bleibt wie der Rest des Codex-Harness-Setups.

## Häufige Rezepte

Lokales Codex mit Standard-`stdio`-Transport:

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

Validierung eines reinen Codex-Harness:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
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

Das Umschalten von Modellen bleibt unter der Kontrolle von OpenClaw. Wenn eine OpenClaw-Session an
einen bestehenden Codex-Thread angehängt ist, sendet der nächste Turn erneut das aktuell ausgewählte
OpenAI-Modell, den Anbieter, die Genehmigungsrichtlinie, die Sandbox und das Service-Tier an den
App-Server. Ein Wechsel von `openai/gpt-5.5` zu `openai/gpt-5.2` behält die
Thread-Bindung bei, fordert Codex aber auf, mit dem neu ausgewählten Modell fortzufahren.

## Befehl `codex`

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert auf jedem Channel, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-Konnektivität zum App-Server, Modelle, Konto, Rate-Limits, MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex-App-Servers auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Session an einen bestehenden Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu komprimieren.
- `/codex review` startet eine native Codex-Prüfung für den angehängten Thread.
- `/codex account` zeigt Konto- und Rate-Limit-Status.
- `/codex mcp` listet den MCP-Server-Status des Codex-App-Servers.
- `/codex skills` listet Skills des Codex-App-Servers.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die das Harness für
normale Turns verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-Modell an den App-Server und lässt den erweiterten Verlauf
aktiviert.

Die Befehlsoberfläche erfordert Codex-App-Server `0.118.0` oder neuer. Einzelne
Steuermethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder benutzerdefinierter App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Das Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Eigentümer                | Zweck                                                                |
| ------------------------------------- | ------------------------- | -------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                  | Produkt-/Plugin-Kompatibilität über PI- und Codex-Harnesses hinweg.  |
| Codex-App-Server-Erweiterungsmiddleware | Gebündelte OpenClaw-Plugins | Verhalten pro Turn des Adapters rund um dynamische Tools von OpenClaw. |
| Native Codex-Hooks                    | Codex                     | Low-Level-Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Konfiguration. |

OpenClaw verwendet keine projektbezogenen oder globalen Codex-Dateien `hooks.json`, um
OpenClaw-Plugin-Verhalten zu steuern. Für die unterstützte Bridge für native Tools und Berechtigungen
injiziert OpenClaw threadbezogene Codex-Konfiguration für `PreToolUse`, `PostToolUse` und
`PermissionRequest`. Andere Codex-Hooks wie `SessionStart`,
`UserPromptSubmit` und `Stop` bleiben Kontrollen auf Codex-Ebene; sie werden
im v1-Vertrag nicht als OpenClaw-Plugin-Hooks bereitgestellt.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex zum
Aufruf aufgefordert hat, sodass OpenClaw im
Harness-Adapter das Plugin- und Middleware-Verhalten ausführt, das ihm gehört. Für native Codex-Tools besitzt Codex den kanonischen Tool-Datensatz.
OpenClaw kann ausgewählte Ereignisse spiegeln, aber es kann den nativen Codex-
Thread nicht umschreiben, es sei denn, Codex stellt diese Operation über App-Server oder native Hook-
Callbacks bereit.

Projektionen von Compaction und LLM-Lebenszyklus stammen aus Benachrichtigungen des Codex-App-Servers
und dem Adapter-Status von OpenClaw, nicht aus nativen Codex-Hook-Befehlen.
Die Ereignisse `before_compaction`, `after_compaction`, `llm_input` und
`llm_output` von OpenClaw sind Beobachtungen auf Adapter-Ebene, keine bytegenauen Erfassungen
der internen Request- oder Compaction-Payloads von Codex.

Native Benachrichtigungen `hook/started` und `hook/completed` des Codex werden
als Agent-Ereignisse `codex_app_server.hook` für Verlauf und Debugging projiziert.
Sie rufen keine OpenClaw-Plugin-Hooks auf.

## V1-Supportvertrag

Der Codex-Modus ist nicht einfach PI mit einem anderen Modellaufruf darunter. Codex verwaltet mehr von
der nativen Modellschleife, und OpenClaw passt seine Plugin- und Session-Oberflächen
an diese Grenze an.

Unterstützt in Codex-Laufzeit v1:

| Oberfläche                              | Unterstützung                            | Warum                                                                                                                                       |
| --------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI-Modellschleife über Codex        | Unterstützt                              | Der Codex-App-Server verwaltet den OpenAI-Turn, natives Thread-Resume und native Tool-Fortsetzung.                                         |
| OpenClaw-Channel-Routing und -Zustellung | Unterstützt                              | Telegram, Discord, Slack, WhatsApp, iMessage und andere Channels bleiben außerhalb der Modelllaufzeit.                                     |
| Dynamische OpenClaw-Tools               | Unterstützt                              | Codex fordert OpenClaw zur Ausführung dieser Tools auf, sodass OpenClaw im Ausführungspfad bleibt.                                         |
| Prompt- und Kontext-Plugins             | Unterstützt                              | OpenClaw erstellt Prompt-Overlays und projiziert Kontext in den Codex-Turn, bevor der Thread gestartet oder fortgesetzt wird.             |
| Lebenszyklus der Context Engine         | Unterstützt                              | Assemble, Ingest oder Wartung nach dem Turn und die Koordination der Compaction der Context Engine laufen für Codex-Turns.                 |
| Dynamische Tool-Hooks                   | Unterstützt                              | `before_tool_call`, `after_tool_call` und Middleware für Tool-Ergebnisse laufen um dynamische Tools, die OpenClaw gehören.                |
| Lebenszyklus-Hooks                      | Unterstützt als Adapter-Beobachtungen    | `llm_input`, `llm_output`, `agent_end`, `before_compaction` und `after_compaction` feuern mit ehrlichen Payloads im Codex-Modus.          |
| Natives Shell- und Patch-Blockieren oder Beobachten | Unterstützt über das native Hook-Relay | Codex-`PreToolUse` und `PostToolUse` werden für die bestätigten nativen Tool-Oberflächen weitergeleitet. Blockieren wird unterstützt; Umschreiben von Argumenten nicht. |
| Native Berechtigungsrichtlinie          | Unterstützt über das native Hook-Relay   | Codex-`PermissionRequest` kann, wo die Laufzeit dies bereitstellt, über die OpenClaw-Richtlinie geroutet werden.                          |
| Erfassung des App-Server-Verlaufs       | Unterstützt                              | OpenClaw zeichnet den Request auf, den es an den App-Server gesendet hat, sowie die Benachrichtigungen, die es vom App-Server erhält.     |

Nicht unterstützt in Codex-Laufzeit v1:

| Oberfläche                                          | V1-Grenze                                                                                                                                      | Zukünftiger Pfad                                                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Mutation nativer Tool-Argumente                     | Native Pre-Tool-Hooks von Codex können blockieren, aber OpenClaw schreibt native Tool-Argumente von Codex nicht um.                           | Erfordert Unterstützung von Codex-Hooks/-Schemas für ersetzte Tool-Eingaben.                             |
| Bearbeitbare native Transcript-History von Codex    | Codex besitzt die kanonische native Thread-History. OpenClaw besitzt ein Mirror und kann zukünftigen Kontext projizieren, sollte aber keine nicht unterstützten Interna mutieren. | Fügen Sie explizite Codex-App-Server-APIs hinzu, wenn native Thread-Operationen benötigt werden.         |
| `tool_result_persist` für native Codex-Tool-Datensätze | Dieser Hook transformiert von OpenClaw verwaltete Transcript-Schreibvorgänge, nicht native Codex-Tool-Datensätze.                            | Könnte transformierte Datensätze spiegeln, aber kanonisches Umschreiben benötigt Codex-Unterstützung.    |
| Umfangreiche native Compaction-Metadaten            | OpenClaw beobachtet Beginn und Abschluss der Compaction, erhält aber keine stabile Liste beibehaltener/verwerfener Einträge, kein Token-Delta und keine Summary-Payload. | Benötigt umfangreichere Codex-Compaction-Ereignisse.                                                     |
| Eingriff in Compaction                              | Die aktuellen Compaction-Hooks von OpenClaw haben im Codex-Modus nur Benachrichtigungsebene.                                                  | Fügen Sie Pre-/Post-Compaction-Hooks von Codex hinzu, wenn Plugins native Compaction vetoieren oder umschreiben müssen. |
| Stop- oder Final-Answer-Gating                      | Codex hat native Stop-Hooks, aber OpenClaw stellt Final-Answer-Gating nicht als v1-Plugin-Vertrag bereit.                                     | Zukünftige opt-in-Primitiven mit Schutzmechanismen für Schleifen und Timeouts.                            |
| Parität nativer MCP-Hooks als fest zugesagte v1-Oberfläche | Das Relay ist generisch, aber OpenClaw hat Verhalten von nativen MCP-Pre-/Post-Hooks noch nicht Ende zu Ende versionsbegrenzt und getestet. | Fügen Sie OpenClaw-MCP-Relay-Tests und Dokumentation hinzu, sobald die unterstützte untere Grenze des App-Server-Protokolls diese Payloads abdeckt. |
| Bytegenaue Erfassung von Requests an die Modell-API | OpenClaw kann Requests und Benachrichtigungen des App-Servers erfassen, aber Codex Core baut den finalen OpenAI-API-Request intern auf.      | Benötigt ein Tracing-Ereignis oder eine Debug-API von Codex für Modell-Requests.                         |

## Tools, Medien und Compaction

Das Codex-Harness ändert nur den Executor des eingebetteten Agenten auf niedriger Ebene.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben von Nachrichtentools
laufen weiterhin über den normalen Zustellungspfad von OpenClaw.

Das native Hook-Relay ist absichtlich generisch, aber der v1-Supportvertrag ist
auf die nativen Tool- und Berechtigungspfade von Codex begrenzt, die OpenClaw testet. Gehen Sie nicht
davon aus, dass jedes zukünftige Hook-Ereignis von Codex eine Plugin-Oberfläche von OpenClaw ist, solange der
Laufzeitvertrag dies nicht ausdrücklich benennt.

Genehmigungsabfragen für Codex-MCP-Tools werden über den Plugin-
Genehmigungsablauf von OpenClaw geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert. Prompts von Codex `request_user_input` werden an den
ursprünglichen Chat zurückgesendet, und die nächste in die Warteschlange eingereihte Follow-up-Nachricht beantwortet diese native
Server-Anfrage, statt als zusätzlicher Kontext gelenkt zu werden. Andere MCP-Abfrage-
Anfragen schlagen weiterhin geschlossen fehl.

Wenn das ausgewählte Modell das Codex-Harness verwendet, wird die native Thread-Compaction an
den Codex-App-Server delegiert. OpenClaw behält ein Transcript-Mirror für den Verlauf der Channels,
Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Wechsel. Das
Mirror enthält den Benutzer-Prompt, den finalen Assistententext und leichtgewichtige Codex-
Reasoning- oder Plan-Datensätze, wenn der App-Server sie ausgibt. Heute zeichnet OpenClaw nur
native Signale zum Beginn und Abschluss der Compaction auf. Es stellt noch keine
menschenlesbare Compaction-Summary oder eine prüfbare Liste bereit, welche Einträge Codex
nach der Compaction beibehalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit
native Tool-Ergebnis-Datensätze von Codex nicht um. Es gilt nur dann, wenn
OpenClaw ein Tool-Ergebnis in ein von OpenClaw verwaltetes Session-Transcript schreibt.

Mediengenerierung erfordert kein PI. Bilderzeugung, Video, Musik, PDF, TTS und Medien-
Verständnis verwenden weiterhin die passenden Anbieter-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Anbieter:** Das ist für
neue Konfigurationen zu erwarten. Wählen Sie ein Modell `openai/gpt-*` mit
`embeddedHarness.runtime: "codex"` (oder eine alte Referenz `codex/*`), aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** `runtime: "auto"` kann weiterhin PI als
Kompatibilitäts-Backend verwenden, wenn kein Codex-Harness den Lauf beansprucht. Setzen Sie
`embeddedHarness.runtime: "codex"`, um die Auswahl von Codex beim Testen zu erzwingen. Eine
erzwungene Codex-Laufzeit schlägt jetzt fehl, statt auf PI zurückzufallen, sofern Sie nicht
ausdrücklich `embeddedHarness.fallback: "pi"` setzen. Sobald der Codex-App-Server
ausgewählt ist, werden seine Fehler direkt angezeigt, ohne zusätzliche Fallback-Konfiguration.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, sodass der Handshake des App-Servers
Version `0.118.0` oder neuer meldet.

**Die Modellerkennung ist langsam:** Verringern Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**Der WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und dass der entfernte App-Server dieselbe Protokollversion des Codex-App-Servers spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist zu erwarten, sofern Sie nicht
`embeddedHarness.runtime: "codex"` für diesen Agenten erzwungen oder eine alte
Referenz `codex/*` ausgewählt haben. Normale `openai/gpt-*`- und andere Anbieterreferenzen bleiben im Modus `auto` auf ihrem normalen
Anbieterpfad. Wenn Sie `runtime: "codex"` erzwingen, muss jeder eingebettete
Turn für diesen Agenten ein von Codex unterstütztes OpenAI-Modell sein.

## Verwandt

- [Agent harness plugins](/de/plugins/sdk-agent-harness)
- [Agent runtimes](/de/concepts/agent-runtimes)
- [Model providers](/de/concepts/model-providers)
- [OpenAI provider](/de/providers/openai)
- [Status](/de/cli/status)
- [Plugin hooks](/de/plugins/hooks)
- [Configuration reference](/de/gateway/configuration-reference)
- [Testing](/de/help/testing-live#live-codex-app-server-harness-smoke)
