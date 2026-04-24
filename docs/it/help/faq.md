---
read_when:
    - Rispondere alle domande comuni su configurazione iniziale, installazione, onboarding o supporto runtime
    - Fare triage dei problemi segnalati dagli utenti prima di un debug più approfondito
summary: Domande frequenti su configurazione iniziale, configurazione e utilizzo di OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-24T08:43:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ae635d7ade265e3e79d1f5489ae23034a341843bd784f68a985b18bee5bdf6f
    source_path: help/faq.md
    workflow: 15
---

Risposte rapide più troubleshooting approfondito per configurazioni reali (sviluppo locale, VPS, multi-agent, OAuth/chiavi API, model failover). Per la diagnostica runtime, vedi [Troubleshooting](/it/gateway/troubleshooting). Per il riferimento completo della configurazione, vedi [Configurazione](/it/gateway/configuration).

## I primi 60 secondi se qualcosa non funziona

1. **Stato rapido (primo controllo)**

   ```bash
   openclaw status
   ```

   Riepilogo locale rapido: SO + aggiornamento, raggiungibilità gateway/servizio, agenti/sessioni, configurazione provider + problemi runtime (quando il gateway è raggiungibile).

2. **Report incollabile (sicuro da condividere)**

   ```bash
   openclaw status --all
   ```

   Diagnosi in sola lettura con coda dei log (token redatti).

3. **Stato del demone + porta**

   ```bash
   openclaw gateway status
   ```

   Mostra il runtime del supervisore rispetto alla raggiungibilità RPC, l'URL di destinazione del probe e quale configurazione probabilmente ha usato il servizio.

4. **Probe approfonditi**

   ```bash
   openclaw status --deep
   ```

   Esegue un probe live dello stato di salute del gateway, inclusi i probe dei canali quando supportati
   (richiede un gateway raggiungibile). Vedi [Health](/it/gateway/health).

5. **Segui l'ultimo log**

   ```bash
   openclaw logs --follow
   ```

   Se l'RPC non è disponibile, usa come fallback:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   I file di log sono separati dai log del servizio; vedi [Logging](/it/logging) e [Troubleshooting](/it/gateway/troubleshooting).

6. **Esegui doctor (riparazioni)**

   ```bash
   openclaw doctor
   ```

   Ripara/migra configurazione e stato + esegue controlli di salute. Vedi [Doctor](/it/gateway/doctor).

7. **Istantanea del gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # mostra l'URL di destinazione + il percorso di configurazione in caso di errori
   ```

   Chiede al gateway in esecuzione un'istantanea completa (solo WS). Vedi [Health](/it/gateway/health).

## Avvio rapido e configurazione iniziale

Le domande e risposte del primo avvio — installazione, onboarding, percorsi auth, abbonamenti, guasti iniziali —
si trovano nella [FAQ del primo avvio](/it/help/faq-first-run).

## Che cos'è OpenClaw?

<AccordionGroup>
  <Accordion title="Che cos'è OpenClaw, in un paragrafo?">
    OpenClaw è un assistente IA personale che esegui sui tuoi dispositivi. Risponde sulle superfici di messaggistica che usi già (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e plugin di canale bundled come QQ Bot) e può anche gestire voce + un Canvas live sulle piattaforme supportate. Il **Gateway** è il control plane sempre attivo; l'assistente è il prodotto.
  </Accordion>

  <Accordion title="Proposta di valore">
    OpenClaw non è "solo un wrapper di Claude". È un **control plane local-first** che ti consente di eseguire un
    assistente capace sul **tuo hardware**, raggiungibile dalle app di chat che usi già, con
    sessioni con stato, memoria e strumenti - senza cedere il controllo dei tuoi flussi di lavoro a un
    SaaS ospitato.

    Punti salienti:

    - **I tuoi dispositivi, i tuoi dati:** esegui il Gateway dove vuoi (Mac, Linux, VPS) e mantieni
      locali lo spazio di lavoro e la cronologia delle sessioni.
    - **Canali reali, non una sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ecc.,
      più voce mobile e Canvas sulle piattaforme supportate.
    - **Indipendente dal modello:** usa Anthropic, OpenAI, MiniMax, OpenRouter, ecc., con instradamento
      e failover per agente.
    - **Opzione solo locale:** esegui modelli locali così **tutti i dati possono restare sul tuo dispositivo** se vuoi.
    - **Instradamento multi-agent:** agenti separati per canale, account o attività, ciascuno con il proprio
      spazio di lavoro e i propri valori predefiniti.
    - **Open source e modificabile:** ispeziona, estendi e self-hosta senza vendor lock-in.

    Documentazione: [Gateway](/it/gateway), [Canali](/it/channels), [Multi-agent](/it/concepts/multi-agent),
    [Memory](/it/concepts/memory).

  </Accordion>

  <Accordion title="L'ho appena configurato - cosa dovrei fare per prima cosa?">
    Buoni primi progetti:

    - Creare un sito web (WordPress, Shopify o un semplice sito statico).
    - Prototipare un'app mobile (struttura, schermate, piano API).
    - Organizzare file e cartelle (pulizia, naming, tagging).
    - Collegare Gmail e automatizzare riepiloghi o follow-up.

    Può gestire attività grandi, ma funziona meglio quando le dividi in fasi e
    usi sottoagenti per il lavoro parallelo.

  </Accordion>

  <Accordion title="Quali sono i cinque casi d'uso quotidiani principali di OpenClaw?">
    I vantaggi quotidiani di solito sono questi:

    - **Briefing personali:** riepiloghi di inbox, calendario e notizie che ti interessano.
    - **Ricerca e stesura:** ricerca rapida, riepiloghi e prime bozze per email o documenti.
    - **Promemoria e follow-up:** solleciti e checklist guidati da Cron o Heartbeat.
    - **Automazione del browser:** compilazione di moduli, raccolta di dati e ripetizione di attività web.
    - **Coordinamento tra dispositivi:** invia un'attività dal telefono, lascia che il Gateway la esegua su un server e ricevi il risultato in chat.

  </Accordion>

  <Accordion title="OpenClaw può aiutare con lead generation, outreach, annunci e blog per un SaaS?">
    Sì per **ricerca, qualificazione e stesura**. Può analizzare siti, creare shortlist,
    riepilogare prospect e scrivere bozze di outreach o copy pubblicitario.

    Per **outreach o campagne pubblicitarie**, mantieni un umano nel loop. Evita lo spam, rispetta le leggi locali e
    le policy delle piattaforme, e rivedi tutto prima dell'invio. Il modello più sicuro è
    lasciare che OpenClaw prepari la bozza e che tu la approvi.

    Documentazione: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i vantaggi rispetto a Claude Code per lo sviluppo web?">
    OpenClaw è un **assistente personale** e un livello di coordinamento, non un sostituto dell'IDE. Usa
    Claude Code o Codex per il ciclo di coding diretto più veloce dentro un repository. Usa OpenClaw quando
    vuoi memoria durevole, accesso multi-dispositivo e orchestrazione degli strumenti.

    Vantaggi:

    - **Memory + spazio di lavoro persistenti** tra le sessioni
    - **Accesso multipiattaforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestrazione degli strumenti** (browser, file, pianificazione, hook)
    - **Gateway sempre attivo** (eseguilo su un VPS, interagisci da ovunque)
    - **Node** per browser/schermo/fotocamera/exec locali

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automazione

<AccordionGroup>
  <Accordion title="Come posso personalizzare le Skills senza sporcare il repository?">
    Usa override gestiti invece di modificare la copia nel repository. Metti le tue modifiche in `~/.openclaw/skills/<name>/SKILL.md` (oppure aggiungi una cartella tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json`). La precedenza è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, quindi gli override gestiti continuano ad avere priorità sulle Skills bundled senza toccare git. Se hai bisogno che la Skill sia installata globalmente ma visibile solo ad alcuni agenti, mantieni la copia condivisa in `~/.openclaw/skills` e controlla la visibilità con `agents.defaults.skills` e `agents.list[].skills`. Solo le modifiche meritevoli di upstream dovrebbero vivere nel repository ed essere inviate come PR.
  </Accordion>

  <Accordion title="Posso caricare Skills da una cartella personalizzata?">
    Sì. Aggiungi directory extra tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json` (precedenza più bassa). La precedenza predefinita è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` installa in `./skills` per impostazione predefinita, che OpenClaw tratta come `<workspace>/skills` nella sessione successiva. Se la Skill deve essere visibile solo a determinati agenti, abbinala a `agents.defaults.skills` oppure `agents.list[].skills`.
  </Accordion>

  <Accordion title="Come posso usare modelli diversi per attività diverse?">
    Oggi i modelli supportati sono:

    - **Job Cron**: i job isolati possono impostare un override `model` per job.
    - **Sottoagenti**: instrada le attività verso agenti separati con modelli predefiniti diversi.
    - **Cambio on-demand**: usa `/model` per cambiare il modello della sessione corrente in qualsiasi momento.

    Vedi [Job Cron](/it/automation/cron-jobs), [Instradamento Multi-Agent](/it/concepts/multi-agent) e [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Il bot si blocca durante lavori pesanti. Come posso scaricare quel lavoro?">
    Usa i **sottoagenti** per attività lunghe o parallele. I sottoagenti vengono eseguiti nella propria sessione,
    restituiscono un riepilogo e mantengono reattiva la tua chat principale.

    Chiedi al bot di "avviare un sottoagente per questa attività" oppure usa `/subagents`.
    Usa `/status` in chat per vedere cosa sta facendo il Gateway in questo momento (e se è occupato).

    Suggerimento sui token: sia le attività lunghe sia i sottoagenti consumano token. Se il costo è un problema, imposta un
    modello più economico per i sottoagenti tramite `agents.defaults.subagents.model`.

    Documentazione: [Sottoagenti](/it/tools/subagents), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Come funzionano le sessioni di sottoagente vincolate a un thread su Discord?">
    Usa i binding dei thread. Puoi associare un thread Discord a un sottoagente o a una destinazione di sessione in modo che i messaggi successivi in quel thread restino sulla sessione associata.

    Flusso di base:

    - Avvia con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"` per un follow-up persistente).
    - Oppure associa manualmente con `/focus <target>`.
    - Usa `/agents` per ispezionare lo stato del binding.
    - Usa `/session idle <duration|off>` e `/session max-age <duration|off>` per controllare l'auto-unfocus.
    - Usa `/unfocus` per scollegare il thread.

    Configurazione richiesta:

    - Valori globali predefiniti: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind all'avvio: imposta `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentazione: [Sottoagenti](/it/tools/subagents), [Discord](/it/channels/discord), [Riferimento della configurazione](/it/gateway/configuration-reference), [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Un sottoagente ha finito, ma l'aggiornamento di completamento è andato nel posto sbagliato o non è mai stato pubblicato. Cosa devo controllare?">
    Controlla prima il percorso del richiedente risolto:

    - La consegna di completamento del sottoagente preferisce qualsiasi thread associato o percorso di conversazione quando ne esiste uno.
    - Se l'origine del completamento contiene solo un canale, OpenClaw usa come fallback il percorso memorizzato della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta può comunque riuscire.
    - Se non esistono né un percorso associato né un percorso memorizzato utilizzabile, la consegna diretta può fallire e il risultato usa come fallback la consegna in coda della sessione invece di essere pubblicato immediatamente in chat.
    - Destinazioni non valide o obsolete possono comunque forzare il fallback alla coda o il fallimento finale della consegna.
    - Se l'ultima risposta visibile dell'assistente del figlio è esattamente il token silenzioso `NO_REPLY` / `no_reply`, oppure esattamente `ANNOUNCE_SKIP`, OpenClaw sopprime intenzionalmente l'annuncio invece di pubblicare avanzamenti precedenti ormai obsoleti.
    - Se il figlio è andato in timeout dopo sole chiamate di strumenti, l'annuncio può ridurre il tutto a un breve riepilogo del progresso parziale invece di riprodurre l'output grezzo degli strumenti.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Sottoagenti](/it/tools/subagents), [Attività in background](/it/automation/tasks), [Strumenti di sessione](/it/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o i promemoria non si attivano. Cosa devo controllare?">
    Cron viene eseguito all'interno del processo Gateway. Se il Gateway non è in esecuzione continua,
    i job pianificati non verranno eseguiti.

    Checklist:

    - Conferma che Cron sia abilitato (`cron.enabled`) e che `OPENCLAW_SKIP_CRON` non sia impostato.
    - Controlla che il Gateway sia in esecuzione 24/7 (senza sleep/riavvii).
    - Verifica le impostazioni del fuso orario per il job (`--tz` rispetto al fuso orario dell'host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Automazione e attività](/it/automation).

  </Accordion>

  <Accordion title="Cron si è attivato, ma non è stato inviato nulla al canale. Perché?">
    Controlla prima la modalità di consegna:

    - `--no-deliver` / `delivery.mode: "none"` significa che non è prevista alcuna consegna fallback del runner.
    - Destinazione announce mancante o non valida (`channel` / `to`) significa che il runner ha saltato la consegna in uscita.
    - I guasti di autenticazione del canale (`unauthorized`, `Forbidden`) significano che il runner ha provato a consegnare ma le credenziali lo hanno bloccato.
    - Un risultato isolato silenzioso (`NO_REPLY` / `no_reply` soltanto) viene trattato come intenzionalmente non consegnabile, quindi il runner sopprime anche la consegna fallback in coda.

    Per i job Cron isolati, l'agente può comunque inviare direttamente con lo strumento `message`
    quando è disponibile un percorso chat. `--announce` controlla solo il percorso
    fallback del runner per il testo finale che l'agente non ha già inviato.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Perché un'esecuzione Cron isolata ha cambiato modello o ha ritentato una volta?">
    Di solito è il percorso live di cambio modello, non una pianificazione duplicata.

    Cron isolato può persistere un handoff del modello runtime e ritentare quando l'esecuzione attiva
    genera `LiveSessionModelSwitchError`. Il retry mantiene il
    provider/modello cambiato e, se il cambio includeva un nuovo override del profilo auth, Cron
    persiste anche quello prima del retry.

    Regole di selezione correlate:

    - L'override del modello dell'hook Gmail ha la precedenza quando applicabile.
    - Poi il `model` per job.
    - Poi un eventuale override del modello della sessione Cron memorizzata.
    - Poi la normale selezione del modello agente/predefinito.

    Il ciclo di retry è limitato. Dopo il tentativo iniziale più 2 retry di cambio,
    Cron interrompe invece di continuare all'infinito.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [CLI cron](/it/cli/cron).

  </Accordion>

  <Accordion title="Come installo le Skills su Linux?">
    Usa i comandi nativi `openclaw skills` oppure inserisci le Skills nel tuo spazio di lavoro. La UI Skills di macOS non è disponibile su Linux.
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

    Il comando nativo `openclaw skills install` scrive nella directory `skills/`
    dello spazio di lavoro attivo. Installa la CLI separata `clawhub` solo se vuoi pubblicare o
    sincronizzare le tue Skills. Per installazioni condivise tra agenti, inserisci la Skill in
    `~/.openclaw/skills` e usa `agents.defaults.skills` oppure
    `agents.list[].skills` se vuoi limitare quali agenti possono vederla.

  </Accordion>

  <Accordion title="OpenClaw può eseguire attività pianificate o continuamente in background?">
    Sì. Usa lo scheduler del Gateway:

    - **Job Cron** per attività pianificate o ricorrenti (persistono tra i riavvii).
    - **Heartbeat** per controlli periodici della "sessione principale".
    - **Job isolati** per agenti autonomi che pubblicano riepiloghi o consegnano alle chat.

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Automazione e attività](/it/automation),
    [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso eseguire Skills Apple solo per macOS da Linux?">
    Non direttamente. Le Skills macOS sono controllate da `metadata.openclaw.os` più i binari richiesti, e le Skills compaiono nel prompt di sistema solo quando sono idonee sull'**host del Gateway**. Su Linux, le Skills solo `darwin` (come `apple-notes`, `apple-reminders`, `things-mac`) non verranno caricate a meno che tu non sovrascriva il controllo.

    Hai tre modelli supportati:

    **Opzione A - esegui il Gateway su un Mac (più semplice).**
    Esegui il Gateway dove esistono i binari macOS, poi connettiti da Linux in [modalità remota](#gateway-ports-already-running-and-remote-mode) oppure tramite Tailscale. Le Skills si caricano normalmente perché l'host del Gateway è macOS.

    **Opzione B - usa un macOS Node (senza SSH).**
    Esegui il Gateway su Linux, associa un macOS Node (app menubar) e imposta **Node Run Commands** su "Always Ask" oppure "Always Allow" sul Mac. OpenClaw può trattare le Skills solo macOS come idonee quando i binari richiesti esistono sul Node. L'agente esegue quelle Skills tramite lo strumento `nodes`. Se scegli "Always Ask", approvare "Always Allow" nel prompt aggiunge quel comando all'allowlist.

    **Opzione C - fai proxy dei binari macOS tramite SSH (avanzato).**
    Mantieni il Gateway su Linux, ma fai in modo che i binari CLI richiesti si risolvano in wrapper SSH che vengono eseguiti su un Mac. Quindi sovrascrivi la Skill per consentire Linux così resta idonea.

    1. Crea un wrapper SSH per il binario (esempio: `memo` per Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Inserisci il wrapper nel `PATH` sull'host Linux (ad esempio `~/bin/memo`).
    3. Sovrascrivi i metadati della Skill (spazio di lavoro oppure `~/.openclaw/skills`) per consentire Linux:

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
    Non integrata oggi.

    Opzioni:

    - **Skill / Plugin personalizzato:** il migliore per un accesso API affidabile (sia Notion sia HeyGen hanno API).
    - **Automazione del browser:** funziona senza codice ma è più lenta e più fragile.

    Se vuoi mantenere il contesto per cliente (flussi di lavoro da agenzia), un modello semplice è:

    - Una pagina Notion per cliente (contesto + preferenze + lavoro attivo).
    - Chiedere all'agente di recuperare quella pagina all'inizio di una sessione.

    Se vuoi un'integrazione nativa, apri una richiesta di funzionalità oppure crea una Skill
    che punti a quelle API.

    Installa le Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Le installazioni native finiscono nella directory `skills/` dello spazio di lavoro attivo. Per Skills condivise tra agenti, inseriscile in `~/.openclaw/skills/<name>/SKILL.md`. Se solo alcuni agenti devono vedere un'installazione condivisa, configura `agents.defaults.skills` oppure `agents.list[].skills`. Alcune Skills si aspettano binari installati tramite Homebrew; su Linux ciò significa Linuxbrew (vedi la voce FAQ Homebrew Linux sopra). Vedi [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config) e [ClawHub](/it/tools/clawhub).

  </Accordion>

  <Accordion title="Come posso usare il mio Chrome già connesso con OpenClaw?">
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

    Questo percorso può usare il browser dell'host locale o un browser Node connesso. Se il Gateway è eseguito altrove, esegui un host Node sulla macchina del browser oppure usa CDP remoto.

    Limiti attuali di `existing-session` / `user`:

    - le azioni sono guidate da ref, non da selettori CSS
    - gli upload richiedono `ref` / `inputRef` e attualmente supportano un solo file alla volta
    - `responsebody`, export PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP grezzo

  </Accordion>
</AccordionGroup>

## Sandboxing e memoria

<AccordionGroup>
  <Accordion title="Esiste una documentazione dedicata al sandboxing?">
    Sì. Vedi [Sandboxing](/it/gateway/sandboxing). Per la configurazione specifica di Docker (Gateway completo in Docker o immagini sandbox), vedi [Docker](/it/install/docker).
  </Accordion>

  <Accordion title="Docker sembra limitato - come abilito tutte le funzionalità?">
    L'immagine predefinita è orientata alla sicurezza e viene eseguita come utente `node`, quindi non
    include pacchetti di sistema, Homebrew o browser bundled. Per una configurazione più completa:

    - Rendi persistente `/home/node` con `OPENCLAW_HOME_VOLUME` così le cache sopravvivono.
    - Inserisci le dipendenze di sistema nell'immagine con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installa i browser Playwright tramite la CLI bundled:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Imposta `PLAYWRIGHT_BROWSERS_PATH` e assicurati che il percorso sia persistente.

    Documentazione: [Docker](/it/install/docker), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="Posso mantenere i DM personali ma rendere i gruppi pubblici/in sandbox con un solo agente?">
    Sì - se il tuo traffico privato è nei **DM** e il tuo traffico pubblico è nei **gruppi**.

    Usa `agents.defaults.sandbox.mode: "non-main"` in modo che le sessioni di gruppo/canale (chiavi non-main) vengano eseguite nel backend sandbox configurato, mentre la sessione DM principale resta sull'host. Docker è il backend predefinito se non ne scegli uno. Quindi limita quali strumenti sono disponibili nelle sessioni sandbox tramite `tools.sandbox.tools`.

    Procedura di configurazione + esempio: [Gruppi: DM personali + gruppi pubblici](/it/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Riferimento chiave di configurazione: [Configurazione del Gateway](/it/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Come faccio a montare una cartella host nella sandbox?">
    Imposta `agents.defaults.sandbox.docker.binds` su `["host:path:mode"]` (ad es. `"/home/user/src:/src:ro"`). I bind globali e per agente vengono uniti; i bind per agente vengono ignorati quando `scope: "shared"`. Usa `:ro` per qualsiasi cosa sensibile e ricorda che i bind aggirano le barriere del file system della sandbox.

    OpenClaw convalida le sorgenti bind sia rispetto al percorso normalizzato sia al percorso canonico risolto attraverso l'antenato esistente più profondo. Ciò significa che le fughe tramite symlink-parent continuano a fallire in modalità fail-closed anche quando l'ultimo segmento del percorso non esiste ancora, e i controlli sulle root consentite continuano ad applicarsi dopo la risoluzione dei symlink.

    Vedi [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) per esempi e note di sicurezza.

  </Accordion>

  <Accordion title="Come funziona la memoria?">
    La memoria di OpenClaw è semplicemente costituita da file Markdown nello spazio di lavoro dell'agente:

    - Note giornaliere in `memory/YYYY-MM-DD.md`
    - Note curate a lungo termine in `MEMORY.md` (solo sessioni principali/private)

    OpenClaw esegue anche un **flush silenzioso della memoria prima della Compaction** per ricordare al modello
    di scrivere note durevoli prima della Compaction automatica. Questo viene eseguito solo quando lo spazio di lavoro
    è scrivibile (le sandbox in sola lettura lo saltano). Vedi [Memory](/it/concepts/memory).

  </Accordion>

  <Accordion title="La memoria continua a dimenticare le cose. Come faccio a farle restare?">
    Chiedi al bot di **scrivere il fatto in memoria**. Le note a lungo termine appartengono a `MEMORY.md`,
    il contesto a breve termine va in `memory/YYYY-MM-DD.md`.

    Questa è ancora un'area che stiamo migliorando. Aiuta ricordare al modello di archiviare i ricordi;
    saprà cosa fare. Se continua a dimenticare, verifica che il Gateway stia usando lo stesso
    spazio di lavoro a ogni esecuzione.

    Documentazione: [Memory](/it/concepts/memory), [Spazio di lavoro dell'agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La memoria persiste per sempre? Quali sono i limiti?">
    I file di memoria vivono su disco e persistono finché non li elimini. Il limite è il tuo
    storage, non il modello. Il **contesto della sessione** è comunque limitato dalla finestra di contesto del modello,
    quindi le conversazioni lunghe possono essere compattate o troncate. Ecco perché
    esiste la ricerca in memoria - riporta nel contesto solo le parti rilevanti.

    Documentazione: [Memory](/it/concepts/memory), [Contesto](/it/concepts/context).

  </Accordion>

  <Accordion title="La ricerca semantica in memoria richiede una chiave API OpenAI?">
    Solo se usi **embedding OpenAI**. Codex OAuth copre chat/completions e
    **non** concede accesso agli embedding, quindi **fare login con Codex (OAuth o login della
    Codex CLI)** non aiuta per la ricerca semantica in memoria. Gli embedding OpenAI
    richiedono ancora una vera chiave API (`OPENAI_API_KEY` oppure `models.providers.openai.apiKey`).

    Se non imposti esplicitamente un provider, OpenClaw seleziona automaticamente un provider quando
    riesce a risolvere una chiave API (profili auth, `models.providers.*.apiKey` oppure variabili env).
    Preferisce OpenAI se riesce a risolvere una chiave OpenAI, altrimenti Gemini se riesce a risolvere una chiave Gemini,
    poi Voyage, poi Mistral. Se non è disponibile alcuna chiave remota,
    la ricerca in memoria resta disabilitata finché non la configuri. Se hai configurato ed è presente
    un percorso di modello locale, OpenClaw
    preferisce `local`. Ollama è supportato quando imposti esplicitamente
    `memorySearch.provider = "ollama"`.

    Se preferisci restare in locale, imposta `memorySearch.provider = "local"` (e facoltativamente
    `memorySearch.fallback = "none"`). Se vuoi embedding Gemini, imposta
    `memorySearch.provider = "gemini"` e fornisci `GEMINI_API_KEY` (oppure
    `memorySearch.remote.apiKey`). Supportiamo modelli di embedding **OpenAI, Gemini, Voyage, Mistral, Ollama o local**
    - vedi [Memory](/it/concepts/memory) per i dettagli di configurazione.

  </Accordion>
</AccordionGroup>

## Dove si trovano le cose su disco

<AccordionGroup>
  <Accordion title="Tutti i dati usati con OpenClaw vengono salvati localmente?">
    No - **lo stato di OpenClaw è locale**, ma **i servizi esterni vedono comunque ciò che invii loro**.

    - **Locale per impostazione predefinita:** sessioni, file di memoria, configurazione e spazio di lavoro si trovano sull'host del Gateway
      (`~/.openclaw` + la directory del tuo spazio di lavoro).
    - **Remoto per necessità:** i messaggi che invii ai provider di modelli (Anthropic/OpenAI/ecc.) vanno alle
      loro API, e le piattaforme di chat (WhatsApp/Telegram/Slack/ecc.) memorizzano i dati dei messaggi sui loro
      server.
    - **Controlli l'impronta:** usare modelli locali mantiene i prompt sulla tua macchina, ma il traffico del canale
      passa comunque attraverso i server del canale.

    Correlati: [Spazio di lavoro dell'agente](/it/concepts/agent-workspace), [Memory](/it/concepts/memory).

  </Accordion>

  <Accordion title="Dove OpenClaw archivia i suoi dati?">
    Tutto si trova sotto `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`):

    | Percorso                                                       | Scopo                                                              |
    | -------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                            | Configurazione principale (JSON5)                                  |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                   | Import OAuth legacy (copiato nei profili auth al primo utilizzo)   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profili auth (OAuth, chiavi API e `keyRef`/`tokenRef` facoltativi) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                             | Payload secret facoltativo supportato da file per provider SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`         | File di compatibilità legacy (le voci statiche `api_key` vengono ripulite) |
    | `$OPENCLAW_STATE_DIR/credentials/`                             | Stato del provider (ad es. `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                  | Stato per agente (agentDir + sessioni)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`               | Cronologia e stato delle conversazioni (per agente)                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`  | Metadati delle sessioni (per agente)                               |

    Percorso legacy a singolo agente: `~/.openclaw/agent/*` (migrato da `openclaw doctor`).

    Il tuo **spazio di lavoro** (`AGENTS.md`, file di memoria, Skills, ecc.) è separato ed è configurato tramite `agents.defaults.workspace` (predefinito: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Dove dovrebbero trovarsi AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Questi file si trovano nello **spazio di lavoro dell'agente**, non in `~/.openclaw`.

    - **Spazio di lavoro (per agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, facoltativamente `HEARTBEAT.md`.
      `memory.md` minuscolo alla radice è solo input di riparazione legacy; `openclaw doctor --fix`
      può unirlo in `MEMORY.md` quando entrambi i file esistono.
    - **Directory di stato (`~/.openclaw`)**: configurazione, stato di canale/provider, profili auth, sessioni, log,
      e Skills condivise (`~/.openclaw/skills`).

    Lo spazio di lavoro predefinito è `~/.openclaw/workspace`, configurabile tramite:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se il bot "dimentica" dopo un riavvio, conferma che il Gateway stia usando lo stesso
    spazio di lavoro a ogni avvio (e ricorda: la modalità remota usa lo **spazio di lavoro dell'host del gateway**,
    non quello del tuo laptop locale).

    Suggerimento: se vuoi un comportamento o una preferenza durevole, chiedi al bot di **scriverla in
    AGENTS.md o MEMORY.md** invece di affidarti alla cronologia chat.

    Vedi [Spazio di lavoro dell'agente](/it/concepts/agent-workspace) e [Memory](/it/concepts/memory).

  </Accordion>

  <Accordion title="Strategia di backup consigliata">
    Metti il tuo **spazio di lavoro dell'agente** in un repository git **privato** e fai il backup da qualche parte
    in modo privato (ad esempio GitHub privato). In questo modo catturi memory + file AGENTS/SOUL/USER
    e puoi ripristinare in seguito la "mente" dell'assistente.

    **Non** eseguire commit di nulla sotto `~/.openclaw` (credenziali, sessioni, token o payload di secret cifrati).
    Se ti serve un ripristino completo, fai il backup separato sia dello spazio di lavoro sia della directory di stato
    (vedi la domanda sulla migrazione sopra).

    Documentazione: [Spazio di lavoro dell'agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Come disinstallo completamente OpenClaw?">
    Vedi la guida dedicata: [Disinstallazione](/it/install/uninstall).
  </Accordion>

  <Accordion title="Gli agenti possono lavorare fuori dallo spazio di lavoro?">
    Sì. Lo spazio di lavoro è la **cwd predefinita** e l'ancora della memoria, non una sandbox rigida.
    I percorsi relativi si risolvono all'interno dello spazio di lavoro, ma i percorsi assoluti possono accedere ad altre
    posizioni dell'host a meno che il sandboxing non sia abilitato. Se hai bisogno di isolamento, usa
    [`agents.defaults.sandbox`](/it/gateway/sandboxing) o le impostazioni sandbox per agente. Se
    vuoi che un repository sia la directory di lavoro predefinita, punta il `workspace`
    di quell'agente alla root del repository. Il repository OpenClaw è solo codice sorgente; mantieni lo
    spazio di lavoro separato a meno che tu non voglia intenzionalmente che l'agente lavori al suo interno.

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
    Lo stato della sessione è posseduto dall'**host del gateway**. Se sei in modalità remota, lo store delle sessioni che ti interessa è sulla macchina remota, non sul tuo laptop locale. Vedi [Gestione della sessione](/it/concepts/session).
  </Accordion>
</AccordionGroup>

## Basi della configurazione

<AccordionGroup>
  <Accordion title="Che formato ha la configurazione? Dov'è?">
    OpenClaw legge una configurazione facoltativa **JSON5** da `$OPENCLAW_CONFIG_PATH` (predefinito: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se il file manca, usa valori predefiniti ragionevolmente sicuri (incluso uno spazio di lavoro predefinito di `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ho impostato gateway.bind: "lan" (o "tailnet") e ora non ascolta nulla / la UI dice unauthorized'>
    I bind non-loopback **richiedono un percorso auth del gateway valido**. In pratica significa:

    - auth con secret condiviso: token o password
    - `gateway.auth.mode: "trusted-proxy"` dietro un proxy inverso identity-aware non-loopback configurato correttamente

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

    - `gateway.remote.token` / `.password` **non** abilitano da soli l'auth del gateway locale.
    - I percorsi di chiamata locali possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
    - Per l'auth con password, imposta invece `gateway.auth.mode: "password"` più `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modalità fail-closed (nessun fallback remoto che mascheri il problema).
    - Le configurazioni Control UI con secret condiviso si autenticano tramite `connect.params.auth.token` o `connect.params.auth.password` (memorizzati nelle impostazioni app/UI). Le modalità con identità come Tailscale Serve o `trusted-proxy` usano invece gli header della richiesta. Evita di inserire secret condivisi negli URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, i proxy inversi loopback sullo stesso host continuano a **non** soddisfare l'auth trusted-proxy. Il trusted proxy deve essere una sorgente non-loopback configurata.

  </Accordion>

  <Accordion title="Perché adesso mi serve un token su localhost?">
    OpenClaw applica l'auth del gateway per impostazione predefinita, incluso il loopback. Nel percorso predefinito normale ciò significa auth con token: se non è configurato alcun percorso auth esplicito, l'avvio del gateway si risolve in modalità token e ne genera automaticamente uno, salvandolo in `gateway.auth.token`, quindi **i client WS locali devono autenticarsi**. Questo blocca altri processi locali dal chiamare il Gateway.

    Se preferisci un percorso auth diverso, puoi scegliere esplicitamente la modalità password (o, per proxy inversi identity-aware non-loopback, `trusted-proxy`). Se **vuoi davvero** loopback aperto, imposta esplicitamente `gateway.auth.mode: "none"` nella tua configurazione. Doctor può generarti un token in qualsiasi momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Devo riavviare dopo aver cambiato la configurazione?">
    Il Gateway osserva la configurazione e supporta hot-reload:

    - `gateway.reload.mode: "hybrid"` (predefinito): applica a caldo le modifiche sicure, riavvia per quelle critiche
    - Sono supportati anche `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Come disabilito i tagline divertenti della CLI?">
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

    - `off`: nasconde il testo del tagline ma mantiene la riga titolo/versione del banner.
    - `default`: usa sempre `All your chats, one OpenClaw.`.
    - `random`: tagline rotanti divertenti/stagionali (comportamento predefinito).
    - Se non vuoi alcun banner, imposta l'env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Come abilito la ricerca web (e il recupero web)?">
    `web_fetch` funziona senza chiave API. `web_search` dipende dal provider
    selezionato:

    - I provider supportati da API come Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity e Tavily richiedono la normale configurazione della chiave API.
    - Ollama Web Search non richiede chiavi, ma usa l'host Ollama configurato e richiede `ollama signin`.
    - DuckDuckGo non richiede chiavi, ma è un'integrazione non ufficiale basata su HTML.
    - SearXNG è senza chiavi/self-hosted; configura `SEARXNG_BASE_URL` oppure `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Consigliato:** esegui `openclaw configure --section web` e scegli un provider.
    Alternative tramite ambiente:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` oppure `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` oppure `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` oppure `OPENROUTER_API_KEY`
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
              provider: "firecrawl", // facoltativo; ometti per auto-detect
            },
          },
        },
    }
    ```

    La configurazione provider-specifica della ricerca web ora si trova in `plugins.entries.<plugin>.config.webSearch.*`.
    I percorsi provider legacy `tools.web.search.*` vengono ancora caricati temporaneamente per compatibilità, ma non dovrebbero essere usati per nuove configurazioni.
    La configurazione fallback di web-fetch Firecrawl si trova in `plugins.entries.firecrawl.config.webFetch.*`.

    Note:

    - Se usi allowlist, aggiungi `web_search`/`web_fetch`/`x_search` oppure `group:web`.
    - `web_fetch` è abilitato per impostazione predefinita (a meno che non venga esplicitamente disabilitato).
    - Se `tools.web.fetch.provider` viene omesso, OpenClaw rileva automaticamente il primo provider fallback di fetch pronto in base alle credenziali disponibili. Oggi il provider bundled è Firecrawl.
    - I demoni leggono le variabili env da `~/.openclaw/.env` (oppure dall'ambiente del servizio).

    Documentazione: [Strumenti web](/it/tools/web).

  </Accordion>

  <Accordion title="config.apply ha cancellato la mia configurazione. Come recupero ed evito che succeda di nuovo?">
    `config.apply` sostituisce **l'intera configurazione**. Se invii un oggetto parziale, tutto il
    resto viene rimosso.

    L'OpenClaw attuale protegge da molti clobber accidentali:

    - Le scritture di configurazione possedute da OpenClaw convalidano l'intera configurazione post-modifica prima di scrivere.
    - Le scritture possedute da OpenClaw non valide o distruttive vengono rifiutate e salvate come `openclaw.json.rejected.*`.
    - Se una modifica diretta rompe l'avvio o l'hot reload, il Gateway ripristina l'ultima configurazione valida nota e salva il file rifiutato come `openclaw.json.clobbered.*`.
    - Dopo il ripristino l'agente principale riceve un avviso di avvio, così non riscrive ciecamente la configurazione errata.

    Recupero:

    - Controlla `openclaw logs --follow` per `Config auto-restored from last-known-good`, `Config write rejected:` o `config reload restored last-known-good config`.
    - Ispeziona il più recente `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` accanto alla configurazione attiva.
    - Mantieni la configurazione ripristinata attiva se funziona, poi ricopia solo le chiavi desiderate con `openclaw config set` oppure `config.patch`.
    - Esegui `openclaw config validate` e `openclaw doctor`.
    - Se non hai alcun payload valido noto o rifiutato, ripristina da backup oppure riesegui `openclaw doctor` e riconfigura canali/modelli.
    - Se questo è stato inatteso, apri un bug e includi l'ultima configurazione nota o qualsiasi backup.
    - Un agente di coding locale spesso può ricostruire una configurazione funzionante da log o cronologia.

    Per evitarlo:

    - Usa `openclaw config set` per piccole modifiche.
    - Usa `openclaw configure` per modifiche interattive.
    - Usa prima `config.schema.lookup` quando non sei sicuro di un percorso esatto o della forma di un campo; restituisce un nodo di schema superficiale più i riepiloghi immediati dei figli per il drill-down.
    - Usa `config.patch` per modifiche RPC parziali; riserva `config.apply` solo alla sostituzione completa della configurazione.
    - Se stai usando lo strumento `gateway` solo proprietario da un'esecuzione dell'agente, rifiuterà comunque le scritture a `tools.exec.ask` / `tools.exec.security` (incluse le alias legacy `tools.bash.*` che vengono normalizzate sugli stessi percorsi exec protetti).

    Documentazione: [Config](/it/cli/config), [Configure](/it/cli/configure), [Troubleshooting del Gateway](/it/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/it/gateway/doctor).

  </Accordion>

  <Accordion title="Come posso eseguire un Gateway centrale con worker specializzati su più dispositivi?">
    Il modello comune è **un solo Gateway** (ad esempio Raspberry Pi) più **Node** e **agenti**:

    - **Gateway (centrale):** possiede i canali (Signal/WhatsApp), l'instradamento e le sessioni.
    - **Node (dispositivi):** Mac/iOS/Android si connettono come periferiche ed espongono strumenti locali (`system.run`, `canvas`, `camera`).
    - **Agenti (worker):** cervelli/spazi di lavoro separati per ruoli specializzati (ad es. "Hetzner ops", "Dati personali").
    - **Sottoagenti:** avviano lavoro in background da un agente principale quando vuoi parallelismo.
    - **TUI:** si connette al Gateway e consente di cambiare agenti/sessioni.

    Documentazione: [Node](/it/nodes), [Accesso remoto](/it/gateway/remote), [Instradamento Multi-Agent](/it/concepts/multi-agent), [Sottoagenti](/it/tools/subagents), [TUI](/it/web/tui).

  </Accordion>

  <Accordion title="Il browser di OpenClaw può essere eseguito headless?">
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

    Il valore predefinito è `false` (headful). Headless ha più probabilità di attivare controlli anti-bot su alcuni siti. Vedi [Browser](/it/tools/browser).

    La modalità headless usa lo **stesso motore Chromium** e funziona per la maggior parte dell'automazione (moduli, clic, scraping, login). Le principali differenze:

    - Nessuna finestra del browser visibile (usa screenshot se ti servono elementi visivi).
    - Alcuni siti sono più rigidi con l'automazione in modalità headless (CAPTCHA, anti-bot).
      Per esempio, X/Twitter spesso blocca le sessioni headless.

  </Accordion>

  <Accordion title="Come uso Brave per il controllo del browser?">
    Imposta `browser.executablePath` sul binario di Brave (o di qualsiasi browser basato su Chromium) e riavvia il Gateway.
    Vedi gli esempi completi di configurazione in [Browser](/it/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway remoti e Node

<AccordionGroup>
  <Accordion title="Come si propagano i comandi tra Telegram, il gateway e i Node?">
    I messaggi Telegram sono gestiti dal **gateway**. Il gateway esegue l'agente e
    solo dopo chiama i Node tramite il **Gateway WebSocket** quando è necessario uno strumento Node:

    Telegram → Gateway → Agente → `node.*` → Node → Gateway → Telegram

    I Node non vedono il traffico in ingresso del provider; ricevono solo chiamate RPC dei Node.

  </Accordion>

  <Accordion title="Come può il mio agente accedere al mio computer se il Gateway è ospitato in remoto?">
    Risposta breve: **associa il tuo computer come Node**. Il Gateway viene eseguito altrove, ma può
    chiamare strumenti `node.*` (schermo, fotocamera, sistema) sulla tua macchina locale tramite il Gateway WebSocket.

    Configurazione tipica:

    1. Esegui il Gateway sull'host sempre attivo (VPS/server domestico).
    2. Metti l'host del Gateway + il tuo computer sulla stessa tailnet.
    3. Assicurati che il Gateway WS sia raggiungibile (bind tailnet o tunnel SSH).
    4. Apri l'app macOS localmente e connettiti in modalità **Remote over SSH** (o tailnet diretta)
       in modo che possa registrarsi come Node.
    5. Approva il Node sul Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Non è richiesto alcun bridge TCP separato; i Node si connettono tramite il Gateway WebSocket.

    Promemoria di sicurezza: associare un macOS Node consente `system.run` su quella macchina. Associa
    solo dispositivi di cui ti fidi e consulta [Sicurezza](/it/gateway/security).

    Documentazione: [Node](/it/nodes), [Protocollo Gateway](/it/gateway/protocol), [modalità remota macOS](/it/platforms/mac/remote), [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Tailscale è connesso ma non ricevo risposte. E adesso?">
    Controlla le basi:

    - Il Gateway è in esecuzione: `openclaw gateway status`
    - Stato di salute del Gateway: `openclaw status`
    - Stato di salute del canale: `openclaw channels status`

    Poi verifica auth e instradamento:

    - Se usi Tailscale Serve, assicurati che `gateway.auth.allowTailscale` sia impostato correttamente.
    - Se ti connetti tramite tunnel SSH, conferma che il tunnel locale sia attivo e punti alla porta corretta.
    - Conferma che le tue allowlist (DM o gruppo) includano il tuo account.

    Documentazione: [Tailscale](/it/gateway/tailscale), [Accesso remoto](/it/gateway/remote), [Canali](/it/channels).

  </Accordion>

  <Accordion title="Due istanze OpenClaw possono parlarsi tra loro (locale + VPS)?">
    Sì. Non esiste un bridge "bot-to-bot" integrato, ma puoi collegarlo in alcuni
    modi affidabili:

    **Più semplice:** usa un normale canale chat a cui entrambi i bot possono accedere (Telegram/Slack/WhatsApp).
    Fai in modo che il Bot A invii un messaggio al Bot B, poi lascia che il Bot B risponda come al solito.

    **Bridge CLI (generico):** esegui uno script che chiami l'altro Gateway con
    `openclaw agent --message ... --deliver`, puntando a una chat in cui l'altro bot
    è in ascolto. Se uno dei bot è su un VPS remoto, punta la tua CLI a quel Gateway remoto
    tramite SSH/Tailscale (vedi [Accesso remoto](/it/gateway/remote)).

    Modello di esempio (esegui da una macchina che può raggiungere il Gateway di destinazione):

    ```bash
    openclaw agent --message "Ciao dal bot locale" --deliver --channel telegram --reply-to <chat-id>
    ```

    Suggerimento: aggiungi un guardrail per evitare che i due bot entrino in loop infinito (solo menzione, allowlist
    dei canali o una regola "non rispondere ai messaggi del bot").

    Documentazione: [Accesso remoto](/it/gateway/remote), [CLI agente](/it/cli/agent), [Invio agente](/it/tools/agent-send).

  </Accordion>

  <Accordion title="Mi servono VPS separati per più agenti?">
    No. Un Gateway può ospitare più agenti, ciascuno con il proprio spazio di lavoro, i propri valori predefiniti del modello
    e il proprio instradamento. Questa è la configurazione normale ed è molto più economica e semplice rispetto a eseguire
    un VPS per agente.

    Usa VPS separati solo quando ti serve isolamento rigido (confini di sicurezza) o configurazioni molto
    diverse che non vuoi condividere. Altrimenti, mantieni un solo Gateway e
    usa più agenti o sottoagenti.

  </Accordion>

  <Accordion title="C'è un vantaggio nell'usare un Node sul mio laptop personale invece di SSH da un VPS?">
    Sì - i Node sono il modo di prima classe per raggiungere il tuo laptop da un Gateway remoto e
    sbloccano più del semplice accesso shell. Il Gateway gira su macOS/Linux (Windows tramite WSL2) ed è
    leggero (va bene un piccolo VPS o una macchina tipo Raspberry Pi; 4 GB di RAM bastano), quindi una configurazione comune
    è un host sempre attivo più il tuo laptop come Node.

    - **Nessun SSH in ingresso richiesto.** I Node si connettono in uscita al Gateway WebSocket e usano l'associazione del dispositivo.
    - **Controlli di esecuzione più sicuri.** `system.run` è controllato da allowlist/approvazioni del Node su quel laptop.
    - **Più strumenti del dispositivo.** I Node espongono `canvas`, `camera` e `screen` oltre a `system.run`.
    - **Automazione del browser locale.** Mantieni il Gateway su un VPS, ma esegui Chrome localmente tramite un host Node sul laptop, oppure collegati a Chrome locale sull'host tramite Chrome MCP.

    SSH va bene per accesso shell ad hoc, ma i Node sono più semplici per flussi di lavoro continui dell'agente e
    automazione del dispositivo.

    Documentazione: [Node](/it/nodes), [CLI Node](/it/cli/nodes), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="I Node eseguono un servizio gateway?">
    No. Solo **un gateway** dovrebbe essere eseguito per host a meno che tu non stia eseguendo intenzionalmente profili isolati (vedi [Più gateway](/it/gateway/multiple-gateways)). I Node sono periferiche che si collegano
    al gateway (Node iOS/Android, oppure "node mode" macOS nell'app della menubar). Per host
    Node headless e controllo CLI, vedi [CLI host Node](/it/cli/node).

    È richiesto un riavvio completo per le modifiche a `gateway`, `discovery` e `canvasHost`.

  </Accordion>

  <Accordion title="Esiste un modo API / RPC per applicare la configurazione?">
    Sì.

    - `config.schema.lookup`: ispeziona un sottoalbero di configurazione con il suo nodo di schema superficiale, l'hint UI corrispondente e i riepiloghi immediati dei figli prima di scrivere
    - `config.get`: recupera lo snapshot corrente + hash
    - `config.patch`: aggiornamento parziale sicuro (preferito per la maggior parte delle modifiche RPC); hot-reload quando possibile e riavvio quando necessario
    - `config.apply`: convalida + sostituisce la configurazione completa; hot-reload quando possibile e riavvio quando necessario
    - Lo strumento runtime `gateway` solo proprietario continua a rifiutare la riscrittura di `tools.exec.ask` / `tools.exec.security`; le alias legacy `tools.bash.*` vengono normalizzate sugli stessi percorsi exec protetti

  </Accordion>

  <Accordion title="Configurazione minima sensata per una prima installazione">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Questo imposta il tuo spazio di lavoro e limita chi può attivare il bot.

  </Accordion>

  <Accordion title="Come configuro Tailscale su un VPS e mi connetto dal mio Mac?">
    Passaggi minimi:

    1. **Installa + fai login sul VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installa + fai login sul tuo Mac**
       - Usa l'app Tailscale ed effettua l'accesso alla stessa tailnet.
    3. **Abilita MagicDNS (consigliato)**
       - Nella console amministrativa di Tailscale, abilita MagicDNS così il VPS avrà un nome stabile.
    4. **Usa il nome host della tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se vuoi la Control UI senza SSH, usa Tailscale Serve sul VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Questo mantiene il gateway collegato a loopback ed espone HTTPS tramite Tailscale. Vedi [Tailscale](/it/gateway/tailscale).

  </Accordion>

  <Accordion title="Come collego un macOS Node a un Gateway remoto (Tailscale Serve)?">
    Serve espone la **Gateway Control UI + WS**. I Node si connettono tramite lo stesso endpoint Gateway WS.

    Configurazione consigliata:

    1. **Assicurati che VPS + Mac siano sulla stessa tailnet**.
    2. **Usa l'app macOS in modalità Remote** (la destinazione SSH può essere il nome host della tailnet).
       L'app farà tunneling della porta del Gateway e si connetterà come Node.
    3. **Approva il Node** sul gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentazione: [Protocollo Gateway](/it/gateway/protocol), [Discovery](/it/gateway/discovery), [modalità remota macOS](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dovrei installare su un secondo laptop o semplicemente aggiungere un Node?">
    Se ti servono solo **strumenti locali** (schermo/fotocamera/exec) sul secondo laptop, aggiungilo come
    **Node**. In questo modo mantieni un solo Gateway ed eviti configurazioni duplicate. Gli strumenti Node locali sono
    attualmente solo per macOS, ma prevediamo di estenderli ad altri sistemi operativi.

    Installa un secondo Gateway solo quando hai bisogno di **isolamento rigido** o di due bot completamente separati.

    Documentazione: [Node](/it/nodes), [CLI Node](/it/cli/nodes), [Più gateway](/it/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variabili env e caricamento di .env

<AccordionGroup>
  <Accordion title="Come carica le variabili di ambiente OpenClaw?">
    OpenClaw legge le variabili env dal processo padre (shell, launchd/systemd, CI, ecc.) e inoltre carica:

    - `.env` dalla directory di lavoro corrente
    - un fallback globale `.env` da `~/.openclaw/.env` (ovvero `$OPENCLAW_STATE_DIR/.env`)

    Nessuno dei due file `.env` sovrascrive le variabili env esistenti.

    Puoi anche definire variabili env inline nella configurazione (applicate solo se mancanti nell'env del processo):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Vedi [/environment](/it/help/environment) per precedenza e sorgenti complete.

  </Accordion>

  <Accordion title="Ho avviato il Gateway tramite il servizio e le mie variabili env sono sparite. E adesso?">
    Due correzioni comuni:

    1. Inserisci le chiavi mancanti in `~/.openclaw/.env` così vengono recuperate anche quando il servizio non eredita l'env della tua shell.
    2. Abilita l'import della shell (comodità opt-in):

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

    Questo esegue la tua shell di login e importa solo le chiavi attese mancanti (non sovrascrive mai). Equivalenti come variabile env:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ho impostato COPILOT_GITHUB_TOKEN, ma models status mostra "Shell env: off." Perché?'>
    `openclaw models status` segnala se l'**import della shell env** è abilitato. "Shell env: off"
    **non** significa che le tue variabili env manchino - significa solo che OpenClaw non caricherà
    automaticamente la tua shell di login.

    Se il Gateway viene eseguito come servizio (launchd/systemd), non erediterà l'ambiente
    della tua shell. Correggi in uno di questi modi:

    1. Inserisci il token in `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oppure abilita l'import della shell (`env.shellEnv.enabled: true`).
    3. Oppure aggiungilo al blocco `env` della tua configurazione (si applica solo se manca).

    Poi riavvia il gateway e ricontrolla:

    ```bash
    openclaw models status
    ```

    I token Copilot vengono letti da `COPILOT_GITHUB_TOKEN` (anche `GH_TOKEN` / `GITHUB_TOKEN`).
    Vedi [/concepts/model-providers](/it/concepts/model-providers) e [/environment](/it/help/environment).

  </Accordion>
</AccordionGroup>

## Sessioni e più chat

<AccordionGroup>
  <Accordion title="Come avvio una nuova conversazione?">
    Invia `/new` oppure `/reset` come messaggio standalone. Vedi [Gestione della sessione](/it/concepts/session).
  </Accordion>

  <Accordion title="Le sessioni si reimpostano automaticamente se non invio mai /new?">
    Le sessioni possono scadere dopo `session.idleMinutes`, ma questo è **disabilitato per impostazione predefinita** (predefinito **0**).
    Impostalo su un valore positivo per abilitare la scadenza per inattività. Quando è abilitata, il **messaggio successivo**
    dopo il periodo di inattività avvia un nuovo ID sessione per quella chiave chat.
    Questo non elimina le trascrizioni - avvia solo una nuova sessione.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="C'è un modo per creare un team di istanze OpenClaw (un CEO e molti agenti)?">
    Sì, tramite **instradamento multi-agent** e **sottoagenti**. Puoi creare un agente coordinatore
    e diversi agenti worker con i propri spazi di lavoro e modelli.

    Detto questo, è meglio considerarlo come un **esperimento divertente**. Consuma molti token e spesso
    è meno efficiente che usare un solo bot con sessioni separate. Il modello tipico che
    immaginiamo è un solo bot con cui parlare, con sessioni diverse per il lavoro parallelo. Quel
    bot può anche avviare sottoagenti quando necessario.

    Documentazione: [Instradamento multi-agent](/it/concepts/multi-agent), [Sottoagenti](/it/tools/subagents), [CLI agenti](/it/cli/agents).

  </Accordion>

  <Accordion title="Perché il contesto è stato troncato a metà attività? Come posso evitarlo?">
    Il contesto della sessione è limitato dalla finestra del modello. Chat lunghe, output di strumenti di grandi dimensioni o molti
    file possono attivare Compaction o troncamento.

    Cosa aiuta:

    - Chiedi al bot di riassumere lo stato corrente e di scriverlo in un file.
    - Usa `/compact` prima di attività lunghe e `/new` quando cambi argomento.
    - Tieni il contesto importante nello spazio di lavoro e chiedi al bot di rileggerlo.
    - Usa sottoagenti per lavoro lungo o parallelo così la chat principale resta più piccola.
    - Scegli un modello con una finestra di contesto più grande se questo succede spesso.

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

    Poi riesegui la configurazione iniziale:

    ```bash
    openclaw onboard --install-daemon
    ```

    Note:

    - L'onboarding offre anche **Reset** se vede una configurazione esistente. Vedi [Onboarding (CLI)](/it/start/wizard).
    - Se hai usato profili (`--profile` / `OPENCLAW_PROFILE`), reimposta ogni directory di stato (le predefinite sono `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (solo dev; cancella config + credenziali + sessioni + spazio di lavoro dev).

  </Accordion>

  <Accordion title='Ricevo errori "context too large" - come posso reimpostare o compattare?'>
    Usa una di queste opzioni:

    - **Compatta** (mantiene la conversazione ma riassume i turni più vecchi):

      ```
      /compact
      ```

      oppure `/compact <instructions>` per guidare il riepilogo.

    - **Resetta** (nuovo ID sessione per la stessa chiave chat):

      ```
      /new
      /reset
      ```

    Se continua a succedere:

    - Abilita o regola la **potatura della sessione** (`agents.defaults.contextPruning`) per ridurre l'output degli strumenti più vecchi.
    - Usa un modello con una finestra di contesto più grande.

    Documentazione: [Compaction](/it/concepts/compaction), [Potatura della sessione](/it/concepts/session-pruning), [Gestione della sessione](/it/concepts/session).

  </Accordion>

  <Accordion title='Perché vedo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Questo è un errore di validazione del provider: il modello ha emesso un blocco `tool_use` senza il campo
    `input` richiesto. Di solito significa che la cronologia della sessione è obsoleta o corrotta (spesso dopo thread lunghi
    o una modifica di strumento/schema).

    Correzione: avvia una nuova sessione con `/new` (messaggio standalone).

  </Accordion>

  <Accordion title="Perché ricevo messaggi Heartbeat ogni 30 minuti?">
    Gli Heartbeat vengono eseguiti ogni **30m** per impostazione predefinita (**1h** quando si usa auth OAuth). Regolali o disabilitali:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // oppure "0m" per disabilitare
          },
        },
      },
    }
    ```

    Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e header markdown
    come `# Heading`), OpenClaw salta l'esecuzione Heartbeat per risparmiare chiamate API.
    Se il file manca, Heartbeat viene comunque eseguito e il modello decide cosa fare.

    Gli override per agente usano `agents.list[].heartbeat`. Documentazione: [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title='Devo aggiungere un "account bot" a un gruppo WhatsApp?'>
    No. OpenClaw viene eseguito sul **tuo account**, quindi se sei nel gruppo, OpenClaw può vederlo.
    Per impostazione predefinita, le risposte di gruppo sono bloccate finché non autorizzi i mittenti (`groupPolicy: "allowlist"`).

    Se vuoi che solo **tu** possa attivare le risposte del gruppo:

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
    Opzione 1 (più veloce): segui i log e invia un messaggio di test nel gruppo:

    ```bash
    openclaw logs --follow --json
    ```

    Cerca `chatId` (oppure `from`) che termina con `@g.us`, per esempio:
    `1234567890-1234567890@g.us`.

    Opzione 2 (se già configurato/in allowlist): elenca i gruppi dalla configurazione:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentazione: [WhatsApp](/it/channels/whatsapp), [Directory](/it/cli/directory), [Log](/it/cli/logs).

  </Accordion>

  <Accordion title="Perché OpenClaw non risponde in un gruppo?">
    Due cause comuni:

    - Il controllo delle menzioni è attivo (predefinito). Devi @menzionare il bot (oppure corrispondere a `mentionPatterns`).
    - Hai configurato `channels.whatsapp.groups` senza `"*"` e il gruppo non è in allowlist.

    Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).

  </Accordion>

  <Accordion title="Gruppi/thread condividono il contesto con i DM?">
    Per impostazione predefinita le chat dirette confluiscono nella sessione principale. Gruppi/canali hanno le proprie chiavi di sessione, e i topic Telegram / thread Discord sono sessioni separate. Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).
  </Accordion>

  <Accordion title="Quanti spazi di lavoro e agenti posso creare?">
    Nessun limite rigido. Decine (anche centinaia) vanno bene, ma fai attenzione a:

    - **Crescita del disco:** sessioni + trascrizioni vivono sotto `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo dei token:** più agenti significa più utilizzo concorrente del modello.
    - **Overhead operativo:** profili auth, spazi di lavoro e instradamento dei canali per agente.

    Suggerimenti:

    - Mantieni uno spazio di lavoro **attivo** per agente (`agents.defaults.workspace`).
    - Elimina le vecchie sessioni (cancella JSONL o voci dello store) se il disco cresce.
    - Usa `openclaw doctor` per individuare spazi di lavoro dispersi e mismatch dei profili.

  </Accordion>

  <Accordion title="Posso eseguire più bot o chat contemporaneamente (Slack), e come dovrei configurarlo?">
    Sì. Usa **Instradamento Multi-Agent** per eseguire più agenti isolati e instradare i messaggi in ingresso per
    canale/account/peer. Slack è supportato come canale e può essere associato ad agenti specifici.

    L'accesso al browser è potente ma non equivale a "fare qualsiasi cosa possa fare un umano" - anti-bot, CAPTCHA e MFA
    possono comunque bloccare l'automazione. Per il controllo del browser più affidabile, usa Chrome MCP locale sull'host,
    oppure usa CDP sulla macchina che esegue davvero il browser.

    Configurazione best practice:

    - Host Gateway sempre attivo (VPS/Mac mini).
    - Un agente per ruolo (binding).
    - Canali Slack associati a quegli agenti.
    - Browser locale tramite Chrome MCP o un Node quando necessario.

    Documentazione: [Instradamento Multi-Agent](/it/concepts/multi-agent), [Slack](/it/channels/slack),
    [Browser](/it/tools/browser), [Node](/it/nodes).

  </Accordion>
</AccordionGroup>

## Modelli, failover e profili auth

Le domande e risposte sui modelli — valori predefiniti, selezione, alias, cambio, failover, profili auth —
si trovano nella [FAQ dei modelli](/it/help/faq-models).

## Gateway: porte, "already running" e modalità remota

<AccordionGroup>
  <Accordion title="Quale porta usa il Gateway?">
    `gateway.port` controlla la singola porta multiplexata per WebSocket + HTTP (Control UI, hook, ecc.).

    Precedenza:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Perché openclaw gateway status dice "Runtime: running" ma "Connectivity probe: failed"?'>
    Perché "running" è la vista del **supervisore** (launchd/systemd/schtasks). Il probe di connettività è invece la CLI che si connette realmente al Gateway WebSocket.

    Usa `openclaw gateway status` e fidati di queste righe:

    - `Probe target:` (l'URL che il probe ha effettivamente usato)
    - `Listening:` (ciò che è effettivamente collegato alla porta)
    - `Last gateway error:` (causa radice comune quando il processo è vivo ma la porta non è in ascolto)

  </Accordion>

  <Accordion title='Perché openclaw gateway status mostra "Config (cli)" e "Config (service)" diversi?'>
    Stai modificando un file di configurazione mentre il servizio ne sta usando un altro (spesso un mismatch `--profile` / `OPENCLAW_STATE_DIR`).

    Correzione:

    ```bash
    openclaw gateway install --force
    ```

    Eseguilo dallo stesso `--profile` / ambiente che vuoi far usare al servizio.

  </Accordion>

  <Accordion title='Cosa significa "another gateway instance is already listening"?'>
    OpenClaw applica un lock runtime collegando immediatamente il listener WebSocket all'avvio (predefinito `ws://127.0.0.1:18789`). Se il bind fallisce con `EADDRINUSE`, genera `GatewayLockError` indicando che un'altra istanza è già in ascolto.

    Correzione: ferma l'altra istanza, libera la porta o esegui con `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Come eseguo OpenClaw in modalità remota (il client si connette a un Gateway altrove)?">
    Imposta `gateway.mode: "remote"` e punta a un URL WebSocket remoto, facoltativamente con credenziali remote a secret condiviso:

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
    - L'app macOS osserva il file di configurazione e cambia modalità in tempo reale quando questi valori cambiano.
    - `gateway.remote.token` / `.password` sono solo credenziali remote lato client; non abilitano da soli l'auth del gateway locale.

  </Accordion>

  <Accordion title='La Control UI dice "unauthorized" (o continua a riconnettersi). E adesso?'>
    Il percorso auth del gateway e il metodo auth della UI non corrispondono.

    Fatti (dal codice):

    - La Control UI mantiene il token in `sessionStorage` per la sessione della scheda browser corrente e l'URL del gateway selezionato, così i refresh nella stessa scheda continuano a funzionare senza ripristinare la persistenza del token a lunga durata in localStorage.
    - In caso di `AUTH_TOKEN_MISMATCH`, i client fidati possono tentare un retry limitato con un device token in cache quando il gateway restituisce hint di retry (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Quel retry con token in cache ora riusa gli scope approvati in cache memorizzati insieme al device token. I chiamanti espliciti `deviceToken` / `scopes` espliciti continuano comunque a mantenere il set di scope richiesto invece di ereditare gli scope in cache.
    - Fuori da quel percorso di retry, la precedenza auth di connessione è: token/password condiviso esplicito, poi `deviceToken` esplicito, poi device token memorizzato, poi bootstrap token.
    - I controlli di ambito del bootstrap token sono con prefisso ruolo. L'allowlist integrata degli operatori bootstrap soddisfa solo le richieste degli operatori; i ruoli node o altri ruoli non-operator necessitano comunque di scope sotto il proprio prefisso di ruolo.

    Correzione:

    - Più veloce: `openclaw dashboard` (stampa + copia l'URL della dashboard, prova ad aprirla; mostra un suggerimento SSH se headless).
    - Se non hai ancora un token: `openclaw doctor --generate-gateway-token`.
    - Se sei in remoto, crea prima il tunnel: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`.
    - Modalità secret condiviso: imposta `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oppure `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, quindi incolla il secret corrispondente nelle impostazioni della Control UI.
    - Modalità Tailscale Serve: assicurati che `gateway.auth.allowTailscale` sia abilitato e che tu stia aprendo l'URL Serve, non un URL loopback/tailnet grezzo che bypassa gli header di identità Tailscale.
    - Modalità trusted-proxy: assicurati di passare attraverso il proxy identity-aware non-loopback configurato, non attraverso un proxy loopback sullo stesso host o un URL grezzo del gateway.
    - Se il mismatch persiste dopo il retry singolo, ruota/riapprova il device token associato:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Se quel comando rotate dice che è stato negato, controlla due cose:
      - le sessioni dei dispositivi associati possono ruotare solo il **proprio** dispositivo a meno che non abbiano anche `operator.admin`
      - i valori `--scope` espliciti non possono superare gli scope operatore correnti del chiamante
    - Ancora bloccato? Esegui `openclaw status --all` e segui [Troubleshooting](/it/gateway/troubleshooting). Vedi [Dashboard](/it/web/dashboard) per i dettagli auth.

  </Accordion>

  <Accordion title="Ho impostato gateway.bind tailnet ma non riesce a collegarsi e non ascolta nulla">
    Il bind `tailnet` sceglie un IP Tailscale dalle interfacce di rete (100.64.0.0/10). Se la macchina non è su Tailscale (o l'interfaccia è giù), non c'è nulla a cui collegarsi.

    Correzione:

    - Avvia Tailscale su quell'host (in modo che abbia un indirizzo 100.x), oppure
    - passa a `gateway.bind: "loopback"` / `"lan"`.

    Nota: `tailnet` è esplicito. `auto` preferisce loopback; usa `gateway.bind: "tailnet"` quando vuoi un bind solo tailnet.

  </Accordion>

  <Accordion title="Posso eseguire più Gateway sullo stesso host?">
    Di solito no - un Gateway può eseguire più canali di messaggistica e agenti. Usa più Gateway solo quando hai bisogno di ridondanza (es: rescue bot) o isolamento rigido.

    Sì, ma devi isolare:

    - `OPENCLAW_CONFIG_PATH` (configurazione per istanza)
    - `OPENCLAW_STATE_DIR` (stato per istanza)
    - `agents.defaults.workspace` (isolamento dello spazio di lavoro)
    - `gateway.port` (porte uniche)

    Configurazione rapida (consigliata):

    - Usa `openclaw --profile <name> ...` per istanza (crea automaticamente `~/.openclaw-<name>`).
    - Imposta un `gateway.port` univoco nella configurazione di ogni profilo (oppure passa `--port` per esecuzioni manuali).
    - Installa un servizio per profilo: `openclaw --profile <name> gateway install`.

    I profili aggiungono anche un suffisso ai nomi del servizio (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guida completa: [Più gateway](/it/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Cosa significa "invalid handshake" / codice 1008?'>
    Il Gateway è un **server WebSocket** e si aspetta che il primissimo messaggio sia
    un frame `connect`. Se riceve qualcos'altro, chiude la connessione
    con **codice 1008** (violazione della policy).

    Cause comuni:

    - Hai aperto l'URL **HTTP** in un browser (`http://...`) invece di usare un client WS.
    - Hai usato la porta o il percorso sbagliato.
    - Un proxy o un tunnel ha rimosso gli header auth o ha inviato una richiesta non-Gateway.

    Correzioni rapide:

    1. Usa l'URL WS: `ws://<host>:18789` (oppure `wss://...` se HTTPS).
    2. Non aprire la porta WS in una normale scheda del browser.
    3. Se l'auth è attiva, includi il token/password nel frame `connect`.

    Se usi la CLI o la TUI, l'URL dovrebbe essere così:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Dettagli del protocollo: [Protocollo Gateway](/it/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Logging e debug

<AccordionGroup>
  <Accordion title="Dove sono i log?">
    File di log (strutturati):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Puoi impostare un percorso stabile tramite `logging.file`. Il livello del file di log è controllato da `logging.level`. La verbosità della console è controllata da `--verbose` e `logging.consoleLevel`.

    Coda dei log più rapida:

    ```bash
    openclaw logs --follow
    ```

    Log del servizio/supervisore (quando il gateway viene eseguito tramite launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` e `gateway.err.log` (predefinito: `~/.openclaw/logs/...`; i profili usano `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Vedi [Troubleshooting](/it/gateway/troubleshooting) per ulteriori dettagli.

  </Accordion>

  <Accordion title="Come avvio/fermo/riavvio il servizio Gateway?">
    Usa gli helper del gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Se esegui il gateway manualmente, `openclaw gateway --force` può riprendere la porta. Vedi [Gateway](/it/gateway).

  </Accordion>

  <Accordion title="Ho chiuso il terminale su Windows - come riavvio OpenClaw?">
    Esistono **due modalità di installazione Windows**:

    **1) WSL2 (consigliato):** il Gateway viene eseguito dentro Linux.

    Apri PowerShell, entra in WSL, poi riavvia:

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

    Se lo esegui manualmente (senza servizio), usa:

    ```powershell
    openclaw gateway run
    ```

    Documentazione: [Windows (WSL2)](/it/platforms/windows), [Runbook del servizio Gateway](/it/gateway).

  </Accordion>

  <Accordion title="Il Gateway è attivo ma le risposte non arrivano mai. Cosa devo controllare?">
    Inizia con un rapido controllo dello stato:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Cause comuni:

    - L'auth del modello non è caricata sull'**host del gateway** (controlla `models status`).
    - Il pairing/l'allowlist del canale blocca le risposte (controlla la configurazione del canale + i log).
    - WebChat/Dashboard è aperto senza il token corretto.

    Se sei in remoto, conferma che la connessione tunnel/Tailscale sia attiva e che il
    Gateway WebSocket sia raggiungibile.

    Documentazione: [Canali](/it/channels), [Troubleshooting](/it/gateway/troubleshooting), [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - e adesso?'>
    Di solito significa che la UI ha perso la connessione WebSocket. Controlla:

    1. Il Gateway è in esecuzione? `openclaw gateway status`
    2. Il Gateway è in salute? `openclaw status`
    3. La UI ha il token corretto? `openclaw dashboard`
    4. Se sei in remoto, il collegamento tunnel/Tailscale è attivo?

    Poi segui i log:

    ```bash
    openclaw logs --follow
    ```

    Documentazione: [Dashboard](/it/web/dashboard), [Accesso remoto](/it/gateway/remote), [Troubleshooting](/it/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands fallisce. Cosa devo controllare?">
    Inizia da log e stato del canale:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Poi fai corrispondere l'errore:

    - `BOT_COMMANDS_TOO_MUCH`: il menu Telegram ha troppe voci. OpenClaw riduce già al limite Telegram e ritenta con meno comandi, ma alcune voci del menu devono comunque essere eliminate. Riduci i comandi plugin/Skills/personalizzati, oppure disabilita `channels.telegram.commands.native` se non ti serve il menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` o errori di rete simili: se sei su un VPS o dietro un proxy, conferma che HTTPS in uscita sia consentito e che DNS funzioni per `api.telegram.org`.

    Se il Gateway è remoto, assicurati di guardare i log sull'host del Gateway.

    Documentazione: [Telegram](/it/channels/telegram), [Risoluzione dei problemi del canale](/it/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI non mostra output. Cosa devo controllare?">
    Per prima cosa conferma che il Gateway sia raggiungibile e che l'agente possa eseguire:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Nella TUI, usa `/status` per vedere lo stato corrente. Se ti aspetti risposte in un
    canale chat, assicurati che la consegna sia abilitata (`/deliver on`).

    Documentazione: [TUI](/it/web/tui), [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come fermo completamente e poi riavvio il Gateway?">
    Se hai installato il servizio:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Questo ferma/avvia il **servizio supervisionato** (launchd su macOS, systemd su Linux).
    Usalo quando il Gateway viene eseguito in background come demone.

    Se lo stai eseguendo in foreground, fermalo con Ctrl-C, poi:

    ```bash
    openclaw gateway run
    ```

    Documentazione: [Runbook del servizio Gateway](/it/gateway).

  </Accordion>

  <Accordion title="Spiegamelo semplice: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: riavvia il **servizio in background** (launchd/systemd).
    - `openclaw gateway`: esegue il gateway **in foreground** per questa sessione terminale.

    Se hai installato il servizio, usa i comandi gateway. Usa `openclaw gateway` quando
    vuoi un'esecuzione singola in foreground.

  </Accordion>

  <Accordion title="Il modo più rapido per ottenere più dettagli quando qualcosa fallisce">
    Avvia il Gateway con `--verbose` per ottenere più dettagli sulla console. Poi ispeziona il file di log per auth del canale, instradamento del modello ed errori RPC.
  </Accordion>
</AccordionGroup>

## Media e allegati

<AccordionGroup>
  <Accordion title="La mia Skill ha generato un'immagine/PDF, ma non è stato inviato nulla">
    Gli allegati in uscita dell'agente devono includere una riga `MEDIA:<path-or-url>` (su una riga separata). Vedi [Configurazione dell'assistente OpenClaw](/it/start/openclaw) e [Invio agente](/it/tools/agent-send).

    Invio da CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Ecco qui" --media /path/to/file.png
    ```

    Controlla anche:

    - Il canale di destinazione supporta i media in uscita e non è bloccato dalle allowlist.
    - Il file rientra nei limiti di dimensione del provider (le immagini vengono ridimensionate a max 2048px).
    - `tools.fs.workspaceOnly=true` mantiene gli invii di percorsi locali limitati allo spazio di lavoro, temp/media-store e file validati dalla sandbox.
    - `tools.fs.workspaceOnly=false` consente a `MEDIA:` di inviare file locali dell'host che l'agente può già leggere, ma solo per media più tipi di documenti sicuri (immagini, audio, video, PDF e documenti Office). I file di testo semplice e quelli simili a secret restano comunque bloccati.

    Vedi [Immagini](/it/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicurezza e controllo accessi

<AccordionGroup>
  <Accordion title="È sicuro esporre OpenClaw ai DM in ingresso?">
    Tratta i DM in ingresso come input non attendibile. I valori predefiniti sono progettati per ridurre il rischio:

    - Il comportamento predefinito sui canali con DM è **pairing**:
      - I mittenti sconosciuti ricevono un codice di pairing; il bot non elabora il loro messaggio.
      - Approva con: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Le richieste in sospeso sono limitate a **3 per canale**; controlla `openclaw pairing list --channel <channel> [--account <id>]` se un codice non è arrivato.
    - Aprire pubblicamente i DM richiede un opt-in esplicito (`dmPolicy: "open"` e allowlist `"*"`).

    Esegui `openclaw doctor` per individuare criteri DM rischiosi.

  </Accordion>

  <Accordion title="La prompt injection è un problema solo per i bot pubblici?">
    No. La prompt injection riguarda il **contenuto non attendibile**, non solo chi può inviare DM al bot.
    Se il tuo assistente legge contenuti esterni (ricerca/recupero web, pagine del browser, email,
    documenti, allegati, log incollati), quel contenuto può includere istruzioni che provano
    a dirottare il modello. Questo può succedere anche se **sei l'unico mittente**.

    Il rischio maggiore si ha quando gli strumenti sono abilitati: il modello può essere indotto a
    esfiltrare contesto o a chiamare strumenti per tuo conto. Riduci il raggio d'impatto:

    - usando un agente "reader" in sola lettura o senza strumenti per riassumere contenuti non attendibili
    - mantenendo `web_search` / `web_fetch` / `browser` disattivati per gli agenti con strumenti abilitati
    - trattando anche il testo decodificato di file/documenti come non attendibile: OpenResponses
      `input_file` e l'estrazione di allegati media racchiudono entrambi il testo estratto in
      marcatori espliciti di confine del contenuto esterno invece di passare testo grezzo del file
    - usando sandboxing e allowlist rigorose degli strumenti

    Dettagli: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Il mio bot dovrebbe avere una sua email, un account GitHub o un numero di telefono?">
    Sì, per la maggior parte delle configurazioni. Isolare il bot con account e numeri di telefono separati
    riduce il raggio d'impatto se qualcosa va storto. Questo rende anche più facile ruotare
    le credenziali o revocare l'accesso senza impattare i tuoi account personali.

    Inizia in piccolo. Concedi accesso solo agli strumenti e agli account di cui hai effettivamente bisogno, ed espandi
    in seguito se necessario.

    Documentazione: [Sicurezza](/it/gateway/security), [Abbinamento](/it/channels/pairing).

  </Accordion>

  <Accordion title="Posso dargli autonomia sui miei messaggi di testo ed è sicuro?">
    **Non** consigliamo piena autonomia sui tuoi messaggi personali. Il modello più sicuro è:

    - Mantieni i DM in **modalità pairing** o con un'allowlist stretta.
    - Usa un **numero o account separato** se vuoi che invii messaggi a tuo nome.
    - Lascia che prepari una bozza, poi **approva prima dell'invio**.

    Se vuoi sperimentare, fallo su un account dedicato e mantienilo isolato. Vedi
    [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Posso usare modelli più economici per attività da assistente personale?">
    Sì, **se** l'agente è solo chat e l'input è attendibile. I tier più piccoli sono
    più soggetti a hijacking delle istruzioni, quindi evitali per gli agenti con strumenti abilitati
    o quando leggono contenuti non attendibili. Se devi usare un modello più piccolo, blocca
    gli strumenti ed esegui in una sandbox. Vedi [Sicurezza](/it/gateway/security).
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
    No. Il criterio DM predefinito di WhatsApp è **pairing**. I mittenti sconosciuti ricevono solo un codice di pairing e il loro messaggio **non viene elaborato**. OpenClaw risponde solo alle chat che riceve o agli invii espliciti che attivi tu.

    Approva il pairing con:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Elenca le richieste in sospeso:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt del numero di telefono nel wizard: serve a impostare la tua **allowlist/proprietario** in modo che i tuoi DM siano consentiti. Non viene usato per l'invio automatico. Se esegui OpenClaw sul tuo numero WhatsApp personale, usa quel numero e abilita `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandi chat, interruzione delle attività e "non si ferma"

<AccordionGroup>
  <Accordion title="Come faccio a impedire che i messaggi di sistema interni vengano mostrati in chat?">
    La maggior parte dei messaggi interni o degli strumenti appare solo quando sono abilitati **verbose**, **trace** o **reasoning**
    per quella sessione.

    Correzione nella chat in cui li vedi:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Se è ancora rumoroso, controlla le impostazioni della sessione nella Control UI e imposta verbose
    su **inherit**. Conferma anche di non usare un profilo bot con `verboseDefault` impostato
    su `on` nella configurazione.

    Documentazione: [Thinking e verbose](/it/tools/thinking), [Sicurezza](/it/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Come fermo/annullo un'attività in esecuzione?">
    Invia una di queste **come messaggio standalone** (senza slash):

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

    La maggior parte dei comandi deve essere inviata come messaggio **standalone** che inizia con `/`, ma alcune scorciatoie (come `/status`) funzionano anche inline per i mittenti in allowlist.

  </Accordion>

  <Accordion title='Come invio un messaggio Discord da Telegram? ("Cross-context messaging denied")'>
    OpenClaw blocca per impostazione predefinita la messaggistica **cross-provider**. Se una chiamata di strumento è collegata
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

  <Accordion title='Perché sembra che il bot "ignori" i messaggi inviati in rapida successione?'>
    La modalità queue controlla come i nuovi messaggi interagiscono con un'esecuzione in corso. Usa `/queue` per cambiare modalità:

    - `steer` - i nuovi messaggi reindirizzano l'attività corrente
    - `followup` - esegue i messaggi uno alla volta
    - `collect` - raggruppa i messaggi e risponde una volta sola (predefinito)
    - `steer-backlog` - reindirizza ora, poi elabora l'arretrato
    - `interrupt` - interrompe l'esecuzione corrente e ne avvia una nuova

    Puoi aggiungere opzioni come `debounce:2s cap:25 drop:summarize` per le modalità followup.

  </Accordion>
</AccordionGroup>

## Varie

<AccordionGroup>
  <Accordion title='Qual è il modello predefinito per Anthropic con una chiave API?'>
    In OpenClaw, credenziali e selezione del modello sono separate. Impostare `ANTHROPIC_API_KEY` (o archiviare una chiave API Anthropic nei profili auth) abilita l'autenticazione, ma il modello predefinito effettivo è quello che configuri in `agents.defaults.model.primary` (ad esempio, `anthropic/claude-sonnet-4-6` oppure `anthropic/claude-opus-4-6`). Se vedi `No credentials found for profile "anthropic:default"`, significa che il Gateway non è riuscito a trovare credenziali Anthropic nel file `auth-profiles.json` previsto per l'agente in esecuzione.
  </Accordion>
</AccordionGroup>

---

Ancora bloccato? Chiedi in [Discord](https://discord.com/invite/clawd) oppure apri una [discussione su GitHub](https://github.com/openclaw/openclaw/discussions).

## Correlati

- [FAQ del primo avvio](/it/help/faq-first-run) — installazione, onboarding, auth, abbonamenti, guasti iniziali
- [FAQ dei modelli](/it/help/faq-models) — selezione del modello, failover, profili auth
- [Troubleshooting](/it/help/troubleshooting) — triage guidato dai sintomi
