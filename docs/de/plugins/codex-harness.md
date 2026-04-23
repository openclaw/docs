---
read_when:
    - Sie möchten das gebündelte Codex-App-Server-Harness verwenden
    - Sie benötigen Codex-Modell-Referenzen und Konfigurationsbeispiele
    - Sie möchten den Pi-Fallback für reine Codex-Bereitstellungen deaktivieren
summary: OpenClaw eingebettete Agent-Turns über das gebündelte Codex-App-Server-Harness ausführen
title: Codex-Harness
x-i18n:
    generated_at: "2026-04-23T06:31:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc2acc3dc906d12e12a837a25a52ec0e72d44325786106771045d456e6327040
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex-Harness

Das gebündelte `codex`-Plugin ermöglicht es OpenClaw, eingebettete Agent-Turns über den
Codex-App-Server statt über das integrierte Pi-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung übernehmen soll: Modell-
Erkennung, natives Fortsetzen von Threads, native Compaction und Ausführung über den
App-Server. OpenClaw verwaltet weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl, Tools,
Genehmigungen, Medienzustellung und die sichtbare Transkript-Spiegelung.

Native Codex-Turns berücksichtigen außerdem die gemeinsamen Plugin-Hooks
`before_prompt_build`,
`before_compaction` und `after_compaction`, sodass Prompt-Shims und
Compaction-bewusste Automatisierung mit dem Pi-Harness abgestimmt bleiben können.
Native Codex-Turns berücksichtigen außerdem die gemeinsamen Plugin-Hooks
`before_prompt_build`,
`before_compaction`, `after_compaction`, `llm_input`, `llm_output` und
`agent_end`, sodass Prompt-Shims, Compaction-bewusste Automatisierung und
Lifecycle-Beobachter mit dem Pi-Harness abgestimmt bleiben können.

Das Harness ist standardmäßig deaktiviert. Es wird nur ausgewählt, wenn das `codex`-Plugin
aktiviert ist und das aufgelöste Modell ein `codex/*`-Modell ist oder wenn Sie
`embeddedHarness.runtime: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` explizit erzwingen.
Wenn Sie niemals `codex/*` konfigurieren, behalten bestehende Pi-, OpenAI-, Anthropic-, Gemini-, lokale
und benutzerdefinierte Provider-Läufe ihr aktuelles Verhalten bei.

## Das richtige Modellpräfix wählen

OpenClaw hat getrennte Pfade für OpenAI- und Codex-förmigen Zugriff:

| Modell-Ref            | Laufzeitpfad                                 | Verwenden, wenn                                                           |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`      | OpenAI-Provider über OpenClaw/Pi-Plumbing    | Sie direkten Zugriff auf die OpenAI-Platform-API mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.4` | OpenAI-Codex-OAuth-Provider über Pi         | Sie ChatGPT/Codex-OAuth ohne das Codex-App-Server-Harness möchten.        |
| `codex/gpt-5.4`       | Gebündelter Codex-Provider plus Codex-Harness | Sie native Codex-App-Server-Ausführung für den eingebetteten Agent-Turn möchten. |

Das Codex-Harness beansprucht nur `codex/*`-Modell-Refs. Bestehende `openai/*`,
`openai-codex/*`-, Anthropic-, Gemini-, xAI-, lokale und benutzerdefinierte Provider-Refs behalten
ihre normalen Pfade.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex-App-Server `0.118.0` oder neuer.
- Für den App-Server-Prozess verfügbare Codex-Authentifizierung.

Das Plugin blockiert ältere oder versionlose App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests kommt die Authentifizierung normalerweise von `OPENAI_API_KEY`, plus
optionalen Codex-CLI-Dateien wie `~/.codex/auth.json` und
`~/.codex/config.toml`. Verwenden Sie dasselbe Authentifizierungsmaterial wie für Ihren lokalen Codex-App-Server.

## Minimale Konfiguration

Verwenden Sie `codex/gpt-5.4`, aktivieren Sie das gebündelte Plugin und erzwingen Sie das `codex`-Harness:

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Wenn Ihre Konfiguration `plugins.allow` verwendet, schließen Sie dort ebenfalls `codex` ein:

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

Das Setzen von `agents.defaults.model` oder eines Agent-Modells auf `codex/<model>` aktiviert
das gebündelte `codex`-Plugin ebenfalls automatisch. Der explizite Plugin-Eintrag ist in gemeinsamen
Konfigurationen weiterhin nützlich, weil er die Bereitstellungsabsicht deutlich macht.

## Codex hinzufügen, ohne andere Modelle zu ersetzen

Behalten Sie `runtime: "auto"` bei, wenn Sie Codex für `codex/*`-Modelle und Pi für
alles andere verwenden möchten:

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
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Mit dieser Form:

- `/model codex` oder `/model codex/gpt-5.4` verwendet das Codex-App-Server-Harness.
- `/model gpt` oder `/model openai/gpt-5.4` verwendet den OpenAI-Provider-Pfad.
- `/model opus` verwendet den Anthropic-Provider-Pfad.
- Wenn ein Nicht-Codex-Modell ausgewählt ist, bleibt Pi das Kompatibilitätsharness.

## Reine Codex-Bereitstellungen

Deaktivieren Sie den Pi-Fallback, wenn Sie nachweisen müssen, dass jeder eingebettete Agent-Turn das
Codex-Harness verwendet:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Überschreibung per Umgebungsvariable:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Wenn der Fallback deaktiviert ist, schlägt OpenClaw frühzeitig fehl, wenn das Codex-Plugin deaktiviert ist,
das angeforderte Modell keine `codex/*`-Ref ist, der App-Server zu alt ist oder der
App-Server nicht gestartet werden kann.

## Codex pro Agent

Sie können einen Agent rein für Codex konfigurieren, während der Standard-Agent die normale
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
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Verwenden Sie normale Sitzungsbefehle, um zwischen Agents und Modellen zu wechseln. `/new` erstellt eine neue
OpenClaw-Sitzung, und das Codex-Harness erstellt oder setzt seinen Sidecar-App-Server-
Thread bei Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn die
Erkennung fehlschlägt oder ein Timeout erreicht, wird der gebündelte Fallback-Katalog verwendet:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

Deaktivieren Sie die Erkennung, wenn Sie möchten, dass der Start kein Codex abfragt und sich auf den
Fallback-Katalog beschränkt:

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

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung, die
für autonome Heartbeats verwendet wird: Codex kann Shell- und Netzwerk-Tools verwenden, ohne
bei nativen Genehmigungsaufforderungen anzuhalten, die niemand beantworten kann.

Um von Codex Guardian geprüfte Genehmigungen zu aktivieren, setzen Sie `appServer.mode:
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

Der Guardian-Modus expandiert zu:

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
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

Guardian ist ein nativer von Codex bereitgestellter Prüfer für Genehmigungen. Wenn Codex darum bittet, die
Sandbox zu verlassen, außerhalb des Workspace zu schreiben oder Berechtigungen wie Netzwerkzugriff hinzuzufügen,
leitet Codex diese Genehmigungsanfrage an einen Prüfer-Subagent statt an eine menschliche
Eingabeaufforderung weiter. Der Prüfer sammelt Kontext und wendet das Risikoframework von Codex an,
dann genehmigt oder verweigert er die konkrete Anfrage. Guardian ist nützlich, wenn Sie mehr
Leitplanken als im YOLO-Modus möchten, aber dennoch unbeaufsichtigte Agents und Heartbeats
Fortschritt machen sollen.

Das Docker-Live-Harness enthält eine Guardian-Prüfung, wenn
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1` gesetzt ist. Es startet das Codex-Harness im
Guardian-Modus, verifiziert, dass ein harmloser Shell-Befehl mit Eskalation genehmigt wird, und
verifiziert, dass ein Upload eines falschen Geheimnisses zu einem nicht vertrauenswürdigen externen Ziel
abgelehnt wird, sodass der Agent erneut um ausdrückliche Genehmigung bittet.

Die einzelnen Richtlinienfelder haben weiterhin Vorrang vor `mode`, sodass fortgeschrittene
Bereitstellungen das Preset mit expliziten Auswahlmöglichkeiten mischen können.

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

Unterstützte `appServer`-Felder:

| Feld                | Standard                                 | Bedeutung                                                                                                  |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                          |
| `command`           | `"codex"`                                | Ausführbare Datei für stdio-Transport.                                                                     |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für stdio-Transport.                                                                             |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                                                  |
| `authToken`         | nicht gesetzt                            | Bearer-Token für WebSocket-Transport.                                                                      |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                              |
| `requestTimeoutMs`  | `60000`                                  | Timeout für App-Server-Control-Plane-Aufrufe.                                                              |
| `mode`              | `"yolo"`                                 | Preset für YOLO- oder Guardian-geprüfte Ausführung.                                                        |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzen/Turn gesendet wird.                   |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzen gesendet wird.                                |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"guardian_subagent"`, damit Codex Guardian Prompts prüfen kann.                            |
| `serviceTier`       | nicht gesetzt                            | Optionale Codex-App-Server-Service-Stufe: `"fast"`, `"flex"` oder `null`. Ungültige Legacy-Werte werden ignoriert. |

Die älteren Umgebungsvariablen funktionieren weiterhin als Fallbacks für lokale Tests, wenn
das passende Konfigurationsfeld nicht gesetzt ist:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen
`plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration wird
für wiederholbare Bereitstellungen bevorzugt, weil sie das Plugin-Verhalten in derselben
geprüften Datei hält wie den Rest des Codex-Harness-Setups.

## Häufige Rezepte

Lokales Codex mit standardmäßigem stdio-Transport:

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

Validierung eines reinen Codex-Harnesses mit deaktiviertem Pi-Fallback:

```json5
{
  embeddedHarness: {
    fallback: "none",
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

Von Guardian geprüfte Codex-Genehmigungen:

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
            approvalsReviewer: "guardian_subagent",
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

Modellwechsel bleiben von OpenClaw gesteuert. Wenn eine OpenClaw-Sitzung an
einen bestehenden Codex-Thread angehängt ist, sendet der nächste Turn das aktuell ausgewählte
`codex/*`-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und die Service-Stufe
erneut an den App-Server. Ein Wechsel von `codex/gpt-5.4` zu `codex/gpt-5.2` behält die
Thread-Bindung bei, weist Codex aber an, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert auf jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-App-Server-Konnektivität, Modelle, Konto, Rate-Limits, MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex-App-Servers auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen bestehenden Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu komprimieren.
- `/codex review` startet die native Codex-Überprüfung für den angehängten Thread.
- `/codex account` zeigt Konto- und Rate-Limit-Status an.
- `/codex mcp` listet den MCP-Server-Status des Codex-App-Servers auf.
- `/codex skills` listet die Skills des Codex-App-Servers auf.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die das Harness für
normale Turns verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-`codex/*`-Modell an den App-Server und hält den erweiterten
Verlauf aktiviert.

Die Befehlsoberfläche erfordert Codex-App-Server `0.118.0` oder neuer. Einzelne
Steuermethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder benutzerdefinierter App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Tools, Medien und Compaction

Das Codex-Harness ändert nur den Low-Level-Ausführer des eingebetteten Agent.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools
laufen weiterhin über den normalen OpenClaw-Zustellungspfad.

Codex-MCP-Tool-Genehmigungsanforderungen werden über den Plugin-Genehmigungsfluss von OpenClaw
geleitet, wenn Codex `_meta.codex_approval_kind` als
`"mcp_tool_call"` markiert; andere Anforderungsarten und Freiform-Eingabeanforderungen schlagen weiterhin
fail closed fehl.

Wenn das ausgewählte Modell das Codex-Harness verwendet, wird native Thread-Compaction an den
Codex-App-Server delegiert. OpenClaw behält eine Transkript-Spiegelung für Kanalverlauf,
Suche, `/new`, `/reset` sowie zukünftiges Modell- oder Harness-Wechseln. Die
Spiegelung umfasst den Benutzer-Prompt, den endgültigen Assistant-Text und leichtgewichtige Codex-
Reasoning- oder Plan-Aufzeichnungen, wenn der App-Server sie ausgibt. Aktuell zeichnet OpenClaw nur
native Start- und Abschluss-Signale für Compaction auf. Es stellt derzeit noch keine
menschenlesbare Compaction-Zusammenfassung oder eine auditierbare Liste der Einträge bereit, die Codex
nach der Compaction beibehalten hat.

Mediengenerierung erfordert kein Pi. Bild-, Video-, Musik-, PDF-, TTS- und Medien-
Verständnis verwenden weiterhin die passenden Provider-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht in `/model`:** aktivieren Sie `plugins.entries.codex.enabled`,
setzen Sie eine `codex/*`-Modell-Ref oder prüfen Sie, ob `plugins.allow` `codex` ausschließt.

**OpenClaw verwendet Pi statt Codex:** wenn kein Codex-Harness den Lauf beansprucht,
kann OpenClaw Pi als Kompatibilitäts-Backend verwenden. Setzen Sie
`embeddedHarness.runtime: "codex"`, um bei Tests die Auswahl von Codex zu erzwingen, oder
`embeddedHarness.fallback: "none"`, um fehlzuschlagen, wenn kein Plugin-Harness passt. Sobald
der Codex-App-Server ausgewählt ist, werden seine Fehler direkt ohne zusätzliche
Fallback-Konfiguration angezeigt.

**Der App-Server wird abgelehnt:** aktualisieren Sie Codex, sodass der App-Server-Handshake
Version `0.118.0` oder neuer meldet.

**Die Modellerkennung ist langsam:** verringern Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**WebSocket-Transport schlägt sofort fehl:** prüfen Sie `appServer.url`, `authToken`
und ob der Remote-App-Server dieselbe Protokollversion des Codex-App-Servers spricht.

**Ein Nicht-Codex-Modell verwendet Pi:** das ist zu erwarten. Das Codex-Harness beansprucht nur
`codex/*`-Modell-Refs.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Modell-Provider](/de/concepts/model-providers)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Tests](/de/help/testing#live-codex-app-server-harness-smoke)
