---
read_when:
    - OpenClaw funktioniert nicht und Sie benötigen den schnellsten Weg zu einer Lösung
    - Sie möchten einen Triage-Ablauf, bevor Sie sich in ausführliche Runbooks vertiefen
summary: Symptomorientierte zentrale Fehlerbehebung für OpenClaw
title: Allgemeine Fehlerbehebung
x-i18n:
    generated_at: "2026-07-12T15:31:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: db50e0cdf4d11f3aa6196be445358d904a2b9c40c89243f1b124c77167f6dd85
    source_path: help/troubleshooting.md
    workflow: 16
---

Triage-Einstieg. In 2 Minuten zur Diagnose, dann zur ausführlichen Seite wechseln.

## Die ersten 60 Sekunden

Führen Sie diese Befehlsfolge der Reihe nach aus:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Erwartete Ausgabe, jeweils eine Zeile:

- `openclaw status` zeigt konfigurierte Kanäle und keine Authentifizierungsfehler.
- `openclaw status --all` erstellt einen vollständigen, teilbaren Bericht.
- `openclaw gateway probe` zeigt `Reachable: yes`. `Capability: ...` ist die
  durch den Test nachgewiesene Authentifizierungsstufe; `Read probe: limited - missing scope:
operator.read` bedeutet eingeschränkte Diagnosemöglichkeiten, keinen Verbindungsfehler.
- `openclaw gateway status` zeigt `Runtime: running`, `Connectivity probe:
ok` und einen plausiblen Wert für `Capability: ...`. Fügen Sie `--require-rpc` hinzu, um außerdem
  einen RPC-Nachweis für den Lesebereich zu verlangen.
- `openclaw doctor` meldet keine blockierenden Konfigurations- oder Dienstfehler.
- `openclaw channels status --probe` gibt bei erreichbarem Gateway den aktuellen Transportstatus
  jedes Kontos zurück (`works` / `audit ok`); andernfalls wird auf
  reine Konfigurationsübersichten zurückgegriffen.
- `openclaw logs --follow` zeigt kontinuierliche Aktivität und keine wiederkehrenden schwerwiegenden Fehler.

## Assistent wirkt eingeschränkt oder Tools fehlen

Prüfen Sie das wirksame Tool-Profil:

```bash
openclaw status
openclaw status --all
openclaw doctor
```

Häufige Ursachen:

- `tools.profile: "minimal"` erlaubt nur `session_status`.
- `tools.profile: "messaging"` ist eingeschränkt und für reine Chat-Agenten vorgesehen.
- `tools.profile: "coding"` ist der Standard für neue lokale Konfigurationen (Repository-,
  Datei-, Shell- und Laufzeitarbeiten).
- `tools.profile: "full"` hebt Profileinschränkungen auf; beschränken Sie es auf vertrauenswürdige,
  durch Operatoren kontrollierte Agenten.
- Agentenspezifische Einstellungen unter `agents.list[].tools` schränken das Stammprofil
  für einen einzelnen Agenten ein oder erweitern es.

Ändern Sie das Profil, starten oder laden Sie das Gateway neu und prüfen Sie es anschließend erneut mit
`openclaw status --all`. Vollständige Profil-/Gruppentabelle: [Tool-Profile](/de/gateway/config-tools#tool-profiles).

## Anthropic: 429 bei langem Kontext

`HTTP 429: rate_limit_error: Extra usage is required for long context requests`
→ [Anthropic 429: Zusätzliche Nutzung für langen Kontext erforderlich](/de/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Lokales OpenAI-kompatibles Backend funktioniert direkt, schlägt aber in OpenClaw fehl

Ihr lokales/selbst gehostetes `/v1`-Backend beantwortet direkte
`/v1/chat/completions`-Tests, schlägt jedoch bei `openclaw infer model run` oder normalen Agentendurchläufen fehl:

1. Wenn der Fehler erwähnt, dass `messages[].content` eine Zeichenfolge erwartet, setzen Sie
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Wenn der Fehler weiterhin nur bei OpenClaw-Agentendurchläufen auftritt, setzen Sie
   `models.providers.<provider>.models[].compat.supportsTools: false` und versuchen Sie es erneut.
3. Wenn kleine direkte Aufrufe funktionieren, größere OpenClaw-Prompts das Backend jedoch zum Absturz bringen,
   handelt es sich um eine Einschränkung des vorgelagerten Modells/Servers und nicht um einen OpenClaw-Fehler. Fahren Sie unter
   [Lokales OpenAI-kompatibles Backend besteht direkte Tests, aber Agentendurchläufe schlagen fehl](/de/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail) fort.

## Plugin-Installation schlägt wegen fehlender openclaw-Erweiterungen fehl

`package.json missing openclaw.extensions` bedeutet, dass das Plugin-Paket eine
Struktur verwendet, die OpenClaw nicht mehr akzeptiert.

Korrektur im Plugin-Paket:

1. Fügen Sie `openclaw.extensions` zu `package.json` hinzu und verweisen Sie auf erstellte
   Laufzeitdateien (normalerweise `./dist/index.js`).
2. Veröffentlichen Sie das Paket erneut und führen Sie danach nochmals `openclaw plugins install <package>` aus.

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

## Installationsrichtlinie blockiert Plugin-Installationen oder -Aktualisierungen

Die Aktualisierung wird abgeschlossen, aber Plugins sind veraltet, deaktiviert oder zeigen `blocked by install
policy`, `install policy failed closed` oder `Disabled "<plugin>" after plugin
update failure`: Prüfen Sie `security.installPolicy`.

Die Installationsrichtlinie wird bei Plugin-Installationen und -Aktualisierungen ausgeführt. Versionen von
`@openclaw/*`-Plugins werden normalerweise zusammen mit der OpenClaw-Version aktualisiert. Daher kann eine
OpenClaw-Aktualisierung während der Synchronisierung nach dem Update eine passende Plugin-Aktualisierung erfordern.

Vermeiden Sie die folgenden Richtlinienformen, sofern Sie nicht auch die passende Aktualisierungsregel pflegen:

- OpenClaw-eigene Plugins auf genau eine alte Version festsetzen (beispielsweise nur
  `@openclaw/*@2026.5.3`).
- Ausschließlich nach Quelltyp blockieren (jede npm-, Netzwerk- oder `request.mode:
"update"`-Anfrage).
- Den Richtlinienbefehl als optional behandeln: Wenn `security.installPolicy`
  aktiviert ist, führt eine fehlende, langsame, nicht lesbare oder durch Berechtigungen blockierte ausführbare
  Richtliniendatei zum geschlossenen Fehlschlag.
- Versionen genehmigen, ohne das `openclawVersion` der Anfrage mit den
  Metadaten des Plugin-Kandidaten abzugleichen.

Bevorzugen Sie Regeln, die vertrauenswürdige, mit dem aktuellen Host kompatible
Aktualisierungen von `@openclaw/*` erlauben, statt dauerhaft eine Version festzusetzen. Wenn Sie npm
standardmäßig blockieren, fügen Sie eine eng begrenzte Ausnahme für die verwendeten Plugin-IDs hinzu und wenden Sie auf
`request.mode: "update"` dieselbe Vertrauensregel wie auf Installationen an.

Wiederherstellung:

```bash
openclaw doctor --deep
openclaw plugins update --all
openclaw status --all
```

Wenn die Richtlinie absichtlich streng ist, lockern Sie sie für das vertrauenswürdige
Aktualisierungsfenster, führen Sie `openclaw plugins update --all` erneut aus und stellen Sie danach die strengere Regel wieder her.
Wenn ein Plugin aufgrund eines Aktualisierungsfehlers deaktiviert wurde, prüfen Sie es vor der erneuten Aktivierung:

```bash
openclaw plugins inspect <plugin-id> --runtime --json
openclaw plugins enable <plugin-id>
```

Referenz: [Installationsrichtlinie für Operatoren](/de/tools/skills-config#operator-install-policy-securityinstallpolicy)

## Plugin vorhanden, aber wegen verdächtiger Eigentümerschaft blockiert

Warnungen von `openclaw doctor`, der Einrichtung oder beim Start zeigen:

```text
blockierter Plugin-Kandidat: verdächtige Eigentümerschaft (... uid=1000, erwartet uid=0 oder root)
Plugin vorhanden, aber blockiert
```

Die Plugin-Dateien gehören einem anderen Unix-Benutzer als dem Prozess, der
sie lädt. Entfernen Sie nicht die Plugin-Konfiguration; korrigieren Sie die Dateieigentümerschaft oder führen Sie
OpenClaw als den Benutzer aus, dem das Zustandsverzeichnis gehört.

Docker-Installationen werden als `node` (uid `1000`) ausgeführt. Reparieren Sie die Bind-Mounts des Hosts:

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
openclaw doctor --fix
```

Wenn Sie OpenClaw absichtlich als root ausführen, reparieren Sie stattdessen das verwaltete Plugin-Stammverzeichnis:

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
openclaw doctor --fix
```

Ausführlichere Dokumentation: [Blockierte Eigentümerschaft des Plugin-Pfads](/de/tools/plugin#blocked-plugin-path-ownership), [Docker: Berechtigungen und EACCES](/de/install/docker#shell-helpers-optional)

## Entscheidungsbaum

```mermaid
flowchart TD
  A[OpenClaw funktioniert nicht] --> B{Was schlägt zuerst fehl}
  B --> C[Keine Antworten]
  B --> D[Dashboard oder Control UI stellt keine Verbindung her]
  B --> E[Gateway startet nicht oder Dienst wird nicht ausgeführt]
  B --> F[Kanal stellt Verbindung her, aber Nachrichten werden nicht übertragen]
  B --> G[Cron oder Heartbeat wurde nicht ausgelöst oder nicht zugestellt]
  B --> H[Node ist gekoppelt, aber Kamera-, Canvas-, Bildschirm- oder Ausführungsfunktion schlägt fehl]
  B --> I[Browser-Tool schlägt fehl]

  C --> C1[/Abschnitt „Keine Antworten“/]
  D --> D1[/Abschnitt „Control UI“/]
  E --> E1[/Abschnitt „Gateway“/]
  F --> F1[/Abschnitt „Kanalfluss“/]
  G --> G1[/Abschnitt „Automatisierung“/]
  H --> H1[/Abschnitt „Node-Tools“/]
  I --> I1[/Abschnitt „Browser“/]
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

    Erwartete Ausgabe:

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` oder `admin-capable`
    - Der Kanal zeigt einen verbundenen Transport und, sofern unterstützt, `works` oder
      `audit ok` in `channels status --probe`
    - Der Absender ist genehmigt (oder die DM-Richtlinie ist offen/verwendet eine Zulassungsliste)

    Protokollsignaturen:

    - `drop guild message (mention required` → Die Discord-Erwähnungssperre hat die Nachricht blockiert.
    - `pairing request` → Absender nicht genehmigt; wartet auf die Genehmigung der DM-Kopplung.
    - `blocked` / `allowlist` in Kanalprotokollen → Absender, Raum oder Gruppe wurde herausgefiltert.

    Ausführliche Seiten: [Keine Antworten](/de/gateway/troubleshooting#no-replies), [Kanal-Fehlerbehebung](/de/channels/troubleshooting), [Kopplung](/de/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard oder Control UI stellt keine Verbindung her">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Erwartete Ausgabe:

    - `Dashboard: http://...` wird in `openclaw gateway status` angezeigt
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` oder `admin-capable`
    - Keine Authentifizierungsschleife in den Protokollen

    Protokollsignaturen:

    - `device identity required` → HTTP-/nicht sicherer Kontext kann die Geräteauthentifizierung nicht abschließen.
    - `origin not allowed` → Der Browser-`Origin` ist für das Gateway-Ziel der Control UI nicht zugelassen.
    - `AUTH_TOKEN_MISMATCH` mit `canRetryWithDeviceToken=true` → Ein einzelner erneuter Versuch mit einem vertrauenswürdigen Geräte-Token kann automatisch erfolgen, wobei die zwischengespeicherten Bereiche des gekoppelten Tokens wiederverwendet werden.
    - Wiederholtes `unauthorized` nach diesem erneuten Versuch → falsches Token/Passwort, nicht übereinstimmender Authentifizierungsmodus oder veraltetes Token des gekoppelten Geräts.
    - `too many failed authentication attempts (retry later)` → Wiederholte Fehlschläge von diesem Browser-`Origin` sind vorübergehend gesperrt; andere Localhost-Ursprünge verwenden separate Kontingente. Informationen zur Besonderheit gleichzeitiger Wiederholungsversuche mit Tailscale Serve finden Sie unter [Dashboard-/Control-UI-Konnektivität](/de/gateway/troubleshooting#dashboard-control-ui-connectivity).
    - `gateway connect failed:` → Die UI verwendet die falsche URL/den falschen Port oder das Gateway ist nicht erreichbar.

    Ausführliche Seiten: [Dashboard-/Control-UI-Konnektivität](/de/gateway/troubleshooting#dashboard-control-ui-connectivity), [Control UI](/de/web/control-ui), [Authentifizierung](/de/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway startet nicht oder Dienst ist installiert, wird aber nicht ausgeführt">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Erwartete Ausgabe:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` oder `admin-capable`

    Protokollsignaturen:

    - `Gateway start blocked: set gateway.mode=local` oder `existing config is missing gateway.mode` → Der Gateway-Modus ist „remote“ oder der Konfiguration fehlt die Kennzeichnung für den lokalen Modus und sie muss repariert werden.
    - `refusing to bind gateway ... without auth` → Bindung außerhalb des Loopback-Adapters ohne gültigen Authentifizierungspfad (Token/Passwort oder, sofern konfiguriert, vertrauenswürdiger Proxy).
    - `another gateway instance is already listening` oder `EADDRINUSE` → Der Port ist bereits belegt.

    Ausführliche Seiten: [Gateway-Dienst wird nicht ausgeführt](/de/gateway/troubleshooting#gateway-service-not-running), [Hintergrundprozess](/de/gateway/background-process), [Konfiguration](/de/gateway/configuration)

  </Accordion>

  <Accordion title="Kanal stellt Verbindung her, aber Nachrichten werden nicht übertragen">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Erwartete Ausgabe:

    - Kanaltransport verbunden.
    - Kopplungs-/Zulassungslistenprüfungen erfolgreich.
    - Erwähnungen werden erkannt, sofern erforderlich.

    Protokollsignaturen:

    - `mention required` → Die Erwähnungssperre für Gruppen hat die Verarbeitung blockiert.
    - `pairing` / `pending` → Der DM-Absender ist noch nicht genehmigt.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → Problem mit den Kanalberechtigungen oder dem Token.

    Ausführliche Seiten: [Kanal verbunden, Nachrichten werden nicht übertragen](/de/gateway/troubleshooting#channel-connected-messages-not-flowing), [Kanal-Fehlerbehebung](/de/channels/troubleshooting)

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

    Erwartete Ausgabe:

    - `cron status` zeigt einen aktivierten Scheduler mit dem nächsten Aktivierungszeitpunkt.
    - `cron runs` zeigt aktuelle `ok`-Einträge.
    - Heartbeat ist aktiviert und befindet sich innerhalb der aktiven Zeiten.

    Protokollsignaturen:

    - `cron: scheduler disabled; jobs will not run automatically` → Cron ist deaktiviert.
    - `heartbeat skipped` mit Grund `quiet-hours` → außerhalb der konfigurierten aktiven Zeiten.
    - `heartbeat skipped` mit Grund `empty-heartbeat-file` → `HEARTBEAT.md` ist vorhanden, enthält aber nur leere Zeilen, Kommentare, Überschriften, Codeblöcke oder ein leeres Checklisten-Gerüst.
    - `heartbeat skipped` mit Grund `no-tasks-due` → Der Aufgabenmodus ist aktiv, aber es ist noch kein Aufgabenintervall fällig.
    - `heartbeat skipped` mit Grund `alerts-disabled` → `showOk`, `showAlerts` und `useIndicator` sind alle deaktiviert.
    - `requests-in-flight` → Hauptspur ausgelastet; Heartbeat-Aktivierung verzögert.
    - `unknown accountId` → Das Zielkonto für die Heartbeat-Zustellung existiert nicht.

    Weiterführende Seiten: [Cron- und Heartbeat-Zustellung](/de/gateway/troubleshooting#cron-and-heartbeat-delivery), [Geplante Aufgaben: Fehlerbehebung](/de/automation/cron-jobs#troubleshooting), [Heartbeat](/de/gateway/heartbeat)

  </Accordion>

  <Accordion title="Node ist gekoppelt, aber das Tool schlägt bei Kamera, Canvas, Bildschirm oder Ausführung fehl">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw nodes status
    openclaw nodes describe --node <idOrNameOrIp>
    openclaw logs --follow
    ```

    Korrekte Ausgabe:

    - Node wird als verbunden und für die Rolle `node` gekoppelt aufgeführt.
    - Die Fähigkeit für den aufgerufenen Befehl ist vorhanden.
    - Der Berechtigungsstatus für das Tool lautet „erteilt“.

    Protokollsignaturen:

    - `NODE_BACKGROUND_UNAVAILABLE` → Bringen Sie die Node-App in den Vordergrund.
    - `*_PERMISSION_REQUIRED` → Betriebssystemberechtigung verweigert oder nicht vorhanden.
    - `SYSTEM_RUN_DENIED: approval required` → Die Ausführungsgenehmigung steht noch aus.
    - `SYSTEM_RUN_DENIED: allowlist miss` → Der Befehl steht nicht auf der Ausführungs-Zulassungsliste.

    Weiterführende Seiten: [Node gekoppelt, Tool schlägt fehl](/de/gateway/troubleshooting#node-paired-tool-fails), [Node-Fehlerbehebung](/de/nodes/troubleshooting), [Ausführungsgenehmigungen](/de/tools/exec-approvals)

  </Accordion>

  <Accordion title="Die Ausführung verlangt plötzlich eine Genehmigung">
    ```bash
    openclaw config get tools.exec.host
    openclaw config get tools.exec.security
    openclaw config get tools.exec.ask
    openclaw gateway restart
    ```

    Was sich geändert hat:

    - Wenn `tools.exec.host` nicht festgelegt ist, wird standardmäßig `auto` verwendet. Dies wird bei aktiver Sandbox-Laufzeit zu `sandbox` aufgelöst, andernfalls zu `gateway`.
    - `host=auto` steuert nur das Routing; das Verhalten ohne Rückfrage ergibt sich aus
      `security=full` zusammen mit `ask=off` auf Gateway/Node.
    - Wenn `tools.exec.security` nicht festgelegt ist, wird auf `gateway`/`node` standardmäßig `full` verwendet.
    - Wenn `tools.exec.ask` nicht festgelegt ist, wird standardmäßig `off` verwendet.
    - Wenn Genehmigungsanfragen angezeigt werden, wurde die Ausführung durch eine hostlokale oder sitzungsspezifische Richtlinie gegenüber diesen Standardwerten eingeschränkt.

    Aktuelle Standardwerte ohne Genehmigungsanfrage wiederherstellen:

    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```

    Sicherere Alternativen:

    - Legen Sie für ein stabiles Host-Routing nur `tools.exec.host=gateway` fest.
    - Verwenden Sie `security=allowlist` mit `ask=on-miss`, um die Host-Ausführung bei fehlenden Einträgen in der Zulassungsliste prüfen zu lassen.
    - Aktivieren Sie den Sandbox-Modus, damit `host=auto` wieder zu `sandbox` aufgelöst wird.

    Protokollsignaturen:

    - `Approval required.` → Der Befehl wartet auf `/approve ...`.
    - `SYSTEM_RUN_DENIED: approval required` → Die Genehmigung für die Ausführung auf dem Node-Host steht noch aus.
    - `exec host=sandbox requires a sandbox runtime for this session` → Implizite oder explizite Sandbox-Auswahl, der Sandbox-Modus ist jedoch deaktiviert.

    Weiterführende Seiten: [Ausführung](/de/tools/exec), [Ausführungsgenehmigungen](/de/tools/exec-approvals), [Sicherheit: Was die Prüfung kontrolliert](/de/gateway/security#what-the-audit-checks-high-level)

  </Accordion>

  <Accordion title="Browser-Tool schlägt fehl">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw browser status
    openclaw logs --follow
    openclaw doctor
    ```

    Korrekte Ausgabe:

    - Der Browserstatus zeigt `running: true` sowie einen ausgewählten Browser und ein ausgewähltes Profil.
    - Das Profil `openclaw` wird gestartet oder das Profil `user` erkennt lokale Chrome-Tabs.

    Protokollsignaturen:

    - `unknown command "browser"` → `plugins.allow` ist festgelegt und schließt `browser` aus.
    - `Failed to start Chrome CDP on port` → Der lokale Browser konnte nicht gestartet werden.
    - `browser.executablePath not found` → Der konfigurierte Pfad zur Binärdatei ist falsch.
    - `browser.cdpUrl must be http(s) or ws(s)` → Die konfigurierte CDP-URL verwendet ein nicht unterstütztes Schema.
    - `browser.cdpUrl has invalid port` → Die konfigurierte CDP-URL enthält einen ungültigen Port oder einen Port außerhalb des zulässigen Bereichs.
    - `No Chrome tabs found for profile="user"` → Das Chrome-MCP-Anbindungsprofil enthält keine geöffneten lokalen Chrome-Tabs.
    - `Remote CDP for profile "<name>" is not reachable` → Der konfigurierte entfernte CDP-Endpunkt ist von diesem Host aus nicht erreichbar.
    - `Browser attachOnly is enabled ... not reachable` → Das reine Anbindungsprofil verfügt über kein aktives CDP-Ziel.
    - Veraltete Überschreibungen für Ansichtsbereich, Dunkelmodus, Gebietsschema oder Offlinemodus in reinen Anbindungsprofilen oder entfernten CDP-Profilen → Führen Sie `openclaw browser stop --browser-profile <name>` aus, um die Steuerungssitzung zu schließen und den Emulationsstatus freizugeben, ohne das Gateway neu zu starten.

    Weiterführende Seiten: [Browser-Tool schlägt fehl](/de/gateway/troubleshooting#browser-tool-fails), [Fehlender Browserbefehl oder fehlendes Browser-Tool](/de/tools/browser#missing-browser-command-or-tool), [Browser: Linux-Fehlerbehebung](/de/tools/browser-linux-troubleshooting), [Browser: Fehlerbehebung für entfernte CDP-Verbindungen unter WSL2/Windows](/de/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

  </Accordion>

</AccordionGroup>

## Verwandte Themen

- [Häufig gestellte Fragen](/de/help/faq) — häufig gestellte Fragen
- [Gateway-Fehlerbehebung](/de/gateway/troubleshooting) — Gateway-spezifische Probleme
- [Doctor](/de/gateway/doctor) — automatisierte Zustandsprüfungen und Reparaturen
- [Kanal-Fehlerbehebung](/de/channels/troubleshooting) — Probleme mit der Kanalkonnektivität
- [Geplante Aufgaben: Fehlerbehebung](/de/automation/cron-jobs#troubleshooting) — Probleme mit Cron und Heartbeat
