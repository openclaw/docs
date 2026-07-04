---
read_when:
    - Sie benötigen jedes Codex-Harness-Konfigurationsfeld
    - Sie ändern das Transport-, Authentifizierungs-, Discovery- oder Timeout-Verhalten des App-Servers
    - Sie debuggen den Start des Codex-Harness, die Modellerkennung oder die Umgebungsisolation.
summary: Referenz zu Konfiguration, Authentifizierung, Discovery und App-Server für den Codex-Harness
title: Codex-Harness-Referenz
x-i18n:
    generated_at: "2026-07-04T10:36:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43c905586346c8d7c255b58b706eb82543fd1ca05588e459a257e8f9f4cf36d4
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Diese Referenz behandelt die detaillierte Konfiguration für das gebündelte `codex`-Plugin. Für Einrichtung und Routing-Entscheidungen beginnen Sie mit
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

Unterstützte Felder der obersten Ebene:

| Feld                       | Standardwert             | Bedeutung                                                                                                                                    |
| -------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | aktiviert                | Einstellungen für die Modellerkennung für Codex-App-Server `model/list`.                                                                     |
| `appServer`                | verwalteter stdio-App-Server | Transport-, Befehls-, Authentifizierungs-, Genehmigungs-, Sandbox- und Timeout-Einstellungen.                                            |
| `codexDynamicToolsLoading` | `"searchable"`           | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Toolkontext aufzunehmen.                             |
| `codexDynamicToolsExclude` | `[]`                     | Zusätzliche Namen dynamischer OpenClaw-Tools, die in Codex-App-Server-Turns ausgelassen werden sollen.                                       |
| `codexPlugins`             | deaktiviert              | Native Codex-Plugin-/App-Unterstützung für migrierte, aus der Quelle installierte kuratierte Plugins. Siehe [Native Codex-Plugins](/de/plugins/codex-native-plugins). |
| `computerUse`              | deaktiviert              | Einrichtung von Codex Computer Use. Siehe [Codex Computer Use](/de/plugins/codex-computer-use).                                                 |

## App-Server-Transport

Standardmäßig startet OpenClaw die verwaltete Codex-Binärdatei, die mit dem gebündelten
Plugin ausgeliefert wird:

```bash
codex app-server --listen stdio://
```

Dadurch bleibt die App-Server-Version an das gebündelte `codex`-Plugin gebunden, statt an
eine separat lokal installierte Codex-CLI. Setzen Sie
`appServer.command` nur, wenn Sie absichtlich eine andere
ausführbare Datei starten möchten.

Für einen bereits laufenden App-Server verwenden Sie WebSocket-Transport:

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

| Feld                                          | Standard                                               | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` startet Codex; `"websocket"` stellt eine Verbindung zu `url` her.                                                                                                                                                                                                                                                                                                                                    |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isoliert den Codex-Zustand pro OpenClaw-Agent. `"user"` teilt das native `$CODEX_HOME` oder `~/.codex`, verwendet native Authentifizierung und aktiviert die ausschließlich dem Owner vorbehaltene Thread-Verwaltung. Der User-Scope erfordert stdio.                                                                                                                                                 |
| `command`                                     | verwaltete Codex-Binärdatei                            | Ausführbare Datei für den stdio-Transport. Lassen Sie dies nicht gesetzt, um die verwaltete Binärdatei zu verwenden.                                                                                                                                                                                                                                                                                           |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumente für den stdio-Transport.                                                                                                                                                                                                                                                                                                                                                                             |
| `url`                                         | nicht gesetzt                                          | WebSocket-URL des app-server.                                                                                                                                                                                                                                                                                                                                                                                  |
| `authToken`                                   | nicht gesetzt                                          | Bearer-Token für den WebSocket-Transport. Akzeptiert eine Literalzeichenfolge oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                                |
| `headers`                                     | `{}`                                                   | Zusätzliche WebSocket-Header. Header-Werte akzeptieren Literalzeichenfolgen oder SecretInput-Werte, zum Beispiel `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                              |
| `clearEnv`                                    | `[]`                                                   | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-app-server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat.                                                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | nicht gesetzt                                          | Remote-Workspace-Root des Codex app-server. Wenn gesetzt, leitet OpenClaw den lokalen Workspace-Root aus dem aufgelösten OpenClaw-Workspace ab, erhält das aktuelle cwd-Suffix unter diesem Remote-Root und sendet nur das endgültige app-server-cwd an Codex. Wenn das cwd außerhalb des aufgelösten OpenClaw-Workspace-Roots liegt, bricht OpenClaw geschlossen ab, statt einen Gateway-lokalen Pfad an den Remote-app-server zu senden. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout für Control-Plane-Aufrufe an den app-server.                                                                                                                                                                                                                                                                                                                                                           |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ruhefenster, nachdem Codex einen Turn akzeptiert hat oder nach einer turn-bezogenen app-server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                                                           |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Completion-Idle- und Fortschrittsüberwachung, die nach einer Tool-Übergabe, nativer Tool-Fertigstellung, post-tool-Rohfortschritt des Assistant, Roh-Reasoning-Fertigstellung oder Reasoning-Fortschritt verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder schwere Workloads, bei denen die Synthese nach einem Tool berechtigterweise länger ruhig bleiben kann als das endgültige Assistant-Freigabebudget. |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht ausschließen | Voreinstellung für YOLO- oder Guardian-geprüfte Ausführung.                                                                                                                                                                                                                                                                                                                                                    |
| `approvalPolicy`                              | `"never"` oder eine erlaubte Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die an Thread-Start, Resume und Turn gesendet wird.                                                                                                                                                                                                                                                                                                                       |
| `sandbox`                                     | `"danger-full-access"` oder eine erlaubte Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der an Thread-Start und Resume gesendet wird. Aktive OpenClaw-Sandboxes verengen `danger-full-access`-Turns auf Codex `workspace-write`; das Turn-Netzwerk-Flag folgt dem OpenClaw-Sandbox-Egress.                                                                                                                                                                                 |
| `approvalsReviewer`                           | `"user"` oder ein erlaubter Guardian-Reviewer          | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, wenn dies erlaubt ist.                                                                                                                                                                                                                                                                                                      |
| `defaultWorkspaceDir`                         | aktuelles Prozessverzeichnis                           | Workspace, der von `/codex bind` verwendet wird, wenn `--cwd` ausgelassen wird.                                                                                                                                                                                                                                                                                                                                |
| `serviceTier`                                 | nicht gesetzt                                          | Optionale Service-Stufe des Codex app-server. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, und `null` löscht die Überschreibung. Das Legacy-`"fast"` wird als `"priority"` akzeptiert.                                                                                                                                                                                     |
| `networkProxy`                                | deaktiviert                                            | Aktiviert optional das Networking des Codex-Berechtigungsprofils für app-server-Befehle. OpenClaw definiert die ausgewählte `permissions.<profile>.network`-Konfiguration und wählt sie mit `default_permissions` aus, statt `sandbox` zu senden.                                                                                                                                                               |
| `experimental.sandboxExecServer`              | `false`                                                | Preview-Opt-in, das bei Codex app-server 0.132.0 oder neuer eine von einer OpenClaw-Sandbox gestützte Codex-Umgebung registriert, damit native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox laufen kann.                                                                                                                                                                                            |

`appServer.networkProxy` ist explizit, weil es den Codex-Sandbox-Vertrag
ändert. Wenn aktiviert, setzt OpenClaw außerdem `features.network_proxy.enabled` und
`default_permissions` in der Codex-Thread-Konfiguration, damit das generierte Berechtigungsprofil
das von Codex verwaltete Networking starten kann. Standardmäßig generiert OpenClaw einen
kollisionsresistenten Profilnamen `openclaw-network-<fingerprint>` aus dem
Profilinhalt; verwenden Sie `profileName` nur, wenn ein stabiler lokaler Name erforderlich ist.

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

Wenn die normale app-server-Laufzeit `danger-full-access` wäre, verwendet die Aktivierung von `networkProxy` einen arbeitsbereichsähnlichen Dateisystemzugriff für das generierte Berechtigungsprofil. Die von Codex verwaltete Netzwerkdurchsetzung ist sandboxed Networking, daher würde ein Profil mit Vollzugriff ausgehenden Datenverkehr nicht schützen.

Das Plugin blockiert ältere oder nicht versionierte app-server-Handshakes. Codex app-server muss die stabile Version `0.125.0` oder neuer melden.

OpenClaw behandelt WebSocket-app-server-URLs ohne Loopback als remote und verlangt identitätstragende WebSocket-Authentifizierung über `appServer.authToken` oder einen `Authorization`-Header. `appServer.authToken` und jeder `appServer.headers.*`-Wert können ein SecretInput sein; die Secrets-Laufzeit löst SecretRefs und env-Kurzschreibweisen auf, bevor OpenClaw app-server-Startoptionen erstellt, und nicht aufgelöste strukturierte SecretRefs schlagen fehl, bevor ein Token oder Header gesendet wird. Wenn native Codex-Plugins konfiguriert sind, verwendet OpenClaw die Plugin-Steuerungsebene des verbundenen app-server, um diese Plugins zu installieren oder zu aktualisieren, und aktualisiert anschließend das App-Inventar, damit plugin-eigene Apps für den Codex-Thread sichtbar sind. `app/list` bleibt weiterhin die maßgebliche Quelle für Inventar und Metadaten, aber die OpenClaw-Richtlinie entscheidet, ob `thread/start` für eine gelistete zugängliche App `config.apps[appId].enabled = true` sendet, selbst wenn Codex sie derzeit als deaktiviert markiert. Unbekannte oder fehlende App-IDs bleiben fail-closed; dieser Pfad aktiviert Marketplace-Plugins nur über `plugin/install` und aktualisiert das Inventar. Verbinden Sie OpenClaw nur mit Remote-app-servern, denen Sie vertrauen, OpenClaw-verwaltete Plugin-Installationen und App-Inventaraktualisierungen anzunehmen.

## Genehmigungs- und Sandbox-Modi

Lokale stdio-app-server-Sitzungen verwenden standardmäßig den YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Diese vertrauenswürdige lokale Operator-Haltung ermöglicht es unbeaufsichtigten OpenClaw-Turns und Heartbeats, ohne native Genehmigungsaufforderungen voranzukommen, die niemand beantworten kann.

Wenn die lokale Systemanforderungsdatei von Codex implizite YOLO-Werte für Genehmigung, Reviewer oder Sandbox nicht erlaubt, behandelt OpenClaw den impliziten Standard stattdessen als guardian und wählt erlaubte guardian-Berechtigungen. `tools.exec.mode: "auto"` erzwingt ebenfalls guardian-geprüfte Codex-Genehmigungen und bewahrt unsichere ältere Overrides wie `approvalPolicy: "never"` oder `sandbox: "danger-full-access"` nicht; setzen Sie `tools.exec.mode: "full"` für eine bewusst genehmigungsfreie Haltung. Hostname-passende `[[remote_sandbox_config]]`-Einträge in derselben Anforderungsdatei werden bei der Sandbox-Standardentscheidung berücksichtigt.

Setzen Sie `appServer.mode: "guardian"` für guardian-geprüfte Codex-Genehmigungen:

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

Die Voreinstellung `guardian` wird zu `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert, wenn diese Werte erlaubt sind. Einzelne Richtlinienfelder überschreiben `mode`. Der ältere Reviewer-Wert `guardian_subagent` wird weiterhin als Kompatibilitätsalias akzeptiert, aber neue Konfigurationen sollten `auto_review` verwenden.

Wenn eine OpenClaw-Sandbox aktiv ist, läuft der lokale Codex-app-server-Prozess weiterhin auf dem Gateway-Host. OpenClaw deaktiviert daher für diesen Turn den nativen Code Mode von Codex, benutzerdefinierte MCP-Server und app-gestützte Plugin-Ausführung, anstatt hostseitige Codex-Sandboxing-Funktionen als gleichwertig zum OpenClaw-Sandbox-Backend zu behandeln. Shell-Zugriff wird über OpenClaw-Sandbox-gestützte dynamische Tools wie `sandbox_exec` und `sandbox_process` bereitgestellt, wenn die normalen exec/process-Tools verfügbar sind.

Auf Ubuntu/AppArmor-Hosts kann Codex bwrap unter `workspace-write` fehlschlagen, bevor der Shell-Befehl startet, wenn Sie natives Codex-`workspace-write` absichtlich ohne aktives OpenClaw-Sandboxing ausführen. Wenn Sie `bwrap: setting up uid map: Permission denied` oder `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` sehen, führen Sie `openclaw doctor` aus und beheben Sie die gemeldete Host-Namespace-Richtlinie für den OpenClaw-Dienstbenutzer, statt breitere Docker-Container-Berechtigungen zu gewähren. Bevorzugen Sie ein eingegrenztes AppArmor-Profil für den Dienstprozess; der Fallback `kernel.apparmor_restrict_unprivileged_userns=0` gilt hostweit und hat Sicherheitskompromisse.

## Sandbox-geschützte native Ausführung

Der stabile Standard ist fail-closed: Aktives OpenClaw-Sandboxing deaktiviert native Codex-Ausführungsoberflächen, die sonst vom Host des Codex app-server ausgeführt würden. Verwenden Sie `appServer.experimental.sandboxExecServer: true` nur, wenn Sie Codex-Unterstützung für Remote-Umgebungen mit dem OpenClaw-Sandbox-Backend ausprobieren möchten. Dieser Vorschaupfad erfordert Codex app-server 0.132.0 oder neuer.

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

Wenn das Flag aktiviert ist und die aktuelle OpenClaw-Sitzung sandboxed ist, startet OpenClaw einen lokalen loopback exec-server, der von der aktiven Sandbox gestützt wird, registriert ihn bei Codex app-server und startet den Codex-Thread und -Turn mit dieser OpenClaw-eigenen Umgebung. Wenn der app-server die Umgebung nicht registrieren kann, schlägt der Lauf fail-closed fehl, statt stillschweigend auf Host-Ausführung zurückzufallen.

Dieser Vorschaupfad ist nur lokal. Ein Remote-WebSocket-app-server kann den loopback exec-server nicht erreichen, sofern er nicht auf demselben Host läuft; daher lehnt OpenClaw diese Kombination ab.

## Authentifizierungs- und Umgebungsisolierung

Im standardmäßigen agentenspezifischen Home wird die Authentifizierung in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das vorhandene Konto des app-server im Codex-Home dieses Agenten.
3. Nur für lokale stdio-app-server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein app-server-Konto vorhanden ist und OpenAI-Authentifizierung weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt, entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY` aus dem gestarteten Codex-Kindprozess. Dadurch bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar, ohne dass native Codex-app-server-Turns versehentlich über die API abgerechnet werden.

Explizite Codex-API-Schlüsselprofile und lokale stdio-env-key-Fallbacks verwenden app-server-Login statt geerbter Kindprozess-Umgebungsvariablen. WebSocket-app-server-Verbindungen erhalten keinen Gateway-env-API-Schlüssel-Fallback; verwenden Sie ein explizites Authentifizierungsprofil oder das eigene Konto des Remote-app-server.

Stdio-app-server-Starts erben standardmäßig die Prozessumgebung von OpenClaw. OpenClaw besitzt die Codex-app-server-Kontobrücke und setzt `CODEX_HOME` auf ein agentenspezifisches Verzeichnis im OpenClaw-Zustand dieses Agenten. Dadurch bleiben Codex-Konfiguration, Konten, Plugin-Cache/-Daten und Thread-Zustand auf den OpenClaw-Agenten beschränkt, statt aus dem persönlichen `~/.codex`-Home des Operators einzufließen.

Setzen Sie `appServer.homeScope: "user"`, um nativen Codex-Zustand mit Codex Desktop und der CLI zu teilen. Dieser nur lokale stdio-Modus verwendet `$CODEX_HOME`, wenn gesetzt, andernfalls `~/.codex`, einschließlich nativer Authentifizierung, Konfiguration, Plugins und Threads. OpenClaw überspringt seine Authentifizierungsprofil-Brücke für den app-server. Verifizierte Owner-Turns können `codex_threads` verwenden, um diese Threads aufzulisten, zu durchsuchen, zu lesen, zu forken, umzubenennen, zu archivieren und wiederherzustellen. Forken Sie einen Thread, bevor Sie ihn in OpenClaw fortsetzen; unabhängige Codex-Prozesse koordinieren keine gleichzeitigen Schreibzugriffe auf denselben Thread.

OpenClaw schreibt `HOME` für normale lokale app-server-Starts nicht um. Von Codex ausgeführte Subprozesse wie `openclaw`, `gh`, `git`, Cloud-CLIs und Shell-Befehle sehen das normale Prozess-Home und können Konfiguration und Tokens im Benutzer-Home finden. Codex kann außerdem `$HOME/.agents/skills` und `$HOME/.agents/plugins/marketplace.json` entdecken; diese `.agents`-Erkennung wird absichtlich mit dem Operator-Home geteilt und ist getrennt vom isolierten `~/.codex`-Zustand.

Im standardmäßigen Agenten-Scope laufen OpenClaw-Plugins und OpenClaw-Skill-Snapshots weiterhin über OpenClaws eigene Plugin-Registry und den Skill-Loader; persönliche Codex-`~/.codex`-Assets tun dies nicht. Wenn Sie nützliche Codex-CLI-Skills oder -Plugins aus einem Codex-Home haben, die Teil eines isolierten OpenClaw-Agenten werden sollen, inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Wenn eine Bereitstellung zusätzliche Umgebungsisolierung benötigt, fügen Sie diese Variablen zu `appServer.clearEnv` hinzu:

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

`appServer.clearEnv` betrifft nur den gestarteten Codex-app-server-Kindprozess. OpenClaw entfernt `CODEX_HOME` und `HOME` während der lokalen Startnormalisierung aus dieser Liste: `CODEX_HOME` bleibt auf den ausgewählten Agenten- oder Benutzer-Scope gerichtet, und `HOME` bleibt geerbt, damit Subprozesse normalen Benutzer-Home-Zustand verwenden können.

## Dynamische Tools

Codex-dynamische Tools verwenden standardmäßig `searchable`-Laden. OpenClaw stellt keine dynamischen Tools bereit, die native Codex-Arbeitsbereichsoperationen duplizieren:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Die meisten verbleibenden OpenClaw-Integrationstools, wie Messaging, Medien, Cron, Browser, Nodes, Gateway, `heartbeat_respond` und `web_search`, sind über Codex-Toolsuche unter dem Namespace `openclaw` verfügbar. Dadurch bleibt der anfängliche Modellkontext kleiner. `sessions_yield` und nur auf Nachrichtentools bezogene Quellenantworten bleiben direkt, weil dies Turn-Steuerungsverträge sind. `sessions_spawn` bleibt durchsuchbar, sodass Codex' natives `spawn_agent` die primäre Codex-Subagentenoberfläche bleibt, während explizite OpenClaw- oder ACP-Delegation weiterhin über den dynamischen Tool-Namespace `openclaw` verfügbar ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu einem benutzerdefinierten Codex-app-server herstellen, der zurückgestellte dynamische Tools nicht durchsuchen kann, oder wenn Sie die vollständige Tool-Nutzlast debuggen.

## Timeouts

OpenClaw-eigene dynamische Toolaufrufe sind unabhängig von `appServer.requestTimeoutMs` begrenzt. Jede Codex-`item/tool/call`-Anfrage verwendet den ersten verfügbaren Timeout in dieser Reihenfolge:

- Ein positives `timeoutMs`-Argument pro Aufruf.
- Für `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Für `image_generate` ohne konfigurierten Timeout der 120-Sekunden-Standard für Bildgenerierung.
- Für das Medienverständnis-Tool `image`, `tools.media.image.timeoutSeconds` in Millisekunden umgerechnet, oder der 60-Sekunden-Medienstandard. Für Bildverständnis gilt dies für die Anfrage selbst und wird nicht durch frühere Vorbereitungsarbeit reduziert.
- Der 90-Sekunden-Standard für dynamische Tools.

Dieser Watchdog ist das äußere dynamische `item/tool/call`-Budget. Provider-spezifische Anfrage-Timeouts laufen innerhalb dieses Aufrufs und behalten ihre eigenen Timeout-Semantiken. Budgets für dynamische Tools sind auf 600000 ms begrenzt. Bei Timeout bricht OpenClaw das Tool-Signal ab, wo unterstützt, und gibt eine fehlgeschlagene dynamische Toolantwort an Codex zurück, damit der Turn fortgesetzt werden kann, statt die Sitzung in `processing` zu belassen.

Nachdem Codex einen Turn akzeptiert hat und nachdem OpenClaw auf eine turn-bezogene app-server-Anfrage geantwortet hat, erwartet das Harness, dass Codex im aktuellen Turn Fortschritt macht und den nativen Turn schließlich mit `turn/completed` beendet. Wenn der app-server für `appServer.turnCompletionIdleTimeoutMs` still bleibt, unterbricht OpenClaw den Codex-Turn nach bestem Aufwand, zeichnet einen diagnostischen Timeout auf und gibt die OpenClaw-Sitzungslane frei, damit nachfolgende Chatnachrichten nicht hinter einem veralteten nativen Turn in die Warteschlange gestellt werden.

Die meisten nicht-terminalen Benachrichtigungen für denselben Turn entschärfen diesen kurzen Watchdog,
weil Codex bewiesen hat, dass der Turn noch aktiv ist. Tool-Übergaben verwenden ein längeres
Leerlaufbudget nach dem Tool: nachdem OpenClaw eine `item/tool/call`-Antwort zurückgegeben hat, nachdem
native Tool-Elemente wie `commandExecution` abgeschlossen sind, nach rohen
`custom_tool_call_output`-Abschlüssen sowie nach rohem Assistant-Fortschritt nach einem Tool,
rohen Reasoning-Abschlüssen oder Reasoning-Fortschritt. Der Guard verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn konfiguriert, und
fällt andernfalls auf fünf Minuten zurück. Dasselbe Post-Tool-Budget verlängert auch den
Fortschritts-Watchdog für das stille Synthesefenster, bevor Codex das nächste
Ereignis des aktuellen Turns ausgibt. Reasoning-Abschlüsse, Abschlüsse von
`agentMessage` in commentary und roher Reasoning- oder Assistant-Fortschritt vor einem Tool können
von einer automatischen finalen Antwort gefolgt werden, daher verwenden sie den Antwort-Guard nach
Fortschritt, anstatt die Session-Lane sofort freizugeben. Nur
finale/nicht-commentary abgeschlossene `agentMessage`-Elemente und rohe Assistant-Abschlüsse vor einem Tool
aktivieren die Assistant-Ausgabe-Freigabe: Wenn Codex danach ohne `turn/completed` verstummt,
unterbricht OpenClaw nach bestem Aufwand den nativen Turn und gibt
die Session-Lane frei. Replay-sichere stdio-App-Server-Fehler, einschließlich
Turn-Completion-Leerlauf-Timeouts ohne Assistant-, Tool-, Active-Item- oder
Side-Effect-Nachweis, werden einmal mit einem frischen App-Server-Versuch wiederholt. Unsichere
Timeouts setzen den blockierten App-Server-Client weiterhin außer Betrieb und geben die OpenClaw-
Session-Lane frei. Sie löschen außerdem die veraltete native Thread-Bindung, anstatt automatisch
wiederholt zu werden. Completion-Watch-Timeouts zeigen Codex-spezifischen Timeout-
Text an: Replay-sichere Fälle sagen, dass die Antwort unvollständig sein kann, während unsichere Fälle
den Benutzer anweisen, den aktuellen Zustand vor einem erneuten Versuch zu überprüfen. Öffentliche Timeout-Diagnosen
enthalten strukturelle Felder wie die letzte App-Server-Benachrichtigungsmethode,
ID/Typ/Rolle des rohen Assistant-Response-Elements, aktive Anfrage-/Elementzahlen und den bewaffneten
Watch-Zustand. Wenn die letzte Benachrichtigung ein rohes Assistant-Response-Element ist, enthalten sie
außerdem eine begrenzte Vorschau des Assistant-Texts. Sie enthalten keine rohen Prompt- oder
Tool-Inhalte.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Die Modell-
Verfügbarkeit gehört dem Codex-App-Server, daher kann sich die Liste ändern, wenn OpenClaw
die gebündelte Version von `@openai/codex` aktualisiert oder wenn eine Bereitstellung
`appServer.command` auf eine andere Codex-Binärdatei zeigt. Die Verfügbarkeit kann außerdem
kontogebunden sein. Verwenden Sie `/codex models` auf einem laufenden Gateway, um den Live-Katalog
für dieses Harness und Konto zu sehen.

Wenn die Erkennung fehlschlägt oder ein Timeout auftritt, verwendet OpenClaw einen gebündelten Fallback-Katalog für:

- GPT-5.5
- GPT-5.4 mini

Das aktuelle gebündelte Harness ist `@openai/codex` `0.142.4`. Ein `model/list`-Probe
gegen diesen gebündelten App-Server in einem GPT-5.6-aktivierten Workspace gab diese
öffentlichen Picker-Zeilen zurück:

| Modell-ID             | Eingabemodalitäten | Reasoning-Aufwände                  |
| --------------------- | ------------------ | ----------------------------------- |
| `gpt-5.6-sol`         | text, image        | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra`       | text, image        | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`        | text, image        | low, medium, high, xhigh, max       |
| `gpt-5.5`             | text, image        | low, medium, high, xhigh            |
| `gpt-5.4`             | text, image        | low, medium, high, xhigh            |
| `gpt-5.4-mini`        | text, image        | low, medium, high, xhigh            |
| `gpt-5.4-pro`         | text, image        | medium, high, xhigh                 |
| `gpt-5.3-codex-spark` | text               | low, medium, high, xhigh            |

Der Zugriff auf GPT-5.6 ist während der eingeschränkten Vorschau kontogebunden. `max` ist ein Modell-
Reasoning-Aufwand. `ultra` ist separate Codex-Multi-Agent-Orchestrierungsmetadaten,
kein standardmäßiger OpenAI-Reasoning-Aufwand.

Verborgene Modelle können vom App-Server-Katalog für interne oder
spezialisierte Flows zurückgegeben werden, sie sind jedoch keine normalen Auswahlmöglichkeiten im Modell-Picker.

Konfigurieren Sie die Erkennung unter `plugins.entries.codex.config.discovery`:

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

Deaktivieren Sie die Erkennung, wenn der Start Codex nicht sondieren und nur den
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
Dateinamen für Persona-Dateien ab, weil Codex-Fallbacks nur gelten, wenn
`AGENTS.md` fehlt.

Für OpenClaw-Workspace-Parität löst das Codex-Harness die anderen Bootstrap-
Dateien auf. `SOUL.md`, `IDENTITY.md`, `TOOLS.md` und `USER.md` werden als
OpenClaw-Codex-Developer-Instructions weitergeleitet, weil sie den aktiven Agent,
verfügbare Workspace-Anleitungen und das Benutzerprofil definieren. Die kompakte OpenClaw-Skills-
Liste wird als turn-bezogene Developer-Instructions für Zusammenarbeit weitergeleitet.
`HEARTBEAT.md`-Inhalte werden nicht injiziert; Heartbeat-Turns erhalten einen Collaboration-Mode-
Hinweis, die Datei zu lesen, wenn sie existiert und nicht leer ist. `MEMORY.md`-Inhalte
aus dem konfigurierten Agent-Workspace werden nicht in die native Codex-Turn-Eingabe eingefügt,
wenn Memory-Tools für diesen Workspace verfügbar sind; wenn sie existieren, fügt das Harness
einen kleinen Workspace-Memory-Hinweis zu den turn-bezogenen Developer-Instructions für Zusammenarbeit hinzu,
und Codex sollte `memory_search` oder `memory_get` verwenden, wenn dauerhafte
Memory relevant ist. Wenn Tools deaktiviert sind, Memory Search nicht verfügbar ist oder sich der
aktive Workspace vom Agent-Memory-Workspace unterscheidet, verwendet `MEMORY.md` den
normalen begrenzten Turn-Context-Pfad.
`BOOTSTRAP.md` wird, wenn vorhanden, als OpenClaw-Turn-Eingabe-Referenzkontext
weitergeleitet.

## Umgebungs-Overrides

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
für wiederholbare Bereitstellungen bevorzugt, weil sie das Plugin-Verhalten in derselben
geprüften Datei wie den Rest des Codex-Harness-Setups hält.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex Computer Use](/de/plugins/codex-computer-use)
- [OpenAI-Provider](/de/providers/openai)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
