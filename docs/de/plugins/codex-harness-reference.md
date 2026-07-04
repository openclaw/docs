---
read_when:
    - Sie benötigen jedes Konfigurationsfeld des Codex-Harness
    - Sie ändern Transport-, Authentifizierungs-, Discovery- oder Timeout-Verhalten des App-Servers
    - Sie debuggen den Start des Codex-Harness, die Modellerkennung oder die Umgebungisolierung
summary: Konfigurations-, Authentifizierungs-, Discovery- und App-Server-Referenz für den Codex-Harness
title: Codex-Harness-Referenz
x-i18n:
    generated_at: "2026-07-04T20:28:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Diese Referenz behandelt die detaillierte Konfiguration für das gebündelte `codex`-Plugin. Für Einrichtung und Routing-Entscheidungen beginnen Sie mit
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

Unterstützte Felder auf oberster Ebene:

| Feld                       | Standard                 | Bedeutung                                                                                                                                        |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `discovery`                | aktiviert                | Einstellungen für die Modellerkennung für Codex-App-Server `model/list`.                                                                        |
| `appServer`                | verwalteter stdio-App-Server | Einstellungen für Transport, Befehl, Authentifizierung, Genehmigung, Sandbox und Timeouts.                                                       |
| `codexDynamicToolsLoading` | `"searchable"`           | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Tool-Kontext einzufügen.                                |
| `codexDynamicToolsExclude` | `[]`                     | Zusätzliche Namen dynamischer OpenClaw-Tools, die aus Codex-App-Server-Turns ausgelassen werden sollen.                                         |
| `codexPlugins`             | deaktiviert              | Native Codex-Plugin-/App-Unterstützung für migrierte, aus dem Quellcode installierte kuratierte Plugins. Siehe [Native Codex-Plugins](/de/plugins/codex-native-plugins). |
| `computerUse`              | deaktiviert              | Einrichtung von Codex Computer Use. Siehe [Codex Computer Use](/de/plugins/codex-computer-use).                                                     |

## App-Server-Transport

Standardmäßig startet OpenClaw die verwaltete Codex-Binärdatei, die mit dem gebündelten Plugin ausgeliefert wird:

```bash
codex app-server --listen stdio://
```

Dadurch bleibt die App-Server-Version an das gebündelte `codex`-Plugin gebunden, statt an eine separat installierte lokale Codex-CLI. Setzen Sie
`appServer.command` nur, wenn Sie bewusst eine andere ausführbare Datei ausführen möchten.

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

| Feld                                          | Standardwert                                           | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` startet Codex; `"websocket"` verbindet mit `url`.                                                                                                                                                                                                                                                                                                                                                               |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isoliert den Codex-Zustand pro OpenClaw-Agent. `"user"` teilt das native `$CODEX_HOME` oder `~/.codex`, verwendet native Authentifizierung und aktiviert die nur dem Owner vorbehaltene Thread-Verwaltung. User-Scope erfordert stdio.                                                                                                                                                                           |
| `command`                                     | verwaltete Codex-Binärdatei                            | Ausführbare Datei für den stdio-Transport. Nicht setzen, um die verwaltete Binärdatei zu verwenden.                                                                                                                                                                                                                                                                                                                        |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumente für den stdio-Transport.                                                                                                                                                                                                                                                                                                                                                                                         |
| `url`                                         | nicht gesetzt                                          | WebSocket-app-server-URL.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `authToken`                                   | nicht gesetzt                                          | Bearer-Token für den WebSocket-Transport. Akzeptiert einen literalen String oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | Zusätzliche WebSocket-Header. Header-Werte akzeptieren literale Strings oder SecretInput-Werte, zum Beispiel `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                              |
| `clearEnv`                                    | `[]`                                                   | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-app-server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung erstellt hat.                                                                                                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | nicht gesetzt                                          | Remote-Arbeitsbereichs-Root des Codex app-server. Wenn gesetzt, leitet OpenClaw den lokalen Arbeitsbereichs-Root aus dem aufgelösten OpenClaw-Arbeitsbereich ab, behält das aktuelle cwd-Suffix unter diesem Remote-Root bei und sendet nur das endgültige app-server-cwd an Codex. Wenn das cwd außerhalb des aufgelösten OpenClaw-Arbeitsbereichs-Root liegt, schlägt OpenClaw geschlossen fehl, statt einen Gateway-lokalen Pfad an den Remote-app-server zu senden. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout für app-server-Control-Plane-Aufrufe.                                                                                                                                                                                                                                                                                                                                                                              |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ruhefenster, nachdem Codex einen Turn akzeptiert hat oder nach einer Turn-bezogenen app-server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                                                                       |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Abschluss-Leerlauf- und Fortschrittswächter, der nach einer Tool-Übergabe, dem Abschluss eines nativen Tools, Raw-Assistant-Fortschritt nach einem Tool, dem Abschluss von Raw-Reasoning oder Reasoning-Fortschritt verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder schwere Workloads, bei denen die Synthese nach einem Tool berechtigterweise länger ruhig bleiben kann als das finale Assistant-Freigabebudget. |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht verbieten | Voreinstellung für YOLO oder durch Guardian geprüfte Ausführung.                                                                                                                                                                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` oder eine zulässige Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die an Thread-Start, Resume und Turn gesendet wird.                                                                                                                                                                                                                                                                                                                                   |
| `sandbox`                                     | `"danger-full-access"` oder eine zulässige Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der an Thread-Start und Resume gesendet wird. Aktive OpenClaw-Sandboxes verengen `danger-full-access`-Turns auf Codex `workspace-write`; das Turn-Netzwerk-Flag folgt dem OpenClaw-Sandbox-Egress.                                                                                                                                                                                            |
| `approvalsReviewer`                           | `"user"` oder ein zulässiger Guardian-Reviewer          | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, wenn dies erlaubt ist.                                                                                                                                                                                                                                                                                                                  |
| `defaultWorkspaceDir`                         | aktuelles Prozessverzeichnis                           | Arbeitsbereich, der von `/codex bind` verwendet wird, wenn `--cwd` ausgelassen wird.                                                                                                                                                                                                                                                                                                                                       |
| `serviceTier`                                 | nicht gesetzt                                          | Optionale Codex app-server-Service-Stufe. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, und `null` entfernt die Überschreibung. Das Legacy-`"fast"` wird als `"priority"` akzeptiert.                                                                                                                                                                                                    |
| `networkProxy`                                | deaktiviert                                            | Aktiviert optional das Networking des Codex-Berechtigungsprofils für app-server-Befehle. OpenClaw definiert die ausgewählte `permissions.<profile>.network`-Konfiguration und wählt sie mit `default_permissions` aus, statt `sandbox` zu senden.                                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                                | Vorschau-Opt-in, das eine durch die OpenClaw-Sandbox gestützte Codex-Umgebung bei Codex app-server 0.132.0 oder neuer registriert, damit native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox laufen kann.                                                                                                                                                                                                        |

`appServer.networkProxy` ist explizit, weil es den Codex-Sandbox-Vertrag
ändert. Wenn aktiviert, setzt OpenClaw außerdem `features.network_proxy.enabled` und
`default_permissions` in der Codex-Thread-Konfiguration, damit das generierte Berechtigungsprofil
von Codex verwaltetes Networking starten kann. Standardmäßig generiert OpenClaw einen
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
`networkProxy` workspace-artigen Dateisystemzugriff für das generierte
Berechtigungsprofil. Die von Codex verwaltete Netzwerkdurchsetzung ist sandboxed Networking,
daher würde ein Profil mit Vollzugriff ausgehenden Datenverkehr nicht schützen.

Das Plugin blockiert ältere oder nicht versionierte App-Server-Handshakes. Der Codex-App-Server
muss die stabile Version `0.125.0` oder neuer melden.

OpenClaw behandelt nicht-loopback WebSocket-App-Server-URLs als remote und verlangt
identitätstragende WebSocket-Authentifizierung über `appServer.authToken` oder einen
`Authorization`-Header. `appServer.authToken` und jeder `appServer.headers.*`-Wert
können ein SecretInput sein; die Secrets-Laufzeit löst SecretRefs und Env-Kurzformen
auf, bevor OpenClaw App-Server-Startoptionen erstellt, und nicht aufgelöste
strukturierte SecretRefs schlagen fehl, bevor ein Token oder Header gesendet wird.
Wenn native Codex-Plugins konfiguriert sind, verwendet OpenClaw die Plugin-Kontrollebene
des verbundenen App-Servers, um diese Plugins zu installieren oder zu aktualisieren,
und aktualisiert anschließend das App-Inventar, damit Plugin-eigene Apps im Codex-Thread
sichtbar sind. `app/list` bleibt die maßgebliche Quelle für Inventar und Metadaten,
aber die OpenClaw-Richtlinie entscheidet, ob `thread/start`
`config.apps[appId].enabled = true` für eine aufgelistete zugängliche App sendet,
auch wenn Codex sie derzeit als deaktiviert markiert. Unbekannte oder fehlende App-IDs
bleiben fail-closed; dieser Pfad aktiviert Marketplace-Plugins nur über `plugin/install`
und aktualisiert das Inventar. Verbinden Sie OpenClaw nur mit Remote-App-Servern, denen
Sie zutrauen, von OpenClaw verwaltete Plugin-Installationen und App-Inventaraktualisierungen
zu akzeptieren.

## Genehmigungs- und Sandbox-Modi

Lokale stdio-App-Server-Sitzungen verwenden standardmäßig den YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Diese vertrauenswürdige lokale Operator-Haltung
ermöglicht unbeaufsichtigten OpenClaw-Turns und Heartbeats Fortschritt ohne native
Genehmigungsaufforderungen, die niemand beantworten kann.

Wenn Codex' lokale Systemanforderungsdatei implizite YOLO-Werte für Genehmigung,
Reviewer oder Sandbox untersagt, behandelt OpenClaw den impliziten Standard stattdessen
als Guardian und wählt zulässige Guardian-Berechtigungen aus. `tools.exec.mode: "auto"`
erzwingt ebenfalls von Guardian überprüfte Codex-Genehmigungen und bewahrt keine unsicheren
Legacy-Overrides für `approvalPolicy: "never"` oder `sandbox: "danger-full-access"`;
setzen Sie `tools.exec.mode: "full"` für eine beabsichtigte Haltung ohne Genehmigungen.
Hostname-passende
`[[remote_sandbox_config]]`-Einträge in derselben Anforderungsdatei werden für die
Sandbox-Standardentscheidung berücksichtigt.

Setzen Sie `appServer.mode: "guardian"` für von Codex Guardian überprüfte Genehmigungen:

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

Das Preset `guardian` wird zu `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` und `sandbox: "workspace-write"` erweitert, wenn diese
Werte zulässig sind. Einzelne Richtlinienfelder überschreiben `mode`. Der ältere
Reviewer-Wert `guardian_subagent` wird weiterhin als Kompatibilitätsalias akzeptiert,
neue Konfigurationen sollten jedoch `auto_review` verwenden.

Wenn eine OpenClaw-Sandbox aktiv ist, läuft der lokale Codex-App-Server-Prozess weiterhin
auf dem Gateway-Host. OpenClaw deaktiviert daher für diesen Turn den nativen Codex-Code-Modus,
Benutzer-MCP-Server und App-gestützte Plugin-Ausführung, statt Codex-Host-seitiges
Sandboxing als gleichwertig mit dem OpenClaw-Sandbox-Backend zu behandeln. Shell-Zugriff
wird über von der OpenClaw-Sandbox gestützte dynamische Tools wie `sandbox_exec` und
`sandbox_process` bereitgestellt, wenn die normalen Exec-/Process-Tools verfügbar sind.

Auf Ubuntu-/AppArmor-Hosts kann Codex bwrap unter `workspace-write` fehlschlagen, bevor
der Shell-Befehl startet, wenn Sie natives Codex-`workspace-write` absichtlich ohne aktives
OpenClaw-Sandboxing ausführen. Wenn Sie
`bwrap: setting up uid map: Permission denied` oder
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` sehen, führen Sie
`openclaw doctor` aus und beheben Sie die gemeldete Host-Namespace-Richtlinie für den
OpenClaw-Dienstbenutzer, statt dem Docker-Container weitergehende Berechtigungen zu geben.
Bevorzugen Sie ein eingegrenztes AppArmor-Profil für den Dienstprozess; der Fallback
`kernel.apparmor_restrict_unprivileged_userns=0` gilt hostweit und hat
Sicherheitsabwägungen.

## Sandbox-geschützte native Ausführung

Der stabile Standard ist fail-closed: Aktives OpenClaw-Sandboxing deaktiviert native
Codex-Ausführungsflächen, die sonst vom Codex-App-Server-Host laufen würden.
Verwenden Sie `appServer.experimental.sandboxExecServer: true` nur, wenn Sie Codex'
Remote-Umgebungsunterstützung mit dem Sandbox-Backend von OpenClaw ausprobieren möchten.
Dieser Vorschaupfad erfordert Codex-App-Server 0.132.0 oder neuer.

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

Wenn das Flag aktiviert ist und die aktuelle OpenClaw-Sitzung sandboxed ist, startet
OpenClaw einen lokalen loopback Exec-Server, der von der aktiven Sandbox gestützt wird,
registriert ihn beim Codex-App-Server und startet den Codex-Thread und -Turn mit dieser
OpenClaw-eigenen Umgebung. Wenn der App-Server die Umgebung nicht registrieren kann,
schlägt der Lauf fail-closed fehl, statt stillschweigend auf Host-Ausführung zurückzufallen.

Dieser Vorschaupfad ist nur lokal. Ein Remote-WebSocket-App-Server kann den loopback
Exec-Server nur erreichen, wenn er auf demselben Host läuft, daher lehnt OpenClaw diese
Kombination ab.

## Authentifizierung und Umgebungsisolation

Im standardmäßigen agentenspezifischen Home wird die Authentifizierung in dieser Reihenfolge
ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das bestehende Konto des App-Servers im Codex-Home dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein ChatGPT-Abonnement-artiges Codex-Authentifizierungsprofil erkennt,
entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten Codex-Kindprozess.
So bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle
verfügbar, ohne dass native Codex-App-Server-Turns versehentlich über die API abgerechnet
werden.

Explizite Codex-API-Schlüsselprofile und lokaler stdio-Env-Key-Fallback verwenden
App-Server-Login statt geerbter Kindprozess-Env. WebSocket-App-Server-Verbindungen
erhalten keinen Gateway-Env-API-Key-Fallback; verwenden Sie ein explizites
Authentifizierungsprofil oder das eigene Konto des Remote-App-Servers.

Stdio-App-Server-Starts erben standardmäßig die Prozessumgebung von OpenClaw.
OpenClaw besitzt die Codex-App-Server-Kontobrücke und setzt `CODEX_HOME` auf ein
agentenspezifisches Verzeichnis unter dem OpenClaw-State dieses Agenten. Dadurch bleiben
Codex-Konfiguration, Konten, Plugin-Cache/-Daten und Thread-State auf den OpenClaw-Agenten
beschränkt, statt aus dem persönlichen `~/.codex`-Home des Operators einzusickern.

Setzen Sie `appServer.homeScope: "user"`, um nativen Codex-State mit Codex Desktop und
der CLI zu teilen. Dieser nur lokale stdio-Modus verwendet `$CODEX_HOME`, wenn gesetzt,
andernfalls `~/.codex`, einschließlich nativer Authentifizierung, Konfiguration, Plugins
und Threads. OpenClaw überspringt seine Authentifizierungsprofil-Brücke für den App-Server.
Verifizierte Owner-Turns können `codex_threads` verwenden, um diese Threads aufzulisten,
zu durchsuchen, zu lesen, zu forken, umzubenennen, zu archivieren und wiederherzustellen.
Forken Sie einen Thread, bevor Sie ihn in OpenClaw fortsetzen; unabhängige Codex-Prozesse
koordinieren keine gleichzeitigen Schreiber für denselben Thread.

OpenClaw schreibt `HOME` für normale lokale App-Server-Starts nicht um. Von Codex ausgeführte
Subprozesse wie `openclaw`, `gh`, `git`, Cloud-CLIs und Shell-Befehle sehen das normale
Prozess-Home und können Benutzer-Home-Konfiguration und Tokens finden. Codex kann außerdem
`$HOME/.agents/skills` und `$HOME/.agents/plugins/marketplace.json` entdecken; diese
`.agents`-Erkennung wird absichtlich mit dem Operator-Home geteilt und ist vom isolierten
`~/.codex`-State getrennt.

Im standardmäßigen Agenten-Scope laufen OpenClaw-Plugins und OpenClaw-Skill-Snapshots
weiterhin über OpenClaws eigene Plugin-Registry und den Skill-Loader; persönliche
Codex-`~/.codex`-Assets nicht. Wenn Sie nützliche Codex-CLI-Skills oder Plugins aus einem
Codex-Home haben, die Teil eines isolierten OpenClaw-Agenten werden sollen, inventarisieren
Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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
OpenClaw entfernt `CODEX_HOME` und `HOME` während der lokalen Startnormalisierung aus
dieser Liste: `CODEX_HOME` zeigt weiterhin auf den ausgewählten Agenten- oder Benutzer-Scope,
und `HOME` bleibt geerbt, damit Subprozesse normalen Benutzer-Home-State verwenden können.

## Dynamische Tools

Dynamische Codex-Tools verwenden standardmäßig `searchable`-Laden. OpenClaw stellt keine
dynamischen Tools bereit, die native Codex-Workspace-Operationen duplizieren:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Die meisten übrigen OpenClaw-Integrationstools, etwa Messaging, Medien, Cron,
Browser, Nodes, Gateway, `heartbeat_respond` und `web_search`, sind über die
Codex-Toolsuche unter dem Namespace `openclaw` verfügbar. Dadurch bleibt der anfängliche
Modellkontext kleiner. `sessions_yield` und nur Message-Tool-Quellenantworten bleiben
direkt, weil sie Turn-Control-Verträge sind. `sessions_spawn` bleibt searchable, damit
Codex' natives `spawn_agent` die primäre Codex-Subagentenfläche bleibt, während explizite
OpenClaw- oder ACP-Delegation weiterhin über den dynamischen Tool-Namespace `openclaw`
verfügbar ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu einem
benutzerdefinierten Codex-App-Server herstellen, der zurückgestellte dynamische Tools
nicht durchsuchen kann, oder wenn Sie die vollständige Tool-Nutzlast debuggen.

## Timeouts

OpenClaw-eigene dynamische Tool-Aufrufe werden unabhängig von
`appServer.requestTimeoutMs` begrenzt. Jede Codex-`item/tool/call`-Anfrage verwendet
den ersten verfügbaren Timeout in dieser Reihenfolge:

- Ein positives per-call `timeoutMs`-Argument.
- Für `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Für `image_generate` ohne konfigurierten Timeout der 120-Sekunden-Standard für
  Bilderzeugung.
- Für das Media-Understanding-`image`-Tool `tools.media.image.timeoutSeconds`,
  in Millisekunden umgerechnet, oder der 60-Sekunden-Medienstandard. Für Image
  Understanding gilt dies für die Anfrage selbst und wird nicht durch frühere
  Vorbereitungsarbeit reduziert.
- Der 90-Sekunden-Standard für dynamische Tools.

Dieser Watchdog ist das äußere Budget für dynamische `item/tool/call`-Aufrufe.
Provider-spezifische Anfrage-Timeouts laufen innerhalb dieses Aufrufs und behalten ihre
eigene Timeout-Semantik. Budgets für dynamische Tools sind auf 600000 ms begrenzt.
Bei Timeout bricht OpenClaw das Tool-Signal ab, wo unterstützt, und gibt eine fehlgeschlagene
Dynamic-Tool-Antwort an Codex zurück, damit der Turn fortgesetzt werden kann, statt die
Sitzung in `processing` zu belassen.

Nachdem Codex einen Turn akzeptiert hat und nachdem OpenClaw auf eine turn-bezogene
App-Server-Anfrage geantwortet hat, erwartet das Harness, dass Codex im aktuellen Turn
Fortschritt macht und den nativen Turn schließlich mit `turn/completed` abschließt. Wenn
der App-Server für `appServer.turnCompletionIdleTimeoutMs` still bleibt, unterbricht
OpenClaw best-effort den Codex-Turn, zeichnet einen diagnostischen Timeout auf und gibt
die OpenClaw-Sitzungs-Lane frei, damit nachfolgende Chatnachrichten nicht hinter einem
veralteten nativen Turn in der Warteschlange hängen.

Die meisten nicht-terminalen Benachrichtigungen für denselben Durchlauf entschärfen diesen kurzen Watchdog,
weil Codex nachgewiesen hat, dass der Durchlauf noch aktiv ist. Tool-Übergaben verwenden ein längeres
Post-Tool-Leerlaufbudget: nachdem OpenClaw eine `item/tool/call`-Antwort zurückgibt, nachdem
native Tool-Items wie `commandExecution` abgeschlossen sind, nach rohen
`custom_tool_call_output`-Abschlüssen und nach rohem Assistant-Fortschritt nach einem Tool,
rohen Reasoning-Abschlüssen oder Reasoning-Fortschritt. Der Wächter verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn konfiguriert, und
standardmäßig sonst fünf Minuten. Dasselbe Post-Tool-Budget erweitert auch den
Fortschritts-Watchdog für das stille Synthesefenster, bevor Codex das nächste
Ereignis des aktuellen Durchlaufs ausgibt. Reasoning-Abschlüsse, Abschlüsse von
kommentierenden `agentMessage`-Nachrichten und roher Reasoning- oder Assistant-Fortschritt
vor einem Tool können von einer automatischen finalen Antwort gefolgt werden; daher verwenden
sie den Antwortwächter nach Fortschritt, statt die Sitzungs-Lane sofort freizugeben. Nur
finale/nicht-kommentierende abgeschlossene `agentMessage`-Items und rohe Assistant-Abschlüsse
vor einem Tool aktivieren die Freigabe nach Assistant-Ausgabe: Wenn Codex danach ohne
`turn/completed` still bleibt, unterbricht OpenClaw bestmöglich den nativen Durchlauf und gibt
die Sitzungs-Lane frei. Replay-sichere stdio-App-Server-Fehler, einschließlich
Leerlauf-Timeouts bei Durchlaufabschluss ohne Assistant-, Tool-, Active-Item- oder
Side-Effect-Evidence, werden einmal mit einem frischen App-Server-Versuch wiederholt. Unsichere
Timeouts setzen den hängenden App-Server-Client dennoch außer Betrieb und geben die OpenClaw-
Sitzungs-Lane frei. Außerdem löschen sie die veraltete native Thread-Bindung, statt automatisch
wiedergegeben zu werden. Completion-Watch-Timeouts zeigen Codex-spezifischen Timeout-Text:
Replay-sichere Fälle sagen, dass die Antwort unvollständig sein kann, während unsichere Fälle
den Benutzer auffordern, den aktuellen Zustand vor einem erneuten Versuch zu prüfen. Öffentliche
Timeout-Diagnosen enthalten strukturelle Felder wie die letzte App-Server-Benachrichtigungsmethode,
ID/Typ/Rolle des rohen Assistant-Response-Items, aktive Request-/Item-Zähler und den aktivierten
Watch-Zustand. Wenn die letzte Benachrichtigung ein rohes Assistant-Response-Item ist, enthalten
sie außerdem eine begrenzte Vorschau des Assistant-Texts. Sie enthalten keine rohen Prompt- oder
Tool-Inhalte.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Die
Modellverfügbarkeit wird vom Codex-App-Server verwaltet, daher kann sich die Liste ändern, wenn
OpenClaw die gebündelte `@openai/codex`-Version aktualisiert oder wenn eine Bereitstellung
`appServer.command` auf ein anderes Codex-Binary zeigt. Die Verfügbarkeit kann auch
kontobezogen sein. Verwenden Sie `/codex models` auf einem laufenden Gateway, um den Live-Katalog
für diesen Harness und dieses Konto zu sehen.

Wenn die Erkennung fehlschlägt oder ein Timeout erreicht, verwendet OpenClaw einen gebündelten
Fallback-Katalog für:

- GPT-5.5
- GPT-5.4 mini

Der aktuell gebündelte Harness ist `@openai/codex` `0.142.5`. Ein `model/list`-Probe gegen diesen
gebündelten App-Server gab diese öffentlichen Picker-Zeilen zurück:

| Modell-ID             | Eingabemodalitäten | Reasoning-Aufwände       |
| --------------------- | ------------------ | ------------------------ |
| `gpt-5.5`             | Text, Bild         | low, medium, high, xhigh |
| `gpt-5.4`             | Text, Bild         | low, medium, high, xhigh |
| `gpt-5.4-mini`        | Text, Bild         | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | Text               | low, medium, high, xhigh |

Ausgeblendete Modelle können vom App-Server-Katalog für interne oder spezialisierte Abläufe
zurückgegeben werden, sind aber keine normalen Optionen im Modell-Picker.

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

Deaktivieren Sie die Erkennung, wenn der Start keine Codex-Abfrage ausführen und nur den
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

Für OpenClaw-Workspace-Parität löst der Codex-Harness die anderen Bootstrap-Dateien auf.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` und `USER.md` werden als OpenClaw-Codex-Developer-
Anweisungen weitergeleitet, weil sie den aktiven Agenten, verfügbare Workspace-Anleitungen
und das Benutzerprofil definieren. Die kompakte OpenClaw-Skills-Liste wird als durchlaufbezogene
Developer-Anweisung zur Zusammenarbeit weitergeleitet. `HEARTBEAT.md`-Inhalt wird nicht
injiziert; Heartbeat-Durchläufe erhalten einen Zeiger im Kollaborationsmodus, die Datei zu lesen,
wenn sie existiert und nicht leer ist. `MEMORY.md`-Inhalt aus dem konfigurierten Agent-Workspace
wird nicht in native Codex-Durchlaufeingaben eingefügt, wenn Memory-Tools für diesen Workspace
verfügbar sind; wenn er existiert, fügt der Harness einen kleinen Workspace-Memory-Zeiger zu den
durchlaufbezogenen Developer-Anweisungen zur Zusammenarbeit hinzu, und Codex sollte `memory_search`
oder `memory_get` verwenden, wenn dauerhafter Speicher relevant ist. Wenn Tools deaktiviert sind,
die Memory-Suche nicht verfügbar ist oder sich der aktive Workspace vom Agent-Memory-Workspace
unterscheidet, verwendet `MEMORY.md` den normalen begrenzten Pfad für Durchlaufkontext.
`BOOTSTRAP.md` wird, wenn vorhanden, als OpenClaw-Referenzkontext für Durchlaufeingaben
weitergeleitet.

## Umgebungs-Overrides

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
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` für einmalige lokale Tests. Konfiguration wird für
wiederholbare Bereitstellungen bevorzugt, weil sie das Plugin-Verhalten in derselben geprüften
Datei hält wie den Rest der Codex-Harness-Einrichtung.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Runtime](/de/plugins/codex-harness-runtime)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex Computer Use](/de/plugins/codex-computer-use)
- [OpenAI-Provider](/de/providers/openai)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
