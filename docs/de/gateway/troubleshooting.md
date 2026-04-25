---
read_when:
    - Der Hub für Fehlerbehebung hat Sie zur tiefergehenden Diagnose hierher weitergeleitet
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen
summary: Ausführliches Fehlerbehebungs-Runbook für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-04-25T13:48:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Fehlerbehebung beim Gateway

Diese Seite ist das ausführliche Runbook.
Beginnen Sie bei [/help/troubleshooting](/de/help/troubleshooting), wenn Sie zuerst den schnellen Triage-Ablauf möchten.

## Befehlsleiter

Führen Sie diese zuerst und in genau dieser Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Erwartete gesunde Signale:

- `openclaw gateway status` zeigt `Runtime: running`, `Connectivity probe: ok` und eine Zeile `Capability: ...`.
- `openclaw doctor` meldet keine blockierenden Konfigurations-/Serviceprobleme.
- `openclaw channels status --probe` zeigt Live-Transportstatus pro Konto und,
  wo unterstützt, Probe-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Anthropic 429 zusätzliche Nutzung für langen Kontext erforderlich

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf:

- Das ausgewählte Anthropic-Modell Opus/Sonnet hat `params.context1m: true`.
- Die aktuellen Anthropic-Anmeldedaten sind nicht für die Nutzung mit langem Kontext geeignet.
- Anfragen schlagen nur bei langen Sitzungen/Modelläufen fehl, die den 1M-Beta-Pfad benötigen.

Mögliche Behebungen:

1. Deaktivieren Sie `context1m` für dieses Modell, um auf das normale Kontextfenster zurückzufallen.
2. Verwenden Sie Anthropic-Anmeldedaten, die für Anfragen mit langem Kontext geeignet sind, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
3. Konfigurieren Sie Fallback-Modelle, damit Läufe fortgesetzt werden, wenn Anthropic-Anfragen mit langem Kontext abgelehnt werden.

Verwandt:

- [Anthropic](/de/providers/anthropic)
- [Token use and costs](/de/reference/token-use)
- [Why am I seeing HTTP 429 from Anthropic?](/de/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokales OpenAI-kompatibles Backend besteht direkte Probes, aber Agentenläufe schlagen fehl

Verwenden Sie dies, wenn:

- `curl ... /v1/models` funktioniert
- winzige direkte Aufrufe an `/v1/chat/completions` funktionieren
- OpenClaw-Modelläufe nur bei normalen Agenten-Turns fehlschlagen

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Achten Sie auf:

- direkte winzige Aufrufe funktionieren, aber OpenClaw-Läufe schlagen nur bei größeren Prompts fehl
- Backend-Fehler darüber, dass `messages[].content` einen String erwartet
- Backend-Abstürze, die nur bei höheren Prompt-Token-Zahlen oder vollständigen
  Prompts der Agentenlaufzeit auftreten

Häufige Signaturen:

- `messages[...].content: invalid type: sequence, expected a string` → das Backend
  lehnt strukturierte Inhalte in Chat-Completions ab. Behebung: Setzen Sie
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- direkte winzige Anfragen funktionieren, aber OpenClaw-Agentenläufe schlagen mit
  Backend-/Modellabstürzen fehl (zum Beispiel Gemma auf manchen `inferrs`-Builds) → der OpenClaw-Transport ist
  wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Prompt-Form
  der Agentenlaufzeit.
- Fehler werden kleiner, nachdem Tools deaktiviert wurden, verschwinden aber nicht → Tool-Schemas waren
  Teil des Drucks, aber das verbleibende Problem liegt weiterhin bei der
  Kapazität des Upstream-Modells/-Servers oder bei einem Backend-Fehler.

Mögliche Behebungen:

1. Setzen Sie `compat.requiresStringContent: true` für Chat-Completions-Backends, die nur Strings unterstützen.
2. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die die
   Tool-Schema-Oberfläche von OpenClaw nicht zuverlässig verarbeiten können.
3. Reduzieren Sie nach Möglichkeit den Prompt-Druck: kleineres Workspace-Bootstrap, kürzerer
   Sitzungsverlauf, leichteres lokales Modell oder ein Backend mit stärkerer Unterstützung für langen Kontext.
4. Wenn direkte winzige Anfragen weiterhin funktionieren, während OpenClaw-Agenten-Turns im Backend
   weiterhin abstürzen, behandeln Sie dies als Einschränkung des Upstream-Servers/-Modells und melden Sie dort
   eine Reproduktion mit der akzeptierten Payload-Form.

Verwandt:

- [Local models](/de/gateway/local-models)
- [Configuration](/de/gateway/configuration)
- [OpenAI-compatible endpoints](/de/gateway/configuration-reference#openai-compatible-endpoints)

## Keine Antworten

Wenn Kanäle aktiv sind, aber nichts antwortet, prüfen Sie Routing und Richtlinie, bevor Sie irgendetwas erneut verbinden.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Achten Sie auf:

- Pairing steht für DM-Absender aus.
- Erwähnungsbedingung in Gruppen (`requireMention`, `mentionPatterns`).
- Nichtübereinstimmungen bei Kanal-/Gruppen-Allowlists.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird ignoriert, bis eine Erwähnung erfolgt.
- `pairing request` → Absender benötigt Genehmigung.
- `blocked` / `allowlist` → Absender/Kanal wurde durch Richtlinie gefiltert.

Verwandt:

- [Channel troubleshooting](/de/channels/troubleshooting)
- [Pairing](/de/channels/pairing)
- [Groups](/de/channels/groups)

## Konnektivität von Dashboard-/Control-UI

Wenn Dashboard/Control UI keine Verbindung herstellt, validieren Sie URL, Auth-Modus und Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf:

- Korrekte Probe-URL und Dashboard-URL.
- Nichtübereinstimmung von Auth-Modus/Token zwischen Client und Gateway.
- HTTP-Nutzung, obwohl Geräteidentität erforderlich ist.

Häufige Signaturen:

- `device identity required` → unsicherer Kontext oder fehlende Geräteauthentifizierung.
- `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins`
  (oder Sie verbinden sich von einem Browser-Ursprung, der nicht loopback ist, ohne explizite
  Allowlist).
- `device nonce required` / `device nonce mismatch` → Client schließt den
  challenge-basierten Geräteauthentifizierungsablauf nicht ab (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → Client hat die falsche
  Payload signiert (oder einen veralteten Zeitstempel) für den aktuellen Handshake.
- `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Client kann einen vertrauenswürdigen Wiederholungsversuch mit zwischengespeichertem Gerätetoken durchführen.
- Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet den zwischengespeicherten Scope-Satz weiter,
  der mit dem gekoppelten Gerätetoken gespeichert wurde. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihren
  angeforderten Scope-Satz.
- Außerhalb dieses Wiederholungspfads ist die Auth-Priorität bei Verbindungen zuerst explizites gemeinsames
  Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken,
  dann Bootstrap-Token.
- Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe
  `{scope, ip}` serialisiert, bevor der Limiter den Fehler erfasst. Zwei schlechte
  gleichzeitige Wiederholungen desselben Clients können daher beim zweiten Versuch
  `retry later` erzeugen statt zwei einfacher Nichtübereinstimmungen.
- `too many failed authentication attempts (retry later)` von einem Browser-Client mit
  loopback-Ursprung → wiederholte Fehler von derselben normalisierten `Origin` werden
  vorübergehend gesperrt; ein anderer localhost-Ursprung verwendet einen separaten Bucket.
- wiederholtes `unauthorized` danach → Abweichung zwischen gemeinsamem Token und Gerätetoken; aktualisieren Sie die Token-Konfiguration und genehmigen/rotieren Sie das Gerätetoken bei Bedarf erneut.
- `gateway connect failed:` → falscher Host/Port/falsches URL-Ziel.

### Schnelle Zuordnung von Auth-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                  | Bedeutung                                                                                                                                                                                     | Empfohlene Aktion                                                                                                                                                                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Client hat kein erforderliches gemeinsames Token gesendet.                                                                                                                                    | Fügen Sie das Token im Client ein/setzen Sie es und versuchen Sie es erneut. Für Dashboard-Pfade: `openclaw config get gateway.auth.token` und dann in die Einstellungen der Control UI einfügen.                                                                                  |
| `AUTH_TOKEN_MISMATCH`       | Gemeinsames Token stimmte nicht mit dem Gateway-Auth-Token überein.                                                                                                                           | Wenn `canRetryWithDeviceToken=true`, erlauben Sie einen vertrauenswürdigen Wiederholungsversuch. Wiederholungen mit zwischengespeichertem Token verwenden gespeicherte genehmigte Scopes weiter; Aufrufer mit explizitem `deviceToken` / `scopes` behalten angeforderte Scopes. Wenn es weiter fehlschlägt, führen Sie die [token drift recovery checklist](/de/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Zwischengespeichertes Token pro Gerät ist veraltet oder widerrufen.                                                                                                                          | Rotieren/genehmigen Sie das Gerätetoken erneut mit der [devices CLI](/de/cli/devices) und verbinden Sie dann erneut.                                                                                                                                                                     |
| `PAIRING_REQUIRED`          | Geräteidentität benötigt Genehmigung. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade`, und verwenden Sie `requestId` / `remediationHint`, wenn vorhanden. | Genehmigen Sie die ausstehende Anfrage: `openclaw devices list` dann `openclaw devices approve <requestId>`. Scope-/Rollen-Upgrades verwenden denselben Ablauf, nachdem Sie den angeforderten Zugriff geprüft haben.                                                              |

Prüfung der Migration zu Device Auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler zeigen, aktualisieren Sie den verbindenden Client und prüfen Sie, dass er:

1. auf `connect.challenge` wartet
2. die an die Challenge gebundene Payload signiert
3. `connect.params.device.nonce` mit derselben Challenge-Nonce sendet

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet verweigert wird:

- Sitzungen mit gepaartem Gerätetoken können nur **ihr eigenes** Gerät verwalten, es sei denn, der
  Aufrufer hat zusätzlich `operator.admin`
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern, die
  die Aufrufersitzung bereits besitzt

Verwandt:

- [Control UI](/de/web/control-ui)
- [Configuration](/de/gateway/configuration) (Gateway-Auth-Modi)
- [Trusted proxy auth](/de/gateway/trusted-proxy-auth)
- [Remote access](/de/gateway/remote)
- [Devices](/de/cli/devices)

## Gateway-Service läuft nicht

Verwenden Sie dies, wenn der Service installiert ist, der Prozess aber nicht aktiv bleibt.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # scannt zusätzlich Dienste auf Systemebene
```

Achten Sie auf:

- `Runtime: stopped` mit Hinweisen zum Beenden.
- Nichtübereinstimmung der Servicekonfiguration (`Config (cli)` vs `Config (service)`).
- Konflikte bei Port/Listener.
- Zusätzliche Installationen von launchd/systemd/schtasks bei Verwendung von `--deep`.
- Hinweise zur Bereinigung bei `Other gateway-like services detected (best effort)`.

Häufige Signaturen:

- `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → der lokale Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde beschädigt und hat `gateway.mode` verloren. Behebung: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete Konfiguration für den lokalen Modus erneut zu schreiben. Wenn Sie OpenClaw über Podman ausführen, ist der Standardpfad für die Konfiguration `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → Bindung an eine Adresse, die nicht loopback ist, ohne gültigen Gateway-Authentifizierungspfad (Token/Passwort oder Trusted Proxy, sofern konfiguriert).
- `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
- `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Units existieren. Die meisten Setups sollten ein Gateway pro Rechner verwenden; wenn Sie tatsächlich mehr als eines benötigen, trennen Sie Ports + Konfiguration/Status/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).

Verwandt:

- [Background exec and process tool](/de/gateway/background-process)
- [Configuration](/de/gateway/configuration)
- [Doctor](/de/gateway/doctor)

## Gateway hat die zuletzt bekannte gute Konfiguration wiederhergestellt

Verwenden Sie dies, wenn das Gateway startet, die Logs aber melden, dass `openclaw.json` wiederhergestellt wurde.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Achten Sie auf:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Eine mit Zeitstempel versehene Datei `openclaw.json.clobbered.*` neben der aktiven Konfiguration
- Ein Systemereignis des Haupt-Agenten, das mit `Config recovery warning` beginnt

Was passiert ist:

- Die abgelehnte Konfiguration hat bei Start oder Hot Reload die Validierung nicht bestanden.
- OpenClaw hat die abgelehnte Payload als `.clobbered.*` beibehalten.
- Die aktive Konfiguration wurde aus der zuletzt validierten, zuletzt bekannten guten Kopie wiederhergestellt.
- Der nächste Turn des Haupt-Agenten wird davor gewarnt, die abgelehnte Konfiguration blind zu überschreiben.
- Wenn alle Validierungsprobleme unter `plugins.entries.<id>...` lagen, würde OpenClaw
  nicht die ganze Datei wiederherstellen. Plugin-lokale Fehler bleiben deutlich sichtbar, während nicht betroffene
  Benutzereinstellungen in der aktiven Konfiguration erhalten bleiben.

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
- `.rejected.*` existiert → ein von OpenClaw verwalteter Konfigurationsschreibvorgang ist vor dem Commit an Schema- oder Clobber-Prüfungen gescheitert.
- `Config write rejected:` → der Schreibvorgang versuchte, erforderliche Struktur zu entfernen, die Datei stark zu verkleinern oder eine ungültige Konfiguration zu speichern.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oder `size-drop-vs-last-good:*` → der Start behandelte die aktuelle Datei als beschädigt, weil sie im Vergleich zur zuletzt bekannten guten Sicherung Felder oder Größe verloren hatte.
- `Config last-known-good promotion skipped` → der Kandidat enthielt redigierte Secret-Platzhalter wie `***`.

Mögliche Behebungen:

1. Behalten Sie die wiederhergestellte aktive Konfiguration bei, wenn sie korrekt ist.
2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*` und wenden Sie sie dann mit `openclaw config set` oder `config.patch` an.
3. Führen Sie vor dem Neustart `openclaw config validate` aus.
4. Wenn Sie manuell bearbeiten, behalten Sie die vollständige JSON5-Konfiguration bei, nicht nur das partielle Objekt, das Sie ändern wollten.

Verwandt:

- [Configuration: strict validation](/de/gateway/configuration#strict-validation)
- [Configuration: hot reload](/de/gateway/configuration#config-hot-reload)
- [Config](/de/cli/config)
- [Doctor](/de/gateway/doctor)

## Warnungen bei Gateway-Probes

Verwenden Sie dies, wenn `openclaw gateway probe` etwas erreicht, aber dennoch einen Warnblock ausgibt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Achten Sie auf:

- `warnings[].code` und `primaryTargetId` in der JSON-Ausgabe.
- Ob sich die Warnung auf SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Auth-Refs bezieht.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-Setup ist fehlgeschlagen, aber der Befehl hat weiterhin direkte konfigurierte/loopback-Ziele versucht.
- `multiple reachable gateways detected` → mehr als ein Ziel hat geantwortet. Meist bedeutet das ein beabsichtigtes Multi-Gateway-Setup oder veraltete/doppelte Listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → Verbindung hat funktioniert, aber Detail-RPC ist durch Scopes eingeschränkt; koppeln Sie die Geräteidentität oder verwenden Sie Anmeldedaten mit `operator.read`.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → das Gateway hat geantwortet, aber dieser Client benötigt noch Pairing/Genehmigung vor normalem Operatorzugriff.
- nicht aufgelöster Warntext zu SecretRef in `gateway.auth.*` / `gateway.remote.*` → Auth-Material war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [Gateway](/de/cli/gateway)
- [Multiple gateways on the same host](/de/gateway#multiple-gateways-same-host)
- [Remote access](/de/gateway/remote)

## Kanal verbunden, aber Nachrichten fließen nicht

Wenn der Kanalstatus verbunden ist, aber kein Nachrichtenfluss stattfindet, konzentrieren Sie sich auf Richtlinien, Berechtigungen und kanalspezifische Zustellregeln.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Achten Sie auf:

- DM-Richtlinie (`pairing`, `allowlist`, `open`, `disabled`).
- Gruppen-Allowlist und Erwähnungsanforderungen.
- Fehlende API-Berechtigungen/Scopes des Kanals.

Häufige Signaturen:

- `mention required` → Nachricht wurde durch die Gruppen-Erwähnungsrichtlinie ignoriert.
- `pairing` / Spuren ausstehender Genehmigung → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Kanal-Authentifizierung/Berechtigungen.

Verwandt:

- [Channel troubleshooting](/de/channels/troubleshooting)
- [WhatsApp](/de/channels/whatsapp)
- [Telegram](/de/channels/telegram)
- [Discord](/de/channels/discord)

## Zustellung von Cron und Heartbeat

Wenn Cron oder Heartbeat nicht ausgeführt wurde oder nicht zugestellt hat, prüfen Sie zuerst den Scheduler-Status und dann das Zustellziel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Achten Sie auf:

- Cron ist aktiviert und der nächste Wakeup ist vorhanden.
- Status des Job-Laufverlaufs (`ok`, `skipped`, `error`).
- Heartbeat-Überspringgründe (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Häufige Signaturen:

- `cron: scheduler disabled; jobs will not run automatically` → Cron ist deaktiviert.
- `cron: timer tick failed` → Scheduler-Tick ist fehlgeschlagen; prüfen Sie Datei-/Log-/Laufzeitfehler.
- `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des aktiven Zeitfensters.
- `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur Leerzeilen / Markdown-Überschriften, daher überspringt OpenClaw den Modellaufruf.
- `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen Block `tasks:`, aber bei diesem Tick ist keine der Aufgaben fällig.
- `heartbeat: unknown accountId` → ungültige Konto-ID für das Heartbeat-Zustellziel.
- `heartbeat skipped` mit `reason=dm-blocked` → Heartbeat-Ziel wurde zu einem Ziel im DM-Stil aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder eine Überschreibung pro Agent) auf `block` gesetzt ist.

Verwandt:

- [Scheduled tasks: troubleshooting](/de/automation/cron-jobs#troubleshooting)
- [Scheduled tasks](/de/automation/cron-jobs)
- [Heartbeat](/de/gateway/heartbeat)

## Gekoppeltes Node-Tool schlägt fehl

Wenn ein Node gekoppelt ist, aber Tools fehlschlagen, trennen Sie Vordergrund-, Berechtigungs- und Genehmigungsstatus voneinander.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf:

- Node ist online und hat die erwarteten Capabilities.
- Vom Betriebssystem gewährte Berechtigungen für Kamera/Mikrofon/Standort/Bildschirm.
- Exec-Genehmigungen und Allowlist-Status.

Häufige Signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → die Node-App muss im Vordergrund sein.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → fehlende Betriebssystemberechtigung.
- `SYSTEM_RUN_DENIED: approval required` → Exec-Genehmigung steht aus.
- `SYSTEM_RUN_DENIED: allowlist miss` → Befehl wurde durch die Allowlist blockiert.

Verwandt:

- [Node troubleshooting](/de/nodes/troubleshooting)
- [Nodes](/de/nodes/index)
- [Exec approvals](/de/tools/exec-approvals)

## Browser-Tool schlägt fehl

Verwenden Sie dies, wenn Aktionen des Browser-Tools fehlschlagen, obwohl das Gateway selbst gesund ist.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Achten Sie auf:

- Ob `plugins.allow` gesetzt ist und `browser` enthält.
- Gültiger Pfad zur Browser-Executable.
- Erreichbarkeit des CDP-Profils.
- Verfügbarkeit von lokalem Chrome für Profile `existing-session` / `user`.

Häufige Signaturen:

- `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin wird durch `plugins.allow` ausgeschlossen.
- Browser-Tool fehlt / ist nicht verfügbar, obwohl `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
- `Failed to start Chrome CDP on port` → Browser-Prozess konnte nicht gestartet werden.
- `browser.executablePath not found` → der konfigurierte Pfad ist ungültig.
- `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
- `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen fehlerhaften oder ungültigen Port.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session konnte noch keine Verbindung zum ausgewählten Browser-Datenverzeichnis herstellen. Öffnen Sie die Browser-Inspect-Seite, aktivieren Sie Remote-Debugging, lassen Sie den Browser geöffnet, genehmigen Sie die erste Attach-Aufforderung und versuchen Sie es dann erneut. Wenn ein angemeldeter Zustand nicht erforderlich ist, bevorzugen Sie das verwaltete Profil `openclaw`.
- `No Chrome tabs found for profile="user"` → das Attach-Profil von Chrome MCP hat keine geöffneten lokalen Chrome-Tabs.
- `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
- `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → das Attach-only-Profil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber das CDP-WebSocket konnte dennoch nicht geöffnet werden.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → der aktuellen Gateway-Installation fehlt die Laufzeitabhängigkeit `playwright-core` des gebündelten Browser-Plugins; führen Sie `openclaw doctor --fix` aus und starten Sie dann das Gateway neu. ARIA-Snapshots und einfache Seitenscreenshots können weiterhin funktionieren, aber Navigation, AI-Snapshots, Element-Screenshots per CSS-Selektor und PDF-Export bleiben nicht verfügbar.
- `fullPage is not supported for element screenshots` → die Screenshot-Anfrage hat `--full-page` mit `--ref` oder `--element` kombiniert.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Screenshot-Aufrufe mit Chrome MCP / `existing-session` müssen Seitenerfassung oder ein Snapshot-`--ref` verwenden, nicht CSS-`--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → Upload-Hooks in Chrome MCP benötigen Snapshot-Refs, keine CSS-Selektoren.
- `existing-session file uploads currently support one file at a time.` → senden Sie bei Chrome-MCP-Profilen pro Aufruf nur einen Upload.
- `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks in Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
- `existing-session type does not support timeoutMs overrides.` → lassen Sie `timeoutMs` bei `act:type` für `profile="user"` / Chrome-MCP-existing-session-Profile weg oder verwenden Sie ein verwaltetes/CDP-Browserprofil, wenn ein benutzerdefiniertes Timeout erforderlich ist.
- `existing-session evaluate does not support timeoutMs overrides.` → lassen Sie `timeoutMs` bei `act:evaluate` für `profile="user"` / Chrome-MCP-existing-session-Profile weg oder verwenden Sie ein verwaltetes/CDP-Browserprofil, wenn ein benutzerdefiniertes Timeout erforderlich ist.
- `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.
- veraltete Überschreibungen für Viewport / Dark Mode / Locale / Offline-Modus bei Attach-only- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuersitzung zu schließen und den Emulationsstatus von Playwright/CDP freizugeben, ohne das gesamte Gateway neu zu starten.

Verwandt:

- [Browser troubleshooting](/de/tools/browser-linux-troubleshooting)
- [Browser (OpenClaw-managed)](/de/tools/browser)

## Wenn Sie ein Upgrade durchgeführt haben und plötzlich etwas kaputt ist

Die meisten Probleme nach einem Upgrade sind auf Konfigurationsabweichungen oder strengere nun durchgesetzte Standardwerte zurückzuführen.

### 1) Verhalten von Authentifizierung und URL-Überschreibungen hat sich geändert

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Worauf Sie achten sollten:

- Wenn `gateway.mode=remote`, können CLI-Aufrufe das entfernte Ziel verwenden, während Ihr lokaler Service in Ordnung ist.
- Explizite Aufrufe mit `--url` greifen nicht auf gespeicherte Anmeldedaten zurück.

Häufige Signaturen:

- `gateway connect failed:` → falsches URL-Ziel.
- `unauthorized` → Endpunkt ist erreichbar, aber die Authentifizierung ist falsch.

### 2) Guardrails für Bindung und Authentifizierung sind strenger

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Worauf Sie achten sollten:

- Bindungen, die nicht loopback sind (`lan`, `tailnet`, `custom`), benötigen einen gültigen Gateway-Authentifizierungspfad: Authentifizierung mit gemeinsamem Token/Passwort oder eine korrekt konfigurierte `trusted-proxy`-Bereitstellung, die nicht loopback ist.
- Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

Häufige Signaturen:

- `refusing to bind gateway ... without auth` → Bindung, die nicht loopback ist, ohne gültigen Gateway-Authentifizierungspfad.
- `Connectivity probe: failed`, obwohl die Laufzeit aktiv ist → Gateway lebt, ist aber mit aktueller Authentifizierung/URL nicht erreichbar.

### 3) Status von Pairing und Geräteidentität hat sich geändert

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Worauf Sie achten sollten:

- Ausstehende Gerätegenehmigungen für Dashboard/Nodes.
- Ausstehende DM-Pairing-Genehmigungen nach Richtlinien- oder Identitätsänderungen.

Häufige Signaturen:

- `device identity required` → Geräteauthentifizierung ist nicht erfüllt.
- `pairing required` → Absender/Gerät muss genehmigt werden.

Wenn Servicekonfiguration und Laufzeit nach diesen Prüfungen weiterhin nicht übereinstimmen, installieren Sie die Service-Metadaten aus demselben Profil-/Statusverzeichnis erneut:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [Gateway-owned pairing](/de/gateway/pairing)
- [Authentication](/de/gateway/authentication)
- [Background exec and process tool](/de/gateway/background-process)

## Verwandt

- [Gateway runbook](/de/gateway)
- [Doctor](/de/gateway/doctor)
- [FAQ](/de/help/faq)
