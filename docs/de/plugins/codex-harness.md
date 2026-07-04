---
read_when:
    - Sie möchten den gebündelten Codex-App-Server-Harness verwenden
    - Sie benötigen Codex-Harness-Konfigurationsbeispiele
    - Sie möchten, dass Nur-Codex-Bereitstellungen fehlschlagen, statt auf OpenClaw zurückzufallen
summary: Führen Sie eingebettete OpenClaw-Agenten-Turns über das gebündelte Codex-App-Server-Harness aus
title: Codex-Harness
x-i18n:
    generated_at: "2026-07-04T10:33:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete OpenAI-Agent-Durchläufe
über den Codex app-server statt über das integrierte OpenClaw-Harness auszuführen.

Verwenden Sie das Codex-Harness, wenn Codex die Low-Level-Agent-Sitzung übernehmen soll:
natives Fortsetzen von Threads, native Tool-Fortsetzung, native Compaction und
app-server-Ausführung. OpenClaw verwaltet weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl,
dynamische OpenClaw-Tools, Genehmigungen, Medienauslieferung und die sichtbare
Transkript-Spiegelung.

Die normale Einrichtung verwendet kanonische OpenAI-Modellreferenzen wie `openai/gpt-5.5`.
Konfigurieren Sie keine veralteten Codex-GPT-Referenzen. Legen Sie die OpenAI-Agent-Authentifizierungsreihenfolge
unter `auth.order.openai` ab; ältere veraltete Codex-Authentifizierungsprofil-IDs und
veraltete Codex-Authentifizierungsreihenfolge-Einträge sind Legacy-Zustand, der durch
`openclaw doctor --fix` repariert wird.

Wenn keine OpenClaw-Sandbox aktiv ist, startet OpenClaw Codex-app-server-Threads
mit aktiviertem nativen Codex-Code-Modus, während code-mode-only standardmäßig deaktiviert bleibt.
Dadurch bleiben nativer Codex-Workspace und Code-Fähigkeiten verfügbar, während
dynamische OpenClaw-Tools weiterhin über die app-server-Bridge `item/tool/call` laufen.
Aktives OpenClaw-Sandboxing und eingeschränkte Tool-Richtlinien deaktivieren den nativen Code-Modus
vollständig, sofern Sie sich nicht für den experimentellen sandbox-exec-server-Pfad entscheiden.

Diese Codex-native Funktion ist getrennt vom
[OpenClaw-Code-Modus](/de/reference/code-mode), einer optionalen QuickJS-WASI-Laufzeit
für generische OpenClaw-Durchläufe mit einer anderen `exec`-Eingabeform.

Für die breitere Aufteilung von Modell/Provider/Laufzeit beginnen Sie mit
[Agent-Laufzeiten](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Laufzeit, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Wenn Ihre Konfiguration `plugins.allow` verwendet, schließen Sie `codex` ein.
- Codex app-server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig eine kompatible
  Codex-app-server-Binärdatei, sodass lokale `codex`-Befehle in `PATH`
  den normalen Harness-Start nicht beeinflussen.
- Codex-Authentifizierung verfügbar über `openclaw models auth login --provider openai`,
  ein app-server-Konto im Codex-Home des Agenten oder ein explizites Codex-API-Key-
  Authentifizierungsprofil.

Informationen zur Authentifizierungspriorität, Umgebungsisolation, benutzerdefinierten app-server-Befehlen, Modell-
Discovery und allen Konfigurationsfeldern finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Schnellstart

Die meisten Benutzer, die Codex in OpenClaw verwenden möchten, benötigen diesen Pfad: Melden Sie sich mit einem
ChatGPT/Codex-Abonnement an, aktivieren Sie das gebündelte `codex`-Plugin und verwenden Sie eine
kanonische `openai/gpt-*`-Modellreferenz.

Mit Codex OAuth anmelden:

```bash
openclaw models auth login --provider openai
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

Starten Sie den Gateway neu, nachdem Sie die Plugin-Konfiguration geändert haben. Wenn ein vorhandener Chat bereits
eine Sitzung hat, verwenden Sie `/new` oder `/reset`, bevor Sie Laufzeitänderungen testen, damit der nächste
Durchlauf das Harness aus der aktuellen Konfiguration auflöst.

## Threads mit Codex Desktop und CLI teilen

Die Standardeinstellung `appServer.homeScope: "agent"` hält jeden OpenClaw-Agenten vom
nativen Codex-Zustand des Betreibers isoliert. Damit ein Besitzer OpenClaw anweisen kann,
dieselben nativen Threads zu prüfen und zu verwalten, die in Codex Desktop und der Codex CLI angezeigt werden,
entscheiden Sie sich für das Benutzer-Codex-Home:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

Der Benutzer-Home-Modus ist nur mit lokalem stdio-Transport verfügbar. Er verwendet
`$CODEX_HOME`, wenn gesetzt, und andernfalls `~/.codex`, einschließlich der nativen
Codex-Authentifizierung, Konfiguration, Plugins und des Thread-Speichers dieses Homes. OpenClaw injiziert kein
OpenClaw-Authentifizierungsprofil in diesen app-server.

Besitzer-Durchläufe erhalten das Tool `codex_threads`. Es kann native Threads auflisten, durchsuchen, lesen, forken,
umbenennen, archivieren und wiederherstellen. Bitten Sie den Agenten, einen Thread zu forken, wenn
Sie ihn in OpenClaw fortsetzen möchten; der Fork wird an die aktuelle
OpenClaw-Sitzung angehängt und bleibt für andere native Codex-Clients sichtbar. Archivieren
erfordert eine ausdrückliche Bestätigung, dass der Thread anderswo geschlossen ist.

Setzen Sie denselben Thread nicht gleichzeitig von OpenClaw und einem anderen
Codex-Client fort und schreiben Sie ihn nicht gleichzeitig. Codex koordiniert Live-Schreiber innerhalb eines app-server-Prozesses, nicht
über unabhängige Desktop-, CLI- und OpenClaw-Prozesse hinweg. Forking erstellt eine
separate Fortsetzung und ist der sichere Koexistenzpfad.

## Konfiguration

Die Schnellstartkonfiguration ist die minimal funktionsfähige Codex-Harness-Konfiguration. Legen Sie Codex-
Harness-Optionen in der OpenClaw-Konfiguration fest und verwenden Sie die CLI nur für die Codex-Authentifizierung:

| Bedarf                                 | Festlegen                                                                        | Wo                                 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Harness aktivieren                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw-Konfiguration             |
| Eine allowlistete Plugin-Installation beibehalten | `codex` in `plugins.allow` einschließen                                          | OpenClaw-Konfiguration             |
| OpenAI-Agent-Durchläufe über Codex routen | `agents.defaults.model` oder `agents.list[].model` als `openai/gpt-*`            | OpenClaw-Agent-Konfiguration       |
| Mit ChatGPT/Codex OAuth anmelden       | `openclaw models auth login --provider openai`                                   | CLI-Authentifizierungsprofil       |
| API-Key-Backup für Codex-Durchläufe hinzufügen | `openai:*`-API-Key-Profil nach Abonnement-Authentifizierung in `auth.order.openai` aufgeführt | CLI-Authentifizierungsprofil + OpenClaw-Konfiguration |
| Fail-closed, wenn Codex nicht verfügbar ist | Provider- oder Modell-`agentRuntime.id: "codex"`                                | OpenClaw-Modell/Provider-Konfiguration |
| Direkten OpenAI-API-Traffic verwenden  | Provider- oder Modell-`agentRuntime.id: "openclaw"` mit normaler OpenAI-Authentifizierung | OpenClaw-Modell/Provider-Konfiguration |
| app-server-Verhalten abstimmen         | `plugins.entries.codex.config.appServer.*`                                       | Codex-Plugin-Konfiguration         |
| Native Codex-Plugin-Apps aktivieren    | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-Plugin-Konfiguration         |
| Codex Computer Use aktivieren          | `plugins.entries.codex.config.computerUse.*`                                     | Codex-Plugin-Konfiguration         |

Verwenden Sie `openai/gpt-*`-Modellreferenzen für Codex-gestützte OpenAI-Agent-Durchläufe. Bevorzugen Sie
`auth.order.openai` für eine Reihenfolge mit Abonnement zuerst und API-Key-Backup danach. Vorhandene
veraltete Codex-Authentifizierungsprofil-IDs und die veraltete Codex-Authentifizierungsreihenfolge sind nur Doctor-
Legacy-Zustand; schreiben Sie keine neuen veralteten Codex-GPT-Referenzen.

Setzen Sie `compaction.model` oder `compaction.provider` nicht für Codex-gestützte Agenten.
Codex führt Compaction über seinen nativen app-server-Thread-Zustand aus, daher ignoriert OpenClaw
diese lokalen Summarizer-Overrides zur Laufzeit, und `openclaw doctor --fix` entfernt
sie, wenn der Agent Codex verwendet.

Lossless bleibt als Kontext-Engine für Assembly, Ingestion und
Wartung rund um Codex-Durchläufe unterstützt. Konfigurieren Sie es über
`plugins.slots.contextEngine: "lossless-claw"` und
`plugins.entries.lossless-claw.config.summaryModel`, nicht über
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migriert die alte
Form `compaction.provider: "lossless-claw"` in den Lossless-Kontext-Engine-Slot,
wenn Codex die aktive Laufzeit ist, aber die native Codex-Laufzeit verwaltet weiterhin Compaction.

Das native Codex-app-server-Harness unterstützt Kontext-Engines, die
Pre-Prompt-Assembly erfordern. Generische CLI-Backends, einschließlich `codex-cli`, stellen
diese Host-Fähigkeit nicht bereit.

Für Codex-gestützte Agenten startet `/compact` native Codex-app-server-Compaction auf
dem gebundenen Thread. OpenClaw wartet nicht auf den Abschluss, erzwingt kein OpenClaw-
Timeout, startet den gemeinsam genutzten app-server nicht neu und fällt nicht auf eine Kontext-Engine oder
einen öffentlichen OpenAI-Summarizer zurück. Wenn die native Codex-Thread-Bindung fehlt oder
veraltet ist, schlägt der Befehl fail-closed fehl, sodass der Betreiber die echte Laufzeitgrenze sieht,
statt dass stillschweigend auf Compaction-Backends umgeschaltet wird.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In dieser Form laufen beide Profile für `openai/gpt-*`-Agent-
Durchläufe weiterhin über Codex. Der API-Key ist nur ein Authentifizierungs-Fallback, keine Anforderung, zu OpenClaw oder
einfachen OpenAI Responses zu wechseln.

Der Rest dieser Seite behandelt gängige Varianten, zwischen denen Benutzer wählen müssen:
Deployment-Form, fail-closed Routing, Guardian-Genehmigungsrichtlinie, native Codex-
Plugins und Computer Use. Vollständige Optionslisten, Standardwerte, Enums, Discovery,
Umgebungsisolation, Timeouts und app-server-Transportfelder finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Codex-Laufzeit prüfen

Verwenden Sie `/status` in dem Chat, in dem Sie Codex erwarten. Ein Codex-gestützter OpenAI-Agent-
Durchlauf zeigt:

```text
Runtime: OpenAI Codex
```

Prüfen Sie dann den Codex-app-server-Zustand:

```text
/codex status
/codex models
```

`/codex status` meldet app-server-Konnektivität, Konto, Rate Limits, MCP-
Server und Skills. `/codex models` listet den Live-Codex-app-server-Katalog für
das Harness und das Konto auf. Wenn `/status` unerwartet ist, siehe
[Fehlerbehebung](#troubleshooting).

## Routing und Modellauswahl

Halten Sie Provider-Referenzen und Laufzeitrichtlinie getrennt:

- Verwenden Sie `openai/gpt-*` für OpenAI-Agent-Durchläufe über Codex.
- Verwenden Sie keine veralteten Codex-GPT-Referenzen in der Konfiguration. Führen Sie `openclaw doctor --fix` aus, um
  Legacy-Referenzen und veraltete Sitzungsrouten-Pins zu reparieren.
- `agentRuntime.id: "codex"` ist für den normalen OpenAI-Auto-Modus optional, aber nützlich,
  wenn ein Deployment fail-closed sein soll, falls Codex nicht verfügbar ist.
- `agentRuntime.id: "openclaw"` entscheidet sich für einen Provider oder ein Modell bewusst für die eingebettete
  OpenClaw-Laufzeit.
- `/codex ...` steuert native Codex-app-server-Unterhaltungen aus dem Chat.
- ACP/acpx ist ein separater externer Harness-Pfad. Verwenden Sie ihn nur, wenn der Benutzer
  nach ACP/acpx oder einem externen Harness-Adapter fragt.

Häufiges Befehlsrouting:

| Nutzerabsicht                                        | Verwendung                                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Aktuellen Chat anhängen                              | `/codex bind [--cwd <path>]`                                                                         |
| Vorhandenen Codex-Thread fortsetzen                  | `/codex resume <thread-id>`                                                                          |
| Codex-Threads auflisten oder filtern                 | `/codex threads [filter]`                                                                            |
| Native Codex-Plugins auflisten                       | `/codex plugins list`                                                                                |
| Konfiguriertes natives Codex-Plugin aktivieren oder deaktivieren | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                      |
| Vorhandene Codex-CLI-Sitzung auf einem gekoppelten Node anhängen | `/codex sessions --host <node> [filter]`, dann `/codex resume <session-id> --host <node> --bind here` |
| Nur Codex-Feedback senden                            | `/codex diagnostics [note]`                                                                          |
| ACP/acpx-Aufgabe starten                             | ACP/acpx-Sitzungsbefehle, nicht `/codex`                                                             |

| Anwendungsfall                                      | Konfigurieren                                                          | Prüfen                                  | Hinweise                              |
| --------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| ChatGPT/Codex-Abonnement mit nativer Codex-Runtime  | `openai/gpt-*` plus aktiviertes `codex`-Plugin                         | `/status` zeigt `Runtime: OpenAI Codex` | Empfohlener Pfad                      |
| Fehlgeschlagen beenden, wenn Codex nicht verfügbar ist | Provider oder Modell `agentRuntime.id: "codex"`                        | Turn schlägt fehl statt eingebettetem Fallback | Für reine Codex-Deployments verwenden |
| Direkten OpenAI-API-Schlüsselverkehr durch OpenClaw leiten | Provider oder Modell `agentRuntime.id: "openclaw"` und normale OpenAI-Authentifizierung | `/status` zeigt OpenClaw-Runtime        | Nur verwenden, wenn OpenClaw beabsichtigt ist |
| Legacy-Konfiguration                                | Legacy-Codex-GPT-Referenzen                                            | `openclaw doctor --fix` schreibt sie um | Neue Konfiguration nicht so schreiben |
| ACP/acpx-Codex-Adapter                              | ACP `sessions_spawn({ runtime: "acp" })`                               | ACP-Aufgaben-/Sitzungsstatus            | Vom nativen Codex-Harness getrennt    |

`agents.defaults.imageModel` folgt derselben Präfixaufteilung. Verwenden Sie `openai/gpt-*`
für die normale OpenAI-Route und `codex/gpt-*` nur, wenn Bildverständnis
über einen begrenzten Codex-App-Server-Turn laufen soll. Verwenden Sie keine
Legacy-Codex-GPT-Referenzen; doctor schreibt dieses Legacy-Präfix zu `openai/gpt-*` um.

## Deployment-Muster

### Einfaches Codex-Deployment

Verwenden Sie die Quickstart-Konfiguration, wenn alle OpenAI-Agent-Turns standardmäßig
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

### Deployment mit gemischten Providern

Diese Form behält Claude als Standard-Agent bei und fügt einen benannten Codex-Agent hinzu:

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

### Fail-closed-Codex-Deployment

Für OpenAI-Agent-Turns wird `openai/gpt-*` bereits zu Codex aufgelöst, wenn das
gebündelte Plugin verfügbar ist. Fügen Sie eine explizite Runtime-Richtlinie hinzu, wenn Sie eine schriftliche
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

Standardmäßig startet das Plugin die von OpenClaw verwaltete Codex-Binärdatei lokal mit stdio-
Transport. Setzen Sie `appServer.command` nur, wenn Sie absichtlich eine
andere ausführbare Datei ausführen möchten. Verwenden Sie WebSocket-Transport nur, wenn bereits anderswo ein
App-Server läuft:

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
Wenn für die Sitzung eine OpenClaw-Sandbox aktiv ist, deaktiviert OpenClaw für diesen
Turn den nativen Codex Code Mode, Benutzer-MCP-Server und app-gestützte Plugin-Ausführung,
anstatt sich auf hostseitiges Sandboxing von Codex zu verlassen. Shell-Zugriff wird
über OpenClaw-sandboxgestützte dynamische Tools wie `sandbox_exec` und
`sandbox_process` bereitgestellt, wenn die normalen exec/process-Tools verfügbar sind.

Verwenden Sie den normalisierten OpenClaw-Exec-Modus, wenn Sie native Codex-Auto-Review vor
Sandbox-Ausbrüchen oder zusätzlichen Berechtigungen möchten:

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

Für Codex-App-Server-Sitzungen ordnet OpenClaw `tools.exec.mode: "auto"` Codex-
Guardian-geprüften Genehmigungen zu, üblicherweise
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` und
`sandbox: "workspace-write"`, wenn die lokalen Anforderungen diese Werte zulassen.
In `tools.exec.mode: "auto"` bewahrt OpenClaw keine Legacy-unsicheren Codex-
Overrides für `approvalPolicy: "never"` oder `sandbox: "danger-full-access"` auf; verwenden Sie
`tools.exec.mode: "full"` für eine absichtlich genehmigungsfreie Codex-Haltung. Das
Legacy-Preset `plugins.entries.codex.config.appServer.mode: "guardian"` funktioniert weiterhin,
aber `tools.exec.mode: "auto"` ist die normalisierte OpenClaw-Oberfläche.

Für den Vergleich auf Modusebene mit Host-Exec-Genehmigungen und ACPX-Berechtigungen
siehe [Berechtigungsmodi](/de/tools/permission-modes).

Für jedes App-Server-Feld, die Authentifizierungsreihenfolge, Umgebungsisolierung, Erkennung und
Timeout-Verhalten siehe [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Befehle und Diagnosen

Das gebündelte Plugin registriert `/codex` als Slash-Befehl in jedem Kanal, der
OpenClaw-Textbefehle unterstützt.

Native Ausführung und Steuerung erfordern einen Owner oder einen `operator.admin`-Gateway-
Client. Dazu gehören das Binden oder Fortsetzen von Threads, das Senden oder Stoppen von Turns,
das Ändern von Modell, Fast Mode oder Berechtigungsstatus, Compaction oder Review sowie
das Lösen einer Bindung. Andere autorisierte Absender behalten schreibgeschützte Befehle für Status, Hilfe,
Konto, Modell, Thread, MCP-Server, Skill und Bindungsinspektion.

Häufige Formen:

- `/codex status` prüft App-Server-Konnektivität, Modelle, Konto, Ratenlimits,
  MCP-Server und Skills.
- `/codex models` listet Live-Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet aktuelle Codex-App-Server-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen
  vorhandenen Codex-Thread an.
- `/codex compact` bittet den Codex-App-Server, den angehängten Thread zu kompaktieren.
- `/codex review` startet die native Codex-Review für den angehängten Thread.
- `/codex diagnostics [note]` fragt vor dem Senden von Codex-Feedback für den
  angehängten Thread nach.
- `/codex account` zeigt Konto- und Ratenlimitstatus an.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet Codex-App-Server-Skills auf.

Beginnen Sie bei den meisten Support-Berichten mit `/diagnostics [note]` in der Unterhaltung,
in der der Fehler aufgetreten ist. Dadurch wird ein Gateway-Diagnosebericht erstellt und für Codex-
Harness-Sitzungen um Genehmigung gebeten, das relevante Codex-Feedback-Bundle zu senden.
Siehe [Diagnoseexport](/de/gateway/diagnostics) für das Datenschutzmodell und das Verhalten in Gruppen-
Chats.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie speziell den Codex-
Feedback-Upload für den derzeit angehängten Thread ohne das vollständige Gateway-
Diagnose-Bundle möchten.

### Codex-Threads lokal inspizieren

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu inspizieren, ist oft, den nativen Codex-
Thread direkt zu öffnen:

```bash
codex resume <thread-id>
```

Entnehmen Sie die Thread-ID der abgeschlossenen `/diagnostics`-Antwort, `/codex binding` oder
`/codex threads [filter]`.

Für Upload-Mechanik und Diagnosegrenzen auf Runtime-Ebene siehe
[Codex-Harness-Runtime](/de/plugins/codex-harness-runtime#codex-feedback-upload).

Im standardmäßigen Home pro Agent wird die Authentifizierung in dieser Reihenfolge ausgewählt:

1. Geordnete OpenAI-Auth-Profile für den Agent, vorzugsweise unter
   `auth.order.openai`. Führen Sie `openclaw doctor --fix` aus, um ältere
   Legacy-Codex-Auth-Profil-IDs und die Legacy-Codex-Auth-Reihenfolge zu migrieren.
2. Das vorhandene Konto des App-Servers im Codex-Home dieses Agent.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Auth-Profil im Stil eines ChatGPT-Abonnements erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem gestarteten Codex-Kindprozess. So
bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Turns versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüsselprofile und der lokale stdio-Env-Key-Fallback verwenden App-Server-
Login statt geerbter Kindprozess-Umgebung. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-Env-API-Schlüssel-Fallback; verwenden Sie ein explizites Auth-Profil oder das
eigene Konto des Remote-App-Servers.
Wenn native Codex-Plugins konfiguriert sind, installiert oder aktualisiert OpenClaw diese
Plugins über den verbundenen App-Server, bevor plugin-eigene Apps dem
Codex-Thread bereitgestellt werden. `app/list` bleibt die Quelle der Wahrheit für App-IDs,
Zugänglichkeit und Metadaten, aber OpenClaw besitzt die Enablement-Entscheidung pro Thread:
Wenn die Richtlinie eine gelistete zugängliche App erlaubt, sendet OpenClaw
`thread/start.config.apps[appId].enabled = true`, selbst wenn `app/list` derzeit
meldet, dass diese App deaktiviert ist. Dieser Pfad erfindet keine App-Installation für
unbekannte IDs; OpenClaw aktiviert nur Marketplace-Plugins mit `plugin/install`
und aktualisiert danach das Inventar.

Wenn ein Abonnementprofil ein Codex-Nutzungslimit erreicht, speichert OpenClaw die Reset-
Zeit, wenn Codex eine meldet, und versucht das nächste geordnete Auth-Profil für denselben
Codex-Lauf. Wenn die Reset-Zeit verstrichen ist, wird das Abonnementprofil wieder verwendbar,
ohne das ausgewählte `openai/gpt-*`-Modell oder die Codex-Runtime zu ändern.

Für lokale stdio-App-Server-Starts setzt OpenClaw `CODEX_HOME` auf ein agentenspezifisches
Verzeichnis, damit Codex-Konfiguration, Auth-/Kontodateien, Plugin-Cache/-Daten und nativer
Thread-Zustand standardmäßig nicht das persönliche `~/.codex` des Operators lesen oder
beschreiben. OpenClaw behält das normale Prozess-`HOME` bei; von Codex ausgeführte Unterprozesse
können weiterhin Benutzer-Home-Konfiguration und Tokens finden, und Codex kann gemeinsam genutzte
Einträge in `$HOME/.agents/skills` und `$HOME/.agents/plugins/marketplace.json` entdecken.
Mit `appServer.homeScope: "user"` verwendet OpenClaw stattdessen das native Benutzer-Codex-Home
und dessen vorhandenes Konto, ohne ein OpenClaw-Auth-Profil einzuschleusen.

Wenn eine Bereitstellung zusätzliche Umgebungsisolierung benötigt, fügen Sie diese Variablen zu
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

`appServer.clearEnv` wirkt sich nur auf den gestarteten untergeordneten Codex-App-Server-Prozess aus.
OpenClaw entfernt `CODEX_HOME` und `HOME` während der Normalisierung des lokalen Starts aus dieser
Liste: `CODEX_HOME` bleibt auf den ausgewählten Agenten- oder Benutzer-Scope gerichtet, und `HOME`
bleibt vererbt, damit Unterprozesse normalen Benutzer-Home-Zustand verwenden können.

Dynamische Codex-Tools verwenden standardmäßig `searchable`-Laden. OpenClaw stellt keine
dynamischen Tools bereit, die native Codex-Workspace-Operationen duplizieren: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` und `update_plan`. Die meisten verbleibenden
OpenClaw-Integrationstools wie Messaging, Medien, Cron, Browser, Nodes, Gateway und
`heartbeat_respond` sind über die Codex-Toolsuche unter dem Namespace `openclaw` verfügbar,
wodurch der anfängliche Modellkontext kleiner bleibt. Die Websuche verwendet standardmäßig das
gehostete Codex-Tool `web_search`, wenn die Suche aktiviert ist und kein verwalteter Provider
ausgewählt wurde. Native gehostete Suche und das verwaltete dynamische OpenClaw-Tool `web_search`
schließen sich gegenseitig aus, damit die verwaltete Suche native Domain-Beschränkungen nicht
umgehen kann. OpenClaw verwendet das verwaltete Tool, wenn die gehostete Suche nicht verfügbar,
ausdrücklich deaktiviert oder durch einen ausgewählten verwalteten Provider ersetzt wurde.
OpenClaw hält die eigenständige Codex-Erweiterung `web.run` deaktiviert, weil produktiver
App-Server-Traffic ihren benutzerdefinierten Namespace `web` ablehnt. `tools.web.search.enabled: false`
deaktiviert beide Pfade, ebenso Tool-deaktivierte reine LLM-Läufe. Codex behandelt `"cached"` als
Präferenz und löst sie für uneingeschränkte App-Server-Turns in Live-Zugriff auf externe Quellen auf.
Automatisches verwaltetes Fallback schlägt geschlossen fehl, wenn native `allowedDomains` gesetzt
sind, damit die Allowlist nicht umgangen werden kann. Dauerhafte effektive Änderungen der
Suchrichtlinie rotieren den gebundenen Codex-Thread vor dem nächsten Turn. Transiente
Einschränkungen pro Turn verwenden einen temporären eingeschränkten Thread und bewahren die
bestehende Bindung für eine spätere Fortsetzung. `sessions_yield` und reine
Message-Tool-Quellantworten bleiben direkt, weil dies Turn-Control-Verträge sind. `sessions_spawn`
bleibt durchsuchbar, damit Codex' natives `spawn_agent` die primäre Codex-Subagent-Oberfläche
bleibt, während explizite OpenClaw- oder ACP-Delegation weiterhin über den dynamischen
Tool-Namespace `openclaw` verfügbar ist. Heartbeat-Kollaborationsanweisungen weisen Codex an, vor
dem Beenden eines Heartbeat-Turns nach `heartbeat_respond` zu suchen, wenn das Tool noch nicht
geladen ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu einem
benutzerdefinierten Codex-App-Server herstellen, der keine zurückgestellten dynamischen Tools
durchsuchen kann, oder wenn Sie die vollständige Tool-Nutzlast debuggen.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard       | Bedeutung                                                                                              |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `codexDynamicToolsLoading` | `"searchable"` | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Toolkontext zu legen. |
| `codexDynamicToolsExclude` | `[]`           | Zusätzliche Namen dynamischer OpenClaw-Tools, die in Codex-App-Server-Turns ausgelassen werden sollen. |
| `codexPlugins`             | deaktiviert    | Native Codex-Plugin-/App-Unterstützung für migrierte, aus Quellen installierte kuratierte Plugins.     |

Unterstützte `appServer`-Felder:

| Feld                                          | Standard                                               | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` startet Codex; `"websocket"` stellt eine Verbindung zu `url` her.                                                                                                                                                                                                                                                                                                                     |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isoliert den Codex-Zustand pro OpenClaw-Agent. `"user"` teilt das native `$CODEX_HOME` oder `~/.codex`, verwendet native Authentifizierung und aktiviert Thread-Verwaltung nur durch den Besitzer. Der Benutzer-Scope erfordert stdio.                                                                                                                                                  |
| `command`                                     | verwaltete Codex-Binärdatei                            | Ausführbare Datei für den stdio-Transport. Lassen Sie den Wert ungesetzt, um die verwaltete Binärdatei zu verwenden; setzen Sie ihn nur für eine ausdrückliche Überschreibung.                                                                                                                                                                                                                   |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumente für den stdio-Transport.                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | nicht gesetzt                                          | WebSocket-App-Server-URL.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | nicht gesetzt                                          | Bearer-Token für den WebSocket-Transport. Akzeptiert eine Literalzeichenfolge oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                  |
| `headers`                                     | `{}`                                                   | Zusätzliche WebSocket-Header. Header-Werte akzeptieren Literalzeichenfolgen oder SecretInput-Werte, zum Beispiel `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                |
| `clearEnv`                                    | `[]`                                                   | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung erstellt hat. OpenClaw behält das ausgewählte `CODEX_HOME` und das geerbte `HOME` für lokale Starts bei.                                                                                                                                     |
| `codeModeOnly`                                | `false`                                                | Aktiviert die reine Code-Modus-Tool-Oberfläche von Codex. Dynamische OpenClaw-Tools bleiben bei Codex registriert, sodass verschachtelte `tools.*`-Aufrufe über die App-Server-Bridge `item/tool/call` zurückkehren.                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | nicht gesetzt                                          | Remote-Workspace-Root des Codex-App-Servers. Wenn gesetzt, leitet OpenClaw den lokalen Workspace-Root aus dem aufgelösten OpenClaw-Workspace ab, bewahrt das aktuelle cwd-Suffix unter diesem Remote-Root und sendet nur das endgültige App-Server-cwd an Codex. Wenn das cwd außerhalb des aufgelösten OpenClaw-Workspace-Root liegt, schlägt OpenClaw geschlossen fehl, statt einen Gateway-lokalen Pfad an den Remote-App-Server zu senden. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout für Control-Plane-Aufrufe an den App-Server.                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ruhefenster, nachdem Codex einen Turn akzeptiert hat oder nach einer turn-bezogenen App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                                           |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Abschluss-Leerlauf- und Fortschrittswächter, der nach einer Tool-Übergabe, nativen Tool-Fertigstellung, Raw-Assistant-Fortschritt nach einem Tool, Raw-Reasoning-Abschluss oder Reasoning-Fortschritt verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder umfangreiche Workloads, bei denen die Synthese nach einem Tool berechtigterweise länger still bleiben kann als das endgültige Assistant-Freigabebudget. |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht ausschließen | Voreinstellung für YOLO- oder durch Guardian geprüfte Ausführung. Lokale stdio-Anforderungen, die `danger-full-access`, Genehmigung `never` oder den Reviewer `user` auslassen, machen Guardian zum impliziten Standard.                                                                                                                                                                         |
| `approvalPolicy`                              | `"never"` oder eine erlaubte Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzung/Turn gesendet wird. Guardian-Standards bevorzugen `"on-request"`, wenn erlaubt.                                                                                                                                                                                                                                           |
| `sandbox`                                     | `"danger-full-access"` oder eine erlaubte Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzung gesendet wird. Guardian-Standards bevorzugen `"workspace-write"`, wenn erlaubt, andernfalls `"read-only"`. Wenn eine OpenClaw-Sandbox aktiv ist, verwenden `danger-full-access`-Turns Codex `workspace-write` mit Netzwerkzugriff, der aus der Egress-Einstellung der OpenClaw-Sandbox abgeleitet wird.                              |
| `approvalsReviewer`                           | `"user"` oder ein erlaubter Guardian-Reviewer          | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, wenn dies erlaubt ist, andernfalls `guardian_subagent` oder `user`. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                                                                                                              |
| `serviceTier`                                 | nicht gesetzt                                          | Optionale Service-Stufe des Codex-App-Servers. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, `null` löscht die Überschreibung, und das Legacy-`"fast"` wird als `"priority"` akzeptiert.                                                                                                                                                                      |
| `networkProxy`                                | deaktiviert                                            | Aktiviert Codex-Berechtigungsprofil-Networking für App-Server-Befehle. OpenClaw definiert die ausgewählte `permissions.<profile>.network`-Konfiguration und wählt sie mit `default_permissions`, statt `sandbox` zu senden.                                                                                                                                                                     |
| `experimental.sandboxExecServer`              | `false`                                                | Vorschau-Opt-in, das eine durch die OpenClaw-Sandbox gestützte Codex-Umgebung bei Codex-App-Server 0.132.0 oder neuer registriert, damit native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox laufen kann.                                                                                                                                                                            |

`appServer.networkProxy` ist ausdrücklich, weil es den Codex-Sandbox-Vertrag
ändert. Wenn aktiviert, setzt OpenClaw außerdem `features.network_proxy.enabled` und
`default_permissions` in der Codex-Thread-Konfiguration, damit das generierte
Berechtigungsprofil das von Codex verwaltete Networking starten kann. Standardmäßig
generiert OpenClaw aus dem Profilkörper einen kollisionsresistenten Profilnamen
`openclaw-network-<fingerprint>`; verwenden Sie `profileName` nur, wenn ein stabiler
lokaler Name erforderlich ist.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Wenn die normale App-Server-Laufzeitumgebung `danger-full-access` wäre, verwendet die Aktivierung von
`networkProxy` workspace-artigen Dateisystemzugriff für das generierte
Berechtigungsprofil. Die von Codex verwaltete Netzwerkdurchsetzung ist sandboxed Networking,
sodass ein Profil mit Vollzugriff ausgehenden Traffic nicht schützen würde.
Domain-Einträge verwenden `allow` oder `deny`; Unix-Socket-Einträge verwenden die
Codex-Werte `allow` oder `none`.

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt: Codex-`item/tool/call`-Anfragen verwenden standardmäßig einen
90-sekündigen OpenClaw-Watchdog. Ein positives `timeoutMs`-Argument pro Aufruf verlängert
oder verkürzt dieses spezifische Tool-Budget. Das Tool `image_generate` verwendet
`agents.defaults.imageGenerationModel.timeoutMs`, wenn der Tool-Aufruf keinen eigenen
Timeout bereitstellt, andernfalls einen 120-sekündigen Standardwert für die Bildgenerierung.
Das Medienverständnis-`image`-Tool verwendet
`tools.media.image.timeoutSeconds` oder seinen 60-sekündigen Medienstandard. Für das
Bildverständnis gilt dieser Timeout für die Anfrage selbst und wird nicht durch vorherige
Vorbereitungsarbeit verkürzt. Dynamische Tool-Budgets sind auf
600000 ms begrenzt. Bei einem Timeout bricht OpenClaw das Tool-Signal ab,
sofern unterstützt, und gibt eine fehlgeschlagene Dynamic-Tool-Antwort an Codex zurück, damit der Turn
fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.
Dieser Watchdog ist das äußere dynamische `item/tool/call`-Budget; Provider-spezifische
Anfrage-Timeouts laufen innerhalb dieses Aufrufs und behalten ihre eigene Timeout-Semantik.

Nachdem Codex einen Turn akzeptiert hat und nachdem OpenClaw auf eine Turn-bezogene
App-Server-Anfrage geantwortet hat, erwartet der Harness, dass Codex im aktuellen Turn Fortschritt macht und
den nativen Turn schließlich mit `turn/completed` beendet. Wenn der App-Server für
`appServer.turnCompletionIdleTimeoutMs` still bleibt, unterbricht OpenClaw nach bestem Bemühen
den Codex-Turn, zeichnet einen diagnostischen Timeout auf und gibt die
OpenClaw-Sitzungsspur frei, damit nachfolgende Chatnachrichten nicht hinter einem veralteten
nativen Turn eingereiht werden. Die meisten nicht-terminalen Benachrichtigungen für denselben Turn deaktivieren diesen kurzen
Watchdog, weil Codex bewiesen hat, dass der Turn noch aktiv ist. Tool-Übergaben verwenden ein
längeres Idle-Budget nach Tools: nachdem OpenClaw eine `item/tool/call`-Antwort
zurückgibt, nachdem native Tool-Items wie `commandExecution` abgeschlossen sind, nach rohen
`custom_tool_call_output`-Abschlüssen sowie nach rohem Assistentenfortschritt nach Tools,
rohen Reasoning-Abschlüssen oder Reasoning-Fortschritt. Die Schutzlogik verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn konfiguriert, und
standardmäßig andernfalls fünf Minuten. Dasselbe Post-Tool-Budget verlängert auch den
Fortschritts-Watchdog für das stille Synthesefenster, bevor Codex das nächste
Current-Turn-Ereignis ausgibt. Globale App-Server-Benachrichtigungen wie Rate-Limit-Updates
setzen den Turn-Idle-Fortschritt nicht zurück. Reasoning-Abschlüsse, Commentary-
`agentMessage`-Abschlüsse sowie roher Reasoning- oder Assistentenfortschritt vor einem Tool können
von einer automatischen finalen Antwort gefolgt werden, daher verwenden sie die Antwortschutzlogik nach Fortschritt,
statt die Sitzungsspur sofort freizugeben. Nur finale/nicht-kommentierende abgeschlossene
`agentMessage`-Items und rohe Assistentenabschlüsse vor einem Tool aktivieren die
Assistentenausgabe-Freigabe: Wenn Codex danach ohne `turn/completed` still bleibt,
unterbricht OpenClaw nach bestem Bemühen den nativen Turn und gibt die Sitzungsspur frei.
Wenn ein anderer Turn-Watch dieses Freigaberennen gewinnt, akzeptiert OpenClaw das abgeschlossene
finale Assistenten-Item dennoch, sobald keine native Anfrage, kein Item und kein dynamischer
Tool-Abschluss mehr aktiv ist und die Assistentenausgabe-Freigabe noch zum zuletzt
abgeschlossenen Item gehört, ohne späteren Item-Abschluss. Dadurch kann die finale Antwort nach
abgeschlossener Tool-Arbeit erhalten bleiben, ohne den Turn erneut abzuspielen. Partielle
Assistenten-Deltas, veraltete frühere Antworten und leere spätere Abschlüsse qualifizieren sich nicht.
Replay-sichere Stdio-App-Server-Fehler,
einschließlich Turn-Completion-Idle-Timeouts ohne Assistenten-, Tool-, Active-Item-
oder Side-Effect-Nachweis, werden einmal mit einem frischen App-Server-Versuch wiederholt. Unsichere
Timeouts legen den blockierten App-Server-Client dennoch still und geben die OpenClaw-
Sitzungsspur frei. Außerdem löschen sie die veraltete native Thread-Bindung, statt
automatisch erneut abgespielt zu werden. Completion-Watch-Timeouts zeigen Codex-spezifischen Timeout-
Text: Replay-sichere Fälle sagen, dass die Antwort unvollständig sein kann, während unsichere Fälle
den Benutzer auffordern, den aktuellen Zustand vor einem erneuten Versuch zu prüfen. Öffentliche Timeout-Diagnosen
enthalten strukturelle Felder wie die letzte App-Server-Benachrichtigungsmethode,
ID/Typ/Rolle des rohen Assistentenantwort-Items, aktive Anfrage-/Item-Zahlen und den aktivierten
Watch-Zustand. Wenn die letzte Benachrichtigung ein rohes Assistentenantwort-Item ist,
enthalten sie außerdem eine begrenzte Vorschau des Assistententexts. Sie enthalten keine rohen Prompt- oder
Tool-Inhalte.

Umgebungs-Overrides bleiben für lokale Tests verfügbar:

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
für wiederholbare Deployments bevorzugt, weil sie das Plugin-Verhalten in derselben
überprüften Datei wie den Rest der Codex-Harness-Einrichtung hält.

## Native Codex-Plugins

Native Codex-Plugin-Unterstützung verwendet die eigenen App- und Plugin-Fähigkeiten des Codex App-Servers
im selben Codex-Thread wie der OpenClaw-Harness-Turn. OpenClaw
übersetzt Codex-Plugins nicht in synthetische `codex_plugin_*`-OpenClaw-
Dynamic Tools.

`codexPlugins` wirkt sich nur auf Sitzungen aus, die den nativen Codex-Harness auswählen. Es
hat keine Auswirkung auf integrierte Harness-Läufe, normale OpenAI-Provider-Läufe, ACP-Konversations-
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

Die Thread-App-Konfiguration wird berechnet, wenn OpenClaw eine Codex-Harness-Sitzung einrichtet
oder eine veraltete Codex-Thread-Bindung ersetzt. Sie wird nicht bei jedem Turn neu berechnet.
Nachdem Sie `codexPlugins` geändert haben, verwenden Sie `/new`, `/reset` oder starten Sie den Gateway neu, damit
zukünftige Codex-Harness-Sitzungen mit dem aktualisierten App-Set starten.

Informationen zu Migrationsfähigkeit, App-Inventar, Richtlinie für destruktive Aktionen,
Elicitations und nativen Plugin-Diagnosen finden Sie unter
[Native Codex-Plugins](/de/plugins/codex-native-plugins).

Der OpenAI-seitige App- und Plugin-Zugriff wird durch das angemeldete Codex-Konto
und, für Business- und Enterprise/Edu-Workspaces, durch Workspace-App-Steuerungen kontrolliert. Siehe
[Codex mit Ihrem ChatGPT-Plan verwenden](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
für OpenAIs Übersicht zu Konto- und Workspace-Steuerungen.

## Computer Use

Computer Use wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex Computer Use](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw vendort die Desktop-Control-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex App-Server vor, prüft, dass der
`computer-use`-MCP-Server verfügbar ist, und lässt Codex dann während Codex-Mode-Turns
die nativen MCP-Tool-Aufrufe besitzen.

## Laufzeitgrenzen

Der Codex-Harness ändert nur den Low-Level eingebetteten Agent-Executor.

- OpenClaw-Dynamic-Tools werden unterstützt. Codex fordert OpenClaw auf, diese
  Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.
- Codex-native Shell-, Patch-, MCP- und native App-Tools gehören Codex.
  OpenClaw kann ausgewählte native Ereignisse über das unterstützte
  Relay beobachten oder blockieren, schreibt aber native Tool-Argumente nicht um.
- Codex besitzt native Compaction. OpenClaw hält einen Transcript-Spiegel für Kanal-
  Verlauf, Suche, `/new`, `/reset` und zukünftige Modell- oder Harness-Wechsel, ersetzt aber
  Codex-Compaction nicht durch einen OpenClaw- oder Context-Engine-
  Summarizer.
- Mediengenerierung, Medienverständnis, TTS, Approvals und Messaging-Tool-
  Ausgabe laufen weiterhin über die passenden OpenClaw-Provider-/Modelleinstellungen.
- `tool_result_persist` gilt für OpenClaw-eigene Transcript-Tool-Ergebnisse, nicht für
  Codex-native Tool-Ergebnisdatensätze.

Informationen zu Hook-Layern, unterstützten V1-Oberflächen, nativer Berechtigungsbehandlung, Queue-
Steuerung, Codex-Feedback-Upload-Mechanik und Compaction-Details finden Sie unter
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime).

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist bei
neuen Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Modell aus, aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet den integrierten Harness statt Codex:** Stellen Sie sicher, dass die Modellreferenz
`openai/gpt-*` beim offiziellen OpenAI-Provider ist und dass das Codex-Plugin
installiert und aktiviert ist. Wenn Sie beim Testen strikten Nachweis benötigen, setzen Sie Provider- oder
Modell-`agentRuntime.id: "codex"`. Eine erzwungene Codex-Laufzeit schlägt fehl, statt
auf OpenClaw zurückzufallen.

**OpenAI Codex-Laufzeit fällt auf den API-Key-Pfad zurück:** Sammeln Sie einen redigierten
Gateway-Auszug, der Modell, Laufzeit, ausgewählten Provider und Fehler zeigt.
Bitten Sie betroffene Mitwirkende, diesen Read-only-Befehl auf ihrem OpenClaw-Host auszuführen:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Nützliche Auszüge enthalten normalerweise `openai/gpt-5.5` oder `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` oder `harnessRuntime`,
`candidateProvider: "openai"` und ein `401`-, `Incorrect API key`- oder
`No API key`-Ergebnis. Ein korrigierter Lauf sollte den OpenAI-OAuth-
Pfad statt eines einfachen OpenAI-API-Key-Fehlers zeigen.

**Legacy-Codex-Modellreferenzen bleiben in der Konfiguration:** Führen Sie `openclaw doctor --fix` aus.
Doctor schreibt Legacy-Modellreferenzen zu `openai/*` um, entfernt veraltete Sitzungs- und
Whole-Agent-Laufzeit-Pins und erhält vorhandene Auth-Profile-Overrides.

**Der App-Server wird abgelehnt:** Verwenden Sie Codex App-Server `0.125.0` oder neuer.
Prereleases derselben Version oder Build-Suffix-Versionen wie
`0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil OpenClaw den
stabilen `0.125.0`-Protokollboden prüft.

**`/codex status` kann keine Verbindung herstellen:** Prüfen Sie, dass das gebündelte `codex`-Plugin
aktiviert ist, dass `plugins.allow` es einschließt, wenn eine Allowlist konfiguriert ist, und
dass benutzerdefinierte `appServer.command`-, `url`-, `authToken`- oder Header-Werte gültig sind.

**Modellerkennung ist langsam:** Senken Sie
`plugins.entries.codex.config.discovery.timeoutMs` oder deaktivieren Sie die Erkennung. Siehe
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference#model-discovery).

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`,
Header und dass der entfernte App-Server dieselbe Codex App-Server-
Protokollversion spricht.

**Native Shell- oder Patch-Tools sind mit `Native hook relay unavailable` blockiert:**
Der Codex-Thread versucht weiterhin, eine native Hook-Relay-ID zu verwenden, die OpenClaw nicht
mehr registriert hat. Dies ist ein Problem mit dem nativen Codex-Hook-Transport, kein Fehler des ACP-
Backends, Providers, von GitHub oder eines Shell-Befehls. Starten Sie im
betroffenen Chat mit `/new` oder `/reset` eine neue Sitzung und versuchen Sie dann erneut einen harmlosen Befehl. Wenn das
einmal funktioniert, der nächste native Tool-Aufruf aber wieder fehlschlägt, behandeln Sie `/new` nur als temporären
Workaround: Kopieren Sie den Prompt in eine neue Sitzung, nachdem Sie den Codex-
App-Server oder das OpenClaw Gateway neu gestartet haben, damit alte Threads verworfen und native Hook-
Registrierungen neu erstellt werden.

**Ein Nicht-Codex-Modell verwendet den integrierten Harness:** Das ist erwartetes Verhalten, sofern
Provider- oder Modell-Runtime-Richtlinien es nicht an einen anderen Harness weiterleiten. Einfache Nicht-OpenAI-
Provider-Refs bleiben im Modus `auto` auf ihrem normalen Provider-Pfad.

**Computer Use ist installiert, aber Tools werden nicht ausgeführt:** Prüfen Sie
`/codex computer-use status` in einer neuen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie die Wiederherstellung des nativen Hook-Relays oben. Siehe
[Codex Computer Use](/de/plugins/codex-computer-use#troubleshooting).

## Verwandte Themen

- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex Computer Use](/de/plugins/codex-computer-use)
- [Agent-Runtimes](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [OpenAI Codex-Hilfe](https://help.openai.com/en/collections/14937394-codex)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Plugin-Hooks](/de/plugins/hooks)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Status](/de/cli/status)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
