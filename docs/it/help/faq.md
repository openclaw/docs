---
read_when:
    - Rispondere a domande comuni su configurazione, installazione, onboarding o supporto di runtime
    - Classificare i problemi segnalati dagli utenti prima di un debug più approfondito
summary: Domande frequenti sulla configurazione, impostazione e utilizzo di OpenClaw
title: FAQ
x-i18n:
    generated_at: "2026-04-07T08:19:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: bddcde55cf4bcec4913aadab4c665b235538104010e445e4c99915a1672b1148
    source_path: help/faq.md
    workflow: 15
---

# FAQ

Risposte rapide più risoluzione dei problemi approfondita per configurazioni reali (sviluppo locale, VPS, multi-agent, chiavi OAuth/API, failover del modello). Per la diagnostica di runtime, vedi [Risoluzione dei problemi](/it/gateway/troubleshooting). Per il riferimento completo della configurazione, vedi [Configurazione](/it/gateway/configuration).

## Primi 60 secondi se qualcosa non funziona

1. **Stato rapido (primo controllo)**

   ```bash
   openclaw status
   ```

   Riepilogo locale rapido: OS + aggiornamento, raggiungibilità gateway/servizio, agenti/sessioni, configurazione provider + problemi di runtime (quando il gateway è raggiungibile).

2. **Report copiabile (sicuro da condividere)**

   ```bash
   openclaw status --all
   ```

   Diagnosi in sola lettura con coda dei log (token redatti).

3. **Stato daemon + porta**

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

   Se RPC non è disponibile, usa come fallback:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   I log su file sono separati dai log del servizio; vedi [Logging](/it/logging) e [Risoluzione dei problemi](/it/gateway/troubleshooting).

6. **Esegui doctor (riparazioni)**

   ```bash
   openclaw doctor
   ```

   Ripara/migra configurazione e stato + esegue controlli di salute. Vedi [Doctor](/it/gateway/doctor).

7. **Snapshot del gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # mostra l'URL di destinazione + il percorso di configurazione in caso di errori
   ```

   Chiede al gateway in esecuzione uno snapshot completo (solo WS). Vedi [Health](/it/gateway/health).

## Avvio rapido e configurazione iniziale

<AccordionGroup>
  <Accordion title="Sono bloccato, modo più rapido per sbloccarmi">
    Usa un agente AI locale che possa **vedere la tua macchina**. È molto più efficace che chiedere
    su Discord, perché la maggior parte dei casi "sono bloccato" sono **problemi di configurazione locale o dell'ambiente** che
    chi aiuta da remoto non può ispezionare.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Questi strumenti possono leggere il repo, eseguire comandi, ispezionare i log e aiutare a correggere la configurazione
    della tua macchina (PATH, servizi, permessi, file di autenticazione). Fornisci loro il **checkout completo del sorgente** tramite
    l'installazione hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Questo installa OpenClaw **da un checkout git**, così l'agente può leggere codice + documentazione e
    ragionare sulla versione esatta che stai eseguendo. Puoi sempre tornare alla stable più tardi
    rieseguendo l'installer senza `--install-method git`.

    Suggerimento: chiedi all'agente di **pianificare e supervisionare** la correzione (passo per passo), quindi eseguire solo i
    comandi necessari. In questo modo le modifiche restano piccole e più facili da verificare.

    Se scopri un bug reale o una correzione, apri un issue GitHub o invia una PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Inizia con questi comandi (condividi l'output quando chiedi aiuto):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Cosa fanno:

    - `openclaw status`: snapshot rapido dello stato di salute di gateway/agente + configurazione di base.
    - `openclaw models status`: controlla autenticazione del provider + disponibilità del modello.
    - `openclaw doctor`: valida e ripara i problemi comuni di configurazione/stato.

    Altri controlli CLI utili: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Ciclo rapido di debug: [Primi 60 secondi se qualcosa non funziona](#primi-60-secondi-se-qualcosa-non-funziona).
    Documentazione di installazione: [Installazione](/it/install), [Flag dell'installer](/it/install/installer), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continua a essere saltato. Cosa significano i motivi di salto?">
    Motivi comuni per il salto di heartbeat:

    - `quiet-hours`: fuori dalla finestra configurata di ore attive
    - `empty-heartbeat-file`: `HEARTBEAT.md` esiste ma contiene solo struttura vuota/intestazioni
    - `no-tasks-due`: la modalità task di `HEARTBEAT.md` è attiva ma nessuno degli intervalli dei task è ancora scaduto
    - `alerts-disabled`: tutta la visibilità heartbeat è disabilitata (`showOk`, `showAlerts` e `useIndicator` sono tutti disattivati)

    In modalità task, i timestamp di scadenza avanzano solo dopo il completamento
    di una vera esecuzione heartbeat. Le esecuzioni saltate non contrassegnano i task come completati.

    Documentazione: [Heartbeat](/it/gateway/heartbeat), [Automazione e task](/it/automation).

  </Accordion>

  <Accordion title="Modo consigliato per installare e configurare OpenClaw">
    Il repo consiglia di eseguire dal sorgente e usare l'onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata può anche compilare automaticamente le risorse UI. Dopo l'onboarding, in genere esegui il Gateway sulla porta **18789**.

    Dal sorgente (contributori/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # installa automaticamente le dipendenze UI al primo avvio
    openclaw onboard
    ```

    Se non hai ancora un'installazione globale, eseguilo tramite `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Come apro la dashboard dopo l'onboarding?">
    La procedura guidata apre il browser con un URL dashboard pulito (senza token) subito dopo l'onboarding e stampa anche il link nel riepilogo. Tieni aperta quella scheda; se non si è avviata, copia/incolla l'URL stampato sulla stessa macchina.
  </Accordion>

  <Accordion title="Come autentico la dashboard su localhost rispetto a una macchina remota?">
    **Localhost (stessa macchina):**

    - Apri `http://127.0.0.1:18789/`.
    - Se richiede autenticazione con shared secret, incolla il token o la password configurati nelle impostazioni di Control UI.
    - Origine del token: `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
    - Origine della password: `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
    - Se non è ancora configurato alcun shared secret, genera un token con `openclaw doctor --generate-gateway-token`.

    **Non su localhost:**

    - **Tailscale Serve** (consigliato): mantieni il bind loopback, esegui `openclaw gateway --tailscale serve`, apri `https://<magicdns>/`. Se `gateway.auth.allowTailscale` è `true`, gli header di identità soddisfano l'autenticazione di Control UI/WebSocket (nessun shared secret da incollare, presuppone gateway host attendibile); le API HTTP richiedono comunque autenticazione con shared secret a meno che tu non usi deliberatamente `none` su private-ingress o autenticazione HTTP trusted-proxy.
      I tentativi concorrenti errati di autenticazione Serve dallo stesso client vengono serializzati prima che il limitatore dei tentativi falliti li registri, quindi il secondo tentativo errato può già mostrare `retry later`.
    - **Bind tailnet**: esegui `openclaw gateway --bind tailnet --token "<token>"` (o configura l'autenticazione con password), apri `http://<tailscale-ip>:18789/`, quindi incolla il shared secret corrispondente nelle impostazioni dashboard.
    - **Reverse proxy identity-aware**: tieni il Gateway dietro un trusted proxy non loopback, configura `gateway.auth.mode: "trusted-proxy"`, quindi apri l'URL del proxy.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@host` quindi apri `http://127.0.0.1:18789/`. L'autenticazione shared secret si applica ancora sul tunnel; incolla il token o la password configurati se richiesto.

    Vedi [Dashboard](/web/dashboard) e [Superfici web](/web) per dettagli su modalità bind e autenticazione.

  </Accordion>

  <Accordion title="Perché esistono due configurazioni di approvazione exec per le approvazioni in chat?">
    Controllano livelli diversi:

    - `approvals.exec`: inoltra i prompt di approvazione alle destinazioni chat
    - `channels.<channel>.execApprovals`: fa sì che quel canale agisca come client di approvazione nativo per le approvazioni exec

    La policy exec dell'host resta comunque il vero controllo di approvazione. La configurazione chat controlla solo dove
    compaiono i prompt di approvazione e come le persone possono rispondere.

    Nella maggior parte delle configurazioni **non** servono entrambi:

    - Se la chat supporta già comandi e risposte, `/approve` nella stessa chat funziona tramite il percorso condiviso.
    - Se un canale nativo supportato può dedurre gli approvatori in modo sicuro, OpenClaw ora abilita automaticamente le approvazioni native con priorità DM quando `channels.<channel>.execApprovals.enabled` non è impostato o è `"auto"`.
    - Quando sono disponibili card/pulsanti di approvazione nativi, quell'interfaccia nativa è il percorso principale; l'agente dovrebbe includere un comando `/approve` manuale solo se il risultato dello strumento indica che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    - Usa `approvals.exec` solo quando i prompt devono essere inoltrati anche ad altre chat o a stanze ops esplicite.
    - Usa `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo quando vuoi esplicitamente che i prompt di approvazione vengano pubblicati di nuovo nella stanza/topic di origine.
    - Le approvazioni plugin sono ancora separate: usano per impostazione predefinita `/approve` nella stessa chat, inoltro opzionale `approvals.plugin`, e solo alcuni canali nativi mantengono anche la gestione nativa delle approvazioni plugin.

    In breve: l'inoltro serve per l'instradamento, la configurazione client nativa serve per una UX più ricca specifica del canale.
    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>

  <Accordion title="Quale runtime mi serve?">
    È richiesto Node **>= 22**. `pnpm` è consigliato. Bun **non è consigliato** per il Gateway.
  </Accordion>

  <Accordion title="Funziona su Raspberry Pi?">
    Sì. Il Gateway è leggero: la documentazione indica **512MB-1GB RAM**, **1 core** e circa **500MB**
    di disco come sufficienti per uso personale, e segnala che un **Raspberry Pi 4 può eseguirlo**.

    Se vuoi più margine (log, media, altri servizi), **2GB sono consigliati**, ma non
    è un minimo rigido.

    Suggerimento: un piccolo Pi/VPS può ospitare il Gateway e puoi associare **nodes** su laptop/telefono per
    schermo/fotocamera/canvas locale o esecuzione comandi. Vedi [Nodes](/it/nodes).

  </Accordion>

  <Accordion title="Ci sono suggerimenti per installazioni su Raspberry Pi?">
    In breve: funziona, ma aspettati qualche spigolo.

    - Usa un OS **64-bit** e mantieni Node >= 22.
    - Preferisci l'**installazione hackable (git)** così puoi vedere i log e aggiornare rapidamente.
    - Inizia senza canali/Skills, poi aggiungili uno alla volta.
    - Se incontri strani problemi binari, di solito è un problema di **compatibilità ARM**.

    Documentazione: [Linux](/it/platforms/linux), [Installazione](/it/install).

  </Accordion>

  <Accordion title="È bloccato su wake up my friend / l'onboarding non si schiude. E adesso?">
    Quella schermata dipende dal fatto che il Gateway sia raggiungibile e autenticato. Anche la TUI invia
    automaticamente "Wake up, my friend!" alla prima schiusa. Se vedi quella riga con **nessuna risposta**
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

    Se il Gateway è remoto, assicurati che il tunnel/la connessione Tailscale siano attivi e che la UI
    punti al Gateway corretto. Vedi [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Posso migrare la mia configurazione su una nuova macchina (Mac mini) senza rifare l'onboarding?">
    Sì. Copia la **directory di stato** e il **workspace**, poi esegui Doctor una volta. Questo
    mantiene il tuo bot "esattamente uguale" (memoria, cronologia sessioni, autenticazione e
    stato del canale) purché tu copi **entrambe** le posizioni:

    1. Installa OpenClaw sulla nuova macchina.
    2. Copia `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`) dalla vecchia macchina.
    3. Copia il tuo workspace (predefinito: `~/.openclaw/workspace`).
    4. Esegui `openclaw doctor` e riavvia il servizio Gateway.

    Questo preserva configurazione, profili auth, credenziali WhatsApp, sessioni e memoria. Se sei in
    modalità remota, ricorda che il gateway host possiede l'archivio sessioni e il workspace.

    **Importante:** se fai solo commit/push del workspace su GitHub, stai facendo
    backup di **memoria + file bootstrap**, ma **non** della cronologia delle sessioni o dell'autenticazione. Questi vivono
    sotto `~/.openclaw/` (per esempio `~/.openclaw/agents/<agentId>/sessions/`).

    Correlati: [Migrazione](/it/install/migrating), [Dove si trova tutto sul disco](#dove-si-trova-tutto-sul-disco),
    [Workspace dell'agente](/it/concepts/agent-workspace), [Doctor](/it/gateway/doctor),
    [Modalità remota](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove vedo cosa c'è di nuovo nell'ultima versione?">
    Controlla il changelog GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Le voci più recenti sono in alto. Se la sezione in alto è contrassegnata **Unreleased**, la successiva sezione datata
    è l'ultima versione rilasciata. Le voci sono raggruppate per **Highlights**, **Changes** e
    **Fixes** (più sezioni docs/altro quando necessario).

  </Accordion>

  <Accordion title="Impossibile accedere a docs.openclaw.ai (errore SSL)">
    Alcune connessioni Comcast/Xfinity bloccano erroneamente `docs.openclaw.ai` tramite Xfinity
    Advanced Security. Disabilitalo o metti `docs.openclaw.ai` in allowlist, quindi riprova.
    Aiutaci a sbloccarlo segnalandolo qui: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Se non riesci ancora a raggiungere il sito, la documentazione è mirrorata su GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Differenza tra stable e beta">
    **Stable** e **beta** sono **npm dist-tag**, non linee di codice separate:

    - `latest` = stable
    - `beta` = build anticipata per test

    Di solito, una release stable arriva prima su **beta**, poi un passaggio esplicito
    di promozione sposta quella stessa versione su `latest`. I maintainer possono anche
    pubblicare direttamente su `latest` quando serve. Per questo beta e stable possono
    puntare alla **stessa versione** dopo la promozione.

    Vedi cosa è cambiato:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Per i comandi di installazione in una riga e la differenza tra beta e dev, vedi l'accordion qui sotto.

  </Accordion>

  <Accordion title="Come installo la versione beta e qual è la differenza tra beta e dev?">
    **Beta** è il dist-tag npm `beta` (può coincidere con `latest` dopo la promozione).
    **Dev** è la testa mobile di `main` (git); quando pubblicata, usa il dist-tag npm `dev`.

    Comandi in una riga (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Installer Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Più dettagli: [Canali di sviluppo](/it/install/development-channels) e [Flag dell'installer](/it/install/installer).

  </Accordion>

  <Accordion title="Come provo gli ultimi aggiornamenti?">
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

    In questo modo ottieni un repo locale modificabile, poi aggiornabile via git.

    Se preferisci un clone pulito manualmente, usa:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentazione: [Aggiornamento](/cli/update), [Canali di sviluppo](/it/install/development-channels),
    [Installazione](/it/install).

  </Accordion>

  <Accordion title="Quanto richiedono di solito installazione e onboarding?">
    Guida approssimativa:

    - **Installazione:** 2-5 minuti
    - **Onboarding:** 5-15 minuti a seconda di quanti canali/modelli configuri

    Se si blocca, usa [Installer bloccato](#quick-start-and-first-run-setup)
    e il ciclo rapido di debug in [Sono bloccato](#quick-start-and-first-run-setup).

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

  <Accordion title="L'installazione Windows dice git not found o openclaw not recognized">
    Due problemi comuni su Windows:

    **1) errore npm spawn git / git not found**

    - Installa **Git for Windows** e assicurati che `git` sia nel tuo PATH.
    - Chiudi e riapri PowerShell, quindi riesegui l'installer.

    **2) openclaw is not recognized dopo l'installazione**

    - La tua cartella npm global bin non è nel PATH.
    - Controlla il percorso:

      ```powershell
      npm config get prefix
      ```

    - Aggiungi quella directory al PATH utente (su Windows non serve il suffisso `\bin`; sulla maggior parte dei sistemi è `%AppData%\npm`).
    - Chiudi e riapri PowerShell dopo aver aggiornato il PATH.

    Se vuoi la configurazione Windows più fluida, usa **WSL2** invece di Windows nativo.
    Documentazione: [Windows](/it/platforms/windows).

  </Accordion>

  <Accordion title="L'output exec su Windows mostra testo cinese illeggibile: cosa devo fare?">
    Di solito è una mancata corrispondenza della code page della console nelle shell Windows native.

    Sintomi:

    - l'output `system.run`/`exec` mostra il cinese come mojibake
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

    Se riesci ancora a riprodurlo con l'ultima versione di OpenClaw, monitoralo/segnalalo in:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="La documentazione non ha risposto alla mia domanda: come ottengo una risposta migliore?">
    Usa l'**installazione hackable (git)** così hai il sorgente completo e la documentazione in locale, poi chiedi
    al tuo bot (o a Claude/Codex) _da quella cartella_ così può leggere il repo e rispondere in modo preciso.

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
    Manteniamo un **hub di hosting** con i provider comuni. Scegline uno e segui la guida:

    - [Hosting VPS](/it/vps) (tutti i provider in un unico posto)
    - [Fly.io](/it/install/fly)
    - [Hetzner](/it/install/hetzner)
    - [exe.dev](/it/install/exe-dev)

    Come funziona nel cloud: il **Gateway gira sul server** e vi accedi
    da laptop/telefono tramite Control UI (o Tailscale/SSH). Il tuo stato + workspace
    vivono sul server, quindi tratta l'host come fonte di verità e fanne il backup.

    Puoi associare **nodes** (Mac/iOS/Android/headless) a quel Gateway cloud per accedere a
    schermo/fotocamera/canvas locale o eseguire comandi sul laptop mantenendo il
    Gateway nel cloud.

    Hub: [Piattaforme](/it/platforms). Accesso remoto: [Gateway remoto](/it/gateway/remote).
    Nodes: [Nodes](/it/nodes), [CLI Nodes](/cli/nodes).

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

    Se devi automatizzare tramite un agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentazione: [Aggiornamento](/cli/update), [Aggiornamenti](/it/install/updating).

  </Accordion>

  <Accordion title="Che cosa fa effettivamente l'onboarding?">
    `openclaw onboard` è il percorso di configurazione consigliato. In **modalità locale** ti guida in:

    - **Configurazione modello/auth** (OAuth provider, chiavi API, Anthropic setup-token, più opzioni di modello locale come LM Studio)
    - posizione del **workspace** + file bootstrap
    - **Impostazioni gateway** (bind/porta/auth/tailscale)
    - **Canali** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, più plugin di canale inclusi come QQ Bot)
    - **Installazione daemon** (LaunchAgent su macOS; unità utente systemd su Linux/WSL2)
    - **Controlli di salute** e selezione delle **Skills**

    Avverte anche se il modello configurato è sconosciuto o manca l'autenticazione.

  </Accordion>

  <Accordion title="Ho bisogno di un abbonamento Claude o OpenAI per eseguirlo?">
    No. Puoi eseguire OpenClaw con **chiavi API** (Anthropic/OpenAI/altri) o con
    **modelli solo locali** così i tuoi dati restano sul dispositivo. Gli abbonamenti (Claude
    Pro/Max o OpenAI Codex) sono modi opzionali per autenticare tali provider.

    Per Anthropic in OpenClaw, la distinzione pratica è:

    - **Chiave API Anthropic**: normale fatturazione API Anthropic
    - **Claude CLI / autenticazione abbonamento Claude in OpenClaw**: il personale Anthropic
      ci ha detto che questo utilizzo è di nuovo consentito, e OpenClaw considera l'uso di `claude -p`
      come approvato per questa integrazione a meno che Anthropic non pubblichi una nuova
      policy

    Per gateway host a lungo termine, le chiavi API Anthropic restano comunque la configurazione
    più prevedibile. L'OAuth OpenAI Codex è esplicitamente supportato per
    strumenti esterni come OpenClaw.

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

    Il personale Anthropic ci ha detto che l'uso in stile OpenClaw di Claude CLI è di nuovo consentito, quindi
    OpenClaw tratta l'autenticazione tramite abbonamento Claude e l'uso di `claude -p` come approvati
    per questa integrazione, a meno che Anthropic non pubblichi una nuova policy. Se desideri
    la configurazione server-side più prevedibile, usa invece una chiave API Anthropic.

  </Accordion>

  <Accordion title="Supportate l'autenticazione tramite abbonamento Claude (Claude Pro o Max)?">
    Sì.

    Il personale Anthropic ci ha detto che questo utilizzo è di nuovo consentito, quindi OpenClaw tratta
    il riuso di Claude CLI e l'uso di `claude -p` come approvati per questa integrazione
    a meno che Anthropic non pubblichi una nuova policy.

    Anthropic setup-token è ancora disponibile come percorso token OpenClaw supportato, ma OpenClaw ora preferisce il riuso di Claude CLI e `claude -p` quando disponibili.
    Per carichi di lavoro di produzione o multiutente, l'autenticazione con chiave API Anthropic resta la
    scelta più sicura e prevedibile. Se desideri altre opzioni ospitate in stile abbonamento
    in OpenClaw, vedi [OpenAI](/it/providers/openai), [Qwen / Model
    Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax) e [Modelli GLM](/it/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Perché vedo HTTP 429 rate_limit_error da Anthropic?">
Questo significa che la tua **quota/limite di velocità Anthropic** è esaurita per la finestra corrente. Se
usi **Claude CLI**, attendi il reset della finestra o passa a un piano superiore. Se
usi una **chiave API Anthropic**, controlla la Anthropic Console
per utilizzo/fatturazione e aumenta i limiti se necessario.

    Se il messaggio è specificamente:
    `Extra usage is required for long context requests`, la richiesta sta cercando di usare
    la beta di contesto 1M di Anthropic (`context1m: true`). Funziona solo quando la tua
    credenziale è idonea per la fatturazione long-context (fatturazione con chiave API o
    percorso Claude-login di OpenClaw con Extra Usage abilitato).

    Suggerimento: imposta un **modello fallback** così OpenClaw può continuare a rispondere mentre un provider è rate-limited.
    Vedi [Modelli](/cli/models), [OAuth](/it/concepts/oauth), e
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/it/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock è supportato?">
    Sì. OpenClaw include un provider **Amazon Bedrock (Converse)**. Con i marker env AWS presenti, OpenClaw può rilevare automaticamente il catalogo Bedrock streaming/testo e unirlo come provider implicito `amazon-bedrock`; in alternativa puoi abilitare esplicitamente `plugins.entries.amazon-bedrock.config.discovery.enabled` o aggiungere una voce provider manuale. Vedi [Amazon Bedrock](/it/providers/bedrock) e [Provider di modelli](/it/providers/models). Se preferisci un flusso chiavi gestito, anche un proxy compatibile OpenAI davanti a Bedrock resta un'opzione valida.
  </Accordion>

  <Accordion title="Come funziona l'autenticazione Codex?">
    OpenClaw supporta **OpenAI Code (Codex)** tramite OAuth (accesso ChatGPT). L'onboarding può eseguire il flusso OAuth e imposterà il modello predefinito su `openai-codex/gpt-5.4` quando appropriato. Vedi [Provider di modelli](/it/concepts/model-providers) e [Onboarding (CLI)](/it/start/wizard).
  </Accordion>

  <Accordion title="Perché ChatGPT GPT-5.4 non sblocca openai/gpt-5.4 in OpenClaw?">
    OpenClaw tratta i due percorsi separatamente:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = API diretta OpenAI Platform

    In OpenClaw, l'accesso ChatGPT/Codex è collegato al percorso `openai-codex/*`,
    non al percorso diretto `openai/*`. Se vuoi il percorso API diretto in
    OpenClaw, imposta `OPENAI_API_KEY` (o la configurazione equivalente del provider OpenAI).
    Se vuoi l'accesso ChatGPT/Codex in OpenClaw, usa `openai-codex/*`.

  </Accordion>

  <Accordion title="Perché i limiti OAuth Codex possono differire dal web ChatGPT?">
    `openai-codex/*` usa il percorso OAuth Codex e le sue finestre di quota utilizzabili sono
    gestite da OpenAI e dipendenti dal piano. In pratica, tali limiti possono differire
    dall'esperienza del sito/app ChatGPT, anche quando entrambi sono collegati allo stesso account.

    OpenClaw può mostrare le finestre di utilizzo/quota del provider attualmente visibili in
    `openclaw models status`, ma non inventa né normalizza i diritti del web ChatGPT
    in accesso API diretto. Se vuoi il percorso diretto di
    fatturazione/limite OpenAI Platform, usa `openai/*` con una chiave API.

  </Accordion>

  <Accordion title="Supportate l'autenticazione tramite abbonamento OpenAI (Codex OAuth)?">
    Sì. OpenClaw supporta pienamente **l'OAuth di abbonamento OpenAI Code (Codex)**.
    OpenAI consente esplicitamente l'uso dell'OAuth di abbonamento in strumenti/flussi di lavoro esterni
    come OpenClaw. L'onboarding può eseguire il flusso OAuth per te.

    Vedi [OAuth](/it/concepts/oauth), [Provider di modelli](/it/concepts/model-providers), e [Onboarding (CLI)](/it/start/wizard).

  </Accordion>

  <Accordion title="Come configuro Gemini CLI OAuth?">
    Gemini CLI usa un **flusso di autenticazione plugin**, non un client id o secret in `openclaw.json`.

    Passaggi:

    1. Installa Gemini CLI localmente in modo che `gemini` sia nel `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Abilita il plugin: `openclaw plugins enable google`
    3. Login: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modello predefinito dopo il login: `google-gemini-cli/gemini-3.1-pro-preview`
    5. Se le richieste falliscono, imposta `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sul gateway host

    Questo archivia i token OAuth nei profili auth sul gateway host. Dettagli: [Provider di modelli](/it/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modello locale va bene per chat casuali?">
    Di solito no. OpenClaw richiede contesto ampio + forte sicurezza; le schede piccole troncano e lasciano trapelare. Se proprio devi, esegui la build di modello **più grande** che puoi in locale (LM Studio) e vedi [/gateway/local-models](/it/gateway/local-models). I modelli più piccoli/quantizzati aumentano il rischio di prompt injection - vedi [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Come faccio a mantenere il traffico verso i modelli ospitati in una regione specifica?">
    Scegli endpoint bloccati su una regione. OpenRouter espone opzioni ospitate negli USA per MiniMax, Kimi e GLM; scegli la variante ospitata negli USA per mantenere i dati nella regione. Puoi comunque elencare Anthropic/OpenAI accanto a questi usando `models.mode: "merge"` così i fallback restano disponibili rispettando il provider regionalizzato selezionato.
  </Accordion>

  <Accordion title="Devo comprare un Mac Mini per installarlo?">
    No. OpenClaw gira su macOS o Linux (Windows tramite WSL2). Un Mac mini è facoltativo: alcune persone
    ne acquistano uno come host sempre acceso, ma va bene anche un piccolo VPS, home server o macchina tipo Raspberry Pi.

    Hai bisogno di un Mac **solo per strumenti esclusivi di macOS**. Per iMessage, usa [BlueBubbles](/it/channels/bluebubbles) (consigliato): il server BlueBubbles gira su qualsiasi Mac e il Gateway può girare su Linux o altrove. Se vuoi altri strumenti solo macOS, esegui il Gateway su un Mac o associa un nodo macOS.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Nodes](/it/nodes), [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Mi serve un Mac mini per il supporto iMessage?">
    Ti serve **un dispositivo macOS** con accesso a Messaggi. **Non** deve essere per forza un Mac mini:
    va bene qualsiasi Mac. **Usa [BlueBubbles](/it/channels/bluebubbles)** (consigliato) per iMessage: il server BlueBubbles gira su macOS, mentre il Gateway può girare su Linux o altrove.

    Configurazioni comuni:

    - Esegui il Gateway su Linux/VPS e il server BlueBubbles su qualsiasi Mac con accesso a Messaggi.
    - Esegui tutto sul Mac se vuoi la configurazione più semplice su singola macchina.

    Documentazione: [BlueBubbles](/it/channels/bluebubbles), [Nodes](/it/nodes),
    [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se compro un Mac mini per eseguire OpenClaw, posso collegarlo al mio MacBook Pro?">
    Sì. Il **Mac mini può eseguire il Gateway** e il tuo MacBook Pro può collegarsi come
    **nodo** (dispositivo complementare). I nodes non eseguono il Gateway: forniscono capacità aggiuntive
    come schermo/fotocamera/canvas e `system.run` su quel dispositivo.

    Schema comune:

    - Gateway sul Mac mini (sempre acceso).
    - Il MacBook Pro esegue l'app macOS o un node host e si associa al Gateway.
    - Usa `openclaw nodes status` / `openclaw nodes list` per vederlo.

    Documentazione: [Nodes](/it/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Posso usare Bun?">
    Bun **non è consigliato**. Abbiamo riscontrato bug di runtime, soprattutto con WhatsApp e Telegram.
    Usa **Node** per gateway stabili.

    Se vuoi comunque sperimentare con Bun, fallo su un gateway non di produzione
    senza WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: cosa va messo in allowFrom?">
    `channels.telegram.allowFrom` è **l'ID utente Telegram numerico dell'umano che invia**. Non è il nome utente del bot.

    L'onboarding accetta input `@username` e lo risolve in un ID numerico, ma l'autorizzazione OpenClaw usa solo ID numerici.

    Più sicuro (senza bot di terze parti):

    - Invia un DM al tuo bot, poi esegui `openclaw logs --follow` e leggi `from.id`.

    API Bot ufficiale:

    - Invia un DM al tuo bot, poi chiama `https://api.telegram.org/bot<bot_token>/getUpdates` e leggi `message.from.id`.

    Terze parti (meno privato):

    - Invia un DM a `@userinfobot` o `@getidsbot`.

    Vedi [/channels/telegram](/it/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Più persone possono usare un numero WhatsApp con istanze OpenClaw diverse?">
    Sì, tramite **instradamento multi-agent**. Associa il **DM** WhatsApp di ogni mittente (peer `kind: "direct"`, mittente E.164 come `+15551234567`) a un `agentId` diverso, così ogni persona ottiene il proprio workspace e archivio sessioni. Le risposte continuano comunque a provenire dallo **stesso account WhatsApp** e il controllo accessi DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) è globale per account WhatsApp. Vedi [Instradamento multi-agent](/it/concepts/multi-agent) e [WhatsApp](/it/channels/whatsapp).
  </Accordion>

  <Accordion title='Posso eseguire un agente "chat veloce" e un agente "Opus per coding"?'>
    Sì. Usa l'instradamento multi-agent: assegna a ogni agente il proprio modello predefinito, quindi associa i percorsi in ingresso (account provider o peer specifici) a ciascun agente. Un esempio di configurazione si trova in [Instradamento multi-agent](/it/concepts/multi-agent). Vedi anche [Modelli](/it/concepts/models) e [Configurazione](/it/gateway/configuration).
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
    Le build recenti antepongono anche directory bin utente comuni sui servizi Linux systemd (per esempio `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) e rispettano `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando impostati.

  </Accordion>

  <Accordion title="Differenza tra installazione git hackable e npm install">
    - **Installazione hackable (git):** checkout completo del sorgente, modificabile, ideale per contributori.
      Esegui le build localmente e puoi correggere codice/documentazione.
    - **npm install:** installazione globale della CLI, senza repo, ideale per "eseguilo e basta".
      Gli aggiornamenti arrivano dai dist-tag npm.

    Documentazione: [Per iniziare](/it/start/getting-started), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Posso passare in seguito tra installazione npm e git?">
    Sì. Installa l'altra variante, poi esegui Doctor in modo che il servizio gateway punti al nuovo entrypoint.
    Questo **non elimina i tuoi dati**: cambia solo l'installazione del codice OpenClaw. Il tuo stato
    (`~/.openclaw`) e workspace (`~/.openclaw/workspace`) restano invariati.

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

    Doctor rileva una mancata corrispondenza dell'entrypoint del servizio gateway e offre di riscrivere la configurazione del servizio per adeguarla all'installazione corrente (usa `--repair` in automazione).

    Suggerimenti backup: vedi [Strategia di backup](#dove-si-trova-tutto-sul-disco).

  </Accordion>

  <Accordion title="Dovrei eseguire il Gateway sul mio laptop o su un VPS?">
    Risposta breve: **se vuoi affidabilità 24/7, usa un VPS**. Se vuoi il
    minimo attrito e ti va bene sonno/riavvii, eseguilo in locale.

    **Laptop (Gateway locale)**

    - **Pro:** nessun costo server, accesso diretto ai file locali, finestra browser visibile.
    - **Contro:** sospensione/interruzioni di rete = disconnessioni, aggiornamenti/riavvii OS interrompono, deve restare acceso.

    **VPS / cloud**

    - **Pro:** sempre acceso, rete stabile, nessun problema di sospensione laptop, più facile da mantenere attivo.
    - **Contro:** spesso headless (usa screenshot), accesso ai file solo remoto, devi usare SSH per gli aggiornamenti.

    **Nota specifica OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord funzionano tutti bene da un VPS. L'unico vero compromesso è **browser headless** rispetto a una finestra visibile. Vedi [Browser](/it/tools/browser).

    **Scelta predefinita consigliata:** VPS se in passato hai avuto disconnessioni del gateway. Il locale è ottimo quando stai usando attivamente il Mac e vuoi accesso ai file locali o automazione UI con un browser visibile.

  </Accordion>

  <Accordion title="Quanto è importante eseguire OpenClaw su una macchina dedicata?">
    Non è obbligatorio, ma **consigliato per affidabilità e isolamento**.

    - **Host dedicato (VPS/Mac mini/Pi):** sempre acceso, meno interruzioni dovute a sospensione/riavvio, permessi più puliti, più facile da mantenere attivo.
    - **Laptop/desktop condiviso:** va benissimo per test e uso attivo, ma aspettati pause quando la macchina va in stop o si aggiorna.

    Se vuoi il meglio di entrambi, tieni il Gateway su un host dedicato e associa il laptop come **nodo** per strumenti locali di schermo/fotocamera/exec. Vedi [Nodes](/it/nodes).
    Per indicazioni sulla sicurezza, leggi [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i requisiti minimi VPS e l'OS consigliato?">
    OpenClaw è leggero. Per un Gateway di base + un canale chat:

    - **Minimo assoluto:** 1 vCPU, 1GB RAM, ~500MB disco.
    - **Consigliato:** 1-2 vCPU, 2GB RAM o più per margine (log, media, più canali). Gli strumenti node e l'automazione browser possono richiedere molte risorse.

    OS: usa **Ubuntu LTS** (o qualsiasi Debian/Ubuntu moderno). Il percorso di installazione Linux è testato meglio lì.

    Documentazione: [Linux](/it/platforms/linux), [Hosting VPS](/it/vps).

  </Accordion>

  <Accordion title="Posso eseguire OpenClaw in una VM e quali sono i requisiti?">
    Sì. Tratta una VM come un VPS: deve essere sempre accesa, raggiungibile e avere RAM sufficiente
    per il Gateway e gli eventuali canali abilitati.

    Linee guida di base:

    - **Minimo assoluto:** 1 vCPU, 1GB RAM.
    - **Consigliato:** 2GB RAM o più se esegui più canali, automazione browser o strumenti media.
    - **OS:** Ubuntu LTS o un altro Debian/Ubuntu moderno.

    Se sei su Windows, **WSL2 è la configurazione in stile VM più semplice** e con la migliore
    compatibilità degli strumenti. Vedi [Windows](/it/platforms/windows), [Hosting VPS](/it/vps).
    Se esegui macOS in una VM, vedi [VM macOS](/it/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Cos'è OpenClaw?

<AccordionGroup>
  <Accordion title="Che cos'è OpenClaw, in un paragrafo?">
    OpenClaw è un assistente AI personale che esegui sui tuoi dispositivi. Risponde sulle superfici di messaggistica che già usi (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat e plugin di canale inclusi come QQ Bot) e può anche fare voce + un Canvas live sulle piattaforme supportate. Il **Gateway** è il control plane sempre acceso; l'assistente è il prodotto.
  </Accordion>

  <Accordion title="Proposta di valore">
    OpenClaw non è "solo un wrapper di Claude". È un **control plane local-first** che ti permette di eseguire un
    assistente capace sul **tuo hardware**, raggiungibile dalle app chat che già usi, con
    sessioni con stato, memoria e strumenti, senza cedere il controllo dei tuoi flussi di lavoro a un
    SaaS ospitato.

    Punti di forza:

    - **I tuoi dispositivi, i tuoi dati:** esegui il Gateway dove vuoi (Mac, Linux, VPS) e tieni locale
      workspace + cronologia sessioni.
    - **Canali reali, non una sandbox web:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/ecc.,
      più voce mobile e Canvas sulle piattaforme supportate.
    - **Indipendente dal modello:** usa Anthropic, OpenAI, MiniMax, OpenRouter, ecc., con routing
      e failover per agente.
    - **Opzione solo locale:** esegui modelli locali così **tutti i dati possono restare sul tuo dispositivo** se vuoi.
    - **Instradamento multi-agent:** agenti separati per canale, account o attività, ognuno con il proprio
      workspace e valori predefiniti.
    - **Open source e hackable:** ispeziona, estendi e fai self-hosting senza lock-in del fornitore.

    Documentazione: [Gateway](/it/gateway), [Canali](/it/channels), [Multi-agent](/it/concepts/multi-agent),
    [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="L'ho appena configurato: cosa dovrei fare per prima cosa?">
    Buoni primi progetti:

    - Costruire un sito web (WordPress, Shopify o un semplice sito statico).
    - Prototipare un'app mobile (schema, schermate, piano API).
    - Organizzare file e cartelle (pulizia, denominazione, tagging).
    - Collegare Gmail e automatizzare riepiloghi o follow-up.

    Può gestire task grandi, ma funziona meglio quando li dividi in fasi e
    usi sub agents per lavoro in parallelo.

  </Accordion>

  <Accordion title="Quali sono i cinque casi d'uso quotidiani principali per OpenClaw?">
    I vantaggi quotidiani di solito sono questi:

    - **Briefing personali:** riepiloghi di inbox, calendario e notizie che ti interessano.
    - **Ricerca e stesura:** ricerca rapida, riepiloghi e prime bozze per email o documenti.
    - **Promemoria e follow-up:** solleciti e checklist guidati da cron o heartbeat.
    - **Automazione browser:** compilazione moduli, raccolta dati e ripetizione di task web.
    - **Coordinamento tra dispositivi:** invia un task dal telefono, lascia che il Gateway lo esegua su un server e ricevi il risultato in chat.

  </Accordion>

  <Accordion title="OpenClaw può aiutare con lead gen, outreach, ads e blog per un SaaS?">
    Sì per **ricerca, qualificazione e stesura**. Può analizzare siti, costruire shortlist,
    riepilogare prospect e scrivere bozze di outreach o copy per annunci.

    Per **outreach o campagne pubblicitarie**, mantieni un umano nel loop. Evita spam, rispetta leggi locali e
    policy delle piattaforme e rivedi tutto prima dell'invio. Il pattern più sicuro è lasciare che
    OpenClaw prepari una bozza e che tu approvi.

    Documentazione: [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i vantaggi rispetto a Claude Code per lo sviluppo web?">
    OpenClaw è un **assistente personale** e livello di coordinamento, non un sostituto dell'IDE. Usa
    Claude Code o Codex per il ciclo di coding diretto più rapido dentro un repo. Usa OpenClaw quando vuoi
    memoria durevole, accesso da più dispositivi e orchestrazione degli strumenti.

    Vantaggi:

    - **Memoria persistente + workspace** tra le sessioni
    - **Accesso multipiattaforma** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestrazione degli strumenti** (browser, file, pianificazione, hook)
    - **Gateway sempre acceso** (eseguilo su un VPS, interagisci da ovunque)
    - **Nodes** per browser/schermo/fotocamera/exec locali

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills e automazione

<AccordionGroup>
  <Accordion title="Come personalizzo le Skills senza mantenere il repo sporco?">
    Usa override gestiti invece di modificare la copia del repo. Inserisci le modifiche in `~/.openclaw/skills/<name>/SKILL.md` (oppure aggiungi una cartella tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json`). La precedenza è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, quindi gli override gestiti prevalgono comunque sulle Skills bundled senza toccare git. Se ti serve la skill installata globalmente ma visibile solo ad alcuni agenti, tieni la copia condivisa in `~/.openclaw/skills` e controlla la visibilità con `agents.defaults.skills` e `agents.list[].skills`. Solo le modifiche degne di upstream dovrebbero vivere nel repo ed essere inviate come PR.
  </Accordion>

  <Accordion title="Posso caricare Skills da una cartella personalizzata?">
    Sì. Aggiungi directory extra tramite `skills.load.extraDirs` in `~/.openclaw/openclaw.json` (precedenza più bassa). La precedenza predefinita è `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` installa in `./skills` per impostazione predefinita, che OpenClaw tratta come `<workspace>/skills` nella sessione successiva. Se la skill deve essere visibile solo a certi agenti, abbinalo a `agents.defaults.skills` o `agents.list[].skills`.
  </Accordion>

  <Accordion title="Come posso usare modelli diversi per task diversi?">
    Oggi i pattern supportati sono:

    - **Cron jobs**: i job isolati possono impostare un override `model` per job.
    - **Sub-agents**: instrada i task ad agenti separati con modelli predefiniti diversi.
    - **Cambio su richiesta**: usa `/model` per cambiare il modello della sessione corrente in qualsiasi momento.

    Vedi [Cron jobs](/it/automation/cron-jobs), [Instradamento multi-agent](/it/concepts/multi-agent) e [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Il bot si blocca mentre esegue lavoro pesante. Come lo scarico altrove?">
    Usa **sub-agents** per task lunghi o paralleli. I sub-agents girano nella loro sessione,
    restituiscono un riepilogo e mantengono reattiva la tua chat principale.

    Chiedi al tuo bot di "spawn a sub-agent for this task" oppure usa `/subagents`.
    Usa `/status` in chat per vedere cosa sta facendo il Gateway in questo momento (e se è occupato).

    Suggerimento token: task lunghi e sub-agents consumano entrambi token. Se il costo è un problema, imposta un
    modello più economico per i sub-agents tramite `agents.defaults.subagents.model`.

    Documentazione: [Sub-agents](/it/tools/subagents), [Task in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Come funzionano le sessioni subagent legate a un thread su Discord?">
    Usa i binding dei thread. Puoi associare un thread Discord a un target subagent o sessione così i messaggi successivi in quel thread restano su quella sessione associata.

    Flusso di base:

    - Avvia con `sessions_spawn` usando `thread: true` (e facoltativamente `mode: "session"` per follow-up persistente).
    - Oppure associa manualmente con `/focus <target>`.
    - Usa `/agents` per ispezionare lo stato del binding.
    - Usa `/session idle <duration|off>` e `/session max-age <duration|off>` per controllare l'auto-unfocus.
    - Usa `/unfocus` per scollegare il thread.

    Configurazione richiesta:

    - Valori predefiniti globali: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind allo spawn: imposta `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Documentazione: [Sub-agents](/it/tools/subagents), [Discord](/it/channels/discord), [Riferimento configurazione](/it/gateway/configuration-reference), [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Un subagent ha finito, ma l'aggiornamento di completamento è andato nel posto sbagliato o non è mai stato pubblicato. Cosa dovrei controllare?">
    Controlla prima il percorso del richiedente risolto:

    - La consegna del subagent in modalità completamento preferisce qualsiasi thread o percorso conversazione associato quando esiste.
    - Se l'origine del completamento porta solo un canale, OpenClaw usa come fallback il percorso archiviato della sessione richiedente (`lastChannel` / `lastTo` / `lastAccountId`) in modo che la consegna diretta possa comunque riuscire.
    - Se non esistono né un percorso associato né un percorso archiviato utilizzabile, la consegna diretta può fallire e il risultato ricade nella consegna in coda della sessione invece di essere pubblicato subito in chat.
    - Target non validi o obsoleti possono comunque forzare il fallback in coda o il fallimento finale della consegna.
    - Se l'ultima risposta assistente visibile del child è l'esatto token silenzioso `NO_REPLY` / `no_reply`, o esattamente `ANNOUNCE_SKIP`, OpenClaw sopprime intenzionalmente l'annuncio invece di pubblicare progressi precedenti ormai obsoleti.
    - Se il child è andato in timeout dopo sole chiamate a strumenti, l'annuncio può comprimere il tutto in un breve riepilogo dei progressi parziali invece di riprodurre l'output grezzo degli strumenti.

    Debug:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Sub-agents](/it/tools/subagents), [Task in background](/it/automation/tasks), [Strumento sessione](/it/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron o promemoria non partono. Cosa dovrei controllare?">
    Cron gira dentro il processo Gateway. Se il Gateway non è in esecuzione continua,
    i job pianificati non verranno eseguiti.

    Checklist:

    - Conferma che cron sia abilitato (`cron.enabled`) e che `OPENCLAW_SKIP_CRON` non sia impostato.
    - Controlla che il Gateway sia in esecuzione 24/7 (senza sospensioni/riavvii).
    - Verifica le impostazioni del fuso orario per il job (`--tz` rispetto al fuso orario host).

    Debug:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Documentazione: [Cron jobs](/it/automation/cron-jobs), [Automazione e task](/it/automation).

  </Accordion>

  <Accordion title="Cron è partito, ma non è stato inviato nulla al canale. Perché?">
    Controlla prima la modalità di consegna:

    - `--no-deliver` / `delivery.mode: "none"` significa che non è previsto alcun messaggio esterno.
    - Target annuncio mancante o non valido (`channel` / `to`) significa che il runner ha saltato la consegna in uscita.
    - Errori auth del canale (`unauthorized`, `Forbidden`) significano che il runner ha provato a consegnare ma le credenziali lo hanno bloccato.
    - Un risultato isolato silenzioso (`NO_REPLY` / `no_reply` soltanto) viene trattato come intenzionalmente non consegnabile, quindi il runner sopprime anche la consegna fallback in coda.

    Per i cron job isolati, il runner possiede la consegna finale. Ci si aspetta che l'agente
    restituisca un riepilogo in testo semplice da inviare dal runner. `--no-deliver` mantiene
    internamente quel risultato; non consente invece all'agente di inviare direttamente con
    lo strumento message.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Cron jobs](/it/automation/cron-jobs), [Task in background](/it/automation/tasks).

  </Accordion>

  <Accordion title="Perché un'esecuzione cron isolata ha cambiato modello o ritentato una volta?">
    Di solito è il percorso live di cambio modello, non una schedulazione duplicata.

    Un cron isolato può persistere un handoff di modello a runtime e ritentare quando l'esecuzione attiva
    genera `LiveSessionModelSwitchError`. Il retry mantiene il provider/modello cambiato
    e, se il cambio portava un nuovo override del profilo auth, cron
    persiste anche quello prima di ritentare.

    Regole di selezione correlate:

    - L'override del modello dell'hook Gmail vince per primo quando applicabile.
    - Poi il `model` per job.
    - Poi qualsiasi override di modello della sessione cron archiviato.
    - Poi la normale selezione modello predefinito/agente.

    Il ciclo di retry è limitato. Dopo il tentativo iniziale più 2 retry di cambio,
    cron interrompe invece di andare avanti all'infinito.

    Debug:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Documentazione: [Cron jobs](/it/automation/cron-jobs), [CLI cron](/cli/cron).

  </Accordion>

  <Accordion title="Come installo Skills su Linux?">
    Usa i comandi nativi `openclaw skills` oppure inserisci le Skills nel tuo workspace. La UI Skills di macOS non è disponibile su Linux.
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
    sincronizzare le tue Skills. Per installazioni condivise tra agenti, inserisci la skill in
    `~/.openclaw/skills` e usa `agents.defaults.skills` o
    `agents.list[].skills` se vuoi restringere quali agenti possono vederla.

  </Accordion>

  <Accordion title="OpenClaw può eseguire task a intervalli o continuamente in background?">
    Sì. Usa lo scheduler del Gateway:

    - **Cron jobs** per task pianificati o ricorrenti (persistono dopo i riavvii).
    - **Heartbeat** per controlli periodici della "sessione principale".
    - **Job isolati** per agenti autonomi che pubblicano riepiloghi o consegnano alle chat.

    Documentazione: [Cron jobs](/it/automation/cron-jobs), [Automazione e task](/it/automation),
    [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title="Posso eseguire da Linux Skills Apple solo macOS?">
    Non direttamente. Le Skills macOS sono controllate da `metadata.openclaw.os` più i binari richiesti, e le Skills compaiono nel system prompt solo quando sono idonee sul **gateway host**. Su Linux, le Skills solo `darwin` (come `apple-notes`, `apple-reminders`, `things-mac`) non verranno caricate a meno che tu non forzi il gating.

    Hai tre pattern supportati:

    **Opzione A - eseguire il Gateway su un Mac (più semplice).**
    Esegui il Gateway dove esistono i binari macOS, poi collegati da Linux in [modalità remota](#gateway-ports-already-running-and-remote-mode) o tramite Tailscale. Le Skills si caricano normalmente perché il gateway host è macOS.

    **Opzione B - usare un nodo macOS (senza SSH).**
    Esegui il Gateway su Linux, associa un nodo macOS (app menubar) e imposta **Node Run Commands** su "Always Ask" o "Always Allow" sul Mac. OpenClaw può trattare le Skills solo macOS come idonee quando i binari richiesti esistono sul nodo. L'agente esegue tali Skills tramite lo strumento `nodes`. Se scegli "Always Ask", approvare "Always Allow" nel prompt aggiunge quel comando all'allowlist.

    **Opzione C - fare proxy dei binari macOS tramite SSH (avanzato).**
    Tieni il Gateway su Linux, ma fai in modo che i binari CLI richiesti vengano risolti in wrapper SSH che girano su un Mac. Poi forza la skill per consentire Linux così resta idonea.

    1. Crea un wrapper SSH per il binario (esempio: `memo` per Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Inserisci il wrapper nel `PATH` sull'host Linux (per esempio `~/bin/memo`).
    3. Forza i metadata della skill (workspace o `~/.openclaw/skills`) per consentire Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Avvia una nuova sessione così si aggiorna lo snapshot delle Skills.

  </Accordion>

  <Accordion title="Avete un'integrazione Notion o HeyGen?">
    Non integrata nativamente oggi.

    Opzioni:

    - **Skill / plugin personalizzato:** migliore per accesso API affidabile (sia Notion che HeyGen hanno API).
    - **Automazione browser:** funziona senza codice ma è più lenta e fragile.

    Se vuoi mantenere il contesto per cliente (flussi di lavoro agency), un pattern semplice è:

    - Una pagina Notion per cliente (contesto + preferenze + lavoro attivo).
    - Chiedi all'agente di recuperare quella pagina all'inizio della sessione.

    Se vuoi un'integrazione nativa, apri una richiesta di funzionalità o crea una skill
    destinata a quelle API.

    Installa Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Le installazioni native finiscono nella directory `skills/` del workspace attivo. Per Skills condivise tra agenti, posizionale in `~/.openclaw/skills/<name>/SKILL.md`. Se solo alcuni agenti devono vedere un'installazione condivisa, configura `agents.defaults.skills` o `agents.list[].skills`. Alcune Skills si aspettano binari installati tramite Homebrew; su Linux significa Linuxbrew (vedi la voce FAQ Homebrew Linux sopra). Vedi [Skills](/it/tools/skills), [Config Skills](/it/tools/skills-config) e [ClawHub](/it/tools/clawhub).

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

    Questo percorso è locale all'host. Se il Gateway gira altrove, esegui un node host sulla macchina del browser oppure usa CDP remoto.

    Limiti attuali di `existing-session` / `user`:

    - le azioni sono guidate da ref, non da selettori CSS
    - gli upload richiedono `ref` / `inputRef` e attualmente supportano un file alla volta
    - `responsebody`, esportazione PDF, intercettazione download e azioni batch richiedono ancora un browser gestito o un profilo CDP grezzo

  </Accordion>
</AccordionGroup>

## Sandboxing e memoria

<AccordionGroup>
  <Accordion title="Esiste una documentazione dedicata al sandboxing?">
    Sì. Vedi [Sandboxing](/it/gateway/sandboxing). Per configurazione specifica Docker (gateway completo in Docker o immagini sandbox), vedi [Docker](/it/install/docker).
  </Accordion>

  <Accordion title="Docker sembra limitato: come abilito tutte le funzionalità?">
    L'immagine predefinita è orientata alla sicurezza ed esegue come utente `node`, quindi non
    include pacchetti di sistema, Homebrew o browser inclusi. Per una configurazione più completa:

    - Rendi persistente `/home/node` con `OPENCLAW_HOME_VOLUME` così le cache sopravvivono.
    - Inserisci le dipendenze di sistema nell'immagine con `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Installa i browser Playwright tramite la CLI inclusa:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Imposta `PLAYWRIGHT_BROWSERS_PATH` e assicurati che il percorso sia persistente.

    Documentazione: [Docker](/it/install/docker), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="Posso mantenere i DM personali ma rendere i gruppi pubblici/sandboxed con un solo agente?">
    Sì, se il tuo traffico privato sono **DM** e il tuo traffico pubblico sono **gruppi**.

    Usa `agents.defaults.sandbox.mode: "non-main"` così le sessioni di gruppo/canale (chiavi non-main) girano in Docker, mentre la sessione DM principale resta sull'host. Poi limita gli strumenti disponibili nelle sessioni sandboxate tramite `tools.sandbox.tools`.

    Guida configurazione + esempio: [Gruppi: DM personali + gruppi pubblici](/it/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Riferimento configurazione chiave: [Configurazione Gateway](/it/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Come associo una cartella host alla sandbox?">
    Imposta `agents.defaults.sandbox.docker.binds` su `["host:path:mode"]` (es. `"/home/user/src:/src:ro"`). I bind globali + per agente vengono uniti; i bind per agente sono ignorati quando `scope: "shared"`. Usa `:ro` per qualsiasi cosa sensibile e ricorda che i bind aggirano le pareti del filesystem della sandbox.

    OpenClaw valida le origini bind sia rispetto al percorso normalizzato sia al percorso canonico risolto tramite l'antenato esistente più profondo. Questo significa che le escape tramite genitori symlink continuano a fallire in modo chiuso anche quando l'ultimo segmento del percorso non esiste ancora, e i controlli delle radici consentite si applicano ancora dopo la risoluzione dei symlink.

    Vedi [Sandboxing](/it/gateway/sandboxing#custom-bind-mounts) e [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) per esempi e note di sicurezza.

  </Accordion>

  <Accordion title="Come funziona la memoria?">
    La memoria OpenClaw è semplicemente costituita da file Markdown nel workspace dell'agente:

    - Note giornaliere in `memory/YYYY-MM-DD.md`
    - Note curate a lungo termine in `MEMORY.md` (solo sessioni principali/private)

    OpenClaw esegue anche un **flush silenzioso della memoria prima della compattazione** per ricordare al modello
    di scrivere note durevoli prima della compattazione automatica. Questo avviene solo quando il workspace
    è scrivibile (le sandbox in sola lettura lo saltano). Vedi [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="La memoria continua a dimenticare cose. Come faccio a farle restare?">
    Chiedi al bot di **scrivere il fatto nella memoria**. Le note a lungo termine appartengono a `MEMORY.md`,
    il contesto a breve termine va in `memory/YYYY-MM-DD.md`.

    Questa è ancora un'area che stiamo migliorando. Aiuta ricordare al modello di archiviare memorie;
    saprà cosa fare. Se continua a dimenticare, verifica che il Gateway stia usando lo stesso
    workspace a ogni esecuzione.

    Documentazione: [Memoria](/it/concepts/memory), [Workspace dell'agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="La memoria persiste per sempre? Quali sono i limiti?">
    I file di memoria vivono sul disco e persistono finché non li elimini. Il limite è il tuo
    spazio di archiviazione, non il modello. Il **contesto di sessione** resta comunque limitato dalla finestra di contesto
    del modello, quindi conversazioni lunghe possono essere compattate o troncate. Ecco perché
    esiste la ricerca in memoria: recupera solo le parti rilevanti nel contesto.

    Documentazione: [Memoria](/it/concepts/memory), [Contesto](/it/concepts/context).

  </Accordion>

  <Accordion title="La ricerca semantica in memoria richiede una chiave API OpenAI?">
    Solo se usi **embedding OpenAI**. Codex OAuth copre chat/completions e
    **non** concede accesso agli embedding, quindi **accedere con Codex (OAuth o
    login Codex CLI)** non aiuta per la ricerca semantica in memoria. Gli embedding OpenAI
    richiedono ancora una vera chiave API (`OPENAI_API_KEY` o `models.providers.openai.apiKey`).

    Se non imposti esplicitamente un provider, OpenClaw ne seleziona automaticamente uno quando
    può risolvere una chiave API (profili auth, `models.providers.*.apiKey` o variabili env).
    Preferisce OpenAI se riesce a risolvere una chiave OpenAI, altrimenti Gemini se riesce a risolvere
    una chiave Gemini, poi Voyage, poi Mistral. Se non è disponibile alcuna chiave remota, la ricerca in
    memoria resta disabilitata finché non la configuri. Se hai configurato e presente un percorso per modello locale, OpenClaw
    preferisce `local`. Ollama è supportato quando imposti esplicitamente
    `memorySearch.provider = "ollama"`.

    Se preferisci restare locale, imposta `memorySearch.provider = "local"` (e facoltativamente
    `memorySearch.fallback = "none"`). Se vuoi embedding Gemini, imposta
    `memorySearch.provider = "gemini"` e fornisci `GEMINI_API_KEY` (o
    `memorySearch.remote.apiKey`). Supportiamo modelli di embedding **OpenAI, Gemini, Voyage, Mistral, Ollama o local**:
    vedi [Memoria](/it/concepts/memory) per i dettagli di configurazione.

  </Accordion>
</AccordionGroup>

## Dove si trova tutto sul disco

<AccordionGroup>
  <Accordion title="Tutti i dati usati con OpenClaw vengono salvati localmente?">
    No - **lo stato di OpenClaw è locale**, ma **i servizi esterni vedono comunque ciò che gli invii**.

    - **Locale per impostazione predefinita:** sessioni, file di memoria, configurazione e workspace vivono sul gateway host
      (`~/.openclaw` + la directory del tuo workspace).
    - **Remoto per necessità:** i messaggi che invii ai provider di modelli (Anthropic/OpenAI/ecc.) vanno alle
      loro API, e le piattaforme chat (WhatsApp/Telegram/Slack/ecc.) archiviano i dati dei messaggi sui loro
      server.
    - **Controlli tu l'impronta:** usare modelli locali mantiene i prompt sulla tua macchina, ma il
      traffico del canale passa comunque dai server del canale.

    Correlati: [Workspace dell'agente](/it/concepts/agent-workspace), [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="Dove OpenClaw archivia i propri dati?">
    Tutto vive sotto `$OPENCLAW_STATE_DIR` (predefinito: `~/.openclaw`):

    | Path                                                            | Scopo                                                              |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Configurazione principale (JSON5)                                  |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Import legacy OAuth (copiato nei profili auth al primo utilizzo)   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Profili auth (OAuth, chiavi API e `keyRef`/`tokenRef` facoltativi) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Payload secret facoltativo su file per provider SecretRef `file`   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | File legacy di compatibilità (voci statiche `api_key` ripulite)    |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Stato provider (es. `whatsapp/<accountId>/creds.json`)             |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Stato per agente (agentDir + sessioni)                             |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Cronologia e stato conversazioni (per agente)                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadati sessioni (per agente)                                     |

    Percorso legacy single-agent: `~/.openclaw/agent/*` (migrato da `openclaw doctor`).

    Il tuo **workspace** (`AGENTS.md`, file memoria, Skills, ecc.) è separato e configurato tramite `agents.defaults.workspace` (predefinito: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Dove dovrebbero trovarsi AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Questi file vivono nel **workspace dell'agente**, non in `~/.openclaw`.

    - **Workspace (per agente)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (o fallback legacy `memory.md` quando `MEMORY.md` è assente),
      `memory/YYYY-MM-DD.md`, `HEARTBEAT.md` facoltativo.
    - **Directory di stato (`~/.openclaw`)**: configurazione, stato canali/provider, profili auth, sessioni, log,
      e Skills condivise (`~/.openclaw/skills`).

    Il workspace predefinito è `~/.openclaw/workspace`, configurabile tramite:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Se il bot "dimentica" dopo un riavvio, conferma che il Gateway stia usando lo stesso
    workspace a ogni avvio (e ricorda: in modalità remota viene usato il workspace del **gateway host**,
    non quello del tuo laptop locale).

    Suggerimento: se vuoi un comportamento o una preferenza durevoli, chiedi al bot di **scriverli in
    AGENTS.md o MEMORY.md** invece di affidarti alla cronologia chat.

    Vedi [Workspace dell'agente](/it/concepts/agent-workspace) e [Memoria](/it/concepts/memory).

  </Accordion>

  <Accordion title="Strategia di backup consigliata">
    Metti il tuo **workspace dell'agente** in un repo git **privato** e fai backup in un luogo
    privato (per esempio GitHub privato). In questo modo catturi memoria + file AGENTS/SOUL/USER
    e puoi ripristinare più tardi la "mente" dell'assistente.

    **Non** fare commit di nulla sotto `~/.openclaw` (credenziali, sessioni, token o payload di secret cifrati).
    Se hai bisogno di un ripristino completo, esegui il backup separato sia del workspace sia della directory di stato
    (vedi la domanda sulla migrazione sopra).

    Documentazione: [Workspace dell'agente](/it/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Come disinstallo completamente OpenClaw?">
    Vedi la guida dedicata: [Disinstallazione](/it/install/uninstall).
  </Accordion>

  <Accordion title="Gli agenti possono lavorare fuori dal workspace?">
    Sì. Il workspace è la **cwd predefinita** e l'ancora della memoria, non una sandbox rigida.
    I percorsi relativi vengono risolti nel workspace, ma i percorsi assoluti possono accedere ad altre
    posizioni host a meno che il sandboxing non sia abilitato. Se ti serve isolamento, usa
    [`agents.defaults.sandbox`](/it/gateway/sandboxing) o impostazioni sandbox per agente. Se vuoi
    che un repo sia la directory di lavoro predefinita, fai puntare il `workspace` di quell'agente
    alla root del repo. Il repo OpenClaw è solo codice sorgente; tieni il
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

  <Accordion title="Modalità remota: dove si trova l'archivio delle sessioni?">
    Lo stato della sessione appartiene al **gateway host**. Se sei in modalità remota, l'archivio sessioni che ti interessa è sulla macchina remota, non sul tuo laptop locale. Vedi [Gestione sessioni](/it/concepts/session).
  </Accordion>
</AccordionGroup>

## Nozioni di base della configurazione

<AccordionGroup>
  <Accordion title="Che formato ha la configurazione? Dov'è?">
    OpenClaw legge una configurazione facoltativa in **JSON5** da `$OPENCLAW_CONFIG_PATH` (predefinito: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Se il file manca, usa valori predefiniti abbastanza sicuri (incluso un workspace predefinito `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Ho impostato gateway.bind: "lan" (o "tailnet") e ora nulla è in ascolto / la UI dice unauthorized'>
    I bind non loopback **richiedono un percorso di autenticazione gateway valido**. In pratica significa:

    - autenticazione shared-secret: token o password
    - `gateway.auth.mode: "trusted-proxy"` dietro un reverse proxy identity-aware non loopback configurato correttamente

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
    - Se `gateway.auth.token` / `gateway.auth.password` sono esplicitamente configurati tramite SecretRef e non risolti, la risoluzione fallisce in modo chiuso (nessun fallback remoto che mascheri il problema).
    - Le configurazioni Control UI con shared secret si autenticano tramite `connect.params.auth.token` o `connect.params.auth.password` (memorizzati nelle impostazioni app/UI). Le modalità che portano identità come Tailscale Serve o `trusted-proxy` usano invece gli header della richiesta. Evita di inserire shared secret negli URL.
    - Con `gateway.auth.mode: "trusted-proxy"`, i reverse proxy loopback sulla stessa macchina **non** soddisfano comunque l'autenticazione trusted-proxy. Il trusted proxy deve essere una sorgente non loopback configurata.

  </Accordion>

  <Accordion title="Perché ora mi serve un token su localhost?">
    OpenClaw applica l'autenticazione del gateway per impostazione predefinita, incluso loopback. Nel normale percorso predefinito significa autenticazione token: se non è configurato alcun percorso auth esplicito, l'avvio del gateway si risolve in modalità token e ne genera automaticamente uno, salvandolo in `gateway.auth.token`, quindi i **client WS locali devono autenticarsi**. Questo impedisce ad altri processi locali di chiamare il Gateway.

    Se preferisci un percorso auth diverso, puoi scegliere esplicitamente la modalità password (o, per reverse proxy identity-aware non loopback, `trusted-proxy`). Se **davvero** vuoi loopback aperto, imposta esplicitamente `gateway.auth.mode: "none"` nella tua configurazione. Doctor può generare un token in qualsiasi momento: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Devo riavviare dopo aver cambiato configurazione?">
    Il Gateway osserva la configurazione e supporta il hot-reload:

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
    - `default`: usa sempre `All your chats, one OpenClaw.`.
    - `random`: slogan divertenti/stagionali a rotazione (comportamento predefinito).
    - Se non vuoi alcun banner, imposta la env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Come abilito web search (e web fetch)?">
    `web_fetch` funziona senza chiave API. `web_search` dipende dal
    provider selezionato:

    - I provider basati su API come Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity e Tavily richiedono la normale configurazione della chiave API.
    - Ollama Web Search non richiede chiavi, ma usa l'host Ollama configurato e richiede `ollama signin`.
    - DuckDuckGo non richiede chiavi, ma è un'integrazione non ufficiale basata su HTML.
    - SearXNG non richiede chiavi/è self-hosted; configura `SEARXNG_BASE_URL` o `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Consigliato:** esegui `openclaw configure --section web` e scegli un provider.
    Alternative env:

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
              provider: "firecrawl", // facoltativo; ometti per auto-detect
            },
          },
        },
    }
    ```

    La configurazione web-search specifica del provider ora vive sotto `plugins.entries.<plugin>.config.webSearch.*`.
    I percorsi provider legacy `tools.web.search.*` vengono ancora caricati temporaneamente per compatibilità, ma non dovrebbero essere usati per nuove configurazioni.
    La configurazione fallback web-fetch di Firecrawl vive sotto `plugins.entries.firecrawl.config.webFetch.*`.

    Note:

    - Se usi allowlist, aggiungi `web_search`/`web_fetch`/`x_search` o `group:web`.
    - `web_fetch` è abilitato per impostazione predefinita (a meno che non venga disabilitato esplicitamente).
    - Se `tools.web.fetch.provider` è omesso, OpenClaw rileva automaticamente il primo provider fallback fetch pronto tra le credenziali disponibili. Oggi il provider bundled è Firecrawl.
    - I daemon leggono le variabili env da `~/.openclaw/.env` (o dall'ambiente del servizio).

    Documentazione: [Strumenti web](/it/tools/web).

  </Accordion>

  <Accordion title="config.apply ha cancellato la mia configurazione. Come recupero ed evito che accada di nuovo?">
    `config.apply` sostituisce **l'intera configurazione**. Se invii un oggetto parziale, tutto il
    resto viene rimosso.

    Recupero:

    - Ripristina da backup (git o una copia di `~/.openclaw/openclaw.json`).
    - Se non hai backup, riesegui `openclaw doctor` e riconfigura canali/modelli.
    - Se non te l'aspettavi, segnala un bug e includi l'ultima configurazione nota o qualsiasi backup.
    - Un agente di coding locale spesso può ricostruire una configurazione funzionante da log o cronologia.

    Per evitarlo:

    - Usa `openclaw config set` per piccole modifiche.
    - Usa `openclaw configure` per modifiche interattive.
    - Usa prima `config.schema.lookup` quando non sei sicuro del percorso esatto o della forma di un campo; restituisce un nodo schema superficiale più riepiloghi dei figli immediati per l'esplorazione.
    - Usa `config.patch` per modifiche RPC parziali; riserva `config.apply` solo alla sostituzione completa della configurazione.
    - Se usi lo strumento `gateway` solo-owner da un'esecuzione agente, rifiuterà comunque le scritture su `tools.exec.ask` / `tools.exec.security` (incluse le alias legacy `tools.bash.*` che vengono normalizzate agli stessi percorsi exec protetti).

    Documentazione: [Config](/cli/config), [Configurazione guidata](/cli/configure), [Doctor](/it/gateway/doctor).

  </Accordion>

  <Accordion title="Come eseguo un Gateway centrale con worker specializzati su più dispositivi?">
    Il pattern comune è **un Gateway** (es. Raspberry Pi) più **nodes** e **agents**:

    - **Gateway (centrale):** possiede canali (Signal/WhatsApp), instradamento e sessioni.
    - **Nodes (dispositivi):** Mac/iOS/Android si collegano come periferiche ed espongono strumenti locali (`system.run`, `canvas`, `camera`).
    - **Agents (worker):** cervelli/workspace separati per ruoli specializzati (es. "Hetzner ops", "Dati personali").
    - **Sub-agents:** avviano lavoro in background da un agente principale quando vuoi parallelismo.
    - **TUI:** si collega al Gateway e cambia agenti/sessioni.

    Documentazione: [Nodes](/it/nodes), [Accesso remoto](/it/gateway/remote), [Instradamento multi-agent](/it/concepts/multi-agent), [Sub-agents](/it/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Il browser OpenClaw può girare headless?">
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

    Il valore predefinito è `false` (con interfaccia). La modalità headless ha più probabilità di attivare controlli anti-bot su alcuni siti. Vedi [Browser](/it/tools/browser).

    Headless usa lo **stesso motore Chromium** e funziona per la maggior parte dell'automazione (moduli, clic, scraping, login). Le differenze principali:

    - Nessuna finestra browser visibile (usa screenshot se hai bisogno di elementi visuali).
    - Alcuni siti sono più severi con l'automazione in modalità headless (CAPTCHA, anti-bot).
      Per esempio, X/Twitter spesso blocca le sessioni headless.

  </Accordion>

  <Accordion title="Come uso Brave per il controllo del browser?">
    Imposta `browser.executablePath` sul binario di Brave (o di qualsiasi browser basato su Chromium) e riavvia il Gateway.
    Vedi gli esempi completi di configurazione in [Browser](/it/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Gateway remoti e nodes

<AccordionGroup>
  <Accordion title="Come si propagano i comandi tra Telegram, il gateway e i nodes?">
    I messaggi Telegram sono gestiti dal **gateway**. Il gateway esegue l'agente e
    solo dopo chiama i nodes tramite il **Gateway WebSocket** quando serve uno strumento node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    I nodes non vedono il traffico provider in ingresso; ricevono solo chiamate RPC node.

  </Accordion>

  <Accordion title="Come può il mio agente accedere al mio computer se il Gateway è ospitato in remoto?">
    Risposta breve: **associa il tuo computer come nodo**. Il Gateway gira altrove, ma può
    chiamare strumenti `node.*` (schermo, fotocamera, sistema) sulla tua macchina locale tramite Gateway WebSocket.

    Configurazione tipica:

    1. Esegui il Gateway sull'host sempre acceso (VPS/home server).
    2. Metti il gateway host + il tuo computer sulla stessa tailnet.
    3. Assicurati che il Gateway WS sia raggiungibile (bind tailnet o tunnel SSH).
    4. Apri l'app macOS in modalità **Remote over SSH** (o tailnet diretta)
       così può registrarsi come nodo.
    5. Approva il nodo sul Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Non serve un bridge TCP separato; i nodes si collegano tramite Gateway WebSocket.

    Promemoria sicurezza: associare un nodo macOS consente `system.run` su quella macchina. Associa
    solo dispositivi di cui ti fidi e consulta [Sicurezza](/it/gateway/security).

    Documentazione: [Nodes](/it/nodes), [Protocollo Gateway](/it/gateway/protocol), [modalità remota macOS](/it/platforms/mac/remote), [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Tailscale è connesso ma non ricevo risposte. E adesso?">
    Controlla le basi:

    - Il Gateway è in esecuzione: `openclaw gateway status`
    - Stato di salute del Gateway: `openclaw status`
    - Stato di salute dei canali: `openclaw channels status`

    Poi verifica autenticazione e instradamento:

    - Se usi Tailscale Serve, assicurati che `gateway.auth.allowTailscale` sia impostato correttamente.
    - Se ti colleghi tramite tunnel SSH, conferma che il tunnel locale sia attivo e punti alla porta corretta.
    - Conferma che le allowlist (DM o gruppo) includano il tuo account.

    Documentazione: [Tailscale](/it/gateway/tailscale), [Accesso remoto](/it/gateway/remote), [Canali](/it/channels).

  </Accordion>

  <Accordion title="Due istanze OpenClaw possono parlarsi tra loro (locale + VPS)?">
    Sì. Non esiste un bridge "bot-to-bot" integrato, ma puoi collegarlo in alcuni modi
    affidabili:

    **Più semplice:** usa un normale canale chat accessibile a entrambi i bot (Telegram/Slack/WhatsApp).
    Fai inviare a Bot A un messaggio a Bot B, poi lascia che Bot B risponda normalmente.

    **Bridge CLI (generico):** esegui uno script che chiami l'altro Gateway con
    `openclaw agent --message ... --deliver`, puntando a una chat in cui l'altro bot
    ascolta. Se un bot è su un VPS remoto, punta la tua CLI a quel Gateway remoto
    tramite SSH/Tailscale (vedi [Accesso remoto](/it/gateway/remote)).

    Pattern di esempio (esegui da una macchina che possa raggiungere il Gateway di destinazione):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Suggerimento: aggiungi una protezione così i due bot non entrino in loop senza fine (solo menzione,
    allowlist del canale o una regola "non rispondere ai messaggi del bot").

    Documentazione: [Accesso remoto](/it/gateway/remote), [CLI Agent](/cli/agent), [Invio agente](/it/tools/agent-send).

  </Accordion>

  <Accordion title="Mi servono VPS separati per più agenti?">
    No. Un Gateway può ospitare più agenti, ognuno con il proprio workspace, modelli predefiniti
    e instradamento. Questa è la configurazione normale ed è molto più economica e semplice che eseguire
    un VPS per agente.

    Usa VPS separati solo quando hai bisogno di isolamento rigido (confini di sicurezza) o di
    configurazioni molto diverse che non vuoi condividere. Altrimenti, mantieni un solo Gateway e
    usa più agenti o sub-agents.

  </Accordion>

  <Accordion title="C'è un vantaggio nell'usare un nodo sul mio laptop personale invece di SSH da un VPS?">
    Sì: i nodes sono il modo di prima classe per raggiungere il tuo laptop da un Gateway remoto e
    sbloccano più del semplice accesso shell. Il Gateway gira su macOS/Linux (Windows via WSL2) ed è
    leggero (va bene un piccolo VPS o una macchina tipo Raspberry Pi; 4 GB RAM sono abbondanti), quindi una configurazione comune
    è un host sempre acceso più il tuo laptop come nodo.

    - **Nessun SSH in ingresso richiesto.** I nodes si connettono in uscita al Gateway WebSocket e usano il pairing del dispositivo.
    - **Controlli di esecuzione più sicuri.** `system.run` è regolato da allowlist/approvazioni del nodo su quel laptop.
    - **Più strumenti del dispositivo.** I nodes espongono `canvas`, `camera` e `screen` oltre a `system.run`.
    - **Automazione browser locale.** Mantieni il Gateway su un VPS ma esegui Chrome localmente tramite un node host sul laptop, oppure collegati a Chrome locale sull'host tramite Chrome MCP.

    SSH va bene per accesso shell occasionale, ma i nodes sono più semplici per flussi di lavoro continui dell'agente e
    automazione del dispositivo.

    Documentazione: [Nodes](/it/nodes), [CLI Nodes](/cli/nodes), [Browser](/it/tools/browser).

  </Accordion>

  <Accordion title="I nodes eseguono un servizio gateway?">
    No. **Un solo gateway** dovrebbe girare per host a meno che tu non esegua intenzionalmente profili isolati (vedi [Gateway multipli](/it/gateway/multiple-gateways)). I nodes sono periferiche che si collegano
    al gateway (nodi iOS/Android o "node mode" macOS nell'app menubar). Per node
    host headless e controllo CLI, vedi [CLI Node host](/cli/node).

    È richiesto un riavvio completo per modifiche a `gateway`, `discovery` e `canvasHost`.

  </Accordion>

  <Accordion title="Esiste un modo API / RPC per applicare la configurazione?">
    Sì.

    - `config.schema.lookup`: ispeziona un sottoalbero della configurazione con il suo nodo schema superficiale, hint UI corrispondente e riepiloghi dei figli immediati prima della scrittura
    - `config.get`: recupera lo snapshot corrente + hash
    - `config.patch`: aggiornamento parziale sicuro (preferito per la maggior parte delle modifiche RPC)
    - `config.apply`: valida + sostituisce la configurazione completa, poi riavvia
    - Lo strumento runtime `gateway` solo-owner continua a rifiutare la riscrittura di `tools.exec.ask` / `tools.exec.security`; le alias legacy `tools.bash.*` vengono normalizzate agli stessi percorsi exec protetti

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
       - Nella console admin di Tailscale, abilita MagicDNS così il VPS avrà un nome stabile.
    4. **Usa il nome host tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Se vuoi Control UI senza SSH, usa Tailscale Serve sul VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Questo mantiene il gateway associato a loopback ed espone HTTPS tramite Tailscale. Vedi [Tailscale](/it/gateway/tailscale).

  </Accordion>

  <Accordion title="Come collego un nodo Mac a un Gateway remoto (Tailscale Serve)?">
    Serve espone la **Gateway Control UI + WS**. I nodes si collegano tramite lo stesso endpoint Gateway WS.

    Configurazione consigliata:

    1. **Assicurati che VPS + Mac siano sulla stessa tailnet**.
    2. **Usa l'app macOS in modalità Remote** (l'obiettivo SSH può essere il nome host tailnet).
       L'app tunnelizza la porta del Gateway e si collega come nodo.
    3. **Approva il nodo** sul gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Documentazione: [Protocollo Gateway](/it/gateway/protocol), [Discovery](/it/gateway/discovery), [modalità remota macOS](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Dovrei installare su un secondo laptop o aggiungere semplicemente un nodo?">
    Se ti servono solo **strumenti locali** (schermo/fotocamera/exec) sul secondo laptop, aggiungilo come
    **nodo**. In questo modo mantieni un solo Gateway ed eviti configurazioni duplicate. Gli strumenti node locali sono
    attualmente solo macOS, ma prevediamo di estenderli ad altri OS.

    Installa un secondo Gateway solo quando hai bisogno di **isolamento rigido** o di due bot completamente separati.

    Documentazione: [Nodes](/it/nodes), [CLI Nodes](/cli/nodes), [Gateway multipli](/it/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Variabili env e caricamento .env

<AccordionGroup>
  <Accordion title="Come OpenClaw carica le variabili d'ambiente?">
    OpenClaw legge le variabili env dal processo padre (shell, launchd/systemd, CI, ecc.) e inoltre carica:

    - `.env` dalla directory di lavoro corrente
    - un fallback globale `.env` da `~/.openclaw/.env` (alias `$OPENCLAW_STATE_DIR/.env`)

    Nessuno dei file `.env` sovrascrive variabili env esistenti.

    Puoi anche definire variabili env inline nella configurazione (applicate solo se mancanti dal process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Vedi [/environment](/it/help/environment) per precedenza completa e sorgenti.

  </Accordion>

  <Accordion title="Ho avviato il Gateway tramite servizio e le mie variabili env sono scomparse. E adesso?">
    Due correzioni comuni:

    1. Metti le chiavi mancanti in `~/.openclaw/.env` così verranno caricate anche quando il servizio non eredita l'env della tua shell.
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

    Questo esegue la tua login shell e importa solo le chiavi attese mancanti (senza mai sovrascrivere). Equivalenti env:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Ho impostato COPILOT_GITHUB_TOKEN, ma models status mostra "Shell env: off." Perché?'>
    `openclaw models status` riporta se **l'import della shell env** è abilitato. "Shell env: off"
    **non** significa che le tue variabili env manchino: significa solo che OpenClaw non caricherà
    automaticamente la tua login shell.

    Se il Gateway gira come servizio (launchd/systemd), non erediterà l'ambiente
    della tua shell. Correggi in uno di questi modi:

    1. Metti il token in `~/.openclaw/.env`:

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

## Sessioni e chat multiple

<AccordionGroup>
  <Accordion title="Come avvio una nuova conversazione?">
    Invia `/new` o `/reset` come messaggio standalone. Vedi [Gestione sessioni](/it/concepts/session).
  </Accordion>

  <Accordion title="Le sessioni si resettano automaticamente se non invio mai /new?">
    Le sessioni possono scadere dopo `session.idleMinutes`, ma questo è **disabilitato per impostazione predefinita** (valore predefinito **0**).
    Impostalo a un valore positivo per abilitare la scadenza per inattività. Quando abilitata, il messaggio **successivo**
    dopo il periodo di inattività avvia un nuovo session id per quella chiave chat.
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
    Sì, tramite **instradamento multi-agent** e **sub-agents**. Puoi creare un agente coordinatore
    e diversi agenti worker con workspace e modelli propri.

    Detto questo, è meglio considerarlo come un **esperimento divertente**. Consuma molti token ed è spesso
    meno efficiente che usare un solo bot con sessioni separate. Il modello tipico che
    immaginiamo è un solo bot con cui parli, con sessioni diverse per lavoro in parallelo. Quel
    bot può anche generare sub-agents quando necessario.

    Documentazione: [Instradamento multi-agent](/it/concepts/multi-agent), [Sub-agents](/it/tools/subagents), [CLI Agents](/cli/agents).

  </Accordion>

  <Accordion title="Perché il contesto è stato troncato a metà task? Come lo evito?">
    Il contesto di sessione è limitato dalla finestra del modello. Chat lunghe, output di strumenti grandi o molti
    file possono attivare compattazione o troncamento.

    Cosa aiuta:

    - Chiedi al bot di riepilogare lo stato corrente e scriverlo in un file.
    - Usa `/compact` prima di task lunghi e `/new` quando cambi argomento.
    - Tieni il contesto importante nel workspace e chiedi al bot di rileggerlo.
    - Usa sub-agents per lavori lunghi o paralleli così la chat principale resta più piccola.
    - Scegli un modello con una finestra di contesto più grande se questo succede spesso.

  </Accordion>

  <Accordion title="Come resetto completamente OpenClaw mantenendolo installato?">
    Usa il comando reset:

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
    - Se hai usato profili (`--profile` / `OPENCLAW_PROFILE`), resetta ogni directory di stato (predefinite: `~/.openclaw-<profile>`).
    - Reset dev: `openclaw gateway --dev --reset` (solo dev; cancella config dev + credenziali + sessioni + workspace).

  </Accordion>

  <Accordion title='Ricevo errori "context too large": come resetto o compatto?'>
    Usa una di queste opzioni:

    - **Compatta** (mantiene la conversazione ma riepiloga i turni più vecchi):

      ```
      /compact
      ```

      oppure `/compact <instructions>` per guidare il riepilogo.

    - **Reset** (nuovo session ID per la stessa chiave chat):

      ```
      /new
      /reset
      ```

    Se continua a succedere:

    - Abilita o regola la **session pruning** (`agents.defaults.contextPruning`) per ridurre il vecchio output degli strumenti.
    - Usa un modello con una finestra di contesto più ampia.

    Documentazione: [Compattazione](/it/concepts/compaction), [Session pruning](/it/concepts/session-pruning), [Gestione sessioni](/it/concepts/session).

  </Accordion>

  <Accordion title='Perché vedo "LLM request rejected: messages.content.tool_use.input field required"?'>
    Questo è un errore di validazione del provider: il modello ha emesso un blocco `tool_use` senza il richiesto
    `input`. Di solito significa che la cronologia della sessione è obsoleta o corrotta (spesso dopo thread lunghi
    o una modifica a tool/schema).

    Correzione: avvia una nuova sessione con `/new` (messaggio standalone).

  </Accordion>

  <Accordion title="Perché ricevo messaggi heartbeat ogni 30 minuti?">
    Gli heartbeat vengono eseguiti ogni **30m** per impostazione predefinita (**1h** quando si usa autenticazione OAuth). Regolali o disabilitali:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // o "0m" per disabilitare
          },
        },
      },
    }
    ```

    Se `HEARTBEAT.md` esiste ma è sostanzialmente vuoto (solo righe vuote e intestazioni
    markdown come `# Heading`), OpenClaw salta l'esecuzione heartbeat per risparmiare chiamate API.
    Se il file manca, heartbeat gira comunque e il modello decide cosa fare.

    Gli override per agente usano `agents.list[].heartbeat`. Documentazione: [Heartbeat](/it/gateway/heartbeat).

  </Accordion>

  <Accordion title='Devo aggiungere un "account bot" a un gruppo WhatsApp?'>
    No. OpenClaw gira sul **tuo account**, quindi se sei nel gruppo, OpenClaw può vederlo.
    Per impostazione predefinita, le risposte di gruppo sono bloccate finché non autorizzi i mittenti (`groupPolicy: "allowlist"`).

    Se vuoi che solo **tu** possa attivare risposte di gruppo:

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

    Cerca `chatId` (o `from`) che termina in `@g.us`, come:
    `1234567890-1234567890@g.us`.

    Opzione 2 (se già configurato/in allowlist): elenca i gruppi dalla configurazione:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Documentazione: [WhatsApp](/it/channels/whatsapp), [Directory](/cli/directory), [Log](/cli/logs).

  </Accordion>

  <Accordion title="Perché OpenClaw non risponde in un gruppo?">
    Due cause comuni:

    - Il controllo per menzione è attivo (predefinito). Devi fare @mention del bot (o corrispondere a `mentionPatterns`).
    - Hai configurato `channels.whatsapp.groups` senza `"*"` e il gruppo non è in allowlist.

    Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).

  </Accordion>

  <Accordion title="Gruppi/thread condividono il contesto con i DM?">
    Le chat dirette confluiscono nella sessione principale per impostazione predefinita. Gruppi/canali hanno le proprie chiavi sessione, e topic Telegram / thread Discord sono sessioni separate. Vedi [Gruppi](/it/channels/groups) e [Messaggi di gruppo](/it/channels/group-messages).
  </Accordion>

  <Accordion title="Quanti workspace e agenti posso creare?">
    Nessun limite rigido. Decine (anche centinaia) vanno bene, ma fai attenzione a:

    - **Crescita del disco:** sessioni + trascrizioni vivono sotto `~/.openclaw/agents/<agentId>/sessions/`.
    - **Costo token:** più agenti significa più uso concorrente del modello.
    - **Overhead operativo:** profili auth per agente, workspace e instradamento canali.

    Suggerimenti:

    - Mantieni un workspace **attivo** per agente (`agents.defaults.workspace`).
    - Elimina le vecchie sessioni (JSONL o store entries) se il disco cresce.
    - Usa `openclaw doctor` per individuare workspace erranti e mismatch dei profili.

  </Accordion>

  <Accordion title="Posso eseguire più bot o chat contemporaneamente (Slack) e come dovrei configurarlo?">
    Sì. Usa **Instradamento multi-agent** per eseguire più agenti isolati e instradare i messaggi in ingresso per
    canale/account/peer. Slack è supportato come canale e può essere associato ad agenti specifici.

    L'accesso al browser è potente ma non equivale a "fare tutto ciò che può fare un essere umano": anti-bot, CAPTCHA e MFA possono
    comunque bloccare l'automazione. Per il controllo browser più affidabile, usa Chrome MCP locale sull'host,
    oppure usa CDP sulla macchina che esegue davvero il browser.

    Configurazione consigliata:

    - Gateway host sempre acceso (VPS/Mac mini).
    - Un agente per ruolo (binding).
    - Canali Slack associati a quegli agenti.
    - Browser locale tramite Chrome MCP o un node quando serve.

    Documentazione: [Instradamento multi-agent](/it/concepts/multi-agent), [Slack](/it/channels/slack),
    [Browser](/it/tools/browser), [Nodes](/it/nodes).

  </Accordion>
</AccordionGroup>

## Modelli: valori predefiniti, selezione, alias, cambio

<AccordionGroup>
  <Accordion title='Che cos'è il "modello predefinito"?'>
    Il modello predefinito di OpenClaw è quello che imposti come:

    ```
    agents.defaults.model.primary
    ```

    I modelli sono referenziati come `provider/model` (esempio: `openai/gpt-5.4`). Se ometti il provider, OpenClaw prima prova un alias, poi una corrispondenza univoca tra provider configurati per quell'esatto model id e solo dopo ricade sul provider predefinito configurato come percorso di compatibilità deprecato. Se quel provider non espone più il modello predefinito configurato, OpenClaw ricade sul primo provider/modello configurato invece di mostrare un valore predefinito obsoleto di un provider rimosso. Dovresti comunque impostare **esplicitamente** `provider/model`.

  </Accordion>

  <Accordion title="Quale modello consigliate?">
    **Predefinito consigliato:** usa il modello più forte e di ultima generazione disponibile nel tuo stack provider.
    **Per agenti con strumenti abilitati o input non attendibili:** dai priorità alla forza del modello rispetto al costo.
    **Per chat di routine/a basso rischio:** usa fallback più economici e instrada per ruolo dell'agente.

    MiniMax ha una documentazione dedicata: [MiniMax](/it/providers/minimax) e
    [Modelli locali](/it/gateway/local-models).

    Regola pratica: usa il **miglior modello che puoi permetterti** per lavori ad alta posta, e un
    modello più economico per chat di routine o riepiloghi. Puoi instradare modelli per agente e usare sub-agents per
    parallelizzare lavori lunghi (ogni sub-agent consuma token). Vedi [Modelli](/it/concepts/models) e
    [Sub-agents](/it/tools/subagents).

    Avviso importante: modelli più deboli o eccessivamente quantizzati sono più vulnerabili a prompt
    injection e comportamenti non sicuri. Vedi [Sicurezza](/it/gateway/security).

    Più contesto: [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Come cambio modello senza cancellare la mia configurazione?">
    Usa **comandi modello** o modifica solo i campi **model**. Evita sostituzioni complete della configurazione.

    Opzioni sicure:

    - `/model` in chat (rapido, per sessione)
    - `openclaw models set ...` (aggiorna solo la configurazione modello)
    - `openclaw configure --section model` (interattivo)
    - modifica `agents.defaults.model` in `~/.openclaw/openclaw.json`

    Evita `config.apply` con un oggetto parziale a meno che tu non voglia sostituire l'intera configurazione.
    Per modifiche RPC, ispeziona prima con `config.schema.lookup` e preferisci `config.patch`. Il payload lookup fornisce il percorso normalizzato, la documentazione/vincoli dello schema superficiale e i riepiloghi dei figli immediati
    per aggiornamenti parziali.
    Se hai sovrascritto la configurazione, ripristina da backup o riesegui `openclaw doctor` per riparare.

    Documentazione: [Modelli](/it/concepts/models), [Configurazione guidata](/cli/configure), [Config](/cli/config), [Doctor](/it/gateway/doctor).

  </Accordion>

  <Accordion title="Posso usare modelli self-hosted (llama.cpp, vLLM, Ollama)?">
    Sì. Ollama è il percorso più semplice per i modelli locali.

    Configurazione più rapida:

    1. Installa Ollama da `https://ollama.com/download`
    2. Scarica un modello locale, ad esempio `ollama pull glm-4.7-flash`
    3. Se vuoi anche modelli cloud, esegui `ollama signin`
    4. Esegui `openclaw onboard` e scegli `Ollama`
    5. Scegli `Local` o `Cloud + Local`

    Note:

    - `Cloud + Local` ti offre modelli cloud più i tuoi modelli Ollama locali
    - i modelli cloud come `kimi-k2.5:cloud` non richiedono un pull locale
    - per il cambio manuale, usa `openclaw models list` e `openclaw models set ollama/<model>`

    Nota di sicurezza: modelli più piccoli o fortemente quantizzati sono più vulnerabili a prompt
    injection. Consigliamo fortemente **modelli grandi** per qualsiasi bot che possa usare strumenti.
    Se vuoi comunque modelli piccoli, abilita sandboxing e allowlist strumenti rigide.

    Documentazione: [Ollama](/it/providers/ollama), [Modelli locali](/it/gateway/local-models),
    [Provider di modelli](/it/concepts/model-providers), [Sicurezza](/it/gateway/security),
    [Sandboxing](/it/gateway/sandboxing).

  </Accordion>

  <Accordion title="Cosa usano OpenClaw, Flawd e Krill per i modelli?">
    - Queste installazioni possono differire e cambiare nel tempo; non esiste una raccomandazione provider fissa.
    - Controlla l'impostazione runtime corrente su ciascun gateway con `openclaw models status`.
    - Per agenti sensibili alla sicurezza/con strumenti, usa il modello più forte e di ultima generazione disponibile.
  </Accordion>

  <Accordion title="Come cambio modello al volo (senza riavviare)?">
    Usa il comando `/model` come messaggio standalone:

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

    Puoi elencare i modelli disponibili con `/model`, `/model list` o `/model status`.

    `/model` (e `/model list`) mostra un selettore compatto numerato. Seleziona per numero:

    ```
    /model 3
    ```

    Puoi anche forzare un profilo auth specifico per il provider (per sessione):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Suggerimento: `/model status` mostra quale agente è attivo, quale file `auth-profiles.json` è in uso e quale profilo auth verrà provato successivamente.
    Mostra anche l'endpoint del provider configurato (`baseUrl`) e la modalità API (`api`) quando disponibili.

    **Come rimuovo il pin di un profilo impostato con @profile?**

    Riesegui `/model` **senza** il suffisso `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Se vuoi tornare al valore predefinito, selezionalo da `/model` (oppure invia `/model <provider/model predefinito>`).
    Usa `/model status` per confermare quale profilo auth è attivo.

  </Accordion>

  <Accordion title="Posso usare GPT 5.2 per task quotidiani e Codex 5.3 per coding?">
    Sì. Impostane uno come predefinito e cambia quando serve:

    - **Cambio rapido (per sessione):** `/model gpt-5.4` per task quotidiani, `/model openai-codex/gpt-5.4` per coding con Codex OAuth.
    - **Predefinito + cambio:** imposta `agents.defaults.model.primary` su `openai/gpt-5.4`, poi passa a `openai-codex/gpt-5.4` quando fai coding (o viceversa).
    - **Sub-agents:** instrada i task di coding verso sub-agents con un modello predefinito diverso.

    Vedi [Modelli](/it/concepts/models) e [Comandi slash](/it/tools/slash-commands).

  </Accordion>

  <Accordion title="Come configuro la fast mode per GPT 5.4?">
    Usa un toggle di sessione o un valore predefinito in configurazione:

    - **Per sessione:** invia `/fast on` mentre la sessione usa `openai/gpt-5.4` o `openai-codex/gpt-5.4`.
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

    Per OpenAI, la fast mode corrisponde a `service_tier = "priority"` sulle richieste native Responses supportate. Le override di sessione `/fast` prevalgono sui valori predefiniti di configurazione.

    Vedi [Thinking e fast mode](/it/tools/thinking) e [OpenAI fast mode](/it/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Perché vedo "Model ... is not allowed" e poi nessuna risposta?'>
    Se `agents.defaults.models` è impostato, diventa la **allowlist** per `/model` e per qualsiasi
    override di sessione. Scegliere un modello non presente in quella lista restituisce:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Questo errore viene restituito **al posto** di una normale risposta. Correzione: aggiungi il modello a
    `agents.defaults.models`, rimuovi l'allowlist o scegli un modello da `/model list`.

  </Accordion>

  <Accordion title='Perché vedo "Unknown model: minimax/MiniMax-M2.7"?'>
    Questo significa che il **provider non è configurato** (non è stata trovata alcuna configurazione provider MiniMax o alcun
    profilo auth), quindi il modello non può essere risolto.

    Checklist di correzione:

    1. Aggiorna a una release OpenClaw corrente (o esegui dal sorgente `main`), poi riavvia il gateway.
    2. Assicurati che MiniMax sia configurato (procedura guidata o JSON), oppure che l'autenticazione MiniMax
       esista in env/profili auth così il provider corrispondente possa essere iniettato
       (`MINIMAX_API_KEY` per `minimax`, `MINIMAX_OAUTH_TOKEN` o OAuth MiniMax
       archiviato per `minimax-portal`).
    3. Usa l'esatto model id (case-sensitive) per il tuo percorso auth:
       `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed` per la configurazione
       con chiave API, oppure `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` per la configurazione OAuth.
    4. Esegui:

       ```bash
       openclaw models list
       ```

       e scegli dalla lista (o `/model list` in chat).

    Vedi [MiniMax](/it/providers/minimax) e [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="Posso usare MiniMax come predefinito e OpenAI per task complessi?">
    Sì. Usa **MiniMax come predefinito** e cambia modello **per sessione** quando necessario.
    I fallback servono per gli **errori**, non per i "task difficili", quindi usa `/model` o un agente separato.

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
    - Instrada per agente o usa `/agent` per cambiare

    Documentazione: [Modelli](/it/concepts/models), [Instradamento multi-agent](/it/concepts/multi-agent), [MiniMax](/it/providers/minimax), [OpenAI](/it/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt sono scorciatoie integrate?">
    Sì. OpenClaw include alcune scorciatoie predefinite (applicate solo quando il modello esiste in `agents.defaults.models`):

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

    Poi `/model sonnet` (o `/<alias>` quando supportato) si risolve in quel model ID.

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

    Se fai riferimento a un provider/modello ma manca la chiave provider richiesta, otterrai un errore auth a runtime (es. `No API key found for provider "zai"`).

    **No API key found for provider dopo aver aggiunto un nuovo agente**

    Questo di solito significa che il **nuovo agente** ha un archivio auth vuoto. L'autenticazione è per agente e
    viene archiviata in:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Opzioni di correzione:

    - Esegui `openclaw agents add <id>` e configura l'autenticazione durante la procedura guidata.
    - Oppure copia `auth-profiles.json` dalla `agentDir` dell'agente principale nella `agentDir` del nuovo agente.

    **Non** riutilizzare `agentDir` tra agenti; provoca collisioni auth/sessione.

  </Accordion>
</AccordionGroup>

## Failover del modello e "All models failed"

<AccordionGroup>
  <Accordion title="Come funziona il failover?">
    Il failover avviene in due fasi:

    1. **Rotazione dei profili auth** all'interno dello stesso provider.
    2. **Fallback del modello** al modello successivo in `agents.defaults.model.fallbacks`.

    Ai profili che falliscono si applicano cooldown (backoff esponenziale), così OpenClaw può continuare a rispondere anche quando un provider è rate-limited o temporaneamente in errore.

    Il bucket dei rate limit include più dei semplici `429`. OpenCl