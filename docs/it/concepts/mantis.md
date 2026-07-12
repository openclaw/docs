---
read_when:
    - Creazione o esecuzione di test visivi QA live per i bug di OpenClaw
    - Aggiunta della verifica prima e dopo per una pull request
    - Aggiunta di scenari di trasporto in tempo reale per Discord, Slack, WhatsApp o altri servizi
    - Esecuzione di una verifica mirata nel browser della Control UI per un riferimento candidato
    - Debug delle esecuzioni di QA che richiedono screenshot, automazione del browser o accesso VNC
summary: Mantis acquisisce evidenze visive end-to-end per confronti tra trasporti in tempo reale e verifiche mirate nel browser limitate ai candidati, quindi allega gli artefatti alle PR.
title: Mantide
x-i18n:
    generated_at: "2026-07-12T06:56:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis pubblica evidenze visive della CI e un commento sulla PR relativo al comportamento di OpenClaw.
Gli scenari di trasporto live confrontano una baseline notoriamente errata con un ref candidato;
le corsie mirate per browser possono invece verificare un singolo candidato rispetto a un
trasporto simulato deterministico. Discord è stato il primo a essere distribuito, con autenticazione reale del bot, canali della gilda,
reazioni, thread e una verifica tramite browser. Esistono anche corsie per Slack, Telegram e per la chat mirata della Control
UI; WhatsApp e Matrix non sono implementati.

## Responsabilità

- OpenClaw (`extensions/qa-lab/src/mantis/*`): runtime degli scenari, CLI `pnpm openclaw qa mantis <command>`, schema delle evidenze.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): infrastruttura di test del trasporto live, bot driver/SUT, generatori di report/evidenze.
- Crabbox (`openclaw/crabbox`): macchine Linux preriscaldate, lease, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): punti di ingresso remoti, conservazione degli artefatti.
- ClawSweeper: analizza i comandi delle PR dei manutentori, avvia i workflow e pubblica il commento finale sulla PR.

## Comandi della CLI

Tutti i comandi hanno la forma `pnpm openclaw qa mantis <command>` e sono definiti in
`extensions/qa-lab/src/mantis/cli.ts`. Richiede `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
durante la compilazione/esecuzione (i workflow inclusi impostano `OPENCLAW_BUILD_PRIVATE_QA=1` e
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` prima della compilazione).

| Comando                         | Scopo                                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Verifica che il bot Mantis di Discord possa vedere la gilda/il canale, pubblicare messaggi e aggiungere reazioni.                                         |
| `run`                           | Esegue uno scenario prima/dopo sui ref di baseline e candidato (solo Discord).                                                                             |
| `desktop-browser-smoke`         | Acquisisce o riutilizza un desktop Crabbox, apre un browser visibile e acquisisce screenshot + video.                                                      |
| `slack-desktop-smoke`           | Acquisisce o riutilizza un desktop Crabbox, esegue al suo interno la QA di Slack, apre Slack Web e acquisisce le evidenze.                                  |
| `telegram-desktop-builder`      | Acquisisce o riutilizza un desktop Crabbox, installa Telegram Desktop e, facoltativamente, configura un Gateway OpenClaw.                                   |
| `visual-task` / `visual-driver` | Acquisizione generica del desktop Crabbox con asserzioni facoltative di comprensione delle immagini; `visual-driver` è la parte driver avviata tramite `crabbox record --while`. |

Ogni comando accetta `--repo-root <path>` e `--output-dir <path>`; i comandi Crabbox
accettano inoltre `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` e `--keep-lease`. I valori predefiniti della CLI locale
per provider/classe sono `hetzner`/`beast`, salvo diversa indicazione; i workflow CI
in genere li sostituiscono entrambi.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Chiama l'API REST di Discord (`https://discord.com/api/v10`) per recuperare l'utente
bot, la gilda, i canali della gilda e il canale di destinazione, verifica che il
canale appartenga alla gilda, quindi, salvo l'uso di `--skip-post`, pubblica un messaggio e
aggiunge una reazione `👀`. Scrive `mantis-discord-smoke-summary.json` e
`mantis-discord-smoke-report.md`.

Ordine di risoluzione del token: valore di `--token-file`, quindi `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(sostituibile con `--token-env`), quindi un file indicato da `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(sostituibile con `--token-file-env`). Gli ID di gilda/canale provengono da
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (sostituibili con
`--guild-id` / `--channel-id`) e devono essere snowflake Discord di 17-20 cifre. Impostare
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per sostituire ID e nomi di bot/gilda/canale/messaggio
con `<redacted>` nel riepilogo e nel report pubblicati.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Attualmente `--transport` accetta solo `discord`. `--scenario` è uno dei due
ID integrati, ciascuno con il proprio ref di baseline predefinito e le proprie
etichette previste prima/dopo (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Scenario                                   | Baseline predefinita                        | Risultato previsto per la baseline           | Risultato previsto per il candidato |
| ------------------------------------------ | ------------------------------------------ | -------------------------------------------- | ----------------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                                | `queued -> thinking -> done`        |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | la risposta nel thread omette l'allegato `filePath` | la risposta nel thread lo include   |

Il valore predefinito di `--candidate` è `HEAD`. Altri flag: `--credential-source`
(valore predefinito `convex`), `--credential-role` (valore predefinito `ci`), `--provider-mode`
(valore predefinito `live-frontier`), `--fast` (attivo per impostazione predefinita), `--skip-install`, `--skip-build`.

Il runner crea checkout `git worktree` scollegati per la baseline e il
candidato in `<output-dir>/worktrees/`, esegue `pnpm install`/`pnpm build` in
ciascuno (salvo esclusione), quindi esegue
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
su ogni worktree. Ogni corsia scrive `discord-qa-reaction-timelines.json`
insieme a una coppia `<scenario-id>-timeline.html`/`.png`; il runner copia queste
evidenze nelle directory `baseline/`/`candidate/`, scrive `comparison.json`,
`mantis-report.md` e `mantis-evidence.json` nella directory di output e
termina con un codice diverso da zero se il confronto non è riuscito (baseline `fail` e candidato
`pass`).

Il secondo scenario Discord (`discord-thread-reply-filepath-attachment`) pubblica
un messaggio principale con il bot driver, crea un thread reale, chiama l'azione
`message.thread-reply` del SUT con un `filePath` locale al repository, quindi interroga
periodicamente il thread per rilevare la risposta e il nome file dell'allegato. Si aspetta un allegato
denominato `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Acquisisce o riutilizza un desktop Crabbox, avvia un browser nella sessione VNC
puntandolo a `--browser-url` (valore predefinito `https://openclaw.ai`) o a un
`--html-file` renderizzato, attende, acquisisce uno screenshot con `scrot`, registra facoltativamente un MP4 con
`ffmpeg` e sincronizza nuovamente `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
in `--output-dir` tramite rsync.

Flag:

- `--lease-id <cbx_...>` riutilizza un desktop preriscaldato anziché crearne uno.
- `--browser-profile-dir <remote-path>` riutilizza una directory remota dei dati utente di Chrome, in modo che un desktop persistente mantenga l'accesso tra le esecuzioni (usato per un profilo di visualizzazione permanente di Discord Web).
- `--browser-profile-archive-env <name>` ripristina prima dell'avvio un archivio `.tgz` del profilo Chrome codificato in base64 dalla variabile d'ambiente indicata (valore predefinito `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); usato per verifiche con accesso effettuato, come Discord Web.
- `--video-duration <seconds>` controlla la durata dell'acquisizione MP4 (valore predefinito 10 s).
- `--keep-lease` (o `OPENCLAW_MANTIS_KEEP_VM=1`) mantiene aperto per l'ispezione VNC un lease creato da questa esecuzione; per impostazione predefinita, anche le esecuzioni non riuscite che hanno creato un lease lo mantengono.

Per le evidenze di Discord Web, Mantis usa un account di visualizzazione dedicato, non un token
bot. L'oracolo REST di Discord (tramite `qa discord`) rimane autorevole; quando
è impostato `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, lo scenario scrive anche un
artefatto URL di Discord Web e `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` lascia il
thread aperto abbastanza a lungo da consentire al browser di aprirlo.

Il workflow GitHub preferisce un profilo di visualizzazione persistente tramite
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (gli archivi completi dei profili possono superare
il limite di dimensione dei segreti di GitHub); per profili piccoli/di bootstrap può invece ripristinare un
file `.tgz` codificato in base64 da `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Se
nessuna delle due origini è configurata, il workflow pubblica comunque gli screenshot deterministici
della baseline e del candidato e registra nei log che la verifica con accesso effettuato è stata
saltata.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Acquisisce o riutilizza un desktop Crabbox, sincronizza il checkout nella VM, esegue
`pnpm openclaw qa slack` al suo interno, apre Slack Web nel browser VNC,
acquisisce il desktop e copia localmente sia gli artefatti della QA di Slack (`slack-qa/`) sia
lo screenshot/video VNC. Questa è l'unica configurazione Mantis in cui il
Gateway SUT e il browser vengono entrambi eseguiti nella stessa VM.

Con `--gateway-setup`, il comando crea nella VM una home OpenClaw eliminabile ma persistente
in `$HOME/.openclaw-mantis/slack-openclaw`, modifica la configurazione di Slack
Socket Mode per il canale di destinazione, avvia
`openclaw gateway run --dev --allow-unconfigured --port 38973` e lascia
Chrome in esecuzione nella sessione VNC; omettendo `--gateway-setup`, viene eseguita la normale
corsia QA di Slack da bot a bot.

Variabili d'ambiente richieste per `--credential-source env` (il valore predefinito locale è `env`; il ruolo
predefinito è `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` per la corsia remota del modello (se localmente è impostata solo `OPENAI_API_KEY`,
  Mantis la copia in `OPENCLAW_LIVE_OPENAI_KEY` prima di
  invocare Crabbox)

Con `--credential-source convex`, Mantis acquisisce dal pool condiviso la credenziale SUT di Slack
prima di creare la VM e inoltra nella VM l'ID del canale, il token dell'app e
il token del bot come variabili d'ambiente `OPENCLAW_MANTIS_SLACK_*`, così i workflow GitHub
richiedono solo il segreto del broker Convex, non i token Slack non elaborati.

Altri flag: `--slack-url <url>` apre un URL specifico (altrimenti Mantis ricava
`https://app.slack.com/client/<team>/<channel>` da `auth.test`);
`--slack-channel-id <id>` imposta il canale della lista consentita del Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controlla il profilo Chrome persistente
all'interno della VM (valore predefinito `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` esegue gli scenari di approvazione nativi di Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) e renderizza
screenshot dei checkpoint in sospeso/risolti anziché configurare il Gateway (incompatibile
con `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` e `--fast` vengono inoltrati alla
corsia live di Slack.

Gli screenshot dei checkpoint di approvazione vengono renderizzati dal messaggio dell'API Slack
osservato dallo scenario, non dall'interfaccia live di Slack; `slack-desktop-smoke.png` costituisce solo
una prova di Slack Web quando nel profilo del browser del lease era già stato
effettuato l'accesso.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Prenota o riutilizza un desktop Crabbox, installa Telegram Desktop nativo per Linux,
ripristina facoltativamente un archivio della sessione utente, configura OpenClaw con il
token del bot Telegram SUT prenotato, avvia
`openclaw gateway run --dev --allow-unconfigured --port 38974`, pubblica un
messaggio di disponibilità del bot driver nel gruppo privato prenotato, quindi acquisisce
uno screenshot e un MP4. Un token del bot configura soltanto OpenClaw; non esegue mai
l'accesso a Telegram Desktop. Il visualizzatore desktop è una sessione utente Telegram separata,
ripristinata da `--telegram-profile-archive-env <name>` oppure autenticata manualmente
tramite VNC e mantenuta attiva con `--keep-lease`.

Flag: `--lease-id <cbx_...>` esegue nuovamente lo scenario su una VM in cui è già stato effettuato l'accesso a
Telegram Desktop; `--telegram-profile-archive-env <name>` ripristina un archivio del profilo
`.tgz` codificato in base64 prima dell'avvio; `--telegram-profile-dir <remote-path>`
imposta la directory remota del profilo (valore predefinito `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` installa e apre soltanto Telegram Desktop;
`--credential-source`/`--credential-role` hanno come valori predefiniti `convex`/`maintainer`.

## Manifest delle prove

Ogni scenario pubblicato in una PR scrive `mantis-evidence.json` accanto
al relativo rapporto:

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

Il `path` dell'artefatto è relativo alla directory del manifest; `targetPath` è
relativo al prefisso degli artefatti R2/S3 configurato. `scripts/mantis/publish-pr-evidence.mjs`
rifiuta l'attraversamento dei percorsi e ignora le voci con `"required": false` quando il
file è assente.

Tipi di artefatti: `timeline` (screenshot deterministico prima/dopo),
`desktopScreenshot` (screenshot VNC/browser), `motionPreview` (GIF animata
incorporata ricavata dalla registrazione), `motionClip` (MP4 ritagliato in base al movimento), `fullVideo` (registrazione
completa), `metadata` (file complementare JSON/log), `report` (rapporto Markdown).

Struttura su disco degli artefatti di un'esecuzione:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Gli screenshot sono prove, non segreti, ma richiedono comunque attenzione nella redazione:
potrebbero comparire nomi di canali privati, nomi utente o contenuti dei messaggi. Impostare
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per i caricamenti pubblici degli artefatti; è
abilitato per impostazione predefinita nei workflow GitHub di Discord/Slack/Telegram.

## Automazione GitHub

`scripts/mantis/publish-pr-evidence.mjs` è lo strumento di pubblicazione riutilizzabile. I workflow
lo richiamano con il manifest, la PR di destinazione, la radice di destinazione degli artefatti, il marcatore del commento,
l'URL degli artefatti, l'URL dell'esecuzione e l'origine della richiesta. Carica gli artefatti dichiarati nel
bucket R2 di Mantis, crea un commento alla PR che presenta prima il riepilogo, con
immagini/anteprime incorporate e video collegati, quindi aggiorna il commento esistente associato al marcatore oppure
ne crea uno nuovo. Variabili d'ambiente richieste:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (i workflow impostano `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (i workflow impostano `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (i workflow impostano `https://artifacts.openclaw.ai`)

I commenti vengono pubblicati tramite l'app GitHub Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), non tramite `github-actions[bot]`, usando un commento
marcatore nascosto come chiave di upsert.

| Workflow                          | Attivazione                                                                                    | Operazione                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | avvio manuale                                                                            | Esegue `discord-smoke` sul riferimento scelto.                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | commento alla PR o avvio manuale                                                              | Crea worktree separati per riferimento di base e candidato, esegue `discord-status-reactions-tool-only` su ciascuno, visualizza la cronologia di ogni percorso in un browser desktop Crabbox, genera anteprime GIF/MP4 ritagliate in base al movimento con `crabbox media preview`, carica gli artefatti e pubblica le prove incorporate nella PR.                                 |
| `Mantis Scenario`                 | avvio manuale                                                                            | Dispatcher generico: accetta `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` e inoltra al workflow dello scenario corrispondente. |
| `Mantis Slack Desktop Smoke`      | avvio manuale                                                                            | Prenota un desktop Linux Crabbox (valore predefinito `aws`, con possibilità di scegliere `hetzner`), esegue `slack-desktop-smoke --gateway-setup` sul candidato, registra il desktop, genera un'anteprima del movimento, carica gli artefatti e pubblica le prove nella PR quando viene fornito un numero di PR.                                                      |
| `Mantis Telegram Live`            | commento alla PR o avvio manuale                                                              | Esegue il percorso di QA in tempo reale di Telegram tramite API bot (`openclaw qa telegram`), scrive `mantis-evidence.json` dal riepilogo del QA, visualizza l'HTML delle prove redatte tramite un browser desktop Crabbox, genera una GIF del movimento e pubblica le prove nella PR. Per questo percorso non è necessario accedere a Telegram Web.                               |
| `Mantis Telegram Desktop Proof`   | etichetta PR del manutentore (`mantis: telegram-visible-proof`) più commento alla PR, oppure avvio manuale | Prova agentica prima/dopo su Telegram Desktop nativo. Fornisce a Codex la PR, i riferimenti di base/candidato e le istruzioni del manutentore; Codex esegue il percorso di prova Crabbox di Telegram Desktop con un utente reale per entrambi i riferimenti e pubblica nella PR una tabella delle prove a 2 colonne.                                                              |
| `Mantis Web UI Chat Proof`        | commento alla PR o avvio manuale                                                              | Esegue sul candidato la prova Playwright mirata della chat dell'interfaccia di controllo OpenClaw, verifica che il browser invii tramite il Gateway simulato, acquisisce gli artefatti screenshot/video e pubblica le prove nella PR. Questo percorso dimostra soltanto la chat web, non WinUI/app nativa né prove visive arbitrarie.                           |

`Mantis Discord Status Reactions` e `Mantis Telegram Live` accettano entrambi
`baseline_ref`/`candidate_ref` (oppure `baseline=`/`candidate=` in un commento alla PR)
e verificano che lo SHA risolto sia un antenato di `origin/main`, un
tag di rilascio (`v*`) oppure l'head di una PR aperta, prima dell'esecuzione con
credenziali contenenti segreti.

Attivazioni tramite commento da una PR con accesso di scrittura/manutenzione/amministrazione:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Le attivazioni tramite commento per Telegram usano per impostazione predefinita lo SHA dell'head della PR come candidato e
`telegram-status-command` come scenario; accettano `provider=aws|hetzner` e
`lease=<cbx_...>` per selezionare uno specifico provider Crabbox o un
desktop preriscaldato. `Mantis Telegram Desktop Proof` risponde a un commento alla PR soltanto quando
la PR presenta già l'etichetta `mantis: telegram-visible-proof`.

Le attivazioni tramite commento per la chat dell'interfaccia web usano per impostazione predefinita lo SHA dell'head della PR come candidato. Eseguono
la prova della chat dell'interfaccia di controllo con Gateway simulato e pubblicano gli artefatti del browser; per
altre pagine web e superfici di app native, usare normali prove Playwright/browser, screenshot
dei manutentori, Crabbox o artefatti locali.

ClawSweeper può anche avviare direttamente uno scenario:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Macchine e segreti

I valori predefiniti della CLI locale di Crabbox sono `--provider hetzner --class beast`; sostituirli
con `--provider`, `--class`/`--machine-class` oppure
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. I workflow GitHub
sostituiscono comunemente entrambi (ad esempio `--class standard` e l'input di scelta del provider
`aws`/`hetzner` del workflow Slack). Se un provider è troppo
lento o non disponibile, aggiungerlo dietro la stessa interfaccia Crabbox anziché
codificare direttamente un ripiego.

Configurazione di base della VM: Linux con Chrome/Chromium compatibile con il desktop, accesso CDP, VNC/
noVNC, Node 22+ e pnpm, un checkout di OpenClaw e accesso in uscita al
trasporto di destinazione, a GitHub, ai provider dei modelli e al broker delle credenziali.

Nomi dei segreti usati nei workflow Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per i caricamenti pubblici degli artefatti
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (i workflow accettano anche
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` come ripiego e li associano
  ai nomi semplici prima di richiamare Crabbox)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Il runner Mantis non deve mai stampare token dei bot Discord/Slack/Telegram,
chiavi API dei provider, cookie del browser, contenuti dei profili di autenticazione, password VNC o
payload grezzi delle credenziali. Se un token viene esposto in un issue, una PR, una chat o un log,
ruotarlo dopo aver archiviato il segreto sostitutivo.

## Esiti delle esecuzioni

Gli scenari di trasporto prima/dopo distinguono questi esiti, affinché un ambiente
instabile non venga interpretato come una regressione del prodotto:

- **Bug riprodotto**: il riferimento di base ha avuto esito negativo nel modo previsto dallo scenario.
- **Errore dell'infrastruttura di test**: la configurazione dell'ambiente, le credenziali, l'API di trasporto, il browser
  o il provider hanno avuto esito negativo prima che l'oracolo fosse significativo.

La prova solo del candidato nel browser indica se il candidato ha superato le asserzioni relative al
Gateway simulato e all'interfaccia visibile; non dichiara la riproduzione sul riferimento di base.

## Aggiunta di uno scenario

Gli scenari di trasporto in tempo reale sono definiti in TypeScript per ciascun trasporto (vedere
`MANTIS_SCENARIO_CONFIGS` in `extensions/qa-lab/src/mantis/run.runtime.ts` per
la struttura prima/dopo di Discord), non tramite un formato di file dichiarativo autonomo.
Ogni scenario richiede: ID e titolo, trasporto, credenziali richieste, criterio per il riferimento
di base, criterio per il riferimento candidato, patch alla configurazione di OpenClaw, passaggi di configurazione/stimolo,
oracolo previsto per riferimento di base e candidato, destinazioni dell'acquisizione visiva, budget di
timeout e passaggi di pulizia.

La verifica mirata nel browser dei soli candidati può usare un test E2E deterministico dedicato
e un flusso di lavoro specifico. Mantienine esplicito l'ambito, convalida il ref del candidato prima
dell'esecuzione, isola la pubblicazione basata su segreti e genera lo stesso contratto
del manifesto delle evidenze.

Preferisci oracoli piccoli e tipizzati ai controlli visivi: stato delle reazioni o
riferimenti ai messaggi di Discord, stato dell'API del `ts` del thread/delle reazioni di Slack, ID
e intestazioni dei messaggi email. Usa schermate del browser quando l'interfaccia utente è l'unico elemento osservabile affidabile
e mantieni i controlli visivi come aggiunta a un oracolo basato sull'API della piattaforma, ove disponibile.

Dopo Discord, Slack e Telegram, la stessa struttura del runner si estende a WhatsApp
(accesso tramite QR, nuova identificazione, consegna, contenuti multimediali, reazioni) e Matrix
(stanze crittografate, relazioni tra thread e risposte, ripresa dopo il riavvio); nessuno dei due è
ancora implementato.

## Questioni aperte

- Quale bot Discord dovrebbe fungere da driver e quale da SUT quando viene riutilizzato il bot
  Mantis esistente?
- Per quanto tempo GitHub dovrebbe conservare gli artefatti Mantis per le PR?
- Quando ClawSweeper dovrebbe consigliare automaticamente uno scenario Mantis invece di
  attendere un comando di un manutentore?
- Le schermate dovrebbero essere oscurate o ritagliate prima del caricamento per le PR pubbliche?
