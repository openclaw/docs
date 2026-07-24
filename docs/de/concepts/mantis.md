---
read_when:
    - Erstellen oder Ausführen visueller Live-QA für OpenClaw-Fehler
    - Hinzufügen einer Vorher- und Nachher-Verifizierung für einen Pull Request
    - Discord-, Slack-, WhatsApp- oder andere Live-Transportszenarien hinzufügen
    - Gezielter Browsernachweis für die Control UI für eine Kandidaten-Referenz wird ausgeführt
    - Debugging von QA-Läufen, die Screenshots, Browserautomatisierung oder VNC-Zugriff erfordern
summary: Mantis erfasst visuelle End-to-End-Nachweise für Live-Transportvergleiche und gezielte Browser-Nachweise ausschließlich für Kandidaten und fügt die Artefakte anschließend PRs hinzu.
title: Mantis
x-i18n:
    generated_at: "2026-07-24T04:59:38Z"
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
fokussierte Browser-Lanes können stattdessen einen einzelnen Kandidaten anhand eines deterministischen
gemockten Transports prüfen. Discord wurde zuerst mit echter Bot-Authentifizierung, Guild-Kanälen,
Reaktionen, Threads und einem Browser-Zeugen ausgeliefert. Lanes für Slack, Telegram und fokussierte Control-
UI-Chats sind ebenfalls vorhanden; WhatsApp und Matrix sind nicht implementiert.

## Zuständigkeit

- OpenClaw (`extensions/qa-lab/src/mantis/*`): Szenario-Runtime, `pnpm openclaw qa mantis <command>` CLI, Nachweisschema.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): Live-Transport-Harness, Treiber-/SUT-Bots, Bericht-/Nachweis-Writer.
- Crabbox (`openclaw/crabbox`): vorgewärmte Linux-Maschinen, Leases, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): Remote-Einstiegspunkte, Artefaktaufbewahrung.
- ClawSweeper: parst Maintainer-PR-Befehle, startet Workflows und veröffentlicht den abschließenden PR-Kommentar.

## CLI-Befehle

Alle Befehle sind `pnpm openclaw qa mantis <command>`, definiert in
`extensions/qa-lab/src/mantis/cli.ts`. Erfordert `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
zur Build-/Laufzeit (gebündelte Workflows setzen `OPENCLAW_BUILD_PRIVATE_QA=1` und
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` vor dem Build).

| Befehl                          | Zweck                                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Prüft, ob der Mantis-Discord-Bot die Guild bzw. den Kanal sehen, Beiträge veröffentlichen und reagieren kann.                                             |
| `run`                           | Führt ein Vorher-/Nachher-Szenario mit Baseline- und Kandidaten-Refs aus (nur Discord).                                                                    |
| `desktop-browser-smoke`         | Least/verwendet einen Crabbox-Desktop erneut, öffnet einen sichtbaren Browser und erfasst Screenshot und Video.                                            |
| `slack-desktop-smoke`           | Least/verwendet einen Crabbox-Desktop erneut, führt darin Slack-QA aus, öffnet Slack Web und erfasst Nachweise.                                           |
| `telegram-desktop-builder`      | Least/verwendet einen Crabbox-Desktop erneut, installiert Telegram Desktop und konfiguriert optional ein OpenClaw-Gateway.                                 |
| `visual-task` / `visual-driver` | Generische Crabbox-Desktop-Erfassung mit optionalen bildverständnisbasierten Assertions; `visual-driver` ist die unter `crabbox record --while` gestartete Treiberhälfte. |

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
ob der Kanal zur Guild gehört, veröffentlicht anschließend (sofern nicht `--skip-post`) eine Nachricht und
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
integrierten IDs, jeweils mit eigenem Standard-Baseline-Ref und erwarteten Vorher-/Nachher-
Labels (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Szenario                                   | Standard-Baseline                          | Baseline erwartet                         | Kandidat erwartet            |
| ------------------------------------------ | ------------------------------------------ | ----------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | Thread-Antwort lässt `filePath`-Anhang aus | Thread-Antwort enthält ihn   |

`--candidate` verwendet standardmäßig `HEAD`. Weitere Flags: `--credential-source`
(Standardwert `convex`), `--credential-role` (Standardwert `ci`), `--provider-mode`
(Standardwert `live-frontier`), `--fast` (standardmäßig aktiviert), `--skip-install`, `--skip-build`.

Der Runner erstellt abgetrennte `git worktree`-Checkouts für Baseline und
Kandidat unter `<output-dir>/worktrees/`, führt `pnpm install`/`pnpm build` in
jedem davon aus (sofern nicht übersprungen) und führt anschließend
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
für jeden Worktree aus. Jede Lane schreibt `discord-qa-reaction-timelines.json`
sowie ein `<scenario-id>-timeline.html`/`.png`-Paar; der Runner kopiert diese
Nachweise unter `baseline/`/`candidate/` zurück, schreibt `comparison.json`,
`mantis-report.md` und `mantis-evidence.json` in das Ausgabeverzeichnis und
wird mit einem Fehlercode beendet, wenn der Vergleich nicht bestanden wurde (Baseline `fail` und Kandidat
`pass`).

Das zweite Discord-Szenario (`discord-thread-reply-filepath-attachment`) veröffentlicht
mit dem Treiber-Bot eine übergeordnete Nachricht, erstellt einen echten Thread, ruft die
`message.thread-reply`-Aktion des SUT mit einer Repository-lokalen `filePath` auf und fragt anschließend den
Thread nach der Antwort und dem Dateinamen des Anhangs ab. Erwartet wird ein Anhang
namens `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Least oder verwendet einen Crabbox-Desktop erneut, startet innerhalb der VNC-Sitzung
einen Browser, der auf `--browser-url` (Standardwert `https://openclaw.ai`) oder eine gerenderte
`--html-file` verweist, wartet, erstellt mit `scrot` einen Screenshot, zeichnet optional mit
`ffmpeg` eine MP4-Datei auf und synchronisiert `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
per rsync zurück nach `--output-dir`.

Flags:

- `--lease-id <cbx_...>` verwendet einen vorgewärmten Desktop erneut, statt einen neuen zu erstellen.
- `--browser-profile-dir <remote-path>` verwendet ein entferntes Chrome-Benutzerdatenverzeichnis erneut, damit ein persistenter Desktop zwischen Ausführungen angemeldet bleibt (wird für ein langlebiges Discord-Web-Betrachterprofil verwendet).
- `--browser-profile-archive-env <name>` stellt vor dem Start ein Base64-codiertes `.tgz`-Chrome-Profilarchiv aus dieser Umgebungsvariable wieder her (Standardwert `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); wird für angemeldete Zeugen wie Discord Web verwendet.
- `--video-duration <seconds>` steuert die Dauer der MP4-Aufzeichnung (Standardwert 10s).
- `--keep-lease` (oder `OPENCLAW_MANTIS_KEEP_VM=1`) hält eine bei dieser Ausführung erstellte Lease zur VNC-Prüfung offen; fehlgeschlagene Ausführungen, die eine Lease erstellt haben, halten sie standardmäßig ebenfalls offen.

Für Discord-Web-Nachweise verwendet Mantis ein dediziertes Betrachterkonto und kein Bot-
Token. Das Discord-REST-Oracle (über `qa discord`) bleibt maßgeblich; wenn
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` gesetzt ist, schreibt das Szenario außerdem ein
Discord-Web-URL-Artefakt, und `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` lässt den
Thread lange genug geöffnet, damit der Browser ihn öffnen kann.

Der GitHub-Workflow bevorzugt ein persistentes Betrachterprofil über
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (vollständige Profilarchive können
die Größenbeschränkung für GitHub-Secrets überschreiten); für kleine/Bootstrap-Profile kann er stattdessen ein
Base64-codiertes `.tgz` aus `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` wiederherstellen. Wenn
keine der beiden Quellen konfiguriert ist, veröffentlicht der Workflow weiterhin die deterministischen
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

Least oder verwendet einen Crabbox-Desktop erneut, synchronisiert den Checkout in die VM, führt
darin `pnpm openclaw qa slack` aus, öffnet Slack Web im VNC-Browser,
erfasst den Desktop und kopiert sowohl die Slack-QA-Artefakte (`slack-qa/`) als auch
den VNC-Screenshot bzw. das VNC-Video lokal zurück. Dies ist die einzige Mantis-Variante, bei der das
SUT-Gateway und der Browser beide innerhalb derselben VM ausgeführt werden.

Mit `--gateway-setup` erstellt der Befehl ein persistentes, entsorgbares OpenClaw-
Home unter `$HOME/.openclaw-mantis/slack-openclaw` in der VM, passt die Slack-
Socket-Mode-Konfiguration für den Zielkanal an, startet
`openclaw gateway run --dev --allow-unconfigured --port 38973` und lässt
Chrome in der VNC-Sitzung laufen; ohne `--gateway-setup` wird stattdessen die normale
Bot-zu-Bot-Slack-QA-Lane ausgeführt.

Erforderliche Umgebungsvariablen für `--credential-source env` (lokaler Standardwert ist `env`; Rollen-
Standardwert ist `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` für die Remote-Modell-Lane (wenn lokal nur `OPENAI_API_KEY`
  gesetzt ist, kopiert Mantis den Wert nach `OPENCLAW_LIVE_OPENAI_KEY`, bevor
  Crabbox aufgerufen wird)

Mit `--credential-source convex` least Mantis die Slack-SUT-Anmeldedaten aus
dem gemeinsamen Pool, bevor die VM erstellt wird, und übergibt Kanal-ID, App-Token und
Bot-Token als `OPENCLAW_MANTIS_SLACK_*`-Umgebungsvariablen an die VM, sodass GitHub-
Workflows nur das Convex-Broker-Secret und keine unverarbeiteten Slack-Tokens benötigen.

Weitere Flags: `--slack-url <url>` öffnet eine bestimmte URL (andernfalls leitet Mantis
`https://app.slack.com/client/<team>/<channel>` aus `auth.test` ab);
`--slack-channel-id <id>` legt den Kanal der Gateway-Zulassungsliste fest;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` steuert das persistente Chrome-
Profil innerhalb der VM (Standardwert `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` führt die nativen Slack-Genehmigungsszenarien
(`slack-approval-exec-native`, `slack-approval-plugin-native`) aus und rendert
Screenshots der ausstehenden/abgeschlossenen Prüfpunkte anstelle der Gateway-Einrichtung (schließt sich gegenseitig
mit `--gateway-setup` aus); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` und `--fast` werden an die
Slack-Live-Lane weitergereicht.

Screenshots der Genehmigungsprüfpunkte werden aus der vom Szenario beobachteten Slack-API-Nachricht
gerendert, nicht aus der Live-Slack-Benutzeroberfläche; `slack-desktop-smoke.png` dient nur als
Nachweis für Slack Web selbst, wenn das Browserprofil der Lease bereits angemeldet war.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Least oder verwendet einen Crabbox-Desktop erneut, installiert die native Linux-Version von Telegram Desktop,
stellt optional ein Benutzersitzungsarchiv wieder her, konfiguriert OpenClaw mit dem
geleasten Telegram-SUT-Bot-Token, startet
`openclaw gateway run --dev --allow-unconfigured --port 38974`, veröffentlicht eine Bereitschaftsnachricht des
Treiber-Bots in der geleasten privaten Gruppe und erfasst anschließend einen
Screenshot und eine MP4-Datei. Ein Bot-Token konfiguriert nur OpenClaw; es meldet
Telegram Desktop niemals an. Der Desktop-Betrachter ist eine separate Telegram-Benutzersitzung,
die aus `--telegram-profile-archive-env <name>` wiederhergestellt oder manuell
über VNC angemeldet und mit `--keep-lease` aktiv gehalten wird.

Flags: `--lease-id <cbx_...>` führt den Vorgang erneut mit einer VM aus, die bereits bei
Telegram Desktop angemeldet ist; `--telegram-profile-archive-env <name>` stellt vor dem Start ein Base64-codiertes
`.tgz`-Profilarchiv wieder her; `--telegram-profile-dir <remote-path>`
legt das Remote-Profilverzeichnis fest (Standardwert `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` installiert und öffnet ausschließlich Telegram Desktop;
`--credential-source`/`--credential-role` verwenden standardmäßig `convex`/`maintainer`.

## Nachweismanifest

Jedes Szenario, das in einem PR veröffentlicht, schreibt `mantis-evidence.json` neben
seinen Bericht:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Für Menschen lesbare Zusammenfassung am Anfang des PR-Kommentars.",
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
      "label": "Baseline nur in Warteschlange",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline-Discord-Zeitleiste",
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
`desktopScreenshot` (VNC-/Browser-Screenshot), `motionPreview` (inline eingebettetes animiertes
GIF aus der Aufzeichnung), `motionClip` (bewegungsbereinigtes MP4), `fullVideo` (vollständige
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

Screenshots sind Nachweise, keine Geheimnisse, erfordern aber dennoch sorgfältige Schwärzung:
Private Kanalnamen, Benutzernamen oder Nachrichteninhalte können sichtbar sein. Setzen Sie
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` für öffentliche Artefakt-Uploads; dies ist
in den GitHub-Workflows für Discord/Slack/Telegram standardmäßig aktiviert.

## GitHub-Automatisierung

`scripts/mantis/publish-pr-evidence.mjs` ist der wiederverwendbare Publisher. Workflows
rufen ihn mit dem Manifest, dem Ziel-PR, dem Zielstammverzeichnis für Artefakte, der Kommentarmarkierung,
der Artefakt-URL, der Lauf-URL und der Anforderungsquelle auf. Er lädt deklarierte Artefakte in
den Mantis-R2-Bucket hoch, erstellt einen PR-Kommentar mit vorangestellter Zusammenfassung,
inline eingebetteten Bildern/Vorschauen und verlinkten Videos und aktualisiert anschließend den vorhandenen markierten Kommentar oder
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
| `Mantis Discord Status Reactions` | PR-Kommentar oder manuelle Ausführung                                                              | Erstellt separate Baseline-/Kandidaten-Worktrees, führt `discord-status-reactions-tool-only` in jedem aus, rendert die Zeitleiste jeder Lane in einem Crabbox-Desktop-Browser, erzeugt mit `crabbox media preview` bewegungsbereinigte GIF-/MP4-Vorschauen, lädt Artefakte hoch und veröffentlicht Inline-Nachweise im PR.                                 |
| `Mantis Scenario`                 | manuelle Ausführung                                                                            | Generischer Dispatcher: übernimmt `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` und leitet sie an den passenden Szenario-Workflow weiter. |
| `Mantis Slack Desktop Smoke`      | manuelle Ausführung                                                                            | Least einen Crabbox-Linux-Desktop (standardmäßig `aws`, Auswahl von `hetzner`), führt `slack-desktop-smoke --gateway-setup` für den Kandidaten aus, zeichnet den Desktop auf, erzeugt eine Bewegungsvorschau, lädt Artefakte hoch und veröffentlicht PR-Nachweise, wenn eine PR-Nummer angegeben ist.                                                      |
| `Mantis Telegram Live`            | PR-Kommentar oder manuelle Ausführung                                                              | Führt die Live-QA-Lane der Telegram-Bot-API (`openclaw qa telegram`) aus, schreibt `mantis-evidence.json` aus der QA-Zusammenfassung, rendert geschwärztes Nachweis-HTML über einen Crabbox-Desktop-Browser, erzeugt ein Bewegungs-GIF und veröffentlicht PR-Nachweise. Für diese Lane ist keine Telegram-Web-Anmeldung erforderlich.                               |
| `Mantis Telegram Desktop Proof`   | Maintainer-PR-Label (`mantis: telegram-visible-proof`) plus PR-Kommentar oder manuelle Ausführung | Agentischer nativer Vorher-/Nachher-Nachweis mit Telegram Desktop. Übergibt den PR, die Baseline-/Kandidatenreferenzen und Maintainer-Anweisungen an Codex, das für beide Referenzen die Crabbox-Telegram-Desktop-Nachweis-Lane mit einem echten Benutzer ausführt und eine zweispaltige PR-Nachweistabelle veröffentlicht.                                                              |
| `Mantis Web UI Chat Proof`        | PR-Kommentar oder manuelle Ausführung                                                              | Führt den fokussierten Playwright-Nachweis für den Chat der OpenClaw Control UI mit dem Kandidaten aus, prüft, ob der Browser über das simulierte Gateway sendet, erfasst Screenshot-/Videoartefakte und veröffentlicht PR-Nachweise. Diese Lane dient ausschließlich als Webchat-Nachweis, nicht für WinUI-/native Apps oder beliebige visuelle Nachweise.                           |

`Mantis Discord Status Reactions` und `Mantis Telegram Live` akzeptieren beide
`baseline_ref`/`candidate_ref` (oder `baseline=`/`candidate=` in einem PR-Kommentar)
und prüfen, ob der aufgelöste SHA entweder ein Vorgänger von `origin/main`, ein
Release-Tag (`v*`) oder der Head eines offenen PR ist, bevor die Ausführung mit
geheimnistragenden Anmeldedaten erfolgt.

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

Telegram-Kommentarauslöser verwenden standardmäßig den Head-SHA des PR als Kandidaten und
`telegram-status-command` als Szenario; sie akzeptieren `provider=aws|hetzner` und
`lease=<cbx_...>`, um einen bestimmten Crabbox-Provider oder einen vorgewärmten
Desktop anzusprechen. `Mantis Telegram Desktop Proof` reagiert nur auf einen PR-Kommentar, wenn
der PR bereits das Label `mantis: telegram-visible-proof` trägt.

Kommentarauslöser für den Web-UI-Chat verwenden standardmäßig den Head-SHA des PR als Kandidaten. Sie führen
den Control-UI-Chat-Nachweis mit simuliertem Gateway aus und veröffentlichen Browserartefakte; verwenden Sie
für andere Webseiten und Oberflächen nativer Apps normale Playwright-/Browser-Nachweise,
Maintainer-Screenshots, Crabbox oder lokale Artefakte.

ClawSweeper kann ein Szenario auch direkt auslösen:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Maschinen und Geheimnisse

Lokale CLI-Crabbox-Standardwerte sind `--provider hetzner --class beast`; überschreiben Sie sie
mit `--provider`, `--class`/`--machine-class` oder
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. GitHub-
Workflows überschreiben häufig beide (zum Beispiel `--class standard` sowie die
Provider-Auswahleingabe `aws`/`hetzner` des Slack-Workflows). Wenn ein Provider zu
langsam oder nicht verfügbar ist, fügen Sie ihn hinter derselben Crabbox-Schnittstelle hinzu, statt
einen Fallback fest zu codieren.

VM-Basis: Linux mit desktopfähigem Chrome/Chromium, CDP-Zugriff, VNC/
noVNC, Node 22.22.3+, 24.15+ oder 25.9+ und pnpm, einem OpenClaw-Checkout sowie
ausgehendem Zugriff auf den Zieltransport, GitHub, Modell-Provider und den
Anmeldedaten-Broker.

Namen von Anmeldedaten und Umgebungsvariablen, die in Mantis-Befehlen und -Workflows verwendet werden:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- Lokales `qa mantis run --credential-source env` erfordert außerdem
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  und `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`. GitHub-Workflows verwenden normalerweise
  `--credential-source convex` und die nachstehenden Broker-Anmeldedaten anstelle unverarbeiteter
  Discord-Bot-Tokens.
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` für öffentliche Artefakt-Uploads
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (oder das für den Telegram-Desktop-Nachweis spezifische
  `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (Workflows akzeptieren außerdem
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` als Fallback und ordnen
  sie vor dem Aufruf von Crabbox den einfachen Namen zu)
- `CRABBOX_ACCESS_CLIENT_ID`, `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Der Mantis-Runner darf niemals Discord-/Slack-/Telegram-Bot-Tokens,
Provider-API-Schlüssel, Browser-Cookies, Inhalte von Authentifizierungsprofilen, VNC-Passwörter oder
unverarbeitete Anmeldedaten-Nutzlasten ausgeben. Wenn ein Token in einem Issue, PR, Chat oder Log offengelegt wird,
rotieren Sie es, nachdem das Ersatzgeheimnis gespeichert wurde.

## Laufergebnisse

Vorher-/Nachher-Transportszenarien unterscheiden diese Ergebnisse, damit eine instabile
Umgebung nicht als Produktregression erscheint:

- **Fehler reproduziert**: Die Baseline ist auf die vom Szenario erwartete Weise fehlgeschlagen.
- **Harness-Fehler**: Umgebungseinrichtung, Anmeldedaten, Transport-API, Browser
  oder Provider sind fehlgeschlagen, bevor das Orakel aussagekräftig war.

Ein Kandidaten-only-Browser-Nachweis meldet, ob der Kandidat die Prüfungen des simulierten
Gateway und der sichtbaren UI bestanden hat; er beansprucht nicht, die Baseline reproduziert zu haben.

## Szenario hinzufügen

Live-Transportszenarien werden pro Transport in TypeScript definiert (siehe
`MANTIS_SCENARIO_CONFIGS` in `extensions/qa-lab/src/mantis/run.runtime.ts` für
die Discord-Vorher-/Nachher-Struktur) und nicht in einem eigenständigen deklarativen Dateiformat.
Jedes Szenario benötigt: ID und Titel, Transport, erforderliche Anmeldedaten, Richtlinie für die Baseline-
Referenz, Richtlinie für die Kandidatenreferenz, OpenClaw-Konfigurations-Patch, Einrichtungs-/Stimulus-Schritte,
erwartetes Baseline- und Kandidatenorakel, Ziele für die visuelle Erfassung, Zeitüberschreitungs-
budget und Bereinigungsschritte.

Fokussierte Kandidaten-only-Browser-Nachweise können einen dedizierten deterministischen E2E-Test
und Workflow verwenden. Halten Sie den Umfang explizit, validieren Sie die Kandidatenreferenz vor
der Ausführung, isolieren Sie die geheimnisgestützte Veröffentlichung und geben Sie denselben
Nachweismanifest-Vertrag aus.

Bevorzugen Sie kleine, typisierte Orakel gegenüber visuellen Prüfungen: Discord-Reaktionsstatus oder
Nachrichtenreferenzen, Slack-Thread-`ts`-/Reaktions-API-Status, E-Mail-Nachrichten-IDs
und Header. Verwenden Sie Browser-Screenshots, wenn die UI die einzige zuverlässige Beobachtungsmöglichkeit ist,
und verwenden Sie visuelle Prüfungen ergänzend zu einem Plattform-API-Orakel, sofern eines vorhanden ist.

Nach Discord, Slack und Telegram lässt sich dieselbe Runner-Struktur auf WhatsApp
(QR-Anmeldung, erneute Identifizierung, Zustellung, Medien, Reaktionen) und Matrix
(verschlüsselte Räume, Thread-/Antwortbeziehungen, Wiederaufnahme nach Neustart) erweitern; keines von
beiden ist bisher implementiert.

## Offene Fragen

- Welcher Discord-Bot sollte der Treiber und welcher das SUT sein, wenn der vorhandene Mantis-
  Bot wiederverwendet wird?
- Wie lange sollte GitHub Mantis-Artefakte für PRs aufbewahren?
- Wann sollte ClawSweeper automatisch ein Mantis-Szenario empfehlen, anstatt
  auf einen Maintainer-Befehl zu warten?
- Sollten Screenshots vor dem Hochladen für öffentliche PRs geschwärzt oder zugeschnitten werden?
