---
read_when:
    - Nuova installazione, onboarding bloccato o errori al primo avvio
    - Scegliere autenticazione e sottoscrizioni del provider
    - Impossibile accedere a docs.openclaw.ai, impossibile aprire la dashboard, installazione bloccata
sidebarTitle: First-run FAQ
summary: 'FAQ: avvio rapido e configurazione al primo avvio — installazione, onboarding, autenticazione, sottoscrizioni, errori iniziali'
title: 'FAQ: configurazione al primo avvio'
x-i18n:
    generated_at: "2026-04-25T18:19:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a3f410b9618df614263c26e5e5c9c45c775b8d05e887e06e02be49f11b7cec
    source_path: help/faq-first-run.md
    workflow: 15
---

  Domande e risposte su avvio rapido e prima configurazione. Per operazioni quotidiane, modelli, autenticazione, sessioni
  e risoluzione dei problemi, vedi la [FAQ](/it/help/faq) principale.

  ## Avvio rapido e configurazione al primo avvio

  <AccordionGroup>
  <Accordion title="Sono bloccato, qual è il modo più veloce per sbloccarmi?">
    Usa un agente AI locale che possa **vedere la tua macchina**. È molto più efficace che chiedere
    su Discord, perché la maggior parte dei casi di "sono bloccato" sono **problemi di configurazione o ambiente locali** che
    chi aiuta da remoto non può ispezionare.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Questi strumenti possono leggere il repo, eseguire comandi, ispezionare i log e aiutarti a correggere
    la configurazione a livello di macchina (PATH, servizi, permessi, file di autenticazione). Fornisci loro il **checkout completo del sorgente** tramite
    l'installazione hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Questo installa OpenClaw **da un checkout git**, così l'agente può leggere codice + documentazione e
    ragionare sulla versione esatta che stai eseguendo. Puoi sempre tornare alla versione stabile in seguito
    rieseguendo l'installer senza `--install-method git`.

    Suggerimento: chiedi all'agente di **pianificare e supervisionare** la correzione (passo dopo passo), poi esegui solo i
    comandi necessari. In questo modo le modifiche restano piccole e più facili da verificare.

    Se scopri un bug reale o una correzione, apri un issue GitHub o invia una PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Inizia con questi comandi (condividi gli output quando chiedi aiuto):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Cosa fanno:

    - `openclaw status`: istantanea rapida dello stato di salute di Gateway/agente + configurazione di base.
    - `openclaw models status`: controlla l'autenticazione del provider + la disponibilità dei modelli.
    - `openclaw doctor`: convalida e ripara i problemi comuni di configurazione/stato.

    Altri controlli CLI utili: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Loop di debug rapido: [Primi 60 secondi se qualcosa non funziona](#first-60-seconds-if-something-is-broken).
    Documentazione di installazione: [Installazione](/it/install), [Flag dell'installer](/it/install/installer), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continua a essere saltato. Cosa significano i motivi di skip?">
    Motivi comuni per cui Heartbeat viene saltato:

    - `quiet-hours`: fuori dalla finestra configurata di active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` esiste ma contiene solo struttura vuota o solo intestazioni
    - `no-tasks-due`: la modalità task di `HEARTBEAT.md` è attiva ma nessuno degli intervalli dei task è ancora in scadenza
    - `alerts-disabled`: tutta la visibilità di heartbeat è disabilitata (`showOk`, `showAlerts` e `useIndicator` sono tutti disattivati)

    In modalità task, i timestamp di scadenza vengono avanzati solo dopo il completamento di una vera esecuzione Heartbeat.
    Le esecuzioni saltate non segnano i task come completati.

    Documentazione: [Heartbeat](/it/gateway/heartbeat), [Automazione e task](/it/automation).

  </Accordion>

  <Accordion title="Modo consigliato per installare e configurare OpenClaw">
    Il repo consiglia l'esecuzione dal sorgente e l'uso dell'onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata può anche compilare automaticamente le risorse UI. Dopo l'onboarding, in genere esegui Gateway sulla porta **18789**.

    Dal sorgente (contributori/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Se non hai ancora un'installazione globale, eseguila tramite `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Come apro la dashboard dopo l'onboarding?">
    La procedura guidata apre il browser con un URL della dashboard pulito (senza token) subito dopo l'onboarding e stampa anche il link nel riepilogo. Tieni aperta quella scheda; se non si è avviata, copia/incolla l'URL stampato sulla stessa macchina.
  </Accordion>

  <Accordion title="Come autentico la dashboard su localhost rispetto a una macchina remota?">
    **Localhost (stessa macchina):**

    - Apri `http://127.0.0.1:18789/`.
    - Se richiede autenticazione shared-secret, incolla il token o la password configurati nelle impostazioni di Control UI.
    - Origine del token: `gateway.auth.token` (oppure `OPENCLAW_GATEWAY_TOKEN`).
    - Origine della password: `gateway.auth.password` (oppure `OPENCLAW_GATEWAY_PASSWORD`).
    - Se non è ancora configurato alcun shared secret, genera un token con `openclaw doctor --generate-gateway-token`.

    **Non su localhost:**

    - **Tailscale Serve** (consigliato): mantieni bind loopback, esegui `openclaw gateway --tailscale serve`, apri `https://<magicdns>/`. Se `gateway.auth.allowTailscale` è `true`, le intestazioni di identità soddisfano l'autenticazione di Control UI/WebSocket (senza shared secret incollato, presuppone un host Gateway attendibile); le API HTTP richiedono comunque l'autenticazione shared-secret a meno che tu non usi deliberatamente `none` per private-ingress o l'autenticazione HTTP trusted-proxy.
      I tentativi simultanei errati di autenticazione Serve dallo stesso client vengono serializzati prima che il limitatore delle autenticazioni fallite li registri, quindi il secondo tentativo errato può già mostrare `retry later`.
    - **Bind Tailnet**: esegui `openclaw gateway --bind tailnet --token "<token>"` (oppure configura l'autenticazione con password), apri `http://<tailscale-ip>:18789/`, poi incolla il corrispondente shared secret nelle impostazioni della dashboard.
    - **Reverse proxy con riconoscimento dell'identità**: mantieni Gateway dietro un trusted proxy non loopback, configura `gateway.auth.mode: "trusted-proxy"`, poi apri l'URL del proxy.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`. L'autenticazione shared-secret si applica comunque sul tunnel; incolla il token o la password configurati se richiesto.

    Vedi [Dashboard](/it/web/dashboard) e [Superfici web](/it/web) per dettagli su modalità bind e autenticazione.

  </Accordion>

  <Accordion title="Perché esistono due configurazioni di approvazione exec per le approvazioni chat?">
    Controllano livelli diversi:

    - `approvals.exec`: inoltra le richieste di approvazione alle destinazioni chat
    - `channels.<channel>.execApprovals`: fa sì che quel canale agisca come client di approvazione nativo per le approvazioni exec

    La policy exec dell'host resta comunque il vero gate di approvazione. La configurazione chat controlla solo dove
    compaiono le richieste di approvazione e come le persone possono rispondere.

    Nella maggior parte delle configurazioni **non** ti servono entrambe:

    - Se la chat supporta già comandi e risposte, `/approve` nella stessa chat funziona tramite il percorso condiviso.
    - Se un canale nativo supportato può dedurre gli approvatori in sicurezza, OpenClaw ora abilita automaticamente le approvazioni native DM-first quando `channels.<channel>.execApprovals.enabled` non è impostato o è `"auto"`.
    - Quando sono disponibili card/pulsanti di approvazione nativi, quella UI nativa è il percorso principale; l'agente dovrebbe includere un comando manuale `/approve` solo se il risultato dello strumento dice che le approvazioni chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    - Usa `approvals.exec` solo quando le richieste devono essere inoltrate anche ad altre chat o a stanze operative esplicite.
    - Usa `channels.<channel>.execApprovals.target: "channel"` oppure `"both"` solo quando vuoi esplicitamente che le richieste di approvazione vengano pubblicate di nuovo nella stanza/topic di origine.
    - Le approvazioni dei Plugin sono ancora separate: usano per impostazione predefinita `/approve` nella stessa chat, inoltro facoltativo `approvals.plugin`, e solo alcuni canali nativi mantengono in aggiunta la gestione nativa delle approvazioni dei Plugin.

    In breve: l'inoltro serve per il routing, la configurazione del client nativo serve per una UX più ricca e specifica del canale.
    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>

  <Accordion title="Di quale runtime ho bisogno?">
    È richiesto Node **>= 22**. `pnpm` è consigliato. Bun **non è consigliato** per Gateway.
  </Accordion>

  <Accordion title="Funziona su Raspberry Pi?">
    Sì. Gateway è leggero: la documentazione indica **512 MB-1 GB di RAM**, **1 core** e circa **500 MB**
    di disco come sufficienti per uso personale, e nota che un **Raspberry Pi 4 può eseguirlo**.

    Se vuoi più margine (log, media, altri servizi), sono consigliati **2 GB**, ma
    non è un minimo rigido.

    Suggerimento: un piccolo Pi/VPS può ospitare Gateway, e puoi abbinare **Node** sul tuo laptop/telefono per
    schermo/fotocamera/canvas locali o esecuzione di comandi. Vedi [Node](/it/nodes).

  </Accordion>

  <Accordion title="Ci sono suggerimenti per le installazioni su Raspberry Pi?">
    In breve: funziona, ma aspettati qualche asperità.

    - Usa un sistema operativo **a 64 bit** e mantieni Node >= 22.
    - Preferisci l'installazione **hackable (git)** così puoi vedere i log e aggiornare rapidamente.
    - Inizia senza canali/Skills, poi aggiungili uno alla volta.
    - Se incontri strani problemi binari, di solito è un problema di **compatibilità ARM**.

    Documentazione: [Linux](/it/platforms/linux), [Installazione](/it/install).

  </Accordion>

  <Accordion title="È bloccato su wake up my friend / l'onboarding non si schiude. E adesso?">
    Quella schermata dipende dal fatto che Gateway sia raggiungibile e autenticato. La TUI invia anche
    automaticamente "Wake up, my friend!" alla prima schiusa. Se vedi quella riga con **nessuna risposta**
    e i token restano a 0, l'agente non è mai stato eseguito.

    1. Riavvia Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Controlla stato + autenticazione:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Se continua a bloccarsi, esegui:

    ```bash
    openclaw doctor
    ```

    Se Gateway è remoto, assicurati che il tunnel/la connessione Tailscale sia attiva e che la UI
    punti al Gateway corretto. Vedi [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrare la mia configurazione su una nuova macchina (Mac mini) senza rifare l'onboarding?">
    Sì. Copia la **directory di stato** e il **workspace**, poi esegui Doctor una volta. Questo
    mantiene il tuo bot "esattamente uguale" (memoria, cronologia sessioni, autenticazione e stato
    del canale) purché tu copi **entrambe** le posizioni:

    1. Installa OpenClaw sulla nuova macchina.
    2. Copia `$OPENCLAW_STATE_DIR` (predefinita: `~/.openclaw`) dalla vecchia macchina.
    3. Copia il tuo workspace (predefinito: `~/.openclaw/workspace`).
    4. Esegui `openclaw doctor` e riavvia il servizio Gateway.

    Questo preserva configurazione, profili di autenticazione, credenziali WhatsApp, sessioni e memoria. Se sei in
    modalità remota, ricorda che l'host gateway possiede l'archivio delle sessioni e il workspace.

    **Importante:** se fai commit/push del tuo workspace solo su GitHub, stai facendo il backup
    di **memoria + file bootstrap**, ma **non** della cronologia delle sessioni né dell'autenticazione. Questi si trovano
    sotto `~/.openclaw/` (per esempio `~/.openclaw/agents/<agentId>/sessions/`).

    Correlati: [Migrazione](/it/install/migrating), [Dove si trovano le cose sul disco](#where-things-live-on-disk),
    [Workspace agente](/it/concepts/agent-workspace), [Doctor](/it/gateway/doctor),
    [Modalità remota](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove posso vedere le novità dell'ultima versione?">
    Controlla il changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Le voci più recenti sono in alto. Se la sezione in alto è contrassegnata come **Unreleased**, la successiva
    sezione datata è l'ultima versione distribuita. Le voci sono raggruppate per **Highlights**, **Changes** e
    **Fixes** (più sezioni docs/altre quando necessario).

  </Accordion>

  <Accordion title="Impossibile accedere a docs.openclaw.ai (errore SSL)">
    Alcune connessioni Comcast/Xfinity bloccano erroneamente `docs.openclaw.ai` tramite Xfinity
    Advanced Security. Disabilitalo oppure aggiungi `docs.openclaw.ai` alla allowlist, poi riprova.
    Aiutaci a sbloccarlo segnalandolo qui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se ancora non riesci a raggiungere il sito, la documentazione è mirrorata su GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Differenza tra stable e beta">
    **Stable** e **beta** sono **dist-tag npm**, non linee di codice separate:

    - `latest` = stable
    - `beta` = build anticipata per i test

    Di solito, una release stable arriva prima su **beta**, poi un passaggio esplicito
    di promozione sposta quella stessa versione su `latest`. I maintainer possono anche
    pubblicare direttamente su `latest` quando necessario. Per questo beta e stable possono
    puntare alla **stessa versione** dopo la promozione.

    Vedi cosa è cambiato:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Per i one-liner di installazione e la differenza tra beta e dev, vedi l'accordion qui sotto.

  </Accordion>

  <Accordion title="Come installo la versione beta e qual è la differenza tra beta e dev?">
    **Beta** è il dist-tag npm `beta` (può coincidere con `latest` dopo la promozione).
    **Dev** è l'head mobile di `main` (git); quando viene pubblicato, usa il dist-tag npm `dev`.

    One-liner (macOS/Linux):

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

  <Accordion title="Come provo le ultimissime versioni?">
    Due opzioni:

    1. **Canale dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Questo passa al branch `main` e aggiorna dal sorgente.

    2. **Installazione hackable (dal sito dell'installer):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Questo ti dà un repo locale che puoi modificare, quindi aggiornare tramite git.

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
    - **Onboarding:** 5-15 minuti a seconda di quanti canali/modelli configuri

    Se si blocca, usa [Installer bloccato](#quick-start-and-first-run-setup)
    e il loop di debug rapido in [Sono bloccato](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer bloccato? Come ottengo più feedback?">
    Riesegui l'installer con **output dettagliato**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Installazione beta con verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Per un'installazione hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Equivalente Windows (PowerShell):

    ```powershell
    # install.ps1 non ha ancora un flag -Verbose dedicato.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Altre opzioni: [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="L'installazione su Windows dice git not found oppure openclaw not recognized">
    Due problemi comuni su Windows:

    **1) errore npm spawn git / git not found**

    - Installa **Git for Windows** e assicurati che `git` sia nel tuo PATH.
    - Chiudi e riapri PowerShell, poi riesegui l'installer.

    **2) openclaw is not recognized dopo l'installazione**

    - La cartella bin globale di npm non è nel PATH.
    - Controlla il percorso:

      ```powershell
      npm config get prefix
      ```

    - Aggiungi quella directory al tuo PATH utente (su Windows non serve il suffisso `\bin`; nella maggior parte dei sistemi è `%AppData%\npm`).
    - Chiudi e riapri PowerShell dopo aver aggiornato il PATH.

    Se vuoi la configurazione Windows più fluida, usa **WSL2** invece di Windows nativo.
    Documentazione: [Windows](/it/platforms/windows).

  </Accordion>

  <Accordion title="L'output exec su Windows mostra testo cinese illeggibile: cosa devo fare?">
    Di solito è una mancata corrispondenza della code page della console nelle shell Windows native.

    Sintomi:

    - l'output di `system.run`/`exec` mostra il testo cinese come mojibake
    - lo stesso comando appare corretto in un altro profilo di terminale

    Soluzione rapida in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Poi riavvia Gateway e riprova il comando:

    ```powershell
    openclaw gateway restart
    ```

    Se continui a riprodurre questo problema sull'ultima versione di OpenClaw, tienilo monitorato/segnalalo qui:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentazione non ha risposto alla mia domanda: come ottengo una risposta migliore?">
    Usa l'**installazione hackable (git)** così hai localmente tutto il sorgente e la documentazione, poi chiedi
    al tuo bot (o a Claude/Codex) _da quella cartella_ così può leggere il repo e rispondere con precisione.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Maggiori dettagli: [Installazione](/it/install) e [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="Come installo OpenClaw su Linux?">
    Risposta breve: segui la guida Linux, poi esegui l'onboarding.

    - Percorso rapido Linux + installazione del servizio: [Linux](/it/platforms/linux).
    - Procedura completa: [Guida introduttiva](/it/start/getting-started).
    - Installer + aggiornamenti: [Installazione e aggiornamenti](/it/install/updating).

  </Accordion>

  <Accordion title="Come installo OpenClaw su un VPS?">
    Va bene qualsiasi VPS Linux. Installa sul server, poi usa SSH/Tailscale per raggiungere Gateway.

    Guide: [exe.dev](/it/install/exe-dev), [Hetzner](/it/install/hetzner), [Fly.io](/it/install/fly).
    Accesso remoto: [Gateway remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove si trovano le guide di installazione cloud/VPS?">
    Manteniamo un **hub di hosting** con i provider più comuni. Scegline uno e segui la guida:

    - [Hosting VPS](/it/vps) (tutti i provider in un unico posto)
    - [Fly.io](/it/install/fly)
    - [Hetzner](/it/install/hetzner)
    - [exe.dev](/it/install/exe-dev)

    Come funziona nel cloud: il **Gateway viene eseguito sul server**, e vi accedi
    dal tuo laptop/telefono tramite la Control UI (o Tailscale/SSH). Il tuo stato + workspace
    si trovano sul server, quindi tratta l'host come fonte di verità e fanne il backup.

    Puoi associare **Node** (Mac/iOS/Android/headless) a quel Gateway cloud per accedere
    a schermo/fotocamera/canvas locali o eseguire comandi sul tuo laptop mantenendo
    il Gateway nel cloud.

    Hub: [Piattaforme](/it/platforms). Accesso remoto: [Gateway remoto](/it/gateway/remote).
    Node: [Node](/it/nodes), [CLI Node](/it/cli/nodes).

  </Accordion>

  <Accordion title="Posso chiedere a OpenClaw di aggiornarsi da solo?">
    Risposta breve: **possibile, ma non consigliato**. Il flusso di aggiornamento può riavviare il
    Gateway (interrompendo la sessione attiva), può richiedere un checkout git pulito e
    può chiedere conferma. Più sicuro: eseguire gli aggiornamenti da una shell come operatore.

    Usa la CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Se devi automatizzarlo da un agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentazione: [Aggiornamento](/it/cli/update), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Che cosa fa davvero l'onboarding?">
    `openclaw onboard` è il percorso di configurazione consigliato. In **modalità locale** ti guida attraverso:

    - **Configurazione modello/autenticazione** (OAuth del provider, chiavi API, setup-token Anthropic, più opzioni per modelli locali come LM Studio)
    - Posizione del **workspace** + file bootstrap
    - **Impostazioni del Gateway** (bind/porta/autenticazione/tailscale)
    - **Canali** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, più Plugin di canale bundled come QQ Bot)
    - **Installazione daemon** (LaunchAgent su macOS; unit user systemd su Linux/WSL2)
    - **Controlli di integrità** e selezione delle **Skills**

    Inoltre avvisa se il tuo modello configurato è sconosciuto o privo di autenticazione.

  </Accordion>

  <Accordion title="Ho bisogno di un abbonamento Claude o OpenAI per eseguirlo?">
    No. Puoi eseguire OpenClaw con **chiavi API** (Anthropic/OpenAI/altri) oppure con
    **modelli solo locali** così i tuoi dati restano sul tuo dispositivo. Gli abbonamenti (Claude
    Pro/Max o OpenAI Codex) sono modi facoltativi per autenticarsi con quei provider.

    Per Anthropic in OpenClaw, la distinzione pratica è:

    - **Chiave API Anthropic**: normale fatturazione API Anthropic
    - **Autenticazione Claude CLI / abbonamento Claude in OpenClaw**: lo staff Anthropic
      ci ha detto che questo utilizzo è di nuovo consentito, e OpenClaw tratta l'uso di `claude -p`
      come autorizzato per questa integrazione a meno che Anthropic non pubblichi una nuova
      policy

    Per host Gateway di lunga durata, le chiavi API Anthropic restano comunque la
    configurazione più prevedibile. L'OAuth di OpenAI Codex è supportato esplicitamente per strumenti
    esterni come OpenClaw.

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

    Lo staff Anthropic ci ha detto che l'uso in stile Claude CLI di OpenClaw è di nuovo consentito, quindi
    OpenClaw tratta l'autenticazione con abbonamento Claude e l'uso di `claude -p` come autorizzati
    per questa integrazione a meno che Anthropic non pubblichi una nuova policy. Se vuoi
    la configurazione lato server più prevedibile, usa invece una chiave API Anthropic.

  </Accordion>

  <Accordion title="Supportate l'autenticazione con abbonamento Claude (Claude Pro o Max)?">
    Sì.

    Lo staff Anthropic ci ha detto che questo utilizzo è di nuovo consentito, quindi OpenClaw tratta
    il riuso di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione
    a meno che Anthropic non pubblichi una nuova policy.

    Il setup-token Anthropic è ancora disponibile come percorso token supportato in OpenClaw, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.
    Per workload di produzione o multiutente, l'autenticazione con chiave API Anthropic resta comunque la
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
    usi **Claude CLI**, attendi che la finestra si resetti oppure passa a un piano superiore. Se
    usi una **chiave API Anthropic**, controlla Anthropic Console
    per utilizzo/fatturazione e aumenta i limiti se necessario.

    Se il messaggio è specificamente:
    `Extra usage is required for long context requests`, la richiesta sta cercando di usare
    la beta del contesto 1M di Anthropic (`context1m: true`). Funziona solo quando la tua
    credenziale è idonea per la fatturazione del contesto lungo (fatturazione con chiave API o il
    percorso di login Claude OpenClaw con Extra Usage abilitato).

    Suggerimento: imposta un **modello di fallback** così OpenClaw può continuare a rispondere mentre un provider è soggetto a rate limit.
    Vedi [Modelli](/it/cli/models), [OAuth](/it/concepts/oauth), e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/it/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock è supportato?">
    Sì. OpenClaw ha un provider bundled **Amazon Bedrock (Converse)**. Con i marker env AWS presenti, OpenClaw può rilevare automaticamente il catalogo Bedrock streaming/testo e unirlo come provider implicito `amazon-bedrock`; altrimenti puoi abilitare esplicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` o aggiungere una voce provider manuale. Vedi [Amazon Bedrock](/it/providers/bedrock) e [Provider di modelli](/it/providers/models). Se preferisci un flusso di chiavi gestito, anche un proxy compatibile OpenAI davanti a Bedrock resta un'opzione valida.
  </Accordion>

  <Accordion title="Come funziona l'autenticazione Codex?">
    OpenClaw supporta **OpenAI Code (Codex)** tramite OAuth (accesso ChatGPT). Usa
    `openai-codex/gpt-5.5` per l'OAuth Codex tramite il runner PI predefinito. Usa
    `openai/gpt-5.5` per l'accesso diretto con chiave API OpenAI. GPT-5.5 può anche usare
    abbonamento/OAuth tramite `openai-codex/gpt-5.5` oppure esecuzioni native del server-app Codex
    con `openai/gpt-5.5` e `embeddedHarness.runtime: "codex"`.
    Vedi [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).
  </Accordion>

  <Accordion title="Perché OpenClaw menziona ancora openai-codex?">
    `openai-codex` è il provider e l'id del profilo di autenticazione per l'OAuth ChatGPT/Codex.
    È anche il prefisso esplicito del modello PI per l'OAuth Codex:

    - `openai/gpt-5.5` = attuale percorso diretto con chiave API OpenAI in PI
    - `openai-codex/gpt-5.5` = percorso OAuth Codex in PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = percorso nativo del server-app Codex
    - `openai-codex:...` = id del profilo di autenticazione, non un riferimento a un modello

    Se vuoi il percorso diretto di fatturazione/limite OpenAI Platform, imposta
    `OPENAI_API_KEY`. Se vuoi l'autenticazione con abbonamento ChatGPT/Codex, accedi con
    `openclaw models auth login --provider openai-codex` e usa
    riferimenti modello `openai-codex/*` per le esecuzioni PI.

  </Accordion>

  <Accordion title="Perché i limiti OAuth Codex possono differire da ChatGPT web?">
    L'OAuth Codex usa finestre di quota gestite da OpenAI e dipendenti dal piano. In pratica,
    questi limiti possono differire dall'esperienza del sito/app ChatGPT, anche quando
    entrambi sono collegati allo stesso account.

    OpenClaw può mostrare le finestre di utilizzo/quota del provider attualmente visibili in
    `openclaw models status`, ma non inventa né normalizza i
    diritti ChatGPT web in accesso API diretto. Se vuoi il percorso diretto di
    fatturazione/limite OpenAI Platform, usa `openai/*` con una chiave API.

  </Accordion>

  <Accordion title="Supportate l'autenticazione con abbonamento OpenAI (OAuth Codex)?">
    Sì. OpenClaw supporta pienamente **OAuth con abbonamento OpenAI Code (Codex)**.
    OpenAI consente esplicitamente l'uso di OAuth con abbonamento in strumenti/workflow esterni
    come OpenClaw. L'onboarding può eseguire il flusso OAuth per te.

    Vedi [OAuth](/it/concepts/oauth), [Provider di modelli](/it/concepts/model-providers), e [Onboarding (CLI)](/it/start/wizard).

  </Accordion>

  <Accordion title="Come configuro Gemini CLI OAuth?">
    Gemini CLI usa un **flusso di autenticazione del Plugin**, non un client id o secret in `openclaw.json`.

    Passaggi:

    1. Installa Gemini CLI localmente così `gemini` è nel `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Abilita il Plugin: `openclaw plugins enable google`
    3. Accedi: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modello predefinito dopo l'accesso: `google-gemini-cli/gemini-3-flash-preview`
    5. Se le richieste falliscono, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host gateway

    Questo memorizza i token OAuth nei profili di autenticazione sull'host gateway. Dettagli: [Provider di modelli](/it/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modello locale va bene per chat casuali?">
    Di solito no. OpenClaw richiede un contesto ampio + una sicurezza forte; le schede piccole troncano e fanno trapelare. Se proprio devi, esegui la build del modello **più grande** che puoi localmente (LM Studio) e vedi [/gateway/local-models](/it/gateway/local-models). I modelli più piccoli/quantizzati aumentano il rischio di prompt injection - vedi [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Come faccio a mantenere il traffico dei modelli hosted in una regione specifica?">
    Scegli endpoint fissati su una regione. OpenRouter espone opzioni ospitate negli Stati Uniti per MiniMax, Kimi e GLM; scegli la variante ospitata negli Stati Uniti per mantenere i dati in regione. Puoi comunque elencare Anthropic/OpenAI insieme a questi usando `models.mode: "merge"` così i fallback restano disponibili rispettando il provider regionalizzato che selezioni.
  </Accordion>

  <Accordion title="Devo comprare un Mac Mini per installarlo?">
    No. OpenClaw funziona su macOS o Linux (Windows tramite WSL2). Un Mac mini è facoltativo: alcune persone
    ne acquistano uno come host sempre acceso, ma vanno bene anche un piccolo VPS, un server domestico o una macchina tipo Raspberry Pi.

    Ti serve un Mac solo **per strumenti esclusivi di macOS**. Per iMessage, usa [BlueBubbles](/it/channels/bluebubbles) (consigliato) - il server BlueBubbles gira su qualsiasi Mac, e Gateway può girare su Linux o altrove. Se vuoi altri strumenti esclusivi di macOS, esegui Gateway su un Mac oppure abbina un Node macOS.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Node](/it/nodes), [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Mi serve un Mac mini per il supporto iMessage?">
    Ti serve **un qualsiasi dispositivo macOS** che abbia effettuato l'accesso a Messaggi. **Non** deve essere per forza un Mac mini -
    va bene qualsiasi Mac. **Usa [BlueBubbles](/it/channels/bluebubbles)** (consigliato) per iMessage - il server BlueBubbles gira su macOS, mentre Gateway può girare su Linux o altrove.

    Configurazioni comuni:

    - Esegui Gateway su Linux/VPS, ed esegui il server BlueBubbles su qualsiasi Mac con accesso a Messaggi.
    - Esegui tutto sul Mac se vuoi la configurazione più semplice su una sola macchina.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Node](/it/nodes),
    [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se compro un Mac mini per eseguire OpenClaw, posso collegarlo al mio MacBook Pro?">
    Sì. Il **Mac mini può eseguire Gateway**, e il tuo MacBook Pro può collegarsi come
    **Node** (dispositivo companion). I Node non eseguono Gateway - forniscono capacità
    aggiuntive come schermo/fotocamera/canvas e `system.run` su quel dispositivo.

    Schema comune:

    - Gateway sul Mac mini (sempre acceso).
    - Il MacBook Pro esegue l'app macOS o un host Node e si abbina al Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` per vederlo.

    Documentazione: [Node](/it/nodes), [CLI Node](/it/cli/nodes).

  </Accordion>

  <Accordion title="Posso usare Bun?">
    Bun **non è consigliato**. Vediamo bug di runtime, specialmente con WhatsApp e Telegram.
    Usa **Node** per Gateway stabili.

    Se vuoi comunque sperimentare con Bun, fallo su un gateway non di produzione
    senza WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: cosa va in allowFrom?">
    `channels.telegram.allowFrom` è **l'user ID Telegram del mittente umano** (numerico). Non è lo username del bot.

    La configurazione richiede solo user ID numerici. Se hai già voci legacy `@username` nella configurazione, `openclaw doctor --fix` può provare a risolverle.

    Più sicuro (senza bot di terze parti):

    - Invia un DM al tuo bot, poi esegui `openclaw logs --follow` e leggi `from.id`.

    Bot API ufficiale:

    - Invia un DM al tuo bot, poi chiama `https://api.telegram.org/bot<bot_token>/getUpdates` e leggi `message.from.id`.

    Terze parti (meno private):

    - Invia un DM a `@userinfobot` o `@getidsbot`.

    Vedi [/channels/telegram](/it/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Più persone possono usare un numero WhatsApp con istanze OpenClaw diverse?">
    Sì, tramite **multi-agent routing**. Associa il **DM** WhatsApp di ogni mittente (peer `kind: "direct"`, mittente E.164 come `+15551234567`) a un `agentId` diverso, così ogni persona ottiene il proprio workspace e archivio sessioni. Le risposte arrivano comunque dallo **stesso account WhatsApp**, e il controllo di accesso DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) è globale per account WhatsApp. Vedi [Multi-Agent Routing](/it/concepts/multi-agent) e [WhatsApp](/it/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso eseguire un agente "fast chat" e un agente "Opus for coding"?'>
    Sì. Usa multi-agent routing: assegna a ogni agente il proprio modello predefinito, poi associa le route in ingresso (account provider o peer specifici) a ciascun agente. Un esempio di configurazione si trova in [Multi-Agent Routing](/it/concepts/multi-agent). Vedi anche [Modelli](/it/concepts/models) e [Configurazione](/it/gateway/configuration).
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
    Le build recenti antepongono anche le comuni directory bin utente nei servizi Linux systemd (per esempio `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e rispettano `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando impostati.

  </Accordion>

  <Accordion title="Differenza tra l'installazione git hackable e npm install">
    - **Installazione hackable (git):** checkout completo del sorgente, modificabile, ideale per i contributori.
      Esegui le build localmente e puoi correggere codice/documentazione.
    - **npm install:** installazione CLI globale, senza repo, ideale per "basta eseguirlo".
      Gli aggiornamenti arrivano dai dist-tag npm.

    Documentazione: [Guida introduttiva](/it/start/getting-started), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Posso passare in seguito tra installazioni npm e git?">
    Sì. Installa l'altra variante, poi esegui Doctor così il servizio gateway punti al nuovo entrypoint.
    Questo **non elimina i tuoi dati** - cambia solo l'installazione del codice OpenClaw. Il tuo stato
    (`~/.openclaw`) e il workspace (`~/.openclaw/workspace`) restano intatti.

    Da npm a git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Da git a npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor rileva una mancata corrispondenza dell'entrypoint del servizio gateway e propone di riscrivere la configurazione del servizio in modo che corrisponda all'installazione corrente (usa `--repair` nell'automazione).

    Suggerimenti per il backup: vedi [Strategia di backup](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Dovrei eseguire Gateway sul mio laptop o su un VPS?">
    Risposta breve: **se vuoi affidabilità 24/7, usa un VPS**. Se vuoi il
    minimo attrito e ti vanno bene sospensioni/riavvii, eseguilo localmente.

    **Laptop (Gateway locale)**

    - **Pro:** nessun costo server, accesso diretto ai file locali, finestra del browser visibile.
    - **Contro:** sospensione/cali di rete = disconnessioni, aggiornamenti/riavvii del sistema operativo interrompono, deve restare acceso.

    **VPS / cloud**

    - **Pro:** sempre acceso, rete stabile, nessun problema di sospensione del laptop, più facile da mantenere in esecuzione.
    - **Contro:** spesso eseguito headless (usa screenshot), accesso solo ai file remoti, devi usare SSH per gli aggiornamenti.

    **Nota specifica di OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funzionano tutti bene da un VPS. L'unico vero compromesso è **browser headless** vs finestra visibile. Vedi [Browser](/it/tools/browser).

    **Impostazione predefinita consigliata:** VPS se in passato hai avuto disconnessioni del gateway. L'esecuzione locale è ottima quando stai usando attivamente il Mac e vuoi accesso ai file locali o automazione UI con un browser visibile.

  </Accordion>

  <Accordion title="Quanto è importante eseguire OpenClaw su una macchina dedicata?">
    Non è obbligatorio, ma **consigliato per affidabilità e isolamento**.

    - **Host dedicato (VPS/Mac mini/Pi):** sempre acceso, meno interruzioni dovute a sospensione/riavvio, permessi più puliti, più facile da mantenere in esecuzione.
    - **Laptop/desktop condiviso:** va benissimo per test e uso attivo, ma aspettati pause quando la macchina va in sospensione o si aggiorna.

    Se vuoi il meglio di entrambi i mondi, mantieni il Gateway su un host dedicato e abbina il tuo laptop come **Node** per strumenti locali di schermo/fotocamera/exec. Vedi [Node](/it/nodes).
    Per indicazioni sulla sicurezza, leggi [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i requisiti minimi di un VPS e il sistema operativo consigliato?">
    OpenClaw è leggero. Per un Gateway di base + un canale chat:

    - **Minimo assoluto:** 1 vCPU, 1 GB di RAM, ~500 MB di disco.
    - **Consigliato:** 1-2 vCPU, 2 GB di RAM o più per avere margine (log, media, canali multipli). Gli strumenti Node e l'automazione del browser possono richiedere molte risorse.

    Sistema operativo: usa **Ubuntu LTS** (o qualsiasi Debian/Ubuntu moderno). Il percorso di installazione Linux è testato meglio lì.

    Documentazione: [Linux](/it/platforms/linux), [Hosting VPS](/it/vps).

  </Accordion>

  <Accordion title="Posso eseguire OpenClaw in una VM e quali sono i requisiti?">
    Sì. Tratta una VM come un VPS: deve essere sempre accesa, raggiungibile e avere abbastanza
    RAM per il Gateway e per gli eventuali canali che abiliti.

    Indicazioni di base:

    - **Minimo assoluto:** 1 vCPU, 1 GB di RAM.
    - **Consigliato:** 2 GB di RAM o più se esegui più canali, automazione del browser o strumenti media.
    - **Sistema operativo:** Ubuntu LTS o un altro Debian/Ubuntu moderno.

    Se usi Windows, **WSL2 è la configurazione in stile VM più semplice** e offre la migliore
    compatibilità degli strumenti. Vedi [Windows](/it/platforms/windows), [Hosting VPS](/it/vps).
    Se stai eseguendo macOS in una VM, vedi [VM macOS](/it/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — la FAQ principale (modelli, sessioni, gateway, sicurezza e altro)
- [Panoramica dell'installazione](/it/install)
- [Guida introduttiva](/it/start/getting-started)
- [Risoluzione dei problemi](/it/help/troubleshooting)
