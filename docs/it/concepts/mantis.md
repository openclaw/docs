---
read_when:
    - Creazione o esecuzione del controllo qualità visivo in tempo reale per i bug di OpenClaw
    - Aggiunta della verifica prima e dopo per una pull request
    - Aggiunta di Discord, Slack, WhatsApp o altri scenari di trasporto in tempo reale
    - Debug delle esecuzioni QA che richiedono screenshot, automazione del browser o accesso VNC
summary: Mantis è il sistema di verifica visiva end-to-end per riprodurre bug di OpenClaw sui trasporti live, acquisire prove prima e dopo e allegare artefatti alle PR.
title: Mantide
x-i18n:
    generated_at: "2026-05-11T20:27:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis è il sistema di verifica end-to-end di OpenClaw per i bug che richiedono un vero
ambiente di esecuzione, un vero trasporto e una prova visibile. Esegue uno scenario su un riferimento
notoriamente difettoso, acquisisce le prove, esegue lo stesso scenario su un riferimento candidato e
pubblica il confronto come artefatti che un manutentore può ispezionare da una PR o
da un comando locale.

Mantis parte da Discord perché Discord ci offre una prima corsia ad alto valore:
autenticazione bot reale, canali di guild reali, reazioni, thread, comandi nativi e una
UI del browser in cui gli esseri umani possono confermare visivamente ciò che il trasporto ha mostrato.

## Obiettivi

- Riprodurre un bug da una issue o PR di GitHub con la stessa forma di trasporto che gli utenti
  vedono.
- Acquisire un artefatto **prima** sul riferimento di base prima di applicare la correzione.
- Acquisire un artefatto **dopo** sul riferimento candidato dopo aver applicato la correzione.
- Usare un oracolo deterministico quando possibile, come una lettura di reazione tramite REST di Discord
  o un controllo della trascrizione del canale.
- Acquisire screenshot quando il bug ha una superficie UI visibile.
- Eseguire localmente da una CLI controllata dall’agente e da remoto tramite GitHub.
- Conservare abbastanza stato della macchina per il recupero VNC quando il login, l’automazione del browser o
  l’autenticazione del provider si bloccano.
- Pubblicare uno stato conciso in un canale Discord per operatori quando l’esecuzione è bloccata,
  richiede aiuto manuale tramite VNC o termina.

## Non obiettivi

- Mantis non sostituisce i test unitari. Un’esecuzione Mantis dovrebbe di solito diventare
  un test di regressione più piccolo dopo che la correzione è stata compresa.
- Mantis non è il normale gate CI veloce. È più lento, usa credenziali live ed
  è riservato ai bug in cui l’ambiente live conta.
- Mantis non dovrebbe richiedere un essere umano per il normale funzionamento. Il VNC manuale è un percorso di
  recupero, non il percorso previsto.
- Mantis non archivia segreti grezzi in artefatti, log, screenshot, report Markdown
  o commenti PR.

## Responsabilità

Mantis vive nello stack QA di OpenClaw.

- OpenClaw possiede il runtime degli scenari, gli adattatori di trasporto, lo schema delle prove e
  la CLI locale sotto `pnpm openclaw qa mantis`.
- QA Lab possiede i componenti dell’harness di trasporto live, gli helper di acquisizione del browser e
  gli scrittori di artefatti.
- Crabbox possiede le macchine Linux preriscaldate quando serve una VM remota.
- GitHub Actions possiede l’entrypoint del workflow remoto e la conservazione degli artefatti.
- ClawSweeper possiede l’instradamento dei commenti GitHub: analisi dei comandi dei manutentori,
  dispatch del workflow e pubblicazione del commento PR finale.
- Gli agenti OpenClaw guidano Mantis tramite Codex quando uno scenario richiede configurazione agentica,
  debug o segnalazione di stato bloccato.

Questo confine mantiene la conoscenza del trasporto in OpenClaw, la pianificazione delle macchine in
Crabbox e il collante del workflow dei manutentori in ClawSweeper.

## Forma dei comandi

Il primo comando locale verifica il bot Discord, la guild, il canale, l’invio del messaggio,
l’invio della reazione e il percorso degli artefatti:

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

Il runner crea worktree scollegati per riferimento di base e candidato sotto la directory di output,
installa le dipendenze, compila ciascun riferimento, esegue lo scenario con
`--allow-failures`, quindi scrive `baseline/`, `candidate/`, `comparison.json`
e `mantis-report.md`. Per il primo scenario Discord, una verifica riuscita
significa che lo stato del riferimento di base è `fail` e lo stato del candidato è `pass`.

Il secondo probe Discord prima/dopo prende di mira gli allegati nei thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Quello scenario pubblica un messaggio padre con il bot driver, crea un vero
thread Discord, chiama l’azione `message.thread-reply` di OpenClaw con un
`filePath` locale al repository, quindi interroga il thread per la risposta del SUT e il nome file dell’allegato. Lo
screenshot del riferimento di base mostra la risposta senza allegato; lo screenshot del candidato
mostra l’allegato `mantis-thread-report.md` previsto.

La prima primitiva VM/browser è il test preliminare desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Prende in lease o riutilizza una macchina desktop Crabbox, avvia un browser visibile nella
sessione VNC, acquisisce il desktop, recupera gli artefatti nella directory di output
locale e scrive il comando di riconnessione nel report. Il comando usa per impostazione predefinita
il provider Hetzner perché è il primo provider con copertura desktop/VNC funzionante
nel percorso Mantis. Sovrascrivilo con `--provider`, `--crabbox-bin` o
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` quando lo esegui su un'altra flotta Crabbox.

Flag utili per il test preliminare desktop:

- `--lease-id <cbx_...>` o `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` riutilizza un desktop già riscaldato.
- `--browser-url <url>` cambia la pagina aperta nel browser visibile.
- `--html-file <path>` renderizza un artefatto HTML locale al repository nel browser visibile. Mantis lo usa per acquisire la timeline generata delle reazioni di stato Discord tramite un vero desktop Crabbox.
- `--browser-profile-dir <remote-path>` riutilizza una directory dati utente Chrome remota, così un desktop Mantis persistente può restare autenticato tra le esecuzioni. Usalo per il profilo di visualizzazione Discord Web a lunga durata.
- `--browser-profile-archive-env <name>` ripristina un archivio `.tgz` base64 della directory dati utente Chrome dalla variabile d'ambiente nominata prima di avviare il browser. Usalo per testimoni già autenticati come Discord Web. La variabile d'ambiente predefinita è `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` controlla la durata dell'acquisizione MP4. Usa una durata più lunga per app web autenticate lente che hanno bisogno di tempo per stabilizzarsi.
- `--keep-lease` o `OPENCLAW_MANTIS_KEEP_VM=1` mantiene aperto un lease appena creato e riuscito per l'ispezione VNC. Le esecuzioni non riuscite mantengono il lease per impostazione predefinita quando ne è stato creato uno, così un operatore può riconnettersi.
- `--class`, `--idle-timeout` e `--ttl` regolano dimensione della macchina e durata del lease.

Per le prove Discord Web, Mantis usa un account visualizzatore dedicato invece di un
token bot. Lo scenario live dell'API Discord resta l'oracolo: crea il thread reale,
invia il `thread-reply` del SUT e verifica l'allegato tramite REST Discord. Quando
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` è impostato, lo scenario scrive anche
un artefatto URL Discord Web. Quando `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` è
impostato, lascia quel thread disponibile abbastanza a lungo perché un browser autenticato possa aprirlo
e registrarlo.

Il workflow GitHub apre l'URL del thread candidato in Discord Web, acquisisce uno
screenshot, registra un MP4 e genera un'anteprima GIF ritagliata quando gli strumenti
multimediali Crabbox sono disponibili. Preferisci un percorso di profilo visualizzatore persistente configurato
tramite `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, perché gli archivi completi del profilo Chrome
possono superare il limite di dimensione dei segreti di GitHub. Per profili piccoli/di bootstrap,
il workflow può anche ripristinare un archivio `.tgz` base64 da
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Se nessuna origine del profilo è
configurata, il workflow pubblica comunque gli screenshot deterministici degli allegati baseline/candidati
e registra un avviso che il testimone Discord Web autenticato è stato saltato.

La prima primitiva completa di trasporto desktop è il test preliminare desktop Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Prende in lease o riutilizza una macchina desktop Crabbox, sincronizza il checkout corrente nella
VM, esegue `pnpm openclaw qa slack` dentro quella VM, apre Slack Web nel browser
VNC, acquisisce il desktop visibile e copia sia gli artefatti QA Slack sia
lo screenshot VNC nella directory di output locale. Questa è la prima forma Mantis
in cui il Gateway OpenClaw SUT e il browser vivono entrambi nella stessa
VM desktop Linux.

Con `--gateway-setup`, il comando prepara una home OpenClaw usa e getta persistente
in `$HOME/.openclaw-mantis/slack-openclaw`, applica patch alla configurazione Slack Socket Mode
per il canale selezionato, avvia `openclaw gateway run` sulla porta
`38973` e mantiene Chrome in esecuzione nella sessione VNC. Questa è la modalità "lasciami un
desktop Linux con Slack e un claw in esecuzione"; il percorso QA Slack da bot a bot
rimane il predefinito quando `--gateway-setup` viene omesso.

Input richiesti per `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` per il percorso con modello remoto. Se localmente è impostata solo
  `OPENAI_API_KEY`, Mantis la mappa a `OPENCLAW_LIVE_OPENAI_KEY`
  prima di invocare Crabbox, così l'inoltro delle variabili d'ambiente `OPENCLAW_*` di Crabbox può portarla
  nella VM.

Con `--gateway-setup --credential-source convex`, Mantis prende in lease la credenziale SUT Slack
dal pool condiviso prima di creare la VM e inoltra l'id del canale in lease,
il token app Socket Mode e il token bot come ambiente di runtime `OPENCLAW_MANTIS_SLACK_*`
dentro il desktop. Questo mantiene snelli i workflow GitHub: hanno bisogno solo
del segreto del broker Convex, non dei token grezzi del bot o dell'app Slack.

Flag utili per il desktop Slack:

- `--lease-id <cbx_...>` riesegue su una macchina dove un operatore ha già effettuato l'accesso a Slack Web tramite VNC.
- `--gateway-setup` avvia un Gateway Slack OpenClaw persistente nella VM invece di eseguire solo il percorso QA da bot a bot.
- `--keep-lease` mantiene aperta la VM del Gateway per l'ispezione VNC dopo il successo; `--no-keep-lease` la ferma dopo aver raccolto gli artefatti.
- `--slack-url <url>` apre un URL Slack Web specifico. Senza di esso, Mantis deriva `https://app.slack.com/client/<team>/<channel>` da `auth.test` di Slack quando il token bot SUT è disponibile.
- `--slack-channel-id <id>` controlla l'allowlist dei canali Slack usata dalla configurazione del Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controlla il profilo Chrome persistente dentro la VM. Il valore predefinito è `$HOME/.config/openclaw-mantis/slack-chrome-profile`, quindi un accesso manuale a Slack Web sopravvive alle riesecuzioni sullo stesso lease.
- `--credential-source convex --credential-role ci` usa il pool di credenziali condiviso invece dei token Slack diretti dall'ambiente.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` vengono passati al percorso live Slack.

Il workflow di test preliminare GitHub è `Mantis Discord Smoke`. Il workflow GitHub prima e dopo
per il primo scenario reale è `Mantis Discord Status Reactions`. Accetta:

- `baseline_ref`: il ref che dovrebbe riprodurre il comportamento solo in coda.
- `candidate_ref`: il ref che dovrebbe mostrare `queued -> thinking -> done`.

Esegue il checkout del ref dell'harness del workflow, costruisce worktree baseline e candidati
separati, esegue `discord-status-reactions-tool-only` su ciascun worktree e
carica `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` come
artefatti Actions. Renderizza anche l'HTML della timeline di ciascun percorso in un browser desktop
Crabbox e pubblica quegli screenshot VNC accanto ai PNG deterministici
della timeline nel commento della PR. Lo stesso commento della PR incorpora anteprime GIF leggere
ritagliate sul movimento generate da `crabbox media preview`, collega i clip MP4 corrispondenti
ritagliati sul movimento e conserva i file MP4 desktop completi per un'ispezione approfondita.
Gli screenshot restano inline per una revisione rapida. Il workflow compila la
CLI Crabbox dal main di
`openclaw/crabbox`, così può usare i flag correnti di lease desktop/browser
prima che venga tagliata la prossima release binaria di Crabbox.

`Mantis Scenario` è l'entrypoint manuale generico. Prende un `scenario_id`,
`candidate_ref`, un `baseline_ref` facoltativo e un `pr_number` facoltativo, quindi
invia il workflow di proprietà dello scenario. Il wrapper è intenzionalmente sottile:
i workflow degli scenari continuano a possedere configurazione del trasporto, credenziali, classe VM,
oracolo atteso e manifesto degli artefatti.

`Mantis Slack Desktop Smoke` è il primo flusso di lavoro VM per Slack. Effettua il checkout del ref candidato attendibile in un worktree separato, prende in lease un desktop Linux Crabbox, esegue `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` su quel candidato, apre Slack Web nel browser VNC, registra il desktop, genera un'anteprima tagliata in base al movimento con `crabbox media preview`, carica l'intera directory degli artifact e, facoltativamente, pubblica il commento di evidenza inline sulla PR di destinazione. Usa AWS per impostazione predefinita per il lease del desktop ed espone un input manuale per il provider, così gli operatori possono passare a Hetzner quando la capacità AWS è lenta o non disponibile. Usa questa lane quando vuoi "un desktop Linux con Slack e una claw in esecuzione" invece di una sola trascrizione Slack bot-to-bot.

`Mantis Telegram Live` avvolge la lane QA live Telegram esistente nella stessa pipeline di evidenze PR. Effettua il checkout del ref candidato attendibile in un worktree separato, esegue `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, scrive un manifest `mantis-evidence.json` dal riepilogo QA Telegram e dall'artifact del messaggio osservato, renderizza l'HTML della trascrizione redatta attraverso un browser desktop Crabbox, genera una GIF tagliata in base al movimento con `crabbox media preview` e pubblica il commento di evidenza inline sulla PR quando è disponibile un numero di PR. Questa lane è visiva sulla trascrizione, non una prova Telegram Web con login: l'API Telegram Bot fornisce evidenze stabili dei messaggi live, ma lo stato di login di Telegram Web non è richiesto per la normale automazione Mantis.

`Mantis Telegram Desktop Proof` è il wrapper agentico nativo prima/dopo per Telegram Desktop. Un maintainer può attivarlo da un commento PR con `@Mantis telegram desktop proof`, dall'interfaccia Actions con istruzioni libere, oppure tramite il dispatcher generico `Mantis Scenario`. Il workflow passa a Codex la PR, il ref baseline, il ref candidato e le istruzioni del maintainer. L'agente legge la PR, decide quale comportamento visibile in Telegram prova la modifica, esegue la lane di prova Crabbox Telegram Desktop con utente reale per baseline e candidato, itera finché le GIF native sono utili, scrive artifact `motionPreview` accoppiati in `mantis-evidence.json`, carica il bundle e pubblica una tabella di evidenza PR a 2 colonne quando è disponibile un numero di PR.

Per la configurazione Telegram desktop human-in-the-loop, usa il builder di scenari:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Il builder prende in lease o riutilizza un desktop Crabbox, installa il binario nativo Linux Telegram Desktop, ripristina facoltativamente un archivio di sessione utente, configura OpenClaw con il token bot Telegram SUT in lease, avvia `openclaw gateway run` sulla porta `38974`, pubblica un messaggio di prontezza del bot driver nel gruppo privato in lease, quindi acquisisce uno screenshot e un MP4 dal desktop VNC visibile. Un token bot non effettua mai il login in Telegram Desktop; configura solo OpenClaw. Il visualizzatore desktop è una sessione utente Telegram separata ripristinata da `--telegram-profile-archive-env <name>` oppure creata manualmente tramite VNC e mantenuta attiva con `--keep-lease`.

Flag utili del builder desktop Telegram:

- `--lease-id <cbx_...>` riesegue su una VM in cui un operatore ha già effettuato il login in Telegram Desktop.
- `--telegram-profile-archive-env <name>` legge da quella variabile d'ambiente un archivio profilo Telegram Desktop `.tgz` in base64 e lo ripristina prima dell'avvio.
- `--telegram-profile-dir <remote-path>` controlla la directory remota del profilo Telegram Desktop. Il valore predefinito è `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` installa e apre Telegram Desktop senza configurare OpenClaw.
- `--credential-source convex --credential-role ci` usa il broker di credenziali condiviso invece dei token env Telegram diretti.

Ogni scenario che pubblica su PR scrive `mantis-evidence.json` accanto al suo report. Questo schema è il passaggio di consegne tra il codice dello scenario e i commenti GitHub:

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

I valori `path` degli artifact sono relativi alla directory del manifest. I valori `targetPath` sono percorsi relativi sotto la directory di pubblicazione del branch `qa-artifacts`. Il publisher rifiuta il path traversal e salta le voci contrassegnate con `"required": false` quando anteprime o video opzionali non sono disponibili.

Tipi di artifact supportati:

- `timeline`: screenshot deterministico dello scenario, di solito prima/dopo.
- `desktopScreenshot`: screenshot del desktop VNC/browser.
- `motionPreview`: GIF animata inline generata dalla registrazione del desktop.
- `motionClip`: MP4 tagliato in base al movimento che rimuove introduzione e coda statiche.
- `fullVideo`: registrazione MP4 completa per ispezione approfondita.
- `metadata`: sidecar JSON/log.
- `report`: report Markdown.

Il publisher riutilizzabile è `scripts/mantis/publish-pr-evidence.mjs`. I workflow lo chiamano con il manifest, la PR di destinazione, la radice di destinazione `qa-artifacts`, il marker del commento, l'URL dell'artifact Actions, l'URL della run e la sorgente della richiesta. Copia gli artifact dichiarati nel branch `qa-artifacts`, costruisce un commento PR con riepilogo iniziale, immagini/anteprime inline e video collegati, quindi aggiorna il commento marker esistente o ne crea uno.

Puoi anche attivare direttamente la run delle reazioni di stato da un commento PR:

```text
@Mantis discord status reactions
```

Il trigger da commento è volutamente ristretto. Viene eseguito solo sui commenti delle pull request di utenti con accesso write, maintain o admin, e riconosce solo richieste di reazioni di stato Discord. Per impostazione predefinita usa il ref baseline noto come difettoso e lo SHA dell'head della PR corrente come candidato. I maintainer possono sovrascrivere entrambi i ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Anche il QA live Telegram può essere attivato da un commento PR:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Per impostazione predefinita usa lo SHA dell'head della PR corrente come candidato ed esegue `telegram-status-command`. I maintainer possono sovrascrivere `candidate=...`, `provider=aws|hetzner` e `lease=<cbx_...>` quando serve un ref specifico o un desktop Crabbox già preparato.

Esempi di comandi ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Il primo comando è esplicito e focalizzato sullo scenario. Il secondo potrà in seguito mappare una PR o un issue agli scenari Mantis consigliati in base a label, file modificati e risultati della review ClawSweeper.

## Ciclo di vita della run

1. Acquisire le credenziali.
2. Allocare o riutilizzare una VM.
3. Preparare il profilo desktop/browser quando lo scenario richiede evidenza UI.
4. Preparare un checkout pulito per il ref baseline.
5. Installare le dipendenze e compilare solo ciò di cui lo scenario ha bisogno.
6. Avviare un OpenClaw Gateway figlio con una directory di stato isolata.
7. Configurare il trasporto live, il provider, il modello e il profilo browser.
8. Eseguire lo scenario e acquisire l'evidenza baseline.
9. Arrestare il Gateway e conservare i log.
10. Preparare il ref candidato nella stessa VM.
11. Eseguire lo stesso scenario e acquisire l'evidenza del candidato.
12. Confrontare i risultati dell'oracolo e l'evidenza visiva.
13. Scrivere Markdown, JSON, log, screenshot e artifact di trace opzionali.
14. Caricare gli artifact GitHub Actions.
15. Pubblicare un messaggio di stato PR o Discord conciso.

Lo scenario dovrebbe poter fallire in due modi diversi:

- **Bug riprodotto**: la baseline è fallita nel modo previsto.
- **Errore dell'harness**: configurazione dell'ambiente, credenziali, API Discord, browser o provider sono falliti prima che l'oracolo del bug fosse significativo.

Il report finale deve separare questi casi affinché i maintainer non confondano un ambiente instabile con il comportamento del prodotto.

## MVP Discord

Il primo scenario dovrebbe puntare alle reazioni di stato Discord nei canali guild in cui la modalità di consegna della risposta sorgente è `message_tool_only`.

Perché è un buon seed Mantis:

- È visibile in Discord come reazioni sul messaggio che attiva l'evento.
- Ha un oracolo REST forte tramite lo stato delle reazioni ai messaggi Discord.
- Esercita un OpenClaw Gateway reale, l'autenticazione del bot Discord, il dispatch dei messaggi, la modalità di consegna della risposta sorgente, lo stato delle reazioni di stato e il ciclo di vita del turno del modello.
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

L'evidenza baseline dovrebbe mostrare la reazione di conferma in coda ma nessuna transizione del ciclo di vita in modalità tool-only. L'evidenza del candidato dovrebbe mostrare le reazioni di stato del ciclo di vita in esecuzione quando `messages.statusReactions.enabled` è esplicitamente `true`.

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

Configura il SUT con gestione guild sempre attiva, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` e reazioni di stato esplicite. L'oracolo effettua polling del messaggio Discord reale che attiva l'evento e si aspetta la sequenza osservata `👀 -> 🤔 -> 👍`. Gli artifact includono `discord-qa-reaction-timelines.json`, `discord-status-reactions-tool-only-timeline.html` e `discord-status-reactions-tool-only-timeline.png`.

## Componenti QA esistenti

Mantis dovrebbe basarsi sullo stack QA privato esistente invece di partire da zero:

- `pnpm openclaw qa discord` esegue già una lane Discord live con bot driver e SUT.
- Il runner del trasporto live scrive già report e artifact dei messaggi osservati sotto `.artifacts/qa-e2e/`.
- I lease delle credenziali Convex forniscono già accesso esclusivo alle credenziali di trasporto live condivise.
- Il servizio di controllo browser supporta già screenshot, snapshot, profili gestiti headless e profili CDP remoti.
- QA Lab ha già una UI di debug e un bus per test con forma di trasporto.

La prima implementazione Mantis può essere un sottile runner prima/dopo sopra questi componenti, più un layer di evidenza visiva.

## Modello di evidenza

Ogni run scrive una directory artifact stabile:

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

`mantis-summary.json` dovrebbe essere la fonte di verità leggibile dalla macchina. Il report Markdown è per i commenti PR e la revisione umana.

Il riepilogo deve includere:

- ref e SHA testati
- trasporto e id scenario
- provider della macchina e id macchina o id lease
- sorgente delle credenziali senza valori segreti
- risultato baseline
- risultato candidato
- se il bug si è riprodotto sulla baseline
- se il candidato lo ha corretto
- percorsi degli artifact
- problemi di configurazione o pulizia sanitizzati

Gli screenshot sono prove, non segreti. Richiedono comunque disciplina nell'oscuramento:
possono comparire nomi di canali privati, nomi utente o contenuto dei messaggi. Per le PR pubbliche,
preferisci i link agli artefatti di GitHub Actions rispetto alle immagini inline finché la strategia di oscuramento
non sarà più solida.

## Browser e VNC

La corsia del browser ha due modalità:

- **Automazione headless**: predefinita per la CI. Chrome viene eseguito con CDP abilitato e
  Playwright o il controllo browser di OpenClaw acquisisce gli screenshot.
- **Recupero VNC**: abilitato sulla stessa VM quando login, MFA, anti-automazione di Discord
  o debug visivo richiedono una persona.

Il profilo browser dell'osservatore Discord dovrebbe essere abbastanza persistente da evitare
di eseguire il login a ogni run, ma isolato dallo stato del browser personale. Un profilo
appartiene al pool di macchine Mantis, non al laptop di uno sviluppatore.

Quando Mantis si blocca, pubblica un messaggio di stato su Discord con:

- id del run
- id dello scenario
- provider della macchina
- directory degli artefatti
- istruzioni di connessione VNC o noVNC, se disponibili
- breve testo del blocco

Il primo deployment privato può pubblicare questi messaggi nel canale operatore esistente
e spostarsi in seguito a un canale Mantis dedicato.

## Macchine

Mantis dovrebbe preferire AWS tramite Crabbox per la prima implementazione remota.
Crabbox ci fornisce macchine preriscaldate, tracciamento dei lease, idratazione, log, risultati e
pulizia. Se la capacità AWS è troppo lenta o non disponibile, aggiungi un provider Hetzner
dietro la stessa interfaccia macchina.

Requisiti minimi della VM:

- Linux con installazione di Chrome o Chromium adatta a un desktop
- accesso CDP per l'automazione del browser
- VNC o noVNC per il recupero
- Node 22 e pnpm
- checkout di OpenClaw e cache delle dipendenze
- cache del browser Chromium di Playwright quando viene usato Playwright
- CPU e memoria sufficienti per un Gateway OpenClaw, un browser e un run del modello
- accesso in uscita a Discord, GitHub, provider di modelli e broker delle credenziali

La VM non dovrebbe conservare segreti grezzi a lunga durata fuori dagli archivi previsti per credenziali o
profili browser.

## Segreti

I segreti vivono nei segreti dell'organizzazione o del repository GitHub per i run remoti, e in
un file di segreti locale controllato dall'operatore per i run locali.

Nomi di segreti consigliati:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per i caricamenti pubblici di artefatti GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

A lungo termine, il pool di credenziali Convex dovrebbe restare la fonte normale per le credenziali
di trasporto live. I segreti GitHub inizializzano il broker e le corsie di fallback.
Il workflow delle reazioni di stato Discord mappa i segreti Mantis Crabbox alle variabili d'ambiente
`CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN`
attese dalla CLI Crabbox. I semplici nomi di segreti GitHub `CRABBOX_*` restano
accettati come fallback di compatibilità.

Il runner Mantis non deve mai stampare:

- token dei bot Discord
- chiavi API dei provider
- cookie del browser
- contenuti dei profili di autenticazione
- password VNC
- payload grezzi delle credenziali

Anche i caricamenti pubblici di artefatti dovrebbero oscurare i metadati delle destinazioni Discord, come id di bot,
guild, canali e messaggi. Il workflow smoke di GitHub abilita
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per questo motivo.

Se un token viene incollato accidentalmente in una issue, PR, chat o log, ruotalo
dopo aver archiviato il nuovo segreto.

## Artefatti GitHub e commenti PR

I workflow Mantis dovrebbero caricare il bundle completo delle prove come artefatto Actions
a breve durata. Quando il workflow viene eseguito per una segnalazione di bug o una PR di correzione, dovrebbe anche
pubblicare gli screenshot PNG oscurati nel branch `qa-artifacts` e aggiornare o inserire un
commento su quel bug o su quella PR di correzione con screenshot inline prima/dopo. Non pubblicare
la prova principale solo su una PR generica di automazione QA. Log grezzi, messaggi osservati
e altre prove voluminose restano nell'artefatto Actions.

I workflow di produzione dovrebbero pubblicare quei commenti con la GitHub App Mantis, non
con `github-actions[bot]`. Archivia l'id dell'app e la chiave privata come segreti GitHub Actions
`MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Il workflow usa un marker nascosto come chiave di upsert, aggiorna quel
commento quando il token può modificarlo e crea un nuovo commento di proprietà di Mantis quando
un marker più vecchio di proprietà del bot non può essere modificato.

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

Quando il run fallisce perché l'harness è fallito, il commento deve dichiararlo invece
di insinuare che il candidato sia fallito.

## Note sul deployment privato

Un deployment privato potrebbe già avere un'applicazione Discord Mantis. Riusa quell'applicazione
invece di crearne un'altra quando ha le autorizzazioni bot corrette
e può essere ruotata in sicurezza.

Imposta il canale iniziale per le notifiche agli operatori tramite segreti o configurazione del deployment.
Può puntare prima a un canale maintainer o operativo esistente,
poi spostarsi in un canale Mantis dedicato una volta creato.

Non inserire id di guild, id di canali, token bot, cookie del browser o password VNC
in questo documento. Archiviali nei segreti GitHub, nel broker delle credenziali o nello
store locale dei segreti dell'operatore.

## Aggiunta di uno scenario

Uno scenario Mantis dovrebbe dichiarare:

- id e titolo
- trasporto
- credenziali richieste
- criterio del ref baseline
- criterio del ref candidato
- patch della configurazione OpenClaw
- passaggi di configurazione
- stimolo
- oracolo baseline atteso
- oracolo candidato atteso
- target di acquisizione visiva
- budget di timeout
- passaggi di pulizia

Gli scenari dovrebbero preferire oracoli piccoli e tipizzati:

- stato delle reazioni Discord per bug di reazione
- riferimenti ai messaggi Discord per bug di threading
- ts del thread Slack e stato dell'API delle reazioni per bug Slack
- id e header dei messaggi email per bug email
- screenshot del browser quando la UI è l'unico osservabile affidabile

I controlli visivi dovrebbero essere additivi. Se un'API della piattaforma può provare il bug, usa
l'API come oracolo pass/fail e conserva gli screenshot per la fiducia umana.

## Espansione dei provider

Dopo Discord, lo stesso runner può aggiungere:

- Slack: reazioni, thread, menzioni dell'app, modali, caricamenti di file.
- Email: autenticazione Gmail e threading dei messaggi usando `gog` dove i connettori non sono
  sufficienti.
- WhatsApp: login QR, reidentificazione, consegna dei messaggi, media, reazioni.
- Telegram: gating delle menzioni di gruppo, comandi, reazioni dove disponibili.
- Matrix: stanze criptate, relazioni di thread o risposta, ripresa dopo riavvio.

Ogni trasporto dovrebbe avere uno scenario smoke economico e uno o più scenari per classe di bug.
Gli scenari visivi costosi dovrebbero restare opt-in.

## Questioni aperte

- Quale bot Discord dovrebbe essere il driver e quale dovrebbe essere il SUT quando il
  bot Mantis esistente viene riusato?
- Il login del browser osservatore dovrebbe usare un account Discord umano, un account di test
  o solo prove REST leggibili dal bot per la prima fase?
- Per quanto tempo GitHub dovrebbe conservare gli artefatti Mantis per le PR?
- Quando dovrebbe ClawSweeper consigliare automaticamente Mantis invece di attendere un
  comando del maintainer?
- Gli screenshot dovrebbero essere oscurati o ritagliati prima del caricamento per le PR pubbliche?
