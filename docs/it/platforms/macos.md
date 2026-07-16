---
read_when:
    - Installazione dell'app per macOS
    - Scelta tra la modalità Gateway locale e remota su macOS
    - Download delle versioni dell'app per macOS cercati
summary: Installa e usa l'app OpenClaw per la barra dei menu di macOS
title: app per macOS
x-i18n:
    generated_at: "2026-07-16T14:35:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

L'app macOS è l'**app complementare nella barra dei menu** di OpenClaw: interfaccia nativa nella barra di stato, richieste di autorizzazione di macOS, notifiche, WebChat, input vocale, Canvas e
strumenti Node ospitati sul Mac, come `system.run`.

Servono solo la CLI e il Gateway? Iniziare da [Guida introduttiva](/it/start/getting-started).

## Download

Scaricare le build dell'app macOS dalle [release di OpenClaw su GitHub](https://github.com/openclaw/openclaw/releases).
Quando una release include risorse dell'app macOS, cercare:

- `OpenClaw-<version>.dmg` (opzione preferita)
- `OpenClaw-<version>.zip`

Alcune release includono solo la CLI, elementi di prova o risorse per Windows. Se la release più recente
non contiene una risorsa dell'app macOS, usare la più recente che la contiene oppure compilare dal codice sorgente seguendo
la [configurazione di sviluppo per macOS](/it/platforms/mac/dev-setup).

## Primo avvio

1. Installare e avviare **OpenClaw.app**.
2. Scegliere **This Mac** per un Gateway locale oppure connettersi a un Gateway remoto.
3. Attendere che l'app installi il runtime CLI corrispondente. In modalità locale,
   installa e avvia anche il Gateway.
4. Stabilire l'inferenza mediante un controllo con un modello attivo. Una volta superato, OpenClaw
   gestisce il resto della configurazione.
5. Completare l'elenco delle autorizzazioni di macOS e inviare il messaggio di prova dell'onboarding.

Se l'app raggiunge un Gateway esistente il cui agente predefinito dispone di un
modello configurato, considera tale Gateway già configurato, ignora l'onboarding del provider e
OpenClaw e apre la dashboard. Se non è possibile connettersi al Gateway o il suo
agente predefinito non dispone di un modello, l'onboarding dell'inferenza rimane disponibile per il
ripristino.

Per il percorso di configurazione della CLI e del Gateway, consultare [Guida introduttiva](/it/start/getting-started).
Per ripristinare le autorizzazioni, consultare [Autorizzazioni di macOS](/it/platforms/mac/permissions).

## Aggiornamenti

La scheda di aggiornamento della dashboard indica cosa verrà aggiornato dall'app:

- **Aggiorna app Mac + Gateway** significa che l'app firmata gestisce il Gateway
  locale tramite launchd. Sparkle aggiorna prima l'app; dopo il riavvio, l'app
  aggiorna e riavvia automaticamente il proprio Gateway alla versione corrispondente, quindi verifica la
  connessione.
- **Aggiorna Gateway** significa che l'app è connessa a un Gateway remoto, a un Gateway locale
  gestito manualmente o a un'altra installazione non gestita dall'app. Il pulsante
  esegue il normale flusso di aggiornamento di quel Gateway anziché modificare l'app Mac.

Un aggiornamento coordinato non riuscito rimane nella relativa finestra in stile configurazione, con opzioni per riprovare,
consultare la [guida all'aggiornamento](/it/install/updating) e usare le azioni di Discord. La riparazione automatica non
esegue mai il downgrade di un Gateway più recente né sostituisce il blocco del canale `extended-stable`.

Dopo un aggiornamento riuscito, l'app individua la sessione diretta di primo livello
utilizzata più di recente da una persona e invia a tale agente un evento di aggiornamento una tantum. Le attività di Heartbeat
e Cron non influiscono su questa scelta. L'agente può quindi dare nuovamente il benvenuto
dalla conversazione utilizzata con maggiore probabilità. In modalità remota, l'app
aggiorna solo il runtime Node locale del Mac e omette la notifica quando il
Gateway remoto è meno recente dell'app.

Sparkle segue l'impostazione `update.channel` del Gateway. `beta` e `dev` consentono di ricevere
le build beta dell'app; `stable`, `extended-stable` e i valori mancanti o sconosciuti
mantengono le build stabili dell'app.

## Apertura dei link della dashboard

Nella dashboard incorporata dell'app macOS, facendo clic su un link web esterno, questo si apre in una barra laterale del browser ridimensionabile, larga metà della finestra, mentre la navigazione della dashboard rimane visibile. Trascinare il divisore per scegliere un'altra larghezza; l'app la memorizza. Ogni link si apre in una scheda distinta, la barra delle schede appare quando sono aperte più pagine e facendo nuovamente clic sullo stesso link viene riutilizzata la scheda esistente. Trascinare le schede per riordinarle, chiuderle con il pulsante di chiusura della scheda o con un clic centrale e fare clic con il pulsante destro del mouse su una scheda per accedere a **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** e **Close Other Tabs**. I controlli Indietro/Avanti nella barra del titolo della finestra e i gesti di scorrimento sul trackpad consentono di navigare nella cronologia della dashboard; i controlli Indietro/Avanti della barra laterale consentono di navigare nella cronologia della scheda attiva. La barra laterale dispone inoltre dei controlli per ricaricare, aprire nel browser predefinito e chiudere.

I controlli della barra del titolo seguono la barra laterale dell'app: quando è espansa, i controlli Indietro/Avanti si trovano sul suo bordo destro accanto al pulsante della barra laterale; quando è compressa, lasciano spazio a un pulsante di ricerca, che apre la tavolozza dei comandi, e a un pulsante per una nuova sessione.

Fare clic con il pulsante destro del mouse su un link esterno per scegliere **Open in Sidebar**, **Open in Default Browser** o **Copy Link**. I clic con tasti modificatori e i link per nuove finestre attivati dall'utente nella dashboard continuano ad aprirsi nel browser predefinito; i link per nuove finestre all'interno della barra laterale si aprono come nuove schede della barra laterale. Le normali pagine dell'interfaccia di controllo ospitate nel browser mantengono il normale comportamento del browser per i link e il menu contestuale.

## Importazione degli accessi dal browser

La prima volta che si apre la barra laterale del browser mentre l'app utilizza un Gateway locale, la dashboard mostra un banner ignorabile se sul Mac esiste un profilo basato su Chrome contenente cookie. Il banner consente di copiare tali cookie in un profilo gestito e isolato, utilizzato dagli agenti per la navigazione. Scegliere un profilo dal controllo **Import**; potrebbe essere richiesto Touch ID. L'avanzamento e il numero di cookie importati vengono visualizzati direttamente nel banner e vengono copiati solo i cookie: le password non lasciano mai il browser di origine. La chiusura del banner registra la scelta; **Settings → General → Browser login → Import…** consente di riproporlo in qualsiasi momento. Consultare [Browser](/it/cli/browser) per il flusso di importazione sottostante e il vincolo `browser.allowSystemProfileImport`.

## Scelta della modalità Gateway

| Modalità | Quando usarla                                                                  | Pagina dei dettagli                                  |
| -------- | ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Locale   | Questo Mac deve eseguire il Gateway e mantenerlo attivo tramite launchd.       | [Gateway su macOS](/it/platforms/mac/bundled-gateway)   |
| Remota   | Un altro host esegue il Gateway; questo Mac lo controlla tramite SSH, LAN o Tailnet. | [Controllo remoto](/it/platforms/mac/remote)        |

Entrambe le modalità richiedono una CLI `openclaw` installata, poiché l'app ne riutilizza il runtime
host del Node. Su un Mac appena configurato, l'app installa automaticamente la CLI corrispondente; la modalità
locale avvia quindi la procedura guidata del Gateway, mentre la modalità remota si connette al Gateway
selezionato senza avviare un secondo Gateway locale.
Per il ripristino manuale, consultare [Gateway su macOS](/it/platforms/mac/bundled-gateway).

## Componenti gestiti dall'app

- Stato della barra dei menu, notifiche, integrità e WebChat.
- Richieste di autorizzazione di macOS per schermo, microfono, riconoscimento vocale, automazione e accessibilità.
- Un Node Mac che combina Canvas nativo, acquisizione da fotocamera/schermo, notifiche,
  posizione e controllo del computer con i comandi di sistema, browser,
  plugin, skill e MCP dell'host Node della CLI.
- Richieste di approvazione dell'esecuzione per i comandi ospitati sul Mac.
- Esecuzione nel contesto dell'app per i comandi shell approvati, preservando l'attribuzione
  delle autorizzazioni macOS dell'app mentre il runtime CLI gestisce i criteri condivisi del Node.
- Tunnel SSH in modalità remota o connessioni dirette al Gateway.

L'app **non** sostituisce la documentazione generale del Gateway o della CLI. La configurazione del Gateway,
i provider, i plugin, i canali, gli strumenti e la sicurezza sono descritti nelle rispettive
documentazioni.

## Pagine di dettaglio per macOS

| Attività                                         | Consultare                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Installare o eseguire il debug del servizio CLI/Gateway | [Gateway su macOS](/it/platforms/mac/bundled-gateway)                                   |
| Mantenere lo stato fuori dalle cartelle sincronizzate nel cloud | [Gateway su macOS](/it/platforms/mac/bundled-gateway#state-directory-on-macos)       |
| Eseguire il debug del rilevamento e della connettività dell'app | [Gateway su macOS](/it/platforms/mac/bundled-gateway#debug-app-connectivity)          |
| Comprendere il comportamento di launchd          | [Ciclo di vita del Gateway](/it/platforms/mac/child-process)                                  |
| Risolvere problemi di autorizzazioni o firma/TCC | [Autorizzazioni di macOS](/it/platforms/mac/permissions)                                      |
| Rilevare il Mac utilizzato più di recente        | [Presenza del computer attivo](/it/nodes/presence)                                            |
| Connettersi a un Gateway remoto                  | [Controllo remoto](/it/platforms/mac/remote)                                                  |
| Consultare lo stato della barra dei menu e i controlli di integrità | [Barra dei menu](/it/platforms/mac/menu-bar), [Controlli di integrità](/it/platforms/mac/health) |
| Usare l'interfaccia di chat incorporata          | [WebChat](/it/platforms/mac/webchat)                                                          |
| Usare l'attivazione vocale o la funzione premi per parlare | [Attivazione vocale](/it/platforms/mac/voicewake)                                      |
| Usare Canvas e i deep link di Canvas             | [Canvas](/it/platforms/mac/canvas)                                                            |
| Ospitare PeekabooBridge per l'automazione dell'interfaccia utente | [Bridge Peekaboo](/it/platforms/mac/peekaboo)                                      |
| Configurare le approvazioni dei comandi          | [Approvazioni dell'esecuzione](/it/tools/exec-approvals), [dettagli avanzati](/it/tools/exec-approvals-advanced) |
| Esaminare i comandi del Node Mac e l'IPC dell'app | [IPC di macOS](/it/platforms/mac/xpc)                                                        |
| Acquisire i log                                  | [Registrazione di macOS](/it/platforms/mac/logging)                                           |
| Compilare dal codice sorgente                    | [Configurazione di sviluppo per macOS](/it/platforms/mac/dev-setup)                           |

## Contenuti correlati

- [Piattaforme](/it/platforms)
- [Guida introduttiva](/it/start/getting-started)
- [Gateway](/it/gateway)
- [Approvazioni dell'esecuzione](/it/tools/exec-approvals)
