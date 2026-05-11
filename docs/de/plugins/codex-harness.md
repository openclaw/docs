---
read_when:
    - Sie möchten den gebündelten Codex-App-Server-Harness verwenden
    - Sie benötigen Codex-Harness-Konfigurationsbeispiele
    - Sie möchten, dass Bereitstellungen, die ausschließlich Codex verwenden, fehlschlagen, statt auf PI zurückzufallen.
summary: Eingebettete OpenClaw-Agenten-Durchläufe über den mitgelieferten Codex-App-Server-Harness ausführen
title: Codex-Harness
x-i18n:
    generated_at: "2026-05-11T20:33:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete OpenAI-Agent-Turns
über Codex app-server statt über das integrierte PI-Harness auszuführen.

Verwenden Sie das Codex-Harness, wenn Codex die Low-Level-Agent-Sitzung
übernehmen soll: natives Thread-Resume, native Tool-Fortsetzung, native Compaction und
Ausführung über app-server. OpenClaw verwaltet weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl, dynamische OpenClaw-Tools, Genehmigungen, Medienzustellung und die sichtbare
Transkriptspiegelung.

Die normale Einrichtung verwendet kanonische OpenAI-Modellreferenzen wie `openai/gpt-5.5`.
Konfigurieren Sie keine `openai-codex/gpt-*`-Modellreferenzen. Legen Sie die OpenAI-Agent-Authentifizierungsreihenfolge
unter `auth.order.openai` ab; ältere `openai-codex:*`-Profile und
`auth.order.openai-codex`-Einträge werden für bestehende Installationen weiterhin unterstützt.

OpenClaw startet Codex app-server-Threads mit nativem Codex-Code-Modus und
aktiviertem Nur-Code-Modus. Dadurch bleiben aufgeschobene/durchsuchbare dynamische OpenClaw-Tools
innerhalb der eigenen Code-Ausführungs- und Tool-Suchoberfläche von Codex, statt einen
Tool-Such-Wrapper im PI-Stil über Codex zu legen.

Für die umfassendere Aufteilung von Modell/Provider/Runtime beginnen Sie mit
[Agent-Runtimes](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Runtime, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Wenn Ihre Konfiguration `plugins.allow` verwendet, fügen Sie `codex` hinzu.
- Codex app-server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig eine kompatible
  Codex app-server-Binärdatei, sodass lokale `codex`-Befehle in `PATH` den
  normalen Harness-Start nicht beeinflussen.
- Codex-Authentifizierung verfügbar über `openclaw models auth login --provider openai-codex`,
  ein app-server-Konto im Codex-Home des Agenten oder ein explizites Codex-API-Schlüssel-
  Authentifizierungsprofil.

Informationen zu Authentifizierungspriorität, Umgebungsisolation, benutzerdefinierten app-server-Befehlen, Modell-
Discovery und allen Konfigurationsfeldern finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Schnellstart

Die meisten Benutzer, die Codex in OpenClaw verwenden möchten, wollen diesen Pfad: Melden Sie sich mit einem
ChatGPT/Codex-Abonnement an, aktivieren Sie das gebündelte `codex`-Plugin und verwenden Sie eine
kanonische `openai/gpt-*`-Modellreferenz.

Melden Sie sich mit Codex OAuth an:

```bash
openclaw models auth login --provider openai-codex
```

Aktivieren Sie das gebündelte `codex`-Plugin und wählen Sie ein OpenAI-Agent-Modell aus:

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

Starten Sie das Gateway neu, nachdem Sie die Plugin-Konfiguration geändert haben. Wenn ein bestehender Chat bereits
eine Sitzung hat, verwenden Sie `/new` oder `/reset`, bevor Sie Runtime-Änderungen testen, damit der nächste
Turn das Harness aus der aktuellen Konfiguration auflöst.

## Konfiguration

Die Schnellstart-Konfiguration ist die minimale funktionsfähige Codex-Harness-Konfiguration. Legen Sie Codex-
Harness-Optionen in der OpenClaw-Konfiguration fest und verwenden Sie die CLI nur für die Codex-Authentifizierung:

| Bedarf                                 | Festlegen                                                                        | Wo                                 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Harness aktivieren                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw-Konfiguration             |
| Plugin-Installation mit Allowlist behalten | `codex` in `plugins.allow` aufnehmen                                             | OpenClaw-Konfiguration             |
| OpenAI-Agent-Turns über Codex routen   | `agents.defaults.model` oder `agents.list[].model` als `openai/gpt-*`            | OpenClaw-Agent-Konfiguration       |
| Mit Codex OAuth anmelden               | `openclaw models auth login --provider openai-codex`                             | CLI-Authentifizierungsprofil       |
| API-Schlüssel-Backup für Codex-Läufe hinzufügen | `openai:*`-API-Schlüsselprofil nach Abonnement-Authentifizierung in `auth.order.openai` auflisten | CLI-Authentifizierungsprofil + OpenClaw-Konfiguration |
| Geschlossen fehlschlagen, wenn Codex nicht verfügbar ist | Provider- oder Modell-`agentRuntime.id: "codex"`                                 | OpenClaw-Modell-/Provider-Konfiguration |
| Direkten OpenAI-API-Verkehr verwenden  | Provider- oder Modell-`agentRuntime.id: "pi"` mit normaler OpenAI-Authentifizierung | OpenClaw-Modell-/Provider-Konfiguration |
| app-server-Verhalten abstimmen         | `plugins.entries.codex.config.appServer.*`                                       | Codex-Plugin-Konfiguration         |
| Native Codex-Plugin-Apps aktivieren    | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-Plugin-Konfiguration         |
| Codex Computer Use aktivieren          | `plugins.entries.codex.config.computerUse.*`                                     | Codex-Plugin-Konfiguration         |

Verwenden Sie `openai/gpt-*`-Modellreferenzen für Codex-gestützte OpenAI-Agent-Turns. Bevorzugen Sie
`auth.order.openai` für eine Reihenfolge mit Abonnement zuerst und API-Schlüssel als Backup. Bestehende
`openai-codex:*`-Authentifizierungsprofile und `auth.order.openai-codex` bleiben gültig, schreiben Sie jedoch
keine neuen `openai-codex/gpt-*`-Modellreferenzen.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In dieser Form laufen beide Profile für `openai/gpt-*`-Agent-Turns weiterhin über Codex.
Der API-Schlüssel ist nur ein Authentifizierungs-Fallback, keine Aufforderung, zu PI oder
reinen OpenAI Responses zu wechseln.

Der Rest dieser Seite behandelt gängige Varianten, zwischen denen Benutzer wählen müssen:
Bereitstellungsform, Fail-Closed-Routing, Guardian-Genehmigungsrichtlinie, native Codex-
Plugins und Computer Use. Vollständige Optionslisten, Standardwerte, Enums, Discovery,
Umgebungsisolation, Timeouts und app-server-Transportfelder finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Codex-Runtime überprüfen

Verwenden Sie `/status` in dem Chat, in dem Sie Codex erwarten. Ein Codex-gestützter OpenAI-Agent-
Turn zeigt:

```text
Runtime: OpenAI Codex
```

Prüfen Sie dann den Codex app-server-Status:

```text
/codex status
/codex models
```

`/codex status` meldet app-server-Konnektivität, Konto, Ratenlimits, MCP-
Server und Skills. `/codex models` listet den Live-Katalog des Codex app-server für
das Harness und Konto auf. Wenn `/status` unerwartet ist, siehe
[Fehlerbehebung](#troubleshooting).

## Routing und Modellauswahl

Halten Sie Provider-Referenzen und Runtime-Richtlinie getrennt:

- Verwenden Sie `openai/gpt-*` für OpenAI-Agent-Turns über Codex.
- Verwenden Sie `openai-codex/gpt-*` nicht in der Konfiguration. Führen Sie `openclaw doctor --fix` aus, um
  Legacy-Referenzen und veraltete Sitzungsrouten-Pins zu reparieren.
- `agentRuntime.id: "codex"` ist für den normalen OpenAI-Automatikmodus optional, aber nützlich,
  wenn eine Bereitstellung geschlossen fehlschlagen soll, falls Codex nicht verfügbar ist.
- `agentRuntime.id: "pi"` schaltet einen Provider oder ein Modell auf direktes PI-Verhalten um, wenn
  dies beabsichtigt ist.
- `/codex ...` steuert native Codex app-server-Unterhaltungen aus dem Chat.
- ACP/acpx ist ein separater externer Harness-Pfad. Verwenden Sie ihn nur, wenn der Benutzer
  ACP/acpx oder einen externen Harness-Adapter anfordert.

Gängiges Befehlsrouting:

| Benutzerabsicht                 | Verwenden                               |
| ------------------------------- | --------------------------------------- |
| Aktuellen Chat anhängen         | `/codex bind [--cwd <path>]`            |
| Bestehenden Codex-Thread fortsetzen | `/codex resume <thread-id>`             |
| Codex-Threads auflisten oder filtern | `/codex threads [filter]`               |
| Nur Codex-Feedback senden       | `/codex diagnostics [note]`             |
| ACP/acpx-Aufgabe starten        | ACP/acpx-Sitzungsbefehle, nicht `/codex` |

| Anwendungsfall                                      | Konfigurieren                                                    | Überprüfen                               | Hinweise                           |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------- | ---------------------------------- |
| ChatGPT/Codex-Abonnement mit nativer Codex-Runtime  | `openai/gpt-*` plus aktiviertes `codex`-Plugin                   | `/status` zeigt `Runtime: OpenAI Codex`  | Empfohlener Pfad                   |
| Geschlossen fehlschlagen, wenn Codex nicht verfügbar ist | Provider- oder Modell-`agentRuntime.id: "codex"`                 | Turn schlägt fehl statt PI-Fallback      | Für reine Codex-Bereitstellungen verwenden |
| Direkter OpenAI-API-Schlüssel-Verkehr über PI        | Provider- oder Modell-`agentRuntime.id: "pi"` und normale OpenAI-Authentifizierung | `/status` zeigt PI-Runtime               | Nur verwenden, wenn PI beabsichtigt ist |
| Legacy-Konfiguration                                 | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` schreibt sie um  | Neue Konfiguration nicht so schreiben |
| ACP/acpx-Codex-Adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP-Aufgaben-/Sitzungsstatus             | Getrennt vom nativen Codex-Harness |

`agents.defaults.imageModel` folgt derselben Präfixaufteilung. Verwenden Sie `openai/gpt-*`
für die normale OpenAI-Route und `codex/gpt-*` nur, wenn Bildverständnis
über einen begrenzten Codex app-server-Turn laufen soll. Verwenden Sie
`openai-codex/gpt-*` nicht; doctor schreibt dieses Legacy-Präfix zu `openai/gpt-*` um.

## Bereitstellungsmuster

### Einfache Codex-Bereitstellung

Verwenden Sie die Schnellstart-Konfiguration, wenn alle OpenAI-Agent-Turns standardmäßig Codex
verwenden sollen.

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
    },
  },
}
```

### Bereitstellung mit gemischten Providern

Diese Form behält Claude als Standard-Agent bei und fügt einen benannten Codex-Agenten hinzu:

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

Mit dieser Konfiguration verwendet der `main`-Agent seinen normalen Provider-Pfad und der
`codex`-Agent verwendet Codex app-server.

### Fail-Closed-Codex-Bereitstellung

Für OpenAI-Agent-Turns wird `openai/gpt-*` bereits zu Codex aufgelöst, wenn das
gebündelte Plugin verfügbar ist. Fügen Sie eine explizite Runtime-Richtlinie hinzu, wenn Sie eine schriftliche
Fail-Closed-Regel möchten:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Mit erzwungenem Codex schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der
app-server zu alt ist oder der app-server nicht starten kann.

## app-server-Richtlinie

Standardmäßig startet das Plugin die von OpenClaw verwaltete Codex-Binärdatei lokal mit stdio-
Transport. Setzen Sie `appServer.command` nur, wenn Sie absichtlich eine
andere ausführbare Datei ausführen möchten. Verwenden Sie WebSocket-Transport nur, wenn bereits ein app-server
anderswo läuft:

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
          },
        },
      },
    },
  },
}
```

Lokale stdio-App-Server-Sitzungen verwenden standardmäßig die vertrauenswürdige lokale Operator-Haltung:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Wenn lokale Codex-Anforderungen diese
implizite YOLO-Haltung nicht zulassen, wählt OpenClaw stattdessen erlaubte
Guardian-Berechtigungen aus. Wenn für die Sitzung eine OpenClaw-Sandbox aktiv
ist, grenzt OpenClaw Codex-`danger-full-access` auf Codex-`workspace-write` ein,
damit native Codex-Code-Mode-Turns innerhalb des sandboxierten Arbeitsbereichs
bleiben.

Verwenden Sie den Guardian-Modus, wenn Sie native automatische Codex-Reviews vor
Sandbox-Ausbrüchen oder zusätzlichen Berechtigungen möchten:

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

Der Guardian-Modus wird auf Codex-App-Server-Genehmigungen erweitert,
normalerweise `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"`, wenn die
lokalen Anforderungen diese Werte zulassen.

Für jedes App-Server-Feld, Authentifizierungsreihenfolge, Umgebungsisolierung,
Erkennung und Timeout-Verhalten siehe [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Befehle und Diagnosen

Das gebündelte Plugin registriert `/codex` als Slash-Befehl auf jedem Kanal, der
OpenClaw-Textbefehle unterstützt.

Gängige Formen:

- `/codex status` prüft App-Server-Konnektivität, Modelle, Konto, Ratenlimits,
  MCP-Server und Skills.
- `/codex models` listet Live-Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet aktuelle Codex-App-Server-Threads auf.
- `/codex resume <thread-id>` verbindet die aktuelle OpenClaw-Sitzung mit einem
  vorhandenen Codex-Thread.
- `/codex compact` fordert den Codex-App-Server auf, den verbundenen Thread zu
  komprimieren.
- `/codex review` startet die native Codex-Review für den verbundenen Thread.
- `/codex diagnostics [note]` fragt vor dem Senden von Codex-Feedback für den
  verbundenen Thread nach.
- `/codex account` zeigt Konto- und Ratenlimitstatus an.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet Codex-App-Server-Skills auf.

Beginnen Sie bei den meisten Support-Berichten mit `/diagnostics [note]` in der
Unterhaltung, in der der Fehler aufgetreten ist. Dadurch wird ein
Gateway-Diagnosebericht erstellt und für Codex-Harness-Sitzungen um Genehmigung
gebeten, das relevante Codex-Feedback-Paket zu senden. Siehe
[Diagnoseexport](/de/gateway/diagnostics) für das Datenschutzmodell und das
Gruppenchat-Verhalten.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie speziell den
Codex-Feedback-Upload für den aktuell verbundenen Thread ohne das vollständige
Gateway-Diagnosepaket möchten.

### Codex-Threads lokal untersuchen

Die schnellste Möglichkeit, einen fehlerhaften Codex-Lauf zu untersuchen, ist
oft, den nativen Codex-Thread direkt zu öffnen:

```bash
codex resume <thread-id>
```

Die Thread-ID erhalten Sie aus der abgeschlossenen `/diagnostics`-Antwort,
`/codex binding` oder `/codex threads [filter]`.

Upload-Mechanik und Diagnosegrenzen auf Runtime-Ebene finden Sie unter
[Codex-Harness-Runtime](/de/plugins/codex-harness-runtime#codex-feedback-upload).

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Geordnete OpenAI-Authentifizierungsprofile für den Agenten, vorzugsweise unter
   `auth.order.openai`. Vorhandene `openai-codex:*`-Profil-IDs bleiben gültig.
2. Das vorhandene Konto des App-Servers im Codex-Home dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und
   OpenAI-Authentifizierung weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines
ChatGPT-Abonnements erkennt, entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY`
aus dem gestarteten Codex-Kindprozess. Dadurch bleiben API-Schlüssel auf
Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar, ohne dass
native Codex-App-Server-Turns versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüsselprofile und lokaler stdio-Env-Key-Fallback verwenden
App-Server-Login statt geerbter Kindprozess-Umgebung. WebSocket-App-Server-
Verbindungen erhalten keinen Gateway-Env-API-Key-Fallback; verwenden Sie ein
explizites Authentifizierungsprofil oder das eigene Konto des entfernten
App-Servers.

Wenn ein Abonnementprofil ein Codex-Nutzungslimit erreicht, zeichnet OpenClaw die
Zurücksetzungszeit auf, sofern Codex eine meldet, und versucht das nächste
geordnete Authentifizierungsprofil für denselben Codex-Lauf. Nach Ablauf der
Zurücksetzungszeit wird das Abonnementprofil wieder nutzbar, ohne das gewählte
`openai/gpt-*`-Modell oder die Codex-Runtime zu ändern.

Wenn ein Deployment zusätzliche Umgebungsisolierung benötigt, fügen Sie diese
Variablen zu `appServer.clearEnv` hinzu:

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

`appServer.clearEnv` betrifft nur den gestarteten Codex-App-Server-Kindprozess.

Codex-Dynamic-Tools verwenden standardmäßig `searchable`-Laden. OpenClaw stellt
keine Dynamic-Tools bereit, die native Codex-Arbeitsbereichsoperationen
duplizieren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` und
`update_plan`. Die verbleibenden OpenClaw-Integrationstools wie Messaging,
Sitzungen, Medien, Cron, Browser, Nodes, Gateway, `heartbeat_respond` und
`web_search` sind über die Codex-Toolsuche unter dem Namespace `openclaw`
verfügbar, wodurch der anfängliche Modellkontext kleiner bleibt.
`sessions_yield` und reine Message-Tool-Quellantworten bleiben direkt, weil dies
Turn-Control-Verträge sind. Heartbeat-Kollaborationsanweisungen weisen Codex an,
vor dem Beenden eines Heartbeat-Turns nach `heartbeat_respond` zu suchen, wenn
das Tool noch nicht geladen ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu
einem benutzerdefinierten Codex-App-Server herstellen, der zurückgestellte
Dynamic-Tools nicht suchen kann, oder wenn Sie die vollständige Tool-Nutzlast
debuggen.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard       | Bedeutung                                                                                           |
| -------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Verwenden Sie `"direct"`, um OpenClaw-Dynamic-Tools direkt in den anfänglichen Codex-Toolkontext zu legen. |
| `codexDynamicToolsExclude` | `[]`           | Zusätzliche OpenClaw-Dynamic-Tool-Namen, die aus Codex-App-Server-Turns ausgelassen werden sollen. |
| `codexPlugins`             | deaktiviert    | Native Codex-Plugin-/App-Unterstützung für migrierte, aus Quellen installierte kuratierte Plugins. |

Unterstützte `appServer`-Felder:

| Feld                          | Standard                                               | Bedeutung                                                                                                                                                                                                                               |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                        |
| `command`                     | verwaltetes Codex-Binary                               | Ausführbare Datei für stdio-Transport. Lassen Sie dies ungesetzt, um das verwaltete Binary zu verwenden; setzen Sie es nur für eine explizite Überschreibung.                                                                           |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumente für stdio-Transport.                                                                                                                                                                                                         |
| `url`                         | nicht gesetzt                                          | WebSocket-App-Server-URL.                                                                                                                                                                                                              |
| `authToken`                   | nicht gesetzt                                          | Bearer-Token für WebSocket-Transport.                                                                                                                                                                                                  |
| `headers`                     | `{}`                                                   | Zusätzliche WebSocket-Header.                                                                                                                                                                                                          |
| `clearEnv`                    | `[]`                                                   | Zusätzliche Umgebungsvariablennamen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat. `CODEX_HOME` und `HOME` sind für die Codex-Isolierung pro Agent von OpenClaw bei lokalen Starts reserviert. |
| `requestTimeoutMs`            | `60000`                                                | Timeout für Control-Plane-Aufrufe des App-Servers.                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Ruhefenster nach einer turn-bezogenen Codex-App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet. Erhöhen Sie diesen Wert für langsame Synthesephasen nach Tools oder nur mit Status.                                      |
| `mode`                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht verbieten | Voreinstellung für YOLO- oder guardian-geprüfte Ausführung. Lokale stdio-Anforderungen, die `danger-full-access`, `never`-Genehmigung oder den `user`-Reviewer auslassen, machen den impliziten Standard zu Guardian.                 |
| `approvalPolicy`              | `"never"` oder eine erlaubte Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzen/Turn gesendet wird. Guardian-Standards bevorzugen `"on-request"`, wenn erlaubt.                                                                                   |
| `sandbox`                     | `"danger-full-access"` oder eine erlaubte Guardian-Sandbox | Nativer Codex-Sandboxmodus, der an Thread-Start/Fortsetzen gesendet wird. Guardian-Standards bevorzugen `"workspace-write"`, wenn erlaubt, sonst `"read-only"`. Wenn eine OpenClaw-Sandbox aktiv ist, wird `danger-full-access` auf `"workspace-write"` eingegrenzt. |
| `approvalsReviewer`           | `"user"` oder ein erlaubter Guardian-Reviewer          | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungs-Prompts reviewt, wenn erlaubt, andernfalls `guardian_subagent` oder `user`. `guardian_subagent` bleibt ein Legacy-Alias.                                                |
| `serviceTier`                 | nicht gesetzt                                          | Optionale Codex-App-Server-Service-Stufe. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, `null` entfernt die Überschreibung, und das Legacy-`"fast"` wird als `"priority"` akzeptiert.                |

Von OpenClaw verwaltete dynamische Tool-Aufrufe sind unabhängig von
`appServer.requestTimeoutMs` begrenzt: Codex-`item/tool/call`-Anfragen verwenden standardmäßig einen 30-Sekunden-
OpenClaw-Watchdog. Ein positives `timeoutMs`-Argument pro Aufruf verlängert
oder verkürzt dieses spezifische Tool-Budget. Das Tool `image_generate` verwendet außerdem
`agents.defaults.imageGenerationModel.timeoutMs`, wenn der Tool-Aufruf kein
eigenes Timeout angibt, und das Medienverständnis-Tool `image` verwendet
`tools.media.image.timeoutSeconds` oder seinen 60-Sekunden-Medienstandard. Dynamische Tool-
Budgets sind auf 600000 ms begrenzt. Bei einem Timeout bricht OpenClaw das Tool-Signal
ab, sofern unterstützt, und gibt eine fehlgeschlagene Dynamic-Tool-Antwort an Codex zurück, damit der Turn
fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine Codex-Turn-bezogene App-Server-Anfrage geantwortet hat, erwartet der Harness
außerdem, dass Codex den nativen Turn mit `turn/completed` beendet. Wenn der
App-Server nach dieser Antwort für `appServer.turnCompletionIdleTimeoutMs` stumm bleibt,
unterbricht OpenClaw den Codex-Turn nach bestem Aufwand, zeichnet ein diagnostisches
Timeout auf und gibt die OpenClaw-Sitzungslane frei, damit nachfolgende Chat-Nachrichten
nicht hinter einem veralteten nativen Turn eingereiht werden. Jede nicht-terminale Benachrichtigung für denselben
Turn, einschließlich `rawResponseItem/completed`, deaktiviert diesen kurzen Watchdog,
weil Codex nachgewiesen hat, dass der Turn noch aktiv ist; der längere terminale Watchdog
schützt weiterhin wirklich feststeckende Turns. Timeout-Diagnosen enthalten die
letzte App-Server-Benachrichtigungsmethode und, für rohe Assistentenantwort-Items, den
Item-Typ, die Rolle, die ID und eine begrenzte Vorschau des Assistententexts.

Umgebungsüberschreibungen bleiben für lokales Testen verfügbar:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` umgeht die verwaltete Binärdatei, wenn
`appServer.command` nicht gesetzt ist.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen
`plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmaliges lokales Testen. Konfiguration wird
für wiederholbare Deployments bevorzugt, weil sie das Plugin-Verhalten in derselben
geprüften Datei wie die übrige Codex-Harness-Einrichtung hält.

## Native Codex-Plugins

Native Codex-Plugin-Unterstützung verwendet die eigenen App- und Plugin-
Fähigkeiten des Codex-App-Servers im selben Codex-Thread wie der OpenClaw-Harness-Turn. OpenClaw
übersetzt Codex-Plugins nicht in synthetische dynamische OpenClaw-Tools vom Typ `codex_plugin_*`.

`codexPlugins` betrifft nur Sitzungen, die den nativen Codex-Harness auswählen. Es
hat keine Auswirkung auf PI-Läufe, normale OpenAI-Provider-Läufe, ACP-Konversations-
Bindings oder andere Harnesses.

Minimale migrierte Konfiguration:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Die Thread-App-Konfiguration wird berechnet, wenn OpenClaw eine Codex-Harness-Sitzung
herstellt oder ein veraltetes Codex-Thread-Binding ersetzt. Sie wird nicht bei jedem Turn
neu berechnet. Nachdem Sie `codexPlugins` geändert haben, verwenden Sie `/new`, `/reset`
oder starten Sie das Gateway neu, damit zukünftige Codex-Harness-Sitzungen mit dem aktualisierten App-Set
starten.

Informationen zu Migrationseignung, App-Inventar, Richtlinie für destruktive Aktionen,
Elicitations und nativen Plugin-Diagnosen finden Sie unter
[Native Codex-Plugins](/de/plugins/codex-native-plugins).

## Computernutzung

Computernutzung wird in einem eigenen Einrichtungsleitfaden behandelt:
[Codex-Computernutzung](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw vendort die Desktop-Steuerungs-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, verifiziert, dass der
MCP-Server `computer-use` verfügbar ist, und lässt dann Codex die nativen MCP-
Tool-Aufrufe während Turns im Codex-Modus übernehmen.

## Laufzeitgrenzen

Der Codex-Harness ändert nur den Low-Level-Executor des eingebetteten Agenten.

- Dynamische OpenClaw-Tools werden unterstützt. Codex fordert OpenClaw auf, diese
  Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.
- Codex-native Shell-, Patch-, MCP- und native App-Tools werden von Codex verwaltet.
  OpenClaw kann ausgewählte native Ereignisse über das unterstützte
  Relay beobachten oder blockieren, schreibt native Tool-Argumente jedoch nicht um.
- Codex verwaltet native Compaction. OpenClaw hält einen Transcript-Spiegel für Kanal-
  Verlauf, Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Wechsel.
- Mediengenerierung, Medienverständnis, TTS, Genehmigungen und Messaging-Tool-
  Ausgabe laufen weiterhin über die passenden OpenClaw-Provider-/Modelleinstellungen.
- `tool_result_persist` gilt für von OpenClaw verwaltete Transcript-Tool-Ergebnisse, nicht
  für Codex-native Tool-Ergebnisdatensätze.

Informationen zu Hook-Schichten, unterstützten V1-Oberflächen, nativer Berechtigungsbehandlung, Queue-
Steuerung, Mechanik zum Hochladen von Codex-Feedback und Compaction-Details finden Sie unter
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime).

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist bei
neuen Konfigurationen zu erwarten. Wählen Sie ein `openai/gpt-*`-Modell, aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** Stellen Sie sicher, dass die Modellreferenz
`openai/gpt-*` beim offiziellen OpenAI-Provider ist und dass das Codex-Plugin
installiert und aktiviert ist. Wenn Sie beim Testen strikten Nachweis benötigen, setzen Sie Provider- oder
Modell-`agentRuntime.id: "codex"`. Eine erzwungene Codex-Laufzeit schlägt fehl, statt
auf PI zurückzufallen.

**Legacy-`openai-codex/*`-Konfiguration bleibt bestehen:** Führen Sie `openclaw doctor --fix` aus.
Doctor schreibt Legacy-Modellreferenzen zu `openai/*` um, entfernt veraltete Sitzungs- und
Whole-Agent-Laufzeit-Pins und bewahrt vorhandene Auth-Profil-Überschreibungen.

**Der App-Server wird abgelehnt:** Verwenden Sie Codex-App-Server `0.125.0` oder neuer.
Prereleases derselben Version oder Versionen mit Build-Suffix wie
`0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil OpenClaw die
stabile Protokolluntergrenze `0.125.0` testet.

**`/codex status` kann keine Verbindung herstellen:** Prüfen Sie, dass das gebündelte `codex`-Plugin
aktiviert ist, dass `plugins.allow` es einschließt, wenn eine Allowlist konfiguriert ist, und
dass alle benutzerdefinierten `appServer.command`, `url`, `authToken` oder Header gültig sind.

**Modellerkennung ist langsam:** Senken Sie
`plugins.entries.codex.config.discovery.timeoutMs` oder deaktivieren Sie die Erkennung. Siehe
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference#model-discovery).

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`,
Header und dass der Remote-App-Server dieselbe Codex-App-Server-
Protokollversion spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist zu erwarten, sofern Provider- oder Modell-Laufzeit-
Richtlinien es nicht an einen anderen Harness routen. Einfache Nicht-OpenAI-Provider-Refs bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad.

**Computernutzung ist installiert, aber Tools werden nicht ausgeführt:** Prüfen Sie
`/codex computer-use status` aus einer frischen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; falls es weiterhin auftritt, starten Sie
das Gateway neu, um veraltete native Hook-Registrierungen zu löschen. Siehe
[Codex-Computernutzung](/de/plugins/codex-computer-use#troubleshooting).

## Verwandt

- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex-Computernutzung](/de/plugins/codex-computer-use)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Plugin-Hooks](/de/plugins/hooks)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Status](/de/cli/status)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
