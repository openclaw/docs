---
read_when:
    - Live-visuelle QA für OpenClaw-Fehler erstellen oder ausführen
    - Vorher- und Nachher-Verifizierung für einen Pull Request hinzufügen
    - Hinzufügen von Discord-, Slack-, WhatsApp- oder anderen Live-Transport-Szenarien
    - Debugging von QA-Läufen, die Screenshots, Browser-Automatisierung oder VNC-Zugriff benötigen
summary: Mantis ist das visuelle End-to-End-Verifikationssystem zum Reproduzieren von OpenClaw-Fehlern auf Live-Transporten, zum Erfassen von Vorher-/Nachher-Nachweisen und zum Anhängen von Artefakten an PRs.
title: Mantis
x-i18n:
    generated_at: "2026-06-27T17:23:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis ist das End-to-End-Verifizierungssystem von OpenClaw für Bugs, die eine echte
Runtime, einen echten Transport und sichtbaren Nachweis benötigen. Es führt ein Szenario gegen einen bekannten
fehlerhaften Ref aus, erfasst Nachweise, führt dasselbe Szenario gegen einen Kandidaten-Ref aus und
veröffentlicht den Vergleich als Artefakte, die ein Maintainer aus einem PR oder
über einen lokalen Befehl prüfen kann.

Mantis beginnt mit Discord, weil Discord uns eine besonders wertvolle erste Lane bietet:
echte Bot-Authentifizierung, echte Guild-Kanäle, Reaktionen, Threads, native Befehle und eine
Browser-UI, in der Menschen visuell bestätigen können, was der Transport angezeigt hat.

## Ziele

- Einen Bug aus einem GitHub-Issue oder PR mit derselben Transportform reproduzieren, die Benutzer
  sehen.
- Ein **Vorher**-Artefakt auf dem Baseline-Ref erfassen, bevor der Fix angewendet wird.
- Ein **Nachher**-Artefakt auf dem Kandidaten-Ref erfassen, nachdem der Fix angewendet wurde.
- Wenn möglich ein deterministisches Oracle verwenden, etwa einen Discord-REST-Reaktions-
  Read oder eine Prüfung des Kanaltranskripts.
- Screenshots erfassen, wenn der Bug eine sichtbare UI-Oberfläche hat.
- Lokal über eine agentengesteuerte CLI und remote über GitHub ausführen.
- Genug Maschinenzustand für VNC-Rettung bewahren, wenn Login, Browser-Automatisierung oder
  Provider-Authentifizierung hängen bleiben.
- Prägnanten Status in einen Operator-Discord-Kanal posten, wenn der Lauf blockiert ist,
  manuelle VNC-Hilfe benötigt oder abgeschlossen ist.

## Nicht-Ziele

- Mantis ist kein Ersatz für Unit-Tests. Aus einem Mantis-Lauf sollte normalerweise
  ein kleinerer Regressionstest werden, nachdem der Fix verstanden wurde.
- Mantis ist nicht das normale schnelle CI-Gate. Es ist langsamer, verwendet Live-Zugangsdaten und
  ist für Bugs reserviert, bei denen die Live-Umgebung relevant ist.
- Mantis sollte für den normalen Betrieb keinen Menschen erfordern. Manuelles VNC ist ein Rettungs-
  pfad, nicht der Standardpfad.
- Mantis speichert keine Roh-Secrets in Artefakten, Logs, Screenshots, Markdown-
  Berichten oder PR-Kommentaren.

## Ownership

Mantis lebt im OpenClaw-QA-Stack.

- OpenClaw besitzt die Szenario-Runtime, Transportadapter, das Nachweisschema und
  die lokale CLI unter `pnpm openclaw qa mantis`.
- QA Lab besitzt die Live-Transport-Harness-Teile, Browser-Erfassungshelfer und
  Artefakt-Writer.
- Crabbox besitzt vorgewärmte Linux-Maschinen, wenn eine Remote-VM benötigt wird.
- GitHub Actions besitzt den Remote-Workflow-Einstiegspunkt und die Artefaktaufbewahrung.
- ClawSweeper besitzt das GitHub-Kommentarrouting: Maintainer-Befehle parsen,
  den Workflow auslösen und den finalen PR-Kommentar posten.
- OpenClaw-Agenten steuern Mantis über Codex, wenn ein Szenario agentisches Setup,
  Debugging oder Berichte über festhängende Zustände benötigt.

Diese Grenze hält Transportwissen in OpenClaw, Maschinenplanung in
Crabbox und Maintainer-Workflow-Verklebung in ClawSweeper.

## Befehlsform

Der erste lokale Befehl verifiziert Discord-Bot, Guild, Kanal, Nachrichtensendung,
Reaktionssendung und Artefaktpfad:

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

Der Runner erstellt detached Baseline- und Kandidaten-Worktrees unter dem Ausgabe-
verzeichnis, installiert Abhängigkeiten, baut jeden Ref, führt das Szenario mit
`--allow-failures` aus und schreibt dann `baseline/`, `candidate/`, `comparison.json`
und `mantis-report.md`. Für das erste Discord-Szenario bedeutet eine erfolgreiche Verifizierung,
dass der Baseline-Status `fail` und der Kandidaten-Status `pass` ist.

Der zweite Discord-Vorher/Nachher-Probe zielt auf Thread-Anhänge:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Dieses Szenario postet eine übergeordnete Nachricht mit dem Driver-Bot, erstellt einen echten Discord-
Thread, ruft die OpenClaw-Aktion `message.thread-reply` mit einem repo-lokalen
`filePath` auf und pollt dann den Thread nach der SUT-Antwort und dem Anhangsdateinamen. Der
Baseline-Screenshot zeigt die Antwort ohne Anhang; der Kandidaten-Screenshot
zeigt den erwarteten Anhang `mantis-thread-report.md`.

Das erste VM/Browser-Primitiv ist der Desktop-Smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Er least oder verwendet eine Crabbox-Desktop-Maschine erneut, startet einen sichtbaren Browser innerhalb der
VNC-Sitzung, erfasst den Desktop, zieht Artefakte zurück in das lokale Ausgabe-
verzeichnis und schreibt den Reconnect-Befehl in den Bericht. Der Befehl verwendet standardmäßig
den Hetzner-Provider, weil er der erste Provider mit funktionierender Desktop/VNC-
Abdeckung in der Mantis-Lane ist. Überschreiben Sie ihn mit `--provider`, `--crabbox-bin` oder
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, wenn Sie gegen eine andere Crabbox-Flotte laufen.

Nützliche Desktop-Smoke-Flags:

- `--lease-id <cbx_...>` oder `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` verwendet einen vorgewärmten Desktop erneut.
- `--browser-url <url>` ändert die Seite, die im sichtbaren Browser geöffnet wird.
- `--html-file <path>` rendert ein repo-lokales HTML-Artefakt im sichtbaren Browser. Mantis verwendet dies, um die generierte Discord-Statusreaktions-Timeline über einen echten Crabbox-Desktop zu erfassen.
- `--browser-profile-dir <remote-path>` verwendet ein entferntes Chrome-User-Data-Dir erneut, sodass ein persistenter Mantis-Desktop zwischen Läufen angemeldet bleiben kann. Verwenden Sie dies für das langlebige Discord-Web-Viewer-Profil.
- `--browser-profile-archive-env <name>` stellt vor dem Start des Browsers ein base64-`.tgz`-Chrome-User-Data-Dir-Archiv aus der benannten Umgebungsvariable wieder her. Verwenden Sie dies für angemeldete Zeugen wie Discord Web. Die Standard-Env-Var ist `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` steuert die MP4-Erfassungslänge. Verwenden Sie eine längere Dauer für langsame angemeldete Web-Apps, die Zeit zum Stabilisieren benötigen.
- `--keep-lease` oder `OPENCLAW_MANTIS_KEEP_VM=1` hält eine neu erstellte erfolgreiche Lease für VNC-Prüfung offen. Fehlgeschlagene Läufe behalten die Lease standardmäßig, wenn eine erstellt wurde, damit ein Operator sich erneut verbinden kann.
- `--class`, `--idle-timeout` und `--ttl` stimmen Maschinengröße und Lease-Lebensdauer ab.

Für Discord-Web-Nachweise verwendet Mantis ein dediziertes Viewer-Konto statt eines
Bot-Tokens. Das Live-Discord-API-Szenario bleibt das Oracle: Es erstellt den echten
Thread, sendet das SUT-`thread-reply` und prüft den Anhang über Discord
REST. Wenn `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` gesetzt ist, schreibt das Szenario außerdem
ein Discord-Web-URL-Artefakt. Wenn `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` gesetzt ist,
lässt es diesen Thread lange genug verfügbar, damit ein angemeldeter Browser ihn öffnen
und aufzeichnen kann.

Der GitHub-Workflow öffnet die Kandidaten-Thread-URL in Discord Web, erfasst einen
Screenshot, zeichnet eine MP4 auf und generiert eine getrimmte GIF-Vorschau, wenn Crabbox-
Medientooling verfügbar ist. Bevorzugen Sie einen persistenten Viewer-Profilpfad, der
über `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` konfiguriert ist, weil vollständige Chrome-Profil-
archive das Secret-Größenlimit von GitHub überschreiten können. Für kleine/Bootstrap-Profile
kann der Workflow außerdem ein base64-`.tgz`-Archiv aus
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` wiederherstellen. Wenn keine der beiden Profilquellen
konfiguriert ist, veröffentlicht der Workflow trotzdem die deterministischen Baseline/Kandidaten-
Anhang-Screenshots und protokolliert einen Hinweis, dass der angemeldete Discord-Web-Zeuge
übersprungen wurde.

Das erste vollständige Desktop-Transport-Primitiv ist der Slack-Desktop-Smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Er least oder verwendet eine Crabbox-Desktop-Maschine erneut, synchronisiert den aktuellen Checkout in
die VM, führt `pnpm openclaw qa slack` innerhalb dieser VM aus, öffnet Slack Web im VNC-
Browser, erfasst den sichtbaren Desktop und kopiert sowohl die Slack-QA-Artefakte als auch
den VNC-Screenshot zurück in das lokale Ausgabeverzeichnis. Dies ist die erste Mantis-
Form, bei der das SUT-OpenClaw-Gateway und der Browser beide in derselben
Linux-Desktop-VM leben.

Mit `--gateway-setup` bereitet der Befehl ein persistentes, entsorgbares OpenClaw-
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
  `OPENAI_API_KEY` gesetzt ist, mappt Mantis ihn auf `OPENCLAW_LIVE_OPENAI_KEY`,
  bevor Crabbox aufgerufen wird, sodass Crabboxs `OPENCLAW_*`-Env-Weiterleitung ihn
  in die VM tragen kann.

Mit `--gateway-setup --credential-source convex` least Mantis die Slack-SUT-
Zugangsdaten aus dem gemeinsamen Pool, bevor die VM erstellt wird, und leitet die geleaste
Kanal-ID, das Socket-Mode-App-Token und das Bot-Token als `OPENCLAW_MANTIS_SLACK_*`-
Runtime-Env innerhalb des Desktops weiter. Das hält GitHub-Workflows schlank: Sie benötigen nur
das Convex-Broker-Secret, keine rohen Slack-Bot- oder App-Tokens.

Nützliche Slack-Desktop-Flags:

- `--lease-id <cbx_...>` führt erneut gegen eine Maschine aus, auf der ein Operator sich bereits über VNC bei Slack Web angemeldet hat.
- `--gateway-setup` startet ein persistentes OpenClaw-Slack-Gateway in der VM, statt nur die Bot-zu-Bot-QA-Lane auszuführen.
- `--keep-lease` hält die Gateway-VM nach Erfolg für VNC-Prüfung offen; `--no-keep-lease` stoppt sie nach dem Sammeln der Artefakte.
- `--slack-url <url>` öffnet eine bestimmte Slack-Web-URL. Ohne diese leitet Mantis `https://app.slack.com/client/<team>/<channel>` aus Slack `auth.test` ab, wenn das SUT-Bot-Token verfügbar ist.
- `--slack-channel-id <id>` steuert die Slack-Kanal-Allowlist, die vom Gateway-Setup verwendet wird.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` steuert das persistente Chrome-Profil innerhalb der VM. Der Standard ist `$HOME/.config/openclaw-mantis/slack-chrome-profile`, sodass ein manueller Slack-Web-Login erneute Läufe auf derselben Lease überlebt.
- `--credential-source convex --credential-role ci` verwendet den gemeinsamen Zugangsdatenpool statt direkter Slack-Env-Tokens.
- `--provider-mode`, `--model`, `--alt-model` und `--fast` werden an die Slack-Live-Lane durchgereicht.

Approval-Checkpoint-Läufe rendern Slack-API-Nachrichten-Snapshots in Checkpoint-PNGs
für CI-sicheren visuellen Nachweis. `slack-desktop-smoke.png` ist nur dann Nachweis für Slack Web,
wenn die Lease ein warmes Browserprofil verwendet, das bereits angemeldet ist.

Der GitHub-Smoke-Workflow ist `Mantis Discord Smoke`. Der Vorher/Nachher-GitHub-
Workflow für das erste echte Szenario ist `Mantis Discord Status Reactions`. Er
akzeptiert:

- `baseline_ref`: der Ref, von dem erwartet wird, dass er Queue-only-Verhalten reproduziert.
- `candidate_ref`: der Ref, von dem erwartet wird, dass er `queued -> thinking -> done` zeigt.

Er checkt den Workflow-Harness-Ref aus, baut separate Baseline- und Kandidaten-
Worktrees, führt `discord-status-reactions-tool-only` gegen jeden Worktree aus und
lädt `baseline/`, `candidate/`, `comparison.json` und `mantis-report.md` als
Actions-Artefakte hoch. Außerdem rendert er das Timeline-HTML jeder Lane in einem Crabbox-
Desktop-Browser und veröffentlicht diese VNC-Screenshots neben den deterministischen
Timeline-PNGs im PR-Kommentar. Derselbe PR-Kommentar bettet schlanke,
bewegungsgetrimmte GIF-Vorschauen ein, die von `crabbox media preview` generiert wurden, verlinkt auf die
passenden bewegungsgetrimmten MP4-Clips und behält die vollständigen Desktop-MP4-Dateien für
tiefe Prüfung. Screenshots bleiben für schnelle Reviews inline. Der Workflow baut die
Crabbox-CLI aus
`openclaw/crabbox` main, damit er die aktuellen Desktop/Browser-Lease-Flags verwenden kann,
bevor das nächste Crabbox-Binary-Release erstellt wird.

`Mantis Scenario` ist der generische manuelle Einstiegspunkt. Er nimmt eine `scenario_id`,
`candidate_ref`, optional `baseline_ref` und optional `pr_number` entgegen und
ruft dann den Workflow auf, dem das Szenario gehört. Der Wrapper ist absichtlich schlank:
Szenario-Workflows besitzen weiterhin ihre Transport-Einrichtung, Zugangsdaten, VM-Klasse,
erwartete Oracle-Logik und ihr Artefaktmanifest.

`Mantis Slack Desktop Smoke` ist der erste Slack-VM-Workflow. Er checkt die
vertrauenswürdige Candidate-Ref in einem separaten Worktree aus, least einen Crabbox-Linux-Desktop,
führt `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` gegen diesen
Candidate aus, öffnet Slack Web im VNC-Browser, zeichnet den Desktop auf, erzeugt eine
bewegungsgetrimmte Vorschau mit `crabbox media preview`, lädt das vollständige
Artefaktverzeichnis hoch und postet optional den Inline-Nachweiskommentar im Ziel-PR.
Standardmäßig nutzt er AWS für den Desktop-Lease und stellt eine manuelle Provider-Eingabe bereit,
damit Operatoren zu Hetzner wechseln können, wenn AWS-Kapazität langsam oder nicht verfügbar ist. Verwenden Sie
diese Lane, wenn Sie „einen Linux-Desktop mit Slack und einer laufenden Claw“ möchten,
statt nur eines Bot-zu-Bot-Slack-Transkripts.

`Mantis Telegram Live` umschließt die vorhandene Telegram-Live-QA-Lane in derselben PR-
Nachweispipeline. Er checkt die vertrauenswürdige Candidate-Ref in einem separaten
Worktree aus, führt `pnpm openclaw qa telegram --credential-source convex
--credential-role ci` aus, schreibt ein `mantis-evidence.json`-Manifest aus der
Telegram-QA-Zusammenfassung, `qa-evidence.json` und Report-Artefakten, rendert das
redigierte Nachweis-HTML über einen Crabbox-Desktop-Browser, erzeugt ein
bewegungsgetrimmtes GIF mit `crabbox media preview` und postet den Inline-PR-
Nachweiskommentar, wenn eine PR-Nummer verfügbar ist. Diese Lane ist ein visueller
QA-Nachweis und kein Nachweis mit angemeldetem Telegram Web: Die Telegram Bot API liefert stabile Live-
Nachrichten-Nachweise, aber ein Telegram-Web-Anmeldestatus ist für normale Mantis-
Automatisierung nicht erforderlich.

`Mantis Telegram Desktop Proof` ist der agentische native Telegram-Desktop-
Vorher/Nachher-Wrapper. Ein Maintainer kann ihn aus einem PR-Kommentar mit
`@openclaw-mantis telegram desktop proof`, aus der Actions-UI mit Freiform-
Anweisungen oder über den generischen `Mantis Scenario`-Dispatcher auslösen. Der Workflow
übergibt PR, Baseline-Ref, Candidate-Ref und Maintainer-Anweisungen an Codex.
Der Agent liest den PR, entscheidet, welches Telegram-sichtbare Verhalten die
Änderung belegt, führt die Real-User-Crabbox-Telegram-Desktop-Proof-Lane für Baseline und
Candidate aus, iteriert, bis die nativen GIFs nützlich sind, schreibt gepaarte
`motionPreview`-Artefakte in `mantis-evidence.json`, lädt das Bundle hoch und
postet eine zweispaltige PR-Nachweistabelle, wenn eine PR-Nummer verfügbar ist.

Für die Einrichtung von Telegram Desktop mit menschlicher Beteiligung verwenden Sie den Szenario-Builder:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Der Builder least oder verwendet einen Crabbox-Desktop erneut, installiert die native Linux-
Telegram-Desktop-Binärdatei, stellt optional ein Benutzer-Session-Archiv wieder her, konfiguriert
OpenClaw mit dem geleasten Telegram-SUT-Bot-Token, startet `openclaw gateway run`
auf Port `38974`, postet eine Bereitschaftsnachricht des Driver-Bots in die geleaste private
Gruppe und erfasst dann einen Screenshot und eine MP4 vom sichtbaren VNC-Desktop. Ein Bot-
Token meldet Telegram Desktop nie an; er konfiguriert nur OpenClaw. Der Desktop-
Viewer ist eine separate Telegram-Benutzersitzung, die aus
`--telegram-profile-archive-env <name>` wiederhergestellt oder manuell über VNC erstellt und mit
`--keep-lease` am Leben gehalten wird.

Nützliche Telegram-Desktop-Builder-Flags:

- `--lease-id <cbx_...>` führt erneut gegen eine VM aus, auf der ein Operator bereits bei Telegram Desktop angemeldet ist.
- `--telegram-profile-archive-env <name>` liest ein base64-`.tgz`-Telegram-Desktop-Profilarchiv aus dieser Umgebungsvariable und stellt es vor dem Start wieder her.
- `--telegram-profile-dir <remote-path>` steuert das entfernte Telegram-Desktop-Profilverzeichnis. Der Standard ist `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` installiert und öffnet Telegram Desktop, ohne OpenClaw zu konfigurieren.
- `--credential-source convex --credential-role ci` verwendet den gemeinsamen Zugangsdaten-Broker statt direkter Telegram-Env-Token.

Jedes PR-veröffentlichende Szenario schreibt `mantis-evidence.json` neben seinen Report.
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
Werte sind relative Pfade unter dem konfigurierten Mantis-R2/S3-Artefaktpräfix. Der
Publisher lehnt Path Traversal ab und überspringt Einträge, die mit `"required": false`
markiert sind, wenn optionale Vorschauen oder Videos nicht verfügbar sind.

Unterstützte Artefaktarten:

- `timeline`: deterministischer Szenario-Screenshot, normalerweise vorher/nachher.
- `desktopScreenshot`: VNC-/Browser-Desktop-Screenshot.
- `motionPreview`: inline animiertes GIF, das aus der Desktop-Aufzeichnung erzeugt wird.
- `motionClip`: bewegungsgetrimmte MP4, die statischen Vorlauf und Nachlauf entfernt.
- `fullVideo`: vollständige MP4-Aufzeichnung für tiefe Prüfung.
- `metadata`: JSON-/Log-Sidecar.
- `report`: Markdown-Report.

Der wiederverwendbare Publisher ist `scripts/mantis/publish-pr-evidence.mjs`. Workflows
rufen ihn mit Manifest, Ziel-PR, Artefakt-Zielwurzel, Kommentarmarker,
Actions-Artefakt-URL, Run-URL und Anfragequelle auf. Er lädt deklarierte Artefakte
in den konfigurierten Mantis-R2/S3-Bucket hoch, baut einen zusammenfassungsorientierten PR-Kommentar mit
Inline-Bildern/Vorschauen und verlinkten Videos und aktualisiert dann den vorhandenen Marker-
Kommentar oder erstellt einen neuen. Die Workflows veröffentlichen nach `openclaw-crabbox-artifacts`
mit öffentlichen URLs unter `https://artifacts.openclaw.ai`. Sie stellen Bucket-,
Region- und Public-URL-Werte direkt bereit. Der wiederverwendbare Publisher erfordert:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

Sie können den Status-Reactions-Run auch direkt aus einem PR-Kommentar auslösen:

```text
@openclaw-mantis discord status reactions
```

Der Kommentarauslöser ist absichtlich eng gefasst. Er läuft nur bei Pull-Request-
Kommentaren von Benutzern mit Schreib-, Maintain- oder Admin-Zugriff und erkennt nur
Discord-Status-Reaction-Anfragen. Standardmäßig verwendet er die bekannte schlechte Baseline-Ref
und den aktuellen PR-Head-SHA als Candidate. Maintainer können jede der beiden
Refs überschreiben:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram-Live-QA kann auch aus einem PR-Kommentar ausgelöst werden:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Standardmäßig verwendet sie den aktuellen PR-Head-SHA als Candidate und führt
`telegram-status-command` aus. Maintainer können `candidate=...`,
`provider=aws|hetzner` und `lease=<cbx_...>` überschreiben, wenn sie eine bestimmte Ref oder einen
vorgewärmten Crabbox-Desktop benötigen.

ClawSweeper-Befehlsbeispiele:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Der erste Befehl ist explizit und szenariofokussiert. Der zweite kann später einen PR
oder ein Issue anhand von Labels, geänderten Dateien und ClawSweeper-Review-Findings
empfohlenen Mantis-Szenarien zuordnen.

## Run-Lebenszyklus

1. Zugangsdaten abrufen.
2. Eine VM zuweisen oder wiederverwenden.
3. Das Desktop-/Browserprofil vorbereiten, wenn das Szenario UI-Nachweise benötigt.
4. Einen sauberen Checkout für die Baseline-Ref vorbereiten.
5. Abhängigkeiten installieren und nur das bauen, was das Szenario benötigt.
6. Einen untergeordneten OpenClaw Gateway mit einem isolierten Zustandsverzeichnis starten.
7. Live-Transport, Provider, Modell und Browserprofil konfigurieren.
8. Das Szenario ausführen und Baseline-Nachweise erfassen.
9. Den Gateway stoppen und Logs aufbewahren.
10. Die Candidate-Ref in derselben VM vorbereiten.
11. Dasselbe Szenario ausführen und Candidate-Nachweise erfassen.
12. Die Oracle-Ergebnisse und visuellen Nachweise vergleichen.
13. Markdown, JSON, Logs, Screenshots und optionale Trace-Artefakte schreiben.
14. GitHub-Actions-Artefakte hochladen.
15. Eine prägnante PR- oder Discord-Statusmeldung posten.

Das Szenario sollte auf zwei verschiedene Arten fehlschlagen können:

- **Bug reproduziert**: Baseline ist auf die erwartete Weise fehlgeschlagen.
- **Harness-Fehler**: Umgebungseinrichtung, Zugangsdaten, Discord API, Browser oder
  Provider sind fehlgeschlagen, bevor das Bug-Oracle aussagekräftig war.

Der Abschlussreport muss diese Fälle trennen, damit Maintainer eine flaky
Umgebung nicht mit Produktverhalten verwechseln.

## Discord-MVP

Das erste Szenario sollte Discord-Statusreaktionen in Guild-Channels anvisieren, bei denen
der Quellantwort-Zustellmodus `message_tool_only` ist.

Warum es ein guter Mantis-Startpunkt ist:

- Es ist in Discord als Reaktionen auf die auslösende Nachricht sichtbar.
- Es hat ein starkes REST-Oracle über den Discord-Nachrichtenreaktionsstatus.
- Es übt einen echten OpenClaw Gateway, Discord-Bot-Authentifizierung, Nachrichtendispatch,
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

Baseline-Nachweise sollten die Queued-Bestätigungsreaktion, aber keinen
Lebenszyklusübergang im Tool-only-Modus zeigen. Candidate-Nachweise sollten zeigen, dass Lebenszyklus-
Statusreaktionen laufen, wenn `messages.statusReactions.enabled` explizit
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

Es konfiguriert das SUT mit immer aktiver Guild-Verarbeitung, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` und expliziten Statusreaktionen. Das Oracle
pollt die echte auslösende Discord-Nachricht und erwartet die beobachtete Sequenz
`👀 -> 🤔 -> 👍`. Artefakte enthalten `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` und
`discord-status-reactions-tool-only-timeline.png`.

## Vorhandene QA-Bausteine

Mantis sollte auf dem vorhandenen privaten QA-Stack aufbauen, statt bei
null zu beginnen:

- `pnpm openclaw qa discord` führt bereits eine Live-Discord-Lane mit Driver- und
  SUT-Bots aus.
- Der Live-Transport-Runner schreibt bereits Reports, QA-Nachweise und
  transportspezifische Artefakte unter `.artifacts/qa-e2e/`.
- Convex-Zugangsdaten-Leases stellen bereits exklusiven Zugriff auf gemeinsame Live-
  Transport-Zugangsdaten bereit.
- Der Browser-Control-Service unterstützt bereits Screenshots, Snapshots,
  kopflose verwaltete Profile und entfernte CDP-Profile.
- QA Lab hat bereits eine Debugger-UI und einen Bus für transportförmiges Testen.

Die erste Mantis-Implementierung kann ein schlanker Vorher/Nachher-Runner über diesen
Bausteinen sein, plus eine visuelle Nachweisebene.

## Nachweismodell

Jeder Run schreibt ein stabiles Artefaktverzeichnis:

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

`mantis-summary.json` sollte die maschinenlesbare Quelle der Wahrheit sein. Der
Markdown-Bericht ist für PR-Kommentare und die menschliche Prüfung gedacht.

Die Zusammenfassung muss Folgendes enthalten:

- getestete Refs und SHAs
- Transport und Szenario-ID
- Maschinen-Provider und Maschinen-ID oder Lease-ID
- Zugangsdatenquelle ohne geheime Werte
- Baseline-Ergebnis
- Kandidatenergebnis
- ob der Fehler auf der Baseline reproduziert wurde
- ob der Kandidat ihn behoben hat
- Artefaktpfade
- bereinigte Einrichtungs- oder Bereinigungsprobleme

Screenshots sind Nachweise, keine Geheimnisse. Sie erfordern dennoch sorgfältige
Redaktion: Private Kanalnamen, Benutzernamen oder Nachrichteninhalte können
erscheinen. Für öffentliche PRs sollten Sie GitHub-Actions-Artefaktlinks
Inline-Bildern vorziehen, bis die Redaktionsstrategie belastbarer ist.

## Browser und VNC

Die Browser-Lane hat zwei Modi:

- **Headless-Automatisierung**: Standard für CI. Chrome läuft mit aktiviertem
  CDP, und Playwright oder die OpenClaw-Browsersteuerung erfasst Screenshots.
- **VNC-Rettung**: auf derselben VM aktiviert, wenn Login, MFA,
  Discord-Anti-Automatisierung oder visuelles Debugging einen Menschen
  erfordern.

Das Browserprofil des Discord-Beobachters sollte persistent genug sein, um nicht
bei jedem Lauf eine Anmeldung zu erfordern, aber von persönlichem Browserzustand
isoliert sein. Ein Profil gehört zum Mantis-Maschinenpool, nicht zu einem
Entwickler-Laptop.

Wenn Mantis hängen bleibt, postet es eine Discord-Statusnachricht mit:

- Lauf-ID
- Szenario-ID
- Maschinen-Provider
- Artefaktverzeichnis
- VNC- oder noVNC-Verbindungsanweisungen, sofern verfügbar
- kurzem Blocker-Text

Die erste private Bereitstellung kann diese Nachrichten im bestehenden
Operator-Kanal posten und später in einen dedizierten Mantis-Kanal wechseln.

## Maschinen

Mantis sollte für die erste Remote-Implementierung AWS über Crabbox bevorzugen.
Crabbox liefert uns vorgewärmte Maschinen, Lease-Nachverfolgung, Hydration,
Logs, Ergebnisse und Bereinigung. Wenn AWS-Kapazität zu langsam oder nicht
verfügbar ist, fügen Sie einen Hetzner-Provider hinter derselben
Maschinenschnittstelle hinzu.

Mindestanforderungen an die VM:

- Linux mit desktopfähiger Chrome- oder Chromium-Installation
- CDP-Zugriff für Browser-Automatisierung
- VNC oder noVNC für Rettung
- Node 22 und pnpm
- OpenClaw-Checkout und Abhängigkeitscache
- Playwright-Chromium-Browsercache, wenn Playwright verwendet wird
- ausreichend CPU und Arbeitsspeicher für ein OpenClaw Gateway, einen Browser
  und einen Modelllauf
- ausgehender Zugriff auf Discord, GitHub, Modell-Provider und den
  Zugangsdaten-Broker

Die VM sollte keine langlebigen Rohgeheimnisse außerhalb der erwarteten
Zugangsdaten- oder Browserprofilspeicher behalten.

## Geheimnisse

Geheimnisse liegen für Remote-Läufe in GitHub-Organisations- oder
Repository-Secrets und für lokale Läufe in einer lokalen,
operatorgesteuerten Geheimnisdatei.

Empfohlene Secret-Namen:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` für öffentliche
  GitHub-Artefakt-Uploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

Langfristig sollte der Convex-Zugangsdatenpool die normale Quelle für
Live-Transportzugangsdaten bleiben. GitHub-Secrets initialisieren den Broker und
Fallback-Lanes. Der Workflow für Discord-Statusreaktionen ordnet die
Mantis-Crabbox-Secrets wieder den Umgebungsvariablen `CRABBOX_COORDINATOR` und
`CRABBOX_COORDINATOR_TOKEN` zu, die die Crabbox-CLI erwartet. Die einfachen
GitHub-Secret-Namen `CRABBOX_*` bleiben als Kompatibilitäts-Fallback akzeptiert.

Der Mantis-Runner darf niemals Folgendes ausgeben:

- Discord-Bot-Tokens
- Provider-API-Schlüssel
- Browser-Cookies
- Inhalte von Auth-Profilen
- VNC-Passwörter
- rohe Zugangsdaten-Payloads

Öffentliche Artefakt-Uploads sollten außerdem Discord-Zielmetadaten wie Bot-,
Guild-, Kanal- und Nachrichten-IDs redigieren. Der GitHub-Smoke-Workflow
aktiviert aus diesem Grund `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Wenn ein Token versehentlich in ein Issue, einen PR, einen Chat oder ein Log
eingefügt wird, rotieren Sie es, nachdem das neue Secret gespeichert wurde.

## GitHub-Artefakte und PR-Kommentare

Mantis-Workflows sollten das vollständige Nachweispaket als kurzlebiges
Actions-Artefakt hochladen. Wenn der Workflow für einen Fehlerbericht oder
Fix-PR ausgeführt wird, sollte er außerdem redigierte Inline-Medien in den
konfigurierten Mantis-R2/S3-Bucket veröffentlichen und einen Kommentar in diesem
Fehler- oder Fix-PR mit Inline-Vorher/Nachher-Screenshots upserten. Posten Sie
den primären Nachweis nicht nur in einem generischen QA-Automatisierungs-PR.
Rohe Logs, beobachtete Nachrichten und andere umfangreiche Nachweise bleiben im
Actions-Artefakt.

Produktions-Workflows sollten diese Kommentare mit der Mantis GitHub App posten,
nicht mit `github-actions[bot]`. Speichern Sie die App-ID und den privaten
Schlüssel als GitHub-Actions-Secrets `MANTIS_GITHUB_APP_ID` und
`MANTIS_GITHUB_APP_PRIVATE_KEY`. Der Workflow verwendet einen versteckten Marker
als Upsert-Schlüssel, aktualisiert diesen Kommentar, wenn das Token ihn
bearbeiten kann, und erstellt einen neuen Mantis-eigenen Kommentar, wenn ein
älterer bot-eigener Marker nicht bearbeitet werden kann.

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
Kommentar dies sagen, statt anzudeuten, dass der Kandidat fehlgeschlagen ist.

## Hinweise zur privaten Bereitstellung

Eine private Bereitstellung verfügt möglicherweise bereits über eine
Mantis-Discord-Anwendung. Verwenden Sie diese Anwendung wieder, statt eine
weitere App zu erstellen, wenn sie die richtigen Bot-Berechtigungen hat und
sicher rotiert werden kann.

Legen Sie den anfänglichen Operator-Benachrichtigungskanal über Secrets oder die
Bereitstellungskonfiguration fest. Er kann zunächst auf einen bestehenden
Maintainer- oder Betriebskanal zeigen und dann in einen dedizierten
Mantis-Kanal wechseln, sobald einer existiert.

Nehmen Sie keine Guild-IDs, Kanal-IDs, Bot-Tokens, Browser-Cookies oder
VNC-Passwörter in dieses Dokument auf. Speichern Sie sie in GitHub-Secrets, im
Zugangsdaten-Broker oder im lokalen Secret-Speicher des Operators.

## Ein Szenario hinzufügen

Ein Mantis-Szenario sollte Folgendes deklarieren:

- ID und Titel
- Transport
- erforderliche Zugangsdaten
- Baseline-Ref-Richtlinie
- Kandidaten-Ref-Richtlinie
- OpenClaw-Konfigurationspatch
- Einrichtungsschritte
- Stimulus
- erwartetes Baseline-Orakel
- erwartetes Kandidaten-Orakel
- Ziele für visuelle Erfassung
- Timeout-Budget
- Bereinigungsschritte

Szenarien sollten kleine, typisierte Orakel bevorzugen:

- Discord-Reaktionszustand für Reaktionsfehler
- Discord-Nachrichtenreferenzen für Threading-Fehler
- Slack-Thread-TS und Reaktions-API-Zustand für Slack-Fehler
- E-Mail-Nachrichten-IDs und Header für E-Mail-Fehler
- Browser-Screenshots, wenn die UI die einzige zuverlässige Beobachtungsquelle
  ist

Vision-Prüfungen sollten additiv sein. Wenn eine Plattform-API den Fehler
belegen kann, verwenden Sie die API als Bestanden/Fehlgeschlagen-Orakel und
behalten Sie Screenshots für menschliches Vertrauen bei.

## Provider-Erweiterung

Nach Discord kann derselbe Runner Folgendes hinzufügen:

- Slack: Reaktionen, Threads, App-Erwähnungen, Modale, Datei-Uploads.
- E-Mail: Gmail-Auth und Nachrichten-Threading mit `gog`, wenn Konnektoren
  nicht ausreichen.
- WhatsApp: QR-Login, Wiedererkennung, Nachrichtenübermittlung, Medien,
  Reaktionen.
- Telegram: Gruppenerwähnungs-Gating, Befehle, Reaktionen, wo verfügbar.
- Matrix: verschlüsselte Räume, Thread- oder Antwortbeziehungen,
  Neustart-Fortsetzung.

Jeder Transport sollte ein günstiges Smoke-Szenario und ein oder mehrere
Fehlerklassen-Szenarien haben. Teure visuelle Szenarien sollten optional
bleiben.

## Offene Fragen

- Welcher Discord-Bot sollte der Treiber sein und welcher die SUT, wenn der
  bestehende Mantis-Bot wiederverwendet wird?
- Sollte der Beobachter-Browser-Login in der ersten Phase ein menschliches
  Discord-Konto, ein Testkonto oder nur bot-lesbare REST-Nachweise verwenden?
- Wie lange sollte GitHub Mantis-Artefakte für PRs aufbewahren?
- Wann sollte ClawSweeper Mantis automatisch empfehlen, statt auf einen
  Maintainer-Befehl zu warten?
- Sollten Screenshots vor dem Upload für öffentliche PRs redigiert oder
  zugeschnitten werden?
