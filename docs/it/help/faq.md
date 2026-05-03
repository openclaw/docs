---
read_when:
    - Rispondere alle domande comuni su configurazione, installazione, procedura iniziale o supporto in fase di esecuzione
    - Triage dei problemi segnalati dagli utenti prima di un debug più approfondito
summary: Domande frequenti sull'installazione, la configurazione e l'utilizzo di OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-05-03T21:35:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372220d62f872db1427b2836662bc8cc74e07d2cdfb651c105d3df25131855dd
    source_path: help/faq.md
    workflow: 16
---

Risposte rapide e risoluzione dei problemi più approfondita per configurazioni reali (sviluppo locale, VPS, multi-agente, chiavi OAuth/API, failover dei modelli). Per la diagnostica di runtime, consulta [Risoluzione dei problemi](/it/gateway/troubleshooting). Per il riferimento completo della configurazione, consulta [Configurazione](/it/gateway/configuration).

## Primi 60 secondi se qualcosa non funziona

1. **Stato rapido (primo controllo)**

   ```bash
   openclaw status
   ```

   Riepilogo locale rapido: sistema operativo + aggiornamento, raggiungibilità di Gateway/servizio, agenti/sessioni, configurazione del provider + problemi di runtime (quando il Gateway è raggiungibile).

2. **Report incollabile (sicuro da condividere)**

   ```bash
   openclaw status --all
   ```

   Diagnosi in sola lettura con coda del log (token redatti).

3. **Stato del demone + porta**

   ```bash
   openclaw gateway status
   ```

   Mostra runtime del supervisore rispetto alla raggiungibilità RPC, l'URL di destinazione della sonda e quale configurazione ha probabilmente usato il servizio.

4. **Sonde approfondite**

   ```bash
   openclaw status --deep
   ```

   Esegue una sonda di integrità live del Gateway, incluse le sonde dei canali quando supportate
   (richiede un Gateway raggiungibile). Consulta [Integrità](/it/gateway/health).

5. **Segui il log più recente**

   ```bash
   openclaw logs --follow
   ```

   Se RPC non è disponibile, ripiega su:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   I log su file sono separati dai log del servizio; consulta [Registrazione](/it/logging) e [Risoluzione dei problemi](/it/gateway/troubleshooting).

6. **Esegui il doctor (riparazioni)**

   ```bash
   openclaw doctor
   ```

   Ripara/migra configurazione/stato + esegue controlli di integrità. Vedi [Doctor](/it/gateway/doctor).

7. **Snapshot del Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Richiede al gateway in esecuzione uno snapshot completo (solo WS). Vedi [Health](/it/gateway/health).

## Avvio rapido e configurazione al primo avvio

Le domande e risposte sul primo avvio — installazione, onboarding, percorsi di autenticazione, sottoscrizioni, errori iniziali —
si trovano nella [FAQ sul primo avvio](/it/help/faq-first-run).

## Che cos'è OpenClaw?

<AccordionGroup>
  <Accordion title="Che cos'è OpenClaw, in un paragrafo?">
    OpenClaw è un assistente AI personale che esegui sui tuoi dispositivi. Risponde sulle superfici di messaggistica che usi già (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e Plugin di canale inclusi come QQ Bot) e può anche offrire voce + una Canvas live sulle piattaforme supportate. Il **Gateway** è il piano di controllo sempre attivo; l'assistente è il prodotto.
  </Accordion>

  <Accordion title="Proposta di valore">
    OpenClaw non è "solo un wrapper per Claude". È un **piano di controllo local-first** che ti consente di eseguire un
    assistente capace sul **tuo hardware**, raggiungibile dalle app di chat che usi già, con
    sessioni con stato, memoria e strumenti, senza affidare il controllo dei tuoi flussi di lavoro a un
    SaaS ospitato.

    Punti salienti:

    - **I tuoi dispositivi, i tuoi dati:** esegui il Gateway dove preferisci (Mac, Linux, VPS) e mantieni
      lo spazio di lavoro + la cronologia delle sessioni in locale.
    - **Canali reali, non una sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ecc.,
      più voce mobile e Canvas sulle piattaforme supportate.
    - **Indipendente dal modello:** usa Anthropic, OpenAI, MiniMax, OpenRouter, ecc., con routing
      e failover per agente.
    - **Opzione solo locale:** esegui modelli locali così **tutti i dati possono restare sul tuo dispositivo**, se vuoi.
    - **Routing multi-agente:** agenti separati per canale, account o attività, ciascuno con il proprio
      spazio di lavoro e le proprie impostazioni predefinite.
    - **Open source e modificabile:** ispeziona, estendi e fai self-hosting senza vincoli con un fornitore.

    Documentazione: [Gateway](/it/gateway), [Canali](/it/channels), [Multi-agente](/it/concepts/multi-agent),
    [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="L'ho appena configurato - cosa dovrei fare per prima cosa?">
    Buoni primi progetti:

    - Creare un sito web (WordPress, Shopify o un semplice sito statico).
    - Prototipare un'app mobile (bozza, schermate, piano API).
    - Organizzare file e cartelle (pulizia, denominazione, tag).
    - Collegare Gmail e automatizzare riepiloghi o follow-up.

    Può gestire attività grandi, ma funziona meglio quando le dividi in fasi e
    usi sotto-agenti per il lavoro in parallelo.

  </Accordion>

  <Accordion title="Quali sono i cinque principali casi d'uso quotidiani per OpenClaw?">
    I vantaggi quotidiani di solito sono:

    - **Briefing personali:** riepiloghi di posta in arrivo, calendario e notizie che ti interessano.
    - **Ricerca e stesura:** ricerche rapide, riepiloghi e prime bozze per email o documenti.
    - **Promemoria e follow-up:** suggerimenti e checklist guidati da Cron o Heartbeat.
    - **Automazione del browser:** compilazione di moduli, raccolta di dati e ripetizione di attività web.
    - **Coordinamento tra dispositivi:** invia un'attività dal telefono, lascia che il Gateway la esegua su un server e ricevi il risultato nella chat.

  </Accordion>

  <Accordion title="OpenClaw può aiutare con lead gen, outreach, annunci e blog per un SaaS?">
    Sì, per **ricerca, qualificazione e stesura di bozze**. Può analizzare siti, creare shortlist,
    riassumere potenziali clienti e scrivere bozze di outreach o testi pubblicitari.

    Per **campagne di outreach o pubblicitarie**, mantieni una persona nel ciclo. Evita lo spam, rispetta le leggi locali e
    le policy delle piattaforme, e rivedi tutto prima che venga inviato. Il modello più sicuro è lasciare che
    OpenClaw prepari la bozza e che tu la approvi.

    Documentazione: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i vantaggi rispetto a Claude Code per lo sviluppo web?">
    OpenClaw è un **assistente personale** e un livello di coordinamento, non un sostituto dell'IDE. Usa
    Claude Code o Codex per il ciclo di codifica diretto più rapido dentro un repo. Usa OpenClaw quando
    vuoi memoria persistente, accesso da più dispositivi e orchestrazione degli strumenti.

    Vantaggi:

    - **Memoria persistente + workspace** tra le sessioni
    - **Accesso multipiattaforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestrazione degli strumenti** (browser, file, pianificazione, hook)
    - **Gateway sempre attivo** (esecuzione su VPS, interazione da ovunque)
    - **Node** per browser/schermo/fotocamera/exec locali

    Vetrina: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automazione

<AccordionGroup>
  <Accordion title="Come posso personalizzare le Skills senza mantenere il repo modificato?">
    Usa override gestiti invece di modificare la copia nel repo. Metti le modifiche in `~/.openclaw/skills/<name>/SKILL.md` (oppure aggiungi una cartella tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json`). La precedenza è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, quindi gli override gestiti continuano ad avere la precedenza sulle skills bundled senza toccare git. Se devi installare la skill globalmente ma renderla visibile solo ad alcuni agenti, tieni la copia condivisa in `~/.openclaw/skills` e controlla la visibilità con `agents.defaults.skills` e `agents.list[].skills`. Solo le modifiche adatte all'upstream dovrebbero stare nel repo e uscire come PR.
  </Accordion>

  <Accordion title="Posso caricare Skills da una cartella personalizzata?">
    Sì. Aggiungi directory extra tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json` (precedenza più bassa). La precedenza predefinita è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` installa in `./skills` per impostazione predefinita, che OpenClaw tratta come `<workspace>/skills` alla sessione successiva. Se la skill deve essere visibile solo a determinati agenti, abbinala a `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="Come posso usare modelli diversi per attività diverse?">
    Oggi i modelli supportati sono:

    - **Job Cron**: i job isolati possono impostare un override `model` per singolo job.
    - **Sub-agent**: instrada le attività verso agenti separati con modelli predefiniti diversi.
    - **Cambio su richiesta**: usa `/model` per cambiare in qualsiasi momento il modello della sessione corrente.

    Vedi [Job Cron](/it/automation/cron-jobs), [Routing multi-agente](/it/concepts/multi-agent) e [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Il bot si blocca mentre svolge lavoro pesante. Come posso spostarlo altrove?">
    Usa i **sub-agent** per attività lunghe o parallele. I sub-agent vengono eseguiti nella propria sessione,
    restituiscono un riepilogo e mantengono reattiva la chat principale.

    Chiedi al bot di "spawn a sub-agent for this task" oppure usa `/subagents`.
    Usa `/status` in chat per vedere cosa sta facendo il Gateway in questo momento (e se è occupato).

    Suggerimento sui token: le attività lunghe e i sub-agent consumano entrambi token. Se il costo è un problema, imposta un
    modello più economico per i sub-agent tramite `agents.defaults.subagents.model`.

    Documentazione: [Sub-agent](/it/tools/subagents), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Come funzionano le sessioni subagent vincolate al thread su Discord?">
    Usa i vincoli di thread. Puoi vincolare un thread Discord a un subagent o a un target di sessione, così i messaggi successivi in quel thread restano sulla sessione vincolata.

    Flusso di base:

    - Avvia con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"` per un follow-up persistente).
    - Oppure vincola manualmente con `/focus <target>`.
    - Usa `/agents` per ispezionare lo stato del vincolo.
    - Usa `/session idle <duration|off>` e `/session max-age <duration|off>` per controllare l'annullamento automatico del focus.
    - Usa `/unfocus` per scollegare il thread.

    Configurazione richiesta:

    - Impostazioni predefinite globali: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vincolo automatico all'avvio: `channels.discord.threadBindings.spawnSessions` ha valore predefinito `true`; impostalo su `false` per disabilitare l'avvio di sessioni vincolate al thread.

    Documentazione: [Sub-agent](/it/tools/subagents), [Discord](/it/channels/discord), [Riferimento configurazione](/it/gateway/configuration-reference), [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagent è terminato, ma l'aggiornamento di completamento è andato nel posto sbagliato o non è mai stato pubblicato. Cosa devo controllare?">
    Controlla prima la route requester risolta:

    - La consegna del subagent in modalità completamento preferisce qualunque route di thread o conversazione vincolata quando esiste.
    - Se l'origine del completamento contiene solo un canale, OpenClaw ripiega sulla route memorizzata della sessione requester (`lastChannel` / `lastTo` / `lastAccountId`), così la consegna diretta può comunque riuscire.
    - Se non esiste né una route vincolata né una route memorizzata utilizzabile, la consegna diretta può fallire e il risultato ripiega invece sulla consegna in sessione accodata, anziché essere pubblicato subito in chat.
    - Target non validi o obsoleti possono comunque forzare il fallback in coda o il fallimento finale della consegna.
    - Se l'ultima risposta visibile dell'assistente figlio è esattamente il token silenzioso `NO_REPLY` / `no_reply`, oppure esattamente `ANNOUNCE_SKIP`, OpenClaw sopprime intenzionalmente l'annuncio invece di pubblicare progressi precedenti ormai obsoleti.
    - Se il figlio è scaduto dopo sole chiamate a strumenti, l'annuncio può condensarle in un breve riepilogo di progresso parziale invece di riprodurre l'output grezzo degli strumenti.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Sub-agent](/it/tools/subagents), [Attività in background](/it/automation/tasks), [Strumenti di sessione](/it/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o i promemoria non partono. Cosa devo controllare?">
    Cron viene eseguito dentro il processo Gateway. Se il Gateway non è in esecuzione in modo continuo,
    i job pianificati non verranno eseguiti.

    Checklist:

    - Conferma che cron sia abilitato (`cron.enabled`) e che `OPENCLAW_SKIP_CRON` non sia impostato.
    - Controlla che il Gateway sia in esecuzione 24/7 (senza sospensione/riavvii).
    - Verifica le impostazioni di fuso orario per il job (`--tz` rispetto al fuso orario dell'host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Automazione e attività](/it/automation).

  </Accordion>

  <Accordion title="Cron è stato eseguito, ma non è stato inviato nulla al canale. Perché?">
    Controlla prima la modalità di consegna:

    - `--no-deliver` / `delivery.mode: "none"` significa che non è previsto alcun invio di fallback da parte del runner.
    - Un target di annuncio mancante o non valido (`channel` / `to`) significa che il runner ha saltato la consegna in uscita.
    - Errori di autenticazione del canale (`unauthorized`, `Forbidden`) significano che il runner ha provato a consegnare, ma le credenziali lo hanno bloccato.
    - Un risultato isolato silenzioso (solo `NO_REPLY` / `no_reply`) viene trattato come intenzionalmente non consegnabile, quindi il runner sopprime anche la consegna di fallback in coda.

    Per i job cron isolati, l'agente può comunque inviare direttamente con lo strumento `message`
    quando è disponibile una route chat. `--announce` controlla solo il percorso di
    fallback del runner per il testo finale che l'agente non ha già inviato.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Perché un'esecuzione Cron isolata ha cambiato modello o ha riprovato una volta?">
    Di solito è il percorso di cambio modello live, non una pianificazione duplicata.

    Cron isolato può rendere persistente un passaggio di modello a runtime e riprovare quando
    l'esecuzione attiva genera `LiveSessionModelSwitchError`. Il nuovo tentativo mantiene il
    provider/modello cambiato e, se il cambio includeva un nuovo override del profilo di autenticazione, cron
    rende persistente anche quello prima di riprovare.

    Regole di selezione correlate:

    - L'override del modello dell'hook Gmail ha la precedenza quando applicabile.
    - Poi `model` per job.
    - Poi eventuale override del modello della sessione cron memorizzato.
    - Poi la normale selezione del modello agente/predefinito.

    Il ciclo di nuovo tentativo è limitato. Dopo il tentativo iniziale più 2 nuovi tentativi di cambio,
    cron interrompe invece di continuare all'infinito.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [CLI cron](/it/cli/cron).

  </Accordion>

  <Accordion title="Come installo le Skills su Linux?">
    Usa i comandi nativi `openclaw skills` o inserisci le Skills nel tuo workspace. L'interfaccia utente Skills di macOS non è disponibile su Linux.
    Sfoglia le Skills su [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    `openclaw skills install` nativo scrive nella directory `skills/` del workspace
    attivo. Installa la CLI `clawhub` separata solo se vuoi pubblicare o
    sincronizzare le tue Skills. Per installazioni condivise tra agenti, metti la Skill in
    `~/.openclaw/skills` e usa `agents.defaults.skills` o
    `agents.list[].skills` se vuoi restringere quali agenti possono vederla.

  </Accordion>

  <Accordion title="OpenClaw può eseguire attività secondo una pianificazione o continuamente in background?">
    Sì. Usa lo scheduler del Gateway:

    - **Job Cron** per attività pianificate o ricorrenti (persistono tra riavvii).
    - **Heartbeat** per controlli periodici della "sessione principale".
    - **Job isolati** per agenti autonomi che pubblicano riepiloghi o consegnano alle chat.

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Automazione e attività](/it/automation),
    [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso eseguire Skills solo per Apple macOS da Linux?">
    Non direttamente. Le Skills macOS sono limitate da `metadata.openclaw.os` più i binari richiesti, e le Skills appaiono nel prompt di sistema solo quando sono idonee sull'**host Gateway**. Su Linux, le Skills solo `darwin` (come `apple-notes`, `apple-reminders`, `things-mac`) non verranno caricate a meno che tu non sovrascriva il gating.

    Hai tre pattern supportati:

    **Opzione A - esegui il Gateway su un Mac (la più semplice).**
    Esegui il Gateway dove esistono i binari macOS, poi connettiti da Linux in [modalità remota](#gateway-ports-already-running-and-remote-mode) o tramite Tailscale. Le Skills vengono caricate normalmente perché l'host Gateway è macOS.

    **Opzione B - usa un Node macOS (senza SSH).**
    Esegui il Gateway su Linux, abbina un Node macOS (app della barra dei menu) e imposta **Comandi di esecuzione Node** su "Chiedi sempre" o "Consenti sempre" sul Mac. OpenClaw può trattare le Skills solo macOS come idonee quando i binari richiesti esistono sul Node. L'agente esegue quelle Skills tramite lo strumento `nodes`. Se scegli "Chiedi sempre", approvare "Consenti sempre" nel prompt aggiunge quel comando alla allowlist.

    **Opzione C - inoltra i binari macOS tramite SSH (avanzata).**
    Mantieni il Gateway su Linux, ma fai in modo che i binari CLI richiesti si risolvano in wrapper SSH che vengono eseguiti su un Mac. Poi sovrascrivi la Skill per consentire Linux, così resta idonea.

    1. Crea un wrapper SSH per il binario (esempio: `memo` per Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Metti il wrapper nel `PATH` sull'host Linux (per esempio `~/bin/memo`).
    3. Sovrascrivi i metadati della Skill (workspace o `~/.openclaw/skills`) per consentire Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Avvia una nuova sessione in modo che lo snapshot delle Skills si aggiorni.

  </Accordion>

  <Accordion title="Avete un'integrazione Notion o HeyGen?">
    Oggi non è integrata.

    Opzioni:

    - **Skill / Plugin personalizzato:** ideale per un accesso API affidabile (Notion/HeyGen hanno entrambi API).
    - **Automazione del browser:** funziona senza codice, ma è più lenta e più fragile.

    Se vuoi mantenere il contesto per cliente (workflow di agenzia), un pattern semplice è:

    - Una pagina Notion per ogni cliente (contesto + preferenze + lavoro attivo).
    - Chiedi all'agente di recuperare quella pagina all'inizio di una sessione.

    Se vuoi un'integrazione nativa, apri una richiesta di funzionalità o crea una Skill
    per quelle API.

    Installa le Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Le installazioni native finiscono nella directory `skills/` del workspace attivo. Per Skills condivise tra agenti, mettile in `~/.openclaw/skills/<name>/SKILL.md`. Se solo alcuni agenti devono vedere un'installazione condivisa, configura `agents.defaults.skills` o `agents.list[].skills`. Alcune Skills richiedono binari installati tramite Homebrew; su Linux questo significa Linuxbrew (vedi la voce FAQ Homebrew Linux sopra). Vedi [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config) e [ClawHub](/it/tools/clawhub).

  </Accordion>

  <Accordion title="Come uso il mio Chrome già autenticato con OpenClaw?">
    Usa il profilo browser `user` integrato, che si collega tramite Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Se vuoi un nome personalizzato, crea un profilo MCP esplicito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Questo percorso può usare il browser host locale o un Node browser connesso. Se il Gateway viene eseguito altrove, esegui un host Node sulla macchina del browser oppure usa CDP remoto.

    Limiti attuali di `existing-session` / `user`:

    - le azioni sono basate su ref, non su selettori CSS
    - i caricamenti richiedono `ref` / `inputRef` e attualmente supportano un file alla volta
    - `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP raw

  </Accordion>
</AccordionGroup>

## Sandboxing e memoria

<AccordionGroup>
  <Accordion title="Esiste una documentazione dedicata al sandboxing?">
    Sì. Vedi [Sandboxing](/it/gateway/sandboxing). Per la configurazione specifica di Docker (Gateway completo in Docker o immagini sandbox), vedi [Docker](/it/install/docker).
  </Accordion>

  <Accordion title="Docker sembra limitato - come abilito tutte le funzionalità?">
    L'immagine predefinita privilegia la sicurezza e viene eseguita come utente `node`, quindi non
    include pacchetti di sistema, Homebrew o browser in bundle. Per una configurazione più completa:

    - Rendi persistente `/home/node` con `OPENCLAW_HOME_VOLUME` in modo che le cache sopravvivano.
    - Integra le dipendenze di sistema nell'immagine con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installa i browser Playwright tramite la CLI in bundle:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Imposta `PLAYWRIGHT_BROWSERS_PATH` e assicurati che il percorso sia persistente.

    Documentazione: [Docker](/it/install/docker), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="Posso mantenere personali i DM ma rendere pubblici/sandboxati i gruppi con un solo agente?">
    Sì - se il tuo traffico privato è costituito da **DM** e quello pubblico da **gruppi**.

    Usa `agents.defaults.sandbox.mode: "non-main"` così le sessioni di gruppo/canale (chiavi non-main) vengono eseguite nel backend sandbox configurato, mentre la sessione DM principale resta sull'host. Docker è il backend predefinito se non ne scegli uno. Poi limita quali strumenti sono disponibili nelle sessioni sandboxate tramite `tools.sandbox.tools`.

    Procedura di configurazione + esempio: [Gruppi: DM personali + gruppi pubblici](/it/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Riferimento di configurazione chiave: [Configurazione Gateway](/it/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Come associo una cartella host alla sandbox?">
    Imposta `agents.defaults.sandbox.docker.binds` su `["host:path:mode"]` (ad esempio, `"/home/user/src:/src:ro"`). I bind globali e per agente vengono uniti; i bind per agente vengono ignorati quando `scope: "shared"`. Usa `:ro` per qualsiasi cosa sensibile e ricorda che i bind aggirano i muri del filesystem della sandbox.

    OpenClaw valida le sorgenti dei bind sia rispetto al percorso normalizzato sia al percorso canonico risolto tramite l'antenato esistente più profondo. Questo significa che le fughe tramite genitore symlink falliscono comunque in modo chiuso anche quando l'ultimo segmento del percorso non esiste ancora, e i controlli delle radici consentite si applicano comunque dopo la risoluzione dei symlink.

    Vedi [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs policy strumenti vs privilegi elevati](/it/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) per esempi e note di sicurezza.

  </Accordion>

  <Accordion title="Come funziona la memoria?">
    La memoria di OpenClaw è costituita semplicemente da file Markdown nel workspace dell'agente:

    - Note giornaliere in `memory/YYYY-MM-DD.md`
    - Note curate a lungo termine in `MEMORY.md` (solo sessioni principali/private)

    OpenClaw esegue anche un **flush della memoria pre-Compaction silenzioso** per ricordare al modello
    di scrivere note durevoli prima dell'auto-Compaction. Questo viene eseguito solo quando il workspace
    è scrivibile (le sandbox in sola lettura lo saltano). Vedi [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="La memoria continua a dimenticare cose. Come faccio a renderle persistenti?">
    Chiedi al bot di **scrivere il fatto in memoria**. Le note a lungo termine vanno in `MEMORY.md`,
    il contesto a breve termine va in `memory/YYYY-MM-DD.md`.

    Questa è ancora un'area che stiamo migliorando. È utile ricordare al modello di archiviare i ricordi;
    saprà cosa fare. Se continua a dimenticare, verifica che il Gateway usi lo stesso
    workspace a ogni esecuzione.

    Documentazione: [Memoria](/it/concepts/memory), [Workspace agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La memoria persiste per sempre? Quali sono i limiti?">
    I file di memoria vivono su disco e persistono finché non li elimini. Il limite è il tuo
    spazio di archiviazione, non il modello. Il **contesto della sessione** è comunque limitato dalla finestra
    di contesto del modello, quindi conversazioni lunghe possono essere compattate o troncate. Ecco perché
    esiste la ricerca nella memoria: riporta nel contesto solo le parti rilevanti.

    Documentazione: [Memoria](/it/concepts/memory), [Contesto](/it/concepts/context).

  </Accordion>

  <Accordion title="La ricerca nella memoria semantica richiede una chiave API OpenAI?">
    Solo se usi gli **embedding OpenAI**. Codex OAuth copre chat/completions e
    **non** concede l'accesso agli embedding, quindi **accedere con Codex (OAuth o il
    login della CLI Codex)** non aiuta per la ricerca nella memoria semantica. Gli embedding OpenAI
    richiedono comunque una vera chiave API (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Se non imposti esplicitamente un provider, OpenClaw seleziona automaticamente un provider quando
    riesce a risolvere una chiave API (profili di autenticazione, `models.providers.*.apiKey` o variabili di ambiente).
    Preferisce OpenAI se viene risolta una chiave OpenAI, altrimenti Gemini se viene
    risolta una chiave Gemini, poi Voyage, poi Mistral. Se non è disponibile alcuna chiave remota, la ricerca nella
    memoria resta disabilitata finché non la configuri. Se hai configurato e presente un percorso di modello locale,
    OpenClaw
    preferisce `local`. Ollama è supportato quando imposti esplicitamente
    `memorySearch.provider = "ollama"`.

    Se preferisci restare in locale, imposta `memorySearch.provider = "local"` (e facoltativamente
    `memorySearch.fallback = "none"`). Se vuoi gli embedding Gemini, imposta
    `memorySearch.provider = "gemini"` e fornisci `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Supportiamo modelli di embedding **OpenAI, Gemini, Voyage, Mistral, Ollama o locali**
    - vedi [Memoria](/it/concepts/memory) per i dettagli di configurazione.

  </Accordion>
</AccordionGroup>

## Dove si trovano gli elementi su disco

<AccordionGroup>
  <Accordion title="Tutti i dati usati con OpenClaw vengono salvati localmente?">
    No - **lo stato di OpenClaw è locale**, ma **i servizi esterni vedono comunque ciò che invii loro**.

    - **Locale per impostazione predefinita:** sessioni, file di memoria, configurazione e workspace risiedono sull'host del Gateway
      (`~/.openclaw` + la directory del tuo workspace).
    - **Remoto per necessità:** i messaggi che invii ai provider di modelli (Anthropic/OpenAI/ecc.) vanno alle
      loro API, e le piattaforme di chat (WhatsApp/Telegram/Slack/ecc.) archiviano i dati dei messaggi sui loro
      server.
    - **Controlli tu l'impronta:** usare modelli locali mantiene i prompt sulla tua macchina, ma il traffico dei canali
      passa comunque attraverso i server del canale.

    Correlati: [Workspace dell'agente](/it/concepts/agent-workspace), [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="Dove archivia i suoi dati OpenClaw?">
    Tutto risiede sotto `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`):

    | Percorso                                                        | Scopo                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configurazione principale (JSON5)                                  |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import OAuth legacy (copiato nei profili di autenticazione al primo uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profili di autenticazione (OAuth, chiavi API e `keyRef`/`tokenRef` opzionali) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload segreto opzionale basato su file per provider SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File di compatibilità legacy (voci `api_key` statiche rimosse)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stato del provider (es. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stato per agente (agentDir + sessioni)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Cronologia e stato delle conversazioni (per agente)                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadati di sessione (per agente)                                  |

    Percorso legacy per agente singolo: `~/.openclaw/agent/*` (migrato da `openclaw doctor`).

    Il tuo **workspace** (AGENTS.md, file di memoria, skills, ecc.) è separato e configurato tramite `agents.defaults.workspace` (predefinito: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Dove devono risiedere AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Questi file risiedono nel **workspace dell'agente**, non in `~/.openclaw`.

    - **Workspace (per agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` opzionale.
      La radice minuscola `memory.md` è solo input di riparazione legacy; `openclaw doctor --fix`
      può unirla in `MEMORY.md` quando entrambi i file esistono.
    - **Directory di stato (`~/.openclaw`)**: configurazione, stato di canali/provider, profili di autenticazione, sessioni, log
      e Skills condivise (`~/.openclaw/skills`).

    Il workspace predefinito è `~/.openclaw/workspace`, configurabile tramite:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se il bot "dimentica" dopo un riavvio, conferma che il Gateway stia usando lo stesso
    workspace a ogni avvio (e ricorda: la modalità remota usa il workspace dell'**host gateway**,
    non il tuo laptop locale).

    Suggerimento: se vuoi un comportamento o una preferenza durevole, chiedi al bot di **scriverlo in
    AGENTS.md o MEMORY.md** invece di affidarti alla cronologia della chat.

    Vedi [Workspace dell'agente](/it/concepts/agent-workspace) e [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="Strategia di backup consigliata">
    Metti il tuo **workspace dell'agente** in un repository git **privato** ed eseguine il backup in un luogo
    privato (per esempio GitHub privato). Questo cattura memoria + file AGENTS/SOUL/USER
    e ti consente di ripristinare in seguito la "mente" dell'assistente.

    **Non** committare nulla sotto `~/.openclaw` (credenziali, sessioni, token o payload di segreti cifrati).
    Se hai bisogno di un ripristino completo, esegui il backup sia del workspace sia della directory di stato
    separatamente (vedi la domanda sulla migrazione sopra).

    Documentazione: [Workspace dell'agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Come disinstallo completamente OpenClaw?">
    Vedi la guida dedicata: [Disinstallazione](/it/install/uninstall).
  </Accordion>

  <Accordion title="Gli agenti possono lavorare fuori dal workspace?">
    Sì. Il workspace è il **cwd predefinito** e l'ancora della memoria, non una sandbox rigida.
    I percorsi relativi vengono risolti dentro il workspace, ma i percorsi assoluti possono accedere ad altre
    posizioni dell'host a meno che la sandbox non sia abilitata. Se hai bisogno di isolamento, usa
    [`agents.defaults.sandbox`](/it/gateway/sandboxing) o impostazioni sandbox per agente. Se
    vuoi che un repository sia la directory di lavoro predefinita, punta il
    `workspace` di quell'agente alla radice del repository. Il repository OpenClaw è solo codice sorgente; tieni il
    workspace separato a meno che tu non voglia intenzionalmente che l'agente lavori al suo interno.

    Esempio (repository come cwd predefinito):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Modalità remota: dov'è l'archivio delle sessioni?">
    Lo stato delle sessioni è di proprietà dell'**host gateway**. Se sei in modalità remota, l'archivio delle sessioni che ti interessa è sulla macchina remota, non sul tuo laptop locale. Vedi [Gestione delle sessioni](/it/concepts/session).
  </Accordion>
</AccordionGroup>

## Basi della configurazione

<AccordionGroup>
  <Accordion title="Qual è il formato della configurazione? Dov'è?">
    OpenClaw legge una configurazione **JSON5** opzionale da `$OPENCLAW_CONFIG_PATH` (predefinito: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se il file manca, usa valori predefiniti ragionevolmente sicuri (incluso un workspace predefinito di `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ho impostato gateway.bind: "lan" (o "tailnet") e ora non ascolta nulla / la UI dice non autorizzato'>
    I bind non-loopback **richiedono un percorso di autenticazione gateway valido**. In pratica significa:

    - autenticazione con segreto condiviso: token o password
    - `gateway.auth.mode: "trusted-proxy"` dietro un reverse proxy identity-aware configurato correttamente

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Note:

    - `gateway.remote.token` / `.password` **non** abilitano da soli l'autenticazione del gateway locale.
    - I percorsi di chiamata locali possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
    - Per l'autenticazione con password, imposta invece `gateway.auth.mode: "password"` più `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modo chiuso (nessun fallback remoto a mascherare).
    - Le configurazioni della Control UI con segreto condiviso si autenticano tramite `connect.params.auth.token` o `connect.params.auth.password` (archiviati nelle impostazioni dell'app/UI). Modalità con identità, come Tailscale Serve o `trusted-proxy`, usano invece gli header della richiesta. Evita di mettere segreti condivisi negli URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, i reverse proxy same-host local loopback richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito e una voce loopback in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Perché ora mi serve un token su localhost?">
    OpenClaw applica l'autenticazione del gateway per impostazione predefinita, incluso il loopback. Nel percorso predefinito normale questo significa autenticazione con token: se non è configurato alcun percorso di autenticazione esplicito, l'avvio del gateway si risolve in modalità token e ne genera automaticamente uno, salvandolo in `gateway.auth.token`, quindi **i client WS locali devono autenticarsi**. Questo blocca altri processi locali dal chiamare il Gateway.

    Se preferisci un percorso di autenticazione diverso, puoi scegliere esplicitamente la modalità password (oppure, per reverse proxy identity-aware, `trusted-proxy`). Se vuoi **davvero** aprire il loopback, imposta esplicitamente `gateway.auth.mode: "none"` nella tua configurazione. Doctor può generare un token per te in qualsiasi momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Devo riavviare dopo aver cambiato la configurazione?">
    Il Gateway osserva la configurazione e supporta l'hot-reload:

    - `gateway.reload.mode: "hybrid"` (predefinito): applica a caldo le modifiche sicure, riavvia per quelle critiche
    - sono supportati anche `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Come disabilito gli slogan divertenti della CLI?">
    Imposta `cli.banner.taglineMode` nella configurazione:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: nasconde il testo dello slogan ma mantiene la riga del titolo/versione del banner.
    - `default`: usa `All your chats, one OpenClaw.` ogni volta.
    - `random`: slogan divertenti/stagionali a rotazione (comportamento predefinito).
    - Se non vuoi alcun banner, imposta la variabile di ambiente `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Come abilito la ricerca web (e il recupero web)?">
    `web_fetch` funziona senza una chiave API. `web_search` dipende dal provider
    selezionato:

    - I provider basati su API come Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity e Tavily richiedono la loro normale configurazione della chiave API.
    - Ollama Web Search non richiede chiave, ma usa l'host Ollama configurato e richiede `ollama signin`.
    - DuckDuckGo non richiede chiave, ma è un'integrazione non ufficiale basata su HTML.
    - SearXNG non richiede chiave/è self-hosted; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Consigliato:** esegui `openclaw configure --section web` e scegli un provider.
    Alternative di ambiente:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` o `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` o `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` o `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    La configurazione della ricerca web specifica del provider ora si trova in `plugins.entries.<plugin>.config.webSearch.*`.
    I percorsi provider legacy `tools.web.search.*` vengono ancora caricati temporaneamente per compatibilità, ma non dovrebbero essere usati per nuove configurazioni.
    La configurazione di fallback per il recupero web Firecrawl si trova in `plugins.entries.firecrawl.config.webFetch.*`.

    Note:

    - Se usi allowlist, aggiungi `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` è abilitato per impostazione predefinita (a meno che non sia disabilitato esplicitamente).
    - Se `tools.web.fetch.provider` viene omesso, OpenClaw rileva automaticamente il primo provider di fallback per il recupero pronto dalle credenziali disponibili. Oggi il provider incluso è Firecrawl.
    - I demoni leggono le variabili d'ambiente da `~/.openclaw/.env` (o dall'ambiente del servizio).

    Documentazione: [Strumenti web](/it/tools/web).

  </Accordion>

  <Accordion title="config.apply ha cancellato la mia configurazione. Come posso recuperarla ed evitarlo?">
    `config.apply` sostituisce **l'intera configurazione**. Se invii un oggetto parziale, tutto
    il resto viene rimosso.

    L'OpenClaw attuale protegge da molte sovrascritture accidentali:

    - Le scritture della configurazione di proprietà di OpenClaw convalidano l'intera configurazione dopo la modifica prima di scrivere.
    - Le scritture non valide o distruttive di proprietà di OpenClaw vengono rifiutate e salvate come `openclaw.json.rejected.*`.
    - Se una modifica diretta interrompe l'avvio o il ricaricamento a caldo, Gateway fallisce in modo chiuso o salta il ricaricamento; non riscrive `openclaw.json`.
    - `openclaw doctor --fix` gestisce la riparazione e può ripristinare l'ultima configurazione valida nota salvando il file rifiutato come `openclaw.json.clobbered.*`.

    Recupero:

    - Controlla `openclaw logs --follow` per `Invalid config at`, `Config write rejected:` o `config reload skipped (invalid config)`.
    - Ispeziona il più recente `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` accanto alla configurazione attiva.
    - Esegui `openclaw config validate` e `openclaw doctor --fix`.
    - Copia di nuovo solo le chiavi desiderate con `openclaw config set` o `config.patch`.
    - Se non hai un'ultima configurazione valida nota o un payload rifiutato, ripristina da un backup oppure esegui di nuovo `openclaw doctor` e riconfigura canali/modelli.
    - Se questo comportamento era inatteso, segnala un bug e includi la tua ultima configurazione nota o eventuali backup.
    - Un agente di coding locale spesso può ricostruire una configurazione funzionante dai log o dalla cronologia.

    Per evitarlo:

    - Usa `openclaw config set` per modifiche piccole.
    - Usa `openclaw configure` per modifiche interattive.
    - Usa prima `config.schema.lookup` quando non sei sicuro di un percorso esatto o della forma di un campo; restituisce un nodo schema superficiale più riepiloghi dei figli immediati per l'approfondimento.
    - Usa `config.patch` per modifiche RPC parziali; tieni `config.apply` solo per la sostituzione dell'intera configurazione.
    - Se stai usando lo strumento `gateway` solo per owner da un'esecuzione agente, continuerà a rifiutare scritture su `tools.exec.ask` / `tools.exec.security` (inclusi gli alias legacy `tools.bash.*` che si normalizzano agli stessi percorsi exec protetti).

    Documentazione: [Configurazione](/it/cli/config), [Configure](/it/cli/configure), [Risoluzione dei problemi Gateway](/it/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/it/gateway/doctor).

  </Accordion>

  <Accordion title="Come eseguo un Gateway centrale con worker specializzati su più dispositivi?">
    Il pattern comune è **un Gateway** (ad es. Raspberry Pi) più **nodi** e **agenti**:

    - **Gateway (centrale):** gestisce canali (Signal/WhatsApp), routing e sessioni.
    - **Nodi (dispositivi):** Mac/iOS/Android si connettono come periferiche ed espongono strumenti locali (`system.run`, `canvas`, `camera`).
    - **Agenti (worker):** cervelli/workspace separati per ruoli speciali (ad es. "operazioni Hetzner", "Dati personali").
    - **Sub-agenti:** generano lavoro in background da un agente principale quando vuoi parallelismo.
    - **TUI:** connettiti al Gateway e cambia agenti/sessioni.

    Documentazione: [Nodi](/it/nodes), [Accesso remoto](/it/gateway/remote), [Routing multi-agente](/it/concepts/multi-agent), [Sub-agenti](/it/tools/subagents), [TUI](/it/web/tui).

  </Accordion>

  <Accordion title="Il browser OpenClaw può funzionare in modalità headless?">
    Sì. È un'opzione di configurazione:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Il valore predefinito è `false` (con interfaccia visibile). Headless ha maggiori probabilità di attivare controlli anti-bot su alcuni siti. Vedi [Browser](/it/tools/browser).

    Headless usa lo **stesso motore Chromium** e funziona per la maggior parte delle automazioni (moduli, clic, scraping, login). Le differenze principali:

    - Nessuna finestra del browser visibile (usa screenshot se ti servono elementi visivi).
    - Alcuni siti sono più severi sull'automazione in modalità headless (CAPTCHA, anti-bot).
      Ad esempio, X/Twitter spesso blocca le sessioni headless.

  </Accordion>

  <Accordion title="Come uso Brave per il controllo del browser?">
    Imposta `browser.executablePath` sul binario Brave (o su qualsiasi browser basato su Chromium) e riavvia il Gateway.
    Vedi gli esempi completi di configurazione in [Browser](/it/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway remoti e nodi

<AccordionGroup>
  <Accordion title="Come si propagano i comandi tra Telegram, il gateway e i nodi?">
    I messaggi Telegram vengono gestiti dal **gateway**. Il gateway esegue l'agente e
    solo dopo chiama i nodi tramite il **Gateway WebSocket** quando serve uno strumento nodo:

    Telegram → Gateway → Agente → `node.*` → Nodo → Gateway → Telegram

    I nodi non vedono il traffico provider in ingresso; ricevono solo chiamate RPC nodo.

  </Accordion>

  <Accordion title="Come può il mio agente accedere al mio computer se il Gateway è ospitato da remoto?">
    Risposta breve: **abbina il tuo computer come nodo**. Il Gateway viene eseguito altrove, ma può
    chiamare strumenti `node.*` (schermo, fotocamera, sistema) sulla tua macchina locale tramite il Gateway WebSocket.

    Configurazione tipica:

    1. Esegui il Gateway sull'host sempre attivo (VPS/server domestico).
    2. Metti l'host Gateway e il tuo computer nella stessa tailnet.
    3. Assicurati che il Gateway WS sia raggiungibile (bind tailnet o tunnel SSH).
    4. Apri l'app macOS localmente e connettiti in modalità **Remote over SSH** (o tailnet diretta)
       così può registrarsi come nodo.
    5. Approva il nodo sul Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Non è richiesto alcun bridge TCP separato; i nodi si connettono tramite il Gateway WebSocket.

    Promemoria di sicurezza: l'abbinamento di un nodo macOS consente `system.run` su quella macchina. Abbina
    solo dispositivi di cui ti fidi e consulta [Sicurezza](/it/gateway/security).

    Documentazione: [Nodi](/it/nodes), [Protocollo Gateway](/it/gateway/protocol), [Modalità remota macOS](/it/platforms/mac/remote), [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Tailscale è connesso ma non ricevo risposte. Cosa faccio ora?">
    Controlla le basi:

    - Gateway in esecuzione: `openclaw gateway status`
    - Stato Gateway: `openclaw status`
    - Stato canali: `openclaw channels status`

    Poi verifica autenticazione e routing:

    - Se usi Tailscale Serve, assicurati che `gateway.auth.allowTailscale` sia impostato correttamente.
    - Se ti connetti tramite tunnel SSH, conferma che il tunnel locale sia attivo e punti alla porta corretta.
    - Conferma che le tue allowlist (DM o gruppo) includano il tuo account.

    Documentazione: [Tailscale](/it/gateway/tailscale), [Accesso remoto](/it/gateway/remote), [Canali](/it/channels).

  </Accordion>

  <Accordion title="Due istanze OpenClaw possono comunicare tra loro (locale + VPS)?">
    Sì. Non esiste un bridge "bot-to-bot" integrato, ma puoi collegarle in alcuni
    modi affidabili:

    **Più semplice:** usa un normale canale chat a cui entrambi i bot possono accedere (Telegram/Slack/WhatsApp).
    Fai inviare un messaggio dal Bot A al Bot B, poi lascia che il Bot B risponda come al solito.

    **Bridge CLI (generico):** esegui uno script che chiama l'altro Gateway con
    `openclaw agent --message ... --deliver`, puntando a una chat in cui l'altro bot
    è in ascolto. Se un bot è su un VPS remoto, punta la tua CLI a quel Gateway remoto
    tramite SSH/Tailscale (vedi [Accesso remoto](/it/gateway/remote)).

    Pattern di esempio (eseguilo da una macchina che può raggiungere il Gateway di destinazione):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Suggerimento: aggiungi una protezione in modo che i due bot non entrino in un ciclo infinito (solo menzione, allowlist
    dei canali o una regola "non rispondere ai messaggi dei bot").

    Documentazione: [Accesso remoto](/it/gateway/remote), [CLI agente](/it/cli/agent), [Invio agente](/it/tools/agent-send).

  </Accordion>

  <Accordion title="Ho bisogno di VPS separati per più agenti?">
    No. Un Gateway può ospitare più agenti, ciascuno con il proprio workspace, impostazioni predefinite del modello
    e routing. Questa è la configurazione normale ed è molto più economica e semplice rispetto a eseguire
    un VPS per agente.

    Usa VPS separati solo quando ti serve isolamento forte (confini di sicurezza) o configurazioni
    molto diverse che non vuoi condividere. Altrimenti, mantieni un solo Gateway e
    usa più agenti o sub-agenti.

  </Accordion>

  <Accordion title="C'è un vantaggio nell'usare un nodo sul mio laptop personale invece di SSH da un VPS?">
    Sì - i nodi sono il modo di prima classe per raggiungere il tuo laptop da un Gateway remoto e
    sbloccano più del semplice accesso shell. Il Gateway viene eseguito su macOS/Linux (Windows tramite WSL2) ed è
    leggero (un piccolo VPS o una macchina di classe Raspberry Pi va bene; 4 GB di RAM sono ampiamente sufficienti), quindi una configurazione comune
    è un host sempre attivo più il tuo laptop come nodo.

    - **Nessun SSH in ingresso richiesto.** I nodi si connettono in uscita al Gateway WebSocket e usano l'abbinamento dispositivo.
    - **Controlli di esecuzione più sicuri.** `system.run` è regolato da allowlist/approvazioni del nodo su quel laptop.
    - **Più strumenti dispositivo.** I nodi espongono `canvas`, `camera` e `screen` oltre a `system.run`.
    - **Automazione browser locale.** Mantieni il Gateway su un VPS, ma esegui Chrome localmente tramite un host nodo sul laptop, oppure collegati a Chrome locale sull'host tramite Chrome MCP.

    SSH va bene per accesso shell occasionale, ma i nodi sono più semplici per workflow agente continuativi e
    automazione del dispositivo.

    Documentazione: [Nodi](/it/nodes), [CLI nodi](/it/cli/nodes), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="I nodi eseguono un servizio gateway?">
    No. Dovrebbe essere eseguito solo **un gateway** per host, a meno che tu non esegua intenzionalmente profili isolati (vedi [Gateway multipli](/it/gateway/multiple-gateways)). I nodi sono periferiche che si connettono
    al gateway (nodi iOS/Android, o "modalità nodo" macOS nell'app della barra dei menu). Per host nodo headless
    e controllo CLI, vedi [CLI host nodo](/it/cli/node).

    È richiesto un riavvio completo per modifiche a `gateway`, `discovery` e `canvasHost`.

  </Accordion>

  <Accordion title="Esiste un modo API / RPC per applicare la configurazione?">
    Sì.

    - `config.schema.lookup`: ispeziona un sottoalbero della configurazione con il suo nodo schema superficiale, suggerimento UI corrispondente e riepiloghi dei figli immediati prima di scrivere
    - `config.get`: recupera lo snapshot corrente + hash
    - `config.patch`: aggiornamento parziale sicuro (preferito per la maggior parte delle modifiche RPC); ricarica a caldo quando possibile e riavvia quando richiesto
    - `config.apply`: convalida + sostituisce l'intera configurazione; ricarica a caldo quando possibile e riavvia quando richiesto
    - Lo strumento runtime `gateway` solo per owner continua a rifiutare di riscrivere `tools.exec.ask` / `tools.exec.security`; gli alias legacy `tools.bash.*` si normalizzano agli stessi percorsi exec protetti

  </Accordion>

  <Accordion title="Configurazione minima ragionevole per una prima installazione">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Questo imposta il tuo workspace e limita chi può attivare il bot.

  </Accordion>

  <Accordion title="Come configuro Tailscale su una VPS e mi connetto dal mio Mac?">
    Passaggi minimi:

    1. **Installa + accedi sulla VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installa + accedi sul tuo Mac**
       - Usa l'app Tailscale e accedi alla stessa tailnet.
    3. **Abilita MagicDNS (consigliato)**
       - Nella console di amministrazione Tailscale, abilita MagicDNS in modo che la VPS abbia un nome stabile.
    4. **Usa l'hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se vuoi la Control UI senza SSH, usa Tailscale Serve sulla VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Questo mantiene il gateway vincolato al loopback ed espone HTTPS tramite Tailscale. Vedi [Tailscale](/it/gateway/tailscale).

  </Accordion>

  <Accordion title="Come connetto un Node Mac a un Gateway remoto (Tailscale Serve)?">
    Serve espone la **Control UI del Gateway + WS**. I Node si connettono tramite lo stesso endpoint Gateway WS.

    Configurazione consigliata:

    1. **Assicurati che VPS + Mac siano sulla stessa tailnet**.
    2. **Usa l'app macOS in modalità remota** (il target SSH può essere l'hostname tailnet).
       L'app eseguirà il tunnel della porta del Gateway e si connetterà come Node.
    3. **Approva il Node** sul gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documenti: [Protocollo Gateway](/it/gateway/protocol), [Scoperta](/it/gateway/discovery), [Modalità remota macOS](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Devo installare su un secondo laptop o aggiungere solo un Node?">
    Se ti servono solo **strumenti locali** (schermo/fotocamera/exec) sul secondo laptop, aggiungilo come
    **Node**. Questo mantiene un solo Gateway ed evita configurazioni duplicate. Gli strumenti Node locali sono
    attualmente disponibili solo su macOS, ma prevediamo di estenderli ad altri sistemi operativi.

    Installa un secondo Gateway solo quando ti serve **isolamento rigoroso** o due bot completamente separati.

    Documenti: [Node](/it/nodes), [CLI dei Node](/it/cli/nodes), [Gateway multipli](/it/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variabili env e caricamento di .env

<AccordionGroup>
  <Accordion title="Come carica OpenClaw le variabili di ambiente?">
    OpenClaw legge le variabili env dal processo padre (shell, launchd/systemd, CI, ecc.) e inoltre carica:

    - `.env` dalla directory di lavoro corrente
    - un `.env` globale di fallback da `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Nessuno dei due file `.env` sovrascrive le variabili env esistenti.

    Puoi anche definire variabili env inline nella configurazione (applicate solo se mancanti dall'env del processo):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Vedi [/environment](/it/help/environment) per precedenza e fonti complete.

  </Accordion>

  <Accordion title="Ho avviato il Gateway tramite il servizio e le mie variabili env sono sparite. Ora cosa faccio?">
    Due correzioni comuni:

    1. Metti le chiavi mancanti in `~/.openclaw/.env` così vengono rilevate anche quando il servizio non eredita l'env della tua shell.
    2. Abilita l'importazione dalla shell (comodità opt-in):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Questo esegue la tua shell di login e importa solo le chiavi previste mancanti (non sovrascrive mai). Equivalenti delle variabili env:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ho impostato COPILOT_GITHUB_TOKEN, ma lo stato dei modelli mostra "Shell env: off." Perché?'>
    `openclaw models status` indica se **l'importazione dell'env dalla shell** è abilitata. "Shell env: off"
    **non** significa che le tue variabili env manchino: significa solo che OpenClaw non caricherà
    automaticamente la tua shell di login.

    Se il Gateway viene eseguito come servizio (launchd/systemd), non erediterà l'ambiente
    della tua shell. Risolvi in uno di questi modi:

    1. Metti il token in `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oppure abilita l'importazione dalla shell (`env.shellEnv.enabled: true`).
    3. Oppure aggiungilo al blocco `env` della tua configurazione (si applica solo se mancante).

    Poi riavvia il gateway e ricontrolla:

    ```bash
    openclaw models status
    ```

    I token Copilot vengono letti da `COPILOT_GITHUB_TOKEN` (anche `GH_TOKEN` / `GITHUB_TOKEN`).
    Vedi [/concepts/model-providers](/it/concepts/model-providers) e [/environment](/it/help/environment).

  </Accordion>
</AccordionGroup>

## Sessioni e chat multiple

<AccordionGroup>
  <Accordion title="Come avvio una nuova conversazione?">
    Invia `/new` o `/reset` come messaggio autonomo. Vedi [Gestione delle sessioni](/it/concepts/session).
  </Accordion>

  <Accordion title="Le sessioni si reimpostano automaticamente se non invio mai /new?">
    Le sessioni possono scadere dopo `session.idleMinutes`, ma questo è **disabilitato per impostazione predefinita** (valore predefinito **0**).
    Impostalo su un valore positivo per abilitare la scadenza per inattività. Quando è abilitata, il **messaggio successivo**
    dopo il periodo di inattività avvia un nuovo ID sessione per quella chiave chat.
    Questo non elimina le trascrizioni: avvia semplicemente una nuova sessione.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="C'è un modo per creare un team di istanze OpenClaw (un CEO e molti agenti)?">
    Sì, tramite **routing multi-agente** e **sotto-agenti**. Puoi creare un agente coordinatore
    e diversi agenti worker con workspace e modelli propri.

    Detto questo, è meglio considerarlo un **esperimento divertente**. Consuma molti token e spesso
    è meno efficiente rispetto a usare un bot con sessioni separate. Il modello tipico che
    immaginiamo è un bot con cui parli, con sessioni diverse per lavori paralleli. Quel
    bot può anche avviare sotto-agenti quando necessario.

    Documenti: [Routing multi-agente](/it/concepts/multi-agent), [Sotto-agenti](/it/tools/subagents), [CLI degli agenti](/it/cli/agents).

  </Accordion>

  <Accordion title="Perché il contesto è stato troncato a metà attività? Come lo prevengo?">
    Il contesto della sessione è limitato dalla finestra del modello. Chat lunghe, output degli strumenti grandi o molti
    file possono attivare la compaction o il troncamento.

    Cosa aiuta:

    - Chiedi al bot di riassumere lo stato attuale e scriverlo in un file.
    - Usa `/compact` prima di attività lunghe e `/new` quando cambi argomento.
    - Mantieni il contesto importante nel workspace e chiedi al bot di rileggerlo.
    - Usa sotto-agenti per lavori lunghi o paralleli così la chat principale resta più piccola.
    - Scegli un modello con una finestra di contesto più ampia se succede spesso.

  </Accordion>

  <Accordion title="Come reimposto completamente OpenClaw mantenendolo installato?">
    Usa il comando di reset:

    ```bash
    openclaw reset
    ```

    Reset completo non interattivo:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Poi esegui di nuovo la configurazione:

    ```bash
    openclaw onboard --install-daemon
    ```

    Note:

    - L'onboarding offre anche **Reset** se vede una configurazione esistente. Vedi [Onboarding (CLI)](/it/start/wizard).
    - Se hai usato profili (`--profile` / `OPENCLAW_PROFILE`), reimposta ogni directory di stato (i valori predefiniti sono `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (solo dev; cancella configurazione dev + credenziali + sessioni + workspace).

  </Accordion>

  <Accordion title='Ricevo errori "context too large": come reimposto o compatto?'>
    Usa una di queste opzioni:

    - **Compatta** (mantiene la conversazione ma riassume i turni più vecchi):

      ```
      /compact
      ```

      oppure `/compact <instructions>` per guidare il riepilogo.

    - **Reset** (nuovo ID sessione per la stessa chiave chat):

      ```
      /new
      /reset
      ```

    Se continua a succedere:

    - Abilita o regola la **potatura della sessione** (`agents.defaults.contextPruning`) per tagliare il vecchio output degli strumenti.
    - Usa un modello con una finestra di contesto più ampia.

    Documenti: [Compaction](/it/concepts/compaction), [Potatura della sessione](/it/concepts/session-pruning), [Gestione delle sessioni](/it/concepts/session).

  </Accordion>

  <Accordion title='Perché vedo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Questo è un errore di validazione del provider: il modello ha emesso un blocco `tool_use` senza l'`input`
    richiesto. Di solito significa che la cronologia della sessione è obsoleta o corrotta (spesso dopo thread lunghi
    o una modifica di strumento/schema).

    Correzione: avvia una nuova sessione con `/new` (messaggio autonomo).

  </Accordion>

  <Accordion title="Perché ricevo messaggi heartbeat ogni 30 minuti?">
    Gli heartbeat vengono eseguiti ogni **30m** per impostazione predefinita (**1h** quando si usa l'autenticazione OAuth). Regolali o disabilitali:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni markdown
    come `# Heading`), OpenClaw salta l'esecuzione dell'heartbeat per risparmiare chiamate API.
    Se il file manca, l'heartbeat viene comunque eseguito e il modello decide cosa fare.

    Gli override per agente usano `agents.list[].heartbeat`. Documenti: [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title='Devo aggiungere un "bot account" a un gruppo WhatsApp?'>
    No. OpenClaw viene eseguito sul **tuo account**, quindi se sei nel gruppo, OpenClaw può vederlo.
    Per impostazione predefinita, le risposte di gruppo sono bloccate finché non autorizzi i mittenti (`groupPolicy: "allowlist"`).

    Se vuoi che solo **tu** possa attivare le risposte di gruppo:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Come ottengo il JID di un gruppo WhatsApp?">
    Opzione 1 (la più rapida): segui i log e invia un messaggio di test nel gruppo:

    ```bash
    openclaw logs --follow --json
    ```

    Cerca `chatId` (o `from`) che termina con `@g.us`, ad esempio:
    `1234567890-1234567890@g.us`.

    Opzione 2 (se già configurato/in allowlist): elenca i gruppi dalla configurazione:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documenti: [WhatsApp](/it/channels/whatsapp), [Directory](/it/cli/directory), [Log](/it/cli/logs).

  </Accordion>

  <Accordion title="Perché OpenClaw non risponde in un gruppo?">
    Due cause comuni:

    - Il gating tramite menzione è attivo (impostazione predefinita). Devi @menzionare il bot (o corrispondere a `mentionPatterns`).
    - Hai configurato `channels.whatsapp.groups` senza `"*"` e il gruppo non è in allowlist.

    Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).

  </Accordion>

  <Accordion title="Gruppi/thread condividono il contesto con i DM?">
    Le chat dirette confluiscono nella sessione principale per impostazione predefinita. Gruppi/canali hanno chiavi di sessione proprie, e gli argomenti Telegram / i thread Discord sono sessioni separate. Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).
  </Accordion>

  <Accordion title="Quanti workspace e agenti posso creare?">
    Nessun limite rigido. Decine (anche centinaia) vanno bene, ma fai attenzione a:

    - **Crescita del disco:** sessioni + trascrizioni vivono sotto `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo dei token:** più agenti significano più uso concorrente del modello.
    - **Overhead operativo:** profili di autenticazione, workspace e routing dei canali per agente.

    Suggerimenti:

    - Mantieni un workspace **attivo** per agente (`agents.defaults.workspace`).
    - Elimina le vecchie sessioni (elimina JSONL o voci dello store) se il disco cresce.
    - Usa `openclaw doctor` per individuare workspace residui e disallineamenti dei profili.

  </Accordion>

  <Accordion title="Posso eseguire più bot o chat contemporaneamente (Slack) e come dovrei configurarli?">
    Sì. Usa il **Routing multi-agente** per eseguire più agenti isolati e instradare i messaggi in ingresso per
    canale/account/interlocutore. Slack è supportato come canale e può essere associato ad agenti specifici.

    L'accesso al browser è potente, ma non può "fare qualsiasi cosa possa fare un essere umano": anti-bot, CAPTCHA e MFA possono
    comunque bloccare l'automazione. Per il controllo del browser più affidabile, usa Chrome MCP locale sull'host,
    oppure usa CDP sulla macchina che esegue effettivamente il browser.

    Configurazione consigliata:

    - Host Gateway sempre attivo (VPS/Mac mini).
    - Un agente per ruolo (associazioni).
    - Canale/i Slack associato/i a quegli agenti.
    - Browser locale tramite Chrome MCP o un Node quando necessario.

    Documentazione: [Routing multi-agente](/it/concepts/multi-agent), [Slack](/it/channels/slack),
    [Browser](/it/tools/browser), [Node](/it/nodes).

  </Accordion>
</AccordionGroup>

## Modelli, failover e profili di autenticazione

Le domande e risposte sui modelli — impostazioni predefinite, selezione, alias, cambio, failover, profili di autenticazione —
si trovano nelle [FAQ sui modelli](/it/help/faq-models).

## Gateway: porte, "già in esecuzione" e modalità remota

<AccordionGroup>
  <Accordion title="Quale porta usa il Gateway?">
    `gateway.port` controlla la singola porta multiplexata per WebSocket + HTTP (Control UI, hook, ecc.).

    Precedenza:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Perché openclaw gateway status dice "Runtime: running" ma "Connectivity probe: failed"?'>
    Perché "running" è la vista del **supervisore** (launchd/systemd/schtasks). Il probe di connettività è la CLI che si connette effettivamente al WebSocket del gateway.

    Usa `openclaw gateway status` e considera affidabili queste righe:

    - `Probe target:` (l'URL effettivamente usato dal probe)
    - `Listening:` (ciò che è effettivamente associato alla porta)
    - `Last gateway error:` (causa radice comune quando il processo è attivo ma la porta non è in ascolto)

  </Accordion>

  <Accordion title='Perché openclaw gateway status mostra "Config (cli)" e "Config (service)" diversi?'>
    Stai modificando un file di configurazione mentre il servizio ne sta eseguendo un altro (spesso una mancata corrispondenza di `--profile` / `OPENCLAW_STATE_DIR`).

    Correzione:

    ```bash
    openclaw gateway install --force
    ```

    Eseguilo dallo stesso `--profile` / ambiente che vuoi far usare al servizio.

  </Accordion>

  <Accordion title='Cosa significa "another gateway instance is already listening"?'>
    OpenClaw applica un blocco di runtime associando immediatamente il listener WebSocket all'avvio (predefinito `ws://127.0.0.1:18789`). Se il bind fallisce con `EADDRINUSE`, genera `GatewayLockError` indicando che un'altra istanza è già in ascolto.

    Correzione: arresta l'altra istanza, libera la porta oppure esegui con `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Come eseguo OpenClaw in modalità remota (il client si connette a un Gateway altrove)?">
    Imposta `gateway.mode: "remote"` e punta a un URL WebSocket remoto, facoltativamente con credenziali remote a segreto condiviso:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Note:

    - `openclaw gateway` si avvia solo quando `gateway.mode` è `local` (oppure se passi il flag di override).
    - L'app macOS osserva il file di configurazione e cambia modalità in tempo reale quando questi valori cambiano.
    - `gateway.remote.token` / `.password` sono solo credenziali remote lato client; da sole non abilitano l'autenticazione del gateway locale.

  </Accordion>

  <Accordion title='La Control UI dice "unauthorized" (o continua a riconnettersi). Cosa fare ora?'>
    Il percorso di autenticazione del tuo gateway e il metodo di autenticazione dell'interfaccia utente non corrispondono.

    Fatti (dal codice):

    - La Control UI conserva il token in `sessionStorage` per la sessione corrente della scheda del browser e per l'URL Gateway selezionato, quindi gli aggiornamenti nella stessa scheda continuano a funzionare senza ripristinare la persistenza di token in localStorage a lunga durata.
    - Su `AUTH_TOKEN_MISMATCH`, i client attendibili possono tentare un unico nuovo tentativo limitato con un token dispositivo memorizzato nella cache quando il gateway restituisce suggerimenti di ritento (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Quel nuovo tentativo con token in cache ora riutilizza gli scope approvati memorizzati con il token dispositivo. I chiamanti con `deviceToken` esplicito / `scopes` espliciti continuano invece a mantenere l'insieme di scope richiesto, senza ereditare gli scope in cache.
    - Al di fuori di quel percorso di ritento, la precedenza dell'autenticazione di connessione è: token/password condivisi espliciti prima, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi token di bootstrap.
    - I controlli degli scope del token di bootstrap sono prefissati per ruolo. L'elenco consentito dell'operatore bootstrap integrato soddisfa solo le richieste dell'operatore; i Node o altri ruoli non operatore hanno comunque bisogno di scope sotto il proprio prefisso di ruolo.

    Correzione:

    - Più veloce: `openclaw dashboard` (stampa + copia l'URL della dashboard, prova ad aprirla; mostra un suggerimento SSH se headless).
    - Se non hai ancora un token: `openclaw doctor --generate-gateway-token`.
    - Se remoto, crea prima il tunnel: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`.
    - Modalità a segreto condiviso: imposta `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oppure `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, poi incolla il segreto corrispondente nelle impostazioni della Control UI.
    - Modalità Tailscale Serve: assicurati che `gateway.auth.allowTailscale` sia abilitato e di aprire l'URL Serve, non un URL raw loopback/tailnet che aggira gli header di identità Tailscale.
    - Modalità proxy attendibile: assicurati di passare attraverso il proxy configurato sensibile all'identità, non tramite un URL gateway grezzo. Anche i proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true`.
    - Se la mancata corrispondenza persiste dopo l'unico nuovo tentativo, ruota/riapprova il token dispositivo associato:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Se quella chiamata di rotazione dice che è stata negata, controlla due cose:
      - le sessioni con dispositivo associato possono ruotare solo il **proprio** dispositivo, a meno che non abbiano anche `operator.admin`
      - i valori `--scope` espliciti non possono superare gli scope operatore correnti del chiamante
    - Ancora bloccato? Esegui `openclaw status --all` e segui [Risoluzione dei problemi](/it/gateway/troubleshooting). Vedi [Dashboard](/it/web/dashboard) per i dettagli di autenticazione.

  </Accordion>

  <Accordion title="Ho impostato gateway.bind su tailnet ma non riesce a eseguire il bind e nulla è in ascolto">
    Il bind `tailnet` sceglie un IP Tailscale dalle tue interfacce di rete (100.64.0.0/10). Se la macchina non è su Tailscale (o l'interfaccia è inattiva), non c'è nulla a cui eseguire il bind.

    Correzione:

    - Avvia Tailscale su quell'host (così avrà un indirizzo 100.x), oppure
    - Passa a `gateway.bind: "loopback"` / `"lan"`.

    Nota: `tailnet` è esplicito. `auto` preferisce loopback; usa `gateway.bind: "tailnet"` quando vuoi un bind solo tailnet.

  </Accordion>

  <Accordion title="Posso eseguire più Gateway sullo stesso host?">
    Di solito no: un Gateway può eseguire più canali di messaggistica e agenti. Usa più Gateway solo quando hai bisogno di ridondanza (es: bot di soccorso) o isolamento rigido.

    Sì, ma devi isolare:

    - `OPENCLAW_CONFIG_PATH` (configurazione per istanza)
    - `OPENCLAW_STATE_DIR` (stato per istanza)
    - `agents.defaults.workspace` (isolamento del workspace)
    - `gateway.port` (porte univoche)

    Configurazione rapida (consigliata):

    - Usa `openclaw --profile <name> ...` per istanza (crea automaticamente `~/.openclaw-<name>`).
    - Imposta un `gateway.port` univoco nella configurazione di ogni profilo (oppure passa `--port` per esecuzioni manuali).
    - Installa un servizio per profilo: `openclaw --profile <name> gateway install`.

    I profili aggiungono anche un suffisso ai nomi dei servizi (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guida completa: [Gateway multipli](/it/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Cosa significa "invalid handshake" / codice 1008?'>
    Il Gateway è un **server WebSocket** e si aspetta che il primissimo messaggio
    sia un frame `connect`. Se riceve qualsiasi altra cosa, chiude la connessione
    con **codice 1008** (violazione della policy).

    Cause comuni:

    - Hai aperto l'URL **HTTP** in un browser (`http://...`) invece di un client WS.
    - Hai usato la porta o il percorso sbagliato.
    - Un proxy o tunnel ha rimosso gli header di autenticazione o inviato una richiesta non Gateway.

    Correzioni rapide:

    1. Usa l'URL WS: `ws://<host>:18789` (o `wss://...` se HTTPS).
    2. Non aprire la porta WS in una normale scheda del browser.
    3. Se l'autenticazione è attiva, includi il token/password nel frame `connect`.

    Se stai usando la CLI o la TUI, l'URL dovrebbe apparire così:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Dettagli del protocollo: [Protocollo Gateway](/it/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging e debug

<AccordionGroup>
  <Accordion title="Dove sono i log?">
    Log su file (strutturati):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Puoi impostare un percorso stabile tramite `logging.file`. Il livello di log su file è controllato da `logging.level`. La verbosità della console è controllata da `--verbose` e `logging.consoleLevel`.

    Tail rapido dei log:

    ```bash
    openclaw logs --follow
    ```

    Log del servizio/supervisore (quando il gateway viene eseguito tramite launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` e `gateway.err.log` (predefinito: `~/.openclaw/logs/...`; i profili usano `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Vedi [Risoluzione dei problemi](/it/gateway/troubleshooting) per altro.

  </Accordion>

  <Accordion title="Come avvio/arresto/riavvio il servizio Gateway?">
    Usa gli helper del gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Se esegui il gateway manualmente, `openclaw gateway --force` può recuperare la porta. Vedi [Gateway](/it/gateway).

  </Accordion>

  <Accordion title="Ho chiuso il terminale su Windows: come riavvio OpenClaw?">
    Esistono **due modalità di installazione su Windows**:

    **1) WSL2 (consigliata):** il Gateway viene eseguito dentro Linux.

    Apri PowerShell, entra in WSL, quindi riavvia:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Se non hai mai installato il servizio, avvialo in foreground:

    ```bash
    openclaw gateway run
    ```

    **2) Windows nativo (non consigliato):** il Gateway viene eseguito direttamente in Windows.

    Apri PowerShell ed esegui:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Se lo esegui manualmente (nessun servizio), usa:

    ```powershell
    openclaw gateway run
    ```

    Documentazione: [Windows (WSL2)](/it/platforms/windows), [Runbook del servizio Gateway](/it/gateway).

  </Accordion>

  <Accordion title="Il Gateway è attivo ma le risposte non arrivano mai. Cosa dovrei controllare?">
    Inizia con un rapido controllo dello stato:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Cause comuni:

    - Autenticazione del modello non caricata sull'**host gateway** (controlla `models status`).
    - Associazione del canale/elenco consentiti che blocca le risposte (controlla configurazione del canale + log).
    - WebChat/Dashboard aperta senza il token corretto.

    Se sei remoto, conferma che il tunnel/connessione Tailscale sia attivo e che il
    WebSocket del Gateway sia raggiungibile.

    Documentazione: [Canali](/it/channels), [Risoluzione dei problemi](/it/gateway/troubleshooting), [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - cosa fare ora?'>
    Di solito significa che l'interfaccia utente ha perso la connessione WebSocket. Controlla:

    1. Il Gateway è in esecuzione? `openclaw gateway status`
    2. Il Gateway è integro? `openclaw status`
    3. La UI ha il token corretto? `openclaw dashboard`
    4. Se remoto, il collegamento tunnel/Tailscale è attivo?

    Poi segui i log:

    ```bash
    openclaw logs --follow
    ```

    Documentazione: [Dashboard](/it/web/dashboard), [Accesso remoto](/it/gateway/remote), [Risoluzione dei problemi](/it/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands non riesce. Cosa devo controllare?">
    Inizia dai log e dallo stato del canale:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Poi confronta l'errore:

    - `BOT_COMMANDS_TOO_MUCH`: il menu di Telegram ha troppe voci. OpenClaw riduce già al limite di Telegram e riprova con meno comandi, ma alcune voci di menu devono comunque essere eliminate. Riduci i comandi Plugin/skill/personalizzati, oppure disabilita `channels.telegram.commands.native` se non ti serve il menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, o errori di rete simili: se sei su un VPS o dietro un proxy, verifica che l'HTTPS in uscita sia consentito e che il DNS funzioni per `api.telegram.org`.

    Se il Gateway è remoto, assicurati di guardare i log sull'host del Gateway.

    Documentazione: [Telegram](/it/channels/telegram), [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI non mostra alcun output. Cosa devo controllare?">
    Prima verifica che il Gateway sia raggiungibile e che l'agente possa essere eseguito:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Nella TUI, usa `/status` per vedere lo stato corrente. Se ti aspetti risposte in un canale
    chat, assicurati che la consegna sia abilitata (`/deliver on`).

    Documentazione: [TUI](/it/web/tui), [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come faccio ad arrestare completamente e poi avviare il Gateway?">
    Se hai installato il servizio:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Questo arresta/avvia il **servizio supervisionato** (launchd su macOS, systemd su Linux).
    Usalo quando il Gateway viene eseguito in background come daemon.

    Se lo stai eseguendo in primo piano, arrestalo con Ctrl-C, poi:

    ```bash
    openclaw gateway run
    ```

    Documentazione: [Runbook del servizio Gateway](/it/gateway).

  </Accordion>

  <Accordion title="Spiegato semplice: openclaw gateway restart rispetto a openclaw gateway">
    - `openclaw gateway restart`: riavvia il **servizio in background** (launchd/systemd).
    - `openclaw gateway`: esegue il gateway **in primo piano** per questa sessione del terminale.

    Se hai installato il servizio, usa i comandi del gateway. Usa `openclaw gateway` quando
    vuoi un'esecuzione singola in primo piano.

  </Accordion>

  <Accordion title="Il modo più rapido per ottenere più dettagli quando qualcosa non riesce">
    Avvia il Gateway con `--verbose` per ottenere più dettagli nella console. Poi ispeziona il file di log per l'autenticazione del canale, l'instradamento del modello e gli errori RPC.
  </Accordion>
</AccordionGroup>

## Media e allegati

<AccordionGroup>
  <Accordion title="La mia skill ha generato un'immagine/PDF, ma non è stato inviato nulla">
    Gli allegati in uscita dall'agente devono includere una riga `MEDIA:<path-or-url>` (su una riga autonoma). Vedi [Configurazione dell'assistente OpenClaw](/it/start/openclaw) e [Invio dell'agente](/it/tools/agent-send).

    Invio tramite CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Controlla anche:

    - Il canale di destinazione supporta i media in uscita e non è bloccato da allowlist.
    - Il file rientra nei limiti di dimensione del provider (le immagini vengono ridimensionate a un massimo di 2048 px).
    - `tools.fs.workspaceOnly=true` mantiene gli invii da percorsi locali limitati al workspace, alla temp/media-store e ai file validati dalla sandbox.
    - `tools.fs.workspaceOnly=false` permette a `MEDIA:` di inviare file locali dell'host che l'agente può già leggere, ma solo per media e tipi di documenti sicuri (immagini, audio, video, PDF e documenti Office). I file di testo semplice e simili a segreti sono comunque bloccati.

    Vedi [Immagini](/it/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicurezza e controllo degli accessi

<AccordionGroup>
  <Accordion title="È sicuro esporre OpenClaw ai DM in entrata?">
    Tratta i DM in entrata come input non attendibile. I valori predefiniti sono progettati per ridurre il rischio:

    - Il comportamento predefinito sui canali che supportano i DM è **l'abbinamento**:
      - I mittenti sconosciuti ricevono un codice di abbinamento; il bot non elabora il loro messaggio.
      - Approva con: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Le richieste in sospeso sono limitate a **3 per canale**; controlla `openclaw pairing list --channel <channel> [--account <id>]` se non è arrivato un codice.
    - Aprire i DM pubblicamente richiede un opt-in esplicito (`dmPolicy: "open"` e allowlist `"*"`).

    Esegui `openclaw doctor` per evidenziare policy DM rischiose.

  </Accordion>

  <Accordion title="La prompt injection è un problema solo per i bot pubblici?">
    No. La prompt injection riguarda **contenuti non attendibili**, non solo chi può inviare DM al bot.
    Se il tuo assistente legge contenuti esterni (ricerca/recupero web, pagine del browser, email,
    documenti, allegati, log incollati), quei contenuti possono includere istruzioni che cercano
    di dirottare il modello. Questo può succedere anche se **sei l'unico mittente**.

    Il rischio maggiore si ha quando gli strumenti sono abilitati: il modello può essere indotto con l'inganno a
    esfiltrare il contesto o a chiamare strumenti per tuo conto. Riduci il raggio d'impatto:

    - usando un agente "lettore" di sola lettura o con strumenti disabilitati per riassumere contenuti non attendibili
    - mantenendo `web_search` / `web_fetch` / `browser` disattivati per gli agenti con strumenti abilitati
    - trattando anche il testo decodificato da file/documenti come non attendibile: OpenResponses
      `input_file` e l'estrazione degli allegati media racchiudono entrambi il testo estratto in
      marcatori espliciti di confine per contenuti esterni invece di passare il testo grezzo del file
    - usando sandbox e allowlist rigorose per gli strumenti

    Dettagli: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Il mio bot dovrebbe avere una propria email, un account GitHub o un numero di telefono?">
    Sì, per la maggior parte delle configurazioni. Isolare il bot con account e numeri di telefono separati
    riduce il raggio d'impatto se qualcosa va storto. Questo rende anche più facile ruotare
    le credenziali o revocare l'accesso senza influire sui tuoi account personali.

    Inizia in piccolo. Concedi l'accesso solo agli strumenti e agli account di cui hai davvero bisogno, ed espandi
    in seguito se necessario.

    Documentazione: [Sicurezza](/it/gateway/security), [Abbinamento](/it/channels/pairing).

  </Accordion>

  <Accordion title="Posso dargli autonomia sui miei messaggi di testo ed è sicuro?">
    **Non** consigliamo la piena autonomia sui tuoi messaggi personali. Il modello più sicuro è:

    - Mantieni i DM in **modalità di abbinamento** o con una allowlist rigorosa.
    - Usa un **numero o account separato** se vuoi che invii messaggi per tuo conto.
    - Lascialo preparare una bozza, poi **approva prima dell'invio**.

    Se vuoi sperimentare, fallo su un account dedicato e mantienilo isolato. Vedi
    [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Posso usare modelli più economici per attività da assistente personale?">
    Sì, **se** l'agente è solo chat e l'input è attendibile. I livelli più piccoli sono
    più suscettibili al dirottamento delle istruzioni, quindi evitali per agenti con strumenti abilitati
    o quando leggono contenuti non attendibili. Se devi usare un modello più piccolo, limita
    rigidamente gli strumenti ed eseguilo dentro una sandbox. Vedi [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Ho eseguito /start in Telegram ma non ho ricevuto un codice di abbinamento">
    I codici di abbinamento vengono inviati **solo** quando un mittente sconosciuto invia un messaggio al bot e
    `dmPolicy: "pairing"` è abilitato. `/start` da solo non genera un codice.

    Controlla le richieste in sospeso:

    ```bash
    openclaw pairing list telegram
    ```

    Se vuoi accesso immediato, aggiungi il tuo ID mittente alla allowlist o imposta `dmPolicy: "open"`
    per quell'account.

  </Accordion>

  <Accordion title="WhatsApp: invierà messaggi ai miei contatti? Come funziona l'abbinamento?">
    No. La policy DM predefinita di WhatsApp è **abbinamento**. I mittenti sconosciuti ricevono solo un codice di abbinamento e il loro messaggio **non viene elaborato**. OpenClaw risponde solo alle chat che riceve o agli invii espliciti che attivi.

    Approva l'abbinamento con:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Elenca le richieste in sospeso:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt del numero di telefono della procedura guidata: viene usato per impostare la tua **allowlist/proprietario** così che i tuoi DM siano consentiti. Non viene usato per l'invio automatico. Se lo esegui sul tuo numero WhatsApp personale, usa quel numero e abilita `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandi chat, interruzione delle attività e "non si ferma"

<AccordionGroup>
  <Accordion title="Come faccio a impedire che i messaggi interni di sistema vengano mostrati in chat?">
    La maggior parte dei messaggi interni o degli strumenti appare solo quando **verbose**, **trace** o **reasoning** è abilitato
    per quella sessione.

    Correggi nella chat in cui lo vedi:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Se è ancora rumoroso, controlla le impostazioni della sessione nella Control UI e imposta verbose
    su **eredita**. Verifica anche di non usare un profilo bot con `verboseDefault` impostato
    su `on` nella configurazione.

    Documentazione: [Pensiero e verbose](/it/tools/thinking), [Sicurezza](/it/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Come faccio ad arrestare/annullare un'attività in esecuzione?">
    Invia uno qualsiasi di questi **come messaggio autonomo** (senza slash):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Questi sono trigger di interruzione (non comandi slash).

    Per i processi in background (dallo strumento exec), puoi chiedere all'agente di eseguire:

    ```
    process action:kill sessionId:XXX
    ```

    Panoramica dei comandi slash: vedi [Comandi slash](/it/tools/slash-commands).

    La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`, ma alcune scorciatoie (come `/status`) funzionano anche inline per i mittenti nella allowlist.

  </Accordion>

  <Accordion title='Come faccio a inviare un messaggio Discord da Telegram? ("Messaggistica cross-context negata")'>
    OpenClaw blocca per impostazione predefinita la messaggistica **cross-provider**. Se una chiamata strumento è associata
    a Telegram, non invierà a Discord a meno che tu non lo consenta esplicitamente.

    Abilita la messaggistica cross-provider per l'agente:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Riavvia il gateway dopo aver modificato la configurazione.

  </Accordion>

  <Accordion title='Perché sembra che il bot "ignori" i messaggi in rapida sequenza?'>
    La modalità coda controlla come i nuovi messaggi interagiscono con un'esecuzione in corso. Usa `/queue` per cambiare modalità:

    - `steer` - accoda tutto lo steering in sospeso per il prossimo confine del modello nell'esecuzione corrente
    - `queue` - steering legacy uno alla volta
    - `followup` - esegue i messaggi uno alla volta
    - `collect` - raggruppa i messaggi e risponde una volta
    - `steer-backlog` - indirizza ora, poi elabora l'arretrato
    - `interrupt` - interrompe l'esecuzione corrente e riparte da capo

    La modalità predefinita è `steer`. Puoi aggiungere opzioni come `debounce:0.5s cap:25 drop:summarize` per le modalità followup. Vedi [Coda dei comandi](/it/concepts/queue) e [Coda di steering](/it/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Varie

<AccordionGroup>
  <Accordion title='Qual è il modello predefinito per Anthropic con una chiave API?'>
    In OpenClaw, le credenziali e la selezione del modello sono separate. Impostare `ANTHROPIC_API_KEY` (o salvare una chiave API Anthropic nei profili di autenticazione) abilita l'autenticazione, ma il modello predefinito effettivo è quello che configuri in `agents.defaults.model.primary` (ad esempio, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). Se vedi `No credentials found for profile "anthropic:default"`, significa che il Gateway non ha trovato le credenziali Anthropic nel file `auth-profiles.json` previsto per l'agente in esecuzione.
  </Accordion>
</AccordionGroup>

---

Ancora bloccato? Chiedi su [Discord](https://discord.com/invite/clawd) o apri una [discussione GitHub](https://github.com/openclaw/openclaw/discussions).

## Correlati

- [FAQ sul primo avvio](/it/help/faq-first-run) — installazione, onboarding, autenticazione, abbonamenti, errori iniziali
- [FAQ sui modelli](/it/help/faq-models) — selezione del modello, failover, profili di autenticazione
- [Risoluzione dei problemi](/it/help/troubleshooting) — triage basato sui sintomi
