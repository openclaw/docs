---
read_when:
    - Sie benötigen jedes Konfigurationsfeld des Codex-Harnesses
    - Sie ändern das Transport-, Authentifizierungs-, Discovery- oder Timeout-Verhalten des App-Servers
    - Sie debuggen den Start des Codex-Harnesses, die Modellerkennung oder die Umgebungsisolierung
summary: Referenz zu Konfiguration, Authentifizierung, Erkennung und App-Server für die Codex-Harness-Umgebung
title: Codex-Harness-Referenz
x-i18n:
    generated_at: "2026-07-16T12:58:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 00dd9050fdc9f2c179012285540f49ada8825f29be1d4630742a4d948a5318a1
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Diese Referenz behandelt die detaillierte Konfiguration für das offizielle `codex`-Plugin.
Informationen zur Einrichtung und zu Routing-Entscheidungen finden Sie zunächst unter
[Codex-Harness](/de/plugins/codex-harness).

## Plugin-Konfigurationsoberfläche

Alle Codex-Harness-Einstellungen befinden sich unter `plugins.entries.codex.config`.

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

| Feld                       | Standard                 | Bedeutung                                                                                                                                      |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | aktiviert                | Einstellungen zur Modellerkennung für Codex-App-Server `model/list`.                                                                           |
| `appServer`                | verwalteter stdio-App-Server | Einstellungen für Transport, Befehl, Authentifizierung, Genehmigung, Sandbox und Zeitüberschreitung. Der reguläre Harness verwendet standardmäßig agentenbezogenen Zustand. |
| `codexDynamicToolsLoading` | `"searchable"`           | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Toolkontext aufzunehmen.                                |
| `codexDynamicToolsExclude` | `[]`                     | Zusätzliche Namen dynamischer OpenClaw-Tools, die bei Codex-App-Server-Turns ausgelassen werden sollen.                                         |
| `codexPlugins`             | deaktiviert              | Native Codex-Plugin-/App-Unterstützung einschließlich optionalem Zugriff auf Apps verbundener Konten. Siehe [Native Codex-Plugins](/de/plugins/codex-native-plugins). |
| `computerUse`              | deaktiviert              | Einrichtung von Codex Computer Use. Siehe [Codex Computer Use](/de/plugins/codex-computer-use).                                                    |
| `sessionCatalog`           | aktiviert                | Native Codex-Sitzungserkennung für die Seitenleiste. Setzen Sie `enabled: false`, um die Erkennung zu deaktivieren, ohne den Provider oder Harness zu deaktivieren. |
| `supervision`              | deaktiviert              | Agentenseitige Richtlinie für Transkripte und Schreibsteuerung nativer Sitzungen. Siehe [Codex-Überwachung](/de/plugins/codex-supervision).         |

## Überwachung

Die native Sitzungserkennung listet standardmäßig nicht archivierte Codex-Sitzungen vom Gateway-
Computer und von dafür freigegebenen gekoppelten Nodes auf. Deaktivieren Sie nur diesen Katalog mit:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          sessionCatalog: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

`supervision` steuert separat die agentenseitigen Tools:

| Feld                  | Standard                | Bedeutung                                                                                                                                                                                                                               |
| --------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | Aktiviert agentenseitige Codex-Überwachungstools. Dies steuert nicht den authentifizierten Katalog der Bedienersitzungen.                                                                                                               |
| `endpoints`           | integrierter lokaler Endpunkt | Kompatibilitäts- und erweiterte Endpunktziele für den beibehaltenen Codex-Überwachungsagenten und eigenständige MCP-Tools. Der Benutzerkatalog und der Branch-Ablauf ignorieren diese Ziele und verwenden den über `appServer` aufgelösten Überwachungs-App-Server. |
| `allowRawTranscripts` | `false`                 | Erlaubt bei aktivierter Überwachung autonomen Agenten oder eigenständigen MCPs das Lesen von Transkripten und daraus abgeleiteten Listenfeldern. Reine Metadaten-Lesezugriffe über `codex_threads` bleiben verfügbar. Steuert nicht die authentifizierte Fortsetzung in der Control UI. |
| `allowWriteControls`  | `false`                 | Erlaubt bei aktivierter Überwachung autonome `codex_threads`-Fork-, Umbenennungs-, Archivierungs- und Wiederherstellungsmutationen sowie Sende-, Steuerungs- und Unterbrechungsvorgänge eigenständiger MCPs. Umgeht keine anderen Bindungs-, Host-, Status- oder Bestätigungsprüfungen. |

Endpunkteinträge akzeptieren folgende Felder:

| Feld           | Gilt für      | Bedeutung                                                             |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | alle          | Stabile Endpunkt-ID.                                                   |
| `label`        | alle          | Optionale Anzeigebezeichnung.                                         |
| `transport`    | alle          | `"stdio-proxy"` oder `"websocket"`.                                   |
| `command`      | `stdio-proxy` | Optionaler App-Server-Befehl.                                         |
| `args`         | `stdio-proxy` | Optionale Befehlsargumente.                                           |
| `cwd`          | `stdio-proxy` | Optionales Arbeitsverzeichnis des untergeordneten Prozesses.          |
| `url`          | `websocket`   | Erforderliche WebSocket- oder unterstützte lokale Socket-URL.         |
| `authTokenEnv` | `websocket`   | Optionale Umgebungsvariable, deren Wert den Endpunkt authentifiziert. |

Die Seite **Codex-Sitzungen** verwendet den Überwachungs-App-Server des Plugins und zeigt
nur nicht archivierte Sitzungen an. Ohne explizite `appServer`-Verbindungseinstellungen
wird diese Verbindung als verwaltetes stdio im Benutzerverzeichnis ausgeführt. Gespeicherte oder inaktive lokale Zeilen können
einen modellgebundenen Chat mit begrenztem Benutzer- und Assistentenverlauf bis zum letzten
terminalen, persistent gespeicherten Quell-Turn erstellen. Seine private Bindung hält den Snapshot-Fork,
den kanonischen `appServer`-Quell-Branch, die Verlaufsinjektion und spätere Turns auf dieser
Verbindung. Beim ersten kanonischen Start wird das vom Fork zurückgegebene Paar verwendet. Bei späteren
Fortsetzungen werden OpenClaw-Modell- und Provider-Überschreibungen ausgelassen, damit Codex das
persistierte Paar des kanonischen Threads wiederherstellt; eine separate native Änderung kann dieses
Paar aktualisieren, aber das äußere Modell und die Fallback-Kette ersetzen es niemals. Gespeicherte und inaktive
Zeilen können nach der Bestätigung, dass kein anderer Runner vorhanden ist, archiviert werden, sofern nicht eine andere aktive
OpenClaw-Bindung das exakte Ziel oder einen seiner nicht archivierten erzeugten
Nachfolger besitzt. OpenClaw folgt der Nachfolger-Paginierung von Codex und bricht bei
Aufzählungsfehlern, Zyklen oder Ausschöpfung des Sicherheitslimits sicher ab. Die Bestätigung deckt weiterhin
unbekannte native Clients und das Race zwischen Status und Archivierung ab. Ein überwachter
modellgebundener Chat kann nicht gelöscht werden, solange er die native Bindung schützt.
Aktive Quellen können keinen Branch erstellen oder archiviert werden, ein vorhandener überwachter
Chat kann jedoch weiterhin geöffnet werden. Jede Zeile eines gekoppelten Nodes bleibt schreibgeschützt; der Node-
Transport stellt den vom Harness benötigten Streaming-Lebenszyklus noch nicht bereit.

`appServer.homeScope: "user"` allein ändert, welches Codex-Benutzerverzeichnis ein verwalteter Harness-
Prozess verwendet; es veröffentlicht nicht den Flottenkatalog. Die Aktivierung der Überwachung
ändert den Harness-Standard nicht. Stattdessen verwendet die separate Überwachungsverbindung
standardmäßig verwaltetes stdio im Benutzerverzeichnis, wenn keine expliziten `appServer`-
Verbindungseinstellungen vorhanden sind. Explizite Einstellungen werden für diese Verbindung berücksichtigt.
Ausstehende und bestätigte überwachte Bindungen behalten diese Verbindung für jeden Turn bei;
deaktivierte Überwachung oder Abweichungen bei Verbindung beziehungsweise Lebenszyklus brechen sicher ab, anstatt
auf den Harness im Agentenverzeichnis zurückzufallen. Die Standardverbindung teilt gespeicherte
Sitzungen mit nativen Codex-Clients, nicht deren prozesslokalen Aktivitätsstatus.

Veraltete `plugins.entries.codex-supervisor`-Einstellungen werden nicht mehr unterstützt. Führen Sie
`openclaw doctor --fix` aus, um den alten Eintrag, Endpunktdefinitionen, Richtlinien-
Flags und Plugin-Zulassungs-/Ablehnungsreferenzen in diesen Block zu migrieren. Explizite kanonische
`codex.config.supervision`-Werte haben bei Konflikten Vorrang.

## App-Server-Transport

Für reguläre Harness-Turns startet OpenClaw die verwaltete Codex-Binärdatei, die
mit dem offiziellen Plugin ausgeliefert wird (derzeit `@openai/codex` `0.144.3`):

```bash
codex app-server --listen stdio://
```

Dadurch bleibt die App-Server-Version an das offizielle `codex`-Plugin gebunden und nicht an
eine beliebige separat lokal installierte Codex-CLI. Setzen Sie
`appServer.command` nur, wenn Sie absichtlich eine andere ausführbare Datei verwenden möchten.
Reguläre verwaltete Turns mit dem standardmäßig isolierten Agentenverzeichnis bevorzugen dieses fixierte
Paket, selbst wenn ein macOS-Desktop-Bundle installiert ist. Wenn
[Computer Use](/de/plugins/codex-computer-use) aktiviert ist oder wenn `homeScope`
`"user"` ist und nativen Computer-Use-Zustand laden kann, bevorzugt der verwaltete Start stattdessen
die Binärdatei der Desktop-App, die über die erforderlichen macOS-Berechtigungen verfügt. Dieselbe
Desktop-zuerst-Regel gilt, wenn die effektive Codex-Konfiguration eines isolierten Agentenverzeichnisses
natives Computer Use aktiviert. Wenn kein Desktop-App-Bundle installiert ist, greift OpenClaw
auf die Binärdatei des fixierten Pakets zurück.

Die Übergabe der ausführbaren Datei und die Abschirmung der nativen Konfiguration koordinieren Clients innerhalb eines
laufenden Gateway-Prozesses. Starten Sie den Gateway neu, nachdem ein anderer Prozess die
native Codex-Plugin-Konfiguration geändert hat.

Die Überwachung löst eine separate Verbindung auf. Ohne explizite
`appServer`-Verbindungseinstellungen verwendet sie verwaltetes stdio mit `homeScope: "user"`;
der reguläre Harness bleibt verwaltetes stdio mit `homeScope: "agent"`. Explizite
Verbindungseinstellungen werden von beiden Pfaden berücksichtigt. Setzen Sie `homeScope: "user"`
explizit, wenn der reguläre Harness `$CODEX_HOME` (oder `~/.codex`)
mit nativen Clients teilen soll. Eine private überwachte Bindung verwendet unabhängig vom
Standard des regulären Harness die Überwachungsverbindung. Unabhängige App-Server-
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

Felder von `appServer`:

| Feld                                          | Standardwert                                            | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` startet Codex; ein explizites `"unix"` stellt eine Verbindung zum lokalen Steuerungssocket her; `"websocket"` stellt eine Verbindung zu `url` her.                                                                                                                                                                                                        |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isoliert den regulären Harness-Zustand pro OpenClaw-Agent. `"user"` ist eine explizite Aktivierung, die das native `$CODEX_HOME` oder `~/.codex` gemeinsam nutzt, native Authentifizierung verwendet und die Thread-Verwaltung ausschließlich für den Eigentümer aktiviert. Der Benutzerbereich unterstützt lokales stdio oder Unix-Transport. Für die separate Überwachungsverbindung wird ein nicht gesetzter Wert bei stdio oder Unix als `"user"` und bei WebSocket als `"agent"` aufgelöst. |
| `command`                                     | verwaltete Codex-Binärdatei                            | Ausführbare Datei für den stdio-Transport. Lassen Sie den Wert nicht gesetzt, um die verwaltete Binärdatei zu verwenden.                                                                                                                                                                                                                                                                         |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumente für den stdio-Transport.                                                                                                                                                                                                                                                                                                                                                              |
| `url`                                         | nicht gesetzt                                          | WebSocket-App-Server-URL oder `unix://`-URL. Ein explizit leerer Unix-Pfad wählt den kanonischen Steuerungssocket im Benutzerverzeichnis aus.                                                                                                                                                                                                                                              |
| `authToken`                                   | nicht gesetzt                                          | Bearer-Token für den WebSocket-Transport. Akzeptiert eine Literalzeichenfolge oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                           |
| `headers`                                     | `{}`                                                   | Zusätzliche WebSocket-Header. Headerwerte akzeptieren Literalzeichenfolgen oder SecretInput-Werte, beispielsweise `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw dessen geerbte Umgebung erstellt hat.                                                                                                                                                                                                                                |
| `remoteWorkspaceRoot`                         | nicht gesetzt                                          | Stammverzeichnis des Arbeitsbereichs des entfernten Codex-App-Servers. Wenn dieser Wert gesetzt ist, leitet OpenClaw das lokale Stammverzeichnis des Arbeitsbereichs aus dem aufgelösten OpenClaw-Arbeitsbereich ab, behält das aktuelle cwd-Suffix unter diesem entfernten Stammverzeichnis bei und sendet nur das endgültige App-Server-cwd an Codex. Wenn sich das cwd außerhalb des aufgelösten Stammverzeichnisses des OpenClaw-Arbeitsbereichs befindet, schlägt OpenClaw sicher fehl, anstatt einen Gateway-lokalen Pfad an den entfernten App-Server zu senden. |
| `loopDetectionPreToolUseRelay`                | `true`                                                 | Installiert den Codex-Unterprozess `PreToolUse`, der ausschließlich für die Schleifenerkennung von OpenClaw und dessen explizite Markierung für fehlende Richtlinien verwendet wird. Setzen Sie `false`, um die Anzahl der Prozesse pro Tool zu reduzieren. Plugin-Hooks vor der Tool-Ausführung und die Richtlinie für vertrauenswürdige Tools installieren weiterhin ihr erforderliches Relay. |
| `requestTimeoutMs`                            | `60000`                                                | Zeitüberschreitung für Aufrufe der App-Server-Steuerungsebene.                                                                                                                                                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ruhefenster, nachdem Codex einen Turn akzeptiert hat oder nachdem eine Turn-bezogene App-Server-Anfrage erfolgt ist, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                               |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Schutz für Abschlussleerlauf und Fortschritt, der nach einer Tool-Übergabe, dem Abschluss eines nativen Tools, einem Rohfortschritt des Assistenten nach dem Tool, dem Abschluss der Rohschlussfolgerung oder einem Schlussfolgerungsfortschritt verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder rechenintensive Arbeitslasten, bei denen die Synthese nach dem Tool berechtigterweise länger still bleiben kann als das Freigabebudget des abschließenden Assistenten. |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht zulassen | Voreinstellung für YOLO oder durch einen Guardian geprüfte Ausführung.                                                                                                                                                                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` oder eine zulässige Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die beim Start und Fortsetzen eines Threads sowie bei einem Turn gesendet wird.                                                                                                                                                                                                                                                                             |
| `sandbox`                                     | `"danger-full-access"` oder eine zulässige Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der beim Start und Fortsetzen eines Threads gesendet wird. Aktive OpenClaw-Sandboxes beschränken `danger-full-access`-Turns auf Codex `workspace-write`; das Netzwerk-Flag des Turns richtet sich nach dem ausgehenden Netzwerkverkehr der OpenClaw-Sandbox.                                                                                                                  |
| `approvalsReviewer`                           | `"user"` oder ein zulässiger Guardian-Prüfer            | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, sofern dies zulässig ist.                                                                                                                                                                                                                                                                                  |
| `defaultWorkspaceDir`                         | aktuelles Prozessverzeichnis                            | Von `/codex bind` verwendeter Arbeitsbereich, wenn `--cwd` nicht angegeben wird.                                                                                                                                                                                                                                                                                                |
| `serviceTier`                                 | nicht gesetzt                                          | Optionale Dienstklasse des Codex-App-Servers. `"priority"` aktiviert das Routing im Schnellmodus, `"flex"` fordert die Flex-Verarbeitung an und `null` löscht die Überschreibung. Das veraltete `"fast"` wird als `"priority"` akzeptiert.                                                                                                                     |
| `networkProxy`                                | deaktiviert                                            | Aktiviert die Netzwerkfunktion des Codex-Berechtigungsprofils für App-Server-Befehle. OpenClaw definiert die ausgewählte `permissions.<profile>.network`-Konfiguration und wählt sie mit `default_permissions` aus, anstatt `sandbox` zu senden.                                                                                                                                                              |
| `experimental.sandboxExecServer`              | `false`                                                | Vorschauaktivierung, die eine durch die OpenClaw-Sandbox gestützte Codex-Umgebung beim unterstützten Codex-App-Server registriert, sodass die native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox ausgeführt werden kann.                                                                                                                                                               |

`appServer.networkProxy` ist explizit, da es den Codex-Sandbox-Vertrag
ändert. Wenn diese Option aktiviert ist, setzt OpenClaw außerdem `features.network_proxy.enabled` und
`default_permissions` in der Codex-Thread-Konfiguration, damit das generierte
Berechtigungsprofil die von Codex verwaltete Netzwerkfunktion starten kann. OpenClaw generiert
standardmäßig aus dem Profilinhalt einen kollisionsresistenten Profilnamen
`openclaw-network-<fingerprint>`; verwenden Sie `profileName` nur, wenn ein stabiler lokaler Name
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

Wenn die normale App-Server-Laufzeit `danger-full-access` wäre, verwendet die Aktivierung
von `networkProxy` stattdessen einen arbeitsbereichsähnlichen Dateisystemzugriff für das generierte
Berechtigungsprofil. Die von Codex verwaltete Netzwerkdurchsetzung ist eine Sandbox-
Netzwerkfunktion, daher würde ein Profil mit vollständigem Zugriff ausgehenden Datenverkehr nicht schützen.

Das Plugin blockiert ältere oder nicht versionierte App-Server-Handshakes: Der Codex-App-Server
muss die stabile Version `0.143.0` oder neuer melden.

OpenClaw behandelt WebSocket-App-Server-URLs, die nicht auf Loopback verweisen, als remote und erfordert
identitätstragende WebSocket-Authentifizierung über `appServer.authToken` oder einen
`Authorization`-Header. `appServer.authToken` und jeder `appServer.headers.*`-
Wert können eine SecretInput sein; die Secrets-Laufzeit löst SecretRefs und Env-
Kurzformen auf, bevor OpenClaw die Startoptionen des App-Servers erstellt, und nicht aufgelöste
strukturierte SecretRefs führen zu einem Fehler, bevor ein Token oder Header gesendet wird. Wenn native
Codex-Plugins konfiguriert sind, verwendet OpenClaw die Plugin-Steuerungsebene des verbundenen App-Servers,
um diese Plugins zu installieren oder zu aktualisieren, und aktualisiert anschließend das App-
Inventar, damit Plugin-eigene Apps für den Codex-Thread sichtbar sind. `app/list` ist
weiterhin die maßgebliche Quelle für Inventar und Metadaten, aber die OpenClaw-Richtlinie
entscheidet, ob `thread/start` für eine
aufgeführte zugängliche App `config.apps[appId].enabled = true` sendet, auch wenn Codex sie derzeit als deaktiviert markiert. Unbekannte oder
fehlende App-IDs bleiben nach dem Fail-Closed-Prinzip gesperrt; dieser Pfad aktiviert ausschließlich Marketplace-
Plugins über `plugin/install` und aktualisiert das Inventar. Verbinden Sie OpenClaw nur mit
Remote-App-Servern, denen Sie vertrauen, von OpenClaw verwaltete Plugin-Installationen
und Aktualisierungen des App-Inventars anzunehmen.

## Genehmigungs- und Sandbox-Modi

Lokale stdio-App-Server-Sitzungen verwenden standardmäßig den YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Diese vertrauenswürdige lokale Betreiberkonfiguration ermöglicht es
unbeaufsichtigten OpenClaw-Turns und Heartbeats, ohne native Genehmigungs-
aufforderungen fortzufahren, die niemand beantworten kann.

Wenn die lokale Datei mit Codex-Systemanforderungen implizite YOLO-Genehmigungs-,
Reviewer- oder Sandbox-Werte nicht zulässt, behandelt OpenClaw den impliziten Standard
stattdessen als Guardian und wählt zulässige Guardian-Berechtigungen aus. `tools.exec.mode: "auto"`
erzwingt ebenfalls durch Guardian geprüfte Codex-Genehmigungen und behält unsichere
Legacy-Überschreibungen für `approvalPolicy: "never"` oder `sandbox: "danger-full-access"` nicht bei;
setzen Sie `tools.exec.mode: "full"` für eine bewusst gewählte Konfiguration ohne Genehmigungen.
Mit dem Hostnamen übereinstimmende `[[remote_sandbox_config]]`-Einträge in derselben Anforderungsdatei
werden bei der Entscheidung über den Sandbox-Standard berücksichtigt.

Setzen Sie `appServer.mode: "guardian"` für durch Codex Guardian geprüfte Genehmigungen:

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
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert, wenn diese
Werte zulässig sind. Einzelne Richtlinienfelder überschreiben `mode`. Der ältere
Reviewer-Wert `guardian_subagent` wird weiterhin als Kompatibilitätsalias akzeptiert,
neue Konfigurationen sollten jedoch `auto_review` verwenden.

Wenn eine OpenClaw-Sandbox aktiv ist, wird der lokale Codex-App-Server-Prozess weiterhin
auf dem Gateway-Host ausgeführt. OpenClaw deaktiviert daher für diesen Turn den nativen Code Mode von Codex,
benutzerdefinierte MCP-Server und die App-gestützte Plugin-Ausführung, statt
die Codex-hostseitige Sandbox als gleichwertig mit dem OpenClaw-Sandbox-
Backend zu behandeln. Der Shell-Zugriff wird über dynamische, durch die OpenClaw-Sandbox gestützte Tools
wie `sandbox_exec` und `sandbox_process` bereitgestellt, wenn die normalen exec/process-Tools
verfügbar sind.

<Note>
Auf Docker-gestützten OpenClaw-Sandbox-Hosts (`agents.defaults.sandbox.mode` ist auf
ein Docker-Backend gesetzt) prüft `openclaw doctor`, ob der Host die
Namespaces für unprivilegierte Benutzer und – wenn der Netzwerk-Egress der Docker-Sandbox deaktiviert ist –
für Netzwerke zulässt, die das verschachtelte Codex `bwrap` für die `workspace-write`-
Shell-Ausführung innerhalb des Sandbox-Containers benötigt. Eine fehlgeschlagene Prüfung äußert sich
auf Ubuntu-/AppArmor-Hosts normalerweise als `bwrap: setting up uid map: Permission denied` oder
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`.
Korrigieren Sie die gemeldete Host-Namespace-Richtlinie für den OpenClaw-
Dienstbenutzer und starten Sie das Gateway neu; bevorzugen Sie für den
Dienstprozess ein begrenztes AppArmor-Profil gegenüber dem hostweiten
Fallback `kernel.apparmor_restrict_unprivileged_userns=0`, und gewähren Sie
keine umfassenderen Docker-Containerberechtigungen, nur um die Anforderungen des verschachtelten `bwrap` zu erfüllen.
</Note>

## Native Ausführung in der Sandbox

Der stabile Standard ist Fail-Closed: Eine aktive OpenClaw-Sandbox deaktiviert native
Codex-Ausführungsoberflächen, die andernfalls vom Host des Codex-App-Servers aus ausgeführt würden.
Verwenden Sie `appServer.experimental.sandboxExecServer: true` nur, wenn Sie
die Unterstützung für Remote-Umgebungen von Codex mit dem Sandbox-Backend von OpenClaw ausprobieren möchten.
Dieser Vorschaupfad funktioniert mit jeder unterstützten Version des Codex-App-Servers.

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
einen lokalen Loopback-Exec-Server, der durch die aktive Sandbox gestützt wird, registriert ihn
beim Codex-App-Server und startet den Codex-Thread und -Turn mit dieser
OpenClaw-eigenen Umgebung. Wenn der App-Server die Umgebung nicht registrieren kann,
schlägt die Ausführung nach dem Fail-Closed-Prinzip fehl, statt stillschweigend auf die Host-Ausführung zurückzufallen.

Dieser Vorschaupfad ist ausschließlich lokal. Ein Remote-WebSocket-App-Server kann den
Loopback-Exec-Server nur erreichen, wenn er auf demselben Host ausgeführt wird, daher lehnt OpenClaw
diese Kombination ab.

## Authentifizierungs- und Umgebungsisolation

Im standardmäßigen agentenspezifischen Home-Verzeichnis wird die Authentifizierung in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das bestehende Konto des App-Servers im Codex-Home-Verzeichnis dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, danach
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und weiterhin eine OpenAI-Authentifizierung
   erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt (OAuth- oder
Token-Anmeldeinformationstyp), entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY` aus
dem gestarteten Codex-Unterprozess. Dadurch bleiben API-Schlüssel auf Gateway-Ebene
für Einbettungen oder direkte OpenAI-Modelle verfügbar, ohne dass native Codex-App-Server-
Turns versehentlich über die API abgerechnet werden.

Explizite Codex-API-Schlüsselprofile und der lokale stdio-Fallback auf Umgebungsvariablen-Schlüssel verwenden
die App-Server-Anmeldung statt der geerbten Umgebung des Unterprozesses. WebSocket-App-Server-
Verbindungen erhalten keinen Fallback auf Gateway-API-Schlüssel aus der Umgebung; verwenden Sie ein explizites Authentifizierungsprofil
oder das eigene Konto des Remote-App-Servers.

Starts des stdio-App-Servers erben standardmäßig die Prozessumgebung von OpenClaw.
OpenClaw verwaltet die Kontobrücke des Codex-App-Servers und setzt `CODEX_HOME` auf ein
agentenspezifisches Verzeichnis im OpenClaw-Status dieses Agenten. Dadurch bleiben Codex-
Konfiguration, Konten, Plugin-Cache/-Daten und Thread-Status auf den OpenClaw-
Agenten begrenzt, statt aus dem persönlichen `~/.codex`-Home-Verzeichnis des Betreibers übernommen zu werden.

Setzen Sie `appServer.homeScope: "user"`, um den nativen Codex-Status mit Codex
Desktop und der CLI zu teilen. Dieser lokale Benutzer-Home-Modus unterstützt verwaltetes stdio und
expliziten Unix-Transport. Er verwendet `$CODEX_HOME`, wenn dieser Wert gesetzt ist, andernfalls `~/.codex`,
einschließlich nativer Authentifizierung, Konfiguration, Plugins und Threads.
OpenClaw überspringt für den App-Server seine Authentifizierungsprofilbrücke. Verifizierte Besitzer-
Turns können `codex_threads` verwenden, um diese Threads aufzulisten (mit einem optionalen `search`-Filter),
zu lesen, zu forken, umzubenennen, zu archivieren und die Archivierung aufzuheben. Forken Sie einen Thread, bevor
Sie ihn in OpenClaw fortsetzen; unabhängige Codex-Prozesse koordinieren
gleichzeitige Schreibzugriffe auf denselben Thread nicht.

Diese `homeScope`-Aktivierung gilt für gewöhnliche Harness-Sitzungen. Ein über
Codex Sessions erstellter Chat verwendet stattdessen seine private Überwachungsverbindung, wodurch
die Authentifizierungs- und Provider-Konfiguration der nativen Verbindung für den
kanonischen Branch und zukünftige Fortsetzungen erhalten bleibt.

In einem modellgebundenen überwachten Chat kann `codex_threads` keinen anderen
Fork anhängen oder den gebundenen nativen Thread des Chats archivieren. Auflisten und ausschließliches Lesen von Metadaten
bleiben verfügbar. Das Lesen von Rohtranskripten erfordert `allowRawTranscripts`; wenn diese Option
deaktiviert ist, wird auch die Listensuche abgelehnt, da die native Suche
Transkriptvorschauen abgleichen kann. Umbenennen, Aufheben der Archivierung, getrenntes Forken und Archivieren eines
nicht zugehörigen Threads, der keinem anderen OpenClaw-Chat gehört, erfordern
`allowWriteControls`. Keine der beiden Optionen umgeht eine gesperrte Bindung.

OpenClaw schreibt `HOME` bei normalen lokalen App-Server-Starts nicht um.
Von Codex ausgeführte Unterprozesse wie `openclaw`, `gh`, `git`, Cloud-CLIs und Shell-
Befehle sehen das normale Prozess-Home-Verzeichnis und können Konfigurationen und
Token im Benutzer-Home-Verzeichnis finden. Codex kann außerdem `$HOME/.agents/skills` und
`$HOME/.agents/plugins/marketplace.json` erkennen; diese `.agents`-Erkennung wird
bewusst mit dem Home-Verzeichnis des Betreibers geteilt und ist vom isolierten
`~/.codex`-Status getrennt.

Im standardmäßigen Agentenbereich werden OpenClaw-Plugins und OpenClaw-Skill-Snapshots
weiterhin über die OpenClaw-eigene Plugin-Registry und den Skill-Loader bereitgestellt; persönliche
Codex-`~/.codex`-Assets hingegen nicht. Wenn Sie nützliche Codex-CLI-Skills oder
Plugins aus einem Codex-Home-Verzeichnis haben, die Teil eines isolierten OpenClaw-
Agenten werden sollen, inventarisieren Sie sie explizit:

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

`appServer.clearEnv` wirkt sich nur auf den gestarteten Unterprozess des Codex-App-Servers aus.
OpenClaw entfernt `CODEX_HOME` und `HOME` während der lokalen Start-
normalisierung aus dieser Liste: `CODEX_HOME` verweist weiterhin auf den ausgewählten Agenten- oder Benutzerbereich,
und `HOME` wird weiterhin geerbt, damit Unterprozesse den normalen Status im Benutzer-Home-Verzeichnis verwenden können.

## Dynamische Tools

Dynamische Codex-Tools verwenden standardmäßig das Laden über `searchable` und werden im
Namespace `openclaw` mit `deferLoading: true` bereitgestellt. OpenClaw stellt normalerweise keine
dynamischen Tools bereit, die Codex-native Arbeitsbereichsoperationen oder
die eigene Tool-Suchoberfläche von Codex duplizieren:

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

Wenn eine endliche Laufzeit-Zulassungsliste den nativen Code Mode deaktiviert, sendet OpenClaw eine
leere Auswahl der Ausführungsumgebung. In diesem direkten Fall ohne Sandbox
behält OpenClaw seine richtliniengefilterten Tools `exec` und `process` als Shell-
Fallback bei. Laufzeit-Zulassungslisten und `codexDynamicToolsExclude` gelten weiterhin.

Die meisten übrigen OpenClaw-Integrationstools, etwa für Messaging, Medien, Cron,
Browser, Nodes, Gateway, `heartbeat_respond` und `web_search`, sind
über die Codex-Tool-Suche unter diesem Namespace verfügbar. Dadurch bleibt der
anfängliche Modellkontext kleiner. Eine kleine Gruppe von Tools bleibt unabhängig
von `codexDynamicToolsLoading` direkt aufrufbar, da die Codex-Tool-Suche möglicherweise
nicht verfügbar ist oder ausschließlich Connectoren auflösen kann:
`agents_list`, `sessions_spawn` und `sessions_yield`.
Entwickleranweisungen lenken normale Codex-Subagenten für Codex-native
Subagentenarbeit weiterhin zu nativem `spawn_agent`, während
`sessions_spawn` für die explizite Delegation an OpenClaw oder ACP verfügbar
bleibt. Ausschließlich vom Nachrichten-Tool stammende Antworten bleiben ebenfalls
direkt, da dies ein Vertrag zur Ablaufsteuerung von Turns ist.

Mit `catalogMode: "direct-only"` gekennzeichnete Tools, einschließlich des OpenClaw-Tools
`computer`, werden unter `openclaw_direct` gruppiert. OpenClaw fügt
diesen Namespace zur Liste `code_mode.direct_only_tool_namespaces` von Codex hinzu, ohne
betreiberseitig bereitgestellte Einträge zu ersetzen. Codex stellt diese Tools
daher in normalen und ausschließlich für den Code-Modus bestimmten Threads als
`DirectModelOnly` bereit, statt sie durch verschachtelte Code-Mode-Aufrufe von
`tools.*` zu leiten. Diese Grenze ist für Ergebnisse mit Bildern
erforderlich: Die verschachtelte Code-Mode-Serialisierung reduziert die
Bildausgabe auf Text, wodurch der für die nächste Computeraktion benötigte
Screenshot verloren ginge.

Legen Sie `codexDynamicToolsLoading: "direct"` nur fest, wenn Sie eine Verbindung zu einem
benutzerdefinierten Codex-App-Server herstellen, der nicht nach zurückgestellten
dynamischen Tools suchen kann, oder wenn Sie die vollständige Tool-Nutzlast
debuggen.

## Zeitüberschreitungen

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt. Jede Codex-Anfrage `item/tool/call` verwendet
die erste verfügbare Zeitüberschreitung in dieser Reihenfolge:

- Ein positives aufrufspezifisches Argument `timeoutMs`.
- Für `image_generate`: `agents.defaults.imageGenerationModel.timeoutMs`.
- Für `image_generate` ohne konfigurierte Zeitüberschreitung: der Standardwert
  von 120 Sekunden für die Bilderzeugung.
- Für das Medienanalyse-Tool `image`: `tools.media.image.timeoutSeconds`,
  in Millisekunden umgerechnet, oder der Medienstandardwert von 60 Sekunden.
  Bei der Bildanalyse gilt dies für die Anfrage selbst und wird nicht durch
  vorherige Vorbereitungsarbeiten reduziert.
- Für das Tool `message`: ein fester Standardwert von 120 Sekunden.
- Der Standardwert von 90 Sekunden für dynamische Tools.

Dieser Watchdog bildet das äußere dynamische Budget für `item/tool/call`.
Provider-spezifische Anfragezeitüberschreitungen laufen innerhalb dieses Aufrufs
und behalten ihre eigene Zeitüberschreitungssemantik bei. Budgets dynamischer
Tools sind auf 600000 ms begrenzt. Bei einer Zeitüberschreitung bricht OpenClaw
das Tool-Signal ab, sofern dies unterstützt wird, und gibt eine fehlgeschlagene
Antwort des dynamischen Tools an Codex zurück, damit der Turn fortgesetzt werden
kann, statt die Sitzung in `processing` zu belassen.

Nachdem Codex einen Turn akzeptiert hat und nachdem OpenClaw auf eine
turnbezogene App-Server-Anfrage geantwortet hat, erwartet das Harness, dass Codex
im aktuellen Turn Fortschritte erzielt und den nativen Turn schließlich mit
`turn/completed` beendet. Wenn der App-Server für `appServer.turnCompletionIdleTimeoutMs` inaktiv
bleibt, unterbricht OpenClaw den Codex-Turn nach bestem Bemühen, zeichnet eine
diagnostische Zeitüberschreitung auf und gibt die OpenClaw-Sitzungsspur frei,
damit nachfolgende Chatnachrichten nicht hinter einem veralteten nativen Turn
eingereiht werden.

Die meisten nicht abschließenden Benachrichtigungen desselben Turns deaktivieren
diesen kurzen Watchdog, da Codex nachgewiesen hat, dass der Turn noch aktiv ist.
Tool-Übergaben verwenden ein längeres Leerlaufbudget nach der Tool-Ausführung:
nachdem OpenClaw eine Antwort `item/tool/call` zurückgegeben hat, nachdem native
Tool-Elemente wie `commandExecution` abgeschlossen wurden, nach dem Abschluss
unverarbeiteter `custom_tool_call_output` sowie nach unverarbeitetem
Assistentenfortschritt nach einem Tool, abgeschlossenen unverarbeiteten
Reasoning-Vorgängen oder Reasoning-Fortschritt. Die Schutzvorrichtung verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn dies konfiguriert ist, und andernfalls standardmäßig
fünf Minuten. Dasselbe Budget nach einem Tool verlängert außerdem den
Fortschritts-Watchdog für das stille Synthesefenster, bevor Codex das nächste
Ereignis des aktuellen Turns ausgibt. Abgeschlossene Reasoning-Vorgänge,
abgeschlossene Commentary-Vorgänge `agentMessage` und unverarbeiteter
Reasoning- oder Assistentenfortschritt vor einem Tool können von einer
automatischen abschließenden Antwort gefolgt werden; daher verwenden sie die
Antwortschutzvorrichtung nach einem Fortschritt, statt die Sitzungsspur sofort
freizugeben. Nur abgeschlossene finale bzw. nicht als Commentary klassifizierte
Elemente `agentMessage` und abgeschlossene unverarbeitete
Assistentenausgaben vor einem Tool aktivieren die Freigabe nach
Assistentenausgabe: Wenn Codex anschließend ohne `turn/completed` inaktiv
bleibt, unterbricht OpenClaw den nativen Turn nach bestem Bemühen und gibt die
Sitzungsspur frei. Wiederholungssichere Fehler des stdio-App-Servers,
einschließlich Leerlaufzeitüberschreitungen beim Turn-Abschluss ohne Hinweise
auf Assistenten-, Tool-, aktive Element- oder Nebeneffektaktivität, werden bei
einem neuen App-Server-Versuch einmal wiederholt. Unsichere
Zeitüberschreitungen setzen den blockierten App-Server-Client dennoch außer
Betrieb und geben die OpenClaw-Sitzungsspur frei. Außerdem löschen sie die
veraltete native Thread-Bindung, statt automatisch wiederholt zu werden.
Zeitüberschreitungen der Abschlussüberwachung zeigen Codex-spezifischen
Zeitüberschreitungstext an: In wiederholungssicheren Fällen wird darauf
hingewiesen, dass die Antwort möglicherweise unvollständig ist, während
unsichere Fälle die Person auffordern, vor einem erneuten Versuch den aktuellen
Zustand zu überprüfen. Öffentliche Zeitüberschreitungsdiagnosen enthalten
strukturierte Felder wie die Methode der letzten App-Server-Benachrichtigung,
ID, Typ und Rolle des unverarbeiteten Assistentenantwortelements, die Anzahl
aktiver Anfragen und Elemente sowie den aktivierten Überwachungszustand. Wenn
die letzte Benachrichtigung ein unverarbeitetes Assistentenantwortelement ist,
enthalten sie außerdem eine begrenzte Vorschau des Assistententexts. Sie
enthalten keine unverarbeiteten Prompt- oder Tool-Inhalte.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen.
Die Modellverfügbarkeit wird vom Codex-App-Server verwaltet, daher kann sich die
Liste ändern, wenn OpenClaw die gebündelte Version `@openai/codex`
aktualisiert oder wenn eine Bereitstellung `appServer.command` auf eine andere
Codex-Binärdatei verweist. Die Verfügbarkeit kann außerdem kontospezifisch sein.
Verwenden Sie `/codex models` auf einem laufenden Gateway, um den aktuellen
Katalog für dieses Harness und Konto anzuzeigen.

Wenn die Erkennung fehlschlägt oder eine Zeitüberschreitung auftritt, verwendet
OpenClaw einen gebündelten Ausweichkatalog:

| Modell-ID      | Anzeigename  | Reasoning-Stufen         |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
Das aktuell gebündelte Harness ist `@openai/codex` `0.144.3`. Eine
`model/list`-Abfrage dieses gebündelten App-Servers lieferte die folgenden
öffentlichen Zeilen der Modellauswahl:

| Modell-ID       | Eingabemodalitäten | Reasoning-Stufen                     |
| --------------- | ------------------ | ------------------------------------ |
| `gpt-5.6-sol`   | Text, Bild         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | Text, Bild         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | Text, Bild         | low, medium, high, xhigh, max        |
| `gpt-5.5`       | Text, Bild         | low, medium, high, xhigh             |
| `gpt-5.4`       | Text, Bild         | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | Text, Bild         | low, medium, high, xhigh             |
| `gpt-5.2`       | Text, Bild         | low, medium, high, xhigh             |

Der App-Server-Katalog kann `ultra` melden; die Reasoning-Steuerung
von OpenClaw stellt derzeit Stufen bis `max` bereit.

Aktuelle Zeilen der Modellauswahl sind kontospezifisch und können sich mit dem
Konto, dem Codex-Katalog oder der gebündelten Version ändern. Führen Sie
`/codex models` aus, um die aktuelle Liste abzurufen, statt sich auf eine
Momentaufnahme in einer Tabelle zu verlassen. Ausgeblendete Modelle können
außerdem im App-Server-Katalog für interne oder spezialisierte Abläufe erscheinen,
ohne normale Auswahlmöglichkeiten in der Modellauswahl zu sein.
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

Deaktivieren Sie die Erkennung, wenn der Start Codex nicht abfragen und
ausschließlich den Ausweichkatalog verwenden soll:

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

Codex verarbeitet `AGENTS.md` selbst über die native Erkennung von
Projektdokumenten. OpenClaw schreibt keine synthetischen
Codex-Projektdokumentdateien und ist für Persona-Dateien nicht von
Codex-Ausweichdateinamen abhängig, da Codex-Ausweichdateien nur verwendet
werden, wenn `AGENTS.md` fehlt.

Für die Übereinstimmung mit dem OpenClaw-Workspace leitet das Codex-Harness die
anderen Bootstrap-Dateien als Entwickleranweisungen weiter, jedoch nicht
identisch:

- `TOOLS.md` wird als **vererbte**
Codex-Entwickleranweisung weitergeleitet, sodass während des Turns gestartete
native Codex-Subagenten sie ebenfalls sehen.
- `SOUL.md`, `IDENTITY.md` und
`USER.md` werden als **turnbezogene** Anweisungen zur Zusammenarbeit
weitergeleitet. Native Codex-Subagenten erben sie nicht, wodurch verhindert
wird, dass Subagenten-Turns die Persona und das Benutzerprofil des
übergeordneten Agenten übernehmen.
- Die kompakte Liste geladener OpenClaw-Skills wird ebenfalls als
turnbezogene Entwickleranweisung zur Zusammenarbeit weitergeleitet, sodass
native Codex-Subagenten auch diese nicht erben.
- Der Inhalt von `HEARTBEAT.md` wird nicht eingefügt;
Heartbeat-Turns erhalten im Zusammenarbeitsmodus einen Hinweis, die Datei zu
lesen, wenn sie vorhanden und nicht leer ist.
- Der Inhalt von `MEMORY.md` aus dem konfigurierten
Agenten-Workspace wird nicht in die Eingabe nativer Codex-Turns eingefügt, wenn
für diesen Workspace Speicher-Tools verfügbar sind. Wenn er vorhanden ist,
fügt das Harness den turnbezogenen Entwickleranweisungen zur Zusammenarbeit
einen kurzen Hinweis auf den Workspace-Speicher hinzu, und Codex sollte
`memory_search` oder `memory_get` verwenden, wenn dauerhafter Speicher
relevant ist. Wenn Tools deaktiviert sind, die Speichersuche nicht verfügbar
ist oder sich der aktive Workspace vom Speicher-Workspace des Agenten
unterscheidet, verwendet `MEMORY.md` stattdessen den normalen begrenzten
Turn-Kontextpfad.
- `BOOTSTRAP.md` wird, sofern vorhanden, als
OpenClaw-Referenzkontext für die Turn-Eingabe weitergeleitet.

## Umgebungsüberschreibungen

Umgebungsüberschreibungen bleiben für lokale Tests verfügbar:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` umgeht die verwaltete Binärdatei, wenn
`appServer.command` nicht festgelegt ist.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` wurde entfernt. Verwenden Sie stattdessen
`plugins.entries.codex.config.appServer.mode: "guardian"` oder `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Für
reproduzierbare Bereitstellungen wird die Konfiguration bevorzugt, da das
Plugin-Verhalten dadurch in derselben geprüften Datei wie die übrige
Einrichtung des Codex-Harness verbleibt.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Codex-Überwachung](/de/plugins/codex-supervision)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex Computer Use](/de/plugins/codex-computer-use)
- [OpenAI-Provider](/de/providers/openai)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
