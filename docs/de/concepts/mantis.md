---
read_when:
    - Live-Visual-QA für OpenClaw-Fehler erstellen oder ausführen
    - Vorher- und Nachher-Verifizierung für einen Pull Request hinzufügen
    - Hinzufügen von Discord-, Slack-, WhatsApp- oder anderen Live-Transport-Szenarien
    - Debugging von QA-Läufen, die Screenshots, Browserautomatisierung oder VNC-Zugriff erfordern
summary: Mantis ist das visuelle End-to-End-Verifizierungssystem, mit dem OpenClaw-Fehler auf Live-Transporten reproduziert, Vorher- und Nachher-Nachweise erfasst und Artefakte an PRs angehängt werden.
title: Mantis
x-i18n:
    generated_at: "2026-05-04T02:23:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis ist das End-to-End-Verifikationssystem von OpenClaw für Bugs, die eine echte
Runtime, einen echten Transport und sichtbare Nachweise benötigen. Es führt ein Szenario gegen eine bekannte
fehlerhafte Ref aus, erfasst Nachweise, führt dasselbe Szenario gegen eine Kandidaten-Ref aus und
veröffentlicht den Vergleich als Artefakte, die ein Maintainer aus einem PR oder
über einen lokalen Befehl prüfen kann.

Mantis beginnt mit Discord, weil Discord uns eine hochwertige erste Lane bietet:
echte Bot-Authentifizierung, echte Guild-Kanäle, Reaktionen, Threads, native Befehle und eine
Browser-UI, in der Menschen visuell bestätigen können, was der Transport gezeigt hat.

## Ziele

- Einen Bug aus einem GitHub-Issue oder PR mit derselben Transportform reproduzieren, die Benutzer
  sehen.
- Ein **Vorher**-Artefakt auf der Baseline-Ref erfassen, bevor der Fix angewendet wird.
- Ein **Nachher**-Artefakt auf der Kandidaten-Ref erfassen, nachdem der Fix angewendet wurde.
- Wann immer möglich ein deterministisches Oracle verwenden, etwa einen Discord-REST-Reaktions-
  Read oder eine Channel-Transkriptprüfung.
- Screenshots erfassen, wenn der Bug eine sichtbare UI-Oberfläche hat.
- Lokal über eine agentengesteuerte CLI und remote über GitHub ausführen.
- Genug Maschinenzustand für VNC-Rettung bewahren, wenn Login, Browser-Automatisierung oder
  Provider-Authentifizierung hängen bleiben.
- Einen knappen Status an einen Operator-Discord-Kanal senden, wenn der Lauf blockiert ist,
  manuelle VNC-Hilfe benötigt oder abgeschlossen ist.

## Nichtziele

- Mantis ist kein Ersatz für Unit-Tests. Ein Mantis-Lauf sollte nach dem Verständnis des Fixes normalerweise zu
  einem kleineren Regressionstest werden.
- Mantis ist nicht das normale schnelle CI-Gate. Es ist langsamer, verwendet Live-Anmeldedaten und
  ist für Bugs reserviert, bei denen die Live-Umgebung wichtig ist.
- Mantis sollte im normalen Betrieb keinen Menschen erfordern. Manuelles VNC ist ein Rettungsweg,
  nicht der Standardpfad.
- Mantis speichert keine Roh-Secrets in Artefakten, Logs, Screenshots, Markdown-
  Berichten oder PR-Kommentaren.

## Ownership

Mantis befindet sich im OpenClaw-QA-Stack.

- OpenClaw besitzt die Szenario-Runtime, Transportadapter, das Nachweisschema und die
  lokale CLI unter `pnpm openclaw qa mantis`.
- QA Lab besitzt die Live-Transport-Harness-Teile, Browser-Erfassungshelfer und
  Artefakt-Writer.
- Crabbox besitzt vorgewärmte Linux-Maschinen, wenn eine Remote-VM benötigt wird.
- GitHub Actions besitzt den Remote-Workflow-Einstiegspunkt und die Artefaktaufbewahrung.
- ClawSweeper besitzt das GitHub-Kommentarrouting: Maintainer-Befehle parsen,
  den Workflow auslösen und den finalen PR-Kommentar posten.
- OpenClaw-Agenten steuern Mantis über Codex, wenn ein Szenario agentisches Setup,
  Debugging oder Berichte über festhängende Zustände benötigt.

Diese Grenze hält Transportwissen in OpenClaw, Maschinenplanung in
Crabbox und Maintainer-Workflow-Klebstoff in ClawSweeper.

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
und `mantis-report.md`. Für das erste Discord-Szenario bedeutet eine erfolgreiche Verifikation,
dass der Baseline-Status `fail` und der Kandidaten-Status `pass` ist.

Das erste VM/Browser-Primitive ist der Desktop-Smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Es least eine Crabbox-Desktop-Maschine oder verwendet sie erneut, startet einen sichtbaren Browser innerhalb der
VNC-Sitzung, erfasst den Desktop, zieht Artefakte zurück in das lokale Ausgabe-
verzeichnis und schreibt den Wiederverbindungsbefehl in den Bericht. Der Befehl verwendet standardmäßig
den Hetzner-Provider, weil er der erste Provider mit funktionierender Desktop/VNC-
Abdeckung in der Mantis-Lane ist. Überschreiben Sie ihn mit `--provider`, `--crabbox-bin` oder
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, wenn Sie gegen eine andere Crabbox-Flotte ausführen.

Nützliche Desktop-Smoke-Flags:

- `--lease-id <cbx_...>` oder `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` verwendet einen vorgewärmten Desktop erneut.
- `--browser-url <url>` ändert die Seite, die im sichtbaren Browser geöffnet wird.
- `--html-file <path>` rendert ein repo-lokales HTML-Artefakt im sichtbaren Browser. Mantis verwendet dies, um die generierte Discord-Statusreaktions-Timeline über einen echten Crabbox-Desktop zu erfassen.
- `--keep-lease` oder `OPENCLAW_MANTIS_KEEP_VM=1` hält eine neu erstellte erfolgreiche Lease für die VNC-Prüfung offen. Fehlgeschlagene Läufe halten die Lease standardmäßig offen, wenn eine erstellt wurde, damit ein Operator sich erneut verbinden kann.
- `--class`, `--idle-timeout` und `--ttl` stimmen Maschinengröße und Lease-Lebensdauer ab.

Der GitHub-Smoke-Workflow ist `Mantis Discord Smoke`. Der Vorher/Nachher-GitHub-
Workflow für das erste echte Szenario ist `Mantis Discord Status Reactions`. Er
akzeptiert:

- `baseline_ref`: die Ref, von der erwartet wird, dass sie das reine Warteschlangenverhalten reproduziert.
- `candidate_ref`: die Ref, von der erwartet wird, dass sie `queued -> thinking -> done` zeigt.

Er checkt die Workflow-Harness-Ref aus, baut separate Baseline- und Kandidaten-
Worktrees, führt `discord-status-reactions-tool-only` gegen jeden Worktree aus und
lädt `baseline/`, `candidate/`, `comparison.json` und `mantis-report.md` als
Actions-Artefakte hoch. Er rendert außerdem die Timeline-HTML jeder Lane in einem Crabbox-
Desktop-Browser und veröffentlicht diese VNC-Screenshots neben den deterministischen
Timeline-PNGs im PR-Kommentar. Der Workflow baut die Crabbox-CLI aus
`openclaw/crabbox` main, damit er die aktuellen Desktop/Browser-Lease-Flags verwenden kann,
bevor das nächste Crabbox-Binary-Release erstellt wird.

Sie können den Statusreaktionslauf auch direkt über einen PR-Kommentar auslösen:

```text
@Mantis discord status reactions
```

Der Kommentar-Trigger ist absichtlich eng gefasst. Er läuft nur bei Pull-Request-
Kommentaren von Benutzern mit Schreib-, Maintainer- oder Admin-Zugriff, und er erkennt nur
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
ClawSweeper-Review-Ergebnissen empfohlenen Mantis-Szenarien zuordnen.

## Lauflebenszyklus

1. Anmeldedaten abrufen.
2. Eine VM zuweisen oder erneut verwenden.
3. Das Desktop/Browser-Profil vorbereiten, wenn das Szenario UI-Nachweise benötigt.
4. Einen sauberen Checkout für die Baseline-Ref vorbereiten.
5. Abhängigkeiten installieren und nur das bauen, was das Szenario benötigt.
6. Ein untergeordnetes OpenClaw Gateway mit einem isolierten Zustandsverzeichnis starten.
7. Live-Transport, Provider, Modell und Browserprofil konfigurieren.
8. Das Szenario ausführen und Baseline-Nachweise erfassen.
9. Das Gateway stoppen und Logs bewahren.
10. Die Kandidaten-Ref in derselben VM vorbereiten.
11. Dasselbe Szenario ausführen und Kandidaten-Nachweise erfassen.
12. Oracle-Ergebnisse und visuelle Nachweise vergleichen.
13. Markdown, JSON, Logs, Screenshots und optionale Trace-Artefakte schreiben.
14. GitHub-Actions-Artefakte hochladen.
15. Eine knappe PR- oder Discord-Statusnachricht posten.

Das Szenario sollte auf zwei unterschiedliche Arten fehlschlagen können:

- **Bug reproduziert**: Baseline ist auf die erwartete Weise fehlgeschlagen.
- **Harness-Fehler**: Umgebungssetup, Anmeldedaten, Discord-API, Browser oder
  Provider sind fehlgeschlagen, bevor das Bug-Oracle aussagekräftig war.

Der finale Bericht muss diese Fälle trennen, damit Maintainer eine instabile
Umgebung nicht mit Produktverhalten verwechseln.

## Discord-MVP

Das erste Szenario sollte Discord-Statusreaktionen in Guild-Kanälen anvisieren, in denen
der Antwortzustellmodus der Quelle `message_tool_only` ist.

Warum es ein guter Mantis-Seed ist:

- Es ist in Discord als Reaktionen auf die auslösende Nachricht sichtbar.
- Es hat ein starkes REST-Oracle über den Discord-Nachrichtenreaktionszustand.
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
Lebenszyklusübergang im Tool-only-Modus. Kandidaten-Nachweise sollten zeigen, dass Lebenszyklus-
Statusreaktionen ausgeführt werden, wenn `messages.statusReactions.enabled` explizit
true ist.

Der ausführbare erste Abschnitt ist das Opt-in-Discord-Live-QA-Szenario:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Es konfiguriert das SUT mit immer aktivierter Guild-Verarbeitung, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` und expliziten Statusreaktionen. Das Oracle
pollt die echte auslösende Discord-Nachricht und erwartet die beobachtete Sequenz
`👀 -> 🤔 -> 👍`. Artefakte enthalten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` und
`discord-status-reactions-tool-only-timeline.png`.

## Bestehende QA-Teile

Mantis sollte auf dem bestehenden privaten QA-Stack aufbauen, statt bei
null zu beginnen:

- `pnpm openclaw qa discord` führt bereits eine Live-Discord-Lane mit Driver- und
  SUT-Bots aus.
- Der Live-Transport-Runner schreibt bereits Berichte und beobachtete Nachrichten-
  Artefakte unter `.artifacts/qa-e2e/`.
- Convex-Anmeldedaten-Leases bieten bereits exklusiven Zugriff auf gemeinsam genutzte Live-
  Transport-Anmeldedaten.
- Der Browsersteuerungsdienst unterstützt bereits Screenshots, Snapshots,
  headless verwaltete Profile und Remote-CDP-Profile.
- QA Lab hat bereits eine Debugger-UI und einen Bus für transportförmige Tests.

Die erste Mantis-Implementierung kann ein dünner Vorher/Nachher-Runner über diesen
Teilen sein, plus eine Ebene für visuelle Nachweise.

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
Markdown-Bericht ist für PR-Kommentare und menschliche Prüfung.

Die Zusammenfassung muss enthalten:

- getestete Refs und SHAs
- Transport und Szenario-ID
- Maschinen-Provider und Maschinen-ID oder Lease-ID
- Quelle der Anmeldedaten ohne Secret-Werte
- Baseline-Ergebnis
- Kandidatenergebnis
- ob der Bug auf der Baseline reproduziert wurde
- ob der Kandidat ihn behoben hat
- Artefaktpfade
- bereinigte Setup- oder Cleanup-Probleme

Screenshots sind Nachweise, keine Secrets. Sie benötigen trotzdem Redaktionsdisziplin:
private Kanalnamen, Benutzernamen oder Nachrichteninhalte können erscheinen. Für öffentliche PRs
sollten GitHub-Actions-Artefaktlinks gegenüber Inline-Bildern bevorzugt werden, bis die Redaktionsgeschichte
stärker ist.

## Browser und VNC

Die Browser-Lane hat zwei Modi:

- **Headless-Automatisierung**: Standard für CI. Chrome läuft mit aktiviertem CDP, und
  Playwright oder die OpenClaw-Browsersteuerung erfasst Screenshots.
- **VNC-Rettung**: auf derselben VM aktiviert, wenn Login, MFA, Discord-Anti-Automatisierung
  oder visuelles Debugging einen Menschen benötigt.

Das Discord-Observer-Browserprofil sollte persistent genug sein, um nicht bei jedem Lauf eine Anmeldung zu erfordern, aber vom persönlichen Browserzustand isoliert sein. Ein Profil gehört zum Mantis-Maschinenpool, nicht zu einem Entwickler-Laptop.

Wenn Mantis hängen bleibt, postet es eine Discord-Statusmeldung mit:

- Lauf-ID
- Szenario-ID
- Maschinen-Provider
- Artefaktverzeichnis
- VNC- oder noVNC-Verbindungsanweisungen, falls verfügbar
- kurzem Blocker-Text

Die erste private Bereitstellung kann diese Nachrichten im bestehenden Operator-Kanal posten und später in einen dedizierten Mantis-Kanal wechseln.

## Maschinen

Mantis sollte für die erste Remote-Implementierung AWS über Crabbox bevorzugen. Crabbox gibt uns vorgewärmte Maschinen, Lease-Tracking, Hydration, Logs, Ergebnisse und Bereinigung. Wenn AWS-Kapazität zu langsam oder nicht verfügbar ist, fügen Sie hinter derselben Maschinenschnittstelle einen Hetzner-Provider hinzu.

Mindestanforderungen an die VM:

- Linux mit einer desktopfähigen Chrome- oder Chromium-Installation
- CDP-Zugriff für Browserautomatisierung
- VNC oder noVNC für Rettungszugriff
- Node 22 und pnpm
- OpenClaw-Checkout und Dependency-Cache
- Playwright-Chromium-Browsercache, wenn Playwright verwendet wird
- genügend CPU und Arbeitsspeicher für ein OpenClaw Gateway, einen Browser und einen Modelllauf
- ausgehender Zugriff auf Discord, GitHub, Modell-Provider und den Credential Broker

Die VM sollte keine langlebigen Roh-Secrets außerhalb der erwarteten Credential- oder Browserprofilspeicher aufbewahren.

## Secrets

Secrets befinden sich in GitHub-Organisations- oder Repository-Secrets für Remote-Läufe und in einer lokalen, vom Operator kontrollierten Secret-Datei für lokale Läufe.

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

Langfristig sollte der Convex-Credential-Pool die normale Quelle für Live-Transport-Credentials bleiben. GitHub-Secrets bootstrappen den Broker und Fallback-Lanes. Der Discord-Status-Reactions-Workflow ordnet die Mantis-Crabbox-Secrets wieder den Umgebungsvariablen `CRABBOX_COORDINATOR` und `CRABBOX_COORDINATOR_TOKEN` zu, die die Crabbox-CLI erwartet. Die einfachen GitHub-Secret-Namen `CRABBOX_*` bleiben als Kompatibilitäts-Fallback akzeptiert.

Der Mantis-Runner darf niemals Folgendes ausgeben:

- Discord-Bot-Tokens
- Provider-API-Schlüssel
- Browser-Cookies
- Inhalte von Auth-Profilen
- VNC-Passwörter
- rohe Credential-Payloads

Öffentliche Artefakt-Uploads sollten außerdem Discord-Zielmetadaten wie Bot-, Guild-, Kanal- und Nachrichten-IDs schwärzen. Der GitHub-Smoke-Workflow aktiviert aus diesem Grund `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Wenn ein Token versehentlich in ein Issue, einen PR, einen Chat oder ein Log eingefügt wird, rotieren Sie es, nachdem das neue Secret gespeichert wurde.

## GitHub-Artefakte und PR-Kommentare

Mantis-Workflows sollten das vollständige Evidenzpaket als kurzlebiges Actions-Artefakt hochladen. Wenn der Workflow für einen Bug-Report oder Fix-PR ausgeführt wird, sollte er außerdem die geschwärzten PNG-Screenshots im Branch `qa-artifacts` veröffentlichen und einen Kommentar in diesem Bug- oder Fix-PR mit eingebetteten Vorher/Nachher-Screenshots upserten. Posten Sie den primären Nachweis nicht nur in einem generischen QA-Automatisierungs-PR. Rohe Logs, beobachtete Nachrichten und andere umfangreiche Evidenz bleiben im Actions-Artefakt.

Produktions-Workflows sollten diese Kommentare mit der Mantis-GitHub-App posten, nicht mit `github-actions[bot]`. Speichern Sie die App-ID und den privaten Schlüssel als GitHub-Actions-Secrets `MANTIS_GITHUB_APP_ID` und `MANTIS_GITHUB_APP_PRIVATE_KEY`. Der Workflow verwendet einen versteckten Marker als Upsert-Schlüssel, aktualisiert diesen Kommentar, wenn das Token ihn bearbeiten kann, und erstellt einen neuen Mantis-eigenen Kommentar, wenn ein älterer bot-eigener Marker nicht bearbeitet werden kann.

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

Wenn der Lauf fehlschlägt, weil das Harness fehlgeschlagen ist, muss der Kommentar das entsprechend sagen, statt anzudeuten, dass der Candidate fehlgeschlagen ist.

## Hinweise zur privaten Bereitstellung

Eine private Bereitstellung hat möglicherweise bereits eine Mantis-Discord-Anwendung. Verwenden Sie diese Anwendung erneut, statt eine weitere App zu erstellen, wenn sie die richtigen Bot-Berechtigungen hat und sicher rotiert werden kann.

Legen Sie den anfänglichen Operator-Benachrichtigungskanal über Secrets oder Bereitstellungskonfiguration fest. Er kann zunächst auf einen bestehenden Maintainer- oder Betriebskanal zeigen und später in einen dedizierten Mantis-Kanal wechseln, sobald einer existiert.

Speichern Sie keine Guild-IDs, Kanal-IDs, Bot-Tokens, Browser-Cookies oder VNC-Passwörter in diesem Dokument. Speichern Sie sie in GitHub-Secrets, im Credential Broker oder im lokalen Secret-Speicher des Operators.

## Ein Szenario hinzufügen

Ein Mantis-Szenario sollte Folgendes deklarieren:

- ID und Titel
- Transport
- erforderliche Credentials
- Baseline-Ref-Richtlinie
- Candidate-Ref-Richtlinie
- OpenClaw-Konfigurationspatch
- Setup-Schritte
- Stimulus
- erwartetes Baseline-Orakel
- erwartetes Candidate-Orakel
- Ziele für visuelle Erfassung
- Timeout-Budget
- Bereinigungsschritte

Szenarien sollten kleine, typisierte Orakel bevorzugen:

- Discord-Reaktionszustand für Reaktions-Bugs
- Discord-Nachrichtenreferenzen für Threading-Bugs
- Slack-Thread-ts und Reaktions-API-Zustand für Slack-Bugs
- E-Mail-Nachrichten-IDs und Header für E-Mail-Bugs
- Browser-Screenshots, wenn die UI die einzige zuverlässige beobachtbare Größe ist

Vision-Prüfungen sollten additiv sein. Wenn eine Plattform-API den Bug beweisen kann, verwenden Sie die API als Pass/Fail-Orakel und behalten Sie Screenshots für menschliches Vertrauen bei.

## Provider-Erweiterung

Nach Discord kann derselbe Runner Folgendes hinzufügen:

- Slack: Reaktionen, Threads, App-Erwähnungen, Modals, Datei-Uploads.
- E-Mail: Gmail-Auth und Nachrichten-Threading mit `gog`, wenn Connectors nicht ausreichen.
- WhatsApp: QR-Login, Re-Identifikation, Nachrichtenzustellung, Medien, Reaktionen.
- Telegram: Gruppenerwähnungs-Gating, Befehle, Reaktionen, wo verfügbar.
- Matrix: verschlüsselte Räume, Thread- oder Antwortbeziehungen, Wiederaufnahme nach Neustart.

Jeder Transport sollte ein günstiges Smoke-Szenario und ein oder mehrere Bugklassen-Szenarien haben. Teure visuelle Szenarien sollten opt-in bleiben.

## Offene Fragen

- Welcher Discord-Bot sollte der Driver sein und welcher das SUT, wenn der bestehende Mantis-Bot wiederverwendet wird?
- Sollte die Observer-Browser-Anmeldung für die erste Phase ein menschliches Discord-Konto, ein Testkonto oder nur bot-lesbare REST-Evidenz verwenden?
- Wie lange sollte GitHub Mantis-Artefakte für PRs aufbewahren?
- Wann sollte ClawSweeper Mantis automatisch empfehlen, statt auf einen Maintainer-Befehl zu warten?
- Sollten Screenshots vor dem Upload für öffentliche PRs geschwärzt oder zugeschnitten werden?
