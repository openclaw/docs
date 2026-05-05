---
read_when:
    - Creazione o esecuzione della QA visiva live per i bug di OpenClaw
    - Aggiunta della verifica prima e dopo per una richiesta di pull
    - Aggiunta di scenari per Discord, Slack, WhatsApp o altri trasporti in tempo reale
    - Risoluzione dei problemi delle esecuzioni QA che richiedono schermate, automazione del browser o accesso VNC
summary: Mantis è il sistema di verifica visiva integrale per riprodurre i bug di OpenClaw sui trasporti attivi, acquisire prove prima e dopo e allegare artefatti alle PR.
title: Mantide
x-i18n:
    generated_at: "2026-05-05T06:16:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis è il sistema di verifica end-to-end di OpenClaw per bug che richiedono un
runtime reale, un trasporto reale e prove visibili. Esegue uno scenario contro un
ref noto come non funzionante, acquisisce prove, esegue lo stesso scenario contro
un ref candidato e pubblica il confronto come artefatti che un manutentore può
ispezionare da una PR o da un comando locale.

Mantis inizia con Discord perché Discord ci offre una prima lane ad alto valore:
autenticazione reale del bot, canali guild reali, reazioni, thread, comandi
nativi e una UI browser in cui gli esseri umani possono confermare visivamente
ciò che il trasporto ha mostrato.

## Obiettivi

- Riprodurre un bug da una issue GitHub o da una PR con la stessa forma di
  trasporto vista dagli utenti.
- Acquisire un artefatto **prima** sul ref di baseline prima di applicare la
  correzione.
- Acquisire un artefatto **dopo** sul ref candidato dopo aver applicato la
  correzione.
- Usare un oracolo deterministico quando possibile, come una lettura di reazione
  tramite Discord REST o un controllo della trascrizione del canale.
- Acquisire screenshot quando il bug ha una superficie UI visibile.
- Eseguire localmente da una CLI controllata da agent e da remoto da GitHub.
- Preservare abbastanza stato macchina per il recupero tramite VNC quando login,
  automazione browser o autenticazione del provider si bloccano.
- Pubblicare uno stato conciso su un canale Discord dell'operatore quando
  l'esecuzione è bloccata, richiede aiuto manuale tramite VNC o termina.

## Non Obiettivi

- Mantis non sostituisce gli unit test. Un'esecuzione Mantis dovrebbe di solito
  diventare un test di regressione più piccolo dopo che la correzione è stata
  compresa.
- Mantis non è il normale gate CI veloce. È più lento, usa credenziali live ed è
  riservato a bug in cui l'ambiente live conta.
- Mantis non dovrebbe richiedere un essere umano per il funzionamento normale.
  Il VNC manuale è un percorso di recupero, non il percorso principale.
- Mantis non memorizza segreti grezzi in artefatti, log, screenshot, report
  Markdown o commenti PR.

## Proprietà

Mantis vive nello stack QA di OpenClaw.

- OpenClaw possiede il runtime degli scenari, gli adattatori di trasporto, lo
  schema delle prove e la CLI locale sotto `pnpm openclaw qa mantis`.
- QA Lab possiede i componenti dell'harness di trasporto live, gli helper di
  cattura browser e gli autori di artefatti.
- Crabbox possiede macchine Linux pre-riscaldate quando serve una VM remota.
- GitHub Actions possiede l'entrypoint del workflow remoto e la conservazione
  degli artefatti.
- ClawSweeper possiede il routing dei commenti GitHub: parsing dei comandi dei
  manutentori, dispatch del workflow e pubblicazione del commento PR finale.
- Gli agent OpenClaw guidano Mantis tramite Codex quando uno scenario richiede
  configurazione agentica, debug o segnalazione di stato bloccato.

Questo confine mantiene la conoscenza del trasporto in OpenClaw, la
pianificazione delle macchine in Crabbox e il collante del workflow dei
manutentori in ClawSweeper.

## Forma Del Comando

Il primo comando locale verifica bot Discord, guild, canale, invio messaggio,
invio reazione e percorso degli artefatti:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Il runner locale prima e dopo accetta questa forma:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Il runner crea worktree baseline e candidato detached sotto la directory di
output, installa le dipendenze, compila ogni ref, esegue lo scenario con
`--allow-failures`, quindi scrive `baseline/`, `candidate/`, `comparison.json` e
`mantis-report.md`. Per il primo scenario Discord, una verifica riuscita
significa che lo stato baseline è `fail` e lo stato candidato è `pass`.

La prima primitiva VM/browser è lo smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Noleggia o riusa una macchina desktop Crabbox, avvia un browser visibile dentro
la sessione VNC, acquisisce il desktop, recupera gli artefatti nella directory di
output locale e scrive il comando di riconnessione nel report. Il comando usa per
impostazione predefinita il provider Hetzner perché è il primo provider con
copertura desktop/VNC funzionante nella lane Mantis. Sovrascrivilo con
`--provider`, `--crabbox-bin` o `OPENCLAW_MANTIS_CRABBOX_PROVIDER` quando esegui
contro un'altra flotta Crabbox.

Flag utili per lo smoke desktop:

- `--lease-id <cbx_...>` o `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` riusa un desktop pre-riscaldato.
- `--browser-url <url>` cambia la pagina aperta nel browser visibile.
- `--html-file <path>` renderizza un artefatto HTML locale al repo nel browser visibile. Mantis lo usa per acquisire la timeline generata delle reazioni di stato Discord tramite un vero desktop Crabbox.
- `--keep-lease` o `OPENCLAW_MANTIS_KEEP_VM=1` mantiene aperto per ispezione VNC un lease appena creato che passa. Le esecuzioni fallite mantengono il lease per impostazione predefinita quando ne è stato creato uno, così un operatore può riconnettersi.
- `--class`, `--idle-timeout` e `--ttl` regolano dimensione della macchina e durata del lease.

La prima primitiva completa di trasporto desktop è lo smoke desktop Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Noleggia o riusa una macchina desktop Crabbox, sincronizza il checkout corrente
nella VM, esegue `pnpm openclaw qa slack` dentro quella VM, apre Slack Web nel
browser VNC, acquisisce il desktop visibile e copia sia gli artefatti Slack QA
sia lo screenshot VNC nella directory di output locale. Questa è la prima forma
Mantis in cui il Gateway OpenClaw SUT e il browser vivono entrambi nella stessa
VM desktop Linux.

Con `--gateway-setup`, il comando prepara una home OpenClaw persistente e
monouso in `$HOME/.openclaw-mantis/slack-openclaw`, applica patch alla
configurazione Slack Socket Mode per il canale selezionato, avvia
`openclaw gateway run` sulla porta `38973` e mantiene Chrome in esecuzione nella
sessione VNC. Questa è la modalità "lasciami un desktop Linux con Slack e un claw
in esecuzione"; la lane Slack QA bot-to-bot rimane l'impostazione predefinita
quando `--gateway-setup` è omesso.

Input richiesti per `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` per la lane del modello remoto. Se localmente è
  impostato solo `OPENAI_API_KEY`, Mantis lo mappa a `OPENCLAW_LIVE_OPENAI_KEY`
  prima di invocare Crabbox, così il forwarding env `OPENCLAW_*` di Crabbox può
  portarlo nella VM.

Flag utili per il desktop Slack:

- `--lease-id <cbx_...>` riesegue contro una macchina in cui un operatore ha già effettuato l'accesso a Slack Web tramite VNC.
- `--gateway-setup` avvia un Gateway OpenClaw Slack persistente nella VM invece di eseguire solo la lane QA bot-to-bot.
- `--slack-url <url>` apre un URL Slack Web specifico. Senza questo flag, Mantis deriva `https://app.slack.com/client/<team>/<channel>` da Slack `auth.test` quando il token bot SUT è disponibile.
- `--slack-channel-id <id>` controlla l'allowlist dei canali Slack usata dalla configurazione del Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controlla il profilo Chrome persistente dentro la VM. Il valore predefinito è `$HOME/.config/openclaw-mantis/slack-chrome-profile`, quindi un login manuale a Slack Web sopravvive alle riesecuzioni sullo stesso lease.
- `--credential-source convex --credential-role ci` usa il pool di credenziali condiviso invece dei token env Slack diretti.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` vengono passati alla lane live Slack.

Il workflow smoke GitHub è `Mantis Discord Smoke`. Il workflow GitHub prima e
dopo per il primo scenario reale è `Mantis Discord Status Reactions`. Accetta:

- `baseline_ref`: il ref che ci si aspetta riproduca il comportamento solo in coda.
- `candidate_ref`: il ref che ci si aspetta mostri `queued -> thinking -> done`.

Esegue il checkout del ref dell'harness del workflow, compila worktree baseline e
candidato separati, esegue `discord-status-reactions-tool-only` contro ciascun
worktree e carica `baseline/`, `candidate/`, `comparison.json` e
`mantis-report.md` come artefatti Actions. Renderizza anche l'HTML della timeline
di ogni lane in un browser desktop Crabbox e pubblica quegli screenshot VNC
accanto ai PNG deterministici della timeline nel commento PR. Lo stesso commento
PR collega alle registrazioni MP4 desktop acquisite durante il render del browser
VNC, mentre gli screenshot restano inline per una revisione rapida. Il workflow
compila la CLI Crabbox da `openclaw/crabbox` main così può usare i flag
desktop/browser lease correnti prima che venga tagliata la prossima release del
binario Crabbox.

Puoi anche attivare l'esecuzione delle reazioni di stato direttamente da un
commento PR:

```text
@Mantis discord status reactions
```

Il trigger da commento è intenzionalmente ristretto. Viene eseguito solo su
commenti di pull request da utenti con accesso write, maintain o admin, e
riconosce solo richieste di reazioni di stato Discord. Per impostazione
predefinita usa il ref baseline noto come non funzionante e lo SHA head della PR
corrente come candidato. I manutentori possono sovrascrivere entrambi i ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Esempi di comandi ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Il primo comando è esplicito e focalizzato sullo scenario. Il secondo potrà in
seguito mappare una PR o una issue agli scenari Mantis consigliati da label, file
modificati e risultati della review ClawSweeper.

## Ciclo Di Esecuzione

1. Acquisire le credenziali.
2. Allocare o riusare una VM.
3. Preparare il profilo desktop/browser quando lo scenario richiede prove UI.
4. Preparare un checkout pulito per il ref baseline.
5. Installare le dipendenze e compilare solo ciò che serve allo scenario.
6. Avviare un Gateway OpenClaw figlio con una directory di stato isolata.
7. Configurare trasporto live, provider, modello e profilo browser.
8. Eseguire lo scenario e acquisire prove baseline.
9. Arrestare il Gateway e preservare i log.
10. Preparare il ref candidato nella stessa VM.
11. Eseguire lo stesso scenario e acquisire prove candidate.
12. Confrontare i risultati dell'oracolo e le prove visive.
13. Scrivere Markdown, JSON, log, screenshot e artefatti trace opzionali.
14. Caricare artefatti GitHub Actions.
15. Pubblicare un messaggio di stato PR o Discord conciso.

Lo scenario dovrebbe poter fallire in due modi diversi:

- **Bug riprodotto**: la baseline è fallita nel modo previsto.
- **Errore dell'harness**: configurazione dell'ambiente, credenziali, API Discord, browser o
  provider sono falliti prima che l'oracolo del bug fosse significativo.

Il report finale deve separare questi casi, così i manutentori non confondono un
ambiente flaky con il comportamento del prodotto.

## MVP Discord

Il primo scenario dovrebbe prendere di mira le reazioni di stato Discord nei
canali guild in cui la modalità di consegna della risposta sorgente è
`message_tool_only`.

Perché è un buon seme Mantis:

- È visibile in Discord come reazioni sul messaggio che ha attivato l'azione.
- Ha un forte oracolo REST tramite lo stato delle reazioni ai messaggi Discord.
- Esercita un vero Gateway OpenClaw, autenticazione bot Discord, dispatch dei
  messaggi, modalità di consegna della risposta sorgente, stato delle reazioni
  di stato e ciclo di vita del turno del modello.
- È abbastanza ristretto da mantenere onesta la prima implementazione.

Forma prevista dello scenario:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Le prove baseline dovrebbero mostrare la reazione di acknowledgement queued ma
nessuna transizione di ciclo di vita in modalità solo tool. Le prove candidate
dovrebbero mostrare le reazioni di stato del ciclo di vita in esecuzione quando
`messages.statusReactions.enabled` è esplicitamente true.

La prima slice eseguibile è lo scenario QA live Discord opt-in:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Configura il SUT con gestione delle guild sempre attiva, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` e reazioni di stato esplicite. L'oracolo
interroga il messaggio di attivazione Discord reale e si aspetta la sequenza osservata
`👀 -> 🤔 -> 👍`. Gli artefatti includono `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` e
`discord-status-reactions-tool-only-timeline.png`.

## Componenti QA esistenti

Mantis dovrebbe basarsi sullo stack QA privato esistente invece di partire da
zero:

- `pnpm openclaw qa discord` esegue già una corsia Discord live con bot driver e
  SUT.
- Il runner del trasporto live scrive già report e artefatti dei messaggi osservati
  in `.artifacts/qa-e2e/`.
- I lease delle credenziali Convex forniscono già accesso esclusivo alle credenziali
  di trasporto live condivise.
- Il servizio di controllo del browser supporta già screenshot, snapshot,
  profili gestiti headless e profili CDP remoti.
- QA Lab dispone già di un'interfaccia debugger e di un bus per test modellati sui trasporti.

La prima implementazione di Mantis può essere un runner sottile prima/dopo sopra questi
componenti, più un livello di evidenza visiva.

## Modello Di Evidenza

Ogni esecuzione scrive una directory di artefatti stabile:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` dovrebbe essere la fonte di verità leggibile dalla macchina. Il
report Markdown è destinato ai commenti sulle PR e alla revisione umana.

Il riepilogo deve includere:

- ref e SHA testati
- trasporto e id dello scenario
- provider della macchina e id della macchina o id del lease
- fonte delle credenziali senza valori segreti
- risultato baseline
- risultato candidate
- se il bug è stato riprodotto sulla baseline
- se il candidate lo ha corretto
- percorsi degli artefatti
- problemi di configurazione o pulizia sanificati

Gli screenshot sono evidenze, non segreti. Richiedono comunque disciplina di redazione:
possono comparire nomi di canali privati, nomi utente o contenuti dei messaggi. Per PR pubbliche,
preferire link agli artefatti GitHub Actions rispetto a immagini inline finché la strategia di redazione
non sarà più solida.

## Browser E VNC

La corsia del browser ha due modalità:

- **Automazione headless**: predefinita per la CI. Chrome viene eseguito con CDP abilitato, e
  Playwright o il controllo browser di OpenClaw acquisisce screenshot.
- **Soccorso VNC**: abilitato sulla stessa VM quando accesso, MFA, anti-automazione di Discord
  o debugging visivo richiedono una persona.

Il profilo browser dell'osservatore Discord dovrebbe essere abbastanza persistente da evitare
l'accesso a ogni esecuzione, ma isolato dallo stato del browser personale. Un profilo
appartiene al pool di macchine Mantis, non al laptop di uno sviluppatore.

Quando Mantis si blocca, pubblica un messaggio di stato Discord con:

- id dell'esecuzione
- id dello scenario
- provider della macchina
- directory degli artefatti
- istruzioni di connessione VNC o noVNC se disponibili
- breve testo del blocco

Il primo deployment privato può pubblicare questi messaggi nel canale operator esistente
e spostarli successivamente in un canale Mantis dedicato.

## Macchine

Mantis dovrebbe preferire AWS tramite Crabbox per la prima implementazione remota.
Crabbox ci fornisce macchine preriscaldate, tracciamento dei lease, idratazione, log, risultati e
pulizia. Se la capacità AWS è troppo lenta o non disponibile, aggiungere un provider Hetzner
dietro la stessa interfaccia macchina.

Requisiti minimi della VM:

- Linux con un'installazione di Chrome o Chromium adatta a desktop
- accesso CDP per automazione del browser
- VNC o noVNC per il soccorso
- Node 22 e pnpm
- checkout OpenClaw e cache delle dipendenze
- cache del browser Chromium di Playwright quando si usa Playwright
- CPU e memoria sufficienti per un OpenClaw Gateway, un browser e un'esecuzione modello
- accesso in uscita a Discord, GitHub, provider di modelli e broker delle credenziali

La VM non dovrebbe conservare segreti grezzi a lunga durata al di fuori degli store di credenziali o
profili browser previsti.

## Segreti

I segreti vivono nei segreti dell'organizzazione o del repository GitHub per le esecuzioni remote, e in
un file segreto locale controllato dall'operator per le esecuzioni locali.

Nomi di segreti consigliati:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per caricamenti di artefatti GitHub pubblici
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

A lungo termine, il pool di credenziali Convex dovrebbe rimanere la fonte normale per le credenziali di
trasporto live. I segreti GitHub inizializzano il broker e le corsie di fallback.
Il workflow Discord status-reactions mappa i segreti Mantis Crabbox di nuovo alle
variabili d'ambiente `CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN`
attese dalla CLI Crabbox. I nomi dei segreti GitHub `CRABBOX_*` semplici restano
accettati come fallback di compatibilità.

Il runner Mantis non deve mai stampare:

- token dei bot Discord
- chiavi API dei provider
- cookie del browser
- contenuti dei profili di autenticazione
- password VNC
- payload di credenziali grezzi

Anche i caricamenti di artefatti pubblici dovrebbero redigere i metadati target Discord come bot,
guild, canali e id dei messaggi. Il workflow smoke GitHub abilita
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per questo motivo.

Se un token viene incollato accidentalmente in una issue, PR, chat o log, ruotarlo
dopo che il nuovo segreto è stato salvato.

## Artefatti GitHub E Commenti PR

I workflow Mantis dovrebbero caricare il bundle completo di evidenze come artefatto Actions
a breve durata. Quando il workflow viene eseguito per una segnalazione di bug o una PR di correzione,
dovrebbe anche pubblicare gli screenshot PNG redatti nel branch `qa-artifacts` e aggiornare o creare
un commento su quel bug o PR di correzione con screenshot inline prima/dopo. Non pubblicare
la prova principale solo su una PR generica di automazione QA. Log grezzi, messaggi osservati
e altre evidenze voluminose restano nell'artefatto Actions.

I workflow di produzione dovrebbero pubblicare quei commenti con la GitHub App Mantis, non
con `github-actions[bot]`. Salvare l'id dell'app e la chiave privata come segreti GitHub Actions
`MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`. Il workflow usa un marker nascosto
come chiave di upsert, aggiorna quel commento quando il token può modificarlo e crea un nuovo
commento di proprietà Mantis quando un marker precedente di proprietà del bot non può essere modificato.

Il commento sulla PR dovrebbe essere breve e visivo:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Quando l'esecuzione fallisce perché l'harness è fallito, il commento deve dirlo invece
di implicare che il candidate sia fallito.

## Note Di Deployment Privato

Un deployment privato potrebbe già avere un'applicazione Discord Mantis. Riutilizzare quella
applicazione invece di creare un'altra app quando ha i permessi bot corretti
e può essere ruotata in sicurezza.

Impostare il canale iniziale di notifica operator tramite segreti o configurazione di deployment.
Può puntare prima a un canale maintainer o operations esistente,
poi spostarsi in un canale Mantis dedicato quando ne esisterà uno.

Non inserire guild id, channel id, token bot, cookie del browser o password VNC
in questo documento. Salvarli nei segreti GitHub, nel broker delle credenziali o nello
store segreto locale dell'operator.

## Aggiungere Uno Scenario

Uno scenario Mantis dovrebbe dichiarare:

- id e titolo
- trasporto
- credenziali richieste
- policy dei ref baseline
- policy dei ref candidate
- patch della configurazione OpenClaw
- passaggi di configurazione
- stimolo
- oracolo baseline atteso
- oracolo candidate atteso
- target di acquisizione visiva
- budget di timeout
- passaggi di pulizia

Gli scenari dovrebbero preferire oracoli piccoli e tipizzati:

- stato delle reazioni Discord per bug di reazioni
- riferimenti ai messaggi Discord per bug di threading
- thread ts Slack e stato dell'API delle reazioni per bug Slack
- id e intestazioni dei messaggi email per bug email
- screenshot del browser quando l'interfaccia utente è l'unico osservabile affidabile

I controlli visivi dovrebbero essere additivi. Se un'API della piattaforma può dimostrare il bug, usare
l'API come oracolo pass/fail e mantenere gli screenshot per la fiducia umana.

## Espansione Dei Provider

Dopo Discord, lo stesso runner può aggiungere:

- Slack: reazioni, thread, menzioni dell'app, modali, caricamenti di file.
- Email: autenticazione Gmail e threading dei messaggi usando `gog` dove i connettori non sono
  sufficienti.
- WhatsApp: accesso QR, re-identificazione, consegna dei messaggi, media, reazioni.
- Telegram: gating delle menzioni nei gruppi, comandi, reazioni dove disponibili.
- Matrix: stanze cifrate, relazioni di thread o risposta, ripresa dopo riavvio.

Ogni trasporto dovrebbe avere uno scenario smoke economico e uno o più scenari per classi di bug.
Gli scenari visivi costosi dovrebbero rimanere opt-in.

## Domande Aperte

- Quale bot Discord dovrebbe essere il driver e quale il SUT quando viene riutilizzato il
  bot Mantis esistente?
- L'accesso del browser osservatore dovrebbe usare un account Discord umano, un account di test
  o solo evidenza REST leggibile dai bot per la prima fase?
- Per quanto tempo GitHub dovrebbe conservare gli artefatti Mantis per le PR?
- Quando ClawSweeper dovrebbe raccomandare automaticamente Mantis invece di attendere un
  comando maintainer?
- Gli screenshot dovrebbero essere redatti o ritagliati prima del caricamento per PR pubbliche?
