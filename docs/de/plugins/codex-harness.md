---
read_when:
    - Sie möchten das gebündelte Codex-App-Server-Harness verwenden
    - Sie benötigen Beispiele für die Codex-Harness-Konfiguration
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, statt auf OpenClaw zurückzufallen.
summary: Führen Sie eingebettete OpenClaw-Agent-Turns über den gebündelten Codex-App-Server-Harness aus
title: Codex-Harness
x-i18n:
    generated_at: "2026-06-27T17:46:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete OpenAI-Agent-Durchläufe
über den Codex app-server statt über den integrierten OpenClaw-Harness auszuführen.

Verwenden Sie den Codex-Harness, wenn Codex die Low-Level-Agentensitzung verwalten soll:
natives Fortsetzen von Threads, native Tool-Fortsetzung, native Compaction und
app-server-Ausführung. OpenClaw verwaltet weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl,
dynamische OpenClaw-Tools, Genehmigungen, Medienauslieferung und die sichtbare
Transkriptspiegelung.

Die normale Einrichtung verwendet kanonische OpenAI-Modellreferenzen wie `openai/gpt-5.5`.
Konfigurieren Sie keine veralteten Codex-GPT-Referenzen. Legen Sie die OpenAI-Agent-Auth-Reihenfolge
unter `auth.order.openai` ab; ältere veraltete Codex-Auth-Profil-IDs und
veraltete Codex-Auth-Reihenfolgeeinträge sind Legacy-Zustand, der durch
`openclaw doctor --fix` repariert wird.

Wenn keine OpenClaw-Sandbox aktiv ist, startet OpenClaw Codex-app-server-Threads
mit aktiviertem nativen Codex-Code-Modus, während der Nur-Code-Modus standardmäßig deaktiviert bleibt.
So bleiben nativer Codex-Arbeitsbereich und Code-Fähigkeiten verfügbar, während
dynamische OpenClaw-Tools weiter über die app-server-Bridge `item/tool/call` laufen.
Aktives OpenClaw-Sandboxing und eingeschränkte Tool-Richtlinien deaktivieren den nativen Code-Modus
vollständig, sofern Sie sich nicht für den experimentellen Sandbox-exec-server-Pfad entscheiden.

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
- Codex app-server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig
  eine kompatible Codex-app-server-Binärdatei, sodass lokale `codex`-Befehle in `PATH`
  den normalen Harness-Start nicht beeinflussen.
- Codex-Authentifizierung verfügbar über `openclaw models auth login --provider openai`,
  ein app-server-Konto im Codex-Home des Agenten oder ein explizites Codex-API-Schlüssel-
  Auth-Profil.

Informationen zu Auth-Priorität, Umgebungsisolation, benutzerdefinierten app-server-Befehlen, Modell-
Discovery und allen Konfigurationsfeldern finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Schnellstart

Die meisten Benutzer, die Codex in OpenClaw verwenden möchten, benötigen diesen Pfad: Melden Sie sich mit einem
ChatGPT/Codex-Abonnement an, aktivieren Sie das gebündelte `codex`-Plugin und verwenden Sie eine
kanonische `openai/gpt-*`-Modellreferenz.

Melden Sie sich mit Codex OAuth an:

```bash
openclaw models auth login --provider openai
```

Aktivieren Sie das gebündelte `codex`-Plugin und wählen Sie ein OpenAI-Agentenmodell aus:

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

Wenn Ihre Konfiguration `plugins.allow` verwendet, fügen Sie auch dort `codex` hinzu:

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

Starten Sie den Gateway nach Änderungen an der Plugin-Konfiguration neu. Wenn ein bestehender Chat bereits
eine Sitzung hat, verwenden Sie `/new` oder `/reset`, bevor Sie Laufzeitänderungen testen, damit der nächste
Durchlauf den Harness aus der aktuellen Konfiguration auflöst.

## Konfiguration

Die Schnellstartkonfiguration ist die minimal nutzbare Codex-Harness-Konfiguration. Legen Sie Codex-
Harness-Optionen in der OpenClaw-Konfiguration fest und verwenden Sie die CLI nur für Codex-Auth:

| Bedarf                                 | Festlegen                                                                        | Wo                                 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Harness aktivieren                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw-Konfiguration             |
| Eine Plugin-Installation auf der Allowlist behalten | `codex` in `plugins.allow` einschließen                                          | OpenClaw-Konfiguration             |
| OpenAI-Agent-Durchläufe über Codex leiten | `agents.defaults.model` oder `agents.list[].model` als `openai/gpt-*`            | OpenClaw-Agentenkonfiguration      |
| Mit ChatGPT/Codex OAuth anmelden       | `openclaw models auth login --provider openai`                                   | CLI-Auth-Profil                    |
| API-Schlüssel-Backup für Codex-Durchläufe hinzufügen | `openai:*`-API-Schlüsselprofil nach der Abonnement-Auth in `auth.order.openai` auflisten | CLI-Auth-Profil + OpenClaw-Konfiguration |
| Fail-closed, wenn Codex nicht verfügbar ist | Provider- oder Modell-`agentRuntime.id: "codex"`                                 | OpenClaw-Modell-/Provider-Konfiguration |
| Direkten OpenAI-API-Datenverkehr verwenden | Provider- oder Modell-`agentRuntime.id: "openclaw"` mit normaler OpenAI-Auth     | OpenClaw-Modell-/Provider-Konfiguration |
| app-server-Verhalten abstimmen         | `plugins.entries.codex.config.appServer.*`                                       | Codex-Plugin-Konfiguration         |
| Native Codex-Plugin-Apps aktivieren    | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-Plugin-Konfiguration         |
| Codex Computer Use aktivieren          | `plugins.entries.codex.config.computerUse.*`                                     | Codex-Plugin-Konfiguration         |

Verwenden Sie `openai/gpt-*`-Modellreferenzen für OpenAI-Agent-Durchläufe mit Codex-Backend. Bevorzugen Sie
`auth.order.openai` für die Reihenfolge Abonnement zuerst/API-Schlüssel als Backup. Bestehende
veraltete Codex-Auth-Profil-IDs und die veraltete Codex-Auth-Reihenfolge sind nur für doctor vorgesehener
Legacy-Zustand; schreiben Sie keine neuen veralteten Codex-GPT-Referenzen.

Setzen Sie `compaction.model` oder `compaction.provider` nicht für Agenten mit Codex-Backend.
Codex komprimiert über seinen nativen app-server-Thread-Zustand, daher ignoriert OpenClaw
diese lokalen Summarizer-Overrides zur Laufzeit und `openclaw doctor --fix` entfernt
sie, wenn der Agent Codex verwendet.

Lossless bleibt als Kontext-Engine für Assembly, Aufnahme und
Wartung rund um Codex-Durchläufe unterstützt. Konfigurieren Sie es über
`plugins.slots.contextEngine: "lossless-claw"` und
`plugins.entries.lossless-claw.config.summaryModel`, nicht über
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migriert die alte
Form `compaction.provider: "lossless-claw"` in den Lossless-Kontext-Engine-Slot,
wenn Codex die aktive Laufzeit ist, aber natives Codex verwaltet weiterhin die Compaction.

Der native Codex-app-server-Harness unterstützt Kontext-Engines, die
Pre-Prompt-Assembly erfordern. Generische CLI-Backends, einschließlich `codex-cli`, stellen
diese Host-Fähigkeit nicht bereit.

Für Agenten mit Codex-Backend startet `/compact` native Codex-app-server-Compaction auf
dem gebundenen Thread. OpenClaw wartet nicht auf den Abschluss, erzwingt kein OpenClaw-
Timeout, startet den gemeinsamen app-server nicht neu und fällt nicht auf eine Kontext-Engine oder
einen öffentlichen OpenAI-Summarizer zurück. Wenn die native Codex-Thread-Bindung fehlt oder
veraltet ist, schlägt der Befehl fail-closed fehl, damit der Operator die echte Laufzeitgrenze sieht,
statt stillschweigend den Compaction-Backend zu wechseln.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In dieser Form laufen beide Profile für `openai/gpt-*`-Agent-Durchläufe weiterhin über Codex.
Der API-Schlüssel ist nur ein Auth-Fallback, keine Aufforderung, zu OpenClaw oder
einfachen OpenAI Responses zu wechseln.

Der Rest dieser Seite behandelt häufige Varianten, zwischen denen Benutzer wählen müssen:
Bereitstellungsform, Fail-closed-Routing, Guardian-Genehmigungsrichtlinie, native Codex-
Plugins und Computer Use. Vollständige Optionslisten, Standardwerte, Enums, Discovery,
Umgebungsisolation, Timeouts und app-server-Transportfelder finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Codex-Laufzeit verifizieren

Verwenden Sie `/status` in dem Chat, in dem Sie Codex erwarten. Ein OpenAI-Agent-
Durchlauf mit Codex-Backend zeigt:

```text
Runtime: OpenAI Codex
```

Prüfen Sie dann den Codex-app-server-Zustand:

```text
/codex status
/codex models
```

`/codex status` meldet app-server-Konnektivität, Konto, Ratenlimits, MCP-
Server und Skills. `/codex models` listet den Live-Codex-app-server-Katalog für
den Harness und das Konto auf. Wenn `/status` unerwartet ist, siehe
[Fehlerbehebung](#troubleshooting).

## Routing und Modellauswahl

Halten Sie Provider-Referenzen und Laufzeitrichtlinie getrennt:

- Verwenden Sie `openai/gpt-*` für OpenAI-Agent-Durchläufe über Codex.
- Verwenden Sie keine veralteten Codex-GPT-Referenzen in der Konfiguration. Führen Sie `openclaw doctor --fix` aus, um
  veraltete Referenzen und alte Sitzungsrouten-Pins zu reparieren.
- `agentRuntime.id: "codex"` ist für den normalen OpenAI-Automatikmodus optional, aber nützlich,
  wenn eine Bereitstellung fail-closed sein soll, falls Codex nicht verfügbar ist.
- `agentRuntime.id: "openclaw"` wählt für einen Provider oder ein Modell bewusst die eingebettete
  OpenClaw-Laufzeit aus.
- `/codex ...` steuert native Codex-app-server-Unterhaltungen aus dem Chat heraus.
- ACP/acpx ist ein separater externer Harness-Pfad. Verwenden Sie ihn nur, wenn der Benutzer
  ACP/acpx oder einen externen Harness-Adapter anfordert.

Häufiges Befehls-Routing:

| Benutzerabsicht                                      | Verwenden                                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Aktuellen Chat anhängen                              | `/codex bind [--cwd <path>]`                                                                        |
| Einen bestehenden Codex-Thread fortsetzen            | `/codex resume <thread-id>`                                                                         |
| Codex-Threads auflisten oder filtern                 | `/codex threads [filter]`                                                                           |
| Native Codex-Plugins auflisten                       | `/codex plugins list`                                                                               |
| Ein konfiguriertes natives Codex-Plugin aktivieren oder deaktivieren | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                     |
| Eine bestehende Codex-CLI-Sitzung auf einem gekoppelten Knoten anhängen | `/codex sessions --host <node> [filter]`, dann `/codex resume <session-id> --host <node> --bind here` |
| Nur Codex-Feedback senden                            | `/codex diagnostics [note]`                                                                         |
| Eine ACP/acpx-Aufgabe starten                        | ACP/acpx-Sitzungsbefehle, nicht `/codex`                                                            |

| Anwendungsfall                                      | Konfiguration                                                        | Verifizierung                              | Hinweise                                      |
| --------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------- |
| ChatGPT/Codex-Abonnement mit nativer Codex-Runtime  | `openai/gpt-*` plus aktiviertem `codex`-Plugin                       | `/status` zeigt `Runtime: OpenAI Codex`    | Empfohlener Pfad                              |
| Bei Nichtverfügbarkeit von Codex geschlossen fehlschlagen | Provider oder Modell `agentRuntime.id: "codex"`                 | Turn schlägt statt eingebettetem Fallback fehl | Für reine Codex-Deployments verwenden     |
| Direkten OpenAI-API-Schlüssel-Traffic über OpenClaw leiten | Provider oder Modell `agentRuntime.id: "openclaw"` und normale OpenAI-Auth | `/status` zeigt OpenClaw-Runtime       | Nur verwenden, wenn OpenClaw beabsichtigt ist |
| Legacy-Konfiguration                                | Legacy-Codex-GPT-Refs                                                | `openclaw doctor --fix` schreibt sie um    | Neue Konfiguration nicht so schreiben         |
| ACP/acpx-Codex-Adapter                              | ACP `sessions_spawn({ runtime: "acp" })`                             | ACP-Task-/Sitzungsstatus                   | Getrennt vom nativen Codex-Harness            |

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
`codex`-Agent verwendet den Codex-App-Server.

### Fail-Closed-Codex-Deployment

Für OpenAI-Agent-Turns wird `openai/gpt-*` bereits zu Codex aufgelöst, wenn das
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

Wenn Codex erzwungen wird, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann.

## App-Server-Richtlinie

Standardmäßig startet das Plugin die von OpenClaw verwaltete Codex-Binärdatei lokal mit stdio-
Transport. Setzen Sie `appServer.command` nur, wenn Sie bewusst eine
andere ausführbare Datei ausführen möchten. Verwenden Sie WebSocket-Transport nur, wenn bereits
anderswo ein App-Server läuft:

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
Wenn eine OpenClaw-Sandbox für die Sitzung aktiv ist, deaktiviert OpenClaw den nativen
Codex-Code-Modus, Benutzer-MCP-Server und App-gestützte Plugin-Ausführung für diesen
Turn, anstatt sich auf hostseitiges Sandboxing von Codex zu verlassen. Shell-Zugriff wird
über dynamische Tools mit OpenClaw-Sandbox-Unterstützung wie `sandbox_exec` und
`sandbox_process` bereitgestellt, wenn die normalen Exec-/Process-Tools verfügbar sind.

Verwenden Sie den normalisierten OpenClaw-Exec-Modus, wenn Sie native Codex-Auto-Review vor
Sandbox-Escapes oder zusätzlichen Berechtigungen möchten:

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

Für Codex-App-Server-Sitzungen ordnet OpenClaw `tools.exec.mode: "auto"` den von Codex
Guardian geprüften Genehmigungen zu, üblicherweise
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` und
`sandbox: "workspace-write"`, wenn die lokalen Anforderungen diese Werte zulassen.
In `tools.exec.mode: "auto"` bewahrt OpenClaw keine Legacy-unsicheren Codex-
Overrides für `approvalPolicy: "never"` oder `sandbox: "danger-full-access"` auf; verwenden Sie
`tools.exec.mode: "full"` für eine bewusst genehmigungsfreie Codex-Haltung. Die
Legacy-Voreinstellung `plugins.entries.codex.config.appServer.mode: "guardian"` funktioniert weiterhin,
aber `tools.exec.mode: "auto"` ist die normalisierte OpenClaw-Oberfläche.

Den Vergleich auf Modusebene mit Host-Exec-Genehmigungen und ACPX-Berechtigungen finden Sie unter
[Berechtigungsmodi](/de/tools/permission-modes).

Für jedes App-Server-Feld, Auth-Reihenfolge, Umgebungsisolation, Erkennung und
Timeout-Verhalten siehe [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Befehle und Diagnose

Das gebündelte Plugin registriert `/codex` als Slash-Befehl auf jedem Kanal, der
OpenClaw-Textbefehle unterstützt.

Häufige Formen:

- `/codex status` prüft App-Server-Konnektivität, Modelle, Konto, Ratenlimits,
  MCP-Server und Skills.
- `/codex models` listet Live-Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet aktuelle Codex-App-Server-Threads auf.
- `/codex resume <thread-id>` verbindet die aktuelle OpenClaw-Sitzung mit einem
  bestehenden Codex-Thread.
- `/codex compact` fordert den Codex-App-Server auf, den verbundenen Thread zu komprimieren.
- `/codex review` startet die native Codex-Review für den verbundenen Thread.
- `/codex diagnostics [note]` fragt vor dem Senden von Codex-Feedback für den
  verbundenen Thread nach.
- `/codex account` zeigt Konto- und Ratenlimitstatus an.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet Codex-App-Server-Skills auf.

Bei den meisten Supportmeldungen beginnen Sie mit `/diagnostics [note]` in der Unterhaltung,
in der der Fehler aufgetreten ist. Dies erstellt einen Gateway-Diagnosebericht und fragt bei Codex-
Harness-Sitzungen nach Genehmigung, das relevante Codex-Feedback-Bundle zu senden.
Siehe [Diagnoseexport](/de/gateway/diagnostics) für das Datenschutzmodell und das Verhalten in
Gruppenchats.

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie gezielt den Codex-
Feedback-Upload für den aktuell verbundenen Thread ohne das vollständige Gateway-
Diagnose-Bundle möchten.

### Codex-Threads lokal prüfen

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu prüfen, besteht oft darin, den nativen Codex-
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
2. Das bestehende Konto des App-Servers im Codex-Home dieses Agent.
3. Nur bei lokalen stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Auth
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Auth-Profil im Stil eines ChatGPT-Abonnements erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten Codex-Child-Prozess. Dadurch
bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Turns versehentlich über die API abgerechnet werden.
Explizite Codex-API-Schlüssel-Profile und lokaler stdio-Env-Key-Fallback verwenden App-Server-
Login statt geerbter Child-Prozess-Umgebung. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-Env-API-Schlüssel-Fallback; verwenden Sie ein explizites Auth-Profil oder das
eigene Konto des Remote-App-Servers.
Wenn native Codex-Plugins konfiguriert sind, installiert oder aktualisiert OpenClaw diese
Plugins über den verbundenen App-Server, bevor plugin-eigene Apps dem
Codex-Thread zugänglich gemacht werden. `app/list` bleibt die Quelle der Wahrheit für App-IDs,
Zugänglichkeit und Metadaten, aber OpenClaw besitzt die Aktivierungsentscheidung pro Thread:
Wenn die Richtlinie eine gelistete zugängliche App erlaubt, sendet OpenClaw
`thread/start.config.apps[appId].enabled = true`, selbst wenn `app/list` diese App derzeit
als deaktiviert meldet. Dieser Pfad erfindet keine App-Installation für
unbekannte IDs; OpenClaw aktiviert nur Marketplace-Plugins mit `plugin/install`
und aktualisiert anschließend das Inventar.

Wenn ein Abonnementprofil ein Codex-Nutzungslimit erreicht, zeichnet OpenClaw die Rücksetzzeit auf,
wenn Codex eine meldet, und versucht das nächste geordnete Auth-Profil für denselben
Codex-Lauf. Nach Ablauf der Rücksetzzeit wird das Abonnementprofil wieder verfügbar,
ohne das ausgewählte `openai/gpt-*`-Modell oder die Codex-Runtime zu ändern.

Bei lokalen stdio-App-Server-Starts setzt OpenClaw `CODEX_HOME` auf ein agentbezogenes
Verzeichnis, damit Codex-Konfiguration, Auth-/Kontodateien, Plugin-Cache/-Daten und nativer
Thread-Status standardmäßig nicht das persönliche `~/.codex` des Operators lesen oder
beschreiben. OpenClaw bewahrt das normale Prozess-`HOME`; von Codex ausgeführte Subprozesse
können weiterhin Benutzer-Home-Konfiguration und Tokens finden, und Codex kann freigegebene
Einträge unter `$HOME/.agents/skills` und `$HOME/.agents/plugins/marketplace.json` erkennen.

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

`appServer.clearEnv` wirkt sich nur auf den erzeugten Codex-App-Server-Child-Prozess aus.
OpenClaw entfernt `CODEX_HOME` und `HOME` während der lokalen Startnormalisierung aus dieser Liste:
`CODEX_HOME` bleibt agentbezogen, und `HOME` bleibt geerbt, damit
Subprozesse normalen Benutzer-Home-Status verwenden können.

Dynamische Codex-Tools werden standardmäßig mit `searchable` geladen. OpenClaw stellt keine
dynamischen Tools bereit, die native Codex-Arbeitsbereichsoperationen duplizieren: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` und `update_plan`. Die meisten übrigen
OpenClaw-Integrationstools wie Messaging, Medien, Cron, Browser, Knoten,
Gateway und `heartbeat_respond` sind über die Codex-Toolsuche im
Namespace `openclaw` verfügbar, wodurch der anfängliche Modellkontext kleiner bleibt. Websuche
verwendet standardmäßig das gehostete Codex-Tool `web_search`, wenn die Suche aktiviert ist und kein
verwalteter Provider ausgewählt wurde. Native gehostete Suche und das verwaltete
dynamische Tool `web_search` von OpenClaw schließen sich gegenseitig aus, sodass die verwaltete Suche native
Domainbeschränkungen nicht umgehen kann. OpenClaw verwendet das verwaltete Tool, wenn gehostete Suche
nicht verfügbar, ausdrücklich deaktiviert oder durch einen ausgewählten verwalteten Provider ersetzt ist.
OpenClaw hält die eigenständige Codex-Erweiterung `web.run` deaktiviert, weil
Produktionsdatenverkehr des App-Servers ihren benutzerdefinierten Namespace `web` ablehnt.
`tools.web.search.enabled: false` deaktiviert beide Pfade, ebenso wie tool-deaktivierte
reine LLM-Läufe. Codex behandelt `"cached"` als Präferenz und löst es für uneingeschränkte App-Server-Turns
zu externem Live-Zugriff auf. Der automatische verwaltete Fallback schlägt geschlossen fehl, wenn native
`allowedDomains` gesetzt sind, damit die Allowlist nicht umgangen werden kann. Dauerhafte effektive Änderungen
der Suchrichtlinie rotieren den gebundenen Codex-Thread vor dem nächsten Turn. Vorübergehende Einschränkungen
pro Turn verwenden einen temporären eingeschränkten Thread und bewahren die vorhandene Bindung für eine spätere Fortsetzung.
`sessions_yield` und Nur-Nachrichten-Tool-Quellantworten bleiben direkt, weil
dies Turn-Control-Verträge sind. `sessions_spawn` bleibt durchsuchbar, sodass die native
Codex-`spawn_agent` weiterhin die primäre Codex-Subagentenoberfläche bleibt, während explizite
OpenClaw- oder ACP-Delegierung weiterhin über den Namespace für dynamische Tools `openclaw`
verfügbar ist. Heartbeat-Zusammenarbeitsanweisungen weisen Codex an, nach
`heartbeat_respond` zu suchen, bevor ein Heartbeat-Turn beendet wird, wenn das Tool noch nicht
geladen ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu einem benutzerdefinierten Codex-
App-Server herstellen, der zurückgestellte dynamische Tools nicht suchen kann, oder wenn Sie die vollständige
Tool-Nutzlast debuggen.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard       | Bedeutung                                                                                |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Toolkontext aufzunehmen. |
| `codexDynamicToolsExclude` | `[]`           | Zusätzliche Namen dynamischer OpenClaw-Tools, die in Codex-App-Server-Turns ausgelassen werden sollen. |
| `codexPlugins`             | deaktiviert    | Native Codex-Plugin-/App-Unterstützung für migrierte, aus der Quelle installierte kuratierte Plugins. |

Unterstützte `appServer`-Felder:

| Feld                                          | Standardwert                                          | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                                                                                                                                                                                     |
| `command`                                     | verwaltete Codex-Binärdatei                          | Ausführbare Datei für den stdio-Transport. Nicht setzen, um die verwaltete Binärdatei zu verwenden; nur für eine explizite Überschreibung setzen.                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argumente für den stdio-Transport.                                                                                                                                                                                                                                                                                                                                                                   |
| `url`                                         | nicht gesetzt                                         | WebSocket-App-Server-URL.                                                                                                                                                                                                                                                                                                                                                                            |
| `authToken`                                   | nicht gesetzt                                         | Bearer-Token für den WebSocket-Transport. Akzeptiert eine Literalzeichenfolge oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                       |
| `headers`                                     | `{}`                                                  | Zusätzliche WebSocket-Header. Header-Werte akzeptieren Literalzeichenfolgen oder SecretInput-Werte, zum Beispiel `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                   |
| `clearEnv`                                    | `[]`                                                  | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat. OpenClaw behält agentenspezifisches `CODEX_HOME` und geerbtes `HOME` für lokale Starts bei.                                                                                                                                       |
| `codeModeOnly`                                | `false`                                               | Aktiviert Codex' reine Code-Mode-Tool-Oberfläche. Dynamische OpenClaw-Tools bleiben bei Codex registriert, sodass verschachtelte `tools.*`-Aufrufe über die App-Server-Bridge `item/tool/call` zurückkehren.                                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | nicht gesetzt                                         | Remote-Workspace-Root des Codex-App-Servers. Wenn gesetzt, leitet OpenClaw den lokalen Workspace-Root aus dem aufgelösten OpenClaw-Workspace ab, erhält das aktuelle cwd-Suffix unter diesem Remote-Root und sendet nur das endgültige App-Server-cwd an Codex. Wenn das cwd außerhalb des aufgelösten OpenClaw-Workspace-Roots liegt, bricht OpenClaw sicher ab, statt einen Gateway-lokalen Pfad an den Remote-App-Server zu senden. |
| `requestTimeoutMs`                            | `60000`                                               | Timeout für App-Server-Control-Plane-Aufrufe.                                                                                                                                                                                                                                                                                                                                                        |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Ruhefenster, nachdem Codex einen Turn akzeptiert hat oder nach einer Turn-bezogenen App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                                                 |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Completion-Idle- und Fortschrittswächter, der nach einer Tool-Übergabe, dem Abschluss eines nativen Tools, Rohfortschritt des Assistenten nach einem Tool, Abschluss von Roh-Reasoning oder Reasoning-Fortschritt verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder schwere Workloads, bei denen die Synthese nach Tools berechtigterweise länger ruhig bleiben kann als das endgültige Freigabebudget des Assistenten. |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht ausschließen | Preset für YOLO- oder Guardian-geprüfte Ausführung. Lokale stdio-Anforderungen, die `danger-full-access`, `never`-Genehmigung oder den Reviewer `user` auslassen, machen Guardian zum impliziten Standard.                                                                                                                                                                                             |
| `approvalPolicy`                              | `"never"` oder eine zulässige Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die an Thread-Start/Fortsetzung/Turn gesendet wird. Guardian-Standards bevorzugen `"on-request"`, wenn zulässig.                                                                                                                                                                                                                                                 |
| `sandbox`                                     | `"danger-full-access"` oder eine zulässige Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der an Thread-Start/Fortsetzung gesendet wird. Guardian-Standards bevorzugen `"workspace-write"`, wenn zulässig, andernfalls `"read-only"`. Wenn eine OpenClaw-Sandbox aktiv ist, verwenden `danger-full-access`-Turns Codex `workspace-write` mit Netzwerkzugriff, der aus der Egress-Einstellung der OpenClaw-Sandbox abgeleitet wird.                                  |
| `approvalsReviewer`                           | `"user"` oder ein zulässiger Guardian-Reviewer         | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, wenn zulässig, andernfalls `guardian_subagent` oder `user`. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                                                                                                                         |
| `serviceTier`                                 | nicht gesetzt                                         | Optionale Codex-App-Server-Service-Tier. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, `null` löscht die Überschreibung, und das Legacy-`"fast"` wird als `"priority"` akzeptiert.                                                                                                                                                                                |
| `networkProxy`                                | deaktiviert                                           | Aktiviert Codex-Permissions-Profile-Networking für App-Server-Befehle. OpenClaw definiert die ausgewählte `permissions.<profile>.network`-Konfiguration und wählt sie mit `default_permissions` aus, statt `sandbox` zu senden.                                                                                                                                                                    |
| `experimental.sandboxExecServer`              | `false`                                               | Preview-Opt-in, das eine durch die OpenClaw-Sandbox gestützte Codex-Umgebung bei Codex-App-Server 0.132.0 oder neuer registriert, damit native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox laufen kann.                                                                                                                                                                                  |

`appServer.networkProxy` ist explizit, weil es den Codex-Sandbox-Vertrag
ändert. Wenn aktiviert, setzt OpenClaw außerdem `features.network_proxy.enabled` und
`default_permissions` in der Codex-Thread-Konfiguration, damit das generierte Berechtigungsprofil
von Codex verwaltetes Networking starten kann. Standardmäßig erzeugt OpenClaw einen
kollisionsresistenten Profilnamen `openclaw-network-<fingerprint>` aus dem
Profilkörper; verwenden Sie `profileName` nur, wenn ein stabiler lokaler Name erforderlich ist.

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

Wenn die normale App-Server-Laufzeit `danger-full-access` wäre, verwendet das Aktivieren von
`networkProxy` Workspace-artigen Dateisystemzugriff für das generierte
Berechtigungsprofil. Von Codex verwaltete Netzwerkdurchsetzung ist sandboxed Networking,
daher würde ein Full-Access-Profil ausgehenden Traffic nicht schützen.
Domain-Einträge verwenden `allow` oder `deny`; Unix-Socket-Einträge verwenden Codex'
Werte `allow` oder `none`.

OpenClaw-eigene dynamische Tool-Aufrufe sind unabhängig von
`appServer.requestTimeoutMs` begrenzt: Codex-`item/tool/call`-Anfragen verwenden standardmäßig einen 90-sekündigen
OpenClaw-Watchdog. Ein positiver `timeoutMs`-Parameter pro Aufruf verlängert
oder verkürzt dieses spezifische Tool-Budget. Das Tool `image_generate` verwendet
`agents.defaults.imageGenerationModel.timeoutMs`, wenn der Tool-Aufruf kein
eigenes Timeout angibt, andernfalls einen 120-sekündigen Standard für die Bilderzeugung.
Das Media-Understanding-Tool `image` verwendet
`tools.media.image.timeoutSeconds` oder seinen 60-sekündigen Medienstandard. Für das
Bildverständnis gilt dieses Timeout für die Anfrage selbst und wird nicht durch
frühere Vorbereitungsarbeit reduziert. Dynamische Tool-Budgets sind auf
600000 ms begrenzt. Bei einem Timeout bricht OpenClaw das Tool-Signal dort ab,
wo es unterstützt wird, und gibt eine fehlgeschlagene Dynamic-Tool-Antwort an Codex zurück, damit der Turn
fortgesetzt werden kann, anstatt die Sitzung in `processing` zu belassen.
Dieser Watchdog ist das äußere dynamische `item/tool/call`-Budget; provider-spezifische
Request-Timeouts laufen innerhalb dieses Aufrufs und behalten ihre eigene Timeout-Semantik.

Nachdem Codex einen Turn akzeptiert hat und nachdem OpenClaw auf eine turn-bezogene
App-Server-Anfrage geantwortet hat, erwartet das Harness, dass Codex im aktuellen Turn Fortschritt macht und
den nativen Turn schließlich mit `turn/completed` abschließt. Wenn der App-Server für
`appServer.turnCompletionIdleTimeoutMs` still bleibt, unterbricht OpenClaw nach bestem Bemühen
den Codex-Turn, zeichnet ein Diagnose-Timeout auf und gibt die
OpenClaw-Sitzungsspur frei, damit nachfolgende Chat-Nachrichten nicht hinter einem veralteten
nativen Turn in der Warteschlange hängen. Die meisten nicht-terminalen Benachrichtigungen für denselben Turn deaktivieren diesen kurzen
Watchdog, weil Codex nachgewiesen hat, dass der Turn noch aktiv ist. Tool-Übergaben verwenden ein
längeres Idle-Budget nach Tools: nachdem OpenClaw eine `item/tool/call`-
Antwort zurückgegeben hat, nachdem native Tool-Elemente wie `commandExecution` abgeschlossen sind, nach rohen
`custom_tool_call_output`-Abschlüssen sowie nach rohem Assistant-Fortschritt nach Tools,
rohen Reasoning-Abschlüssen oder Reasoning-Fortschritt. Der Schutz verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn konfiguriert, und
fällt andernfalls auf fünf Minuten zurück. Dasselbe Budget nach Tools verlängert auch den
Fortschritts-Watchdog für das stille Synthesefenster, bevor Codex das nächste
aktuelle Turn-Ereignis ausgibt. Globale App-Server-Benachrichtigungen, etwa Rate-Limit-Updates,
setzen den Turn-Idle-Fortschritt nicht zurück. Reasoning-Abschlüsse, Commentary-
`agentMessage`-Abschlüsse und roher Reasoning- oder Assistant-Fortschritt vor Tools können
von einer automatischen finalen Antwort gefolgt werden, daher verwenden sie den Reply-Schutz nach Fortschritt,
anstatt die Sitzungsspur sofort freizugeben. Nur
finale/nicht-Commentary abgeschlossene `agentMessage`-Elemente und rohe
Assistant-Abschlüsse vor Tools aktivieren die Assistant-Output-Freigabe: Wenn Codex danach ohne
`turn/completed` still bleibt, unterbricht OpenClaw nach bestem Bemühen den nativen Turn und
gibt die Sitzungsspur frei. Replay-sichere stdio-App-Server-Fehler, einschließlich
Turn-Completion-Idle-Timeouts ohne Assistant-, Tool-, Active-Item- oder
Side-Effect-Nachweis, werden einmal in einem frischen App-Server-Versuch wiederholt. Unsichere
Timeouts mustern den festhängenden App-Server-Client trotzdem aus und geben die OpenClaw-
Sitzungsspur frei. Sie löschen außerdem die veraltete native Thread-Bindung, anstatt
automatisch wiederholt zu werden. Completion-Watch-Timeouts zeigen Codex-spezifischen Timeout-
Text an: Replay-sichere Fälle sagen, dass die Antwort unvollständig sein kann, während unsichere Fälle
den Benutzer auffordern, den aktuellen Zustand vor einem erneuten Versuch zu prüfen. Öffentliche Timeout-Diagnosen
enthalten strukturelle Felder wie die letzte App-Server-Benachrichtigungsmethode,
ID/Typ/Rolle des rohen Assistant-Response-Elements, aktive Request-/Item-Zähler und den aktivierten
Watch-Zustand. Wenn die letzte Benachrichtigung ein rohes Assistant-Response-Element ist, enthalten sie
außerdem eine begrenzte Vorschau des Assistant-Texts. Sie enthalten keine rohen Prompt- oder
Tool-Inhalte.

Umgebungs-Overrides bleiben für lokale Tests verfügbar:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` umgeht das verwaltete Binary, wenn
`appServer.command` nicht gesetzt ist.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen
`plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration wird
für wiederholbare Deployments bevorzugt, weil sie das Plugin-Verhalten in derselben
geprüften Datei wie die restliche Einrichtung des Codex-Harness hält.

## Native Codex-Plugins

Native Codex-Plugin-Unterstützung verwendet die eigenen App- und Plugin-
Fähigkeiten des Codex-App-Servers im selben Codex-Thread wie der OpenClaw-Harness-Turn. OpenClaw
übersetzt Codex-Plugins nicht in synthetische `codex_plugin_*`-dynamische OpenClaw-
Tools.

`codexPlugins` betrifft nur Sitzungen, die das native Codex-Harness auswählen. Es
hat keine Wirkung auf integrierte Harness-Läufe, normale OpenAI-Provider-Läufe, ACP-Konversations-
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
herstellt oder eine veraltete Codex-Thread-Bindung ersetzt. Sie wird nicht bei jedem Turn neu berechnet.
Nach einer Änderung von `codexPlugins` verwenden Sie `/new`, `/reset` oder starten Sie den Gateway neu, damit
künftige Codex-Harness-Sitzungen mit dem aktualisierten App-Set starten.

Für Migrationsberechtigung, App-Inventar, Richtlinie für destruktive Aktionen,
Elicitations und native Plugin-Diagnosen siehe
[Native Codex-Plugins](/de/plugins/codex-native-plugins).

Der OpenAI-seitige App- und Plugin-Zugriff wird durch das angemeldete Codex-Konto
und, bei Business- und Enterprise/Edu-Workspaces, durch Workspace-App-Kontrollen gesteuert. Siehe
[Codex mit Ihrem ChatGPT-Plan verwenden](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
für OpenAIs Überblick zu Konto- und Workspace-Kontrollen.

## Computer Use

Computer Use wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex Computer Use](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw vendort die Desktop-Control-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, prüft, dass der
`computer-use`-MCP-Server verfügbar ist, und lässt Codex dann die nativen MCP-
Tool-Aufrufe während Turns im Codex-Modus übernehmen.

## Runtime-Grenzen

Das Codex-Harness ändert nur den Low-Level-Embedded-Agent-Executor.

- Dynamische OpenClaw-Tools werden unterstützt. Codex fordert OpenClaw auf, diese
  Tools auszuführen, daher bleibt OpenClaw im Ausführungspfad.
- Codex-native Shell-, Patch-, MCP- und native App-Tools gehören Codex.
  OpenClaw kann ausgewählte native Ereignisse über das unterstützte
  Relay beobachten oder blockieren, schreibt native Tool-Argumente aber nicht um.
- Codex besitzt native Compaction. OpenClaw hält eine Transcript-Spiegelung für Kanal-
  Verlauf, Suche, `/new`, `/reset` und künftiges Umschalten von Modell oder Harness vor, ersetzt
  Codex-Compaction jedoch nicht durch einen OpenClaw- oder Context-Engine-
  Summarizer.
- Mediengenerierung, Medienverständnis, TTS, Freigaben und Messaging-Tool-
  Ausgabe laufen weiterhin über die passenden OpenClaw-Provider-/Modell-Einstellungen.
- `tool_result_persist` gilt für OpenClaw-eigene Transcript-Tool-Ergebnisse, nicht für
  Codex-native Tool-Ergebnisdatensätze.

Für Hook-Ebenen, unterstützte V1-Surfaces, native Berechtigungsverarbeitung, Queue-
Steuerung, Mechanik des Codex-Feedback-Uploads und Compaction-Details siehe
[Codex-Harness-Runtime](/de/plugins/codex-harness-runtime).

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist für
neue Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Modell, aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet das integrierte Harness statt Codex:** Stellen Sie sicher, dass die Modellreferenz
`openai/gpt-*` beim offiziellen OpenAI-Provider ist und dass das Codex-Plugin
installiert und aktiviert ist. Wenn Sie beim Testen strikten Nachweis benötigen, setzen Sie Provider oder
Modell `agentRuntime.id: "codex"`. Eine erzwungene Codex-Runtime schlägt fehl, statt
auf OpenClaw zurückzufallen.

**OpenAI-Codex-Runtime fällt auf den API-Key-Pfad zurück:** Erfassen Sie einen redigierten
Gateway-Auszug, der Modell, Runtime, ausgewählten Provider und Fehler zeigt.
Bitten Sie betroffene Mitarbeitende, diesen schreibgeschützten Befehl auf ihrem OpenClaw-Host auszuführen:

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

**Konfiguration mit veralteten Codex-Modellreferenzen bleibt bestehen:** Führen Sie `openclaw doctor --fix` aus.
Doctor schreibt veraltete Modellreferenzen in `openai/*` um, entfernt veraltete Sitzungs- und
Whole-Agent-Runtime-Pins und behält bestehende Auth-Profile-Overrides bei.

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

**Native Shell- oder Patch-Tools werden mit `Native hook relay unavailable` blockiert:**
Der Codex-Thread versucht noch, eine native Hook-Relay-ID zu verwenden, die OpenClaw nicht
mehr registriert hat. Dies ist ein natives Codex-Hook-Transportproblem, kein ACP-
Backend-, Provider-, GitHub- oder Shell-Command-Fehler. Starten Sie eine frische Sitzung im
betroffenen Chat mit `/new` oder `/reset` und versuchen Sie danach einen harmlosen Befehl erneut. Wenn das
einmal funktioniert, aber der nächste native Tool-Aufruf wieder fehlschlägt, behandeln Sie `/new` nur als temporären
Workaround: Kopieren Sie den Prompt in eine frische Sitzung, nachdem Sie den Codex-
App-Server oder OpenClaw Gateway neu gestartet haben, damit alte Threads verworfen und native Hook-
Registrierungen neu erstellt werden.

**Ein Nicht-Codex-Modell verwendet das integrierte Harness:** Das ist erwartet, sofern
Provider- oder Modell-Runtime-Richtlinien es nicht zu einem anderen Harness weiterleiten. Einfache Nicht-OpenAI-
Provider-Referenzen bleiben im Modus `auto` auf ihrem normalen Provider-Pfad.

**Computer Use ist installiert, aber Tools werden nicht ausgeführt:** Prüfen Sie
`/codex computer-use status` in einer neuen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie die oben beschriebene Wiederherstellung des Native-Hook-Relays. Siehe
[Codex Computer Use](/de/plugins/codex-computer-use#troubleshooting).

## Verwandt

- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex Computer Use](/de/plugins/codex-computer-use)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [OpenAI-Codex-Hilfe](https://help.openai.com/en/collections/14937394-codex)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Plugin-Hooks](/de/plugins/hooks)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Status](/de/cli/status)
- [Tests](/de/help/testing-live#live-codex-app-server-harness-smoke)
