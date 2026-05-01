---
read_when:
    - Der Hub zur Fehlerbehebung hat Sie für eine tiefergehende Diagnose hierher verwiesen
    - Sie benötigen stabile symptombasierte Runbook-Abschnitte mit exakten Befehlen
sidebarTitle: Troubleshooting
summary: Umfassendes Runbook zur Fehlerbehebung für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-05-01T06:42:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: a808dcfd8527b041f629cff24308550f961e9eeb4d7d4ce6f1ce84dff6bbef89
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

- `openclaw gateway status` zeigt `Runtime: running`, `Connectivity probe: ok` und eine Zeile `Capability: ...`.
- `openclaw doctor` meldet keine blockierenden Konfigurations- oder Dienstprobleme.
- `openclaw channels status --probe` zeigt den Live-Transportstatus pro Konto und, sofern unterstützt, Prüf-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Split-Brain-Installationen und Schutz für neuere Konfigurationen

Verwenden Sie dies, wenn ein Gateway-Dienst nach einem Update unerwartet stoppt oder Logs zeigen, dass eine `openclaw`-Binärdatei älter ist als die Version, die zuletzt `openclaw.json` geschrieben hat.

OpenClaw versieht Konfigurationsschreibvorgänge mit `meta.lastTouchedVersion`. Nur-Lese-Befehle können weiterhin eine Konfiguration prüfen, die von einem neueren OpenClaw geschrieben wurde, aber Prozess- und Dienständerungen verweigern die Fortsetzung mit einer älteren Binärdatei. Blockierte Aktionen umfassen Start, Stopp, Neustart, Deinstallation des Gateway-Dienstes, erzwungene Neuinstallation des Dienstes, Gateway-Start im Dienstmodus und `gateway --force`-Portbereinigung.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="Fix PATH">
    Korrigieren Sie `PATH`, sodass `openclaw` auf die neuere Installation zeigt, und führen Sie die Aktion dann erneut aus.
  </Step>
  <Step title="Reinstall the gateway service">
    Installieren Sie den vorgesehenen Gateway-Dienst aus der neueren Installation neu:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Remove stale wrappers">
    Entfernen Sie veraltete Systempaket- oder alte Wrapper-Einträge, die weiterhin auf eine alte `openclaw`-Binärdatei zeigen.
  </Step>
</Steps>

<Warning>
Nur für absichtliches Downgrade oder Notfallwiederherstellung: Setzen Sie `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` für den einzelnen Befehl. Lassen Sie es im Normalbetrieb ungesetzt.
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
- Die aktuellen Anthropic-Anmeldedaten sind nicht für die Nutzung mit langem Kontext berechtigt.
- Anfragen schlagen nur bei langen Sitzungen/Modellläufen fehl, die den 1M-Beta-Pfad benötigen.

Behebungsoptionen:

<Steps>
  <Step title="Disable context1m">
    Deaktivieren Sie `context1m` für dieses Modell, um auf das normale Kontextfenster zurückzufallen.
  </Step>
  <Step title="Use an eligible credential">
    Verwenden Sie Anthropic-Anmeldedaten, die für Anfragen mit langem Kontext berechtigt sind, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
  </Step>
  <Step title="Configure fallback models">
    Konfigurieren Sie Fallback-Modelle, damit Läufe fortgesetzt werden, wenn Anthropic-Anfragen mit langem Kontext abgelehnt werden.
  </Step>
</Steps>

Verwandt:

- [Anthropic](/de/providers/anthropic)
- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Warum sehe ich HTTP 429 von Anthropic?](/de/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokales OpenAI-kompatibles Backend besteht direkte Prüfungen, aber Agent-Läufe schlagen fehl

Verwenden Sie dies, wenn:

- `curl ... /v1/models` funktioniert
- sehr kleine direkte `/v1/chat/completions`-Aufrufe funktionieren
- OpenClaw-Modellläufe nur bei normalen Agent-Turns fehlschlagen

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Achten Sie auf:

- direkte sehr kleine Aufrufe sind erfolgreich, aber OpenClaw-Läufe schlagen nur bei größeren Prompts fehl
- `model_not_found`- oder 404-Fehler, obwohl direkte `/v1/chat/completions`
  mit derselben reinen Modell-ID funktionieren
- Backend-Fehler dazu, dass `messages[].content` eine Zeichenfolge erwartet
- zeitweilige Warnungen `incomplete turn detected ... stopReason=stop payloads=0` mit einem OpenAI-kompatiblen lokalen Backend
- Backend-Abstürze, die nur bei größeren Prompt-Token-Zahlen oder vollständigen Agent-Runtime-Prompts auftreten

<AccordionGroup>
  <Accordion title="Common signatures">
    - `model_not_found` mit einem lokalen MLX/vLLM-ähnlichen Server → prüfen Sie, ob `baseUrl` `/v1` enthält, `api` für `/v1/chat/completions`-Backends `"openai-completions"` ist und `models.providers.<provider>.models[].id` die reine Provider-lokale ID ist. Wählen Sie sie einmal mit dem Provider-Präfix aus, zum Beispiel `mlx/mlx-community/Qwen3-30B-A3B-6bit`; behalten Sie den Katalogeintrag als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → das Backend lehnt strukturierte Chat-Completions-Inhaltsteile ab. Behebung: Setzen Sie `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → das Backend hat die Chat-Completions-Anfrage abgeschlossen, aber für diesen Turn keinen für Benutzer sichtbaren Assistant-Text zurückgegeben. OpenClaw wiederholt replay-sichere leere OpenAI-kompatible Turns einmal; anhaltende Fehler bedeuten meist, dass das Backend leere/Nicht-Text-Inhalte ausgibt oder finalen Antworttext unterdrückt.
    - direkte sehr kleine Anfragen sind erfolgreich, aber OpenClaw-Agent-Läufe schlagen mit Backend-/Modellabstürzen fehl (zum Beispiel Gemma auf manchen `inferrs`-Builds) → der OpenClaw-Transport ist wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Prompt-Form der Agent-Runtime.
    - Fehler werden nach dem Deaktivieren von Tools seltener, verschwinden aber nicht → Tool-Schemas waren Teil des Drucks, aber das verbleibende Problem ist weiterhin die Kapazität des Upstream-Modells/-Servers oder ein Backend-Fehler.

  </Accordion>
  <Accordion title="Fix options">
    1. Setzen Sie `compat.requiresStringContent: true` für Chat-Completions-Backends, die nur Zeichenfolgen unterstützen.
    2. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die die Tool-Schema-Oberfläche von OpenClaw nicht zuverlässig verarbeiten können.
    3. Reduzieren Sie den Prompt-Druck, wo möglich: kleinerer Workspace-Bootstrap, kürzerer Sitzungsverlauf, leichteres lokales Modell oder ein Backend mit stärkerer Langkontextunterstützung.
    4. Wenn sehr kleine direkte Anfragen weiterhin erfolgreich sind, während OpenClaw-Agent-Turns im Backend weiterhin abstürzen, behandeln Sie es als Upstream-Server-/Modellbeschränkung und melden Sie dort eine Reproduktion mit der akzeptierten Payload-Form.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Konfiguration](/de/gateway/configuration)
- [Lokale Modelle](/de/gateway/local-models)
- [OpenAI-kompatible Endpunkte](/de/gateway/configuration-reference#openai-compatible-endpoints)

## Keine Antworten

Wenn Kanäle aktiv sind, aber nichts antwortet, prüfen Sie Routing und Richtlinie, bevor Sie etwas neu verbinden.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Achten Sie auf:

- Pairing ausstehend für DM-Absender.
- Erwähnungs-Gating in Gruppen (`requireMention`, `mentionPatterns`).
- Abweichungen in der Allowlist für Kanal/Gruppe.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird bis zur Erwähnung ignoriert.
- `pairing request` → Absender benötigt Genehmigung.
- `blocked` / `allowlist` → Absender/Kanal wurde durch Richtlinie gefiltert.

Verwandt:

- [Kanal-Fehlerbehebung](/de/channels/troubleshooting)
- [Gruppen](/de/channels/groups)
- [Pairing](/de/channels/pairing)

## Konnektivität der Dashboard-Control-UI

Wenn Dashboard/Control-UI keine Verbindung herstellt, validieren Sie URL, Authentifizierungsmodus und Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf:

- Korrekte Prüf-URL und Dashboard-URL.
- Abweichung zwischen Authentifizierungsmodus/Token von Client und Gateway.
- HTTP-Nutzung, wenn Geräteidentität erforderlich ist.

<AccordionGroup>
  <Accordion title="Connect / auth signatures">
    - `device identity required` → nicht sicherer Kontext oder fehlende Geräteauthentifizierung.
    - `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins` enthalten (oder Sie verbinden sich von einem Browser-Ursprung ohne loopback ohne explizite Allowlist).
    - `device nonce required` / `device nonce mismatch` → Client schließt den Challenge-basierten Geräteauthentifizierungsablauf (`connect.challenge` + `device.nonce`) nicht ab.
    - `device signature invalid` / `device signature expired` → Client hat die falsche Payload (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
    - `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Client kann einen vertrauenswürdigen Wiederholungsversuch mit zwischengespeichertem Geräte-Token ausführen.
    - Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet den zwischengespeicherten Scope-Satz erneut, der mit dem gekoppelten Geräte-Token gespeichert ist. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihren angeforderten Scope-Satz.
    - Außerhalb dieses Wiederholungspfads lautet die Vorrangfolge der Connect-Authentifizierung: zuerst expliziter gemeinsamer Token/Passwort, dann expliziter `deviceToken`, dann gespeicherter Geräte-Token, dann Bootstrap-Token.
    - Auf dem asynchronen Pfad der Tailscale Serve Control UI werden fehlgeschlagene Versuche für dasselbe `{scope, ip}` serialisiert, bevor der Limiter den Fehler erfasst. Zwei fehlerhafte gleichzeitige Wiederholungsversuche desselben Clients können daher beim zweiten Versuch `retry later` statt zweier einfacher Abweichungen ausgeben.
    - `too many failed authentication attempts (retry later)` von einem Browser-Ursprung mit loopback-Client → wiederholte Fehler von demselben normalisierten `Origin` werden vorübergehend gesperrt; ein anderer localhost-Ursprung verwendet einen separaten Bucket.
    - wiederholt `unauthorized` nach diesem Wiederholungsversuch → gemeinsamer Token/Geräte-Token ist abgewichen; aktualisieren Sie die Token-Konfiguration und genehmigen/rotieren Sie den Geräte-Token bei Bedarf erneut.
    - `gateway connect failed:` → falsches Host-/Port-/URL-Ziel.

  </Accordion>
</AccordionGroup>

### Schnellübersicht der Auth-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                  | Bedeutung                                                                                                                                                                                      | Empfohlene Maßnahme                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Der Client hat kein erforderliches gemeinsames Token gesendet.                                                                                                                                                 | Fügen Sie das Token im Client ein bzw. legen Sie es fest und versuchen Sie es erneut. Für Dashboard-Pfade: `openclaw config get gateway.auth.token`, dann in die Einstellungen der Control UI einfügen.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Das gemeinsame Token stimmte nicht mit dem Gateway-Authentifizierungstoken überein.                                                                                                                                               | Wenn `canRetryWithDeviceToken=true` ist, erlauben Sie einen vertrauenswürdigen Wiederholungsversuch. Wiederholungsversuche mit zwischengespeichertem Token verwenden gespeicherte genehmigte Scopes wieder; explizite Aufrufer mit `deviceToken` / `scopes` behalten die angeforderten Scopes. Wenn es weiterhin fehlschlägt, führen Sie die [Checkliste zur Behebung von Token-Drift](/de/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Das zwischengespeicherte gerätespezifische Token ist veraltet oder wurde widerrufen.                                                                                                                                                 | Rotieren bzw. genehmigen Sie das Geräte-Token mit der [Geräte-CLI](/de/cli/devices) erneut und verbinden Sie sich dann neu.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Die Geräteidentität muss genehmigt werden. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade` und verwenden Sie `requestId` / `remediationHint`, wenn vorhanden. | Genehmigen Sie die ausstehende Anfrage: `openclaw devices list` und dann `openclaw devices approve <requestId>`. Scope-/Rollen-Upgrades verwenden denselben Ablauf, nachdem Sie den angeforderten Zugriff geprüft haben.                                                                                                               |

<Note>
Direkte Loopback-Backend-RPCs, die mit dem gemeinsamen Gateway-Token/Passwort authentifiziert werden, sollten nicht von der Scope-Baseline der gekoppelten Geräte der CLI abhängen. Wenn Subagents oder andere interne Aufrufe weiterhin mit `scope-upgrade` fehlschlagen, prüfen Sie, ob der Aufrufer `client.id: "gateway-client"` und `client.mode: "backend"` verwendet und keine explizite `deviceIdentity` oder kein Geräte-Token erzwingt.
</Note>

Migrationsprüfung für Geräteauthentifizierung v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler anzeigen, aktualisieren Sie den verbindenden Client und überprüfen Sie ihn:

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

- Token-Sitzungen gekoppelter Geräte können nur **ihr eigenes** Gerät verwalten, sofern der Aufrufer nicht zusätzlich `operator.admin` hat
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern, die die Aufrufersitzung bereits besitzt

Verwandt:

- [Konfiguration](/de/gateway/configuration) (Gateway-Authentifizierungsmodi)
- [Control UI](/de/web/control-ui)
- [Geräte](/de/cli/devices)
- [Remote-Zugriff](/de/gateway/remote)
- [Trusted-Proxy-Authentifizierung](/de/gateway/trusted-proxy-auth)

## Gateway-Dienst läuft nicht

Verwenden Sie dies, wenn der Dienst installiert ist, der Prozess aber nicht aktiv bleibt.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # auch Dienste auf Systemebene scannen
```

Achten Sie auf:

- `Runtime: stopped` mit Exit-Hinweisen.
- Abweichende Dienstkonfiguration (`Config (cli)` vs. `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche launchd-/systemd-/schtasks-Installationen, wenn `--deep` verwendet wird.
- Bereinigungshinweise zu `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → der lokale Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde überschrieben und hat `gateway.mode` verloren. Korrektur: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete lokale Moduskonfiguration neu zu schreiben. Wenn Sie OpenClaw über Podman ausführen, ist der Standardkonfigurationspfad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → Nicht-Loopback-Bind ohne gültigen Gateway-Authentifizierungspfad (Token/Passwort oder trusted-proxy, sofern konfiguriert).
    - `another gateway instance is already listening` / `EADDRINUSE` → Port-Konflikt.
    - `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Units vorhanden. Die meisten Setups sollten ein Gateway pro Maschine beibehalten; wenn Sie mehr als eines benötigen, isolieren Sie Ports + Konfiguration/Zustand/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` von doctor → eine systemd-System-Unit ist vorhanden, während der Dienst auf Benutzerebene fehlt. Entfernen oder deaktivieren Sie das Duplikat, bevor Sie doctor erlauben, einen Benutzerdienst zu installieren, oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn die System-Unit der beabsichtigte Supervisor ist.
    - `Gateway service port does not match current gateway config` → der installierte Supervisor setzt weiterhin den alten `--port` fest. Führen Sie `openclaw doctor --fix` oder `openclaw gateway install --force` aus und starten Sie anschließend den Gateway-Dienst neu.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Hintergrundausführung und Prozesstool](/de/gateway/background-process)
- [Konfiguration](/de/gateway/configuration)
- [Doctor](/de/gateway/doctor)

## Gateway hat die letzte als gut bekannte Konfiguration wiederhergestellt

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
- Eine Datei mit Zeitstempel `openclaw.json.clobbered.*` neben der aktiven Konfiguration
- Ein Main-Agent-Systemereignis, das mit `Config recovery warning` beginnt

<AccordionGroup>
  <Accordion title="Was passiert ist">
    - Die abgelehnte Konfiguration wurde beim Start oder Hot Reload nicht erfolgreich validiert.
    - OpenClaw hat die abgelehnte Payload als `.clobbered.*` erhalten.
    - Die aktive Konfiguration wurde aus der letzten validierten last-known-good-Kopie wiederhergestellt.
    - Die nächste Main-Agent-Runde wird gewarnt, die abgelehnte Konfiguration nicht blind neu zu schreiben.
    - Wenn alle Validierungsprobleme unter `plugins.entries.<id>...` lagen, würde OpenClaw nicht die gesamte Datei wiederherstellen. Plugin-lokale Fehler bleiben sichtbar, während unabhängige Benutzereinstellungen in der aktiven Konfiguration verbleiben.

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
    - `.clobbered.*` existiert → eine externe Direktbearbeitung oder ein Startlesevorgang wurde wiederhergestellt.
    - `.rejected.*` existiert → ein von OpenClaw verwalteter Konfigurationsschreibvorgang ist vor dem Commit an Schema- oder Clobber-Prüfungen gescheitert.
    - `Config write rejected:` → der Schreibvorgang versuchte, die erforderliche Struktur zu entfernen, die Datei stark zu verkleinern oder eine ungültige Konfiguration zu persistieren.
    - `Rejected validation details:` → das Wiederherstellungslog oder der Main-Agent-Hinweis enthält den Schemapfad, der die Wiederherstellung ausgelöst hat, z. B. `agents.defaults.execution` oder `gateway.auth.password.source`.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oder `size-drop-vs-last-good:*` → beim Start wurde die aktuelle Datei als überschrieben behandelt, weil sie im Vergleich zur last-known-good-Sicherung Felder oder Größe verloren hat.
    - `Config last-known-good promotion skipped` → der Kandidat enthielt geschwärzte Secret-Platzhalter wie `***`.

  </Accordion>
  <Accordion title="Korrekturoptionen">
    1. Behalten Sie die wiederhergestellte aktive Konfiguration bei, wenn sie korrekt ist.
    2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*` und wenden Sie sie dann mit `openclaw config set` oder `config.patch` an.
    3. Führen Sie `openclaw config validate` aus, bevor Sie neu starten.
    4. Wenn Sie manuell bearbeiten, behalten Sie die vollständige JSON5-Konfiguration bei, nicht nur das Teilobjekt, das Sie ändern wollten.
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
- Ob die Warnung SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Auth-Refs betrifft.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-Einrichtung ist fehlgeschlagen, aber der Befehl hat trotzdem direkte konfigurierte/Loopback-Ziele versucht.
- `multiple reachable gateways detected` → mehr als ein Ziel hat geantwortet. Normalerweise bedeutet dies ein absichtliches Multi-Gateway-Setup oder veraltete/duplizierte Listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → Verbindung hat funktioniert, aber die Detail-RPC ist durch Scopes eingeschränkt; koppeln Sie die Geräteidentität oder verwenden Sie Anmeldedaten mit `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → Verbindung hat funktioniert, aber der vollständige Satz diagnostischer RPCs ist abgelaufen oder fehlgeschlagen. Behandeln Sie dies als erreichbares Gateway mit eingeschränkter Diagnose; vergleichen Sie `connect.ok` und `connect.rpcOk` in der `--json`-Ausgabe.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → das Gateway hat geantwortet, aber dieser Client benötigt vor normalem Operator-Zugriff noch Pairing/Genehmigung.
- nicht aufgelöster Warntext zu `gateway.auth.*` / `gateway.remote.*` SecretRef → Authentifizierungsmaterial war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [Gateway](/de/cli/gateway)
- [Mehrere Gateways auf demselben Host](/de/gateway#multiple-gateways-same-host)
- [Remote-Zugriff](/de/gateway/remote)

## Kanal verbunden, Nachrichten fließen nicht

Wenn der Kanalstatus verbunden ist, der Nachrichtenfluss aber unterbrochen ist, konzentrieren Sie sich auf Richtlinien, Berechtigungen und kanalspezifische Zustellregeln.

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
- Fehlende Kanal-API-Berechtigungen/-Scopes.

Typische Signaturen:

- `mention required` → Nachricht durch die Gruppenerwähnungsrichtlinie ignoriert.
- `pairing` / Ablaufverfolgungen für ausstehende Genehmigung → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Kanalauthentifizierung/-berechtigungen.

Verwandt:

- [Kanal-Fehlerbehebung](/de/channels/troubleshooting)
- [Discord](/de/channels/discord)
- [Telegram](/de/channels/telegram)
- [WhatsApp](/de/channels/whatsapp)

## Cron- und Heartbeat-Zustellung

Wenn Cron oder Heartbeat nicht ausgeführt oder nicht zugestellt wurde, prüfen Sie zuerst den Scheduler-Zustand und danach das Zustellungsziel.

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
- Heartbeat-Überspringgründe (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron deaktiviert.
    - `cron: timer tick failed` → Scheduler-Tick fehlgeschlagen; prüfen Sie Datei-/Log-/Laufzeitfehler.
    - `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des aktiven Zeitfensters.
    - `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur Leerzeilen / Markdown-Überschriften, daher überspringt OpenClaw den Modellaufruf.
    - `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber keine der Aufgaben ist bei diesem Tick fällig.
    - `heartbeat: unknown accountId` → ungültige Konto-ID für das Heartbeat-Zustellungsziel.
    - `heartbeat skipped` mit `reason=dm-blocked` → Heartbeat-Ziel wurde zu einem DM-ähnlichen Ziel aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder eine Agent-spezifische Überschreibung) auf `block` gesetzt ist.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
- [Geplante Aufgaben: Fehlerbehebung](/de/automation/cron-jobs#troubleshooting)

## Node gekoppelt, Tool schlägt fehl

Wenn ein Node gekoppelt ist, Tools aber fehlschlagen, isolieren Sie Vordergrund-, Berechtigungs- und Genehmigungszustand.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf:

- Node online mit erwarteten Funktionen.
- Betriebssystemberechtigungen für Kamera/Mikrofon/Standort/Bildschirm.
- Exec-Genehmigungen und Allowlist-Zustand.

Typische Signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-App muss im Vordergrund sein.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → fehlende Betriebssystemberechtigung.
- `SYSTEM_RUN_DENIED: approval required` → Exec-Genehmigung ausstehend.
- `SYSTEM_RUN_DENIED: allowlist miss` → Befehl durch Allowlist blockiert.

Verwandt:

- [Exec-Genehmigungen](/de/tools/exec-approvals)
- [Node-Fehlerbehebung](/de/nodes/troubleshooting)
- [Nodes](/de/nodes/index)

## Browser-Tool schlägt fehl

Verwenden Sie dies, wenn Browser-Tool-Aktionen fehlschlagen, obwohl der Gateway selbst fehlerfrei ist.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Achten Sie auf:

- Ob `plugins.allow` gesetzt ist und `browser` enthält.
- Gültigen Pfad zur Browser-Programmdatei.
- Erreichbarkeit des CDP-Profils.
- Lokale Chrome-Verfügbarkeit für `existing-session`- / `user`-Profile.

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin wird durch `plugins.allow` ausgeschlossen.
    - Browser-Tool fehlt / nicht verfügbar, während `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
    - `Failed to start Chrome CDP on port` → Browser-Prozess konnte nicht gestartet werden.
    - `browser.executablePath not found` → konfigurierter Pfad ist ungültig.
    - `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
    - `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen ungültigen oder außerhalb des Bereichs liegenden Port.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → der aktuellen Gateway-Installation fehlt die gebündelte `playwright-core`-Laufzeitabhängigkeit des Browser-Plugins; führen Sie `openclaw doctor --fix` aus und starten Sie anschließend den Gateway neu. ARIA-Snapshots und einfache Seiten-Screenshots können weiterhin funktionieren, aber Navigation, KI-Snapshots, Element-Screenshots per CSS-Selektor und PDF-Export bleiben nicht verfügbar.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP `existing-session` konnte noch nicht an das ausgewählte Browser-Datenverzeichnis anhängen. Öffnen Sie die Browser-Inspektionsseite, aktivieren Sie Remote-Debugging, lassen Sie den Browser geöffnet, genehmigen Sie die erste Anhängeaufforderung und versuchen Sie es erneut. Wenn kein angemeldeter Zustand erforderlich ist, bevorzugen Sie das verwaltete `openclaw`-Profil.
    - `No Chrome tabs found for profile="user"` → das Chrome-MCP-Anhängeprofil hat keine geöffneten lokalen Chrome-Tabs.
    - `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
    - `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → reines Anhängeprofil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber der CDP-WebSocket konnte weiterhin nicht geöffnet werden.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → Screenshot-Anforderung hat `--full-page` mit `--ref` oder `--element` kombiniert.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Screenshot-Aufrufe für Chrome MCP / `existing-session` müssen Seitenerfassung oder ein Snapshot-`--ref` verwenden, nicht CSS-`--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome-MCP-Upload-Hooks benötigen Snapshot-Refs, keine CSS-Selektoren.
    - `existing-session file uploads currently support one file at a time.` → senden Sie bei Chrome-MCP-Profilen einen Upload pro Aufruf.
    - `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks in Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
    - `existing-session type does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:type` bei `profile="user"` / Chrome-MCP-`existing-session`-Profilen weg, oder verwenden Sie ein verwaltetes/CDP-Browserprofil, wenn ein benutzerdefinierter Timeout erforderlich ist.
    - `existing-session evaluate does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:evaluate` bei `profile="user"` / Chrome-MCP-`existing-session`-Profilen weg, oder verwenden Sie ein verwaltetes/CDP-Browserprofil, wenn ein benutzerdefinierter Timeout erforderlich ist.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.
    - veraltete Viewport-/Dark-Mode-/Locale-/Offline-Überschreibungen bei reinen Anhänge- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuerungssitzung zu schließen und den Playwright-/CDP-Emulationszustand freizugeben, ohne den gesamten Gateway neu zu starten.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Browser (von OpenClaw verwaltet)](/de/tools/browser)
- [Browser-Fehlerbehebung](/de/tools/browser-linux-troubleshooting)

## Wenn Sie ein Upgrade durchgeführt haben und plötzlich etwas nicht mehr funktioniert

Die meisten Störungen nach einem Upgrade entstehen durch Konfigurationsdrift oder dadurch, dass strengere Standardwerte jetzt durchgesetzt werden.

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Was zu prüfen ist:

    - Wenn `gateway.mode=remote`, können CLI-Aufrufe auf Remote zielen, während Ihr lokaler Dienst fehlerfrei ist.
    - Explizite `--url`-Aufrufe fallen nicht auf gespeicherte Anmeldedaten zurück.

    Typische Signaturen:

    - `gateway connect failed:` → falsches URL-Ziel.
    - `unauthorized` → Endpunkt erreichbar, aber falsche Authentifizierung.

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Was zu prüfen ist:

    - Nicht-Loopback-Binds (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Authentifizierungspfad: Shared-Token-/Passwortauthentifizierung oder eine korrekt konfigurierte Nicht-Loopback-`trusted-proxy`-Bereitstellung.
    - Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

    Typische Signaturen:

    - `refusing to bind gateway ... without auth` → Nicht-Loopback-Bind ohne gültigen Gateway-Authentifizierungspfad.
    - `Connectivity probe: failed`, während die Laufzeit läuft → Gateway aktiv, aber mit aktueller Authentifizierung/URL nicht erreichbar.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Was zu prüfen ist:

    - Ausstehende Gerätegenehmigungen für Dashboard/Nodes.
    - Ausstehende DM-Kopplungsgenehmigungen nach Richtlinien- oder Identitätsänderungen.

    Typische Signaturen:

    - `device identity required` → Geräteauthentifizierung nicht erfüllt.
    - `pairing required` → Absender/Gerät muss genehmigt werden.

  </Accordion>
</AccordionGroup>

Wenn Dienstkonfiguration und Laufzeit nach den Prüfungen weiterhin voneinander abweichen, installieren Sie die Dienstmetadaten aus demselben Profil-/Zustandsverzeichnis neu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [Authentifizierung](/de/gateway/authentication)
- [Hintergrund-Exec und Prozesstool](/de/gateway/background-process)
- [Gateway-eigene Kopplung](/de/gateway/pairing)

## Verwandt

- [Doctor](/de/gateway/doctor)
- [FAQ](/de/help/faq)
- [Gateway-Runbook](/de/gateway)
