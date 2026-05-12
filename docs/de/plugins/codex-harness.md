---
read_when:
    - Sie möchten den mitgelieferten Codex-App-Server-Harness verwenden
    - Sie benötigen Beispiele für die Codex-Harness-Konfiguration
    - Sie möchten, dass reine Codex-Deployments fehlschlagen, statt auf PI zurückzufallen
summary: OpenClaw-Turns für eingebettete Agenten über den gebündelten Codex-App-Server-Harness ausführen
title: Codex-Ausführungsumgebung
x-i18n:
    generated_at: "2026-05-12T00:59:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 273572d7b7f3b6c57ddd0de38ce467463e9f1f0eab66dc7e2c38fa7679cb0359
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete OpenAI-Agent-Turns
über den Codex-App-Server statt über den integrierten PI-Harness auszuführen.

Verwenden Sie den Codex-Harness, wenn Codex die Low-Level-Agent-Sitzung verwalten soll:
native Thread-Fortsetzung, native Tool-Fortsetzung, native Compaction und
App-Server-Ausführung. OpenClaw verwaltet weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl,
dynamische OpenClaw-Tools, Genehmigungen, Medienzustellung und die sichtbare
Transkript-Spiegelung.

Die normale Einrichtung verwendet kanonische OpenAI-Modellreferenzen wie `openai/gpt-5.5`.
Konfigurieren Sie keine `openai-codex/gpt-*`-Modellreferenzen. Legen Sie die OpenAI-Agent-Auth-Reihenfolge
unter `auth.order.openai` ab; ältere `openai-codex:*`-Profile und
`auth.order.openai-codex`-Einträge bleiben für bestehende Installationen unterstützt.

OpenClaw startet Codex-App-Server-Threads mit dem nativen Codex-Codemodus und
aktiviertem Nur-Codemodus. Dadurch bleiben aufgeschobene/durchsuchbare dynamische OpenClaw-Tools
innerhalb der eigenen Codeausführung und Tool-Suchoberfläche von Codex, statt
einen PI-artigen Tool-Such-Wrapper über Codex zu legen.

Für die breitere Aufteilung von Modell/Provider/Laufzeit beginnen Sie mit
[Agent-Laufzeiten](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Laufzeit, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Wenn Ihre Konfiguration `plugins.allow` verwendet, schließen Sie `codex` ein.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig
  eine kompatible Codex-App-Server-Binärdatei, sodass lokale `codex`-Befehle in `PATH`
  den normalen Harness-Start nicht beeinflussen.
- Codex-Auth verfügbar über `openclaw models auth login --provider openai-codex`,
  ein App-Server-Konto im Codex-Home des Agenten oder ein explizites Codex-API-Key-Auth-Profil.

Informationen zu Auth-Priorität, Umgebungsisolation, benutzerdefinierten App-Server-Befehlen, Modellerkennung
und allen Konfigurationsfeldern finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Schnellstart

Die meisten Benutzer, die Codex in OpenClaw verwenden möchten, wollen diesen Weg: Melden Sie sich mit einem
ChatGPT/Codex-Abonnement an, aktivieren Sie das gebündelte `codex`-Plugin und verwenden Sie eine
kanonische `openai/gpt-*`-Modellreferenz.

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

Starten Sie den Gateway nach einer Änderung der Plugin-Konfiguration neu. Wenn ein vorhandener Chat bereits
eine Sitzung hat, verwenden Sie `/new` oder `/reset`, bevor Sie Laufzeitänderungen testen, damit der nächste
Turn den Harness aus der aktuellen Konfiguration auflöst.

## Konfiguration

Die Schnellstartkonfiguration ist die minimal funktionsfähige Codex-Harness-Konfiguration. Legen Sie Codex-Harness-Optionen
in der OpenClaw-Konfiguration fest und verwenden Sie die CLI nur für Codex-Auth:

| Bedarf                                 | Festlegen                                                                        | Ort                                |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Harness aktivieren                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw-Konfiguration             |
| Eine allowlist-basierte Plugin-Installation beibehalten | `codex` in `plugins.allow` einschließen                                          | OpenClaw-Konfiguration             |
| OpenAI-Agent-Turns über Codex routen   | `agents.defaults.model` oder `agents.list[].model` als `openai/gpt-*`            | OpenClaw-Agent-Konfiguration       |
| Mit Codex OAuth anmelden               | `openclaw models auth login --provider openai-codex`                             | CLI-Auth-Profil                    |
| API-Key-Backup für Codex-Läufe hinzufügen | `openai:*`-API-Key-Profil nach Abonnement-Auth in `auth.order.openai` aufgeführt | CLI-Auth-Profil + OpenClaw-Konfiguration |
| Geschlossen fehlschlagen, wenn Codex nicht verfügbar ist | Provider- oder Modell-`agentRuntime.id: "codex"`                                 | OpenClaw-Modell-/Provider-Konfiguration |
| Direkten OpenAI-API-Traffic verwenden  | Provider- oder Modell-`agentRuntime.id: "pi"` mit normaler OpenAI-Auth           | OpenClaw-Modell-/Provider-Konfiguration |
| App-Server-Verhalten anpassen          | `plugins.entries.codex.config.appServer.*`                                       | Codex-Plugin-Konfiguration         |
| Native Codex-Plugin-Apps aktivieren    | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-Plugin-Konfiguration         |
| Codex Computer Use aktivieren          | `plugins.entries.codex.config.computerUse.*`                                     | Codex-Plugin-Konfiguration         |

Verwenden Sie `openai/gpt-*`-Modellreferenzen für Codex-gestützte OpenAI-Agent-Turns. Bevorzugen Sie
`auth.order.openai` für die Reihenfolge Abonnement zuerst/API-Key als Backup. Bestehende
`openai-codex:*`-Auth-Profile und `auth.order.openai-codex` bleiben gültig, aber
schreiben Sie keine neuen `openai-codex/gpt-*`-Modellreferenzen.

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
Der API-Key ist nur ein Auth-Fallback, keine Anweisung, zu PI oder
einfachen OpenAI Responses zu wechseln.

Der Rest dieser Seite behandelt gängige Varianten, zwischen denen Benutzer wählen müssen:
Bereitstellungsform, Fail-closed-Routing, Guardian-Genehmigungsrichtlinie, native Codex-Plugins
und Computer Use. Vollständige Optionslisten, Standardwerte, Enums, Erkennung,
Umgebungsisolation, Timeouts und App-Server-Transportfelder finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Codex-Laufzeit verifizieren

Verwenden Sie `/status` in dem Chat, in dem Sie Codex erwarten. Ein Codex-gestützter OpenAI-Agent-Turn
zeigt:

```text
Runtime: OpenAI Codex
```

Prüfen Sie anschließend den Codex-App-Server-Status:

```text
/codex status
/codex models
```

`/codex status` meldet App-Server-Konnektivität, Konto, Ratenlimits, MCP-Server
und Skills. `/codex models` listet den Live-Codex-App-Server-Katalog für
den Harness und das Konto auf. Wenn `/status` überraschend ist, siehe
[Fehlerbehebung](#troubleshooting).

## Routing und Modellauswahl

Halten Sie Provider-Referenzen und Laufzeitrichtlinie getrennt:

- Verwenden Sie `openai/gpt-*` für OpenAI-Agent-Turns über Codex.
- Verwenden Sie `openai-codex/gpt-*` nicht in der Konfiguration. Führen Sie `openclaw doctor --fix` aus, um
  Legacy-Referenzen und veraltete Sitzungs-Routen-Pins zu reparieren.
- `agentRuntime.id: "codex"` ist für den normalen OpenAI-Automatikmodus optional, aber nützlich,
  wenn eine Bereitstellung geschlossen fehlschlagen soll, falls Codex nicht verfügbar ist.
- `agentRuntime.id: "pi"` schaltet einen Provider oder ein Modell bewusst auf direktes PI-Verhalten um.
- `/codex ...` steuert native Codex-App-Server-Konversationen aus dem Chat heraus.
- ACP/acpx ist ein separater externer Harness-Pfad. Verwenden Sie ihn nur, wenn der Benutzer
  ACP/acpx oder einen externen Harness-Adapter anfordert.

Gängiges Befehlsrouting:

| Benutzerabsicht                 | Verwenden                               |
| ------------------------------- | --------------------------------------- |
| Den aktuellen Chat anhängen     | `/codex bind [--cwd <path>]`            |
| Einen vorhandenen Codex-Thread fortsetzen | `/codex resume <thread-id>`             |
| Codex-Threads auflisten oder filtern | `/codex threads [filter]`               |
| Nur Codex-Feedback senden       | `/codex diagnostics [note]`             |
| Eine ACP/acpx-Aufgabe starten   | ACP/acpx-Sitzungsbefehle, nicht `/codex` |

| Anwendungsfall                                      | Konfigurieren                                                    | Verifizieren                             | Hinweise                           |
| --------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------- | ---------------------------------- |
| ChatGPT/Codex-Abonnement mit nativer Codex-Laufzeit | `openai/gpt-*` plus aktiviertes `codex`-Plugin                   | `/status` zeigt `Runtime: OpenAI Codex`  | Empfohlener Weg                    |
| Geschlossen fehlschlagen, wenn Codex nicht verfügbar ist | Provider- oder Modell-`agentRuntime.id: "codex"`                 | Turn schlägt fehl statt PI-Fallback      | Für Codex-only-Bereitstellungen verwenden |
| Direkter OpenAI-API-Key-Traffic über PI             | Provider- oder Modell-`agentRuntime.id: "pi"` und normale OpenAI-Auth | `/status` zeigt PI-Laufzeit              | Nur verwenden, wenn PI beabsichtigt ist |
| Legacy-Konfiguration                                | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` schreibt sie um  | Keine neue Konfiguration so schreiben |
| ACP/acpx-Codex-Adapter                              | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP-Aufgaben-/Sitzungsstatus             | Getrennt vom nativen Codex-Harness |

`agents.defaults.imageModel` folgt derselben Präfix-Aufteilung. Verwenden Sie `openai/gpt-*`
für die normale OpenAI-Route und `codex/gpt-*` nur, wenn Bildverständnis
über einen begrenzten Codex-App-Server-Turn laufen soll. Verwenden Sie nicht
`openai-codex/gpt-*`; doctor schreibt dieses Legacy-Präfix in `openai/gpt-*` um.

## Bereitstellungsmuster

### Einfache Codex-Bereitstellung

Verwenden Sie die Schnellstartkonfiguration, wenn alle OpenAI-Agent-Turns standardmäßig Codex
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

### Gemischte Provider-Bereitstellung

Diese Form behält Claude als Standardagent bei und fügt einen benannten Codex-Agenten hinzu:

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
`codex`-Agent verwendet den Codex-App-Server.

### Fail-closed-Codex-Bereitstellung

Für OpenAI-Agent-Turns wird `openai/gpt-*` bereits zu Codex aufgelöst, wenn das
gebündelte Plugin verfügbar ist. Fügen Sie eine explizite Laufzeitrichtlinie hinzu, wenn Sie eine schriftliche
Fail-closed-Regel wünschen:

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

Wenn Codex erzwungen wird, schlägt OpenClaw früh fehl, falls das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann.

## App-Server-Richtlinie

Standardmäßig startet das Plugin die von OpenClaw verwaltete Codex-Binärdatei lokal mit stdio-Transport.
Setzen Sie `appServer.command` nur, wenn Sie bewusst eine andere ausführbare Datei ausführen möchten.
Verwenden Sie WebSocket-Transport nur, wenn ein App-Server bereits anderswo läuft:

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
implizite YOLO-Haltung nicht zulassen, wählt OpenClaw stattdessen zulässige
Guardian-Berechtigungen aus. Wenn für die Sitzung eine OpenClaw-Sandbox aktiv
ist, schränkt OpenClaw Codex `danger-full-access` auf Codex `workspace-write`
ein, damit native Codex-Code-Mode-Turns innerhalb des Sandbox-Workspaces bleiben.

Verwenden Sie den Guardian-Modus, wenn Sie vor Sandbox-Escapes oder zusätzlichen
Berechtigungen eine native automatische Codex-Überprüfung wünschen:

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

Der Guardian-Modus wird zu Codex-App-Server-Genehmigungen erweitert, üblicherweise
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` und
`sandbox: "workspace-write"`, wenn die lokalen Anforderungen diese Werte zulassen.

Für jedes App-Server-Feld sowie Verhalten zu Auth-Reihenfolge, Umgebungsisolation,
Discovery und Timeouts siehe [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Befehle und Diagnosen

Das gebündelte Plugin registriert `/codex` als Slash-Befehl in jedem Kanal, der
OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` prüft App-Server-Konnektivität, Modelle, Konto, Ratelimits,
  MCP-Server und Skills.
- `/codex models` listet Live-Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet aktuelle Codex-App-Server-Threads auf.
- `/codex resume <thread-id>` verbindet die aktuelle OpenClaw-Sitzung mit einem
  vorhandenen Codex-Thread.
- `/codex compact` fordert den Codex-App-Server auf, den verbundenen Thread zu komprimieren.
- `/codex review` startet die native Codex-Überprüfung für den verbundenen Thread.
- `/codex diagnostics [note]` fragt nach, bevor Codex-Feedback für den
  verbundenen Thread gesendet wird.
- `/codex account` zeigt Konto- und Ratelimit-Status.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet Codex-App-Server-Skills auf.

Für die meisten Supportberichte beginnen Sie mit `/diagnostics [note]` in der
Unterhaltung, in der der Fehler aufgetreten ist. Dadurch wird ein Gateway-Diagnosebericht
erstellt und bei Codex-Harness-Sitzungen um Genehmigung gebeten, das relevante
Codex-Feedback-Bundle zu senden. Siehe [Diagnoseexport](/de/gateway/diagnostics) für
das Datenschutzmodell und das Verhalten in Gruppenchats.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie gezielt den Codex-Feedback-Upload
für den aktuell verbundenen Thread ohne das vollständige Gateway-Diagnose-Bundle wünschen.

### Codex-Threads lokal prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu prüfen, ist oft, den nativen
Codex-Thread direkt zu öffnen:

```bash
codex resume <thread-id>
```

Die Thread-ID erhalten Sie aus der abgeschlossenen `/diagnostics`-Antwort, aus
`/codex binding` oder aus `/codex threads [filter]`.

Für Upload-Mechanik und Diagnosegrenzen auf Laufzeitebene siehe
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime#codex-feedback-upload).

Auth wird in dieser Reihenfolge ausgewählt:

1. Geordnete OpenAI-Auth-Profile für den Agent, vorzugsweise unter
   `auth.order.openai`. Vorhandene `openai-codex:*`-Profil-IDs bleiben gültig.
2. Das vorhandene Konto des App-Servers im Codex-Home dieses Agent.
3. Nur bei lokalen stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Auth
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Auth-Profil im Stil eines ChatGPT-Abonnements erkennt,
entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY` aus dem gestarteten Codex-Kindprozess.
So bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle
verfügbar, ohne dass native Codex-App-Server-Turns versehentlich über die API
abgerechnet werden. Explizite Codex-API-Key-Profile und der lokale stdio-Env-Key-Fallback
verwenden App-Server-Login statt geerbter Kindprozess-Umgebung. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-Env-API-Key-Fallback; verwenden Sie ein explizites
Auth-Profil oder das eigene Konto des Remote-App-Servers.

Wenn ein Abonnementprofil ein Codex-Nutzungslimit erreicht, speichert OpenClaw die
Reset-Zeit, sofern Codex eine meldet, und versucht für denselben Codex-Lauf das
nächste geordnete Auth-Profil. Nach Ablauf der Reset-Zeit ist das Abonnementprofil
wieder verwendbar, ohne das ausgewählte `openai/gpt-*`-Modell oder die Codex-Laufzeit
zu ändern.

Wenn eine Bereitstellung zusätzliche Umgebungsisolation benötigt, fügen Sie diese
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

Dynamische Codex-Tools verwenden standardmäßig das `searchable`-Laden. OpenClaw stellt
keine dynamischen Tools bereit, die native Codex-Workspace-Operationen duplizieren:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process` und `update_plan`. Verbleibende
OpenClaw-Integrationstools wie Messaging, Sitzungen, Medien, Cron, Browser, Nodes,
Gateway, `heartbeat_respond` und `web_search` sind über die Codex-Toolsuche im
Namespace `openclaw` verfügbar, wodurch der anfängliche Modellkontext kleiner bleibt.
`sessions_yield` und Nur-Message-Tool-Quellantworten bleiben direkt, weil dies
Turn-Control-Verträge sind. Heartbeat-Kollaborationsanweisungen weisen Codex an,
vor dem Beenden eines Heartbeat-Turns nach `heartbeat_respond` zu suchen, wenn das
Tool nicht bereits geladen ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu
einem benutzerdefinierten Codex-App-Server herstellen, der zurückgestellte dynamische
Tools nicht suchen kann, oder wenn Sie die vollständige Tool-Payload debuggen.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard       | Bedeutung                                                                                  |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `codexDynamicToolsLoading` | `"searchable"` | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Toolkontext zu legen. |
| `codexDynamicToolsExclude` | `[]`           | Zusätzliche dynamische OpenClaw-Toolnamen, die aus Codex-App-Server-Turns ausgelassen werden. |
| `codexPlugins`             | deaktiviert    | Native Codex-Plugin-/App-Unterstützung für migrierte, aus der Quelle installierte kuratierte Plugins. |

Unterstützte `appServer`-Felder:

| Feld                          | Standard                                               | Bedeutung                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` startet Codex; `"websocket"` verbindet mit `url`.                                                                                                                                                                           |
| `command`                     | verwaltete Codex-Binärdatei                            | Ausführbare Datei für stdio-Transport. Lassen Sie dies unset, um die verwaltete Binärdatei zu verwenden; setzen Sie es nur für eine explizite Überschreibung.                                                                          |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | Argumente für stdio-Transport.                                                                                                                                                                                                        |
| `url`                         | unset                                                  | WebSocket-App-Server-URL.                                                                                                                                                                                                             |
| `authToken`                   | unset                                                  | Bearer-Token für WebSocket-Transport.                                                                                                                                                                                                 |
| `headers`                     | `{}`                                                   | Zusätzliche WebSocket-Header.                                                                                                                                                                                                         |
| `clearEnv`                    | `[]`                                                   | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat. `CODEX_HOME` und `HOME` sind für OpenClaws Codex-Isolation pro Agent bei lokalen Starts reserviert. |
| `requestTimeoutMs`            | `60000`                                                | Timeout für App-Server-Control-Plane-Aufrufe.                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Ruhefenster nach einer turn-bezogenen Codex-App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet. Erhöhen Sie diesen Wert für langsame Post-Tool- oder reine Status-Synthesephasen.                                      |
| `mode`                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht verbieten | Voreinstellung für YOLO- oder Guardian-geprüfte Ausführung. Lokale stdio-Anforderungen, die `danger-full-access`, `never`-Genehmigung oder den `user`-Reviewer auslassen, machen den impliziten Standard zu Guardian.                 |
| `approvalPolicy`              | `"never"` oder eine zulässige Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die an Thread-Start, Resume und Turn gesendet wird. Guardian-Standards bevorzugen `"on-request"`, wenn zulässig.                                                                                 |
| `sandbox`                     | `"danger-full-access"` oder eine zulässige Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der an Thread-Start und Resume gesendet wird. Guardian-Standards bevorzugen `"workspace-write"`, wenn zulässig, andernfalls `"read-only"`. Wenn eine OpenClaw-Sandbox aktiv ist, wird `danger-full-access` auf `"workspace-write"` eingeschränkt. |
| `approvalsReviewer`           | `"user"` oder ein zulässiger Guardian-Reviewer         | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüfen kann, wenn zulässig, andernfalls `guardian_subagent` oder `user`. `guardian_subagent` bleibt ein Legacy-Alias.                                    |
| `serviceTier`                 | unset                                                  | Optionale Codex-App-Server-Service-Tier. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, `null` löscht die Überschreibung, und das Legacy-`"fast"` wird als `"priority"` akzeptiert.                 |

Von OpenClaw verwaltete dynamische Tool-Aufrufe sind unabhängig von
`appServer.requestTimeoutMs` begrenzt: Codex-`item/tool/call`-Anfragen verwenden standardmäßig einen 30-sekündigen
OpenClaw-Watchdog. Ein positives `timeoutMs`-Argument pro Aufruf verlängert
oder verkürzt dieses spezifische Tool-Budget. Das Tool `image_generate` verwendet außerdem
`agents.defaults.imageGenerationModel.timeoutMs`, wenn der Tool-Aufruf kein
eigenes Timeout bereitstellt, und das Medienverständnis-Tool `image` verwendet
`tools.media.image.timeoutSeconds` oder seinen 60-sekündigen Medienstandard. Dynamische Tool-
Budgets sind auf 600000 ms begrenzt. Bei einem Timeout bricht OpenClaw das Tool-Signal
ab, wo dies unterstützt wird, und gibt eine fehlgeschlagene dynamische Tool-Antwort an Codex zurück, damit der Turn
fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine turn-bezogene App-Server-Anfrage von Codex geantwortet hat, erwartet das Harness
außerdem, dass Codex den nativen Turn mit `turn/completed` abschließt. Wenn der
App-Server nach dieser Antwort für `appServer.turnCompletionIdleTimeoutMs` still bleibt,
unterbricht OpenClaw bestmöglich den Codex-Turn, zeichnet ein Diagnose-
Timeout auf und gibt die OpenClaw-Sitzungsspur frei, damit nachfolgende Chat-Nachrichten
nicht hinter einem veralteten nativen Turn eingereiht werden. Jede nicht terminale Benachrichtigung für denselben
Turn, einschließlich `rawResponseItem/completed`, deaktiviert diesen kurzen Watchdog,
weil Codex nachgewiesen hat, dass der Turn noch aktiv ist; der längere terminale Watchdog
schützt weiterhin tatsächlich festhängende Turns. Timeout-Diagnosen enthalten die
letzte App-Server-Benachrichtigungsmethode und, bei rohen Assistant-Antwortelementen, den
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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration wird
für wiederholbare Bereitstellungen bevorzugt, weil sie das Plugin-Verhalten in derselben
geprüften Datei hält wie den Rest der Codex-Harness-Einrichtung.

## Native Codex-Plugins

Die Unterstützung nativer Codex-Plugins verwendet die eigenen App- und Plugin-
Funktionen des Codex-App-Servers im selben Codex-Thread wie der OpenClaw-Harness-Turn. OpenClaw
übersetzt Codex-Plugins nicht in synthetische dynamische `codex_plugin_*`-OpenClaw-
Tools.

`codexPlugins` wirkt sich nur auf Sitzungen aus, die das native Codex-Harness auswählen. Es
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

Die Thread-App-Konfiguration wird berechnet, wenn OpenClaw eine Codex-Harness-Sitzung
herstellt oder ein veraltetes Codex-Thread-Binding ersetzt. Sie wird nicht bei jedem Turn neu berechnet.
Nachdem Sie `codexPlugins` geändert haben, verwenden Sie `/new`, `/reset` oder starten Sie das Gateway neu, damit
künftige Codex-Harness-Sitzungen mit dem aktualisierten App-Satz starten.

Informationen zu Migrationseignung, App-Inventar, Richtlinie für destruktive Aktionen,
Elicitations und nativen Plugin-Diagnosen finden Sie unter
[Native Codex-Plugins](/de/plugins/codex-native-plugins).

## Computernutzung

Die Computernutzung wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex-Computernutzung](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw vendort die Desktop-Steuerungs-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, verifiziert, dass der
`computer-use`-MCP-Server verfügbar ist, und lässt Codex anschließend während Codex-Modus-Turns die nativen MCP-
Tool-Aufrufe verwalten.

## Laufzeitgrenzen

Das Codex-Harness ändert nur den eingebetteten Low-Level-Agent-Executor.

- Dynamische OpenClaw-Tools werden unterstützt. Codex fordert OpenClaw auf, diese
  Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.
- Codex-native Shell-, Patch-, MCP- und native App-Tools werden von Codex verwaltet.
  OpenClaw kann ausgewählte native Ereignisse über das unterstützte Relay beobachten oder blockieren,
  schreibt native Tool-Argumente jedoch nicht um.
- Codex verwaltet native Compaction. OpenClaw hält eine Transkriptspiegelung für Kanal-
  Verlauf, Suche, `/new`, `/reset` und künftige Modell- oder Harness-Wechsel vor.
- Mediengenerierung, Medienverständnis, TTS, Genehmigungen und Messaging-Tool-
  Ausgabe laufen weiterhin über die passenden OpenClaw-Provider-/Modelleinstellungen.
- `tool_result_persist` gilt für OpenClaw-verwaltete Transkript-Tool-Ergebnisse, nicht
  für Codex-native Tool-Ergebnisdatensätze.

Informationen zu Hook-Schichten, unterstützten V1-Oberflächen, nativer Berechtigungsbehandlung, Queue-
Steuerung, Upload-Mechanik für Codex-Feedback und Compaction-Details finden Sie unter
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime).

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist bei
neuen Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Modell aus, aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** Stellen Sie sicher, dass die Modellreferenz
`openai/gpt-*` beim offiziellen OpenAI-Provider ist und dass das Codex-Plugin
installiert und aktiviert ist. Wenn Sie beim Testen einen strikten Nachweis benötigen, setzen Sie beim Provider oder
Modell `agentRuntime.id: "codex"`. Eine erzwungene Codex-Laufzeit schlägt fehl, statt
auf PI zurückzufallen.

**Veraltete `openai-codex/*`-Konfiguration bleibt bestehen:** Führen Sie `openclaw doctor --fix` aus.
Doctor schreibt veraltete Modellreferenzen zu `openai/*` um, entfernt veraltete Sitzungs- und
Agent-weite Laufzeit-Pins und behält bestehende Auth-Profil-Überschreibungen bei.

**Der App-Server wird abgelehnt:** Verwenden Sie Codex-App-Server `0.125.0` oder neuer.
Prereleases derselben Version oder Build-Suffix-Versionen wie
`0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil OpenClaw die
stabile Protokolluntergrenze `0.125.0` testet.

**`/codex status` kann keine Verbindung herstellen:** Prüfen Sie, dass das gebündelte `codex`-Plugin
aktiviert ist, dass `plugins.allow` es enthält, wenn eine Allowlist konfiguriert ist, und
dass alle benutzerdefinierten `appServer.command`, `url`, `authToken` oder Header gültig sind.

**Modellerkennung ist langsam:** Senken Sie
`plugins.entries.codex.config.discovery.timeoutMs` oder deaktivieren Sie die Erkennung. Siehe
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference#model-discovery).

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`,
Header und dass der entfernte App-Server dieselbe Codex-App-Server-
Protokollversion spricht.

**Ein Nicht-Codex-Modell verwendet PI:** Das ist erwartet, sofern die Laufzeit-
Richtlinie des Providers oder Modells es nicht zu einem anderen Harness routet. Einfache Nicht-OpenAI-Provider-Referenzen bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad.

**Computernutzung ist installiert, aber Tools laufen nicht:** Prüfen Sie
`/codex computer-use status` aus einer frischen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; wenn dies bestehen bleibt, starten Sie
das Gateway neu, um veraltete native Hook-Registrierungen zu löschen. Siehe
[Codex-Computernutzung](/de/plugins/codex-computer-use#troubleshooting).

## Verwandte Themen

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
