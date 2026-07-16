---
read_when:
    - Live-Visual-QA für OpenClaw-Fehler erstellen oder ausführen
    - Hinzufügen einer Vorher- und Nachher-Verifizierung für einen Pull Request
    - Discord-, Slack-, WhatsApp- oder andere Live-Transport-Szenarien hinzufügen
    - Gezielter Browsernachweis für die Control UI für eine Kandidaten-Ref wird ausgeführt
    - Debugging von QA-Läufen, die Screenshots, Browserautomatisierung oder VNC-Zugriff erfordern
summary: Mantis erfasst visuelle End-to-End-Nachweise für Live-Transportvergleiche und gezielte Browser-Nachweise ausschließlich für Kandidaten und hängt die Artefakte anschließend an PRs an.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T12:40:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis veröffentlicht visuelle CI-Nachweise und einen PR-Kommentar zum Verhalten von OpenClaw.
Live-Transportszenarien vergleichen eine bekanntermaßen fehlerhafte Baseline mit einem Kandidaten-Ref;
fokussierte Browser-Lanes können stattdessen einen Kandidaten anhand eines deterministischen
gemockten Transports prüfen. Discord wurde zuerst mit echter Bot-Authentifizierung, Guild-Kanälen,
Reaktionen, Threads und einem Browser-Zeugen ausgeliefert. Slack, Telegram und fokussierte Control-
UI-Chat-Lanes sind ebenfalls vorhanden; WhatsApp und Matrix sind nicht implementiert.

## Zuständigkeit

- OpenClaw (`extensions/qa-lab/src/mantis/*`): Szenario-Runtime, `pnpm openclaw qa mantis <command>`-CLI, Nachweisschema.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): Live-Transport-Harness, Treiber-/SUT-Bots, Berichts-/Nachweis-Writer.
- Crabbox (`openclaw/crabbox`): vorgewärmte Linux-Maschinen, Leases, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): Remote-Einstiegspunkte, Aufbewahrung von Artefakten.
- ClawSweeper: parst Maintainer-PR-Befehle, startet Workflows und veröffentlicht den abschließenden PR-Kommentar.

## CLI-Befehle

Alle Befehle sind `pnpm openclaw qa mantis <command>`, definiert in
`extensions/qa-lab/src/mantis/cli.ts`. Erfordert `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
zur Build-/Laufzeit (gebündelte Workflows setzen vor dem Build
`OPENCLAW_BUILD_PRIVATE_QA=1` und `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`).

| Befehl                          | Zweck                                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Prüft, ob der Mantis-Discord-Bot die Guild/den Kanal sehen, Beiträge veröffentlichen und reagieren kann.                                                   |
| `run`                           | Führt ein Vorher-/Nachher-Szenario für Baseline- und Kandidaten-Refs aus (nur Discord).                                                                    |
| `desktop-browser-smoke`         | Least/verwendet einen Crabbox-Desktop erneut, öffnet einen sichtbaren Browser und erfasst Screenshot und Video.                                             |
| `slack-desktop-smoke`           | Least/verwendet einen Crabbox-Desktop erneut, führt darin Slack-QA aus, öffnet Slack Web und erfasst Nachweise.                                             |
| `telegram-desktop-builder`      | Least/verwendet einen Crabbox-Desktop erneut, installiert Telegram Desktop und konfiguriert optional ein OpenClaw-Gateway.                                 |
| `visual-task` / `visual-driver` | Generische Crabbox-Desktop-Erfassung mit optionalen Assertions zur Bildauswertung; `visual-driver` ist die unter `crabbox record --while` gestartete Treiberhälfte. |

Jeder Befehl akzeptiert `--repo-root <path>` und `--output-dir <path>`; Crabbox-
Befehle akzeptieren außerdem `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` und `--keep-lease`. Die lokalen CLI-Standardwerte
für Provider/Klasse sind `hetzner`/`beast`, sofern nicht anders angegeben; CI-Workflows
überschreiben normalerweise beide.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Ruft die Discord-REST-API (`https://discord.com/api/v10`) auf, um den Bot-
Benutzer, die Guild, die Kanäle der Guild und den Zielkanal abzurufen, prüft,
ob der Kanal zur Guild gehört, veröffentlicht dann (sofern nicht `--skip-post`) eine Nachricht und
fügt eine `👀`-Reaktion hinzu. Schreibt `mantis-discord-smoke-summary.json` und
`mantis-discord-smoke-report.md`.

Reihenfolge der Token-Auflösung: Wert von `--token-file`, dann `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(überschreibbar mit `--token-env`), anschließend eine durch `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE` benannte Datei
(überschreibbar mit `--token-file-env`). Guild-/Kanal-IDs stammen aus
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (überschreibbar mit
`--guild-id` / `--channel-id`) und müssen 17- bis 20-stellige Discord-Snowflakes sein. Setzen Sie
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`, um Bot-/Guild-/Kanal-/Nachrichten-IDs
und Namen in der veröffentlichten Zusammenfassung und im Bericht durch `<redacted>` zu ersetzen.

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
integrierten IDs, jeweils mit einem eigenen Standard-Baseline-Ref und erwarteten Vorher-/Nachher-
Labels (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Szenario                                   | Standard-Baseline                          | Baseline erwartet                        | Kandidat erwartet            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | Thread-Antwort lässt `filePath`-Anhang aus | Thread-Antwort enthält ihn   |

`--candidate` verwendet standardmäßig `HEAD`. Weitere Flags: `--credential-source`
(Standard: `convex`), `--credential-role` (Standard: `ci`), `--provider-mode`
(Standard: `live-frontier`), `--fast` (standardmäßig aktiviert), `--skip-install`, `--skip-build`.

Der Runner erstellt getrennte `git worktree`-Checkouts für Baseline und
Kandidat unter `<output-dir>/worktrees/`, führt `pnpm install`/`pnpm build` in
jedem aus (sofern nicht übersprungen) und führt anschließend
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
für jeden Worktree aus. Jede Lane schreibt `discord-qa-reaction-timelines.json`
sowie ein `<scenario-id>-timeline.html`/`.png`-Paar; der Runner kopiert diese
Nachweise unter `baseline/`/`candidate/` zurück, schreibt `comparison.json`,
`mantis-report.md` und `mantis-evidence.json` in das Ausgabeverzeichnis und
beendet sich mit einem von null verschiedenen Status, wenn der Vergleich nicht bestanden wurde (Baseline
`fail` und Kandidat `pass`).

Das zweite Discord-Szenario (`discord-thread-reply-filepath-attachment`) veröffentlicht
mit dem Treiber-Bot eine übergeordnete Nachricht, erstellt einen echten Thread, ruft die
`message.thread-reply`-Aktion des SUT mit einem Repository-lokalen `filePath` auf und fragt anschließend den
Thread nach der Antwort und dem Dateinamen des Anhangs ab. Es erwartet einen Anhang
mit dem Namen `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Least einen Crabbox-Desktop oder verwendet ihn erneut, startet innerhalb der VNC-Sitzung
einen Browser, der auf `--browser-url` (Standard: `https://openclaw.ai`) oder ein gerendertes
`--html-file` zeigt, wartet, erstellt mit `scrot` einen Screenshot, zeichnet optional mit
`ffmpeg` eine MP4-Datei auf und synchronisiert `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
per rsync zurück nach `--output-dir`.

Flags:

- `--lease-id <cbx_...>` verwendet einen vorgewärmten Desktop erneut, anstatt einen zu erstellen.
- `--browser-profile-dir <remote-path>` verwendet ein Remote-Chrome-Benutzerdatenverzeichnis erneut, damit ein persistenter Desktop zwischen Ausführungen angemeldet bleibt (wird für ein langlebiges Discord-Web-Betrachterprofil verwendet).
- `--browser-profile-archive-env <name>` stellt vor dem Start ein Base64-`.tgz`-Chrome-Profilarchiv aus dieser Umgebungsvariable wieder her (Standard: `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); wird für angemeldete Zeugen wie Discord Web verwendet.
- `--video-duration <seconds>` steuert die MP4-Aufzeichnungsdauer (Standard: 10s).
- `--keep-lease` (oder `OPENCLAW_MANTIS_KEEP_VM=1`) hält eine in dieser Ausführung erstellte Lease zur VNC-Inspektion offen; fehlgeschlagene Ausführungen, die eine Lease erstellt haben, halten sie standardmäßig ebenfalls offen.

Für Discord-Web-Nachweise verwendet Mantis ein dediziertes Betrachterkonto und kein Bot-
Token. Das Discord-REST-Orakel (über `qa discord`) bleibt maßgeblich; wenn
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` gesetzt ist, schreibt das Szenario außerdem ein
Discord-Web-URL-Artefakt, und `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` hält den
Thread lange genug offen, damit der Browser ihn öffnen kann.

Der GitHub-Workflow bevorzugt ein persistentes Betrachterprofil über
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (vollständige Profilarchive können
die Größenbeschränkung für GitHub-Secrets überschreiten); für kleine/Bootstrap-Profile kann er stattdessen ein
Base64-`.tgz` aus `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` wiederherstellen. Wenn
keine der beiden Quellen konfiguriert ist, veröffentlicht der Workflow dennoch die deterministischen
Baseline-/Kandidaten-Screenshots und protokolliert, dass der angemeldete Zeuge
übersprungen wurde.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Least einen Crabbox-Desktop oder verwendet ihn erneut, synchronisiert den Checkout in die VM, führt
darin `pnpm openclaw qa slack` aus, öffnet Slack Web im VNC-Browser,
erfasst den Desktop und kopiert sowohl die Slack-QA-Artefakte (`slack-qa/`) als auch
den VNC-Screenshot/das VNC-Video lokal zurück. Dies ist die einzige Mantis-Form, bei der das
SUT-Gateway und der Browser beide in derselben VM ausgeführt werden.

Mit `--gateway-setup` erstellt der Befehl ein persistentes, entsorgbares OpenClaw-
Home unter `$HOME/.openclaw-mantis/slack-openclaw` in der VM, passt die Slack-
Socket-Mode-Konfiguration für den Zielkanal an, startet
`openclaw gateway run --dev --allow-unconfigured --port 38973` und lässt
Chrome in der VNC-Sitzung laufen; ohne `--gateway-setup` wird stattdessen die normale
Bot-zu-Bot-Slack-QA-Lane ausgeführt.

Erforderliche Umgebungsvariablen für `--credential-source env` (lokaler Standard: `env`; Rollen-
standard: `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` für die Remote-Modell-Lane (wenn lokal nur `OPENAI_API_KEY`
  gesetzt ist, kopiert Mantis sie nach `OPENCLAW_LIVE_OPENAI_KEY`, bevor
  Crabbox aufgerufen wird)

Mit `--credential-source convex` least Mantis die Slack-SUT-Anmeldedaten aus
dem gemeinsamen Pool, bevor die VM erstellt wird, und leitet Kanal-ID, App-Token und
Bot-Token als `OPENCLAW_MANTIS_SLACK_*`-Umgebungsvariablen in die VM weiter, sodass GitHub-
Workflows nur das Convex-Broker-Secret und keine rohen Slack-Tokens benötigen.

Weitere Flags: `--slack-url <url>` öffnet eine bestimmte URL (andernfalls leitet Mantis
`https://app.slack.com/client/<team>/<channel>` aus `auth.test` ab);
`--slack-channel-id <id>` legt den Kanal der Gateway-Zulassungsliste fest;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` steuert das persistente Chrome-
Profil innerhalb der VM (Standard: `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` führt die nativen Slack-Genehmigungsszenarien
(`slack-approval-exec-native`, `slack-approval-plugin-native`) aus und rendert
Screenshots ausstehender/abgeschlossener Checkpoints anstelle der Gateway-Einrichtung (schließt sich
gegenseitig mit `--gateway-setup` aus); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` und `--fast` werden an die
Slack-Live-Lane weitergegeben.

Screenshots der Genehmigungs-Checkpoints werden aus der vom Szenario beobachteten Slack-API-Nachricht
gerendert, nicht aus der Live-Slack-Benutzeroberfläche; `slack-desktop-smoke.png` ist nur ein
Nachweis für Slack Web selbst, wenn das Browserprofil der Lease bereits angemeldet
war.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Least einen Crabbox-Desktop oder verwendet ihn erneut, installiert das native Telegram Desktop für Linux,
stellt optional ein Benutzersitzungsarchiv wieder her, konfiguriert OpenClaw mit dem
geleasten Telegram-SUT-Bot-Token, startet
`openclaw gateway run --dev --allow-unconfigured --port 38974`, veröffentlicht eine
Bereitschaftsnachricht des Treiber-Bots in der geleasten privaten Gruppe und erfasst anschließend einen
Screenshot und eine MP4-Datei. Ein Bot-Token konfiguriert nur OpenClaw; es meldet
Telegram Desktop niemals an. Der Desktop-Betrachter ist eine separate Telegram-Benutzersitzung,
die aus `--telegram-profile-archive-env <name>` wiederhergestellt oder manuell
über VNC angemeldet und mit `--keep-lease` aktiv gehalten wird.

Flags: `--lease-id <cbx_...>` führt den Vorgang erneut für eine VM aus, die bereits bei
Telegram Desktop angemeldet ist; `--telegram-profile-archive-env <name>` stellt vor dem Start ein Base64-
`.tgz`-Profilarchiv wieder her; `--telegram-profile-dir <remote-path>`
legt das Remote-Profilverzeichnis fest (Standard: `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` installiert und öffnet nur Telegram Desktop;
`--credential-source`/`--credential-role` verwenden standardmäßig `convex`/`maintainer`.

## Nachweismanifest

Jedes Szenario, das in einem PR veröffentlicht wird, schreibt `mantis-evidence.json` neben
seinen Bericht:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis-QA für Discord-Statusreaktionen",
  "summary": "Menschenlesbare Zusammenfassung am Anfang des PR-Kommentars.",
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
      "label": "Baseline nur mit Warteschlangenstatus",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Discord-Zeitleiste der Baseline",
      "width": 420
    }
  ]
}
```

Artefakt-`path` ist relativ zum Verzeichnis des Manifests; `targetPath` ist
relativ zum konfigurierten R2-/S3-Artefaktpräfix. `scripts/mantis/publish-pr-evidence.mjs`
weist Pfadtraversierung zurück und überspringt Einträge mit `"required": false`, wenn die
Datei fehlt.

Artefaktarten: `timeline` (deterministischer Vorher-/Nachher-Screenshot),
`desktopScreenshot` (VNC-/Browser-Screenshot), `motionPreview` (direkt eingebettetes animiertes
GIF aus der Aufzeichnung), `motionClip` (auf Bewegung zugeschnittenes MP4), `fullVideo` (vollständige
Aufzeichnung), `metadata` (JSON-/Log-Begleitdatei), `report` (Markdown-Bericht).

Artefaktstruktur eines Laufs auf dem Datenträger:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Screenshots sind Nachweise, keine Secrets, erfordern aber dennoch sorgfältige Schwärzung:
Private Kanalnamen, Benutzernamen oder Nachrichteninhalte können sichtbar sein. Setzen Sie
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` für öffentliche Artefakt-Uploads; dies ist
in den GitHub-Workflows für Discord/Slack/Telegram standardmäßig aktiviert.

## GitHub-Automatisierung

`scripts/mantis/publish-pr-evidence.mjs` ist der wiederverwendbare Publisher. Workflows
rufen ihn mit dem Manifest, dem Ziel-PR, dem Stammverzeichnis des Artefaktziels, der Kommentarmarkierung,
der Artefakt-URL, der Lauf-URL und der Anfragequelle auf. Er lädt deklarierte Artefakte in
den Mantis-R2-Bucket hoch, erstellt einen PR-Kommentar mit vorangestellter Zusammenfassung sowie direkt eingebetteten
Bildern/Vorschauen und verlinkten Videos und aktualisiert anschließend den vorhandenen markierten Kommentar oder
erstellt einen neuen. Erforderliche Umgebungsvariablen:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (Workflows setzen `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (Workflows setzen `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (Workflows setzen `https://artifacts.openclaw.ai`)

Kommentare werden über die Mantis GitHub App (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`) und nicht über `github-actions[bot]` veröffentlicht, wobei ein verborgener
Markierungskommentar als Upsert-Schlüssel dient.

| Workflow                          | Auslöser                                                                                    | Funktion                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | manuelle Ausführung                                                                            | Führt `discord-smoke` für eine ausgewählte Referenz aus.                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | PR-Kommentar oder manuelle Ausführung                                                              | Erstellt separate Baseline-/Kandidaten-Worktrees, führt `discord-status-reactions-tool-only` in jedem aus, rendert die Zeitleiste jeder Lane in einem Crabbox-Desktop-Browser, erzeugt mit `crabbox media preview` auf Bewegung zugeschnittene GIF-/MP4-Vorschauen, lädt Artefakte hoch und veröffentlicht direkt eingebettete PR-Nachweise.                                 |
| `Mantis Scenario`                 | manuelle Ausführung                                                                            | Generischer Dispatcher: übernimmt `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` und leitet sie an den passenden Szenario-Workflow weiter. |
| `Mantis Slack Desktop Smoke`      | manuelle Ausführung                                                                            | Least einen Crabbox-Linux-Desktop (standardmäßig `aws`, Auswahl von `hetzner`), führt `slack-desktop-smoke --gateway-setup` für den Kandidaten aus, zeichnet den Desktop auf, erzeugt eine Bewegungsvorschau, lädt Artefakte hoch und veröffentlicht PR-Nachweise, wenn eine PR-Nummer angegeben ist.                                                      |
| `Mantis Telegram Live`            | PR-Kommentar oder manuelle Ausführung                                                              | Führt die Live-QA-Lane für die Telegram-Bot-API (`openclaw qa telegram`) aus, schreibt `mantis-evidence.json` aus der QA-Zusammenfassung, rendert geschwärztes Nachweis-HTML über einen Crabbox-Desktop-Browser, erzeugt ein Bewegungs-GIF und veröffentlicht PR-Nachweise. Für diese Lane ist keine Anmeldung bei Telegram Web erforderlich.                               |
| `Mantis Telegram Desktop Proof`   | Maintainer-PR-Label (`mantis: telegram-visible-proof`) plus PR-Kommentar oder manuelle Ausführung | Agentischer nativer Vorher-/Nachher-Nachweis mit Telegram Desktop. Übergibt den PR, die Baseline-/Kandidatenreferenzen und die Maintainer-Anweisungen an Codex, das die Crabbox-Nachweis-Lane mit Telegram Desktop und einem echten Benutzer für beide Referenzen ausführt und eine zweispaltige PR-Nachweistabelle veröffentlicht.                                                              |
| `Mantis Web UI Chat Proof`        | PR-Kommentar oder manuelle Ausführung                                                              | Führt den fokussierten Playwright-Nachweis für den OpenClaw-Control-UI-Chat gegen den Kandidaten aus, überprüft, dass der Browser über das simulierte Gateway sendet, erfasst Screenshot-/Videoartefakte und veröffentlicht PR-Nachweise. Diese Lane dient ausschließlich als Nachweis für den Webchat, nicht für WinUI/native Apps oder beliebige visuelle Nachweise.                           |

`Mantis Discord Status Reactions` und `Mantis Telegram Live` akzeptieren beide
`baseline_ref`/`candidate_ref` (oder `baseline=`/`candidate=` in einem PR-Kommentar)
und überprüfen, dass der aufgelöste SHA entweder ein Vorgänger von `origin/main`, ein
Release-Tag (`v*`) oder der Head eines offenen PRs ist, bevor die Ausführung mit
Zugangsdaten erfolgt, die Secrets enthalten.

Kommentarauslöser aus einem PR mit Schreib-/Maintain-/Admin-Zugriff:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram-Kommentarauslöser verwenden standardmäßig den Head-SHA des PRs als Kandidaten und
`telegram-status-command` als Szenario; sie akzeptieren `provider=aws|hetzner` und
`lease=<cbx_...>`, um einen bestimmten Crabbox-Provider oder einen vorab aufgewärmten
Desktop anzugeben. `Mantis Telegram Desktop Proof` reagiert nur auf einen PR-Kommentar, wenn
der PR bereits das Label `mantis: telegram-visible-proof` trägt.

Kommentarauslöser für den Web-UI-Chat verwenden standardmäßig den Head-SHA des PRs als Kandidaten. Sie führen
den Chat-Nachweis der Control UI mit simuliertem Gateway aus und veröffentlichen Browserartefakte; verwenden Sie
für andere Webseiten und Oberflächen nativer Apps normale Playwright-/Browser-Nachweise,
Maintainer-Screenshots, Crabbox oder lokale Artefakte.

ClawSweeper kann ein Szenario auch direkt ausführen:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Maschinen und Secrets

Lokale CLI-Crabbox-Standardwerte sind `--provider hetzner --class beast`; überschreiben Sie sie
mit `--provider`, `--class`/`--machine-class` oder
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. GitHub-
Workflows überschreiben üblicherweise beide (zum Beispiel `--class standard` sowie die
Provider-Auswahleingabe `aws`/`hetzner` des Slack-Workflows). Wenn ein Provider zu
langsam oder nicht verfügbar ist, fügen Sie ihn hinter derselben Crabbox-Schnittstelle hinzu, anstatt
einen Fallback fest zu codieren.

VM-Baseline: Linux mit desktopfähigem Chrome/Chromium, CDP-Zugriff, VNC/
noVNC, Node 22.22.3+, 24.15+ oder 25.9+ und pnpm, einem OpenClaw-Checkout sowie
ausgehendem Zugriff auf den Zieltransport, GitHub, Modell-Provider und den
Zugangsdaten-Broker.

Namen von Zugangsdaten und Umgebungsvariablen, die in Mantis-Befehlen und -Workflows verwendet werden:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- Lokales `qa mantis run --credential-source env` erfordert außerdem
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  und `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`. GitHub-Workflows verwenden normalerweise
  `--credential-source convex` und die unten aufgeführten Broker-Zugangsdaten anstelle unverarbeiteter
  Discord-Bot-Tokens.
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` für öffentliche Artefakt-Uploads
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (oder das für Telegram-Desktop-Nachweise spezifische
  `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (Workflows akzeptieren außerdem
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` als Fallback und ordnen
  sie vor dem Aufruf von Crabbox den einfachen Namen zu)
- `CRABBOX_ACCESS_CLIENT_ID`, `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Der Mantis-Runner darf niemals Discord-/Slack-/Telegram-Bot-Tokens,
Provider-API-Schlüssel, Browser-Cookies, Inhalte von Authentifizierungsprofilen, VNC-Passwörter oder
unverarbeitete Zugangsdaten-Payloads ausgeben. Wenn ein Token in einem Issue, PR, Chat oder Log
offengelegt wird, rotieren Sie ihn, nachdem das Ersatz-Secret gespeichert wurde.

## Laufergebnisse

Vorher-/Nachher-Transportszenarien unterscheiden diese Ergebnisse, damit eine instabile
Umgebung nicht als Produktregression erscheint:

- **Fehler reproduziert**: Die Baseline ist auf die vom Szenario erwartete Weise fehlgeschlagen.
- **Harness-Fehler**: Umgebungseinrichtung, Zugangsdaten, Transport-API, Browser
  oder Provider sind fehlgeschlagen, bevor das Oracle aussagekräftig war.

Ein Browser-Nachweis nur für den Kandidaten meldet, ob der Kandidat die Prüfungen des simulierten
Gateways und der sichtbaren UI bestanden hat; er behauptet nicht, die Baseline reproduziert zu haben.

## Szenario hinzufügen

Live-Transportszenarien werden pro Transport in TypeScript definiert (siehe
`MANTIS_SCENARIO_CONFIGS` in `extensions/qa-lab/src/mantis/run.runtime.ts` für
die Vorher-/Nachher-Struktur von Discord) und verwenden kein eigenständiges deklaratives Dateiformat.
Jedes Szenario benötigt: ID und Titel, Transport, erforderliche Zugangsdaten, Richtlinie für die
Baseline-Referenz, Richtlinie für die Kandidatenreferenz, OpenClaw-Konfigurationspatch, Einrichtungs-/Stimulus-Schritte,
erwartetes Baseline- und Kandidaten-Oracle, Ziele für die visuelle Erfassung, Zeitüberschreitungsbudget
und Bereinigungsschritte.

Ein fokussierter Browser-Nachweis nur für den Kandidaten kann einen dedizierten deterministischen E2E-Test
und Workflow verwenden. Halten Sie seinen Umfang explizit, validieren Sie die Kandidatenreferenz vor
der Ausführung, isolieren Sie die durch Secrets gestützte Veröffentlichung und geben Sie denselben Vertrag
für das Nachweismanifest aus.

Bevorzugen Sie kleine, typisierte Oracles gegenüber visuellen Prüfungen: Discord-Reaktionsstatus oder
Nachrichtenreferenzen, Slack-Thread-`ts`-/Reaktions-API-Status, E-Mail-Nachrichten-IDs
und -Header. Verwenden Sie Browser-Screenshots, wenn die UI die einzige zuverlässige Beobachtungsmöglichkeit ist,
und halten Sie visuelle Prüfungen ergänzend zu einem Plattform-API-Oracle, sofern eines vorhanden ist.

Nach Discord, Slack und Telegram lässt sich dieselbe Runner-Struktur auf WhatsApp
(QR-Anmeldung, erneute Identifizierung, Zustellung, Medien, Reaktionen) und Matrix
(verschlüsselte Räume, Thread-/Antwortbeziehungen, Fortsetzung nach Neustart) erweitern; keines von beiden ist
bisher implementiert.

## Offene Fragen

- Welcher Discord-Bot sollte der Treiber und welcher das SUT sein, wenn der vorhandene Mantis-
  Bot wiederverwendet wird?
- Wie lange sollte GitHub Mantis-Artefakte für PRs aufbewahren?
- Wann sollte ClawSweeper automatisch ein Mantis-Szenario empfehlen, anstatt
  auf einen Maintainer-Befehl zu warten?
- Sollten Screenshots vor dem Hochladen für öffentliche PRs geschwärzt oder zugeschnitten werden?
