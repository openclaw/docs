---
read_when:
    - Sie benötigen jedes Konfigurationsfeld des Codex-Harnesses
    - Sie ändern das Transport-, Authentifizierungs-, Erkennungs- oder Zeitüberschreitungsverhalten des App-Servers
    - Sie debuggen den Start des Codex-Harness, die Modellerkennung oder die Umgebungsisolierung
summary: Referenz zu Konfiguration, Authentifizierung, Erkennung und App-Server für das Codex-Harness
title: Codex-Harness-Referenz
x-i18n:
    generated_at: "2026-07-12T15:32:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Diese Referenz behandelt die detaillierte Konfiguration für das offizielle `codex`-Plugin.
Für Einrichtungs- und Routing-Entscheidungen beginnen Sie mit
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

| Feld                       | Standard                         | Bedeutung                                                                                                                                                                                                            |
| -------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | aktiviert                        | Einstellungen für die Modellerkennung über `model/list` des Codex-App-Servers.                                                                                                                                        |
| `appServer`                | verwalteter stdio-App-Server     | Einstellungen für Transport, Befehl, Authentifizierung, Genehmigung, Sandbox und Zeitüberschreitung. Der normale Harness verwendet standardmäßig agentenspezifischen Zustand.                                          |
| `codexDynamicToolsLoading` | `"searchable"`                   | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Tool-Kontext aufzunehmen.                                                                                                      |
| `codexDynamicToolsExclude` | `[]`                             | Zusätzliche Namen dynamischer OpenClaw-Tools, die bei Durchläufen des Codex-App-Servers ausgelassen werden sollen.                                                                                                     |
| `codexPlugins`             | deaktiviert                      | Native Unterstützung für Codex-Plugins/-Apps, einschließlich optionalem Zugriff auf Apps verbundener Konten. Siehe [Native Codex-Plugins](/de/plugins/codex-native-plugins).                                              |
| `computerUse`              | deaktiviert                      | Einrichtung von Codex Computer Use. Siehe [Codex Computer Use](/de/plugins/codex-computer-use).                                                                                                                          |
| `supervision`              | deaktiviert                      | Katalog nicht archivierter nativer Sitzungen, Fortsetzung lokaler Branches und Richtlinie für Agent-Tools. Siehe [Codex-Supervision](/plugins/codex-supervision).                                                      |

## Supervision

Supervision listet nicht archivierte Codex-Sitzungen vom Gateway-Computer und
von angemeldeten gekoppelten Nodes auf. Aktivieren Sie sie unabhängig vom Agent-Harness:

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

`supervision`-Felder:

| Feld                  | Standard                         | Bedeutung                                                                                                                                                                                                                                                                                            |
| --------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                          | Veröffentlicht den lokalen Sitzungskatalog und fasst auf dem Gateway die Kataloge angemeldeter gekoppelter Nodes für die Seite „Codex Sessions“ zusammen.                                                                                                                                               |
| `endpoints`           | integrierter lokaler Endpunkt    | Kompatibilitäts- und erweiterte Endpunktziele für den beibehaltenen Codex-Supervision-Agent und eigenständige MCP-Tools. Der Benutzerkatalog und der Branch-Ablauf ignorieren diese Ziele und verwenden den über `appServer` aufgelösten Supervision-App-Server.                                            |
| `allowRawTranscripts` | `false`                          | Erlaubt bei aktivierter Supervision autonomen Agents oder eigenständigen MCP-Tools das Lesen von Transkripten und daraus abgeleiteten Listenfeldern. Reine Metadatenzugriffe über `codex_threads` bleiben verfügbar. Dies steuert nicht die authentifizierte Fortsetzung über die Control UI.               |
| `allowWriteControls`  | `false`                          | Erlaubt bei aktivierter Supervision autonome `codex_threads`-Mutationen zum Forken, Umbenennen, Archivieren und Wiederherstellen sowie Sende-, Steuerungs- und Unterbrechungsoperationen eigenständiger MCP-Tools. Andere Bindungs-, Host-, Status- oder Bestätigungsprüfungen werden nicht umgangen.       |

Endpunkteinträge akzeptieren diese Felder:

| Feld           | Gilt für      | Bedeutung                                                                          |
| -------------- | ------------- | ---------------------------------------------------------------------------------- |
| `id`           | alle          | Stabile Endpunkt-ID.                                                               |
| `label`        | alle          | Optionale Anzeigebeschriftung.                                                     |
| `transport`    | alle          | `"stdio-proxy"` oder `"websocket"`.                                                |
| `command`      | `stdio-proxy` | Optionaler App-Server-Befehl.                                                      |
| `args`         | `stdio-proxy` | Optionale Befehlsargumente.                                                        |
| `cwd`          | `stdio-proxy` | Optionales Arbeitsverzeichnis des untergeordneten Prozesses.                       |
| `url`          | `websocket`   | Erforderliche WebSocket- oder unterstützte lokale Socket-URL.                      |
| `authTokenEnv` | `websocket`   | Optionale Umgebungsvariable, deren Wert den Endpunkt authentifiziert.              |

Die Seite **Codex Sessions** verwendet den Supervision-App-Server des Plugins und zeigt
nur nicht archivierte Sitzungen an. Ohne explizite `appServer`-Verbindungseinstellungen
wird diese Verbindung als verwaltete benutzerbezogene stdio-Verbindung ausgeführt. Gespeicherte oder inaktive lokale Zeilen können
einen modellgebundenen Chat mit begrenztem Benutzer- und Assistentenverlauf bis zum letzten
persistierten terminalen Quelldurchlauf erstellen. Seine private Bindung hält den Snapshot-Fork,
den kanonischen Branch der `appServer`-Quelle, die Verlaufsinjektion und spätere Durchläufe auf dieser
Verbindung. Beim ersten kanonischen Start wird das vom Fork zurückgegebene Paar verwendet. Bei späteren
Fortsetzungen werden OpenClaw-Modell- und Provider-Überschreibungen ausgelassen, damit Codex das
persistierte Paar des kanonischen Threads wiederherstellt; eine separate native Änderung kann dieses
Paar aktualisieren, aber das äußere Modell und die Fallback-Kette ersetzen es niemals. Gespeicherte und inaktive
Zeilen können nach Bestätigung, dass kein anderer Runner vorhanden ist, archiviert werden, sofern nicht eine andere aktive
OpenClaw-Bindung genau dieses Ziel oder einen seiner nicht archivierten erzeugten
Nachfolger besitzt. OpenClaw folgt der Nachfolger-Paginierung von Codex und bricht bei
Aufzählungsfehlern, Zyklen oder Überschreitung des Sicherheitslimits sicher ab. Die Bestätigung umfasst weiterhin
unbekannte native Clients und das Zeitfenster zwischen Statusprüfung und Archivierung. Ein über Supervision verwalteter
modellgebundener Chat kann nicht gelöscht werden, solange er die native Bindung schützt.
Aktive Quellen können keinen Branch erstellen oder archiviert werden, ein bestehender über Supervision verwalteter
Chat kann jedoch weiterhin geöffnet werden. Jede Zeile eines gekoppelten Nodes bleibt schreibgeschützt; der Node-
Transport stellt den für den Harness erforderlichen Streaming-Lebenszyklus noch nicht bereit.

`appServer.homeScope: "user"` allein ändert, welches Codex-Home ein verwalteter Harness-
Prozess verwendet; der Flottenkatalog wird dadurch nicht veröffentlicht. Das Aktivieren von Supervision ändert
den Harness-Standard nicht. Stattdessen verwendet die separate Supervision-Verbindung
standardmäßig eine verwaltete benutzerbezogene stdio-Verbindung, wenn keine expliziten `appServer`-
Verbindungseinstellungen vorhanden sind. Explizite Einstellungen werden für diese Verbindung berücksichtigt.
Ausstehende und bestätigte Supervision-Bindungen behalten diese Verbindung für jeden Durchlauf bei;
deaktivierte Supervision oder Abweichungen bei Verbindung oder Lebenszyklus führen zu einem sicheren Abbruch, statt
auf den Agent-Home-Harness zurückzufallen. Die Standardverbindung teilt gespeicherte
Sitzungen mit nativen Codex-Clients, nicht deren prozesslokalen Aktivitätsstatus.

Veraltete Einstellungen unter `plugins.entries.codex-supervisor` werden nicht mehr unterstützt. Führen Sie
`openclaw doctor --fix` aus, um den alten Eintrag, Endpunktdefinitionen, Richtlinien-
Flags und Plugin-Zulassungs-/Ablehnungsreferenzen in diesen Block zu migrieren. Explizite kanonische
`codex.config.supervision`-Werte haben bei Konflikten Vorrang.

## App-Server-Transport

Für normale Harness-Durchläufe startet OpenClaw die verwaltete Codex-Binärdatei, die
mit dem offiziellen Plugin ausgeliefert wird (derzeit `@openai/codex` `0.144.1`):

```bash
codex app-server --listen stdio://
```

Dadurch bleibt die App-Server-Version an das offizielle `codex`-Plugin gebunden, statt an
eine beliebige separat lokal installierte Codex-CLI. Setzen Sie
`appServer.command` nur, wenn Sie absichtlich eine andere ausführbare Datei verwenden möchten.
Normale verwaltete Durchläufe mit dem standardmäßigen isolierten Agent-Home bevorzugen dieses angeheftete
Paket selbst dann, wenn ein macOS-Desktop-Bundle installiert ist. Wenn
[Computer Use](/de/plugins/codex-computer-use) aktiviert ist oder wenn `homeScope`
`"user"` ist und nativen Computer-Use-Zustand laden kann, bevorzugt der verwaltete Start stattdessen
die Binärdatei der Desktop-App, die über die erforderlichen macOS-Berechtigungen verfügt. Dieselbe
Desktop-zuerst-Regel gilt, wenn die effektive Codex-Konfiguration eines isolierten Agent-Homes
natives Computer Use aktiviert. Wenn kein Desktop-App-Bundle installiert ist, greift OpenClaw
auf die Binärdatei des angehefteten Pakets zurück.

Die Übergabe ausführbarer Dateien und die Abschirmung nativer Konfiguration koordinieren Clients innerhalb eines
laufenden Gateway-Prozesses. Starten Sie das Gateway neu, nachdem ein anderer Prozess die
native Codex-Plugin-Konfiguration geändert hat.

Supervision löst eine separate Verbindung auf. Ohne explizite
`appServer`-Verbindungseinstellungen verwendet sie verwaltetes stdio mit `homeScope: "user"`;
der normale Harness bleibt bei verwaltetem stdio mit `homeScope: "agent"`. Explizite
Verbindungseinstellungen werden von beiden Pfaden berücksichtigt. Setzen Sie `homeScope: "user"`
explizit, wenn der normale Harness `$CODEX_HOME` (oder `~/.codex`)
mit nativen Clients teilen soll. Eine private Supervision-Bindung verwendet unabhängig vom
Standard des normalen Harness die Supervision-Verbindung. Unabhängige App-Server-
Prozesse behalten getrennte Live-Status- und Genehmigungszustände bei.

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

`appServer`-Felder:

| Feld                                          | Standardwert                                            | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` startet Codex; das explizite `"unix"` stellt eine Verbindung zum lokalen Steuerungs-Socket her; `"websocket"` stellt eine Verbindung zu `url` her.                                                                                                                                                                                                                                    |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isoliert den gewöhnlichen Harness-Zustand pro OpenClaw-Agent. `"user"` ist eine explizite Opt-in-Option, die das native `$CODEX_HOME` oder `~/.codex` gemeinsam verwendet, native Authentifizierung nutzt und eine ausschließlich dem Eigentümer vorbehaltene Thread-Verwaltung aktiviert. Der Benutzerbereich unterstützt lokalen stdio- oder Unix-Transport. Für die separate Überwachungsverbindung wird ein nicht gesetzter Wert bei stdio oder Unix als `"user"` und bei WebSocket als `"agent"` aufgelöst. |
| `command`                                     | verwaltete Codex-Binärdatei                            | Ausführbare Datei für den stdio-Transport. Lassen Sie die Einstellung weg, um die verwaltete Binärdatei zu verwenden.                                                                                                                                                                                                                                                                            |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumente für den stdio-Transport.                                                                                                                                                                                                                                                                                                                                                               |
| `url`                                         | nicht gesetzt                                          | WebSocket-App-Server-URL oder `unix://`-URL. Ein explizit leerer Unix-Pfad wählt den kanonischen Steuerungs-Socket im Benutzer-Home-Verzeichnis aus.                                                                                                                                                                                                                                             |
| `authToken`                                   | nicht gesetzt                                          | Bearer-Token für den WebSocket-Transport. Akzeptiert eine literale Zeichenfolge oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                               |
| `headers`                                     | `{}`                                                   | Zusätzliche WebSocket-Header. Header-Werte akzeptieren literale Zeichenfolgen oder SecretInput-Werte, beispielsweise `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                           |
| `clearEnv`                                    | `[]`                                                   | Namen zusätzlicher Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw dessen geerbte Umgebung erstellt hat.                                                                                                                                                                                                                                  |
| `remoteWorkspaceRoot`                         | nicht gesetzt                                          | Stammverzeichnis des entfernten Codex-App-Server-Arbeitsbereichs. Wenn es gesetzt ist, leitet OpenClaw das lokale Arbeitsbereichs-Stammverzeichnis aus dem aufgelösten OpenClaw-Arbeitsbereich ab, behält das aktuelle cwd-Suffix unter diesem entfernten Stammverzeichnis bei und sendet nur das endgültige App-Server-cwd an Codex. Wenn sich das cwd außerhalb des aufgelösten OpenClaw-Arbeitsbereichs-Stammverzeichnisses befindet, bricht OpenClaw sicher ab, statt einen Gateway-lokalen Pfad an den entfernten App-Server zu senden. |
| `requestTimeoutMs`                            | `60000`                                                | Zeitüberschreitung für Aufrufe der App-Server-Steuerungsebene.                                                                                                                                                                                                                                                                                                                                  |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ruhefenster, nachdem Codex einen Turn angenommen hat oder nach einer Turn-bezogenen App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Abschlussleerlauf- und Fortschrittsüberwachung, die nach einer Tool-Übergabe, dem Abschluss eines nativen Tools, einem Post-Tool-Fortschritt des unverarbeiteten Assistenten, dem Abschluss unverarbeiteter Reasoning-Ausgaben oder Reasoning-Fortschritt verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder rechenintensive Workloads, bei denen die Post-Tool-Synthese berechtigterweise länger still bleiben kann als das Budget für die endgültige Assistentenausgabe. |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht verbieten | Voreinstellung für YOLO oder durch einen Guardian geprüfte Ausführung.                                                                                                                                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` oder eine zulässige Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die beim Start und Fortsetzen eines Threads sowie bei einem Turn gesendet wird.                                                                                                                                                                                                                                                                             |
| `sandbox`                                     | `"danger-full-access"` oder eine zulässige Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der beim Start und Fortsetzen eines Threads gesendet wird. Aktive OpenClaw-Sandboxes schränken Turns mit `danger-full-access` auf Codex `workspace-write` ein; das Netzwerk-Flag des Turns folgt dem Sandbox-Egress von OpenClaw.                                                                                                                                     |
| `approvalsReviewer`                           | `"user"` oder ein zulässiger Guardian-Prüfer           | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, sofern dies zulässig ist.                                                                                                                                                                                                                                                                                     |
| `defaultWorkspaceDir`                         | aktuelles Prozessverzeichnis                           | Arbeitsbereich, den `/codex bind` verwendet, wenn `--cwd` weggelassen wird.                                                                                                                                                                                                                                                                                                                      |
| `serviceTier`                                 | nicht gesetzt                                          | Optionale Dienststufe des Codex-App-Servers. `"priority"` aktiviert das Fast-Mode-Routing, `"flex"` fordert die Flex-Verarbeitung an und `null` hebt die Überschreibung auf. Das veraltete `"fast"` wird als `"priority"` akzeptiert.                                                                                                                                                             |
| `networkProxy`                                | deaktiviert                                            | Aktiviert das Netzwerk des Codex-Berechtigungsprofils für App-Server-Befehle. OpenClaw definiert die ausgewählte Konfiguration `permissions.<profile>.network` und wählt sie mit `default_permissions` aus, anstatt `sandbox` zu senden.                                                                                                                                                         |
| `experimental.sandboxExecServer`              | `false`                                                | Vorschau-Opt-in, das eine durch eine OpenClaw-Sandbox gestützte Codex-Umgebung beim unterstützten Codex-App-Server registriert, sodass die native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox erfolgen kann.                                                                                                                                                                            |

`appServer.networkProxy` ist explizit, da es den Codex-Sandbox-Vertrag
ändert. Wenn es aktiviert ist, setzt OpenClaw außerdem `features.network_proxy.enabled` und
`default_permissions` in der Codex-Thread-Konfiguration, damit das generierte Berechtigungsprofil
die von Codex verwaltete Netzwerkfunktion starten kann. OpenClaw erzeugt standardmäßig
aus dem Profilinhalt einen kollisionsresistenten Profilnamen `openclaw-network-<fingerprint>`;
verwenden Sie `profileName` nur, wenn ein stabiler lokaler Name
erforderlich ist.

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

Wenn die normale App-Server-Laufzeitumgebung `danger-full-access` wäre, verwendet die Aktivierung von
`networkProxy` stattdessen einen Arbeitsbereichs-artigen Dateisystemzugriff für das generierte
Berechtigungsprofil. Die von Codex verwaltete Netzwerkdurchsetzung ist eine Sandbox-
Netzwerkumgebung, daher würde ein Vollzugriffsprofil ausgehenden Datenverkehr nicht schützen.

Das Plugin blockiert ältere oder nicht versionierte App-Server-Handshakes: Der Codex-App-Server
muss die stabile Version `0.143.0` oder neuer melden.

OpenClaw behandelt WebSocket-App-Server-URLs, die nicht auf Loopback verweisen, als remote und erfordert
identitätstragende WebSocket-Authentifizierung über `appServer.authToken` oder einen
`Authorization`-Header. `appServer.authToken` und jeder Wert unter `appServer.headers.*`
können ein SecretInput sein; die Secrets-Laufzeitumgebung löst SecretRefs und Env-
Kurzschreibweisen auf, bevor OpenClaw die App-Server-Startoptionen erstellt, und nicht aufgelöste
strukturierte SecretRefs führen zu einem Fehler, bevor ein Token oder Header gesendet wird. Wenn native
Codex-Plugins konfiguriert sind, verwendet OpenClaw die Plugin-
Steuerungsebene des verbundenen App-Servers, um diese Plugins zu installieren oder zu aktualisieren, und aktualisiert anschließend das App-
Inventar, damit Plugin-eigene Apps für den Codex-Thread sichtbar sind. `app/list` bleibt
die maßgebliche Quelle für Inventar und Metadaten, aber die OpenClaw-Richtlinie
entscheidet, ob `thread/start` für eine aufgelistete, zugängliche App
`config.apps[appId].enabled = true` sendet, selbst wenn Codex sie derzeit als deaktiviert kennzeichnet. Unbekannte oder
fehlende App-IDs bleiben nach dem Fail-Closed-Prinzip gesperrt; dieser Pfad aktiviert ausschließlich Marketplace-
Plugins über `plugin/install` und aktualisiert das Inventar. Verbinden Sie OpenClaw nur mit
Remote-App-Servern, denen Sie zutrauen, von OpenClaw verwaltete Plugin-Installationen
und Aktualisierungen des App-Inventars anzunehmen.

## Genehmigungs- und Sandbox-Modi

Lokale stdio-App-Server-Sitzungen verwenden standardmäßig den YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Diese vertrauenswürdige lokale Betreiberkonfiguration ermöglicht es,
unbeaufsichtigten OpenClaw-Durchläufen und Heartbeats ohne native Genehmigungs-
aufforderungen fortzufahren, die niemand beantworten könnte.

Wenn die lokale Systemanforderungsdatei von Codex implizite YOLO-Werte für Genehmigung,
Prüfer oder Sandbox nicht zulässt, behandelt OpenClaw den impliziten Standard stattdessen als Guardian
und wählt zulässige Guardian-Berechtigungen. `tools.exec.mode: "auto"`
erzwingt ebenfalls von Guardian geprüfte Codex-Genehmigungen und behält unsichere
veraltete Überschreibungen wie `approvalPolicy: "never"` oder `sandbox: "danger-full-access"` nicht bei;
setzen Sie `tools.exec.mode: "full"` für eine bewusst gewählte Konfiguration ohne Genehmigungen.
Mit dem Hostnamen übereinstimmende `[[remote_sandbox_config]]`-Einträge in derselben Anforderungsdatei
werden bei der Entscheidung über den Sandbox-Standard berücksichtigt.

Setzen Sie `appServer.mode: "guardian"` für von Codex Guardian geprüfte Genehmigungen:

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

Die Voreinstellung `guardian` wird zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert, sofern diese
Werte zulässig sind. Einzelne Richtlinienfelder überschreiben `mode`. Der ältere
Prüferwert `guardian_subagent` wird weiterhin als Kompatibilitätsalias akzeptiert,
neue Konfigurationen sollten jedoch `auto_review` verwenden.

Wenn eine OpenClaw-Sandbox aktiv ist, wird der lokale Codex-App-Server-Prozess weiterhin
auf dem Gateway-Host ausgeführt. OpenClaw deaktiviert daher für diesen Durchlauf den nativen Code Mode von Codex,
MCP-Server des Benutzers und die App-gestützte Plugin-Ausführung, anstatt
die hostseitige Sandbox-Ausführung von Codex als gleichwertig mit dem OpenClaw-Sandbox-
Backend zu behandeln. Shell-Zugriff wird über dynamische, von der OpenClaw-Sandbox gestützte Tools
wie `sandbox_exec` und `sandbox_process` bereitgestellt, wenn die normalen Exec-/Prozess-Tools
verfügbar sind.

<Note>
Auf Docker-gestützten OpenClaw-Sandbox-Hosts (`agents.defaults.sandbox.mode` auf
ein Docker-Backend gesetzt) prüft `openclaw doctor`, ob der Host die
Namespaces für nicht privilegierte Benutzer und – wenn ausgehender Netzwerkverkehr der Docker-Sandbox deaktiviert ist –
Netzwerk-Namespaces zulässt, die das verschachtelte Codex-`bwrap` für die `workspace-write`-
Shell-Ausführung innerhalb des Sandbox-Containers benötigt. Eine fehlgeschlagene Prüfung zeigt sich normalerweise
als `bwrap: setting up uid map: Permission denied` oder
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` auf
Ubuntu-/AppArmor-Hosts. Korrigieren Sie die gemeldete Host-Namespace-Richtlinie für den OpenClaw-
Dienstbenutzer und starten Sie das Gateway neu; bevorzugen Sie ein auf den
Dienstprozess beschränktes AppArmor-Profil gegenüber der hostweiten Ausweichlösung
`kernel.apparmor_restrict_unprivileged_userns=0`, und gewähren Sie
nicht nur zur Unterstützung des verschachtelten `bwrap` umfassendere Docker-Container-Berechtigungen.
</Note>

## Native Ausführung in der Sandbox

Der stabile Standard ist Fail-Closed: Eine aktive OpenClaw-Sandbox deaktiviert native
Codex-Ausführungsoberflächen, die andernfalls vom Host des Codex-App-Servers ausgeführt würden.
Verwenden Sie `appServer.experimental.sandboxExecServer: true` nur, wenn Sie
die Unterstützung entfernter Umgebungen von Codex mit dem Sandbox-Backend von OpenClaw ausprobieren möchten.
Dieser Vorschaupfad funktioniert mit jeder unterstützten Codex-App-Server-Version.

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

Wenn das Flag aktiviert und die aktuelle OpenClaw-Sitzung in einer Sandbox ausgeführt wird, startet OpenClaw
einen lokalen Loopback-Exec-Server, der von der aktiven Sandbox gestützt wird, registriert ihn
beim Codex-App-Server und startet den Codex-Thread und -Durchlauf mit dieser
OpenClaw-eigenen Umgebung. Wenn der App-Server die Umgebung nicht registrieren kann,
schlägt der Durchlauf nach dem Fail-Closed-Prinzip fehl, statt stillschweigend auf die Host-Ausführung zurückzufallen.

Dieser Vorschaupfad ist ausschließlich lokal verfügbar. Ein Remote-WebSocket-App-Server kann
den Loopback-Exec-Server nicht erreichen, sofern er nicht auf demselben Host ausgeführt wird, daher lehnt OpenClaw
diese Kombination ab.

## Authentifizierungs- und Umgebungsisolation

Im standardmäßigen agentenspezifischen Home-Verzeichnis wird die Authentifizierung in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das bestehende Konto des App-Servers im Codex-Home-Verzeichnis dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, anschließend
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und weiterhin eine OpenAI-Authentifizierung
   erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt (OAuth oder
Anmeldedatentyp „Token“), entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY` aus
dem gestarteten Codex-Kindprozess. Dadurch bleiben API-Schlüssel auf Gateway-Ebene
für Embeddings oder direkte OpenAI-Modelle verfügbar, ohne dass native Codex-App-Server-
Durchläufe versehentlich über die API abgerechnet werden.

Explizite Codex-API-Schlüsselprofile und der Env-Schlüssel-Fallback für lokales stdio verwenden
die App-Server-Anmeldung anstelle der geerbten Umgebung des Kindprozesses. WebSocket-App-Server-
Verbindungen erhalten keinen Fallback auf API-Schlüssel aus der Gateway-Umgebung; verwenden Sie ein explizites Authentifizierungsprofil
oder das eigene Konto des Remote-App-Servers.

Starts des stdio-App-Servers erben standardmäßig die Prozessumgebung von OpenClaw.
OpenClaw verwaltet die Kontobrücke des Codex-App-Servers und setzt `CODEX_HOME` auf ein
agentenspezifisches Verzeichnis im OpenClaw-Zustand dieses Agenten. Dadurch bleiben Codex-
Konfiguration, Konten, Plugin-Cache/-Daten und Thread-Status auf den OpenClaw-
Agenten beschränkt, statt aus dem persönlichen `~/.codex`-Home-Verzeichnis des Betreibers übernommen zu werden.

Setzen Sie `appServer.homeScope: "user"`, um den nativen Codex-Status mit Codex
Desktop und der CLI zu teilen. Dieser lokale Benutzer-Home-Modus unterstützt verwaltetes stdio und
expliziten Unix-Transport. Er verwendet `$CODEX_HOME`, wenn es gesetzt ist, andernfalls `~/.codex`,
einschließlich nativer Authentifizierung, Konfiguration, Plugins und Threads.
OpenClaw überspringt seine Authentifizierungsprofilbrücke für den App-Server. Verifizierte Durchläufe des Besitzers
können `codex_threads` verwenden, um diese Threads aufzulisten (mit einem optionalen `search`-Filter),
zu lesen, zu forken, umzubenennen, zu archivieren und aus dem Archiv wiederherzustellen. Forken Sie einen Thread, bevor
Sie ihn in OpenClaw fortsetzen; unabhängige Codex-Prozesse koordinieren
keine gleichzeitigen Schreibzugriffe auf denselben Thread.

Diese `homeScope`-Aktivierung gilt für gewöhnliche Harness-Sitzungen. Ein über
Codex Sessions erstellter Chat verwendet stattdessen seine private Überwachungsverbindung, wodurch
die Authentifizierungs- und Provider-Konfiguration der nativen Verbindung für den
kanonischen Zweig und spätere Fortsetzungen erhalten bleibt.

In einem modellgebundenen überwachten Chat kann `codex_threads` weder einen anderen
Fork anhängen noch den an den Chat gebundenen nativen Thread archivieren. Auflistung und schreibgeschütztes Lesen
von Metadaten bleiben verfügbar. Das Lesen von Rohtranskripten erfordert `allowRawTranscripts`; wenn diese Option
deaktiviert ist, wird auch die Listensuche abgelehnt, da die native Suche
Übereinstimmungen in Transkriptvorschauen finden kann. Das Umbenennen, Wiederherstellen aus dem Archiv, abgetrennte Forken und Archivieren eines
nicht zugehörigen Threads, der keinem anderen OpenClaw-Chat gehört, erfordern
`allowWriteControls`. Keine der beiden Optionen umgeht eine gesperrte Bindung.

OpenClaw schreibt `HOME` bei normalen lokalen App-Server-Starts nicht um.
Von Codex ausgeführte Unterprozesse wie `openclaw`, `gh`, `git`, Cloud-CLIs und Shell-
Befehle sehen das normale Prozess-Home-Verzeichnis und können Konfiguration und
Tokens im Benutzer-Home finden. Codex kann außerdem `$HOME/.agents/skills` und
`$HOME/.agents/plugins/marketplace.json` erkennen; diese `.agents`-Erkennung wird
bewusst mit dem Betreiber-Home geteilt und ist vom isolierten
`~/.codex`-Status getrennt.

Im standardmäßigen Agentenbereich werden OpenClaw-Plugins und OpenClaw-Skill-Snapshots
weiterhin über die eigene Plugin-Registry und den Skill-Loader von OpenClaw bereitgestellt; persönliche
Codex-Assets aus `~/.codex` hingegen nicht. Wenn Sie nützliche Codex-CLI-Skills oder
Plugins aus einem Codex-Home haben, die Teil eines isolierten OpenClaw-
Agenten werden sollen, erfassen Sie sie ausdrücklich:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Wenn eine Bereitstellung zusätzliche Umgebungsisolation benötigt, fügen Sie diese Variablen
zu `appServer.clearEnv` hinzu:

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

`appServer.clearEnv` wirkt sich nur auf den gestarteten Kindprozess des Codex-App-Servers aus.
OpenClaw entfernt `CODEX_HOME` und `HOME` während der Normalisierung des lokalen Starts
aus dieser Liste: `CODEX_HOME` verweist weiterhin auf den ausgewählten Agenten- oder Benutzerbereich,
und `HOME` wird weiterhin geerbt, damit Unterprozesse den normalen Status im Benutzer-Home verwenden können.

## Dynamische Tools

Dynamische Codex-Tools verwenden standardmäßig das Laden im Modus `searchable` und werden unter dem
Namespace `openclaw` mit `deferLoading: true` bereitgestellt. OpenClaw stellt keine
dynamischen Tools bereit, die native Codex-Arbeitsbereichsoperationen oder die eigene
Tool-Suchoberfläche von Codex duplizieren:

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

Die meisten verbleibenden OpenClaw-Integrationstools, beispielsweise für Messaging, Medien, Cron,
Browser, Nodes, Gateway, `heartbeat_respond` und `web_search`, sind
über die Codex-Tool-Suche unter diesem Namespace verfügbar. Dadurch bleibt der anfängliche Modell-
kontext kleiner. Eine kleine Gruppe von Tools bleibt unabhängig von
`codexDynamicToolsLoading` direkt aufrufbar, da die Codex-Tool-Suche nicht verfügbar sein oder
nur einen Connector-Umfang auflösen kann: `agents_list`, `sessions_spawn` und
`sessions_yield`. Entwickleranweisungen lenken normale Codex-Subagenten weiterhin
zu nativem `spawn_agent` für Codex-native Subagentenarbeit, während
`sessions_spawn` für explizite OpenClaw- oder ACP-Delegierung verfügbar bleibt.
Antworten aus Quellen, die ausschließlich das Nachrichten-Tool verwenden, bleiben ebenfalls direkt, da dies ein
Vertrag zur Ablaufsteuerung ist.

Mit `catalogMode: "direct-only"` markierte Tools, darunter das OpenClaw-Tool `computer`,
werden unter `openclaw_direct` gruppiert. OpenClaw fügt diesen Namespace zur Liste
`code_mode.direct_only_tool_namespaces` von Codex hinzu, ohne
vom Betreiber bereitgestellte Einträge zu ersetzen. Codex stellt diese Tools daher in
normalen und ausschließlich für den Code-Modus vorgesehenen Threads als `DirectModelOnly` bereit, statt sie
durch verschachtelte Code-Mode-Aufrufe von `tools.*` zu leiten. Diese Grenze ist für
Ergebnisse mit Bildern erforderlich: Die verschachtelte Code-Mode-Serialisierung reduziert die Bildausgabe auf
Text, wodurch der für die nächste Computeraktion benötigte Screenshot verworfen würde.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu einem benutzerdefinierten
Codex-App-Server herstellen, der verzögert geladene dynamische Tools nicht durchsuchen kann, oder wenn Sie
die vollständige Tool-Nutzlast debuggen.

## Zeitüberschreitungen

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt. Jede Codex-Anfrage vom Typ `item/tool/call` verwendet
das erste verfügbare Zeitlimit in dieser Reihenfolge:

- Ein positiver aufrufspezifischer `timeoutMs`-Wert.
- Für `image_generate` gilt `agents.defaults.imageGenerationModel.timeoutMs`.
- Für `image_generate` ohne konfiguriertes Zeitlimit gilt der Standardwert von 120 Sekunden
  für die Bilderzeugung.
- Für das Medienanalyse-Tool `image` gilt `tools.media.image.timeoutSeconds`,
  in Millisekunden umgerechnet, oder der Medienstandardwert von 60 Sekunden. Für die
  Bildanalyse gilt dies für die Anfrage selbst und wird nicht durch
  vorherige Vorbereitungsarbeiten verkürzt.
- Für das Tool `message` gilt ein fester Standardwert von 120 Sekunden.
- Der Standardwert für dynamische Tools von 90 Sekunden.

Dieser Watchdog bildet das äußere Budget für dynamische `item/tool/call`-Aufrufe. Providerspezifische
Anfragezeitlimits laufen innerhalb dieses Aufrufs und behalten ihre eigene Zeitlimitsemantik.
Budgets für dynamische Tools sind auf 600000 ms begrenzt. Bei einer Zeitüberschreitung bricht OpenClaw das
Tool-Signal ab, sofern dies unterstützt wird, und gibt eine fehlgeschlagene Antwort des dynamischen Tools an
Codex zurück, sodass der Turn fortgesetzt werden kann, statt die Sitzung im Zustand
`processing` zu belassen.

Nachdem Codex einen Turn angenommen hat und nachdem OpenClaw auf eine turnbezogene
App-Server-Anfrage geantwortet hat, erwartet das Harness, dass Codex im aktuellen Turn Fortschritte erzielt
und den nativen Turn schließlich mit `turn/completed` abschließt. Wenn der
App-Server für `appServer.turnCompletionIdleTimeoutMs` inaktiv bleibt, unterbricht OpenClaw
nach bestem Bemühen den Codex-Turn, zeichnet eine diagnostische Zeitüberschreitung auf und
gibt die OpenClaw-Sitzungsspur frei, damit nachfolgende Chatnachrichten nicht
hinter einem veralteten nativen Turn eingereiht werden.

Die meisten nicht abschließenden Benachrichtigungen für denselben Turn deaktivieren diesen kurzen Watchdog,
da Codex damit nachgewiesen hat, dass der Turn noch aktiv ist. Tool-Übergaben verwenden ein längeres
Inaktivitätsbudget nach einem Tool: nachdem OpenClaw eine `item/tool/call`-Antwort zurückgegeben hat,
nachdem native Tool-Elemente wie `commandExecution` abgeschlossen wurden, nach dem Abschluss unbearbeiteter
`custom_tool_call_output`-Vorgänge sowie nach unbearbeitetem Assistentenfortschritt,
abgeschlossenen Reasoning-Vorgängen oder Reasoning-Fortschritt nach einem Tool. Der Schutzmechanismus verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn dieser Wert konfiguriert ist, und
standardmäßig andernfalls fünf Minuten. Dasselbe Budget nach einem Tool verlängert außerdem
den Fortschritts-Watchdog für das stille Synthesefenster, bevor Codex das
nächste Ereignis des aktuellen Turns ausgibt. Abgeschlossene Reasoning-Vorgänge, abgeschlossene
`agentMessage`-Kommentare und unbearbeiteter Reasoning- oder Assistentenfortschritt vor einem Tool können
von einer automatischen abschließenden Antwort gefolgt werden. Daher verwenden sie den Antwortschutz
nach Fortschritt, statt die Sitzungsspur sofort freizugeben. Nur abgeschlossene finale bzw. nicht als Kommentar
klassifizierte `agentMessage`-Elemente und unbearbeitete Assistentenabschlüsse vor einem Tool aktivieren die
Freigabe nach Assistentenausgabe: Wenn Codex anschließend ohne `turn/completed` inaktiv bleibt,
unterbricht OpenClaw nach bestem Bemühen den nativen Turn und gibt die Sitzungsspur
frei. Wiedergabesichere Fehler des stdio-App-Servers, einschließlich Inaktivitätszeitüberschreitungen beim
Turn-Abschluss ohne Hinweise auf Assistenten-, Tool-, aktive Elemente oder Nebeneffekte, werden
einmal mit einem neuen App-Server-Versuch wiederholt. Unsichere Zeitüberschreitungen setzen den
hängenden App-Server-Client dennoch außer Betrieb und geben die OpenClaw-Sitzungsspur frei. Außerdem
löschen sie die veraltete native Thread-Bindung, statt automatisch
wiedergegeben zu werden. Zeitüberschreitungen der Abschlussüberwachung zeigen Codex-spezifischen Zeitüberschreitungstext an:
Wiedergabesichere Fälle weisen darauf hin, dass die Antwort möglicherweise unvollständig ist, während unsichere Fälle die
Benutzer auffordern, den aktuellen Zustand vor einem erneuten Versuch zu überprüfen. Öffentliche Zeitüberschreitungsdiagnosen
enthalten strukturelle Felder wie die Methode der letzten App-Server-Benachrichtigung,
ID/Typ/Rolle des unbearbeiteten Assistentenantwortelements, die Anzahl aktiver Anfragen/Elemente und
den Status der aktivierten Überwachung. Wenn die letzte Benachrichtigung ein unbearbeitetes Assistentenantwortelement
ist, enthalten sie außerdem eine begrenzte Vorschau des Assistententextes. Sie enthalten
keine unbearbeiteten Prompt- oder Tool-Inhalte.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Die
Modellverfügbarkeit wird vom Codex-App-Server verwaltet, sodass sich die Liste ändern kann, wenn
OpenClaw die gebündelte Version von `@openai/codex` aktualisiert oder wenn eine Bereitstellung
`appServer.command` auf eine andere Codex-Binärdatei verweist. Die Verfügbarkeit kann außerdem
kontospezifisch sein. Verwenden Sie `/codex models` auf einem laufenden Gateway, um den aktuellen
Katalog für dieses Harness und Konto anzuzeigen.

Wenn die Erkennung fehlschlägt oder das Zeitlimit überschreitet, verwendet OpenClaw einen gebündelten Ausweichkatalog:

| Modell-ID      | Anzeigename   | Reasoning-Stufen         |
| -------------- | ------------- | ------------------------ |
| `gpt-5.5`      | gpt-5.5       | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini  | low, medium, high, xhigh |

<Note>
Das aktuell gebündelte Harness ist `@openai/codex` `0.144.1`. Eine `model/list`-Abfrage
an diesen gebündelten App-Server lieferte die folgenden öffentlichen Auswahlzeilen:

| Modell-ID       | Eingabemodalitäten | Reasoning-Stufen                     |
| ---------------- | ------------------ | ------------------------------------ |
| `gpt-5.6-sol`   | Text, Bild         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | Text, Bild         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | Text, Bild         | low, medium, high, xhigh, max        |
| `gpt-5.5`       | Text, Bild         | low, medium, high, xhigh             |
| `gpt-5.4`       | Text, Bild         | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | Text, Bild         | low, medium, high, xhigh             |
| `gpt-5.2`       | Text, Bild         | low, medium, high, xhigh             |

Der App-Server-Katalog kann `ultra` melden; die Reasoning-Steuerung von OpenClaw stellt derzeit
Stufen bis einschließlich `max` bereit.

Aktuelle Auswahlzeilen sind kontospezifisch und können sich mit dem Konto, dem Codex-
Katalog oder der gebündelten Version ändern. Führen Sie `/codex models` aus, um die aktuelle Liste
abzurufen, statt sich auf eine Momentaufnahme in einer Tabelle zu verlassen. Ausgeblendete Modelle können außerdem im
App-Server-Katalog für interne oder spezialisierte Abläufe erscheinen, ohne normale
Optionen der Modellauswahl zu sein.
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

Deaktivieren Sie die Erkennung, wenn beim Start keine Codex-Abfrage erfolgen und ausschließlich
der Ausweichkatalog verwendet werden soll:

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

## Workspace-Bootstrap-Dateien

Codex verarbeitet `AGENTS.md` selbst über die native Projektdokumenterkennung.
OpenClaw schreibt keine synthetischen Codex-Projektdokumentdateien und ist für Persona-Dateien
nicht von Codex-Ausweichdateinamen abhängig, da Codex-Ausweichdateien nur gelten, wenn
`AGENTS.md` fehlt.

Für die Übereinstimmung mit dem OpenClaw-Workspace leitet das Codex-Harness die anderen
Bootstrap-Dateien als Entwickleranweisungen weiter, jedoch nicht auf identische Weise:

- `TOOLS.md` wird als **vererbte** Codex-Entwickleranweisung weitergeleitet, sodass
  native Codex-Subagenten, die während des Turns gestartet werden, sie ebenfalls sehen.
- `SOUL.md`, `IDENTITY.md` und `USER.md` werden als **turnbezogene**
  Zusammenarbeitsanweisungen weitergeleitet. Native Codex-Subagenten erben sie nicht,
  wodurch verhindert wird, dass Subagenten-Turns die Persona und das
  Benutzerprofil des übergeordneten Agenten übernehmen.
- Die kompakte Liste geladener OpenClaw-Skills wird ebenfalls als turnbezogene
  Entwickleranweisung für die Zusammenarbeit weitergeleitet, sodass native Codex-Subagenten
  auch diese nicht erben.
- Der Inhalt von `HEARTBEAT.md` wird nicht eingefügt; Heartbeat-Turns erhalten im
  Zusammenarbeitsmodus einen Hinweis, die Datei zu lesen, wenn sie vorhanden und
  nicht leer ist.
- Der Inhalt von `MEMORY.md` aus dem konfigurierten Agenten-Workspace wird nicht in
  die Eingabe nativer Codex-Turns eingefügt, wenn Speicher-Tools für diesen
  Workspace verfügbar sind. Wenn die Datei vorhanden ist, fügt das Harness den turnbezogenen
  Entwickleranweisungen für die Zusammenarbeit einen kurzen Hinweis zum Workspace-Speicher hinzu, und Codex
  sollte `memory_search` oder `memory_get` verwenden, wenn dauerhafter Speicher relevant ist.
  Wenn Tools deaktiviert sind, die Speichersuche nicht verfügbar ist oder der aktive
  Workspace vom Agentenspeicher-Workspace abweicht, verwendet `MEMORY.md` stattdessen den
  normalen begrenzten Turn-Kontextpfad.
- `BOOTSTRAP.md` wird, sofern vorhanden, als OpenClaw-Referenzkontext für die Turn-Eingabe
  weitergeleitet.

## Umgebungsüberschreibungen

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Die Konfiguration wird
für reproduzierbare Bereitstellungen bevorzugt, weil dadurch das Verhalten des Plugins in
derselben überprüften Datei wie die übrige Einrichtung des Codex-Harness festgehalten wird.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Codex-Überwachung](/plugins/codex-supervision)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex Computer Use](/de/plugins/codex-computer-use)
- [OpenAI-Provider](/de/providers/openai)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
