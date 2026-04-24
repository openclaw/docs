---
read_when:
    - OpenClaw funktioniert nicht und du brauchst den schnellsten Weg zu einer Lösung
    - Du möchtest einen Triage-Ablauf, bevor du in ausführliche Runbooks einsteigst
summary: Hub zur Fehlerbehebung für OpenClaw mit Symptom-orientiertem Einstieg
title: Allgemeine Fehlerbehebung
x-i18n:
    generated_at: "2026-04-24T08:57:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c832c3f7609c56a5461515ed0f693d2255310bf2d3958f69f57c482bcbef97f0
    source_path: help/troubleshooting.md
    workflow: 15
---

Wenn du nur 2 Minuten hast, nutze diese Seite als Triage-Einstieg.

## Die ersten 60 Sekunden

Führe diese genaue Reihenfolge aus:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Gute Ausgabe in einer Zeile:

- `openclaw status` → zeigt konfigurierte Kanäle und keine offensichtlichen Auth-Fehler.
- `openclaw status --all` → vollständiger Bericht ist vorhanden und teilbar.
- `openclaw gateway probe` → erwartetes Gateway-Ziel ist erreichbar (`Reachable: yes`). `Capability: ...` zeigt, welche Auth-Stufe der Probe nachweisen konnte, und `Read probe: limited - missing scope: operator.read` bedeutet eingeschränkte Diagnose, nicht einen Verbindungsfehler.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok` und eine plausible `Capability: ...`-Zeile. Verwende `--require-rpc`, wenn du zusätzlich einen Nachweis für Read-Scope-RPC brauchst.
- `openclaw doctor` → keine blockierenden Konfigurations-/Dienstfehler.
- `openclaw channels status --probe` → ein erreichbares Gateway liefert Live-Transportstatus pro Account
  plus Probe-/Audit-Ergebnisse wie `works` oder `audit ok`; wenn das
  Gateway nicht erreichbar ist, fällt der Befehl auf reine Konfigurations-Zusammenfassungen zurück.
- `openclaw logs --follow` → stetige Aktivität, keine sich wiederholenden fatalen Fehler.

## Anthropic Long Context 429

Wenn du Folgendes siehst:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
gehe zu [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Lokales OpenAI-kompatibles Backend funktioniert direkt, aber nicht in OpenClaw

Wenn dein lokales oder selbst gehostetes `/v1`-Backend kleine direkte
`/v1/chat/completions`-Probes beantwortet, aber bei `openclaw infer model run` oder normalen
Agent-Turns fehlschlägt:

1. Wenn der Fehler erwähnt, dass `messages[].content` einen String erwartet, setze
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Wenn das Backend weiterhin nur bei OpenClaw-Agent-Turns fehlschlägt, setze
   `models.providers.<provider>.models[].compat.supportsTools: false` und versuche es erneut.
3. Wenn winzige direkte Aufrufe weiterhin funktionieren, aber größere OpenClaw-Prompts das
   Backend zum Absturz bringen, behandle das verbleibende Problem als Upstream-Modell-/Server-Einschränkung und
   fahre im ausführlichen Runbook fort:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/de/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Plugin-Installation schlägt mit fehlenden openclaw extensions fehl

Wenn die Installation mit `package.json missing openclaw.extensions` fehlschlägt, verwendet das Plugin-Paket
eine alte Form, die OpenClaw nicht mehr akzeptiert.

Behebung im Plugin-Paket:

1. Füge `openclaw.extensions` zu `package.json` hinzu.
2. Verweise die Einträge auf gebaute Laufzeitdateien (normalerweise `./dist/index.js`).
3. Veröffentliche das Plugin erneut und führe `openclaw plugins install <package>` noch einmal aus.

Beispiel:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Referenz: [Plugin-Architektur](/de/plugins/architecture)

## Entscheidungsbaum

```mermaid
flowchart TD
  A[OpenClaw funktioniert nicht] --> B{Was bricht zuerst}
  B --> C[Keine Antworten]
  B --> D[Dashboard oder Control UI verbindet nicht]
  B --> E[Gateway startet nicht oder Dienst läuft nicht]
  B --> F[Kanal verbindet sich, aber Nachrichten fließen nicht]
  B --> G[Cron oder Heartbeat wurde nicht ausgelöst oder nicht zugestellt]
  B --> H[Node ist gekoppelt, aber camera canvas screen exec schlägt fehl]
  B --> I[Browser-Tool schlägt fehl]

  C --> C1[/Abschnitt Keine Antworten/]
  D --> D1[/Abschnitt Control UI/]
  E --> E1[/Abschnitt Gateway/]
  F --> F1[/Abschnitt Nachrichtenfluss im Kanal/]
  G --> G1[/Abschnitt Automatisierung/]
  H --> H1[/Abschnitt Node-Tools/]
  I --> I1[/Abschnitt Browser/]
```

<AccordionGroup>
  <Accordion title="Keine Antworten">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    Gute Ausgabe sieht so aus:

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` oder `admin-capable`
    - Dein Kanal zeigt einen verbundenen Transport und, wo unterstützt, `works` oder `audit ok` in `channels status --probe`
    - Absender erscheint als genehmigt (oder die DM-Richtlinie ist offen/Allowlist)

    Häufige Log-Signaturen:

    - `drop guild message (mention required` → Mention-Gating hat die Nachricht in Discord blockiert.
    - `pairing request` → Absender ist nicht genehmigt und wartet auf DM-Kopplungsfreigabe.
    - `blocked` / `allowlist` in den Kanallogs → Absender, Raum oder Gruppe wird gefiltert.

    Ausführliche Seiten:

    - [/gateway/troubleshooting#no-replies](/de/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/de/channels/troubleshooting)
    - [/channels/pairing](/de/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard oder Control UI verbindet nicht">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Gute Ausgabe sieht so aus:

    - `Dashboard: http://...` wird in `openclaw gateway status` angezeigt
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` oder `admin-capable`
    - Keine Auth-Schleife in den Logs

    Häufige Log-Signaturen:

    - `device identity required` → HTTP-/nicht-sicherer Kontext kann Geräteauthentifizierung nicht abschließen.
    - `origin not allowed` → Browser-`Origin` ist für das Gateway-Ziel der Control UI nicht erlaubt
    - `AUTH_TOKEN_MISMATCH` mit Wiederholungs-Hinweisen (`canRetryWithDeviceToken=true`) → ein vertrauenswürdiger Retry mit Device-Token kann automatisch erfolgen.
    - Dieser Retry mit zwischengespeichertem Token verwendet erneut die zwischengespeicherte Scope-Menge, die mit dem gekoppelten
      Device-Token gespeichert wurde. Aufrufer mit explizitem `deviceToken` / expliziten `scopes`
      behalten stattdessen ihre angeforderte Scope-Menge.
    - Im asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe
      `{scope, ip}` serialisiert, bevor der Limiter den Fehler erfasst, daher kann ein
      zweiter gleichzeitiger fehlerhafter Retry bereits `retry later` anzeigen.
    - `too many failed authentication attempts (retry later)` von einem localhost-
      Browser-`Origin` → wiederholte Fehlversuche von derselben `Origin` werden vorübergehend
      gesperrt; ein anderer localhost-Origin verwendet einen separaten Bucket.
    - wiederholtes `unauthorized` nach diesem Retry → falsches Token/Passwort, nicht passender Auth-Modus oder veraltetes gekoppeltes Device-Token.
    - `gateway connect failed:` → UI zielt auf die falsche URL/den falschen Port oder ein nicht erreichbares Gateway.

    Ausführliche Seiten:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/de/web/control-ui)
    - [/gateway/authentication](/de/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway startet nicht oder Dienst ist installiert, läuft aber nicht">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Gute Ausgabe sieht so aus:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` oder `admin-capable`

    Häufige Log-Signaturen:

    - `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → Gateway-Modus ist remote, oder der Konfigurationsdatei fehlt die Kennzeichnung für den lokalen Modus und sie sollte repariert werden.
    - `refusing to bind gateway ... without auth` → Nicht-loopback-Binding ohne gültigen Gateway-Authentifizierungspfad (Token/Passwort oder trusted-proxy, sofern konfiguriert).
    - `another gateway instance is already listening` oder `EADDRINUSE` → Port ist bereits belegt.

    Ausführliche Seiten:

    - [/gateway/troubleshooting#gateway-service-not-running](/de/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/de/gateway/background-process)
    - [/gateway/configuration](/de/gateway/configuration)

  </Accordion>

  <Accordion title="Kanal verbindet sich, aber Nachrichten fließen nicht">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Gute Ausgabe sieht so aus:

    - Kanaltransport ist verbunden.
    - Pairing-/Allowlist-Prüfungen bestehen.
    - Mentions werden erkannt, wo sie erforderlich sind.

    Häufige Log-Signaturen:

    - `mention required` → Mention-Gating in Gruppen hat die Verarbeitung blockiert.
    - `pairing` / `pending` → DM-Absender ist noch nicht genehmigt.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → Problem mit Kanalberechtigungen oder -Token.

    Ausführliche Seiten:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/de/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/de/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron oder Heartbeat wurde nicht ausgelöst oder nicht zugestellt">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Gute Ausgabe sieht so aus:

    - `cron.status` zeigt aktiviert mit einem nächsten Aufweckzeitpunkt.
    - `cron runs` zeigt aktuelle `ok`-Einträge.
    - Heartbeat ist aktiviert und nicht außerhalb der aktiven Stunden.

    Häufige Log-Signaturen:

    - `cron: scheduler disabled; jobs will not run automatically` → Cron ist deaktiviert.
    - `heartbeat skipped` mit `reason=quiet-hours` → außerhalb der konfigurierten aktiven Stunden.
    - `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur leere/header-only-Struktur.
    - `heartbeat skipped` mit `reason=no-tasks-due` → Der Task-Modus von `HEARTBEAT.md` ist aktiv, aber keines der Task-Intervalle ist bisher fällig.
    - `heartbeat skipped` mit `reason=alerts-disabled` → die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus).
    - `requests-in-flight` → Hauptpfad ist beschäftigt; Heartbeat-Wakeup wurde verschoben.
    - `unknown accountId` → Ziel-Account für die Heartbeat-Zustellung existiert nicht.

    Ausführliche Seiten:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/de/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/de/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/de/gateway/heartbeat)

  </Accordion>

  <Accordion title="Node ist gekoppelt, aber Tool schlägt bei camera canvas screen exec fehl">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw nodes status
    openclaw nodes describe --node <idOrNameOrIp>
    openclaw logs --follow
    ```

    Gute Ausgabe sieht so aus:

    - Node ist als verbunden und für die Rolle `node` gekoppelt aufgeführt.
    - Capability existiert für den Befehl, den du aufrufst.
    - Berechtigungsstatus ist für das Tool gewährt.

    Häufige Log-Signaturen:

    - `NODE_BACKGROUND_UNAVAILABLE` → bringe die Node-App in den Vordergrund.
    - `*_PERMISSION_REQUIRED` → OS-Berechtigung wurde verweigert/fehlt.
    - `SYSTEM_RUN_DENIED: approval required` → exec-Freigabe steht aus.
    - `SYSTEM_RUN_DENIED: allowlist miss` → Befehl steht nicht auf der exec-Allowlist.

    Ausführliche Seiten:

    - [/gateway/troubleshooting#node-paired-tool-fails](/de/gateway/troubleshooting#node-paired-tool-fails)
    - [/nodes/troubleshooting](/de/nodes/troubleshooting)
    - [/tools/exec-approvals](/de/tools/exec-approvals)

  </Accordion>

  <Accordion title="Exec verlangt plötzlich eine Freigabe">
    ```bash
    openclaw config get tools.exec.host
    openclaw config get tools.exec.security
    openclaw config get tools.exec.ask
    openclaw gateway restart
    ```

    Was sich geändert hat:

    - Wenn `tools.exec.host` nicht gesetzt ist, ist der Standardwert `auto`.
    - `host=auto` wird zu `sandbox` aufgelöst, wenn eine Sandbox-Laufzeit aktiv ist, sonst zu `gateway`.
    - `host=auto` betrifft nur das Routing; das promptfreie „YOLO“-Verhalten ergibt sich aus `security=full` plus `ask=off` auf Gateway/Node.
    - Auf `gateway` und `node` ist der Standard für nicht gesetztes `tools.exec.security` `full`.
    - Nicht gesetztes `tools.exec.ask` hat standardmäßig den Wert `off`.
    - Ergebnis: Wenn du Freigaben siehst, wurde irgendeine host-lokale oder sitzungsspezifische Richtlinie für exec gegenüber den aktuellen Standards verschärft.

    Aktuelles Standardverhalten ohne Freigabe wiederherstellen:

    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```

    Sicherere Alternativen:

    - Setze nur `tools.exec.host=gateway`, wenn du nur stabiles Host-Routing möchtest.
    - Verwende `security=allowlist` mit `ask=on-miss`, wenn du Host-exec möchtest, aber bei Allowlist-Fehlschlägen weiterhin eine Prüfung willst.
    - Aktiviere den Sandbox-Modus, wenn du möchtest, dass `host=auto` wieder zu `sandbox` aufgelöst wird.

    Häufige Log-Signaturen:

    - `Approval required.` → der Befehl wartet auf `/approve ...`.
    - `SYSTEM_RUN_DENIED: approval required` → die exec-Freigabe für node-host steht aus.
    - `exec host=sandbox requires a sandbox runtime for this session` → implizite/explizite Sandbox-Auswahl, aber der Sandbox-Modus ist deaktiviert.

    Ausführliche Seiten:

    - [/tools/exec](/de/tools/exec)
    - [/tools/exec-approvals](/de/tools/exec-approvals)
    - [/gateway/security#what-the-audit-checks-high-level](/de/gateway/security#what-the-audit-checks-high-level)

  </Accordion>

  <Accordion title="Browser-Tool schlägt fehl">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw browser status
    openclaw logs --follow
    openclaw doctor
    ```

    Gute Ausgabe sieht so aus:

    - Browser-Status zeigt `running: true` und einen ausgewählten Browser/ein ausgewähltes Profil.
    - `openclaw` startet, oder `user` kann lokale Chrome-Tabs sehen.

    Häufige Log-Signaturen:

    - `unknown command "browser"` oder `unknown command 'browser'` → `plugins.allow` ist gesetzt und enthält `browser` nicht.
    - `Failed to start Chrome CDP on port` → Start des lokalen Browsers ist fehlgeschlagen.
    - `browser.executablePath not found` → der konfigurierte Binärpfad ist falsch.
    - `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema.
    - `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen ungültigen oder außerhalb des zulässigen Bereichs liegenden Port.
    - `No Chrome tabs found for profile="user"` → das Chrome-MCP-Attach-Profil hat keine offenen lokalen Chrome-Tabs.
    - `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist von diesem Host aus nicht erreichbar.
    - `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → das Attach-only-Profil hat kein aktives CDP-Ziel.
    - veraltete Overrides für Viewport / Dark Mode / Gebietsschema / Offline-Modus auf Attach-only- oder Remote-CDP-Profilen → führe `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuerungssitzung zu schließen und den Emulationsstatus freizugeben, ohne das Gateway neu zu starten.

    Ausführliche Seiten:

    - [/gateway/troubleshooting#browser-tool-fails](/de/gateway/troubleshooting#browser-tool-fails)
    - [/tools/browser#missing-browser-command-or-tool](/de/tools/browser#missing-browser-command-or-tool)
    - [/tools/browser-linux-troubleshooting](/de/tools/browser-linux-troubleshooting)
    - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

  </Accordion>

</AccordionGroup>

## Verwandt

- [FAQ](/de/help/faq) — häufig gestellte Fragen
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting) — Gateway-spezifische Probleme
- [Doctor](/de/gateway/doctor) — automatisierte Zustandsprüfungen und Reparaturen
- [Fehlerbehebung für Kanäle](/de/channels/troubleshooting) — Probleme mit der Kanal-Konnektivität
- [Fehlerbehebung für Automatisierung](/de/automation/cron-jobs#troubleshooting) — Probleme mit Cron und Heartbeat
