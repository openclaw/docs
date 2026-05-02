---
read_when:
    - Der Troubleshooting-Hub hat Sie für eine tiefere Diagnose hierher verwiesen
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen
sidebarTitle: Troubleshooting
summary: Ausführliches Runbook zur Fehlerbehebung für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-05-02T06:35:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 815fbbca4d12b4b9c65b1172e07606d0eaf4c64df7fd6ca23a8f8d104b78c2a9
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Diese Seite ist das ausführliche Runbook. Beginnen Sie bei [/help/troubleshooting](/de/help/troubleshooting), wenn Sie zuerst den schnellen Triage-Ablauf wünschen.

## Befehlsabfolge

Führen Sie zuerst diese Befehle in dieser Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Erwartete gesunde Signale:

- `openclaw gateway status` zeigt `Runtime: running`, `Connectivity probe: ok` und eine Zeile `Capability: ...`.
- `openclaw doctor` meldet keine blockierenden Konfigurations- oder Dienstprobleme.
- `openclaw channels status --probe` zeigt den Live-Transportstatus pro Konto und, wo unterstützt, Prüf-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Split-Brain-Installationen und Schutz bei neuerer Konfiguration

Verwenden Sie dies, wenn ein Gateway-Dienst nach einem Update unerwartet stoppt oder Logs zeigen, dass eine `openclaw`-Binärdatei älter ist als die Version, die zuletzt `openclaw.json` geschrieben hat.

OpenClaw versieht Konfigurationsschreibvorgänge mit `meta.lastTouchedVersion`. Schreibgeschützte Befehle können eine Konfiguration, die von einem neueren OpenClaw geschrieben wurde, weiterhin prüfen, aber Prozess- und Dienständerungen verweigern mit einer älteren Binärdatei die Fortsetzung. Blockierte Aktionen umfassen Start, Stopp, Neustart und Deinstallation des Gateway-Dienstes, erzwungene Dienst-Neuinstallation, Gateway-Start im Dienstmodus und `gateway --force`-Portbereinigung.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH korrigieren">
    Korrigieren Sie `PATH`, damit `openclaw` zur neueren Installation aufgelöst wird, und führen Sie dann die Aktion erneut aus.
  </Step>
  <Step title="Gateway-Dienst neu installieren">
    Installieren Sie den vorgesehenen Gateway-Dienst aus der neueren Installation erneut:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Veraltete Wrapper entfernen">
    Entfernen Sie veraltete Systempaket- oder alte Wrapper-Einträge, die noch auf eine alte `openclaw`-Binärdatei zeigen.
  </Step>
</Steps>

<Warning>
Nur für absichtliches Downgrade oder Notfallwiederherstellung: Setzen Sie `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` für den einzelnen Befehl. Lassen Sie es für den normalen Betrieb ungesetzt.
</Warning>

## Anthropic 429: Zusätzliche Nutzung für langen Kontext erforderlich

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf:

- Das ausgewählte Anthropic Opus/Sonnet-Modell hat `params.context1m: true`.
- Die aktuelle Anthropic-Anmeldeinformation ist nicht für Long-Context-Nutzung berechtigt.
- Anfragen schlagen nur bei langen Sitzungen/Modellläufen fehl, die den 1M-Beta-Pfad benötigen.

Behebungsoptionen:

<Steps>
  <Step title="context1m deaktivieren">
    Deaktivieren Sie `context1m` für dieses Modell, um auf das normale Kontextfenster zurückzufallen.
  </Step>
  <Step title="Berechtigte Anmeldeinformation verwenden">
    Verwenden Sie eine Anthropic-Anmeldeinformation, die für Long-Context-Anfragen berechtigt ist, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
  </Step>
  <Step title="Fallback-Modelle konfigurieren">
    Konfigurieren Sie Fallback-Modelle, damit Läufe fortgesetzt werden, wenn Anthropic-Long-Context-Anfragen abgelehnt werden.
  </Step>
</Steps>

Verwandt:

- [Anthropic](/de/providers/anthropic)
- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Warum sehe ich HTTP 429 von Anthropic?](/de/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokales OpenAI-kompatibles Backend besteht direkte Prüfungen, aber Agent-Läufe schlagen fehl

Verwenden Sie dies, wenn:

- `curl ... /v1/models` funktioniert
- winzige direkte `/v1/chat/completions`-Aufrufe funktionieren
- OpenClaw-Modellläufe nur bei normalen Agent-Runden fehlschlagen

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Achten Sie auf:

- direkte winzige Aufrufe sind erfolgreich, aber OpenClaw-Läufe schlagen nur bei größeren Prompts fehl
- `model_not_found`- oder 404-Fehler, obwohl direktes `/v1/chat/completions`
  mit derselben nackten Modell-ID funktioniert
- Backend-Fehler darüber, dass `messages[].content` eine Zeichenfolge erwartet
- zeitweilige Warnungen `incomplete turn detected ... stopReason=stop payloads=0` mit einem OpenAI-kompatiblen lokalen Backend
- Backend-Abstürze, die nur bei größeren Prompt-Token-Anzahlen oder vollständigen Agent-Laufzeit-Prompts auftreten

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `model_not_found` mit einem lokalen Server im MLX/vLLM-Stil → verifizieren Sie, dass `baseUrl` `/v1` enthält, `api` für `/v1/chat/completions`-Backends `"openai-completions"` ist und `models.providers.<provider>.models[].id` die nackte Provider-lokale ID ist. Wählen Sie sie einmal mit dem Provider-Präfix aus, zum Beispiel `mlx/mlx-community/Qwen3-30B-A3B-6bit`; behalten Sie den Katalogeintrag als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → Backend lehnt strukturierte Chat-Completions-Inhaltsteile ab. Behebung: Setzen Sie `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → das Backend hat die Chat-Completions-Anfrage abgeschlossen, aber für diese Runde keinen für Benutzer sichtbaren Assistententext zurückgegeben. OpenClaw versucht replay-sichere leere OpenAI-kompatible Runden einmal erneut; anhaltende Fehler bedeuten normalerweise, dass das Backend leeren/nicht-textlichen Inhalt ausgibt oder den Text der finalen Antwort unterdrückt.
    - direkte winzige Anfragen sind erfolgreich, aber OpenClaw-Agent-Läufe schlagen mit Backend-/Modellabstürzen fehl (zum Beispiel Gemma auf einigen `inferrs`-Builds) → der OpenClaw-Transport ist wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Prompt-Form der Agent-Laufzeit.
    - Fehler nehmen nach dem Deaktivieren von Tools ab, verschwinden aber nicht → Tool-Schemas waren Teil des Drucks, aber das verbleibende Problem liegt weiterhin bei Upstream-Modell-/Serverkapazität oder einem Backend-Fehler.

  </Accordion>
  <Accordion title="Behebungsoptionen">
    1. Setzen Sie `compat.requiresStringContent: true` für string-only-Chat-Completions-Backends.
    2. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die OpenClaws Tool-Schema-Oberfläche nicht zuverlässig verarbeiten können.
    3. Senken Sie, wo möglich, den Prompt-Druck: kleineres Workspace-Bootstrap, kürzerer Sitzungsverlauf, leichteres lokales Modell oder ein Backend mit stärkerer Long-Context-Unterstützung.
    4. Wenn winzige direkte Anfragen weiterhin bestehen, während OpenClaw-Agent-Runden im Backend noch abstürzen, behandeln Sie dies als Upstream-Server-/Modellbeschränkung und reichen Sie dort eine Reproduktion mit der akzeptierten Payload-Form ein.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Konfiguration](/de/gateway/configuration)
- [Lokale Modelle](/de/gateway/local-models)
- [OpenAI-kompatible Endpunkte](/de/gateway/configuration-reference#openai-compatible-endpoints)

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

- Pairing ausstehend für DM-Absender.
- Gruppen-Erwähnungs-Gating (`requireMention`, `mentionPatterns`).
- Abweichungen bei Kanal-/Gruppen-Allowlisten.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht ignoriert, bis eine Erwähnung erfolgt.
- `pairing request` → Absender benötigt Genehmigung.
- `blocked` / `allowlist` → Absender/Kanal wurde durch Richtlinie gefiltert.

Verwandt:

- [Kanal-Fehlerbehebung](/de/channels/troubleshooting)
- [Gruppen](/de/channels/groups)
- [Pairing](/de/channels/pairing)

## Konnektivität der Dashboard-Control-UI

Wenn die Dashboard-/Control-UI keine Verbindung herstellt, validieren Sie URL, Auth-Modus und Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf:

- Korrekte Prüf-URL und Dashboard-URL.
- Abweichung bei Auth-Modus/Token zwischen Client und Gateway.
- HTTP-Nutzung, wo Geräteidentität erforderlich ist.

<AccordionGroup>
  <Accordion title="Verbindungs-/Auth-Signaturen">
    - `device identity required` → nicht sicherer Kontext oder fehlende Geräteauthentifizierung.
    - `origin not allowed` → Browser-`Origin` befindet sich nicht in `gateway.controlUi.allowedOrigins` (oder Sie verbinden sich von einem Browser-Origin ohne Loopback ohne explizite Allowlist).
    - `device nonce required` / `device nonce mismatch` → Client schließt den Challenge-basierten Geräteauthentifizierungsablauf nicht ab (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → Client hat die falsche Payload (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
    - `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Client kann einen vertrauenswürdigen erneuten Versuch mit zwischengespeichertem Gerätetoken durchführen.
    - Dieser erneute Versuch mit zwischengespeichertem Token verwendet den zwischengespeicherten Scope-Satz, der mit dem gekoppelten Gerätetoken gespeichert ist. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihren angeforderten Scope-Satz.
    - Außerhalb dieses Wiederholungspfads ist die Auth-Priorität bei Verbindungen zuerst explizites Shared Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken, dann Bootstrap-Token.
    - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für denselben `{scope, ip}` serialisiert, bevor der Limiter den Fehler erfasst. Zwei fehlerhafte gleichzeitige Wiederholungsversuche desselben Clients können daher beim zweiten Versuch `retry later` statt zwei einfachen Abweichungen ausgeben.
    - `too many failed authentication attempts (retry later)` von einem Browser-Origin-Loopback-Client → wiederholte Fehler von demselben normalisierten `Origin` werden vorübergehend gesperrt; ein anderer localhost-Origin verwendet einen separaten Bucket.
    - wiederholtes `unauthorized` nach diesem erneuten Versuch → Shared-Token-/Gerätetoken-Drift; aktualisieren Sie die Token-Konfiguration und genehmigen/rotieren Sie das Gerätetoken bei Bedarf erneut.
    - `gateway connect failed:` → falsches Host-/Port-/URL-Ziel.

  </Accordion>
</AccordionGroup>

### Schnellübersicht der Auth-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                  | Bedeutung                                                                                                                                                                                      | Empfohlene Aktion                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Der Client hat ein erforderliches gemeinsames Token nicht gesendet.                                                                                                                                                 | Fügen Sie das Token im Client ein bzw. legen Sie es dort fest und versuchen Sie es erneut. Für Dashboard-Pfade: `openclaw config get gateway.auth.token`, dann in die Control UI-Einstellungen einfügen.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Das gemeinsame Token stimmte nicht mit dem Gateway-Auth-Token überein.                                                                                                                                               | Wenn `canRetryWithDeviceToken=true` ist, erlauben Sie einen vertrauenswürdigen erneuten Versuch. Wiederholungen mit zwischengespeicherten Tokens verwenden gespeicherte genehmigte Scopes erneut; explizite `deviceToken`- / `scopes`-Aufrufer behalten die angeforderten Scopes bei. Wenn es weiterhin fehlschlägt, führen Sie die [Prüfliste zur Wiederherstellung bei Token-Drift](/de/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Das zwischengespeicherte Token pro Gerät ist veraltet oder widerrufen.                                                                                                                                                 | Rotieren bzw. genehmigen Sie das Geräte-Token mit der [Geräte-CLI](/de/cli/devices) erneut und verbinden Sie sich dann neu.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Die Geräteidentität muss genehmigt werden. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade`, und verwenden Sie `requestId` / `remediationHint`, falls vorhanden. | Genehmigen Sie die ausstehende Anfrage: `openclaw devices list`, dann `openclaw devices approve <requestId>`. Scope-/Rollen-Upgrades verwenden denselben Ablauf, nachdem Sie den angeforderten Zugriff geprüft haben.                                                                                                               |

<Note>
Direkte Backend-RPCs über local loopback, die mit dem gemeinsamen Gateway-Token/-Passwort authentifiziert sind, sollten nicht von der Scope-Baseline der über die CLI gekoppelten Geräte abhängen. Wenn Subagenten oder andere interne Aufrufe weiterhin mit `scope-upgrade` fehlschlagen, prüfen Sie, ob der Aufrufer `client.id: "gateway-client"` und `client.mode: "backend"` verwendet und nicht explizit eine `deviceIdentity` oder ein Geräte-Token erzwingt.
</Note>

Migrationsprüfung für Geräteauthentifizierung v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler zeigen, aktualisieren Sie den verbindenden Client und prüfen Sie ihn:

<Steps>
  <Step title="Auf connect.challenge warten">
    Der Client wartet auf die vom Gateway ausgegebene `connect.challenge`.
  </Step>
  <Step title="Payload signieren">
    Der Client signiert die an die Challenge gebundene Payload.
  </Step>
  <Step title="Geräte-Nonce senden">
    Der Client sendet `connect.params.device.nonce` mit derselben Challenge-Nonce.
  </Step>
</Steps>

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet verweigert wird:

- Gekoppelte Geräte-Token-Sitzungen können nur **ihr eigenes** Gerät verwalten, sofern der Aufrufer nicht zusätzlich `operator.admin` hat
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern, die die Aufrufersitzung bereits besitzt

Verwandt:

- [Konfiguration](/de/gateway/configuration) (Gateway-Auth-Modi)
- [Control UI](/de/web/control-ui)
- [Geräte](/de/cli/devices)
- [Remotezugriff](/de/gateway/remote)
- [Trusted-Proxy-Auth](/de/gateway/trusted-proxy-auth)

## Gateway-Dienst läuft nicht

Verwenden Sie dies, wenn der Dienst installiert ist, der Prozess aber nicht aktiv bleibt.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Achten Sie auf:

- `Runtime: stopped` mit Exit-Hinweisen.
- Abweichende Dienstkonfiguration (`Config (cli)` vs `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche launchd-/systemd-/schtasks-Installationen, wenn `--deep` verwendet wird.
- Bereinigungshinweise zu `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → der lokale Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde überschrieben und hat `gateway.mode` verloren. Lösung: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration, oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete lokale Moduskonfiguration neu zu schreiben. Wenn Sie OpenClaw über Podman ausführen, ist der Standardkonfigurationspfad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → Nicht-loopback-Bindung ohne gültigen Gateway-Auth-Pfad (Token/Passwort oder Trusted-Proxy, wo konfiguriert).
    - `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
    - `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Einheiten existieren. Die meisten Setups sollten ein Gateway pro Maschine verwenden; wenn Sie mehr als eines benötigen, isolieren Sie Ports + Konfiguration/Zustand/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` vom Doctor → eine systemweite systemd-Einheit existiert, während der benutzerbezogene Dienst fehlt. Entfernen oder deaktivieren Sie das Duplikat, bevor Sie Doctor erlauben, einen Benutzerdienst zu installieren, oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn die Systemeinheit der vorgesehene Supervisor ist.
    - `Gateway service port does not match current gateway config` → der installierte Supervisor pinnt noch den alten `--port`. Führen Sie `openclaw doctor --fix` oder `openclaw gateway install --force` aus und starten Sie dann den Gateway-Dienst neu.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Hintergrundausführung und Prozess-Tool](/de/gateway/background-process)
- [Konfiguration](/de/gateway/configuration)
- [Doctor](/de/gateway/doctor)

## Gateway hat die letzte als funktionierend bekannte Konfiguration wiederhergestellt

Verwenden Sie dies, wenn das Gateway startet, die Logs aber sagen, dass `openclaw.json` wiederhergestellt wurde.

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
- Ein Systemereignis des Hauptagenten, das mit `Config recovery warning` beginnt

<AccordionGroup>
  <Accordion title="Was passiert ist">
    - Die abgelehnte Konfiguration wurde beim Start oder Hot Reload nicht validiert.
    - OpenClaw hat die abgelehnte Payload als `.clobbered.*` aufbewahrt.
    - Die aktive Konfiguration wurde aus der letzten validierten last-known-good-Kopie wiederhergestellt.
    - Die nächste Hauptagentenrunde wird gewarnt, die abgelehnte Konfiguration nicht blind neu zu schreiben.
    - Wenn alle Validierungsprobleme unter `plugins.entries.<id>...` lagen, würde OpenClaw nicht die gesamte Datei wiederherstellen. Plugin-lokale Fehler bleiben deutlich sichtbar, während nicht zusammenhängende Benutzereinstellungen in der aktiven Konfiguration verbleiben.

  </Accordion>
  <Accordion title="Prüfen und reparieren">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Häufige Signaturen">
    - `.clobbered.*` existiert → eine externe direkte Bearbeitung oder ein Startlesevorgang wurde wiederhergestellt.
    - `.rejected.*` existiert → ein von OpenClaw gesteuerter Konfigurationsschreibvorgang ist vor dem Commit an Schema- oder Clobber-Prüfungen fehlgeschlagen.
    - `Config write rejected:` → der Schreibvorgang versuchte, erforderliche Struktur zu entfernen, die Datei stark zu verkleinern oder ungültige Konfiguration zu persistieren.
    - `Rejected validation details:` → das Wiederherstellungslog oder der Hinweis des Hauptagenten enthält den Schemapfad, der die Wiederherstellung verursacht hat, zum Beispiel `agents.defaults.execution` oder `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oder `size-drop-vs-last-good:*` → der Start behandelte die aktuelle Datei als überschrieben, weil ihr im Vergleich zum last-known-good-Backup Felder oder Größe fehlten.
    - `Config last-known-good promotion skipped` → der Kandidat enthielt redigierte Secret-Platzhalter wie `***`.

  </Accordion>
  <Accordion title="Korrekturoptionen">
    1. Behalten Sie die wiederhergestellte aktive Konfiguration, wenn sie korrekt ist.
    2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*` und wenden Sie sie dann mit `openclaw config set` oder `config.patch` an.
    3. Führen Sie `openclaw config validate` aus, bevor Sie neu starten.
    4. Wenn Sie von Hand bearbeiten, behalten Sie die vollständige JSON5-Konfiguration bei, nicht nur das Teilobjekt, das Sie ändern wollten.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Konfiguration](/de/cli/config)
- [Konfiguration: Hot Reload](/de/gateway/configuration#config-hot-reload)
- [Konfiguration: strikte Validierung](/de/gateway/configuration#strict-validation)
- [Doctor](/de/gateway/doctor)

## Gateway-Probe-Warnungen

Verwenden Sie dies, wenn `openclaw gateway probe` etwas erreicht, aber trotzdem einen Warnblock ausgibt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Achten Sie auf:

- `warnings[].code` und `primaryTargetId` in der JSON-Ausgabe.
- Ob die Warnung SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Auth-Referenzen betrifft.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-Einrichtung fehlgeschlagen, aber der Befehl hat weiterhin direkte konfigurierte/local loopback-Ziele versucht.
- `multiple reachable gateways detected` → mehr als ein Ziel hat geantwortet. In der Regel bedeutet das ein beabsichtigtes Multi-Gateway-Setup oder veraltete/duplizierte Listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → die Verbindung hat funktioniert, aber der Detail-RPC ist durch Scopes eingeschränkt; koppeln Sie die Geräteidentität oder verwenden Sie Anmeldedaten mit `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → die Verbindung hat funktioniert, aber der vollständige Satz diagnostischer RPCs ist abgelaufen oder fehlgeschlagen. Behandeln Sie dies als erreichbares Gateway mit eingeschränkter Diagnose; vergleichen Sie `connect.ok` und `connect.rpcOk` in der `--json`-Ausgabe.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → das Gateway hat geantwortet, aber dieser Client benötigt vor normalem Operator-Zugriff noch Kopplung/Genehmigung.
- nicht aufgelöster `gateway.auth.*`- / `gateway.remote.*`-SecretRef-Warntext → Auth-Material war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [Gateway](/de/cli/gateway)
- [Mehrere Gateways auf demselben Host](/de/gateway#multiple-gateways-same-host)
- [Remotezugriff](/de/gateway/remote)

## Kanal verbunden, Nachrichten fließen nicht

Wenn der Kanalstatus verbunden ist, aber der Nachrichtenfluss tot ist, konzentrieren Sie sich auf Richtlinien, Berechtigungen und kanalspezifische Zustellregeln.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Achten Sie auf:

- DM-Richtlinie (`pairing`, `allowlist`, `open`, `disabled`).
- Gruppen-Allowlist und Anforderungen an Erwähnungen.
- Fehlende Kanal-API-Berechtigungen/-Scopes.

Häufige Signaturen:

- `mention required` → Nachricht wurde durch die Gruppen-Erwähnungsrichtlinie ignoriert.
- `pairing` / Ablaufspuren mit ausstehender Genehmigung → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Kanal-Authentifizierung/-Berechtigungen.

Verwandt:

- [Fehlerbehebung für Kanäle](/de/channels/troubleshooting)
- [Discord](/de/channels/discord)
- [Telegram](/de/channels/telegram)
- [WhatsApp](/de/channels/whatsapp)

## Cron- und Heartbeat-Zustellung

Wenn Cron oder Heartbeat nicht ausgeführt oder nicht zugestellt wurde, prüfen Sie zuerst den Scheduler-Status und dann das Zustellziel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Achten Sie auf:

- Cron aktiviert und nächste Aktivierung vorhanden.
- Status des Job-Ausführungsverlaufs (`ok`, `skipped`, `error`).
- Gründe für übersprungene Heartbeats (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron deaktiviert.
    - `cron: timer tick failed` → Scheduler-Tick fehlgeschlagen; prüfen Sie Datei-/Log-/Laufzeitfehler.
    - `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des aktiven Zeitfensters.
    - `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur Leerzeilen / Markdown-Überschriften, daher überspringt OpenClaw den Modellaufruf.
    - `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber keine der Aufgaben ist bei diesem Tick fällig.
    - `heartbeat: unknown accountId` → ungültige Konto-ID für das Heartbeat-Zustellziel.
    - `heartbeat skipped` mit `reason=dm-blocked` → Heartbeat-Ziel wurde zu einem DM-artigen Ziel aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder die agentenspezifische Überschreibung) auf `block` gesetzt ist.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
- [Geplante Aufgaben: Fehlerbehebung](/de/automation/cron-jobs#troubleshooting)

## Node gekoppelt, Tool schlägt fehl

Wenn eine Node gekoppelt ist, Tools aber fehlschlagen, isolieren Sie Vordergrund-, Berechtigungs- und Genehmigungsstatus.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf:

- Node online mit erwarteten Fähigkeiten.
- Betriebssystem-Berechtigungen für Kamera/Mikrofon/Standort/Bildschirm.
- Exec-Genehmigungen und Allowlist-Status.

Häufige Signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-App muss im Vordergrund sein.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → fehlende Betriebssystem-Berechtigung.
- `SYSTEM_RUN_DENIED: approval required` → Exec-Genehmigung ausstehend.
- `SYSTEM_RUN_DENIED: allowlist miss` → Befehl durch Allowlist blockiert.

Verwandt:

- [Exec-Genehmigungen](/de/tools/exec-approvals)
- [Node-Fehlerbehebung](/de/nodes/troubleshooting)
- [Nodes](/de/nodes/index)

## Browser-Tool schlägt fehl

Verwenden Sie dies, wenn Browser-Tool-Aktionen fehlschlagen, obwohl das Gateway selbst fehlerfrei ist.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Achten Sie auf:

- Ob `plugins.allow` gesetzt ist und `browser` enthält.
- Gültiger Pfad zur Browser-Ausführungsdatei.
- Erreichbarkeit des CDP-Profils.
- Verfügbarkeit von lokalem Chrome für `existing-session`- / `user`-Profile.

<AccordionGroup>
  <Accordion title="Plugin- / Ausführungsdatei-Signaturen">
    - `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin ist durch `plugins.allow` ausgeschlossen.
    - Browser-Tool fehlt / nicht verfügbar, obwohl `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
    - `Failed to start Chrome CDP on port` → Browser-Prozess konnte nicht gestartet werden.
    - `browser.executablePath not found` → konfigurierter Pfad ist ungültig.
    - `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
    - `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen ungültigen oder außerhalb des Bereichs liegenden Port.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → der aktuellen Gateway-Installation fehlt die Kernabhängigkeit für die Browser-Laufzeit; installieren oder aktualisieren Sie OpenClaw neu und starten Sie dann das Gateway neu. ARIA-Snapshots und einfache Seiten-Screenshots können weiterhin funktionieren, aber Navigation, KI-Snapshots, Element-Screenshots mit CSS-Selektor und PDF-Export bleiben nicht verfügbar.

  </Accordion>
  <Accordion title="Chrome-MCP- / existing-session-Signaturen">
    - `Could not find DevToolsActivePort for chrome` → Chrome-MCP-`existing-session` konnte noch nicht an das ausgewählte Browser-Datenverzeichnis anhängen. Öffnen Sie die Browser-Inspect-Seite, aktivieren Sie Remote-Debugging, lassen Sie den Browser geöffnet, genehmigen Sie die erste Anhänge-Aufforderung und versuchen Sie es erneut. Wenn ein angemeldeter Zustand nicht erforderlich ist, bevorzugen Sie das verwaltete `openclaw`-Profil.
    - `No Chrome tabs found for profile="user"` → das Chrome-MCP-Anhängeprofil hat keine geöffneten lokalen Chrome-Tabs.
    - `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
    - `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → das Attach-only-Profil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber der CDP-WebSocket konnte dennoch nicht geöffnet werden.

  </Accordion>
  <Accordion title="Element- / Screenshot- / Upload-Signaturen">
    - `fullPage is not supported for element screenshots` → Screenshot-Anfrage hat `--full-page` mit `--ref` oder `--element` kombiniert.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome-MCP- / `existing-session`-Screenshot-Aufrufe müssen Seitenerfassung oder ein Snapshot-`--ref` verwenden, nicht CSS-`--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome-MCP-Upload-Hooks benötigen Snapshot-Refs, keine CSS-Selektoren.
    - `existing-session file uploads currently support one file at a time.` → senden Sie bei Chrome-MCP-Profilen einen Upload pro Aufruf.
    - `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks bei Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
    - `existing-session type does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:type` bei `profile="user"`- / Chrome-MCP-`existing-session`-Profilen weg, oder verwenden Sie ein verwaltetes/CDP-Browser-Profil, wenn ein benutzerdefinierter Timeout erforderlich ist.
    - `existing-session evaluate does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:evaluate` bei `profile="user"`- / Chrome-MCP-`existing-session`-Profilen weg, oder verwenden Sie ein verwaltetes/CDP-Browser-Profil, wenn ein benutzerdefinierter Timeout erforderlich ist.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein rohes CDP-Profil.
    - Veraltete Viewport- / Dark-Mode- / Locale- / Offline-Überschreibungen bei Attach-only- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuerungssitzung zu schließen und den Playwright-/CDP-Emulationsstatus freizugeben, ohne das gesamte Gateway neu zu starten.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Browser (von OpenClaw verwaltet)](/de/tools/browser)
- [Browser-Fehlerbehebung](/de/tools/browser-linux-troubleshooting)

## Wenn Sie aktualisiert haben und plötzlich etwas nicht mehr funktioniert

Die meisten Ausfälle nach einem Upgrade entstehen durch Konfigurationsabweichungen oder jetzt erzwungene strengere Defaults.

<AccordionGroup>
  <Accordion title="1. Verhalten bei Authentifizierung und URL-Überschreibung geändert">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Zu prüfen:

    - Wenn `gateway.mode=remote`, können CLI-Aufrufe auf Remote zielen, obwohl Ihr lokaler Dienst in Ordnung ist.
    - Explizite `--url`-Aufrufe fallen nicht auf gespeicherte Anmeldedaten zurück.

    Häufige Signaturen:

    - `gateway connect failed:` → falsches URL-Ziel.
    - `unauthorized` → Endpunkt erreichbar, aber falsche Authentifizierung.

  </Accordion>
  <Accordion title="2. Bind- und Authentifizierungs-Schutzmechanismen sind strenger">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Zu prüfen:

    - Nicht-loopback-Binds (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Authentifizierungspfad: Shared-Token-/Passwort-Authentifizierung oder eine korrekt konfigurierte nicht-loopback-`trusted-proxy`-Bereitstellung.
    - Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

    Häufige Signaturen:

    - `refusing to bind gateway ... without auth` → nicht-loopback-Bind ohne gültigen Gateway-Authentifizierungspfad.
    - `Connectivity probe: failed`, während die Laufzeit ausgeführt wird → Gateway läuft, ist aber mit aktueller Authentifizierung/URL nicht zugänglich.

  </Accordion>
  <Accordion title="3. Kopplungs- und Geräteidentitätsstatus geändert">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Zu prüfen:

    - Ausstehende Gerätegenehmigungen für Dashboard/Nodes.
    - Ausstehende DM-Kopplungsgenehmigungen nach Richtlinien- oder Identitätsänderungen.

    Häufige Signaturen:

    - `device identity required` → Geräteauthentifizierung nicht erfüllt.
    - `pairing required` → Absender/Gerät muss genehmigt werden.

  </Accordion>
</AccordionGroup>

Wenn Dienstkonfiguration und Laufzeit nach den Prüfungen weiterhin voneinander abweichen, installieren Sie die Dienstmetadaten aus demselben Profil-/Statusverzeichnis neu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [Authentifizierung](/de/gateway/authentication)
- [Hintergrund-Exec und Prozess-Tool](/de/gateway/background-process)
- [Gateway-eigene Kopplung](/de/gateway/pairing)

## Verwandt

- [Doctor](/de/gateway/doctor)
- [FAQ](/de/help/faq)
- [Gateway-Runbook](/de/gateway)
