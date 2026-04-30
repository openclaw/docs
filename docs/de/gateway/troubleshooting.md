---
read_when:
    - Die Zentrale zur Fehlerbehebung hat Sie für eine eingehendere Diagnose hierher verwiesen
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen
sidebarTitle: Troubleshooting
summary: Ausführliches Runbook zur Fehlerbehebung für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-04-30T06:56:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48735a68daa92678867a9cafb3ceeb37063bb91dee8c4c94e185f74eb0296fcb
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Diese Seite ist das ausführliche Runbook. Beginnen Sie bei [/help/troubleshooting](/de/help/troubleshooting), wenn Sie zuerst den schnellen Triage-Ablauf möchten.

## Befehlsleiter

Führen Sie diese zuerst in dieser Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Erwartete gesunde Signale:

- `openclaw gateway status` zeigt `Runtime: running`, `Connectivity probe: ok` und eine `Capability: ...`-Zeile.
- `openclaw doctor` meldet keine blockierenden Konfigurations- oder Dienstprobleme.
- `openclaw channels status --probe` zeigt den Live-Transportstatus pro Konto und, sofern unterstützt, Prüf-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Split-Brain-Installationen und Schutz für neuere Konfiguration

Verwenden Sie dies, wenn ein Gateway-Dienst nach einem Update unerwartet stoppt oder Protokolle zeigen, dass eine `openclaw`-Binärdatei älter ist als die Version, die zuletzt `openclaw.json` geschrieben hat.

OpenClaw versieht Konfigurationsschreibvorgänge mit `meta.lastTouchedVersion`. Schreibgeschützte Befehle können eine von einer neueren OpenClaw-Version geschriebene Konfiguration weiterhin prüfen, aber Prozess- und Dienständerungen verweigern mit einer älteren Binärdatei die Fortsetzung. Blockierte Aktionen umfassen Start, Stopp, Neustart, Deinstallation des Gateway-Dienstes, erzwungene Neuinstallation des Dienstes, Gateway-Start im Dienstmodus und `gateway --force`-Portbereinigung.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH korrigieren">
    Korrigieren Sie `PATH`, sodass `openclaw` auf die neuere Installation verweist, und führen Sie die Aktion dann erneut aus.
  </Step>
  <Step title="Gateway-Dienst neu installieren">
    Installieren Sie den vorgesehenen Gateway-Dienst aus der neueren Installation neu:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Veraltete Wrapper entfernen">
    Entfernen Sie veraltete Systempakete oder alte Wrapper-Einträge, die weiterhin auf eine alte `openclaw`-Binärdatei zeigen.
  </Step>
</Steps>

<Warning>
Nur für absichtliche Downgrades oder Notfallwiederherstellung: Setzen Sie `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` für den einzelnen Befehl. Lassen Sie es im normalen Betrieb ungesetzt.
</Warning>

## Anthropic 429: zusätzliche Nutzung für langen Kontext erforderlich

Verwenden Sie dies, wenn Protokolle/Fehler Folgendes enthalten: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf:

- Das ausgewählte Anthropic Opus/Sonnet-Modell hat `params.context1m: true`.
- Die aktuelle Anthropic-Anmeldedaten sind nicht für Long-Context-Nutzung berechtigt.
- Anfragen schlagen nur bei langen Sitzungen/Modellläufen fehl, die den 1M-Beta-Pfad benötigen.

Behebungsoptionen:

<Steps>
  <Step title="context1m deaktivieren">
    Deaktivieren Sie `context1m` für dieses Modell, um auf das normale Kontextfenster zurückzufallen.
  </Step>
  <Step title="Berechtigte Anmeldedaten verwenden">
    Verwenden Sie Anthropic-Anmeldedaten, die für Long-Context-Anfragen berechtigt sind, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
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
- OpenClaw-Modellläufe nur bei normalen Agent-Zügen fehlschlagen

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
- `model_not_found` oder 404-Fehler, obwohl direkte `/v1/chat/completions`
  mit derselben nackten Modell-ID funktionieren
- Backend-Fehler darüber, dass `messages[].content` eine Zeichenfolge erwartet
- zeitweilige Warnungen `incomplete turn detected ... stopReason=stop payloads=0` mit einem OpenAI-kompatiblen lokalen Backend
- Backend-Abstürze, die nur bei größeren Prompt-Token-Zahlen oder vollständigen Agent-Runtime-Prompts auftreten

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `model_not_found` mit einem lokalen MLX/vLLM-artigen Server → prüfen Sie, dass `baseUrl` `/v1` enthält, `api` für `/v1/chat/completions`-Backends `"openai-completions"` ist und `models.providers.<provider>.models[].id` die nackte providerlokale ID ist. Wählen Sie sie einmal mit dem Provider-Präfix aus, zum Beispiel `mlx/mlx-community/Qwen3-30B-A3B-6bit`; behalten Sie den Katalogeintrag als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → Backend lehnt strukturierte Chat-Completions-Inhaltsteile ab. Behebung: Setzen Sie `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → Das Backend hat die Chat-Completions-Anfrage abgeschlossen, aber für diesen Zug keinen für Benutzer sichtbaren Assistant-Text zurückgegeben. OpenClaw wiederholt replay-sichere leere OpenAI-kompatible Züge einmal; anhaltende Fehler bedeuten normalerweise, dass das Backend leere/nicht textuelle Inhalte ausgibt oder Final-Answer-Text unterdrückt.
    - direkte winzige Anfragen sind erfolgreich, aber OpenClaw-Agent-Läufe schlagen mit Backend-/Modellabstürzen fehl (zum Beispiel Gemma auf einigen `inferrs`-Builds) → Der OpenClaw-Transport ist wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Agent-Runtime-Prompt-Form.
    - Fehler werden nach Deaktivierung von Tools kleiner, verschwinden aber nicht → Tool-Schemas waren Teil des Drucks, aber das verbleibende Problem liegt weiterhin bei der Upstream-Modell-/Serverkapazität oder einem Backend-Fehler.

  </Accordion>
  <Accordion title="Behebungsoptionen">
    1. Setzen Sie `compat.requiresStringContent: true` für string-only Chat-Completions-Backends.
    2. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die OpenClaws Tool-Schema-Oberfläche nicht zuverlässig verarbeiten können.
    3. Reduzieren Sie, wo möglich, den Prompt-Druck: kleinerer Workspace-Bootstrap, kürzerer Sitzungsverlauf, leichteres lokales Modell oder ein Backend mit stärkerer Long-Context-Unterstützung.
    4. Wenn winzige direkte Anfragen weiterhin funktionieren, während OpenClaw-Agent-Züge im Backend abstürzen, behandeln Sie es als Upstream-Server-/Modellbeschränkung und melden Sie dort eine Reproduktion mit der akzeptierten Payload-Form.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Konfiguration](/de/gateway/configuration)
- [Lokale Modelle](/de/gateway/local-models)
- [OpenAI-kompatible Endpunkte](/de/gateway/configuration-reference#openai-compatible-endpoints)

## Keine Antworten

Wenn Channels verfügbar sind, aber nichts antwortet, prüfen Sie Routing und Richtlinie, bevor Sie irgendetwas neu verbinden.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Achten Sie auf:

- Ausstehendes Pairing für DM-Absender.
- Gruppen-Erwähnungs-Gating (`requireMention`, `mentionPatterns`).
- Abweichungen in Channel-/Gruppen-Allowlists.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird bis zur Erwähnung ignoriert.
- `pairing request` → Absender benötigt Genehmigung.
- `blocked` / `allowlist` → Absender/Channel wurde durch Richtlinie gefiltert.

Verwandt:

- [Channel-Fehlerbehebung](/de/channels/troubleshooting)
- [Gruppen](/de/channels/groups)
- [Pairing](/de/channels/pairing)

## Konnektivität der Dashboard-Steuerungs-UI

Wenn die Dashboard-/Steuerungs-UI keine Verbindung herstellt, validieren Sie URL, Auth-Modus und Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf:

- Korrekte Prüf-URL und Dashboard-URL.
- Abweichung von Auth-Modus/Token zwischen Client und Gateway.
- HTTP-Nutzung, wo Geräteidentität erforderlich ist.

<AccordionGroup>
  <Accordion title="Verbindungs-/Auth-Signaturen">
    - `device identity required` → nicht sicherer Kontext oder fehlende Geräteauthentifizierung.
    - `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins` enthalten (oder Sie verbinden sich von einem Browser-Origin ohne Loopback ohne explizite Allowlist).
    - `device nonce required` / `device nonce mismatch` → Client schließt den challengebasierten Geräteauthentifizierungsablauf (`connect.challenge` + `device.nonce`) nicht ab.
    - `device signature invalid` / `device signature expired` → Client hat das falsche Payload (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
    - `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Client kann einen vertrauenswürdigen Retry mit zwischengespeichertem Geräte-Token ausführen.
    - Dieser Retry mit zwischengespeichertem Token verwendet den zwischengespeicherten Scope-Satz, der mit dem gekoppelten Geräte-Token gespeichert ist. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihren angeforderten Scope-Satz.
    - Außerhalb dieses Retry-Pfads gilt bei Connect-Auth die Priorität: zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
    - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, ip}` serialisiert, bevor der Limiter den Fehler erfasst. Zwei fehlerhafte gleichzeitige Retries vom selben Client können daher beim zweiten Versuch `retry later` statt zwei einfacher Abweichungen ausgeben.
    - `too many failed authentication attempts (retry later)` von einem Browser-Origin-Loopback-Client → wiederholte Fehler von demselben normalisierten `Origin` werden vorübergehend gesperrt; ein anderer localhost-Origin verwendet einen separaten Bucket.
    - wiederholtes `unauthorized` nach diesem Retry → gemeinsames Token/Geräte-Token-Drift; Token-Konfiguration aktualisieren und Geräte-Token bei Bedarf erneut genehmigen/rotieren.
    - `gateway connect failed:` → falscher Host/Port/URL-Ziel.

  </Accordion>
</AccordionGroup>

### Auth-Detailcodes-Schnellzuordnung

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                  | Bedeutung                                                                                                                                                                                      | Empfohlene Aktion                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Der Client hat ein erforderliches gemeinsames Token nicht gesendet.                                                                                                                                                 | Fügen Sie das Token im Client ein bzw. legen Sie es dort fest und versuchen Sie es erneut. Für Dashboard-Pfade: `openclaw config get gateway.auth.token`, dann in die Control UI-Einstellungen einfügen.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Das gemeinsame Token stimmte nicht mit dem Gateway-Auth-Token überein.                                                                                                                                               | Wenn `canRetryWithDeviceToken=true`, erlauben Sie einen vertrauenswürdigen Wiederholungsversuch. Wiederholungsversuche mit zwischengespeichertem Token verwenden gespeicherte genehmigte Scopes erneut; explizite Aufrufer mit `deviceToken` / `scopes` behalten die angeforderten Scopes. Wenn der Fehler weiterhin auftritt, führen Sie die [Prüfliste zur Wiederherstellung bei Token-Drift](/de/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Das zwischengespeicherte gerätespezifische Token ist veraltet oder wurde widerrufen.                                                                                                                                                 | Rotieren bzw. genehmigen Sie das Device-Token mit der [Devices-CLI](/de/cli/devices) erneut und verbinden Sie sich dann neu.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Die Geräteidentität muss genehmigt werden. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade`, und verwenden Sie `requestId` / `remediationHint`, wenn vorhanden. | Genehmigen Sie die ausstehende Anfrage: `openclaw devices list`, dann `openclaw devices approve <requestId>`. Scope-/Rollen-Upgrades verwenden denselben Ablauf, nachdem Sie den angeforderten Zugriff geprüft haben.                                                                                                               |

<Note>
Direkte loopback-Backend-RPCs, die mit dem gemeinsamen Gateway-Token/Passwort authentifiziert sind, sollten nicht von der Scope-Basislinie der gekoppelten Geräte der CLI abhängen. Wenn Subagents oder andere interne Aufrufe weiterhin mit `scope-upgrade` fehlschlagen, prüfen Sie, ob der Aufrufer `client.id: "gateway-client"` und `client.mode: "backend"` verwendet und keine explizite `deviceIdentity` bzw. kein Device-Token erzwingt.
</Note>

Migrationsprüfung für Device Auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler anzeigen, aktualisieren Sie den verbindenden Client und überprüfen Sie ihn:

<Steps>
  <Step title="Auf connect.challenge warten">
    Der Client wartet auf das vom Gateway ausgegebene `connect.challenge`.
  </Step>
  <Step title="Payload signieren">
    Der Client signiert die an die Challenge gebundene Payload.
  </Step>
  <Step title="Device-Nonce senden">
    Der Client sendet `connect.params.device.nonce` mit derselben Challenge-Nonce.
  </Step>
</Steps>

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet abgelehnt wird:

- Sitzungen mit Token eines gekoppelten Geräts können nur **ihr eigenes** Gerät verwalten, sofern der Aufrufer nicht zusätzlich `operator.admin` besitzt
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern, die die Aufrufersitzung bereits besitzt

Verwandt:

- [Konfiguration](/de/gateway/configuration) (Gateway-Auth-Modi)
- [Control UI](/de/web/control-ui)
- [Geräte](/de/cli/devices)
- [Remote-Zugriff](/de/gateway/remote)
- [Vertrauenswürdige Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth)

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
- Abweichung in der Dienstkonfiguration (`Config (cli)` vs. `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche launchd-/systemd-/schtasks-Installationen, wenn `--deep` verwendet wird.
- Bereinigungshinweise zu `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → der lokale Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde überschrieben und hat `gateway.mode` verloren. Behebung: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration, oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete Local-Mode-Konfiguration neu zu schreiben. Wenn Sie OpenClaw über Podman ausführen, ist der Standardkonfigurationspfad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → Nicht-loopback-Bind ohne gültigen Gateway-Auth-Pfad (Token/Passwort oder trusted-proxy, sofern konfiguriert).
    - `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
    - `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Einheiten sind vorhanden. Die meisten Setups sollten ein Gateway pro Maschine behalten; wenn Sie mehr als eines benötigen, isolieren Sie Ports + Konfiguration/Status/Arbeitsbereich. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` von doctor → eine systemd-Systemeinheit ist vorhanden, während der Dienst auf Benutzerebene fehlt. Entfernen oder deaktivieren Sie das Duplikat, bevor Sie doctor erlauben, einen Benutzerdienst zu installieren, oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn die Systemeinheit der beabsichtigte Supervisor ist.
    - `Gateway service port does not match current gateway config` → der installierte Supervisor fixiert weiterhin den alten `--port`. Führen Sie `openclaw doctor --fix` oder `openclaw gateway install --force` aus, und starten Sie dann den Gateway-Dienst neu.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Hintergrundausführung und Prozess-Tool](/de/gateway/background-process)
- [Konfiguration](/de/gateway/configuration)
- [Doctor](/de/gateway/doctor)

## Gateway hat die letzte bekannte gute Konfiguration wiederhergestellt

Verwenden Sie dies, wenn der Gateway startet, die Logs aber melden, dass `openclaw.json` wiederhergestellt wurde.

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
- Ein Systemereignis des Haupt-Agents, das mit `Config recovery warning` beginnt

<AccordionGroup>
  <Accordion title="Was passiert ist">
    - Die zurückgewiesene Konfiguration wurde beim Start oder Hot Reload nicht validiert.
    - OpenClaw hat die zurückgewiesene Payload als `.clobbered.*` aufbewahrt.
    - Die aktive Konfiguration wurde aus der zuletzt validierten letzten bekannten guten Kopie wiederhergestellt.
    - Der nächste Durchlauf des Haupt-Agents wird gewarnt, die zurückgewiesene Konfiguration nicht blind neu zu schreiben.
    - Wenn alle Validierungsprobleme unter `plugins.entries.<id>...` lagen, würde OpenClaw nicht die gesamte Datei wiederherstellen. Plugin-lokale Fehler bleiben deutlich sichtbar, während nicht betroffene Benutzereinstellungen in der aktiven Konfiguration bleiben.

  </Accordion>
  <Accordion title="Untersuchen und reparieren">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Häufige Signaturen">
    - `.clobbered.*` existiert → eine externe Direktbearbeitung oder ein Start-Lesevorgang wurde wiederhergestellt.
    - `.rejected.*` existiert → ein von OpenClaw gesteuerter Konfigurationsschreibvorgang hat vor dem Commit Schema- oder Clobber-Prüfungen nicht bestanden.
    - `Config write rejected:` → der Schreibvorgang hat versucht, erforderliche Struktur zu entfernen, die Datei stark zu verkleinern oder ungültige Konfiguration zu persistieren.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oder `size-drop-vs-last-good:*` → der Start hat die aktuelle Datei als überschrieben behandelt, weil sie im Vergleich zum letzten bekannten guten Backup Felder oder Größe verloren hat.
    - `Config last-known-good promotion skipped` → der Kandidat enthielt geschwärzte Secret-Platzhalter wie `***`.

  </Accordion>
  <Accordion title="Behebungsoptionen">
    1. Behalten Sie die wiederhergestellte aktive Konfiguration, wenn sie korrekt ist.
    2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*`, und wenden Sie sie dann mit `openclaw config set` oder `config.patch` an.
    3. Führen Sie `openclaw config validate` aus, bevor Sie neu starten.
    4. Wenn Sie von Hand bearbeiten, behalten Sie die vollständige JSON5-Konfiguration bei, nicht nur das Teilobjekt, das Sie ändern wollten.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Config](/de/cli/config)
- [Konfiguration: Hot Reload](/de/gateway/configuration#config-hot-reload)
- [Konfiguration: strikte Validierung](/de/gateway/configuration#strict-validation)
- [Doctor](/de/gateway/doctor)

## Gateway-Probe-Warnungen

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

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-Einrichtung ist fehlgeschlagen, aber der Befehl hat weiterhin direkte konfigurierte/loopback-Ziele versucht.
- `multiple reachable gateways detected` → mehr als ein Ziel hat geantwortet. Normalerweise bedeutet dies ein beabsichtigtes Multi-Gateway-Setup oder veraltete/duplizierte Listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → Verbindung hat funktioniert, aber die Detail-RPC ist Scope-beschränkt; koppeln Sie die Geräteidentität oder verwenden Sie Anmeldedaten mit `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → Verbindung hat funktioniert, aber der vollständige Diagnose-RPC-Satz ist abgelaufen oder fehlgeschlagen. Behandeln Sie dies als erreichbaren Gateway mit eingeschränkter Diagnose; vergleichen Sie `connect.ok` und `connect.rpcOk` in der `--json`-Ausgabe.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → der Gateway hat geantwortet, aber dieser Client benötigt vor normalem Operator-Zugriff weiterhin Kopplung/Genehmigung.
- nicht aufgelöster Warntext zu `gateway.auth.*` / `gateway.remote.*` SecretRef → Auth-Material war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [Gateway](/de/cli/gateway)
- [Mehrere Gateways auf demselben Host](/de/gateway#multiple-gateways-same-host)
- [Remote-Zugriff](/de/gateway/remote)

## Channel verbunden, Nachrichten fließen nicht

Wenn der Channel-Status verbunden ist, der Nachrichtenfluss aber ausfällt, konzentrieren Sie sich auf Richtlinien, Berechtigungen und channelspezifische Zustellregeln.

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
- Fehlende Channel-API-Berechtigungen/-Scopes.

Häufige Signaturen:

- `mention required` → Nachricht durch Richtlinie für Gruppenerwähnungen ignoriert.
- `pairing` / ausstehende Genehmigungs-Traces → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Kanal-Auth/Berechtigungen.

Verwandt:

- [Kanal-Fehlerbehebung](/de/channels/troubleshooting)
- [Discord](/de/channels/discord)
- [Telegram](/de/channels/telegram)
- [WhatsApp](/de/channels/whatsapp)

## Cron- und Heartbeat-Zustellung

Wenn Cron oder Heartbeat nicht ausgeführt oder nicht zugestellt wurde, prüfen Sie zuerst den Scheduler-Status und danach das Zustellungsziel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Achten Sie auf:

- Cron ist aktiviert und der nächste Wake ist vorhanden.
- Status der Job-Ausführungshistorie (`ok`, `skipped`, `error`).
- Heartbeat-Überspringgründe (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron deaktiviert.
    - `cron: timer tick failed` → Scheduler-Tick fehlgeschlagen; prüfen Sie Datei-/Log-/Runtime-Fehler.
    - `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des Fensters aktiver Stunden.
    - `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur leere Zeilen / Markdown-Überschriften, daher überspringt OpenClaw den Modellaufruf.
    - `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber keine der Aufgaben ist bei diesem Tick fällig.
    - `heartbeat: unknown accountId` → ungültige Konto-ID für das Heartbeat-Zustellungsziel.
    - `heartbeat skipped` mit `reason=dm-blocked` → Heartbeat-Ziel wurde zu einem DM-artigen Ziel aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder eine Agent-spezifische Überschreibung) auf `block` gesetzt ist.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
- [Geplante Aufgaben: Fehlerbehebung](/de/automation/cron-jobs#troubleshooting)

## Node gekoppelt, Tool schlägt fehl

Wenn ein Node gekoppelt ist, Tools aber fehlschlagen, isolieren Sie Vordergrund-, Berechtigungs- und Genehmigungsstatus.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf:

- Node online mit den erwarteten Fähigkeiten.
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

Verwenden Sie dies, wenn Aktionen des Browser-Tools fehlschlagen, obwohl das Gateway selbst fehlerfrei ist.

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
- Lokale Chrome-Verfügbarkeit für `existing-session`- / `user`-Profile.

<AccordionGroup>
  <Accordion title="Plugin- / Executable-Signaturen">
    - `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin ist durch `plugins.allow` ausgeschlossen.
    - Browser-Tool fehlt / nicht verfügbar, während `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
    - `Failed to start Chrome CDP on port` → Browser-Prozess konnte nicht gestartet werden.
    - `browser.executablePath not found` → konfigurierter Pfad ist ungültig.
    - `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
    - `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen ungültigen oder außerhalb des Bereichs liegenden Port.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → der aktuellen Gateway-Installation fehlt die `playwright-core`-Runtime-Abhängigkeit des gebündelten Browser-Plugins; führen Sie `openclaw doctor --fix` aus und starten Sie danach das Gateway neu. ARIA-Snapshots und einfache Seiten-Screenshots können weiterhin funktionieren, Navigation, KI-Snapshots, Element-Screenshots per CSS-Selektor und PDF-Export bleiben jedoch nicht verfügbar.

  </Accordion>
  <Accordion title="Chrome-MCP- / existing-session-Signaturen">
    - `Could not find DevToolsActivePort for chrome` → Chrome-MCP-existing-session konnte noch nicht an das ausgewählte Browser-Datenverzeichnis anhängen. Öffnen Sie die Browser-Inspect-Seite, aktivieren Sie Remote Debugging, lassen Sie den Browser geöffnet, genehmigen Sie die erste Attach-Aufforderung und versuchen Sie es erneut. Wenn kein angemeldeter Zustand erforderlich ist, bevorzugen Sie das verwaltete `openclaw`-Profil.
    - `No Chrome tabs found for profile="user"` → das Chrome-MCP-Attach-Profil hat keine geöffneten lokalen Chrome-Tabs.
    - `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
    - `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → Attach-only-Profil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber der CDP-WebSocket konnte trotzdem nicht geöffnet werden.

  </Accordion>
  <Accordion title="Element- / Screenshot- / Upload-Signaturen">
    - `fullPage is not supported for element screenshots` → Screenshot-Anfrage hat `--full-page` mit `--ref` oder `--element` kombiniert.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome-MCP- / `existing-session`-Screenshot-Aufrufe müssen Seitenerfassung oder eine Snapshot-`--ref` verwenden, nicht CSS-`--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome-MCP-Upload-Hooks benötigen Snapshot-Refs, keine CSS-Selektoren.
    - `existing-session file uploads currently support one file at a time.` → senden Sie bei Chrome-MCP-Profilen einen Upload pro Aufruf.
    - `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks bei Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
    - `existing-session type does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:type` bei `profile="user"`- / Chrome-MCP-existing-session-Profilen weg, oder verwenden Sie ein verwaltetes/CDP-Browser-Profil, wenn ein benutzerdefinierter Timeout erforderlich ist.
    - `existing-session evaluate does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:evaluate` bei `profile="user"`- / Chrome-MCP-existing-session-Profilen weg, oder verwenden Sie ein verwaltetes/CDP-Browser-Profil, wenn ein benutzerdefinierter Timeout erforderlich ist.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.
    - veraltete Viewport- / Dark-Mode- / Locale- / Offline-Überschreibungen bei Attach-only- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuersitzung zu schließen und den Playwright-/CDP-Emulationsstatus freizugeben, ohne das gesamte Gateway neu zu starten.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Browser (von OpenClaw verwaltet)](/de/tools/browser)
- [Browser-Fehlerbehebung](/de/tools/browser-linux-troubleshooting)

## Wenn Sie aktualisiert haben und plötzlich etwas nicht mehr funktioniert

Die meisten Fehler nach einem Upgrade sind Config-Drift oder strengere Defaults, die jetzt durchgesetzt werden.

<AccordionGroup>
  <Accordion title="1. Auth- und URL-Override-Verhalten geändert">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Was zu prüfen ist:

    - Wenn `gateway.mode=remote`, zielen CLI-Aufrufe möglicherweise auf Remote, während Ihr lokaler Dienst in Ordnung ist.
    - Explizite `--url`-Aufrufe fallen nicht auf gespeicherte Anmeldedaten zurück.

    Häufige Signaturen:

    - `gateway connect failed:` → falsches URL-Ziel.
    - `unauthorized` → Endpunkt erreichbar, aber falsche Auth.

  </Accordion>
  <Accordion title="2. Bind- und Auth-Leitplanken sind strenger">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Was zu prüfen ist:

    - Nicht-loopback-Binds (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Auth-Pfad: Shared-Token-/Passwort-Auth oder eine korrekt konfigurierte Nicht-loopback-`trusted-proxy`-Bereitstellung.
    - Alte Keys wie `gateway.token` ersetzen `gateway.auth.token` nicht.

    Häufige Signaturen:

    - `refusing to bind gateway ... without auth` → Nicht-loopback-Bind ohne gültigen Gateway-Auth-Pfad.
    - `Connectivity probe: failed`, während die Runtime läuft → Gateway ist aktiv, aber mit aktueller Auth/URL nicht erreichbar.

  </Accordion>
  <Accordion title="3. Koppelungs- und Geräteidentitätsstatus geändert">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Was zu prüfen ist:

    - Ausstehende Gerätegenehmigungen für Dashboard/Nodes.
    - Ausstehende DM-Koppelungsgenehmigungen nach Richtlinien- oder Identitätsänderungen.

    Häufige Signaturen:

    - `device identity required` → Geräte-Auth nicht erfüllt.
    - `pairing required` → Absender/Gerät muss genehmigt werden.

  </Accordion>
</AccordionGroup>

Wenn Dienstkonfiguration und Runtime nach den Prüfungen weiterhin nicht übereinstimmen, installieren Sie die Dienstmetadaten aus demselben Profil-/Statusverzeichnis neu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [Authentifizierung](/de/gateway/authentication)
- [Hintergrund-Exec und Prozess-Tool](/de/gateway/background-process)
- [Gateway-eigene Koppelung](/de/gateway/pairing)

## Verwandt

- [Doctor](/de/gateway/doctor)
- [FAQ](/de/help/faq)
- [Gateway-Runbook](/de/gateway)
