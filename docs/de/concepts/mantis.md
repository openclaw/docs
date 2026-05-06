---
read_when:
    - Live-Visual-QA für OpenClaw-Fehler erstellen oder ausführen
    - Vorher- und Nachher-Verifizierung für einen Pull Request hinzufügen
    - Discord-, Slack-, WhatsApp- oder andere Live-Transport-Szenarien hinzufügen
    - Fehlerbehebung bei QA-Läufen, die Screenshots, Browserautomatisierung oder VNC-Zugriff benötigen
summary: Mantis ist das visuelle End-to-End-Verifizierungssystem, das OpenClaw-Fehler auf Live-Transporten reproduziert, Vorher- und Nachher-Nachweise erfasst und Artefakte an PRs anhängt.
title: Gottesanbeterin
x-i18n:
    generated_at: "2026-05-06T06:43:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis ist das End-to-End-Verifizierungssystem von OpenClaw für Bugs, die eine echte
Laufzeitumgebung, einen echten Transport und sichtbare Nachweise benötigen. Es führt ein Szenario gegen eine bekannte
fehlerhafte Ref aus, erfasst Nachweise, führt dasselbe Szenario gegen eine Kandidaten-Ref aus und
veröffentlicht den Vergleich als Artefakte, die Maintainer aus einem PR oder
über einen lokalen Befehl prüfen können.

Mantis beginnt mit Discord, weil Discord uns eine besonders wertvolle erste Lane bietet:
echte Bot-Authentifizierung, echte Guild-Kanäle, Reaktionen, Threads, native Befehle und eine
Browser-UI, in der Menschen visuell bestätigen können, was der Transport gezeigt hat.

## Ziele

- Einen Bug aus einem GitHub-Issue oder PR mit derselben Transportform reproduzieren, die Benutzer
  sehen.
- Ein **Vorher**-Artefakt auf der Baseline-Ref erfassen, bevor der Fix angewendet wird.
- Ein **Nachher**-Artefakt auf der Kandidaten-Ref erfassen, nachdem der Fix angewendet wurde.
- Wann immer möglich ein deterministisches Oracle verwenden, etwa einen Discord-REST-Reaktionslesevorgang
  oder eine Kanaltranskriptprüfung.
- Screenshots erfassen, wenn der Bug eine sichtbare UI-Oberfläche hat.
- Lokal über eine agentengesteuerte CLI und remote über GitHub ausführen.
- Genug Maschinenzustand für eine VNC-Rettung beibehalten, wenn Anmeldung, Browser-Automatisierung oder
  Provider-Authentifizierung hängen bleiben.
- Knappen Status in einem Betreiber-Discord-Kanal posten, wenn der Lauf blockiert ist,
  manuelle VNC-Hilfe benötigt oder abgeschlossen ist.

## Nichtziele

- Mantis ist kein Ersatz für Unit-Tests. Ein Mantis-Lauf sollte nach verstandenem Fix normalerweise
  zu einem kleineren Regressionstest werden.
- Mantis ist nicht das normale schnelle CI-Gate. Es ist langsamer, verwendet Live-Anmeldedaten und
  ist Bugs vorbehalten, bei denen die Live-Umgebung relevant ist.
- Mantis sollte für den Normalbetrieb keinen Menschen benötigen. Manuelles VNC ist ein Rettungspfad,
  nicht der Happy Path.
- Mantis speichert keine Roh-Secrets in Artefakten, Logs, Screenshots, Markdown-
  Berichten oder PR-Kommentaren.

## Zuständigkeit

Mantis befindet sich im OpenClaw-QA-Stack.

- OpenClaw besitzt die Szenario-Laufzeitumgebung, Transportadapter, das Nachweisschema und
  die lokale CLI unter `pnpm openclaw qa mantis`.
- QA Lab besitzt die Live-Transport-Harness-Teile, Browser-Erfassungshelfer und
  Artefakt-Writer.
- Crabbox besitzt vorgewärmte Linux-Maschinen, wenn eine Remote-VM benötigt wird.
- GitHub Actions besitzt den Remote-Workflow-Einstiegspunkt und die Artefaktaufbewahrung.
- ClawSweeper besitzt das GitHub-Kommentar-Routing: Maintainer-Befehle parsen,
  den Workflow auslösen und den finalen PR-Kommentar posten.
- OpenClaw-Agenten steuern Mantis über Codex, wenn ein Szenario agentisches Setup,
  Debugging oder Berichte zu hängenden Zuständen benötigt.

Diese Grenze hält Transportwissen in OpenClaw, Maschinenplanung in
Crabbox und Maintainer-Workflow-Klebstoff in ClawSweeper.

## Befehlsform

Der erste lokale Befehl verifiziert den Discord-Bot, die Guild, den Kanal, Nachrichtenversand,
Reaktionsversand und den Artefaktpfad:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Der lokale Vorher-/Nachher-Runner akzeptiert diese Form:

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

Der zweite Discord-Vorher-/Nachher-Probe zielt auf Thread-Anhänge:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Dieses Szenario postet eine übergeordnete Nachricht mit dem Treiber-Bot, erstellt einen echten Discord-
Thread, ruft OpenClaws Aktion `message.thread-reply` mit einem repo-lokalen
`filePath` auf und pollt dann den Thread auf die SUT-Antwort und den Anhangsdateinamen. Der
Baseline-Screenshot zeigt die Antwort ohne Anhang; der Kandidaten-Screenshot
zeigt den erwarteten Anhang `mantis-thread-report.md`.

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
- `--html-file <path>` rendert ein repo-lokales HTML-Artefakt im sichtbaren Browser. Mantis verwendet dies, um die generierte Discord-Statusreaktions-Zeitleiste über einen echten Crabbox-Desktop zu erfassen.
- `--browser-profile-dir <remote-path>` verwendet ein entferntes Chrome-user-data-dir erneut, damit ein persistenter Mantis-Desktop zwischen Läufen angemeldet bleiben kann. Verwenden Sie dies für das langlebige Discord Web-Betrachterprofil.
- `--browser-profile-archive-env <name>` stellt ein base64-`.tgz`-Chrome-user-data-dir-Archiv aus der benannten Umgebungsvariable wieder her, bevor der Browser gestartet wird. Verwenden Sie dies für angemeldete Zeugen wie Discord Web. Die Standard-Umgebungsvariable ist `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` steuert die Länge der MP4-Erfassung. Verwenden Sie eine längere Dauer für langsame angemeldete Web-Apps, die Zeit zum Stabilisieren benötigen.
- `--keep-lease` oder `OPENCLAW_MANTIS_KEEP_VM=1` hält eine neu erstellte erfolgreiche Lease für die VNC-Inspektion offen. Fehlgeschlagene Läufe behalten die Lease standardmäßig bei, wenn eine erstellt wurde, damit ein Betreiber sich erneut verbinden kann.
- `--class`, `--idle-timeout` und `--ttl` stimmen Maschinengröße und Lease-Lebensdauer ab.

Für Discord Web-Nachweise verwendet Mantis ein dediziertes Betrachterkonto anstelle eines
Bot-Tokens. Das Live-Discord-API-Szenario bleibt das Oracle: Es erstellt den echten
Thread, sendet das SUT-`thread-reply` und prüft den Anhang über Discord
REST. Wenn `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` gesetzt ist, schreibt das Szenario außerdem
ein Discord Web-URL-Artefakt. Wenn `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` gesetzt ist,
lässt es diesen Thread lange genug verfügbar, damit ein angemeldeter Browser ihn öffnen
und aufzeichnen kann.

Der GitHub-Workflow öffnet die Kandidaten-Thread-URL in Discord Web, erfasst einen
Screenshot, zeichnet eine MP4 auf und generiert eine zugeschnittene GIF-Vorschau, wenn Crabbox-
Medienwerkzeuge verfügbar sind. Bevorzugen Sie einen persistenten Betrachterprofilpfad, der
über `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` konfiguriert ist, weil vollständige Chrome-Profilarchive
GitHubs Secret-Größenlimit überschreiten können. Für kleine/Bootstrap-Profile
kann der Workflow auch ein base64-`.tgz`-Archiv aus
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` wiederherstellen. Wenn keine der beiden Profilquellen
konfiguriert ist, veröffentlicht der Workflow trotzdem die deterministischen Baseline-/Kandidaten-
Anhang-Screenshots und protokolliert einen Hinweis, dass der angemeldete Discord Web-Zeuge
übersprungen wurde.

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

Mit `--gateway-setup` bereitet der Befehl ein persistentes wegwerfbares OpenClaw-
Home unter `$HOME/.openclaw-mantis/slack-openclaw` vor, patcht die Slack-Socket-Mode-
Konfiguration für den ausgewählten Kanal, startet `openclaw gateway run` auf Port
`38973` und lässt Chrome in der VNC-Sitzung laufen. Dies ist der Modus „lassen Sie mir einen
Linux-Desktop mit Slack und einer laufenden Claw“; die Bot-zu-Bot-Slack-QA-Lane
bleibt der Standard, wenn `--gateway-setup` weggelassen wird.

Erforderliche Eingaben für `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` für die Remote-Modell-Lane. Wenn lokal nur
  `OPENAI_API_KEY` gesetzt ist, bildet Mantis ihn auf `OPENCLAW_LIVE_OPENAI_KEY`
  ab, bevor Crabbox aufgerufen wird, damit Crabboxs `OPENCLAW_*`-Env-Weiterleitung ihn
  in die VM übertragen kann.

Mit `--gateway-setup --credential-source convex` least Mantis die Slack-SUT-
Anmeldedaten aus dem gemeinsamen Pool, bevor die VM erstellt wird, und leitet die geleaste
Kanal-ID, das Socket-Mode-App-Token und das Bot-Token als `OPENCLAW_MANTIS_SLACK_*`-
Laufzeitumgebung innerhalb des Desktops weiter. Das hält GitHub-Workflows schlank: Sie benötigen nur
das Convex-Broker-Secret, keine rohen Slack-Bot- oder App-Token.

Nützliche Slack-Desktop-Flags:

- `--lease-id <cbx_...>` führt erneut gegen eine Maschine aus, auf der ein Betreiber bereits über VNC bei Slack Web angemeldet ist.
- `--gateway-setup` startet ein persistentes OpenClaw-Slack-Gateway in der VM, statt nur die Bot-zu-Bot-QA-Lane auszuführen.
- `--keep-lease` hält die Gateway-VM nach Erfolg für die VNC-Inspektion offen; `--no-keep-lease` stoppt sie nach dem Sammeln der Artefakte.
- `--slack-url <url>` öffnet eine bestimmte Slack Web-URL. Ohne dieses Flag leitet Mantis `https://app.slack.com/client/<team>/<channel>` aus Slack `auth.test` ab, wenn das SUT-Bot-Token verfügbar ist.
- `--slack-channel-id <id>` steuert die Slack-Kanal-Allowlist, die vom Gateway-Setup verwendet wird.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` steuert das persistente Chrome-Profil innerhalb der VM. Der Standard ist `$HOME/.config/openclaw-mantis/slack-chrome-profile`, sodass eine manuelle Slack Web-Anmeldung erneute Läufe auf derselben Lease überlebt.
- `--credential-source convex --credential-role ci` verwendet den gemeinsamen Anmeldedatenpool statt direkter Slack-Env-Token.
- `--provider-mode`, `--model`, `--alt-model` und `--fast` werden an die Slack-Live-Lane durchgereicht.

Der GitHub-Smoke-Workflow ist `Mantis Discord Smoke`. Der Vorher- und Nachher-GitHub-
Workflow für das erste echte Szenario ist `Mantis Discord Status Reactions`. Er
akzeptiert:

- `baseline_ref`: die Ref, von der erwartet wird, dass sie nur-warteschlangenbasiertes Verhalten reproduziert.
- `candidate_ref`: die Ref, von der erwartet wird, dass sie `queued -> thinking -> done` zeigt.

Er checkt die Workflow-Harness-Ref aus, baut separate Baseline- und Kandidaten-
Worktrees, führt `discord-status-reactions-tool-only` gegen jeden Worktree aus und
lädt `baseline/`, `candidate/`, `comparison.json` und `mantis-report.md` als
Actions-Artefakte hoch. Außerdem rendert er die Zeitleisten-HTML jeder Lane in einem Crabbox-
Desktop-Browser und veröffentlicht diese VNC-Screenshots neben den deterministischen
Zeitleisten-PNGs im PR-Kommentar. Derselbe PR-Kommentar bettet leichte
bewegungszugeschnittene GIF-Vorschauen ein, die von `crabbox media preview` generiert wurden, verlinkt auf die
passenden bewegungszugeschnittenen MP4-Clips und behält die vollständigen Desktop-MP4-Dateien für eine tiefere
Inspektion. Screenshots bleiben inline für eine schnelle Prüfung. Der Workflow baut die
Crabbox-CLI aus
`openclaw/crabbox` main, damit er die aktuellen Desktop-/Browser-Lease-Flags verwenden kann,
bevor das nächste Crabbox-Binary-Release erstellt wird.

`Mantis Scenario` ist der generische manuelle Einstiegspunkt. Es nimmt eine `scenario_id`,
`candidate_ref`, optionale `baseline_ref` und optionale `pr_number` entgegen und
löst dann den szenarioeigenen Workflow aus. Der Wrapper ist absichtlich dünn:
Szenario-Workflows besitzen weiterhin ihr Transport-Setup, ihre Anmeldedaten, VM-Klasse,
das erwartete Oracle und das Artefaktmanifest.

`Mantis Slack Desktop Smoke` ist der erste Slack-VM-Workflow. Er checkt die
vertrauenswürdige Kandidaten-Ref in einem separaten Worktree aus, least einen
Crabbox-Linux-Desktop, führt `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` gegen diesen
Kandidaten aus, öffnet Slack Web im VNC-Browser, zeichnet den Desktop auf, erzeugt mit
`crabbox media preview` eine bewegungsgekürzte Vorschau, lädt das vollständige
Artefaktverzeichnis hoch und veröffentlicht optional den Inline-Nachweiskommentar im Ziel-PR.
Standardmäßig verwendet er AWS für die Desktop-Lease und stellt eine manuelle Provider-Eingabe bereit, damit
Operatoren zu Hetzner wechseln können, wenn AWS-Kapazität langsam oder nicht verfügbar ist. Verwenden
Sie diese Lane, wenn Sie „einen Linux-Desktop mit Slack und einer laufenden Claw“ möchten, statt
nur ein Bot-zu-Bot-Slack-Transkript.

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

Artefakt-`path`-Werte sind relativ zum Manifestverzeichnis. `targetPath`-Werte
sind relative Pfade unter dem Veröffentlichungsverzeichnis des `qa-artifacts`-Branch.
Der Publisher weist Path-Traversal zurück und überspringt Einträge, die mit
`"required": false` markiert sind, wenn optionale Vorschauen oder Videos nicht verfügbar sind.

Unterstützte Artefaktarten:

- `timeline`: deterministischer Szenario-Screenshot, üblicherweise Vorher/Nachher.
- `desktopScreenshot`: VNC-/Browser-Desktop-Screenshot.
- `motionPreview`: inline animiertes GIF, das aus der Desktop-Aufzeichnung erzeugt wird.
- `motionClip`: bewegungsgekürztes MP4, das statischen Vorlauf und Nachlauf entfernt.
- `fullVideo`: vollständige MP4-Aufzeichnung für detaillierte Prüfung.
- `metadata`: JSON-/Log-Sidecar.
- `report`: Markdown-Bericht.

Der wiederverwendbare Publisher ist `scripts/mantis/publish-pr-evidence.mjs`. Workflows
rufen ihn mit dem Manifest, dem Ziel-PR, dem `qa-artifacts`-Zielstamm, Kommentarmarker,
Actions-Artefakt-URL, Run-URL und Anfragequelle auf. Er kopiert die deklarierten Artefakte
in den `qa-artifacts`-Branch, erstellt einen zusammenfassungsorientierten PR-Kommentar mit Inline-
Bildern/Vorschauen und verlinkten Videos und aktualisiert dann den vorhandenen Markerkommentar oder
erstellt einen neuen.

Sie können den Status-Reactions-Lauf auch direkt aus einem PR-Kommentar auslösen:

```text
@Mantis discord status reactions
```

Der Kommentarauslöser ist absichtlich eng gefasst. Er läuft nur bei Pull-Request-
Kommentaren von Benutzern mit Schreib-, Maintain- oder Admin-Zugriff und erkennt
nur Discord-Status-Reaction-Anfragen. Standardmäßig verwendet er die bekannte fehlerhafte Baseline-Ref
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
oder ein Issue anhand von Labels, geänderten Dateien und ClawSweeper-Review-Ergebnissen
empfohlenen Mantis-Szenarien zuordnen.

## Lauflebenszyklus

1. Anmeldedaten abrufen.
2. Eine VM zuweisen oder wiederverwenden.
3. Das Desktop-/Browserprofil vorbereiten, wenn das Szenario UI-Nachweise benötigt.
4. Einen sauberen Checkout für die Baseline-Ref vorbereiten.
5. Abhängigkeiten installieren und nur bauen, was das Szenario benötigt.
6. Eine untergeordnete OpenClaw-Gateway mit isoliertem Statusverzeichnis starten.
7. Live-Transport, Provider, Modell und Browserprofil konfigurieren.
8. Das Szenario ausführen und Baseline-Nachweise erfassen.
9. Die Gateway stoppen und Logs aufbewahren.
10. Die Kandidaten-Ref in derselben VM vorbereiten.
11. Dasselbe Szenario ausführen und Kandidatennachweise erfassen.
12. Die Oracle-Ergebnisse und visuellen Nachweise vergleichen.
13. Markdown, JSON, Logs, Screenshots und optionale Trace-Artefakte schreiben.
14. GitHub-Actions-Artefakte hochladen.
15. Eine knappe PR- oder Discord-Statusnachricht veröffentlichen.

Das Szenario sollte auf zwei verschiedene Arten fehlschlagen können:

- **Fehler reproduziert**: Die Baseline ist auf die erwartete Weise fehlgeschlagen.
- **Harness-Fehler**: Umgebungssetup, Anmeldedaten, Discord-API, Browser oder
  Provider sind fehlgeschlagen, bevor das Fehler-Oracle aussagekräftig war.

Der Abschlussbericht muss diese Fälle trennen, damit Maintainer eine instabile
Umgebung nicht mit Produktverhalten verwechseln.

## Discord-MVP

Das erste Szenario sollte Discord-Status-Reactions in Guild-Kanälen anvisieren, bei denen
der Zustellmodus der Quellantwort `message_tool_only` ist.

Warum es ein guter Mantis-Startpunkt ist:

- Es ist in Discord als Reactions auf der auslösenden Nachricht sichtbar.
- Es hat ein starkes REST-Oracle über den Discord-Message-Reaction-Status.
- Es übt eine echte OpenClaw-Gateway, Discord-Bot-Authentifizierung, Nachrichtenversand,
  den Zustellmodus der Quellantwort, Status-Reaction-Zustand und Modell-Turn-Lebenszyklus aus.
- Es ist eng genug, um die erste Implementierung präzise zu halten.

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

Baseline-Nachweise sollten die Queued-Acknowledgement-Reaction zeigen, aber keine
Lebenszyklus-Transition im Tool-only-Modus. Kandidatennachweise sollten zeigen, dass Lebenszyklus-
Status-Reactions laufen, wenn `messages.statusReactions.enabled` explizit
true ist.

Der ausführbare erste Teil ist das Opt-in-Discord-Live-QA-Szenario:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Es konfiguriert das SUT mit stets aktivierter Guild-Verarbeitung, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` und expliziten Status-Reactions. Das Oracle
pollt die echte auslösende Discord-Nachricht und erwartet die beobachtete Sequenz
`👀 -> 🤔 -> 👍`. Artefakte enthalten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` und
`discord-status-reactions-tool-only-timeline.png`.

## Vorhandene QA-Bausteine

Mantis sollte auf dem vorhandenen privaten QA-Stack aufbauen, statt bei
null zu beginnen:

- `pnpm openclaw qa discord` führt bereits eine Live-Discord-Lane mit Driver- und
  SUT-Bots aus.
- Der Live-Transport-Runner schreibt bereits Berichte und Observed-Message-
  Artefakte unter `.artifacts/qa-e2e/`.
- Convex-Credential-Leases stellen bereits exklusiven Zugriff auf gemeinsam genutzte Live-
  Transport-Anmeldedaten bereit.
- Der Browser-Control-Service unterstützt bereits Screenshots, Snapshots,
  headless verwaltete Profile und Remote-CDP-Profile.
- QA Lab hat bereits eine Debugger-UI und einen Bus für transportförmiges Testing.

Die erste Mantis-Implementierung kann ein dünner Vorher/Nachher-Runner über diesen
Bausteinen sein, ergänzt um eine visuelle Nachweisschicht.

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
Markdown-Bericht ist für PR-Kommentare und menschliche Review vorgesehen.

Die Zusammenfassung muss enthalten:

- getestete Refs und SHAs
- Transport und Szenario-ID
- Maschinen-Provider und Maschinen-ID oder Lease-ID
- Anmeldedatenquelle ohne geheime Werte
- Baseline-Ergebnis
- Kandidatenergebnis
- ob der Fehler auf der Baseline reproduziert wurde
- ob der Kandidat ihn behoben hat
- Artefaktpfade
- bereinigte Setup- oder Cleanup-Probleme

Screenshots sind Nachweise, keine Secrets. Sie benötigen trotzdem Redaktionsdisziplin:
private Kanalnamen, Benutzernamen oder Nachrichteninhalte können erscheinen. Für öffentliche PRs
sollten Sie GitHub-Actions-Artefaktlinks gegenüber Inline-Bildern bevorzugen, bis die Redaktionsstrategie
stärker ist.

## Browser und VNC

Die Browser-Lane hat zwei Modi:

- **Headless-Automatisierung**: Standard für CI. Chrome läuft mit aktiviertem CDP, und
  Playwright oder OpenClaw-Browsersteuerung erfasst Screenshots.
- **VNC-Rettung**: auf derselben VM aktiviert, wenn Anmeldung, MFA, Discord-Anti-Automation
  oder visuelles Debugging einen Menschen erfordern.

Das Discord-Observer-Browserprofil sollte persistent genug sein, um
nicht bei jedem Lauf eine Anmeldung zu erfordern, aber von persönlichem Browserzustand isoliert sein. Ein Profil
gehört zum Mantis-Maschinenpool, nicht zu einem Entwickler-Laptop.

Wenn Mantis hängen bleibt, veröffentlicht es eine Discord-Statusnachricht mit:

- Lauf-ID
- Szenario-ID
- Maschinen-Provider
- Artefaktverzeichnis
- VNC- oder noVNC-Verbindungsanweisungen, falls verfügbar
- kurzem Blockertext

Die erste private Bereitstellung kann diese Nachrichten im vorhandenen Operator-
Kanal veröffentlichen und später in einen dedizierten Mantis-Kanal wechseln.

## Maschinen

Mantis sollte für die erste Remote-Implementierung AWS über Crabbox bevorzugen.
Crabbox gibt uns vorgewärmte Maschinen, Lease-Tracking, Hydration, Logs, Ergebnisse und
Cleanup. Wenn AWS-Kapazität zu langsam oder nicht verfügbar ist, fügen Sie einen Hetzner-Provider
hinter derselben Maschinenschnittstelle hinzu.

Mindestanforderungen an die VM:

- Linux mit desktopfähiger Chrome- oder Chromium-Installation
- CDP-Zugriff für Browserautomatisierung
- VNC oder noVNC für Rettung
- Node 22 und pnpm
- OpenClaw-Checkout und Abhängigkeitscache
- Playwright-Chromium-Browsercache, wenn Playwright verwendet wird
- ausreichend CPU und Arbeitsspeicher für eine OpenClaw-Gateway, einen Browser und einen Modelllauf
- ausgehender Zugriff auf Discord, GitHub, Modell-Provider und den Credential-Broker

Die VM sollte keine langlebigen Roh-Secrets außerhalb der erwarteten Credential- oder
Browserprofil-Speicher behalten.

## Secrets

Secrets liegen für Remote-Läufe in GitHub-Organisations- oder Repository-Secrets und in
einer lokalen, operatorgesteuerten Secret-Datei für lokale Läufe.

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

Langfristig sollte der Convex-Credential-Pool die normale Quelle für Live-
Transport-Anmeldedaten bleiben. GitHub-Secrets bootstrappen den Broker und Fallback-Lanes.
Der Discord-Status-Reactions-Workflow bildet die Mantis-Crabbox-Secrets zurück auf
die Umgebungsvariablen `CRABBOX_COORDINATOR` und `CRABBOX_COORDINATOR_TOKEN`,
die die Crabbox-CLI erwartet. Die einfachen `CRABBOX_*`-GitHub-Secret-Namen bleiben
als Kompatibilitäts-Fallback akzeptiert.

Der Mantis-Runner darf niemals ausgeben:

- Discord-Bot-Tokens
- Provider-API-Schlüssel
- Browser-Cookies
- Inhalte von Auth-Profilen
- VNC-Passwörter
- rohe Credential-Payloads

Öffentliche Artefakt-Uploads sollten außerdem Discord-Zielmetadaten wie Bot-,
Guild-, Kanal- und Nachrichten-IDs redigieren. Der GitHub-Smoke-Workflow aktiviert
aus diesem Grund `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Wenn ein Token versehentlich in ein Issue, einen PR, einen Chat oder ein Log eingefügt wird, rotieren Sie es,
nachdem das neue Secret gespeichert wurde.

## GitHub-Artefakte und PR-Kommentare

Mantis-Workflows sollten das vollständige Evidenzpaket als kurzlebiges Actions-Artefakt hochladen. Wenn der Workflow für einen Fehlerbericht oder eine Korrektur-PR ausgeführt wird, sollte er außerdem die redigierten PNG-Screenshots im Branch `qa-artifacts` veröffentlichen und einen Kommentar zu diesem Fehler oder dieser Korrektur-PR mit Inline-Vorher-/Nachher-Screenshots upserten. Veröffentlichen Sie den primären Nachweis nicht nur in einer generischen QA-Automatisierungs-PR. Rohprotokolle, beobachtete Nachrichten und andere umfangreiche Evidenz bleiben im Actions-Artefakt.

Produktions-Workflows sollten diese Kommentare mit der Mantis GitHub App posten, nicht mit `github-actions[bot]`. Speichern Sie die App-ID und den privaten Schlüssel als GitHub-Actions-Secrets `MANTIS_GITHUB_APP_ID` und `MANTIS_GITHUB_APP_PRIVATE_KEY`. Der Workflow verwendet eine versteckte Markierung als Upsert-Schlüssel, aktualisiert diesen Kommentar, wenn das Token ihn bearbeiten kann, und erstellt einen neuen Mantis-eigenen Kommentar, wenn eine ältere Bot-eigene Markierung nicht bearbeitet werden kann.

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

Wenn der Lauf fehlschlägt, weil das Harness fehlgeschlagen ist, muss der Kommentar das sagen, statt nahezulegen, dass der Kandidat fehlgeschlagen ist.

## Hinweise zur privaten Bereitstellung

Eine private Bereitstellung kann bereits eine Mantis Discord-Anwendung haben. Verwenden Sie diese Anwendung wieder, statt eine weitere App zu erstellen, wenn sie die richtigen Bot-Berechtigungen hat und sicher rotiert werden kann.

Legen Sie den anfänglichen Operator-Benachrichtigungskanal über Secrets oder die Bereitstellungskonfiguration fest. Er kann zunächst auf einen bestehenden Maintainer- oder Betriebskanal verweisen und später in einen dedizierten Mantis-Kanal verschoben werden, sobald einer existiert.

Nehmen Sie keine Guild-IDs, Kanal-IDs, Bot-Token, Browser-Cookies oder VNC-Passwörter in dieses Dokument auf. Speichern Sie sie in GitHub-Secrets, im Credential Broker oder im lokalen Secret Store des Operators.

## Ein Szenario hinzufügen

Ein Mantis-Szenario sollte Folgendes deklarieren:

- id und Titel
- Transport
- erforderliche Anmeldedaten
- Baseline-Ref-Richtlinie
- Kandidaten-Ref-Richtlinie
- OpenClaw-Konfigurationspatch
- Einrichtungsschritte
- Stimulus
- erwartetes Baseline-Orakel
- erwartetes Kandidatenorakel
- Ziele für visuelle Erfassung
- Timeout-Budget
- Bereinigungsschritte

Szenarien sollten kleine, typisierte Orakel bevorzugen:

- Discord-Reaktionsstatus für Reaktionsfehler
- Discord-Nachrichtenreferenzen für Threading-Fehler
- Slack-Thread-TS und Reaktions-API-Status für Slack-Fehler
- E-Mail-Nachrichten-IDs und Header für E-Mail-Fehler
- Browser-Screenshots, wenn die UI der einzige zuverlässige beobachtbare Zustand ist

Vision-Prüfungen sollten additiv sein. Wenn eine Plattform-API den Fehler nachweisen kann, verwenden Sie die API als Bestehen-/Fehlschlagen-Orakel und behalten Sie Screenshots für menschliches Vertrauen bei.

## Provider-Erweiterung

Nach Discord kann derselbe Runner Folgendes hinzufügen:

- Slack: Reaktionen, Threads, App-Erwähnungen, Modals, Datei-Uploads.
- E-Mail: Gmail-Authentifizierung und Nachrichten-Threading mit `gog`, wenn Connectors nicht ausreichen.
- WhatsApp: QR-Anmeldung, erneute Identifizierung, Nachrichtenzustellung, Medien, Reaktionen.
- Telegram: Gruppen-Erwähnungs-Gating, Befehle, Reaktionen, sofern verfügbar.
- Matrix: verschlüsselte Räume, Thread- oder Antwortbeziehungen, Wiederaufnahme nach Neustart.

Jeder Transport sollte ein günstiges Smoke-Szenario und ein oder mehrere Fehlerklassen-Szenarien haben. Aufwendige visuelle Szenarien sollten Opt-in bleiben.

## Offene Fragen

- Welcher Discord-Bot sollte der Treiber sein und welcher das SUT, wenn der bestehende Mantis-Bot wiederverwendet wird?
- Sollte die Anmeldung des Beobachter-Browsers in der ersten Phase ein menschliches Discord-Konto, ein Testkonto oder nur Bot-lesbare REST-Evidenz verwenden?
- Wie lange sollte GitHub Mantis-Artefakte für PRs aufbewahren?
- Wann sollte ClawSweeper automatisch Mantis empfehlen, statt auf einen Maintainer-Befehl zu warten?
- Sollten Screenshots vor dem Hochladen für öffentliche PRs redigiert oder zugeschnitten werden?
