---
read_when:
    - Rispondere a domande comuni su configurazione iniziale, installazione, onboarding o supporto runtime
    - Smistare i problemi segnalati dagli utenti prima di un debug più approfondito
summary: Domande frequenti su configurazione iniziale, configurazione e utilizzo di OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-21T08:24:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bd1df258baa4b289bc95ba0f7757b61c1412e230d93ebb137cb7117fbc3a2f1
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Risposte rapide più risoluzione dei problemi approfondita per configurazioni reali (sviluppo locale, VPS, multi-agente, OAuth/chiavi API, Model Failover). Per la diagnostica runtime, vedi [Risoluzione dei problemi](/it/gateway/troubleshooting). Per il riferimento completo della configurazione, vedi [Configurazione](/it/gateway/configuration).

## I primi 60 secondi se qualcosa non funziona

1. **Stato rapido (primo controllo)**

   ```bash
   openclaw status
   ```

   Riepilogo locale rapido: sistema operativo + aggiornamento, raggiungibilità gateway/servizio, agenti/sessioni, configurazione provider + problemi runtime (quando il gateway è raggiungibile).

2. **Report condivisibile (sicuro da condividere)**

   ```bash
   openclaw status --all
   ```

   Diagnosi in sola lettura con coda dei log (token oscurati).

3. **Stato del demone + della porta**

   ```bash
   openclaw gateway status
   ```

   Mostra il runtime del supervisore rispetto alla raggiungibilità RPC, l'URL di destinazione della probe e quale configurazione probabilmente ha usato il servizio.

4. **Probe approfondite**

   ```bash
   openclaw status --deep
   ```

   Esegue una probe live dello stato del gateway, comprese le probe dei canali quando supportate
   (richiede un gateway raggiungibile). Vedi [Health](/it/gateway/health).

5. **Segui l'ultimo log**

   ```bash
   openclaw logs --follow
   ```

   Se l'RPC non è disponibile, ripiega su:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   I log su file sono separati dai log del servizio; vedi [Logging](/it/logging) e [Risoluzione dei problemi](/it/gateway/troubleshooting).

6. **Esegui Doctor (riparazioni)**

   ```bash
   openclaw doctor
   ```

   Ripara/migra configurazione e stato + esegue controlli di stato. Vedi [Doctor](/it/gateway/doctor).

7. **Snapshot del gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Chiede al gateway in esecuzione uno snapshot completo (solo WS). Vedi [Health](/it/gateway/health).

## Avvio rapido e configurazione iniziale

<AccordionGroup>
  <Accordion title="Sono bloccato, il modo più veloce per sbloccarmi">
    Usa un agente AI locale che possa **vedere la tua macchina**. È molto più efficace che chiedere
    su Discord, perché la maggior parte dei casi di “sono bloccato” sono **problemi locali di configurazione o ambiente**
    che gli aiutanti remoti non possono ispezionare.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Questi strumenti possono leggere il repository, eseguire comandi, ispezionare i log e aiutarti a correggere la configurazione
    a livello macchina (PATH, servizi, permessi, file di autenticazione). Fornisci loro il **checkout completo del sorgente** tramite
    l'installazione hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Questo installa OpenClaw **da un checkout git**, così l'agente può leggere codice + documentazione e
    ragionare sulla versione esatta che stai eseguendo. Puoi sempre tornare alla versione stabile più tardi
    rieseguendo l'installer senza `--install-method git`.

    Suggerimento: chiedi all'agente di **pianificare e supervisionare** la correzione (passo dopo passo), poi esegui solo i
    comandi necessari. Così le modifiche restano piccole e più facili da verificare.

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

    - `openclaw status`: snapshot rapido dello stato di gateway/agente + configurazione di base.
    - `openclaw models status`: controlla l'autenticazione del provider + la disponibilità del modello.
    - `openclaw doctor`: valida e ripara i problemi comuni di configurazione/stato.

    Altri controlli CLI utili: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Ciclo rapido di debug: [I primi 60 secondi se qualcosa non funziona](#i-primi-60-secondi-se-qualcosa-non-funziona).
    Documentazione di installazione: [Installazione](/it/install), [Flag dell'installer](/it/install/installer), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continua a saltare. Cosa significano i motivi di skip?">
    Motivi comuni di skip di Heartbeat:

    - `quiet-hours`: fuori dalla finestra configurata di ore attive
    - `empty-heartbeat-file`: `HEARTBEAT.md` esiste ma contiene solo struttura vuota o solo intestazioni
    - `no-tasks-due`: la modalità task di `HEARTBEAT.md` è attiva ma nessuno degli intervalli delle attività è ancora in scadenza
    - `alerts-disabled`: tutta la visibilità di Heartbeat è disabilitata (`showOk`, `showAlerts` e `useIndicator` sono tutti disattivati)

    In modalità task, i timestamp di scadenza vengono avanzati solo dopo il completamento
    di una vera esecuzione di Heartbeat. Le esecuzioni saltate non segnano le attività come completate.

    Documentazione: [Heartbeat](/it/gateway/heartbeat), [Automazione e task](/it/automation).

  </Accordion>

  <Accordion title="Modo consigliato per installare e configurare OpenClaw">
    Il repository consiglia di eseguire dai sorgenti e usare l'onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata può anche creare automaticamente gli asset dell'interfaccia. Dopo l'onboarding, in genere esegui il Gateway sulla porta **18789**.

    Dai sorgenti (collaboratori/sviluppatori):

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

  <Accordion title="Come apro il dashboard dopo l'onboarding?">
    La procedura guidata apre il browser con un URL del dashboard pulito (senza token) subito dopo l'onboarding e stampa anche il link nel riepilogo. Tieni aperta quella scheda; se non si è avviata, copia/incolla l'URL stampato sulla stessa macchina.
  </Accordion>

  <Accordion title="Come autentico il dashboard su localhost rispetto a remoto?">
    **Localhost (stessa macchina):**

    - Apri `http://127.0.0.1:18789/`.
    - Se chiede autenticazione con segreto condiviso, incolla il token o la password configurati nelle impostazioni della Control UI.
    - Origine del token: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
    - Origine della password: `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Se non è ancora configurato alcun segreto condiviso, genera un token con `openclaw doctor --generate-gateway-token`.

    **Non su localhost:**

    - **Tailscale Serve** (consigliato): mantieni il bind su loopback, esegui `openclaw gateway --tailscale serve`, apri `https://<magicdns>/`. Se `gateway.auth.allowTailscale` è `true`, gli header di identità soddisfano l'autenticazione di Control UI/WebSocket (senza incollare un segreto condiviso, assumendo un host gateway attendibile); le API HTTP richiedono comunque l'autenticazione con segreto condiviso, a meno che tu non usi deliberatamente `none` per ingressi privati o l'autenticazione HTTP `trusted-proxy`.
      I tentativi simultanei errati di autenticazione Serve dallo stesso client vengono serializzati prima che il limitatore di autenticazioni fallite li registri, quindi il secondo tentativo errato può già mostrare `retry later`.
    - **Bind tailnet**: esegui `openclaw gateway --bind tailnet --token "<token>"` (oppure configura l'autenticazione con password), apri `http://<tailscale-ip>:18789/`, quindi incolla il segreto condiviso corrispondente nelle impostazioni del dashboard.
    - **Reverse proxy con consapevolezza dell'identità**: mantieni il Gateway dietro un trusted proxy non loopback, configura `gateway.auth.mode: "trusted-proxy"`, quindi apri l'URL del proxy.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`. L'autenticazione con segreto condiviso si applica comunque sul tunnel; incolla il token o la password configurati se richiesto.

    Vedi [Dashboard](/web/dashboard) e [Superfici web](/web) per i dettagli su modalità di bind e autenticazione.

  </Accordion>

  <Accordion title="Perché esistono due configurazioni di approvazione exec per le approvazioni in chat?">
    Controllano livelli diversi:

    - `approvals.exec`: inoltra le richieste di approvazione alle destinazioni chat
    - `channels.<channel>.execApprovals`: fa sì che quel canale agisca come client di approvazione nativo per le approvazioni exec

    Il criterio exec dell'host resta comunque il vero controllo di approvazione. La configurazione chat controlla solo dove compaiono
    le richieste di approvazione e come le persone possono rispondere.

    Nella maggior parte delle configurazioni **non** ti servono entrambe:

    - Se la chat supporta già comandi e risposte, `/approve` nella stessa chat funziona tramite il percorso condiviso.
    - Se un canale nativo supportato può dedurre in sicurezza gli approvatori, OpenClaw ora abilita automaticamente le approvazioni native DM-first quando `channels.<channel>.execApprovals.enabled` non è impostato oppure è `"auto"`.
    - Quando sono disponibili card/pulsanti di approvazione nativi, quell'interfaccia nativa è il percorso principale; l'agente dovrebbe includere un comando manuale `/approve` solo se il risultato dello strumento dice che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    - Usa `approvals.exec` solo quando le richieste devono essere inoltrate anche ad altre chat o a stanze operative esplicite.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo quando vuoi esplicitamente che le richieste di approvazione vengano pubblicate di nuovo nella room/topic di origine.
    - Le approvazioni dei Plugin sono ancora separate: usano per impostazione predefinita `/approve` nella stessa chat, l'inoltro facoltativo `approvals.plugin`, e solo alcuni canali nativi mantengono una gestione nativa delle approvazioni dei plugin sopra tutto questo.

    In breve: l'inoltro serve per l'instradamento, la configurazione del client nativo serve per un'esperienza più ricca specifica del canale.
    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>

  <Accordion title="Di quale runtime ho bisogno?">
    È richiesto Node **>= 22**. Si consiglia `pnpm`. Bun **non è consigliato** per il Gateway.
  </Accordion>

  <Accordion title="Funziona su Raspberry Pi?">
    Sì. Il Gateway è leggero: la documentazione indica **512MB-1GB di RAM**, **1 core** e circa **500MB**
    di disco come sufficienti per uso personale, e nota che un **Raspberry Pi 4 può eseguirlo**.

    Se vuoi più margine (log, contenuti multimediali, altri servizi), **sono consigliati 2GB**, ma
    non è un minimo rigido.

    Suggerimento: un piccolo Pi/VPS può ospitare il Gateway e puoi associare **Node** sul tuo portatile/telefono per
    schermo/fotocamera/canvas locali o esecuzione di comandi. Vedi [Node](/it/nodes).

  </Accordion>

  <Accordion title="Ci sono suggerimenti per installazioni su Raspberry Pi?">
    In breve: funziona, ma aspettati qualche spigolosità.

    - Usa un sistema operativo **64 bit** e mantieni Node >= 22.
    - Preferisci l'installazione **hackable (git)** così puoi vedere i log e aggiornare rapidamente.
    - Parti senza canali/Skills, poi aggiungili uno alla volta.
    - Se incontri strani problemi con i binari, di solito è un problema di **compatibilità ARM**.

    Documentazione: [Linux](/it/platforms/linux), [Installazione](/it/install).

  </Accordion>

  <Accordion title="È bloccato su wake up my friend / l'onboarding non si avvia. E adesso?">
    Quella schermata dipende dal fatto che il Gateway sia raggiungibile e autenticato. Anche la TUI invia
    automaticamente "Wake up, my friend!" al primo avvio. Se vedi quella riga senza **nessuna risposta**
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

    3. Se continua a bloccarsi, esegui:

    ```bash
    openclaw doctor
    ```

    Se il Gateway è remoto, assicurati che il tunnel/la connessione Tailscale sia attiva e che l'interfaccia
    punti al Gateway corretto. Vedi [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrare la mia configurazione su una nuova macchina (Mac mini) senza rifare l'onboarding?">
    Sì. Copia la **directory di stato** e il **workspace**, poi esegui Doctor una volta. Questo
    mantiene il bot “esattamente uguale” (memory, cronologia delle sessioni, autenticazione e
    stato dei canali) purché tu copi **entrambe** le posizioni:

    1. Installa OpenClaw sulla nuova macchina.
    2. Copia `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`) dalla vecchia macchina.
    3. Copia il tuo workspace (predefinito: `~/.openclaw/workspace`).
    4. Esegui `openclaw doctor` e riavvia il servizio Gateway.

    Questo conserva configurazione, profili di autenticazione, credenziali WhatsApp, sessioni e memory. Se sei in
    modalità remota, ricorda che l'host del gateway possiede l'archivio delle sessioni e il workspace.

    **Importante:** se fai solo commit/push del tuo workspace su GitHub, stai facendo
    il backup di **memory + file bootstrap**, ma **non** della cronologia delle sessioni né dell'autenticazione. Questi vivono
    sotto `~/.openclaw/` (per esempio `~/.openclaw/agents/<agentId>/sessions/`).

    Correlati: [Migrazione](/it/install/migrating), [Dove si trova tutto su disco](#dove-si-trova-tutto-su-disco),
    [Workspace dell'agente](/it/concepts/agent-workspace), [Doctor](/it/gateway/doctor),
    [Modalità remota](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove posso vedere cosa c'è di nuovo nell'ultima versione?">
    Controlla il changelog su GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Le voci più recenti sono in cima. Se la sezione superiore è contrassegnata come **Unreleased**, la sezione datata successiva
    è l'ultima versione distribuita. Le voci sono raggruppate per **Highlights**, **Changes** e
    **Fixes** (più sezioni docs/altre quando necessario).

  </Accordion>

  <Accordion title="Impossibile accedere a docs.openclaw.ai (errore SSL)">
    Alcune connessioni Comcast/Xfinity bloccano erroneamente `docs.openclaw.ai` tramite Xfinity
    Advanced Security. Disattivalo oppure aggiungi `docs.openclaw.ai` all'allowlist, poi riprova.
    Aiutaci a sbloccarlo segnalando qui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se continui a non riuscire a raggiungere il sito, la documentazione è mirrorata su GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Differenza tra stable e beta">
    **Stable** e **beta** sono **npm dist-tag**, non linee di codice separate:

    - `latest` = stable
    - `beta` = build anticipata per i test

    Di solito, una release stable arriva prima su **beta**, poi un passaggio esplicito
    di promozione sposta quella stessa versione su `latest`. I maintainer possono anche
    pubblicare direttamente su `latest` quando necessario. Ecco perché beta e stable possono
    puntare alla **stessa versione** dopo la promozione.

    Guarda cosa è cambiato:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Per i one-liner di installazione e la differenza tra beta e dev, vedi l'accordion qui sotto.

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

    Installer per Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Più dettagli: [Canali di sviluppo](/it/install/development-channels) e [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="Come provo gli ultimissimi aggiornamenti?">
    Due opzioni:

    1. **Canale dev (checkout git):**

    ```bash
    openclaw update --channel dev
    ```

    Questo passa al branch `main` e aggiorna dai sorgenti.

    2. **Installazione hackable (dal sito dell'installer):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Così ottieni un repository locale che puoi modificare, poi aggiornare tramite git.

    Se preferisci fare manualmente un clone pulito, usa:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentazione: [Aggiornamento](/cli/update), [Canali di sviluppo](/it/install/development-channels),
    [Installazione](/it/install).

  </Accordion>

  <Accordion title="Quanto tempo richiedono di solito installazione e onboarding?">
    Indicativamente:

    - **Installazione:** 2-5 minuti
    - **Onboarding:** 5-15 minuti a seconda di quanti canali/modelli configuri

    Se si blocca, usa [Installer bloccato](#avvio-rapido-e-configurazione-iniziale)
    e il ciclo rapido di debug in [Sono bloccato](#avvio-rapido-e-configurazione-iniziale).

  </Accordion>

  <Accordion title="Installer bloccato? Come ottengo più feedback?">
    Riesegui l'installer con **output verbose**:

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
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Più opzioni: [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="Su Windows l'installazione dice git not found oppure openclaw not recognized">
    Due problemi comuni su Windows:

    **1) errore npm spawn git / git not found**

    - Installa **Git for Windows** e assicurati che `git` sia nel tuo PATH.
    - Chiudi e riapri PowerShell, poi riesegui l'installer.

    **2) openclaw is not recognized dopo l'installazione**

    - La cartella npm global bin non è nel PATH.
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
    Di solito si tratta di un disallineamento della code page della console nelle shell Windows native.

    Sintomi:

    - L'output di `system.run`/`exec` mostra il cinese come mojibake
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

    Se riesci ancora a riprodurlo nell'ultima versione di OpenClaw, tieni traccia/segnalalo in:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentazione non ha risposto alla mia domanda: come ottengo una risposta migliore?">
    Usa l'installazione **hackable (git)** così hai sorgenti e documentazione completi in locale, poi chiedi
    al tuo bot (o a Claude/Codex) _da quella cartella_ in modo che possa leggere il repository e rispondere con precisione.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Più dettagli: [Installazione](/it/install) e [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="Come installo OpenClaw su Linux?">
    Risposta breve: segui la guida Linux, poi esegui l'onboarding.

    - Percorso rapido Linux + installazione del servizio: [Linux](/it/platforms/linux).
    - Guida completa: [Per iniziare](/it/start/getting-started).
    - Installer + aggiornamenti: [Installazione e aggiornamenti](/it/install/updating).

  </Accordion>

  <Accordion title="Come installo OpenClaw su un VPS?">
    Qualsiasi VPS Linux va bene. Installa sul server, poi usa SSH/Tailscale per raggiungere il Gateway.

    Guide: [exe.dev](/it/install/exe-dev), [Hetzner](/it/install/hetzner), [Fly.io](/it/install/fly).
    Accesso remoto: [Gateway remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove sono le guide di installazione cloud/VPS?">
    Manteniamo un **hub di hosting** con i provider più comuni. Scegline uno e segui la guida:

    - [Hosting VPS](/it/vps) (tutti i provider in un unico posto)
    - [Fly.io](/it/install/fly)
    - [Hetzner](/it/install/hetzner)
    - [exe.dev](/it/install/exe-dev)

    Come funziona nel cloud: il **Gateway gira sul server** e tu vi accedi
    dal portatile/telefono tramite Control UI (o Tailscale/SSH). Il tuo stato + workspace
    vivono sul server, quindi considera l'host come fonte di verità e fanne il backup.

    Puoi associare **Node** (Mac/iOS/Android/headless) a quel Gateway cloud per accedere a
    schermo/fotocamera/canvas locali o eseguire comandi sul tuo portatile mantenendo il
    Gateway nel cloud.

    Hub: [Piattaforme](/it/platforms). Accesso remoto: [Gateway remoto](/it/gateway/remote).
    Node: [Node](/it/nodes), [CLI di Node](/cli/nodes).

  </Accordion>

  <Accordion title="Posso chiedere a OpenClaw di aggiornarsi da solo?">
    Risposta breve: **possibile, non consigliato**. Il flusso di aggiornamento può riavviare il
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

    Se devi automatizzare da un agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentazione: [Aggiornamento](/cli/update), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Cosa fa davvero l'onboarding?">
    `openclaw onboard` è il percorso di configurazione consigliato. In **modalità locale** ti guida attraverso:

    - **Configurazione modello/autenticazione** (OAuth del provider, chiavi API, setup-token Anthropic, più opzioni di modelli locali come LM Studio)
    - Posizione del **workspace** + file bootstrap
    - **Impostazioni del Gateway** (bind/porta/autenticazione/tailscale)
    - **Canali** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, più plugin di canale inclusi come QQ Bot)
    - **Installazione del demone** (LaunchAgent su macOS; unità utente systemd su Linux/WSL2)
    - **Controlli di stato** e selezione delle **Skills**

    Avvisa anche se il modello configurato è sconosciuto o manca l'autenticazione.

  </Accordion>

  <Accordion title="Ho bisogno di un abbonamento Claude o OpenAI per eseguirlo?">
    No. Puoi eseguire OpenClaw con **chiavi API** (Anthropic/OpenAI/altri) oppure con
    **modelli solo locali** così i tuoi dati restano sul dispositivo. Gli abbonamenti (Claude
    Pro/Max o OpenAI Codex) sono modi facoltativi per autenticare quei provider.

    Per Anthropic in OpenClaw, la distinzione pratica è:

    - **Chiave API Anthropic**: normale fatturazione API Anthropic
    - **Autenticazione Claude CLI / abbonamento Claude in OpenClaw**: lo staff Anthropic
      ci ha detto che questo utilizzo è di nuovo consentito, e OpenClaw sta trattando l'uso di `claude -p`
      come autorizzato per questa integrazione salvo che Anthropic pubblichi una nuova
      policy

    Per host gateway di lunga durata, le chiavi API Anthropic restano comunque la configurazione
    più prevedibile. L'OAuth di OpenAI Codex è esplicitamente supportato per strumenti esterni
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
    OpenClaw considera l'autenticazione tramite abbonamento Claude e l'uso di `claude -p` come autorizzati
    per questa integrazione, salvo che Anthropic pubblichi una nuova policy. Se vuoi
    la configurazione lato server più prevedibile, usa invece una chiave API Anthropic.

  </Accordion>

  <Accordion title="Supportate l'autenticazione tramite abbonamento Claude (Claude Pro o Max)?">
    Sì.

    Lo staff Anthropic ci ha detto che questo utilizzo è di nuovo consentito, quindi OpenClaw considera
    il riuso di Claude CLI e l'uso di `claude -p` come autorizzati per questa integrazione
    salvo che Anthropic pubblichi una nuova policy.

    Il setup-token Anthropic è ancora disponibile come percorso token supportato da OpenClaw, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.
    Per carichi di lavoro di produzione o multiutente, l'autenticazione con chiave API Anthropic resta
    la scelta più sicura e prevedibile. Se vuoi altre opzioni ospitate in stile abbonamento
    in OpenClaw, vedi [OpenAI](/it/providers/openai), [Qwen / Model
    Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax) e [Modelli
    GLM](/it/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Perché vedo HTTP 429 rate_limit_error da Anthropic?">
Questo significa che la tua **quota/limite di frequenza Anthropic** è esaurita per la finestra corrente. Se
usi **Claude CLI**, attendi che la finestra si resetti oppure aggiorna il tuo piano. Se
usi una **chiave API Anthropic**, controlla la console Anthropic
per uso/fatturazione e aumenta i limiti se necessario.

    Se il messaggio è specificamente:
    `Extra usage is required for long context requests`, la richiesta sta cercando di usare
    la beta del contesto 1M di Anthropic (`context1m: true`). Questo funziona solo quando la tua
    credenziale è idonea alla fatturazione long-context (fatturazione con chiave API oppure il
    percorso di login Claude di OpenClaw con Extra Usage abilitato).

    Suggerimento: imposta un **modello di fallback** così OpenClaw può continuare a rispondere mentre un provider è soggetto a rate limit.
    Vedi [Modelli](/cli/models), [OAuth](/it/concepts/oauth) e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/it/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock è supportato?">
    Sì. OpenClaw include un provider **Amazon Bedrock (Converse)** integrato. Con i marker env AWS presenti, OpenClaw può individuare automaticamente il catalogo Bedrock streaming/testo e unirlo come provider implicito `amazon-bedrock`; altrimenti puoi abilitare esplicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` oppure aggiungere una voce provider manuale. Vedi [Amazon Bedrock](/it/providers/bedrock) e [Provider di modelli](/it/providers/models). Se preferisci un flusso con chiave gestita, un proxy compatibile OpenAI davanti a Bedrock resta comunque un'opzione valida.
  </Accordion>

  <Accordion title="Come funziona l'autenticazione Codex?">
    OpenClaw supporta **OpenAI Code (Codex)** tramite OAuth (accesso ChatGPT). L'onboarding può eseguire il flusso OAuth e imposterà il modello predefinito su `openai-codex/gpt-5.4` quando appropriato. Vedi [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).
  </Accordion>

  <Accordion title="Perché ChatGPT GPT-5.4 non sblocca openai/gpt-5.4 in OpenClaw?">
    OpenClaw tratta separatamente i due percorsi:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = API diretta OpenAI Platform

    In OpenClaw, l'accesso ChatGPT/Codex è collegato al percorso `openai-codex/*`,
    non al percorso diretto `openai/*`. Se vuoi il percorso API diretto in
    OpenClaw, imposta `OPENAI_API_KEY` (o la configurazione equivalente del provider OpenAI).
    Se vuoi l'accesso ChatGPT/Codex in OpenClaw, usa `openai-codex/*`.

  </Accordion>

  <Accordion title="Perché i limiti OAuth di Codex possono differire da ChatGPT web?">
    `openai-codex/*` usa il percorso OAuth Codex e le sue finestre di quota utilizzabili sono
    gestite da OpenAI e dipendono dal piano. In pratica, questi limiti possono differire dall'esperienza
    del sito/app ChatGPT, anche quando entrambi sono legati allo stesso account.

    OpenClaw può mostrare le finestre di uso/quota del provider attualmente visibili in
    `openclaw models status`, ma non inventa né normalizza le
    autorizzazioni ChatGPT-web in accesso API diretto. Se vuoi il percorso diretto di
    fatturazione/limiti della OpenAI Platform, usa `openai/*` con una chiave API.

  </Accordion>

  <Accordion title="Supportate l'autenticazione tramite abbonamento OpenAI (Codex OAuth)?">
    Sì. OpenClaw supporta completamente **OpenAI Code (Codex) subscription OAuth**.
    OpenAI consente esplicitamente l'uso dell'OAuth in abbonamento in strumenti/workflow esterni
    come OpenClaw. L'onboarding può eseguire il flusso OAuth per te.

    Vedi [OAuth](/it/concepts/oauth), [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).

  </Accordion>

  <Accordion title="Come configuro Gemini CLI OAuth?">
    Gemini CLI usa un **flusso di autenticazione del plugin**, non un client id o un secret in `openclaw.json`.

    Passaggi:

    1. Installa Gemini CLI localmente in modo che `gemini` sia nel `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Abilita il plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modello predefinito dopo il login: `google-gemini-cli/gemini-3-flash-preview`
    5. Se le richieste falliscono, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host del gateway

    Questo memorizza i token OAuth nei profili di autenticazione sull'host del gateway. Dettagli: [Provider di modelli](/it/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modello locale va bene per chat occasionali?">
    Di solito no. OpenClaw richiede contesto ampio + forte sicurezza; le schede piccole troncano e perdono informazioni. Se proprio devi, esegui localmente la build del modello **più grande** che puoi (LM Studio) e vedi [/gateway/local-models](/it/gateway/local-models). I modelli più piccoli/quantizzati aumentano il rischio di prompt injection — vedi [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Come faccio a mantenere il traffico del modello ospitato in una regione specifica?">
    Scegli endpoint bloccati su una regione. OpenRouter espone opzioni ospitate negli Stati Uniti per MiniMax, Kimi e GLM; scegli la variante ospitata negli Stati Uniti per mantenere i dati nella regione. Puoi comunque elencare Anthropic/OpenAI insieme a questi usando `models.mode: "merge"` così i fallback restano disponibili rispettando al tempo stesso il provider regionale che selezioni.
  </Accordion>

  <Accordion title="Devo comprare un Mac Mini per installarlo?">
    No. OpenClaw gira su macOS o Linux (Windows tramite WSL2). Un Mac mini è facoltativo: alcune persone
    ne comprano uno come host sempre acceso, ma vanno bene anche un piccolo VPS, un server domestico o una macchina tipo Raspberry Pi.

    Ti serve un Mac **solo per strumenti esclusivi di macOS**. Per iMessage, usa [BlueBubbles](/it/channels/bluebubbles) (consigliato) — il server BlueBubbles gira su qualunque Mac e il Gateway può girare su Linux o altrove. Se vuoi altri strumenti solo macOS, esegui il Gateway su un Mac o associa un Node macOS.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Node](/it/nodes), [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Mi serve un Mac mini per il supporto iMessage?">
    Ti serve **un qualunque dispositivo macOS** con accesso a Messaggi. Non deve essere per forza un Mac mini:
    qualunque Mac va bene. **Usa [BlueBubbles](/it/channels/bluebubbles)** (consigliato) per iMessage: il server BlueBubbles gira su macOS, mentre il Gateway può girare su Linux o altrove.

    Configurazioni comuni:

    - Esegui il Gateway su Linux/VPS e il server BlueBubbles su un qualunque Mac con accesso a Messaggi.
    - Esegui tutto sul Mac se vuoi la configurazione più semplice a macchina singola.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Node](/it/nodes),
    [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se compro un Mac mini per eseguire OpenClaw, posso collegarlo al mio MacBook Pro?">
    Sì. Il **Mac mini può eseguire il Gateway** e il tuo MacBook Pro può collegarsi come
    **Node** (dispositivo complementare). I Node non eseguono il Gateway: forniscono
    capacità extra come schermo/fotocamera/canvas e `system.run` su quel dispositivo.

    Schema comune:

    - Gateway sul Mac mini (sempre acceso).
    - Il MacBook Pro esegue l'app macOS o un host Node e si associa al Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` per vederlo.

    Documentazione: [Node](/it/nodes), [CLI di Node](/cli/nodes).

  </Accordion>

  <Accordion title="Posso usare Bun?">
    Bun **non è consigliato**. Vediamo bug runtime, soprattutto con WhatsApp e Telegram.
    Usa **Node** per gateway stabili.

    Se vuoi comunque sperimentare con Bun, fallo su un gateway non di produzione
    senza WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: cosa va inserito in allowFrom?">
    `channels.telegram.allowFrom` è **l'ID utente Telegram umano del mittente** (numerico). Non è il nome utente del bot.

    La configurazione chiede solo ID utente numerici. Se hai già voci legacy `@username` nella configurazione, `openclaw doctor --fix` può provare a risolverle.

    Più sicuro (senza bot di terze parti):

    - Invia un DM al tuo bot, poi esegui `openclaw logs --follow` e leggi `from.id`.

    API ufficiale Bot:

    - Invia un DM al tuo bot, poi chiama `https://api.telegram.org/bot<bot_token>/getUpdates` e leggi `message.from.id`.

    Terze parti (meno privato):

    - Invia un DM a `@userinfobot` o `@getidsbot`.

    Vedi [/channels/telegram](/it/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Più persone possono usare un numero WhatsApp con istanze OpenClaw diverse?">
    Sì, tramite **instradamento multi-agente**. Associa il **DM** WhatsApp di ogni mittente (peer `kind: "direct"`, E.164 del mittente come `+15551234567`) a un `agentId` diverso, così ogni persona ottiene il proprio workspace e archivio sessioni. Le risposte arrivano comunque dallo **stesso account WhatsApp** e il controllo di accesso DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) è globale per account WhatsApp. Vedi [Instradamento multi-agente](/it/concepts/multi-agent) e [WhatsApp](/it/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso eseguire un agente "chat veloce" e un agente "Opus per coding"?'>
    Sì. Usa l'instradamento multi-agente: assegna a ogni agente il proprio modello predefinito, poi associa le route in ingresso (account provider o peer specifici) a ciascun agente. Un esempio di configurazione si trova in [Instradamento multi-agente](/it/concepts/multi-agent). Vedi anche [Modelli](/it/concepts/models) e [Configurazione](/it/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew funziona su Linux?">
    Sì. Homebrew supporta Linux (Linuxbrew). Configurazione rapida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Se esegui OpenClaw tramite systemd, assicurati che il PATH del servizio includa `/home/linuxbrew/.linuxbrew/bin` (o il tuo prefisso brew) così gli strumenti installati con `brew` vengano risolti nelle shell non di login.
    Le build recenti antepongono anche comuni directory bin utente nei servizi Linux systemd (per esempio `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e rispettano `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando impostati.

  </Accordion>

  <Accordion title="Differenza tra installazione git hackable e npm install">
    - **Installazione hackable (git):** checkout completo dei sorgenti, modificabile, ideale per i collaboratori.
      Esegui le build in locale e puoi correggere codice/documentazione.
    - **npm install:** installazione globale della CLI, senza repository, ideale per “basta eseguirlo”.
      Gli aggiornamenti arrivano dai dist-tag npm.

    Documentazione: [Per iniziare](/it/start/getting-started), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Posso passare in seguito tra installazioni npm e git?">
    Sì. Installa l'altra variante, poi esegui Doctor in modo che il servizio gateway punti al nuovo entrypoint.
    Questo **non elimina i tuoi dati**: cambia solo l'installazione del codice OpenClaw. Il tuo stato
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

    Doctor rileva una mancata corrispondenza dell'entrypoint del servizio gateway e propone di riscrivere la configurazione del servizio per farla corrispondere all'installazione corrente (usa `--repair` nell'automazione).

    Suggerimenti per il backup: vedi [Strategia di backup](#dove-si-trova-tutto-su-disco).

  </Accordion>

  <Accordion title="Dovrei eseguire il Gateway sul mio portatile o su un VPS?">
    Risposta breve: **se vuoi affidabilità 24/7, usa un VPS**. Se vuoi il
    minimo attrito e ti va bene convivere con sospensioni/riavvii, eseguilo in locale.

    **Portatile (Gateway locale)**

    - **Pro:** nessun costo server, accesso diretto ai file locali, finestra del browser visibile.
    - **Contro:** sospensione/interruzioni di rete = disconnessioni, aggiornamenti/riavvii del sistema operativo interrompono il servizio, la macchina deve restare attiva.

    **VPS / cloud**

    - **Pro:** sempre acceso, rete stabile, nessun problema dovuto alla sospensione del portatile, più facile da mantenere in esecuzione.
    - **Contro:** spesso esecuzione headless (usa screenshot), accesso solo remoto ai file, devi usare SSH per gli aggiornamenti.

    **Nota specifica di OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funzionano tutti bene da un VPS. L'unico vero compromesso è tra **browser headless** e finestra visibile. Vedi [Browser](/it/tools/browser).

    **Scelta predefinita consigliata:** VPS se in passato hai già avuto disconnessioni del gateway. L'esecuzione locale è ottima quando stai usando attivamente il Mac e vuoi accesso ai file locali o automazione UI con un browser visibile.

  </Accordion>

  <Accordion title="Quanto è importante eseguire OpenClaw su una macchina dedicata?">
    Non è obbligatorio, ma è **consigliato per affidabilità e isolamento**.

    - **Host dedicato (VPS/Mac mini/Pi):** sempre acceso, meno interruzioni dovute a sospensione/riavvio, permessi più puliti, più facile da mantenere in esecuzione.
    - **Portatile/desktop condiviso:** va benissimo per test e uso attivo, ma aspettati pause quando la macchina va in sospensione o si aggiorna.

    Se vuoi il meglio di entrambi i mondi, tieni il Gateway su un host dedicato e associa il tuo portatile come **Node** per strumenti locali di schermo/fotocamera/exec. Vedi [Node](/it/nodes).
    Per le indicazioni sulla sicurezza, leggi [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i requisiti minimi di un VPS e il sistema operativo consigliato?">
    OpenClaw è leggero. Per un Gateway di base + un canale chat:

    - **Minimo assoluto:** 1 vCPU, 1GB di RAM, circa 500MB di disco.
    - **Consigliato:** 1-2 vCPU, 2GB di RAM o più per avere margine (log, contenuti multimediali, più canali). Gli strumenti Node e l'automazione del browser possono richiedere molte risorse.

    Sistema operativo: usa **Ubuntu LTS** (o qualunque Debian/Ubuntu moderno). Il percorso di installazione Linux è testato meglio lì.

    Documentazione: [Linux](/it/platforms/linux), [Hosting VPS](/it/vps).

  </Accordion>

  <Accordion title="Posso eseguire OpenClaw in una VM e quali sono i requisiti?">
    Sì. Tratta una VM come un VPS: deve essere sempre accesa, raggiungibile e avere abbastanza
    RAM per il Gateway e per i canali che abiliti.

    Indicazioni di base:

    - **Minimo assoluto:** 1 vCPU, 1GB di RAM.
    - **Consigliato:** 2GB di RAM o più se esegui più canali, automazione del browser o strumenti multimediali.
    - **Sistema operativo:** Ubuntu LTS o un altro Debian/Ubuntu moderno.

    Se usi Windows, **WSL2 è la configurazione in stile VM più semplice** e ha la migliore
    compatibilità con gli strumenti. Vedi [Windows](/it/platforms/windows), [Hosting VPS](/it/vps).
    Se esegui macOS in una VM, vedi [VM macOS](/it/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Cos'è OpenClaw?

<AccordionGroup>
  <Accordion title="Cos'è OpenClaw, in un paragrafo?">
    OpenClaw è un assistente AI personale che esegui sui tuoi dispositivi. Risponde sulle superfici di messaggistica che già usi (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e plugin di canale inclusi come QQ Bot) e può anche gestire voce + un Canvas live sulle piattaforme supportate. Il **Gateway** è il control plane sempre attivo; l'assistente è il prodotto.
  </Accordion>

  <Accordion title="Proposta di valore">
    OpenClaw non è “solo un wrapper di Claude”. È un **control plane local-first** che ti permette di eseguire un
    assistente capace sul **tuo hardware**, raggiungibile dalle app di chat che già usi, con
    sessioni stateful, memory e strumenti, senza cedere il controllo dei tuoi workflow a un
    SaaS ospitato.

    Punti principali:

    - **I tuoi dispositivi, i tuoi dati:** esegui il Gateway dove vuoi (Mac, Linux, VPS) e mantieni
      locale il workspace + la cronologia delle sessioni.
    - **Canali reali, non una sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ecc.,
      più voce mobile e Canvas sulle piattaforme supportate.
    - **Indipendente dal modello:** usa Anthropic, OpenAI, MiniMax, OpenRouter, ecc., con instradamento
      per agente e failover.
    - **Opzione solo locale:** esegui modelli locali così **tutti i dati possono restare sul tuo dispositivo** se vuoi.
    - **Instradamento multi-agente:** agenti separati per canale, account o attività, ciascuno con il proprio
      workspace e i propri valori predefiniti.
    - **Open source e hackable:** ispeziona, estendi e fai self-hosting senza vendor lock-in.

    Documentazione: [Gateway](/it/gateway), [Canali](/it/channels), [Multi-Agent](/it/concepts/multi-agent),
    [Memory](/it/concepts/memory).

  </Accordion>

  <Accordion title="L'ho appena configurato: cosa dovrei fare per prima cosa?">
    Buoni primi progetti:

    - Creare un sito web (WordPress, Shopify o un semplice sito statico).
    - Prototipare un'app mobile (struttura, schermate, piano API).
    - Organizzare file e cartelle (pulizia, naming, tagging).
    - Collegare Gmail e automatizzare riepiloghi o follow-up.

    Può gestire attività grandi, ma funziona meglio quando le dividi in fasi e
    usi sub-agent per il lavoro in parallelo.

  </Accordion>

  <Accordion title="Quali sono i cinque casi d'uso quotidiani principali di OpenClaw?">
    I vantaggi quotidiani di solito sono questi:

    - **Briefing personali:** riepiloghi di inbox, calendario e notizie che ti interessano.
    - **Ricerca e stesura:** ricerca rapida, riepiloghi e prime bozze per email o documenti.
    - **Promemoria e follow-up:** solleciti e checklist guidati da Cron o Heartbeat.
    - **Automazione del browser:** compilazione di moduli, raccolta di dati e ripetizione di attività web.
    - **Coordinamento tra dispositivi:** invia un'attività dal telefono, lascia che il Gateway la esegua su un server e ricevi il risultato in chat.

  </Accordion>

  <Accordion title="OpenClaw può aiutare con lead gen, outreach, annunci e blog per un SaaS?">
    Sì, per **ricerca, qualificazione e stesura**. Può analizzare siti, creare shortlist,
    riepilogare prospect e scrivere bozze di outreach o testo pubblicitario.

    Per **outreach o campagne pubblicitarie**, mantieni una persona nel loop. Evita lo spam, rispetta le leggi locali e
    le policy delle piattaforme e rivedi tutto prima dell'invio. Il modello più sicuro è lasciare che
    OpenClaw prepari la bozza e che tu approvi.

    Documentazione: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i vantaggi rispetto a Claude Code per lo sviluppo web?">
    OpenClaw è un **assistente personale** e un livello di coordinamento, non un sostituto dell'IDE. Usa
    Claude Code o Codex per il ciclo di coding diretto più veloce dentro un repository. Usa OpenClaw quando
    vuoi memory persistente, accesso tra dispositivi e orchestrazione di strumenti.

    Vantaggi:

    - **Memory persistente + workspace** tra le sessioni
    - **Accesso multipiattaforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestrazione di strumenti** (browser, file, pianificazione, hook)
    - **Gateway sempre attivo** (esecuzione su VPS, interazione da ovunque)
    - **Node** per browser/schermo/fotocamera/exec locali

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automazione

<AccordionGroup>
  <Accordion title="Come posso personalizzare Skills senza mantenere il repository sporco?">
    Usa override gestiti invece di modificare la copia nel repository. Inserisci le modifiche in `~/.openclaw/skills/<name>/SKILL.md` (oppure aggiungi una cartella tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json`). La precedenza è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → inclusi → `skills.load.extraDirs`, quindi gli override gestiti prevalgono comunque sulle Skills incluse senza toccare git. Se ti serve che la skill sia installata globalmente ma visibile solo ad alcuni agenti, mantieni la copia condivisa in `~/.openclaw/skills` e controlla la visibilità con `agents.defaults.skills` e `agents.list[].skills`. Solo le modifiche degne di upstream dovrebbero vivere nel repository ed essere inviate come PR.
  </Accordion>

  <Accordion title="Posso caricare Skills da una cartella personalizzata?">
    Sì. Aggiungi directory extra tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json` (precedenza più bassa). La precedenza predefinita è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → incluse → `skills.load.extraDirs`. `clawhub` installa per impostazione predefinita in `./skills`, che OpenClaw tratta come `<workspace>/skills` alla sessione successiva. Se la skill deve essere visibile solo a determinati agenti, abbinala a `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="Come posso usare modelli diversi per attività diverse?">
    Oggi i modelli supportati sono:

    - **Job Cron**: i job isolati possono impostare un override `model` per singolo job.
    - **Sub-agent**: instrada le attività verso agenti separati con modelli predefiniti diversi.
    - **Cambio on-demand**: usa `/model` per cambiare il modello della sessione corrente in qualsiasi momento.

    Vedi [Job Cron](/it/automation/cron-jobs), [Instradamento multi-agente](/it/concepts/multi-agent) e [Slash command](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Il bot si blocca mentre esegue lavori pesanti. Come faccio a scaricarli altrove?">
    Usa i **sub-agent** per attività lunghe o parallele. I sub-agent vengono eseguiti nella propria sessione,
    restituiscono un riepilogo e mantengono reattiva la chat principale.

    Chiedi al bot di “avviare un sub-agent per questa attività” oppure usa `/subagents`.
    Usa `/status` in chat per vedere cosa sta facendo il Gateway in questo momento (e se è occupato).

    Suggerimento sui token: sia le attività lunghe sia i sub-agent consumano token. Se il costo è un problema, imposta un
    modello più economico per i sub-agent tramite `agents.defaults.subagents.model`.

    Documentazione: [Sub-agent](/it/tools/subagents), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Come funzionano le sessioni di subagent legate ai thread su Discord?">
    Usa i binding dei thread. Puoi associare un thread Discord a un subagent o a una destinazione di sessione, così i messaggi successivi in quel thread restano su quella sessione associata.

    Flusso di base:

    - Avvia con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"` per il follow-up persistente).
    - Oppure associa manualmente con `/focus <target>`.
    - Usa `/agents` per ispezionare lo stato del binding.
    - Usa `/session idle <duration|off>` e `/session max-age <duration|off>` per controllare il disaccoppiamento automatico.
    - Usa `/unfocus` per scollegare il thread.

    Configurazione richiesta:

    - Valori predefiniti globali: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Associazione automatica all'avvio: imposta `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentazione: [Sub-agent](/it/tools/subagents), [Discord](/it/channels/discord), [Riferimento della configurazione](/it/gateway/configuration-reference), [Slash command](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagent ha finito, ma l'aggiornamento di completamento è andato nel posto sbagliato o non è mai stato pubblicato. Cosa devo controllare?">
    Controlla prima la route del richiedente risolta:

    - La consegna del subagent in modalità completamento preferisce qualsiasi thread associato o route di conversazione quando ne esiste una.
    - Se l'origine del completamento contiene solo un canale, OpenClaw ripiega sulla route memorizzata della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta può comunque riuscire.
    - Se non esiste né una route associata né una route memorizzata utilizzabile, la consegna diretta può fallire e il risultato ripiega sulla consegna in coda alla sessione invece di essere pubblicato subito in chat.
    - Target non validi o obsoleti possono comunque forzare il fallback in coda o il fallimento finale della consegna.
    - Se l'ultima risposta visibile dell'assistente figlio è esattamente il token silenzioso `NO_REPLY` / `no_reply`, oppure esattamente `ANNOUNCE_SKIP`, OpenClaw sopprime intenzionalmente l'annuncio invece di pubblicare progressi precedenti ormai obsoleti.
    - Se il figlio è andato in timeout dopo sole chiamate di strumenti, l'annuncio può comprimere tutto in un breve riepilogo di avanzamento parziale invece di riprodurre l'output grezzo degli strumenti.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Sub-agent](/it/tools/subagents), [Attività in background](/it/automation/tasks), [Strumento Session](/it/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o i promemoria non partono. Cosa devo controllare?">
    Cron viene eseguito all'interno del processo Gateway. Se il Gateway non è in esecuzione continua,
    i job pianificati non verranno eseguiti.

    Checklist:

    - Conferma che Cron sia abilitato (`cron.enabled`) e che `OPENCLAW_SKIP_CRON` non sia impostato.
    - Controlla che il Gateway sia in esecuzione 24/7 (senza sospensioni/riavvii).
    - Verifica le impostazioni del fuso orario per il job (`--tz` rispetto al fuso orario dell'host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Automazione e task](/it/automation).

  </Accordion>

  <Accordion title="Cron è partito, ma non è stato inviato nulla al canale. Perché?">
    Controlla prima la modalità di consegna:

    - `--no-deliver` / `delivery.mode: "none"` significa che non è previsto alcun invio di fallback del runner.
    - Un target di annuncio mancante o non valido (`channel` / `to`) significa che il runner ha saltato la consegna in uscita.
    - Errori di autenticazione del canale (`unauthorized`, `Forbidden`) significano che il runner ha provato a consegnare ma le credenziali lo hanno bloccato.
    - Un risultato isolato silenzioso (`NO_REPLY` / `no_reply` soltanto) viene trattato come intenzionalmente non consegnabile, quindi il runner sopprime anche la consegna di fallback in coda.

    Per i job Cron isolati, l'agente può comunque inviare direttamente con lo strumento `message`
    quando è disponibile una route di chat. `--announce` controlla solo il percorso
    di fallback del runner per il testo finale che l'agente non ha già inviato.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Perché un'esecuzione Cron isolata ha cambiato modello o ritentato una volta?">
    Di solito è il percorso live di cambio modello, non una pianificazione duplicata.

    Cron isolato può mantenere un passaggio di modello runtime e ritentare quando l'esecuzione attiva
    genera `LiveSessionModelSwitchError`. Il nuovo tentativo mantiene il provider/modello
    cambiato e, se il cambio includeva un nuovo override del profilo di autenticazione, Cron
    lo mantiene anch'esso prima di ritentare.

    Regole di selezione correlate:

    - L'override del modello dell'hook Gmail vince per primo quando applicabile.
    - Poi `model` per job.
    - Poi qualunque override del modello memorizzato della sessione Cron.
    - Poi la normale selezione del modello agente/predefinito.

    Il ciclo di tentativi è limitato. Dopo il tentativo iniziale più 2 retry di cambio,
    Cron interrompe invece di entrare in un loop infinito.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Job Cron](/it/automation/cron-jobs), [CLI di Cron](/cli/cron).

  </Accordion>

  <Accordion title="Come installo Skills su Linux?">
    Usa i comandi nativi `openclaw skills` oppure inserisci le Skills nel tuo workspace. L'interfaccia Skills di macOS non è disponibile su Linux.
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

    L'installazione nativa `openclaw skills install` scrive nella directory `skills/`
    del workspace attivo. Installa la CLI separata `clawhub` solo se vuoi pubblicare o
    sincronizzare le tue Skills. Per installazioni condivise tra agenti, inserisci la skill sotto
    `~/.openclaw/skills` e usa `agents.defaults.skills` oppure
    `agents.list[].skills` se vuoi restringere gli agenti che possono vederla.

  </Accordion>

  <Accordion title="OpenClaw può eseguire attività a intervalli programmati o continuamente in background?">
    Sì. Usa lo scheduler del Gateway:

    - **Job Cron** per attività pianificate o ricorrenti (persistono tra i riavvii).
    - **Heartbeat** per controlli periodici della “sessione principale”.
    - **Job isolati** per agenti autonomi che pubblicano riepiloghi o consegnano alle chat.

    Documentazione: [Job Cron](/it/automation/cron-jobs), [Automazione e task](/it/automation),
    [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso eseguire Skills Apple solo macOS da Linux?">
    Non direttamente. Le Skills macOS sono regolate da `metadata.openclaw.os` più i binari richiesti, e le Skills compaiono nel prompt di sistema solo quando sono idonee sull'**host Gateway**. Su Linux, le Skills solo `darwin` (come `apple-notes`, `apple-reminders`, `things-mac`) non vengono caricate a meno che tu non forzi questo controllo.

    Hai tre modelli supportati:

    **Opzione A - eseguire il Gateway su un Mac (più semplice).**
    Esegui il Gateway dove esistono i binari macOS, poi collegati da Linux in [modalità remota](#gateway-ports-already-running-and-remote-mode) o tramite Tailscale. Le Skills si caricano normalmente perché l'host Gateway è macOS.

    **Opzione B - usare un Node macOS (senza SSH).**
    Esegui il Gateway su Linux, associa un Node macOS (app menubar) e imposta **Node Run Commands** su "Always Ask" o "Always Allow" sul Mac. OpenClaw può trattare le Skills solo macOS come idonee quando i binari richiesti esistono sul Node. L'agente esegue quelle Skills tramite lo strumento `nodes`. Se scegli "Always Ask", approvare "Always Allow" nel prompt aggiunge quel comando all'allowlist.

    **Opzione C - fare da proxy ai binari macOS tramite SSH (avanzato).**
    Mantieni il Gateway su Linux, ma fai in modo che i binari CLI richiesti risolvano wrapper SSH che vengono eseguiti su un Mac. Poi fai override della skill per consentire Linux in modo che resti idonea.

    1. Crea un wrapper SSH per il binario (esempio: `memo` per Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Metti il wrapper nel `PATH` sull'host Linux (per esempio `~/bin/memo`).
    3. Fai override dei metadati della skill (workspace oppure `~/.openclaw/skills`) per consentire Linux:

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

    - **Skill / Plugin personalizzato:** soluzione migliore per un accesso API affidabile (sia Notion sia HeyGen hanno API).
    - **Automazione del browser:** funziona senza codice ma è più lenta e più fragile.

    Se vuoi mantenere il contesto per cliente (workflow da agenzia), uno schema semplice è:

    - Una pagina Notion per cliente (contesto + preferenze + lavoro attivo).
    - Chiedi all'agente di recuperare quella pagina all'inizio di una sessione.

    Se vuoi un'integrazione nativa, apri una richiesta di funzionalità o crea una skill
    che usi quelle API.

    Installa Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Le installazioni native finiscono nella directory `skills/` del workspace attivo. Per Skills condivise tra agenti, inseriscile in `~/.openclaw/skills/<name>/SKILL.md`. Se solo alcuni agenti devono vedere un'installazione condivisa, configura `agents.defaults.skills` oppure `agents.list[].skills`. Alcune Skills si aspettano binari installati tramite Homebrew; su Linux questo significa Linuxbrew (vedi la voce FAQ Homebrew Linux sopra). Vedi [Skills](/it/tools/skills), [Configurazione di Skills](/it/tools/skills-config) e [ClawHub](/it/tools/clawhub).

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

    Questo percorso può usare il browser dell'host locale o un browser Node collegato. Se il Gateway gira altrove, esegui un host Node sulla macchina del browser oppure usa invece CDP remoto.

    Limiti attuali di `existing-session` / `user`:

    - le azioni sono guidate da ref, non da selettori CSS
    - gli upload richiedono `ref` / `inputRef` e attualmente supportano un file alla volta
    - `responsebody`, esportazione PDF, intercettazione download e azioni batch richiedono ancora un browser gestito o un profilo CDP grezzo

  </Accordion>
</AccordionGroup>

## Sandboxing e memory

<AccordionGroup>
  <Accordion title="Esiste una documentazione dedicata al sandboxing?">
    Sì. Vedi [Sandboxing](/it/gateway/sandboxing). Per la configurazione specifica di Docker (Gateway completo in Docker o immagini sandbox), vedi [Docker](/it/install/docker).
  </Accordion>

  <Accordion title="Docker sembra limitato: come abilito le funzionalità complete?">
    L'immagine predefinita dà priorità alla sicurezza e viene eseguita come utente `node`, quindi non
    include pacchetti di sistema, Homebrew o browser inclusi. Per una configurazione più completa:

    - Rendi persistente `/home/node` con `OPENCLAW_HOME_VOLUME` così le cache sopravvivono.
    - Inserisci le dipendenze di sistema nell'immagine con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installa i browser Playwright tramite la CLI inclusa:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Imposta `PLAYWRIGHT_BROWSERS_PATH` e assicurati che il percorso sia persistente.

    Documentazione: [Docker](/it/install/docker), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="Posso mantenere i DM personali ma rendere i gruppi pubblici/in sandbox con un solo agente?">
    Sì, se il tuo traffico privato è costituito da **DM** e il traffico pubblico da **gruppi**.

    Usa `agents.defaults.sandbox.mode: "non-main"` così le sessioni di gruppo/canale (chiavi non principali) vengono eseguite nel backend sandbox configurato, mentre la sessione DM principale resta sull'host. Docker è il backend predefinito se non ne scegli uno. Poi limita quali strumenti sono disponibili nelle sessioni sandbox tramite `tools.sandbox.tools`.

    Guida alla configurazione + esempio: [Gruppi: DM personali + gruppi pubblici](/it/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Riferimento chiave della configurazione: [Configurazione del Gateway](/it/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Come collego una cartella host al sandbox?">
    Imposta `agents.defaults.sandbox.docker.binds` su `["host:path:mode"]` (per esempio `"/home/user/src:/src:ro"`). I bind globali + per-agente vengono uniti; i bind per-agente vengono ignorati quando `scope: "shared"`. Usa `:ro` per tutto ciò che è sensibile e ricorda che i bind aggirano le barriere del filesystem del sandbox.

    OpenClaw valida le origini dei bind sia rispetto al percorso normalizzato sia rispetto al percorso canonico risolto tramite l'antenato esistente più profondo. Questo significa che le fughe tramite parent symlink continuano a fallire in modalità fail-closed anche quando l'ultimo segmento del percorso non esiste ancora, e i controlli della root consentita continuano ad applicarsi dopo la risoluzione dei symlink.

    Vedi [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) per esempi e note di sicurezza.

  </Accordion>

  <Accordion title="Come funziona la memory?">
    La memory di OpenClaw è semplicemente costituita da file Markdown nel workspace dell'agente:

    - Note giornaliere in `memory/YYYY-MM-DD.md`
    - Note curate a lungo termine in `MEMORY.md` (solo sessioni principali/private)

    OpenClaw esegue anche un **flush silenzioso della memory prima della Compaction** per ricordare al modello
    di scrivere note persistenti prima dell'auto-Compaction. Questo avviene solo quando il workspace
    è scrivibile (i sandbox in sola lettura lo saltano). Vedi [Memory](/it/concepts/memory).

  </Accordion>

  <Accordion title="La memory continua a dimenticare le cose. Come faccio a farle restare?">
    Chiedi al bot di **scrivere il fatto nella memory**. Le note a lungo termine vanno in `MEMORY.md`,
    il contesto a breve termine va in `memory/YYYY-MM-DD.md`.

    Questa è ancora un'area che stiamo migliorando. Aiuta ricordare al modello di memorizzare ricordi;
    saprà cosa fare. Se continua a dimenticare, verifica che il Gateway stia usando lo stesso
    workspace a ogni esecuzione.

    Documentazione: [Memory](/it/concepts/memory), [Workspace dell'agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La memory persiste per sempre? Quali sono i limiti?">
    I file di memory vivono su disco e persistono finché non li elimini. Il limite è il tuo
    spazio di archiviazione, non il modello. Il **contesto di sessione** è comunque limitato dalla finestra di contesto
    del modello, quindi le conversazioni lunghe possono essere compattate o troncate. Ecco perché
    esiste la ricerca nella memory: recupera nel contesto solo le parti rilevanti.

    Documentazione: [Memory](/it/concepts/memory), [Contesto](/it/concepts/context).

  </Accordion>

  <Accordion title="La ricerca semantica nella memory richiede una chiave API OpenAI?">
    Solo se usi **embedding OpenAI**. Codex OAuth copre chat/completamenti e
    **non** concede accesso agli embedding, quindi **accedere con Codex (OAuth o
    login Codex CLI)** non aiuta per la ricerca semantica nella memory. Gli embedding OpenAI
    richiedono comunque una vera chiave API (`OPENAI_API_KEY` oppure `models.providers.openai.apiKey`).

    Se non imposti esplicitamente un provider, OpenClaw seleziona automaticamente un provider quando
    riesce a risolvere una chiave API (profili di autenticazione, `models.providers.*.apiKey` oppure variabili d'ambiente).
    Preferisce OpenAI se riesce a risolvere una chiave OpenAI, altrimenti Gemini se una chiave Gemini
    viene risolta, poi Voyage, poi Mistral. Se non è disponibile alcuna chiave remota, la ricerca nella memory
    resta disabilitata finché non la configuri. Se hai configurato ed è presente un percorso di modello locale, OpenClaw
    preferisce `local`. Ollama è supportato quando imposti esplicitamente
    `memorySearch.provider = "ollama"`.

    Se preferisci restare in locale, imposta `memorySearch.provider = "local"` (e facoltativamente
    `memorySearch.fallback = "none"`). Se vuoi embedding Gemini, imposta
    `memorySearch.provider = "gemini"` e fornisci `GEMINI_API_KEY` (oppure
    `memorySearch.remote.apiKey`). Supportiamo modelli di embedding **OpenAI, Gemini, Voyage, Mistral, Ollama o local**
    — vedi [Memory](/it/concepts/memory) per i dettagli di configurazione.

  </Accordion>
</AccordionGroup>

## Dove si trova tutto su disco

<AccordionGroup>
  <Accordion title="Tutti i dati usati con OpenClaw vengono salvati localmente?">
    No: **lo stato di OpenClaw è locale**, ma **i servizi esterni vedono comunque ciò che invii loro**.

    - **Locale per impostazione predefinita:** sessioni, file di memory, configurazione e workspace vivono sull'host Gateway
      (`~/.openclaw` + la directory del tuo workspace).
    - **Remoto per necessità:** i messaggi che invii ai provider di modelli (Anthropic/OpenAI/ecc.) vengono inviati
      alle loro API, e le piattaforme di chat (WhatsApp/Telegram/Slack/ecc.) memorizzano i dati dei messaggi sui propri
      server.
    - **Controlli tu l'impronta:** usare modelli locali mantiene i prompt sulla tua macchina, ma il traffico
      dei canali passa comunque attraverso i server del canale.

    Correlati: [Workspace dell'agente](/it/concepts/agent-workspace), [Memory](/it/concepts/memory).

  </Accordion>

  <Accordion title="Dove memorizza i suoi dati OpenClaw?">
    Tutto vive sotto `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`):

    | Percorso                                                       | Scopo                                                              |
    | -------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                            | Configurazione principale (JSON5)                                  |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                   | Importazione OAuth legacy (copiata nei profili di autenticazione al primo utilizzo) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profili di autenticazione (OAuth, chiavi API e `keyRef`/`tokenRef` facoltativi) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                             | Payload segreti facoltativi basati su file per provider `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`         | File legacy di compatibilità (voci statiche `api_key` ripulite)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                             | Stato del provider (ad es. `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                  | Stato per agente (agentDir + sessioni)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`               | Cronologia e stato delle conversazioni (per agente)                |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`  | Metadati delle sessioni (per agente)                               |

    Percorso legacy a singolo agente: `~/.openclaw/agent/*` (migrato da `openclaw doctor`).

    Il tuo **workspace** (`AGENTS.md`, file di memory, Skills, ecc.) è separato e si configura tramite `agents.defaults.workspace` (predefinito: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Dove dovrebbero trovarsi AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Questi file vivono nel **workspace dell'agente**, non in `~/.openclaw`.

    - **Workspace (per agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (oppure il fallback legacy `memory.md` quando `MEMORY.md` è assente),
      `memory/YYYY-MM-DD.md`, facoltativamente `HEARTBEAT.md`.
    - **Directory di stato (`~/.openclaw`)**: configurazione, stato di canali/provider, profili di autenticazione, sessioni, log
      e Skills condivise (`~/.openclaw/skills`).

    Il workspace predefinito è `~/.openclaw/workspace`, configurabile tramite:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se il bot “dimentica” dopo un riavvio, conferma che il Gateway stia usando lo stesso
    workspace a ogni avvio (e ricorda: la modalità remota usa il workspace dell'**host gateway**,
    non quello del tuo portatile locale).

    Suggerimento: se vuoi un comportamento o una preferenza persistente, chiedi al bot di **scriverla in
    AGENTS.md o MEMORY.md** invece di affidarti alla cronologia della chat.

    Vedi [Workspace dell'agente](/it/concepts/agent-workspace) e [Memory](/it/concepts/memory).

  </Accordion>

  <Accordion title="Strategia di backup consigliata">
    Metti il tuo **workspace dell'agente** in un repository git **privato** e fai il backup in un posto
    privato (per esempio GitHub privato). Questo cattura memory + file AGENTS/SOUL/USER
    e ti permette di ripristinare in seguito la “mente” dell'assistente.

    **Non** fare commit di nulla sotto `~/.openclaw` (credenziali, sessioni, token o payload segreti crittografati).
    Se ti serve un ripristino completo, fai il backup separatamente sia del workspace sia della directory di stato
    (vedi la domanda sulla migrazione qui sopra).

    Documentazione: [Workspace dell'agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Come disinstallo completamente OpenClaw?">
    Vedi la guida dedicata: [Disinstallazione](/it/install/uninstall).
  </Accordion>

  <Accordion title="Gli agenti possono lavorare fuori dal workspace?">
    Sì. Il workspace è la **cwd predefinita** e l'ancora della memory, non un sandbox rigido.
    I percorsi relativi vengono risolti dentro il workspace, ma i percorsi assoluti possono accedere ad altre
    posizioni dell'host a meno che il sandboxing non sia abilitato. Se ti serve isolamento, usa
    [`agents.defaults.sandbox`](/it/gateway/sandboxing) oppure impostazioni sandbox per singolo agente. Se
    vuoi che un repository sia la directory di lavoro predefinita, punta il `workspace`
    di quell'agente alla root del repository. Il repository OpenClaw è solo codice sorgente; tieni il
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

  <Accordion title="Modalità remota: dov'è l'archivio delle sessioni?">
    Lo stato delle sessioni è di proprietà dell'**host gateway**. Se sei in modalità remota, l'archivio delle sessioni che ti interessa è sulla macchina remota, non sul tuo portatile locale. Vedi [Gestione delle sessioni](/it/concepts/session).
  </Accordion>
</AccordionGroup>

## Nozioni di base sulla configurazione

<AccordionGroup>
  <Accordion title="Che formato ha la configurazione? Dov'è?">
    OpenClaw legge una configurazione facoltativa in **JSON5** da `$OPENCLAW_CONFIG_PATH` (predefinito: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se il file manca, usa valori predefiniti ragionevolmente sicuri (incluso un workspace predefinito di `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ho impostato gateway.bind: "lan" (o "tailnet") e ora non c'è nulla in ascolto / l'interfaccia dice unauthorized'>
    I bind non loopback **richiedono un percorso di autenticazione gateway valido**. In pratica questo significa:

    - autenticazione con segreto condiviso: token o password
    - `gateway.auth.mode: "trusted-proxy"` dietro un reverse proxy non loopback correttamente configurato e consapevole dell'identità

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

    - `gateway.remote.token` / `.password` di per sé **non** abilitano l'autenticazione del gateway locale.
    - I percorsi di chiamata locali possono usare `gateway.remote.*` come fallback solo quando `gateway.auth.*` non è impostato.
    - Per l'autenticazione con password, imposta invece `gateway.auth.mode: "password"` più `gateway.auth.password` (oppure `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `gateway.auth.password` è configurato esplicitamente tramite SecretRef e non viene risolto, la risoluzione fallisce in modalità fail-closed (nessun fallback remoto che mascheri il problema).
    - Le configurazioni Control UI con segreto condiviso si autenticano tramite `connect.params.auth.token` o `connect.params.auth.password` (memorizzati nelle impostazioni app/UI). Le modalità che portano identità, come Tailscale Serve o `trusted-proxy`, usano invece header della richiesta. Evita di mettere segreti condivisi negli URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, i reverse proxy loopback sullo stesso host **non** soddisfano comunque l'autenticazione trusted-proxy. Il trusted proxy deve essere una fonte non loopback configurata.

  </Accordion>

  <Accordion title="Perché ora ho bisogno di un token su localhost?">
    OpenClaw applica l'autenticazione del gateway per impostazione predefinita, incluso loopback. Nel normale percorso predefinito questo significa autenticazione con token: se non è configurato esplicitamente alcun percorso di autenticazione, all'avvio del gateway viene risolta la modalità token e ne viene generato automaticamente uno, salvandolo in `gateway.auth.token`, quindi **i client WS locali devono autenticarsi**. Questo impedisce ad altri processi locali di chiamare il Gateway.

    Se preferisci un percorso di autenticazione diverso, puoi scegliere esplicitamente la modalità password (oppure, per reverse proxy non loopback consapevoli dell'identità, `trusted-proxy`). Se **davvero** vuoi loopback aperto, imposta esplicitamente `gateway.auth.mode: "none"` nella configurazione. Doctor può generarti un token in qualsiasi momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Devo riavviare dopo aver cambiato la configurazione?">
    Il Gateway osserva la configurazione e supporta l'hot reload:

    - `gateway.reload.mode: "hybrid"` (predefinito): applica a caldo le modifiche sicure, riavvia per quelle critiche
    - Sono supportati anche `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Come faccio a disabilitare i tagline divertenti della CLI?">
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
    - `random`: tagline divertenti/stagionali a rotazione (comportamento predefinito).
    - Se non vuoi alcun banner, imposta la variabile d'ambiente `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Come abilito la ricerca web (e web fetch)?">
    `web_fetch` funziona senza una chiave API. `web_search` dipende dal provider
    selezionato:

    - I provider supportati da API come Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity e Tavily richiedono la normale configurazione della chiave API.
    - Ollama Web Search non richiede chiavi, ma usa l'host Ollama configurato e richiede `ollama signin`.
    - DuckDuckGo non richiede chiavi, ma è un'integrazione non ufficiale basata su HTML.
    - SearXNG non richiede chiavi/è self-hosted; configura `SEARXNG_BASE_URL` oppure `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Consigliato:** esegui `openclaw configure --section web` e scegli un provider.
    Alternative tramite variabili d'ambiente:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` o `MOONSHOT_API_KEY`
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
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    La configurazione specifica del provider per la ricerca web ora si trova sotto `plugins.entries.<plugin>.config.webSearch.*`.
    I percorsi provider legacy `tools.web.search.*` vengono ancora caricati temporaneamente per compatibilità, ma non dovrebbero essere usati nelle nuove configurazioni.
    La configurazione fallback di web-fetch Firecrawl si trova sotto `plugins.entries.firecrawl.config.webFetch.*`.

    Note:

    - Se usi allowlist, aggiungi `web_search`/`web_fetch`/`x_search` oppure `group:web`.
    - `web_fetch` è abilitato per impostazione predefinita (a meno che non venga disabilitato esplicitamente).
    - Se `tools.web.fetch.provider` viene omesso, OpenClaw rileva automaticamente il primo provider fallback fetch pronto dalle credenziali disponibili. Attualmente il provider incluso è Firecrawl.
    - I daemon leggono le variabili d'ambiente da `~/.openclaw/.env` (oppure dall'ambiente del servizio).

    Documentazione: [Strumenti web](/it/tools/web).

  </Accordion>

  <Accordion title="config.apply ha cancellato la mia configurazione. Come recupero e come lo evito?">
    `config.apply` sostituisce l'**intera configurazione**. Se invii un oggetto parziale, tutto il
    resto viene rimosso.

    L'attuale OpenClaw protegge da molti clobber accidentali:

    - Le scritture di configurazione possedute da OpenClaw validano l'intera configurazione risultante dopo la modifica prima di scriverla.
    - Le scritture possedute da OpenClaw non valide o distruttive vengono rifiutate e salvate come `openclaw.json.rejected.*`.
    - Se una modifica diretta rompe l'avvio o l'hot reload, il Gateway ripristina l'ultima configurazione valida e salva il file rifiutato come `openclaw.json.clobbered.*`.
    - Dopo il recupero, l'agente principale riceve un avviso all'avvio così da non riscrivere alla cieca la configurazione errata.

    Recupero:

    - Controlla `openclaw logs --follow` per `Config auto-restored from last-known-good`, `Config write rejected:` oppure `config reload restored last-known-good config`.
    - Ispeziona il file `openclaw.json.clobbered.*` o `openclaw.json.rejected.*` più recente accanto alla configurazione attiva.
    - Mantieni la configurazione attiva ripristinata se funziona, poi copia indietro solo le chiavi desiderate con `openclaw config set` oppure `config.patch`.
    - Esegui `openclaw config validate` e `openclaw doctor`.
    - Se non hai né l'ultima configurazione valida né un payload rifiutato, ripristina da backup oppure riesegui `openclaw doctor` e riconfigura canali/modelli.
    - Se non te lo aspettavi, apri un bug e includi l'ultima configurazione nota o qualunque backup.
    - Un agente locale di coding spesso riesce a ricostruire una configurazione funzionante da log o cronologia.

    Come evitarlo:

    - Usa `openclaw config set` per piccole modifiche.
    - Usa `openclaw configure` per modifiche interattive.
    - Usa prima `config.schema.lookup` quando non sei sicuro del percorso esatto o della forma del campo; restituisce un nodo di schema superficiale più riepiloghi immediati degli elementi figli per il drill-down.
    - Usa `config.patch` per modifiche RPC parziali; riserva `config.apply` solo alla sostituzione completa della configurazione.
    - Se stai usando lo strumento `gateway` riservato al proprietario da un'esecuzione agente, continuerà comunque a rifiutare scritture in `tools.exec.ask` / `tools.exec.security` (incluse le alias legacy `tools.bash.*` che vengono normalizzate negli stessi percorsi exec protetti).

    Documentazione: [Config](/cli/config), [Configure](/cli/configure), [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/it/gateway/doctor).

  </Accordion>

  <Accordion title="Come eseguo un Gateway centrale con worker specializzati su dispositivi diversi?">
    Il modello comune è **un Gateway** (per esempio Raspberry Pi) più **Node** e **agenti**:

    - **Gateway (centrale):** possiede canali (Signal/WhatsApp), instradamento e sessioni.
    - **Node (dispositivi):** Mac/iOS/Android si collegano come periferiche ed espongono strumenti locali (`system.run`, `canvas`, `camera`).
    - **Agenti (worker):** cervelli/workspace separati per ruoli specializzati (per esempio “operazioni Hetzner”, “dati personali”).
    - **Sub-agent:** avviano lavoro in background da un agente principale quando vuoi parallelismo.
    - **TUI:** si collega al Gateway e cambia agenti/sessioni.

    Documentazione: [Node](/it/nodes), [Accesso remoto](/it/gateway/remote), [Instradamento multi-agente](/it/concepts/multi-agent), [Sub-agent](/it/tools/subagents), [TUI](/web/tui).

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

    Il valore predefinito è `false` (headful). La modalità headless ha più probabilità di attivare controlli anti-bot su alcuni siti. Vedi [Browser](/it/tools/browser).

    La modalità headless usa lo **stesso motore Chromium** e funziona per la maggior parte dell'automazione (moduli, clic, scraping, login). Le differenze principali:

    - Nessuna finestra browser visibile (usa screenshot se hai bisogno di elementi visivi).
    - Alcuni siti sono più rigidi con l'automazione in modalità headless (CAPTCHA, anti-bot).
      Per esempio, X/Twitter spesso blocca le sessioni headless.

  </Accordion>

  <Accordion title="Come uso Brave per il controllo del browser?">
    Imposta `browser.executablePath` sul binario di Brave (o su qualunque browser basato su Chromium) e riavvia il Gateway.
    Vedi gli esempi completi di configurazione in [Browser](/it/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway remoti e Node

<AccordionGroup>
  <Accordion title="Come si propagano i comandi tra Telegram, il gateway e i Node?">
    I messaggi Telegram vengono gestiti dal **gateway**. Il gateway esegue l'agente e
    solo dopo chiama i Node tramite il **Gateway WebSocket** quando serve uno strumento Node:

    Telegram → Gateway → Agente → `node.*` → Node → Gateway → Telegram

    I Node non vedono il traffico in ingresso del provider; ricevono solo chiamate RPC Node.

  </Accordion>

  <Accordion title="Come può il mio agente accedere al mio computer se il Gateway è ospitato in remoto?">
    Risposta breve: **associa il tuo computer come Node**. Il Gateway gira altrove, ma può
    chiamare strumenti `node.*` (schermo, fotocamera, sistema) sulla tua macchina locale tramite il Gateway WebSocket.

    Configurazione tipica:

    1. Esegui il Gateway sull'host sempre attivo (VPS/server domestico).
    2. Metti l'host Gateway e il tuo computer sulla stessa tailnet.
    3. Assicurati che il WS del Gateway sia raggiungibile (bind tailnet o tunnel SSH).
    4. Apri localmente l'app macOS e collegati in modalità **Remote over SSH** (oppure tailnet diretta)
       così può registrarsi come Node.
    5. Approva il Node sul Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Non è richiesto alcun bridge TCP separato; i Node si collegano tramite il Gateway WebSocket.

    Promemoria di sicurezza: associare un Node macOS consente `system.run` su quella macchina. Associa
    solo dispositivi di cui ti fidi e consulta [Sicurezza](/it/gateway/security).

    Documentazione: [Node](/it/nodes), [Protocollo Gateway](/it/gateway/protocol), [Modalità remota macOS](/it/platforms/mac/remote), [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Tailscale è connesso ma non ricevo risposte. E adesso?">
    Controlla le basi:

    - Il Gateway è in esecuzione: `openclaw gateway status`
    - Stato del Gateway: `openclaw status`
    - Stato del canale: `openclaw channels status`

    Poi verifica autenticazione e instradamento:

    - Se usi Tailscale Serve, assicurati che `gateway.auth.allowTailscale` sia impostato correttamente.
    - Se ti connetti tramite tunnel SSH, conferma che il tunnel locale sia attivo e punti alla porta corretta.
    - Conferma che le tue allowlist (DM o gruppo) includano il tuo account.

    Documentazione: [Tailscale](/it/gateway/tailscale), [Accesso remoto](/it/gateway/remote), [Canali](/it/channels).

  </Accordion>

  <Accordion title="Due istanze OpenClaw possono parlare tra loro (locale + VPS)?">
    Sì. Non esiste un bridge “bot-to-bot” integrato, ma puoi collegarle in alcuni modi
    affidabili:

    **Più semplice:** usa un normale canale chat a cui entrambi i bot possono accedere (Telegram/Slack/WhatsApp).
    Fai in modo che il Bot A invii un messaggio al Bot B, poi lascia che il Bot B risponda normalmente.

    **Bridge CLI (generico):** esegui uno script che chiama l'altro Gateway con
    `openclaw agent --message ... --deliver`, puntando a una chat in cui l'altro bot
    è in ascolto. Se un bot è su un VPS remoto, punta la tua CLI a quel Gateway remoto
    tramite SSH/Tailscale (vedi [Accesso remoto](/it/gateway/remote)).

    Modello di esempio (eseguito da una macchina che può raggiungere il Gateway di destinazione):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Suggerimento: aggiungi una protezione in modo che i due bot non entrino in un loop infinito (solo menzioni, allowlist
    di canale o una regola “non rispondere ai messaggi dei bot”).

    Documentazione: [Accesso remoto](/it/gateway/remote), [CLI Agent](/cli/agent), [Invio Agent](/it/tools/agent-send).

  </Accordion>

  <Accordion title="Mi servono VPS separati per più agenti?">
    No. Un Gateway può ospitare più agenti, ciascuno con il proprio workspace, modelli predefiniti
    e instradamento. Questa è la configurazione normale ed è molto più economica e semplice che eseguire
    un VPS per agente.

    Usa VPS separati solo quando hai bisogno di isolamento rigido (confini di sicurezza) o di configurazioni
    molto diverse che non vuoi condividere. Altrimenti, mantieni un solo Gateway e
    usa più agenti o sub-agent.

  </Accordion>

  <Accordion title="C'è un vantaggio nell'usare un Node sul mio portatile personale invece di SSH da un VPS?">
    Sì: i Node sono il modo di prima classe per raggiungere il tuo portatile da un Gateway remoto e
    sbloccano più del semplice accesso shell. Il Gateway gira su macOS/Linux (Windows tramite WSL2) ed è
    leggero (vanno bene un piccolo VPS o una macchina tipo Raspberry Pi; 4 GB di RAM sono più che sufficienti), quindi una configurazione comune
    è un host sempre acceso più il tuo portatile come Node.

    - **Nessun SSH in ingresso richiesto.** I Node si collegano in uscita al Gateway WebSocket e usano l'associazione del dispositivo.
    - **Controlli di esecuzione più sicuri.** `system.run` è regolato da allowlist/approvazioni del Node su quel portatile.
    - **Più strumenti del dispositivo.** I Node espongono `canvas`, `camera` e `screen` oltre a `system.run`.
    - **Automazione del browser locale.** Tieni il Gateway su un VPS, ma esegui Chrome localmente tramite un host Node sul portatile, oppure collegati a Chrome locale sull'host tramite Chrome MCP.

    SSH va bene per accesso shell occasionale, ma i Node sono più semplici per workflow continuativi dell'agente e
    automazione del dispositivo.

    Documentazione: [Node](/it/nodes), [CLI di Node](/cli/nodes), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="I Node eseguono un servizio gateway?">
    No. Dovrebbe essere eseguito un solo **gateway** per host, a meno che tu non stia eseguendo intenzionalmente profili isolati (vedi [Gateway multipli](/it/gateway/multiple-gateways)). I Node sono periferiche che si collegano
    al gateway (Node iOS/Android, oppure “modalità Node” macOS nell'app menubar). Per host Node headless
    e controllo CLI, vedi [CLI host Node](/cli/node).

    Per modifiche a `gateway`, `discovery` e `canvasHost` è richiesto un riavvio completo.

  </Accordion>

  <Accordion title="Esiste un modo API / RPC per applicare la configurazione?">
    Sì.

    - `config.schema.lookup`: ispeziona un sottoalbero della configurazione con il relativo nodo di schema superficiale, suggerimento UI corrispondente e riepiloghi immediati degli elementi figli prima della scrittura
    - `config.get`: recupera lo snapshot corrente + hash
    - `config.patch`: aggiornamento parziale sicuro (preferito per la maggior parte delle modifiche RPC); applica hot-reload quando possibile e riavvia quando necessario
    - `config.apply`: valida + sostituisce l'intera configurazione; applica hot-reload quando possibile e riavvia quando necessario
    - Lo strumento runtime `gateway` riservato al proprietario continua comunque a rifiutare la riscrittura di `tools.exec.ask` / `tools.exec.security`; gli alias legacy `tools.bash.*` vengono normalizzati negli stessi percorsi exec protetti

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

  <Accordion title="Come configuro Tailscale su un VPS e mi collego dal mio Mac?">
    Passaggi minimi:

    1. **Installa + accedi sul VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installa + accedi sul tuo Mac**
       - Usa l'app Tailscale e accedi alla stessa tailnet.
    3. **Abilita MagicDNS (consigliato)**
       - Nella console di amministrazione Tailscale, abilita MagicDNS così il VPS avrà un nome stabile.
    4. **Usa il nome host tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se vuoi la Control UI senza SSH, usa Tailscale Serve sul VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Questo mantiene il gateway associato a loopback ed espone HTTPS tramite Tailscale. Vedi [Tailscale](/it/gateway/tailscale).

  </Accordion>

  <Accordion title="Come collego un Node Mac a un Gateway remoto (Tailscale Serve)?">
    Serve espone la **Control UI + WS del Gateway**. I Node si collegano tramite lo stesso endpoint WS del Gateway.

    Configurazione consigliata:

    1. **Assicurati che VPS + Mac siano sulla stessa tailnet**.
    2. **Usa l'app macOS in modalità remota** (la destinazione SSH può essere il nome host tailnet).
       L'app tunnelizza la porta del Gateway e si collega come Node.
    3. **Approva il Node** sul gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentazione: [Protocollo Gateway](/it/gateway/protocol), [Discovery](/it/gateway/discovery), [Modalità remota macOS](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dovrei installare su un secondo portatile o aggiungere solo un Node?">
    Se ti servono solo **strumenti locali** (screen/camera/exec) sul secondo portatile, aggiungilo come
    **Node**. Così mantieni un singolo Gateway ed eviti configurazioni duplicate. Gli strumenti Node locali sono
    attualmente solo macOS, ma prevediamo di estenderli ad altri sistemi operativi.

    Installa un secondo Gateway solo quando hai bisogno di **isolamento rigido** o di due bot completamente separati.

    Documentazione: [Node](/it/nodes), [CLI di Node](/cli/nodes), [Gateway multipli](/it/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variabili d'ambiente e caricamento .env

<AccordionGroup>
  <Accordion title="Come carica le variabili d'ambiente OpenClaw?">
    OpenClaw legge le variabili d'ambiente dal processo padre (shell, launchd/systemd, CI, ecc.) e inoltre carica:

    - `.env` dalla directory di lavoro corrente
    - un fallback globale `.env` da `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Nessun file `.env` sovrascrive le variabili d'ambiente esistenti.

    Puoi anche definire variabili d'ambiente inline nella configurazione (applicate solo se mancanti dall'env del processo):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Vedi [/environment](/it/help/environment) per la precedenza completa e le origini.

  </Accordion>

  <Accordion title="Ho avviato il Gateway tramite il servizio e le mie variabili d'ambiente sono sparite. E adesso?">
    Due soluzioni comuni:

    1. Inserisci le chiavi mancanti in `~/.openclaw/.env` così vengono raccolte anche quando il servizio non eredita l'env della tua shell.
    2. Abilita l'importazione della shell (comodità opt-in):

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

    Questo esegue la tua shell di login e importa solo le chiavi mancanti previste (senza mai sovrascrivere). Equivalenti tramite variabile d'ambiente:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ho impostato COPILOT_GITHUB_TOKEN, ma models status mostra "Shell env: off." Perché?'>
    `openclaw models status` riporta se l'**importazione dell'env della shell** è abilitata. “Shell env: off”
    **non** significa che le tue variabili d'ambiente manchino: significa solo che OpenClaw non caricherà
    automaticamente la tua shell di login.

    Se il Gateway gira come servizio (launchd/systemd), non erediterà l'ambiente
    della tua shell. Risolvi in uno di questi modi:

    1. Metti il token in `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oppure abilita l'importazione della shell (`env.shellEnv.enabled: true`).
    3. Oppure aggiungilo al blocco `env` della configurazione (si applica solo se manca).

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
  <Accordion title="Come avvio una conversazione nuova?">
    Invia `/new` oppure `/reset` come messaggio autonomo. Vedi [Gestione delle sessioni](/it/concepts/session).
  </Accordion>

  <Accordion title="Le sessioni si resettano automaticamente se non invio mai /new?">
    Le sessioni possono scadere dopo `session.idleMinutes`, ma questa funzione è **disabilitata per impostazione predefinita** (valore predefinito **0**).
    Impostalo su un valore positivo per abilitare la scadenza per inattività. Quando è abilitata, il **messaggio successivo**
    dopo il periodo di inattività avvia un nuovo ID sessione per quella chiave di chat.
    Questo non elimina le trascrizioni: avvia solo una nuova sessione.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Esiste un modo per creare una squadra di istanze OpenClaw (un CEO e molti agenti)?">
    Sì, tramite **instradamento multi-agente** e **sub-agent**. Puoi creare un agente
    coordinatore e vari agenti worker con i propri workspace e modelli.

    Detto questo, è meglio considerarlo come un **esperimento divertente**. Consuma molti token e spesso
    è meno efficiente che usare un solo bot con sessioni separate. Il modello tipico che
    immaginiamo è un solo bot con cui parli, con sessioni diverse per il lavoro parallelo. Quel
    bot può anche avviare sub-agent quando serve.

    Documentazione: [Instradamento multi-agente](/it/concepts/multi-agent), [Sub-agent](/it/tools/subagents), [CLI Agents](/cli/agents).

  </Accordion>

  <Accordion title="Perché il contesto è stato troncato a metà attività? Come posso evitarlo?">
    Il contesto della sessione è limitato dalla finestra del modello. Chat lunghe, output di strumenti grandi o molti
    file possono attivare Compaction o troncamento.

    Cosa aiuta:

    - Chiedi al bot di riepilogare lo stato corrente e scriverlo in un file.
    - Usa `/compact` prima di attività lunghe e `/new` quando cambi argomento.
    - Mantieni il contesto importante nel workspace e chiedi al bot di rileggerlo.
    - Usa sub-agent per lavoro lungo o parallelo così la chat principale resta più piccola.
    - Scegli un modello con una finestra di contesto più grande se succede spesso.

  </Accordion>

  <Accordion title="Come faccio a resettare completamente OpenClaw mantenendolo installato?">
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

    - Anche l'onboarding offre **Reset** se rileva una configurazione esistente. Vedi [Onboarding (CLI)](/it/start/wizard).
    - Se hai usato profili (`--profile` / `OPENCLAW_PROFILE`), resetta ogni directory di stato (i valori predefiniti sono `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (solo dev; cancella configurazione dev + credenziali + sessioni + workspace).

  </Accordion>

  <Accordion title='Ricevo errori "context too large": come faccio a resettare o compattare?'>
    Usa una di queste opzioni:

    - **Compatta** (mantiene la conversazione ma riassume i turni più vecchi):

      ```
      /compact
      ```

      oppure `/compact <instructions>` per guidare il riepilogo.

    - **Reset** (nuovo ID sessione per la stessa chiave di chat):

      ```
      /new
      /reset
      ```

    Se continua a succedere:

    - Abilita o regola il **pruning della sessione** (`agents.defaults.contextPruning`) per ridurre il vecchio output degli strumenti.
    - Usa un modello con una finestra di contesto più ampia.

    Documentazione: [Compaction](/it/concepts/compaction), [Pruning della sessione](/it/concepts/session-pruning), [Gestione delle sessioni](/it/concepts/session).

  </Accordion>

  <Accordion title='Perché vedo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Questo è un errore di validazione del provider: il modello ha emesso un blocco `tool_use` senza il campo
    `input` richiesto. Di solito significa che la cronologia della sessione è obsoleta o corrotta (spesso dopo thread lunghi
    o una modifica di strumento/schema).

    Correzione: avvia una nuova sessione con `/new` (messaggio autonomo).

  </Accordion>

  <Accordion title="Perché ricevo messaggi Heartbeat ogni 30 minuti?">
    Gli Heartbeat vengono eseguiti ogni **30m** per impostazione predefinita (**1h** quando si usa autenticazione OAuth). Regolali o disabilitali:

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

    Gli override per agente usano `agents.list[].heartbeat`. Documentazione: [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title='Devo aggiungere un "account bot" a un gruppo WhatsApp?'>
    No. OpenClaw gira sul **tuo account**, quindi se sei nel gruppo, OpenClaw può vederlo.
    Per impostazione predefinita, le risposte nei gruppi sono bloccate finché non consenti i mittenti (`groupPolicy: "allowlist"`).

    Se vuoi che solo **tu** possa attivare le risposte nel gruppo:

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
    Opzione 1 (più veloce): segui i log e invia un messaggio di prova nel gruppo:

    ```bash
    openclaw logs --follow --json
    ```

    Cerca `chatId` (o `from`) che termina con `@g.us`, per esempio:
    `1234567890-1234567890@g.us`.

    Opzione 2 (se già configurato/in allowlist): elenca i gruppi dalla configurazione:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentazione: [WhatsApp](/it/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Perché OpenClaw non risponde in un gruppo?">
    Due cause comuni:

    - Il controllo delle menzioni è attivo (predefinito). Devi @menzionare il bot (oppure far corrispondere `mentionPatterns`).
    - Hai configurato `channels.whatsapp.groups` senza `"*"` e il gruppo non è nell'allowlist.

    Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).

  </Accordion>

  <Accordion title="Gruppi/thread condividono il contesto con i DM?">
    Le chat dirette collassano nella sessione principale per impostazione predefinita. Gruppi/canali hanno le proprie chiavi di sessione, e i topic Telegram / thread Discord sono sessioni separate. Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).
  </Accordion>

  <Accordion title="Quanti workspace e agenti posso creare?">
    Nessun limite rigido. Decine (anche centinaia) vanno bene, ma fai attenzione a:

    - **Crescita su disco:** sessioni + trascrizioni vivono sotto `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo token:** più agenti significa più uso concorrente del modello.
    - **Overhead operativo:** profili di autenticazione per agente, workspace e instradamento dei canali.

    Suggerimenti:

    - Mantieni un workspace **attivo** per agente (`agents.defaults.workspace`).
    - Elimina le vecchie sessioni (cancella JSONL o voci di archivio) se il disco cresce troppo.
    - Usa `openclaw doctor` per individuare workspace dispersi e incongruenze nei profili.

  </Accordion>

  <Accordion title="Posso eseguire più bot o chat contemporaneamente (Slack), e come dovrei configurarlo?">
    Sì. Usa **Instradamento multi-agente** per eseguire più agenti isolati e instradare i messaggi in ingresso per
    canale/account/peer. Slack è supportato come canale e può essere associato ad agenti specifici.

    L'accesso al browser è potente ma non equivale a “fare qualunque cosa possa fare un umano”: anti-bot, CAPTCHA e MFA possono
    comunque bloccare l'automazione. Per il controllo browser più affidabile, usa Chrome MCP locale sull'host,
    oppure usa CDP sulla macchina che esegue davvero il browser.

    Configurazione best practice:

    - Host Gateway sempre acceso (VPS/Mac mini).
    - Un agente per ruolo (binding).
    - Canali Slack associati a quegli agenti.
    - Browser locale tramite Chrome MCP o un Node quando serve.

    Documentazione: [Instradamento multi-agente](/it/concepts/multi-agent), [Slack](/it/channels/slack),
    [Browser](/it/tools/browser), [Node](/it/nodes).

  </Accordion>
</AccordionGroup>

## Modelli: predefiniti, selezione, alias, cambio

<AccordionGroup>
  <Accordion title='Cos'è il "modello predefinito"?'>
    Il modello predefinito di OpenClaw è quello che imposti come:

    ```
    agents.defaults.model.primary
    ```

    I modelli vengono referenziati come `provider/model` (esempio: `openai/gpt-5.4`). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca del provider configurato per quell'esatto model id e solo dopo ripiega sul provider predefinito configurato come percorso di compatibilità deprecato. Se quel provider non espone più il modello predefinito configurato, OpenClaw ripiega sul primo provider/modello configurato invece di mostrare un provider predefinito obsoleto e rimosso. Dovresti comunque impostare **esplicitamente** `provider/model`.

  </Accordion>

  <Accordion title="Quale modello consigliate?">
    **Predefinito consigliato:** usa il miglior modello di ultima generazione disponibile nel tuo stack provider.
    **Per agenti con strumenti o input non attendibili:** dai priorità alla qualità del modello rispetto al costo.
    **Per chat di routine/a basso rischio:** usa modelli fallback più economici e instrada per ruolo dell'agente.

    MiniMax ha documentazione dedicata: [MiniMax](/it/providers/minimax) e
    [Modelli locali](/it/gateway/local-models).

    Regola empirica: usa il **miglior modello che puoi permetterti** per lavoro ad alto impatto e un modello più economico
    per chat di routine o riepiloghi. Puoi instradare i modelli per agente e usare sub-agent per
    parallelizzare attività lunghe (ogni sub-agent consuma token). Vedi [Modelli](/it/concepts/models) e
    [Sub-agent](/it/tools/subagents).

    Forte avvertenza: i modelli più deboli o eccessivamente quantizzati sono più vulnerabili a prompt
    injection e comportamenti non sicuri. Vedi [Sicurezza](/it/gateway/security).

    Più contesto: [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Come cambio modello senza cancellare la configurazione?">
    Usa i **comandi del modello** oppure modifica solo i campi del **modello**. Evita sostituzioni complete della configurazione.

    Opzioni sicure:

    - `/model` in chat (rapido, per sessione)
    - `openclaw models set ...` (aggiorna solo la configurazione del modello)
    - `openclaw configure --section model` (interattivo)
    - modifica `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Evita `config.apply` con un oggetto parziale a meno che tu non voglia davvero sostituire l'intera configurazione.
    Per modifiche RPC, ispeziona prima con `config.schema.lookup` e preferisci `config.patch`. Il payload di lookup ti fornisce il percorso normalizzato, documentazione/vincoli dello schema superficiale e riepiloghi immediati degli elementi figli
    per aggiornamenti parziali.
    Se hai sovrascritto la configurazione, ripristina da backup oppure riesegui `openclaw doctor` per ripararla.

    Documentazione: [Modelli](/it/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/it/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usare modelli self-hosted (llama.cpp, vLLM, Ollama)?">
    Sì. Ollama è il percorso più semplice per i modelli locali.

    Configurazione più rapida:

    1. Installa Ollama da `https://ollama.com/download`
    2. Scarica un modello locale, per esempio `ollama pull gemma4`
    3. Se vuoi anche modelli cloud, esegui `ollama signin`
    4. Esegui `openclaw onboard` e scegli `Ollama`
    5. Scegli `Local` oppure `Cloud + Local`

    Note:

    - `Cloud + Local` ti offre modelli cloud più i tuoi modelli Ollama locali
    - i modelli cloud come `kimi-k2.5:cloud` non richiedono un pull locale
    - per il cambio manuale, usa `openclaw models list` e `openclaw models set ollama/<model>`

    Nota di sicurezza: i modelli più piccoli o fortemente quantizzati sono più vulnerabili alla prompt
    injection. Consigliamo fortemente **modelli grandi** per qualunque bot che possa usare strumenti.
    Se vuoi comunque modelli piccoli, abilita il sandboxing e allowlist rigorose degli strumenti.

    Documentazione: [Ollama](/it/providers/ollama), [Modelli locali](/it/gateway/local-models),
    [Provider di modelli](/it/concepts/model-providers), [Sicurezza](/it/gateway/security),
    [Sandboxing](/it/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quali modelli usano OpenClaw, Flawd e Krill?">
    - Queste distribuzioni possono differire e cambiare nel tempo; non esiste una raccomandazione fissa sul provider.
    - Controlla l'impostazione runtime corrente su ogni gateway con `openclaw models status`.
    - Per agenti sensibili alla sicurezza o con strumenti abilitati, usa il miglior modello di ultima generazione disponibile.
  </Accordion>

  <Accordion title="Come faccio a cambiare modello al volo (senza riavviare)?">
    Usa il comando `/model` come messaggio autonomo:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Questi sono gli alias integrati. Gli alias personalizzati possono essere aggiunti tramite `agents.defaults.models`.

    Puoi elencare i modelli disponibili con `/model`, `/model list` oppure `/model status`.

    `/model` (e `/model list`) mostra un selettore compatto numerato. Seleziona per numero:

    ```
    /model 3
    ```

    Puoi anche forzare un profilo di autenticazione specifico per il provider (per sessione):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Suggerimento: `/model status` mostra quale agente è attivo, quale file `auth-profiles.json` viene usato e quale profilo di autenticazione verrà provato dopo.
    Mostra anche l'endpoint del provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

    **Come faccio a rimuovere il pin di un profilo impostato con @profile?**

    Riesegui `/model` **senza** il suffisso `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se vuoi tornare al predefinito, selezionalo da `/model` (oppure invia `/model <default provider/model>`).
    Usa `/model status` per confermare quale profilo di autenticazione è attivo.

  </Accordion>

  <Accordion title="Posso usare GPT 5.2 per le attività quotidiane e Codex 5.3 per il coding?">
    Sì. Impostane uno come predefinito e cambia secondo necessità:

    - **Cambio rapido (per sessione):** `/model gpt-5.4` per le attività quotidiane, `/model openai-codex/gpt-5.4` per il coding con Codex OAuth.
    - **Predefinito + cambio:** imposta `agents.defaults.model.primary` su `openai/gpt-5.4`, poi passa a `openai-codex/gpt-5.4` quando fai coding (o viceversa).
    - **Sub-agent:** instrada le attività di coding a sub-agent con un modello predefinito diverso.

    Vedi [Modelli](/it/concepts/models) e [Slash command](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come configuro la modalità fast per GPT 5.4?">
    Usa un toggle di sessione oppure un valore predefinito nella configurazione:

    - **Per sessione:** invia `/fast on` mentre la sessione usa `openai/gpt-5.4` oppure `openai-codex/gpt-5.4`.
    - **Predefinito per modello:** imposta `agents.defaults.models["openai/gpt-5.4"].params.fastMode` su `true`.
    - **Anche Codex OAuth:** se usi anche `openai-codex/gpt-5.4`, imposta lo stesso flag anche lì.

    Esempio:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Per OpenAI, la modalità fast corrisponde a `service_tier = "priority"` nelle richieste native Responses supportate. Gli override di sessione `/fast` prevalgono sui valori predefiniti della configurazione.

    Vedi [Thinking e modalità fast](/it/tools/thinking) e [Modalità fast OpenAI](/it/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Perché vedo "Model ... is not allowed" e poi nessuna risposta?'>
    Se `agents.defaults.models` è impostato, diventa l'**allowlist** per `/model` e per qualunque
    override di sessione. Scegliere un modello che non è in quella lista restituisce:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Questo errore viene restituito **al posto** di una risposta normale. Correzione: aggiungi il modello a
    `agents.defaults.models`, rimuovi l'allowlist oppure scegli un modello da `/model list`.

  </Accordion>

  <Accordion title='Perché vedo "Unknown model: minimax/MiniMax-M2.7"?'>
    Questo significa che il **provider non è configurato** (non è stata trovata alcuna configurazione provider MiniMax o
    alcun profilo di autenticazione), quindi il modello non può essere risolto.

    Checklist di correzione:

    1. Aggiorna a una release corrente di OpenClaw (oppure esegui dai sorgenti `main`), poi riavvia il gateway.
    2. Assicurati che MiniMax sia configurato (procedura guidata o JSON), oppure che l'autenticazione MiniMax
       esista in env/profili di autenticazione così il provider corrispondente possa essere iniettato
       (`MINIMAX_API_KEY` per `minimax`, `MINIMAX_OAUTH_TOKEN` oppure OAuth MiniMax
       memorizzato per `minimax-portal`).
    3. Usa l'id modello esatto (case-sensitive) per il tuo percorso di autenticazione:
       `minimax/MiniMax-M2.7` oppure `minimax/MiniMax-M2.7-highspeed` per configurazione
       con chiave API, oppure `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` per configurazione OAuth.
    4. Esegui:

       ```bash
       openclaw models list
       ```

       e scegli dall'elenco (oppure `/model list` in chat).

    Vedi [MiniMax](/it/providers/minimax) e [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Posso usare MiniMax come predefinito e OpenAI per attività complesse?">
    Sì. Usa **MiniMax come predefinito** e cambia modello **per sessione** quando serve.
    I fallback servono per gli **errori**, non per le “attività difficili”, quindi usa `/model` o un agente separato.

    **Opzione A: cambio per sessione**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Poi:

    ```
    /model gpt
    ```

    **Opzione B: agenti separati**

    - Agente A predefinito: MiniMax
    - Agente B predefinito: OpenAI
    - Instrada per agente oppure usa `/agent` per cambiare

    Documentazione: [Modelli](/it/concepts/models), [Instradamento multi-agente](/it/concepts/multi-agent), [MiniMax](/it/providers/minimax), [OpenAI](/it/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt sono scorciatoie integrate?">
    Sì. OpenClaw include alcune abbreviazioni predefinite (applicate solo quando il modello esiste in `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Se imposti un tuo alias con lo stesso nome, il tuo valore prevale.

  </Accordion>

  <Accordion title="Come definisco/faccio override delle scorciatoie del modello (alias)?">
    Gli alias provengono da `agents.defaults.models.<modelId>.alias`. Esempio:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Poi `/model sonnet` (oppure `/<alias>` quando supportato) viene risolto in quell'ID modello.

  </Accordion>

  <Accordion title="Come aggiungo modelli da altri provider come OpenRouter o Z.AI?">
    OpenRouter (pagamento a token; molti modelli):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modelli GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Se fai riferimento a un provider/modello ma manca la chiave del provider richiesta, riceverai un errore di autenticazione a runtime (per esempio `No API key found for provider "zai"`).

    **No API key found for provider dopo aver aggiunto un nuovo agente**

    Di solito significa che il **nuovo agente** ha un archivio di autenticazione vuoto. L'autenticazione è per agente e
    viene memorizzata in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opzioni di correzione:

    - Esegui `openclaw agents add <id>` e configura l'autenticazione durante la procedura guidata.
    - Oppure copia `auth-profiles.json` dalla `agentDir` dell'agente principale nella `agentDir` del nuovo agente.

    **Non** riutilizzare `agentDir` tra agenti; provoca collisioni di autenticazione/sessione.

  </Accordion>
</AccordionGroup>

## Model Failover e "All models failed"

<AccordionGroup>
  <Accordion title="Come funziona il failover?">
    Il failover avviene in due fasi:

    1. **Rotazione del profilo di autenticazione** all'interno dello stesso provider.
    2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

    Ai profili che falliscono vengono applicati cooldown (backoff esponenziale), così OpenClaw può continuare a rispondere anche quando un provider è soggetto a rate limit o fallisce temporaneamente.

    Il bucket di rate limit include più delle semplici risposte `429`. OpenClaw
    tratta come meritevoli di failover anche messaggi come
    `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` e limiti
    periodici di finestra d'uso (`weekly/monthly limit reached`).

    Alcune risposte che sembrano di fatturazione non sono `402`, e alcune risposte HTTP `402`
    restano anch'esse in quel bucket transitorio. Se un provider restituisce
    testo esplicito di fatturazione su `401` o `403`, OpenClaw può comunque mantenerlo nella
    corsia billing, ma i matcher di testo specifici del provider restano limitati al
    provider che li possiede (per esempio OpenRouter `Key limit exceeded`). Se invece un messaggio `402`
    sembra una finestra d'uso ritentabile o un limite di spesa
    di organizzazione/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo tratta come
    `rate_limit`, non come una lunga disabilitazione di fatturazione.

    Gli errori di overflow del contesto sono diversi: firme come
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` oppure `ollama error: context length
    exceeded` restano sul percorso di Compaction/retry invece di far avanzare il
    fallback del modello.

    Il testo generico di errore server è intenzionalmente più ristretto di “qualsiasi cosa contenga
    unknown/error”. OpenClaw tratta come meritevoli di failover forme transitorie con ambito provider
    come Anthropic puro `An unknown error occurred`, OpenRouter puro
    `Provider returned error`, errori stop-reason come `Unhandled stop reason:
    error`, payload JSON `api_error` con testo server transitorio
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) ed errori provider-busy come `ModelNotReadyException` come segnali
    di timeout/sovraccarico meritevoli di failover quando il contesto provider
    corrisponde.
    Il testo di fallback interno generico come `LLM request failed with an unknown
    error.` resta prudente e non attiva da solo il fallback del modello.

  </Accordion>

  <Accordion title='Cosa significa "No credentials found for profile anthropic:default"?'>
    Significa che il sistema ha tentato di usare l'ID profilo di autenticazione `anthropic:default`, ma non ha trovato credenziali per esso nell'archivio di autenticazione previsto.

    **Checklist di correzione:**

    - **Conferma dove si trovano i profili di autenticazione** (percorsi nuovi vs legacy)
      - Attuale: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (migrato da `openclaw doctor`)
    - **Conferma che la tua variabile d'ambiente sia caricata dal Gateway**
      - Se hai impostato `ANTHROPIC_API_KEY` nella tua shell ma esegui il Gateway tramite systemd/launchd, potrebbe non ereditarla. Mettila in `~/.openclaw/.env` oppure abilita `env.shellEnv`.
    - **Assicurati di modificare l'agente corretto**
      - Le configurazioni multi-agente implicano che possano esserci più file `auth-profiles.json`.
    - **Controllo rapido dello stato modello/autenticazione**
      - Usa `openclaw models status` per vedere i modelli configurati e se i provider sono autenticati.

    **Checklist di correzione per "No credentials found for profile anthropic"**

    Questo significa che l'esecuzione è fissata a un profilo di autenticazione Anthropic, ma il Gateway
    non riesce a trovarlo nel suo archivio di autenticazione.

    - **Usa Claude CLI**
      - Esegui `openclaw models auth login --provider anthropic --method cli --set-default` sull'host gateway.
    - **Se vuoi usare invece una chiave API**
      - Metti `ANTHROPIC_API_KEY` in `~/.openclaw/.env` sull'**host gateway**.
      - Cancella qualunque ordine fissato che forzi un profilo mancante:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Conferma di eseguire i comandi sull'host gateway**
      - In modalità remota, i profili di autenticazione vivono sulla macchina gateway, non sul tuo portatile.

  </Accordion>

  <Accordion title="Perché ha provato anche Google Gemini e ha fallito?">
    Se la configurazione del modello include Google Gemini come fallback (oppure sei passato a un'abbreviazione Gemini), OpenClaw lo proverà durante il fallback del modello. Se non hai configurato le credenziali Google, vedrai `No API key found for provider "google"`.

    Correzione: fornisci l'autenticazione Google oppure rimuovi/evita i modelli Google in `agents.defaults.model.fallbacks` / alias così il fallback non instrada lì.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Causa: la cronologia della sessione contiene **blocchi thinking senza firme** (spesso da
    uno stream interrotto/parziale). Google Antigravity richiede firme per i blocchi thinking.

    Correzione: OpenClaw ora rimuove i blocchi thinking senza firma per Google Antigravity Claude. Se compare ancora, avvia una **nuova sessione** oppure imposta `/thinking off` per quell'agente.

  </Accordion>
</AccordionGroup>

## Profili di autenticazione: cosa sono e come gestirli

Correlato: [/concepts/oauth](/it/concepts/oauth) (flussi OAuth, archiviazione token, modelli multi-account)

<AccordionGroup>
  <Accordion title="Cos'è un profilo di autenticazione?">
    Un profilo di autenticazione è un record di credenziali con nome (OAuth o chiave API) legato a un provider. I profili vivono in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Quali sono gli ID profilo tipici?">
    OpenClaw usa ID con prefisso del provider come:

    - `anthropic:default` (comune quando non esiste un'identità email)
    - `anthropic:<email>` per identità OAuth
    - ID personalizzati che scegli tu (ad esempio `anthropic:work`)

  </Accordion>

  <Accordion title="Posso controllare quale profilo di autenticazione viene provato per primo?">
    Sì. La configurazione supporta metadati facoltativi per i profili e un ordinamento per provider (`auth.order.<provider>`). Questo **non** memorizza segreti; mappa gli ID a provider/modalità e imposta l'ordine di rotazione.

    OpenClaw può saltare temporaneamente un profilo se si trova in un breve **cooldown** (rate limit/timeout/errori di autenticazione) o in uno stato **disabled** più lungo (fatturazione/crediti insufficienti). Per ispezionarlo, esegui `openclaw models status --json` e controlla `auth.unusableProfiles`. Regolazione: `auth.cooldowns.billingBackoffHours*`.

    I cooldown di rate limit possono avere ambito modello. Un profilo che è in cooldown
    per un modello può ancora essere utilizzabile per un modello fratello sullo stesso provider,
    mentre le finestre billing/disabled continuano a bloccare l'intero profilo.

    Puoi anche impostare un override di ordine **per agente** (memorizzato in `auth-state.json` di quell'agente) tramite CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Per puntare a un agente specifico:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Per verificare cosa verrà davvero provato, usa:

    ```bash
    openclaw models status --probe
    ```

    Se un profilo memorizzato viene omesso dall'ordine esplicito, la probe riporta
    `excluded_by_auth_order` per quel profilo invece di provarlo in silenzio.

  </Accordion>

  <Accordion title="OAuth vs chiave API: qual è la differenza?">
    OpenClaw supporta entrambi:

    - **OAuth** spesso sfrutta l'accesso in abbonamento (quando applicabile).
    - **Chiavi API** usano la fatturazione pay-per-token.

    La procedura guidata supporta esplicitamente Anthropic Claude CLI, OpenAI Codex OAuth e chiavi API.

  </Accordion>
</AccordionGroup>

## Gateway: porte, "already running" e modalità remota

<AccordionGroup>
  <Accordion title="Quale porta usa il Gateway?">
    `gateway.port` controlla l'unica porta multiplexata per WebSocket + HTTP (Control UI, hook, ecc.).

    Precedenza:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Perché openclaw gateway status dice "Runtime: running" ma "Connectivity probe: failed"?'>
    Perché "running" è il punto di vista del **supervisore** (launchd/systemd/schtasks). La connectivity probe è la CLI che si connette davvero al WebSocket del gateway.

    Usa `openclaw gateway status` e fidati di queste righe:

    - `Probe target:` (l'URL che la probe ha effettivamente usato)
    - `Listening:` (ciò che è davvero in ascolto sulla porta)
    - `Last gateway error:` (causa comune quando il processo è vivo ma la porta non è in ascolto)

  </Accordion>

  <Accordion title='Perché openclaw gateway status mostra "Config (cli)" e "Config (service)" diverse?'>
    Stai modificando un file di configurazione mentre il servizio ne sta eseguendo un altro (spesso una mancata corrispondenza di `--profile` / `OPENCLAW_STATE_DIR`).

    Correzione:

    ```bash
    openclaw gateway install --force
    ```

    Eseguilo dallo stesso `--profile` / ambiente che vuoi far usare al servizio.

  </Accordion>

  <Accordion title='Cosa significa "another gateway instance is already listening"?'>
    OpenClaw impone un lock runtime associando il listener WebSocket immediatamente all'avvio (predefinito `ws://127.0.0.1:18789`). Se il bind fallisce con `EADDRINUSE`, genera `GatewayLockError`, indicando che un'altra istanza è già in ascolto.

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

  <Accordion title='La Control UI dice "unauthorized" (oppure continua a riconnettersi). E adesso?'>
    Il percorso di autenticazione del gateway e il metodo di autenticazione dell'interfaccia non corrispondono.

    Fatti (dal codice):

    - La Control UI mantiene il token in `sessionStorage` per la sessione corrente della scheda del browser e l'URL del gateway selezionato, così i refresh nella stessa scheda continuano a funzionare senza ripristinare una persistenza di lunga durata del token in localStorage.
    - Su `AUTH_TOKEN_MISMATCH`, i client attendibili possono tentare un solo retry limitato con un token dispositivo in cache quando il gateway restituisce suggerimenti di retry (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Quel retry con token in cache ora riutilizza gli ambiti approvati in cache memorizzati con il token del dispositivo. I chiamanti con `deviceToken` esplicito / `scopes` espliciti mantengono comunque il set di ambiti richiesto invece di ereditare gli ambiti in cache.
    - Fuori da quel percorso di retry, la precedenza dell'autenticazione di connessione è prima token/password condivisi espliciti, poi `deviceToken` esplicito, poi token dispositivo memorizzato, poi bootstrap token.
    - I controlli di ambito del bootstrap token hanno prefisso di ruolo. L'allowlist integrata del bootstrap operator soddisfa solo richieste operator; Node o altri ruoli non operator richiedono comunque ambiti sotto il proprio prefisso di ruolo.

    Correzione:

    - Più veloce: `openclaw dashboard` (stampa + copia l'URL del dashboard, prova ad aprirlo; mostra un suggerimento SSH se è headless).
    - Se non hai ancora un token: `openclaw doctor --generate-gateway-token`.
    - Se è remoto, crea prima il tunnel: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`.
    - Modalità segreto condiviso: imposta `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oppure `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, poi incolla il segreto corrispondente nelle impostazioni della Control UI.
    - Modalità Tailscale Serve: assicurati che `gateway.auth.allowTailscale` sia abilitato e che tu stia aprendo l'URL Serve, non un URL loopback/tailnet grezzo che aggira gli header di identità Tailscale.
    - Modalità trusted-proxy: assicurati di passare attraverso il proxy non loopback configurato e consapevole dell'identità, non attraverso un proxy loopback sullo stesso host o un URL gateway grezzo.
    - Se la mancata corrispondenza persiste dopo l'unico retry, ruota/riapprova il token del dispositivo associato:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Se quella chiamata di rotazione dice che è stata negata, controlla due cose:
      - le sessioni dei dispositivi associati possono ruotare solo il **proprio** dispositivo a meno che non abbiano anche `operator.admin`
      - i valori espliciti `--scope` non possono superare gli ambiti operator correnti del chiamante
    - Ancora bloccato? Esegui `openclaw status --all` e segui [Risoluzione dei problemi](/it/gateway/troubleshooting). Vedi [Dashboard](/web/dashboard) per i dettagli di autenticazione.

  </Accordion>

  <Accordion title="Ho impostato gateway.bind tailnet ma non riesce a fare bind e nulla va in ascolto">
    Il bind `tailnet` sceglie un IP Tailscale dalle interfacce di rete (100.64.0.0/10). Se la macchina non è su Tailscale (oppure l'interfaccia è giù), non c'è nulla a cui fare bind.

    Correzione:

    - Avvia Tailscale su quell'host (così ha un indirizzo 100.x), oppure
    - passa a `gateway.bind: "loopback"` / `"lan"`.

    Nota: `tailnet` è esplicito. `auto` preferisce loopback; usa `gateway.bind: "tailnet"` quando vuoi un bind solo tailnet.

  </Accordion>

  <Accordion title="Posso eseguire più Gateway sullo stesso host?">
    Di solito no: un Gateway può eseguire più canali di messaggistica e più agenti. Usa più Gateway solo quando hai bisogno di ridondanza (es. bot di emergenza) o isolamento rigido.

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
    Il Gateway è un **server WebSocket** e si aspetta che il primissimo messaggio sia
    un frame `connect`. Se riceve qualcos'altro, chiude la connessione
    con **codice 1008** (violazione della policy).

    Cause comuni:

    - Hai aperto l'URL **HTTP** in un browser (`http://...`) invece che in un client WS.
    - Hai usato la porta o il percorso sbagliati.
    - Un proxy o un tunnel ha rimosso gli header di autenticazione o ha inviato una richiesta non-Gateway.

    Correzioni rapide:

    1. Usa l'URL WS: `ws://<host>:18789` (oppure `wss://...` se HTTPS).
    2. Non aprire la porta WS in una normale scheda del browser.
    3. Se l'autenticazione è attiva, includi il token/la password nel frame `connect`.

    Se usi la CLI o la TUI, l'URL dovrebbe apparire così:

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

    Modo più rapido per seguire i log:

    ```bash
    openclaw logs --follow
    ```

    Log del servizio/supervisore (quando il gateway gira tramite launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` e `gateway.err.log` (predefinito: `~/.openclaw/logs/...`; i profili usano `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Vedi [Risoluzione dei problemi](/it/gateway/troubleshooting) per altro.

  </Accordion>

  <Accordion title="Come faccio ad avviare/arrestare/riavviare il servizio Gateway?">
    Usa gli helper del gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Se esegui il gateway manualmente, `openclaw gateway --force` può recuperare la porta. Vedi [Gateway](/it/gateway).

  </Accordion>

  <Accordion title="Ho chiuso il terminale su Windows: come riavvio OpenClaw?">
    Esistono **due modalità di installazione Windows**:

    **1) WSL2 (consigliata):** il Gateway gira dentro Linux.

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

    **2) Windows nativo (non consigliato):** il Gateway gira direttamente su Windows.

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

    - L'autenticazione del modello non è caricata sull'**host gateway** (controlla `models status`).
    - Pairing/allowlist del canale bloccano le risposte (controlla configurazione del canale + log).
    - WebChat/Dashboard è aperto senza il token corretto.

    Se sei in remoto, conferma che il tunnel/la connessione Tailscale sia attiva e che il
    Gateway WebSocket sia raggiungibile.

    Documentazione: [Canali](/it/channels), [Risoluzione dei problemi](/it/gateway/troubleshooting), [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - e adesso?'>
    Di solito significa che l'interfaccia ha perso la connessione WebSocket. Controlla:

    1. Il Gateway è in esecuzione? `openclaw gateway status`
    2. Il Gateway è in salute? `openclaw status`
    3. L'interfaccia ha il token corretto? `openclaw dashboard`
    4. Se è remoto, il collegamento tunnel/Tailscale è attivo?

    Poi segui i log:

    ```bash
    openclaw logs --follow
    ```

    Documentazione: [Dashboard](/web/dashboard), [Accesso remoto](/it/gateway/remote), [Risoluzione dei problemi](/it/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands fallisce. Cosa devo controllare?">
    Inizia con i log e lo stato del canale:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Poi fai corrispondere l'errore:

    - `BOT_COMMANDS_TOO_MUCH`: il menu Telegram ha troppe voci. OpenClaw riduce già all'essenziale fino al limite Telegram e ritenta con meno comandi, ma alcune voci del menu devono comunque essere rimosse. Riduci i comandi di plugin/skill/personalizzati, oppure disabilita `channels.telegram.commands.native` se non ti serve il menu.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` o errori di rete simili: se sei su un VPS o dietro un proxy, conferma che l'HTTPS in uscita sia consentito e che il DNS funzioni per `api.telegram.org`.

    Se il Gateway è remoto, assicurati di guardare i log sull'host Gateway.

    Documentazione: [Telegram](/it/channels/telegram), [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).

  </Accordion>

  <Accordion title="La TUI non mostra output. Cosa devo controllare?">
    Per prima cosa conferma che il Gateway sia raggiungibile e che l'agente possa essere eseguito:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    Nella TUI, usa `/status` per vedere lo stato corrente. Se ti aspetti risposte in un canale chat,
    assicurati che la consegna sia abilitata (`/deliver on`).

    Documentazione: [TUI](/web/tui), [Slash command](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come arresto completamente e poi avvio il Gateway?">
    Se hai installato il servizio:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Questo arresta/avvia il **servizio supervisionato** (launchd su macOS, systemd su Linux).
    Usalo quando il Gateway è in esecuzione in background come daemon.

    Se lo stai eseguendo in foreground, arrestalo con Ctrl-C, poi:

    ```bash
    openclaw gateway run
    ```

    Documentazione: [Runbook del servizio Gateway](/it/gateway).

  </Accordion>

  <Accordion title="Spiegamelo semplice: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: riavvia il **servizio in background** (launchd/systemd).
    - `openclaw gateway`: esegue il gateway **in foreground** per questa sessione del terminale.

    Se hai installato il servizio, usa i comandi gateway. Usa `openclaw gateway` quando
    vuoi un'esecuzione singola in foreground.

  </Accordion>

  <Accordion title="Il modo più rapido per ottenere più dettagli quando qualcosa fallisce">
    Avvia il Gateway con `--verbose` per ottenere più dettagli nella console. Poi ispeziona il file di log per autenticazione del canale, instradamento del modello ed errori RPC.
  </Accordion>
</AccordionGroup>

## Media e allegati

<AccordionGroup>
  <Accordion title="La mia skill ha generato un'immagine/PDF, ma non è stato inviato nulla">
    Gli allegati in uscita dall'agente devono includere una riga `MEDIA:<path-or-url>` (su una riga dedicata). Vedi [Configurazione dell'assistente OpenClaw](/it/start/openclaw) e [Invio Agent](/it/tools/agent-send).

    Invio CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Controlla anche:

    - Il canale di destinazione supporta media in uscita e non è bloccato da allowlist.
    - Il file rientra nei limiti di dimensione del provider (le immagini vengono ridimensionate fino a max 2048px).
    - `tools.fs.workspaceOnly=true` mantiene gli invii di percorsi locali limitati a workspace, temp/media-store e file validati dal sandbox.
    - `tools.fs.workspaceOnly=false` consente a `MEDIA:` di inviare file locali dell'host che l'agente può già leggere, ma solo per media più tipi di documento sicuri (immagini, audio, video, PDF e documenti Office). I file di testo semplice e simili a segreti restano comunque bloccati.

    Vedi [Immagini](/it/nodes/images).

  </Accordion>
</AccordionGroup>

## Sicurezza e controllo degli accessi

<AccordionGroup>
  <Accordion title="È sicuro esporre OpenClaw ai DM in ingresso?">
    Tratta i DM in ingresso come input non attendibile. I valori predefiniti sono progettati per ridurre il rischio:

    - Il comportamento predefinito sui canali che supportano DM è **pairing**:
      - I mittenti sconosciuti ricevono un codice di pairing; il bot non elabora il loro messaggio.
      - Approva con: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Le richieste in sospeso sono limitate a **3 per canale**; controlla `openclaw pairing list --channel <channel> [--account <id>]` se un codice non è arrivato.
    - Aprire pubblicamente i DM richiede un opt-in esplicito (`dmPolicy: "open"` e allowlist `"*"`).

    Esegui `openclaw doctor` per far emergere criteri DM rischiosi.

  </Accordion>

  <Accordion title="La prompt injection è un problema solo per i bot pubblici?">
    No. La prompt injection riguarda il **contenuto non attendibile**, non solo chi può inviare DM al bot.
    Se il tuo assistente legge contenuti esterni (ricerca/fetch web, pagine browser, email,
    documenti, allegati, log incollati), quel contenuto può includere istruzioni che cercano
    di dirottare il modello. Questo può accadere anche se **sei l'unico mittente**.

    Il rischio maggiore è quando gli strumenti sono abilitati: il modello può essere indotto
    a esfiltrare contesto o chiamare strumenti per tuo conto. Riduci il raggio d'azione:

    - usando un agente “lettore” in sola lettura o senza strumenti per riassumere contenuti non attendibili
    - mantenendo `web_search` / `web_fetch` / `browser` disattivati per gli agenti con strumenti abilitati
    - trattando come non attendibile anche il testo decodificato di file/documenti: OpenResponses
      `input_file` e l'estrazione degli allegati multimediali racchiudono entrambi il testo estratto in
      marcatori espliciti di confine per contenuti esterni invece di passare il testo grezzo del file
    - usando sandboxing e allowlist rigorose degli strumenti

    Dettagli: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Il mio bot dovrebbe avere una propria email, account GitHub o numero di telefono?">
    Sì, per la maggior parte delle configurazioni. Isolare il bot con account e numeri di telefono separati
    riduce il raggio d'azione se qualcosa va storto. Questo rende anche più facile ruotare
    credenziali o revocare accessi senza impattare i tuoi account personali.

    Parti in piccolo. Concedi accesso solo agli strumenti e agli account di cui hai davvero bisogno, poi amplia
    in seguito se necessario.

    Documentazione: [Sicurezza](/it/gateway/security), [Pairing](/it/channels/pairing).

  </Accordion>

  <Accordion title="Posso dargli autonomia sui miei messaggi di testo ed è sicuro?">
    **Non** consigliamo piena autonomia sui tuoi messaggi personali. Il modello più sicuro è:

    - Mantieni i DM in **modalità pairing** o con un'allowlist stretta.
    - Usa un **numero o account separato** se vuoi che invii messaggi per tuo conto.
    - Lascia che prepari la bozza, poi **approva prima dell'invio**.

    Se vuoi sperimentare, fallo su un account dedicato e mantienilo isolato. Vedi
    [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Posso usare modelli più economici per attività da assistente personale?">
    Sì, **se** l'agente è solo chat e l'input è attendibile. I livelli più piccoli sono
    più suscettibili al dirottamento delle istruzioni, quindi evitali per agenti con strumenti abilitati
    o quando leggono contenuti non attendibili. Se devi usare un modello più piccolo, limita
    gli strumenti ed eseguilo dentro un sandbox. Vedi [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Ho eseguito /start in Telegram ma non ho ricevuto un codice di pairing">
    I codici di pairing vengono inviati **solo** quando un mittente sconosciuto scrive al bot e
    `dmPolicy: "pairing"` è abilitato. `/start` da solo non genera un codice.

    Controlla le richieste in sospeso:

    ```bash
    openclaw pairing list telegram
    ```

    Se vuoi accesso immediato, metti nell'allowlist il tuo sender id oppure imposta `dmPolicy: "open"`
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

    Prompt del numero di telefono nella procedura guidata: viene usato per impostare la tua **allowlist/proprietario** in modo che i tuoi DM siano consentiti. Non viene usato per invii automatici. Se esegui sul tuo numero WhatsApp personale, usa quel numero e abilita `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Comandi chat, annullamento attività e "non si ferma"

<AccordionGroup>
  <Accordion title="Come faccio a impedire che i messaggi di sistema interni compaiano in chat?">
    La maggior parte dei messaggi interni o degli strumenti compare solo quando **verbose**, **trace** o **reasoning** sono abilitati
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

    Questi sono trigger di annullamento (non slash command).

    Per i processi in background (dallo strumento exec), puoi chiedere all'agente di eseguire:

    ```
    process action:kill sessionId:XXX
    ```

    Panoramica delle slash command: vedi [Slash command](/it/tools/slash-commands).

    La maggior parte dei comandi deve essere inviata come messaggio **autonomo** che inizia con `/`, ma alcune scorciatoie (come `/status`) funzionano anche inline per i mittenti nell'allowlist.

  </Accordion>

  <Accordion title='Come invio un messaggio Discord da Telegram? ("Cross-context messaging denied")'>
    OpenClaw blocca per impostazione predefinita la messaggistica **cross-provider**. Se una chiamata di strumento è associata
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
    La modalità coda controlla come i nuovi messaggi interagiscono con un'esecuzione in corso. Usa `/queue` per cambiare modalità:

    - `steer` - i nuovi messaggi reindirizzano l'attività corrente
    - `followup` - esegue i messaggi uno alla volta
    - `collect` - raggruppa i messaggi e risponde una sola volta (predefinito)
    - `steer-backlog` - reindirizza ora, poi elabora l'arretrato
    - `interrupt` - annulla l'esecuzione corrente e ricomincia da capo

    Puoi aggiungere opzioni come `debounce:2s cap:25 drop:summarize` per le modalità followup.

  </Accordion>
</AccordionGroup>

## Varie

<AccordionGroup>
  <Accordion title='Qual è il modello predefinito per Anthropic con una chiave API?'>
    In OpenClaw, credenziali e selezione del modello sono separate. Impostare `ANTHROPIC_API_KEY` (o memorizzare una chiave API Anthropic nei profili di autenticazione) abilita l'autenticazione, ma il vero modello predefinito è quello che configuri in `agents.defaults.model.primary` (per esempio `anthropic/claude-sonnet-4-6` oppure `anthropic/claude-opus-4-6`). Se vedi `No credentials found for profile "anthropic:default"`, significa che il Gateway non è riuscito a trovare credenziali Anthropic nel `auth-profiles.json` previsto per l'agente in esecuzione.
  </Accordion>
</AccordionGroup>

---

Ancora bloccato? Chiedi su [Discord](https://discord.com/invite/clawd) oppure apri una [discussione GitHub](https://github.com/openclaw/openclaw/discussions).
