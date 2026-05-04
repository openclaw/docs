---
read_when:
    - Creazione o esecuzione della QA visiva live per i bug di OpenClaw
    - Aggiungere la verifica prima e dopo per una pull request
    - Aggiunta di scenari di trasporto in tempo reale per Discord, Slack, WhatsApp o altri
    - Debug delle esecuzioni QA che richiedono screenshot, automazione del browser o accesso VNC
summary: Mantis è il sistema di verifica visiva end-to-end per riprodurre i bug di OpenClaw sui trasporti live, acquisire prove prima e dopo e allegare artefatti alle PR.
title: Mantide
x-i18n:
    generated_at: "2026-05-04T07:03:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis è il sistema di verifica end-to-end di OpenClaw per bug che richiedono un runtime reale, un trasporto reale e prove visibili. Esegue uno scenario su un riferimento noto come difettoso, acquisisce le evidenze, esegue lo stesso scenario su un riferimento candidato e pubblica il confronto come artefatti che un manutentore può ispezionare da una PR o da un comando locale.

Mantis inizia con Discord perché Discord ci offre una prima lane di alto valore: autenticazione reale del bot, canali guild reali, reazioni, thread, comandi nativi e un'interfaccia browser in cui gli esseri umani possono confermare visivamente ciò che il trasporto ha mostrato.

## Obiettivi

- Riprodurre un bug da una segnalazione GitHub o una PR con la stessa forma di trasporto che vedono gli utenti.
- Acquisire un artefatto **before** sul riferimento baseline prima di applicare la correzione.
- Acquisire un artefatto **after** sul riferimento candidato dopo aver applicato la correzione.
- Usare un oracolo deterministico quando possibile, come una lettura delle reazioni tramite REST Discord o un controllo della trascrizione del canale.
- Acquisire screenshot quando il bug ha una superficie UI visibile.
- Eseguire localmente da una CLI controllata dall'agente e da remoto da GitHub.
- Preservare abbastanza stato della macchina per il recupero VNC quando login, automazione del browser o autenticazione del provider si bloccano.
- Pubblicare uno stato conciso su un canale Discord dell'operatore quando l'esecuzione è bloccata, richiede aiuto manuale tramite VNC o termina.

## Non obiettivi

- Mantis non sostituisce gli unit test. Un'esecuzione Mantis dovrebbe di solito diventare un test di regressione più piccolo dopo che la correzione è stata compresa.
- Mantis non è il normale gate CI veloce. È più lento, usa credenziali live ed è riservato ai bug in cui l'ambiente live è importante.
- Mantis non dovrebbe richiedere un intervento umano per il funzionamento normale. VNC manuale è un percorso di recupero, non il percorso ideale.
- Mantis non archivia segreti grezzi in artefatti, log, screenshot, report Markdown o commenti PR.

## Proprietà

Mantis vive nello stack QA di OpenClaw.

- OpenClaw possiede il runtime degli scenari, gli adattatori di trasporto, lo schema delle evidenze e la CLI locale sotto `pnpm openclaw qa mantis`.
- QA Lab possiede i componenti dell'harness di trasporto live, gli helper di acquisizione browser e gli scrittori di artefatti.
- Crabbox possiede le macchine Linux riscaldate quando serve una VM remota.
- GitHub Actions possiede l'entrypoint del workflow remoto e la conservazione degli artefatti.
- ClawSweeper possiede l'instradamento dei commenti GitHub: parsing dei comandi dei manutentori, dispatch del workflow e pubblicazione del commento PR finale.
- Gli agenti OpenClaw pilotano Mantis tramite Codex quando uno scenario richiede configurazione agentica, debug o segnalazione di stato bloccato.

Questo confine mantiene la conoscenza del trasporto in OpenClaw, la pianificazione delle macchine in Crabbox e il collante del workflow dei manutentori in ClawSweeper.

## Forma Del Comando

Il primo comando locale verifica il bot Discord, guild, canale, invio messaggi, invio reazioni e percorso degli artefatti:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Il runner locale before e after accetta questa forma:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Il runner crea worktree baseline e candidate scollegati sotto la directory di output, installa le dipendenze, compila ciascun riferimento, esegue lo scenario con `--allow-failures`, quindi scrive `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md`. Per il primo scenario Discord, una verifica riuscita significa che lo stato baseline è `fail` e lo stato candidate è `pass`.

Il primo primitivo VM/browser è lo smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Noleggia o riusa una macchina desktop Crabbox, avvia un browser visibile dentro la sessione VNC, acquisisce il desktop, riporta gli artefatti nella directory di output locale e scrive il comando di riconnessione nel report. Il comando usa per impostazione predefinita il provider Hetzner perché è il primo provider con copertura desktop/VNC funzionante nella lane Mantis. Sovrascrivilo con `--provider`, `--crabbox-bin` o `OPENCLAW_MANTIS_CRABBOX_PROVIDER` quando esegui contro un'altra flotta Crabbox.

Flag utili per lo smoke desktop:

- `--lease-id <cbx_...>` o `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` riusa un desktop riscaldato.
- `--browser-url <url>` cambia la pagina aperta nel browser visibile.
- `--html-file <path>` renderizza un artefatto HTML locale al repository nel browser visibile. Mantis lo usa per acquisire la timeline generata delle reazioni di stato Discord tramite un desktop Crabbox reale.
- `--keep-lease` o `OPENCLAW_MANTIS_KEEP_VM=1` mantiene aperto un lease appena creato e riuscito per l'ispezione VNC. Le esecuzioni non riuscite mantengono il lease per impostazione predefinita quando ne è stato creato uno, così un operatore può riconnettersi.
- `--class`, `--idle-timeout` e `--ttl` regolano dimensione della macchina e durata del lease.

Il primo primitivo completo di trasporto desktop è lo smoke desktop Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Noleggia o riusa una macchina desktop Crabbox, sincronizza il checkout corrente nella VM, esegue `pnpm openclaw qa slack` dentro quella VM, apre Slack Web nel browser VNC, acquisisce il desktop visibile e copia sia gli artefatti QA Slack sia lo screenshot VNC nella directory di output locale. Questa è la prima forma Mantis in cui il Gateway OpenClaw SUT e il browser vivono entrambi nella stessa VM desktop Linux.

Con `--gateway-setup`, il comando prepara una home OpenClaw persistente e disposable in `$HOME/.openclaw-mantis/slack-openclaw`, applica patch alla configurazione Slack Socket Mode per il canale selezionato, avvia `openclaw gateway run` sulla porta `38973` e mantiene Chrome in esecuzione nella sessione VNC. Questa è la modalità "lasciami un desktop Linux con Slack e un claw in esecuzione"; la lane QA Slack bot-to-bot resta il default quando `--gateway-setup` viene omesso.

Input richiesti per `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` per la lane del modello remoto. Se localmente è impostato solo `OPENAI_API_KEY`, Mantis lo mappa a `OPENCLAW_LIVE_OPENAI_KEY` prima di invocare Crabbox, così l'inoltro env `OPENCLAW_*` di Crabbox può portarlo nella VM.

Flag utili per il desktop Slack:

- `--lease-id <cbx_...>` riesegue contro una macchina in cui un operatore ha già effettuato l'accesso a Slack Web tramite VNC.
- `--gateway-setup` avvia un Gateway Slack OpenClaw persistente nella VM invece di eseguire solo la lane QA bot-to-bot.
- `--slack-url <url>` apre un URL Slack Web specifico. Senza questo, Mantis deriva `https://app.slack.com/client/<team>/<channel>` da `auth.test` Slack quando il token del bot SUT è disponibile.
- `--slack-channel-id <id>` controlla l'allowlist dei canali Slack usata dalla configurazione del Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controlla il profilo Chrome persistente dentro la VM. Il default è `$HOME/.config/openclaw-mantis/slack-chrome-profile`, quindi un login manuale a Slack Web sopravvive alle riesecuzioni sullo stesso lease.
- `--credential-source convex --credential-role ci` usa il pool di credenziali condiviso invece dei token env Slack diretti.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` vengono passati alla lane live Slack.

Il workflow smoke GitHub è `Mantis Discord Smoke`. Il workflow GitHub before e after per il primo scenario reale è `Mantis Discord Status Reactions`. Accetta:

- `baseline_ref`: il riferimento che dovrebbe riprodurre il comportamento solo queued.
- `candidate_ref`: il riferimento che dovrebbe mostrare `queued -> thinking -> done`.

Esegue il checkout del riferimento dell'harness del workflow, compila worktree baseline e candidate separati, esegue `discord-status-reactions-tool-only` su ciascun worktree e carica `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` come artefatti Actions. Renderizza anche l'HTML della timeline di ciascuna lane in un browser desktop Crabbox e pubblica quegli screenshot VNC accanto ai PNG deterministici della timeline nel commento PR. Il workflow compila la CLI Crabbox da `openclaw/crabbox` main così può usare gli attuali flag di lease desktop/browser prima che venga tagliata la prossima release binaria di Crabbox.

Puoi anche attivare direttamente l'esecuzione status-reactions da un commento PR:

```text
@Mantis discord status reactions
```

Il trigger da commento è intenzionalmente ristretto. Viene eseguito solo sui commenti alle pull request da utenti con accesso write, maintain o admin, e riconosce solo richieste Discord status-reaction. Per impostazione predefinita usa il riferimento baseline noto come difettoso e lo SHA head della PR corrente come candidate. I manutentori possono sovrascrivere entrambi i riferimenti:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Esempi di comandi ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Il primo comando è esplicito e focalizzato sullo scenario. Il secondo potrà in seguito mappare una PR o una segnalazione agli scenari Mantis consigliati da etichette, file modificati e risultati di revisione ClawSweeper.

## Ciclo Di Esecuzione

1. Acquisire le credenziali.
2. Allocare o riusare una VM.
3. Preparare il profilo desktop/browser quando lo scenario richiede evidenze UI.
4. Preparare un checkout pulito per il riferimento baseline.
5. Installare le dipendenze e compilare solo ciò che serve allo scenario.
6. Avviare un Gateway OpenClaw figlio con una directory di stato isolata.
7. Configurare il trasporto live, il provider, il modello e il profilo browser.
8. Eseguire lo scenario e acquisire le evidenze baseline.
9. Arrestare il Gateway e preservare i log.
10. Preparare il riferimento candidate nella stessa VM.
11. Eseguire lo stesso scenario e acquisire le evidenze candidate.
12. Confrontare i risultati dell'oracolo e le evidenze visive.
13. Scrivere Markdown, JSON, log, screenshot e artefatti di trace opzionali.
14. Caricare gli artefatti GitHub Actions.
15. Pubblicare un messaggio di stato conciso su PR o Discord.

Lo scenario dovrebbe poter fallire in due modi diversi:

- **Bug riprodotto**: la baseline è fallita nel modo previsto.
- **Fallimento dell'harness**: configurazione dell'ambiente, credenziali, API Discord, browser o provider sono falliti prima che l'oracolo del bug fosse significativo.

Il report finale deve separare questi casi così i manutentori non confondono un ambiente instabile con il comportamento del prodotto.

## MVP Discord

Il primo scenario dovrebbe puntare alle reazioni di stato Discord nei canali guild in cui la modalità di consegna della risposta sorgente è `message_tool_only`.

Perché è un buon seme Mantis:

- È visibile in Discord come reazioni sul messaggio di attivazione.
- Ha un oracolo REST forte tramite lo stato delle reazioni del messaggio Discord.
- Esercita un Gateway OpenClaw reale, autenticazione bot Discord, dispatch dei messaggi, modalità di consegna della risposta sorgente, stato delle reazioni di stato e ciclo di vita del turno del modello.
- È abbastanza ristretto da mantenere onesta la prima implementazione.

Forma attesa dello scenario:

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

Le evidenze baseline dovrebbero mostrare la reazione di conferma queued ma nessuna transizione del ciclo di vita in modalità tool-only. Le evidenze candidate dovrebbero mostrare le reazioni di stato del ciclo di vita in esecuzione quando `messages.statusReactions.enabled` è esplicitamente `true`.

La prima sezione eseguibile è lo scenario QA live Discord opt-in:

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
esegue il polling del vero messaggio Discord di attivazione e si aspetta la
sequenza osservata `👀 -> 🤔 -> 👍`. Gli artefatti includono
`discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` e
`discord-status-reactions-tool-only-timeline.png`.

## Componenti QA Esistenti

Mantis dovrebbe basarsi sullo stack QA privato esistente invece di partire da
zero:

- `pnpm openclaw qa discord` esegue già una lane Discord live con bot driver e
  SUT.
- Il runner di trasporto live scrive già report e artefatti dei messaggi
  osservati in `.artifacts/qa-e2e/`.
- I lease delle credenziali Convex forniscono già accesso esclusivo alle
  credenziali condivise dei trasporti live.
- Il servizio di controllo del browser supporta già screenshot, snapshot,
  profili gestiti headless e profili CDP remoti.
- QA Lab ha già un'interfaccia debugger e un bus per test modellati come
  trasporti.

La prima implementazione di Mantis può essere un sottile runner prima/dopo sopra
questi componenti, più un livello di evidenza visiva.

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

`mantis-summary.json` dovrebbe essere la fonte di verità leggibile dalla
macchina. Il report Markdown serve per i commenti nelle PR e per la revisione
umana.

Il riepilogo deve includere:

- ref e SHA testati
- trasporto e id scenario
- provider della macchina e id macchina o id lease
- origine delle credenziali senza valori segreti
- risultato baseline
- risultato candidate
- se il bug si è riprodotto sulla baseline
- se il candidate lo ha corretto
- percorsi degli artefatti
- problemi di setup o cleanup sanificati

Gli screenshot sono evidenza, non segreti. Richiedono comunque disciplina di
redazione: possono comparire nomi di canali privati, nomi utente o contenuto dei
messaggi. Per le PR pubbliche, preferisci link agli artefatti di GitHub Actions
rispetto a immagini inline finché la storia della redazione non sarà più solida.

## Browser E VNC

La lane del browser ha due modalità:

- **Automazione headless**: predefinita per la CI. Chrome viene eseguito con CDP
  abilitato, e Playwright o il controllo browser di OpenClaw acquisisce
  screenshot.
- **Soccorso VNC**: abilitato sulla stessa VM quando login, MFA, anti-automazione
  di Discord o debugging visivo richiedono una persona.

Il profilo browser dell'osservatore Discord dovrebbe essere abbastanza
persistente da evitare il login a ogni esecuzione, ma isolato dallo stato del
browser personale. Un profilo appartiene al pool macchine di Mantis, non al
laptop di uno sviluppatore.

Quando Mantis si blocca, pubblica un messaggio di stato Discord con:

- id esecuzione
- id scenario
- provider della macchina
- directory degli artefatti
- istruzioni di connessione VNC o noVNC, se disponibili
- breve testo del blocco

La prima distribuzione privata può pubblicare questi messaggi nel canale
operatore esistente e spostarsi più avanti in un canale Mantis dedicato.

## Macchine

Mantis dovrebbe preferire AWS tramite Crabbox per la prima implementazione
remota. Crabbox ci offre macchine preriscaldate, tracciamento lease, idratazione,
log, risultati e cleanup. Se la capacità AWS è troppo lenta o non disponibile,
aggiungi un provider Hetzner dietro la stessa interfaccia macchina.

Requisiti minimi della VM:

- Linux con un'installazione Chrome o Chromium capace di desktop
- accesso CDP per l'automazione browser
- VNC o noVNC per il soccorso
- Node 22 e pnpm
- checkout OpenClaw e cache delle dipendenze
- cache browser Chromium di Playwright quando viene usato Playwright
- CPU e memoria sufficienti per un Gateway OpenClaw, un browser e un'esecuzione
  modello
- accesso in uscita a Discord, GitHub, provider di modelli e broker delle
  credenziali

La VM non dovrebbe conservare segreti grezzi di lunga durata al di fuori degli
store previsti per credenziali o profili browser.

## Segreti

I segreti risiedono nei segreti dell'organizzazione o del repository GitHub per
le esecuzioni remote, e in un file di segreti locale controllato
dall'operatore per le esecuzioni locali.

Nomi di segreti consigliati:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per gli upload pubblici di artefatti GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

A lungo termine, il pool di credenziali Convex dovrebbe restare la normale fonte
per le credenziali dei trasporti live. I segreti GitHub avviano il broker e le
lane di fallback. Il workflow delle reazioni di stato Discord rimappa i segreti
Mantis Crabbox sulle variabili d'ambiente `CRABBOX_COORDINATOR` e
`CRABBOX_COORDINATOR_TOKEN` attese dalla CLI Crabbox. I nomi semplici dei
segreti GitHub `CRABBOX_*` restano accettati come fallback di compatibilità.

Il runner Mantis non deve mai stampare:

- token dei bot Discord
- chiavi API dei provider
- cookie del browser
- contenuti dei profili di autenticazione
- password VNC
- payload grezzi delle credenziali

Gli upload pubblici di artefatti dovrebbero anche redigere i metadati dei target
Discord come id di bot, guild, canale e messaggio. Il workflow smoke GitHub
abilita `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per questo motivo.

Se un token viene incollato accidentalmente in un issue, una PR, una chat o un
log, ruotalo dopo che il nuovo segreto è stato memorizzato.

## Artefatti GitHub E Commenti PR

I workflow Mantis dovrebbero caricare il bundle completo di evidenze come
artefatto Actions di breve durata. Quando il workflow viene eseguito per una
segnalazione di bug o una PR di correzione, dovrebbe anche pubblicare gli
screenshot PNG redatti sul branch `qa-artifacts` e aggiornare o creare un
commento su quel bug o su quella PR di correzione con screenshot inline
prima/dopo. Non pubblicare la prova principale solo su una generica PR di
automazione QA. Log grezzi, messaggi osservati e altre evidenze voluminose
restano nell'artefatto Actions.

I workflow di produzione dovrebbero pubblicare quei commenti con la GitHub App
di Mantis, non con `github-actions[bot]`. Memorizza l'id app e la chiave privata
come segreti GitHub Actions `MANTIS_GITHUB_APP_ID` e
`MANTIS_GITHUB_APP_PRIVATE_KEY`. Il workflow usa un marker nascosto come chiave
di upsert, aggiorna quel commento quando il token può modificarlo e crea un
nuovo commento di proprietà Mantis quando un marker più vecchio di proprietà di
un bot non può essere modificato.

Il commento PR dovrebbe essere breve e visivo:

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

Quando l'esecuzione fallisce perché l'harness è fallito, il commento deve dirlo
invece di implicare che il candidate sia fallito.

## Note Sulla Distribuzione Privata

Una distribuzione privata potrebbe già avere un'applicazione Discord Mantis.
Riutilizza quell'applicazione invece di crearne un'altra quando ha le corrette
autorizzazioni bot e può essere ruotata in sicurezza.

Imposta il canale iniziale di notifica per gli operatori tramite segreti o
configurazione di distribuzione. All'inizio può puntare a un canale manutentori
o operativo esistente, poi spostarsi in un canale Mantis dedicato quando ne
esiste uno.

Non inserire in questo documento id guild, id canale, token bot, cookie browser
o password VNC. Memorizzali nei segreti GitHub, nel broker delle credenziali o
nello store locale di segreti dell'operatore.

## Aggiungere Uno Scenario

Uno scenario Mantis dovrebbe dichiarare:

- id e titolo
- trasporto
- credenziali richieste
- policy ref baseline
- policy ref candidate
- patch della configurazione OpenClaw
- passaggi di setup
- stimolo
- oracolo baseline atteso
- oracolo candidate atteso
- target di acquisizione visiva
- budget di timeout
- passaggi di cleanup

Gli scenari dovrebbero preferire oracoli piccoli e tipizzati:

- stato delle reazioni Discord per bug sulle reazioni
- riferimenti ai messaggi Discord per bug di threading
- ts del thread Slack e stato dell'API reazioni per bug Slack
- id e header dei messaggi email per bug email
- screenshot del browser quando la UI è l'unico osservabile affidabile

I controlli di visione dovrebbero essere additivi. Se un'API di piattaforma può
dimostrare il bug, usa l'API come oracolo pass/fail e conserva gli screenshot
per la fiducia umana.

## Espansione Dei Provider

Dopo Discord, lo stesso runner può aggiungere:

- Slack: reazioni, thread, menzioni app, modali, caricamenti file.
- Email: autenticazione Gmail e threading dei messaggi usando `gog` dove i connettori non bastano.
- WhatsApp: login QR, re-identificazione, consegna messaggi, media, reazioni.
- Telegram: gating delle menzioni di gruppo, comandi, reazioni dove disponibili.
- Matrix: stanze cifrate, relazioni di thread o risposta, ripresa dopo riavvio.

Ogni trasporto dovrebbe avere uno scenario smoke economico e uno o più scenari
per classe di bug. Gli scenari visivi costosi dovrebbero restare opt-in.

## Domande Aperte

- Quale bot Discord dovrebbe essere il driver, e quale dovrebbe essere il SUT,
  quando il bot Mantis esistente viene riutilizzato?
- Il login del browser osservatore dovrebbe usare un account Discord umano, un
  account di test, oppure solo evidenza REST leggibile dai bot per la prima
  fase?
- Per quanto tempo GitHub dovrebbe conservare gli artefatti Mantis per le PR?
- Quando ClawSweeper dovrebbe raccomandare automaticamente Mantis invece di
  attendere un comando di un manutentore?
- Gli screenshot dovrebbero essere redatti o ritagliati prima dell'upload per le
  PR pubbliche?
