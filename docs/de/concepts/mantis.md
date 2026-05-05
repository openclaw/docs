---
read_when:
    - Live-Visual-QA für OpenClaw-Fehler erstellen oder ausführen
    - Vorher- und Nachher-Verifizierung für einen Pull Request hinzufügen
    - Hinzufügen von Discord-, Slack-, WhatsApp- oder anderen Live-Transport-Szenarien
    - QA-Läufe debuggen, die Screenshots, Browser-Automatisierung oder VNC-Zugriff benötigen
summary: Mantis ist das visuelle End-to-End-Verifizierungssystem zum Reproduzieren von OpenClaw-Fehlern auf Live-Transporten, zum Erfassen von Vorher- und Nachher-Nachweisen und zum Anhängen von Artefakten an PRs.
title: Mantis
x-i18n:
    generated_at: "2026-05-05T08:25:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis ist das End-to-End-Verifizierungssystem von OpenClaw für Fehler, die eine echte
Laufzeitumgebung, einen echten Transport und sichtbare Nachweise benötigen. Es führt ein Szenario gegen eine bekannte
fehlerhafte Ref aus, erfasst Nachweise, führt dasselbe Szenario gegen eine Kandidaten-Ref aus und
veröffentlicht den Vergleich als Artefakte, die ein Maintainer über einen PR oder
über einen lokalen Befehl prüfen kann.

Mantis beginnt mit Discord, weil Discord uns einen hochwertigen ersten Testpfad bietet:
echte Bot-Authentifizierung, echte Guild-Kanäle, Reaktionen, Threads, native Befehle und eine
Browser-UI, in der Menschen visuell bestätigen können, was der Transport angezeigt hat.

## Ziele

- Einen Fehler aus einem GitHub-Issue oder PR mit derselben Transportform reproduzieren, die Benutzer
  sehen.
- Ein **Vorher**-Artefakt auf der Baseline-Ref erfassen, bevor der Fix angewendet wird.
- Ein **Nachher**-Artefakt auf der Kandidaten-Ref erfassen, nachdem der Fix angewendet wurde.
- Wann immer möglich ein deterministisches Orakel verwenden, etwa einen Discord-REST-Reaktionsabruf
  oder eine Prüfung des Kanaltranskripts.
- Screenshots erfassen, wenn der Fehler eine sichtbare UI-Oberfläche hat.
- Lokal über eine agentengesteuerte CLI und remote über GitHub ausführen.
- Genügend Maschinenzustand für VNC-Rettung erhalten, wenn Anmeldung, Browser-Automatisierung oder
  Provider-Authentifizierung hängen bleibt.
- Prägnanten Status in einen Operator-Discord-Kanal posten, wenn der Lauf blockiert ist,
  manuelle VNC-Hilfe benötigt oder abgeschlossen ist.

## Nichtziele

- Mantis ist kein Ersatz für Unit-Tests. Aus einem Mantis-Lauf sollte in der Regel
  ein kleinerer Regressionstest werden, nachdem der Fix verstanden wurde.
- Mantis ist nicht das normale schnelle CI-Gate. Es ist langsamer, verwendet Live-Zugangsdaten und
  ist für Fehler reserviert, bei denen die Live-Umgebung relevant ist.
- Mantis sollte für den Normalbetrieb keinen Menschen erfordern. Manuelles VNC ist ein Rettungsweg,
  nicht der Normalfall.
- Mantis speichert keine Roh-Secrets in Artefakten, Logs, Screenshots, Markdown-Berichten
  oder PR-Kommentaren.

## Verantwortlichkeit

Mantis liegt im OpenClaw-QA-Stack.

- OpenClaw besitzt die Szenario-Laufzeitumgebung, Transport-Adapter, das Nachweisschema und
  die lokale CLI unter `pnpm openclaw qa mantis`.
- QA Lab besitzt die Live-Transport-Harness-Komponenten, Browser-Erfassungshelfer und
  Artefakt-Writer.
- Crabbox besitzt vorgewärmte Linux-Maschinen, wenn eine Remote-VM benötigt wird.
- GitHub Actions besitzt den Remote-Workflow-Einstiegspunkt und die Artefaktaufbewahrung.
- ClawSweeper besitzt das Routing von GitHub-Kommentaren: Parsen von Maintainer-Befehlen,
  Dispatchen des Workflows und Posten des finalen PR-Kommentars.
- OpenClaw-Agenten steuern Mantis über Codex, wenn ein Szenario agentische Einrichtung,
  Debugging oder Berichte über festhängende Zustände benötigt.

Diese Grenze hält Transportwissen in OpenClaw, Maschinenplanung in
Crabbox und Maintainer-Workflow-Verknüpfung in ClawSweeper.

## Befehlsform

Der erste lokale Befehl verifiziert den Discord-Bot, die Guild, den Kanal, den Nachrichtenversand,
den Reaktionsversand und den Artefaktpfad:

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

Das erste VM-/Browser-Primitiv ist der Desktop-Smoke-Test:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Er least oder verwendet eine Crabbox-Desktop-Maschine wieder, startet einen sichtbaren Browser innerhalb der
VNC-Sitzung, erfasst den Desktop, zieht Artefakte zurück in das lokale Ausgabe-
verzeichnis und schreibt den Wiederverbindungsbefehl in den Bericht. Der Befehl verwendet standardmäßig
den Hetzner-Provider, weil er der erste Provider mit funktionierender Desktop-/VNC-
Abdeckung im Mantis-Testpfad ist. Überschreiben Sie ihn mit `--provider`, `--crabbox-bin` oder
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, wenn Sie gegen eine andere Crabbox-Flotte ausführen.

Nützliche Desktop-Smoke-Flags:

- `--lease-id <cbx_...>` oder `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` verwendet einen vorgewärmten Desktop wieder.
- `--browser-url <url>` ändert die Seite, die im sichtbaren Browser geöffnet wird.
- `--html-file <path>` rendert ein repo-lokales HTML-Artefakt im sichtbaren Browser. Mantis verwendet dies, um die generierte Discord-Status-Reaktions-Timeline über einen echten Crabbox-Desktop zu erfassen.
- `--keep-lease` oder `OPENCLAW_MANTIS_KEEP_VM=1` hält eine neu erstellte erfolgreiche Lease für VNC-Inspektion offen. Fehlgeschlagene Läufe behalten die Lease standardmäßig, wenn eine erstellt wurde, damit ein Operator sich wieder verbinden kann.
- `--class`, `--idle-timeout` und `--ttl` passen Maschinengröße und Lease-Lebensdauer an.

Das erste vollständige Desktop-Transport-Primitiv ist der Slack-Desktop-Smoke-Test:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Er least oder verwendet eine Crabbox-Desktop-Maschine wieder, synchronisiert den aktuellen Checkout in
die VM, führt `pnpm openclaw qa slack` innerhalb dieser VM aus, öffnet Slack Web im VNC-
Browser, erfasst den sichtbaren Desktop und kopiert sowohl die Slack-QA-Artefakte als auch
den VNC-Screenshot zurück in das lokale Ausgabeverzeichnis. Dies ist die erste Mantis-
Form, bei der das SUT-OpenClaw-Gateway und der Browser beide in derselben
Linux-Desktop-VM leben.

Mit `--gateway-setup` bereitet der Befehl ein persistentes, wegwerfbares OpenClaw-
Home unter `$HOME/.openclaw-mantis/slack-openclaw` vor, patcht die Slack-Socket-Mode-
Konfiguration für den ausgewählten Kanal, startet `openclaw gateway run` auf Port
`38973` und lässt Chrome in der VNC-Sitzung laufen. Dies ist der Modus „geben Sie mir einen
Linux-Desktop mit Slack und einer laufenden Claw“; der Bot-zu-Bot-Slack-QA-Testpfad
bleibt der Standard, wenn `--gateway-setup` ausgelassen wird.

Erforderliche Eingaben für `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` für den Remote-Modell-Testpfad. Wenn lokal nur
  `OPENAI_API_KEY` gesetzt ist, ordnet Mantis ihn `OPENCLAW_LIVE_OPENAI_KEY` zu,
  bevor Crabbox aufgerufen wird, damit Crabboxs `OPENCLAW_*`-Env-Weiterleitung ihn
  in die VM tragen kann.

Nützliche Slack-Desktop-Flags:

- `--lease-id <cbx_...>` führt erneut gegen eine Maschine aus, auf der ein Operator sich bereits über VNC bei Slack Web angemeldet hat.
- `--gateway-setup` startet ein persistentes OpenClaw-Slack-Gateway in der VM, statt nur den Bot-zu-Bot-QA-Testpfad auszuführen.
- `--slack-url <url>` öffnet eine bestimmte Slack-Web-URL. Ohne dieses Flag leitet Mantis `https://app.slack.com/client/<team>/<channel>` aus Slack `auth.test` ab, wenn das SUT-Bot-Token verfügbar ist.
- `--slack-channel-id <id>` steuert die Slack-Kanal-Allowlist, die von der Gateway-Einrichtung verwendet wird.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` steuert das persistente Chrome-Profil innerhalb der VM. Der Standard ist `$HOME/.config/openclaw-mantis/slack-chrome-profile`, sodass eine manuelle Slack-Web-Anmeldung erneute Läufe auf derselben Lease übersteht.
- `--credential-source convex --credential-role ci` verwendet den gemeinsam genutzten Zugangsdaten-Pool statt direkter Slack-Env-Tokens.
- `--provider-mode`, `--model`, `--alt-model` und `--fast` werden an den Slack-Live-Testpfad durchgereicht.

Der GitHub-Smoke-Workflow ist `Mantis Discord Smoke`. Der Vorher- und Nachher-GitHub-
Workflow für das erste echte Szenario ist `Mantis Discord Status Reactions`. Er
akzeptiert:

- `baseline_ref`: die Ref, von der erwartet wird, dass sie das Nur-Warteschlange-Verhalten reproduziert.
- `candidate_ref`: die Ref, von der erwartet wird, dass sie `queued -> thinking -> done` zeigt.

Er checkt die Workflow-Harness-Ref aus, baut getrennte Baseline- und Kandidaten-
Worktrees, führt `discord-status-reactions-tool-only` gegen jeden Worktree aus und
lädt `baseline/`, `candidate/`, `comparison.json` und `mantis-report.md` als
Actions-Artefakte hoch. Außerdem rendert er das Timeline-HTML jeder Lane in einem Crabbox-
Desktop-Browser und veröffentlicht diese VNC-Screenshots neben den deterministischen
Timeline-PNGs im PR-Kommentar. Derselbe PR-Kommentar bettet schlanke,
bewegungsgekürzte GIF-Vorschauen ein, die von `crabbox media preview` generiert wurden, verlinkt auf die
passenden bewegungsgekürzten MP4-Clips und behält die vollständigen Desktop-MP4-Dateien für eine gründliche
Inspektion. Screenshots bleiben für eine schnelle Prüfung inline. Der Workflow baut die
Crabbox-CLI aus
`openclaw/crabbox` main, damit er die aktuellen Desktop-/Browser-Lease-Flags verwenden kann,
bevor das nächste Crabbox-Binary-Release erstellt wird.

`Mantis Scenario` ist der generische manuelle Einstiegspunkt. Er nimmt eine `scenario_id`,
`candidate_ref`, optionale `baseline_ref` und optionale `pr_number` entgegen und
dispatcht dann den szenarioeigenen Workflow. Der Wrapper ist absichtlich schlank:
Szenario-Workflows besitzen weiterhin ihre Transporteinrichtung, Zugangsdaten, VM-Klasse,
das erwartete Orakel und das Artefaktmanifest.

`Mantis Slack Desktop Smoke` ist der erste Slack-VM-Workflow. Er checkt die
vertrauenswürdige Kandidaten-Ref in einem separaten Worktree aus, least einen Crabbox-Linux-Desktop,
führt `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` gegen diesen
Kandidaten aus, öffnet Slack Web im VNC-Browser, zeichnet den Desktop auf, generiert eine
bewegungsgekürzte Vorschau mit `crabbox media preview`, lädt das vollständige Artefakt-
verzeichnis hoch und postet optional den Inline-Nachweiskommentar im Ziel-PR.
Verwenden Sie diesen Testpfad, wenn Sie „einen Linux-Desktop mit Slack und einer laufenden Claw“
statt nur eines Bot-zu-Bot-Slack-Transkripts möchten.

Jedes PR-veröffentlichende Szenario schreibt `mantis-evidence.json` neben seinen Bericht.
Dieses Schema ist die Übergabe zwischen Szenariocode und GitHub-Kommentaren:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Artefakt-`path`-Werte sind relativ zum Manifestverzeichnis. `targetPath`-
Werte sind relative Pfade unter dem Veröffentlichungsverzeichnis des `qa-artifacts`-Branch.
Der Publisher weist Pfadtraversal zurück und überspringt Einträge, die mit
`"required": false` markiert sind, wenn optionale Vorschauen oder Videos nicht verfügbar sind.

Unterstützte Artefaktarten:

- `timeline`: deterministischer Szenario-Screenshot, üblicherweise Vorher/Nachher.
- `desktopScreenshot`: VNC-/Browser-Desktop-Screenshot.
- `motionPreview`: inline animiertes GIF, das aus der Desktop-Aufzeichnung generiert wurde.
- `motionClip`: bewegungsgekürztes MP4, das statischen Vorlauf und Nachlauf entfernt.
- `fullVideo`: vollständige MP4-Aufzeichnung für gründliche Inspektion.
- `metadata`: JSON-/Log-Begleitdatei.
- `report`: Markdown-Bericht.

Der wiederverwendbare Publisher ist `scripts/mantis/publish-pr-evidence.mjs`. Workflows
rufen ihn mit dem Manifest, dem Ziel-PR, dem Zielstamm `qa-artifacts`, dem Kommentarmarker,
der Actions-Artefakt-URL, der Lauf-URL und der Anforderungsquelle auf. Er kopiert deklarierte Artefakte
in den `qa-artifacts`-Branch, erstellt einen zusammenfassungsorientierten PR-Kommentar mit Inline-
Bildern/Vorschauen und verlinkten Videos und aktualisiert dann den bestehenden Marker-Kommentar oder
erstellt einen neuen.

Sie können den Status-Reactions-Lauf auch direkt aus einem PR-Kommentar auslösen:

```text
@Mantis discord status reactions
```

Der Kommentar-Trigger ist absichtlich eng gefasst. Er läuft nur bei Pull-Request-
Kommentaren von Benutzern mit Schreib-, Maintain- oder Admin-Zugriff und erkennt nur
Discord-Status-Reaktions-Anforderungen. Standardmäßig verwendet er die bekannte fehlerhafte Baseline-Ref
und die aktuelle PR-Head-SHA als Kandidat. Maintainer können beide
Refs überschreiben:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper-Befehlsbeispiele:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Der erste Befehl ist explizit und szenariofokussiert. Der zweite kann später eine PR
oder ein Issue anhand von Labels, geänderten Dateien und
ClawSweeper-Review-Ergebnissen empfohlenen Mantis-Szenarien zuordnen.

## Ausführungslebenszyklus

1. Anmeldedaten abrufen.
2. Eine VM zuweisen oder wiederverwenden.
3. Das Desktop-/Browserprofil vorbereiten, wenn das Szenario UI-Nachweise benötigt.
4. Einen sauberen Checkout für den Baseline-Ref vorbereiten.
5. Abhängigkeiten installieren und nur das bauen, was das Szenario benötigt.
6. Einen untergeordneten OpenClaw Gateway mit einem isolierten Zustandsverzeichnis starten.
7. Live-Transport, Provider, Modell und Browserprofil konfigurieren.
8. Das Szenario ausführen und Baseline-Nachweise erfassen.
9. Den Gateway stoppen und Logs aufbewahren.
10. Den Candidate-Ref in derselben VM vorbereiten.
11. Dasselbe Szenario ausführen und Candidate-Nachweise erfassen.
12. Die Oracle-Ergebnisse und visuellen Nachweise vergleichen.
13. Markdown, JSON, Logs, Screenshots und optionale Trace-Artefakte schreiben.
14. GitHub-Actions-Artefakte hochladen.
15. Eine knappe PR- oder Discord-Statusmeldung posten.

Das Szenario sollte auf zwei verschiedene Arten fehlschlagen können:

- **Bug reproduziert**: Die Baseline ist auf die erwartete Weise fehlgeschlagen.
- **Harness-Fehler**: Umgebungseinrichtung, Anmeldedaten, Discord-API, Browser oder
  Provider sind fehlgeschlagen, bevor das Bug-Oracle aussagekräftig war.

Der Abschlussbericht muss diese Fälle trennen, damit Maintainer eine instabile
Umgebung nicht mit Produktverhalten verwechseln.

## Discord-MVP

Das erste Szenario sollte auf Discord-Statusreaktionen in Guild-Kanälen zielen, bei denen
der Quellantwort-Zustellmodus `message_tool_only` ist.

Warum es ein guter Mantis-Seed ist:

- Es ist in Discord als Reaktionen auf die auslösende Nachricht sichtbar.
- Es hat ein starkes REST-Oracle über den Reaktionsstatus von Discord-Nachrichten.
- Es testet einen echten OpenClaw Gateway, Discord-Bot-Authentifizierung, Nachrichtenversand,
  Quellantwort-Zustellmodus, Statusreaktionszustand und Modell-Turn-Lebenszyklus.
- Es ist eng genug gefasst, um die erste Implementierung belastbar zu halten.

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

Baseline-Nachweise sollten die eingereihte Bestätigungsreaktion zeigen, aber keine
Lebenszyklus-Transition im Tool-only-Modus. Candidate-Nachweise sollten zeigen, dass
Statusreaktionen ausgeführt werden, wenn `messages.statusReactions.enabled` explizit
`true` ist.

Der ausführbare erste Abschnitt ist das opt-in Discord-Live-QA-Szenario:

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
fragt die echte auslösende Discord-Nachricht ab und erwartet die beobachtete Sequenz
`👀 -> 🤔 -> 👍`. Artefakte enthalten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` und
`discord-status-reactions-tool-only-timeline.png`.

## Vorhandene QA-Bausteine

Mantis sollte auf dem vorhandenen privaten QA-Stack aufbauen, statt bei
null zu beginnen:

- `pnpm openclaw qa discord` führt bereits eine Live-Discord-Lane mit Treiber- und
  SUT-Bots aus.
- Der Live-Transport-Runner schreibt bereits Berichte und Artefakte zu beobachteten Nachrichten
  unter `.artifacts/qa-e2e/`.
- Convex-Anmeldedaten-Leases bieten bereits exklusiven Zugriff auf gemeinsam genutzte Live-
  Transport-Anmeldedaten.
- Der Browser-Control-Service unterstützt bereits Screenshots, Snapshots,
  verwaltete Headless-Profile und entfernte CDP-Profile.
- QA Lab hat bereits eine Debugger-UI und einen Bus für transportförmiges Testen.

Die erste Mantis-Implementierung kann ein dünner Vorher-/Nachher-Runner über diesen
Bausteinen sein, plus eine Schicht für visuelle Nachweise.

## Nachweismodell

Jede Ausführung schreibt ein stabiles Artefaktverzeichnis:

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
- Maschinen-Provider und Maschinen-ID oder Lease-ID
- Anmeldedatenquelle ohne Secret-Werte
- Baseline-Ergebnis
- Candidate-Ergebnis
- ob der Bug auf der Baseline reproduziert wurde
- ob der Candidate ihn behoben hat
- Artefaktpfade
- bereinigte Einrichtungs- oder Aufräumprobleme

Screenshots sind Nachweise, keine Secrets. Sie benötigen dennoch sorgfältige Redaktion:
Private Kanalnamen, Benutzernamen oder Nachrichteninhalte können erscheinen. Für öffentliche PRs
sollten Sie GitHub-Actions-Artefaktlinks gegenüber eingebetteten Bildern bevorzugen, bis die Redaktion
robuster ist.

## Browser und VNC

Die Browser-Lane hat zwei Modi:

- **Headless-Automatisierung**: Standard für CI. Chrome läuft mit aktiviertem CDP, und
  Playwright oder OpenClaw-Browser-Control erfasst Screenshots.
- **VNC-Rettung**: Auf derselben VM aktiviert, wenn Anmeldung, MFA, Discord-Anti-Automatisierung
  oder visuelles Debugging einen Menschen erfordert.

Das Discord-Beobachter-Browserprofil sollte persistent genug sein, um nicht
bei jeder Ausführung eine Anmeldung zu erfordern, aber von persönlichem Browserzustand isoliert sein. Ein Profil
gehört zum Mantis-Maschinenpool, nicht zu einem Entwickler-Laptop.

Wenn Mantis hängen bleibt, postet es eine Discord-Statusmeldung mit:

- Ausführungs-ID
- Szenario-ID
- Maschinen-Provider
- Artefaktverzeichnis
- VNC- oder noVNC-Verbindungsanweisungen, falls verfügbar
- kurzem Blocker-Text

Die erste private Bereitstellung kann diese Nachrichten an den vorhandenen Operator-
Kanal posten und später in einen dedizierten Mantis-Kanal umziehen.

## Maschinen

Mantis sollte für die erste Remote-Implementierung AWS über Crabbox bevorzugen.
Crabbox liefert uns vorgewärmte Maschinen, Lease-Tracking, Hydration, Logs, Ergebnisse und
Bereinigung. Wenn AWS-Kapazität zu langsam oder nicht verfügbar ist, fügen Sie einen Hetzner-Provider
hinter derselben Maschinenschnittstelle hinzu.

Mindestanforderungen an die VM:

- Linux mit einer desktopfähigen Chrome- oder Chromium-Installation
- CDP-Zugriff für Browserautomatisierung
- VNC oder noVNC für Rettung
- Node 22 und pnpm
- OpenClaw-Checkout und Abhängigkeitscache
- Playwright-Chromium-Browsercache, wenn Playwright verwendet wird
- genügend CPU und Arbeitsspeicher für einen OpenClaw Gateway, einen Browser und einen Modelllauf
- ausgehender Zugriff auf Discord, GitHub, Modell-Provider und den Anmeldedaten-Broker

Die VM sollte keine langlebigen Roh-Secrets außerhalb der erwarteten Anmeldedaten- oder
Browserprofil-Speicher behalten.

## Secrets

Secrets leben in GitHub-Organisations- oder Repository-Secrets für Remote-Ausführungen und in
einer lokalen, vom Operator kontrollierten Secret-Datei für lokale Ausführungen.

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

Langfristig sollte der Convex-Anmeldedatenpool die normale Quelle für Live-
Transport-Anmeldedaten bleiben. GitHub-Secrets bootstrappen den Broker und Fallback-Lanes.
Der Discord-Statusreaktions-Workflow ordnet die Mantis-Crabbox-Secrets wieder den
Umgebungsvariablen `CRABBOX_COORDINATOR` und `CRABBOX_COORDINATOR_TOKEN` zu,
die die Crabbox-CLI erwartet. Die einfachen GitHub-Secret-Namen `CRABBOX_*` bleiben
als Kompatibilitäts-Fallback akzeptiert.

Der Mantis-Runner darf niemals ausgeben:

- Discord-Bot-Tokens
- Provider-API-Schlüssel
- Browser-Cookies
- Inhalte von Auth-Profilen
- VNC-Passwörter
- Rohdaten von Anmeldedaten

Öffentliche Artefakt-Uploads sollten außerdem Discord-Zielmetadaten wie Bot-,
Guild-, Kanal- und Nachrichten-IDs redigieren. Der GitHub-Smoke-Workflow aktiviert
aus diesem Grund `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Wenn ein Token versehentlich in ein Issue, eine PR, einen Chat oder ein Log eingefügt wird, rotieren Sie ihn,
nachdem das neue Secret gespeichert wurde.

## GitHub-Artefakte und PR-Kommentare

Mantis-Workflows sollten das vollständige Nachweispaket als kurzlebiges Actions-
Artefakt hochladen. Wenn der Workflow für einen Bugbericht oder eine Fix-PR ausgeführt wird, sollte er außerdem
die redigierten PNG-Screenshots im Branch `qa-artifacts` veröffentlichen und einen
Kommentar zu diesem Bug oder dieser Fix-PR mit eingebetteten Vorher-/Nachher-Screenshots upserten. Posten Sie
den primären Nachweis nicht nur auf einer generischen QA-Automatisierungs-PR. Roh-Logs, beobachtete
Nachrichten und andere umfangreiche Nachweise bleiben im Actions-Artefakt.

Produktions-Workflows sollten diese Kommentare mit der Mantis-GitHub-App posten, nicht
mit `github-actions[bot]`. Speichern Sie die App-ID und den privaten Schlüssel als
GitHub-Actions-Secrets `MANTIS_GITHUB_APP_ID` und `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Der Workflow verwendet eine versteckte Markierung als Upsert-Schlüssel, aktualisiert diesen
Kommentar, wenn der Token ihn bearbeiten kann, und erstellt einen neuen Mantis-eigenen Kommentar, wenn
eine ältere bot-eigene Markierung nicht bearbeitet werden kann.

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

Wenn die Ausführung fehlschlägt, weil der Harness fehlgeschlagen ist, muss der Kommentar das so sagen,
statt anzudeuten, dass der Candidate fehlgeschlagen ist.

## Private Bereitstellungshinweise

Eine private Bereitstellung kann bereits eine Mantis-Discord-Anwendung haben. Verwenden Sie diese
Anwendung wieder, statt eine weitere App zu erstellen, wenn sie die richtigen Bot-
Berechtigungen hat und sicher rotiert werden kann.

Legen Sie den anfänglichen Operator-Benachrichtigungskanal über Secrets oder die Bereitstellungs-
Konfiguration fest. Er kann zunächst auf einen vorhandenen Maintainer- oder Betriebskanal
zeigen und später in einen dedizierten Mantis-Kanal umziehen, sobald einer existiert.

Tragen Sie keine Guild-IDs, Kanal-IDs, Bot-Tokens, Browser-Cookies oder VNC-Passwörter
in dieses Dokument ein. Speichern Sie sie in GitHub-Secrets, im Anmeldedaten-Broker oder im
lokalen Secret-Speicher des Operators.

## Ein Szenario hinzufügen

Ein Mantis-Szenario sollte deklarieren:

- ID und Titel
- Transport
- erforderliche Anmeldedaten
- Baseline-Ref-Richtlinie
- Candidate-Ref-Richtlinie
- OpenClaw-Konfigurationspatch
- Einrichtungsschritte
- Stimulus
- erwartetes Baseline-Oracle
- erwartetes Candidate-Oracle
- visuelle Erfassungsziele
- Zeitlimitbudget
- Aufräumschritte

Szenarien sollten kleine, typisierte Oracles bevorzugen:

- Discord-Reaktionsstatus für Reaktionsbugs
- Discord-Nachrichtenreferenzen für Threading-Bugs
- Slack-Thread-TS und Reaktions-API-Status für Slack-Bugs
- E-Mail-Nachrichten-IDs und Header für E-Mail-Bugs
- Browser-Screenshots, wenn die UI das einzige zuverlässige beobachtbare Signal ist

Vision-Prüfungen sollten additiv sein. Wenn eine Plattform-API den Bug nachweisen kann, verwenden Sie die
API als Bestehen-/Fehlschlagen-Oracle und behalten Sie Screenshots für menschliches Vertrauen.

## Provider-Erweiterung

Nach Discord kann derselbe Runner Folgendes hinzufügen:

- Slack: Reaktionen, Threads, App-Erwähnungen, modale Dialoge, Datei-Uploads.
- E-Mail: Gmail-Authentifizierung und Nachrichten-Threading mit `gog`, wenn Konnektoren nicht
  ausreichen.
- WhatsApp: QR-Anmeldung, erneute Identifizierung, Nachrichtenzustellung, Medien, Reaktionen.
- Telegram: Gating von Gruppenerwähnungen, Befehle, Reaktionen, wo verfügbar.
- Matrix: verschlüsselte Räume, Thread- oder Antwortbeziehungen, Fortsetzung nach Neustart.

Jeder Transport sollte ein kostengünstiges Smoke-Szenario und ein oder mehrere
Szenarien für Fehlerklassen haben. Aufwendige visuelle Szenarien sollten optional aktivierbar bleiben.

## Offene Fragen

- Welcher Discord-Bot sollte der Treiber sein und welcher das SUT, wenn der
  vorhandene Mantis-Bot wiederverwendet wird?
- Sollte die Anmeldung des Observer-Browsers in der ersten Phase ein menschliches Discord-Konto, ein Testkonto
  oder nur Bot-lesbare REST-Nachweise verwenden?
- Wie lange sollte GitHub Mantis-Artefakte für PRs aufbewahren?
- Wann sollte ClawSweeper Mantis automatisch empfehlen, anstatt auf einen
  Maintainer-Befehl zu warten?
- Sollten Screenshots vor dem Upload für öffentliche PRs geschwärzt oder zugeschnitten werden?
