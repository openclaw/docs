---
read_when:
    - Sie möchten den mitgelieferten Codex-App-Server-Harness verwenden
    - Sie benötigen Konfigurationsbeispiele für den Codex-Harness
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, statt auf PI zurückzufallen
summary: Eingebettete OpenClaw-Agentendurchläufe über die mitgelieferte Codex-App-Server-Testumgebung ausführen
title: Codex-Harness
x-i18n:
    generated_at: "2026-05-10T19:42:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: a43e58bb97b5216318f8e5a58adb670930d57595f5cc4e85eccb65a9d0d33281
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete OpenAI-Agenten-Turns
über den Codex-App-Server statt über den integrierten PI-Harness auszuführen.

Verwenden Sie den Codex-Harness, wenn Codex die Low-Level-Agentensitzung besitzen soll:
natives Fortsetzen von Threads, native Tool-Fortsetzung, native Compaction und
App-Server-Ausführung. OpenClaw besitzt weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl,
dynamische OpenClaw-Tools, Genehmigungen, Medienzustellung und die sichtbare
Transkriptspiegelung.

Die normale Einrichtung verwendet kanonische OpenAI-Modellreferenzen wie `openai/gpt-5.5`.
Konfigurieren Sie keine `openai-codex/gpt-*`-Modellreferenzen. `openai-codex` ist der
Auth-Profil-Provider für Codex-OAuth- oder Codex-API-Schlüsselprofile, nicht das
Modell-Provider-Präfix für neue Agentenkonfiguration.

Für die breitere Aufteilung von Modell, Provider und Runtime beginnen Sie mit
[Agenten-Runtimes](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Runtime, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Wenn Ihre Konfiguration `plugins.allow` verwendet, schließen Sie `codex` ein.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig eine kompatible
  Codex-App-Server-Binärdatei, sodass lokale `codex`-Befehle auf dem `PATH`
  den normalen Harness-Start nicht beeinflussen.
- Codex-Authentifizierung verfügbar über `openclaw models auth login --provider openai-codex`,
  ein App-Server-Konto im Codex-Home des Agenten oder ein explizites Codex-API-Schlüssel-
  Auth-Profil.

Informationen zu Auth-Priorität, Umgebungsisolation, benutzerdefinierten App-Server-Befehlen, Modellerkennung
und allen Konfigurationsfeldern finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Schnellstart

Die meisten Benutzer, die Codex in OpenClaw verwenden möchten, wollen diesen Weg: mit einem
ChatGPT/Codex-Abonnement anmelden, das gebündelte `codex`-Plugin aktivieren und eine
kanonische `openai/gpt-*`-Modellreferenz verwenden.

Mit Codex OAuth anmelden:

```bash
openclaw models auth login --provider openai-codex
```

Das gebündelte `codex`-Plugin aktivieren und ein OpenAI-Agentenmodell auswählen:

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

Starten Sie den Gateway nach Änderung der Plugin-Konfiguration neu. Wenn ein vorhandener Chat bereits
eine Sitzung hat, verwenden Sie `/new` oder `/reset`, bevor Sie Runtime-Änderungen testen, damit der nächste
Turn den Harness aus der aktuellen Konfiguration auflöst.

## Konfiguration

Die Schnellstartkonfiguration ist die minimal funktionsfähige Codex-Harness-Konfiguration. Legen Sie Codex-
Harness-Optionen in der OpenClaw-Konfiguration fest, und verwenden Sie die CLI nur für die Codex-Authentifizierung:

| Bedarf                                 | Festlegen                                                          | Ort                            |
| -------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| Harness aktivieren                     | `plugins.entries.codex.enabled: true`                              | OpenClaw-Konfiguration         |
| Installation mit Plugin-Zulassungsliste beibehalten | `codex` in `plugins.allow` einschließen                            | OpenClaw-Konfiguration         |
| OpenAI-Agenten-Turns über Codex leiten | `agents.defaults.model` oder `agents.list[].model` als `openai/gpt-*` | OpenClaw-Agentenkonfiguration  |
| Mit Codex OAuth anmelden               | `openclaw models auth login --provider openai-codex`               | CLI-Auth-Profil                |
| Geschlossen fehlschlagen, wenn Codex nicht verfügbar ist | Provider oder Modell `agentRuntime.id: "codex"`                    | OpenClaw-Modell-/Provider-Konfiguration |
| Direkten OpenAI-API-Verkehr verwenden  | Provider oder Modell `agentRuntime.id: "pi"` mit normaler OpenAI-Authentifizierung | OpenClaw-Modell-/Provider-Konfiguration |
| App-Server-Verhalten abstimmen         | `plugins.entries.codex.config.appServer.*`                         | Codex-Plugin-Konfiguration     |
| Native Codex-Plugin-Apps aktivieren    | `plugins.entries.codex.config.codexPlugins.*`                      | Codex-Plugin-Konfiguration     |
| Codex Computer Use aktivieren          | `plugins.entries.codex.config.computerUse.*`                       | Codex-Plugin-Konfiguration     |

Verwenden Sie `openai/gpt-*`-Modellreferenzen für OpenAI-Agenten-Turns, die über Codex laufen.
`openai-codex` ist nur der Name des Auth-Profil-Providers für Codex OAuth und
Codex-API-Schlüsselprofile. Schreiben Sie keine neuen `openai-codex/gpt-*`-Modellreferenzen.

Der Rest dieser Seite behandelt häufige Varianten, zwischen denen Benutzer wählen müssen:
Bereitstellungsform, Fail-Closed-Routing, Guardian-Genehmigungsrichtlinie, native Codex-
Plugins und Computer Use. Vollständige Optionslisten, Standardwerte, Enumerationen, Erkennung,
Umgebungsisolation, Timeouts und App-Server-Transportfelder finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Codex-Runtime prüfen

Verwenden Sie `/status` in dem Chat, in dem Sie Codex erwarten. Ein OpenAI-Agenten-
Turn mit Codex-Unterstützung zeigt:

```text
Runtime: OpenAI Codex
```

Prüfen Sie anschließend den Codex-App-Server-Status:

```text
/codex status
/codex models
```

`/codex status` meldet App-Server-Konnektivität, Konto, Ratenlimits, MCP-
Server und Skills. `/codex models` listet den Live-Codex-App-Server-Katalog für
den Harness und das Konto auf. Wenn `/status` unerwartet ist, siehe
[Fehlerbehebung](#troubleshooting).

## Routing und Modellauswahl

Halten Sie Provider-Referenzen und Runtime-Richtlinie getrennt:

- Verwenden Sie `openai/gpt-*` für OpenAI-Agenten-Turns über Codex.
- Verwenden Sie `openai-codex/gpt-*` nicht in der Konfiguration. Führen Sie `openclaw doctor --fix` aus, um
  veraltete Referenzen und alte Sitzungs-Routen-Pins zu reparieren.
- `agentRuntime.id: "codex"` ist für den normalen OpenAI-Automatikmodus optional, aber nützlich,
  wenn eine Bereitstellung geschlossen fehlschlagen soll, falls Codex nicht verfügbar ist.
- `agentRuntime.id: "pi"` setzt einen Provider oder ein Modell bewusst auf direktes PI-Verhalten.
- `/codex ...` steuert native Codex-App-Server-Unterhaltungen aus dem Chat.
- ACP/acpx ist ein separater externer Harness-Pfad. Verwenden Sie ihn nur, wenn der Benutzer
  ACP/acpx oder einen externen Harness-Adapter anfordert.

Häufiges Befehlsrouting:

| Benutzerabsicht                 | Verwenden                               |
| ------------------------------- | --------------------------------------- |
| Aktuellen Chat anhängen         | `/codex bind [--cwd <path>]`            |
| Vorhandenen Codex-Thread fortsetzen | `/codex resume <thread-id>`             |
| Codex-Threads auflisten oder filtern | `/codex threads [filter]`               |
| Nur Codex-Feedback senden       | `/codex diagnostics [note]`             |
| ACP/acpx-Aufgabe starten        | ACP/acpx-Sitzungsbefehle, nicht `/codex` |

| Anwendungsfall                                      | Konfigurieren                                                    | Prüfen                                  | Hinweise                           |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| ChatGPT/Codex-Abonnement mit nativer Codex-Runtime   | `openai/gpt-*` plus aktiviertes `codex`-Plugin                   | `/status` zeigt `Runtime: OpenAI Codex` | Empfohlener Pfad                   |
| Geschlossen fehlschlagen, wenn Codex nicht verfügbar ist | Provider oder Modell `agentRuntime.id: "codex"`                  | Turn schlägt fehl statt PI-Fallback     | Für reine Codex-Bereitstellungen verwenden |
| Direkter OpenAI-API-Schlüsselverkehr über PI         | Provider oder Modell `agentRuntime.id: "pi"` und normale OpenAI-Authentifizierung | `/status` zeigt PI-Runtime              | Nur verwenden, wenn PI beabsichtigt ist |
| Legacy-Konfiguration                                 | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` schreibt sie um | So keine neue Konfiguration schreiben |
| ACP/acpx-Codex-Adapter                               | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP-Aufgaben-/Sitzungsstatus            | Getrennt vom nativen Codex-Harness |

`agents.defaults.imageModel` folgt derselben Präfixaufteilung. Verwenden Sie `openai/gpt-*`
für die normale OpenAI-Route und `codex/gpt-*` nur, wenn Bildverständnis
über einen begrenzten Codex-App-Server-Turn laufen soll. Verwenden Sie nicht
`openai-codex/gpt-*`; doctor schreibt dieses Legacy-Präfix zu `openai/gpt-*` um.

## Bereitstellungsmuster

### Einfache Codex-Bereitstellung

Verwenden Sie die Schnellstartkonfiguration, wenn alle OpenAI-Agenten-Turns standardmäßig
Codex verwenden sollen.

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

Diese Form behält Claude als Standardagenten bei und fügt einen benannten Codex-Agenten hinzu:

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
`codex`-Agent den Codex-App-Server.

### Fail-Closed-Codex-Bereitstellung

Für OpenAI-Agenten-Turns wird `openai/gpt-*` bereits zu Codex aufgelöst, wenn das
gebündelte Plugin verfügbar ist. Fügen Sie eine explizite Runtime-Richtlinie hinzu, wenn Sie eine schriftliche
Fail-Closed-Regel wünschen:

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

Bei erzwungenem Codex schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann.

## App-Server-Richtlinie

Standardmäßig startet das Plugin die von OpenClaw verwaltete Codex-Binärdatei lokal mit stdio-
Transport. Setzen Sie `appServer.command` nur, wenn Sie bewusst eine andere
ausführbare Datei ausführen möchten. Verwenden Sie WebSocket-Transport nur, wenn bereits ein App-Server
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
implizite YOLO-Haltung nicht zulassen, wählt OpenClaw stattdessen zulässige Guardian-Berechtigungen aus.

Verwenden Sie den Guardian-Modus, wenn Sie möchten, dass Codex vor Sandbox-Escapes
oder zusätzlichen Berechtigungen eine native automatische Prüfung durchführt:

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
`sandbox: "workspace-write"`, wenn die lokalen Anforderungen diese Werte erlauben.

Alle App-Server-Felder, Auth-Reihenfolge, Umgebungsisolation, Erkennung und
Timeout-Verhalten finden Sie in der [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Befehle und Diagnose

Das gebündelte Plugin registriert `/codex` als Slash-Befehl auf jedem Kanal, der
OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` prüft die Konnektivität zum App-Server, Modelle, Konto, Ratenlimits,
  MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex-App-Servers auf.
- `/codex threads [filter]` listet aktuelle Threads des Codex-App-Servers auf.
- `/codex resume <thread-id>` bindet die aktuelle OpenClaw-Sitzung an einen
  vorhandenen Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angebundenen Thread zu komprimieren.
- `/codex review` startet die native Codex-Review für den angebundenen Thread.
- `/codex diagnostics [note]` fragt nach, bevor Codex-Feedback für den
  angebundenen Thread gesendet wird.
- `/codex account` zeigt Konto- und Ratenlimitstatus an.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet die Skills des Codex-App-Servers auf.

Beginnen Sie bei den meisten Supportmeldungen mit `/diagnostics [note]` in der Unterhaltung,
in der der Fehler aufgetreten ist. Dadurch wird ein Gateway-Diagnosebericht erstellt und bei
Codex-Harness-Sitzungen um Zustimmung gebeten, das relevante Codex-Feedbackpaket zu senden.
Siehe [Diagnoseexport](/de/gateway/diagnostics) für das Datenschutzmodell und das Verhalten in
Gruppenchats.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie gezielt den Codex-
Feedback-Upload für den aktuell angebundenen Thread ohne das vollständige Gateway-
Diagnosepaket wünschen.

### Codex-Threads lokal prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu prüfen, ist oft, den nativen Codex-
Thread direkt zu öffnen:

```bash
codex resume <thread-id>
```

Entnehmen Sie die Thread-ID der abgeschlossenen `/diagnostics`-Antwort, `/codex binding` oder
`/codex threads [filter]`.

Upload-Mechanik und Diagnosegrenzen auf Laufzeitebene finden Sie unter
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime#codex-feedback-upload).

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agent.
2. Das vorhandene Konto des App-Servers im Codex-Home dieses Agent.
3. Nur bei lokalen stdio-App-Server-Starts `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten Codex-Kindprozess. Dadurch bleiben
API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar, ohne dass
native Codex-App-Server-Turns versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüsselprofile und lokaler stdio-Fallback über Umgebungsschlüssel verwenden den App-Server-
Login statt geerbter Kindprozess-Umgebung. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-Umgebungs-Fallback für API-Schlüssel; verwenden Sie ein explizites Authentifizierungsprofil oder das
eigene Konto des Remote-App-Servers.

Wenn ein Deployment zusätzliche Umgebungsisolation benötigt, fügen Sie diese Variablen zu
`appServer.clearEnv` hinzu:

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

`appServer.clearEnv` betrifft nur den erzeugten Kindprozess des Codex-App-Servers.

Dynamische Codex-Tools verwenden standardmäßig `searchable`-Laden. OpenClaw stellt keine
dynamischen Tools bereit, die native Codex-Arbeitsbereichsoperationen duplizieren: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` und `update_plan`. Verbleibende OpenClaw-
Integrationstools wie Messaging, Sitzungen, Medien, Cron, Browser, Nodes,
Gateway, `heartbeat_respond` und `web_search` sind über die Codex-Toolsuche
unter dem Namespace `openclaw` verfügbar, wodurch der anfängliche Modellkontext
kleiner bleibt.
`sessions_yield` und reine Message-Tool-Quellantworten bleiben direkt, weil dies
Turn-Control-Verträge sind. Heartbeat-Kollaborationsanweisungen weisen Codex an,
vor dem Beenden eines Heartbeat-Turns nach `heartbeat_respond` zu suchen, wenn das Tool
noch nicht geladen ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu einem benutzerdefinierten Codex-
App-Server herstellen, der verzögerte dynamische Tools nicht suchen kann, oder wenn Sie die vollständige
Tool-Payload debuggen.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard       | Bedeutung                                                                                  |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `codexDynamicToolsLoading` | `"searchable"` | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Toolkontext zu legen. |
| `codexDynamicToolsExclude` | `[]`           | Zusätzliche Namen dynamischer OpenClaw-Tools, die bei Codex-App-Server-Turns ausgelassen werden. |
| `codexPlugins`             | deaktiviert    | Native Codex-Plugin-/App-Unterstützung für migrierte, aus Quellen installierte kuratierte Plugins. |

Unterstützte `appServer`-Felder:

| Feld                          | Standard                                                | Bedeutung                                                                                                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                               | `"stdio"` erzeugt Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                      |
| `command`                     | verwaltetes Codex-Binary                                | Ausführbare Datei für stdio-Transport. Nicht setzen, um das verwaltete Binary zu verwenden; nur für eine explizite Überschreibung setzen.                                                                                             |
| `args`                        | `["app-server", "--listen", "stdio://"]`                | Argumente für stdio-Transport.                                                                                                                                                                                                        |
| `url`                         | nicht gesetzt                                           | WebSocket-App-Server-URL.                                                                                                                                                                                                             |
| `authToken`                   | nicht gesetzt                                           | Bearer-Token für WebSocket-Transport.                                                                                                                                                                                                 |
| `headers`                     | `{}`                                                    | Zusätzliche WebSocket-Header.                                                                                                                                                                                                         |
| `clearEnv`                    | `[]`                                                    | Zusätzliche Namen von Umgebungsvariablen, die aus dem erzeugten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung erstellt hat. `CODEX_HOME` und `HOME` sind für die agentenspezifische Codex-Isolation von OpenClaw bei lokalen Starts reserviert. |
| `requestTimeoutMs`            | `60000`                                                 | Timeout für Control-Plane-Aufrufe des App-Servers.                                                                                                                                                                                    |
| `turnCompletionIdleTimeoutMs` | `60000`                                                 | Ruhefenster nach einer turn-bezogenen Codex-App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet. Erhöhen Sie diesen Wert für langsame Post-Tool- oder reine Status-Synthesephasen.                                        |
| `mode`                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht verbieten | Voreinstellung für YOLO- oder von Guardian geprüfte Ausführung. Lokale stdio-Anforderungen, die `danger-full-access`, Genehmigung `never` oder den Reviewer `user` auslassen, machen Guardian zum impliziten Standard.                 |
| `approvalPolicy`              | `"never"` oder eine erlaubte Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/-Fortsetzung/-Turn gesendet wird. Guardian-Standards bevorzugen `"on-request"`, wenn erlaubt.                                                                                |
| `sandbox`                     | `"danger-full-access"` oder eine erlaubte Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der an Thread-Start/-Fortsetzung gesendet wird. Guardian-Standards bevorzugen `"workspace-write"`, wenn erlaubt, andernfalls `"read-only"`.                                                              |
| `approvalsReviewer`           | `"user"` oder ein erlaubter Guardian-Reviewer           | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, wenn erlaubt, andernfalls `guardian_subagent` oder `user`. `guardian_subagent` bleibt ein Legacy-Alias.                                           |
| `serviceTier`                 | nicht gesetzt                                           | Optionale Service-Stufe des Codex-App-Servers. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, `null` löscht die Überschreibung, und das Legacy-`"fast"` wird als `"priority"` akzeptiert.            |

OpenClaw-eigene dynamische Toolaufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt: Codex-`item/tool/call`-Anfragen verwenden standardmäßig einen
30-sekündigen OpenClaw-Watchdog. Ein positives `timeoutMs`-Argument pro Aufruf verlängert
oder verkürzt dieses spezifische Tool-Budget. Das Tool `image_generate` verwendet außerdem
`agents.defaults.imageGenerationModel.timeoutMs`, wenn der Toolaufruf kein eigenes
Timeout bereitstellt, und das Medienverständnis-Tool `image` verwendet
`tools.media.image.timeoutSeconds` oder seinen 60-sekündigen Medienstandard. Budgets für dynamische Tools
sind auf 600000 ms begrenzt. Bei einem Timeout bricht OpenClaw das Tool-Signal ab,
wo dies unterstützt wird, und gibt eine fehlgeschlagene Dynamic-Tool-Antwort an Codex zurück, damit der Turn
fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.

Nachdem OpenClaw auf eine turn-bezogene App-Server-Anfrage von Codex geantwortet hat, erwartet das Harness
außerdem, dass Codex den nativen Turn mit `turn/completed` abschließt. Wenn der
App-Server nach dieser Antwort für `appServer.turnCompletionIdleTimeoutMs` still bleibt,
unterbricht OpenClaw den Codex-Turn nach bestem Aufwand, zeichnet einen Diagnose-
Timeout auf und gibt die OpenClaw-Sitzungsspur frei, damit nachfolgende Chatnachrichten
nicht hinter einem veralteten nativen Turn eingereiht werden. Jede nicht-terminale Benachrichtigung für denselben
Turn, einschließlich `rawResponseItem/completed`, deaktiviert diesen kurzen Watchdog,
weil Codex bewiesen hat, dass der Turn noch aktiv ist; der längere terminale Watchdog
schützt weiterhin vor wirklich festhängenden Turns. Timeout-Diagnosen enthalten die
letzte App-Server-Benachrichtigungsmethode und bei rohen Assistant-Antwortelementen den
Elementtyp, die Rolle, die ID und eine begrenzte Vorschau des Assistant-Texts.

Umgebungsüberschreibungen bleiben für lokale Tests verfügbar:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` umgeht das verwaltete Binary, wenn
`appServer.command` nicht gesetzt ist.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen
`plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Config wird
für wiederholbare Deployments bevorzugt, weil sie das Plugin-Verhalten in
derselben überprüften Datei wie den Rest der Codex-Harness-Einrichtung hält.

## Native Codex-Plugins

Native Codex-Plugin-Unterstützung verwendet die eigenen App- und Plugin-Fähigkeiten
des Codex-App-Servers im selben Codex-Thread wie den OpenClaw-Harness-Turn. OpenClaw
übersetzt Codex-Plugins nicht in synthetische dynamische `codex_plugin_*`-Tools von
OpenClaw.

`codexPlugins` wirkt sich nur auf Sitzungen aus, die den nativen Codex-Harness auswählen. Es
hat keine Auswirkung auf PI-Ausführungen, normale OpenAI-Provider-Ausführungen, ACP-Konversationsbindungen
oder andere Harnesses.

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

Die Thread-App-Config wird berechnet, wenn OpenClaw eine Codex-Harness-Sitzung
herstellt oder eine veraltete Codex-Thread-Bindung ersetzt. Sie wird nicht bei jedem Turn
neu berechnet. Nachdem Sie `codexPlugins` geändert haben, verwenden Sie `/new`, `/reset` oder starten Sie den Gateway neu, damit
zukünftige Codex-Harness-Sitzungen mit dem aktualisierten App-Satz starten.

Informationen zu Migrationseignung, App-Inventar, Richtlinie für destruktive Aktionen,
Elicitations und nativer Plugin-Diagnose finden Sie unter
[Native Codex-Plugins](/de/plugins/codex-native-plugins).

## Computer Use

Computer Use wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex Computer Use](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw vendort die Desktop-Control-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, überprüft, dass der
`computer-use`-MCP-Server verfügbar ist, und lässt Codex dann die nativen MCP-
Tool-Aufrufe während Turns im Codex-Modus übernehmen.

## Laufzeitgrenzen

Der Codex-Harness ändert nur den Low-Level-Executor des eingebetteten Agenten.

- Dynamische OpenClaw-Tools werden unterstützt. Codex fordert OpenClaw auf, diese
  Tools auszuführen, daher bleibt OpenClaw im Ausführungspfad.
- Codex-native Shell-, Patch-, MCP- und native App-Tools gehören Codex.
  OpenClaw kann ausgewählte native Ereignisse über den unterstützten Relay
  beobachten oder blockieren, schreibt native Tool-Argumente aber nicht um.
- Codex übernimmt native Compaction. OpenClaw hält einen Transcript-Spiegel für Kanal-
  Verlauf, Suche, `/new`, `/reset` und zukünftigen Modell- oder Harness-Wechsel.
- Mediengenerierung, Medienverständnis, TTS, Genehmigungen und Messaging-Tool-
  Ausgabe laufen weiterhin über die passenden OpenClaw-Provider-/Modell-Einstellungen.
- `tool_result_persist` gilt für OpenClaw-eigene Transcript-Tool-Ergebnisse, nicht
  für Codex-native Tool-Ergebnisdatensätze.

Informationen zu Hook-Schichten, unterstützten V1-Oberflächen, nativer Berechtigungsbehandlung, Queue-
Steuerung, Upload-Mechanik für Codex-Feedback und Compaction-Details finden Sie unter
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime).

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das wird bei
neuen Configs erwartet. Wählen Sie ein `openai/gpt-*`-Modell aus, aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet PI statt Codex:** Stellen Sie sicher, dass die Modellreferenz
`openai/gpt-*` auf dem offiziellen OpenAI-Provider ist und dass das Codex-Plugin
installiert und aktiviert ist. Wenn Sie beim Testen strikte Nachweise benötigen, setzen Sie beim Provider oder
Modell `agentRuntime.id: "codex"`. Eine erzwungene Codex-Laufzeit schlägt fehl, statt
auf PI zurückzufallen.

**Legacy-Config `openai-codex/*` bleibt bestehen:** Führen Sie `openclaw doctor --fix` aus.
Doctor schreibt alte Modellreferenzen in `openai/*` um, entfernt veraltete Sitzungs- und
Whole-Agent-Laufzeit-Pins und bewahrt vorhandene Auth-Profil-Overrides.

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

**Ein Nicht-Codex-Modell verwendet PI:** Das wird erwartet, sofern die Provider- oder Modell-Laufzeit-
Richtlinie es nicht an einen anderen Harness weiterleitet. Einfache Nicht-OpenAI-Provider-Referenzen bleiben im
`auto`-Modus auf ihrem normalen Provider-Pfad.

**Computer Use ist installiert, aber Tools laufen nicht:** Prüfen Sie
`/codex computer-use status` aus einer neuen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie `/new` oder `/reset`; wenn es bestehen bleibt, starten Sie
den Gateway neu, um veraltete native Hook-Registrierungen zu löschen. Siehe
[Codex Computer Use](/de/plugins/codex-computer-use#troubleshooting).

## Verwandt

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
- [Tests](/de/help/testing-live#live-codex-app-server-harness-smoke)
