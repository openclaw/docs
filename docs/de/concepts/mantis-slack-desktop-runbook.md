---
read_when:
    - Mantis-Slack-Desktop-QA über GitHub oder lokal ausführen
    - Langsame Ausführungen der Mantis-Slack-Desktopanwendung debuggen
    - Auswahl zwischen Quell-, vorab befülltem oder Warm-Lease-Modus
    - Screenshot- und Videonachweise in einem PR veröffentlichen
summary: 'Betriebshandbuch für die Desktop-QA von Mantis Slack: GitHub-Auslösung, lokale CLI, vorgewärmte VNC-Leases, Hydratisierungsmodi, Zeitmessungsinterpretation, Artefakte und Fehlerbehandlung.'
title: Runbook für Mantis Slack Desktop
x-i18n:
    generated_at: "2026-07-12T15:17:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack Desktop-QA ist der Real-UI-Pfad für Fehler der Slack-Klasse, die einen
Linux-Desktop, VNC-Wiederherstellung, Slack Web, ein echtes OpenClaw-Gateway, Screenshots,
Videos und einen PR-Nachweiskommentar benötigen. Verwenden Sie ihn, wenn Unit-Tests oder der
headless Slack-Live-Pfad den Fehler nicht nachweisen können.

## Speichermodell

Mantis verwendet drei Speicherebenen:

- **Provider-Image** – gehört Crabbox und wird im Cloud-Provider-Konto gespeichert.
  Enthält Maschinenfunktionen (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, native Build-Werkzeuge) und leere Cache-Verzeichnisse.
- **Zustand der warmen Lease** – gehört zur aktuellen Operator-Sitzung. Kann ein
  angemeldetes Browserprofil, `/var/cache/crabbox/pnpm` und einen vorbereiteten
  Quellcode-Checkout enthalten, solange die Lease aktiv ist.
- **Mantis-Artefakte** – gehören zum OpenClaw-Lauf. Sie befinden sich unter
  `.artifacts/qa-e2e/mantis/...`; GitHub Actions lädt sie hoch, und die Mantis
  GitHub App kommentiert Inline-Nachweise im PR.

Betten Sie niemals Secrets, Browser-Cookies, den Slack-Anmeldestatus, Repository-Checkouts,
`node_modules` oder `dist/` in ein Provider-Image ein.

## GitHub-Auslösung

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

`candidate_ref` ist eingeschränkt, da der Workflow Live-Anmeldedaten verwendet: Er
muss auf die Abstammung des aktuellen `main`, ein Release-Tag oder den Head eines offenen PRs in
`openclaw/openclaw` aufgelöst werden.

Der Workflow erzeugt:

- das hochgeladene Artefakt `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- einen Inline-PR-Kommentar von der Mantis GitHub App
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- Remote-Protokolle: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

Der PR-Kommentar wird mithilfe der ausgeblendeten Markierung `<!-- mantis-slack-desktop-smoke -->` direkt aktualisiert.

## Lokale CLI

Nachweis mit kaltem Quellcode:

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

Behalten Sie die VM für die VNC-Wiederherstellung:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Öffnen Sie VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Verwenden Sie eine warme Lease erneut:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Verwenden Sie `--hydrate-mode prehydrated` nur, wenn der wiederverwendete Remote-Arbeitsbereich bereits
über `node_modules` und ein gebautes `dist/` verfügt; andernfalls verweigert Mantis die Ausführung.

Weisen Sie die native Slack-Genehmigungsoberfläche nach:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` und `--gateway-setup` schließen sich gegenseitig aus. Die Option führt
die explizit aktivierten Szenarien `slack-approval-exec-native` und `slack-approval-plugin-native`
aus, sofern Sie nicht mit `--scenario` ausdrücklich ein Genehmigungs-Checkpoint-Szenario übergeben;
andere Slack-Szenarien werden vor dem Start der VM abgelehnt. Der Slack-QA-Runner schreibt
jede Checkpoint-JSON-Datei aus der tatsächlich beobachteten Slack-API-Nachricht; anschließend
rendert der Remote-Watcher diese Nachricht als
`approval-checkpoints/<scenario>-pending.png` und
`approval-checkpoints/<scenario>-resolved.png`. Der Lauf schlägt fehl, wenn eine
Checkpoint-JSON-Datei, ein Nachrichtennachweis, eine Bestätigungs-JSON-Datei oder ein gerenderter Screenshot fehlt
oder leer ist.

Kalte GitHub-Actions-Leases besitzen keine Slack-Web-Cookies, sodass ihre Browseraufnahme
auf dem Slack-Anmeldebildschirm landen kann. Verlassen Sie sich für den Nachweis von Genehmigungs-Checkpoints auf die
gerenderten Checkpoint-Bilder und Slack-QA-Artefakte statt auf
`slack-desktop-smoke.png`. Verwenden Sie eine beibehaltene warme Lease mit einem manuell
angemeldeten Slack-Web-Profil nur dann, wenn der Browser-Screenshot selbst
Slack Web zeigen muss.

## Hydratisierungsmodi

| Modus         | Verwenden, wenn                            | Remote-Verhalten                                                                      | Abwägung                                                        |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `source`      | Normaler PR-Nachweis, kalte Maschinen, CI  | Führt `pnpm install --frozen-lockfile --prefer-offline` und `pnpm build` in der VM aus | Am langsamsten, stärkster Nachweis anhand des Quellcode-Checkouts |
| `prehydrated` | Sie absichtlich eine wiederverwendete Lease vorbereitet haben | Erfordert vorhandene `node_modules` und `dist/`; überspringt Installation/Build        | Schnell, aber nur für vom Operator kontrollierte warme Leases gültig |

GitHub Actions bereitet den Kandidaten-Checkout immer vor dem VM-Lauf vor. Sein
pnpm-Store wird nach Betriebssystem, Node-Version und Lockfile zwischengespeichert. Der `source`-Lauf der VM
verwendet außerdem `/var/cache/crabbox/pnpm` erneut, sofern vorhanden.

## Interpretation der Zeitmessungen

`mantis-slack-desktop-smoke-report.md` enthält Zeitmessungen für die Phasen:

- `crabbox.warmup` – Start des Cloud-Providers, Desktop-/Browserbereitschaft, SSH.
- `crabbox.inspect` – Abfrage der Lease-Metadaten.
- `credentials.prepare` – Abruf der Convex-Anmeldedaten-Lease.
- `crabbox.remote_run` – Synchronisierung, Browserstart, OpenClaw-Installation/-Build oder
  Hydratisierungsvalidierung, Gateway-Start, Screenshot- und Videoaufnahme.
- `artifacts.copy` – Rücksynchronisierung aus der VM per rsync.

`crabbox.remote_run` kann `accepted` anzeigen, wenn Crabbox einen von null verschiedenen
Remote-Status zurückgibt, Mantis jedoch kopierte Metadaten vorweisen kann, die belegen, dass entweder die Einrichtung des
OpenClaw-Gateways abgeschlossen wurde oder der Slack-QA-Befehl selbst erfolgreich beendet wurde. Behandeln Sie
`accepted` als bestanden mit Erläuterung, nicht als fehlgeschlagenes Szenario.

Wenn ein Lauf langsam ist:

- Warmup dominiert: Erstellen Sie ein besseres Crabbox-Provider-Image vorab oder stufen Sie es hoch.
- `remote_run` dominiert bei `source`: Verwenden Sie eine warme Lease, verbessern Sie die
  Wiederverwendung des pnpm-Stores oder verlagern Sie Maschinenvoraussetzungen in das Provider-Image.
- `remote_run` dominiert bei `prehydrated`: Der Remote-Arbeitsbereich war nicht
  tatsächlich bereit, oder die Einrichtung von Gateway, Browser oder Slack ist langsam.
- Das Kopieren der Artefakte dominiert: Prüfen Sie die Videogröße und den Inhalt des Artefaktverzeichnisses.

## Nachweis-Checkliste

Ein guter PR-Kommentar zeigt:

- Szenario-ID und Kandidaten-SHA
- URL des GitHub-Actions-Laufs und Artefakt-URL
- einen Inline-Screenshot des Genehmigungs-Checkpoints oder einen Slack-Web-Screenshot aus einer
  angemeldeten warmen Lease
- eine animierte Inline-Vorschau, sofern verfügbar
- Links zum vollständigen und zum gekürzten MP4
- Bestehens-/Fehlerstatus und die Zeitübersicht des Berichts

Committen Sie keine Screenshots oder Videos in das Repository. Bewahren Sie sie in
GitHub-Actions-Artefakten oder im PR-Kommentar auf.

## Fehlerbehandlung

Wenn der Workflow vor dem VM-Lauf fehlschlägt, prüfen Sie zuerst den Actions-Job.
Typische Ursachen: nicht vertrauenswürdiger `candidate_ref`, fehlende Umgebungs-Secrets oder ein
Fehler bei Installation/Build des Kandidaten.

Wenn der VM-Lauf fehlschlägt, aber Screenshots zurückkopiert wurden, prüfen Sie:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Wenn der Lauf die Lease beibehalten hat, öffnen Sie VNC mit dem Befehl `crabbox vnc ...`
aus dem Bericht und stoppen Sie anschließend die Lease:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Wenn die Slack-Anmeldung abgelaufen ist, reparieren Sie sie über VNC auf einer beibehaltenen Lease und führen Sie den Lauf mit
`--lease-id` erneut aus. Betten Sie dieses Browserprofil nicht in ein Provider-Image ein.

## Verwandte Themen

- [QA-Übersicht](/de/concepts/qa-e2e-automation)
- [Slack-Kanal](/de/channels/slack)
- [Tests](/de/help/testing)
