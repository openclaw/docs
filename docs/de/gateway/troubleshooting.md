---
read_when:
    - Der Troubleshooting-Hub hat Sie für eine weiterführende Diagnose hierher verwiesen
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen
sidebarTitle: Troubleshooting
summary: Umfassendes Fehlerbehebungs-Runbook für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-05-11T20:30:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
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

Erwartete fehlerfreie Signale:

- `openclaw gateway status` zeigt `Runtime: running`, `Connectivity probe: ok` und eine Zeile `Capability: ...`.
- `openclaw doctor` meldet keine blockierenden Konfigurations- oder Dienstprobleme.
- `openclaw channels status --probe` zeigt den Live-Transportstatus pro Konto und, sofern unterstützt, Probe-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Split-Brain-Installationen und Schutz vor neuerer Konfiguration

Verwenden Sie dies, wenn ein Gateway-Dienst nach einem Update unerwartet stoppt oder Logs zeigen, dass eine `openclaw`-Binärdatei älter ist als die Version, die zuletzt `openclaw.json` geschrieben hat.

OpenClaw versieht Konfigurationsschreibvorgänge mit `meta.lastTouchedVersion`. Schreibgeschützte Befehle können weiterhin eine von einer neueren OpenClaw-Version geschriebene Konfiguration prüfen, aber Prozess- und Dienständerungen verweigern mit einer älteren Binärdatei die Fortsetzung. Blockierte Aktionen umfassen Start, Stopp, Neustart und Deinstallation des Gateway-Dienstes, erzwungene Dienst-Neuinstallation, Gateway-Start im Dienstmodus und `gateway --force`-Portbereinigung.

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
    Entfernen Sie veraltete Systempaket- oder alte Wrapper-Einträge, die weiterhin auf eine alte `openclaw`-Binärdatei zeigen.
  </Step>
</Steps>

<Warning>
Nur für bewusstes Downgrade oder Notfallwiederherstellung: Setzen Sie `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` für den einzelnen Befehl. Lassen Sie es für den normalen Betrieb nicht gesetzt.
</Warning>

## Skill-Symlink wegen Pfad-Ausbruch übersprungen

Verwenden Sie dies, wenn Logs Folgendes enthalten:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw behandelt jeden Skill-Root als Begrenzung. Ein Symlink unter
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` oder
`~/.openclaw/skills` wird übersprungen, wenn sein tatsächliches Ziel außerhalb dieses Roots aufgelöst wird,
sofern das Ziel nicht ausdrücklich als vertrauenswürdig eingestuft ist.

Prüfen Sie den Link:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Wenn das Ziel beabsichtigt ist, konfigurieren Sie sowohl den direkten Skill-Root als auch das
zugelassene Symlink-Ziel:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Starten Sie anschließend eine neue Sitzung oder warten Sie, bis der Skills-Watcher aktualisiert wurde. Starten Sie das
Gateway neu, wenn der laufende Prozess vor der Konfigurationsänderung gestartet wurde.

Verwenden Sie keine breiten Ziele wie `~`, `/` oder einen ganzen synchronisierten Projektordner.
Beschränken Sie `allowSymlinkTargets` auf den tatsächlichen Skill-Root, der vertrauenswürdige
`SKILL.md`-Verzeichnisse enthält.

Verwandt:

- [Skills-Konfiguration](/de/tools/skills-config#symlinked-sibling-repos)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429: zusätzliche Nutzung für langen Kontext erforderlich

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf Folgendes:

- Für das ausgewählte Anthropic Opus-/Sonnet-Modell ist `params.context1m: true` gesetzt.
- Die aktuelle Anthropic-Anmeldedatenberechtigung ist nicht für die Nutzung von langem Kontext berechtigt.
- Anfragen schlagen nur bei langen Sitzungen/Modellläufen fehl, die den 1M-Beta-Pfad benötigen.

Behebungsoptionen:

<Steps>
  <Step title="context1m deaktivieren">
    Deaktivieren Sie `context1m` für dieses Modell, um auf das normale Kontextfenster zurückzufallen.
  </Step>
  <Step title="Berechtigte Anmeldedaten verwenden">
    Verwenden Sie Anthropic-Anmeldedaten, die für Anfragen mit langem Kontext berechtigt sind, oder wechseln Sie zu einem Anthropic-API-Schlüssel.
  </Step>
  <Step title="Fallback-Modelle konfigurieren">
    Konfigurieren Sie Fallback-Modelle, damit Läufe fortgesetzt werden, wenn Anthropic-Anfragen mit langem Kontext abgelehnt werden.
  </Step>
</Steps>

Verwandt:

- [Anthropic](/de/providers/anthropic)
- [Token-Nutzung und Kosten](/de/reference/token-use)
- [Warum sehe ich HTTP 429 von Anthropic?](/de/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## Lokales OpenAI-kompatibles Backend besteht direkte Probes, aber Agent-Läufe schlagen fehl

Verwenden Sie dies, wenn:

- `curl ... /v1/models` funktioniert
- winzige direkte `/v1/chat/completions`-Aufrufe funktionieren
- OpenClaw-Modellläufe nur bei normalen Agent-Turns fehlschlagen

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
  mit derselben einfachen Modell-ID funktionieren
- Backend-Fehler dazu, dass `messages[].content` eine Zeichenfolge erwartet
- zeitweise Warnungen `incomplete turn detected ... stopReason=stop payloads=0` mit einem OpenAI-kompatiblen lokalen Backend
- Backend-Abstürze, die nur bei größeren Prompt-Token-Zahlen oder vollständigen Agent-Runtime-Prompts auftreten

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `model_not_found` mit einem lokalen MLX-/vLLM-artigen Server → prüfen Sie, dass `baseUrl` `/v1` enthält, `api` für `/v1/chat/completions`-Backends `"openai-completions"` ist und `models.providers.<provider>.models[].id` die einfache provider-lokale ID ist. Wählen Sie sie einmal mit dem Provider-Präfix aus, zum Beispiel `mlx/mlx-community/Qwen3-30B-A3B-6bit`; behalten Sie den Katalogeintrag als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → Backend lehnt strukturierte Chat-Completions-Inhaltsteile ab. Behebung: `models.providers.<provider>.models[].compat.requiresStringContent: true` setzen.
    - `validation.keys` oder erlaubte Nachrichtenschlüssel wie `["role","content"]` → Backend lehnt OpenAI-artige Replay-Metadaten in Chat-Completions-Nachrichten ab. Behebung: `models.providers.<provider>.models[].compat.strictMessageKeys: true` setzen.
    - `incomplete turn detected ... stopReason=stop payloads=0` → Das Backend hat die Chat-Completions-Anfrage abgeschlossen, aber für diesen Turn keinen für den Benutzer sichtbaren Assistant-Text zurückgegeben. OpenClaw wiederholt replay-sichere leere OpenAI-kompatible Turns einmal; anhaltende Fehler bedeuten in der Regel, dass das Backend leeren/nicht-textuellen Inhalt ausgibt oder finalen Antworttext unterdrückt.
    - Direkte winzige Anfragen sind erfolgreich, aber OpenClaw-Agent-Läufe schlagen mit Backend-/Modellabstürzen fehl (zum Beispiel Gemma auf einigen `inferrs`-Builds) → Der OpenClaw-Transport ist wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Agent-Runtime-Prompt-Form.
    - Fehler werden nach dem Deaktivieren von Tools kleiner, verschwinden aber nicht → Tool-Schemas waren Teil des Drucks, aber das verbleibende Problem liegt weiterhin bei der Kapazität des Upstream-Modells/-Servers oder einem Backend-Fehler.

  </Accordion>
  <Accordion title="Behebungsoptionen">
    1. Setzen Sie `compat.requiresStringContent: true` für reine Zeichenfolgen-Chat-Completions-Backends.
    2. Setzen Sie `compat.strictMessageKeys: true` für strikte Chat-Completions-Backends, die pro Nachricht nur `role` und `content` akzeptieren.
    3. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die die Tool-Schema-Oberfläche von OpenClaw nicht zuverlässig verarbeiten können.
    4. Verringern Sie nach Möglichkeit den Prompt-Druck: kleinerer Workspace-Bootstrap, kürzerer Sitzungsverlauf, leichteres lokales Modell oder ein Backend mit stärkerer Unterstützung für langen Kontext.
    5. Wenn winzige direkte Anfragen weiterhin bestehen, während OpenClaw-Agent-Turns im Backend abstürzen, behandeln Sie dies als Upstream-Server-/Modellbeschränkung und melden Sie dort eine Reproduktion mit der akzeptierten Payload-Form.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Konfiguration](/de/gateway/configuration)
- [Lokale Modelle](/de/gateway/local-models)
- [OpenAI-kompatible Endpunkte](/de/gateway/configuration-reference#openai-compatible-endpoints)

## Keine Antworten

Wenn Channels verfügbar sind, aber nichts antwortet, prüfen Sie Routing und Richtlinie, bevor Sie etwas neu verbinden.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Achten Sie auf Folgendes:

- Pairing für DM-Absender ausstehend.
- Gruppen-Erwähnungs-Gating (`requireMention`, `mentionPatterns`).
- Abweichungen bei Channel-/Gruppen-Allowlists.

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

Achten Sie auf Folgendes:

- Korrekte Probe-URL und Dashboard-URL.
- Abweichung bei Auth-Modus/Token zwischen Client und Gateway.
- HTTP-Nutzung, obwohl Geräteidentität erforderlich ist.

<AccordionGroup>
  <Accordion title="Verbindungs-/Auth-Signaturen">
    - `device identity required` → unsicherer Kontext oder fehlende Geräte-Auth.
    - `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins` enthalten (oder Sie verbinden sich von einem Browser-Origin außerhalb von Loopback ohne ausdrückliche Allowlist).
    - `device nonce required` / `device nonce mismatch` → Client schließt den challenge-basierten Geräte-Auth-Flow nicht ab (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → Client hat die falsche Payload (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
    - `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Client kann einen vertrauenswürdigen Wiederholungsversuch mit zwischengespeichertem Gerätetoken durchführen.
    - Dieser Wiederholungsversuch mit zwischengespeichertem Token verwendet die zwischengespeicherte Scope-Menge, die mit dem gepairten Gerätetoken gespeichert ist. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihre angeforderte Scope-Menge.
    - `AUTH_SCOPE_MISMATCH` → Das Gerätetoken wurde erkannt, aber seine genehmigten Scopes decken diese Verbindungsanfrage nicht ab; pairen Sie erneut oder genehmigen Sie den angeforderten Scope-Vertrag, statt ein gemeinsam genutztes Gateway-Token zu rotieren.
    - Außerhalb dieses Wiederholungspfads lautet die Connect-Auth-Priorität: zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Gerätetoken, dann Bootstrap-Token.
    - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, ip}` serialisiert, bevor der Limiter den Fehler erfasst. Zwei fehlerhafte gleichzeitige Wiederholungen vom selben Client können daher beim zweiten Versuch `retry later` statt zweier einfacher Abweichungen anzeigen.
    - `too many failed authentication attempts (retry later)` von einem Browser-Origin-Loopback-Client → wiederholte Fehler von demselben normalisierten `Origin` werden vorübergehend ausgesperrt; ein anderer localhost-Origin verwendet einen separaten Bucket.
    - wiederholtes `unauthorized` nach diesem Wiederholungsversuch → Drift bei gemeinsamem Token/Gerätetoken; aktualisieren Sie die Token-Konfiguration und genehmigen/rotieren Sie das Gerätetoken bei Bedarf erneut.
    - `gateway connect failed:` → falsches Host-/Port-/URL-Ziel.

  </Accordion>
</AccordionGroup>

### Schnellzuordnung für Auth-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                  | Bedeutung                                                                                                                                                                                      | Empfohlene Aktion                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | Client hat ein erforderliches gemeinsames Token nicht gesendet.                                                                                                                                                 | Token im Client einfügen/festlegen und erneut versuchen. Für Dashboard-Pfade: `openclaw config get gateway.auth.token` und dann in die Einstellungen der Control UI einfügen.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | Gemeinsames Token stimmte nicht mit dem Auth-Token des Gateway überein.                                                                                                                                               | Wenn `canRetryWithDeviceToken=true` ist, erlauben Sie einen vertrauenswürdigen erneuten Versuch. Wiederholungen mit zwischengespeichertem Token verwenden gespeicherte genehmigte Scopes erneut; Aufrufer mit explizitem `deviceToken` / `scopes` behalten angeforderte Scopes bei. Wenn der Fehler weiterhin auftritt, führen Sie die [Checkliste zur Wiederherstellung bei Token-Drift](/de/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Zwischengespeichertes gerätespezifisches Token ist veraltet oder widerrufen.                                                                                                                                                 | Gerätetoken mit der [Geräte-CLI](/de/cli/devices) rotieren/erneut genehmigen, dann erneut verbinden.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | Gerätetoken ist gültig, aber seine genehmigte Rolle/seine genehmigten Scopes decken diese Verbindungsanforderung nicht ab.                                                                                                       | Koppeln Sie das Gerät erneut oder genehmigen Sie den angeforderten Scope-Vertrag; behandeln Sie dies nicht als Drift des gemeinsamen Tokens.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | Geräteidentität benötigt Genehmigung. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade`, und verwenden Sie `requestId` / `remediationHint`, wenn vorhanden. | Ausstehende Anforderung genehmigen: `openclaw devices list`, dann `openclaw devices approve <requestId>`. Scope-/Rollen-Upgrades verwenden denselben Ablauf, nachdem Sie den angeforderten Zugriff geprüft haben.                                                                                                               |

<Note>
Direkte loopback-Backend-RPCs, die mit dem gemeinsamen Gateway-Token/Passwort authentifiziert sind, sollten nicht von der Scope-Basislinie der gekoppelten Geräte der CLI abhängen. Wenn Subagents oder andere interne Aufrufe weiterhin mit `scope-upgrade` fehlschlagen, prüfen Sie, ob der Aufrufer `client.id: "gateway-client"` und `client.mode: "backend"` verwendet und kein explizites `deviceIdentity` oder Gerätetoken erzwingt.
</Note>

Migrationsprüfung für Geräteauthentifizierung v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler anzeigen, aktualisieren Sie den verbindenden Client und prüfen Sie ihn:

<Steps>
  <Step title="Auf connect.challenge warten">
    Client wartet auf das vom Gateway ausgegebene `connect.challenge`.
  </Step>
  <Step title="Payload signieren">
    Client signiert die an die Challenge gebundene Payload.
  </Step>
  <Step title="Geräte-Nonce senden">
    Client sendet `connect.params.device.nonce` mit derselben Challenge-Nonce.
  </Step>
</Steps>

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet verweigert wird:

- Sitzungen mit gekoppeltem Gerätetoken können nur **ihr eigenes** Gerät verwalten, sofern der Aufrufer nicht auch `operator.admin` hat
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern, die die Aufrufersitzung bereits besitzt

Verwandt:

- [Konfiguration](/de/gateway/configuration) (Gateway-Auth-Modi)
- [Control UI](/de/web/control-ui)
- [Geräte](/de/cli/devices)
- [Remote-Zugriff](/de/gateway/remote)
- [Vertrauenswürdige Proxy-Auth](/de/gateway/trusted-proxy-auth)

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
- Abweichung in der Dienstkonfiguration (`Config (cli)` gegenüber `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche launchd-/systemd-/schtasks-Installationen, wenn `--deep` verwendet wird.
- Bereinigungshinweise zu `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → lokaler Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde überschrieben und hat `gateway.mode` verloren. Behebung: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration, oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete lokale Moduskonfiguration neu zu stempeln. Wenn Sie OpenClaw über Podman ausführen, ist der Standardkonfigurationspfad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → Nicht-loopback-Bindung ohne gültigen Gateway-Auth-Pfad (Token/Passwort oder trusted-proxy, wenn konfiguriert).
    - `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
    - `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Einheiten existieren. Die meisten Setups sollten ein Gateway pro Maschine behalten; wenn Sie mehr als eines benötigen, isolieren Sie Ports + Konfiguration/Zustand/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` von doctor → eine systemd-Systemeinheit existiert, während der Dienst auf Benutzerebene fehlt. Entfernen oder deaktivieren Sie das Duplikat, bevor Sie doctor erlauben, einen Benutzerdienst zu installieren, oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn die Systemeinheit der beabsichtigte Supervisor ist.
    - `Gateway service port does not match current gateway config` → der installierte Supervisor pinnt weiterhin den alten `--port`. Führen Sie `openclaw doctor --fix` oder `openclaw gateway install --force` aus, und starten Sie dann den Gateway-Dienst neu.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Hintergrundausführung und Prozess-Tool](/de/gateway/background-process)
- [Konfiguration](/de/gateway/configuration)
- [Doctor](/de/gateway/doctor)

## Gateway hat ungültige Konfiguration abgelehnt

Verwenden Sie dies, wenn der Gateway-Start mit `Invalid config` fehlschlägt oder Hot-Reload-Logs melden,
dass eine ungültige Bearbeitung übersprungen wurde.

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
- Eine mit Zeitstempel versehene Datei `openclaw.json.clobbered.*`, wenn `doctor --fix` eine fehlerhafte direkte Bearbeitung repariert hat

<AccordionGroup>
  <Accordion title="Was passiert ist">
    - Die Konfiguration wurde beim Start, beim Hot Reload oder bei einem OpenClaw-eigenen Schreibvorgang nicht validiert.
    - Gateway-Start schlägt geschlossen fehl, statt `openclaw.json` neu zu schreiben.
    - Hot Reload überspringt ungültige externe Bearbeitungen und hält die aktuelle Laufzeitkonfiguration aktiv.
    - OpenClaw-eigene Schreibvorgänge lehnen ungültige/destruktive Payloads vor dem Commit ab und speichern `.rejected.*`.
    - `openclaw doctor --fix` besitzt die Reparatur. Es kann Nicht-JSON-Präfixe entfernen oder die letzte als gut bekannte Kopie wiederherstellen, während die abgelehnte Payload als `.clobbered.*` erhalten bleibt.

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
    - `.clobbered.*` existiert → doctor hat eine fehlerhafte externe Bearbeitung erhalten, während die aktive Konfiguration repariert wurde.
    - `.rejected.*` existiert → ein OpenClaw-eigener Konfigurationsschreibvorgang ist vor dem Commit an Schema- oder Clobber-Prüfungen gescheitert.
    - `Config write rejected:` → der Schreibvorgang versuchte, erforderliche Struktur zu entfernen, die Datei stark zu verkleinern oder ungültige Konfiguration zu persistieren.
    - `config reload skipped (invalid config):` → eine direkte Bearbeitung ist an der Validierung gescheitert und wurde vom laufenden Gateway ignoriert.
    - `Invalid config at ...` → Start ist fehlgeschlagen, bevor Gateway-Dienste gestartet wurden.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oder `size-drop-vs-last-good:*` → ein OpenClaw-eigener Schreibvorgang wurde abgelehnt, weil er Felder oder Größe im Vergleich zum Last-known-good-Backup verloren hat.
    - `Config last-known-good promotion skipped` → der Kandidat enthielt redigierte Secret-Platzhalter wie `***`.

  </Accordion>
  <Accordion title="Behebungsoptionen">
    1. Führen Sie `openclaw doctor --fix` aus, damit doctor eine Konfiguration mit Präfix/Clobber repariert oder Last-known-good wiederherstellt.
    2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*`, und wenden Sie sie dann mit `openclaw config set` oder `config.patch` an.
    3. Führen Sie `openclaw config validate` vor dem Neustart aus.
    4. Wenn Sie von Hand bearbeiten, behalten Sie die vollständige JSON5-Konfiguration bei, nicht nur das Teilobjekt, das Sie ändern wollten.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Config](/de/cli/config)
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
- Ob sich die Warnung auf SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Auth-Referenzen bezieht.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-Einrichtung ist fehlgeschlagen, aber der Befehl hat weiterhin direkte konfigurierte/loopback-Ziele versucht.
- `multiple reachable gateways detected` → mehr als ein Ziel hat geantwortet. Normalerweise bedeutet dies ein beabsichtigtes Multi-Gateway-Setup oder veraltete/duplizierte Listener.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → Verbindung hat funktioniert, aber Detail-RPC ist durch Scopes eingeschränkt; koppeln Sie die Geräteidentität oder verwenden Sie Zugangsdaten mit `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → Verbindung hat funktioniert, aber der vollständige Diagnose-RPC-Satz ist abgelaufen oder fehlgeschlagen. Behandeln Sie dies als erreichbares Gateway mit eingeschränkter Diagnose; vergleichen Sie `connect.ok` und `connect.rpcOk` in der `--json`-Ausgabe.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → das Gateway hat geantwortet, aber dieser Client benötigt vor normalem Operator-Zugriff noch Kopplung/Genehmigung.
- nicht aufgelöster `gateway.auth.*` / `gateway.remote.*` SecretRef-Warnungstext → Auth-Material war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [Gateway](/de/cli/gateway)
- [Mehrere Gateways auf demselben Host](/de/gateway#multiple-gateways-same-host)
- [Remote-Zugriff](/de/gateway/remote)

## Kanal verbunden, Nachrichten fließen nicht

Wenn der Kanalstatus verbunden ist, aber der Nachrichtenfluss nicht funktioniert, konzentrieren Sie sich auf Richtlinien, Berechtigungen und kanalspezifische Zustellregeln.

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

Häufige Signaturen:

- `mention required` → Nachricht durch Gruppen-Erwähnungsrichtlinie ignoriert.
- `pairing` / Spuren ausstehender Genehmigung → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Problem mit Kanal-Authentifizierung/-Berechtigungen.

Verwandt:

- [Kanal-Fehlerbehebung](/de/channels/troubleshooting)
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

- Cron aktiviert und nächste Ausführung vorhanden.
- Status des Job-Ausführungsverlaufs (`ok`, `skipped`, `error`).
- Heartbeat-Überspringgründe (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron deaktiviert.
    - `cron: timer tick failed` → Scheduler-Tick fehlgeschlagen; Datei-/Log-/Laufzeitfehler prüfen.
    - `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des aktiven Zeitfensters.
    - `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur leere Zeilen / Markdown-Überschriften, daher überspringt OpenClaw den Modellaufruf.
    - `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber keine der Aufgaben ist bei diesem Tick fällig.
    - `heartbeat: unknown accountId` → ungültige Konto-ID für das Heartbeat-Zustellziel.
    - `heartbeat skipped` mit `reason=dm-blocked` → Heartbeat-Ziel wurde als DM-artiges Ziel aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder eine agentenspezifische Überschreibung) auf `block` gesetzt ist.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Heartbeat](/de/gateway/heartbeat)
- [Geplante Aufgaben](/de/automation/cron-jobs)
- [Geplante Aufgaben: Fehlerbehebung](/de/automation/cron-jobs#troubleshooting)

## Node gekoppelt, Tool schlägt fehl

Wenn eine Node gekoppelt ist, aber Tools fehlschlagen, isolieren Sie Vordergrund-, Berechtigungs- und Genehmigungsstatus.

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
- Gültigen Pfad zur Browser-Executable.
- Erreichbarkeit des CDP-Profils.
- Lokale Chrome-Verfügbarkeit für `existing-session`- / `user`-Profile.

<AccordionGroup>
  <Accordion title="Plugin- / Executable-Signaturen">
    - `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin ist durch `plugins.allow` ausgeschlossen.
    - Browser-Tool fehlt / nicht verfügbar, obwohl `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
    - `Failed to start Chrome CDP on port` → Browser-Prozess konnte nicht gestartet werden.
    - `browser.executablePath not found` → konfigurierter Pfad ist ungültig.
    - `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
    - `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen ungültigen oder außerhalb des Bereichs liegenden Port.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → der aktuellen Gateway-Installation fehlt die zentrale Browser-Laufzeitabhängigkeit; installieren oder aktualisieren Sie OpenClaw erneut und starten Sie dann den Gateway neu. ARIA-Snapshots und einfache Seiten-Screenshots können weiterhin funktionieren, aber Navigation, KI-Snapshots, Element-Screenshots per CSS-Selektor und PDF-Export bleiben nicht verfügbar.

  </Accordion>
  <Accordion title="Chrome-MCP- / Existing-Session-Signaturen">
    - `Could not find DevToolsActivePort for chrome` → Chrome-MCP-Existing-Session konnte noch nicht an das ausgewählte Browser-Datenverzeichnis anhängen. Öffnen Sie die Browser-Inspektionsseite, aktivieren Sie Remote-Debugging, lassen Sie den Browser geöffnet, genehmigen Sie die erste Anhängeaufforderung und versuchen Sie es erneut. Wenn ein angemeldeter Zustand nicht erforderlich ist, bevorzugen Sie das verwaltete Profil `openclaw`.
    - `No Chrome tabs found for profile="user"` → das Chrome-MCP-Anhängeprofil hat keine geöffneten lokalen Chrome-Tabs.
    - `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
    - `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → Attach-only-Profil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber der CDP-WebSocket konnte dennoch nicht geöffnet werden.

  </Accordion>
  <Accordion title="Element- / Screenshot- / Upload-Signaturen">
    - `fullPage is not supported for element screenshots` → Screenshot-Anfrage hat `--full-page` mit `--ref` oder `--element` kombiniert.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome-MCP- / `existing-session`-Screenshot-Aufrufe müssen Seitenerfassung oder ein Snapshot-`--ref` verwenden, nicht CSS-`--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome-MCP-Upload-Hooks benötigen Snapshot-Refs, keine CSS-Selektoren.
    - `existing-session file uploads currently support one file at a time.` → senden Sie bei Chrome-MCP-Profilen einen Upload pro Aufruf.
    - `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks bei Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
    - `existing-session type does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:type` bei `profile="user"`- / Chrome-MCP-Existing-Session-Profilen weg, oder verwenden Sie ein verwaltetes/CDP-Browserprofil, wenn ein benutzerdefiniertes Timeout erforderlich ist.
    - `existing-session evaluate does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:evaluate` bei `profile="user"`- / Chrome-MCP-Existing-Session-Profilen weg, oder verwenden Sie ein verwaltetes/CDP-Browserprofil, wenn ein benutzerdefiniertes Timeout erforderlich ist.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.
    - veraltete Viewport- / Dark-Mode- / Locale- / Offline-Überschreibungen bei Attach-only- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuersitzung zu schließen und den Playwright-/CDP-Emulationsstatus freizugeben, ohne den gesamten Gateway neu zu starten.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Browser (von OpenClaw verwaltet)](/de/tools/browser)
- [Browser-Fehlerbehebung](/de/tools/browser-linux-troubleshooting)

## Wenn Sie aktualisiert haben und plötzlich etwas nicht mehr funktioniert

Die meisten Ausfälle nach einem Upgrade sind Konfigurationsdrift oder strengere Defaults, die jetzt durchgesetzt werden.

<AccordionGroup>
  <Accordion title="1. Authentifizierungs- und URL-Override-Verhalten geändert">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Was zu prüfen ist:

    - Wenn `gateway.mode=remote`, zielen CLI-Aufrufe möglicherweise auf remote, während Ihr lokaler Dienst in Ordnung ist.
    - Explizite `--url`-Aufrufe fallen nicht auf gespeicherte Zugangsdaten zurück.

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

    Was zu prüfen ist:

    - Nicht-Loopback-Binds (`lan`, `tailnet`, `custom`) benötigen einen gültigen Gateway-Authentifizierungspfad: gemeinsame Token-/Passwort-Authentifizierung oder eine korrekt konfigurierte Nicht-Loopback-`trusted-proxy`-Bereitstellung.
    - Alte Schlüssel wie `gateway.token` ersetzen `gateway.auth.token` nicht.

    Häufige Signaturen:

    - `refusing to bind gateway ... without auth` → Nicht-Loopback-Bind ohne gültigen Gateway-Authentifizierungspfad.
    - `Connectivity probe: failed`, während die Laufzeit ausgeführt wird → Gateway läuft, ist aber mit aktueller Authentifizierung/URL nicht zugänglich.

  </Accordion>
  <Accordion title="3. Kopplungs- und Geräteidentitätsstatus geändert">
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

Wenn Dienstkonfiguration und Laufzeit nach den Prüfungen weiterhin voneinander abweichen, installieren Sie die Dienstmetadaten aus demselben Profil-/Statusverzeichnis erneut:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [Authentifizierung](/de/gateway/authentication)
- [Background-Exec und Prozess-Tool](/de/gateway/background-process)
- [Gateway-eigene Kopplung](/de/gateway/pairing)

## Verwandt

- [Doctor](/de/gateway/doctor)
- [FAQ](/de/help/faq)
- [Gateway-Runbook](/de/gateway)
