---
read_when:
    - Sie benötigen jedes Konfigurationsfeld des Codex-Harness
    - Sie ändern das Transport-, Authentifizierungs-, Erkennungs- oder Timeout-Verhalten des App-Servers
    - Sie debuggen den Start des Codex-Harness, die Modellerkennung oder die Umgebungsisolation
summary: Konfigurations-, Authentifizierungs-, Discovery- und App-Server-Referenz für den Codex-Harness
title: Codex-Harness-Referenz
x-i18n:
    generated_at: "2026-05-10T19:42:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Diese Referenz behandelt die detaillierte Konfiguration für das mitgelieferte `codex`-Plugin. Für Einrichtung und Routing-Entscheidungen beginnen Sie mit
[Codex-Harness](/de/plugins/codex-harness).

## Plugin-Konfigurationsoberfläche

Alle Codex-Harness-Einstellungen befinden sich unter `plugins.entries.codex.config`.

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Unterstützte Felder auf oberster Ebene:

| Feld                       | Standardwert             | Bedeutung                                                                                                                                                         |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | aktiviert                | Model-Discovery-Einstellungen für Codex-App-Server `model/list`.                                                                                                  |
| `appServer`                | verwalteter stdio-App-Server | Einstellungen für Transport, Befehl, Authentifizierung, Genehmigung, Sandbox und Timeouts.                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Tool-Kontext zu legen.                                                     |
| `codexDynamicToolsExclude` | `[]`                     | Zusätzliche Namen dynamischer OpenClaw-Tools, die in Codex-App-Server-Turns ausgelassen werden sollen.                                                            |
| `codexPlugins`             | deaktiviert              | Native Codex-Plugin/App-Unterstützung für migrierte, aus dem Quelltext installierte kuratierte Plugins. Siehe [Native Codex-Plugins](/de/plugins/codex-native-plugins). |
| `computerUse`              | deaktiviert              | Einrichtung von Codex Computer Use. Siehe [Codex Computer Use](/de/plugins/codex-computer-use).                                                                      |

## App-Server-Transport

Standardmäßig startet OpenClaw die verwaltete Codex-Binärdatei, die mit dem mitgelieferten Plugin ausgeliefert wird:

```bash
codex app-server --listen stdio://
```

Dadurch bleibt die App-Server-Version an das mitgelieferte `codex`-Plugin gebunden, statt an eine separate Codex-CLI, die zufällig lokal installiert ist. Setzen Sie `appServer.command` nur, wenn Sie bewusst eine andere ausführbare Datei ausführen möchten.

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
            url: "ws://gateway-host:39175",
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

| Feld                          | Standardwert                                           | Bedeutung                                                                                                                                                                                                         |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                  |
| `command`                     | verwaltete Codex-Binärdatei                            | Ausführbare Datei für stdio-Transport. Nicht setzen, um die verwaltete Binärdatei zu verwenden.                                                                                                                   |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumente für stdio-Transport.                                                                                                                                                                                    |
| `url`                         | nicht gesetzt                                          | WebSocket-App-Server-URL.                                                                                                                                                                                         |
| `authToken`                   | nicht gesetzt                                          | Bearer-Token für WebSocket-Transport.                                                                                                                                                                             |
| `headers`                     | `{}`                                                   | Zusätzliche WebSocket-Header.                                                                                                                                                                                     |
| `clearEnv`                    | `[]`                                                   | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung erstellt hat.                                                  |
| `requestTimeoutMs`            | `60000`                                                | Timeout für App-Server-Control-Plane-Aufrufe.                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Ruhefenster nach einer turn-bezogenen App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                            |
| `mode`                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht untersagen | Voreinstellung für YOLO- oder Guardian-geprüfte Ausführung.                                                                                                                                                       |
| `approvalPolicy`              | `"never"` oder eine zulässige Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die an Thread-Start, Wiederaufnahme und Turn gesendet wird.                                                                                                                  |
| `sandbox`                     | `"danger-full-access"` oder eine zulässige Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der an Thread-Start und Wiederaufnahme gesendet wird.                                                                                                                                 |
| `approvalsReviewer`           | `"user"` oder ein zulässiger Guardian-Prüfer            | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, wenn dies erlaubt ist.                                                                                                        |
| `defaultWorkspaceDir`         | aktuelles Prozessverzeichnis                           | Workspace, der von `/codex bind` verwendet wird, wenn `--cwd` ausgelassen wird.                                                                                                                                    |
| `serviceTier`                 | nicht gesetzt                                          | Optionaler Codex-App-Server-Service-Tier. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, und `null` entfernt die Überschreibung. Das veraltete `"fast"` wird als `"priority"` akzeptiert. |

Das Plugin blockiert ältere oder nicht versionierte App-Server-Handshakes. Der Codex-App-Server muss die stabile Version `0.125.0` oder neuer melden.

## Genehmigungs- und Sandbox-Modi

Lokale stdio-App-Server-Sitzungen verwenden standardmäßig den YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Diese vertrauenswürdige lokale Operator-Haltung ermöglicht es unbeaufsichtigten OpenClaw-Turns und Heartbeats, ohne native Genehmigungsaufforderungen fortzufahren, die niemand beantworten kann.

Wenn die lokale Systemanforderungsdatei von Codex implizite YOLO-Genehmigungs-, Prüfer- oder Sandbox-Werte untersagt, behandelt OpenClaw den impliziten Standard stattdessen als Guardian und wählt zulässige Guardian-Berechtigungen aus. Hostnamenabgleichende `[[remote_sandbox_config]]`-Einträge in derselben Anforderungsdatei werden bei der Entscheidung über den Sandbox-Standard berücksichtigt.

Setzen Sie `appServer.mode: "guardian"` für Guardian-geprüfte Codex-Genehmigungen:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Die Voreinstellung `guardian` wird zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert, wenn diese Werte zulässig sind. Einzelne Richtlinienfelder überschreiben `mode`. Der ältere Prüferwert `guardian_subagent` wird weiterhin als Kompatibilitätsalias akzeptiert, neue Konfigurationen sollten jedoch `auto_review` verwenden.

## Authentifizierung und Umgebungsisolation

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das bestehende App-Server-Konto im Codex-Home dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung weiterhin erforderlich ist.

Wenn OpenClaw ein ChatGPT-Abonnement-artiges Codex-Authentifizierungsprofil erkennt, entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY` aus dem gestarteten Codex-Kindprozess. Dadurch bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar, ohne dass native Codex-App-Server-Turns versehentlich über die API abgerechnet werden.

Explizite Codex-API-Schlüsselprofile und lokaler stdio-Env-Key-Fallback verwenden App-Server-Login statt geerbter Kindprozessumgebung. WebSocket-App-Server-Verbindungen erhalten keinen Gateway-Env-API-Schlüssel-Fallback; verwenden Sie ein explizites Authentifizierungsprofil oder das eigene Konto des entfernten App-Servers.

Starts des stdio-App-Servers erben standardmäßig die Prozessumgebung von OpenClaw, aber OpenClaw besitzt die Codex-App-Server-Kontobrücke und setzt sowohl `CODEX_HOME` als auch `HOME` auf agentenspezifische Verzeichnisse unterhalb des OpenClaw-Status dieses Agenten. Codex' eigener Skill-Loader liest `$CODEX_HOME/skills` und `$HOME/.agents/skills`, daher sind beide Werte für lokale App-Server-Starts isoliert. Dadurch bleiben Codex-native Skills, Plugins, Konfiguration, Konten und Thread-Status auf den OpenClaw-Agenten beschränkt, statt aus dem persönlichen Codex-CLI-Home des Operators einzufließen.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots laufen weiterhin über OpenClaws eigene Plugin-Registry und den Skill-Loader. Persönliche Codex-CLI-Assets tun dies nicht. Wenn Sie nützliche Codex-CLI-Skills oder Plugins haben, die Teil eines OpenClaw-Agenten werden sollen, inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv` wirkt sich nur auf den gestarteten Codex-App-Server-Kindprozess aus.
`CODEX_HOME` und `HOME` bleiben für OpenClaws agentenspezifische Codex-Isolation bei lokalen Starts reserviert.

## Dynamische Tools

Codex Dynamic Tools verwenden standardmäßig `searchable`-Loading. OpenClaw stellt keine dynamischen Tools bereit, die native Codex-Workspace-Operationen duplizieren:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Verbleibende OpenClaw-Integrationstools wie Messaging, Sessions, Medien, Cron,
Browser, Nodes, Gateway, `heartbeat_respond` und `web_search` sind über die
Codex-Toolsuche im Namespace `openclaw` verfügbar. Dadurch bleibt der anfängliche
Modellkontext kleiner. `sessions_yield` und nur auf Message-Tools bezogene
Quellenantworten bleiben direkt, weil dies Turn-Control-Verträge sind.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu
einem benutzerdefinierten Codex-App-Server herstellen, der verzögert geladene
dynamische Tools nicht durchsuchen kann, oder wenn Sie die vollständige
Tool-Payload debuggen.

## Zeitüberschreitungen

Dynamische Tool-Aufrufe, die OpenClaw gehören, werden unabhängig von
`appServer.requestTimeoutMs` begrenzt. Jede Codex-Anfrage `item/tool/call`
verwendet die erste verfügbare Zeitüberschreitung in dieser Reihenfolge:

- Ein positives `timeoutMs`-Argument pro Aufruf.
- Für `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Für das Medienverständnis-Tool `image`, `tools.media.image.timeoutSeconds`,
  umgerechnet in Millisekunden, oder den Medienstandardwert von 60 Sekunden.
- Den Standardwert für dynamische Tools von 30 Sekunden.

Budgets für dynamische Tools sind auf 600000 ms begrenzt. Bei einer
Zeitüberschreitung bricht OpenClaw, sofern unterstützt, das Tool-Signal ab und
gibt eine fehlgeschlagene Antwort des dynamischen Tools an Codex zurück, damit
der Turn fortgesetzt werden kann, statt die Session in `processing` zu belassen.

Nachdem OpenClaw auf eine turn-bezogene App-Server-Anfrage von Codex geantwortet
hat, erwartet das Harness außerdem, dass Codex den nativen Turn mit
`turn/completed` beendet. Wenn der App-Server nach dieser Antwort für
`appServer.turnCompletionIdleTimeoutMs` still bleibt, unterbricht OpenClaw nach
bestem Bemühen den Codex-Turn, zeichnet eine Diagnose-Zeitüberschreitung auf und
gibt die OpenClaw-Session-Lane frei, damit nachfolgende Chatnachrichten nicht
hinter einem veralteten nativen Turn in die Warteschlange geraten.

Jede nicht terminale Benachrichtigung für denselben Turn, einschließlich
`rawResponseItem/completed`, deaktiviert diesen kurzen Watchdog, weil Codex
nachgewiesen hat, dass der Turn noch aktiv ist. Der längere terminale Watchdog
schützt weiterhin vor tatsächlich hängenden Turns. Zeitüberschreitungsdiagnosen
enthalten die letzte App-Server-Benachrichtigungsmethode und, bei rohen
Assistentenantwortelementen, den Elementtyp, die Rolle, die ID sowie eine
begrenzte Vorschau des Assistententexts.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen.
Die Modellverfügbarkeit gehört dem Codex-App-Server, daher kann sich die Liste
ändern, wenn OpenClaw die gebündelte Version von `@openai/codex` aktualisiert
oder wenn eine Bereitstellung `appServer.command` auf eine andere
Codex-Binärdatei verweist. Die Verfügbarkeit kann außerdem kontobezogen sein.
Verwenden Sie `/codex models` auf einem laufenden Gateway, um den Live-Katalog
für dieses Harness und dieses Konto zu sehen.

Wenn die Erkennung fehlschlägt oder eine Zeitüberschreitung auftritt, verwendet
OpenClaw einen gebündelten Fallback-Katalog für:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Das aktuell gebündelte Harness ist `@openai/codex` `0.130.0`. Eine
`model/list`-Abfrage gegen diesen gebündelten App-Server ergab:

| Modell-ID             | Standard | Ausgeblendet | Eingabemodalitäten | Reasoning-Aufwände       |
| --------------------- | -------- | ------------ | ------------------ | ------------------------ |
| `gpt-5.5`             | Ja       | Nein         | Text, Bild         | low, medium, high, xhigh |
| `gpt-5.4`             | Nein     | Nein         | Text, Bild         | low, medium, high, xhigh |
| `gpt-5.4-mini`        | Nein     | Nein         | Text, Bild         | low, medium, high, xhigh |
| `gpt-5.3-codex`       | Nein     | Nein         | Text, Bild         | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | Nein     | Nein         | Text               | low, medium, high, xhigh |
| `gpt-5.2`             | Nein     | Nein         | Text, Bild         | low, medium, high, xhigh |

Ausgeblendete Modelle können vom App-Server-Katalog für interne oder
spezialisierte Abläufe zurückgegeben werden, sie sind jedoch keine normalen
Auswahlen im Modellselektor.

Passen Sie die Erkennung unter `plugins.entries.codex.config.discovery` an:

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

Deaktivieren Sie die Erkennung, wenn der Start Codex nicht abfragen und nur den
Fallback-Katalog verwenden soll:

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

## Workspace-Bootstrap-Dateien

Codex verarbeitet `AGENTS.md` selbst über die native Projekt-Dokumenterkennung.
OpenClaw schreibt keine synthetischen Codex-Projekt-Dokumentdateien und hängt
nicht von Codex-Fallback-Dateinamen für Persona-Dateien ab, weil Codex-Fallbacks
nur gelten, wenn `AGENTS.md` fehlt.

Für Workspace-Parität in OpenClaw löst das Codex-Harness die anderen
Bootstrap-Dateien auf, darunter `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`,
`HEARTBEAT.md`, `BOOTSTRAP.md` und `MEMORY.md`, sofern vorhanden, und leitet sie
über Codex-Developer-Anweisungen bei `thread/start` und `thread/resume` weiter.
Dadurch bleiben Workspace-Persona- und Profilkontext auf der nativen
verhaltensprägenden Codex-Lane sichtbar, ohne `AGENTS.md` zu duplizieren.

## Umgebungsüberschreibungen

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Die
Konfiguration wird für wiederholbare Bereitstellungen bevorzugt, weil sie das
Plugin-Verhalten in derselben geprüften Datei hält wie die restliche Einrichtung
des Codex-Harness.

## Verwandt

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex Computer Use](/de/plugins/codex-computer-use)
- [OpenAI-Provider](/de/providers/openai)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
