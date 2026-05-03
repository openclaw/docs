---
read_when:
    - Visuelle Live-QA für OpenClaw-Fehler erstellen oder ausführen
    - Vorher- und Nachher-Verifizierung für einen Pull Request hinzufügen
    - Discord-, Slack-, WhatsApp- oder andere Live-Transport-Szenarien hinzufügen
    - Debugging von QA-Läufen, die Screenshots, Browserautomatisierung oder VNC-Zugriff benötigen
summary: Mantis ist das visuelle End-to-End-Verifizierungssystem, um OpenClaw-Fehler auf Live-Transporten zu reproduzieren, Vorher- und Nachher-Nachweise zu erfassen und Artefakte an PRs anzuhängen.
title: Mantis
x-i18n:
    generated_at: "2026-05-03T21:30:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis ist das End-to-End-Verifizierungssystem von OpenClaw für Bugs, die eine echte
Runtime, einen echten Transport und sichtbare Nachweise benötigen. Es führt ein Szenario gegen eine bekannte
fehlerhafte Ref aus, erfasst Nachweise, führt dasselbe Szenario gegen eine Kandidaten-Ref aus und
veröffentlicht den Vergleich als Artefakte, die ein Maintainer aus einem PR oder
über einen lokalen Befehl prüfen kann.

Mantis beginnt mit Discord, weil Discord uns eine hochwertige erste Spur bietet:
echte Bot-Authentifizierung, echte Guild-Kanäle, Reaktionen, Threads, native Befehle und eine
Browser-UI, in der Menschen visuell bestätigen können, was der Transport gezeigt hat.

## Ziele

- Einen Bug aus einem GitHub-Issue oder PR mit derselben Transportform reproduzieren, die Benutzer
  sehen.
- Ein **Vorher**-Artefakt auf der Baseline-Ref erfassen, bevor der Fix angewendet wird.
- Ein **Nachher**-Artefakt auf der Kandidaten-Ref erfassen, nachdem der Fix angewendet wurde.
- Wann immer möglich ein deterministisches Oracle verwenden, etwa einen Discord-REST-Reaktionsabruf
  oder eine Kanaltranskript-Prüfung.
- Screenshots erfassen, wenn der Bug eine sichtbare UI-Oberfläche hat.
- Lokal über eine agentengesteuerte CLI und remote über GitHub ausführen.
- Genügend Maschinenzustand für VNC-Rettung bewahren, wenn Anmeldung, Browser-Automatisierung oder
  Provider-Authentifizierung hängen bleibt.
- Prägnanten Status in einem Operator-Discord-Kanal posten, wenn der Lauf blockiert ist,
  manuelle VNC-Hilfe benötigt oder abgeschlossen wird.

## Nicht-Ziele

- Mantis ist kein Ersatz für Unit-Tests. Ein Mantis-Lauf sollte normalerweise zu
  einem kleineren Regressionstest werden, nachdem der Fix verstanden wurde.
- Mantis ist nicht das normale schnelle CI-Gate. Es ist langsamer, verwendet Live-Zugangsdaten und
  ist Bugs vorbehalten, bei denen die Live-Umgebung wichtig ist.
- Mantis sollte für den Normalbetrieb keinen Menschen erfordern. Manuelles VNC ist ein Rettungspfad,
  nicht der Standardpfad.
- Mantis speichert keine Roh-Secrets in Artefakten, Logs, Screenshots, Markdown-
  Berichten oder PR-Kommentaren.

## Zuständigkeit

Mantis gehört zum OpenClaw-QA-Stack.

- OpenClaw besitzt die Szenario-Runtime, Transportadapter, das Nachweisschema und
  die lokale CLI unter `pnpm openclaw qa mantis`.
- QA Lab besitzt die Teile des Live-Transport-Harness, Browser-Erfassungshelfer und
  Artefakt-Writer.
- Crabbox besitzt vorgewärmte Linux-Maschinen, wenn eine Remote-VM benötigt wird.
- GitHub Actions besitzt den Remote-Workflow-Einstiegspunkt und die Artefaktaufbewahrung.
- ClawSweeper besitzt das GitHub-Kommentar-Routing: Parsen von Maintainer-Befehlen,
  Auslösen des Workflows und Posten des abschließenden PR-Kommentars.
- OpenClaw-Agenten steuern Mantis über Codex, wenn ein Szenario agentische Einrichtung,
  Debugging oder Berichte zu festgefahrenen Zuständen benötigt.

Diese Grenze hält Transportwissen in OpenClaw, Maschinenplanung in
Crabbox und Maintainer-Workflow-Verknüpfung in ClawSweeper.

## Befehlsform

Der erste lokale Befehl verifiziert den Discord-Bot, die Guild, den Kanal, das Senden von Nachrichten,
das Senden von Reaktionen und den Artefaktpfad:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Der lokale Vorher/Nachher-Runner akzeptiert diese Form:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Der Runner erstellt getrennte Baseline- und Kandidaten-Worktrees unter dem Ausgabe-
verzeichnis, installiert Abhängigkeiten, baut jede Ref, führt das Szenario mit
`--allow-failures` aus und schreibt dann `baseline/`, `candidate/`, `comparison.json`
und `mantis-report.md`. Für das erste Discord-Szenario bedeutet eine erfolgreiche Verifizierung,
dass der Baseline-Status `fail` und der Kandidaten-Status `pass` ist.

Der GitHub-Smoke-Workflow ist `Mantis Discord Smoke`. Der Vorher/Nachher-GitHub-
Workflow für das erste echte Szenario ist `Mantis Discord Status Reactions`. Er
akzeptiert:

- `baseline_ref`: die Ref, von der erwartet wird, dass sie das Nur-Warteschlange-Verhalten reproduziert.
- `candidate_ref`: die Ref, von der erwartet wird, dass sie `queued -> thinking -> done` zeigt.

Er checkt die Workflow-Harness-Ref aus, baut getrennte Baseline- und Kandidaten-
Worktrees, führt `discord-status-reactions-tool-only` gegen jeden Worktree aus und
lädt `baseline/`, `candidate/`, `comparison.json` und `mantis-report.md` als
Actions-Artefakte hoch.

Sie können den Statusreaktionslauf auch direkt über einen PR-Kommentar auslösen:

```text
@Mantis discord status reactions
```

Der Kommentar-Trigger ist absichtlich eng gefasst. Er läuft nur bei Pull-Request-
Kommentaren von Benutzern mit Schreib-, Maintain- oder Admin-Zugriff und erkennt nur
Discord-Statusreaktionsanfragen. Standardmäßig verwendet er die bekannte fehlerhafte Baseline-Ref
und den aktuellen PR-Head-SHA als Kandidaten. Maintainer können beide
Refs überschreiben:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper-Befehlsbeispiele:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Der erste Befehl ist explizit und szenariofokussiert. Der zweite kann später einen PR
oder ein Issue anhand von Labels, geänderten Dateien und
ClawSweeper-Review-Erkenntnissen empfohlenen Mantis-Szenarien zuordnen.

## Lauf-Lebenszyklus

1. Zugangsdaten beschaffen.
2. Eine VM zuweisen oder wiederverwenden.
3. Einen sauberen Checkout für die Baseline-Ref vorbereiten.
4. Abhängigkeiten installieren und nur das bauen, was das Szenario benötigt.
5. Ein untergeordnetes OpenClaw Gateway mit einem isolierten Zustandsverzeichnis starten.
6. Den Live-Transport, Provider, das Modell und das Browserprofil konfigurieren.
7. Das Szenario ausführen und Baseline-Nachweise erfassen.
8. Das Gateway stoppen und Logs bewahren.
9. Die Kandidaten-Ref in derselben VM vorbereiten.
10. Dasselbe Szenario ausführen und Kandidaten-Nachweise erfassen.
11. Die Oracle-Ergebnisse und visuellen Nachweise vergleichen.
12. Markdown, JSON, Logs, Screenshots und optionale Trace-Artefakte schreiben.
13. GitHub-Actions-Artefakte hochladen.
14. Eine prägnante PR- oder Discord-Statusmeldung posten.

Das Szenario sollte auf zwei unterschiedliche Arten fehlschlagen können:

- **Bug reproduziert**: Baseline ist auf die erwartete Weise fehlgeschlagen.
- **Harness-Fehler**: Umgebungseinrichtung, Zugangsdaten, Discord-API, Browser oder
  Provider ist fehlgeschlagen, bevor das Bug-Oracle aussagekräftig war.

Der Abschlussbericht muss diese Fälle trennen, damit Maintainer eine instabile
Umgebung nicht mit Produktverhalten verwechseln.

## Discord-MVP

Das erste Szenario sollte Discord-Statusreaktionen in Guild-Kanälen anvisieren, bei denen
der Zustellmodus der Quellantwort `message_tool_only` ist.

Warum es ein guter Mantis-Ausgangspunkt ist:

- Es ist in Discord als Reaktionen auf der auslösenden Nachricht sichtbar.
- Es hat ein starkes REST-Oracle über den Discord-Nachrichtenreaktionszustand.
- Es übt ein echtes OpenClaw Gateway, Discord-Bot-Authentifizierung, Nachrichtenversand,
  den Zustellmodus der Quellantwort, Statusreaktionszustand und den Lebenszyklus eines Modell-Turns aus.
- Es ist eng genug, um die erste Implementierung ehrlich zu halten.

Erwartete Szenarioform:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Baseline-Nachweise sollten die Warteschlangen-Bestätigungsreaktion zeigen, aber keinen
Lebenszyklusübergang im Nur-Tool-Modus. Kandidaten-Nachweise sollten zeigen, dass Lebenszyklus-
Statusreaktionen laufen, wenn `messages.statusReactions.enabled` explizit
`true` ist.

Der ausführbare erste Teil ist das opt-in Discord-Live-QA-Szenario:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Es konfiguriert das SUT mit dauerhaft aktiver Guild-Verarbeitung, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` und expliziten Statusreaktionen. Das Oracle
fragt die echte auslösende Discord-Nachricht ab und erwartet die beobachtete Sequenz
`👀 -> 🤔 -> 👍`. Artefakte enthalten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` und
`discord-status-reactions-tool-only-timeline.png`.

## Bestehende QA-Komponenten

Mantis sollte auf dem bestehenden privaten QA-Stack aufbauen, statt bei null
anzufangen:

- `pnpm openclaw qa discord` führt bereits eine Live-Discord-Spur mit Driver- und
  SUT-Bots aus.
- Der Live-Transport-Runner schreibt bereits Berichte und beobachtete Nachrichten-
  Artefakte unter `.artifacts/qa-e2e/`.
- Convex-Zugangsdaten-Leases bieten bereits exklusiven Zugriff auf gemeinsam genutzte Live-
  Transport-Zugangsdaten.
- Der Browser-Steuerungsdienst unterstützt bereits Screenshots, Snapshots,
  headless verwaltete Profile und Remote-CDP-Profile.
- QA Lab hat bereits eine Debugger-UI und einen Bus für transportförmiges Testen.

Die erste Mantis-Implementierung kann ein dünner Vorher/Nachher-Runner über diesen
Komponenten plus eine visuelle Nachweisschicht sein.

## Nachweismodell

Jeder Lauf schreibt ein stabiles Artefaktverzeichnis:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` sollte die maschinenlesbare maßgebliche Quelle sein. Der
Markdown-Bericht ist für PR-Kommentare und menschliche Prüfung bestimmt.

Die Zusammenfassung muss enthalten:

- getestete Refs und SHAs
- Transport und Szenario-ID
- Maschinen-Provider und Maschinen-ID oder Lease-ID
- Zugangsdatenquelle ohne Secret-Werte
- Baseline-Ergebnis
- Kandidaten-Ergebnis
- ob der Bug auf der Baseline reproduziert wurde
- ob der Kandidat ihn behoben hat
- Artefaktpfade
- bereinigte Einrichtungs- oder Bereinigungsprobleme

Screenshots sind Nachweise, keine Secrets. Sie benötigen dennoch Redaktionsdisziplin:
private Kanalnamen, Benutzernamen oder Nachrichteninhalt können erscheinen. Für öffentliche PRs
sollten GitHub-Actions-Artefaktlinks gegenüber Inline-Bildern bevorzugt werden, bis das Redaktionskonzept
stärker ist.

## Browser und VNC

Die Browser-Spur hat zwei Modi:

- **Headless-Automatisierung**: Standard für CI. Chrome läuft mit aktiviertem CDP, und
  Playwright oder OpenClaw-Browsersteuerung erfasst Screenshots.
- **VNC-Rettung**: auf derselben VM aktiviert, wenn Anmeldung, MFA, Discord-Anti-Automatisierung
  oder visuelles Debugging einen Menschen benötigt.

Das Discord-Beobachter-Browserprofil sollte persistent genug sein, um
nicht bei jedem Lauf eine Anmeldung zu erfordern, aber von persönlichem Browserzustand isoliert sein. Ein Profil
gehört zum Mantis-Maschinenpool, nicht zu einem Entwickler-Laptop.

Wenn Mantis hängen bleibt, postet es eine Discord-Statusmeldung mit:

- Lauf-ID
- Szenario-ID
- Maschinen-Provider
- Artefaktverzeichnis
- VNC- oder noVNC-Verbindungsanweisungen, falls verfügbar
- kurzem Blockertext

Die erste private Bereitstellung kann diese Nachrichten in den bestehenden Operator-
Kanal posten und später in einen dedizierten Mantis-Kanal umziehen.

## Maschinen

Mantis sollte für die erste Remote-Implementierung AWS über Crabbox bevorzugen.
Crabbox bietet vorgewärmte Maschinen, Lease-Tracking, Hydration, Logs, Ergebnisse und
Bereinigung. Wenn AWS-Kapazität zu langsam oder nicht verfügbar ist, fügen Sie einen Hetzner-Provider
hinter derselben Maschinenschnittstelle hinzu.

Mindestanforderungen an VMs:

- Linux mit einer Desktop-fähigen Chrome- oder Chromium-Installation
- CDP-Zugriff für Browser-Automatisierung
- VNC oder noVNC für Rettung
- Node 22 und pnpm
- OpenClaw-Checkout und Abhängigkeitscache
- Playwright-Chromium-Browsercache, wenn Playwright verwendet wird
- genug CPU und Arbeitsspeicher für ein OpenClaw Gateway, einen Browser und einen Modelllauf
- ausgehender Zugriff auf Discord, GitHub, Modell-Provider und den Zugangsdaten-Broker

Die VM sollte keine langlebigen Roh-Secrets außerhalb der erwarteten Zugangsdaten- oder
Browserprofil-Speicher behalten.

## Secrets

Secrets liegen für Remote-Läufe in GitHub-Organisations- oder Repository-Secrets und für lokale Läufe
in einer lokalen operatorgesteuerten Secret-Datei.

Empfohlene Secret-Namen:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` für öffentliche GitHub-Artefakt-Uploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

Langfristig sollte der Convex-Zugangsdatenpool die normale Quelle für Live-Transport-Zugangsdaten bleiben. GitHub-Secrets initialisieren den Broker und die Fallback-Lanes.

Der Mantis-Runner darf niemals Folgendes ausgeben:

- Discord-Bot-Token
- Provider-API-Schlüssel
- Browser-Cookies
- Inhalte von Auth-Profilen
- VNC-Passwörter
- rohe Zugangsdaten-Payloads

Öffentliche Artefakt-Uploads sollten außerdem Discord-Zielmetadaten wie Bot-, Guild-, Channel- und Nachrichten-IDs schwärzen. Der GitHub-Smoke-Workflow aktiviert deshalb `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Wenn ein Token versehentlich in ein Issue, einen PR, einen Chat oder ein Protokoll eingefügt wird, rotieren Sie ihn, nachdem das neue Secret gespeichert wurde.

## GitHub-Artefakte und PR-Kommentare

Mantis-Workflows sollten das vollständige Evidenzpaket als kurzlebiges Actions-Artefakt hochladen. Wenn der Workflow für einen Fehlerbericht oder Fix-PR ausgeführt wird, sollte er außerdem die geschwärzten PNG-Screenshots im Branch `qa-artifacts` veröffentlichen und einen Kommentar zu diesem Fehler oder Fix-PR mit Inline-Vorher/Nachher-Screenshots upserten. Veröffentlichen Sie den primären Nachweis nicht nur in einem generischen QA-Automatisierungs-PR. Rohe Protokolle, beobachtete Nachrichten und andere umfangreiche Evidenz bleiben im Actions-Artefakt.

Produktions-Workflows sollten diese Kommentare mit der Mantis GitHub App posten, nicht mit `github-actions[bot]`. Speichern Sie die App-ID und den privaten Schlüssel als GitHub-Actions-Secrets `MANTIS_GITHUB_APP_ID` und `MANTIS_GITHUB_APP_PRIVATE_KEY`. Der Workflow verwendet einen versteckten Marker als Upsert-Schlüssel, aktualisiert diesen Kommentar, wenn das Token ihn bearbeiten kann, und erstellt einen neuen Mantis-eigenen Kommentar, wenn ein älterer, bot-eigener Marker nicht bearbeitet werden kann.

Der PR-Kommentar sollte kurz und visuell sein:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Wenn der Lauf fehlschlägt, weil der Harness fehlgeschlagen ist, muss der Kommentar dies sagen, statt zu implizieren, dass der Kandidat fehlgeschlagen ist.

## Hinweise zu privaten Deployments

Ein privates Deployment hat möglicherweise bereits eine Mantis Discord-Anwendung. Verwenden Sie diese Anwendung wieder, statt eine weitere App zu erstellen, wenn sie die richtigen Bot-Berechtigungen hat und sicher rotiert werden kann.

Legen Sie den anfänglichen Operator-Benachrichtigungskanal über Secrets oder die Deployment-Konfiguration fest. Er kann zunächst auf einen bestehenden Maintainer- oder Betriebskanal verweisen und dann in einen dedizierten Mantis-Kanal verschoben werden, sobald einer existiert.

Legen Sie keine Guild-IDs, Channel-IDs, Bot-Token, Browser-Cookies oder VNC-Passwörter in diesem Dokument ab. Speichern Sie sie in GitHub-Secrets, im Zugangsdaten-Broker oder im lokalen Secret-Speicher des Operators.

## Ein Szenario hinzufügen

Ein Mantis-Szenario sollte Folgendes deklarieren:

- ID und Titel
- Transport
- erforderliche Zugangsdaten
- Baseline-Ref-Richtlinie
- Kandidaten-Ref-Richtlinie
- OpenClaw-Konfigurations-Patch
- Einrichtungsschritte
- Stimulus
- erwartetes Baseline-Orakel
- erwartetes Kandidaten-Orakel
- Ziele für visuelle Erfassung
- Timeout-Budget
- Bereinigungsschritte

Szenarien sollten kleine, typisierte Orakel bevorzugen:

- Discord-Reaktionsstatus für Reaktionsfehler
- Discord-Nachrichtenreferenzen für Threading-Fehler
- Slack-Thread-TS und Reaktions-API-Status für Slack-Fehler
- E-Mail-Nachrichten-IDs und Header für E-Mail-Fehler
- Browser-Screenshots, wenn die UI das einzige zuverlässige Beobachtbare ist

Vision-Prüfungen sollten additiv sein. Wenn eine Plattform-API den Fehler nachweisen kann, verwenden Sie die API als Bestehen/Fehlschlagen-Orakel und behalten Sie Screenshots für menschliches Vertrauen bei.

## Provider-Erweiterung

Nach Discord kann derselbe Runner Folgendes hinzufügen:

- Slack: Reaktionen, Threads, App-Erwähnungen, Modale, Datei-Uploads.
- E-Mail: Gmail-Authentifizierung und Nachrichten-Threading mit `gog`, wenn Connectoren nicht ausreichen.
- WhatsApp: QR-Login, erneute Identifizierung, Nachrichtenzustellung, Medien, Reaktionen.
- Telegram: Gate für Gruppenerwähnungen, Befehle, Reaktionen, sofern verfügbar.
- Matrix: verschlüsselte Räume, Thread- oder Antwortbeziehungen, Fortsetzung nach Neustart.

Jeder Transport sollte ein günstiges Smoke-Szenario und ein oder mehrere Fehlerklassen-Szenarien haben. Teure visuelle Szenarien sollten Opt-in bleiben.

## Offene Fragen

- Welcher Discord-Bot sollte der Driver sein und welcher das SUT, wenn der bestehende Mantis-Bot wiederverwendet wird?
- Sollte der Observer-Browser-Login in der ersten Phase ein menschliches Discord-Konto, ein Testkonto oder nur bot-lesbare REST-Evidenz verwenden?
- Wie lange sollte GitHub Mantis-Artefakte für PRs aufbewahren?
- Wann sollte ClawSweeper automatisch Mantis empfehlen, statt auf einen Maintainer-Befehl zu warten?
- Sollten Screenshots vor dem Upload für öffentliche PRs geschwärzt oder zugeschnitten werden?
