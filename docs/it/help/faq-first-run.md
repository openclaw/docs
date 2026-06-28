---
read_when:
    - Nuova installazione, onboarding bloccato o errori al primo avvio
    - Scelta dell'autenticazione e degli abbonamenti ai provider
    - Impossibile accedere a docs.openclaw.ai, impossibile aprire la dashboard, installazione bloccata
sidebarTitle: First-run FAQ
summary: 'FAQ: configurazione di avvio rapido e primo avvio — installazione, onboarding, autenticazione, abbonamenti, errori iniziali'
title: 'FAQ: configurazione al primo avvio'
x-i18n:
    generated_at: "2026-06-28T20:43:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef4122bc0c3068806591ccdc1bf7f3eb5a81cc7efd2066d07f948fe953284be
    source_path: help/faq-first-run.md
    workflow: 16
---

  Q&A per avvio rapido e prima esecuzione. Per operazioni quotidiane, modelli, autenticazione, sessioni
  e risoluzione dei problemi, consulta le [FAQ](/it/help/faq) principali.

  ## Avvio rapido e configurazione della prima esecuzione

  <AccordionGroup>
  <Accordion title="Sono bloccato, il modo più rapido per sbloccarmi">
    Usa un agente AI locale che possa **vedere la tua macchina**. È molto più efficace che chiedere
    su Discord, perché la maggior parte dei casi "sono bloccato" riguarda **problemi di configurazione locale o di ambiente** che
    gli helper remoti non possono ispezionare.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Questi strumenti possono leggere il repo, eseguire comandi, ispezionare i log e aiutarti a correggere la configurazione
    a livello di macchina (PATH, servizi, permessi, file di autenticazione). Fornisci loro il **checkout completo del sorgente** tramite
    l'installazione modificabile (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Questo installa OpenClaw **da un checkout git**, così l'agente può leggere codice e documentazione e
    ragionare sulla versione esatta che stai eseguendo. Puoi sempre tornare alla stabile in seguito
    rieseguendo l'installer senza `--install-method git`.

    Suggerimento: chiedi all'agente di **pianificare e supervisionare** la correzione (passo per passo), poi esegui solo i
    comandi necessari. Così le modifiche restano piccole e più facili da verificare.

    Se scopri un bug reale o una correzione, apri un issue su GitHub o invia una PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Inizia con questi comandi (condividi gli output quando chiedi aiuto):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Cosa fanno:

    - `openclaw status`: snapshot rapido dello stato di Gateway/agente + configurazione di base.
    - `openclaw models status`: controlla l'autenticazione dei provider + disponibilità dei modelli.
    - `openclaw doctor`: convalida e ripara problemi comuni di configurazione/stato.

    Altri controlli CLI utili: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Ciclo di debug rapido: [Primi 60 secondi se qualcosa è rotto](/it/help/faq#first-60-seconds-if-something-is-broken).
    Documentazione di installazione: [Installazione](/it/install), [Flag dell'installer](/it/install/installer), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continua a saltare. Che cosa significano i motivi di salto?">
    Motivi comuni per cui Heartbeat viene saltato:

    - `quiet-hours`: fuori dalla finestra di ore attive configurata
    - `empty-heartbeat-file`: `HEARTBEAT.md` esiste ma contiene solo righe vuote, commenti, intestazioni, fence o scaffold di checklist vuote
    - `no-tasks-due`: la modalità attività di `HEARTBEAT.md` è attiva ma nessun intervallo delle attività è ancora scaduto
    - `alerts-disabled`: tutta la visibilità di Heartbeat è disabilitata (`showOk`, `showAlerts` e `useIndicator` sono tutti disattivati)

    In modalità attività, i timestamp di scadenza vengono avanzati solo dopo il completamento
    di un'esecuzione Heartbeat reale. Le esecuzioni saltate non contrassegnano le attività come completate.

    Documentazione: [Heartbeat](/it/gateway/heartbeat), [Automazione](/it/automation).

  </Accordion>

  <Accordion title="Modo consigliato per installare e configurare OpenClaw">
    Il repo consiglia di eseguire dal sorgente e usare l'onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata può anche compilare automaticamente gli asset della UI. Dopo l'onboarding, di solito esegui il Gateway sulla porta **18789**.

    Dal sorgente (contributor/dev):

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
    La procedura guidata apre il browser con un URL pulito (senza token) della dashboard subito dopo l'onboarding e stampa anche il link nel riepilogo. Tieni aperta quella scheda; se non si è avviata, copia/incolla l'URL stampato sulla stessa macchina.
  </Accordion>

  <Accordion title="Come autentico la dashboard su localhost rispetto a remoto?">
    **Localhost (stessa macchina):**

    - Apri `http://127.0.0.1:18789/`.
    - Se richiede l'autenticazione con segreto condiviso, incolla il token o la password configurati nelle impostazioni della Control UI.
    - Origine del token: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
    - Origine della password: `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Se non è ancora configurato alcun segreto condiviso, genera un token con `openclaw doctor --generate-gateway-token`.

    **Non su localhost:**

    - **Tailscale Serve** (consigliato): mantieni il bind su loopback, esegui `openclaw gateway --tailscale serve`, apri `https://<magicdns>/`. Se `gateway.auth.allowTailscale` è `true`, gli header di identità soddisfano l'autenticazione Control UI/WebSocket (nessun segreto condiviso da incollare, presuppone un host Gateway attendibile); le API HTTP richiedono ancora l'autenticazione con segreto condiviso, a meno che tu non usi deliberatamente private-ingress `none` o l'autenticazione HTTP trusted-proxy.
      I tentativi di autenticazione Serve concorrenti non validi dallo stesso client vengono serializzati prima che il limitatore di autenticazioni fallite li registri, quindi il secondo tentativo non valido può già mostrare `retry later`.
    - **Bind tailnet**: esegui `openclaw gateway --bind tailnet --token "<token>"` (o configura l'autenticazione con password), apri `http://<tailscale-ip>:18789/`, poi incolla il segreto condiviso corrispondente nelle impostazioni della dashboard.
    - **Reverse proxy identity-aware**: mantieni il Gateway dietro un proxy attendibile, configura `gateway.auth.mode: "trusted-proxy"`, poi apri l'URL del proxy. I proxy loopback sullo stesso host richiedono `gateway.auth.trustedProxy.allowLoopback = true` esplicito.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`. L'autenticazione con segreto condiviso si applica comunque sul tunnel; incolla il token o la password configurati se richiesto.

    Consulta [Dashboard](/it/web/dashboard) e [Superfici web](/it/web) per dettagli su modalità di bind e autenticazione.

  </Accordion>

  <Accordion title="Perché ci sono due configurazioni di approvazione exec per le approvazioni via chat?">
    Controllano livelli diversi:

    - `approvals.exec`: inoltra le richieste di approvazione alle destinazioni chat
    - `channels.<channel>.execApprovals`: fa agire quel canale come client di approvazione nativo per le approvazioni exec

    La policy exec dell'host resta comunque il vero gate di approvazione. La configurazione chat controlla solo dove
    appaiono le richieste di approvazione e come le persone possono rispondere.

    Nella maggior parte delle configurazioni **non** ti servono entrambi:

    - Se la chat supporta già comandi e risposte, `/approve` nella stessa chat funziona tramite il percorso condiviso.
    - Se un canale nativo supportato può inferire gli approvatori in modo sicuro, OpenClaw ora abilita automaticamente le approvazioni native DM-first quando `channels.<channel>.execApprovals.enabled` non è impostato o è `"auto"`.
    - Quando sono disponibili schede/pulsanti di approvazione nativi, quella UI nativa è il percorso principale; l'agente dovrebbe includere un comando manuale `/approve` solo se il risultato dello strumento indica che le approvazioni via chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    - Usa `approvals.exec` solo quando le richieste devono essere inoltrate anche ad altre chat o stanze operative esplicite.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo quando vuoi esplicitamente che le richieste di approvazione vengano pubblicate di nuovo nella stanza/argomento di origine.
    - Le approvazioni dei Plugin sono di nuovo separate: usano `/approve` nella stessa chat per impostazione predefinita, l'inoltro opzionale `approvals.plugin` e solo alcuni canali nativi mantengono anche la gestione nativa delle approvazioni Plugin.

    Versione breve: l'inoltro serve per il routing, la configurazione del client nativo serve per una UX più ricca specifica del canale.
    Consulta [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>

  <Accordion title="Di quale runtime ho bisogno?">
    Node **>= 22** è richiesto. `pnpm` è consigliato. Bun **non è consigliato** per il Gateway.
  </Accordion>

  <Accordion title="Funziona su Raspberry Pi?">
    Sì. Il Gateway è leggero: la documentazione indica **512MB-1GB di RAM**, **1 core** e circa **500MB**
    di disco come sufficienti per l'uso personale, e segnala che un **Raspberry Pi 4 può eseguirlo**.

    Se vuoi margine extra (log, media, altri servizi), **2GB sono consigliati**, ma non è
    un minimo obbligatorio.

    Suggerimento: un piccolo Raspberry Pi/VPS può ospitare il Gateway, e puoi associare **nodes** sul tuo laptop/telefono per
    schermo/fotocamera/canvas locale o esecuzione di comandi. Consulta [Nodes](/it/nodes).

  </Accordion>

  <Accordion title="Suggerimenti per installazioni su Raspberry Pi?">
    Versione breve: funziona, ma aspettati qualche asperità.

    - Usa un sistema operativo **64-bit** e mantieni Node >= 22.
    - Preferisci l'**installazione modificabile (git)** così puoi vedere i log e aggiornare rapidamente.
    - Inizia senza canali/Skills, poi aggiungili uno alla volta.
    - Se incontri strani problemi binari, di solito è un problema di **compatibilità ARM**.

    Documentazione: [Linux](/it/platforms/linux), [Installazione](/it/install).

  </Accordion>

  <Accordion title="È bloccato su wake up my friend / l'onboarding non si schiude. E adesso?">
    Quella schermata dipende dal fatto che il Gateway sia raggiungibile e autenticato. La TUI invia anche
    "Wake up, my friend!" automaticamente alla prima schiusa. Se vedi quella riga con **nessuna risposta**
    e i token restano a 0, l'agente non è mai partito.

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

    Se il Gateway è remoto, assicurati che il tunnel/la connessione Tailscale sia attiva e che la UI
    punti al Gateway corretto. Consulta [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrare la mia configurazione su una nuova macchina (Mac mini) senza rifare l'onboarding?">
    Sì. Copia la **directory di stato** e il **workspace**, poi esegui Doctor una volta. Questo
    mantiene il tuo bot "esattamente uguale" (memoria, cronologia sessioni, autenticazione e stato
    dei canali) purché tu copi **entrambe** le posizioni:

    1. Installa OpenClaw sulla nuova macchina.
    2. Copia `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`) dalla vecchia macchina.
    3. Copia il tuo workspace (predefinito: `~/.openclaw/workspace`).
    4. Esegui `openclaw doctor` e riavvia il servizio Gateway.

    Questo preserva configurazione, profili di autenticazione, credenziali WhatsApp, sessioni e memoria. Se sei in
    modalità remota, ricorda che l'host Gateway possiede l'archivio delle sessioni e il workspace.

    **Importante:** se fai solo commit/push del workspace su GitHub, stai eseguendo il backup
    di **memoria + file di bootstrap**, ma **non** della cronologia delle sessioni o dell'autenticazione. Questi risiedono
    sotto `~/.openclaw/` (per esempio `~/.openclaw/agents/<agentId>/sessions/`).

    Correlati: [Migrazione](/it/install/migrating), [Dove si trovano le cose su disco](/it/help/faq#where-things-live-on-disk),
    [Workspace dell'agente](/it/concepts/agent-workspace), [Doctor](/it/gateway/doctor),
    [Modalità remota](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove vedo che cosa c'è di nuovo nell'ultima versione?">
    Controlla il changelog di GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Le voci più recenti sono in alto. Se la sezione superiore è contrassegnata come **Unreleased**, la sezione
    datata successiva è l'ultima versione rilasciata. Le voci sono raggruppate per **In evidenza**, **Modifiche** e
    **Correzioni** (più sezioni documentazione/altro quando necessario).

  </Accordion>

  <Accordion title="Impossibile accedere a docs.openclaw.ai (errore SSL)">
    Alcune connessioni Comcast/Xfinity bloccano erroneamente `docs.openclaw.ai` tramite Xfinity
    Advanced Security. Disabilitalo o inserisci `docs.openclaw.ai` nell'allowlist, poi riprova.
    Aiutaci a sbloccarlo segnalandolo qui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se non riesci ancora a raggiungere il sito, la documentazione è disponibile come mirror su GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Differenza tra stable e beta">
    **Stable** e **beta** sono **dist-tag npm**, non linee di codice separate:

    - `latest` = stable
    - `beta` = build iniziale per i test

    Di solito, una release stable arriva prima su **beta**, poi un passaggio esplicito
    di promozione sposta quella stessa versione su `latest`. I manutentori possono anche
    pubblicare direttamente su `latest` quando necessario. Ecco perché beta e stable possono
    puntare alla **stessa versione** dopo la promozione.

    Vedi cosa è cambiato:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Per i comandi di installazione a riga singola e la differenza tra beta e dev, vedi l'accordion qui sotto.

  </Accordion>

  <Accordion title="Come installo la versione beta e qual è la differenza tra beta e dev?">
    **Beta** è il dist-tag npm `beta` (può corrispondere a `latest` dopo la promozione).
    **Dev** è il riferimento mobile di `main` (git); quando viene pubblicato, usa il dist-tag npm `dev`.

    Comandi a riga singola (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installer Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Maggiori dettagli: [Canali di sviluppo](/it/install/development-channels) e [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="Come provo gli ultimi aggiornamenti?">
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
    Indicazione approssimativa:

    - **Installazione:** 2-5 minuti
    - **Onboarding QuickStart:** di solito pochi minuti
    - **Onboarding completo:** più tempo quando l'accesso al provider, l'associazione del canale, l'installazione del daemon,
      i download di rete, le Skills o i Plugin opzionali richiedono configurazione aggiuntiva

    Il wizard CLI mostra questa tempistica all'inizio. Puoi saltare i passaggi opzionali e tornare
    più tardi con `openclaw configure`.

    Se si blocca, usa [Installer bloccato](#quick-start-and-first-run-setup)
    e il ciclo rapido di debug in [Sono bloccato](#quick-start-and-first-run-setup).

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

    Equivalente Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Altre opzioni: [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="L'installazione su Windows dice git non trovato oppure openclaw non riconosciuto">
    Due problemi comuni su Windows:

    **1) errore npm spawn git / git non trovato**

    - Installa **Git for Windows** e assicurati che `git` sia nel tuo PATH.
    - Chiudi e riapri PowerShell, poi esegui di nuovo l'installer.

    **2) openclaw non viene riconosciuto dopo l'installazione**

    - La cartella bin globale di npm non è nel PATH.
    - Controlla il percorso:

      ```powershell
      npm config get prefix
      ```

    - Aggiungi quella directory al PATH utente (su Windows non serve il suffisso `\bin`; sulla maggior parte dei sistemi è `%AppData%\npm`).
    - Chiudi e riapri PowerShell dopo aver aggiornato il PATH.

    Per la configurazione desktop, usa l'app nativa **Windows Hub**. Per la configurazione solo terminale,
    sono supportati sia l'installer PowerShell sia i percorsi WSL2 Gateway.
    Documentazione: [Windows](/it/platforms/windows).

  </Accordion>

  <Accordion title="L'output exec su Windows mostra testo cinese illeggibile - cosa devo fare?">
    Di solito è una mancata corrispondenza della code page della console nelle shell native di Windows.

    Sintomi:

    - l'output di `system.run`/`exec` mostra il cinese come mojibake
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

    Se riesci ancora a riprodurlo sull'ultima versione di OpenClaw, seguilo/segnalalo in:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentazione non ha risposto alla mia domanda - come ottengo una risposta migliore?">
    Usa l'**installazione modificabile (git)** così hai tutto il sorgente e la documentazione in locale, poi chiedi
    al tuo bot (o Claude/Codex) _da quella cartella_ in modo che possa leggere il repository e rispondere con precisione.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Maggiori dettagli: [Installazione](/it/install) e [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="Come installo OpenClaw su Linux?">
    Risposta breve: segui la guida per Linux, poi esegui l'onboarding.

    - Percorso rapido Linux + installazione del servizio: [Linux](/it/platforms/linux).
    - Guida completa: [Primi passi](/it/start/getting-started).
    - Installer + aggiornamenti: [Installazione e aggiornamenti](/it/install/updating).

  </Accordion>

  <Accordion title="Come installo OpenClaw su un VPS?">
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
    dal laptop/telefono tramite la Control UI (o Tailscale/SSH). Il tuo stato + workspace
    vivono sul server, quindi considera l'host come fonte di verità ed eseguine il backup.

    Puoi associare **nodi** (Mac/iOS/Android/headless) a quel Gateway cloud per accedere
    a schermo/camera/canvas locali o eseguire comandi sul laptop mantenendo il
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

  <Accordion title="Che cosa fa davvero l'onboarding?">
    `openclaw onboard` è il percorso di configurazione consigliato. In **modalità locale** ti guida attraverso:

    - **Configurazione modello/auth** (OAuth del provider, chiavi API, setup-token Anthropic, più opzioni per modelli locali come LM Studio)
    - Posizione del **workspace** + file di bootstrap
    - **Impostazioni Gateway** (bind/porta/auth/tailscale)
    - **Canali** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, più Plugin di canale inclusi come QQ Bot)
    - **Installazione daemon** (LaunchAgent su macOS; unità utente systemd su Linux/WSL2)
    - **Controlli di integrità** e selezione delle **Skills**

    Imposta anche le aspettative di durata prima che inizino i prompt principali e avvisa se il
    modello configurato è sconosciuto o manca l'autenticazione.

  </Accordion>

  <Accordion title="Mi serve un abbonamento Claude o OpenAI per eseguirlo?">
    No. Puoi eseguire OpenClaw con **chiavi API** (Anthropic/OpenAI/altri) o con
    **modelli solo locali** così i tuoi dati restano sul tuo dispositivo. Gli abbonamenti (Claude
    Pro/Max o OpenAI Codex) sono modi opzionali per autenticare quei provider.

    Per Anthropic in OpenClaw, la divisione pratica è:

    - **Chiave API Anthropic**: fatturazione normale dell'API Anthropic
    - **Claude CLI / autenticazione abbonamento Claude in OpenClaw**: lo staff Anthropic
      ci ha detto che questo uso è di nuovo consentito, e OpenClaw considera l'uso di `claude -p`
      autorizzato per questa integrazione a meno che Anthropic pubblichi una nuova
      policy

    Per host Gateway di lunga durata, le chiavi API Anthropic restano comunque la configurazione
    più prevedibile. OpenAI Codex OAuth è supportato esplicitamente per strumenti esterni
    come OpenClaw.

    OpenClaw supporta anche altre opzioni ospitate in stile abbonamento, tra cui
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** e
    **Z.AI / GLM Coding Plan**.

    Documentazione: [Anthropic](/it/providers/anthropic), [OpenAI](/it/providers/openai),
    [Qwen Cloud](/it/providers/qwen),
    [MiniMax](/it/providers/minimax), [Z.AI (GLM)](/it/providers/zai),
    [Modelli locali](/it/gateway/local-models), [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Posso usare un abbonamento Claude Max senza una chiave API?">
    Sì.

    Lo staff Anthropic ci ha detto che l'uso della Claude CLI in stile OpenClaw è di nuovo consentito, quindi
    OpenClaw considera l'autenticazione con abbonamento Claude e l'uso di `claude -p` autorizzati
    per questa integrazione a meno che Anthropic pubblichi una nuova policy. Se vuoi
    la configurazione lato server più prevedibile, usa invece una chiave API Anthropic.

  </Accordion>

  <Accordion title="Supportate l'autenticazione con abbonamento Claude (Claude Pro o Max)?">
    Sì.

    Lo staff Anthropic ci ha detto che questo uso è di nuovo consentito, quindi OpenClaw considera
    il riuso della Claude CLI e l'uso di `claude -p` autorizzati per questa integrazione
    a meno che Anthropic pubblichi una nuova policy.

    Il setup-token Anthropic è ancora disponibile come percorso token supportato da OpenClaw, ma ora OpenClaw preferisce il riuso della Claude CLI e `claude -p` quando disponibili.
    Per carichi di lavoro di produzione o multiutente, l'autenticazione con chiave API Anthropic è ancora la
    scelta più sicura e prevedibile. Se vuoi altre opzioni ospitate in stile abbonamento
    in OpenClaw, vedi [OpenAI](/it/providers/openai), [Qwen / Model
    Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax) e [GLM
    Models](/it/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

  <AccordionGroup>
  <Accordion title="Perché visualizzo HTTP 429 rate_limit_error da Anthropic?">
    Significa che la tua **quota/limite di frequenza Anthropic** è esaurita per la finestra corrente. Se
    usi **Claude CLI**, attendi il ripristino della finestra o aggiorna il tuo piano. Se
    usi una **chiave API Anthropic**, controlla Anthropic Console
    per utilizzo/fatturazione e aumenta i limiti secondo necessità.

    Se il messaggio è specificamente:
    `Extra usage is required for long context requests`, la richiesta sta tentando di usare
    la finestra di contesto 1M di Anthropic (un modello Claude 4.x da 1M con supporto GA o la configurazione legacy
    `context1m: true`). Funziona solo quando le tue credenziali sono idonee
    per la fatturazione del contesto lungo (fatturazione con chiave API o il percorso di accesso Claude di OpenClaw
    con Extra Usage abilitato).

    Suggerimento: imposta un **modello di fallback** così OpenClaw può continuare a rispondere mentre un provider ha un limite di frequenza attivo.
    Vedi [Modelli](/it/cli/models), [OAuth](/it/concepts/oauth) e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/it/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock è supportato?">
    Sì. OpenClaw include un provider **Amazon Bedrock (Converse)** in bundle. Con i marker di ambiente AWS presenti, OpenClaw può rilevare automaticamente il catalogo Bedrock streaming/testo e unirlo come provider implicito `amazon-bedrock`; altrimenti puoi abilitare esplicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` o aggiungere una voce provider manuale. Vedi [Amazon Bedrock](/it/providers/bedrock) e [Provider di modelli](/it/providers/models). Se preferisci un flusso con chiave gestita, un proxy compatibile con OpenAI davanti a Bedrock resta comunque un'opzione valida.
  </Accordion>

  <Accordion title="Come funziona l'autenticazione di Codex?">
    OpenClaw supporta **OpenAI Code (Codex)** tramite OAuth (accesso ChatGPT). Usa
    `openai/gpt-5.5` per la configurazione comune: autenticazione con abbonamento ChatGPT/Codex più
    esecuzione nativa del server app Codex. I riferimenti GPT Codex legacy sono
    configurazioni legacy riparate da `openclaw doctor --fix`. L'accesso diretto con chiave API OpenAI
    resta disponibile per le superfici API OpenAI non agent e per i modelli
    agent tramite un profilo con chiave API `openai` ordinato.
    Vedi [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).
  </Accordion>

  <Accordion title="Perché OpenClaw menziona ancora il prefisso legacy OpenAI Codex?">
    `openai` è il provider e l'ID del profilo di autenticazione sia per le chiavi API OpenAI sia per
    OAuth ChatGPT/Codex. Potresti vedere ancora il prefisso legacy OpenAI Codex nella configurazione legacy e
    negli avvisi di migrazione.
    Le configurazioni meno recenti lo usavano anche come prefisso del modello:

    - `openai/gpt-5.5` = autenticazione con abbonamento ChatGPT/Codex con runtime Codex nativo per i turni agent
    - riferimento GPT-5.5 Codex legacy = route modello legacy riparata da `openclaw doctor --fix`
    - `openai/gpt-5.5` più un profilo con chiave API `openai` ordinato = autenticazione con chiave API per un modello agent OpenAI
    - ID profilo di autenticazione Codex legacy = ID profilo di autenticazione legacy migrato da `openclaw doctor --fix`

    Se vuoi il percorso diretto di fatturazione/limiti di OpenAI Platform, imposta
    `OPENAI_API_KEY`. Se vuoi l'autenticazione con abbonamento ChatGPT/Codex, accedi con
    `openclaw models auth login --provider openai`. Mantieni il riferimento modello come
    `openai/gpt-5.5`; i riferimenti modello Codex legacy sono configurazioni legacy che
    `openclaw doctor --fix` riscrive.

  </Accordion>

  <Accordion title="Perché i limiti di OAuth Codex possono differire dal web ChatGPT?">
    OAuth Codex usa finestre di quota gestite da OpenAI e dipendenti dal piano. In pratica,
    questi limiti possono differire dall'esperienza del sito web/app ChatGPT, anche quando
    entrambi sono collegati allo stesso account.

    OpenClaw può mostrare le finestre di utilizzo/quota del provider attualmente visibili in
    `openclaw models status`, ma non inventa né normalizza i diritti del web ChatGPT
    in accesso API diretto. Se vuoi il percorso diretto di fatturazione/limiti di OpenAI Platform, usa `openai/*` con una chiave API.

  </Accordion>

  <Accordion title="Supportate l'autenticazione con abbonamento OpenAI (OAuth Codex)?">
    Sì. OpenClaw supporta pienamente **OAuth con abbonamento OpenAI Code (Codex)**.
    OpenAI consente esplicitamente l'uso di OAuth con abbonamento in strumenti/flussi di lavoro esterni
    come OpenClaw. L'onboarding può eseguire il flusso OAuth per te.

    Vedi [OAuth](/it/concepts/oauth), [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).

  </Accordion>

  <Accordion title="Come configuro OAuth per Gemini CLI?">
    Gemini CLI usa un **flusso di autenticazione del Plugin**, non un ID client o un segreto in `openclaw.json`.

    Passaggi:

    1. Installa Gemini CLI localmente così `gemini` è in `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Abilita il Plugin: `openclaw plugins enable google`
    3. Accedi: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modello predefinito dopo l'accesso: `google-gemini-cli/gemini-3-flash-preview`
    5. Se le richieste falliscono, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host gateway

    Questo archivia i token OAuth nei profili di autenticazione sull'host gateway. Dettagli: [Provider di modelli](/it/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modello locale va bene per chat informali?">
    Di solito no. OpenClaw richiede un contesto ampio e sicurezza robusta; le schede piccole troncano e perdono informazioni. Se devi, esegui localmente la build del modello **più grande** possibile (LM Studio) e consulta [/gateway/local-models](/it/gateway/local-models). I modelli più piccoli/quantizzati aumentano il rischio di prompt injection - vedi [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Come mantengo il traffico dei modelli ospitati in una regione specifica?">
    Scegli endpoint vincolati a una regione. OpenRouter espone opzioni ospitate negli USA per MiniMax, Kimi e GLM; scegli la variante ospitata negli USA per mantenere i dati nella regione. Puoi comunque elencare Anthropic/OpenAI insieme a questi usando `models.mode: "merge"` così i fallback restano disponibili rispettando il provider regionale selezionato.
  </Accordion>

  <Accordion title="Devo comprare un Mac Mini per installarlo?">
    No. OpenClaw funziona su macOS o Linux (Windows tramite WSL2). Un Mac mini è facoltativo: alcune persone
    ne comprano uno come host sempre attivo, ma vanno bene anche un piccolo VPS, un server domestico o una macchina di classe Raspberry Pi.

    Ti serve un Mac solo **per strumenti esclusivi di macOS**. Per iMessage, usa [iMessage](/it/channels/imessage) con `imsg` su qualsiasi Mac connesso a Messaggi. Se il Gateway gira su Linux o altrove, imposta `channels.imessage.cliPath` su un wrapper SSH che esegue `imsg` su quel Mac. Se vuoi altri strumenti esclusivi di macOS, esegui il Gateway su un Mac o associa un nodo macOS.

    Documentazione: [iMessage](/it/channels/imessage), [Nodi](/it/nodes), [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Mi serve un Mac mini per il supporto iMessage?">
    Ti serve **un dispositivo macOS qualsiasi** connesso a Messaggi. Non deve essere per forza un Mac mini:
    va bene qualsiasi Mac. **Usa [iMessage](/it/channels/imessage)** con `imsg`; il Gateway può girare su quel Mac, oppure altrove con un wrapper SSH `cliPath`.

    Configurazioni comuni:

    - Esegui il Gateway su Linux/VPS e imposta `channels.imessage.cliPath` su un wrapper SSH che esegue `imsg` su un Mac connesso a Messaggi.
    - Esegui tutto sul Mac se vuoi la configurazione più semplice su una sola macchina.

    Documentazione: [iMessage](/it/channels/imessage), [Nodi](/it/nodes),
    [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se compro un Mac mini per eseguire OpenClaw, posso collegarlo al mio MacBook Pro?">
    Sì. Il **Mac mini può eseguire il Gateway** e il tuo MacBook Pro può connettersi come
    **nodo** (dispositivo companion). I nodi non eseguono il Gateway: forniscono funzionalità
    aggiuntive come schermo/fotocamera/canvas e `system.run` su quel dispositivo.

    Schema comune:

    - Gateway sul Mac mini (sempre attivo).
    - MacBook Pro esegue l'app macOS o un host nodo e si associa al Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` per vederlo.

    Documentazione: [Nodi](/it/nodes), [CLI dei nodi](/it/cli/nodes).

  </Accordion>

  <Accordion title="Posso usare Bun?">
    Bun **non è consigliato**. Osserviamo bug di runtime, soprattutto con WhatsApp e Telegram.
    Usa **Node** per gateway stabili.

    Se vuoi comunque sperimentare con Bun, fallo su un gateway non di produzione
    senza WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: cosa va in allowFrom?">
    `channels.telegram.allowFrom` è **l'ID utente Telegram del mittente umano** (numerico). Non è il nome utente del bot.

    La configurazione richiede solo ID utente numerici. Se hai già voci legacy `@username` nella configurazione, `openclaw doctor --fix` può provare a risolverle.

    Più sicuro (nessun bot di terze parti):

    - Invia un DM al tuo bot, poi esegui `openclaw logs --follow` e leggi `from.id`.

    API Bot ufficiale:

    - Invia un DM al tuo bot, poi chiama `https://api.telegram.org/bot<bot_token>/getUpdates` e leggi `message.from.id`.

    Terze parti (meno privato):

    - Invia un DM a `@userinfobot` o `@getidsbot`.

    Vedi [/channels/telegram](/it/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Più persone possono usare un numero WhatsApp con istanze OpenClaw diverse?">
    Sì, tramite **routing multi-agent**. Associa il **DM** WhatsApp di ciascun mittente (peer `kind: "direct"`, mittente E.164 come `+15551234567`) a un `agentId` diverso, così ogni persona ottiene il proprio workspace e archivio sessioni. Le risposte arrivano comunque dallo **stesso account WhatsApp** e il controllo accessi DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) è globale per account WhatsApp. Vedi [Routing multi-agent](/it/concepts/multi-agent) e [WhatsApp](/it/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso eseguire un agent "chat veloce" e un agent "Opus per il coding"?'>
    Sì. Usa il routing multi-agent: assegna a ogni agent il proprio modello predefinito, poi associa le route in ingresso (account provider o peer specifici) a ciascun agent. Un esempio di configurazione si trova in [Routing multi-agent](/it/concepts/multi-agent). Vedi anche [Modelli](/it/concepts/models) e [Configurazione](/it/gateway/configuration).
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
    Le build recenti antepongono anche directory bin utente comuni nei servizi systemd Linux (per esempio `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e rispettano `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando impostate.

  </Accordion>

  <Accordion title="Differenza tra installazione git hackable e installazione npm">
    - **Installazione hackable (git):** checkout completo del sorgente, modificabile, ideale per contributor.
      Esegui le build localmente e puoi modificare codice/documentazione.
    - **Installazione npm:** installazione CLI globale, senza repo, ideale per "eseguirlo e basta".
      Gli aggiornamenti arrivano dai dist-tag npm.

    Documentazione: [Primi passi](/it/start/getting-started), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Posso passare tra installazioni npm e git in seguito?">
    Sì. Usa `openclaw update --channel ...` quando OpenClaw è già installato.
    Questo **non elimina i tuoi dati**: cambia solo l'installazione del codice OpenClaw.
    Il tuo stato (`~/.openclaw`) e workspace (`~/.openclaw/workspace`) restano intatti.

    Da npm a git:

    ```bash
    openclaw update --channel dev
    ```

    Da git a npm:

    ```bash
    openclaw update --channel stable
    ```

    Aggiungi `--dry-run` per visualizzare prima in anteprima il cambio di modalità pianificato. L'aggiornamento esegue
    i follow-up di Doctor, aggiorna le fonti dei plugin per il canale di destinazione e
    riavvia il gateway a meno che tu non passi `--no-restart`.

    Anche l'installer può forzare entrambe le modalità:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Consigli per il backup: vedi [Strategia di backup](/it/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Devo eseguire il Gateway sul mio laptop o su una VPS?">
    Risposta breve: **se vuoi affidabilità 24/7, usa una VPS**. Se vuoi la
    minima complessità e ti vanno bene sospensione/riavvii, eseguilo localmente.

    **Laptop (Gateway locale)**

    - **Pro:** nessun costo del server, accesso diretto ai file locali, finestra del browser visibile.
    - **Contro:** sospensione/cali di rete = disconnessioni, aggiornamenti/riavvii del sistema operativo interrompono, deve restare attivo.

    **VPS / cloud**

    - **Pro:** sempre attivo, rete stabile, nessun problema di sospensione del laptop, più facile da mantenere in esecuzione.
    - **Contro:** spesso eseguito headless (usa screenshot), solo accesso remoto ai file, devi usare SSH per gli aggiornamenti.

    **Nota specifica per OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funzionano tutti bene da una VPS. L'unico vero compromesso è **browser headless** rispetto a una finestra visibile. Vedi [Browser](/it/tools/browser).

    **Impostazione predefinita consigliata:** VPS se hai avuto disconnessioni del gateway in passato. Locale è ottimo quando stai usando attivamente il Mac e vuoi accesso ai file locali o automazione dell'interfaccia utente con un browser visibile.

  </Accordion>

  <Accordion title="Quanto è importante eseguire OpenClaw su una macchina dedicata?">
    Non è obbligatorio, ma **è consigliato per affidabilità e isolamento**.

    - **Host dedicato (VPS/Mac mini/Raspberry Pi):** sempre attivo, meno interruzioni dovute a sospensione/riavvio, autorizzazioni più pulite, più facile da mantenere in esecuzione.
    - **Laptop/desktop condiviso:** va benissimo per test e uso attivo, ma aspettati pause quando la macchina va in sospensione o si aggiorna.

    Se vuoi il meglio di entrambi i mondi, tieni il Gateway su un host dedicato e abbina il tuo laptop come **nodo** per gli strumenti locali di schermo/fotocamera/esecuzione. Vedi [Nodi](/it/nodes).
    Per indicazioni sulla sicurezza, leggi [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i requisiti minimi per una VPS e il sistema operativo consigliato?">
    OpenClaw è leggero. Per un Gateway di base + un canale chat:

    - **Minimo assoluto:** 1 vCPU, 1 GB di RAM, ~500 MB di disco.
    - **Consigliato:** 1-2 vCPU, 2 GB di RAM o più per margine (log, media, più canali). Gli strumenti Node e l'automazione del browser possono richiedere molte risorse.

    OS: usa **Ubuntu LTS** (o qualsiasi Debian/Ubuntu moderno). Il percorso di installazione Linux è testato meglio lì.

    Documentazione: [Linux](/it/platforms/linux), [hosting VPS](/it/vps).

  </Accordion>

  <Accordion title="Posso eseguire OpenClaw in una VM e quali sono i requisiti?">
    Sì. Tratta una VM come una VPS: deve essere sempre accesa, raggiungibile e avere abbastanza
    RAM per il Gateway e per tutti i canali che abiliti.

    Indicazioni di base:

    - **Minimo assoluto:** 1 vCPU, 1 GB di RAM.
    - **Consigliato:** 2 GB di RAM o più se esegui più canali, automazione del browser o strumenti multimediali.
    - **OS:** Ubuntu LTS o un altro Debian/Ubuntu moderno.

    Se sei su Windows, usa **Windows Hub** per la configurazione desktop, oppure WSL2 quando
    vuoi specificamente una VM Gateway in stile Linux con ampia compatibilità
    degli strumenti. Vedi [Windows](/it/platforms/windows), [hosting VPS](/it/vps).
    Se stai eseguendo macOS in una VM, vedi [VM macOS](/it/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — la FAQ principale (modelli, sessioni, gateway, sicurezza, altro)
- [Panoramica dell'installazione](/it/install)
- [Per iniziare](/it/start/getting-started)
- [Risoluzione dei problemi](/it/help/troubleshooting)
