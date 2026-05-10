---
read_when:
    - Rispondere alle domande comuni su configurazione, installazione, avvio iniziale o supporto in fase di esecuzione
    - Triage delle segnalazioni degli utenti prima di una diagnosi più approfondita
summary: Domande frequenti sulla configurazione iniziale, la configurazione e l'utilizzo di OpenClaw
title: Domande frequenti
x-i18n:
    generated_at: "2026-05-10T19:38:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121de36647f7452969b760d6b6ab0a6b1b776d63987ca6ba0be1c8cf4c9f85e9
    source_path: help/faq.md
    workflow: 16
---

Risposte rapide più risoluzione dei problemi approfondita per configurazioni reali (sviluppo locale, VPS, multi-agent, OAuth/chiavi API, failover dei modelli). Per la diagnostica runtime, consulta [Risoluzione dei problemi](/it/gateway/troubleshooting). Per il riferimento completo della configurazione, consulta [Configurazione](/it/gateway/configuration).

## Primi 60 secondi se qualcosa non funziona

1. **Stato rapido (primo controllo)**

   ```bash
   openclaw status
   ```

   Riepilogo locale veloce: sistema operativo + aggiornamento, raggiungibilità di gateway/servizio, agenti/sessioni, configurazione provider + problemi runtime (quando il Gateway è raggiungibile).

2. **Report incollabile (sicuro da condividere)**

   ```bash
   openclaw status --all
   ```

   Diagnosi in sola lettura con coda del log (token oscurati).

3. **Stato del daemon + porta**

   ```bash
   openclaw gateway status
   ```

   Mostra runtime del supervisore rispetto alla raggiungibilità RPC, l'URL di destinazione del probe e quale configurazione ha probabilmente usato il servizio.

4. **Probe approfonditi**

   ```bash
   openclaw status --deep
   ```

   Esegue un probe di integrità live del Gateway, inclusi i probe dei canali quando supportati
   (richiede un Gateway raggiungibile). Consulta [Integrità](/it/gateway/health).

5. **Segui il log più recente**

   ```bash
   openclaw logs --follow
   ```

   Se RPC non funziona, ripiega su:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   I log su file sono separati dai log del servizio; consulta [Logging](/it/logging) e [Risoluzione dei problemi](/it/gateway/troubleshooting).

6. **Esegui la diagnostica (riparazioni)**

   ```bash
   openclaw doctor
   ```

   Ripara/migra configurazione/stato + esegue controlli di integrità. Consulta [Diagnostica](/it/gateway/doctor).

7. **Snapshot del Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # mostra l'URL di destinazione + il percorso della configurazione in caso di errori
   ```

   Chiede al Gateway in esecuzione uno snapshot completo (solo WS). Consulta [Integrità](/it/gateway/health).

## Avvio rapido e configurazione al primo avvio

Le domande e risposte del primo avvio — installazione, onboarding, route di autenticazione, abbonamenti, errori iniziali —
si trovano nelle [FAQ del primo avvio](/it/help/faq-first-run).

## Che cos'è OpenClaw?

<AccordionGroup>
  <Accordion title="Che cos'è OpenClaw, in un paragrafo?">
    OpenClaw è un assistente AI personale che esegui sui tuoi dispositivi. Risponde sulle superfici di messaggistica che usi già (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e Plugin di canale inclusi come QQ Bot) e può anche offrire voce + Canvas live sulle piattaforme supportate. Il **Gateway** è il piano di controllo sempre attivo; l'assistente è il prodotto.
  </Accordion>

  <Accordion title="Proposta di valore">
    OpenClaw non è "solo un wrapper per Claude". È un **piano di controllo local-first** che ti permette di eseguire un
    assistente capace sul **tuo hardware**, raggiungibile dalle app di chat che usi già, con
    sessioni con stato, memoria e strumenti, senza consegnare il controllo dei tuoi flussi di lavoro a un
    SaaS ospitato.

    In evidenza:

    - **I tuoi dispositivi, i tuoi dati:** esegui il Gateway dove preferisci (Mac, Linux, VPS) e mantieni
      workspace + cronologia delle sessioni in locale.
    - **Canali reali, non una sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ecc.,
      più voce mobile e Canvas sulle piattaforme supportate.
    - **Indipendente dal modello:** usa Anthropic, OpenAI, MiniMax, OpenRouter, ecc., con routing
      e failover per agente.
    - **Opzione solo locale:** esegui modelli locali così **tutti i dati possono restare sul tuo dispositivo** se vuoi.
    - **Routing multi-agent:** agenti separati per canale, account o attività, ognuno con il proprio
      workspace e le proprie impostazioni predefinite.
    - **Open source e modificabile:** ispeziona, estendi e fai self-hosting senza vincoli con un vendor.

    Documentazione: [Gateway](/it/gateway), [Canali](/it/channels), [Multi-agent](/it/concepts/multi-agent),
    [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="L'ho appena configurato: cosa dovrei fare per prima cosa?">
    Buoni primi progetti:

    - Crea un sito web (WordPress, Shopify o un semplice sito statico).
    - Prototipa un'app mobile (bozza, schermate, piano API).
    - Organizza file e cartelle (pulizia, nomi, tag).
    - Collega Gmail e automatizza riepiloghi o follow-up.

    Può gestire attività grandi, ma funziona meglio quando le dividi in fasi e
    usi sub agenti per il lavoro in parallelo.

  </Accordion>

  <Accordion title="Quali sono i cinque principali casi d'uso quotidiani per OpenClaw?">
    I vantaggi quotidiani di solito assomigliano a:

    - **Briefing personali:** riepiloghi di casella di posta, calendario e notizie che ti interessano.
    - **Ricerca e stesura:** ricerca rapida, riepiloghi e prime bozze per email o documenti.
    - **Promemoria e follow-up:** solleciti e checklist guidati da cron o heartbeat.
    - **Automazione del browser:** compilazione di moduli, raccolta dati e ripetizione di attività web.
    - **Coordinamento tra dispositivi:** invia un'attività dal telefono, lascia che il Gateway la esegua su un server e ricevi il risultato in chat.

  </Accordion>

  <Accordion title="OpenClaw può aiutare con lead generation, outreach, annunci e blog per un SaaS?">
    Sì, per **ricerca, qualificazione e stesura**. Può analizzare siti, creare shortlist,
    riassumere prospect e scrivere bozze di outreach o di testi pubblicitari.

    Per **campagne di outreach o pubblicitarie**, mantieni un intervento umano nel processo. Evita lo spam, rispetta le leggi locali e
    le policy delle piattaforme, e rivedi tutto prima dell'invio. Il modello più sicuro è lasciare che
    OpenClaw prepari la bozza e che tu la approvi.

    Documentazione: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i vantaggi rispetto a Claude Code per lo sviluppo web?">
    OpenClaw è un **assistente personale** e un livello di coordinamento, non un sostituto dell'IDE. Usa
    Claude Code o Codex per il ciclo di coding diretto più rapido dentro una repo. Usa OpenClaw quando
    vuoi memoria persistente, accesso tra dispositivi e orchestrazione degli strumenti.

    Vantaggi:

    - **Memoria persistente + workspace** tra le sessioni
    - **Accesso multi-piattaforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestrazione degli strumenti** (browser, file, pianificazione, hook)
    - **Gateway sempre attivo** (eseguilo su una VPS, interagisci da ovunque)
    - **Nodi** per browser/schermo/camera/exec locali

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automazione

<AccordionGroup>
  <Accordion title="Come personalizzo le Skills senza mantenere la repo sporca?">
    Usa override gestiti invece di modificare la copia della repo. Inserisci le modifiche in `~/.openclaw/skills/<name>/SKILL.md` (oppure aggiungi una cartella tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json`). La precedenza è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundle → `skills.load.extraDirs`, quindi gli override gestiti prevalgono comunque sulle skills incluse nel bundle senza toccare git. Se hai bisogno che la skill sia installata globalmente ma visibile solo ad alcuni agenti, tieni la copia condivisa in `~/.openclaw/skills` e controlla la visibilità con `agents.defaults.skills` e `agents.list[].skills`. Solo le modifiche adatte all'upstream dovrebbero vivere nella repo ed essere inviate come PR.
  </Accordion>

  <Accordion title="Posso caricare skills da una cartella personalizzata?">
    Sì. Aggiungi directory extra tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json` (precedenza più bassa). La precedenza predefinita è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundle → `skills.load.extraDirs`. `clawhub` installa in `./skills` per impostazione predefinita, che OpenClaw tratta come `<workspace>/skills` nella sessione successiva. Se la skill deve essere visibile solo a determinati agenti, abbinala a `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="Come posso usare modelli diversi per attività diverse?">
    Oggi i modelli supportati sono:

    - **Processi Cron**: i processi isolati possono impostare un override `model` per ogni processo.
    - **Sub-agenti**: instrada le attività verso agenti separati con modelli predefiniti diversi.
    - **Cambio su richiesta**: usa `/model` per cambiare il modello della sessione corrente in qualsiasi momento.

    Vedi [Processi Cron](/it/automation/cron-jobs), [Instradamento multi-agente](/it/concepts/multi-agent) e [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Il bot si blocca mentre svolge lavoro pesante. Come posso scaricarlo altrove?">
    Usa **sub-agenti** per attività lunghe o parallele. I sub-agenti vengono eseguiti nella propria sessione,
    restituiscono un riepilogo e mantengono reattiva la chat principale.

    Chiedi al bot di "generare un sub-agente per questa attività" oppure usa `/subagents`.
    Usa `/status` in chat per vedere cosa sta facendo il Gateway in questo momento (e se è occupato).

    Suggerimento sui token: le attività lunghe e i sub-agenti consumano entrambi token. Se il costo è un problema, imposta un
    modello più economico per i sub-agenti tramite `agents.defaults.subagents.model`.

    Documentazione: [Sub-agenti](/it/tools/subagents), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Come funzionano su Discord le sessioni dei subagenti vincolate ai thread?">
    Usa i vincoli dei thread. Puoi associare un thread Discord a un subagente o a una destinazione di sessione, così i messaggi successivi in quel thread restano sulla sessione associata.

    Flusso di base:

    - Genera con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"` per follow-up persistenti).
    - Oppure associa manualmente con `/focus <target>`.
    - Usa `/agents` per ispezionare lo stato del vincolo.
    - Usa `/session idle <duration|off>` e `/session max-age <duration|off>` per controllare l'auto-unfocus.
    - Usa `/unfocus` per scollegare il thread.

    Configurazione richiesta:

    - Impostazioni predefinite globali: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Associazione automatica alla generazione: `channels.discord.threadBindings.spawnSessions` è impostato su `true` per impostazione predefinita; impostalo su `false` per disabilitare la generazione di sessioni vincolate al thread.

    Documentazione: [Sub-agenti](/it/tools/subagents), [Discord](/it/channels/discord), [Riferimento alla configurazione](/it/gateway/configuration-reference), [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagente ha terminato, ma l'aggiornamento di completamento è arrivato nel posto sbagliato o non è mai stato pubblicato. Cosa devo controllare?">
    Controlla prima la route del richiedente risolta:

    - La consegna del subagente in modalità completamento preferisce qualsiasi thread vincolato o route di conversazione quando esiste.
    - Se l'origine del completamento porta solo un canale, OpenClaw ripiega sulla route memorizzata della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta può comunque riuscire.
    - Se non esiste né una route vincolata né una route memorizzata utilizzabile, la consegna diretta può fallire e il risultato ripiega invece sulla consegna in coda della sessione anziché essere pubblicato subito in chat.
    - Destinazioni non valide o obsolete possono comunque forzare il ripiego sulla coda o il fallimento finale della consegna.
    - Se l'ultima risposta visibile dell'assistente figlio è esattamente il token silenzioso `NO_REPLY` / `no_reply`, o esattamente `ANNOUNCE_SKIP`, OpenClaw sopprime intenzionalmente l'annuncio invece di pubblicare progressi precedenti obsoleti.
    - Se il figlio è andato in timeout dopo sole chiamate agli strumenti, l'annuncio può condensarle in un breve riepilogo dei progressi parziali invece di riprodurre l'output grezzo degli strumenti.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Sub-agenti](/it/tools/subagents), [Attività in background](/it/automation/tasks), [Strumenti di sessione](/it/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o i promemoria non partono. Cosa devo controllare?">
    Cron viene eseguito all'interno del processo Gateway. Se il Gateway non è in esecuzione in modo continuo,
    i processi pianificati non verranno eseguiti.

    Checklist:

    - Conferma che cron sia abilitato (`cron.enabled`) e che `OPENCLAW_SKIP_CRON` non sia impostato.
    - Controlla che il Gateway sia in esecuzione 24/7 (senza sospensione/riavvii).
    - Verifica le impostazioni del fuso orario per il processo (`--tz` rispetto al fuso orario dell'host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentazione: [Processi Cron](/it/automation/cron-jobs), [Automazione e attività](/it/automation).

  </Accordion>

  <Accordion title="Cron è stato eseguito, ma non è stato inviato nulla al canale. Perché?">
    Controlla prima la modalità di consegna:

    - `--no-deliver` / `delivery.mode: "none"` significa che non è previsto alcun invio di fallback da parte del runner.
    - Una destinazione di annuncio mancante o non valida (`channel` / `to`) significa che il runner ha saltato la consegna in uscita.
    - Errori di autenticazione del canale (`unauthorized`, `Forbidden`) significano che il runner ha provato a consegnare, ma le credenziali lo hanno bloccato.
    - Un risultato isolato silenzioso (solo `NO_REPLY` / `no_reply`) viene trattato come intenzionalmente non consegnabile, quindi il runner sopprime anche la consegna di fallback in coda.

    Per i job cron isolati, l'agente può comunque inviare direttamente con lo strumento `message`
    quando è disponibile una route di chat. `--announce` controlla solo il percorso di
    fallback del runner per il testo finale che l'agente non ha già inviato.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Perché un'esecuzione Cron isolata ha cambiato modello o ha ritentato una volta?">
    Di solito è il percorso di cambio modello live, non una pianificazione duplicata.

    Cron isolato può persistere un passaggio di consegne del modello runtime e ritentare quando
    l'esecuzione attiva genera `LiveSessionModelSwitchError`. Il tentativo mantiene il
    provider/modello cambiato e, se il cambio includeva un nuovo override del profilo di autenticazione,
    Cron persiste anche quello prima di ritentare.

    Regole di selezione correlate:

    - L'override del modello dell'hook Gmail vince per primo quando applicabile.
    - Poi il `model` per job.
    - Poi qualsiasi override del modello della sessione Cron memorizzato.
    - Poi la normale selezione del modello dell'agente/predefinita.

    Il ciclo di tentativi è limitato. Dopo il tentativo iniziale più 2 tentativi di cambio,
    Cron interrompe invece di continuare all'infinito.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [CLI Cron](/it/cli/cron).

  </Accordion>

  <Accordion title="Come installo gli Skills su Linux?">
    Usa i comandi nativi `openclaw skills` oppure inserisci gli Skills nel tuo workspace. L'interfaccia utente Skills di macOS non è disponibile su Linux.
    Sfoglia gli Skills su [https://clawhub.ai](https://clawhub.ai).

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
    sincronizzare i tuoi Skills. Per installazioni condivise tra agenti, metti lo Skill sotto
    `~/.openclaw/skills` e usa `agents.defaults.skills` o
    `agents.list[].skills` se vuoi limitare quali agenti possono vederlo.

  </Accordion>

  <Accordion title="OpenClaw può eseguire attività in base a una pianificazione o continuamente in background?">
    Sì. Usa lo scheduler del Gateway:

    - **Job Cron** per attività pianificate o ricorrenti (persistono tra i riavvii).
    - **Heartbeat** per controlli periodici della "sessione principale".
    - **Job isolati** per agenti autonomi che pubblicano riepiloghi o consegnano alle chat.

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Automazione e attività](/it/automation),
    [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso eseguire Skills solo per Apple macOS da Linux?">
    Non direttamente. Gli Skills macOS sono controllati da `metadata.openclaw.os` più i binari richiesti, e gli Skills compaiono nel prompt di sistema solo quando sono idonei sull'**host Gateway**. Su Linux, gli Skills solo `darwin` (come `apple-notes`, `apple-reminders`, `things-mac`) non verranno caricati a meno che tu non sovrascriva il gating.

    Hai tre pattern supportati:

    **Opzione A - esegui il Gateway su un Mac (la più semplice).**
    Esegui il Gateway dove esistono i binari macOS, poi connettiti da Linux in [modalità remota](#gateway-ports-already-running-and-remote-mode) o tramite Tailscale. Gli Skills vengono caricati normalmente perché l'host Gateway è macOS.

    **Opzione B - usa un nodo macOS (senza SSH).**
    Esegui il Gateway su Linux, abbina un nodo macOS (app della barra dei menu) e imposta **Comandi di esecuzione Node** su "Chiedi sempre" o "Consenti sempre" sul Mac. OpenClaw può trattare gli Skills solo macOS come idonei quando i binari richiesti esistono sul nodo. L'agente esegue quegli Skills tramite lo strumento `nodes`. Se scegli "Chiedi sempre", approvare "Consenti sempre" nel prompt aggiunge quel comando alla allowlist.

    **Opzione C - esegui il proxy dei binari macOS tramite SSH (avanzata).**
    Mantieni il Gateway su Linux, ma fai in modo che i binari CLI richiesti risolvano a wrapper SSH che vengono eseguiti su un Mac. Poi sovrascrivi lo Skill per consentire Linux, così rimane idoneo.

    1. Crea un wrapper SSH per il binario (esempio: `memo` per Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Metti il wrapper nel `PATH` sull'host Linux (ad esempio `~/bin/memo`).
    3. Sovrascrivi i metadati dello Skill (workspace o `~/.openclaw/skills`) per consentire Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Avvia una nuova sessione affinché lo snapshot degli Skills venga aggiornato.

  </Accordion>

  <Accordion title="Avete un'integrazione Notion o HeyGen?">
    Non integrata oggi.

    Opzioni:

    - **Skill / Plugin personalizzato:** ideale per un accesso API affidabile (Notion/HeyGen hanno entrambi API).
    - **Automazione del browser:** funziona senza codice, ma è più lenta e più fragile.

    Se vuoi mantenere il contesto per cliente (workflow di agenzia), un pattern semplice è:

    - Una pagina Notion per cliente (contesto + preferenze + lavoro attivo).
    - Chiedere all'agente di recuperare quella pagina all'inizio di una sessione.

    Se vuoi un'integrazione nativa, apri una richiesta di funzionalità o crea uno Skill
    mirato a quelle API.

    Installa Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Le installazioni native finiscono nella directory `skills/` del workspace attivo. Per Skills condivisi tra agenti, inseriscili in `~/.openclaw/skills/<name>/SKILL.md`. Se solo alcuni agenti devono vedere un'installazione condivisa, configura `agents.defaults.skills` o `agents.list[].skills`. Alcuni Skills si aspettano binari installati tramite Homebrew; su Linux significa Linuxbrew (vedi la voce FAQ di Homebrew per Linux sopra). Vedi [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config) e [ClawHub](/it/clawhub).

  </Accordion>

  <Accordion title="Come uso il mio Chrome già autenticato con OpenClaw?">
    Usa il profilo browser integrato `user`, che si collega tramite Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Se vuoi un nome personalizzato, crea un profilo MCP esplicito:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Questo percorso può usare il browser host locale o un nodo browser connesso. Se il Gateway viene eseguito altrove, esegui un host nodo sulla macchina del browser oppure usa CDP remoto.

    Limiti attuali su `existing-session` / `user`:

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

    - Mantieni persistente `/home/node` con `OPENCLAW_HOME_VOLUME` così le cache sopravvivono.
    - Integra le dipendenze di sistema nell'immagine con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installa i browser Playwright tramite la CLI in bundle:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Imposta `PLAYWRIGHT_BROWSERS_PATH` e assicurati che il percorso sia persistente.

    Documentazione: [Docker](/it/install/docker), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="Posso mantenere personali i DM ma rendere i gruppi pubblici/in sandbox con un solo agente?">
    Sì - se il tuo traffico privato è costituito da **DM** e il tuo traffico pubblico da **gruppi**.

    Usa `agents.defaults.sandbox.mode: "non-main"` così le sessioni di gruppo/canale (chiavi non principali) vengono eseguite nel backend sandbox configurato, mentre la sessione DM principale rimane sull'host. Docker è il backend predefinito se non ne scegli uno. Poi limita quali strumenti sono disponibili nelle sessioni in sandbox tramite `tools.sandbox.tools`.

    Guida alla configurazione + configurazione di esempio: [Gruppi: DM personali + gruppi pubblici](/it/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Riferimento chiave di configurazione: [Configurazione Gateway](/it/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Come collego una cartella host alla sandbox?">
    Imposta `agents.defaults.sandbox.docker.binds` su `["host:path:mode"]` (ad es. `"/home/user/src:/src:ro"`). I bind globali e per agente vengono uniti; i bind per agente vengono ignorati quando `scope: "shared"`. Usa `:ro` per tutto ciò che è sensibile e ricorda che i bind aggirano le barriere del filesystem della sandbox.

    OpenClaw convalida le origini dei bind sia rispetto al percorso normalizzato sia rispetto al percorso canonico risolto attraverso l'antenato esistente più profondo. Ciò significa che le fughe tramite genitori symlink continuano a fallire in modo chiuso anche quando l'ultimo segmento del percorso non esiste ancora, e i controlli sulle radici consentite continuano ad applicarsi dopo la risoluzione dei symlink.

    Vedi [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs policy degli strumenti vs elevato](/it/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) per esempi e note di sicurezza.

  </Accordion>

  <Accordion title="Come funziona la memoria?">
    La memoria di OpenClaw è semplicemente composta da file Markdown nel workspace dell'agente:

    - Note giornaliere in `memory/YYYY-MM-DD.md`
    - Note curate a lungo termine in `MEMORY.md` (solo sessioni principali/private)

    OpenClaw esegue anche un **flush silenzioso della memoria prima della Compaction** per ricordare al modello
    di scrivere note durevoli prima dell'auto-compaction. Viene eseguito solo quando il workspace
    è scrivibile (le sandbox di sola lettura lo saltano). Vedi [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="La memoria continua a dimenticare le cose. Come faccio a renderle persistenti?">
    Chiedi al bot di **scrivere il fatto in memoria**. Le note a lungo termine appartengono a `MEMORY.md`,
    il contesto a breve termine va in `memory/YYYY-MM-DD.md`.

    È ancora un'area che stiamo migliorando. È utile ricordare al modello di archiviare i ricordi;
    saprà cosa fare. Se continua a dimenticare, verifica che il Gateway stia usando lo stesso
    workspace a ogni esecuzione.

    Documentazione: [Memoria](/it/concepts/memory), [Workspace dell'agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La memoria persiste per sempre? Quali sono i limiti?">
    I file di memoria vivono su disco e persistono finché non li elimini. Il limite è il tuo
    spazio di archiviazione, non il modello. Il **contesto della sessione** è comunque limitato dalla finestra
    di contesto del modello, quindi le conversazioni lunghe possono essere compattate o troncate. Ecco perché
    esiste la ricerca in memoria: riporta nel contesto solo le parti rilevanti.

    Documentazione: [Memoria](/it/concepts/memory), [Contesto](/it/concepts/context).

  </Accordion>

  <Accordion title="La ricerca semantica nella memoria richiede una chiave API OpenAI?">
    Solo se usi gli **embedding OpenAI**. OAuth di Codex copre chat/completions e
    **non** concede l'accesso agli embedding, quindi **accedere con Codex (OAuth o il
    login della CLI Codex)** non aiuta per la ricerca semantica nella memoria. Gli embedding OpenAI
    richiedono comunque una vera chiave API (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Se non imposti esplicitamente un provider, OpenClaw seleziona automaticamente un provider quando
    riesce a risolvere una chiave API (profili di autenticazione, `models.providers.*.apiKey` o variabili di ambiente).
    Preferisce OpenAI se viene risolta una chiave OpenAI, altrimenti Gemini se viene
    risolta una chiave Gemini, poi Voyage, poi Mistral. Se non è disponibile alcuna chiave remota, la ricerca
    nella memoria resta disabilitata finché non la configuri. Se hai un percorso di modello locale
    configurato e presente, OpenClaw
    preferisce `local`. Ollama è supportato quando imposti esplicitamente
    `memorySearch.provider = "ollama"`.

    Se preferisci restare in locale, imposta `memorySearch.provider = "local"` (e facoltativamente
    `memorySearch.fallback = "none"`). Se vuoi gli embedding Gemini, imposta
    `memorySearch.provider = "gemini"` e fornisci `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Supportiamo modelli di embedding **OpenAI, Gemini, Voyage, Mistral, Ollama o locali**
    - vedi [Memoria](/it/concepts/memory) per i dettagli di configurazione.

  </Accordion>
</AccordionGroup>

## Dove si trovano le cose su disco

<AccordionGroup>
  <Accordion title="Tutti i dati usati con OpenClaw vengono salvati localmente?">
    No - **lo stato di OpenClaw è locale**, ma **i servizi esterni vedono comunque ciò che invii loro**.

    - **Locale per impostazione predefinita:** sessioni, file di memoria, configurazione e workspace risiedono sull'host Gateway
      (`~/.openclaw` + la directory del tuo workspace).
    - **Remoto per necessità:** i messaggi che invii ai provider di modelli (Anthropic/OpenAI/ecc.) vanno alle
      loro API, e le piattaforme di chat (WhatsApp/Telegram/Slack/ecc.) archiviano i dati dei messaggi sui loro
      server.
    - **Controlli tu l'impronta:** usare modelli locali mantiene i prompt sulla tua macchina, ma il traffico dei canali
      passa comunque attraverso i server del canale.

    Correlati: [Workspace dell'agente](/it/concepts/agent-workspace), [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="Dove archivia i suoi dati OpenClaw?">
    Tutto si trova sotto `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`):

    | Percorso                                                        | Scopo                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configurazione principale (JSON5)                                  |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importazione OAuth legacy (copiata nei profili di autenticazione al primo uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profili di autenticazione (OAuth, chiavi API e `keyRef`/`tokenRef` facoltativi) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload segreto facoltativo basato su file per provider SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File di compatibilità legacy (voci statiche `api_key` ripulite)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stato del provider (es. `whatsapp/<accountId>/creds.json`)         |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stato per agente (agentDir + sessioni)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Cronologia e stato della conversazione (per agente)                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadati delle sessioni (per agente)                               |

    Percorso legacy per agente singolo: `~/.openclaw/agent/*` (migrato da `openclaw doctor`).

    Il tuo **workspace** (AGENTS.md, file di memoria, Skills, ecc.) è separato e configurato tramite `agents.defaults.workspace` (predefinito: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Dove devono stare AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Questi file stanno nel **workspace dell'agente**, non in `~/.openclaw`.

    - **Workspace (per agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` facoltativo.
      La radice minuscola `memory.md` è solo input di riparazione legacy; `openclaw doctor --fix`
      può unirlo in `MEMORY.md` quando entrambi i file esistono.
    - **Directory di stato (`~/.openclaw`)**: configurazione, stato di canali/provider, profili di autenticazione, sessioni, log
      e Skills condivise (`~/.openclaw/skills`).

    Il workspace predefinito è `~/.openclaw/workspace`, configurabile tramite:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se il bot "dimentica" dopo un riavvio, conferma che il Gateway stia usando lo stesso
    workspace a ogni avvio (e ricorda: la modalità remota usa il workspace **dell'host gateway**,
    non quello del tuo laptop locale).

    Suggerimento: se vuoi un comportamento o una preferenza durevoli, chiedi al bot di **scriverli in
    AGENTS.md o MEMORY.md** invece di fare affidamento sulla cronologia della chat.

    Vedi [Workspace dell'agente](/it/concepts/agent-workspace) e [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="Strategia di backup consigliata">
    Metti il tuo **workspace dell'agente** in un repository git **privato** ed eseguine il backup in un luogo
    privato (per esempio GitHub privato). Questo acquisisce memoria + file AGENTS/SOUL/USER
    e ti consente di ripristinare in seguito la "mente" dell'assistente.

    **Non** committare nulla sotto `~/.openclaw` (credenziali, sessioni, token o payload di segreti cifrati).
    Se hai bisogno di un ripristino completo, esegui il backup separato sia del workspace sia della directory di stato
    (vedi la domanda sulla migrazione sopra).

    Documentazione: [Workspace dell'agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Come disinstallo completamente OpenClaw?">
    Vedi la guida dedicata: [Disinstallazione](/it/install/uninstall).
  </Accordion>

  <Accordion title="Gli agenti possono lavorare fuori dal workspace?">
    Sì. Il workspace è il **cwd predefinito** e l'ancora della memoria, non una sandbox rigida.
    I percorsi relativi vengono risolti all'interno del workspace, ma i percorsi assoluti possono accedere ad altre
    posizioni dell'host a meno che il sandboxing sia abilitato. Se hai bisogno di isolamento, usa
    [`agents.defaults.sandbox`](/it/gateway/sandboxing) o le impostazioni sandbox per agente. Se
    vuoi che un repository sia la directory di lavoro predefinita, punta il
    `workspace` di quell'agente alla radice del repository. Il repository OpenClaw è solo codice sorgente; mantieni
    separato il workspace a meno che tu non voglia intenzionalmente che l'agente lavori al suo interno.

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

## Concetti base della configurazione

<AccordionGroup>
  <Accordion title="Qual è il formato della configurazione? Dov'è?">
    OpenClaw legge una configurazione **JSON5** facoltativa da `$OPENCLAW_CONFIG_PATH` (predefinito: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se il file manca, usa valori predefiniti abbastanza sicuri (incluso un workspace predefinito di `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ho impostato gateway.bind: "lan" (o "tailnet") e ora non c'è nulla in ascolto / l'UI dice non autorizzato'>
    I bind non loopback **richiedono un percorso di autenticazione Gateway valido**. In pratica significa:

    - autenticazione con segreto condiviso: token o password
    - `gateway.auth.mode: "trusted-proxy"` dietro un reverse proxy correttamente configurato e consapevole dell'identità

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

    - `gateway.remote.token` / `.password` **non** abilitano da soli l'autenticazione del Gateway locale.
    - I percorsi di chiamata locali possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
    - Per l'autenticazione con password, imposta invece `gateway.auth.mode: "password"` più `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modo chiuso (nessun mascheramento da fallback remoto).
    - Le configurazioni Control UI con segreto condiviso si autenticano tramite `connect.params.auth.token` o `connect.params.auth.password` (memorizzati nelle impostazioni app/UI). Le modalità con identità come Tailscale Serve o `trusted-proxy` usano invece gli header della richiesta. Evita di inserire segreti condivisi negli URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, i reverse proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito e una voce loopback in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Perché ora mi serve un token su localhost?">
    OpenClaw applica l'autenticazione Gateway per impostazione predefinita, incluso il loopback. Nel normale percorso predefinito questo significa autenticazione con token: se non è configurato alcun percorso di autenticazione esplicito, l'avvio del Gateway si risolve in modalità token e genera un token valido solo per quell'avvio, quindi **i client WS locali devono autenticarsi**. Configura esplicitamente `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` o `OPENCLAW_GATEWAY_PASSWORD` quando i client hanno bisogno di un segreto stabile tra i riavvii. Questo blocca altri processi locali dal chiamare il Gateway.

    Se preferisci un percorso di autenticazione diverso, puoi scegliere esplicitamente la modalità password (oppure, per reverse proxy consapevoli dell'identità, `trusted-proxy`). Se vuoi **davvero** il loopback aperto, imposta esplicitamente `gateway.auth.mode: "none"` nella tua configurazione. Doctor può generare un token per te in qualsiasi momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Devo riavviare dopo aver cambiato la configurazione?">
    Il Gateway osserva la configurazione e supporta il ricaricamento a caldo:

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

    - `off`: nasconde il testo dello slogan ma mantiene la riga titolo/versione del banner.
    - `default`: usa `All your chats, one OpenClaw.` ogni volta.
    - `random`: slogan divertenti/stagionali a rotazione (comportamento predefinito).
    - Se non vuoi alcun banner, imposta la variabile di ambiente `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Come abilito la ricerca web (e il recupero web)?">
    `web_fetch` funziona senza una chiave API. `web_search` dipende dal provider
    selezionato:

    - I provider basati su API come Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity e Tavily richiedono la normale configurazione della loro chiave API.
    - Ollama Web Search non richiede chiavi, ma usa il tuo host Ollama configurato e richiede `ollama signin`.
    - DuckDuckGo non richiede chiavi, ma è un'integrazione non ufficiale basata su HTML.
    - SearXNG non richiede chiavi/è self-hosted; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Consigliato:** esegui `openclaw configure --section web` e scegli un provider.
    Alternative tramite ambiente:

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
    I percorsi provider legacy `tools.web.search.*` vengono ancora caricati temporaneamente per compatibilità, ma non devono essere usati per le nuove configurazioni.
    La configurazione di fallback del recupero web di Firecrawl si trova in `plugins.entries.firecrawl.config.webFetch.*`.

    Note:

    - Se usi allowlist, aggiungi `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` è abilitato per impostazione predefinita (a meno che non venga disabilitato esplicitamente).
    - Se `tools.web.fetch.provider` viene omesso, OpenClaw rileva automaticamente il primo provider di fallback per il recupero pronto dalle credenziali disponibili. Oggi il provider incluso è Firecrawl.
    - I daemon leggono le variabili d'ambiente da `~/.openclaw/.env` (o dall'ambiente del servizio).

    Documentazione: [Strumenti web](/it/tools/web).

  </Accordion>

  <Accordion title="config.apply ha cancellato la mia configurazione. Come la recupero e come evito che succeda?">
    `config.apply` sostituisce **l'intera configurazione**. Se invii un oggetto parziale, tutto
    il resto viene rimosso.

    La versione attuale di OpenClaw protegge da molti sovrascritture accidentali:

    - Le scritture di configurazione di proprietà di OpenClaw validano l'intera configurazione post-modifica prima della scrittura.
    - Le scritture di proprietà di OpenClaw non valide o distruttive vengono rifiutate e salvate come `openclaw.json.rejected.*`.
    - Se una modifica diretta interrompe l'avvio o il ricaricamento a caldo, il Gateway si chiude in modo sicuro o salta il ricaricamento; non riscrive `openclaw.json`.
    - `openclaw doctor --fix` gestisce la riparazione e può ripristinare l'ultima configurazione valida nota salvando il file rifiutato come `openclaw.json.clobbered.*`.

    Ripristino:

    - Controlla `openclaw logs --follow` per `Invalid config at`, `Config write rejected:` o `config reload skipped (invalid config)`.
    - Ispeziona il file `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` più recente accanto alla configurazione attiva.
    - Esegui `openclaw config validate` e `openclaw doctor --fix`.
    - Copia di nuovo solo le chiavi previste con `openclaw config set` o `config.patch`.
    - Se non hai un'ultima configurazione valida nota o un payload rifiutato, ripristina da backup, oppure esegui di nuovo `openclaw doctor` e riconfigura canali/modelli.
    - Se questo comportamento era inatteso, apri una segnalazione di bug e includi l'ultima configurazione nota o eventuali backup.
    - Un agent di programmazione locale può spesso ricostruire una configurazione funzionante dai log o dalla cronologia.

    Come evitarlo:

    - Usa `openclaw config set` per piccole modifiche.
    - Usa `openclaw configure` per modifiche interattive.
    - Usa prima `config.schema.lookup` quando non sei sicuro di un percorso esatto o della forma di un campo; restituisce un nodo di schema superficiale più riepiloghi immediati dei figli per l'approfondimento.
    - Usa `config.patch` per modifiche RPC parziali; conserva `config.apply` solo per la sostituzione dell'intera configurazione.
    - Se stai usando lo strumento `gateway` riservato all'owner da un'esecuzione agent, rifiuterà comunque le scritture in `tools.exec.ask` / `tools.exec.security` (inclusi gli alias legacy `tools.bash.*` che si normalizzano sugli stessi percorsi exec protetti).

    Documentazione: [Configurazione](/it/cli/config), [Configura](/it/cli/configure), [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/it/gateway/doctor).

  </Accordion>

  <Accordion title="Come eseguo un Gateway centrale con worker specializzati su più dispositivi?">
    Lo schema comune è **un Gateway** (ad esempio Raspberry Pi) più **nodi** e **agent**:

    - **Gateway (centrale):** gestisce i canali (Signal/WhatsApp), il routing e le sessioni.
    - **Nodi (dispositivi):** Mac/iOS/Android si connettono come periferiche ed espongono strumenti locali (`system.run`, `canvas`, `camera`).
    - **Agent (worker):** cervelli/workspace separati per ruoli speciali (ad esempio "Hetzner ops", "Dati personali").
    - **Sub-agent:** avviano lavoro in background da un agent principale quando vuoi parallelismo.
    - **TUI:** connettiti al Gateway e cambia agent/sessioni.

    Documentazione: [Nodi](/it/nodes), [Accesso remoto](/it/gateway/remote), [Routing multi-agent](/it/concepts/multi-agent), [Sub-agent](/it/tools/subagents), [TUI](/it/web/tui).

  </Accordion>

  <Accordion title="Il browser di OpenClaw può essere eseguito in modalità headless?">
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

    Il valore predefinito è `false` (con interfaccia visibile). La modalità headless ha più probabilità di attivare controlli anti-bot su alcuni siti. Vedi [Browser](/it/tools/browser).

    La modalità headless usa lo **stesso motore Chromium** e funziona per la maggior parte delle automazioni (moduli, clic, scraping, accessi). Le differenze principali:

    - Nessuna finestra del browser visibile (usa screenshot se ti servono elementi visivi).
    - Alcuni siti sono più rigidi con l'automazione in modalità headless (CAPTCHA, anti-bot).
      Ad esempio, X/Twitter spesso blocca le sessioni headless.

  </Accordion>

  <Accordion title="Come uso Brave per il controllo del browser?">
    Imposta `browser.executablePath` sul binario di Brave (o di qualsiasi browser basato su Chromium) e riavvia il Gateway.
    Vedi gli esempi completi di configurazione in [Browser](/it/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway e nodi remoti

<AccordionGroup>
  <Accordion title="Come si propagano i comandi tra Telegram, il gateway e i nodi?">
    I messaggi Telegram vengono gestiti dal **gateway**. Il gateway esegue l'agent e
    solo allora chiama i nodi tramite il **Gateway WebSocket** quando serve uno strumento del nodo:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    I nodi non vedono il traffico provider in ingresso; ricevono solo chiamate RPC del nodo.

  </Accordion>

  <Accordion title="Come può il mio agent accedere al mio computer se il Gateway è ospitato da remoto?">
    Risposta breve: **abbina il tuo computer come nodo**. Il Gateway viene eseguito altrove, ma può
    chiamare gli strumenti `node.*` (schermo, fotocamera, sistema) sulla tua macchina locale tramite il Gateway WebSocket.

    Configurazione tipica:

    1. Esegui il Gateway sull'host sempre attivo (VPS/server domestico).
    2. Metti l'host del Gateway e il tuo computer nella stessa tailnet.
    3. Assicurati che il WS del Gateway sia raggiungibile (bind tailnet o tunnel SSH).
    4. Apri l'app macOS localmente e connettiti in modalità **Remoto tramite SSH** (o tailnet diretta)
       così può registrarsi come nodo.
    5. Approva il nodo sul Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Non è necessario un bridge TCP separato; i nodi si connettono tramite il Gateway WebSocket.

    Promemoria di sicurezza: l'abbinamento di un nodo macOS consente `system.run` su quella macchina. Abbina
    solo dispositivi di cui ti fidi e consulta [Sicurezza](/it/gateway/security).

    Documentazione: [Nodi](/it/nodes), [Protocollo Gateway](/it/gateway/protocol), [Modalità remota macOS](/it/platforms/mac/remote), [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Tailscale è connesso ma non ricevo risposte. E adesso?">
    Controlla le basi:

    - Il Gateway è in esecuzione: `openclaw gateway status`
    - Stato del Gateway: `openclaw status`
    - Stato del canale: `openclaw channels status`

    Poi verifica autenticazione e routing:

    - Se usi Tailscale Serve, assicurati che `gateway.auth.allowTailscale` sia impostato correttamente.
    - Se ti connetti tramite tunnel SSH, conferma che il tunnel locale sia attivo e punti alla porta corretta.
    - Conferma che le tue allowlist (DM o gruppo) includano il tuo account.

    Documentazione: [Tailscale](/it/gateway/tailscale), [Accesso remoto](/it/gateway/remote), [Canali](/it/channels).

  </Accordion>

  <Accordion title="Due istanze OpenClaw possono parlarsi tra loro (locale + VPS)?">
    Sì. Non esiste un bridge "bot-to-bot" integrato, ma puoi collegarle in alcuni
    modi affidabili:

    **Più semplice:** usa un normale canale di chat accessibile da entrambi i bot (Telegram/Slack/WhatsApp).
    Fai inviare a Bot A un messaggio a Bot B, poi lascia che Bot B risponda come al solito.

    **Bridge CLI (generico):** esegui uno script che chiama l'altro Gateway con
    `openclaw agent --message ... --deliver`, indirizzandolo a una chat in cui ascolta
    l'altro bot. Se un bot è su una VPS remota, punta la tua CLI a quel Gateway remoto
    tramite SSH/Tailscale (vedi [Accesso remoto](/it/gateway/remote)).

    Schema di esempio (esegui da una macchina che può raggiungere il Gateway di destinazione):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Suggerimento: aggiungi una protezione affinché i due bot non entrino in un ciclo infinito (solo menzioni, allowlist
    del canale o una regola "non rispondere ai messaggi dei bot").

    Documentazione: [Accesso remoto](/it/gateway/remote), [CLI Agent](/it/cli/agent), [Invio Agent](/it/tools/agent-send).

  </Accordion>

  <Accordion title="Mi servono VPS separate per più agent?">
    No. Un Gateway può ospitare più agent, ciascuno con il proprio workspace, impostazioni predefinite del modello
    e routing. Questa è la configurazione normale ed è molto più economica e semplice rispetto all'esecuzione
    di una VPS per agent.

    Usa VPS separate solo quando ti serve isolamento forte (confini di sicurezza) o configurazioni molto
    diverse che non vuoi condividere. Altrimenti, mantieni un solo Gateway e
    usa più agent o sub-agent.

  </Accordion>

  <Accordion title="C'è un vantaggio nell'usare un nodo sul mio laptop personale invece di SSH da una VPS?">
    Sì: i nodi sono il modo di prima classe per raggiungere il tuo laptop da un Gateway remoto e
    sbloccano più del semplice accesso shell. Il Gateway viene eseguito su macOS/Linux (Windows tramite WSL2) ed è
    leggero (va bene una piccola VPS o un dispositivo di classe Raspberry Pi; 4 GB di RAM sono più che sufficienti), quindi una configurazione comune
    è un host sempre attivo più il tuo laptop come nodo.

    - **Nessun SSH in ingresso richiesto.** I nodi si connettono in uscita al Gateway WebSocket e usano l'abbinamento dei dispositivi.
    - **Controlli di esecuzione più sicuri.** `system.run` è regolato da allowlist/approvazioni del nodo su quel laptop.
    - **Più strumenti del dispositivo.** I nodi espongono `canvas`, `camera` e `screen` oltre a `system.run`.
    - **Automazione browser locale.** Mantieni il Gateway su una VPS, ma esegui Chrome localmente tramite un host nodo sul laptop, oppure collegati a Chrome locale sull'host tramite Chrome MCP.

    SSH va bene per l'accesso shell occasionale, ma i nodi sono più semplici per workflow agent continuativi e
    automazione dei dispositivi.

    Documentazione: [Nodi](/it/nodes), [CLI Nodi](/it/cli/nodes), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="I nodi eseguono un servizio gateway?">
    No. Deve essere eseguito solo **un gateway** per host, a meno che tu non esegua intenzionalmente profili isolati (vedi [Gateway multipli](/it/gateway/multiple-gateways)). I nodi sono periferiche che si connettono
    al gateway (nodi iOS/Android, o "modalità nodo" macOS nell'app della barra dei menu). Per host nodo headless
    e controllo CLI, vedi [CLI host nodo](/it/cli/node).

    È richiesto un riavvio completo per modifiche a `gateway`, `discovery` e alla superficie dei Plugin ospitati.

  </Accordion>

  <Accordion title="Esiste un modo API / RPC per applicare la configurazione?">
    Sì.

    - `config.schema.lookup`: ispeziona un sottoalbero di configurazione con il suo nodo di schema superficiale, il suggerimento UI corrispondente e i riepiloghi dei figli immediati prima di scrivere
    - `config.get`: recupera lo snapshot corrente + hash
    - `config.patch`: aggiornamento parziale sicuro (preferito per la maggior parte delle modifiche RPC); ricarica a caldo quando possibile e riavvia quando necessario
    - `config.apply`: valida + sostituisce la configurazione completa; ricarica a caldo quando possibile e riavvia quando necessario
    - Lo strumento runtime `gateway`, solo per owner, continua a rifiutare la riscrittura di `tools.exec.ask` / `tools.exec.security`; gli alias legacy `tools.bash.*` si normalizzano sugli stessi percorsi exec protetti

  </Accordion>

  <Accordion title="Configurazione minima sensata per una prima installazione">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Questo imposta la tua workspace e limita chi può attivare il bot.

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
       - Nella console di amministrazione Tailscale, abilita MagicDNS così la VPS ha un nome stabile.
    4. **Usa l'hostname della tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se vuoi la UI di controllo senza SSH, usa Tailscale Serve sulla VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Questo mantiene il gateway associato al loopback ed espone HTTPS tramite Tailscale. Vedi [Tailscale](/it/gateway/tailscale).

  </Accordion>

  <Accordion title="Come collego un nodo Mac a un Gateway remoto (Tailscale Serve)?">
    Serve espone la **UI di controllo del Gateway + WS**. I nodi si connettono tramite lo stesso endpoint Gateway WS.

    Configurazione consigliata:

    1. **Assicurati che la VPS + il Mac siano sulla stessa tailnet**.
    2. **Usa l'app macOS in modalità remota** (il target SSH può essere l'hostname della tailnet).
       L'app creerà un tunnel per la porta del Gateway e si connetterà come nodo.
    3. **Approva il nodo** sul gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documenti: [Protocollo Gateway](/it/gateway/protocol), [Rilevamento](/it/gateway/discovery), [Modalità remota macOS](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Devo installare su un secondo laptop o aggiungere solo un nodo?">
    Se ti servono solo **strumenti locali** (schermo/fotocamera/exec) sul secondo laptop, aggiungilo come
    **nodo**. Questo mantiene un solo Gateway ed evita configurazioni duplicate. Gli strumenti dei nodi locali sono
    attualmente solo per macOS, ma prevediamo di estenderli ad altri OS.

    Installa un secondo Gateway solo quando ti serve **isolamento forte** o due bot completamente separati.

    Documenti: [Nodi](/it/nodes), [CLI dei nodi](/it/cli/nodes), [Gateway multipli](/it/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variabili d'ambiente e caricamento .env

<AccordionGroup>
  <Accordion title="Come carica OpenClaw le variabili d'ambiente?">
    OpenClaw legge le variabili d'ambiente dal processo padre (shell, launchd/systemd, CI, ecc.) e inoltre carica:

    - `.env` dalla directory di lavoro corrente
    - un `.env` globale di fallback da `~/.openclaw/.env` (ovvero `$OPENCLAW_STATE_DIR/.env`)

    Nessuno dei due file `.env` sovrascrive le variabili d'ambiente esistenti.

    Puoi anche definire variabili d'ambiente inline nella configurazione (applicate solo se mancanti nell'ambiente del processo):

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

  <Accordion title="Ho avviato il Gateway tramite il servizio e le mie variabili d'ambiente sono scomparse. E ora?">
    Due correzioni comuni:

    1. Inserisci le chiavi mancanti in `~/.openclaw/.env` così vengono rilevate anche quando il servizio non eredita l'ambiente della tua shell.
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

    Questo esegue la tua shell di login e importa solo le chiavi attese mancanti (senza mai sovrascrivere). Equivalenti come variabili d'ambiente:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ho impostato COPILOT_GITHUB_TOKEN, ma lo stato dei modelli mostra "Shell env: off." Perché?'>
    `openclaw models status` indica se **l'importazione dell'ambiente della shell** è abilitata. "Shell env: off"
    **non** significa che le tue variabili d'ambiente siano mancanti: significa solo che OpenClaw non caricherà
    automaticamente la tua shell di login.

    Se il Gateway viene eseguito come servizio (launchd/systemd), non erediterà il tuo
    ambiente shell. Risolvi in uno di questi modi:

    1. Inserisci il token in `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oppure abilita l'importazione dalla shell (`env.shellEnv.enabled: true`).
    3. Oppure aggiungilo al blocco `env` della configurazione (si applica solo se mancante).

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
    Le sessioni possono scadere dopo `session.idleMinutes`, ma questa opzione è **disabilitata per impostazione predefinita** (valore predefinito **0**).
    Impostala su un valore positivo per abilitare la scadenza per inattività. Quando è abilitata, il **successivo**
    messaggio dopo il periodo di inattività avvia un nuovo ID di sessione per quella chiave chat.
    Questo non elimina le trascrizioni: avvia soltanto una nuova sessione.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="C'è un modo per creare un team di istanze OpenClaw (un CEO e molti agenti)?">
    Sì, tramite **routing multi-agente** e **sub-agenti**. Puoi creare un agente coordinatore
    e diversi agenti worker con le proprie workspace e i propri modelli.

    Detto questo, è meglio considerarlo un **esperimento divertente**. Consuma molti token e spesso
    è meno efficiente rispetto a usare un bot con sessioni separate. Il modello tipico che
    immaginiamo è un bot con cui parli, con sessioni diverse per il lavoro in parallelo. Quel
    bot può anche generare sub-agenti quando necessario.

    Documenti: [Routing multi-agente](/it/concepts/multi-agent), [Sub-agenti](/it/tools/subagents), [CLI degli agenti](/it/cli/agents).

  </Accordion>

  <Accordion title="Perché il contesto è stato troncato a metà attività? Come lo evito?">
    Il contesto della sessione è limitato dalla finestra del modello. Chat lunghe, output degli strumenti estesi o molti
    file possono attivare compaction o troncamento.

    Cosa aiuta:

    - Chiedi al bot di riepilogare lo stato corrente e scriverlo in un file.
    - Usa `/compact` prima di attività lunghe e `/new` quando cambi argomento.
    - Mantieni il contesto importante nella workspace e chiedi al bot di rileggerlo.
    - Usa sub-agenti per lavori lunghi o in parallelo, così la chat principale resta più piccola.
    - Scegli un modello con una finestra di contesto più ampia se succede spesso.

  </Accordion>

  <Accordion title="Come reimposto completamente OpenClaw mantenendolo installato?">
    Usa il comando reset:

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

    - L'onboarding offre anche **Reset** se rileva una configurazione esistente. Vedi [Onboarding (CLI)](/it/start/wizard).
    - Se hai usato profili (`--profile` / `OPENCLAW_PROFILE`), reimposta ogni directory di stato (i valori predefiniti sono `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (solo dev; cancella configurazione dev + credenziali + sessioni + workspace).

  </Accordion>

  <Accordion title='Ricevo errori "context too large": come faccio reset o compact?'>
    Usa una di queste opzioni:

    - **Compact** (mantiene la conversazione ma riepiloga i turni più vecchi):

      ```
      /compact
      ```

      oppure `/compact <instructions>` per guidare il riepilogo.

    - **Reset** (nuovo ID di sessione per la stessa chiave chat):

      ```
      /new
      /reset
      ```

    Se continua a succedere:

    - Abilita o regola la **potatura delle sessioni** (`agents.defaults.contextPruning`) per tagliare i vecchi output degli strumenti.
    - Usa un modello con una finestra di contesto più ampia.

    Documenti: [Compaction](/it/concepts/compaction), [Potatura delle sessioni](/it/concepts/session-pruning), [Gestione delle sessioni](/it/concepts/session).

  </Accordion>

  <Accordion title='Perché vedo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Questo è un errore di validazione del provider: il modello ha emesso un blocco `tool_use` senza il campo
    `input` richiesto. Di solito significa che la cronologia della sessione è obsoleta o corrotta (spesso dopo thread lunghi
    o una modifica a strumenti/schema).

    Correzione: avvia una nuova sessione con `/new` (messaggio autonomo).

  </Accordion>

  <Accordion title="Perché ricevo messaggi Heartbeat ogni 30 minuti?">
    Gli Heartbeat vengono eseguiti ogni **30m** per impostazione predefinita (**1h** quando si usa l'autenticazione OAuth). Regolali o disabilitali:

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

    Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni
    markdown come `# Heading`), OpenClaw salta l'esecuzione di Heartbeat per risparmiare chiamate API.
    Se il file manca, Heartbeat viene comunque eseguito e il modello decide cosa fare.

    Le sostituzioni per agente usano `agents.list[].heartbeat`. Documenti: [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title='Devo aggiungere un "bot account" a un gruppo WhatsApp?'>
    No. OpenClaw viene eseguito sul **tuo account**, quindi se sei nel gruppo, OpenClaw può vederlo.
    Per impostazione predefinita, le risposte nei gruppi sono bloccate finché non autorizzi i mittenti (`groupPolicy: "allowlist"`).

    Se vuoi che solo **tu** possa attivare le risposte nei gruppi:

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
    Opzione 1 (più rapida): segui i log e invia un messaggio di test nel gruppo:

    ```bash
    openclaw logs --follow --json
    ```

    Cerca `chatId` (o `from`) che termini con `@g.us`, ad esempio:
    `1234567890-1234567890@g.us`.

    Opzione 2 (se già configurato/in allowlist): elenca i gruppi dalla configurazione:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documenti: [WhatsApp](/it/channels/whatsapp), [Directory](/it/cli/directory), [Log](/it/cli/logs).

  </Accordion>

  <Accordion title="Perché OpenClaw non risponde in un gruppo?">
    Due cause comuni:

    - Il gating tramite menzione è attivo (predefinito). Devi @menzionare il bot (o corrispondere a `mentionPatterns`).
    - Hai configurato `channels.whatsapp.groups` senza `"*"` e il gruppo non è in allowlist.

    Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).

  </Accordion>

  <Accordion title="Gruppi/thread condividono il contesto con i DM?">
    Le chat dirette confluiscono nella sessione principale per impostazione predefinita. Gruppi/canali hanno le proprie chiavi di sessione, e gli argomenti Telegram / i thread Discord sono sessioni separate. Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).
  </Accordion>

  <Accordion title="Quanti workspace e agenti posso creare?">
    Nessun limite rigido. Decine (anche centinaia) vanno bene, ma fai attenzione a:

    - **Crescita del disco:** sessioni + trascrizioni sono in `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo in token:** più agenti significano più utilizzo concorrente dei modelli.
    - **Overhead operativo:** profili di autenticazione, workspace e routing dei canali per ogni agente.

    Suggerimenti:

    - Mantieni un workspace **attivo** per agente (`agents.defaults.workspace`).
    - Elimina le sessioni vecchie (file JSONL o voci archiviate) se il disco cresce.
    - Usa `openclaw doctor` per individuare workspace residui e disallineamenti dei profili.

  </Accordion>

  <Accordion title="Posso eseguire più bot o chat contemporaneamente (Slack), e come dovrei configurarli?">
    Sì. Usa **Multi-Agent Routing** per eseguire più agenti isolati e instradare i messaggi in ingresso per
    canale/account/peer. Slack è supportato come canale e può essere associato ad agenti specifici.

    L'accesso tramite browser è potente, ma non può "fare qualsiasi cosa possa fare un essere umano": anti-bot, CAPTCHA e MFA possono
    comunque bloccare l'automazione. Per il controllo del browser più affidabile, usa Chrome MCP locale sull'host,
    oppure usa CDP sulla macchina che esegue effettivamente il browser.

    Configurazione consigliata:

    - Host Gateway sempre attivo (VPS/Mac mini).
    - Un agente per ruolo (associazioni).
    - Canale/i Slack associati a quegli agenti.
    - Browser locale tramite Chrome MCP o un nodo quando necessario.

    Documentazione: [Multi-Agent Routing](/it/concepts/multi-agent), [Slack](/it/channels/slack),
    [Browser](/it/tools/browser), [Nodi](/it/nodes).

  </Accordion>
</AccordionGroup>

## Modelli, failover e profili di autenticazione

Le domande e risposte sui modelli — impostazioni predefinite, selezione, alias, cambio, failover, profili di autenticazione —
sono nelle [FAQ sui modelli](/it/help/faq-models).

## Gateway: porte, "già in esecuzione" e modalità remota

<AccordionGroup>
  <Accordion title="Quale porta usa il Gateway?">
    `gateway.port` controlla la singola porta multiplexed per WebSocket + HTTP (Control UI, hook, ecc.).

    Precedenza:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Perché openclaw gateway status dice "Runtime: running" ma "Connectivity probe: failed"?'>
    Perché "running" è la vista del **supervisor** (launchd/systemd/schtasks). Il probe di connettività è la CLI che si connette effettivamente al WebSocket del Gateway.

    Usa `openclaw gateway status` e considera affidabili queste righe:

    - `Probe target:` (l'URL effettivamente usato dal probe)
    - `Listening:` (ciò che è effettivamente in ascolto sulla porta)
    - `Last gateway error:` (causa principale comune quando il processo è vivo ma la porta non è in ascolto)

  </Accordion>

  <Accordion title='Perché openclaw gateway status mostra "Config (cli)" e "Config (service)" diversi?'>
    Stai modificando un file di configurazione mentre il servizio ne usa un altro (spesso una mancata corrispondenza `--profile` / `OPENCLAW_STATE_DIR`).

    Correzione:

    ```bash
    openclaw gateway install --force
    ```

    Eseguilo dallo stesso `--profile` / ambiente che vuoi far usare al servizio.

  </Accordion>

  <Accordion title='Cosa significa "another gateway instance is already listening"?'>
    OpenClaw applica un lock di runtime associando immediatamente il listener WebSocket all'avvio (predefinito `ws://127.0.0.1:18789`). Se il bind fallisce con `EADDRINUSE`, genera `GatewayLockError`, indicando che un'altra istanza è già in ascolto.

    Correzione: ferma l'altra istanza, libera la porta oppure esegui con `openclaw gateway --port <port>`.

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

    - `openclaw gateway` si avvia solo quando `gateway.mode` è `local` (o se passi il flag di override).
    - L'app macOS osserva il file di configurazione e cambia modalità live quando questi valori cambiano.
    - `gateway.remote.token` / `.password` sono solo credenziali remote lato client; da sole non abilitano l'autenticazione del gateway locale.

  </Accordion>

  <Accordion title='La Control UI dice "unauthorized" (o continua a riconnettersi). E ora?'>
    Il percorso di autenticazione del gateway e il metodo di autenticazione della UI non corrispondono.

    Fatti (dal codice):

    - La Control UI conserva il token in `sessionStorage` per la sessione corrente della scheda del browser e per l'URL del gateway selezionato, quindi gli aggiornamenti nella stessa scheda continuano a funzionare senza ripristinare la persistenza del token a lungo termine in localStorage.
    - Su `AUTH_TOKEN_MISMATCH`, i client attendibili possono tentare un solo retry limitato con un token dispositivo memorizzato nella cache quando il gateway restituisce suggerimenti di retry (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Quel retry con token in cache ora riutilizza gli ambiti approvati in cache archiviati con il token dispositivo. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono comunque l'insieme di ambiti richiesto invece di ereditare gli ambiti in cache.
    - Fuori da quel percorso di retry, la precedenza dell'autenticazione di connessione è prima token/password condivisi espliciti, poi `deviceToken` esplicito, poi token dispositivo salvato, poi token bootstrap.
    - I controlli degli ambiti del token bootstrap hanno prefisso di ruolo. L'allowlist operatore bootstrap integrata soddisfa solo le richieste operatore; i ruoli nodo o altri ruoli non operatore hanno comunque bisogno di ambiti sotto il proprio prefisso di ruolo.

    Correzione:

    - Più rapido: `openclaw dashboard` (stampa + copia l'URL della dashboard, prova ad aprirlo; mostra un suggerimento SSH se headless).
    - Se non hai ancora un token: `openclaw doctor --generate-gateway-token`.
    - Se remoto, prima crea un tunnel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, poi apri `http://127.0.0.1:18789/`.
    - Modalità a segreto condiviso: imposta `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, quindi incolla il segreto corrispondente nelle impostazioni della Control UI.
    - Modalità Tailscale Serve: assicurati che `gateway.auth.allowTailscale` sia abilitato e di aprire l'URL Serve, non un URL loopback/tailnet grezzo che aggira gli header di identità Tailscale.
    - Modalità proxy attendibile: assicurati di passare attraverso il proxy identity-aware configurato, non da un URL gateway grezzo. Anche i proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true`.
    - Se la mancata corrispondenza persiste dopo l'unico retry, ruota/riapprova il token dispositivo associato:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Se quella chiamata di rotazione dice che è stata negata, controlla due cose:
      - le sessioni con dispositivo associato possono ruotare solo il **proprio** dispositivo, a meno che non abbiano anche `operator.admin`
      - i valori `--scope` espliciti non possono superare gli ambiti operatore correnti del chiamante
    - Ancora bloccato? Esegui `openclaw status --all` e segui [Risoluzione dei problemi](/it/gateway/troubleshooting). Vedi [Dashboard](/it/web/dashboard) per i dettagli di autenticazione.

  </Accordion>

  <Accordion title="Ho impostato gateway.bind tailnet ma non riesce a fare bind e nulla resta in ascolto">
    Il bind `tailnet` sceglie un IP Tailscale dalle interfacce di rete (100.64.0.0/10). Se la macchina non è su Tailscale (o l'interfaccia è inattiva), non c'è nulla a cui fare bind.

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

    - Usa `openclaw --profile <name> ...` per ogni istanza (crea automaticamente `~/.openclaw-<name>`).
    - Imposta un `gateway.port` univoco nella configurazione di ciascun profilo (o passa `--port` per le esecuzioni manuali).
    - Installa un servizio per profilo: `openclaw --profile <name> gateway install`.

    I profili aggiungono anche un suffisso ai nomi dei servizi (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guida completa: [Più gateway](/it/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Cosa significa "invalid handshake" / codice 1008?'>
    Il Gateway è un **server WebSocket** e si aspetta che il primissimo messaggio
    sia un frame `connect`. Se riceve qualsiasi altra cosa, chiude la connessione
    con **codice 1008** (violazione della policy).

    Cause comuni:

    - Hai aperto l'URL **HTTP** in un browser (`http://...`) invece di un client WS.
    - Hai usato la porta o il percorso sbagliati.
    - Un proxy o tunnel ha rimosso gli header di autenticazione o inviato una richiesta non Gateway.

    Correzioni rapide:

    1. Usa l'URL WS: `ws://<host>:18789` (o `wss://...` se HTTPS).
    2. Non aprire la porta WS in una normale scheda del browser.
    3. Se l'autenticazione è attiva, includi il token/password nel frame `connect`.

    Se usi la CLI o la TUI, l'URL dovrebbe essere simile a:

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

    Puoi impostare un percorso stabile tramite `logging.file`. Il livello dei log su file è controllato da `logging.level`. La verbosità della console è controllata da `--verbose` e `logging.consoleLevel`.

    Tail dei log più rapido:

    ```bash
    openclaw logs --follow
    ```

    Log del servizio/supervisor (quando il gateway viene eseguito tramite launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` e `gateway.err.log` (predefinito: `~/.openclaw/logs/...`; i profili usano `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Vedi [Risoluzione dei problemi](/it/gateway/troubleshooting) per altro.

  </Accordion>

  <Accordion title="Come avvio/fermo/riavvio il servizio Gateway?">
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

    Se non hai mai installato il servizio, avvialo in primo piano:

    ```bash
    openclaw gateway run
    ```

    **2) Windows nativo (non consigliato):** il Gateway viene eseguito direttamente in Windows.

    Apri PowerShell ed esegui:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Se lo esegui manualmente (senza servizio), usa:

    ```powershell
    openclaw gateway run
    ```

    Documentazione: [Windows (WSL2)](/it/platforms/windows), [Runbook del servizio Gateway](/it/gateway).

  </Accordion>

  <Accordion title="Il Gateway è attivo ma le risposte non arrivano mai. Cosa devo controllare?">
    Inizia con una rapida verifica dello stato:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Cause comuni:

    - Auth del modello non caricato sull'**host Gateway** (controlla `models status`).
    - Pairing/allowlist del canale che blocca le risposte (controlla configurazione del canale + log).
    - WebChat/Dashboard è aperto senza il token corretto.

    Se sei remoto, conferma che la connessione tunnel/Tailscale sia attiva e che il
    WebSocket del Gateway sia raggiungibile.

    Documenti: [Canali](/it/channels), [Risoluzione dei problemi](/it/gateway/troubleshooting), [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnesso dal gateway: nessun motivo" - cosa fare ora?'>
    Di solito significa che l'interfaccia ha perso la connessione WebSocket. Controlla:

    1. Il Gateway è in esecuzione? `openclaw gateway status`
    2. Il Gateway è integro? `openclaw status`
    3. L'interfaccia ha il token corretto? `openclaw dashboard`
    4. Se sei remoto, il collegamento tunnel/Tailscale è attivo?

    Poi segui i log:

    ```bash
    openclaw logs --follow
    ```

    Documenti: [Dashboard](/it/web/dashboard), [Accesso remoto](/it/gateway/remote), [Risoluzione dei problemi](/it/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands non riesce. Cosa devo controllare?">
    Inizia da log e stato del canale:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Poi confronta l'errore:

    - `BOT_COMMANDS_TOO_MUCH`: il menu Telegram ha troppe voci. OpenClaw riduce già al limite di Telegram e riprova con meno comandi, ma alcune voci del menu devono comunque essere rimosse. Riduci i comandi Plugin/Skills/personalizzati, oppure disabilita `channels.telegram.commands.native` se non ti serve il menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, o errori di rete simili: se sei su un VPS o dietro un proxy, conferma che HTTPS in uscita sia consentito e che il DNS funzioni per `api.telegram.org`.

    Se il Gateway è remoto, assicurati di guardare i log sull'host Gateway.

    Documenti: [Telegram](/it/channels/telegram), [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI non mostra output. Cosa devo controllare?">
    Per prima cosa conferma che il Gateway sia raggiungibile e che l'agente possa essere eseguito:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Nella TUI, usa `/status` per vedere lo stato corrente. Se ti aspetti risposte in un canale
    chat, assicurati che la consegna sia abilitata (`/deliver on`).

    Documenti: [TUI](/it/web/tui), [Comandi slash](/it/tools/slash-commands).

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

    Documenti: [Runbook del servizio Gateway](/it/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: riavvia il **servizio in background** (launchd/systemd).
    - `openclaw gateway`: esegue il gateway **in primo piano** per questa sessione del terminale.

    Se hai installato il servizio, usa i comandi gateway. Usa `openclaw gateway` quando
    vuoi un'esecuzione una tantum, in primo piano.

  </Accordion>

  <Accordion title="Il modo più rapido per ottenere più dettagli quando qualcosa non riesce">
    Avvia il Gateway con `--verbose` per ottenere più dettagli nella console. Poi ispeziona il file di log per auth dei canali, instradamento dei modelli ed errori RPC.
  </Accordion>
</AccordionGroup>

## Media e allegati

<AccordionGroup>
  <Accordion title="La mia skill ha generato un'immagine/PDF, ma non è stato inviato nulla">
    Gli allegati in uscita dall'agente devono includere una riga `MEDIA:<path-or-url>` (su una riga a sé). Vedi [Configurazione dell'assistente OpenClaw](/it/start/openclaw) e [Invio agente](/it/tools/agent-send).

    Invio dalla CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Controlla anche:

    - Il canale di destinazione supporta media in uscita e non è bloccato da allowlist.
    - Il file rientra nei limiti di dimensione del provider (le immagini vengono ridimensionate a max 2048px).
    - `tools.fs.workspaceOnly=true` mantiene gli invii di percorsi locali limitati a workspace, temp/media-store e file validati dalla sandbox.
    - `tools.fs.workspaceOnly=false` consente a `MEDIA:` di inviare file locali dell'host che l'agente può già leggere, ma solo per media e tipi di documenti sicuri (immagini, audio, video, PDF e documenti Office). File di testo semplice e file simili a segreti restano bloccati.

    Vedi [Immagini](/it/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicurezza e controllo degli accessi

<AccordionGroup>
  <Accordion title="È sicuro esporre OpenClaw ai DM in ingresso?">
    Considera i DM in ingresso come input non attendibile. I valori predefiniti sono progettati per ridurre il rischio:

    - Il comportamento predefinito sui canali compatibili con DM è il **pairing**:
      - I mittenti sconosciuti ricevono un codice di pairing; il bot non elabora il loro messaggio.
      - Approva con: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Le richieste in sospeso sono limitate a **3 per canale**; controlla `openclaw pairing list --channel <channel> [--account <id>]` se un codice non è arrivato.
    - Aprire pubblicamente i DM richiede opt-in esplicito (`dmPolicy: "open"` e allowlist `"*"`).

    Esegui `openclaw doctor` per far emergere policy DM rischiose.

  </Accordion>

  <Accordion title="La prompt injection è un problema solo per i bot pubblici?">
    No. La prompt injection riguarda **contenuti non attendibili**, non solo chi può inviare DM al bot.
    Se il tuo assistente legge contenuti esterni (ricerca/fetch web, pagine del browser, email,
    documenti, allegati, log incollati), quei contenuti possono includere istruzioni che tentano
    di dirottare il modello. Questo può accadere anche se **sei tu l'unico mittente**.

    Il rischio maggiore si presenta quando gli strumenti sono abilitati: il modello può essere ingannato e spinto a
    esfiltrare contesto o chiamare strumenti per tuo conto. Riduci il raggio d'impatto:

    - usando un agente "lettore" in sola lettura o con strumenti disabilitati per riassumere contenuti non attendibili
    - mantenendo `web_search` / `web_fetch` / `browser` disattivati per agenti con strumenti abilitati
    - trattando anche il testo decodificato da file/documenti come non attendibile: OpenResponses
      `input_file` e l'estrazione di allegati multimediali racchiudono entrambi il testo estratto in
      marcatori espliciti di confine per contenuti esterni invece di passare testo grezzo dei file
    - sandboxing e allowlist rigorose per gli strumenti

    Dettagli: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Il mio bot dovrebbe avere una propria email, un account GitHub o un numero di telefono?">
    Sì, per la maggior parte delle configurazioni. Isolare il bot con account e numeri di telefono separati
    riduce il raggio d'impatto se qualcosa va storto. Questo rende anche più facile ruotare
    credenziali o revocare l'accesso senza impattare i tuoi account personali.

    Inizia in piccolo. Concedi accesso solo agli strumenti e agli account di cui hai effettivamente bisogno, ed espandi
    in seguito se necessario.

    Documenti: [Sicurezza](/it/gateway/security), [Pairing](/it/channels/pairing).

  </Accordion>

  <Accordion title="Posso dargli autonomia sui miei messaggi di testo ed è sicuro?">
    **Non** consigliamo piena autonomia sui tuoi messaggi personali. Lo schema più sicuro è:

    - Mantieni i DM in **modalità pairing** o con una allowlist stretta.
    - Usa un **numero o account separato** se vuoi che invii messaggi per tuo conto.
    - Fagli preparare una bozza, poi **approva prima dell'invio**.

    Se vuoi sperimentare, fallo su un account dedicato e tienilo isolato. Vedi
    [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Posso usare modelli più economici per attività di assistente personale?">
    Sì, **se** l'agente è solo chat e l'input è attendibile. I livelli più piccoli sono
    più suscettibili al dirottamento tramite istruzioni, quindi evitali per agenti con strumenti abilitati
    o quando leggono contenuti non attendibili. Se devi usare un modello più piccolo, limita rigidamente
    gli strumenti ed eseguilo dentro una sandbox. Vedi [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Ho eseguito /start in Telegram ma non ho ricevuto un codice di pairing">
    I codici di pairing vengono inviati **solo** quando un mittente sconosciuto invia un messaggio al bot e
    `dmPolicy: "pairing"` è abilitato. `/start` da solo non genera un codice.

    Controlla le richieste in sospeso:

    ```bash
    openclaw pairing list telegram
    ```

    Se vuoi accesso immediato, inserisci il tuo sender id in allowlist oppure imposta `dmPolicy: "open"`
    per quell'account.

  </Accordion>

  <Accordion title="WhatsApp: invierà messaggi ai miei contatti? Come funziona il pairing?">
    No. La policy DM predefinita di WhatsApp è **pairing**. I mittenti sconosciuti ricevono solo un codice di pairing e il loro messaggio **non viene elaborato**. OpenClaw risponde solo alle chat che riceve o agli invii espliciti che attivi.

    Approva il pairing con:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Elenca le richieste in sospeso:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt del numero di telefono nella procedura guidata: viene usato per impostare la tua **allowlist/proprietario** così i tuoi DM sono consentiti. Non viene usato per invii automatici. Se lo esegui sul tuo numero WhatsApp personale, usa quel numero e abilita `channels.whatsapp.selfChatMode`.

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
    su **inherit**. Conferma anche di non usare un profilo bot con `verboseDefault` impostato
    su `on` nella configurazione.

    Documenti: [Pensiero e verbose](/it/tools/thinking), [Sicurezza](/it/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Come faccio a fermare/annullare un'attività in esecuzione?">
    Invia uno di questi **come messaggio autonomo** (senza slash):

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

    La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`, ma alcune scorciatoie (come `/status`) funzionano anche inline per mittenti in allowlist.

  </Accordion>

  <Accordion title='Come faccio a inviare un messaggio Discord da Telegram? ("Messaggistica tra contesti negata")'>
    OpenClaw blocca la messaggistica **tra provider** per impostazione predefinita. Se una chiamata a strumento è vincolata
    a Telegram, non invierà a Discord a meno che tu non lo consenta esplicitamente.

    Abilita la messaggistica tra provider per l'agente:

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

  <Accordion title='Perché sembra che il bot "ignori" messaggi in rapida successione?'>
    La modalità coda controlla come i nuovi messaggi interagiscono con un'esecuzione in corso. Usa `/queue` per cambiare modalità:

    - `steer` - mette in coda tutto lo steering in sospeso per il prossimo confine del modello nell'esecuzione corrente
    - `queue` - steering legacy uno alla volta
    - `followup` - esegue i messaggi uno alla volta
    - `collect` - raggruppa i messaggi e risponde una volta
    - `steer-backlog` - orienta ora, poi elabora il backlog
    - `interrupt` - interrompe l'esecuzione corrente e ricomincia da capo

    La modalità predefinita è `steer`. Puoi aggiungere opzioni come `debounce:0.5s cap:25 drop:summarize` per le modalità di follow-up. Vedi [Coda dei comandi](/it/concepts/queue) e [Coda di steering](/it/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Varie

<AccordionGroup>
  <Accordion title='Qual è il modello predefinito per Anthropic con una chiave API?'>
    In OpenClaw, credenziali e selezione del modello sono separate. Impostare `ANTHROPIC_API_KEY` (o archiviare una chiave API Anthropic nei profili di autenticazione) abilita l'autenticazione, ma il modello predefinito effettivo è quello configurato in `agents.defaults.model.primary` (ad esempio, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). Se vedi `No credentials found for profile "anthropic:default"`, significa che il Gateway non è riuscito a trovare le credenziali Anthropic nel file `auth-profiles.json` previsto per l'agente in esecuzione.
  </Accordion>
</AccordionGroup>

---

Ancora bloccato? Chiedi su [Discord](https://discord.com/invite/clawd) o apri una [discussione GitHub](https://github.com/openclaw/openclaw/discussions).

## Correlati

- [FAQ sul primo avvio](/it/help/faq-first-run) — installazione, onboarding, autenticazione, abbonamenti, errori iniziali
- [FAQ sui modelli](/it/help/faq-models) — selezione del modello, failover, profili di autenticazione
- [Risoluzione dei problemi](/it/help/troubleshooting) — triage basato sui sintomi
