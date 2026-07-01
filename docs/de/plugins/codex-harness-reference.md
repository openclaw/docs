---
read_when:
    - Sie benötigen jedes Codex-Harness-Konfigurationsfeld
    - Sie ändern das Transport-, Authentifizierungs-, Discovery- oder Timeout-Verhalten des App-Servers
    - Sie debuggen den Start des Codex-Harness, die Modellerkennung oder die Umgebungsisolation
summary: Konfiguration, Authentifizierung, Discovery und App-Server-Referenz für den Codex-Harness
title: Codex-Harness-Referenz
x-i18n:
    generated_at: "2026-07-01T07:56:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02dd72f9d85d2ea5fa45533a402d640786f17bdbe2242b7c1b8cd99405561a25
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Diese Referenz behandelt die detaillierte Konfiguration für das gebündelte `codex`-Plugin. Beginnen Sie für Einrichtung und Routing-Entscheidungen mit
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

Unterstützte Felder auf oberster Ebene:

| Feld                       | Standardwert             | Bedeutung                                                                                                                                                          |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `discovery`                | aktiviert                | Einstellungen für die Modellerkennung für Codex-App-Server `model/list`.                                                                                          |
| `appServer`                | verwalteter stdio-App-Server | Transport-, Befehls-, Authentifizierungs-, Genehmigungs-, Sandbox- und Timeout-Einstellungen.                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`           | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den initialen Codex-Toolkontext zu legen.                                                        |
| `codexDynamicToolsExclude` | `[]`                     | Zusätzliche Namen dynamischer OpenClaw-Tools, die in Codex-App-Server-Turns ausgelassen werden sollen.                                                            |
| `codexPlugins`             | deaktiviert              | Native Codex-Plugin/App-Unterstützung für migrierte, aus dem Quellcode installierte kuratierte Plugins. Siehe [Native Codex-Plugins](/de/plugins/codex-native-plugins). |
| `computerUse`              | deaktiviert              | Codex-Computer-Use-Einrichtung. Siehe [Codex Computer Use](/de/plugins/codex-computer-use).                                                                           |

## App-Server-Transport

Standardmäßig startet OpenClaw die verwaltete Codex-Binärdatei, die mit dem gebündelten Plugin ausgeliefert wird:

```bash
codex app-server --listen stdio://
```

Dadurch bleibt die App-Server-Version an das gebündelte `codex`-Plugin gebunden, statt an eine beliebige separat lokal installierte Codex-CLI. Setzen Sie `appServer.command` nur, wenn Sie absichtlich eine andere ausführbare Datei ausführen möchten.

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

Unterstützte `appServer`-Felder:

| Feld                                          | Standardwert                                          | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                                   | `"stdio"`                                             | `"stdio"` startet Codex; `"websocket"` verbindet sich mit `url`.                                                                                                                                                                                                                                                                                                                                                   |
| `command`                                     | verwaltete Codex-Binärdatei                          | Ausführbare Datei für stdio-Transport. Nicht setzen, um die verwaltete Binärdatei zu verwenden.                                                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argumente für stdio-Transport.                                                                                                                                                                                                                                                                                                                                                                                     |
| `url`                                         | nicht gesetzt                                         | WebSocket-App-Server-URL.                                                                                                                                                                                                                                                                                                                                                                                          |
| `authToken`                                   | nicht gesetzt                                         | Bearer-Token für WebSocket-Transport. Akzeptiert eine Literal-Zeichenfolge oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                                       |
| `headers`                                     | `{}`                                                  | Zusätzliche WebSocket-Header. Header-Werte akzeptieren Literal-Zeichenfolgen oder SecretInput-Werte, zum Beispiel `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                 |
| `clearEnv`                                    | `[]`                                                  | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat.                                                                                                                                                                                                                                                  |
| `remoteWorkspaceRoot`                         | nicht gesetzt                                         | Remote-Workspace-Wurzel des Codex-App-Servers. Wenn gesetzt, leitet OpenClaw die lokale Workspace-Wurzel aus dem aufgelösten OpenClaw-Workspace ab, behält das aktuelle cwd-Suffix unter dieser Remote-Wurzel bei und sendet nur das finale App-Server-cwd an Codex. Wenn das cwd außerhalb der aufgelösten OpenClaw-Workspace-Wurzel liegt, schlägt OpenClaw geschlossen fehl, statt einen Gateway-lokalen Pfad an den Remote-App-Server zu senden. |
| `requestTimeoutMs`                            | `60000`                                               | Timeout für Control-Plane-Aufrufe des App-Servers.                                                                                                                                                                                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Ruhefenster, nachdem Codex einen Turn akzeptiert hat oder nach einer Turn-bezogenen App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                                                               |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Abschluss-Leerlauf- und Fortschrittswächter, der nach einer Tool-Übergabe, dem Abschluss nativer Tools, unverarbeitetem Assistant-Fortschritt nach einem Tool, Abschluss unverarbeiteten Reasonings oder Reasoning-Fortschritt verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder schwere Workloads, bei denen die Synthese nach Tools berechtigterweise länger ruhig bleiben kann als das Budget für die finale Assistant-Ausgabe. |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht verbieten | Preset für YOLO- oder durch Guardian geprüfte Ausführung.                                                                                                                                                                                                                                                                                                                                                          |
| `approvalPolicy`                              | `"never"` oder eine erlaubte Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die an Thread-Start, Fortsetzen und Turn gesendet wird.                                                                                                                                                                                                                                                                                                                        |
| `sandbox`                                     | `"danger-full-access"` oder eine erlaubte Guardian-Sandbox | Nativer Codex-Sandboxmodus, der an Thread-Start und Fortsetzen gesendet wird. Aktive OpenClaw-Sandboxes verengen `danger-full-access`-Turns auf Codex `workspace-write`; das Netzwerk-Flag des Turns folgt dem OpenClaw-Sandbox-Egress.                                                                                                                                                                             |
| `approvalsReviewer`                           | `"user"` oder ein erlaubter Guardian-Reviewer         | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen überprüft, wenn dies erlaubt ist.                                                                                                                                                                                                                                                                                                      |
| `defaultWorkspaceDir`                         | aktuelles Prozessverzeichnis                          | Workspace, der von `/codex bind` verwendet wird, wenn `--cwd` weggelassen wird.                                                                                                                                                                                                                                                                                                                                     |
| `serviceTier`                                 | nicht gesetzt                                         | Optionale Dienststufe des Codex-App-Servers. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, und `null` entfernt die Überschreibung. Das ältere `"fast"` wird als `"priority"` akzeptiert.                                                                                                                                                                                         |
| `networkProxy`                                | deaktiviert                                           | Aktiviert Codex-Permissions-Profile-Networking für App-Server-Befehle. OpenClaw definiert die ausgewählte `permissions.<profile>.network`-Konfiguration und wählt sie mit `default_permissions` aus, statt `sandbox` zu senden.                                                                                                                                                                                    |
| `experimental.sandboxExecServer`              | `false`                                               | Vorschau-Opt-in, das eine durch die OpenClaw-Sandbox gestützte Codex-Umgebung bei Codex-App-Server 0.132.0 oder neuer registriert, damit native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox laufen kann.                                                                                                                                                                                                 |

`appServer.networkProxy` ist explizit, weil es den Codex-Sandboxvertrag
ändert. Wenn aktiviert, setzt OpenClaw außerdem `features.network_proxy.enabled` und
`default_permissions` in der Codex-Thread-Konfiguration, damit das generierte
Berechtigungsprofil von Codex verwaltetes Networking starten kann. Standardmäßig
generiert OpenClaw einen kollisionsresistenten Profilnamen
`openclaw-network-<fingerprint>` aus dem Profilkörper; verwenden Sie `profileName`
nur, wenn ein stabiler lokaler Name erforderlich ist.

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

Wenn die normale App-Server-Laufzeit `danger-full-access` wäre, verwendet das
Aktivieren von `networkProxy` Workspace-artigen Dateisystemzugriff für das
generierte Berechtigungsprofil. Von Codex verwaltete Netzwerkdurchsetzung ist
sandboxed Networking, daher würde ein Full-Access-Profil ausgehenden Datenverkehr
nicht schützen.

Das Plugin blockiert ältere oder unversionierte App-Server-Handshakes. Der
Codex-App-Server muss die stabile Version `0.125.0` oder neuer melden.

OpenClaw behandelt nicht-Loopback-WebSocket-App-Server-URLs als remote und verlangt
identitätstragende WebSocket-Authentifizierung über `appServer.authToken` oder
einen `Authorization`-Header. `appServer.authToken` und jeder
`appServer.headers.*`-Wert können ein SecretInput sein; die Secrets-Runtime löst
SecretRefs und Env-Kurzformen auf, bevor OpenClaw die Startoptionen für den
App-Server erstellt, und nicht aufgelöste strukturierte SecretRefs schlagen
fehl, bevor ein Token oder Header gesendet wird. Wenn native Codex-Plugins
konfiguriert sind, verwendet OpenClaw die Plugin-Steuerungsebene des verbundenen
App-Servers, um diese Plugins zu installieren oder zu aktualisieren, und
aktualisiert anschließend das App-Inventar, damit Plugin-eigene Apps für den
Codex-Thread sichtbar sind. `app/list` bleibt weiterhin die maßgebliche Quelle
für Inventar und Metadaten, aber die OpenClaw-Richtlinie entscheidet, ob
`thread/start` für eine aufgelistete zugängliche App
`config.apps[appId].enabled = true` sendet, auch wenn Codex sie aktuell als
deaktiviert markiert. Unbekannte oder fehlende App-IDs bleiben fail-closed;
dieser Pfad aktiviert Marketplace-Plugins nur über `plugin/install` und
aktualisiert das Inventar. Verbinden Sie OpenClaw nur mit Remote-App-Servern,
denen Sie zutrauen, von OpenClaw verwaltete Plugin-Installationen und
App-Inventaraktualisierungen anzunehmen.

## Genehmigungs- und Sandbox-Modi

Lokale stdio-App-Server-Sitzungen verwenden standardmäßig den YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Diese vertrauenswürdige lokale
Operator-Haltung ermöglicht unbeaufsichtigten OpenClaw-Turns und Heartbeats
Fortschritt ohne native Genehmigungsaufforderungen, die niemand beantworten
kann.

Wenn die lokale Systemanforderungsdatei von Codex implizite YOLO-Werte für
Genehmigung, Reviewer oder Sandbox nicht zulässt, behandelt OpenClaw den
impliziten Standard stattdessen als Guardian und wählt zulässige
Guardian-Berechtigungen. `tools.exec.mode: "auto"` erzwingt ebenfalls von
Guardian geprüfte Codex-Genehmigungen und behält unsichere Legacy-Overrides wie
`approvalPolicy: "never"` oder `sandbox: "danger-full-access"` nicht bei; setzen
Sie `tools.exec.mode: "full"` für eine bewusst genehmigungsfreie Haltung.
Hostname-abgleichende
`[[remote_sandbox_config]]`-Einträge in derselben Anforderungsdatei werden bei
der Entscheidung über den Sandbox-Standard berücksichtigt.

Setzen Sie `appServer.mode: "guardian"` für von Codex Guardian geprüfte
Genehmigungen:

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

Die `guardian`-Voreinstellung wird zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert,
wenn diese Werte zulässig sind. Einzelne Richtlinienfelder überschreiben `mode`.
Der ältere Reviewer-Wert `guardian_subagent` wird weiterhin als
Kompatibilitätsalias akzeptiert, neue Konfigurationen sollten jedoch
`auto_review` verwenden.

Wenn eine OpenClaw-Sandbox aktiv ist, läuft der lokale Codex-App-Server-Prozess
weiterhin auf dem Gateway-Host. OpenClaw deaktiviert daher für diesen Turn den
nativen Codex Code Mode, Benutzer-MCP-Server und App-gestützte
Plugin-Ausführung, anstatt Codex-hostseitiges Sandboxing als gleichwertig mit
dem OpenClaw-Sandbox-Backend zu behandeln. Shell-Zugriff wird über dynamische
Tools mit OpenClaw-Sandbox-Backend wie `sandbox_exec` und `sandbox_process`
bereitgestellt, wenn die normalen Exec-/Process-Tools verfügbar sind.

Auf Ubuntu-/AppArmor-Hosts kann Codex bwrap unter `workspace-write`
fehlschlagen, bevor der Shell-Befehl startet, wenn Sie natives Codex
`workspace-write` bewusst ohne aktives OpenClaw-Sandboxing ausführen. Wenn Sie
`bwrap: setting up uid map: Permission denied` oder
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` sehen, führen Sie
`openclaw doctor` aus und beheben Sie die gemeldete Host-Namespace-Richtlinie
für den OpenClaw-Dienstbenutzer, statt dem Docker-Container weitergehende
Berechtigungen zu erteilen. Bevorzugen Sie ein eng gefasstes AppArmor-Profil für
den Dienstprozess; der Fallback
`kernel.apparmor_restrict_unprivileged_userns=0` gilt hostweit und hat
Sicherheitskompromisse.

## Native Ausführung in der Sandbox

Der stabile Standard ist fail-closed: Aktives OpenClaw-Sandboxing deaktiviert
native Codex-Ausführungsoberflächen, die sonst vom Codex-App-Server-Host
ausgeführt würden. Verwenden Sie `appServer.experimental.sandboxExecServer:
true` nur, wenn Sie die Remote-Environment-Unterstützung von Codex mit dem
Sandbox-Backend von OpenClaw ausprobieren möchten. Dieser Vorschaupfad erfordert
Codex-App-Server 0.132.0 oder neuer.

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

Wenn das Flag aktiviert ist und die aktuelle OpenClaw-Sitzung in einer Sandbox
läuft, startet OpenClaw einen lokalen loopback-Exec-Server mit Backend der
aktiven Sandbox, registriert ihn beim Codex-App-Server und startet den
Codex-Thread und -Turn mit dieser OpenClaw-eigenen Umgebung. Wenn der App-Server
die Umgebung nicht registrieren kann, schlägt der Lauf fail-closed fehl, statt
stillschweigend auf Host-Ausführung zurückzufallen.

Dieser Vorschaupfad ist nur lokal. Ein Remote-WebSocket-App-Server kann den
loopback-Exec-Server nicht erreichen, sofern er nicht auf demselben Host läuft;
OpenClaw lehnt diese Kombination daher ab.

## Authentifizierung und Umgebungsisolation

Die Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das vorhandene Konto des App-Servers im Codex-Home dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und
   OpenAI-Authentifizierung weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines
ChatGPT-Abonnements erkennt, entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY`
aus dem gestarteten Codex-Kindprozess. Dadurch bleiben API-Schlüssel auf
Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar, ohne dass
native Codex-App-Server-Turns versehentlich über die API abgerechnet werden.

Explizite Codex-API-Schlüsselprofile und der lokale stdio-Env-Key-Fallback
verwenden App-Server-Login statt geerbter Kindprozess-Umgebungsvariablen.
WebSocket-App-Server-Verbindungen erhalten keinen Gateway-Env-API-Key-Fallback;
verwenden Sie ein explizites Authentifizierungsprofil oder das eigene Konto des
Remote-App-Servers.

stdio-App-Server-Starts erben standardmäßig die Prozessumgebung von OpenClaw.
OpenClaw besitzt die Codex-App-Server-Kontobrücke und setzt `CODEX_HOME` auf ein
agentenspezifisches Verzeichnis unter dem OpenClaw-State dieses Agenten. Dadurch
bleiben Codex-Konfiguration, Konten, Plugin-Cache/-Daten und Thread-State auf
den OpenClaw-Agenten beschränkt, statt aus dem persönlichen `~/.codex`-Home des
Operators einzusickern.

OpenClaw schreibt `HOME` für normale lokale App-Server-Starts nicht um. Von
Codex ausgeführte Unterprozesse wie `openclaw`, `gh`, `git`, Cloud-CLIs und
Shell-Befehle sehen das normale Prozess-Home und können Konfiguration und Token
aus dem Benutzer-Home finden. Codex kann außerdem `$HOME/.agents/skills` und
`$HOME/.agents/plugins/marketplace.json` entdecken; diese `.agents`-Entdeckung
wird absichtlich mit dem Operator-Home geteilt und ist getrennt vom isolierten
`~/.codex`-State.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots laufen weiterhin über die eigene
Plugin-Registry und den Skill-Loader von OpenClaw. Persönliche Codex-Assets aus
`~/.codex` tun das nicht. Wenn Sie nützliche Codex-CLI-Skills oder Plugins aus
einem Codex-Home haben, die Teil eines OpenClaw-Agenten werden sollen,
inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Wenn ein Deployment zusätzliche Umgebungsisolation benötigt, fügen Sie diese
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

`appServer.clearEnv` betrifft nur den gestarteten Codex-App-Server-Kindprozess.
OpenClaw entfernt `CODEX_HOME` und `HOME` während der lokalen
Startnormalisierung aus dieser Liste: `CODEX_HOME` bleibt agentenspezifisch,
und `HOME` bleibt geerbt, damit Unterprozesse normalen State aus dem
Benutzer-Home verwenden können.

## Dynamische Tools

Codex-dynamische Tools verwenden standardmäßig das Laden per `searchable`.
OpenClaw stellt keine dynamischen Tools bereit, die native
Codex-Workspace-Operationen duplizieren:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Die meisten übrigen OpenClaw-Integrationstools, etwa Messaging, Medien, Cron,
Browser, Nodes, Gateway, `heartbeat_respond` und `web_search`, sind über die
Codex-Tool-Suche unter dem Namespace `openclaw` verfügbar. Dadurch bleibt der
anfängliche Modellkontext kleiner. `sessions_yield` und reine
Message-Tool-Source-Antworten bleiben direkt, weil sie Turn-Control-Verträge
sind. `sessions_spawn` bleibt durchsuchbar, damit Codex' natives `spawn_agent`
die primäre Codex-Subagent-Oberfläche bleibt, während explizite OpenClaw- oder
ACP-Delegation weiterhin über den dynamischen Tool-Namespace `openclaw`
verfügbar ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung
zu einem benutzerdefinierten Codex-App-Server herstellen, der zurückgestellte
dynamische Tools nicht durchsuchen kann, oder wenn Sie die vollständige
Tool-Nutzlast debuggen.

## Timeouts

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt. Jede Codex-`item/tool/call`-Anfrage
verwendet den ersten verfügbaren Timeout in dieser Reihenfolge:

- Ein positives pro-Aufruf-Argument `timeoutMs`.
- Für `image_generate`: `agents.defaults.imageGenerationModel.timeoutMs`.
- Für `image_generate` ohne konfigurierten Timeout: der 120-Sekunden-Standard
  für Bilderzeugung.
- Für das Medienverständnis-Tool `image`: `tools.media.image.timeoutSeconds`,
  in Millisekunden umgerechnet, oder der 60-Sekunden-Medienstandard. Für
  Bildverständnis gilt dies für die Anfrage selbst und wird nicht durch frühere
  Vorbereitungsarbeit reduziert.
- Der 90-Sekunden-Standard für dynamische Tools.

Dieser Watchdog ist das äußere Budget für dynamische `item/tool/call`-Aufrufe.
Provider-spezifische Anfrage-Timeouts laufen innerhalb dieses Aufrufs und
behalten ihre eigene Timeout-Semantik. Budgets für dynamische Tools sind auf
600000 ms begrenzt. Bei einem Timeout bricht OpenClaw das Tool-Signal ab, sofern
unterstützt, und gibt eine fehlgeschlagene dynamische Tool-Antwort an Codex
zurück, damit der Turn fortgesetzt werden kann, statt die Sitzung in
`processing` zu belassen.

Nachdem Codex einen Turn akzeptiert hat und nachdem OpenClaw auf eine
Turn-bezogene App-Server-Anfrage geantwortet hat, erwartet das Harness, dass
Codex Fortschritt im aktuellen Turn macht und den nativen Turn schließlich mit
`turn/completed` beendet. Wenn der App-Server für
`appServer.turnCompletionIdleTimeoutMs` still bleibt, unterbricht OpenClaw den
Codex-Turn nach bestem Bemühen, zeichnet einen diagnostischen Timeout auf und
gibt die OpenClaw-Sitzungsspur frei, damit nachfolgende Chat-Nachrichten nicht
hinter einem veralteten nativen Turn eingereiht werden.

Die meisten nicht-terminalen Benachrichtigungen für denselben Turn entschärfen diesen kurzen Watchdog,
weil Codex nachgewiesen hat, dass der Turn noch aktiv ist. Tool-Übergaben verwenden ein längeres
Post-Tool-Leerlaufbudget: nachdem OpenClaw eine `item/tool/call`-Antwort zurückgibt, nachdem
native Tool-Items wie `commandExecution` abgeschlossen sind, nach rohen
`custom_tool_call_output`-Abschlüssen sowie nach rohem Assistant-Fortschritt nach Tools,
rohen Reasoning-Abschlüssen oder Reasoning-Fortschritt. Der Guard verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn konfiguriert, und
standardmäßig andernfalls fünf Minuten. Dasselbe Post-Tool-Budget erweitert auch den
Fortschritts-Watchdog für das stille Synthesefenster, bevor Codex das nächste
Current-Turn-Ereignis ausgibt. Reasoning-Abschlüsse, Abschlüsse von Commentary-`agentMessage`
und roher Reasoning- oder Assistant-Fortschritt vor Tools können von einer automatischen
abschließenden Antwort gefolgt werden, daher verwenden sie den Post-Progress-Antwort-Guard,
statt die Session-Lane sofort freizugeben. Nur finale/nicht-Commentary abgeschlossene
`agentMessage`-Items und rohe Assistant-Abschlüsse vor Tools aktivieren die
Assistant-Ausgabe-Freigabe: Wenn Codex danach ohne `turn/completed` still bleibt,
unterbricht OpenClaw bestmöglich den nativen Turn und gibt die Session-Lane frei.
Replay-sichere stdio-App-Server-Fehler, einschließlich Leerlauf-Timeouts beim
Turn-Abschluss ohne Nachweis von Assistant, Tool, aktivem Item oder Seiteneffekt,
werden einmal mit einem frischen App-Server-Versuch wiederholt. Unsichere Timeouts
setzen den hängenden App-Server-Client dennoch außer Betrieb und geben die OpenClaw
Session-Lane frei. Außerdem löschen sie die veraltete native Thread-Bindung, statt
automatisch wiederholt zu werden. Completion-Watch-Timeouts zeigen Codex-spezifischen
Timeout-Text an: Replay-sichere Fälle sagen, dass die Antwort möglicherweise unvollständig
ist, während unsichere Fälle den Benutzer auffordern, den aktuellen Zustand vor einem
erneuten Versuch zu prüfen. Öffentliche Timeout-Diagnosen enthalten strukturelle Felder
wie die letzte App-Server-Benachrichtigungsmethode, die ID/den Typ/die Rolle des rohen
Assistant-Antwort-Items, aktive Anfrage-/Item-Zähler und den aktivierten Watch-Zustand.
Wenn die letzte Benachrichtigung ein rohes Assistant-Antwort-Item ist, enthalten sie
außerdem eine begrenzte Vorschau des Assistant-Texts. Sie enthalten keine rohen Prompt-
oder Tool-Inhalte.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Die
Modellverfügbarkeit gehört dem Codex-App-Server, daher kann sich die Liste ändern, wenn
OpenClaw die gebündelte Version von `@openai/codex` aktualisiert oder wenn ein Deployment
`appServer.command` auf eine andere Codex-Binärdatei verweist. Die Verfügbarkeit kann
auch kontogebunden sein. Verwenden Sie `/codex models` auf einem laufenden Gateway, um
den Live-Katalog für dieses Harness und Konto zu sehen.

Wenn die Erkennung fehlschlägt oder ein Timeout auftritt, verwendet OpenClaw einen
gebündelten Fallback-Katalog für:

- GPT-5.5
- GPT-5.4 mini

Das aktuell gebündelte Harness ist `@openai/codex` `0.142.4`. Ein `model/list`-Probe
gegen diesen gebündelten App-Server in einem GPT-5.6-fähigen Workspace gab diese
öffentlichen Picker-Zeilen zurück:

| Modell-ID             | Eingabemodalitäten | Reasoning-Aufwände                   |
| --------------------- | ------------------ | ------------------------------------ |
| `gpt-5.6-sol`         | Text, Bild         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | Text, Bild         | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | Text, Bild         | low, medium, high, xhigh, max        |
| `gpt-5.5`             | Text, Bild         | low, medium, high, xhigh             |
| `gpt-5.4`             | Text, Bild         | low, medium, high, xhigh             |
| `gpt-5.4-mini`        | Text, Bild         | low, medium, high, xhigh             |
| `gpt-5.4-pro`         | Text, Bild         | medium, high, xhigh                  |
| `gpt-5.3-codex-spark` | Text               | low, medium, high, xhigh             |

GPT-5.6-Zugriff ist während der eingeschränkten Vorschau kontogebunden. `max` ist ein
Reasoning-Aufwand eines Modells. `ultra` ist separate Codex-Multi-Agent-Orchestrierungsmetadaten
und kein standardmäßiger OpenAI-Reasoning-Aufwand.

Verborgene Modelle können vom App-Server-Katalog für interne oder spezialisierte Flows
zurückgegeben werden, sie sind jedoch keine normalen Modell-Picker-Optionen.

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

Deaktivieren Sie die Erkennung, wenn der Start Codex nicht abfragen und nur den
Fallback-Katalog verwenden soll:

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

Codex verarbeitet `AGENTS.md` selbst über die native Projekt-Dokumenterkennung. OpenClaw
schreibt keine synthetischen Codex-Projekt-Dokumentdateien und hängt nicht von Codex-Fallback-
Dateinamen für Persona-Dateien ab, weil Codex-Fallbacks nur gelten, wenn `AGENTS.md` fehlt.

Für Workspace-Parität in OpenClaw löst das Codex-Harness die anderen Bootstrap-Dateien auf.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` und `USER.md` werden als OpenClaw-Codex-Developer-
Anweisungen weitergegeben, weil sie den aktiven Agenten, verfügbare Workspace-Leitlinien
und das Benutzerprofil definieren. Die kompakte OpenClaw-Skills-Liste wird als Turn-bezogene
Developer-Anweisungen zur Zusammenarbeit weitergegeben. `HEARTBEAT.md`-Inhalt wird nicht
injiziert; Heartbeat-Turns erhalten einen Collaboration-Mode-Hinweis, die Datei zu lesen,
wenn sie existiert und nicht leer ist. `MEMORY.md`-Inhalt aus dem konfigurierten Agenten-
Workspace wird nicht in die native Codex-Turn-Eingabe eingefügt, wenn Memory-Tools für
diesen Workspace verfügbar sind; wenn er existiert, fügt das Harness einen kleinen
Workspace-Memory-Hinweis zu den Turn-bezogenen Developer-Anweisungen zur Zusammenarbeit hinzu,
und Codex sollte `memory_search` oder `memory_get` verwenden, wenn dauerhafte Memory relevant
ist. Wenn Tools deaktiviert sind, Memory-Suche nicht verfügbar ist oder sich der aktive
Workspace vom Agent-Memory-Workspace unterscheidet, verwendet `MEMORY.md` den normalen
begrenzten Turn-Kontextpfad.
`BOOTSTRAP.md` wird, wenn vorhanden, als OpenClaw-Turn-Eingabe-Referenzkontext weitergegeben.

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration wird
für wiederholbare Deployments bevorzugt, weil sie das Plugin-Verhalten in derselben
geprüften Datei wie die restliche Einrichtung des Codex-Harness hält.

## Verwandt

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex Computer Use](/de/plugins/codex-computer-use)
- [OpenAI-Provider](/de/providers/openai)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
