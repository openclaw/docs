---
read_when:
    - Sie möchten den mitgelieferten Codex-App-Server-Harness verwenden
    - Sie benötigen Konfigurationsbeispiele für den Codex-Harness
    - Sie möchten, dass Nur-Codex-Bereitstellungen fehlschlagen, anstatt auf OpenClaw zurückzufallen
summary: OpenClaw-Turns eingebetteter Agents über das gebündelte Codex-App-Server-Harness ausführen
title: Codex-Testumgebung
x-i18n:
    generated_at: "2026-06-30T13:56:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das gebündelte `codex`-Plugin ermöglicht OpenClaw, eingebettete OpenAI-Agent-Durchläufe
über den Codex-App-Server statt über den integrierten OpenClaw-Harness auszuführen.

Verwenden Sie den Codex-Harness, wenn Codex die Low-Level-Agent-Sitzung besitzen soll:
native Thread-Wiederaufnahme, native Tool-Fortsetzung, native Compaction und
App-Server-Ausführung. OpenClaw besitzt weiterhin Chat-Kanäle, Sitzungsdateien, Modellauswahl,
dynamische OpenClaw-Tools, Genehmigungen, Medienzustellung und die sichtbare
Transkriptspiegelung.

Die normale Einrichtung verwendet kanonische OpenAI-Modellreferenzen wie `openai/gpt-5.5`.
Konfigurieren Sie keine alten Codex-GPT-Referenzen. Legen Sie die OpenAI-Agent-Auth-Reihenfolge
unter `auth.order.openai` ab; ältere alte Codex-Auth-Profil-IDs und
alte Codex-Auth-Reihenfolgeeinträge sind Legacy-Zustand, der durch
`openclaw doctor --fix` repariert wird.

Wenn keine OpenClaw-Sandbox aktiv ist, startet OpenClaw Codex-App-Server-Threads
mit aktiviertem nativen Codex-Code-Modus, während code-mode-only standardmäßig ausgeschaltet bleibt.
Dadurch bleiben nativer Codex-Workspace und Code-Fähigkeiten verfügbar, während
dynamische OpenClaw-Tools weiterhin über die App-Server-Bridge `item/tool/call` laufen.
Aktives OpenClaw-Sandboxing und eingeschränkte Tool-Richtlinien deaktivieren den nativen Code-Modus
vollständig, sofern Sie sich nicht für den experimentellen Sandbox-exec-server-Pfad entscheiden.

Diese Codex-native Funktion ist getrennt von
[OpenClaw-Code-Modus](/de/reference/code-mode), einer optionalen QuickJS-WASI-
Runtime für generische OpenClaw-Durchläufe mit einer anderen `exec`-Eingabeform.

Für die breitere Aufteilung von Modell/Provider/Runtime beginnen Sie mit
[Agent-Runtimes](/de/concepts/agent-runtimes). Die Kurzfassung lautet:
`openai/gpt-5.5` ist die Modellreferenz, `codex` ist die Runtime, und Telegram,
Discord, Slack oder ein anderer Kanal bleibt die Kommunikationsoberfläche.

## Anforderungen

- OpenClaw mit verfügbarem gebündeltem `codex`-Plugin.
- Wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie `codex` auf.
- Codex-App-Server `0.125.0` oder neuer. Das gebündelte Plugin verwaltet standardmäßig
  eine kompatible Codex-App-Server-Binärdatei, sodass lokale `codex`-Befehle in `PATH`
  den normalen Harness-Start nicht beeinflussen.
- Codex-Auth verfügbar über `openclaw models auth login --provider openai`,
  ein App-Server-Konto im Codex-Home des Agenten oder ein explizites Codex-API-Schlüssel-
  Auth-Profil.

Für Auth-Priorität, Umgebungsisolation, benutzerdefinierte App-Server-Befehle, Modell-
Discovery und alle Konfigurationsfelder siehe
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Schnellstart

Die meisten Benutzer, die Codex in OpenClaw möchten, wollen diesen Pfad: Melden Sie sich mit einem
ChatGPT/Codex-Abonnement an, aktivieren Sie das gebündelte `codex`-Plugin und verwenden Sie eine
kanonische Modellreferenz `openai/gpt-*`.

Mit Codex-OAuth anmelden:

```bash
openclaw models auth login --provider openai
```

Das gebündelte `codex`-Plugin aktivieren und ein OpenAI-Agent-Modell auswählen:

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

Starten Sie den Gateway nach einer Änderung der Plugin-Konfiguration neu. Wenn ein vorhandener Chat
bereits eine Sitzung hat, verwenden Sie `/new` oder `/reset`, bevor Sie Runtime-Änderungen testen,
damit der nächste Durchlauf den Harness aus der aktuellen Konfiguration auflöst.

## Konfiguration

Die Schnellstart-Konfiguration ist die minimal funktionsfähige Codex-Harness-Konfiguration. Legen Sie Codex-
Harness-Optionen in der OpenClaw-Konfiguration fest und verwenden Sie die CLI nur für Codex-Auth:

| Bedarf                                 | Festlegen                                                                        | Wo                                 |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Den Harness aktivieren                 | `plugins.entries.codex.enabled: true`                                            | OpenClaw-Konfiguration             |
| Eine allowlistete Plugin-Installation behalten | `codex` in `plugins.allow` aufnehmen                                             | OpenClaw-Konfiguration             |
| OpenAI-Agent-Durchläufe über Codex routen | `agents.defaults.model` oder `agents.list[].model` als `openai/gpt-*`             | OpenClaw-Agent-Konfiguration       |
| Mit ChatGPT/Codex-OAuth anmelden       | `openclaw models auth login --provider openai`                                   | CLI-Auth-Profil                    |
| API-Schlüssel-Backup für Codex-Durchläufe hinzufügen | `openai:*`-API-Schlüssel-Profil nach Abonnement-Auth in `auth.order.openai` gelistet | CLI-Auth-Profil + OpenClaw-Konfiguration |
| Geschlossen fehlschlagen, wenn Codex nicht verfügbar ist | Provider- oder Modell-`agentRuntime.id: "codex"`                                  | OpenClaw-Modell/Provider-Konfiguration |
| Direkten OpenAI-API-Verkehr verwenden  | Provider- oder Modell-`agentRuntime.id: "openclaw"` mit normaler OpenAI-Auth      | OpenClaw-Modell/Provider-Konfiguration |
| App-Server-Verhalten abstimmen         | `plugins.entries.codex.config.appServer.*`                                       | Codex-Plugin-Konfiguration         |
| Native Codex-Plugin-Apps aktivieren    | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex-Plugin-Konfiguration         |
| Codex Computer Use aktivieren          | `plugins.entries.codex.config.computerUse.*`                                     | Codex-Plugin-Konfiguration         |

Verwenden Sie Modellreferenzen `openai/gpt-*` für Codex-gestützte OpenAI-Agent-Durchläufe. Bevorzugen Sie
`auth.order.openai` für die Reihenfolge Abonnement zuerst/API-Schlüssel als Backup. Vorhandene
alte Codex-Auth-Profil-IDs und alte Codex-Auth-Reihenfolge sind doctor-only-
Legacy-Zustand; schreiben Sie keine neuen alten Codex-GPT-Referenzen.

Setzen Sie `compaction.model` oder `compaction.provider` nicht bei Codex-gestützten Agenten.
Codex komprimiert über seinen nativen App-Server-Thread-Zustand, daher ignoriert OpenClaw
diese lokalen Summarizer-Overrides zur Laufzeit, und `openclaw doctor --fix` entfernt
sie, wenn der Agent Codex verwendet.

Lossless bleibt als Kontext-Engine für Assembly, Ingestion und
Wartung rund um Codex-Durchläufe unterstützt. Konfigurieren Sie es über
`plugins.slots.contextEngine: "lossless-claw"` und
`plugins.entries.lossless-claw.config.summaryModel`, nicht über
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migriert die alte
Form `compaction.provider: "lossless-claw"` in den Lossless-Kontext-Engine-Slot,
wenn Codex die aktive Runtime ist, aber natives Codex besitzt weiterhin Compaction.

Der native Codex-App-Server-Harness unterstützt Kontext-Engines, die
Pre-Prompt-Assembly erfordern. Generische CLI-Backends, einschließlich `codex-cli`, stellen
diese Host-Fähigkeit nicht bereit.

Für Codex-gestützte Agenten startet `/compact` native Codex-App-Server-Compaction auf
dem gebundenen Thread. OpenClaw wartet nicht auf den Abschluss, erzwingt kein OpenClaw-
Timeout, startet den gemeinsamen App-Server nicht neu und fällt nicht auf eine Kontext-Engine oder
einen öffentlichen OpenAI-Summarizer zurück. Wenn die native Codex-Thread-Bindung fehlt oder
veraltet ist, schlägt der Befehl geschlossen fehl, damit der Operator die echte Runtime-Grenze sieht,
statt Compaction-Backends stillschweigend zu wechseln.

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
Deployment-Form, Fail-closed-Routing, Guardian-Genehmigungsrichtlinie, native Codex-
Plugins und Computer Use. Vollständige Optionslisten, Standardwerte, Enums, Discovery,
Umgebungsisolation, Timeouts und App-Server-Transportfelder finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Codex-Runtime verifizieren

Verwenden Sie `/status` in dem Chat, in dem Sie Codex erwarten. Ein Codex-gestützter OpenAI-Agent-
Durchlauf zeigt:

```text
Runtime: OpenAI Codex
```

Prüfen Sie dann den Codex-App-Server-Zustand:

```text
/codex status
/codex models
```

`/codex status` meldet App-Server-Konnektivität, Konto, Ratenlimits, MCP-
Server und Skills. `/codex models` listet den Live-Codex-App-Server-Katalog für
den Harness und das Konto auf. Wenn `/status` überraschend ist, siehe
[Fehlerbehebung](#troubleshooting).

## Routing und Modellauswahl

Halten Sie Provider-Referenzen und Runtime-Richtlinie getrennt:

- Verwenden Sie `openai/gpt-*` für OpenAI-Agent-Durchläufe über Codex.
- Verwenden Sie keine alten Codex-GPT-Referenzen in der Konfiguration. Führen Sie `openclaw doctor --fix` aus, um
  alte Referenzen und veraltete Sitzungs-Routen-Pins zu reparieren.
- `agentRuntime.id: "codex"` ist für den normalen OpenAI-Automodus optional, aber nützlich,
  wenn ein Deployment geschlossen fehlschlagen soll, falls Codex nicht verfügbar ist.
- `agentRuntime.id: "openclaw"` optiert einen Provider oder ein Modell in die eingebettete OpenClaw-
  Runtime, wenn dies beabsichtigt ist.
- `/codex ...` steuert native Codex-App-Server-Konversationen aus dem Chat.
- ACP/acpx ist ein separater externer Harness-Pfad. Verwenden Sie ihn nur, wenn der Benutzer
  ACP/acpx oder einen externen Harness-Adapter anfordert.

Häufiges Befehlsrouting:

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
| ChatGPT/Codex-Abonnement mit nativer Codex-Laufzeit | `openai/gpt-*` plus aktiviertes `codex`-Plugin                        | `/status` zeigt `Runtime: OpenAI Codex` | Empfohlener Pfad                      |
| Geschlossen fehlschlagen, wenn Codex nicht verfügbar ist | Provider oder Modell `agentRuntime.id: "codex"`                       | Turn schlägt statt eingebettetem Fallback fehl | Für reine Codex-Deployments verwenden |
| Direkten OpenAI-API-Key-Traffic durch OpenClaw leiten | Provider oder Modell `agentRuntime.id: "openclaw"` und normale OpenAI-Authentifizierung | `/status` zeigt die OpenClaw-Laufzeit | Nur verwenden, wenn OpenClaw beabsichtigt ist |
| Legacy-Konfiguration                                | alte Codex-GPT-Refs                                                   | `openclaw doctor --fix` schreibt sie um | Neue Konfiguration nicht so schreiben |
| ACP/acpx-Codex-Adapter                              | ACP `sessions_spawn({ runtime: "acp" })`                              | ACP-Task-/Sitzungsstatus               | Getrennt vom nativen Codex-Harness    |

`agents.defaults.imageModel` folgt derselben Präfix-Aufteilung. Verwenden Sie `openai/gpt-*`
für die normale OpenAI-Route und `codex/gpt-*` nur, wenn Bildverständnis
über einen begrenzten Codex-App-Server-Turn laufen soll. Verwenden Sie keine
alten Codex-GPT-Refs; doctor schreibt dieses Legacy-Präfix in `openai/gpt-*` um.

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

Wenn Codex erzwungen wird, schlägt OpenClaw früh fehl, wenn das Codex-Plugin deaktiviert ist, der
App-Server zu alt ist oder der App-Server nicht starten kann.

## App-Server-Richtlinie

Standardmäßig startet das Plugin OpenClaws verwaltetes Codex-Binary lokal mit stdio-
Transport. Legen Sie `appServer.command` nur fest, wenn Sie bewusst eine
andere ausführbare Datei ausführen möchten. Verwenden Sie WebSocket-Transport nur, wenn ein App-Server bereits
an anderer Stelle läuft:

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
Turn den nativen Codex-Code-Modus, Benutzer-MCP-Server und App-gestützte Plugin-Ausführung,
statt sich auf hostseitiges Sandboxing von Codex zu verlassen. Shell-Zugriff wird
über dynamische, von der OpenClaw-Sandbox gestützte Tools wie `sandbox_exec` und
`sandbox_process` bereitgestellt, wenn die normalen exec-/process-Tools verfügbar sind.

Verwenden Sie den normalisierten OpenClaw-exec-Modus, wenn Sie native Codex-Auto-Reviews vor
Sandbox-Ausstiegen oder zusätzlichen Berechtigungen wünschen:

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
In `tools.exec.mode: "auto"` bewahrt OpenClaw keine alten unsicheren Codex-
Überschreibungen für `approvalPolicy: "never"` oder `sandbox: "danger-full-access"` auf; verwenden Sie
`tools.exec.mode: "full"` für eine bewusst genehmigungsfreie Codex-Haltung. Die
alte Voreinstellung `plugins.entries.codex.config.appServer.mode: "guardian"` funktioniert weiterhin,
aber `tools.exec.mode: "auto"` ist die normalisierte OpenClaw-Oberfläche.

Den Vergleich auf Modusebene mit Host-exec-Genehmigungen und ACPX-Berechtigungen finden Sie unter
[Berechtigungsmodi](/de/tools/permission-modes).

Alle App-Server-Felder, Authentifizierungsreihenfolge, Umgebungsisolation, Erkennung und
Timeout-Verhalten finden Sie in der [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Befehle und Diagnosen

Das gebündelte Plugin registriert `/codex` als Slash-Befehl in jedem Kanal, der
OpenClaw-Textbefehle unterstützt.

Native Ausführung und Steuerung erfordern einen Owner oder einen `operator.admin`-Gateway-
Client. Dazu gehören das Binden oder Fortsetzen von Threads, das Senden oder Stoppen von Turns,
das Ändern von Modell, Schnellmodus oder Berechtigungsstatus, das Kompaktieren oder Reviewen sowie
das Lösen einer Bindung. Andere autorisierte Absender behalten Nur-Lese-Befehle für Status, Hilfe,
Konto, Modell, Thread, MCP-Server, Skill und Bindungsinspektion.

Häufige Formen:

- `/codex status` prüft App-Server-Konnektivität, Modelle, Konto, Ratenlimits,
  MCP-Server und Skills.
- `/codex models` listet Live-Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet die letzten Codex-App-Server-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen
  bestehenden Codex-Thread an.
- `/codex compact` fordert den Codex-App-Server auf, den angehängten Thread zu kompaktieren.
- `/codex review` startet die native Codex-Review für den angehängten Thread.
- `/codex diagnostics [note]` fragt nach, bevor Codex-Feedback für den
  angehängten Thread gesendet wird.
- `/codex account` zeigt Konto- und Ratenlimitstatus.
- `/codex mcp` listet den MCP-Serverstatus des Codex-App-Servers auf.
- `/codex skills` listet die Skills des Codex-App-Servers auf.

Für die meisten Support-Berichte beginnen Sie mit `/diagnostics [note]` in der Unterhaltung,
in der der Fehler aufgetreten ist. Dies erstellt einen Gateway-Diagnosebericht und fragt bei Codex-
Harness-Sitzungen nach Genehmigung, das relevante Codex-Feedback-Bundle zu senden.
Das Datenschutzmodell und Verhalten in Gruppenchats finden Sie unter
[Diagnoseexport](/de/gateway/diagnostics).

Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie speziell den Codex-
Feedback-Upload für den aktuell angehängten Thread ohne das vollständige Gateway-
Diagnose-Bundle wünschen.

### Codex-Threads lokal inspizieren

Der schnellste Weg, einen fehlerhaften Codex-Lauf zu untersuchen, ist häufig, den nativen Codex-
Thread direkt zu öffnen:

```bash
codex resume <thread-id>
```

Rufen Sie die Thread-ID aus der abgeschlossenen `/diagnostics`-Antwort, `/codex binding` oder
`/codex threads [filter]` ab.

Upload-Mechanik und Diagnosegrenzen auf Laufzeitebene finden Sie unter
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime#codex-feedback-upload).

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Geordnete OpenAI-Authentifizierungsprofile für den Agent, vorzugsweise unter
   `auth.order.openai`. Führen Sie `openclaw doctor --fix` aus, um ältere
   Legacy-Codex-Authentifizierungsprofil-IDs und alte Codex-Authentifizierungsreihenfolgen zu migrieren.
2. Das bestehende Konto des App-Servers im Codex-Home dieses Agents.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im ChatGPT-Abonnementstil erkennt, entfernt es
`CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten Codex-Kindprozess. Dadurch
bleiben API-Keys auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Turns versehentlich über die API abgerechnet werden.
Explizite Codex-API-Key-Profile und der lokale stdio-env-key-Fallback verwenden App-Server-
Login statt geerbter Kindprozess-Umgebung. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-env-API-Key-Fallback; verwenden Sie ein explizites Authentifizierungsprofil oder das
eigene Konto des entfernten App-Servers.
Wenn native Codex-Plugins konfiguriert sind, installiert oder aktualisiert OpenClaw diese
Plugins über den verbundenen App-Server, bevor Plugin-eigene Apps dem
Codex-Thread bereitgestellt werden. `app/list` bleibt die maßgebliche Quelle für App-IDs,
Zugänglichkeit und Metadaten, aber OpenClaw besitzt die Aktivierungsentscheidung pro Thread:
Wenn die Richtlinie eine aufgelistete zugängliche App zulässt, sendet OpenClaw
`thread/start.config.apps[appId].enabled = true`, selbst wenn `app/list` diese App derzeit
als deaktiviert meldet. Dieser Pfad erfindet keine App-Installation für
unbekannte IDs; OpenClaw aktiviert nur Marketplace-Plugins mit `plugin/install`
und aktualisiert dann das Inventar.

Wenn ein Abonnementprofil ein Codex-Nutzungslimit erreicht, zeichnet OpenClaw die Zurücksetzungszeit auf,
wenn Codex eine meldet, und versucht das nächste geordnete Authentifizierungsprofil für denselben
Codex-Lauf. Wenn die Zurücksetzungszeit verstrichen ist, wird das Abonnementprofil wieder nutzbar,
ohne das ausgewählte `openai/gpt-*`-Modell oder die Codex-Laufzeit zu ändern.

Für lokale stdio-App-Server-Starts setzt OpenClaw `CODEX_HOME` auf ein agentbezogenes
Verzeichnis, damit Codex-Konfiguration, Authentifizierungs-/Kontodateien, Plugin-Cache/-Daten und nativer
Thread-Status standardmäßig nicht das persönliche `~/.codex` des Operators lesen oder schreiben.
OpenClaw behält das normale Prozess-`HOME` bei; von Codex ausgeführte Unterprozesse
können weiterhin Benutzer-Home-Konfiguration und Tokens finden, und Codex kann gemeinsame
`$HOME/.agents/skills`- und `$HOME/.agents/plugins/marketplace.json`-Einträge entdecken.

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

`appServer.clearEnv` betrifft nur den erzeugten Codex-App-Server-Kindprozess.
OpenClaw entfernt `CODEX_HOME` und `HOME` während der lokalen Startnormalisierung
aus dieser Liste: `CODEX_HOME` bleibt agentbezogen, und `HOME` bleibt geerbt, damit
Unterprozesse den normalen Benutzer-Home-Status verwenden können.

Codex-Dynamic-Tools verwenden standardmäßig `searchable`-Laden. OpenClaw stellt keine
Dynamic-Tools bereit, die native Codex-Arbeitsbereichsoperationen duplizieren: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` und `update_plan`. Die meisten verbleibenden
OpenClaw-Integrationstools wie Messaging, Medien, Cron, Browser, Nodes,
Gateway und `heartbeat_respond` sind über die Codex-Toolsuche im
Namespace `openclaw` verfügbar, wodurch der anfängliche Modellkontext kleiner bleibt. Websuche
verwendet standardmäßig das gehostete Codex-Tool `web_search`, wenn Suche aktiviert ist und kein
verwalteter Provider ausgewählt wurde. Native gehostete Suche und OpenClaws verwaltetes
Dynamic-Tool `web_search` schließen sich gegenseitig aus, damit die verwaltete Suche
native Domain-Beschränkungen nicht umgehen kann. OpenClaw verwendet das verwaltete Tool, wenn gehostete Suche
nicht verfügbar, ausdrücklich deaktiviert oder durch einen ausgewählten verwalteten Provider ersetzt ist.
OpenClaw lässt Codexs eigenständige Erweiterung `web.run` deaktiviert, weil
Produktionsdatenverkehr des App-Servers den benutzerdefinierten Namespace `web` ablehnt.
`tools.web.search.enabled: false` deaktiviert beide Pfade, ebenso tool-deaktivierte
LLM-only-Läufe. Codex behandelt `"cached"` als Präferenz und löst sie für uneingeschränkte
App-Server-Turns in Live-Zugriff auf externe Ressourcen auf. Automatischer verwalteter Fallback
schlägt geschlossen fehl, wenn native `allowedDomains` gesetzt sind, sodass die Allowlist nicht
umgangen werden kann. Persistente effektive Änderungen der Suchrichtlinie rotieren den gebundenen Codex-
Thread vor dem nächsten Turn. Vorübergehende Einschränkungen pro Turn verwenden einen temporären
eingeschränkten Thread und bewahren die bestehende Bindung für eine spätere Wiederaufnahme.
`sessions_yield` und reine Message-Tool-Quellantworten bleiben direkt, weil
dies Turn-Control-Verträge sind. `sessions_spawn` bleibt durchsuchbar, sodass Codexs
natives `spawn_agent` die primäre Codex-Subagent-Oberfläche bleibt, während explizite
OpenClaw- oder ACP-Delegation weiterhin über den Namespace für OpenClaw-Dynamic-Tools
verfügbar ist. Heartbeat-Kollaborationsanweisungen weisen Codex an, vor dem Beenden
eines Heartbeat-Turns nach `heartbeat_respond` zu suchen, wenn das Tool noch nicht
geladen ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu einem benutzerdefinierten Codex-
App-Server herstellen, der zurückgestellte Dynamic-Tools nicht durchsuchen kann, oder wenn Sie die vollständige
Tool-Nutzlast debuggen.

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standard       | Bedeutung                                                                                |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Verwenden Sie `"direct"`, um OpenClaw-Dynamic-Tools direkt in den anfänglichen Codex-Toolkontext zu legen. |
| `codexDynamicToolsExclude` | `[]`           | Zusätzliche Namen von OpenClaw-Dynamic-Tools, die aus Codex-App-Server-Turns ausgelassen werden sollen. |
| `codexPlugins`             | deaktiviert    | Native Codex-Plugin-/App-Unterstützung für migrierte, aus Quellen installierte kuratierte Plugins. |

Unterstützte `appServer`-Felder:

| Feld                                          | Standardwert                                           | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                                                                                                                                                                                |
| `command`                                     | verwaltete Codex-Binärdatei                            | Ausführbare Datei für den stdio-Transport. Nicht setzen, um die verwaltete Binärdatei zu verwenden; nur für eine explizite Überschreibung setzen.                                                                                                                                                                                                                                               |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumente für den stdio-Transport.                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | nicht gesetzt                                          | WebSocket-App-Server-URL.                                                                                                                                                                                                                                                                                                                                                                       |
| `authToken`                                   | nicht gesetzt                                          | Bearer-Token für den WebSocket-Transport. Akzeptiert eine Literalzeichenfolge oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                 |
| `headers`                                     | `{}`                                                   | Zusätzliche WebSocket-Header. Header-Werte akzeptieren Literalzeichenfolgen oder SecretInput-Werte, zum Beispiel `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung erstellt hat. OpenClaw behält agentenspezifisches `CODEX_HOME` und geerbtes `HOME` für lokale Starts bei.                                                                                                                                    |
| `codeModeOnly`                                | `false`                                                | Aktiviert die reine Code-Modus-Tool-Oberfläche von Codex. Dynamische OpenClaw-Tools bleiben bei Codex registriert, sodass verschachtelte `tools.*`-Aufrufe über die App-Server-Bridge `item/tool/call` zurückgegeben werden.                                                                                                                                                                     |
| `remoteWorkspaceRoot`                         | nicht gesetzt                                          | Remote-Arbeitsbereichsstamm des Codex-App-Servers. Wenn gesetzt, leitet OpenClaw den lokalen Arbeitsbereichsstamm aus dem aufgelösten OpenClaw-Arbeitsbereich ab, behält das aktuelle cwd-Suffix unter diesem Remote-Stamm bei und sendet nur das endgültige App-Server-cwd an Codex. Wenn das cwd außerhalb des aufgelösten OpenClaw-Arbeitsbereichsstamms liegt, verweigert OpenClaw sicher, statt einen Gateway-lokalen Pfad an den Remote-App-Server zu senden. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout für Control-Plane-Aufrufe des App-Servers.                                                                                                                                                                                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ruhefenster, nachdem Codex einen Turn akzeptiert hat oder nach einer turn-bezogenen App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                                           |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Completion-Idle- und Fortschrittswächter, der nach einer Tool-Übergabe, nativer Tool-Fertigstellung, rohem Assistant-Fortschritt nach einem Tool, roher Reasoning-Fertigstellung oder Reasoning-Fortschritt verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder schwere Workloads, bei denen die Synthese nach einem Tool berechtigterweise länger ruhig bleiben kann als das finale Assistant-Release-Budget. |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht ausschließen | Vorgabe für YOLO- oder Guardian-geprüfte Ausführung. Lokale stdio-Anforderungen, die `danger-full-access`, die Genehmigung `never` oder den Reviewer `user` auslassen, machen Guardian zur impliziten Standardeinstellung.                                                                                                                                                                         |
| `approvalPolicy`                              | `"never"` oder eine erlaubte Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die an Thread-Start, -Fortsetzung und Turn gesendet wird. Guardian-Standards bevorzugen `"on-request"`, wenn erlaubt.                                                                                                                                                                                                                                      |
| `sandbox`                                     | `"danger-full-access"` oder eine erlaubte Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der an Thread-Start und -Fortsetzung gesendet wird. Guardian-Standards bevorzugen `"workspace-write"`, wenn erlaubt, andernfalls `"read-only"`. Wenn eine OpenClaw-Sandbox aktiv ist, verwenden `danger-full-access`-Turns Codex `workspace-write` mit Netzwerkzugriff, der aus der Egress-Einstellung der OpenClaw-Sandbox abgeleitet wird.                         |
| `approvalsReviewer`                           | `"user"` oder ein erlaubter Guardian-Reviewer          | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, wenn erlaubt, andernfalls `guardian_subagent` oder `user`. `guardian_subagent` bleibt ein Legacy-Alias.                                                                                                                                                                                                     |
| `serviceTier`                                 | nicht gesetzt                                          | Optionale Codex-App-Server-Service-Stufe. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, `null` löscht die Überschreibung, und das Legacy-`"fast"` wird als `"priority"` akzeptiert.                                                                                                                                                                           |
| `networkProxy`                                | deaktiviert                                            | Aktiviert das Networking des Codex-Berechtigungsprofils für App-Server-Befehle. OpenClaw definiert die ausgewählte Konfiguration `permissions.<profile>.network` und wählt sie mit `default_permissions` aus, statt `sandbox` zu senden.                                                                                                                                                        |
| `experimental.sandboxExecServer`              | `false`                                                | Vorschau-Opt-in, das eine OpenClaw-sandboxgestützte Codex-Umgebung bei Codex-App-Server 0.132.0 oder neuer registriert, sodass native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox laufen kann.                                                                                                                                                                                       |

`appServer.networkProxy` ist explizit, weil es den Codex-Sandbox-Vertrag
ändert. Wenn aktiviert, setzt OpenClaw außerdem `features.network_proxy.enabled` und
`default_permissions` in der Codex-Thread-Konfiguration, sodass das generierte Berechtigungsprofil
von Codex verwaltetes Networking starten kann. Standardmäßig generiert OpenClaw aus dem
Profilinhalt einen kollisionsresistenten Profilnamen `openclaw-network-<fingerprint>`;
verwenden Sie `profileName` nur, wenn ein stabiler lokaler Name erforderlich ist.

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
`networkProxy` arbeitsbereichsartigen Dateisystemzugriff für das generierte
Berechtigungsprofil. Von Codex verwaltete Netzwerkdurchsetzung ist sandboxed Networking,
daher würde ein Full-Access-Profil ausgehenden Datenverkehr nicht schützen.
Domain-Einträge verwenden `allow` oder `deny`; Unix-Socket-Einträge verwenden die Codex-Werte
`allow` oder `none`.

OpenClaw-eigene dynamische Tool-Aufrufe sind unabhängig von
`appServer.requestTimeoutMs` begrenzt: Codex-`item/tool/call`-Anfragen verwenden standardmäßig einen 90-sekündigen
OpenClaw-Watchdog. Ein positives `timeoutMs`-Argument pro Aufruf verlängert
oder verkürzt dieses spezifische Tool-Budget. Das Tool `image_generate` verwendet
`agents.defaults.imageGenerationModel.timeoutMs`, wenn der Tool-Aufruf kein
eigenes Timeout bereitstellt, oder andernfalls einen 120-sekündigen Standardwert für die Bilderzeugung.
Das medienverstehende `image`-Tool verwendet
`tools.media.image.timeoutSeconds` oder seinen 60-sekündigen Medienstandard. Für das Bildverständnis
gilt dieses Timeout für die Anfrage selbst und wird nicht
durch frühere Vorbereitungsarbeiten verkürzt. Dynamische Tool-Budgets sind
auf 600000 ms begrenzt. Bei einem Timeout bricht OpenClaw das Tool-Signal ab,
soweit unterstützt, und gibt eine fehlgeschlagene Dynamic-Tool-Antwort an Codex zurück, damit der Turn
fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.
Dieser Watchdog ist das äußere dynamische `item/tool/call`-Budget; providerspezifische
Request-Timeouts laufen innerhalb dieses Aufrufs und behalten ihre eigene Timeout-Semantik.

Nachdem Codex einen Turn akzeptiert hat und nachdem OpenClaw auf eine turnbezogene
App-Server-Anfrage geantwortet hat, erwartet das Harness, dass Codex im aktuellen Turn Fortschritt macht und
den nativen Turn schließlich mit `turn/completed` abschließt. Wenn der App-Server
für `appServer.turnCompletionIdleTimeoutMs` still bleibt, unterbricht OpenClaw bestmöglich
den Codex-Turn, zeichnet ein Diagnose-Timeout auf und gibt die
OpenClaw-Sitzungsspur frei, damit nachfolgende Chat-Nachrichten nicht hinter einem veralteten
nativen Turn eingereiht werden. Die meisten nicht-terminalen Benachrichtigungen für denselben Turn deaktivieren diesen kurzen
Watchdog, weil Codex nachgewiesen hat, dass der Turn noch aktiv ist. Tool-Übergaben verwenden ein
längeres Idle-Budget nach dem Tool: nachdem OpenClaw eine `item/tool/call`-
Antwort zurückgegeben hat, nachdem native Tool-Items wie `commandExecution` abgeschlossen sind, nach rohen
`custom_tool_call_output`-Abschlüssen sowie nach rohem Assistant-
Fortschritt nach dem Tool, rohen Reasoning-Abschlüssen oder Reasoning-Fortschritt. Der Schutz verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn konfiguriert, und
standardmäßig andernfalls fünf Minuten. Dasselbe Post-Tool-Budget verlängert auch den
Fortschritts-Watchdog für das stille Synthesefenster, bevor Codex das nächste
Current-Turn-Ereignis ausgibt. Globale App-Server-Benachrichtigungen, etwa Rate-Limit-Updates,
setzen den Turn-Idle-Fortschritt nicht zurück. Reasoning-Abschlüsse, Commentary-
`agentMessage`-Abschlüsse und roher Reasoning- oder Assistant-Fortschritt vor dem Tool können
von einer automatischen finalen Antwort gefolgt werden, daher verwenden sie den Reply-Schutz nach Fortschritt
statt die Sitzungsspur sofort freizugeben. Nur
finale/nicht-kommentierende abgeschlossene `agentMessage`-Items und rohe
Assistant-Abschlüsse vor dem Tool schalten die Assistant-Output-Freigabe scharf: Wenn Codex danach ohne
`turn/completed` still bleibt, unterbricht OpenClaw bestmöglich den nativen Turn und
gibt die Sitzungsspur frei. Replay-sichere Stdio-App-Server-Fehler, einschließlich
Turn-Completion-Idle-Timeouts ohne Assistant-, Tool-, Active-Item- oder
Side-Effect-Nachweis, werden einmal mit einem frischen App-Server-Versuch wiederholt. Unsichere
Timeouts nehmen den festhängenden App-Server-Client dennoch außer Betrieb und geben die OpenClaw-
Sitzungsspur frei. Außerdem löschen sie die veraltete native Thread-Bindung, statt
automatisch wiederholt zu werden. Completion-Watch-Timeouts zeigen Codex-spezifischen Timeout-
Text an: Replay-sichere Fälle sagen, dass die Antwort unvollständig sein kann, während unsichere Fälle
die Benutzer anweisen, den aktuellen Zustand vor dem erneuten Versuch zu prüfen. Öffentliche Timeout-Diagnosen
enthalten strukturelle Felder wie die letzte App-Server-Benachrichtigungsmethode,
ID/Typ/Rolle des rohen Assistant-Response-Items, aktive Request-/Item-Zählungen und den scharfgeschalteten
Watch-State. Wenn die letzte Benachrichtigung ein rohes Assistant-Response-Item ist, enthalten sie
auch eine begrenzte Assistant-Textvorschau. Sie enthalten keine rohen Prompt- oder
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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Die Konfiguration wird
für wiederholbare Deployments bevorzugt, weil sie das Plugin-Verhalten in derselben
geprüften Datei hält wie den Rest des Codex-Harness-Setups.

## Native Codex-Plugins

Native Codex-Plugin-Unterstützung verwendet die eigenen App- und Plugin-
Funktionen des Codex-App-Servers im selben Codex-Thread wie den OpenClaw-Harness-Turn. OpenClaw
übersetzt Codex-Plugins nicht in synthetische `codex_plugin_*`-dynamische Tools von OpenClaw.

`codexPlugins` betrifft nur Sitzungen, die das native Codex-Harness auswählen. Es
hat keine Auswirkung auf integrierte Harness-Läufe, normale OpenAI-Provider-Läufe, ACP-Konversations-
Bindungen oder andere Harnesses.

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
herstellt oder eine veraltete Codex-Thread-Bindung ersetzt. Sie wird nicht bei jedem Turn
neu berechnet. Verwenden Sie nach dem Ändern von `codexPlugins` `/new`, `/reset` oder starten Sie den Gateway neu, damit
künftige Codex-Harness-Sitzungen mit dem aktualisierten App-Set starten.

Zu Migrationseignung, App-Bestand, Richtlinie für destruktive Aktionen,
Elicitations und nativen Plugin-Diagnosen siehe
[Native Codex-Plugins](/de/plugins/codex-native-plugins).

Der App- und Plugin-Zugriff auf OpenAI-Seite wird durch das angemeldete Codex-Konto
und, für Business- und Enterprise/Edu-Arbeitsbereiche, durch App-Steuerungen des Arbeitsbereichs kontrolliert. Siehe
[Codex mit Ihrem ChatGPT-Plan verwenden](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
für OpenAIs Übersicht über Konto- und Arbeitsbereichssteuerungen.

## Computer Use

Computer Use wird in einer eigenen Einrichtungsanleitung behandelt:
[Codex Computer Use](/de/plugins/codex-computer-use).

Die Kurzfassung: OpenClaw vendort die Desktop-Control-App nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, verifiziert, dass der
`computer-use`-MCP-Server verfügbar ist, und lässt Codex dann die nativen MCP-
Tool-Aufrufe während Turns im Codex-Modus besitzen.

## Runtime-Grenzen

Das Codex-Harness ändert nur den Low-Level eingebetteten Agent-Executor.

- Dynamische OpenClaw-Tools werden unterstützt. Codex fordert OpenClaw auf, diese
  Tools auszuführen, daher bleibt OpenClaw im Ausführungspfad.
- Codex-native Shell-, Patch-, MCP- und native App-Tools gehören Codex.
  OpenClaw kann ausgewählte native Ereignisse über das unterstützte
  Relay beobachten oder blockieren, schreibt aber native Tool-Argumente nicht um.
- Codex besitzt native Compaction. OpenClaw führt einen Transcript-Spiegel für Channel-
  Verlauf, Suche, `/new`, `/reset` und künftige Modell- oder Harness-Wechsel, ersetzt
  Codex Compaction jedoch nicht durch einen OpenClaw- oder Context-Engine-
  Summarizer.
- Medienerzeugung, Medienverständnis, TTS, Genehmigungen und Messaging-Tool-
  Ausgabe laufen weiterhin über die passenden OpenClaw-Provider-/Modell-Einstellungen.
- `tool_result_persist` gilt für OpenClaw-eigene Transcript-Tool-Ergebnisse, nicht für
  Codex-native Tool-Ergebnisdatensätze.

Zu Hook-Schichten, unterstützten V1-Oberflächen, nativer Berechtigungsbehandlung, Queue-
Steuerung, Mechanik des Codex-Feedback-Uploads und Compaction-Details siehe
[Codex-Harness-Runtime](/de/plugins/codex-harness-runtime).

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Das ist für
neue Konfigurationen erwartet. Wählen Sie ein `openai/gpt-*`-Modell aus, aktivieren Sie
`plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet das integrierte Harness statt Codex:** Stellen Sie sicher, dass die Modellreferenz
`openai/gpt-*` auf dem offiziellen OpenAI-Provider ist und dass das Codex-Plugin
installiert und aktiviert ist. Wenn Sie beim Testen strikten Nachweis benötigen, setzen Sie Provider oder
Modell `agentRuntime.id: "codex"`. Eine erzwungene Codex-Runtime schlägt fehl, statt
auf OpenClaw zurückzufallen.

**OpenAI-Codex-Runtime fällt auf den API-Key-Pfad zurück:** Sammeln Sie einen redigierten
Gateway-Ausschnitt, der das Modell, die Runtime, den ausgewählten Provider und den Fehler zeigt.
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

Nützliche Ausschnitte enthalten normalerweise `openai/gpt-5.5` oder `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` oder `harnessRuntime`,
`candidateProvider: "openai"` und ein `401`-, `Incorrect API key`- oder
`No API key`-Ergebnis. Ein korrigierter Lauf sollte den OpenAI-OAuth-
Pfad statt eines einfachen OpenAI-API-Key-Fehlers zeigen.

**Legacy-Codex-Modellreferenzen bleiben in der Konfiguration:** Führen Sie `openclaw doctor --fix` aus.
Doctor schreibt Legacy-Modellreferenzen zu `openai/*` um, entfernt veraltete Sitzungs- und
Whole-Agent-Runtime-Pins und bewahrt vorhandene Auth-Profile-Overrides.

**Der App-Server wird abgelehnt:** Verwenden Sie Codex-App-Server `0.125.0` oder neuer.
Prereleases derselben Version oder Build-Suffix-Versionen wie
`0.125.0-alpha.2` oder `0.125.0+custom` werden abgelehnt, weil OpenClaw den
stabilen Protokoll-Mindeststand `0.125.0` testet.

**`/codex status` kann keine Verbindung herstellen:** Prüfen Sie, ob das gebündelte `codex`-Plugin
aktiviert ist, ob `plugins.allow` es einschließt, wenn eine Allowlist konfiguriert ist, und
ob benutzerdefinierte `appServer.command`, `url`, `authToken` oder Header gültig sind.

**Modellerkennung ist langsam:** Senken Sie
`plugins.entries.codex.config.discovery.timeoutMs` oder deaktivieren Sie die Erkennung. Siehe
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference#model-discovery).

**WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`, `authToken`,
Header und ob der entfernte App-Server dieselbe Codex-App-Server-
Protokollversion spricht.

**Native Shell- oder Patch-Tools werden mit `Native hook relay unavailable` blockiert:**
Der Codex-Thread versucht noch, eine native Hook-Relay-ID zu verwenden, die OpenClaw
nicht mehr registriert hat. Dies ist ein natives Codex-Hook-Transportproblem, kein ACP-
Backend-, Provider-, GitHub- oder Shell-Befehlsfehler. Starten Sie eine frische Sitzung im
betroffenen Chat mit `/new` oder `/reset` und versuchen Sie dann erneut einen harmlosen Befehl. Wenn das
einmal funktioniert, aber der nächste native Tool-Aufruf wieder fehlschlägt, betrachten Sie `/new` nur als temporären
Workaround: Kopieren Sie den Prompt in eine frische Sitzung, nachdem Sie den Codex-
App-Server oder OpenClaw Gateway neu gestartet haben, damit alte Threads verworfen und native Hook-
Registrierungen neu erstellt werden.

**Ein Nicht-Codex-Modell verwendet das integrierte Harness:** Das ist erwartet, sofern
Provider- oder Modell-Runtime-Richtlinie es nicht an ein anderes Harness routet. Einfache Nicht-OpenAI-
Provider-Referenzen bleiben im Modus `auto` auf ihrem normalen Provider-Pfad.

**Computer Use ist installiert, aber Tools werden nicht ausgeführt:** Prüfen Sie
`/codex computer-use status` aus einer neuen Sitzung. Wenn ein Tool
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
- [OpenAI-Codex-Hilfe](https://help.openai.com/en/collections/14937394-codex)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Plugin-Hooks](/de/plugins/hooks)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Status](/de/cli/status)
- [Testen](/de/help/testing-live#live-codex-app-server-harness-smoke)
