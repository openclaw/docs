---
read_when:
    - Creare o eseguire QA visiva live per bug di OpenClaw
    - Aggiungere la verifica prima e dopo per una pull request
    - Aggiunta di scenari di trasporto live per Discord, Slack, WhatsApp o altri
    - Debug dei run QA che richiedono screenshot, automazione del browser o accesso VNC
summary: Mantis è il sistema di verifica visiva end-to-end per riprodurre bug di OpenClaw sui trasporti live, acquisire evidenze prima e dopo e allegare artefatti alle PR.
title: Mantide
x-i18n:
    generated_at: "2026-06-27T17:25:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis è il sistema di verifica end-to-end di OpenClaw per bug che richiedono un
runtime reale, un trasporto reale e prove visibili. Esegue uno scenario rispetto
a un ref noto come difettoso, acquisisce le evidenze, esegue lo stesso scenario
rispetto a un ref candidato e pubblica il confronto come artefatti che un
maintainer può ispezionare da una PR o da un comando locale.

Mantis parte da Discord perché Discord ci offre una prima corsia di alto valore:
autenticazione bot reale, canali guild reali, reazioni, thread, comandi nativi e
una UI browser in cui gli esseri umani possono confermare visivamente ciò che il
trasporto ha mostrato.

## Obiettivi

- Riprodurre un bug da una issue o PR di GitHub con la stessa forma di trasporto
  che vedono gli utenti.
- Acquisire un artefatto **prima** sul ref di baseline prima di applicare la
  correzione.
- Acquisire un artefatto **dopo** sul ref candidato dopo aver applicato la
  correzione.
- Usare un oracolo deterministico quando possibile, come una lettura di reazione
  tramite REST Discord o un controllo del transcript del canale.
- Acquisire screenshot quando il bug ha una superficie UI visibile.
- Eseguire localmente da una CLI controllata da agent e da remoto da GitHub.
- Conservare abbastanza stato della macchina per il recupero tramite VNC quando
  login, automazione del browser o autenticazione del provider si bloccano.
- Pubblicare uno stato conciso in un canale Discord operatore quando l’esecuzione
  è bloccata, richiede assistenza VNC manuale o termina.

## Non obiettivi

- Mantis non sostituisce gli unit test. Un’esecuzione Mantis dovrebbe di solito
  diventare un test di regressione più piccolo dopo che la correzione è stata
  compresa.
- Mantis non è il normale gate CI veloce. È più lento, usa credenziali live ed è
  riservato ai bug in cui l’ambiente live conta.
- Mantis non dovrebbe richiedere un essere umano per il funzionamento normale. Il
  VNC manuale è un percorso di recupero, non il percorso felice.
- Mantis non archivia segreti grezzi in artefatti, log, screenshot, report
  Markdown o commenti PR.

## Responsabilità

Mantis vive nello stack QA di OpenClaw.

- OpenClaw possiede il runtime dello scenario, gli adapter di trasporto, lo
  schema delle evidenze e la CLI locale sotto `pnpm openclaw qa mantis`.
- QA Lab possiede i componenti dell’harness di trasporto live, gli helper di
  acquisizione browser e gli writer degli artefatti.
- Crabbox possiede le macchine Linux preriscaldate quando è necessaria una VM
  remota.
- GitHub Actions possiede l’entrypoint del workflow remoto e la retention degli
  artefatti.
- ClawSweeper possiede il routing dei commenti GitHub: parsing dei comandi dei
  maintainer, dispatch del workflow e pubblicazione del commento PR finale.
- Gli agent OpenClaw guidano Mantis tramite Codex quando uno scenario richiede
  configurazione agentica, debugging o segnalazione di stato bloccato.

Questo confine mantiene la conoscenza del trasporto in OpenClaw, la pianificazione
delle macchine in Crabbox e il collante del workflow maintainer in ClawSweeper.

## Forma del comando

Il primo comando locale verifica il bot Discord, la guild, il canale, l’invio del
messaggio, l’invio della reazione e il percorso degli artefatti:

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
`mantis-report.md`. Per il primo scenario Discord, una verifica riuscita significa
che lo stato baseline è `fail` e lo stato candidato è `pass`.

Il secondo probe Discord prima/dopo mira agli allegati nei thread:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Questo scenario pubblica un messaggio padre con il driver bot, crea un vero
thread Discord, chiama l’azione `message.thread-reply` di OpenClaw con un
`filePath` locale al repository, quindi interroga il thread per la risposta del
SUT e il nome file dell’allegato. Lo screenshot baseline mostra la risposta senza
allegato; lo screenshot candidato mostra l’allegato `mantis-thread-report.md`
atteso.

La prima primitiva VM/browser è lo smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Noleggia o riusa una macchina desktop Crabbox, avvia un browser visibile dentro
la sessione VNC, acquisisce il desktop, recupera gli artefatti nella directory di
output locale e scrive nel report il comando di riconnessione. Il comando usa di
default il provider Hetzner perché è il primo provider con copertura
desktop/VNC funzionante nella corsia Mantis. Sovrascrivilo con `--provider`,
`--crabbox-bin` o `OPENCLAW_MANTIS_CRABBOX_PROVIDER` quando esegui contro
un’altra flotta Crabbox.

Flag utili dello smoke desktop:

- `--lease-id <cbx_...>` o `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` riusa un desktop preriscaldato.
- `--browser-url <url>` cambia la pagina aperta nel browser visibile.
- `--html-file <path>` renderizza un artefatto HTML locale al repository nel browser visibile. Mantis lo usa per acquisire la timeline generata delle reazioni di stato Discord tramite un vero desktop Crabbox.
- `--browser-profile-dir <remote-path>` riusa una user-data-dir Chrome remota così un desktop Mantis persistente può restare loggato tra le esecuzioni. Usalo per il profilo del visualizzatore Discord Web di lunga durata.
- `--browser-profile-archive-env <name>` ripristina un archivio user-data-dir Chrome `.tgz` base64 dalla variabile d’ambiente nominata prima di avviare il browser. Usalo per testimoni loggati come Discord Web. La variabile env predefinita è `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` controlla la durata dell’acquisizione MP4. Usa una durata più lunga per app web loggate lente che hanno bisogno di tempo per stabilizzarsi.
- `--keep-lease` o `OPENCLAW_MANTIS_KEEP_VM=1` mantiene aperto un lease appena creato e riuscito per l’ispezione VNC. Le esecuzioni fallite mantengono il lease di default quando ne è stato creato uno, così un operatore può riconnettersi.
- `--class`, `--idle-timeout` e `--ttl` regolano dimensione della macchina e durata del lease.

Per le evidenze Discord Web, Mantis usa un account visualizzatore dedicato invece
di un token bot. Lo scenario live Discord API resta l’oracolo: crea il thread
reale, invia il `thread-reply` del SUT e controlla l’allegato tramite REST
Discord. Quando `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` è impostato, lo
scenario scrive anche un artefatto URL Discord Web. Quando
`OPENCLAW_QA_DISCORD_KEEP_THREADS=1` è impostato, lascia disponibile quel thread
abbastanza a lungo perché un browser loggato possa aprirlo e registrarlo.

Il workflow GitHub apre l’URL del thread candidato in Discord Web, acquisisce uno
screenshot, registra un MP4 e genera un’anteprima GIF ritagliata sul movimento
quando gli strumenti media di Crabbox sono disponibili. Preferisci un percorso
di profilo visualizzatore persistente configurato tramite
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, perché gli archivi completi di
profilo Chrome possono superare il limite di dimensione dei secret di GitHub. Per
profili piccoli/bootstrap, il workflow può anche ripristinare un archivio `.tgz`
base64 da `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Se nessuna fonte di
profilo è configurata, il workflow pubblica comunque gli screenshot deterministici
degli allegati baseline/candidato e registra un avviso che il testimone Discord
Web loggato è stato saltato.

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
browser VNC, acquisisce il desktop visibile e copia sia gli artefatti QA Slack
sia lo screenshot VNC nella directory di output locale. Questa è la prima forma
Mantis in cui il gateway OpenClaw SUT e il browser vivono entrambi dentro la
stessa VM desktop Linux.

Con `--gateway-setup`, il comando prepara una home OpenClaw usa e getta
persistente in `$HOME/.openclaw-mantis/slack-openclaw`, patcha la configurazione
Slack Socket Mode per il canale selezionato, avvia `openclaw gateway run` sulla
porta `38973` e mantiene Chrome in esecuzione nella sessione VNC. Questa è la
modalità “lasciami un desktop Linux con Slack e un claw in esecuzione”; la corsia
QA Slack bot-a-bot resta il default quando `--gateway-setup` è omesso.

Input richiesti per `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` per la corsia del modello remoto. Se localmente è
  impostato solo `OPENAI_API_KEY`, Mantis lo mappa a `OPENCLAW_LIVE_OPENAI_KEY`
  prima di invocare Crabbox, così l’inoltro env `OPENCLAW_*` di Crabbox può
  portarlo dentro la VM.

Con `--gateway-setup --credential-source convex`, Mantis prende in lease la
credenziale Slack SUT dal pool condiviso prima di creare la VM e inoltra l’id
canale in lease, il token app Socket Mode e il token bot come env runtime
`OPENCLAW_MANTIS_SLACK_*` dentro il desktop. Questo mantiene snelli i workflow
GitHub: hanno bisogno solo del secret del broker Convex, non di token bot o app
Slack grezzi.

Flag utili per Slack desktop:

- `--lease-id <cbx_...>` riesegue contro una macchina in cui un operatore ha già effettuato l’accesso a Slack Web tramite VNC.
- `--gateway-setup` avvia un gateway Slack OpenClaw persistente nella VM invece di eseguire solo la corsia QA bot-a-bot.
- `--keep-lease` mantiene aperta la VM gateway per l’ispezione VNC dopo il successo; `--no-keep-lease` la arresta dopo aver raccolto gli artefatti.
- `--slack-url <url>` apre uno specifico URL Slack Web. Senza questo flag, Mantis deriva `https://app.slack.com/client/<team>/<channel>` da Slack `auth.test` quando il token bot SUT è disponibile.
- `--slack-channel-id <id>` controlla la allowlist dei canali Slack usata dalla configurazione gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controlla il profilo Chrome persistente dentro la VM. Il default è `$HOME/.config/openclaw-mantis/slack-chrome-profile`, così un login manuale a Slack Web sopravvive alle riesecuzioni sullo stesso lease.
- `--credential-source convex --credential-role ci` usa il pool di credenziali condiviso invece di token env Slack diretti.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` passano attraverso alla corsia live Slack.

Le esecuzioni checkpoint di approvazione renderizzano snapshot dei messaggi Slack
API in PNG checkpoint per una prova visiva sicura per la CI.
`slack-desktop-smoke.png` è prova di Slack Web solo quando il lease usa un profilo
browser caldo che è già loggato.

Il workflow smoke GitHub è `Mantis Discord Smoke`. Il workflow GitHub prima e
dopo per il primo scenario reale è `Mantis Discord Status Reactions`. Accetta:

- `baseline_ref`: il ref atteso per riprodurre il comportamento solo in coda.
- `candidate_ref`: il ref atteso per mostrare `queued -> thinking -> done`.

Esegue il checkout del ref dell’harness del workflow, compila worktree baseline e
candidato separati, esegue `discord-status-reactions-tool-only` contro ogni
worktree e carica `baseline/`, `candidate/`, `comparison.json` e
`mantis-report.md` come artefatti Actions. Renderizza anche l’HTML della timeline
di ogni corsia in un browser desktop Crabbox e pubblica quegli screenshot VNC
accanto ai PNG deterministici della timeline nel commento PR. Lo stesso commento
PR incorpora anteprime GIF leggere ritagliate sul movimento generate da
`crabbox media preview`, collega le clip MP4 corrispondenti ritagliate sul
movimento e conserva i file MP4 desktop completi per un’ispezione approfondita.
Gli screenshot restano inline per una revisione rapida. Il workflow compila la
CLI Crabbox da `openclaw/crabbox` main così può usare i flag correnti di lease
desktop/browser prima che venga tagliata la prossima release del binario Crabbox.

`Mantis Scenario` è il punto di ingresso manuale generico. Accetta un `scenario_id`,
`candidate_ref`, un `baseline_ref` opzionale e un `pr_number` opzionale, quindi
inoltra al workflow proprietario dello scenario. Il wrapper è intenzionalmente sottile:
i workflow degli scenari continuano a possedere configurazione del trasporto,
credenziali, classe di VM, oracolo atteso e manifest degli artefatti.

`Mantis Slack Desktop Smoke` è il primo workflow Slack su VM. Esegue il checkout del
ref candidato attendibile in un worktree separato, prende in lease un desktop Linux
Crabbox, esegue `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` su quel
candidato, apre Slack Web nel browser VNC, registra il desktop, genera un'anteprima
con ritaglio del movimento con `crabbox media preview`, carica l'intera directory degli
artefatti e, facoltativamente, pubblica il commento di evidenza inline sulla PR di
destinazione. Per impostazione predefinita usa AWS per il lease del desktop ed espone
un input manuale per il provider in modo che gli operatori possano passare a Hetzner
quando la capacità AWS è lenta o non disponibile. Usa questa corsia quando vuoi
"un desktop Linux con Slack e una claw in esecuzione" invece di una sola trascrizione
Slack da bot a bot.

`Mantis Telegram Live` racchiude la corsia QA live Telegram esistente nella stessa
pipeline di evidenza per PR. Esegue il checkout del ref candidato attendibile in un
worktree separato, esegue `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, scrive un manifest `mantis-evidence.json` dal riepilogo QA
Telegram, da `qa-evidence.json` e dagli artefatti del report, renderizza l'HTML di
evidenza redatto tramite un browser desktop Crabbox, genera una GIF con ritaglio del
movimento con `crabbox media preview` e pubblica il commento di evidenza inline sulla
PR quando è disponibile un numero di PR. Questa corsia è un'evidenza visiva QA, non
una prova Telegram Web con accesso effettuato: la Telegram Bot API fornisce evidenza
stabile dei messaggi live, ma lo stato di login di Telegram Web non è richiesto per
la normale automazione Mantis.

`Mantis Telegram Desktop Proof` è il wrapper agentico nativo prima/dopo per Telegram
Desktop. Un maintainer può attivarlo da un commento PR con
`@openclaw-mantis telegram desktop proof`, dall'interfaccia Actions con istruzioni
libere oppure tramite il dispatcher generico `Mantis Scenario`. Il workflow passa a
Codex la PR, il ref baseline, il ref candidato e le istruzioni del maintainer.
L'agente legge la PR, decide quale comportamento visibile in Telegram prova la
modifica, esegue la corsia di prova Crabbox Telegram Desktop con utente reale per
baseline e candidato, itera finché le GIF native sono utili, scrive artefatti
`motionPreview` accoppiati in `mantis-evidence.json`, carica il bundle e pubblica
una tabella di evidenza PR a 2 colonne quando è disponibile un numero di PR.

Per la configurazione Telegram desktop con intervento umano, usa il builder dello scenario:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Il builder prende in lease o riusa un desktop Crabbox, installa il binario nativo
Linux di Telegram Desktop, ripristina facoltativamente un archivio di sessione utente,
configura OpenClaw con il token del bot SUT Telegram in lease, avvia
`openclaw gateway run` sulla porta `38974`, pubblica un messaggio di prontezza del
bot driver nel gruppo privato in lease, quindi cattura uno screenshot e un MP4 dal
desktop VNC visibile. Un token bot non esegue mai il login in Telegram Desktop;
configura solo OpenClaw. Il viewer desktop è una sessione utente Telegram separata
ripristinata da `--telegram-profile-archive-env <name>` o creata manualmente tramite
VNC e mantenuta attiva con `--keep-lease`.

Flag utili del builder Telegram desktop:

- `--lease-id <cbx_...>` riesegue su una VM in cui un operatore ha già effettuato il login a Telegram Desktop.
- `--telegram-profile-archive-env <name>` legge un archivio profilo Telegram Desktop `.tgz` in base64 da quella variabile env e lo ripristina prima dell'avvio.
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

I valori `path` degli artefatti sono relativi alla directory del manifest. I valori
`targetPath` sono percorsi relativi sotto il prefisso artefatti Mantis R2/S3
configurato. Il publisher rifiuta l'attraversamento dei percorsi e salta le voci
contrassegnate con `"required": false` quando anteprime o video opzionali non sono
disponibili.

Tipi di artefatti supportati:

- `timeline`: screenshot deterministico dello scenario, di solito prima/dopo.
- `desktopScreenshot`: screenshot del desktop VNC/browser.
- `motionPreview`: GIF animata inline generata dalla registrazione del desktop.
- `motionClip`: MP4 con ritaglio del movimento che rimuove l'introduzione e la coda statiche.
- `fullVideo`: registrazione MP4 completa per ispezione approfondita.
- `metadata`: sidecar JSON/log.
- `report`: report Markdown.

Il publisher riutilizzabile è `scripts/mantis/publish-pr-evidence.mjs`. I workflow
lo chiamano con manifest, PR di destinazione, radice target degli artefatti, marker
del commento, URL dell'artefatto Actions, URL dell'esecuzione e origine della
richiesta. Carica gli artefatti dichiarati nel bucket Mantis R2/S3 configurato,
costruisce un commento PR con riepilogo iniziale, immagini/anteprime inline e video
collegati, quindi aggiorna il commento marker esistente o ne crea uno. I workflow
pubblicano su `openclaw-crabbox-artifacts` con URL pubblici sotto
`https://artifacts.openclaw.ai`. Forniscono direttamente i valori di bucket,
regione e URL pubblico. Il publisher riutilizzabile richiede:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

Puoi anche attivare l'esecuzione status-reactions direttamente da un commento PR:

```text
@openclaw-mantis discord status reactions
```

Il trigger da commento è intenzionalmente ristretto. Viene eseguito solo sui commenti
di pull request di utenti con accesso write, maintain o admin, e riconosce solo le
richieste Discord status-reaction. Per impostazione predefinita usa il ref baseline
problematico noto e lo SHA HEAD della PR corrente come candidato. I maintainer
possono sovrascrivere entrambi i ref:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Anche la QA live Telegram può essere attivata da un commento PR:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Per impostazione predefinita usa lo SHA HEAD della PR corrente come candidato ed
esegue `telegram-status-command`. I maintainer possono sovrascrivere
`candidate=...`, `provider=aws|hetzner` e `lease=<cbx_...>` quando hanno bisogno di
un ref specifico o di un desktop Crabbox preriscaldato.

Esempi di comandi ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Il primo comando è esplicito e centrato sullo scenario. Il secondo potrà in seguito
mappare una PR o una issue agli scenari Mantis consigliati in base a etichette,
file modificati e risultati di revisione ClawSweeper.

## Ciclo di vita dell'esecuzione

1. Acquisire le credenziali.
2. Allocare o riusare una VM.
3. Preparare il profilo desktop/browser quando lo scenario richiede evidenza UI.
4. Preparare un checkout pulito per il ref baseline.
5. Installare le dipendenze e compilare solo ciò che serve allo scenario.
6. Avviare un Gateway OpenClaw figlio con una directory di stato isolata.
7. Configurare trasporto live, provider, modello e profilo browser.
8. Eseguire lo scenario e catturare l'evidenza baseline.
9. Fermare il gateway e conservare i log.
10. Preparare il ref candidato nella stessa VM.
11. Eseguire lo stesso scenario e catturare l'evidenza del candidato.
12. Confrontare i risultati dell'oracolo e l'evidenza visiva.
13. Scrivere Markdown, JSON, log, screenshot e artefatti di traccia opzionali.
14. Caricare artefatti GitHub Actions.
15. Pubblicare un messaggio di stato conciso su PR o Discord.

Lo scenario dovrebbe poter fallire in due modi diversi:

- **Bug riprodotto**: la baseline è fallita nel modo atteso.
- **Errore dell'harness**: configurazione dell'ambiente, credenziali, Discord API, browser o
  provider sono falliti prima che l'oracolo del bug fosse significativo.

Il report finale deve separare questi casi affinché i maintainer non confondano un
ambiente instabile con il comportamento del prodotto.

## MVP Discord

Il primo scenario dovrebbe mirare alle reazioni di stato Discord nei canali guild in cui
la modalità di consegna della risposta sorgente è `message_tool_only`.

Perché è un buon seme Mantis:

- È visibile in Discord come reazioni sul messaggio di attivazione.
- Ha un forte oracolo REST tramite lo stato delle reazioni al messaggio Discord.
- Esercita un vero Gateway OpenClaw, auth del bot Discord, dispatch dei messaggi,
  modalità di consegna della risposta sorgente, stato delle reazioni di stato e
  ciclo di vita del turno del modello.
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

L'evidenza baseline dovrebbe mostrare la reazione di conferma in coda ma nessuna
transizione del ciclo di vita in modalità solo tool. L'evidenza del candidato dovrebbe
mostrare le reazioni di stato del ciclo di vita in esecuzione quando
`messages.statusReactions.enabled` è esplicitamente `true`.

La prima porzione eseguibile è lo scenario QA live Discord opt-in:

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
interroga il vero messaggio Discord di attivazione e si aspetta la sequenza osservata
`👀 -> 🤔 -> 👍`. Gli artefatti includono `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` e
`discord-status-reactions-tool-only-timeline.png`.

## Componenti QA esistenti

Mantis dovrebbe basarsi sullo stack QA privato esistente invece di partire da zero:

- `pnpm openclaw qa discord` esegue già una corsia Discord live con bot driver e SUT.
- Il runner del trasporto live scrive già report, evidenza QA e artefatti specifici
  del trasporto sotto `.artifacts/qa-e2e/`.
- I lease di credenziali Convex forniscono già accesso esclusivo alle credenziali
  condivise dei trasporti live.
- Il servizio di controllo browser supporta già screenshot, snapshot, profili gestiti
  headless e profili CDP remoti.
- QA Lab ha già una UI di debug e un bus per test a forma di trasporto.

La prima implementazione Mantis può essere un runner prima/dopo sottile sopra questi
componenti, più un livello di evidenza visiva.

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

`mantis-summary.json` dovrebbe essere la fonte di verità leggibile dalla macchina. Il
report Markdown serve per i commenti nelle PR e la revisione umana.

Il riepilogo deve includere:

- riferimenti e SHA testati
- trasporto e id dello scenario
- provider della macchina e id della macchina o id del lease
- origine delle credenziali senza valori segreti
- risultato della baseline
- risultato del candidato
- se il bug è stato riprodotto sulla baseline
- se il candidato lo ha corretto
- percorsi degli artefatti
- problemi di configurazione o pulizia sanificati

Gli screenshot sono prove, non segreti. Richiedono comunque disciplina nella redazione:
possono apparire nomi di canali privati, nomi utente o contenuti dei messaggi. Per le PR pubbliche,
preferisci i link agli artefatti di GitHub Actions rispetto alle immagini inline finché la gestione
della redazione non sarà più solida.

## Browser e VNC

La corsia del browser ha due modalità:

- **Automazione headless**: predefinita per la CI. Chrome viene eseguito con CDP abilitato e
  Playwright o il controllo browser di OpenClaw acquisisce screenshot.
- **Soccorso VNC**: abilitato sulla stessa VM quando login, MFA, anti-automazione di Discord
  o debug visivo richiedono una persona.

Il profilo del browser osservatore di Discord dovrebbe essere abbastanza persistente da evitare
il login a ogni esecuzione, ma isolato dallo stato del browser personale. Un profilo
appartiene al pool di macchine Mantis, non al laptop di uno sviluppatore.

Quando Mantis si blocca, pubblica un messaggio di stato su Discord con:

- id dell'esecuzione
- id dello scenario
- provider della macchina
- directory degli artefatti
- istruzioni di connessione VNC o noVNC se disponibili
- breve testo del blocco

Il primo deployment privato può pubblicare questi messaggi nel canale operatore esistente
e spostarli in seguito in un canale Mantis dedicato.

## Macchine

Mantis dovrebbe preferire AWS tramite Crabbox per la prima implementazione remota.
Crabbox ci offre macchine riscaldate, tracciamento dei lease, idratazione, log, risultati e
pulizia. Se la capacità AWS è troppo lenta o non disponibile, aggiungi un provider Hetzner
dietro la stessa interfaccia macchina.

Requisiti minimi della VM:

- Linux con installazione di Chrome o Chromium capace di desktop
- accesso CDP per l'automazione del browser
- VNC o noVNC per il soccorso
- Node 22 e pnpm
- checkout di OpenClaw e cache delle dipendenze
- cache del browser Chromium di Playwright quando si usa Playwright
- CPU e memoria sufficienti per un Gateway OpenClaw, un browser e un'esecuzione del modello
- accesso in uscita a Discord, GitHub, provider di modelli e broker delle credenziali

La VM non dovrebbe conservare segreti grezzi a lunga durata al di fuori degli archivi previsti
per credenziali o profili browser.

## Segreti

I segreti risiedono nei segreti dell'organizzazione o del repository GitHub per le esecuzioni remote, e in
un file di segreti locale controllato dall'operatore per le esecuzioni locali.

Nomi di segreti consigliati:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per i caricamenti pubblici degli artefatti GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

A lungo termine, il pool di credenziali Convex dovrebbe restare la fonte normale per le credenziali
di trasporto live. I segreti GitHub avviano il broker e le corsie di fallback.
Il workflow delle reazioni allo stato Discord rimappa i segreti Mantis Crabbox alle variabili di ambiente
`CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN`
attese dalla CLI Crabbox. I nomi semplici dei segreti GitHub `CRABBOX_*` restano
accettati come fallback di compatibilità.

Il runner Mantis non deve mai stampare:

- token dei bot Discord
- chiavi API dei provider
- cookie del browser
- contenuti del profilo di autenticazione
- password VNC
- payload grezzi delle credenziali

Anche i caricamenti pubblici degli artefatti dovrebbero redigere i metadati di destinazione Discord come bot,
guild, canale e id dei messaggi. Il workflow smoke di GitHub abilita
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per questo motivo.

Se un token viene incollato accidentalmente in un issue, una PR, una chat o un log, ruotalo
dopo che il nuovo segreto è stato archiviato.

## Artefatti GitHub e commenti PR

I workflow Mantis dovrebbero caricare l'intero pacchetto di prove come artefatto di Actions
a breve durata. Quando il workflow viene eseguito per una segnalazione di bug o una PR di correzione, dovrebbe anche
pubblicare media inline redatti nel bucket Mantis R2/S3 configurato e aggiornare o inserire un
commento su quel bug o quella PR di correzione con screenshot inline prima/dopo. Non pubblicare
la prova principale solo su una PR generica di automazione QA. Log grezzi, messaggi osservati
e altre prove voluminose restano nell'artefatto di Actions.

I workflow di produzione dovrebbero pubblicare quei commenti con la GitHub App Mantis, non
con `github-actions[bot]`. Archivia l'id dell'app e la chiave privata come segreti GitHub Actions
`MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Il workflow usa un marcatore nascosto come chiave di upsert, aggiorna quel
commento quando il token può modificarlo e crea un nuovo commento di proprietà di Mantis quando
un vecchio marcatore di proprietà del bot non può essere modificato.

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

Quando l'esecuzione fallisce perché l'harness è fallito, il commento deve dirlo invece
di implicare che il candidato sia fallito.

## Note sul deployment privato

Un deployment privato potrebbe già avere un'applicazione Discord Mantis. Riutilizza quella
applicazione invece di crearne un'altra quando ha i permessi bot corretti
e può essere ruotata in modo sicuro.

Imposta il canale iniziale di notifica degli operatori tramite segreti o configurazione del deployment.
Può puntare prima a un canale manutentori o operazioni esistente,
poi spostarsi in un canale Mantis dedicato quando ne esiste uno.

Non inserire id di guild, id di canale, token bot, cookie del browser o password VNC
in questo documento. Archiviali nei segreti GitHub, nel broker delle credenziali o nell'archivio
locale di segreti dell'operatore.

## Aggiungere uno scenario

Uno scenario Mantis dovrebbe dichiarare:

- id e titolo
- trasporto
- credenziali richieste
- policy del riferimento baseline
- policy del riferimento candidato
- patch della configurazione OpenClaw
- passaggi di configurazione
- stimolo
- oracolo baseline atteso
- oracolo candidato atteso
- target di acquisizione visiva
- budget di timeout
- passaggi di pulizia

Gli scenari dovrebbero preferire piccoli oracoli tipizzati:

- stato delle reazioni Discord per bug delle reazioni
- riferimenti ai messaggi Discord per bug di threading
- ts del thread Slack e stato API delle reazioni per bug Slack
- id e intestazioni dei messaggi email per bug email
- screenshot del browser quando l'interfaccia utente è l'unico osservabile affidabile

I controlli visivi dovrebbero essere additivi. Se un'API di piattaforma può dimostrare il bug, usa
l'API come oracolo pass/fail e conserva gli screenshot per la fiducia umana.

## Espansione dei provider

Dopo Discord, lo stesso runner può aggiungere:

- Slack: reazioni, thread, menzioni dell'app, modali, caricamenti di file.
- Email: autenticazione Gmail e threading dei messaggi usando `gog` quando i connettori non sono
  sufficienti.
- WhatsApp: login QR, reidentificazione, consegna dei messaggi, media, reazioni.
- Telegram: gating delle menzioni nei gruppi, comandi, reazioni dove disponibili.
- Matrix: stanze crittografate, relazioni di thread o risposta, ripresa dopo riavvio.

Ogni trasporto dovrebbe avere uno scenario smoke economico e uno o più scenari
per classi di bug. Gli scenari visivi costosi dovrebbero restare opt-in.

## Domande aperte

- Quale bot Discord dovrebbe essere il driver e quale dovrebbe essere il SUT quando
  il bot Mantis esistente viene riutilizzato?
- Il login del browser osservatore dovrebbe usare un account Discord umano, un account di test
  o solo prove REST leggibili dai bot per la prima fase?
- Per quanto tempo GitHub dovrebbe conservare gli artefatti Mantis per le PR?
- Quando ClawSweeper dovrebbe raccomandare automaticamente Mantis invece di attendere un
  comando del manutentore?
- Gli screenshot dovrebbero essere redatti o ritagliati prima del caricamento per le PR pubbliche?
