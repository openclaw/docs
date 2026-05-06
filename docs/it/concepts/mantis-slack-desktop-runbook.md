---
read_when:
    - Esecuzione del QA desktop Mantis Slack da GitHub o in locale
    - Debug delle esecuzioni desktop lente di Mantis Slack
    - Scelta della modalità source, prehydrated o warm-lease
    - Pubblicare prove tramite screenshot e video in una PR
summary: 'Runbook operativo per QA desktop di Mantis Slack: dispatch GitHub, CLI locale, lease VNC caldi, modalità di hydrate, interpretazione dei tempi, artefatti e gestione degli errori.'
title: Runbook desktop Slack di Mantis
x-i18n:
    generated_at: "2026-05-06T08:45:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83ca8792b53e5b14e592c2cbec6f6adfc936834e19f340f8e5eb3d467ecd3209
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA è il percorso con UI reale per i bug di classe Slack che richiedono un
desktop Linux, recupero VNC, Slack Web, un vero Gateway OpenClaw, screenshot,
video e un commento di evidenza sulla PR.

Usalo quando i test unitari o il percorso live Slack headless non possono dimostrare il bug.

## Modello di archiviazione

Mantis usa tre diversi livelli di archiviazione:

- Immagine del provider: di proprietà di Crabbox e archiviata nell'account del provider cloud.
  Contiene capacità della macchina come Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, strumenti di build nativi e directory di cache vuote.
- Stato del lease caldo: di proprietà della sessione operatore corrente. Può contenere un
  profilo browser autenticato, `/var/cache/crabbox/pnpm` e un checkout del sorgente
  preparato mentre il lease è attivo.
- Artefatti Mantis: di proprietà dell'esecuzione OpenClaw. Si trovano sotto
  `.artifacts/qa-e2e/mantis/...`, poi GitHub Actions li carica e la
  Mantis GitHub App commenta le evidenze inline sulla PR.

Non inserire mai segreti, cookie del browser, stato di login Slack, checkout del repository,
`node_modules` o `dist/` in un'immagine provider precotta.

## Dispatch GitHub

Esegui il workflow da `main`:

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

I valori `candidate_ref` consentiti sono intenzionalmente limitati perché il workflow
usa credenziali live: ancestry dell'attuale `main`, tag di release o head di una PR aperta
da `openclaw/openclaw`.

Il workflow scrive:

- artefatto caricato: `mantis-slack-desktop-smoke-<run-id>-<attempt>`;
- commento inline sulla PR dalla Mantis GitHub App;
- `slack-desktop-smoke.png`;
- `slack-desktop-smoke.mp4`;
- `slack-desktop-smoke-preview.gif`;
- `slack-desktop-smoke-change.mp4`;
- `mantis-slack-desktop-smoke-summary.json`;
- `mantis-slack-desktop-smoke-report.md`;
- log remoti come `slack-desktop-command.log`, `openclaw-gateway.log`,
  `chrome.log` e `ffmpeg.log`.

Il commento della PR viene aggiornato sul posto dal marker nascosto
`<!-- mantis-slack-desktop-smoke -->`.

## CLI locale

Prova sorgente a freddo:

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

Mantieni la VM per il recupero VNC:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Apri VNC:

```bash
crabbox vnc --provider aws --id <cbx_id> --open
```

Riutilizza un lease caldo:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Usa `--hydrate-mode prehydrated` solo quando l'area di lavoro remota riutilizzata ha già
`node_modules` e una `dist/` compilata. Mantis fallisce in modo chiuso se mancano.

## Modalità di idratazione

| Modalità      | Usala quando                              | Comportamento remoto                                                                   | Compromesso                                             |
| ------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `source`      | Normale prova PR, macchine a freddo, CI   | Esegue `pnpm install --frozen-lockfile --prefer-offline` e `pnpm build` dentro la VM   | Più lenta, prova più forte del checkout sorgente        |
| `prehydrated` | Hai preparato intenzionalmente un lease riutilizzato | Richiede `node_modules` e `dist/` esistenti; salta install/build                       | Veloce, ma valida solo per lease caldi controllati dall'operatore |

GitHub Actions prepara sempre il checkout candidato prima dell'esecuzione della VM. Il suo
store pnpm viene memorizzato nella cache per OS, versione Node e lockfile. Anche l'esecuzione
sorgente nella VM usa `/var/cache/crabbox/pnpm` quando presente.

## Interpretazione dei tempi

`mantis-slack-desktop-smoke-report.md` include i tempi delle fasi:

- `crabbox.warmup`: avvio del provider cloud, prontezza di desktop/browser e SSH.
- `crabbox.inspect`: ricerca dei metadati del lease.
- `credentials.prepare`: acquisizione del lease delle credenziali Convex.
- `crabbox.remote_run`: sincronizzazione, avvio del browser, install/build OpenClaw o
  convalida dell'idratazione, avvio del Gateway, screenshot e acquisizione video.
- `artifacts.copy`: rsync di ritorno dalla VM.

`crabbox.remote_run` può essere contrassegnato come `accepted` quando Crabbox restituisce uno
stato remoto diverso da zero dopo che Mantis ha copiato metadati che dimostrano che il Gateway OpenClaw
è attivo e la configurazione è stata completata. Tratta `accepted` come superato con spiegazione,
non come scenario fallito.

Se l'esecuzione è lenta:

- domina il warmup: precuoci o promuovi un'immagine provider Crabbox migliore;
- domina remote_run in `source`: usa un lease caldo, migliora il riutilizzo dello store pnpm,
  oppure sposta i prerequisiti della macchina nell'immagine provider;
- domina remote_run in `prehydrated`: l'area di lavoro remota non era realmente
  pronta, oppure la configurazione di Gateway/browser/Slack è lenta;
- domina la copia degli artefatti: ispeziona la dimensione del video e i contenuti della directory degli artefatti.

## Checklist delle evidenze

Un buon commento sulla PR dovrebbe mostrare:

- ID scenario e SHA candidato;
- URL dell'esecuzione GitHub Actions;
- URL dell'artefatto;
- screenshot inline;
- anteprima animata inline quando disponibile;
- link al MP4 completo e al MP4 tagliato;
- stato pass/fail;
- riepilogo dei tempi nel report allegato.

Non committare screenshot o video nel repository. Tienili negli artefatti di GitHub
Actions o nel commento della PR.

## Gestione degli errori

Se il workflow fallisce prima dell'esecuzione della VM, ispeziona prima il job Actions. Le cause tipiche
sono `candidate_ref` non attendibile, segreti dell'ambiente mancanti o errore di install/build del candidato.

Se l'esecuzione della VM fallisce ma gli screenshot sono stati copiati indietro, ispeziona:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Se l'esecuzione ha mantenuto il lease, apri VNC con il comando `crabbox vnc ...` del report.
Ferma il lease quando hai finito:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Se il login Slack è scaduto, riparalo in VNC su un lease mantenuto e riesegui con
`--lease-id`. Non incorporare quel profilo browser in un'immagine provider.

## Correlati

- [Panoramica QA](/it/concepts/qa-e2e-automation)
- [Canale Slack](/it/channels/slack)
- [Test](/it/help/testing)
