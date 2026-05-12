---
read_when:
    - Sie möchten das mitgelieferte Codex-App-Server-Harness verwenden
    - Sie benötigen Konfigurationsbeispiele für den Codex-Harness
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, statt auf PI zurückzufallen
summary: Eingebettete Agentendurchläufe von OpenClaw über das mitgelieferte Codex-App-Server-Harness ausführen
title: Codex-Harness
x-i18n:
    generated_at: "2026-05-12T08:45:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 62023998d817a557bd6434e3ab47f3b99b97fdea93a8984b78b7bd1738a61f92
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin lässt OpenClaw eingebettete OpenAI-Agent-Durchläufe
über den Codex-App-Server statt über den integrierten PI-Harness ausführen.

Verwenden Sie den Codex-Harness, wenn Codex die Low-Level-Agent-Sitzung
übernehmen soll: native Thread-Wiederaufnahme, native Tool-Fortsetzung, native
Compaction und App-Server-Ausführung. OpenClaw übernimmt weiterhin Chat-Kanäle,
Sitzungsdateien, Modellauswahl, dynamische OpenClaw-Tools, Genehmigungen,
Medienauslieferung und die sichtbare Transkriptspiegelung.

Die normale Einrichtung verwendet kanonische OpenAI-Modellreferenzen wie
`openai/gpt-5.5`. Konfigurieren Sie keine `openai-codex/gpt-*`-Modellreferenzen.
Legen Sie die OpenAI-Agent-Auth-Reihenfolge unter `auth.order.openai` ab; ältere
`openai-codex:*`-Profile und `auth.order.openai-codex`-Einträge werden für
bestehende Installationen weiterhin unterstützt.

OpenClaw startet Codex-App-Server-Threads mit dem nativen Code-Modus von Codex
und aktiviertem Nur-Code-Modus. Dadurch bleiben zurückgestellte/durchsuchbare
dynamische OpenClaw-Tools innerhalb der eigenen Codeausführungs- und
Tool-Suchoberfläche von Codex, statt oberhalb von Codex einen
PI-artigen Tool-Such-Wrapper hinzuzufügen.

Für die umfassendere Aufteilung von Modell, Provider und Laufzeitumgebung
beginnen Sie mit [Agent-Laufzeitumgebungen](/de/concepts/agent-runtimes). Die
Kurzfassung lautet: `openai/gpt-5.5` ist die Modellreferenz, `codex` ist die
Laufzeitumgebung, und Telegram, Discord, Slack oder ein anderer Kanal bleibt die
Kommunikationsoberfläche.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Wenn Ihre Konfiguration `plugins.allow` verwendet, schließen Sie `codex` ein.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet
  standardmäßig eine kompatible Codex-App-Server-Binärdatei, daher wirken sich
  lokale `codex`-Befehle in `PATH` nicht auf den normalen Harness-Start aus.
- Codex-Authentifizierung verfügbar über `openclaw models auth login --provider openai-codex`,
  ein App-Server-Konto im Codex-Home des Agenten oder ein explizites
  Codex-API-Schlüssel-Auth-Profil.

Informationen zu Auth-Priorität, Umgebungsisolation, benutzerdefinierten
App-Server-Befehlen, Modellerkennung und allen Konfigurationsfeldern finden Sie
in der [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Schnellstart

Die meisten Benutzer, die Codex in OpenClaw verwenden möchten, wählen diesen
Pfad: Melden Sie sich mit einem ChatGPT/Codex-Abonnement an, aktivieren Sie das
gebündelte `codex`-Plugin und verwenden Sie eine kanonische
`openai/gpt-*`-Modellreferenz.

Mit Codex OAuth anmelden:

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

Starten Sie den Gateway neu, nachdem Sie die Plugin-Konfiguration geändert
haben. Wenn ein bestehender Chat bereits eine Sitzung hat, verwenden Sie `/new`
oder `/reset`, bevor Sie Laufzeitänderungen testen, damit der nächste Durchlauf
den Harness aus der aktuellen Konfiguration auflöst.

## Konfiguration

Die Schnellstart-Konfiguration ist die minimal funktionsfähige
Codex-Harness-Konfiguration. Legen Sie Codex-Harness-Optionen in der
OpenClaw-Konfiguration fest und verwenden Sie die CLI nur für die
Codex-Authentifizierung:

| Bedarf                                 | Festlegen                                                                        | Wo                                 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Harness aktivieren                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw-Konfiguration             |
| Plugin-Installation mit Allowlist beibehalten | `codex` in `plugins.allow` einschließen                                          | OpenClaw-Konfiguration             |
| OpenAI-Agent-Durchläufe über Codex leiten | `agents.defaults.model` oder `agents.list[].model` als `openai/gpt-*`            | OpenClaw-Agent-Konfiguration       |
| Mit Codex OAuth anmelden               | `openclaw models auth login --provider openai-codex`                             | CLI-Auth-Profil                    |
| API-Schlüssel-Backup für Codex-Läufe hinzufügen | `openai:*`-API-Schlüsselprofil, nach Abonnement-Auth in `auth.order.openai` aufgeführt | CLI-Auth-Profil + OpenClaw-Konfiguration |
| Geschlossen fehlschlagen, wenn Codex nicht verfügbar ist | Provider oder Modell `agentRuntime.id: "codex"`                                  | OpenClaw-Modell/Provider-Konfiguration |
| Direkten OpenAI-API-Verkehr verwenden  | Provider oder Modell `agentRuntime.id: "pi"` mit normaler OpenAI-Auth            | OpenClaw-Modell/Provider-Konfiguration |
| App-Server-Verhalten abstimmen         | `plugins.entries.codex.config.appServer.*`                                       | Codex-Plugin-Konfiguration         |
| Native Codex-Plugin-Apps aktivieren    | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-Plugin-Konfiguration         |
| Codex Computer Use aktivieren          | `plugins.entries.codex.config.computerUse.*`                                     | Codex-Plugin-Konfiguration         |

Verwenden Sie `openai/gpt-*`-Modellreferenzen für Codex-gestützte
OpenAI-Agent-Durchläufe. Bevorzugen Sie `auth.order.openai` für eine Reihenfolge
mit Abonnement zuerst und API-Schlüssel als Backup. Bestehende
`openai-codex:*`-Auth-Profile und `auth.order.openai-codex` bleiben gültig,
aber schreiben Sie keine neuen `openai-codex/gpt-*`-Modellreferenzen.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In dieser Form laufen beide Profile für `openai/gpt-*`-Agent-Durchläufe weiterhin
über Codex. Der API-Schlüssel ist nur ein Auth-Fallback, keine Aufforderung, zu
PI oder einfachen OpenAI Responses zu wechseln.

Der Rest dieser Seite behandelt gängige Varianten, zwischen denen Benutzer
wählen müssen: Bereitstellungsform, Fail-closed-Routing,
Guardian-Genehmigungsrichtlinie, native Codex-Plugins und Computer Use. Die
vollständigen Optionslisten, Standardwerte, Enums, Erkennung,
Umgebungsisolation, Timeouts und App-Server-Transportfelder finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Codex-Laufzeitumgebung verifizieren

Verwenden Sie `/status` in dem Chat, in dem Sie Codex erwarten. Ein
Codex-gestützter OpenAI-Agent-Durchlauf zeigt:

```text
Runtime: OpenAI Codex
```

Prüfen Sie anschließend den Codex-App-Server-Status:

```text
/codex status
/codex models
```

`/codex status` meldet App-Server-Konnektivität, Konto, Ratelimits,
MCP-Server und Skills. `/codex models` listet den Live-Codex-App-Server-Katalog
für den Harness und das Konto auf. Wenn `/status` unerwartet ist, siehe
[Fehlerbehebung](#troubleshooting).

## Routing und Modellauswahl

Halten Sie Provider-Referenzen und Laufzeitrichtlinien getrennt:

- Verwenden Sie `openai/gpt-*` für OpenAI-Agent-Durchläufe über Codex.
- Verwenden Sie `openai-codex/gpt-*` nicht in der Konfiguration. Führen Sie
  `openclaw doctor --fix` aus, um Legacy-Referenzen und veraltete Sitzungsrouten-Pins
  zu reparieren.
- `agentRuntime.id: "codex"` ist für den normalen OpenAI-Automodus optional,
  aber nützlich, wenn eine Bereitstellung geschlossen fehlschlagen soll, falls
  Codex nicht verfügbar ist.
- `agentRuntime.id: "pi"` schaltet einen Provider oder ein Modell auf direktes
  PI-Verhalten um, wenn dies beabsichtigt ist.
- `/codex ...` steuert native Codex-App-Server-Unterhaltungen aus dem Chat.
- ACP/acpx ist ein separater externer Harness-Pfad. Verwenden Sie ihn nur, wenn
  der Benutzer ACP/acpx oder einen externen Harness-Adapter anfordert.

Gängiges Befehls-Routing:

| Benutzerabsicht                  | Verwenden                               |
| ------------------------------- | --------------------------------------- |
| Aktuellen Chat anhängen          | `/codex bind [--cwd <path>]`            |
| Bestehenden Codex-Thread fortsetzen | `/codex resume <thread-id>`             |
| Codex-Threads auflisten oder filtern | `/codex threads [filter]`               |
| Nur Codex-Feedback senden        | `/codex diagnostics [note]`             |
| Eine ACP/acpx-Aufgabe starten    | ACP/acpx-Sitzungsbefehle, nicht `/codex` |

| Anwendungsfall                                      | Konfigurieren                                                    | Verifizieren                            | Hinweise                           |
| --------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| ChatGPT/Codex-Abonnement mit nativer Codex-Laufzeitumgebung | `openai/gpt-*` plus aktiviertes `codex`-Plugin                   | `/status` zeigt `Runtime: OpenAI Codex` | Empfohlener Pfad                   |
| Geschlossen fehlschlagen, wenn Codex nicht verfügbar ist | Provider oder Modell `agentRuntime.id: "codex"`                  | Durchlauf schlägt statt PI-Fallback fehl | Für reine Codex-Bereitstellungen verwenden |
| Direkter OpenAI-API-Schlüssel-Verkehr über PI       | Provider oder Modell `agentRuntime.id: "pi"` und normale OpenAI-Auth | `/status` zeigt PI-Laufzeitumgebung     | Nur verwenden, wenn PI beabsichtigt ist |
| Legacy-Konfiguration                                | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` schreibt sie um | Neue Konfiguration nicht so schreiben |
| ACP/acpx-Codex-Adapter                              | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP-Aufgaben/Sitzungsstatus             | Getrennt vom nativen Codex-Harness |

`agents.defaults.imageModel` folgt derselben Präfixaufteilung. Verwenden Sie
`openai/gpt-*` für die normale OpenAI-Route und `codex/gpt-*` nur, wenn
Bildverständnis über einen begrenzten Codex-App-Server-Durchlauf laufen soll.
Verwenden Sie nicht `openai-codex/gpt-*`; doctor schreibt dieses Legacy-Präfix
zu `openai/gpt-*` um.

## Bereitstellungsmuster

### Einfache Codex-Bereitstellung

Verwenden Sie die Schnellstart-Konfiguration, wenn alle OpenAI-Agent-Durchläufe
standardmäßig Codex verwenden sollen.

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

### Gemischte Provider-Bereitstellung

Diese Form behält Claude als Standard-Agent bei und fügt einen benannten
Codex-Agenten hinzu:

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

Mit dieser Konfiguration verwendet der `main`-Agent seinen normalen
Provider-Pfad und der `codex`-Agent den Codex-App-Server.

### Fail-closed-Codex-Bereitstellung

Für OpenAI-Agent-Durchläufe wird `openai/gpt-*` bereits zu Codex aufgelöst, wenn
das gebündelte Plugin verfügbar ist. Fügen Sie eine explizite Laufzeitrichtlinie
hinzu, wenn Sie eine schriftliche Fail-closed-Regel wünschen:

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

Wenn Codex erzwungen wird, schlägt OpenClaw früh fehl, falls das Codex-Plugin
deaktiviert ist, der App-Server zu alt ist oder der App-Server nicht starten
kann.

## App-Server-Richtlinie

Standardmäßig startet das Plugin die von OpenClaw verwaltete Codex-Binärdatei
lokal mit stdio-Transport. Legen Sie `appServer.command` nur fest, wenn Sie
absichtlich eine andere ausführbare Datei ausführen möchten. Verwenden Sie
WebSocket-Transport nur, wenn bereits anderswo ein App-Server läuft:

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

Lokale stdio-App-Server-Sitzungen verwenden standardmäßig die vertrauenswürdige Haltung des lokalen Operators:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Wenn lokale Codex-Anforderungen diese
implizite YOLO-Haltung nicht zulassen, wählt OpenClaw stattdessen zulässige
Guardian-Berechtigungen aus. Wenn für die Sitzung eine OpenClaw-Sandbox aktiv
ist, schränkt OpenClaw Codex `danger-full-access` auf Codex `workspace-write`
ein, damit native Codex-Code-Mode-Turns innerhalb des Sandbox-Workspace bleiben.

Verwenden Sie den Guardian-Modus, wenn Sie native automatische Codex-Reviews vor
Sandbox-Ausbrüchen oder zusätzlichen Berechtigungen wünschen:

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

Der Guardian-Modus wird zu Codex-App-Server-Genehmigungen erweitert, in der Regel
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` und
`sandbox: "workspace-write"`, wenn die lokalen Anforderungen diese Werte zulassen.

Informationen zu jedem App-Server-Feld, zur Authentifizierungsreihenfolge,
Umgebungsisolation, Discovery und zum Timeout-Verhalten finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Befehle und Diagnose

Das gebündelte Plugin registriert `/codex` als Slash-Befehl in jedem Kanal, der
OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` prüft App-Server-Konnektivität, Modelle, Konto, Ratenlimits,
  MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex-App-Servers auf.
- `/codex threads [filter]` listet aktuelle Threads des Codex-App-Servers auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen
  vorhandenen Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu
  verdichten.
- `/codex review` startet eine native Codex-Review für den angehängten Thread.
- `/codex diagnostics [note]` fragt nach, bevor Codex-Feedback für den
  angehängten Thread gesendet wird.
- `/codex account` zeigt Konto- und Ratenlimitstatus an.
- `/codex mcp` listet den Status der MCP-Server des Codex-App-Servers auf.
- `/codex skills` listet Skills des Codex-App-Servers auf.

Beginnen Sie bei den meisten Support-Berichten mit `/diagnostics [note]` in der
Unterhaltung, in der der Fehler aufgetreten ist. Dadurch wird ein
Gateway-Diagnosebericht erstellt und bei Codex-Harness-Sitzungen eine Genehmigung
zum Senden des relevanten Codex-Feedback-Bundles angefordert. Informationen zum
Datenschutzmodell und zum Verhalten in Gruppenchats finden Sie unter
[Diagnoseexport](/de/gateway/diagnostics).

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie gezielt den
Codex-Feedback-Upload für den aktuell angehängten Thread ohne das vollständige
Gateway-Diagnosebundle wünschen.

### Codex-Threads lokal untersuchen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu untersuchen, besteht oft
darin, den nativen Codex-Thread direkt zu öffnen:

```bash
codex resume <thread-id>
```

Rufen Sie die Thread-ID aus der abgeschlossenen `/diagnostics`-Antwort,
`/codex binding` oder `/codex threads [filter]` ab.

Informationen zu Upload-Mechanik und Diagnosegrenzen auf Runtime-Ebene finden
Sie unter
[Codex-Harness-Runtime](/de/plugins/codex-harness-runtime#codex-feedback-upload).

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Geordnete OpenAI-Auth-Profile für den Agenten, vorzugsweise unter
   `auth.order.openai`. Vorhandene `openai-codex:*`-Profil-IDs bleiben gültig.
2. Das vorhandene Konto des App-Servers im Codex-Home dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Auth
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Auth-Profil im Stil eines ChatGPT-Abonnements erkennt,
entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY` aus dem gestarteten
Codex-Kindprozess. Dadurch bleiben API-Schlüssel auf Gateway-Ebene für
Embeddings oder direkte OpenAI-Modelle verfügbar, ohne dass native
Codex-App-Server-Turns versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüsselprofile und der lokale stdio-Fallback über
Umgebungsvariablenschlüssel verwenden die App-Server-Anmeldung statt der
geerbten Kindprozess-Umgebung. WebSocket-App-Server-Verbindungen erhalten keinen
Gateway-Fallback für API-Schlüssel aus der Umgebung; verwenden Sie ein
explizites Auth-Profil oder das eigene Konto des Remote-App-Servers.

Wenn ein Abonnementprofil ein Codex-Nutzungslimit erreicht, zeichnet OpenClaw
die Zurücksetzungszeit auf, sofern Codex eine meldet, und versucht für denselben
Codex-Lauf das nächste geordnete Auth-Profil. Nach Ablauf der Zurücksetzungszeit
wird das Abonnementprofil wieder nutzbar, ohne das ausgewählte `openai/gpt-*`-
Modell oder die Codex-Runtime zu ändern.

Wenn ein Deployment zusätzliche Umgebungsisolation benötigt, fügen Sie diese
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

`appServer.clearEnv` wirkt sich nur auf den gestarteten Kindprozess des
Codex-App-Servers aus.

Dynamische Codex-Tools verwenden standardmäßig `searchable`-Laden. OpenClaw
macht keine dynamischen Tools verfügbar, die native Codex-Workspace-Operationen
duplizieren: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` und
`update_plan`. Verbleibende OpenClaw-Integrationstools wie Messaging, Sitzungen,
Medien, Cron, Browser, Nodes, Gateway, `heartbeat_respond` und `web_search` sind
über die Codex-Toolsuche unter dem Namespace `openclaw` verfügbar, wodurch der
anfängliche Modellkontext kleiner bleibt.
`sessions_yield` und Quellantworten nur mit Message-Tool bleiben direkt, weil
sie Turn-Control-Verträge sind. Heartbeat-Kollaborationsanweisungen weisen Codex
an, vor dem Beenden eines Heartbeat-Turns nach `heartbeat_respond` zu suchen,
wenn das Tool noch nicht geladen ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu
einem benutzerdefinierten Codex-App-Server herstellen, der zurückgestellte
dynamische Tools nicht suchen kann, oder wenn Sie die vollständige Tool-Payload
debuggen.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standardwert   | Bedeutung                                                                                  |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `codexDynamicToolsLoading` | `"searchable"` | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Toolkontext zu legen. |
| `codexDynamicToolsExclude` | `[]`           | Zusätzliche Namen dynamischer OpenClaw-Tools, die in Codex-App-Server-Turns ausgelassen werden sollen. |
| `codexPlugins`             | deaktiviert    | Native Codex-Plugin-/App-Unterstützung für migrierte, quellinstallierte kuratierte Plugins. |

Unterstützte `appServer`-Felder:

| Feld                          | Standardwert                                          | Bedeutung                                                                                                                                                                                                                              |
| ----------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                             | `"stdio"` startet Codex; `"websocket"` verbindet mit `url`.                                                                                                                                                                            |
| `command`                     | verwaltete Codex-Binärdatei                           | Ausführbare Datei für den stdio-Transport. Lassen Sie den Wert nicht gesetzt, um die verwaltete Binärdatei zu verwenden; setzen Sie ihn nur für eine explizite Überschreibung.                                                         |
| `args`                        | `["app-server", "--listen", "stdio://"]`              | Argumente für den stdio-Transport.                                                                                                                                                                                                     |
| `url`                         | nicht festgelegt                                      | WebSocket-App-Server-URL.                                                                                                                                                                                                              |
| `authToken`                   | nicht festgelegt                                      | Bearer-Token für den WebSocket-Transport.                                                                                                                                                                                              |
| `headers`                     | `{}`                                                  | Zusätzliche WebSocket-Header.                                                                                                                                                                                                          |
| `clearEnv`                    | `[]`                                                  | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat. `CODEX_HOME` und `HOME` sind für OpenClaws Codex-Isolation pro Agent bei lokalen Starts reserviert. |
| `requestTimeoutMs`            | `60000`                                               | Timeout für App-Server-Control-Plane-Aufrufe.                                                                                                                                                                                          |
| `turnCompletionIdleTimeoutMs` | `60000`                                               | Ruhefenster nach einer turnbezogenen Codex-App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet. Erhöhen Sie diesen Wert für langsame Synthesephasen nach Tools oder nur mit Status.                                      |
| `mode`                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht untersagen | Voreinstellung für YOLO- oder Guardian-geprüfte Ausführung. Lokale stdio-Anforderungen, die `danger-full-access`, `never`-Genehmigung oder den `user`-Reviewer auslassen, machen den impliziten Standardwert zu Guardian.             |
| `approvalPolicy`              | `"never"` oder eine zulässige Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die an Thread-Start, Resume oder Turn gesendet wird. Guardian-Standardwerte bevorzugen `"on-request"`, wenn zulässig.                                                                             |
| `sandbox`                     | `"danger-full-access"` oder eine zulässige Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der an Thread-Start oder Resume gesendet wird. Guardian-Standardwerte bevorzugen `"workspace-write"`, wenn zulässig, andernfalls `"read-only"`. Wenn eine OpenClaw-Sandbox aktiv ist, wird `danger-full-access` auf `"workspace-write"` eingeschränkt. |
| `approvalsReviewer`           | `"user"` oder ein zulässiger Guardian-Reviewer         | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, wenn zulässig, andernfalls `guardian_subagent` oder `user`. `guardian_subagent` bleibt ein Legacy-Alias.                                          |
| `serviceTier`                 | nicht festgelegt                                      | Optionale Service-Stufe des Codex-App-Servers. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, `null` entfernt die Überschreibung, und das Legacy-`"fast"` wird als `"priority"` akzeptiert.          |

OpenClaw-eigene dynamische Tool-Aufrufe sind unabhängig von
`appServer.requestTimeoutMs` begrenzt: Codex-`item/tool/call`-Anfragen verwenden standardmäßig einen 30-sekündigen
OpenClaw-Watchdog. Ein positives `timeoutMs`-Argument pro Aufruf verlängert
oder verkürzt dieses spezifische Tool-Budget. Das `image_generate`-Tool verwendet außerdem
`agents.defaults.imageGenerationModel.timeoutMs`, wenn der Tool-Aufruf kein
eigenes Timeout bereitstellt, und das Medienverständnis-`image`-Tool verwendet
`tools.media.image.timeoutSeconds` oder seinen Medienstandard von 60 Sekunden. Dynamische Tool-
Budgets sind auf 600000 ms begrenzt. Bei einem Timeout bricht OpenClaw das Tool-Signal
ab, sofern unterstützt, und gibt eine fehlgeschlagene Dynamic-Tool-Antwort an Codex zurück,
damit der Turn fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine turn-bezogene App-Server-Anfrage von Codex geantwortet hat, erwartet das Harness
außerdem, dass Codex den nativen Turn mit `turn/completed` abschließt. Wenn der
App-Server nach dieser Antwort für `appServer.turnCompletionIdleTimeoutMs` still bleibt,
unterbricht OpenClaw den Codex-Turn nach bestem Bemühen, zeichnet ein diagnostisches
Timeout auf und gibt die OpenClaw-Sitzungsspur frei, sodass nachfolgende Chat-Nachrichten
nicht hinter einem veralteten nativen Turn eingereiht werden. Jede nicht-terminale Benachrichtigung für denselben
Turn, einschließlich `rawResponseItem/completed`, deaktiviert diesen kurzen Watchdog,
weil Codex nachgewiesen hat, dass der Turn noch aktiv ist; der längere terminale Watchdog
schützt weiterhin tatsächlich festhängende Turns. Globale App-Server-Benachrichtigungen,
wie Ratenlimit-Aktualisierungen, setzen den Turn-Idle-Fortschritt nicht zurück. Wenn Codex ein
abgeschlossenes `agentMessage`-Element ausgibt und dann ohne `turn/completed` still bleibt,
behandelt OpenClaw die Assistentenausgabe als effektiv abgeschlossen, unterbricht den nativen
Codex-Turn nach bestem Bemühen und gibt die Sitzungsspur frei. Timeout-
Diagnosen enthalten die letzte App-Server-Benachrichtigungsmethode und, für rohe
Assistentenantwortelemente, den Elementtyp, die Rolle, die ID und eine begrenzte Vorschau des Assistententexts.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Config wird
für wiederholbare Bereitstellungen bevorzugt, weil sie das Plugin-Verhalten in derselben
geprüften Datei hält wie den übrigen Codex-Harness-Aufbau.

## Native Codex-Plugins

Native Codex-Plugin-Unterstützung verwendet die eigenen App- und Plugin-
Fähigkeiten des Codex-App-Servers im selben Codex-Thread wie der OpenClaw-Harness-Turn. OpenClaw
übersetzt Codex-Plugins nicht in synthetische `codex_plugin_*` OpenClaw-
Dynamic Tools.

`codexPlugins` wirkt sich nur auf Sitzungen aus, die das native Codex-Harness auswählen. Es
hat keine Auswirkungen auf PI-Läufe, normale OpenAI-Provider-Läufe, ACP-Gesprächs-
Bindings oder andere Harnesses.

Minimale migrierte Config:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

Die Thread-App-Config wird berechnet, wenn OpenClaw eine Codex-Harness-Sitzung herstellt
oder ein veraltetes Codex-Thread-Binding ersetzt. Sie wird nicht bei jedem Turn neu berechnet.
Nach einer Änderung an `codexPlugins` verwenden Sie `/new`, `/reset` oder starten Sie den Gateway neu, damit
zukünftige Codex-Harness-Sitzungen mit dem aktualisierten App-Satz starten.

Informationen zu Migrationsfähigkeit, App-Inventar, Richtlinien für destruktive Aktionen,
Elicitations und nativen Plugin-Diagnosen finden Sie unter
[Native Codex-Plugins](/de/plugins/codex-native-plugins).

## Computer Use

Computer Use wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex Computer Use](/de/plugins/codex-computer-use).

Kurzfassung: OpenClaw vendort die Desktop-Control-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, verifiziert, dass der
`computer-use`-MCP-Server verfügbar ist, und lässt dann Codex während Codex-Modus-Turns
die nativen MCP-Tool-Aufrufe besitzen.

## Laufzeitgrenzen

Das Codex-Harness ändert nur den Low-Level-Executor des eingebetteten Agents.

- OpenClaw Dynamic Tools werden unterstützt. Codex bittet OpenClaw, diese
  Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.
- Codex-native Shell-, Patch-, MCP- und native App-Tools gehören Codex.
  OpenClaw kann ausgewählte native Ereignisse über den unterstützten
  Relay beobachten oder blockieren, schreibt native Tool-Argumente aber nicht um.
- Codex besitzt native Compaction. OpenClaw behält eine Transkriptspiegelung für Kanal-
  Verlauf, Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Wechsel.
- Mediengenerierung, Medienverständnis, TTS, Genehmigungen und Messaging-Tool-
  Ausgabe laufen weiterhin über die passenden OpenClaw-Provider-/Modelleinstellungen.
- `tool_result_persist` gilt für OpenClaw-eigene Transkript-Tool-Ergebnisse, nicht
  für Codex-native Tool-Ergebnisdatensätze.

Informationen zu Hook-Ebenen, unterstützten V1-Oberflächen, nativer Berechtigungsbehandlung, Queue-
Steuerung, Mechanik für Codex-Feedback-Uploads und Compaction-Details finden Sie unter
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime).

## Problembehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist bei
neuen Configs erwartet. Wählen Sie ein `openai/gpt-*`-Modell aus, aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** Stellen Sie sicher, dass die Modellreferenz
`openai/gpt-*` auf dem offiziellen OpenAI-Provider ist und dass das Codex-Plugin
installiert und aktiviert ist. Wenn Sie beim Testen einen strikten Nachweis benötigen, setzen Sie beim Provider oder
Modell `agentRuntime.id: "codex"`. Eine erzwungene Codex-Laufzeit schlägt fehl, statt
auf PI zurückzufallen.

**Legacy-`openai-codex/*`-Config bleibt bestehen:** Führen Sie `openclaw doctor --fix` aus.
Doctor schreibt Legacy-Modellreferenzen zu `openai/*` um, entfernt veraltete Sitzungs- und
Whole-Agent-Laufzeit-Pins und bewahrt vorhandene Auth-Profil-Überschreibungen.

**Der App-Server wird abgelehnt:** Verwenden Sie Codex-App-Server `0.125.0` oder neuer.
Prereleases derselben Version oder Build-Suffix-Versionen wie
`0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil OpenClaw den
stabilen Protokoll-Mindeststand `0.125.0` testet.

**`/codex status` kann keine Verbindung herstellen:** Prüfen Sie, dass das gebündelte `codex`-Plugin
aktiviert ist, dass `plugins.allow` es einschließt, wenn eine Allowlist konfiguriert ist, und
dass alle benutzerdefinierten `appServer.command`-, `url`-, `authToken`- oder Header-Werte gültig sind.

**Modellerkennung ist langsam:** Verringern Sie
`plugins.entries.codex.config.discovery.timeoutMs` oder deaktivieren Sie die Erkennung. Siehe
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference#model-discovery).

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`,
Header und dass der entfernte App-Server dieselbe Codex-App-Server-
Protokollversion spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist erwartet, sofern die Provider- oder Modelllaufzeit-
Richtlinie es nicht zu einem anderen Harness leitet. Einfache Nicht-OpenAI-Provider-Referenzen bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad.

**Computer Use ist installiert, aber Tools laufen nicht:** Prüfen Sie
`/codex computer-use status` aus einer frischen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; wenn es bestehen bleibt, starten Sie
den Gateway neu, um veraltete native Hook-Registrierungen zu löschen. Siehe
[Codex Computer Use](/de/plugins/codex-computer-use#troubleshooting).

## Verwandte Themen

- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex Computer Use](/de/plugins/codex-computer-use)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Plugin-Hooks](/de/plugins/hooks)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Status](/de/cli/status)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
