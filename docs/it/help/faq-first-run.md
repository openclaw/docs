---
read_when:
    - Nuova installazione, onboarding bloccato o errori al primo avvio
    - Scegliere autenticazione e abbonamenti dei provider
    - Impossibile accedere a docs.openclaw.ai, impossibile aprire la dashboard, installazione bloccata
sidebarTitle: First-run FAQ
summary: 'FAQ: avvio rapido e configurazione iniziale — installazione, onboard, autenticazione, abbonamenti, primi errori'
title: 'FAQ: configurazione iniziale al primo avvio'
x-i18n:
    generated_at: "2026-04-24T08:43:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  Domande e risposte rapide per avvio rapido e prima configurazione. Per operazioni quotidiane, modelli, autenticazione, sessioni
  e risoluzione dei problemi vedi la [FAQ](/it/help/faq) principale.

  ## Avvio rapido e configurazione iniziale al primo avvio

  <AccordionGroup>
  <Accordion title="Sono bloccato, modo più veloce per sbloccarmi">
    Usa un agente AI locale che possa **vedere la tua macchina**. È molto più efficace che chiedere
    su Discord, perché la maggior parte dei casi “sono bloccato” sono **problemi locali di configurazione o ambiente**
    che chi aiuta da remoto non può ispezionare.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Questi strumenti possono leggere il repository, eseguire comandi, ispezionare i log e aiutarti a sistemare la configurazione
    a livello macchina (PATH, servizi, permessi, file di autenticazione). Fornisci loro il **checkout completo del sorgente** tramite
    l’installazione hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Questo installa OpenClaw **da un checkout git**, così l’agente può leggere codice + documentazione e
    ragionare sulla versione esatta che stai eseguendo. Puoi sempre tornare a stable più tardi
    rieseguendo l’installer senza `--install-method git`.

    Suggerimento: chiedi all’agente di **pianificare e supervisionare** la correzione (passo dopo passo), poi di eseguire solo i
    comandi necessari. Così le modifiche restano piccole e più facili da controllare.

    Se scopri un vero bug o una correzione, apri un issue GitHub o invia una PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Inizia con questi comandi (condividi gli output quando chiedi aiuto):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Cosa fanno:

    - `openclaw status`: snapshot rapido dello stato di salute del gateway/agente + configurazione di base.
    - `openclaw models status`: controlla autenticazione del provider + disponibilità dei modelli.
    - `openclaw doctor`: valida e ripara problemi comuni di configurazione/stato.

    Altri controlli CLI utili: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Ciclo rapido di debug: [Primi 60 secondi se qualcosa è rotto](#first-60-seconds-if-something-is-broken).
    Documentazione di installazione: [Install](/it/install), [Flag dell’installer](/it/install/installer), [Updating](/it/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continua a saltare. Cosa significano i motivi di skip?">
    Motivi comuni di skip di Heartbeat:

    - `quiet-hours`: fuori dalla finestra configurata di ore attive
    - `empty-heartbeat-file`: `HEARTBEAT.md` esiste ma contiene solo struttura vuota o con soli header
    - `no-tasks-due`: la modalità attività di `HEARTBEAT.md` è attiva ma nessuno degli intervalli delle attività è ancora in scadenza
    - `alerts-disabled`: tutta la visibilità Heartbeat è disabilitata (`showOk`, `showAlerts` e `useIndicator` sono tutti disattivati)

    In modalità attività, i timestamp di scadenza vengono avanzati solo dopo il completamento
    di una vera esecuzione Heartbeat. Le esecuzioni saltate non segnano le attività come completate.

    Documentazione: [Heartbeat](/it/gateway/heartbeat), [Automazione e attività](/it/automation).

  </Accordion>

  <Accordion title="Modo consigliato per installare e configurare OpenClaw">
    Il repository consiglia di eseguire dal sorgente e usare l’onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata può anche compilare automaticamente gli asset UI. Dopo l’onboarding, in genere esegui il Gateway sulla porta **18789**.

    Dal sorgente (contributor/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Se non hai ancora un’installazione globale, eseguilo tramite `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Come apro la dashboard dopo l’onboarding?">
    La procedura guidata apre il browser con un URL dashboard pulito (senza token) subito dopo l’onboarding e stampa anche il link nel riepilogo. Tieni aperta quella scheda; se non si è avviata, copia/incolla l’URL stampato sulla stessa macchina.
  </Accordion>

  <Accordion title="Come autentico la dashboard su localhost rispetto al remoto?">
    **Localhost (stessa macchina):**

    - Apri `http://127.0.0.1:18789/`.
    - Se chiede autenticazione con segreto condiviso, incolla il token o la password configurati nelle impostazioni della Control UI.
    - Origine del token: `gateway.auth.token` (oppure `OPENCLAW_GATEWAY_TOKEN`).
    - Origine della password: `gateway.auth.password` (oppure `OPENCLAW_GATEWAY_PASSWORD`).
    - Se non è ancora configurato alcun segreto condiviso, genera un token con `openclaw doctor --generate-gateway-token`.

    **Non su localhost:**

    - **Tailscale Serve** (consigliato): mantieni il bind su loopback, esegui `openclaw gateway --tailscale serve`, apri `https://<magicdns>/`. Se `gateway.auth.allowTailscale` è `true`, le intestazioni di identità soddisfano l’autenticazione di Control UI/WebSocket (nessun segreto condiviso incollato, presuppone host gateway trusted); le API HTTP richiedono comunque autenticazione con segreto condiviso salvo che tu usi deliberatamente `none` su ingresso privato o autenticazione HTTP trusted-proxy.
      Tentativi concorrenti errati di autenticazione Serve dallo stesso client vengono serializzati prima che il limiter dei fallimenti li registri, quindi già il secondo retry errato può mostrare `retry later`.
    - **Bind tailnet**: esegui `openclaw gateway --bind tailnet --token "<token>"` (oppure configura autenticazione con password), apri `http://<tailscale-ip>:18789/`, poi incolla il segreto condiviso corrispondente nelle impostazioni della dashboard.
    - **Reverse proxy identity-aware**: mantieni il Gateway dietro un trusted proxy non loopback, configura `gateway.auth.mode: "trusted-proxy"`, poi apri l’URL del proxy.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`. L’autenticazione con segreto condiviso continua ad applicarsi sul tunnel; incolla il token o la password configurati se richiesto.

    Vedi [Dashboard](/it/web/dashboard) e [Superfici web](/it/web) per dettagli su modalità di bind e autenticazione.

  </Accordion>

  <Accordion title="Perché esistono due configurazioni di approvazione exec per le approvazioni in chat?">
    Controllano livelli diversi:

    - `approvals.exec`: inoltra i prompt di approvazione alle destinazioni chat
    - `channels.<channel>.execApprovals`: fa sì che quel canale agisca come client di approvazione nativo per le approvazioni exec

    La policy exec dell’host resta comunque il vero gate di approvazione. La configurazione della chat controlla solo dove compaiono i prompt di approvazione
    e come le persone possono rispondere.

    Nella maggior parte delle configurazioni **non** ti servono entrambe:

    - Se la chat supporta già comandi e risposte, `/approve` nella stessa chat funziona tramite il percorso condiviso.
    - Se un canale nativo supportato può dedurre in sicurezza gli approvatori, OpenClaw ora abilita automaticamente approvazioni native con priorità ai DM quando `channels.<channel>.execApprovals.enabled` non è impostato oppure è `"auto"`.
    - Quando sono disponibili card/pulsanti di approvazione nativi, quella UI nativa è il percorso principale; l’agente dovrebbe includere un comando manuale `/approve` solo se il risultato dello strumento dice che le approvazioni chat non sono disponibili o che l’approvazione manuale è l’unico percorso.
    - Usa `approvals.exec` solo quando i prompt devono anche essere inoltrati ad altre chat o a esplicite stanze operative.
    - Usa `channels.<channel>.execApprovals.target: "channel"` oppure `"both"` solo quando vuoi esplicitamente che i prompt di approvazione vengano pubblicati di nuovo nella stanza/topic di origine.
    - Le approvazioni dei Plugin sono ancora separate: usano per impostazione predefinita `/approve` nella stessa chat, inoltro opzionale `approvals.plugin`, e solo alcuni canali nativi mantengono sopra anche una gestione nativa delle approvazioni dei Plugin.

    Versione breve: l’inoltro serve per l’instradamento, la configurazione del client nativo serve per un’esperienza utente più ricca e specifica del canale.
    Vedi [Approvazioni Exec](/it/tools/exec-approvals).

  </Accordion>

  <Accordion title="Di quale runtime ho bisogno?">
    È richiesto Node **>= 22**. `pnpm` è consigliato. Bun **non è consigliato** per il Gateway.
  </Accordion>

  <Accordion title="Funziona su Raspberry Pi?">
    Sì. Il Gateway è leggero: la documentazione indica **512MB-1GB di RAM**, **1 core** e circa **500MB**
    di disco come sufficienti per uso personale, e nota che **Raspberry Pi 4 può eseguirlo**.

    Se vuoi più margine (log, media, altri servizi), **2GB sono consigliati**, ma non è
    un minimo rigido.

    Suggerimento: un piccolo Pi/VPS può ospitare il Gateway, e puoi associare **Node** sul tuo laptop/telefono per
    schermo/camera/canvas locali o esecuzione di comandi. Vedi [Nodes](/it/nodes).

  </Accordion>

  <Accordion title="Ci sono consigli per installazioni Raspberry Pi?">
    In breve: funziona, ma aspettati qualche asperità.

    - Usa un OS **64-bit** e mantieni Node >= 22.
    - Preferisci l’installazione **hackable (git)** così puoi vedere i log e aggiornare rapidamente.
    - Inizia senza canali/Skills, poi aggiungili uno alla volta.
    - Se incontri problemi strani con binari, di solito è un problema di **compatibilità ARM**.

    Documentazione: [Linux](/it/platforms/linux), [Install](/it/install).

  </Accordion>

  <Accordion title="Si blocca su wake up my friend / l’onboarding non si schiude. E adesso?">
    Quella schermata dipende dal fatto che il Gateway sia raggiungibile e autenticato. La TUI invia anche
    automaticamente “Wake up, my friend!” alla prima schiusa. Se vedi quella riga **senza risposta**
    e i token restano a 0, l’agente non è mai stato eseguito.

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

    3. Se continua a bloccarsi, esegui:

    ```bash
    openclaw doctor
    ```

    Se il Gateway è remoto, assicurati che il tunnel/la connessione Tailscale sia attiva e che la UI
    punti al Gateway corretto. Vedi [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrare la mia configurazione su una nuova macchina (Mac mini) senza rifare l’onboarding?">
    Sì. Copia la **directory di stato** e il **workspace**, poi esegui Doctor una volta. Questo
    mantiene il tuo bot “esattamente uguale” (memoria, cronologia delle sessioni, autenticazione e stato
    del canale) purché tu copi **entrambe** le posizioni:

    1. Installa OpenClaw sulla nuova macchina.
    2. Copia `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`) dalla vecchia macchina.
    3. Copia il tuo workspace (predefinito: `~/.openclaw/workspace`).
    4. Esegui `openclaw doctor` e riavvia il servizio Gateway.

    Questo preserva configurazione, profili di autenticazione, credenziali WhatsApp, sessioni e memoria. Se sei in
    modalità remota, ricorda che l’host gateway possiede l’archivio sessioni e il workspace.

    **Importante:** se fai solo commit/push del tuo workspace su GitHub, stai facendo
    il backup di **memoria + file bootstrap**, ma **non** della cronologia delle sessioni né dell’autenticazione. Questi vivono
    sotto `~/.openclaw/` (per esempio `~/.openclaw/agents/<agentId>/sessions/`).

    Correlati: [Migrazione](/it/install/migrating), [Dove si trovano le cose su disco](#where-things-live-on-disk),
    [Workspace dell’agente](/it/concepts/agent-workspace), [Doctor](/it/gateway/doctor),
    [Modalità remota](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove vedo cosa c’è di nuovo nell’ultima versione?">
    Controlla il changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Le voci più recenti sono in alto. Se la sezione in cima è marcata **Unreleased**, la successiva sezione datata
    è l’ultima versione rilasciata. Le voci sono raggruppate per **Highlights**, **Changes** e
    **Fixes** (più sezioni doc/altre quando necessario).

  </Accordion>

  <Accordion title="Impossibile accedere a docs.openclaw.ai (errore SSL)">
    Alcune connessioni Comcast/Xfinity bloccano erroneamente `docs.openclaw.ai` tramite Xfinity
    Advanced Security. Disattivala oppure metti `docs.openclaw.ai` in allowlist, poi riprova.
    Aiutaci a sbloccarlo segnalando qui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se comunque non riesci a raggiungere il sito, la documentazione è replicata su GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Differenza tra stable e beta">
    **Stable** e **beta** sono **dist-tag npm**, non linee di codice separate:

    - `latest` = stable
    - `beta` = build anticipata per test

    Di solito, una release stable arriva prima su **beta**, poi un passaggio esplicito
    di promozione sposta quella stessa versione su `latest`. I maintainer possono anche
    pubblicare direttamente su `latest` quando necessario. Per questo motivo beta e stable possono
    puntare alla **stessa versione** dopo la promozione.

    Vedi cosa è cambiato:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Per i one-liner di installazione e la differenza tra beta e dev, vedi l’accordion qui sotto.

  </Accordion>

  <Accordion title="Come installo la versione beta e qual è la differenza tra beta e dev?">
    **Beta** è il dist-tag npm `beta` (può coincidere con `latest` dopo la promozione).
    **Dev** è la head mobile di `main` (git); quando viene pubblicata, usa il dist-tag npm `dev`.

    One-liner (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installer Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Più dettagli: [Canali di sviluppo](/it/install/development-channels) e [Flag dell’installer](/it/install/installer).

  </Accordion>

  <Accordion title="Come provo gli ultimissimi aggiornamenti?">
    Due opzioni:

    1. **Canale dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Questo passa al branch `main` e aggiorna dal sorgente.

    2. **Installazione hackable (dal sito dell’installer):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    In questo modo ottieni un repository locale che puoi modificare, poi aggiornare via git.

    Se preferisci fare manualmente un clone pulito, usa:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentazione: [Update](/it/cli/update), [Canali di sviluppo](/it/install/development-channels),
    [Install](/it/install).

  </Accordion>

  <Accordion title="Quanto richiedono di solito installazione e onboarding?">
    Indicazione approssimativa:

    - **Installazione:** 2-5 minuti
    - **Onboarding:** 5-15 minuti a seconda di quanti canali/modelli configuri

    Se si blocca, usa [Installer bloccato](#quick-start-and-first-run-setup)
    e il ciclo rapido di debug in [Sono bloccato](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer bloccato? Come ottengo più feedback?">
    Riesegui l’installer con **output verboso**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Installazione beta con verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Per un’installazione hackable (git):

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

    Altre opzioni: [Flag dell’installer](/it/install/installer).

  </Accordion>

  <Accordion title="Su Windows l’installazione dice git not found oppure openclaw not recognized">
    Due problemi comuni su Windows:

    **1) errore npm spawn git / git not found**

    - Installa **Git for Windows** e assicurati che `git` sia nel tuo PATH.
    - Chiudi e riapri PowerShell, poi riesegui l’installer.

    **2) openclaw is not recognized dopo l’installazione**

    - La tua cartella bin globale npm non è nel PATH.
    - Controlla il percorso:

      ```powershell
      npm config get prefix
      ```

    - Aggiungi quella directory al tuo PATH utente (su Windows non serve il suffisso `\bin`; sulla maggior parte dei sistemi è `%AppData%\npm`).
    - Chiudi e riapri PowerShell dopo aver aggiornato il PATH.

    Se vuoi la configurazione Windows più fluida, usa **WSL2** invece di Windows nativo.
    Documentazione: [Windows](/it/platforms/windows).

  </Accordion>

  <Accordion title="L’output exec su Windows mostra testo cinese illeggibile: cosa devo fare?">
    Di solito è un disallineamento della code page della console nelle shell Windows native.

    Sintomi:

    - l’output di `system.run`/`exec` mostra il cinese come mojibake
    - lo stesso comando appare corretto in un altro profilo terminale

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

    Se riesci ancora a riprodurlo sull’ultima versione di OpenClaw, seguilo/segnalalo qui:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentazione non ha risposto alla mia domanda: come ottengo una risposta migliore?">
    Usa l’installazione **hackable (git)** così hai l’intero sorgente e la documentazione in locale, poi chiedi
    al tuo bot (o a Claude/Codex) _da quella cartella_ così può leggere il repository e rispondere con precisione.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Più dettagli: [Install](/it/install) e [Flag dell’installer](/it/install/installer).

  </Accordion>

  <Accordion title="Come installo OpenClaw su Linux?">
    Risposta breve: segui la guida Linux, poi esegui l’onboarding.

    - Percorso rapido Linux + installazione del servizio: [Linux](/it/platforms/linux).
    - Procedura completa: [Getting Started](/it/start/getting-started).
    - Installer + aggiornamenti: [Install & updates](/it/install/updating).

  </Accordion>

  <Accordion title="Come installo OpenClaw su un VPS?">
    Va bene qualsiasi VPS Linux. Installa sul server, poi usa SSH/Tailscale per raggiungere il Gateway.

    Guide: [exe.dev](/it/install/exe-dev), [Hetzner](/it/install/hetzner), [Fly.io](/it/install/fly).
    Accesso remoto: [Gateway remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove sono le guide di installazione cloud/VPS?">
    Manteniamo un **hub di hosting** con i provider più comuni. Scegline uno e segui la guida:

    - [Hosting VPS](/it/vps) (tutti i provider in un unico posto)
    - [Fly.io](/it/install/fly)
    - [Hetzner](/it/install/hetzner)
    - [exe.dev](/it/install/exe-dev)

    Come funziona nel cloud: il **Gateway gira sul server**, e tu vi accedi
    dal laptop/telefono tramite la Control UI (oppure Tailscale/SSH). Il tuo stato + workspace
    vivono sul server, quindi tratta l’host come fonte di verità ed esegui i backup.

    Puoi associare **Node** (Mac/iOS/Android/headless) a quel Gateway cloud per accedere a
    schermo/camera/canvas locali o eseguire comandi sul tuo laptop mantenendo però il
    Gateway nel cloud.

    Hub: [Piattaforme](/it/platforms). Accesso remoto: [Gateway remoto](/it/gateway/remote).
    Node: [Nodes](/it/nodes), [CLI Nodes](/it/cli/nodes).

  </Accordion>

  <Accordion title="Posso chiedere a OpenClaw di aggiornarsi da solo?">
    Risposta breve: **possibile, non consigliato**. Il flusso di aggiornamento può riavviare il
    Gateway (interrompendo la sessione attiva), può richiedere un checkout git pulito e
    può chiedere conferma. Più sicuro: eseguire gli aggiornamenti da shell come operatore.

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

    Documentazione: [Update](/it/cli/update), [Updating](/it/install/updating).

  </Accordion>

  <Accordion title="Cosa fa davvero l’onboarding?">
    `openclaw onboard` è il percorso di configurazione consigliato. In **modalità locale** ti guida attraverso:

    - **Configurazione modello/autenticazione** (OAuth provider, chiavi API, Anthropic setup-token, più opzioni di modello locale come LM Studio)
    - Posizione del **workspace** + file bootstrap
    - **Impostazioni del Gateway** (bind/porta/autenticazione/tailscale)
    - **Canali** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, più Plugin di canale inclusi come QQ Bot)
    - **Installazione daemon** (LaunchAgent su macOS; unit systemd utente su Linux/WSL2)
    - **Controlli di salute** e selezione delle **Skills**

    Avvisa anche se il modello configurato è sconosciuto o manca l’autenticazione.

  </Accordion>

  <Accordion title="Mi serve un abbonamento Claude o OpenAI per eseguirlo?">
    No. Puoi eseguire OpenClaw con **chiavi API** (Anthropic/OpenAI/altri) oppure con
    **modelli solo locali** così i tuoi dati restano sul tuo dispositivo. Gli abbonamenti (Claude
    Pro/Max o OpenAI Codex) sono modi opzionali per autenticare questi provider.

    Per Anthropic in OpenClaw, la distinzione pratica è:

    - **Chiave API Anthropic**: normale fatturazione API Anthropic
    - **Autenticazione Claude CLI / abbonamento Claude in OpenClaw**: il personale Anthropic
      ci ha detto che questo uso è di nuovo consentito, e OpenClaw tratta l’uso di `claude -p`
      come approvato per questa integrazione salvo che Anthropic pubblichi una nuova
      policy

    Per host gateway di lunga durata, le chiavi API Anthropic restano comunque la configurazione
    più prevedibile. OpenAI Codex OAuth è esplicitamente supportato per strumenti esterni
    come OpenClaw.

    OpenClaw supporta anche altre opzioni hosted in stile abbonamento, tra cui
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** e
    **Z.AI / GLM Coding Plan**.

    Documentazione: [Anthropic](/it/providers/anthropic), [OpenAI](/it/providers/openai),
    [Qwen Cloud](/it/providers/qwen),
    [MiniMax](/it/providers/minimax), [Modelli GLM](/it/providers/glm),
    [Modelli locali](/it/gateway/local-models), [Models](/it/concepts/models).

  </Accordion>

  <Accordion title="Posso usare l’abbonamento Claude Max senza una chiave API?">
    Sì.

    Il personale Anthropic ci ha detto che l’uso in stile OpenClaw di Claude CLI è di nuovo consentito, quindi
    OpenClaw tratta l’autenticazione con abbonamento Claude e l’uso di `claude -p` come approvati
    per questa integrazione salvo che Anthropic pubblichi una nuova policy. Se vuoi
    la configurazione server-side più prevedibile, usa invece una chiave API Anthropic.

  </Accordion>

  <Accordion title="Supportate l’autenticazione con abbonamento Claude (Claude Pro o Max)?">
    Sì.

    Il personale Anthropic ci ha detto che questo uso è di nuovo consentito, quindi OpenClaw tratta
    il riuso di Claude CLI e l’uso di `claude -p` come approvati per questa integrazione
    salvo che Anthropic pubblichi una nuova policy.

    Anthropic setup-token è ancora disponibile come percorso token supportato di OpenClaw, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.
    Per workload di produzione o multiutente, l’autenticazione con chiave API Anthropic resta
    la scelta più sicura e prevedibile. Se vuoi altre opzioni hosted in stile abbonamento
    in OpenClaw, vedi [OpenAI](/it/providers/openai), [Qwen / Model
    Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax) e [Modelli
    GLM](/it/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Perché vedo HTTP 429 rate_limit_error da Anthropic?">
    Significa che la tua **quota/rate limit Anthropic** è esaurita per la finestra corrente. Se
    usi **Claude CLI**, aspetta che la finestra si azzeri oppure passa a un piano superiore. Se
    usi una **chiave API Anthropic**, controlla la Anthropic Console
    per utilizzo/fatturazione e aumenta i limiti se necessario.

    Se il messaggio è specificamente:
    `Extra usage is required for long context requests`, la richiesta sta cercando di usare
    la beta del contesto Anthropic da 1M (`context1m: true`). Funziona solo quando la tua
    credenziale è idonea per la fatturazione long-context (fatturazione con chiave API o il
    percorso Claude-login di OpenClaw con Extra Usage abilitato).

    Suggerimento: imposta un **modello fallback** così OpenClaw può continuare a rispondere mentre un provider è soggetto a rate limit.
    Vedi [Models](/it/cli/models), [OAuth](/it/concepts/oauth) e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/it/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock è supportato?">
    Sì. OpenClaw include un provider **Amazon Bedrock (Converse)**. Quando sono presenti marker env AWS, OpenClaw può rilevare automaticamente il catalogo Bedrock streaming/testo e unirlo come provider implicito `amazon-bedrock`; altrimenti puoi abilitare esplicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` oppure aggiungere una voce provider manuale. Vedi [Amazon Bedrock](/it/providers/bedrock) e [Provider di modelli](/it/providers/models). Se preferisci un flusso con chiave gestita, anche un proxy OpenAI-compatible davanti a Bedrock resta un’opzione valida.
  </Accordion>

  <Accordion title="Come funziona l’autenticazione Codex?">
    OpenClaw supporta **OpenAI Code (Codex)** tramite OAuth (accesso ChatGPT). Usa
    `openai-codex/gpt-5.5` per OAuth Codex tramite il runner PI predefinito. Usa
    `openai/gpt-5.4` per l’attuale accesso diretto con chiave API OpenAI. L’accesso diretto
    con chiave API a GPT-5.5 è supportato una volta che OpenAI lo abilita sulla API pubblica; oggi
    GPT-5.5 usa subscription/OAuth tramite `openai-codex/gpt-5.5` oppure esecuzioni native
    del server app Codex con `openai/gpt-5.5` e `embeddedHarness.runtime: "codex"`.
    Vedi [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).
  </Accordion>

  <Accordion title="Perché OpenClaw continua a menzionare openai-codex?">
    `openai-codex` è il provider e l’ID del profilo di autenticazione per OAuth ChatGPT/Codex.
    È anche il prefisso esplicito del modello PI per OAuth Codex:

    - `openai/gpt-5.4` = attuale percorso diretto con chiave API OpenAI in PI
    - `openai/gpt-5.5` = futuro percorso diretto con chiave API una volta che OpenAI abiliterà GPT-5.5 sulla API
    - `openai-codex/gpt-5.5` = percorso OAuth Codex in PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = percorso nativo del server app Codex
    - `openai-codex:...` = ID profilo di autenticazione, non un riferimento modello

    Se vuoi il percorso diretto di fatturazione/limiti OpenAI Platform, imposta
    `OPENAI_API_KEY`. Se vuoi l’autenticazione tramite abbonamento ChatGPT/Codex, accedi con
    `openclaw models auth login --provider openai-codex` e usa
    riferimenti modello `openai-codex/*` per le esecuzioni PI.

  </Accordion>

  <Accordion title="Perché i limiti di Codex OAuth possono differire da ChatGPT web?">
    Codex OAuth usa finestre di quota dipendenti dal piano e gestite da OpenAI. Nella pratica,
    questi limiti possono differire dall’esperienza del sito/app ChatGPT, anche quando
    entrambi sono collegati allo stesso account.

    OpenClaw può mostrare le finestre attualmente visibili di utilizzo/quota del provider in
    `openclaw models status`, ma non inventa né normalizza i diritti del web ChatGPT in accesso diretto API. Se vuoi il percorso diretto di fatturazione/limiti OpenAI Platform, usa `openai/*` con una chiave API.

  </Accordion>

  <Accordion title="Supportate l’autenticazione con abbonamento OpenAI (Codex OAuth)?">
    Sì. OpenClaw supporta pienamente **l’OAuth con abbonamento OpenAI Code (Codex)**.
    OpenAI consente esplicitamente l’uso dell’OAuth con abbonamento in strumenti/workflow esterni
    come OpenClaw. L’onboarding può eseguire il flusso OAuth per te.

    Vedi [OAuth](/it/concepts/oauth), [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).

  </Accordion>

  <Accordion title="Come configuro Gemini CLI OAuth?">
    Gemini CLI usa un **flusso di autenticazione Plugin**, non un client id o un secret in `openclaw.json`.

    Passaggi:

    1. Installa Gemini CLI localmente così `gemini` è nel `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Abilita il Plugin: `openclaw plugins enable google`
    3. Accedi: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modello predefinito dopo il login: `google-gemini-cli/gemini-3-flash-preview`
    5. Se le richieste falliscono, imposta `GOOGLE_CLOUD_PROJECT` oppure `GOOGLE_CLOUD_PROJECT_ID` sull’host del gateway

    Questo memorizza i token OAuth nei profili di autenticazione sull’host del gateway. Dettagli: [Provider di modelli](/it/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modello locale va bene per chat casuali?">
    Di solito no. OpenClaw richiede contesto ampio + forte sicurezza; le schede piccole troncano e perdono dati. Se proprio devi, esegui localmente la build del modello **più grande** che riesci a usare (LM Studio) e vedi [/gateway/local-models](/it/gateway/local-models). I modelli più piccoli/quantizzati aumentano il rischio di prompt injection - vedi [Security](/it/gateway/security).
  </Accordion>

  <Accordion title="Come faccio a mantenere il traffico verso modelli hosted in una regione specifica?">
    Scegli endpoint fissati per regione. OpenRouter espone opzioni ospitate negli USA per MiniMax, Kimi e GLM; scegli la variante ospitata negli USA per mantenere i dati nella regione. Puoi comunque elencare Anthropic/OpenAI insieme a questi usando `models.mode: "merge"` così i fallback restano disponibili rispettando il provider con regione che selezioni.
  </Accordion>

  <Accordion title="Devo comprare un Mac Mini per installarlo?">
    No. OpenClaw gira su macOS o Linux (Windows tramite WSL2). Un Mac mini è opzionale: alcune persone
    ne comprano uno come host sempre acceso, ma vanno bene anche un piccolo VPS, un server domestico o una macchina in classe Raspberry Pi.

    Ti serve un Mac **solo per strumenti esclusivi di macOS**. Per iMessage, usa [BlueBubbles](/it/channels/bluebubbles) (consigliato) - il server BlueBubbles gira su qualsiasi Mac, e il Gateway può girare su Linux o altrove. Se vuoi altri strumenti solo macOS, esegui il Gateway su un Mac oppure associa un Node macOS.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Nodes](/it/nodes), [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Mi serve un Mac mini per il supporto iMessage?">
    Ti serve **qualche dispositivo macOS** con accesso a Messages. Non deve essere per forza un Mac mini:
    va bene qualsiasi Mac. **Usa [BlueBubbles](/it/channels/bluebubbles)** (consigliato) per iMessage - il server BlueBubbles gira su macOS, mentre il Gateway può girare su Linux o altrove.

    Configurazioni comuni:

    - Esegui il Gateway su Linux/VPS, ed esegui il server BlueBubbles su qualsiasi Mac con accesso a Messages.
    - Esegui tutto sul Mac se vuoi la configurazione singola più semplice.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Nodes](/it/nodes),
    [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se compro un Mac mini per eseguire OpenClaw, posso collegarlo al mio MacBook Pro?">
    Sì. Il **Mac mini può eseguire il Gateway**, e il tuo MacBook Pro può collegarsi come
    **Node** (dispositivo companion). I Node non eseguono il Gateway - forniscono capacità
    aggiuntive come schermo/camera/canvas e `system.run` su quel dispositivo.

    Pattern comune:

    - Gateway sul Mac mini (sempre acceso).
    - Il MacBook Pro esegue l’app macOS o un host Node e si associa al Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` per vederlo.

    Documentazione: [Nodes](/it/nodes), [CLI Nodes](/it/cli/nodes).

  </Accordion>

  <Accordion title="Posso usare Bun?">
    Bun **non è consigliato**. Vediamo bug di runtime, soprattutto con WhatsApp e Telegram.
    Usa **Node** per gateway stabili.

    Se vuoi comunque sperimentare con Bun, fallo su un gateway non di produzione
    senza WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: cosa va messo in allowFrom?">
    `channels.telegram.allowFrom` è **l’ID utente Telegram umano del mittente** (numerico). Non è lo username del bot.

    La configurazione iniziale chiede solo ID utente numerici. Se hai già voci legacy `@username` in configurazione, `openclaw doctor --fix` può provare a risolverle.

    Più sicuro (senza bot di terze parti):

    - Invia un DM al tuo bot, poi esegui `openclaw logs --follow` e leggi `from.id`.

    Bot API ufficiale:

    - Invia un DM al tuo bot, poi chiama `https://api.telegram.org/bot<bot_token>/getUpdates` e leggi `message.from.id`.

    Terze parti (meno privato):

    - Invia un DM a `@userinfobot` oppure `@getidsbot`.

    Vedi [/channels/telegram](/it/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Più persone possono usare un numero WhatsApp con istanze OpenClaw diverse?">
    Sì, tramite **instradamento multi-agente**. Associa il **DM** WhatsApp di ogni mittente (peer `kind: "direct"`, mittente E.164 come `+15551234567`) a un diverso `agentId`, così ogni persona ha il proprio workspace e archivio sessioni. Le risposte arrivano comunque dallo **stesso account WhatsApp**, e il controllo degli accessi DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) è globale per account WhatsApp. Vedi [Instradamento multi-agente](/it/concepts/multi-agent) e [WhatsApp](/it/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso avere un agente "chat veloce" e un agente "Opus per coding"?'>
    Sì. Usa l’instradamento multi-agente: assegna a ciascun agente il proprio modello predefinito, poi associa le route in ingresso (account provider o peer specifici) a ciascun agente. La configurazione di esempio si trova in [Instradamento multi-agente](/it/concepts/multi-agent). Vedi anche [Models](/it/concepts/models) e [Configuration](/it/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew funziona su Linux?">
    Sì. Homebrew supporta Linux (Linuxbrew). Configurazione rapida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Se esegui OpenClaw tramite systemd, assicurati che il PATH del servizio includa `/home/linuxbrew/.linuxbrew/bin` (o il tuo prefisso brew) così gli strumenti installati con `brew` vengano risolti nelle shell non-login.
    Le build recenti antepongono anche comuni directory bin utente nei servizi Linux systemd (per esempio `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e rispettano `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando impostati.

  </Accordion>

  <Accordion title="Differenza tra installazione hackable git e installazione npm">
    - **Installazione hackable (git):** checkout completo del sorgente, modificabile, ideale per contributor.
      Esegui le build localmente e puoi modificare codice/documentazione.
    - **Installazione npm:** installazione globale della CLI, nessun repository, ideale per “basta eseguirlo”.
      Gli aggiornamenti arrivano dai dist-tag npm.

    Documentazione: [Getting started](/it/start/getting-started), [Updating](/it/install/updating).

  </Accordion>

  <Accordion title="Posso passare più tardi tra installazioni npm e git?">
    Sì. Installa l’altra variante, poi esegui Doctor così il servizio gateway punti al nuovo entrypoint.
    Questo **non elimina i tuoi dati** - cambia solo l’installazione del codice OpenClaw. Il tuo stato
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

    Doctor rileva una mancata corrispondenza nell’entrypoint del servizio gateway e propone di riscrivere la configurazione del servizio per allinearla all’installazione corrente (usa `--repair` in automazione).

    Suggerimenti di backup: vedi [Strategia di backup](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Dovrei eseguire il Gateway sul mio laptop o su un VPS?">
    Risposta breve: **se vuoi affidabilità 24/7, usa un VPS**. Se vuoi il
    minor attrito e ti va bene sospensione/riavvii, eseguilo in locale.

    **Laptop (Gateway locale)**

    - **Pro:** nessun costo server, accesso diretto ai file locali, finestra browser live.
    - **Contro:** sospensione/cadute di rete = disconnessioni, aggiornamenti/riavvii del sistema interrompono, deve restare acceso.

    **VPS / cloud**

    - **Pro:** sempre acceso, rete stabile, nessun problema di sospensione del laptop, più facile da mantenere in esecuzione.
    - **Contro:** spesso headless (usa screenshot), accesso ai file solo remoto, devi usare SSH per gli aggiornamenti.

    **Nota specifica di OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funzionano tutti bene da un VPS. L’unico vero compromesso è tra **browser headless** e finestra visibile. Vedi [Browser](/it/tools/browser).

    **Valore predefinito consigliato:** VPS se in passato hai avuto disconnessioni del gateway. L’esecuzione locale è ottima quando stai usando attivamente il Mac e vuoi accesso ai file locali o automazione UI con un browser visibile.

  </Accordion>

  <Accordion title="Quanto è importante eseguire OpenClaw su una macchina dedicata?">
    Non è obbligatorio, ma è **consigliato per affidabilità e isolamento**.

    - **Host dedicato (VPS/Mac mini/Pi):** sempre acceso, meno interruzioni dovute a sospensione/riavvio, permessi più puliti, più facile da mantenere operativo.
    - **Laptop/desktop condiviso:** va benissimo per test e uso attivo, ma aspettati pause quando la macchina va in sospensione o si aggiorna.

    Se vuoi il meglio di entrambi i mondi, tieni il Gateway su un host dedicato e associa il tuo laptop come **Node** per strumenti locali di schermo/camera/exec. Vedi [Nodes](/it/nodes).
    Per le indicazioni di sicurezza, leggi [Security](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i requisiti minimi VPS e l’OS consigliato?">
    OpenClaw è leggero. Per un Gateway di base + un canale chat:

    - **Minimo assoluto:** 1 vCPU, 1GB di RAM, ~500MB di disco.
    - **Consigliato:** 1-2 vCPU, 2GB di RAM o più per margine (log, media, più canali). Gli strumenti Node e l’automazione browser possono richiedere molte risorse.

    OS: usa **Ubuntu LTS** (oppure qualsiasi Debian/Ubuntu moderno). Il percorso di installazione Linux è quello meglio testato lì.

    Documentazione: [Linux](/it/platforms/linux), [Hosting VPS](/it/vps).

  </Accordion>

  <Accordion title="Posso eseguire OpenClaw in una VM e quali sono i requisiti?">
    Sì. Tratta una VM come un VPS: deve essere sempre accesa, raggiungibile e avere RAM sufficiente
    per il Gateway e per gli eventuali canali che abiliti.

    Indicazioni di base:

    - **Minimo assoluto:** 1 vCPU, 1GB di RAM.
    - **Consigliato:** 2GB di RAM o più se esegui più canali, automazione browser o strumenti media.
    - **OS:** Ubuntu LTS oppure un’altra Debian/Ubuntu moderna.

    Se usi Windows, **WSL2 è la configurazione in stile VM più semplice** e offre la migliore
    compatibilità con gli strumenti. Vedi [Windows](/it/platforms/windows), [Hosting VPS](/it/vps).
    Se esegui macOS in una VM, vedi [macOS VM](/it/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Correlati

- [FAQ](/it/help/faq) — la FAQ principale (modelli, sessioni, gateway, sicurezza, altro)
- [Panoramica installazione](/it/install)
- [Getting started](/it/start/getting-started)
- [Troubleshooting](/it/help/troubleshooting)
