---
read_when:
    - Sie möchten das gebündelte Codex-App-Server-Harness verwenden
    - Sie benötigen Codex-Modell-Refs und Konfigurationsbeispiele
    - Sie möchten den Pi-Fallback für reine Codex-Bereitstellungen deaktivieren
summary: Führe eingebettete Agent-Turns von OpenClaw über das gebündelte Codex-App-Server-Harness aus
title: Codex-Harness
x-i18n:
    generated_at: "2026-04-22T06:23:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45dbd39a7d8ebb3a39d8dca3a5125c07b7168d1658ca07b85792645fb98613c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex-Harness

Das gebündelte `codex`-Plugin ermöglicht es OpenClaw, eingebettete Agent-Turns über den
Codex-App-Server statt über das integrierte Pi-Harness auszuführen.

Verwenden Sie dies, wenn Codex die Low-Level-Agent-Session steuern soll: Modell-
Erkennung, natives Thread-Resume, native Compaction und App-Server-Ausführung.
OpenClaw steuert weiterhin Chat-Kanäle, Session-Dateien, Modellauswahl, Tools,
Genehmigungen, Medienzustellung und die sichtbare Transkriptspiegelung.

Das Harness ist standardmäßig deaktiviert. Es wird nur ausgewählt, wenn das `codex`-Plugin
aktiviert ist und das aufgelöste Modell ein `codex/*`-Modell ist, oder wenn Sie
explizit `embeddedHarness.runtime: "codex"` oder `OPENCLAW_AGENT_RUNTIME=codex` erzwingen.
Wenn Sie niemals `codex/*` konfigurieren, behalten vorhandene Pi-, OpenAI-, Anthropic-, Gemini-, local-
und Custom-Provider-Ausführungen ihr aktuelles Verhalten bei.

## Wählen Sie das richtige Modellpräfix

OpenClaw hat separate Pfade für OpenAI- und Codex-ähnlichen Zugriff:

| Modell-Ref            | Runtime-Pfad                                | Verwenden Sie dies, wenn                                                   |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| `openai/gpt-5.4`      | OpenAI-Provider über OpenClaw/Pi-Plumbing   | Sie direkten OpenAI Platform API-Zugriff mit `OPENAI_API_KEY` möchten.     |
| `openai-codex/gpt-5.4` | OpenAI Codex OAuth-Provider über Pi        | Sie ChatGPT/Codex OAuth ohne das Codex-App-Server-Harness möchten.         |
| `codex/gpt-5.4`       | Gebündelter Codex-Provider plus Codex-Harness | Sie native Codex-App-Server-Ausführung für den eingebetteten Agent-Turn möchten. |

Das Codex-Harness beansprucht nur `codex/*`-Modell-Refs. Vorhandene `openai/*`,
`openai-codex/*`, Anthropic-, Gemini-, xAI-, local- und Custom-Provider-Refs behalten
ihre normalen Pfade bei.

## Anforderungen

- OpenClaw mit dem verfügbaren gebündelten `codex`-Plugin.
- Codex-App-Server `0.118.0` oder neuer.
- Für den App-Server-Prozess verfügbare Codex-Authentifizierung.

Das Plugin blockiert ältere oder versionierungslose App-Server-Handshakes. Das hält
OpenClaw auf der Protokolloberfläche, gegen die es getestet wurde.

Für Live- und Docker-Smoke-Tests kommt die Authentifizierung üblicherweise von `OPENAI_API_KEY`, plus
optionalen Codex-CLI-Dateien wie `~/.codex/auth.json` und
`~/.codex/config.toml`. Verwenden Sie dasselbe Auth-Material, das Ihr lokaler Codex-App-Server
verwendet.

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

Wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie `codex` auch dort auf:

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
auch automatisch das gebündelte `codex`-Plugin. Der explizite Plugin-Eintrag ist in gemeinsam genutzten Konfigurationen
weiterhin nützlich, weil er die Bereitstellungsabsicht deutlich macht.

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
- Wenn ein Nicht-Codex-Modell ausgewählt ist, bleibt Pi das Kompatibilitäts-Harness.

## Reine Codex-Bereitstellungen

Deaktivieren Sie den Pi-Fallback, wenn Sie nachweisen müssen, dass jeder eingebettete Agent-Turn
das Codex-Harness verwendet:

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

Umgebungsüberschreibung:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Wenn der Fallback deaktiviert ist, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist,
das angeforderte Modell kein `codex/*`-Ref ist, der App-Server zu alt ist oder der
App-Server nicht gestartet werden kann.

## Codex pro Agent

Sie können einen Agenten zu einem reinen Codex-Agenten machen, während der Standard-Agent die normale
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

Verwenden Sie normale Session-Befehle, um Agenten und Modelle zu wechseln. `/new` erstellt eine neue
OpenClaw-Session, und das Codex-Harness erstellt oder setzt seinen Sidecar-App-Server-
Thread bei Bedarf fort. `/reset` löscht die OpenClaw-Session-Bindung für diesen Thread.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Wenn
die Erkennung fehlschlägt oder ein Timeout auftritt, verwendet es den gebündelten Fallback-Katalog:

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

Deaktivieren Sie die Erkennung, wenn Sie möchten, dass beim Start kein Codex abgefragt wird und stattdessen der
Fallback-Katalog verwendet wird:

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

Standardmäßig fordert OpenClaw Codex auf, native Genehmigungen anzufordern. Sie können diese
Richtlinie weiter anpassen, zum Beispiel verschärfen und Prüfungen über den
guardian leiten:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

| Feld                | Standardwert                              | Bedeutung                                                                |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                 | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.         |
| `command`           | `"codex"`                                 | Ausführbare Datei für stdio-Transport.                                   |
| `args`              | `["app-server", "--listen", "stdio://"]`  | Argumente für stdio-Transport.                                           |
| `url`               | nicht gesetzt                             | WebSocket-App-Server-URL.                                                |
| `authToken`         | nicht gesetzt                             | Bearer-Token für WebSocket-Transport.                                    |
| `headers`           | `{}`                                      | Zusätzliche WebSocket-Header.                                            |
| `requestTimeoutMs`  | `60000`                                   | Timeout für App-Server-Control-Plane-Aufrufe.                            |
| `approvalPolicy`    | `"on-request"`                            | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Resume/Turn gesendet wird. |
| `sandbox`           | `"workspace-write"`                       | Nativer Codex-Sandbox-Modus, der an Thread-Start/Resume gesendet wird.   |
| `approvalsReviewer` | `"user"`                                  | Verwenden Sie `"guardian_subagent"`, damit Codex guardian native Genehmigungen prüfen kann. |
| `serviceTier`       | nicht gesetzt                             | Optionale Codex-Service-Stufe, zum Beispiel `"priority"`.                |

Die älteren Umgebungsvariablen funktionieren weiterhin als Fallbacks für lokale Tests, wenn
das passende Konfigurationsfeld nicht gesetzt ist:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

Für wiederholbare Bereitstellungen wird die Konfiguration bevorzugt.

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

Validierung eines reinen Codex-Harness mit deaktiviertem Pi-Fallback:

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

Von guardian geprüfte Codex-Genehmigungen:

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

Die Modellumschaltung bleibt von OpenClaw gesteuert. Wenn eine OpenClaw-Session an einen vorhandenen
Codex-Thread angehängt ist, sendet der nächste Turn das aktuell ausgewählte
`codex/*`-Modell, den Provider, die Genehmigungsrichtlinie, die Sandbox und die Service-Stufe erneut an den
App-Server. Beim Wechsel von `codex/gpt-5.4` zu `codex/gpt-5.2` bleibt die
Thread-Bindung erhalten, aber Codex wird aufgefordert, mit dem neu ausgewählten Modell fortzufahren.

## Codex-Befehl

Das gebündelte Plugin registriert `/codex` als autorisierten Slash-Befehl. Er ist
generisch und funktioniert auf jedem Kanal, der OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` zeigt Live-App-Server-Konnektivität, Modelle, Konto, Ratenlimits, MCP-Server und Skills.
- `/codex models` listet Live-Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet aktuelle Codex-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Session an einen vorhandenen Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu komprimieren.
- `/codex review` startet eine native Codex-Prüfung für den angehängten Thread.
- `/codex account` zeigt Konto- und Ratenlimit-Status an.
- `/codex mcp` listet den MCP-Server-Status des Codex-App-Servers auf.
- `/codex skills` listet die Skills des Codex-App-Servers auf.

`/codex resume` schreibt dieselbe Sidecar-Bindungsdatei, die das Harness für
normale Turns verwendet. Bei der nächsten Nachricht setzt OpenClaw diesen Codex-Thread fort, übergibt das
aktuell ausgewählte OpenClaw-`codex/*`-Modell an den App-Server und lässt den erweiterten
Verlauf aktiviert.

Die Befehlsoberfläche erfordert Codex-App-Server `0.118.0` oder neuer. Einzelne
Steuerungsmethoden werden als `unsupported by this Codex app-server` gemeldet, wenn ein
zukünftiger oder benutzerdefinierter App-Server diese JSON-RPC-Methode nicht bereitstellt.

## Tools, Medien und Compaction

Das Codex-Harness ändert nur den Low-Level-Executor für eingebettete Agenten.

OpenClaw erstellt weiterhin die Tool-Liste und erhält dynamische Tool-Ergebnisse vom
Harness. Text, Bilder, Video, Musik, TTS, Genehmigungen und Ausgaben von Messaging-Tools
laufen weiterhin über den normalen OpenClaw-Zustellungspfad.

Wenn das ausgewählte Modell das Codex-Harness verwendet, wird die native Thread-Compaction an den
Codex-App-Server delegiert. OpenClaw behält eine Transkriptspiegelung für den Kanalverlauf,
die Suche, `/new`, `/reset` und zukünftiges Modell- oder Harness-Umschalten bei. Die
Spiegelung enthält den Benutzer-Prompt, den endgültigen Assistant-Text und leichtgewichtige Codex-
Reasoning- oder Plan-Einträge, wenn der App-Server sie ausgibt.

Für die Mediengenerierung ist Pi nicht erforderlich. Bild-, Video-, Musik-, PDF-, TTS- und Medienverständnis
verwenden weiterhin die passenden Provider-/Modelleinstellungen wie
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` und
`messages.tts`.

## Fehlerbehebung

**Codex erscheint nicht in `/model`:** Aktivieren Sie `plugins.entries.codex.enabled`,
setzen Sie einen `codex/*`-Modell-Ref, oder prüfen Sie, ob `plugins.allow` `codex` ausschließt.

**OpenClaw verwendet Pi statt Codex:** Wenn kein Codex-Harness die Ausführung übernimmt,
kann OpenClaw Pi als Kompatibilitäts-Backend verwenden. Setzen Sie
`embeddedHarness.runtime: "codex"`, um die Codex-Auswahl beim Testen zu erzwingen, oder
`embeddedHarness.fallback: "none"`, damit ein Fehler auftritt, wenn kein Plugin-Harness passt. Sobald
der Codex-App-Server ausgewählt ist, werden seine Fehler direkt ohne zusätzliche
Fallback-Konfiguration angezeigt.

**Der App-Server wird abgelehnt:** Aktualisieren Sie Codex, sodass der App-Server-Handshake
Version `0.118.0` oder neuer meldet.

**Die Modellerkennung ist langsam:** Verringern Sie `plugins.entries.codex.config.discovery.timeoutMs`
oder deaktivieren Sie die Erkennung.

**Der WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`
und ob der Remote-App-Server dieselbe Codex-App-Server-Protokollversion spricht.

**Ein Nicht-Codex-Modell verwendet Pi:** Das ist zu erwarten. Das Codex-Harness übernimmt nur
`codex/*`-Modell-Refs.

## Verwandt

- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Modell-Provider](/de/concepts/model-providers)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
- [Tests](/de/help/testing#live-codex-app-server-harness-smoke)
