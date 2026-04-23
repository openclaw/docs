---
read_when:
    - Der Fehlerbehebungs-Hub hat Sie für eine tiefergehende Diagnose hierher weitergeleitet.
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen.
summary: Detailliertes Runbook zur Fehlerbehebung für Gateway, Channels, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-04-23T06:29:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 426d90f3f9b693d49694d0bbd6dab2434c726ddd34cd47a753c91096e50ca6d8
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Fehlerbehebung für Gateway

Diese Seite ist das detaillierte Runbook.
Beginnen Sie bei [/help/troubleshooting](/de/help/troubleshooting), wenn Sie zuerst den schnellen Triage-Ablauf möchten.

## Befehlsleiter

Führen Sie diese zuerst und in dieser Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Erwartete Signale für einen fehlerfreien Zustand:

- `openclaw gateway status` zeigt `Runtime: running`, `Connectivity probe: ok` und eine Zeile `Capability: ...`.
- `openclaw doctor` meldet keine blockierenden Konfigurations-/Dienstprobleme.
- `openclaw channels status --probe` zeigt den Live-Transportstatus pro Account und,
  wo unterstützt, Prüf-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Anthropic 429 zusätzlicher Verbrauch für langen Kontext erforderlich

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf Folgendes:

- Das ausgewählte Anthropic-Opus-/Sonnet-Modell hat `params.context1m: true`.
- Die aktuelle Anthropic-Anmeldeinformation ist nicht für die Nutzung mit langem Kontext berechtigt.
- Anfragen schlagen nur bei langen Sitzungen/Modelläufen fehl, die den 1M-Beta-Pfad benötigen.

Optionen zur Behebung:

1. Deaktivieren Sie `context1m` für dieses Modell, um auf das normale Kontextfenster zurückzufallen.
2. Verwenden Sie eine Anthropic-Anmeldeinformation, die für Anfragen mit langem Kontext berechtigt ist, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
3. Konfigurieren Sie Fallback-Modelle, damit Läufe fortgesetzt werden, wenn Anthropic-Anfragen mit langem Kontext abgelehnt werden.

Verwandt:

- [/providers/anthropic](/de/providers/anthropic)
- [/reference/token-use](/de/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/de/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokales OpenAI-kompatibles Backend besteht direkte Prüfungen, aber Agent-Läufe schlagen fehl

Verwenden Sie dies, wenn:

- `curl ... /v1/models` funktioniert
- kleine direkte `/v1/chat/completions`-Aufrufe funktionieren
- OpenClaw-Modelläufe nur bei normalen Agent-Zügen fehlschlagen

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
- Backend-Fehler dazu, dass `messages[].content` eine Zeichenfolge erwartet
- Backend-Abstürze, die nur bei höherer Prompt-Token-Anzahl oder vollständigen Agent-
  Runtime-Prompts auftreten

Häufige Signaturen:

- `messages[...].content: invalid type: sequence, expected a string` → das Backend
  lehnt strukturierte Chat-Completions-Inhaltsteile ab. Behebung: Setzen Sie
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- direkte kleine Anfragen sind erfolgreich, aber OpenClaw-Agent-Läufe schlagen mit Backend-/Modell-
  Abstürzen fehl (zum Beispiel Gemma auf einigen `inferrs`-Builds) → der OpenClaw-Transport ist
  wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Form des Agent-Runtime-Prompts.
- Fehler werden nach dem Deaktivieren von Tools geringer, verschwinden aber nicht → Tool-Schemata waren
  Teil des Drucks, aber das verbleibende Problem ist weiterhin die Kapazität des Upstream-Modells/-Servers
  oder ein Backend-Fehler.

Optionen zur Behebung:

1. Setzen Sie `compat.requiresStringContent: true` für Chat-Completions-Backends, die nur Zeichenfolgen unterstützen.
2. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die
   die Tool-Schema-Oberfläche von OpenClaw nicht zuverlässig verarbeiten können.
3. Reduzieren Sie nach Möglichkeit den Prompt-Druck: kleineres Workspace-Bootstrap, kürzere
   Sitzungshistorie, leichteres lokales Modell oder ein Backend mit stärkerer Unterstützung für langen Kontext.
4. Wenn direkte kleine Anfragen weiterhin funktionieren, OpenClaw-Agent-Züge aber immer noch innerhalb des Backends abstürzen,
   behandeln Sie es als Einschränkung des Upstream-Servers/Modells und reichen Sie dort
   eine Reproduktion mit der akzeptierten Payload-Form ein.

Verwandt:

- [/gateway/local-models](/de/gateway/local-models)
- [/gateway/configuration](/de/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/de/gateway/configuration-reference#openai-compatible-endpoints)

## Keine Antworten

Wenn Channels aktiv sind, aber nichts antwortet, prüfen Sie Routing und Richtlinien, bevor Sie irgendetwas erneut verbinden.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Achten Sie auf Folgendes:

- Pairing für DM-Absender ausstehend.
- Erwähnungs-Gating für Gruppen (`requireMention`, `mentionPatterns`).
- Nicht übereinstimmende Channel-/Gruppen-Allowlists.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird ignoriert, bis eine Erwähnung erfolgt.
- `pairing request` → der Absender benötigt eine Genehmigung.
- `blocked` / `allowlist` → Absender/Channel wurde durch Richtlinien gefiltert.

Verwandt:

- [/channels/troubleshooting](/de/channels/troubleshooting)
- [/channels/pairing](/de/channels/pairing)
- [/channels/groups](/de/channels/groups)

## Dashboard-/Control-UI-Konnektivität

Wenn Dashboard/Control UI keine Verbindung herstellt, validieren Sie URL, Auth-Modus und Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf Folgendes:

- korrekte Probe-URL und Dashboard-URL.
- Auth-Modus-/Token-Abweichung zwischen Client und Gateway.
- HTTP-Nutzung, wo Geräteidentität erforderlich ist.

Häufige Signaturen:

- `device identity required` → kein sicherer Kontext oder fehlende Geräteauthentifizierung.
- `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins`
  (oder Sie verbinden sich von einem Browser-Origin außerhalb von loopback ohne explizite
  Allowlist).
- `device nonce required` / `device nonce mismatch` → der Client führt den
  challenge-basierten Geräteauthentifizierungsablauf nicht vollständig aus (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → der Client hat die falsche
  Payload (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
- `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → der Client kann einen vertrauenswürdigen Wiederholungsversuch mit zwischengespeichertem Gerätetoken ausführen.
- Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet erneut die mit dem gekoppelten
  Gerätetoken gespeicherte Scope-Menge. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihre
  angeforderte Scope-Menge bei.
- Außerhalb dieses Wiederholungspfads gilt für die Auth-Priorität beim Verbinden: zuerst explizites gemeinsames
  Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken,
  dann Bootstrap-Token.
- Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe
  `{scope, ip}` serialisiert, bevor der Limiter den Fehler aufzeichnet. Zwei gleichzeitige fehlerhafte
  Wiederholungen vom selben Client können deshalb beim zweiten Versuch `retry later`
  anzeigen statt zwei einfacher Nichtübereinstimmungen.
- `too many failed authentication attempts (retry later)` von einem Browser-Origin-
  loopback-Client → wiederholte Fehlversuche von demselben normalisierten `Origin` werden
  vorübergehend gesperrt; ein anderer localhost-Origin verwendet einen separaten Bucket.
- wiederholtes `unauthorized` nach diesem Wiederholungsversuch → Abweichung zwischen gemeinsamem Token und Gerätetoken; aktualisieren Sie die Token-Konfiguration und genehmigen/rotieren Sie das Gerätetoken bei Bedarf erneut.
- `gateway connect failed:` → falsches Host-/Port-/URL-Ziel.

### Kurzübersicht zu Auth-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Maßnahme auszuwählen:

| Detailcode                  | Bedeutung                                                                                                                                                                                      | Empfohlene Maßnahme                                                                                                                                                                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Der Client hat kein erforderliches gemeinsames Token gesendet.                                                                                                                                 | Fügen Sie das Token im Client ein/setzen Sie es und versuchen Sie es erneut. Für Dashboard-Pfade: `openclaw config get gateway.auth.token` und dann in die Einstellungen der Control UI einfügen.                                                                                     |
| `AUTH_TOKEN_MISMATCH`       | Das gemeinsame Token stimmte nicht mit dem Gateway-Auth-Token überein.                                                                                                                         | Wenn `canRetryWithDeviceToken=true`, lassen Sie einen vertrauenswürdigen Wiederholungsversuch zu. Wiederholungen mit gecachtem Token verwenden erneut gespeicherte genehmigte Scopes; Aufrufer mit explizitem `deviceToken` / `scopes` behalten angeforderte Scopes bei. Falls es weiterhin fehlschlägt, führen Sie die [Checkliste zur Wiederherstellung bei Token-Abweichung](/de/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Das zwischengespeicherte gerätespezifische Token ist veraltet oder widerrufen.                                                                                                                | Rotieren/genehmigen Sie das Gerätetoken erneut mithilfe der [devices CLI](/de/cli/devices) und verbinden Sie sich dann erneut.                                                                                                                                                             |
| `PAIRING_REQUIRED`          | Die Geräteidentität benötigt eine Genehmigung. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade` und verwenden Sie `requestId` / `remediationHint`, falls vorhanden. | Genehmigen Sie die ausstehende Anfrage: `openclaw devices list` und dann `openclaw devices approve <requestId>`. Scope-/Rollen-Upgrades verwenden denselben Ablauf, nachdem Sie den angeforderten Zugriff geprüft haben.                                                               |

Prüfung der Migration zu Device Auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler zeigen, aktualisieren Sie den verbindenden Client und prüfen Sie, dass er:

1. auf `connect.challenge` wartet
2. die challenge-gebundene Payload signiert
3. `connect.params.device.nonce` mit derselben Challenge-Nonce sendet

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet abgelehnt wird:

- Sitzungen mit gekoppeltetem Gerätetoken können nur **ihr eigenes** Gerät verwalten, es sei denn,
  der Aufrufer hat zusätzlich `operator.admin`
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern,
  die die Sitzung des Aufrufers bereits besitzt

Verwandt:

- [/web/control-ui](/de/web/control-ui)
- [/gateway/configuration](/de/gateway/configuration) (Gateway-Auth-Modi)
- [/gateway/trusted-proxy-auth](/de/gateway/trusted-proxy-auth)
- [/gateway/remote](/de/gateway/remote)
- [/cli/devices](/de/cli/devices)

## Gateway-Dienst läuft nicht

Verwenden Sie dies, wenn der Dienst installiert ist, der Prozess aber nicht dauerhaft läuft.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Achten Sie auf Folgendes:

- `Runtime: stopped` mit Hinweisen zum Beenden.
- Abweichung der Dienstkonfiguration (`Config (cli)` vs `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche Installationen über launchd/systemd/schtasks bei Verwendung von `--deep`.
- Hinweise zur Bereinigung von `Other gateway-like services detected (best effort)`.

Häufige Signaturen:

- `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → der lokale Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde überschrieben und hat `gateway.mode` verloren. Behebung: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete Konfiguration für den lokalen Modus wiederherzustellen. Wenn Sie OpenClaw über Podman ausführen, ist der Standardpfad der Konfiguration `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → Bindung an eine Nicht-Loopback-Adresse ohne gültigen Gateway-Auth-Pfad (Token/Passwort oder vertrauenswürdiger Proxy, falls konfiguriert).
- `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
- `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Units existieren. Die meisten Setups sollten ein Gateway pro Rechner haben; wenn Sie tatsächlich mehr als eines benötigen, isolieren Sie Ports + Konfiguration/Status/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).

Verwandt:

- [/gateway/background-process](/de/gateway/background-process)
- [/gateway/configuration](/de/gateway/configuration)
- [/gateway/doctor](/de/gateway/doctor)

## Gateway hat die zuletzt funktionierende Konfiguration wiederhergestellt

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
- eine mit Zeitstempel versehene Datei `openclaw.json.clobbered.*` neben der aktiven Konfiguration
- ein Systemereignis des Haupt-Agenten, das mit `Config recovery warning` beginnt

Was passiert ist:

- Die abgelehnte Konfiguration hat die Validierung beim Start oder Hot-Reload nicht bestanden.
- OpenClaw hat die abgelehnte Payload als `.clobbered.*` gespeichert.
- Die aktive Konfiguration wurde aus der zuletzt validierten, zuletzt funktionierenden Kopie wiederhergestellt.
- Der nächste Zug des Haupt-Agenten wird gewarnt, die abgelehnte Konfiguration nicht blind neu zu schreiben.

Prüfen und reparieren:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Häufige Signaturen:

- `.clobbered.*` existiert → eine externe direkte Bearbeitung oder ein Start-Lesevorgang wurde wiederhergestellt.
- `.rejected.*` existiert → ein von OpenClaw selbst ausgeführter Konfigurationsschreibvorgang ist vor dem Commit an Schema- oder Überschreibprüfungen gescheitert.
- `Config write rejected:` → beim Schreibvorgang sollte erforderliche Struktur entfernt, die Datei stark verkleinert oder eine ungültige Konfiguration gespeichert werden.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oder `size-drop-vs-last-good:*` → beim Start wurde die aktuelle Datei als überschrieben behandelt, weil sie im Vergleich zum zuletzt funktionierenden Backup Felder oder Größe verloren hatte.
- `Config last-known-good promotion skipped` → der Kandidat enthielt geschwärzte Platzhalter für Geheimnisse wie `***`.

Optionen zur Behebung:

1. Behalten Sie die wiederhergestellte aktive Konfiguration bei, wenn sie korrekt ist.
2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*` und wenden Sie sie dann mit `openclaw config set` oder `config.patch` an.
3. Führen Sie `openclaw config validate` vor dem Neustart aus.
4. Wenn Sie von Hand bearbeiten, behalten Sie die vollständige JSON5-Konfiguration bei, nicht nur das Teilobjekt, das Sie ändern wollten.

Verwandt:

- [/gateway/configuration#strict-validation](/de/gateway/configuration#strict-validation)
- [/gateway/configuration#config-hot-reload](/de/gateway/configuration#config-hot-reload)
- [/cli/config](/de/cli/config)
- [/gateway/doctor](/de/gateway/doctor)

## Gateway-Prüfwarnungen

Verwenden Sie dies, wenn `openclaw gateway probe` etwas erreicht, aber trotzdem einen Warnblock ausgibt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Achten Sie auf Folgendes:

- `warnings[].code` und `primaryTargetId` in der JSON-Ausgabe.
- Ob sich die Warnung auf SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Auth-Refs bezieht.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → das SSH-Setup ist fehlgeschlagen, aber der Befehl hat trotzdem direkte konfigurierte/loopback-Ziele versucht.
- `multiple reachable gateways detected` → mehr als ein Ziel hat geantwortet. Das bedeutet normalerweise ein absichtliches Multi-Gateway-Setup oder veraltete/doppelte Listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → die Verbindung hat funktioniert, aber das Detail-RPC ist durch Scopes eingeschränkt; koppeln Sie die Geräteidentität oder verwenden Sie Anmeldedaten mit `operator.read`.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → das Gateway hat geantwortet, aber dieser Client benötigt weiterhin Pairing/Genehmigung vor normalem Operator-Zugriff.
- nicht aufgelöster `gateway.auth.*`- / `gateway.remote.*`-SecretRef-Warntext → das Auth-Material war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [/cli/gateway](/de/cli/gateway)
- [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host)
- [/gateway/remote](/de/gateway/remote)

## Channel verbunden, aber keine Nachrichtenübertragung

Wenn der Channel-Status verbunden ist, aber keine Nachrichten fließen, konzentrieren Sie sich auf Richtlinien, Berechtigungen und channelspezifische Zustellregeln.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Achten Sie auf Folgendes:

- DM-Richtlinie (`pairing`, `allowlist`, `open`, `disabled`).
- Gruppen-Allowlist und Erwähnungsanforderungen.
- Fehlende Channel-API-Berechtigungen/-Scopes.

Häufige Signaturen:

- `mention required` → Nachricht wurde durch die Gruppen-Erwähnungsrichtlinie ignoriert.
- `pairing` / Spuren ausstehender Genehmigungen → der Absender ist nicht genehmigt.
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

- Cron ist aktiviert und der nächste Aufwachzeitpunkt ist vorhanden.
- Status des Job-Ausführungsverlaufs (`ok`, `skipped`, `error`).
- Gründe für übersprungene Heartbeats (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Häufige Signaturen:

- `cron: scheduler disabled; jobs will not run automatically` → Cron ist deaktiviert.
- `cron: timer tick failed` → Scheduler-Tick fehlgeschlagen; prüfen Sie Datei-/Log-/Laufzeitfehler.
- `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des aktiven Zeitfensters.
- `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur Leerzeilen / Markdown-Überschriften, daher überspringt OpenClaw den Modellaufruf.
- `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber bei diesem Tick ist keine der Aufgaben fällig.
- `heartbeat: unknown accountId` → ungültige Account-ID für das Heartbeat-Zustellziel.
- `heartbeat skipped` mit `reason=dm-blocked` → das Heartbeat-Ziel wurde zu einem Ziel im DM-Stil aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder eine Überschreibung pro Agent) auf `block` gesetzt ist.

Verwandt:

- [/automation/cron-jobs#troubleshooting](/de/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/de/automation/cron-jobs)
- [/gateway/heartbeat](/de/gateway/heartbeat)

## Tool eines gekoppelten Node schlägt fehl

Wenn ein Node gekoppelt ist, Tools aber fehlschlagen, isolieren Sie Vordergrund-, Berechtigungs- und Genehmigungsstatus.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf Folgendes:

- Node ist online und hat die erwarteten Fähigkeiten.
- OS-Berechtigungen für Kamera/Mikrofon/Standort/Bildschirm.
- Genehmigungen für Ausführung und Allowlist-Status.

Häufige Signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → die Node-App muss im Vordergrund sein.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → fehlende OS-Berechtigung.
- `SYSTEM_RUN_DENIED: approval required` → Genehmigung für Ausführung ausstehend.
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

- `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin ist durch `plugins.allow` ausgeschlossen.
- Browser-Tool fehlt / ist nicht verfügbar, obwohl `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
- `Failed to start Chrome CDP on port` → der Browser-Prozess konnte nicht gestartet werden.
- `browser.executablePath not found` → der konfigurierte Pfad ist ungültig.
- `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
- `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen ungültigen oder außerhalb des Bereichs liegenden Port.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP `existing-session` konnte sich noch nicht an das ausgewählte Browser-Datenverzeichnis anhängen. Öffnen Sie die Browser-Inspect-Seite, aktivieren Sie Remote-Debugging, lassen Sie den Browser geöffnet, genehmigen Sie die erste Verbindungsaufforderung und versuchen Sie es dann erneut. Wenn der angemeldete Status nicht erforderlich ist, bevorzugen Sie das verwaltete Profil `openclaw`.
- `No Chrome tabs found for profile="user"` → das Chrome-MCP-Attach-Profil hat keine geöffneten lokalen Chrome-Tabs.
- `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
- `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → das Attach-only-Profil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber das CDP-WebSocket konnte trotzdem nicht geöffnet werden.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → der aktuellen Gateway-Installation fehlt die gebündelte `playwright-core`-Runtime-Abhängigkeit des Browser-Plugins; führen Sie `openclaw doctor --fix` aus und starten Sie dann das Gateway neu. ARIA-Snapshots und grundlegende Seiten-Screenshots können weiterhin funktionieren, aber Navigation, AI-Snapshots, CSS-Selector-Element-Screenshots und PDF-Export bleiben nicht verfügbar.
- `fullPage is not supported for element screenshots` → die Screenshot-Anfrage hat `--full-page` mit `--ref` oder `--element` kombiniert.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Screenshot-Aufrufe für Chrome MCP / `existing-session` müssen Seitenaufnahme oder ein Snapshot-`--ref` verwenden, nicht CSS-`--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Upload-Hooks für Chrome MCP benötigen Snapshot-Refs, keine CSS-Selektoren.
- `existing-session file uploads currently support one file at a time.` → senden Sie bei Chrome-MCP-Profilen pro Aufruf nur einen Upload.
- `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks bei Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
- `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.
- veraltete Überschreibungen für Viewport / Dark-Mode / Gebietsschema / Offline auf Attach-only- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuerungssitzung zu schließen und den Playwright-/CDP-Emulationsstatus freizugeben, ohne das gesamte Gateway neu zu starten.

Verwandt:

- [/tools/browser-linux-troubleshooting](/de/tools/browser-linux-troubleshooting)
- [/tools/browser](/de/tools/browser)

## Wenn Sie ein Upgrade durchgeführt haben und plötzlich etwas nicht mehr funktioniert

Die meisten Probleme nach einem Upgrade sind Konfigurationsdrift oder strengere Standards, die jetzt erzwungen werden.

### 1) Auth- und URL-Überschreibungsverhalten hat sich geändert

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Was Sie prüfen sollten:

- Wenn `gateway.mode=remote`, können CLI-Aufrufe auf Remote zielen, während Ihr lokaler Dienst in Ordnung ist.
- Explizite `--url`-Aufrufe greifen nicht auf gespeicherte Anmeldedaten zurück.

Häufige Signaturen:

- `gateway connect failed:` → falsches URL-Ziel.
- `unauthorized` → Endpunkt erreichbar, aber falsche Authentifizierung.

### 2) Bindungs- und Auth-Schutzmechanismen sind strenger

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Was Sie prüfen sollten:

- Nicht-Loopback-Bindungen (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Auth-Pfad: gemeinsame Token-/Passwort-Authentifizierung oder eine korrekt konfigurierte `trusted-proxy`-Bereitstellung ohne Loopback.
- Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

Häufige Signaturen:

- `refusing to bind gateway ... without auth` → Nicht-Loopback-Bindung ohne gültigen Gateway-Auth-Pfad.
- `Connectivity probe: failed` bei laufender Runtime → Gateway lebt, ist aber mit aktueller Authentifizierung/URL nicht erreichbar.

### 3) Pairing- und Geräteidentitätsstatus haben sich geändert

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Was Sie prüfen sollten:

- Ausstehende Gerätegenehmigungen für Dashboard/Nodes.
- Ausstehende DM-Pairing-Genehmigungen nach Richtlinien- oder Identitätsänderungen.

Häufige Signaturen:

- `device identity required` → Geräteauthentifizierung nicht erfüllt.
- `pairing required` → Absender/Gerät muss genehmigt werden.

Wenn Dienstkonfiguration und Runtime nach den Prüfungen weiterhin nicht übereinstimmen, installieren Sie die Dienstmetadaten aus demselben Profil-/Statusverzeichnis erneut:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [/gateway/pairing](/de/gateway/pairing)
- [/gateway/authentication](/de/gateway/authentication)
- [/gateway/background-process](/de/gateway/background-process)
