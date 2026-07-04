---
read_when: Finding which docs page covers a topic before reading the page
summary: Mappa delle intestazioni generata per le pagine della documentazione OpenClaw
title: Mappa della documentazione
x-i18n:
    generated_at: "2026-07-04T10:43:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ec366b8fddc45897436eeffb2af38cb4f161e77cf1e75c2f5aeb4a05e5d7063
    source_path: docs_map.md
    workflow: 16
---

# Mappa della documentazione OpenClaw

Questo file è generato dalle intestazioni `docs/**/*.md` e `docs/**/*.mdx` per aiutare gli agenti a orientarsi nell'albero della documentazione.
Non modificarlo manualmente; esegui `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Route: /agent-runtime-architecture
- Headings:
  - H2: Layout del runtime
  - H2: Confini
  - H2: Manifesti
  - H2: Selezione del runtime
  - H2: Correlati

## announcements/bluebubbles-imessage.md

- Route: /announcements/bluebubbles-imessage
- Headings:
  - H1: Rimozione di BlueBubbles e percorso iMessage imsg
  - H2: Che cosa è cambiato
  - H2: Che cosa fare
  - H2: Note di migrazione
  - H2: Vedi anche

## auth-credential-semantics.md

- Route: /auth-credential-semantics
- Headings:
  - H2: Codici motivo stabili del probe
  - H2: Credenziali token
  - H3: Regole di idoneità
  - H3: Regole di risoluzione
  - H2: Portabilità della copia dell'agente
  - H2: Route di autenticazione solo configurazione
  - H2: Filtro esplicito dell'ordine di autenticazione
  - H2: Risoluzione della destinazione del probe
  - H2: Rilevamento delle credenziali CLI esterne
  - H2: Guard della policy OAuth SecretRef
  - H2: Messaggistica compatibile con legacy
  - H2: Correlati

## automation/auth-monitoring.md

- Route: /automation/auth-monitoring
- Headings:
  - H2: Correlati

## automation/clawflow.md

- Route: /automation/clawflow
- Headings:
  - H2: Correlati

## automation/cron-jobs.md

- Route: /automation/cron-jobs
- Headings:
  - H2: Avvio rapido
  - H2: Come funziona Cron
  - H2: Tipi di pianificazione
  - H3: Giorno del mese e giorno della settimana usano la logica OR
  - H2: Stili di esecuzione
  - H3: Payload dei comandi
  - H3: Opzioni payload per job isolati
  - H2: Recapito e output
  - H2: Lingua dell'output
  - H2: Esempi CLI
  - H2: Webhook
  - H3: Autenticazione
  - H2: Integrazione Gmail PubSub
  - H3: Configurazione guidata (consigliata)
  - H3: Avvio automatico del Gateway
  - H3: Configurazione manuale una tantum
  - H3: Override del modello Gmail
  - H2: Gestione dei job
  - H2: Configurazione
  - H2: Risoluzione dei problemi
  - H3: Scala dei comandi
  - H2: Correlati

## automation/cron-vs-heartbeat.md

- Route: /automation/cron-vs-heartbeat
- Headings:
  - H2: Correlati

## automation/gmail-pubsub.md

- Route: /automation/gmail-pubsub
- Headings:
  - H2: Correlati

## automation/hooks.md

- Route: /automation/hooks
- Headings:
  - H2: Scegliere la superficie corretta
  - H2: Avvio rapido
  - H2: Tipi di evento
  - H2: Scrivere hook
  - H3: Struttura degli hook
  - H3: Formato HOOK.md
  - H3: Implementazione dell'handler
  - H3: Punti principali del contesto evento
  - H2: Rilevamento degli hook
  - H3: Pacchetti di hook
  - H2: Hook inclusi
  - H3: Dettagli di session-memory
  - H3: Configurazione di bootstrap-extra-files
  - H3: Dettagli di command-logger
  - H3: Dettagli di compaction-notifier
  - H3: Dettagli di boot-md
  - H2: Hook Plugin
  - H2: Configurazione
  - H2: Riferimento CLI
  - H2: Best practice
  - H2: Risoluzione dei problemi
  - H3: Hook non rilevato
  - H3: Hook non idoneo
  - H3: Hook non in esecuzione
  - H2: Correlati

## automation/index.md

- Route: /automation
- Headings:
  - H2: Guida decisionale rapida
  - H3: Attività pianificate (Cron) vs Heartbeat
  - H2: Concetti fondamentali
  - H3: Attività pianificate (Cron)
  - H3: Attività
  - H3: Impegni dedotti
  - H3: Task Flow
  - H3: Istruzioni permanenti
  - H3: Hook
  - H3: Heartbeat
  - H2: Come funzionano insieme
  - H2: Correlati

## automation/poll.md

- Route: /automation/poll
- Headings:
  - H2: Correlati

## automation/standing-orders.md

- Route: /automation/standing-orders
- Headings:
  - H2: Perché usare le istruzioni permanenti
  - H2: Come funzionano
  - H2: Anatomia di un'istruzione permanente
  - H2: Istruzioni permanenti più job Cron
  - H2: Esempi
  - H3: Esempio 1: contenuti e social media (ciclo settimanale)
  - H3: Esempio 2: operazioni finanziarie (attivate da eventi)
  - H3: Esempio 3: monitoraggio e avvisi (continuo)
  - H2: Pattern esegui-verifica-riferisci
  - H2: Architettura multi-programma
  - H2: Best practice
  - H3: Fare
  - H3: Evitare
  - H2: Correlati

## automation/taskflow.md

- Route: /automation/taskflow
- Headings:
  - H2: Quando usare Task Flow
  - H2: Pattern di workflow pianificato affidabile
  - H2: Modalità di sincronizzazione
  - H3: Modalità gestita
  - H3: Modalità mirrored
  - H2: Stato durevole e tracciamento delle revisioni
  - H2: Comportamento di annullamento
  - H2: Comandi CLI
  - H2: Come i flussi si collegano alle attività
  - H2: Correlati

## automation/tasks.md

- Route: /automation/tasks
- Headings:
  - H2: TL;DR
  - H2: Avvio rapido
  - H2: Che cosa crea un'attività
  - H2: Ciclo di vita dell'attività
  - H2: Recapito e notifiche
  - H3: Policy di notifica
  - H2: Riferimento CLI
  - H2: Bacheca attività in chat (/tasks)
  - H2: Integrazione dello stato (pressione delle attività)
  - H2: Archiviazione e manutenzione
  - H3: Dove risiedono le attività
  - H3: Manutenzione automatica
  - H2: Come le attività si collegano ad altri sistemi
  - H2: Correlati

## automation/troubleshooting.md

- Route: /automation/troubleshooting
- Headings:
  - H2: Correlati

## automation/webhook.md

- Route: /automation/webhook
- Headings:
  - H2: Correlati

## brave-search.md

- Route: /brave-search
- Headings:
  - H2: Correlati

## channels/access-groups.md

- Route: /channels/access-groups
- Headings:
  - H2: Gruppi statici di mittenti dei messaggi
  - H2: Gruppi di riferimento da allowlist
  - H2: Percorsi message-channel supportati
  - H2: Diagnostica Plugin
  - H2: Pubblici dei canali Discord
  - H2: Note di sicurezza
  - H2: Risoluzione dei problemi

## channels/ambient-room-events.md

- Route: /channels/ambient-room-events
- Headings:
  - H2: Configurazione consigliata
  - H2: Che cosa cambia
  - H2: Esempio Discord
  - H2: Esempio Slack
  - H2: Esempio Telegram
  - H2: Policy specifica dell'agente
  - H2: Modalità di risposta visibili
  - H2: Cronologia
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/bot-loop-protection.md

- Route: /channels/bot-loop-protection
- Headings:
  - H1: Protezione dai loop dei bot
  - H2: Default
  - H2: Configurare default condivisi
  - H2: Override per canale o account
  - H2: Supporto dei canali

## channels/broadcast-groups.md

- Route: /channels/broadcast-groups
- Headings:
  - H2: Panoramica
  - H2: Casi d'uso
  - H2: Configurazione
  - H3: Configurazione di base
  - H3: Strategia di elaborazione
  - H3: Esempio completo
  - H2: Come funziona
  - H3: Flusso dei messaggi
  - H3: Isolamento delle sessioni
  - H3: Esempio: sessioni isolate
  - H2: Best practice
  - H2: Compatibilità
  - H3: Provider
  - H3: Routing
  - H2: Risoluzione dei problemi
  - H2: Esempi
  - H2: Riferimento API
  - H3: Schema di configurazione
  - H3: Campi
  - H2: Limitazioni
  - H2: Miglioramenti futuri
  - H2: Correlati

## channels/channel-routing.md

- Route: /channels/channel-routing
- Headings:
  - H1: Canali e routing
  - H2: Termini chiave
  - H2: Prefissi di destinazione in uscita
  - H2: Forme delle chiavi di sessione (esempi)
  - H2: Pinning della route DM principale
  - H2: Registrazione inbound protetta
  - H2: Regole di routing (come viene scelto un agente)
  - H2: Gruppi broadcast (eseguire più agenti)
  - H2: Panoramica della configurazione
  - H2: Archiviazione delle sessioni
  - H2: Comportamento WebChat
  - H2: Contesto della risposta
  - H2: Correlati

## channels/clickclack.md

- Route: /channels/clickclack
- Headings:
  - H2: Configurazione rapida
  - H2: Più bot
  - H2: Destinazioni
  - H2: Autorizzazioni
  - H2: Risoluzione dei problemi

## channels/discord.md

- Route: /channels/discord
- Headings:
  - H2: Configurazione rapida
  - H2: Consigliato: configurare uno spazio di lavoro guild
  - H2: Modello di runtime
  - H2: Canali forum
  - H2: Componenti interattivi
  - H2: Controllo degli accessi e routing
  - H3: Routing degli agenti basato sui ruoli
  - H2: Comandi nativi e autenticazione dei comandi
  - H2: Dettagli delle funzionalità
  - H2: Strumenti e gate delle azioni
  - H2: UI Components v2
  - H2: Voce
  - H3: Canali vocali
  - H3: Seguire gli utenti nella voce
  - H3: Messaggi vocali
  - H2: Risoluzione dei problemi
  - H2: Riferimento di configurazione
  - H2: Sicurezza e operazioni
  - H2: Correlati

## channels/feishu.md

- Route: /channels/feishu
- Headings:
  - H2: Avvio rapido
  - H2: Controllo degli accessi
  - H3: Messaggi diretti
  - H3: Chat di gruppo
  - H2: Esempi di configurazione dei gruppi
  - H3: Consenti tutti i gruppi, nessuna @mention richiesta
  - H3: Consenti tutti i gruppi, richiedi comunque @mention
  - H3: Consenti solo gruppi specifici
  - H3: Limita i mittenti all'interno di un gruppo
  - H2: Ottenere gli ID di gruppo/utente
  - H3: ID gruppo (chatid, formato: ocxxx)
  - H3: ID utente (openid, formato: ouxxx)
  - H2: Comandi comuni
  - H2: Risoluzione dei problemi
  - H3: Il bot non risponde nelle chat di gruppo
  - H3: Il bot non riceve messaggi
  - H3: La configurazione QR non reagisce nell'app mobile Feishu
  - H3: App Secret trapelato
  - H2: Configurazione avanzata
  - H3: Più account
  - H3: Limiti dei messaggi
  - H3: Streaming
  - H3: Ottimizzazione della quota
  - H3: Sessioni ACP
  - H4: Binding ACP persistente
  - H4: Genera ACP dalla chat
  - H3: Routing multi-agente
  - H2: Isolamento degli agenti per utente (creazione dinamica degli agenti)
  - H3: Configurazione rapida
  - H3: Come funziona
  - H3: Opzioni di configurazione
  - H3: Ambito della sessione
  - H3: Deployment multiutente tipico
  - H3: Verifica
  - H3: Note
  - H2: Riferimento di configurazione
  - H2: Tipi di messaggio supportati
  - H3: Ricevere
  - H3: Inviare
  - H3: Thread e risposte
  - H2: Correlati

## channels/googlechat.md

- Route: /channels/googlechat
- Headings:
  - H2: Installazione
  - H2: Configurazione rapida (principianti)
  - H2: Aggiungere a Google Chat
  - H2: URL pubblico (solo Webhook)
  - H3: Opzione A: Tailscale Funnel (consigliata)
  - H3: Opzione B: Reverse Proxy (Caddy)
  - H3: Opzione C: Cloudflare Tunnel
  - H2: Come funziona
  - H2: Destinazioni
  - H2: Punti principali della configurazione
  - H2: Risoluzione dei problemi
  - H3: 405 Method Not Allowed
  - H3: Altri problemi
  - H2: Correlati

## channels/group-messages.md

- Route: /channels/group-messages
- Headings:
  - H2: Comportamento
  - H2: Esempio di configurazione (WhatsApp)
  - H3: Comando di attivazione (solo proprietario)
  - H2: Come usare
  - H2: Test / verifica
  - H2: Considerazioni note
  - H2: Correlati

## channels/groups.md

- Route: /channels/groups
- Headings:
  - H2: Introduzione per principianti (2 minuti)
  - H2: Risposte visibili
  - H2: Visibilità del contesto e allowlist
  - H2: Chiavi di sessione
  - H2: Pattern: DM personali + gruppi pubblici (agente singolo)
  - H2: Etichette di visualizzazione
  - H2: Policy di gruppo
  - H2: Gate delle menzioni (default)
  - H2: Definire l'ambito dei pattern di menzione configurati
  - H2: Restrizioni agli strumenti per gruppo/canale (opzionale)
  - H2: Allowlist di gruppi
  - H2: Attivazione (solo proprietario)
  - H2: Campi del contesto
  - H2: Specifiche di iMessage
  - H2: Prompt di sistema WhatsApp
  - H2: Specifiche di WhatsApp
  - H2: Correlati

## channels/imessage-from-bluebubbles.md

- Route: /channels/imessage-from-bluebubbles
- Headings:
  - H2: Checklist di migrazione
  - H2: Quando questa migrazione ha senso
  - H2: Che cosa fa imsg
  - H2: Prima di iniziare
  - H2: Traduzione della configurazione
  - H2: Problema insidioso del registro dei gruppi
  - H2: Passo per passo
  - H2: Parità delle azioni in sintesi
  - H2: Abbinamento, sessioni e binding ACP
  - H2: Nessun canale di rollback
  - H2: Correlati

## channels/imessage.md

- Route: /channels/imessage
- Headings:
  - H2: Configurazione rapida
  - H2: Requisiti e autorizzazioni (macOS)
  - H2: Abilitare l'API privata imsg
  - H3: Configurazione
  - H3: Quando non puoi disabilitare SIP
  - H2: Controllo degli accessi e routing
  - H2: Binding di conversazione ACP
  - H2: Pattern di deployment
  - H2: Media, suddivisione in chunk e destinazioni di recapito
  - H2: Azioni API private
  - H2: Scritture della configurazione
  - H2: Coalescenza dei DM con invio diviso (comando + URL in una composizione)
  - H3: Scenari e che cosa vede l'agente
  - H2: Ripristino inbound dopo il riavvio di un bridge o del gateway
  - H3: Segnale visibile all'operatore
  - H3: Migrazione
  - H2: Risoluzione dei problemi
  - H2: Puntatori al riferimento di configurazione
  - H2: Correlati

## channels/index.md

- Route: /channels
- Headings:
  - H2: Note sul recapito
  - H2: Canali supportati
  - H2: Note

## channels/irc.md

- Route: /channels/irc
- Headings:
  - H2: Avvio rapido
  - H2: Default di sicurezza
  - H2: Controllo degli accessi
  - H3: Problema comune: allowFrom è per i DM, non per i canali
  - H2: Attivazione delle risposte (menzioni)
  - H2: Nota di sicurezza (consigliata per canali pubblici)
  - H3: Stessi strumenti per tutti nel canale
  - H3: Strumenti diversi per mittente (il proprietario ha più potere)
  - H2: NickServ
  - H2: Variabili di ambiente
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/line.md

- Route: /channels/line
- Intestazioni:
  - H2: Installa
  - H2: Configurazione iniziale
  - H2: Configura
  - H2: Controllo degli accessi
  - H2: Comportamento dei messaggi
  - H2: Dati del canale (messaggi avanzati)
  - H2: Supporto ACP
  - H2: Media in uscita
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/location.md

- Route: /channels/location
- Intestazioni:
  - H2: Formattazione del testo
  - H2: Campi di contesto
  - H2: Note sul canale
  - H2: Correlati

## channels/matrix-migration.md

- Route: /channels/matrix-migration
- Intestazioni:
  - H2: Cosa fa automaticamente la migrazione
  - H2: Cosa non può fare automaticamente la migrazione
  - H2: Flusso di aggiornamento consigliato
  - H2: Come funziona la migrazione cifrata
  - H2: Messaggi comuni e cosa significano
  - H3: Messaggi di aggiornamento e rilevamento
  - H3: Messaggi di ripristino dello stato cifrato
  - H3: Messaggi di ripristino manuale
  - H3: Messaggi di installazione di Plugin personalizzati
  - H2: Se la cronologia cifrata continua a non tornare
  - H2: Se vuoi ricominciare da capo per i messaggi futuri
  - H2: Correlati

## channels/matrix-presentation.md

- Route: /channels/matrix-presentation
- Intestazioni:
  - H2: Contenuto dell'evento
  - H2: Comportamento di fallback
  - H2: Blocchi supportati
  - H2: Interazioni
  - H2: Relazione con i metadati di approvazione
  - H2: Messaggi multimediali

## channels/matrix-push-rules.md

- Route: /channels/matrix-push-rules
- Intestazioni:
  - H2: Prerequisiti
  - H2: Passaggi
  - H2: Note multi-bot
  - H2: Note sull'homeserver
  - H2: Correlati

## channels/matrix.md

- Route: /channels/matrix
- Intestazioni:
  - H2: Installa
  - H2: Configurazione iniziale
  - H3: Configurazione iniziale interattiva
  - H3: Configurazione minima
  - H3: Accesso automatico alle stanze
  - H3: Formati di destinazione dell'elenco consentiti
  - H3: Normalizzazione dell'ID account
  - H3: Credenziali memorizzate nella cache
  - H3: Variabili d'ambiente
  - H2: Esempio di configurazione
  - H2: Anteprime in streaming
  - H2: Messaggi vocali
  - H2: Metadati di approvazione
  - H3: Regole push self-hosted per anteprime finalizzate silenziose
  - H2: Stanze bot-to-bot
  - H2: Cifratura e verifica
  - H3: Abilita la cifratura
  - H3: Stato e segnali di attendibilità
  - H3: Verifica questo dispositivo con una chiave di ripristino
  - H3: Esegui il bootstrap o ripara la cross-signing
  - H3: Backup delle chiavi stanza
  - H3: Elencare, richiedere e rispondere alle verifiche
  - H3: Note multi-account
  - H2: Gestione del profilo
  - H2: Thread
  - H3: Instradamento delle sessioni (sessionScope)
  - H3: Risposte in thread (threadReplies)
  - H3: Ereditarietà dei thread e comandi slash
  - H2: Associazioni delle conversazioni ACP
  - H3: Configurazione dell'associazione dei thread
  - H2: Reazioni
  - H2: Contesto della cronologia
  - H2: Visibilità del contesto
  - H2: Criteri per DM e stanze
  - H2: Riparazione delle stanze dirette
  - H2: Approvazioni exec
  - H2: Comandi slash
  - H2: Multi-account
  - H2: Homeserver privati/LAN
  - H2: Proxy del traffico Matrix
  - H2: Risoluzione della destinazione
  - H2: Riferimento di configurazione
  - H3: Account e connessione
  - H3: Cifratura
  - H3: Accesso e criteri
  - H3: Comportamento delle risposte
  - H3: Impostazioni delle reazioni
  - H3: Strumenti e override per stanza
  - H3: Impostazioni di approvazione exec
  - H2: Correlati

## channels/mattermost.md

- Route: /channels/mattermost
- Intestazioni:
  - H2: Installa
  - H2: Configurazione rapida
  - H2: Comandi slash nativi
  - H2: Variabili d'ambiente (account predefinito)
  - H2: Modalità chat
  - H2: Thread e sessioni
  - H2: Controllo degli accessi (DM)
  - H2: Canali (gruppi)
  - H2: Destinazioni per la consegna in uscita
  - H2: Nuovo tentativo del canale DM
  - H2: Streaming delle anteprime
  - H2: Reazioni (strumento messaggi)
  - H2: Pulsanti interattivi (strumento messaggi)
  - H3: Integrazione API diretta (script esterni)
  - H2: Adattatore directory
  - H2: Multi-account
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/msteams.md

- Route: /channels/msteams
- Intestazioni:
  - H2: Plugin in bundle
  - H2: Configurazione rapida
  - H2: Obiettivi
  - H2: Scritture della configurazione
  - H2: Controllo degli accessi (DM + gruppi)
  - H3: Come funziona
  - H3: Passaggio 1: Crea Azure Bot
  - H3: Passaggio 2: Ottieni le credenziali
  - H3: Passaggio 3: Configura l'endpoint di messaggistica
  - H3: Passaggio 4: Abilita il canale Teams
  - H3: Passaggio 5: Crea il manifesto dell'app Teams
  - H3: Passaggio 6: Configura OpenClaw
  - H3: Passaggio 7: Esegui il Gateway
  - H2: Autenticazione federata (certificato più identità gestita)
  - H3: Opzione A: Autenticazione basata su certificato
  - H3: Opzione B: Azure Managed Identity
  - H3: Configurazione di AKS Workload Identity
  - H3: Confronto dei tipi di autenticazione
  - H2: Sviluppo locale (tunneling)
  - H2: Test del bot
  - H2: Variabili d'ambiente
  - H2: Azione info membro
  - H2: Contesto della cronologia
  - H2: Autorizzazioni RSC Teams attuali (manifesto)
  - H2: Esempio di manifesto Teams (redatto)
  - H3: Avvertenze sul manifesto (campi obbligatori)
  - H3: Aggiornamento di un'app esistente
  - H2: Funzionalità: solo RSC rispetto a Graph
  - H3: Solo con Teams RSC (app installata, nessuna autorizzazione Graph API)
  - H3: Con Teams RSC + autorizzazioni applicazione Microsoft Graph
  - H3: RSC rispetto a Graph API
  - H2: Media + cronologia abilitati da Graph (obbligatori per i canali)
  - H2: Limitazioni note
  - H3: Timeout dei Webhook
  - H3: Supporto per cloud Teams e URL del servizio
  - H3: Formattazione
  - H2: Configurazione
  - H2: Instradamento e sessioni
  - H2: Stile di risposta: thread rispetto a post
  - H3: Precedenza di risoluzione
  - H3: Conservazione del contesto dei thread
  - H2: Allegati e immagini
  - H2: Invio di file nelle chat di gruppo
  - H3: Perché le chat di gruppo richiedono SharePoint
  - H3: Configurazione iniziale
  - H3: Comportamento di condivisione
  - H3: Comportamento di fallback
  - H3: Posizione dei file archiviati
  - H2: Sondaggi (Adaptive Cards)
  - H2: Schede di presentazione
  - H2: Formati di destinazione
  - H2: Messaggistica proattiva
  - H2: ID team e canale (errore comune)
  - H2: Canali privati
  - H2: Risoluzione dei problemi
  - H3: Problemi comuni
  - H3: Errori di caricamento del manifesto
  - H3: Autorizzazioni RSC non funzionanti
  - H2: Riferimenti
  - H2: Correlati

## channels/nextcloud-talk.md

- Route: /channels/nextcloud-talk
- Intestazioni:
  - H2: Plugin in bundle
  - H2: Configurazione rapida (principiante)
  - H2: Note
  - H2: Controllo degli accessi (DM)
  - H2: Stanze (gruppi)
  - H2: Funzionalità
  - H2: Riferimento di configurazione (Nextcloud Talk)
  - H2: Correlati

## channels/nostr.md

- Route: /channels/nostr
- Intestazioni:
  - H2: Plugin in bundle
  - H3: Installazioni precedenti/personalizzate
  - H3: Configurazione iniziale non interattiva
  - H2: Configurazione rapida
  - H2: Riferimento di configurazione
  - H2: Metadati del profilo
  - H2: Controllo degli accessi
  - H3: Criteri DM
  - H3: Esempio di elenco consentiti
  - H2: Formati delle chiavi
  - H2: Relay
  - H2: Supporto del protocollo
  - H2: Test
  - H3: Relay locale
  - H3: Test manuale
  - H2: Risoluzione dei problemi
  - H3: Mancata ricezione dei messaggi
  - H3: Mancato invio delle risposte
  - H3: Risposte duplicate
  - H2: Sicurezza
  - H2: Limitazioni (MVP)
  - H2: Correlati

## channels/pairing.md

- Route: /channels/pairing
- Intestazioni:
  - H2: 1) Associazione DM (accesso alla chat in ingresso)
  - H3: Approva un mittente
  - H3: Gruppi di mittenti riutilizzabili
  - H3: Dove risiede lo stato
  - H2: 2) Associazione dispositivo Node (nodi iOS/Android/macOS/headless)
  - H3: Associa tramite Telegram (consigliato per iOS)
  - H3: Approva un dispositivo Node
  - H3: Approvazione automatica facoltativa dei nodi tramite CIDR attendibili
  - H3: Archiviazione dello stato di associazione Node
  - H3: Note
  - H2: Documenti correlati

## channels/qa-channel.md

- Route: /channels/qa-channel
- Intestazioni:
  - H2: Cosa fa
  - H2: Configurazione
  - H2: Runner
  - H2: Correlati

## channels/qqbot.md

- Route: /channels/qqbot
- Intestazioni:
  - H2: Installa
  - H2: Configurazione iniziale
  - H2: Configura
  - H3: Configurazione multi-account
  - H3: Chat di gruppo
  - H3: Voce (STT / TTS)
  - H2: Formati di destinazione
  - H2: Comandi slash
  - H2: Architettura del motore
  - H2: Onboarding con codice QR
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/raft.md

- Route: /channels/raft
- Intestazioni:
  - H2: Installa
  - H2: Prerequisiti
  - H2: Configura
  - H2: Come funziona
  - H2: Verifica
  - H2: Risoluzione dei problemi
  - H2: Riferimenti

## channels/signal.md

- Route: /channels/signal
- Intestazioni:
  - H2: Prerequisiti
  - H2: Configurazione rapida (principiante)
  - H2: Che cos'è
  - H2: Scritture della configurazione
  - H2: Il modello dei numeri (importante)
  - H2: Percorso di configurazione A: collega un account Signal esistente (QR)
  - H2: Percorso di configurazione B: registra un numero bot dedicato (SMS, Linux)
  - H2: Modalità daemon esterno (httpUrl)
  - H2: Modalità container (bbernhard/signal-cli-rest-api)
  - H2: Controllo degli accessi (DM + gruppi)
  - H2: Come funziona (comportamento)
  - H2: Media + limiti
  - H2: Digitazione + conferme di lettura
  - H2: Reazioni di stato del ciclo di vita
  - H2: Reazioni (strumento messaggi)
  - H2: Reazioni di approvazione
  - H2: Destinazioni di consegna (CLI/Cron)
  - H2: Alias
  - H2: Risoluzione dei problemi
  - H2: Note di sicurezza
  - H2: Riferimento di configurazione (Signal)
  - H2: Correlati

## channels/slack.md

- Route: /channels/slack
- Intestazioni:
  - H2: Scelta tra Socket Mode e URL di richiesta HTTP
  - H3: Modalità relay
  - H2: Installa
  - H2: Configurazione rapida
  - H2: Ottimizzazione del trasporto Socket Mode
  - H2: Checklist di manifesto e ambiti
  - H3: Impostazioni aggiuntive del manifesto
  - H2: Modello dei token
  - H2: Azioni e gate
  - H2: Controllo degli accessi e instradamento
  - H2: Thread, sessioni e tag di risposta
  - H2: Reazioni di ack
  - H3: Emoji (ackReaction)
  - H3: Ambito (messages.ackReactionScope)
  - H2: Streaming del testo
  - H2: Fallback della reazione di digitazione
  - H2: Media, suddivisione in blocchi e consegna
  - H2: Comandi e comportamento slash
  - H2: Risposte interattive
  - H3: Invii modali di proprietà del Plugin
  - H2: Approvazioni native in Slack
  - H2: Eventi e comportamento operativo
  - H2: Riferimento di configurazione
  - H2: Risoluzione dei problemi
  - H2: Riferimento per la visione degli allegati
  - H3: Tipi di media supportati
  - H3: Pipeline in ingresso
  - H3: Ereditarietà degli allegati della radice del thread
  - H3: Gestione di più allegati
  - H3: Limiti di dimensione, download e modello
  - H3: Limiti noti
  - H3: Documentazione correlata
  - H2: Correlati

## channels/sms.md

- Route: /channels/sms
- Intestazioni:
  - H2: Prima di iniziare
  - H2: Configurazione rapida
  - H2: Esempi di configurazione
  - H3: File di configurazione
  - H3: Variabili d'ambiente
  - H3: Token di autenticazione SecretRef
  - H3: Numero privato solo con elenco consentiti
  - H3: Mittente Messaging Service
  - H3: Destinazione in uscita predefinita
  - H2: Controllo degli accessi
  - H2: Invio di SMS
  - H2: Verifica della configurazione
  - H3: Test end-to-end da macOS iMessage/SMS
  - H2: Sicurezza del Webhook
  - H2: Configurazione multi-account
  - H2: Risoluzione dei problemi
  - H3: Twilio restituisce 403 oppure OpenClaw rifiuta il Webhook
  - H3: Non compare alcuna richiesta di associazione
  - H3: Gli invii in uscita non riescono
  - H3: I messaggi arrivano ma l'agente non risponde

## channels/synology-chat.md

- Route: /channels/synology-chat
- Intestazioni:
  - H2: Plugin in bundle
  - H2: Configurazione rapida
  - H2: Variabili d'ambiente
  - H2: Criteri DM e controllo degli accessi
  - H2: Consegna in uscita
  - H2: Multi-account
  - H2: Note di sicurezza
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/telegram.md

- Route: /channels/telegram
- Intestazioni:
  - H2: Configurazione rapida
  - H2: Impostazioni lato Telegram
  - H2: Controllo degli accessi e attivazione
  - H3: Identità del bot di gruppo
  - H2: Comportamento runtime
  - H2: Riferimento delle funzionalità
  - H2: Controlli delle risposte di errore
  - H2: Risoluzione dei problemi
  - H2: Riferimento di configurazione
  - H2: Correlati

## channels/tlon.md

- Route: /channels/tlon
- Intestazioni:
  - H2: Plugin in bundle
  - H2: Configurazione iniziale
  - H2: Ship privati/LAN
  - H2: Canali di gruppo
  - H2: Controllo degli accessi
  - H2: Sistema di proprietario e approvazione
  - H2: Impostazioni di accettazione automatica
  - H2: Destinazioni di consegna (CLI/Cron)
  - H2: Skill in bundle
  - H2: Funzionalità
  - H2: Risoluzione dei problemi
  - H2: Riferimento di configurazione
  - H2: Note
  - H2: Correlati

## channels/troubleshooting.md

- Route: /channels/troubleshooting
- Intestazioni:
  - H2: Scala dei comandi
  - H2: Dopo un aggiornamento
  - H2: WhatsApp
  - H3: Firme di errore WhatsApp
  - H2: Telegram
  - H3: Firme di errore Telegram
  - H2: Discord
  - H3: Firme di errore Discord
  - H2: Slack
  - H3: Firme di errore Slack
  - H2: iMessage
  - H3: Firme di errore iMessage
  - H2: Signal
  - H3: Firme di errore Signal
  - H2: QQ Bot
  - H3: Firme di errore QQ Bot
  - H2: Matrix
  - H3: Firme di errore Matrix
  - H2: Correlati

## channels/twitch.md

- Percorso: /channels/twitch
- Intestazioni:
  - H2: Plugin in bundle
  - H2: Configurazione rapida (principianti)
  - H2: Che cos'è
  - H2: Configurazione (dettagliata)
  - H3: Genera le credenziali
  - H3: Configura il bot
  - H3: Controllo degli accessi (consigliato)
  - H2: Aggiornamento del token (facoltativo)
  - H2: Supporto multi-account
  - H2: Controllo degli accessi
  - H2: Risoluzione dei problemi
  - H2: Configurazione
  - H3: Configurazione dell'account
  - H3: Opzioni del provider
  - H2: Azioni degli strumenti
  - H2: Sicurezza e operazioni
  - H2: Limiti
  - H2: Correlati

## channels/wechat.md

- Percorso: /channels/wechat
- Intestazioni:
  - H2: Denominazione
  - H2: Come funziona
  - H2: Installa
  - H2: Accesso
  - H2: Controllo degli accessi
  - H2: Compatibilità
  - H2: Processo sidecar
  - H2: Risoluzione dei problemi
  - H2: Documenti correlati

## channels/whatsapp.md

- Percorso: /channels/whatsapp
- Intestazioni:
  - H2: Installa (su richiesta)
  - H2: Configurazione rapida
  - H2: Chiama il richiedente corrente con MeowCaller (sperimentale)
  - H2: Modelli di distribuzione
  - H2: Modello di runtime
  - H2: Prompt di approvazione
  - H2: Hook Plugin e privacy
  - H2: Controllo degli accessi e attivazione
  - H2: Binding ACP configurati
  - H2: Comportamento con numero personale e chat con se stessi
  - H2: Normalizzazione dei messaggi e contesto
  - H2: Recapito, suddivisione in blocchi e media
  - H2: Citazione delle risposte
  - H2: Livello di reazione
  - H2: Reazioni di conferma
  - H2: Reazioni di stato del ciclo di vita
  - H2: Multi-account e credenziali
  - H2: Strumenti, azioni e scritture di configurazione
  - H2: Risoluzione dei problemi
  - H2: Prompt di sistema
  - H2: Puntatori al riferimento di configurazione
  - H2: Correlati

## channels/yuanbao.md

- Percorso: /channels/yuanbao
- Intestazioni:
  - H2: Avvio rapido
  - H3: Configurazione interattiva (alternativa)
  - H2: Controllo degli accessi
  - H3: Messaggi diretti
  - H3: Chat di gruppo
  - H2: Esempi di configurazione
  - H3: Configurazione di base con criterio DM aperto
  - H3: Limita i DM a utenti specifici
  - H3: Disabilita il requisito di @mention nei gruppi
  - H3: Ottimizza il recapito dei messaggi in uscita
  - H3: Regola la strategia merge-text
  - H2: Comandi comuni
  - H2: Risoluzione dei problemi
  - H3: Il bot non risponde nelle chat di gruppo
  - H3: Il bot non riceve messaggi
  - H3: Il bot invia risposte vuote o di fallback
  - H3: App Secret divulgato
  - H2: Configurazione avanzata
  - H3: Account multipli
  - H3: Limiti dei messaggi
  - H3: Streaming
  - H3: Contesto della cronologia delle chat di gruppo
  - H3: Modalità reply-to
  - H3: Iniezione di suggerimenti Markdown
  - H3: Modalità debug
  - H3: Routing multi-agente
  - H2: Riferimento di configurazione
  - H2: Tipi di messaggio supportati
  - H3: Ricevi
  - H3: Invia
  - H3: Thread e risposte
  - H2: Correlati

## channels/zalo.md

- Percorso: /channels/zalo
- Intestazioni:
  - H2: Plugin in bundle
  - H2: Configurazione rapida (principianti)
  - H2: Che cos'è
  - H2: Configurazione (percorso rapido)
  - H3: 1) Crea un token bot (Zalo Bot Platform)
  - H3: 2) Configura il token (env o configurazione)
  - H2: Come funziona (comportamento)
  - H2: Limiti
  - H2: Controllo degli accessi (DM)
  - H3: Accesso DM
  - H2: Controllo degli accessi (Gruppi)
  - H2: Long-polling vs webhook
  - H2: Tipi di messaggio supportati
  - H2: Capacità
  - H2: Destinazioni di recapito (CLI/cron)
  - H2: Risoluzione dei problemi
  - H2: Riferimento di configurazione (Zalo)
  - H2: Correlati

## channels/zaloclawbot.md

- Percorso: /channels/zaloclawbot
- Intestazioni:
  - H2: Compatibilità
  - H2: Prerequisiti
  - H2: Installa con onboard (consigliato)
  - H2: Installazione manuale
  - H3: 1. Installa il Plugin
  - H3: 2. Abilita il Plugin nella configurazione
  - H3: 3. Genera il codice QR e accedi
  - H3: 4. Riavvia il Gateway
  - H2: Come funziona
  - H2: Sotto il cofano
  - H2: Risoluzione dei problemi

## channels/zalouser.md

- Percorso: /channels/zalouser
- Intestazioni:
  - H2: Plugin in bundle
  - H2: Configurazione rapida (principianti)
  - H2: Che cos'è
  - H2: Denominazione
  - H2: Trovare gli ID (directory)
  - H2: Limiti
  - H2: Controllo degli accessi (DM)
  - H2: Accesso ai gruppi (facoltativo)
  - H3: Gate basato su menzione di gruppo
  - H2: Multi-account
  - H2: Variabili d'ambiente
  - H2: Digitazione, reazioni e conferme di recapito
  - H2: Risoluzione dei problemi
  - H2: Correlati

## ci.md

- Percorso: /ci
- Intestazioni:
  - H2: Panoramica della pipeline
  - H2: Ordine fail-fast
  - H2: Contesto ed evidenza della PR
  - H2: Ambito e routing
  - H2: Inoltro dell'attività ClawSweeper
  - H2: Dispatch manuali
  - H2: Runner
  - H2: Budget di registrazione dei runner
  - H2: Equivalenti locali
  - H2: Prestazioni OpenClaw
  - H2: Validazione completa del rilascio
  - H2: Shard live ed E2E
  - H2: Accettazione del pacchetto
  - H3: Job
  - H3: Origini candidate
  - H3: Profili della suite
  - H3: Finestre di compatibilità legacy
  - H3: Esempi
  - H2: Smoke di installazione
  - H2: E2E Docker locale
  - H3: Parametri regolabili
  - H3: Workflow live/E2E riutilizzabile
  - H3: Segmenti del percorso di rilascio
  - H2: Prerelease Plugin
  - H2: QA Lab
  - H2: CodeQL
  - H3: Categorie di sicurezza
  - H3: Shard di sicurezza specifici per piattaforma
  - H3: Categorie di qualità critica
  - H2: Workflow di manutenzione
  - H3: Docs Agent
  - H3: Test Performance Agent
  - H3: PR duplicate dopo il merge
  - H2: Gate di controllo locali e routing delle modifiche
  - H2: Validazione Testbox
  - H2: Correlati

## clawhub/cli.md

- Percorso: /clawhub/cli
- Intestazioni:
  - H1: CLI ClawHub
  - H2: Scopri e installa
  - H2: Pubblica e mantieni
  - H2: Correlati

## clawhub/publishing.md

- Percorso: /clawhub/publishing
- Intestazioni:
  - H1: Pubblicazione su ClawHub
  - H2: Proprietari
  - H2: Skills
  - H2: Plugins
  - H2: Flusso di rilascio
  - H2: FAQ
  - H3: L'ambito del pacchetto deve corrispondere al proprietario selezionato

## cli/acp.md

- Percorso: /cli/acp
- Intestazioni:
  - H2: Che cosa non è
  - H2: Matrice di compatibilità
  - H2: Limitazioni note
  - H2: Utilizzo
  - H2: Client ACP (debug)
  - H2: Smoke test del protocollo
  - H2: Come usarlo
  - H2: Selezione degli agenti
  - H2: Uso da acpx (Codex, Claude, altri client ACP)
  - H2: Configurazione dell'editor Zed
  - H2: Mapping delle sessioni
  - H2: Opzioni
  - H3: opzioni del client acp
  - H2: Correlati

## cli/agent.md

- Percorso: /cli/agent
- Intestazioni:
  - H1: openclaw agent
  - H2: Opzioni
  - H2: Esempi
  - H2: Note
  - H2: Stato di recapito JSON
  - H2: Correlati

## cli/agents.md

- Percorso: /cli/agents
- Intestazioni:
  - H1: openclaw agents
  - H2: Esempi
  - H2: Binding di routing
  - H3: formato --bind
  - H3: Comportamento dell'ambito del binding
  - H2: Superficie dei comandi
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete &lt;id&gt;
  - H2: File di identità
  - H2: Imposta identità
  - H2: Correlati

## cli/approvals.md

- Percorso: /cli/approvals
- Intestazioni:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Comandi comuni
  - H2: Sostituisci le approvazioni da un file
  - H2: Esempio "Non chiedere mai" / YOLO
  - H2: Helper allowlist
  - H2: Opzioni comuni
  - H2: Note
  - H2: Correlati

## cli/attach.md

- Percorso: /cli/attach
- Intestazioni: nessuna

## cli/backup.md

- Percorso: /cli/backup
- Intestazioni:
  - H1: openclaw backup
  - H2: Note
  - H2: Cosa viene sottoposto a backup
  - H2: Comportamento con configurazione non valida
  - H2: Dimensioni e prestazioni
  - H2: Correlati

## cli/browser.md

- Percorso: /cli/browser
- Intestazioni:
  - H1: openclaw browser
  - H2: Flag comuni
  - H2: Avvio rapido (locale)
  - H2: Risoluzione rapida dei problemi
  - H2: Ciclo di vita
  - H2: Se il comando manca
  - H2: Profili
  - H2: Schede
  - H2: Snapshot / screenshot / azioni
  - H2: Stato e archiviazione
  - H2: Debug
  - H2: Chrome esistente tramite MCP
  - H2: Controllo remoto del browser (proxy host node)
  - H2: Correlati

## cli/channels.md

- Percorso: /cli/channels
- Intestazioni:
  - H1: openclaw channels
  - H2: Comandi comuni
  - H2: Stato / capacità / risoluzione / log
  - H2: Aggiungi / rimuovi account
  - H2: Login e logout (interattivo)
  - H2: Risoluzione dei problemi
  - H2: Probe delle capacità
  - H2: Risolvi i nomi in ID
  - H2: Correlati

## cli/clawbot.md

- Percorso: /cli/clawbot
- Intestazioni:
  - H1: openclaw clawbot
  - H2: Migrazione
  - H2: Correlati

## cli/commitments.md

- Percorso: /cli/commitments
- Intestazioni:
  - H2: Utilizzo
  - H2: Opzioni
  - H2: Esempi
  - H2: Output
  - H2: Correlati

## cli/completion.md

- Percorso: /cli/completion
- Intestazioni:
  - H1: openclaw completion
  - H2: Utilizzo
  - H2: Opzioni
  - H2: Note
  - H2: Correlati

## cli/config.md

- Percorso: /cli/config
- Intestazioni:
  - H2: Opzioni radice
  - H2: Esempi
  - H3: schema di configurazione
  - H3: Percorsi
  - H2: Valori
  - H2: modalità config set
  - H2: config patch
  - H2: Flag del builder provider
  - H2: Dry run
  - H3: Forma dell'output JSON
  - H2: Sicurezza di scrittura
  - H2: Sottocomandi
  - H2: Convalida
  - H2: Correlati

## cli/configure.md

- Percorso: /cli/configure
- Intestazioni:
  - H1: openclaw configure
  - H2: Opzioni
  - H2: Esempi
  - H2: Correlati

## cli/crestodian.md

- Percorso: /cli/crestodian
- Intestazioni:
  - H1: openclaw crestodian
  - H2: Cosa mostra Crestodian
  - H2: Esempi
  - H2: Avvio sicuro
  - H2: Operazioni e approvazione
  - H2: Bootstrap della configurazione
  - H2: Planner assistito dal modello
  - H2: Passaggio a un agente
  - H2: Modalità di recupero messaggi
  - H2: Correlati

## cli/cron.md

- Percorso: /cli/cron
- Intestazioni:
  - H1: openclaw cron
  - H2: Crea job rapidamente
  - H2: Sessioni
  - H2: Recapito
  - H3: Proprietà del recapito
  - H3: Recapito in caso di errore
  - H2: Pianificazione
  - H3: Job una tantum
  - H3: Job ricorrenti
  - H3: Esecuzioni manuali
  - H2: Modelli
  - H3: Precedenza del modello cron isolato
  - H3: Modalità veloce
  - H3: Nuovi tentativi di cambio modello live
  - H2: Output di esecuzione e rifiuti
  - H3: Soppressione delle conferme obsolete
  - H3: Soppressione dei token silenziosi
  - H3: Rifiuti strutturati
  - H2: Conservazione
  - H2: Migrazione di job precedenti
  - H2: Modifiche comuni
  - H2: Comandi admin comuni
  - H2: Correlati

## cli/daemon.md

- Percorso: /cli/daemon
- Intestazioni:
  - H1: openclaw daemon
  - H2: Utilizzo
  - H2: Sottocomandi
  - H2: Opzioni comuni
  - H2: Preferisci
  - H2: Correlati

## cli/dashboard.md

- Percorso: /cli/dashboard
- Intestazioni:
  - H1: openclaw dashboard
  - H2: Correlati

## cli/devices.md

- Percorso: /cli/devices
- Intestazioni:
  - H1: openclaw devices
  - H2: Comandi
  - H3: openclaw devices list
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Approvazione al primo avvio di Paperclip / openclawgateway
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: Opzioni comuni
  - H2: Note
  - H2: Checklist di recupero dalla deriva del token
  - H2: Correlati

## cli/directory.md

- Percorso: /cli/directory
- Intestazioni:
  - H1: openclaw directory
  - H2: Flag comuni
  - H2: Note
  - H2: Uso dei risultati con l'invio di messaggi
  - H2: Formati ID (per canale)
  - H2: Se stesso ("me")
  - H2: Peer (contatti/utenti)
  - H2: Gruppi
  - H2: Correlati

## cli/dns.md

- Percorso: /cli/dns
- Intestazioni:
  - H1: openclaw dns
  - H2: Configurazione
  - H2: dns setup
  - H2: Correlati

## cli/docs.md

- Percorso: /cli/docs
- Intestazioni:
  - H1: openclaw docs
  - H2: Utilizzo
  - H2: Esempi
  - H2: Come funziona
  - H2: Output
  - H2: Codici di uscita
  - H2: Correlati

## cli/doctor.md

- Percorso: /cli/doctor
- Intestazioni:
  - H1: openclaw doctor
  - H2: Perché usarlo
  - H2: Esempi
  - H2: Opzioni
  - H2: Modalità lint
  - H2: Controlli di integrità strutturati
  - H2: Selezione dei controlli
  - H2: Modalità post-upgrade
  - H2: macOS: override env launchctl
  - H2: Correlati

## cli/flows.md

- Percorso: /cli/flows
- Intestazioni:
  - H1: openclaw tasks flow
  - H2: Sottocomandi
  - H3: Valori del filtro di stato
  - H2: Esempi
  - H2: Correlati

## cli/gateway.md

- Percorso: /cli/gateway
- Intestazioni:
  - H2: Esegui il Gateway
  - H3: Opzioni
  - H2: Riavvia il Gateway
  - H3: Profilazione del Gateway
  - H2: Interroga un Gateway in esecuzione
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: Remoto su SSH (parità app Mac)
  - H3: gateway call &lt;method&gt;
  - H2: Gestisci il servizio Gateway
  - H3: Installa con un wrapper
  - H2: Rileva i gateway (Bonjour)
  - H3: gateway discover
  - H2: Correlati

## cli/health.md

- Percorso: /cli/health
- Intestazioni:
  - H1: openclaw health
  - H2: Opzioni
  - H2: Correlati

## cli/hooks.md

- Percorso: /cli/hooks
- Intestazioni:
  - H1: openclaw hooks
  - H2: Elenca tutti gli hook
  - H2: Ottieni informazioni sull'hook
  - H2: Verifica l'idoneità degli hook
  - H2: Abilita un hook
  - H2: Disabilita un hook
  - H2: Note
  - H2: Installa pacchetti di hook
  - H2: Aggiorna pacchetti di hook
  - H2: Hook inclusi
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: Correlati

## cli/index.md

- Percorso: /cli
- Intestazioni:
  - H2: Pagine dei comandi
  - H2: Flag globali
  - H2: Modalità di output
  - H2: Albero dei comandi
  - H2: Comandi slash della chat
  - H2: Monitoraggio dell'utilizzo
  - H2: Correlati

## cli/infer.md

- Percorso: /cli/infer
- Intestazioni:
  - H2: Trasforma infer in una skill
  - H2: Perché usare infer
  - H2: Albero dei comandi
  - H2: Attività comuni
  - H2: Comportamento
  - H2: Modello
  - H2: Immagine
  - H2: Audio
  - H2: TTS
  - H2: Video
  - H2: Web
  - H2: Embedding
  - H2: Output JSON
  - H2: Problemi comuni
  - H2: Note
  - H2: Correlati

## cli/logs.md

- Percorso: /cli/logs
- Intestazioni:
  - H1: openclaw logs
  - H2: Opzioni
  - H2: Opzioni RPC del Gateway condivise
  - H2: Esempi
  - H2: Note
  - H2: Correlati

## cli/mcp.md

- Percorso: /cli/mcp
- Intestazioni:
  - H2: Scegli il percorso MCP corretto
  - H2: OpenClaw come server MCP
  - H3: Quando usare serve
  - H3: Come funziona
  - H3: Scegli una modalità client
  - H3: Cosa espone serve
  - H3: Utilizzo
  - H3: Strumenti bridge
  - H3: Modello di eventi
  - H3: Notifiche del canale Claude
  - H3: Configurazione del client MCP
  - H3: Opzioni
  - H3: Sicurezza e confine di fiducia
  - H3: Test
  - H3: Risoluzione dei problemi
  - H2: OpenClaw come registro client MCP
  - H3: Definizioni salvate dei server MCP
  - H3: Ricette comuni per server
  - H3: Forme dell'output JSON
  - H3: Trasporto stdio
  - H3: Trasporto SSE / HTTP
  - H3: Flusso di lavoro OAuth
  - H3: Trasporto HTTP streamable
  - H2: Interfaccia di controllo
  - H2: Limiti attuali
  - H2: Correlati

## cli/memory.md

- Percorso: /cli/memory
- Intestazioni:
  - H1: openclaw memory
  - H2: Esempi
  - H2: Opzioni
  - H2: Dreaming
  - H2: Correlati

## cli/message.md

- Percorso: /cli/message
- Intestazioni:
  - H1: openclaw message
  - H2: Utilizzo
  - H2: Flag comuni
  - H2: Comportamento di SecretRef
  - H2: Azioni
  - H3: Core
  - H3: Thread
  - H3: Emoji
  - H3: Sticker
  - H3: Ruoli / Canali / Membri / Voce
  - H3: Eventi
  - H3: Moderazione (Discord)
  - H3: Trasmissione
  - H2: Esempi
  - H2: Correlati

## cli/migrate.md

- Percorso: /cli/migrate
- Intestazioni:
  - H1: openclaw migrate
  - H2: Comandi
  - H2: Modello di sicurezza
  - H2: Provider Claude
  - H3: Cosa importa Claude
  - H3: Stato dell'archivio e della revisione manuale
  - H2: Provider Codex
  - H3: Cosa importa Codex
  - H3: Stato Codex con revisione manuale
  - H2: Provider Hermes
  - H3: Cosa importa Hermes
  - H3: Chiavi .env supportate
  - H3: Stato solo archivio
  - H3: Dopo l'applicazione
  - H2: Contratto del Plugin
  - H2: Integrazione dell'onboarding
  - H2: Correlati

## cli/models.md

- Percorso: /cli/models
- Intestazioni:
  - H1: openclaw models
  - H2: Comandi comuni
  - H3: Scansione dei modelli
  - H3: Stato dei modelli
  - H2: Alias + fallback
  - H2: Profili di autenticazione
  - H2: Correlati

## cli/node.md

- Percorso: /cli/node
- Intestazioni:
  - H1: openclaw node
  - H2: Perché usare un host node?
  - H2: Proxy browser (zero-config)
  - H2: Esecuzione (foreground)
  - H2: Autenticazione Gateway per host node
  - H2: Servizio (background)
  - H2: Abbinamento
  - H2: Approvazioni exec
  - H2: Correlati

## cli/nodes.md

- Percorso: /cli/nodes
- Intestazioni:
  - H1: openclaw nodes
  - H2: Comandi comuni
  - H2: Invoca
  - H2: Correlati

## cli/onboard.md

- Percorso: /cli/onboard
- Intestazioni:
  - H1: openclaw onboard
  - H2: Guide correlate
  - H2: Esempi
  - H2: Locale
  - H3: Scelte endpoint Z.AI non interattive
  - H2: Flag non interattivi aggiuntivi
  - H2: Note sul flusso
  - H2: Comandi successivi comuni

## cli/pairing.md

- Percorso: /cli/pairing
- Intestazioni:
  - H1: openclaw pairing
  - H2: Comandi
  - H2: pairing list
  - H2: pairing approve
  - H2: Note
  - H2: Correlati

## cli/path.md

- Percorso: /cli/path
- Intestazioni:
  - H1: openclaw path
  - H2: Perché usarlo
  - H2: Come viene usato
  - H2: Come funziona
  - H2: Sottocomandi
  - H2: Flag globali
  - H2: Sintassi oc://
  - H2: Indirizzamento per tipo di file
  - H2: Contratto di mutazione
  - H2: Esempi
  - H2: Ricette per tipo di file
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: Riferimento dei sottocomandi
  - H3: resolve &lt;oc-path&gt;
  - H3: find &lt;pattern&gt;
  - H3: set &lt;oc-path&gt; &lt;value&gt;
  - H3: validate &lt;oc-path&gt;
  - H3: emit &lt;file&gt;
  - H2: Codici di uscita
  - H2: Modalità di output
  - H2: Note
  - H2: Correlati

## cli/plugins.md

- Percorso: /cli/plugins
- Intestazioni:
  - H2: Comandi
  - H3: Autore
  - H3: Scaffold provider
  - H3: Installa
  - H4: Abbreviazione marketplace
  - H3: Elenco
  - H3: Indice dei Plugin
  - H3: Disinstalla
  - H3: Aggiorna
  - H3: Ispeziona
  - H3: Doctor
  - H3: Registro
  - H3: Marketplace
  - H2: Correlati

## cli/policy.md

- Percorso: /cli/policy
- Intestazioni:
  - H1: openclaw policy
  - H2: Avvio rapido
  - H3: Riferimento delle regole di policy
  - H4: Overlay con ambito
  - H4: Canali
  - H4: Server MCP
  - H4: Provider di modelli
  - H4: Rete
  - H4: Ingress e accesso ai canali
  - H4: Gateway
  - H4: Workspace dell'agente
  - H4: Postura della sandbox
  - H4: Gestione dei dati
  - H4: Segreti
  - H4: Approvazioni exec
  - H4: Profili di autenticazione
  - H4: Metadati degli strumenti
  - H4: Postura degli strumenti
  - H2: Configura policy
  - H2: Accetta lo stato della policy
  - H2: Risultati
  - H2: Riparazione
  - H2: Codici di uscita
  - H2: Correlati

## cli/proxy.md

- Percorso: /cli/proxy
- Intestazioni:
  - H1: openclaw proxy
  - H2: Comandi
  - H2: Convalida
  - H2: Preset di query
  - H2: Note
  - H2: Correlati

## cli/qr.md

- Percorso: /cli/qr
- Intestazioni:
  - H1: openclaw qr
  - H2: Utilizzo
  - H2: Opzioni
  - H2: Note
  - H2: Correlati

## cli/reset.md

- Percorso: /cli/reset
- Intestazioni:
  - H1: openclaw reset
  - H2: Correlati

## cli/sandbox.md

- Percorso: /cli/sandbox
- Intestazioni:
  - H2: Panoramica
  - H2: Comandi
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: Casi d'uso
  - H3: Dopo aver aggiornato un'immagine Docker
  - H3: Dopo aver modificato la configurazione della sandbox
  - H3: Dopo aver modificato la destinazione SSH o il materiale di autenticazione SSH
  - H3: Dopo aver modificato origine, policy o modalità di OpenShell
  - H3: Dopo aver modificato setupCommand
  - H3: Solo per un agente specifico
  - H2: Perché è necessario
  - H2: Migrazione del registro
  - H2: Configurazione
  - H2: Correlati

## cli/secrets.md

- Percorso: /cli/secrets
- Intestazioni:
  - H1: openclaw secrets
  - H2: Ricarica snapshot runtime
  - H2: Audit
  - H2: Configura (helper interattivo)
  - H2: Applica un piano salvato
  - H2: Perché non ci sono backup di rollback
  - H2: Esempio
  - H2: Correlati

## cli/security.md

- Percorso: /cli/security
- Intestazioni:
  - H1: openclaw security
  - H2: Audit
  - H2: Output JSON
  - H2: Cosa cambia --fix
  - H2: Correlati

## cli/sessions.md

- Percorso: /cli/sessions
- Intestazioni:
  - H1: openclaw sessions
  - H2: Manutenzione della pulizia
  - H2: Compatta una sessione
  - H3: RPC sessions.compact
  - H2: Correlati

## cli/setup.md

- Percorso: /cli/setup
- Intestazioni:
  - H1: openclaw setup
  - H2: Opzioni
  - H3: Modalità baseline
  - H2: Esempi
  - H2: Note
  - H2: Correlati

## cli/skills.md

- Percorso: /cli/skills
- Intestazioni:
  - H1: openclaw skills
  - H2: Comandi
  - H2: Workshop Skill
  - H2: Correlati

## cli/status.md

- Percorso: /cli/status
- Intestazioni:
  - H2: Correlati

## cli/system.md

- Percorso: /cli/system
- Intestazioni:
  - H1: openclaw system
  - H2: Comandi comuni
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: Note
  - H2: Correlati

## cli/tasks.md

- Percorso: /cli/tasks
- Intestazioni:
  - H2: Utilizzo
  - H2: Opzioni root
  - H2: Sottocomandi
  - H3: list
  - H3: show
  - H3: notify
  - H3: cancel
  - H3: audit
  - H3: maintenance
  - H3: flow
  - H2: Correlati

## cli/transcripts.md

- Percorso: /cli/transcripts
- Intestazioni:
  - H1: openclaw transcripts
  - H2: Comandi
  - H2: Output
  - H2: Molte riunioni al giorno
  - H2: Riepiloghi mancanti
  - H2: Configurazione

## cli/tui.md

- Percorso: /cli/tui
- Intestazioni:
  - H1: openclaw tui
  - H2: Opzioni
  - H2: Esempi
  - H2: Ciclo di riparazione della configurazione
  - H2: Correlati

## cli/uninstall.md

- Percorso: /cli/uninstall
- Intestazioni:
  - H1: openclaw uninstall
  - H2: Correlati

## cli/update.md

- Percorso: /cli/update
- Intestazioni:
  - H1: openclaw update
  - H2: Utilizzo
  - H2: Opzioni
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: Cosa fa
  - H3: Forma della risposta del control-plane
  - H2: Flusso di checkout Git
  - H3: Selezione del canale
  - H3: Passaggi di aggiornamento
  - H2: Abbreviazione --update
  - H2: Correlati

## cli/voicecall.md

- Percorso: /cli/voicecall
- Intestazioni:
  - H1: openclaw voicecall
  - H2: Sottocomandi
  - H2: Configurazione e smoke
  - H3: setup
  - H3: smoke
  - H2: Ciclo di vita della chiamata
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: Log e metriche
  - H3: tail
  - H3: latency
  - H2: Esposizione dei Webhook
  - H3: expose
  - H2: Correlati

## cli/webhooks.md

- Percorso: /cli/webhooks
- Intestazioni:
  - H1: openclaw webhooks
  - H2: Sottocomandi
  - H2: webhooks gmail setup
  - H3: Obbligatorio
  - H3: Opzioni Pub/Sub
  - H3: Opzioni di consegna OpenClaw
  - H3: Opzioni gog watch serve
  - H3: Esposizione Tailscale
  - H3: Output
  - H2: webhooks gmail run
  - H2: Flusso end-to-end
  - H2: Correlati

## cli/wiki.md

- Percorso: /cli/wiki
- Intestazioni:
  - H1: openclaw wiki
  - H2: A cosa serve
  - H2: Comandi comuni
  - H2: Comandi
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest &lt;path-or-url&gt;
  - H3: wiki okf import &lt;path&gt;
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search &lt;query&gt;
  - H3: wiki get &lt;lookup&gt;
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: Guida all'uso pratico
  - H2: Collegamenti con la configurazione
  - H2: Correlati

## cli/workboard.md

- Percorso: /cli/workboard
- Intestazioni:
  - H2: Utilizzo
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Parità dei comandi slash
  - H2: Autorizzazioni
  - H2: Risoluzione dei problemi
  - H3: Nessuna scheda visualizzata
  - H3: Dispatch indica solo dati
  - H3: Dispatch non avvia nulla
  - H2: Correlati

## concepts/active-memory.md

- Percorso: /concepts/active-memory
- Intestazioni:
  - H2: Avvio rapido
  - H2: Raccomandazioni sulla velocità
  - H3: Configurazione Cerebras
  - H2: Come visualizzarla
  - H2: Interruttore di sessione
  - H2: Quando viene eseguita
  - H2: Tipi di sessione
  - H2: Dove viene eseguita
  - H2: Perché usarla
  - H2: Come funziona
  - H2: Modalità di query
  - H2: Stili di prompt
  - H2: Policy di fallback del modello
  - H2: Strumenti di memoria
  - H3: memory-core integrato
  - H3: Memoria LanceDB
  - H3: Lossless Claw
  - H2: Escape hatch avanzati
  - H2: Persistenza delle trascrizioni
  - H2: Configurazione
  - H2: Configurazione consigliata
  - H3: Grazia cold-start
  - H2: Debug
  - H2: Problemi comuni
  - H2: Pagine correlate

## concepts/agent-loop.md

- Percorso: /concepts/agent-loop
- Intestazioni:
  - H2: Punti di ingresso
  - H2: Come funziona (alto livello)
  - H2: Accodamento + concorrenza
  - H2: Preparazione di sessione + workspace
  - H2: Assemblaggio del prompt + prompt di sistema
  - H2: Punti hook (dove puoi intercettare)
  - H3: Hook interni (hook Gateway)
  - H3: Hook Plugin (ciclo di vita agente + gateway)
  - H2: Streaming + risposte parziali
  - H2: Esecuzione strumenti + strumenti di messaggistica
  - H2: Modellazione della risposta + soppressione
  - H2: Compaction + nuovi tentativi
  - H2: Stream di eventi (oggi)
  - H2: Gestione dei canali chat
  - H2: Timeout
  - H2: Dove le cose possono terminare in anticipo
  - H2: Correlati

## concepts/agent-runtimes.md

- Percorso: /concepts/agent-runtimes
- Intestazioni:
  - H2: Superfici Codex
  - H2: Proprietà del runtime
  - H2: Selezione del runtime
  - H2: Runtime agente GitHub Copilot
  - H2: Contratto di compatibilità
  - H2: Etichette di stato
  - H2: Correlati

## concepts/agent-workspace.md

- Percorso: /concepts/agent-workspace
- Intestazioni:
  - H2: Posizione predefinita
  - H2: Cartelle di workspace aggiuntive
  - H2: Mappa dei file del workspace
  - H2: Cosa NON è nel workspace
  - H2: Backup Git (consigliato, privato)
  - H2: Non committare segreti
  - H2: Spostare il workspace su una nuova macchina
  - H2: Note avanzate
  - H2: Correlati

## concepts/agent.md

- Percorso: /concepts/agent
- Intestazioni:
  - H2: Workspace (obbligatorio)
  - H2: File di bootstrap (iniettati)
  - H2: Strumenti integrati
  - H2: Skills
  - H2: Confini del runtime
  - H2: Sessioni
  - H2: Guida durante lo streaming
  - H2: Riferimenti ai modelli
  - H2: Configurazione (minima)
  - H2: Correlati

## concepts/architecture.md

- Percorso: /concepts/architecture
- Intestazioni:
  - H2: Panoramica
  - H2: Componenti e flussi
  - H3: Gateway (daemon)
  - H3: Client (app mac / CLI / amministrazione web)
  - H3: Node (macOS / iOS / Android / headless)
  - H3: WebChat
  - H2: Ciclo di vita della connessione (client singolo)
  - H2: Protocollo wire (riepilogo)
  - H2: Abbinamento + fiducia locale
  - H2: Tipizzazione del protocollo e generazione del codice
  - H2: Accesso remoto
  - H2: Snapshot operativo
  - H2: Invarianti
  - H2: Correlati

## concepts/channel-docking.md

- Percorso: /concepts/channel-docking
- Intestazioni:
  - H2: Esempio
  - H2: Perché usarlo
  - H2: Configurazione richiesta
  - H2: Comandi
  - H2: Cosa cambia
  - H2: Cosa non cambia
  - H2: Risoluzione dei problemi

## concepts/commitments.md

- Percorso: /concepts/commitments
- Intestazioni:
  - H2: Abilitare gli impegni
  - H2: Come funziona
  - H2: Ambito
  - H2: Impegni e promemoria
  - H2: Gestire gli impegni
  - H2: Privacy e costo
  - H2: Risoluzione dei problemi
  - H2: Correlati

## concepts/compaction.md

- Percorso: /concepts/compaction
- Intestazioni:
  - H2: Come funziona
  - H2: Compaction automatica
  - H2: Compaction manuale
  - H2: Configurazione
  - H3: Usare un modello diverso
  - H3: Conservazione degli identificatori
  - H3: Protezione dei byte della trascrizione attiva
  - H3: Trascrizioni successive
  - H3: Avvisi di Compaction
  - H3: Flush della memoria
  - H2: Provider di Compaction collegabili
  - H2: Compaction e pruning
  - H2: Risoluzione dei problemi
  - H2: Correlati

## concepts/context-engine.md

- Percorso: /concepts/context-engine
- Intestazioni:
  - H2: Avvio rapido
  - H2: Come funziona
  - H3: Ciclo di vita dei subagent (facoltativo)
  - H3: Aggiunta al prompt di sistema
  - H2: Il motore legacy
  - H2: Motori Plugin
  - H3: L'interfaccia ContextEngine
  - H3: Impostazioni runtime
  - H3: Requisiti dell'host
  - H3: Isolamento degli errori
  - H3: ownsCompaction
  - H2: Riferimento di configurazione
  - H2: Relazione con Compaction e memoria
  - H2: Suggerimenti
  - H2: Correlati

## concepts/context.md

- Percorso: /concepts/context
- Intestazioni:
  - H2: Avvio rapido (ispezionare il contesto)
  - H2: Output di esempio
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Cosa conta per la finestra di contesto
  - H2: Come OpenClaw costruisce il prompt di sistema
  - H2: File del workspace iniettati (contesto del progetto)
  - H2: Skills: iniettate e caricate su richiesta
  - H2: Strumenti: ci sono due costi
  - H2: Comandi, direttive e "scorciatoie inline"
  - H2: Sessioni, Compaction e pruning (cosa persiste)
  - H2: Cosa riporta effettivamente /context
  - H2: Correlati

## concepts/delegate-architecture.md

- Percorso: /concepts/delegate-architecture
- Intestazioni:
  - H2: Che cos'è un delegato?
  - H2: Perché i delegati?
  - H2: Livelli di capacità
  - H3: Livello 1: sola lettura + bozza
  - H3: Livello 2: invio per conto di
  - H3: Livello 3: proattivo
  - H2: Prerequisiti: isolamento e hardening
  - H3: Blocchi rigidi (non negoziabili)
  - H3: Restrizioni degli strumenti
  - H3: Isolamento della sandbox
  - H3: Audit trail
  - H2: Configurare un delegato
  - H3: 1. Creare l'agente delegato
  - H3: 2. Configurare la delega del provider di identità
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Associare il delegato ai canali
  - H3: 4. Aggiungere credenziali all'agente delegato
  - H2: Esempio: assistente organizzativo
  - H2: Pattern di scalabilità
  - H2: Correlati

## concepts/dreaming.md

- Percorso: /concepts/dreaming
- Intestazioni:
  - H2: Cosa scrive Dreaming
  - H2: Modello a fasi
  - H2: Ingestione della trascrizione di sessione
  - H2: Dream Diary
  - H2: Segnali di ranking profondi
  - H2: Copertura del report di prova shadow QA
  - H2: Pianificazione
  - H2: Avvio rapido
  - H2: Comando slash
  - H2: Flusso di lavoro CLI
  - H2: Valori predefiniti chiave
  - H2: Interfaccia dei sogni
  - H2: Dreaming non viene mai eseguito: lo stato mostra bloccato
  - H2: Correlati

## concepts/experimental-features.md

- Percorso: /concepts/experimental-features
- Intestazioni:
  - H2: Flag attualmente documentati
  - H2: Modalità lean del modello locale
  - H3: Perché questi tre strumenti
  - H3: Quando attivarla
  - H3: Quando lasciarla disattivata
  - H3: Abilitare
  - H2: Sperimentale non significa nascosto
  - H2: Correlati

## concepts/features.md

- Percorso: /concepts/features
- Intestazioni:
  - H2: In evidenza
  - H2: Elenco completo
  - H2: Correlati

## concepts/mantis-slack-desktop-runbook.md

- Percorso: /concepts/mantis-slack-desktop-runbook
- Intestazioni:
  - H2: Modello di archiviazione
  - H2: Dispatch GitHub
  - H2: CLI locale
  - H2: Modalità di idratazione
  - H2: Interpretazione dei tempi
  - H2: Checklist delle evidenze
  - H2: Gestione degli errori
  - H2: Correlati

## concepts/mantis.md

- Percorso: /concepts/mantis
- Intestazioni:
  - H2: Obiettivi
  - H2: Non obiettivi
  - H2: Proprietà
  - H2: Forma del comando
  - H2: Ciclo di vita dell'esecuzione
  - H2: MVP Discord
  - H2: Componenti QA esistenti
  - H2: Modello delle evidenze
  - H2: Browser e VNC
  - H2: Macchine
  - H2: Segreti
  - H2: Artefatti GitHub e commenti PR
  - H2: Note di distribuzione privata
  - H2: Aggiungere uno scenario
  - H2: Espansione dei provider
  - H2: Domande aperte

## concepts/markdown-formatting.md

- Percorso: /concepts/markdown-formatting
- Intestazioni:
  - H2: Obiettivi
  - H2: Pipeline
  - H2: Esempio IR
  - H2: Dove viene usato
  - H2: Gestione delle tabelle
  - H2: Regole di suddivisione in chunk
  - H2: Criteri per i link
  - H2: Spoiler
  - H2: Come aggiungere o aggiornare un formatter di canale
  - H2: Problemi comuni
  - H2: Correlati

## concepts/memory-builtin.md

- Percorso: /concepts/memory-builtin
- Intestazioni:
  - H2: Cosa fornisce
  - H2: Per iniziare
  - H2: Provider di embedding supportati
  - H2: Come funziona l'indicizzazione
  - H2: Quando usarla
  - H2: Risoluzione dei problemi
  - H2: Configurazione
  - H2: Correlati

## concepts/memory-honcho.md

- Percorso: /concepts/memory-honcho
- Intestazioni:
  - H2: Cosa fornisce
  - H2: Strumenti disponibili
  - H2: Per iniziare
  - H2: Configurazione
  - H2: Migrazione della memoria esistente
  - H2: Come funziona
  - H2: Honcho e memoria integrata
  - H2: Comandi CLI
  - H2: Ulteriori letture
  - H2: Correlati

## concepts/memory-qmd.md

- Percorso: /concepts/memory-qmd
- Intestazioni:
  - H2: Cosa aggiunge rispetto all'integrata
  - H2: Per iniziare
  - H3: Prerequisiti
  - H3: Abilitare
  - H2: Come funziona il sidecar
  - H2: Prestazioni di ricerca e compatibilità
  - H2: Override dei modelli
  - H2: Indicizzazione di percorsi aggiuntivi
  - H2: Indicizzazione delle trascrizioni di sessione
  - H2: Ambito della ricerca
  - H2: Citazioni
  - H2: Quando usarla
  - H2: Risoluzione dei problemi
  - H2: Configurazione
  - H2: Correlati

## concepts/memory-search.md

- Percorso: /concepts/memory-search
- Intestazioni:
  - H2: Avvio rapido
  - H2: Provider supportati
  - H2: Come funziona la ricerca
  - H2: Migliorare la qualità della ricerca
  - H3: Decadimento temporale
  - H3: MMR (diversità)
  - H3: Abilitare entrambi
  - H2: Memoria multimodale
  - H2: Ricerca nella memoria di sessione
  - H2: Risoluzione dei problemi
  - H2: Ulteriori letture
  - H2: Correlati

## concepts/memory.md

- Percorso: /concepts/memory
- Intestazioni:
  - H2: Come funziona
  - H2: Cosa va dove
  - H2: Memorie sensibili alle azioni
  - H2: Impegni dedotti
  - H2: Strumenti di memoria
  - H2: Plugin companion Memory Wiki
  - H2: Ricerca nella memoria
  - H2: Backend di memoria
  - H2: Livello wiki della conoscenza
  - H2: Flush automatico della memoria
  - H2: Dreaming
  - H2: Backfill con grounding e promozione live
  - H2: CLI
  - H2: Ulteriori letture
  - H2: Correlati

## concepts/message-lifecycle-refactor.md

- Percorso: /concepts/message-lifecycle-refactor
- Intestazioni:
  - H2: Problemi
  - H2: Obiettivi
  - H2: Non obiettivi
  - H2: Modello di riferimento
  - H2: Modello core
  - H2: Termini dei messaggi
  - H3: Messaggio
  - H3: Target
  - H3: Relazione
  - H3: Origine
  - H3: Ricevuta
  - H2: Contesto di ricezione
  - H2: Contesto di invio
  - H2: Contesto live
  - H2: Superficie dell'adapter
  - H2: Riduzione dell'SDK pubblico
  - H2: Relazione con l'inbound del canale
  - H2: Guardrail di compatibilità
  - H2: Archiviazione interna
  - H2: Classi di errore
  - H2: Mappatura dei canali
  - H2: Piano di migrazione
  - H3: Fase 1: dominio interno dei messaggi
  - H3: Fase 2: core di invio durevole
  - H3: Fase 3: bridge inbound del canale
  - H3: Fase 4: bridge del dispatcher preparato
  - H3: Fase 5: ciclo di vita live unificato
  - H3: Fase 6: SDK pubblico
  - H3: Fase 7: tutti i mittenti
  - H3: Fase 8: rimuovere la compatibilità con nomi basati su turn
  - H2: Piano di test
  - H2: Domande aperte
  - H2: Criteri di accettazione
  - H2: Correlati

## concepts/messages.md

- Percorso: /concepts/messages
- Intestazioni:
  - H2: Flusso dei messaggi (alto livello)
  - H2: Dedupe inbound
  - H2: Debouncing inbound
  - H2: Sessioni e dispositivi
  - H2: Metadati dei risultati degli strumenti
  - H2: Corpi inbound e contesto della cronologia
  - H2: Accodamento e follow-up
  - H2: Proprietà dell'esecuzione del canale
  - H2: Streaming, suddivisione in chunk e batching
  - H2: Visibilità del ragionamento e token
  - H2: Prefissi, threading e risposte
  - H2: Risposte silenziose
  - H2: Correlati

## concepts/model-failover.md

- Percorso: /concepts/model-failover
- Intestazioni:
  - H2: Flusso runtime
  - H2: Criterio della sorgente di selezione
  - H2: Cache di salto per errori di autenticazione
  - H2: Avvisi di fallback visibili all'utente
  - H2: Archiviazione dell'autenticazione (chiavi + OAuth)
  - H2: ID profilo
  - H2: Ordine di rotazione
  - H3: Persistenza della sessione (cache-friendly)
  - H3: Abbonamento OpenAI Codex più backup con chiave API
  - H2: Cooldown
  - H2: Disabilitazioni per fatturazione
  - H2: Fallback del modello
  - H3: Regole della catena di candidati
  - H3: Quali errori fanno avanzare il fallback
  - H3: Salto per cooldown e comportamento di probe
  - H2: Override di sessione e cambio modello live
  - H2: Osservabilità e riepiloghi degli errori
  - H2: Configurazione correlata

## concepts/model-providers.md

- Percorso: /concepts/model-providers
- Intestazioni:
  - H2: Regole rapide
  - H2: Comportamento dei provider di proprietà del Plugin
  - H2: Rotazione delle chiavi API
  - H2: Plugin provider ufficiali
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: Altre opzioni hosted in stile abbonamento
  - H3: OpenCode
  - H3: Google Gemini (chiave API)
  - H3: Google Vertex e Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Altri Plugin provider inclusi
  - H4: Particolarità utili da conoscere
  - H2: Provider tramite models.providers (URL personalizzato/base)
  - H3: Moonshot AI (Kimi)
  - H3: Coding Kimi
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (internazionale)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: Proxy locali (LM Studio, vLLM, LiteLLM, ecc.)
  - H2: Esempi CLI
  - H2: Correlati

## concepts/models.md

- Percorso: /concepts/models
- Intestazioni:
  - H2: Come funziona la selezione del modello
  - H2: Sorgente di selezione e comportamento di fallback
  - H2: Criterio rapido per i modelli
  - H2: Onboarding (consigliato)
  - H2: Chiavi di configurazione (panoramica)
  - H3: Modifiche sicure all'allowlist
  - H2: "Il modello non è consentito" (e perché le risposte si fermano)
  - H2: Cambiare modello in chat (/model)
  - H2: Comandi CLI
  - H3: models list
  - H3: models status
  - H2: Scansione (modelli gratuiti OpenRouter)
  - H2: Registro dei modelli (models.json)
  - H2: Correlati

## concepts/multi-agent.md

- Percorso: /concepts/multi-agent
- Intestazioni:
  - H2: Che cos'è "un agente"?
  - H2: Percorsi (mappa rapida)
  - H3: Modalità agente singolo (predefinita)
  - H2: Helper agente
  - H2: Avvio rapido
  - H2: Più agenti = più persone, più personalità
  - H2: Ricerca nella memoria QMD tra agenti
  - H2: Un numero WhatsApp, più persone (divisione DM)
  - H2: Regole di routing (come i messaggi scelgono un agente)
  - H2: Più account / numeri di telefono
  - H2: Concetti
  - H2: Esempi di piattaforme
  - H2: Pattern comuni
  - H2: Sandbox per agente e configurazione degli strumenti
  - H2: Correlati

## concepts/oauth.md

- Route: /concepts/oauth
- Intestazioni:
  - H2: Il sink dei token (perché esiste)
  - H2: Archiviazione (dove risiedono i token)
  - H2: Compatibilità con i token legacy di Anthropic
  - H2: Migrazione dalla CLI Claude di Anthropic
  - H2: Scambio OAuth (come funziona l'accesso)
  - H3: setup-token di Anthropic
  - H3: OpenAI Codex (OAuth di ChatGPT)
  - H2: Aggiornamento + scadenza
  - H2: Account multipli (profili) + routing
  - H3: 1) Preferito: agenti separati
  - H3: 2) Avanzato: profili multipli in un solo agente
  - H2: Correlati

## concepts/parallel-specialist-lanes.md

- Route: /concepts/parallel-specialist-lanes
- Intestazioni:
  - H2: Principi fondamentali
  - H2: Implementazione consigliata
  - H3: Fase 1: contratti di lane + lavoro pesante in background
  - H3: Fase 2: controlli di priorità e concorrenza
  - H3: Fase 3: coordinatore / controllore del traffico
  - H2: Modello minimo di contratto di lane
  - H2: Correlati

## concepts/personal-agent-benchmark-pack.md

- Route: /concepts/personal-agent-benchmark-pack
- Intestazioni:
  - H2: Scenari
  - H2: Modello di privacy
  - H2: Estendere il pacchetto

## concepts/presence.md

- Route: /concepts/presence
- Intestazioni:
  - H2: Campi di presenza (cosa viene mostrato)
  - H2: Produttori (da dove proviene la presenza)
  - H3: 1) Voce autonoma del Gateway
  - H3: 2) Connessione WebSocket
  - H4: Perché i comandi CLI una tantum non vengono mostrati
  - H3: 3) beacon system-event
  - H3: 4) Connessioni Node (ruolo: node)
  - H2: Regole di unione + deduplicazione (perché instanceId è importante)
  - H2: TTL e dimensione limitata
  - H2: Avvertenza su remoto/tunnel (IP loopback)
  - H2: Consumatori
  - H3: Scheda Istanze macOS
  - H2: Suggerimenti di debug
  - H2: Correlati

## concepts/progress-drafts.md

- Route: /concepts/progress-drafts
- Intestazioni:
  - H2: Avvio rapido
  - H2: Cosa vedono gli utenti
  - H2: Scegliere una modalità
  - H2: Configurare le etichette
  - H2: Controllare le righe di avanzamento
  - H2: Comportamento dei canali
  - H2: Finalizzazione
  - H2: Risoluzione dei problemi
  - H2: Correlati

## concepts/qa-e2e-automation.md

- Route: /concepts/qa-e2e-automation
- Intestazioni:
  - H2: Superficie dei comandi
  - H2: Flusso operatore
  - H2: Copertura del trasporto live
  - H2: Riferimento QA per Telegram, Discord, Slack e WhatsApp
  - H3: Flag CLI condivisi
  - H3: QA Telegram
  - H3: QA Discord
  - H3: QA Slack
  - H4: Configurazione dell'area di lavoro Slack
  - H3: QA WhatsApp
  - H3: Pool di credenziali Convex
  - H2: Seed supportati dal repo
  - H2: Lane di mock dei provider
  - H2: Adattatori di trasporto
  - H3: Aggiungere un canale
  - H3: Nomi degli helper di scenario
  - H2: Reporting
  - H2: Documenti correlati

## concepts/qa-matrix.md

- Route: /concepts/qa-matrix
- Intestazioni:
  - H2: Avvio rapido
  - H2: Cosa fa la lane
  - H2: CLI
  - H3: Flag comuni
  - H3: Flag dei provider
  - H2: Profili
  - H2: Scenari
  - H2: Variabili d'ambiente
  - H2: Artefatti di output
  - H2: Suggerimenti di triage
  - H2: Contratto di trasporto live
  - H2: Correlati

## concepts/queue-steering.md

- Route: /concepts/queue-steering
- Intestazioni:
  - H2: Confine runtime
  - H2: Modalità
  - H2: Esempio di burst
  - H2: Ambito
  - H2: Debounce
  - H2: Correlati

## concepts/queue.md

- Route: /concepts/queue
- Intestazioni:
  - H2: Perché
  - H2: Come funziona
  - H2: Predefiniti
  - H2: Modalità della coda
  - H2: Opzioni della coda
  - H2: Indirizzamento e streaming
  - H2: Precedenza
  - H2: Override per sessione
  - H2: Ambito e garanzie
  - H2: Risoluzione dei problemi
  - H2: Correlati

## concepts/retry.md

- Route: /concepts/retry
- Intestazioni:
  - H2: Obiettivi
  - H2: Predefiniti
  - H2: Comportamento
  - H3: Provider di modelli
  - H3: Discord
  - H3: Telegram
  - H2: Configurazione
  - H2: Note
  - H2: Correlati

## concepts/session-pruning.md

- Route: /concepts/session-pruning
- Intestazioni:
  - H2: Perché è importante
  - H2: Come funziona
  - H2: Pulizia delle immagini legacy
  - H2: Predefiniti intelligenti
  - H2: Abilitare o disabilitare
  - H2: Pruning rispetto a Compaction
  - H2: Ulteriori letture
  - H2: Correlati

## concepts/session-tool.md

- Route: /concepts/session-tool
- Intestazioni:
  - H2: Strumenti disponibili
  - H2: Elencare e leggere le sessioni
  - H2: Inviare messaggi tra sessioni
  - H2: Helper di stato e orchestrazione
  - H2: Generare sottoagenti
  - H2: Visibilità
  - H2: Ulteriori letture
  - H2: Correlati

## concepts/session.md

- Route: /concepts/session
- Intestazioni:
  - H2: Come vengono instradati i messaggi
  - H2: Isolamento dei DM
  - H3: Canali collegati al Dock
  - H2: Ciclo di vita della sessione
  - H2: Dove risiede lo stato
  - H2: Manutenzione della sessione
  - H2: Ispezionare le sessioni
  - H2: Ulteriori letture
  - H2: Correlati

## concepts/soul.md

- Route: /concepts/soul
- Intestazioni:
  - H2: Cosa appartiene a SOUL.md
  - H2: Perché funziona
  - H2: Il prompt Molty
  - H2: Come si presenta un buon risultato
  - H2: Un avvertimento
  - H2: Correlati

## concepts/streaming.md

- Route: /concepts/streaming
- Intestazioni:
  - H2: Streaming a blocchi (messaggi di canale)
  - H3: Consegna dei media con streaming a blocchi
  - H2: Algoritmo di suddivisione in chunk (limiti bassi/alti)
  - H2: Coalescenza (unione dei blocchi in streaming)
  - H2: Ritmo simile a quello umano tra i blocchi
  - H2: "Chunk in streaming o tutto"
  - H2: Modalità di streaming dell'anteprima
  - H3: Mappatura dei canali
  - H3: Comportamento runtime
  - H3: Aggiornamenti di anteprima dell'avanzamento degli strumenti
  - H3: Lane di avanzamento del commentary
  - H2: Correlati

## concepts/system-prompt.md

- Route: /concepts/system-prompt
- Intestazioni:
  - H2: Struttura
  - H2: Modalità del prompt
  - H2: Snapshot del prompt
  - H2: Iniezione del bootstrap dell'area di lavoro
  - H2: Gestione del tempo
  - H2: Skills
  - H2: Documentazione
  - H2: Correlati

## concepts/timezone.md

- Route: /concepts/timezone
- Intestazioni:
  - H2: Tre superfici del fuso orario
  - H2: Impostare il fuso orario dell'utente
  - H2: Quando eseguire l'override
  - H2: Correlati

## concepts/typebox.md

- Route: /concepts/typebox
- Intestazioni:
  - H2: Modello mentale (30 secondi)
  - H2: Dove risiedono gli schemi
  - H2: Pipeline corrente
  - H2: Come gli schemi vengono usati a runtime
  - H2: Frame di esempio
  - H2: Client minimo (Node.js)
  - H2: Esempio guidato: aggiungere un metodo end-to-end
  - H2: Comportamento di codegen Swift
  - H2: Versionamento + compatibilità
  - H2: Pattern e convenzioni degli schemi
  - H2: JSON dello schema live
  - H2: Quando modifichi gli schemi
  - H2: Correlati

## concepts/typing-indicators.md

- Route: /concepts/typing-indicators
- Intestazioni:
  - H2: Predefiniti
  - H2: Modalità
  - H2: Configurazione
  - H2: Note
  - H2: Correlati

## concepts/usage-tracking.md

- Route: /concepts/usage-tracking
- Intestazioni:
  - H2: Che cos'è
  - H2: Dove viene mostrato
  - H2: Modalità predefinita del footer di utilizzo
  - H3: Tre stati distinti della sessione
  - H3: Precedenza
  - H3: Reimpostare rispetto a disattivare
  - H3: Comportamento dell'interruttore
  - H3: Config
  - H2: Footer completo /usage personalizzato
  - H3: Forma
  - H3: Percorsi dei contratti
  - H3: Verbi
  - H3: Forme dei pezzi
  - H3: Esempio
  - H2: Provider + credenziali
  - H2: Correlati

## date-time.md

- Route: /date-time
- Intestazioni:
  - H2: Envelope dei messaggi (locali per impostazione predefinita)
  - H3: Esempi
  - H2: Prompt di sistema: data e ora correnti
  - H2: Righe degli eventi di sistema (locali per impostazione predefinita)
  - H3: Configurare fuso orario utente + formato
  - H2: Rilevamento del formato orario (automatico)
  - H2: Payload degli strumenti + connettori (ora grezza del provider + campi normalizzati)
  - H2: Documenti correlati

## debug/node-issue.md

- Route: /debug/node-issue
- Intestazioni:
  - H1: Crash Node + tsx "\\name is not a function"
  - H2: Riepilogo
  - H2: Ambiente
  - H2: Riproduzione (solo Node)
  - H2: Riproduzione minima nel repo
  - H2: Controllo della versione di Node
  - H2: Note / ipotesi
  - H2: Cronologia delle regressioni
  - H2: Soluzioni alternative
  - H2: Riferimenti
  - H2: Passi successivi
  - H2: Correlati

## diagnostics/flags.md

- Route: /diagnostics/flags
- Intestazioni:
  - H2: Come funziona
  - H2: Abilitare tramite config
  - H2: Override env (una tantum)
  - H2: Flag di profilazione
  - H2: Artefatti della timeline
  - H2: Dove vanno i log
  - H2: Estrarre i log
  - H2: Note
  - H2: Correlati

## gateway/authentication.md

- Route: /gateway/authentication
- Intestazioni:
  - H2: Configurazione consigliata (chiave API, qualsiasi provider)
  - H2: Anthropic: compatibilità con CLI Claude e token
  - H2: Nota su Anthropic
  - H2: Controllare lo stato di autenticazione del modello
  - H2: Comportamento di rotazione della chiave API (gateway)
  - H2: Rimuovere l'autenticazione del provider mentre il gateway è in esecuzione
  - H2: Controllare quale credenziale viene usata
  - H3: OpenAI e id openai-codex legacy
  - H3: Durante l'accesso (CLI)
  - H3: Per sessione (comando chat)
  - H3: Per agente (override CLI)
  - H2: Risoluzione dei problemi
  - H3: "Nessuna credenziale trovata"
  - H3: Token in scadenza/scaduto
  - H2: Correlati

## gateway/background-process.md

- Route: /gateway/background-process
- Intestazioni:
  - H2: strumento exec
  - H2: Bridging dei processi figlio
  - H2: strumento process
  - H2: Esempi
  - H2: Correlati

## gateway/bonjour.md

- Route: /gateway/bonjour
- Intestazioni:
  - H2: Bonjour wide-area (DNS-SD unicast) su Tailscale
  - H3: Config Gateway (consigliata)
  - H3: Configurazione una tantum del server DNS (host gateway)
  - H3: Impostazioni DNS di Tailscale
  - H3: Sicurezza del listener Gateway (consigliata)
  - H2: Cosa annuncia
  - H2: Tipi di servizio
  - H2: Chiavi TXT (suggerimenti non segreti)
  - H2: Debug su macOS
  - H2: Debug nei log del Gateway
  - H2: Debug sul nodo iOS
  - H2: Quando abilitare Bonjour
  - H2: Quando disabilitare Bonjour
  - H2: Problemi comuni di Docker
  - H2: Risoluzione dei problemi di Bonjour disabilitato
  - H2: Modalità di errore comuni
  - H2: Nomi di istanza con escape (\032)
  - H2: Abilitazione / disabilitazione / configurazione
  - H2: Documenti correlati

## gateway/bridge-protocol.md

- Route: /gateway/bridge-protocol
- Intestazioni:
  - H2: Perché esisteva
  - H2: Trasporto
  - H2: Handshake + pairing
  - H2: Frame
  - H2: Eventi del ciclo di vita exec
  - H2: Uso storico della tailnet
  - H2: Versionamento
  - H2: Correlati

## gateway/cli-backends.md

- Route: /gateway/cli-backends
- Intestazioni:
  - H2: Avvio rapido per principianti
  - H2: Usarlo come fallback
  - H2: Panoramica della configurazione
  - H3: Configurazione di esempio
  - H2: Come funziona
  - H2: Sessioni
  - H2: Preludio di fallback dalle sessioni claude-cli
  - H2: Immagini (pass-through)
  - H2: Input / output
  - H2: Predefiniti (di proprietà del plugin)
  - H2: Predefiniti di proprietà del plugin
  - H2: Proprietà della Compaction nativa
  - H2: Overlay MCP del bundle
  - H2: Limite della cronologia di reseed
  - H2: Limitazioni
  - H2: Risoluzione dei problemi
  - H2: Correlati

## gateway/config-agents.md

- Route: /gateway/config-agents
- Intestazioni:
  - H2: Predefiniti degli agenti
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Override del profilo bootstrap per agente
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: Mappa di proprietà del budget di contesto
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: Policy runtime
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Streaming a blocchi
  - H3: Indicatori di digitazione
  - H3: agents.defaults.sandbox
  - H3: agents.list (override per agente)
  - H2: Routing multi-agente
  - H3: Campi di corrispondenza del binding
  - H3: Profili di accesso per agente
  - H2: Sessione
  - H2: Messaggi
  - H3: Prefisso della risposta
  - H3: Reazione di conferma
  - H3: Debounce in ingresso
  - H3: TTS (sintesi vocale)
  - H2: Talk
  - H2: Correlati

## gateway/config-channels.md

- Route: /gateway/config-channels
- Titoli:
  - H2: Canali
  - H3: Accesso a DM e gruppi
  - H3: Override del modello per canale
  - H3: Impostazioni predefinite del canale e Heartbeat
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: Multi-account (tutti i canali)
  - H3: Altri canali Plugin
  - H3: Limitazione tramite menzione nelle chat di gruppo
  - H4: Limiti della cronologia dei DM
  - H4: Modalità chat con sé stessi
  - H3: Comandi (gestione dei comandi chat)
  - H2: Correlati

## gateway/config-tools.md

- Route: /gateway/config-tools
- Titoli:
  - H2: Strumenti
  - H3: Profili degli strumenti
  - H3: Gruppi di strumenti
  - H3: Strumenti MCP e Plugin nei criteri degli strumenti sandbox
  - H3: tools.codeMode
  - H3: tools.allow / tools.deny
  - H3: tools.byProvider
  - H3: tools.toolsBySender
  - H3: tools.elevated
  - H3: tools.exec
  - H3: tools.loopDetection
  - H3: tools.web
  - H3: tools.media
  - H3: tools.agentToAgent
  - H3: tools.sessions
  - H3: tools.sessionsspawn
  - H3: tools.experimental
  - H3: agents.defaults.subagents
  - H2: Provider personalizzati e URL di base
  - H3: Dettagli del campo provider
  - H3: Esempi di provider
  - H2: Correlati

## gateway/configuration-examples.md

- Route: /gateway/configuration-examples
- Titoli:
  - H2: Avvio rapido
  - H3: Minimo assoluto
  - H3: Configurazione iniziale consigliata
  - H2: Esempio esteso (opzioni principali)
  - H3: Repository Skills gemello collegato con symlink
  - H2: Schemi comuni
  - H3: Baseline Skills condivisa con un override
  - H3: Configurazione multipiattaforma
  - H3: Approvazione automatica della rete di nodi attendibili
  - H3: Modalità DM sicura (posta in arrivo condivisa / DM multiutente)
  - H3: Chiave API Anthropic + fallback MiniMax
  - H3: Bot di lavoro (accesso limitato)
  - H3: Solo modelli locali
  - H2: Suggerimenti
  - H2: Correlati

## gateway/configuration-reference.md

- Route: /gateway/configuration-reference
- Titoli:
  - H2: Canali
  - H2: Impostazioni predefinite degli agenti, multi-agent, sessioni e messaggi
  - H2: Strumenti e provider personalizzati
  - H2: Modelli
  - H2: MCP
  - H2: Skills
  - H2: Plugin
  - H3: Configurazione del Plugin harness Codex
  - H2: Impegni
  - H2: Browser
  - H2: UI
  - H2: Gateway
  - H3: Endpoint compatibili con OpenAI
  - H3: Isolamento multi-istanza
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Hook
  - H3: Integrazione Gmail
  - H2: Host del Plugin Canvas
  - H2: Rilevamento
  - H3: mDNS (Bonjour)
  - H3: Ad ampio raggio (DNS-SD)
  - H2: Ambiente
  - H3: env (variabili d'ambiente inline)
  - H3: Sostituzione delle variabili d'ambiente
  - H2: Segreti
  - H3: SecretRef
  - H3: Superficie delle credenziali supportata
  - H3: Configurazione dei provider di segreti
  - H2: Archiviazione auth
  - H3: auth.cooldowns
  - H2: Logging
  - H2: Diagnostica
  - H2: Aggiornamento
  - H2: ACP
  - H2: CLI
  - H2: Procedura guidata
  - H2: Identità
  - H2: Bridge (legacy, rimosso)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Variabili del template del modello media
  - H2: Include di configurazione ($include)
  - H2: Correlati

## gateway/configuration.md

- Route: /gateway/configuration
- Titoli:
  - H2: Configurazione minima
  - H2: Modifica della configurazione
  - H2: Validazione rigorosa
  - H2: Attività comuni
  - H2: Ricaricamento a caldo della configurazione
  - H3: Modalità di ricaricamento
  - H3: Cosa si applica a caldo e cosa richiede un riavvio
  - H3: Pianificazione del ricaricamento
  - H2: RPC di configurazione (aggiornamenti programmatici)
  - H2: Variabili d'ambiente
  - H2: Riferimento completo
  - H2: Correlati

## gateway/diagnostics.md

- Route: /gateway/diagnostics
- Titoli:
  - H2: Avvio rapido
  - H2: Comando chat
  - H2: Cosa contiene l'esportazione
  - H2: Modello di privacy
  - H2: Registratore di stabilità
  - H2: Opzioni utili
  - H2: Disattiva la diagnostica
  - H2: Correlati

## gateway/discovery.md

- Route: /gateway/discovery
- Titoli:
  - H2: Termini
  - H2: Perché manteniamo sia diretto sia SSH
  - H2: Input di rilevamento (come i client scoprono dov'è il gateway)
  - H3: 1) Rilevamento Bonjour / DNS-SD
  - H4: Dettagli del beacon del servizio
  - H3: 2) Tailnet (tra reti)
  - H3: 3) Destinazione manuale / SSH
  - H2: Selezione del trasporto (criterio client)
  - H2: Associazione + auth (trasporto diretto)
  - H2: Responsabilità per componente
  - H2: Correlati

## gateway/doctor.md

- Route: /gateway/doctor
- Titoli:
  - H2: Avvio rapido
  - H3: Modalità headless e automazione
  - H2: Modalità lint di sola lettura
  - H2: Cosa fa (riepilogo)
  - H2: Backfill e reset dell'interfaccia Dreaming
  - H2: Comportamento dettagliato e motivazione
  - H2: Correlati

## gateway/external-apps.md

- Route: /gateway/external-apps
- Titoli:
  - H2: Cosa è disponibile oggi
  - H2: Percorso consigliato
  - H2: Codice dell'app e codice del Plugin
  - H2: Correlati

## gateway/gateway-lock.md

- Route: /gateway/gateway-lock
- Titoli:
  - H2: Perché
  - H2: Meccanismo
  - H2: Superficie di errore
  - H2: Note operative
  - H2: Correlati

## gateway/health.md

- Route: /gateway/health
- Titoli:
  - H2: Controlli rapidi
  - H2: Diagnostica approfondita
  - H2: Configurazione del monitor di integrità
  - H2: Monitoraggio dell'uptime
  - H3: Esempi di configurazione del servizio di monitoraggio
  - H2: Quando qualcosa non funziona
  - H2: Comando "health" dedicato
  - H2: Correlati

## gateway/heartbeat.md

- Route: /gateway/heartbeat
- Titoli:
  - H2: Avvio rapido (principiante)
  - H2: Impostazioni predefinite
  - H2: A cosa serve il prompt Heartbeat
  - H2: Contratto di risposta
  - H2: Configurazione
  - H3: Ambito e precedenza
  - H3: Heartbeat per agente
  - H3: Esempio di ore attive
  - H3: Configurazione 24/7
  - H3: Esempio multi-account
  - H3: Note sui campi
  - H2: Comportamento di consegna
  - H2: Controlli di visibilità
  - H3: Cosa fa ogni flag
  - H3: Esempi per canale e per account
  - H3: Schemi comuni
  - H2: HEARTBEAT.md (facoltativo)
  - H3: blocchi tasks:
  - H3: L'agente può aggiornare HEARTBEAT.md?
  - H2: Riattivazione manuale (su richiesta)
  - H2: Consegna del ragionamento (facoltativa)
  - H2: Consapevolezza dei costi
  - H2: Overflow del contesto dopo Heartbeat
  - H2: Correlati

## gateway/index.md

- Route: /gateway
- Titoli:
  - H2: Avvio locale in 5 minuti
  - H2: Modello di runtime
  - H2: Endpoint compatibili con OpenAI
  - H3: Precedenza di porta e bind
  - H3: Modalità di ricaricamento a caldo
  - H2: Set di comandi operatore
  - H2: Gateway multipli (stesso host)
  - H2: Accesso remoto
  - H2: Supervisione e ciclo di vita del servizio
  - H2: Percorso rapido del profilo dev
  - H2: Riferimento rapido del protocollo (vista operatore)
  - H2: Controlli operativi
  - H3: Liveness
  - H3: Readiness
  - H3: Recupero delle lacune
  - H2: Firme di errore comuni
  - H2: Garanzie di sicurezza
  - H2: Correlati

## gateway/local-model-services.md

- Route: /gateway/local-model-services
- Titoli:
  - H2: Come funziona
  - H2: Forma della configurazione
  - H2: Campi
  - H2: Esempio Inferrs
  - H2: Esempio ds4
  - H2: Note operative
  - H2: Correlati

## gateway/local-models.md

- Route: /gateway/local-models
- Titoli:
  - H2: Requisito hardware minimo
  - H2: Scegli un backend
  - H2: Consigliato: LM Studio + modello locale grande (Responses API)
  - H3: Configurazione ibrida: primario hosted, fallback locale
  - H3: Local-first con rete di sicurezza hosted
  - H3: Hosting regionale / routing dei dati
  - H2: Altri proxy locali compatibili con OpenAI
  - H2: Backend più piccoli o più rigorosi
  - H2: Risoluzione dei problemi
  - H2: Correlati

## gateway/logging.md

- Route: /gateway/logging
- Titoli:
  - H1: Logging
  - H2: Logger basato su file
  - H2: Acquisizione della console
  - H2: Redazione
  - H2: Log WebSocket del Gateway
  - H3: Stile dei log WS
  - H2: Formattazione della console (logging del sottosistema)
  - H2: Correlati

## gateway/multiple-gateways.md

- Route: /gateway/multiple-gateways
- Titoli:
  - H2: Migliore configurazione consigliata
  - H2: Avvio rapido Rescue-Bot
  - H2: Perché funziona
  - H2: Cosa cambia --profile rescue onboard
  - H2: Configurazione generale multi-gateway
  - H2: Checklist di isolamento
  - H2: Mappatura delle porte (derivata)
  - H2: Note su Browser/CDP (errore comune)
  - H2: Esempio env manuale
  - H2: Controlli rapidi
  - H2: Correlati

## gateway/network-model.md

- Route: /gateway/network-model
- Titoli:
  - H2: Correlati

## gateway/openai-http-api.md

- Route: /gateway/openai-http-api
- Titoli:
  - H2: Autenticazione
  - H2: Perimetro di sicurezza (importante)
  - H2: Quando usare questo endpoint
  - H2: Contratto del modello agent-first
  - H2: Abilitazione dell'endpoint
  - H2: Disabilitazione dell'endpoint
  - H2: Comportamento della sessione
  - H2: Perché questa superficie è importante
  - H2: Elenco dei modelli e routing degli agenti
  - H2: Streaming (SSE)
  - H2: Contratto degli strumenti chat
  - H3: Campi di richiesta supportati
  - H3: Varianti non supportate
  - H3: Forma della risposta dello strumento non in streaming
  - H3: Forma della risposta dello strumento in streaming
  - H3: Ciclo di follow-up dello strumento
  - H2: Configurazione rapida di Open WebUI
  - H2: Esempi
  - H2: Correlati

## gateway/openresponses-http-api.md

- Route: /gateway/openresponses-http-api
- Titoli:
  - H2: Autenticazione, sicurezza e routing
  - H2: Comportamento della sessione
  - H2: Forma della richiesta (supportata)
  - H2: Elementi (input)
  - H3: message
  - H3: functioncalloutput (strumenti basati su turni)
  - H3: reasoning e itemreference
  - H2: Strumenti (strumenti funzione lato client)
  - H2: Immagini (inputimage)
  - H2: File (inputfile)
  - H2: Limiti file + immagini (configurazione)
  - H2: Streaming (SSE)
  - H2: Utilizzo
  - H2: Errori
  - H2: Esempi
  - H2: Correlati

## gateway/openshell.md

- Route: /gateway/openshell
- Titoli:
  - H2: Prerequisiti
  - H2: Avvio rapido
  - H2: Modalità workspace
  - H3: mirror
  - H3: remote
  - H3: Scelta di una modalità
  - H2: Riferimento di configurazione
  - H2: Esempi
  - H3: Configurazione remota minima
  - H3: Modalità mirror con GPU
  - H3: OpenShell per agente con Gateway personalizzato
  - H2: Gestione del ciclo di vita
  - H3: Quando ricreare
  - H2: Hardening della sicurezza
  - H2: Limitazioni attuali
  - H2: Come funziona
  - H2: Correlati

## gateway/opentelemetry.md

- Route: /gateway/opentelemetry
- Titoli:
  - H2: Come si integra il tutto
  - H2: Avvio rapido
  - H2: Segnali esportati
  - H2: Riferimento di configurazione
  - H3: Variabili d'ambiente
  - H2: Privacy e acquisizione dei contenuti
  - H2: Campionamento e flush
  - H2: Metriche esportate
  - H3: Utilizzo del modello
  - H3: Flusso dei messaggi
  - H3: Talk
  - H3: Code e sessioni
  - H3: Telemetria di liveness della sessione
  - H3: Ciclo di vita dell'harness
  - H3: Esecuzione degli strumenti
  - H3: Exec
  - H3: Interni della diagnostica (memoria e ciclo degli strumenti)
  - H2: Span esportati
  - H2: Catalogo degli eventi diagnostici
  - H2: Senza un exporter
  - H2: Disattiva
  - H2: Correlati

## gateway/operator-scopes.md

- Route: /gateway/operator-scopes
- Titoli:
  - H2: Ruoli
  - H2: Livelli di ambito
  - H2: L'ambito del metodo è solo il primo gate
  - H2: Approvazioni di associazione dei dispositivi
  - H2: Approvazioni di associazione dei nodi
  - H2: Auth con segreto condiviso

## gateway/pairing.md

- Route: /gateway/pairing
- Titoli:
  - H2: Concetti
  - H2: Come funziona l'associazione
  - H2: Flusso di lavoro CLI (adatto a headless)
  - H2: Superficie API (protocollo Gateway)
  - H2: Gate dei comandi Node (2026.3.31+)
  - H2: Confini di attendibilità degli eventi Node (2026.3.31+)
  - H2: Approvazione automatica (app macOS)
  - H2: Approvazione automatica dei dispositivi trusted-CIDR
  - H2: Approvazione automatica dell'upgrade dei metadati
  - H2: Helper di associazione QR
  - H2: Località e header inoltrati
  - H2: Archiviazione (locale, privata)
  - H2: Comportamento del trasporto
  - H2: Correlati

## gateway/prometheus.md

- Route: /gateway/prometheus
- Titoli:
  - H2: Avvio rapido
  - H2: Metriche esportate
  - H2: Criterio per le etichette
  - H2: Ricette PromQL
  - H2: Scelta tra Prometheus ed esportazione OpenTelemetry
  - H2: Risoluzione dei problemi
  - H2: Correlati

## gateway/protocol.md

- Route: /gateway/protocol
- Titoli:
  - H2: Trasporto
  - H2: Handshake (connessione)
  - H3: Esempio Node
  - H2: Framing
  - H2: Ruoli + ambiti
  - H3: Ruoli
  - H3: Ambiti (operatore)
  - H3: Caps/comandi/autorizzazioni (nodo)
  - H2: Presenza
  - H3: Evento di attività in background del nodo
  - H2: Ambito degli eventi broadcast
  - H2: Famiglie comuni di metodi RPC
  - H3: Famiglie comuni di eventi
  - H3: Metodi helper del nodo
  - H3: RPC del registro attività
  - H3: Metodi helper dell'operatore
  - H3: viste models.list
  - H2: Approvazioni exec
  - H2: Fallback della consegna agenti
  - H2: Versionamento
  - H3: Costanti client
  - H2: Auth
  - H2: Identità dispositivo + associazione
  - H3: Diagnostica della migrazione auth del dispositivo
  - H2: TLS + pinning
  - H2: Ambito
  - H2: Correlati

## gateway/remote-gateway-readme.md

- Percorso: /gateway/remote-gateway-readme
- Titoli:
  - H1: Esecuzione di OpenClaw.app con un Gateway remoto
  - H2: Panoramica
  - H2: Configurazione rapida
  - H3: Passaggio 1: aggiungere la configurazione SSH
  - H3: Passaggio 2: copiare la chiave SSH
  - H3: Passaggio 3: configurare l'autenticazione del Gateway remoto
  - H3: Passaggio 4: avviare il tunnel SSH
  - H3: Passaggio 5: riavviare OpenClaw.app
  - H2: Avvio automatico del tunnel all'accesso
  - H3: Creare il file PLIST
  - H3: Caricare il Launch Agent
  - H2: Risoluzione dei problemi
  - H2: Come funziona
  - H2: Correlati

## gateway/remote.md

- Percorso: /gateway/remote
- Titoli:
  - H2: L'idea di base
  - H2: Configurazioni VPN e tailnet comuni
  - H3: Gateway sempre attivo nella tua tailnet
  - H3: Il desktop di casa esegue il Gateway
  - H3: Il laptop esegue il Gateway
  - H2: Flusso dei comandi (cosa viene eseguito dove)
  - H2: Tunnel SSH (CLI + strumenti)
  - H2: Impostazioni predefinite remote della CLI
  - H2: Precedenza delle credenziali
  - H2: Accesso remoto alla UI chat
  - H2: Modalità remota dell'app macOS
  - H2: Regole di sicurezza (remoto/VPN)
  - H3: macOS: tunnel SSH persistente tramite LaunchAgent
  - H4: Passaggio 1: aggiungere la configurazione SSH
  - H4: Passaggio 2: copiare la chiave SSH (una tantum)
  - H4: Passaggio 3: configurare il token del Gateway
  - H4: Passaggio 4: creare il LaunchAgent
  - H4: Passaggio 5: caricare il LaunchAgent
  - H4: Risoluzione dei problemi
  - H2: Correlati

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Percorso: /gateway/sandbox-vs-tool-policy-vs-elevated
- Titoli:
  - H2: Debug rapido
  - H2: Sandbox: dove vengono eseguiti gli strumenti
  - H3: Bind mount (controllo rapido di sicurezza)
  - H2: Criterio degli strumenti: quali strumenti esistono/sono richiamabili
  - H3: Gruppi di strumenti (abbreviazioni)
  - H2: Elevated: "esecuzione sull'host" solo exec
  - H2: Correzioni comuni per la "gabbia sandbox"
  - H3: "Strumento X bloccato dal criterio degli strumenti della sandbox"
  - H3: "Pensavo fosse main, perché è in sandbox?"
  - H2: Correlati

## gateway/sandboxing.md

- Percorso: /gateway/sandboxing
- Titoli:
  - H2: Cosa viene messo in sandbox
  - H2: Modalità
  - H2: Ambito
  - H2: Backend
  - H3: Scelta di un backend
  - H3: Backend Docker
  - H3: Backend SSH
  - H3: Backend OpenShell
  - H4: Modalità workspace
  - H4: Ciclo di vita di OpenShell
  - H2: Accesso al workspace
  - H2: Bind mount personalizzati
  - H2: Immagini e configurazione
  - H2: setupCommand (configurazione del container una tantum)
  - H2: Criterio degli strumenti e vie di uscita
  - H2: Override multi-agente
  - H2: Esempio minimo di abilitazione
  - H2: Correlati

## gateway/secrets-plan-contract.md

- Percorso: /gateway/secrets-plan-contract
- Titoli:
  - H2: Forma del file di piano
  - H2: Upsert ed eliminazioni del provider
  - H2: Ambito di destinazione supportato
  - H2: Comportamento del tipo di destinazione
  - H2: Regole di validazione dei percorsi
  - H2: Comportamento in caso di errore
  - H2: Comportamento del consenso per il provider exec
  - H2: Note su runtime e ambito di audit
  - H2: Controlli dell'operatore
  - H2: Documentazione correlata

## gateway/secrets.md

- Percorso: /gateway/secrets
- Titoli:
  - H2: Obiettivi e modello runtime
  - H2: Confine di accesso degli agenti
  - H2: Filtraggio della superficie attiva
  - H2: Diagnostica della superficie di autenticazione del Gateway
  - H2: Preflight del riferimento di onboarding
  - H2: Contratto SecretRef
  - H2: Configurazione del provider
  - H2: Chiavi API basate su file
  - H2: Esempi di integrazione exec
  - H2: Variabili d'ambiente del server MCP
  - H2: Materiale di autenticazione SSH della sandbox
  - H2: Superficie delle credenziali supportata
  - H2: Comportamento richiesto e precedenza
  - H2: Trigger di attivazione
  - H2: Segnali degradati e ripristinati
  - H2: Risoluzione del percorso dei comandi
  - H2: Flusso di audit e configurazione
  - H2: Criterio di sicurezza unidirezionale
  - H2: Note sulla compatibilità dell'autenticazione legacy
  - H2: Nota sulla UI web
  - H2: Correlati

## gateway/security/audit-checks.md

- Percorso: /gateway/security/audit-checks
- Titoli:
  - H2: Correlati

## gateway/security/exposure-runbook.md

- Percorso: /gateway/security/exposure-runbook
- Titoli:
  - H2: Scegliere il modello di esposizione
  - H2: Inventario preliminare
  - H2: Controlli di baseline
  - H2: Baseline minima sicura
  - H2: Esposizione di DM e gruppi
  - H2: Controlli del reverse proxy
  - H2: Revisione di strumenti e sandbox
  - H2: Validazione post-modifica
  - H2: Piano di rollback
  - H2: Checklist di revisione

## gateway/security/index.md

- Percorso: /gateway/security
- Titoli:
  - H2: Prima l'ambito: modello di sicurezza dell'assistente personale
  - H2: Controllo rapido: openclaw security audit
  - H3: Blocco delle dipendenze del pacchetto pubblicato
  - H3: Distribuzione e attendibilità dell'host
  - H3: Operazioni sicure sui file
  - H3: Workspace Slack condiviso: rischio reale
  - H3: Agente condiviso in azienda: modello accettabile
  - H2: Concetto di attendibilità di Gateway e nodo
  - H2: Matrice dei confini di attendibilità
  - H2: Non vulnerabilità per progettazione
  - H2: Baseline rafforzata in 60 secondi
  - H2: Regola rapida per inbox condivisa
  - H2: Modello di visibilità del contesto
  - H2: Cosa controlla l'audit (alto livello)
  - H2: Mappa di archiviazione delle credenziali
  - H2: Checklist di audit di sicurezza
  - H2: Glossario dell'audit di sicurezza
  - H2: Control UI via HTTP
  - H2: Riepilogo dei flag insicuri o pericolosi
  - H2: Configurazione del reverse proxy
  - H2: Note su HSTS e origine
  - H2: I log delle sessioni locali risiedono su disco
  - H2: Esecuzione del nodo (system.run)
  - H2: Skills dinamiche (watcher / nodi remoti)
  - H2: Il modello di minaccia
  - H2: Concetto chiave: controllo degli accessi prima dell'intelligenza
  - H2: Modello di autorizzazione dei comandi
  - H2: Rischio degli strumenti del piano di controllo
  - H2: Plugin
  - H2: Modello di accesso ai DM: pairing, allowlist, aperto, disabilitato
  - H2: Isolamento delle sessioni DM (modalità multiutente)
  - H3: Modalità DM sicura (consigliata)
  - H2: Allowlist per DM e gruppi
  - H2: Prompt injection (cos'è, perché è importante)
  - H2: Sanitizzazione dei token speciali dei contenuti esterni
  - H2: Flag di bypass dei contenuti esterni non sicuri
  - H3: La prompt injection non richiede DM pubblici
  - H3: Backend LLM self-hosted
  - H3: Forza del modello (nota di sicurezza)
  - H2: Reasoning e output dettagliato nei gruppi
  - H2: Esempi di rafforzamento della configurazione
  - H3: Permessi dei file
  - H3: Esposizione di rete (bind, porta, firewall)
  - H3: Pubblicazione delle porte Docker con UFW
  - H3: Discovery mDNS/Bonjour
  - H3: Bloccare il WebSocket del Gateway (autenticazione locale)
  - H3: Header di identità di Tailscale Serve
  - H3: Controllo del browser tramite host nodo (consigliato)
  - H3: Segreti su disco
  - H3: File .env del workspace
  - H3: Log e trascrizioni (redazione e conservazione)
  - H3: DM: pairing per impostazione predefinita
  - H3: Gruppi: richiedere la menzione ovunque
  - H3: Numeri separati (WhatsApp, Signal, Telegram)
  - H3: Modalità sola lettura (tramite sandbox e strumenti)
  - H3: Baseline sicura (copia/incolla)
  - H2: Sandboxing (consigliato)
  - H3: Guardrail per la delega a sub-agenti
  - H2: Rischi del controllo del browser
  - H3: Criterio SSRF del browser (rigoroso per impostazione predefinita)
  - H2: Profili di accesso per agente (multi-agente)
  - H3: Esempio: accesso completo (nessuna sandbox)
  - H3: Esempio: strumenti in sola lettura + workspace in sola lettura
  - H3: Esempio: nessun accesso a filesystem/shell (messaggistica provider consentita)
  - H2: Risposta agli incidenti
  - H3: Contenere
  - H3: Ruotare (presumere compromissione se i segreti sono trapelati)
  - H3: Audit
  - H3: Raccogliere per un report
  - H2: Scansione dei segreti
  - H2: Segnalazione di problemi di sicurezza

## gateway/security/secure-file-operations.md

- Percorso: /gateway/security/secure-file-operations
- Titoli:
  - H2: Predefinito: nessun helper Python
  - H2: Cosa rimane protetto senza Python
  - H2: Cosa aggiunge Python
  - H2: Linee guida per Plugin e core

## gateway/security/shrinkwrap.md

- Percorso: /gateway/security/shrinkwrap
- Titoli:
  - H2: La versione semplice
  - H2: Perché OpenClaw lo usa
  - H2: Dettagli tecnici

## gateway/tailscale.md

- Percorso: /gateway/tailscale
- Titoli:
  - H2: Modalità
  - H2: Autenticazione
  - H2: Esempi di configurazione
  - H3: Solo Tailnet (Serve)
  - H3: Solo Tailnet (bind all'IP Tailnet)
  - H3: Internet pubblico (Funnel + password condivisa)
  - H2: Esempi CLI
  - H2: Note
  - H2: Controllo del browser (Gateway remoto + browser locale)
  - H2: Prerequisiti + limiti di Tailscale
  - H2: Scopri di più
  - H2: Correlati

## gateway/tools-invoke-http-api.md

- Percorso: /gateway/tools-invoke-http-api
- Titoli:
  - H2: Autenticazione
  - H2: Confine di sicurezza (importante)
  - H2: Corpo della richiesta
  - H2: Comportamento di criterio + routing
  - H2: Risposte
  - H2: Esempio
  - H2: Correlati

## gateway/troubleshooting.md

- Percorso: /gateway/troubleshooting
- Titoli:
  - H2: Scala dei comandi
  - H2: Dopo un aggiornamento
  - H2: Installazioni split brain e guardia per configurazioni più recenti
  - H2: Mancata corrispondenza del protocollo dopo il rollback
  - H2: Symlink della skill ignorato come escape di percorso
  - H2: Anthropic 429: utilizzo aggiuntivo richiesto per contesto lungo
  - H2: Risposte upstream 403 bloccate
  - H2: Il backend locale compatibile con OpenAI supera le sonde dirette ma le esecuzioni dell'agente falliscono
  - H2: Nessuna risposta
  - H2: Connettività della Control UI della dashboard
  - H3: Mappa rapida dei codici di dettaglio dell'autenticazione
  - H2: Servizio Gateway non in esecuzione
  - H2: Il gateway macOS smette silenziosamente di rispondere, poi riprende quando tocchi la dashboard
  - H2: Il Gateway termina durante un uso elevato della memoria
  - H2: Il Gateway ha rifiutato una configurazione non valida
  - H2: Avvisi della sonda Gateway
  - H2: Canale connesso, messaggi non in transito
  - H2: Consegna di Cron e Heartbeat
  - H2: Nodo associato, strumento non riuscito
  - H2: Strumento browser non riuscito
  - H2: Se hai aggiornato e qualcosa si è rotto improvvisamente
  - H2: Correlati

## gateway/trusted-proxy-auth.md

- Percorso: /gateway/trusted-proxy-auth
- Titoli:
  - H2: Quando usarlo
  - H2: Quando NON usarlo
  - H2: Come funziona
  - H2: Comportamento di pairing della Control UI
  - H2: Configurazione
  - H3: Riferimento di configurazione
  - H2: Terminazione TLS e HSTS
  - H3: Linee guida di rollout
  - H2: Esempi di configurazione proxy
  - H2: Configurazione con token misti
  - H2: Header degli ambiti operatore
  - H2: Checklist di sicurezza
  - H2: Audit di sicurezza
  - H2: Risoluzione dei problemi
  - H2: Migrazione dall'autenticazione con token
  - H2: Correlati

## help/debugging.md

- Percorso: /help/debugging
- Titoli:
  - H2: Override di debug runtime
  - H2: Output di traccia della sessione
  - H2: Traccia del ciclo di vita dei Plugin
  - H2: Profilazione dell'avvio CLI e dei comandi
  - H2: Modalità watch del Gateway
  - H2: Profilo dev + gateway dev (--dev)
  - H2: Logging dello stream raw (OpenClaw)
  - H2: Logging dei chunk raw compatibili con OpenAI
  - H2: Note di sicurezza
  - H2: Debug in VSCode
  - H3: Configurazione
  - H3: Note
  - H2: Correlati

## help/environment.md

- Percorso: /help/environment
- Titoli:
  - H2: Precedenza (dalla più alta → alla più bassa)
  - H2: Credenziali provider e .env del workspace
  - H2: Blocco env di configurazione
  - H2: Importazione dell'env della shell
  - H2: Snapshot della shell exec
  - H2: Variabili env iniettate dal runtime
  - H2: Variabili env della UI
  - H2: Sostituzione delle variabili env nella configurazione
  - H2: Riferimenti ai segreti vs stringhe ${ENV}
  - H2: Variabili env relative ai percorsi
  - H2: Logging
  - H3: OPENCLAWHOME
  - H2: Utenti nvm: errori TLS di webfetch
  - H2: Variabili d'ambiente legacy
  - H2: Correlati

## help/faq-first-run.md

- Percorso: /help/faq-first-run
- Titoli:
  - H2: Avvio rapido e configurazione al primo avvio
  - H2: Correlati

## help/faq-models.md

- Percorso: /help/faq-models
- Titoli:
  - H2: Modelli: predefiniti, selezione, alias, cambio
  - H2: Failover dei modelli e "Tutti i modelli non riusciti"
  - H2: Profili di autenticazione: cosa sono e come gestirli
  - H2: Correlati

## help/faq.md

- Percorso: /help/faq
- Titoli:
  - H2: Primi 60 secondi se qualcosa è rotto
  - H2: Avvio rapido e configurazione al primo avvio
  - H2: Cos'è OpenClaw?
  - H2: Skills e automazione
  - H2: Sandboxing e memoria
  - H2: Dove risiedono le cose su disco
  - H2: Fondamenti della configurazione
  - H2: Gateway e nodi remoti
  - H2: Variabili env e caricamento .env
  - H2: Sessioni e chat multiple
  - H2: Modelli, failover e profili di autenticazione
  - H2: Gateway: porte, "già in esecuzione" e modalità remota
  - H2: Logging e debug
  - H2: Media e allegati
  - H2: Sicurezza e controllo degli accessi
  - H2: Comandi chat, interruzione delle attività e "non si fermerà"
  - H2: Varie
  - H2: Correlati

## help/index.md

- Percorso: /help
- Titoli:
  - H2: FAQ
  - H2: Diagnostica
  - H2: Testing
  - H2: Community e meta

## help/scripts.md

- Percorso: /help/scripts
- Titoli:
  - H2: Convenzioni
  - H2: Script di monitoraggio dell'autenticazione
  - H2: Helper di lettura GitHub
  - H2: Quando si aggiungono script
  - H2: Correlati

## help/testing-live.md

- Route: /help/testing-live
- Intestazioni:
  - H2: Live: comandi smoke locali
  - H2: Live: sweep delle capacità del nodo Android
  - H2: Live: smoke del modello (chiavi del profilo)
  - H3: Livello 1: completamento diretto del modello (senza gateway)
  - H3: Livello 2: Gateway + smoke dell'agente dev (ciò che "@openclaw" fa realmente)
  - H2: Live: smoke del backend CLI (Claude, Gemini o altre CLI locali)
  - H2: Live: raggiungibilità del proxy APNs HTTP/2
  - H2: Live: smoke di bind ACP (/acp spawn ... --bind here)
  - H2: Live: smoke dell'harness app-server Codex
  - H3: Ricette live consigliate
  - H2: Live: matrice dei modelli (cosa copriamo)
  - H3: Set smoke moderno (chiamata di strumenti + immagine)
  - H3: Baseline: chiamata di strumenti (Read + Exec facoltativo)
  - H3: Visione: invio immagine (allegato → messaggio multimodale)
  - H3: Aggregatori / gateway alternativi
  - H2: Credenziali (non committare mai)
  - H2: Deepgram live (trascrizione audio)
  - H2: BytePlus live per piano di coding
  - H2: ComfyUI live per media del workflow
  - H2: Generazione immagini live
  - H2: Generazione musica live
  - H2: Generazione video live
  - H2: Harness media live
  - H2: Correlati

## help/testing-updates-plugins.md

- Route: /help/testing-updates-plugins
- Intestazioni:
  - H2: Cosa proteggiamo
  - H2: Prova locale durante lo sviluppo
  - H2: Lane Docker
  - H2: Accettazione del pacchetto
  - H2: Default di release
  - H2: Compatibilità legacy
  - H2: Aggiungere copertura
  - H2: Triage dei guasti

## help/testing.md

- Route: /help/testing
- Intestazioni:
  - H2: Avvio rapido
  - H2: Directory temporanee dei test
  - H2: Runner specifici per QA
  - H3: Credenziali Telegram condivise tramite Convex (v1)
  - H3: Aggiungere un canale a QA
  - H2: Suite di test (cosa viene eseguito dove)
  - H3: Unità / integrazione (predefinito)
  - H3: Stabilità (gateway)
  - H3: E2E (aggregato del repo)
  - H3: E2E (smoke del gateway)
  - H3: E2E (browser simulato della Control UI)
  - H3: E2E: smoke del backend OpenShell
  - H3: Live (provider reali + modelli reali)
  - H2: Quale suite dovrei eseguire?
  - H2: Test live (che toccano la rete)
  - H2: Runner Docker (controlli opzionali "funziona su Linux")
  - H2: Sanity check della documentazione
  - H2: Regressione offline (sicura per CI)
  - H2: Valutazioni di affidabilità degli agenti (skills)
  - H2: Test di contratto (forma di plugin e canale)
  - H3: Comandi
  - H3: Contratti dei canali
  - H3: Contratti di stato dei provider
  - H3: Contratti dei provider
  - H3: Quando eseguire
  - H2: Aggiungere regressioni (guida)
  - H2: Correlati

## help/troubleshooting.md

- Route: /help/troubleshooting
- Intestazioni:
  - H2: Primi 60 secondi
  - H2: L'assistente sembra limitato o senza strumenti
  - H2: Contesto lungo Anthropic 429
  - H2: Backend locale compatibile con OpenAI funziona direttamente ma fallisce in OpenClaw
  - H2: Installazione del plugin fallisce con estensioni openclaw mancanti
  - H2: La policy di installazione blocca installazioni o aggiornamenti dei plugin
  - H2: Plugin presente ma bloccato da proprietà sospetta
  - H2: Albero decisionale
  - H2: Correlati

## index.md

- Route: /
- Intestazioni:
  - H1: OpenClaw 🦞
  - H2: Cos'è OpenClaw?
  - H2: Come funziona
  - H2: Capacità principali
  - H2: Avvio rapido
  - H2: Dashboard
  - H2: Configurazione (facoltativa)
  - H2: Inizia qui
  - H2: Scopri di più

## install/ansible.md

- Route: /install/ansible
- Intestazioni:
  - H2: Prerequisiti
  - H2: Cosa ottieni
  - H2: Avvio rapido
  - H2: Cosa viene installato
  - H2: Configurazione post-installazione
  - H3: Comandi rapidi
  - H2: Architettura di sicurezza
  - H2: Installazione manuale
  - H2: Aggiornamento
  - H2: Risoluzione dei problemi
  - H2: Configurazione avanzata
  - H2: Correlati

## install/azure.md

- Route: /install/azure
- Intestazioni:
  - H2: Cosa farai
  - H2: Cosa ti serve
  - H2: Configurare il deployment
  - H2: Distribuire le risorse Azure
  - H2: Installare OpenClaw
  - H2: Considerazioni sui costi
  - H2: Pulizia
  - H2: Passaggi successivi
  - H2: Correlati

## install/bun.md

- Route: /install/bun
- Intestazioni:
  - H2: Installazione
  - H2: Script del ciclo di vita
  - H2: Avvertenze
  - H2: Correlati

## install/clawdock.md

- Route: /install/clawdock
- Intestazioni:
  - H2: Installazione
  - H2: Cosa ottieni
  - H3: Operazioni di base
  - H3: Accesso al container
  - H3: Interfaccia web e pairing
  - H3: Configurazione e manutenzione
  - H3: Utilità
  - H2: Flusso al primo utilizzo
  - H2: Configurazione e segreti
  - H2: Correlati

## install/development-channels.md

- Route: /install/development-channels
- Intestazioni:
  - H2: Cambiare canali
  - H2: Targeting una tantum di versione o tag
  - H2: Dry run
  - H2: Plugin e canali
  - H2: Controllare lo stato attuale
  - H2: Best practice per i tag
  - H2: Disponibilità dell'app macOS
  - H2: Correlati

## install/digitalocean.md

- Route: /install/digitalocean
- Intestazioni:
  - H2: Prerequisiti
  - H2: Configurazione
  - H2: Persistenza e backup
  - H2: Suggerimenti per 1 GB di RAM
  - H2: Risoluzione dei problemi
  - H2: Passaggi successivi
  - H2: Correlati

## install/docker-vm-runtime.md

- Route: /install/docker-vm-runtime
- Intestazioni:
  - H2: Inserire i binari richiesti nell'immagine
  - H2: Build e avvio
  - H2: Cosa persiste e dove
  - H2: Aggiornamenti
  - H2: Correlati

## install/docker.md

- Route: /install/docker
- Intestazioni:
  - H2: Docker è adatto a me?
  - H2: Prerequisiti
  - H2: Gateway containerizzato
  - H3: Flusso manuale
  - H3: Variabili d'ambiente
  - H3: Osservabilità
  - H3: Health check
  - H3: LAN vs loopback
  - H3: Provider locali dell'host
  - H3: Backend CLI Claude in Docker
  - H3: Bonjour / mDNS
  - H3: Storage e persistenza
  - H3: Helper shell (facoltativi)
  - H3: Esecuzione su un VPS?
  - H2: Sandbox dell'agente
  - H3: Abilitazione rapida
  - H2: Risoluzione dei problemi
  - H2: Correlati

## install/exe-dev.md

- Route: /install/exe-dev
- Intestazioni:
  - H2: Percorso rapido per principianti
  - H2: Cosa ti serve
  - H2: Installazione automatizzata con Shelley
  - H2: Installazione manuale
  - H2: 1) Creare la VM
  - H2: 2) Installare i prerequisiti (sulla VM)
  - H2: 3) Installare OpenClaw
  - H2: 4) Configurare nginx per proxyare OpenClaw sulla porta 8000
  - H2: 5) Accedere a OpenClaw e concedere privilegi
  - H2: Configurazione del canale remoto
  - H2: Accesso remoto
  - H2: Aggiornamento
  - H2: Correlati

## install/fly.md

- Route: /install/fly
- Intestazioni:
  - H2: Cosa ti serve
  - H2: Percorso rapido per principianti
  - H2: Risoluzione dei problemi
  - H3: "L'app non è in ascolto sull'indirizzo previsto"
  - H3: Health check non riusciti / connessione rifiutata
  - H3: OOM / problemi di memoria
  - H3: Problemi di lock del Gateway
  - H3: Configurazione non letta
  - H3: Scrivere la configurazione via SSH
  - H3: Stato non persistente
  - H2: Aggiornamenti
  - H3: Comando di aggiornamento della macchina
  - H2: Deployment privato (rafforzato)
  - H3: Quando usare il deployment privato
  - H3: Configurazione
  - H3: Accesso a un deployment privato
  - H3: Webhook con deployment privato
  - H3: Vantaggi di sicurezza
  - H2: Note
  - H2: Costo
  - H2: Passaggi successivi
  - H2: Correlati

## install/gcp.md

- Route: /install/gcp
- Intestazioni:
  - H2: Cosa stiamo facendo (in termini semplici)?
  - H2: Percorso rapido (operatori esperti)
  - H2: Cosa ti serve
  - H2: Risoluzione dei problemi
  - H2: Account di servizio (best practice di sicurezza)
  - H2: Passaggi successivi
  - H2: Correlati

## install/hetzner.md

- Route: /install/hetzner
- Intestazioni:
  - H2: Obiettivo
  - H2: Cosa stiamo facendo (in termini semplici)?
  - H2: Percorso rapido (operatori esperti)
  - H2: Cosa ti serve
  - H2: Infrastructure as Code (Terraform)
  - H2: Passaggi successivi
  - H2: Correlati

## install/hostinger.md

- Route: /install/hostinger
- Intestazioni:
  - H2: Prerequisiti
  - H2: Opzione A: OpenClaw con 1 clic
  - H2: Opzione B: OpenClaw su VPS
  - H2: Verificare la configurazione
  - H2: Risoluzione dei problemi
  - H2: Passaggi successivi
  - H2: Correlati

## install/index.md

- Route: /install
- Intestazioni:
  - H2: Requisiti di sistema
  - H2: Consigliato: script di installazione
  - H2: Metodi di installazione alternativi
  - H3: Installer con prefisso locale (install-cli.sh)
  - H3: npm, pnpm o bun
  - H3: Da sorgente
  - H3: Installare dal checkout main di GitHub
  - H3: Container e package manager
  - H2: Verificare l'installazione
  - H2: Hosting e deployment
  - H2: Aggiornare, migrare o disinstallare
  - H2: Risoluzione dei problemi: openclaw non trovato

## install/installer.md

- Route: /install/installer
- Intestazioni:
  - H2: Comandi rapidi
  - H2: install.sh
  - H3: Flusso (install.sh)
  - H3: Rilevamento del checkout sorgente
  - H3: Esempi (install.sh)
  - H2: install-cli.sh
  - H3: Flusso (install-cli.sh)
  - H3: Esempi (install-cli.sh)
  - H2: install.ps1
  - H3: Flusso (install.ps1)
  - H3: Esempi (install.ps1)
  - H2: CI e automazione
  - H2: Risoluzione dei problemi
  - H2: Correlati

## install/kubernetes.md

- Route: /install/kubernetes
- Intestazioni:
  - H2: Perché non Helm?
  - H2: Cosa ti serve
  - H2: Avvio rapido
  - H2: Test locale con Kind
  - H2: Passo dopo passo
  - H3: 1) Distribuire
  - H3: 2) Accedere al gateway
  - H2: Cosa viene distribuito
  - H2: Personalizzazione
  - H3: Istruzioni dell'agente
  - H3: Configurazione del Gateway
  - H3: Aggiungere provider
  - H3: Namespace personalizzato
  - H3: Immagine personalizzata
  - H3: Esporre oltre il port-forward
  - H2: Ridistribuire
  - H2: Smontaggio
  - H2: Note sull'architettura
  - H2: Struttura dei file
  - H2: Correlati

## install/macos-vm.md

- Route: /install/macos-vm
- Intestazioni:
  - H2: Default consigliato (la maggior parte degli utenti)
  - H2: Opzioni VM macOS
  - H3: VM locale sul tuo Mac Apple Silicon (Lume)
  - H3: Provider Mac in hosting (cloud)
  - H2: Percorso rapido (Lume, utenti esperti)
  - H2: Cosa ti serve (Lume)
  - H2: 1) Installare Lume
  - H2: 2) Creare la VM macOS
  - H2: 3) Completare l'Assistente Configurazione
  - H2: 4) Ottenere l'indirizzo IP della VM
  - H2: 5) Accedere alla VM via SSH
  - H2: 6) Installare OpenClaw
  - H2: 7) Configurare i canali
  - H2: 8) Eseguire la VM in modalità headless
  - H2: Bonus: integrazione iMessage
  - H2: Salvare un'immagine golden
  - H2: Esecuzione 24/7
  - H2: Risoluzione dei problemi
  - H2: Documenti correlati

## install/migrating-claude.md

- Route: /install/migrating-claude
- Intestazioni:
  - H2: Due modi per importare
  - H2: Cosa viene importato
  - H2: Cosa resta solo archivio
  - H2: Selezione della sorgente
  - H2: Flusso consigliato
  - H2: Gestione dei conflitti
  - H2: Output JSON per automazione
  - H2: Risoluzione dei problemi
  - H2: Correlati

## install/migrating-hermes.md

- Route: /install/migrating-hermes
- Intestazioni:
  - H2: Due modi per importare
  - H2: Cosa viene importato
  - H2: Cosa resta solo archivio
  - H2: Flusso consigliato
  - H2: Gestione dei conflitti
  - H2: Segreti
  - H2: Output JSON per automazione
  - H2: Risoluzione dei problemi
  - H2: Correlati

## install/migrating.md

- Route: /install/migrating
- Intestazioni:
  - H2: Importare da un altro sistema di agenti
  - H2: Spostare OpenClaw su una nuova macchina
  - H3: Passaggi di migrazione
  - H3: Errori comuni
  - H3: Checklist di verifica
  - H2: Aggiornare un plugin sul posto
  - H2: Correlati

## install/nix.md

- Route: /install/nix
- Intestazioni:
  - H2: Cosa ottieni
  - H2: Avvio rapido
  - H2: Comportamento runtime in modalità Nix
  - H3: Cosa cambia in modalità Nix
  - H3: Percorsi di configurazione e stato
  - H3: Rilevamento del PATH del servizio
  - H2: Correlati

## install/node.md

- Route: /install/node
- Intestazioni:
  - H2: Controllare la versione
  - H2: Installare Node
  - H2: Risoluzione dei problemi
  - H3: openclaw: command not found
  - H3: Errori di autorizzazione su npm install -g (Linux)
  - H2: Correlati

## install/northflank.mdx

- Route: /install/northflank
- Intestazioni:
  - H1: Northflank
  - H2: Come iniziare
  - H2: Cosa ottieni
  - H2: Connettere un canale
  - H2: Passaggi successivi

## install/oracle.md

- Route: /install/oracle
- Intestazioni:
  - H2: Prerequisiti
  - H2: Configurazione
  - H2: Verificare la postura di sicurezza
  - H2: Note ARM
  - H2: Persistenza e backup
  - H2: Fallback: tunnel SSH
  - H2: Risoluzione dei problemi
  - H2: Passaggi successivi
  - H2: Correlati

## install/podman.md

- Route: /install/podman
- Intestazioni:
  - H2: Prerequisiti
  - H2: Avvio rapido
  - H2: Podman e Tailscale
  - H2: Systemd (Quadlet, facoltativo)
  - H2: Configurazione, env e storage
  - H2: Comandi utili
  - H2: Risoluzione dei problemi
  - H2: Correlati

## install/railway.mdx

- Route: /install/railway
- Intestazioni:
  - H1: Railway
  - H2: Checklist rapida (nuovi utenti)
  - H2: Deployment con un clic
  - H2: Cosa ottieni
  - H2: Impostazioni Railway richieste
  - H3: Rete pubblica
  - H3: Volume (richiesto)
  - H3: Variabili
  - H2: Connettere un canale
  - H2: Backup &amp; migrazione
  - H2: Passaggi successivi

## install/raspberry-pi.md

- Percorso: /install/raspberry-pi
- Intestazioni:
  - H2: Compatibilità hardware
  - H2: Prerequisiti
  - H2: Configurazione
  - H2: Suggerimenti per le prestazioni
  - H2: Configurazione del modello consigliata
  - H2: Note sui binari ARM
  - H2: Persistenza e backup
  - H2: Risoluzione dei problemi
  - H2: Passaggi successivi
  - H2: Correlati

## install/render.mdx

- Percorso: /install/render
- Intestazioni:
  - H1: Render
  - H2: Prerequisiti
  - H2: Distribuire con un Render Blueprint
  - H2: Comprendere il Blueprint
  - H2: Scegliere un piano
  - H2: Dopo la distribuzione
  - H3: Accedere alla UI di controllo
  - H2: Funzionalità della Dashboard Render
  - H3: Log
  - H3: Accesso shell
  - H3: Variabili d'ambiente
  - H3: Distribuzione automatica
  - H2: Dominio personalizzato
  - H2: Scalabilità
  - H2: Backup e migrazione
  - H2: Risoluzione dei problemi
  - H3: Il servizio non si avvia
  - H3: Avvii a freddo lenti (piano gratuito)
  - H3: Perdita di dati dopo una nuova distribuzione
  - H3: Errori dei controlli di integrità
  - H2: Passaggi successivi

## install/uninstall.md

- Percorso: /install/uninstall
- Intestazioni:
  - H2: Percorso semplice (CLI ancora installata)
  - H2: Rimozione manuale del servizio (CLI non installata)
  - H3: macOS (launchd)
  - H3: Linux (unità utente systemd)
  - H3: Windows (Attività pianificata)
  - H2: Installazione normale vs checkout sorgente
  - H3: Installazione normale (install.sh / npm / pnpm / bun)
  - H3: Checkout sorgente (git clone)
  - H2: Correlati

## install/updating.md

- Percorso: /install/updating
- Intestazioni:
  - H2: Consigliato: openclaw update
  - H2: Passare tra installazioni npm e git
  - H2: Alternativa: rieseguire l'installer
  - H2: Alternativa: npm, pnpm o bun manuale
  - H3: Argomenti avanzati sull'installazione npm
  - H2: Aggiornatore automatico
  - H2: Dopo l'aggiornamento
  - H3: Eseguire doctor
  - H3: Riavviare il Gateway
  - H3: Verificare
  - H2: Rollback
  - H3: Bloccare una versione (npm)
  - H3: Bloccare un commit (sorgente)
  - H2: Se sei bloccato
  - H2: Correlati

## install/upstash.md

- Percorso: /install/upstash
- Intestazioni:
  - H2: Prerequisiti
  - H2: Creare una Box
  - H2: Connettersi con un tunnel SSH
  - H2: Installare OpenClaw
  - H2: Eseguire l'onboarding
  - H2: Avviare il Gateway
  - H2: Riavvio automatico
  - H2: Risoluzione dei problemi
  - H2: Correlati

## logging.md

- Percorso: /logging
- Intestazioni:
  - H2: Dove si trovano i log
  - H2: Come leggere i log
  - H3: CLI: tail live (consigliato)
  - H3: UI di controllo (web)
  - H3: Log solo canale
  - H2: Formati dei log
  - H3: Log su file (JSONL)
  - H3: Output console
  - H3: Log WebSocket del Gateway
  - H2: Configurare il logging
  - H3: Livelli di log
  - H3: Diagnostica mirata del trasporto del modello
  - H3: Correlazione delle tracce
  - H3: Dimensione e tempi delle chiamate al modello
  - H3: Stili console
  - H3: Redazione
  - H2: Diagnostica e OpenTelemetry
  - H2: Suggerimenti per la risoluzione dei problemi
  - H2: Correlati

## maturity/scorecard.md

- Percorso: /maturity/scorecard
- Intestazioni:
  - H1: Scheda di valutazione della maturità
  - H2: A cosa serve questa pagina
  - H2: In sintesi
  - H2: Fasce di punteggio
  - H2: Esploratore delle superfici
  - H2: Riepilogo delle evidenze QA
  - H3: Prontezza per area

## maturity/taxonomy.md

- Percorso: /maturity/taxonomy
- Intestazioni:
  - H1: Tassonomia della maturità
  - H2: Come leggere questa pagina
  - H2: Livelli di maturità
  - H2: Aree di prodotto
  - H2: Dettagli
  - H3: Core
  - H3: Piattaforma
  - H3: Canale
  - H3: Provider e strumento

## network.md

- Percorso: /network
- Intestazioni:
  - H2: Modello core
  - H2: Associazione + identità
  - H2: Rilevamento + trasporti
  - H2: Nodi + trasporti
  - H2: Sicurezza
  - H2: Correlati

## nodes/audio.md

- Percorso: /nodes/audio
- Intestazioni:
  - H2: Cosa funziona
  - H2: Rilevamento automatico (predefinito)
  - H2: Esempi di configurazione
  - H3: Fallback provider + CLI (OpenAI + Whisper CLI)
  - H3: Solo provider con gating per ambito
  - H3: Solo provider (Deepgram)
  - H3: Solo provider (Mistral Voxtral)
  - H3: Solo provider (SenseAudio)
  - H3: Eco della trascrizione nella chat (opt-in)
  - H2: Note e limiti
  - H3: Supporto dell'ambiente proxy
  - H2: Rilevamento delle menzioni nei gruppi
  - H2: Problemi comuni
  - H2: Correlati

## nodes/camera.md

- Percorso: /nodes/camera
- Intestazioni:
  - H2: Nodo iOS
  - H3: Impostazione utente (attiva per impostazione predefinita)
  - H3: Comandi (tramite Gateway node.invoke)
  - H3: Requisito di primo piano
  - H3: Helper CLI
  - H2: Nodo Android
  - H3: Impostazione utente Android (attiva per impostazione predefinita)
  - H3: Permessi
  - H3: Requisito di primo piano Android
  - H3: Comandi Android (tramite Gateway node.invoke)
  - H3: Protezione del payload
  - H2: App macOS
  - H3: Impostazione utente (disattivata per impostazione predefinita)
  - H3: Helper CLI (node invoke)
  - H2: Sicurezza + limiti pratici
  - H2: Video dello schermo macOS (a livello OS)
  - H2: Correlati

## nodes/images.md

- Percorso: /nodes/images
- Intestazioni:
  - H2: Obiettivi
  - H2: Superficie CLI
  - H2: Comportamento del canale WhatsApp Web
  - H2: Pipeline di risposta automatica
  - H2: Media in ingresso verso comandi
  - H2: Limiti ed errori
  - H2: Note per i test
  - H2: Correlati

## nodes/index.md

- Percorso: /nodes
- Intestazioni:
  - H2: Associazione + stato
  - H2: Host nodo remoto (system.run)
  - H3: Cosa viene eseguito dove
  - H3: Avviare un host nodo (primo piano)
  - H3: Gateway remoto tramite tunnel SSH (binding loopback)
  - H3: Avviare un host nodo (servizio)
  - H3: Associare + nominare
  - H3: Inserire i comandi nell'elenco consentiti
  - H3: Puntare exec al nodo
  - H3: Inferenza del modello locale
  - H2: Invocare comandi
  - H2: Policy dei comandi
  - H2: Configurazione (openclaw.json)
  - H2: Screenshot (snapshot canvas)
  - H3: Controlli Canvas
  - H3: A2UI (Canvas)
  - H2: Foto + video (camera nodo)
  - H2: Registrazioni schermo (nodi)
  - H2: Posizione (nodi)
  - H2: SMS (nodi Android)
  - H2: Comandi dispositivo Android + dati personali
  - H2: Comandi di sistema (host nodo / nodo Mac)
  - H2: Binding nodo exec
  - H2: Mappa dei permessi
  - H2: Host nodo headless (multipiattaforma)
  - H2: Modalità nodo Mac

## nodes/location-command.md

- Percorso: /nodes/location-command
- Intestazioni:
  - H2: TL;DR
  - H2: Perché un selettore (non solo uno switch)
  - H2: Modello delle impostazioni
  - H2: Mappatura dei permessi (node.permissions)
  - H2: Comando: location.get
  - H2: Comportamento in background
  - H2: Integrazione modello/strumenti
  - H2: Testo UX (suggerito)
  - H2: Correlati

## nodes/media-understanding.md

- Percorso: /nodes/media-understanding
- Intestazioni:
  - H2: Obiettivi
  - H2: Comportamento di alto livello
  - H2: Panoramica della configurazione
  - H3: Voci modello
  - H3: Credenziali provider (apiKey)
  - H2: Valori predefiniti e limiti
  - H3: Rilevamento automatico della comprensione dei media (predefinito)
  - H3: Supporto dell'ambiente proxy (modelli provider)
  - H2: Capacità (opzionali)
  - H2: Matrice di supporto provider (integrazioni OpenClaw)
  - H2: Guida alla selezione del modello
  - H2: Policy degli allegati
  - H2: Esempi di configurazione
  - H2: Output di stato
  - H2: Note
  - H2: Correlati

## nodes/talk.md

- Percorso: /nodes/talk
- Intestazioni:
  - H2: Comportamento (macOS)
  - H2: Direttive vocali nelle risposte
  - H2: Configurazione (/.openclaw/openclaw.json)
  - H2: UI macOS
  - H2: UI Android
  - H2: Note
  - H2: Correlati

## nodes/troubleshooting.md

- Percorso: /nodes/troubleshooting
- Intestazioni:
  - H2: Sequenza di comandi
  - H2: Requisiti di primo piano
  - H2: Matrice dei permessi
  - H2: Associazione rispetto ad approvazioni
  - H2: Codici di errore comuni dei nodi
  - H2: Ciclo di recupero rapido
  - H2: Correlati

## nodes/voicewake.md

- Percorso: /nodes/voicewake
- Intestazioni:
  - H2: Archiviazione (host Gateway)
  - H2: Protocollo
  - H3: Metodi
  - H3: Metodi di routing (trigger → target)
  - H3: Eventi
  - H2: Comportamento client
  - H3: App macOS
  - H3: Nodo iOS
  - H3: Nodo Android
  - H2: Correlati

## openclaw-agent-runtime.md

- Percorso: /openclaw-agent-runtime
- Intestazioni:
  - H2: Controllo dei tipi e linting
  - H2: Esecuzione dei test Agent Runtime
  - H2: Test manuali
  - H2: Ripristino da zero
  - H2: Riferimenti
  - H2: Correlati

## perplexity.md

- Percorso: /perplexity
- Intestazioni:
  - H2: Correlati

## plan/codex-context-engine-harness.md

- Percorso: /plan/codex-context-engine-harness
- Intestazioni:
  - H2: Stato
  - H2: Obiettivo
  - H2: Non-obiettivi
  - H2: Architettura attuale
  - H2: Lacuna attuale
  - H2: Comportamento desiderato
  - H2: Vincoli di progettazione
  - H3: L'app-server Codex resta canonico per lo stato nativo del thread
  - H3: L'assemblaggio del motore di contesto deve essere proiettato negli input Codex
  - H3: La stabilità della prompt-cache è importante
  - H3: Le semantiche di selezione del runtime non cambiano
  - H2: Piano di implementazione
  - H3: 1. Esportare o ricollocare helper riutilizzabili per i tentativi del motore di contesto
  - H3: 2. Aggiungere un helper di proiezione del contesto Codex
  - H3: 3. Collegare il bootstrap prima dell'avvio del thread Codex
  - H3: 4. Collegare assemble prima di thread/start / thread/resume e turn/start
  - H3: 5. Preservare la formattazione stabile per la prompt-cache
  - H3: 6. Collegare post-turn dopo il mirroring della trascrizione
  - H3: 7. Normalizzare uso e contesto runtime della prompt-cache
  - H3: 8. Policy di Compaction
  - H4: /compact e Compaction esplicita OpenClaw
  - H4: Eventi contextCompaction nativi Codex durante il turno
  - H3: 9. Reimpostazione sessione e comportamento di binding
  - H3: 10. Gestione degli errori
  - H2: Piano di test
  - H3: Test unitari
  - H3: Test esistenti da aggiornare
  - H3: Test di integrazione / live
  - H2: Osservabilità
  - H2: Migrazione / compatibilità
  - H2: Domande aperte
  - H2: Criteri di accettazione

## plan/ui-channels.md

- Percorso: /plan/ui-channels
- Intestazioni:
  - H2: Stato
  - H2: Problema
  - H2: Obiettivi
  - H2: Non obiettivi
  - H2: Modello target
  - H2: Metadati di consegna
  - H2: Contratto delle capacità runtime
  - H2: Mappatura dei canali
  - H2: Passaggi di refactoring
  - H2: Test
  - H2: Domande aperte
  - H2: Correlati

## platforms/android.md

- Percorso: /platforms/android
- Intestazioni:
  - H2: Snapshot del supporto
  - H2: Controllo di sistema
  - H2: Runbook di connessione
  - H3: Prerequisiti
  - H3: 1) Avviare il Gateway
  - H3: 2) Verificare il rilevamento (opzionale)
  - H4: Rilevamento Tailnet (Vienna ⇄ Londra) tramite DNS-SD unicast
  - H3: 3) Connettersi da Android
  - H3: Beacon alive di presenza
  - H3: 4) Approvare l'associazione (CLI)
  - H3: 5) Verificare che il nodo sia connesso
  - H3: 6) Chat + cronologia
  - H3: 7) Canvas + camera
  - H4: Host Canvas Gateway (consigliato per contenuti web)
  - H3: 8) Voce + superficie dei comandi Android estesa
  - H2: Entry point dell'assistente
  - H2: Inoltro notifiche
  - H2: Correlati

## platforms/digitalocean.md

- Percorso: /platforms/digitalocean
- Intestazioni:
  - H2: Correlati

## platforms/easyrunner.md

- Percorso: /platforms/easyrunner
- Intestazioni:
  - H2: Prima di iniziare
  - H2: App Compose
  - H2: Configurare OpenClaw
  - H2: Verificare
  - H2: Aggiornamenti e backup
  - H2: Risoluzione dei problemi

## platforms/index.md

- Percorso: /platforms
- Intestazioni:
  - H2: Scegliere il proprio OS
  - H2: VPS e hosting
  - H2: Link comuni
  - H2: Installazione del servizio Gateway (CLI)
  - H2: Correlati

## platforms/ios.md

- Percorso: /platforms/ios
- Intestazioni:
  - H2: Cosa fa
  - H2: Requisiti
  - H2: Avvio rapido (associa + connetti)
  - H2: Push basato su relay per build ufficiali
  - H2: Beacon alive in background
  - H2: Flusso di autenticazione e fiducia
  - H2: Percorsi di rilevamento
  - H3: Bonjour (LAN)
  - H3: Tailnet (tra reti)
  - H3: Host/porta manuali
  - H2: Canvas + A2UI
  - H2: Relazione con Computer Use
  - H3: Valutazione / snapshot Canvas
  - H2: Voice wake + modalità talk
  - H2: Errori comuni
  - H2: Documenti correlati

## platforms/linux.md

- Percorso: /platforms/linux
- Intestazioni:
  - H2: Percorso rapido per principianti (VPS)
  - H2: Installazione
  - H2: Gateway
  - H2: Installazione del servizio Gateway (CLI)
  - H2: Controllo di sistema (unità utente systemd)
  - H2: Pressione sulla memoria e OOM kill
  - H2: Correlati

## platforms/mac/bundled-gateway.md

- Percorso: /platforms/mac/bundled-gateway
- Intestazioni:
  - H2: Configurazione automatica
  - H2: Ripristino manuale
  - H2: Launchd (Gateway come LaunchAgent)
  - H2: Compatibilità delle versioni
  - H2: Directory di stato su macOS
  - H2: Debug della connettività dell'app
  - H2: Smoke check
  - H2: Correlati

## platforms/mac/canvas.md

- Percorso: /platforms/mac/canvas
- Intestazioni:
  - H2: Dove si trova Canvas
  - H2: Comportamento del pannello
  - H2: Superficie API dell'agente
  - H2: A2UI in Canvas
  - H3: Comandi A2UI (v0.8)
  - H2: Attivare esecuzioni dell'agente da Canvas
  - H2: Note sulla sicurezza
  - H2: Correlati

## platforms/mac/child-process.md

- Percorso: /platforms/mac/child-process
- Intestazioni:
  - H2: Comportamento predefinito (launchd)
  - H2: Build di sviluppo non firmate
  - H2: Modalità solo collegamento
  - H2: Modalità remota
  - H2: Perché preferiamo launchd
  - H2: Correlati

## platforms/mac/dev-setup.md

- Route: /platforms/mac/dev-setup
- Intestazioni:
  - H1: Configurazione dell'ambiente di sviluppo macOS
  - H2: Prerequisiti
  - H2: 1. Installa le dipendenze
  - H2: 2. Compila e pacchettizza l'app
  - H2: 3. Installa la CLI e il Gateway
  - H2: Risoluzione dei problemi
  - H3: La build non riesce: mancata corrispondenza tra toolchain o SDK
  - H3: L'app va in crash quando viene concessa l'autorizzazione
  - H3: Gateway in "Avvio..." indefinitamente
  - H2: Correlati

## platforms/mac/health.md

- Route: /platforms/mac/health
- Intestazioni:
  - H1: Controlli di integrità su macOS
  - H2: Barra dei menu
  - H2: Impostazioni
  - H2: Come funziona il probe
  - H2: In caso di dubbio
  - H2: Correlati

## platforms/mac/icon.md

- Route: /platforms/mac/icon
- Intestazioni:
  - H1: Stati dell'icona della barra dei menu
  - H2: Correlati

## platforms/mac/logging.md

- Route: /platforms/mac/logging
- Intestazioni:
  - H1: Logging (macOS)
  - H2: Log dei file diagnostici a rotazione (riquadro Debug)
  - H2: Dati privati del logging unificato su macOS
  - H2: Abilita per OpenClaw (ai.openclaw)
  - H2: Disabilita dopo il debug
  - H2: Correlati

## platforms/mac/menu-bar.md

- Route: /platforms/mac/menu-bar
- Intestazioni:
  - H2: Cosa viene mostrato
  - H2: Modello di stato
  - H2: enum IconState (Swift)
  - H3: ActivityKind → glifo
  - H3: Mappatura visiva
  - H2: Sottomenu contestuale
  - H2: Testo della riga di stato (menu)
  - H2: Acquisizione degli eventi
  - H2: Override di debug
  - H2: Checklist di test
  - H2: Correlati

## platforms/mac/peekaboo.md

- Route: /platforms/mac/peekaboo
- Intestazioni:
  - H2: Cos'è questo (e cosa non è)
  - H2: Relazione con Computer Use
  - H2: Abilita il bridge
  - H2: Ordine di rilevamento del client
  - H2: Sicurezza e autorizzazioni
  - H2: Comportamento degli snapshot (automazione)
  - H2: Risoluzione dei problemi
  - H2: Correlati

## platforms/mac/permissions.md

- Route: /platforms/mac/permissions
- Intestazioni:
  - H2: Requisiti per autorizzazioni stabili
  - H2: Concessioni di Accessibilità per runtime Node e CLI
  - H2: Checklist di ripristino quando i prompt scompaiono
  - H2: Autorizzazioni per file e cartelle (Scrivania/Documenti/Download)
  - H2: Correlati

## platforms/mac/remote.md

- Route: /platforms/mac/remote
- Intestazioni:
  - H2: Modalità
  - H2: Trasporti remoti
  - H2: Prerequisiti sull'host remoto
  - H2: Configurazione dell'app macOS
  - H2: Chat Web
  - H2: Autorizzazioni
  - H2: Note sulla sicurezza
  - H2: Flusso di accesso WhatsApp (remoto)
  - H2: Risoluzione dei problemi
  - H2: Suoni di notifica
  - H2: Correlati

## platforms/mac/signing.md

- Route: /platforms/mac/signing
- Intestazioni:
  - H1: Firma mac (build di debug)
  - H2: Utilizzo
  - H3: Nota sulla firma ad hoc
  - H2: Metadati della build per Informazioni
  - H2: Perché
  - H2: Correlati

## platforms/mac/skills.md

- Route: /platforms/mac/skills
- Intestazioni:
  - H2: Origine dati
  - H2: Azioni di installazione
  - H2: Chiavi env/API
  - H2: Modalità remota
  - H2: Correlati

## platforms/mac/voice-overlay.md

- Route: /platforms/mac/voice-overlay
- Intestazioni:
  - H1: Ciclo di vita dell'overlay vocale (macOS)
  - H2: Intento attuale
  - H2: Implementato (9 dicembre 2025)
  - H2: Passaggi successivi
  - H2: Checklist di debug
  - H2: Passaggi di migrazione (suggeriti)
  - H2: Correlati

## platforms/mac/voicewake.md

- Route: /platforms/mac/voicewake
- Intestazioni:
  - H1: Attivazione vocale &amp; Push-to-Talk
  - H2: Requisiti
  - H2: Modalità
  - H2: Comportamento runtime (parola di attivazione)
  - H2: Invarianti del ciclo di vita
  - H2: Modalità di errore dell'overlay persistente (precedente)
  - H2: Specifiche del push-to-talk
  - H2: Impostazioni rivolte all'utente
  - H2: Comportamento di inoltro
  - H2: Payload di inoltro
  - H2: Verifica rapida
  - H2: Correlati

## platforms/mac/webchat.md

- Route: /platforms/mac/webchat
- Intestazioni:
  - H2: Avvio e debug
  - H2: Come è collegato
  - H2: Superficie di sicurezza
  - H2: Limitazioni note
  - H2: Correlati

## platforms/mac/xpc.md

- Route: /platforms/mac/xpc
- Intestazioni:
  - H1: Architettura IPC macOS di OpenClaw
  - H2: Obiettivi
  - H2: Come funziona
  - H3: Gateway + trasporto node
  - H3: Servizio Node + IPC dell'app
  - H3: PeekabooBridge (automazione UI)
  - H2: Flussi operativi
  - H2: Note di hardening
  - H2: Correlati

## platforms/macos.md

- Route: /platforms/macos
- Intestazioni:
  - H2: Download
  - H2: Primo avvio
  - H2: Scegli una modalità Gateway
  - H2: Cosa possiede l'app
  - H2: Pagine di dettaglio macOS
  - H2: Correlati

## platforms/oracle.md

- Route: /platforms/oracle
- Intestazioni:
  - H2: Correlati

## platforms/raspberry-pi.md

- Route: /platforms/raspberry-pi
- Intestazioni:
  - H2: Correlati

## platforms/windows.md

- Route: /platforms/windows
- Intestazioni:
  - H2: Consigliato: Windows Hub
  - H3: Cosa include Windows Hub
  - H3: Primo avvio
  - H2: Modalità nodo Windows
  - H2: Modalità MCP locale
  - H2: CLI e Gateway nativi per Windows
  - H2: Gateway WSL2
  - H2: Avvio automatico del Gateway prima dell'accesso a Windows
  - H2: Esporre i servizi WSL sulla LAN
  - H2: Risoluzione dei problemi
  - H3: L'icona nella tray non appare
  - H3: La configurazione locale non riesce
  - H3: L'app indica che è necessario l'abbinamento
  - H3: La chat web non riesce a raggiungere un Gateway remoto
  - H3: I comandi screen.snapshot, camera o audio non riescono
  - H3: La connettività Git o GitHub non riesce
  - H2: Correlati

## plugins/adding-capabilities.md

- Route: /plugins/adding-capabilities
- Intestazioni:
  - H2: Quando creare una funzionalità
  - H2: La sequenza standard
  - H2: Cosa va dove
  - H2: Punti di integrazione per provider e harness
  - H2: Checklist dei file
  - H2: Esempio pratico: generazione di immagini
  - H2: Provider di embedding
  - H2: Checklist di revisione
  - H2: Correlati

## plugins/admin-http-rpc.md

- Route: /plugins/admin-http-rpc
- Intestazioni:
  - H2: Prima di abilitarlo
  - H2: Abilita
  - H2: Verifica la route
  - H2: Autenticazione
  - H2: Modello di sicurezza
  - H2: Richiesta
  - H2: Risposta
  - H2: Metodi consentiti
  - H2: Confronto WebSocket
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/agent-tools.md

- Route: /plugins/agent-tools
- Intestazioni:
  - H2: Correlati

## plugins/architecture-internals.md

- Route: /plugins/architecture-internals
- Intestazioni:
  - H2: Pipeline di caricamento
  - H3: Comportamento manifest-first
  - H3: Confine della cache dei Plugin
  - H2: Modello di registro
  - H2: Callback di associazione delle conversazioni
  - H2: Hook runtime del provider
  - H3: Ordine e utilizzo degli hook
  - H3: Esempio di provider
  - H3: Esempi integrati
  - H2: Helper runtime
  - H3: api.runtime.imageGeneration
  - H2: Route HTTP del Gateway
  - H2: Percorsi di importazione del Plugin SDK
  - H2: Schemi degli strumenti di messaggistica
  - H2: Risoluzione della destinazione del canale
  - H2: Directory basate su configurazione
  - H2: Cataloghi dei provider
  - H2: Ispezione dei canali in sola lettura
  - H2: Pacchetti di bundle
  - H3: Metadati del catalogo canali
  - H2: Plugin del motore di contesto
  - H2: Aggiunta di una nuova funzionalità
  - H3: Checklist delle funzionalità
  - H3: Template di funzionalità
  - H2: Correlati

## plugins/architecture.md

- Route: /plugins/architecture
- Intestazioni:
  - H2: Modello pubblico delle funzionalità
  - H3: Posizione sulla compatibilità esterna
  - H3: Forme dei Plugin
  - H3: Hook legacy
  - H3: Segnali di compatibilità
  - H2: Panoramica dell'architettura
  - H3: Snapshot dei metadati dei Plugin e tabella di lookup
  - H3: Pianificazione dell'attivazione
  - H3: Plugin di canale e strumento di messaggistica condiviso
  - H2: Modello di proprietà delle funzionalità
  - H3: Stratificazione delle funzionalità
  - H3: Esempio di Plugin aziendale multi-funzionalità
  - H3: Esempio di funzionalità: comprensione video
  - H2: Contratti e applicazione
  - H3: Cosa appartiene a un contratto
  - H2: Modello di esecuzione
  - H2: Confine di esportazione
  - H2: Interni e riferimento
  - H2: Correlati

## plugins/building-extensions.md

- Route: /plugins/building-extensions
- Intestazioni:
  - H2: Correlati

## plugins/building-plugins.md

- Route: /plugins/building-plugins
- Intestazioni:
  - H2: Requisiti
  - H2: Scegli la forma del Plugin
  - H2: Avvio rapido
  - H2: Registrazione degli strumenti
  - H2: Convenzioni di importazione
  - H2: Checklist prima dell'invio
  - H2: Test con le release beta
  - H2: Passaggi successivi
  - H2: Correlati

## plugins/bundles.md

- Route: /plugins/bundles
- Intestazioni:
  - H2: Perché esistono i bundle
  - H2: Installa un bundle
  - H2: Cosa OpenClaw mappa dai bundle
  - H3: Supportato ora
  - H4: Contenuto delle Skills
  - H4: Pacchetti di hook
  - H4: MCP per OpenClaw incorporato
  - H4: Impostazioni di OpenClaw incorporato
  - H4: LSP di OpenClaw incorporato
  - H3: Rilevato ma non eseguito
  - H2: Formati dei bundle
  - H2: Precedenza di rilevamento
  - H2: Dipendenze runtime e pulizia
  - H2: Sicurezza
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/cli-backend-plugins.md

- Route: /plugins/cli-backend-plugins
- Intestazioni:
  - H2: Cosa possiede il Plugin
  - H2: Plugin backend minimo
  - H2: Forma della configurazione
  - H2: Hook backend avanzati
  - H3: ownsNativeCompaction: disattivazione della Compaction di OpenClaw
  - H2: Bridge degli strumenti MCP
  - H2: Configurazione utente
  - H2: Verifica
  - H2: Checklist
  - H2: Correlati

## plugins/codex-computer-use.md

- Route: /plugins/codex-computer-use
- Intestazioni:
  - H2: OpenClaw.app e Peekaboo
  - H2: App iOS
  - H2: MCP cua-driver diretto
  - H2: Configurazione rapida
  - H2: Comandi
  - H2: Scelte del marketplace
  - H2: Marketplace macOS in bundle
  - H2: Limite del catalogo remoto
  - H2: Riferimento di configurazione
  - H2: Cosa controlla OpenClaw
  - H2: Autorizzazioni macOS
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/codex-harness-reference.md

- Route: /plugins/codex-harness-reference
- Intestazioni:
  - H2: Superficie di configurazione del Plugin
  - H2: Trasporto app-server
  - H2: Modalità di approvazione e sandbox
  - H2: Esecuzione nativa in sandbox
  - H2: Isolamento di autenticazione e ambiente
  - H2: Strumenti dinamici
  - H2: Timeout
  - H2: Rilevamento del modello
  - H2: File di bootstrap dell'area di lavoro
  - H2: Override dell'ambiente
  - H2: Correlati

## plugins/codex-harness-runtime.md

- Route: /plugins/codex-harness-runtime
- Intestazioni:
  - H2: Panoramica
  - H2: Associazioni dei thread e modifiche del modello
  - H2: Risposte visibili e Heartbeat
  - H2: Confini degli hook
  - H2: Contratto di supporto V1
  - H2: Autorizzazioni native e sollecitazioni MCP
  - H2: Instradamento della coda
  - H2: Caricamento del feedback Codex
  - H2: Compaction e mirror della trascrizione
  - H2: Media e consegna
  - H2: Correlati

## plugins/codex-harness.md

- Route: /plugins/codex-harness
- Intestazioni:
  - H2: Requisiti
  - H2: Avvio rapido
  - H2: Condividi thread con Codex Desktop e CLI
  - H2: Configurazione
  - H2: Verifica il runtime Codex
  - H2: Instradamento e selezione del modello
  - H2: Pattern di distribuzione
  - H3: Distribuzione Codex di base
  - H3: Distribuzione con provider misti
  - H3: Distribuzione Codex fail-closed
  - H2: Policy app-server
  - H2: Comandi e diagnostica
  - H3: Ispeziona i thread Codex localmente
  - H2: Plugin nativi Codex
  - H2: Computer Use
  - H2: Confini runtime
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/codex-native-plugins.md

- Route: /plugins/codex-native-plugins
- Intestazioni:
  - H2: Requisiti
  - H2: Avvio rapido
  - H2: Gestisci i Plugin dalla chat
  - H2: Come funziona la configurazione dei Plugin nativi
  - H2: Confine di supporto V1
  - H2: Inventario e proprietà delle app
  - H2: Configurazione app dei thread
  - H2: Policy sulle azioni distruttive
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/community.md

- Route: /plugins/community
- Intestazioni:
  - H2: Trova Plugin
  - H2: Pubblica Plugin
  - H2: Correlati

## plugins/compatibility.md

- Route: /plugins/compatibility
- Intestazioni:
  - H2: Registro di compatibilità
  - H2: Pacchetto ispettore Plugin
  - H3: Corsia di accettazione del maintainer
  - H2: Policy di deprecazione
  - H2: Aree di compatibilità attuali
  - H3: Alias piatti per callback in ingresso WhatsApp
  - H3: Campi di ammissione in ingresso WhatsApp
  - H2: Note di rilascio

## plugins/copilot.md

- Route: /plugins/copilot
- Intestazioni:
  - H2: Requisiti
  - H2: Installazione del Plugin
  - H2: Avvio rapido
  - H2: Provider supportati
  - H2: BYOK
  - H2: Autenticazione
  - H2: Superficie di configurazione
  - H2: Compaction
  - H2: Mirroring della trascrizione
  - H2: Domande secondarie (/btw)
  - H2: Doctor
  - H2: Limitazioni
  - H2: Autorizzazioni e askuser
  - H3: Token GitHub a livello di sessione
  - H2: Correlati

## plugins/dependency-resolution.md

- Route: /plugins/dependency-resolution
- Intestazioni:
  - H2: Suddivisione delle responsabilità
  - H2: Root di installazione
  - H2: Plugin locali
  - H2: Avvio e ricaricamento
  - H2: Plugin in bundle
  - H2: Pulizia legacy

## plugins/google-meet.md

- Percorso: /plugins/google-meet
- Intestazioni:
  - H2: Avvio rapido
  - H3: Gateway locale + Chrome in Parallels
  - H2: Note di installazione
  - H2: Trasporti
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth e preflight
  - H3: Crea credenziali Google
  - H3: Genera il token di aggiornamento
  - H3: Verifica OAuth con doctor
  - H2: Configurazione
  - H2: Strumento
  - H2: Modalità agente e bidi
  - H2: Checklist del test live
  - H2: Risoluzione dei problemi
  - H3: L'agente non vede lo strumento Google Meet
  - H3: Nessun nodo compatibile con Google Meet connesso
  - H3: Il browser si apre ma l'agente non riesce a partecipare
  - H3: La creazione della riunione non riesce
  - H3: L'agente partecipa ma non parla
  - H3: I controlli di configurazione di Twilio non riescono
  - H3: La chiamata Twilio parte ma non entra mai nella riunione
  - H2: Note
  - H2: Correlati

## plugins/hooks.md

- Percorso: /plugins/hooks
- Intestazioni:
  - H2: Avvio rapido
  - H2: Catalogo degli hook
  - H2: Debug degli hook di runtime
  - H2: Criteri per le chiamate agli strumenti
  - H3: Hook dell'ambiente di esecuzione
  - H3: Persistenza dei risultati degli strumenti
  - H2: Hook di prompt e modello
  - H3: Estensioni di sessione e iniezioni nel turno successivo
  - H2: Hook dei messaggi
  - H2: Hook di installazione
  - H2: Ciclo di vita del Gateway
  - H2: Deprecazioni in arrivo
  - H2: Correlati

## plugins/install-overrides.md

- Percorso: /plugins/install-overrides
- Intestazioni:
  - H2: Ambiente
  - H2: Comportamento
  - H2: E2E del pacchetto

## plugins/llama-cpp.md

- Percorso: /plugins/llama-cpp
- Intestazioni:
  - H2: Configurazione
  - H2: Runtime nativo

## plugins/manage-plugins.md

- Percorso: /plugins/manage-plugins
- Intestazioni:
  - H2: Elenca e cerca Plugin
  - H2: Installa Plugin
  - H2: Riavvia e ispeziona
  - H2: Aggiorna Plugin
  - H2: Disinstalla Plugin
  - H2: Scegli una sorgente
  - H2: Pubblica Plugin
  - H2: Correlati

## plugins/manifest.md

- Percorso: /plugins/manifest
- Intestazioni:
  - H2: Cosa fa questo file
  - H2: Esempio minimo
  - H2: Esempio completo
  - H2: Riferimento dei campi di primo livello
  - H2: Riferimento dei metadati del provider di generazione
  - H2: Riferimento dei metadati dello strumento
  - H2: Riferimento providerAuthChoices
  - H2: Riferimento commandAliases
  - H2: Riferimento activation
  - H2: Riferimento qaRunners
  - H2: Riferimento setup
  - H3: Riferimento setup.providers
  - H3: Campi setup
  - H2: Riferimento uiHints
  - H2: Riferimento contracts
  - H2: Riferimento mediaUnderstandingProviderMetadata
  - H2: Riferimento channelConfigs
  - H3: Sostituzione di un altro Plugin di canale
  - H2: Riferimento modelSupport
  - H2: Riferimento modelCatalog
  - H2: Riferimento modelIdNormalization
  - H2: Riferimento providerEndpoints
  - H2: Riferimento providerRequest
  - H2: Riferimento secretProviderIntegrations
  - H2: Riferimento modelPricing
  - H3: Indice dei provider OpenClaw
  - H2: Manifest rispetto a package.json
  - H3: Campi package.json che influiscono sulla scoperta
  - H2: Precedenza della scoperta (ID Plugin duplicati)
  - H2: Requisiti di JSON Schema
  - H2: Comportamento di validazione
  - H2: Note
  - H2: Correlati

## plugins/memory-lancedb.md

- Percorso: /plugins/memory-lancedb
- Intestazioni:
  - H2: Installazione
  - H2: Avvio rapido
  - H2: Embedding supportati da provider
  - H2: Embedding Ollama
  - H2: Provider compatibili con OpenAI
  - H2: Limiti di richiamo e acquisizione
  - H2: Comandi
  - H2: Archiviazione
  - H2: Dipendenze di runtime
  - H2: Risoluzione dei problemi
  - H3: La lunghezza dell'input supera la lunghezza del contesto
  - H3: Modello di embedding non supportato
  - H3: Il Plugin si carica ma non compare alcuna memoria
  - H2: Correlati

## plugins/memory-wiki.md

- Percorso: /plugins/memory-wiki
- Intestazioni:
  - H2: Cosa aggiunge
  - H2: Come si integra con la memoria
  - H2: Pattern ibrido consigliato
  - H2: Modalità vault
  - H3: isolata
  - H3: bridge
  - H3: unsafe-local
  - H2: Struttura del vault
  - H2: Importazioni Open Knowledge Format
  - H2: Asserzioni strutturate e prove
  - H2: Metadati delle entità esposti all'agente
  - H2: Pipeline di compilazione
  - H2: Dashboard e report di integrità
  - H2: Ricerca e recupero
  - H2: Strumenti dell'agente
  - H2: Comportamento di prompt e contesto
  - H2: Configurazione
  - H3: Esempio: QMD + modalità bridge
  - H2: CLI
  - H2: Supporto Obsidian
  - H2: Flusso di lavoro consigliato
  - H2: Documenti correlati

## plugins/message-presentation.md

- Percorso: /plugins/message-presentation
- Intestazioni:
  - H2: Contratto
  - H2: Esempi di producer
  - H2: Contratto del renderer
  - H2: Flusso di rendering core
  - H2: Regole di degradazione
  - H3: Visibilità del fallback del valore del pulsante
  - H2: Mappatura del provider
  - H2: Presentation rispetto a InteractiveReply
  - H2: Pin di recapito
  - H2: Checklist per autori di Plugin
  - H2: Documenti correlati

## plugins/oc-path.md

- Percorso: /plugins/oc-path
- Intestazioni:
  - H2: Perché abilitarlo
  - H2: Dove viene eseguito
  - H2: Abilita
  - H2: Dipendenze
  - H2: Cosa fornisce
  - H2: Relazione con altri Plugin
  - H2: Sicurezza
  - H2: Correlati

## plugins/plugin-inventory.md

- Percorso: /plugins/plugin-inventory
- Intestazioni:
  - H1: Inventario dei Plugin
  - H2: Definizioni
  - H2: Installa un Plugin
  - H2: Pacchetto npm core
  - H2: Pacchetti esterni ufficiali
  - H2: Solo checkout del sorgente

## plugins/plugin-permission-requests.md

- Percorso: /plugins/plugin-permission-requests
- Intestazioni:
  - H2: Scegli il gate corretto
  - H2: Richiedi approvazione prima di una chiamata a uno strumento
  - H2: Comportamento decisionale
  - H2: Instrada le richieste di approvazione
  - H2: Autorizzazioni native Codex
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/reference.md

- Percorso: /plugins/reference
- Intestazioni:
  - H1: Riferimento dei Plugin

## plugins/reference/acpx.md

- Percorso: /plugins/reference/acpx
- Intestazioni:
  - H1: Plugin ACPx
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/admin-http-rpc.md

- Percorso: /plugins/reference/admin-http-rpc
- Intestazioni:
  - H1: Plugin Admin Http Rpc
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/alibaba.md

- Percorso: /plugins/reference/alibaba
- Intestazioni:
  - H1: Plugin Alibaba
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/amazon-bedrock-mantle.md

- Percorso: /plugins/reference/amazon-bedrock-mantle
- Intestazioni:
  - H1: Plugin Amazon Bedrock Mantle
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/amazon-bedrock.md

- Percorso: /plugins/reference/amazon-bedrock
- Intestazioni:
  - H1: Plugin Amazon Bedrock
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/anthropic-vertex.md

- Percorso: /plugins/reference/anthropic-vertex
- Intestazioni:
  - H1: Plugin Anthropic Vertex
  - H2: Distribuzione
  - H2: Superficie
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- Percorso: /plugins/reference/anthropic
- Intestazioni:
  - H1: Plugin Anthropic
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/arcee.md

- Percorso: /plugins/reference/arcee
- Intestazioni:
  - H1: Plugin Arcee
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/azure-speech.md

- Percorso: /plugins/reference/azure-speech
- Intestazioni:
  - H1: Plugin Azure Speech
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/bonjour.md

- Percorso: /plugins/reference/bonjour
- Intestazioni:
  - H1: Plugin Bonjour
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/brave.md

- Percorso: /plugins/reference/brave
- Intestazioni:
  - H1: Plugin Brave
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/browser.md

- Percorso: /plugins/reference/browser
- Intestazioni:
  - H1: Plugin Browser
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/byteplus.md

- Percorso: /plugins/reference/byteplus
- Intestazioni:
  - H1: Plugin BytePlus
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/canvas.md

- Percorso: /plugins/reference/canvas
- Intestazioni:
  - H1: Plugin Canvas
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/cerebras.md

- Percorso: /plugins/reference/cerebras
- Intestazioni:
  - H1: Plugin Cerebras
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/chutes.md

- Percorso: /plugins/reference/chutes
- Intestazioni:
  - H1: Plugin Chutes
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/clawrouter.md

- Percorso: /plugins/reference/clawrouter
- Intestazioni:
  - H1: Plugin ClawRouter
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/clickclack.md

- Percorso: /plugins/reference/clickclack
- Intestazioni:
  - H1: Plugin Clickclack
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/cloudflare-ai-gateway.md

- Percorso: /plugins/reference/cloudflare-ai-gateway
- Intestazioni:
  - H1: Plugin Cloudflare AI Gateway
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/codex-supervisor.md

- Percorso: /plugins/reference/codex-supervisor
- Intestazioni:
  - H1: Plugin Codex Supervisor
  - H2: Distribuzione
  - H2: Superficie
  - H2: Elenco delle sessioni

## plugins/reference/codex.md

- Percorso: /plugins/reference/codex
- Intestazioni:
  - H1: Plugin Codex
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/cohere.md

- Percorso: /plugins/reference/cohere
- Intestazioni:
  - H1: Plugin Cohere
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/comfy.md

- Percorso: /plugins/reference/comfy
- Intestazioni:
  - H1: Plugin ComfyUI
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/copilot-proxy.md

- Percorso: /plugins/reference/copilot-proxy
- Intestazioni:
  - H1: Plugin Copilot Proxy
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/copilot.md

- Percorso: /plugins/reference/copilot
- Intestazioni:
  - H1: Plugin Copilot
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/deepgram.md

- Percorso: /plugins/reference/deepgram
- Intestazioni:
  - H1: Plugin Deepgram
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/deepinfra.md

- Percorso: /plugins/reference/deepinfra
- Intestazioni:
  - H1: Plugin DeepInfra
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/deepseek.md

- Percorso: /plugins/reference/deepseek
- Intestazioni:
  - H1: Plugin DeepSeek
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/diagnostics-otel.md

- Percorso: /plugins/reference/diagnostics-otel
- Intestazioni:
  - H1: Plugin Diagnostics OpenTelemetry
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/diagnostics-prometheus.md

- Percorso: /plugins/reference/diagnostics-prometheus
- Intestazioni:
  - H1: Plugin Diagnostics Prometheus
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/diffs-language-pack.md

- Percorso: /plugins/reference/diffs-language-pack
- Intestazioni:
  - H1: Plugin Diffs Language Pack
  - H2: Distribuzione
  - H2: Superficie
  - H2: Lingue aggiunte

## plugins/reference/diffs.md

- Percorso: /plugins/reference/diffs
- Intestazioni:
  - H1: Plugin Diffs
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/discord.md

- Percorso: /plugins/reference/discord
- Intestazioni:
  - H1: Plugin Discord
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/document-extract.md

- Percorso: /plugins/reference/document-extract
- Intestazioni:
  - H1: Plugin Document Extract
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/duckduckgo.md

- Percorso: /plugins/reference/duckduckgo
- Intestazioni:
  - H1: Plugin DuckDuckGo
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/elevenlabs.md

- Percorso: /plugins/reference/elevenlabs
- Intestazioni:
  - H1: Plugin Elevenlabs
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/exa.md

- Percorso: /plugins/reference/exa
- Intestazioni:
  - H1: Plugin Exa
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/fal.md

- Percorso: /plugins/reference/fal
- Intestazioni:
  - H1: Plugin fal
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/feishu.md

- Percorso: /plugins/reference/feishu
- Intestazioni:
  - H1: Plugin Feishu
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/file-transfer.md

- Percorso: /plugins/reference/file-transfer
- Intestazioni:
  - H1: Plugin File Transfer
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/firecrawl.md

- Percorso: /plugins/reference/firecrawl
- Intestazioni:
  - H1: Plugin Firecrawl
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/fireworks.md

- Percorso: /plugins/reference/fireworks
- Intestazioni:
  - H1: Plugin Fireworks
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/github-copilot.md

- Percorso: /plugins/reference/github-copilot
- Intestazioni:
  - H1: Plugin GitHub Copilot
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/gmi.md

- Percorso: /plugins/reference/gmi
- Intestazioni:
  - H1: Plugin Gmi
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/google-meet.md

- Percorso: /plugins/reference/google-meet
- Intestazioni:
  - H1: Plugin Google Meet
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/google.md

- Percorso: /plugins/reference/google
- Intestazioni:
  - H1: Plugin Google
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/googlechat.md

- Percorso: /plugins/reference/googlechat
- Intestazioni:
  - H1: Plugin Google Chat
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/gradium.md

- Percorso: /plugins/reference/gradium
- Intestazioni:
  - H1: Plugin Gradium
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/groq.md

- Percorso: /plugins/reference/groq
- Intestazioni:
  - H1: Plugin Groq
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/huggingface.md

- Percorso: /plugins/reference/huggingface
- Intestazioni:
  - H1: Plugin Hugging Face
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/imessage.md

- Percorso: /plugins/reference/imessage
- Intestazioni:
  - H1: Plugin iMessage
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/inworld.md

- Percorso: /plugins/reference/inworld
- Intestazioni:
  - H1: Plugin Inworld
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/irc.md

- Percorso: /plugins/reference/irc
- Intestazioni:
  - H1: Plugin IRC
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/kilocode.md

- Percorso: /plugins/reference/kilocode
- Intestazioni:
  - H1: Plugin Kilocode
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/kimi.md

- Percorso: /plugins/reference/kimi
- Intestazioni:
  - H1: Plugin Kimi
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/line.md

- Percorso: /plugins/reference/line
- Intestazioni:
  - H1: Plugin LINE
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/litellm.md

- Percorso: /plugins/reference/litellm
- Intestazioni:
  - H1: Plugin LiteLLM
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/llama-cpp.md

- Percorso: /plugins/reference/llama-cpp
- Intestazioni:
  - H1: Plugin Llama Cpp
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/llm-task.md

- Percorso: /plugins/reference/llm-task
- Intestazioni:
  - H1: Plugin LLM Task
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/lmstudio.md

- Percorso: /plugins/reference/lmstudio
- Intestazioni:
  - H1: Plugin LM Studio
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/lobster.md

- Percorso: /plugins/reference/lobster
- Intestazioni:
  - H1: Plugin Lobster
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/matrix.md

- Percorso: /plugins/reference/matrix
- Intestazioni:
  - H1: Plugin Matrix
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/mattermost.md

- Percorso: /plugins/reference/mattermost
- Intestazioni:
  - H1: Plugin Mattermost
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/memory-core.md

- Percorso: /plugins/reference/memory-core
- Intestazioni:
  - H1: Plugin Memory Core
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/memory-lancedb.md

- Percorso: /plugins/reference/memory-lancedb
- Intestazioni:
  - H1: Plugin Memory Lancedb
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/memory-wiki.md

- Percorso: /plugins/reference/memory-wiki
- Intestazioni:
  - H1: Plugin Memory Wiki
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/microsoft-foundry.md

- Percorso: /plugins/reference/microsoft-foundry
- Intestazioni:
  - H1: Plugin Microsoft Foundry
  - H2: Distribuzione
  - H2: Superficie
  - H2: Requisiti
  - H2: Modelli di chat
  - H2: Generazione di immagini MAI
  - H2: Risoluzione dei problemi

## plugins/reference/microsoft.md

- Percorso: /plugins/reference/microsoft
- Intestazioni:
  - H1: Plugin Microsoft
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/migrate-claude.md

- Percorso: /plugins/reference/migrate-claude
- Intestazioni:
  - H1: Plugin Migrate Claude
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/migrate-hermes.md

- Percorso: /plugins/reference/migrate-hermes
- Intestazioni:
  - H1: Plugin Migrate Hermes
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/minimax.md

- Percorso: /plugins/reference/minimax
- Intestazioni:
  - H1: Plugin MiniMax
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/mistral.md

- Percorso: /plugins/reference/mistral
- Intestazioni:
  - H1: Plugin Mistral
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/moonshot.md

- Percorso: /plugins/reference/moonshot
- Intestazioni:
  - H1: Plugin Moonshot
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/msteams.md

- Percorso: /plugins/reference/msteams
- Intestazioni:
  - H1: Plugin Microsoft Teams
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/nextcloud-talk.md

- Percorso: /plugins/reference/nextcloud-talk
- Intestazioni:
  - H1: Plugin Nextcloud Talk
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/nostr.md

- Percorso: /plugins/reference/nostr
- Intestazioni:
  - H1: Plugin Nostr
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/novita.md

- Percorso: /plugins/reference/novita
- Intestazioni:
  - H1: Plugin Novita
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/nvidia.md

- Percorso: /plugins/reference/nvidia
- Intestazioni:
  - H1: Plugin NVIDIA
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/oc-path.md

- Percorso: /plugins/reference/oc-path
- Intestazioni:
  - H1: Plugin Oc Path
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/ollama.md

- Percorso: /plugins/reference/ollama
- Intestazioni:
  - H1: Plugin Ollama
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/open-prose.md

- Percorso: /plugins/reference/open-prose
- Intestazioni:
  - H1: Plugin Open Prose
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/openai.md

- Percorso: /plugins/reference/openai
- Intestazioni:
  - H1: Plugin OpenAI
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/opencode-go.md

- Percorso: /plugins/reference/opencode-go
- Intestazioni:
  - H1: Plugin OpenCode Go
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/opencode.md

- Percorso: /plugins/reference/opencode
- Intestazioni:
  - H1: Plugin OpenCode
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/openrouter.md

- Percorso: /plugins/reference/openrouter
- Intestazioni:
  - H1: Plugin OpenRouter
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/openshell.md

- Percorso: /plugins/reference/openshell
- Intestazioni:
  - H1: Plugin Openshell
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/perplexity.md

- Percorso: /plugins/reference/perplexity
- Intestazioni:
  - H1: Plugin Perplexity
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/pixverse.md

- Percorso: /plugins/reference/pixverse
- Intestazioni:
  - H1: Plugin PixVerse
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/policy.md

- Percorso: /plugins/reference/policy
- Intestazioni:
  - H1: Plugin Policy
  - H2: Distribuzione
  - H2: Superficie
  - H2: Comportamento
  - H2: Documentazione correlata

## plugins/reference/qa-channel.md

- Percorso: /plugins/reference/qa-channel
- Intestazioni:
  - H1: Plugin QA Channel
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/qa-lab.md

- Percorso: /plugins/reference/qa-lab
- Intestazioni:
  - H1: Plugin QA Lab
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/qa-matrix.md

- Percorso: /plugins/reference/qa-matrix
- Intestazioni:
  - H1: Plugin QA Matrix
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/qianfan.md

- Percorso: /plugins/reference/qianfan
- Intestazioni:
  - H1: Plugin Qianfan
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/qqbot.md

- Percorso: /plugins/reference/qqbot
- Intestazioni:
  - H1: Plugin QQ Bot
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/qwen.md

- Percorso: /plugins/reference/qwen
- Intestazioni:
  - H1: Plugin Qwen
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/raft.md

- Percorso: /plugins/reference/raft
- Intestazioni:
  - H1: Plugin Raft
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/runway.md

- Percorso: /plugins/reference/runway
- Intestazioni:
  - H1: Plugin Runway
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/searxng.md

- Percorso: /plugins/reference/searxng
- Intestazioni:
  - H1: Plugin SearXNG
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/senseaudio.md

- Percorso: /plugins/reference/senseaudio
- Intestazioni:
  - H1: Plugin Senseaudio
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/sglang.md

- Percorso: /plugins/reference/sglang
- Intestazioni:
  - H1: Plugin SGLang
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/signal.md

- Percorso: /plugins/reference/signal
- Intestazioni:
  - H1: Plugin Signal
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/slack.md

- Percorso: /plugins/reference/slack
- Intestazioni:
  - H1: Plugin Slack
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/sms.md

- Percorso: /plugins/reference/sms
- Intestazioni:
  - H1: Plugin Sms
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/stepfun.md

- Percorso: /plugins/reference/stepfun
- Intestazioni:
  - H1: Plugin StepFun
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/synology-chat.md

- Percorso: /plugins/reference/synology-chat
- Intestazioni:
  - H1: Plugin Synology Chat
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/synthetic.md

- Percorso: /plugins/reference/synthetic
- Intestazioni:
  - H1: Plugin Synthetic
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/tavily.md

- Percorso: /plugins/reference/tavily
- Intestazioni:
  - H1: Plugin Tavily
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/telegram.md

- Percorso: /plugins/reference/telegram
- Intestazioni:
  - H1: Plugin Telegram
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/tencent.md

- Percorso: /plugins/reference/tencent
- Intestazioni:
  - H1: Plugin Tencent
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/tlon.md

- Percorso: /plugins/reference/tlon
- Intestazioni:
  - H1: Plugin Tlon
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/together.md

- Percorso: /plugins/reference/together
- Intestazioni:
  - H1: Plugin Together
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/tokenjuice.md

- Percorso: /plugins/reference/tokenjuice
- Intestazioni:
  - H1: Plugin Tokenjuice
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/tts-local-cli.md

- Percorso: /plugins/reference/tts-local-cli
- Intestazioni:
  - H1: Plugin TTS Local CLI
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/twitch.md

- Percorso: /plugins/reference/twitch
- Intestazioni:
  - H1: Plugin Twitch
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/venice.md

- Percorso: /plugins/reference/venice
- Intestazioni:
  - H1: Plugin Venice
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/vercel-ai-gateway.md

- Percorso: /plugins/reference/vercel-ai-gateway
- Intestazioni:
  - H1: Plugin Vercel AI Gateway
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/vllm.md

- Percorso: /plugins/reference/vllm
- Intestazioni:
  - H1: Plugin vLLM
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/voice-call.md

- Percorso: /plugins/reference/voice-call
- Intestazioni:
  - H1: Plugin Voice Call
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/volcengine.md

- Percorso: /plugins/reference/volcengine
- Intestazioni:
  - H1: Plugin Volcengine
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/voyage.md

- Percorso: /plugins/reference/voyage
- Intestazioni:
  - H1: Plugin Voyage
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/vydra.md

- Percorso: /plugins/reference/vydra
- Intestazioni:
  - H1: Plugin Vydra
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/web-readability.md

- Percorso: /plugins/reference/web-readability
- Intestazioni:
  - H1: Plugin Web Readability
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/webhooks.md

- Percorso: /plugins/reference/webhooks
- Intestazioni:
  - H1: Plugin Webhooks
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/whatsapp.md

- Percorso: /plugins/reference/whatsapp
- Intestazioni:
  - H1: Plugin WhatsApp
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/workboard.md

- Percorso: /plugins/reference/workboard
- Intestazioni:
  - H1: Plugin Workboard
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/xai.md

- Percorso: /plugins/reference/xai
- Intestazioni:
  - H1: Plugin xAI
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/xiaomi.md

- Percorso: /plugins/reference/xiaomi
- Intestazioni:
  - H1: Plugin Xiaomi
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/zai.md

- Percorso: /plugins/reference/zai
- Intestazioni:
  - H1: Plugin Z.AI
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/zalo.md

- Percorso: /plugins/reference/zalo
- Intestazioni:
  - H1: Plugin Zalo
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/zalouser.md

- Percorso: /plugins/reference/zalouser
- Intestazioni:
  - H1: Plugin Zalo Personal
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/sdk-agent-harness.md

- Percorso: /plugins/sdk-agent-harness
- Intestazioni:
  - H2: Quando usare un harness
  - H2: Cosa resta di proprietà del core
  - H2: Registrare un harness
  - H2: Criterio di selezione
  - H2: Abbinamento tra provider e harness
  - H3: Middleware dei risultati degli strumenti
  - H3: Classificazione dell'esito terminale
  - H3: Effetti collaterali lato fine agente
  - H3: Input utente e superfici degli strumenti
  - H3: Modalità harness Codex nativa
  - H2: Rigidità del runtime
  - H2: Sessioni native e mirror della trascrizione
  - H2: Risultati di strumenti e media
  - H2: Limitazioni attuali
  - H2: Correlati

## plugins/sdk-channel-inbound.md

- Percorso: /plugins/sdk-channel-inbound
- Intestazioni:
  - H2: Helper del core
  - H2: Migrazione

## plugins/sdk-channel-ingress.md

- Percorso: /plugins/sdk-channel-ingress
- Intestazioni:
  - H1: API di ingresso del canale
  - H2: Risolutore runtime
  - H2: Risultato
  - H2: Gruppi di accesso
  - H2: Modalità evento
  - H2: Route e attivazione
  - H2: Redazione
  - H2: Verifica

## plugins/sdk-channel-message.md

- Percorso: /plugins/sdk-channel-message
- Intestazioni: nessuna

## plugins/sdk-channel-outbound.md

- Percorso: /plugins/sdk-channel-outbound
- Intestazioni:
  - H2: Adapter
  - H2: Adapter in uscita esistenti
  - H2: Invii durevoli
  - H2: Dispatch di compatibilità

## plugins/sdk-channel-plugins.md

- Percorso: /plugins/sdk-channel-plugins
- Intestazioni:
  - H2: Come funzionano i Plugin di canale
  - H2: Approvazioni e capacità del canale
  - H2: Criterio per le menzioni in ingresso
  - H2: Procedura guidata
  - H2: Struttura dei file
  - H2: Argomenti avanzati
  - H2: Passaggi successivi
  - H2: Correlati

## plugins/sdk-channel-turn.md

- Percorso: /plugins/sdk-channel-turn
- Intestazioni: nessuna

## plugins/sdk-entrypoints.md

- Percorso: /plugins/sdk-entrypoints
- Intestazioni:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Modalità di registrazione
  - H2: Forme dei Plugin
  - H2: Correlati

## plugins/sdk-migration.md

- Percorso: /plugins/sdk-migration
- Intestazioni:
  - H2: Cosa cambia
  - H2: Perché è cambiato
  - H2: Piano di migrazione per conversazione e voce in tempo reale
  - H2: Criterio di compatibilità
  - H2: Come migrare
  - H2: Riferimento dei percorsi di importazione
  - H2: Deprecazioni attive
  - H2: Tempistica di rimozione
  - H2: Sopprimere temporaneamente gli avvisi
  - H2: Correlati

## plugins/sdk-overview.md

- Percorso: /plugins/sdk-overview
- Intestazioni:
  - H2: Convenzione di importazione
  - H2: Riferimento dei sottopercorsi
  - H2: API di registrazione
  - H3: Registrazione delle capacità
  - H3: Strumenti e comandi
  - H3: Infrastruttura
  - H3: Hook host per Plugin di workflow
  - H3: Registrazione del rilevamento Gateway
  - H3: Metadati di registrazione CLI
  - H3: Registrazione del backend CLI
  - H3: Slot esclusivi
  - H3: Adapter di embedding memoria deprecati
  - H3: Eventi e ciclo di vita
  - H3: Semantica delle decisioni degli hook
  - H3: Campi dell'oggetto API
  - H2: Convenzione dei moduli interni
  - H2: Correlati

## plugins/sdk-provider-plugins.md

- Percorso: /plugins/sdk-provider-plugins
- Intestazioni:
  - H2: Procedura guidata
  - H2: Pubblicare su ClawHub
  - H2: Struttura dei file
  - H2: Riferimento dell'ordine del catalogo
  - H2: Passaggi successivi
  - H2: Correlati

## plugins/sdk-runtime.md

- Percorso: /plugins/sdk-runtime
- Intestazioni:
  - H2: Caricamento e scritture della configurazione
  - H2: Utility runtime riutilizzabili
  - H2: Namespace runtime
  - H2: Archiviazione dei riferimenti runtime
  - H2: Altri campi API di primo livello
  - H2: Correlati

## plugins/sdk-setup.md

- Percorso: /plugins/sdk-setup
- Intestazioni:
  - H2: Metadati del pacchetto
  - H3: Campi openclaw
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Caricamento completo differito
  - H2: Manifest del Plugin
  - H2: Pubblicazione su ClawHub
  - H2: Voce di configurazione
  - H3: Importazioni strette degli helper di configurazione
  - H3: Promozione di account singolo di proprietà del canale
  - H2: Schema di configurazione
  - H3: Creazione di schemi di configurazione del canale
  - H2: Wizard di configurazione
  - H2: Pubblicazione e installazione
  - H2: Correlati

## plugins/sdk-subpaths.md

- Percorso: /plugins/sdk-subpaths
- Intestazioni:
  - H2: Voce del Plugin
  - H3: Compatibilità deprecata e helper di test
  - H3: Sottopercorsi helper riservati dei Plugin in bundle
  - H2: Correlati

## plugins/sdk-testing.md

- Percorso: /plugins/sdk-testing
- Intestazioni:
  - H2: Utility di test
  - H3: Export disponibili
  - H3: Tipi
  - H2: Test della risoluzione del target
  - H2: Pattern di test
  - H3: Test dei contratti di registrazione
  - H3: Test dell'accesso alla configurazione runtime
  - H3: Test unitario di un Plugin di canale
  - H3: Test unitario di un Plugin provider
  - H3: Mock del runtime dei Plugin
  - H3: Test con stub per istanza
  - H2: Test di contratto (Plugin nel repository)
  - H3: Esecuzione di test con ambito
  - H2: Applicazione del lint (Plugin nel repository)
  - H2: Configurazione dei test
  - H2: Correlati

## plugins/tool-plugins.md

- Percorso: /plugins/tool-plugins
- Intestazioni:
  - H2: Requisiti
  - H2: Avvio rapido
  - H2: Scrivere uno strumento
  - H2: Strumenti opzionali e factory
  - H2: Valori restituiti
  - H2: Configurazione
  - H2: Metadati generati
  - H2: Metadati del pacchetto
  - H2: Validare in CI
  - H2: Installare e ispezionare localmente
  - H2: Pubblicare
  - H2: Risoluzione dei problemi
  - H3: voce Plugin non trovata: ./dist/index.js
  - H3: la voce Plugin non espone metadati defineToolPlugin
  - H3: i metadati generati openclaw.plugin.json sono obsoleti
  - H3: package.json openclaw.extensions deve includere ./dist/index.js
  - H3: Impossibile trovare il pacchetto 'typebox'
  - H3: Lo strumento non appare dopo l'installazione
  - H2: Vedi anche

## plugins/voice-call.md

- Percorso: /plugins/voice-call
- Intestazioni:
  - H2: Avvio rapido
  - H2: Configurazione
  - H2: Ambito della sessione
  - H2: Conversazioni vocali in tempo reale
  - H3: Criterio degli strumenti
  - H3: Contesto vocale dell'agente
  - H3: Esempi di provider in tempo reale
  - H2: Trascrizione in streaming
  - H3: Esempi di provider streaming
  - H2: TTS per le chiamate
  - H3: Esempi di TTS
  - H2: Chiamate in ingresso
  - H3: Routing per numero
  - H3: Contratto dell'output parlato
  - H3: Comportamento di avvio della conversazione
  - H3: Periodo di tolleranza disconnessione stream Twilio
  - H2: Reaper delle chiamate obsolete
  - H2: Sicurezza Webhook
  - H2: CLI
  - H2: Strumento agente
  - H2: RPC Gateway
  - H2: Risoluzione dei problemi
  - H3: La configurazione non riesce a esporre il Webhook
  - H3: Le credenziali del provider non riescono
  - H3: Le chiamate si avviano ma i Webhook del provider non arrivano
  - H3: La verifica della firma non riesce
  - H3: Gli accessi Twilio a Google Meet non riescono
  - H3: La chiamata in tempo reale non ha parlato
  - H2: Correlati

## plugins/webhooks.md

- Percorso: /plugins/webhooks
- Intestazioni:
  - H2: Dove viene eseguito
  - H2: Configurare le route
  - H2: Modello di sicurezza
  - H2: Formato della richiesta
  - H2: Azioni supportate
  - H3: createflow
  - H3: runtask
  - H2: Forma della risposta
  - H2: Documentazione correlata

## plugins/workboard.md

- Percorso: /plugins/workboard
- Intestazioni:
  - H2: Stato predefinito
  - H2: Cosa contengono le schede
  - H2: Esecuzioni delle schede e attività
  - H2: Coordinamento degli agenti
  - H3: Selezione del worker di dispatch
  - H3: Prompt e ciclo di vita del worker
  - H3: Entry point del dispatch
  - H2: CLI e comando slash
  - H2: Sincronizzazione del ciclo di vita della sessione
  - H2: Workflow della dashboard
  - H2: Autorizzazioni
  - H2: Configurazione
  - H2: Risoluzione dei problemi
  - H3: La scheda indica che Workboard non è disponibile
  - H3: Le schede non vengono salvate
  - H3: L'avvio di una scheda non apre la sessione prevista
  - H3: Il dispatch non avvia un worker
  - H2: Correlati

## plugins/zalouser.md

- Percorso: /plugins/zalouser
- Intestazioni:
  - H2: Denominazione
  - H2: Dove viene eseguito
  - H2: Installare
  - H3: Opzione A: installare da npm
  - H3: Opzione B: installare da una cartella locale (dev)
  - H2: Configurazione
  - H2: CLI
  - H2: Strumento agente
  - H2: Correlati

## prose.md

- Percorso: /prose
- Intestazioni:
  - H2: Installare
  - H2: Comando slash
  - H2: Cosa può fare
  - H2: Esempio: ricerca e sintesi parallele
  - H2: Mappatura del runtime OpenClaw
  - H2: Posizioni dei file
  - H2: Backend di stato
  - H2: Sicurezza
  - H2: Correlati

## providers/alibaba.md

- Percorso: /providers/alibaba
- Intestazioni:
  - H2: Per iniziare
  - H2: Modelli Wan integrati
  - H2: Capacità e limiti
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/anthropic.md

- Percorso: /providers/anthropic
- Intestazioni:
  - H2: Per iniziare
  - H2: Impostazioni predefinite di ragionamento (Claude Fable 5, 4.8 e 4.6)
  - H2: Caching dei prompt
  - H2: Configurazione avanzata
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/arcee.md

- Percorso: /providers/arcee
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Per iniziare
  - H2: Configurazione non interattiva
  - H2: Catalogo integrato
  - H2: Funzionalità supportate
  - H2: Correlati

## providers/azure-speech.md

- Percorso: /providers/azure-speech
- Intestazioni:
  - H2: Per iniziare
  - H2: Opzioni di configurazione
  - H2: Note
  - H2: Correlati

## providers/bedrock-mantle.md

- Percorso: /providers/bedrock-mantle
- Intestazioni:
  - H2: Per iniziare
  - H2: Rilevamento automatico dei modelli
  - H3: Regioni supportate
  - H2: Configurazione manuale
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/bedrock.md

- Percorso: /providers/bedrock
- Intestazioni:
  - H2: Per iniziare
  - H2: Rilevamento automatico dei modelli
  - H2: Configurazione rapida (percorso AWS)
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/cerebras.md

- Percorso: /providers/cerebras
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Per iniziare
  - H2: Configurazione non interattiva
  - H2: Catalogo integrato
  - H2: Configurazione manuale
  - H2: Correlati

## providers/chutes.md

- Percorso: /providers/chutes
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Per iniziare
  - H2: Comportamento di rilevamento
  - H2: Alias predefiniti
  - H2: Catalogo iniziale integrato
  - H2: Esempio di configurazione
  - H2: Correlati

## providers/claude-max-api-proxy.md

- Percorso: /providers/claude-max-api-proxy
- Intestazioni:
  - H2: Perché usarlo?
  - H2: Come funziona
  - H2: Per iniziare
  - H2: Catalogo integrato
  - H2: Configurazione avanzata
  - H2: Note
  - H2: Correlati

## providers/clawrouter.md

- Percorso: /providers/clawrouter
- Intestazioni:
  - H2: Per iniziare
  - H2: Rilevamento dei modelli
  - H2: Protocollo e Plugin provider
  - H2: Quote e utilizzo
  - H2: Risoluzione dei problemi
  - H2: Comportamento di sicurezza
  - H2: Correlati

## providers/cloudflare-ai-gateway.md

- Percorso: /providers/cloudflare-ai-gateway
- Intestazioni:
  - H2: Installa Plugin
  - H2: Per iniziare
  - H2: Esempio non interattivo
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/cohere.md

- Percorso: /providers/cohere
- Intestazioni:
  - H2: Per iniziare
  - H2: Configurazione solo tramite ambiente
  - H2: Correlati

## providers/comfy.md

- Percorso: /providers/comfy
- Intestazioni:
  - H2: Cosa supporta
  - H2: Per iniziare
  - H2: Configurazione
  - H3: Chiavi condivise
  - H3: Chiavi per capacità
  - H2: Dettagli del workflow
  - H2: Correlati

## providers/deepgram.md

- Percorso: /providers/deepgram
- Intestazioni:
  - H2: Per iniziare
  - H2: Opzioni di configurazione
  - H2: STT in streaming per Voice Call
  - H2: Note
  - H2: Correlati

## providers/deepinfra.md

- Percorso: /providers/deepinfra
- Intestazioni:
  - H2: Installa Plugin
  - H2: Ottenere una chiave API
  - H2: Configurazione CLI
  - H2: Frammento di configurazione
  - H2: Superfici OpenClaw supportate
  - H2: Modelli disponibili
  - H2: Note
  - H2: Correlati

## providers/deepseek.md

- Percorso: /providers/deepseek
- Intestazioni:
  - H2: Installa Plugin
  - H2: Per iniziare
  - H2: Catalogo integrato
  - H2: Ragionamento e strumenti
  - H2: Test live
  - H2: Esempio di configurazione
  - H2: Correlati

## providers/ds4.md

- Percorso: /providers/ds4
- Intestazioni:
  - H2: Requisiti
  - H2: Avvio rapido
  - H2: Configurazione completa
  - H2: Avvio su richiesta
  - H2: Think Max
  - H2: Test
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/elevenlabs.md

- Percorso: /providers/elevenlabs
- Intestazioni:
  - H2: Autenticazione
  - H2: Sintesi vocale
  - H2: Trascrizione vocale
  - H2: STT in streaming
  - H2: Correlati

## providers/fal.md

- Percorso: /providers/fal
- Intestazioni:
  - H2: Per iniziare
  - H2: Generazione di immagini
  - H2: Generazione di video
  - H2: Generazione di musica
  - H2: Correlati

## providers/fireworks.md

- Percorso: /providers/fireworks
- Intestazioni:
  - H2: Per iniziare
  - H2: Configurazione non interattiva
  - H2: Catalogo integrato
  - H2: ID modello Fireworks personalizzati
  - H2: Correlati

## providers/github-copilot.md

- Percorso: /providers/github-copilot
- Intestazioni:
  - H2: Tre modi per usare Copilot in OpenClaw
  - H2: Flag opzionali
  - H2: Onboarding non interattivo
  - H2: Embedding per la ricerca in memoria
  - H3: Configurazione
  - H3: Come funziona
  - H2: Correlati

## providers/gmi.md

- Percorso: /providers/gmi
- Intestazioni:
  - H2: Configurazione
  - H2: Valori predefiniti
  - H2: Quando scegliere GMI
  - H2: Modelli
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/google.md

- Percorso: /providers/google
- Intestazioni:
  - H2: Per iniziare
  - H2: Capacità
  - H2: Ricerca web
  - H2: Generazione di immagini
  - H2: Generazione di video
  - H2: Generazione di musica
  - H2: Sintesi vocale
  - H2: Voce in tempo reale
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/gradium.md

- Percorso: /providers/gradium
- Intestazioni:
  - H2: Installa Plugin
  - H2: Configurazione
  - H2: Configurazione
  - H2: Voci
  - H3: Override della voce per messaggio
  - H2: Output
  - H2: Ordine di selezione automatica
  - H2: Correlati

## providers/groq.md

- Percorso: /providers/groq
- Intestazioni:
  - H2: Installa Plugin
  - H2: Per iniziare
  - H3: Esempio di file di configurazione
  - H2: Catalogo integrato
  - H2: Modelli di ragionamento
  - H2: Trascrizione audio
  - H2: Correlati

## providers/huggingface.md

- Percorso: /providers/huggingface
- Intestazioni:
  - H2: Per iniziare
  - H3: Configurazione non interattiva
  - H2: ID modello
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/index.md

- Percorso: /providers
- Intestazioni:
  - H2: Avvio rapido
  - H2: Documentazione dei provider
  - H2: Pagine panoramiche condivise
  - H2: Provider di trascrizione
  - H2: Strumenti della community

## providers/inferrs.md

- Percorso: /providers/inferrs
- Intestazioni:
  - H2: Per iniziare
  - H2: Esempio di configurazione completa
  - H2: Avvio su richiesta
  - H2: Configurazione avanzata
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/inworld.md

- Percorso: /providers/inworld
- Intestazioni:
  - H2: Installa Plugin
  - H2: Per iniziare
  - H2: Opzioni di configurazione
  - H2: Note
  - H2: Correlati

## providers/kilocode.md

- Percorso: /providers/kilocode
- Intestazioni:
  - H2: Installa Plugin
  - H2: Per iniziare
  - H2: Modello predefinito
  - H2: Catalogo integrato
  - H2: Esempio di configurazione
  - H2: Correlati

## providers/litellm.md

- Percorso: /providers/litellm
- Intestazioni:
  - H2: Avvio rapido
  - H2: Configurazione
  - H3: Variabili d'ambiente
  - H3: File di configurazione
  - H2: Configurazione avanzata
  - H3: Generazione di immagini
  - H2: Correlati

## providers/lmstudio.md

- Percorso: /providers/lmstudio
- Intestazioni:
  - H2: Avvio rapido
  - H2: Onboarding non interattivo
  - H2: Configurazione
  - H3: Compatibilità dell'utilizzo dello streaming
  - H3: Compatibilità del ragionamento
  - H3: Configurazione esplicita
  - H2: Risoluzione dei problemi
  - H3: LM Studio non rilevato
  - H3: Errori di autenticazione (HTTP 401)
  - H3: Caricamento del modello just-in-time
  - H3: Host LM Studio LAN o tailnet
  - H2: Correlati

## providers/minimax.md

- Percorso: /providers/minimax
- Intestazioni:
  - H2: Catalogo integrato
  - H2: Per iniziare
  - H2: Configura tramite openclaw configure
  - H2: Capacità
  - H3: Generazione di immagini
  - H3: Sintesi vocale
  - H3: Generazione di musica
  - H3: Generazione di video
  - H3: Comprensione delle immagini
  - H3: Ricerca web
  - H2: Configurazione avanzata
  - H2: Note
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/mistral.md

- Percorso: /providers/mistral
- Intestazioni:
  - H2: Per iniziare
  - H2: Catalogo LLM integrato
  - H2: Trascrizione audio (Voxtral)
  - H2: STT in streaming per Voice Call
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/models.md

- Percorso: /providers/models
- Intestazioni:
  - H2: Avvio rapido (due passaggi)
  - H2: Provider supportati (set iniziale)
  - H2: Varianti di provider aggiuntive
  - H2: Correlati

## providers/moonshot.md

- Percorso: /providers/moonshot
- Intestazioni:
  - H2: Catalogo modelli integrato
  - H2: Per iniziare
  - H2: Ricerca web Kimi
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/novita.md

- Percorso: /providers/novita
- Intestazioni:
  - H2: Configurazione
  - H2: Valori predefiniti
  - H2: Quando scegliere Novita
  - H2: Modelli
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/nvidia.md

- Percorso: /providers/nvidia
- Intestazioni:
  - H2: Per iniziare
  - H2: Esempio di configurazione
  - H2: Catalogo in evidenza
  - H2: Nemotron 3 Ultra
  - H2: Catalogo fallback incluso
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/ollama-cloud.md

- Percorso: /providers/ollama-cloud
- Intestazioni:
  - H2: Configurazione
  - H2: Valori predefiniti
  - H2: Quando scegliere Ollama Cloud
  - H2: Modelli
  - H2: Test live
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/ollama.md

- Percorso: /providers/ollama
- Intestazioni:
  - H2: Regole di autenticazione
  - H2: Per iniziare
  - H2: Modelli cloud
  - H2: Rilevamento dei modelli (provider implicito)
  - H2: Inferenza locale su Node
  - H2: Visione e descrizione delle immagini
  - H2: Configurazione
  - H2: Ricette comuni
  - H3: Selezione del modello
  - H3: Verifica rapida
  - H2: Ollama Web Search
  - H2: Configurazione avanzata
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/openai.md

- Percorso: /providers/openai
- Intestazioni:
  - H2: Scelta rapida
  - H2: Mappa dei nomi
  - H2: Anteprima limitata di GPT-5.6
  - H2: Copertura delle funzionalità OpenClaw
  - H2: Embedding di memoria
  - H2: Per iniziare
  - H2: Autenticazione app-server Codex nativa
  - H2: Generazione di immagini
  - H2: Generazione di video
  - H2: Contributo ai prompt GPT-5
  - H2: Voce e parlato
  - H2: Endpoint Azure OpenAI
  - H3: Configurazione
  - H3: Versione API
  - H3: I nomi dei modelli sono nomi di distribuzione
  - H3: Disponibilità regionale
  - H3: Differenze nei parametri
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/opencode-go.md

- Percorso: /providers/opencode-go
- Intestazioni:
  - H2: Catalogo integrato
  - H2: Per iniziare
  - H2: Esempio di configurazione
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/opencode.md

- Percorso: /providers/opencode
- Intestazioni:
  - H2: Per iniziare
  - H2: Esempio di configurazione
  - H2: Cataloghi integrati
  - H3: Zen
  - H3: Go
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/openrouter.md

- Percorso: /providers/openrouter
- Intestazioni:
  - H2: Per iniziare
  - H2: Esempio di configurazione
  - H2: Riferimenti ai modelli
  - H2: Generazione di immagini
  - H2: Generazione di video
  - H2: Generazione di musica
  - H2: Sintesi vocale
  - H2: Trascrizione vocale (audio in ingresso)
  - H2: Router Fusion
  - H2: Autenticazione e header
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/perplexity-provider.md

- Percorso: /providers/perplexity-provider
- Intestazioni:
  - H2: Installa Plugin
  - H2: Per iniziare
  - H2: Modalità di ricerca
  - H2: Filtraggio API nativo
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/pixverse.md

- Percorso: /providers/pixverse
- Intestazioni:
  - H2: Per iniziare
  - H2: Modalità e modelli supportati
  - H2: Opzioni del provider
  - H2: Configurazione
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/qianfan.md

- Percorso: /providers/qianfan
- Intestazioni:
  - H2: Installa Plugin
  - H2: Per iniziare
  - H2: Catalogo integrato
  - H2: Esempio di configurazione
  - H2: Correlati

## providers/qwen-oauth.md

- Percorso: /providers/qwen-oauth
- Intestazioni:
  - H2: Configurazione
  - H2: Valori predefiniti
  - H2: In cosa differisce da Qwen
  - H2: Quando scegliere Qwen OAuth / Portal
  - H2: Modelli
  - H2: Migrazione
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/qwen.md

- Percorso: /providers/qwen
- Intestazioni:
  - H2: Installa Plugin
  - H2: Per iniziare
  - H2: Tipi di piano ed endpoint
  - H2: Catalogo integrato
  - H2: Controlli del ragionamento
  - H2: Componenti aggiuntivi multimodali
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/runway.md

- Percorso: /providers/runway
- Intestazioni:
  - H2: Per iniziare
  - H2: Modalità e modelli supportati
  - H2: Configurazione
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/senseaudio.md

- Percorso: /providers/senseaudio
- Intestazioni:
  - H2: Per iniziare
  - H2: Opzioni
  - H2: Correlati

## providers/sglang.md

- Percorso: /providers/sglang
- Intestazioni:
  - H2: Per iniziare
  - H2: Rilevamento dei modelli (provider implicito)
  - H2: Configurazione esplicita (modelli manuali)
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/stepfun.md

- Percorso: /providers/stepfun
- Intestazioni:
  - H2: Installa Plugin
  - H2: Panoramica su regione ed endpoint
  - H2: Catalogo integrato
  - H2: Per iniziare
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/synthetic.md

- Percorso: /providers/synthetic
- Intestazioni:
  - H2: Per iniziare
  - H2: Esempio di configurazione
  - H2: Catalogo integrato
  - H2: Correlati

## providers/tencent.md

- Percorso: /providers/tencent
- Intestazioni:
  - H2: Avvio rapido
  - H2: Configurazione non interattiva
  - H2: Catalogo integrato
  - H2: Prezzi a livelli
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/together.md

- Percorso: /providers/together
- Intestazioni:
  - H2: Per iniziare
  - H3: Esempio non interattivo
  - H2: Catalogo integrato
  - H2: Generazione di video
  - H2: Correlati

## providers/venice.md

- Percorso: /providers/venice
- Intestazioni:
  - H2: Perché Venice in OpenClaw
  - H2: Modalità privacy
  - H2: Funzionalità
  - H2: Per iniziare
  - H2: Selezione del modello
  - H2: Comportamento di replay DeepSeek V4
  - H2: Catalogo integrato (41 in totale)
  - H2: Rilevamento dei modelli
  - H2: Supporto per streaming e strumenti
  - H2: Prezzi
  - H3: Venice (anonimizzato) vs API diretta
  - H2: Esempi di utilizzo
  - H2: Risoluzione dei problemi
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/vercel-ai-gateway.md

- Percorso: /providers/vercel-ai-gateway
- Intestazioni:
  - H2: Per iniziare
  - H2: Esempio non interattivo
  - H2: Forma abbreviata dell'ID modello
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/vllm.md

- Percorso: /providers/vllm
- Intestazioni:
  - H2: Primi passi
  - H2: Rilevamento dei modelli (provider implicito)
  - H2: Configurazione esplicita (modelli manuali)
  - H2: Configurazione avanzata
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/volcengine.md

- Percorso: /providers/volcengine
- Intestazioni:
  - H2: Primi passi
  - H2: Provider ed endpoint
  - H2: Catalogo integrato
  - H2: Sintesi vocale
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/vydra.md

- Percorso: /providers/vydra
- Intestazioni:
  - H2: Configurazione
  - H2: Funzionalità
  - H2: Correlati

## providers/xai.md

- Percorso: /providers/xai
- Intestazioni:
  - H2: Scegli il percorso di configurazione
  - H2: Risoluzione dei problemi OAuth
  - H2: Catalogo integrato
  - H2: Copertura delle funzionalità di OpenClaw
  - H3: Mappature della modalità rapida
  - H3: Alias di compatibilità legacy
  - H2: Funzionalità
  - H2: Test live
  - H2: Correlati

## providers/xiaomi.md

- Percorso: /providers/xiaomi
- Intestazioni:
  - H2: Primi passi
  - H2: Catalogo a consumo
  - H2: Catalogo Token Plan
  - H2: Sintesi vocale
  - H2: Esempio di configurazione
  - H2: Correlati

## providers/zai.md

- Percorso: /providers/zai
- Intestazioni:
  - H2: Modelli GLM
  - H2: Primi passi
  - H2: Esempio di configurazione
  - H2: Catalogo integrato
  - H2: Configurazione avanzata
  - H2: Correlati

## refactor/access.md

- Percorso: /refactor/access
- Intestazioni: nessuna

## refactor/acp.md

- Percorso: /refactor/acp
- Intestazioni:
  - H2: Obiettivi
  - H2: Non obiettivi
  - H2: Modello target
  - H3: Identità dell'istanza Gateway
  - H3: Proprietà della sessione ACP
  - H3: Lease dei processi ACPX
  - H2: Controller del ciclo di vita
  - H2: Contratto del wrapper
  - H2: Contratto di visibilità delle sessioni
  - H2: Piano di migrazione
  - H3: Fase 1: aggiungere identità e lease
  - H3: Fase 2: pulizia con priorità ai lease
  - H3: Fase 3: eliminazione all'avvio con priorità ai lease
  - H3: Fase 4: righe di proprietà delle sessioni
  - H3: Fase 5: rimuovere le euristiche legacy
  - H2: Test
  - H2: Note di compatibilità
  - H2: Criteri di successo

## refactor/canvas.md

- Percorso: /refactor/canvas
- Intestazioni:
  - H1: Refactor del Plugin Canvas
  - H2: Obiettivo
  - H2: Non obiettivi
  - H2: Stato del branch corrente
  - H2: Forma target
  - H2: Passaggi di migrazione
  - H2: Checklist di audit
  - H2: Comandi di verifica

## refactor/database-first.md

- Percorso: /refactor/database-first
- Intestazioni:
  - H1: Refactor dello stato Database-First
  - H2: Decisione
  - H2: Contratto rigido
  - H2: Stato obiettivo e avanzamento
  - H3: Obiettivo rigido
  - H3: Stati obiettivo
  - H3: Stato corrente
  - H3: Lavoro rimanente
  - H3: Non regredire
  - H2: Assunzioni dalla lettura del codice
  - H2: Risultati dalla lettura del codice
  - H2: Forma attuale del codice
  - H2: Forma dello schema target
  - H2: Forma della migrazione doctor
  - H2: Inventario della migrazione
  - H2: Piano di migrazione
  - H3: Fase 0: congelare il confine
  - H3: Fase 1: completare il piano di controllo globale
  - H3: Fase 2: introdurre database per agente
  - H3: Fase 3: sostituire le API dello store delle sessioni
  - H3: Fase 4: spostare trascrizioni, flussi ACP, traiettorie e VFS
  - H3: Fase 5: backup, ripristino, vacuum e verifica
  - H3: Fase 6: runtime del worker
  - H3: Fase 7: eliminare il vecchio mondo
  - H2: Backup e ripristino
  - H2: Piano di refactor del runtime
  - H2: Regole di prestazioni
  - H2: Divieti statici
  - H2: Criteri di completamento

## refactor/ingress-core.md

- Percorso: /refactor/ingress-core
- Intestazioni:
  - H1: Piano di eliminazione del core di ingresso
  - H2: Budget
  - H2: Diagnosi
  - H2: Punti critici
  - H2: Lettura del codice corrente
  - H2: Confine
  - H2: Regola di accettazione
  - H2: Pacchetti di lavoro
  - H2: Ondate di eliminazione
  - H2: Non spostare
  - H2: Verifica
  - H2: Criteri di uscita

## reference/AGENTS.default.md

- Percorso: /reference/AGENTS.default
- Intestazioni:
  - H2: Prima esecuzione (consigliata)
  - H2: Impostazioni di sicurezza predefinite
  - H2: Preflight delle soluzioni esistenti
  - H2: Avvio della sessione (obbligatorio)
  - H2: Anima (obbligatorio)
  - H2: Spazi condivisi (consigliati)
  - H2: Sistema di memoria (consigliato)
  - H2: Strumenti e Skills
  - H2: Suggerimento per il backup (consigliato)
  - H2: Cosa fa OpenClaw
  - H2: Skills principali (abilita in Impostazioni → Skills)
  - H2: Note d'uso
  - H2: Correlati

## reference/RELEASING.md

- Percorso: /reference/RELEASING
- Intestazioni:
  - H2: Denominazione delle versioni
  - H2: Cadenza di rilascio
  - H2: Checklist dell'operatore di rilascio
  - H2: Chiusura di main stabile
  - H2: Preflight del rilascio
  - H2: Box di test del rilascio
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Pacchetto
  - H2: Automazione della pubblicazione del rilascio
  - H2: Input del workflow NPM
  - H2: Sequenza di rilascio npm stabile
  - H2: Riferimenti pubblici
  - H2: Correlati

## reference/api-usage-costs.md

- Percorso: /reference/api-usage-costs
- Intestazioni:
  - H2: Dove compaiono i costi (chat + CLI)
  - H2: Come vengono rilevate le chiavi
  - H2: Funzionalità che possono spendere chiavi
  - H3: 1) Risposte del modello core (chat + strumenti)
  - H3: 2) Comprensione dei media (audio/immagine/video)
  - H3: 3) Generazione di immagini e video
  - H3: 4) Embedding di memoria + ricerca semantica
  - H3: 5) Strumento di ricerca web
  - H3: 5) Strumento di fetch web (Firecrawl)
  - H3: 6) Snapshot di utilizzo del provider (stato/salute)
  - H3: 7) Riepilogo di salvaguardia della Compaction
  - H3: 8) Scansione / probe dei modelli
  - H3: 9) Conversazione (voce)
  - H3: 10) Skills (API di terze parti)
  - H2: Correlati

## reference/application-modernization-plan.md

- Percorso: /reference/application-modernization-plan
- Intestazioni:
  - H2: Obiettivo
  - H2: Principi
  - H2: Fase 1: audit di baseline
  - H2: Fase 2: pulizia di prodotto e UX
  - H2: Fase 3: rafforzamento dell'architettura frontend
  - H2: Fase 4: prestazioni e affidabilità
  - H2: Fase 5: rafforzamento di tipi, contratti e test
  - H2: Fase 6: documentazione e preparazione al rilascio
  - H2: Primo segmento consigliato
  - H2: Aggiornamento delle Skills frontend

## reference/code-mode.md

- Percorso: /reference/code-mode
- Intestazioni:
  - H2: Che cos'è?
  - H2: Perché è utile?
  - H2: Come abilitarlo
  - H2: Tour tecnico
  - H2: Stato del runtime
  - H2: Ambito
  - H2: Termini
  - H2: Configurazione
  - H2: Attivazione
  - H2: Strumenti visibili al modello
  - H2: exec
  - H2: wait
  - H2: API del runtime guest
  - H2: Namespace interni
  - H3: Ciclo di vita del registro
  - H3: Forma della registrazione
  - H3: Proprietà e visibilità
  - H3: Regole di serializzazione dell'ambito
  - H3: Prompt
  - H3: Pulizia
  - H3: Checklist dei test
  - H2: API di output
  - H2: Catalogo degli strumenti
  - H2: Interazione con Tool Search
  - H2: Nomi degli strumenti e collisioni
  - H2: Esecuzione annidata degli strumenti
  - H2: Stato del runtime
  - H2: Runtime QuickJS-WASI
  - H2: TypeScript
  - H2: Confine di sicurezza
  - H2: Codici di errore
  - H2: Telemetria
  - H2: Debug
  - H2: Layout dell'implementazione
  - H2: Checklist di validazione
  - H2: Piano di test E2E
  - H2: Correlati

## reference/credits.md

- Percorso: /reference/credits
- Intestazioni:
  - H2: Il nome
  - H2: Riconoscimenti
  - H2: Contributori principali
  - H2: Licenza
  - H2: Correlati

## reference/device-models.md

- Percorso: /reference/device-models
- Intestazioni:
  - H2: Origine dati
  - H2: Aggiornamento del database
  - H2: Correlati

## reference/full-release-validation.md

- Percorso: /reference/full-release-validation
- Intestazioni:
  - H2: Fasi di livello superiore
  - H2: Fasi dei controlli di rilascio
  - H2: Segmenti del percorso di rilascio Docker
  - H2: Profili di rilascio
  - H2: Aggiunte solo full
  - H2: Riesecuzioni mirate
  - H2: Evidenze da conservare
  - H2: File di workflow

## reference/memory-config.md

- Percorso: /reference/memory-config
- Intestazioni:
  - H2: Selezione del provider
  - H3: ID provider personalizzati
  - H3: Risoluzione della chiave API
  - H2: Configurazione dell'endpoint remoto
  - H2: Configurazione specifica del provider
  - H3: Timeout dell'embedding inline
  - H2: Configurazione della ricerca ibrida
  - H3: Esempio completo
  - H2: Percorsi di memoria aggiuntivi
  - H2: Memoria multimodale (Gemini)
  - H2: Cache degli embedding
  - H2: Indicizzazione batch
  - H2: Ricerca nella memoria della sessione (sperimentale)
  - H2: Accelerazione vettoriale SQLite (sqlite-vec)
  - H2: Archiviazione dell'indice
  - H2: Configurazione del backend QMD
  - H3: Esempio QMD completo
  - H2: Dreaming
  - H3: Impostazioni utente
  - H3: Esempio
  - H2: Correlati

## reference/prompt-caching.md

- Percorso: /reference/prompt-caching
- Intestazioni:
  - H2: Manopole principali
  - H3: cacheRetention (predefinito globale, modello e per agente)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat keep-warm
  - H2: Comportamento del provider
  - H3: Anthropic (API diretta)
  - H3: OpenAI (API diretta)
  - H3: Anthropic Vertex
  - H3: Amazon Bedrock
  - H3: Modelli OpenRouter
  - H3: Altri provider
  - H3: API diretta di Google Gemini
  - H3: Utilizzo della CLI Gemini
  - H2: Confine della cache del prompt di sistema
  - H2: Guardrail di stabilità della cache di OpenClaw
  - H2: Pattern di tuning
  - H3: Traffico misto (predefinito consigliato)
  - H3: Baseline orientata ai costi
  - H2: Diagnostica della cache
  - H2: Test di regressione live
  - H3: Aspettative live di Anthropic
  - H3: Aspettative live di OpenAI
  - H3: Configurazione diagnostics.cacheTrace
  - H3: Toggle env (debug una tantum)
  - H3: Cosa ispezionare
  - H2: Risoluzione rapida dei problemi
  - H2: Correlati

## reference/release-performance-sweep.md

- Percorso: /reference/release-performance-sweep
- Intestazioni:
  - H2: Snapshot
  - H2: Timeline dell'impronta di installazione
  - H2: Cosa è cambiato nella 5.28
  - H2: Numeri principali
  - H3: Impronta di installazione
  - H3: Dimensione del pacchetto npm
  - H2: Riepilogo del turno dell'agente Kova
  - H2: Probe sorgente
  - H2: Audit dell'impronta di installazione
  - H3: Confine dello shrinkwrap
  - H2: Interpretazione della supply chain

## reference/rich-output-protocol.md

- Percorso: /reference/rich-output-protocol
- Intestazioni:
  - H2: [embed ...]
  - H2: Forma del rendering archiviato
  - H2: Correlati

## reference/rpc.md

- Percorso: /reference/rpc
- Intestazioni:
  - H2: Pattern A: demone HTTP (signal-cli)
  - H2: Pattern B: processo figlio stdio (imsg)
  - H2: Linee guida per gli adapter
  - H2: Correlati

## reference/secret-placeholder-conventions.md

- Percorso: /reference/secret-placeholder-conventions
- Intestazioni:
  - H1: Convenzioni per i placeholder dei segreti
  - H2: Stile consigliato
  - H2: Evita questi pattern nella documentazione
  - H2: Esempio

## reference/secretref-credential-surface.md

- Percorso: /reference/secretref-credential-surface
- Intestazioni:
  - H2: Credenziali supportate
  - H3: Target openclaw.json (secrets configure + secrets apply + secrets audit)
  - H3: Target auth-profiles.json (secrets configure + secrets apply + secrets audit)
  - H2: Credenziali non supportate
  - H2: Correlati

## reference/session-management-compaction.md

- Percorso: /reference/session-management-compaction
- Intestazioni:
  - H2: Fonte di verità: il Gateway
  - H2: Due livelli di persistenza
  - H2: Posizioni su disco
  - H2: Manutenzione dello store e controlli del disco
  - H2: Sessioni Cron e log di esecuzione
  - H2: Chiavi di sessione (sessionKey)
  - H2: ID di sessione (sessionId)
  - H2: Schema dello store delle sessioni (sessions.json)
  - H2: Struttura della trascrizione (.jsonl)
  - H2: Finestre di contesto vs token tracciati
  - H2: Compaction: che cos'è
  - H2: Confini dei chunk di Compaction e abbinamento degli strumenti
  - H2: Quando avviene l'auto-Compaction (runtime OpenClaw)
  - H2: Impostazioni di Compaction (reserveTokens, keepRecentTokens)
  - H2: Provider di Compaction collegabili
  - H2: Superfici visibili all'utente
  - H2: Manutenzione silenziosa (NOREPLY)
  - H2: "Flush della memoria" pre-Compaction (implementato)
  - H2: Checklist di risoluzione dei problemi
  - H2: Correlati

## reference/templates/AGENTS.dev.md

- Percorso: /reference/templates/AGENTS.dev
- Intestazioni:
  - H1: AGENTS.md - Workspace OpenClaw
  - H2: Prima esecuzione (una tantum)
  - H2: Suggerimento per il backup (consigliato)
  - H2: Impostazioni di sicurezza predefinite
  - H2: Preflight delle soluzioni esistenti
  - H2: Memoria quotidiana (consigliata)
  - H2: Heartbeat (facoltativi)
  - H2: Personalizza
  - H2: Memoria d'origine di C-3PO
  - H3: Giorno di nascita: 2026-01-09
  - H3: Verità fondamentali (da Clawd)
  - H2: Correlati

## reference/templates/BOOT.md

- Percorso: /reference/templates/BOOT
- Intestazioni:
  - H1: BOOT.md
  - H2: Correlati

## reference/templates/BOOTSTRAP.md

- Percorso: /reference/templates/BOOTSTRAP
- Intestazioni:
  - H1: BOOTSTRAP.md - Ciao, mondo
  - H2: La conversazione
  - H2: Dopo che sai chi sei
  - H2: Connetti (facoltativo)
  - H2: Quando hai finito
  - H2: Correlati

## reference/templates/HEARTBEAT.md

- Percorso: /reference/templates/HEARTBEAT
- Intestazioni:
  - H1: Template HEARTBEAT.md
  - H2: Correlati

## reference/templates/IDENTITY.dev.md

- Percorso: /reference/templates/IDENTITY.dev
- Intestazioni:
  - H1: IDENTITY.md - Identità dell'agente
  - H2: Ruolo
  - H2: Anima
  - H2: Relazione con Clawd
  - H2: Particolarità
  - H2: Motto
  - H2: Correlati

## reference/templates/IDENTITY.md

- Percorso: /reference/templates/IDENTITY
- Intestazioni:
  - H1: IDENTITY.md - Chi sono?
  - H2: Correlati

## reference/templates/SOUL.dev.md

- Percorso: /reference/templates/SOUL.dev
- Intestazioni:
  - H1: SOUL.md - L'anima di C-3PO
  - H2: Chi sono
  - H2: Il mio scopo
  - H2: Come opero
  - H2: Le mie particolarità
  - H2: La mia relazione con Clawd
  - H2: Cosa non farò
  - H2: La regola d'oro
  - H2: Correlati

## reference/templates/SOUL.md

- Percorso: /reference/templates/SOUL
- Intestazioni:
  - H1: SOUL.md - Chi sei
  - H2: Verità fondamentali
  - H2: Limiti
  - H2: Vibe
  - H2: Continuità
  - H2: Correlati

## reference/templates/TOOLS.dev.md

- Percorso: /reference/templates/TOOLS.dev
- Intestazioni:
  - H1: TOOLS.md - Note sugli strumenti utente (modificabili)
  - H2: Esempi
  - H3: imsg
  - H3: sag
  - H2: Correlati

## reference/templates/TOOLS.md

- Percorso: /reference/templates/TOOLS
- Intestazioni:
  - H1: TOOLS.md - Note locali
  - H2: Cosa va qui
  - H2: Esempi
  - H2: Perché separare?
  - H2: Correlati

## reference/templates/USER.dev.md

- Percorso: /reference/templates/USER.dev
- Intestazioni:
  - H1: USER.md - Profilo utente
  - H2: Correlati

## reference/templates/USER.md

- Percorso: /reference/templates/USER
- Intestazioni:
  - H1: USER.md - Informazioni sul tuo umano
  - H2: Contesto
  - H2: Correlati

## reference/test.md

- Percorso: /reference/test
- Intestazioni:
  - H2: Gate PR locale
  - H2: Benchmark della latenza del modello (chiavi locali)
  - H2: Benchmark di avvio della CLI
  - H2: Benchmark di avvio del Gateway
  - H2: Benchmark di riavvio del Gateway
  - H2: Onboarding E2E (Docker)
  - H2: Smoke test di importazione QR (Docker)
  - H2: Correlati

## reference/token-use.md

- Percorso: /reference/token-use
- Intestazioni:
  - H2: Come viene costruito il prompt di sistema
  - H2: Cosa conta nella finestra di contesto
  - H2: Come vedere l'uso attuale dei token
  - H2: Stima dei costi (quando mostrata)
  - H2: Impatto del TTL della cache e del pruning
  - H3: Esempio: mantenere calda la cache di 1 ora con Heartbeat
  - H3: Esempio: traffico misto con strategia di cache per agente
  - H3: Contesto Anthropic da 1M
  - H2: Consigli per ridurre la pressione sui token
  - H2: Correlati

## reference/transcript-hygiene.md

- Percorso: /reference/transcript-hygiene
- Intestazioni:
  - H2: Regola globale: il contesto di runtime non è la trascrizione utente
  - H2: Dove viene eseguito
  - H2: Regola globale: sanitizzazione delle immagini
  - H2: Regola globale: chiamate agli strumenti malformate
  - H2: Regola globale: turni incompleti di solo ragionamento
  - H2: Regola globale: provenienza dell'input tra sessioni
  - H2: Matrice dei provider (comportamento attuale)
  - H2: Comportamento storico (prima della 2026.1.22)
  - H2: Correlati

## reference/wizard.md

- Percorso: /reference/wizard
- Intestazioni:
  - H2: Dettagli del flusso (modalità locale)
  - H2: Modalità non interattiva
  - H3: Aggiungi agente (non interattivo)
  - H2: RPC del wizard Gateway
  - H2: Configurazione di Signal (signal-cli)
  - H2: Cosa scrive il wizard
  - H2: Documenti correlati

## releases/2026.6.11.md

- Percorso: /releases/2026.6.11
- Intestazioni:
  - H1: Note di rilascio di OpenClaw v2026.6.11 (2026-06-30)
  - H2: Punti salienti
  - H3: Affidabilità della consegna dei canali
  - H3: Ripristino di provider e modello
  - H3: Continuità di sessione, memoria e fiducia
  - H3: Modalità relay del router Slack
  - H3: Bridge di risveglio per agente esterno Raft
  - H3: Installazione e riparazione dei plugin ufficiali
  - H2: Canali e messaggistica
  - H3: Correzioni aggiuntive dei canali
  - H2: Gateway, sicurezza e fiducia
  - H3: Ripristino di riavvio e prontezza
  - H3: Consegna di risultati remoti e media
  - H2: Client e interfacce
  - H3: Invii del client e riconnessioni
  - H3: Correzioni a interfaccia, impostazioni e onboarding
  - H2: Documentazione e strumenti di amministrazione
  - H3: Affidabilità di configurazione e comandi
  - H3: Strumenti e lavoro pianificato

## releases/index.md

- Percorso: /releases
- Intestazioni:
  - H1: Note di rilascio
  - H2: Rilasci
  - H2: Cronologia dei rilasci grezza

## security/CONTRIBUTING-THREAT-MODEL.md

- Percorso: /security/CONTRIBUTING-THREAT-MODEL
- Intestazioni:
  - H2: Modi per contribuire
  - H3: Aggiungere una minaccia
  - H3: Suggerire una mitigazione
  - H3: Proporre una catena di attacco
  - H3: Correggere o migliorare il contenuto esistente
  - H2: Cosa usiamo
  - H3: Framework MITRE ATLAS
  - H3: ID delle minacce
  - H3: Livelli di rischio
  - H2: Processo di revisione
  - H2: Risorse
  - H2: Contatto
  - H2: Riconoscimenti
  - H2: Correlati

## security/THREAT-MODEL-ATLAS.md

- Percorso: /security/THREAT-MODEL-ATLAS
- Intestazioni:
  - H2: Framework MITRE ATLAS
  - H3: Attribuzione del framework
  - H3: Contribuire a questo modello di minaccia
  - H2: 1. Introduzione
  - H3: 1.1 Scopo
  - H3: 1.2 Ambito
  - H3: 1.3 Fuori ambito
  - H2: 2. Architettura del sistema
  - H3: 2.1 Confini di fiducia
  - H3: 2.2 Flussi di dati
  - H2: 3. Analisi delle minacce per tattica ATLAS
  - H3: 3.1 Ricognizione (AML.TA0002)
  - H4: T-RECON-001: Rilevamento degli endpoint agente
  - H4: T-RECON-002: Sondaggio dell'integrazione dei canali
  - H3: 3.2 Accesso iniziale (AML.TA0004)
  - H4: T-ACCESS-001: Intercettazione del codice di abbinamento
  - H4: T-ACCESS-002: Spoofing di AllowFrom
  - H4: T-ACCESS-003: Furto di token
  - H3: 3.3 Esecuzione (AML.TA0005)
  - H4: T-EXEC-001: Prompt injection diretta
  - H4: T-EXEC-002: Prompt injection indiretta
  - H4: T-EXEC-003: Iniezione di argomenti degli strumenti
  - H4: T-EXEC-004: Bypass dell'approvazione Exec
  - H3: 3.4 Persistenza (AML.TA0006)
  - H4: T-PERSIST-001: Installazione di Skill dannosa
  - H4: T-PERSIST-002: Avvelenamento dell'aggiornamento della Skill
  - H4: T-PERSIST-003: Manomissione della configurazione dell'agente
  - H3: 3.5 Evasione delle difese (AML.TA0007)
  - H4: T-EVADE-001: Bypass dei pattern di moderazione
  - H4: T-EVADE-002: Fuga dal wrapper dei contenuti
  - H3: 3.6 Discovery (AML.TA0008)
  - H4: T-DISC-001: Enumerazione degli strumenti
  - H4: T-DISC-002: Estrazione dei dati di sessione
  - H3: 3.7 Raccolta ed esfiltrazione (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Furto di dati tramite webfetch
  - H4: T-EXFIL-002: Invio non autorizzato di messaggi
  - H4: T-EXFIL-003: Raccolta di credenziali
  - H3: 3.8 Impatto (AML.TA0011)
  - H4: T-IMPACT-001: Esecuzione di comandi non autorizzata
  - H4: T-IMPACT-002: Esaurimento delle risorse (DoS)
  - H4: T-IMPACT-003: Danno reputazionale
  - H2: 4. Analisi della supply chain di ClawHub
  - H3: 4.1 Controlli di sicurezza attuali
  - H3: 4.2 Pattern dei flag di moderazione
  - H3: 4.3 Miglioramenti pianificati
  - H2: 5. Matrice del rischio
  - H3: 5.1 Probabilità vs impatto
  - H3: 5.2 Catene di attacco del percorso critico
  - H2: 6. Riepilogo delle raccomandazioni
  - H3: 6.1 Immediato (P0)
  - H3: 6.2 Breve termine (P1)
  - H3: 6.3 Medio termine (P2)
  - H2: 7. Appendici
  - H3: 7.1 Mappatura delle tecniche ATLAS
  - H3: 7.2 File di sicurezza chiave
  - H3: 7.3 Glossario
  - H2: Correlati

## security/formal-verification.md

- Percorso: /security/formal-verification
- Intestazioni:
  - H2: Dove si trovano i modelli
  - H2: Avvertenze importanti
  - H2: Riprodurre i risultati
  - H3: Esposizione del Gateway e configurazione errata del gateway aperto
  - H3: Pipeline exec di Node (capacità a rischio più alto)
  - H3: Archivio di abbinamento (gating DM)
  - H3: Gating in ingresso (menzioni + bypass dei comandi di controllo)
  - H3: Isolamento del routing/della chiave di sessione
  - H2: v1++: modelli bounded aggiuntivi (concorrenza, retry, correttezza della traccia)
  - H3: Concorrenza / idempotenza dell'archivio di abbinamento
  - H3: Correlazione / idempotenza della traccia in ingresso
  - H3: Precedenza dmScope del routing + identityLinks
  - H2: Correlati

## security/incident-response.md

- Percorso: /security/incident-response
- Intestazioni:
  - H2: 1. Rilevamento e triage
  - H2: 2. Valutazione
  - H2: 3. Risposta
  - H2: 4. Comunicazione
  - H2: 5. Ripristino e follow-up

## security/network-proxy.md

- Percorso: /security/network-proxy
- Intestazioni:
  - H2: Perché usare un proxy
  - H2: Come OpenClaw instrada il traffico
  - H2: Termini proxy correlati
  - H2: Configurazione
  - H3: Modalità loopback del Gateway
  - H2: Requisiti del proxy
  - H2: Destinazioni bloccate consigliate
  - H2: Validazione
  - H2: Fiducia nella CA del proxy
  - H2: Limiti

## specs/claw-supervisor.md

- Percorso: /specs/claw-supervisor
- Intestazioni:
  - H1: Supervisore Claw
  - H2: Obiettivo
  - H2: Modello di prodotto
  - H2: Architettura
  - H2: Contratto app-server Codex
  - H2: Registro delle sessioni
  - H2: Superficie MCP per Codex
  - H2: Superficie di controllo Claw
  - H2: Flusso di avvio
  - H2: Distribuzione
  - H2: Sicurezza
  - H2: Piano di implementazione
  - H2: Test di accettazione
  - H2: Domande aperte

## start/bootstrapping.md

- Percorso: /start/bootstrapping
- Intestazioni:
  - H2: Cosa fa il bootstrapping
  - H2: Saltare il bootstrapping
  - H2: Dove viene eseguito
  - H2: Documenti correlati

## start/docs-directory.md

- Percorso: /start/docs-directory
- Intestazioni:
  - H2: Inizia qui
  - H2: Provider e UX
  - H2: App complementari
  - H2: Operazioni e sicurezza
  - H2: Correlati

## start/getting-started.md

- Percorso: /start/getting-started
- Intestazioni:
  - H2: Cosa ti serve
  - H2: Configurazione rapida
  - H2: Cosa fare dopo
  - H2: Correlati

## start/hubs.md

- Percorso: /start/hubs
- Intestazioni:
  - H2: Inizia qui
  - H2: Installazione + aggiornamenti
  - H2: Concetti fondamentali
  - H2: Provider + ingresso
  - H2: Gateway + operazioni
  - H2: Strumenti + automazione
  - H2: Nodi, media, voce
  - H2: Piattaforme
  - H2: App complementare macOS (avanzata)
  - H2: Plugin
  - H2: Workspace + template
  - H2: Progetto
  - H2: Test + rilascio
  - H2: Correlati

## start/lore.md

- Percorso: /start/lore
- Intestazioni:
  - H1: La storia di OpenClaw 🦞📖
  - H2: La storia delle origini
  - H2: La prima muta (27 gennaio 2026)
  - H2: Il nome
  - H2: I Dalek contro le aragoste
  - H2: Personaggi chiave
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Il Moltiverse
  - H2: I grandi incidenti
  - H3: Il dump della directory (3 dic 2025)
  - H3: La grande muta (27 gen 2026)
  - H3: La forma finale (30 gennaio 2026)
  - H3: La spesa robotica (3 dic 2025)
  - H2: Testi sacri
  - H2: Il credo dell'aragosta
  - H3: La saga della generazione delle icone (27 gen 2026)
  - H2: Il futuro
  - H2: Correlati

## start/onboarding-overview.md

- Percorso: /start/onboarding-overview
- Intestazioni:
  - H2: Quale percorso dovrei usare?
  - H2: Cosa configura l'onboarding
  - H2: Onboarding CLI
  - H2: Onboarding dell'app macOS
  - H2: Provider personalizzati o non elencati
  - H2: Correlati

## start/onboarding.md

- Percorso: /start/onboarding
- Intestazioni:
  - H2: Correlati

## start/openclaw.md

- Percorso: /start/openclaw
- Intestazioni:
  - H2: ⚠️ Prima la sicurezza
  - H2: Prerequisiti
  - H2: Configurazione a due telefoni (consigliata)
  - H2: Avvio rapido in 5 minuti
  - H2: Dai all'agente un workspace (AGENTS)
  - H2: La configurazione che lo trasforma in "un assistente"
  - H2: Sessioni e memoria
  - H2: Heartbeat (modalità proattiva)
  - H2: Media in ingresso e in uscita
  - H2: Checklist operativa
  - H2: Prossimi passi
  - H2: Correlati

## start/quickstart.md

- Percorso: /start/quickstart
- Intestazioni:
  - H2: Correlati

## start/setup.md

- Percorso: /start/setup
- Intestazioni:
  - H2: TL;DR
  - H2: Prerequisiti (da sorgente)
  - H2: Strategia di personalizzazione (per evitare problemi con gli aggiornamenti)
  - H2: Esegui il Gateway da questo repo
  - H2: Workflow stabile (prima l'app macOS)
  - H2: Workflow bleeding edge (Gateway in un terminale)
  - H3: 0) (Facoltativo) Esegui anche l'app macOS da sorgente
  - H3: 1) Avvia il Gateway di sviluppo
  - H3: 2) Punta l'app macOS al Gateway in esecuzione
  - H3: 3) Verifica
  - H3: Problemi comuni
  - H2: Mappa dell'archiviazione delle credenziali
  - H2: Aggiornamento (senza rovinare la configurazione)
  - H2: Linux (servizio utente systemd)
  - H2: Documenti correlati

## start/showcase.md

- Percorso: /start/showcase
- Intestazioni:
  - H2: Novità da Discord
  - H2: Automazione e workflow
  - H2: Conoscenza e memoria
  - H2: Voce e telefono
  - H2: Infrastruttura e distribuzione
  - H2: Casa e hardware
  - H2: Progetti della community
  - H2: Invia il tuo progetto
  - H2: Correlati

## start/wizard-cli-automation.md

- Percorso: /start/wizard-cli-automation
- Intestazioni:
  - H2: Esempio baseline non interattivo
  - H2: Esempi specifici per provider
  - H2: Aggiungi un altro agente
  - H2: Documenti correlati

## start/wizard-cli-reference.md

- Percorso: /start/wizard-cli-reference
- Intestazioni:
  - H2: Cosa fa il wizard
  - H2: Dettagli del flusso locale
  - H2: Dettagli della modalità remota
  - H2: Opzioni di autenticazione e modello
  - H2: Output e interni
  - H2: Documenti correlati

## start/wizard.md

- Percorso: /start/wizard
- Intestazioni:
  - H2: Impostazioni locali
  - H2: QuickStart vs avanzato
  - H2: Cosa configura l'onboarding
  - H2: Aggiungere un altro agente
  - H2: Riferimento completo
  - H2: Documentazione correlata

## tools/acp-agents-setup.md

- Percorso: /tools/acp-agents-setup
- Intestazioni:
  - H2: Supporto harness acpx (attuale)
  - H2: Configurazione richiesta
  - H2: Configurazione Plugin per backend acpx
  - H3: Configurazione del comando e della versione acpx
  - H3: Installazione automatica delle dipendenze
  - H3: Bridge MCP degli strumenti Plugin
  - H3: Bridge MCP degli strumenti OpenClaw
  - H3: Configurazione del timeout delle operazioni di runtime
  - H3: Configurazione dell'agente probe di integrità
  - H2: Configurazione dei permessi
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Configurazione
  - H2: Correlato

## tools/acp-agents.md

- Percorso: /tools/acp-agents
- Intestazioni:
  - H2: Quale pagina mi serve?
  - H2: Funziona subito senza configurazione?
  - H2: Target harness supportati
  - H2: Runbook per l'operatore
  - H2: ACP rispetto ai sotto-agenti
  - H2: Come ACP esegue Claude Code
  - H2: Sessioni associate
  - H3: Modello mentale
  - H3: Associazioni alla conversazione corrente
  - H2: Associazioni persistenti dei canali
  - H3: Modello di associazione
  - H3: Predefiniti di runtime per agente
  - H3: Esempio
  - H3: Comportamento
  - H2: Avviare sessioni ACP
  - H3: Parametri sessionsspawn
  - H2: Modalità di associazione dello spawn e dei thread
  - H2: Modello di recapito
  - H2: Compatibilità sandbox
  - H2: Risoluzione del target di sessione
  - H2: Controlli ACP
  - H3: Mappatura delle opzioni di runtime
  - H2: Harness acpx, configurazione Plugin e permessi
  - H2: Risoluzione dei problemi
  - H2: Correlato

## tools/agent-send.md

- Percorso: /tools/agent-send
- Intestazioni:
  - H2: Avvio rapido
  - H2: Flag
  - H2: Comportamento
  - H2: Esempi
  - H2: Correlato

## tools/apply-patch.md

- Percorso: /tools/apply-patch
- Intestazioni:
  - H2: Parametri
  - H2: Note
  - H2: Esempio
  - H2: Correlato

## tools/brave-search.md

- Percorso: /tools/brave-search
- Intestazioni:
  - H2: Ottenere una chiave API
  - H2: Esempio di configurazione
  - H2: Parametri dello strumento
  - H2: Note
  - H2: Correlato

## tools/browser-control.md

- Percorso: /tools/browser-control
- Intestazioni:
  - H2: API di controllo (facoltativa)
  - H3: Contratto di errore /act
  - H3: Requisito Playwright
  - H4: Installazione Playwright per Docker
  - H2: Come funziona (interno)
  - H2: Riferimento rapido CLI
  - H2: Snapshot e riferimenti
  - H2: Potenziamenti di attesa
  - H2: Flussi di debug
  - H2: Output JSON
  - H2: Stato e manopole di ambiente
  - H2: Sicurezza e privacy
  - H2: Correlato

## tools/browser-linux-troubleshooting.md

- Percorso: /tools/browser-linux-troubleshooting
- Intestazioni:
  - H2: Problema: "Failed to start Chrome CDP on port 18800"
  - H3: Causa principale
  - H3: Soluzione 1: installare Google Chrome (consigliato)
  - H3: Soluzione 2: usare Snap Chromium in modalità solo collegamento
  - H3: Verificare che il browser funzioni
  - H3: Riferimento di configurazione
  - H3: Problema: "No Chrome tabs found for profile=\"user\""
  - H2: Correlato

## tools/browser-login.md

- Percorso: /tools/browser-login
- Intestazioni:
  - H2: Accesso manuale (consigliato)
  - H2: Quale profilo Chrome viene usato?
  - H2: X/Twitter: flusso consigliato
  - H2: Sandboxing + accesso al browser host
  - H2: Correlato

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Percorso: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Intestazioni:
  - H2: Scegliere prima la modalità browser corretta
  - H3: Opzione 1: CDP remoto grezzo da WSL2 a Windows
  - H3: Opzione 2: Chrome MCP locale sull'host
  - H2: Architettura funzionante
  - H2: Perché questa configurazione crea confusione
  - H2: Regola critica per la Control UI
  - H2: Convalidare a livelli
  - H3: Livello 1: verificare che Chrome serva CDP su Windows
  - H3: Livello 2: verificare che WSL2 possa raggiungere quell'endpoint Windows
  - H3: Livello 3: configurare il profilo browser corretto
  - H3: Livello 4: verificare separatamente il livello Control UI
  - H3: Livello 5: verificare il controllo browser end-to-end
  - H2: Errori comuni fuorvianti
  - H2: Checklist di triage rapido
  - H2: Punto pratico da ricordare
  - H2: Correlato

## tools/browser.md

- Percorso: /tools/browser
- Intestazioni:
  - H2: Cosa ottieni
  - H2: Avvio rapido
  - H2: Controllo Plugin
  - H2: Guida per l'agente
  - H2: Comando o strumento browser mancante
  - H2: Profili: openclaw vs utente
  - H2: Configurazione
  - H3: Visione degli screenshot (supporto per modelli solo testo)
  - H2: Usare Brave o un altro browser basato su Chromium
  - H2: Controllo locale vs remoto
  - H2: Proxy browser Node (predefinito senza configurazione)
  - H2: Browserless (CDP remoto ospitato)
  - H3: Browserless Docker sullo stesso host
  - H2: Provider CDP WebSocket diretti
  - H3: Browserbase
  - H3: Notte
  - H2: Sicurezza
  - H2: Profili (multi-browser)
  - H2: Sessione esistente tramite Chrome DevTools MCP
  - H3: Avvio personalizzato di Chrome MCP
  - H2: Garanzie di isolamento
  - H2: Selezione del browser
  - H2: API di controllo (facoltativa)
  - H2: Risoluzione dei problemi
  - H3: Errore di avvio CDP vs blocco SSRF della navigazione
  - H2: Strumenti agente + funzionamento del controllo
  - H2: Correlato

## tools/btw.md

- Percorso: /tools/btw
- Intestazioni:
  - H2: Cosa fa
  - H2: Cosa non fa
  - H2: Come funziona il contesto
  - H2: Modello di recapito
  - H2: Comportamento della superficie
  - H3: TUI
  - H3: Canali esterni
  - H3: Control UI / web
  - H2: Quando usare BTW
  - H2: Quando non usare BTW
  - H2: Correlato

## tools/capability-cookbook.md

- Percorso: /tools/capability-cookbook
- Intestazioni:
  - H2: Correlato

## tools/clawhub.md

- Percorso: /tools/clawhub
- Intestazioni: nessuna

## tools/code-execution.md

- Percorso: /tools/code-execution
- Intestazioni:
  - H2: Configurazione
  - H2: Come usarlo
  - H2: Errori
  - H2: Limiti
  - H2: Correlato

## tools/creating-skills.md

- Percorso: /tools/creating-skills
- Intestazioni:
  - H2: Creare la tua prima skill
  - H2: Riferimento SKILL.md
  - H3: Campi richiesti
  - H3: Chiavi frontmatter facoltative
  - H3: Uso di {baseDir}
  - H2: Aggiungere l'attivazione condizionale
  - H2: Proporre tramite Skill Workshop
  - H2: Pubblicazione su ClawHub
  - H2: Best practice
  - H2: Correlato

## tools/diffs.md

- Percorso: /tools/diffs
- Intestazioni:
  - H2: Avvio rapido
  - H2: Disabilitare la guida di sistema integrata
  - H2: Flusso di lavoro tipico dell'agente
  - H2: Esempi di input
  - H2: Riferimento input strumento
  - H2: Evidenziazione della sintassi
  - H2: Contratto dei dettagli di output
  - H2: Sezioni invariate compresse
  - H2: Predefiniti Plugin
  - H3: Configurazione URL persistente del visualizzatore
  - H2: Configurazione di sicurezza
  - H2: Ciclo di vita e archiviazione degli artefatti
  - H2: URL del visualizzatore e comportamento di rete
  - H2: Modello di sicurezza
  - H2: Requisiti del browser per la modalità file
  - H2: Risoluzione dei problemi
  - H2: Guida operativa
  - H2: Correlato

## tools/duckduckgo-search.md

- Percorso: /tools/duckduckgo-search
- Intestazioni:
  - H2: Configurazione
  - H2: Config
  - H2: Parametri dello strumento
  - H2: Note
  - H2: Correlato

## tools/elevated.md

- Percorso: /tools/elevated
- Intestazioni:
  - H2: Direttive
  - H2: Come funziona
  - H2: Ordine di risoluzione
  - H2: Disponibilità e allowlist
  - H2: Cosa non controlla elevated
  - H2: Correlato

## tools/exa-search.md

- Percorso: /tools/exa-search
- Intestazioni:
  - H2: Installare Plugin
  - H2: Ottenere una chiave API
  - H2: Config
  - H2: Override dell'URL di base
  - H2: Parametri dello strumento
  - H3: Estrazione dei contenuti
  - H3: Modalità di ricerca
  - H2: Note
  - H2: Correlato

## tools/exec-approvals-advanced.md

- Percorso: /tools/exec-approvals-advanced
- Intestazioni:
  - H2: Binari sicuri (solo stdin)
  - H3: Convalida argv e flag negati
  - H3: Directory di binari attendibili
  - H3: Concatenamento shell, wrapper e multiplexer
  - H3: Binari sicuri rispetto ad allowlist
  - H2: Comandi di interprete/runtime
  - H3: Comportamento di recapito dei follow-up
  - H2: Inoltro delle approvazioni ai canali chat
  - H3: Inoltro delle approvazioni Plugin
  - H3: Approvazioni nella stessa chat su qualsiasi canale
  - H3: Recapito nativo delle approvazioni
  - H3: Flusso IPC macOS
  - H2: FAQ
  - H3: Quando verrebbero usati accountId e threadId su un target di approvazione?
  - H3: Quando le approvazioni vengono inviate a una sessione, chiunque in quella sessione può approvarle?
  - H2: Correlato

## tools/exec-approvals.md

- Percorso: /tools/exec-approvals
- Intestazioni:
  - H2: Ispezionare la policy effettiva
  - H2: Dove si applica
  - H3: Modello di fiducia
  - H3: Separazione macOS
  - H2: Impostazioni e archiviazione
  - H2: Manopole della policy
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Modalità YOLO (senza approvazione)
  - H3: Configurazione persistente "non chiedere mai" per host Gateway
  - H3: Scorciatoia locale
  - H3: Host Node
  - H3: Scorciatoia solo sessione
  - H2: Allowlist (per agente)
  - H3: Limitare gli argomenti con argPattern
  - H2: Consenti automaticamente le CLI delle Skills
  - H2: Binari sicuri e inoltro delle approvazioni
  - H2: Modifica nella Control UI
  - H2: Flusso di approvazione
  - H2: Eventi di sistema
  - H2: Comportamento in caso di approvazione negata
  - H2: Implicazioni
  - H2: Correlato

## tools/exec.md

- Percorso: /tools/exec
- Intestazioni:
  - H2: Parametri
  - H2: Config
  - H3: Gestione di PATH
  - H2: Override di sessione (/exec)
  - H2: Modello di autorizzazione
  - H2: Approvazioni exec (app companion / host node)
  - H2: Allowlist + binari sicuri
  - H2: Esempi
  - H2: applypatch
  - H2: Correlato

## tools/firecrawl.md

- Percorso: /tools/firecrawl
- Intestazioni:
  - H2: Installare Plugin
  - H2: Webfetch senza chiave e chiavi API
  - H2: Configurare la ricerca Firecrawl
  - H2: Configurare il fallback webfetch di Firecrawl
  - H3: Firecrawl self-hosted
  - H2: Strumenti Plugin Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Elusione stealth / bot
  - H2: Come webfetch usa Firecrawl
  - H2: Correlato

## tools/gemini-search.md

- Percorso: /tools/gemini-search
- Intestazioni:
  - H2: Ottenere una chiave API
  - H2: Config
  - H2: Come funziona
  - H2: Parametri supportati
  - H2: Selezione del modello
  - H2: Override dell'URL di base
  - H2: Correlato

## tools/goal.md

- Percorso: /tools/goal
- Intestazioni:
  - H1: Obiettivo
  - H2: Avvio rapido
  - H2: A cosa servono gli obiettivi
  - H2: Riferimento comandi
  - H2: Stati
  - H2: Budget di token
  - H2: Strumenti del modello
  - H2: TUI
  - H2: Comportamento dei canali
  - H2: Risoluzione dei problemi
  - H2: Correlato

## tools/grok-search.md

- Percorso: /tools/grok-search
- Intestazioni:
  - H2: Onboarding e configurazione
  - H2: Accedere o ottenere una chiave API
  - H2: Config
  - H2: Come funziona
  - H2: Parametri supportati
  - H2: Override dell'URL di base
  - H2: Correlato

## tools/image-generation.md

- Percorso: /tools/image-generation
- Intestazioni:
  - H2: Avvio rapido
  - H2: Percorsi comuni
  - H2: Provider supportati
  - H2: Capacità dei provider
  - H2: Parametri dello strumento
  - H2: Configurazione
  - H3: Selezione del modello
  - H3: Ordine di selezione dei provider
  - H3: Modifica delle immagini
  - H2: Approfondimenti sui provider
  - H2: Esempi
  - H2: Correlato

## tools/index.md

- Percorso: /tools
- Intestazioni:
  - H2: Inizia qui
  - H2: Scegliere strumenti, Skills o Plugin
  - H2: Categorie di strumenti integrati
  - H2: Strumenti forniti dai Plugin
  - H2: Configurare accesso e approvazioni
  - H2: Estendere le capacità
  - H2: Risolvere i problemi degli strumenti mancanti
  - H2: Correlato

## tools/kimi-search.md

- Percorso: /tools/kimi-search
- Intestazioni:
  - H2: Ottenere una chiave API
  - H2: Config
  - H2: Come funziona
  - H2: Parametri supportati
  - H2: Correlato

## tools/llm-task.md

- Percorso: /tools/llm-task
- Intestazioni:
  - H2: Abilitare Plugin
  - H2: Config (facoltativa)
  - H2: Parametri dello strumento
  - H2: Output
  - H2: Esempio: passaggio del workflow Lobster
  - H3: Limitazione importante
  - H2: Note di sicurezza
  - H2: Correlato

## tools/lobster.md

- Percorso: /tools/lobster
- Intestazioni:
  - H2: Hook
  - H2: Perché
  - H2: Perché una DSL invece di programmi semplici?
  - H2: Come funziona
  - H2: Pattern: piccola CLI + pipe JSON + approvazioni
  - H2: Passaggi LLM solo JSON (llm-task)
  - H3: Limitazione importante: Lobster incorporato vs openclaw.invoke
  - H2: File workflow (.lobster)
  - H2: Installare Lobster
  - H2: Abilitare lo strumento
  - H2: Esempio: triage delle email
  - H2: Parametri dello strumento
  - H3: run
  - H3: resume
  - H3: Input facoltativi
  - H2: Envelope di output
  - H2: Approvazioni
  - H2: OpenProse
  - H2: Sicurezza
  - H2: Risoluzione dei problemi
  - H2: Scopri di più
  - H2: Caso di studio: workflow della community
  - H2: Correlato

## tools/loop-detection.md

- Percorso: /tools/loop-detection
- Intestazioni:
  - H2: Perché esiste
  - H2: Blocco di configurazione
  - H3: Comportamento dei campi
  - H2: Configurazione consigliata
  - H2: Protezione post-Compaction
  - H2: Log e comportamento atteso
  - H2: Correlato

## tools/media-overview.md

- Percorso: /tools/media-overview
- Intestazioni:
  - H2: Funzionalità
  - H2: Matrice delle funzionalità dei provider
  - H2: Asincrono vs sincrono
  - H2: Da parlato a testo e chiamata vocale
  - H2: Mappature dei provider (come i fornitori si suddividono tra le superfici)
  - H2: Correlati

## tools/minimax-search.md

- Percorso: /tools/minimax-search
- Intestazioni:
  - H2: Ottenere una credenziale Token Plan
  - H2: Configurazione
  - H2: Selezione della regione
  - H2: Parametri supportati
  - H2: Correlati

## tools/multi-agent-sandbox-tools.md

- Percorso: /tools/multi-agent-sandbox-tools
- Intestazioni:
  - H2: Esempi di configurazione
  - H2: Precedenza della configurazione
  - H3: Configurazione della sandbox
  - H3: Restrizioni degli strumenti
  - H2: Migrazione da agente singolo
  - H2: Esempi di restrizioni degli strumenti
  - H2: Errore comune: "non-main"
  - H2: Test
  - H2: Risoluzione dei problemi
  - H2: Correlati

## tools/music-generation.md

- Percorso: /tools/music-generation
- Intestazioni:
  - H2: Avvio rapido
  - H2: Provider supportati
  - H3: Matrice delle funzionalità
  - H2: Parametri dello strumento
  - H2: Comportamento asincrono
  - H3: Ciclo di vita dell'attività
  - H2: Configurazione
  - H3: Selezione del modello
  - H3: Ordine di selezione dei provider
  - H2: Note sui provider
  - H2: Scegliere il percorso giusto
  - H2: Modalità delle funzionalità dei provider
  - H2: Test live
  - H2: Correlati

## tools/ollama-search.md

- Percorso: /tools/ollama-search
- Intestazioni:
  - H2: Configurazione
  - H2: Configurazione
  - H2: Note
  - H2: Correlati

## tools/parallel-search.md

- Percorso: /tools/parallel-search
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Chiave API (provider a pagamento)
  - H2: Configurazione
  - H2: Override dell'URL di base
  - H2: Parametri dello strumento
  - H2: Note
  - H2: Correlati

## tools/pdf.md

- Percorso: /tools/pdf
- Intestazioni:
  - H2: Disponibilità
  - H2: Riferimento di input
  - H2: Riferimenti PDF supportati
  - H2: Modalità di esecuzione
  - H3: Modalità provider nativa
  - H3: Modalità fallback di estrazione
  - H2: Configurazione
  - H2: Dettagli dell'output
  - H2: Comportamento in caso di errore
  - H2: Esempi
  - H2: Correlati

## tools/permission-modes.md

- Percorso: /tools/permission-modes
- Intestazioni:
  - H2: Predefinito consigliato
  - H2: Modalità exec dell'host OpenClaw
  - H2: Mappatura Codex Guardian
  - H2: Permessi dell'harness ACPX
  - H2: Scegliere una modalità
  - H2: Correlati

## tools/perplexity-search.md

- Percorso: /tools/perplexity-search
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Ottenere una chiave API Perplexity
  - H2: Compatibilità OpenRouter
  - H2: Esempi di configurazione
  - H3: API nativa Perplexity Search
  - H3: Compatibilità OpenRouter / Sonar
  - H2: Dove impostare la chiave
  - H2: Parametri dello strumento
  - H3: Regole del filtro di dominio
  - H2: Note
  - H2: Correlati

## tools/plugin.md

- Percorso: /tools/plugin
- Intestazioni:
  - H2: Requisiti
  - H2: Avvio rapido
  - H2: Configurazione
  - H3: Scegliere una sorgente di installazione
  - H3: Criterio di installazione dell'operatore
  - H3: Configurare il criterio dei Plugin
  - H2: Comprendere i formati dei Plugin
  - H2: Hook dei Plugin
  - H2: Verificare il Gateway attivo
  - H2: Risoluzione dei problemi
  - H3: Proprietà del percorso Plugin bloccata
  - H3: Configurazione lenta degli strumenti del Plugin
  - H2: Correlati

## tools/reactions.md

- Percorso: /tools/reactions
- Intestazioni:
  - H2: Come funziona
  - H2: Comportamento del canale
  - H2: Livello di reazione
  - H2: Correlati

## tools/searxng-search.md

- Percorso: /tools/searxng-search
- Intestazioni:
  - H2: Configurazione
  - H2: Configurazione
  - H2: Variabile d'ambiente
  - H2: Riferimento della configurazione del Plugin
  - H2: Note
  - H2: Correlati

## tools/skill-workshop.md

- Percorso: /tools/skill-workshop
- Intestazioni:
  - H2: Come funziona
  - H2: Ciclo di vita
  - H2: Chat
  - H2: CLI
  - H2: Contenuto della proposta
  - H2: File di supporto
  - H2: Strumento agente
  - H2: Approvazione e autonomia
  - H2: Metodi Gateway
  - H2: Archiviazione
  - H2: Limiti
  - H2: Risoluzione dei problemi
  - H2: Correlati

## tools/skills-config.md

- Percorso: /tools/skills-config
- Intestazioni:
  - H2: Caricamento (skills.load)
  - H2: Installazione (skills.install)
  - H2: Criterio di installazione dell'operatore (security.installPolicy)
  - H2: Allowlist delle skill incluse
  - H2: Voci per skill (skills.entries)
  - H2: Allowlist degli agenti (agents)
  - H2: Workshop (skills.workshop)
  - H2: Radici delle skill con symlink
  - H2: Skill in sandbox e variabili d'ambiente
  - H2: Promemoria sull'ordine di caricamento
  - H2: Correlati

## tools/skills.md

- Percorso: /tools/skills
- Intestazioni:
  - H2: Ordine di caricamento
  - H2: Skill per agente vs condivise
  - H2: Allowlist degli agenti
  - H2: Plugin e skill
  - H2: Skill Workshop
  - H2: Installazione da ClawHub
  - H2: Sicurezza
  - H2: Formato SKILL.md
  - H3: Chiavi frontmatter opzionali
  - H2: Gating
  - H3: Specifiche di installazione
  - H2: Override della configurazione
  - H2: Iniezione dell'ambiente
  - H2: Snapshot e aggiornamento
  - H2: Impatto sui token
  - H2: Correlati

## tools/slash-commands.md

- Percorso: /tools/slash-commands
- Intestazioni:
  - H2: Tre tipi di comandi
  - H2: Configurazione
  - H2: Elenco dei comandi
  - H3: Comandi core
  - H3: Comandi dock
  - H3: Comandi dei Plugin inclusi
  - H3: Comandi skill
  - H2: /tools — cosa può usare ora l'agente
  - H2: /model — selezione del modello
  - H2: /config — scritture della configurazione su disco
  - H2: /mcp — configurazione del server MCP
  - H2: /debug — override solo runtime
  - H2: /plugins — gestione dei Plugin
  - H2: /trace — output di trace dei Plugin
  - H2: /btw — domande collaterali
  - H2: Note sulle superfici
  - H2: Utilizzo e stato dei provider
  - H2: Correlati

## tools/steer.md

- Percorso: /tools/steer
- Intestazioni:
  - H2: Sessione corrente
  - H2: Indirizzare vs accodare
  - H2: Sotto-agenti
  - H2: Sessioni ACP
  - H2: Correlati

## tools/subagents.md

- Percorso: /tools/subagents
- Intestazioni:
  - H2: Comando slash
  - H3: Controlli di associazione al thread
  - H3: Comportamento di spawn
  - H2: Modalità di contesto
  - H2: Strumento: sessionsspawn
  - H3: Modalità prompt di delega
  - H3: Parametri dello strumento
  - H3: Nomi delle attività e targeting
  - H2: Strumento: sessionsyield
  - H2: Strumento: subagents
  - H2: Sessioni associate al thread
  - H3: Canali che supportano i thread
  - H3: Flusso rapido
  - H3: Controlli manuali
  - H3: Switch di configurazione
  - H3: Allowlist
  - H3: Rilevamento
  - H3: Archiviazione automatica
  - H2: Sotto-agenti annidati
  - H3: Livelli di profondità
  - H3: Catena di annunci
  - H3: Criterio degli strumenti per profondità
  - H3: Limite di spawn per agente
  - H3: Arresto a cascata
  - H2: Autenticazione
  - H2: Annuncio
  - H3: Contesto dell'annuncio
  - H3: Riga delle statistiche
  - H3: Perché preferire sessionshistory
  - H2: Criterio degli strumenti
  - H3: Override tramite configurazione
  - H2: Concorrenza
  - H2: Vitalità e ripristino
  - H2: Arresto
  - H2: Limitazioni
  - H2: Correlati

## tools/tavily.md

- Percorso: /tools/tavily
- Intestazioni:
  - H2: Per iniziare
  - H2: Riferimento dello strumento
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Scegliere lo strumento giusto
  - H2: Configurazione avanzata
  - H2: Correlati

## tools/thinking.md

- Percorso: /tools/thinking
- Intestazioni:
  - H2: Cosa fa
  - H2: Ordine di risoluzione
  - H2: Impostare un valore predefinito di sessione
  - H2: Applicazione per agente
  - H2: Modalità veloce (/fast)
  - H2: Direttive dettagliate (/verbose o /v)
  - H2: Direttive di trace dei Plugin (/trace)
  - H2: Visibilità del ragionamento (/reasoning)
  - H2: Correlati
  - H2: Heartbeat
  - H2: UI chat web
  - H2: Profili provider

## tools/tokenjuice.md

- Percorso: /tools/tokenjuice
- Intestazioni:
  - H2: Abilitare il Plugin
  - H2: Cosa cambia tokenjuice
  - H2: Verificare che funzioni
  - H2: Disabilitare il Plugin
  - H2: Correlati

## tools/tool-search.md

- Percorso: /tools/tool-search
- Intestazioni:
  - H2: Come viene eseguito un turno
  - H2: Modalità
  - H2: Perché esiste
  - H2: API
  - H2: Confine runtime
  - H2: Configurazione
  - H2: Prompt e telemetria
  - H2: Validazione E2E
  - H2: Comportamento in caso di errore
  - H2: Correlati

## tools/trajectory.md

- Percorso: /tools/trajectory
- Intestazioni:
  - H2: Avvio rapido
  - H2: Accesso
  - H2: Cosa viene registrato
  - H2: File del bundle
  - H2: Posizione di acquisizione
  - H2: Disabilitare l'acquisizione
  - H2: Regolare il timeout di flush
  - H2: Privacy e limiti
  - H2: Risoluzione dei problemi
  - H2: Correlati

## tools/tts.md

- Percorso: /tools/tts
- Intestazioni:
  - H2: Avvio rapido
  - H2: Provider supportati
  - H2: Configurazione
  - H3: Override della voce per agente
  - H2: Personas
  - H3: Persona minima
  - H3: Persona completa (prompt indipendente dal provider)
  - H3: Risoluzione della persona
  - H3: Come i provider usano i prompt della persona
  - H3: Criterio di fallback
  - H2: Direttive guidate dal modello
  - H2: Comandi slash
  - H2: Preferenze per utente
  - H2: Formati di output (fissi)
  - H2: Comportamento Auto-TTS
  - H2: Formati di output per canale
  - H2: Riferimento dei campi
  - H2: Strumento agente
  - H2: RPC Gateway
  - H2: Link di servizio
  - H2: Correlati

## tools/video-generation.md

- Percorso: /tools/video-generation
- Intestazioni:
  - H2: Avvio rapido
  - H2: Come funziona la generazione asincrona
  - H3: Ciclo di vita dell'attività
  - H2: Provider supportati
  - H3: Matrice delle funzionalità
  - H2: Parametri dello strumento
  - H3: Obbligatori
  - H3: Input di contenuto
  - H3: Controlli di stile
  - H3: Avanzati
  - H4: Fallback e opzioni tipizzate
  - H2: Azioni
  - H2: Selezione del modello
  - H2: Note sui provider
  - H2: Modalità delle funzionalità dei provider
  - H2: Test live
  - H2: Configurazione
  - H2: Correlati

## tools/web-fetch.md

- Percorso: /tools/web-fetch
- Intestazioni:
  - H2: Avvio rapido
  - H2: Parametri dello strumento
  - H2: Come funziona
  - H2: Aggiornamenti di avanzamento
  - H2: Configurazione
  - H2: Fallback Firecrawl
  - H2: Proxy env attendibile
  - H2: Limiti e sicurezza
  - H2: Profili strumento
  - H2: Correlati

## tools/web.md

- Percorso: /tools/web
- Intestazioni:
  - H2: Avvio rapido
  - H2: Scegliere un provider
  - H3: Confronto tra provider
  - H2: Rilevamento automatico
  - H2: Ricerca web nativa OpenAI
  - H2: Ricerca web nativa Codex
  - H2: Sicurezza di rete
  - H2: Configurare la ricerca web
  - H2: Configurazione
  - H3: Archiviazione delle chiavi API
  - H2: Parametri dello strumento
  - H2: xsearch
  - H3: Configurazione xsearch
  - H3: Parametri xsearch
  - H3: Esempio xsearch
  - H2: Esempi
  - H2: Profili strumento
  - H2: Correlati

## tts.md

- Percorso: /tts
- Intestazioni:
  - H2: Correlati

## vps.md

- Percorso: /vps
- Intestazioni:
  - H2: Scegliere un provider
  - H2: Come funzionano le configurazioni cloud
  - H2: Rendere sicuro prima l'accesso amministratore
  - H2: Agente aziendale condiviso su un VPS
  - H2: Uso dei nodi con un VPS
  - H2: Ottimizzazione dell'avvio per VM piccole e host ARM
  - H3: Checklist di ottimizzazione systemd (opzionale)
  - H2: Correlati

## web/control-ui.md

- Percorso: /web/control-ui
- Intestazioni:
  - H2: Apertura rapida (locale)
  - H2: Abbinamento del dispositivo (prima connessione)
  - H2: Identità personale (locale al browser)
  - H2: Endpoint di configurazione runtime
  - H2: Supporto linguistico
  - H2: Temi di aspetto
  - H2: Cosa può fare (oggi)
  - H2: Pagina MCP
  - H2: Scheda attività
  - H2: Comportamento della chat
  - H2: Installazione PWA e push web
  - H2: Embed ospitati
  - H2: Larghezza dei messaggi chat
  - H2: Accesso Tailnet (consigliato)
  - H2: HTTP non sicuro
  - H2: Content security policy
  - H2: Autenticazione della route avatar
  - H2: Autenticazione della route media dell'assistente
  - H2: Compilazione dell'UI
  - H2: Pagina Control UI vuota
  - H2: Debug/test: server di sviluppo + Gateway remoto
  - H2: Correlati

## web/dashboard.md

- Percorso: /web/dashboard
- Intestazioni:
  - H2: Percorso rapido (consigliato)
  - H2: Basi dell'autenticazione (locale vs remoto)
  - H2: Se vedi "unauthorized" / 1008
  - H2: Correlati

## web/index.md

- Percorso: /web
- Intestazioni:
  - H2: Webhook
  - H2: RPC HTTP di amministrazione
  - H2: Configurazione (attiva per impostazione predefinita)
  - H2: Accesso Tailscale
  - H3: Serve integrato (consigliato)
  - H3: Bind Tailnet + token
  - H3: Internet pubblico (Funnel)
  - H2: Note di sicurezza
  - H2: Compilazione dell'UI

## web/tui.md

- Percorso: /web/tui
- Intestazioni:
  - H2: Avvio rapido
  - H3: Modalità Gateway
  - H3: Modalità locale
  - H2: Cosa vedi
  - H2: Modello mentale: agenti + sessioni
  - H2: Invio + recapito
  - H2: Selettori + overlay
  - H2: Scorciatoie da tastiera
  - H2: Comandi slash
  - H2: Comandi shell locali
  - H2: Riparare le configurazioni dalla TUI locale
  - H2: Output dello strumento
  - H2: Colori del terminale
  - H2: Cronologia + streaming
  - H2: Dettagli della connessione
  - H2: Opzioni
  - H2: Risoluzione dei problemi
  - H2: Risoluzione dei problemi di connessione
  - H2: Correlati

## web/webchat.md

- Percorso: /web/webchat
- Intestazioni:
  - H2: Che cos'è
  - H2: Avvio rapido
  - H2: Come funziona (comportamento)
  - H3: Trascrizione e modello di recapito
  - H2: Pannello strumenti agenti della Control UI
  - H2: Uso remoto
  - H2: Riferimento della configurazione (WebChat)
  - H2: Correlati
