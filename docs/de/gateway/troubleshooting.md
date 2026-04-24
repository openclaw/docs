---
read_when:
    - Der Hub zur Fehlerbehebung hat Sie für eine eingehendere Diagnose hierher verwiesen.
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen
summary: Ausführliches Runbook zur Fehlerbehebung für Gateway, Channels, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-04-24T08:57:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20066bdab03f05304b3a620fbadc38e4dc74b740da151c58673dcf5196e5f1e1
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway-Fehlerbehebung

Diese Seite ist das ausführliche Runbook.
Beginnen Sie bei [/help/troubleshooting](/de/help/troubleshooting), wenn Sie zuerst den schnellen Triage-Ablauf möchten.

## Befehlsleiter

Führen Sie zuerst diese Befehle in dieser Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Erwartete Signale für einen fehlerfreien Zustand:

- `openclaw gateway status` zeigt `Runtime: running`, `Connectivity probe: ok` und eine Zeile `Capability: ...`.
- `openclaw doctor` meldet keine blockierenden Config-/Service-Probleme.
- `openclaw channels status --probe` zeigt den Live-Transportstatus pro Account und, wo unterstützt, Probe-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Anthropic 429: zusätzliche Nutzung für langen Kontext erforderlich

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf Folgendes:

- Das ausgewählte Anthropic-Opus-/Sonnet-Modell hat `params.context1m: true`.
- Die aktuelle Anthropic-Anmeldeinformation ist nicht für die Nutzung mit langem Kontext geeignet.
- Anfragen schlagen nur bei langen Sitzungen/Modelläufen fehl, die den 1M-Beta-Pfad benötigen.

Optionen zur Behebung:

1. Deaktivieren Sie `context1m` für dieses Modell, damit auf das normale Kontextfenster zurückgefallen wird.
2. Verwenden Sie eine Anthropic-Anmeldeinformation, die für Anfragen mit langem Kontext geeignet ist, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
3. Konfigurieren Sie Fallback-Modelle, damit Läufe fortgesetzt werden, wenn Anthropic-Anfragen mit langem Kontext abgelehnt werden.

Verwandt:

- [/providers/anthropic](/de/providers/anthropic)
- [/reference/token-use](/de/reference/token-use)
- [/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/de/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokales OpenAI-kompatibles Backend besteht direkte Probes, aber Agent-Läufe schlagen fehl

Verwenden Sie dies, wenn:

- `curl ... /v1/models` funktioniert
- kleine direkte `/v1/chat/completions`-Aufrufe funktionieren
- OpenClaw-Modelläufe nur bei normalen Agent-Turns fehlschlagen

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Achten Sie auf Folgendes:

- direkte kleine Aufrufe sind erfolgreich, aber OpenClaw-Läufe schlagen nur bei größeren Prompts fehl
- Backend-Fehler darüber, dass `messages[].content` einen String erwartet
- Backend-Abstürze, die nur bei größeren Prompt-Token-Zahlen oder vollständigen Agent-Runtime-Prompts auftreten

Häufige Signaturen:

- `messages[...].content: invalid type: sequence, expected a string` → das Backend lehnt strukturierte Chat-Completions-Content-Teile ab. Behebung: Setzen Sie `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- direkte kleine Anfragen sind erfolgreich, aber OpenClaw-Agent-Läufe schlagen mit Backend-/Modellabstürzen fehl (zum Beispiel Gemma auf einigen `inferrs`-Builds) → der OpenClaw-Transport ist wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Prompt-Form der Agent-Runtime.
- Fehler werden geringer, nachdem Tools deaktiviert wurden, verschwinden aber nicht → Tool-Schemas waren Teil der Belastung, aber das verbleibende Problem liegt weiterhin bei der Upstream-Modell-/Server-Kapazität oder einem Backend-Bug.

Optionen zur Behebung:

1. Setzen Sie `compat.requiresStringContent: true` für Chat-Completions-Backends, die nur Strings unterstützen.
2. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die die Tool-Schema-Oberfläche von OpenClaw nicht zuverlässig verarbeiten können.
3. Verringern Sie nach Möglichkeit den Prompt-Druck: kleinerer Workspace-Bootstrap, kürzere Sitzungshistorie, leichteres lokales Modell oder ein Backend mit stärkerer Unterstützung für langen Kontext.
4. Wenn direkte kleine Anfragen weiterhin erfolgreich sind, während OpenClaw-Agent-Turns im Backend weiterhin abstürzen, behandeln Sie dies als Einschränkung des Upstream-Servers/-Modells und melden Sie dort eine Reproduktion mit der akzeptierten Payload-Form.

Verwandt:

- [/gateway/local-models](/de/gateway/local-models)
- [/gateway/configuration](/de/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/de/gateway/configuration-reference#openai-compatible-endpoints)

## Keine Antworten

Wenn Channels aktiv sind, aber nichts antwortet, prüfen Sie Routing und Richtlinien, bevor Sie irgendetwas neu verbinden.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Achten Sie auf Folgendes:

- Pairing ausstehend für DM-Absender.
- Erwähnungs-Gating in Gruppen (`requireMention`, `mentionPatterns`).
- Nicht übereinstimmende Channel-/Gruppen-Allowlist-Einträge.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird ignoriert, bis eine Erwähnung erfolgt.
- `pairing request` → der Absender benötigt eine Freigabe.
- `blocked` / `allowlist` → Absender/Channel wurde durch die Richtlinie gefiltert.

Verwandt:

- [/channels/troubleshooting](/de/channels/troubleshooting)
- [/channels/pairing](/de/channels/pairing)
- [/channels/groups](/de/channels/groups)

## Verbindungsprobleme der Dashboard-/Control-UI

Wenn die Dashboard-/Control-UI keine Verbindung herstellt, prüfen Sie URL, Authentifizierungsmodus und Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf Folgendes:

- Korrekte Probe-URL und Dashboard-URL.
- Nicht übereinstimmender Authentifizierungsmodus/Token zwischen Client und Gateway.
- HTTP-Verwendung dort, wo Geräteidentität erforderlich ist.

Häufige Signaturen:

- `device identity required` → unsicherer Kontext oder fehlende Geräteauthentifizierung.
- `origin not allowed` → der Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins` enthalten (oder Sie verbinden sich von einem Nicht-Loopback-Browser-Origin ohne explizite Allowlist).
- `device nonce required` / `device nonce mismatch` → der Client schließt den challengebasierten Geräteauthentifizierungsablauf nicht ab (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → der Client hat die falsche Payload (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
- `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → der Client kann einen vertrauenswürdigen erneuten Versuch mit einem zwischengespeicherten Geräte-Token durchführen.
- Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet erneut den zwischengespeicherten Scope-Satz, der zusammen mit dem gepaarten Geräte-Token gespeichert wurde. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihren angeforderten Scope-Satz bei.
- Außerhalb dieses Wiederholungspfads gilt für die Verbindungsauthentifizierung folgende Vorrangreihenfolge: zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
- Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, ip}` serialisiert, bevor der Limiter den Fehlschlag aufzeichnet. Zwei schlechte gleichzeitige Wiederholungsversuche desselben Clients können deshalb beim zweiten Versuch `retry later` anzeigen statt zwei einfacher Nichtübereinstimmungen.
- `too many failed authentication attempts (retry later)` von einem Loopback-Client mit Browser-Origin → wiederholte Fehlschläge desselben normalisierten `Origin` werden vorübergehend gesperrt; ein anderer localhost-Origin verwendet einen separaten Bucket.
- wiederholtes `unauthorized` nach diesem Wiederholungsversuch → gemeinsames Token/Geräte-Token ist auseinandergeraten; aktualisieren Sie die Token-Config und genehmigen/rotieren Sie das Geräte-Token bei Bedarf erneut.
- `gateway connect failed:` → falsches Host-/Port-/URL-Ziel.

### Kurzübersicht zu Authentifizierungs-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Maßnahme auszuwählen:

| Detailcode                  | Bedeutung                                                                                                                                                                                    | Empfohlene Maßnahme                                                                                                                                                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Der Client hat kein erforderliches gemeinsames Token gesendet.                                                                                                                               | Fügen Sie das Token im Client ein bzw. setzen Sie es und versuchen Sie es erneut. Für Dashboard-Pfade: `openclaw config get gateway.auth.token` und dann in die Einstellungen der Control UI einfügen.                                                                               |
| `AUTH_TOKEN_MISMATCH`       | Das gemeinsame Token stimmte nicht mit dem Gateway-Authentifizierungstoken überein.                                                                                                          | Wenn `canRetryWithDeviceToken=true`, erlauben Sie einen vertrauenswürdigen erneuten Versuch. Wiederholungsversuche mit zwischengespeichertem Token verwenden erneut die gespeicherten freigegebenen Scopes; Aufrufer mit explizitem `deviceToken` / `scopes` behalten die angeforderten Scopes bei. Wenn es weiterhin fehlschlägt, führen Sie die [Checkliste zur Wiederherstellung bei Token-Drift](/de/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Das zwischengespeicherte Token pro Gerät ist veraltet oder widerrufen.                                                                                                                       | Rotieren bzw. genehmigen Sie das Geräte-Token mit der [devices CLI](/de/cli/devices) erneut und verbinden Sie sich dann erneut.                                                                                                                                                           |
| `PAIRING_REQUIRED`          | Die Geräteidentität benötigt eine Freigabe. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade`, und verwenden Sie `requestId` / `remediationHint`, wenn vorhanden. | Genehmigen Sie die ausstehende Anfrage: `openclaw devices list` und dann `openclaw devices approve <requestId>`. Scope-/Rollen-Upgrades verwenden nach Prüfung des angeforderten Zugriffs denselben Ablauf.                                                                            |

Prüfung der Migration auf Geräteauthentifizierung v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn die Logs Nonce-/Signaturfehler zeigen, aktualisieren Sie den verbindenden Client und prüfen Sie, dass er:

1. auf `connect.challenge` wartet
2. die an die Challenge gebundene Payload signiert
3. `connect.params.device.nonce` mit derselben Challenge-Nonce sendet

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet verweigert wird:

- Sitzungen mit gepaartem Geräte-Token können nur **ihr eigenes** Gerät verwalten, es sei denn, der Aufrufer hat zusätzlich `operator.admin`
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern, die die Sitzung des Aufrufers bereits besitzt

Verwandt:

- [/web/control-ui](/de/web/control-ui)
- [/gateway/configuration](/de/gateway/configuration) (Gateway-Authentifizierungsmodi)
- [/gateway/trusted-proxy-auth](/de/gateway/trusted-proxy-auth)
- [/gateway/remote](/de/gateway/remote)
- [/cli/devices](/de/cli/devices)

## Gateway-Service läuft nicht

Verwenden Sie dies, wenn der Service installiert ist, der Prozess aber nicht aktiv bleibt.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # auch systemweite Services prüfen
```

Achten Sie auf Folgendes:

- `Runtime: stopped` mit Hinweisen zum Beenden.
- Nicht übereinstimmende Service-Config (`Config (cli)` vs `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche launchd-/systemd-/schtasks-Installationen, wenn `--deep` verwendet wird.
- Hinweise zur Bereinigung unter `Other gateway-like services detected (best effort)`.

Häufige Signaturen:

- `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → der lokale Gateway-Modus ist nicht aktiviert, oder die Config-Datei wurde beschädigt und hat `gateway.mode` verloren. Behebung: Setzen Sie `gateway.mode="local"` in Ihrer Config oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete Konfiguration für den lokalen Modus wiederherzustellen. Wenn Sie OpenClaw über Podman ausführen, ist der Standardpfad der Config `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → Nicht-Loopback-Bind ohne gültigen Gateway-Authentifizierungspfad (Token/Passwort oder, falls konfiguriert, Trusted Proxy).
- `another gateway instance is already listening` / `EADDRINUSE` → Port-Konflikt.
- `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Units sind vorhanden. Die meisten Setups sollten ein Gateway pro Rechner beibehalten; wenn Sie tatsächlich mehr als eines benötigen, isolieren Sie Ports sowie Config/State/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).

Verwandt:

- [/gateway/background-process](/de/gateway/background-process)
- [/gateway/configuration](/de/gateway/configuration)
- [/gateway/doctor](/de/gateway/doctor)

## Gateway hat die zuletzt bekannte funktionierende Config wiederhergestellt

Verwenden Sie dies, wenn das Gateway startet, die Logs aber melden, dass `openclaw.json` wiederhergestellt wurde.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Achten Sie auf Folgendes:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Eine mit Zeitstempel versehene Datei `openclaw.json.clobbered.*` neben der aktiven Config
- Ein Systemereignis des Haupt-Agents, das mit `Config recovery warning` beginnt

Was passiert ist:

- Die abgelehnte Config hat bei Start oder Hot-Reload die Validierung nicht bestanden.
- OpenClaw hat die abgelehnte Payload als `.clobbered.*` bewahrt.
- Die aktive Config wurde aus der zuletzt validierten, zuletzt bekannten funktionierenden Kopie wiederhergestellt.
- Der nächste Turn des Haupt-Agents wird gewarnt, die abgelehnte Config nicht blind neu zu schreiben.

Prüfen und reparieren:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Häufige Signaturen:

- `.clobbered.*` ist vorhanden → eine externe direkte Bearbeitung oder ein Start-Lesevorgang wurde wiederhergestellt.
- `.rejected.*` ist vorhanden → ein OpenClaw-eigener Schreibvorgang für die Config ist vor dem Commit an Schema- oder Clobber-Prüfungen gescheitert.
- `Config write rejected:` → der Schreibvorgang hätte versucht, die erforderliche Struktur zu entfernen, die Datei stark zu verkleinern oder eine ungültige Config zu speichern.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oder `size-drop-vs-last-good:*` → beim Start wurde die aktuelle Datei als beschädigt behandelt, weil ihr im Vergleich zum zuletzt bekannten funktionierenden Backup Felder oder Größe fehlten.
- `Config last-known-good promotion skipped` → der Kandidat enthielt redigierte Secret-Platzhalter wie `***`.

Optionen zur Behebung:

1. Behalten Sie die wiederhergestellte aktive Config bei, wenn sie korrekt ist.
2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*` und wenden Sie sie dann mit `openclaw config set` oder `config.patch` an.
3. Führen Sie vor einem Neustart `openclaw config validate` aus.
4. Wenn Sie von Hand bearbeiten, behalten Sie die vollständige JSON5-Config bei und nicht nur das Teilobjekt, das Sie ändern wollten.

Verwandt:

- [/gateway/configuration#strict-validation](/de/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/de/gateway/configuration#config-hot-reload)
- [/cli/config](/de/cli/config)
- [/gateway/doctor](/de/gateway/doctor)

## Gateway-Probe-Warnungen

Verwenden Sie dies, wenn `openclaw gateway probe` etwas erreicht, aber trotzdem einen Warnblock ausgibt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Achten Sie auf Folgendes:

- `warnings[].code` und `primaryTargetId` in der JSON-Ausgabe.
- Ob sich die Warnung auf SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Auth-Referenzen bezieht.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → das SSH-Setup ist fehlgeschlagen, aber der Befehl hat trotzdem direkte konfigurierte/Loopback-Ziele versucht.
- `multiple reachable gateways detected` → mehr als ein Ziel hat geantwortet. Normalerweise bedeutet das ein beabsichtigtes Multi-Gateway-Setup oder veraltete/duplizierte Listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → die Verbindung hat funktioniert, aber das Detail-RPC ist durch Scopes eingeschränkt; pairen Sie die Geräteidentität oder verwenden Sie Anmeldeinformationen mit `operator.read`.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → das Gateway hat geantwortet, aber dieser Client benötigt weiterhin Pairing/Freigabe vor normalem Operator-Zugriff.
- nicht aufgelöster `gateway.auth.*`- / `gateway.remote.*`-SecretRef-Warntext → Auth-Material war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [/cli/gateway](/de/cli/gateway)
- [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host)
- [/gateway/remote](/de/gateway/remote)

## Channel verbunden, aber Nachrichten fließen nicht

Wenn der Channel-Status verbunden ist, aber kein Nachrichtenfluss stattfindet, konzentrieren Sie sich auf Richtlinien, Berechtigungen und channelspezifische Zustellregeln.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Achten Sie auf Folgendes:

- DM-Richtlinie (`pairing`, `allowlist`, `open`, `disabled`).
- Gruppen-Allowlist und Anforderungen an Erwähnungen.
- Fehlende Channel-API-Berechtigungen/-Scopes.

Häufige Signaturen:

- `mention required` → Nachricht wird durch die Gruppen-Erwähnungsrichtlinie ignoriert.
- `pairing` / ausstehende Freigabespuren → der Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Channel-Authentifizierung/Berechtigungen.

Verwandt:

- [/channels/troubleshooting](/de/channels/troubleshooting)
- [/channels/whatsapp](/de/channels/whatsapp)
- [/channels/telegram](/de/channels/telegram)
- [/channels/discord](/de/channels/discord)

## Cron- und Heartbeat-Zustellung

Wenn Cron oder Heartbeat nicht ausgeführt wurde oder nicht zugestellt wurde, prüfen Sie zuerst den Scheduler-Status und dann das Zustellziel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Achten Sie auf Folgendes:

- Cron ist aktiviert und der nächste Weckzeitpunkt ist vorhanden.
- Status der Job-Laufhistorie (`ok`, `skipped`, `error`).
- Gründe für übersprungene Heartbeats (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Häufige Signaturen:

- `cron: scheduler disabled; jobs will not run automatically` → Cron ist deaktiviert.
- `cron: timer tick failed` → Scheduler-Tick ist fehlgeschlagen; prüfen Sie Datei-/Log-/Runtime-Fehler.
- `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des Zeitfensters für aktive Stunden.
- `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` ist vorhanden, enthält aber nur Leerzeilen / Markdown-Header, daher überspringt OpenClaw den Modellaufruf.
- `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber bei diesem Tick ist keine Aufgabe fällig.
- `heartbeat: unknown accountId` → ungültige Account-ID für das Heartbeat-Zustellziel.
- `heartbeat skipped` mit `reason=dm-blocked` → das Heartbeat-Ziel wurde zu einem Ziel im DM-Stil aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder eine agentbezogene Überschreibung) auf `block` gesetzt ist.

Verwandt:

- [/automation/cron-jobs#troubleshooting](/de/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/de/automation/cron-jobs)
- [/gateway/heartbeat](/de/gateway/heartbeat)

## Tool auf gepaartem Node schlägt fehl

Wenn ein Node gepaart ist, aber Tools fehlschlagen, isolieren Sie Vordergrundstatus, Berechtigungen und Freigabestatus.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf Folgendes:

- Node ist online und hat die erwarteten Capabilities.
- Vom Betriebssystem gewährte Berechtigungen für Kamera/Mikrofon/Standort/Bildschirm.
- Exec-Freigaben und Allowlist-Status.

Häufige Signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → die Node-App muss im Vordergrund sein.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → fehlende Betriebssystemberechtigung.
- `SYSTEM_RUN_DENIED: approval required` → Exec-Freigabe steht aus.
- `SYSTEM_RUN_DENIED: allowlist miss` → Befehl wurde durch die Allowlist blockiert.

Verwandt:

- [/nodes/troubleshooting](/de/nodes/troubleshooting)
- [/nodes/index](/de/nodes/index)
- [/tools/exec-approvals](/de/tools/exec-approvals)

## Browser-Tool schlägt fehl

Verwenden Sie dies, wenn Aktionen des Browser-Tools fehlschlagen, obwohl das Gateway selbst fehlerfrei ist.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Achten Sie auf Folgendes:

- Ob `plugins.allow` gesetzt ist und `browser` enthält.
- Gültiger Pfad zur Browser-Executable.
- Erreichbarkeit des CDP-Profils.
- Lokale Chrome-Verfügbarkeit für `existing-session`- / `user`-Profile.

Häufige Signaturen:

- `unknown command "browser"` oder `unknown command 'browser'` → der gebündelte Browser-Plugin ist durch `plugins.allow` ausgeschlossen.
- Browser-Tool fehlt / ist nicht verfügbar, obwohl `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
- `Failed to start Chrome CDP on port` → der Browser-Prozess konnte nicht gestartet werden.
- `browser.executablePath not found` → der konfigurierte Pfad ist ungültig.
- `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
- `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen fehlerhaften oder ungültigen Port.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session konnte noch keine Verbindung mit dem ausgewählten Browser-Datenverzeichnis herstellen. Öffnen Sie die Browser-Inspektionsseite, aktivieren Sie Remote-Debugging, lassen Sie den Browser geöffnet, bestätigen Sie die erste Verbindungsanfrage und versuchen Sie es dann erneut. Wenn kein angemeldeter Zustand erforderlich ist, bevorzugen Sie das verwaltete Profil `openclaw`.
- `No Chrome tabs found for profile="user"` → das Chrome-MCP-Attach-Profil hat keine offenen lokalen Chrome-Tabs.
- `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
- `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → das Attach-only-Profil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber der CDP-WebSocket konnte trotzdem nicht geöffnet werden.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → der aktuellen Gateway-Installation fehlt die gebündelte `playwright-core`-Runtime-Abhängigkeit des Browser-Plugins; führen Sie `openclaw doctor --fix` aus und starten Sie dann das Gateway neu. ARIA-Snapshots und einfache Seitenscreenshots können weiterhin funktionieren, aber Navigation, AI-Snapshots, Elementscreenshots per CSS-Selektor und PDF-Export bleiben nicht verfügbar.
- `fullPage is not supported for element screenshots` → die Screenshot-Anfrage hat `--full-page` mit `--ref` oder `--element` kombiniert.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Screenshot-Aufrufe für Chrome MCP / `existing-session` müssen Seitenerfassung oder ein Snapshot-`--ref` verwenden, nicht CSS-`--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Upload-Hooks für Chrome MCP benötigen Snapshot-Refs, keine CSS-Selektoren.
- `existing-session file uploads currently support one file at a time.` → senden Sie bei Chrome-MCP-Profilen einen Upload pro Aufruf.
- `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks auf Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
- `existing-session type does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:type` auf `profile="user"` / Chrome-MCP-existing-session-Profilen weg oder verwenden Sie ein verwaltetes/CDP-Browserprofil, wenn ein benutzerdefiniertes Timeout erforderlich ist.
- `existing-session evaluate does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:evaluate` auf `profile="user"` / Chrome-MCP-existing-session-Profilen weg oder verwenden Sie ein verwaltetes/CDP-Browserprofil, wenn ein benutzerdefiniertes Timeout erforderlich ist.
- `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.
- veraltete Überschreibungen für Viewport / Dark Mode / Locale / Offline auf Attach-only- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuerungssitzung zu schließen und den Emulationszustand von Playwright/CDP freizugeben, ohne das gesamte Gateway neu zu starten.

Verwandt:

- [/tools/browser-linux-troubleshooting](/de/tools/browser-linux-troubleshooting)
- [/tools/browser](/de/tools/browser)

## Wenn nach einem Upgrade plötzlich etwas kaputt ist

Die meisten Probleme nach einem Upgrade sind Config-Drift oder jetzt erzwungene strengere Standardwerte.

### 1) Das Verhalten von Authentifizierung und URL-Überschreibungen hat sich geändert

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Was Sie prüfen sollten:

- Wenn `gateway.mode=remote`, können CLI-Aufrufe auf Remote zielen, während Ihr lokaler Service in Ordnung ist.
- Explizite `--url`-Aufrufe fallen nicht auf gespeicherte Anmeldeinformationen zurück.

Häufige Signaturen:

- `gateway connect failed:` → falsches URL-Ziel.
- `unauthorized` → Endpunkt erreichbar, aber falsche Authentifizierung.

### 2) Guardrails für Bind und Authentifizierung sind strenger

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Was Sie prüfen sollten:

- Nicht-Loopback-Binds (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Authentifizierungspfad: gemeinsame Token-/Passwort-Authentifizierung oder eine korrekt konfigurierte Nicht-Loopback-`trusted-proxy`-Bereitstellung.
- Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

Häufige Signaturen:

- `refusing to bind gateway ... without auth` → Nicht-Loopback-Bind ohne gültigen Gateway-Authentifizierungspfad.
- `Connectivity probe: failed` während die Runtime läuft → Gateway aktiv, aber mit der aktuellen Authentifizierung/URL nicht erreichbar.

### 3) Status von Pairing und Geräteidentität hat sich geändert

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Was Sie prüfen sollten:

- Ausstehende Gerätefreigaben für Dashboard/Nodes.
- Ausstehende DM-Pairing-Freigaben nach Änderungen an Richtlinien oder Identität.

Häufige Signaturen:

- `device identity required` → Geräteauthentifizierung nicht erfüllt.
- `pairing required` → Absender/Gerät muss freigegeben werden.

Wenn Service-Config und Runtime nach den Prüfungen weiterhin nicht übereinstimmen, installieren Sie die Service-Metadaten aus demselben Profil-/State-Verzeichnis neu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [/gateway/pairing](/de/gateway/pairing)
- [/gateway/authentication](/de/gateway/authentication)
- [/gateway/background-process](/de/gateway/background-process)

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Doctor](/de/gateway/doctor)
- [FAQ](/de/help/faq)
