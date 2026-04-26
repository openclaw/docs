---
read_when:
    - Der Hub zur Fehlerbehebung hat Sie für eine tiefere Diagnose hierher weitergeleitet.
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen.
sidebarTitle: Troubleshooting
summary: Ausführliches Fehlerbehebungs-Runbook für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-04-26T11:31:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc6b2a0e8522a761dcee0a3b9bc024eefbd7a5ab4118fc090401868a571bcf
    source_path: gateway/troubleshooting.md
    workflow: 15
---

Diese Seite ist das ausführliche Runbook. Beginnen Sie bei [/help/troubleshooting](/de/help/troubleshooting), wenn Sie zuerst den schnellen Triage-Ablauf möchten.

## Befehlsleiter

Führen Sie diese Befehle zuerst in dieser Reihenfolge aus:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Erwartete gesunde Signale:

- `openclaw gateway status` zeigt `Runtime: running`, `Connectivity probe: ok` und eine Zeile `Capability: ...`.
- `openclaw doctor` meldet keine blockierenden Konfigurations-/Dienstprobleme.
- `openclaw channels status --probe` zeigt den Live-Transportstatus pro Konto und, wo unterstützt, Sondierungs-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Split-Brain-Installationen und Schutz vor neuerer Konfiguration

Verwenden Sie dies, wenn ein Gateway-Dienst nach einem Update unerwartet stoppt oder Logs zeigen, dass eine `openclaw`-Binärdatei älter ist als die Version, die zuletzt `openclaw.json` geschrieben hat.

OpenClaw versieht Konfigurationsschreibvorgänge mit `meta.lastTouchedVersion`. Schreibgeschützte Befehle können eine von einer neueren OpenClaw-Version geschriebene Konfiguration weiterhin prüfen, aber Prozess- und Dienstmutationen verweigern die Fortsetzung aus einer älteren Binärdatei. Blockierte Aktionen umfassen Gateway-Dienststart, -stopp, -neustart, -deinstallation, erzwungene Neuinstallation des Dienstes, Gateway-Start im Dienstmodus und Bereinigung des Ports mit `gateway --force`.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH korrigieren">
    Korrigieren Sie `PATH`, sodass `openclaw` auf die neuere Installation aufgelöst wird, und führen Sie die Aktion dann erneut aus.
  </Step>
  <Step title="Den Gateway-Dienst neu installieren">
    Installieren Sie den beabsichtigten Gateway-Dienst aus der neueren Installation neu:

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
Nur für beabsichtigte Downgrades oder Notfallwiederherstellung: Setzen Sie `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` für den einzelnen Befehl. Lassen Sie es im normalen Betrieb deaktiviert.
</Warning>

## Anthropic 429: Zusätzliche Nutzung für langen Kontext erforderlich

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf Folgendes:

- Das ausgewählte Anthropic-Opus-/Sonnet-Modell hat `params.context1m: true`.
- Die aktuellen Anthropic-Zugangsdaten sind nicht für die Nutzung mit langem Kontext berechtigt.
- Anfragen schlagen nur bei langen Sitzungen/Modelläufen fehl, die den 1M-Beta-Pfad benötigen.

Behebungsoptionen:

<Steps>
  <Step title="context1m deaktivieren">
    Deaktivieren Sie `context1m` für dieses Modell, um auf das normale Kontextfenster zurückzufallen.
  </Step>
  <Step title="Berechtigte Zugangsdaten verwenden">
    Verwenden Sie Anthropic-Zugangsdaten, die für Anfragen mit langem Kontext berechtigt sind, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
  </Step>
  <Step title="Fallback-Modelle konfigurieren">
    Konfigurieren Sie Fallback-Modelle, damit Läufe fortgesetzt werden, wenn Anthropic-Anfragen mit langem Kontext abgelehnt werden.
  </Step>
</Steps>

Verwandt:

- [Anthropic](/de/providers/anthropic)
- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Warum sehe ich HTTP 429 von Anthropic?](/de/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokales OpenAI-kompatibles Backend besteht direkte Sondierungen, aber Agent-Läufe schlagen fehl

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

- direkte kleine Aufrufe funktionieren, aber OpenClaw-Läufe schlagen nur bei größeren Prompts fehl
- Backend-Fehler darüber, dass `messages[].content` eine Zeichenfolge erwartet
- Backend-Abstürze, die nur bei größeren Prompt-Token-Mengen oder vollständigen Agent-Laufzeit-Prompts auftreten

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `messages[...].content: invalid type: sequence, expected a string` → Backend lehnt strukturierte Inhalte für Chat-Completions ab. Behebung: Setzen Sie `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - direkte kleine Anfragen funktionieren, aber OpenClaw-Agent-Läufe schlagen mit Backend-/Modellabstürzen fehl (zum Beispiel Gemma auf einigen `inferrs`-Builds) → Der OpenClaw-Transport ist wahrscheinlich bereits korrekt; das Backend schlägt bei der größeren Prompt-Form der Agent-Laufzeit fehl.
    - Fehler werden seltener, nachdem Tools deaktiviert wurden, verschwinden aber nicht → Tool-Schemas haben zum Druck beigetragen, aber das verbleibende Problem ist weiterhin eine Begrenzung des Upstream-Modells/Servers oder ein Backend-Fehler.
  </Accordion>
  <Accordion title="Behebungsoptionen">
    1. Setzen Sie `compat.requiresStringContent: true` für string-only-Backends von Chat Completions.
    2. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die die Tool-Schema-Oberfläche von OpenClaw nicht zuverlässig verarbeiten können.
    3. Reduzieren Sie nach Möglichkeit den Prompt-Druck: kleinerer Workspace-Bootstrap, kürzerer Sitzungsverlauf, leichteres lokales Modell oder ein Backend mit stärkerer Unterstützung für langen Kontext.
    4. Wenn direkte kleine Anfragen weiterhin funktionieren, OpenClaw-Agent-Turns aber im Backend weiterhin abstürzen, behandeln Sie dies als Begrenzung des Upstream-Servers/Modells und melden Sie dort eine Reproduktion mit der akzeptierten Payload-Form.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Konfiguration](/de/gateway/configuration)
- [Lokale Modelle](/de/gateway/local-models)
- [OpenAI-kompatible Endpunkte](/de/gateway/configuration-reference#openai-compatible-endpoints)

## Keine Antworten

Wenn Kanäle aktiv sind, aber nichts antwortet, prüfen Sie Routing und Richtlinien, bevor Sie irgendetwas neu verbinden.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Achten Sie auf Folgendes:

- Kopplung für DM-Absender ausstehend.
- Mention-Gating in Gruppen (`requireMention`, `mentionPatterns`).
- Mismatches bei Kanal-/Gruppen-Allowlist.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird ignoriert, bis eine Erwähnung erfolgt.
- `pairing request` → Der Absender benötigt eine Genehmigung.
- `blocked` / `allowlist` → Absender/Kanal wurde durch die Richtlinie gefiltert.

Verwandt:

- [Fehlerbehebung bei Kanälen](/de/channels/troubleshooting)
- [Gruppen](/de/channels/groups)
- [Kopplung](/de/channels/pairing)

## Konnektivität der Dashboard-Control-UI

Wenn Dashboard/Control UI keine Verbindung herstellt, prüfen Sie URL, Authentifizierungsmodus und Annahmen zu sicherem Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf Folgendes:

- Korrekte Probe-URL und Dashboard-URL.
- Mismatch bei Authentifizierungsmodus/Token zwischen Client und Gateway.
- HTTP-Nutzung, obwohl Geräteidentität erforderlich ist.

<AccordionGroup>
  <Accordion title="Verbindungs-/Authentifizierungssignaturen">
    - `device identity required` → unsicherer Kontext oder fehlende Geräteauthentifizierung.
    - `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins` enthalten (oder Sie verbinden sich von einem Browser-Origin außerhalb von loopback ohne explizite Allowlist).
    - `device nonce required` / `device nonce mismatch` → Client schließt den challengebasierten Geräteauthentifizierungsfluss nicht ab (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → Client hat die falsche Payload (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
    - `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Client kann einen vertrauenswürdigen Wiederholungsversuch mit gecachtem Geräte-Token ausführen.
    - Dieser Wiederholungsversuch mit gecachtem Token verwendet erneut die mit dem gekoppelten Geräte-Token gespeicherte Scope-Menge. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihre angeforderte Scope-Menge.
    - Außerhalb dieses Wiederholungswegs ist die Priorität der Verbindungsauthentifizierung: zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
    - Im asynchronen Tailscale-Serve-Pfad der Control UI werden fehlgeschlagene Versuche für dasselbe `{scope, ip}` serialisiert, bevor der Limiter den Fehler aufzeichnet. Zwei gleichzeitige fehlerhafte Wiederholungsversuche desselben Clients können daher beim zweiten Versuch `retry later` anzeigen statt zwei einfache Mismatches.
    - `too many failed authentication attempts (retry later)` von einem loopback-Client mit Browser-Origin → wiederholte Fehler von demselben normalisierten `Origin` werden vorübergehend gesperrt; ein anderer localhost-Origin verwendet einen separaten Bucket.
    - wiederholt `unauthorized` nach diesem Wiederholungsversuch → Drift bei gemeinsamem Token/Geräte-Token; aktualisieren Sie die Token-Konfiguration und genehmigen/rotieren Sie das Geräte-Token bei Bedarf erneut.
    - `gateway connect failed:` → falscher Host/Port/falsches URL-Ziel.
  </Accordion>
</AccordionGroup>

### Schnelle Zuordnung von Authentifizierungs-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                  | Bedeutung                                                                                                                                                                                   | Empfohlene Aktion                                                                                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`        | Client hat kein erforderliches gemeinsames Token gesendet.                                                                                                                                  | Fügen Sie das Token im Client ein/setzen Sie es und versuchen Sie es erneut. Für Dashboard-Pfade: `openclaw config get gateway.auth.token` und dann in die Einstellungen der Control UI einfügen.                                                                                     |
| `AUTH_TOKEN_MISMATCH`       | Gemeinsames Token stimmt nicht mit dem Gateway-Auth-Token überein.                                                                                                                          | Wenn `canRetryWithDeviceToken=true`, erlauben Sie einen vertrauenswürdigen Wiederholungsversuch. Wiederholungsversuche mit gecachtem Token verwenden die gespeicherten genehmigten Scopes erneut; Aufrufer mit explizitem `deviceToken` / `scopes` behalten angeforderte Scopes. Wenn es weiterhin fehlschlägt, führen Sie die [Checkliste zur Wiederherstellung bei Token-Drift](/de/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Gecachtes Token pro Gerät ist veraltet oder widerrufen.                                                                                                                                     | Rotieren/genehmigen Sie das Geräte-Token erneut mithilfe der [devices CLI](/de/cli/devices) und verbinden Sie sich dann erneut.                                                                                                                                                            |
| `PAIRING_REQUIRED`          | Geräteidentität benötigt eine Genehmigung. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade` und verwenden Sie `requestId` / `remediationHint`, wenn vorhanden. | Genehmigen Sie die ausstehende Anfrage: `openclaw devices list` und dann `openclaw devices approve <requestId>`. Scope-/Rollen-Upgrades verwenden denselben Ablauf, nachdem Sie den angeforderten Zugriff geprüft haben.                                                               |

<Note>
Direkte loopback-Backend-RPCs, die mit dem gemeinsamen Gateway-Token/Passwort authentifiziert sind, sollten nicht von der gekoppelten Geräte-Scope-Basislinie der CLI abhängen. Wenn Unteragenten oder andere interne Aufrufe weiterhin mit `scope-upgrade` fehlschlagen, prüfen Sie, ob der Aufrufer `client.id: "gateway-client"` und `client.mode: "backend"` verwendet und keine explizite `deviceIdentity` oder kein Geräte-Token erzwingt.
</Note>

Prüfung der Migration auf Device Auth v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler zeigen, aktualisieren Sie den verbindenden Client und prüfen Sie Folgendes:

<Steps>
  <Step title="Auf connect.challenge warten">
    Der Client wartet auf das vom Gateway ausgegebene `connect.challenge`.
  </Step>
  <Step title="Die Payload signieren">
    Der Client signiert die an die Challenge gebundene Payload.
  </Step>
  <Step title="Die Geräte-Nonce senden">
    Der Client sendet `connect.params.device.nonce` mit derselben Challenge-Nonce.
  </Step>
</Steps>

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet verweigert wird:

- Sitzungen mit gekoppeltem Geräte-Token können nur **ihr eigenes** Gerät verwalten, sofern der Aufrufer nicht zusätzlich `operator.admin` hat
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern, die die Aufrufersitzung bereits besitzt

Verwandt:

- [Konfiguration](/de/gateway/configuration) (Gateway-Authentifizierungsmodi)
- [Control UI](/de/web/control-ui)
- [Devices](/de/cli/devices)
- [Remote-Zugriff](/de/gateway/remote)
- [Authentifizierung über Trusted Proxy](/de/gateway/trusted-proxy-auth)

## Gateway-Dienst läuft nicht

Verwenden Sie dies, wenn der Dienst installiert ist, der Prozess aber nicht aktiv bleibt.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # zusätzlich nach Diensten auf Systemebene suchen
```

Achten Sie auf Folgendes:

- `Runtime: stopped` mit Hinweisen zum Exit.
- Mismatch in der Dienstkonfiguration (`Config (cli)` vs `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche launchd-/systemd-/schtasks-Installationen bei Verwendung von `--deep`.
- Hinweise zur Bereinigung bei `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → der lokale Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde überschrieben und hat `gateway.mode` verloren. Behebung: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete Konfiguration für den lokalen Modus erneut zu stempeln. Wenn Sie OpenClaw über Podman ausführen, lautet der Standardpfad für die Konfiguration `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → Bindung ohne loopback ohne gültigen Gateway-Authentifizierungspfad (Token/Passwort oder, falls konfiguriert, trusted-proxy).
    - `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
    - `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Units existieren. In den meisten Setups sollte es nur ein Gateway pro Maschine geben; wenn Sie wirklich mehr als eines benötigen, isolieren Sie Ports + Konfiguration/Zustand/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).
  </Accordion>
</AccordionGroup>

Verwandt:

- [Hintergrundausführung und Prozess-Tool](/de/gateway/background-process)
- [Konfiguration](/de/gateway/configuration)
- [Doctor](/de/gateway/doctor)

## Gateway hat die zuletzt bekannte funktionierende Konfiguration wiederhergestellt

Verwenden Sie dies, wenn das Gateway startet, die Logs aber sagen, dass `openclaw.json` wiederhergestellt wurde.

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

<AccordionGroup>
  <Accordion title="Was passiert ist">
    - Die abgelehnte Konfiguration hat die Validierung beim Start oder Hot-Reload nicht bestanden.
    - OpenClaw hat die abgelehnte Payload als `.clobbered.*` erhalten.
    - Die aktive Konfiguration wurde aus der zuletzt validierten letzten bekannten funktionierenden Kopie wiederhergestellt.
    - Der nächste Turn des Haupt-Agenten wird gewarnt, die abgelehnte Konfiguration nicht blind neu zu schreiben.
    - Wenn alle Validierungsprobleme unter `plugins.entries.<id>...` lagen, würde OpenClaw nicht die gesamte Datei wiederherstellen. Plugin-lokale Fehler bleiben laut sichtbar, während nicht zusammenhängende Benutzereinstellungen in der aktiven Konfiguration erhalten bleiben.
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
    - `.clobbered.*` existiert → eine externe direkte Bearbeitung oder ein Start-Lesevorgang wurde wiederhergestellt.
    - `.rejected.*` existiert → ein von OpenClaw gesteuerter Konfigurationsschreibvorgang ist vor dem Commit an Schema- oder Clobber-Prüfungen gescheitert.
    - `Config write rejected:` → der Schreibvorgang hätte versucht, erforderliche Form zu entfernen, die Datei stark zu verkleinern oder eine ungültige Konfiguration zu persistieren.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oder `size-drop-vs-last-good:*` → beim Start wurde die aktuelle Datei als überschrieben behandelt, weil Felder oder Größe im Vergleich zum zuletzt bekannten funktionierenden Backup fehlten.
    - `Config last-known-good promotion skipped` → der Kandidat enthielt redigierte Secret-Platzhalter wie `***`.
  </Accordion>
  <Accordion title="Behebungsoptionen">
    1. Behalten Sie die wiederhergestellte aktive Konfiguration bei, wenn sie korrekt ist.
    2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*` und wenden Sie sie dann mit `openclaw config set` oder `config.patch` an.
    3. Führen Sie `openclaw config validate` aus, bevor Sie neu starten.
    4. Wenn Sie von Hand bearbeiten, behalten Sie die vollständige JSON5-Konfiguration bei und nicht nur das partielle Objekt, das Sie ändern wollten.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Config](/de/cli/config)
- [Konfiguration: Hot-Reload](/de/gateway/configuration#config-hot-reload)
- [Konfiguration: strikte Validierung](/de/gateway/configuration#strict-validation)
- [Doctor](/de/gateway/doctor)

## Gateway-Sondierungswarnungen

Verwenden Sie dies, wenn `openclaw gateway probe` etwas erreicht, aber dennoch einen Warnblock ausgibt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Achten Sie auf Folgendes:

- `warnings[].code` und `primaryTargetId` in der JSON-Ausgabe.
- Ob sich die Warnung auf SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Auth-Referenzen bezieht.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-Einrichtung ist fehlgeschlagen, aber der Befehl hat dennoch direkte konfigurierte/loopback-Ziele versucht.
- `multiple reachable gateways detected` → mehr als ein Ziel hat geantwortet. Normalerweise bedeutet das ein beabsichtigtes Multi-Gateway-Setup oder veraltete/duplizierte Listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → die Verbindung hat funktioniert, aber Detail-RPC ist durch Scopes begrenzt; koppeln Sie die Geräteidentität oder verwenden Sie Zugangsdaten mit `operator.read`.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → das Gateway hat geantwortet, aber dieser Client benötigt vor normalem Operatorzugriff noch Kopplung/Genehmigung.
- nicht aufgelöster Warntext zu SecretRef für `gateway.auth.*` / `gateway.remote.*` → Authentifizierungsmaterial war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [Gateway](/de/cli/gateway)
- [Mehrere Gateways auf demselben Host](/de/gateway#multiple-gateways-same-host)
- [Remote-Zugriff](/de/gateway/remote)

## Kanal verbunden, aber Nachrichten fließen nicht

Wenn der Kanalstatus verbunden ist, der Nachrichtenfluss aber tot ist, konzentrieren Sie sich auf Richtlinien, Berechtigungen und kanalspezifische Zustellregeln.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Achten Sie auf Folgendes:

- DM-Richtlinie (`pairing`, `allowlist`, `open`, `disabled`).
- Gruppen-Allowlist und Anforderungen für Erwähnungen.
- Fehlende API-Berechtigungen/Scopes des Kanals.

Häufige Signaturen:

- `mention required` → Nachricht wurde durch Mention-Richtlinie in Gruppen ignoriert.
- `pairing` / Spuren ausstehender Genehmigung → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Authentifizierung/Berechtigungen des Kanals.

Verwandt:

- [Fehlerbehebung bei Kanälen](/de/channels/troubleshooting)
- [Discord](/de/channels/discord)
- [Telegram](/de/channels/telegram)
- [WhatsApp](/de/channels/whatsapp)

## Cron- und Heartbeat-Zustellung

Wenn Cron oder Heartbeat nicht ausgeführt wurden oder nicht zugestellt haben, prüfen Sie zuerst den Scheduler-Zustand und dann das Zustellziel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Achten Sie auf Folgendes:

- Cron aktiviert und nächster Wake vorhanden.
- Status des Job-Laufverlaufs (`ok`, `skipped`, `error`).
- Skip-Gründe für Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron deaktiviert.
    - `cron: timer tick failed` → Scheduler-Tick fehlgeschlagen; prüfen Sie Datei-/Log-/Laufzeitfehler.
    - `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des Zeitfensters für aktive Stunden.
    - `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur Leerzeilen / Markdown-Überschriften, daher überspringt OpenClaw den Modellaufruf.
    - `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen Block `tasks:`, aber keine der Aufgaben ist bei diesem Tick fällig.
    - `heartbeat: unknown accountId` → ungültige Konto-ID für das Heartbeat-Zustellziel.
    - `heartbeat skipped` mit `reason=dm-blocked` → Heartbeat-Ziel wurde zu einem DM-artigen Ziel aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder die agentbezogene Überschreibung) auf `block` gesetzt ist.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
- [Geplante Aufgaben: Fehlerbehebung](/de/automation/cron-jobs#troubleshooting)

## Node gekoppelt, Tool schlägt fehl

Wenn eine Node gekoppelt ist, aber Tools fehlschlagen, isolieren Sie Vordergrundstatus, Berechtigungen und Genehmigungsstatus.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Achten Sie auf Folgendes:

- Node online mit den erwarteten Fähigkeiten.
- Erteilte OS-Berechtigungen für Kamera/Mikrofon/Standort/Bildschirm.
- Exec-Genehmigungen und Allowlist-Status.

Häufige Signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-App muss im Vordergrund sein.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → fehlende OS-Berechtigung.
- `SYSTEM_RUN_DENIED: approval required` → Exec-Genehmigung ausstehend.
- `SYSTEM_RUN_DENIED: allowlist miss` → Befehl durch Allowlist blockiert.

Verwandt:

- [Exec-Genehmigungen](/de/tools/exec-approvals)
- [Fehlerbehebung bei Nodes](/de/nodes/troubleshooting)
- [Nodes](/de/nodes/index)

## Browser-Tool schlägt fehl

Verwenden Sie dies, wenn Aktionen des Browser-Tools fehlschlagen, obwohl das Gateway selbst gesund ist.

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
- Lokale Verfügbarkeit von Chrome für Profile `existing-session` / `user`.

<AccordionGroup>
  <Accordion title="Plugin-/Executable-Signaturen">
    - `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin wird durch `plugins.allow` ausgeschlossen.
    - Browser-Tool fehlt / ist nicht verfügbar, obwohl `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
    - `Failed to start Chrome CDP on port` → Browser-Prozess konnte nicht gestartet werden.
    - `browser.executablePath not found` → der konfigurierte Pfad ist ungültig.
    - `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
    - `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen ungültigen oder außerhalb des zulässigen Bereichs liegenden Port.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → der aktuellen Gateway-Installation fehlt die Laufzeitabhängigkeit `playwright-core` des gebündelten Browser-Plugins; führen Sie `openclaw doctor --fix` aus und starten Sie dann das Gateway neu. ARIA-Snapshots und einfache Seitenscreenshots können weiterhin funktionieren, aber Navigation, KI-Snapshots, Element-Screenshots über CSS-Selektoren und PDF-Export bleiben nicht verfügbar.
  </Accordion>
  <Accordion title="Signaturen von Chrome MCP / existing-session">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session konnte noch nicht an das ausgewählte Browser-Datenverzeichnis angehängt werden. Öffnen Sie die Browser-Inspect-Seite, aktivieren Sie Remote-Debugging, lassen Sie den Browser geöffnet, genehmigen Sie die erste Aufforderung zum Anhängen und versuchen Sie es dann erneut. Wenn ein angemeldeter Zustand nicht erforderlich ist, bevorzugen Sie das verwaltete Profil `openclaw`.
    - `No Chrome tabs found for profile="user"` → das Chrome-MCP-Attach-Profil hat keine offenen lokalen Chrome-Tabs.
    - `Remote CDP for profile "<name>" is not reachable` → der konfigurierte entfernte CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
    - `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → das Profil nur zum Anhängen hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber das CDP-WebSocket konnte trotzdem nicht geöffnet werden.
  </Accordion>
  <Accordion title="Signaturen für Element / Screenshot / Upload">
    - `fullPage is not supported for element screenshots` → Screenshot-Anfrage mischt `--full-page` mit `--ref` oder `--element`.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Screenshot-Aufrufe für Chrome MCP / `existing-session` müssen Seitenerfassung oder ein Snapshot-`--ref` verwenden, nicht CSS-`--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Upload-Hooks für Chrome MCP benötigen Snapshot-Refs, nicht CSS-Selektoren.
    - `existing-session file uploads currently support one file at a time.` → senden Sie bei Chrome-MCP-Profilen pro Aufruf nur einen Upload.
    - `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks bei Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
    - `existing-session type does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:type` bei Profilen `profile="user"` / Chrome-MCP-existing-session weg oder verwenden Sie ein verwaltetes/CDP-Browser-Profil, wenn ein benutzerdefiniertes Timeout erforderlich ist.
    - `existing-session evaluate does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:evaluate` bei Profilen `profile="user"` / Chrome-MCP-existing-session weg oder verwenden Sie ein verwaltetes/CDP-Browser-Profil, wenn ein benutzerdefiniertes Timeout erforderlich ist.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin ein verwaltetes Browser- oder rohes CDP-Profil.
    - veraltete Überschreibungen für Viewport / Dark Mode / Locale / Offline auf Profilen nur zum Anhängen oder entfernten CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Kontrollsitzung zu schließen und den Emulationszustand von Playwright/CDP freizugeben, ohne das gesamte Gateway neu zu starten.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Browser (von OpenClaw verwaltet)](/de/tools/browser)
- [Fehlerbehebung für Browser](/de/tools/browser-linux-troubleshooting)

## Wenn Sie ein Upgrade durchgeführt haben und plötzlich etwas nicht mehr funktioniert

Die meisten Probleme nach einem Upgrade sind Konfigurationsdrift oder striktere Standardwerte, die jetzt erzwungen werden.

<AccordionGroup>
  <Accordion title="1. Verhalten von Authentifizierung und URL-Überschreibung hat sich geändert">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Was zu prüfen ist:

    - Wenn `gateway.mode=remote`, können CLI-Aufrufe auf Remote zielen, während Ihr lokaler Dienst in Ordnung ist.
    - Explizite Aufrufe mit `--url` greifen nicht auf gespeicherte Zugangsdaten zurück.

    Häufige Signaturen:

    - `gateway connect failed:` → falsches URL-Ziel.
    - `unauthorized` → Endpunkt erreichbar, aber falsche Authentifizierung.

  </Accordion>
  <Accordion title="2. Schutzmechanismen für Bindung und Authentifizierung sind strenger">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Was zu prüfen ist:

    - Bindungen außerhalb von loopback (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Authentifizierungspfad: Authentifizierung mit gemeinsamem Token/Passwort oder eine korrekt konfigurierte Bereitstellung mit `trusted-proxy` außerhalb von loopback.
    - Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

    Häufige Signaturen:

    - `refusing to bind gateway ... without auth` → Bindung außerhalb von loopback ohne gültigen Gateway-Authentifizierungspfad.
    - `Connectivity probe: failed`, während die Laufzeit läuft → Gateway aktiv, aber mit aktueller Authentifizierung/URL nicht erreichbar.

  </Accordion>
  <Accordion title="3. Zustand von Kopplung und Geräteidentität hat sich geändert">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Was zu prüfen ist:

    - Ausstehende Genehmigungen für Geräte für Dashboard/Nodes.
    - Ausstehende Kopplungsgenehmigungen für DMs nach Änderungen an Richtlinie oder Identität.

    Häufige Signaturen:

    - `device identity required` → Geräteauthentifizierung nicht erfüllt.
    - `pairing required` → Absender/Gerät muss genehmigt werden.

  </Accordion>
</AccordionGroup>

Wenn Dienstkonfiguration und Laufzeit nach den Prüfungen weiterhin nicht übereinstimmen, installieren Sie die Dienstmetadaten aus demselben Profil-/Zustandsverzeichnis neu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [Authentifizierung](/de/gateway/authentication)
- [Hintergrundausführung und Prozess-Tool](/de/gateway/background-process)
- [Gateway-eigene Kopplung](/de/gateway/pairing)

## Verwandt

- [Doctor](/de/gateway/doctor)
- [FAQ](/de/help/faq)
- [Gateway-Runbook](/de/gateway)
