---
read_when:
    - Visuelle Live-QA für OpenClaw-Bugs erstellen oder ausführen
    - Vorher- und Nachher-Verifizierung für einen Pull Request hinzufügen
    - Hinzufügen von Discord, Slack, WhatsApp oder anderen Live-Transport-Szenarien
    - Debugging von QA-Läufen, die Screenshots, Browser-Automatisierung oder VNC-Zugriff benötigen
summary: Mantis ist das visuelle End-to-End-Verifizierungssystem, um OpenClaw-Fehler auf Live-Transporten zu reproduzieren, Vorher-/Nachher-Nachweise zu erfassen und Artefakte an PRs anzuhängen.
title: Mantis
x-i18n:
    generated_at: "2026-05-11T20:27:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis ist das End-to-End-Verifizierungssystem von OpenClaw für Bugs, die eine echte
Laufzeitumgebung, einen echten Transport und sichtbare Nachweise benötigen. Es führt ein Szenario gegen eine bekannte
fehlerhafte Ref aus, erfasst Nachweise, führt dasselbe Szenario gegen eine Kandidaten-Ref aus und
veröffentlicht den Vergleich als Artefakte, die ein Maintainer aus einem PR oder
über einen lokalen Befehl prüfen kann.

Mantis beginnt mit Discord, weil Discord uns einen besonders wertvollen ersten Prüfpfad bietet:
echte Bot-Authentifizierung, echte Guild-Kanäle, Reaktionen, Threads, native Befehle und eine
Browser-UI, in der Menschen visuell bestätigen können, was der Transport angezeigt hat.

## Ziele

- Einen Bug aus einem GitHub-Issue oder -PR mit derselben Transportform reproduzieren, die Benutzer
  sehen.
- Ein **Vorher**-Artefakt auf der Baseline-Ref erfassen, bevor der Fix angewendet wird.
- Ein **Nachher**-Artefakt auf der Kandidaten-Ref erfassen, nachdem der Fix angewendet wurde.
- Wann immer möglich ein deterministisches Oracle verwenden, etwa einen Discord-REST-Reaktionsabruf
  oder eine Prüfung des Kanaltranskripts.
- Screenshots erfassen, wenn der Bug eine sichtbare UI-Oberfläche hat.
- Lokal über eine agentengesteuerte CLI und remote über GitHub ausführen.
- Genug Maschinenzustand für VNC-Rettung erhalten, wenn Login, Browser-Automatisierung oder
  Provider-Authentifizierung hängen bleiben.
- Prägnante Statusmeldungen in einen Operator-Discord-Kanal posten, wenn der Lauf blockiert ist,
  manuelle VNC-Hilfe benötigt oder abgeschlossen ist.

## Nichtziele

- Mantis ist kein Ersatz für Unit-Tests. Ein Mantis-Lauf sollte nach dem Verständnis des Fixes in der Regel
  zu einem kleineren Regressionstest werden.
- Mantis ist nicht das normale schnelle CI-Gate. Es ist langsamer, verwendet Live-Zugangsdaten und
  ist Bugs vorbehalten, bei denen die Live-Umgebung relevant ist.
- Mantis sollte für den Normalbetrieb keinen Menschen benötigen. Manuelles VNC ist ein Rettungspfad,
  nicht der Standardpfad.
- Mantis speichert keine Roh-Secrets in Artefakten, Logs, Screenshots, Markdown-
  Berichten oder PR-Kommentaren.

## Zuständigkeit

Mantis lebt im OpenClaw-QA-Stack.

- OpenClaw besitzt die Szenario-Laufzeit, Transportadapter, das Nachweisschema und
  die lokale CLI unter `pnpm openclaw qa mantis`.
- QA Lab besitzt die Live-Transport-Harness-Teile, Browser-Erfassungshilfen und
  Artefakt-Schreiber.
- Crabbox besitzt vorgewärmte Linux-Maschinen, wenn eine Remote-VM benötigt wird.
- GitHub Actions besitzt den Remote-Workflow-Einstiegspunkt und die Artefakt-Aufbewahrung.
- ClawSweeper besitzt das GitHub-Kommentar-Routing: Parsen von Maintainer-Befehlen,
  Auslösen des Workflows und Posten des abschließenden PR-Kommentars.
- OpenClaw-Agenten steuern Mantis über Codex, wenn ein Szenario agentische Einrichtung,
  Debugging oder Berichte über festhängende Zustände benötigt.

Diese Grenze hält Transportwissen in OpenClaw, Maschinendisposition in
Crabbox und Maintainer-Workflow-Verknüpfung in ClawSweeper.

## Befehlsform

Der erste lokale Befehl verifiziert den Discord-Bot, die Guild, den Kanal, den Nachrichtenversand,
den Reaktionsversand und den Artefaktpfad:

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
`--allow-failures` aus und schreibt anschließend `baseline/`, `candidate/`, `comparison.json`
und `mantis-report.md`. Für das erste Discord-Szenario bedeutet eine erfolgreiche Verifizierung,
dass der Baseline-Status `fail` und der Kandidaten-Status `pass` ist.

Die zweite Discord-Vorher-/Nachher-Prüfung zielt auf Thread-Anhänge:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Dieses Szenario postet mit dem Treiber-Bot eine übergeordnete Nachricht, erstellt einen echten Discord-
Thread, ruft OpenClaws Aktion `message.thread-reply` mit einem repo-lokalen
`filePath` auf und pollt anschließend den Thread auf die SUT-Antwort und den Dateinamen des Anhangs. Der
Baseline-Screenshot zeigt die Antwort ohne Anhang; der Kandidaten-Screenshot
zeigt den erwarteten Anhang `mantis-thread-report.md`.

Das erste VM-/Browser-Primitiv ist der Desktop-Smoke-Test:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Er least oder verwendet eine Crabbox-Desktop-Maschine wieder, startet einen sichtbaren Browser innerhalb der
VNC-Sitzung, erfasst den Desktop, zieht Artefakte zurück in das lokale Ausgabe-
verzeichnis und schreibt den Wiederverbindungsbefehl in den Bericht. Der Befehl verwendet standardmäßig
den Hetzner-Provider, weil er der erste Provider mit funktionierender Desktop-/VNC-
Abdeckung in der Mantis-Lane ist. Überschreiben Sie ihn mit `--provider`, `--crabbox-bin` oder
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, wenn Sie gegen eine andere Crabbox-Flotte ausführen.

Nützliche Flags für den Desktop-Smoke-Test:

- `--lease-id <cbx_...>` oder `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` verwendet einen vorgewärmten Desktop wieder.
- `--browser-url <url>` ändert die Seite, die im sichtbaren Browser geöffnet wird.
- `--html-file <path>` rendert ein repo-lokales HTML-Artefakt im sichtbaren Browser. Mantis verwendet dies, um die generierte Discord-Statusreaktions-Zeitleiste über einen echten Crabbox-Desktop zu erfassen.
- `--browser-profile-dir <remote-path>` verwendet ein entferntes Chrome-User-Data-Verzeichnis wieder, sodass ein persistenter Mantis-Desktop zwischen Läufen angemeldet bleiben kann. Verwenden Sie dies für das langlebige Profil des Discord-Web-Betrachters.
- `--browser-profile-archive-env <name>` stellt ein base64-`.tgz`-Archiv eines Chrome-User-Data-Verzeichnisses aus der benannten Umgebungsvariablen wieder her, bevor der Browser gestartet wird. Verwenden Sie dies für angemeldete Zeugen wie Discord Web. Die Standard-Umgebungsvariable ist `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` steuert die Länge der MP4-Erfassung. Verwenden Sie eine längere Dauer für langsame angemeldete Web-Apps, die Zeit zum Stabilisieren benötigen.
- `--keep-lease` oder `OPENCLAW_MANTIS_KEEP_VM=1` hält eine neu erstellte erfolgreiche Lease für VNC-Inspektion offen. Fehlgeschlagene Läufe behalten die Lease standardmäßig, wenn eine erstellt wurde, damit ein Operator die Verbindung wiederherstellen kann.
- `--class`, `--idle-timeout` und `--ttl` stimmen Maschinengröße und Lease-Lebensdauer ab.

Für Discord-Web-Nachweise verwendet Mantis ein dediziertes Betrachterkonto statt eines
Bot-Tokens. Das Live-Discord-API-Szenario bleibt das Oracle: Es erstellt den echten
Thread, sendet das SUT-`thread-reply` und prüft den Anhang über Discord
REST. Wenn `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` gesetzt ist, schreibt das Szenario außerdem
ein Discord-Web-URL-Artefakt. Wenn `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` gesetzt ist,
lässt es diesen Thread lange genug verfügbar, damit ein angemeldeter Browser ihn öffnen
und aufzeichnen kann.

Der GitHub-Workflow öffnet die Kandidaten-Thread-URL in Discord Web, erfasst einen
Screenshot, zeichnet ein MP4 auf und erzeugt eine gekürzte GIF-Vorschau, wenn Crabbox-
Medienwerkzeuge verfügbar sind. Bevorzugen Sie einen persistenten Betrachterprofilpfad, der
über `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` konfiguriert ist, weil vollständige Chrome-Profil-
Archive das Größenlimit für GitHub-Secrets überschreiten können. Für kleine Bootstrap-Profile
kann der Workflow außerdem ein base64-`.tgz`-Archiv aus
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` wiederherstellen. Wenn keine der beiden Profilquellen
konfiguriert ist, veröffentlicht der Workflow dennoch die deterministischen Baseline-/Kandidaten-
Anhang-Screenshots und protokolliert einen Hinweis, dass der angemeldete Discord-Web-Zeuge
übersprungen wurde.

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
Form, bei der das SUT-OpenClaw-Gateway und der Browser beide innerhalb derselben
Linux-Desktop-VM laufen.

Mit `--gateway-setup` bereitet der Befehl ein persistentes, wegwerfbares OpenClaw-
Home unter `$HOME/.openclaw-mantis/slack-openclaw` vor, patcht die Slack-Socket-Mode-
Konfiguration für den ausgewählten Kanal, startet `openclaw gateway run` auf Port
`38973` und lässt Chrome in der VNC-Sitzung laufen. Dies ist der Modus „geben Sie mir einen
Linux-Desktop mit Slack und einer laufenden Claw“; die Bot-zu-Bot-Slack-QA-Lane
bleibt die Standardeinstellung, wenn `--gateway-setup` weggelassen wird.

Erforderliche Eingaben für `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` für die Remote-Modell-Lane. Wenn lokal nur
  `OPENAI_API_KEY` gesetzt ist, mappt Mantis es auf `OPENCLAW_LIVE_OPENAI_KEY`,
  bevor Crabbox aufgerufen wird, damit Crabbox’ `OPENCLAW_*`-Env-Weiterleitung es
  in die VM übertragen kann.

Mit `--gateway-setup --credential-source convex` least Mantis die Slack-SUT-
Zugangsdaten aus dem gemeinsamen Pool, bevor die VM erstellt wird, und leitet die geleaste
Kanal-ID, das Socket-Mode-App-Token und das Bot-Token als `OPENCLAW_MANTIS_SLACK_*`-
Laufzeitumgebung innerhalb des Desktops weiter. Das hält GitHub-Workflows schlank: Sie benötigen nur
das Convex-Broker-Secret, keine rohen Slack-Bot- oder App-Tokens.

Nützliche Slack-Desktop-Flags:

- `--lease-id <cbx_...>` führt erneut gegen eine Maschine aus, auf der sich ein Operator bereits über VNC bei Slack Web angemeldet hat.
- `--gateway-setup` startet ein persistentes OpenClaw-Slack-Gateway in der VM, statt nur die Bot-zu-Bot-QA-Lane auszuführen.
- `--keep-lease` hält die Gateway-VM nach Erfolg für VNC-Inspektion offen; `--no-keep-lease` stoppt sie nach dem Sammeln der Artefakte.
- `--slack-url <url>` öffnet eine bestimmte Slack-Web-URL. Ohne diese leitet Mantis `https://app.slack.com/client/<team>/<channel>` aus Slack `auth.test` ab, wenn das SUT-Bot-Token verfügbar ist.
- `--slack-channel-id <id>` steuert die Slack-Kanal-Allowlist, die vom Gateway-Setup verwendet wird.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` steuert das persistente Chrome-Profil innerhalb der VM. Der Standard ist `$HOME/.config/openclaw-mantis/slack-chrome-profile`, sodass ein manueller Slack-Web-Login erneute Läufe auf derselben Lease überlebt.
- `--credential-source convex --credential-role ci` verwendet den gemeinsamen Zugangsdatenpool statt direkter Slack-Env-Tokens.
- `--provider-mode`, `--model`, `--alt-model` und `--fast` werden an die Slack-Live-Lane durchgereicht.

Der GitHub-Smoke-Workflow ist `Mantis Discord Smoke`. Der Vorher-/Nachher-GitHub-
Workflow für das erste echte Szenario ist `Mantis Discord Status Reactions`. Er
akzeptiert:

- `baseline_ref`: die Ref, von der erwartet wird, dass sie nur-queued-Verhalten reproduziert.
- `candidate_ref`: die Ref, von der erwartet wird, dass sie `queued -> thinking -> done` zeigt.

Er checkt die Workflow-Harness-Ref aus, baut separate Baseline- und Kandidaten-
Worktrees, führt `discord-status-reactions-tool-only` gegen jeden Worktree aus und
lädt `baseline/`, `candidate/`, `comparison.json` und `mantis-report.md` als
Actions-Artefakte hoch. Außerdem rendert er die Zeitleisten-HTML jeder Lane in einem Crabbox-
Desktop-Browser und veröffentlicht diese VNC-Screenshots neben den deterministischen
Zeitleisten-PNGs im PR-Kommentar. Derselbe PR-Kommentar bettet leichtgewichtige,
bewegungsgekürzte GIF-Vorschauen ein, die von `crabbox media preview` erzeugt wurden, verlinkt die
passenden bewegungsgekürzten MP4-Clips und behält die vollständigen Desktop-MP4-Dateien für eine
tiefe Inspektion. Screenshots bleiben für schnelle Prüfung inline. Der Workflow baut die
Crabbox-CLI aus
`openclaw/crabbox` main, damit er die aktuellen Desktop-/Browser-Lease-Flags verwenden kann,
bevor das nächste Crabbox-Binary-Release veröffentlicht wird.

`Mantis Scenario` ist der generische manuelle Einstiegspunkt. Er nimmt eine `scenario_id`,
`candidate_ref`, optionale `baseline_ref` und optionale `pr_number` entgegen und
dispatcht anschließend den szenarioeigenen Workflow. Der Wrapper ist absichtlich dünn:
Szenario-Workflows besitzen weiterhin ihre Transporteinrichtung, Zugangsdaten, VM-Klasse,
das erwartete Oracle und das Artefaktmanifest.

`Mantis Slack Desktop Smoke` ist der erste Slack-VM-Workflow. Er checkt die
vertrauenswürdige Kandidaten-Ref in einem separaten Worktree aus, least einen
Crabbox-Linux-Desktop, führt `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` gegen diesen
Kandidaten aus, öffnet Slack Web im VNC-Browser, zeichnet den Desktop auf, erstellt eine
bewegungsgetrimmte Vorschau mit `crabbox media preview`, lädt das vollständige Artefaktverzeichnis hoch
und postet optional den Inline-Evidenzkommentar im Ziel-PR.
Standardmäßig wird AWS für den Desktop-Lease verwendet; außerdem gibt es eine manuelle Provider-Eingabe, damit
Operatoren zu Hetzner wechseln können, wenn AWS-Kapazität langsam oder nicht verfügbar ist. Verwenden Sie
diese Lane, wenn Sie „einen Linux-Desktop mit Slack und einer laufenden Claw“ möchten, statt
nur eines Bot-zu-Bot-Slack-Transkripts.

`Mantis Telegram Live` umschließt die vorhandene Telegram-Live-QA-Lane in derselben PR-
Evidenzpipeline. Es checkt die vertrauenswürdige Kandidaten-Ref in einem separaten
Worktree aus, führt `pnpm openclaw qa telegram --credential-source convex
--credential-role ci` aus, schreibt ein `mantis-evidence.json`-Manifest aus der
Telegram-QA-Zusammenfassung und dem beobachteten Nachrichtenartefakt, rendert das redigierte
Transkript-HTML über einen Crabbox-Desktop-Browser, erzeugt ein bewegungsgetrimmtes GIF
mit `crabbox media preview` und postet den Inline-PR-Evidenzkommentar, wenn eine PR-
Nummer verfügbar ist. Diese Lane ist transkriptvisuell und kein eingeloggter
Telegram-Web-Nachweis: Die Telegram Bot API liefert stabile Live-Nachrichtenevidenz, aber
der Telegram-Web-Loginstatus ist für normale Mantis-Automatisierung nicht erforderlich.

`Mantis Telegram Desktop Proof` ist der agentische Native-Telegram-Desktop-
Before/After-Wrapper. Ein Maintainer kann ihn aus einem PR-Kommentar mit
`@Mantis telegram desktop proof`, aus der Actions UI mit Freitextanweisungen
oder über den generischen `Mantis Scenario`-Dispatcher auslösen. Der Workflow
übergibt PR, Baseline-Ref, Kandidaten-Ref und Maintainer-Anweisungen an Codex.
Der Agent liest den PR, entscheidet, welches in Telegram sichtbare Verhalten die
Änderung belegt, führt die Real-User-Crabbox-Telegram-Desktop-Proof-Lane für Baseline und
Kandidat aus, iteriert, bis die nativen GIFs brauchbar sind, schreibt gepaarte
`motionPreview`-Artefakte in `mantis-evidence.json`, lädt das Bundle hoch und
postet eine zweispaltige PR-Evidenztabelle, wenn eine PR-Nummer verfügbar ist.

Für Human-in-the-loop-Telegram-Desktop-Setup verwenden Sie den Scenario Builder:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Der Builder least oder verwendet einen Crabbox-Desktop wieder, installiert die native Linux-
Telegram-Desktop-Binary, stellt optional ein User-Session-Archiv wieder her, konfiguriert
OpenClaw mit dem geleasten Telegram-SUT-Bot-Token, startet `openclaw gateway run`
auf Port `38974`, postet eine Driver-Bot-Bereitschaftsnachricht in die geleaste private
Gruppe und erfasst dann einen Screenshot und eine MP4 vom sichtbaren VNC-Desktop. Ein Bot-
Token meldet Telegram Desktop nie an; er konfiguriert nur OpenClaw. Der Desktop-
Viewer ist eine separate Telegram-User-Session, die aus
`--telegram-profile-archive-env <name>` wiederhergestellt oder manuell über VNC erstellt und mit
`--keep-lease` am Leben gehalten wird.

Nützliche Telegram-Desktop-Builder-Flags:

- `--lease-id <cbx_...>` führt erneut gegen eine VM aus, auf der ein Operator bereits bei Telegram Desktop angemeldet ist.
- `--telegram-profile-archive-env <name>` liest ein base64-kodiertes `.tgz`-Telegram-Desktop-Profilarchiv aus dieser Env-Var und stellt es vor dem Start wieder her.
- `--telegram-profile-dir <remote-path>` steuert das entfernte Telegram-Desktop-Profilverzeichnis. Standard ist `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` installiert und öffnet Telegram Desktop, ohne OpenClaw zu konfigurieren.
- `--credential-source convex --credential-role ci` verwendet den gemeinsamen Credential Broker statt direkter Telegram-Env-Tokens.

Jedes PR-publizierende Szenario schreibt `mantis-evidence.json` neben seinen Report.
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
Werte sind relative Pfade unter dem Veröffentlichungsverzeichnis des Branches `qa-artifacts`.
Der Publisher weist Path Traversal zurück und überspringt Einträge, die mit
`"required": false` markiert sind, wenn optionale Vorschauen oder Videos nicht verfügbar sind.

Unterstützte Artefaktarten:

- `timeline`: deterministischer Szenario-Screenshot, üblicherweise Before/After.
- `desktopScreenshot`: VNC-/Browser-Desktop-Screenshot.
- `motionPreview`: inline animiertes GIF, das aus der Desktop-Aufzeichnung erzeugt wurde.
- `motionClip`: bewegungsgetrimmte MP4, die statischen Vorlauf und Nachlauf entfernt.
- `fullVideo`: vollständige MP4-Aufzeichnung für tiefgehende Prüfung.
- `metadata`: JSON-/Log-Sidecar.
- `report`: Markdown-Report.

Der wiederverwendbare Publisher ist `scripts/mantis/publish-pr-evidence.mjs`. Workflows
rufen ihn mit Manifest, Ziel-PR, Ziel-Root `qa-artifacts`, Kommentarmarker,
Actions-Artefakt-URL, Run-URL und Request-Quelle auf. Er kopiert deklarierte Artefakte
in den Branch `qa-artifacts`, erstellt einen PR-Kommentar mit Zusammenfassung zuerst,
Inline-Bildern/-Vorschauen und verlinkten Videos und aktualisiert dann den vorhandenen
Marker-Kommentar oder erstellt einen neuen.

Sie können den Status-Reactions-Run auch direkt aus einem PR-Kommentar auslösen:

```text
@Mantis discord status reactions
```

Der Kommentar-Trigger ist absichtlich eng gefasst. Er läuft nur bei Pull-Request-
Kommentaren von Benutzern mit Schreib-, Maintain- oder Admin-Zugriff und erkennt nur
Discord-Status-Reaction-Anfragen. Standardmäßig verwendet er die bekannte fehlerhafte Baseline-Ref
und die aktuelle PR-Head-SHA als Kandidaten. Maintainer können beide
Refs überschreiben:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram-Live-QA kann ebenfalls aus einem PR-Kommentar ausgelöst werden:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Standardmäßig verwendet sie die aktuelle PR-Head-SHA als Kandidaten und führt
`telegram-status-command` aus. Maintainer können `candidate=...`,
`provider=aws|hetzner` und `lease=<cbx_...>` überschreiben, wenn sie eine bestimmte Ref oder einen
vorgewärmten Crabbox-Desktop benötigen.

ClawSweeper-Befehlsbeispiele:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Der erste Befehl ist explizit und szenariofokussiert. Der zweite kann später einen PR
oder ein Issue anhand von Labels, geänderten Dateien und
ClawSweeper-Review-Ergebnissen empfohlenen Mantis-Szenarien zuordnen.

## Run-Lebenszyklus

1. Zugangsdaten abrufen.
2. VM zuweisen oder wiederverwenden.
3. Desktop-/Browser-Profil vorbereiten, wenn das Szenario UI-Evidenz benötigt.
4. Sauberen Checkout für die Baseline-Ref vorbereiten.
5. Abhängigkeiten installieren und nur bauen, was das Szenario benötigt.
6. Untergeordnetes OpenClaw Gateway mit isoliertem State-Verzeichnis starten.
7. Live-Transport, Provider, Modell und Browser-Profil konfigurieren.
8. Szenario ausführen und Baseline-Evidenz erfassen.
9. Gateway stoppen und Logs aufbewahren.
10. Kandidaten-Ref in derselben VM vorbereiten.
11. Dasselbe Szenario ausführen und Kandidaten-Evidenz erfassen.
12. Oracle-Ergebnisse und visuelle Evidenz vergleichen.
13. Markdown, JSON, Logs, Screenshots und optionale Trace-Artefakte schreiben.
14. GitHub-Actions-Artefakte hochladen.
15. Kurze PR- oder Discord-Statusnachricht posten.

Das Szenario sollte auf zwei unterschiedliche Arten fehlschlagen können:

- **Bug reproduziert**: Baseline ist auf die erwartete Weise fehlgeschlagen.
- **Harness-Fehler**: Umgebungssetup, Zugangsdaten, Discord API, Browser oder
  Provider sind fehlgeschlagen, bevor das Bug-Oracle aussagekräftig war.

Der Abschlussbericht muss diese Fälle trennen, damit Maintainer eine instabile
Umgebung nicht mit Produktverhalten verwechseln.

## Discord-MVP

Das erste Szenario sollte Discord-Status-Reactions in Guild-Channels anvisieren, bei denen
der Quellantwort-Zustellmodus `message_tool_only` ist.

Warum es ein guter Mantis-Seed ist:

- Es ist in Discord als Reactions auf der auslösenden Nachricht sichtbar.
- Es hat ein starkes REST-Oracle über den Discord-Message-Reaction-State.
- Es übt ein echtes OpenClaw Gateway, Discord-Bot-Auth, Message-Dispatch,
  Quellantwort-Zustellmodus, Status-Reaction-State und Modell-Turn-Lebenszyklus aus.
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

Baseline-Evidenz sollte die Queued-Acknowledgement-Reaction zeigen, aber keinen
Lebenszyklusübergang im Tool-only-Modus. Kandidaten-Evidenz sollte zeigen, dass Lifecycle-
Status-Reactions laufen, wenn `messages.statusReactions.enabled` explizit
true ist.

Der ausführbare erste Slice ist das Opt-in-Discord-Live-QA-Szenario:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Es konfiguriert das SUT mit Always-on-Guild-Handling, `visibleReplies:
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
- Der Live-Transport-Runner schreibt bereits Reports und Observed-Message-
  Artefakte unter `.artifacts/qa-e2e/`.
- Convex-Credential-Leases stellen bereits exklusiven Zugriff auf gemeinsam genutzte Live-
  Transport-Zugangsdaten bereit.
- Der Browser-Control-Service unterstützt bereits Screenshots, Snapshots,
  headless verwaltete Profile und Remote-CDP-Profile.
- QA Lab hat bereits eine Debugger-UI und einen Bus für transportförmige Tests.

Die erste Mantis-Implementierung kann ein dünner Before/After-Runner über diesen
Bausteinen sein, plus eine visuelle Evidenzschicht.

## Evidenzmodell

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

`mantis-summary.json` sollte die maschinenlesbare maßgebliche Quelle sein. Der
Markdown-Report ist für PR-Kommentare und menschliche Prüfung gedacht.

Die Zusammenfassung muss enthalten:

- getestete Refs und SHAs
- Transport und Szenario-ID
- Machine-Provider und Machine-ID oder Lease-ID
- Credential-Quelle ohne geheime Werte
- Baseline-Ergebnis
- Kandidatenergebnis
- ob der Bug auf der Baseline reproduziert wurde
- ob der Kandidat ihn behoben hat
- Artefaktpfade
- bereinigte Setup- oder Cleanup-Probleme

Screenshots sind Belege, keine Secrets. Sie erfordern dennoch konsequente Redaktion:
Private Kanalnamen, Benutzernamen oder Nachrichteninhalte können sichtbar sein. Für öffentliche PRs
sollten Sie GitHub Actions-Artefaktlinks gegenüber Inline-Bildern bevorzugen, bis die Redaktionsstrategie
robuster ist.

## Browser und VNC

Die Browser-Lane hat zwei Modi:

- **Headless-Automatisierung**: Standard für CI. Chrome läuft mit aktiviertem CDP, und
  Playwright oder die OpenClaw-Browsersteuerung erfasst Screenshots.
- **VNC-Rettung**: auf derselben VM aktiviert, wenn Anmeldung, MFA, Discord-Anti-Automatisierung
  oder visuelles Debugging einen Menschen erfordern.

Das Browserprofil des Discord-Observers sollte persistent genug sein, damit nicht
bei jedem Lauf eine Anmeldung nötig ist, aber vom persönlichen Browserzustand isoliert bleiben. Ein Profil
gehört zum Mantis-Maschinenpool, nicht zu einem Entwickler-Laptop.

Wenn Mantis hängen bleibt, postet es eine Discord-Statusnachricht mit:

- Lauf-ID
- Szenario-ID
- Maschinen-Provider
- Artefaktverzeichnis
- VNC- oder noVNC-Verbindungsanweisungen, falls verfügbar
- kurzem Blocker-Text

Die erste private Bereitstellung kann diese Nachrichten im bestehenden Operator-
Kanal posten und später in einen dedizierten Mantis-Kanal wechseln.

## Maschinen

Mantis sollte für die erste Remote-Implementierung AWS über Crabbox bevorzugen.
Crabbox bietet uns vorgewärmte Maschinen, Lease-Tracking, Hydration, Logs, Ergebnisse und
Bereinigung. Wenn AWS-Kapazität zu langsam oder nicht verfügbar ist, fügen Sie einen Hetzner-Provider
hinter derselben Maschinenschnittstelle hinzu.

Mindestanforderungen an die VM:

- Linux mit einer desktopfähigen Chrome- oder Chromium-Installation
- CDP-Zugriff für Browser-Automatisierung
- VNC oder noVNC für Rettung
- Node 22 und pnpm
- OpenClaw-Checkout und Dependency-Cache
- Playwright-Chromium-Browsercache, wenn Playwright verwendet wird
- ausreichend CPU und Arbeitsspeicher für ein OpenClaw Gateway, einen Browser und einen Modelllauf
- ausgehender Zugriff auf Discord, GitHub, Modell-Provider und den Credential Broker

Die VM sollte keine langlebigen Roh-Secrets außerhalb der erwarteten Credential- oder
Browserprofil-Speicher behalten.

## Secrets

Secrets liegen in GitHub-Organisations- oder Repository-Secrets für Remote-Läufe und in
einer lokalen, vom Operator kontrollierten Secret-Datei für lokale Läufe.

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
Transport-Credentials bleiben. GitHub-Secrets bootstrappen den Broker und Fallback-Lanes.
Der Workflow für Discord-Statusreaktionen bildet die Mantis-Crabbox-Secrets zurück auf
die Umgebungsvariablen `CRABBOX_COORDINATOR` und `CRABBOX_COORDINATOR_TOKEN` ab,
die die Crabbox-CLI erwartet. Die einfachen GitHub-Secret-Namen `CRABBOX_*` bleiben
als Kompatibilitäts-Fallback akzeptiert.

Der Mantis-Runner darf niemals Folgendes ausgeben:

- Discord-Bot-Token
- Provider-API-Schlüssel
- Browser-Cookies
- Inhalte von Auth-Profilen
- VNC-Passwörter
- rohe Credential-Payloads

Öffentliche Artefakt-Uploads sollten außerdem Discord-Zielmetadaten wie Bot-,
Guild-, Kanal- und Nachrichten-IDs redigieren. Der GitHub-Smoke-Workflow aktiviert
aus diesem Grund `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Wenn ein Token versehentlich in ein Issue, einen PR, einen Chat oder ein Log eingefügt wird, rotieren Sie ihn,
nachdem das neue Secret gespeichert wurde.

## GitHub-Artefakte und PR-Kommentare

Mantis-Workflows sollten das vollständige Evidenzpaket als kurzlebiges Actions-
Artefakt hochladen. Wenn der Workflow für einen Bugreport oder Fix-PR ausgeführt wird, sollte er außerdem
die redigierten PNG-Screenshots im Branch `qa-artifacts` veröffentlichen und einen
Kommentar zu diesem Bug oder Fix-PR mit Inline-Vorher/Nachher-Screenshots upserten. Posten Sie
den primären Nachweis nicht nur in einem generischen QA-Automatisierungs-PR. Roh-Logs, beobachtete
Nachrichten und andere umfangreiche Evidenz verbleiben im Actions-Artefakt.

Produktions-Workflows sollten diese Kommentare mit der Mantis GitHub App posten, nicht
mit `github-actions[bot]`. Speichern Sie die App-ID und den privaten Schlüssel als
GitHub-Actions-Secrets `MANTIS_GITHUB_APP_ID` und `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Der Workflow verwendet einen versteckten Marker als Upsert-Schlüssel, aktualisiert diesen
Kommentar, wenn der Token ihn bearbeiten kann, und erstellt einen neuen Mantis-eigenen Kommentar, wenn
ein älterer bot-eigener Marker nicht bearbeitet werden kann.

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

Wenn der Lauf fehlschlägt, weil das Harness fehlgeschlagen ist, muss der Kommentar dies sagen,
statt anzudeuten, dass der Kandidat fehlgeschlagen ist.

## Hinweise zur privaten Bereitstellung

Eine private Bereitstellung hat möglicherweise bereits eine Mantis-Discord-Anwendung. Verwenden Sie diese
Anwendung erneut, statt eine weitere App zu erstellen, wenn sie die richtigen Bot-
Berechtigungen hat und sicher rotiert werden kann.

Legen Sie den anfänglichen Operator-Benachrichtigungskanal über Secrets oder Bereitstellungs-
konfiguration fest. Er kann zunächst auf einen bestehenden Maintainer- oder Betriebskanal
zeigen und dann in einen dedizierten Mantis-Kanal wechseln, sobald einer existiert.

Nehmen Sie keine Guild-IDs, Kanal-IDs, Bot-Token, Browser-Cookies oder VNC-Passwörter
in dieses Dokument auf. Speichern Sie sie in GitHub-Secrets, im Credential Broker oder im
lokalen Secret-Speicher des Operators.

## Ein Szenario hinzufügen

Ein Mantis-Szenario sollte Folgendes deklarieren:

- ID und Titel
- Transport
- erforderliche Credentials
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

- Discord-Reaktionszustand für Reaktions-Bugs
- Discord-Nachrichtenreferenzen für Threading-Bugs
- Slack-Thread-TS und Reaktions-API-Zustand für Slack-Bugs
- E-Mail-Nachrichten-IDs und Header für E-Mail-Bugs
- Browser-Screenshots, wenn die UI die einzige zuverlässige Beobachtungsquelle ist

Vision-Prüfungen sollten additiv sein. Wenn eine Plattform-API den Bug nachweisen kann, verwenden Sie die
API als Pass/Fail-Orakel und behalten Sie Screenshots für menschliches Vertrauen bei.

## Provider-Erweiterung

Nach Discord kann derselbe Runner Folgendes hinzufügen:

- Slack: Reaktionen, Threads, App-Erwähnungen, Modals, Datei-Uploads.
- E-Mail: Gmail-Authentifizierung und Nachrichten-Threading mit `gog`, wenn Connectors nicht
  ausreichen.
- WhatsApp: QR-Anmeldung, Re-Identifikation, Nachrichtenzustellung, Medien, Reaktionen.
- Telegram: Gatekeeping für Gruppenerwähnungen, Befehle, Reaktionen, sofern verfügbar.
- Matrix: verschlüsselte Räume, Thread- oder Antwortbeziehungen, Fortsetzen nach Neustart.

Jeder Transport sollte ein günstiges Smoke-Szenario und ein oder mehrere Bugklassen-
Szenarien haben. Teure visuelle Szenarien sollten optional bleiben.

## Offene Fragen

- Welcher Discord-Bot sollte der Treiber sein und welcher das SUT, wenn der
  bestehende Mantis-Bot wiederverwendet wird?
- Sollte die Observer-Browser-Anmeldung in der ersten Phase ein menschliches Discord-Konto, ein Testkonto
  oder nur botlesbare REST-Evidenz verwenden?
- Wie lange sollte GitHub Mantis-Artefakte für PRs aufbewahren?
- Wann sollte ClawSweeper Mantis automatisch empfehlen, statt auf einen
  Maintainer-Befehl zu warten?
- Sollten Screenshots vor dem Upload für öffentliche PRs redigiert oder zugeschnitten werden?
