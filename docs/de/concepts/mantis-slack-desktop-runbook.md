---
read_when:
    - Mantis Slack-Desktop-QA über GitHub oder lokal ausführen
    - Langsame Mantis-Slack-Desktop-Ausführungen debuggen
    - Auswahl des Source-, Prehydrated- oder Warm-Lease-Modus
    - Screenshot- und Videonachweise in einem PR posten
summary: 'Operator-Runbook für Mantis Slack Desktop-QA: GitHub Dispatch, lokale CLI, warme VNC-Leases, Hydratisierungsmodi, Timing-Interpretation, Artefakte und Fehlerbehandlung.'
title: Mantis Slack-Desktop-Runbook
x-i18n:
    generated_at: "2026-06-27T17:23:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack-Desktop-QA ist der Testpfad mit echter UI für Bugs der Slack-Klasse, die einen
Linux-Desktop, VNC-Rettung, Slack Web, einen echten OpenClaw-Gateway, Screenshots,
Videos und einen PR-Nachweiskommentar benötigen.

Verwenden Sie ihn, wenn Unit-Tests oder der headless Slack-Live-Testpfad den Bug nicht nachweisen können.

## Speichermodell

Mantis verwendet drei verschiedene Speicherebenen:

- Provider-Image: gehört Crabbox und wird im Cloud-Provider-Konto gespeichert.
  Es enthält Maschinenfunktionen wie Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, native Build-Werkzeuge und leere Cache-Verzeichnisse.
- Warmer Lease-Zustand: gehört der aktuellen Operatorsitzung. Er kann ein
  angemeldetes Browserprofil, `/var/cache/crabbox/pnpm` und einen vorbereiteten Source-
  Checkout enthalten, solange der Lease aktiv ist.
- Mantis-Artefakte: gehören zum OpenClaw-Lauf. Sie liegen unter
  `.artifacts/qa-e2e/mantis/...`; anschließend lädt GitHub Actions sie hoch und die
  Mantis GitHub App kommentiert Inline-Nachweise im PR.

Legen Sie niemals Secrets, Browser-Cookies, Slack-Anmeldestatus, Repository-Checkouts,
`node_modules` oder `dist/` in einem vorgebackenen Provider-Image ab.

## GitHub-Dispatch

Führen Sie den Workflow von `main` aus:

```bash
gh workflow run mantis-slack-desktop-smoke.yml \
  --ref main \
  -f candidate_ref=<trusted-ref-or-sha> \
  -f pr_number=<pr-number> \
  -f scenario_id=slack-canary \
  -f crabbox_provider=aws \
  -f keep_vm=false \
  -f hydrate_mode=source
```

Zulässige `candidate_ref`-Werte sind absichtlich eng gefasst, weil der Workflow
Live-Anmeldedaten verwendet: aktuelle `main`-Abstammung, Release-Tags oder ein offener PR-Head
aus `openclaw/openclaw`.

Der Workflow schreibt:

- hochgeladenes Artefakt: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- Inline-PR-Kommentar von der Mantis GitHub App;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- Remote-Logs wie `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` und `ffmpeg.log`.

Der PR-Kommentar wird anhand des versteckten Markers
`<!-- mantis-slack-desktop-smoke -->` direkt aktualisiert.

## Lokale CLI

Kalter Source-Nachweis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --credential-source convex \
  --credential-role maintainer \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --scenario slack-canary \
  --hydrate-mode source
```

VM für VNC-Rettung behalten:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

VNC öffnen:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Einen warmen Lease wiederverwenden:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Verwenden Sie `--hydrate-mode prehydrated` nur, wenn der wiederverwendete Remote-Arbeitsbereich bereits
`node_modules` und ein gebautes `dist/` enthält. Mantis schlägt geschlossen fehl, wenn diese
fehlen.

Native Slack-Genehmigungs-UI nachweisen:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

Der Genehmigungs-Checkpoint-Modus schließt `--gateway-setup` gegenseitig aus. Er führt
die Opt-in-Szenarien `slack-approval-exec-native` und `slack-approval-plugin-native`
aus, sofern Sie keine expliziten Genehmigungs-Checkpoint-`--scenario`-Flags übergeben; andere
Slack-Szenarien werden abgewiesen, bevor die VM startet. Der Slack-QA-Runner schreibt
jede Checkpoint-JSON-Datei aus der echten Slack-API-Nachricht, die er beobachtet hat; anschließend rendert der
Remote-Watcher diesen Nachrichten-Snapshot in
`approval-checkpoints/<scenario>-pending.png` und
`approval-checkpoints/<scenario>-resolved.png`. Der Lauf schlägt fehl, wenn eine Checkpoint-
JSON-Datei, ein Nachrichten-Nachweis, eine ACK-JSON-Datei oder ein gerenderter Screenshot fehlt oder leer ist.

Kalte GitHub-Actions-Leases haben keine Slack-Web-Cookies, daher kann ihre Browser-
Erfassung auf der Slack-Anmeldeseite landen. Vertrauen Sie für Genehmigungs-Checkpoint-Nachweise den
gerenderten Checkpoint-Bildern und Slack-QA-Artefakten statt
`slack-desktop-smoke.png`. Verwenden Sie einen behaltenen warmen Lease mit einem manuell angemeldeten Slack-
Web-Profil nur dann, wenn der Browser-Screenshot selbst Slack Web zeigen muss.

## Hydrate-Modi

| Modus         | Verwenden, wenn                           | Remote-Verhalten                                                                      | Tradeoff                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Normaler PR-Nachweis, kalte Maschinen, CI | Führt `pnpm install --frozen-lockfile --prefer-offline` und `pnpm build` in der VM aus | Langsamster, stärkster Source-Checkout-Nachweis          |
| `prehydrated` | Sie absichtlich einen wiederverwendeten Lease vorbereitet haben | Erfordert vorhandene `node_modules` und `dist/`; überspringt Installation/Build       | Schnell, aber nur für operatorgesteuerte warme Leases gültig |

GitHub Actions bereitet den Kandidaten-Checkout immer vor dem VM-Lauf vor. Sein
pnpm-Store wird nach Betriebssystem, Node-Version und Lockfile gecacht. Der VM-Source-Lauf verwendet außerdem
`/var/cache/crabbox/pnpm`, sofern vorhanden.

## Timing-Interpretation

`mantis-slack-desktop-smoke-report.md` enthält Phasen-Timings:

- `crabbox.warmup`: Cloud-Provider-Start, Desktop-/Browser-Bereitschaft und SSH.
- `crabbox.inspect`: Lease-Metadatenabfrage.
- `credentials.prepare`: Abruf des Convex-Anmeldedaten-Lease.
- `crabbox.remote_run`: Synchronisierung, Browserstart, OpenClaw-Installation/Build oder
  Hydrate-Validierung, Gateway-Start, Screenshot und Videoerfassung.
- `artifacts.copy`: rsync zurück von der VM.

`crabbox.remote_run` kann als `accepted` markiert werden, wenn Crabbox einen Remote-Status ungleich null
zurückgibt, nachdem Mantis Metadaten kopiert hat, die belegen, dass entweder die OpenClaw-
Gateway-Einrichtung abgeschlossen wurde oder der Slack-QA-Befehl selbst erfolgreich beendet wurde.
Behandeln Sie `accepted` als bestanden mit Erklärung, nicht als fehlgeschlagenes Szenario.

Wenn der Lauf langsam ist:

- warmup dominiert: backen Sie ein besseres Crabbox-Provider-Image vor oder promoten Sie es;
- remote_run dominiert in `source`: verwenden Sie einen warmen Lease, verbessern Sie die Wiederverwendung des pnpm-Stores
  oder verschieben Sie Maschinenvoraussetzungen in das Provider-Image;
- remote_run dominiert in `prehydrated`: der Remote-Arbeitsbereich war tatsächlich nicht
  bereit, oder die Gateway-/Browser-/Slack-Einrichtung ist langsam;
- Artefaktkopie dominiert: prüfen Sie die Videogröße und die Inhalte des Artefaktverzeichnisses.

## Nachweis-Checkliste

Ein guter PR-Kommentar sollte zeigen:

- Szenario-ID und Kandidaten-SHA;
- GitHub-Actions-Lauf-URL;
- Artefakt-URL;
- Inline-Screenshot eines Genehmigungs-Checkpoints oder einen Slack-Web-Screenshot von einem
  angemeldeten warmen Lease;
- Inline-animierte Vorschau, falls verfügbar;
- Links zum vollständigen MP4 und zum gekürzten MP4;
- Bestanden-/Fehlgeschlagen-Status;
- Timing-Zusammenfassung im angehängten Bericht.

Committen Sie keine Screenshots oder Videos in das Repository. Bewahren Sie sie in GitHub-
Actions-Artefakten oder im PR-Kommentar auf.

## Fehlerbehandlung

Wenn der Workflow vor dem VM-Lauf fehlschlägt, prüfen Sie zuerst den Actions-Job. Typische
Ursachen sind ein nicht vertrauenswürdiger `candidate_ref`, fehlende Umgebungs-Secrets oder ein fehlgeschlagener Installations-/Build-Schritt des Kandidaten.

Wenn der VM-Lauf fehlschlägt, aber Screenshots zurückkopiert wurden, prüfen Sie:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Wenn der Lauf den Lease behalten hat, öffnen Sie VNC mit dem `crabbox vnc ...`-Befehl aus dem Bericht.
Stoppen Sie den Lease, wenn Sie fertig sind:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Wenn die Slack-Anmeldung abgelaufen ist, reparieren Sie sie in VNC auf einem behaltenen Lease und führen Sie den Lauf erneut mit
`--lease-id` aus. Backen Sie dieses Browserprofil nicht in ein Provider-Image ein.

## Verwandt

- [QA-Übersicht](/de/concepts/qa-e2e-automation)
- [Slack-Kanal](/de/channels/slack)
- [Testen](/de/help/testing)
