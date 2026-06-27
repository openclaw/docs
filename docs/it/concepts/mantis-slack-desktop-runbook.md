---
read_when:
    - Esecuzione della QA desktop di Mantis Slack da GitHub o localmente
    - Debug delle esecuzioni lente di Mantis su desktop Slack
    - Scelta della modalità source, preidratata o warm-lease
    - Pubblicare prove con screenshot e video in una PR
summary: 'Runbook operativo per la QA desktop di Mantis Slack: dispatch GitHub, CLI locale, lease VNC già pronte, modalità di hydrate, interpretazione dei tempi, artefatti e gestione degli errori.'
title: Runbook desktop Slack di Mantis
x-i18n:
    generated_at: "2026-06-27T17:25:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9310b460a4da84afab72f9e5b5515a94e74b4f4a5030332bd2021d60deb07cc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA è la corsia con UI reale per i bug di classe Slack che richiedono un
desktop Linux, recupero VNC, Slack Web, un vero Gateway OpenClaw, screenshot,
video e un commento di evidenza sulla PR.

Usala quando gli unit test o la corsia live Slack headless non possono dimostrare il bug.

## Modello di archiviazione

Mantis usa tre diversi livelli di archiviazione:

- Immagine del provider: di proprietà di Crabbox e archiviata nell'account del provider cloud.
  Contiene capacità della macchina come Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, strumenti di build nativi e directory di cache vuote.
- Stato del lease caldo: di proprietà della sessione dell'operatore corrente. Può contenere un
  profilo browser con accesso effettuato, `/var/cache/crabbox/pnpm` e un checkout sorgente
  preparato mentre il lease è attivo.
- Artefatti Mantis: di proprietà dell'esecuzione OpenClaw. Si trovano in
  `.artifacts/qa-e2e/mantis/...`, poi GitHub Actions li carica e la
  Mantis GitHub App commenta le evidenze inline sulla PR.

Non inserire mai segreti, cookie del browser, stato di accesso Slack, checkout del repository,
`node_modules` o `dist/` in un'immagine provider preconfezionata.

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

I valori consentiti per `candidate_ref` sono intenzionalmente limitati perché il workflow
usa credenziali live: ascendenza dell'attuale `main`, tag di release o head di una PR aperta
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

Il commento sulla PR viene aggiornato sul posto tramite il marker nascosto
`<!-- mantis-slack-desktop-smoke -->`.

## CLI locale

Prova a freddo dai sorgenti:

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

Riusa un lease caldo:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Usa `--hydrate-mode prehydrated` solo quando lo spazio di lavoro remoto riutilizzato ha già
`node_modules` e un `dist/` compilato. Mantis fallisce in modo restrittivo se mancano.

Dimostra la UI di approvazione Slack nativa:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

La modalità checkpoint di approvazione è mutuamente esclusiva con `--gateway-setup`. Esegue
gli scenari opzionali `slack-approval-exec-native` e `slack-approval-plugin-native`
a meno che tu non passi flag `--scenario` espliciti per i checkpoint di approvazione; gli altri
scenari Slack vengono rifiutati prima dell'avvio della VM. Il runner QA Slack scrive
ogni file JSON di checkpoint dal messaggio reale dell'API Slack che ha osservato, poi il
watcher remoto rende quello snapshot del messaggio in
`approval-checkpoints/<scenario>-pending.png` e
`approval-checkpoints/<scenario>-resolved.png`. L'esecuzione fallisce se qualsiasi JSON
di checkpoint, evidenza del messaggio, JSON di ack o screenshot renderizzato manca o è vuoto.

I lease a freddo di GitHub Actions non hanno cookie Slack Web, quindi la loro acquisizione
browser può finire sulla schermata di accesso Slack. Per la prova dei checkpoint di approvazione, affidati alle
immagini dei checkpoint renderizzate e agli artefatti QA Slack invece che a
`slack-desktop-smoke.png`. Usa un lease caldo mantenuto con un profilo Slack Web
su cui è stato effettuato l'accesso manualmente solo quando lo screenshot del browser deve mostrare Slack Web.

## Modalità di idratazione

| Modalità      | Usala quando                              | Comportamento remoto                                                                  | Compromesso                                             |
| ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `source`      | Prova normale di PR, macchine a freddo, CI | Esegue `pnpm install --frozen-lockfile --prefer-offline` e `pnpm build` dentro la VM | Più lenta, prova più solida da checkout sorgente        |
| `prehydrated` | Hai preparato intenzionalmente un lease riutilizzato | Richiede `node_modules` e `dist/` esistenti; salta install/build                     | Veloce, ma valida solo per lease caldi controllati dall'operatore |

GitHub Actions prepara sempre il checkout candidato prima dell'esecuzione nella VM. Il suo
store pnpm viene memorizzato in cache per sistema operativo, versione Node e lockfile. Anche l'esecuzione sorgente nella VM
usa `/var/cache/crabbox/pnpm` quando presente.

## Interpretazione dei tempi

`mantis-slack-desktop-smoke-report.md` include i tempi delle fasi:

- `crabbox.warmup`: avvio del provider cloud, prontezza di desktop/browser e SSH.
- `crabbox.inspect`: ricerca dei metadati del lease.
- `credentials.prepare`: acquisizione del lease delle credenziali Convex.
- `crabbox.remote_run`: sincronizzazione, avvio del browser, install/build OpenClaw o
  convalida dell'idratazione, avvio del Gateway, screenshot e acquisizione video.
- `artifacts.copy`: rsync di ritorno dalla VM.

`crabbox.remote_run` può essere contrassegnato come `accepted` quando Crabbox restituisce uno stato
remoto diverso da zero dopo che Mantis ha copiato metadati che dimostrano che la configurazione del Gateway
OpenClaw è stata completata oppure che il comando QA Slack stesso è uscito correttamente.
Tratta `accepted` come superato con spiegazione, non come scenario fallito.

Se l'esecuzione è lenta:

- domina warmup: preconfeziona o promuovi un'immagine provider Crabbox migliore;
- domina remote_run in `source`: usa un lease caldo, migliora il riuso dello store pnpm
  o sposta i prerequisiti della macchina nell'immagine provider;
- domina remote_run in `prehydrated`: lo spazio di lavoro remoto non era effettivamente
  pronto, oppure la configurazione di Gateway/browser/Slack è lenta;
- domina la copia degli artefatti: ispeziona la dimensione del video e il contenuto della directory artefatti.

## Checklist delle evidenze

Un buon commento sulla PR dovrebbe mostrare:

- id scenario e SHA candidato;
- URL dell'esecuzione GitHub Actions;
- URL dell'artefatto;
- screenshot inline del checkpoint di approvazione, oppure uno screenshot Slack Web da un
  lease caldo con accesso effettuato;
- anteprima animata inline quando disponibile;
- link all'MP4 completo e all'MP4 ritagliato;
- stato superato/fallito;
- riepilogo dei tempi nel report allegato.

Non committare screenshot o video nel repository. Mantienili negli artefatti GitHub
Actions o nel commento sulla PR.

## Gestione degli errori

Se il workflow fallisce prima dell'esecuzione nella VM, ispeziona prima il job Actions. Le cause tipiche
sono `candidate_ref` non attendibile, segreti di ambiente mancanti o fallimento di install/build del candidato.

Se l'esecuzione nella VM fallisce ma gli screenshot sono stati copiati indietro, ispeziona:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Se l'esecuzione ha mantenuto il lease, apri VNC con il comando `crabbox vnc ...` del report.
Arresta il lease al termine:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Se l'accesso Slack è scaduto, riparalo in VNC su un lease mantenuto e riesegui con
`--lease-id`. Non incorporare quel profilo browser in un'immagine provider.

## Correlati

- [Panoramica QA](/it/concepts/qa-e2e-automation)
- [Canale Slack](/it/channels/slack)
- [Test](/it/help/testing)
