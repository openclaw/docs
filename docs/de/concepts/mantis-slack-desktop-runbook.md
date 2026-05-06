---
read_when:
    - Mantis Slack-Desktop-QA über GitHub oder lokal ausführen
    - Fehlerbehebung bei langsamen Mantis-Slack-Desktop-Durchläufen
    - Quell-, vorhydratisierten oder Warm-Lease-Modus auswählen
    - Screenshot- und Videonachweise in einem PR posten
summary: 'Operator-Runbook für Mantis Slack Desktop-QA: GitHub-Dispatch, lokale CLI, vorgewärmte VNC-Leases, Hydrate-Modi, Timing-Interpretation, Artefakte und Fehlerbehandlung.'
title: Mantis Slack-Desktop-Runbook
x-i18n:
    generated_at: "2026-05-06T06:43:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack Desktop-QA ist die Real-UI-Lane für Fehler der Slack-Klasse, die einen
Linux-Desktop, VNC-Rettung, Slack Web, ein echtes OpenClaw-Gateway, Screenshots,
Videos und einen PR-Nachweiskommentar benötigen.

Verwenden Sie sie, wenn Unit-Tests oder die headless Slack-Live-Lane den Fehler nicht belegen können.

## Speichermodell

Mantis verwendet drei verschiedene Speicherebenen:

- Provider-Image: gehört Crabbox und wird im Cloud-Provider-Konto gespeichert.
  Es enthält Maschinenfähigkeiten wie Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, native Build-Tools und leere Cache-Verzeichnisse.
- Warmer Lease-Status: gehört der aktuellen Operator-Sitzung. Er kann ein
  angemeldetes Browserprofil, `/var/cache/crabbox/pnpm` und einen vorbereiteten
  Source-Checkout enthalten, solange die Lease aktiv ist.
- Mantis-Artefakte: gehören dem OpenClaw-Lauf. Sie liegen unter
  `.artifacts/qa-e2e/mantis/...`; anschließend lädt GitHub Actions sie hoch und die
  Mantis GitHub App kommentiert Inline-Nachweise im PR.

Legen Sie niemals Secrets, Browser-Cookies, Slack-Anmeldestatus, Repository-Checkouts,
`node_modules` oder `dist/` in einem vorgefertigten Provider-Image ab.

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
- Remote-Protokolle wie `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` und `ffmpeg.log`.

Der PR-Kommentar wird über die versteckte
`<!-- mantis-slack-desktop-smoke -->`-Markierung direkt aktualisiert.

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

Warme Lease wiederverwenden:

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

## Hydrate-Modi

| Modus         | Verwenden, wenn                           | Remote-Verhalten                                                                     | Abwägung                                                 |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `source`      | Normaler PR-Nachweis, kalte Maschinen, CI | Führt `pnpm install --frozen-lockfile --prefer-offline` und `pnpm build` in der VM aus | Am langsamsten, stärkster Source-Checkout-Nachweis       |
| `prehydrated` | Sie absichtlich eine wiederverwendete Lease vorbereitet haben | Erfordert vorhandene `node_modules` und `dist/`; überspringt Installation/Build       | Schnell, aber nur gültig für operatorgesteuerte warme Leases |

GitHub Actions bereitet den Candidate-Checkout immer vor dem VM-Lauf vor. Sein
pnpm-Store wird nach Betriebssystem, Node-Version und Lockfile gecacht. Der VM-Source-Lauf verwendet außerdem
`/var/cache/crabbox/pnpm`, wenn vorhanden.

## Timing-Interpretation

`mantis-slack-desktop-smoke-report.md` enthält Phasen-Timings:

- `crabbox.warmup`: Start des Cloud-Providers, Desktop-/Browser-Bereitschaft und SSH.
- `crabbox.inspect`: Nachschlagen der Lease-Metadaten.
- `credentials.prepare`: Erwerb der Convex-Anmeldedaten-Lease.
- `crabbox.remote_run`: Synchronisierung, Browserstart, OpenClaw-Installation/Build oder
  Hydrate-Validierung, Gateway-Start, Screenshot und Videoaufnahme.
- `artifacts.copy`: rsync zurück aus der VM.

`crabbox.remote_run` kann als `accepted` markiert werden, wenn Crabbox einen Remote-Status ungleich null
zurückgibt, nachdem Mantis Metadaten kopiert hat, die belegen, dass das OpenClaw-Gateway
aktiv ist und das Setup abgeschlossen wurde. Behandeln Sie `accepted` als bestanden mit Erklärung,
nicht als fehlgeschlagenes Szenario.

Wenn der Lauf langsam ist:

- warmup dominiert: backen Sie ein besseres Crabbox-Provider-Image vor oder bewerben Sie es;
- remote_run dominiert in `source`: verwenden Sie eine warme Lease, verbessern Sie die Wiederverwendung des pnpm-Stores
  oder verschieben Sie Maschinenvoraussetzungen in das Provider-Image;
- remote_run dominiert in `prehydrated`: Der Remote-Arbeitsbereich war tatsächlich nicht
  bereit, oder das Gateway-/Browser-/Slack-Setup ist langsam;
- Artefaktkopie dominiert: prüfen Sie Videogröße und Inhalte des Artefaktverzeichnisses.

## Nachweis-Checkliste

Ein guter PR-Kommentar sollte Folgendes zeigen:

- Szenario-ID und Candidate-SHA;
- GitHub-Actions-Lauf-URL;
- Artefakt-URL;
- Inline-Screenshot;
- Inline-animierte Vorschau, wenn verfügbar;
- Links zu vollständigem MP4 und zugeschnittenem MP4;
- Bestanden-/Fehlgeschlagen-Status;
- Timing-Zusammenfassung im angehängten Bericht.

Committen Sie keine Screenshots oder Videos in das Repository. Bewahren Sie sie in GitHub-Actions-Artefakten oder im PR-Kommentar auf.

## Fehlerbehandlung

Wenn der Workflow vor dem VM-Lauf fehlschlägt, prüfen Sie zuerst den Actions-Job. Typische
Ursachen sind ein nicht vertrauenswürdiger `candidate_ref`, fehlende Umgebungs-Secrets oder ein fehlgeschlagener Candidate-Installations-/Build-Vorgang.

Wenn der VM-Lauf fehlschlägt, aber Screenshots zurückkopiert wurden, prüfen Sie:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Wenn der Lauf die Lease behalten hat, öffnen Sie VNC mit dem `crabbox vnc ...`-Befehl
aus dem Bericht. Stoppen Sie die Lease, wenn Sie fertig sind:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Wenn die Slack-Anmeldung abgelaufen ist, reparieren Sie sie in VNC auf einer behaltenen Lease und führen Sie den Lauf erneut mit
`--lease-id` aus. Backen Sie dieses Browserprofil nicht in ein Provider-Image.

## Verwandt

- [QA-Überblick](/de/concepts/qa-e2e-automation)
- [Slack-Kanal](/de/channels/slack)
- [Testen](/de/help/testing)
