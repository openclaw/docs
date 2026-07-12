---
read_when:
    - Sie benötigen jedes Konfigurationsfeld der Codex-Harness.
    - Sie ändern das Transport-, Authentifizierungs-, Erkennungs- oder Zeitüberschreitungsverhalten des App-Servers
    - Sie debuggen den Start des Codex-Harnesses, die Modellerkennung oder die Umgebungsisolierung
summary: Referenz zu Konfiguration, Authentifizierung, Erkennung und App-Server für das Codex-Harness
title: Codex-Harness-Referenz
x-i18n:
    generated_at: "2026-07-12T01:53:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Diese Referenz behandelt die detaillierte Konfiguration des offiziellen `codex`-Plugins.
Informationen zur Einrichtung und zu Routing-Entscheidungen finden Sie zunächst unter
[Codex-Harness](/de/plugins/codex-harness).

## Plugin-Konfigurationsoberfläche

Alle Einstellungen des Codex-Harness befinden sich unter `plugins.entries.codex.config`.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

Felder der obersten Ebene:

| Feld                       | Standardwert                  | Bedeutung                                                                                                                                                                                                                |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `discovery`                | aktiviert                     | Einstellungen zur Modellerkennung für `model/list` des Codex-App-Servers.                                                                                                                                                |
| `appServer`                | verwalteter stdio-App-Server  | Einstellungen für Transport, Befehl, Authentifizierung, Genehmigung, Sandbox und Zeitüberschreitung. Der gewöhnliche Harness verwendet standardmäßig agentenbezogenen Zustand.                                            |
| `codexDynamicToolsLoading` | `"searchable"`                | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Toolkontext aufzunehmen.                                                                                                          |
| `codexDynamicToolsExclude` | `[]`                          | Zusätzliche Namen dynamischer OpenClaw-Tools, die bei Codex-App-Server-Durchläufen ausgelassen werden sollen.                                                                                                             |
| `codexPlugins`             | deaktiviert                   | Native Unterstützung für Codex-Plugins/-Apps, einschließlich optionalem Zugriff auf Apps verbundener Konten. Siehe [Native Codex-Plugins](/de/plugins/codex-native-plugins).                                                 |
| `computerUse`              | deaktiviert                   | Einrichtung von Codex Computer Use. Siehe [Codex Computer Use](/de/plugins/codex-computer-use).                                                                                                                             |
| `supervision`              | deaktiviert                   | Katalog nicht archivierter nativer Sitzungen, lokale Zweigfortsetzung und Richtlinie für Agenten-Tools. Siehe [Codex-Supervision](/plugins/codex-supervision).                                                           |

## Supervision

Die Supervision listet nicht archivierte Codex-Sitzungen vom Gateway-Computer und
von ausdrücklich einbezogenen gekoppelten Nodes auf. Aktivieren Sie sie unabhängig
vom Agenten-Harness:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Felder von `supervision`:

| Feld                  | Standardwert                       | Bedeutung                                                                                                                                                                                                                                                                                                                                             |
| --------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                            | Stellt den lokalen Sitzungskatalog bereit und aggregiert auf dem Gateway die ausdrücklich einbezogenen Kataloge gekoppelter Nodes für die Seite „Codex-Sitzungen“.                                                                                                                                                                                    |
| `endpoints`           | integrierter lokaler Endpunkt      | Kompatibilitäts- und erweiterte Endpunktziele für den beibehaltenen Codex-Supervision-Agenten und eigenständige MCP-Tools. Der für Menschen bestimmte Katalog und der Zweigablauf ignorieren diese Ziele und verwenden den über `appServer` aufgelösten Supervision-App-Server.                                                                           |
| `allowRawTranscripts` | `false`                            | Erlaubt bei aktivierter Supervision autonomen Agenten oder eigenständigen MCP-Komponenten das Lesen von Transkripten und daraus abgeleiteten Listenfeldern. Reine Metadatenabfragen über `codex_threads` bleiben verfügbar. Steuert nicht die authentifizierte Fortsetzung über die Control UI.                                                           |
| `allowWriteControls`  | `false`                            | Erlaubt bei aktivierter Supervision autonome `codex_threads`-Mutationen zum Forken, Umbenennen, Archivieren und Wiederherstellen sowie eigenständige MCP-Operationen zum Senden, Steuern und Unterbrechen. Umgeht keine weiteren Prüfungen für Bindung, Host, Status oder Bestätigung.                                                                     |

Endpunkteinträge akzeptieren folgende Felder:

| Feld           | Gilt für      | Bedeutung                                                                 |
| -------------- | ------------- | ------------------------------------------------------------------------- |
| `id`           | alle          | Stabile Endpunkt-ID.                                                      |
| `label`        | alle          | Optionale Anzeigebezeichnung.                                             |
| `transport`    | alle          | `"stdio-proxy"` oder `"websocket"`.                                       |
| `command`      | `stdio-proxy` | Optionaler App-Server-Befehl.                                             |
| `args`         | `stdio-proxy` | Optionale Befehlsargumente.                                               |
| `cwd`          | `stdio-proxy` | Optionales Arbeitsverzeichnis des untergeordneten Prozesses.              |
| `url`          | `websocket`   | Erforderliche WebSocket- oder unterstützte lokale Socket-URL.             |
| `authTokenEnv` | `websocket`   | Optionale Umgebungsvariable, deren Wert den Endpunkt authentifiziert.      |

Die Seite **Codex-Sitzungen** verwendet den Supervision-App-Server des Plugins und
zeigt ausschließlich nicht archivierte Sitzungen an. Ohne explizite
`appServer`-Verbindungseinstellungen handelt es sich bei dieser Verbindung um
verwaltetes stdio im Benutzerverzeichnis. Gespeicherte oder inaktive lokale Zeilen
können einen modellgebundenen Chat mit begrenztem Benutzer- und Assistentenverlauf
bis zum letzten dauerhaft gespeicherten Quell-Turn im Endzustand erstellen. Seine
private Bindung hält den Snapshot-Fork, den kanonischen aus `appServer` stammenden
Zweig, die Verlaufsinjektion und spätere Turns auf dieser Verbindung. Beim ersten
kanonischen Start wird das vom Fork zurückgegebene Paar verwendet. Bei späteren
Fortsetzungen werden OpenClaw-Modell- und Provider-Überschreibungen ausgelassen,
damit Codex das gespeicherte Paar des kanonischen Threads wiederherstellt. Eine
separate native Änderung kann dieses Paar aktualisieren, aber das äußere Modell
und die Fallback-Kette ersetzen es niemals. Gespeicherte und inaktive Zeilen
können archiviert werden, nachdem bestätigt wurde, dass kein anderer Runner
vorhanden ist, sofern nicht eine andere aktive OpenClaw-Bindung das exakte Ziel
oder einen seiner nicht archivierten erzeugten Nachfolger besitzt. OpenClaw folgt
der Nachfolger-Paginierung von Codex und beendet den Vorgang bei
Aufzählungsfehlern, Zyklen oder Erschöpfung des Sicherheitslimits sicher. Die
Bestätigung deckt weiterhin unbekannte native Clients und das Zeitfenster zwischen
Statusprüfung und Archivierung ab. Ein über Supervision verwalteter
modellgebundener Chat kann nicht gelöscht werden, solange er die native Bindung
schützt. Aktive Quellen können weder einen Zweig erstellen noch archiviert werden,
ein vorhandener über Supervision verwalteter Chat kann jedoch weiterhin geöffnet
werden. Jede Zeile eines gekoppelten Nodes bleibt schreibgeschützt; der
Node-Transport stellt den vom Harness benötigten Streaming-Lebenszyklus noch nicht
bereit.

`appServer.homeScope: "user"` allein ändert lediglich, welches Codex-Home ein
verwalteter Harness-Prozess verwendet; der Flottenkatalog wird dadurch nicht
veröffentlicht. Die Aktivierung der Supervision ändert den Standardwert des
Harness nicht. Stattdessen verwendet die separate Supervision-Verbindung
standardmäßig verwaltetes stdio im Benutzerverzeichnis, wenn keine expliziten
`appServer`-Verbindungseinstellungen vorhanden sind. Explizite Einstellungen
werden für diese Verbindung berücksichtigt. Ausstehende und bestätigte
Supervision-Bindungen behalten diese Verbindung für jeden Turn bei; bei
deaktivierter Supervision oder einer Abweichung der Verbindung beziehungsweise
des Lebenszyklus wird der Vorgang sicher beendet, statt auf den Harness im
Agentenverzeichnis zurückzufallen. Die Standardverbindung teilt gespeicherte
Sitzungen mit nativen Codex-Clients, nicht jedoch deren prozesslokalen
Aktivitätsstatus.

Veraltete Einstellungen unter `plugins.entries.codex-supervisor` werden nicht
mehr verwendet. Führen Sie `openclaw doctor --fix` aus, um den alten Eintrag,
Endpunktdefinitionen, Richtlinien-Flags sowie Plugin-Zulassungs- und
-Ausschlussreferenzen in diesen Block zu migrieren. Explizite kanonische Werte
unter `codex.config.supervision` haben bei Konflikten Vorrang.

## App-Server-Transport

Für gewöhnliche Harness-Turns startet OpenClaw die verwaltete Codex-Binärdatei,
die mit dem offiziellen Plugin ausgeliefert wird (derzeit `@openai/codex`
`0.144.1`):

```bash
codex app-server --listen stdio://
```

Dadurch bleibt die App-Server-Version an das offizielle `codex`-Plugin gebunden,
statt von einer beliebigen separat lokal installierten Codex-CLI abzuhängen.
Legen Sie `appServer.command` nur fest, wenn Sie bewusst eine andere ausführbare
Datei verwenden möchten. Gewöhnliche verwaltete Turns mit dem standardmäßig
isolierten Agentenverzeichnis bevorzugen dieses festgelegte Paket selbst dann,
wenn ein macOS-Desktop-Bundle installiert ist. Wenn
[Computer Use](/de/plugins/codex-computer-use) aktiviert ist oder wenn `homeScope`
den Wert `"user"` hat und nativen Computer-Use-Zustand laden kann, bevorzugt der
verwaltete Start stattdessen die Binärdatei der Desktop-App, die über die
erforderlichen macOS-Berechtigungen verfügt. Dieselbe Regel, nach der die
Desktop-App Vorrang hat, gilt, wenn die effektive Codex-Konfiguration eines
isolierten Agentenverzeichnisses natives Computer Use aktiviert. Wenn kein
Desktop-App-Bundle installiert ist, greift OpenClaw auf die Binärdatei des
festgelegten Pakets zurück.

Die Übergabe ausführbarer Dateien und die Abschirmung der nativen Konfiguration
koordinieren Clients innerhalb eines laufenden Gateway-Prozesses. Starten Sie
den Gateway neu, nachdem ein anderer Prozess die native Codex-Plugin-Konfiguration
geändert hat.

Die Supervision löst eine separate Verbindung auf. Ohne explizite
`appServer`-Verbindungseinstellungen verwendet sie verwaltetes stdio mit
`homeScope: "user"`; der gewöhnliche Harness verwendet weiterhin verwaltetes
stdio mit `homeScope: "agent"`. Explizite Verbindungseinstellungen werden von
beiden Pfaden berücksichtigt. Legen Sie `homeScope: "user"` explizit fest, wenn
der gewöhnliche Harness `$CODEX_HOME` (oder `~/.codex`) mit nativen Clients teilen
soll. Eine private Supervision-Bindung verwendet unabhängig vom Standardwert des
gewöhnlichen Harness die Supervision-Verbindung. Unabhängige App-Server-Prozesse
behalten getrennte Live-Status- und Genehmigungszustände bei.

Verwenden Sie für einen bereits laufenden App-Server den WebSocket-Transport:

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
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Felder von `appServer`:

| Feld                                          | Standardwert                                            | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                               | `"stdio"` startet Codex; das explizite `"unix"` stellt eine Verbindung zum lokalen Steuerungssocket her; `"websocket"` stellt eine Verbindung zu `url` her.                                                                                                                                                                                                                                    |
| `homeScope`                                   | `"agent"`                                               | `"agent"` isoliert den gewöhnlichen Harness-Zustand pro OpenClaw-Agent. `"user"` ist eine explizite Aktivierung, die das native `$CODEX_HOME` oder `~/.codex` gemeinsam nutzt, die native Authentifizierung verwendet und die Thread-Verwaltung ausschließlich durch den Eigentümer ermöglicht. Der Benutzerbereich unterstützt lokales stdio oder Unix als Transport. Für die separate Überwachungsverbindung wird ein nicht gesetzter Wert bei stdio oder Unix als `"user"` und bei WebSocket als `"agent"` aufgelöst. |
| `command`                                     | verwaltete Codex-Binärdatei                             | Ausführbare Datei für den stdio-Transport. Lassen Sie den Wert nicht gesetzt, um die verwaltete Binärdatei zu verwenden.                                                                                                                                                                                                                                                                       |
| `args`                                        | `["app-server", "--listen", "stdio://"]`                | Argumente für den stdio-Transport.                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | nicht gesetzt                                           | WebSocket-App-Server-URL oder `unix://`-URL. Ein explizit leerer Unix-Pfad wählt den kanonischen Steuerungssocket im Benutzerverzeichnis aus.                                                                                                                                                                                                                                                    |
| `authToken`                                   | nicht gesetzt                                           | Bearer-Token für den WebSocket-Transport. Akzeptiert eine Literalzeichenfolge oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                |
| `headers`                                     | `{}`                                                    | Zusätzliche WebSocket-Header. Headerwerte akzeptieren Literalzeichenfolgen oder SecretInput-Werte, beispielsweise `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                              |
| `clearEnv`                                    | `[]`                                                    | Namen zusätzlicher Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw dessen geerbte Umgebung erstellt hat.                                                                                                                                                                                                                                 |
| `remoteWorkspaceRoot`                         | nicht gesetzt                                           | Stammverzeichnis des entfernten Codex-App-Server-Workspace. Wenn es festgelegt ist, leitet OpenClaw das lokale Workspace-Stammverzeichnis aus dem aufgelösten OpenClaw-Workspace ab, behält das aktuelle cwd-Suffix unter diesem entfernten Stammverzeichnis bei und sendet nur das endgültige cwd des App-Servers an Codex. Liegt das cwd außerhalb des aufgelösten OpenClaw-Workspace-Stammverzeichnisses, verweigert OpenClaw den Vorgang, statt einen Gateway-lokalen Pfad an den entfernten App-Server zu senden. |
| `requestTimeoutMs`                            | `60000`                                                 | Zeitüberschreitung für Steuerungsebenenaufrufe an den App-Server.                                                                                                                                                                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                 | Ruhezeitfenster, nachdem Codex einen Turn akzeptiert hat oder nach einer Turn-bezogenen App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                                       |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                                | Abschlussleerlauf- und Fortschrittsüberwachung, die nach einer Tool-Übergabe, dem Abschluss eines nativen Tools, einem auf das Tool folgenden Fortschritt der unverarbeiteten Assistentenausgabe, dem Abschluss der unverarbeiteten Schlussfolgerung oder einem Schlussfolgerungsfortschritt verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder rechenintensive Arbeitslasten, bei denen die Synthese nach dem Tool legitimerweise länger ruhig bleiben kann als das Zeitbudget für die endgültige Assistentenausgabe. |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO zulassen | Voreinstellung für YOLO oder eine durch einen Wächter geprüfte Ausführung.                                                                                                                                                                                                                                                                                                                     |
| `approvalPolicy`                              | `"never"` oder eine zulässige Wächter-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die beim Start und Fortsetzen eines Threads sowie bei einem Turn gesendet wird.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` oder eine zulässige Wächter-Sandbox | Nativer Codex-Sandbox-Modus, der beim Start und Fortsetzen eines Threads gesendet wird. Aktive OpenClaw-Sandboxes beschränken Turns mit `danger-full-access` auf Codex `workspace-write`; das Netzwerk-Flag des Turns folgt dem ausgehenden Datenverkehr der OpenClaw-Sandbox.                                                                                                                     |
| `approvalsReviewer`                           | `"user"` oder ein zulässiger Wächter-Prüfer             | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, sofern dies zulässig ist.                                                                                                                                                                                                                                                                                   |
| `defaultWorkspaceDir`                         | aktuelles Prozessverzeichnis                            | Workspace, der von `/codex bind` verwendet wird, wenn `--cwd` weggelassen wird.                                                                                                                                                                                                                                                                                                                |
| `serviceTier`                                 | nicht gesetzt                                           | Optionale Codex-App-Server-Dienststufe. `"priority"` aktiviert das Fast-Mode-Routing, `"flex"` fordert eine flexible Verarbeitung an und `null` hebt die Überschreibung auf. Das veraltete `"fast"` wird als `"priority"` akzeptiert.                                                                                                                                                            |
| `networkProxy`                                | deaktiviert                                             | Aktiviert die Netzwerkfunktion des Codex-Berechtigungsprofils für App-Server-Befehle. OpenClaw definiert die ausgewählte Konfiguration `permissions.<profile>.network` und wählt sie über `default_permissions` aus, statt `sandbox` zu senden.                                                                                                                                                     |
| `experimental.sandboxExecServer`              | `false`                                                 | Vorschauaktivierung, die beim unterstützten Codex-App-Server eine durch die OpenClaw-Sandbox gestützte Codex-Umgebung registriert, damit die native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox erfolgen kann.                                                                                                                                                                         |

`appServer.networkProxy` ist explizit, da es den Sandbox-Vertrag von Codex
ändert. Wenn die Option aktiviert ist, setzt OpenClaw außerdem
`features.network_proxy.enabled` und `default_permissions` in der
Codex-Thread-Konfiguration, damit das generierte Berechtigungsprofil die von
Codex verwaltete Netzwerkfunktion starten kann. OpenClaw generiert
standardmäßig aus dem Profilinhalt einen kollisionsresistenten Profilnamen
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

Wenn die normale App-Server-Laufzeitumgebung `danger-full-access` wäre, verwendet die Aktivierung von `networkProxy` stattdessen einen Dateisystemzugriff im Workspace-Stil für das generierte Berechtigungsprofil. Die von Codex verwaltete Netzwerkdurchsetzung erfolgt über isolierte Netzwerke, sodass ein Vollzugriffsprofil ausgehenden Datenverkehr nicht schützen würde.

Das Plugin blockiert ältere oder nicht versionierte App-Server-Handshakes: Der Codex-App-Server muss die stabile Version `0.143.0` oder neuer melden.

OpenClaw behandelt WebSocket-App-Server-URLs außerhalb von local loopback als remote und erfordert eine identitätsgebundene WebSocket-Authentifizierung über `appServer.authToken` oder einen `Authorization`-Header. `appServer.authToken` und jeder Wert unter `appServer.headers.*` können ein SecretInput sein; die Secrets-Laufzeitumgebung löst SecretRefs und Env-Kurzformen auf, bevor OpenClaw die App-Server-Startoptionen erstellt, und nicht aufgelöste strukturierte SecretRefs führen zu einem Fehler, bevor ein Token oder Header gesendet wird. Wenn native Codex-Plugins konfiguriert sind, verwendet OpenClaw die Plugin-Steuerungsebene des verbundenen App-Servers, um diese Plugins zu installieren oder zu aktualisieren, und aktualisiert anschließend den App-Bestand, damit Plugin-eigene Apps für den Codex-Thread sichtbar sind. `app/list` bleibt die maßgebliche Quelle für Bestand und Metadaten, doch die OpenClaw-Richtlinie entscheidet, ob `thread/start` für eine aufgelistete, zugängliche App `config.apps[appId].enabled = true` sendet, selbst wenn Codex sie derzeit als deaktiviert kennzeichnet. Unbekannte oder fehlende App-IDs bleiben nach dem Fail-Closed-Prinzip gesperrt; dieser Pfad aktiviert ausschließlich Marketplace-Plugins über `plugin/install` und aktualisiert den Bestand. Verbinden Sie OpenClaw nur mit Remote-App-Servern, denen Sie zutrauen, von OpenClaw verwaltete Plugin-Installationen und Aktualisierungen des App-Bestands anzunehmen.

## Genehmigungs- und Sandbox-Modi

Lokale stdio-App-Server-Sitzungen verwenden standardmäßig den YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Diese Haltung für vertrauenswürdige lokale Betreiber ermöglicht unbeaufsichtigten OpenClaw-Turns und Heartbeats Fortschritte ohne native Genehmigungsaufforderungen, auf die niemand antworten kann.

Wenn die lokale Systemanforderungsdatei von Codex implizite YOLO-Werte für Genehmigung, Prüfer oder Sandbox untersagt, behandelt OpenClaw stattdessen die implizite Voreinstellung als Guardian und wählt zulässige Guardian-Berechtigungen. `tools.exec.mode: "auto"` erzwingt ebenfalls von Guardian geprüfte Codex-Genehmigungen und behält unsichere Legacy-Überschreibungen wie `approvalPolicy: "never"` oder `sandbox: "danger-full-access"` nicht bei; legen Sie `tools.exec.mode: "full"` fest, wenn Sie bewusst ohne Genehmigungen arbeiten möchten. Hostnamen entsprechende `[[remote_sandbox_config]]`-Einträge in derselben Anforderungsdatei werden bei der Entscheidung über die Sandbox-Voreinstellung berücksichtigt.

Legen Sie `appServer.mode: "guardian"` für von Codex Guardian geprüfte Genehmigungen fest:

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

Die Voreinstellung `guardian` wird zu `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert, sofern diese Werte zulässig sind. Einzelne Richtlinienfelder überschreiben `mode`. Der ältere Prüferwert `guardian_subagent` wird weiterhin als Kompatibilitätsalias akzeptiert, neue Konfigurationen sollten jedoch `auto_review` verwenden.

Wenn eine OpenClaw-Sandbox aktiv ist, wird der lokale Codex-App-Server-Prozess weiterhin auf dem Gateway-Host ausgeführt. OpenClaw deaktiviert daher für diesen Turn den nativen Code Mode von Codex, benutzerdefinierte MCP-Server und die App-gestützte Plugin-Ausführung, anstatt die hostseitige Sandbox-Isolierung von Codex als gleichwertig mit dem OpenClaw-Sandbox-Backend zu behandeln. Shell-Zugriff wird über dynamische, vom OpenClaw-Sandbox-Backend gestützte Tools wie `sandbox_exec` und `sandbox_process` bereitgestellt, wenn die normalen Ausführungs- und Prozesstools verfügbar sind.

<Note>
Auf Docker-gestützten OpenClaw-Sandbox-Hosts (`agents.defaults.sandbox.mode` ist auf ein Docker-Backend gesetzt) prüft `openclaw doctor`, ob der Host die Namespaces für unprivilegierte Benutzer sowie – wenn ausgehender Netzwerkverkehr der Docker-Sandbox deaktiviert ist – Netzwerk-Namespaces zulässt, die das verschachtelte Codex-`bwrap` für die `workspace-write`-Shell-Ausführung innerhalb des Sandbox-Containers benötigt. Eine fehlgeschlagene Prüfung äußert sich auf Ubuntu-/AppArmor-Hosts üblicherweise als `bwrap: setting up uid map: Permission denied` oder `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Korrigieren Sie die gemeldete Host-Namespace-Richtlinie für den OpenClaw-Dienstbenutzer und starten Sie den Gateway neu; bevorzugen Sie ein auf den Dienstprozess beschränktes AppArmor-Profil gegenüber der hostweiten Ausweichlösung `kernel.apparmor_restrict_unprivileged_userns=0`, und gewähren Sie dem Docker-Container nicht allein zur Unterstützung des verschachtelten `bwrap` umfassendere Berechtigungen.
</Note>

## Native Ausführung in der Sandbox

Die stabile Voreinstellung arbeitet nach dem Fail-Closed-Prinzip: Aktive OpenClaw-Sandbox-Isolierung deaktiviert native Codex-Ausführungsoberflächen, die andernfalls auf dem Host des Codex-App-Servers ausgeführt würden. Verwenden Sie `appServer.experimental.sandboxExecServer: true` nur, wenn Sie die Unterstützung von Codex für Remote-Umgebungen mit dem OpenClaw-Sandbox-Backend ausprobieren möchten. Dieser Vorschaupfad funktioniert mit jeder unterstützten Codex-App-Server-Version.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

Wenn das Flag aktiviert und die aktuelle OpenClaw-Sitzung in einer Sandbox isoliert ist, startet OpenClaw einen von der aktiven Sandbox gestützten Exec-Server über local loopback, registriert ihn beim Codex-App-Server und startet den Codex-Thread und -Turn mit dieser von OpenClaw verwalteten Umgebung. Wenn der App-Server die Umgebung nicht registrieren kann, schlägt die Ausführung nach dem Fail-Closed-Prinzip fehl, statt unbemerkt auf die Host-Ausführung zurückzufallen.

Dieser Vorschaupfad ist ausschließlich lokal verfügbar. Ein Remote-WebSocket-App-Server kann den Loopback-Exec-Server nur erreichen, wenn er auf demselben Host ausgeführt wird; daher lehnt OpenClaw diese Kombination ab.

## Authentifizierungs- und Umgebungsisolation

Im standardmäßigen agentenspezifischen Home-Verzeichnis wird die Authentifizierung in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das vorhandene Konto des App-Servers im Codex-Home-Verzeichnis dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, danach `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und weiterhin eine OpenAI-Authentifizierung erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt – mit OAuth- oder Token-Anmeldedatentyp –, entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY` aus dem gestarteten Codex-Kindprozess. Dadurch bleiben API-Schlüssel auf Gateway-Ebene für Einbettungen oder direkte OpenAI-Modelle verfügbar, ohne dass native Codex-App-Server-Turns versehentlich über die API abgerechnet werden.

Explizite Codex-API-Schlüsselprofile und der Env-Schlüssel-Fallback für lokales stdio verwenden die App-Server-Anmeldung statt einer geerbten Kindprozessumgebung. WebSocket-App-Server-Verbindungen erhalten keinen Fallback auf API-Schlüssel aus der Gateway-Umgebung; verwenden Sie ein explizites Authentifizierungsprofil oder das eigene Konto des Remote-App-Servers.

Starts von stdio-App-Servern erben standardmäßig die Prozessumgebung von OpenClaw. OpenClaw verwaltet die Kontobrücke des Codex-App-Servers und setzt `CODEX_HOME` auf ein agentenspezifisches Verzeichnis im OpenClaw-Zustand dieses Agenten. Dadurch bleiben Codex-Konfiguration, Konten, Plugin-Cache und -Daten sowie Thread-Zustand auf den OpenClaw-Agenten beschränkt, statt aus dem persönlichen `~/.codex`-Home-Verzeichnis des Betreibers übernommen zu werden.

Legen Sie `appServer.homeScope: "user"` fest, um nativen Codex-Zustand mit Codex Desktop und der CLI zu teilen. Dieser lokale Benutzer-Home-Modus unterstützt verwaltetes stdio und expliziten Unix-Transport. Er verwendet `$CODEX_HOME`, wenn es gesetzt ist, andernfalls `~/.codex`, einschließlich nativer Authentifizierung, Konfiguration, Plugins und Threads. OpenClaw überspringt für den App-Server seine Authentifizierungsprofilbrücke. Verifizierte Turns des Eigentümers können mit `codex_threads` diese Threads auflisten – optional mit einem `search`-Filter –, lesen, forken, umbenennen, archivieren und aus dem Archiv wiederherstellen. Forken Sie einen Thread, bevor Sie ihn in OpenClaw fortsetzen; unabhängige Codex-Prozesse koordinieren keine gleichzeitigen Schreibzugriffe auf denselben Thread.

Diese `homeScope`-Aktivierung gilt für gewöhnliche Harness-Sitzungen. Ein über Codex Sessions erstellter Chat verwendet stattdessen seine private Überwachungsverbindung, wodurch die Authentifizierungs- und Provider-Konfiguration der nativen Verbindung für den kanonischen Branch und zukünftige Fortsetzungen erhalten bleibt.

In einem modellgebundenen, überwachten Chat kann `codex_threads` weder einen anderen Fork anhängen noch den gebundenen nativen Thread des Chats archivieren. Auflisten und ausschließlich metadatenbezogenes Lesen bleiben verfügbar. Das Lesen von Rohtranskripten erfordert `allowRawTranscripts`; wenn diese Option deaktiviert ist, wird auch die Listensuche abgelehnt, da die native Suche Treffer in Transkriptvorschauen finden kann. Das Umbenennen, Wiederherstellen aus dem Archiv, abgetrennte Forken und Archivieren eines nicht zugehörigen Threads, der keinem anderen OpenClaw-Chat gehört, erfordern `allowWriteControls`. Keine der beiden Optionen umgeht eine gesperrte Bindung.

OpenClaw schreibt `HOME` bei normalen lokalen App-Server-Starts nicht um. Von Codex ausgeführte Unterprozesse wie `openclaw`, `gh`, `git`, Cloud-CLIs und Shell-Befehle sehen das normale Prozess-Home-Verzeichnis und können Konfigurationen und Token im Benutzer-Home-Verzeichnis finden. Codex kann außerdem `$HOME/.agents/skills` und `$HOME/.agents/plugins/marketplace.json` erkennen; diese `.agents`-Erkennung wird bewusst mit dem Home-Verzeichnis des Betreibers geteilt und ist vom isolierten `~/.codex`-Zustand getrennt.

Im standardmäßigen Agentenbereich werden OpenClaw-Plugins und OpenClaw-Skill-Snapshots weiterhin über die eigene Plugin-Registry und den Skill-Loader von OpenClaw bereitgestellt; persönliche Codex-Ressourcen aus `~/.codex` dagegen nicht. Wenn Sie nützliche Skills oder Plugins der Codex CLI aus einem Codex-Home-Verzeichnis besitzen, die Teil eines isolierten OpenClaw-Agenten werden sollen, inventarisieren Sie diese explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Wenn eine Bereitstellung zusätzliche Umgebungsisolation benötigt, fügen Sie diese Variablen zu `appServer.clearEnv` hinzu:

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

`appServer.clearEnv` betrifft nur den gestarteten Kindprozess des Codex-App-Servers. OpenClaw entfernt `CODEX_HOME` und `HOME` während der Normalisierung lokaler Starts aus dieser Liste: `CODEX_HOME` verweist weiterhin auf den ausgewählten Agenten- oder Benutzerbereich, und `HOME` bleibt geerbt, damit Unterprozesse den normalen Zustand im Benutzer-Home-Verzeichnis verwenden können.

## Dynamische Tools

Dynamische Codex-Tools verwenden standardmäßig das Laden über `searchable`, werden im Namespace `openclaw` mit `deferLoading: true` bereitgestellt. OpenClaw stellt keine dynamischen Tools bereit, die native Workspace-Operationen von Codex oder dessen eigene Tool-Suchoberfläche duplizieren:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

Die meisten verbleibenden OpenClaw-Integrationstools, etwa für Messaging, Medien, Cron, Browser, Nodes, Gateway, `heartbeat_respond` und `web_search`, sind über die Codex-Tool-Suche in diesem Namespace verfügbar. Dadurch bleibt der anfängliche Modellkontext kleiner. Eine kleine Gruppe von Tools bleibt unabhängig von `codexDynamicToolsLoading` direkt aufrufbar, da die Codex-Tool-Suche nicht verfügbar sein oder nur einen Connector-spezifischen Bestand auflösen kann: `agents_list`, `sessions_spawn` und `sessions_yield`. Entwickleranweisungen lenken normale Codex-Subagenten für Codex-native Subagentenaufgaben weiterhin zu nativem `spawn_agent`, während `sessions_spawn` für eine explizite Delegierung über OpenClaw oder ACP verfügbar bleibt. Antworten aus Quellen, die ausschließlich das Nachrichten-Tool verwenden, bleiben ebenfalls direkt, da dies ein Vertrag zur Turn-Steuerung ist.

Mit `catalogMode: "direct-only"` gekennzeichnete Tools, einschließlich des OpenClaw-Tools `computer`, werden unter `openclaw_direct` gruppiert. OpenClaw fügt diesen Namespace der Liste `code_mode.direct_only_tool_namespaces` von Codex hinzu, ohne vom Betreiber bereitgestellte Einträge zu ersetzen. Codex stellt diese Tools daher in normalen sowie ausschließlich für Code Mode vorgesehenen Threads als `DirectModelOnly` bereit, statt sie durch verschachtelte Code-Mode-Aufrufe von `tools.*` zu leiten. Diese Grenze ist für Ergebnisse mit Bildern erforderlich: Die verschachtelte Code-Mode-Serialisierung reduziert Bildausgaben auf Text, wodurch der für die nächste Computeraktion erforderliche Screenshot verloren ginge.

Legen Sie `codexDynamicToolsLoading: "direct"` nur fest, wenn Sie eine Verbindung zu einem benutzerdefinierten Codex-App-Server herstellen, der verzögert geladene dynamische Tools nicht durchsuchen kann, oder wenn Sie die vollständige Tool-Nutzlast debuggen.

## Zeitüberschreitungen

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt. Jede Codex-Anfrage vom Typ `item/tool/call`
verwendet das erste verfügbare Zeitlimit in dieser Reihenfolge:

- Ein positives aufrufspezifisches Argument `timeoutMs`.
- Für `image_generate`: `agents.defaults.imageGenerationModel.timeoutMs`.
- Für `image_generate` ohne konfiguriertes Zeitlimit: der Standardwert von
  120 Sekunden für die Bilderzeugung.
- Für das Medienverständnis-Tool `image`: `tools.media.image.timeoutSeconds`,
  umgerechnet in Millisekunden, oder der Medienstandardwert von 60 Sekunden.
  Beim Bildverständnis gilt dies für die Anfrage selbst und wird nicht durch
  vorherige Vorbereitungsarbeiten verkürzt.
- Für das Tool `message`: ein fester Standardwert von 120 Sekunden.
- Der Standardwert von 90 Sekunden für dynamische Tools.

Dieser Watchdog bildet das äußere Budget für dynamische `item/tool/call`-Aufrufe.
Provider-spezifische Anfragezeitlimits laufen innerhalb dieses Aufrufs und
behalten ihre eigene Zeitlimitsemantik bei. Budgets für dynamische Tools sind
auf 600000 ms begrenzt. Bei einer Zeitüberschreitung bricht OpenClaw das
Tool-Signal ab, sofern dies unterstützt wird, und gibt eine fehlgeschlagene
Antwort des dynamischen Tools an Codex zurück, sodass der Turn fortgesetzt
werden kann, anstatt die Sitzung im Zustand `processing` zu belassen.

Nachdem Codex einen Turn akzeptiert hat und nachdem OpenClaw auf eine
turnbezogene App-Server-Anfrage geantwortet hat, erwartet das Harness, dass
Codex im aktuellen Turn Fortschritte erzielt und den nativen Turn schließlich
mit `turn/completed` beendet. Wenn der App-Server für
`appServer.turnCompletionIdleTimeoutMs` inaktiv bleibt, unterbricht OpenClaw
nach bestem Bemühen den Codex-Turn, zeichnet eine diagnostische
Zeitüberschreitung auf und gibt die OpenClaw-Sitzungsspur frei, damit
nachfolgende Chatnachrichten nicht hinter einem veralteten nativen Turn
eingereiht werden.

Die meisten nicht abschließenden Benachrichtigungen desselben Turns
deaktivieren diesen kurzen Watchdog, da Codex damit nachgewiesen hat, dass der
Turn noch aktiv ist. Tool-Übergaben verwenden ein längeres Inaktivitätsbudget
nach einem Tool-Aufruf: nachdem OpenClaw eine `item/tool/call`-Antwort
zurückgegeben hat, nachdem native Tool-Elemente wie `commandExecution`
abgeschlossen wurden, nach dem Abschluss unverarbeiteter
`custom_tool_call_output`-Elemente sowie nach unverarbeitetem
Assistentenfortschritt nach einem Tool, abgeschlossenen unverarbeiteten
Reasoning-Vorgängen oder Reasoning-Fortschritt. Die Überwachung verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn dies konfiguriert
ist, andernfalls standardmäßig fünf Minuten. Dasselbe Budget nach einem
Tool-Aufruf verlängert außerdem den Fortschritts-Watchdog für das stille
Synthesefenster, bevor Codex das nächste Ereignis des aktuellen Turns ausgibt.
Abgeschlossene Reasoning-Vorgänge, abgeschlossene
`agentMessage`-Kommentarvorgänge sowie unverarbeiteter Reasoning- oder
Assistentenfortschritt vor einem Tool können von einer automatischen finalen
Antwort gefolgt werden. Daher verwenden sie die Antwortüberwachung nach
Fortschritt, anstatt die Sitzungsspur sofort freizugeben. Nur abgeschlossene
finale `agentMessage`-Elemente ohne Kommentar und abgeschlossene
unverarbeitete Assistentenausgaben vor einem Tool aktivieren die Freigabe nach
Assistentenausgabe: Wenn Codex anschließend ohne `turn/completed` inaktiv
bleibt, unterbricht OpenClaw nach bestem Bemühen den nativen Turn und gibt die
Sitzungsspur frei. Wiederholungssichere Fehler des stdio-App-Servers,
einschließlich Zeitüberschreitungen beim Turn-Abschluss ohne Hinweise auf
Assistentenaktivität, Tools, aktive Elemente oder Nebenwirkungen, werden
einmal mit einem neuen App-Server-Versuch wiederholt. Unsichere
Zeitüberschreitungen setzen den blockierten App-Server-Client dennoch außer
Betrieb und geben die OpenClaw-Sitzungsspur frei. Außerdem löschen sie die
veraltete Bindung des nativen Threads, anstatt automatisch wiederholt zu
werden. Zeitüberschreitungen der Abschlussüberwachung zeigen
Codex-spezifischen Zeitüberschreitungstext an: Bei wiederholungssicheren Fällen
wird darauf hingewiesen, dass die Antwort möglicherweise unvollständig ist,
während Benutzer bei unsicheren Fällen aufgefordert werden, den aktuellen
Zustand vor einem erneuten Versuch zu überprüfen. Öffentliche
Zeitüberschreitungsdiagnosen enthalten strukturelle Felder wie die Methode der
letzten App-Server-Benachrichtigung, ID, Typ und Rolle des unverarbeiteten
Assistentenantwortelements, die Anzahl aktiver Anfragen und Elemente sowie den
Status der aktivierten Überwachung. Wenn die letzte Benachrichtigung ein
unverarbeitetes Assistentenantwortelement ist, enthalten sie außerdem eine
begrenzte Vorschau des Assistententexts. Sie enthalten keine unverarbeiteten
Prompt- oder Tool-Inhalte.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen.
Die Modellverfügbarkeit wird vom Codex-App-Server verwaltet. Daher kann sich
die Liste ändern, wenn OpenClaw die gebündelte Version von `@openai/codex`
aktualisiert oder wenn eine Bereitstellung `appServer.command` auf eine andere
Codex-Binärdatei verweist. Die Verfügbarkeit kann außerdem kontospezifisch
sein. Verwenden Sie `/codex models` auf einem laufenden Gateway, um den
aktuellen Katalog für dieses Harness und Konto anzuzeigen.

Wenn die Erkennung fehlschlägt oder das Zeitlimit überschreitet, verwendet
OpenClaw einen gebündelten Ausweichkatalog:

| Modell-ID      | Anzeigename   | Reasoning-Stufen         |
| -------------- | ------------- | ------------------------ |
| `gpt-5.5`      | gpt-5.5       | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini  | low, medium, high, xhigh |

<Note>
Das derzeit gebündelte Harness ist `@openai/codex` `0.144.1`. Eine
`model/list`-Abfrage an diesen gebündelten App-Server gab folgende öffentliche
Auswahlzeilen zurück:

| Modell-ID       | Eingabemodalitäten | Reasoning-Stufen                     |
| --------------- | ------------------ | ------------------------------------ |
| `gpt-5.6-sol`   | Text, Bild         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | Text, Bild         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | Text, Bild         | low, medium, high, xhigh, max        |
| `gpt-5.5`       | Text, Bild         | low, medium, high, xhigh             |
| `gpt-5.4`       | Text, Bild         | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | Text, Bild         | low, medium, high, xhigh             |
| `gpt-5.2`       | Text, Bild         | low, medium, high, xhigh             |

Der App-Server-Katalog kann `ultra` melden; die Reasoning-Steuerung von
OpenClaw stellt derzeit Stufen bis einschließlich `max` bereit.

Aktuelle Auswahlzeilen sind kontospezifisch und können sich mit dem Konto,
dem Codex-Katalog oder der gebündelten Version ändern. Führen Sie `/codex
models` aus, um die aktuelle Liste abzurufen, anstatt sich auf eine zu einem
bestimmten Zeitpunkt erstellte Tabelle zu verlassen. Ausgeblendete Modelle
können außerdem für interne oder spezialisierte Abläufe im App-Server-Katalog
erscheinen, ohne reguläre Auswahloptionen für Modelle zu sein.
</Note>

Passen Sie die Erkennung unter `plugins.entries.codex.config.discovery` an:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Deaktivieren Sie die Erkennung, wenn beim Start keine Codex-Abfrage erfolgen
und ausschließlich der Ausweichkatalog verwendet werden soll:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Bootstrap-Dateien des Arbeitsbereichs

Codex verarbeitet `AGENTS.md` selbst über die native Erkennung von
Projektdokumentation. OpenClaw schreibt keine synthetischen
Codex-Projektdokumentationsdateien und ist für Persona-Dateien nicht von
Codex-Ausweichdateinamen abhängig, da Codex-Ausweichmechanismen nur gelten,
wenn `AGENTS.md` fehlt.

Für die Gleichwertigkeit des OpenClaw-Arbeitsbereichs leitet das Codex-Harness
die anderen Bootstrap-Dateien als Entwickleranweisungen weiter, jedoch nicht
auf identische Weise:

- `TOOLS.md` wird als **vererbte** Codex-Entwickleranweisung weitergeleitet,
  sodass native Codex-Unteragenten, die während des Turns gestartet werden,
  sie ebenfalls sehen.
- `SOUL.md`, `IDENTITY.md` und `USER.md` werden als **turnbezogene**
  Anweisungen zur Zusammenarbeit weitergeleitet. Native Codex-Unteragenten
  erben sie nicht. Dadurch übernehmen Unteragenten-Turns weder die Persona
  noch das Benutzerprofil des übergeordneten Agenten.
- Die kompakte Liste geladener OpenClaw-Skills wird ebenfalls als
  turnbezogene Entwickleranweisung zur Zusammenarbeit weitergeleitet, sodass
  native Codex-Unteragenten sie ebenfalls nicht erben.
- Der Inhalt von `HEARTBEAT.md` wird nicht eingefügt. Heartbeat-Turns erhalten
  einen Hinweis im Zusammenarbeitsmodus, die Datei zu lesen, wenn sie
  vorhanden und nicht leer ist.
- Der Inhalt von `MEMORY.md` aus dem konfigurierten Agentenarbeitsbereich wird
  nicht in die native Codex-Turn-Eingabe eingefügt, wenn für diesen
  Arbeitsbereich Speicher-Tools verfügbar sind. Wenn die Datei vorhanden ist,
  fügt das Harness den turnbezogenen Entwickleranweisungen zur Zusammenarbeit
  einen kurzen Hinweis zum Arbeitsbereichsspeicher hinzu, und Codex sollte
  `memory_search` oder `memory_get` verwenden, wenn dauerhafter Speicher
  relevant ist. Wenn Tools deaktiviert sind, die Speichersuche nicht
  verfügbar ist oder sich der aktive Arbeitsbereich vom
  Agentenspeicher-Arbeitsbereich unterscheidet, verwendet `MEMORY.md`
  stattdessen den normalen begrenzten Turn-Kontextpfad.
- `BOOTSTRAP.md` wird, sofern vorhanden, als Referenzkontext der
  OpenClaw-Turn-Eingabe weitergeleitet.

## Umgebungsüberschreibungen

Umgebungsüberschreibungen bleiben für lokale Tests verfügbar:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` umgeht die verwaltete Binärdatei, wenn
`appServer.command` nicht festgelegt ist.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie
stattdessen `plugins.entries.codex.config.appServer.mode: "guardian"` oder
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Für
wiederholbare Bereitstellungen wird die Konfiguration bevorzugt, da sie das
Plugin-Verhalten in derselben überprüften Datei wie die übrige Einrichtung
des Codex-Harness festhält.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Codex-Überwachung](/plugins/codex-supervision)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex-Computersteuerung](/de/plugins/codex-computer-use)
- [OpenAI-Provider](/de/providers/openai)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
