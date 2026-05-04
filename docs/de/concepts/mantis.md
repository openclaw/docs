---
read_when:
    - Visuelle Live-QA für OpenClaw-Fehler erstellen oder ausführen
    - Vorher- und Nachher-Verifizierung für einen Pull Request hinzufügen
    - Hinzufügen von Discord-, Slack-, WhatsApp- oder anderen Live-Transport-Szenarien
    - Debuggen von QA-Läufen, die Screenshots, Browser-Automatisierung oder VNC-Zugriff erfordern
summary: Mantis ist das visuelle End-to-End-Verifizierungssystem zum Reproduzieren von OpenClaw-Fehlern auf Live-Transporten, Erfassen von Vorher- und Nachher-Nachweisen und Anhängen von Artefakten an PRs.
title: Fangschrecke
x-i18n:
    generated_at: "2026-05-04T06:41:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis ist das End-to-End-Verifizierungssystem von OpenClaw für Bugs, die eine echte
Runtime, einen echten Transport und sichtbare Nachweise erfordern. Es führt ein Szenario gegen einen bekannten
fehlerhaften Ref aus, erfasst Nachweise, führt dasselbe Szenario gegen einen Kandidaten-Ref aus und
veröffentlicht den Vergleich als Artefakte, die ein Maintainer von einem PR oder
über einen lokalen Befehl prüfen kann.

Mantis beginnt mit Discord, weil Discord uns eine besonders wertvolle erste Lane bietet:
echte Bot-Authentifizierung, echte Guild-Kanäle, Reaktionen, Threads, native Befehle und eine
Browser-UI, in der Menschen visuell bestätigen können, was der Transport gezeigt hat.

## Ziele

- Einen Bug aus einem GitHub-Issue oder -PR mit derselben Transportform reproduzieren, die Benutzer
  sehen.
- Ein **Vorher**-Artefakt auf dem Baseline-Ref erfassen, bevor der Fix angewendet wird.
- Ein **Nachher**-Artefakt auf dem Kandidaten-Ref erfassen, nachdem der Fix angewendet wurde.
- Wann immer möglich ein deterministisches Orakel verwenden, etwa einen Discord-REST-Reaktions-
  Abruf oder eine Prüfung des Kanaltranskripts.
- Screenshots erfassen, wenn der Bug eine sichtbare UI-Oberfläche hat.
- Lokal über eine agentengesteuerte CLI und remote über GitHub ausführen.
- Genügend Maschinenzustand für eine VNC-Rettung bewahren, wenn Login, Browser-Automatisierung oder
  Provider-Authentifizierung hängen bleiben.
- Einen knappen Status in einen Operator-Discord-Kanal posten, wenn der Lauf blockiert ist,
  manuelle VNC-Hilfe benötigt oder abgeschlossen ist.

## Nichtziele

- Mantis ist kein Ersatz für Unit-Tests. Ein Mantis-Lauf sollte nach dem Verstehen des Fixes normalerweise
  in einen kleineren Regressionstest überführt werden.
- Mantis ist nicht das normale schnelle CI-Gate. Es ist langsamer, verwendet Live-Zugangsdaten und
  ist für Bugs reserviert, bei denen die Live-Umgebung relevant ist.
- Mantis sollte im Normalbetrieb keinen Menschen erfordern. Manuelles VNC ist ein Rettungspfad,
  nicht der Normalfall.
- Mantis speichert keine Roh-Secrets in Artefakten, Logs, Screenshots, Markdown-
  Berichten oder PR-Kommentaren.

## Ownership

Mantis lebt im OpenClaw-QA-Stack.

- OpenClaw besitzt die Szenario-Runtime, Transport-Adapter, das Nachweisschema und die
  lokale CLI unter `pnpm openclaw qa mantis`.
- QA Lab besitzt die Live-Transport-Harness-Teile, Browser-Erfassungshelfer und
  Artefakt-Writer.
- Crabbox besitzt vorgewärmte Linux-Maschinen, wenn eine Remote-VM benötigt wird.
- GitHub Actions besitzt den Einstiegspunkt für den Remote-Workflow und die Artefaktaufbewahrung.
- ClawSweeper besitzt das GitHub-Kommentarrouting: Parsen von Maintainer-Befehlen,
  Dispatchen des Workflows und Posten des finalen PR-Kommentars.
- OpenClaw-Agenten steuern Mantis über Codex, wenn ein Szenario agentisches Setup,
  Debugging oder Meldungen über festhängende Zustände benötigt.

Diese Grenze hält Transportwissen in OpenClaw, Maschinenscheduling in
Crabbox und Maintainer-Workflow-Klebelogik in ClawSweeper.

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

Der Runner erstellt getrennte Baseline- und Kandidaten-Worktrees unterhalb des Ausgabe-
verzeichnisses, installiert Abhängigkeiten, baut jeden Ref, führt das Szenario mit
`--allow-failures` aus und schreibt anschließend `baseline/`, `candidate/`, `comparison.json`
und `mantis-report.md`. Für das erste Discord-Szenario bedeutet eine erfolgreiche Verifizierung,
dass der Baseline-Status `fail` und der Kandidaten-Status `pass` ist.

Das erste VM-/Browser-Primitiv ist der Desktop-Smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Es least oder verwendet eine Crabbox-Desktop-Maschine wieder, startet einen sichtbaren Browser innerhalb der
VNC-Sitzung, erfasst den Desktop, zieht Artefakte zurück in das lokale Ausgabe-
verzeichnis und schreibt den Reconnect-Befehl in den Bericht. Der Befehl verwendet standardmäßig
den Hetzner-Provider, weil er der erste Provider mit funktionierender Desktop-/VNC-
Abdeckung in der Mantis-Lane ist. Überschreiben Sie ihn mit `--provider`, `--crabbox-bin` oder
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, wenn Sie gegen eine andere Crabbox-Flotte ausführen.

Nützliche Desktop-Smoke-Flags:

- `--lease-id <cbx_...>` oder `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` verwendet einen vorgewärmten Desktop wieder.
- `--browser-url <url>` ändert die Seite, die im sichtbaren Browser geöffnet wird.
- `--html-file <path>` rendert ein repo-lokales HTML-Artefakt im sichtbaren Browser. Mantis verwendet dies, um die generierte Discord-Status-Reaktions-Timeline über einen echten Crabbox-Desktop zu erfassen.
- `--keep-lease` oder `OPENCLAW_MANTIS_KEEP_VM=1` hält eine neu erstellte, bestandene Lease für VNC-Inspektion offen. Fehlgeschlagene Läufe behalten die Lease standardmäßig, wenn eine erstellt wurde, damit ein Operator erneut verbinden kann.
- `--class`, `--idle-timeout` und `--ttl` steuern Maschinengröße und Lease-Lebensdauer.

Das erste vollständige Desktop-Transport-Primitiv ist der Slack-Desktop-Smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Es least oder verwendet eine Crabbox-Desktop-Maschine wieder, synchronisiert den aktuellen Checkout in
die VM, führt `pnpm openclaw qa slack` innerhalb dieser VM aus, öffnet Slack Web im VNC-
Browser, erfasst den sichtbaren Desktop und kopiert sowohl die Slack-QA-Artefakte als auch
den VNC-Screenshot zurück in das lokale Ausgabeverzeichnis. Dies ist die erste Mantis-
Form, bei der der SUT OpenClaw Gateway und der Browser beide in derselben
Linux-Desktop-VM leben.

Mit `--gateway-setup` bereitet der Befehl ein persistentes, wegwerfbares OpenClaw-
Home unter `$HOME/.openclaw-mantis/slack-openclaw` vor, patcht die Slack-Socket-Mode-
Konfiguration für den ausgewählten Kanal, startet `openclaw gateway run` auf Port
`38973` und lässt Chrome in der VNC-Sitzung weiterlaufen. Dies ist der Modus „geben Sie mir einen
Linux-Desktop mit Slack und einer laufenden claw“; die Bot-zu-Bot-Slack-QA-Lane
bleibt der Standard, wenn `--gateway-setup` weggelassen wird.

Erforderliche Eingaben für `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` für die Remote-Model-Lane. Wenn lokal nur
  `OPENAI_API_KEY` gesetzt ist, ordnet Mantis ihn `OPENCLAW_LIVE_OPENAI_KEY`
  zu, bevor Crabbox aufgerufen wird, damit Crabboxs `OPENCLAW_*`-Env-Weiterleitung ihn
  in die VM tragen kann.

Nützliche Slack-Desktop-Flags:

- `--lease-id <cbx_...>` führt erneut gegen eine Maschine aus, auf der ein Operator sich bereits per VNC bei Slack Web angemeldet hat.
- `--gateway-setup` startet einen persistenten OpenClaw-Slack-Gateway in der VM, statt nur die Bot-zu-Bot-QA-Lane auszuführen.
- `--slack-url <url>` öffnet eine bestimmte Slack-Web-URL. Ohne diese leitet Mantis `https://app.slack.com/client/<team>/<channel>` aus Slack `auth.test` ab, wenn das SUT-Bot-Token verfügbar ist.
- `--slack-channel-id <id>` steuert die Slack-Kanal-Allowlist, die vom Gateway-Setup verwendet wird.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` steuert das persistente Chrome-Profil innerhalb der VM. Standard ist `$HOME/.config/openclaw-mantis/slack-chrome-profile`, sodass ein manueller Slack-Web-Login erneute Läufe auf derselben Lease überlebt.
- `--credential-source convex --credential-role ci` verwendet den gemeinsamen Zugangsdatenpool statt direkter Slack-Env-Tokens.
- `--provider-mode`, `--model`, `--alt-model` und `--fast` werden an die Slack-Live-Lane weitergereicht.

Der GitHub-Smoke-Workflow ist `Mantis Discord Smoke`. Der Vorher- und Nachher-GitHub-
Workflow für das erste echte Szenario ist `Mantis Discord Status Reactions`. Er
akzeptiert:

- `baseline_ref`: der Ref, von dem erwartet wird, dass er das Nur-queued-Verhalten reproduziert.
- `candidate_ref`: der Ref, von dem erwartet wird, dass er `queued -> thinking -> done` zeigt.

Er checkt den Workflow-Harness-Ref aus, baut separate Baseline- und Kandidaten-
Worktrees, führt `discord-status-reactions-tool-only` gegen jeden Worktree aus und
lädt `baseline/`, `candidate/`, `comparison.json` und `mantis-report.md` als
Actions-Artefakte hoch. Außerdem rendert er die Timeline-HTML jeder Lane in einem Crabbox-
Desktop-Browser und veröffentlicht diese VNC-Screenshots neben den deterministischen
Timeline-PNGs im PR-Kommentar. Der Workflow baut die Crabbox-CLI aus
`openclaw/crabbox` main, damit er die aktuellen Desktop-/Browser-Lease-Flags verwenden kann,
bevor das nächste Crabbox-Binary-Release geschnitten wird.

Sie können den Status-Reactions-Lauf auch direkt über einen PR-Kommentar auslösen:

```text
@Mantis discord status reactions
```

Der Kommentar-Trigger ist absichtlich eng gefasst. Er läuft nur bei Pull-Request-
Kommentaren von Benutzern mit write-, maintain- oder admin-Zugriff, und er erkennt nur
Discord-Status-Reaction-Anfragen. Standardmäßig verwendet er den bekannten fehlerhaften Baseline-Ref
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
ClawSweeper-Review-Befunden auf empfohlene Mantis-Szenarien abbilden.

## Lauf-Lebenszyklus

1. Zugangsdaten beschaffen.
2. Eine VM zuweisen oder wiederverwenden.
3. Das Desktop-/Browser-Profil vorbereiten, wenn das Szenario UI-Nachweise benötigt.
4. Einen sauberen Checkout für den Baseline-Ref vorbereiten.
5. Abhängigkeiten installieren und nur bauen, was das Szenario benötigt.
6. Einen untergeordneten OpenClaw Gateway mit einem isolierten Zustandsverzeichnis starten.
7. Live-Transport, Provider, Model und Browser-Profil konfigurieren.
8. Das Szenario ausführen und Baseline-Nachweise erfassen.
9. Den Gateway stoppen und Logs bewahren.
10. Den Kandidaten-Ref in derselben VM vorbereiten.
11. Dasselbe Szenario ausführen und Kandidaten-Nachweise erfassen.
12. Orakel-Ergebnisse und visuelle Nachweise vergleichen.
13. Markdown, JSON, Logs, Screenshots und optionale Trace-Artefakte schreiben.
14. GitHub-Actions-Artefakte hochladen.
15. Eine knappe PR- oder Discord-Statusmeldung posten.

Das Szenario sollte auf zwei verschiedene Arten fehlschlagen können:

- **Bug reproduziert**: Baseline ist auf die erwartete Weise fehlgeschlagen.
- **Harness-Fehler**: Umgebungssetup, Zugangsdaten, Discord-API, Browser oder
  Provider sind fehlgeschlagen, bevor das Bug-Orakel aussagekräftig war.

Der finale Bericht muss diese Fälle trennen, damit Maintainer eine instabile
Umgebung nicht mit Produktverhalten verwechseln.

## Discord-MVP

Das erste Szenario sollte Discord-Statusreaktionen in Guild-Kanälen anvisieren, in denen
der Zustellmodus der Quellantwort `message_tool_only` ist.

Warum es ein guter Mantis-Startpunkt ist:

- Es ist in Discord als Reaktionen auf die auslösende Nachricht sichtbar.
- Es hat ein starkes REST-Orakel über den Reaktionszustand von Discord-Nachrichten.
- Es übt einen echten OpenClaw Gateway, Discord-Bot-Authentifizierung, Nachrichtenversand,
  Zustellmodus der Quellantwort, Statusreaktionszustand und Model-Turn-Lebenszyklus aus.
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

Baseline-Nachweise sollten die queued-Bestätigungsreaktion zeigen, aber keinen
Lebenszyklusübergang im tool-only-Modus. Kandidaten-Nachweise sollten zeigen, dass Lebenszyklus-
Statusreaktionen ausgeführt werden, wenn `messages.statusReactions.enabled` explizit
`true` ist.

Der ausführbare erste Slice ist das opt-in Discord-Live-QA-Szenario:

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
"message_tool"`, `ackReaction: "👀"` und expliziten Status-Reaktionen. Das Oracle
fragt die echte auslösende Discord-Nachricht ab und erwartet die beobachtete Sequenz
`👀 -> 🤔 -> 👍`. Artefakte umfassen `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` und
`discord-status-reactions-tool-only-timeline.png`.

## Vorhandene QA-Bausteine

Mantis sollte auf dem vorhandenen privaten QA-Stack aufbauen, statt bei null
anzufangen:

- `pnpm openclaw qa discord` führt bereits eine Live-Discord-Lane mit Driver- und
  SUT-Bots aus.
- Der Live-Transport-Runner schreibt bereits Berichte und Artefakte zu beobachteten
  Nachrichten unter `.artifacts/qa-e2e/`.
- Convex-Zugangsdaten-Leases bieten bereits exklusiven Zugriff auf gemeinsam genutzte
  Live-Transport-Zugangsdaten.
- Der Browser-Control-Dienst unterstützt bereits Screenshots, Snapshots,
  verwaltete Headless-Profile und Remote-CDP-Profile.
- QA Lab verfügt bereits über eine Debugger-UI und einen Bus für transportförmige Tests.

Die erste Mantis-Implementierung kann ein schlanker Vorher/Nachher-Runner über
diesen Bausteinen plus einer Ebene für visuelle Nachweise sein.

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
Markdown-Bericht ist für PR-Kommentare und menschliche Prüfung gedacht.

Die Zusammenfassung muss enthalten:

- getestete Refs und SHAs
- Transport und Szenario-ID
- Machine-Provider und Machine-ID oder Lease-ID
- Quelle der Zugangsdaten ohne geheime Werte
- Baseline-Ergebnis
- Candidate-Ergebnis
- ob der Fehler auf der Baseline reproduziert wurde
- ob der Candidate ihn behoben hat
- Artefaktpfade
- bereinigte Setup- oder Cleanup-Probleme

Screenshots sind Nachweise, keine Geheimnisse. Trotzdem ist sorgfältige Schwärzung
erforderlich: private Kanalnamen, Benutzernamen oder Nachrichteninhalte können
sichtbar sein. Für öffentliche PRs sollten GitHub-Actions-Artefaktlinks gegenüber
Inline-Bildern bevorzugt werden, bis die Schwärzungsstrategie robuster ist.

## Browser und VNC

Die Browser-Lane hat zwei Modi:

- **Headless-Automatisierung**: Standard für CI. Chrome läuft mit aktiviertem CDP,
  und Playwright oder OpenClaw Browser Control erfasst Screenshots.
- **VNC-Rettung**: auf derselben VM aktiviert, wenn Anmeldung, MFA, Discord-Anti-Automatisierung
  oder visuelles Debugging einen Menschen erfordern.

Das Discord-Observer-Browserprofil sollte persistent genug sein, um nicht bei jedem
Lauf eine Anmeldung zu benötigen, aber von persönlichem Browserstatus isoliert sein.
Ein Profil gehört zum Mantis-Machine-Pool, nicht zu einem Entwickler-Laptop.

Wenn Mantis feststeckt, postet es eine Discord-Statusnachricht mit:

- Lauf-ID
- Szenario-ID
- Machine-Provider
- Artefaktverzeichnis
- VNC- oder noVNC-Verbindungsanweisungen, falls verfügbar
- kurzem Blocker-Text

Die erste private Bereitstellung kann diese Nachrichten im vorhandenen Operator-Kanal
posten und später in einen dedizierten Mantis-Kanal wechseln.

## Machines

Mantis sollte für die erste Remote-Implementierung AWS über Crabbox bevorzugen.
Crabbox bietet uns vorgewärmte Machines, Lease-Tracking, Hydration, Logs, Ergebnisse
und Cleanup. Wenn AWS-Kapazität zu langsam oder nicht verfügbar ist, fügen Sie einen
Hetzner-Provider hinter derselben Machine-Schnittstelle hinzu.

Mindestanforderungen an die VM:

- Linux mit desktopfähiger Chrome- oder Chromium-Installation
- CDP-Zugriff für Browser-Automatisierung
- VNC oder noVNC für Rettung
- Node 22 und pnpm
- OpenClaw-Checkout und Dependency-Cache
- Playwright-Chromium-Browser-Cache, wenn Playwright verwendet wird
- ausreichend CPU und Arbeitsspeicher für einen OpenClaw Gateway, einen Browser und einen Modelllauf
- ausgehender Zugriff auf Discord, GitHub, Modell-Provider und den Zugangsdaten-Broker

Die VM sollte keine langlebigen Roh-Geheimnisse außerhalb der erwarteten Speicher
für Zugangsdaten oder Browserprofile behalten.

## Geheimnisse

Geheimnisse liegen für Remote-Läufe in GitHub-Organisations- oder Repository-Secrets
und für lokale Läufe in einer lokal vom Operator kontrollierten Secret-Datei.

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

Langfristig sollte der Convex-Zugangsdaten-Pool die normale Quelle für
Live-Transport-Zugangsdaten bleiben. GitHub-Secrets bootstrappen den Broker und
Fallback-Lanes. Der Discord-Status-Reactions-Workflow ordnet die Mantis-Crabbox-Secrets
wieder den Umgebungsvariablen `CRABBOX_COORDINATOR` und
`CRABBOX_COORDINATOR_TOKEN` zu, die die Crabbox-CLI erwartet. Die einfachen
GitHub-Secret-Namen `CRABBOX_*` bleiben als Kompatibilitäts-Fallback akzeptiert.

Der Mantis-Runner darf niemals ausgeben:

- Discord-Bot-Tokens
- Provider-API-Schlüssel
- Browser-Cookies
- Inhalte von Auth-Profilen
- VNC-Passwörter
- rohe Zugangsdaten-Payloads

Öffentliche Artefakt-Uploads sollten außerdem Discord-Zielmetadaten wie Bot-,
Guild-, Kanal- und Nachrichten-IDs schwärzen. Der GitHub-Smoke-Workflow aktiviert
aus diesem Grund `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Wenn ein Token versehentlich in ein Issue, einen PR, einen Chat oder ein Log eingefügt
wird, rotieren Sie ihn, nachdem das neue Secret gespeichert wurde.

## GitHub-Artefakte und PR-Kommentare

Mantis-Workflows sollten das vollständige Nachweispaket als kurzlebiges Actions-Artefakt
hochladen. Wenn der Workflow für einen Fehlerbericht oder Fix-PR ausgeführt wird,
sollte er außerdem die geschwärzten PNG-Screenshots im Branch `qa-artifacts`
veröffentlichen und einen Kommentar zu diesem Fehler oder Fix-PR mit Inline-Vorher/Nachher-Screenshots
einfügen oder aktualisieren. Posten Sie den primären Nachweis nicht nur in einem
generischen QA-Automation-PR. Roh-Logs, beobachtete Nachrichten und andere umfangreiche
Nachweise bleiben im Actions-Artefakt.

Produktions-Workflows sollten diese Kommentare mit der Mantis-GitHub-App posten,
nicht mit `github-actions[bot]`. Speichern Sie App-ID und privaten Schlüssel als
GitHub-Actions-Secrets `MANTIS_GITHUB_APP_ID` und `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Der Workflow verwendet einen versteckten Marker als Upsert-Schlüssel, aktualisiert
diesen Kommentar, wenn das Token ihn bearbeiten kann, und erstellt einen neuen
Mantis-eigenen Kommentar, wenn ein älterer bot-eigener Marker nicht bearbeitet
werden kann.

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

Wenn der Lauf fehlschlägt, weil das Harness fehlgeschlagen ist, muss der Kommentar
das entsprechend sagen, statt anzudeuten, dass der Candidate fehlgeschlagen ist.

## Private Bereitstellungshinweise

Eine private Bereitstellung hat möglicherweise bereits eine Mantis-Discord-Anwendung.
Verwenden Sie diese Anwendung wieder, statt eine weitere App zu erstellen, wenn sie
die richtigen Bot-Berechtigungen hat und sicher rotiert werden kann.

Legen Sie den anfänglichen Operator-Benachrichtigungskanal über Secrets oder
Bereitstellungskonfiguration fest. Er kann zunächst auf einen vorhandenen Maintainer-
oder Betriebskanal zeigen und später in einen dedizierten Mantis-Kanal wechseln,
sobald einer existiert.

Nehmen Sie keine Guild-IDs, Kanal-IDs, Bot-Tokens, Browser-Cookies oder VNC-Passwörter
in dieses Dokument auf. Speichern Sie sie in GitHub-Secrets, im Zugangsdaten-Broker
oder im lokalen Secret-Speicher des Operators.

## Ein Szenario hinzufügen

Ein Mantis-Szenario sollte deklarieren:

- ID und Titel
- Transport
- erforderliche Zugangsdaten
- Baseline-Ref-Richtlinie
- Candidate-Ref-Richtlinie
- OpenClaw-Konfigurations-Patch
- Setup-Schritte
- Stimulus
- erwartetes Baseline-Oracle
- erwartetes Candidate-Oracle
- Ziele für visuelle Erfassung
- Timeout-Budget
- Cleanup-Schritte

Szenarien sollten kleine, typisierte Oracles bevorzugen:

- Discord-Reaktionsstatus für Reaktionsfehler
- Discord-Nachrichtenreferenzen für Threading-Fehler
- Slack-Thread-TS und Reaction-API-Status für Slack-Fehler
- E-Mail-Nachrichten-IDs und Header für E-Mail-Fehler
- Browser-Screenshots, wenn die UI das einzige zuverlässige Beobachtbare ist

Vision-Prüfungen sollten additiv sein. Wenn eine Plattform-API den Fehler nachweisen
kann, verwenden Sie die API als Pass/Fail-Oracle und behalten Sie Screenshots für
menschliches Vertrauen bei.

## Provider-Erweiterung

Nach Discord kann derselbe Runner Folgendes hinzufügen:

- Slack: Reaktionen, Threads, App-Erwähnungen, Modals, Datei-Uploads.
- E-Mail: Gmail-Auth und Nachrichten-Threading mit `gog`, wenn Connectors nicht
  ausreichen.
- WhatsApp: QR-Anmeldung, Wiedererkennung, Nachrichtenübermittlung, Medien, Reaktionen.
- Telegram: Gruppen-Erwähnungs-Gating, Befehle, Reaktionen, wo verfügbar.
- Matrix: verschlüsselte Räume, Thread- oder Antwortbeziehungen, Fortsetzung nach Neustart.

Jeder Transport sollte ein günstiges Smoke-Szenario und ein oder mehrere
Fehlerklassen-Szenarien haben. Teure visuelle Szenarien sollten optional bleiben.

## Offene Fragen

- Welcher Discord-Bot sollte der Driver sein und welcher das SUT, wenn der vorhandene
  Mantis-Bot wiederverwendet wird?
- Sollte die Observer-Browser-Anmeldung in der ersten Phase ein menschliches
  Discord-Konto, ein Testkonto oder nur botlesbare REST-Nachweise verwenden?
- Wie lange sollte GitHub Mantis-Artefakte für PRs aufbewahren?
- Wann sollte ClawSweeper automatisch Mantis empfehlen, statt auf einen
  Maintainer-Befehl zu warten?
- Sollten Screenshots vor dem Upload für öffentliche PRs geschwärzt oder zugeschnitten
  werden?
