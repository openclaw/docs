---
read_when:
    - Der Hub zur Fehlerbehebung hat Sie für eine tiefergehende Diagnose hierher verwiesen
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen
summary: Detailliertes Runbook zur Fehlerbehebung für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-04-11T02:44:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7ef2faccba26ede307861504043a6415bc1f12dc64407771106f63ddc5b107f5
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Gateway-Fehlerbehebung

Diese Seite ist das ausführliche Runbook.
Beginnen Sie unter [/help/troubleshooting](/de/help/troubleshooting), wenn Sie zuerst den schnellen Triage-Ablauf möchten.

## Befehlsleiter

Führen Sie diese zuerst und in dieser Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Erwartete Signale für einen gesunden Zustand:

- `openclaw gateway status` zeigt `Runtime: running` und `RPC probe: ok`.
- `openclaw doctor` meldet keine blockierenden Konfigurations-/Serviceprobleme.
- `openclaw channels status --probe` zeigt den Live-Transportstatus pro Konto und,
  sofern unterstützt, Probe-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Anthropic 429 zusätzliche Nutzung für langen Kontext erforderlich

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf Folgendes:

- Das ausgewählte Anthropic-Opus-/Sonnet-Modell hat `params.context1m: true`.
- Die aktuelle Anthropic-Anmeldedaten sind nicht für Long-Context-Nutzung berechtigt.
- Anfragen schlagen nur bei langen Sitzungen/Modelläufen fehl, die den 1M-Beta-Pfad benötigen.

Optionen zur Behebung:

1. Deaktivieren Sie `context1m` für dieses Modell, um auf das normale Kontextfenster zurückzufallen.
2. Verwenden Sie Anthropic-Anmeldedaten, die für Long-Context-Anfragen berechtigt sind, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
3. Konfigurieren Sie Fallback-Modelle, damit Läufe fortgesetzt werden, wenn Anthropic-Long-Context-Anfragen abgelehnt werden.

Verwandt:

- [/providers/anthropic](/de/providers/anthropic)
- [/reference/token-use](/de/reference/token-use)
- [/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic](/de/help/faq#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

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
- Backend-Fehler dazu, dass `messages[].content` einen String erwartet
- Backend-Abstürze, die nur bei größeren Prompt-Token-Anzahlen oder vollständigen Agent-
  Laufzeit-Prompts auftreten

Häufige Signaturen:

- `messages[...].content: invalid type: sequence, expected a string` → Das Backend
  lehnt strukturierte Chat-Completions-Content-Teile ab. Behebung: Setzen Sie
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- direkte kleine Anfragen sind erfolgreich, aber OpenClaw-Agent-Läufe schlagen mit Backend-/Modell-
  Abstürzen fehl (zum Beispiel Gemma in einigen `inferrs`-Builds) → OpenClaw-Transport ist
  wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Agent-Laufzeit-
  Prompt-Form.
- Fehler werden nach dem Deaktivieren von Tools kleiner, verschwinden aber nicht → Tool-Schemas waren
  Teil der Belastung, aber das verbleibende Problem liegt weiterhin in der Upstream-Modell-/Server-
  Kapazität oder in einem Backend-Fehler.

Optionen zur Behebung:

1. Setzen Sie `compat.requiresStringContent: true` für reine String-Chat-Completions-Backends.
2. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die
   die Tool-Schema-Oberfläche von OpenClaw nicht zuverlässig verarbeiten können.
3. Reduzieren Sie, wo möglich, den Prompt-Druck: kleinerer Workspace-Bootstrap, kürzerer
   Sitzungsverlauf, leichteres lokales Modell oder ein Backend mit stärkerer Long-Context-
   Unterstützung.
4. Wenn direkte kleine Anfragen weiterhin erfolgreich sind, während OpenClaw-Agent-Turns im Backend
   weiterhin abstürzen, behandeln Sie dies als Upstream-Server-/Modell-Einschränkung und reichen
   dort eine Reproduktion mit der akzeptierten Payload-Form ein.

Verwandt:

- [/gateway/local-models](/de/gateway/local-models)
- [/gateway/configuration](/de/gateway/configuration)
- [/gateway/configuration-reference#openai-compatible-endpoints](/de/gateway/configuration-reference#openai-compatible-endpoints)

## Keine Antworten

Wenn Kanäle aktiv sind, aber nichts antwortet, prüfen Sie Routing und Richtlinien, bevor Sie irgendetwas erneut verbinden.

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
- Unstimmigkeiten bei Kanal-/Gruppen-Allowlists.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird ignoriert, bis eine Erwähnung erfolgt.
- `pairing request` → Absender benötigt Genehmigung.
- `blocked` / `allowlist` → Absender/Kanal wurde durch Richtlinie gefiltert.

Verwandt:

- [/channels/troubleshooting](/de/channels/troubleshooting)
- [/channels/pairing](/de/channels/pairing)
- [/channels/groups](/de/channels/groups)

## Dashboard-Control-UI-Konnektivität

Wenn Dashboard/Control UI keine Verbindung herstellt, validieren Sie URL, Auth-Modus und Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf Folgendes:

- Korrekte Probe-URL und Dashboard-URL.
- Auth-Modus-/Token-Unstimmigkeit zwischen Client und Gateway.
- HTTP-Nutzung, wo Geräteidentität erforderlich ist.

Häufige Signaturen:

- `device identity required` → unsicherer Kontext oder fehlende Geräteauthentifizierung.
- `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins`
  (oder Sie verbinden sich aus einer Browser-Origin, die nicht loopback ist, ohne explizite
  Allowlist).
- `device nonce required` / `device nonce mismatch` → Client schließt den
  challenge-basierten Geräteauthentifizierungsablauf nicht ab (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → Client hat die falsche
  Payload (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
- `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Client kann einen vertrauenswürdigen Wiederholungsversuch mit zwischengespeichertem Gerätetoken durchführen.
- Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet erneut die zwischengespeicherte Scope-Menge, die mit dem gepaarten
  Gerätetoken gespeichert wurde. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihre
  angeforderte Scope-Menge.
- Außerhalb dieses Wiederholungsversuchs ist die Verbindungs-Auth-Priorität explizit:
  gemeinsames Token/Passwort zuerst, dann explizites `deviceToken`, dann gespeichertes Gerätetoken,
  dann Bootstrap-Token.
- Im asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dieselbe
  `{scope, ip}` serialisiert, bevor der Limiter den Fehler erfasst. Zwei gleichzeitige fehlerhafte Wiederholungsversuche desselben Clients können daher beim zweiten Versuch
  `retry later` statt zweier einfacher Nichtübereinstimmungen anzeigen.
- `too many failed authentication attempts (retry later)` von einem Browser-Origin-
  Loopback-Client → wiederholte Fehlschläge derselben normalisierten `Origin` werden
  vorübergehend gesperrt; eine andere localhost-Origin verwendet einen separaten Bucket.
- wiederholtes `unauthorized` nach diesem Wiederholungsversuch → Drift bei gemeinsamem Token/Gerätetoken; aktualisieren Sie die Token-Konfiguration und genehmigen/rotieren Sie das Gerätetoken bei Bedarf erneut.
- `gateway connect failed:` → falscher Host-/Port-/URL-Zielwert.

### Schnellübersicht zu Auth-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                  | Bedeutung                                                | Empfohlene Aktion                                                                                                                                                                                                                                                                       |
| --------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Client hat kein erforderliches gemeinsames Token gesendet. | Fügen Sie das Token im Client ein/setzen Sie es und versuchen Sie es erneut. Für Dashboard-Pfade: `openclaw config get gateway.auth.token` und dann in die Control-UI-Einstellungen einfügen.                                                                                       |
| `AUTH_TOKEN_MISMATCH`       | Gemeinsames Token stimmt nicht mit dem Gateway-Auth-Token überein. | Wenn `canRetryWithDeviceToken=true`, einen vertrauenswürdigen Wiederholungsversuch zulassen. Wiederholungen mit zwischengespeichertem Token verwenden die gespeicherten genehmigten Scopes erneut; Aufrufer mit explizitem `deviceToken` / `scopes` behalten die angeforderten Scopes. Wenn es weiterhin fehlschlägt, führen Sie die [Checkliste zur Wiederherstellung bei Token-Drift](/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Zwischengespeichertes gerätespezifisches Token ist veraltet oder widerrufen. | Rotieren/genehmigen Sie das Gerätetoken mit der [Geräte-CLI](/cli/devices) erneut und verbinden Sie sich dann erneut.                                                                                                                                                                 |
| `PAIRING_REQUIRED`          | Geräteidentität ist bekannt, aber für diese Rolle nicht genehmigt. | Genehmigen Sie die ausstehende Anfrage: `openclaw devices list` und dann `openclaw devices approve <requestId>`.                                                                                                                                                                      |

Prüfung der Geräteauthentifizierung-v2-Migration:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler zeigen, aktualisieren Sie den verbindenden Client und prüfen Sie, ob er:

1. auf `connect.challenge` wartet
2. die challenge-gebundene Payload signiert
3. `connect.params.device.nonce` mit derselben Challenge-Nonce sendet

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet verweigert wird:

- Sitzungen mit gepaartem Gerätetoken können nur **ihr eigenes** Gerät verwalten, es sei denn, der
  Aufrufer hat zusätzlich `operator.admin`
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern,
  die die aufrufende Sitzung bereits besitzt

Verwandt:

- [/web/control-ui](/web/control-ui)
- [/gateway/configuration](/de/gateway/configuration) (Gateway-Auth-Modi)
- [/gateway/trusted-proxy-auth](/de/gateway/trusted-proxy-auth)
- [/gateway/remote](/de/gateway/remote)
- [/cli/devices](/cli/devices)

## Gateway-Service läuft nicht

Verwenden Sie dies, wenn der Service installiert ist, der Prozess aber nicht aktiv bleibt.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # scannt auch Services auf Systemebene
```

Achten Sie auf Folgendes:

- `Runtime: stopped` mit Hinweisen zum Beenden.
- Unstimmigkeit in der Service-Konfiguration (`Config (cli)` vs `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche launchd-/systemd-/schtasks-Installationen bei Verwendung von `--deep`.
- Bereinigungshinweise zu `Other gateway-like services detected (best effort)`.

Häufige Signaturen:

- `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → der lokale Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde überschrieben und hat `gateway.mode` verloren. Behebung: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete Konfiguration für den lokalen Modus neu zu setzen. Wenn Sie OpenClaw über Podman ausführen, ist der Standardpfad für die Konfiguration `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → Bindung ohne Loopback ohne gültigen Gateway-Auth-Pfad (Token/Passwort oder Trusted Proxy, falls konfiguriert).
- `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
- `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Units sind vorhanden. In den meisten Setups sollte pro Maschine nur ein Gateway aktiv sein; falls Sie mehr als eines benötigen, isolieren Sie Ports sowie Konfiguration/Status/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).

Verwandt:

- [/gateway/background-process](/de/gateway/background-process)
- [/gateway/configuration](/de/gateway/configuration)
- [/gateway/doctor](/de/gateway/doctor)

## Gateway-Probe-Warnungen

Verwenden Sie dies, wenn `openclaw gateway probe` etwas erreicht, aber weiterhin einen Warnblock ausgibt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Achten Sie auf Folgendes:

- `warnings[].code` und `primaryTargetId` in der JSON-Ausgabe.
- Ob sich die Warnung auf SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Auth-Refs bezieht.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → Das SSH-Setup ist fehlgeschlagen, aber der Befehl hat trotzdem direkte konfigurierte/Loopback-Ziele versucht.
- `multiple reachable gateways detected` → Mehr als ein Ziel hat geantwortet. Das bedeutet in der Regel ein beabsichtigtes Multi-Gateway-Setup oder veraltete/duplizierte Listener.
- `Probe diagnostics are limited by gateway scopes (missing operator.read)` → Verbindung war erfolgreich, aber Detail-RPC ist durch Scopes eingeschränkt; pairen Sie die Geräteidentität oder verwenden Sie Anmeldedaten mit `operator.read`.
- nicht aufgelöster Warntext zu `gateway.auth.*` / `gateway.remote.*` SecretRef → Auth-Material war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [/cli/gateway](/cli/gateway)
- [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host)
- [/gateway/remote](/de/gateway/remote)

## Kanal verbunden, aber Nachrichten fließen nicht

Wenn der Kanalstatus verbunden ist, aber der Nachrichtenfluss tot ist, konzentrieren Sie sich auf Richtlinien, Berechtigungen und kanalspezifische Zustellregeln.

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
- Fehlende API-Berechtigungen/Scopes des Kanals.

Häufige Signaturen:

- `mention required` → Nachricht wird durch die Gruppenerwähnungsrichtlinie ignoriert.
- `pairing` / Spuren ausstehender Genehmigungen → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Kanal-Authentifizierung/Berechtigungen.

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

- Cron ist aktiviert und der nächste Wake ist vorhanden.
- Job-Laufverlauf-Status (`ok`, `skipped`, `error`).
- Gründe für ausgelassene Heartbeats (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Häufige Signaturen:

- `cron: scheduler disabled; jobs will not run automatically` → Cron ist deaktiviert.
- `cron: timer tick failed` → Scheduler-Tick ist fehlgeschlagen; prüfen Sie Datei-/Log-/Laufzeitfehler.
- `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des aktiven Stundenfensters.
- `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur leere Zeilen / Markdown-Überschriften, daher überspringt OpenClaw den Modellaufruf.
- `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber bei diesem Tick ist keine Aufgabe fällig.
- `heartbeat: unknown accountId` → ungültige Konto-ID für das Heartbeat-Zustellziel.
- `heartbeat skipped` mit `reason=dm-blocked` → Heartbeat-Ziel wurde zu einem Ziel im DM-Stil aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder eine Überschreibung pro Agent) auf `block` gesetzt ist.

Verwandt:

- [/automation/cron-jobs#troubleshooting](/de/automation/cron-jobs#troubleshooting)
- [/automation/cron-jobs](/de/automation/cron-jobs)
- [/gateway/heartbeat](/de/gateway/heartbeat)

## Gepairtes Node-Tool schlägt fehl

Wenn eine Node gepairt ist, aber Tools fehlschlagen, isolieren Sie Vordergrund-, Berechtigungs- und Genehmigungsstatus.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf Folgendes:

- Node ist online mit den erwarteten Fähigkeiten.
- OS-Berechtigungen für Kamera/Mikrofon/Standort/Bildschirm.
- Ausführungsfreigaben und Allowlist-Status.

Häufige Signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → Die Node-App muss im Vordergrund sein.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → fehlende OS-Berechtigung.
- `SYSTEM_RUN_DENIED: approval required` → Ausführungsfreigabe ausstehend.
- `SYSTEM_RUN_DENIED: allowlist miss` → Befehl wurde durch die Allowlist blockiert.

Verwandt:

- [/nodes/troubleshooting](/de/nodes/troubleshooting)
- [/nodes/index](/de/nodes/index)
- [/tools/exec-approvals](/de/tools/exec-approvals)

## Browser-Tool schlägt fehl

Verwenden Sie dies, wenn Browser-Tool-Aktionen fehlschlagen, obwohl das Gateway selbst gesund ist.

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
- Verfügbarkeit von lokalem Chrome für `existing-session`- / `user`-Profile.

Häufige Signaturen:

- `unknown command "browser"` oder `unknown command 'browser'` → Das gebündelte Browser-Plugin ist durch `plugins.allow` ausgeschlossen.
- Browser-Tool fehlt / ist nicht verfügbar, obwohl `browser.enabled=true` → `plugins.allow` schließt `browser` aus, sodass das Plugin nie geladen wurde.
- `Failed to start Chrome CDP on port` → Browser-Prozess konnte nicht gestartet werden.
- `browser.executablePath not found` → Konfigurierter Pfad ist ungültig.
- `browser.cdpUrl must be http(s) or ws(s)` → Die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
- `browser.cdpUrl has invalid port` → Die konfigurierte CDP-URL hat einen fehlerhaften oder ungültigen Port.
- `No Chrome tabs found for profile="user"` → Das Chrome-MCP-Attach-Profil hat keine geöffneten lokalen Chrome-Tabs.
- `Remote CDP for profile "<name>" is not reachable` → Der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
- `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → Das Attach-only-Profil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber der CDP-WebSocket konnte trotzdem nicht geöffnet werden.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → In der aktuellen Gateway-Installation fehlt das vollständige Playwright-Paket; ARIA-Snapshots und einfache Seitenscreenshots können weiterhin funktionieren, aber Navigation, KI-Snapshots, Element-Screenshots per CSS-Selektor und PDF-Export bleiben nicht verfügbar.
- `fullPage is not supported for element screenshots` → Screenshot-Anfrage hat `--full-page` mit `--ref` oder `--element` kombiniert.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Screenshot-Aufrufe für Chrome MCP / `existing-session` müssen Seitenerfassung oder eine Snapshot-`--ref` verwenden, nicht CSS-`--element`.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → File-Upload-Hooks für Chrome MCP benötigen Snapshot-Refs, keine CSS-Selektoren.
- `existing-session file uploads currently support one file at a time.` → Senden Sie bei Chrome-MCP-Profilen pro Aufruf nur einen Upload.
- `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks auf Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
- `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein Roh-CDP-Profil.
- veraltete Overrides für Viewport / Dark Mode / Locale / Offline auf Attach-only- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuersitzung zu schließen und den Playwright-/CDP-Emulationsstatus freizugeben, ohne das gesamte Gateway neu zu starten.

Verwandt:

- [/tools/browser-linux-troubleshooting](/de/tools/browser-linux-troubleshooting)
- [/tools/browser](/de/tools/browser)

## Wenn Sie ein Upgrade durchgeführt haben und plötzlich etwas nicht mehr funktioniert

Die meisten Probleme nach einem Upgrade sind Konfigurationsdrift oder nun erzwungene strengere Standards.

### 1) Verhalten von Auth- und URL-Überschreibungen hat sich geändert

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Was zu prüfen ist:

- Wenn `gateway.mode=remote`, können CLI-Aufrufe auf das Remote-Ziel gehen, während Ihr lokaler Service in Ordnung ist.
- Explizite `--url`-Aufrufe greifen nicht auf gespeicherte Anmeldedaten zurück.

Häufige Signaturen:

- `gateway connect failed:` → falsches URL-Ziel.
- `unauthorized` → Endpunkt ist erreichbar, aber die Authentifizierung ist falsch.

### 2) Bind- und Auth-Guardrails sind strenger

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Was zu prüfen ist:

- Nicht-Loopback-Binds (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Auth-Pfad: gemeinsame Token-/Passwort-Authentifizierung oder eine korrekt konfigurierte nicht-Loopback-`trusted-proxy`-Bereitstellung.
- Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

Häufige Signaturen:

- `refusing to bind gateway ... without auth` → Nicht-Loopback-Bind ohne gültigen Gateway-Auth-Pfad.
- `RPC probe: failed` während die Laufzeit aktiv ist → Gateway lebt, ist aber mit der aktuellen Auth/URL nicht erreichbar.

### 3) Pairing- und Geräteidentitätsstatus hat sich geändert

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Was zu prüfen ist:

- Ausstehende Gerätegenehmigungen für Dashboard/Nodes.
- Ausstehende DM-Pairing-Genehmigungen nach Richtlinien- oder Identitätsänderungen.

Häufige Signaturen:

- `device identity required` → Geräteauthentifizierung ist nicht erfüllt.
- `pairing required` → Absender/Gerät muss genehmigt werden.

Wenn Service-Konfiguration und Laufzeit nach den Prüfungen weiterhin nicht übereinstimmen, installieren Sie die Service-Metadaten aus demselben Profil-/Statusverzeichnis erneut:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [/gateway/pairing](/de/gateway/pairing)
- [/gateway/authentication](/de/gateway/authentication)
- [/gateway/background-process](/de/gateway/background-process)
