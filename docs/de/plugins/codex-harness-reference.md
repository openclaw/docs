---
read_when:
    - Sie benötigen jedes Codex-Harness-Konfigurationsfeld
    - Sie ändern das Transport-, Authentifizierungs-, Discovery- oder Timeout-Verhalten des App-Servers
    - Sie debuggen den Start des Codex-Harness, die Modellerkennung oder die Isolation der Umgebung
summary: Konfigurations-, Authentifizierungs-, Discovery- und App-Server-Referenz für den Codex-Harness
title: Codex-Harness-Referenz
x-i18n:
    generated_at: "2026-06-27T17:45:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32da817c262a61769b78b16c10e508175c730a568c2ba6321595c430815526a5
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

Diese Referenz behandelt die detaillierte Konfiguration für das gebündelte `codex`
Plugin. Für Einrichtung und Routing-Entscheidungen beginnen Sie mit
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

| Feld                       | Standard                 | Bedeutung                                                                                                                                                    |
| -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `discovery`                | aktiviert                | Einstellungen zur Modellerkennung für den Codex-App-Server `model/list`.                                                                                    |
| `appServer`                | verwalteter stdio-App-Server | Einstellungen für Transport, Befehl, Authentifizierung, Genehmigung, Sandbox und Timeouts.                                                                  |
| `codexDynamicToolsLoading` | `"searchable"`           | Verwenden Sie `"direct"`, um dynamische OpenClaw-Tools direkt in den anfänglichen Codex-Tool-Kontext aufzunehmen.                                          |
| `codexDynamicToolsExclude` | `[]`                     | Zusätzliche Namen dynamischer OpenClaw-Tools, die in Codex-App-Server-Turns ausgelassen werden sollen.                                                     |
| `codexPlugins`             | deaktiviert              | Native Unterstützung von Codex-Plugins/-Apps für migrierte, aus Quellen installierte kuratierte Plugins. Siehe [Native Codex-Plugins](/de/plugins/codex-native-plugins). |
| `computerUse`              | deaktiviert              | Einrichtung von Codex Computer Use. Siehe [Codex Computer Use](/de/plugins/codex-computer-use).                                                               |

## App-Server-Transport

Standardmäßig startet OpenClaw die verwaltete Codex-Binärdatei, die mit dem gebündelten
Plugin ausgeliefert wird:

```bash
codex app-server --listen stdio://
```

Dadurch bleibt die App-Server-Version an das gebündelte `codex` Plugin gebunden, statt an
eine separate Codex-CLI, die zufällig lokal installiert ist. Setzen Sie
`appServer.command` nur, wenn Sie bewusst eine andere
ausführbare Datei ausführen möchten.

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

| Feld                                          | Standardwert                                           | Bedeutung                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` startet Codex; `"websocket"` stellt eine Verbindung zu `url` her.                                                                                                                                                                                                                                                                                                                   |
| `command`                                     | verwaltete Codex-Binärdatei                            | Ausführbare Datei für den stdio-Transport. Nicht festlegen, um die verwaltete Binärdatei zu verwenden.                                                                                                                                                                                                                                                                                        |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argumente für den stdio-Transport.                                                                                                                                                                                                                                                                                                                                                            |
| `url`                                         | nicht festgelegt                                       | WebSocket-URL des App-Servers.                                                                                                                                                                                                                                                                                                                                                                |
| `authToken`                                   | nicht festgelegt                                       | Bearer-Token für den WebSocket-Transport. Akzeptiert eine Literalzeichenfolge oder SecretInput wie `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                               |
| `headers`                                     | `{}`                                                   | Zusätzliche WebSocket-Header. Header-Werte akzeptieren Literalzeichenfolgen oder SecretInput-Werte, zum Beispiel `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                             |
| `clearEnv`                                    | `[]`                                                   | Zusätzliche Namen von Umgebungsvariablen, die aus dem gestarteten stdio-App-Server-Prozess entfernt werden, nachdem OpenClaw seine geerbte Umgebung aufgebaut hat.                                                                                                                                                                                                                            |
| `remoteWorkspaceRoot`                         | nicht festgelegt                                       | Remote-Workspace-Root des Codex-App-Servers. Wenn festgelegt, leitet OpenClaw den lokalen Workspace-Root aus dem aufgelösten OpenClaw-Workspace ab, behält das aktuelle cwd-Suffix unter diesem Remote-Root bei und sendet nur das finale cwd des App-Servers an Codex. Wenn das cwd außerhalb des aufgelösten OpenClaw-Workspace-Roots liegt, schlägt OpenClaw geschlossen fehl, statt einen Gateway-lokalen Pfad an den Remote-App-Server zu senden. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout für Control-Plane-Aufrufe des App-Servers.                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Ruhefenster, nachdem Codex einen Turn akzeptiert hat oder nach einer Turn-bezogenen App-Server-Anfrage, während OpenClaw auf `turn/completed` wartet.                                                                                                                                                                                                                                          |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Completion-Idle- und Fortschrittswächter, der nach einer Tool-Übergabe, dem Abschluss eines nativen Tools, Raw-Assistant-Fortschritt nach einem Tool, Abschluss von Raw Reasoning oder Reasoning-Fortschritt verwendet wird, während OpenClaw auf `turn/completed` wartet. Verwenden Sie dies für vertrauenswürdige oder schwere Workloads, bei denen die Synthese nach einem Tool berechtigterweise länger ruhig bleiben kann als das finale Assistant-Release-Budget. |
| `mode`                                        | `"yolo"`, sofern lokale Codex-Anforderungen YOLO nicht verbieten | Preset für YOLO- oder Guardian-geprüfte Ausführung.                                                                                                                                                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` oder eine zulässige Guardian-Genehmigungsrichtlinie | Native Codex-Genehmigungsrichtlinie, die an Thread-Start, Fortsetzung und Turn gesendet wird.                                                                                                                                                                                                                                                                                                  |
| `sandbox`                                     | `"danger-full-access"` oder eine zulässige Guardian-Sandbox | Nativer Codex-Sandbox-Modus, der an Thread-Start und Fortsetzung gesendet wird. Aktive OpenClaw-Sandboxes grenzen `danger-full-access`-Turns auf Codex `workspace-write` ein; das Netzwerk-Flag des Turns folgt dem OpenClaw-Sandbox-Egress.                                                                                                                                                    |
| `approvalsReviewer`                           | `"user"` oder ein zulässiger Guardian-Reviewer         | Verwenden Sie `"auto_review"`, damit Codex native Genehmigungsaufforderungen prüft, sofern erlaubt.                                                                                                                                                                                                                                                                                            |
| `defaultWorkspaceDir`                         | aktuelles Prozessverzeichnis                           | Workspace, der von `/codex bind` verwendet wird, wenn `--cwd` ausgelassen wird.                                                                                                                                                                                                                                                                                                                |
| `serviceTier`                                 | nicht festgelegt                                       | Optionaler Codex-App-Server-Service-Tier. `"priority"` aktiviert Fast-Mode-Routing, `"flex"` fordert Flex-Verarbeitung an, und `null` löscht die Überschreibung. Das Legacy-`"fast"` wird als `"priority"` akzeptiert.                                                                                                                                                                         |
| `networkProxy`                                | deaktiviert                                            | Opt-in für Codex-Permissions-Profile-Networking für App-Server-Befehle. OpenClaw definiert die ausgewählte `permissions.<profile>.network`-Konfiguration und wählt sie mit `default_permissions` aus, statt `sandbox` zu senden.                                                                                                                                                               |
| `experimental.sandboxExecServer`              | `false`                                                | Vorschau-Opt-in, das bei Codex-App-Server 0.132.0 oder neuer eine von der OpenClaw-Sandbox gestützte Codex-Umgebung registriert, damit native Codex-Ausführung innerhalb der aktiven OpenClaw-Sandbox laufen kann.                                                                                                                                                                             |

`appServer.networkProxy` ist explizit, weil es den Codex-Sandbox-Vertrag
ändert. Wenn aktiviert, setzt OpenClaw auch `features.network_proxy.enabled` und
`default_permissions` in der Codex-Thread-Konfiguration, damit das generierte
Berechtigungsprofil Codex Managed Networking starten kann. Standardmäßig erzeugt
OpenClaw aus dem Profilkörper einen kollisionsresistenten Profilnamen
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

Wenn die normale App-Server-Laufzeit `danger-full-access` wäre, verwendet die
Aktivierung von `networkProxy` Dateisystemzugriff im Workspace-Stil für das
generierte Berechtigungsprofil. Von Codex verwaltete Netzwerkdurchsetzung ist
Sandboxed Networking, daher würde ein Full-Access-Profil ausgehenden Datenverkehr
nicht schützen.

Das Plugin blockiert ältere oder unversionierte App-Server-Handshakes. Der
Codex-App-Server muss die stabile Version `0.125.0` oder neuer melden.

OpenClaw behandelt Nicht-loopback-WebSocket-App-Server-URLs als remote und verlangt
identitätstragende WebSocket-Authentifizierung über `appServer.authToken` oder einen
`Authorization`-Header. `appServer.authToken` und jeder `appServer.headers.*`-Wert
kann ein SecretInput sein; die Secrets-Laufzeit löst SecretRefs und Env-Kurzformen auf,
bevor OpenClaw App-Server-Startoptionen erstellt, und nicht aufgelöste strukturierte
SecretRefs schlagen fehl, bevor ein Token oder Header gesendet wird. Wenn native Codex-
Plugins konfiguriert sind, verwendet OpenClaw die Plugin-Steuerungsebene des verbundenen
App-Servers, um diese Plugins zu installieren oder zu aktualisieren, und aktualisiert dann
das App-Inventar, damit Plugin-eigene Apps für den Codex-Thread sichtbar sind. `app/list`
bleibt weiterhin die maßgebliche Inventar- und Metadatenquelle, aber die OpenClaw-Policy
entscheidet, ob `thread/start` für eine aufgelistete zugängliche App
`config.apps[appId].enabled = true` sendet, auch wenn Codex sie derzeit als deaktiviert
markiert. Unbekannte oder fehlende App-IDs bleiben sicher geschlossen; dieser Pfad aktiviert
nur Marketplace-Plugins über `plugin/install` und aktualisiert das Inventar. Verbinden Sie
OpenClaw nur mit Remote-App-Servern, denen Sie zutrauen, von OpenClaw verwaltete
Plugin-Installationen und App-Inventaraktualisierungen anzunehmen.

## Genehmigungs- und Sandbox-Modi

Lokale stdio-App-Server-Sitzungen verwenden standardmäßig den YOLO-Modus:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` und
`sandbox: "danger-full-access"`. Diese vertrauenswürdige lokale Operator-Haltung ermöglicht
unbeaufsichtigten OpenClaw-Turns und Heartbeats Fortschritt ohne native
Genehmigungsaufforderungen, die niemand beantworten kann.

Wenn Codex' lokale Systemanforderungsdatei implizite YOLO-Werte für Genehmigung,
Reviewer oder Sandbox untersagt, behandelt OpenClaw die implizite Vorgabe stattdessen
als guardian und wählt erlaubte guardian-Berechtigungen. `tools.exec.mode: "auto"`
erzwingt ebenfalls von guardian geprüfte Codex-Genehmigungen und bewahrt keine unsicheren
Legacy-Overrides für `approvalPolicy: "never"` oder `sandbox: "danger-full-access"`;
setzen Sie `tools.exec.mode: "full"` für eine bewusst genehmigungsfreie Haltung.
Hostname-passende
`[[remote_sandbox_config]]`-Einträge in derselben Anforderungsdatei werden für die
Sandbox-Standardentscheidung berücksichtigt.

Setzen Sie `appServer.mode: "guardian"` für von Codex guardian-geprüfte Genehmigungen:

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
Werte erlaubt sind. Einzelne Policy-Felder überschreiben `mode`. Der ältere
Reviewer-Wert `guardian_subagent` wird weiterhin als Kompatibilitätsalias akzeptiert,
neue Konfigurationen sollten jedoch `auto_review` verwenden.

Wenn eine OpenClaw-Sandbox aktiv ist, läuft der lokale Codex-App-Server-Prozess weiterhin
auf dem Gateway-Host. OpenClaw deaktiviert daher für diesen Turn den nativen Codex Code Mode,
benutzerdefinierte MCP-Server und App-gestützte Plugin-Ausführung, statt hostseitiges
Codex-Sandboxing als gleichwertig mit dem OpenClaw-Sandbox-Backend zu behandeln.
Shell-Zugriff wird über OpenClaw-Sandbox-gestützte dynamische Tools wie `sandbox_exec`
und `sandbox_process` bereitgestellt, wenn die normalen exec/process-Tools verfügbar sind.

Auf Ubuntu/AppArmor-Hosts kann Codex bwrap unter `workspace-write` fehlschlagen, bevor
der Shell-Befehl startet, wenn Sie natives Codex-`workspace-write` bewusst ohne aktives
OpenClaw-Sandboxing ausführen. Wenn Sie
`bwrap: setting up uid map: Permission denied` oder
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted` sehen, führen Sie
`openclaw doctor` aus und beheben Sie die gemeldete Host-Namespace-Policy für den
OpenClaw-Servicebenutzer, statt umfassendere Docker-Containerberechtigungen zu gewähren.
Bevorzugen Sie ein eingegrenztes AppArmor-Profil für den Serviceprozess; der
Fallback `kernel.apparmor_restrict_unprivileged_userns=0` gilt hostweit und hat
Sicherheitsabwägungen.

## Sandboxierte native Ausführung

Die stabile Vorgabe ist sicher geschlossen: aktives OpenClaw-Sandboxing deaktiviert native
Codex-Ausführungsoberflächen, die andernfalls vom Codex-App-Server-Host ausgeführt würden.
Verwenden Sie `appServer.experimental.sandboxExecServer: true` nur, wenn Sie Codex'
Remote-Environment-Unterstützung mit OpenClaws Sandbox-Backend ausprobieren möchten. Dieser
Vorschaupfad erfordert Codex-App-Server 0.132.0 oder neuer.

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

Wenn das Flag aktiviert ist und die aktuelle OpenClaw-Sitzung sandboxiert ist, startet
OpenClaw einen lokalen local loopback exec-server, der von der aktiven Sandbox gestützt
wird, registriert ihn beim Codex-App-Server und startet den Codex-Thread und -Turn mit
dieser OpenClaw-eigenen Umgebung. Wenn der App-Server die Umgebung nicht registrieren kann,
schlägt der Lauf sicher geschlossen fehl, statt stillschweigend auf Host-Ausführung
zurückzufallen.

Dieser Vorschaupfad ist nur lokal verfügbar. Ein Remote-WebSocket-App-Server kann den
loopback exec-server nicht erreichen, sofern er nicht auf demselben Host läuft; daher lehnt
OpenClaw diese Kombination ab.

## Authentifizierung und Umgebungsisolierung

Authentifizierung wird in dieser Reihenfolge ausgewählt:

1. Ein explizites OpenClaw-Codex-Authentifizierungsprofil für den Agenten.
2. Das bestehende Konto des App-Servers im Codex-Home dieses Agenten.
3. Nur für lokale stdio-App-Server-Starts: `CODEX_API_KEY`, dann
   `OPENAI_API_KEY`, wenn kein App-Server-Konto vorhanden ist und OpenAI-Authentifizierung
   weiterhin erforderlich ist.

Wenn OpenClaw ein Codex-Authentifizierungsprofil im Stil eines ChatGPT-Abonnements erkennt,
entfernt es `CODEX_API_KEY` und `OPENAI_API_KEY` aus dem erzeugten Codex-Kindprozess. Dadurch
bleiben API-Schlüssel auf Gateway-Ebene für Embeddings oder direkte OpenAI-Modelle verfügbar,
ohne dass native Codex-App-Server-Turns versehentlich über die API abgerechnet werden.

Explizite Codex-API-Schlüsselprofile und lokale stdio-Env-Key-Fallbacks verwenden
App-Server-Login statt geerbter Kindprozess-Env. WebSocket-App-Server-Verbindungen erhalten
keinen Gateway-Env-API-Key-Fallback; verwenden Sie ein explizites Authentifizierungsprofil
oder das eigene Konto des Remote-App-Servers.

Stdio-App-Server-Starts erben standardmäßig die Prozessumgebung von OpenClaw. OpenClaw besitzt
die Codex-App-Server-Konto-Bridge und setzt `CODEX_HOME` auf ein agentenspezifisches
Verzeichnis unterhalb des OpenClaw-Status dieses Agenten. Dadurch bleiben Codex-Konfiguration,
Konten, Plugin-Cache/-Daten und Thread-Status auf den OpenClaw-Agenten begrenzt, statt aus dem
persönlichen `~/.codex`-Home des Operators einzusickern.

OpenClaw schreibt `HOME` für normale lokale App-Server-Starts nicht um. Von Codex ausgeführte
Subprozesse wie `openclaw`, `gh`, `git`, Cloud-CLIs und Shell-Befehle sehen das normale
Prozess-Home und können User-Home-Konfiguration und Tokens finden. Codex kann außerdem
`$HOME/.agents/skills` und `$HOME/.agents/plugins/marketplace.json` entdecken; diese
`.agents`-Discovery wird absichtlich mit dem Operator-Home geteilt und ist vom isolierten
`~/.codex`-Status getrennt.

OpenClaw-Plugins und OpenClaw-Skill-Snapshots laufen weiterhin über OpenClaws eigene
Plugin-Registry und den Skill-Loader. Persönliche Codex-`~/.codex`-Assets tun das nicht. Wenn
Sie nützliche Codex-CLI-Skills oder Plugins aus einem Codex-Home haben, die Teil eines
OpenClaw-Agenten werden sollen, inventarisieren Sie sie explizit:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

Wenn ein Deployment zusätzliche Umgebungsisolierung benötigt, fügen Sie diese Variablen zu
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
OpenClaw entfernt `CODEX_HOME` und `HOME` während der lokalen Startnormalisierung aus dieser
Liste: `CODEX_HOME` bleibt agentenspezifisch, und `HOME` bleibt geerbt, damit Subprozesse
normalen User-Home-Status verwenden können.

## Dynamische Tools

Codex-dynamische Tools verwenden standardmäßig `searchable`-Laden. OpenClaw stellt keine
dynamischen Tools bereit, die native Codex-Workspace-Operationen duplizieren:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

Die meisten verbleibenden OpenClaw-Integrationstools, etwa Messaging, Medien, Cron,
Browser, Nodes, Gateway, `heartbeat_respond` und `web_search`, sind über die
Codex-Toolsuche unter dem Namespace `openclaw` verfügbar. Dadurch bleibt der anfängliche
Modellkontext kleiner. `sessions_yield` und Nur-Message-Tool-Quellantworten bleiben direkt,
weil dies Turn-Steuerungsverträge sind. `sessions_spawn` bleibt durchsuchbar, sodass Codex'
natives `spawn_agent` die primäre Codex-Subagent-Oberfläche bleibt, während explizite
OpenClaw- oder ACP-Delegation weiterhin über den dynamischen Tool-Namespace `openclaw`
verfügbar ist.

Setzen Sie `codexDynamicToolsLoading: "direct"` nur, wenn Sie eine Verbindung zu einem
benutzerdefinierten Codex-App-Server herstellen, der zurückgestellte dynamische Tools nicht
durchsuchen kann, oder wenn Sie die vollständige Tool-Nutzlast debuggen.

## Timeouts

OpenClaw-eigene dynamische Toolaufrufe werden unabhängig von `appServer.requestTimeoutMs`
begrenzt. Jede Codex-`item/tool/call`-Anfrage verwendet den ersten verfügbaren Timeout in
dieser Reihenfolge:

- Ein positives `timeoutMs`-Argument pro Aufruf.
- Für `image_generate`, `agents.defaults.imageGenerationModel.timeoutMs`.
- Für `image_generate` ohne konfigurierten Timeout die 120-Sekunden-Standardvorgabe für
  Bildgenerierung.
- Für das Medienverständnis-Tool `image`, `tools.media.image.timeoutSeconds` in Millisekunden
  umgerechnet, oder die 60-Sekunden-Medienvorgabe. Für Bildverständnis gilt dies für die
  Anfrage selbst und wird nicht durch frühere Vorbereitungsarbeit reduziert.
- Die 90-Sekunden-Standardvorgabe für dynamische Tools.

Dieser Watchdog ist das äußere Budget für dynamische `item/tool/call`-Aufrufe.
Provider-spezifische Anfrage-Timeouts laufen innerhalb dieses Aufrufs und behalten ihre
eigene Timeout-Semantik. Budgets für dynamische Tools sind auf 600000 ms begrenzt. Bei einem
Timeout bricht OpenClaw das Tool-Signal ab, sofern unterstützt, und gibt eine fehlgeschlagene
dynamische Toolantwort an Codex zurück, damit der Turn fortgesetzt werden kann, statt die
Sitzung in `processing` zu belassen.

Nachdem Codex einen Turn akzeptiert hat und nachdem OpenClaw auf eine turn-bezogene
App-Server-Anfrage geantwortet hat, erwartet das Harness, dass Codex im aktuellen Turn
Fortschritt macht und den nativen Turn schließlich mit `turn/completed` beendet. Wenn der
App-Server für `appServer.turnCompletionIdleTimeoutMs` still bleibt, unterbricht OpenClaw
nach bestem Bemühen den Codex-Turn, zeichnet einen diagnostischen Timeout auf und gibt die
OpenClaw-Sitzungsspur frei, damit nachfolgende Chatnachrichten nicht hinter einem veralteten
nativen Turn in der Warteschlange bleiben.

Die meisten nicht-terminalen Benachrichtigungen für denselben Turn entschärfen diesen kurzen Watchdog,
weil Codex bewiesen hat, dass der Turn noch aktiv ist. Tool-Übergaben verwenden ein längeres
Leerlaufbudget nach dem Tool: nachdem OpenClaw eine `item/tool/call`-Antwort zurückgibt, nachdem
native Tool-Items wie `commandExecution` abgeschlossen sind, nach rohen
`custom_tool_call_output`-Abschlüssen sowie nach rohem Assistentenfortschritt nach dem Tool,
rohen Reasoning-Abschlüssen oder Reasoning-Fortschritt. Der Schutz verwendet
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`, wenn konfiguriert, und
standardmäßig andernfalls fünf Minuten. Dasselbe Post-Tool-Budget verlängert auch den
Fortschritts-Watchdog für das stille Synthesefenster, bevor Codex das nächste
Ereignis des aktuellen Turns ausgibt. Reasoning-Abschlüsse, `agentMessage`-Abschlüsse im
commentary-Kanal sowie roher Reasoning- oder Assistentenfortschritt vor einem Tool
können von einer automatischen finalen Antwort gefolgt werden; deshalb verwenden sie den
Antwortschutz nach Fortschritt, statt die Sitzungsspur sofort freizugeben. Nur finale/nicht-kommentierende
abgeschlossene `agentMessage`-Items und rohe Assistentenabschlüsse vor einem Tool aktivieren
die Freigabe bei Assistentenausgabe: Wenn Codex danach ohne `turn/completed` still bleibt,
unterbricht OpenClaw den nativen Turn nach bestem Bemühen und gibt die Sitzungsspur frei.
Replay-sichere stdio-App-Server-Fehler, einschließlich Leerlauf-Timeouts beim Turn-Abschluss ohne
Assistenten-, Tool-, aktives-Item- oder Side-Effect-Nachweis, werden einmal mit einem frischen
App-Server-Versuch erneut versucht. Unsichere Timeouts mustern den feststeckenden App-Server-Client
trotzdem aus und geben die OpenClaw-Sitzungsspur frei. Außerdem löschen sie die veraltete native
Thread-Bindung, statt automatisch erneut abgespielt zu werden. Completion-Watch-Timeouts zeigen
Codex-spezifischen Timeout-Text an: Replay-sichere Fälle sagen, dass die Antwort unvollständig
sein kann, während unsichere Fälle den Benutzer auffordern, den aktuellen Zustand vor einem
erneuten Versuch zu prüfen. Öffentliche Timeout-Diagnosen enthalten strukturelle Felder wie die
letzte App-Server-Benachrichtigungsmethode, die rohe Assistenten-Antwort-Item-ID/den Typ/die Rolle,
aktive Request-/Item-Zahlen und den scharfgeschalteten Watch-Zustand. Wenn die letzte
Benachrichtigung ein rohes Assistenten-Antwort-Item ist, enthalten sie außerdem eine begrenzte
Vorschau des Assistententexts. Sie enthalten keine rohen Prompt- oder Tool-Inhalte.

## Modellerkennung

Standardmäßig fragt das Codex-Plugin den App-Server nach verfügbaren Modellen. Die
Modellverfügbarkeit gehört dem Codex-App-Server; daher kann sich die Liste ändern, wenn OpenClaw
die gebündelte Version von `@openai/codex` aktualisiert oder wenn ein Deployment
`appServer.command` auf ein anderes Codex-Binary verweist. Die Verfügbarkeit kann auch
kontogebunden sein. Verwenden Sie `/codex models` auf einem laufenden Gateway, um den Live-Katalog
für diesen Harness und dieses Konto zu sehen.

Wenn die Erkennung fehlschlägt oder ein Timeout erreicht, verwendet OpenClaw einen gebündelten
Fallback-Katalog für:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Der aktuell gebündelte Harness ist `@openai/codex` `0.139.0`. Ein `model/list`-Probe
gegen diesen gebündelten App-Server gab Folgendes zurück:

| Modell-ID       | Standard | Versteckt | Eingabemodalitäten | Reasoning-Aufwände       |
| --------------- | -------- | --------- | ------------------ | ------------------------ |
| `gpt-5.5`       | Ja       | Nein      | text, image        | low, medium, high, xhigh |
| `gpt-5.4`       | Nein     | Nein      | text, image        | low, medium, high, xhigh |
| `gpt-5.4-mini`  | Nein     | Nein      | text, image        | low, medium, high, xhigh |
| `gpt-5.3-codex` | Nein     | Nein      | text, image        | low, medium, high, xhigh |
| `gpt-5.2`       | Nein     | Nein      | text, image        | low, medium, high, xhigh |

Versteckte Modelle können vom App-Server-Katalog für interne oder spezialisierte Flows
zurückgegeben werden, sind aber keine normalen Optionen im Modellwähler.

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

Codex verarbeitet `AGENTS.md` selbst über die native Projektdokument-Erkennung. OpenClaw
schreibt keine synthetischen Codex-Projektdokumentdateien und hängt nicht von Codex-Fallback-
Dateinamen für Persona-Dateien ab, weil Codex-Fallbacks nur greifen, wenn `AGENTS.md` fehlt.

Für OpenClaw-Workspace-Parität löst der Codex-Harness die anderen Bootstrap-Dateien auf.
`SOUL.md`, `IDENTITY.md`, `TOOLS.md` und `USER.md` werden als OpenClaw-Codex-Entwickleranweisungen
weitergegeben, weil sie den aktiven Agenten, verfügbare Workspace-Anleitungen und das Benutzerprofil
definieren. Die kompakte OpenClaw-Skills-Liste wird als turn-bezogene Entwickleranweisung zur
Zusammenarbeit weitergegeben. `HEARTBEAT.md`-Inhalt wird nicht injiziert; Heartbeat-Turns erhalten
einen Zeiger im Zusammenarbeitsmodus, die Datei zu lesen, wenn sie existiert und nicht leer ist.
`MEMORY.md`-Inhalt aus dem konfigurierten Agenten-Workspace wird nicht in die native Codex-Turn-Eingabe
eingefügt, wenn Speicher-Tools für diesen Workspace verfügbar sind; wenn er existiert, fügt der
Harness den turn-bezogenen Entwickleranweisungen zur Zusammenarbeit einen kleinen Workspace-Memory-
Zeiger hinzu, und Codex sollte `memory_search` oder `memory_get` verwenden, wenn dauerhafter
Speicher relevant ist. Wenn Tools deaktiviert sind, die Speichersuche nicht verfügbar ist oder der
aktive Workspace vom Agenten-Memory-Workspace abweicht, verwendet `MEMORY.md` den normalen begrenzten
Turn-Kontextpfad. `BOOTSTRAP.md` wird, wenn vorhanden, als OpenClaw-Turn-Eingabe-Referenzkontext
weitergegeben.

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
wiederholbare Deployments bevorzugt, weil sie das Plugin-Verhalten in derselben geprüften Datei
wie den Rest der Codex-Harness-Einrichtung hält.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Native Codex-Plugins](/de/plugins/codex-native-plugins)
- [Codex Computer Use](/de/plugins/codex-computer-use)
- [OpenAI-Provider](/de/providers/openai)
- [Konfigurationsreferenz](/de/gateway/configuration-reference)
