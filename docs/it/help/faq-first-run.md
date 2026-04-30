---
read_when:
    - Nuova installazione, configurazione iniziale bloccata o errori al primo avvio
    - Scelta dell'autenticazione e degli abbonamenti ai provider
    - Impossibile accedere a docs.openclaw.ai, impossibile aprire il pannello di controllo, installazione bloccata
sidebarTitle: First-run FAQ
summary: 'FAQ: avvio rapido e configurazione al primo avvio — installazione, onboarding, autenticazione, abbonamenti, errori iniziali'
title: 'Domande frequenti: configurazione al primo avvio'
x-i18n:
    generated_at: "2026-04-30T08:56:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 959e5c8a94cce6369af84d3d1e252dbfb22acb5891ac1d8b64722c4c40679e65
    source_path: help/faq-first-run.md
    workflow: 16
---

  Domande e risposte per avvio rapido e prima esecuzione. Per operazioni quotidiane, modelli, autenticazione, sessioni
  e risoluzione dei problemi consulta la [FAQ](/it/help/faq) principale.

  ## Avvio rapido e configurazione della prima esecuzione

  <AccordionGroup>
  <Accordion title="Sono bloccato, il modo più rapido per sbloccarsi">
    Usa un agente IA locale che possa **vedere la tua macchina**. È molto più efficace che chiedere
    su Discord, perché la maggior parte dei casi "sono bloccato" sono **problemi di configurazione locale o di ambiente** che
    gli helper remoti non possono ispezionare.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Questi strumenti possono leggere il repo, eseguire comandi, ispezionare log e aiutare a correggere la configurazione a livello
    macchina (PATH, servizi, permessi, file di autenticazione). Fornisci loro il **checkout completo del sorgente** tramite
    l'installazione hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Questo installa OpenClaw **da un checkout git**, così l'agente può leggere codice e documentazione e
    ragionare sulla versione esatta che stai eseguendo. Puoi sempre tornare alla stabile in seguito
    rieseguendo l'installer senza `--install-method git`.

    Suggerimento: chiedi all'agente di **pianificare e supervisionare** la correzione (passo dopo passo), poi esegui solo i
    comandi necessari. Questo mantiene le modifiche piccole e più facili da verificare.

    Se scopri un vero bug o una correzione, apri una issue GitHub o invia una PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Inizia con questi comandi (condividi gli output quando chiedi aiuto):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Cosa fanno:

    - `openclaw status`: istantanea rapida dello stato di gateway/agente e configurazione di base.
    - `openclaw models status`: controlla autenticazione del provider e disponibilità dei modelli.
    - `openclaw doctor`: valida e ripara problemi comuni di configurazione/stato.

    Altri controlli CLI utili: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Ciclo rapido di debug: [Primi 60 secondi se qualcosa è rotto](#first-60-seconds-if-something-is-broken).
    Documentazione di installazione: [Installa](/it/install), [Flag dell'installer](/it/install/installer), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continua a saltare. Che cosa significano i motivi di salto?">
    Motivi comuni per cui heartbeat viene saltato:

    - `quiet-hours`: fuori dalla finestra di ore attive configurata
    - `empty-heartbeat-file`: `HEARTBEAT.md` esiste ma contiene solo scaffold vuoto/con sole intestazioni
    - `no-tasks-due`: la modalità attività di `HEARTBEAT.md` è attiva ma nessuno degli intervalli delle attività è ancora scaduto
    - `alerts-disabled`: tutta la visibilità heartbeat è disabilitata (`showOk`, `showAlerts` e `useIndicator` sono tutti disattivati)

    In modalità attività, i timestamp di scadenza vengono avanzati solo dopo il completamento
    di una vera esecuzione heartbeat. Le esecuzioni saltate non marcano le attività come completate.

    Documentazione: [Heartbeat](/it/gateway/heartbeat), [Automazione e attività](/it/automation).

  </Accordion>

  <Accordion title="Modo consigliato per installare e configurare OpenClaw">
    Il repo consiglia di eseguire da sorgente e usare l'onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata può anche compilare automaticamente gli asset dell'interfaccia. Dopo l'onboarding, di solito esegui il Gateway sulla porta **18789**.

    Da sorgente (contributor/dev):

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
    La procedura guidata apre il browser con un URL della dashboard pulito (senza token) subito dopo l'onboarding e stampa anche il link nel riepilogo. Tieni aperta quella scheda; se non si è avviata, copia/incolla l'URL stampato sulla stessa macchina.
  </Accordion>

  <Accordion title="Come autentico la dashboard su localhost rispetto a remoto?">
    **Localhost (stessa macchina):**

    - Apri `http://127.0.0.1:18789/`.
    - Se richiede l'autenticazione con segreto condiviso, incolla il token o la password configurati nelle impostazioni della Control UI.
    - Origine token: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
    - Origine password: `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Se non è ancora configurato alcun segreto condiviso, genera un token con `openclaw doctor --generate-gateway-token`.

    **Non su localhost:**

    - **Tailscale Serve** (consigliato): mantieni il binding su loopback, esegui `openclaw gateway --tailscale serve`, apri `https://<magicdns>/`. Se `gateway.auth.allowTailscale` è `true`, gli header di identità soddisfano l'autenticazione Control UI/WebSocket (nessun segreto condiviso incollato, presuppone un host gateway attendibile); le API HTTP richiedono comunque l'autenticazione con segreto condiviso a meno che tu non usi deliberatamente private-ingress `none` o autenticazione HTTP trusted-proxy.
      I tentativi di autenticazione Serve errati concorrenti dallo stesso client vengono serializzati prima che il limitatore di autenticazioni fallite li registri, quindi il secondo tentativo errato può già mostrare `retry later`.
    - **Binding tailnet**: esegui `openclaw gateway --bind tailnet --token "<token>"` (o configura l'autenticazione con password), apri `http://<tailscale-ip>:18789/`, poi incolla il segreto condiviso corrispondente nelle impostazioni della dashboard.
    - **Reverse proxy identity-aware**: mantieni il Gateway dietro un proxy attendibile, configura `gateway.auth.mode: "trusted-proxy"`, poi apri l'URL del proxy. I proxy local loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`. L'autenticazione con segreto condiviso si applica comunque sul tunnel; incolla il token o la password configurati se richiesto.

    Consulta [Dashboard](/it/web/dashboard) e [Superfici web](/it/web) per modalità di binding e dettagli di autenticazione.

  </Accordion>

  <Accordion title="Perché ci sono due configurazioni di approvazione exec per le approvazioni in chat?">
    Controllano livelli diversi:

    - `approvals.exec`: inoltra i prompt di approvazione alle destinazioni chat
    - `channels.<channel>.execApprovals`: fa sì che quel canale agisca come client di approvazione nativo per le approvazioni exec

    La policy exec dell'host rimane comunque il vero gate di approvazione. La configurazione della chat controlla solo dove
    appaiono i prompt di approvazione e come le persone possono rispondere.

    Nella maggior parte delle configurazioni **non** ti servono entrambi:

    - Se la chat supporta già comandi e risposte, `/approve` nella stessa chat funziona tramite il percorso condiviso.
    - Se un canale nativo supportato può dedurre gli approvatori in modo sicuro, OpenClaw ora abilita automaticamente le approvazioni native DM-first quando `channels.<channel>.execApprovals.enabled` non è impostato o è `"auto"`.
    - Quando sono disponibili schede/pulsanti di approvazione nativi, quell'interfaccia nativa è il percorso principale; l'agente dovrebbe includere un comando `/approve` manuale solo se il risultato dello strumento indica che le approvazioni chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    - Usa `approvals.exec` solo quando i prompt devono essere inoltrati anche ad altre chat o stanze operative esplicite.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo quando vuoi esplicitamente che i prompt di approvazione vengano pubblicati di nuovo nella stanza/argomento di origine.
    - Le approvazioni Plugin sono separate: usano `/approve` nella stessa chat per impostazione predefinita, inoltro opzionale `approvals.plugin`, e solo alcuni canali nativi mantengono sopra la gestione nativa delle approvazioni Plugin.

    Versione breve: l'inoltro serve al routing, la configurazione del client nativo serve a un'esperienza utente più ricca e specifica del canale.
    Consulta [Approvazioni Exec](/it/tools/exec-approvals).

  </Accordion>

  <Accordion title="Di quale runtime ho bisogno?">
    Node **>= 22** è richiesto. `pnpm` è consigliato. Bun è **sconsigliato** per il Gateway.
  </Accordion>

  <Accordion title="Funziona su Raspberry Pi?">
    Sì. Il Gateway è leggero: la documentazione elenca **512MB-1GB RAM**, **1 core** e circa **500MB**
    di disco come sufficienti per uso personale, e nota che un **Raspberry Pi 4 può eseguirlo**.

    Se vuoi margine extra (log, media, altri servizi), **2GB sono consigliati**, ma
    non sono un minimo rigido.

    Suggerimento: un piccolo Pi/VPS può ospitare il Gateway, e puoi associare **nodi** sul tuo laptop/telefono per
    schermo/camera/canvas locale o esecuzione di comandi. Consulta [Nodi](/it/nodes).

  </Accordion>

  <Accordion title="Suggerimenti per installazioni su Raspberry Pi?">
    Versione breve: funziona, ma aspettati qualche asperità.

    - Usa un sistema operativo **64-bit** e mantieni Node >= 22.
    - Preferisci l'**installazione hackable (git)** così puoi vedere i log e aggiornare rapidamente.
    - Inizia senza canali/skills, poi aggiungili uno alla volta.
    - Se incontri problemi binari strani, di solito è un problema di **compatibilità ARM**.

    Documentazione: [Linux](/it/platforms/linux), [Installa](/it/install).

  </Accordion>

  <Accordion title="È bloccato su wake up my friend / l'onboarding non si schiude. E ora?">
    Quella schermata dipende dal fatto che il Gateway sia raggiungibile e autenticato. La TUI invia anche
    "Wake up, my friend!" automaticamente al primo hatch. Se vedi quella riga senza **nessuna risposta**
    e i token restano a 0, l'agente non è mai partito.

    1. Riavvia il Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Controlla stato e autenticazione:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Se resta bloccato, esegui:

    ```bash
    openclaw doctor
    ```

    Se il Gateway è remoto, assicurati che il tunnel/la connessione Tailscale sia attiva e che l'interfaccia
    punti al Gateway corretto. Consulta [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrare la mia configurazione su una nuova macchina (Mac mini) senza rifare l'onboarding?">
    Sì. Copia la **directory di stato** e il **workspace**, poi esegui Doctor una volta. Questo
    mantiene il tuo bot "esattamente uguale" (memoria, cronologia sessioni, autenticazione e stato del canale)
    purché tu copi **entrambe** le posizioni:

    1. Installa OpenClaw sulla nuova macchina.
    2. Copia `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`) dalla vecchia macchina.
    3. Copia il tuo workspace (predefinito: `~/.openclaw/workspace`).
    4. Esegui `openclaw doctor` e riavvia il servizio Gateway.

    Questo conserva configurazione, profili di autenticazione, credenziali WhatsApp, sessioni e memoria. Se sei in
    modalità remota, ricorda che l'host gateway possiede lo store delle sessioni e il workspace.

    **Importante:** se fai solo commit/push del tuo workspace su GitHub, stai facendo il backup
    di **memoria + file di bootstrap**, ma **non** della cronologia delle sessioni o dell'autenticazione. Questi vivono
    sotto `~/.openclaw/` (per esempio `~/.openclaw/agents/<agentId>/sessions/`).

    Correlati: [Migrazione](/it/install/migrating), [Dove si trovano le cose su disco](#where-things-live-on-disk),
    [Workspace dell'agente](/it/concepts/agent-workspace), [Doctor](/it/gateway/doctor),
    [Modalità remota](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove vedo le novità dell'ultima versione?">
    Controlla il changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Le voci più recenti sono in alto. Se la sezione superiore è marcata **Unreleased**, la sezione datata
    successiva è l'ultima versione distribuita. Le voci sono raggruppate per **Highlights**, **Modifiche** e
    **Correzioni** (più sezioni documentazione/altro quando necessario).

  </Accordion>

  <Accordion title="Impossibile accedere a docs.openclaw.ai (errore SSL)">
    Alcune connessioni Comcast/Xfinity bloccano erroneamente `docs.openclaw.ai` tramite Xfinity
    Advanced Security. Disabilitalo o aggiungi `docs.openclaw.ai` alla allowlist, poi riprova.
    Aiutaci a sbloccarlo segnalandolo qui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se ancora non riesci a raggiungere il sito, la documentazione è disponibile anche come mirror su GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Differenza tra stabile e beta">
    **Stabile** e **beta** sono **dist-tag npm**, non linee di codice separate:

    - `latest` = stabile
    - `beta` = build anticipata per i test

    Di solito, una release stabile arriva prima su **beta**, poi un passaggio esplicito
    di promozione sposta la stessa versione su `latest`. I maintainer possono anche
    pubblicare direttamente su `latest` quando necessario. Ecco perché beta e stabile possono
    puntare alla **stessa versione** dopo la promozione.

    Vedi cosa è cambiato:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Per i comandi di installazione in una riga e la differenza tra beta e dev, vedi l'accordion qui sotto.

  </Accordion>

  <Accordion title="Come installo la versione beta e qual è la differenza tra beta e dev?">
    **Beta** è il dist-tag npm `beta` (può corrispondere a `latest` dopo la promozione).
    **Dev** è la punta mobile di `main` (git); quando viene pubblicata, usa il dist-tag npm `dev`.

    Comandi in una riga (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installer per Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Maggiori dettagli: [Canali di sviluppo](/it/install/development-channels) e [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="Come provo le parti più recenti?">
    Due opzioni:

    1. **Canale dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Questo passa al branch `main` e aggiorna dal sorgente.

    2. **Installazione modificabile (dal sito dell'installer):**

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

  <Accordion title="Quanto tempo richiedono di solito installazione e onboarding?">
    Guida approssimativa:

    - **Installazione:** 2-5 minuti
    - **Onboarding:** 5-15 minuti, a seconda di quanti canali/modelli configuri

    Se si blocca, usa [Installer bloccato](#quick-start-and-first-run-setup)
    e il ciclo di debug rapido in [Sono bloccato](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer bloccato? Come ottengo più feedback?">
    Esegui di nuovo l'installer con **output dettagliato**:

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

    Equivalente per Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Altre opzioni: [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="L'installazione Windows dice che git non è stato trovato o che openclaw non è riconosciuto">
    Due problemi comuni su Windows:

    **1) Errore npm spawn git / git non trovato**

    - Installa **Git for Windows** e assicurati che `git` sia nel tuo PATH.
    - Chiudi e riapri PowerShell, poi esegui di nuovo l'installer.

    **2) openclaw non è riconosciuto dopo l'installazione**

    - La cartella bin globale di npm non è nel PATH.
    - Controlla il percorso:

      ```powershell
      npm config get prefix
      ```

    - Aggiungi quella directory al tuo PATH utente (su Windows non serve il suffisso `\bin`; sulla maggior parte dei sistemi è `%AppData%\npm`).
    - Chiudi e riapri PowerShell dopo aver aggiornato PATH.

    Se vuoi la configurazione Windows più fluida, usa **WSL2** invece di Windows nativo.
    Documentazione: [Windows](/it/platforms/windows).

  </Accordion>

  <Accordion title="L'output exec su Windows mostra testo cinese illeggibile: cosa devo fare?">
    Di solito è una mancata corrispondenza della code page della console nelle shell Windows native.

    Sintomi:

    - L'output di `system.run`/`exec` rende il cinese come mojibake
    - Lo stesso comando appare corretto in un altro profilo di terminale

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

    Se riesci ancora a riprodurre il problema sull'ultima versione di OpenClaw, traccialo/segnalalo in:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentazione non ha risposto alla mia domanda: come ottengo una risposta migliore?">
    Usa l'**installazione modificabile (git)** così hai tutto il sorgente e la documentazione in locale, poi chiedi
    al tuo bot (o a Claude/Codex) _da quella cartella_ in modo che possa leggere il repository e rispondere con precisione.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Maggiori dettagli: [Installazione](/it/install) e [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="Come installo OpenClaw su Linux?">
    Risposta breve: segui la guida Linux, poi esegui l'onboarding.

    - Percorso rapido Linux + installazione del servizio: [Linux](/it/platforms/linux).
    - Guida completa: [Per iniziare](/it/start/getting-started).
    - Installer + aggiornamenti: [Installazione e aggiornamenti](/it/install/updating).

  </Accordion>

  <Accordion title="Come installo OpenClaw su una VPS?">
    Qualsiasi VPS Linux va bene. Installa sul server, poi usa SSH/Tailscale per raggiungere il Gateway.

    Guide: [exe.dev](/it/install/exe-dev), [Hetzner](/it/install/hetzner), [Fly.io](/it/install/fly).
    Accesso remoto: [Gateway remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove sono le guide di installazione cloud/VPS?">
    Manteniamo un **hub di hosting** con i provider comuni. Scegline uno e segui la guida:

    - [Hosting VPS](/it/vps) (tutti i provider in un unico posto)
    - [Fly.io](/it/install/fly)
    - [Hetzner](/it/install/hetzner)
    - [exe.dev](/it/install/exe-dev)

    Come funziona nel cloud: il **Gateway viene eseguito sul server** e vi accedi
    dal tuo laptop/telefono tramite la Control UI (o Tailscale/SSH). Il tuo stato + workspace
    risiedono sul server, quindi tratta l'host come fonte di verità ed eseguine il backup.

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

    Se devi automatizzare da un agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentazione: [Aggiornamento](/it/cli/update), [Aggiornare](/it/install/updating).

  </Accordion>

  <Accordion title="Che cosa fa davvero l'onboarding?">
    `openclaw onboard` è il percorso di configurazione consigliato. In **modalità locale** ti guida attraverso:

    - **Configurazione modello/auth** (OAuth del provider, chiavi API, setup-token Anthropic, più opzioni per modelli locali come LM Studio)
    - Posizione del **workspace** + file di bootstrap
    - **Impostazioni Gateway** (bind/port/auth/tailscale)
    - **Canali** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, più Plugin di canale inclusi come QQ Bot)
    - **Installazione daemon** (LaunchAgent su macOS; unità utente systemd su Linux/WSL2)
    - Selezione di **controlli di salute** e **Skills**

    Avvisa anche se il modello configurato è sconosciuto o manca l'autenticazione.

  </Accordion>

  <Accordion title="Mi serve un abbonamento Claude o OpenAI per eseguirlo?">
    No. Puoi eseguire OpenClaw con **chiavi API** (Anthropic/OpenAI/altri) o con
    **modelli solo locali** in modo che i tuoi dati restino sul tuo dispositivo. Gli abbonamenti (Claude
    Pro/Max o OpenAI Codex) sono modi opzionali per autenticare quei provider.

    Per Anthropic in OpenClaw, la distinzione pratica è:

    - **Chiave API Anthropic**: fatturazione normale dell'API Anthropic
    - **Claude CLI / autenticazione abbonamento Claude in OpenClaw**: lo staff Anthropic
      ci ha detto che questo uso è di nuovo consentito e OpenClaw tratta l'uso di `claude -p`
      come autorizzato per questa integrazione a meno che Anthropic non pubblichi una nuova
      policy

    Per host Gateway di lunga durata, le chiavi API Anthropic restano comunque la configurazione più
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
    OpenClaw tratta l'autenticazione dell'abbonamento Claude e l'uso di `claude -p` come autorizzati
    per questa integrazione a meno che Anthropic non pubblichi una nuova policy. Se vuoi
    la configurazione lato server più prevedibile, usa invece una chiave API Anthropic.

  </Accordion>

  <Accordion title="Supportate l'autenticazione tramite abbonamento Claude (Claude Pro o Max)?">
    Sì.

    Lo staff Anthropic ci ha detto che questo uso è di nuovo consentito, quindi OpenClaw tratta
    il riutilizzo di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione
    a meno che Anthropic non pubblichi una nuova policy.

    Il setup-token Anthropic è ancora disponibile come percorso token supportato da OpenClaw, ma OpenClaw ora preferisce il riutilizzo di Claude CLI e `claude -p` quando disponibili.
    Per carichi di lavoro di produzione o multiutente, l'autenticazione con chiave API Anthropic resta comunque la
    scelta più sicura e prevedibile. Se vuoi altre opzioni ospitate in stile abbonamento
    in OpenClaw, vedi [OpenAI](/it/providers/openai), [Qwen / Model
    Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax) e [Modelli
    GLM](/it/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Perché vedo HTTP 429 rate_limit_error da Anthropic?">
    Significa che la tua **quota/limite di frequenza Anthropic** è esaurita per la finestra corrente. Se
    usi **Claude CLI**, attendi il reset della finestra o fai l'upgrade del tuo piano. Se
    usi una **chiave API Anthropic**, controlla la Console Anthropic
    per utilizzo/fatturazione e aumenta i limiti se necessario.

    Se il messaggio è specificamente:
    `Extra usage is required for long context requests`, la richiesta sta tentando di usare
    la beta del contesto 1M di Anthropic (`context1m: true`). Funziona solo quando le tue
    credenziali sono idonee alla fatturazione per contesto lungo (fatturazione con chiave API o percorso
    di login Claude di OpenClaw con Extra Usage abilitato).

    Suggerimento: imposta un **modello di fallback** in modo che OpenClaw possa continuare a rispondere mentre un provider è limitato dal rate limit.
    Vedi [Modelli](/it/cli/models), [OAuth](/it/concepts/oauth) e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/it/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock è supportato?">
    Sì. OpenClaw include un provider **Amazon Bedrock (Converse)** integrato. Con i marker di ambiente AWS presenti, OpenClaw può individuare automaticamente il catalogo Bedrock streaming/testo e unirlo come provider implicito `amazon-bedrock`; in alternativa puoi abilitare esplicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` o aggiungere una voce provider manuale. Vedi [Amazon Bedrock](/it/providers/bedrock) e [Provider di modelli](/it/providers/models). Se preferisci un flusso con chiave gestita, un proxy compatibile con OpenAI davanti a Bedrock resta un'opzione valida.
  </Accordion>

  <Accordion title="Come funziona l'autenticazione Codex?">
    OpenClaw supporta **OpenAI Code (Codex)** tramite OAuth (accesso ChatGPT). Usa
    `openai-codex/gpt-5.5` per Codex OAuth tramite il runner PI predefinito. Usa
    `openai/gpt-5.5` per l'accesso diretto con chiave API OpenAI. GPT-5.5 può anche usare
    abbonamento/OAuth tramite `openai-codex/gpt-5.5` oppure esecuzioni native del server app Codex
    con `openai/gpt-5.5` e `agentRuntime.id: "codex"`.
    Vedi [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).
  </Accordion>

  <Accordion title="Perché OpenClaw menziona ancora openai-codex?">
    `openai-codex` è l'id del provider e del profilo di autenticazione per ChatGPT/Codex OAuth.
    È anche il prefisso modello PI esplicito per Codex OAuth:

    - `openai/gpt-5.5` = percorso attuale con chiave API OpenAI diretta in PI
    - `openai-codex/gpt-5.5` = percorso Codex OAuth in PI
    - `openai/gpt-5.5` + `agentRuntime.id: "codex"` = percorso nativo del server app Codex
    - `openai-codex:...` = id del profilo di autenticazione, non un riferimento modello

    Se vuoi il percorso diretto di fatturazione/limiti di OpenAI Platform, imposta
    `OPENAI_API_KEY`. Se vuoi l'autenticazione tramite abbonamento ChatGPT/Codex, accedi con
    `openclaw models auth login --provider openai-codex` e usa
    riferimenti modello `openai-codex/*` per le esecuzioni PI.

  </Accordion>

  <Accordion title="Perché i limiti di Codex OAuth possono differire da ChatGPT web?">
    Codex OAuth usa finestre di quota gestite da OpenAI e dipendenti dal piano. In pratica,
    questi limiti possono differire dall'esperienza sul sito/app ChatGPT, anche quando
    entrambi sono collegati allo stesso account.

    OpenClaw può mostrare le finestre di utilizzo/quota del provider attualmente visibili in
    `openclaw models status`, ma non inventa né normalizza i diritti di ChatGPT web
    in accesso API diretto. Se vuoi il percorso diretto di fatturazione/limiti di OpenAI Platform,
    usa `openai/*` con una chiave API.

  </Accordion>

  <Accordion title="Supportate l'autenticazione con abbonamento OpenAI (Codex OAuth)?">
    Sì. OpenClaw supporta pienamente **OpenAI Code (Codex) subscription OAuth**.
    OpenAI consente esplicitamente l'uso dell'OAuth dell'abbonamento in strumenti/flussi di lavoro esterni
    come OpenClaw. L'onboarding può eseguire il flusso OAuth per te.

    Vedi [OAuth](/it/concepts/oauth), [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).

  </Accordion>

  <Accordion title="Come configuro Gemini CLI OAuth?">
    Gemini CLI usa un **flusso di autenticazione Plugin**, non un client id o secret in `openclaw.json`.

    Passaggi:

    1. Installa Gemini CLI localmente così che `gemini` sia in `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Abilita il Plugin: `openclaw plugins enable google`
    3. Accedi: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modello predefinito dopo l'accesso: `google-gemini-cli/gemini-3-flash-preview`
    5. Se le richieste falliscono, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host del Gateway

    Questo salva i token OAuth nei profili di autenticazione sull'host del Gateway. Dettagli: [Provider di modelli](/it/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modello locale va bene per chat informali?">
    Di solito no. OpenClaw richiede un contesto ampio e una sicurezza robusta; le schede piccole troncano e perdono informazioni. Se devi farlo, esegui localmente la build del modello **più grande** possibile (LM Studio) e vedi [/gateway/local-models](/it/gateway/local-models). I modelli più piccoli/quantizzati aumentano il rischio di prompt injection: vedi [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Come mantengo il traffico dei modelli ospitati in una regione specifica?">
    Scegli endpoint vincolati a una regione. OpenRouter espone opzioni ospitate negli Stati Uniti per MiniMax, Kimi e GLM; scegli la variante ospitata negli Stati Uniti per mantenere i dati nella regione. Puoi comunque elencare Anthropic/OpenAI accanto a queste usando `models.mode: "merge"` così i fallback restano disponibili rispettando il provider regionale che selezioni.
  </Accordion>

  <Accordion title="Devo comprare un Mac Mini per installarlo?">
    No. OpenClaw funziona su macOS o Linux (Windows tramite WSL2). Un Mac mini è opzionale: alcune persone
    ne comprano uno come host sempre acceso, ma va bene anche un piccolo VPS, un server domestico o un dispositivo di classe Raspberry Pi.

    Ti serve un Mac solo **per gli strumenti disponibili solo su macOS**. Per iMessage, usa [BlueBubbles](/it/channels/bluebubbles) (consigliato): il server BlueBubbles gira su qualsiasi Mac, e il Gateway può girare su Linux o altrove. Se vuoi altri strumenti disponibili solo su macOS, esegui il Gateway su un Mac o abbina un Node macOS.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Node](/it/nodes), [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Mi serve un Mac mini per il supporto iMessage?">
    Ti serve **un qualche dispositivo macOS** con accesso a Messaggi. **Non** deve essere per forza un Mac mini:
    qualsiasi Mac va bene. **Usa [BlueBubbles](/it/channels/bluebubbles)** (consigliato) per iMessage: il server BlueBubbles gira su macOS, mentre il Gateway può girare su Linux o altrove.

    Configurazioni comuni:

    - Esegui il Gateway su Linux/VPS e il server BlueBubbles su qualsiasi Mac con accesso a Messaggi.
    - Esegui tutto sul Mac se vuoi la configurazione più semplice su una sola macchina.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Node](/it/nodes),
    [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se compro un Mac mini per eseguire OpenClaw, posso collegarlo al mio MacBook Pro?">
    Sì. Il **Mac mini può eseguire il Gateway**, e il tuo MacBook Pro può connettersi come
    **Node** (dispositivo companion). I Node non eseguono il Gateway: forniscono funzionalità
    aggiuntive come schermo/fotocamera/canvas e `system.run` su quel dispositivo.

    Schema comune:

    - Gateway sul Mac mini (sempre acceso).
    - MacBook Pro esegue l'app macOS o un host Node e si abbina al Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` per vederlo.

    Documentazione: [Node](/it/nodes), [CLI Node](/it/cli/nodes).

  </Accordion>

  <Accordion title="Posso usare Bun?">
    Bun è **sconsigliato**. Riscontriamo bug runtime, specialmente con WhatsApp e Telegram.
    Usa **Node** per Gateway stabili.

    Se vuoi comunque sperimentare con Bun, fallo su un Gateway non di produzione
    senza WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: cosa va in allowFrom?">
    `channels.telegram.allowFrom` è **l'ID utente Telegram del mittente umano** (numerico). Non è il nome utente del bot.

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
    Sì, tramite **routing multi-agente**. Associa il **DM** WhatsApp di ogni mittente (peer `kind: "direct"`, mittente E.164 come `+15551234567`) a un diverso `agentId`, così ogni persona ottiene il proprio workspace e archivio sessioni. Le risposte arrivano comunque dallo **stesso account WhatsApp**, e il controllo di accesso DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) è globale per account WhatsApp. Vedi [Routing multi-agente](/it/concepts/multi-agent) e [WhatsApp](/it/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso eseguire un agente "chat veloce" e un agente "Opus per il coding"?'>
    Sì. Usa il routing multi-agente: assegna a ogni agente il proprio modello predefinito, poi associa le rotte in ingresso (account provider o peer specifici) a ciascun agente. Un esempio di configurazione è in [Routing multi-agente](/it/concepts/multi-agent). Vedi anche [Modelli](/it/concepts/models) e [Configurazione](/it/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew funziona su Linux?">
    Sì. Homebrew supporta Linux (Linuxbrew). Configurazione rapida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Se esegui OpenClaw tramite systemd, assicurati che il PATH del servizio includa `/home/linuxbrew/.linuxbrew/bin` (o il prefisso brew) così gli strumenti installati con `brew` vengono risolti nelle shell non di login.
    Le build recenti aggiungono anche all'inizio le directory bin utente comuni sui servizi systemd Linux (per esempio `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e rispettano `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando impostate.

  </Accordion>

  <Accordion title="Differenza tra l'installazione git modificabile e l'installazione npm">
    - **Installazione modificabile (git):** checkout completo del sorgente, modificabile, ideale per i contributor.
      Esegui le build localmente e puoi correggere codice/documentazione.
    - **Installazione npm:** installazione globale della CLI, nessun repo, ideale per "eseguirlo e basta".
      Gli aggiornamenti arrivano dai dist-tag npm.

    Documentazione: [Primi passi](/it/start/getting-started), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Posso passare da installazioni npm a git in seguito?">
    Sì. Usa `openclaw update --channel ...` quando OpenClaw è già installato.
    Questo **non elimina i tuoi dati**: cambia solo l'installazione del codice OpenClaw.
    Lo stato (`~/.openclaw`) e il workspace (`~/.openclaw/workspace`) restano intatti.

    Da npm a git:

    ```bash
    openclaw update --channel dev
    ```

    Da git a npm:

    ```bash
    openclaw update --channel stable
    ```

    Aggiungi `--dry-run` per vedere prima un'anteprima del cambio di modalità pianificato. L'updater esegue
    i follow-up di Doctor, aggiorna le sorgenti dei Plugin per il canale di destinazione e
    riavvia il Gateway a meno che tu non passi `--no-restart`.

    Anche l'installer può forzare una delle due modalità:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Suggerimenti per il backup: vedi [Strategia di backup](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Dovrei eseguire il Gateway sul mio laptop o su un VPS?">
    Risposta breve: **se vuoi affidabilità 24/7, usa un VPS**. Se vuoi il
    minimo attrito e per te vanno bene sospensione/riavvii, eseguilo localmente.

    **Laptop (Gateway locale)**

    - **Pro:** nessun costo server, accesso diretto ai file locali, finestra browser live.
    - **Contro:** sospensione/cali di rete = disconnessioni, aggiornamenti/riavvii dell'OS interrompono, deve restare attivo.

    **VPS / cloud**

    - **Pro:** sempre acceso, rete stabile, nessun problema di sospensione del laptop, più facile da mantenere in esecuzione.
    - **Contro:** spesso gira headless (usa screenshot), solo accesso remoto ai file, devi usare SSH per gli aggiornamenti.

    **Nota specifica di OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funzionano tutti bene da un VPS. L'unico vero compromesso è **browser headless** rispetto a una finestra visibile. Vedi [Browser](/it/tools/browser).

    **Impostazione predefinita consigliata:** VPS se in passato hai avuto disconnessioni del Gateway. Locale è ottimo quando stai usando attivamente il Mac e vuoi accedere ai file locali o automatizzare l'UI con un browser visibile.

  </Accordion>

  <Accordion title="Quanto è importante eseguire OpenClaw su una macchina dedicata?">
    Non è obbligatorio, ma è **consigliato per affidabilità e isolamento**.

    - **Host dedicato (VPS/Mac mini/Pi):** sempre acceso, meno interruzioni per sospensione/riavvio, permessi più puliti, più facile da mantenere in esecuzione.
    - **Laptop/desktop condiviso:** va benissimo per test e uso attivo, ma aspettati pause quando la macchina va in sospensione o si aggiorna.

    Se vuoi il meglio di entrambi i mondi, mantieni il Gateway su un host dedicato e associa il tuo laptop come **node** per strumenti locali di schermo/fotocamera/exec. Vedi [Nodes](/it/nodes).
    Per indicazioni sulla sicurezza, leggi [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i requisiti minimi per un VPS e il sistema operativo consigliato?">
    OpenClaw è leggero. Per un Gateway di base + un canale chat:

    - **Minimo assoluto:** 1 vCPU, 1 GB di RAM, ~500 MB di disco.
    - **Consigliato:** 1-2 vCPU, 2 GB di RAM o più per margine (log, media, più canali). Gli strumenti Node e l'automazione del browser possono richiedere molte risorse.

    Sistema operativo: usa **Ubuntu LTS** (o qualsiasi Debian/Ubuntu moderno). Il percorso di installazione Linux è testato al meglio lì.

    Documentazione: [Linux](/it/platforms/linux), [hosting VPS](/it/vps).

  </Accordion>

  <Accordion title="Posso eseguire OpenClaw in una VM e quali sono i requisiti?">
    Sì. Tratta una VM come un VPS: deve essere sempre accesa, raggiungibile e avere RAM
    sufficiente per il Gateway e per qualsiasi canale abiliti.

    Indicazioni di base:

    - **Minimo assoluto:** 1 vCPU, 1 GB di RAM.
    - **Consigliato:** 2 GB di RAM o più se esegui più canali, automazione del browser o strumenti multimediali.
    - **Sistema operativo:** Ubuntu LTS o un altro Debian/Ubuntu moderno.

    Se sei su Windows, **WSL2 è la configurazione in stile VM più semplice** e offre la migliore
    compatibilità con gli strumenti. Vedi [Windows](/it/platforms/windows), [hosting VPS](/it/vps).
    Se stai eseguendo macOS in una VM, vedi [VM macOS](/it/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — le FAQ principali (modelli, sessioni, gateway, sicurezza, altro)
- [Panoramica dell'installazione](/it/install)
- [Primi passi](/it/start/getting-started)
- [Risoluzione dei problemi](/it/help/troubleshooting)
