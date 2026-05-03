---
read_when:
    - Creare o eseguire QA visiva live per bug di OpenClaw
    - Aggiunta della verifica prima e dopo per una pull request
    - Aggiunta di scenari di trasporto live per Discord, Slack, WhatsApp o altri
    - Debug delle esecuzioni QA che richiedono screenshot, automazione del browser o accesso VNC
summary: Mantis è il sistema di verifica visiva end-to-end per riprodurre i bug di OpenClaw sui trasporti live, acquisire evidenze prima e dopo e allegare artefatti alle PR.
title: Mantide
x-i18n:
    generated_at: "2026-05-03T21:30:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis è il sistema di verifica end-to-end di OpenClaw per bug che richiedono un
runtime reale, un trasporto reale e prove visibili. Esegue uno scenario rispetto
a una ref notoriamente difettosa, acquisisce evidenze, esegue lo stesso scenario
rispetto a una ref candidata e pubblica il confronto come artefatti che un
maintainer può ispezionare da una PR o da un comando locale.

Mantis parte da Discord perché Discord ci offre una prima corsia di alto valore:
autenticazione bot reale, canali guild reali, reazioni, thread, comandi nativi e
una UI nel browser in cui le persone possono confermare visivamente ciò che il
trasporto ha mostrato.

## Obiettivi

- Riprodurre un bug da una issue o PR GitHub con la stessa forma di trasporto che
  vedono gli utenti.
- Acquisire un artefatto **prima** sulla ref di base prima di applicare la
  correzione.
- Acquisire un artefatto **dopo** sulla ref candidata dopo aver applicato la
  correzione.
- Usare un oracolo deterministico ogni volta che è possibile, come una lettura di
  una reazione tramite REST Discord o un controllo del transcript del canale.
- Acquisire screenshot quando il bug ha una superficie UI visibile.
- Eseguire localmente da una CLI controllata da agent e da remoto da GitHub.
- Conservare abbastanza stato macchina per il recupero tramite VNC quando login,
  automazione del browser o autenticazione del provider si bloccano.
- Pubblicare uno stato conciso su un canale Discord operatore quando l’esecuzione
  è bloccata, richiede aiuto manuale tramite VNC o termina.

## Non obiettivi

- Mantis non sostituisce gli unit test. Un’esecuzione Mantis di solito dovrebbe
  diventare un test di regressione più piccolo dopo che la correzione è stata
  compresa.
- Mantis non è il normale gate CI veloce. È più lento, usa credenziali live ed è
  riservato ai bug in cui l’ambiente live è rilevante.
- Mantis non dovrebbe richiedere una persona per il funzionamento normale. Il VNC
  manuale è un percorso di recupero, non il percorso principale.
- Mantis non archivia segreti grezzi in artefatti, log, screenshot, report
  Markdown o commenti PR.

## Proprietà

Mantis fa parte dello stack QA di OpenClaw.

- OpenClaw possiede il runtime degli scenari, gli adattatori di trasporto, lo
  schema delle evidenze e la CLI locale sotto `pnpm openclaw qa mantis`.
- QA Lab possiede le parti dell’harness di trasporto live, gli helper di
  acquisizione browser e gli writer degli artefatti.
- Crabbox possiede le macchine Linux già riscaldate quando serve una VM remota.
- GitHub Actions possiede l’entrypoint del workflow remoto e la conservazione
  degli artefatti.
- ClawSweeper possiede il routing dei commenti GitHub: parsing dei comandi dei
  maintainer, dispatch del workflow e pubblicazione del commento PR finale.
- Gli agent OpenClaw guidano Mantis tramite Codex quando uno scenario richiede
  configurazione agentica, debugging o segnalazione di stati bloccati.

Questo confine mantiene la conoscenza del trasporto in OpenClaw, la pianificazione
delle macchine in Crabbox e il collante del workflow dei maintainer in
ClawSweeper.

## Forma dei comandi

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

Il runner crea worktree detached di base e candidati sotto la directory di output,
installa le dipendenze, compila ogni ref, esegue lo scenario con
`--allow-failures`, quindi scrive `baseline/`, `candidate/`, `comparison.json` e
`mantis-report.md`. Per il primo scenario Discord, una verifica riuscita significa
che lo stato della baseline è `fail` e lo stato del candidato è `pass`.

Il workflow smoke GitHub è `Mantis Discord Smoke`. Il workflow GitHub prima e
dopo per il primo scenario reale è `Mantis Discord Status Reactions`. Accetta:

- `baseline_ref`: la ref da cui ci si aspetta di riprodurre il comportamento solo
  in coda.
- `candidate_ref`: la ref da cui ci si aspetta di mostrare `queued -> thinking -> done`.

Esegue il checkout della ref dell’harness del workflow, compila worktree separati
di base e candidati, esegue `discord-status-reactions-tool-only` rispetto a ogni
worktree e carica `baseline/`, `candidate/`, `comparison.json` e
`mantis-report.md` come artefatti Actions.

Puoi anche attivare l’esecuzione delle reazioni di stato direttamente da un
commento PR:

```text
@Mantis discord status reactions
```

Il trigger da commento è intenzionalmente ristretto. Viene eseguito solo su
commenti di pull request da utenti con accesso write, maintain o admin e riconosce
solo richieste di reazioni di stato Discord. Per impostazione predefinita usa la
ref baseline notoriamente difettosa e lo SHA head corrente della PR come
candidato. I maintainer possono sovrascrivere entrambe le ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Esempi di comandi ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Il primo comando è esplicito e focalizzato sullo scenario. Il secondo potrà in
seguito mappare una PR o issue agli scenari Mantis consigliati a partire da
etichette, file modificati e risultati delle review ClawSweeper.

## Ciclo di esecuzione

1. Acquisire le credenziali.
2. Allocare o riutilizzare una VM.
3. Preparare un checkout pulito per la ref di base.
4. Installare le dipendenze e compilare solo ciò che serve allo scenario.
5. Avviare un Gateway OpenClaw figlio con una directory di stato isolata.
6. Configurare il trasporto live, il provider, il modello e il profilo browser.
7. Eseguire lo scenario e acquisire le evidenze di base.
8. Fermare il gateway e conservare i log.
9. Preparare la ref candidata nella stessa VM.
10. Eseguire lo stesso scenario e acquisire le evidenze candidate.
11. Confrontare i risultati dell’oracolo e le evidenze visive.
12. Scrivere Markdown, JSON, log, screenshot e artefatti di trace opzionali.
13. Caricare gli artefatti GitHub Actions.
14. Pubblicare un messaggio di stato PR o Discord conciso.

Lo scenario dovrebbe poter fallire in due modi diversi:

- **Bug riprodotto**: la baseline è fallita nel modo previsto.
- **Errore dell’harness**: configurazione dell’ambiente, credenziali, API
  Discord, browser o provider sono falliti prima che l’oracolo del bug fosse
  significativo.

Il report finale deve separare questi casi in modo che i maintainer non confondano
un ambiente instabile con il comportamento del prodotto.

## MVP Discord

Il primo scenario dovrebbe riguardare le reazioni di stato Discord nei canali
guild in cui la modalità di recapito della risposta sorgente è `message_tool_only`.

Perché è un buon seme per Mantis:

- È visibile in Discord come reazioni sul messaggio di attivazione.
- Ha un forte oracolo REST tramite lo stato delle reazioni dei messaggi Discord.
- Esercita un vero Gateway OpenClaw, autenticazione bot Discord, dispatch dei
  messaggi, modalità di recapito della risposta sorgente, stato delle reazioni di
  stato e ciclo di vita del turno del modello.
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

Le evidenze di base dovrebbero mostrare la reazione di acknowledgement in coda ma
nessuna transizione del ciclo di vita in modalità solo tool. Le evidenze candidate
dovrebbero mostrare le reazioni di stato del ciclo di vita in esecuzione quando
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
"message_tool"`, `ackReaction: "👀"` e reazioni di stato esplicite. L’oracolo
interroga il messaggio Discord di attivazione reale e si aspetta la sequenza
osservata `👀 -> 🤔 -> 👍`. Gli artefatti includono
`discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` e
`discord-status-reactions-tool-only-timeline.png`.

## Componenti QA esistenti

Mantis dovrebbe basarsi sullo stack QA privato esistente invece di partire da
zero:

- `pnpm openclaw qa discord` esegue già una corsia Discord live con bot driver e
  SUT.
- Il runner di trasporto live scrive già report e artefatti dei messaggi
  osservati sotto `.artifacts/qa-e2e/`.
- I lease di credenziali Convex forniscono già accesso esclusivo a credenziali di
  trasporto live condivise.
- Il servizio di controllo browser supporta già screenshot, snapshot, profili
  gestiti headless e profili CDP remoti.
- QA Lab ha già una UI di debugger e un bus per test con forma di trasporto.

La prima implementazione di Mantis può essere un runner prima/dopo sottile sopra
questi componenti, più un livello di evidenze visive.

## Modello delle evidenze

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
macchina. Il report Markdown è destinato ai commenti PR e alla review umana.

Il riepilogo deve includere:

- ref e SHA testati
- trasporto e id scenario
- provider della macchina e id macchina o id lease
- origine delle credenziali senza valori segreti
- risultato della baseline
- risultato del candidato
- se il bug è stato riprodotto sulla baseline
- se il candidato lo ha corretto
- percorsi degli artefatti
- problemi di configurazione o cleanup sanificati

Gli screenshot sono evidenze, non segreti. Richiedono comunque disciplina di
redazione: potrebbero apparire nomi di canali privati, nomi utente o contenuto dei
messaggi. Per PR pubbliche, preferisci link agli artefatti GitHub Actions invece
di immagini inline finché la strategia di redazione non sarà più solida.

## Browser e VNC

La corsia browser ha due modalità:

- **Automazione headless**: predefinita per CI. Chrome viene eseguito con CDP
  abilitato e Playwright o il controllo browser OpenClaw acquisisce screenshot.
- **Recupero VNC**: abilitato sulla stessa VM quando login, MFA, anti-automazione
  Discord o debugging visivo richiedono una persona.

Il profilo browser dell’osservatore Discord dovrebbe essere abbastanza persistente
da evitare il login a ogni esecuzione, ma isolato dallo stato del browser
personale. Un profilo appartiene al pool di macchine Mantis, non al laptop di uno
sviluppatore.

Quando Mantis si blocca, pubblica un messaggio di stato Discord con:

- id esecuzione
- id scenario
- provider della macchina
- directory degli artefatti
- istruzioni di connessione VNC o noVNC se disponibili
- breve testo del blocco

La prima distribuzione privata può pubblicare questi messaggi nel canale operatore
esistente e passare in seguito a un canale Mantis dedicato.

## Macchine

Mantis dovrebbe preferire AWS tramite Crabbox per la prima implementazione remota.
Crabbox ci offre macchine riscaldate, tracciamento dei lease, idratazione, log,
risultati e cleanup. Se la capacità AWS è troppo lenta o non disponibile,
aggiungere un provider Hetzner dietro la stessa interfaccia macchina.

Requisiti minimi della VM:

- Linux con un’installazione di Chrome o Chromium adatta al desktop
- accesso CDP per l’automazione del browser
- VNC o noVNC per il recupero
- Node 22 e pnpm
- checkout OpenClaw e cache delle dipendenze
- cache del browser Playwright Chromium quando viene usato Playwright
- CPU e memoria sufficienti per un Gateway OpenClaw, un browser e un’esecuzione
  del modello
- accesso in uscita a Discord, GitHub, provider di modelli e broker delle
  credenziali

La VM non dovrebbe conservare segreti grezzi a lunga durata al di fuori degli
store di credenziali o profili browser previsti.

## Segreti

I segreti vivono nei segreti dell’organizzazione o del repository GitHub per le
esecuzioni remote e in un file di segreti locale controllato dall’operatore per le
esecuzioni locali.

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

A lungo termine, il pool di credenziali Convex dovrebbe rimanere la fonte normale per le credenziali di trasporto live. I segreti GitHub avviano il broker e le corsie di fallback.

Il runner Mantis non deve mai stampare:

- token dei bot Discord
- chiavi API dei provider
- cookie del browser
- contenuti dei profili di autenticazione
- password VNC
- payload grezzi delle credenziali

Anche i caricamenti pubblici degli artefatti dovrebbero oscurare i metadati di destinazione Discord, come ID di bot, guild, canali e messaggi. Il workflow smoke di GitHub abilita `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` per questo motivo.

Se un token viene incollato accidentalmente in una issue, PR, chat o log, ruotalo dopo che il nuovo segreto è stato archiviato.

## Artefatti GitHub e commenti PR

I workflow Mantis dovrebbero caricare il bundle completo di prove come artefatto Actions di breve durata. Quando il workflow viene eseguito per una segnalazione di bug o una PR di correzione, dovrebbe anche pubblicare gli screenshot PNG oscurati nel ramo `qa-artifacts` e inserire o aggiornare un commento su quel bug o su quella PR di correzione con screenshot inline prima/dopo. Non pubblicare la prova principale solo su una PR generica di automazione QA. Log grezzi, messaggi osservati e altre prove voluminose restano nell’artefatto Actions.

I workflow di produzione dovrebbero pubblicare quei commenti con la GitHub App di Mantis, non con `github-actions[bot]`. Archivia l’ID dell’app e la chiave privata come segreti GitHub Actions `MANTIS_GITHUB_APP_ID` e `MANTIS_GITHUB_APP_PRIVATE_KEY`. Il workflow usa un marker nascosto come chiave di inserimento o aggiornamento, aggiorna quel commento quando il token può modificarlo e crea un nuovo commento di proprietà di Mantis quando un marker precedente di proprietà del bot non può essere modificato.

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

Quando l’esecuzione fallisce perché l’harness è fallito, il commento deve dirlo invece di implicare che il candidato sia fallito.

## Note sul deployment privato

Un deployment privato potrebbe già avere un’applicazione Discord Mantis. Riutilizza quell’applicazione invece di creare un’altra app quando dispone delle autorizzazioni bot corrette e può essere ruotata in sicurezza.

Imposta il canale iniziale di notifica dell’operatore tramite segreti o configurazione di deployment. Può puntare prima a un canale maintainer o operativo esistente, poi spostarsi su un canale Mantis dedicato quando ne esiste uno.

Non inserire ID di guild, ID di canali, token di bot, cookie del browser o password VNC in questo documento. Archiviali nei segreti GitHub, nel broker delle credenziali o nell’archivio locale dei segreti dell’operatore.

## Aggiunta di uno scenario

Uno scenario Mantis dovrebbe dichiarare:

- ID e titolo
- trasporto
- credenziali richieste
- criterio per il ref baseline
- criterio per il ref candidato
- patch di configurazione OpenClaw
- passaggi di setup
- stimolo
- oracle baseline previsto
- oracle candidato previsto
- target di acquisizione visiva
- budget di timeout
- passaggi di cleanup

Gli scenari dovrebbero preferire oracle piccoli e tipizzati:

- stato delle reazioni Discord per bug sulle reazioni
- riferimenti ai messaggi Discord per bug di threading
- thread ts Slack e stato API delle reazioni per bug Slack
- ID e intestazioni dei messaggi email per bug email
- screenshot del browser quando l’interfaccia utente è l’unico osservabile affidabile

I controlli visivi dovrebbero essere additivi. Se un’API della piattaforma può dimostrare il bug, usa l’API come oracle di superamento/fallimento e conserva gli screenshot per la fiducia umana.

## Espansione dei provider

Dopo Discord, lo stesso runner può aggiungere:

- Slack: reazioni, thread, menzioni dell’app, modali, caricamenti di file.
- Email: autenticazione Gmail e threading dei messaggi usando `gog` quando i connettori non sono sufficienti.
- WhatsApp: login QR, reidentificazione, consegna dei messaggi, contenuti multimediali, reazioni.
- Telegram: gating delle menzioni di gruppo, comandi, reazioni dove disponibili.
- Matrix: stanze crittografate, relazioni di thread o risposta, ripresa dopo riavvio.

Ogni trasporto dovrebbe avere uno scenario smoke economico e uno o più scenari per classe di bug. Gli scenari visivi costosi dovrebbero restare opt-in.

## Domande aperte

- Quale bot Discord dovrebbe essere il driver e quale dovrebbe essere il SUT quando il bot Mantis esistente viene riutilizzato?
- Il login del browser osservatore dovrebbe usare un account Discord umano, un account di test o solo prove REST leggibili dal bot per la prima fase?
- Per quanto tempo GitHub dovrebbe conservare gli artefatti Mantis per le PR?
- Quando ClawSweeper dovrebbe consigliare automaticamente Mantis invece di attendere un comando maintainer?
- Gli screenshot dovrebbero essere oscurati o ritagliati prima del caricamento per le PR pubbliche?
