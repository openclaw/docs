---
read_when:
    - Risposta a domande comuni su setup, installazione, onboarding o supporto runtime
    - Triage di problemi segnalati dagli utenti prima di un debug più approfondito
summary: Domande frequenti su configurazione, setup e utilizzo di OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-05T13:59:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f71dc12f60aceaa1d095aaa4887d59ecf2a53e349d10a3e2f60e464ae48aff6
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Risposte rapide più risoluzione dei problemi più approfondita per configurazioni reali (sviluppo locale, VPS, multi-agent, chiavi OAuth/API, failover dei modelli). Per la diagnostica runtime, vedi [Risoluzione dei problemi](/gateway/troubleshooting). Per il riferimento completo della config, vedi [Configurazione](/gateway/configuration).

## Primi 60 secondi se qualcosa non funziona

1. **Stato rapido (primo controllo)**

   ```bash
   openclaw status
   ```

   Riepilogo locale rapido: SO + aggiornamento, raggiungibilità gateway/servizio, agenti/sessioni, config provider + problemi runtime (quando il gateway è raggiungibile).

2. **Report incollabile (sicuro da condividere)**

   ```bash
   openclaw status --all
   ```

   Diagnostica in sola lettura con tail dei log (token oscurati).

3. **Stato daemon + porta**

   ```bash
   openclaw gateway status
   ```

   Mostra il runtime del supervisore rispetto alla raggiungibilità RPC, l'URL target del probe e quale config probabilmente ha usato il servizio.

4. **Probe approfonditi**

   ```bash
   openclaw status --deep
   ```

   Esegue un probe live dello stato del gateway, inclusi i probe dei canali quando supportati
   (richiede un gateway raggiungibile). Vedi [Health](/gateway/health).

5. **Segui il log più recente**

   ```bash
   openclaw logs --follow
   ```

   Se l'RPC non è disponibile, usa come fallback:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   I log file sono separati dai log del servizio; vedi [Logging](/logging) e [Risoluzione dei problemi](/gateway/troubleshooting).

6. **Esegui doctor (riparazioni)**

   ```bash
   openclaw doctor
   ```

   Ripara/migra config/stato + esegue controlli di salute. Vedi [Doctor](/gateway/doctor).

7. **Istantanea del gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # mostra l'URL di destinazione + il percorso della config in caso di errori
   ```

   Chiede al gateway in esecuzione un'istantanea completa (solo WS). Vedi [Health](/gateway/health).

## Avvio rapido e configurazione iniziale

<AccordionGroup>
  <Accordion title="Sono bloccato, qual è il modo più veloce per sbloccarmi?">
    Usa un agente AI locale che possa **vedere la tua macchina**. È molto più efficace che chiedere
    su Discord, perché la maggior parte dei casi di "sono bloccato" sono **problemi di config o ambiente locali**
    che chi aiuta da remoto non può ispezionare.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Questi strumenti possono leggere il repo, eseguire comandi, ispezionare i log e aiutarti a correggere la configurazione
    a livello di macchina (PATH, servizi, permessi, file auth). Fornisci loro il **checkout completo del sorgente** tramite
    l'installazione hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Questo installa OpenClaw **da un checkout git**, così l'agente può leggere codice + documentazione e
    ragionare sulla versione esatta che stai eseguendo. Puoi sempre tornare alla versione stabile più avanti
    rieseguendo l'installer senza `--install-method git`.

    Suggerimento: chiedi all'agente di **pianificare e supervisionare** la correzione (passo dopo passo), poi eseguire solo i
    comandi necessari. In questo modo le modifiche restano piccole e più facili da verificare.

    Se scopri un vero bug o una correzione, apri per favore una issue GitHub o invia una PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Inizia con questi comandi (condividi gli output quando chiedi aiuto):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Cosa fanno:

    - `openclaw status`: istantanea rapida dello stato di gateway/agente + config di base.
    - `openclaw models status`: controlla auth dei provider + disponibilità dei modelli.
    - `openclaw doctor`: valida e ripara i problemi comuni di config/stato.

    Altri controlli CLI utili: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Ciclo rapido di debug: [Primi 60 secondi se qualcosa non funziona](#primi-60-secondi-se-qualcosa-non-funziona).
    Documentazione installazione: [Installazione](/install), [Flag dell'installer](/install/installer), [Aggiornamento](/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continua a essere saltato. Cosa significano i motivi di skip?">
    Motivi comuni di skip dell'heartbeat:

    - `quiet-hours`: fuori dalla finestra configurata di ore attive
    - `empty-heartbeat-file`: `HEARTBEAT.md` esiste ma contiene solo struttura vuota/intestazioni
    - `no-tasks-due`: la modalità task di `HEARTBEAT.md` è attiva ma nessuno degli intervalli dei task è ancora dovuto
    - `alerts-disabled`: tutta la visibilità dell'heartbeat è disabilitata (`showOk`, `showAlerts` e `useIndicator` sono tutti disattivi)

    In modalità task, i timestamp di scadenza vengono avanzati solo dopo il completamento
    di un'esecuzione reale dell'heartbeat. Le esecuzioni saltate non segnano i task come completati.

    Documentazione: [Heartbeat](/gateway/heartbeat), [Automazione e attività](/it/automation).

  </Accordion>

  <Accordion title="Modo consigliato per installare e configurare OpenClaw">
    Il repo consiglia di eseguire dal sorgente e usare l'onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata può anche compilare automaticamente le risorse UI. Dopo l'onboarding, in genere esegui il Gateway sulla porta **18789**.

    Dal sorgente (contributori/sviluppo):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # installa automaticamente le dipendenze UI alla prima esecuzione
    openclaw onboard
    ```

    Se non hai ancora un'installazione globale, eseguilo tramite `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Come apro la dashboard dopo l'onboarding?">
    La procedura guidata apre il browser con un URL pulito della dashboard (senza token) subito dopo l'onboarding e stampa anche il link nel riepilogo. Tieni aperta quella scheda; se non si è avviata, copia/incolla l'URL stampato sulla stessa macchina.
  </Accordion>

  <Accordion title="Come autentico la dashboard su localhost rispetto a remoto?">
    **Localhost (stessa macchina):**

    - Apri `http://127.0.0.1:18789/`.
    - Se chiede autenticazione con segreto condiviso, incolla il token o la password configurati nelle impostazioni della Control UI.
    - Origine del token: `gateway.auth.token` (oppure `OPENCLAW_GATEWAY_TOKEN`).
    - Origine della password: `gateway.auth.password` (oppure `OPENCLAW_GATEWAY_PASSWORD`).
    - Se non è ancora configurato alcun segreto condiviso, genera un token con `openclaw doctor --generate-gateway-token`.

    **Non su localhost:**

    - **Tailscale Serve** (consigliato): mantieni bind loopback, esegui `openclaw gateway --tailscale serve`, apri `https://<magicdns>/`. Se `gateway.auth.allowTailscale` è `true`, gli header di identità soddisfano l'autenticazione di Control UI/WebSocket (senza incollare un segreto condiviso, assumendo un host gateway fidato); le API HTTP richiedono comunque autenticazione con segreto condiviso, salvo che tu non usi deliberatamente `none` su ingresso privato o autenticazione HTTP con proxy fidato.
      I tentativi simultanei di autenticazione errata Serve dallo stesso client vengono serializzati prima che il limitatore di auth fallita li registri, quindi il secondo tentativo errato può già mostrare `retry later`.
    - **Bind tailnet**: esegui `openclaw gateway --bind tailnet --token "<token>"` (oppure configura autenticazione password), apri `http://<tailscale-ip>:18789/`, poi incolla il segreto condiviso corrispondente nelle impostazioni della dashboard.
    - **Reverse proxy identity-aware**: mantieni il Gateway dietro un proxy fidato non-loopback, configura `gateway.auth.mode: "trusted-proxy"`, poi apri l'URL del proxy.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` poi apri `http://127.0.0.1:18789/`. L'autenticazione con segreto condiviso si applica comunque sul tunnel; incolla il token o la password configurati se richiesto.

    Vedi [Dashboard](/web/dashboard) e [Superfici web](/web) per dettagli su modalità di bind e autenticazione.

  </Accordion>

  <Accordion title="Perché ci sono due config di approvazione exec per le approvazioni in chat?">
    Controllano livelli diversi:

    - `approvals.exec`: inoltra i prompt di approvazione alle destinazioni chat
    - `channels.<channel>.execApprovals`: fa sì che quel canale agisca come client di approvazione nativo per le approvazioni exec

    La policy exec dell'host resta comunque il vero gate di approvazione. La config della chat controlla solo dove
    compaiono i prompt di approvazione e come le persone possono rispondere.

    Nella maggior parte delle configurazioni **non** ti servono entrambe:

    - Se la chat supporta già comandi e risposte, `/approve` nella stessa chat funziona tramite il percorso condiviso.
    - Se un canale nativo supportato può dedurre in modo sicuro chi approva, OpenClaw ora abilita automaticamente le approvazioni native DM-first quando `channels.<channel>.execApprovals.enabled` è non impostato oppure `"auto"`.
    - Quando sono disponibili card/pulsanti di approvazione nativi, quella UI nativa è il percorso principale; l'agente dovrebbe includere un comando manuale `/approve` solo se il risultato dello strumento dice che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    - Usa `approvals.exec` solo quando i prompt devono essere inoltrati anche ad altre chat o a stanze operative esplicite.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo quando vuoi esplicitamente che i prompt di approvazione vengano pubblicati di nuovo nella stanza/topic di origine.
    - Le approvazioni dei plugin sono ancora separate: usano `/approve` nella stessa chat per impostazione predefinita, inoltro facoltativo `approvals.plugin` e solo alcuni canali nativi mantengono in aggiunta la gestione nativa delle approvazioni plugin.

    In breve: l'inoltro serve per l'instradamento, la config del client nativo serve per una UX più ricca specifica del canale.
    Vedi [Exec Approvals](/tools/exec-approvals).

  </Accordion>

  <Accordion title="Di quale runtime ho bisogno?">
    È richiesto Node **>= 22**. Si consiglia `pnpm`. Bun **non è consigliato** per il Gateway.
  </Accordion>

  <Accordion title="Funziona su Raspberry Pi?">
    Sì. Il Gateway è leggero: la documentazione indica **512MB-1GB di RAM**, **1 core** e circa **500MB**
    di disco come sufficienti per uso personale, e nota che un **Raspberry Pi 4 può eseguirlo**.

    Se vuoi più margine (log, media, altri servizi), sono consigliati **2GB**, ma non è
    un minimo rigido.

    Suggerimento: un piccolo Pi/VPS può ospitare il Gateway, e puoi associare **nodes** sul tuo laptop/telefono per
    screen/camera/canvas locale o esecuzione comandi. Vedi [Nodes](/nodes).

  </Accordion>

  <Accordion title="Qualche consiglio per installazioni su Raspberry Pi?">
    In breve: funziona, ma aspettati qualche asperità.

    - Usa un SO **64 bit** e mantieni Node >= 22.
    - Preferisci l'installazione **hackable (git)** così puoi vedere i log e aggiornare rapidamente.
    - Inizia senza canali/Skills, poi aggiungili uno alla volta.
    - Se incontri strani problemi binari, di solito è un problema di **compatibilità ARM**.

    Documentazione: [Linux](/platforms/linux), [Installazione](/install).

  </Accordion>

  <Accordion title="Resta bloccato su wake up my friend / l'onboarding non parte. E adesso?">
    Quella schermata dipende dal fatto che il Gateway sia raggiungibile e autenticato. Anche la TUI invia
    automaticamente "Wake up, my friend!" al primo avvio. Se vedi quella riga senza **nessuna risposta**
    e i token restano a 0, l'agente non è mai stato eseguito.

    1. Riavvia il Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Controlla stato + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Se continua a bloccarsi, esegui:

    ```bash
    openclaw doctor
    ```

    Se il Gateway è remoto, assicurati che il tunnel/la connessione Tailscale sia attiva e che l'UI
    punti al Gateway corretto. Vedi [Accesso remoto](/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrare la mia configurazione su una nuova macchina (Mac mini) senza rifare l'onboarding?">
    Sì. Copia la **directory di stato** e il **workspace**, poi esegui Doctor una volta. Questo
    mantiene il tuo bot "esattamente uguale" (memoria, cronologia sessioni, auth e stato del canale)
    finché copi **entrambe** le posizioni:

    1. Installa OpenClaw sulla nuova macchina.
    2. Copia `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`) dalla vecchia macchina.
    3. Copia il tuo workspace (predefinito: `~/.openclaw/workspace`).
    4. Esegui `openclaw doctor` e riavvia il servizio Gateway.

    Questo preserva config, profili auth, credenziali WhatsApp, sessioni e memoria. Se sei in
    modalità remota, ricorda che l'host gateway possiede l'archivio delle sessioni e il workspace.

    **Importante:** se fai solo commit/push del workspace su GitHub, stai facendo
    il backup di **memoria + file bootstrap**, ma **non** della cronologia delle sessioni o dell'auth. Questi vivono
    sotto `~/.openclaw/` (ad esempio `~/.openclaw/agents/<agentId>/sessions/`).

    Correlati: [Migrazione](/install/migrating), [Dove si trova tutto su disco](#dove-si-trova-tutto-su-disco),
    [Workspace dell'agente](/concepts/agent-workspace), [Doctor](/gateway/doctor),
    [Modalità remota](/gateway/remote).

  </Accordion>

  <Accordion title="Dove vedo cosa c'è di nuovo nell'ultima versione?">
    Controlla il changelog su GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Le voci più recenti sono in alto. Se la sezione in alto è contrassegnata **Unreleased**, la successiva sezione datata
    è l'ultima versione rilasciata. Le voci sono raggruppate in **Highlights**, **Changes** e
    **Fixes** (più sezioni docs/altro quando necessario).

  </Accordion>

  <Accordion title="Impossibile accedere a docs.openclaw.ai (errore SSL)">
    Alcune connessioni Comcast/Xfinity bloccano in modo errato `docs.openclaw.ai` tramite Xfinity
    Advanced Security. Disabilitalo o metti `docs.openclaw.ai` in allowlist, poi riprova.
    Aiutaci a sbloccarlo segnalando qui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se ancora non riesci a raggiungere il sito, la documentazione è mirrorata su GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Differenza tra stable e beta">
    **Stable** e **beta** sono **npm dist-tag**, non linee di codice separate:

    - `latest` = stabile
    - `beta` = build anticipata per test

    Di solito, una release stabile arriva prima su **beta**, poi un passaggio esplicito
    di promozione sposta quella stessa versione su `latest`. I maintainer possono anche
    pubblicare direttamente su `latest` quando necessario. Per questo beta e stable possono
    puntare alla **stessa versione** dopo la promozione.

    Vedi cosa è cambiato:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Per one-liner di installazione e la differenza tra beta e dev, vedi l'accordion qui sotto.

  </Accordion>

  <Accordion title="Come installo la versione beta e qual è la differenza tra beta e dev?">
    **Beta** è il dist-tag npm `beta` (può coincidere con `latest` dopo la promozione).
    **Dev** è la head in movimento di `main` (git); quando viene pubblicata usa il dist-tag npm `dev`.

    One-liner (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installer Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Maggiori dettagli: [Canali di sviluppo](/install/development-channels) e [Flag dell'installer](/install/installer).

  </Accordion>

  <Accordion title="Come provo le ultimissime modifiche?">
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

    In questo modo ottieni un repo locale che puoi modificare, poi aggiornare via git.

    Se preferisci un clone pulito manuale, usa:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentazione: [Update](/cli/update), [Canali di sviluppo](/install/development-channels),
    [Installazione](/install).

  </Accordion>

  <Accordion title="Quanto durano di solito installazione e onboarding?">
    Indicazioni approssimative:

    - **Installazione:** 2-5 minuti
    - **Onboarding:** 5-15 minuti a seconda di quanti canali/modelli configuri

    Se si blocca, usa [Installer bloccato](#quick-start-and-first-run-setup)
    e il ciclo di debug rapido in [Sono bloccato](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Installer bloccato? Come ottengo più feedback?">
    Riesegui l'installer con **output dettagliato**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Installazione beta con output dettagliato:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Per un'installazione hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Equivalente Windows (PowerShell):

    ```powershell
    # install.ps1 non ha ancora un flag dedicato -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Altre opzioni: [Flag dell'installer](/install/installer).

  </Accordion>

  <Accordion title="Su Windows l'installazione dice git non trovato o openclaw non riconosciuto">
    Due problemi comuni su Windows:

    **1) errore npm spawn git / git non trovato**

    - Installa **Git for Windows** e assicurati che `git` sia nel tuo PATH.
    - Chiudi e riapri PowerShell, poi riesegui l'installer.

    **2) openclaw non è riconosciuto dopo l'installazione**

    - La cartella bin globale di npm non è nel PATH.
    - Controlla il percorso:

      ```powershell
      npm config get prefix
      ```

    - Aggiungi quella directory al PATH utente (su Windows non serve il suffisso `\bin`; nella maggior parte dei sistemi è `%AppData%\npm`).
    - Chiudi e riapri PowerShell dopo aver aggiornato il PATH.

    Se vuoi la configurazione Windows più fluida, usa **WSL2** invece di Windows nativo.
    Documentazione: [Windows](/platforms/windows).

  </Accordion>

  <Accordion title="Su Windows l'output exec mostra testo cinese illeggibile: cosa devo fare?">
    Di solito è una mancata corrispondenza della code page della console nelle shell Windows native.

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

    Se riesci ancora a riprodurlo sull'ultima versione di OpenClaw, monitora/segnala qui:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentazione non ha risposto alla mia domanda: come ottengo una risposta migliore?">
    Usa l'**installazione hackable (git)** così hai sorgente e documentazione completi in locale, poi chiedi
    al tuo bot (o a Claude/Codex) _da quella cartella_ così può leggere il repo e rispondere con precisione.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Maggiori dettagli: [Installazione](/install) e [Flag dell'installer](/install/installer).

  </Accordion>

  <Accordion title="Come installo OpenClaw su Linux?">
    Risposta breve: segui la guida Linux, poi esegui l'onboarding.

    - Percorso rapido Linux + installazione servizio: [Linux](/platforms/linux).
    - Guida completa: [Per iniziare](/start/getting-started).
    - Installer + aggiornamenti: [Installazione e aggiornamenti](/install/updating).

  </Accordion>

  <Accordion title="Come installo OpenClaw su un VPS?">
    Qualsiasi VPS Linux va bene. Installa sul server, poi usa SSH/Tailscale per raggiungere il Gateway.

    Guide: [exe.dev](/install/exe-dev), [Hetzner](/install/hetzner), [Fly.io](/install/fly).
    Accesso remoto: [Gateway remoto](/gateway/remote).

  </Accordion>

  <Accordion title="Dove sono le guide di installazione cloud/VPS?">
    Manteniamo un **hub hosting** con i provider più comuni. Scegline uno e segui la guida:

    - [Hosting VPS](/vps) (tutti i provider in un unico posto)
    - [Fly.io](/install/fly)
    - [Hetzner](/install/hetzner)
    - [exe.dev](/install/exe-dev)

    Come funziona nel cloud: il **Gateway gira sul server**, e vi accedi
    dal laptop/telefono tramite la Control UI (o Tailscale/SSH). Il tuo stato + workspace
    vivono sul server, quindi considera l'host come fonte di verità ed esegui il backup.

    Puoi associare **nodes** (Mac/iOS/Android/headless) a quel Gateway cloud per accedere
    a screen/camera/canvas locali o eseguire comandi sul tuo laptop mantenendo il
    Gateway nel cloud.

    Hub: [Piattaforme](/platforms). Accesso remoto: [Gateway remoto](/gateway/remote).
    Nodes: [Nodes](/nodes), [CLI Nodes](/cli/nodes).

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

    Documentazione: [Update](/cli/update), [Aggiornamento](/install/updating).

  </Accordion>

  <Accordion title="Cosa fa davvero l'onboarding?">
    `openclaw onboard` è il percorso di setup consigliato. In **modalità locale** ti guida attraverso:

    - **Setup del modello/auth** (OAuth provider, riuso Claude CLI e chiavi API supportate, più opzioni per modelli locali come LM Studio)
    - Posizione del **workspace** + file bootstrap
    - **Impostazioni del Gateway** (bind/porta/auth/tailscale)
    - **Canali** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, più plugin canale bundled come QQ Bot)
    - **Installazione daemon** (LaunchAgent su macOS; unità user systemd su Linux/WSL2)
    - **Controlli di salute** e selezione delle **Skills**

    Avvisa anche se il modello configurato è sconosciuto o manca l'auth.

  </Accordion>

  <Accordion title="Mi serve un abbonamento Claude o OpenAI per eseguirlo?">
    No. Puoi eseguire OpenClaw con **chiavi API** (Anthropic/OpenAI/altri) oppure con
    **modelli solo locali** così i tuoi dati restano sul tuo dispositivo. Gli abbonamenti (Claude
    Pro/Max o OpenAI Codex) sono modi facoltativi per autenticare quei provider.

    Riteniamo che il fallback Claude Code CLI sia probabilmente consentito per automazione locale gestita
    dall'utente in base alla documentazione pubblica della CLI di Anthropic. Detto questo,
    la policy di Anthropic sugli harness di terze parti crea abbastanza ambiguità sull'uso supportato
    da abbonamento in prodotti esterni, quindi non lo consigliamo in produzione.
    Anthropic ha inoltre informato gli utenti OpenClaw il **4 aprile 2026
    alle 12:00 PM PT / 8:00 PM BST** che il percorso di login Claude di **OpenClaw**
    conta come uso di harness di terze parti e ora richiede **Extra Usage**
    fatturato separatamente dall'abbonamento. L'OAuth OpenAI Codex è esplicitamente
    supportato per strumenti esterni come OpenClaw.

    OpenClaw supporta anche altre opzioni hosted in stile abbonamento, tra cui
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** e
    **Z.AI / GLM Coding Plan**.

    Documentazione: [Anthropic](/providers/anthropic), [OpenAI](/providers/openai),
    [Qwen Cloud](/providers/qwen),
    [MiniMax](/providers/minimax), [Modelli GLM](/providers/glm),
    [Modelli locali](/gateway/local-models), [Modelli](/concepts/models).

  </Accordion>

  <Accordion title="Posso usare l'abbonamento Claude Max senza una chiave API?">
    Sì, tramite un login locale **Claude CLI** sull'host del gateway.

    Gli abbonamenti Claude Pro/Max **non includono una chiave API**, quindi il
    riuso di Claude CLI è il percorso di fallback locale in OpenClaw. Riteniamo che il fallback Claude Code CLI
    sia probabilmente consentito per automazione locale gestita dall'utente in base alla
    documentazione pubblica della CLI di Anthropic. Detto questo, la policy di Anthropic sugli harness di terze parti
    crea abbastanza ambiguità sull'uso supportato da abbonamento in prodotti
    esterni, quindi non lo consigliamo in produzione. Consigliamo invece
    le chiavi API Anthropic.

  </Accordion>

  <Accordion title="Supportate l'autenticazione tramite abbonamento Claude (Claude Pro o Max)?">
    Sì. Riusa un login locale **Claude CLI** sull'host del gateway con `openclaw models auth login --provider anthropic --method cli --set-default`.

    Anthropic setup-token è nuovamente disponibile anche come percorso OpenClaw legacy/manuale. L'avviso di fatturazione specifico per OpenClaw di Anthropic vale ancora anche lì, quindi usalo sapendo che Anthropic richiede **Extra Usage**. Vedi [Anthropic](/providers/anthropic) e [OAuth](/concepts/oauth).

    Importante: riteniamo che il fallback Claude Code CLI sia probabilmente consentito per automazione locale gestita
    dall'utente in base alla documentazione pubblica della CLI di Anthropic. Detto questo,
    la policy di Anthropic sugli harness di terze parti crea abbastanza ambiguità sull'uso supportato
    da abbonamento in prodotti esterni, quindi non lo consigliamo in produzione.
    Anthropic ha anche detto agli utenti OpenClaw il **4 aprile 2026 alle
    12:00 PM PT / 8:00 PM BST** che il percorso di login Claude di **OpenClaw**
    richiede **Extra Usage** fatturato separatamente dall'abbonamento.

    Per produzione o carichi multiutente, l'autenticazione con chiave API Anthropic è la
    scelta più sicura e consigliata. Se vuoi altre opzioni hosted in stile abbonamento
    in OpenClaw, vedi [OpenAI](/providers/openai), [Qwen / Model
    Cloud](/providers/qwen), [MiniMax](/providers/minimax), e
    [Modelli GLM](/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Perché vedo HTTP 429 rate_limit_error da Anthropic?">
Ciò significa che la tua **quota/limite di frequenza Anthropic** è esaurita per la finestra corrente. Se
usi **Claude CLI**, attendi il reset della finestra o passa a un piano superiore. Se
usi una **chiave API Anthropic**, controlla la Anthropic Console
per utilizzo/fatturazione e aumenta i limiti se necessario.

    Se il messaggio è nello specifico:
    `Extra usage is required for long context requests`, la richiesta sta cercando di usare
    la beta Anthropic da 1M di contesto (`context1m: true`). Funziona solo quando la tua
    credenziale è idonea per la fatturazione long-context (fatturazione con chiave API o
    percorso di login Claude di OpenClaw con Extra Usage abilitato).

    Suggerimento: imposta un **modello di fallback** così OpenClaw può continuare a rispondere mentre un provider è soggetto a rate limit.
    Vedi [Modelli](/cli/models), [OAuth](/concepts/oauth), e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock è supportato?">
    Sì. OpenClaw include un provider bundled **Amazon Bedrock (Converse)**. Quando sono presenti i marker env AWS, OpenClaw può auto-rilevare il catalogo Bedrock streaming/testo e unirlo come provider implicito `amazon-bedrock`; in alternativa puoi abilitare esplicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` o aggiungere una voce provider manuale. Vedi [Amazon Bedrock](/providers/bedrock) e [Provider di modelli](/providers/models). Se preferisci un flusso di chiavi gestito, anche un proxy compatibile OpenAI davanti a Bedrock resta un'opzione valida.
  </Accordion>

  <Accordion title="Come funziona l'auth Codex?">
    OpenClaw supporta **OpenAI Code (Codex)** tramite OAuth (accesso ChatGPT). L'onboarding può eseguire il flusso OAuth e imposterà il modello predefinito su `openai-codex/gpt-5.4` quando appropriato. Vedi [Provider di modelli](/concepts/model-providers) e [Onboarding (CLI)](/start/wizard).
  </Accordion>

  <Accordion title="Supportate l'autenticazione con abbonamento OpenAI (Codex OAuth)?">
    Sì. OpenClaw supporta pienamente l'**OAuth di abbonamento OpenAI Code (Codex)**.
    OpenAI consente esplicitamente l'uso di OAuth con abbonamento in strumenti/flussi di lavoro esterni
    come OpenClaw. L'onboarding può eseguire per te il flusso OAuth.

    Vedi [OAuth](/concepts/oauth), [Provider di modelli](/concepts/model-providers), e [Onboarding (CLI)](/start/wizard).

  </Accordion>

  <Accordion title="Come configuro Gemini CLI OAuth?">
    Gemini CLI usa un **flusso auth del plugin**, non un client id o secret in `openclaw.json`.

    Passaggi:

    1. Installa Gemini CLI in locale così `gemini` sia nel `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Abilita il plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modello predefinito dopo il login: `google-gemini-cli/gemini-3.1-pro-preview`
    5. Se le richieste falliscono, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host del gateway

    Questo memorizza i token OAuth nei profili auth sull'host del gateway. Dettagli: [Provider di modelli](/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modello locale va bene per chat casuali?">
    Di solito no. OpenClaw richiede contesto ampio + forte sicurezza; schede piccole troncano e perdono protezioni. Se proprio devi, esegui la build di modello **più grande** che puoi in locale (LM Studio) e vedi [/gateway/local-models](/gateway/local-models). I modelli più piccoli/quantizzati aumentano il rischio di prompt injection: vedi [Sicurezza](/gateway/security).
  </Accordion>

  <Accordion title="Come faccio a mantenere il traffico del modello hosted in una regione specifica?">
    Scegli endpoint bloccati per regione. OpenRouter espone opzioni ospitate negli USA per MiniMax, Kimi e GLM; scegli la variante ospitata negli USA per mantenere i dati in quella regione. Puoi comunque elencare Anthropic/OpenAI insieme a questi usando `models.mode: "merge"` così i fallback restano disponibili rispettando al contempo il provider regionale selezionato.
  </Accordion>

  <Accordion title="Devo comprare un Mac Mini per installarlo?">
    No. OpenClaw gira su macOS o Linux (Windows via WSL2). Un Mac mini è facoltativo: alcune persone
    ne comprano uno come host sempre acceso, ma vanno bene anche un piccolo VPS, un server domestico o una macchina di classe Raspberry Pi.

    Ti serve un Mac **solo per gli strumenti esclusivi macOS**. Per iMessage, usa [BlueBubbles](/it/channels/bluebubbles) (consigliato): il server BlueBubbles gira su qualunque Mac, e il Gateway può girare su Linux o altrove. Se vuoi altri strumenti solo macOS, esegui il Gateway su un Mac o associa un nodo macOS.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Nodes](/nodes), [Modalità remota Mac](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Mi serve un Mac mini per il supporto iMessage?">
    Ti serve **un qualsiasi dispositivo macOS** con accesso a Messaggi. **Non** deve essere un Mac mini:
    va bene qualunque Mac. **Usa [BlueBubbles](/it/channels/bluebubbles)** (consigliato) per iMessage: il server BlueBubbles gira su macOS, mentre il Gateway può girare su Linux o altrove.

    Configurazioni comuni:

    - Esegui il Gateway su Linux/VPS, e il server BlueBubbles su qualunque Mac con accesso a Messaggi.
    - Esegui tutto sul Mac se vuoi la configurazione più semplice su una sola macchina.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Nodes](/nodes),
    [Modalità remota Mac](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se compro un Mac mini per eseguire OpenClaw, posso collegarlo al mio MacBook Pro?">
    Sì. Il **Mac mini può eseguire il Gateway**, e il tuo MacBook Pro può collegarsi come
    **node** (dispositivo companion). I nodes non eseguono il Gateway: forniscono capacità aggiuntive
    come screen/camera/canvas e `system.run` su quel dispositivo.

    Schema comune:

    - Gateway sul Mac mini (sempre acceso).
    - Il MacBook Pro esegue l'app macOS o un host node e si associa al Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` per vederlo.

    Documentazione: [Nodes](/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Posso usare Bun?">
    Bun **non è consigliato**. Riscontriamo bug runtime, soprattutto con WhatsApp e Telegram.
    Usa **Node** per gateway stabili.

    Se vuoi comunque sperimentare con Bun, fallo su un gateway non di produzione
    senza WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: cosa va inserito in allowFrom?">
    `channels.telegram.allowFrom` è l'**ID utente Telegram numerico** del mittente umano. Non è il nome utente del bot.

    L'onboarding accetta input `@username` e lo risolve in un ID numerico, ma l'autorizzazione di OpenClaw usa solo ID numerici.

    Più sicuro (senza bot di terze parti):

    - Invia un DM al tuo bot, poi esegui `openclaw logs --follow` e leggi `from.id`.

    Bot API ufficiale:

    - Invia un DM al tuo bot, poi chiama `https://api.telegram.org/bot<bot_token>/getUpdates` e leggi `message.from.id`.

    Terze parti (meno private):

    - Invia un DM a `@userinfobot` o `@getidsbot`.

    Vedi [/channels/telegram](/it/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Più persone possono usare un solo numero WhatsApp con diverse istanze OpenClaw?">
    Sì, tramite **instradamento multi-agent**. Associa il **DM** WhatsApp di ciascun mittente (peer `kind: "direct"`, mittente E.164 come `+15551234567`) a un diverso `agentId`, così ogni persona ottiene il proprio workspace e archivio sessioni. Le risposte continueranno però a provenire dallo **stesso account WhatsApp**, e il controllo di accesso DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) è globale per account WhatsApp. Vedi [Instradamento Multi-Agent](/concepts/multi-agent) e [WhatsApp](/it/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso eseguire un agente "chat veloce" e un agente "Opus per coding"?'>
    Sì. Usa l'instradamento multi-agent: assegna a ciascun agente il proprio modello predefinito, poi associa le route in ingresso (account provider o peer specifici) a ciascun agente. Un esempio di config è in [Instradamento Multi-Agent](/concepts/multi-agent). Vedi anche [Modelli](/concepts/models) e [Configurazione](/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew funziona su Linux?">
    Sì. Homebrew supporta Linux (Linuxbrew). Configurazione rapida:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Se esegui OpenClaw via systemd, assicurati che il PATH del servizio includa `/home/linuxbrew/.linuxbrew/bin` (o il tuo prefisso brew) così gli strumenti installati con `brew` si risolvano nelle shell non login.
    Le build recenti antepongono anche directory bin utente comuni nei servizi Linux systemd (ad esempio `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e rispettano `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando impostati.

  </Accordion>

  <Accordion title="Differenza tra installazione git hackable e npm install">
    - **Installazione hackable (git):** checkout completo del sorgente, modificabile, ideale per chi contribuisce.
      Esegui le build localmente e puoi correggere codice/documentazione.
    - **npm install:** installazione CLI globale, senza repo, ideale per "voglio solo usarlo".
      Gli aggiornamenti arrivano dai dist-tag npm.

    Documentazione: [Per iniziare](/start/getting-started), [Aggiornamento](/install/updating).

  </Accordion>

  <Accordion title="Posso passare più avanti tra installazioni npm e git?">
    Sì. Installa l'altro tipo, poi esegui Doctor così il servizio gateway punti al nuovo entrypoint.
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

    Doctor rileva una mancata corrispondenza dell'entrypoint del servizio gateway e propone di riscrivere la config del servizio per allinearla all'installazione corrente (usa `--repair` nell'automazione).

    Suggerimenti backup: vedi [Strategia di backup](#dove-si-trova-tutto-su-disco).

  </Accordion>

  <Accordion title="Dovrei eseguire il Gateway sul mio laptop o su un VPS?">
    In breve: **se vuoi affidabilità 24/7, usa un VPS**. Se vuoi il minor attrito possibile e puoi tollerare sospensione/riavvii, eseguilo in locale.

    **Laptop (Gateway locale)**

    - **Pro:** nessun costo server, accesso diretto ai file locali, finestra browser visibile.
    - **Contro:** sospensione/cadute rete = disconnessioni, aggiornamenti/riavvii del SO interrompono, deve restare attivo.

    **VPS / cloud**

    - **Pro:** sempre acceso, rete stabile, nessun problema di sospensione laptop, più facile da mantenere in esecuzione.
    - **Contro:** spesso headless (usa screenshot), accesso solo ai file remoti, devi usare SSH per aggiornare.

    **Nota specifica OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funzionano tutti bene da un VPS. L'unico vero compromesso è **browser headless** contro finestra visibile. Vedi [Browser](/tools/browser).

    **Scelta predefinita consigliata:** VPS se in passato hai avuto disconnessioni del gateway. La modalità locale è ottima quando usi attivamente il Mac e vuoi accesso ai file locali o automazione UI con un browser visibile.

  </Accordion>

  <Accordion title="Quanto è importante eseguire OpenClaw su una macchina dedicata?">
    Non è obbligatorio, ma **consigliato per affidabilità e isolamento**.

    - **Host dedicato (VPS/Mac mini/Pi):** sempre acceso, meno interruzioni dovute a sospensione/riavvio, permessi più puliti, più facile da mantenere in esecuzione.
    - **Laptop/desktop condiviso:** va benissimo per test e uso attivo, ma aspettati pause quando la macchina va in sospensione o si aggiorna.

    Se vuoi il meglio di entrambi i mondi, tieni il Gateway su un host dedicato e associa il tuo laptop come **node** per strumenti locali di screen/camera/exec. Vedi [Nodes](/nodes).
    Per indicazioni di sicurezza, leggi [Sicurezza](/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i requisiti minimi VPS e il SO consigliato?">
    OpenClaw è leggero. Per un Gateway di base + un canale chat:

    - **Minimo assoluto:** 1 vCPU, 1GB RAM, ~500MB disco.
    - **Consigliato:** 1-2 vCPU, 2GB RAM o più per margine (log, media, canali multipli). Gli strumenti node e l'automazione browser possono richiedere risorse.

    SO: usa **Ubuntu LTS** (o qualsiasi Debian/Ubuntu moderno). Il percorso di installazione Linux è testato soprattutto lì.

    Documentazione: [Linux](/platforms/linux), [Hosting VPS](/vps).

  </Accordion>

  <Accordion title="Posso eseguire OpenClaw in una VM e quali sono i requisiti?">
    Sì. Tratta una VM come un VPS: deve restare sempre accesa, raggiungibile e avere abbastanza
    RAM per il Gateway e gli eventuali canali che abiliti.

    Linee guida di base:

    - **Minimo assoluto:** 1 vCPU, 1GB RAM.
    - **Consigliato:** 2GB RAM o più se esegui più canali, automazione browser o strumenti media.
    - **SO:** Ubuntu LTS o altro Debian/Ubuntu moderno.

    Se sei su Windows, **WSL2 è la configurazione in stile VM più semplice** e ha la miglior compatibilità
    con gli strumenti. Vedi [Windows](/platforms/windows), [Hosting VPS](/vps).
    Se stai eseguendo macOS in una VM, vedi [VM macOS](/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Cos'è OpenClaw?

<AccordionGroup>
  <Accordion title="Cos'è OpenClaw, in un paragrafo?">
    OpenClaw è un assistente AI personale che esegui sui tuoi dispositivi. Risponde sulle superfici di messaggistica che usi già (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e plugin canale bundled come QQ Bot) e può anche fare voce + un Canvas live sulle piattaforme supportate. Il **Gateway** è il piano di controllo sempre attivo; l'assistente è il prodotto.
  </Accordion>

  <Accordion title="Proposta di valore">
    OpenClaw non è "solo un wrapper di Claude". È un **piano di controllo local-first** che ti permette di eseguire un
    assistente capace sul **tuo hardware**, raggiungibile dalle app di chat che usi già, con
    sessioni stateful, memoria e strumenti, senza cedere il controllo dei tuoi flussi di lavoro a un
    SaaS hosted.

    Punti di forza:

    - **I tuoi dispositivi, i tuoi dati:** esegui il Gateway dove vuoi (Mac, Linux, VPS) e mantieni
      workspace + cronologia sessioni in locale.
    - **Canali reali, non una sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ecc.,
      più voce mobile e Canvas sulle piattaforme supportate.
    - **Indipendente dal modello:** usa Anthropic, OpenAI, MiniMax, OpenRouter, ecc., con instradamento
      per agente e failover.
    - **Opzione solo locale:** esegui modelli locali così **tutti i dati possono restare sul tuo dispositivo** se vuoi.
    - **Instradamento multi-agent:** agenti separati per canale, account o task, ciascuno con il proprio
      workspace e valori predefiniti.
    - **Open source e hackable:** ispeziona, estendi e self-host senza lock-in del fornitore.

    Documentazione: [Gateway](/gateway), [Canali](/it/channels), [Multi-agent](/concepts/multi-agent),
    [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="L'ho appena configurato: cosa dovrei fare per prima cosa?">
    Buoni primi progetti:

    - Costruire un sito web (WordPress, Shopify o un semplice sito statico).
    - Prototipare un'app mobile (schema, schermate, piano API).
    - Organizzare file e cartelle (pulizia, naming, tagging).
    - Collegare Gmail e automatizzare riepiloghi o follow-up.

    Può gestire attività grandi, ma funziona meglio quando le dividi in fasi e
    usi sub-agents per lavoro parallelo.

  </Accordion>

  <Accordion title="Quali sono i cinque casi d'uso quotidiani principali per OpenClaw?">
    I vantaggi quotidiani di solito sono:

    - **Briefing personali:** riepiloghi di inbox, calendario e notizie che ti interessano.
    - **Ricerca e stesura:** ricerche rapide, riepiloghi e prime bozze per email o documenti.
    - **Promemoria e follow-up:** solleciti e checklist guidati da cron o heartbeat.
    - **Automazione browser:** compilazione form, raccolta dati e ripetizione di attività web.
    - **Coordinamento cross-device:** invia un task dal telefono, lascia che il Gateway lo esegua su un server e ricevi il risultato in chat.

  </Accordion>

  <Accordion title="OpenClaw può aiutare con lead gen, outreach, annunci e blog per un SaaS?">
    Sì per **ricerca, qualificazione e stesura**. Può analizzare siti, costruire shortlist,
    riassumere prospect e scrivere bozze di outreach o copy per annunci.

    Per **outreach o campagne pubblicitarie**, mantieni una persona nel loop. Evita spam, rispetta le leggi locali e
    le policy delle piattaforme, e controlla tutto prima dell'invio. Il modello più sicuro è far
    scrivere la bozza a OpenClaw e approvarla tu.

    Documentazione: [Sicurezza](/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i vantaggi rispetto a Claude Code per lo sviluppo web?">
    OpenClaw è un **assistente personale** e un livello di coordinamento, non un sostituto dell'IDE. Usa
    Claude Code o Codex per il ciclo di coding diretto più rapido dentro un repo. Usa OpenClaw quando
    vuoi memoria duratura, accesso cross-device e orchestrazione degli strumenti.

    Vantaggi:

    - **Memoria persistente + workspace** tra le sessioni
    - **Accesso multipiattaforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestrazione strumenti** (browser, file, pianificazione, hook)
    - **Gateway sempre attivo** (eseguilo su un VPS, interagisci da ovunque)
    - **Nodes** per browser/schermo/fotocamera/exec locali

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automazione

<AccordionGroup>
  <Accordion title="Come personalizzo le Skills senza sporcare il repo?">
    Usa override gestiti invece di modificare la copia del repo. Metti le tue modifiche in `~/.openclaw/skills/<name>/SKILL.md` (oppure aggiungi una cartella tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json`). La precedenza è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, quindi gli override gestiti vincono comunque sulle Skills bundled senza toccare git. Se hai bisogno che la Skill sia installata globalmente ma visibile solo ad alcuni agenti, tieni la copia condivisa in `~/.openclaw/skills` e controlla la visibilità con `agents.defaults.skills` e `agents.list[].skills`. Solo le modifiche meritevoli di upstream dovrebbero vivere nel repo ed essere inviate come PR.
  </Accordion>

  <Accordion title="Posso caricare Skills da una cartella personalizzata?">
    Sì. Aggiungi directory extra tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json` (precedenza più bassa). La precedenza predefinita è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` installa in `./skills` per impostazione predefinita, che OpenClaw tratta come `<workspace>/skills` alla sessione successiva. Se la Skill deve essere visibile solo a certi agenti, abbinala a `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="Come posso usare modelli diversi per task diversi?">
    Oggi i modelli supportati sono:

    - **Cron jobs**: i job isolati possono impostare un override `model` per job.
    - **Sub-agents**: instradano i task verso agenti separati con modelli predefiniti diversi.
    - **Cambio on-demand**: usa `/model` per cambiare il modello della sessione corrente in qualsiasi momento.

    Vedi [Cron jobs](/it/automation/cron-jobs), [Instradamento Multi-Agent](/concepts/multi-agent), e [Comandi slash](/tools/slash-commands).

  </Accordion>

  <Accordion title="Il bot si blocca durante lavori pesanti. Come faccio a spostare il carico?">
    Usa **sub-agents** per task lunghi o paralleli. I sub-agents girano nella propria sessione,
    restituiscono un riepilogo e mantengono reattiva la chat principale.

    Chiedi al bot di "spawn a sub-agent for this task" oppure usa `/subagents`.
    Usa `/status` in chat per vedere cosa sta facendo il Gateway in questo momento (e se è occupato).

    Suggerimento sui token: sia i task lunghi sia i sub-agents consumano token. Se il costo è un problema, imposta un
    modello più economico per i sub-agents tramite `agents.defaults.subagents.model`.

    Documentazione: [Sub-agents](/tools/subagents), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Come funzionano le sessioni di subagent vincolate al thread su Discord?">
    Usa i binding ai thread. Puoi associare un thread Discord a un subagent o a una destinazione sessione così i messaggi successivi in quel thread restino su quella sessione associata.

    Flusso di base:

    - Avvia con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"` per follow-up persistenti).
    - Oppure associa manualmente con `/focus <target>`.
    - Usa `/agents` per ispezionare lo stato del binding.
    - Usa `/session idle <duration|off>` e `/session max-age <duration|off>` per controllare la rimozione automatica del focus.
    - Usa `/unfocus` per sganciare il thread.

    Config richiesta:

    - Valori predefiniti globali: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind allo spawn: imposta `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentazione: [Sub-agents](/tools/subagents), [Discord](/it/channels/discord), [Riferimento configurazione](/gateway/configuration-reference), [Comandi slash](/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagent ha finito, ma l'aggiornamento di completamento è andato nel posto sbagliato o non è mai stato pubblicato. Cosa dovrei controllare?">
    Controlla prima la route del richiedente risolta:

    - La consegna del subagent in modalità completion preferisce qualunque route di thread o conversazione associata quando esiste.
    - Se l'origine del completion porta solo un canale, OpenClaw usa come fallback la route memorizzata della sessione del richiedente (`lastChannel` / `lastTo` / `lastAccountId`) così la consegna diretta può ancora riuscire.
    - Se non esiste né una route associata né una route memorizzata utilizzabile, la consegna diretta può fallire e il risultato torna alla consegna in coda della sessione invece di pubblicare subito in chat.
    - Target non validi o obsoleti possono comunque forzare il fallback in coda o il fallimento finale della consegna.
    - Se l'ultima risposta assistant visibile del figlio è esattamente il token silenzioso `NO_REPLY` / `no_reply`, oppure esattamente `ANNOUNCE_SKIP`, OpenClaw sopprime intenzionalmente l'annuncio invece di pubblicare progressi precedenti ormai obsoleti.
    - Se il figlio è andato in timeout dopo sole tool call, l'annuncio può ridurre tutto a un breve riepilogo di avanzamento parziale invece di riprodurre l'output grezzo degli strumenti.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Sub-agents](/tools/subagents), [Attività in background](/it/automation/tasks), [Strumenti sessione](/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o i promemoria non partono. Cosa dovrei controllare?">
    Cron gira all'interno del processo Gateway. Se il Gateway non è in esecuzione continua,
    i job pianificati non verranno eseguiti.

    Checklist:

    - Conferma che cron sia abilitato (`cron.enabled`) e che `OPENCLAW_SKIP_CRON` non sia impostato.
    - Controlla che il Gateway sia in esecuzione 24/7 (senza sospensioni/riavvii).
    - Verifica le impostazioni del fuso orario per il job (`--tz` rispetto al fuso dell'host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentazione: [Cron jobs](/it/automation/cron-jobs), [Automazione e attività](/it/automation).

  </Accordion>

  <Accordion title="Cron è partito, ma non è stato inviato nulla al canale. Perché?">
    Controlla prima la modalità di consegna:

    - `--no-deliver` / `delivery.mode: "none"` significa che non è previsto alcun messaggio esterno.
    - Target announce mancante o non valido (`channel` / `to`) significa che il runner ha saltato la consegna in uscita.
    - Errori di autenticazione del canale (`unauthorized`, `Forbidden`) significano che il runner ha provato a consegnare ma le credenziali lo hanno bloccato.
    - Un risultato isolato silenzioso (`NO_REPLY` / `no_reply` soltanto) viene trattato come intenzionalmente non consegnabile, quindi il runner sopprime anche la consegna di fallback in coda.

    Per i job cron isolati, il runner possiede la consegna finale. L'agente dovrebbe
    restituire un riepilogo in testo semplice che il runner possa inviare. `--no-deliver` mantiene
    quel risultato interno; non consente all'agente di inviare direttamente con il
    message tool.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Cron jobs](/it/automation/cron-jobs), [Attività in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Perché un'esecuzione cron isolata ha cambiato modello o riprovato una volta?">
    Di solito è il percorso di cambio modello live, non una schedulazione duplicata.

    Il cron isolato può persistere un handoff del modello runtime e ritentare quando l'esecuzione attiva
    lancia `LiveSessionModelSwitchError`. Il tentativo successivo mantiene il
    provider/modello cambiato e, se il cambio includeva un nuovo override del profilo auth, cron
    persiste anche quello prima di ritentare.

    Regole di selezione correlate:

    - L'override del modello dell'hook Gmail ha priorità quando applicabile.
    - Poi il `model` per job.
    - Poi qualsiasi override modello memorizzato della sessione cron.
    - Poi la normale selezione del modello predefinito dell'agente.

    Il ciclo di retry è limitato. Dopo il tentativo iniziale più 2 retry di cambio,
    cron interrompe invece di continuare all'infinito.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Cron jobs](/it/automation/cron-jobs), [CLI cron](/cli/cron).

  </Accordion>

  <Accordion title="Come installo Skills su Linux?">
    Usa i comandi nativi `openclaw skills` oppure inserisci le Skills nel workspace. L'interfaccia Skills macOS non è disponibile su Linux.
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
    sincronizzare le tue Skills. Per installazioni condivise tra agenti, metti la Skill in
    `~/.openclaw/skills` e usa `agents.defaults.skills` o
    `agents.list[].skills` se vuoi limitare quali agenti possono vederla.

  </Accordion>

  <Accordion title="OpenClaw può eseguire task secondo una pianificazione o continuamente in background?">
    Sì. Usa lo scheduler del Gateway:

    - **Cron jobs** per attività pianificate o ricorrenti (persistono ai riavvii).
    - **Heartbeat** per controlli periodici della "sessione principale".
    - **Job isolati** per agenti autonomi che pubblicano riepiloghi o consegnano nelle chat.

    Documentazione: [Cron jobs](/it/automation/cron-jobs), [Automazione e attività](/it/automation),
    [Heartbeat](/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso eseguire Skills Apple solo macOS da Linux?">
    Non direttamente. Le Skills macOS sono controllate da `metadata.openclaw.os` più i binari richiesti, e le Skills compaiono nel prompt di sistema solo quando sono idonee sull'**host Gateway**. Su Linux, le Skills `darwin`-only (come `apple-notes`, `apple-reminders`, `things-mac`) non verranno caricate a meno che tu non aggiri il controllo.

    Hai tre modelli supportati:

    **Opzione A - eseguire il Gateway su un Mac (più semplice).**
    Esegui il Gateway dove esistono i binari macOS, poi collegati da Linux in [modalità remota](#gateway-ports-already-running-and-remote-mode) o tramite Tailscale. Le Skills vengono caricate normalmente perché l'host Gateway è macOS.

    **Opzione B - usare un nodo macOS (senza SSH).**
    Esegui il Gateway su Linux, associa un nodo macOS (app menubar) e imposta **Node Run Commands** su "Always Ask" o "Always Allow" sul Mac. OpenClaw può trattare le Skills solo macOS come idonee quando i binari richiesti esistono sul nodo. L'agente esegue quelle Skills tramite lo strumento `nodes`. Se scegli "Always Ask", approvare "Always Allow" nel prompt aggiunge quel comando all'allowlist.

    **Opzione C - proxy dei binari macOS via SSH (avanzato).**
    Tieni il Gateway su Linux, ma fai in modo che i binari CLI richiesti si risolvano in wrapper SSH che girano su un Mac. Poi sovrascrivi la Skill per consentire Linux così resta idonea.

    1. Crea un wrapper SSH per il binario (esempio: `memo` per Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Metti il wrapper nel `PATH` sull'host Linux (ad esempio `~/bin/memo`).
    3. Sovrascrivi i metadati della Skill (workspace o `~/.openclaw/skills`) per consentire Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Avvia una nuova sessione così si aggiorni l'istantanea delle Skills.

  </Accordion>

  <Accordion title="Avete un'integrazione Notion o HeyGen?">
    Non integrata oggi.

    Opzioni:

    - **Skill / plugin personalizzato:** migliore per accesso API affidabile (sia Notion sia HeyGen hanno API).
    - **Automazione browser:** funziona senza codice ma è più lenta e più fragile.

    Se vuoi mantenere contesto per cliente (flussi agency), uno schema semplice è:

    - Una pagina Notion per cliente (contesto + preferenze + lavoro attivo).
    - Chiedi all'agente di recuperare quella pagina all'inizio di una sessione.

    Se vuoi un'integrazione nativa, apri una richiesta di funzionalità o costruisci una Skill
    che usi quelle API.

    Installa Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Le installazioni native finiscono nella directory `skills/` del workspace attivo. Per Skills condivise tra agenti, posizionale in `~/.openclaw/skills/<name>/SKILL.md`. Se solo alcuni agenti devono vedere un'installazione condivisa, configura `agents.defaults.skills` o `agents.list[].skills`. Alcune Skills si aspettano binari installati via Homebrew; su Linux questo significa Linuxbrew (vedi la voce FAQ Homebrew Linux sopra). Vedi [Skills](/tools/skills), [Config Skills](/tools/skills-config), e [ClawHub](/tools/clawhub).

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

    Questo percorso è locale all'host. Se il Gateway gira altrove, esegui un node host sulla macchina del browser oppure usa CDP remoto.

    Limiti attuali di `existing-session` / `user`:

    - le azioni sono guidate da ref, non da selettori CSS
    - gli upload richiedono `ref` / `inputRef` e attualmente supportano un file alla volta
    - `responsebody`, esportazione PDF, intercettazione dei download e azioni batch richiedono ancora un browser gestito o un profilo CDP grezzo

  </Accordion>
</AccordionGroup>

## Sandbox e memory

<AccordionGroup>
  <Accordion title="Esiste una documentazione dedicata al sandboxing?">
    Sì. Vedi [Sandboxing](/gateway/sandboxing). Per la configurazione specifica Docker (gateway completo in Docker o immagini sandbox), vedi [Docker](/install/docker).
  </Accordion>

  <Accordion title="Docker sembra limitato: come abilito le funzionalità complete?">
    L'immagine predefinita mette la sicurezza al primo posto e gira come utente `node`, quindi non
    include pacchetti di sistema, Homebrew o browser bundled. Per una configurazione più completa:

    - Rendi persistente `/home/node` con `OPENCLAW_HOME_VOLUME` così le cache sopravvivono.
    - Inserisci le dipendenze di sistema nell'immagine con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installa i browser Playwright tramite la CLI bundled:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Imposta `PLAYWRIGHT_BROWSERS_PATH` e assicurati che il percorso sia persistente.

    Documentazione: [Docker](/install/docker), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Posso mantenere i DM personali ma rendere i gruppi pubblici/sandboxed con un solo agente?">
    Sì, se il tuo traffico privato è nei **DM** e quello pubblico nei **gruppi**.

    Usa `agents.defaults.sandbox.mode: "non-main"` così le sessioni di gruppo/canale (chiavi non principali) girano in Docker, mentre la sessione DM principale resta sull'host. Poi limita quali strumenti sono disponibili nelle sessioni sandbox con `tools.sandbox.tools`.

    Guida + esempio config: [Gruppi: DM personali + gruppi pubblici](/it/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Riferimento config chiave: [Configurazione gateway](/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Come faccio a montare una cartella host nel sandbox?">
    Imposta `agents.defaults.sandbox.docker.binds` su `["host:path:mode"]` (es. `"/home/user/src:/src:ro"`). I bind globali + per agente vengono uniti; i bind per agente vengono ignorati quando `scope: "shared"`. Usa `:ro` per qualunque elemento sensibile e ricorda che i bind aggirano le barriere del filesystem del sandbox.

    OpenClaw valida le sorgenti dei bind sia rispetto al percorso normalizzato sia al percorso canonico risolto attraverso l'antenato esistente più profondo. Ciò significa che le fughe tramite symlink-parent continuano a fallire in modalità fail-closed anche quando l'ultimo segmento del percorso non esiste ancora, e i controlli sulle radici consentite continuano ad applicarsi dopo la risoluzione dei symlink.

    Vedi [Sandboxing](/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) per esempi e note di sicurezza.

  </Accordion>

  <Accordion title="Come funziona la memoria?">
    La memory di OpenClaw è semplicemente costituita da file Markdown nel workspace dell'agente:

    - Note giornaliere in `memory/YYYY-MM-DD.md`
    - Note curate a lungo termine in `MEMORY.md` (solo sessioni principali/private)

    OpenClaw esegue anche un **flush silenzioso della memory pre-compattazione** per ricordare al modello
    di scrivere note durature prima della compattazione automatica. Questo avviene solo quando il workspace
    è scrivibile (i sandbox in sola lettura lo saltano). Vedi [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="La memoria continua a dimenticare cose. Come faccio a fissarle?">
    Chiedi al bot di **scrivere il fatto nella memory**. Le note a lungo termine vanno in `MEMORY.md`,
    il contesto a breve termine va in `memory/YYYY-MM-DD.md`.

    È ancora un'area che stiamo migliorando. Aiuta ricordare al modello di salvare ricordi;
    saprà cosa fare. Se continua a dimenticare, verifica che il Gateway stia usando lo stesso
    workspace a ogni esecuzione.

    Documentazione: [Memory](/concepts/memory), [Workspace dell'agente](/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La memoria persiste per sempre? Quali sono i limiti?">
    I file di memoria vivono su disco e persistono finché non li elimini. Il limite è il tuo
    storage, non il modello. Il **contesto di sessione** è comunque limitato dalla finestra di contesto
    del modello, quindi conversazioni lunghe possono compattarsi o troncarsi. Ecco perché
    esiste la ricerca nella memoria: riporta nel contesto solo le parti rilevanti.

    Documentazione: [Memory](/concepts/memory), [Contesto](/concepts/context).

  </Accordion>

  <Accordion title="La ricerca semantica della memoria richiede una chiave API OpenAI?">
    Solo se usi **embedding OpenAI**. L'OAuth Codex copre chat/completions e
    **non** concede accesso agli embeddings, quindi **accedere con Codex (OAuth o login
    Codex CLI)** non aiuta per la ricerca semantica della memoria. Gli embeddings OpenAI
    richiedono ancora una vera chiave API (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Se non imposti esplicitamente un provider, OpenClaw seleziona automaticamente un provider quando
    riesce a risolvere una chiave API (profili auth, `models.providers.*.apiKey` o variabili env).
    Preferisce OpenAI se si risolve una chiave OpenAI, altrimenti Gemini se si
    risolve una chiave Gemini, poi Voyage, poi Mistral. Se non è disponibile nessuna chiave remota, la ricerca
    nella memoria resta disabilitata finché non la configuri. Se hai configurato e reso disponibile
    un percorso di modello locale, OpenClaw
    preferisce `local`. Ollama è supportato quando imposti esplicitamente
    `memorySearch.provider = "ollama"`.

    Se preferisci restare in locale, imposta `memorySearch.provider = "local"` (e facoltativamente
    `memorySearch.fallback = "none"`). Se vuoi embedding Gemini, imposta
    `memorySearch.provider = "gemini"` e fornisci `GEMINI_API_KEY` (oppure
    `memorySearch.remote.apiKey`). Supportiamo modelli di embedding **OpenAI, Gemini, Voyage, Mistral, Ollama o local**:
    vedi [Memory](/concepts/memory) per i dettagli di configurazione.

  </Accordion>
</AccordionGroup>

## Dove si trova tutto su disco

<AccordionGroup>
  <Accordion title="Tutti i dati usati con OpenClaw vengono salvati in locale?">
    No: **lo stato di OpenClaw è locale**, ma **i servizi esterni vedono comunque ciò che gli invii**.

    - **Locale per impostazione predefinita:** sessioni, file di memoria, config e workspace vivono sull'host del Gateway
      (`~/.openclaw` + la tua directory workspace).
    - **Remoto per necessità:** i messaggi che invii ai provider di modelli (Anthropic/OpenAI/ecc.) vanno alle
      loro API, e le piattaforme chat (WhatsApp/Telegram/Slack/ecc.) memorizzano i dati dei messaggi sui
      propri server.
    - **Tu controlli l'impronta:** usare modelli locali mantiene i prompt sulla tua macchina, ma il
      traffico del canale passa comunque attraverso i server del canale.

    Correlati: [Workspace dell'agente](/concepts/agent-workspace), [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="Dove memorizza i dati OpenClaw?">
    Tutto vive sotto `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`):

    | Path                                                            | Scopo                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Config principale (JSON5)                                          |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import OAuth legacy (copiato nei profili auth al primo utilizzo)   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profili auth (OAuth, chiavi API e opzionali `keyRef`/`tokenRef`)   |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload segreti facoltativo basato su file per provider `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File di compatibilità legacy (voci statiche `api_key` rimosse)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stato provider (es. `whatsapp/<accountId>/creds.json`)             |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stato per agente (agentDir + sessioni)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Cronologia conversazioni e stato (per agente)                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadati sessione (per agente)                                     |

    Percorso legacy single-agent: `~/.openclaw/agent/*` (migrato da `openclaw doctor`).

    Il tuo **workspace** (AGENTS.md, file memory, Skills, ecc.) è separato e configurato tramite `agents.defaults.workspace` (predefinito: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Dove dovrebbero stare AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Questi file vivono nel **workspace dell'agente**, non in `~/.openclaw`.

    - **Workspace (per agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (o il fallback legacy `memory.md` quando `MEMORY.md` è assente),
      `memory/YYYY-MM-DD.md`, facoltativamente `HEARTBEAT.md`.
    - **Directory di stato (`~/.openclaw`)**: config, stato canale/provider, profili auth, sessioni, log,
      e Skills condivise (`~/.openclaw/skills`).

    Il workspace predefinito è `~/.openclaw/workspace`, configurabile tramite:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se il bot "dimentica" dopo un riavvio, conferma che il Gateway stia usando lo stesso
    workspace a ogni avvio (e ricorda: la modalità remota usa il workspace dell'**host gateway**,
    non quello del tuo laptop locale).

    Suggerimento: se vuoi un comportamento o una preferenza duraturi, chiedi al bot di **scriverli in
    AGENTS.md o MEMORY.md** invece di affidarti alla cronologia della chat.

    Vedi [Workspace dell'agente](/concepts/agent-workspace) e [Memory](/concepts/memory).

  </Accordion>

  <Accordion title="Strategia di backup consigliata">
    Metti il tuo **workspace dell'agente** in un repo git **privato** e fanne il backup da qualche parte
    in privato (ad esempio GitHub privato). Questo cattura memory + file AGENTS/SOUL/USER
    e ti permette di ripristinare più tardi la "mente" dell'assistente.

    **Non** fare commit di nulla sotto `~/.openclaw` (credenziali, sessioni, token o payload segreti cifrati).
    Se ti serve un ripristino completo, esegui separatamente il backup sia del workspace sia della directory di stato
    (vedi la domanda sulla migrazione sopra).

    Documentazione: [Workspace dell'agente](/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Come disinstallo completamente OpenClaw?">
    Vedi la guida dedicata: [Disinstallazione](/install/uninstall).
  </Accordion>

  <Accordion title="Gli agenti possono lavorare fuori dal workspace?">
    Sì. Il workspace è il **cwd predefinito** e l'ancora della memory, non un sandbox rigido.
    I percorsi relativi si risolvono nel workspace, ma i percorsi assoluti possono accedere ad altre
    posizioni dell'host a meno che il sandboxing non sia abilitato. Se hai bisogno di isolamento, usa
    [`agents.defaults.sandbox`](/gateway/sandboxing) o impostazioni sandbox per agente. Se vuoi
    che un repo sia la directory di lavoro predefinita, punta il `workspace`
    di quell'agente alla root del repo. Il repo OpenClaw è solo codice sorgente; mantieni il
    workspace separato a meno che tu non voglia intenzionalmente che l'agente lavori al suo interno.

    Esempio (repo come cwd predefinita):

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
    Lo stato della sessione appartiene all'**host gateway**. Se sei in modalità remota, l'archivio sessioni che ti interessa è sulla macchina remota, non sul tuo laptop locale. Vedi [Gestione delle sessioni](/concepts/session).
  </Accordion>
</AccordionGroup>

## Basi della config

<AccordionGroup>
  <Accordion title="Che formato ha la config? Dov'è?">
    OpenClaw legge una config facoltativa in **JSON5** da `$OPENCLAW_CONFIG_PATH` (predefinito: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se il file manca, usa valori predefiniti abbastanza sicuri (incluso un workspace predefinito `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ho impostato gateway.bind: "lan" (o "tailnet") e ora non ascolta nulla / la UI dice unauthorized'>
    I bind non-loopback **richiedono un percorso di auth gateway valido**. In pratica significa:

    - autenticazione con segreto condiviso: token o password
    - `gateway.auth.mode: "trusted-proxy"` dietro un reverse proxy identity-aware non-loopback configurato correttamente

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
    - Per l'autenticazione password, imposta invece `gateway.auth.mode: "password"` più `gateway.auth.password` (oppure `OPENCLAW_GATEWAY_PASSWORD`).
    - Se `gateway.auth.token` / `gateway.auth.password` sono configurati esplicitamente tramite SecretRef e non risolti, la risoluzione fallisce in modalità fail-closed (nessun fallback remoto che mascheri).
    - Le configurazioni Control UI con segreto condiviso si autenticano tramite `connect.params.auth.token` o `connect.params.auth.password` (memorizzati nelle impostazioni app/UI). Le modalità che portano identità come Tailscale Serve o `trusted-proxy` usano invece header della richiesta. Evita di mettere segreti condivisi negli URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, i reverse proxy loopback sullo stesso host **non** soddisfano comunque l'autenticazione trusted-proxy. Il proxy fidato deve essere una sorgente non-loopback configurata.

  </Accordion>

  <Accordion title="Perché ora mi serve un token anche su localhost?">
    OpenClaw applica l'auth gateway per impostazione predefinita, incluso il loopback. Nel percorso predefinito normale significa autenticazione token: se non è configurato alcun percorso auth esplicito, l'avvio del gateway si risolve in modalità token e ne genera automaticamente uno, salvandolo in `gateway.auth.token`, quindi **i client WS locali devono autenticarsi**. Questo impedisce ad altri processi locali di chiamare il Gateway.

    Se preferisci un altro percorso auth, puoi scegliere esplicitamente la modalità password (oppure, per reverse proxy identity-aware non-loopback, `trusted-proxy`). Se **davvero** vuoi loopback aperto, imposta esplicitamente `gateway.auth.mode: "none"` nella tua config. Doctor può generarti un token in qualsiasi momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Devo riavviare dopo aver cambiato la config?">
    Il Gateway osserva la config e supporta hot-reload:

    - `gateway.reload.mode: "hybrid"` (predefinito): hot-apply delle modifiche sicure, riavvio per quelle critiche
    - sono supportati anche `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Come disabilito i tagline buffi della CLI?">
    Imposta `cli.banner.taglineMode` nella config:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: nasconde il testo tagline ma mantiene la riga del titolo/versione del banner.
    - `default`: usa sempre `All your chats, one OpenClaw.`.
    - `random`: tagline divertenti/stagionali a rotazione (comportamento predefinito).
    - Se non vuoi nessun banner, imposta la env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Come abilito la ricerca web (e il web fetch)?">
    `web_fetch` funziona senza una chiave API. `web_search` dipende dal
    provider selezionato:

    - Provider basati su API come Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity e Tavily richiedono la normale configurazione della chiave API.
    - Ollama Web Search non richiede chiavi, ma usa l'host Ollama configurato e richiede `ollama signin`.
    - DuckDuckGo non richiede chiavi, ma è un'integrazione non ufficiale basata su HTML.
    - SearXNG non richiede chiavi/è self-hosted; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Consigliato:** esegui `openclaw configure --section web` e scegli un provider.
    Alternative environment:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` o `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, o `MINIMAX_API_KEY`
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
              provider: "firecrawl", // facoltativo; ometti per auto-rilevamento
            },
          },
        },
    }
    ```

    La config specifica del provider per web-search ora vive sotto `plugins.entries.<plugin>.config.webSearch.*`.
    I percorsi provider legacy `tools.web.search.*` continuano a essere caricati temporaneamente per compatibilità, ma non dovrebbero essere usati per nuove config.
    La config di fallback Firecrawl web-fetch vive sotto `plugins.entries.firecrawl.config.webFetch.*`.

    Note:

    - Se usi allowlist, aggiungi `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` è abilitato per impostazione predefinita (a meno che non sia esplicitamente disabilitato).
    - Se `tools.web.fetch.provider` è omesso, OpenClaw auto-rileva il primo provider di fallback fetch pronto dalle credenziali disponibili. Oggi il provider bundled è Firecrawl.
    - I daemon leggono le variabili env da `~/.openclaw/.env` (o dall'ambiente del servizio).

    Documentazione: [Strumenti web](/tools/web).

  </Accordion>

  <Accordion title="config.apply ha cancellato la mia config. Come recupero ed evito che succeda di nuovo?">
    `config.apply` sostituisce l'**intera config**. Se invii un oggetto parziale, tutto il resto
    viene rimosso.

    Recupero:

    - Ripristina da backup (git o una copia di `~/.openclaw/openclaw.json`).
    - Se non hai backup, riesegui `openclaw doctor` e riconfigura canali/modelli.
    - Se è stato inatteso, segnala un bug e includi l'ultima config nota o eventuali backup.
    - Un agente locale di coding spesso può ricostruire una config funzionante da log o cronologia.

    Per evitarlo:

    - Usa `openclaw config set` per piccole modifiche.
    - Usa `openclaw configure` per modifiche interattive.
    - Usa prima `config.schema.lookup` quando non sei sicuro di un percorso o della forma esatta di un campo; restituisce un nodo schema superficiale più riepiloghi immediati dei figli per approfondire.
    - Usa `config.patch` per modifiche RPC parziali; tieni `config.apply` solo per la sostituzione completa della config.
    - Se stai usando lo strumento `gateway` owner-only da un'esecuzione agente, continuerà a rifiutare scritture su `tools.exec.ask` / `tools.exec.security` (incluse gli alias legacy `tools.bash.*` che si normalizzano agli stessi percorsi exec protetti).

    Documentazione: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/gateway/doctor).

  </Accordion>

  <Accordion title="Come faccio a eseguire un Gateway centrale con worker specializzati su più dispositivi?">
    Il modello comune è **un Gateway** (ad es. Raspberry Pi) più **nodes** e **agenti**:

    - **Gateway (centrale):** possiede canali (Signal/WhatsApp), instradamento e sessioni.
    - **Nodes (dispositivi):** Mac/iOS/Android si connettono come periferiche ed espongono strumenti locali (`system.run`, `canvas`, `camera`).
    - **Agenti (worker):** cervelli/workspace separati per ruoli speciali (es. "Hetzner ops", "Personal data").
    - **Sub-agents:** avviano lavoro in background da un agente principale quando vuoi parallelismo.
    - **TUI:** si connette al Gateway e cambia agenti/sessioni.

    Documentazione: [Nodes](/nodes), [Accesso remoto](/gateway/remote), [Instradamento Multi-Agent](/concepts/multi-agent), [Sub-agents](/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Il browser OpenClaw può girare headless?">
    Sì. È un'opzione di config:

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

    Il valore predefinito è `false` (headful). L'headless ha più probabilità di attivare controlli anti-bot su alcuni siti. Vedi [Browser](/tools/browser).

    L'headless usa lo **stesso motore Chromium** e funziona per la maggior parte dell'automazione (form, click, scraping, login). Le differenze principali:

    - Nessuna finestra browser visibile (usa screenshot se ti servono elementi visivi).
    - Alcuni siti sono più rigidi con l'automazione in modalità headless (CAPTCHA, anti-bot).
      Ad esempio, X/Twitter spesso blocca le sessioni headless.

  </Accordion>

  <Accordion title="Come uso Brave per il controllo del browser?">
    Imposta `browser.executablePath` sul binario Brave (o qualunque browser basato su Chromium) e riavvia il Gateway.
    Vedi gli esempi completi di config in [Browser](/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway remoti e nodes

<AccordionGroup>
  <Accordion title="Come si propagano i comandi tra Telegram, il gateway e i nodes?">
    I messaggi Telegram sono gestiti dal **gateway**. Il gateway esegue l'agente e
    solo allora chiama i nodes sul **Gateway WebSocket** quando serve uno strumento node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    I nodes non vedono il traffico provider in ingresso; ricevono solo chiamate RPC node.

  </Accordion>

  <Accordion title="Come può il mio agente accedere al mio computer se il Gateway è ospitato in remoto?">
    In breve: **associa il tuo computer come node**. Il Gateway gira altrove, ma può
    chiamare strumenti `node.*` (schermo, fotocamera, sistema) sulla tua macchina locale tramite il Gateway WebSocket.

    Configurazione tipica:

    1. Esegui il Gateway sull'host sempre attivo (VPS/server domestico).
    2. Metti l'host Gateway + il tuo computer sulla stessa tailnet.
    3. Assicurati che il Gateway WS sia raggiungibile (bind tailnet o tunnel SSH).
    4. Apri l'app macOS in modalità **Remote over SSH** (o tailnet diretta)
       così possa registrarsi come node.
    5. Approva il node sul Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Non serve alcun bridge TCP separato; i nodes si collegano tramite il Gateway WebSocket.

    Promemoria di sicurezza: associare un nodo macOS consente `system.run` su quella macchina. Associa
    solo dispositivi di cui ti fidi e consulta [Sicurezza](/gateway/security).

    Documentazione: [Nodes](/nodes), [Protocollo Gateway](/gateway/protocol), [Modalità remota macOS](/platforms/mac/remote), [Sicurezza](/gateway/security).

  </Accordion>

  <Accordion title="Tailscale è connesso ma non ricevo risposte. E adesso?">
    Controlla le basi:

    - Il Gateway è in esecuzione: `openclaw gateway status`
    - Stato del Gateway: `openclaw status`
    - Stato del canale: `openclaw channels status`

    Poi verifica auth e instradamento:

    - Se usi Tailscale Serve, assicurati che `gateway.auth.allowTailscale` sia impostato correttamente.
    - Se ti colleghi via tunnel SSH, conferma che il tunnel locale sia attivo e punti alla porta corretta.
    - Conferma che le tue allowlist (DM o gruppo) includano il tuo account.

    Documentazione: [Tailscale](/gateway/tailscale), [Accesso remoto](/gateway/remote), [Canali](/it/channels).

  </Accordion>

  <Accordion title="Due istanze OpenClaw possono parlarsi tra loro (locale + VPS)?">
    Sì. Non esiste un bridge "bot-to-bot" integrato, ma puoi cablarlo in alcuni
    modi affidabili:

    **Più semplice:** usa un normale canale chat a cui entrambi i bot possono accedere (Telegram/Slack/WhatsApp).
    Fai in modo che il Bot A invii un messaggio al Bot B, poi lascia che il Bot B risponda come di consueto.

    **Bridge CLI (generico):** esegui uno script che chiama l'altro Gateway con
    `openclaw agent --message ... --deliver`, indirizzandolo a una chat dove l'altro bot
    è in ascolto. Se uno dei bot è su un VPS remoto, punta la tua CLI a quel Gateway remoto
    tramite SSH/Tailscale (vedi [Accesso remoto](/gateway/remote)).

    Schema di esempio (esegui da una macchina che può raggiungere il Gateway di destinazione):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Suggerimento: aggiungi una guardrail così i due bot non vanno in loop infinito (solo mention,
    allowlist dei canali o una regola "non rispondere ai messaggi del bot").

    Documentazione: [Accesso remoto](/gateway/remote), [CLI Agent](/cli/agent), [Agent send](/tools/agent-send).

  </Accordion>

  <Accordion title="Mi servono VPS separati per più agenti?">
    No. Un Gateway può ospitare più agenti, ciascuno con il proprio workspace, modelli predefiniti
    e instradamento. È la configurazione normale ed è molto più economica e semplice che eseguire
    un VPS per agente.

    Usa VPS separati solo quando ti serve isolamento rigido (confini di sicurezza) o config molto
    diverse che non vuoi condividere. Altrimenti mantieni un solo Gateway e
    usa più agenti o sub-agents.

  </Accordion>

  <Accordion title="C'è un vantaggio nell'usare un node sul mio laptop personale invece di SSH da un VPS?">
    Sì: i nodes sono il modo di prima classe per raggiungere il tuo laptop da un Gateway remoto, e
    sbloccano molto più del semplice accesso shell. Il Gateway gira su macOS/Linux (Windows via WSL2) ed è
    leggero (va bene un piccolo VPS o una macchina di classe Raspberry Pi; 4 GB di RAM sono più che sufficienti), quindi una configurazione
    comune è un host sempre attivo più il tuo laptop come node.

    - **Nessun SSH in ingresso richiesto.** I nodes si collegano in uscita al Gateway WebSocket e usano il pairing dei dispositivi.
    - **Controlli di esecuzione più sicuri.** `system.run` è protetto da allowlist/approvazioni node su quel laptop.
    - **Più strumenti dispositivo.** I nodes espongono `canvas`, `camera` e `screen` oltre a `system.run`.
    - **Automazione browser locale.** Tieni il Gateway su un VPS, ma esegui Chrome localmente tramite un node host sul laptop, oppure collegati a Chrome locale sull'host tramite Chrome MCP.

    SSH va bene per accesso shell ad hoc, ma i nodes sono più semplici per flussi di lavoro continui dell'agente e
    automazione dei dispositivi.

    Documentazione: [Nodes](/nodes), [CLI Nodes](/cli/nodes), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="I nodes eseguono un servizio gateway?">
    No. Dovrebbe essere in esecuzione un solo **gateway** per host, a meno che tu non stia eseguendo intenzionalmente profili isolati (vedi [Gateway multipli](/gateway/multiple-gateways)). I nodes sono periferiche che si collegano
    al gateway (nodes iOS/Android, o "node mode" macOS nell'app menubar). Per host node headless
    e controllo via CLI, vedi [CLI Node host](/cli/node).

    È richiesto un riavvio completo per modifiche a `gateway`, `discovery` e `canvasHost`.

  </Accordion>

  <Accordion title="Esiste un modo API / RPC per applicare la config?">
    Sì.

    - `config.schema.lookup`: ispeziona un sottoalbero di config con il relativo nodo di schema superficiale, hint UI corrispondente e riepiloghi immediati dei figli prima della scrittura
    - `config.get`: recupera l'istantanea corrente + hash
    - `config.patch`: aggiornamento parziale sicuro (preferito per la maggior parte delle modifiche RPC)
    - `config.apply`: valida + sostituisce l'intera config, poi riavvia
    - Lo strumento runtime `gateway` owner-only continua a rifiutare la riscrittura di `tools.exec.ask` / `tools.exec.security`; gli alias legacy `tools.bash.*` si normalizzano agli stessi percorsi exec protetti

  </Accordion>

  <Accordion title="Config minima sensata per una prima installazione">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Questo imposta il workspace e limita chi può attivare il bot.

  </Accordion>

  <Accordion title="Come configuro Tailscale su un VPS e mi collego dal Mac?">
    Passaggi minimi:

    1. **Installa + accedi sul VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Installa + accedi sul Mac**
       - Usa l'app Tailscale ed effettua l'accesso alla stessa tailnet.
    3. **Abilita MagicDNS (consigliato)**
       - Nella console amministrativa Tailscale, abilita MagicDNS così il VPS avrà un nome stabile.
    4. **Usa il nome host tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se vuoi la Control UI senza SSH, usa Tailscale Serve sul VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Questo mantiene il gateway in bind su loopback ed espone HTTPS via Tailscale. Vedi [Tailscale](/gateway/tailscale).

  </Accordion>

  <Accordion title="Come collego un nodo Mac a un Gateway remoto (Tailscale Serve)?">
    Serve espone la **Control UI + WS del Gateway**. I nodes si collegano allo stesso endpoint Gateway WS.

    Configurazione consigliata:

    1. **Assicurati che VPS + Mac siano sulla stessa tailnet**.
    2. **Usa l'app macOS in modalità Remote** (il target SSH può essere il nome host tailnet).
       L'app tunnelizzerà la porta Gateway e si collegherà come node.
    3. **Approva il node** sul gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentazione: [Protocollo Gateway](/gateway/protocol), [Discovery](/gateway/discovery), [Modalità remota macOS](/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dovrei installarlo su un secondo laptop o semplicemente aggiungere un node?">
    Se ti servono solo **strumenti locali** (schermo/fotocamera/exec) sul secondo laptop, aggiungilo come
    **node**. In questo modo mantieni un solo Gateway ed eviti config duplicate. Gli strumenti node locali sono
    attualmente solo macOS, ma prevediamo di estenderli ad altri sistemi operativi.

    Installa un secondo Gateway solo quando ti serve **isolamento rigido** o due bot completamente separati.

    Documentazione: [Nodes](/nodes), [CLI Nodes](/cli/nodes), [Gateway multipli](/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variabili env e caricamento .env

<AccordionGroup>
  <Accordion title="Come carica le variabili environment OpenClaw?">
    OpenClaw legge le variabili env dal processo padre (shell, launchd/systemd, CI, ecc.) e in aggiunta carica:

    - `.env` dalla directory di lavoro corrente
    - un `.env` globale di fallback da `~/.openclaw/.env` (ovvero `$OPENCLAW_STATE_DIR/.env`)

    Nessuno dei due file `.env` sovrascrive variabili env già esistenti.

    Puoi anche definire variabili env inline nella config (applicate solo se mancanti nel process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Vedi [/environment](/help/environment) per precedenza e sorgenti complete.

  </Accordion>

  <Accordion title="Ho avviato il Gateway tramite il servizio e le mie variabili env sono sparite. E adesso?">
    Due soluzioni comuni:

    1. Metti le chiavi mancanti in `~/.openclaw/.env` così vengono raccolte anche quando il servizio non eredita l'env della tua shell.
    2. Abilita l'import della shell (comodità opzionale):

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

    Questo esegue la tua shell di login e importa solo le chiavi previste mancanti (non sovrascrive mai). Equivalenti env:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ho impostato COPILOT_GITHUB_TOKEN, ma models status mostra "Shell env: off." Perché?'>
    `openclaw models status` indica se l'**import della shell env** è abilitato. "Shell env: off"
    **non** significa che le tue variabili env manchino: significa solo che OpenClaw non caricherà
    automaticamente la tua shell di login.

    Se il Gateway gira come servizio (launchd/systemd), non erediterà l'ambiente
    della tua shell. Correggi facendo una di queste cose:

    1. Metti il token in `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Oppure abilita l'import della shell (`env.shellEnv.enabled: true`).
    3. Oppure aggiungilo al tuo blocco `env` nella config (si applica solo se manca).

    Poi riavvia il gateway e ricontrolla:

    ```bash
    openclaw models status
    ```

    I token Copilot vengono letti da `COPILOT_GITHUB_TOKEN` (anche `GH_TOKEN` / `GITHUB_TOKEN`).
    Vedi [/concepts/model-providers](/concepts/model-providers) e [/environment](/help/environment).

  </Accordion>
</AccordionGroup>

## Sessioni e chat multiple

<AccordionGroup>
  <Accordion title="Come avvio una conversazione nuova?">
    Invia `/new` o `/reset` come messaggio autonomo. Vedi [Gestione sessioni](/concepts/session).
  </Accordion>

  <Accordion title="Le sessioni si resettano automaticamente se non invio mai /new?">
    Le sessioni possono scadere dopo `session.idleMinutes`, ma questo è **disabilitato per impostazione predefinita** (predefinito **0**).
    Imposta un valore positivo per abilitare la scadenza per inattività. Quando abilitata, il **messaggio successivo**
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
    Sì, tramite **instradamento multi-agent** e **sub-agents**. Puoi creare un agente
    coordinatore e diversi agenti worker con i propri workspace e modelli.

    Detto questo, è meglio considerarlo un **esperimento divertente**. Consuma molti token e spesso
    è meno efficiente che usare un solo bot con sessioni separate. Il modello tipico che
    immaginiamo è un solo bot con cui parli, con sessioni diverse per lavoro parallelo. Quel
    bot può anche avviare sub-agents quando serve.

    Documentazione: [Instradamento multi-agent](/concepts/multi-agent), [Sub-agents](/tools/subagents), [CLI Agents](/cli/agents).

  </Accordion>

  <Accordion title="Perché il contesto è stato troncato a metà task? Come posso evitarlo?">
    Il contesto della sessione è limitato dalla finestra del modello. Chat lunghe, grandi output di tool o molti
    file possono attivare compattazione o troncamento.

    Cosa aiuta:

    - Chiedi al bot di riassumere lo stato corrente e scriverlo in un file.
    - Usa `/compact` prima di task lunghi e `/new` quando cambi argomento.
    - Tieni il contesto importante nel workspace e chiedi al bot di rileggerlo.
    - Usa sub-agents per lavoro lungo o parallelo così la chat principale resta più piccola.
    - Scegli un modello con una finestra di contesto più ampia se succede spesso.

  </Accordion>

  <Accordion title="Come resetto completamente OpenClaw ma lo lascio installato?">
    Usa il comando reset:

    ```bash
    openclaw reset
    ```

    Reset completo non interattivo:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Poi riesegui il setup:

    ```bash
    openclaw onboard --install-daemon
    ```

    Note:

    - L'onboarding offre anche **Reset** se vede una config esistente. Vedi [Onboarding (CLI)](/start/wizard).
    - Se hai usato profili (`--profile` / `OPENCLAW_PROFILE`), resetta ogni directory di stato (predefinite `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (solo dev; cancella config dev + credenziali + sessioni + workspace).

  </Accordion>

  <Accordion title='Ricevo errori "context too large": come faccio a resettare o compattare?'>
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

    - Abilita o regola la **potatura della sessione** (`agents.defaults.contextPruning`) per ridurre il vecchio output degli strumenti.
    - Usa un modello con una finestra di contesto più grande.

    Documentazione: [Compattazione](/concepts/compaction), [Potatura della sessione](/concepts/session-pruning), [Gestione sessioni](/concepts/session).

  </Accordion>

  <Accordion title='Perché vedo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Questo è un errore di validazione del provider: il modello ha emesso un blocco `tool_use` senza il campo
    `input` richiesto. Di solito significa che la cronologia della sessione è obsoleta o corrotta (spesso dopo thread lunghi
    o un cambiamento di tool/schema).

    Correzione: avvia una nuova sessione con `/new` (messaggio autonomo).

  </Accordion>

  <Accordion title="Perché ricevo messaggi heartbeat ogni 30 minuti?">
    Gli heartbeat vengono eseguiti ogni **30m** per impostazione predefinita (**1h** quando si usa auth OAuth). Regolali o disabilitali:

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

    Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni markdown
    come `# Heading`), OpenClaw salta l'esecuzione heartbeat per risparmiare chiamate API.
    Se il file manca, l'heartbeat viene comunque eseguito e il modello decide cosa fare.

    Gli override per agente usano `agents.list[].heartbeat`. Documentazione: [Heartbeat](/gateway/heartbeat).

  </Accordion>

  <Accordion title='Devo aggiungere un "account bot" a un gruppo WhatsApp?'>
    No. OpenClaw gira sul **tuo stesso account**, quindi se sei nel gruppo, OpenClaw può vederlo.
    Per impostazione predefinita, le risposte nei gruppi sono bloccate finché non autorizzi i mittenti (`groupPolicy: "allowlist"`).

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
    Opzione 1 (più rapida): segui i log e invia un messaggio di test nel gruppo:

    ```bash
    openclaw logs --follow --json
    ```

    Cerca `chatId` (o `from`) che termina con `@g.us`, per esempio:
    `1234567890-1234567890@g.us`.

    Opzione 2 (se già configurato/in allowlist): elenca i gruppi dalla config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentazione: [WhatsApp](/it/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Perché OpenClaw non risponde in un gruppo?">
    Due cause comuni:

    - Il gating per mention è attivo (predefinito). Devi fare @mention del bot (o rispettare `mentionPatterns`).
    - Hai configurato `channels.whatsapp.groups` senza `"*"` e il gruppo non è in allowlist.

    Vedi [Groups](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).

  </Accordion>

  <Accordion title="I gruppi/thread condividono il contesto con i DM?">
    Le chat dirette collassano nella sessione principale per impostazione predefinita. Gruppi/canali hanno le proprie chiavi di sessione, e topic Telegram / thread Discord sono sessioni separate. Vedi [Groups](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).
  </Accordion>

  <Accordion title="Quanti workspace e agenti posso creare?">
    Non ci sono limiti rigidi. Decine (anche centinaia) vanno bene, ma fai attenzione a:

    - **Crescita su disco:** sessioni + trascrizioni vivono in `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo in token:** più agenti significa più uso concorrente dei modelli.
    - **Overhead operativo:** profili auth, workspace e instradamento canali per agente.

    Suggerimenti:

    - Mantieni un workspace **attivo** per agente (`agents.defaults.workspace`).
    - Pota le vecchie sessioni (elimina JSONL o voci dell'archivio) se il disco cresce.
    - Usa `openclaw doctor` per individuare workspace dispersi e mismatch dei profili.

  </Accordion>

  <Accordion title="Posso eseguire più bot o chat contemporaneamente (Slack), e come dovrei configurarlo?">
    Sì. Usa **Instradamento Multi-Agent** per eseguire più agenti isolati e instradare i messaggi in ingresso per
    canale/account/peer. Slack è supportato come canale e può essere associato ad agenti specifici.

    L'accesso browser è potente ma non equivale a "fare tutto ciò che può fare un umano": anti-bot, CAPTCHA e MFA possono
    comunque bloccare l'automazione. Per il controllo browser più affidabile, usa Chrome MCP locale sull'host,
    oppure usa CDP sulla macchina che esegue davvero il browser.

    Configurazione best practice:

    - Host Gateway sempre attivo (VPS/Mac mini).
    - Un agente per ruolo (bindings).
    - Canale/i Slack associati a quegli agenti.
    - Browser locale tramite Chrome MCP o un node quando necessario.

    Documentazione: [Instradamento Multi-Agent](/concepts/multi-agent), [Slack](/it/channels/slack),
    [Browser](/tools/browser), [Nodes](/nodes).

  </Accordion>
</AccordionGroup>

## Modelli: valori predefiniti, selezione, alias, cambio

<AccordionGroup>
  <Accordion title='Cos'è il "modello predefinito"?'>
    Il modello predefinito di OpenClaw è qualunque modello tu abbia impostato come:

    ```
    agents.defaults.model.primary
    ```

    I modelli sono referenziati come `provider/model` (esempio: `openai/gpt-5.4`). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca esatta tra i provider configurati per quell'ID modello, e solo allora usa come fallback il provider predefinito configurato come percorso di compatibilità deprecato. Se quel provider non espone più il modello predefinito configurato, OpenClaw usa come fallback il primo provider/modello configurato invece di mostrare un valore predefinito obsoleto di un provider rimosso. Dovresti comunque impostare **esplicitamente** `provider/model`.

  </Accordion>

  <Accordion title="Quale modello consigliate?">
    **Predefinito consigliato:** usa il miglior modello di ultima generazione disponibile nel tuo stack provider.
    **Per agenti con strumenti o input non fidati:** privilegia la forza del modello rispetto al costo.
    **Per chat di routine / basso rischio:** usa modelli di fallback più economici e instrada per ruolo dell'agente.

    MiniMax ha la propria documentazione: [MiniMax](/providers/minimax) e
    [Modelli locali](/gateway/local-models).

    Regola pratica: usa il **miglior modello che puoi permetterti** per attività ad alta posta, e un modello
    più economico per chat di routine o riepiloghi. Puoi instradare i modelli per agente e usare sub-agents per
    parallelizzare task lunghi (ogni sub-agent consuma token). Vedi [Modelli](/concepts/models) e
    [Sub-agents](/tools/subagents).

    Forte avvertimento: i modelli più deboli o eccessivamente quantizzati sono più vulnerabili al prompt
    injection e a comportamenti non sicuri. Vedi [Sicurezza](/gateway/security).

    Più contesto: [Modelli](/concepts/models).

  </Accordion>

  <Accordion title="Come cambio modello senza cancellare la config?">
    Usa i **comandi modello** o modifica solo i campi **model**. Evita sostituzioni complete della config.

    Opzioni sicure:

    - `/model` in chat (rapido, per sessione)
    - `openclaw models set ...` (aggiorna solo la config del modello)
    - `openclaw configure --section model` (interattivo)
    - modifica `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Evita `config.apply` con un oggetto parziale a meno che tu non voglia sostituire l'intera config.
    Per modifiche RPC, ispeziona prima con `config.schema.lookup` e preferisci `config.patch`. Il payload lookup ti fornisce il percorso normalizzato, documentazione/vincoli del nodo di schema superficiale e riepiloghi immediati dei figli
    per aggiornamenti parziali.
    Se hai sovrascritto la config, ripristina da backup o riesegui `openclaw doctor` per ripararla.

    Documentazione: [Modelli](/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usare modelli self-hosted (llama.cpp, vLLM, Ollama)?">
    Sì. Ollama è il percorso più semplice per i modelli locali.

    Configurazione più rapida:

    1. Installa Ollama da `https://ollama.com/download`
    2. Scarica un modello locale come `ollama pull glm-4.7-flash`
    3. Se vuoi anche modelli cloud, esegui `ollama signin`
    4. Esegui `openclaw onboard` e scegli `Ollama`
    5. Scegli `Local` oppure `Cloud + Local`

    Note:

    - `Cloud + Local` ti offre modelli cloud più i tuoi modelli Ollama locali
    - i modelli cloud come `kimi-k2.5:cloud` non richiedono un pull locale
    - per cambio manuale, usa `openclaw models list` e `openclaw models set ollama/<model>`

    Nota di sicurezza: i modelli più piccoli o molto quantizzati sono più vulnerabili al prompt
    injection. Consigliamo fortemente **modelli grandi** per qualunque bot che possa usare strumenti.
    Se vuoi comunque usare modelli piccoli, abilita sandboxing e allowlist rigide degli strumenti.

    Documentazione: [Ollama](/providers/ollama), [Modelli locali](/gateway/local-models),
    [Provider di modelli](/concepts/model-providers), [Sicurezza](/gateway/security),
    [Sandboxing](/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quali modelli usano OpenClaw, Flawd e Krill?">
    - Questi deployment possono differire e cambiare nel tempo; non esiste un provider consigliato fisso.
    - Controlla l'impostazione runtime corrente su ciascun gateway con `openclaw models status`.
    - Per agenti sensibili dal punto di vista della sicurezza o con strumenti abilitati, usa il miglior modello di ultima generazione disponibile.
  </Accordion>

  <Accordion title="Come cambio modello al volo (senza riavviare)?">
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

    Questi sono gli alias integrati. Alias personalizzati possono essere aggiunti tramite `agents.defaults.models`.

    Puoi elencare i modelli disponibili con `/model`, `/model list`, o `/model status`.

    `/model` (e `/model list`) mostra un selettore compatto numerato. Seleziona per numero:

    ```
    /model 3
    ```

    Puoi anche forzare un profilo auth specifico per il provider (per sessione):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Suggerimento: `/model status` mostra quale agente è attivo, quale file `auth-profiles.json` viene usato e quale profilo auth verrà provato per primo.
    Mostra anche l'endpoint provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

    **Come rimuovo il pin di un profilo impostato con @profile?**

    Riesegui `/model` **senza** il suffisso `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se vuoi tornare al predefinito, selezionalo da `/model` (oppure invia `/model <default provider/model>`).
    Usa `/model status` per confermare quale profilo auth è attivo.

  </Accordion>

  <Accordion title="Posso usare GPT 5.2 per i task quotidiani e Codex 5.3 per il coding?">
    Sì. Impostane uno come predefinito e cambia quando serve:

    - **Cambio rapido (per sessione):** `/model gpt-5.4` per i task quotidiani, `/model openai-codex/gpt-5.4` per il coding con Codex OAuth.
    - **Predefinito + cambio:** imposta `agents.defaults.model.primary` su `openai/gpt-5.4`, poi cambia a `openai-codex/gpt-5.4` quando fai coding (o viceversa).
    - **Sub-agents:** instrada i task di coding verso sub-agents con un modello predefinito diverso.

    Vedi [Modelli](/concepts/models) e [Comandi slash](/tools/slash-commands).

  </Accordion>

  <Accordion title='Perché vedo "Model ... is not allowed" e poi nessuna risposta?'>
    Se `agents.defaults.models` è impostato, diventa la **allowlist** per `/model` e per qualunque
    override di sessione. Scegliere un modello che non è in quell'elenco restituisce:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Quell'errore viene restituito **al posto** di una risposta normale. Correzione: aggiungi il modello a
    `agents.defaults.models`, rimuovi la allowlist, oppure scegli un modello da `/model list`.

  </Accordion>

  <Accordion title='Perché vedo "Unknown model: minimax/MiniMax-M2.7"?'>
    Questo significa che il **provider non è configurato** (non è stata trovata alcuna config provider MiniMax o
    alcun profilo auth), quindi il modello non può essere risolto.

    Checklist di correzione:

    1. Aggiorna a una release corrente di OpenClaw (o esegui dal sorgente `main`), poi riavvia il gateway.
    2. Assicurati che MiniMax sia configurato (wizard o JSON), o che l'auth MiniMax
       esista in env/profili auth così il provider corrispondente possa essere iniettato
       (`MINIMAX_API_KEY` per `minimax`, `MINIMAX_OAUTH_TOKEN` o OAuth MiniMax
       memorizzato per `minimax-portal`).
    3. Usa l'ID modello esatto (case-sensitive) per il tuo percorso auth:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` per setup
       con chiave API, oppure `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` per setup OAuth.
    4. Esegui:

       ```bash
       openclaw models list
       ```

       e scegli dalla lista (oppure `/model list` in chat).

    Vedi [MiniMax](/providers/minimax) e [Modelli](/concepts/models).

  </Accordion>

  <Accordion title="Posso usare MiniMax come predefinito e OpenAI per task complessi?">
    Sì. Usa **MiniMax come predefinito** e cambia modello **per sessione** quando serve.
    I fallback servono per **errori**, non per "task difficili", quindi usa `/model` o un agente separato.

    **Opzione A: cambia per sessione**

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

    Documentazione: [Modelli](/concepts/models), [Instradamento Multi-Agent](/concepts/multi-agent), [MiniMax](/providers/minimax), [OpenAI](/providers/openai).

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

    Se imposti un tuo alias con lo stesso nome, prevale il tuo valore.

  </Accordion>

  <Accordion title="Come definisco/sovrascrivo scorciatoie modello (alias)?">
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

    Poi `/model sonnet` (oppure `/<alias>` quando supportato) si risolve in quell'ID modello.

  </Accordion>

  <Accordion title="Come aggiungo modelli da altri provider come OpenRouter o Z.AI?">
    OpenRouter (pay-per-token; molti modelli):

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

    Se fai riferimento a un provider/modello ma manca la chiave richiesta del provider, riceverai un errore auth runtime (ad esempio `No API key found for provider "zai"`).

    **No API key found for provider dopo aver aggiunto un nuovo agente**

    Di solito significa che il **nuovo agente** ha un archivio auth vuoto. L'auth è per agente ed è
    memorizzata in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opzioni di correzione:

    - Esegui `openclaw agents add <id>` e configura l'auth durante la procedura guidata.
    - Oppure copia `auth-profiles.json` dalla `agentDir` dell'agente principale alla `agentDir` del nuovo agente.

    Non riutilizzare `agentDir` tra agenti; causa collisioni auth/sessione.

  </Accordion>
</AccordionGroup>

## Failover dei modelli e "All models failed"

<AccordionGroup>
  <Accordion title="Come funziona il failover?">
    Il failover avviene in due fasi:

    1. **Rotazione dei profili auth** all'interno dello stesso provider.
    2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

    Ai profili che falliscono vengono applicati cooldown (backoff esponenziale), così OpenClaw può continuare a rispondere anche quando un provider è limitato o temporaneamente in errore.

    Il bucket rate-limit include più delle semplici risposte `429`. OpenClaw
    tratta anche messaggi come `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, e limiti
    periodici della finestra di utilizzo (`weekly/monthly limit reached`) come
    rate limit degni di failover.

    Alcune risposte che sembrano di fatturazione non sono `402`, e alcune risposte HTTP `402`
    restano anch'esse in quel bucket transitorio. Se un provider restituisce
    testo esplicito di fatturazione su `401` o `403`, OpenClaw può comunque
    mantenerlo nella corsia billing, ma i matcher testuali specifici del provider
    restano limitati al provider che li possiede (ad esempio OpenRouter `Key limit exceeded`). Se un messaggio `402`
    sembra invece una finestra di utilizzo riprovabile o un limite di spesa
    dell'organizzazione/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw lo tratta come
    `rate_limit`, non come lunga disabilitazione per billing.

    Gli errori di overflow del contesto sono diversi: firme come
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, o `ollama error: context length
    exceeded` restano nel percorso di compattazione/retry invece di avanzare al
    fallback di modello.

    Il testo generico di errore server è intenzionalmente più ristretto di "qualsiasi cosa con
    unknown/error". OpenClaw tratta comunque forme transitorie specifiche del provider
    come Anthropic nudo `An unknown error occurred`, OpenRouter nudo
    `Provider returned error`, errori del motivo di stop come `Unhandled stop reason:
    error`, payload JSON