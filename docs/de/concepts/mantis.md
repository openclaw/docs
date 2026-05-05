---
read_when:
    - Live-Visual-QA für OpenClaw-Fehler erstellen oder ausführen
    - Vorher- und Nachher-Verifizierung für einen Pull Request hinzufügen
    - Hinzufügen von Discord-, Slack-, WhatsApp- oder anderen Live-Transport-Szenarien
    - Debuggen von QA-Läufen, die Screenshots, Browser-Automatisierung oder VNC-Zugriff benötigen
summary: Mantis ist das visuelle End-to-End-Verifizierungssystem zur Reproduktion von OpenClaw-Fehlern auf Live-Transports, zum Erfassen von Vorher-/Nachher-Nachweisen und zum Anhängen von Artefakten an PRs.
title: Mantis
x-i18n:
    generated_at: "2026-05-05T06:31:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c84a09037d1edab88548eeb35a2d1b4066741511297423fe6c6fff656b95c27a
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis ist das End-to-End-Verifizierungssystem von OpenClaw für Bugs, die eine echte
Laufzeitumgebung, einen echten Transport und sichtbaren Nachweis benötigen. Es führt ein Szenario gegen eine bekannte
fehlerhafte Ref aus, erfasst Nachweise, führt dasselbe Szenario gegen eine Kandidaten-Ref aus und
veröffentlicht den Vergleich als Artefakte, die ein Maintainer aus einem PR oder
über einen lokalen Befehl prüfen kann.

Mantis beginnt mit Discord, weil Discord uns eine hochwertige erste Lane bietet:
echte Bot-Authentifizierung, echte Guild-Kanäle, Reaktionen, Threads, native Befehle und eine
Browser-UI, in der Menschen visuell bestätigen können, was der Transport angezeigt hat.

## Ziele

- Einen Bug aus einem GitHub-Issue oder PR mit derselben Transportform reproduzieren, die Benutzer
  sehen.
- Ein **Vorher**-Artefakt auf der Baseline-Ref erfassen, bevor der Fix angewendet wird.
- Ein **Nachher**-Artefakt auf der Kandidaten-Ref erfassen, nachdem der Fix angewendet wurde.
- Wann immer möglich ein deterministisches Orakel verwenden, etwa einen Discord-REST-Reaktionsabruf
  oder eine Kanal-Transkriptprüfung.
- Screenshots erfassen, wenn der Bug eine sichtbare UI-Oberfläche hat.
- Lokal über eine agentengesteuerte CLI und remote über GitHub ausführen.
- Genug Maschinenzustand für VNC-Rettung bewahren, wenn Login, Browser-Automatisierung oder
  Provider-Authentifizierung hängen bleiben.
- Einen knappen Status in einen Operator-Discord-Kanal posten, wenn der Lauf blockiert ist,
  manuelle VNC-Hilfe benötigt oder abgeschlossen ist.

## Nichtziele

- Mantis ist kein Ersatz für Unit-Tests. Ein Mantis-Lauf sollte nach dem Verständnis des Fixes
  normalerweise zu einem kleineren Regressionstest werden.
- Mantis ist nicht das normale schnelle CI-Gate. Es ist langsamer, verwendet Live-Anmeldedaten und
  ist für Bugs reserviert, bei denen die Live-Umgebung relevant ist.
- Mantis sollte für den Normalbetrieb keinen Menschen benötigen. Manuelles VNC ist ein Rettungspfad,
  nicht der Normalfall.
- Mantis speichert keine Roh-Secrets in Artefakten, Logs, Screenshots, Markdown-Berichten
  oder PR-Kommentaren.

## Zuständigkeit

Mantis gehört zum OpenClaw-QA-Stack.

- OpenClaw besitzt die Szenario-Laufzeit, Transportadapter, das Nachweisschema und
  die lokale CLI unter `pnpm openclaw qa mantis`.
- QA Lab besitzt die Live-Transport-Harness-Teile, Browser-Erfassungshelfer und
  Artefakt-Schreiber.
- Crabbox besitzt vorgewärmte Linux-Maschinen, wenn eine Remote-VM benötigt wird.
- GitHub Actions besitzt den Remote-Workflow-Einstiegspunkt und die Artefaktaufbewahrung.
- ClawSweeper besitzt das GitHub-Kommentar-Routing: Parsen von Maintainer-Befehlen,
  Auslösen des Workflows und Posten des finalen PR-Kommentars.
- OpenClaw-Agenten steuern Mantis über Codex, wenn ein Szenario agentisches Setup,
  Debugging oder Berichte über hängende Zustände benötigt.

Diese Grenze hält Transportwissen in OpenClaw, Maschinenscheduling in
Crabbox und Maintainer-Workflow-Verknüpfung in ClawSweeper.

## Befehlsform

Der erste lokale Befehl verifiziert den Discord-Bot, die Guild, den Kanal, das Senden von Nachrichten,
das Senden von Reaktionen und den Artefaktpfad:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Der lokale Vorher- und Nachher-Runner akzeptiert diese Form:

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
dass der Baseline-Status `fail` und der Kandidatenstatus `pass` ist.

Das erste VM-/Browser-Primitiv ist der Desktop-Smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Es least oder verwendet eine Crabbox-Desktop-Maschine erneut, startet einen sichtbaren Browser innerhalb der
VNC-Sitzung, erfasst den Desktop, zieht Artefakte zurück in das lokale Ausgabe-
verzeichnis und schreibt den Wiederverbindungsbefehl in den Bericht. Der Befehl verwendet standardmäßig
den Hetzner-Provider, weil er der erste Provider mit funktionierender Desktop-/VNC-
Abdeckung in der Mantis-Lane ist. Überschreiben Sie ihn mit `--provider`, `--crabbox-bin` oder
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, wenn Sie gegen eine andere Crabbox-Flotte ausführen.

Nützliche Desktop-Smoke-Flags:

- `--lease-id <cbx_...>` oder `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` verwendet einen vorgewärmten Desktop erneut.
- `--browser-url <url>` ändert die Seite, die im sichtbaren Browser geöffnet wird.
- `--html-file <path>` rendert ein repo-lokales HTML-Artefakt im sichtbaren Browser. Mantis verwendet dies, um die generierte Discord-Statusreaktions-Timeline über einen echten Crabbox-Desktop zu erfassen.
- `--keep-lease` oder `OPENCLAW_MANTIS_KEEP_VM=1` hält eine neu erstellte erfolgreiche Lease für VNC-Inspektion offen. Fehlgeschlagene Läufe behalten die Lease standardmäßig, wenn eine erstellt wurde, damit ein Operator sich erneut verbinden kann.
- `--class`, `--idle-timeout` und `--ttl` stimmen Maschinengröße und Lease-Lebensdauer ab.

Das erste vollständige Desktop-Transport-Primitiv ist der Slack-Desktop-Smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Es least oder verwendet eine Crabbox-Desktop-Maschine erneut, synchronisiert den aktuellen Checkout in
die VM, führt `pnpm openclaw qa slack` innerhalb dieser VM aus, öffnet Slack Web im VNC-
Browser, erfasst den sichtbaren Desktop und kopiert sowohl die Slack-QA-Artefakte als auch
den VNC-Screenshot zurück in das lokale Ausgabeverzeichnis. Dies ist die erste Mantis-
Form, bei der das SUT-OpenClaw-Gateway und der Browser beide in derselben
Linux-Desktop-VM leben.

Mit `--gateway-setup` bereitet der Befehl ein dauerhaftes, wegwerfbares OpenClaw-
Home unter `$HOME/.openclaw-mantis/slack-openclaw` vor, patcht die Slack-Socket-Mode-
Konfiguration für den ausgewählten Kanal, startet `openclaw gateway run` auf Port
`38973` und hält Chrome in der VNC-Sitzung am Laufen. Dies ist der Modus „lassen Sie mir einen
Linux-Desktop mit Slack und einer laufenden Claw“; die Bot-zu-Bot-Slack-QA-Lane
bleibt der Standard, wenn `--gateway-setup` weggelassen wird.

Erforderliche Eingaben für `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` für die Remote-Modell-Lane. Wenn lokal nur
  `OPENAI_API_KEY` gesetzt ist, ordnet Mantis ihn `OPENCLAW_LIVE_OPENAI_KEY` zu,
  bevor Crabbox aufgerufen wird, damit Crabboxs `OPENCLAW_*`-Env-Weiterleitung ihn
  in die VM tragen kann.

Nützliche Slack-Desktop-Flags:

- `--lease-id <cbx_...>` führt erneut gegen eine Maschine aus, auf der sich ein Operator bereits über VNC bei Slack Web angemeldet hat.
- `--gateway-setup` startet ein dauerhaftes OpenClaw-Slack-Gateway in der VM, statt nur die Bot-zu-Bot-QA-Lane auszuführen.
- `--slack-url <url>` öffnet eine bestimmte Slack-Web-URL. Ohne diese leitet Mantis `https://app.slack.com/client/<team>/<channel>` aus Slack `auth.test` ab, wenn das SUT-Bot-Token verfügbar ist.
- `--slack-channel-id <id>` steuert die Slack-Kanal-Allowlist, die vom Gateway-Setup verwendet wird.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` steuert das dauerhafte Chrome-Profil innerhalb der VM. Der Standard ist `$HOME/.config/openclaw-mantis/slack-chrome-profile`, sodass ein manueller Slack-Web-Login erneute Läufe auf derselben Lease übersteht.
- `--credential-source convex --credential-role ci` verwendet den gemeinsamen Anmeldedaten-Pool statt direkter Slack-Env-Tokens.
- `--provider-mode`, `--model`, `--alt-model` und `--fast` werden an die Slack-Live-Lane durchgereicht.

Der GitHub-Smoke-Workflow ist `Mantis Discord Smoke`. Der Vorher- und Nachher-GitHub-
Workflow für das erste echte Szenario ist `Mantis Discord Status Reactions`. Er
akzeptiert:

- `baseline_ref`: die Ref, von der erwartet wird, dass sie das Nur-Warteschlange-Verhalten reproduziert.
- `candidate_ref`: die Ref, von der erwartet wird, dass sie `queued -> thinking -> done` zeigt.

Er checkt die Workflow-Harness-Ref aus, baut getrennte Baseline- und Kandidaten-
Worktrees, führt `discord-status-reactions-tool-only` gegen jeden Worktree aus und
lädt `baseline/`, `candidate/`, `comparison.json` und `mantis-report.md` als
Actions-Artefakte hoch. Außerdem rendert er die Timeline-HTML jeder Lane in einem Crabbox-
Desktop-Browser und veröffentlicht diese VNC-Screenshots neben den deterministischen
Timeline-PNGs im PR-Kommentar. Derselbe PR-Kommentar bettet leichtgewichtige animierte
GIF-Vorschauen ein, die aus den VNC-Desktop-Aufzeichnungen generiert wurden, und verlinkt auf die vollständigen
Desktop-MP4-Dateien, während die Screenshots für eine schnelle Prüfung inline bleiben. Der
Workflow baut die Crabbox-CLI aus
`openclaw/crabbox` main, damit er die aktuellen Desktop-/Browser-Lease-Flags verwenden kann,
bevor das nächste Crabbox-Binary-Release veröffentlicht wird.

Sie können den Statusreaktions-Lauf auch direkt aus einem PR-Kommentar auslösen:

```text
@Mantis discord status reactions
```

Der Kommentar-Trigger ist absichtlich eng gefasst. Er läuft nur bei Pull-Request-
Kommentaren von Benutzern mit Schreib-, Maintain- oder Admin-Zugriff und erkennt nur
Discord-Statusreaktions-Anfragen. Standardmäßig verwendet er die bekannte fehlerhafte Baseline-Ref
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
ClawSweeper-Review-Ergebnissen empfohlenen Mantis-Szenarien zuordnen.

## Lauflebenszyklus

1. Anmeldedaten abrufen.
2. Eine VM zuweisen oder wiederverwenden.
3. Das Desktop-/Browser-Profil vorbereiten, wenn das Szenario UI-Nachweise benötigt.
4. Einen sauberen Checkout für die Baseline-Ref vorbereiten.
5. Abhängigkeiten installieren und nur das bauen, was das Szenario benötigt.
6. Ein untergeordnetes OpenClaw Gateway mit einem isolierten Zustandsverzeichnis starten.
7. Den Live-Transport, Provider, das Modell und das Browser-Profil konfigurieren.
8. Das Szenario ausführen und Baseline-Nachweise erfassen.
9. Das Gateway stoppen und Logs bewahren.
10. Die Kandidaten-Ref in derselben VM vorbereiten.
11. Dasselbe Szenario ausführen und Kandidatennachweise erfassen.
12. Die Orakelergebnisse und visuellen Nachweise vergleichen.
13. Markdown, JSON, Logs, Screenshots und optionale Trace-Artefakte schreiben.
14. GitHub-Actions-Artefakte hochladen.
15. Eine knappe PR- oder Discord-Statusmeldung posten.

Das Szenario sollte auf zwei verschiedene Arten fehlschlagen können:

- **Bug reproduziert**: Die Baseline ist auf die erwartete Weise fehlgeschlagen.
- **Harness-Fehler**: Umgebungssetup, Anmeldedaten, Discord-API, Browser oder
  Provider sind fehlgeschlagen, bevor das Bug-Orakel aussagekräftig war.

Der finale Bericht muss diese Fälle trennen, damit Maintainer eine instabile
Umgebung nicht mit Produktverhalten verwechseln.

## Discord-MVP

Das erste Szenario sollte auf Discord-Statusreaktionen in Guild-Kanälen abzielen, in denen
der Quellantwort-Zustellmodus `message_tool_only` ist.

Warum es ein guter Mantis-Startpunkt ist:

- Es ist in Discord als Reaktionen auf der auslösenden Nachricht sichtbar.
- Es hat ein starkes REST-Orakel über den Discord-Nachrichtenreaktionszustand.
- Es übt ein echtes OpenClaw Gateway, Discord-Bot-Authentifizierung, Nachrichtenversand,
  Quellantwort-Zustellmodus, Statusreaktionszustand und Modell-Turn-Lebenszyklus aus.
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
Lebenszyklusübergang im Nur-Tool-Modus. Kandidatennachweise sollten zeigen, dass Lebenszyklus-
Statusreaktionen laufen, wenn `messages.statusReactions.enabled` ausdrücklich
`true` ist.

Der erste ausführbare Ausschnitt ist das Opt-in-Discord-Live-QA-Szenario:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Es konfiguriert das SUT mit dauerhaft aktivierter Guild-Verarbeitung, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` und expliziten Statusreaktionen. Das Oracle
pollt die echte auslösende Discord-Nachricht und erwartet die beobachtete Sequenz
`👀 -> 🤔 -> 👍`. Zu den Artefakten gehören `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` und
`discord-status-reactions-tool-only-timeline.png`.

## Vorhandene QA-Bausteine

Mantis sollte auf dem vorhandenen privaten QA-Stack aufbauen, statt bei null
anzufangen:

- `pnpm openclaw qa discord` führt bereits eine Live-Discord-Lane mit Driver- und
  SUT-Bots aus.
- Der Live-Transport-Runner schreibt bereits Berichte und Artefakte zu
  beobachteten Nachrichten unter `.artifacts/qa-e2e/`.
- Convex-Credential-Leases stellen bereits exklusiven Zugriff auf gemeinsam
  genutzte Live-Transport-Credentials bereit.
- Der Browser-Control-Dienst unterstützt bereits Screenshots, Snapshots,
  verwaltete Headless-Profile und Remote-CDP-Profile.
- QA Lab hat bereits eine Debugger-UI und einen Bus für transportförmige Tests.

Die erste Mantis-Implementierung kann ein schlanker Vorher-/Nachher-Runner über
diese Bausteine sein, plus eine Schicht für visuelle Nachweise.

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

`mantis-summary.json` sollte die maschinenlesbare Source of Truth sein. Der
Markdown-Bericht ist für PR-Kommentare und die menschliche Prüfung gedacht.

Die Zusammenfassung muss Folgendes enthalten:

- getestete Refs und SHAs
- Transport- und Szenario-ID
- Maschinen-Provider und Maschinen-ID oder Lease-ID
- Credential-Quelle ohne geheime Werte
- Baseline-Ergebnis
- Candidate-Ergebnis
- ob der Bug auf der Baseline reproduziert wurde
- ob der Candidate ihn behoben hat
- Artefaktpfade
- bereinigte Einrichtungs- oder Bereinigungsprobleme

Screenshots sind Nachweise, keine Secrets. Sie erfordern dennoch Disziplin bei
der Schwärzung: private Channelnamen, Benutzernamen oder Nachrichteninhalte
können erscheinen. Für öffentliche PRs sollten GitHub-Actions-Artefaktlinks
Inline-Bildern vorgezogen werden, bis die Schwärzungsstrategie belastbarer ist.

## Browser Und VNC

Die Browser-Lane hat zwei Modi:

- **Headless-Automatisierung**: Standard für CI. Chrome läuft mit aktiviertem CDP,
  und Playwright oder OpenClaw Browser-Control erfasst Screenshots.
- **VNC-Rettung**: auf derselben VM aktiviert, wenn Anmeldung, MFA,
  Discord-Anti-Automation oder visuelles Debugging einen Menschen erfordern.

Das Discord-Observer-Browserprofil sollte persistent genug sein, um nicht bei
jedem Lauf eine Anmeldung zu benötigen, aber von persönlichem Browserzustand
isoliert sein. Ein Profil gehört zum Mantis-Maschinenpool, nicht zu einem
Entwicklerlaptop.

Wenn Mantis hängen bleibt, postet es eine Discord-Statusnachricht mit:

- Run-ID
- Szenario-ID
- Maschinen-Provider
- Artefaktverzeichnis
- VNC- oder noVNC-Verbindungsanweisungen, falls verfügbar
- kurzem Blocker-Text

Die erste private Bereitstellung kann diese Nachrichten in den vorhandenen
Operator-Channel posten und später in einen dedizierten Mantis-Channel wechseln.

## Maschinen

Mantis sollte für die erste Remote-Implementierung AWS über Crabbox bevorzugen.
Crabbox bietet uns vorgewärmte Maschinen, Lease-Tracking, Hydrierung, Logs,
Ergebnisse und Bereinigung. Wenn AWS-Kapazität zu langsam oder nicht verfügbar
ist, fügen Sie hinter derselben Maschinenschnittstelle einen Hetzner-Provider
hinzu.

Mindestanforderungen an die VM:

- Linux mit einer desktopfähigen Chrome- oder Chromium-Installation
- CDP-Zugriff für Browser-Automatisierung
- VNC oder noVNC für Rettung
- Node 22 und pnpm
- OpenClaw-Checkout und Abhängigkeitscache
- Playwright-Chromium-Browsercache, wenn Playwright verwendet wird
- ausreichend CPU und Arbeitsspeicher für ein OpenClaw Gateway, einen Browser und
  einen Modelllauf
- ausgehender Zugriff auf Discord, GitHub, Modell-Provider und den
  Credential-Broker

Die VM sollte keine langlebigen rohen Secrets außerhalb der erwarteten
Credential- oder Browserprofil-Stores behalten.

## Secrets

Secrets befinden sich in GitHub-Organisations- oder Repository-Secrets für
Remote-Läufe und in einer lokalen, vom Operator kontrollierten Secret-Datei für
lokale Läufe.

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
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Langfristig sollte der Convex-Credential-Pool die normale Quelle für
Live-Transport-Credentials bleiben. GitHub-Secrets bootstrappen den Broker und
Fallback-Lanes. Der Discord-Statusreaktionen-Workflow ordnet die
Mantis-Crabbox-Secrets wieder den Umgebungsvariablen `CRABBOX_COORDINATOR` und
`CRABBOX_COORDINATOR_TOKEN` zu, die die Crabbox-CLI erwartet. Die einfachen
GitHub-Secret-Namen `CRABBOX_*` bleiben als Kompatibilitäts-Fallback akzeptiert.

Der Mantis-Runner darf Folgendes niemals ausgeben:

- Discord-Bot-Token
- Provider-API-Schlüssel
- Browser-Cookies
- Inhalte von Auth-Profilen
- VNC-Passwörter
- rohe Credential-Payloads

Öffentliche Artefakt-Uploads sollten außerdem Discord-Zielmetadaten wie Bot-,
Guild-, Channel- und Nachrichten-IDs schwärzen. Der GitHub-Smoke-Workflow
aktiviert aus diesem Grund `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Wenn ein Token versehentlich in ein Issue, einen PR, einen Chat oder ein Log
eingefügt wird, rotieren Sie ihn, nachdem das neue Secret gespeichert wurde.

## GitHub-Artefakte Und PR-Kommentare

Mantis-Workflows sollten das vollständige Nachweis-Bundle als kurzlebiges
Actions-Artefakt hochladen. Wenn der Workflow für einen Bugbericht oder
Fix-PR ausgeführt wird, sollte er außerdem die geschwärzten PNG-Screenshots im
Branch `qa-artifacts` veröffentlichen und einen Kommentar zu diesem Bug oder
Fix-PR mit Inline-Vorher-/Nachher-Screenshots upserten. Posten Sie den primären
Nachweis nicht nur auf einem generischen QA-Automatisierungs-PR. Rohe Logs,
beobachtete Nachrichten und andere umfangreiche Nachweise verbleiben im
Actions-Artefakt.

Produktions-Workflows sollten diese Kommentare mit der Mantis GitHub App posten,
nicht mit `github-actions[bot]`. Speichern Sie die App-ID und den privaten
Schlüssel als GitHub-Actions-Secrets `MANTIS_GITHUB_APP_ID` und
`MANTIS_GITHUB_APP_PRIVATE_KEY`. Der Workflow verwendet einen versteckten Marker
als Upsert-Schlüssel, aktualisiert diesen Kommentar, wenn das Token ihn bearbeiten
kann, und erstellt einen neuen Mantis-eigenen Kommentar, wenn ein älterer
bot-eigener Marker nicht bearbeitet werden kann.

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

Wenn der Lauf fehlschlägt, weil das Harness fehlgeschlagen ist, muss der
Kommentar das entsprechend sagen, statt zu implizieren, dass der Candidate
fehlgeschlagen ist.

## Private Bereitstellungshinweise

Eine private Bereitstellung hat möglicherweise bereits eine Mantis-Discord-App.
Verwenden Sie diese App wieder, statt eine weitere App zu erstellen, wenn sie die
richtigen Bot-Berechtigungen hat und sicher rotiert werden kann.

Legen Sie den anfänglichen Operator-Benachrichtigungschannel über Secrets oder
Bereitstellungskonfiguration fest. Er kann zunächst auf einen vorhandenen
Maintainer- oder Operations-Channel zeigen und später in einen dedizierten
Mantis-Channel wechseln, sobald einer existiert.

Nehmen Sie keine Guild-IDs, Channel-IDs, Bot-Token, Browser-Cookies oder
VNC-Passwörter in dieses Dokument auf. Speichern Sie sie in GitHub-Secrets, im
Credential-Broker oder im lokalen Secret-Store des Operators.

## Szenario Hinzufügen

Ein Mantis-Szenario sollte Folgendes deklarieren:

- ID und Titel
- Transport
- erforderliche Credentials
- Baseline-Ref-Policy
- Candidate-Ref-Policy
- OpenClaw-Konfigurationspatch
- Einrichtungsschritte
- Stimulus
- erwartetes Baseline-Oracle
- erwartetes Candidate-Oracle
- Ziele für visuelle Erfassung
- Timeout-Budget
- Bereinigungsschritte

Szenarien sollten kleine, typisierte Oracles bevorzugen:

- Discord-Reaktionszustand für Reaktionsbugs
- Discord-Nachrichtenreferenzen für Threading-Bugs
- Slack-Thread-TS und Reaktions-API-Zustand für Slack-Bugs
- E-Mail-Nachrichten-IDs und Header für E-Mail-Bugs
- Browser-Screenshots, wenn die UI das einzige zuverlässige Beobachtbare ist

Vision-Prüfungen sollten additiv sein. Wenn eine Plattform-API den Bug beweisen
kann, verwenden Sie die API als Pass/Fail-Oracle und behalten Sie Screenshots für
menschliches Vertrauen bei.

## Provider-Erweiterung

Nach Discord kann derselbe Runner Folgendes hinzufügen:

- Slack: Reaktionen, Threads, App-Erwähnungen, Modals, Datei-Uploads.
- E-Mail: Gmail-Auth und Nachrichten-Threading mit `gog`, wenn Connectors nicht
  ausreichen.
- WhatsApp: QR-Login, Re-Identifizierung, Nachrichtenzustellung, Medien,
  Reaktionen.
- Telegram: Gruppenerwähnungs-Gating, Befehle, Reaktionen, sofern verfügbar.
- Matrix: verschlüsselte Räume, Thread- oder Antwortbeziehungen, Wiederaufnahme
  nach Neustart.

Jeder Transport sollte ein günstiges Smoke-Szenario und ein oder mehrere
Bugklassen-Szenarien haben. Teure visuelle Szenarien sollten Opt-in bleiben.

## Offene Fragen

- Welcher Discord-Bot sollte der Driver sein und welcher das SUT, wenn der
  vorhandene Mantis-Bot wiederverwendet wird?
- Sollte der Observer-Browser-Login in der ersten Phase ein menschliches
  Discord-Konto, ein Testkonto oder nur bot-lesbare REST-Nachweise verwenden?
- Wie lange sollte GitHub Mantis-Artefakte für PRs aufbewahren?
- Wann sollte ClawSweeper Mantis automatisch empfehlen, statt auf einen
  Maintainer-Befehl zu warten?
- Sollten Screenshots vor dem Upload für öffentliche PRs geschwärzt oder
  zugeschnitten werden?
