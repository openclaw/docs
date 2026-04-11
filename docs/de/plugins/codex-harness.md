---
read_when:
    - Sie möchten das gebündelte Codex-App-Server-Harness verwenden
    - Sie benötigen Codex-Modell-Refs und Konfigurationsbeispiele
    - Sie möchten den PI-Fallback für reine Codex-Bereitstellungen deaktivieren
summary: OpenClaw-eingebettete Agent-Turns über das gebündelte Codex-App-Server-Harness ausführen
title: Codex-Harness
x-i18n:
    generated_at: "2026-04-11T02:46:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e1dcf4f1a00c63c3ef31d72feac44bce255421c032c58fa4fd67295b3daf23
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex-Harness

Das gebündelte `codex`-Plugin ermöglicht es OpenClaw, eingebettete Agent-Turns über den
Codex-App-Server statt über das integrierte PI-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Sitzung verwalten soll: Modell-
Erkennung, natives Fortsetzen von Threads, native Verdichtung und Ausführung über den
App-Server. OpenClaw verwaltet weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl, Tools,
Genehmigungen, Medienzustellung und das sichtbare Transkript-Spiegelbild.

Das Harness ist standardmäßig deaktiviert. Es wird nur ausgewählt, wenn das `codex`-Plugin
aktiviert ist und das aufgelöste Modell ein `codex/*`-Modell ist oder wenn Sie explizit
`embeddedHarness.runtime: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen.
Wenn Sie nie `codex/*` konfigurieren, behalten bestehende PI-, OpenAI-, Anthropic-, Gemini-, lokale
und Custom-Provider-Läufe ihr aktuelles Verhalten.

## Wählen Sie das richtige Modellpräfix

OpenClaw hat getrennte Pfade für OpenAI- und Codex-artigen Zugriff:

| Modell-Ref            | Laufzeitpfad                                | Verwenden, wenn                                                           |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`      | OpenAI-Provider über OpenClaw-/PI-Plumbing  | Sie direkten Zugriff auf die OpenAI Platform API mit `OPENAI_API_KEY` möchten. |
| `openai-codex/gpt-5.4` | OpenAI-Codex-OAuth-Provider über PI        | Sie ChatGPT-/Codex-OAuth ohne das Codex-App-Server-Harness möchten.       |
| `codex/gpt-5.4`       | Gebündelter Codex-Provider plus Codex-Harness | Sie native Codex-App-Server-Ausführung für den eingebetteten Agent-Turn möchten. |

Das Codex-Harness übernimmt nur `codex/*`-Modell-Refs. Bestehende `openai/*`,
`openai-codex/*`, Anthropic-, Gemini-, xAI-, lokale und Custom-Provider-Refs behalten
ihre normalen Pfade.

## Voraussetzungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Codex-App-Server `0.118.0` oder neuer.
- Für den App-Server-Prozess verfügbare Codex-Authentifizierung.

Das Plugin blockiert ältere oder versionslose App-Server-Handshakes. Dadurch bleibt
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests stammt die Authentifizierung normalerweise aus `OPENAI_API_KEY` sowie optionalen Codex-CLI-Dateien wie `~/.codex/auth.json` und
`~/.codex/config.toml`. Verwenden Sie dasselbe Authentifizierungsmaterial wie für Ihren lokalen Codex-App-Server.

## Minimalkonfiguration

Verwenden Sie `codex/gpt-5.4`, aktivieren Sie das gebündelte Plugin und erzwingen Sie das
`codex`-Harness:

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

Das Setzen von `agents.defaults.model` oder eines Agentenmodells auf `codex/<model>` aktiviert
das gebündelte `codex`-Plugin ebenfalls automatisch. Der explizite Plugin-Eintrag bleibt in gemeinsam genutzten Konfigurationen nützlich, weil er die Bereitstellungsabsicht klar macht.

## Codex hinzufügen, ohne andere Modelle zu ersetzen

Behalten Sie `runtime: "auto"` bei, wenn Sie Codex für `codex/*`-Modelle und PI für
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
- Wenn ein Nicht-Codex-Modell ausgewählt ist, bleibt PI das Kompatibilitäts-Harness.

## Reine Codex-Bereitstellungen

Deaktivieren Sie den PI-Fallback, wenn Sie nachweisen müssen, dass jeder eingebettete Agent-Turn das
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

Override per Umgebungsvariable:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Wenn der Fallback deaktiviert ist, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist,
das angeforderte Modell kein `codex/*`-Ref ist, der App-Server zu alt ist oder der
App-Server nicht gestartet werden kann.

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

Verwenden Sie normale Sitzungsbefehle, um Agenten und Modelle zu wechseln. `/new` erstellt eine frische
OpenClaw-Sitzung und das Codex-Harness erstellt oder setzt seinen Sidecar-App-Server-Thread
bei Bedarf fort. `/reset` löscht die OpenClaw-Sitzungsbindung für diesen Thread.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn
die Erkennung fehlschlägt oder das Zeitlimit erreicht wird, verwendet es den gebündelten Fallback-Katalog:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Sie können die Erkennung unter `plugins.entries.codex.config.discovery` abstimmen:

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

Deaktivieren Sie die Erkennung, wenn Sie möchten, dass der Start Codex nicht abfragt und beim
Fallback-Katalog bleibt:

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

Sie können diesen Standard beibehalten und nur die native Codex-Richtlinie abstimmen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

| Feld                | Standard                                 | Bedeutung                                                                |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.         |
| `command`           | `"codex"`                                | Ausführbare Datei für stdio-Transport.                                   |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumente für stdio-Transport.                                           |
| `url`               | nicht gesetzt                            | WebSocket-App-Server-URL.                                                |
| `authToken`         | nicht gesetzt                            | Bearer-Token für WebSocket-Transport.                                    |
| `headers`           | `{}`                                     | Zusätzliche WebSocket-Header.                                            |
| `requestTimeoutMs`  | `60000`                                  | Timeout für Control-Plane-Aufrufe des App-Servers.                       |
| `approvalPolicy`    | `"never"`                                | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzen/Turn gesendet wird. |
| `sandbox`           | `"workspace-write"`                      | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzen gesendet wird. |
| `approvalsReviewer` | `"user"`                                 | Verwenden Sie `"guardian_subagent"`, damit Codex native Genehmigungen durch Guardian prüfen lässt. |
| `serviceTier`       | nicht gesetzt                            | Optionale Codex-Service-Stufe, zum Beispiel `"priority"`.                |

Die älteren Umgebungsvariablen funktionieren für lokale Tests weiterhin als Fallbacks, wenn
das passende Konfigurationsfeld nicht gesetzt ist:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Für wiederholbare Bereitstellungen wird Konfiguration bevorzugt.

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

Validierung eines reinen Codex-Harness mit deaktiviertem PI-Fallback:

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

Das Wechseln von Modellen bleibt von OpenClaw gesteuert. Wenn eine OpenClaw-Sitzung an
einen vorhandenen Codex-Thread angehängt ist, sendet der nächste Turn erneut das aktuell ausgewählte
`codex/*`-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und die Service-Stufe an den
App-Server. Der Wechsel von `codex/gpt-5.4` zu `codex/gpt-5.2` behält die Thread-Bindung bei, fordert
Codex aber auf, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert auf jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-App-Server-Konnektivität, Modelle, Konto, Ratenlimits, MCP-Server und Skills.
- `/codex models` listet Live-Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen vorhandenen Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu verdichten.
- `/codex review` startet die native Codex-Prüfung für den angehängten Thread.
- `/codex account` zeigt Konto- und Ratenlimitstatus.
- `/codex mcp` listet den MCP-Server-Status des Codex-App-Servers auf.
- `/codex skills` listet Skills des Codex-App-Servers auf.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die das Harness für normale
Turns verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-`codex/*`-Modell an den App-Server und lässt den erweiterten
Verlauf aktiviert.

Die Befehlsoberfläche erfordert Codex-App-Server `0.118.0` oder neuer. Einzelne
Control-Methoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder benutzerdefinierter App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Tools, Medien und Verdichtung

Das Codex-Harness ändert nur den Low-Level-Executor für eingebettete Agent-Turns.

OpenClaw erstellt weiterhin die Tool-Liste und empfängt dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgabe von Messaging-Tools
laufen weiterhin über den normalen OpenClaw-Zustellungspfad.

Wenn das ausgewählte Modell das Codex-Harness verwendet, wird die native Thread-
Verdichtung an den Codex-App-Server delegiert. OpenClaw behält ein Transkript-Spiegelbild
für Kanalverlauf, Suche, `/new`, `/reset` und zukünftiges Wechseln von Modell oder
Harness. Das Spiegelbild enthält den Benutzer-Prompt, den finalen Assistententext und
leichtgewichtige Codex-Reasoning- oder Plan-Einträge, wenn der App-Server diese ausgibt.

Die Medienerzeugung erfordert kein PI. Bilderzeugung, Video, Musik, PDF, TTS und
Media Understanding verwenden weiterhin die passenden Provider-/Modell-Einstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht in `/model`:** Aktivieren Sie `plugins.entries.codex.enabled`,
setzen Sie ein `codex/*`-Modell-Ref oder prüfen Sie, ob `plugins.allow` `codex` ausschließt.

**OpenClaw fällt auf PI zurück:** Setzen Sie `embeddedHarness.fallback: "none"` oder
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` während des Testens.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, sodass der App-Server-Handshake
Version `0.118.0` oder neuer meldet.

**Die Modellerkennung ist langsam:** Verringern Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**Der WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und dass der entfernte App-Server dieselbe Protokollversion des Codex-App-Servers spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist erwartet. Das Codex-Harness übernimmt nur
`codex/*`-Modell-Refs.

## Verwandt

- [Agent Harness Plugins](/de/plugins/sdk-agent-harness)
- [Model Providers](/de/concepts/model-providers)
- [Configuration Reference](/de/gateway/configuration-reference)
- [Testing](/de/help/testing#live-codex-app-server-harness-smoke)
