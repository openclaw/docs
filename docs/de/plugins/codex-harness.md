---
read_when:
    - Sie möchten das gebündelte Codex-App-Server-Harness verwenden
    - Sie benötigen Codex-Harness-Konfigurationsbeispiele
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, statt auf OpenClaw zurückzufallen
summary: OpenClaw-Embedded-Agent-Turns über das gebündelte Codex-App-Server-Harness ausführen
title: Codex-Harness
x-i18n:
    generated_at: "2026-07-03T13:27:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589aed06678207b3349c17dd1997c2d17abd5f4b8747fc18fd858b5a03a2d003
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete OpenAI-Agent-Turns
über den Codex-App-Server statt über den integrierten OpenClaw-Harness auszuführen.

Verwenden Sie den Codex-Harness, wenn Codex die Low-Level-Agent-Sitzung besitzen soll:
native Thread-Fortsetzung, native Tool-Fortsetzung, native Compaction und
App-Server-Ausführung. OpenClaw besitzt weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl,
dynamische OpenClaw-Tools, Genehmigungen, Medienzustellung und die sichtbare
Transkriptspiegelung.

Die normale Einrichtung verwendet kanonische OpenAI-Modellreferenzen wie `openai/gpt-5.5`.
Konfigurieren Sie keine Legacy-Codex-GPT-Referenzen. Legen Sie die OpenAI-Agent-Auth-Reihenfolge
unter `auth.order.openai` ab; ältere Legacy-Codex-Auth-Profil-IDs und
Legacy-Codex-Auth-Reihenfolgeeinträge sind Legacy-Zustand, der durch
`openclaw doctor --fix` repariert wird.

Wenn keine OpenClaw-Sandbox aktiv ist, startet OpenClaw Codex-App-Server-Threads
mit aktiviertem nativem Codex-Code-Modus, während code-mode-only standardmäßig deaktiviert bleibt.
Dadurch bleiben native Codex-Workspace- und Code-Fähigkeiten verfügbar, während
dynamische OpenClaw-Tools weiterhin über die App-Server-Bridge `item/tool/call` laufen.
Aktives OpenClaw-Sandboxing und eingeschränkte Tool-Richtlinien deaktivieren den nativen Code-Modus
vollständig, sofern Sie sich nicht für den experimentellen Sandbox-Exec-Server-Pfad entscheiden.

Diese Codex-native Funktion ist getrennt vom
[OpenClaw-Code-Modus](/de/reference/code-mode), einer optionalen QuickJS-WASI-
Runtime für generische OpenClaw-Läufe mit einer anderen `exec`-Eingabeform.

Für die breitere Aufteilung von Modell, Provider und Runtime beginnen Sie mit
[Agent-Runtimes](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Runtime, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Wenn Ihre Konfiguration `plugins.allow` verwendet, schließen Sie `codex` ein.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig
  eine kompatible Codex-App-Server-Binärdatei, sodass lokale `codex`-Befehle in `PATH`
  den normalen Harness-Start nicht beeinflussen.
- Codex-Auth verfügbar über `openclaw models auth login --provider openai`,
  ein App-Server-Konto im Codex-Home des Agenten oder ein explizites Codex-API-Schlüssel-
  Auth-Profil.

Informationen zu Auth-Priorität, Umgebungsisolation, benutzerdefinierten App-Server-Befehlen, Modell-
Discovery und allen Konfigurationsfeldern finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Schnellstart

Die meisten Benutzer, die Codex in OpenClaw verwenden möchten, wollen diesen Pfad: mit einem
ChatGPT/Codex-Abonnement anmelden, das gebündelte `codex`-Plugin aktivieren und eine
kanonische `openai/gpt-*`-Modellreferenz verwenden.

Melden Sie sich mit Codex OAuth an:

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

Starten Sie das Gateway nach Änderungen an der Plugin-Konfiguration neu. Wenn ein vorhandener Chat bereits
eine Sitzung hat, verwenden Sie `/new` oder `/reset`, bevor Sie Runtime-Änderungen testen, damit der nächste
Turn den Harness aus der aktuellen Konfiguration auflöst.

## Konfiguration

Die Schnellstart-Konfiguration ist die minimal funktionsfähige Codex-Harness-Konfiguration. Legen Sie Codex-
Harness-Optionen in der OpenClaw-Konfiguration fest und verwenden Sie die CLI nur für Codex-Auth:

| Bedarf                                 | Festlegen                                                                        | Wo                                 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Harness aktivieren                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw-Konfiguration             |
| Eine allowlist-basierte Plugin-Installation beibehalten | `codex` in `plugins.allow` einschließen                                          | OpenClaw-Konfiguration             |
| OpenAI-Agent-Turns über Codex routen   | `agents.defaults.model` oder `agents.list[].model` als `openai/gpt-*`            | OpenClaw-Agent-Konfiguration       |
| Mit ChatGPT/Codex OAuth anmelden       | `openclaw models auth login --provider openai`                                   | CLI-Auth-Profil                    |
| API-Schlüssel-Backup für Codex-Läufe hinzufügen | `openai:*`-API-Schlüsselprofil nach Abonnement-Auth in `auth.order.openai` aufgeführt | CLI-Auth-Profil + OpenClaw-Konfiguration |
| Geschlossen fehlschlagen, wenn Codex nicht verfügbar ist | Provider- oder Modell-`agentRuntime.id: "codex"`                                | OpenClaw-Modell-/Provider-Konfiguration |
| Direkten OpenAI-API-Traffic verwenden  | Provider- oder Modell-`agentRuntime.id: "openclaw"` mit normaler OpenAI-Auth     | OpenClaw-Modell-/Provider-Konfiguration |
| App-Server-Verhalten abstimmen         | `plugins.entries.codex.config.appServer.*`                                       | Codex-Plugin-Konfiguration         |
| Native Codex-Plugin-Apps aktivieren    | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-Plugin-Konfiguration         |
| Codex Computer Use aktivieren          | `plugins.entries.codex.config.computerUse.*`                                     | Codex-Plugin-Konfiguration         |

Verwenden Sie `openai/gpt-*`-Modellreferenzen für Codex-gestützte OpenAI-Agent-Turns. Bevorzugen Sie
`auth.order.openai` für die Reihenfolge Abonnement zuerst/API-Schlüssel als Backup. Vorhandene
Legacy-Codex-Auth-Profil-IDs und die Legacy-Codex-Auth-Reihenfolge sind nur durch Doctor verwalteter
Legacy-Zustand; schreiben Sie keine neuen Legacy-Codex-GPT-Referenzen.

Legen Sie `compaction.model` oder `compaction.provider` nicht für Codex-gestützte Agenten fest.
Codex verdichtet über seinen nativen App-Server-Thread-Zustand, daher ignoriert OpenClaw
diese lokalen Summarizer-Overrides zur Laufzeit und `openclaw doctor --fix` entfernt
sie, wenn der Agent Codex verwendet.

Lossless bleibt als Kontext-Engine für Assembly, Ingestion und
Wartung rund um Codex-Turns unterstützt. Konfigurieren Sie es über
`plugins.slots.contextEngine: "lossless-claw"` und
`plugins.entries.lossless-claw.config.summaryModel`, nicht über
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migriert die alte
Form `compaction.provider: "lossless-claw"` in den Lossless-Kontext-Engine-Slot,
wenn Codex die aktive Runtime ist, aber native Codex besitzt weiterhin die Compaction.

Der native Codex-App-Server-Harness unterstützt Kontext-Engines, die
Pre-Prompt-Assembly erfordern. Generische CLI-Backends, einschließlich `codex-cli`, stellen
diese Host-Fähigkeit nicht bereit.

Für Codex-gestützte Agenten startet `/compact` die native Codex-App-Server-Compaction auf
dem gebundenen Thread. OpenClaw wartet nicht auf den Abschluss, erzwingt kein OpenClaw-
Timeout, startet den gemeinsam genutzten App-Server nicht neu und fällt nicht auf eine Kontext-Engine oder
einen öffentlichen OpenAI-Summarizer zurück. Wenn die native Codex-Thread-Bindung fehlt oder
veraltet ist, schlägt der Befehl geschlossen fehl, damit der Operator die echte Runtime-Grenze sieht,
statt stillschweigend Compaction-Backends zu wechseln.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In dieser Form laufen beide Profile weiterhin über Codex für `openai/gpt-*`-Agent-
Turns. Der API-Schlüssel ist nur ein Auth-Fallback, keine Anforderung, zu OpenClaw oder
einfachen OpenAI Responses zu wechseln.

Der Rest dieser Seite behandelt häufige Varianten, zwischen denen Benutzer wählen müssen:
Bereitstellungsform, fail-closed Routing, Guardian-Genehmigungsrichtlinie, native Codex-
Plugins und Computer Use. Vollständige Optionslisten, Standardwerte, Enums, Discovery,
Umgebungsisolation, Timeouts und App-Server-Transportfelder finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Codex-Runtime überprüfen

Verwenden Sie `/status` in dem Chat, in dem Sie Codex erwarten. Ein Codex-gestützter OpenAI-Agent-
Turn zeigt:

```text
Runtime: OpenAI Codex
```

Prüfen Sie anschließend den Codex-App-Server-Zustand:

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

- Verwenden Sie `openai/gpt-*` für OpenAI-Agent-Turns über Codex.
- Verwenden Sie keine Legacy-Codex-GPT-Referenzen in der Konfiguration. Führen Sie `openclaw doctor --fix` aus, um
  Legacy-Referenzen und veraltete Sitzungs-Routen-Pins zu reparieren.
- `agentRuntime.id: "codex"` ist für den normalen OpenAI-Automatikmodus optional, aber nützlich,
  wenn eine Bereitstellung geschlossen fehlschlagen soll, falls Codex nicht verfügbar ist.
- `agentRuntime.id: "openclaw"` optiert einen Provider oder ein Modell bewusst in die eingebettete OpenClaw-
  Runtime.
- `/codex ...` steuert native Codex-App-Server-Konversationen aus dem Chat.
- ACP/acpx ist ein separater externer Harness-Pfad. Verwenden Sie ihn nur, wenn der Benutzer
  ACP/acpx oder einen externen Harness-Adapter anfordert.

Häufiges Befehls-Routing:

| Benutzerabsicht                                      | Verwenden                                                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Den aktuellen Chat anhängen                          | `/codex bind [--cwd <path>]`                                                                          |
| Einen vorhandenen Codex-Thread fortsetzen            | `/codex resume <thread-id>`                                                                           |
| Codex-Threads auflisten oder filtern                 | `/codex threads [filter]`                                                                             |
| Native Codex-Plugins auflisten                       | `/codex plugins list`                                                                                 |
| Ein konfiguriertes natives Codex-Plugin aktivieren oder deaktivieren | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Eine vorhandene Codex-CLI-Sitzung auf einem gekoppelten Node anhängen | `/codex sessions --host <node> [filter]`, dann `/codex resume <session-id> --host <node> --bind here` |
| Nur Codex-Feedback senden                            | `/codex diagnostics [note]`                                                                           |
| Eine ACP/acpx-Aufgabe starten                        | ACP/acpx-Sitzungsbefehle, nicht `/codex`                                                              |

| Anwendungsfall                                      | Konfiguration                                                         | Überprüfung                            | Hinweise                              |
| --------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------- | ------------------------------------- |
| ChatGPT/Codex-Abonnement mit nativer Codex-Runtime  | `openai/gpt-*` plus aktiviertes `codex`-Plugin                        | `/status` zeigt `Runtime: OpenAI Codex` | Empfohlener Pfad                      |
| Fail-closed, wenn Codex nicht verfügbar ist         | Provider oder Modell `agentRuntime.id: "codex"`                       | Turn schlägt statt eingebettetem Fallback fehl | Für reine Codex-Deployments verwenden |
| Direkten OpenAI-API-Key-Traffic durch OpenClaw leiten | Provider oder Modell `agentRuntime.id: "openclaw"` und normale OpenAI-Authentifizierung | `/status` zeigt OpenClaw-Runtime       | Nur verwenden, wenn OpenClaw beabsichtigt ist |
| Legacy-Konfiguration                                | Legacy-Codex-GPT-Refs                                                 | `openclaw doctor --fix` schreibt sie um | Neue Konfiguration nicht so schreiben |
| ACP/acpx-Codex-Adapter                              | ACP `sessions_spawn({ runtime: "acp" })`                              | ACP-Aufgaben-/Sitzungsstatus           | Getrennt vom nativen Codex-Harness    |

`agents.defaults.imageModel` folgt derselben Präfix-Aufteilung. Verwenden Sie `openai/gpt-*`
für die normale OpenAI-Route und `codex/gpt-*` nur, wenn Bildverständnis
über einen begrenzten Codex-App-Server-Turn laufen soll. Verwenden Sie keine
Legacy-Codex-GPT-Refs; Doctor schreibt dieses Legacy-Präfix zu `openai/gpt-*` um.

## Deployment-Muster

### Einfaches Codex-Deployment

Verwenden Sie die Quickstart-Konfiguration, wenn alle OpenAI-Agent-Turns
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
`codex`-Agent den Codex-App-Server.

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

Wenn Codex erzwungen wird, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann.

## App-Server-Richtlinie

Standardmäßig startet das Plugin die von OpenClaw verwaltete Codex-Binärdatei lokal mit stdio-
Transport. Setzen Sie `appServer.command` nur, wenn Sie bewusst eine
andere ausführbare Datei ausführen möchten. Verwenden Sie WebSocket-Transport nur, wenn bereits ein App-Server
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
implizite YOLO-Haltung nicht erlauben, wählt OpenClaw stattdessen zulässige Guardian-Berechtigungen aus.
Wenn für die Sitzung eine OpenClaw-Sandbox aktiv ist, deaktiviert OpenClaw für diesen
Turn den nativen Codex-Code-Modus, Benutzer-MCP-Server und App-gestützte Plugin-Ausführung,
statt sich auf hostseitiges Codex-Sandboxing zu verlassen. Shell-Zugriff wird
über OpenClaw-Sandbox-gestützte dynamische Tools wie `sandbox_exec` und
`sandbox_process` bereitgestellt, wenn die normalen Exec-/Process-Tools verfügbar sind.

Verwenden Sie den normalisierten OpenClaw-Exec-Modus, wenn Sie native Codex-Auto-Review vor
Sandbox-Escapes oder zusätzlichen Berechtigungen wünschen:

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
Guardian-geprüften Genehmigungen zu, normalerweise
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` und
`sandbox: "workspace-write"`, wenn die lokalen Anforderungen diese Werte zulassen.
In `tools.exec.mode: "auto"` bewahrt OpenClaw keine Legacy-unsicheren Codex-
Overrides für `approvalPolicy: "never"` oder `sandbox: "danger-full-access"` auf; verwenden Sie
`tools.exec.mode: "full"` für eine bewusst genehmigungsfreie Codex-Haltung. Das
Legacy-Preset `plugins.entries.codex.config.appServer.mode: "guardian"` funktioniert weiterhin,
aber `tools.exec.mode: "auto"` ist die normalisierte OpenClaw-Oberfläche.

Den Vergleich auf Modusebene mit Host-Exec-Genehmigungen und ACPX-Berechtigungen
finden Sie unter [Berechtigungsmodi](/de/tools/permission-modes).

Alle App-Server-Felder, Authentifizierungsreihenfolge, Umgebungsisolation, Erkennung und
Timeout-Verhalten finden Sie in der [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Befehle und Diagnosen

Das gebündelte Plugin registriert `/codex` als Slash-Befehl in jedem Kanal, der
OpenClaw-Textbefehle unterstützt.

Native Ausführung und Steuerung erfordern einen Owner oder einen `operator.admin`-Gateway-
Client. Dazu gehören das Binden oder Fortsetzen von Threads, das Senden oder Stoppen von Turns,
das Ändern von Modell, Schnellmodus oder Berechtigungsstatus, Compaction oder Review sowie
das Lösen einer Bindung. Andere autorisierte Absender behalten schreibgeschützte Status-, Hilfe-,
Konto-, Modell-, Thread-, MCP-Server-, Skill- und Bindungsinspektionsbefehle.

Gängige Formen:

- `/codex status` prüft App-Server-Konnektivität, Modelle, Konto, Rate-Limits,
  MCP-Server und Skills.
- `/codex models` listet Live-Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet aktuelle Codex-App-Server-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen
  bestehenden Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu komprimieren.
- `/codex review` startet die native Codex-Review für den angehängten Thread.
- `/codex diagnostics [note]` fragt nach, bevor Codex-Feedback für den
  angehängten Thread gesendet wird.
- `/codex account` zeigt Konto- und Rate-Limit-Status.
- `/codex mcp` listet den MCP-Server-Status des Codex-App-Servers auf.
- `/codex skills` listet Codex-App-Server-Skills auf.

Beginnen Sie bei den meisten Support-Berichten mit `/diagnostics [note]` in der Unterhaltung,
in der der Fehler aufgetreten ist. Dies erstellt einen Gateway-Diagnosebericht und fragt bei Codex-
Harness-Sitzungen nach Zustimmung, das relevante Codex-Feedback-Bundle zu senden.
Informationen zum Datenschutzmodell und zum Verhalten in Gruppenchats finden Sie unter
[Diagnoseexport](/de/gateway/diagnostics).

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie speziell den Codex-
Feedback-Upload für den aktuell angehängten Thread ohne das vollständige Gateway-
Diagnose-Bundle wünschen.

### Codex-Threads lokal prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu prüfen, ist oft, den nativen Codex-
Thread direkt zu öffnen:

```bash
codex resume <thread-id>
```

Rufen Sie die Thread-ID aus der abgeschlossenen `/diagnostics`-Antwort, `/codex binding` oder
`/codex threads [filter]` ab.

Upload-Mechanik und Diagnosegrenzen auf Runtime-Ebene finden Sie unter
[Codex-Harness-Runtime](/de/plugins/codex-harness-runtime#codex-feedback-upload).

Auth wird in dieser Reihenfolge ausgewählt:

1. Geordnete OpenAI-Auth-Profile für den Agent, vorzugsweise unter
   `auth.order.openai`. Führen Sie `openclaw doctor --fix` aus, um ältere
   Legacy-Codex-Auth-Profil-IDs und Legacy-Codex-Auth-Reihenfolge zu migrieren.
2. Das bestehende Konto des App-Servers im Codex-Home dieses Agents.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Auth
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Auth-Profil im Stil eines ChatGPT-Abonnements erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem gestarteten Codex-Kindprozess. Dadurch
bleiben API-Keys auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Turns versehentlich über die API abgerechnet werden.
Explizite Codex-API-Key-Profile und lokaler stdio-Env-Key-Fallback verwenden App-Server-
Login statt vererbter Kindprozess-Umgebung. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-Env-API-Key-Fallback; verwenden Sie ein explizites Auth-Profil oder das
eigene Konto des entfernten App-Servers.
Wenn native Codex-Plugins konfiguriert sind, installiert oder aktualisiert OpenClaw diese
Plugins über den verbundenen App-Server, bevor Plugin-eigene Apps dem
Codex-Thread bereitgestellt werden. `app/list` bleibt die maßgebliche Quelle für App-IDs,
Zugänglichkeit und Metadaten, aber OpenClaw besitzt die Aktivierungsentscheidung pro Thread:
Wenn die Richtlinie eine aufgelistete zugängliche App erlaubt, sendet OpenClaw
`thread/start.config.apps[appId].enabled = true`, selbst wenn `app/list` diese App derzeit
als deaktiviert meldet. Dieser Pfad erfindet keine App-Installation für
unbekannte IDs; OpenClaw aktiviert nur Marketplace-Plugins mit `plugin/install`
und aktualisiert anschließend das Inventar.

Wenn ein Abonnementprofil ein Codex-Nutzungslimit erreicht, zeichnet OpenClaw die Rücksetzzeit auf,
wenn Codex eine meldet, und versucht das nächste geordnete Auth-Profil für denselben
Codex-Lauf. Wenn die Rücksetzzeit verstrichen ist, wird das Abonnementprofil wieder berechtigt,
ohne das ausgewählte `openai/gpt-*`-Modell oder die Codex-Runtime zu ändern.

Für lokale stdio-App-Server-Starts setzt OpenClaw `CODEX_HOME` auf ein Agent-spezifisches
Verzeichnis, sodass Codex-Konfiguration, Auth-/Kontodateien, Plugin-Cache/-Daten und nativer
Thread-Status standardmäßig nicht das persönliche `~/.codex` des Operators lesen oder
schreiben. OpenClaw bewahrt das normale Prozess-`HOME`; von Codex ausgeführte Unterprozesse
können weiterhin Benutzer-Home-Konfiguration und Token finden, und Codex kann gemeinsame
`$HOME/.agents/skills`- und `$HOME/.agents/plugins/marketplace.json`-Einträge erkennen.

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

`appServer.clearEnv` wirkt sich nur auf den gestarteten Codex-App-Server-Kindprozess aus.
OpenClaw entfernt `CODEX_HOME` und `HOME` während der lokalen Startnormalisierung
aus dieser Liste: `CODEX_HOME` bleibt Agent-spezifisch, und `HOME` bleibt vererbt, damit
Unterprozesse normalen Benutzer-Home-Status verwenden können.

Dynamische Codex-Tools werden standardmäßig `searchable` geladen. OpenClaw stellt keine
dynamischen Tools bereit, die native Codex-Arbeitsbereichsoperationen duplizieren: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` und `update_plan`. Die meisten verbleibenden
OpenClaw-Integrationstools wie Messaging, Medien, Cron, Browser, Nodes,
Gateway und `heartbeat_respond` sind über die Codex-Toolsuche im Namespace
`openclaw` verfügbar, wodurch der anfängliche Modellkontext kleiner bleibt. Die Websuche
verwendet standardmäßig das gehostete Codex-Tool `web_search`, wenn die Suche aktiviert ist und kein
verwalteter Provider ausgewählt wurde. Native gehostete Suche und OpenClaws verwaltetes
dynamisches Tool `web_search` schließen sich gegenseitig aus, damit die verwaltete Suche
native Domain-Einschränkungen nicht umgehen kann. OpenClaw verwendet das verwaltete Tool, wenn die gehostete Suche
nicht verfügbar ist, explizit deaktiviert wurde oder durch einen ausgewählten verwalteten Provider ersetzt wurde.
OpenClaw hält Codex’ eigenständige Erweiterung `web.run` deaktiviert, weil
Produktionsdatenverkehr des App-Servers ihren benutzerdefinierten Namespace `web` ablehnt.
`tools.web.search.enabled: false` deaktiviert beide Pfade, ebenso Tool-deaktivierte
reine LLM-Läufe. Codex behandelt `"cached"` als Präferenz und löst sie für uneingeschränkte
App-Server-Durchläufe in Live-Zugriff auf externe Ressourcen auf. Der automatische verwaltete Fallback
schlägt geschlossen fehl, wenn native `allowedDomains` gesetzt sind, damit die Allowlist nicht
umgangen werden kann. Dauerhafte Änderungen an der effektiven Suchrichtlinie rotieren den gebundenen Codex-
Thread vor dem nächsten Durchlauf. Vorübergehende Einschränkungen pro Durchlauf verwenden einen temporären
eingeschränkten Thread und behalten die bestehende Bindung für eine spätere Wiederaufnahme bei.
`sessions_yield` und reine Source-Antworten von Message-Tools bleiben direkt, weil
dies Turn-Control-Verträge sind. `sessions_spawn` bleibt durchsuchbar, damit Codex’
natives `spawn_agent` die primäre Codex-Subagent-Oberfläche bleibt, während explizite
OpenClaw- oder ACP-Delegation weiterhin über den dynamischen Tool-Namespace
`openclaw` verfügbar ist. Heartbeat-Kollaborationsanweisungen weisen Codex an, nach
`heartbeat_respond` zu suchen, bevor ein Heartbeat-Turn beendet wird, wenn das Tool nicht bereits
geladen ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu einem benutzerdefinierten Codex-
App-Server herstellen, der zurückgestellte dynamische Tools nicht durchsuchen kann, oder wenn Sie die vollständige
Tool-Nutzlast debuggen.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard       | Bedeutung                                                                                  |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| `codexDynamicToolsLoading` | `"searchable"` | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Toolkontext zu legen. |
| `codexDynamicToolsExclude` | `[]`           | Zusätzliche Namen dynamischer OpenClaw-Tools, die aus Codex-App-Server-Turns ausgelassen werden sollen. |
| `codexPlugins`             | deaktiviert    | Native Codex-Plugin-/App-Unterstützung für migrierte, aus Quellen installierte kuratierte Plugins. |

Unterstützte `appServer`-Felder:

| Feld                                          | Standard                                               | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                                   | `"stdio"`                                              | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                                                                                                                                                                                       |
| `command`                                     | verwaltete Codex-Binärdatei                            | Ausführbare Datei für den stdio-Transport. Nicht setzen, um die verwaltete Binärdatei zu verwenden; nur für eine ausdrückliche Überschreibung setzen.                                                                                                                                                                                                                                                   |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumente für den stdio-Transport.                                                                                                                                                                                                                                                                                                                                                                     |
| `url`                                         | nicht gesetzt                                          | WebSocket-URL des app-server.                                                                                                                                                                                                                                                                                                                                                                          |
| `authToken`                                   | nicht gesetzt                                          | Bearer-Token für den WebSocket-Transport. Akzeptiert eine Literal-Zeichenfolge oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                       |
| `headers`                                     | `{}`                                                   | Zusätzliche WebSocket-Header. Header-Werte akzeptieren Literal-Zeichenfolgen oder SecretInput-Werte, zum Beispiel `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                    |
| `clearEnv`                                    | `[]`                                                   | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-app-server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat. OpenClaw behält pro Agent `CODEX_HOME` und das geerbte `HOME` für lokale Starts bei.                                                                                                                                              |
| `codeModeOnly`                                | `false`                                                | Aktiviert Codex' reine Code-Modus-Tool-Oberfläche. Dynamische OpenClaw-Tools bleiben bei Codex registriert, sodass verschachtelte `tools.*`-Aufrufe über die app-server-Bridge `item/tool/call` zurückgegeben werden.                                                                                                                                                                                  |
| `remoteWorkspaceRoot`                         | nicht gesetzt                                          | Remote-Arbeitsbereichswurzel des Codex-app-server. Wenn gesetzt, leitet OpenClaw die lokale Arbeitsbereichswurzel aus dem aufgelösten OpenClaw-Arbeitsbereich ab, behält das aktuelle cwd-Suffix unter dieser Remote-Wurzel bei und sendet nur das endgültige app-server-cwd an Codex. Wenn das cwd außerhalb der aufgelösten OpenClaw-Arbeitsbereichswurzel liegt, bricht OpenClaw sicherheitsorientiert ab, statt einen Gateway-lokalen Pfad an den Remote-app-server zu senden. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout für Control-Plane-Aufrufe des app-server.                                                                                                                                                                                                                                                                                                                                                      |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ruhefenster, nachdem Codex einen Turn akzeptiert hat oder nach einer Turn-bezogenen app-server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                                                   |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Completion-Idle- und Fortschrittswächter, der nach einer Tool-Übergabe, nativen Tool-Abschluss, Fortschritt des rohen Assistant nach einem Tool, Abschluss roher Reasoning-Ausgabe oder Reasoning-Fortschritt verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder schwere Workloads, bei denen die Synthese nach einem Tool legitimerweise länger ruhig bleiben kann als das Budget für die endgültige Assistant-Ausgabe. |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht verbieten | Voreinstellung für YOLO- oder Guardian-geprüfte Ausführung. Lokale stdio-Anforderungen, die `danger-full-access`, die Approval-Einstellung `never` oder den Reviewer `user` auslassen, machen Guardian zum impliziten Standard.                                                                                                                                                                        |
| `approvalPolicy`                              | `"never"` oder eine erlaubte Guardian-Approval-Einstellung | Native Codex-Approval-Einstellung, die an Thread-Start/Fortsetzung/Turn gesendet wird. Guardian-Standards bevorzugen `"on-request"`, wenn erlaubt.                                                                                                                                                                                                                                                     |
| `sandbox`                                     | `"danger-full-access"` oder eine erlaubte Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzung gesendet wird. Guardian-Standards bevorzugen `"workspace-write"`, wenn erlaubt, andernfalls `"read-only"`. Wenn eine OpenClaw-Sandbox aktiv ist, verwenden `danger-full-access`-Turns Codex `workspace-write` mit Netzwerkzugriff, der aus der Egress-Einstellung der OpenClaw-Sandbox abgeleitet wird.                                |
| `approvalsReviewer`                           | `"user"` oder ein erlaubter Guardian-Reviewer          | Verwenden Sie `"auto_review"`, damit Codex native Approval-Aufforderungen prüft, wenn erlaubt, andernfalls `guardian_subagent` oder `user`. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                                                                                                                                |
| `serviceTier`                                 | nicht gesetzt                                          | Optionale Service-Stufe des Codex-app-server. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, `null` löscht die Überschreibung, und das Legacy-`"fast"` wird als `"priority"` akzeptiert.                                                                                                                                                                            |
| `networkProxy`                                | deaktiviert                                            | Aktiviert Codex-Berechtigungsprofil-Netzwerkfunktionen für app-server-Befehle. OpenClaw definiert die ausgewählte Konfiguration `permissions.<profile>.network` und wählt sie mit `default_permissions` aus, statt `sandbox` zu senden.                                                                                                                                                               |
| `experimental.sandboxExecServer`              | `false`                                                | Preview-Opt-in, das eine durch die OpenClaw-Sandbox gestützte Codex-Umgebung bei Codex app-server 0.132.0 oder neuer registriert, damit native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox laufen kann.                                                                                                                                                                                   |

`appServer.networkProxy` ist ausdrücklich, weil es den Codex-Sandbox-Vertrag
ändert. Wenn aktiviert, setzt OpenClaw auch `features.network_proxy.enabled` und
`default_permissions` in der Codex-Thread-Konfiguration, sodass das generierte
Berechtigungsprofil von Codex verwaltete Netzwerke starten kann. Standardmäßig
generiert OpenClaw aus dem Profilkörper einen kollisionsresistenten Profilnamen
`openclaw-network-<fingerprint>`; verwenden Sie `profileName` nur, wenn ein
stabiler lokaler Name erforderlich ist.

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

Wenn die normale app-server-Laufzeit `danger-full-access` wäre, verwendet das
Aktivieren von `networkProxy` Dateisystemzugriff im Workspace-Stil für das
generierte Berechtigungsprofil. Von Codex verwaltete Netzwerkdurchsetzung ist
Sandbox-Netzwerkbetrieb, daher würde ein Full-Access-Profil ausgehenden
Datenverkehr nicht schützen.
Domain-Einträge verwenden `allow` oder `deny`; Unix-Socket-Einträge verwenden
Codex' Werte `allow` oder `none`.

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt: Codex-`item/tool/call`-Anfragen verwenden standardmäßig einen 90-sekündigen
OpenClaw-Watchdog. Ein positives `timeoutMs`-Argument pro Aufruf verlängert
oder verkürzt dieses spezifische Tool-Budget. Das Tool `image_generate` verwendet
`agents.defaults.imageGenerationModel.timeoutMs`, wenn der Tool-Aufruf keinen
eigenen Timeout bereitstellt, oder andernfalls einen 120-sekündigen Standardwert
für die Bildgenerierung. Das Media-Understanding-Tool `image` verwendet
`tools.media.image.timeoutSeconds` oder seinen 60-sekündigen Media-Standardwert. Für das Bildverständnis
gilt dieser Timeout für die Anfrage selbst und wird nicht
durch frühere Vorbereitungsarbeit reduziert. Dynamische Tool-Budgets sind
auf 600000 ms begrenzt. Bei einem Timeout bricht OpenClaw das Tool-Signal
ab, sofern unterstützt, und gibt eine fehlgeschlagene Dynamic-Tool-Antwort an Codex zurück, damit der Turn
fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.
Dieser Watchdog ist das äußere dynamische `item/tool/call`-Budget; Provider-spezifische
Request-Timeouts laufen innerhalb dieses Aufrufs und behalten ihre eigenen Timeout-Semantiken bei.

Nachdem Codex einen Turn akzeptiert hat und nachdem OpenClaw auf eine turn-bezogene
App-Server-Anfrage geantwortet hat, erwartet der Harness, dass Codex im aktuellen Turn Fortschritt macht und
den nativen Turn schließlich mit `turn/completed` abschließt. Wenn der App-Server für
`appServer.turnCompletionIdleTimeoutMs` still bleibt, unterbricht OpenClaw nach bestem Aufwand
den Codex-Turn, zeichnet einen Diagnose-Timeout auf und gibt die
OpenClaw-Sitzungsbahn frei, damit nachfolgende Chatnachrichten nicht hinter einem veralteten
nativen Turn eingereiht werden. Die meisten nicht-terminalen Benachrichtigungen für denselben Turn deaktivieren diesen kurzen
Watchdog, weil Codex bewiesen hat, dass der Turn noch aktiv ist. Tool-Übergaben verwenden ein
längeres Idle-Budget nach Tools: nachdem OpenClaw eine `item/tool/call`-
Antwort zurückgibt, nachdem native Tool-Elemente wie `commandExecution` abgeschlossen sind, nach rohen
`custom_tool_call_output`-Abschlüssen und nach rohem Assistant-Fortschritt nach Tools,
rohen Reasoning-Abschlüssen oder Reasoning-Fortschritt nach Tools. Der Guard verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn konfiguriert, und
fällt andernfalls auf fünf Minuten zurück. Dasselbe Budget nach Tools verlängert außerdem den
Fortschritts-Watchdog für das stille Synthesefenster, bevor Codex das nächste
Ereignis des aktuellen Turns ausgibt. Globale App-Server-Benachrichtigungen, etwa Rate-Limit-Aktualisierungen,
setzen den Turn-Idle-Fortschritt nicht zurück. Reasoning-Abschlüsse, Commentary-
`agentMessage`-Abschlüsse sowie roher Reasoning- oder Assistant-Fortschritt vor Tools können
von einer automatischen finalen Antwort gefolgt werden, daher verwenden sie den Antwort-Guard nach Fortschritt
statt die Sitzungsbahn sofort freizugeben. Nur
finale/nicht-Commentary-abgeschlossene `agentMessage`-Elemente und rohe
Assistant-Abschlüsse vor Tools aktivieren die Assistant-Ausgabe-Freigabe: Wenn Codex danach still bleibt
ohne `turn/completed`, unterbricht OpenClaw den nativen Turn nach bestem Aufwand und
gibt die Sitzungsbahn frei. Wenn eine andere Turn-Überwachung dieses Freigaberennen gewinnt,
akzeptiert OpenClaw dennoch das abgeschlossene finale Assistant-Element, sobald keine native
Anfrage, kein Element und kein dynamischer Tool-Abschluss mehr aktiv ist und die
Assistant-Ausgabe-Freigabe weiterhin zum zuletzt abgeschlossenen Element gehört, ohne
späteren Elementabschluss. Dadurch kann die finale Antwort nach abgeschlossener Tool-
Arbeit erhalten bleiben, ohne den Turn erneut abzuspielen. Teilweise Assistant-Deltas, veraltete frühere
Antworten und leere spätere Abschlüsse qualifizieren sich nicht. Replay-sichere stdio-
App-Server-Fehler,
einschließlich Turn-Completion-Idle-Timeouts ohne Assistant-, Tool-, Active-Item-
oder Side-Effect-Evidence, werden einmal mit einem frischen App-Server-Versuch wiederholt. Unsichere
Timeouts nehmen den blockierten App-Server-Client dennoch außer Betrieb und geben die OpenClaw-
Sitzungsbahn frei. Sie löschen außerdem die veraltete native Thread-Bindung, statt
automatisch wiedergegeben zu werden. Completion-Watch-Timeouts zeigen Codex-spezifischen Timeout-
Text an: Replay-sichere Fälle sagen, dass die Antwort unvollständig sein kann, während unsichere Fälle
den Benutzer anweisen, den aktuellen Zustand vor einem erneuten Versuch zu prüfen. Öffentliche Timeout-Diagnosen
enthalten strukturelle Felder wie die letzte App-Server-Benachrichtigungsmethode,
ID/Typ/Rolle des rohen Assistant-Response-Elements, aktive Request-/Element-Zähler und den aktivierten
Watch-Status. Wenn die letzte Benachrichtigung ein rohes Assistant-Response-Element ist, enthalten sie
außerdem eine begrenzte Assistant-Textvorschau. Sie enthalten keine rohen Prompt- oder
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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Config wird
für wiederholbare Bereitstellungen bevorzugt, weil sie das Plugin-Verhalten in derselben
geprüften Datei wie den Rest der Codex-Harness-Einrichtung hält.

## Native Codex-Plugins

Die Unterstützung nativer Codex-Plugins verwendet die eigenen App- und Plugin-
Fähigkeiten des Codex-App-Servers im selben Codex-Thread wie der OpenClaw-Harness-Turn. OpenClaw
übersetzt Codex-Plugins nicht in synthetische `codex_plugin_*`-dynamische OpenClaw-
Tools.

`codexPlugins` wirkt sich nur auf Sitzungen aus, die den nativen Codex-Harness auswählen. Es
hat keine Wirkung auf integrierte Harness-Läufe, normale OpenAI-Provider-Läufe, ACP-Konversations-
Bindungen oder andere Harnesses.

Minimal migrierte Config:

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
oder eine veraltete Codex-Thread-Bindung ersetzt. Sie wird nicht bei jedem Turn neu berechnet.
Nachdem Sie `codexPlugins` geändert haben, verwenden Sie `/new`, `/reset` oder starten Sie das Gateway neu, damit
zukünftige Codex-Harness-Sitzungen mit dem aktualisierten App-Set starten.

Informationen zu Migrationsberechtigung, App-Inventar, Richtlinie für destruktive Aktionen,
Elicitations und nativen Plugin-Diagnosen finden Sie unter
[Native Codex-Plugins](/de/plugins/codex-native-plugins).

Der Zugriff auf Apps und Plugins auf OpenAI-Seite wird durch das angemeldete Codex-Konto
und, für Business- und Enterprise/Edu-Workspaces, durch Workspace-App-Steuerungen kontrolliert. Siehe
[Codex mit Ihrem ChatGPT-Plan verwenden](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
für OpenAIs Übersicht zu Konto- und Workspace-Steuerungen.

## Computer Use

Computer Use wird in einem eigenen Einrichtungsleitfaden behandelt:
[Codex Computer Use](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw vendort die Desktop-Control-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, verifiziert, dass der
`computer-use`-MCP-Server verfügbar ist, und lässt Codex dann während Turns im Codex-Modus die nativen MCP-
Tool-Aufrufe besitzen.

## Laufzeitgrenzen

Der Codex-Harness ändert nur den Low-Level-eingebetteten Agent-Executor.

- Dynamische OpenClaw-Tools werden unterstützt. Codex fordert OpenClaw auf, diese
  Tools auszuführen, sodass OpenClaw im Ausführungspfad bleibt.
- Codex-native Shell-, Patch-, MCP- und native App-Tools gehören Codex.
  OpenClaw kann ausgewählte native Ereignisse über das unterstützte
  Relay beobachten oder blockieren, schreibt native Tool-Argumente aber nicht um.
- Codex besitzt native Compaction. OpenClaw hält einen Transcript-Spiegel für Kanal-
  Verlauf, Suche, `/new`, `/reset` und zukünftiges Modell- oder Harness-Wechseln, ersetzt
  Codex-Compaction aber nicht durch einen OpenClaw- oder Context-Engine-
  Summarizer.
- Media-Generierung, Media-Verständnis, TTS, Genehmigungen und Messaging-Tool-
  Ausgabe laufen weiterhin über die passenden OpenClaw-Provider-/Modell-Einstellungen.
- `tool_result_persist` gilt für OpenClaw-eigene Transcript-Tool-Ergebnisse, nicht
  für Codex-native Tool-Ergebnisdatensätze.

Informationen zu Hook-Schichten, unterstützten V1-Oberflächen, nativer Berechtigungsbehandlung, Queue-
Steuerung, Codex-Feedback-Upload-Mechanik und Compaction-Details finden Sie unter
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime).

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist bei
neuen Configs erwartet. Wählen Sie ein `openai/gpt-*`-Modell aus, aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet den integrierten Harness statt Codex:** Stellen Sie sicher, dass die Modellreferenz
`openai/gpt-*` beim offiziellen OpenAI-Provider ist und dass das Codex-Plugin
installiert und aktiviert ist. Wenn Sie beim Testen strikten Nachweis benötigen, setzen Sie Provider- oder
Modell-`agentRuntime.id: "codex"`. Eine erzwungene Codex-Laufzeit schlägt fehl, statt
auf OpenClaw zurückzufallen.

**OpenAI-Codex-Laufzeit fällt auf den API-Key-Pfad zurück:** Sammeln Sie einen redigierten
Gateway-Auszug, der das Modell, die Laufzeit, den ausgewählten Provider und den Fehler zeigt.
Bitten Sie betroffene Mitwirkende, diesen schreibgeschützten Befehl auf ihrem OpenClaw-Host auszuführen:

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

Nützliche Auszüge enthalten üblicherweise `openai/gpt-5.5` oder `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` oder `harnessRuntime`,
`candidateProvider: "openai"` und ein `401`-, `Incorrect API key`- oder
`No API key`-Ergebnis. Ein korrigierter Lauf sollte den OpenAI-OAuth-
Pfad statt eines einfachen OpenAI-API-Key-Fehlers zeigen.

**Legacy-Codex-Modellreferenzen bleiben in der Config:** Führen Sie `openclaw doctor --fix` aus.
Doctor schreibt Legacy-Modellreferenzen zu `openai/*` um, entfernt veraltete Sitzungs- und
Whole-Agent-Laufzeit-Pins und bewahrt vorhandene Auth-Profil-Overrides.

**Der App-Server wird abgelehnt:** Verwenden Sie Codex-App-Server `0.125.0` oder neuer.
Prereleases derselben Version oder Versionen mit Build-Suffix wie
`0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil OpenClaw die
stabile `0.125.0`-Protokolluntergrenze testet.

**`/codex status` kann keine Verbindung herstellen:** Prüfen Sie, dass das gebündelte `codex`-Plugin
aktiviert ist, dass `plugins.allow` es enthält, wenn eine Allowlist konfiguriert ist, und
dass alle benutzerdefinierten `appServer.command`, `url`, `authToken` oder Header gültig sind.

**Modellerkennung ist langsam:** Senken Sie
`plugins.entries.codex.config.discovery.timeoutMs` oder deaktivieren Sie die Erkennung. Siehe
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference#model-discovery).

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`,
Header und dass der entfernte App-Server dieselbe Codex-App-Server-
Protokollversion spricht.

**Native Shell- oder Patch-Tools sind mit `Native hook relay unavailable` blockiert:**
Der Codex-Thread versucht weiterhin, eine native Hook-Relay-ID zu verwenden, die OpenClaw nicht mehr registriert hat. Dies ist ein Problem mit dem nativen Codex-Hook-Transport, kein Fehler des ACP-Backends, Providers, von GitHub oder eines Shell-Befehls. Starten Sie im betroffenen Chat mit `/new` oder `/reset` eine neue Sitzung und versuchen Sie dann einen harmlosen Befehl erneut. Wenn das einmal funktioniert, der nächste native Tool-Aufruf aber erneut fehlschlägt, behandeln Sie `/new` nur als temporäre Umgehung: Kopieren Sie den Prompt in eine neue Sitzung, nachdem Sie den Codex-App-Server oder das OpenClaw Gateway neu gestartet haben, damit alte Threads verworfen und native Hook-Registrierungen neu erstellt werden.

**Ein Nicht-Codex-Modell verwendet den integrierten Harness:** Das ist erwartet, sofern keine Provider- oder Modell-Runtime-Richtlinie es an einen anderen Harness weiterleitet. Einfache Nicht-OpenAI-Provider-Refs bleiben im `auto`-Modus auf ihrem normalen Provider-Pfad.

**Computer Use ist installiert, aber Tools werden nicht ausgeführt:** Prüfen Sie in einer neuen Sitzung `/codex computer-use status`. Wenn ein Tool `Native hook relay unavailable` meldet, verwenden Sie die oben beschriebene Wiederherstellung des nativen Hook-Relays. Siehe [Codex Computer Use](/de/plugins/codex-computer-use#troubleshooting).

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
- [Testing](/de/help/testing-live#live-codex-app-server-harness-smoke)
