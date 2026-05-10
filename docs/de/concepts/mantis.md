---
read_when:
    - Live-Visual-QA für OpenClaw-Fehler erstellen oder ausführen
    - Vorher- und Nachher-Verifizierung für einen Pull Request hinzufügen
    - Discord-, Slack-, WhatsApp- oder andere Live-Transport-Szenarien hinzufügen
    - Fehlerbehebung bei QA-Läufen, die Screenshots, Browserautomatisierung oder VNC-Zugriff benötigen
summary: Mantis ist das visuelle End-to-End-Verifizierungssystem, mit dem OpenClaw-Fehler auf Live-Transporten reproduziert, Vorher- und Nachher-Nachweise erfasst und Artefakte an PRs angehängt werden.
title: Gottesanbeterin
x-i18n:
    generated_at: "2026-05-10T19:31:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis ist das End-to-End-Verifizierungssystem von OpenClaw für Fehler, die eine echte
Runtime, einen echten Transport und sichtbaren Nachweis benötigen. Es führt ein Szenario gegen eine bekannte
fehlerhafte Referenz aus, erfasst Nachweise, führt dasselbe Szenario gegen eine Kandidatenreferenz aus und
veröffentlicht den Vergleich als Artefakte, die ein Maintainer aus einem PR oder
über einen lokalen Befehl prüfen kann.

Mantis beginnt mit Discord, weil Discord uns eine hochwertige erste Lane bietet:
echte Bot-Authentifizierung, echte Guild-Kanäle, Reaktionen, Threads, native Befehle und eine
Browser-UI, in der Menschen visuell bestätigen können, was der Transport gezeigt hat.

## Ziele

- Einen Fehler aus einem GitHub-Issue oder PR mit derselben Transportform reproduzieren, die Benutzer
  sehen.
- Ein **Vorher**-Artefakt auf der Baseline-Referenz erfassen, bevor der Fix angewendet wird.
- Ein **Nachher**-Artefakt auf der Kandidatenreferenz erfassen, nachdem der Fix angewendet wurde.
- Wann immer möglich ein deterministisches Oracle verwenden, etwa einen Discord-REST-Reaktionsabruf
  oder eine Prüfung des Kanaltranskripts.
- Screenshots erfassen, wenn der Fehler eine sichtbare UI-Oberfläche hat.
- Lokal über eine agentengesteuerte CLI und remote über GitHub ausführen.
- Genügend Maschinenzustand für VNC-Rettung beibehalten, wenn Anmeldung, Browser-Automatisierung oder
  Provider-Authentifizierung hängen bleiben.
- Prägnanten Status an einen Operator-Discord-Kanal senden, wenn der Lauf blockiert ist,
  manuelle VNC-Hilfe benötigt oder abgeschlossen ist.

## Nicht-Ziele

- Mantis ist kein Ersatz für Unit-Tests. Ein Mantis-Lauf sollte nach verstandenem Fix in der Regel
  zu einem kleineren Regressionstest werden.
- Mantis ist nicht das normale schnelle CI-Gate. Es ist langsamer, verwendet Live-Zugangsdaten und
  ist Fehlern vorbehalten, bei denen die Live-Umgebung relevant ist.
- Mantis sollte im Normalbetrieb keinen Menschen erfordern. Manuelles VNC ist ein Rettungspfad,
  nicht der Standardpfad.
- Mantis speichert keine Roh-Secrets in Artefakten, Logs, Screenshots, Markdown-Berichten
  oder PR-Kommentaren.

## Zuständigkeit

Mantis lebt im OpenClaw-QA-Stack.

- OpenClaw besitzt die Szenario-Runtime, Transportadapter, das Nachweisschema und
  die lokale CLI unter `pnpm openclaw qa mantis`.
- QA Lab besitzt die Live-Transport-Harness-Teile, Browser-Erfassungshilfen und
  Artefakt-Schreiber.
- Crabbox besitzt vorgewärmte Linux-Maschinen, wenn eine Remote-VM benötigt wird.
- GitHub Actions besitzt den Remote-Workflow-Einstiegspunkt und die Artefaktaufbewahrung.
- ClawSweeper besitzt das GitHub-Kommentar-Routing: Maintainer-Befehle parsen,
  den Workflow auslösen und den finalen PR-Kommentar posten.
- OpenClaw-Agenten steuern Mantis über Codex, wenn ein Szenario agentisches Setup,
  Debugging oder Berichte zu festgefahrenen Zuständen benötigt.

Diese Grenze hält Transportwissen in OpenClaw, Maschinenplanung in
Crabbox und Maintainer-Workflow-Verknüpfung in ClawSweeper.

## Befehlsform

Der erste lokale Befehl verifiziert den Discord-Bot, Guild, Kanal, Nachrichtensenden,
Reaktionssenden und Artefaktpfad:

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

Der Runner erstellt losgelöste Baseline- und Kandidaten-Worktrees unter dem Ausgabe-
Verzeichnis, installiert Abhängigkeiten, baut jede Referenz, führt das Szenario mit
`--allow-failures` aus und schreibt anschließend `baseline/`, `candidate/`, `comparison.json`
und `mantis-report.md`. Für das erste Discord-Szenario bedeutet eine erfolgreiche Verifizierung,
dass der Baseline-Status `fail` und der Kandidatenstatus `pass` ist.

Die zweite Discord-Vorher/Nachher-Prüfung zielt auf Thread-Anhänge:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Dieses Szenario postet mit dem Treiber-Bot eine übergeordnete Nachricht, erstellt einen echten Discord-
Thread, ruft die OpenClaw-Aktion `message.thread-reply` mit einem repo-lokalen
`filePath` auf und pollt anschließend den Thread auf die SUT-Antwort und den Dateinamen des Anhangs. Der
Baseline-Screenshot zeigt die Antwort ohne Anhang; der Kandidaten-Screenshot
zeigt den erwarteten Anhang `mantis-thread-report.md`.

Die erste VM/Browser-Primitive ist der Desktop-Smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Er least oder verwendet eine Crabbox-Desktop-Maschine erneut, startet einen sichtbaren Browser innerhalb der
VNC-Sitzung, erfasst den Desktop, zieht Artefakte zurück in das lokale Ausgabe-
Verzeichnis und schreibt den Wiederverbindungsbefehl in den Bericht. Der Befehl verwendet standardmäßig
den Hetzner-Provider, weil er der erste Provider mit funktionierender Desktop/VNC-
Abdeckung in der Mantis-Lane ist. Überschreiben Sie ihn mit `--provider`, `--crabbox-bin` oder
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, wenn Sie gegen eine andere Crabbox-Flotte ausführen.

Nützliche Desktop-Smoke-Flags:

- `--lease-id <cbx_...>` oder `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` verwendet einen vorgewärmten Desktop erneut.
- `--browser-url <url>` ändert die Seite, die im sichtbaren Browser geöffnet wird.
- `--html-file <path>` rendert ein repo-lokales HTML-Artefakt im sichtbaren Browser. Mantis nutzt dies, um die generierte Discord-Statusreaktions-Timeline über einen echten Crabbox-Desktop zu erfassen.
- `--browser-profile-dir <remote-path>` verwendet ein entferntes Chrome-user-data-dir erneut, damit ein persistenter Mantis-Desktop zwischen Läufen angemeldet bleiben kann. Verwenden Sie dies für das langlebige Discord-Web-Viewer-Profil.
- `--browser-profile-archive-env <name>` stellt vor dem Start des Browsers ein base64-`.tgz`-Archiv eines Chrome-user-data-dir aus der benannten Umgebungsvariable wieder her. Verwenden Sie dies für angemeldete Zeugen wie Discord Web. Die Standard-Env-Var ist `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` steuert die Länge der MP4-Erfassung. Verwenden Sie eine längere Dauer für langsame angemeldete Web-Apps, die Zeit zum Stabilisieren benötigen.
- `--keep-lease` oder `OPENCLAW_MANTIS_KEEP_VM=1` hält eine neu erstellte erfolgreiche Lease für VNC-Inspektion offen. Fehlgeschlagene Läufe behalten die Lease standardmäßig bei, wenn eine erstellt wurde, damit ein Operator sich erneut verbinden kann.
- `--class`, `--idle-timeout` und `--ttl` passen Maschinengröße und Lease-Lebensdauer an.

Für Discord-Web-Nachweise verwendet Mantis statt eines Bot-Tokens ein dediziertes Viewer-Konto. Das Live-Discord-API-Szenario bleibt das Oracle: Es erstellt den echten
Thread, sendet die SUT-`thread-reply` und prüft den Anhang über Discord
REST. Wenn `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` gesetzt ist, schreibt das Szenario zusätzlich
ein Discord-Web-URL-Artefakt. Wenn `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` gesetzt ist,
lässt es diesen Thread lange genug verfügbar, damit ein angemeldeter Browser ihn öffnen
und aufzeichnen kann.

Der GitHub-Workflow öffnet die Kandidaten-Thread-URL in Discord Web, erfasst einen
Screenshot, zeichnet ein MP4 auf und erzeugt eine zugeschnittene GIF-Vorschau, wenn Crabbox-
Medienwerkzeuge verfügbar sind. Bevorzugen Sie einen persistenten Viewer-Profilpfad, der
über `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` konfiguriert ist, weil vollständige Chrome-Profil-
Archive die Secret-Größenbeschränkung von GitHub überschreiten können. Für kleine/Bootstrap-Profile
kann der Workflow außerdem ein base64-`.tgz`-Archiv aus
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` wiederherstellen. Wenn keine der beiden Profilquellen
konfiguriert ist, veröffentlicht der Workflow dennoch die deterministischen Baseline/Kandidaten-
Anhang-Screenshots und protokolliert einen Hinweis, dass der angemeldete Discord-Web-Zeuge
übersprungen wurde.

Die erste vollständige Desktop-Transport-Primitive ist der Slack-Desktop-Smoke:

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
Form, bei der das SUT-OpenClaw-Gateway und der Browser beide innerhalb derselben
Linux-Desktop-VM leben.

Mit `--gateway-setup` bereitet der Befehl ein persistentes wegwerfbares OpenClaw-
Home unter `$HOME/.openclaw-mantis/slack-openclaw` vor, patcht die Slack-Socket-Mode-
Konfiguration für den ausgewählten Kanal, startet `openclaw gateway run` auf Port
`38973` und lässt Chrome in der VNC-Sitzung laufen. Dies ist der Modus „lassen Sie mir einen
Linux-Desktop mit Slack und einer laufenden claw“; die Bot-zu-Bot-Slack-QA-Lane
bleibt der Standard, wenn `--gateway-setup` weggelassen wird.

Erforderliche Eingaben für `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` für die Remote-Modell-Lane. Wenn lokal nur
  `OPENAI_API_KEY` gesetzt ist, mappt Mantis ihn auf `OPENCLAW_LIVE_OPENAI_KEY`,
  bevor Crabbox aufgerufen wird, damit Crabbox' `OPENCLAW_*`-Env-Weiterleitung ihn
  in die VM transportieren kann.

Mit `--gateway-setup --credential-source convex` least Mantis die Slack-SUT-
Zugangsdaten aus dem gemeinsamen Pool, bevor die VM erstellt wird, und leitet die geleaste
Kanal-ID, das Socket-Mode-App-Token und das Bot-Token als `OPENCLAW_MANTIS_SLACK_*`-
Runtime-Env innerhalb des Desktops weiter. Das hält GitHub-Workflows schlank: Sie benötigen nur
das Convex-Broker-Secret, keine rohen Slack-Bot- oder App-Tokens.

Nützliche Slack-Desktop-Flags:

- `--lease-id <cbx_...>` führt erneut gegen eine Maschine aus, auf der ein Operator sich bereits über VNC bei Slack Web angemeldet hat.
- `--gateway-setup` startet ein persistentes OpenClaw-Slack-Gateway in der VM, statt nur die Bot-zu-Bot-QA-Lane auszuführen.
- `--keep-lease` hält die Gateway-VM nach Erfolg für VNC-Inspektion offen; `--no-keep-lease` stoppt sie nach dem Sammeln der Artefakte.
- `--slack-url <url>` öffnet eine bestimmte Slack-Web-URL. Ohne diese leitet Mantis `https://app.slack.com/client/<team>/<channel>` aus Slack `auth.test` ab, wenn das SUT-Bot-Token verfügbar ist.
- `--slack-channel-id <id>` steuert die Slack-Kanal-Allowlist, die vom Gateway-Setup verwendet wird.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` steuert das persistente Chrome-Profil innerhalb der VM. Standard ist `$HOME/.config/openclaw-mantis/slack-chrome-profile`, sodass eine manuelle Slack-Web-Anmeldung erneute Läufe auf derselben Lease überlebt.
- `--credential-source convex --credential-role ci` verwendet den gemeinsamen Zugangsdaten-Pool statt direkter Slack-Env-Tokens.
- `--provider-mode`, `--model`, `--alt-model` und `--fast` werden an die Slack-Live-Lane durchgereicht.

Der GitHub-Smoke-Workflow heißt `Mantis Discord Smoke`. Der Vorher/Nachher-GitHub-
Workflow für das erste echte Szenario heißt `Mantis Discord Status Reactions`. Er
akzeptiert:

- `baseline_ref`: die Referenz, von der erwartet wird, dass sie das Verhalten „nur queued“ reproduziert.
- `candidate_ref`: die Referenz, von der erwartet wird, dass sie `queued -> thinking -> done` zeigt.

Er checkt die Workflow-Harness-Referenz aus, baut separate Baseline- und Kandidaten-
Worktrees, führt `discord-status-reactions-tool-only` gegen jeden Worktree aus und
lädt `baseline/`, `candidate/`, `comparison.json` und `mantis-report.md` als
Actions-Artefakte hoch. Außerdem rendert er das Timeline-HTML jeder Lane in einem Crabbox-
Desktop-Browser und veröffentlicht diese VNC-Screenshots neben den deterministischen
Timeline-PNGs im PR-Kommentar. Derselbe PR-Kommentar bettet leichtgewichtige,
bewegungsgetrimmte GIF-Vorschauen ein, die von `crabbox media preview` erzeugt wurden, verlinkt auf die
passenden bewegungsgetrimmten MP4-Clips und behält die vollständigen Desktop-MP4-Dateien für tiefe
Inspektion. Screenshots bleiben für schnelle Prüfung inline. Der Workflow baut die
Crabbox-CLI aus
`openclaw/crabbox` main, damit er die aktuellen Desktop/Browser-Lease-Flags verwenden kann,
bevor das nächste Crabbox-Binary-Release geschnitten wird.

`Mantis Scenario` ist der generische manuelle Einstiegspunkt. Er nimmt eine `scenario_id`,
`candidate_ref`, optionale `baseline_ref` und optionale `pr_number` entgegen und
dispatcht dann den szenarioeigenen Workflow. Der Wrapper ist absichtlich schlank:
Szenario-Workflows besitzen weiterhin ihre Transporteinrichtung, Zugangsdaten, VM-Klasse,
das erwartete Oracle und das Artefaktmanifest.

`Mantis Slack Desktop Smoke` ist der erste Slack-VM-Workflow. Er checkt den
vertrauenswürdigen Candidate-Ref in einem separaten Worktree aus, least einen
Crabbox-Linux-Desktop, führt `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` gegen diesen
Candidate aus, öffnet Slack Web im VNC-Browser, zeichnet den Desktop auf, erzeugt eine
bewegungsgekürzte Vorschau mit `crabbox media preview`, lädt das vollständige
Artefaktverzeichnis hoch und postet optional den Inline-Evidenzkommentar im Ziel-PR.
Standardmäßig wird AWS für den Desktop-Lease verwendet; außerdem gibt es eine manuelle Provider-Eingabe, damit
Operatoren zu Hetzner wechseln können, wenn AWS-Kapazität langsam oder nicht verfügbar ist. Verwenden Sie
diese Lane, wenn Sie „einen Linux-Desktop mit Slack und einer laufenden Claw“ möchten,
statt nur eines Bot-zu-Bot-Slack-Transkripts.

`Mantis Telegram Live` verpackt die vorhandene Telegram-Live-QA-Lane in dieselbe PR-
Evidenzpipeline. Es checkt den vertrauenswürdigen Candidate-Ref in einem separaten
Worktree aus, führt `pnpm openclaw qa telegram --credential-source convex
--credential-role ci` aus, schreibt ein `mantis-evidence.json`-Manifest aus der
Telegram-QA-Zusammenfassung und dem Artefakt mit beobachteten Nachrichten, rendert das redigierte
Transkript-HTML über einen Crabbox-Desktop-Browser, erzeugt ein bewegungsgekürztes GIF
mit `crabbox media preview` und postet den Inline-PR-Evidenzkommentar, wenn eine PR-
Nummer verfügbar ist. Diese Lane ist transkriptvisuell und kein Nachweis für ein eingeloggtes
Telegram Web: Die Telegram Bot API liefert stabile Live-Nachrichtenevidenz, aber ein
Telegram-Web-Login-Status ist für normale Mantis-Automatisierung nicht erforderlich.

Für die Einrichtung von Telegram Desktop mit menschlicher Beteiligung verwenden Sie den Scenario Builder:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Der Builder least oder verwendet einen Crabbox-Desktop erneut, installiert das native Linux-
Telegram-Desktop-Binary, stellt optional ein Benutzer-Sitzungsarchiv wieder her, konfiguriert
OpenClaw mit dem geleasten Telegram-SUT-Bot-Token, startet `openclaw gateway run`
auf Port `38974`, postet eine Bereitschaftsnachricht des Driver-Bots in die geleaste private
Gruppe und erfasst dann einen Screenshot und eine MP4 vom sichtbaren VNC-Desktop. Ein Bot-
Token loggt sich niemals in Telegram Desktop ein; er konfiguriert nur OpenClaw. Der Desktop-
Viewer ist eine separate Telegram-Benutzersitzung, die aus
`--telegram-profile-archive-env <name>` wiederhergestellt oder manuell über VNC erstellt und mit
`--keep-lease` am Leben gehalten wird.

Nützliche Flags für den Telegram-Desktop-Builder:

- `--lease-id <cbx_...>` führt erneut gegen eine VM aus, auf der sich ein Operator bereits bei Telegram Desktop angemeldet hat.
- `--telegram-profile-archive-env <name>` liest ein base64-kodiertes `.tgz`-Archiv eines Telegram-Desktop-Profils aus dieser Env-Variable und stellt es vor dem Start wieder her.
- `--telegram-profile-dir <remote-path>` steuert das Remote-Verzeichnis für das Telegram-Desktop-Profil. Der Standardwert ist `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` installiert und öffnet Telegram Desktop, ohne OpenClaw zu konfigurieren.
- `--credential-source convex --credential-role ci` verwendet den gemeinsamen Credential-Broker statt direkter Telegram-Env-Tokens.

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
Werte sind relative Pfade unter dem Veröffentlichungsverzeichnis des Branches `qa-artifacts`.
Der Publisher weist Path Traversal zurück und überspringt Einträge, die mit
`"required": false` markiert sind, wenn optionale Vorschauen oder Videos nicht verfügbar sind.

Unterstützte Artefakttypen:

- `timeline`: deterministischer Szenario-Screenshot, üblicherweise Vorher/Nachher.
- `desktopScreenshot`: VNC-/Browser-Desktop-Screenshot.
- `motionPreview`: inline animiertes GIF, das aus der Desktop-Aufzeichnung erzeugt wurde.
- `motionClip`: bewegungsgekürzte MP4, die statischen Vorlauf und Nachlauf entfernt.
- `fullVideo`: vollständige MP4-Aufzeichnung für tiefere Prüfung.
- `metadata`: JSON-/Log-Sidecar.
- `report`: Markdown-Bericht.

Der wiederverwendbare Publisher ist `scripts/mantis/publish-pr-evidence.mjs`. Workflows
rufen ihn mit Manifest, Ziel-PR, Ziel-Root von `qa-artifacts`, Kommentar-Marker,
Actions-Artefakt-URL, Run-URL und Request-Quelle auf. Er kopiert deklarierte Artefakte
in den Branch `qa-artifacts`, erstellt einen zuerst zusammenfassenden PR-Kommentar mit Inline-
Bildern/Vorschauen und verlinkten Videos und aktualisiert dann den vorhandenen Marker-Kommentar oder
erstellt einen neuen.

Sie können den Status-Reactions-Lauf auch direkt aus einem PR-Kommentar auslösen:

```text
@Mantis discord status reactions
```

Der Kommentar-Trigger ist absichtlich eng gefasst. Er läuft nur bei Pull-Request-
Kommentaren von Benutzern mit Schreib-, Maintain- oder Admin-Zugriff und erkennt nur
Discord-Status-Reaction-Requests. Standardmäßig verwendet er den bekannten fehlerhaften Baseline-Ref
und den aktuellen PR-Head-SHA als Candidate. Maintainer können beide
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

Standardmäßig verwendet sie den aktuellen PR-Head-SHA als Candidate und führt
`telegram-status-command` aus. Maintainer können `candidate=...`,
`provider=aws|hetzner` und `lease=<cbx_...>` überschreiben, wenn sie einen bestimmten Ref oder einen
vorgewärmten Crabbox-Desktop benötigen.

ClawSweeper-Befehlsbeispiele:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Der erste Befehl ist explizit und szenariofokussiert. Der zweite kann später einen PR
oder ein Issue anhand von Labels, geänderten Dateien und
ClawSweeper-Review-Ergebnissen empfohlenen Mantis-Szenarien zuordnen.

## Run-Lifecycle

1. Credentials beschaffen.
2. Eine VM zuweisen oder wiederverwenden.
3. Das Desktop-/Browser-Profil vorbereiten, wenn das Szenario UI-Evidenz benötigt.
4. Einen sauberen Checkout für den Baseline-Ref vorbereiten.
5. Abhängigkeiten installieren und nur bauen, was das Szenario benötigt.
6. Einen untergeordneten OpenClaw Gateway mit einem isolierten State-Verzeichnis starten.
7. Live-Transport, Provider, Modell und Browser-Profil konfigurieren.
8. Das Szenario ausführen und Baseline-Evidenz erfassen.
9. Den Gateway stoppen und Logs aufbewahren.
10. Den Candidate-Ref in derselben VM vorbereiten.
11. Dasselbe Szenario ausführen und Candidate-Evidenz erfassen.
12. Die Oracle-Ergebnisse und visuelle Evidenz vergleichen.
13. Markdown, JSON, Logs, Screenshots und optionale Trace-Artefakte schreiben.
14. GitHub-Actions-Artefakte hochladen.
15. Eine knappe PR- oder Discord-Statusmeldung posten.

Das Szenario sollte auf zwei unterschiedliche Arten fehlschlagen können:

- **Fehler reproduziert**: Die Baseline ist auf die erwartete Weise fehlgeschlagen.
- **Harness-Fehler**: Umgebungseinrichtung, Credentials, Discord API, Browser oder
  Provider sind fehlgeschlagen, bevor das Fehler-Oracle aussagekräftig war.

Der Abschlussbericht muss diese Fälle trennen, damit Maintainer eine flaky
Umgebung nicht mit Produktverhalten verwechseln.

## Discord-MVP

Das erste Szenario sollte auf Discord-Statusreaktionen in Guild-Kanälen abzielen, bei denen
der Quellantwort-Zustellmodus `message_tool_only` ist.

Warum dies ein guter Mantis-Seed ist:

- Es ist in Discord als Reaktionen auf die auslösende Nachricht sichtbar.
- Es hat ein starkes REST-Oracle über den Discord-Nachrichtenreaktionsstatus.
- Es übt einen echten OpenClaw Gateway, Discord-Bot-Auth, Nachrichtenversand,
  Quellantwort-Zustellmodus, Statusreaktionsstatus und Modell-Turn-Lifecycle aus.
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

Baseline-Evidenz sollte die Queued-Acknowledgement-Reaktion zeigen, aber keine
Lifecycle-Transition im Tool-only-Modus. Candidate-Evidenz sollte zeigen, dass Lifecycle-
Statusreaktionen laufen, wenn `messages.statusReactions.enabled` explizit
`true` ist.

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

Es konfiguriert das SUT mit dauerhaft aktivierter Guild-Verarbeitung, `visibleReplies:
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
- Der Live-Transport-Runner schreibt bereits Berichte und Artefakte mit beobachteten Nachrichten
  unter `.artifacts/qa-e2e/`.
- Convex-Credential-Leases stellen bereits exklusiven Zugriff auf gemeinsame Live-
  Transport-Credentials bereit.
- Der Browser-Control-Service unterstützt bereits Screenshots, Snapshots,
  headless verwaltete Profile und Remote-CDP-Profile.
- QA Lab hat bereits eine Debugger-UI und einen Bus für transportförmiges Testen.

Die erste Mantis-Implementierung kann ein dünner Vorher/Nachher-Runner über diese
Bausteine plus eine visuelle Evidenzschicht sein.

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

`mantis-summary.json` sollte die maschinenlesbare Source of Truth sein. Der
Markdown-Bericht ist für PR-Kommentare und menschliche Review gedacht.

Die Zusammenfassung muss Folgendes enthalten:

- getestete Refs und SHAs
- Transport und Szenario-ID
- Maschinen-Provider und Maschinen-ID oder Lease-ID
- Credential-Quelle ohne Secret-Werte
- Baseline-Ergebnis
- Candidate-Ergebnis
- ob der Fehler auf der Baseline reproduziert wurde
- ob der Candidate ihn behoben hat
- Artefaktpfade
- bereinigte Setup- oder Cleanup-Probleme

Screenshots sind Evidenz, keine Secrets. Sie erfordern dennoch Disziplin bei der
Redaktion: private Kanalnamen, Benutzernamen oder Nachrichteninhalte können erscheinen. Für öffentliche PRs
sollten Sie GitHub-Actions-Artefaktlinks gegenüber Inline-Bildern bevorzugen, bis die Redaktionsstrategie
stärker ist.

## Browser und VNC

Die Browser-Lane hat zwei Modi:

- **Headless-Automatisierung**: Standard für CI. Chrome läuft mit aktiviertem CDP, und
  Playwright oder OpenClaw-Browser-Control erfasst Screenshots.
- **VNC-Rescue**: auf derselben VM aktiviert, wenn Login, MFA, Discord-Anti-Automation
  oder visuelles Debugging einen Menschen benötigt.

Das Discord-Observer-Browserprofil sollte persistent genug sein, um
nicht bei jedem Run ein Login zu erfordern, aber von persönlichem Browser-State isoliert sein. Ein Profil
gehört zum Mantis-Maschinenpool, nicht zu einem Entwickler-Laptop.

Wenn Mantis hängen bleibt, postet es eine Discord-Statusmeldung mit:

- Run-ID
- Szenario-ID
- Maschinen-Provider
- Artefaktverzeichnis
- VNC- oder noVNC-Verbindungsanweisungen, falls verfügbar
- kurzer Blocker-Text

Die erste private Bereitstellung kann diese Nachrichten im bestehenden Operator-
Kanal posten und später in einen dedizierten Mantis-Kanal wechseln.

## Maschinen

Mantis sollte für die erste Remote-Implementierung AWS über Crabbox bevorzugen.
Crabbox stellt uns vorgewärmte Maschinen, Lease-Tracking, Hydration, Logs,
Ergebnisse und Bereinigung bereit. Wenn AWS-Kapazität zu langsam oder nicht
verfügbar ist, fügen Sie einen Hetzner-Provider hinter derselben
Maschinenschnittstelle hinzu.

Mindestanforderungen an die VM:

- Linux mit einer desktopfähigen Chrome- oder Chromium-Installation
- CDP-Zugriff für Browserautomatisierung
- VNC oder noVNC für Rettungszugriff
- Node 22 und pnpm
- OpenClaw-Checkout und Dependency-Cache
- Playwright-Chromium-Browser-Cache, wenn Playwright verwendet wird
- ausreichend CPU und Arbeitsspeicher für einen OpenClaw Gateway, einen Browser und einen Modelllauf
- ausgehender Zugriff auf Discord, GitHub, Modell-Provider und den Anmeldeinformations-Broker

Die VM sollte keine langlebigen Roh-Secrets außerhalb der erwarteten Speicher
für Anmeldeinformationen oder Browserprofile behalten.

## Secrets

Secrets befinden sich für Remote-Läufe in GitHub-Organisations- oder Repository-
Secrets und für lokale Läufe in einer lokalen, vom Operator kontrollierten
Secret-Datei.

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

Langfristig sollte der Convex-Anmeldeinformationspool die normale Quelle für
Live-Transport-Anmeldeinformationen bleiben. GitHub-Secrets bootstrappen den
Broker und Fallback-Lanes. Der Discord-Status-Reactions-Workflow ordnet die
Mantis-Crabbox-Secrets wieder den Umgebungsvariablen `CRABBOX_COORDINATOR` und
`CRABBOX_COORDINATOR_TOKEN` zu, die die Crabbox CLI erwartet. Die einfachen
GitHub-Secret-Namen `CRABBOX_*` bleiben als Kompatibilitäts-Fallback akzeptiert.

Der Mantis-Runner darf Folgendes niemals ausgeben:

- Discord-Bot-Tokens
- Provider-API-Schlüssel
- Browser-Cookies
- Inhalte von Auth-Profilen
- VNC-Passwörter
- rohe Anmeldeinformations-Payloads

Öffentliche Artefakt-Uploads sollten auch Discord-Zielmetadaten wie Bot-,
Guild-, Kanal- und Nachrichten-IDs redigieren. Der GitHub-Smoke-Workflow
aktiviert aus diesem Grund `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Wenn ein Token versehentlich in ein Issue, einen PR, einen Chat oder ein Log
eingefügt wird, rotieren Sie es, nachdem das neue Secret gespeichert wurde.

## GitHub-Artefakte und PR-Kommentare

Mantis-Workflows sollten das vollständige Evidenz-Bundle als kurzlebiges
Actions-Artefakt hochladen. Wenn der Workflow für einen Fehlerbericht oder
Fix-PR ausgeführt wird, sollte er außerdem die redigierten PNG-Screenshots im
Branch `qa-artifacts` veröffentlichen und einen Kommentar mit eingebetteten
Vorher/Nachher-Screenshots in diesem Fehler oder Fix-PR einfügen oder
aktualisieren. Posten Sie den primären Nachweis nicht nur in einem generischen
QA-Automatisierungs-PR. Rohe Logs, beobachtete Nachrichten und andere
umfangreiche Evidenz bleiben im Actions-Artefakt.

Produktions-Workflows sollten diese Kommentare mit der Mantis-GitHub-App posten,
nicht mit `github-actions[bot]`. Speichern Sie die App-ID und den privaten
Schlüssel als GitHub-Actions-Secrets `MANTIS_GITHUB_APP_ID` und
`MANTIS_GITHUB_APP_PRIVATE_KEY`. Der Workflow verwendet einen verborgenen Marker
als Upsert-Schlüssel, aktualisiert diesen Kommentar, wenn das Token ihn
bearbeiten kann, und erstellt einen neuen Mantis-eigenen Kommentar, wenn ein
älterer, Bot-eigener Marker nicht bearbeitet werden kann.

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
Kommentar dies sagen, anstatt zu implizieren, dass der Kandidat fehlgeschlagen
ist.

## Hinweise zur privaten Bereitstellung

Eine private Bereitstellung hat möglicherweise bereits eine Mantis-Discord-
Anwendung. Verwenden Sie diese Anwendung wieder, anstatt eine weitere App zu
erstellen, wenn sie die richtigen Bot-Berechtigungen hat und sicher rotiert
werden kann.

Legen Sie den anfänglichen Operator-Benachrichtigungskanal über Secrets oder die
Bereitstellungskonfiguration fest. Er kann zunächst auf einen bestehenden
Maintainer- oder Operations-Kanal zeigen und später in einen dedizierten
Mantis-Kanal wechseln, sobald einer existiert.

Schreiben Sie keine Guild-IDs, Kanal-IDs, Bot-Tokens, Browser-Cookies oder
VNC-Passwörter in dieses Dokument. Speichern Sie sie in GitHub-Secrets, im
Anmeldeinformations-Broker oder im lokalen Secret-Speicher des Operators.

## Ein Szenario hinzufügen

Ein Mantis-Szenario sollte deklarieren:

- ID und Titel
- Transport
- erforderliche Anmeldeinformationen
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
- E-Mail-Nachrichten-IDs und -Header für E-Mail-Fehler
- Browser-Screenshots, wenn die UI die einzige zuverlässige Beobachtungsquelle ist

Vision-Prüfungen sollten additiv sein. Wenn eine Plattform-API den Fehler
nachweisen kann, verwenden Sie die API als Bestehen/Fehlschlagen-Orakel und
behalten Sie Screenshots für menschliches Vertrauen bei.

## Provider-Erweiterung

Nach Discord kann derselbe Runner Folgendes hinzufügen:

- Slack: Reaktionen, Threads, App-Erwähnungen, Modals, Datei-Uploads.
- E-Mail: Gmail-Authentifizierung und Nachrichten-Threading mit `gog`, wenn Connectors nicht
  ausreichen.
- WhatsApp: QR-Login, erneute Identifizierung, Nachrichtenzustellung, Medien, Reaktionen.
- Telegram: Gating für Gruppenerwähnungen, Befehle, Reaktionen, sofern verfügbar.
- Matrix: verschlüsselte Räume, Thread- oder Antwortbeziehungen, Wiederaufnahme nach Neustart.

Jeder Transport sollte ein günstiges Smoke-Szenario und ein oder mehrere
Fehlerklassen-Szenarien haben. Teure visuelle Szenarien sollten Opt-in bleiben.

## Offene Fragen

- Welcher Discord-Bot sollte der Driver sein und welcher der SUT, wenn der
  bestehende Mantis-Bot wiederverwendet wird?
- Sollte die Observer-Browser-Anmeldung in der ersten Phase ein menschliches
  Discord-Konto, ein Testkonto oder nur bot-lesbare REST-Evidenz verwenden?
- Wie lange sollte GitHub Mantis-Artefakte für PRs aufbewahren?
- Wann sollte ClawSweeper automatisch Mantis empfehlen, anstatt auf einen
  Maintainer-Befehl zu warten?
- Sollten Screenshots vor dem Upload für öffentliche PRs redigiert oder zugeschnitten werden?
