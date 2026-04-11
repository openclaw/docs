---
read_when:
    - OpenClaw funktioniert nicht und Sie benötigen den schnellsten Weg zu einer Lösung.
    - Sie möchten einen Triage-Ablauf, bevor Sie in ausführliche Runbooks einsteigen.
summary: Symptomorientierter Hub zur Fehlerbehebung für OpenClaw
title: Allgemeine Fehlerbehebung
x-i18n:
    generated_at: "2026-04-11T02:45:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16b38920dbfdc8d4a79bbb5d6fab2c67c9f218a97c36bb4695310d7db9c4614a
    source_path: help/troubleshooting.md
    workflow: 15
---

# Fehlerbehebung

Wenn Sie nur 2 Minuten haben, verwenden Sie diese Seite als Triage-Einstieg.

## Die ersten 60 Sekunden

Führen Sie diese genaue Abfolge in dieser Reihenfolge aus:

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

- `openclaw status` → zeigt konfigurierte Channels und keine offensichtlichen Auth-Fehler.
- `openclaw status --all` → vollständiger Bericht ist vorhanden und kann geteilt werden.
- `openclaw gateway probe` → erwartetes Gateway-Ziel ist erreichbar (`Reachable: yes`). `RPC: limited - missing scope: operator.read` bedeutet eingeschränkte Diagnose, keinen Verbindungsfehler.
- `openclaw gateway status` → `Runtime: running` und `RPC probe: ok`.
- `openclaw doctor` → keine blockierenden Konfigurations-/Service-Fehler.
- `openclaw channels status --probe` → ein erreichbares Gateway liefert den Live-Transportstatus pro Account
  sowie Probe-/Audit-Ergebnisse wie `works` oder `audit ok`; wenn das
  Gateway nicht erreichbar ist, fällt der Befehl auf reine Konfigurationszusammenfassungen zurück.
- `openclaw logs --follow` → stetige Aktivität, keine sich wiederholenden fatalen Fehler.

## Anthropic Long-Context-429

Wenn Sie Folgendes sehen:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
gehen Sie zu [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Lokales OpenAI-kompatibles Backend funktioniert direkt, aber nicht in OpenClaw

Wenn Ihr lokales oder selbstgehostetes `/v1`-Backend kleine direkte
`/v1/chat/completions`-Probes beantwortet, aber bei `openclaw infer model run` oder normalen
Agent-Turns fehlschlägt:

1. Wenn der Fehler erwähnt, dass `messages[].content` einen String erwartet, setzen Sie
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Wenn das Backend weiterhin nur bei OpenClaw-Agent-Turns fehlschlägt, setzen Sie
   `models.providers.<provider>.models[].compat.supportsTools: false` und versuchen Sie es erneut.
3. Wenn winzige direkte Aufrufe weiterhin funktionieren, aber größere OpenClaw-Prompts das
   Backend abstürzen lassen, behandeln Sie das verbleibende Problem als Einschränkung des Upstream-Modells/-Servers und
   fahren Sie mit dem ausführlichen Runbook fort:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/de/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Plugin-Installation schlägt mit fehlenden OpenClaw-Erweiterungen fehl

Wenn die Installation mit `package.json missing openclaw.extensions` fehlschlägt, verwendet das Plugin-Paket
eine alte Struktur, die OpenClaw nicht mehr akzeptiert.

Behebung im Plugin-Paket:

1. Fügen Sie `openclaw.extensions` zu `package.json` hinzu.
2. Verweisen Sie Einträge auf gebaute Runtime-Dateien (normalerweise `./dist/index.js`).
3. Veröffentlichen Sie das Plugin erneut und führen Sie `openclaw plugins install <package>` erneut aus.

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
  B --> D[Dashboard oder Control UI verbindet sich nicht]
  B --> E[Gateway startet nicht oder Dienst läuft nicht]
  B --> F[Channel verbindet sich, aber Nachrichten fließen nicht]
  B --> G[Cron oder Heartbeat wurde nicht ausgelöst oder nicht zugestellt]
  B --> H[Node ist gekoppelt, aber camera canvas screen exec des Tools schlägt fehl]
  B --> I[Browser-Tool schlägt fehl]

  C --> C1[/Abschnitt Keine Antworten/]
  D --> D1[/Abschnitt Control UI/]
  E --> E1[/Abschnitt Gateway/]
  F --> F1[/Abschnitt Channel-Fluss/]
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
    - `RPC probe: ok`
    - Ihr Channel zeigt einen verbundenen Transport und, wo unterstützt, `works` oder `audit ok` in `channels status --probe`
    - Der Absender erscheint als genehmigt (oder die DM-Richtlinie ist open/allowlist)

    Häufige Log-Signaturen:

    - `drop guild message (mention required` → Mention-Gating hat die Nachricht in Discord blockiert.
    - `pairing request` → Absender ist nicht genehmigt und wartet auf DM-Pairing-Freigabe.
    - `blocked` / `allowlist` in den Channel-Logs → Absender, Raum oder Gruppe wird gefiltert.

    Ausführliche Seiten:

    - [/gateway/troubleshooting#no-replies](/de/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/de/channels/troubleshooting)
    - [/channels/pairing](/de/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard oder Control UI verbindet sich nicht">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Gute Ausgabe sieht so aus:

    - `Dashboard: http://...` wird in `openclaw gateway status` angezeigt
    - `RPC probe: ok`
    - Keine Auth-Schleife in den Logs

    Häufige Log-Signaturen:

    - `device identity required` → HTTP/nicht sicherer Kontext kann Geräteauthentifizierung nicht abschließen.
    - `origin not allowed` → Browser-`Origin` ist für das Gateway-Ziel der Control UI nicht erlaubt.
    - `AUTH_TOKEN_MISMATCH` mit Retry-Hinweisen (`canRetryWithDeviceToken=true`) → ein vertrauenswürdiger Retry mit Gerätetoken kann automatisch erfolgen.
    - Dieser Retry mit zwischengespeichertem Token verwendet die zwischengespeicherte Scope-Menge wieder, die mit dem gekoppelten
      Gerätetoken gespeichert wurde. Aufrufer mit explizitem `deviceToken` / expliziten `scopes` behalten stattdessen
      ihre angeforderte Scope-Menge bei.
    - Im asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dieselbe
      `{scope, ip}` serialisiert, bevor der Limiter den Fehlschlag erfasst, sodass ein
      zweiter gleichzeitiger fehlerhafter Retry bereits `retry later` anzeigen kann.
    - `too many failed authentication attempts (retry later)` von einer localhost-
      Browser-Origin → wiederholte Fehlschläge von derselben `Origin` werden vorübergehend
      gesperrt; eine andere localhost-Origin verwendet einen separaten Bucket.
    - wiederholtes `unauthorized` nach diesem Retry → falsches Token/Passwort, Auth-Modus stimmt nicht überein oder veraltetes gekoppeltes Gerätetoken.
    - `gateway connect failed:` → UI zielt auf die falsche URL/den falschen Port oder das Gateway ist nicht erreichbar.

    Ausführliche Seiten:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/de/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
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
    - `RPC probe: ok`

    Häufige Log-Signaturen:

    - `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → Gateway-Modus ist remote, oder in der Konfigurationsdatei fehlt die Markierung für den lokalen Modus und sie sollte repariert werden.
    - `refusing to bind gateway ... without auth` → Nicht-Loopback-Bind ohne gültigen Gateway-Auth-Pfad (Token/Passwort oder, falls konfiguriert, trusted-proxy).
    - `another gateway instance is already listening` oder `EADDRINUSE` → Port ist bereits belegt.

    Ausführliche Seiten:

    - [/gateway/troubleshooting#gateway-service-not-running](/de/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/de/gateway/background-process)
    - [/gateway/configuration](/de/gateway/configuration)

  </Accordion>

  <Accordion title="Channel verbindet sich, aber Nachrichten fließen nicht">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Gute Ausgabe sieht so aus:

    - Channel-Transport ist verbunden.
    - Pairing-/Allowlist-Prüfungen bestehen.
    - Erwähnungen werden erkannt, wo erforderlich.

    Häufige Log-Signaturen:

    - `mention required` → Mention-Gating hat die Verarbeitung in der Gruppe blockiert.
    - `pairing` / `pending` → DM-Absender ist noch nicht genehmigt.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → Problem mit Channel-Berechtigungstoken.

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

    - `cron.status` zeigt aktiviert mit nächstem Wake.
    - `cron runs` zeigt aktuelle `ok`-Einträge.
    - Heartbeat ist aktiviert und nicht außerhalb der aktiven Stunden.

    Häufige Log-Signaturen:

    - `cron: scheduler disabled; jobs will not run automatically` → Cron ist deaktiviert.
    - `heartbeat skipped` mit `reason=quiet-hours` → außerhalb der konfigurierten aktiven Stunden.
    - `heartbeat skipped` mit `reason=empty-heartbeat-file` → `HEARTBEAT.md` existiert, enthält aber nur leere/header-only-Struktur.
    - `heartbeat skipped` mit `reason=no-tasks-due` → `HEARTBEAT.md`-Task-Modus ist aktiv, aber noch keine der Task-Intervalle ist fällig.
    - `heartbeat skipped` mit `reason=alerts-disabled` → die gesamte Heartbeat-Sichtbarkeit ist deaktiviert (`showOk`, `showAlerts` und `useIndicator` sind alle aus).
    - `requests-in-flight` → Main-Lane ist beschäftigt; Heartbeat-Wake wurde verschoben.
    - `unknown accountId` → Ziel-Account für die Heartbeat-Zustellung existiert nicht.

    Ausführliche Seiten:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/de/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/de/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/de/gateway/heartbeat)

    </Accordion>

    <Accordion title="Node ist gekoppelt, aber das Tool schlägt bei camera canvas screen exec fehl">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw nodes status
      openclaw nodes describe --node <idOrNameOrIp>
      openclaw logs --follow
      ```

      Gute Ausgabe sieht so aus:

      - Node ist als verbunden und für die Rolle `node` gekoppelt aufgeführt.
      - Capability existiert für den Befehl, den Sie aufrufen.
      - Berechtigungsstatus ist für das Tool erteilt.

      Häufige Log-Signaturen:

      - `NODE_BACKGROUND_UNAVAILABLE` → Node-App in den Vordergrund bringen.
      - `*_PERMISSION_REQUIRED` → OS-Berechtigung wurde verweigert/fehlt.
      - `SYSTEM_RUN_DENIED: approval required` → Exec-Freigabe steht aus.
      - `SYSTEM_RUN_DENIED: allowlist miss` → Befehl steht nicht auf der Exec-Allowlist.

      Ausführliche Seiten:

      - [/gateway/troubleshooting#node-paired-tool-fails](/de/gateway/troubleshooting#node-paired-tool-fails)
      - [/nodes/troubleshooting](/de/nodes/troubleshooting)
      - [/tools/exec-approvals](/de/tools/exec-approvals)

    </Accordion>

    <Accordion title="Exec fragt plötzlich nach Freigabe">
      ```bash
      openclaw config get tools.exec.host
      openclaw config get tools.exec.security
      openclaw config get tools.exec.ask
      openclaw gateway restart
      ```

      Was sich geändert hat:

      - Wenn `tools.exec.host` nicht gesetzt ist, ist der Standardwert `auto`.
      - `host=auto` wird zu `sandbox`, wenn eine Sandbox-Runtime aktiv ist, sonst zu `gateway`.
      - `host=auto` betrifft nur das Routing; das verhaltensseitige „YOLO“ ohne Rückfrage kommt von `security=full` plus `ask=off` auf Gateway/Node.
      - Bei `gateway` und `node` ist der Standardwert für nicht gesetztes `tools.exec.security` `full`.
      - Für nicht gesetztes `tools.exec.ask` ist der Standardwert `off`.
      - Ergebnis: Wenn Sie Freigaben sehen, hat irgendeine hostlokale oder sitzungsspezifische Richtlinie exec gegenüber den aktuellen Standardwerten verschärft.

      Aktuelles Standardverhalten ohne Freigabe wiederherstellen:

      ```bash
      openclaw config set tools.exec.host gateway
      openclaw config set tools.exec.security full
      openclaw config set tools.exec.ask off
      openclaw gateway restart
      ```

      Sicherere Alternativen:

      - Setzen Sie nur `tools.exec.host=gateway`, wenn Sie nur stabiles Host-Routing möchten.
      - Verwenden Sie `security=allowlist` mit `ask=on-miss`, wenn Sie Host-Exec möchten, aber bei Allowlist-Fehlschlägen weiterhin eine Prüfung wünschen.
      - Aktivieren Sie den Sandbox-Modus, wenn Sie möchten, dass `host=auto` wieder zu `sandbox` aufgelöst wird.

      Häufige Log-Signaturen:

      - `Approval required.` → Befehl wartet auf `/approve ...`.
      - `SYSTEM_RUN_DENIED: approval required` → Freigabe für Node-Host-Exec steht aus.
      - `exec host=sandbox requires a sandbox runtime for this session` → implizite/explizite Sandbox-Auswahl, aber Sandbox-Modus ist deaktiviert.

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

      - Der Browser-Status zeigt `running: true` und einen ausgewählten Browser/ein ausgewähltes Profil.
      - `openclaw` startet, oder `user` kann lokale Chrome-Tabs sehen.

      Häufige Log-Signaturen:

      - `unknown command "browser"` oder `unknown command 'browser'` → `plugins.allow` ist gesetzt und enthält `browser` nicht.
      - `Failed to start Chrome CDP on port` → Start des lokalen Browsers ist fehlgeschlagen.
      - `browser.executablePath not found` → der konfigurierte Binärpfad ist falsch.
      - `browser.cdpUrl must be http(s) or ws(s)` → die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema.
      - `browser.cdpUrl has invalid port` → die konfigurierte CDP-URL hat einen ungültigen oder außerhalb des Bereichs liegenden Port.
      - `No Chrome tabs found for profile="user"` → das Chrome-MCP-Attach-Profil hat keine geöffneten lokalen Chrome-Tabs.
      - `Remote CDP for profile "<name>" is not reachable` → der konfigurierte Remote-CDP-Endpunkt ist von diesem Host aus nicht erreichbar.
      - `Browser attachOnly is enabled ... not reachable` oder `Browser attachOnly is enabled and CDP websocket ... is not reachable` → Attach-only-Profil hat kein aktives CDP-Ziel.
      - veraltete Viewport-/Dark-Mode-/Locale-/Offline-Overrides auf Attach-only- oder Remote-CDP-Profilen → führen Sie `openclaw browser stop --browser-profile <name>` aus, um die aktive Steuerungssitzung zu schließen und den Emulationszustand freizugeben, ohne das Gateway neu zu starten.

      Ausführliche Seiten:

      - [/gateway/troubleshooting#browser-tool-fails](/de/gateway/troubleshooting#browser-tool-fails)
      - [/tools/browser#missing-browser-command-or-tool](/de/tools/browser#missing-browser-command-or-tool)
      - [/tools/browser-linux-troubleshooting](/de/tools/browser-linux-troubleshooting)
      - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

    </Accordion>

  </AccordionGroup>

## Verwandt

- [FAQ](/de/help/faq) — häufig gestellte Fragen
- [Gateway Troubleshooting](/de/gateway/troubleshooting) — Gateway-spezifische Probleme
- [Doctor](/de/gateway/doctor) — automatisierte Zustandsprüfungen und Reparaturen
- [Channel Troubleshooting](/de/channels/troubleshooting) — Probleme mit der Channel-Konnektivität
- [Automation Troubleshooting](/de/automation/cron-jobs#troubleshooting) — Probleme mit Cron und Heartbeat
