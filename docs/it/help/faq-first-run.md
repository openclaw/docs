---
read_when:
    - Nuova installazione, configurazione iniziale bloccata o errori alla prima esecuzione
    - Scelta dell'autenticazione e degli abbonamenti ai provider
    - Impossibile accedere a docs.openclaw.ai, impossibile aprire la dashboard, installazione bloccata
sidebarTitle: First-run FAQ
summary: 'FAQ: guida rapida e configurazione al primo avvio — installazione, onboarding, autenticazione, abbonamenti, errori iniziali'
title: 'FAQ: configurazione al primo avvio'
x-i18n:
    generated_at: "2026-05-12T00:58:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24ce8cda091fd7d1bdcb405d421a1a3cabb134c3cc36b42f11b9b3f97782794b
    source_path: help/faq-first-run.md
    workflow: 16
---

  Q&A per avvio rapido e prima esecuzione. Per le operazioni quotidiane, i modelli, l'autenticazione, le sessioni
  e la risoluzione dei problemi, consulta le [FAQ](/it/help/faq) principali.

  ## Avvio rapido e configurazione della prima esecuzione

  <AccordionGroup>
  <Accordion title="Sono bloccato, il modo più rapido per sbloccarmi">
    Usa un agente IA locale che possa **vedere la tua macchina**. È molto più efficace che chiedere
    su Discord, perché la maggior parte dei casi "sono bloccato" riguarda **problemi locali di configurazione o ambiente** che
    gli aiutanti remoti non possono ispezionare.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Questi strumenti possono leggere il repo, eseguire comandi, ispezionare i log e aiutare a correggere la configurazione
    a livello di macchina (PATH, servizi, permessi, file di autenticazione). Dai loro il **checkout completo dei sorgenti** tramite
    l'installazione hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Questo installa OpenClaw **da un checkout git**, quindi l'agente può leggere codice e documentazione e
    ragionare sulla versione esatta che stai eseguendo. Puoi sempre tornare alla versione stabile in seguito
    rieseguendo l'installer senza `--install-method git`.

    Suggerimento: chiedi all'agente di **pianificare e supervisionare** la correzione (passo per passo), poi esegui solo i
    comandi necessari. Questo mantiene le modifiche piccole e più facili da verificare.

    Se scopri un bug reale o una correzione, apri una issue su GitHub o invia una PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Inizia con questi comandi (condividi gli output quando chiedi aiuto):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Cosa fanno:

    - `openclaw status`: istantanea rapida dello stato di gateway/agente + configurazione di base.
    - `openclaw models status`: controlla l'autenticazione del provider + disponibilità dei modelli.
    - `openclaw doctor`: convalida e ripara problemi comuni di configurazione/stato.

    Altri controlli CLI utili: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Ciclo rapido di debug: [Primi 60 secondi se qualcosa è rotto](/it/help/faq#first-60-seconds-if-something-is-broken).
    Documenti di installazione: [Installazione](/it/install), [Flag dell'installer](/it/install/installer), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continua a saltare. Che cosa significano i motivi di salto?">
    Motivi comuni per cui Heartbeat viene saltato:

    - `quiet-hours`: fuori dalla finestra active-hours configurata
    - `empty-heartbeat-file`: `HEARTBEAT.md` esiste ma contiene solo impalcatura vuota o solo intestazioni
    - `no-tasks-due`: la modalità attività di `HEARTBEAT.md` è attiva ma nessuno degli intervalli delle attività è ancora scaduto
    - `alerts-disabled`: tutta la visibilità di Heartbeat è disabilitata (`showOk`, `showAlerts` e `useIndicator` sono tutti disattivati)

    In modalità attività, i timestamp di scadenza vengono avanzati solo dopo il completamento
    di una vera esecuzione di Heartbeat. Le esecuzioni saltate non segnano le attività come completate.

    Documenti: [Heartbeat](/it/gateway/heartbeat), [Automazione](/it/automation).

  </Accordion>

  <Accordion title="Modo consigliato per installare e configurare OpenClaw">
    Il repo consiglia di eseguire dai sorgenti e usare l'onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata può anche compilare automaticamente gli asset dell'interfaccia. Dopo l'onboarding, di solito esegui il Gateway sulla porta **18789**.

    Dai sorgenti (contributor/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Se non hai ancora un'installazione globale, eseguilo tramite `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Come apro la dashboard dopo l'onboarding?">
    La procedura guidata apre il browser con un URL pulito (non tokenizzato) della dashboard subito dopo l'onboarding e stampa anche il link nel riepilogo. Tieni aperta quella scheda; se non si è avviata, copia/incolla l'URL stampato sulla stessa macchina.
  </Accordion>

  <Accordion title="Come autentico la dashboard su localhost rispetto a remoto?">
    **Localhost (stessa macchina):**

    - Apri `http://127.0.0.1:18789/`.
    - Se richiede l'autenticazione con segreto condiviso, incolla il token o la password configurati nelle impostazioni della Control UI.
    - Origine del token: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
    - Origine della password: `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Se non è ancora configurato alcun segreto condiviso, genera un token con `openclaw doctor --generate-gateway-token`.

    **Non su localhost:**

    - **Tailscale Serve** (consigliato): mantieni il bind su loopback, esegui `openclaw gateway --tailscale serve`, apri `https://<magicdns>/`. Se `gateway.auth.allowTailscale` è `true`, gli header di identità soddisfano l'autenticazione Control UI/WebSocket (nessun segreto condiviso incollato, presuppone un host Gateway attendibile); le API HTTP richiedono ancora l'autenticazione con segreto condiviso, a meno che tu non usi deliberatamente private-ingress `none` o l'autenticazione HTTP trusted-proxy.
      I tentativi errati simultanei di autenticazione Serve dallo stesso client vengono serializzati prima che il limitatore di autenticazione fallita li registri, quindi il secondo nuovo tentativo errato può già mostrare `retry later`.
    - **Bind tailnet**: esegui `openclaw gateway --bind tailnet --token "<token>"` (o configura l'autenticazione con password), apri `http://<tailscale-ip>:18789/`, poi incolla il segreto condiviso corrispondente nelle impostazioni della dashboard.
    - **Reverse proxy consapevole dell'identità**: tieni il Gateway dietro un proxy attendibile, configura `gateway.auth.mode: "trusted-proxy"`, poi apri l'URL del proxy. I proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`. L'autenticazione con segreto condiviso si applica comunque sul tunnel; incolla il token o la password configurati se richiesto.

    Consulta [Dashboard](/it/web/dashboard) e [Superfici web](/it/web) per i dettagli su modalità di bind e autenticazione.

  </Accordion>

  <Accordion title="Perché ci sono due configurazioni di approvazione exec per le approvazioni in chat?">
    Controllano livelli diversi:

    - `approvals.exec`: inoltra le richieste di approvazione alle destinazioni chat
    - `channels.<channel>.execApprovals`: fa sì che quel canale agisca come client di approvazione nativo per le approvazioni exec

    La policy exec dell'host è ancora il vero gate di approvazione. La configurazione chat controlla solo dove
    compaiono le richieste di approvazione e come le persone possono rispondere.

    Nella maggior parte delle configurazioni **non** servono entrambe:

    - Se la chat supporta già comandi e risposte, `/approve` nella stessa chat funziona tramite il percorso condiviso.
    - Se un canale nativo supportato può dedurre gli approvatori in modo sicuro, OpenClaw ora abilita automaticamente le approvazioni native prima in DM quando `channels.<channel>.execApprovals.enabled` non è impostato o è `"auto"`.
    - Quando sono disponibili card/pulsanti di approvazione nativi, quell'interfaccia nativa è il percorso principale; l'agente dovrebbe includere un comando manuale `/approve` solo se il risultato dello strumento dice che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    - Usa `approvals.exec` solo quando le richieste devono essere inoltrate anche ad altre chat o stanze operative esplicite.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo quando vuoi esplicitamente che le richieste di approvazione siano pubblicate nella stanza/argomento di origine.
    - Le approvazioni Plugin sono separate: usano `/approve` nella stessa chat per impostazione predefinita, l'inoltro opzionale `approvals.plugin` e solo alcuni canali nativi mantengono anche la gestione plugin-approval-native.

    Versione breve: l'inoltro serve per il routing, la configurazione del client nativo serve per una UX più ricca e specifica del canale.
    Consulta [Approvazioni Exec](/it/tools/exec-approvals).

  </Accordion>

  <Accordion title="Di quale runtime ho bisogno?">
    È richiesto Node **>= 22**. `pnpm` è consigliato. Bun **non è consigliato** per il Gateway.
  </Accordion>

  <Accordion title="Funziona su Raspberry Pi?">
    Sì. Il Gateway è leggero: i documenti indicano **512MB-1GB RAM**, **1 core** e circa **500MB**
    di disco come sufficienti per l'uso personale, e segnalano che un **Raspberry Pi 4 può eseguirlo**.

    Se vuoi margine extra (log, media, altri servizi), **2GB sono consigliati**, ma
    non sono un minimo rigido.

    Suggerimento: un piccolo Pi/VPS può ospitare il Gateway, e puoi associare **nodi** sul tuo laptop/telefono per
    schermo/camera/canvas locali o esecuzione di comandi. Consulta [Nodi](/it/nodes).

  </Accordion>

  <Accordion title="Hai suggerimenti per installazioni su Raspberry Pi?">
    Versione breve: funziona, ma aspettati spigoli vivi.

    - Usa un sistema operativo **64-bit** e mantieni Node >= 22.
    - Preferisci l'**installazione hackable (git)** così puoi vedere i log e aggiornare rapidamente.
    - Inizia senza canali/Skills, poi aggiungili uno per volta.
    - Se incontri strani problemi binari, di solito è un problema di **compatibilità ARM**.

    Documenti: [Linux](/it/platforms/linux), [Installazione](/it/install).

  </Accordion>

  <Accordion title="È bloccato su wake up my friend / l'onboarding non si schiude. E adesso?">
    Quella schermata dipende dal fatto che il Gateway sia raggiungibile e autenticato. Anche la TUI invia
    "Wake up, my friend!" automaticamente alla prima schiusa. Se vedi quella riga senza **nessuna risposta**
    e i token restano a 0, l'agente non è mai stato eseguito.

    1. Riavvia il Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Controlla stato + autenticazione:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Se resta bloccato, esegui:

    ```bash
    openclaw doctor
    ```

    Se il Gateway è remoto, assicurati che la connessione tunnel/Tailscale sia attiva e che l'interfaccia
    punti al Gateway corretto. Consulta [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrare la mia configurazione su una nuova macchina (Mac mini) senza rifare l'onboarding?">
    Sì. Copia la **directory di stato** e il **workspace**, poi esegui Doctor una volta. Questo
    mantiene il tuo bot "esattamente uguale" (memoria, cronologia sessioni, autenticazione e stato dei canali)
    purché tu copi **entrambe** le posizioni:

    1. Installa OpenClaw sulla nuova macchina.
    2. Copia `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`) dalla vecchia macchina.
    3. Copia il tuo workspace (predefinito: `~/.openclaw/workspace`).
    4. Esegui `openclaw doctor` e riavvia il servizio Gateway.

    Questo preserva configurazione, profili di autenticazione, credenziali WhatsApp, sessioni e memoria. Se sei in
    modalità remota, ricorda che l'host del gateway possiede lo store delle sessioni e il workspace.

    **Importante:** se fai solo commit/push del tuo workspace su GitHub, stai facendo il backup
    di **memoria + file di bootstrap**, ma **non** della cronologia sessioni o dell'autenticazione. Questi risiedono
    sotto `~/.openclaw/` (per esempio `~/.openclaw/agents/<agentId>/sessions/`).

    Correlati: [Migrazione](/it/install/migrating), [Dove risiedono le cose su disco](/it/help/faq#where-things-live-on-disk),
    [Workspace dell'agente](/it/concepts/agent-workspace), [Doctor](/it/gateway/doctor),
    [Modalità remota](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove vedo le novità della versione più recente?">
    Controlla il changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Le voci più recenti sono in alto. Se la sezione superiore è contrassegnata come **Unreleased**, la successiva
    sezione datata è l'ultima versione rilasciata. Le voci sono raggruppate per **Highlights**, **Changes** e
    **Fixes** (più sezioni documenti/altro quando necessario).

  </Accordion>

  <Accordion title="Impossibile accedere a docs.openclaw.ai (errore SSL)">
    Alcune connessioni Comcast/Xfinity bloccano erroneamente `docs.openclaw.ai` tramite Xfinity
    Advanced Security. Disabilitalo o inserisci `docs.openclaw.ai` nella allowlist, quindi riprova.
    Aiutaci a sbloccarlo segnalando qui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se non riesci ancora a raggiungere il sito, i documenti sono mirrorati su GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Differenza tra stabile e beta">
    **Stabile** e **beta** sono **dist-tag npm**, non linee di codice separate:

    - `latest` = stabile
    - `beta` = build preliminare per il test

    Di solito, una release stabile arriva prima su **beta**, poi un passaggio esplicito
    di promozione sposta quella stessa versione su `latest`. I manutentori possono anche
    pubblicare direttamente su `latest` quando necessario. Ecco perché beta e stabile possono
    puntare alla **stessa versione** dopo la promozione.

    Vedi cosa è cambiato:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Per i comandi di installazione in una riga e la differenza tra beta e dev, vedi l'accordion qui sotto.

  </Accordion>

  <Accordion title="Come installo la versione beta e qual è la differenza tra beta e dev?">
    **Beta** è il dist-tag npm `beta` (può corrispondere a `latest` dopo la promozione).
    **Dev** è la testa mobile di `main` (git); quando viene pubblicato, usa il dist-tag npm `dev`.

    Comandi in una riga (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Programma di installazione Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Maggiori dettagli: [Canali di sviluppo](/it/install/development-channels) e [Flag del programma di installazione](/it/install/installer).

  </Accordion>

  <Accordion title="Come provo i componenti più recenti?">
    Due opzioni:

    1. **Canale dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Questo passa al ramo `main` e aggiorna dal sorgente.

    2. **Installazione modificabile (dal sito del programma di installazione):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Questo ti dà un repository locale che puoi modificare, poi aggiornare tramite git.

    Se preferisci un clone pulito manuale, usa:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentazione: [Aggiornamento](/it/cli/update), [Canali di sviluppo](/it/install/development-channels),
    [Installazione](/it/install).

  </Accordion>

  <Accordion title="Quanto durano di solito installazione e onboarding?">
    Indicazione approssimativa:

    - **Installazione:** 2-5 minuti
    - **Onboarding:** 5-15 minuti a seconda di quanti canali/modelli configuri

    Se si blocca, usa [Programma di installazione bloccato](#quick-start-and-first-run-setup)
    e il ciclo rapido di debug in [Sono bloccato](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Programma di installazione bloccato? Come ottengo più feedback?">
    Riesegui il programma di installazione con **output dettagliato**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Installazione beta con output dettagliato:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Per un'installazione modificabile (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Equivalente Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Altre opzioni: [Flag del programma di installazione](/it/install/installer).

  </Accordion>

  <Accordion title="L'installazione Windows dice git non trovato oppure openclaw non riconosciuto">
    Due problemi comuni su Windows:

    **1) errore npm spawn git / git non trovato**

    - Installa **Git for Windows** e assicurati che `git` sia nel tuo PATH.
    - Chiudi e riapri PowerShell, poi riesegui il programma di installazione.

    **2) openclaw non viene riconosciuto dopo l'installazione**

    - La cartella bin globale di npm non è nel PATH.
    - Controlla il percorso:

      ```powershell
      npm config get prefix
      ```

    - Aggiungi quella directory al PATH utente (su Windows non serve il suffisso `\bin`; sulla maggior parte dei sistemi è `%AppData%\npm`).
    - Chiudi e riapri PowerShell dopo aver aggiornato PATH.

    Se vuoi la configurazione Windows più fluida, usa **WSL2** invece di Windows nativo.
    Documentazione: [Windows](/it/platforms/windows).

  </Accordion>

  <Accordion title="L'output exec su Windows mostra testo cinese illeggibile: cosa devo fare?">
    Di solito è una mancata corrispondenza della code page della console nelle shell Windows native.

    Sintomi:

    - L'output di `system.run`/`exec` rende il cinese come mojibake
    - Lo stesso comando appare corretto in un altro profilo terminale

    Soluzione rapida in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Poi riavvia il Gateway e riprova il comando:

    ```powershell
    openclaw gateway restart
    ```

    Se riesci ancora a riprodurlo sull'ultima versione di OpenClaw, traccialo/segnalalo in:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentazione non ha risposto alla mia domanda: come ottengo una risposta migliore?">
    Usa l'**installazione modificabile (git)** così hai localmente l'intero sorgente e la documentazione, poi chiedi
    al tuo bot (o a Claude/Codex) _da quella cartella_ in modo che possa leggere il repository e rispondere con precisione.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Maggiori dettagli: [Installazione](/it/install) e [Flag del programma di installazione](/it/install/installer).

  </Accordion>

  <Accordion title="Come installo OpenClaw su Linux?">
    Risposta breve: segui la guida Linux, poi esegui l'onboarding.

    - Percorso rapido Linux + installazione del servizio: [Linux](/it/platforms/linux).
    - Procedura completa: [Per iniziare](/it/start/getting-started).
    - Programma di installazione + aggiornamenti: [Installazione e aggiornamenti](/it/install/updating).

  </Accordion>

  <Accordion title="Come installo OpenClaw su un VPS?">
    Qualsiasi VPS Linux funziona. Installa sul server, poi usa SSH/Tailscale per raggiungere il Gateway.

    Guide: [exe.dev](/it/install/exe-dev), [Hetzner](/it/install/hetzner), [Fly.io](/it/install/fly).
    Accesso remoto: [Gateway remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove sono le guide di installazione cloud/VPS?">
    Manteniamo un **hub di hosting** con i provider comuni. Scegline uno e segui la guida:

    - [Hosting VPS](/it/vps) (tutti i provider in un unico posto)
    - [Fly.io](/it/install/fly)
    - [Hetzner](/it/install/hetzner)
    - [exe.dev](/it/install/exe-dev)

    Come funziona nel cloud: il **Gateway viene eseguito sul server** e tu vi accedi
    dal tuo laptop/telefono tramite la Control UI (o Tailscale/SSH). Il tuo stato + workspace
    vivono sul server, quindi considera l'host come la fonte di verità ed eseguine il backup.

    Puoi associare **nodi** (Mac/iOS/Android/headless) a quel Gateway cloud per accedere
    a schermo/camera/canvas locali o eseguire comandi sul tuo laptop mantenendo il
    Gateway nel cloud.

    Hub: [Piattaforme](/it/platforms). Accesso remoto: [Gateway remoto](/it/gateway/remote).
    Nodi: [Nodi](/it/nodes), [CLI dei nodi](/it/cli/nodes).

  </Accordion>

  <Accordion title="Posso chiedere a OpenClaw di aggiornarsi da solo?">
    Risposta breve: **possibile, non consigliato**. Il flusso di aggiornamento può riavviare il
    Gateway (interrompendo la sessione attiva), può richiedere un checkout git pulito e
    può chiedere conferma. Più sicuro: esegui gli aggiornamenti da una shell come operatore.

    Usa la CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Se devi automatizzare da un agent:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentazione: [Aggiornamento](/it/cli/update), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Cosa fa effettivamente l'onboarding?">
    `openclaw onboard` è il percorso di configurazione consigliato. In **modalità locale** ti guida attraverso:

    - **Configurazione modello/auth** (OAuth del provider, chiavi API, setup-token Anthropic, più opzioni di modelli locali come LM Studio)
    - Posizione del **workspace** + file di bootstrap
    - **Impostazioni Gateway** (bind/porta/auth/tailscale)
    - **Canali** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, più plugin di canale inclusi come QQ Bot)
    - **Installazione daemon** (LaunchAgent su macOS; unità utente systemd su Linux/WSL2)
    - **Controlli di salute** e selezione delle **skills**

    Avvisa anche se il tuo modello configurato è sconosciuto o manca l'autenticazione.

  </Accordion>

  <Accordion title="Mi serve un abbonamento Claude o OpenAI per eseguirlo?">
    No. Puoi eseguire OpenClaw con **chiavi API** (Anthropic/OpenAI/altri) o con
    **modelli solo locali** così i tuoi dati restano sul tuo dispositivo. Gli abbonamenti (Claude
    Pro/Max o OpenAI Codex) sono modi opzionali per autenticare quei provider.

    Per Anthropic in OpenClaw, la divisione pratica è:

    - **Chiave API Anthropic**: normale fatturazione API Anthropic
    - **Claude CLI / autenticazione abbonamento Claude in OpenClaw**: lo staff Anthropic
      ci ha detto che questo uso è di nuovo consentito, e OpenClaw considera l'uso di `claude -p`
      come approvato per questa integrazione a meno che Anthropic non pubblichi una nuova
      policy

    Per host gateway di lunga durata, le chiavi API Anthropic restano comunque la configurazione più
    prevedibile. OpenAI Codex OAuth è supportato esplicitamente per strumenti esterni
    come OpenClaw.

    OpenClaw supporta anche altre opzioni ospitate in stile abbonamento, tra cui
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** e
    **Z.AI / GLM Coding Plan**.

    Documentazione: [Anthropic](/it/providers/anthropic), [OpenAI](/it/providers/openai),
    [Qwen Cloud](/it/providers/qwen),
    [MiniMax](/it/providers/minimax), [Modelli GLM](/it/providers/glm),
    [Modelli locali](/it/gateway/local-models), [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Posso usare l'abbonamento Claude Max senza una chiave API?">
    Sì.

    Lo staff Anthropic ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi
    OpenClaw considera l'autenticazione tramite abbonamento Claude e l'uso di `claude -p` come approvati
    per questa integrazione, a meno che Anthropic non pubblichi una nuova policy. Se vuoi
    la configurazione lato server più prevedibile, usa invece una chiave API Anthropic.

  </Accordion>

  <Accordion title="Supportate l'autenticazione tramite abbonamento Claude (Claude Pro o Max)?">
    Sì.

    Lo staff Anthropic ci ha detto che questo uso è di nuovo consentito, quindi OpenClaw considera
    il riuso di Claude CLI e l'uso di `claude -p` come approvati per questa integrazione
    a meno che Anthropic non pubblichi una nuova policy.

    Il setup-token Anthropic è ancora disponibile come percorso di token OpenClaw supportato, ma ora OpenClaw preferisce il riuso di Claude CLI e `claude -p` quando disponibili.
    Per carichi di lavoro di produzione o multiutente, l'autenticazione con chiave API Anthropic resta comunque la scelta
    più sicura e prevedibile. Se vuoi altre opzioni ospitate in stile abbonamento
    in OpenClaw, vedi [OpenAI](/it/providers/openai), [Qwen / Model
    Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax) e [Modelli
    GLM](/it/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Perché vedo HTTP 429 rate_limit_error da Anthropic?">
    Significa che la tua **quota/limite di frequenza Anthropic** è esaurita per la finestra corrente. Se
    usi **Claude CLI**, attendi il ripristino della finestra o aggiorna il tuo piano. Se
    usi una **chiave API Anthropic**, controlla l'Anthropic Console
    per uso/fatturazione e aumenta i limiti secondo necessità.

    Se il messaggio è specificamente:
    `Extra usage is required for long context requests`, la richiesta sta tentando di usare
    la beta del contesto 1M di Anthropic (`context1m: true`). Funziona solo quando le tue
    credenziali sono idonee per la fatturazione del contesto lungo (fatturazione con chiave API o il
    percorso di login Claude di OpenClaw con Extra Usage abilitato).

    Suggerimento: imposta un **modello di fallback** così OpenClaw può continuare a rispondere mentre un provider è soggetto a limiti di frequenza.
    Vedi [Modelli](/it/cli/models), [OAuth](/it/concepts/oauth) e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/it/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock è supportato?">
    Sì. OpenClaw include un provider **Amazon Bedrock (Converse)** integrato. Con i marcatori di ambiente AWS presenti, OpenClaw può rilevare automaticamente il catalogo Bedrock streaming/testo e unirlo come provider implicito `amazon-bedrock`; altrimenti puoi abilitare esplicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` o aggiungere una voce provider manuale. Vedi [Amazon Bedrock](/it/providers/bedrock) e [Provider di modelli](/it/providers/models). Se preferisci un flusso di chiavi gestito, resta valida anche l'opzione di un proxy compatibile con OpenAI davanti a Bedrock.
  </Accordion>

  <Accordion title="Come funziona l'autenticazione di Codex?">
    OpenClaw supporta **OpenAI Code (Codex)** tramite OAuth (accesso ChatGPT). Usa
    `openai/gpt-5.5` per la configurazione comune: autenticazione con abbonamento ChatGPT/Codex più
    esecuzione nativa del server app Codex. I riferimenti modello `openai-codex/gpt-*` sono
    configurazione legacy riparata da `openclaw doctor --fix`. L'accesso diretto con chiave API OpenAI
    resta disponibile per le superfici API OpenAI non agent e per i modelli agent
    tramite un profilo con chiave API `openai-codex` ordinato.
    Vedi [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).
  </Accordion>

  <Accordion title="Perché OpenClaw menziona ancora openai-codex?">
    `openai-codex` è il provider e l'id del profilo di autenticazione per ChatGPT/Codex OAuth.
    Le configurazioni più vecchie lo usavano anche come prefisso modello:

    - `openai/gpt-5.5` = autenticazione con abbonamento ChatGPT/Codex con runtime Codex nativo per i turni agent
    - `openai-codex/gpt-5.5` = route modello legacy riparata da `openclaw doctor --fix`
    - `openai/gpt-5.5` più un profilo con chiave API `openai-codex` ordinato = autenticazione con chiave API per un modello agent OpenAI
    - `openai-codex:...` = id del profilo di autenticazione, non un riferimento modello

    Se vuoi il percorso diretto con fatturazione/limiti della OpenAI Platform, imposta
    `OPENAI_API_KEY`. Se vuoi l'autenticazione con abbonamento ChatGPT/Codex, accedi con
    `openclaw models auth login --provider openai-codex`. Mantieni il riferimento modello come
    `openai/gpt-5.5`; i riferimenti modello `openai-codex/*` sono configurazione legacy che
    `openclaw doctor --fix` riscrive.

  </Accordion>

  <Accordion title="Perché i limiti di Codex OAuth possono differire dal web di ChatGPT?">
    Codex OAuth usa finestre di quota gestite da OpenAI e dipendenti dal piano. In pratica,
    questi limiti possono differire dall'esperienza sul sito web/app ChatGPT, anche quando
    entrambi sono collegati allo stesso account.

    OpenClaw può mostrare le finestre di utilizzo/quota del provider attualmente visibili in
    `openclaw models status`, ma non inventa né normalizza i diritti del web ChatGPT
    trasformandoli in accesso API diretto. Se vuoi il percorso diretto con fatturazione/limiti
    della OpenAI Platform, usa `openai/*` con una chiave API.

  </Accordion>

  <Accordion title="Supportate l'autenticazione con abbonamento OpenAI (Codex OAuth)?">
    Sì. OpenClaw supporta pienamente **OpenAI Code (Codex) subscription OAuth**.
    OpenAI consente esplicitamente l'uso di subscription OAuth in strumenti/flussi di lavoro esterni
    come OpenClaw. L'onboarding può eseguire il flusso OAuth per te.

    Vedi [OAuth](/it/concepts/oauth), [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).

  </Accordion>

  <Accordion title="Come configuro Gemini CLI OAuth?">
    Gemini CLI usa un **flusso di autenticazione Plugin**, non un client id o un secret in `openclaw.json`.

    Passaggi:

    1. Installa Gemini CLI localmente così `gemini` è in `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Abilita il Plugin: `openclaw plugins enable google`
    3. Accedi: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modello predefinito dopo l'accesso: `google-gemini-cli/gemini-3-flash-preview`
    5. Se le richieste falliscono, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host del Gateway

    Questo memorizza i token OAuth nei profili di autenticazione sull'host del Gateway. Dettagli: [Provider di modelli](/it/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modello locale va bene per chat informali?">
    Di solito no. OpenClaw richiede un contesto ampio + sicurezza forte; le schede piccole troncano e perdono informazioni. Se devi farlo, esegui localmente la build del modello **più grande** possibile (LM Studio) e consulta [/gateway/local-models](/it/gateway/local-models). I modelli più piccoli/quantizzati aumentano il rischio di prompt injection - vedi [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Come mantengo il traffico dei modelli ospitati in una regione specifica?">
    Scegli endpoint vincolati alla regione. OpenRouter espone opzioni ospitate negli Stati Uniti per MiniMax, Kimi e GLM; scegli la variante ospitata negli Stati Uniti per mantenere i dati nella regione. Puoi comunque elencare Anthropic/OpenAI insieme a questi usando `models.mode: "merge"` così i fallback restano disponibili rispettando il provider regionale che selezioni.
  </Accordion>

  <Accordion title="Devo comprare un Mac Mini per installarlo?">
    No. OpenClaw funziona su macOS o Linux (Windows tramite WSL2). Un Mac mini è opzionale: alcune persone
    ne comprano uno come host sempre acceso, ma vanno bene anche un piccolo VPS, un server domestico o un dispositivo di classe Raspberry Pi.

    Ti serve un Mac solo **per strumenti esclusivi di macOS**. Per iMessage, usa [iMessage](/it/channels/imessage) con `imsg` su qualsiasi Mac con accesso effettuato a Messaggi. Se il Gateway è in esecuzione su Linux o altrove, imposta `channels.imessage.cliPath` su un wrapper SSH che esegue `imsg` su quel Mac. Se vuoi altri strumenti esclusivi di macOS, esegui il Gateway su un Mac o associa un nodo macOS.

    Documentazione: [iMessage](/it/channels/imessage), [Nodi](/it/nodes), [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Mi serve un Mac mini per il supporto iMessage?">
    Ti serve **un dispositivo macOS** con accesso effettuato a Messaggi. **Non** deve essere necessariamente un Mac mini:
    va bene qualsiasi Mac. **Usa [iMessage](/it/channels/imessage)** con `imsg`; il Gateway può essere eseguito su quel Mac, oppure altrove con un wrapper SSH `cliPath`.

    Configurazioni comuni:

    - Esegui il Gateway su Linux/VPS e imposta `channels.imessage.cliPath` su un wrapper SSH che esegue `imsg` su un Mac con accesso effettuato a Messaggi.
    - Esegui tutto sul Mac se vuoi la configurazione a macchina singola più semplice.

    Documentazione: [iMessage](/it/channels/imessage), [Nodi](/it/nodes),
    [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se compro un Mac mini per eseguire OpenClaw, posso collegarlo al mio MacBook Pro?">
    Sì. Il **Mac mini può eseguire il Gateway** e il tuo MacBook Pro può connettersi come
    **nodo** (dispositivo companion). I nodi non eseguono il Gateway: forniscono capacità aggiuntive
    come schermo/fotocamera/canvas e `system.run` su quel dispositivo.

    Schema comune:

    - Gateway sul Mac mini (sempre acceso).
    - MacBook Pro esegue l'app macOS o un host nodo e si associa al Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` per vederlo.

    Documentazione: [Nodi](/it/nodes), [CLI dei nodi](/it/cli/nodes).

  </Accordion>

  <Accordion title="Posso usare Bun?">
    Bun è **sconsigliato**. Riscontriamo bug di runtime, specialmente con WhatsApp e Telegram.
    Usa **Node** per Gateway stabili.

    Se vuoi comunque sperimentare con Bun, fallo su un gateway non di produzione
    senza WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: cosa va in allowFrom?">
    `channels.telegram.allowFrom` è **l'ID utente Telegram del mittente umano** (numerico). Non è lo username del bot.

    La configurazione richiede solo ID utente numerici. Se nella configurazione hai già voci legacy `@username`, `openclaw doctor --fix` può provare a risolverle.

    Più sicuro (nessun bot di terze parti):

    - Invia un DM al tuo bot, poi esegui `openclaw logs --follow` e leggi `from.id`.

    API Bot ufficiale:

    - Invia un DM al tuo bot, poi chiama `https://api.telegram.org/bot<bot_token>/getUpdates` e leggi `message.from.id`.

    Terze parti (meno privato):

    - Invia un DM a `@userinfobot` o `@getidsbot`.

    Vedi [/channels/telegram](/it/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Più persone possono usare un numero WhatsApp con istanze OpenClaw diverse?">
    Sì, tramite **instradamento multi-agent**. Associa il **DM** WhatsApp di ciascun mittente (peer `kind: "direct"`, mittente E.164 come `+15551234567`) a un `agentId` diverso, così ogni persona ottiene il proprio workspace e archivio sessioni. Le risposte arrivano comunque dallo **stesso account WhatsApp** e il controllo di accesso DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) è globale per account WhatsApp. Vedi [Instradamento multi-agent](/it/concepts/multi-agent) e [WhatsApp](/it/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso eseguire un agent "chat veloce" e un agent "Opus per la programmazione"?'>
    Sì. Usa l'instradamento multi-agent: assegna a ogni agent il proprio modello predefinito, poi associa le route in ingresso (account provider o peer specifici) a ciascun agent. La configurazione di esempio si trova in [Instradamento multi-agent](/it/concepts/multi-agent). Vedi anche [Modelli](/it/concepts/models) e [Configurazione](/it/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew funziona su Linux?">
    Sì. Homebrew supporta Linux (Linuxbrew). Configurazione rapida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Se esegui OpenClaw tramite systemd, assicurati che il PATH del servizio includa `/home/linuxbrew/.linuxbrew/bin` (o il tuo prefisso brew) così gli strumenti installati con `brew` vengono risolti nelle shell non di login.
    Le build recenti antepongono anche le comuni directory bin utente sui servizi systemd Linux (per esempio `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e rispettano `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando impostate.

  </Accordion>

  <Accordion title="Differenza tra l'installazione git modificabile e l'installazione npm">
    - **Installazione modificabile (git):** checkout completo del sorgente, modificabile, migliore per i contributori.
      Esegui le build localmente e puoi correggere codice/documentazione.
    - **Installazione npm:** installazione CLI globale, nessun repo, migliore per "eseguilo e basta".
      Gli aggiornamenti arrivano dai dist-tag npm.

    Documentazione: [Per iniziare](/it/start/getting-started), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Posso passare tra installazioni npm e git in seguito?">
    Sì. Usa `openclaw update --channel ...` quando OpenClaw è già installato.
    Questo **non elimina i tuoi dati**: cambia solo l'installazione del codice OpenClaw.
    Il tuo stato (`~/.openclaw`) e il workspace (`~/.openclaw/workspace`) restano intatti.

    Da npm a git:

    ```bash
    openclaw update --channel dev
    ```

    Da git a npm:

    ```bash
    openclaw update --channel stable
    ```

    Aggiungi `--dry-run` per visualizzare prima in anteprima il cambio di modalità pianificato. L'updater esegue
    i follow-up di Doctor, aggiorna le sorgenti Plugin per il canale di destinazione e
    riavvia il gateway a meno che tu non passi `--no-restart`.

    Anche l'installer può forzare entrambe le modalità:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Suggerimenti per il backup: vedi [Strategia di backup](/it/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Dovrei eseguire il Gateway sul mio laptop o su un VPS?">
    Risposta breve: **se vuoi affidabilità 24/7, usa un VPS**. Se vuoi il
    minimo attrito e accetti sospensione/riavvii, eseguilo localmente.

    **Laptop (Gateway locale)**

    - **Pro:** nessun costo server, accesso diretto ai file locali, finestra del browser live.
    - **Contro:** sospensione/cadute di rete = disconnessioni, aggiornamenti/riavvii del sistema operativo interrompono, deve restare attivo.

    **VPS / cloud**

    - **Pro:** sempre attivo, rete stabile, nessun problema di sospensione del laptop, più facile da mantenere in esecuzione.
    - **Contro:** spesso eseguito senza interfaccia grafica (usa screenshot), solo accesso remoto ai file, devi usare SSH per gli aggiornamenti.

    **Nota specifica per OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funzionano tutti bene da un VPS. L'unico vero compromesso è **browser headless** rispetto a una finestra visibile. Vedi [Browser](/it/tools/browser).

    **Impostazione predefinita consigliata:** VPS se in passato hai avuto disconnessioni del Gateway. L'esecuzione locale è ottima quando usi attivamente il Mac e vuoi accesso ai file locali o automazione dell'interfaccia con un browser visibile.

  </Accordion>

  <Accordion title="Quanto è importante eseguire OpenClaw su una macchina dedicata?">
    Non è obbligatorio, ma è **consigliato per affidabilità e isolamento**.

    - **Host dedicato (VPS/Mac mini/Pi):** sempre attivo, meno interruzioni dovute a sospensione/riavvio, autorizzazioni più pulite, più facile da mantenere in esecuzione.
    - **Laptop/desktop condiviso:** va benissimo per test e uso attivo, ma aspettati pause quando la macchina va in sospensione o si aggiorna.

    Se vuoi il meglio di entrambi i mondi, mantieni il Gateway su un host dedicato e associa il tuo laptop come **Node** per gli strumenti locali di schermo/fotocamera/esecuzione. Vedi [Nodes](/it/nodes).
    Per indicazioni sulla sicurezza, leggi [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i requisiti minimi del VPS e il sistema operativo consigliato?">
    OpenClaw è leggero. Per un Gateway di base + un canale chat:

    - **Minimo assoluto:** 1 vCPU, 1GB di RAM, ~500MB di disco.
    - **Consigliato:** 1-2 vCPU, 2GB di RAM o più per margine (log, media, più canali). Gli strumenti Node e l'automazione del browser possono richiedere molte risorse.

    SO: usa **Ubuntu LTS** (o qualsiasi Debian/Ubuntu moderno). Il percorso di installazione Linux è testato meglio lì.

    Documentazione: [Linux](/it/platforms/linux), [hosting VPS](/it/vps).

  </Accordion>

  <Accordion title="Posso eseguire OpenClaw in una VM e quali sono i requisiti?">
    Sì. Tratta una VM come un VPS: deve essere sempre attiva, raggiungibile e avere abbastanza
    RAM per il Gateway e per tutti i canali che abiliti.

    Indicazioni di base:

    - **Minimo assoluto:** 1 vCPU, 1GB di RAM.
    - **Consigliato:** 2GB di RAM o più se esegui più canali, automazione del browser o strumenti multimediali.
    - **SO:** Ubuntu LTS o un altro Debian/Ubuntu moderno.

    Se usi Windows, **WSL2 è la configurazione in stile VM più semplice** e ha la migliore compatibilità
    con gli strumenti. Vedi [Windows](/it/platforms/windows), [hosting VPS](/it/vps).
    Se esegui macOS in una VM, vedi [VM macOS](/it/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — le FAQ principali (modelli, sessioni, Gateway, sicurezza, altro)
- [Panoramica dell'installazione](/it/install)
- [Introduzione](/it/start/getting-started)
- [Risoluzione dei problemi](/it/help/troubleshooting)
