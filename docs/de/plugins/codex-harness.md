---
read_when:
    - Sie möchten das gebündelte Codex-App-Server-Harness verwenden
    - Sie benötigen Codex-Modellreferenzen und Config-Beispiele
    - Sie möchten den Pi-Fallback für reine Codex-Bereitstellungen deaktivieren
summary: OpenClaw-eingebettete Agent-Turns über das gebündelte Codex-App-Server-Harness ausführen
title: Codex-Harness
x-i18n:
    generated_at: "2026-04-24T08:58:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

Das gebündelte `codex`-Plugin ermöglicht es OpenClaw, eingebettete Agent-Turns über den Codex-App-Server statt über das integrierte Pi-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Agent-Sitzung auf niedriger Ebene steuern soll: Modellerkennung, natives Wiederaufnehmen von Threads, native Compaction und Ausführung im App-Server.
OpenClaw steuert weiterhin Chat-Channels, Sitzungsdateien, Modellauswahl, Tools, Freigaben, Medienzustellung und die sichtbare Spiegelung des Transkripts.

Native Codex-Turns behalten OpenClaw-Plugin-Hooks als öffentliche Kompatibilitätsschicht bei.
Dabei handelt es sich um In-Process-Hooks von OpenClaw, nicht um Codex-`hooks.json`-Befehlshooks:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` für gespiegelte Transkript-Einträge
- `agent_end`

Gebündelte Plugins können auch eine Codex-App-Server-Extension-Factory registrieren, um asynchrone `tool_result`-Middleware hinzuzufügen. Diese Middleware läuft für dynamische OpenClaw-Tools, nachdem OpenClaw das Tool ausgeführt hat und bevor das Ergebnis an Codex zurückgegeben wird. Sie ist getrennt vom öffentlichen Plugin-Hook `tool_result_persist`, der OpenClaw-eigene Schreibvorgänge für Tool-Ergebnisse im Transkript transformiert.

Das Harness ist standardmäßig deaktiviert. Neue Configs sollten OpenAI-Modellreferenzen kanonisch als `openai/gpt-*` beibehalten und explizit `embeddedHarness.runtime: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen, wenn sie native Ausführung über den App-Server möchten. Veraltete Modellreferenzen `codex/*` wählen das Harness aus Kompatibilitätsgründen weiterhin automatisch aus.

## Das richtige Modellpräfix wählen

Routen der OpenAI-Familie sind präfixspezifisch. Verwenden Sie `openai-codex/*`, wenn Sie Codex-OAuth über Pi verwenden möchten; verwenden Sie `openai/*`, wenn Sie direkten OpenAI-API-Zugriff möchten oder wenn Sie das native Codex-App-Server-Harness erzwingen:

| Modellreferenz                                        | Runtime-Pfad                                 | Verwenden, wenn                                                           |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | OpenAI-Provider über OpenClaw/Pi-Plumbing    | Sie aktuellen direkten Zugriff auf die OpenAI-Platform-API mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.5`                                | OpenAI-Codex-OAuth über OpenClaw/Pi          | Sie ChatGPT-/Codex-Abonnement-Authentifizierung mit dem Standard-Pi-Runner möchten. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex-App-Server-Harness                     | Sie native Ausführung über den Codex-App-Server für den eingebetteten Agent-Turn möchten. |

GPT-5.5 ist derzeit in OpenClaw nur mit Abonnement/OAuth verfügbar. Verwenden Sie `openai-codex/gpt-5.5` für Pi-OAuth oder `openai/gpt-5.5` mit dem Codex-App-Server-Harness. Direkter API-Key-Zugriff für `openai/gpt-5.5` wird unterstützt, sobald OpenAI GPT-5.5 in der öffentlichen API aktiviert.

Veraltete Referenzen `codex/gpt-*` werden weiterhin als Kompatibilitätsaliase akzeptiert. Neue Pi-Codex-OAuth-Configs sollten `openai-codex/gpt-*` verwenden; neue Configs für das native App-Server-Harness sollten `openai/gpt-*` plus `embeddedHarness.runtime: "codex"` verwenden.

`agents.defaults.imageModel` folgt derselben Präfix-Aufteilung. Verwenden Sie `openai-codex/gpt-*`, wenn die Bildverarbeitung über den Provider-Pfad OpenAI Codex OAuth laufen soll. Verwenden Sie `codex/gpt-*`, wenn die Bildverarbeitung über einen begrenzten Codex-App-Server-Turn laufen soll. Das Codex-App-Server-Modell muss Unterstützung für Bildeingaben ankündigen; reine Text-Codex-Modelle schlagen fehl, bevor der Medien-Turn beginnt.

Verwenden Sie `/status`, um das effektive Harness für die aktuelle Sitzung zu bestätigen. Wenn die Auswahl überraschend ist, aktivieren Sie Debug-Logging für das Subsystem `agents/harness` und prüfen Sie den strukturierten Datensatz `agent harness selected` des Gateways. Er enthält die ID des ausgewählten Harness, den Grund der Auswahl, die Richtlinie für Runtime/Fallback und im Modus `auto` das Unterstützungsergebnis jedes Plugin-Kandidaten.

Die Auswahl des Harness ist keine Live-Steuerung für Sitzungen. Wenn ein eingebetteter Turn ausgeführt wird, zeichnet OpenClaw die ID des ausgewählten Harness für diese Sitzung auf und verwendet sie für spätere Turns in derselben Sitzungs-ID weiter. Ändern Sie die Config `embeddedHarness` oder `OPENCLAW_AGENT_RUNTIME`, wenn zukünftige Sitzungen ein anderes Harness verwenden sollen; verwenden Sie `/new` oder `/reset`, um eine neue Sitzung zu starten, bevor Sie eine bestehende Unterhaltung zwischen Pi und Codex umschalten. Dadurch wird vermieden, dass ein Transkript über zwei inkompatible native Sitzungssysteme erneut abgespielt wird.

Veraltete Sitzungen, die vor Harness-Pins erstellt wurden, werden als an Pi gebunden behandelt, sobald sie einen Transkriptverlauf haben. Verwenden Sie `/new` oder `/reset`, um diese Unterhaltung nach einer Config-Änderung für Codex zu aktivieren.

`/status` zeigt das effektive Nicht-Pi-Harness neben `Fast` an, zum Beispiel `Fast · codex`. Das Standard-Pi-Harness bleibt `Runner: pi (embedded)` und fügt kein separates Harness-Badge hinzu.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex-App-Server `0.118.0` oder neuer.
- Codex-Authentifizierung, die für den App-Server-Prozess verfügbar ist.

Das Plugin blockiert ältere oder versionslose Handshakes des App-Servers. Dadurch bleibt OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung normalerweise aus `OPENAI_API_KEY` sowie optionalen Codex-CLI-Dateien wie `~/.codex/auth.json` und `~/.codex/config.toml`. Verwenden Sie dasselbe Auth-Material, das auch Ihr lokaler Codex-App-Server verwendet.

## Minimale Config

Verwenden Sie `openai/gpt-5.5`, aktivieren Sie das gebündelte Plugin und erzwingen Sie das Harness `codex`:

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
        fallback: "none",
      },
    },
  },
}
```

Wenn Ihre Config `plugins.allow` verwendet, schließen Sie dort ebenfalls `codex` ein:

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

Veraltete Configs, die `agents.defaults.model` oder ein Agent-Modell auf `codex/<model>` setzen, aktivieren das gebündelte `codex`-Plugin weiterhin automatisch. Neue Configs sollten `openai/<model>` plus den obigen expliziten Eintrag `embeddedHarness` bevorzugen.

## Codex hinzufügen, ohne andere Modelle zu ersetzen

Behalten Sie `runtime: "auto"` bei, wenn veraltete Referenzen `codex/*` Codex auswählen sollen und Pi für alles andere. Für neue Configs bevorzugen Sie explizites `runtime: "codex"` bei den Agents, die das Harness verwenden sollen.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

Bei dieser Struktur gilt:

- `/model gpt` oder `/model openai/gpt-5.5` verwendet für diese Config das Codex-App-Server-Harness.
- `/model opus` verwendet den Anthropic-Provider-Pfad.
- Wenn ein Nicht-Codex-Modell ausgewählt ist, bleibt Pi das Kompatibilitätsharness.

## Reine Codex-Bereitstellungen

Deaktivieren Sie den Pi-Fallback, wenn Sie nachweisen müssen, dass jeder eingebettete Agent-Turn das Codex-Harness verwendet:

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

Überschreibung per Umgebungsvariable:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Wenn der Fallback deaktiviert ist, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der App-Server zu alt ist oder der App-Server nicht gestartet werden kann.

## Codex pro Agent

Sie können einen Agent auf reines Codex festlegen, während der Standard-Agent die normale automatische Auswahl beibehält:

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

Verwenden Sie normale Sitzungsbefehle, um Agents und Modelle zu wechseln. `/new` erstellt eine neue OpenClaw-Sitzung und das Codex-Harness erstellt oder setzt den zugehörigen App-Server-Thread bei Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread und lässt den nächsten Turn das Harness erneut aus der aktuellen Config auflösen.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn die Erkennung fehlschlägt oder in ein Timeout läuft, verwendet es einen gebündelten Fallback-Katalog für:

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

Deaktivieren Sie die Erkennung, wenn Sie möchten, dass der Start das Prüfen von Codex vermeidet und beim Fallback-Katalog bleibt:

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

## Verbindung zum App-Server und Richtlinie

Standardmäßig startet das Plugin Codex lokal mit:

```bash
codex app-server --listen stdio://
```

Standardmäßig startet OpenClaw lokale Codex-Harness-Sitzungen im YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Dies ist die vertrauenswürdige lokale Operator-Haltung, die für autonome Heartbeats verwendet wird: Codex kann Shell- und Netzwerk-Tools verwenden, ohne bei nativen Freigabeaufforderungen anzuhalten, wenn niemand da ist, um sie zu beantworten.

Um Codex-Freigaben mit Prüfung durch Guardian zu aktivieren, setzen Sie `appServer.mode:
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

Guardian ist ein nativer Freigabeprüfer von Codex. Wenn Codex darum bittet, die Sandbox zu verlassen, außerhalb des Workspace zu schreiben oder Berechtigungen wie Netzwerkzugriff hinzuzufügen, leitet Codex diese Freigabeanfrage an einen Prüfer-Subagent weiter statt an eine Aufforderung für Menschen. Der Prüfer wendet das Risikokonzept von Codex an und genehmigt oder lehnt die konkrete Anfrage ab. Verwenden Sie Guardian, wenn Sie mehr Guardrails als im YOLO-Modus möchten, aber weiterhin unbeaufsichtigte Agents Fortschritte machen sollen.

Das Preset `guardian` wird erweitert zu `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` und `sandbox: "workspace-write"`. Einzelne Richtlinienfelder überschreiben weiterhin `mode`, sodass fortgeschrittene Bereitstellungen das Preset mit expliziten Entscheidungen kombinieren können.

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

| Feld                | Standardwert                             | Bedeutung                                                                                                   |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                           |
| `command`           | `"codex"`                                | Executable für den Stdio-Transport.                                                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für den Stdio-Transport.                                                                          |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                                                   |
| `authToken`         | nicht gesetzt                            | Bearer-Token für den WebSocket-Transport.                                                                   |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                                                               |
| `requestTimeoutMs`  | `60000`                                  | Timeout für Control-Plane-Aufrufe des App-Servers.                                                          |
| `mode`              | `"yolo"`                                 | Preset für YOLO- oder Guardian-geprüfte Ausführung.                                                         |
| `approvalPolicy`    | `"never"`                                | Native Codex-Freigaberichtlinie, die an Start/Fortsetzung/Turn des Threads gesendet wird.                  |
| `sandbox`           | `"danger-full-access"`                   | Nativer Codex-Sandbox-Modus, der an Start/Fortsetzung des Threads gesendet wird.                           |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"guardian_subagent"`, damit Codex Guardian Prompts prüfen kann.                             |
| `serviceTier`       | nicht gesetzt                            | Optionales Service-Tier des Codex-App-Servers: `"fast"`, `"flex"` oder `null`. Ungültige ältere Werte werden ignoriert. |

Die älteren Umgebungsvariablen funktionieren für lokale Tests weiterhin als Fallbacks, wenn das passende Config-Feld nicht gesetzt ist:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen `plugins.entries.codex.config.appServer.mode: "guardian"` oder `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Config wird für reproduzierbare Bereitstellungen bevorzugt, weil dadurch das Verhalten des Plugins in derselben geprüften Datei wie der Rest des Codex-Harness-Setups bleibt.

## Häufige Rezepte

Lokales Codex mit Standard-Stdio-Transport:

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

Validierung für reines Codex-Harness mit deaktiviertem Pi-Fallback:

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

Guardian-geprüfte Codex-Freigaben:

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

Das Umschalten von Modellen bleibt unter der Kontrolle von OpenClaw. Wenn eine OpenClaw-Sitzung an einen bestehenden Codex-Thread angehängt ist, sendet der nächste Turn das aktuell ausgewählte OpenAI-Modell, den Provider, die Freigaberichtlinie, die Sandbox und das Service-Tier erneut an den App-Server. Beim Wechsel von `openai/gpt-5.5` zu `openai/gpt-5.2` bleibt die Thread-Bindung erhalten, aber Codex wird aufgefordert, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist generisch und funktioniert auf jedem Channel, der Textbefehle von OpenClaw unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-App-Server-Konnektivität, Modelle, Account, Ratenlimits, MCP-Server und Skills.
- `/codex models` listet die Live-Modelle des Codex-App-Servers auf.
- `/codex threads [filter]` listet die aktuellen Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen bestehenden Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu komprimieren.
- `/codex review` startet die native Codex-Prüfung für den angehängten Thread.
- `/codex account` zeigt Account- und Ratenlimit-Status an.
- `/codex mcp` listet den MCP-Server-Status des Codex-App-Servers auf.
- `/codex skills` listet die Skills des Codex-App-Servers auf.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die das Harness für normale Turns verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das aktuell ausgewählte OpenClaw-Modell an den App-Server und lässt den erweiterten Verlauf aktiviert.

Die Befehlsoberfläche erfordert Codex-App-Server `0.118.0` oder neuer. Einzelne Control-Methoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein zukünftiger oder benutzerdefinierter App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Hook-Grenzen

Das Codex-Harness hat drei Hook-Ebenen:

| Ebene                                 | Verantwortlich            | Zweck                                                               |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| OpenClaw-Plugin-Hooks                 | OpenClaw                  | Produkt-/Plugin-Kompatibilität über Pi- und Codex-Harnesses hinweg. |
| Codex-App-Server-Extension-Middleware | gebündelte OpenClaw-Plugins | Adapterverhalten pro Turn rund um dynamische OpenClaw-Tools.       |
| Native Codex-Hooks                    | Codex                     | Low-Level-Codex-Lebenszyklus und native Tool-Richtlinie aus der Codex-Config. |

OpenClaw verwendet keine projektweiten oder globalen Codex-`hooks.json`-Dateien, um das Verhalten von OpenClaw-Plugins zu steuern. Native Codex-Hooks sind nützlich für Codex-eigene Operationen wie Shell-Richtlinien, native Prüfung von Tool-Ergebnissen, Stop-Behandlung und nativen Compaction-/Modell-Lebenszyklus, aber sie sind nicht die OpenClaw-Plugin-API.

Für dynamische OpenClaw-Tools führt OpenClaw das Tool aus, nachdem Codex den Aufruf angefordert hat. Deshalb löst OpenClaw das Plugin- und Middleware-Verhalten aus, das ihm im Harness-Adapter gehört. Für native Codex-Tools besitzt Codex den kanonischen Tool-Eintrag. OpenClaw kann ausgewählte Ereignisse spiegeln, aber den nativen Codex-Thread nicht umschreiben, sofern Codex diese Operation nicht über den App-Server oder native Hook-Callbacks bereitstellt.

Wenn neuere Codex-App-Server-Builds Hook-Ereignisse für native Compaction und den Modell-Lebenszyklus bereitstellen, sollte OpenClaw diese Protokollunterstützung versionsabhängig absichern und die Ereignisse dort in den bestehenden OpenClaw-Hook-Vertrag abbilden, wo die Semantik ehrlich ist. Bis dahin sind die Ereignisse `before_compaction`, `after_compaction`, `llm_input` und `llm_output` von OpenClaw Beobachtungen auf Adapterebene und keine Byte-für-Byte-Erfassungen der internen Anfrage- oder Compaction-Payloads von Codex.

Native Codex-`hook/started`- und `hook/completed`-App-Server-Benachrichtigungen werden als Agent-Ereignisse `codex_app_server.hook` für Trajektorie und Debugging projiziert. Sie rufen keine OpenClaw-Plugin-Hooks auf.

## Tools, Medien und Compaction

Das Codex-Harness ändert nur den Low-Level-Executor für eingebettete Agents.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom Harness. Text, Bilder, Video, Musik, TTS, Freigaben und Ausgaben von Messaging-Tools laufen weiterhin über den normalen Zustellpfad von OpenClaw.

Freigabeanforderungen für Codex-MCP-Tools werden über den Plugin-Freigabefluss von OpenClaw geleitet, wenn Codex `_meta.codex_approval_kind` als `"mcp_tool_call"` markiert. Codex-`request_user_input`-Prompts werden an den ursprünglichen Chat zurückgesendet, und die nächste in die Warteschlange gestellte Folgemeldung beantwortet diese native Serveranfrage, statt als zusätzlicher Kontext gelenkt zu werden. Andere MCP-Anforderungen schlagen weiterhin kontrolliert fehl.

Wenn das ausgewählte Modell das Codex-Harness verwendet, wird die native Thread-Compaction an den Codex-App-Server delegiert. OpenClaw behält eine Spiegelung des Transkripts für Channel-Verlauf, Suche, `/new`, `/reset` und zukünftiges Umschalten von Modell oder Harness bei. Die Spiegelung enthält den Benutzer-Prompt, den endgültigen Assistant-Text und leichtgewichtige Einträge zu Codex-Reasoning oder -Plänen, wenn der App-Server diese ausgibt. Aktuell zeichnet OpenClaw nur Start- und Abschluss-Signale der nativen Compaction auf. Es stellt noch keine menschenlesbare Compaction-Zusammenfassung oder prüfbare Liste bereit, welche Einträge Codex nach der Compaction behalten hat.

Da Codex den kanonischen nativen Thread besitzt, schreibt `tool_result_persist` derzeit keine nativen Tool-Ergebniseinträge von Codex um. Es gilt nur, wenn OpenClaw ein OpenClaw-eigenes Tool-Ergebnis in das Sitzungs-Transkript schreibt.

Medienerzeugung erfordert kein Pi. Bilderzeugung, Video, Musik, PDF, TTS und Medienverständnis verwenden weiterhin die passenden Provider-/Modelleinstellungen wie `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und `messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht in `/model`:** aktivieren Sie `plugins.entries.codex.enabled`, wählen Sie ein Modell `openai/gpt-*` mit `embeddedHarness.runtime: "codex"` (oder eine veraltete Referenz `codex/*`) und prüfen Sie, ob `plugins.allow` `codex` ausschließt.

**OpenClaw verwendet Pi statt Codex:** wenn kein Codex-Harness den Lauf beansprucht, kann OpenClaw Pi als Kompatibilitäts-Backend verwenden. Setzen Sie `embeddedHarness.runtime: "codex"`, um die Auswahl von Codex beim Testen zu erzwingen, oder `embeddedHarness.fallback: "none"`, damit ein Fehler auftritt, wenn kein Plugin-Harness passt. Sobald der Codex-App-Server ausgewählt ist, werden seine Fehler direkt angezeigt, ohne zusätzliche Fallback-Config.

**Der App-Server wird abgelehnt:** aktualisieren Sie Codex, sodass der Handshake des App-Servers Version `0.118.0` oder neuer meldet.

**Die Modellerkennung ist langsam:** verringern Sie `plugins.entries.codex.config.discovery.timeoutMs` oder deaktivieren Sie die Erkennung.

**Der WebSocket-Transport schlägt sofort fehl:** prüfen Sie `appServer.url`, `authToken` und ob der Remote-App-Server dieselbe Protokollversion des Codex-App-Servers spricht.

**Ein Nicht-Codex-Modell verwendet Pi:** das ist erwartetes Verhalten, sofern Sie nicht `embeddedHarness.runtime: "codex"` erzwungen haben (oder eine veraltete Referenz `codex/*` ausgewählt wurde). Normale Referenzen `openai/gpt-*` und andere Provider-Referenzen bleiben auf ihrem normalen Provider-Pfad.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Modell-Provider](/de/concepts/model-providers)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Tests](/de/help/testing-live#live-codex-app-server-harness-smoke)
