---
read_when:
    - Der Troubleshooting-Hub hat Sie zur tiefergehenden Diagnose hierher verwiesen
    - Sie benötigen stabile, symptombasierte Runbook-Abschnitte mit exakten Befehlen
sidebarTitle: Troubleshooting
summary: Ausführliches Troubleshooting-Runbook für Gateway, Kanäle, Automatisierung, Nodes und Browser
title: Fehlerbehebung
x-i18n:
    generated_at: "2026-06-27T17:34:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

Diese Seite ist das ausführliche Runbook. Beginnen Sie mit [/help/troubleshooting](/de/help/troubleshooting), wenn Sie zuerst den schnellen Triage-Ablauf nutzen möchten.

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
- `openclaw channels status --probe` zeigt den Live-Transportstatus pro Konto und, sofern unterstützt, Probe-/Audit-Ergebnisse wie `works` oder `audit ok`.

## Nach einem Update

Verwenden Sie dies, wenn ein Update abgeschlossen ist, der Gateway aber nicht läuft, Channels leer sind oder
Modellaufrufe mit 401-Fehlern fehlschlagen.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

Achten Sie auf:

- `Update restart` in `openclaw status` / `openclaw status --all`. Ausstehende oder
  fehlgeschlagene Übergaben enthalten den nächsten auszuführenden Befehl.
- `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`
  unter Channels. Das bedeutet, dass die Channel-Konfiguration noch vorhanden ist, die Plugin-
  Registrierung aber fehlgeschlagen ist, bevor der Channel geladen werden konnte.
- Provider-401-Fehler nach erneuter Authentifizierung. `openclaw doctor --fix` prüft auf veraltete
  OAuth-Auth-Schatten pro Agent und entfernt die alten Kopien, sodass alle Agents
  das aktuelle gemeinsame Profil auflösen.

## Split-Brain-Installationen und Schutz für neuere Konfigurationen

Verwenden Sie dies, wenn ein Gateway-Dienst nach einem Update unerwartet stoppt oder Logs zeigen, dass ein `openclaw`-Binary älter ist als die Version, die zuletzt `openclaw.json` geschrieben hat.

OpenClaw versieht Konfigurationsschreibvorgänge mit `meta.lastTouchedVersion`. Schreibgeschützte Befehle können weiterhin eine Konfiguration prüfen, die von einem neueren OpenClaw geschrieben wurde, aber Prozess- und Dienstmutationen verweigern die Fortsetzung mit einem älteren Binary. Blockierte Aktionen umfassen Start, Stopp, Neustart und Deinstallation des Gateway-Dienstes, erzwungene Dienstneuinstallation, Gateway-Start im Dienstmodus und `gateway --force`-Portbereinigung.

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
  <Step title="Gateway-Dienst neu installieren">
    Installieren Sie den beabsichtigten Gateway-Dienst aus der neueren Installation neu:

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="Veraltete Wrapper entfernen">
    Entfernen Sie veraltete Systempakete oder alte Wrapper-Einträge, die weiterhin auf ein altes `openclaw`-Binary zeigen.
  </Step>
</Steps>

<Warning>
Nur für absichtliches Downgrade oder Notfallwiederherstellung: Setzen Sie `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1` für den einzelnen Befehl. Lassen Sie es im Normalbetrieb unset.
</Warning>

## Protokollkonflikt nach Rollback

Verwenden Sie dies, wenn Logs nach einem Downgrade oder Rollback von OpenClaw weiterhin `protocol mismatch` ausgeben. Das bedeutet, dass ein älterer Gateway läuft, aber ein neuerer lokaler Clientprozess weiterhin versucht, sich mit einem Protokollbereich neu zu verbinden, den der ältere Gateway nicht sprechen kann.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

Achten Sie auf:

- `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>` in Gateway-Logs.
- `Established clients:` in `openclaw gateway status --deep` oder `Gateway clients` in `openclaw doctor --deep`. Dies listet aktive TCP-Clients auf, die mit dem Gateway-Port verbunden sind, einschließlich PIDs und Befehlszeilen, wenn das Betriebssystem dies erlaubt.
- Einen Clientprozess, dessen Befehlszeile auf die neuere OpenClaw-Installation oder den Wrapper zeigt, von der bzw. dem Sie zurückgerollt haben.

Behebung:

1. Stoppen oder starten Sie den veralteten OpenClaw-Clientprozess neu, der von `gateway status --deep` angezeigt wird.
2. Starten Sie Apps oder Wrapper neu, die OpenClaw einbetten, etwa lokale Dashboards, Editoren, App-Server-Helfer oder lange laufende `openclaw logs --follow`-Shells.
3. Führen Sie `openclaw gateway status --deep` oder `openclaw doctor --deep` erneut aus und bestätigen Sie, dass die veraltete Client-PID verschwunden ist.

Bringen Sie einen älteren Gateway nicht dazu, ein neueres inkompatibles Protokoll zu akzeptieren. Protokoll-Bumps schützen den Wire-Vertrag; Rollback-Wiederherstellung ist ein Prozess-/Versionsbereinigungsproblem.

## Skill-Symlink wegen Pfad-Ausbruch übersprungen

Verwenden Sie dies, wenn Logs Folgendes enthalten:

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw behandelt jeden Skill-Root als Containment-Grenze. Ein Symlink unter
`~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` oder
`~/.openclaw/skills` wird übersprungen, wenn sein reales Ziel außerhalb dieses Roots aufgelöst wird,
es sei denn, das Ziel ist ausdrücklich vertrauenswürdig.

Prüfen Sie den Link:

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

Wenn das Ziel beabsichtigt ist, konfigurieren Sie sowohl den direkten Skill-Root als auch das
erlaubte Symlink-Ziel:

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

Starten Sie anschließend eine neue Sitzung oder warten Sie, bis der Skills-Watcher aktualisiert. Starten Sie den
Gateway neu, wenn der laufende Prozess älter als die Konfigurationsänderung ist.

Verwenden Sie keine breiten Ziele wie `~`, `/` oder einen ganzen synchronisierten Projektordner.
Halten Sie `allowSymlinkTargets` auf den realen Skill-Root beschränkt, der vertrauenswürdige
`SKILL.md`-Verzeichnisse enthält.

Wenn Skill Workshop apply ebenfalls durch diese vertrauenswürdigen symlinkten
Workspace-Skill-Pfade schreiben soll, aktivieren Sie `skills.workshop.allowSymlinkTargetWrites`. Lassen Sie
es für schreibgeschützte gemeinsame Skill-Roots deaktiviert.

Verwandt:

- [Skills-Konfiguration](/de/tools/skills-config#symlinked-skill-roots)
- [Konfigurationsbeispiele](/de/gateway/configuration-examples#symlinked-sibling-skill-repo)

## Anthropic 429: Zusätzliche Nutzung für langen Kontext erforderlich

Verwenden Sie dies, wenn Logs/Fehler Folgendes enthalten: `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Achten Sie auf:

- Das ausgewählte Anthropic-Modell ist ein GA-fähiges 1M-Claude-4.x-Modell, oder das Modell hat das veraltete `params.context1m: true`.
- Die aktuellen Anthropic-Anmeldedaten sind nicht für Long-Context-Nutzung berechtigt.
- Anfragen schlagen nur bei langen Sitzungen/Modellläufen fehl, die den 1M-Kontextpfad benötigen.

Behebungsoptionen:

<Steps>
  <Step title="Standard-Kontextfenster verwenden">
    Wechseln Sie zu einem Modell mit Standardfenster, oder entfernen Sie veraltetes `context1m` aus älterer
    Modellkonfiguration, die nicht GA-fähig für 1M-Kontext ist.
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

## Upstream-403-blockierte Antworten

Verwenden Sie dies, wenn ein Upstream-LLM-Provider ein generisches `403` zurückgibt, etwa
`Your request was blocked`.

Gehen Sie nicht davon aus, dass dies immer ein OpenClaw-Konfigurationsproblem ist. Die Antwort kann
von einer Upstream-Sicherheitsschicht stammen, etwa einem CDN, einer WAF, einer Bot-Management-Regel oder
einem Reverse Proxy vor einem OpenAI-kompatiblen Endpunkt.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

Achten Sie auf:

- mehrere Modelle unter demselben Provider schlagen auf die gleiche Weise fehl
- HTML oder generischer Sicherheitstext statt eines normalen Provider-API-Fehlers
- Provider-seitige Sicherheitsereignisse zur gleichen Anfragezeit
- eine winzige direkte `curl`-Probe ist erfolgreich, während normale SDK-förmige Anfragen fehlschlagen

Beheben Sie zuerst die Provider-seitige Filterung, wenn die Belege auf eine WAF-/CDN-
Blockierung hindeuten. Bevorzugen Sie eine eng begrenzte Allow- oder Skip-Regel für den API-Pfad, den OpenClaw
verwendet, und vermeiden Sie es, den Schutz für die ganze Site zu deaktivieren.

<Warning>
Ein erfolgreicher minimaler `curl` garantiert nicht, dass echte SDK-artige Anfragen
dieselbe Upstream-Sicherheitsschicht passieren.
</Warning>

Verwandt:

- [OpenAI-kompatible Endpunkte](/de/gateway/configuration-reference#openai-compatible-endpoints)
- [Provider-Konfiguration](/de/providers)
- [Logs](/de/logging)

## Lokales OpenAI-kompatibles Backend besteht direkte Proben, aber Agent-Läufe schlagen fehl

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

Achten Sie auf:

- direkte winzige Aufrufe sind erfolgreich, aber OpenClaw-Läufe schlagen nur bei größeren Prompts fehl
- `model_not_found`- oder 404-Fehler, obwohl direkte `/v1/chat/completions`
  mit derselben nackten Modell-ID funktionieren
- Backend-Fehler darüber, dass `messages[].content` einen String erwartet
- sporadische Warnungen `incomplete turn detected ... stopReason=stop payloads=0` mit einem OpenAI-kompatiblen lokalen Backend
- Backend-Abstürze, die nur bei größeren Prompt-Token-Zahlen oder vollständigen Agent-Runtime-Prompts auftreten

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `model_not_found` mit einem lokalen MLX-/vLLM-artigen Server → prüfen Sie, dass `baseUrl` `/v1` enthält, `api` für `/v1/chat/completions`-Backends `"openai-completions"` ist und `models.providers.<provider>.models[].id` die nackte Provider-lokale ID ist. Wählen Sie es einmal mit dem Provider-Präfix aus, zum Beispiel `mlx/mlx-community/Qwen3-30B-A3B-6bit`; behalten Sie den Katalogeintrag als `mlx-community/Qwen3-30B-A3B-6bit`.
    - `messages[...].content: invalid type: sequence, expected a string` → Backend lehnt strukturierte Chat Completions-Inhaltsteile ab. Behebung: setzen Sie `models.providers.<provider>.models[].compat.requiresStringContent: true`.
    - `validation.keys` oder erlaubte Nachrichtenschlüssel wie `["role","content"]` → Backend lehnt OpenAI-artige Replay-Metadaten auf Chat Completions-Nachrichten ab. Behebung: setzen Sie `models.providers.<provider>.models[].compat.strictMessageKeys: true`.
    - `incomplete turn detected ... stopReason=stop payloads=0` → das Backend hat die Chat Completions-Anfrage abgeschlossen, aber keinen für Benutzer sichtbaren Assistant-Text für diesen Turn zurückgegeben. OpenClaw wiederholt replay-sichere leere OpenAI-kompatible Turns einmal; anhaltende Fehler bedeuten meist, dass das Backend leere/nicht-textuelle Inhalte ausgibt oder Final-Answer-Text unterdrückt.
    - direkte winzige Anfragen sind erfolgreich, aber OpenClaw-Agent-Läufe schlagen mit Backend-/Modellabstürzen fehl (zum Beispiel Gemma auf einigen `inferrs`-Builds) → der OpenClaw-Transport ist wahrscheinlich bereits korrekt; das Backend scheitert an der größeren Agent-Runtime-Prompt-Form.
    - Fehler werden nach Deaktivieren von Tools kleiner, verschwinden aber nicht → Tool-Schemas waren Teil des Drucks, aber das verbleibende Problem ist weiterhin Upstream-Modell-/Serverkapazität oder ein Backend-Bug.

  </Accordion>
  <Accordion title="Behebungsoptionen">
    1. Setzen Sie `compat.requiresStringContent: true` für string-only Chat Completions-Backends.
    2. Setzen Sie `compat.strictMessageKeys: true` für strikte Chat Completions-Backends, die auf jeder Nachricht nur `role` und `content` akzeptieren.
    3. Setzen Sie `compat.supportsTools: false` für Modelle/Backends, die OpenClaws Tool-Schema-Oberfläche nicht zuverlässig verarbeiten können.
    4. Senken Sie den Prompt-Druck, wo möglich: kleinerer Workspace-Bootstrap, kürzere Sitzungshistorie, leichteres lokales Modell oder ein Backend mit stärkerer Long-Context-Unterstützung.
    5. Wenn winzige direkte Anfragen weiterhin funktionieren, während OpenClaw-Agent-Turns noch im Backend abstürzen, behandeln Sie dies als Upstream-Server-/Modellbeschränkung und reichen Sie dort eine Repro mit der akzeptierten Payload-Form ein.
  </Accordion>
</AccordionGroup>

Verwandt:

- [Konfiguration](/de/gateway/configuration)
- [Lokale Modelle](/de/gateway/local-models)
- [OpenAI-kompatible Endpunkte](/de/gateway/configuration-reference#openai-compatible-endpoints)

## Keine Antworten

Wenn Channels aktiv sind, aber nichts antwortet, prüfen Sie Routing und Richtlinien, bevor Sie etwas neu verbinden.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Achten Sie auf:

- Ausstehendes Pairing für DM-Absender.
- Erwähnungs-Gating in Gruppen (`requireMention`, `mentionPatterns`).
- Abweichungen bei Channel-/Gruppen-Allowlists.

Häufige Signaturen:

- `drop guild message (mention required` → Gruppennachricht wird bis zur Erwähnung ignoriert.
- `pairing request` → Absender benötigt Genehmigung.
- `blocked` / `allowlist` → Absender/Channel wurde durch Richtlinie gefiltert.

Verwandt:

- [Channel-Fehlerbehebung](/de/channels/troubleshooting)
- [Gruppen](/de/channels/groups)
- [Pairing](/de/channels/pairing)

## Dashboard-Control-UI-Konnektivität

Wenn Dashboard/Control UI keine Verbindung herstellt, prüfen Sie URL, Auth-Modus und Annahmen zum sicheren Kontext.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Achten Sie auf:

- Korrekte Probe-URL und Dashboard-URL.
- Abweichung von Auth-Modus/Token zwischen Client und Gateway.
- HTTP-Nutzung, obwohl Geräteidentität erforderlich ist.

Wenn ein lokaler Browser nach einem Update keine Verbindung zu `127.0.0.1:18789` herstellen kann, stellen Sie zuerst den lokalen Gateway-Dienst wieder her und bestätigen Sie, dass er das Dashboard bereitstellt:

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

Wenn `curl` OpenClaw-HTML zurückgibt, funktioniert der Gateway, und das verbleibende Problem ist wahrscheinlich Browser-Cache, ein alter Deep Link oder veralteter Tab-Zustand. Öffnen Sie `http://127.0.0.1:18789` direkt und navigieren Sie vom Dashboard aus. Wenn der Dienst nach einem Neustart nicht weiterläuft, führen Sie `openclaw gateway start` aus und prüfen Sie `openclaw gateway status` erneut.

<AccordionGroup>
  <Accordion title="Verbindungs-/Auth-Signaturen">
    - `device identity required` → nicht sicherer Kontext oder fehlende Geräte-Auth.
    - `origin not allowed` → Browser-`Origin` ist nicht in `gateway.controlUi.allowedOrigins` enthalten (oder Sie verbinden sich von einem Nicht-Loopback-Browser-Origin ohne explizite Allowlist).
    - `device nonce required` / `device nonce mismatch` → Client schließt den Challenge-basierten Geräte-Auth-Flow nicht ab (`connect.challenge` + `device.nonce`).
    - `device signature invalid` / `device signature expired` → Client hat die falsche Nutzlast (oder einen veralteten Zeitstempel) für den aktuellen Handshake signiert.
    - `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Client kann einen vertrauenswürdigen Wiederholungsversuch mit zwischengespeichertem Geräte-Token ausführen.
    - Dieser Cached-Token-Wiederholungsversuch verwendet den zwischengespeicherten Scope-Satz erneut, der mit dem gekoppelten Geräte-Token gespeichert ist. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen ihren angeforderten Scope-Satz.
    - `AUTH_SCOPE_MISMATCH` → das Geräte-Token wurde erkannt, aber seine genehmigten Scopes decken diese Verbindungsanfrage nicht ab; koppeln Sie erneut oder genehmigen Sie den angeforderten Scope-Vertrag, statt ein gemeinsam genutztes Gateway-Token zu rotieren.
    - Außerhalb dieses Wiederholungsversuchspfads ist die Auth-Priorität beim Verbinden zuerst explizites gemeinsames Token/Passwort, dann explizites `deviceToken`, dann gespeichertes Geräte-Token, dann Bootstrap-Token.
    - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, ip}` serialisiert, bevor der Limiter den Fehler erfasst. Zwei fehlerhafte gleichzeitige Wiederholungsversuche desselben Clients können daher beim zweiten Versuch `retry later` statt zwei einfacher Abweichungen anzeigen.
    - `too many failed authentication attempts (retry later)` von einem Browser-Origin-Loopback-Client → wiederholte Fehler von demselben normalisierten `Origin` werden vorübergehend gesperrt; ein anderer Localhost-Origin verwendet einen separaten Bucket.
    - Wiederholtes `unauthorized` nach diesem Wiederholungsversuch → gemeinsames Token/Geräte-Token ist abgedriftet; aktualisieren Sie die Token-Konfiguration und genehmigen/rotieren Sie das Geräte-Token bei Bedarf erneut.
    - `gateway connect failed:` → falsches Host-/Port-/URL-Ziel.

  </Accordion>
</AccordionGroup>

### Schnellübersicht der Auth-Detailcodes

Verwenden Sie `error.details.code` aus der fehlgeschlagenen `connect`-Antwort, um die nächste Aktion auszuwählen:

| Detailcode                   | Bedeutung                                                                                                                                                                                       | Empfohlene Aktion                                                                                                                                                                                                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AUTH_TOKEN_MISSING`         | Client hat kein erforderliches gemeinsames Token gesendet.                                                                                                                                       | Token im Client einfügen/festlegen und erneut versuchen. Für Dashboard-Pfade: `openclaw config get gateway.auth.token` und dann in die Control-UI-Einstellungen einfügen.                                                                                                                |
| `AUTH_TOKEN_MISMATCH`        | Gemeinsames Token stimmte nicht mit dem Gateway-Auth-Token überein.                                                                                                                              | Wenn `canRetryWithDeviceToken=true`, erlauben Sie einen vertrauenswürdigen Wiederholungsversuch. Cached-Token-Wiederholungen verwenden gespeicherte genehmigte Scopes erneut; Aufrufer mit explizitem `deviceToken` / `scopes` behalten angeforderte Scopes. Wenn es weiterhin fehlschlägt, führen Sie die [Checkliste zur Wiederherstellung bei Token-Drift](/de/cli/devices#token-drift-recovery-checklist) aus. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | Zwischengespeichertes Token pro Gerät ist veraltet oder widerrufen.                                                                                                                             | Geräte-Token mit der [Devices-CLI](/de/cli/devices) rotieren/erneut genehmigen, dann erneut verbinden.                                                                                                                                                                                       |
| `AUTH_SCOPE_MISMATCH`        | Geräte-Token ist gültig, aber seine genehmigte Rolle/Scopes decken diese Verbindungsanfrage nicht ab.                                                                                          | Koppeln Sie das Gerät erneut oder genehmigen Sie den angeforderten Scope-Vertrag; behandeln Sie dies nicht als Drift des gemeinsamen Tokens.                                                                                                                                              |
| `PAIRING_REQUIRED`           | Geräteidentität benötigt Genehmigung. Prüfen Sie `error.details.reason` auf `not-paired`, `scope-upgrade`, `role-upgrade` oder `metadata-upgrade`, und verwenden Sie `requestId` / `remediationHint`, falls vorhanden. | Ausstehende Anfrage genehmigen: `openclaw devices list`, dann `openclaw devices approve <requestId>`. Scope-/Rollen-Upgrades verwenden denselben Flow, nachdem Sie den angeforderten Zugriff geprüft haben.                                                                              |

<Note>
Direkte Loopback-Backend-RPCs, die mit dem gemeinsamen Gateway-Token/Passwort authentifiziert sind, sollten nicht von der Scope-Baseline der gekoppelten Geräte der CLI abhängen. Wenn Subagents oder andere interne Aufrufe weiterhin mit `scope-upgrade` fehlschlagen, prüfen Sie, ob der Aufrufer `client.id: "gateway-client"` und `client.mode: "backend"` verwendet und keine explizite `deviceIdentity` oder kein Geräte-Token erzwingt.
</Note>

Prüfung der Geräte-Auth-v2-Migration:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Wenn Logs Nonce-/Signaturfehler anzeigen, aktualisieren Sie den verbindenden Client und prüfen Sie ihn:

<Steps>
  <Step title="Auf connect.challenge warten">
    Client wartet auf die vom Gateway ausgegebene `connect.challenge`.
  </Step>
  <Step title="Nutzlast signieren">
    Client signiert die Challenge-gebundene Nutzlast.
  </Step>
  <Step title="Geräte-Nonce senden">
    Client sendet `connect.params.device.nonce` mit derselben Challenge-Nonce.
  </Step>
</Steps>

Wenn `openclaw devices rotate` / `revoke` / `remove` unerwartet verweigert wird:

- Sitzungen mit gekoppeltem Geräte-Token können nur **ihr eigenes** Gerät verwalten, sofern der Aufrufer nicht auch `operator.admin` hat
- `openclaw devices rotate --scope ...` kann nur Operator-Scopes anfordern, die die Aufrufer-Sitzung bereits besitzt

Verwandt:

- [Konfiguration](/de/gateway/configuration) (Gateway-Auth-Modi)
- [Control UI](/de/web/control-ui)
- [Geräte](/de/cli/devices)
- [Remote-Zugriff](/de/gateway/remote)
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
- Abweichung der Dienstkonfiguration (`Config (cli)` vs `Config (service)`).
- Port-/Listener-Konflikte.
- Zusätzliche launchd-/systemd-/schtasks-Installationen, wenn `--deep` verwendet wird.
- Bereinigungshinweise zu `Other gateway-like services detected (best effort)`.

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → lokaler Gateway-Modus ist nicht aktiviert, oder die Konfigurationsdatei wurde überschrieben und hat `gateway.mode` verloren. Fix: Setzen Sie `gateway.mode="local"` in Ihrer Konfiguration, oder führen Sie `openclaw onboard --mode local` / `openclaw setup` erneut aus, um die erwartete Local-Mode-Konfiguration neu zu stempeln. Wenn Sie OpenClaw über Podman ausführen, ist der Standard-Konfigurationspfad `~/.openclaw/openclaw.json`.
    - `refusing to bind gateway ... without auth` → Nicht-Loopback-Bind ohne gültigen Gateway-Auth-Pfad (Token/Passwort oder Trusted Proxy, sofern konfiguriert).
    - `another gateway instance is already listening` / `EADDRINUSE` → Portkonflikt.
    - `Other gateway-like services detected (best effort)` → veraltete oder parallele launchd-/systemd-/schtasks-Units existieren. Die meisten Setups sollten einen Gateway pro Maschine beibehalten; wenn Sie tatsächlich mehr als einen benötigen, isolieren Sie Ports + Konfiguration/Zustand/Workspace. Siehe [/gateway#multiple-gateways-same-host](/de/gateway#multiple-gateways-same-host).
    - `System-level OpenClaw gateway service detected` von doctor → eine systemd-System-Unit existiert, während der Dienst auf Benutzerebene fehlt. Entfernen oder deaktivieren Sie das Duplikat, bevor doctor einen Benutzerdienst installieren darf, oder setzen Sie `OPENCLAW_SERVICE_REPAIR_POLICY=external`, wenn die System-Unit der beabsichtigte Supervisor ist.
    - `Gateway service port does not match current gateway config` → der installierte Supervisor pinnt weiterhin den alten `--port`. Führen Sie `openclaw doctor --fix` oder `openclaw gateway install --force` aus und starten Sie dann den Gateway-Dienst neu.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Hintergrundausführung und Prozesstool](/de/gateway/background-process)
- [Konfiguration](/de/gateway/configuration)
- [Doctor](/de/gateway/doctor)

## macOS-Gateway antwortet ohne Meldung nicht mehr und setzt fort, wenn Sie das Dashboard berühren

Verwenden Sie dies, wenn Channels (Telegram, WhatsApp usw.) auf einem macOS-Host für Minuten bis Stunden stumm bleiben und der Gateway scheinbar genau in dem Moment zurückkommt, in dem Sie die Control UI öffnen, sich per SSH anmelden oder anderweitig mit dem Host interagieren. In `openclaw status` gibt es normalerweise kein offensichtliches Symptom, weil der Gateway zu dem Zeitpunkt, an dem Sie nachsehen, wieder aktiv ist.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

Achten Sie auf:

- Ein oder mehrere `*-uncaught_exception.json`-Bundles in `~/.openclaw/logs/stability/`, bei denen `error.code` auf einen transienten Netzwerkcode wie `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH` oder `ECONNREFUSED` gesetzt ist.
- `pmset -g log`-Zeilen wie `Entering Sleep state due to 'Maintenance Sleep'` oder `en0 driver is slow (msg: WillChangeState to 0)`, die zeitlich mit den Absturz-Zeitstempeln übereinstimmen. Power Nap / Maintenance Sleep versetzt den WLAN-Treiber kurzzeitig in Zustand 0; jeder ausgehende `connect()`, der in dieses Zeitfenster fällt, kann mit `ENETDOWN` fehlschlagen, selbst auf einem Host, der ansonsten vollständige Netzwerkverbindung hat.
- `launchctl print`-Ausgabe mit `state = not running`, mehreren aktuellen `runs` und einem Exit-Code, insbesondere wenn die Lücke zwischen Absturz und nächstem Start eher in der Größenordnung einer Stunde als weniger Sekunden liegt. macOS launchd wendet nach einer Absturzserie eine nicht dokumentierte Respawn-Schutzsperre an, die dazu führen kann, dass `KeepAlive=true` nicht mehr beachtet wird, bis ein externer Auslöser wie interaktive Anmeldung, Dashboard-Verbindung oder `launchctl kickstart` sie wieder aktiviert.

Häufige Signaturen:

- Ein Stabilitäts-Bundle, dessen `error.code` `ENETDOWN` oder ein verwandter Code ist, wobei der Callstack in Node `net` `lookupAndConnect` / `Socket.connect` zeigt. OpenClaw `2026.5.26` und neuer klassifizieren diese als harmlose transiente Netzwerkfehler, sodass sie nicht mehr bis zum obersten Handler für nicht abgefangene Ausnahmen propagieren; wenn Sie eine ältere Version verwenden, aktualisieren Sie zuerst.
- Lange ruhige Phasen, die in dem Moment enden, in dem Sie eine Verbindung zur Control UI herstellen oder sich per SSH beim Host anmelden: Die benutzersichtbare Aktivität aktiviert die Respawn-Sperre von launchd wieder, nicht etwas, das das Dashboard mit dem Gateway macht.
- `runs`-Zähler steigt im Tagesverlauf, ohne entsprechende Zeile `received SIG*; shutting down` in `~/Library/Logs/openclaw/gateway.log`: Saubere Beendigungen protokollieren ein Signal; transiente Abstürze nicht.

Was zu tun ist:

1. **Aktualisieren Sie das Gateway**, wenn Sie eine Version vor `2026.5.26` verwenden. Nach dem Upgrade werden zukünftige `ENETDOWN`-Fehler als Warnungen protokolliert, statt den Prozess zu beenden.
2. **Reduzieren Sie Wartungs-Ruhezustandsaktivität** auf Mac mini- / Desktop-Hosts, die als dauerhaft laufende Server gedacht sind:

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   Dies reduziert das zugrunde liegende Treiberflattern deutlich, beseitigt es aber nicht vollständig. Das System kann unabhängig von diesen Flags weiterhin einige Wartungs-Ruhezustände für TCP-Keepalive und mDNS-Pflege ausführen.

3. **Fügen Sie einen Liveness-Watchdog hinzu**, damit eine zukünftige Absturzserie, die von launchd geparkt wird, schnell erkannt wird:

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   Ziel ist es, die Respawn-Sperre extern wieder zu aktivieren; `KeepAlive=true` allein reicht unter macOS nach einer Absturzserie nicht aus.

Verwandt:

- [macOS-Plattformhinweise](/de/platforms/macos)
- [Logging](/de/logging)
- [Doctor](/de/gateway/doctor)

## Gateway wird bei hoher Speichernutzung beendet

Verwenden Sie dies, wenn das Gateway unter Last verschwindet, der Supervisor einen OOM-artigen Neustart meldet oder Logs `critical memory pressure bundle written` erwähnen.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

Achten Sie auf:

- `Reason: diagnostic.memory.pressure.critical` im neuesten Stabilitäts-Bundle.
- `Memory pressure:` mit `critical/rss_threshold`, `critical/heap_threshold` oder `critical/rss_growth`.
- `V8 heap:`-Werte nahe am Heap-Limit.
- `Largest session files:`-Einträge wie `agents/<agent>/sessions/<session>.jsonl` oder `sessions/<session>.jsonl`.
- Linux-cgroup-Speicherzähler, wenn das Gateway in einem Container oder einem speicherbegrenzten Dienst läuft.

Häufige Signaturen:

- `critical memory pressure bundle written` erscheint kurz vor dem Neustart → OpenClaw hat ein Prä-OOM-Stabilitäts-Bundle erfasst. Prüfen Sie es mit `openclaw gateway stability --bundle latest`.
- `memory pressure: level=critical ... memoryPressureSnapshot=disabled` erscheint in Gateway-Logs → OpenClaw hat kritischen Speicherdruck erkannt, aber der Prä-OOM-Stabilitäts-Snapshot ist deaktiviert.
- `Largest session files:` verweist auf einen sehr großen redigierten Transkriptpfad → reduzieren Sie die aufbewahrte Sitzungsverlaufshistorie, prüfen Sie das Sitzungswachstum oder verschieben Sie alte Transkripte vor dem Neustart aus dem aktiven Speicher.
- Verwendete Bytes bei `V8 heap:` liegen nahe am Heap-Limit → senken Sie Prompt-/Sitzungsdruck, reduzieren Sie gleichzeitige Arbeit oder erhöhen Sie das Node-Heap-Limit erst, nachdem bestätigt wurde, dass die Arbeitslast erwartet ist.
- `Memory pressure: critical/rss_growth` → Speicher ist innerhalb eines Sampling-Fensters schnell gewachsen. Prüfen Sie die neuesten Logs auf einen großen Import, ausufernde Tool-Ausgabe, wiederholte Retries oder einen Stapel wartender Agent-Arbeit.
- Kritischer Speicherdruck erscheint in Logs, aber es existiert kein Bundle → dies ist die Standardeinstellung. Setzen Sie `diagnostics.memoryPressureSnapshot: true`, um das Prä-OOM-Stabilitäts-Bundle bei zukünftigen Ereignissen mit kritischem Speicherdruck zu erfassen.

Das Stabilitäts-Bundle enthält keine Payloads. Es enthält operative Speicherhinweise und redigierte relative Dateipfade, aber keine Nachrichtentexte, Webhook-Bodys, Zugangsdaten, Tokens, Cookies oder rohen Sitzungs-IDs. Hängen Sie den Diagnoseexport an Fehlerberichte an, statt rohe Logs zu kopieren.

Verwandt:

- [Gateway-Zustand](/de/gateway/health)
- [Diagnoseexport](/de/gateway/diagnostics)
- [Sitzungen](/de/cli/sessions)

## Gateway hat ungültige Konfiguration abgelehnt

Verwenden Sie dies, wenn der Gateway-Start mit `Invalid config` fehlschlägt oder Hot-Reload-Logs melden, dass eine ungültige Bearbeitung übersprungen wurde.

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
- Eine mit Zeitstempel versehene Datei `openclaw.json.clobbered.*`, wenn `doctor --fix` eine defekte direkte Bearbeitung repariert hat
- OpenClaw behält die neuesten 32 `.clobbered.*`-Dateien für jeden Konfigurationspfad und rotiert ältere

<AccordionGroup>
  <Accordion title="Was passiert ist">
    - Die Konfiguration wurde beim Start, beim Hot Reload oder bei einem OpenClaw-eigenen Schreibvorgang nicht validiert.
    - Der Gateway-Start schlägt geschlossen fehl, statt `openclaw.json` neu zu schreiben.
    - Hot Reload überspringt ungültige externe Bearbeitungen und lässt die aktuelle Laufzeitkonfiguration aktiv.
    - OpenClaw-eigene Schreibvorgänge lehnen ungültige/destruktive Payloads vor dem Commit ab und speichern `.rejected.*`.
    - `openclaw doctor --fix` ist für Reparaturen zuständig. Es kann Nicht-JSON-Präfixe entfernen oder die letzte als gut bekannte Kopie wiederherstellen, während die abgelehnte Payload als `.clobbered.*` erhalten bleibt.
    - Wenn viele Reparaturen für einen Konfigurationspfad stattfinden, rotiert OpenClaw ältere `.clobbered.*`-Dateien, sodass die neueste reparierte Payload weiterhin verfügbar ist.

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
    - `.clobbered.*` existiert → Doctor hat eine defekte externe Bearbeitung erhalten, während die aktive Konfiguration repariert wurde.
    - `.rejected.*` existiert → ein OpenClaw-eigener Konfigurationsschreibvorgang ist vor dem Commit an Schema- oder Clobber-Prüfungen gescheitert.
    - `Config write rejected:` → der Schreibvorgang versuchte, die erforderliche Struktur zu entfernen, die Datei stark zu verkleinern oder ungültige Konfiguration zu persistieren.
    - `config reload skipped (invalid config):` → eine direkte Bearbeitung hat die Validierung nicht bestanden und wurde vom laufenden Gateway ignoriert.
    - `Invalid config at ...` → der Start ist fehlgeschlagen, bevor Gateway-Dienste gestartet wurden.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` oder `size-drop-vs-last-good:*` → ein OpenClaw-eigener Schreibvorgang wurde abgelehnt, weil im Vergleich zum letzten als gut bekannten Backup Felder oder Größe verloren gingen.
    - `Config last-known-good promotion skipped` → der Kandidat enthielt redigierte Secret-Platzhalter wie `***`.

  </Accordion>
  <Accordion title="Korrekturoptionen">
    1. Führen Sie `openclaw doctor --fix` aus, damit Doctor eine präfixierte/überschriebene Konfiguration repariert oder den letzten als gut bekannten Zustand wiederherstellt.
    2. Kopieren Sie nur die beabsichtigten Schlüssel aus `.clobbered.*` oder `.rejected.*` und wenden Sie sie dann mit `openclaw config set` oder `config.patch` an.
    3. Führen Sie `openclaw config validate` vor dem Neustart aus.
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
- Ob die Warnung SSH-Fallback, mehrere Gateways, fehlende Scopes oder nicht aufgelöste Auth-Refs betrifft.

Häufige Signaturen:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH-Einrichtung ist fehlgeschlagen, aber der Befehl hat trotzdem direkte konfigurierte/Loopback-Ziele versucht.
- `multiple reachable gateway identities detected` → unterschiedliche Gateways haben geantwortet, oder OpenClaw konnte nicht nachweisen, dass erreichbare Ziele dasselbe Gateway sind. Ein SSH-Tunnel, eine Proxy-URL oder eine konfigurierte Remote-URL zum selben Gateway wird als ein Gateway mit mehreren Transporten behandelt, selbst wenn sich Transport-Ports unterscheiden.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → Verbindung hat funktioniert, aber Detail-RPC ist durch Scopes eingeschränkt; koppeln Sie die Geräteidentität oder verwenden Sie Zugangsdaten mit `operator.read`.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → Verbindung hat funktioniert, aber der vollständige Diagnose-RPC-Satz ist zeitüberschritten oder fehlgeschlagen. Behandeln Sie dies als erreichbares Gateway mit eingeschränkter Diagnose; vergleichen Sie `connect.ok` und `connect.rpcOk` in der `--json`-Ausgabe.
- `Capability: pairing-pending` oder `gateway closed (1008): pairing required` → das Gateway hat geantwortet, aber dieser Client benötigt weiterhin Pairing/Genehmigung vor normalem Operator-Zugriff.
- nicht aufgelöster `gateway.auth.*`- / `gateway.remote.*`-SecretRef-Warnungstext → Auth-Material war in diesem Befehlspfad für das fehlgeschlagene Ziel nicht verfügbar.

Verwandt:

- [Gateway](/de/cli/gateway)
- [Mehrere Gateways auf demselben Host](/de/gateway#multiple-gateways-same-host)
- [Remote-Zugriff](/de/gateway/remote)

## Channel verbunden, Nachrichten fließen nicht

Wenn der Channel-Status verbunden ist, aber der Nachrichtenfluss tot ist, konzentrieren Sie sich auf Policy, Berechtigungen und channelspezifische Zustellregeln.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Achten Sie auf:

- DM-Policy (`pairing`, `allowlist`, `open`, `disabled`).
- Gruppen-Allowlist und Erwähnungsanforderungen.
- Fehlende Channel-API-Berechtigungen/Scopes.

Häufige Signaturen:

- `mention required` → Nachricht wurde durch Gruppen-Erwähnungs-Policy ignoriert.
- `pairing` / Spuren ausstehender Genehmigung → Absender ist nicht genehmigt.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → Channel-Auth-/Berechtigungsproblem.

Verwandt:

- [Channel-Fehlerbehebung](/de/channels/troubleshooting)
- [Discord](/de/channels/discord)
- [Telegram](/de/channels/telegram)
- [WhatsApp](/de/channels/whatsapp)

## Cron- und Heartbeat-Zustellung

Wenn Cron oder Heartbeat nicht gelaufen ist oder nicht zugestellt wurde, prüfen Sie zuerst den Scheduler-Zustand und dann das Zustellziel.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Achten Sie auf:

- Cron aktiviert und nächstes Aufwachen vorhanden.
- Status des Jobausführungsverlaufs (`ok`, `skipped`, `error`).
- Heartbeat-Überspringgründe (`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Häufige Signaturen">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron deaktiviert.
    - `cron: timer tick failed` → Scheduler-Tick fehlgeschlagen; prüfen Sie Datei-, Log- und Laufzeitfehler.
    - `heartbeat skipped` mit `reason=quiet-hours` → außerhalb des aktiven Zeitfensters.
    - `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` ist vorhanden, enthält aber nur leeres, Kommentar-, Header-, Fence- oder leeres Checklisten-Gerüst, sodass OpenClaw den Modellaufruf überspringt.
    - `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md` enthält einen `tasks:`-Block, aber keine der Aufgaben ist bei diesem Tick fällig.
    - `heartbeat: unknown accountId` → ungültige Konto-ID für das Heartbeat-Zustellziel.
    - `heartbeat skipped` mit `reason=dm-blocked` → Heartbeat-Ziel wurde zu einem DM-artigen Ziel aufgelöst, während `agents.defaults.heartbeat.directPolicy` (oder eine agentenspezifische Überschreibung) auf `block` gesetzt ist.

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

- Node online mit erwarteten Fähigkeiten.
- OS-Berechtigungsfreigaben für Kamera/Mikrofon/Standort/Bildschirm.
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
- Gültiger Pfad zur Browser-ausführbaren Datei.
- Erreichbarkeit des CDP-Profils.
- Lokale Chrome-Verfügbarkeit für `existing-session`- / `user`-Profile.

<AccordionGroup>
  <Accordion title="Plugin- / ausführbare-Datei-Signaturen">
    - `unknown command "browser"` oder `unknown command 'browser'` → das gebündelte Browser-Plugin wird durch `plugins.allow` ausgeschlossen.
    - Browser-Tool fehlt / nicht verfügbar, während `browser.enabled=true` → `plugins.allow` schließt `browser` aus, daher wurde das Plugin nie geladen.
    - `Failed to start Chrome CDP on port` → Browser-Prozess konnte nicht gestartet werden.
    - `browser.executablePath not found` → konfigurierter Pfad ist ungültig.
    - `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema wie `file:` oder `ftp:`.
    - `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen ungültigen oder außerhalb des Bereichs liegenden Port.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → der aktuellen Gateway-Installation fehlt die zentrale Browser-Laufzeitabhängigkeit; installieren oder aktualisieren Sie OpenClaw erneut und starten Sie dann den Gateway neu. ARIA-Snapshots und einfache Seiten-Screenshots können weiterhin funktionieren, aber Navigation, AI-Snapshots, CSS-Selector-Element-Screenshots und PDF-Export bleiben nicht verfügbar.

  </Accordion>
  <Accordion title="Chrome-MCP- / Existing-Session-Signaturen">
    - `Could not find DevToolsActivePort for chrome` → Chrome-MCP-Existing-Session konnte noch nicht an das ausgewählte Browser-Datenverzeichnis anhängen. Öffnen Sie die Browser-Inspect-Seite, aktivieren Sie Remote-Debugging, lassen Sie den Browser geöffnet, genehmigen Sie die erste Anhängeaufforderung und versuchen Sie es erneut. Wenn angemeldeter Zustand nicht erforderlich ist, bevorzugen Sie das verwaltete `openclaw`-Profil.
    - `No Chrome tabs found for profile="user"` → das Chrome-MCP-Anhängeprofil hat keine geöffneten lokalen Chrome-Tabs.
    - `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist vom Gateway-Host aus nicht erreichbar.
    - `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → reines Anhängeprofil hat kein erreichbares Ziel, oder der HTTP-Endpunkt hat geantwortet, aber der CDP-WebSocket konnte trotzdem nicht geöffnet werden.

  </Accordion>
  <Accordion title="Element- / Screenshot- / Upload-Signaturen">
    - `fullPage is not supported for element screenshots` → Screenshot-Anfrage hat `--full-page` mit `--ref` oder `--element` kombiniert.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome-MCP- / `existing-session`-Screenshot-Aufrufe müssen Seitenerfassung oder eine Snapshot-`--ref` verwenden, nicht CSS-`--element`.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome-MCP-Upload-Hooks benötigen Snapshot-Refs, keine CSS-Selectoren.
    - `existing-session file uploads currently support one file at a time.` → senden Sie bei Chrome-MCP-Profilen einen Upload pro Aufruf.
    - `existing-session dialog handling does not support timeoutMs.` → Dialog-Hooks bei Chrome-MCP-Profilen unterstützen keine Timeout-Überschreibungen.
    - `existing-session type does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:type` bei `profile="user"`- / Chrome-MCP-Existing-Session-Profilen weg oder verwenden Sie ein verwaltetes/CDP-Browser-Profil, wenn ein benutzerdefinierter Timeout erforderlich ist.
    - `existing-session evaluate does not support timeoutMs overrides.` → lassen Sie `timeoutMs` für `act:evaluate` bei `profile="user"`- / Chrome-MCP-Existing-Session-Profilen weg oder verwenden Sie ein verwaltetes/CDP-Browser-Profil, wenn ein benutzerdefinierter Timeout erforderlich ist.
    - `response body is not supported for existing-session profiles yet.` → `responsebody` erfordert weiterhin einen verwalteten Browser oder ein Raw-CDP-Profil.
    - veralteter Viewport / Dark-Mode- / Locale- / Offline-Überschreibungen bei reinen Anhänge- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuerungssitzung zu schließen und den Playwright-/CDP-Emulationszustand freizugeben, ohne den gesamten Gateway neu zu starten.

  </Accordion>
</AccordionGroup>

Verwandt:

- [Browser (von OpenClaw verwaltet)](/de/tools/browser)
- [Browser-Fehlerbehebung](/de/tools/browser-linux-troubleshooting)

## Wenn Sie ein Upgrade durchgeführt haben und plötzlich etwas nicht mehr funktioniert

Die meisten Probleme nach einem Upgrade entstehen durch Konfigurationsabweichungen oder dadurch, dass strengere Standardwerte jetzt durchgesetzt werden.

<AccordionGroup>
  <Accordion title="1. Verhalten von Authentifizierung und URL-Überschreibung hat sich geändert">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    Was zu prüfen ist:

    - Wenn `gateway.mode=remote` ist, zielen CLI-Aufrufe möglicherweise auf die Remote-Instanz, während Ihr lokaler Dienst in Ordnung ist.
    - Explizite `--url`-Aufrufe fallen nicht auf gespeicherte Anmeldedaten zurück.

    Häufige Signaturen:

    - `gateway connect failed:` → falsches URL-Ziel.
    - `unauthorized` → Endpunkt erreichbar, aber falsche Authentifizierung.

  </Accordion>
  <Accordion title="2. Bind- und Authentifizierungs-Leitplanken sind strenger">
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
    - `Connectivity probe: failed`, während die Runtime läuft → Gateway aktiv, aber mit aktueller Authentifizierung/URL nicht zugänglich.

  </Accordion>
  <Accordion title="3. Pairing- und Geräteidentitätsstatus haben sich geändert">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    Was zu prüfen ist:

    - Ausstehende Gerätefreigaben für Dashboard/Knoten.
    - Ausstehende DM-Pairing-Freigaben nach Richtlinien- oder Identitätsänderungen.

    Häufige Signaturen:

    - `device identity required` → Geräteauthentifizierung nicht erfüllt.
    - `pairing required` → Absender/Gerät muss freigegeben werden.

  </Accordion>
</AccordionGroup>

Wenn Dienstkonfiguration und Runtime nach den Prüfungen weiterhin voneinander abweichen, installieren Sie die Dienstmetadaten aus demselben Profil-/Statusverzeichnis neu:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Verwandt:

- [Authentifizierung](/de/gateway/authentication)
- [Hintergrundausführung und Prozesstool](/de/gateway/background-process)
- [Gateway-eigenes Pairing](/de/gateway/pairing)

## Verwandt

- [Doctor](/de/gateway/doctor)
- [FAQ](/de/help/faq)
- [Gateway-Runbook](/de/gateway)
