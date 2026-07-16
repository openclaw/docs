---
read_when:
    - Nuova installazione, onboarding bloccato o errori al primo avvio
    - Scelta delle sottoscrizioni di autenticazione e dei provider
    - Impossibile accedere a docs.openclaw.ai, impossibile aprire la dashboard, installazione bloccata
sidebarTitle: First-run FAQ
summary: 'FAQ: avvio rapido e configurazione al primo avvio — installazione, onboarding, autenticazione, abbonamenti, errori iniziali'
title: 'FAQ: configurazione al primo avvio'
x-i18n:
    generated_at: "2026-07-16T14:27:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 787d003d18e01ddc28cee74224f9a82cf80f48b8de7c56ba9f9f7a3d187a026a
    source_path: help/faq-first-run.md
    workflow: 16
---

Domande e risposte per l'avvio rapido e la prima esecuzione. Per le operazioni quotidiane, i modelli, l'autenticazione, le sessioni
e la risoluzione dei problemi, consultare le [domande frequenti](/it/help/faq) principali.

## Avvio rapido e configurazione iniziale

<AccordionGroup>
  <Accordion title="Sono bloccato: il modo più rapido per sbloccarmi">
    Utilizzare un agente IA locale che possa **vedere il computer**. La maggior parte dei casi
    in cui ci si blocca è dovuta a **problemi locali di configurazione o dell'ambiente** che
    un assistente remoto non può esaminare; è quindi preferibile rispetto a chiedere su Discord.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Fornire all'agente il checkout completo del codice sorgente tramite l'installazione modificabile (git), affinché possa leggere
    codice e documentazione e ragionare sulla versione esatta in esecuzione:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Chiedere all'agente di pianificare e supervisionare la correzione passo dopo passo, quindi eseguire solo i
    comandi necessari: diff più piccoli sono più facili da verificare.

    Condividere questi output quando si richiede assistenza (su Discord o in un issue di GitHub):

    | Comando | Mostra |
    | --- | --- |
    | `openclaw status` | Stato del Gateway/agente + riepilogo della configurazione di base |
    | `openclaw status --all` | Diagnosi completa in sola lettura, pronta da incollare |
    | `openclaw models status` | Autenticazione del provider + disponibilità dei modelli |
    | `openclaw doctor` | Convalida e corregge i problemi comuni di configurazione/stato |
    | `openclaw logs --follow` | Coda del log in tempo reale |
    | `openclaw gateway status --deep` | Controllo approfondito dello stato di Gateway/configurazione/Plugin |
    | `openclaw health --verbose` | Rapporto dettagliato sullo stato |

    È stato trovato un vero bug o una correzione? Aprire un issue o inviare una PR:
    [Issue](https://github.com/openclaw/openclaw/issues) /
    [Pull request](https://github.com/openclaw/openclaw/pulls).

    Ciclo rapido di debug: [Primi 60 secondi se qualcosa non funziona](/it/help/faq#first-60-seconds-if-something-is-broken).
    Documentazione sull'installazione: [Installazione](/it/install), [Flag del programma di installazione](/it/install/installer), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="Heartbeat continua a essere ignorato. Cosa significano i motivi?">
    | Motivo per cui viene ignorato | Significato |
    | --- | --- |
    | `quiet-hours` | Al di fuori della finestra configurata delle ore di attività |
    | `empty-heartbeat-file` | `HEARTBEAT.md` esiste, ma contiene solo una struttura vuota, commenti, intestazioni, delimitatori o checklist vuote |
    | `no-tasks-due` | La modalità attività è attiva, ma non è ancora scaduto alcun intervallo |
    | `alerts-disabled` | Tutta la visibilità di Heartbeat è disattivata (`showOk`, `showAlerts` e `useIndicator` sono tutti disabilitati) |

    In modalità attività, le scadenze avanzano solo dopo il completamento di una reale esecuzione di Heartbeat.
    Le esecuzioni ignorate non contrassegnano le attività come completate.

    Documentazione: [Heartbeat](/it/gateway/heartbeat), [Automazione](/it/automation).

  </Accordion>

  <Accordion title="Metodo consigliato per installare e configurare OpenClaw">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Dal codice sorgente (collaboratori/sviluppatori):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Non è ancora disponibile un'installazione globale? Eseguire invece `pnpm openclaw onboard`. Se le risorse dell'UI di controllo
    non sono presenti, la configurazione iniziale prova a compilarle autonomamente, ripiegando su `pnpm ui:build`.

  </Accordion>

  <Accordion title="Come si apre la dashboard dopo la configurazione iniziale?">
    Subito dopo la configurazione iniziale viene aperto nel browser un URL pulito della dashboard (senza token)
    e il collegamento viene mostrato nel riepilogo. Mantenere aperta la scheda; se non è stata avviata,
    copiare e incollare sullo stesso computer l'URL visualizzato.
  </Accordion>

  <Accordion title="Come si autentica la dashboard su localhost rispetto all'accesso remoto?">
    **Localhost (stesso computer):**

    - Aprire `http://127.0.0.1:18789/`.
    - Se viene richiesta l'autenticazione tramite segreto condiviso, incollare il token o la password configurati nelle impostazioni dell'UI di controllo.
    - Origine del token: `gateway.auth.token` (oppure `OPENCLAW_GATEWAY_TOKEN`).
    - Origine della password: `gateway.auth.password` (oppure `OPENCLAW_GATEWAY_PASSWORD`).
    - Non è ancora configurato alcun segreto condiviso? Eseguire `openclaw doctor --generate-gateway-token` (oppure `openclaw doctor --fix --generate-gateway-token`).

    **Non su localhost:**

    - **Tailscale Serve** (consigliato): mantenere il binding su loopback, eseguire `openclaw gateway --tailscale serve`, aprire `https://<magicdns>/`. Con `gateway.auth.allowTailscale: true`, le intestazioni di identità soddisfano l'autenticazione dell'UI di controllo/WebSocket (non è necessario incollare un segreto condiviso; si presuppone un host Gateway attendibile); le API HTTP richiedono comunque l'autenticazione tramite segreto condiviso, salvo l'uso intenzionale di `none` con ingresso privato o dell'autenticazione HTTP tramite proxy attendibile.
      I tentativi Serve simultanei con autenticazione errata provenienti dallo stesso client vengono serializzati prima che il limitatore degli errori di autenticazione li registri, quindi già un secondo tentativo errato può mostrare `retry later`.
    - **Binding alla tailnet**: eseguire `openclaw gateway --bind tailnet --token "<token>"` (oppure configurare l'autenticazione tramite password), aprire `http://<tailscale-ip>:18789/`, incollare il segreto condiviso corrispondente nelle impostazioni della dashboard.
    - **Proxy inverso con riconoscimento dell'identità**: mantenere il Gateway dietro un proxy attendibile, impostare `gateway.auth.mode: "trusted-proxy"`, aprire l'URL del proxy. I proxy loopback sullo stesso host richiedono esplicitamente `gateway.auth.trustedProxy.allowLoopback: true`.
    - **Tunnel SSH**: `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host`, quindi aprire `http://127.0.0.1:18789/`. L'autenticazione tramite segreto condiviso si applica anche attraverso il tunnel; se richiesto, incollare il token o la password configurati.

    Consultare [Dashboard](/it/web/dashboard) e [Superfici web](/it/web) per i dettagli sulle modalità di binding e sull'autenticazione.

  </Accordion>

  <Accordion title="Perché esistono due configurazioni di approvazione exec per le approvazioni in chat?">
    Controllano livelli diversi:

    - `approvals.exec` - inoltra le richieste di approvazione alle destinazioni della chat.
    - `channels.<channel>.execApprovals` - rende quel canale un client di approvazione nativo per le approvazioni exec.

    La policy exec dell'host resta il vero meccanismo di approvazione; la configurazione della chat controlla solo dove
    vengono visualizzate le richieste e come rispondono le persone.

    Raramente sono necessarie entrambe:

    - Se la chat supporta già comandi e risposte, `/approve` nella stessa chat funziona tramite il percorso condiviso.
    - Quando un canale nativo supportato può determinare in modo sicuro chi può approvare, OpenClaw abilita automaticamente le approvazioni native con priorità ai DM se `channels.<channel>.execApprovals.enabled` non è impostato oppure è `"auto"`.
    - Quando sono disponibili schede o pulsanti di approvazione nativi, tale UI è il metodo principale; menzionare un comando manuale `/approve` solo se il risultato dello strumento indica che le approvazioni tramite chat non sono disponibili.
    - Utilizzare `approvals.exec` solo quando le richieste devono raggiungere anche altre chat o stanze operative esplicite.
    - Utilizzare `channels.<channel>.execApprovals.target: "channel"` o `"both"` solo quando si desidera pubblicare nuovamente le richieste di approvazione nella stanza o nell'argomento di origine.
    - Le approvazioni dei Plugin sono separate: per impostazione predefinita `/approve` nella stessa chat, inoltro facoltativo tramite `approvals.plugin` e solo alcuni canali nativi mantengono la gestione nativa anche per queste approvazioni.

    In breve: l'inoltro serve per l'instradamento, mentre la configurazione del client nativo offre un'esperienza utente più ricca e specifica per il canale.
    Consultare [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>

  <Accordion title="Quale runtime è necessario?">
    È richiesto Node **22.22.3+**, **24.15+** o **25.9+** (Node 24 consigliato). `pnpm` è il gestore di pacchetti del repository.
    Bun può installare le dipendenze ed eseguire gli script dei pacchetti, ma non può eseguire la CLI o il Gateway di OpenClaw perché non dispone di `node:sqlite`.
  </Accordion>

  <Accordion title="Funziona su Raspberry Pi?">
    Sì, ma occorre prima controllare la RAM: Pi 5 e Pi 4 (2 GB+) sono le opzioni ideali; Pi 3B+ (1 GB) funziona, ma è lento; Pi Zero 2 W (512 MB) non è consigliato.

    | Modello | RAM | Idoneità |
    | --- | --- | --- |
    | Pi 5 | 4/8 GB | Ottimale |
    | Pi 4 | 4 GB | Buona |
    | Pi 4 | 2 GB | Adeguata, aggiungere swap |
    | Pi 4 | 1 GB | Limitata |
    | Pi 3B+ | 1 GB | Lento |
    | Pi Zero 2 W | 512 MB | Non consigliato |

    Minimo assoluto: 1 GB di RAM, 1 core, 500 MB di spazio libero su disco, sistema operativo a 64 bit. Poiché sul Pi viene eseguito solo
    il Gateway (i modelli chiamano API cloud), anche un Pi di fascia modesta gestisce il carico.

    Un piccolo Pi/VPS può anche ospitare soltanto il Gateway, mentre si associano **nodi** sul
    portatile/telefono per usare localmente schermo, fotocamera, canvas o l'esecuzione di comandi. Consultare [Nodi](/it/nodes).

    Procedura di configurazione completa: [Raspberry Pi](/it/install/raspberry-pi).

  </Accordion>

  <Accordion title="Suggerimenti per le installazioni su Raspberry Pi?">
    - Utilizzare un sistema operativo a **64 bit**; non utilizzare Raspberry Pi OS a 32 bit.
    - Aggiungere swap sulle schede con 2 GB o meno.
    - Preferire un **SSD USB** a una scheda SD per prestazioni e durata.
    - Preferire l'installazione modificabile (git), per poter visualizzare i log ed eseguire rapidamente gli aggiornamenti.
    - Iniziare senza canali/skill e aggiungerli uno alla volta.
    - Gli errori insoliti dei file binari ("exec format error") sono solitamente dovuti all'assenza di una build ARM64 per uno strumento facoltativo di una skill.

    Guida completa: [Raspberry Pi](/it/install/raspberry-pi). Consultare anche [Linux](/it/platforms/linux).

  </Accordion>

  <Accordion title="È bloccato su wake up my friend / la configurazione iniziale non si completa. Cosa fare?">
    Quella schermata richiede che il Gateway sia raggiungibile e autenticato. Inoltre, al primo avvio la TUI invia
    automaticamente "Wake up, my friend!" quando è configurato un provider di modelli. Se
    la configurazione del modello o dell'autenticazione è stata saltata, la configurazione iniziale mostra una nota "Model auth missing" e apre la
    TUI senza inviare nulla: aggiungere un provider con `openclaw configure --section model`.
    Se viene visualizzata la riga di risveglio **senza risposta** e i token restano a 0, l'agente non è mai stato eseguito.

    1. Riavviare il Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Controllare stato e autenticazione:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. È ancora bloccato? Eseguire:

    ```bash
    openclaw doctor
    ```

    Se il Gateway è remoto, verificare che la connessione tunnel/Tailscale sia attiva e che l'UI
    punti al Gateway corretto. Consultare [Accesso remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="È possibile migrare la configurazione su un nuovo computer senza ripetere la configurazione iniziale?">
    Sì. Copiare la **directory di stato** e lo **spazio di lavoro**, quindi eseguire Doctor una volta:

    1. Installare OpenClaw sul nuovo computer.
    2. Copiare `$OPENCLAW_STATE_DIR` (valore predefinito: `~/.openclaw`) dal vecchio computer.
    3. Copiare lo spazio di lavoro (valore predefinito: `~/.openclaw/workspace`).
    4. Eseguire `openclaw doctor` e riavviare il servizio Gateway.

    In questo modo vengono conservati configurazione, profili di autenticazione, credenziali WhatsApp, sessioni e memoria, mantenendo
    il bot esattamente invariato, purché vengano copiate **entrambe** le posizioni. In modalità remota,
    l'host del Gateway gestisce l'archivio delle sessioni e lo spazio di lavoro.

    **Importante:** se si esegue il commit/push su GitHub soltanto dello spazio di lavoro, viene creato il backup di
    **memoria + file di bootstrap**, ma non della cronologia delle sessioni o dell'autenticazione. Questi dati si trovano in
    `~/.openclaw/` (ad esempio `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`).

    Argomenti correlati: [Migrazione](/it/install/migrating), [Posizione dei dati sul disco](/it/help/faq#where-things-live-on-disk),
    [Spazio di lavoro dell'agente](/it/concepts/agent-workspace), [Doctor](/it/gateway/doctor),
    [Modalità remota](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove si possono vedere le novità dell'ultima versione?">
    Consultare il changelog su GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Le voci più recenti si trovano in alto. Se la sezione superiore è **Non rilasciata**, la successiva sezione
    con una data è l'ultima versione pubblicata. Le voci sono raggruppate sotto **In evidenza**, **Modifiche**
    e **Correzioni** (oltre a documentazione/altre sezioni quando necessario).

  </Accordion>

  <Accordion title="Impossibile accedere a docs.openclaw.ai (errore SSL)">
    Alcune connessioni Comcast/Xfinity bloccano erroneamente `docs.openclaw.ai` tramite Xfinity
    Advanced Security. Disabilitarlo o aggiungere `docs.openclaw.ai` all'elenco degli elementi consentiti, quindi riprovare. Per contribuire
    allo sblocco: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Ancora bloccati? La documentazione è replicata su GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Differenza tra stabile e beta">
    **Stabile** e **beta** sono **dist-tag npm**, non linee di codice separate:

    - `latest` = stabile
    - `beta` = build preliminare per i test (ripiega su `latest` quando la beta è assente o precedente all'attuale versione stabile)

    Una versione stabile viene solitamente pubblicata prima su **beta**, quindi un passaggio esplicito di promozione
    sposta la stessa versione su `latest` senza modificarne il numero. I manutentori
    possono anche pubblicarla direttamente su `latest`. Per questo motivo, dopo la promozione,
    beta e stabile possono indicare la **stessa versione**.

    Consultare le modifiche: [CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md).

    Per i comandi di installazione in una sola riga e la differenza tra beta e dev, consultare la sezione successiva.

  </Accordion>

  <Accordion title="Come si installa la versione beta e qual è la differenza tra beta e dev?">
    **Beta** è il dist-tag npm `beta` (può coincidere con `latest` dopo la promozione).
    **Dev** è la revisione più recente e in continua evoluzione di `main` (git); quando viene pubblicata su npm usa il dist-tag `dev`.

    Comandi in una sola riga (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Programma di installazione per Windows (PowerShell): `iwr -useb https://openclaw.ai/install.ps1 | iex`

    Ulteriori dettagli: [Canali di sviluppo](/it/install/development-channels) e [Opzioni del programma di installazione](/it/install/installer).

  </Accordion>

  <Accordion title="Come si provano le modifiche più recenti?">
    Sono disponibili due opzioni:

    1. **Canale dev (installazione esistente):**

    ```bash
    openclaw update --channel dev
    ```

    Questo comando passa a un checkout git di `main`, esegue il rebase sull'upstream, compila e installa
    la CLI da tale checkout.

    2. **Installazione modificabile (git) su una macchina nuova:**

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    È preferibile eseguire una clonazione manuale:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Documentazione: [Aggiornamento](/it/cli/update), [Canali di sviluppo](/it/install/development-channels), [Installazione](/it/install).

  </Accordion>

  <Accordion title="Quanto tempo richiedono solitamente l'installazione e la configurazione iniziale?">
    Indicativamente:

    - **Installazione:** 2-5 minuti.
    - **Configurazione iniziale QuickStart:** alcuni minuti (Gateway loopback, token automatico, spazio di lavoro predefinito).
    - **Configurazione iniziale avanzata/completa:** più tempo se l'accesso al provider, l'associazione dei canali, l'installazione del daemon, i download di rete o le Skills richiedono una configurazione aggiuntiva.

    La procedura guidata mostra in anticipo questa sequenza temporale. È possibile saltare i passaggi facoltativi e riprenderli in seguito con
    `openclaw configure`.

    La procedura è bloccata? Consultare [Sono bloccato](#quick-start-and-first-run-setup) qui sopra.

  </Accordion>

  <Accordion title="Il programma di installazione è bloccato? Come si ottengono più informazioni?">
    Eseguire nuovamente il comando con `--verbose`:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    `install.ps1` non dispone di un'opzione dettagliata dedicata; racchiuderlo invece in `Set-PSDebug -Trace 1` /
    `-Trace 0`. Riferimento completo delle opzioni: [Opzioni del programma di installazione](/it/install/installer).

  </Accordion>

  <Accordion title="L'installazione su Windows segnala che git non è stato trovato o che openclaw non è riconosciuto">
    Due problemi comuni su Windows:

    **1) Errore npm spawn git / git non trovato**

    - Installare **Git for Windows** e verificare che `git` sia nel PATH.
    - Chiudere e riaprire PowerShell, quindi eseguire nuovamente il programma di installazione.

    **2) openclaw non viene riconosciuto dopo l'installazione**

    - La cartella globale dei binari npm non è nel PATH.
    - Verificarla con: `npm config get prefix`.
    - Aggiungere tale directory al PATH dell'utente (non è necessario il suffisso `\bin`; nella maggior parte dei sistemi è `%AppData%\npm`).
    - Chiudere e riaprire PowerShell.

    Si preferisce un'app desktop? Usare **Windows Hub**. Per la configurazione solo da terminale,
    sono supportati sia il programma di installazione PowerShell sia i percorsi Gateway WSL2. Documentazione: [Windows](/it/platforms/windows).

  </Accordion>

  <Accordion title="L'output di exec su Windows mostra testo cinese illeggibile: cosa fare?">
    Di solito si tratta di una mancata corrispondenza della tabella codici della console nelle shell native di Windows.

    Sintomi: l'output di `system.run`/`exec` visualizza il cinese come testo corrotto; lo stesso comando
    appare correttamente in un altro profilo del terminale.

    Soluzione alternativa in PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Riavviare quindi il Gateway e riprovare:

    ```powershell
    openclaw gateway restart
    ```

    Il problema si verifica ancora con la versione più recente di OpenClaw? Seguirlo o segnalarlo qui: [Issue #30640](https://github.com/openclaw/openclaw/issues/30640).

  </Accordion>

  <Accordion title="La documentazione non ha risposto alla domanda: come si ottiene una risposta migliore?">
    Usare l'installazione modificabile (git) per disporre localmente del codice sorgente e della documentazione completi, quindi rivolgere la domanda
    al proprio bot (o a Claude/Codex) **da tale cartella**, in modo che possa leggere il repository e rispondere con precisione.

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Ulteriori dettagli: [Installazione](/it/install) e [Opzioni del programma di installazione](/it/install/installer).

  </Accordion>

  <Accordion title="Come si installa OpenClaw su Linux?">
    - Procedura rapida per Linux e installazione del servizio: [Linux](/it/platforms/linux).
    - Procedura dettagliata completa: [Introduzione](/it/start/getting-started).
    - Programma di installazione e aggiornamenti: [Installazione e aggiornamenti](/it/install/updating).

  </Accordion>

  <Accordion title="Come si installa OpenClaw su un VPS?">
    È possibile usare qualsiasi VPS Linux. Installare OpenClaw sul server, quindi accedere al Gateway tramite SSH/Tailscale.

    Guide: [exe.dev](/it/install/exe-dev), [Hetzner](/it/install/hetzner), [Fly.io](/it/install/fly).
    Accesso remoto: [Gateway remoto](/it/gateway/remote).

  </Accordion>

  <Accordion title="Dove si trovano le guide di installazione su cloud/VPS?">
    Sezione centrale per l'hosting con i provider più comuni:

    - [Hosting VPS](/it/vps) (tutti i provider in un unico punto)
    - [Fly.io](/it/install/fly)
    - [Hetzner](/it/install/hetzner)
    - [exe.dev](/it/install/exe-dev)

    Nel cloud, il **Gateway viene eseguito sul server** ed è possibile accedervi da laptop/telefono
    tramite la Control UI (oppure Tailscale/SSH). Lo stato e lo spazio di lavoro risiedono sul server, quindi
    l'host deve essere considerato la fonte autorevole e sottoposto a backup.

    Associare i **Node** (Mac/iOS/Android/headless) a tale Gateway nel cloud per usare localmente
    schermo/fotocamera/canvas o eseguire comandi sul laptop mentre il Gateway rimane
    nel cloud.

    Sezione centrale: [Piattaforme](/it/platforms). Accesso remoto: [Gateway remoto](/it/gateway/remote).
    Node: [Node](/it/nodes), [CLI dei Node](/it/cli/nodes).

  </Accordion>

  <Accordion title="È possibile chiedere a OpenClaw di aggiornarsi autonomamente?">
    È possibile, ma non è consigliato. Il flusso di aggiornamento può riavviare il Gateway (interrompendo
    la sessione attiva), può richiedere un checkout git pulito e può richiedere una conferma.
    È più sicuro eseguire gli aggiornamenti da una shell in qualità di operatore.

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|extended-stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Automazione da un agente:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Documentazione: [Aggiornamento](/it/cli/update), [Aggiornamento dell'installazione](/it/install/updating).

  </Accordion>

  <Accordion title="Che cosa fa concretamente la configurazione iniziale?">
    `openclaw onboard` è il percorso di configurazione consigliato. In **modalità locale** guida attraverso:

    1. **Modello/Autenticazione** - OAuth del provider, chiavi API o autenticazione manuale (incluse opzioni locali come LM Studio); selezione di un modello predefinito.
    2. **Spazio di lavoro** - posizione e file di bootstrap.
    3. **Gateway** - porta, indirizzo di bind, modalità di autenticazione, esposizione tramite Tailscale.
    4. **Canali** - canali di chat integrati e dei Plugin ufficiali: iMessage, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams, QQ Bot, Signal, Slack, Telegram, WhatsApp e altri.
    5. **Daemon** - LaunchAgent (macOS), unità utente systemd (Linux/WSL2) o attività pianificata nativa di Windows.
    6. **Controllo di integrità** - avvia il Gateway e verifica che sia in esecuzione.
    7. **Skills** - installa le skill consigliate e le dipendenze facoltative.

    Mostra in anticipo le durate previste e avvisa se il modello configurato è sconosciuto
    o privo di autenticazione. Descrizione completa: [Configurazione iniziale (CLI)](/it/start/wizard).

  </Accordion>

  <Accordion title="È necessario un abbonamento Claude o OpenAI per usare OpenClaw?">
    No. È possibile eseguire OpenClaw con **chiavi API** (Anthropic/OpenAI/altri) oppure con **modelli esclusivamente locali**
    affinché i dati rimangano sul dispositivo. Gli abbonamenti (Claude Pro/Max, ChatGPT/Codex) sono
    metodi facoltativi per autenticarsi presso tali provider.

    Per Anthropic: una **chiave API** prevede la normale fatturazione a consumo; **Claude CLI**
    riutilizza un accesso Claude Code esistente sullo stesso host. Attualmente Anthropic considera
    il percorso non interattivo `claude -p` di Claude CLI come utilizzo dell'Agent SDK/programmatico che
    continua a consumare i limiti del piano di abbonamento: consultare la documentazione aggiornata sulla fatturazione di Anthropic
    prima di fare affidamento sul comportamento dell'abbonamento. Per gli host Gateway di lunga durata e le automazioni
    condivise, una chiave API Anthropic rappresenta la scelta più prevedibile.

    OAuth di OpenAI Codex (abbonamento ChatGPT/Codex) è pienamente supportato per i modelli degli agenti.
    OpenClaw supporta inoltre opzioni ospitate in stile abbonamento, tra cui **Qwen Cloud
    Coding Plan**, **MiniMax Coding Plan** e **Z.AI / GLM Coding Plan**.

    Documentazione: [Anthropic](/it/providers/anthropic), [OpenAI](/it/providers/openai),
    [Qwen Cloud](/it/providers/qwen), [MiniMax](/it/providers/minimax), [Z.AI (GLM)](/it/providers/zai),
    [Modelli locali](/it/gateway/local-models), [Modelli](/it/concepts/models).

  </Accordion>

  <Accordion title="È possibile usare l'abbonamento Claude Max senza una chiave API?">
    Sì. OpenClaw supporta il riutilizzo di Claude CLI per i piani Pro/Max/Team/Enterprise. Attualmente Anthropic
    considera il percorso `claude -p` usato da OpenClaw come utilizzo del piano di abbonamento soggetto
    ai limiti del piano, non come una quota gratuita separata; consultare
    [Anthropic](/it/providers/anthropic) per i dettagli aggiornati sulla fatturazione e i collegamenti agli
    articoli di supporto di Anthropic. Per una configurazione lato server più prevedibile, usare invece una
    chiave API Anthropic.
  </Accordion>

  <Accordion title="È supportata l'autenticazione tramite abbonamento Claude (Claude Pro o Max)?">
    Sì, tramite il riutilizzo di Claude CLI. Il trattamento ai fini della fatturazione da parte di Anthropic dell'utilizzo di `claude -p`/Agent SDK
    è cambiato nel tempo; consultare [Anthropic](/it/providers/anthropic) per lo stato attuale e
    i collegamenti datati agli articoli di supporto di Anthropic prima di fare affidamento su uno specifico comportamento
    di fatturazione.

    L'autenticazione tramite token di configurazione Anthropic è ancora un percorso token supportato, ma OpenClaw preferisce
    il riutilizzo della CLI Claude e `claude -p` quando disponibili. Per carichi di lavoro di produzione o multiutente,
    una chiave API Anthropic rimane la scelta più sicura e prevedibile. Altre
    opzioni ospitate basate su abbonamento: [OpenAI](/it/providers/openai), [Qwen Cloud](/it/providers/qwen),
    [MiniMax](/it/providers/minimax), [Z.AI (GLM)](/it/providers/zai).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Perché viene visualizzato HTTP 429 rate_limit_error da Anthropic?">
    La **quota o il limite di frequenza Anthropic** è esaurito per la finestra corrente. Nella **CLI
    Claude**, attendere il ripristino della finestra o aggiornare il piano. Con una **chiave API Anthropic**,
    controllare l'utilizzo e la fatturazione nella console Anthropic e aumentare i limiti secondo necessità.

    Se il messaggio è specificamente `Extra usage is required for long context requests`,
    la richiesta sta tentando di utilizzare la finestra di contesto da 1M di Anthropic (un modello Claude 4.x
    da 1M con disponibilità generale oppure la configurazione precedente `params.context1m: true`) e la credenziale corrente non è
    idonea alla fatturazione del contesto esteso.

    Impostare un **modello di fallback** affinché OpenClaw continui a rispondere mentre un provider è soggetto a limitazione della frequenza.
    Consultare [Modelli](/it/cli/models), [OAuth](/it/concepts/oauth) e
    [Utilizzo aggiuntivo richiesto per il contesto esteso in caso di errore Anthropic 429](/it/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="AWS Bedrock è supportato?">
    Sì. OpenClaw include un provider **Amazon Bedrock (Converse)**. Quando sono presenti
    gli indicatori di ambiente AWS (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, `AWS_BEARER_TOKEN_BEDROCK`),
    OpenClaw abilita automaticamente il provider Bedrock implicito per il rilevamento dei modelli; in caso contrario,
    impostare `plugins.entries.amazon-bedrock.config.discovery.enabled: true` o aggiungere una voce
    del provider manualmente. Consultare [Amazon Bedrock](/it/providers/bedrock) e [Provider di modelli](/it/providers/models).
    Un proxy compatibile con OpenAI davanti a Bedrock resta un'opzione valida se si preferisce un flusso con chiavi gestite.
  </Accordion>

  <Accordion title="Come funziona l'autenticazione di Codex?">
    OpenClaw supporta **OpenAI Codex** tramite OAuth (accesso a ChatGPT). Una nuova
    configurazione senza un modello primario utilizza esattamente `openai/gpt-5.6-sol` per
    l'autenticazione tramite abbonamento ChatGPT/Codex e l'esecuzione nativa del server applicativo Codex.
    La riautenticazione conserva un modello esplicito esistente, incluso
    `openai/gpt-5.5`. Se lo spazio di lavoro Codex non espone GPT-5.6, selezionare
    esplicitamente `openai/gpt-5.5`; OpenClaw non esegue un downgrade automatico. I riferimenti
    precedenti ai modelli con prefisso Codex costituiscono configurazioni precedenti riparate da `openclaw doctor
    --fix`. L'accesso diretto tramite chiave API OpenAI resta disponibile per le superfici API OpenAI
    non agentiche e, mediante un profilo con chiave API `openai` ordinato, anche per i modelli
    degli agenti. Consultare [Provider di modelli](/it/concepts/model-providers) e
    [Configurazione iniziale (CLI)](/it/start/wizard).
  </Accordion>

  <Accordion title="Perché OpenClaw menziona ancora il prefisso precedente OpenAI Codex?">
    `openai` è l'attuale ID del provider e del profilo di autenticazione sia per le chiavi API OpenAI sia per
    OAuth ChatGPT/Codex: OpenAI Codex è integrato al suo interno. Nelle configurazioni meno recenti e negli avvisi di migrazione
    potrebbe ancora comparire il prefisso precedente
    `openai-codex`:

    - `openai/gpt-5.6-sol` = nuova configurazione dell'abbonamento ChatGPT/Codex con il runtime Codex nativo per i turni dell'agente.
    - `openai/gpt-5.5` = selezione esplicita supportata per configurazioni esistenti o account senza accesso a GPT-5.6.
    - Riferimenti precedenti ai modelli `openai-codex/*` = percorso precedente riparato da `openclaw doctor --fix`.
    - `openai/gpt-5.5` più un profilo con chiave API `openai` ordinato = autenticazione tramite chiave API per un modello agente OpenAI.
    - ID precedenti dei profili di autenticazione `openai-codex` = ID precedenti migrati da `openclaw doctor --fix`.

    Per utilizzare la fatturazione diretta di OpenAI Platform, impostare `OPENAI_API_KEY`. Per utilizzare l'autenticazione
    tramite abbonamento ChatGPT/Codex, eseguire `openclaw models auth login --provider openai`. Mantenere
    i riferimenti ai modelli nel provider canonico `openai/*`. La nuova configurazione dell'abbonamento
    utilizza esattamente `openai/gpt-5.6-sol`; doctor ripara i riferimenti precedenti con prefisso Codex
    senza aggiornare una selezione esplicita `openai/gpt-5.5`.

  </Accordion>

  <Accordion title="Perché i limiti OAuth di Codex possono differire da quelli del sito web di ChatGPT?">
    OAuth di Codex utilizza finestre di quota gestite da OpenAI e dipendenti dal piano, che possono differire
    dall'esperienza offerta dal sito web o dall'app ChatGPT, anche sullo stesso account.

    `openclaw models status` mostra le finestre di utilizzo e quota del provider attualmente visibili, ma
    non crea né normalizza i diritti di accesso di ChatGPT sul web trasformandoli in accesso API diretto. Per il
    percorso diretto di fatturazione e limiti di OpenAI Platform, utilizzare `openai/*` con una chiave API.

  </Accordion>

  <Accordion title="È supportata l'autenticazione tramite abbonamento OpenAI (OAuth di Codex)?">
    Sì, completamente. OpenAI consente esplicitamente l'utilizzo dell'autenticazione OAuth tramite abbonamento in
    strumenti e flussi di lavoro esterni come OpenClaw. La configurazione iniziale può eseguire il flusso OAuth automaticamente.

    Consultare [OAuth](/it/concepts/oauth), [Provider di modelli](/it/concepts/model-providers) e [Configurazione iniziale (CLI)](/it/start/wizard).

  </Accordion>

  <Accordion title="Come si configura OAuth della CLI Gemini?">
    La CLI Gemini utilizza un **flusso di autenticazione del Plugin**, non un ID client o un segreto in `openclaw.json`.

    1. Installare localmente la CLI Gemini affinché `gemini` sia disponibile in `PATH`:
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Abilitare il Plugin: `openclaw plugins enable google`
    3. Accedere: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Modello predefinito dopo l'accesso: `google/gemini-3.1-pro-preview` (runtime `google-gemini-cli`)
    5. Le richieste non riescono dopo l'accesso? Impostare `GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host del Gateway e riprovare.

    I token OAuth vengono archiviati nei profili di autenticazione sull'host del Gateway. Dettagli: [Google](/it/providers/google), [Provider di modelli](/it/concepts/model-providers).

  </Accordion>

  <Accordion title="Un modello locale è adeguato per conversazioni informali?">
    In genere no. OpenClaw richiede un contesto ampio e una sicurezza solida; le schede di piccole dimensioni troncano il contesto
    e ignorano i filtri di sicurezza lato provider. Se necessario, eseguire localmente la versione del modello **più grande**
    possibile (LM Studio): consultare [Modelli locali](/it/gateway/local-models). I modelli più piccoli o quantizzati
    aumentano il rischio di prompt injection: consultare [Sicurezza](/it/gateway/security).
  </Accordion>

  <Accordion title="Come si mantiene il traffico dei modelli ospitati in una regione specifica?">
    Scegliere endpoint vincolati a una regione. OpenRouter offre opzioni ospitate negli Stati Uniti per MiniMax, Kimi
    e GLM; scegliere la variante ospitata negli Stati Uniti per mantenere i dati nella regione. È comunque possibile elencare
    Anthropic/OpenAI insieme a queste opzioni con `models.mode: "merge"`, affinché i fallback rimangano
    disponibili rispettando al contempo il provider regionale selezionato.
  </Accordion>

  <Accordion title="È necessario acquistare un Mac Mini per installarlo?">
    No. OpenClaw funziona su macOS o Linux (Windows tramite WSL2). Un Mac mini è una scelta diffusa
    come host sempre attivo, ma sono adatti anche un piccolo VPS, un server domestico o un dispositivo di classe Raspberry Pi.

    Un Mac è necessario solo **per gli strumenti disponibili esclusivamente su macOS**. Per iMessage, utilizzare [iMessage](/it/channels/imessage)
    con `imsg` su qualsiasi Mac connesso a Messaggi; se il Gateway viene eseguito su Linux o altrove,
    impostare `channels.imessage.cliPath` su un wrapper SSH che esegua `imsg` su quel Mac. Per gli altri
    strumenti disponibili esclusivamente su macOS, eseguire il Gateway su un Mac o associare un Node macOS.

    Documentazione: [iMessage](/it/channels/imessage), [Node](/it/nodes), [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="È necessario un Mac mini per il supporto di iMessage?">
    È necessario **un dispositivo macOS** connesso a Messaggi, non necessariamente un Mac mini:
    qualsiasi Mac è adatto. Utilizzare [iMessage](/it/channels/imessage) con `imsg`; il Gateway può essere eseguito su tale
    Mac oppure altrove con un wrapper SSH `cliPath`.

    Configurazioni comuni:

    - Gateway su Linux/VPS, con `channels.imessage.cliPath` impostato su un wrapper SSH che esegue `imsg` su un Mac connesso a Messaggi.
    - Tutto su un unico Mac per la configurazione più semplice su una sola macchina.

    Documentazione: [iMessage](/it/channels/imessage), [Node](/it/nodes), [Modalità remota Mac](/it/platforms/mac/remote).

  </Accordion>

  <Accordion title="Se si acquista un Mac mini per eseguire OpenClaw, è possibile collegarlo a un MacBook Pro?">
    Sì. Il **Mac mini può eseguire il Gateway** e il MacBook Pro si connette come **Node**
    (dispositivo complementare). I Node non eseguono il Gateway, ma aggiungono funzionalità come
    schermo, fotocamera, canvas e `system.run` sul dispositivo.

    Schema comune: Gateway sul Mac mini sempre attivo; il MacBook Pro esegue l'app macOS o un
    host Node e si associa al Gateway. Verificare con `openclaw nodes status` / `openclaw nodes list`.

    Documentazione: [Node](/it/nodes), [CLI dei Node](/it/cli/nodes).

  </Accordion>

  <Accordion title="È possibile utilizzare Bun?">
    È possibile utilizzare Bun per installare le dipendenze o eseguire gli script dei pacchetti. La CLI e il
    Gateway di OpenClaw richiedono **Node** perché l'archivio di stato canonico utilizza `node:sqlite`; Bun non
    fornisce tale API.
  </Accordion>

  <Accordion title="Telegram: cosa va inserito in allowFrom?">
    `channels.telegram.allowFrom` è l'**ID utente Telegram numerico del mittente umano**,
    non il nome utente del bot. La configurazione richiede solo ID utente numerici; `openclaw doctor --fix`
    può tentare di risolvere le voci precedenti `@username`.

    Opzione più sicura (senza bot di terze parti): inviare un messaggio diretto al proprio bot, eseguire `openclaw logs --follow` e leggere `from.id`.

    API Bot ufficiale: inviare un messaggio diretto al proprio bot, chiamare `https://api.telegram.org/bot<bot_token>/getUpdates` e leggere `message.from.id`.

    Terze parti (meno riservato): inviare un messaggio diretto a `@userinfobot` o `@getidsbot`.

    Consultare [Controllo degli accessi di Telegram](/it/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Più persone possono utilizzare un unico numero WhatsApp con istanze OpenClaw diverse?">
    Sì, tramite il **routing multi-agente**. Associare il messaggio diretto WhatsApp di ciascun mittente (`peer: { kind: "direct", id: "+15551234567" }`) a un diverso `agentId`, assegnando a ogni persona il proprio spazio di lavoro e archivio delle sessioni. Le risposte continuano a provenire dallo **stesso account WhatsApp**; il controllo degli accessi ai messaggi diretti (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) è globale per account. Consultare [Routing multi-agente](/it/concepts/multi-agent) e [WhatsApp](/it/channels/whatsapp).
  </Accordion>

  <Accordion title='È possibile eseguire un agente per "chat veloce" e uno "Opus per la programmazione"?'>
    Sì. Utilizzare il routing multi-agente: assegnare a ciascun agente il proprio modello predefinito, quindi associare a ogni agente
    le route in entrata (account del provider o interlocutori specifici). Configurazione di esempio:
    [Routing multi-agente](/it/concepts/multi-agent). Consultare anche [Modelli](/it/concepts/models) e
    [Configurazione](/it/gateway/configuration).
  </Accordion>

  <Accordion title="Homebrew funziona su Linux?">
    Sì, tramite Linuxbrew:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Quando si esegue OpenClaw tramite systemd, assicurarsi che il PATH del servizio includa
    `/home/linuxbrew/.linuxbrew/bin` (o il proprio prefisso brew), affinché gli strumenti installati tramite `brew`
    vengano risolti nelle shell non di login. Le versioni recenti antepongono inoltre le directory bin comuni degli utenti nei servizi
    systemd Linux (ad esempio `~/.local/bin`, `~/.npm-global/bin`,
    `~/.local/share/pnpm`, `~/.bun/bin`) e rispettano `PNPM_HOME`, `NPM_CONFIG_PREFIX`,
    `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` e `FNM_DIR` quando impostati.

  </Accordion>

  <Accordion title="Differenza tra l'installazione git modificabile e l'installazione npm">
    - **Installazione modificabile (git):** checkout completo del codice sorgente, modificabile e ideale per chi contribuisce. La compilazione avviene localmente ed è possibile modificare codice e documentazione.
    - **Installazione npm:** installazione globale della CLI, senza repository, ideale per chi desidera semplicemente eseguirla. Gli aggiornamenti provengono dai dist-tag di npm.

    Documentazione: [Guida introduttiva](/it/start/getting-started), [Aggiornamento](/it/install/updating).

  </Accordion>

  <Accordion title="È possibile passare in seguito da un'installazione npm a una git e viceversa?">
    Sì, con `openclaw update --channel ...` su un'installazione esistente. Questa operazione **non
    elimina i dati**: cambia solo l'installazione del codice di OpenClaw. Lo stato (`~/.openclaw`) e
    lo spazio di lavoro (`~/.openclaw/workspace`) rimangono invariati.

    Da npm a git:

    ```bash
    openclaw update --channel dev
    ```

    Da git a npm:

    ```bash
    openclaw update --channel stable
    ```

    Aggiungere `--dry-run` per visualizzare prima un'anteprima del cambio di modalità pianificato. Il programma di aggiornamento esegue
    le operazioni successive di Doctor, aggiorna le sorgenti dei Plugin per il canale di destinazione e riavvia il Gateway,
    a meno che non venga passato `--no-restart`.

    Anche il programma di installazione può imporre una delle due modalità:

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method npm
    ```

    Suggerimenti per il backup: [Posizione degli elementi sul disco](/it/help/faq#where-things-live-on-disk).

  </Accordion>

  <Accordion title="È preferibile eseguire il Gateway sul portatile o su un VPS?">
    Per un'affidabilità 24/7, utilizzare un **VPS**. Per ridurre al minimo le difficoltà, se
    sospensioni e riavvii sono accettabili, eseguirlo localmente.

    **Portatile (Gateway locale)**

    - **Vantaggi:** nessun costo per il server, accesso diretto ai file locali, finestra del browser visibile.
    - **Svantaggi:** la sospensione o le interruzioni di rete causano la disconnessione, gli aggiornamenti e i riavvii del sistema operativo interrompono il servizio, il dispositivo deve rimanere attivo.

    **VPS / cloud**

    - **Vantaggi:** sempre attivo, rete stabile, nessun problema dovuto alla sospensione del portatile, più facile da mantenere in esecuzione.
    - **Svantaggi:** spesso senza interfaccia grafica (utilizzare gli screenshot), solo accesso remoto ai file, SSH necessario per gli aggiornamenti.

    WhatsApp/Telegram/Slack/Mattermost/Discord funzionano tutti correttamente da un VPS: il vero
    compromesso è tra un browser senza interfaccia grafica e una finestra visibile. Consultare [Browser](/it/tools/browser).

    Raccomandazione predefinita: utilizzare un VPS se in precedenza si sono verificate disconnessioni del Gateway; l'esecuzione locale è ideale
    quando si utilizza attivamente il Mac e si desidera accedere ai file locali o automatizzare
    un'interfaccia utente visibile nel browser.

  </Accordion>

  <Accordion title="Quanto è importante eseguire OpenClaw su una macchina dedicata?">
    Non è obbligatorio, ma è consigliato per affidabilità e isolamento.

    - **Host dedicato (VPS/Mac mini/Raspberry Pi):** sempre attivo, meno interruzioni dovute a sospensioni o riavvii, autorizzazioni più ordinate, più facile da mantenere in esecuzione.
    - **Portatile/desktop condiviso:** adatto per i test e l'uso attivo, ma sono previste pause quando la macchina entra in sospensione o viene aggiornata.

    Per ottenere il meglio da entrambe le soluzioni, mantenere il Gateway su un host dedicato e associare il portatile come
    **Node** per gli strumenti locali di schermo, fotocamera ed esecuzione. Consultare [Node](/it/nodes) e [Sicurezza](/it/gateway/security).

  </Accordion>

  <Accordion title="Quali sono i requisiti minimi per un VPS e il sistema operativo consigliato?">
    - **Minimo assoluto:** 1 vCPU, 1 GB di RAM, ~500 MB di spazio su disco.
    - **Consigliato:** 1-2 vCPU, almeno 2 GB di RAM per avere un margine adeguato (log, contenuti multimediali, più canali). Gli strumenti Node e l'automazione del browser possono richiedere molte risorse.

    Sistema operativo: **Ubuntu LTS** (o qualsiasi versione moderna di Debian/Ubuntu), il percorso di installazione Linux sottoposto al maggior numero di test.

    Documentazione: [Linux](/it/platforms/linux), [Hosting su VPS](/it/vps).

  </Accordion>

  <Accordion title="È possibile eseguire OpenClaw in una VM e quali sono i requisiti?">
    Sì. Considerare una VM come un VPS: deve essere sempre attiva, raggiungibile e disporre di RAM sufficiente
    per il Gateway e per tutti i canali abilitati.

    - **Minimo assoluto:** 1 vCPU, 1 GB di RAM.
    - **Consigliato:** almeno 2 GB di RAM per più canali, l'automazione del browser o gli strumenti multimediali.
    - **Sistema operativo:** Ubuntu LTS o un'altra versione moderna di Debian/Ubuntu.

    Su Windows, utilizzare **Windows Hub** per la configurazione desktop oppure WSL2 per una VM Gateway in stile Linux
    con un'ampia compatibilità con gli strumenti. Consultare [Windows](/it/platforms/windows), [Hosting su VPS](/it/vps).
    Per eseguire macOS in una VM, consultare [VM macOS](/it/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Contenuti correlati

- [Domande frequenti](/it/help/faq) - le domande frequenti principali (modelli, sessioni, Gateway, sicurezza e altro)
- [Panoramica dell'installazione](/it/install)
- [Guida introduttiva](/it/start/getting-started)
- [Risoluzione dei problemi](/it/help/troubleshooting)
