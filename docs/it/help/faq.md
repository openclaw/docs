---
read_when:
    - Rispondere alle domande comuni su configurazione, installazione, introduzione iniziale o supporto in fase di esecuzione
    - Valutazione preliminare dei problemi segnalati dagli utenti prima di un debug più approfondito
summary: Domande frequenti sull'installazione, la configurazione e l'utilizzo di OpenClaw
title: Domande frequenti
x-i18n:
    generated_at: "2026-04-30T08:56:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: c09be6571e048b71e4e02288b22b51e70102872675dfc7bef133b955a06f6ac9
    source_path: help/faq.md
    workflow: 16
---

Risposte rapide più risoluzione dei problemi approfondita per configurazioni reali (sviluppo locale, VPS, multi-agente, chiavi OAuth/API, failover dei modelli). Per la diagnostica runtime, consulta [Risoluzione dei problemi](/it/gateway/troubleshooting). Per il riferimento completo della configurazione, consulta [Configurazione](/it/gateway/configuration).

## Primi 60 secondi se qualcosa non funziona

1. **Stato rapido (primo controllo)**

   ```bash
   openclaw status
   ```

   Riepilogo locale veloce: sistema operativo + aggiornamento, raggiungibilità del gateway/servizio, agenti/sessioni, configurazione del provider + problemi runtime (quando il gateway è raggiungibile).

2. **Report incollabile (sicuro da condividere)**

   ```bash
   openclaw status --all
   ```

   Diagnosi in sola lettura con coda dei log (token oscurati).

3. **Stato del demone + porta**

   ```bash
   openclaw gateway status
   ```

   Mostra il runtime del supervisore rispetto alla raggiungibilità RPC, l'URL di destinazione del probe e quale configurazione ha probabilmente usato il servizio.

4. **Probe approfonditi**

   ```bash
   openclaw status --deep
   ```

   Esegue un probe live dello stato del Gateway, inclusi i probe dei canali quando supportati
   (richiede un Gateway raggiungibile). Consulta [Stato](/it/gateway/health).

5. **Segui l'ultimo log**

   ```bash
   openclaw logs --follow
   ```

   Se RPC non è disponibile, usa come fallback:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   I log su file sono separati dai log del servizio; consulta [Logging](/it/logging) e [Risoluzione dei problemi](/it/gateway/troubleshooting).

6. **Esegui il doctor (riparazioni)**

   ```bash
   openclaw doctor
   ```

   Ripara/migra configurazione/stato + esegue controlli di salute. Consulta [Doctor](/it/gateway/doctor).

7. **Snapshot del Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # mostra l'URL di destinazione + il percorso della configurazione in caso di errori
   ```

   Chiede al Gateway in esecuzione uno snapshot completo (solo WS). Consulta [Stato](/it/gateway/health).

## Avvio rapido e configurazione al primo avvio

Le domande e risposte del primo avvio — installazione, onboarding, percorsi di autenticazione, abbonamenti, errori iniziali —
si trovano nelle [FAQ del primo avvio](/it/help/faq-first-run).

## Che cos'è OpenClaw?

<AccordionGroup>
  <Accordion title="Che cos'è OpenClaw, in un paragrafo?">
    OpenClaw è un assistente AI personale che esegui sui tuoi dispositivi. Risponde sulle superfici di messaggistica che usi già (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e Plugin di canale inclusi come QQ Bot) e può anche offrire voce + un Canvas live sulle piattaforme supportate. Il **Gateway** è il piano di controllo sempre attivo; l'assistente è il prodotto.
  </Accordion>

  <Accordion title="Proposta di valore">
    OpenClaw non è "solo un wrapper di Claude". È un **piano di controllo local-first** che ti permette di eseguire un
    assistente capace sul **tuo hardware**, raggiungibile dalle app di chat che usi già, con
    sessioni con stato, memoria e strumenti - senza consegnare il controllo dei tuoi flussi di lavoro a un
    SaaS ospitato.

    Punti principali:

    - **I tuoi dispositivi, i tuoi dati:** esegui il Gateway dove vuoi (Mac, Linux, VPS) e mantieni
      workspace + cronologia delle sessioni in locale.
    - **Canali reali, non una sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ecc.,
      più voce mobile e Canvas sulle piattaforme supportate.
    - **Indipendente dal modello:** usa Anthropic, OpenAI, MiniMax, OpenRouter, ecc., con routing
      e failover per agente.
    - **Opzione solo locale:** esegui modelli locali in modo che **tutti i dati possano restare sul tuo dispositivo** se vuoi.
    - **Routing multi-agente:** agenti separati per canale, account o attività, ognuno con il proprio
      workspace e i propri valori predefiniti.
    - **Open source e modificabile:** ispeziona, estendi e ospita autonomamente senza lock-in del fornitore.

    Documentazione: [Gateway](/it/gateway), [Canali](/it/channels), [Multi-agente](/it/concepts/multi-agent),
    [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="L'ho appena configurato - cosa dovrei fare per prima cosa?">
    Buoni primi progetti:

    - Crea un sito web (WordPress, Shopify o un semplice sito statico).
    - Prototipa un'app mobile (struttura, schermate, piano API).
    - Organizza file e cartelle (pulizia, denominazione, tagging).
    - Collega Gmail e automatizza riepiloghi o follow-up.

    Può gestire attività grandi, ma funziona meglio quando le dividi in fasi e
    usi sotto-agenti per il lavoro in parallelo.

  </Accordion>

  <Accordion title="Quali sono i cinque principali casi d'uso quotidiani di OpenClaw?">
    I vantaggi quotidiani di solito sono:

    - **Briefing personali:** riepiloghi di inbox, calendario e notizie che ti interessano.
    - **Ricerca e stesura:** ricerche rapide, riepiloghi e prime bozze per email o documenti.
    - **Promemoria e follow-up:** solleciti ed elenchi di controllo guidati da Cron o Heartbeat.
    - **Automazione del browser:** compilazione di moduli, raccolta di dati e ripetizione di attività web.
    - **Coordinamento tra dispositivi:** invia un'attività dal telefono, lascia che il Gateway la esegua su un server e ricevi il risultato in chat.

  </Accordion>

  <Accordion title="OpenClaw può aiutare con lead generation, outreach, annunci e blog per un SaaS?">
    Sì, per **ricerca, qualificazione e redazione**. Può scansionare siti, creare liste ristrette,
    riassumere potenziali clienti e scrivere bozze di outreach o testi pubblicitari.

    Per **outreach o campagne pubblicitarie**, mantieni una persona nel processo. Evita lo spam, rispetta le leggi locali e
    le policy delle piattaforme, e rivedi tutto prima che venga inviato. Il modello più sicuro è lasciare che
    OpenClaw prepari la bozza e che tu approvi.

    Docs: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i vantaggi rispetto a Claude Code per lo sviluppo web?">
    OpenClaw è un **assistente personale** e un livello di coordinamento, non un sostituto dell'IDE. Usa
    Claude Code o Codex per il ciclo di sviluppo diretto più rapido dentro una repo. Usa OpenClaw quando
    vuoi memoria duratura, accesso da più dispositivi e orchestrazione degli strumenti.

    Vantaggi:

    - **Memoria persistente + workspace** tra sessioni
    - **Accesso multipiattaforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestrazione degli strumenti** (browser, file, pianificazione, hook)
    - **Gateway sempre attivo** (eseguilo su una VPS, interagisci da ovunque)
    - **Nodi** per browser/schermo/fotocamera/exec locali

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automazione

<AccordionGroup>
  <Accordion title="Come posso personalizzare le skill senza mantenere la repo sporca?">
    Usa override gestiti invece di modificare la copia nella repo. Metti le modifiche in `~/.openclaw/skills/<name>/SKILL.md` (oppure aggiungi una cartella tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json`). La precedenza è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → integrate → `skills.load.extraDirs`, quindi gli override gestiti hanno comunque precedenza sulle skill integrate senza toccare git. Se ti serve che la skill sia installata globalmente ma visibile solo ad alcuni agenti, mantieni la copia condivisa in `~/.openclaw/skills` e controlla la visibilità con `agents.defaults.skills` e `agents.list[].skills`. Solo le modifiche adatte all'upstream dovrebbero stare nella repo ed essere inviate come PR.
  </Accordion>

  <Accordion title="Posso caricare skill da una cartella personalizzata?">
    Sì. Aggiungi directory extra tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json` (precedenza più bassa). La precedenza predefinita è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → integrate → `skills.load.extraDirs`. `clawhub` installa in `./skills` per impostazione predefinita, che OpenClaw tratta come `<workspace>/skills` nella sessione successiva. Se la skill deve essere visibile solo a determinati agenti, abbinala a `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="Come posso usare modelli diversi per attività diverse?">
    Oggi i modelli supportati sono:

    - **Processi Cron**: i processi isolati possono impostare un override `model` per ogni processo.
    - **Sotto-agenti**: instrada le attività ad agenti separati con modelli predefiniti diversi.
    - **Cambio su richiesta**: usa `/model` per cambiare in qualsiasi momento il modello della sessione corrente.

    Vedi [Processi Cron](/it/automation/cron-jobs), [Routing multi-agente](/it/concepts/multi-agent) e [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Il bot si blocca durante lavori pesanti. Come posso delegarli?">
    Usa **sotto-agenti** per attività lunghe o parallele. I sotto-agenti vengono eseguiti nella propria sessione,
    restituiscono un riepilogo e mantengono reattiva la chat principale.

    Chiedi al bot di "spawn a sub-agent for this task" oppure usa `/subagents`.
    Usa `/status` in chat per vedere cosa sta facendo il Gateway in questo momento (e se è occupato).

    Suggerimento sui token: le attività lunghe e i sotto-agenti consumano entrambi token. Se il costo è un problema, imposta un
    modello più economico per i sotto-agenti tramite `agents.defaults.subagents.model`.

    Docs: [Sotto-agenti](/it/tools/subagents), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Come funzionano su Discord le sessioni dei sotto-agenti vincolate ai thread?">
    Usa i vincoli dei thread. Puoi vincolare un thread Discord a un sotto-agente o a una destinazione di sessione, così i messaggi successivi in quel thread restano su quella sessione vincolata.

    Flusso di base:

    - Avvia con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"` per follow-up persistenti).
    - Oppure vincola manualmente con `/focus <target>`.
    - Usa `/agents` per ispezionare lo stato del vincolo.
    - Usa `/session idle <duration|off>` e `/session max-age <duration|off>` per controllare l'auto-unfocus.
    - Usa `/unfocus` per scollegare il thread.

    Configurazione richiesta:

    - Valori predefiniti globali: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Vincolo automatico all'avvio: imposta `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Docs: [Sotto-agenti](/it/tools/subagents), [Discord](/it/channels/discord), [Riferimento di configurazione](/it/gateway/configuration-reference), [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Un sotto-agente ha finito, ma l'aggiornamento di completamento è arrivato nel posto sbagliato o non è mai stato pubblicato. Cosa devo controllare?">
    Controlla prima il percorso richiedente risolto:

    - La consegna del sotto-agente in modalità completamento preferisce qualsiasi thread vincolato o percorso di conversazione quando esiste.
    - Se l'origine del completamento contiene solo un canale, OpenClaw ripiega sul percorso memorizzato della sessione richiedente (`lastChannel` / `lastTo` / `lastAccountId`), così la consegna diretta può comunque riuscire.
    - Se non esiste né un percorso vincolato né un percorso memorizzato utilizzabile, la consegna diretta può fallire e il risultato ripiega invece sulla consegna in coda della sessione, senza pubblicare subito in chat.
    - Destinazioni non valide o obsolete possono comunque forzare il ripiego sulla coda o il fallimento finale della consegna.
    - Se l'ultima risposta visibile dell'assistente figlio è l'esatto token silenzioso `NO_REPLY` / `no_reply`, oppure esattamente `ANNOUNCE_SKIP`, OpenClaw sopprime intenzionalmente l'annuncio invece di pubblicare progressi precedenti ormai obsoleti.
    - Se il figlio è andato in timeout dopo sole chiamate agli strumenti, l'annuncio può condensarle in un breve riepilogo di avanzamento parziale invece di riprodurre l'output grezzo degli strumenti.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Docs: [Sotto-agenti](/it/tools/subagents), [Attività in background](/it/automation/tasks), [Strumenti di sessione](/it/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o i promemoria non scattano. Cosa devo controllare?">
    Cron viene eseguito dentro il processo Gateway. Se il Gateway non è in esecuzione continuativamente,
    i processi pianificati non verranno eseguiti.

    Checklist:

    - Conferma che cron sia abilitato (`cron.enabled`) e che `OPENCLAW_SKIP_CRON` non sia impostato.
    - Verifica che il Gateway sia in esecuzione 24/7 (senza sospensioni/riavvii).
    - Verifica le impostazioni del fuso orario per il processo (`--tz` rispetto al fuso orario dell'host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Docs: [Processi Cron](/it/automation/cron-jobs), [Automazione e attività](/it/automation).

  </Accordion>

  <Accordion title="Cron è stato eseguito, ma non è stato inviato nulla al canale. Perché?">
    Controlla prima la modalità di recapito:

    - `--no-deliver` / `delivery.mode: "none"` significa che non è previsto alcun invio di fallback del runner.
    - Un destinatario di annuncio mancante o non valido (`channel` / `to`) significa che il runner ha saltato il recapito in uscita.
    - Errori di autenticazione del canale (`unauthorized`, `Forbidden`) significano che il runner ha provato a recapitare, ma le credenziali lo hanno bloccato.
    - Un risultato isolato silenzioso (solo `NO_REPLY` / `no_reply`) viene trattato come intenzionalmente non recapitabile, quindi il runner sopprime anche il recapito di fallback in coda.

    Per i processi Cron isolati, l'agente può comunque inviare direttamente con lo strumento `message`
    quando è disponibile un percorso chat. `--announce` controlla solo il percorso di
    fallback del runner per il testo finale che l'agente non ha già inviato.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Processi Cron](/it/automation/cron-jobs), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Perché un'esecuzione Cron isolata ha cambiato modello o ha riprovato una volta?">
    Di solito è il percorso di cambio modello live, non una pianificazione duplicata.

    Cron isolato può persistere un passaggio di consegne del modello a runtime e riprovare quando
    l'esecuzione attiva genera `LiveSessionModelSwitchError`. Il nuovo tentativo mantiene il
    provider/modello cambiato e, se il cambio includeva un nuovo override del profilo di autenticazione,
    Cron persiste anche quello prima di riprovare.

    Regole di selezione correlate:

    - L'override del modello dell'hook Gmail ha la precedenza quando applicabile.
    - Poi `model` per processo.
    - Poi qualsiasi override del modello di sessione Cron memorizzato.
    - Poi la normale selezione del modello agente/predefinito.

    Il ciclo di nuovo tentativo è limitato. Dopo il tentativo iniziale più 2 nuovi tentativi di cambio,
    Cron interrompe invece di continuare all'infinito.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Processi Cron](/it/automation/cron-jobs), [CLI Cron](/it/cli/cron).

  </Accordion>

  <Accordion title="Come installo Skills su Linux?">
    Usa i comandi nativi `openclaw skills` oppure inserisci Skills nel tuo workspace. L'interfaccia Skills di macOS non è disponibile su Linux.
    Sfoglia Skills su [https://clawhub.ai](https://clawhub.ai).

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

    Il comando nativo `openclaw skills install` scrive nella directory `skills/`
    del workspace attivo. Installa la CLI separata `clawhub` solo se vuoi pubblicare o
    sincronizzare le tue Skills. Per installazioni condivise tra agenti, metti la Skill in
    `~/.openclaw/skills` e usa `agents.defaults.skills` o
    `agents.list[].skills` se vuoi limitare quali agenti possono vederla.

  </Accordion>

  <Accordion title="OpenClaw può eseguire attività secondo una pianificazione o continuamente in background?">
    Sì. Usa lo scheduler del Gateway:

    - **Processi Cron** per attività pianificate o ricorrenti (persistono tra i riavvii).
    - **Heartbeat** per controlli periodici della "sessione principale".
    - **Processi isolati** per agenti autonomi che pubblicano riepiloghi o recapitano alle chat.

    Documentazione: [Processi Cron](/it/automation/cron-jobs), [Automazione e attività](/it/automation),
    [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso eseguire Skills disponibili solo su Apple macOS da Linux?">
    Non direttamente. Le Skills macOS sono controllate da `metadata.openclaw.os` più i binari richiesti, e le Skills compaiono nel prompt di sistema solo quando sono idonee sull'**host Gateway**. Su Linux, Skills disponibili solo per `darwin` (come `apple-notes`, `apple-reminders`, `things-mac`) non verranno caricate a meno che tu non sovrascriva il controllo.

    Hai tre modelli supportati:

    **Opzione A - esegui il Gateway su un Mac (la più semplice).**
    Esegui il Gateway dove esistono i binari macOS, poi connettiti da Linux in [modalità remota](#gateway-ports-already-running-and-remote-mode) o tramite Tailscale. Le Skills si caricano normalmente perché l'host Gateway è macOS.

    **Opzione B - usa un nodo macOS (senza SSH).**
    Esegui il Gateway su Linux, abbina un nodo macOS (app della barra dei menu) e imposta **Node Run Commands** su "Always Ask" o "Always Allow" sul Mac. OpenClaw può trattare le Skills disponibili solo su macOS come idonee quando i binari richiesti esistono sul nodo. L'agente esegue quelle Skills tramite lo strumento `nodes`. Se scegli "Always Ask", approvare "Always Allow" nel prompt aggiunge quel comando alla allowlist.

    **Opzione C - proxy dei binari macOS tramite SSH (avanzata).**
    Mantieni il Gateway su Linux, ma fai risolvere i binari CLI richiesti a wrapper SSH che vengono eseguiti su un Mac. Poi sovrascrivi la Skill per consentire Linux, così resta idonea.

    1. Crea un wrapper SSH per il binario (esempio: `memo` per Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Metti il wrapper in `PATH` sull'host Linux (ad esempio `~/bin/memo`).
    3. Sovrascrivi i metadati della Skill (workspace o `~/.openclaw/skills`) per consentire Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Avvia una nuova sessione in modo che lo snapshot delle Skills venga aggiornato.

  </Accordion>

  <Accordion title="Avete un'integrazione Notion o HeyGen?">
    Oggi non è integrata.

    Opzioni:

    - **Skill / Plugin personalizzato:** ideale per un accesso API affidabile (Notion/HeyGen hanno entrambi API).
    - **Automazione del browser:** funziona senza codice, ma è più lenta e più fragile.

    Se vuoi mantenere il contesto per cliente (flussi di lavoro di agenzia), un modello semplice è:

    - Una pagina Notion per cliente (contesto + preferenze + lavoro attivo).
    - Chiedi all'agente di recuperare quella pagina all'inizio di una sessione.

    Se vuoi un'integrazione nativa, apri una richiesta di funzionalità o crea una Skill
    rivolta a quelle API.

    Installa Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Le installazioni native finiscono nella directory `skills/` del workspace attivo. Per Skills condivise tra agenti, inseriscile in `~/.openclaw/skills/<name>/SKILL.md`. Se solo alcuni agenti devono vedere un'installazione condivisa, configura `agents.defaults.skills` o `agents.list[].skills`. Alcune Skills si aspettano binari installati tramite Homebrew; su Linux questo significa Linuxbrew (vedi la voce delle FAQ di Homebrew su Linux sopra). Vedi [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config) e [ClawHub](/it/tools/clawhub).

  </Accordion>

  <Accordion title="Come uso il mio Chrome già connesso con OpenClaw?">
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

    - le azioni sono guidate da ref, non da selettori CSS
    - i caricamenti richiedono `ref` / `inputRef` e attualmente supportano un file alla volta
    - `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP raw

  </Accordion>
</AccordionGroup>

## Sandboxing e memoria

<AccordionGroup>
  <Accordion title="Esiste un documento dedicato al sandboxing?">
    Sì. Vedi [Sandboxing](/it/gateway/sandboxing). Per la configurazione specifica di Docker (Gateway completo in Docker o immagini sandbox), vedi [Docker](/it/install/docker).
  </Accordion>

  <Accordion title="Docker sembra limitato: come abilito tutte le funzionalità?">
    L'immagine predefinita dà priorità alla sicurezza e viene eseguita come utente `node`, quindi non
    include pacchetti di sistema, Homebrew o browser in bundle. Per una configurazione più completa:

    - Persiste `/home/node` con `OPENCLAW_HOME_VOLUME` in modo che le cache sopravvivano.
    - Integra le dipendenze di sistema nell'immagine con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installa i browser Playwright tramite la CLI in bundle:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Imposta `PLAYWRIGHT_BROWSERS_PATH` e assicurati che il percorso sia persistito.

    Documentazione: [Docker](/it/install/docker), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="Posso mantenere personali i messaggi diretti ma rendere pubblici/sandboxed i gruppi con un solo agente?">
    Sì, se il traffico privato è costituito da **DM** e il traffico pubblico da **gruppi**.

    Usa `agents.defaults.sandbox.mode: "non-main"` in modo che le sessioni di gruppo/canale (chiavi non-main) vengano eseguite nel backend sandbox configurato, mentre la sessione DM principale resta sull'host. Docker è il backend predefinito se non ne scegli uno. Poi limita quali strumenti sono disponibili nelle sessioni sandboxed tramite `tools.sandbox.tools`.

    Guida alla configurazione + configurazione di esempio: [Gruppi: DM personali + gruppi pubblici](/it/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Riferimento chiave di configurazione: [Configurazione Gateway](/it/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Come collego una cartella host nel sandbox?">
    Imposta `agents.defaults.sandbox.docker.binds` su `["host:path:mode"]` (ad esempio, `"/home/user/src:/src:ro"`). I bind globali e per agente vengono uniti; i bind per agente vengono ignorati quando `scope: "shared"`. Usa `:ro` per qualsiasi cosa sensibile e ricorda che i bind aggirano le barriere del filesystem del sandbox.

    OpenClaw valida le sorgenti dei bind sia rispetto al percorso normalizzato sia rispetto al percorso canonico risolto attraverso l'antenato esistente più profondo. Questo significa che le fughe tramite genitori symlink falliscono comunque in modo chiuso anche quando l'ultimo segmento del percorso non esiste ancora, e i controlli allowed-root si applicano ancora dopo la risoluzione dei symlink.

    Vedi [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs policy degli strumenti vs elevato](/it/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) per esempi e note di sicurezza.

  </Accordion>

  <Accordion title="Come funziona la memoria?">
    La memoria di OpenClaw è semplicemente costituita da file Markdown nel workspace dell'agente:

    - Note giornaliere in `memory/YYYY-MM-DD.md`
    - Note curate a lungo termine in `MEMORY.md` (solo sessioni principali/private)

    OpenClaw esegue anche uno **svuotamento silenzioso della memoria pre-compaction** per ricordare al modello
    di scrivere note durature prima della compaction automatica. Questo viene eseguito solo quando il workspace
    è scrivibile (i sandbox in sola lettura lo saltano). Vedi [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="La memoria continua a dimenticare le cose. Come faccio a renderle persistenti?">
    Chiedi al bot di **scrivere il fatto in memoria**. Le note a lungo termine vanno in `MEMORY.md`,
    il contesto a breve termine va in `memory/YYYY-MM-DD.md`.

    Questa è ancora un'area che stiamo migliorando. Aiuta ricordare al modello di salvare i ricordi;
    saprà cosa fare. Se continua a dimenticare, verifica che il Gateway stia usando lo stesso
    workspace a ogni esecuzione.

    Documentazione: [Memoria](/it/concepts/memory), [Workspace agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La memoria persiste per sempre? Quali sono i limiti?">
    I file di memoria vivono su disco e persistono finché non li elimini. Il limite è lo
    spazio di archiviazione, non il modello. Il **contesto della sessione** è comunque limitato dalla finestra
    di contesto del modello, quindi le conversazioni lunghe possono essere compattate o troncate. Ecco perché
    esiste la ricerca nella memoria: riporta nel contesto solo le parti rilevanti.

    Documentazione: [Memoria](/it/concepts/memory), [Contesto](/it/concepts/context).

  </Accordion>

  <Accordion title="La ricerca nella memoria semantica richiede una chiave API OpenAI?">
    Solo se usi gli **embeddings OpenAI**. Codex OAuth copre chat/completions e
    **non** concede l'accesso agli embeddings, quindi **accedere con Codex (OAuth o il
    login della CLI Codex)** non aiuta per la ricerca nella memoria semantica. Gli embeddings OpenAI
    richiedono comunque una vera chiave API (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Se non imposti esplicitamente un provider, OpenClaw seleziona automaticamente un provider quando
    riesce a risolvere una chiave API (profili di autenticazione, `models.providers.*.apiKey` o variabili d'ambiente).
    Preferisce OpenAI se viene risolta una chiave OpenAI, altrimenti Gemini se viene
    risolta una chiave Gemini, poi Voyage, poi Mistral. Se non è disponibile alcuna chiave remota, la ricerca nella
    memoria resta disabilitata finché non la configuri. Se hai configurato e reso presente
    un percorso di modello locale, OpenClaw
    preferisce `local`. Ollama è supportato quando imposti esplicitamente
    `memorySearch.provider = "ollama"`.

    Se preferisci restare in locale, imposta `memorySearch.provider = "local"` (e facoltativamente
    `memorySearch.fallback = "none"`). Se vuoi gli embeddings Gemini, imposta
    `memorySearch.provider = "gemini"` e fornisci `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Supportiamo modelli di embedding **OpenAI, Gemini, Voyage, Mistral, Ollama o locali**
    - consulta [Memoria](/it/concepts/memory) per i dettagli di configurazione.

  </Accordion>
</AccordionGroup>

## Dove risiedono gli elementi su disco

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
    Tutto risiede sotto `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`):

    | Percorso                                                        | Scopo                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configurazione principale (JSON5)                                  |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Importazione OAuth legacy (copiata nei profili di autenticazione al primo utilizzo) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profili di autenticazione (OAuth, chiavi API e `keyRef`/`tokenRef` facoltativi) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload segreto facoltativo basato su file per provider SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File di compatibilità legacy (voci statiche `api_key` ripulite)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stato del provider (ad es. `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stato per agente (agentDir + sessioni)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Cronologia e stato delle conversazioni (per agente)                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadati delle sessioni (per agente)                               |

    Percorso legacy per agente singolo: `~/.openclaw/agent/*` (migrato da `openclaw doctor`).

    Il tuo **workspace** (AGENTS.md, file di memoria, Skills, ecc.) è separato e configurato tramite `agents.defaults.workspace` (predefinito: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Dove devono risiedere AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Questi file risiedono nel **workspace dell'agente**, non in `~/.openclaw`.

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

    Suggerimento: se vuoi un comportamento o una preferenza durevole, chiedi al bot di **scriverlo in
    AGENTS.md o MEMORY.md** invece di fare affidamento sulla cronologia della chat.

    Consulta [Workspace dell'agente](/it/concepts/agent-workspace) e [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="Strategia di backup consigliata">
    Metti il tuo **workspace dell'agente** in un repository git **privato** ed eseguine il backup in un luogo
    privato (per esempio GitHub privato). Questo acquisisce memoria + file AGENTS/SOUL/USER
    e ti consente di ripristinare la "mente" dell'assistente in seguito.

    **Non** committare nulla sotto `~/.openclaw` (credenziali, sessioni, token o payload di segreti cifrati).
    Se hai bisogno di un ripristino completo, esegui il backup sia del workspace sia della directory di stato
    separatamente (vedi la domanda sulla migrazione sopra).

    Documentazione: [Workspace dell'agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Come disinstallo completamente OpenClaw?">
    Consulta la guida dedicata: [Disinstallazione](/it/install/uninstall).
  </Accordion>

  <Accordion title="Gli agenti possono lavorare fuori dal workspace?">
    Sì. Il workspace è la **cwd predefinita** e l'ancora della memoria, non una sandbox rigida.
    I percorsi relativi si risolvono all'interno del workspace, ma i percorsi assoluti possono accedere ad altre
    posizioni dell'host a meno che il sandboxing non sia abilitato. Se ti serve isolamento, usa
    [`agents.defaults.sandbox`](/it/gateway/sandboxing) o le impostazioni sandbox per agente. Se
    vuoi che un repository sia la directory di lavoro predefinita, punta il
    `workspace` di quell'agente alla radice del repository. Il repository OpenClaw è solo codice sorgente; mantieni il
    workspace separato a meno che tu non voglia intenzionalmente che l'agente lavori al suo interno.

    Esempio (repository come cwd predefinita):

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

  <Accordion title="Modalità remota: dov'è lo store delle sessioni?">
    Lo stato delle sessioni appartiene all'**host gateway**. Se sei in modalità remota, lo store delle sessioni che ti interessa è sulla macchina remota, non sul tuo laptop locale. Consulta [Gestione delle sessioni](/it/concepts/session).
  </Accordion>
</AccordionGroup>

## Basi della configurazione

<AccordionGroup>
  <Accordion title="Che formato ha la configurazione? Dove si trova?">
    OpenClaw legge una configurazione **JSON5** facoltativa da `$OPENCLAW_CONFIG_PATH` (predefinito: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se il file manca, usa valori predefiniti abbastanza sicuri (incluso un workspace predefinito di `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ho impostato gateway.bind: "lan" (o "tailnet") e ora nulla è in ascolto / la UI dice non autorizzato'>
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
    - Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modo chiuso (nessuna mascheratura tramite fallback remoto).
    - Le configurazioni della Control UI con segreto condiviso si autenticano tramite `connect.params.auth.token` o `connect.params.auth.password` (archiviati nelle impostazioni app/UI). Le modalità con identità come Tailscale Serve o `trusted-proxy` usano invece gli header della richiesta. Evita di mettere segreti condivisi negli URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, i reverse proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito e una voce loopback in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Perché ora mi serve un token su localhost?">
    OpenClaw applica l'autenticazione gateway per impostazione predefinita, incluso il loopback. Nel percorso predefinito normale questo significa autenticazione con token: se non è configurato alcun percorso di autenticazione esplicito, l'avvio del gateway risolve in modalità token e ne genera automaticamente uno, salvandolo in `gateway.auth.token`, quindi **i client WS locali devono autenticarsi**. Questo impedisce ad altri processi locali di chiamare il Gateway.

    Se preferisci un percorso di autenticazione diverso, puoi scegliere esplicitamente la modalità password (oppure, per reverse proxy identity-aware, `trusted-proxy`). Se vuoi **davvero** un loopback aperto, imposta esplicitamente `gateway.auth.mode: "none"` nella tua configurazione. Doctor può generare un token per te in qualsiasi momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Devo riavviare dopo aver modificato la configurazione?">
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

    - `off`: nasconde il testo dello slogan ma mantiene la riga titolo/versione del banner.
    - `default`: usa `All your chats, one OpenClaw.` ogni volta.
    - `random`: slogan divertenti/stagionali a rotazione (comportamento predefinito).
    - Se non vuoi alcun banner, imposta la variabile d'ambiente `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Come abilito la ricerca web (e il recupero web)?">
    `web_fetch` funziona senza una chiave API. `web_search` dipende dal provider
    selezionato:

    - I provider basati su API come Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity e Tavily richiedono la loro normale configurazione della chiave API.
    - Ollama Web Search non richiede chiavi, ma usa l'host Ollama configurato e richiede `ollama signin`.
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

    La configurazione web-search specifica del provider ora si trova in `plugins.entries.<plugin>.config.webSearch.*`.
    I percorsi provider legacy `tools.web.search.*` vengono ancora caricati temporaneamente per compatibilita, ma non devono essere usati per le nuove configurazioni.
    La configurazione di fallback web-fetch di Firecrawl si trova in `plugins.entries.firecrawl.config.webFetch.*`.

    Note:

    - Se usi allowlist, aggiungi `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` e abilitato per impostazione predefinita (a meno che non sia disabilitato esplicitamente).
    - Se `tools.web.fetch.provider` viene omesso, OpenClaw rileva automaticamente il primo provider di fallback per fetch pronto dalle credenziali disponibili. Attualmente il provider incluso e Firecrawl.
    - I daemon leggono le variabili env da `~/.openclaw/.env` (o dall'ambiente del servizio).

    Documentazione: [Strumenti web](/it/tools/web).

  </Accordion>

  <Accordion title="config.apply ha cancellato la mia configurazione. Come posso recuperarla ed evitarlo?">
    `config.apply` sostituisce **l'intera configurazione**. Se invii un oggetto parziale, tutto
    il resto viene rimosso.

    La versione attuale di OpenClaw protegge da molte sovrascritture accidentali:

    - Le scritture della configurazione gestite da OpenClaw convalidano l'intera configurazione dopo la modifica prima di scrivere.
    - Le scritture non valide o distruttive gestite da OpenClaw vengono rifiutate e salvate come `openclaw.json.rejected.*`.
    - Se una modifica diretta interrompe l'avvio o il ricaricamento a caldo, il Gateway ripristina l'ultima configurazione valida nota e salva il file rifiutato come `openclaw.json.clobbered.*`.
    - L'agente principale riceve un avviso di avvio dopo il recupero, cosi non riscrive alla cieca la configurazione errata.

    Recupero:

    - Controlla `openclaw logs --follow` per `Config auto-restored from last-known-good`, `Config write rejected:` o `config reload restored last-known-good config`.
    - Ispeziona il file `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` piu recente accanto alla configurazione attiva.
    - Mantieni la configurazione ripristinata attiva se funziona, quindi copia di nuovo solo le chiavi desiderate con `openclaw config set` o `config.patch`.
    - Esegui `openclaw config validate` e `openclaw doctor`.
    - Se non hai un ultimo stato valido noto o un payload rifiutato, ripristina da backup, oppure riesegui `openclaw doctor` e riconfigura canali/modelli.
    - Se questo comportamento era inatteso, segnala un bug e includi l'ultima configurazione nota o qualsiasi backup.
    - Un agente di codifica locale spesso puo ricostruire una configurazione funzionante dai log o dalla cronologia.

    Come evitarlo:

    - Usa `openclaw config set` per piccole modifiche.
    - Usa `openclaw configure` per modifiche interattive.
    - Usa prima `config.schema.lookup` quando non sei sicuro di un percorso esatto o della forma di un campo; restituisce un nodo di schema superficiale piu riepiloghi immediati dei figli per l'approfondimento.
    - Usa `config.patch` per modifiche RPC parziali; riserva `config.apply` solo alla sostituzione completa della configurazione.
    - Se usi lo strumento `gateway` riservato al proprietario da un'esecuzione dell'agente, rifiutera comunque le scritture su `tools.exec.ask` / `tools.exec.security` (inclusi gli alias legacy `tools.bash.*` che si normalizzano agli stessi percorsi exec protetti).

    Documentazione: [Configurazione](/it/cli/config), [Configurare](/it/cli/configure), [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/it/gateway/doctor).

  </Accordion>

  <Accordion title="Come posso eseguire un Gateway centrale con worker specializzati su dispositivi diversi?">
    Il modello comune e **un Gateway** (ad esempio Raspberry Pi) piu **nodi** e **agenti**:

    - **Gateway (centrale):** gestisce canali (Signal/WhatsApp), routing e sessioni.
    - **Nodi (dispositivi):** Mac/iOS/Android si connettono come periferiche ed espongono strumenti locali (`system.run`, `canvas`, `camera`).
    - **Agenti (worker):** cervelli/workspace separati per ruoli speciali (ad esempio "Operazioni Hetzner", "Dati personali").
    - **Sub-agenti:** avviano lavoro in background da un agente principale quando vuoi parallelismo.
    - **TUI:** connettiti al Gateway e passa tra agenti/sessioni.

    Documentazione: [Nodi](/it/nodes), [Accesso remoto](/it/gateway/remote), [Routing multi-agente](/it/concepts/multi-agent), [Sub-agenti](/it/tools/subagents), [TUI](/it/web/tui).

  </Accordion>

  <Accordion title="Il browser OpenClaw puo funzionare in modalita headless?">
    Si. E un'opzione di configurazione:

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

    Il valore predefinito e `false` (con interfaccia visibile). La modalita headless ha maggiori probabilita di attivare controlli anti-bot su alcuni siti. Vedi [Browser](/it/tools/browser).

    La modalita headless usa lo **stesso motore Chromium** e funziona per la maggior parte dell'automazione (moduli, clic, scraping, accessi). Le differenze principali:

    - Nessuna finestra del browser visibile (usa screenshot se ti servono elementi visivi).
    - Alcuni siti sono piu severi rispetto all'automazione in modalita headless (CAPTCHA, anti-bot).
      Ad esempio, X/Twitter spesso blocca le sessioni headless.

  </Accordion>

  <Accordion title="Come posso usare Brave per il controllo del browser?">
    Imposta `browser.executablePath` sul binario Brave (o su qualsiasi browser basato su Chromium) e riavvia il Gateway.
    Vedi gli esempi completi di configurazione in [Browser](/it/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway e nodi remoti

<AccordionGroup>
  <Accordion title="Come si propagano i comandi tra Telegram, il Gateway e i nodi?">
    I messaggi Telegram sono gestiti dal **Gateway**. Il Gateway esegue l'agente e
    solo dopo chiama i nodi tramite il **Gateway WebSocket** quando serve uno strumento del nodo:

    Telegram → Gateway → Agente → `node.*` → Nodo → Gateway → Telegram

    I nodi non vedono il traffico provider in ingresso; ricevono solo chiamate RPC del nodo.

  </Accordion>

  <Accordion title="Come puo il mio agente accedere al mio computer se il Gateway e ospitato da remoto?">
    Risposta breve: **abbina il tuo computer come nodo**. Il Gateway viene eseguito altrove, ma puo
    chiamare strumenti `node.*` (schermo, fotocamera, sistema) sulla tua macchina locale tramite il Gateway WebSocket.

    Configurazione tipica:

    1. Esegui il Gateway sull'host sempre attivo (VPS/server domestico).
    2. Metti l'host del Gateway + il tuo computer nella stessa tailnet.
    3. Assicurati che il Gateway WS sia raggiungibile (bind tailnet o tunnel SSH).
    4. Apri l'app macOS localmente e connettiti in modalita **Remoto tramite SSH** (o tailnet diretta)
       cosi puo registrarsi come nodo.
    5. Approva il nodo sul Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Non e richiesto un bridge TCP separato; i nodi si connettono tramite il Gateway WebSocket.

    Promemoria di sicurezza: abbinare un nodo macOS consente `system.run` su quella macchina. Abbina solo
    dispositivi di cui ti fidi e consulta [Sicurezza](/it/gateway/security).

    Documentazione: [Nodi](/it/nodes), [Protocollo Gateway](/it/gateway/protocol), [Modalita remota macOS](/it/platforms/mac/remote), [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Tailscale e connesso ma non ricevo risposte. E adesso?">
    Controlla le basi:

    - Gateway in esecuzione: `openclaw gateway status`
    - Stato del Gateway: `openclaw status`
    - Stato del canale: `openclaw channels status`

    Quindi verifica autenticazione e routing:

    - Se usi Tailscale Serve, assicurati che `gateway.auth.allowTailscale` sia impostato correttamente.
    - Se ti connetti tramite tunnel SSH, conferma che il tunnel locale sia attivo e punti alla porta corretta.
    - Conferma che le tue allowlist (DM o gruppo) includano il tuo account.

    Documentazione: [Tailscale](/it/gateway/tailscale), [Accesso remoto](/it/gateway/remote), [Canali](/it/channels).

  </Accordion>

  <Accordion title="Due istanze OpenClaw possono comunicare tra loro (locale + VPS)?">
    Si. Non esiste un bridge "da bot a bot" integrato, ma puoi collegarle in alcuni
    modi affidabili:

    **Il piu semplice:** usa un normale canale chat a cui entrambi i bot possano accedere (Telegram/Slack/WhatsApp).
    Fai inviare un messaggio dal Bot A al Bot B, quindi lascia che il Bot B risponda come al solito.

    **Bridge CLI (generico):** esegui uno script che chiama l'altro Gateway con
    `openclaw agent --message ... --deliver`, puntando a una chat in cui ascolta l'altro bot.
    Se un bot e su un VPS remoto, punta la tua CLI a quel Gateway remoto
    tramite SSH/Tailscale (vedi [Accesso remoto](/it/gateway/remote)).

    Schema di esempio (esegui da una macchina che puo raggiungere il Gateway di destinazione):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Suggerimento: aggiungi una protezione in modo che i due bot non entrino in un ciclo infinito (solo menzioni, allowlist
    di canale o una regola "non rispondere ai messaggi dei bot").

    Documentazione: [Accesso remoto](/it/gateway/remote), [CLI agente](/it/cli/agent), [Invio agente](/it/tools/agent-send).

  </Accordion>

  <Accordion title="Mi servono VPS separati per piu agenti?">
    No. Un Gateway puo ospitare piu agenti, ciascuno con il proprio workspace, impostazioni predefinite del modello
    e routing. Questa e la configurazione normale ed e molto piu economica e semplice che eseguire
    un VPS per agente.

    Usa VPS separati solo quando ti serve un isolamento forte (limiti di sicurezza) o configurazioni
    molto diverse che non vuoi condividere. Altrimenti, mantieni un solo Gateway e
    usa piu agenti o sub-agenti.

  </Accordion>

  <Accordion title="C'e un vantaggio nell'usare un nodo sul mio laptop personale invece di SSH da un VPS?">
    Si - i nodi sono il modo di prima classe per raggiungere il tuo laptop da un Gateway remoto, e
    sbloccano piu del solo accesso shell. Il Gateway viene eseguito su macOS/Linux (Windows tramite WSL2) ed e
    leggero (un piccolo VPS o una macchina di classe Raspberry Pi va bene; 4 GB di RAM sono sufficienti), quindi una configurazione comune
    e un host sempre attivo piu il tuo laptop come nodo.

    - **Nessun SSH in ingresso richiesto.** I nodi si connettono in uscita al Gateway WebSocket e usano l'abbinamento del dispositivo.
    - **Controlli di esecuzione piu sicuri.** `system.run` e protetto da allowlist/approvazioni del nodo su quel laptop.
    - **Piu strumenti del dispositivo.** I nodi espongono `canvas`, `camera` e `screen` oltre a `system.run`.
    - **Automazione locale del browser.** Mantieni il Gateway su un VPS, ma esegui Chrome localmente tramite un host nodo sul laptop, oppure collegati a Chrome locale sull'host tramite Chrome MCP.

    SSH va bene per l'accesso shell ad hoc, ma i nodi sono piu semplici per workflow continuativi degli agenti e
    automazione dei dispositivi.

    Documentazione: [Nodi](/it/nodes), [CLI nodi](/it/cli/nodes), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="I nodi eseguono un servizio Gateway?">
    No. Deve essere eseguito solo **un gateway** per host, a meno che tu non esegua intenzionalmente profili isolati (vedi [Gateway multipli](/it/gateway/multiple-gateways)). I nodi sono periferiche che si connettono
    al Gateway (nodi iOS/Android, o "modalita nodo" macOS nell'app della barra dei menu). Per host nodo headless
    e controllo CLI, vedi [CLI host Node](/it/cli/node).

    E richiesto un riavvio completo per le modifiche a `gateway`, `discovery` e `canvasHost`.

  </Accordion>

  <Accordion title="Esiste un modo API / RPC per applicare la configurazione?">
    Si.

    - `config.schema.lookup`: ispeziona un sottoalbero della configurazione con il suo nodo di schema superficiale, l'indicazione UI corrispondente e i riepiloghi immediati dei figli prima di scrivere
    - `config.get`: recupera lo snapshot corrente + hash
    - `config.patch`: aggiornamento parziale sicuro (preferito per la maggior parte delle modifiche RPC); ricarica a caldo quando possibile e riavvia quando richiesto
    - `config.apply`: convalida + sostituisce la configurazione completa; ricarica a caldo quando possibile e riavvia quando richiesto
    - Lo strumento runtime `gateway` riservato al proprietario continua a rifiutare la riscrittura di `tools.exec.ask` / `tools.exec.security`; gli alias legacy `tools.bash.*` si normalizzano agli stessi percorsi exec protetti

  </Accordion>

  <Accordion title="Configurazione minima sensata per una prima installazione">
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
    4. **Usa il nome host della tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se vuoi la Control UI senza SSH, usa Tailscale Serve sulla VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Questo mantiene il Gateway associato al loopback ed espone HTTPS tramite Tailscale. Vedi [Tailscale](/it/gateway/tailscale).

  </Accordion>

  <Accordion title="Come connetto un nodo Mac a un Gateway remoto (Tailscale Serve)?">
    Serve espone la **Gateway Control UI + WS**. I nodi si connettono tramite lo stesso endpoint Gateway WS.

    Configurazione consigliata:

    1. **Assicurati che la VPS + il Mac siano sulla stessa tailnet**.
    2. **Usa l'app macOS in modalità remota** (il target SSH può essere il nome host della tailnet).
       L'app creerà un tunnel per la porta del Gateway e si connetterà come nodo.
    3. **Approva il nodo** sul Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentazione: [Protocollo Gateway](/it/gateway/protocol), [Rilevamento](/it/gateway/discovery), [Modalità remota macOS](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Devo installarlo su un secondo portatile o aggiungere solo un nodo?">
    Se ti servono solo **strumenti locali** (schermo/fotocamera/exec) sul secondo portatile, aggiungilo come
    **nodo**. Questo mantiene un solo Gateway ed evita configurazioni duplicate. Gli strumenti dei nodi locali sono
    attualmente disponibili solo su macOS, ma prevediamo di estenderli ad altri sistemi operativi.

    Installa un secondo Gateway solo quando ti serve **isolamento rigido** o due bot completamente separati.

    Documentazione: [Nodi](/it/nodes), [CLI dei nodi](/it/cli/nodes), [Gateway multipli](/it/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variabili d'ambiente e caricamento .env

<AccordionGroup>
  <Accordion title="Come carica OpenClaw le variabili d'ambiente?">
    OpenClaw legge le variabili d'ambiente dal processo padre (shell, launchd/systemd, CI, ecc.) e carica inoltre:

    - `.env` dalla directory di lavoro corrente
    - un `.env` globale di fallback da `~/.openclaw/.env` (ossia `$OPENCLAW_STATE_DIR/.env`)

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

  <Accordion title="Ho avviato il Gateway tramite il servizio e le mie variabili d'ambiente sono sparite. Ora che faccio?">
    Due correzioni comuni:

    1. Inserisci le chiavi mancanti in `~/.openclaw/.env` così vengono raccolte anche quando il servizio non eredita l'ambiente della tua shell.
    2. Abilita l'importazione dalla shell (comodità opzionale):

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

    Questo esegue la tua shell di login e importa solo le chiavi previste mancanti (senza mai sovrascrivere). Variabili d'ambiente equivalenti:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ho impostato COPILOT_GITHUB_TOKEN, ma lo stato dei modelli mostra "Ambiente shell: disattivato." Perché?'>
    `openclaw models status` indica se l'**importazione dell'ambiente della shell** è abilitata. "Ambiente shell: disattivato"
    **non** significa che le tue variabili d'ambiente siano mancanti: significa solo che OpenClaw non caricherà
    automaticamente la tua shell di login.

    Se il Gateway è eseguito come servizio (launchd/systemd), non erediterà l'ambiente
    della tua shell. Risolvi in uno di questi modi:

    1. Inserisci il token in `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oppure abilita l'importazione dalla shell (`env.shellEnv.enabled: true`).
    3. Oppure aggiungilo al blocco `env` della configurazione (si applica solo se mancante).

    Poi riavvia il Gateway e ricontrolla:

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
    Le sessioni possono scadere dopo `session.idleMinutes`, ma questo è **disabilitato per impostazione predefinita** (predefinito **0**).
    Impostalo su un valore positivo per abilitare la scadenza per inattività. Quando è abilitata, il **messaggio successivo**
    dopo il periodo di inattività avvia un nuovo ID sessione per quella chiave chat.
    Questo non elimina le trascrizioni: avvia solo una nuova sessione.

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
    e diversi agenti worker con i propri workspace e modelli.

    Detto questo, è meglio considerarlo un **esperimento divertente**. Consuma molti token ed è spesso
    meno efficiente rispetto all'uso di un solo bot con sessioni separate. Il modello tipico che
    immaginiamo è un bot con cui parli, con sessioni diverse per lavori paralleli. Quel
    bot può anche generare sub-agenti quando necessario.

    Documentazione: [Routing multi-agente](/it/concepts/multi-agent), [Sub-agenti](/it/tools/subagents), [CLI degli agenti](/it/cli/agents).

  </Accordion>

  <Accordion title="Perché il contesto è stato troncato a metà attività? Come lo evito?">
    Il contesto della sessione è limitato dalla finestra del modello. Chat lunghe, output di strumenti estesi o molti
    file possono attivare compaction o troncamento.

    Cosa aiuta:

    - Chiedi al bot di riassumere lo stato corrente e scriverlo in un file.
    - Usa `/compact` prima di attività lunghe e `/new` quando cambi argomento.
    - Mantieni il contesto importante nel workspace e chiedi al bot di rileggerlo.
    - Usa sub-agenti per lavori lunghi o paralleli così la chat principale resta più piccola.
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

    Poi riesegui la configurazione:

    ```bash
    openclaw onboard --install-daemon
    ```

    Note:

    - L'onboarding offre anche **Reset** se rileva una configurazione esistente. Vedi [Onboarding (CLI)](/it/start/wizard).
    - Se hai usato profili (`--profile` / `OPENCLAW_PROFILE`), reimposta ogni directory di stato (i valori predefiniti sono `~/.openclaw-<profile>`).
    - Reset di sviluppo: `openclaw gateway --dev --reset` (solo sviluppo; cancella configurazione di sviluppo + credenziali + sessioni + workspace).

  </Accordion>

  <Accordion title='Ricevo errori "contesto troppo grande": come reimposto o compatto?'>
    Usa una di queste opzioni:

    - **Compatta** (mantiene la conversazione ma riassume i turni più vecchi):

      ```
      /compact
      ```

      oppure `/compact <instructions>` per guidare il riassunto.

    - **Reset** (nuovo ID sessione per la stessa chiave chat):

      ```
      /new
      /reset
      ```

    Se continua a succedere:

    - Abilita o regola la **potatura delle sessioni** (`agents.defaults.contextPruning`) per ridurre l'output vecchio degli strumenti.
    - Usa un modello con una finestra di contesto più ampia.

    Documentazione: [Compaction](/it/concepts/compaction), [Potatura delle sessioni](/it/concepts/session-pruning), [Gestione delle sessioni](/it/concepts/session).

  </Accordion>

  <Accordion title='Perché vedo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Questo è un errore di validazione del provider: il modello ha emesso un blocco `tool_use` senza l'`input` richiesto.
    Di solito significa che la cronologia della sessione è obsoleta o corrotta (spesso dopo thread lunghi
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
    markdown come `# Heading`), OpenClaw salta l'esecuzione Heartbeat per risparmiare chiamate API.
    Se il file manca, Heartbeat viene comunque eseguito e il modello decide cosa fare.

    Le sostituzioni per agente usano `agents.list[].heartbeat`. Documentazione: [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title='Devo aggiungere un "account bot" a un gruppo WhatsApp?'>
    No. OpenClaw viene eseguito sul **tuo account**, quindi se sei nel gruppo, OpenClaw può vederlo.
    Per impostazione predefinita, le risposte nei gruppi sono bloccate finché non autorizzi i mittenti (`groupPolicy: "allowlist"`).

    Se vuoi che solo **tu** possa attivare risposte nel gruppo:

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

    Documentazione: [WhatsApp](/it/channels/whatsapp), [Directory](/it/cli/directory), [Log](/it/cli/logs).

  </Accordion>

  <Accordion title="Perché OpenClaw non risponde in un gruppo?">
    Due cause comuni:

    - Il gating su menzione è attivo (predefinito). Devi @menzionare il bot (o corrispondere a `mentionPatterns`).
    - Hai configurato `channels.whatsapp.groups` senza `"*"` e il gruppo non è in allowlist.

    Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).

  </Accordion>

  <Accordion title="Gruppi/thread condividono il contesto con i DM?">
    Le chat dirette convergono sulla sessione principale per impostazione predefinita. Gruppi/canali hanno le proprie chiavi di sessione, e gli argomenti Telegram / i thread Discord sono sessioni separate. Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).
  </Accordion>

  <Accordion title="Quanti workspace e agenti posso creare?">
    Nessun limite rigido. Decine (anche centinaia) vanno bene, ma fai attenzione a:

    - **Crescita del disco:** sessioni + trascrizioni si trovano sotto `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo dei token:** più agenti significano più uso concorrente del modello.
    - **Sovraccarico operativo:** profili di autenticazione, workspace e routing dei canali per agente.

    Suggerimenti:

    - Mantieni un workspace **attivo** per agente (`agents.defaults.workspace`).
    - Pota le vecchie sessioni (elimina JSONL o voci dello store) se il disco cresce.
    - Usa `openclaw doctor` per individuare workspace residui e disallineamenti dei profili.

  </Accordion>

  <Accordion title="Posso eseguire più bot o chat contemporaneamente (Slack), e come dovrei configurarli?">
    Sì. Usa **l’instradamento multi-agente** per eseguire più agenti isolati e instradare i messaggi in ingresso per
    canale/account/peer. Slack è supportato come canale e può essere associato ad agenti specifici.

    L’accesso al browser è potente, ma non può "fare qualsiasi cosa possa fare un essere umano": anti-bot, CAPTCHA e MFA possono
    comunque bloccare l’automazione. Per il controllo del browser più affidabile, usa Chrome MCP locale sull’host,
    oppure usa CDP sulla macchina che esegue effettivamente il browser.

    Configurazione consigliata:

    - Host Gateway sempre attivo (VPS/Mac mini).
    - Un agente per ruolo (associazioni).
    - Canale/i Slack associato/i a quegli agenti.
    - Browser locale tramite Chrome MCP o un node quando necessario.

    Documentazione: [Instradamento multi-agente](/it/concepts/multi-agent), [Slack](/it/channels/slack),
    [Browser](/it/tools/browser), [Node](/it/nodes).

  </Accordion>
</AccordionGroup>

## Modelli, failover e profili di autenticazione

Domande e risposte sui modelli: valori predefiniti, selezione, alias, cambio, failover, profili di autenticazione,
sono nella [FAQ sui modelli](/it/help/faq-models).

## Gateway: porte, "già in esecuzione" e modalità remota

<AccordionGroup>
  <Accordion title="Quale porta usa il Gateway?">
    `gateway.port` controlla l’unica porta multiplexata per WebSocket + HTTP (Control UI, hook, ecc.).

    Precedenza:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Perché openclaw gateway status dice "Runtime: running" ma "Connectivity probe: failed"?'>
    Perché "running" è la vista del **supervisore** (launchd/systemd/schtasks). Il controllo di connettività è la CLI che si connette effettivamente al WebSocket del Gateway.

    Usa `openclaw gateway status` e fidati di queste righe:

    - `Probe target:` (l’URL che il controllo ha effettivamente usato)
    - `Listening:` (ciò che è effettivamente associato alla porta)
    - `Last gateway error:` (causa principale comune quando il processo è attivo ma la porta non è in ascolto)

  </Accordion>

  <Accordion title='Perché openclaw gateway status mostra "Config (cli)" e "Config (service)" diversi?'>
    Stai modificando un file di configurazione mentre il servizio ne sta eseguendo un altro (spesso una mancata corrispondenza `--profile` / `OPENCLAW_STATE_DIR`).

    Correzione:

    ```bash
    openclaw gateway install --force
    ```

    Eseguilo dallo stesso `--profile` / ambiente che vuoi far usare al servizio.

  </Accordion>

  <Accordion title='Che cosa significa "another gateway instance is already listening"?'>
    OpenClaw impone un blocco di runtime associando immediatamente il listener WebSocket all’avvio (predefinito `ws://127.0.0.1:18789`). Se il bind non riesce con `EADDRINUSE`, genera `GatewayLockError` indicando che un’altra istanza è già in ascolto.

    Correzione: arresta l’altra istanza, libera la porta oppure esegui con `openclaw gateway --port <port>`.

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

    - `openclaw gateway` si avvia solo quando `gateway.mode` è `local` (o passi il flag di override).
    - L’app macOS osserva il file di configurazione e cambia modalità in tempo reale quando questi valori cambiano.
    - `gateway.remote.token` / `.password` sono solo credenziali remote lato client; da sole non abilitano l’autenticazione del Gateway locale.

  </Accordion>

  <Accordion title='La Control UI dice "unauthorized" (o continua a riconnettersi). Cosa fare?'>
    Il percorso di autenticazione del tuo Gateway e il metodo di autenticazione della UI non corrispondono.

    Fatti (dal codice):

    - La Control UI mantiene il token in `sessionStorage` per la sessione corrente della scheda del browser e l’URL del Gateway selezionato, quindi gli aggiornamenti nella stessa scheda continuano a funzionare senza ripristinare la persistenza del token di lunga durata in localStorage.
    - Su `AUTH_TOKEN_MISMATCH`, i client attendibili possono tentare un solo nuovo tentativo limitato con un token dispositivo memorizzato nella cache quando il Gateway restituisce suggerimenti di retry (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Quel nuovo tentativo con token memorizzato nella cache ora riusa gli ambiti approvati memorizzati nella cache insieme al token dispositivo. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono comunque l’insieme di ambiti richiesto invece di ereditare gli ambiti memorizzati nella cache.
    - Fuori da quel percorso di retry, la precedenza dell’autenticazione di connessione è prima token/password condivisi espliciti, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi token di bootstrap.
    - I controlli degli ambiti del token di bootstrap sono prefissati per ruolo. L’elenco consentito integrato dell’operatore bootstrap soddisfa solo le richieste dell’operatore; node o altri ruoli non operatore hanno comunque bisogno di ambiti sotto il proprio prefisso di ruolo.

    Correzione:

    - Più rapido: `openclaw dashboard` (stampa + copia l’URL della dashboard, prova ad aprirlo; mostra un suggerimento SSH se headless).
    - Se non hai ancora un token: `openclaw doctor --generate-gateway-token`.
    - Se è remoto, crea prima il tunnel: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`.
    - Modalità a segreto condiviso: imposta `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oppure `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, poi incolla il segreto corrispondente nelle impostazioni della Control UI.
    - Modalità Tailscale Serve: assicurati che `gateway.auth.allowTailscale` sia abilitato e di aprire l’URL Serve, non un URL loopback/tailnet grezzo che aggira gli header di identità Tailscale.
    - Modalità proxy attendibile: assicurati di passare attraverso il proxy configurato con identità, non da un URL Gateway grezzo. Anche i proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true`.
    - Se la mancata corrispondenza persiste dopo l’unico retry, ruota/riapprova il token dispositivo associato:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Se quella chiamata di rotazione dice che è stata negata, controlla due cose:
      - le sessioni con dispositivo associato possono ruotare solo il **proprio** dispositivo, a meno che non abbiano anche `operator.admin`
      - i valori `--scope` espliciti non possono superare gli ambiti operatore correnti del chiamante
    - Ancora bloccato? Esegui `openclaw status --all` e segui [Risoluzione dei problemi](/it/gateway/troubleshooting). Vedi [Dashboard](/it/web/dashboard) per i dettagli di autenticazione.

  </Accordion>

  <Accordion title="Ho impostato gateway.bind tailnet ma non riesce a fare bind e niente è in ascolto">
    Il bind `tailnet` sceglie un IP Tailscale dalle interfacce di rete (100.64.0.0/10). Se la macchina non è su Tailscale (o l’interfaccia è inattiva), non c’è nulla a cui fare bind.

    Correzione:

    - Avvia Tailscale su quell’host (così ha un indirizzo 100.x), oppure
    - Passa a `gateway.bind: "loopback"` / `"lan"`.

    Nota: `tailnet` è esplicito. `auto` preferisce loopback; usa `gateway.bind: "tailnet"` quando vuoi un bind solo tailnet.

  </Accordion>

  <Accordion title="Posso eseguire più Gateway sullo stesso host?">
    Di solito no: un Gateway può eseguire più canali di messaggistica e agenti. Usa più Gateway solo quando hai bisogno di ridondanza (es.: bot di soccorso) o isolamento rigido.

    Sì, ma devi isolare:

    - `OPENCLAW_CONFIG_PATH` (configurazione per istanza)
    - `OPENCLAW_STATE_DIR` (stato per istanza)
    - `agents.defaults.workspace` (isolamento del workspace)
    - `gateway.port` (porte univoche)

    Configurazione rapida (consigliata):

    - Usa `openclaw --profile <name> ...` per istanza (crea automaticamente `~/.openclaw-<name>`).
    - Imposta un `gateway.port` univoco nella configurazione di ciascun profilo (oppure passa `--port` per le esecuzioni manuali).
    - Installa un servizio per profilo: `openclaw --profile <name> gateway install`.

    I profili aggiungono anche un suffisso ai nomi dei servizi (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guida completa: [Gateway multipli](/it/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Che cosa significa "invalid handshake" / codice 1008?'>
    Il Gateway è un **server WebSocket** e si aspetta che il primissimo messaggio
    sia un frame `connect`. Se riceve qualsiasi altra cosa, chiude la connessione
    con **codice 1008** (violazione delle policy).

    Cause comuni:

    - Hai aperto l’URL **HTTP** in un browser (`http://...`) invece di un client WS.
    - Hai usato la porta o il percorso sbagliati.
    - Un proxy o tunnel ha rimosso gli header di autenticazione o inviato una richiesta non Gateway.

    Correzioni rapide:

    1. Usa l’URL WS: `ws://<host>:18789` (oppure `wss://...` se HTTPS).
    2. Non aprire la porta WS in una normale scheda del browser.
    3. Se l’autenticazione è attiva, includi il token/password nel frame `connect`.

    Se usi la CLI o la TUI, l’URL dovrebbe essere simile a:

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

    Tail rapido dei log:

    ```bash
    openclaw logs --follow
    ```

    Log del servizio/supervisore (quando il Gateway viene eseguito tramite launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` e `gateway.err.log` (predefinito: `~/.openclaw/logs/...`; i profili usano `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Vedi [Risoluzione dei problemi](/it/gateway/troubleshooting) per altro.

  </Accordion>

  <Accordion title="Come avvio/arresto/riavvio il servizio Gateway?">
    Usa gli helper del Gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Se esegui manualmente il Gateway, `openclaw gateway --force` può recuperare la porta. Vedi [Gateway](/it/gateway).

  </Accordion>

  <Accordion title="Ho chiuso il terminale su Windows: come riavvio OpenClaw?">
    Esistono **due modalità di installazione su Windows**:

    **1) WSL2 (consigliata):** il Gateway viene eseguito dentro Linux.

    Apri PowerShell, entra in WSL, poi riavvia:

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

  <Accordion title="Il Gateway è attivo ma le risposte non arrivano mai. Cosa dovrei controllare?">
    Inizia con un rapido controllo dello stato:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Cause comuni:

    - Autenticazione del modello non caricata sull’**host Gateway** (controlla `models status`).
    - Associazione/elenco consentiti del canale che blocca le risposte (controlla configurazione del canale + log).
    - WebChat/Dashboard è aperta senza il token corretto.

    Se sei in remoto, conferma che la connessione tunnel/Tailscale sia attiva e che il
    WebSocket del Gateway sia raggiungibile.

    Documentazione: [Canali](/it/channels), [Risoluzione dei problemi](/it/gateway/troubleshooting), [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - cosa fare?'>
    Questo di solito significa che la UI ha perso la connessione WebSocket. Controlla:

    1. Il Gateway è in esecuzione? `openclaw gateway status`
    2. Il Gateway è integro? `openclaw status`
    3. La UI ha il token corretto? `openclaw dashboard`
    4. Se è remoto, il collegamento tunnel/Tailscale è attivo?

    Poi segui i log:

    ```bash
    openclaw logs --follow
    ```

    Documenti: [Dashboard](/it/web/dashboard), [Accesso remoto](/it/gateway/remote), [Risoluzione dei problemi](/it/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands non riesce. Cosa devo controllare?">
    Inizia con i log e lo stato del canale:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Poi confronta l'errore:

    - `BOT_COMMANDS_TOO_MUCH`: il menu di Telegram ha troppe voci. OpenClaw riduce gia al limite di Telegram e riprova con meno comandi, ma alcune voci del menu devono comunque essere eliminate. Riduci i comandi Plugin/Skills/personalizzati, oppure disabilita `channels.telegram.commands.native` se non ti serve il menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` o errori di rete simili: se sei su una VPS o dietro un proxy, conferma che l'HTTPS in uscita sia consentito e che il DNS funzioni per `api.telegram.org`.

    Se il Gateway è remoto, assicurati di guardare i log sull'host del Gateway.

    Documenti: [Telegram](/it/channels/telegram), [Risoluzione dei problemi del canale](/it/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI non mostra output. Cosa devo controllare?">
    Per prima cosa conferma che il Gateway sia raggiungibile e che l'agente possa essere eseguito:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Nella TUI, usa `/status` per vedere lo stato corrente. Se ti aspetti risposte in un canale
    di chat, assicurati che la consegna sia abilitata (`/deliver on`).

    Documenti: [TUI](/it/web/tui), [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come faccio a fermare completamente e poi avviare il Gateway?">
    Se hai installato il servizio:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Questo ferma/avvia il **servizio supervisionato** (launchd su macOS, systemd su Linux).
    Usalo quando il Gateway viene eseguito in background come demone.

    Se lo stai eseguendo in primo piano, fermalo con Ctrl-C, poi:

    ```bash
    openclaw gateway run
    ```

    Documenti: [Runbook del servizio Gateway](/it/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart rispetto a openclaw gateway">
    - `openclaw gateway restart`: riavvia il **servizio in background** (launchd/systemd).
    - `openclaw gateway`: esegue il gateway **in primo piano** per questa sessione del terminale.

    Se hai installato il servizio, usa i comandi gateway. Usa `openclaw gateway` quando
    vuoi un'esecuzione una tantum in primo piano.

  </Accordion>

  <Accordion title="Il modo più rapido per ottenere più dettagli quando qualcosa non riesce">
    Avvia il Gateway con `--verbose` per ottenere più dettagli nella console. Poi esamina il file di log per errori di autenticazione del canale, instradamento del modello e RPC.
  </Accordion>
</AccordionGroup>

## Media e allegati

<AccordionGroup>
  <Accordion title="La mia skill ha generato un'immagine/PDF, ma non è stato inviato nulla">
    Gli allegati in uscita dall'agente devono includere una riga `MEDIA:<path-or-url>` (su una riga separata). Vedi [Configurazione dell'assistente OpenClaw](/it/start/openclaw) e [Invio agente](/it/tools/agent-send).

    Invio da CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Controlla anche:

    - Il canale di destinazione supporta i media in uscita e non è bloccato da allowlist.
    - Il file rientra nei limiti di dimensione del provider (le immagini vengono ridimensionate a un massimo di 2048px).
    - `tools.fs.workspaceOnly=true` mantiene gli invii da percorso locale limitati a workspace, temp/media-store e file convalidati dalla sandbox.
    - `tools.fs.workspaceOnly=false` consente a `MEDIA:` di inviare file locali dell'host che l'agente può già leggere, ma solo per media e tipi di documento sicuri (immagini, audio, video, PDF e documenti Office). I file di testo normale e quelli simili a segreti restano bloccati.

    Vedi [Immagini](/it/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicurezza e controllo degli accessi

<AccordionGroup>
  <Accordion title="È sicuro esporre OpenClaw ai DM in ingresso?">
    Tratta i DM in ingresso come input non attendibile. Le impostazioni predefinite sono progettate per ridurre il rischio:

    - Il comportamento predefinito sui canali che supportano i DM è **associazione**:
      - I mittenti sconosciuti ricevono un codice di associazione; il bot non elabora il loro messaggio.
      - Approva con: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Le richieste in sospeso sono limitate a **3 per canale**; controlla `openclaw pairing list --channel <channel> [--account <id>]` se un codice non è arrivato.
    - L'apertura pubblica dei DM richiede un opt-in esplicito (`dmPolicy: "open"` e allowlist `"*"`).

    Esegui `openclaw doctor` per evidenziare criteri DM rischiosi.

  </Accordion>

  <Accordion title="La prompt injection è un problema solo per i bot pubblici?">
    No. La prompt injection riguarda i **contenuti non attendibili**, non solo chi può inviare DM al bot.
    Se il tuo assistente legge contenuti esterni (ricerca/fetch web, pagine del browser, email,
    documenti, allegati, log incollati), quei contenuti possono includere istruzioni che tentano
    di dirottare il modello. Questo può accadere anche se **sei l'unico mittente**.

    Il rischio maggiore si verifica quando gli strumenti sono abilitati: il modello può essere ingannato
    per esfiltrare il contesto o chiamare strumenti per tuo conto. Riduci il raggio d'impatto:

    - usando un agente "lettore" in sola lettura o con strumenti disabilitati per riassumere contenuti non attendibili
    - mantenendo `web_search` / `web_fetch` / `browser` disattivati per gli agenti con strumenti abilitati
    - trattando anche il testo decodificato da file/documenti come non attendibile: OpenResponses
      `input_file` e l'estrazione degli allegati media racchiudono entrambi il testo estratto in
      marcatori espliciti di confine dei contenuti esterni invece di passare il testo grezzo del file
    - usando sandboxing e allowlist rigorose per gli strumenti

    Dettagli: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Il mio bot dovrebbe avere la propria email, il proprio account GitHub o numero di telefono?">
    Sì, per la maggior parte delle configurazioni. Isolare il bot con account e numeri di telefono separati
    riduce il raggio d'impatto se qualcosa va storto. Questo rende anche più facile ruotare
    le credenziali o revocare l'accesso senza impattare i tuoi account personali.

    Inizia in piccolo. Concedi accesso solo agli strumenti e agli account di cui hai effettivamente bisogno, ed espandi
    in seguito se necessario.

    Documenti: [Sicurezza](/it/gateway/security), [Associazione](/it/channels/pairing).

  </Accordion>

  <Accordion title="Posso dargli autonomia sui miei messaggi di testo ed è sicuro?">
    **Non** consigliamo la piena autonomia sui tuoi messaggi personali. Il modello più sicuro è:

    - Mantieni i DM in **modalità associazione** o con una allowlist stretta.
    - Usa un **numero o account separato** se vuoi che invii messaggi per tuo conto.
    - Lascia che prepari una bozza, poi **approva prima dell'invio**.

    Se vuoi sperimentare, fallo su un account dedicato e mantienilo isolato. Vedi
    [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Posso usare modelli più economici per attività da assistente personale?">
    Sì, **se** l'agente è solo chat e l'input è attendibile. I livelli più piccoli sono
    più suscettibili al dirottamento delle istruzioni, quindi evitali per agenti con strumenti abilitati
    o quando leggono contenuti non attendibili. Se devi usare un modello più piccolo, limita
    gli strumenti ed eseguilo dentro una sandbox. Vedi [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Ho eseguito /start in Telegram ma non ho ricevuto un codice di associazione">
    I codici di associazione vengono inviati **solo** quando un mittente sconosciuto invia un messaggio al bot e
    `dmPolicy: "pairing"` è abilitato. `/start` da solo non genera un codice.

    Controlla le richieste in sospeso:

    ```bash
    openclaw pairing list telegram
    ```

    Se vuoi accesso immediato, aggiungi il tuo ID mittente alla allowlist oppure imposta `dmPolicy: "open"`
    per quell'account.

  </Accordion>

  <Accordion title="WhatsApp: invierà messaggi ai miei contatti? Come funziona l'associazione?">
    No. Il criterio DM predefinito di WhatsApp è **associazione**. I mittenti sconosciuti ricevono solo un codice di associazione e il loro messaggio **non viene elaborato**. OpenClaw risponde solo alle chat che riceve o agli invii espliciti che attivi.

    Approva l'associazione con:

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
    su **eredita**. Conferma anche di non usare un profilo bot con `verboseDefault` impostato
    su `on` nella configurazione.

    Documenti: [Thinking e verbose](/it/tools/thinking), [Sicurezza](/it/gateway/security#reasoning-verbose-output-in-groups).

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

    Per processi in background (dallo strumento exec), puoi chiedere all'agente di eseguire:

    ```
    process action:kill sessionId:XXX
    ```

    Panoramica dei comandi slash: vedi [Comandi slash](/it/tools/slash-commands).

    La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`, ma alcune scorciatoie (come `/status`) funzionano anche inline per mittenti in allowlist.

  </Accordion>

  <Accordion title='Come faccio a inviare un messaggio Discord da Telegram? ("Cross-context messaging denied")'>
    OpenClaw blocca per impostazione predefinita la messaggistica **tra provider**. Se una chiamata strumento è vincolata
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

  <Accordion title='Perché sembra che il bot "ignori" i messaggi rapidi in sequenza?'>
    La modalità coda controlla come i nuovi messaggi interagiscono con un'esecuzione in corso. Usa `/queue` per cambiare modalità:

    - `steer` - mette in coda tutti gli orientamenti in sospeso per il prossimo confine del modello nell'esecuzione corrente
    - `queue` - orientamento legacy uno alla volta
    - `followup` - esegue i messaggi uno alla volta
    - `collect` - raggruppa i messaggi e risponde una sola volta
    - `steer-backlog` - orienta ora, poi elabora l'arretrato
    - `interrupt` - interrompe l'esecuzione corrente e riparte da zero

    La modalità predefinita è `steer`. Puoi aggiungere opzioni come `debounce:0.5s cap:25 drop:summarize` per le modalità followup. Vedi [Coda dei comandi](/it/concepts/queue) e [Coda di orientamento](/it/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Varie

<AccordionGroup>
  <Accordion title='Qual è il modello predefinito per Anthropic con una chiave API?'>
    In OpenClaw, le credenziali e la selezione del modello sono separate. Impostare `ANTHROPIC_API_KEY` (o archiviare una chiave API Anthropic nei profili di autenticazione) abilita l'autenticazione, ma il modello predefinito effettivo è quello configurato in `agents.defaults.model.primary` (ad esempio, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). Se vedi `No credentials found for profile "anthropic:default"`, significa che il Gateway non è riuscito a trovare le credenziali Anthropic nel file `auth-profiles.json` previsto per l'agente in esecuzione.
  </Accordion>
</AccordionGroup>

---

Hai ancora problemi? Chiedi su [Discord](https://discord.com/invite/clawd) o apri una [discussione su GitHub](https://github.com/openclaw/openclaw/discussions).

## Correlati

- [FAQ sul primo avvio](/it/help/faq-first-run) — installazione, onboarding, autenticazione, abbonamenti, errori iniziali
- [FAQ sui modelli](/it/help/faq-models) — selezione del modello, failover, profili di autenticazione
- [Risoluzione dei problemi](/it/help/troubleshooting) — triage partendo dai sintomi
