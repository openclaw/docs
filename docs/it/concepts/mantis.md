---
read_when:
    - Creazione o esecuzione di QA visiva dal vivo per i bug di OpenClaw
    - Aggiunta della verifica prima e dopo per una pull request
    - Aggiunta di scenari di trasporto in tempo reale per Discord, Slack, WhatsApp o altri servizi
    - Esecuzione di una verifica mirata nel browser per la Control UI su un riferimento candidato
    - Debug delle esecuzioni di QA che richiedono screenshot, automazione del browser o accesso VNC
summary: Mantis acquisisce prove visive end-to-end per confronti tra trasporti live e verifiche mirate nel browser limitate ai candidati, quindi allega gli artefatti alle PR.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T14:07:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis pubblica prove visive della CI e un commento nella PR sul comportamento di OpenClaw.
Gli scenari di trasporto live confrontano una baseline notoriamente errata con un ref candidato;
le corsie mirate per browser possono invece verificare un candidato rispetto a un trasporto
simulato deterministico. Discord è stato distribuito per primo con autenticazione reale del bot, canali del server,
reazioni, thread e una verifica tramite browser. Esistono anche corsie per Slack, Telegram e per la chat mirata della Control
UI; WhatsApp e Matrix non sono implementati.

## Responsabilità

- OpenClaw (`extensions/qa-lab/src/mantis/*`): runtime degli scenari, CLI `pnpm openclaw qa mantis <command>`, schema delle prove.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): infrastruttura di test del trasporto live, bot driver/SUT, generatori di report/prove.
- Crabbox (`openclaw/crabbox`): macchine Linux già predisposte, lease, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): punti di ingresso remoti, conservazione degli artefatti.
- ClawSweeper: analizza i comandi dei manutentori nelle PR, avvia i workflow, pubblica il commento finale nella PR.

## Comandi CLI

Tutti i comandi sono `pnpm openclaw qa mantis <command>`, definiti in
`extensions/qa-lab/src/mantis/cli.ts`. Richiede `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
durante la compilazione/esecuzione (i workflow inclusi impostano `OPENCLAW_BUILD_PRIVATE_QA=1` e
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` prima della compilazione).

| Comando                         | Scopo                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Verifica che il bot Discord di Mantis possa vedere il server/canale, pubblicare messaggi e aggiungere reazioni.                                                                                 |
| `run`                           | Esegue uno scenario prima/dopo sui ref baseline e candidato (solo Discord).                                                                           |
| `desktop-browser-smoke`         | Acquisisce/riutilizza un desktop Crabbox, apre un browser visibile, acquisisce schermata + video.                                                                        |
| `slack-desktop-smoke`           | Acquisisce/riutilizza un desktop Crabbox, esegue Slack QA al suo interno, apre Slack Web e acquisisce le prove.                                                                  |
| `telegram-desktop-builder`      | Acquisisce/riutilizza un desktop Crabbox, installa Telegram Desktop e, facoltativamente, configura un Gateway OpenClaw.                                                        |
| `visual-task` / `visual-driver` | Acquisizione generica del desktop Crabbox con asserzioni facoltative di comprensione delle immagini; `visual-driver` è la parte driver avviata in `crabbox record --while`. |

Ogni comando accetta `--repo-root <path>` e `--output-dir <path>`; i comandi Crabbox
accettano anche `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` e `--keep-lease`. I valori predefiniti della CLI locale
per provider/classe sono `hetzner`/`beast`, salvo diversa indicazione; i workflow CI
in genere sostituiscono entrambi.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Chiama l'API REST di Discord (`https://discord.com/api/v10`) per recuperare l'utente
del bot, il server, i canali del server e il canale di destinazione, verifica che il
canale appartenga al server, quindi (a meno che non sia impostato `--skip-post`) pubblica un messaggio e
aggiunge una reazione `👀`. Scrive `mantis-discord-smoke-summary.json` e
`mantis-discord-smoke-report.md`.

Ordine di risoluzione del token: valore `--token-file`, quindi `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(sostituibile con `--token-env`), quindi un file indicato da `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(sostituibile con `--token-file-env`). Gli ID del server/canale provengono da
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (sostituibili con
`--guild-id` / `--channel-id`) e devono essere snowflake Discord di 17-20 cifre. Impostare
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per sostituire ID e nomi di bot/server/canale/messaggio
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

`--transport` attualmente accetta solo `discord`. `--scenario` è uno dei due
ID integrati, ciascuno con il proprio ref baseline predefinito e le etichette prima/dopo
previste (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Scenario                                   | Baseline predefinita                           | Risultato previsto per la baseline                         | Risultato previsto per il candidato            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | la risposta nel thread omette l'allegato `filePath` | la risposta nel thread lo include     |

Il valore predefinito di `--candidate` è `HEAD`. Altri flag: `--credential-source`
(valore predefinito `convex`), `--credential-role` (valore predefinito `ci`), `--provider-mode`
(valore predefinito `live-frontier`), `--fast` (attivo per impostazione predefinita), `--skip-install`, `--skip-build`.

Il runner crea checkout `git worktree` separati per la baseline e il
candidato in `<output-dir>/worktrees/`, esegue `pnpm install`/`pnpm build` in
ciascuno (a meno che non vengano saltati), quindi esegue
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
su ogni worktree. Ogni corsia scrive `discord-qa-reaction-timelines.json`
oltre a una coppia `<scenario-id>-timeline.html`/`.png`; il runner copia queste
prove rispettivamente in `baseline/`/`candidate/`, scrive `comparison.json`,
`mantis-report.md` e `mantis-evidence.json` nella directory di output e
termina con un codice diverso da zero se il confronto non è riuscito (baseline `fail` e candidato
`pass`).

Il secondo scenario Discord (`discord-thread-reply-filepath-attachment`) pubblica
un messaggio principale con il bot driver, crea un thread reale, chiama l'azione
`message.thread-reply` del SUT con un `filePath` locale al repository, quindi interroga
periodicamente il thread per ottenere la risposta e il nome file dell'allegato. Prevede un allegato
denominato `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Acquisisce o riutilizza un desktop Crabbox, avvia un browser nella sessione VNC
puntato a `--browser-url` (valore predefinito `https://openclaw.ai`) o a un
`--html-file` sottoposto a rendering, attende, acquisisce una schermata con `scrot`, facoltativamente registra un MP4 con
`ffmpeg` e sincronizza tramite rsync `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
in `--output-dir`.

Flag:

- `--lease-id <cbx_...>` riutilizza un desktop già predisposto invece di crearne uno.
- `--browser-profile-dir <remote-path>` riutilizza una directory dei dati utente di Chrome remota, affinché un desktop persistente mantenga l'accesso tra le esecuzioni (utilizzata per un profilo di visualizzazione Discord Web di lunga durata).
- `--browser-profile-archive-env <name>` ripristina prima dell'avvio un archivio del profilo Chrome `.tgz` in base64 da quella variabile di ambiente (valore predefinito `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); utilizzato per verifiche con accesso effettuato, come Discord Web.
- `--video-duration <seconds>` controlla la durata dell'acquisizione MP4 (valore predefinito 10s).
- `--keep-lease` (o `OPENCLAW_MANTIS_KEEP_VM=1`) mantiene aperto per l'ispezione VNC un lease creato da questa esecuzione; per impostazione predefinita, anche le esecuzioni non riuscite che hanno creato un lease lo mantengono.

Per le prove di Discord Web, Mantis utilizza un account di visualizzazione dedicato, non un token
bot. L'oracolo REST di Discord (tramite `qa discord`) rimane autorevole; quando
è impostato `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, lo scenario scrive anche un
artefatto URL di Discord Web e `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` lascia il
thread aperto abbastanza a lungo da consentire al browser di aprirlo.

Il workflow GitHub preferisce un profilo di visualizzazione persistente tramite
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (gli archivi dei profili completi possono superare
il limite di dimensione dei secret di GitHub); per profili piccoli/di bootstrap può invece ripristinare un
`.tgz` in base64 da `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Se nessuna delle
due origini è configurata, il workflow pubblica comunque le schermate deterministiche
di baseline/candidato e registra che la verifica con accesso effettuato è stata
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
acquisisce il desktop e copia localmente sia gli artefatti QA di Slack (`slack-qa/`) sia
la schermata/il video VNC. Questa è l'unica configurazione Mantis in cui il
Gateway SUT e il browser vengono entrambi eseguiti nella stessa VM.

Con `--gateway-setup`, il comando crea una home OpenClaw usa e getta persistente
in `$HOME/.openclaw-mantis/slack-openclaw` nella VM, modifica la configurazione
Socket Mode di Slack per il canale di destinazione, avvia
`openclaw gateway run --dev --allow-unconfigured --port 38973` e lascia
Chrome in esecuzione nella sessione VNC; omettendo `--gateway-setup` viene invece eseguita la normale
corsia QA bot-to-bot di Slack.

Variabili di ambiente richieste per `--credential-source env` (il valore predefinito locale è `env`; il ruolo
predefinito è `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` per la corsia del modello remoto (se localmente è impostato solo `OPENAI_API_KEY`,
  Mantis lo copia in `OPENCLAW_LIVE_OPENAI_KEY` prima
  di invocare Crabbox)

Con `--credential-source convex`, Mantis acquisisce in lease le credenziali SUT di Slack dal
pool condiviso prima di creare la VM e inoltra ID del canale, token dell'app e
token del bot nella VM come variabili di ambiente `OPENCLAW_MANTIS_SLACK_*`, pertanto i workflow GitHub
richiedono solo il secret del broker Convex, non i token Slack non elaborati.

Altri flag: `--slack-url <url>` apre un URL specifico (altrimenti Mantis ricava
`https://app.slack.com/client/<team>/<channel>` da `auth.test`);
`--slack-channel-id <id>` imposta il canale nell'elenco consentito del Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controlla il profilo Chrome persistente
nella VM (valore predefinito `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` esegue gli scenari nativi di approvazione di Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) e genera
schermate dei checkpoint in sospeso/risolti invece della configurazione del Gateway (opzione
incompatibile con `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` e `--fast` vengono passati alla
corsia live di Slack.

Le schermate dei checkpoint di approvazione vengono generate dal messaggio API di Slack
osservato dallo scenario, non dall'interfaccia Slack live; `slack-desktop-smoke.png` costituisce solo
una prova di Slack Web quando nel profilo del browser del lease era già stato
effettuato l'accesso.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Acquisisce o riutilizza un desktop Crabbox, installa Telegram Desktop nativo per Linux,
facoltativamente ripristina un archivio della sessione utente, configura OpenClaw con il
token del bot SUT di Telegram acquisito in lease, avvia
`openclaw gateway run --dev --allow-unconfigured --port 38974`, pubblica un
messaggio di disponibilità del bot driver nel gruppo privato acquisito in lease, quindi acquisisce una
schermata e un MP4. Un token bot configura solo OpenClaw; non effettua mai
l'accesso a Telegram Desktop. Il visualizzatore desktop è una sessione utente Telegram separata,
ripristinata da `--telegram-profile-archive-env <name>` oppure autenticata manualmente
tramite VNC e mantenuta attiva con `--keep-lease`.

Flag: `--lease-id <cbx_...>` riesegue il comando su una VM in cui l'accesso a
Telegram Desktop è già stato effettuato; `--telegram-profile-archive-env <name>` ripristina prima dell'avvio un archivio del profilo
`.tgz` in base64; `--telegram-profile-dir <remote-path>`
imposta la directory remota del profilo (valore predefinito `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` installa e apre soltanto Telegram Desktop;
i valori predefiniti di `--credential-source`/`--credential-role` sono `convex`/`maintainer`.

## Manifest delle prove

Ogni scenario che pubblica in una PR scrive `mantis-evidence.json` accanto al
proprio report:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "QA delle reazioni di stato Discord di Mantis",
  "summary": "Riepilogo principale leggibile per il commento della PR.",
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
      "label": "Baseline solo in coda",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Sequenza temporale Discord della baseline",
      "width": 420
    }
  ]
}
```

L'artefatto `path` è relativo alla directory del manifesto; `targetPath` è
relativo al prefisso degli artefatti R2/S3 configurato. `scripts/mantis/publish-pr-evidence.mjs`
rifiuta l'attraversamento dei percorsi e ignora le voci con `"required": false` quando il
file è mancante.

Tipi di artefatto: `timeline` (schermata deterministica prima/dopo),
`desktopScreenshot` (schermata VNC/browser), `motionPreview` (GIF animata incorporata
dalla registrazione), `motionClip` (MP4 ritagliato in base al movimento), `fullVideo` (registrazione
completa), `metadata` (file complementare JSON/log), `report` (report Markdown).

Struttura degli artefatti di un'esecuzione su disco:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Le schermate sono prove, non segreti, ma richiedono comunque un'attenta
redazione: possono comparire nomi di canali privati, nomi utente o contenuti dei
messaggi. Impostare `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per i caricamenti pubblici degli artefatti; è
abilitato per impostazione predefinita nei workflow GitHub di Discord/Slack/Telegram.

## Automazione GitHub

`scripts/mantis/publish-pr-evidence.mjs` è il publisher riutilizzabile. I workflow
lo chiamano con il manifesto, la PR di destinazione, la radice di destinazione degli artefatti, il marcatore del commento,
l'URL degli artefatti, l'URL dell'esecuzione e l'origine della richiesta. Carica gli artefatti dichiarati nel
bucket R2 di Mantis, genera un commento della PR che presenta prima il riepilogo, con
immagini/anteprime incorporate e video collegati, quindi aggiorna il commento esistente con il marcatore oppure
ne crea uno nuovo. Variabili di ambiente richieste:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (i workflow impostano `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (i workflow impostano `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (i workflow impostano `https://artifacts.openclaw.ai`)

I commenti vengono pubblicati tramite la GitHub App Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), non `github-actions[bot]`, usando un commento
marcatore nascosto come chiave di upsert.

| Workflow                          | Attivazione                                                                                    | Operazione                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | invio manuale                                                                            | Esegue `discord-smoke` sul ref selezionato.                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | commento sulla PR o invio manuale                                                              | Crea worktree separati per baseline/candidato, esegue `discord-status-reactions-tool-only` su ciascuno, visualizza la sequenza temporale di ogni corsia in un browser desktop Crabbox, genera anteprime GIF/MP4 ritagliate in base al movimento con `crabbox media preview`, carica gli artefatti e pubblica prove incorporate nella PR.                                 |
| `Mantis Scenario`                 | invio manuale                                                                            | Dispatcher generico: riceve `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` e inoltra al workflow dello scenario corrispondente. |
| `Mantis Slack Desktop Smoke`      | invio manuale                                                                            | Acquisisce in leasing un desktop Linux Crabbox (valore predefinito `aws`, possibilità di scegliere `hetzner`), esegue `slack-desktop-smoke --gateway-setup` sul candidato, registra il desktop, genera un'anteprima del movimento, carica gli artefatti e pubblica prove nella PR quando viene fornito un numero di PR.                                                      |
| `Mantis Telegram Live`            | commento sulla PR o invio manuale                                                              | Esegue la corsia QA Telegram in tempo reale tramite API del bot (`openclaw qa telegram`), scrive `mantis-evidence.json` dal riepilogo QA, visualizza l'HTML delle prove redatte tramite un browser desktop Crabbox, genera una GIF del movimento e pubblica le prove nella PR. Per questa corsia non è richiesto l'accesso a Telegram Web.                               |
| `Mantis Telegram Desktop Proof`   | etichetta della PR del manutentore (`mantis: telegram-visible-proof`) più commento sulla PR, oppure invio manuale | Prova agentica nativa prima/dopo di Telegram Desktop. Fornisce a Codex la PR, i ref di baseline/candidato e le istruzioni del manutentore; Codex esegue la corsia di prova Crabbox Telegram Desktop con utente reale per entrambi i ref e pubblica nella PR una tabella delle prove a 2 colonne.                                                              |
| `Mantis Web UI Chat Proof`        | commento sulla PR o invio manuale                                                              | Esegue sul candidato la prova Playwright mirata della chat nella Control UI di OpenClaw, verifica che il browser invii tramite il Gateway simulato, acquisisce artefatti di schermate/video e pubblica le prove nella PR. Questa corsia dimostra solo la chat web, non WinUI/app native o prove visive arbitrarie.                           |

`Mantis Discord Status Reactions` e `Mantis Telegram Live` accettano entrambi
`baseline_ref`/`candidate_ref` (oppure `baseline=`/`candidate=` in un commento sulla PR)
e verificano che lo SHA risolto sia un predecessore di `origin/main`, un
tag di rilascio (`v*`) o l'head di una PR aperta prima di eseguire
con credenziali contenenti segreti.

Trigger tramite commento, da una PR con accesso in scrittura/manutenzione/amministrazione:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

I trigger tramite commento per Telegram usano per impostazione predefinita lo SHA head della PR come candidato e
`telegram-status-command` come scenario; accettano `provider=aws|hetzner` e
`lease=<cbx_...>` per selezionare uno specifico provider Crabbox o un
desktop preriscaldato. `Mantis Telegram Desktop Proof` risponde a un commento sulla PR solo quando
la PR ha già l'etichetta `mantis: telegram-visible-proof`.

I trigger tramite commento per la chat dell'interfaccia web usano per impostazione predefinita lo SHA head della PR come candidato. Eseguono
la prova della chat nella Control UI con Gateway simulato e pubblicano gli artefatti del browser; per
altre pagine web e superfici di app native utilizzare normali prove Playwright/browser,
schermate del manutentore, Crabbox o artefatti locali.

ClawSweeper può anche avviare direttamente uno scenario:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Macchine e segreti

I valori predefiniti della CLI Crabbox locale sono `--provider hetzner --class beast`; sostituirli
con `--provider`, `--class`/`--machine-class` oppure
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. I workflow GitHub
sostituiscono comunemente entrambi (ad esempio `--class standard` e l'input
per la scelta del provider `aws`/`hetzner` del workflow Slack). Se un provider è troppo
lento o non disponibile, aggiungerlo dietro la stessa interfaccia Crabbox anziché
codificare un fallback.

Baseline della VM: Linux con Chrome/Chromium compatibile con desktop, accesso CDP, VNC/
noVNC, Node 22.22.3+, 24.15+ o 25.9+ e pnpm, un checkout di OpenClaw e
accesso in uscita al trasporto di destinazione, a GitHub, ai provider di modelli e al
broker delle credenziali.

Nomi di credenziali e variabili di ambiente usati nei comandi e nei workflow Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- Il `qa mantis run --credential-source env` locale richiede inoltre
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  e `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`. I workflow GitHub utilizzano normalmente
  `--credential-source convex` e le credenziali del broker indicate di seguito anziché token
  bot Discord non elaborati.
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per i caricamenti pubblici degli artefatti
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (oppure il valore specifico per la prova di Telegram Desktop
  `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (i workflow accettano anche
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` come fallback e li mappano
  sui nomi semplici prima di invocare Crabbox)
- `CRABBOX_ACCESS_CLIENT_ID`, `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Il runner Mantis non deve mai stampare token bot Discord/Slack/Telegram,
chiavi API dei provider, cookie del browser, contenuti dei profili di autenticazione, password VNC o
payload di credenziali non elaborati. Se un token viene esposto in un problema, una PR, una chat o un log,
ruotarlo dopo aver archiviato il segreto sostitutivo.

## Esiti delle esecuzioni

Gli scenari di trasporto prima/dopo distinguono questi esiti affinché un ambiente
instabile non venga interpretato come una regressione del prodotto:

- **Bug riprodotto**: la baseline non ha superato la prova nel modo previsto dallo scenario.
- **Errore dell'harness**: la configurazione dell'ambiente, le credenziali, l'API del trasporto, il browser
  o il provider non hanno funzionato prima che l'oracolo potesse produrre un risultato significativo.

La prova solo sul candidato nel browser indica se il candidato ha superato le asserzioni
del Gateway simulato e dell'interfaccia utente visibile; non dichiara la riproduzione sulla baseline.

## Aggiunta di uno scenario

Gli scenari di trasporto in tempo reale sono definiti in TypeScript per ciascun trasporto (vedere
`MANTIS_SCENARIO_CONFIGS` in `extensions/qa-lab/src/mantis/run.runtime.ts` per
la struttura prima/dopo di Discord), non in un formato di file dichiarativo autonomo.
Ogni scenario richiede: id e titolo, trasporto, credenziali richieste, criteri dei ref
di baseline, criteri dei ref del candidato, patch alla configurazione di OpenClaw, passaggi di configurazione/stimolo,
oracolo previsto per baseline e candidato, obiettivi di acquisizione visiva, budget
di timeout e passaggi di pulizia.

Le prove mirate nel browser solo sul candidato possono utilizzare un test E2E deterministico
e un workflow dedicati. Mantenerne esplicito l'ambito, convalidare il ref del candidato prima
dell'esecuzione, isolare la pubblicazione basata sui segreti ed emettere lo stesso contratto
del manifesto delle prove.

Preferire oracoli piccoli e tipizzati ai controlli visivi: stato delle reazioni Discord o
riferimenti ai messaggi, `ts` dei thread Slack/stato API delle reazioni, ID
e intestazioni dei messaggi email. Utilizzare schermate del browser quando l'interfaccia utente è l'unico elemento osservabile affidabile
e mantenere i controlli visivi aggiuntivi rispetto a un oracolo basato sull'API della piattaforma, se disponibile.

Dopo Discord, Slack e Telegram, la stessa struttura del runner si estende a WhatsApp
(accesso tramite QR, nuova identificazione, consegna, contenuti multimediali, reazioni) e Matrix
(stanze crittografate, relazioni thread/risposta, ripresa dopo il riavvio); nessuno dei due è
ancora implementato.

## Domande aperte

- Quale bot Discord deve fungere da driver e quale da SUT quando viene riutilizzato il bot Mantis
  esistente?
- Per quanto tempo GitHub deve conservare gli artefatti Mantis per le PR?
- Quando ClawSweeper deve consigliare automaticamente uno scenario Mantis invece di
  attendere un comando di un maintainer?
- Gli screenshot devono essere oscurati o ritagliati prima del caricamento per le PR pubbliche?
