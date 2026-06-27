---
read_when:
    - Rispondere alle domande comuni di supporto su configurazione, installazione, onboarding o runtime
    - Triage dei problemi segnalati dagli utenti prima del debug più approfondito
summary: Domande frequenti su configurazione, impostazione e utilizzo di OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-06-27T17:37:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40b32792c202944576cd983ecf8bf794551bc50986d6b5c985a8ddfe0ecf0b34
    source_path: help/faq.md
    workflow: 16
---

Risposte rapide e risoluzione dei problemi più approfondita per configurazioni reali (sviluppo locale, VPS, multi-agent, OAuth/chiavi API, failover dei modelli). Per la diagnostica runtime, consulta [Risoluzione dei problemi](/it/gateway/troubleshooting). Per il riferimento completo della configurazione, consulta [Configurazione](/it/gateway/configuration).

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

   Diagnosi in sola lettura con coda dei log (token oscurati).

3. **Stato daemon + porta**

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

   Se RPC non è disponibile, ripiega su:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   I log su file sono separati dai log del servizio; consulta [Logging](/it/logging) e [Risoluzione dei problemi](/it/gateway/troubleshooting).

6. **Esegui il doctor (riparazioni)**

   ```bash
   openclaw doctor
   ```

   Ripara/migra configurazione/stato + esegue controlli di integrità. Consulta [Doctor](/it/gateway/doctor).

7. **Snapshot del Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Richiede al Gateway in esecuzione uno snapshot completo (solo WS). Consulta [Integrità](/it/gateway/health).

## Avvio rapido e configurazione al primo avvio

Le domande e risposte sul primo avvio — installazione, onboarding, percorsi di autenticazione, abbonamenti, errori iniziali —
si trovano nelle [FAQ sul primo avvio](/it/help/faq-first-run).

## Che cos'è OpenClaw?

<AccordionGroup>
  <Accordion title="Che cos'è OpenClaw, in un paragrafo?">
    OpenClaw è un assistente AI personale che esegui sui tuoi dispositivi. Risponde sulle superfici di messaggistica che usi già (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e Plugin di canale inclusi come QQ Bot) e può anche offrire voce + un Canvas live sulle piattaforme supportate. Il **Gateway** è il piano di controllo sempre attivo; l'assistente è il prodotto.
  </Accordion>

  <Accordion title="Proposta di valore">
    OpenClaw non è "solo un wrapper per Claude". È un **piano di controllo local-first** che ti consente di eseguire un
    assistente capace sul **tuo hardware**, raggiungibile dalle app di chat che usi già, con
    sessioni con stato, memoria e strumenti, senza cedere il controllo dei tuoi flussi di lavoro a un
    SaaS ospitato.

    Punti principali:

    - **I tuoi dispositivi, i tuoi dati:** esegui il Gateway dove vuoi (Mac, Linux, VPS) e mantieni
      workspace + cronologia delle sessioni in locale.
    - **Canali reali, non una sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ecc.,
      più voce mobile e Canvas sulle piattaforme supportate.
    - **Indipendente dal modello:** usa Anthropic, OpenAI, MiniMax, OpenRouter, ecc., con routing
      e failover per agente.
    - **Opzione solo locale:** esegui modelli locali in modo che **tutti i dati possano restare sul tuo dispositivo**, se vuoi.
    - **Routing multi-agent:** agenti separati per canale, account o attività, ciascuno con il proprio
      workspace e le proprie impostazioni predefinite.
    - **Open source e modificabile:** ispeziona, estendi e ospita autonomamente senza lock-in del fornitore.

    Documentazione: [Gateway](/it/gateway), [Canali](/it/channels), [Multi-agent](/it/concepts/multi-agent),
    [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="L'ho appena configurato: cosa dovrei fare per prima cosa?">
    Buoni primi progetti:

    - Creare un sito web (WordPress, Shopify o un semplice sito statico).
    - Prototipare un'app mobile (struttura, schermate, piano API).
    - Organizzare file e cartelle (pulizia, denominazione, tagging).
    - Collegare Gmail e automatizzare riepiloghi o follow-up.

    Può gestire attività grandi, ma funziona meglio quando le dividi in fasi e
    usi sotto-agenti per il lavoro in parallelo.

  </Accordion>

  <Accordion title="Quali sono i cinque principali casi d'uso quotidiani per OpenClaw?">
    I vantaggi quotidiani di solito assomigliano a:

    - **Briefing personali:** riepiloghi di posta in arrivo, calendario e notizie che ti interessano.
    - **Ricerca e stesura:** ricerche rapide, riepiloghi e prime bozze per email o documenti.
    - **Promemoria e follow-up:** solleciti e checklist guidati da Cron o Heartbeat.
    - **Automazione del browser:** compilazione di moduli, raccolta dati e ripetizione di attività web.
    - **Coordinamento tra dispositivi:** invia un'attività dal telefono, lascia che il Gateway la esegua su un server e ricevi il risultato in chat.

  </Accordion>

  <Accordion title="OpenClaw può aiutare con lead generation, outreach, annunci e blog per un SaaS?">
    Sì per **ricerca, qualificazione e stesura**. Può scansionare siti, creare shortlist,
    riassumere prospect e scrivere bozze di outreach o testi pubblicitari.

    Per **outreach o campagne pubblicitarie**, mantieni una persona nel ciclo. Evita lo spam, rispetta le leggi locali e
    le policy delle piattaforme, e rivedi tutto prima dell'invio. Lo schema più sicuro è lasciare che
    OpenClaw prepari le bozze e che tu approvi.

    Documentazione: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i vantaggi rispetto a Claude Code per lo sviluppo web?">
    OpenClaw è un **assistente personale** e un livello di coordinamento, non un sostituto dell'IDE. Usa
    Claude Code o Codex per il ciclo di codifica diretto più rapido dentro un repository. Usa OpenClaw quando
    vuoi memoria durevole, accesso tra dispositivi e orchestrazione degli strumenti.

    Vantaggi:

    - **Memoria persistente + workspace** tra sessioni
    - **Accesso multi-piattaforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestrazione degli strumenti** (browser, file, pianificazione, hook)
    - **Gateway sempre attivo** (eseguito su una VPS, interagisci da ovunque)
    - **Nodes** per browser/schermo/fotocamera/exec locali

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automazione

<AccordionGroup>
  <Accordion title="Come posso personalizzare le Skills senza mantenere il repository sporco?">
    Usa override gestiti invece di modificare la copia del repository. Metti le tue modifiche in `~/.openclaw/skills/<name>/SKILL.md` (oppure aggiungi una cartella tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json`). La precedenza è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluse → `skills.load.extraDirs`, quindi gli override gestiti vincono comunque sulle Skills incluse senza toccare git. Se devi installare la skill globalmente ma renderla visibile solo ad alcuni agenti, mantieni la copia condivisa in `~/.openclaw/skills` e controlla la visibilità con `agents.defaults.skills` e `agents.list[].skills`. Solo le modifiche adatte all'upstream dovrebbero vivere nel repository e uscire come PR.
  </Accordion>

  <Accordion title="Posso caricare Skills da una cartella personalizzata?">
    Sì. Aggiungi directory extra tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json` (precedenza più bassa). La precedenza predefinita è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluse → `skills.load.extraDirs`. `clawhub` installa in `./skills` per impostazione predefinita, che OpenClaw tratta come `<workspace>/skills` nella sessione successiva. Se la skill deve essere visibile solo a determinati agenti, abbinala a `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="Come posso usare modelli o impostazioni diversi per attività diverse?">
    Oggi gli schemi supportati sono:

    - **Job Cron**: i job isolati possono impostare un override `model` per job.
    - **Agenti**: indirizza le attività ad agenti separati con modelli predefiniti, livelli di ragionamento e parametri di stream diversi.
    - **Cambio su richiesta**: usa `/model` per cambiare il modello della sessione corrente in qualsiasi momento.

    Per esempio, usa lo stesso modello con impostazioni per agente diverse:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    Metti i valori predefiniti condivisi per modello in `agents.defaults.models["provider/model"].params`, poi metti gli override specifici dell'agente in `agents.list[].params` piatti. Non definire voci annidate separate `agents.list[].models["provider/model"].params` per lo stesso modello; `agents.list[].models` serve per catalogo modelli e override runtime per agente.

    Consulta [Job Cron](/it/automation/cron-jobs), [Routing multi-agent](/it/concepts/multi-agent), [Configurazione](/it/gateway/config-agents) e [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Il bot si blocca durante lavori pesanti. Come posso delegarli?">
    Usa **sotto-agenti** per attività lunghe o parallele. I sotto-agenti vengono eseguiti nella propria sessione,
    restituiscono un riepilogo e mantengono reattiva la tua chat principale.

    Chiedi al tuo bot di "spawn a sub-agent for this task" oppure usa `/subagents`.
    Usa `/status` in chat per vedere cosa sta facendo il Gateway in questo momento (e se è occupato).

    Suggerimento sui token: attività lunghe e sotto-agenti consumano entrambi token. Se il costo è un problema, imposta un
    modello più economico per i sotto-agenti tramite `agents.defaults.subagents.model`.

    Documentazione: [Sotto-agenti](/it/tools/subagents), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Come funzionano le sessioni di sotto-agenti vincolate ai thread su Discord?">
    Usa i vincoli dei thread. Puoi vincolare un thread Discord a un sotto-agente o a una destinazione di sessione, così i messaggi di follow-up in quel thread restano su quella sessione vincolata.

    Flusso di base:

    - Genera con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"` per follow-up persistenti).
    - Oppure vincola manualmente con `/focus <target>`.
    - Usa `/agents` per ispezionare lo stato dei vincoli.
    - Usa `/session idle <duration|off>` e `/session max-age <duration|off>` per controllare l'auto-unfocus.
    - Usa `/unfocus` per scollegare il thread.

    Configurazione richiesta:

    - Valori predefiniti globali: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind alla generazione: `channels.discord.threadBindings.spawnSessions` ha valore predefinito `true`; impostalo su `false` per disabilitare la generazione di sessioni vincolate ai thread.

    Documentazione: [Sotto-agenti](/it/tools/subagents), [Discord](/it/channels/discord), [Riferimento configurazione](/it/gateway/configuration-reference), [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Un sotto-agente ha finito, ma l'aggiornamento di completamento è andato nel posto sbagliato o non è mai stato pubblicato. Cosa devo controllare?">
    Controlla prima la route del richiedente risolta:

    - La consegna dei sotto-agenti in modalità completamento preferisce qualsiasi thread vincolato o route di conversazione quando ne esiste una.
    - Se l'origine del completamento contiene solo un canale, OpenClaw ripiega sulla route memorizzata della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta può comunque riuscire.
    - Se non esiste né una route vincolata né una route memorizzata utilizzabile, la consegna diretta può fallire e il risultato ripiega sulla consegna di sessione in coda invece di essere pubblicato subito in chat.
    - Destinazioni non valide o obsolete possono comunque forzare il fallback alla coda o il fallimento finale della consegna.
    - Se l'ultima risposta visibile dell'assistente figlio è il token silenzioso esatto `NO_REPLY` / `no_reply`, o esattamente `ANNOUNCE_SKIP`, OpenClaw sopprime intenzionalmente l'annuncio invece di pubblicare progressi precedenti obsoleti.
    - L'output tool/toolResult non viene promosso nel testo del risultato figlio; il risultato è l'ultima risposta visibile dell'assistente figlio.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Sub-agenti](/it/tools/subagents), [Attività in background](/it/automation/tasks), [Strumenti di sessione](/it/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o i promemoria non partono. Cosa devo controllare?">
    Cron viene eseguito all'interno del processo Gateway. Se il Gateway non rimane in esecuzione continua,
    i job pianificati non verranno eseguiti.

    Checklist:

    - Conferma che cron sia abilitato (`cron.enabled`) e che `OPENCLAW_SKIP_CRON` non sia impostato.
    - Controlla che il Gateway sia in esecuzione 24/7 (senza sospensione/riavvii).
    - Verifica le impostazioni del fuso orario per il job (`--tz` rispetto al fuso orario dell'host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Automazione](/it/automation).

  </Accordion>

  <Accordion title="Cron è partito, ma non è stato inviato nulla al canale. Perché?">
    Controlla prima la modalità di recapito:

    - `--no-deliver` / `delivery.mode: "none"` significa che non è previsto alcun invio di fallback del runner.
    - Una destinazione di annuncio mancante o non valida (`channel` / `to`) significa che il runner ha saltato il recapito in uscita.
    - Errori di autorizzazione del canale (`unauthorized`, `Forbidden`) significano che il runner ha provato a recapitare, ma le credenziali lo hanno bloccato.
    - Un risultato isolato silenzioso (solo `NO_REPLY` / `no_reply`) viene trattato come intenzionalmente non recapitabile, quindi il runner sopprime anche il recapito di fallback in coda.

    Per i job Cron isolati, l'agente può comunque inviare direttamente con lo strumento `message`
    quando è disponibile una route di chat. `--announce` controlla solo il percorso di fallback
    del runner per il testo finale che l'agente non ha già inviato.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Perché un'esecuzione Cron isolata ha cambiato modello o ha riprovato una volta?">
    Di solito è il percorso di cambio modello live, non una pianificazione duplicata.

    Cron isolato può persistere un passaggio di consegne del modello runtime e riprovare quando l'esecuzione
    attiva genera `LiveSessionModelSwitchError`. Il nuovo tentativo mantiene il provider/modello
    cambiato e, se il cambio includeva un nuovo override del profilo di autenticazione, Cron
    persiste anche quello prima di riprovare.

    Regole di selezione correlate:

    - L'override del modello dell'hook Gmail vince per primo quando applicabile.
    - Poi `model` per job.
    - Poi qualsiasi override del modello di sessione Cron memorizzato.
    - Poi la normale selezione del modello agente/predefinito.

    Il ciclo di retry è limitato. Dopo il tentativo iniziale più 2 retry di cambio,
    Cron interrompe invece di entrare in un ciclo infinito.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [CLI Cron](/it/cli/cron).

  </Accordion>

  <Accordion title="Come installo Skills su Linux?">
    Usa i comandi nativi `openclaw skills` o inserisci le Skills nel tuo workspace. L'interfaccia utente Skills di macOS non è disponibile su Linux.
    Sfoglia le Skills su [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    `openclaw skills install` nativo scrive nella directory `skills/`
    del workspace attivo per impostazione predefinita. Aggiungi `--global` per installare nella directory
    Skills gestita condivisa per tutti gli agenti locali. Installa la CLI `clawhub`
    separata solo se vuoi pubblicare o sincronizzare le tue Skills. Usa
    `agents.defaults.skills` o `agents.list[].skills` se vuoi limitare
    quali agenti possono vedere le Skills condivise.

  </Accordion>

  <Accordion title="OpenClaw può eseguire attività secondo una pianificazione o continuamente in background?">
    Sì. Usa lo scheduler del Gateway:

    - **Job Cron** per attività pianificate o ricorrenti (persistono tra i riavvii).
    - **Heartbeat** per controlli periodici della "sessione principale".
    - **Job isolati** per agenti autonomi che pubblicano riepiloghi o recapitano nelle chat.

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Automazione](/it/automation),
    [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso eseguire Skills disponibili solo su Apple macOS da Linux?">
    Non direttamente. Le Skills macOS sono vincolate da `metadata.openclaw.os` più i binari richiesti, e le Skills compaiono nel prompt di sistema solo quando sono idonee sull'**host Gateway**. Su Linux, le Skills disponibili solo per `darwin` (come `apple-notes`, `apple-reminders`, `things-mac`) non verranno caricate a meno che tu non sovrascriva il gating.

    Hai tre pattern supportati:

    **Opzione A - esegui il Gateway su un Mac (più semplice).**
    Esegui il Gateway dove esistono i binari macOS, poi connettiti da Linux in [modalità remota](#gateway-ports-already-running-and-remote-mode) o tramite Tailscale. Le Skills vengono caricate normalmente perché l'host Gateway è macOS.

    **Opzione B - usa un nodo macOS (senza SSH).**
    Esegui il Gateway su Linux, abbina un nodo macOS (app nella barra dei menu) e imposta **Comandi di esecuzione Node** su "Chiedi sempre" o "Consenti sempre" sul Mac. OpenClaw può trattare le Skills disponibili solo su macOS come idonee quando i binari richiesti esistono sul nodo. L'agente esegue quelle Skills tramite lo strumento `nodes`. Se scegli "Chiedi sempre", approvare "Consenti sempre" nel prompt aggiunge quel comando alla allowlist.

    **Opzione C - inoltra i binari macOS tramite SSH (avanzato).**
    Mantieni il Gateway su Linux, ma fai in modo che i binari CLI richiesti si risolvano in wrapper SSH eseguiti su un Mac. Poi sovrascrivi la Skill per consentire Linux, così rimane idonea.

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

    - **Skill / Plugin personalizzato:** ideale per un accesso API affidabile (Notion/HeyGen hanno entrambe API).
    - **Automazione del browser:** funziona senza codice, ma è più lenta e più fragile.

    Se vuoi mantenere il contesto per cliente (workflow di agenzia), un pattern semplice è:

    - Una pagina Notion per cliente (contesto + preferenze + lavoro attivo).
    - Chiedi all'agente di recuperare quella pagina all'inizio di una sessione.

    Se vuoi un'integrazione nativa, apri una richiesta di funzionalità o crea una Skill
    che punti a quelle API.

    Installa Skills:

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    Le installazioni native finiscono nella directory `skills/` del workspace attivo. Per Skills condivise tra tutti gli agenti locali, usa `openclaw skills install @owner/<skill-slug> --global` (oppure inseriscile manualmente in `~/.openclaw/skills/<name>/SKILL.md`). Se solo alcuni agenti devono vedere un'installazione condivisa, configura `agents.defaults.skills` o `agents.list[].skills`. Alcune Skills si aspettano binari installati tramite Homebrew; su Linux questo significa Linuxbrew (vedi la voce FAQ su Homebrew Linux sopra). Vedi [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config) e [ClawHub](/it/clawhub).

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

    Questo percorso può usare il browser host locale o un nodo browser connesso. Se il Gateway viene eseguito altrove, esegui un host nodo sulla macchina del browser oppure usa invece CDP remoto.

    Limiti attuali di `existing-session` / `user`:

    - le azioni sono guidate da ref, non da selettori CSS
    - gli upload richiedono `ref` / `inputRef` e attualmente supportano un file alla volta
    - `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP raw

  </Accordion>
</AccordionGroup>

## Sandboxing e memoria

<AccordionGroup>
  <Accordion title="Esiste una documentazione dedicata al sandboxing?">
    Sì. Vedi [Sandboxing](/it/gateway/sandboxing). Per la configurazione specifica di Docker (Gateway completo in Docker o immagini sandbox), vedi [Docker](/it/install/docker).
  </Accordion>

  <Accordion title="Docker sembra limitato: come abilito tutte le funzionalità?">
    L'immagine predefinita privilegia la sicurezza ed è eseguita come utente `node`, quindi non
    include pacchetti di sistema, Homebrew o browser inclusi. Per una configurazione più completa:

    - Rendi persistente `/home/node` con `OPENCLAW_HOME_VOLUME` così le cache sopravvivono.
    - Integra le dipendenze di sistema nell'immagine con `OPENCLAW_IMAGE_APT_PACKAGES`.
    - Installa i browser Playwright tramite la CLI inclusa:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Imposta `PLAYWRIGHT_BROWSERS_PATH` e assicurati che il percorso sia persistente.

    Documentazione: [Docker](/it/install/docker), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="Posso mantenere personali i DM ma rendere pubblici/sandboxed i gruppi con un solo agente?">
    Sì, se il traffico privato è costituito da **DM** e il traffico pubblico da **gruppi**.

    Usa `agents.defaults.sandbox.mode: "non-main"` così le sessioni di gruppo/canale (chiavi non-main) vengono eseguite nel backend sandbox configurato, mentre la sessione DM principale rimane sull'host. Docker è il backend predefinito se non ne scegli uno. Poi limita quali strumenti sono disponibili nelle sessioni sandboxed tramite `tools.sandbox.tools`.

    Procedura guidata di configurazione + configurazione di esempio: [Gruppi: DM personali + gruppi pubblici](/it/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Riferimento chiave di configurazione: [Configurazione Gateway](/it/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Come associo una cartella host alla sandbox?">
    Imposta `agents.defaults.sandbox.docker.binds` su `["host:path:mode"]` (ad es. `"/home/user/src:/src:ro"`). I bind globali e per agente vengono uniti; i bind per agente vengono ignorati quando `scope: "shared"`. Usa `:ro` per tutto ciò che è sensibile e ricorda che i bind aggirano le barriere del filesystem sandbox.

    OpenClaw valida le origini dei bind sia rispetto al percorso normalizzato sia rispetto al percorso canonico risolto tramite l'antenato esistente più profondo. Questo significa che gli escape tramite genitore symlink falliscono comunque in modalità chiusa anche quando l'ultimo segmento del percorso non esiste ancora, e i controlli sulle root consentite si applicano comunque dopo la risoluzione dei symlink.

    Vedi [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs policy degli strumenti vs privilegi elevati](/it/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) per esempi e note di sicurezza.

  </Accordion>

  <Accordion title="Come funziona la memoria?">
    La memoria di OpenClaw è semplicemente composta da file Markdown nel workspace dell'agente:

    - Note giornaliere in `memory/YYYY-MM-DD.md`
    - Note curate a lungo termine in `MEMORY.md` (solo sessioni principali/private)

    OpenClaw esegue anche un **flush silenzioso della memoria pre-Compaction** per ricordare al modello
    di scrivere note durevoli prima della Compaction automatica. Questo viene eseguito solo quando il workspace
    è scrivibile (le sandbox di sola lettura lo saltano). Vedi [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="La memoria continua a dimenticare le cose. Come faccio a renderle persistenti?">
    Chiedi al bot di **scrivere il fatto in memoria**. Le note a lungo termine vanno in `MEMORY.md`,
    il contesto a breve termine va in `memory/YYYY-MM-DD.md`.

    Questa è ancora un'area che stiamo migliorando. È utile ricordare al modello di archiviare i ricordi;
    saprà cosa fare. Se continua a dimenticare, verifica che il Gateway usi lo stesso
    workspace a ogni esecuzione.

    Documentazione: [Memoria](/it/concepts/memory), [Workspace dell'agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La memoria persiste per sempre? Quali sono i limiti?">
    I file di memoria risiedono su disco e persistono finché non li elimini. Il limite è il tuo
    spazio di archiviazione, non il modello. Il **contesto della sessione** è comunque limitato dalla finestra
    di contesto del modello, quindi le conversazioni lunghe possono essere compattate o troncate. Ecco perché
    esiste la ricerca nella memoria: riporta nel contesto solo le parti rilevanti.

    Documentazione: [Memoria](/it/concepts/memory), [Contesto](/it/concepts/context).

  </Accordion>

  <Accordion title="La ricerca semantica nella memoria richiede una chiave API OpenAI?">
    Solo se usi gli **embedding OpenAI**. Codex OAuth copre chat/completions e
    **non** concede accesso agli embedding, quindi **accedere con Codex (OAuth o il
    login della CLI Codex)** non aiuta per la ricerca semantica nella memoria. Gli embedding OpenAI
    richiedono comunque una vera chiave API (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Se non imposti esplicitamente un provider, OpenClaw usa gli embedding OpenAI. Anche le configurazioni legacy
    che indicano ancora `memorySearch.provider = "auto"` vengono risolte su OpenAI.
    Se non è disponibile alcuna chiave API OpenAI, la ricerca semantica nella memoria resta non disponibile
    finché non configuri una chiave o scegli esplicitamente un altro provider.

    Se preferisci restare in locale, imposta `memorySearch.provider = "local"` (e facoltativamente
    `memorySearch.fallback = "none"`). Se vuoi gli embedding Gemini, imposta
    `memorySearch.provider = "gemini"` e fornisci `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Supportiamo modelli di embedding **OpenAI, compatibili con OpenAI, Gemini,
    Voyage, Mistral, Bedrock, Ollama, LM Studio, GitHub Copilot, DeepInfra o locali**:
    consulta [Memoria](/it/concepts/memory) per i dettagli di configurazione.

  </Accordion>
</AccordionGroup>

## Dove risiedono le cose su disco

<AccordionGroup>
  <Accordion title="Tutti i dati usati con OpenClaw vengono salvati localmente?">
    No: **lo stato di OpenClaw è locale**, ma **i servizi esterni vedono comunque ciò che invii loro**.

    - **Locale per impostazione predefinita:** sessioni, file di memoria, configurazione e workspace risiedono sull'host Gateway
      (`~/.openclaw` + la tua directory workspace).
    - **Remoto per necessità:** i messaggi che invii ai provider di modelli (Anthropic/OpenAI/ecc.) vanno alle
      loro API, e le piattaforme di chat (WhatsApp/Telegram/Slack/ecc.) archiviano i dati dei messaggi sui propri
      server.
    - **Tu controlli l'impronta:** usare modelli locali mantiene i prompt sulla tua macchina, ma il traffico
      dei canali passa comunque attraverso i server del canale.

    Correlati: [Workspace dell'agente](/it/concepts/agent-workspace), [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="Dove archivia i suoi dati OpenClaw?">
    Tutto risiede sotto `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`):

    | Percorso                                                         | Scopo                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configurazione principale (JSON5)                                  |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import OAuth legacy (copiato nei profili di autenticazione al primo uso) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profili di autenticazione (OAuth, chiavi API e `keyRef`/`tokenRef` facoltativi) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload segreto facoltativo basato su file per provider SecretRef `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File di compatibilità legacy (voci statiche `api_key` rimosse)     |
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
      Il file root `memory.md` minuscolo è solo input di riparazione legacy; `openclaw doctor --fix`
      può unirlo in `MEMORY.md` quando esistono entrambi i file.
    - **Directory di stato (`~/.openclaw`)**: configurazione, stato di canali/provider, profili di autenticazione, sessioni, log
      e Skills condivise (`~/.openclaw/skills`).

    Il workspace predefinito è `~/.openclaw/workspace`, configurabile tramite:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se il bot "dimentica" dopo un riavvio, conferma che il Gateway usi lo stesso
    workspace a ogni avvio (e ricorda: la modalità remota usa il workspace
    **dell'host gateway**, non del tuo laptop locale).

    Suggerimento: se vuoi un comportamento o una preferenza duraturi, chiedi al bot di **scriverli in
    AGENTS.md o MEMORY.md** invece di affidarti alla cronologia della chat.

    Vedi [Workspace dell'agente](/it/concepts/agent-workspace) e [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="Posso rendere SOUL.md più grande?">
    Sì. `SOUL.md` è uno dei file di bootstrap del workspace iniettati nel
    contesto dell'agente. Il limite predefinito di iniezione per file è di `20000` caratteri
    e il budget totale di bootstrap tra i file è di `60000` caratteri.

    Modifica i valori predefiniti condivisi nella tua configurazione OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    Oppure sovrascrivi un agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            bootstrapMaxChars: 50000,
            bootstrapTotalMaxChars: 300000,
          },
        ],
      },
    }
    ```

    Usa `/context` per controllare le dimensioni grezze rispetto a quelle iniettate e se si è verificato un troncamento.
    Mantieni `SOUL.md` focalizzato su voce, postura e personalità; metti le regole operative
    in `AGENTS.md` e i fatti durevoli in memoria.

    Vedi [Contesto](/it/concepts/context) e [Configurazione dell'agente](/it/gateway/config-agents).

  </Accordion>

  <Accordion title="Strategia di backup consigliata">
    Metti il tuo **workspace dell'agente** in un repository git **privato** ed eseguine il backup in un luogo
    privato (ad esempio GitHub privato). Questo conserva memoria + file AGENTS/SOUL/USER
    e ti permette di ripristinare in seguito la "mente" dell'assistente.

    **Non** effettuare commit di nulla sotto `~/.openclaw` (credenziali, sessioni, token o payload di segreti cifrati).
    Se ti serve un ripristino completo, esegui separatamente il backup sia del workspace sia della directory di stato
    (vedi la domanda sulla migrazione sopra).

    Documentazione: [Workspace dell'agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Come disinstallo completamente OpenClaw?">
    Consulta la guida dedicata: [Disinstallazione](/it/install/uninstall).
  </Accordion>

  <Accordion title="Gli agenti possono lavorare fuori dal workspace?">
    Sì. Il workspace è la **cwd predefinita** e l'ancora della memoria, non una sandbox rigida.
    I percorsi relativi vengono risolti all'interno del workspace, ma i percorsi assoluti possono accedere ad altre
    posizioni dell'host a meno che il sandboxing non sia abilitato. Se hai bisogno di isolamento, usa
    [`agents.defaults.sandbox`](/it/gateway/sandboxing) o le impostazioni sandbox per agente. Se
    vuoi che un repository sia la directory di lavoro predefinita, punta il `workspace`
    di quell'agente alla root del repository. Il repository OpenClaw è solo codice sorgente; tieni il
    workspace separato a meno che tu non voglia intenzionalmente far lavorare l'agente al suo interno.

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
    Lo stato della sessione appartiene all'**host gateway**. Se sei in modalità remota, lo store delle sessioni che ti interessa è sulla macchina remota, non sul tuo laptop locale. Vedi [Gestione delle sessioni](/it/concepts/session).
  </Accordion>
</AccordionGroup>

## Basi della configurazione

<AccordionGroup>
  <Accordion title="Qual è il formato della configurazione? Dov'è?">
    OpenClaw legge una configurazione **JSON5** facoltativa da `$OPENCLAW_CONFIG_PATH` (predefinito: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se il file manca, usa valori predefiniti abbastanza sicuri (incluso un workspace predefinito di `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ho impostato gateway.bind: "lan" (o "tailnet") e ora non c'è nulla in ascolto / l'interfaccia utente dice non autorizzato'>
    I bind non loopback **richiedono un percorso di autenticazione gateway valido**. In pratica significa:

    - autenticazione con segreto condiviso: token o password
    - `gateway.auth.mode: "trusted-proxy"` dietro un reverse proxy con riconoscimento dell'identità configurato correttamente

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

    - `gateway.remote.token` / `.password` **non** abilitano da soli l'autenticazione gateway locale.
    - I percorsi di chiamata locali possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
    - Per l'autenticazione con password, imposta invece `gateway.auth.mode: "password"` più `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non risolto, la risoluzione fallisce in modo chiuso (senza mascheramento tramite fallback remoto).
    - Le configurazioni Control UI con segreto condiviso si autenticano tramite `connect.params.auth.token` o `connect.params.auth.password` (archiviati nelle impostazioni dell'app/UI). Le modalità con identità, come Tailscale Serve o `trusted-proxy`, usano invece gli header della richiesta. Evita di inserire segreti condivisi negli URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, i reverse proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito e una voce loopback in `gateway.trustedProxies`.

  </Accordion>

  <Accordion title="Perché ora mi serve un token su localhost?">
    OpenClaw applica l'autenticazione del gateway per impostazione predefinita, incluso loopback. Nel normale percorso predefinito questo significa autenticazione con token: se non è configurato alcun percorso di autenticazione esplicito, l'avvio del gateway viene risolto in modalità token e genera un token solo runtime per quell'avvio, quindi **i client WS locali devono autenticarsi**. Configura esplicitamente `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` o `OPENCLAW_GATEWAY_PASSWORD` quando i client hanno bisogno di un segreto stabile tra i riavvii. Questo impedisce ad altri processi locali di chiamare il Gateway.

    Se preferisci un percorso di autenticazione diverso, puoi scegliere esplicitamente la modalità password (oppure, per reverse proxy identity-aware, `trusted-proxy`). Se vuoi **davvero** un loopback aperto, imposta esplicitamente `gateway.auth.mode: "none"` nella tua configurazione. Doctor può generare un token per te in qualsiasi momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Devo riavviare dopo aver modificato la configurazione?">
    Il Gateway monitora la configurazione e supporta l'hot reload:

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
    - Se non vuoi alcun banner, imposta la variabile d'ambiente `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Come abilito la ricerca web (e il recupero web)?">
    `web_fetch` funziona senza una chiave API. `web_search` dipende dal provider
    selezionato:

    - I provider basati su API come Brave, Exa, Firecrawl, Gemini, Kimi, MiniMax Search, Perplexity e Tavily richiedono la normale configurazione della loro chiave API.
    - Grok può riutilizzare OAuth xAI dall'autenticazione del modello, oppure ripiegare su `XAI_API_KEY` / configurazione web-search del plugin.
    - Ollama Web Search non richiede chiavi, ma usa l'host Ollama configurato e richiede `ollama signin`.
    - DuckDuckGo non richiede chiavi, ma è un'integrazione non ufficiale basata su HTML.
    - SearXNG non richiede chiavi/è self-hosted; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Consigliato:** esegui `openclaw configure --section web` e scegli un provider.
    Alternative tramite ambiente:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: OAuth xAI, `XAI_API_KEY`
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

    La configurazione web-search specifica del provider ora vive in `plugins.entries.<plugin>.config.webSearch.*`.
    I percorsi provider legacy `tools.web.search.*` vengono ancora caricati temporaneamente per compatibilità, ma non dovrebbero essere usati per nuove configurazioni.
    La configurazione di fallback web-fetch di Firecrawl vive in `plugins.entries.firecrawl.config.webFetch.*`.

    Note:

    - Se usi allowlist, aggiungi `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` è abilitato per impostazione predefinita (salvo disabilitazione esplicita).
    - Se `tools.web.fetch.provider` viene omesso, OpenClaw rileva automaticamente il primo provider di fallback fetch pronto dalle credenziali disponibili. Il plugin Firecrawl ufficiale fornisce quel fallback.
    - I daemon leggono le variabili d'ambiente da `~/.openclaw/.env` (o dall'ambiente del servizio).

    Documentazione: [Strumenti web](/it/tools/web).

  </Accordion>

  <Accordion title="config.apply ha cancellato la mia configurazione. Come posso recuperarla ed evitarlo?">
    `config.apply` sostituisce **l'intera configurazione**. Se invii un oggetto parziale, tutto
    il resto viene rimosso.

    L'OpenClaw attuale protegge da molte sovrascritture accidentali:

    - Le scritture di configurazione di proprietà di OpenClaw convalidano l'intera configurazione post-modifica prima della scrittura.
    - Le scritture di proprietà di OpenClaw non valide o distruttive vengono rifiutate e salvate come `openclaw.json.rejected.*`.
    - Se una modifica diretta rompe l'avvio o l'hot reload, il Gateway fallisce in modo chiuso o salta il reload; non riscrive `openclaw.json`.
    - `openclaw doctor --fix` possiede la riparazione e può ripristinare l'ultima configurazione valida nota salvando il file rifiutato come `openclaw.json.clobbered.*`.

    Recupero:

    - Controlla `openclaw logs --follow` per `Invalid config at`, `Config write rejected:` o `config reload skipped (invalid config)`.
    - Ispeziona il più recente `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` accanto alla configurazione attiva.
    - Esegui `openclaw config validate` e `openclaw doctor --fix`.
    - Copia di nuovo solo le chiavi desiderate con `openclaw config set` o `config.patch`.
    - Se non hai un'ultima configurazione valida nota o un payload rifiutato, ripristina da backup, oppure riesegui `openclaw doctor` e riconfigura canali/modelli.
    - Se era inatteso, segnala un bug e includi l'ultima configurazione nota o eventuali backup.
    - Un agente di programmazione locale può spesso ricostruire una configurazione funzionante dai log o dalla cronologia.

    Evitalo:

    - Usa `openclaw config set` per piccole modifiche.
    - Usa `openclaw configure` per modifiche interattive.
    - Usa prima `config.schema.lookup` quando non sei sicuro di un percorso esatto o della forma di un campo; restituisce un nodo di schema superficiale più riepiloghi dei figli immediati per l'esplorazione.
    - Usa `config.patch` per modifiche RPC parziali; riserva `config.apply` solo alla sostituzione dell'intera configurazione.
    - Se stai usando lo strumento `gateway` rivolto agli agenti da un'esecuzione agente, rifiuterà comunque le scritture su `tools.exec.ask` / `tools.exec.security` (inclusi gli alias legacy `tools.bash.*` che si normalizzano negli stessi percorsi exec protetti).

    Documentazione: [Configurazione](/it/cli/config), [Configurare](/it/cli/configure), [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/it/gateway/doctor).

  </Accordion>

  <Accordion title="Come eseguo un Gateway centrale con worker specializzati su più dispositivi?">
    Il modello comune è **un Gateway** (per esempio Raspberry Pi) più **nodi** e **agenti**:

    - **Gateway (centrale):** possiede canali (Signal/WhatsApp), routing e sessioni.
    - **Nodi (dispositivi):** Mac/iOS/Android si connettono come periferiche ed espongono strumenti locali (`system.run`, `canvas`, `camera`).
    - **Agenti (worker):** cervelli/workspace separati per ruoli speciali (per esempio "Hetzner ops", "Dati personali").
    - **Sotto-agenti:** avvia lavoro in background da un agente principale quando vuoi parallelismo.
    - **TUI:** connettiti al Gateway e cambia agenti/sessioni.

    Documentazione: [Nodi](/it/nodes), [Accesso remoto](/it/gateway/remote), [Routing multi-agente](/it/concepts/multi-agent), [Sotto-agenti](/it/tools/subagents), [TUI](/it/web/tui).

  </Accordion>

  <Accordion title="Il browser OpenClaw può essere eseguito headless?">
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

    Il valore predefinito è `false` (con interfaccia visibile). Headless ha più probabilità di attivare controlli anti-bot su alcuni siti. Vedi [Browser](/it/tools/browser).

    Headless usa lo **stesso motore Chromium** e funziona per la maggior parte dell'automazione (moduli, clic, scraping, accessi). Le differenze principali:

    - Nessuna finestra del browser visibile (usa screenshot se ti servono elementi visivi).
    - Alcuni siti sono più severi sull'automazione in modalità headless (CAPTCHA, anti-bot).
      Per esempio, X/Twitter spesso blocca le sessioni headless.

  </Accordion>

  <Accordion title="Come uso Brave per il controllo del browser?">
    Imposta `browser.executablePath` sul tuo binario Brave (o su qualsiasi browser basato su Chromium) e riavvia il Gateway.
    Vedi gli esempi completi di configurazione in [Browser](/it/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway e nodi remoti

<AccordionGroup>
  <Accordion title="Come si propagano i comandi tra Telegram, il gateway e i nodi?">
    I messaggi Telegram sono gestiti dal **gateway**. Il gateway esegue l'agente e
    solo allora chiama i nodi tramite il **Gateway WebSocket** quando serve uno strumento nodo:

    Telegram → Gateway → Agente → `node.*` → Nodo → Gateway → Telegram

    I nodi non vedono il traffico provider in ingresso; ricevono solo chiamate RPC nodo.

  </Accordion>

  <Accordion title="Come può il mio agente accedere al mio computer se il Gateway è ospitato da remoto?">
    Risposta breve: **associa il tuo computer come nodo**. Il Gateway gira altrove, ma può
    chiamare strumenti `node.*` (schermo, fotocamera, sistema) sulla tua macchina locale tramite il Gateway WebSocket.

    Configurazione tipica:

    1. Esegui il Gateway sull'host sempre acceso (VPS/server domestico).
    2. Metti l'host del Gateway e il tuo computer sulla stessa tailnet.
    3. Assicurati che il WS del Gateway sia raggiungibile (bind tailnet o tunnel SSH).
    4. Apri l'app macOS localmente e connettiti in modalità **Remoto su SSH** (o tailnet diretta)
       così può registrarsi come nodo.
    5. Approva il nodo sul Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Non è richiesto un bridge TCP separato; i nodi si connettono tramite il Gateway WebSocket.

    Promemoria di sicurezza: associare un nodo macOS consente `system.run` su quella macchina. Associa solo
    dispositivi di cui ti fidi e consulta [Sicurezza](/it/gateway/security).

    Documentazione: [Nodi](/it/nodes), [Protocollo Gateway](/it/gateway/protocol), [Modalità remota macOS](/it/platforms/mac/remote), [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Tailscale è connesso ma non ricevo risposte. E adesso?">
    Controlla le basi:

    - Gateway in esecuzione: `openclaw gateway status`
    - Integrità del Gateway: `openclaw status`
    - Integrità dei canali: `openclaw channels status`

    Poi verifica autenticazione e routing:

    - Se usi Tailscale Serve, assicurati che `gateway.auth.allowTailscale` sia impostato correttamente.
    - Se ti connetti tramite tunnel SSH, conferma che il tunnel locale sia attivo e punti alla porta corretta.
    - Conferma che le tue allowlist (DM o gruppo) includano il tuo account.

    Documentazione: [Tailscale](/it/gateway/tailscale), [Accesso remoto](/it/gateway/remote), [Canali](/it/channels).

  </Accordion>

  <Accordion title="Due istanze OpenClaw possono comunicare tra loro (locale + VPS)?">
    Sì. Non esiste un bridge "bot-to-bot" integrato, ma puoi collegarle in alcuni
    modi affidabili:

    **Il più semplice:** usa un normale canale chat a cui entrambi i bot possono accedere (Telegram/Slack/WhatsApp).
    Fai inviare un messaggio dal Bot A al Bot B, poi lascia che il Bot B risponda come al solito.

    **Bridge CLI (generico):** esegui uno script che chiama l'altro Gateway con
    `openclaw agent --message ... --deliver`, puntando a una chat in cui l'altro bot
    è in ascolto. Se un bot è su un VPS remoto, punta la tua CLI a quel Gateway remoto
    tramite SSH/Tailscale (vedi [Accesso remoto](/it/gateway/remote)).

    Modello di esempio (eseguito da una macchina che può raggiungere il Gateway di destinazione):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Suggerimento: aggiungi una protezione affinché i due bot non entrino in loop all'infinito (solo menzioni, allowlist
    dei canali, o una regola "non rispondere ai messaggi dei bot").

    Documentazione: [Accesso remoto](/it/gateway/remote), [CLI agente](/it/cli/agent), [Invio agente](/it/tools/agent-send).

  </Accordion>

  <Accordion title="Mi servono VPS separati per più agenti?">
    No. Un solo Gateway può ospitare più agenti, ciascuno con il proprio workspace, impostazioni predefinite del modello
    e routing. Questa è la configurazione normale ed è molto più economica e semplice rispetto a eseguire
    un VPS per agente.

    Usa VPS separati solo quando ti serve isolamento forte (confini di sicurezza) o configurazioni molto
    diverse che non vuoi condividere. Altrimenti, mantieni un solo Gateway e
    usa più agenti o sotto-agenti.

  </Accordion>

  <Accordion title="C'è un vantaggio nell'usare un nodo sul mio laptop personale invece di SSH da un VPS?">
    Sì: i nodi sono il modo principale per raggiungere il tuo laptop da un Gateway remoto e
    sbloccano più del semplice accesso shell. Il Gateway funziona su macOS/Linux (Windows tramite WSL2) ed è
    leggero (un piccolo VPS o un box di classe Raspberry Pi va bene; 4 GB di RAM sono più che sufficienti), quindi una configurazione comune
    è un host sempre attivo più il tuo laptop come nodo.

    - **Nessun SSH in ingresso richiesto.** I nodi si connettono in uscita al WebSocket del Gateway e usano l'associazione del dispositivo.
    - **Controlli di esecuzione più sicuri.** `system.run` è vincolato da allowlist/approvazioni del nodo su quel laptop.
    - **Più strumenti del dispositivo.** I nodi espongono `canvas`, `camera` e `screen` oltre a `system.run`.
    - **Automazione del browser locale.** Mantieni il Gateway su un VPS, ma esegui Chrome localmente tramite un host nodo sul laptop, oppure collegati a Chrome locale sull'host tramite Chrome MCP.

    SSH va bene per accesso shell occasionale, ma i nodi sono più semplici per flussi di lavoro continuativi degli agenti e
    automazione dei dispositivi.

    Documentazione: [Nodi](/it/nodes), [CLI dei nodi](/it/cli/nodes), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="I nodi eseguono un servizio gateway?">
    No. Dovrebbe essere eseguito solo **un gateway** per host, a meno che tu non esegua intenzionalmente profili isolati (vedi [Gateway multipli](/it/gateway/multiple-gateways)). I nodi sono periferiche che si connettono
    al gateway (nodi iOS/Android, oppure "modalità nodo" macOS nell'app nella barra dei menu). Per host nodo
    headless e controllo CLI, vedi [CLI dell'host Node](/it/cli/node).

    È richiesto un riavvio completo per le modifiche a `gateway`, `discovery` e alla superficie dei Plugin ospitati.

  </Accordion>

  <Accordion title="Esiste un modo API / RPC per applicare la configurazione?">
    Sì.

    - `config.schema.lookup`: ispeziona un sottoalbero della configurazione con il suo nodo schema superficiale, il suggerimento UI corrispondente e i riepiloghi immediati dei figli prima di scrivere
    - `config.get`: recupera lo snapshot corrente + hash
    - `config.patch`: aggiornamento parziale sicuro (preferito per la maggior parte delle modifiche RPC); ricarica a caldo quando possibile e riavvia quando richiesto
    - `config.apply`: valida + sostituisce l'intera configurazione; ricarica a caldo quando possibile e riavvia quando richiesto
    - Lo strumento runtime `gateway` esposto agli agenti continua a rifiutare la riscrittura di `tools.exec.ask` / `tools.exec.security`; gli alias legacy `tools.bash.*` vengono normalizzati negli stessi percorsi exec protetti

  </Accordion>

  <Accordion title="Configurazione minima ragionevole per una prima installazione">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Questo imposta la tua area di lavoro e limita chi può attivare il bot.

  </Accordion>

  <Accordion title="Come configuro Tailscale su un VPS e mi connetto dal mio Mac?">
    Passaggi minimi:

    1. **Installa + accedi sul VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installa + accedi sul tuo Mac**
       - Usa l'app Tailscale e accedi alla stessa tailnet.
    3. **Abilita MagicDNS (consigliato)**
       - Nella console di amministrazione Tailscale, abilita MagicDNS così il VPS ha un nome stabile.
    4. **Usa il nome host della tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - WS del Gateway: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se vuoi la UI di controllo senza SSH, usa Tailscale Serve sul VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Questo mantiene il gateway associato a loopback ed espone HTTPS tramite Tailscale. Vedi [Tailscale](/it/gateway/tailscale).

  </Accordion>

  <Accordion title="Come collego un nodo Mac a un Gateway remoto (Tailscale Serve)?">
    Serve espone la **UI di controllo del Gateway + WS**. I nodi si connettono tramite lo stesso endpoint WS del Gateway.

    Configurazione consigliata:

    1. **Assicurati che VPS + Mac siano sulla stessa tailnet**.
    2. **Usa l'app macOS in modalità remota** (il target SSH può essere il nome host della tailnet).
       L'app aprirà un tunnel verso la porta del Gateway e si connetterà come nodo.
    3. **Approva il nodo** sul gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentazione: [Protocollo Gateway](/it/gateway/protocol), [Discovery](/it/gateway/discovery), [modalità remota macOS](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dovrei installarlo su un secondo laptop o aggiungere semplicemente un nodo?">
    Se ti servono solo **strumenti locali** (screen/camera/exec) sul secondo laptop, aggiungilo come
    **nodo**. Così mantieni un solo Gateway ed eviti configurazioni duplicate. Gli strumenti locali del nodo sono
    attualmente disponibili solo su macOS, ma prevediamo di estenderli ad altri sistemi operativi.

    Installa un secondo Gateway solo quando ti serve **isolamento forte** o due bot completamente separati.

    Documentazione: [Nodi](/it/nodes), [CLI dei nodi](/it/cli/nodes), [Gateway multipli](/it/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variabili env e caricamento .env

<AccordionGroup>
  <Accordion title="Come carica OpenClaw le variabili di ambiente?">
    OpenClaw legge le variabili env dal processo padre (shell, launchd/systemd, CI, ecc.) e carica inoltre:

    - `.env` dalla directory di lavoro corrente
    - un fallback globale `.env` da `~/.openclaw/.env` (ovvero `$OPENCLAW_STATE_DIR/.env`)

    Nessuno dei due file `.env` sovrascrive variabili env esistenti.
    Le variabili delle credenziali dei provider fanno eccezione per `.env` dell'area di lavoro: chiavi come
    `GEMINI_API_KEY`, `XAI_API_KEY` o `MISTRAL_API_KEY` vengono ignorate da `.env`
    dell'area di lavoro e dovrebbero stare nell'ambiente del processo, in `~/.openclaw/.env` o nella configurazione `env`.

    Puoi anche definire variabili env inline nella configurazione (applicate solo se assenti dall'env del processo):

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

  <Accordion title="Ho avviato il Gateway tramite il servizio e le mie variabili env sono scomparse. E ora?">
    Due soluzioni comuni:

    1. Metti le chiavi mancanti in `~/.openclaw/.env` così vengono caricate anche quando il servizio non eredita l'env della tua shell.
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

    Questo esegue la tua shell di login e importa solo le chiavi attese mancanti (non sovrascrive mai). Equivalenti come variabili env:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ho impostato COPILOT_GITHUB_TOKEN, ma lo stato dei modelli mostra "Shell env: off." Perché?'>
    `openclaw models status` segnala se l'**importazione env dalla shell** è abilitata. "Shell env: off"
    **non** significa che le tue variabili env manchino: significa solo che OpenClaw non caricherà
    automaticamente la tua shell di login.

    Se il Gateway viene eseguito come servizio (launchd/systemd), non erediterà il tuo ambiente
    shell. Risolvi in uno di questi modi:

    1. Metti il token in `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oppure abilita l'importazione dalla shell (`env.shellEnv.enabled: true`).
    3. Oppure aggiungilo al blocco `env` della configurazione (si applica solo se manca).

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

  <Accordion title="Esiste un modo per creare un team di istanze OpenClaw (un CEO e molti agenti)?">
    Sì, tramite **routing multi-agente** e **sottoagenti**. Puoi creare un agente coordinatore
    e diversi agenti worker con le proprie aree di lavoro e i propri modelli.

    Detto questo, è meglio considerarlo un **esperimento divertente**. Consuma molti token e spesso
    è meno efficiente rispetto all'uso di un solo bot con sessioni separate. Il modello tipico che
    immaginiamo è un bot con cui parli, con sessioni diverse per lavoro in parallelo. Quel
    bot può anche generare sottoagenti quando necessario.

    Documentazione: [Routing multi-agente](/it/concepts/multi-agent), [Sottoagenti](/it/tools/subagents), [CLI degli agenti](/it/cli/agents).

  </Accordion>

  <Accordion title="Perché il contesto è stato troncato a metà attività? Come posso evitarlo?">
    Il contesto della sessione è limitato dalla finestra del modello. Chat lunghe, output ampi degli strumenti o molti
    file possono attivare Compaction o troncamento.

    Cosa aiuta:

    - Chiedi al bot di riassumere lo stato corrente e scriverlo in un file.
    - Usa `/compact` prima di attività lunghe e `/new` quando cambi argomento.
    - Mantieni il contesto importante nell'area di lavoro e chiedi al bot di rileggerlo.
    - Usa sottoagenti per lavoro lungo o parallelo, così la chat principale resta più piccola.
    - Scegli un modello con una finestra di contesto più ampia se succede spesso.

  </Accordion>

  <Accordion title="Come reimposto completamente OpenClaw ma lo mantengo installato?">
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
    - Reset dev: `openclaw gateway --dev --reset` (solo dev; cancella configurazione dev + credenziali + sessioni + area di lavoro).

  </Accordion>

  <Accordion title='Ricevo errori "context too large": come faccio a reimpostare o compattare?'>
    Usa una di queste opzioni:

    - **Compattare** (mantiene la conversazione ma riassume i turni più vecchi):

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

    - Abilita o regola il **pruning delle sessioni** (`agents.defaults.contextPruning`) per ridurre il vecchio output degli strumenti.
    - Usa un modello con una finestra di contesto più ampia.

    Documentazione: [Compaction](/it/concepts/compaction), [Pruning delle sessioni](/it/concepts/session-pruning), [Gestione delle sessioni](/it/concepts/session).

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

    Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote,
    commenti Markdown/HTML, intestazioni Markdown come `# Heading`, marcatori di blocco,
    o stub di checklist vuoti), OpenClaw salta l'esecuzione del heartbeat per risparmiare chiamate API.
    Se il file manca, il heartbeat viene comunque eseguito e il modello decide cosa fare.

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

    - Il gating tramite menzione è attivo (impostazione predefinita). Devi @menzionare il bot (o corrispondere a `mentionPatterns`).
    - Hai configurato `channels.whatsapp.groups` senza `"*"` e il gruppo non è in allowlist.

    Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).

  </Accordion>

  <Accordion title="Gruppi/thread condividono il contesto con i DM?">
    Le chat dirette convergono nella sessione principale per impostazione predefinita. Gruppi/canali hanno le proprie chiavi di sessione, e gli argomenti Telegram / i thread Discord sono sessioni separate. Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).
  </Accordion>

  <Accordion title="Quanti workspace e agenti posso creare?">
    Nessun limite rigido. Decine (anche centinaia) vanno bene, ma tieni d'occhio:

    - **Crescita del disco:** sessioni + trascrizioni si trovano in `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo in token:** più agenti significano più uso concorrente dei modelli.
    - **Sovraccarico operativo:** profili auth, workspace e instradamento dei canali per agente.

    Suggerimenti:

    - Mantieni un workspace **attivo** per agente (`agents.defaults.workspace`).
    - Elimina le vecchie sessioni (elimina JSONL o voci dello store) se il disco cresce.
    - Usa `openclaw doctor` per individuare workspace residui e discrepanze dei profili.

  </Accordion>

  <Accordion title="Posso eseguire più bot o chat contemporaneamente (Slack), e come dovrei configurarli?">
    Sì. Usa **Instradamento multi-agente** per eseguire più agenti isolati e instradare i messaggi in ingresso per
    canale/account/peer. Slack è supportato come canale e può essere associato ad agenti specifici.

    L'accesso browser è potente ma non equivale a "poter fare qualsiasi cosa possa fare un umano": anti-bot, CAPTCHA e MFA possono
    comunque bloccare l'automazione. Per il controllo browser più affidabile, usa Chrome MCP locale sull'host,
    oppure usa CDP sulla macchina che esegue effettivamente il browser.

    Configurazione consigliata:

    - Host Gateway sempre attivo (VPS/Mac mini).
    - Un agente per ruolo (associazioni).
    - Canale/i Slack associati a quegli agenti.
    - Browser locale tramite Chrome MCP o un nodo quando necessario.

    Documentazione: [Instradamento multi-agente](/it/concepts/multi-agent), [Slack](/it/channels/slack),
    [Browser](/it/tools/browser), [Nodi](/it/nodes).

  </Accordion>
</AccordionGroup>

## Modelli, failover e profili auth

Le domande e risposte sui modelli — impostazioni predefinite, selezione, alias, cambio, failover, profili auth —
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
    Perché "running" è la vista del **supervisore** (launchd/systemd/schtasks). Il probe di connettività è la CLI che si connette effettivamente al WebSocket del Gateway.

    Usa `openclaw gateway status` e fidati di queste righe:

    - `Probe target:` (l'URL che il probe ha effettivamente usato)
    - `Listening:` (ciò che è effettivamente associato alla porta)
    - `Last gateway error:` (causa radice comune quando il processo è attivo ma la porta non è in ascolto)

  </Accordion>

  <Accordion title='Perché openclaw gateway status mostra "Config (cli)" e "Config (service)" diversi?'>
    Stai modificando un file di configurazione mentre il servizio ne sta usando un altro (spesso una discrepanza `--profile` / `OPENCLAW_STATE_DIR`).

    Correzione:

    ```bash
    openclaw gateway install --force
    ```

    Eseguilo dallo stesso `--profile` / ambiente che vuoi far usare al servizio.

  </Accordion>

  <Accordion title='Che cosa significa "another gateway instance is already listening"?'>
    OpenClaw applica un lock di runtime associando immediatamente il listener WebSocket all'avvio (predefinito `ws://127.0.0.1:18789`). Se il binding fallisce con `EADDRINUSE`, genera `GatewayLockError` indicando che un'altra istanza è già in ascolto.

    Correzione: arresta l'altra istanza, libera la porta, oppure esegui con `openclaw gateway --port <port>`.

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
    - L'app macOS osserva il file di configurazione e cambia modalità in tempo reale quando questi valori cambiano.
    - `gateway.remote.token` / `.password` sono solo credenziali remote lato client; non abilitano da sole l'autenticazione del gateway locale.

  </Accordion>

  <Accordion title='La Control UI dice "unauthorized" (o continua a riconnettersi). Che faccio?'>
    Il percorso auth del gateway e il metodo auth dell'UI non corrispondono.

    Fatti (dal codice):

    - La Control UI mantiene il token in `sessionStorage` per la sessione corrente della scheda browser e l'URL Gateway selezionato, quindi gli aggiornamenti nella stessa scheda continuano a funzionare senza ripristinare la persistenza del token di lunga durata in localStorage.
    - Su `AUTH_TOKEN_MISMATCH`, i client attendibili possono tentare un solo retry limitato con un token dispositivo memorizzato nella cache quando il gateway restituisce suggerimenti di retry (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Quel retry con token memorizzato nella cache ora riusa gli ambiti approvati memorizzati nella cache con il token dispositivo. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono comunque il set di ambiti richiesto invece di ereditare gli ambiti memorizzati nella cache.
    - Al di fuori di quel percorso di retry, la precedenza dell'auth di connessione è prima token/password condivisi espliciti, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi token bootstrap.
    - Il bootstrap integrato tramite codice di configurazione è solo per nodi. Dopo l'approvazione, restituisce un token dispositivo nodo con `scopes: []` e non restituisce un token operatore trasferito.

    Correzione:

    - Più rapido: `openclaw dashboard` (stampa + copia l'URL della dashboard, prova ad aprirlo; mostra un suggerimento SSH se headless).
    - Se non hai ancora un token: `openclaw doctor --generate-gateway-token`.
    - Se remoto, crea prima un tunnel: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`.
    - Modalità segreto condiviso: imposta `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oppure `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, poi incolla il segreto corrispondente nelle impostazioni della Control UI.
    - Modalità Tailscale Serve: assicurati che `gateway.auth.allowTailscale` sia abilitato e di aprire l'URL Serve, non un URL raw loopback/tailnet che bypassa gli header di identità Tailscale.
    - Modalità proxy attendibile: assicurati di arrivare tramite il proxy configurato con riconoscimento dell'identità, non tramite un URL gateway raw. Anche i proxy local loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true`.
    - Se la discrepanza persiste dopo l'unico retry, ruota/riapprova il token dispositivo associato:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Se quella chiamata di rotazione dice che è stata negata, verifica due cose:
      - le sessioni di dispositivi associati possono ruotare solo il **proprio** dispositivo, a meno che non abbiano anche `operator.admin`
      - i valori `--scope` espliciti non possono superare gli ambiti operatore correnti del chiamante
    - Ancora bloccato? Esegui `openclaw status --all` e segui [Risoluzione dei problemi](/it/gateway/troubleshooting). Vedi [Dashboard](/it/web/dashboard) per i dettagli auth.

  </Accordion>

  <Accordion title="Ho impostato gateway.bind tailnet ma non riesce a fare bind e nulla è in ascolto">
    Il bind `tailnet` sceglie un IP Tailscale dalle tue interfacce di rete (100.64.0.0/10). Se la macchina non è su Tailscale (o l'interfaccia è inattiva), non c'è nulla a cui fare bind.

    Correzione:

    - Avvia Tailscale su quell'host (così avrà un indirizzo 100.x), oppure
    - Passa a `gateway.bind: "loopback"` / `"lan"`.

    Nota: `tailnet` è esplicito. `auto` preferisce loopback; usa `gateway.bind: "tailnet"` quando vuoi un bind solo tailnet.

  </Accordion>

  <Accordion title="Posso eseguire più Gateway sullo stesso host?">
    Di solito no: un Gateway può eseguire più canali di messaggistica e agenti. Usa più Gateway solo quando ti serve ridondanza (es.: bot di soccorso) o isolamento rigido.

    Sì, ma devi isolare:

    - `OPENCLAW_CONFIG_PATH` (configurazione per istanza)
    - `OPENCLAW_STATE_DIR` (stato per istanza)
    - `agents.defaults.workspace` (isolamento del workspace)
    - `gateway.port` (porte univoche)

    Configurazione rapida (consigliata):

    - Usa `openclaw --profile <name> ...` per istanza (crea automaticamente `~/.openclaw-<name>`).
    - Imposta un `gateway.port` univoco in ogni configurazione di profilo (o passa `--port` per esecuzioni manuali).
    - Installa un servizio per profilo: `openclaw --profile <name> gateway install`.

    I profili aggiungono anche suffissi ai nomi dei servizi (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Guida completa: [Più gateway](/it/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Che cosa significa "invalid handshake" / codice 1008?'>
    Il Gateway è un **server WebSocket** e si aspetta che il primissimo messaggio sia
    un frame `connect`. Se riceve qualcos'altro, chiude la connessione
    con **codice 1008** (violazione della policy).

    Cause comuni:

    - Hai aperto l'URL **HTTP** in un browser (`http://...`) invece di un client WS.
    - Hai usato la porta o il percorso sbagliati.
    - Un proxy o tunnel ha rimosso gli header auth o inviato una richiesta non Gateway.

    Correzioni rapide:

    1. Usa l'URL WS: `ws://<host>:18789` (o `wss://...` se HTTPS).
    2. Non aprire la porta WS in una normale scheda del browser.
    3. Se l'auth è attiva, includi il token/password nel frame `connect`.

    Se stai usando la CLI o la TUI, l'URL dovrebbe avere questo aspetto:

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

    Coda dei log più rapida:

    ```bash
    openclaw logs --follow
    ```

    Log del servizio/supervisore (quando il gateway viene eseguito tramite launchd/systemd):

    - stdout di macOS launchd: `~/Library/Logs/openclaw/gateway.log` (i profili usano `gateway-<profile>.log`; stderr è soppresso)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Consulta [Risoluzione dei problemi](/it/gateway/troubleshooting) per saperne di più.

  </Accordion>

  <Accordion title="Come avvio/arresto/riavvio il servizio Gateway?">
    Usa gli helper del gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Se esegui il gateway manualmente, `openclaw gateway --force` può recuperare la porta. Consulta [Gateway](/it/gateway).

  </Accordion>

  <Accordion title="Ho chiuso il terminale su Windows: come riavvio OpenClaw?">
    Esistono **tre modalità di installazione su Windows**:

    **1) Configurazione locale Windows Hub:** l'app nativa gestisce un Gateway WSL locale di proprietà dell'app.

    Apri **OpenClaw Companion** dal menu Start o dalla tray, quindi usa
    **Gateway Setup** o la scheda Connessioni.

    **2) Gateway WSL2 manuale:** il Gateway viene eseguito dentro Linux.

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

    **3) CLI/Gateway Windows nativo:** il Gateway viene eseguito direttamente in Windows.

    Apri PowerShell ed esegui:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Se lo esegui manualmente (senza servizio), usa:

    ```powershell
    openclaw gateway run
    ```

    Documentazione: [Windows](/it/platforms/windows), [runbook del servizio Gateway](/it/gateway).

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

    - Autenticazione del modello non caricata sull'**host del gateway** (controlla `models status`).
    - Abbinamento/allowlist del canale che blocca le risposte (controlla configurazione del canale + log).
    - WebChat/Dashboard è aperto senza il token corretto.

    Se sei da remoto, conferma che il tunnel/la connessione Tailscale sia attiva e che il
    WebSocket del Gateway sia raggiungibile.

    Documentazione: [Canali](/it/channels), [Risoluzione dei problemi](/it/gateway/troubleshooting), [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason": cosa fare ora?'>
    Di solito significa che l'interfaccia utente ha perso la connessione WebSocket. Controlla:

    1. Il Gateway è in esecuzione? `openclaw gateway status`
    2. Il Gateway è integro? `openclaw status`
    3. L'interfaccia utente ha il token corretto? `openclaw dashboard`
    4. Se sei da remoto, il collegamento tunnel/Tailscale è attivo?

    Poi segui i log:

    ```bash
    openclaw logs --follow
    ```

    Documentazione: [Dashboard](/it/web/dashboard), [Accesso remoto](/it/gateway/remote), [Risoluzione dei problemi](/it/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands fallisce. Cosa devo controllare?">
    Inizia dai log e dallo stato del canale:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Poi associa l'errore:

    - `BOT_COMMANDS_TOO_MUCH`: il menu Telegram ha troppe voci. OpenClaw riduce già il numero al limite Telegram e riprova con meno comandi, ma alcune voci di menu devono comunque essere rimosse. Riduci i comandi di plugin/skill/personalizzati, oppure disabilita `channels.telegram.commands.native` se non ti serve il menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` o errori di rete simili: se sei su un VPS o dietro un proxy, conferma che HTTPS in uscita sia consentito e che DNS funzioni per `api.telegram.org`.

    Se il Gateway è remoto, assicurati di guardare i log sull'host del Gateway.

    Documentazione: [Telegram](/it/channels/telegram), [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI non mostra output. Cosa devo controllare?">
    Prima conferma che il Gateway sia raggiungibile e che l'agente possa essere eseguito:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Nella TUI, usa `/status` per vedere lo stato corrente. Se ti aspetti risposte in un canale di chat,
    assicurati che la consegna sia abilitata (`/deliver on`).

    Documentazione: [TUI](/it/web/tui), [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come arresto completamente e poi avvio il Gateway?">
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

    Documentazione: [runbook del servizio Gateway](/it/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart rispetto a openclaw gateway">
    - `openclaw gateway restart`: riavvia il **servizio in background** (launchd/systemd).
    - `openclaw gateway`: esegue il gateway **in primo piano** per questa sessione del terminale.

    Se hai installato il servizio, usa i comandi del gateway. Usa `openclaw gateway` quando
    vuoi un'esecuzione una tantum in primo piano.

  </Accordion>

  <Accordion title="Il modo più rapido per ottenere più dettagli quando qualcosa fallisce">
    Avvia il Gateway con `--verbose` per ottenere più dettagli in console. Poi ispeziona il file di log per autenticazione del canale, instradamento del modello ed errori RPC.
  </Accordion>
</AccordionGroup>

## Media e allegati

<AccordionGroup>
  <Accordion title="La mia skill ha generato un'immagine/PDF, ma non è stato inviato nulla">
    Gli allegati in uscita dall'agente devono usare campi multimediali strutturati come `media`, `mediaUrl`, `path` o `filePath`. Consulta [configurazione dell'assistente OpenClaw](/it/start/openclaw) e [invio dell'agente](/it/tools/agent-send).

    Invio da CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Controlla anche:

    - Il canale di destinazione supporta i media in uscita e non è bloccato da allowlist.
    - Il file rientra nei limiti di dimensione del provider (le immagini vengono ridimensionate a massimo 2048 px).
    - `tools.fs.workspaceOnly=true` mantiene gli invii da percorso locale limitati a workspace, temp/media-store e file validati dalla sandbox.
    - `tools.fs.workspaceOnly=false` consente agli invii di media locali strutturati di usare file locali dell'host che l'agente può già leggere, ma solo per media più tipi di documenti sicuri (immagini, audio, video, PDF, documenti Office e documenti di testo validati come Markdown/MD, TXT, JSON, YAML e YML). Questo non è uno scanner di segreti: un `secret.txt` o `config.json` leggibile dall'agente può essere allegato quando l'estensione e la validazione del contenuto corrispondono. Tieni i file sensibili fuori dai percorsi leggibili dall'agente, oppure mantieni `tools.fs.workspaceOnly=true` per invii da percorso locale più restrittivi.

    Consulta [Immagini](/it/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicurezza e controllo degli accessi

<AccordionGroup>
  <Accordion title="È sicuro esporre OpenClaw ai DM in ingresso?">
    Tratta i DM in ingresso come input non attendibile. I valori predefiniti sono progettati per ridurre il rischio:

    - Il comportamento predefinito sui canali che supportano i DM è **l'abbinamento**:
      - I mittenti sconosciuti ricevono un codice di abbinamento; il bot non elabora il loro messaggio.
      - Approva con: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Le richieste in sospeso sono limitate a **3 per canale**; controlla `openclaw pairing list --channel <channel> [--account <id>]` se non è arrivato un codice.
    - L'apertura pubblica dei DM richiede un opt-in esplicito (`dmPolicy: "open"` e allowlist `"*"`).

    Esegui `openclaw doctor` per evidenziare policy DM rischiose.

  </Accordion>

  <Accordion title="La prompt injection è un problema solo per i bot pubblici?">
    No. La prompt injection riguarda il **contenuto non attendibile**, non solo chi può inviare DM al bot.
    Se il tuo assistente legge contenuti esterni (ricerca/recupero web, pagine del browser, email,
    documenti, allegati, log incollati), quel contenuto può includere istruzioni che tentano
    di dirottare il modello. Può succedere anche se **sei l'unico mittente**.

    Il rischio maggiore è quando gli strumenti sono abilitati: il modello può essere ingannato e indotto a
    esfiltrare contesto o chiamare strumenti per tuo conto. Riduci il raggio d'impatto:

    - usando un agente "lettore" di sola lettura o senza strumenti per riassumere contenuti non attendibili
    - mantenendo `web_search` / `web_fetch` / `browser` disattivati per gli agenti con strumenti abilitati
    - trattando anche il testo decodificato di file/documenti come non attendibile: OpenResponses
      `input_file` e l'estrazione dagli allegati media racchiudono entrambi il testo estratto in
      marcatori espliciti di confine del contenuto esterno invece di passare testo file grezzo
    - usando sandboxing e allowlist degli strumenti rigorose

    Dettagli: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="OpenClaw è meno sicuro perché usa TypeScript/Node invece di Rust/WASM?">
    Linguaggio e runtime contano, ma non sono il rischio principale per un agente personale.
    I rischi pratici di OpenClaw sono l'esposizione del gateway, chi può inviare messaggi al
    bot, prompt injection, ambito degli strumenti, gestione delle credenziali, accesso al browser, accesso exec
    e affidabilità di skill o plugin di terze parti.

    Rust e WASM possono offrire un isolamento più forte per alcune classi di codice, ma
    non risolvono prompt injection, allowlist errate, esposizione pubblica del gateway,
    strumenti troppo ampi o un profilo browser già autenticato in account
    sensibili. Tratta questi aspetti come i controlli primari:

    - mantieni il Gateway privato o autenticato
    - usa abbinamento e allowlist per DM e gruppi
    - nega o isola in sandbox gli strumenti rischiosi per input non attendibili
    - installa solo plugin e skill attendibili
    - esegui `openclaw security audit --deep` dopo modifiche alla configurazione

    Dettagli: [Sicurezza](/it/gateway/security), [Sandboxing](/it/gateway/sandboxing).

  </Accordion>

  <Accordion title="Ho visto segnalazioni su istanze OpenClaw esposte. Cosa devo controllare?">
    Prima controlla la tua distribuzione effettiva:

    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    Una baseline più sicura è:

    - Gateway vincolato a `loopback`, oppure esposto solo tramite accesso privato
      autenticato come tailnet, tunnel SSH, autenticazione token/password o un proxy attendibile
      configurato correttamente
    - DM in modalità `pairing` o `allowlist`
    - gruppi in allowlist e vincolati a menzione, a meno che ogni membro sia attendibile
    - strumenti ad alto rischio (`exec`, `browser`, `gateway`, `cron`) negati o strettamente
      limitati per gli agenti che leggono contenuti non attendibili
    - sandboxing abilitato dove l'esecuzione degli strumenti richiede un raggio d'impatto più piccolo

    Binding pubblici senza autenticazione, DM/gruppi aperti con strumenti e controllo del browser
    esposto sono i problemi da correggere per primi. Dettagli:
    [Checklist di audit della sicurezza](/it/gateway/security#security-audit-checklist).

  </Accordion>

  <Accordion title="Le skill di ClawHub e i plugin di terze parti sono sicuri da installare?">
    Tratta skill e plugin di terze parti come codice a cui scegli di dare fiducia.
    Le pagine delle skill di ClawHub espongono lo stato della scansione prima dell'installazione, ma le scansioni non sono un
    confine di sicurezza completo. OpenClaw non esegue un blocco locale
    integrato del codice pericoloso durante i flussi di installazione/aggiornamento di plugin o skill; usa
    `security.installPolicy` di proprietà dell'operatore per decisioni locali di autorizzazione/blocco.

    Schema più sicuro:

    - preferisci autori attendibili e versioni fissate
    - leggi la skill o il plugin prima di abilitarlo
    - mantieni ristrette le allowlist di plugin e skill
    - esegui i workflow con input non attendibili in una sandbox con strumenti minimi
    - evita di concedere a codice di terze parti accesso ampio a filesystem, exec, browser o segreti

    Dettagli: [Skills](/it/tools/skills), [Plugin](/it/tools/plugin),
    [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Il mio bot dovrebbe avere un proprio indirizzo email, account GitHub o numero di telefono?">
    Sì, per la maggior parte delle configurazioni. Isolare il bot con account e numeri di telefono separati
    riduce il raggio d'impatto se qualcosa va storto. Questo rende anche più semplice ruotare
    le credenziali o revocare l'accesso senza incidere sui tuoi account personali.

    Inizia in piccolo. Concedi l'accesso solo agli strumenti e agli account di cui hai davvero bisogno, ed espandilo
    in seguito se necessario.

    Documentazione: [Sicurezza](/it/gateway/security), [Associazione](/it/channels/pairing).

  </Accordion>

  <Accordion title="Posso dargli autonomia sui miei messaggi di testo ed è sicuro?">
    **Non** consigliamo la piena autonomia sui tuoi messaggi personali. Lo schema più sicuro è:

    - Mantieni i messaggi diretti in **modalità di associazione** o in un elenco consentiti ristretto.
    - Usa un **numero o account separato** se vuoi che invii messaggi per tuo conto.
    - Lascia che prepari una bozza, poi **approva prima dell'invio**.

    Se vuoi sperimentare, fallo su un account dedicato e mantienilo isolato. Consulta
    [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Posso usare modelli più economici per attività da assistente personale?">
    Sì, **se** l'agente è solo chat e l'input è attendibile. I livelli più piccoli sono
    più suscettibili al dirottamento delle istruzioni, quindi evitali per agenti con strumenti abilitati
    o quando leggono contenuti non attendibili. Se devi usare un modello più piccolo, limita
    gli strumenti ed eseguilo dentro una sandbox. Consulta [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Ho eseguito /start in Telegram ma non ho ricevuto un codice di associazione">
    I codici di associazione vengono inviati **solo** quando un mittente sconosciuto invia un messaggio al bot e
    `dmPolicy: "pairing"` è abilitato. `/start` da solo non genera un codice.

    Controlla le richieste in sospeso:

    ```bash
    openclaw pairing list telegram
    ```

    Se vuoi accesso immediato, aggiungi il tuo id mittente all'elenco consentiti o imposta `dmPolicy: "open"`
    per quell'account.

  </Accordion>

  <Accordion title="WhatsApp: invierà messaggi ai miei contatti? Come funziona l'associazione?">
    No. La policy predefinita per i messaggi diretti di WhatsApp è **associazione**. I mittenti sconosciuti ricevono solo un codice di associazione e il loro messaggio **non viene elaborato**. OpenClaw risponde solo alle chat che riceve o agli invii espliciti che attivi tu.

    Approva l'associazione con:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Elenca le richieste in sospeso:

    ```bash
    openclaw pairing list whatsapp
    ```

    Prompt del numero di telefono della procedura guidata: viene usato per impostare il tuo **elenco consentiti/proprietario** in modo che i tuoi messaggi diretti siano consentiti. Non viene usato per l'invio automatico. Se lo esegui sul tuo numero WhatsApp personale, usa quel numero e abilita `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandi chat, interruzione delle attività e "non si ferma"

<AccordionGroup>
  <Accordion title="Come impedisco che i messaggi interni di sistema vengano mostrati in chat?">
    La maggior parte dei messaggi interni o degli strumenti compare solo quando **verbose**, **trace** o **reasoning** è abilitato
    per quella sessione.

    Correggi nella chat in cui lo vedi:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Se è ancora troppo rumoroso, controlla le impostazioni della sessione nella Control UI e imposta verbose
    su **inherit**. Conferma anche che tu non stia usando un profilo bot con `verboseDefault` impostato
    su `on` nella configurazione.

    Documentazione: [Pensiero e verbose](/it/tools/thinking), [Sicurezza](/it/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Come fermo/annullo un'attività in esecuzione?">
    Invia una di queste frasi **come messaggio autonomo** (senza slash):

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

    Panoramica dei comandi slash: consulta [Comandi slash](/it/tools/slash-commands).

    La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`, ma alcune scorciatoie (come `/status`) funzionano anche inline per i mittenti nell'elenco consentiti.

  </Accordion>

  <Accordion title='Come invio un messaggio Discord da Telegram? ("Messaggistica tra contesti negata")'>
    OpenClaw blocca per impostazione predefinita la messaggistica **tra provider**. Se una chiamata strumento è associata
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

  <Accordion title='Perché sembra che il bot "ignori" i messaggi in rapida successione?'>
    Per impostazione predefinita, i prompt durante l'esecuzione vengono indirizzati nell'esecuzione attiva. Usa `/queue` per scegliere il comportamento dell'esecuzione attiva:

    - `steer` - guida l'esecuzione attiva al prossimo limite del modello
    - `followup` - accoda i messaggi ed eseguili uno alla volta dopo la fine dell'esecuzione corrente
    - `collect` - accoda i messaggi compatibili e rispondi una volta dopo la fine dell'esecuzione corrente
    - `interrupt` - interrompi l'esecuzione corrente e riparti da capo

    La modalità predefinita è `steer`. Puoi aggiungere opzioni come `debounce:0.5s cap:25 drop:summarize` per le modalità in coda. Consulta [Coda dei comandi](/it/concepts/queue) e [Coda di guida](/it/concepts/queue-steering).

  </Accordion>
</AccordionGroup>

## Varie

<AccordionGroup>
  <Accordion title='Qual è il modello predefinito per Anthropic con una chiave API?'>
    In OpenClaw, credenziali e selezione del modello sono separate. Impostare `ANTHROPIC_API_KEY` (o archiviare una chiave API Anthropic nei profili di autenticazione) abilita l'autenticazione, ma il modello predefinito effettivo è quello che configuri in `agents.defaults.model.primary` (per esempio, `anthropic/claude-sonnet-4-6` o `anthropic/claude-opus-4-6`). Se vedi `No credentials found for profile "anthropic:default"`, significa che il Gateway non è riuscito a trovare le credenziali Anthropic nell'`auth-profiles.json` previsto per l'agente in esecuzione.
  </Accordion>
</AccordionGroup>

---

Ancora bloccato? Chiedi su [Discord](https://discord.com/invite/clawd) o apri una [discussione GitHub](https://github.com/openclaw/openclaw/discussions).

## Correlati

- [FAQ sul primo avvio](/it/help/faq-first-run) — installazione, onboarding, autenticazione, abbonamenti, errori iniziali
- [FAQ sui modelli](/it/help/faq-models) — selezione del modello, failover, profili di autenticazione
- [Risoluzione dei problemi](/it/help/troubleshooting) — triage partendo dai sintomi
