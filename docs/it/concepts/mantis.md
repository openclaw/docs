---
read_when:
    - Creazione o esecuzione di QA visiva in tempo reale per i bug di OpenClaw
    - Aggiunta della verifica prima e dopo per una richiesta di pull
    - Aggiungere scenari di trasporto in tempo reale per Discord, Slack, WhatsApp o altri
    - Risoluzione dei problemi nelle esecuzioni QA che richiedono schermate, automazione del browser o accesso VNC
summary: Mantis è il sistema di verifica visiva end-to-end per riprodurre bug di OpenClaw sui trasporti live, acquisire prove prima e dopo e allegare artefatti alle PR.
title: Mantide
x-i18n:
    generated_at: "2026-05-06T08:45:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis è il sistema di verifica end-to-end di OpenClaw per bug che richiedono un
runtime reale, un trasporto reale e una prova visibile. Esegue uno scenario su un
ref noto come difettoso, acquisisce prove, esegue lo stesso scenario su un ref
candidato e pubblica il confronto come artefatti che un maintainer può ispezionare
da una PR o da un comando locale.

Mantis inizia con Discord perché Discord ci offre una prima corsia di alto valore:
autenticazione bot reale, canali guild reali, reazioni, thread, comandi nativi e
un'interfaccia browser in cui gli esseri umani possono confermare visivamente ciò
che il trasporto ha mostrato.

## Obiettivi

- Riprodurre un bug da una issue GitHub o da una PR con la stessa forma di
  trasporto che vedono gli utenti.
- Acquisire un artefatto **prima** sul ref di baseline prima di applicare la correzione.
- Acquisire un artefatto **dopo** sul ref candidato dopo aver applicato la correzione.
- Usare un oracolo deterministico quando possibile, come una lettura di reazione
  REST di Discord o un controllo della trascrizione del canale.
- Acquisire screenshot quando il bug ha una superficie UI visibile.
- Eseguire localmente da una CLI controllata da agent e da remoto da GitHub.
- Preservare abbastanza stato della macchina per il recupero VNC quando login,
  automazione del browser o autenticazione del provider si bloccano.
- Pubblicare uno stato conciso su un canale Discord per operatori quando
  l'esecuzione è bloccata, richiede aiuto manuale tramite VNC o termina.

## Non obiettivi

- Mantis non sostituisce i test unitari. Un'esecuzione Mantis dovrebbe di solito
  diventare un test di regressione più piccolo dopo aver compreso la correzione.
- Mantis non è il normale gate CI veloce. È più lento, usa credenziali live ed è
  riservato ai bug in cui l'ambiente live è rilevante.
- Mantis non dovrebbe richiedere un essere umano per il normale funzionamento. Il
  VNC manuale è un percorso di recupero, non il percorso previsto.
- Mantis non memorizza segreti grezzi in artefatti, log, screenshot, report
  Markdown o commenti PR.

## Proprietà

Mantis vive nello stack QA di OpenClaw.

- OpenClaw possiede il runtime degli scenari, gli adattatori di trasporto, lo
  schema delle prove e la CLI locale sotto `pnpm openclaw qa mantis`.
- QA Lab possiede le parti dell'harness di trasporto live, gli helper di
  acquisizione del browser e gli autori degli artefatti.
- Crabbox possiede le macchine Linux riscaldate quando è necessaria una VM remota.
- GitHub Actions possiede l'entrypoint del workflow remoto e la conservazione
  degli artefatti.
- ClawSweeper possiede il routing dei commenti GitHub: parsing dei comandi dei
  maintainer, dispatch del workflow e pubblicazione del commento PR finale.
- Gli agent OpenClaw guidano Mantis tramite Codex quando uno scenario richiede
  configurazione agentica, debug o segnalazione di stato bloccato.

Questo confine mantiene la conoscenza del trasporto in OpenClaw, la pianificazione
delle macchine in Crabbox e il collante del workflow dei maintainer in ClawSweeper.

## Forma del comando

Il primo comando locale verifica il bot Discord, la guild, il canale, l'invio di
messaggi, l'invio di reazioni e il percorso degli artefatti:

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

Il runner crea worktree baseline e candidato separati sotto la directory di
output, installa le dipendenze, compila ogni ref, esegue lo scenario con
`--allow-failures`, poi scrive `baseline/`, `candidate/`, `comparison.json` e
`mantis-report.md`. Per il primo scenario Discord, una verifica riuscita significa
che lo stato della baseline è `fail` e lo stato del candidato è `pass`.

Il secondo probe prima/dopo di Discord prende di mira gli allegati nei thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Quello scenario pubblica un messaggio padre con il bot driver, crea un thread
Discord reale, chiama l'azione `message.thread-reply` di OpenClaw con un
`filePath` locale al repo, poi esegue polling del thread per la risposta del SUT e
il nome file dell'allegato. Lo screenshot della baseline mostra la risposta senza
allegato; lo screenshot del candidato mostra l'allegato previsto
`mantis-thread-report.md`.

La prima primitiva VM/browser è lo smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Affitta o riusa una macchina desktop Crabbox, avvia un browser visibile dentro la
sessione VNC, acquisisce il desktop, recupera gli artefatti nella directory di
output locale e scrive il comando di riconnessione nel report. Il comando usa per
impostazione predefinita il provider Hetzner perché è il primo provider con
copertura desktop/VNC funzionante nella corsia Mantis. Sovrascrivilo con
`--provider`, `--crabbox-bin` o `OPENCLAW_MANTIS_CRABBOX_PROVIDER` quando esegui
contro un'altra flotta Crabbox.

Flag utili per lo smoke desktop:

- `--lease-id <cbx_...>` o `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` riusa un desktop riscaldato.
- `--browser-url <url>` cambia la pagina aperta nel browser visibile.
- `--html-file <path>` renderizza un artefatto HTML locale al repo nel browser visibile. Mantis lo usa per acquisire la timeline generata delle reazioni di stato Discord tramite un vero desktop Crabbox.
- `--browser-profile-dir <remote-path>` riusa un Chrome user-data-dir remoto, così un desktop Mantis persistente può restare autenticato tra le esecuzioni. Usalo per il profilo di visualizzazione Discord Web di lunga durata.
- `--browser-profile-archive-env <name>` ripristina un archivio Chrome user-data-dir `.tgz` base64 dalla variabile d'ambiente nominata prima di avviare il browser. Usalo per testimoni autenticati come Discord Web. La variabile d'ambiente predefinita è `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` controlla la durata dell'acquisizione MP4. Usa una durata più lunga per app web autenticate lente che hanno bisogno di tempo per stabilizzarsi.
- `--keep-lease` o `OPENCLAW_MANTIS_KEEP_VM=1` mantiene aperto un lease appena creato e riuscito per l'ispezione VNC. Le esecuzioni non riuscite mantengono il lease per impostazione predefinita quando ne è stato creato uno, così un operatore può riconnettersi.
- `--class`, `--idle-timeout` e `--ttl` regolano dimensione della macchina e durata del lease.

Per le prove Discord Web, Mantis usa un account viewer dedicato invece di un token
bot. Lo scenario live dell'API Discord resta l'oracolo: crea il thread reale,
invia il `thread-reply` del SUT e controlla l'allegato tramite REST di Discord.
Quando `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` è impostato, lo scenario scrive
anche un artefatto URL di Discord Web. Quando `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`
è impostato, lascia quel thread disponibile abbastanza a lungo perché un browser
autenticato lo apra e lo registri.

Il workflow GitHub apre l'URL del thread candidato in Discord Web, acquisisce uno
screenshot, registra un MP4 e genera un'anteprima GIF ritagliata quando gli
strumenti multimediali Crabbox sono disponibili. Preferisci un percorso di profilo
viewer persistente configurato tramite `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`,
perché gli archivi completi del profilo Chrome possono superare il limite di
dimensione dei segreti di GitHub. Per profili piccoli/bootstrap, il workflow può
anche ripristinare un archivio `.tgz` base64 da
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Se nessuna fonte di profilo è
configurata, il workflow pubblica comunque gli screenshot deterministici degli
allegati baseline/candidato e registra un avviso che il testimone Discord Web
autenticato è stato saltato.

La prima primitiva completa di trasporto desktop è lo smoke desktop Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Affitta o riusa una macchina desktop Crabbox, sincronizza il checkout corrente
nella VM, esegue `pnpm openclaw qa slack` dentro quella VM, apre Slack Web nel
browser VNC, acquisisce il desktop visibile e copia sia gli artefatti QA Slack sia
lo screenshot VNC nella directory di output locale. Questa è la prima forma
Mantis in cui il Gateway OpenClaw SUT e il browser vivono entrambi dentro la stessa
VM desktop Linux.

Con `--gateway-setup`, il comando prepara una home OpenClaw monouso persistente in
`$HOME/.openclaw-mantis/slack-openclaw`, applica patch alla configurazione Slack
Socket Mode per il canale selezionato, avvia `openclaw gateway run` sulla porta
`38973` e mantiene Chrome in esecuzione nella sessione VNC. Questa è la modalità
"lasciami un desktop Linux con Slack e una claw in esecuzione"; la corsia QA Slack
bot-to-bot resta l'impostazione predefinita quando `--gateway-setup` è omesso.

Input richiesti per `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` per la corsia del modello remoto. Se localmente è
  impostato solo `OPENAI_API_KEY`, Mantis lo mappa a `OPENCLAW_LIVE_OPENAI_KEY`
  prima di invocare Crabbox, così l'inoltro env `OPENCLAW_*` di Crabbox può
  portarlo nella VM.

Con `--gateway-setup --credential-source convex`, Mantis affitta la credenziale
Slack SUT dal pool condiviso prima di creare la VM e inoltra l'id del canale
affittato, il token app Socket Mode e il token bot come env di runtime
`OPENCLAW_MANTIS_SLACK_*` dentro il desktop. Questo mantiene snelli i workflow
GitHub: hanno bisogno solo del segreto del broker Convex, non dei token grezzi del
bot o dell'app Slack.

Flag utili per il desktop Slack:

- `--lease-id <cbx_...>` riesegue contro una macchina in cui un operatore ha già effettuato l'accesso a Slack Web tramite VNC.
- `--gateway-setup` avvia un Gateway Slack OpenClaw persistente nella VM invece di eseguire solo la corsia QA bot-to-bot.
- `--keep-lease` mantiene la VM Gateway aperta per l'ispezione VNC dopo il successo; `--no-keep-lease` la arresta dopo aver raccolto gli artefatti.
- `--slack-url <url>` apre uno specifico URL Slack Web. Senza di esso, Mantis deriva `https://app.slack.com/client/<team>/<channel>` da Slack `auth.test` quando il token bot del SUT è disponibile.
- `--slack-channel-id <id>` controlla la allowlist dei canali Slack usata dalla configurazione Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controlla il profilo Chrome persistente dentro la VM. Il valore predefinito è `$HOME/.config/openclaw-mantis/slack-chrome-profile`, quindi un login manuale a Slack Web sopravvive alle riesecuzioni sullo stesso lease.
- `--credential-source convex --credential-role ci` usa il pool di credenziali condiviso invece dei token env diretti di Slack.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` vengono passati alla corsia live Slack.

Il workflow smoke GitHub è `Mantis Discord Smoke`. Il workflow GitHub prima e
dopo per il primo scenario reale è `Mantis Discord Status Reactions`. Accetta:

- `baseline_ref`: il ref che dovrebbe riprodurre il comportamento solo in coda.
- `candidate_ref`: il ref che dovrebbe mostrare `queued -> thinking -> done`.

Esegue il checkout del ref dell'harness del workflow, compila worktree baseline e
candidato separati, esegue `discord-status-reactions-tool-only` contro ogni
worktree e carica `baseline/`, `candidate/`, `comparison.json` e
`mantis-report.md` come artefatti Actions. Renderizza anche l'HTML della timeline
di ogni corsia in un browser desktop Crabbox e pubblica quegli screenshot VNC
accanto ai PNG deterministici della timeline nel commento PR. Lo stesso commento
PR incorpora anteprime GIF leggere ritagliate sul movimento generate da
`crabbox media preview`, collega i clip MP4 corrispondenti ritagliati sul movimento
e mantiene i file MP4 desktop completi per un'ispezione approfondita. Gli
screenshot restano inline per una revisione rapida. Il workflow compila la CLI
Crabbox da `openclaw/crabbox` main così può usare i flag di lease desktop/browser
correnti prima che venga tagliata la prossima release del binario Crabbox.

`Mantis Scenario` è l'entrypoint manuale generico. Prende un `scenario_id`,
`candidate_ref`, un `baseline_ref` opzionale e un `pr_number` opzionale, poi
esegue il dispatch del workflow proprietario dello scenario. Il wrapper è
intenzionalmente sottile: i workflow di scenario possiedono ancora la propria
configurazione di trasporto, le credenziali, la classe VM, l'oracolo previsto e il
manifest degli artefatti.

`Mantis Slack Desktop Smoke` è il primo workflow Slack su VM. Esegue il checkout della ref candidata attendibile in un worktree separato, prende in leasing un desktop Linux Crabbox, esegue `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` su quella candidata, apre Slack Web nel browser VNC, registra il desktop, genera un’anteprima tagliata in base al movimento con `crabbox media preview`, carica l’intera directory degli artefatti e, facoltativamente, pubblica il commento con evidenze inline sulla PR di destinazione. Per impostazione predefinita usa AWS per il leasing del desktop ed espone un input manuale per il provider, così gli operatori possono passare a Hetzner quando la capacità AWS è lenta o non disponibile. Usa questa corsia quando vuoi "un desktop Linux con Slack e un claw in esecuzione" invece di una sola trascrizione Slack bot-to-bot.

Ogni scenario che pubblica su PR scrive `mantis-evidence.json` accanto al proprio report. Questo schema è il passaggio di consegne tra il codice dello scenario e i commenti GitHub:

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

I valori `path` degli artefatti sono relativi alla directory del manifest. I valori `targetPath` sono percorsi relativi sotto la directory di pubblicazione del branch `qa-artifacts`. Il publisher rifiuta l’attraversamento dei percorsi e salta le voci contrassegnate con `"required": false` quando le anteprime o i video facoltativi non sono disponibili.

Tipi di artefatto supportati:

- `timeline`: screenshot deterministico dello scenario, di solito prima/dopo.
- `desktopScreenshot`: screenshot del desktop VNC/browser.
- `motionPreview`: GIF animata inline generata dalla registrazione del desktop.
- `motionClip`: MP4 tagliato in base al movimento che rimuove introduzione e coda statiche.
- `fullVideo`: registrazione MP4 completa per ispezione approfondita.
- `metadata`: sidecar JSON/log.
- `report`: report Markdown.

Il publisher riutilizzabile è `scripts/mantis/publish-pr-evidence.mjs`. I workflow lo chiamano con il manifest, la PR di destinazione, la radice di destinazione `qa-artifacts`, il marker del commento, l’URL dell’artefatto Actions, l’URL dell’esecuzione e la sorgente della richiesta. Copia gli artefatti dichiarati nel branch `qa-artifacts`, costruisce un commento PR con riepilogo in apertura, immagini/anteprime inline e video collegati, quindi aggiorna il commento con marker esistente o ne crea uno.

Puoi anche attivare l’esecuzione status-reactions direttamente da un commento PR:

```text
@Mantis discord status reactions
```

Il trigger da commento è intenzionalmente ristretto. Viene eseguito solo sui commenti di pull request di utenti con accesso write, maintain o admin, e riconosce solo le richieste di status reaction Discord. Per impostazione predefinita usa la ref baseline nota come difettosa e lo SHA dell’head PR corrente come candidata. I maintainer possono sovrascrivere entrambe le ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Esempi di comandi ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Il primo comando è esplicito e focalizzato sullo scenario. Il secondo potrà in seguito mappare una PR o un issue agli scenari Mantis consigliati in base a etichette, file modificati e risultati della review ClawSweeper.

## Ciclo di vita dell’esecuzione

1. Acquisire le credenziali.
2. Allocare o riutilizzare una VM.
3. Preparare il profilo desktop/browser quando lo scenario richiede evidenza UI.
4. Preparare un checkout pulito per la ref baseline.
5. Installare le dipendenze e compilare solo ciò che serve allo scenario.
6. Avviare un OpenClaw Gateway figlio con una directory di stato isolata.
7. Configurare il trasporto live, il provider, il modello e il profilo browser.
8. Eseguire lo scenario e acquisire l’evidenza baseline.
9. Fermare il gateway e conservare i log.
10. Preparare la ref candidata nella stessa VM.
11. Eseguire lo stesso scenario e acquisire l’evidenza candidata.
12. Confrontare i risultati dell’oracolo e l’evidenza visiva.
13. Scrivere Markdown, JSON, log, screenshot e artefatti di trace facoltativi.
14. Caricare gli artefatti GitHub Actions.
15. Pubblicare un messaggio di stato conciso su PR o Discord.

Lo scenario dovrebbe poter fallire in due modi diversi:

- **Bug riprodotto**: la baseline è fallita nel modo atteso.
- **Errore dell’harness**: configurazione dell’ambiente, credenziali, API Discord, browser o provider sono falliti prima che l’oracolo del bug fosse significativo.

Il report finale deve separare questi casi, così i maintainer non confondono un ambiente instabile con il comportamento del prodotto.

## MVP Discord

Il primo scenario dovrebbe mirare alle status reaction Discord nei canali guild in cui la modalità di consegna della risposta sorgente è `message_tool_only`.

Perché è un buon seme per Mantis:

- È visibile in Discord come reaction sul messaggio che innesca l’esecuzione.
- Ha un oracolo REST robusto tramite lo stato delle reaction del messaggio Discord.
- Esercita un OpenClaw Gateway reale, autenticazione del bot Discord, dispatch dei messaggi, modalità di consegna della risposta sorgente, stato delle status reaction e ciclo di vita del turno del modello.
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

L’evidenza baseline dovrebbe mostrare la reaction di conferma in coda ma nessuna transizione del ciclo di vita in modalità tool-only. L’evidenza candidata dovrebbe mostrare le status reaction del ciclo di vita in esecuzione quando `messages.statusReactions.enabled` è esplicitamente true.

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

Configura il SUT con gestione guild sempre attiva, `visibleReplies: "message_tool"`, `ackReaction: "👀"` e status reaction esplicite. L’oracolo interroga il vero messaggio Discord che ha innescato l’esecuzione e si aspetta la sequenza osservata `👀 -> 🤔 -> 👍`. Gli artefatti includono `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` e `discord-status-reactions-tool-only-timeline.png`.

## Componenti QA esistenti

Mantis dovrebbe basarsi sullo stack QA privato esistente invece di partire da zero:

- `pnpm openclaw qa discord` esegue già una corsia Discord live con bot driver e SUT.
- Il runner del trasporto live scrive già report e artefatti dei messaggi osservati sotto `.artifacts/qa-e2e/`.
- I leasing delle credenziali Convex forniscono già accesso esclusivo alle credenziali condivise dei trasporti live.
- Il servizio di controllo browser supporta già screenshot, snapshot, profili gestiti headless e profili CDP remoti.
- QA Lab ha già una UI di debug e un bus per test modellati come trasporto.

La prima implementazione di Mantis può essere un runner before/after sottile sopra questi componenti, più un livello di evidenza visiva.

## Modello di evidenza

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

`mantis-summary.json` dovrebbe essere la fonte di verità leggibile dalla macchina. Il report Markdown è destinato ai commenti PR e alla review umana.

Il riepilogo deve includere:

- ref e SHA testati
- trasporto e id scenario
- provider della macchina e id macchina o id leasing
- sorgente delle credenziali senza valori segreti
- risultato baseline
- risultato candidata
- se il bug è stato riprodotto sulla baseline
- se la candidata lo ha corretto
- percorsi degli artefatti
- problemi di configurazione o cleanup sanificati

Gli screenshot sono evidenze, non segreti. Richiedono comunque disciplina di redazione: possono comparire nomi di canali privati, nomi utente o contenuto dei messaggi. Per le PR pubbliche, preferisci link agli artefatti GitHub Actions invece di immagini inline finché la storia della redazione non è più solida.

## Browser e VNC

La corsia browser ha due modalità:

- **Automazione headless**: predefinita per CI. Chrome viene eseguito con CDP abilitato, e Playwright o il controllo browser OpenClaw acquisisce screenshot.
- **Recupero VNC**: abilitato sulla stessa VM quando login, MFA, anti-automazione Discord o debug visivo richiedono una persona.

Il profilo browser dell’osservatore Discord dovrebbe essere abbastanza persistente da evitare il login a ogni esecuzione, ma isolato dallo stato personale del browser. Un profilo appartiene al pool di macchine Mantis, non al laptop di uno sviluppatore.

Quando Mantis si blocca, pubblica un messaggio di stato Discord con:

- id esecuzione
- id scenario
- provider della macchina
- directory degli artefatti
- istruzioni di connessione VNC o noVNC, se disponibili
- breve testo del blocco

La prima distribuzione privata può pubblicare questi messaggi nel canale operatore esistente e spostarli in seguito in un canale Mantis dedicato.

## Macchine

Mantis dovrebbe preferire AWS tramite Crabbox per la prima implementazione remota. Crabbox ci fornisce macchine riscaldate, tracciamento dei leasing, idratazione, log, risultati e cleanup. Se la capacità AWS è troppo lenta o non disponibile, aggiungi un provider Hetzner dietro la stessa interfaccia macchina.

Requisiti minimi della VM:

- Linux con installazione Chrome o Chromium capace di desktop
- accesso CDP per automazione browser
- VNC o noVNC per recupero
- Node 22 e pnpm
- checkout OpenClaw e cache delle dipendenze
- cache del browser Playwright Chromium quando si usa Playwright
- CPU e memoria sufficienti per un OpenClaw Gateway, un browser e un’esecuzione modello
- accesso in uscita a Discord, GitHub, provider di modelli e broker delle credenziali

La VM non dovrebbe conservare segreti raw di lunga durata fuori dagli store di credenziali o profili browser previsti.

## Segreti

I segreti vivono nei segreti dell’organizzazione o del repository GitHub per le esecuzioni remote, e in un file di segreti locale controllato dall’operatore per le esecuzioni locali.

Nomi di segreti consigliati:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per caricamenti pubblici di artefatti GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

A lungo termine, il pool di credenziali Convex dovrebbe restare la sorgente normale per le credenziali dei trasporti live. I segreti GitHub inizializzano il broker e le corsie di fallback. Il workflow status-reactions Discord rimappa i segreti Mantis Crabbox sulle variabili d’ambiente `CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN` che la CLI Crabbox si aspetta. I nomi di segreti GitHub semplici `CRABBOX_*` restano accettati come fallback di compatibilità.

Il runner Mantis non deve mai stampare:

- token dei bot Discord
- chiavi API dei provider
- cookie del browser
- contenuti dei profili di autenticazione
- password VNC
- payload raw delle credenziali

Anche i caricamenti di artefatti pubblici dovrebbero redigere i metadati di destinazione Discord, come id di bot, guild, canale e messaggio. Il workflow smoke GitHub abilita `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per questo motivo.

Se un token viene incollato accidentalmente in un issue, una PR, una chat o un log, ruotalo dopo che il nuovo segreto è stato salvato.

## Artefatti GitHub e commenti PR

I workflow Mantis dovrebbero caricare il bundle completo delle prove come artifact di Actions di breve durata. Quando il workflow viene eseguito per una segnalazione di bug o una PR di correzione, dovrebbe anche pubblicare gli screenshot PNG redatti nel branch `qa-artifacts` ed eseguire l'upsert di un commento su quel bug o su quella PR di correzione con screenshot prima/dopo inline. Non pubblicare la prova principale solo su una PR generica di automazione QA. I log grezzi, i messaggi osservati e le altre prove voluminose restano nell'artifact di Actions.

I workflow di produzione dovrebbero pubblicare quei commenti con la GitHub App Mantis, non con `github-actions[bot]`. Archivia l'id dell'app e la chiave privata come secret GitHub Actions `MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`. Il workflow usa un marker nascosto come chiave di upsert, aggiorna quel commento quando il token può modificarlo e crea un nuovo commento di proprietà di Mantis quando un marker precedente di proprietà del bot non può essere modificato.

Il commento della PR dovrebbe essere breve e visivo:

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

Quando l'esecuzione fallisce perché l'harness è fallito, il commento deve dirlo invece di implicare che il candidato sia fallito.

## Note di deployment privato

Un deployment privato potrebbe avere già un'applicazione Discord Mantis. Riutilizza quell'applicazione invece di creare un'altra app quando ha le autorizzazioni bot corrette e può essere ruotata in modo sicuro.

Imposta il canale iniziale per le notifiche dell'operatore tramite secret o configurazione di deployment. Può puntare prima a un canale esistente dei maintainer o delle operazioni, poi passare a un canale Mantis dedicato quando ne esiste uno.

Non inserire in questo documento id di guild, id di canale, token bot, cookie del browser o password VNC. Archiviali nei secret GitHub, nel broker delle credenziali o nell'archivio locale dei secret dell'operatore.

## Aggiungere uno scenario

Uno scenario Mantis dovrebbe dichiarare:

- id e titolo
- trasporto
- credenziali richieste
- policy del ref baseline
- policy del ref candidato
- patch di configurazione OpenClaw
- passaggi di configurazione
- stimolo
- oracle baseline previsto
- oracle candidato previsto
- target di acquisizione visiva
- budget di timeout
- passaggi di pulizia

Gli scenari dovrebbero preferire oracle piccoli e tipizzati:

- stato delle reazioni Discord per i bug delle reazioni
- riferimenti ai messaggi Discord per i bug di threading
- ts del thread Slack e stato API delle reazioni per i bug Slack
- id dei messaggi email e intestazioni per i bug email
- screenshot del browser quando l'UI è l'unico osservabile affidabile

I controlli visivi dovrebbero essere additivi. Se un'API di piattaforma può dimostrare il bug, usa l'API come oracle di superamento/fallimento e conserva gli screenshot per la fiducia umana.

## Espansione dei provider

Dopo Discord, lo stesso runner può aggiungere:

- Slack: reazioni, thread, menzioni dell'app, modali, caricamenti di file.
- Email: autenticazione Gmail e threading dei messaggi usando `gog` dove i connettori non bastano.
- WhatsApp: login QR, ri-identificazione, consegna dei messaggi, media, reazioni.
- Telegram: gating delle menzioni di gruppo, comandi, reazioni dove disponibili.
- Matrix: stanze cifrate, relazioni di thread o risposta, ripresa dopo riavvio.

Ogni trasporto dovrebbe avere uno scenario smoke economico e uno o più scenari per classe di bug. Gli scenari visivi costosi dovrebbero restare opzionali.

## Domande aperte

- Quale bot Discord dovrebbe essere il driver e quale dovrebbe essere il SUT, quando viene riutilizzato il bot Mantis esistente?
- Il login del browser osservatore dovrebbe usare un account Discord umano, un account di test o solo prove REST leggibili dal bot per la prima fase?
- Per quanto tempo GitHub dovrebbe conservare gli artifact Mantis per le PR?
- Quando ClawSweeper dovrebbe consigliare automaticamente Mantis invece di attendere un comando del maintainer?
- Gli screenshot dovrebbero essere redatti o ritagliati prima del caricamento per le PR pubbliche?
