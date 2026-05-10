---
read_when:
    - Creare o eseguire QA visiva in tempo reale per i bug di OpenClaw
    - Aggiunta della verifica prima e dopo per una richiesta di pull
    - Aggiunta di scenari di trasporto live per Discord, Slack, WhatsApp o altri
    - Debug delle esecuzioni QA che richiedono schermate, automazione del browser o accesso VNC
summary: Mantis è il sistema di verifica end-to-end visiva per riprodurre i bug di OpenClaw su trasporti attivi, acquisire prove prima e dopo e allegare artefatti alle PR.
title: Mantide
x-i18n:
    generated_at: "2026-05-10T19:31:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis è il sistema di verifica end-to-end di OpenClaw per i bug che richiedono un
runtime reale, un trasporto reale e una prova visibile. Esegue uno scenario contro un ref noto
come difettoso, acquisisce le prove, esegue lo stesso scenario contro un ref candidato e
pubblica il confronto come artefatti che un maintainer può ispezionare da una PR o
da un comando locale.

Mantis parte da Discord perché Discord ci offre una prima corsia ad alto valore:
autenticazione bot reale, canali guild reali, reazioni, thread, comandi nativi e una
UI browser in cui gli esseri umani possono confermare visivamente cosa ha mostrato il trasporto.

## Obiettivi

- Riprodurre un bug da una issue o PR GitHub con la stessa forma di trasporto che gli utenti
  vedono.
- Acquisire un artefatto **prima** sul ref di baseline prima di applicare la correzione.
- Acquisire un artefatto **dopo** sul ref candidato dopo aver applicato la correzione.
- Usare un oracolo deterministico quando possibile, come una lettura di reazione tramite REST di Discord
  o un controllo della trascrizione del canale.
- Acquisire screenshot quando il bug ha una superficie UI visibile.
- Eseguire localmente da una CLI controllata da agent e da remoto da GitHub.
- Preservare abbastanza stato macchina per il recupero VNC quando login, automazione del browser o
  autenticazione del provider si bloccano.
- Pubblicare uno stato conciso in un canale Discord dell'operatore quando l'esecuzione è bloccata,
  richiede aiuto manuale VNC o termina.

## Non obiettivi

- Mantis non sostituisce gli unit test. Un'esecuzione Mantis di solito dovrebbe diventare
  un regression test più piccolo dopo che la correzione è compresa.
- Mantis non è il normale gate CI veloce. È più lento, usa credenziali live ed
  è riservato ai bug in cui l'ambiente live è rilevante.
- Mantis non dovrebbe richiedere un essere umano per il normale funzionamento. Il VNC manuale è un percorso di recupero,
  non il percorso normale.
- Mantis non archivia segreti grezzi in artefatti, log, screenshot, report Markdown
  o commenti PR.

## Responsabilità

Mantis vive nello stack QA di OpenClaw.

- OpenClaw possiede il runtime degli scenari, gli adattatori di trasporto, lo schema delle prove e la
  CLI locale sotto `pnpm openclaw qa mantis`.
- QA Lab possiede i componenti dell'harness di trasporto live, gli helper di acquisizione browser e
  gli scrittori di artefatti.
- Crabbox possiede macchine Linux preriscaldate quando serve una VM remota.
- GitHub Actions possiede l'entrypoint del workflow remoto e la conservazione degli artefatti.
- ClawSweeper possiede il routing dei commenti GitHub: parsing dei comandi dei maintainer,
  dispatch del workflow e pubblicazione del commento PR finale.
- Gli agent OpenClaw guidano Mantis tramite Codex quando uno scenario richiede setup agentico,
  debug o reporting di uno stato bloccato.

Questo confine mantiene la conoscenza del trasporto in OpenClaw, la pianificazione delle macchine in
Crabbox e il collante del workflow dei maintainer in ClawSweeper.

## Forma del comando

Il primo comando locale verifica il bot Discord, guild, canale, invio messaggio,
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

Il runner crea worktree detached baseline e candidate sotto la directory di output,
installa le dipendenze, compila ciascun ref, esegue lo scenario con
`--allow-failures`, quindi scrive `baseline/`, `candidate/`, `comparison.json`
e `mantis-report.md`. Per il primo scenario Discord, una verifica riuscita
significa che lo stato baseline è `fail` e lo stato candidate è `pass`.

La seconda sonda Discord prima/dopo mira agli allegati dei thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Quello scenario pubblica un messaggio padre con il bot driver, crea un thread Discord
reale, chiama l'azione `message.thread-reply` di OpenClaw con un
`filePath` locale al repo, quindi interroga il thread per la risposta SUT e il nome file dell'allegato. Lo
screenshot baseline mostra la risposta senza allegato; lo screenshot candidate
mostra l'allegato `mantis-thread-report.md` atteso.

La prima primitiva VM/browser è lo smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Prende in lease o riusa una macchina desktop Crabbox, avvia un browser visibile dentro la
sessione VNC, acquisisce il desktop, recupera gli artefatti nella directory di output
locale e scrive il comando di riconnessione nel report. Il comando usa per impostazione predefinita
il provider Hetzner perché è il primo provider con copertura desktop/VNC funzionante
nella corsia Mantis. Sovrascrivilo con `--provider`, `--crabbox-bin` o
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` quando esegui contro un'altra flotta Crabbox.

Flag utili per lo smoke desktop:

- `--lease-id <cbx_...>` o `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` riusa un desktop preriscaldato.
- `--browser-url <url>` cambia la pagina aperta nel browser visibile.
- `--html-file <path>` renderizza un artefatto HTML locale al repo nel browser visibile. Mantis lo usa per acquisire la timeline generata delle reazioni di stato Discord tramite un vero desktop Crabbox.
- `--browser-profile-dir <remote-path>` riusa una Chrome user-data-dir remota in modo che un desktop Mantis persistente possa rimanere autenticato tra le esecuzioni. Usalo per il profilo viewer Discord Web di lunga durata.
- `--browser-profile-archive-env <name>` ripristina un archivio `.tgz` Chrome user-data-dir base64 dalla variabile d'ambiente nominata prima di avviare il browser. Usalo per testimoni autenticati come Discord Web. La variabile d'ambiente predefinita è `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` controlla la durata dell'acquisizione MP4. Usa una durata più lunga per app web autenticate lente che richiedono tempo per stabilizzarsi.
- `--keep-lease` o `OPENCLAW_MANTIS_KEEP_VM=1` mantiene aperto un lease appena creato e riuscito per l'ispezione VNC. Le esecuzioni fallite mantengono il lease per impostazione predefinita quando ne è stato creato uno, così un operatore può riconnettersi.
- `--class`, `--idle-timeout` e `--ttl` regolano dimensione macchina e durata del lease.

Per le prove Discord Web, Mantis usa un account viewer dedicato invece di un
token bot. Lo scenario API live Discord rimane l'oracolo: crea il thread reale,
invia il `thread-reply` del SUT e controlla l'allegato tramite REST di Discord.
Quando `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` è impostato, lo scenario scrive anche
un artefatto URL Discord Web. Quando `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` è
impostato, lascia quel thread disponibile abbastanza a lungo perché un browser autenticato possa aprirlo
e registrarlo.

Il workflow GitHub apre l'URL del thread candidate in Discord Web, acquisisce uno
screenshot, registra un MP4 e genera un'anteprima GIF ritagliata al movimento quando gli strumenti media
Crabbox sono disponibili. Preferisci un percorso profilo viewer persistente configurato
tramite `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, perché gli archivi completi del profilo Chrome
possono superare il limite di dimensione dei segreti di GitHub. Per profili piccoli/bootstrap,
il workflow può anche ripristinare un archivio `.tgz` base64 da
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Se nessuna sorgente profilo è
configurata, il workflow pubblica comunque gli screenshot deterministici baseline/candidate
degli allegati e registra un avviso che il testimone Discord Web autenticato
è stato saltato.

La prima primitiva completa di trasporto desktop è lo smoke desktop Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Prende in lease o riusa una macchina desktop Crabbox, sincronizza il checkout corrente nella
VM, esegue `pnpm openclaw qa slack` dentro quella VM, apre Slack Web nel browser
VNC, acquisisce il desktop visibile e copia sia gli artefatti QA Slack sia
lo screenshot VNC nella directory di output locale. Questa è la prima forma Mantis
in cui il Gateway OpenClaw SUT e il browser vivono entrambi dentro la stessa
VM desktop Linux.

Con `--gateway-setup`, il comando prepara una home OpenClaw eliminabile persistente
in `$HOME/.openclaw-mantis/slack-openclaw`, applica patch alla configurazione Slack Socket Mode
per il canale selezionato, avvia `openclaw gateway run` sulla porta
`38973` e mantiene Chrome in esecuzione nella sessione VNC. Questa è la modalità "lasciami un
desktop Linux con Slack e un claw in esecuzione"; la corsia QA Slack bot-to-bot
rimane il default quando `--gateway-setup` è omesso.

Input richiesti per `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` per la corsia modello remota. Se localmente è impostata solo
  `OPENAI_API_KEY`, Mantis la mappa a `OPENCLAW_LIVE_OPENAI_KEY`
  prima di invocare Crabbox, così il forwarding env `OPENCLAW_*` di Crabbox può portarla
  nella VM.

Con `--gateway-setup --credential-source convex`, Mantis prende in lease la credenziale SUT Slack
dal pool condiviso prima di creare la VM e inoltra l'id canale in lease,
il token app Socket Mode e il token bot come env runtime `OPENCLAW_MANTIS_SLACK_*`
dentro il desktop. Questo mantiene snelli i workflow GitHub: servono solo
il segreto del broker Convex, non token grezzi di bot o app Slack.

Flag utili per il desktop Slack:

- `--lease-id <cbx_...>` riesegue contro una macchina in cui un operatore ha già effettuato l'accesso a Slack Web tramite VNC.
- `--gateway-setup` avvia un Gateway Slack OpenClaw persistente nella VM invece di eseguire solo la corsia QA bot-to-bot.
- `--keep-lease` mantiene aperta la VM Gateway per l'ispezione VNC dopo il successo; `--no-keep-lease` la ferma dopo aver raccolto gli artefatti.
- `--slack-url <url>` apre uno specifico URL Slack Web. Senza questo flag, Mantis deriva `https://app.slack.com/client/<team>/<channel>` da Slack `auth.test` quando il token bot SUT è disponibile.
- `--slack-channel-id <id>` controlla l'allowlist dei canali Slack usata dal setup Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controlla il profilo Chrome persistente dentro la VM. Il default è `$HOME/.config/openclaw-mantis/slack-chrome-profile`, quindi un login manuale Slack Web sopravvive alle riesecuzioni sullo stesso lease.
- `--credential-source convex --credential-role ci` usa il pool di credenziali condiviso invece dei token env Slack diretti.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` vengono inoltrati alla corsia live Slack.

Il workflow smoke GitHub è `Mantis Discord Smoke`. Il workflow GitHub prima e dopo
per il primo scenario reale è `Mantis Discord Status Reactions`. Accetta:

- `baseline_ref`: il ref che dovrebbe riprodurre il comportamento solo queued.
- `candidate_ref`: il ref che dovrebbe mostrare `queued -> thinking -> done`.

Esegue il checkout del ref dell'harness workflow, compila worktree baseline e candidate
separati, esegue `discord-status-reactions-tool-only` contro ciascun worktree e
carica `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` come
artefatti Actions. Inoltre renderizza l'HTML della timeline di ciascuna corsia in un browser desktop
Crabbox e pubblica quegli screenshot VNC accanto ai PNG deterministici della
timeline nel commento PR. Lo stesso commento PR incorpora anteprime GIF leggere
ritagliate al movimento generate da `crabbox media preview`, collega i clip MP4 corrispondenti
ritagliati al movimento e conserva i file MP4 desktop completi per l'ispezione approfondita.
Gli screenshot restano inline per una revisione rapida. Il workflow compila la
CLI Crabbox da
`openclaw/crabbox` main così può usare gli attuali flag di lease desktop/browser
prima che venga tagliata la prossima release del binario Crabbox.

`Mantis Scenario` è l'entrypoint manuale generico. Accetta un `scenario_id`,
`candidate_ref`, un `baseline_ref` opzionale e un `pr_number` opzionale, quindi
esegue il dispatch del workflow di proprietà dello scenario. Il wrapper è intenzionalmente sottile:
i workflow degli scenari possiedono comunque il loro setup trasporto, credenziali, classe VM,
oracolo atteso e manifesto degli artefatti.

`Mantis Slack Desktop Smoke` è il primo workflow Slack su VM. Esegue il checkout della
ref candidata attendibile in un worktree separato, prende in lease un desktop
Linux Crabbox, esegue `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` contro quel
candidato, apre Slack Web nel browser VNC, registra il desktop, genera
un'anteprima rifilata sul movimento con `crabbox media preview`, carica l'intera
directory degli artifact e, opzionalmente, pubblica il commento di evidenza
inline sulla PR di destinazione.
Per impostazione predefinita usa AWS per il lease del desktop ed espone un input
manuale del provider così gli operatori possono passare a Hetzner quando la
capacità AWS è lenta o non disponibile. Usa questa lane quando vuoi "un desktop
Linux con Slack e un claw in esecuzione" invece di una sola trascrizione Slack
bot-to-bot.

`Mantis Telegram Live` incapsula la lane QA live Telegram esistente nella stessa
pipeline di evidenza PR. Esegue il checkout della ref candidata attendibile in un
worktree separato, esegue `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, scrive un manifesto `mantis-evidence.json` dal riepilogo QA
Telegram e dall'artifact dei messaggi osservati, renderizza la trascrizione HTML
redatta tramite un browser desktop Crabbox, genera una GIF rifilata sul movimento
con `crabbox media preview` e pubblica il commento di evidenza inline sulla PR
quando è disponibile un numero di PR. Questa lane è visuale sulla trascrizione,
non una prova di Telegram Web con accesso effettuato: l'API Telegram Bot fornisce
evidenze stabili sui messaggi live, ma lo stato di login a Telegram Web non è
richiesto per la normale automazione Mantis.

Per la configurazione del desktop Telegram con intervento umano, usa il builder
di scenario:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Il builder prende in lease o riutilizza un desktop Crabbox, installa il binario
nativo Linux di Telegram Desktop, opzionalmente ripristina un archivio di sessione
utente, configura OpenClaw con il token del bot SUT Telegram in lease, avvia
`openclaw gateway run` sulla porta `38974`, pubblica un messaggio di prontezza del
driver-bot nel gruppo privato in lease, quindi cattura uno screenshot e un MP4 dal
desktop VNC visibile. Un token bot non effettua mai l'accesso a Telegram Desktop;
configura solo OpenClaw. Il visualizzatore desktop è una sessione utente Telegram
separata ripristinata da `--telegram-profile-archive-env <name>` o creata
manualmente tramite VNC e mantenuta attiva con `--keep-lease`.

Flag utili per il builder desktop Telegram:

- `--lease-id <cbx_...>` riesegue contro una VM in cui un operatore ha già effettuato l'accesso a Telegram Desktop.
- `--telegram-profile-archive-env <name>` legge un archivio profilo Telegram Desktop `.tgz` base64 da quella variabile env e lo ripristina prima dell'avvio.
- `--telegram-profile-dir <remote-path>` controlla la directory remota del profilo Telegram Desktop. Il valore predefinito è `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` installa e apre Telegram Desktop senza configurare OpenClaw.
- `--credential-source convex --credential-role ci` usa il broker di credenziali condiviso invece dei token env Telegram diretti.

Ogni scenario che pubblica su PR scrive `mantis-evidence.json` accanto al proprio report.
Questo schema è il passaggio di consegne tra il codice dello scenario e i commenti GitHub:

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

I valori `path` degli artifact sono relativi alla directory del manifesto. I valori
`targetPath` sono percorsi relativi sotto la directory di pubblicazione del branch
`qa-artifacts`. Il publisher rifiuta il path traversal e salta le voci marcate
`"required": false` quando anteprime o video opzionali non sono disponibili.

Tipi di artifact supportati:

- `timeline`: screenshot deterministico dello scenario, di solito prima/dopo.
- `desktopScreenshot`: screenshot del desktop VNC/browser.
- `motionPreview`: GIF animata inline generata dalla registrazione del desktop.
- `motionClip`: MP4 rifilato sul movimento che rimuove l'inizio e la coda statici.
- `fullVideo`: registrazione MP4 completa per un'ispezione approfondita.
- `metadata`: sidecar JSON/log.
- `report`: report Markdown.

Il publisher riutilizzabile è `scripts/mantis/publish-pr-evidence.mjs`. I workflow
lo chiamano con il manifesto, la PR di destinazione, la root di destinazione
`qa-artifacts`, il marker del commento, l'URL dell'artifact Actions, l'URL della
run e la sorgente della richiesta. Copia gli artifact dichiarati nel branch
`qa-artifacts`, costruisce un commento PR con riepilogo in evidenza, immagini e
anteprime inline e video collegati, quindi aggiorna il commento marker esistente
o ne crea uno.

Puoi anche attivare la run status-reactions direttamente da un commento PR:

```text
@Mantis discord status reactions
```

Il trigger da commento è intenzionalmente ristretto. Viene eseguito solo sui
commenti alle pull request da utenti con accesso write, maintain o admin, e
riconosce solo richieste di status-reaction Discord. Per impostazione predefinita
usa la ref baseline nota come difettosa e lo SHA head della PR corrente come
candidato. I maintainer possono sovrascrivere entrambe le ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Anche la QA live Telegram può essere attivata da un commento PR:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Per impostazione predefinita usa lo SHA head della PR corrente come candidato ed
esegue `telegram-status-command`. I maintainer possono sovrascrivere
`candidate=...`, `provider=aws|hetzner` e `lease=<cbx_...>` quando serve una ref
specifica o un desktop Crabbox già preparato.

Esempi di comandi ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Il primo comando è esplicito e focalizzato sullo scenario. Il secondo potrà in
seguito mappare una PR o un issue agli scenari Mantis consigliati in base a
etichette, file modificati e risultati della review ClawSweeper.

## Ciclo di vita della run

1. Acquisire le credenziali.
2. Allocare o riutilizzare una VM.
3. Preparare il profilo desktop/browser quando lo scenario richiede evidenza UI.
4. Preparare un checkout pulito per la ref baseline.
5. Installare le dipendenze e compilare solo ciò che serve allo scenario.
6. Avviare un Gateway OpenClaw figlio con una directory di stato isolata.
7. Configurare il trasporto live, il provider, il modello e il profilo browser.
8. Eseguire lo scenario e catturare l'evidenza baseline.
9. Arrestare il Gateway e preservare i log.
10. Preparare la ref candidata nella stessa VM.
11. Eseguire lo stesso scenario e catturare l'evidenza candidata.
12. Confrontare i risultati dell'oracolo e l'evidenza visuale.
13. Scrivere Markdown, JSON, log, screenshot e artifact di trace opzionali.
14. Caricare gli artifact GitHub Actions.
15. Pubblicare un messaggio di stato PR o Discord conciso.

Lo scenario dovrebbe poter fallire in due modi diversi:

- **Bug riprodotto**: la baseline ha fallito nel modo previsto.
- **Errore dell'harness**: configurazione dell'ambiente, credenziali, API Discord, browser o
  provider hanno fallito prima che l'oracolo del bug fosse significativo.

Il report finale deve separare questi casi così i maintainer non confondono un
ambiente instabile con il comportamento del prodotto.

## MVP Discord

Il primo scenario dovrebbe puntare alle reazioni di stato Discord nei canali
guild in cui la modalità di consegna della risposta sorgente è `message_tool_only`.

Perché è un buon seme per Mantis:

- È visibile in Discord come reazioni sul messaggio di attivazione.
- Ha un oracolo REST forte tramite lo stato delle reazioni ai messaggi Discord.
- Esercita un vero Gateway OpenClaw, autenticazione del bot Discord, dispatch dei messaggi,
  modalità di consegna della risposta sorgente, stato delle reazioni di stato e ciclo di vita del turno del modello.
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

L'evidenza baseline dovrebbe mostrare la reazione di conferma in coda ma nessuna
transizione del ciclo di vita in modalità tool-only. L'evidenza candidata dovrebbe
mostrare le reazioni di stato del ciclo di vita in esecuzione quando
`messages.statusReactions.enabled` è esplicitamente `true`.

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

Configura il SUT con gestione guild sempre attiva, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` e reazioni di stato esplicite. L'oracolo
interroga il messaggio reale di attivazione Discord e si aspetta la sequenza
osservata `👀 -> 🤔 -> 👍`. Gli artifact includono
`discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` e
`discord-status-reactions-tool-only-timeline.png`.

## Componenti QA esistenti

Mantis dovrebbe costruire sullo stack QA privato esistente invece di partire da
zero:

- `pnpm openclaw qa discord` esegue già una lane Discord live con bot driver e SUT.
- Il runner del trasporto live scrive già report e artifact dei messaggi osservati sotto `.artifacts/qa-e2e/`.
- I lease di credenziali Convex forniscono già accesso esclusivo alle credenziali di trasporto live condivise.
- Il servizio di controllo browser supporta già screenshot, snapshot, profili gestiti headless e profili CDP remoti.
- QA Lab ha già una UI debugger e un bus per test modellati sul trasporto.

La prima implementazione Mantis può essere un sottile runner prima/dopo sopra
questi componenti, più uno strato di evidenza visuale.

## Modello di evidenza

Ogni run scrive una directory di artifact stabile:

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

`mantis-summary.json` dovrebbe essere la fonte di verità machine-readable. Il
report Markdown è per i commenti PR e la revisione umana.

Il riepilogo deve includere:

- ref e SHA testati
- trasporto e ID scenario
- provider macchina e ID macchina o ID lease
- sorgente delle credenziali senza valori segreti
- risultato baseline
- risultato candidato
- se il bug è stato riprodotto sulla baseline
- se il candidato lo ha corretto
- percorsi degli artifact
- problemi di setup o cleanup sanificati

Gli screenshot sono evidenze, non segreti. Richiedono comunque disciplina di
redazione: possono apparire nomi di canali privati, nomi utente o contenuto dei
messaggi. Per le PR pubbliche, preferisci link agli artifact GitHub Actions invece
di immagini inline finché la storia della redazione non sarà più robusta.

## Browser e VNC

La lane browser ha due modalità:

- **Automazione headless**: predefinita per CI. Chrome viene eseguito con CDP abilitato e
  Playwright o il controllo browser di OpenClaw cattura gli screenshot.
- **Rescue VNC**: abilitata sulla stessa VM quando login, MFA, anti-automazione Discord
  o debugging visuale richiedono un intervento umano.

Il profilo browser dell'osservatore Discord dovrebbe essere abbastanza persistente
da evitare il login a ogni run, ma isolato dallo stato del browser personale. Un
profilo appartiene al pool di macchine Mantis, non a un laptop di sviluppo.

Quando Mantis si blocca, pubblica un messaggio di stato Discord con:

- id esecuzione
- id scenario
- provider della macchina
- directory degli artefatti
- istruzioni di connessione VNC o noVNC, se disponibili
- breve testo del blocco

Il primo deployment privato può pubblicare questi messaggi nel canale operatore esistente e passare in seguito a un canale Mantis dedicato.

## Macchine

Mantis dovrebbe preferire AWS tramite Crabbox per la prima implementazione remota. Crabbox ci fornisce macchine già pronte, tracciamento dei lease, idratazione, log, risultati e pulizia. Se la capacità AWS è troppo lenta o non disponibile, aggiungi un provider Hetzner dietro la stessa interfaccia macchina.

Requisiti minimi della VM:

- Linux con installazione di Chrome o Chromium adatta al desktop
- accesso CDP per l'automazione del browser
- VNC o noVNC per il recupero
- Node 22 e pnpm
- checkout di OpenClaw e cache delle dipendenze
- cache del browser Playwright Chromium quando si usa Playwright
- CPU e memoria sufficienti per un Gateway OpenClaw, un browser e un'esecuzione del modello
- accesso in uscita a Discord, GitHub, provider di modelli e broker delle credenziali

La VM non dovrebbe conservare segreti grezzi a lunga durata al di fuori degli archivi di credenziali o profili browser previsti.

## Segreti

I segreti risiedono nei segreti dell'organizzazione o del repository GitHub per le esecuzioni remote e in un file di segreti locale controllato dall'operatore per le esecuzioni locali.

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

A lungo termine, il pool di credenziali Convex dovrebbe rimanere la fonte normale per le credenziali di trasporto live. I segreti GitHub inizializzano il broker e le corsie di fallback. Il workflow delle reazioni di stato Discord mappa i segreti Mantis Crabbox di nuovo alle variabili d'ambiente `CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN` attese dalla CLI Crabbox. I nomi semplici dei segreti GitHub `CRABBOX_*` rimangono accettati come fallback di compatibilità.

Il runner Mantis non deve mai stampare:

- token dei bot Discord
- chiavi API dei provider
- cookie del browser
- contenuti dei profili di autenticazione
- password VNC
- payload grezzi delle credenziali

I caricamenti pubblici di artefatti dovrebbero anche oscurare i metadati del target Discord, come bot, guild, canale e id messaggio. Il workflow smoke di GitHub abilita `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per questo motivo.

Se un token viene incollato accidentalmente in una issue, PR, chat o log, ruotalo dopo che il nuovo segreto è stato archiviato.

## Artefatti GitHub e commenti PR

I workflow Mantis dovrebbero caricare l'intero bundle di prove come artefatto Actions a breve durata. Quando il workflow viene eseguito per una segnalazione di bug o una PR di correzione, dovrebbe anche pubblicare gli screenshot PNG oscurati sul branch `qa-artifacts` e aggiornare o inserire un commento su quel bug o quella PR di correzione con screenshot prima/dopo inline. Non pubblicare la prova principale solo su una PR generica di automazione QA. Log grezzi, messaggi osservati e altre prove voluminose restano nell'artefatto Actions.

I workflow di produzione dovrebbero pubblicare questi commenti con la GitHub App Mantis, non con `github-actions[bot]`. Archivia l'id dell'app e la chiave privata come segreti GitHub Actions `MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`. Il workflow usa un marcatore nascosto come chiave di upsert, aggiorna quel commento quando il token può modificarlo e crea un nuovo commento di proprietà di Mantis quando non è possibile modificare un marcatore più vecchio di proprietà del bot.

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

Quando l'esecuzione fallisce perché l'harness è fallito, il commento deve dirlo invece di implicare che il candidate sia fallito.

## Note sul deployment privato

Un deployment privato potrebbe già avere un'applicazione Discord Mantis. Riutilizza quell'applicazione invece di crearne un'altra quando ha le autorizzazioni bot corrette e può essere ruotata in sicurezza.

Imposta il canale iniziale di notifica operatore tramite segreti o configurazione di deployment. Può puntare prima a un canale manutentori o operazioni esistente, poi passare a un canale Mantis dedicato una volta creato.

Non inserire guild id, channel id, token bot, cookie del browser o password VNC in questo documento. Archiviali nei segreti GitHub, nel broker delle credenziali o nell'archivio di segreti locale dell'operatore.

## Aggiungere uno scenario

Uno scenario Mantis dovrebbe dichiarare:

- id e titolo
- trasporto
- credenziali richieste
- policy del ref baseline
- policy del ref candidate
- patch della configurazione OpenClaw
- passaggi di setup
- stimolo
- oracolo baseline previsto
- oracolo candidate previsto
- target di acquisizione visiva
- budget di timeout
- passaggi di pulizia

Gli scenari dovrebbero preferire oracoli piccoli e tipizzati:

- stato delle reazioni Discord per bug di reazione
- riferimenti ai messaggi Discord per bug di threading
- thread ts Slack e stato API delle reazioni per bug Slack
- id messaggio email e intestazioni per bug email
- screenshot del browser quando l'interfaccia utente è l'unico osservabile affidabile

I controlli visivi dovrebbero essere additivi. Se un'API della piattaforma può provare il bug, usa l'API come oracolo di superamento/fallimento e conserva gli screenshot per la fiducia umana.

## Espansione dei provider

Dopo Discord, lo stesso runner può aggiungere:

- Slack: reazioni, thread, menzioni app, modali, caricamenti file.
- Email: autenticazione Gmail e threading dei messaggi usando `gog` dove i connettori non bastano.
- WhatsApp: login QR, re-identificazione, consegna dei messaggi, media, reazioni.
- Telegram: gating delle menzioni di gruppo, comandi, reazioni dove disponibili.
- Matrix: stanze cifrate, relazioni di thread o risposta, ripresa dopo riavvio.

Ogni trasporto dovrebbe avere uno scenario smoke economico e uno o più scenari per classe di bug. Gli scenari visivi costosi dovrebbero restare opt-in.

## Domande aperte

- Quale bot Discord dovrebbe essere il driver e quale il SUT quando viene riutilizzato il bot Mantis esistente?
- Il login del browser osservatore dovrebbe usare un account Discord umano, un account di test o solo prove REST leggibili dal bot per la prima fase?
- Per quanto tempo GitHub dovrebbe conservare gli artefatti Mantis per le PR?
- Quando ClawSweeper dovrebbe consigliare automaticamente Mantis invece di attendere un comando del manutentore?
- Gli screenshot dovrebbero essere oscurati o ritagliati prima del caricamento per le PR pubbliche?
