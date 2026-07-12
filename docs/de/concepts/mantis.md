---
read_when:
    - Erstellen oder Ausführen visueller Live-Qualitätssicherung für OpenClaw-Fehler
    - Hinzufügen einer Vorher- und Nachher-Verifizierung für einen Pull Request
    - Hinzufügen von Szenarien für Discord, Slack, WhatsApp oder andere Live-Transporte
    - Gezielter Browsernachweis für die Control UI für einen Kandidaten-Ref wird ausgeführt
    - Debugging von QA-Läufen, die Screenshots, Browserautomatisierung oder VNC-Zugriff erfordern
summary: Mantis erfasst visuelle End-to-End-Nachweise für Live-Transportvergleiche und gezielte Browser-Nachweise ausschließlich für Kandidaten und hängt die Artefakte anschließend an PRs an.
title: Mantis
x-i18n:
    generated_at: "2026-07-12T01:32:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis veröffentlicht visuelle CI-Nachweise und einen PR-Kommentar zum Verhalten von OpenClaw.
Live-Transportszenarien vergleichen eine bekanntermaßen fehlerhafte Ausgangsbasis mit einem Kandidaten-Ref;
fokussierte Browser-Lanes können stattdessen einen Kandidaten anhand eines deterministischen
simulierten Transports verifizieren. Discord wurde zuerst mit echter Bot-Authentifizierung, Guild-Kanälen,
Reaktionen, Threads und einem Browser-Zeugen ausgeliefert. Slack-, Telegram- und fokussierte Control-
UI-Chat-Lanes sind ebenfalls vorhanden; WhatsApp und Matrix sind nicht implementiert.

## Zuständigkeit

- OpenClaw (`extensions/qa-lab/src/mantis/*`): Szenario-Runtime, CLI `pnpm openclaw qa mantis <command>`, Nachweisschema.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): Live-Transport-Testumgebung, Treiber-/SUT-Bots, Bericht-/Nachweisschreiber.
- Crabbox (`openclaw/crabbox`): vorgewärmte Linux-Maschinen, Leases, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): Remote-Einstiegspunkte, Artefaktaufbewahrung.
- ClawSweeper: analysiert PR-Befehle von Maintainern, stößt Workflows an und veröffentlicht den abschließenden PR-Kommentar.

## CLI-Befehle

Alle Befehle haben die Form `pnpm openclaw qa mantis <command>` und sind in
`extensions/qa-lab/src/mantis/cli.ts` definiert. Erfordert `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
zur Build-/Laufzeit (gebündelte Workflows setzen vor dem Build
`OPENCLAW_BUILD_PRIVATE_QA=1` und `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`).

| Befehl                          | Zweck                                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Überprüft, ob der Mantis-Discord-Bot die Guild und den Kanal sehen, Beiträge veröffentlichen und reagieren kann.                                          |
| `run`                           | Führt ein Vorher-/Nachher-Szenario für Ausgangsbasis- und Kandidaten-Refs aus (nur Discord).                                                               |
| `desktop-browser-smoke`         | Least einen Crabbox-Desktop oder verwendet ihn erneut, öffnet einen sichtbaren Browser und erstellt Screenshot und Video.                                 |
| `slack-desktop-smoke`           | Least einen Crabbox-Desktop oder verwendet ihn erneut, führt darin Slack-QA aus, öffnet Slack Web und erfasst Nachweise.                                   |
| `telegram-desktop-builder`      | Least einen Crabbox-Desktop oder verwendet ihn erneut, installiert Telegram Desktop und konfiguriert optional ein OpenClaw-Gateway.                       |
| `visual-task` / `visual-driver` | Allgemeine Crabbox-Desktop-Erfassung mit optionalen Bildverständnisprüfungen; `visual-driver` ist die Treiberhälfte, die unter `crabbox record --while` gestartet wird. |

Jeder Befehl akzeptiert `--repo-root <path>` und `--output-dir <path>`; Crabbox-
Befehle akzeptieren außerdem `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` und `--keep-lease`. Die lokalen CLI-Standardwerte
für Provider/Klasse sind `hetzner`/`beast`, sofern nicht anders angegeben; CI-Workflows
überschreiben üblicherweise beide.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Ruft die Discord-REST-API (`https://discord.com/api/v10`) auf, um den Bot-
Benutzer, die Guild, die Kanäle der Guild und den Zielkanal abzurufen, prüft,
ob der Kanal zur Guild gehört, veröffentlicht dann – sofern nicht `--skip-post`
angegeben ist – eine Nachricht und fügt eine `👀`-Reaktion hinzu. Schreibt
`mantis-discord-smoke-summary.json` und `mantis-discord-smoke-report.md`.

Reihenfolge der Token-Auflösung: Wert von `--token-file`, dann `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(mit `--token-env` überschreiben), dann eine durch `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
benannte Datei (mit `--token-file-env` überschreiben). Guild-/Kanal-IDs stammen aus
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (mit
`--guild-id` / `--channel-id` überschreiben) und müssen 17- bis 20-stellige
Discord-Snowflakes sein. Setzen Sie `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`, um
Bot-/Guild-/Kanal-/Nachrichten-IDs und Namen in der veröffentlichten Zusammenfassung
und im Bericht durch `<redacted>` zu ersetzen.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` akzeptiert derzeit nur `discord`. `--scenario` ist eine von zwei
integrierten IDs, jeweils mit eigenem Standard-Ausgangsbasis-Ref und erwarteten
Vorher-/Nachher-Bezeichnungen (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Szenario                                   | Standard-Ausgangsbasis                     | Erwartung für Ausgangsbasis               | Erwartung für Kandidat       |
| ------------------------------------------ | ------------------------------------------ | ----------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                             | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | Thread-Antwort lässt `filePath`-Anhang aus | Thread-Antwort enthält ihn   |

Der Standardwert für `--candidate` ist `HEAD`. Weitere Flags: `--credential-source`
(Standardwert `convex`), `--credential-role` (Standardwert `ci`), `--provider-mode`
(Standardwert `live-frontier`), `--fast` (standardmäßig aktiviert), `--skip-install`, `--skip-build`.

Der Runner erstellt getrennte `git worktree`-Checkouts für Ausgangsbasis und
Kandidat unter `<output-dir>/worktrees/`, führt in beiden `pnpm install`/`pnpm build`
aus (sofern nicht übersprungen) und führt anschließend
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
für jeden Worktree aus. Jede Lane schreibt `discord-qa-reaction-timelines.json`
sowie ein Paar aus `<scenario-id>-timeline.html`/`.png`; der Runner kopiert diese
Nachweise unter `baseline/`/`candidate/` zurück, schreibt `comparison.json`,
`mantis-report.md` und `mantis-evidence.json` in das Ausgabeverzeichnis und
beendet sich mit einem von null verschiedenen Statuscode, wenn der Vergleich
nicht bestanden wurde (Ausgangsbasis `fail` und Kandidat `pass`).

Das zweite Discord-Szenario (`discord-thread-reply-filepath-attachment`) veröffentlicht
mit dem Treiber-Bot eine übergeordnete Nachricht, erstellt einen echten Thread, ruft
die Aktion `message.thread-reply` des SUT mit einem Repository-lokalen `filePath` auf
und fragt anschließend den Thread wiederholt nach der Antwort und dem Dateinamen des
Anhangs ab. Erwartet wird ein Anhang namens `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Least einen Crabbox-Desktop oder verwendet ihn erneut, startet innerhalb der
VNC-Sitzung einen Browser, der auf `--browser-url` (Standardwert
`https://openclaw.ai`) oder eine gerenderte `--html-file` verweist, wartet, erstellt
mit `scrot` einen Screenshot, zeichnet optional mit `ffmpeg` eine MP4-Datei auf
und synchronisiert `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
per rsync zurück nach `--output-dir`.

Flags:

- `--lease-id <cbx_...>` verwendet einen vorgewärmten Desktop erneut, anstatt einen neuen zu erstellen.
- `--browser-profile-dir <remote-path>` verwendet ein entferntes Chrome-Benutzerdatenverzeichnis erneut, sodass ein persistenter Desktop zwischen Ausführungen angemeldet bleibt (wird für ein langlebiges Discord-Web-Betrachterprofil verwendet).
- `--browser-profile-archive-env <name>` stellt vor dem Start ein Base64-kodiertes `.tgz`-Archiv eines Chrome-Profils aus dieser Umgebungsvariable wieder her (Standardwert `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); wird für angemeldete Zeugen wie Discord Web verwendet.
- `--video-duration <seconds>` steuert die Länge der MP4-Aufzeichnung (Standardwert 10 Sekunden).
- `--keep-lease` (oder `OPENCLAW_MANTIS_KEEP_VM=1`) hält eine in dieser Ausführung erstellte Lease für die VNC-Inspektion offen; fehlgeschlagene Ausführungen, die eine Lease erstellt haben, behalten sie standardmäßig ebenfalls bei.

Für Discord-Web-Nachweise verwendet Mantis ein dediziertes Betrachterkonto und
kein Bot-Token. Das Discord-REST-Orakel (über `qa discord`) bleibt maßgeblich; wenn
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` gesetzt ist, schreibt das Szenario
außerdem ein Discord-Web-URL-Artefakt, und `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`
lässt den Thread lange genug geöffnet, damit der Browser ihn öffnen kann.

Der GitHub-Workflow bevorzugt ein persistentes Betrachterprofil über
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (vollständige Profilarchive können
die Größenbeschränkung für GitHub-Secrets überschreiten); für kleine/Bootstrap-
Profile kann er stattdessen eine Base64-kodierte `.tgz`-Datei aus
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` wiederherstellen. Wenn keine
der beiden Quellen konfiguriert ist, veröffentlicht der Workflow dennoch die
deterministischen Screenshots von Ausgangsbasis und Kandidat und protokolliert,
dass der angemeldete Zeuge übersprungen wurde.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Least einen Crabbox-Desktop oder verwendet ihn erneut, synchronisiert den Checkout
in die VM, führt darin `pnpm openclaw qa slack` aus, öffnet Slack Web im VNC-Browser,
erfasst den Desktop und kopiert sowohl die Slack-QA-Artefakte (`slack-qa/`) als auch
den VNC-Screenshot bzw. das VNC-Video zurück in die lokale Umgebung. Dies ist die
einzige Mantis-Variante, bei der sowohl das SUT-Gateway als auch der Browser in
derselben VM ausgeführt werden.

Mit `--gateway-setup` erstellt der Befehl in der VM unter
`$HOME/.openclaw-mantis/slack-openclaw` ein persistentes, entsorgbares OpenClaw-
Home-Verzeichnis, passt die Slack-Socket-Mode-Konfiguration für den Zielkanal an,
startet `openclaw gateway run --dev --allow-unconfigured --port 38973` und lässt
Chrome in der VNC-Sitzung weiterlaufen; ohne `--gateway-setup` wird stattdessen
die normale Bot-zu-Bot-Slack-QA-Lane ausgeführt.

Erforderliche Umgebungsvariablen für `--credential-source env` (lokaler Standardwert
ist `env`; Standardrolle ist `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` für die Remote-Modell-Lane (wenn lokal nur `OPENAI_API_KEY`
  gesetzt ist, kopiert Mantis sie vor dem Aufruf von Crabbox nach
  `OPENCLAW_LIVE_OPENAI_KEY`)

Mit `--credential-source convex` least Mantis die Slack-SUT-Anmeldedaten vor dem
Erstellen der VM aus dem gemeinsamen Pool und leitet Kanal-ID, App-Token und
Bot-Token als `OPENCLAW_MANTIS_SLACK_*`-Umgebungsvariablen in die VM weiter, sodass
GitHub-Workflows nur das Convex-Broker-Secret und keine unverarbeiteten Slack-Token
benötigen.

Weitere Flags: `--slack-url <url>` öffnet eine bestimmte URL (andernfalls leitet Mantis
`https://app.slack.com/client/<team>/<channel>` aus `auth.test` ab);
`--slack-channel-id <id>` legt den Gateway-Kanal auf der Zulassungsliste fest;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` steuert das persistente Chrome-Profil
innerhalb der VM (Standardwert `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` führt die nativen Slack-Genehmigungsszenarien
(`slack-approval-exec-native`, `slack-approval-plugin-native`) aus und rendert
Screenshots ausstehender/abgeschlossener Prüfpunkte anstelle der Gateway-Einrichtung
(schließt sich gegenseitig mit `--gateway-setup` aus); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` und `--fast` werden an die Slack-Live-Lane
durchgereicht.

Screenshots der Genehmigungsprüfpunkte werden aus der vom Szenario beobachteten
Slack-API-Nachricht gerendert, nicht aus der Live-Slack-Benutzeroberfläche;
`slack-desktop-smoke.png` dient nur dann als Nachweis für Slack Web selbst, wenn
das Browserprofil der Lease bereits angemeldet war.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Least einen Crabbox-Desktop oder verwendet ihn erneut, installiert die native Linux-Version von Telegram Desktop,
stellt optional ein Benutzersitzungsarchiv wieder her, konfiguriert OpenClaw mit dem
Bot-Token des geleasten Telegram-Testsystems, startet
`openclaw gateway run --dev --allow-unconfigured --port 38974`, sendet eine
Bereitschaftsmeldung des Treiber-Bots an die geleaste private Gruppe und erstellt anschließend einen
Screenshot und eine MP4-Datei. Ein Bot-Token konfiguriert ausschließlich OpenClaw; er meldet
Telegram Desktop niemals an. Die Desktop-Ansicht ist eine separate Telegram-Benutzersitzung,
die aus `--telegram-profile-archive-env <name>` wiederhergestellt oder manuell
über VNC angemeldet und mit `--keep-lease` aktiv gehalten wird.

Flags: `--lease-id <cbx_...>` führt den Vorgang erneut auf einer VM aus, die bereits bei
Telegram Desktop angemeldet ist; `--telegram-profile-archive-env <name>` stellt vor dem Start ein base64-kodiertes
`.tgz`-Profilarchiv wieder her; `--telegram-profile-dir <remote-path>`
legt das entfernte Profilverzeichnis fest (Standard: `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` installiert und öffnet ausschließlich Telegram Desktop;
`--credential-source`/`--credential-role` verwenden standardmäßig `convex`/`maintainer`.

## Evidenzmanifest

Jedes Szenario, das in einem PR veröffentlicht, schreibt neben
seinen Bericht eine Datei namens `mantis-evidence.json`:

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

Der `path` eines Artefakts ist relativ zum Verzeichnis des Manifests; `targetPath` ist
relativ zum konfigurierten R2-/S3-Artefaktpräfix. `scripts/mantis/publish-pr-evidence.mjs`
weist Pfadtraversierungen zurück und überspringt Einträge mit `"required": false`, wenn die
Datei fehlt.

Artefaktarten: `timeline` (deterministischer Vorher-/Nachher-Screenshot),
`desktopScreenshot` (VNC-/Browser-Screenshot), `motionPreview` (inline dargestelltes animiertes
GIF aus der Aufzeichnung), `motionClip` (auf Bewegungsphasen gekürzte MP4-Datei), `fullVideo` (vollständige
Aufzeichnung), `metadata` (JSON-/Protokoll-Begleitdatei), `report` (Markdown-Bericht).

Artefaktstruktur eines Durchlaufs auf dem Datenträger:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Screenshots sind Evidenz, keine Geheimnisse, erfordern jedoch weiterhin eine sorgfältige Schwärzung:
Private Kanalnamen, Benutzernamen oder Nachrichteninhalte können sichtbar sein. Setzen Sie
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` für öffentliche Artefakt-Uploads; dies ist
in den GitHub-Workflows für Discord, Slack und Telegram standardmäßig aktiviert.

## GitHub-Automatisierung

`scripts/mantis/publish-pr-evidence.mjs` ist das wiederverwendbare Veröffentlichungsprogramm. Workflows
rufen es mit dem Manifest, dem Ziel-PR, dem Stammverzeichnis des Artefaktziels, der Kommentarmarkierung,
der Artefakt-URL, der Durchlauf-URL und der Anfragequelle auf. Es lädt die deklarierten Artefakte in
den Mantis-R2-Bucket hoch, erstellt einen PR-Kommentar mit vorangestellter Zusammenfassung, inline dargestellten
Bildern/Vorschauen und verlinkten Videos und aktualisiert anschließend den vorhandenen markierten Kommentar oder
erstellt einen neuen. Erforderliche Umgebungsvariablen:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (Workflows setzen `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (Workflows setzen `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (Workflows setzen `https://artifacts.openclaw.ai`)

Kommentare werden über die Mantis-GitHub-App (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`) und nicht über `github-actions[bot]` veröffentlicht, wobei ein verborgener
Markierungskommentar als Schlüssel für das Einfügen oder Aktualisieren dient.

| Workflow                          | Auslöser                                                                                    | Funktion                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | manuelle Ausführung                                                                            | Führt `discord-smoke` für eine ausgewählte Referenz aus.                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | PR-Kommentar oder manuelle Ausführung                                                              | Erstellt separate Baseline-/Kandidaten-Worktrees, führt `discord-status-reactions-tool-only` in jedem aus, rendert die Zeitleiste jeder Spur in einem Crabbox-Desktop-Browser, erzeugt mit `crabbox media preview` auf Bewegungsphasen gekürzte GIF-/MP4-Vorschauen, lädt Artefakte hoch und veröffentlicht die PR-Evidenz inline.                                 |
| `Mantis Scenario`                 | manuelle Ausführung                                                                            | Generischer Dispatcher: Übernimmt `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` und leitet sie an den passenden Szenario-Workflow weiter. |
| `Mantis Slack Desktop Smoke`      | manuelle Ausführung                                                                            | Least einen Crabbox-Linux-Desktop (standardmäßig `aws`, alternativ `hetzner`), führt `slack-desktop-smoke --gateway-setup` für den Kandidaten aus, zeichnet den Desktop auf, erzeugt eine Bewegungsvorschau, lädt Artefakte hoch und veröffentlicht PR-Evidenz, wenn eine PR-Nummer angegeben wurde.                                                      |
| `Mantis Telegram Live`            | PR-Kommentar oder manuelle Ausführung                                                              | Führt die Telegram-Live-QA-Spur für die Bot-API (`openclaw qa telegram`) aus, schreibt anhand der QA-Zusammenfassung `mantis-evidence.json`, rendert geschwärztes Evidenz-HTML in einem Crabbox-Desktop-Browser, erzeugt ein animiertes GIF und veröffentlicht die PR-Evidenz. Für diese Spur ist keine Anmeldung bei Telegram Web erforderlich.                               |
| `Mantis Telegram Desktop Proof`   | Maintainer-PR-Label (`mantis: telegram-visible-proof`) plus PR-Kommentar oder manuelle Ausführung | Agentischer Vorher-/Nachher-Nachweis mit der nativen Telegram-Desktop-Anwendung. Übergibt den PR, die Baseline-/Kandidatenreferenzen und die Maintainer-Anweisungen an Codex, das die Crabbox-Nachweisspur für Telegram Desktop mit einem echten Benutzer für beide Referenzen ausführt und eine zweispaltige PR-Evidenztabelle veröffentlicht.                                                              |
| `Mantis Web UI Chat Proof`        | PR-Kommentar oder manuelle Ausführung                                                              | Führt den fokussierten Playwright-Nachweis für den Chat der OpenClaw Control UI für den Kandidaten aus, prüft, dass der Browser über das simulierte Gateway sendet, erfasst Screenshot-/Videoartefakte und veröffentlicht die PR-Evidenz. Diese Spur dient ausschließlich dem Nachweis des Webchats, nicht WinUI-/nativen Anwendungen oder beliebigen visuellen Nachweisen.                           |

`Mantis Discord Status Reactions` und `Mantis Telegram Live` akzeptieren beide
`baseline_ref`/`candidate_ref` (oder `baseline=`/`candidate=` in einem PR-Kommentar)
und prüfen vor der Ausführung mit geheimnistragenden Anmeldedaten, dass der aufgelöste SHA entweder ein Vorgänger von `origin/main`,
ein Release-Tag (`v*`) oder der Head eines offenen PRs ist.

Kommentarauslöser aus einem PR mit Schreib-, Maintainer- oder Administratorzugriff:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram-Kommentarauslöser verwenden standardmäßig den Head-SHA des PRs als Kandidaten und
`telegram-status-command` als Szenario; sie akzeptieren `provider=aws|hetzner` und
`lease=<cbx_...>`, um einen bestimmten Crabbox-Provider oder einen vorgewärmten
Desktop auszuwählen. `Mantis Telegram Desktop Proof` reagiert nur dann auf einen PR-Kommentar, wenn
der PR bereits das Label `mantis: telegram-visible-proof` trägt.

Kommentarauslöser für den Web-UI-Chat verwenden standardmäßig den Head-SHA des PRs als Kandidaten. Sie führen
den Chat-Nachweis der Control UI mit simuliertem Gateway aus und veröffentlichen Browserartefakte; verwenden Sie
für andere Webseiten und Oberflächen nativer Anwendungen normale Playwright-/Browser-Nachweise, Maintainer-Screenshots, Crabbox oder lokale
Artefakte.

ClawSweeper kann ein Szenario auch direkt auslösen:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Maschinen und Geheimnisse

Die lokalen CLI-Standardwerte für Crabbox sind `--provider hetzner --class beast`; überschreiben Sie
sie mit `--provider`, `--class`/`--machine-class` oder
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. GitHub-
Workflows überschreiben häufig beide Werte (beispielsweise mit `--class standard` und der
Provider-Auswahl `aws`/`hetzner` im Slack-Workflow). Wenn ein Provider zu
langsam oder nicht verfügbar ist, fügen Sie ihn hinter derselben Crabbox-Schnittstelle hinzu, statt
einen Fallback fest zu codieren.

VM-Basisanforderungen: Linux mit desktopfähigem Chrome/Chromium, CDP-Zugriff, VNC/
noVNC, Node 22+ und pnpm, einem OpenClaw-Checkout sowie ausgehendem Zugriff auf den
Zieltransport, GitHub, Modell-Provider und den Broker für Anmeldedaten.

In den Mantis-Workflows verwendete Geheimnisnamen:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` für öffentliche Artefakt-Uploads
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (Workflows akzeptieren außerdem
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` als Fallback und ordnen
  sie vor dem Aufruf von Crabbox den einfachen Namen zu)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Der Mantis-Runner darf niemals Discord-/Slack-/Telegram-Bot-Tokens,
API-Schlüssel von Providern, Browser-Cookies, Inhalte von Authentifizierungsprofilen, VNC-Passwörter oder
unverarbeitete Nutzdaten für Anmeldedaten ausgeben. Wenn ein Token in ein Issue, einen PR, einen Chat oder ein Protokoll gelangt,
rotieren Sie ihn, nachdem das Ersatzgeheimnis gespeichert wurde.

## Durchlaufergebnisse

Vorher-/Nachher-Transportszenarien unterscheiden diese Ergebnisse, damit eine instabile
Umgebung nicht als Produktregression erscheint:

- **Fehler reproduziert**: Die Baseline ist auf die vom Szenario erwartete Weise fehlgeschlagen.
- **Fehler des Testsystems**: Umgebungseinrichtung, Anmeldedaten, Transport-API, Browser
  oder Provider sind fehlgeschlagen, bevor das Prüfkriterium aussagekräftig war.

Ein reiner Browser-Nachweis für den Kandidaten meldet, ob der Kandidat die Prüfungen des simulierten
Gateways und der sichtbaren Benutzeroberfläche bestanden hat; er beansprucht nicht, die Baseline reproduziert zu haben.

## Szenario hinzufügen

Live-Transportszenarien werden pro Transport in TypeScript definiert (siehe
`MANTIS_SCENARIO_CONFIGS` in `extensions/qa-lab/src/mantis/run.runtime.ts` für
die Vorher-/Nachher-Struktur von Discord), nicht in einem eigenständigen deklarativen Dateiformat.
Jedes Szenario benötigt: ID und Titel, Transport, erforderliche Anmeldedaten, Richtlinie für die Baseline-Referenz,
Richtlinie für die Kandidatenreferenz, OpenClaw-Konfigurationspatch, Einrichtungs-/Stimulationsschritte,
erwartetes Prüfkriterium für Baseline und Kandidat, Ziele der visuellen Erfassung, Zeitüberschreitungsbudget
und Bereinigungsschritte.

Fokussierte, ausschließlich kandidatenbezogene Browser-Nachweise können einen dedizierten deterministischen E2E-Test und Workflow verwenden. Halten Sie dessen Umfang explizit fest, validieren Sie die Kandidaten-Referenz vor der Ausführung, isolieren Sie die durch Secrets gestützte Veröffentlichung und geben Sie denselben Vertrag für das Nachweismanifest aus.

Bevorzugen Sie kleine, typisierte Orakel gegenüber visuellen Prüfungen: den Status von Discord-Reaktionen oder Nachrichtenreferenzen, den Slack-Thread-`ts`/Reaktionsstatus der API sowie E-Mail-Nachrichten-IDs und -Header. Verwenden Sie Browser-Screenshots, wenn die Benutzeroberfläche die einzige zuverlässige Beobachtungsmöglichkeit ist, und setzen Sie visuelle Prüfungen ergänzend zu einem Orakel der Plattform-API ein, sofern eines vorhanden ist.

Nach Discord, Slack und Telegram lässt sich dieselbe Runner-Struktur auf WhatsApp (QR-Anmeldung, erneute Identifizierung, Zustellung, Medien, Reaktionen) und Matrix (verschlüsselte Räume, Thread-/Antwortbeziehungen, Wiederaufnahme nach einem Neustart) erweitern; beides ist noch nicht implementiert.

## Offene Fragen

- Welcher Discord-Bot sollte als Treiber und welcher als SUT dienen, wenn der vorhandene Mantis-Bot wiederverwendet wird?
- Wie lange sollte GitHub Mantis-Artefakte für PRs aufbewahren?
- Wann sollte ClawSweeper automatisch ein Mantis-Szenario empfehlen, statt auf einen Maintainer-Befehl zu warten?
- Sollten Screenshots vor dem Hochladen für öffentliche PRs unkenntlich gemacht oder zugeschnitten werden?
