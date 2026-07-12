---
read_when:
    - Sie möchten das offizielle App-Server-Harness von Codex verwenden
    - Sie benötigen Beispiele für die Codex-Harness-Konfiguration
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, anstatt auf OpenClaw zurückzufallen.
summary: Führen Sie eingebettete OpenClaw-Agentendurchläufe über das offizielle Codex-App-Server-Testsystem aus
title: Codex-Harness
x-i18n:
    generated_at: "2026-07-12T15:41:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5f6705dad9fa3bbe45c2f4eaf079ecb861b7911142bda1301c4d64a1f21a8ec5
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das offizielle `codex`-Plugin führt eingebettete OpenAI-Agent-Durchläufe über den Codex
app-server statt über das integrierte OpenClaw-Harness aus. Codex verwaltet die
Low-Level-Agent-Sitzung: native Thread-Fortsetzung, native Tool-Fortsetzung,
native Compaction und app-server-Ausführung. OpenClaw verwaltet weiterhin Chat-
Kanäle, Sitzungsdateien, Modellauswahl, dynamische OpenClaw-Tools, Genehmigungen,
Medienzustellung und die sichtbare Transkriptspiegelung.

Verwenden Sie kanonische OpenAI-Modellreferenzen wie `openai/gpt-5.6-sol`. Konfigurieren Sie
keine veralteten Codex-GPT-Referenzen; legen Sie die OpenAI-Agent-Authentifizierungsreihenfolge unter `auth.order.openai` ab.
Veraltete Codex-Authentifizierungsprofil-IDs und veraltete Einträge der Codex-Authentifizierungsreihenfolge werden
durch `openclaw doctor --fix` repariert.

Wenn die Provider-/Modell-Laufzeitrichtlinie nicht festgelegt oder auf `auto` gesetzt ist, wählt allein das Präfix `openai/*`
niemals dieses Harness aus. OpenAI darf Codex nur für eine
exakte offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses ohne
explizite Anfrageüberschreibung implizit auswählen. Siehe
[Implizite OpenAI-Agent-Laufzeit](/de/providers/openai#implicit-agent-runtime).
Wenn Codex die Authentifizierung verwaltet, bevor das Routing zwischen Platform und ChatGPT feststeht, verlangt OpenClaw
weiterhin, dass jede mögliche Route Codex-Kompatibilität deklariert. Die native
Authentifizierungsverwaltung allein umgeht diese Routenprüfung niemals.

Wenn keine OpenClaw-Sandbox aktiv ist, startet OpenClaw Codex-app-server-Threads
mit aktiviertem nativen Codex-Codemodus (der ausschließliche Codemodus bleibt standardmäßig deaktiviert), sodass
native Workspace-/Code-Funktionen zusammen mit dynamischen OpenClaw-
Tools verfügbar bleiben, die über die app-server-Bridge `item/tool/call` weitergeleitet werden. Eine
aktive OpenClaw-Sandbox oder eingeschränkte Tool-Richtlinie deaktiviert den nativen Codemodus
vollständig, sofern Sie sich nicht explizit für den experimentellen Sandbox-exec-server-Pfad entscheiden.

Mit der Standardeinstellung `tools.exec.host: "auto"` und ohne aktive OpenClaw-Sandbox
erhält Codex außerdem die Tools `node_exec` und `node_process` für Befehle auf gekoppelten
Nodes. Die native Shell verbleibt auf dem Host und im Workspace des Codex-app-server
(bei der standardmäßigen stdio-Bereitstellung Gateway-lokal); `node_exec` wählt eine Node anhand von
Name oder ID aus und setzt die Node-Genehmigungsrichtlinie von OpenClaw weiterhin durch.

Diese native Codex-Funktion ist unabhängig vom
[OpenClaw-Codemodus](/de/reference/code-mode), einer optionalen QuickJS-WASI-Laufzeit
für generische OpenClaw-Durchläufe mit einer anderen `exec`-Eingabestruktur. Einen Einstieg
in die umfassendere Trennung von Modell, Provider und Laufzeit bietet
[Agent-Laufzeiten](/de/concepts/agent-runtimes): `openai/gpt-5.6-sol` ist die Modellreferenz,
`codex` ist die Laufzeit und Telegram, Discord, Slack oder ein anderer
Kanal ist die Kommunikationsoberfläche.

## Anforderungen

- Das offizielle Plugin `@openclaw/codex` muss installiert sein. Nehmen Sie `codex` in
  `plugins.allow` auf, wenn Ihre Konfiguration eine Positivliste verwendet.
- Codex-app-server `0.143.0` oder neuer. Das Plugin verwaltet standardmäßig eine kompatible
  Binärdatei, sodass ein `codex`-Befehl in `PATH` den normalen
  Start nicht beeinflusst.
- Codex-Authentifizierung über `openclaw models auth login --provider openai`, ein
  bereits im Codex-Home des Agenten vorhandenes app-server-Konto oder ein
  explizites Codex-API-Schlüssel-Authentifizierungsprofil.

Informationen zur Authentifizierungspriorität, Umgebungsisolierung, zu benutzerdefinierten app-server-Befehlen,
zur Modellerkennung und zur vollständigen Liste der Konfigurationsfelder finden Sie in der
[Referenz zum Codex-Harness](/de/plugins/codex-harness-reference).

## Schnellstart

Installieren Sie das offizielle Plugin und melden Sie sich anschließend mit Codex OAuth an:

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

Aktivieren Sie das `codex`-Plugin und wählen Sie ein OpenAI-Agent-Modell aus:

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
      model: "openai/gpt-5.6-sol",
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

Starten Sie das Gateway nach Änderungen an der Plugin-Konfiguration neu. Wenn ein Chat bereits über eine
Sitzung verfügt, führen Sie zuerst `/new` oder `/reset` aus, damit der nächste Durchlauf das Harness
anhand der aktuellen Konfiguration auflöst.

## Threads mit Codex Desktop und CLI teilen

Die Standardeinstellung `appServer.homeScope: "agent"` isoliert jeden OpenClaw-Agenten vom
nativen Codex-Zustand des Betreibers. Damit ein Eigentümer dieselben nativen Threads prüfen und verwalten kann,
die in Codex Desktop und der Codex CLI angezeigt werden, aktivieren Sie das
Codex-Home des Benutzers:

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

Der Benutzerverzeichnismodus unterstützt einen lokal verwalteten stdio-Prozess oder den gemeinsam genutzten Unix-Socket-
Transport. Er verwendet `$CODEX_HOME`, wenn es gesetzt ist, andernfalls `~/.codex`, einschließlich
der nativen Codex-Authentifizierung, -Konfiguration, -Plugins und des Thread-Speichers dieses Benutzerverzeichnisses. OpenClaw
fügt diesem App-Server kein OpenClaw-Authentifizierungsprofil hinzu.

Besitzer-Turns erhalten das Tool `codex_threads`: native Threads auflisten, durchsuchen, lesen, forken, umbenennen,
archivieren und wiederherstellen. Forken Sie einen Thread, um ihn in
OpenClaw fortzusetzen; der Fork wird an die aktuelle OpenClaw-Sitzung angehängt und bleibt
für andere native Codex-Clients sichtbar. Für die Archivierung ist eine ausdrückliche
Bestätigung erforderlich, dass der Thread andernorts geschlossen ist. Wenn zusätzlich die Überwachung
aktiviert ist, erfordern Transkriptfelder und Änderungen die entsprechende Aktivierung von
`supervision.allowRawTranscripts` oder `supervision.allowWriteControls`.

Setzen Sie denselben Thread nicht gleichzeitig über unabhängige verwaltete
stdio-App-Server fort und schreiben Sie nicht gleichzeitig in ihn. Codex koordiniert aktive Schreibvorgänge innerhalb eines App-Servers, nicht
über separate Prozesse hinweg. Das Forken ist der sichere Koexistenzpfad für gewöhnliche
stdio-Sitzungen im Benutzerverzeichnismodus.

`appServer.homeScope: "user"` allein aktiviert den Flottenkatalog nicht. Verwenden Sie
`supervision.enabled: true`, wenn native Sitzungen in der
OpenClaw-Seitenleiste angezeigt werden sollen. Die Überwachung verwendet eine separate Überwachungsverbindung; ohne
explizite `appServer`-Verbindungseinstellungen verwendet diese Verbindung standardmäßig verwaltetes
stdio im Benutzerverzeichnismodus, während der gewöhnliche Harness agentenbezogen bleibt. Explizite
`appServer`-Einstellungen werden von beiden Pfaden berücksichtigt. Setzen Sie `homeScope: "user"`
wie oben ausdrücklich, wenn der gewöhnliche Harness ebenfalls nativen Zustand gemeinsam nutzen soll.

## Codex-Sitzungen überwachen

Dasselbe `codex`-Plugin kann nicht archivierte Codex-Sitzungen vom Gateway-
Computer und von ausdrücklich aktivierten gekoppelten Nodes auflisten. Eine gespeicherte oder inaktive Gateway-lokale Sitzung kann
einen modellgebundenen Chat erstellen, der ihren begrenzten, persistent gespeicherten Verlauf von Benutzer- und Assistentennachrichten
spiegelt. Seine private Bindung verwendet die Überwachungsverbindung für den nativen
Snapshot, den kanonischen Branch und spätere Turns, während gewöhnliche Codex-Sitzungen
agentenbezogen bleiben. Beim ersten kanonischen Start werden exakt das Modell und der Provider verwendet, die
Codex für den Snapshot-Fork zurückgibt. Bei späteren Fortsetzungen bleibt die Auswahl der nativen
Codex-Konfiguration überlassen; das äußere OpenClaw-Modell und die Fallback-Kette ersetzen
sie niemals. Gespeicherte und inaktive Zeilen können nach ausdrücklicher Bestätigung, dass kein anderer Runner aktiv ist,
archiviert werden. Aktive Quellen können keinen Branch erstellen und nicht archiviert werden; ein vorhandener
überwachter Chat kann weiterhin geöffnet werden. Sitzungen gekoppelter Nodes bleiben auf Metadaten beschränkt.

Informationen zur Einrichtung, zu Branching-Regeln, Einschränkungen gekoppelter Nodes, Metadatenoffenlegung und Fehlerbehebung finden Sie unter [Codex-Sitzungen überwachen](/plugins/codex-supervision).

## Konfiguration

| Bedarf                                              | Festlegen                                                                                         | Ort                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Harness aktivieren                                  | `plugins.entries.codex.enabled: true`                                                            | OpenClaw-Konfiguration             |
| Nicht archivierte Codex-Sitzungen anzeigen          | `plugins.entries.codex.config.supervision.enabled: true`                                         | Codex-Plugin-Konfiguration         |
| Eine Plugin-Installation aus der Zulassungsliste beibehalten | `codex` in `plugins.allow` aufnehmen                                                      | OpenClaw-Konfiguration             |
| Geeigneten OpenAI-Turns die implizite Verwendung von Codex erlauben | Exakte offizielle HTTPS-Responses-/ChatGPT-Route, keine vom Autor festgelegte Anfrageüberschreibung, Runtime nicht gesetzt/`auto` | OpenAI-Provider-/Modellkonfiguration |
| Mit ChatGPT/Codex OAuth anmelden                    | `openclaw models auth login --provider openai`                                                   | CLI-Authentifizierungsprofil       |
| API-Schlüssel-Backup für Codex-Ausführungen hinzufügen | `openai:*`-API-Schlüsselprofil, das in `auth.order.openai` nach der Abonnementauthentifizierung aufgeführt ist | CLI-Authentifizierungsprofil + OpenClaw-Konfiguration |
| Bei Nichtverfügbarkeit von Codex geschlossen fehlschlagen | Provider oder Modell `agentRuntime.id: "codex"`                                             | OpenClaw-Modell-/Provider-Konfiguration |
| Direkten OpenAI-API-Datenverkehr verwenden          | Provider oder Modell `agentRuntime.id: "openclaw"` mit normaler OpenAI-Authentifizierung         | OpenClaw-Modell-/Provider-Konfiguration |
| App-Server-Verhalten abstimmen                      | `plugins.entries.codex.config.appServer.*`                                                       | Codex-Plugin-Konfiguration         |
| Native Codex-Plugin-Apps aktivieren                 | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex-Plugin-Konfiguration         |
| Codex Computer Use aktivieren                       | `plugins.entries.codex.config.computerUse.*`                                                     | Codex-Plugin-Konfiguration         |

Bevorzugen Sie `auth.order.openai` für die Reihenfolge „Abonnement zuerst, API-Schlüssel als Backup“.
Vorhandene veraltete Codex-Authentifizierungsprofil-IDs und die veraltete Codex-Authentifizierungsreihenfolge sind
veralteter Zustand ausschließlich für Doctor; schreiben Sie keine neuen veralteten Codex-GPT-Referenzen.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Für eine effektiv Codex-kompatible Route bleiben beide oben genannten Profile
Kandidaten für dieselbe Codex-Ausführung. Die Profilreihenfolge wählt Anmeldedaten, nicht die Runtime.
Eine Änderung der Authentifizierungsreihenfolge macht eine benutzerdefinierte, Completions-, HTTP- oder
anfrageüberschriebene Route nicht Codex-kompatibel.

### Compaction

Setzen Sie `compaction.model` oder `compaction.provider` nicht für Codex-gestützte
Agenten. Codex führt Compaction über seinen nativen App-Server-Thread-Zustand durch, daher
ignoriert OpenClaw diese lokalen Überschreibungen für den Zusammenfasser zur Laufzeit, und
`openclaw doctor --fix` entfernt sie, wenn der Agent Codex verwendet.

Lossless wird weiterhin als Kontext-Engine für Zusammenstellung, Aufnahme und
Wartung rund um Codex-Turns unterstützt und über
`plugins.slots.contextEngine: "lossless-claw"` und
`plugins.entries.lossless-claw.config.summaryModel` konfiguriert, nicht über
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migriert die
alte Form `compaction.provider: "lossless-claw"` in den Lossless-
Kontext-Engine-Slot, wenn Codex die aktive Runtime ist; die Compaction verbleibt jedoch
in der Zuständigkeit des nativen Codex. Der native App-Server-Harness unterstützt Kontext-Engines,
die eine Zusammenstellung vor dem Prompt benötigen; generische CLI-Backends, einschließlich `codex-cli`,
stellen diese Host-Fähigkeit nicht bereit.

Bei Codex-gestützten Agenten startet `/compact` die native Codex-App-Server-
Compaction auf dem gebundenen Thread. OpenClaw wartet nicht auf den Abschluss,
legt kein OpenClaw-Timeout fest, startet den gemeinsam genutzten App-Server nicht neu und weicht nicht auf eine
Kontext-Engine oder einen öffentlichen OpenAI-Zusammenfasser aus. Wenn die native Codex-Thread-
Bindung fehlt oder veraltet ist, schlägt der Befehl geschlossen fehl, statt stillschweigend
das Compaction-Backend zu wechseln.

Der Rest dieser Seite behandelt die Bereitstellungsstruktur, geschlossen fehlschlagendes Routing, die Guardian-
Genehmigungsrichtlinie, native Codex-Plugins und Computer Use. Vollständige Listen der Optionen,
Standardwerte, Enums, Erkennung, Umgebungsisolierung, Timeouts und
App-Server-Transportfelder finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Codex-Runtime überprüfen

Verwenden Sie `/status` in dem Chat, in dem Sie Codex erwarten. Ein Codex-gestützter OpenAI-
Agenten-Turn zeigt:

```text
Runtime: OpenAI Codex
```

Prüfen Sie anschließend den Zustand des Codex-App-Servers:

```text
/codex status
/codex models
```

`/codex status` meldet die App-Server-Konnektivität, das Konto, Ratenlimits, MCP-
Server und Skills. `/codex models` listet den Live-Katalog des Codex-App-Servers
für das Harness und das Konto auf. Wenn `/status` unerwartete Angaben enthält, lesen Sie
[Fehlerbehebung](#troubleshooting).

## Routing und Modellauswahl

Halten Sie Provider-Referenzen und Laufzeitrichtlinien getrennt:

- Verwenden Sie `openai/gpt-*` für die kanonische OpenAI-Modellauswahl. Das Präfix allein
  wählt niemals Codex aus.
- Wenn die Laufzeit nicht festgelegt oder auf `auto` gesetzt ist, darf Codex nur bei einer exakt passenden offiziellen
  HTTPS-Route für Platform Responses oder ChatGPT Responses ohne benutzerdefinierte Anfrageüberschreibung
  implizit ausgewählt werden.
- Verwenden Sie keine veralteten Codex-GPT-Referenzen in der Konfiguration; führen Sie `openclaw doctor --fix` aus, um
  veraltete Referenzen und überholte Sitzungs-Routenbindungen zu reparieren.
- `agentRuntime.id: "codex"` macht Codex zu einer Fail-Closed-Anforderung für eine
  kompatible Route. Dadurch wird eine inkompatible effektive Route nicht kompatibel.
- `agentRuntime.id: "openclaw"` weist einen Provider oder ein Modell der eingebetteten
  OpenClaw-Laufzeit zu, wenn dies beabsichtigt ist.
- `/codex ...` steuert native Konversationen des Codex-App-Servers aus dem Chat.
- ACP/acpx ist ein separater externer Harness-Pfad. Verwenden Sie ihn nur, wenn der Benutzer
  ACP/acpx oder einen externen Harness-Adapter anfordert.

| Benutzerabsicht                                             | Verwenden                                                                                             |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Aktuellen Chat verknüpfen                                   | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Vorhandenen Codex-Thread fortsetzen                         | `/codex resume <thread-id>`                                                                           |
| Codex-Threads auflisten oder filtern                        | `/codex threads [filter]`                                                                             |
| Native Codex-Plugins auflisten                              | `/codex plugins list`                                                                                 |
| Ein konfiguriertes natives Codex-Plugin aktivieren/deaktivieren | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                   |
| Eine gespeicherte Codex-CLI-Sitzung als gekoppelten Node-Turn fortsetzen | `/codex sessions --host <node> [filter]`, dann `/codex resume <session-id> --host <node> --bind here` |
| Nicht archivierte Codex-Sitzungen computerübergreifend anzeigen | Aktivieren Sie die Codex-Überwachung und öffnen Sie **Codex-Sitzungen**                           |
| Modell, Schnellmodus oder Berechtigungen des verknüpften Threads ändern | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Aktiven Turn stoppen oder steuern                           | `/codex stop`, `/codex steer <text>`                                                                  |
| Aktuelle Verknüpfung lösen                                  | `/codex detach` (Alias `/codex unbind`)                                                               |
| Nur Codex-Feedback senden                                   | `/codex diagnostics [note]`                                                                           |
| Eine ACP/acpx-Aufgabe starten                               | ACP/acpx-Sitzungsbefehle, nicht `/codex`                                                              |

| Anwendungsfall                                  | Konfigurieren                                                                                               | Überprüfen                              | Hinweise                                                |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| Geeignete OpenAI-Route mit nativer Codex-Laufzeit | Exakt passende offizielle HTTPS-Responses-/ChatGPT-Route ohne benutzerdefinierte Anfrageüberschreibung sowie aktiviertes `codex`-Plugin | `/status` zeigt `Runtime: OpenAI Codex` | Impliziter Pfad, wenn die Laufzeit nicht festgelegt/`auto` ist |
| Fail-Closed, wenn Codex nicht verfügbar ist     | Provider oder Modell mit `agentRuntime.id: "codex"`                                                         | Der Turn schlägt statt eines eingebetteten Fallbacks fehl | Für reine Codex-Bereitstellungen verwenden |
| Direkter OpenAI-API-Schlüssel-Datenverkehr über OpenClaw | Provider oder Modell mit `agentRuntime.id: "openclaw"` und normaler OpenAI-Authentifizierung          | `/status` zeigt die OpenClaw-Laufzeit   | Nur verwenden, wenn OpenClaw beabsichtigt ist           |
| Veraltete Konfiguration                         | veraltete Codex-GPT-Referenzen                                                                               | `openclaw doctor --fix` schreibt sie um | Neue Konfigurationen nicht auf diese Weise erstellen    |
| ACP/acpx-Codex-Adapter                          | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP-Aufgaben-/Sitzungsstatus            | Vom nativen Codex-Harness getrennt                      |

`agents.defaults.imageModel` folgt derselben Präfixaufteilung. Verwenden Sie `openai/gpt-*`
für die normale OpenAI-Route und `codex/gpt-*` nur, wenn das Bildverständnis
über einen begrenzten Turn des Codex-App-Servers ausgeführt werden soll. Doctor schreibt veraltete
Codex-GPT-Referenzen in `openai/gpt-*` um.

## Bereitstellungsmuster

### Grundlegende Codex-Bereitstellung

Verwenden Sie die Schnellstartkonfiguration für ein OpenAI-Modell, dessen effektive offizielle HTTPS-
Route für die implizite Auswahl von Codex geeignet ist:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### Bereitstellung mit mehreren Providern

Behalten Sie Claude als Standard-Agent bei und fügen Sie einen benannten Codex-Agent hinzu:

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
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

Der Agent `main` verwendet seinen normalen Provider-Pfad. Der Agent `codex` verwendet den Codex-
App-Server, solange seine effektive OpenAI-Route kompatibel bleibt; fügen Sie explizit
modellspezifisch `agentRuntime.id: "codex"` hinzu, wenn dies eine Fail-Closed-
Anforderung sein soll.

### Fail-Closed-Codex-Bereitstellung

Eine geeignete, exakt passende offizielle HTTPS-OpenAI-Route kann zu Codex aufgelöst werden, wenn das
mitgelieferte Plugin verfügbar ist. Fügen Sie eine explizite Laufzeitrichtlinie für eine festgelegte
Fail-Closed-Regel hinzu:

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
      model: "openai/gpt-5.6-sol",
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

Wenn Codex erzwungen wird, schlägt OpenClaw frühzeitig fehl, falls die effektive Route nicht als
Codex-kompatibel deklariert ist, das Plugin deaktiviert ist, der App-Server zu alt ist oder der
App-Server nicht gestartet werden kann.

## App-Server-Richtlinie

Standardmäßig startet das Plugin die von OpenClaw verwaltete Codex-Binärdatei lokal mit
stdio-Transport. Legen Sie `appServer.command` nur fest, um absichtlich eine
andere ausführbare Datei auszuführen. Verwenden Sie den WebSocket-Transport nur, wenn bereits an anderer Stelle
ein App-Server ausgeführt wird:

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

Lokale stdio-App-Server-Sitzungen verwenden standardmäßig die vertrauenswürdige lokale Operator-
Haltung: `approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Wenn lokale Codex-Anforderungen diese
implizite YOLO-Haltung nicht zulassen, wählt OpenClaw stattdessen zulässige
Guardian-Berechtigungen. Wenn für die Sitzung eine OpenClaw-Sandbox aktiv ist, deaktiviert OpenClaw
für diesen Turn den nativen Codex-Code-Modus, benutzerdefinierte MCP-Server und die
app-gestützte Plugin-Ausführung, statt sich auf das hostseitige Sandboxing von Codex zu verlassen.
Der Shell-Zugriff erfolgt stattdessen über dynamische, durch die OpenClaw-Sandbox gestützte Tools wie
`sandbox_exec` und `sandbox_process`, wenn die normalen exec-/process-Tools
verfügbar sind.

Verwenden Sie den normalisierten OpenClaw-exec-Modus für die native automatische Codex-Überprüfung vor
Sandbox-Ausbrüchen oder zusätzlichen Berechtigungen:

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

Für Sitzungen des Codex-App-Servers wird `tools.exec.mode: "auto"` auf von Codex
Guardian überprüfte Genehmigungen abgebildet: normalerweise `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"`, wenn
die lokalen Anforderungen diese Werte zulassen. Bei `tools.exec.mode: "auto"`
behält OpenClaw veraltete unsichere Codex-Überschreibungen wie `approvalPolicy: "never"` oder
`sandbox: "danger-full-access"` nicht bei; verwenden Sie `tools.exec.mode: "full"` für
eine beabsichtigte Codex-Haltung ohne Genehmigungen. Die veraltete
Voreinstellung `plugins.entries.codex.config.appServer.mode: "guardian"` funktioniert weiterhin,
aber `tools.exec.mode: "auto"` ist die normalisierte OpenClaw-Oberfläche.

Den Vergleich auf Modusebene mit Host-exec-Genehmigungen und ACPX-
Berechtigungen finden Sie unter [Berechtigungsmodi](/de/tools/permission-modes). Informationen zu allen
App-Server-Feldern, zur Authentifizierungsreihenfolge, Umgebungsisolierung und zum Timeout-Verhalten
finden Sie in der [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Befehle und Diagnose

Das `codex`-Plugin registriert `/codex` als Slash-Befehl auf jedem Kanal, der
OpenClaw-Textbefehle unterstützt.

Native Ausführung und Steuerung erfordern einen Eigentümer oder einen `operator.admin`-
Gateway-Client: Threads verknüpfen oder fortsetzen, Turns senden oder stoppen,
Modell, Schnellmodus oder Berechtigungsstatus ändern, Compaction oder Überprüfung durchführen und
eine Verknüpfung lösen. Andere autorisierte Absender behalten schreibgeschützte Befehle zur
Status-, Hilfe-, Konto-, Modell-, Thread-, MCP-Server-, Skills- und
Verknüpfungsprüfung.

Gängige Formen:

- `/codex status` prüft App-Server-Konnektivität, Modelle, Konto, Ratenlimits,
  MCP-Server und Skills.
- `/codex models` listet Live-Modelle des Codex-App-Servers auf.
- `/codex threads [filter]` listet aktuelle Threads des Codex-App-Servers auf.
- `/codex resume <thread-id>` verknüpft die aktuelle OpenClaw-Sitzung mit einem
  vorhandenen Codex-Thread.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  verknüpft den aktuellen Chat.
- `/codex detach` (oder `/codex unbind`) löst die aktuelle Verknüpfung.
- `/codex binding` beschreibt die aktuelle Verknüpfung.
- `/codex stop` stoppt den aktiven Turn; `/codex steer <text>` steuert ihn.
- `/codex model <model>`, `/codex fast [on|off|status]` und
  `/codex permissions [default|yolo|status]` ändern den Zustand pro Konversation.
- `/codex compact` fordert den Codex-App-Server auf, Compaction für den verknüpften Thread durchzuführen.
- `/codex review` startet die native Codex-Überprüfung für den verknüpften Thread.
- `/codex diagnostics [note]` fragt vor dem Senden von Codex-Feedback zum
  verknüpften Thread nach.
- `/codex account` zeigt den Konto- und Ratenlimitstatus an.
- `/codex mcp` listet den Status der MCP-Server des Codex-App-Servers auf.
- `/codex skills` listet die Skills des Codex-App-Servers auf.
- `/codex plugins list`, `/codex plugins enable <name>` und
  `/codex plugins disable <name>` verwalten konfigurierte native Codex-Plugins.
- `/codex computer-use [status|install]` verwaltet Codex Computer Use.
- `/codex help` listet den vollständigen Befehlsbaum auf.

Bei den meisten Supportmeldungen beginnen Sie mit `/diagnostics [note]` in der
Unterhaltung, in der der Fehler aufgetreten ist. Dadurch wird ein Gateway-Diagnosebericht
erstellt und bei Codex-Harness-Sitzungen um Genehmigung zum Senden des
relevanten Codex-Feedbackpakets gebeten. Weitere Informationen zum Datenschutzmodell und
Verhalten in Gruppenchats finden Sie unter
[Diagnoseexport](/de/gateway/diagnostics). Verwenden Sie `/codex diagnostics [note]` nur, wenn Sie ausdrücklich
den Codex-Feedback-Upload für den aktuell angehängten Thread ohne
das vollständige Gateway-Diagnosepaket wünschen.

### Codex-Threads lokal untersuchen

Die schnellste Möglichkeit, einen fehlerhaften Codex-Lauf zu untersuchen, besteht häufig darin, den nativen
Codex-Thread direkt zu öffnen:

```bash
codex resume <thread-id>
```

Die Thread-ID finden Sie in der abgeschlossenen Antwort von `/diagnostics`, unter `/codex binding`
oder mit `/codex threads [filter]`.

Informationen zu Upload-Mechanismen und Diagnosegrenzen auf Laufzeitebene finden Sie unter
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime#codex-feedback-upload).

### Authentifizierungsreihenfolge

Im standardmäßigen agentenspezifischen Home-Verzeichnis wird die Authentifizierung in dieser Reihenfolge ausgewählt:

1. Geordnete OpenAI-Authentifizierungsprofile für den Agenten, vorzugsweise unter
   `auth.order.openai`. Führen Sie `openclaw doctor --fix` aus, um ältere Codex-Authentifizierungsprofil-IDs
   und die ältere Codex-Authentifizierungsreihenfolge zu migrieren.
2. Das vorhandene Konto des App-Servers im Codex-Home-Verzeichnis dieses Agenten.
3. Nur für lokale App-Server-Starts über stdio: `CODEX_API_KEY`, anschließend
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und weiterhin eine
   OpenAI-Authentifizierung erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt,
entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY` aus dem gestarteten
Codex-Kindprozess. Dadurch bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder
direkte OpenAI-Modelle verfügbar, ohne dass native Codex-App-Server-Aufrufe
versehentlich über die API abgerechnet werden. Explizite Codex-API-Schlüsselprofile und der lokale
stdio-Fallback auf Umgebungsschlüssel verwenden die App-Server-Anmeldung statt geerbter
Umgebungsvariablen des Kindprozesses. WebSocket-App-Server-Verbindungen erhalten keinen
Fallback auf API-Schlüssel aus der Gateway-Umgebung; verwenden Sie ein explizites Authentifizierungsprofil oder
das eigene Konto des entfernten App-Servers.

Wenn ein Abonnementprofil ein Codex-Nutzungslimit erreicht, zeichnet OpenClaw den
Zurücksetzungszeitpunkt auf, sofern Codex einen meldet, und versucht für denselben Codex-Lauf
das nächste geordnete Authentifizierungsprofil. Nach Ablauf des Zurücksetzungszeitpunkts
ist das Abonnementprofil wieder verwendbar, ohne dass das ausgewählte Modell `openai/gpt-*`
oder die Codex-Laufzeit geändert wird.

Wenn native Codex-Plugins konfiguriert sind, installiert oder aktualisiert OpenClaw
diese Plugins über den verbundenen App-Server, bevor Plugin-eigene
Apps für den Codex-Thread verfügbar gemacht werden. `app/list` bleibt die maßgebliche Quelle für
App-IDs, Zugänglichkeit und Metadaten, aber OpenClaw entscheidet über die
Aktivierung pro Thread: Wenn die Richtlinie eine aufgeführte zugängliche App zulässt, sendet OpenClaw
`thread/start.config.apps[appId].enabled = true`, auch wenn `app/list`
diese App derzeit als deaktiviert meldet. Dieser Pfad nimmt keine App-
Installation für unbekannte IDs vor; OpenClaw aktiviert nur Marketplace-Plugins
mit `plugin/install` und aktualisiert anschließend den Bestand.

### Umgebungsisolation

Bei lokalen App-Server-Starts über stdio setzt OpenClaw `CODEX_HOME` auf ein
agentenspezifisches Verzeichnis, damit Codex-Konfiguration, Authentifizierungs-/Kontodateien, Plugin-Cache/-Daten
und nativer Thread-Status standardmäßig nicht das persönliche
`~/.codex` des Betreibers lesen oder beschreiben. OpenClaw behält das normale Prozess-`HOME` bei;
von Codex ausgeführte Unterprozesse können weiterhin Konfiguration und Tokens im Benutzer-Home-Verzeichnis finden, und
Codex kann gemeinsam genutzte Einträge unter `$HOME/.agents/skills` und
`$HOME/.agents/plugins/marketplace.json` erkennen. Mit
`appServer.homeScope: "user"` verwendet OpenClaw stattdessen das native Codex-Home-Verzeichnis
des Benutzers und dessen vorhandenes Konto, ohne ein OpenClaw-Authentifizierungsprofil einzufügen.

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

`appServer.clearEnv` wirkt sich nur auf den gestarteten Codex-App-Server-Kindprozess
aus. OpenClaw entfernt `CODEX_HOME` und `HOME` während der
lokalen Startnormalisierung aus dieser Liste: `CODEX_HOME` verweist weiterhin auf den ausgewählten
Agenten- oder Benutzerbereich, und `HOME` bleibt geerbt, damit Unterprozesse den
normalen Status im Benutzer-Home-Verzeichnis verwenden können.

### Dynamische Tools und Websuche

Dynamische Codex-Tools verwenden standardmäßig den Lademodus `searchable`. OpenClaw stellt keine
dynamischen Tools bereit, die native Codex-Arbeitsbereichsoperationen duplizieren:
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`,
`tool_call`, `tool_describe`, `tool_search` und `tool_search_code`. Die meisten
übrigen OpenClaw-Integrationstools, etwa für Messaging, Medien, Cron,
Browser, Nodes, Gateway und `heartbeat_respond`, sind über
die Codex-Tool-Suche im Namespace `openclaw` verfügbar, wodurch der anfängliche
Modellkontext kleiner bleibt.

Mit `catalogMode: "direct-only"` gekennzeichnete Tools, einschließlich des OpenClaw-Tools `computer`,
verwenden stattdessen den Namespace `openclaw_direct`. Codex behandelt diesen Namespace
als `DirectModelOnly`, sodass diese Tools in normalen und ausschließlich im
Code-Modus ausgeführten Threads direkt für das Modell sichtbar bleiben, statt verschachtelte Code-Mode-Aufrufe von `tools.*` zu durchlaufen.

Die Websuche verwendet standardmäßig das von Codex gehostete Tool `web_search`, wenn die Suche
aktiviert und kein verwalteter Provider ausgewählt ist. Die native gehostete Suche und
das verwaltete dynamische OpenClaw-Tool `web_search` schließen sich gegenseitig aus, damit
die verwaltete Suche native Domainbeschränkungen nicht umgehen kann. OpenClaw verwendet das
verwaltete Tool, wenn die gehostete Suche nicht verfügbar, ausdrücklich deaktiviert oder
durch einen ausgewählten verwalteten Provider ersetzt wurde. OpenClaw lässt die eigenständige
Codex-Erweiterung `web.run` deaktiviert, da produktiver App-Server-Datenverkehr
deren benutzerdefinierten Namespace `web` ablehnt. `tools.web.search.enabled: false`
deaktiviert beide Pfade; Gleiches gilt für Tool-deaktivierte reine LLM-Läufe. Codex behandelt
`"cached"` als Präferenz und löst sie für uneingeschränkte App-Server-Aufrufe in
direkten externen Zugriff auf. Der automatische verwaltete Fallback schlägt geschlossen fehl, wenn
native `allowedDomains` festgelegt sind, damit die Zulassungsliste nicht umgangen werden kann.
Dauerhafte Änderungen der effektiven Suchrichtlinie wechseln vor dem nächsten Aufruf den gebundenen
Codex-Thread; vorübergehende Einschränkungen pro Aufruf verwenden einen temporären
eingeschränkten Thread und behalten die bestehende Bindung für eine spätere Fortsetzung bei.

`sessions_yield` und ausschließlich auf Nachrichten-Tools basierende Quellantworten bleiben direkt, da
dies Verträge zur Aufrufsteuerung sind. `sessions_spawn` bleibt durchsuchbar, sodass
das native Codex-`spawn_agent` weiterhin die primäre Codex-Subagenten-Schnittstelle darstellt,
während explizite OpenClaw- oder ACP-Delegierung weiterhin über den
dynamischen Tool-Namespace `openclaw` verfügbar ist. Heartbeat-Anweisungen zur Zusammenarbeit
weisen Codex an, vor dem Beenden eines Heartbeat-Aufrufs nach `heartbeat_respond` zu suchen,
wenn das Tool noch nicht geladen ist.

Legen Sie `codexDynamicToolsLoading: "direct"` nur fest, wenn Sie eine Verbindung zu einem benutzerdefinierten
Codex-App-Server herstellen, der zurückgestellte dynamische Tools nicht durchsuchen kann, oder wenn Sie
die vollständige Tool-Nutzlast debuggen.

### Konfigurationsfelder

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standardwert   | Bedeutung                                                                                               |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Tool-Kontext einzufügen. |
| `codexDynamicToolsExclude` | `[]`           | Zusätzliche Namen dynamischer OpenClaw-Tools, die bei Codex-App-Server-Aufrufen ausgelassen werden sollen. |
| `codexPlugins`             | deaktiviert    | Native Codex-Plugin-/App-Unterstützung für migrierte, aus dem Quellcode installierte kuratierte Plugins. |
| `supervision`              | deaktiviert    | Katalog nicht archivierter nativer Sitzungen, Fortsetzung lokaler Branches und Richtlinie für Agenten-Tools. |

Unterstützte `appServer`-Felder:

| Feld                                          | Standardwert                                            | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` startet Codex; ein explizites `"unix"` stellt eine Verbindung zum lokalen Steuerungssocket her; `"websocket"` stellt eine Verbindung zu `url` her.                                                                                                                                                                                                                                    |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isoliert den regulären Harness-Zustand pro OpenClaw-Agent. `"user"` ist eine explizite Opt-in-Einstellung, die das native `$CODEX_HOME` oder `~/.codex` gemeinsam nutzt, native Authentifizierung verwendet und die ausschließlich dem Eigentümer vorbehaltene Thread-Verwaltung aktiviert. Der Benutzerbereich unterstützt lokales stdio oder Unix als Transport. Für die separate Überwachungsverbindung wird ein nicht gesetzter Wert bei stdio oder Unix als `"user"` und bei WebSocket als `"agent"` aufgelöst. |
| `command`                                     | verwaltete Codex-Binärdatei                            | Ausführbare Datei für den stdio-Transport. Lassen Sie den Wert ungesetzt, um die verwaltete Binärdatei zu verwenden; legen Sie ihn nur für eine explizite Überschreibung fest.                                                                                                                                                                                                                     |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumente für den stdio-Transport.                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | nicht gesetzt                                          | WebSocket-App-Server-URL oder `unix://`-URL. Ein explizit leerer Unix-Pfad wählt den kanonischen Steuerungssocket im Benutzerverzeichnis aus.                                                                                                                                                                                                                                                     |
| `authToken`                                   | nicht gesetzt                                          | Bearer-Token für den WebSocket-Transport. Akzeptiert eine Literalzeichenfolge oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                 |
| `headers`                                     | `{}`                                                   | Zusätzliche WebSocket-Header. Headerwerte akzeptieren Literalzeichenfolgen oder SecretInput-Werte, zum Beispiel `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                  |
| `clearEnv`                                    | `[]`                                                   | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw dessen geerbte Umgebung erstellt hat. OpenClaw behält das ausgewählte `CODEX_HOME` und das geerbte `HOME` für lokale Starts bei.                                                                                                                                       |
| `codeModeOnly`                                | `false`                                                | Aktiviert ausschließlich die Code-Modus-Tool-Oberfläche von Codex. Reguläre dynamische OpenClaw-Tools bleiben über verschachtelte `tools.*`-Aufrufe verfügbar; `openclaw_direct`-Tools bleiben für das Modell direkt sichtbar.                                                                                                                                                                      |
| `remoteWorkspaceRoot`                         | nicht gesetzt                                          | Stammverzeichnis des entfernten Codex-App-Server-Arbeitsbereichs. Wenn es festgelegt ist, leitet OpenClaw das lokale Arbeitsbereich-Stammverzeichnis aus dem aufgelösten OpenClaw-Arbeitsbereich ab, behält das aktuelle cwd-Suffix unter diesem entfernten Stammverzeichnis bei und sendet nur das endgültige App-Server-cwd an Codex. Wenn sich das cwd außerhalb des aufgelösten OpenClaw-Arbeitsbereich-Stammverzeichnisses befindet, verweigert OpenClaw den Vorgang, statt einen Gateway-lokalen Pfad an den entfernten App-Server zu senden. |
| `requestTimeoutMs`                            | `60000`                                                | Zeitüberschreitung für Aufrufe der App-Server-Steuerungsebene.                                                                                                                                                                                                                                                                                                                                  |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ruhefenster, nachdem Codex einen Turn akzeptiert hat oder nach einer Turn-bezogenen App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                                             |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Abschlussleerlauf- und Fortschrittsüberwachung, die nach einer Tool-Übergabe, dem Abschluss eines nativen Tools, dem Rohfortschritt des Assistenten nach einem Tool, dem Abschluss der Rohschlussfolgerung oder dem Schlussfolgerungsfortschritt verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder rechenintensive Arbeitslasten, bei denen die Synthese nach einem Tool berechtigterweise länger still bleiben kann als das Freigabebudget der endgültigen Assistentenantwort. |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht ausschließen | Voreinstellung für YOLO oder eine vom Guardian überprüfte Ausführung. Lokale stdio-Anforderungen, die `danger-full-access`, die Genehmigung `never` oder den Reviewer `user` nicht enthalten, machen Guardian zum impliziten Standard.                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` oder eine zulässige Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die beim Starten/Fortsetzen eines Threads und bei einem Turn gesendet wird. Guardian-Standardeinstellungen bevorzugen `"on-request"`, sofern zulässig.                                                                                                                                                                                                        |
| `sandbox`                                     | `"danger-full-access"` oder eine zulässige Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der beim Starten/Fortsetzen eines Threads gesendet wird. Guardian-Standardeinstellungen bevorzugen `"workspace-write"`, sofern zulässig, andernfalls `"read-only"`. Wenn eine OpenClaw-Sandbox aktiv ist, verwenden Turns mit `danger-full-access` Codex `workspace-write`, wobei der Netzwerkzugriff aus der Egress-Einstellung der OpenClaw-Sandbox abgeleitet wird. |
| `approvalsReviewer`                           | `"user"` oder ein zulässiger Guardian-Reviewer         | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsanfragen überprüft, sofern dies zulässig ist, andernfalls `guardian_subagent` oder `user`. `guardian_subagent` bleibt ein veralteter Alias.                                                                                                                                                                                           |
| `serviceTier`                                 | nicht gesetzt                                          | Optionale Dienststufe des Codex-App-Servers. `"priority"` aktiviert das Fast-Mode-Routing, `"flex"` fordert die Flex-Verarbeitung an, `null` entfernt die Überschreibung und das veraltete `"fast"` wird als `"priority"` akzeptiert.                                                                                                                                                              |
| `networkProxy`                                | deaktiviert                                            | Aktiviert die Vernetzung über das Codex-Berechtigungsprofil für App-Server-Befehle. OpenClaw definiert die ausgewählte Konfiguration `permissions.<profile>.network` und wählt sie mit `default_permissions` aus, statt `sandbox` zu senden.                                                                                                                                                         |
| `experimental.sandboxExecServer`              | `false`                                                | Vorschau-Opt-in, das eine durch die OpenClaw-Sandbox gestützte Codex-Umgebung beim unterstützten Codex-App-Server registriert, damit die native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox erfolgen kann.                                                                                                                                                                              |

`appServer.networkProxy` ist explizit, da es den Sandbox-Vertrag von Codex
ändert. Wenn die Option aktiviert ist, legt OpenClaw außerdem `features.network_proxy.enabled`
und `default_permissions` in der Codex-Thread-Konfiguration fest, damit das generierte
Berechtigungsprofil die von Codex verwaltete Vernetzung starten kann. Standardmäßig generiert OpenClaw
aus dem Profilinhalt einen kollisionsresistenten Profilnamen
`openclaw-network-<fingerprint>`; verwenden Sie `profileName` nur, wenn ein stabiler lokaler Name
erforderlich ist.

```json5
{
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
}
```

Wenn die normale App-Server-Runtime `danger-full-access` wäre, verwendet die Aktivierung von
`networkProxy` für das generierte Berechtigungsprofil einen Dateisystemzugriff
nach Workspace-Art: Die von Codex verwaltete Netzwerkdurchsetzung besteht aus
sandboxgeschütztem Networking, sodass ein Vollzugriffsprofil ausgehenden Datenverkehr
nicht schützen würde. Domaineinträge verwenden `allow` oder `deny`; Einträge für
Unix-Sockets verwenden die Codex-Werte `allow` oder `none`.

### Dynamische Zeitüberschreitungen für Tool-Aufrufe

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt: Codex-Anfragen vom Typ `item/tool/call`
verwenden standardmäßig einen OpenClaw-Watchdog von 90 Sekunden. Ein positives
Argument `timeoutMs` pro Aufruf verlängert oder verkürzt das Budget dieses
spezifischen Tools, begrenzt auf 600000 ms. Das Tool `image_generate` verwendet
`agents.defaults.imageGenerationModel.timeoutMs`, wenn der Tool-Aufruf keine eigene
Zeitüberschreitung angibt, andernfalls gilt ein Standardwert von 120 Sekunden für
die Bilderzeugung. Das Tool `image` zur Medienanalyse verwendet
`tools.media.image.timeoutSeconds` oder seinen Medienstandardwert von 60 Sekunden;
bei der Bildanalyse gilt diese Zeitüberschreitung für die Anfrage selbst und wird
nicht durch vorherige Vorbereitungsarbeiten verkürzt. Bei einer Zeitüberschreitung
bricht OpenClaw das Tool-Signal ab, sofern dies unterstützt wird, und gibt eine
fehlgeschlagene Antwort des dynamischen Tools an Codex zurück, damit der Turn
fortgesetzt werden kann, statt die Sitzung im Zustand `processing` zu belassen.
Dieser Watchdog ist das äußere Budget für dynamische `item/tool/call`-Aufrufe;
Provider-spezifische Anfragezeitüberschreitungen laufen innerhalb dieses Aufrufs
und behalten ihre eigene Zeitüberschreitungssemantik bei.

Nachdem Codex einen Turn akzeptiert hat und nachdem OpenClaw auf eine auf den Turn
bezogene App-Server-Anfrage geantwortet hat, erwartet das Harness, dass Codex im
aktuellen Turn Fortschritte macht und den nativen Turn schließlich mit
`turn/completed` beendet. Wenn der App-Server für
`appServer.turnCompletionIdleTimeoutMs` inaktiv bleibt, unterbricht OpenClaw den
Codex-Turn nach bestem Bemühen, zeichnet eine diagnostische Zeitüberschreitung auf
und gibt die OpenClaw-Sitzungsspur frei, damit nachfolgende Chatnachrichten nicht
hinter einem veralteten nativen Turn in die Warteschlange gestellt werden. Die
meisten nicht terminalen Benachrichtigungen für denselben Turn deaktivieren diesen
kurzen Watchdog, da Codex nachgewiesen hat, dass der Turn noch aktiv ist.

Tool-Übergaben verwenden ein längeres Inaktivitätsbudget nach dem Tool: nachdem
OpenClaw eine `item/tool/call`-Antwort zurückgibt, nachdem native Tool-Elemente wie
`commandExecution` abgeschlossen sind, nach Abschlüssen von
`custom_tool_call_output` im Rohformat sowie nach nachgelagertem rohem
Assistentenfortschritt, Abschlüssen roher Schlussfolgerungen oder
Schlussfolgerungsfortschritt. Die Schutzlogik verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn dieser Wert
konfiguriert ist, und andernfalls standardmäßig fünf Minuten; dasselbe Budget
verlängert außerdem den Fortschritts-Watchdog für das stille Synthesefenster,
bevor Codex das nächste Ereignis des aktuellen Turns ausgibt. Globale
App-Server-Benachrichtigungen wie Aktualisierungen zu Ratenbegrenzungen setzen den
Inaktivitätsfortschritt des Turns nicht zurück. Abschlüsse von Schlussfolgerungen,
Abschlüsse von `agentMessage` im Kommentarbereich sowie vor dem Tool auftretende
rohe Schlussfolgerungs- oder Assistentenfortschritte können von einer
automatischen endgültigen Antwort gefolgt werden. Daher verwenden sie die
Antwortschutzlogik nach einem Fortschritt, statt die Sitzungsspur sofort
freizugeben.

Nur abgeschlossene endgültige/nicht kommentierende `agentMessage`-Elemente und
vor einem Tool abgeschlossene rohe Assistentenausgaben aktivieren die Freigabe
nach Assistentenausgabe: Wenn Codex anschließend ohne `turn/completed` inaktiv
bleibt, unterbricht OpenClaw den nativen Turn nach bestem Bemühen und gibt die
Sitzungsspur frei. Wenn eine andere Turn-Überwachung dieses Freigaberennen gewinnt,
akzeptiert OpenClaw das abgeschlossene endgültige Assistentenelement dennoch,
sobald keine native Anfrage, kein Element und kein Abschluss eines dynamischen
Tools mehr aktiv ist, die Freigabe nach Assistentenausgabe weiterhin zum zuletzt
abgeschlossenen Element gehört und kein späterer Elementabschluss vorliegt. So
kann die endgültige Antwort nach abgeschlossener Tool-Arbeit erhalten bleiben,
ohne den Turn erneut abzuspielen. Teilweise Assistenten-Deltas, veraltete frühere
Antworten und leere spätere Abschlüsse erfüllen die Voraussetzungen nicht.

Wiederholungssichere Fehler des stdio-App-Servers, einschließlich
Inaktivitätszeitüberschreitungen beim Turn-Abschluss ohne Hinweise auf
Assistentenaktivität, Tools, aktive Elemente oder Nebeneffekte, werden einmal mit
einem neuen App-Server-Versuch wiederholt. Unsichere Zeitüberschreitungen mustern
den festgefahrenen App-Server-Client dennoch aus und geben die
OpenClaw-Sitzungsspur frei; außerdem löschen sie die veraltete Bindung des nativen
Threads, statt automatisch wiederholt zu werden. Zeitüberschreitungen der
Abschlussüberwachung zeigen Codex-spezifischen Zeitüberschreitungstext an: In
wiederholungssicheren Fällen wird darauf hingewiesen, dass die Antwort
möglicherweise unvollständig ist, während unsichere Fälle den Benutzer auffordern,
vor einem erneuten Versuch den aktuellen Zustand zu überprüfen. Öffentliche
Zeitüberschreitungsdiagnosen enthalten strukturelle Felder wie die Methode der
letzten App-Server-Benachrichtigung, ID/Typ/Rolle des rohen
Assistentenantwortelements, die Anzahl aktiver Anfragen und Elemente sowie den
Zustand der aktivierten Überwachung. Wenn die letzte Benachrichtigung ein rohes
Assistentenantwortelement ist, enthalten sie außerdem eine begrenzte Vorschau des
Assistententexts. Rohe Prompt- oder Tool-Inhalte sind nicht enthalten.

### Lokale Umgebungsüberschreibungen für Tests

- `OPENCLAW_CODEX_APP_SERVER_BIN` umgeht die verwaltete Binärdatei, wenn
  `appServer.command` nicht festgelegt ist.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen
`plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Für
wiederholbare Bereitstellungen wird die Konfiguration bevorzugt, da sie das
Plugin-Verhalten in derselben geprüften Datei wie die übrige Einrichtung des
Codex-Harness hält.

## Native Codex-Plugins

Die native Unterstützung für Codex-Plugins verwendet die eigenen App- und
Plugin-Funktionen des Codex-App-Servers im selben Codex-Thread wie der
OpenClaw-Harness-Turn. OpenClaw übersetzt Codex-Plugins nicht in synthetische
dynamische OpenClaw-Tools vom Typ `codex_plugin_*`.

`codexPlugins` betrifft nur Sitzungen, die das native Codex-Harness auswählen.
Es hat keine Auswirkungen auf Ausführungen mit dem integrierten Harness, normale
Ausführungen mit dem OpenAI-Provider, ACP-Konversationsbindungen oder andere
Harnesses.

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

Die Thread-App-Konfiguration wird berechnet, wenn OpenClaw eine
Codex-Harness-Sitzung einrichtet oder eine veraltete Codex-Thread-Bindung ersetzt;
sie wird nicht bei jedem Turn neu berechnet. Verwenden Sie nach einer Änderung von
`codexPlugins` `/new`, `/reset` oder starten Sie das Gateway neu, damit künftige
Codex-Harness-Sitzungen mit dem aktualisierten App-Satz beginnen.

Informationen zur Migrationseignung, zum App-Inventar, zu Richtlinien für
destruktive Aktionen, zu Abfragen und zur Diagnose nativer Plugins finden Sie
unter [Native Codex-Plugins](/de/plugins/codex-native-plugins).

Der app- und pluginseitige Zugriff bei OpenAI wird durch das angemeldete
Codex-Konto und bei Business- und Enterprise/Edu-Workspaces durch die
App-Steuerung des Workspaces kontrolliert. Unter
[Codex mit Ihrem ChatGPT-Tarif verwenden](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
finden Sie eine Übersicht von OpenAI zu Konto- und Workspace-Steuerungen.

## Computernutzung

Für die Computernutzung gibt es eine eigene Einrichtungsanleitung:
[Codex-Computernutzung](/de/plugins/codex-computer-use).

Kurzfassung: OpenClaw bündelt die App zur Desktop-Steuerung nicht und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor, überprüft,
ob der MCP-Server `computer-use` verfügbar ist, und überlässt Codex anschließend
die nativen MCP-Tool-Aufrufe während Turns im Codex-Modus.

## Runtime-Grenzen

Das Codex-Harness ändert nur den eingebetteten Agent-Ausführer auf niedriger Ebene.

- Dynamische OpenClaw-Tools werden unterstützt. Codex fordert OpenClaw zur
  Ausführung dieser Tools auf, sodass OpenClaw Teil des Ausführungspfads bleibt.
- Codex-native Shell-, Patch-, MCP- und native App-Tools gehören zu Codex.
  OpenClaw kann ausgewählte native Ereignisse über das unterstützte Relay
  beobachten oder blockieren, schreibt die Argumente nativer Tools jedoch nicht um.
- Codex ist für native Compaction zuständig. OpenClaw führt eine
  Transkriptspiegelung für den Kanalverlauf, die Suche, `/new`, `/reset` und
  künftige Modell- oder Harness-Wechsel, ersetzt die Codex-Compaction jedoch nicht
  durch einen OpenClaw- oder Kontext-Engine-Zusammenfasser.
- Medienerzeugung, Medienanalyse, TTS, Genehmigungen und Ausgaben von
  Messaging-Tools laufen weiterhin über die entsprechenden
  OpenClaw-Provider-/Modelleinstellungen.
- `tool_result_persist` gilt für OpenClaw-eigene Tool-Ergebnisse im Transkript,
  nicht für Codex-native Tool-Ergebnisdatensätze.

Informationen zu Hook-Ebenen, unterstützten V1-Oberflächen, der Verarbeitung
nativer Berechtigungen, Warteschlangensteuerung, den Mechanismen zum Hochladen von
Codex-Feedback und Details zur Compaction finden Sie unter
[Codex-Harness-Runtime](/de/plugins/codex-harness-runtime).

## Fehlerbehebung

**Codex erscheint nicht als normaler `/model`-Provider:** Dies ist bei neuen
Konfigurationen zu erwarten. Wählen Sie ein Modell vom Typ `openai/gpt-*`,
aktivieren Sie `plugins.entries.codex.enabled` und prüfen Sie, ob `plugins.allow`
`codex` ausschließt.

**OpenClaw verwendet statt Codex das integrierte Harness:** Stellen Sie sicher,
dass die effektive Route exakt eine offizielle HTTPS-Route für Platform Responses
oder ChatGPT Responses ist, keine selbst definierte Anfrageüberschreibung enthält
und das Codex-Plugin installiert und aktiviert ist. Das Präfix `openai/gpt-*`
allein reicht nicht aus. Legen Sie für einen strikten Nachweis während des Testens
beim Provider oder Modell `agentRuntime.id: "codex"` fest; erzwungenes Codex
schlägt fehl, statt auf einen Fallback zurückzugreifen, wenn Route oder Harness
inkompatibel sind.

**Die OpenAI-Codex-Runtime fällt auf den API-Schlüsselpfad zurück:** Erfassen Sie
einen geschwärzten Gateway-Auszug, der Modell, Runtime, ausgewählten Provider und
Fehler zeigt. Bitten Sie betroffene Mitwirkende, diesen schreibgeschützten Befehl
auf ihrem OpenClaw-Host auszuführen:

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

Nützliche Auszüge enthalten üblicherweise `openai/gpt-5.6-sol` oder
`openai/gpt-5.6-luna`, `Runtime: OpenAI Codex`, `agentRuntime.id` oder
`harnessRuntime`, `candidateProvider: "openai"` sowie ein Ergebnis vom Typ `401`,
`Incorrect API key` oder `No API key`. Eine korrigierte Ausführung sollte den
OpenAI-OAuth-Pfad statt eines einfachen Fehlers mit dem OpenAI-API-Schlüssel zeigen.

**Konfiguration mit veralteten Codex-Modellreferenzen ist noch vorhanden:**
Führen Sie `openclaw doctor --fix` aus. Doctor schreibt veraltete
Modellreferenzen in `openai/*` um, entfernt veraltete Runtime-Festlegungen für
Sitzungen und den gesamten Agent und behält bestehende Überschreibungen von
Authentifizierungsprofilen bei.

**Der App-Server wird abgelehnt:** Verwenden Sie Codex-App-Server `0.143.0` oder
neuer. Vorabversionen derselben Version oder Versionen mit Build-Suffix wie
`0.143.0-alpha.2` oder `0.143.0+custom` werden abgelehnt, weil OpenClaw die stabile
Protokolluntergrenze `0.143.0` prüft.

**`/codex status` kann keine Verbindung herstellen:** Prüfen Sie, ob das
`codex`-Plugin aktiviert ist, ob `plugins.allow` es einschließt, wenn eine
Positivliste konfiguriert ist, und ob benutzerdefinierte Werte für
`appServer.command`, `url`, `authToken` oder Header gültig sind.

**Die Modellerkennung ist langsam:** Verringern Sie
`plugins.entries.codex.config.discovery.timeoutMs` oder deaktivieren Sie die
Erkennung. Siehe
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference#model-discovery).

**Der WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`,
`authToken`, die Header und ob der entfernte App-Server dieselbe Version des
Codex-App-Server-Protokolls verwendet.

**Native Shell- oder Patch-Tools werden mit `Native hook relay
unavailable` blockiert:** Der Codex-Thread versucht weiterhin, eine native Hook-Relay-
ID zu verwenden, die bei OpenClaw nicht mehr registriert ist. Dies ist ein
Transportproblem des nativen Codex-Hooks und kein Fehler des ACP-Backends,
Providers, von GitHub oder eines Shell-Befehls. Starten Sie im betroffenen Chat
mit `/new` oder `/reset` eine neue Sitzung und versuchen Sie anschließend erneut
einen unbedenklichen Befehl. Wenn dies einmal funktioniert, der nächste native
Tool-Aufruf jedoch erneut fehlschlägt, betrachten Sie `/new` nur als
vorübergehende Problemumgehung: Kopieren Sie den Prompt in eine neue Sitzung,
nachdem Sie den Codex-App-Server oder das OpenClaw Gateway neu gestartet haben,
damit alte Threads verworfen und native Hook-Registrierungen neu erstellt werden.

**Ein Nicht-Codex-Modell verwendet das integrierte Harness:** Dies ist zu
erwarten, sofern die Laufzeitrichtlinie des Providers oder Modells es nicht an
ein anderes Harness weiterleitet. Einfache Provider-Referenzen, die nicht zu
OpenAI gehören, verbleiben im Modus `auto` auf ihrem normalen Provider-Pfad.

**Computer Use ist installiert, aber die Tools werden nicht ausgeführt:**
Prüfen Sie `/codex computer-use status` in einer neuen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie die oben beschriebene
Wiederherstellung des nativen Hook-Relays. Siehe
[Codex Computer Use](/de/plugins/codex-computer-use#troubleshooting).

## Verwandte Themen

- [Referenz zum Codex-Harness](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Codex-Überwachung](/plugins/codex-supervision)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex Computer Use](/de/plugins/codex-computer-use)
- [Agent-Laufzeiten](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Hilfe zu OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Plugin-Hooks](/de/plugins/hooks)
- [Diagnosedaten exportieren](/de/gateway/diagnostics)
- [Status](/de/cli/status)
- [Tests](/de/help/testing-live#live-codex-app-server-harness-smoke)
