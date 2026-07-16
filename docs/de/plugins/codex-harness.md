---
read_when:
    - Sie möchten das offizielle Codex-App-Server-Harness verwenden
    - Sie benötigen Beispiele für die Codex-Harness-Konfiguration
    - Sie möchten, dass reine Codex-Bereitstellungen fehlschlagen, statt auf OpenClaw zurückzufallen
summary: Führen Sie eingebettete OpenClaw-Agenteninteraktionen über das offizielle Codex-App-Server-Testsystem aus
title: Codex-Harness
x-i18n:
    generated_at: "2026-07-16T13:14:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f27d934036ca6952ec12bbda3d275d08701a38ac9c79df37fc6040f01b529cd
    source_path: plugins/codex-harness.md
    workflow: 16
---

Das offizielle Plugin `codex` führt eingebettete OpenAI-Agent-Durchläufe über den Codex
app-server statt über das integrierte OpenClaw-Harness aus. Codex verwaltet die
Low-Level-Agent-Sitzung: native Thread-Fortsetzung, native Tool-Fortsetzung,
native Compaction und app-server-Ausführung. OpenClaw verwaltet weiterhin
Chatkanäle, Sitzungsdateien, Modellauswahl, dynamische OpenClaw-Tools, Genehmigungen,
Medienzustellung und die sichtbare Transkriptspiegelung.

Verwenden Sie kanonische OpenAI-Modellreferenzen wie `openai/gpt-5.6-sol`. Konfigurieren Sie keine
veralteten Codex-GPT-Referenzen; legen Sie die Reihenfolge der OpenAI-Agent-Authentifizierung unter `auth.order.openai` ab.
Veraltete Codex-Authentifizierungsprofil-IDs und veraltete Einträge der Codex-Authentifizierungsreihenfolge werden
durch `openclaw doctor --fix` repariert.

Wenn die Provider-/Modell-Laufzeitrichtlinie nicht festgelegt oder auf `auto` gesetzt ist, wählt das Präfix `openai/*` allein
dieses Harness niemals aus. OpenAI darf Codex nur für eine
exakte offizielle HTTPS-Route für Platform Responses oder ChatGPT Responses ohne
benutzerdefinierte Anfrageüberschreibung implizit auswählen. Siehe
[Implizite OpenAI-Agent-Laufzeit](/de/providers/openai#implicit-agent-runtime).
Wenn Codex die Authentifizierung verwaltet, bevor das Routing zwischen Platform und ChatGPT bekannt ist, verlangt OpenClaw
weiterhin, dass jede mögliche Route Codex-Kompatibilität deklariert. Die native
Verwaltung der Authentifizierung allein umgeht diese Routenprüfung niemals.

Wenn keine OpenClaw-Sandbox aktiv ist, startet OpenClaw Codex-app-server-Threads
mit aktiviertem nativen Codemodus von Codex (der reine Codemodus bleibt standardmäßig deaktiviert), sodass
native Workspace-/Code-Funktionen neben dynamischen OpenClaw-Tools verfügbar bleiben,
die über die app-server-Brücke `item/tool/call` geleitet werden. Eine
aktive OpenClaw-Sandbox oder eingeschränkte Tool-Richtlinie deaktiviert den nativen Codemodus
vollständig, sofern Sie nicht den experimentellen Sandbox-exec-server-Pfad aktivieren.

Mit der Standardeinstellung `tools.exec.host: "auto"` und ohne aktive OpenClaw-Sandbox
erhält Codex außerdem die Tools `node_exec` und `node_process` für Befehle auf gekoppelten
Nodes. Die native Shell verbleibt auf dem Host und im Workspace des Codex-app-server
(bei der standardmäßigen stdio-Bereitstellung Gateway-lokal); `node_exec` wählt eine Node anhand
ihres Namens oder ihrer ID aus und behält die Node-Genehmigungsrichtlinie von OpenClaw bei. Wenn eine endliche
Laufzeit-Zulassungsliste den nativen Codemodus deaktiviert und für den Durchlauf keine
Ausführungsumgebung verbleibt, hält OpenClaw stattdessen seine richtliniengefilterten Tools `exec` und `process`
für die direkte Ausführung ohne Sandbox verfügbar.

Diese Codex-native Funktion ist unabhängig vom
[OpenClaw-Codemodus](/de/reference/code-mode), einer optionalen QuickJS-WASI-Laufzeit
für allgemeine OpenClaw-Durchläufe mit einer anderen Eingabeform für `exec`. Informationen zur
allgemeineren Aufteilung von Modell, Provider und Laufzeit finden Sie zunächst unter
[Agent-Laufzeiten](/de/concepts/agent-runtimes): `openai/gpt-5.6-sol` ist die Modellreferenz,
`codex` ist die Laufzeit und Telegram, Discord, Slack oder ein anderer
Kanal ist die Kommunikationsoberfläche.

## Anforderungen

- Das offizielle Plugin `@openclaw/codex` muss installiert sein. Nehmen Sie `codex` in
  `plugins.allow` auf, wenn Ihre Konfiguration eine Zulassungsliste verwendet.
- Codex app-server `0.143.0` oder neuer. Das Plugin verwaltet standardmäßig eine kompatible
  Binärdatei, daher wirkt sich ein Befehl `codex` in `PATH` nicht auf den normalen
  Start aus.
- Codex-Authentifizierung über `openclaw models auth login --provider openai`, ein
  bereits im Codex-Home des Agenten vorhandenes app-server-Konto oder ein
  explizites Codex-API-Schlüssel-Authentifizierungsprofil.

Informationen zur Authentifizierungsrangfolge, Umgebungsisolierung, zu benutzerdefinierten app-server-Befehlen,
zur Modellerkennung und zur vollständigen Liste der Konfigurationsfelder finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Schnellstart

Installieren Sie das offizielle Plugin und melden Sie sich anschließend mit Codex OAuth an:

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

Aktivieren Sie das Plugin `codex` und wählen Sie ein OpenAI-Agent-Modell aus:

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

Wenn Ihre Konfiguration `plugins.allow` verwendet, fügen Sie dort auch `codex` hinzu:

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

Starten Sie das Gateway nach einer Änderung der Plugin-Konfiguration neu. Wenn ein Chat bereits über eine
Sitzung verfügt, führen Sie zuerst `/new` oder `/reset` aus, damit der nächste Durchlauf das Harness
anhand der aktuellen Konfiguration bestimmt.

## Threads mit Codex Desktop und der CLI teilen

Die Standardeinstellung `appServer.homeScope: "agent"` isoliert jeden OpenClaw-Agenten vom
nativen Codex-Zustand des Betreibers. Damit ein Eigentümer dieselben nativen Threads untersuchen und verwalten kann,
die von Codex Desktop und der Codex-CLI angezeigt werden, aktivieren Sie das
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

Der Benutzer-Home-Modus unterstützt einen lokal verwalteten stdio-Prozess oder den gemeinsam genutzten Unix-Socket-
Transport. Er verwendet `$CODEX_HOME`, wenn dies festgelegt ist, andernfalls `~/.codex`, einschließlich
der nativen Codex-Authentifizierung, Konfiguration, Plugins und des Thread-Speichers dieses Home-Verzeichnisses. OpenClaw
schleust kein OpenClaw-Authentifizierungsprofil in diesen app-server ein.

Durchläufe des Eigentümers erhalten das Tool `codex_threads`: native Threads auflisten, durchsuchen, lesen, verzweigen, umbenennen,
archivieren und wiederherstellen. Verzweigen Sie einen Thread, um ihn in
OpenClaw fortzusetzen; die Verzweigung wird an die aktuelle OpenClaw-Sitzung angehängt und bleibt
für andere native Codex-Clients sichtbar. Die Archivierung erfordert die ausdrückliche
Bestätigung, dass der Thread an anderer Stelle geschlossen ist. Wenn die Überwachung ebenfalls
aktiviert ist, erfordern Transkriptfelder und Änderungen die entsprechende Aktivierung von
`supervision.allowRawTranscripts` oder `supervision.allowWriteControls`.

Setzen Sie denselben Thread nicht gleichzeitig über unabhängige verwaltete
stdio-App-Server fort und schreiben Sie nicht gleichzeitig darauf. Codex koordiniert aktive Schreibvorgänge innerhalb eines App Servers, nicht
über separate Prozesse hinweg. Das Verzweigen ist der sichere Koexistenzpfad für gewöhnliche
stdio-Sitzungen im Benutzer-Home.

`appServer.homeScope: "user"` allein steuert den Flottenkatalog nicht. Die native
Sitzungserkennung ist aktiviert, solange das Plugin aktiv ist; setzen Sie
`sessionCatalog.enabled: false`, um sie aus der OpenClaw-Seitenleiste zu entfernen, ohne
Codex zu deaktivieren. Der Katalog verwendet eine separate Überwachungsverbindung; ohne
explizite Verbindungseinstellungen für `appServer` verwendet diese Verbindung standardmäßig verwaltetes
stdio im Benutzer-Home, während das gewöhnliche Harness agentenspezifisch bleibt. Explizite
Einstellungen für `appServer` werden von beiden Pfaden berücksichtigt. Setzen Sie `homeScope: "user"`
wie oben explizit, wenn auch das gewöhnliche Harness den nativen Zustand teilen soll.

## Codex-Sitzungen überwachen

Dasselbe Plugin `codex` kann nicht archivierte Codex-Sitzungen auf dem Gateway-
Computer und auf ausdrücklich aktivierten gekoppelten Nodes auflisten. Eine gespeicherte oder inaktive Gateway-lokale Sitzung kann
einen modellgebundenen Chat erstellen, der ihren begrenzten persistierten Verlauf von Benutzer und Assistent
spiegelt. Seine private Bindung verwendet die Überwachungsverbindung für den nativen
Snapshot, den kanonischen Branch und spätere Durchläufe, während gewöhnliche Codex-Sitzungen
agentenspezifisch bleiben. Der erste kanonische Start verwendet exakt das Modell und den Provider, die
Codex für die Snapshot-Verzweigung zurückgibt. Bei späteren Fortsetzungen wird die Auswahl der nativen
Codex-Konfiguration überlassen; das äußere OpenClaw-Modell und die Fallback-Kette ersetzen
sie niemals. Gespeicherte und inaktive Zeilen können nach ausdrücklicher Bestätigung, dass kein anderer Runner aktiv ist,
archiviert werden. Aktive Quellen können weder einen Branch erstellen noch archiviert werden; ein vorhandener
überwachter Chat kann weiterhin geöffnet werden. Sitzungen gekoppelter Nodes bleiben reine Metadaten.

Unter [Codex-Sitzungen überwachen](/de/plugins/codex-supervision) finden Sie Informationen zur Einrichtung, zu Verzweigungsregeln,
Beschränkungen gekoppelter Nodes, offengelegten Metadaten und zur Fehlerbehebung.

## Konfiguration

| Anforderung                                         | Einstellung                                                                                      | Ort                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Harness aktivieren                                  | `plugins.entries.codex.enabled: true`                                                            | OpenClaw-Konfiguration             |
| Native Codex-Sitzungserkennung ausblenden           | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Codex-Plugin-Konfiguration         |
| Installation eines zugelassenen Plugins beibehalten | `codex` in `plugins.allow` aufnehmen                                                  | OpenClaw-Konfiguration             |
| Geeigneten OpenAI-Durchläufen die implizite Verwendung von Codex erlauben | Exakte offizielle HTTPS-Responses-/ChatGPT-Route, keine benutzerdefinierte Anfrageüberschreibung, Laufzeit nicht festgelegt/`auto` | OpenAI-Provider-/Modellkonfiguration |
| Mit ChatGPT-/Codex-OAuth anmelden                   | `openclaw models auth login --provider openai`                                                   | CLI-Authentifizierungsprofil       |
| API-Schlüssel-Reserve für Codex-Durchläufe hinzufügen | `openai:*`-API-Schlüsselprofil, das nach der Abonnementauthentifizierung in `auth.order.openai` aufgeführt ist | CLI-Authentifizierungsprofil + OpenClaw-Konfiguration |
| Bei Nichtverfügbarkeit von Codex geschlossen fehlschlagen | Provider oder Modell `agentRuntime.id: "codex"`                                                   | OpenClaw-Modell-/Provider-Konfiguration |
| Direkten OpenAI-API-Datenverkehr verwenden          | Provider oder Modell `agentRuntime.id: "openclaw"` mit normaler OpenAI-Authentifizierung                    | OpenClaw-Modell-/Provider-Konfiguration |
| Verhalten des app-server abstimmen                  | `plugins.entries.codex.config.appServer.*`                                                       | Codex-Plugin-Konfiguration         |
| Native Codex-Plugin-Apps aktivieren                 | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex-Plugin-Konfiguration         |
| Codex Computer Use aktivieren                       | `plugins.entries.codex.config.computerUse.*`                                                     | Codex-Plugin-Konfiguration         |

Bevorzugen Sie `auth.order.openai` für eine Reihenfolge mit Abonnementauthentifizierung zuerst und API-Schlüssel als Reserve.
Vorhandene veraltete Codex-Authentifizierungsprofil-IDs und die veraltete Codex-Authentifizierungsreihenfolge sind
veralteter Zustand, der ausschließlich durch Doctor verwaltet wird; schreiben Sie keine neuen veralteten Codex-GPT-Referenzen.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Bei einer effektiv Codex-kompatiblen Route bleiben beide Profile oben Kandidaten
für denselben Codex-Durchlauf. Die Profilreihenfolge wählt die Zugangsdaten aus, nicht die Laufzeit.
Eine Änderung der Authentifizierungsreihenfolge macht eine benutzerdefinierte, Completions-, HTTP- oder
anfrageüberschriebene Route nicht Codex-kompatibel.

### Compaction

Setzen Sie `compaction.model` oder `compaction.provider` nicht für Codex-basierte
Agenten. Codex führt Compaction über seinen nativen app-server-Thread-Zustand aus, daher
ignoriert OpenClaw diese lokalen Überschreibungen des Zusammenfassungsmoduls zur Laufzeit, und
`openclaw doctor --fix` entfernt sie, wenn der Agent Codex verwendet.

Lossless wird weiterhin als Kontext-Engine für Zusammenstellung, Aufnahme und
Wartung rund um Codex-Durchläufe unterstützt und über
`plugins.slots.contextEngine: "lossless-claw"` und
`plugins.entries.lossless-claw.config.summaryModel` konfiguriert, nicht über
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migriert die
alte Form `compaction.provider: "lossless-claw"` in den Lossless-
Kontext-Engine-Slot, wenn Codex die aktive Laufzeit ist, die native Codex-Compaction bleibt jedoch
unter der Kontrolle von Codex. Das native app-server-Harness unterstützt Kontext-Engines,
die eine Zusammenstellung vor dem Prompt benötigen; generische CLI-Backends, einschließlich `codex-cli`,
stellen diese Host-Funktion nicht bereit.

Für Codex-basierte Agenten startet `/compact` die native Codex-app-server-
Compaction auf dem gebundenen Thread. OpenClaw wartet nicht auf den Abschluss,
erzwingt kein OpenClaw-Zeitlimit, startet den gemeinsam genutzten app-server nicht neu und weicht nicht auf eine
Kontext-Engine oder ein öffentliches OpenAI-Zusammenfassungsmodul aus. Wenn die native Codex-Thread-
Bindung fehlt oder veraltet ist, schlägt der Befehl geschlossen fehl, statt stillschweigend
das Compaction-Backend zu wechseln.

Der Rest dieser Seite behandelt die Bereitstellungsform, geschlossenes Fehlschlagen beim Routing, die Genehmigungsrichtlinie
des Guardians, native Codex-Plugins und Computer Use. Vollständige Listen der Optionen,
Standardeinstellungen, Enums, Erkennung, Umgebungsisolierung, Zeitlimits und
app-server-Transportfelder finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Codex-Laufzeit überprüfen

Verwenden Sie `/status` in dem Chat, in dem Sie Codex erwarten. Ein von Codex unterstützter OpenAI-Agentenlauf zeigt:

```text
Laufzeit: OpenAI Codex
```

Prüfen Sie anschließend den Zustand des Codex-App-Servers:

```text
/codex status
/codex models
```

`/codex status` meldet App-Server-Verbindung, Konto, Ratenlimits, MCP-Server und Skills. `/codex models` listet den aktuellen Codex-App-Server-Katalog für das Harness und das Konto auf. Wenn `/status` unerwartet ist, lesen Sie die
[Fehlerbehebung](#troubleshooting).

## Routing und Modellauswahl

Halten Sie Provider-Referenzen und Laufzeitrichtlinien getrennt:

- Verwenden Sie `openai/gpt-*` für die kanonische OpenAI-Modellauswahl. Das Präfix allein
  wählt Codex niemals aus.
- Wenn die Laufzeit nicht festgelegt oder auf `auto` gesetzt ist, kann nur eine exakt passende offizielle HTTPS-Platform-Responses-
  oder ChatGPT-Responses-Route ohne selbst definierte Anfrageüberschreibung Codex
  implizit auswählen.
- Verwenden Sie keine veralteten Codex-GPT-Referenzen in der Konfiguration; führen Sie `openclaw doctor --fix` aus, um
  veraltete Referenzen und überholte Sitzungs-Routenbindungen zu reparieren.
- `agentRuntime.id: "codex"` macht Codex für eine
  kompatible Route zu einer ausfallsicheren Pflichtanforderung. Dadurch wird eine tatsächlich inkompatible Route nicht kompatibel.
- `agentRuntime.id: "openclaw"` legt fest, dass ein Provider oder Modell die eingebettete
  OpenClaw-Laufzeit verwendet, wenn dies beabsichtigt ist.
- `/codex ...` steuert native Codex-App-Server-Konversationen aus dem Chat.
- ACP/acpx ist ein separater externer Harness-Pfad. Verwenden Sie ihn nur, wenn ACP/acpx oder ein externer Harness-Adapter angefordert wird.

| Benutzerabsicht                                             | Verwenden                                                                                              |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Aktuellen Chat anhängen                                    | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| Einen vorhandenen Codex-Thread fortsetzen                  | `/codex resume <thread-id>`                                                                           |
| Codex-Threads auflisten oder filtern                        | `/codex threads [filter]`                                                                             |
| Native Codex-Plugins auflisten                             | `/codex plugins list`                                                                                 |
| Ein konfiguriertes natives Codex-Plugin aktivieren oder deaktivieren | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Eine gespeicherte Codex-CLI-Sitzung als gekoppelten Node-Lauf fortsetzen | `/codex sessions --host <node> [filter]`, dann `/codex resume <session-id> --host <node> --bind here` |
| Nicht archivierte Codex-Sitzungen computerübergreifend anzeigen | Codex-Überwachung aktivieren und **Codex Sessions** öffnen                                              |
| Modell, Schnellmodus oder Berechtigungen des gebundenen Threads ändern | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| Aktiven Lauf stoppen oder steuern                          | `/codex stop`, `/codex steer <text>`                                                                  |
| Aktuelle Bindung lösen                                     | `/codex detach` (Alias `/codex unbind`)                                                               |
| Nur Codex-Feedback senden                                  | `/codex diagnostics [note]`                                                                           |
| Eine ACP/acpx-Aufgabe starten                              | ACP/acpx-Sitzungsbefehle, nicht `/codex`                                                               |

| Anwendungsfall                                  | Konfigurieren                                                                                                 | Überprüfen                              | Hinweise                                    |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Geeignete OpenAI-Route mit nativer Codex-Laufzeit | Exakte offizielle HTTPS-Responses-/ChatGPT-Route ohne selbst definierte Anfrageüberschreibung sowie aktiviertes `codex`-Plugin | `/status` zeigt `Runtime: OpenAI Codex` | Impliziter Pfad, wenn die Laufzeit nicht festgelegt/`auto` ist |
| Bei Nichtverfügbarkeit von Codex geschlossen fehlschlagen | Provider oder Modell `agentRuntime.id: "codex"`                                                                | Der Lauf schlägt fehl, statt auf die eingebettete Laufzeit zurückzufallen | Für reine Codex-Bereitstellungen verwenden |
| Direkter OpenAI-API-Schlüssel-Datenverkehr über OpenClaw | Provider oder Modell `agentRuntime.id: "openclaw"` und normale OpenAI-Authentifizierung                                      | `/status` zeigt die OpenClaw-Laufzeit        | Nur verwenden, wenn OpenClaw beabsichtigt ist |
| Veraltete Konfiguration                        | Veraltete Codex-GPT-Referenzen                                                                                       | `openclaw doctor --fix` schreibt sie um     | Neue Konfiguration nicht auf diese Weise erstellen |
| ACP/acpx-Codex-Adapter                          | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP-Aufgaben-/Sitzungsstatus            | Vom nativen Codex-Harness getrennt         |

`agents.defaults.imageModel` folgt derselben Präfixaufteilung. Verwenden Sie `openai/gpt-*`
für die normale OpenAI-Route und `codex/gpt-*` nur, wenn das Bildverständnis
über einen begrenzten Codex-App-Server-Lauf erfolgen soll. Doctor schreibt veraltete
Codex-GPT-Referenzen in `openai/gpt-*` um.

## Bereitstellungsmuster

### Grundlegende Codex-Bereitstellung

Verwenden Sie die Schnellstartkonfiguration für ein OpenAI-Modell, dessen tatsächlich verwendete offizielle HTTPS-
Route Codex implizit auswählen kann:

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

Behalten Sie Claude als Standard-Agenten bei und fügen Sie einen benannten Codex-Agenten hinzu:

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
App-Server, sofern seine tatsächlich verwendete OpenAI-Route kompatibel bleibt; fügen Sie eine explizite
modellspezifische Einstellung `agentRuntime.id: "codex"` hinzu, wenn dies eine ausfallsichere
Pflichtanforderung sein soll.

### Ausfallsichere Codex-Bereitstellung

Eine geeignete, exakt passende offizielle HTTPS-OpenAI-Route kann zu Codex aufgelöst werden, wenn das
gebündelte Plugin verfügbar ist. Fügen Sie für eine ausdrücklich festgelegte
ausfallsichere Regel eine explizite Laufzeitrichtlinie hinzu:

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

Wenn Codex erzwungen wird, schlägt OpenClaw frühzeitig fehl, falls die tatsächlich verwendete Route nicht als
Codex-kompatibel deklariert ist, das Plugin deaktiviert ist, der App-Server zu alt ist oder der
App-Server nicht gestartet werden kann.

## App-Server-Richtlinie

Standardmäßig startet das Plugin die von OpenClaw verwaltete Codex-Binärdatei lokal mit
stdio-Transport. Setzen Sie `appServer.command` nur, um absichtlich eine
andere ausführbare Datei auszuführen. Verwenden Sie den WebSocket-Transport nur, wenn bereits an anderer Stelle ein App-Server
ausgeführt wird:

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

Lokale stdio-App-Server-Sitzungen verwenden standardmäßig die Vertrauensstellung für lokale Operatoren:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Wenn lokale Codex-Anforderungen diese
implizite YOLO-Vertrauensstellung nicht zulassen, wählt OpenClaw stattdessen zulässige Guardian-Berechtigungen
aus. Wenn für die Sitzung eine OpenClaw-Sandbox aktiv ist, deaktiviert OpenClaw
für diesen Lauf den nativen Codex-Code-Modus, benutzereigene MCP-Server und die durch Apps unterstützte Plugin-
Ausführung, anstatt sich auf das hostseitige Sandboxing von Codex zu verlassen.
Der Shell-Zugriff erfolgt stattdessen über dynamische, von der OpenClaw-Sandbox unterstützte Tools wie
`sandbox_exec` und `sandbox_process`, sofern die normalen exec-/process-Tools
verfügbar sind.

Verwenden Sie den normalisierten OpenClaw-Ausführungsmodus für die native automatische Codex-Prüfung, bevor Sie
Sandbox-Ausnahmen oder zusätzliche Berechtigungen gewähren:

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

Für Codex-App-Server-Sitzungen wird `tools.exec.mode: "auto"` auf von Codex
Guardian geprüfte Genehmigungen abgebildet: üblicherweise `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"`, wenn
die lokalen Anforderungen diese Werte zulassen. In `tools.exec.mode: "auto"`
behält OpenClaw veraltete unsichere Codex-Überschreibungen `approvalPolicy: "never"` oder
`sandbox: "danger-full-access"` nicht bei; verwenden Sie `tools.exec.mode: "full"` für
eine beabsichtigte Codex-Vertrauensstellung ohne Genehmigungen. Die veraltete
Voreinstellung `plugins.entries.codex.config.appServer.mode: "guardian"` funktioniert weiterhin,
aber `tools.exec.mode: "auto"` ist die normalisierte OpenClaw-Oberfläche.

Den Vergleich auf Modusebene mit Host-Ausführungsgenehmigungen und ACPX-
Berechtigungen finden Sie unter [Berechtigungsmodi](/de/tools/permission-modes). Informationen zu allen
App-Server-Feldern, zur Authentifizierungsreihenfolge, zur Umgebungsisolierung und zum Timeout-Verhalten
finden Sie in der [Codex-Harness-Referenz](/de/plugins/codex-harness-reference).

## Befehle und Diagnose

Das Plugin `codex` registriert `/codex` als Slash-Befehl in jedem Kanal, der
OpenClaw-Textbefehle unterstützt.

Native Ausführung und Steuerung erfordern einen Eigentümer oder einen `operator.admin`-
Gateway-Client: Threads binden oder fortsetzen, Läufe senden oder stoppen,
Modell, Schnellmodus oder Berechtigungsstatus ändern, komprimieren oder prüfen sowie
eine Bindung lösen. Andere autorisierte Absender behalten schreibgeschützte Befehle zur Anzeige von Status, Hilfe,
Konto, Modellen, Threads, MCP-Servern, Skills und Bindungen.

Gängige Formen:

- `/codex status` prüft App-Server-Verbindung, Modelle, Konto, Ratenlimits,
  MCP-Server und Skills.
- `/codex models` listet aktuelle Codex-App-Server-Modelle auf.
- `/codex threads [filter]` listet die letzten Codex-App-Server-Threads auf.
- `/codex resume <thread-id>` hängt die aktuelle OpenClaw-Sitzung an einen
  vorhandenen Codex-Thread an.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`
  hängt den aktuellen Chat an.
- `/codex detach` (oder `/codex unbind`) löst die aktuelle Bindung.
- `/codex binding` beschreibt die aktuelle Bindung.
- `/codex stop` stoppt den aktiven Lauf; `/codex steer <text>` steuert ihn.
- `/codex model <model>`, `/codex fast [on|off|status]` und
  `/codex permissions [default|yolo|status]` ändern den konversationsbezogenen Zustand.
- `/codex compact` weist den Codex-App-Server an, den angehängten Thread zu komprimieren.
- `/codex review` startet die native Codex-Prüfung für den angehängten Thread.
- `/codex diagnostics [note]` fragt vor dem Senden von Codex-Feedback für den
  angehängten Thread nach.
- `/codex account` zeigt Konto- und Ratenlimitstatus an.
- `/codex mcp` listet den Status der Codex-App-Server-MCP-Server auf.
- `/codex skills` listet die Skills des Codex-App-Servers auf.
- `/codex plugins list`, `/codex plugins enable <name>` und
  `/codex plugins disable <name>` verwalten konfigurierte native Codex-Plugins.
- `/codex computer-use [status|install]` verwaltet Codex Computer Use.
- `/codex help` listet den vollständigen Befehlsbaum auf.

Für die meisten Supportmeldungen beginnen Sie mit `/diagnostics [note]` in der
Konversation, in der der Fehler aufgetreten ist. Dadurch wird ein einzelner
Gateway-Diagnosebericht erstellt und bei Codex-Harness-Sitzungen um die
Genehmigung zum Senden des relevanten Codex-Feedbackpakets gebeten. Weitere
Informationen zum Datenschutzmodell und zum Verhalten in Gruppenchats finden
Sie unter [Diagnoseexport](/de/gateway/diagnostics). Verwenden Sie
`/codex diagnostics [note]` nur, wenn Sie ausdrücklich das Codex-Feedback für den
aktuell angehängten Thread hochladen möchten, ohne das vollständige
Gateway-Diagnosepaket einzuschließen.

### Codex-Threads lokal untersuchen

Die schnellste Möglichkeit, einen fehlerhaften Codex-Lauf zu untersuchen,
besteht häufig darin, den nativen Codex-Thread direkt zu öffnen:

```bash
codex resume <thread-id>
```

Entnehmen Sie die Thread-ID der abgeschlossenen Antwort
`/diagnostics`, `/codex binding` oder `/codex threads [filter]`.

Informationen zum Upload-Mechanismus und zu Diagnosegrenzen auf
Laufzeitebene finden Sie unter
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime#codex-feedback-upload).

### Authentifizierungsreihenfolge

Im standardmäßigen agentenspezifischen Home-Verzeichnis wird die
Authentifizierung in dieser Reihenfolge ausgewählt:

1. Geordnete OpenAI-Authentifizierungsprofile für den Agenten,
   vorzugsweise unter `auth.order.openai`. Führen Sie
   `openclaw doctor --fix` aus, um ältere Legacy-IDs von
   Codex-Authentifizierungsprofilen und die Legacy-Reihenfolge der
   Codex-Authentifizierung zu migrieren.
2. Das bestehende Konto des App-Servers im Codex-Home-Verzeichnis
   dieses Agenten.
3. Nur beim lokalen Start des stdio-App-Servers:
   `CODEX_API_KEY`, danach `OPENAI_API_KEY`, wenn kein
   App-Server-Konto vorhanden ist und weiterhin eine OpenAI-Authentifizierung
   erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines
ChatGPT-Abonnements erkennt, entfernt es `CODEX_API_KEY` und
`OPENAI_API_KEY` aus dem gestarteten Codex-Kindprozess. Dadurch bleiben
API-Schlüssel auf Gateway-Ebene für Einbettungen oder direkte OpenAI-Modelle
verfügbar, ohne dass native Codex-App-Server-Turns versehentlich über die API
abgerechnet werden. Explizite Codex-API-Schlüsselprofile und der lokale
Fallback auf stdio-Umgebungsvariablenschlüssel verwenden die Anmeldung am
App-Server statt der geerbten Umgebung des Kindprozesses.
WebSocket-App-Server-Verbindungen erhalten keinen Fallback auf
Gateway-API-Schlüssel aus der Umgebung. Verwenden Sie ein explizites
Authentifizierungsprofil oder das eigene Konto des entfernten App-Servers.

Wenn ein Abonnementprofil ein Codex-Nutzungslimit erreicht, zeichnet
OpenClaw die Rücksetzzeit auf, sofern Codex eine meldet, und versucht für
denselben Codex-Lauf das nächste geordnete Authentifizierungsprofil. Nach
Ablauf der Rücksetzzeit kann das Abonnementprofil wieder verwendet werden,
ohne dass das ausgewählte Modell `openai/gpt-*` oder die Codex-Laufzeit
geändert wird.

Wenn native Codex-Plugins konfiguriert sind, installiert oder aktualisiert
OpenClaw diese Plugins über den verbundenen App-Server, bevor
Plugin-eigene Apps für den Codex-Thread verfügbar gemacht werden.
`app/list` bleibt die maßgebliche Quelle für App-IDs,
Zugänglichkeit und Metadaten, aber OpenClaw entscheidet über die Aktivierung
pro Thread: Wenn die Richtlinie eine aufgeführte zugängliche App zulässt,
sendet OpenClaw `thread/start.config.apps[appId].enabled = true`, selbst wenn
`app/list` diese App derzeit als deaktiviert meldet. Dieser Pfad
erfindet keine App-Installation für unbekannte IDs. OpenClaw aktiviert nur
Marketplace-Plugins mit `plugin/install` und aktualisiert anschließend
den Bestand.

### Isolierung der Umgebung

Beim lokalen Start des stdio-App-Servers setzt OpenClaw
`CODEX_HOME` auf ein agentenspezifisches Verzeichnis, damit
Codex-Konfiguration, Authentifizierungs-/Kontodateien,
Plugin-Cache/-Daten und der native Thread-Status standardmäßig nicht aus dem
persönlichen `~/.codex` des Betreibers gelesen oder dorthin
geschrieben werden. OpenClaw behält den normalen Prozesswert
`HOME` bei. Unterprozesse von Codex-Läufen können daher
weiterhin Konfigurationen und Token im Benutzer-Home finden, und Codex kann
gemeinsam genutzte Einträge in `$HOME/.agents/skills` und
`$HOME/.agents/plugins/marketplace.json` erkennen. Mit `appServer.homeScope: "user"` verwendet OpenClaw
stattdessen das native Codex-Home des Benutzers und dessen bestehendes
Konto, ohne ein OpenClaw-Authentifizierungsprofil einzufügen.

Wenn eine Bereitstellung eine zusätzliche Isolierung der Umgebung
erfordert, fügen Sie diese Variablen zu `appServer.clearEnv` hinzu:

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

`appServer.clearEnv` wirkt sich nur auf den gestarteten
Codex-App-Server-Kindprozess aus. OpenClaw entfernt
`CODEX_HOME` und `HOME` während der Normalisierung des
lokalen Starts aus dieser Liste: `CODEX_HOME` verweist weiterhin auf
den ausgewählten Agenten- oder Benutzerbereich, und
`HOME` wird weiterhin vererbt, damit Unterprozesse den normalen
Status im Benutzer-Home verwenden können.

### Dynamische Tools und Websuche

Für dynamische Codex-Tools wird standardmäßig das Laden über
`searchable` verwendet. OpenClaw stellt dynamische Tools, die native
Codex-Arbeitsbereichsoperationen duplizieren, normalerweise nicht bereit:
`read`, `write`, `edit`,
`apply_patch`, `exec`, `process`,
`update_plan`, `tool_call`, `tool_describe`,
`tool_search` und `tool_search_code`. Die meisten verbleibenden
OpenClaw-Integrationstools, etwa für Nachrichten, Medien, Cron, Browser,
Nodes, Gateway und `heartbeat_respond`, sind über die Codex-Toolsuche im
Namespace `openclaw` verfügbar, wodurch der anfängliche
Modellkontext kleiner bleibt. Der Shell-Fallback für eingeschränkte Turns
bildet eine Ausnahme für `exec` und `process`, wenn
eine endliche Zulassungsliste den nativen Codemodus deaktiviert.
Laufzeit-Zulassungslisten und `codexDynamicToolsExclude` gelten weiterhin.

Als `catalogMode: "direct-only"` markierte Tools, einschließlich des
OpenClaw-Tools `computer`, verwenden stattdessen den Namespace
`openclaw_direct`. Codex behandelt diesen Namespace als
`DirectModelOnly`, sodass diese Tools in normalen und ausschließlich im
Codemodus ausgeführten Threads direkt für das Modell sichtbar bleiben,
anstatt verschachtelte Codemodus-Aufrufe von `tools.*` zu
durchlaufen.

Wenn die Suche aktiviert und kein verwalteter Provider ausgewählt ist,
verwendet die Websuche standardmäßig das von Codex gehostete Tool
`web_search`. Die native gehostete Suche und das verwaltete
dynamische Tool `web_search` von OpenClaw schließen sich gegenseitig
aus, damit die verwaltete Suche native Domaineinschränkungen nicht umgehen
kann. OpenClaw verwendet das verwaltete Tool, wenn die gehostete Suche
nicht verfügbar oder ausdrücklich deaktiviert ist oder durch einen
ausgewählten verwalteten Provider ersetzt wird. OpenClaw lässt die
eigenständige Codex-Erweiterung `web.run` deaktiviert, da der
App-Server-Datenverkehr in der Produktion ihren benutzerdefinierten
Namespace `web` ablehnt. `tools.web.search.enabled: false` deaktiviert beide
Pfade; dies gilt ebenso für reine LLM-Läufe mit deaktivierten Tools. Codex
behandelt `"cached"` als Präferenz und löst sie für
uneingeschränkte App-Server-Turns in einen aktiven externen Zugriff auf.
Der automatische verwaltete Fallback schlägt geschlossen fehl, wenn native
`allowedDomains` festgelegt sind, damit die Zulassungsliste nicht
umgangen werden kann. Dauerhafte Änderungen der effektiven Suchrichtlinie
rotieren den gebundenen Codex-Thread vor dem nächsten Turn. Vorübergehende
Einschränkungen pro Turn verwenden einen temporären eingeschränkten Thread
und behalten die bestehende Bindung für eine spätere Fortsetzung bei.

`sessions_yield` und reine Antworten aus Quellen des Nachrichtentools
bleiben direkt, da sie Verträge zur Turn-Steuerung darstellen.
`sessions_spawn` bleibt durchsuchbar, sodass der native
`spawn_agent` von Codex die primäre Codex-Subagentenoberfläche bleibt,
während eine explizite Delegation an OpenClaw oder ACP weiterhin über den
Namespace des dynamischen Tools `openclaw` verfügbar ist.
Anweisungen für die Heartbeat-Zusammenarbeit weisen Codex an, vor dem
Beenden eines Heartbeat-Turns nach `heartbeat_respond` zu suchen, wenn das
Tool noch nicht geladen ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu einem
benutzerdefinierten Codex-App-Server herstellen, der zurückgestellte
dynamische Tools nicht durchsuchen kann, oder wenn Sie die vollständige
Tool-Nutzlast debuggen.

### Konfigurationsfelder

Unterstützte Codex-Plugin-Felder auf oberster Ebene:

| Feld                       | Standardwert   | Bedeutung                                                                                |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Toolkontext aufzunehmen. |
| `codexDynamicToolsExclude` | `[]`           | Zusätzliche Namen dynamischer OpenClaw-Tools, die bei Codex-App-Server-Turns ausgelassen werden sollen. |
| `codexPlugins`             | deaktiviert    | Native Unterstützung für Codex-Plugins/-Apps für migrierte, aus dem Quellcode installierte kuratierte Plugins. |
| `sessionCatalog`           | aktiviert      | Erkennung in der Seitenleiste für native Codex-Sitzungen auf diesem Gateway und geeigneten gekoppelten Nodes. |
| `supervision`              | deaktiviert    | Agentenseitige Richtlinie für Transkripte und Schreibsteuerung nativer Sitzungen.         |

Unterstützte Felder von `appServer`:

| Feld                                          | Standardwert                                            | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` startet Codex; ein explizites `"unix"` stellt eine Verbindung zum lokalen Steuerungs-Socket her; `"websocket"` stellt eine Verbindung zu `url` her.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isoliert den gewöhnlichen Harness-Zustand je OpenClaw-Agent. `"user"` ist eine explizite Opt-in-Option, die `$CODEX_HOME` oder `~/.codex` nativ gemeinsam nutzt, die native Authentifizierung verwendet und die Thread-Verwaltung ausschließlich durch den Eigentümer ermöglicht. Der Benutzerbereich unterstützt lokales stdio oder Unix-Transport. Für die separate Überwachungsverbindung wird ein nicht gesetzter Wert bei stdio oder Unix in `"user"` und bei WebSocket in `"agent"` aufgelöst.     |
| `command`                                     | verwaltete Codex-Binärdatei                            | Ausführbare Datei für den stdio-Transport. Lassen Sie den Wert nicht gesetzt, um die verwaltete Binärdatei zu verwenden; setzen Sie ihn nur für eine explizite Überschreibung.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumente für den stdio-Transport.                                                                                                                                                                                                                                                                                                                                                               |
| `url`                                         | nicht gesetzt                                          | WebSocket-App-Server-URL oder `unix://`-URL. Ein expliziter leerer Unix-Pfad wählt den kanonischen Steuerungs-Socket im Benutzerverzeichnis aus.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | nicht gesetzt                                          | Bearer-Token für den WebSocket-Transport. Akzeptiert eine Literalzeichenfolge oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Zusätzliche WebSocket-Header. Headerwerte akzeptieren Literalzeichenfolgen oder SecretInput-Werte, beispielsweise `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung erstellt hat. OpenClaw behält das ausgewählte `CODEX_HOME` und das geerbte `HOME` für lokale Starts bei.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Aktiviert die ausschließlich für den Codemodus vorgesehene Tool-Oberfläche von Codex. Gewöhnliche dynamische OpenClaw-Tools bleiben über verschachtelte `tools.*`-Aufrufe verfügbar; `openclaw_direct`-Tools bleiben für das Modell direkt sichtbar.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | nicht gesetzt                                          | Stammverzeichnis des Arbeitsbereichs des entfernten Codex-App-Servers. Wenn dieser Wert gesetzt ist, leitet OpenClaw das lokale Stammverzeichnis des Arbeitsbereichs aus dem aufgelösten OpenClaw-Arbeitsbereich ab, behält das Suffix des aktuellen Arbeitsverzeichnisses unter diesem entfernten Stammverzeichnis bei und sendet nur das endgültige App-Server-Arbeitsverzeichnis an Codex. Befindet sich das Arbeitsverzeichnis außerhalb des aufgelösten Stammverzeichnisses des OpenClaw-Arbeitsbereichs, bricht OpenClaw sicher ab, statt einen Gateway-lokalen Pfad an den entfernten App-Server zu senden. |
| `requestTimeoutMs`                            | `60000`                                                | Zeitüberschreitung für Aufrufe der App-Server-Steuerungsebene.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ruhefenster, nachdem Codex einen Turn akzeptiert hat oder nach einer Turn-bezogenen App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Abschlussleerlauf- und Fortschrittsschutz, der nach einer Tool-Übergabe, dem Abschluss eines nativen Tools, dem Fortschritt einer rohen Assistentenantwort nach einem Tool, dem Abschluss der rohen Schlussfolgerung oder dem Fortschritt der Schlussfolgerung verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder rechenintensive Arbeitslasten, bei denen die Synthese nach dem Tool berechtigterweise länger still bleiben kann als das Freigabebudget der endgültigen Assistentenantwort.                                |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht verbieten | Voreinstellung für YOLO oder durch einen Guardian geprüfte Ausführung. Lokale stdio-Anforderungen, die `danger-full-access`, die Genehmigung `never` oder den Prüfer `user` auslassen, machen Guardian zum impliziten Standard.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` oder eine zulässige Guardian-Genehmigungsrichtlinie       | Native Codex-Genehmigungsrichtlinie, die beim Starten/Fortsetzen eines Threads bzw. bei einem Turn gesendet wird. Guardian-Standardwerte bevorzugen `"on-request"`, sofern zulässig.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` oder eine zulässige Guardian-Sandbox  | Nativer Codex-Sandbox-Modus, der beim Starten/Fortsetzen eines Threads gesendet wird. Guardian-Standardwerte bevorzugen `"workspace-write"`, sofern zulässig, andernfalls `"read-only"`. Wenn eine OpenClaw-Sandbox aktiv ist, verwenden `danger-full-access`-Turns Codex `workspace-write` mit Netzwerkzugriff, der aus der Egress-Einstellung der OpenClaw-Sandbox abgeleitet wird.                                                                                     |
| `approvalsReviewer`                           | `"user"` oder ein zulässiger Guardian-Prüfer               | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, sofern zulässig, andernfalls `guardian_subagent` oder `user`. `guardian_subagent` bleibt ein veralteter Alias.                                                                                                                                                                                                                              |
| `serviceTier`                                 | nicht gesetzt                                          | Optionale Dienstklasse des Codex-App-Servers. `"priority"` aktiviert das Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, `null` entfernt die Überschreibung und das veraltete `"fast"` wird als `"priority"` akzeptiert.                                                                                                                                                                                                 |
| `networkProxy`                                | deaktiviert                                            | Aktiviert die Vernetzung über das Codex-Berechtigungsprofil für App-Server-Befehle. OpenClaw definiert die ausgewählte `permissions.<profile>.network`-Konfiguration und wählt sie mit `default_permissions` aus, anstatt `sandbox` zu senden.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | Vorschau-Opt-in, das beim unterstützten Codex-App-Server eine durch die OpenClaw-Sandbox gestützte Codex-Umgebung registriert, sodass die native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox erfolgen kann.                                                                                                                                                                                                            |

`appServer.networkProxy` ist explizit, da es den Sandbox-Vertrag von Codex
ändert. Wenn es aktiviert ist, setzt OpenClaw außerdem `features.network_proxy.enabled`
und `default_permissions` in der Codex-Thread-Konfiguration, damit das generierte
Berechtigungsprofil die von Codex verwaltete Vernetzung starten kann. Standardmäßig generiert OpenClaw
aus dem Profilinhalt einen kollisionsresistenten `openclaw-network-<fingerprint>`-Profilnamen;
verwenden Sie `profileName` nur, wenn ein stabiler lokaler Name
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

Wenn die normale App-Server-Laufzeit `danger-full-access` wäre, verwendet die Aktivierung von
`networkProxy` für das generierte Berechtigungsprofil einen Dateisystemzugriff
im Workspace-Stil: Die von Codex verwaltete Netzwerkdurchsetzung nutzt
Sandbox-Netzwerkzugriff, sodass ein Profil mit vollständigem Zugriff ausgehenden
Datenverkehr nicht schützen würde. Domaineinträge verwenden `allow` oder
`deny`; Unix-Socket-Einträge verwenden die Codex-Werte
`allow` oder `none`.

### Dynamische Zeitüberschreitungen für Tool-Aufrufe

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt: Codex-Anfragen vom Typ `item/tool/call` verwenden
standardmäßig einen 90-sekündigen OpenClaw-Watchdog. Ein positives
aufrufspezifisches Argument `timeoutMs` verlängert oder verkürzt das Budget
dieses bestimmten Tools, begrenzt auf 600000 ms. Das Tool
`image_generate` verwendet `agents.defaults.imageGenerationModel.timeoutMs`, wenn der Tool-Aufruf kein eigenes
Zeitlimit angibt, andernfalls gilt für die Bilderzeugung standardmäßig ein
Zeitlimit von 120 Sekunden. Das Medienanalyse-Tool `image` verwendet
`tools.media.image.timeoutSeconds` oder sein Medien-Standardzeitlimit von 60 Sekunden; bei der
Bildanalyse gilt dieses Zeitlimit für die Anfrage selbst und wird nicht durch
vorherige Vorbereitungsarbeiten verkürzt. Bei einer Zeitüberschreitung bricht
OpenClaw das Tool-Signal ab, sofern dies unterstützt wird, und gibt eine
fehlgeschlagene Antwort des dynamischen Tools an Codex zurück, damit der Turn
fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.
Dieser Watchdog bildet das äußere dynamische Budget `item/tool/call`;
providerspezifische Anfragezeitlimits laufen innerhalb dieses Aufrufs und
behalten ihre eigene Zeitlimitsemantik bei.

Nachdem Codex einen Turn angenommen hat und nachdem OpenClaw auf eine
turnbezogene App-Server-Anfrage geantwortet hat, erwartet das Harness, dass Codex
im aktuellen Turn Fortschritte macht und den nativen Turn schließlich mit
`turn/completed` beendet. Wenn der App-Server für `appServer.turnCompletionIdleTimeoutMs` inaktiv
bleibt, unterbricht OpenClaw nach bestem Bemühen den Codex-Turn, zeichnet eine
diagnostische Zeitüberschreitung auf und gibt die OpenClaw-Sitzungsspur frei,
damit nachfolgende Chatnachrichten nicht hinter einem veralteten nativen Turn
eingereiht werden. Die meisten nicht terminalen Benachrichtigungen für
denselben Turn deaktivieren diesen kurzen Watchdog, da Codex nachgewiesen hat,
dass der Turn noch aktiv ist.

Tool-Übergaben verwenden ein längeres Inaktivitätsbudget nach dem Tool: nachdem
OpenClaw eine Antwort vom Typ `item/tool/call` zurückgibt, nachdem native
Tool-Elemente wie `commandExecution` abgeschlossen sind, nach rohen
`custom_tool_call_output`-Abschlüssen sowie nach rohem Assistentenfortschritt nach dem
Tool, rohen Reasoning-Abschlüssen oder Reasoning-Fortschritt. Der Schutz verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn dies konfiguriert ist, und standardmäßig andernfalls fünf
Minuten; dasselbe Budget verlängert auch den Fortschritts-Watchdog für das stille
Synthesefenster, bevor Codex das nächste Ereignis des aktuellen Turns ausgibt.
Globale App-Server-Benachrichtigungen wie Aktualisierungen von Ratenbegrenzungen
setzen den Turn-Inaktivitätsfortschritt nicht zurück. Reasoning-Abschlüsse,
Kommentar-Abschlüsse vom Typ `agentMessage` sowie roher Reasoning- oder
Assistentenfortschritt vor einem Tool können von einer automatischen endgültigen
Antwort gefolgt werden. Daher verwenden sie den Antwortschutz nach Fortschritt,
statt die Sitzungsspur sofort freizugeben.

Nur abgeschlossene endgültige bzw. nicht als Kommentar klassifizierte Elemente
vom Typ `agentMessage` und rohe Assistentenabschlüsse vor einem Tool aktivieren
die Freigabe nach Assistentenausgabe: Wenn Codex anschließend ohne
`turn/completed` inaktiv bleibt, unterbricht OpenClaw nach bestem Bemühen den
nativen Turn und gibt die Sitzungsspur frei. Wenn eine andere Turn-Überwachung
dieses Freigaberennen gewinnt, akzeptiert OpenClaw das abgeschlossene endgültige
Assistentenelement dennoch, sobald keine native Anfrage, kein Element und kein
Abschluss eines dynamischen Tools mehr aktiv ist, die Freigabe nach
Assistentenausgabe weiterhin zum zuletzt abgeschlossenen Element gehört und kein
späterer Elementabschluss vorliegt. Dadurch kann die endgültige Antwort nach
abgeschlossener Tool-Arbeit beibehalten werden, ohne den Turn erneut abzuspielen.
Partielle Assistenten-Deltas, veraltete frühere Antworten und leere spätere
Abschlüsse erfüllen die Voraussetzungen nicht.

Wiederholungssichere Fehler des stdio-App-Servers, einschließlich
Inaktivitätszeitüberschreitungen beim Turn-Abschluss ohne Hinweise auf
Assistentenaktivität, Tools, aktive Elemente oder Nebenwirkungen, werden einmal
mit einem neuen App-Server-Versuch wiederholt. Unsichere Zeitüberschreitungen
setzen den blockierten App-Server-Client dennoch außer Betrieb und geben die
OpenClaw-Sitzungsspur frei; außerdem löschen sie die veraltete native
Thread-Bindung, statt automatisch wiederholt zu werden. Zeitüberschreitungen der
Abschlussüberwachung zeigen Codex-spezifischen Zeitüberschreitungstext:
Wiederholungssichere Fälle weisen darauf hin, dass die Antwort möglicherweise
unvollständig ist, während unsichere Fälle die Benutzer auffordern, vor einem
erneuten Versuch den aktuellen Zustand zu prüfen. Öffentliche
Zeitüberschreitungsdiagnosen enthalten strukturelle Felder wie die Methode der
letzten App-Server-Benachrichtigung, ID/Typ/Rolle des rohen
Assistentenantwortelements, Anzahlen aktiver Anfragen und Elemente sowie den
Status der aktivierten Überwachung. Wenn die letzte Benachrichtigung ein rohes
Assistentenantwortelement ist, enthalten sie außerdem eine begrenzte Vorschau
des Assistententexts. Rohe Prompt- oder Tool-Inhalte sind nicht enthalten.

### Lokale Überschreibungen der Testumgebung

- `OPENCLAW_CODEX_APP_SERVER_BIN` umgeht die verwaltete Binärdatei, wenn
  `appServer.command` nicht gesetzt ist.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen
`plugins.entries.codex.config.appServer.mode: "guardian"` oder `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Für
wiederholbare Bereitstellungen wird die Konfiguration bevorzugt, da sie das
Plugin-Verhalten in derselben geprüften Datei wie die übrige Einrichtung des
Codex-Harnesses hält.

## Native Codex-Plugins

Die native Unterstützung für Codex-Plugins verwendet die eigenen App- und
Plugin-Funktionen des Codex-App-Servers im selben Codex-Thread wie der
OpenClaw-Harness-Turn. OpenClaw übersetzt Codex-Plugins nicht in synthetische
dynamische OpenClaw-Tools vom Typ `codex_plugin_*`.

`codexPlugins` betrifft nur Sitzungen, die das native Codex-Harness
auswählen. Die Einstellung hat keine Auswirkungen auf Ausführungen mit dem
integrierten Harness, normale Ausführungen mit dem OpenAI-Provider,
ACP-Konversationsbindungen oder andere Harnesses.

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
Codex-Harness-Sitzung einrichtet oder eine veraltete Codex-Thread-Bindung
ersetzt; sie wird nicht bei jedem Turn neu berechnet. Verwenden Sie nach einer
Änderung von `codexPlugins` `/new`, `/reset` oder
starten Sie den Gateway neu, damit zukünftige Codex-Harness-Sitzungen mit dem
aktualisierten App-Satz beginnen.

Informationen zur Migrationseignung, zum App-Inventar, zu Richtlinien für
destruktive Aktionen, zu Rückfragen und zur Diagnose nativer Plugins finden Sie
unter [Native Codex-Plugins](/de/plugins/codex-native-plugins).

Der OpenAI-seitige App- und Plugin-Zugriff wird durch das angemeldete
Codex-Konto und bei Business- und Enterprise/Edu-Workspaces durch die
App-Steuerung des Workspace kontrolliert. Eine Übersicht von OpenAI zu Konten
und Workspace-Steuerung finden Sie unter
[Codex mit Ihrem ChatGPT-Tarif verwenden](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Computer Use

Computer Use verfügt über eine eigene Einrichtungsanleitung:
[Codex Computer Use](/de/plugins/codex-computer-use).

Kurzfassung: OpenClaw liefert die Desktop-Steuerungs-App nicht mit und führt
Desktop-Aktionen nicht selbst aus. Es bereitet den Codex-App-Server vor,
überprüft, ob der MCP-Server `computer-use` verfügbar ist, und überlässt
Codex anschließend während Turns im Codex-Modus die nativen MCP-Tool-Aufrufe.

## Laufzeitgrenzen

Das Codex-Harness ändert nur den eingebetteten Agent-Executor auf niedriger
Ebene.

- Dynamische OpenClaw-Tools werden unterstützt. Codex fordert OpenClaw zur
  Ausführung dieser Tools auf, sodass OpenClaw Teil des Ausführungspfads
  bleibt.
- Codex-native Shell-, Patch-, MCP- und native App-Tools werden von Codex
  verwaltet. OpenClaw kann ausgewählte native Ereignisse über das unterstützte
  Relay beobachten oder blockieren, schreibt die Argumente nativer Tools jedoch
  nicht um.
- Codex verwaltet die native Compaction. OpenClaw führt einen
  Transkriptspiegel für Kanalverlauf, Suche, `/new`,
  `/reset` und zukünftige Modell- oder Harness-Wechsel, ersetzt die
  Codex-Compaction jedoch nicht durch einen OpenClaw- oder
  Kontext-Engine-Zusammenfasser.
- Medienerzeugung, Medienanalyse, TTS, Genehmigungen und Ausgaben von
  Messaging-Tools werden weiterhin über die entsprechenden
  Provider-/Modelleinstellungen von OpenClaw verarbeitet.
- `tool_result_persist` gilt für OpenClaw-eigene
  Transkript-Tool-Ergebnisse, nicht für Codex-native Tool-Ergebnisdatensätze.

Informationen zu Hook-Schichten, unterstützten V1-Oberflächen, der nativen
Berechtigungsverarbeitung, der Warteschlangensteuerung, den Mechanismen zum
Hochladen von Codex-Feedback und Details zur Compaction finden Sie unter
[Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime).

## Fehlerbehebung

**Codex wird nicht als normaler `/model`-Provider angezeigt:** Dies ist
bei neuen Konfigurationen zu erwarten. Wählen Sie ein
`openai/gpt-*`-Modell aus, aktivieren Sie `plugins.entries.codex.enabled` und prüfen Sie,
ob `plugins.allow` den Wert `codex` ausschließt.

**OpenClaw verwendet anstelle von Codex das integrierte Harness:** Vergewissern
Sie sich, dass die effektive Route exakt eine offizielle HTTPS-Route für
Platform Responses oder ChatGPT Responses ist, keine manuell erstellte
Anfrageüberschreibung enthält und das Codex-Plugin installiert und aktiviert
ist. Das Präfix `openai/gpt-*` allein reicht nicht aus. Legen Sie für einen
strikten Nachweis beim Testen für Provider oder Modell `agentRuntime.id: "codex"` fest;
erzwungenes Codex schlägt fehl, statt auf eine Alternative zurückzugreifen,
wenn Route oder Harness inkompatibel sind.

**Die OpenAI-Codex-Laufzeit greift auf den API-Schlüssel-Pfad zurück:** Erfassen
Sie einen redigierten Gateway-Auszug, der Modell, Laufzeit, ausgewählten
Provider und Fehler zeigt. Bitten Sie betroffene Mitwirkende, diesen
schreibgeschützten Befehl auf ihrem OpenClaw-Host auszuführen:

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
`harnessRuntime`, `candidateProvider: "openai"` sowie ein Ergebnis vom Typ
`401`, `Incorrect API key` oder `No API key`. Eine korrigierte
Ausführung sollte den OpenAI-OAuth-Pfad anstelle eines einfachen Fehlers mit
dem OpenAI-API-Schlüssel zeigen.

**Die Konfiguration enthält weiterhin veraltete Codex-Modellreferenzen:** Führen
Sie `openclaw doctor --fix` aus. Doctor schreibt veraltete Modellreferenzen in
`openai/*` um, entfernt veraltete Laufzeit-Festlegungen für Sitzungen
und ganze Agenten und behält bestehende Überschreibungen von
Authentifizierungsprofilen bei.

**Der App-Server wird abgelehnt:** Verwenden Sie Codex-App-Server
`0.143.0` oder neuer. Vorabversionen derselben Version oder Versionen
mit Build-Suffix wie `0.143.0-alpha.2` oder `0.143.0+custom` werden
abgelehnt, da OpenClaw die stabile Protokolluntergrenze `0.143.0`
testet.

**`/codex status` kann keine Verbindung herstellen:** Prüfen Sie, ob das Plugin `codex`
aktiviert ist, ob `plugins.allow` es einschließt, wenn eine Zulassungsliste
konfiguriert ist, und ob benutzerdefinierte `appServer.command`-, `url`-, `authToken`- oder
Header-Werte gültig sind.

**Die Modellerkennung ist langsam:** Verringern Sie
`plugins.entries.codex.config.discovery.timeoutMs` oder deaktivieren Sie die Erkennung.
Siehe [Codex-Harness-Referenz](/de/plugins/codex-harness-reference#model-discovery).

**Der WebSocket-Transport schlägt sofort fehl:** Prüfen Sie `appServer.url`,
`authToken`, die Header und ob der entfernte App-Server dieselbe Version des Codex-
App-Server-Protokolls verwendet.

**Native Shell- oder Patch-Tools werden mit `Native hook relay
unavailable` blockiert:** Der Codex-Thread versucht weiterhin, eine native Hook-Relay-
ID zu verwenden, die bei OpenClaw nicht mehr registriert ist. Dies ist ein Transportproblem
des nativen Codex-Hooks und kein Fehler des ACP-Backends, Providers, von GitHub oder eines Shell-Befehls.
Starten Sie im betroffenen Chat mit `/new` oder `/reset`
eine neue Sitzung und versuchen Sie dann erneut einen harmlosen Befehl. Wenn dies einmal funktioniert, der nächste native Tool-
Aufruf jedoch erneut fehlschlägt, betrachten Sie `/new` nur als vorübergehende Problemumgehung: Kopieren Sie den
Prompt nach einem Neustart des Codex-App-Servers oder des OpenClaw Gateway in eine neue Sitzung,
damit alte Threads verworfen und die Registrierungen nativer Hooks
neu erstellt werden.

**Codex-Tool-Aufrufe erzeugen zu viele kurzlebige Hook-Prozesse:** Legen Sie
`plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`
fest und starten Sie das Gateway neu. Dadurch wird nur der für die OpenClaw-Schleifenerkennung
verwendete Codex-Unterprozess `PreToolUse` einschließlich seiner Markierung für fehlende Richtlinien deaktiviert. Erforderliche
`before_tool_call`-Relays und Richtlinien-Relays für vertrauenswürdige Tools bleiben aktiviert.

**Ein Nicht-Codex-Modell verwendet den integrierten Harness:** Dies ist zu erwarten, sofern eine Provider-
oder Modell-Laufzeitrichtlinie es nicht an einen anderen Harness weiterleitet. Einfache Provider-Referenzen,
die nicht zu OpenAI gehören, verbleiben im Modus `auto` auf ihrem regulären Provider-Pfad.

**Computer Use ist installiert, aber die Tools werden nicht ausgeführt:** Prüfen Sie
`/codex computer-use status` in einer neuen Sitzung. Wenn ein Tool
`Native hook relay unavailable` meldet, verwenden Sie die oben beschriebene Wiederherstellung des nativen Hook-Relays.
Siehe [Codex Computer Use](/de/plugins/codex-computer-use#troubleshooting).

## Verwandte Themen

- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Codex-Überwachung](/de/plugins/codex-supervision)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex Computer Use](/de/plugins/codex-computer-use)
- [Agentenlaufzeiten](/de/concepts/agent-runtimes)
- [Modell-Provider](/de/concepts/model-providers)
- [OpenAI-Provider](/de/providers/openai)
- [Hilfe zu OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Agent-Harness-Plugins](/de/plugins/sdk-agent-harness)
- [Plugin-Hooks](/de/plugins/hooks)
- [Diagnosedatenexport](/de/gateway/diagnostics)
- [Status](/de/cli/status)
- [Tests](/de/help/testing-live#live-codex-app-server-harness-smoke)
