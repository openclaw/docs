---
read_when:
    - Die Fehlerbehebungszentrale hat Sie für eine tiefergehende Diagnose hierher verwiesen.
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen
sidebarTitle: Troubleshooting
summary: Umfassendes Runbook zur Fehlerbehebung für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-05-03T21:33:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19422615706ca09124b19dd3e21b2c13391d6daf2b1807e01b4ce2047d02e522
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Diese Seite ist das ausführliche Runbook. Beginnen Sie bei [/help/troubleshooting](/de/help/troubleshooting), wenn Sie zuerst den schnellen Triage-Ablauf möchten.

## Befehlsabfolge

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
- `openclaw channels status --probe` zeigt den Live-Transportstatus pro Konto und, wo unterstützt, Prüf-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Split-Brain-Installationen und Schutz für neuere Konfigurationen

Verwenden Sie dies, wenn ein Gateway-Dienst nach einem Update unerwartet stoppt oder die Logs zeigen, dass ein `openclaw`-Binary älter ist als die Version, die zuletzt `openclaw.json` geschrieben hat.

OpenClaw versieht Konfigurationsschreibvorgänge mit `meta.lastTouchedVersion`. Schreibgeschützte Befehle können weiterhin eine Konfiguration prüfen, die von einem neueren OpenClaw geschrieben wurde, aber Prozess- und Dienstmutationen verweigern die Fortsetzung mit einem älteren Binary. Blockierte Aktionen umfassen Starten, Stoppen, Neustarten, Deinstallieren des Gateway-Dienstes, erzwungene Dienstneuinstallation, Gateway-Start im Dienstmodus und `gateway --force`-Portbereinigung.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH korrigieren">
    Korrigieren Sie `PATH`, damit `openclaw` auf die neuere Installation verweist, und führen Sie die Aktion dann erneut aus.
  </Step>
  <Step title="Gateway-Dienst neu installieren">
    Installieren Sie den vorgesehenen Gateway-Dienst aus der neueren Installation neu:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Veraltete Wrapper entfernen">
    Entfernen Sie veraltete Systempaket- oder alte Wrapper-Einträge, die noch auf ein altes `openclaw`-Binary zeigen.
  </Step>
</Steps>

<Warning>
Nur für absichtliches Downgrade oder Notfallwiederherstellung: Setzen Sie `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` für den einzelnen Befehl. Lassen Sie es im Normalbetrieb nicht gesetzt.
</Warning>

## Anthropic 429: zusätzliche Nutzung für langen Kontext erforderlich

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf Folgendes:

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

## Lokales OpenAI-kompatibles Backend besteht direkte Prüfungen, aber Agentenläufe schlagen fehl

Verwenden Sie dies, wenn:

- `curl ... /v1/models` funktioniert
- winzige direkte `/v1/chat/completions`-Aufrufe funktionieren
- OpenClaw-Modellläufe nur bei normalen Agenten-Turns fehlschlagen

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Achten Sie auf Folgendes:

- direkte winzige Aufrufe sind erfolgreich, aber OpenClaw-Läufe schlagen nur bei größeren Prompts fehl
- `model_not_found`- oder 404-Fehler, obwohl direkte `/v1/chat/completions`
  mit derselben reinen Modell-ID funktionieren
- Backend-Fehler darüber, dass `messages[].content` eine Zeichenfolge erwartet
- intermittierende Warnungen `incomplete turn detected ... stopReason=stop payloads=0` mit einem OpenAI-kompatiblen lokalen Backend
- Backend-Abstürze, die nur bei größeren Prompt-Token-Zahlen oder vollständigen Agent-Runtime-Prompts auftreten

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `model_not_found` mit einem lokalen MLX/vLLM-artigen Server → prüfen Sie, ob `baseUrl` `/v1` enthält, `api` für `/v1/chat/completions`-Backends `"openai-completions"` ist und `models.providers.<provider>.models[].id` die reine provider-lokale ID ist. Wählen Sie sie einmal mit dem Provider-Präfix aus, zum Beispiel `mlx/mlx-community/Qwen3-30B-A3B-6bit`; belassen Sie den Katalogeintrag als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → Backend lehnt strukturierte Chat-Completions-Inhaltsteile ab. Behebung: Setzen Sie `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → das Backend hat die Chat-Completions-Anfrage abgeschlossen, aber für diesen Turn keinen für Benutzer sichtbaren Assistententext zurückgegeben. OpenClaw wiederholt replay-sichere leere OpenAI-kompatible Turns einmal; anhaltende Fehler bedeuten normalerweise, dass das Backend leere/Nicht-Text-Inhalte ausgibt oder Final-Answer-Text unterdrückt.
    - direkte winzige Anfragen sind erfolgreich, aber OpenClaw-Agentenläufe schlagen mit Backend-/Modellabstürzen fehl (zum Beispiel Gemma auf einigen `inferrs`-Builds) → der OpenClaw-Transport ist wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Prompt-Struktur der Agent-Runtime.
    - Fehler nehmen nach dem Deaktivieren von Tools ab, verschwinden aber nicht → Tool-Schemas waren Teil des Drucks, aber das verbleibende Problem ist weiterhin Upstream-Modell-/Serverkapazität oder ein Backend-Fehler.

  </Accordion>
  <Accordion title="Behebungsoptionen">
    1. Setzen Sie `compat.requiresStringContent: true` für Chat-Completions-Backends, die nur Zeichenfolgen unterstützen.
    2. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die OpenClaws Tool-Schema-Oberfläche nicht zuverlässig verarbeiten können.
    3. Reduzieren Sie nach Möglichkeit den Prompt-Druck: kleinerer Workspace-Bootstrap, kürzere Sitzungshistorie, leichteres lokales Modell oder ein Backend mit stärkerer Long-Context-Unterstützung.
    4. Wenn winzige direkte Anfragen weiterhin funktionieren, während OpenClaw-Agenten-Turns noch im Backend abstürzen, behandeln Sie dies als Upstream-Server-/Modellbeschränkung und reichen Sie dort eine Reproduktion mit der akzeptierten Payload-Struktur ein.
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

Achten Sie auf Folgendes:

- Pairing für DM-Absender ausstehend.
- Gruppen-Erwähnungsgating (`requireMention`, `mentionPatterns`).
- Abweichungen in der Kanal-/Gruppen-Allowlist.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird bis zur Erwähnung ignoriert.
- `pairing request` → Absender benötigt Genehmigung.
- `blocked` / `allowlist` → Absender/Kanal wurde durch Richtlinie gefiltert.

Verwandt:

- [Kanal-Fehlerbehebung](/de/channels/troubleshooting)
- [Gruppen](/de/channels/groups)
- [Pairing](/de/channels/pairing)

## Konnektivität der Dashboard-Steuerungs-UI

Wenn die Dashboard-/Steuerungs-UI keine Verbindung herstellt, validieren Sie URL, Authentifizierungsmodus und Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf Folgendes:

- Korrekte Prüf-URL und Dashboard-URL.
- Abweichung des Authentifizierungsmodus/Tokens zwischen Client und Gateway.
- HTTP-Nutzung, wo Geräteidentität erforderlich ist.

<AccordionGroup>
  <Accordion title="Verbindungs-/Authentifizierungssignaturen">
    - `device identity required` → nicht sicherer Kontext oder fehlende Geräteauthentifizierung.
    - `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins` (oder Sie verbinden sich von einem Nicht-Loopback-Browser-Ursprung ohne explizite Allowlist).
    - `device nonce required` / `device nonce mismatch` → Client schließt den Challenge-basierten Geräteauthentifizierungsablauf (`connect.challenge` + `device.nonce`) nicht ab.
    - `device signature invalid` / `device signature expired` → Client hat die falsche Payload (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
    - `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Client kann einen vertrauenswürdigen Wiederholungsversuch mit zwischengespeichertem Geräte-Token ausführen.
    - Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet den zwischengespeicherten Scope-Satz, der mit dem gekoppelten Geräte-Token gespeichert ist. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihren angeforderten Scope-Satz.
    - Außerhalb dieses Wiederholungsversuchspfads gilt für Connect-Authentifizierung die Rangfolge: zuerst explizites Shared-Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
    - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für denselben `{scope, ip}` serialisiert, bevor der Limiter den Fehler erfasst. Zwei fehlerhafte gleichzeitige Wiederholungen vom selben Client können daher beim zweiten Versuch `retry later` statt zwei einfacher Abweichungen anzeigen.
    - `too many failed authentication attempts (retry later)` von einem Browser-Origin-Loopback-Client → wiederholte Fehler von demselben normalisierten `Origin` werden vorübergehend gesperrt; ein anderer localhost-Origin verwendet einen separaten Bucket.
    - wiederholt `unauthorized` nach diesem Wiederholungsversuch → Shared-Token-/Geräte-Token-Drift; aktualisieren Sie die Token-Konfiguration und genehmigen/rotieren Sie bei Bedarf das Geräte-Token erneut.
    - `gateway connect failed:` → falsches Host-/Port-/URL-Ziel.

  </Accordion>
</AccordionGroup>

### Schnellübersicht der Auth-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                  | Bedeutung                                                                                                                                                                                      | Empfohlene Aktion                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Der Client hat kein erforderliches gemeinsam genutztes Token gesendet.                                                                                                                                                 | Fügen Sie das Token im Client ein bzw. legen Sie es dort fest und versuchen Sie es erneut. Für Dashboard-Pfade: `openclaw config get gateway.auth.token`, dann in die Control UI-Einstellungen einfügen.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Das gemeinsam genutzte Token stimmte nicht mit dem Gateway-Authentifizierungstoken überein.                                                                                                                                               | Wenn `canRetryWithDeviceToken=true`, lassen Sie einen vertrauenswürdigen Wiederholungsversuch zu. Wiederholungen mit zwischengespeichertem Token verwenden gespeicherte genehmigte Scopes erneut; explizite Aufrufer mit `deviceToken` / `scopes` behalten die angeforderten Scopes bei. Wenn es weiterhin fehlschlägt, führen Sie die [Checkliste zur Wiederherstellung bei Token-Abweichung](/de/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Das zwischengespeicherte gerätespezifische Token ist veraltet oder widerrufen.                                                                                                                                                 | Rotieren bzw. genehmigen Sie das Geräte-Token erneut mit der [Geräte-CLI](/de/cli/devices), und verbinden Sie sich dann erneut.                                                                                                                                                                                                        |
| `PAIRING_REQUIRED`           | Die Geräteidentität benötigt eine Genehmigung. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade`, und verwenden Sie `requestId` / `remediationHint`, sofern vorhanden. | Genehmigen Sie die ausstehende Anfrage: `openclaw devices list`, dann `openclaw devices approve <requestId>`. Scope-/Rollen-Upgrades verwenden denselben Ablauf, nachdem Sie den angeforderten Zugriff geprüft haben.                                                                                                               |

<Note>
Direkte Loopback-Backend-RPCs, die mit dem gemeinsam genutzten Gateway-Token/-Passwort authentifiziert sind, sollten nicht von der Scope-Baseline der gekoppelten Geräte der CLI abhängen. Wenn Subagents oder andere interne Aufrufe weiterhin mit `scope-upgrade` fehlschlagen, prüfen Sie, ob der Aufrufer `client.id: "gateway-client"` und `client.mode: "backend"` verwendet und keine explizite `deviceIdentity` bzw. kein Geräte-Token erzwingt.
</Note>

Migrationsprüfung für Geräteauthentifizierung v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler anzeigen, aktualisieren Sie den verbindenden Client und prüfen Sie ihn:

<Steps>
  <Step title="Wait for connect.challenge">
    Der Client wartet auf die vom Gateway ausgegebene `connect.challenge`.
  </Step>
  <Step title="Sign the payload">
    Der Client signiert die an die Challenge gebundene Payload.
  </Step>
  <Step title="Send the device nonce">
    Der Client sendet `connect.params.device.nonce` mit derselben Challenge-Nonce.
  </Step>
</Steps>

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet verweigert wird:

- Sitzungen mit gekoppeltem Geräte-Token können nur **ihr eigenes** Gerät verwalten, sofern der Aufrufer nicht auch `operator.admin` besitzt
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern, die die Aufrufersitzung bereits besitzt

Verwandt:

- [Konfiguration](/de/gateway/configuration) (Gateway-Authentifizierungsmodi)
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

- `Runtime: stopped` mit Hinweisen zum Exit.
- Abweichende Dienstkonfiguration (`Config (cli)` gegenüber `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche launchd-/systemd-/schtasks-Installationen, wenn `--deep` verwendet wird.
- Bereinigungshinweise zu `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Common signatures">
    - `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → lokaler Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde überschrieben und hat `gateway.mode` verloren. Lösung: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration, oder führen Sie erneut `openclaw onboard --mode local` / `openclaw setup` aus, um die erwartete lokale Moduskonfiguration neu zu setzen. Wenn Sie OpenClaw über Podman ausführen, ist der Standardkonfigurationspfad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → Nicht-Loopback-Bind ohne gültigen Gateway-Authentifizierungspfad (Token/Passwort oder trusted-proxy, falls konfiguriert).
    - `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
    - `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Units sind vorhanden. Die meisten Setups sollten ein Gateway pro Maschine verwenden; wenn Sie mehr als eines benötigen, isolieren Sie Ports + Konfiguration/Status/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` von doctor → Eine systemd-System-Unit ist vorhanden, während der Dienst auf Benutzerebene fehlt. Entfernen oder deaktivieren Sie das Duplikat, bevor Sie doctor erlauben, einen Benutzerdienst zu installieren, oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn die System-Unit der beabsichtigte Supervisor ist.
    - `Gateway service port does not match current gateway config` → Der installierte Supervisor fixiert weiterhin den alten `--port`. Führen Sie `openclaw doctor --fix` oder `openclaw gateway install --force` aus, und starten Sie dann den Gateway-Dienst neu.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Hintergrundausführung und Prozesstool](/de/gateway/background-process)
- [Konfiguration](/de/gateway/configuration)
- [Doctor](/de/gateway/doctor)

## Gateway hat ungültige Konfiguration abgelehnt

Verwenden Sie dies, wenn der Gateway-Start mit `Invalid config` fehlschlägt oder Hot-Reload-Logs melden, dass
eine ungültige Bearbeitung übersprungen wurde.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Achten Sie auf:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- Eine mit Zeitstempel versehene Datei `openclaw.json.rejected.*` neben der aktiven Konfiguration
- Eine mit Zeitstempel versehene Datei `openclaw.json.clobbered.*`, wenn `doctor --fix` eine beschädigte direkte Bearbeitung repariert hat

<AccordionGroup>
  <Accordion title="What happened">
    - Die Konfiguration wurde beim Start, beim Hot Reload oder bei einem von OpenClaw verantworteten Schreibvorgang nicht validiert.
    - Der Gateway-Start schlägt geschlossen fehl, statt `openclaw.json` umzuschreiben.
    - Hot Reload überspringt ungültige externe Bearbeitungen und hält die aktuelle Laufzeitkonfiguration aktiv.
    - Von OpenClaw verantwortete Schreibvorgänge lehnen ungültige/destruktive Payloads vor dem Commit ab und speichern `.rejected.*`.
    - `openclaw doctor --fix` ist für Reparaturen zuständig. Es kann Nicht-JSON-Präfixe entfernen oder die letzte bekannte gute Kopie wiederherstellen, während die abgelehnte Payload als `.clobbered.*` erhalten bleibt.

  </Accordion>
  <Accordion title="Inspect and repair">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="Common signatures">
    - `.clobbered.*` ist vorhanden → doctor hat eine beschädigte externe Bearbeitung bewahrt, während die aktive Konfiguration repariert wurde.
    - `.rejected.*` ist vorhanden → Ein von OpenClaw verantworteter Konfigurationsschreibvorgang ist vor dem Commit an Schema- oder Clobber-Prüfungen gescheitert.
    - `Config write rejected:` → Der Schreibvorgang versuchte, erforderliche Struktur zu entfernen, die Datei stark zu verkleinern oder ungültige Konfiguration zu persistieren.
    - `config reload skipped (invalid config):` → Eine direkte Bearbeitung hat die Validierung nicht bestanden und wurde vom laufenden Gateway ignoriert.
    - `Invalid config at ...` → Der Start ist fehlgeschlagen, bevor Gateway-Dienste gestartet wurden.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oder `size-drop-vs-last-good:*` → Ein von OpenClaw verantworteter Schreibvorgang wurde abgelehnt, weil er im Vergleich zur letzten bekannten guten Sicherung Felder oder Größe verloren hat.
    - `Config last-known-good promotion skipped` → Der Kandidat enthielt redigierte Secret-Platzhalter wie `***`.

  </Accordion>
  <Accordion title="Fix options">
    1. Führen Sie `openclaw doctor --fix` aus, damit doctor eine vorangestellte/überschriebene Konfiguration repariert oder die letzte bekannte gute Version wiederherstellt.
    2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*`, und wenden Sie sie dann mit `openclaw config set` oder `config.patch` an.
    3. Führen Sie `openclaw config validate` aus, bevor Sie neu starten.
    4. Wenn Sie manuell bearbeiten, behalten Sie die vollständige JSON5-Konfiguration bei, nicht nur das Teilobjekt, das Sie ändern wollten.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Konfiguration](/de/cli/config)
- [Konfiguration: Hot Reload](/de/gateway/configuration#config-hot-reload)
- [Konfiguration: strikte Validierung](/de/gateway/configuration#strict-validation)
- [Doctor](/de/gateway/doctor)

## Gateway-Probe-Warnungen

Verwenden Sie dies, wenn `openclaw gateway probe` etwas erreicht, aber trotzdem einen Warnungsblock ausgibt.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Achten Sie auf:

- `warnings[].code` und `primaryTargetId` in der JSON-Ausgabe.
- Ob die Warnung SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Authentifizierungsreferenzen betrifft.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-Einrichtung ist fehlgeschlagen, aber der Befehl hat dennoch direkte konfigurierte/Loopback-Ziele versucht.
- `multiple reachable gateways detected` → Mehr als ein Ziel hat geantwortet. In der Regel bedeutet dies ein beabsichtigtes Multi-Gateway-Setup oder veraltete/duplizierte Listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → Verbindung hat funktioniert, aber die Detail-RPC ist durch Scopes eingeschränkt; koppeln Sie die Geräteidentität oder verwenden Sie Zugangsdaten mit `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → Verbindung hat funktioniert, aber der vollständige Satz diagnostischer RPCs ist abgelaufen oder fehlgeschlagen. Behandeln Sie dies als erreichbares Gateway mit eingeschränkter Diagnostik; vergleichen Sie `connect.ok` und `connect.rpcOk` in der `--json`-Ausgabe.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → Das Gateway hat geantwortet, aber dieser Client benötigt vor normalem Operator-Zugriff noch Kopplung/Genehmigung.
- Nicht aufgelöster `gateway.auth.*`- / `gateway.remote.*`-SecretRef-Warntext → Authentifizierungsmaterial war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [Gateway](/de/cli/gateway)
- [Mehrere Gateways auf demselben Host](/de/gateway#multiple-gateways-same-host)
- [Remote-Zugriff](/de/gateway/remote)

## Kanal verbunden, Nachrichten fließen nicht

Wenn der Kanalstatus verbunden ist, der Nachrichtenfluss aber ausfällt, konzentrieren Sie sich auf Richtlinien, Berechtigungen und kanalspezifische Zustellregeln.

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
- Fehlende API-Berechtigungen/-Scopes des Kanals.

Häufige Signaturen:

- `mention required` → Nachricht wurde durch die Gruppen-Erwähnungsrichtlinie ignoriert.
- `pairing` / ausstehende Genehmigungsspuren → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Kanal-Authentifizierung/-Berechtigungen.

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

- Cron ist aktiviert und die nächste Aktivierung ist vorhanden.
- Status der Job-Ausführungshistorie (`ok`, `skipped`, `error`).
- Gründe für übersprungene Heartbeats (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron deaktiviert.
    - `cron: timer tick failed` → Scheduler-Tick fehlgeschlagen; prüfen Sie Datei-/Log-/Runtime-Fehler.
    - `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des aktiven Zeitfensters.
    - `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur Leerzeilen / Markdown-Überschriften, daher überspringt OpenClaw den Modellaufruf.
    - `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber keine der Aufgaben ist bei diesem Tick fällig.
    - `heartbeat: unknown accountId` → ungültige Konto-ID für das Heartbeat-Zustellungsziel.
    - `heartbeat skipped` mit `reason=dm-blocked` → Heartbeat-Ziel wurde zu einem DM-ähnlichen Ziel aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder eine agentenspezifische Überschreibung) auf `block` gesetzt ist.

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

- Node ist online und hat die erwarteten Fähigkeiten.
- OS-Berechtigungen für Kamera/Mikrofon/Standort/Bildschirm.
- Exec-Genehmigungen und Allowlist-Status.

Häufige Signaturen:

- `NODE_BACKGROUND_UNAVAILABLE` → Node-App muss im Vordergrund sein.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → fehlende OS-Berechtigung.
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
- Gültiger Pfad zur Browser-Ausführungsdatei.
- Erreichbarkeit des CDP-Profils.
- Lokale Chrome-Verfügbarkeit für `existing-session`- / `user`-Profile.

<AccordionGroup>
  <Accordion title="Plugin- / Ausführungsdatei-Signaturen">
    - `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin wird durch `plugins.allow` ausgeschlossen.
    - Browser-Tool fehlt / nicht verfügbar, während `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
    - `Failed to start Chrome CDP on port` → Browser-Prozess konnte nicht gestartet werden.
    - `browser.executablePath not found` → konfigurierter Pfad ist ungültig.
    - `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
    - `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen ungültigen oder außerhalb des Bereichs liegenden Port.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → der aktuellen Gateway-Installation fehlt die zentrale Browser-Runtime-Abhängigkeit; installieren oder aktualisieren Sie OpenClaw erneut und starten Sie dann den Gateway neu. ARIA-Snapshots und einfache Seiten-Screenshots können weiterhin funktionieren, aber Navigation, KI-Snapshots, Element-Screenshots per CSS-Selektor und PDF-Export bleiben nicht verfügbar.

  </Accordion>
  <Accordion title="Chrome-MCP- / existing-session-Signaturen">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session konnte noch nicht an das ausgewählte Browser-Datenverzeichnis anhängen. Öffnen Sie die Browser-Inspect-Seite, aktivieren Sie Remote-Debugging, lassen Sie den Browser geöffnet, genehmigen Sie die erste Attach-Aufforderung und versuchen Sie es erneut. Wenn der angemeldete Zustand nicht erforderlich ist, bevorzugen Sie das verwaltete `openclaw`-Profil.
    - `No Chrome tabs found for profile="user"` → das Chrome-MCP-Attach-Profil hat keine geöffneten lokalen Chrome-Tabs.
    - `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
    - `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → Attach-only-Profil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber der CDP-WebSocket konnte trotzdem nicht geöffnet werden.

  </Accordion>
  <Accordion title="Element- / Screenshot- / Upload-Signaturen">
    - `fullPage is not supported for element screenshots` → Screenshot-Anforderung hat `--full-page` mit `--ref` oder `--element` kombiniert.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome-MCP- / `existing-session`-Screenshot-Aufrufe müssen Seitenerfassung oder eine Snapshot-`--ref` verwenden, nicht CSS-`--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome-MCP-Upload-Hooks benötigen Snapshot-Refs, keine CSS-Selektoren.
    - `existing-session file uploads currently support one file at a time.` → senden Sie bei Chrome-MCP-Profilen einen Upload pro Aufruf.
    - `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks auf Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
    - `existing-session type does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:type` bei `profile="user"`- / Chrome-MCP-existing-session-Profilen weg, oder verwenden Sie ein verwaltetes/CDP-Browser-Profil, wenn ein benutzerdefinierter Timeout erforderlich ist.
    - `existing-session evaluate does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:evaluate` bei `profile="user"`- / Chrome-MCP-existing-session-Profilen weg, oder verwenden Sie ein verwaltetes/CDP-Browser-Profil, wenn ein benutzerdefinierter Timeout erforderlich ist.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.
    - veraltete Viewport- / Dark-Mode- / Locale- / Offline-Überschreibungen auf Attach-only- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuersitzung zu schließen und den Playwright-/CDP-Emulationszustand freizugeben, ohne den gesamten Gateway neu zu starten.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Browser (von OpenClaw verwaltet)](/de/tools/browser)
- [Browser-Fehlerbehebung](/de/tools/browser-linux-troubleshooting)

## Wenn Sie aktualisiert haben und plötzlich etwas nicht mehr funktioniert

Die meisten Ausfälle nach einem Upgrade sind Konfigurationsdrift oder strengere Standards, die nun durchgesetzt werden.

<AccordionGroup>
  <Accordion title="1. Verhalten von Authentifizierung und URL-Überschreibung hat sich geändert">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Was zu prüfen ist:

    - Wenn `gateway.mode=remote`, zielen CLI-Aufrufe möglicherweise auf die Remote-Instanz, während Ihr lokaler Dienst in Ordnung ist.
    - Explizite `--url`-Aufrufe fallen nicht auf gespeicherte Anmeldedaten zurück.

    Häufige Signaturen:

    - `gateway connect failed:` → falsches URL-Ziel.
    - `unauthorized` → Endpunkt erreichbar, aber falsche Authentifizierung.

  </Accordion>
  <Accordion title="2. Bind- und Authentifizierungs-Schutzmaßnahmen sind strenger">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    Was zu prüfen ist:

    - Nicht-Loopback-Binds (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Authentifizierungspfad: Authentifizierung per gemeinsamem Token/Passwort oder eine korrekt konfigurierte Nicht-Loopback-`trusted-proxy`-Bereitstellung.
    - Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

    Häufige Signaturen:

    - `refusing to bind gateway ... without auth` → Nicht-Loopback-Bind ohne gültigen Gateway-Authentifizierungspfad.
    - `Connectivity probe: failed`, während die Runtime läuft → Gateway ist aktiv, aber mit aktueller Authentifizierung/URL nicht zugänglich.

  </Accordion>
  <Accordion title="3. Kopplungs- und Geräteidentitätsstatus hat sich geändert">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Was zu prüfen ist:

    - Ausstehende Gerätegenehmigungen für Dashboard/Nodes.
    - Ausstehende DM-Kopplungsgenehmigungen nach Richtlinien- oder Identitätsänderungen.

    Häufige Signaturen:

    - `device identity required` → Geräteauthentifizierung nicht erfüllt.
    - `pairing required` → Absender/Gerät muss genehmigt werden.

  </Accordion>
</AccordionGroup>

Wenn Dienstkonfiguration und Runtime nach den Prüfungen weiterhin nicht übereinstimmen, installieren Sie die Dienstmetadaten aus demselben Profil-/Statusverzeichnis erneut:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [Authentifizierung](/de/gateway/authentication)
- [Hintergrund-Exec- und Prozess-Tool](/de/gateway/background-process)
- [Gateway-eigene Kopplung](/de/gateway/pairing)

## Verwandt

- [Doctor](/de/gateway/doctor)
- [FAQ](/de/help/faq)
- [Gateway-Runbook](/de/gateway)
