---
read_when:
    - Esecuzione del controllo qualità desktop di Mantis Slack da GitHub o in locale
    - Debug delle esecuzioni lente di Mantis su Slack desktop
    - Scelta della modalità sorgente, preidratata o con lease preriscaldato
    - Pubblicazione di screenshot e video come prove in una PR
summary: 'Runbook operativo per il QA desktop di Mantis Slack: avvio da GitHub, CLI locale, lease VNC già attive, modalità di idratazione, interpretazione delle tempistiche, artefatti e gestione degli errori.'
title: Manuale operativo di Mantis per Slack desktop
x-i18n:
    generated_at: "2026-07-12T06:59:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3e956d99fc43a7b6fe65e2e820812b0e0e8b9e32badd25be27c74d302ab30dc
    source_path: concepts/mantis-slack-desktop-runbook.md
    workflow: 16
---

Mantis Slack desktop QA è il percorso con interfaccia utente reale per i bug di tipo Slack che richiedono un
desktop Linux, il ripristino tramite VNC, Slack Web, un Gateway OpenClaw reale, schermate,
video e un commento con le prove nella PR. Usalo quando i test unitari o il percorso live
headless di Slack non possono dimostrare il bug.

## Modello di archiviazione

Mantis utilizza tre livelli di archiviazione:

- **Immagine del provider** - gestita da Crabbox, archiviata nell'account del provider cloud.
  Contiene le funzionalità della macchina (Chrome/Chromium, ffmpeg, scrot,
  Node/corepack/pnpm, strumenti di compilazione nativi) e directory della cache vuote.
- **Stato del lease attivo** - gestito dalla sessione dell'operatore corrente. Può contenere un
  profilo del browser con accesso effettuato, `/var/cache/crabbox/pnpm` e un checkout del codice
  sorgente preparato finché il lease è attivo.
- **Artefatti Mantis** - gestiti dall'esecuzione OpenClaw. Si trovano in
  `.artifacts/qa-e2e/mantis/...`; GitHub Actions li carica e la GitHub App Mantis
  inserisce nella PR un commento con le prove incorporate.

Non includere mai segreti, cookie del browser, stato di accesso a Slack, checkout del repository,
`node_modules` o `dist/` in un'immagine del provider.

## Avvio da GitHub

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

`candidate_ref` è soggetto a restrizioni perché il workflow utilizza credenziali reali: deve
risolversi nell'ascendenza del `main` corrente, in un tag di rilascio o nell'head di una PR aperta in
`openclaw/openclaw`.

Il workflow produce:

- artefatto caricato `mantis-slack-desktop-smoke-<run-id>-<attempt>`
- commento incorporato nella PR dalla GitHub App Mantis
- `slack-desktop-smoke.png`, `slack-desktop-smoke.mp4`
- `slack-desktop-smoke-preview.gif`, `slack-desktop-smoke-change.mp4`
- `mantis-slack-desktop-smoke-summary.json`, `mantis-slack-desktop-smoke-report.md`
- log remoti: `slack-desktop-command.log`, `openclaw-gateway.log`, `chrome.log`, `ffmpeg.log`

Il commento della PR viene aggiornato sul posto tramite il marcatore nascosto `<!-- mantis-slack-desktop-smoke -->`.

## CLI locale

Prova a freddo dal codice sorgente:

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

Mantieni la VM per il ripristino tramite VNC:

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

Riutilizza un lease attivo:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --lease-id <cbx_id-or-slug> \
  --gateway-setup \
  --scenario slack-canary \
  --hydrate-mode source
```

Usa `--hydrate-mode prehydrated` solo quando lo spazio di lavoro remoto riutilizzato dispone già
di `node_modules` e di una directory `dist/` compilata; in caso contrario Mantis interrompe l'esecuzione in modo sicuro.

Dimostra l'interfaccia utente nativa di approvazione di Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --provider aws \
  --class standard \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer \
  --hydrate-mode source
```

`--approval-checkpoints` è incompatibile con `--gateway-setup`. Esegue
gli scenari facoltativi `slack-approval-exec-native` e `slack-approval-plugin-native`,
a meno che non venga passato uno `--scenario` esplicito per un punto di controllo dell'approvazione; gli altri
scenari Slack vengono rifiutati prima dell'avvio della VM. Il runner QA di Slack scrive
ogni file JSON del punto di controllo dal messaggio reale dell'API Slack osservato, quindi
il processo di monitoraggio remoto visualizza tale messaggio in
`approval-checkpoints/<scenario>-pending.png` e
`approval-checkpoints/<scenario>-resolved.png`. L'esecuzione non riesce se un
file JSON del punto di controllo, una prova del messaggio, un JSON di conferma o una schermata generata è mancante
o vuota.

I lease a freddo di GitHub Actions non dispongono di cookie di Slack Web, quindi l'acquisizione del browser
può mostrare la schermata di accesso di Slack. Per la prova dei punti di controllo dell'approvazione, considera attendibili le
immagini generate dei punti di controllo e gli artefatti QA di Slack anziché
`slack-desktop-smoke.png`. Usa un lease attivo mantenuto con un profilo
Slack Web su cui l'accesso è stato effettuato manualmente solo quando la schermata del browser deve mostrare
Slack Web.

## Modalità di preparazione

| Modalità      | Quando usarla                              | Comportamento remoto                                                                   | Compromesso                                                        |
| ------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `source`      | Normale prova della PR, macchine a freddo, CI | Esegue `pnpm install --frozen-lockfile --prefer-offline` e `pnpm build` nella VM      | Più lenta, prova più solida basata sul checkout del codice sorgente |
| `prehydrated` | Hai preparato intenzionalmente un lease riutilizzato | Richiede `node_modules` e `dist/` esistenti; salta installazione e compilazione | Veloce, ma valida solo per lease attivi controllati dall'operatore  |

GitHub Actions prepara sempre il checkout candidato prima dell'esecuzione nella VM. Il relativo
store pnpm viene memorizzato nella cache in base a sistema operativo, versione di Node e lockfile. L'esecuzione `source` nella VM
riutilizza inoltre `/var/cache/crabbox/pnpm`, se presente.

## Interpretazione delle tempistiche

`mantis-slack-desktop-smoke-report.md` include le tempistiche delle fasi:

- `crabbox.warmup` - avvio del provider cloud, preparazione di desktop/browser, SSH.
- `crabbox.inspect` - recupero dei metadati del lease.
- `credentials.prepare` - acquisizione del lease delle credenziali Convex.
- `crabbox.remote_run` - sincronizzazione, avvio del browser, installazione/compilazione di OpenClaw o
  convalida della preparazione, avvio del Gateway, acquisizione di schermate e video.
- `artifacts.copy` - copia tramite rsync dalla VM.

`crabbox.remote_run` può mostrare `accepted` quando Crabbox restituisce uno stato remoto
diverso da zero, ma Mantis ha copiato metadati che dimostrano che la configurazione del Gateway OpenClaw
è stata completata oppure che il comando QA di Slack è terminato correttamente. Considera
`accepted` un esito positivo con spiegazione, non uno scenario non riuscito.

Se un'esecuzione è lenta:

- Se prevale la preparazione: precompila o promuovi un'immagine migliore del provider Crabbox.
- Se `remote_run` prevale in modalità `source`: usa un lease attivo, migliora il riutilizzo dello store
  pnpm oppure sposta i prerequisiti della macchina nell'immagine del provider.
- Se `remote_run` prevale in modalità `prehydrated`: lo spazio di lavoro remoto non era
  effettivamente pronto oppure la configurazione del Gateway, del browser o di Slack è lenta.
- Se prevale la copia degli artefatti: controlla le dimensioni del video e il contenuto della directory degli artefatti.

## Elenco di controllo delle prove

Un buon commento nella PR mostra:

- ID dello scenario e SHA candidato
- URL dell'esecuzione di GitHub Actions e URL dell'artefatto
- schermata incorporata del punto di controllo dell'approvazione oppure una schermata di Slack Web proveniente da un
  lease attivo con accesso effettuato
- anteprima animata incorporata, quando disponibile
- collegamenti al video MP4 completo e a quello ritagliato
- stato di successo/errore e riepilogo delle tempistiche del rapporto

Non eseguire il commit di schermate o video nel repository. Conservali negli
artefatti di GitHub Actions o nel commento della PR.

## Gestione degli errori

Se il workflow non riesce prima dell'esecuzione nella VM, controlla prima il job di Actions.
Cause tipiche: `candidate_ref` non attendibile, segreti dell'ambiente mancanti oppure
errore di installazione/compilazione del candidato.

Se l'esecuzione nella VM non riesce ma le schermate sono state copiate, controlla:

```bash
cat mantis-slack-desktop-smoke-report.md
cat mantis-slack-desktop-smoke-summary.json
cat slack-desktop-command.log
cat openclaw-gateway.log
cat chrome.log
cat ffmpeg.log
```

Se l'esecuzione ha mantenuto il lease, apri VNC con il comando `crabbox vnc ...`
indicato nel rapporto, quindi arresta il lease al termine:

```bash
crabbox stop --provider aws <cbx_id-or-slug>
```

Se l'accesso a Slack è scaduto, ripristinalo tramite VNC su un lease mantenuto ed esegui nuovamente il comando con
`--lease-id`. Non includere tale profilo del browser in un'immagine del provider.

## Contenuti correlati

- [Panoramica della QA](/it/concepts/qa-e2e-automation)
- [Canale Slack](/it/channels/slack)
- [Test](/it/help/testing)
