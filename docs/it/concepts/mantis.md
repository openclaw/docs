---
read_when:
    - Creazione o esecuzione della garanzia qualità visiva in tempo reale per i bug di OpenClaw
    - Aggiunta della verifica prima e dopo per una pull request
    - Aggiunta di scenari di trasporto in tempo reale per Discord, Slack, WhatsApp o altri
    - Risoluzione dei problemi delle esecuzioni QA che richiedono screenshot, automazione del browser o accesso VNC
summary: Mantis è il sistema visivo di verifica end-to-end per riprodurre bug di OpenClaw su trasporti live, acquisire evidenze prima e dopo e allegare artefatti alle PR.
title: Mantide
x-i18n:
    generated_at: "2026-05-05T08:26:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis è il sistema di verifica end-to-end di OpenClaw per bug che richiedono un
runtime reale, un trasporto reale e prove visibili. Esegue uno scenario su un ref
notoriamente difettoso, acquisisce prove, esegue lo stesso scenario su un ref
candidato e pubblica il confronto come artefatti che un maintainer può ispezionare
da una PR o da un comando locale.

Mantis parte da Discord perché Discord ci offre una prima corsia ad alto valore:
autenticazione bot reale, canali di guild reali, reazioni, thread, comandi nativi e una
UI del browser in cui gli esseri umani possono confermare visivamente ciò che il
trasporto ha mostrato.

## Obiettivi

- Riprodurre un bug da una issue o PR di GitHub con la stessa forma di trasporto
  che vedono gli utenti.
- Acquisire un artefatto **prima** sul ref di baseline prima di applicare la correzione.
- Acquisire un artefatto **dopo** sul ref candidato dopo aver applicato la correzione.
- Usare un oracolo deterministico ogni volta che è possibile, come una lettura di
  una reazione tramite REST di Discord o un controllo della trascrizione del canale.
- Acquisire screenshot quando il bug ha una superficie UI visibile.
- Eseguire localmente da una CLI controllata da agent e da remoto da GitHub.
- Conservare abbastanza stato macchina per il recupero tramite VNC quando accesso,
  automazione del browser o autenticazione del provider si bloccano.
- Pubblicare uno stato conciso su un canale Discord per operatori quando l'esecuzione
  è bloccata, richiede assistenza VNC manuale o termina.

## Non obiettivi

- Mantis non sostituisce gli unit test. Un'esecuzione Mantis dovrebbe in genere
  diventare un test di regressione più piccolo dopo che la correzione è stata compresa.
- Mantis non è il normale gate CI veloce. È più lento, usa credenziali live ed è
  riservato ai bug in cui l'ambiente live è importante.
- Mantis non dovrebbe richiedere un essere umano per il funzionamento normale. Il VNC
  manuale è un percorso di recupero, non il percorso previsto.
- Mantis non archivia segreti grezzi in artefatti, log, screenshot, report Markdown
  o commenti PR.

## Proprietà

Mantis vive nello stack QA di OpenClaw.

- OpenClaw possiede il runtime degli scenari, gli adattatori di trasporto, lo schema
  delle prove e la CLI locale sotto `pnpm openclaw qa mantis`.
- QA Lab possiede le parti dell'harness di trasporto live, gli helper di acquisizione
  del browser e gli scrittori di artefatti.
- Crabbox possiede le macchine Linux riscaldate quando serve una VM remota.
- GitHub Actions possiede il punto di ingresso del workflow remoto e la conservazione
  degli artefatti.
- ClawSweeper possiede il routing dei commenti GitHub: parsing dei comandi dei
  maintainer, dispatch del workflow e pubblicazione del commento PR finale.
- Gli agent OpenClaw pilotano Mantis tramite Codex quando uno scenario richiede
  configurazione agentica, debug o segnalazione di stato bloccato.

Questo confine mantiene la conoscenza del trasporto in OpenClaw, la pianificazione
delle macchine in Crabbox e il collante del workflow dei maintainer in ClawSweeper.

## Forma del comando

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

Il runner crea worktree baseline e candidato staccati sotto la directory di output,
installa le dipendenze, compila ogni ref, esegue lo scenario con `--allow-failures`,
quindi scrive `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md`.
Per il primo scenario Discord, una verifica riuscita significa che lo stato baseline
è `fail` e lo stato candidato è `pass`.

La prima primitiva VM/browser è lo smoke desktop:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Prende in lease o riusa una macchina desktop Crabbox, avvia un browser visibile
dentro la sessione VNC, acquisisce il desktop, recupera gli artefatti nella
directory di output locale e scrive il comando di riconnessione nel report. Il
comando usa come predefinito il provider Hetzner perché è il primo provider con
copertura desktop/VNC funzionante nella corsia Mantis. Sovrascrivilo con
`--provider`, `--crabbox-bin` o `OPENCLAW_MANTIS_CRABBOX_PROVIDER` quando esegui
contro un'altra flotta Crabbox.

Flag utili per lo smoke desktop:

- `--lease-id <cbx_...>` o `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` riusa un desktop riscaldato.
- `--browser-url <url>` cambia la pagina aperta nel browser visibile.
- `--html-file <path>` renderizza un artefatto HTML locale al repo nel browser visibile. Mantis lo usa per acquisire la timeline generata delle reazioni di stato Discord tramite un desktop Crabbox reale.
- `--keep-lease` o `OPENCLAW_MANTIS_KEEP_VM=1` mantiene aperto un lease appena creato e riuscito per l'ispezione VNC. Le esecuzioni non riuscite mantengono il lease per impostazione predefinita quando ne è stato creato uno, così un operatore può riconnettersi.
- `--class`, `--idle-timeout` e `--ttl` regolano dimensione macchina e durata del lease.

La prima primitiva completa di trasporto desktop è lo smoke desktop Slack:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Prende in lease o riusa una macchina desktop Crabbox, sincronizza il checkout
corrente nella VM, esegue `pnpm openclaw qa slack` dentro quella VM, apre Slack Web
nel browser VNC, acquisisce il desktop visibile e copia sia gli artefatti QA Slack
sia lo screenshot VNC nella directory di output locale. Questa è la prima forma
Mantis in cui il Gateway OpenClaw SUT e il browser vivono entrambi nella stessa
VM desktop Linux.

Con `--gateway-setup`, il comando prepara una home OpenClaw usa e getta persistente
in `$HOME/.openclaw-mantis/slack-openclaw`, applica patch alla configurazione Slack
Socket Mode per il canale selezionato, avvia `openclaw gateway run` sulla porta
`38973` e mantiene Chrome in esecuzione nella sessione VNC. Questa è la modalità
"lasciami un desktop Linux con Slack e un claw in esecuzione"; la corsia QA Slack
bot-to-bot resta quella predefinita quando `--gateway-setup` è omesso.

Input richiesti per `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` per la corsia modello remota. Se localmente è impostato solo
  `OPENAI_API_KEY`, Mantis lo mappa a `OPENCLAW_LIVE_OPENAI_KEY`
  prima di invocare Crabbox, così l'inoltro delle variabili d'ambiente `OPENCLAW_*`
  di Crabbox può portarlo nella VM.

Flag utili per Slack desktop:

- `--lease-id <cbx_...>` riesegue contro una macchina in cui un operatore ha già effettuato l'accesso a Slack Web tramite VNC.
- `--gateway-setup` avvia un Gateway Slack OpenClaw persistente nella VM invece di eseguire solo la corsia QA bot-to-bot.
- `--slack-url <url>` apre un URL Slack Web specifico. Senza questo, Mantis deriva `https://app.slack.com/client/<team>/<channel>` da Slack `auth.test` quando il token del bot SUT è disponibile.
- `--slack-channel-id <id>` controlla l'allowlist dei canali Slack usata dalla configurazione del Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controlla il profilo Chrome persistente dentro la VM. Il valore predefinito è `$HOME/.config/openclaw-mantis/slack-chrome-profile`, quindi un accesso manuale a Slack Web sopravvive alle riesecuzioni sullo stesso lease.
- `--credential-source convex --credential-role ci` usa il pool di credenziali condiviso invece dei token Slack env diretti.
- `--provider-mode`, `--model`, `--alt-model` e `--fast` vengono passati alla corsia live Slack.

Il workflow smoke GitHub è `Mantis Discord Smoke`. Il workflow GitHub prima e dopo
per il primo scenario reale è `Mantis Discord Status Reactions`. Accetta:

- `baseline_ref`: il ref da cui ci si aspetta di riprodurre il comportamento solo queued.
- `candidate_ref`: il ref da cui ci si aspetta di mostrare `queued -> thinking -> done`.

Esegue il checkout del ref dell'harness del workflow, compila worktree baseline e
candidato separati, esegue `discord-status-reactions-tool-only` contro ogni worktree
e carica `baseline/`, `candidate/`, `comparison.json` e `mantis-report.md` come
artefatti Actions. Renderizza anche l'HTML della timeline di ogni corsia in un
browser desktop Crabbox e pubblica quegli screenshot VNC accanto ai PNG deterministici
delle timeline nel commento PR. Lo stesso commento PR incorpora anteprime GIF leggere
con movimento ridotto generate da `crabbox media preview`, collega i clip MP4
corrispondenti con movimento ridotto e mantiene i file MP4 desktop completi per
un'ispezione approfondita. Gli screenshot restano inline per una revisione rapida.
Il workflow compila la CLI Crabbox da
`openclaw/crabbox` main così può usare i flag correnti di lease desktop/browser
prima del prossimo rilascio del binario Crabbox.

`Mantis Scenario` è il punto di ingresso manuale generico. Prende uno `scenario_id`,
un `candidate_ref`, un `baseline_ref` facoltativo e un `pr_number` facoltativo,
quindi avvia il workflow posseduto dallo scenario. Il wrapper è intenzionalmente
sottile: i workflow degli scenari possiedono ancora configurazione del trasporto,
credenziali, classe VM, oracolo atteso e manifest degli artefatti.

`Mantis Slack Desktop Smoke` è il primo workflow VM Slack. Esegue il checkout del
ref candidato attendibile in un worktree separato, prende in lease un desktop Linux
Crabbox, esegue `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` contro
quel candidato, apre Slack Web nel browser VNC, registra il desktop, genera
un'anteprima con movimento ridotto con `crabbox media preview`, carica l'intera
directory degli artefatti e, facoltativamente, pubblica il commento con prove inline
sulla PR di destinazione. Usa questa corsia quando vuoi "un desktop Linux con Slack
e un claw in esecuzione" invece di sola trascrizione Slack bot-to-bot.

Ogni scenario che pubblica su PR scrive `mantis-evidence.json` accanto al proprio
report. Questo schema è il passaggio di consegne tra il codice dello scenario e i
commenti GitHub:

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
`targetPath` sono percorsi relativi sotto la directory di pubblicazione del branch
`qa-artifacts`. Il publisher rifiuta il path traversal e salta le voci marcate
`"required": false` quando anteprime o video facoltativi non sono disponibili.

Tipi di artefatto supportati:

- `timeline`: screenshot deterministico dello scenario, di solito prima/dopo.
- `desktopScreenshot`: screenshot del desktop VNC/browser.
- `motionPreview`: GIF animata inline generata dalla registrazione del desktop.
- `motionClip`: MP4 con movimento ridotto che rimuove introduzione e coda statiche.
- `fullVideo`: registrazione MP4 completa per un'ispezione approfondita.
- `metadata`: sidecar JSON/log.
- `report`: report Markdown.

Il publisher riutilizzabile è `scripts/mantis/publish-pr-evidence.mjs`. I workflow
lo chiamano con manifest, PR di destinazione, root di destinazione `qa-artifacts`,
marker del commento, URL dell'artefatto Actions, URL dell'esecuzione e origine
della richiesta. Copia gli artefatti dichiarati nel branch `qa-artifacts`, costruisce
un commento PR con il riepilogo in primo piano con immagini/anteprime inline e
video collegati, quindi aggiorna il commento marker esistente o ne crea uno.

Puoi anche attivare direttamente l'esecuzione status-reactions da un commento PR:

```text
@Mantis discord status reactions
```

Il trigger da commento è intenzionalmente stretto. Viene eseguito solo su commenti
di pull request da utenti con accesso write, maintain o admin e riconosce solo le
richieste di reazioni di stato Discord. Per impostazione predefinita usa il ref
baseline notoriamente difettoso e lo SHA head della PR corrente come candidato. I
maintainer possono sovrascrivere uno dei due ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Esempi di comando ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Il primo comando è esplicito e focalizzato sullo scenario. Il secondo può in seguito mappare una PR
o un problema a scenari Mantis consigliati da etichette, file modificati e
risultati della revisione di ClawSweeper.

## Ciclo di esecuzione

1. Acquisire le credenziali.
2. Allocare o riutilizzare una VM.
3. Preparare il profilo desktop/browser quando lo scenario richiede evidenza UI.
4. Preparare un checkout pulito per il ref di baseline.
5. Installare le dipendenze e compilare solo ciò che lo scenario richiede.
6. Avviare un OpenClaw Gateway figlio con una directory di stato isolata.
7. Configurare il trasporto live, il provider, il modello e il profilo browser.
8. Eseguire lo scenario e acquisire l'evidenza di baseline.
9. Arrestare il Gateway e conservare i log.
10. Preparare il ref candidato nella stessa VM.
11. Eseguire lo stesso scenario e acquisire l'evidenza del candidato.
12. Confrontare i risultati dell'oracolo e l'evidenza visiva.
13. Scrivere Markdown, JSON, log, screenshot e artefatti di trace opzionali.
14. Caricare gli artefatti di GitHub Actions.
15. Pubblicare un messaggio di stato conciso sulla PR o su Discord.

Lo scenario dovrebbe poter fallire in due modi diversi:

- **Bug riprodotto**: la baseline è fallita nel modo previsto.
- **Errore dell'harness**: configurazione dell'ambiente, credenziali, API Discord, browser o
  provider sono falliti prima che l'oracolo del bug fosse significativo.

Il report finale deve separare questi casi in modo che i maintainer non confondano un ambiente instabile
con il comportamento del prodotto.

## MVP Discord

Il primo scenario dovrebbe prendere di mira le reazioni di stato Discord nei canali di server in cui
la modalità di consegna della risposta sorgente è `message_tool_only`.

Perché è un buon seme Mantis:

- È visibile in Discord come reazioni sul messaggio di attivazione.
- Ha un oracolo REST forte tramite lo stato delle reazioni del messaggio Discord.
- Esercita un vero OpenClaw Gateway, autenticazione del bot Discord, dispatch dei messaggi,
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

L'evidenza di baseline dovrebbe mostrare la reazione di riconoscimento in coda ma nessuna
transizione del ciclo di vita in modalità solo strumento. L'evidenza del candidato dovrebbe mostrare le reazioni di stato
del ciclo di vita in esecuzione quando `messages.statusReactions.enabled` è esplicitamente
true.

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

Configura il SUT con gestione dei server sempre attiva, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` e reazioni di stato esplicite. L'oracolo
interroga il vero messaggio Discord di attivazione e si aspetta la sequenza osservata
`👀 -> 🤔 -> 👍`. Gli artefatti includono `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` e
`discord-status-reactions-tool-only-timeline.png`.

## Componenti QA esistenti

Mantis dovrebbe basarsi sullo stack QA privato esistente invece di partire da
zero:

- `pnpm openclaw qa discord` esegue già una corsia Discord live con bot driver e
  SUT.
- Il runner di trasporto live scrive già report e artefatti dei messaggi osservati
  sotto `.artifacts/qa-e2e/`.
- I lease delle credenziali Convex forniscono già accesso esclusivo alle credenziali di trasporto live
  condivise.
- Il servizio di controllo browser supporta già screenshot, snapshot,
  profili gestiti headless e profili CDP remoti.
- QA Lab dispone già di una UI di debug e di un bus per test con forma di trasporto.

La prima implementazione di Mantis può essere un runner prima/dopo sottile sopra questi
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
report Markdown è per commenti PR e revisione umana.

Il riepilogo deve includere:

- ref e SHA testati
- trasporto e id scenario
- provider macchina e id macchina o id lease
- fonte delle credenziali senza valori segreti
- risultato baseline
- risultato candidato
- se il bug è stato riprodotto sulla baseline
- se il candidato lo ha corretto
- percorsi degli artefatti
- problemi di configurazione o pulizia sanificati

Gli screenshot sono evidenza, non segreti. Richiedono comunque disciplina di redazione:
possono comparire nomi di canali privati, nomi utente o contenuto dei messaggi. Per PR pubbliche,
preferire link agli artefatti di GitHub Actions rispetto a immagini inline finché la storia di redazione
non è più solida.

## Browser e VNC

La corsia browser ha due modalità:

- **Automazione headless**: predefinita per CI. Chrome viene eseguito con CDP abilitato, e
  Playwright o il controllo browser di OpenClaw acquisiscono screenshot.
- **Recupero VNC**: abilitato sulla stessa VM quando login, MFA, anti-automazione Discord
  o debug visivo richiedono una persona.

Il profilo browser osservatore Discord dovrebbe essere abbastanza persistente da evitare
il login a ogni esecuzione, ma isolato dallo stato del browser personale. Un profilo
appartiene al pool di macchine Mantis, non al laptop di uno sviluppatore.

Quando Mantis si blocca, pubblica un messaggio di stato Discord con:

- id esecuzione
- id scenario
- provider macchina
- directory degli artefatti
- istruzioni di connessione VNC o noVNC se disponibili
- breve testo del blocco

Il primo deployment privato può pubblicare questi messaggi nel canale operatore
esistente e spostarsi in seguito a un canale Mantis dedicato.

## Macchine

Mantis dovrebbe preferire AWS tramite Crabbox per la prima implementazione remota.
Crabbox ci offre macchine preriscaldate, tracciamento dei lease, idratazione, log, risultati e
pulizia. Se la capacità AWS è troppo lenta o non disponibile, aggiungere un provider Hetzner
dietro la stessa interfaccia macchina.

Requisiti minimi della VM:

- Linux con un'installazione di Chrome o Chromium capace di desktop
- accesso CDP per l'automazione browser
- VNC o noVNC per il recupero
- Node 22 e pnpm
- checkout OpenClaw e cache delle dipendenze
- cache browser Playwright Chromium quando si usa Playwright
- CPU e memoria sufficienti per un OpenClaw Gateway, un browser e un'esecuzione del modello
- accesso in uscita a Discord, GitHub, provider di modelli e broker delle credenziali

La VM non dovrebbe conservare segreti raw di lunga durata fuori dagli store di credenziali o
profili browser previsti.

## Segreti

I segreti vivono nei segreti dell'organizzazione o del repository GitHub per le esecuzioni remote, e in
un file di segreti locale controllato dall'operatore per le esecuzioni locali.

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

A lungo termine, il pool di credenziali Convex dovrebbe restare la fonte normale per le credenziali di
trasporto live. I segreti GitHub eseguono il bootstrap del broker e delle corsie di fallback.
Il workflow Discord status-reactions mappa i segreti Mantis Crabbox di nuovo alle variabili d'ambiente
`CRABBOX_COORDINATOR` e `CRABBOX_COORDINATOR_TOKEN`
attese dalla CLI Crabbox. I nomi semplici dei segreti GitHub `CRABBOX_*` restano
accettati come fallback di compatibilità.

Il runner Mantis non deve mai stampare:

- token dei bot Discord
- chiavi API dei provider
- cookie del browser
- contenuti dei profili di autenticazione
- password VNC
- payload raw delle credenziali

Anche i caricamenti di artefatti pubblici dovrebbero oscurare i metadati dei target Discord come bot,
server, canale e id messaggio. Il workflow smoke GitHub abilita
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per questo motivo.

Se un token viene accidentalmente incollato in un issue, PR, chat o log, ruotarlo
dopo che il nuovo segreto è stato memorizzato.

## Artefatti GitHub e commenti PR

I workflow Mantis dovrebbero caricare il bundle completo di evidenza come artefatto Actions
a breve durata. Quando il workflow viene eseguito per una segnalazione di bug o una PR di fix, dovrebbe anche
pubblicare gli screenshot PNG redatti nel branch `qa-artifacts` e aggiornare o creare un
commento su quel bug o quella PR di fix con screenshot prima/dopo inline. Non pubblicare
la prova primaria solo su una PR generica di automazione QA. Log raw, messaggi osservati
e altre evidenze voluminose restano nell'artefatto Actions.

I workflow di produzione dovrebbero pubblicare quei commenti con la GitHub App Mantis, non
con `github-actions[bot]`. Memorizzare l'app id e la chiave privata come segreti
GitHub Actions `MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Il workflow usa un marker nascosto come chiave di upsert, aggiorna quel
commento quando il token può modificarlo e crea un nuovo commento di proprietà Mantis quando
un marker più vecchio di proprietà del bot non può essere modificato.

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

Quando l'esecuzione fallisce perché l'harness è fallito, il commento deve dirlo invece
di lasciare intendere che il candidato sia fallito.

## Note sul deployment privato

Un deployment privato potrebbe già avere un'applicazione Discord Mantis. Riutilizzare tale
applicazione invece di creare un'altra app quando ha le autorizzazioni bot corrette
e può essere ruotata in sicurezza.

Impostare il canale iniziale di notifica operatore tramite segreti o configurazione di
deployment. Può puntare prima a un canale maintainer o operations esistente,
poi spostarsi a un canale Mantis dedicato quando ne esiste uno.

Non inserire id server, id canale, token bot, cookie browser o password VNC
in questo documento. Memorizzarli nei segreti GitHub, nel broker delle credenziali o nello
store segreti locale dell'operatore.

## Aggiunta di uno scenario

Uno scenario Mantis dovrebbe dichiarare:

- id e titolo
- trasporto
- credenziali richieste
- policy del ref di baseline
- policy del ref candidato
- patch di configurazione OpenClaw
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
- ts del thread Slack e stato API delle reazioni per bug Slack
- id messaggio e header email per bug email
- screenshot browser quando la UI è l'unico osservabile affidabile

I controlli visivi dovrebbero essere additivi. Se un'API della piattaforma può provare il bug, usare l'
API come oracolo pass/fail e mantenere gli screenshot per la fiducia umana.

## Espansione dei provider

Dopo Discord, lo stesso runner può aggiungere:

- Slack: reazioni, thread, menzioni dell'app, modali, caricamenti di file.
- E-mail: autenticazione Gmail e threading dei messaggi tramite `gog` dove i connettori non sono
  sufficienti.
- WhatsApp: accesso tramite QR, ri-identificazione, consegna dei messaggi, media, reazioni.
- Telegram: gating delle menzioni nei gruppi, comandi, reazioni dove disponibili.
- Matrix: stanze crittografate, relazioni di thread o risposta, ripresa dopo il riavvio.

Ogni trasporto dovrebbe avere uno scenario smoke economico e uno o più scenari
per classe di bug. Gli scenari visivi costosi dovrebbero restare opt-in.

## Domande Aperte

- Quale bot Discord dovrebbe essere il driver e quale dovrebbe essere il SUT quando viene
  riutilizzato il bot Mantis esistente?
- L'accesso del browser osservatore dovrebbe usare un account Discord umano, un account di test
  o solo prove REST leggibili dal bot per la prima fase?
- Per quanto tempo GitHub dovrebbe conservare gli artefatti Mantis per le PR?
- Quando ClawSweeper dovrebbe consigliare automaticamente Mantis invece di attendere un
  comando da un responsabile della manutenzione?
- Gli screenshot dovrebbero essere oscurati o ritagliati prima del caricamento per le PR pubbliche?
