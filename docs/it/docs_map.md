---
read_when: Finding which docs page covers a topic before reading the page
summary: Mappa delle intestazioni generata per le pagine della documentazione di OpenClaw
title: Mappa della documentazione
x-i18n:
    generated_at: "2026-07-01T13:03:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9942f57ca1e0a9ae1a0fc8a766c0a0d1429856dc906bb5acb60eda38f927b607
    source_path: docs_map.md
    workflow: 16
---

# Mappa della documentazione OpenClaw

Questo file è generato dalle intestazioni di `docs/**/*.md` e `docs/**/*.mdx` per aiutare gli agenti a navigare nell'albero della documentazione.
Non modificarlo a mano; esegui `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Percorso: /agent-runtime-architecture
- Intestazioni:
  - H2: Layout del runtime
  - H2: Confini
  - H2: Manifest
  - H2: Selezione del runtime
  - H2: Correlati

## announcements/bluebubbles-imessage.md

- Percorso: /announcements/bluebubbles-imessage
- Intestazioni:
  - H1: Rimozione di BlueBubbles e il percorso imsg iMessage
  - H2: Cosa è cambiato
  - H2: Cosa fare
  - H2: Note di migrazione
  - H2: Vedi anche

## auth-credential-semantics.md

- Percorso: /auth-credential-semantics
- Intestazioni:
  - H2: Codici motivo stabili delle sonde
  - H2: Credenziali token
  - H3: Regole di idoneità
  - H3: Regole di risoluzione
  - H2: Portabilità della copia dell'agente
  - H2: Route di autenticazione solo config
  - H2: Filtraggio esplicito dell'ordine di autenticazione
  - H2: Risoluzione del target della sonda
  - H2: Rilevamento delle credenziali CLI esterne
  - H2: Protezione della policy OAuth SecretRef
  - H2: Messaggistica compatibile con legacy
  - H2: Correlati

## automation/auth-monitoring.md

- Percorso: /automation/auth-monitoring
- Intestazioni:
  - H2: Correlati

## automation/clawflow.md

- Percorso: /automation/clawflow
- Intestazioni:
  - H2: Correlati

## automation/cron-jobs.md

- Percorso: /automation/cron-jobs
- Intestazioni:
  - H2: Avvio rapido
  - H2: Come funziona cron
  - H2: Tipi di pianificazione
  - H3: Giorno del mese e giorno della settimana usano la logica OR
  - H2: Stili di esecuzione
  - H3: Payload dei comandi
  - H3: Opzioni del payload per job isolati
  - H2: Consegna e output
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

- Percorso: /automation/cron-vs-heartbeat
- Intestazioni:
  - H2: Correlati

## automation/gmail-pubsub.md

- Percorso: /automation/gmail-pubsub
- Intestazioni:
  - H2: Correlati

## automation/hooks.md

- Percorso: /automation/hooks
- Intestazioni:
  - H2: Scegliere la superficie corretta
  - H2: Avvio rapido
  - H2: Tipi di evento
  - H2: Scrivere hook
  - H3: Struttura degli hook
  - H3: Formato HOOK.md
  - H3: Implementazione dell'handler
  - H3: Evidenze del contesto evento
  - H2: Rilevamento degli hook
  - H3: Pacchetti di hook
  - H2: Hook inclusi
  - H3: Dettagli di session-memory
  - H3: Configurazione di bootstrap-extra-files
  - H3: Dettagli di command-logger
  - H3: Dettagli di compaction-notifier
  - H3: Dettagli di boot-md
  - H2: Hook dei Plugin
  - H2: Configurazione
  - H2: Riferimento CLI
  - H2: Procedure consigliate
  - H2: Risoluzione dei problemi
  - H3: Hook non rilevato
  - H3: Hook non idoneo
  - H3: Hook non in esecuzione
  - H2: Correlati

## automation/index.md

- Percorso: /automation
- Intestazioni:
  - H2: Guida rapida alla decisione
  - H3: Attività pianificate (Cron) rispetto a Heartbeat
  - H2: Concetti principali
  - H3: Attività pianificate (cron)
  - H3: Attività
  - H3: Impegni dedotti
  - H3: Task Flow
  - H3: Ordini permanenti
  - H3: Hook
  - H3: Heartbeat
  - H2: Come funzionano insieme
  - H2: Correlati

## automation/poll.md

- Percorso: /automation/poll
- Intestazioni:
  - H2: Correlati

## automation/standing-orders.md

- Percorso: /automation/standing-orders
- Intestazioni:
  - H2: Perché gli ordini permanenti
  - H2: Come funzionano
  - H2: Anatomia di un ordine permanente
  - H2: Ordini permanenti più job cron
  - H2: Esempi
  - H3: Esempio 1: contenuti e social media (ciclo settimanale)
  - H3: Esempio 2: operazioni finanziarie (attivate da eventi)
  - H3: Esempio 3: monitoraggio e avvisi (continuo)
  - H2: Pattern esegui-verifica-riporta
  - H2: Architettura multi-programma
  - H2: Procedure consigliate
  - H3: Da fare
  - H3: Da evitare
  - H2: Correlati

## automation/taskflow.md

- Percorso: /automation/taskflow
- Intestazioni:
  - H2: Quando usare Task Flow
  - H2: Pattern di workflow pianificato affidabile
  - H2: Modalità di sincronizzazione
  - H3: Modalità gestita
  - H3: Modalità specchiata
  - H2: Stato durevole e tracciamento delle revisioni
  - H2: Comportamento di annullamento
  - H2: Comandi CLI
  - H2: Come i flussi si relazionano alle attività
  - H2: Correlati

## automation/tasks.md

- Percorso: /automation/tasks
- Intestazioni:
  - H2: TL;DR
  - H2: Avvio rapido
  - H2: Cosa crea un'attività
  - H2: Ciclo di vita delle attività
  - H2: Consegna e notifiche
  - H3: Policy di notifica
  - H2: Riferimento CLI
  - H2: Bacheca delle attività in chat (/tasks)
  - H2: Integrazione dello stato (pressione delle attività)
  - H2: Archiviazione e manutenzione
  - H3: Dove risiedono le attività
  - H3: Manutenzione automatica
  - H2: Come le attività si relazionano ad altri sistemi
  - H2: Correlati

## automation/troubleshooting.md

- Percorso: /automation/troubleshooting
- Intestazioni:
  - H2: Correlati

## automation/webhook.md

- Percorso: /automation/webhook
- Intestazioni:
  - H2: Correlati

## brave-search.md

- Percorso: /brave-search
- Intestazioni:
  - H2: Correlati

## channels/access-groups.md

- Percorso: /channels/access-groups
- Intestazioni:
  - H2: Gruppi statici di mittenti dei messaggi
  - H2: Gruppi di riferimento da allowlist
  - H2: Percorsi dei canali di messaggistica supportati
  - H2: Diagnostica dei Plugin
  - H2: Pubblici dei canali Discord
  - H2: Note di sicurezza
  - H2: Risoluzione dei problemi

## channels/ambient-room-events.md

- Percorso: /channels/ambient-room-events
- Intestazioni:
  - H2: Configurazione consigliata
  - H2: Cosa cambia
  - H2: Esempio Discord
  - H2: Esempio Slack
  - H2: Esempio Telegram
  - H2: Policy specifica per agente
  - H2: Modalità di risposta visibili
  - H2: Cronologia
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/bot-loop-protection.md

- Percorso: /channels/bot-loop-protection
- Intestazioni:
  - H1: Protezione dai loop dei bot
  - H2: Impostazioni predefinite
  - H2: Configurare le impostazioni predefinite condivise
  - H2: Override per canale o account
  - H2: Supporto dei canali

## channels/broadcast-groups.md

- Percorso: /channels/broadcast-groups
- Intestazioni:
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
  - H2: Procedure consigliate
  - H2: Compatibilità
  - H3: Provider
  - H3: Instradamento
  - H2: Risoluzione dei problemi
  - H2: Esempi
  - H2: Riferimento API
  - H3: Schema config
  - H3: Campi
  - H2: Limitazioni
  - H2: Miglioramenti futuri
  - H2: Correlati

## channels/channel-routing.md

- Percorso: /channels/channel-routing
- Intestazioni:
  - H1: Canali e instradamento
  - H2: Termini chiave
  - H2: Prefissi dei target in uscita
  - H2: Forme delle chiavi di sessione (esempi)
  - H2: Fissaggio della route DM principale
  - H2: Registrazione in ingresso protetta
  - H2: Regole di instradamento (come viene scelto un agente)
  - H2: Gruppi broadcast (eseguire più agenti)
  - H2: Panoramica della configurazione
  - H2: Archiviazione delle sessioni
  - H2: Comportamento WebChat
  - H2: Contesto di risposta
  - H2: Correlati

## channels/clickclack.md

- Percorso: /channels/clickclack
- Intestazioni:
  - H2: Configurazione rapida
  - H2: Più bot
  - H2: Target
  - H2: Autorizzazioni
  - H2: Risoluzione dei problemi

## channels/discord.md

- Percorso: /channels/discord
- Intestazioni:
  - H2: Configurazione rapida
  - H2: Consigliato: configurare uno spazio di lavoro guild
  - H2: Modello di runtime
  - H2: Canali forum
  - H2: Componenti interattivi
  - H2: Controllo degli accessi e instradamento
  - H3: Instradamento degli agenti basato sui ruoli
  - H2: Comandi nativi e autenticazione dei comandi
  - H2: Dettagli delle funzionalità
  - H2: Strumenti e gate delle azioni
  - H2: Interfaccia Components v2
  - H2: Voce
  - H3: Canali vocali
  - H3: Seguire gli utenti in voce
  - H3: Messaggi vocali
  - H2: Risoluzione dei problemi
  - H2: Riferimento di configurazione
  - H2: Sicurezza e operazioni
  - H2: Correlati

## channels/feishu.md

- Percorso: /channels/feishu
- Intestazioni:
  - H2: Avvio rapido
  - H2: Controllo degli accessi
  - H3: Messaggi diretti
  - H3: Chat di gruppo
  - H2: Esempi di configurazione dei gruppi
  - H3: Consentire tutti i gruppi, senza richiedere @mention
  - H3: Consentire tutti i gruppi, richiedendo comunque @mention
  - H3: Consentire solo gruppi specifici
  - H3: Limitare i mittenti all'interno di un gruppo
  - H2: Ottenere ID gruppo/utente
  - H3: ID gruppo (chatid, formato: ocxxx)
  - H3: ID utente (openid, formato: ouxxx)
  - H2: Comandi comuni
  - H2: Risoluzione dei problemi
  - H3: Il bot non risponde nelle chat di gruppo
  - H3: Il bot non riceve messaggi
  - H3: La configurazione QR non reagisce nell'app mobile Feishu
  - H3: App Secret trapelato
  - H2: Configurazione avanzata
  - H3: Account multipli
  - H3: Limiti dei messaggi
  - H3: Streaming
  - H3: Ottimizzazione della quota
  - H3: Sessioni ACP
  - H4: Binding ACP persistente
  - H4: Generare ACP dalla chat
  - H3: Instradamento multi-agente
  - H2: Isolamento degli agenti per utente (creazione dinamica di agenti)
  - H3: Configurazione rapida
  - H3: Come funziona
  - H3: Opzioni di configurazione
  - H3: Ambito della sessione
  - H3: Distribuzione multiutente tipica
  - H3: Verifica
  - H3: Note
  - H2: Riferimento di configurazione
  - H2: Tipi di messaggio supportati
  - H3: Ricezione
  - H3: Invio
  - H3: Thread e risposte
  - H2: Correlati

## channels/googlechat.md

- Percorso: /channels/googlechat
- Intestazioni:
  - H2: Installazione
  - H2: Configurazione rapida (principiante)
  - H2: Aggiungere a Google Chat
  - H2: URL pubblico (solo Webhook)
  - H3: Opzione A: Tailscale Funnel (consigliato)
  - H3: Opzione B: reverse proxy (Caddy)
  - H3: Opzione C: Cloudflare Tunnel
  - H2: Come funziona
  - H2: Target
  - H2: Aspetti principali della config
  - H2: Risoluzione dei problemi
  - H3: 405 Method Not Allowed
  - H3: Altri problemi
  - H2: Correlati

## channels/group-messages.md

- Percorso: /channels/group-messages
- Intestazioni:
  - H2: Comportamento
  - H2: Esempio config (WhatsApp)
  - H3: Comando di attivazione (solo owner)
  - H2: Come usare
  - H2: Test / verifica
  - H2: Considerazioni note
  - H2: Correlati

## channels/groups.md

- Percorso: /channels/groups
- Intestazioni:
  - H2: Introduzione per principianti (2 minuti)
  - H2: Risposte visibili
  - H2: Visibilità del contesto e allowlist
  - H2: Chiavi di sessione
  - H2: Pattern: DM personali + gruppi pubblici (agente singolo)
  - H2: Etichette di visualizzazione
  - H2: Policy di gruppo
  - H2: Gate delle menzioni (predefinito)
  - H2: Definire l'ambito dei pattern di menzione configurati
  - H2: Restrizioni degli strumenti per gruppo/canale (opzionale)
  - H2: Allowlist dei gruppi
  - H2: Attivazione (solo owner)
  - H2: Campi di contesto
  - H2: Specificità di iMessage
  - H2: Prompt di sistema WhatsApp
  - H2: Specificità di WhatsApp
  - H2: Correlati

## channels/imessage-from-bluebubbles.md

- Percorso: /channels/imessage-from-bluebubbles
- Intestazioni:
  - H2: Checklist di migrazione
  - H2: Quando questa migrazione ha senso
  - H2: Cosa fa imsg
  - H2: Prima di iniziare
  - H2: Traduzione della config
  - H2: Trappola del registro dei gruppi
  - H2: Passo dopo passo
  - H2: Parità delle azioni a colpo d'occhio
  - H2: Abbinamento, sessioni e binding ACP
  - H2: Nessun canale di rollback
  - H2: Correlati

## channels/imessage.md

- Percorso: /channels/imessage
- Intestazioni:
  - H2: Configurazione rapida
  - H2: Requisiti e autorizzazioni (macOS)
  - H2: Abilitare l'API privata imsg
  - H3: Configurazione
  - H3: Quando non puoi disabilitare SIP
  - H2: Controllo degli accessi e instradamento
  - H2: Binding delle conversazioni ACP
  - H2: Pattern di distribuzione
  - H2: Media, suddivisione in chunk e target di consegna
  - H2: Azioni API private
  - H2: Scritture della config
  - H2: Coalescenza dei DM con invio diviso (comando + URL in un'unica composizione)
  - H3: Scenari e cosa vede l'agente
  - H2: Ripristino in ingresso dopo il riavvio di un bridge o del Gateway
  - H3: Segnale visibile all'operatore
  - H3: Migrazione
  - H2: Risoluzione dei problemi
  - H2: Puntatori al riferimento di configurazione
  - H2: Correlati

## channels/index.md

- Percorso: /channels
- Intestazioni:
  - H2: Note di consegna
  - H2: Canali supportati
  - H2: Note

## channels/irc.md

- Percorso: /channels/irc
- Intestazioni:
  - H2: Avvio rapido
  - H2: Impostazioni di sicurezza predefinite
  - H2: Controllo degli accessi
  - H3: Errore comune: allowFrom è per i DM, non per i canali
  - H2: Attivazione delle risposte (menzioni)
  - H2: Nota di sicurezza (consigliata per canali pubblici)
  - H3: Stessi strumenti per tutti nel canale
  - H3: Strumenti diversi per mittente (l'owner ottiene più potere)
  - H2: NickServ
  - H2: Variabili di ambiente
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/line.md

- Percorso: /channels/line
- Titoli:
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

- Percorso: /channels/location
- Titoli:
  - H2: Formattazione del testo
  - H2: Campi di contesto
  - H2: Note sul canale
  - H2: Correlati

## channels/matrix-migration.md

- Percorso: /channels/matrix-migration
- Titoli:
  - H2: Cosa fa automaticamente la migrazione
  - H2: Cosa non può fare automaticamente la migrazione
  - H2: Flusso di aggiornamento consigliato
  - H2: Come funziona la migrazione crittografata
  - H2: Messaggi comuni e cosa significano
  - H3: Messaggi di aggiornamento e rilevamento
  - H3: Messaggi di recupero dello stato crittografato
  - H3: Messaggi di recupero manuale
  - H3: Messaggi di installazione di Plugin personalizzati
  - H2: Se la cronologia crittografata ancora non torna disponibile
  - H2: Se vuoi ricominciare da zero per i messaggi futuri
  - H2: Correlati

## channels/matrix-presentation.md

- Percorso: /channels/matrix-presentation
- Titoli:
  - H2: Contenuto degli eventi
  - H2: Comportamento di fallback
  - H2: Blocchi supportati
  - H2: Interazioni
  - H2: Relazione con i metadati di approvazione
  - H2: Messaggi multimediali

## channels/matrix-push-rules.md

- Percorso: /channels/matrix-push-rules
- Titoli:
  - H2: Prerequisiti
  - H2: Passaggi
  - H2: Note multi-bot
  - H2: Note sull'homeserver
  - H2: Correlati

## channels/matrix.md

- Percorso: /channels/matrix
- Titoli:
  - H2: Installa
  - H2: Configurazione iniziale
  - H3: Configurazione iniziale interattiva
  - H3: Configurazione minima
  - H3: Unione automatica
  - H3: Formati dei destinatari allowlist
  - H3: Normalizzazione dell'ID account
  - H3: Credenziali memorizzate nella cache
  - H3: Variabili d'ambiente
  - H2: Esempio di configurazione
  - H2: Anteprime in streaming
  - H2: Messaggi vocali
  - H2: Metadati di approvazione
  - H3: Regole push self-hosted per anteprime finalizzate silenziose
  - H2: Stanze bot-a-bot
  - H2: Crittografia e verifica
  - H3: Abilita la crittografia
  - H3: Stato e segnali di attendibilità
  - H3: Verifica questo dispositivo con una chiave di recupero
  - H3: Esegui il bootstrap o ripara il cross-signing
  - H3: Backup delle chiavi delle stanze
  - H3: Elencare, richiedere e rispondere alle verifiche
  - H3: Note multi-account
  - H2: Gestione del profilo
  - H2: Thread
  - H3: Instradamento delle sessioni (sessionScope)
  - H3: Risposte in thread (threadReplies)
  - H3: Ereditarietà dei thread e comandi slash
  - H2: Associazioni conversazione ACP
  - H3: Configurazione dell'associazione dei thread
  - H2: Reazioni
  - H2: Contesto della cronologia
  - H2: Visibilità del contesto
  - H2: Criteri DM e stanza
  - H2: Riparazione delle stanze dirette
  - H2: Approvazioni exec
  - H2: Comandi slash
  - H2: Multi-account
  - H2: Homeserver privati/LAN
  - H2: Proxy del traffico Matrix
  - H2: Risoluzione dei destinatari
  - H2: Riferimento di configurazione
  - H3: Account e connessione
  - H3: Crittografia
  - H3: Accesso e criterio
  - H3: Comportamento delle risposte
  - H3: Impostazioni delle reazioni
  - H3: Strumenti e override per stanza
  - H3: Impostazioni di approvazione exec
  - H2: Correlati

## channels/mattermost.md

- Percorso: /channels/mattermost
- Titoli:
  - H2: Installa
  - H2: Configurazione iniziale rapida
  - H2: Comandi slash nativi
  - H2: Variabili d'ambiente (account predefinito)
  - H2: Modalità chat
  - H2: Threading e sessioni
  - H2: Controllo degli accessi (DM)
  - H2: Canali (gruppi)
  - H2: Destinatari per la consegna in uscita
  - H2: Nuovo tentativo del canale DM
  - H2: Streaming delle anteprime
  - H2: Reazioni (strumento messaggio)
  - H2: Pulsanti interattivi (strumento messaggio)
  - H3: Integrazione API diretta (script esterni)
  - H2: Adattatore directory
  - H2: Multi-account
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/msteams.md

- Percorso: /channels/msteams
- Titoli:
  - H2: Plugin incluso
  - H2: Configurazione iniziale rapida
  - H2: Obiettivi
  - H2: Scritture della configurazione
  - H2: Controllo degli accessi (DM + gruppi)
  - H3: Come funziona
  - H3: Passaggio 1: crea Azure Bot
  - H3: Passaggio 2: ottieni le credenziali
  - H3: Passaggio 3: configura l'endpoint di messaggistica
  - H3: Passaggio 4: abilita il canale Teams
  - H3: Passaggio 5: crea il manifesto dell'app Teams
  - H3: Passaggio 6: configura OpenClaw
  - H3: Passaggio 7: esegui il Gateway
  - H2: Autenticazione federata (certificato più identità gestita)
  - H3: Opzione A: autenticazione basata su certificato
  - H3: Opzione B: Azure Managed Identity
  - H3: Configurazione AKS Workload Identity
  - H3: Confronto dei tipi di autenticazione
  - H2: Sviluppo locale (tunneling)
  - H2: Test del Bot
  - H2: Variabili d'ambiente
  - H2: Azione informazioni membro
  - H2: Contesto della cronologia
  - H2: Autorizzazioni RSC Teams attuali (manifesto)
  - H2: Esempio di manifesto Teams (redatto)
  - H3: Avvertenze sul manifesto (campi obbligatori)
  - H3: Aggiornamento di un'app esistente
  - H2: Capacità: solo RSC vs Graph
  - H3: Con solo Teams RSC (app installata, nessuna autorizzazione Graph API)
  - H3: Con Teams RSC + autorizzazioni applicazione Microsoft Graph
  - H3: RSC vs Graph API
  - H2: Media + cronologia abilitati da Graph (obbligatori per i canali)
  - H2: Limitazioni note
  - H3: Timeout dei Webhook
  - H3: Supporto per cloud Teams e URL di servizio
  - H3: Formattazione
  - H2: Configurazione
  - H2: Instradamento e sessioni
  - H2: Stile di risposta: thread vs post
  - H3: Precedenza di risoluzione
  - H3: Conservazione del contesto del thread
  - H2: Allegati e immagini
  - H2: Invio di file nelle chat di gruppo
  - H3: Perché le chat di gruppo richiedono SharePoint
  - H3: Configurazione iniziale
  - H3: Comportamento di condivisione
  - H3: Comportamento di fallback
  - H3: Posizione di archiviazione dei file
  - H2: Sondaggi (Adaptive Cards)
  - H2: Schede di presentazione
  - H2: Formati dei destinatari
  - H2: Messaggistica proattiva
  - H2: ID team e canale (insidia comune)
  - H2: Canali privati
  - H2: Risoluzione dei problemi
  - H3: Problemi comuni
  - H3: Errori di caricamento del manifesto
  - H3: Autorizzazioni RSC non funzionanti
  - H2: Riferimenti
  - H2: Correlati

## channels/nextcloud-talk.md

- Percorso: /channels/nextcloud-talk
- Titoli:
  - H2: Plugin incluso
  - H2: Configurazione iniziale rapida (principiante)
  - H2: Note
  - H2: Controllo degli accessi (DM)
  - H2: Stanze (gruppi)
  - H2: Capacità
  - H2: Riferimento di configurazione (Nextcloud Talk)
  - H2: Correlati

## channels/nostr.md

- Percorso: /channels/nostr
- Titoli:
  - H2: Plugin incluso
  - H3: Installazioni precedenti/personalizzate
  - H3: Configurazione iniziale non interattiva
  - H2: Configurazione iniziale rapida
  - H2: Riferimento di configurazione
  - H2: Metadati del profilo
  - H2: Controllo degli accessi
  - H3: Criteri DM
  - H3: Esempio di allowlist
  - H2: Formati delle chiavi
  - H2: Relay
  - H2: Supporto del protocollo
  - H2: Test
  - H3: Relay locale
  - H3: Test manuale
  - H2: Risoluzione dei problemi
  - H3: Messaggi non ricevuti
  - H3: Risposte non inviate
  - H3: Risposte duplicate
  - H2: Sicurezza
  - H2: Limitazioni (MVP)
  - H2: Correlati

## channels/pairing.md

- Percorso: /channels/pairing
- Titoli:
  - H2: 1) Associazione DM (accesso alla chat in entrata)
  - H3: Approva un mittente
  - H3: Gruppi mittenti riutilizzabili
  - H3: Dove risiede lo stato
  - H2: 2) Associazione dispositivo Node (nodi iOS/Android/macOS/headless)
  - H3: Associa tramite Telegram (consigliato per iOS)
  - H3: Approva un dispositivo nodo
  - H3: Approvazione automatica nodo trusted-CIDR opzionale
  - H3: Archiviazione dello stato di associazione Node
  - H3: Note
  - H2: Documenti correlati

## channels/qa-channel.md

- Percorso: /channels/qa-channel
- Titoli:
  - H2: Cosa fa
  - H2: Configurazione
  - H2: Runner
  - H2: Correlati

## channels/qqbot.md

- Percorso: /channels/qqbot
- Titoli:
  - H2: Installa
  - H2: Configurazione iniziale
  - H2: Configura
  - H3: Configurazione multi-account
  - H3: Chat di gruppo
  - H3: Voce (STT / TTS)
  - H2: Formati dei destinatari
  - H2: Comandi slash
  - H2: Architettura del motore
  - H2: Onboarding con codice QR
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/raft.md

- Percorso: /channels/raft
- Titoli:
  - H2: Installa
  - H2: Prerequisiti
  - H2: Configura
  - H2: Come funziona
  - H2: Verifica
  - H2: Risoluzione dei problemi
  - H2: Riferimenti

## channels/signal.md

- Percorso: /channels/signal
- Titoli:
  - H2: Prerequisiti
  - H2: Configurazione iniziale rapida (principiante)
  - H2: Che cos'è
  - H2: Scritture della configurazione
  - H2: Il modello del numero (importante)
  - H2: Percorso di configurazione A: collega l'account Signal esistente (QR)
  - H2: Percorso di configurazione B: registra un numero bot dedicato (SMS, Linux)
  - H2: Modalità daemon esterno (httpUrl)
  - H2: Modalità container (bbernhard/signal-cli-rest-api)
  - H2: Controllo degli accessi (DM + gruppi)
  - H2: Come funziona (comportamento)
  - H2: Media + limiti
  - H2: Digitazione + conferme di lettura
  - H2: Reazioni (strumento messaggio)
  - H2: Reazioni di approvazione
  - H2: Destinatari di consegna (CLI/cron)
  - H2: Risoluzione dei problemi
  - H2: Note di sicurezza
  - H2: Riferimento di configurazione (Signal)
  - H2: Correlati

## channels/slack.md

- Percorso: /channels/slack
- Titoli:
  - H2: Scelta tra Socket Mode e URL di richiesta HTTP
  - H3: Modalità relay
  - H2: Installa
  - H2: Configurazione iniziale rapida
  - H2: Regolazione del trasporto Socket Mode
  - H2: Checklist di manifesto e ambiti
  - H3: Impostazioni aggiuntive del manifesto
  - H2: Modello dei token
  - H2: Azioni e gate
  - H2: Controllo degli accessi e instradamento
  - H2: Threading, sessioni e tag di risposta
  - H2: Reazioni ack
  - H3: Emoji (ackReaction)
  - H3: Ambito (messages.ackReactionScope)
  - H2: Streaming del testo
  - H2: Fallback della reazione di digitazione
  - H2: Media, segmentazione e consegna
  - H2: Comandi e comportamento slash
  - H2: Risposte interattive
  - H3: Invii di modali di proprietà del Plugin
  - H2: Approvazioni native in Slack
  - H2: Eventi e comportamento operativo
  - H2: Riferimento di configurazione
  - H2: Risoluzione dei problemi
  - H2: Riferimento visione allegati
  - H3: Tipi di media supportati
  - H3: Pipeline in entrata
  - H3: Ereditarietà degli allegati della radice del thread
  - H3: Gestione di allegati multipli
  - H3: Limiti di dimensione, download e modello
  - H3: Limiti noti
  - H3: Documentazione correlata
  - H2: Correlati

## channels/sms.md

- Percorso: /channels/sms
- Titoli:
  - H2: Prima di iniziare
  - H2: Configurazione iniziale rapida
  - H2: Esempi di configurazione
  - H3: File di configurazione
  - H3: Variabili d'ambiente
  - H3: Token di autenticazione SecretRef
  - H3: Numero privato solo allowlist
  - H3: Mittente Messaging Service
  - H3: Destinatario in uscita predefinito
  - H2: Controllo degli accessi
  - H2: Invio di SMS
  - H2: Verifica della configurazione
  - H3: Test end-to-end da macOS iMessage/SMS
  - H2: Sicurezza del Webhook
  - H2: Configurazione multi-account
  - H2: Risoluzione dei problemi
  - H3: Twilio restituisce 403 o OpenClaw rifiuta il Webhook
  - H3: Non compare alcuna richiesta di associazione
  - H3: Gli invii in uscita non riescono
  - H3: I messaggi arrivano ma l'agente non risponde

## channels/synology-chat.md

- Percorso: /channels/synology-chat
- Titoli:
  - H2: Plugin incluso
  - H2: Configurazione iniziale rapida
  - H2: Variabili d'ambiente
  - H2: Criterio DM e controllo degli accessi
  - H2: Consegna in uscita
  - H2: Multi-account
  - H2: Note di sicurezza
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/telegram.md

- Percorso: /channels/telegram
- Titoli:
  - H2: Configurazione iniziale rapida
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

- Percorso: /channels/tlon
- Titoli:
  - H2: Plugin incluso
  - H2: Configurazione iniziale
  - H2: Navi private/LAN
  - H2: Canali di gruppo
  - H2: Controllo degli accessi
  - H2: Proprietario e sistema di approvazione
  - H2: Impostazioni di accettazione automatica
  - H2: Destinatari di consegna (CLI/cron)
  - H2: Skill incluso
  - H2: Capacità
  - H2: Risoluzione dei problemi
  - H2: Riferimento di configurazione
  - H2: Note
  - H2: Correlati

## channels/troubleshooting.md

- Percorso: /channels/troubleshooting
- Titoli:
  - H2: Sequenza di comandi
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
  - H2: Plugin incluso
  - H2: Configurazione rapida (principianti)
  - H2: Che cos'è
  - H2: Configurazione (dettagliata)
  - H3: Genera credenziali
  - H3: Configura il bot
  - H3: Controllo degli accessi (consigliato)
  - H2: Aggiornamento del token (opzionale)
  - H2: Supporto multi-account
  - H2: Controllo degli accessi
  - H2: Risoluzione dei problemi
  - H2: Configurazione
  - H3: Configurazione account
  - H3: Opzioni provider
  - H2: Azioni degli strumenti
  - H2: Sicurezza e operazioni
  - H2: Limiti
  - H2: Correlati

## channels/wechat.md

- Percorso: /channels/wechat
- Intestazioni:
  - H2: Nomi
  - H2: Come funziona
  - H2: Installa
  - H2: Accesso
  - H2: Controllo degli accessi
  - H2: Compatibilità
  - H2: Processo sidecar
  - H2: Risoluzione dei problemi
  - H2: Documentazione correlata

## channels/whatsapp.md

- Percorso: /channels/whatsapp
- Intestazioni:
  - H2: Installazione (su richiesta)
  - H2: Configurazione rapida
  - H2: Modelli di distribuzione
  - H2: Modello runtime
  - H2: Prompt di approvazione
  - H2: Hook Plugin e privacy
  - H2: Controllo degli accessi e attivazione
  - H2: Binding ACP configurati
  - H2: Comportamento con numero personale e chat con se stessi
  - H2: Normalizzazione dei messaggi e contesto
  - H2: Consegna, suddivisione in blocchi e media
  - H2: Citazione delle risposte
  - H2: Livello di reazione
  - H2: Reazioni di conferma
  - H2: Reazioni di stato del ciclo di vita
  - H2: Multi-account e credenziali
  - H2: Strumenti, azioni e scritture di configurazione
  - H2: Risoluzione dei problemi
  - H2: Prompt di sistema
  - H2: Riferimenti alla configurazione
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
  - H3: Disabilita il requisito di @menzione nei gruppi
  - H3: Ottimizza la consegna dei messaggi in uscita
  - H3: Regola la strategia di unione del testo
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
  - H3: Modalità risposta a
  - H3: Iniezione di suggerimenti Markdown
  - H3: Modalità debug
  - H3: Instradamento multi-agente
  - H2: Riferimento di configurazione
  - H2: Tipi di messaggio supportati
  - H3: Ricezione
  - H3: Invio
  - H3: Thread e risposte
  - H2: Correlati

## channels/zalo.md

- Percorso: /channels/zalo
- Intestazioni:
  - H2: Plugin incluso
  - H2: Configurazione rapida (principianti)
  - H2: Che cos'è
  - H2: Configurazione (percorso rapido)
  - H3: 1) Crea un token bot (Zalo Bot Platform)
  - H3: 2) Configura il token (env o configurazione)
  - H2: Come funziona (comportamento)
  - H2: Limiti
  - H2: Controllo degli accessi (DM)
  - H3: Accesso DM
  - H2: Controllo degli accessi (gruppi)
  - H2: Long polling vs Webhook
  - H2: Tipi di messaggio supportati
  - H2: Capacità
  - H2: Destinazioni di consegna (CLI/Cron)
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
  - H2: Plugin incluso
  - H2: Configurazione rapida (principianti)
  - H2: Che cos'è
  - H2: Nomi
  - H2: Trovare gli ID (directory)
  - H2: Limiti
  - H2: Controllo degli accessi (DM)
  - H2: Accesso ai gruppi (opzionale)
  - H3: Gate delle menzioni di gruppo
  - H2: Multi-account
  - H2: Variabili d'ambiente
  - H2: Digitazione, reazioni e conferme di consegna
  - H2: Risoluzione dei problemi
  - H2: Correlati

## ci.md

- Percorso: /ci
- Intestazioni:
  - H2: Panoramica della pipeline
  - H2: Ordine fail-fast
  - H2: Contesto ed evidenze della PR
  - H2: Ambito e instradamento
  - H2: Inoltro dell'attività di ClawSweeper
  - H2: Dispatch manuali
  - H2: Runner
  - H2: Budget di registrazione dei runner
  - H2: Equivalenti locali
  - H2: Prestazioni di OpenClaw
  - H2: Validazione completa della release
  - H2: Shard live ed E2E
  - H2: Accettazione del pacchetto
  - H3: Job
  - H3: Origini candidate
  - H3: Profili della suite
  - H3: Finestre di compatibilità legacy
  - H3: Esempi
  - H2: Smoke test di installazione
  - H2: E2E Docker locale
  - H3: Parametri regolabili
  - H3: Workflow live/E2E riutilizzabile
  - H3: Chunk del percorso di release
  - H2: Prerelease Plugin
  - H2: QA Lab
  - H2: CodeQL
  - H3: Categorie di sicurezza
  - H3: Shard di sicurezza specifici della piattaforma
  - H3: Categorie di qualità critica
  - H2: Workflow di manutenzione
  - H3: Agente docs
  - H3: Agente prestazioni dei test
  - H3: PR duplicate dopo il merge
  - H2: Gate di controllo locali e instradamento delle modifiche
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
  - H2: Flusso di release
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
  - H2: Mappatura delle sessioni
  - H2: Opzioni
  - H3: Opzioni client acp
  - H2: Correlati

## cli/agent.md

- Percorso: /cli/agent
- Intestazioni:
  - H1: openclaw agent
  - H2: Opzioni
  - H2: Esempi
  - H2: Note
  - H2: Stato di consegna JSON
  - H2: Correlati

## cli/agents.md

- Percorso: /cli/agents
- Intestazioni:
  - H1: openclaw agents
  - H2: Esempi
  - H2: Binding di instradamento
  - H3: formato --bind
  - H3: Comportamento dell'ambito del binding
  - H2: Superficie dei comandi
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete
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
  - H2: Esempio "Never prompt" / YOLO
  - H2: Helper allowlist
  - H2: Opzioni comuni
  - H2: Note
  - H2: Correlati

## cli/backup.md

- Percorso: /cli/backup
- Intestazioni:
  - H1: openclaw backup
  - H2: Note
  - H2: Elementi inclusi nel backup
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
  - H2: Se il comando è mancante
  - H2: Profili
  - H2: Schede
  - H2: Snapshot / screenshot / azioni
  - H2: Stato e archiviazione
  - H2: Debug
  - H2: Chrome esistente tramite MCP
  - H2: Controllo browser remoto (proxy host Node)
  - H2: Correlati

## cli/channels.md

- Percorso: /cli/channels
- Intestazioni:
  - H1: openclaw channels
  - H2: Comandi comuni
  - H2: Stato / capacità / risoluzione / log
  - H2: Aggiungi / rimuovi account
  - H2: Accesso e disconnessione (interattivi)
  - H2: Risoluzione dei problemi
  - H2: Probe delle capacità
  - H2: Risolvi nomi in ID
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
  - H2: Opzioni root
  - H2: Esempi
  - H3: schema di configurazione
  - H3: Percorsi
  - H2: Valori
  - H2: Modalità config set
  - H2: config patch
  - H2: Flag del builder provider
  - H2: Simulazione
  - H3: Forma dell'output JSON
  - H2: Sicurezza di scrittura
  - H2: Sottocomandi
  - H2: Valida
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
  - H2: Pianificatore assistito dal modello
  - H2: Passaggio a un agente
  - H2: Modalità recupero messaggi
  - H2: Correlati

## cli/cron.md

- Percorso: /cli/cron
- Intestazioni:
  - H1: openclaw cron
  - H2: Crea job rapidamente
  - H2: Sessioni
  - H2: Consegna
  - H3: Proprietà della consegna
  - H3: Consegna in caso di errore
  - H2: Pianificazione
  - H3: Job one-shot
  - H3: Job ricorrenti
  - H3: Esecuzioni manuali
  - H2: Modelli
  - H3: Precedenza del modello Cron isolato
  - H3: Modalità rapida
  - H3: Nuovi tentativi di cambio modello live
  - H2: Output dell'esecuzione e rifiuti
  - H3: Soppressione delle conferme obsolete
  - H3: Soppressione dei token silenziosi
  - H3: Rifiuti strutturati
  - H2: Conservazione
  - H2: Migrazione di job meno recenti
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
  - H3: openclaw devices remove
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Approvazione al primo avvio di Paperclip / openclawgateway
  - H3: openclaw devices reject
  - H3: openclaw devices rotate --device --role [--scope ]
  - H3: openclaw devices revoke --device --role
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
  - H2: Modalità post-aggiornamento
  - H2: macOS: override env di launchctl
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
  - H4: Remoto via SSH (parità app Mac)
  - H3: gateway call
  - H2: Gestisci il servizio Gateway
  - H3: Installa con un wrapper
  - H2: Scopri i gateway (Bonjour)
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
  - H2: Controlla l'idoneità degli hook
  - H2: Abilita un Hook
  - H2: Disabilita un Hook
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
  - H2: Errori comuni
  - H2: Note
  - H2: Correlati

## cli/logs.md

- Percorso: /cli/logs
- Intestazioni:
  - H1: openclaw logs
  - H2: Opzioni
  - H2: Opzioni RPC condivise del Gateway
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
  - H3: Modello degli eventi
  - H3: Notifiche del canale Claude
  - H3: Configurazione del client MCP
  - H3: Opzioni
  - H3: Sicurezza e confine di attendibilità
  - H3: Test
  - H3: Risoluzione dei problemi
  - H2: OpenClaw come registro client MCP
  - H3: Definizioni dei server MCP salvate
  - H3: Ricette comuni per server
  - H3: Formati di output JSON
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
  - H3: Stato di archivio e revisione manuale
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
  - H2: Perché usare un host Node?
  - H2: Proxy browser (zero-config)
  - H2: Esegui (foreground)
  - H2: Autenticazione Gateway per host Node
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
  - H2: Localizzazione
  - H3: Scelte endpoint Z.AI non interattive
  - H2: Flag non interattivi aggiuntivi
  - H2: Note sul flusso
  - H2: Comandi di follow-up comuni

## cli/pairing.md

- Percorso: /cli/pairing
- Intestazioni:
  - H1: openclaw pairing
  - H2: Comandi
  - H2: elenco pairing
  - H2: approva pairing
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
  - H3: resolve
  - H3: find
  - H3: set
  - H3: validate
  - H3: emit
  - H2: Codici di uscita
  - H2: Modalità di output
  - H2: Note
  - H2: Correlati

## cli/plugins.md

- Percorso: /cli/plugins
- Intestazioni:
  - H2: Comandi
  - H3: Autore
  - H3: Scaffold del provider
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
  - H3: Riferimento alle regole dei criteri
  - H4: Overlay con ambito
  - H4: Canali
  - H4: Server MCP
  - H4: Provider di modelli
  - H4: Rete
  - H4: Accesso in ingresso e ai canali
  - H4: Gateway
  - H4: Area di lavoro dell'agente
  - H4: Postura della sandbox
  - H4: Gestione dei dati
  - H4: Segreti
  - H4: Approvazioni exec
  - H4: Profili di autenticazione
  - H4: Metadati degli strumenti
  - H4: Postura degli strumenti
  - H2: Configura criteri
  - H2: Accetta stato dei criteri
  - H2: Risultati
  - H2: Ripara
  - H2: Codici di uscita
  - H2: Correlati

## cli/proxy.md

- Percorso: /cli/proxy
- Intestazioni:
  - H1: openclaw proxy
  - H2: Comandi
  - H2: Valida
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
  - H3: Dopo aver cambiato la configurazione della sandbox
  - H3: Dopo aver cambiato la destinazione SSH o il materiale di autenticazione SSH
  - H3: Dopo aver cambiato sorgente, criterio o modalità OpenShell
  - H3: Dopo aver cambiato setupCommand
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
  - H2: Perché niente backup di rollback
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
  - H2: evento system
  - H2: system heartbeat last|enable|disable
  - H2: presenza system
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
  - H2: stato update
  - H2: riparazione update
  - H2: procedura guidata update
  - H2: Cosa fa
  - H3: Forma della risposta del piano di controllo
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
  - H3: opzioni gog watch serve
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
  - H3: wiki ingest
  - H3: wiki okf import
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search
  - H3: wiki get
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: Guida pratica all'uso
  - H2: Collegamenti di configurazione
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
  - H3: Non appare nessuna scheda
  - H3: Dispatch indica solo dati
  - H3: Dispatch non avvia nulla
  - H2: Correlati

## concepts/active-memory.md

- Percorso: /concepts/active-memory
- Intestazioni:
  - H2: Avvio rapido
  - H2: Consigli sulla velocità
  - H3: Configurazione Cerebras
  - H2: Come visualizzarla
  - H2: Interruttore sessione
  - H2: Quando viene eseguita
  - H2: Tipi di sessione
  - H2: Dove viene eseguita
  - H2: Perché usarla
  - H2: Come funziona
  - H2: Modalità di query
  - H2: Stili di prompt
  - H2: Criterio di fallback del modello
  - H2: Strumenti di memoria
  - H3: memory-core integrato
  - H3: Memoria LanceDB
  - H3: Claw senza perdita
  - H2: Escape hatch avanzate
  - H2: Persistenza della trascrizione
  - H2: Configurazione
  - H2: Configurazione consigliata
  - H3: Grace period per avvio a freddo
  - H2: Debug
  - H2: Problemi comuni
  - H2: Pagine correlate

## concepts/agent-loop.md

- Percorso: /concepts/agent-loop
- Intestazioni:
  - H2: Punti di ingresso
  - H2: Come funziona (alto livello)
  - H2: Accodamento + concorrenza
  - H2: Preparazione di sessione + area di lavoro
  - H2: Assemblaggio del prompt + prompt di sistema
  - H2: Punti hook (dove puoi intercettare)
  - H3: Hook interni (hook Gateway)
  - H3: Hook Plugin (ciclo di vita agente + gateway)
  - H2: Streaming + risposte parziali
  - H2: Esecuzione degli strumenti + strumenti di messaggistica
  - H2: Modellazione + soppressione della risposta
  - H2: Compaction + nuovi tentativi
  - H2: Flussi di eventi (oggi)
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
  - H2: Cartelle aggiuntive dell'area di lavoro
  - H2: Mappa dei file dell'area di lavoro
  - H2: Cosa NON è nell'area di lavoro
  - H2: Backup Git (consigliato, privato)
  - H2: Non eseguire il commit dei segreti
  - H2: Spostare l'area di lavoro su una nuova macchina
  - H2: Note avanzate
  - H2: Correlati

## concepts/agent.md

- Percorso: /concepts/agent
- Intestazioni:
  - H2: Workspace (obbligatorio)
  - H2: File di bootstrap (iniettati)
  - H2: Strumenti integrati
  - H2: Skills
  - H2: Confini di runtime
  - H2: Sessioni
  - H2: Pilotaggio durante lo streaming
  - H2: Riferimenti modello
  - H2: Configurazione (minima)
  - H2: Correlati

- Percorso: /concepts/parallel-specialist-lanes
- Intestazioni:
  - H2: Principi fondamentali
  - H2: Rollout consigliato
  - H3: Fase 1: contratti delle lane + lavoro pesante in background
  - H3: Fase 2: controlli di priorità e concorrenza
  - H3: Fase 3: coordinatore / controller del traffico
  - H2: Template minimo del contratto di lane
  - H2: Correlati

## concepts/personal-agent-benchmark-pack.md

- Percorso: /concepts/personal-agent-benchmark-pack
- Intestazioni:
  - H2: Scenari
  - H2: Modello di privacy
  - H2: Estendere il pack

## concepts/presence.md

- Percorso: /concepts/presence
- Intestazioni:
  - H2: Campi di presenza (cosa viene visualizzato)
  - H2: Produttori (da dove proviene la presenza)
  - H3: 1) Voce autonoma del Gateway
  - H3: 2) Connessione WebSocket
  - H4: Perché i comandi CLI una tantum non vengono visualizzati
  - H3: 3) Beacon system-event
  - H3: 4) Connessione dei Node (ruolo: node)
  - H2: Regole di merge + deduplicazione (perché instanceId è importante)
  - H2: TTL e dimensione limitata
  - H2: Avvertenza remoto/tunnel (IP loopback)
  - H2: Consumer
  - H3: Scheda Istanze macOS
  - H2: Suggerimenti di debug
  - H2: Correlati

## concepts/progress-drafts.md

- Percorso: /concepts/progress-drafts
- Intestazioni:
  - H2: Avvio rapido
  - H2: Cosa vedono gli utenti
  - H2: Scegliere una modalità
  - H2: Configurare le etichette
  - H2: Controllare le righe di avanzamento
  - H2: Comportamento del canale
  - H2: Finalizzazione
  - H2: Risoluzione dei problemi
  - H2: Correlati

## concepts/qa-e2e-automation.md

- Percorso: /concepts/qa-e2e-automation
- Intestazioni:
  - H2: Superficie dei comandi
  - H2: Flusso dell'operatore
  - H2: Copertura del trasporto live
  - H2: Riferimento QA per Telegram, Discord, Slack e WhatsApp
  - H3: Flag CLI condivisi
  - H3: QA Telegram
  - H3: QA Discord
  - H3: QA Slack
  - H4: Configurazione dell'area di lavoro Slack
  - H3: QA WhatsApp
  - H3: Pool di credenziali Convex
  - H2: Seed basati sul repo
  - H2: Lane mock dei provider
  - H2: Adapter di trasporto
  - H3: Aggiungere un canale
  - H3: Nomi degli helper di scenario
  - H2: Report
  - H2: Documenti correlati

## concepts/qa-matrix.md

- Percorso: /concepts/qa-matrix
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

- Percorso: /concepts/queue-steering
- Intestazioni:
  - H2: Confine del runtime
  - H2: Modalità
  - H2: Esempio di burst
  - H2: Ambito
  - H2: Debounce
  - H2: Correlati

## concepts/queue.md

- Percorso: /concepts/queue
- Intestazioni:
  - H2: Perché
  - H2: Come funziona
  - H2: Valori predefiniti
  - H2: Modalità della coda
  - H2: Opzioni della coda
  - H2: Steering e streaming
  - H2: Precedenza
  - H2: Override per sessione
  - H2: Ambito e garanzie
  - H2: Risoluzione dei problemi
  - H2: Correlati

## concepts/retry.md

- Percorso: /concepts/retry
- Intestazioni:
  - H2: Obiettivi
  - H2: Valori predefiniti
  - H2: Comportamento
  - H3: Provider di modelli
  - H3: Discord
  - H3: Telegram
  - H2: Configurazione
  - H2: Note
  - H2: Correlati

## concepts/session-pruning.md

- Percorso: /concepts/session-pruning
- Intestazioni:
  - H2: Perché è importante
  - H2: Come funziona
  - H2: Pulizia delle immagini legacy
  - H2: Valori predefiniti intelligenti
  - H2: Abilitare o disabilitare
  - H2: Pruning vs Compaction
  - H2: Ulteriori letture
  - H2: Correlati

## concepts/session-tool.md

- Percorso: /concepts/session-tool
- Intestazioni:
  - H2: Strumenti disponibili
  - H2: Elencare e leggere le sessioni
  - H2: Inviare messaggi tra sessioni
  - H2: Helper di stato e orchestrazione
  - H2: Generare sub-agent
  - H2: Visibilità
  - H2: Ulteriori letture
  - H2: Correlati

## concepts/session.md

- Percorso: /concepts/session
- Intestazioni:
  - H2: Come vengono instradati i messaggi
  - H2: Isolamento dei DM
  - H3: Canali collegati al dock
  - H2: Ciclo di vita della sessione
  - H2: Dove risiede lo stato
  - H2: Manutenzione della sessione
  - H2: Ispezionare le sessioni
  - H2: Ulteriori letture
  - H2: Correlati

## concepts/soul.md

- Percorso: /concepts/soul
- Intestazioni:
  - H2: Cosa appartiene a SOUL.md
  - H2: Perché funziona
  - H2: Il prompt di Molty
  - H2: Che aspetto ha un buon risultato
  - H2: Un avvertimento
  - H2: Correlati

## concepts/streaming.md

- Percorso: /concepts/streaming
- Intestazioni:
  - H2: Streaming a blocchi (messaggi di canale)
  - H3: Consegna dei media con streaming a blocchi
  - H2: Algoritmo di suddivisione in chunk (limiti basso/alto)
  - H2: Coalescing (unire i blocchi trasmessi in streaming)
  - H2: Ritmo simile a quello umano tra i blocchi
  - H2: "Chunk in streaming o tutto"
  - H2: Modalità di streaming dell'anteprima
  - H3: Mappatura dei canali
  - H3: Comportamento del runtime
  - H3: Aggiornamenti dell'anteprima dell'avanzamento degli strumenti
  - H3: Lane di avanzamento commentary
  - H2: Correlati

## concepts/system-prompt.md

- Percorso: /concepts/system-prompt
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

- Percorso: /concepts/timezone
- Intestazioni:
  - H2: Tre superfici del fuso orario
  - H2: Impostare il fuso orario dell'utente
  - H2: Quando eseguire l'override
  - H2: Correlati

## concepts/typebox.md

- Percorso: /concepts/typebox
- Intestazioni:
  - H2: Modello mentale (30 secondi)
  - H2: Dove risiedono gli schemi
  - H2: Pipeline attuale
  - H2: Come vengono usati gli schemi a runtime
  - H2: Frame di esempio
  - H2: Client minimo (Node.js)
  - H2: Esempio pratico: aggiungere un metodo end-to-end
  - H2: Comportamento della generazione di codice Swift
  - H2: Versionamento + compatibilità
  - H2: Pattern e convenzioni degli schemi
  - H2: JSON dello schema live
  - H2: Quando modifichi gli schemi
  - H2: Correlati

## concepts/typing-indicators.md

- Percorso: /concepts/typing-indicators
- Intestazioni:
  - H2: Valori predefiniti
  - H2: Modalità
  - H2: Configurazione
  - H2: Note
  - H2: Correlati

## concepts/usage-tracking.md

- Percorso: /concepts/usage-tracking
- Intestazioni:
  - H2: Che cos'è
  - H2: Dove viene visualizzato
  - H2: Modalità predefinita del footer di utilizzo
  - H3: Tre stati di sessione distinti
  - H3: Precedenza
  - H3: Reimpostazione vs disattivazione
  - H3: Comportamento dell'interruttore
  - H3: Config
  - H2: Footer completo /usage personalizzato
  - H3: Forma
  - H3: Percorsi del contratto
  - H3: Verbi
  - H3: Forme dei pezzi
  - H3: Esempio
  - H2: Provider + credenziali
  - H2: Correlati

## date-time.md

- Percorso: /date-time
- Intestazioni:
  - H2: Envelope dei messaggi (locali per impostazione predefinita)
  - H3: Esempi
  - H2: Prompt di sistema: data e ora correnti
  - H2: Righe degli eventi di sistema (locali per impostazione predefinita)
  - H3: Configurare fuso orario utente + formato
  - H2: Rilevamento del formato dell'ora (automatico)
  - H2: Payload degli strumenti + connettori (ora grezza del provider + campi normalizzati)
  - H2: Documenti correlati

## debug/node-issue.md

- Percorso: /debug/node-issue
- Intestazioni:
  - H1: Crash Node + tsx "\\name is not a function"
  - H2: Riepilogo
  - H2: Ambiente
  - H2: Repro (solo Node)
  - H2: Repro minima nel repo
  - H2: Controllo della versione di Node
  - H2: Note / ipotesi
  - H2: Cronologia delle regressioni
  - H2: Soluzioni alternative
  - H2: Riferimenti
  - H2: Passaggi successivi
  - H2: Correlati

## diagnostics/flags.md

- Percorso: /diagnostics/flags
- Intestazioni:
  - H2: Come funziona
  - H2: Abilitare tramite config
  - H2: Override env (una tantum)
  - H2: Flag di profiling
  - H2: Artefatti della timeline
  - H2: Dove finiscono i log
  - H2: Estrarre i log
  - H2: Note
  - H2: Correlati

## gateway/authentication.md

- Percorso: /gateway/authentication
- Intestazioni:
  - H2: Configurazione consigliata (chiave API, qualsiasi provider)
  - H2: Anthropic: compatibilità tra Claude CLI e token
  - H2: Nota su Anthropic
  - H2: Controllare lo stato di autenticazione del modello
  - H2: Comportamento di rotazione della chiave API (Gateway)
  - H2: Rimuovere l'autenticazione del provider mentre il Gateway è in esecuzione
  - H2: Controllare quale credenziale viene usata
  - H3: OpenAI e ID legacy openai-codex
  - H3: Durante il login (CLI)
  - H3: Per sessione (comando chat)
  - H3: Per agent (override CLI)
  - H2: Risoluzione dei problemi
  - H3: "Nessuna credenziale trovata"
  - H3: Token in scadenza/scaduto
  - H2: Correlati

## gateway/background-process.md

- Percorso: /gateway/background-process
- Intestazioni:
  - H2: Strumento exec
  - H2: Bridging dei processi figli
  - H2: Strumento process
  - H2: Esempi
  - H2: Correlati

## gateway/bonjour.md

- Percorso: /gateway/bonjour
- Intestazioni:
  - H2: Bonjour wide-area (Unicast DNS-SD) su Tailscale
  - H3: Config Gateway (consigliata)
  - H3: Configurazione una tantum del server DNS (host Gateway)
  - H3: Impostazioni DNS Tailscale
  - H3: Sicurezza del listener Gateway (consigliata)
  - H2: Cosa annuncia
  - H2: Tipi di servizio
  - H2: Chiavi TXT (suggerimenti non segreti)
  - H2: Debug su macOS
  - H2: Debug nei log del Gateway
  - H2: Debug su nodo iOS
  - H2: Quando abilitare Bonjour
  - H2: Quando disabilitare Bonjour
  - H2: Problemi tipici di Docker
  - H2: Risoluzione dei problemi di Bonjour disabilitato
  - H2: Modalità di errore comuni
  - H2: Nomi di istanza con escape (\032)
  - H2: Abilitazione / disabilitazione / configurazione
  - H2: Documenti correlati

## gateway/bridge-protocol.md

- Percorso: /gateway/bridge-protocol
- Intestazioni:
  - H2: Perché esisteva
  - H2: Trasporto
  - H2: Handshake + abbinamento
  - H2: Frame
  - H2: Eventi del ciclo di vita di exec
  - H2: Uso storico di tailnet
  - H2: Versionamento
  - H2: Correlati

## gateway/cli-backends.md

- Percorso: /gateway/cli-backends
- Intestazioni:
  - H2: Avvio rapido adatto ai principianti
  - H2: Usarlo come fallback
  - H2: Panoramica della configurazione
  - H3: Configurazione di esempio
  - H2: Come funziona
  - H2: Sessioni
  - H2: Preludio di fallback dalle sessioni claude-cli
  - H2: Immagini (pass-through)
  - H2: Input / output
  - H2: Valori predefiniti (di proprietà del Plugin)
  - H2: Valori predefiniti di proprietà del Plugin
  - H2: Proprietà della Compaction nativa
  - H2: Overlay MCP del bundle
  - H2: Limite della cronologia di reseed
  - H2: Limitazioni
  - H2: Risoluzione dei problemi
  - H2: Correlati

## gateway/config-agents.md

- Percorso: /gateway/config-agents
- Intestazioni:
  - H2: Valori predefiniti degli agent
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Override del profilo di bootstrap per agent
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: Mappa della proprietà del budget di contesto
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
  - H3: Policy del runtime
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Streaming a blocchi
  - H3: Indicatori di digitazione
  - H3: agents.defaults.sandbox
  - H3: agents.list (override per agent)
  - H2: Routing multi-agent
  - H3: Campi di corrispondenza del binding
  - H3: Profili di accesso per agent
  - H2: Sessione
  - H2: Messaggi
  - H3: Prefisso della risposta
  - H3: Reazione di ack
  - H3: Debounce in ingresso
  - H3: TTS (text-to-speech)
  - H2: Talk
  - H2: Correlati

## gateway/config-channels.md

- Percorso: /gateway/config-channels
- Intestazioni:
  - H2: Canali
  - H3: Accesso a DM e gruppi
  - H3: Override dei modelli per canale
  - H3: Valori predefiniti del canale e Heartbeat
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
  - H3: Gate delle menzioni nelle chat di gruppo
  - H4: Limiti della cronologia DM
  - H4: Modalità self-chat
  - H3: Comandi (gestione dei comandi chat)
  - H2: Correlati

## gateway/config-tools.md

- Route: /gateway/config-tools
- Intestazioni:
  - H2: Strumenti
  - H3: Profili degli strumenti
  - H3: Gruppi di strumenti
  - H3: Strumenti MCP e Plugin all'interno della policy degli strumenti sandbox
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
- Intestazioni:
  - H2: Avvio rapido
  - H3: Minimo indispensabile
  - H3: Configurazione iniziale consigliata
  - H2: Esempio esteso (opzioni principali)
  - H3: Repository Skills fratello collegato tramite symlink
  - H2: Pattern comuni
  - H3: Baseline Skills condivisa con una sola sovrascrittura
  - H3: Configurazione multipiattaforma
  - H3: Approvazione automatica della rete di nodi attendibili
  - H3: Modalità DM sicura (inbox condivisa / DM multiutente)
  - H3: Chiave API Anthropic + fallback MiniMax
  - H3: Bot di lavoro (accesso limitato)
  - H3: Solo modelli locali
  - H2: Suggerimenti
  - H2: Correlati

## gateway/configuration-reference.md

- Route: /gateway/configuration-reference
- Intestazioni:
  - H2: Canali
  - H2: Impostazioni predefinite degli agenti, multi-agente, sessioni e messaggi
  - H2: Strumenti e provider personalizzati
  - H2: Modelli
  - H2: MCP
  - H2: Skills
  - H2: Plugin
  - H3: Configurazione del plugin harness Codex
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
  - H2: Host del plugin Canvas
  - H2: Discovery
  - H3: mDNS (Bonjour)
  - H3: Wide-area (DNS-SD)
  - H2: Ambiente
  - H3: env (variabili env inline)
  - H3: Sostituzione delle variabili env
  - H2: Segreti
  - H3: SecretRef
  - H3: Superficie credenziali supportata
  - H3: Configurazione dei provider di segreti
  - H2: Archiviazione auth
  - H3: auth.cooldowns
  - H2: Logging
  - H2: Diagnostica
  - H2: Aggiornamento
  - H2: ACP
  - H2: CLI
  - H2: Wizard
  - H2: Identità
  - H2: Bridge (legacy, rimosso)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Variabili del template del modello multimediale
  - H2: Inclusioni di configurazione ($include)
  - H2: Correlati

## gateway/configuration.md

- Route: /gateway/configuration
- Intestazioni:
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
- Intestazioni:
  - H2: Avvio rapido
  - H2: Comando chat
  - H2: Cosa contiene l'esportazione
  - H2: Modello di privacy
  - H2: Registratore di stabilità
  - H2: Opzioni utili
  - H2: Disabilitare la diagnostica
  - H2: Correlati

## gateway/discovery.md

- Route: /gateway/discovery
- Intestazioni:
  - H2: Termini
  - H2: Perché manteniamo sia diretto sia SSH
  - H2: Input di discovery (come i client apprendono dove si trova il Gateway)
  - H3: 1) Discovery Bonjour / DNS-SD
  - H4: Dettagli del beacon di servizio
  - H3: 2) Tailnet (cross-network)
  - H3: 3) Target manuale / SSH
  - H2: Selezione del trasporto (policy del client)
  - H2: Pairing + auth (trasporto diretto)
  - H2: Responsabilità per componente
  - H2: Correlati

## gateway/doctor.md

- Route: /gateway/doctor
- Intestazioni:
  - H2: Avvio rapido
  - H3: Modalità headless e automazione
  - H2: Modalità lint in sola lettura
  - H2: Cosa fa (riepilogo)
  - H2: Backfill e reset dell'interfaccia Dreams
  - H2: Comportamento dettagliato e motivazione
  - H2: Correlati

## gateway/external-apps.md

- Route: /gateway/external-apps
- Intestazioni:
  - H2: Cosa è disponibile oggi
  - H2: Percorso consigliato
  - H2: Codice app vs codice plugin
  - H2: Correlati

## gateway/gateway-lock.md

- Route: /gateway/gateway-lock
- Intestazioni:
  - H2: Perché
  - H2: Meccanismo
  - H2: Superficie di errore
  - H2: Note operative
  - H2: Correlati

## gateway/health.md

- Route: /gateway/health
- Intestazioni:
  - H2: Controlli rapidi
  - H2: Diagnostica approfondita
  - H2: Configurazione del monitoraggio dello stato
  - H2: Monitoraggio dell'uptime
  - H3: Esempi di configurazione del servizio di monitoraggio
  - H2: Quando qualcosa non riesce
  - H2: Comando dedicato "health"
  - H2: Correlati

## gateway/heartbeat.md

- Route: /gateway/heartbeat
- Intestazioni:
  - H2: Avvio rapido (principianti)
  - H2: Valori predefiniti
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
  - H3: Esempi per canale vs per account
  - H3: Pattern comuni
  - H2: HEARTBEAT.md (facoltativo)
  - H3: blocchi tasks:
  - H3: L'agente può aggiornare HEARTBEAT.md?
  - H2: Risveglio manuale (on-demand)
  - H2: Consegna del ragionamento (facoltativa)
  - H2: Consapevolezza dei costi
  - H2: Overflow del contesto dopo Heartbeat
  - H2: Correlati

## gateway/index.md

- Route: /gateway
- Intestazioni:
  - H2: Avvio locale in 5 minuti
  - H2: Modello di runtime
  - H2: Endpoint compatibili con OpenAI
  - H3: Precedenza di porta e bind
  - H3: Modalità di ricaricamento a caldo
  - H2: Set di comandi dell'operatore
  - H2: Più Gateway (stesso host)
  - H2: Accesso remoto
  - H2: Supervisione e ciclo di vita del servizio
  - H2: Percorso rapido del profilo dev
  - H2: Riferimento rapido del protocollo (vista operatore)
  - H2: Controlli operativi
  - H3: Liveness
  - H3: Readiness
  - H3: Ripristino delle lacune
  - H2: Firme di errore comuni
  - H2: Garanzie di sicurezza
  - H2: Correlati

## gateway/local-model-services.md

- Route: /gateway/local-model-services
- Intestazioni:
  - H2: Come funziona
  - H2: Forma della configurazione
  - H2: Campi
  - H2: Esempio Inferrs
  - H2: Esempio ds4
  - H2: Note operative
  - H2: Correlati

## gateway/local-models.md

- Route: /gateway/local-models
- Intestazioni:
  - H2: Requisiti hardware minimi
  - H2: Scegliere un backend
  - H2: Consigliato: LM Studio + modello locale grande (Responses API)
  - H3: Configurazione ibrida: primario in hosting, fallback locale
  - H3: Locale-first con rete di sicurezza in hosting
  - H3: Hosting regionale / routing dei dati
  - H2: Altri proxy locali compatibili con OpenAI
  - H2: Backend più piccoli o più rigorosi
  - H2: Risoluzione dei problemi
  - H2: Correlati

## gateway/logging.md

- Route: /gateway/logging
- Intestazioni:
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
- Intestazioni:
  - H2: Configurazione consigliata migliore
  - H2: Avvio rapido Rescue-Bot
  - H2: Perché funziona
  - H2: Cosa cambia con --profile rescue onboard
  - H2: Configurazione generale multi-Gateway
  - H2: Checklist di isolamento
  - H2: Mappatura delle porte (derivata)
  - H2: Note Browser/CDP (errore comune)
  - H2: Esempio env manuale
  - H2: Controlli rapidi
  - H2: Correlati

## gateway/network-model.md

- Route: /gateway/network-model
- Intestazioni:
  - H2: Correlati

## gateway/openai-http-api.md

- Route: /gateway/openai-http-api
- Intestazioni:
  - H2: Autenticazione
  - H2: Confine di sicurezza (importante)
  - H2: Quando usare questo endpoint
  - H2: Contratto del modello agent-first
  - H2: Abilitare l'endpoint
  - H2: Disabilitare l'endpoint
  - H2: Comportamento della sessione
  - H2: Perché questa superficie è importante
  - H2: Elenco dei modelli e routing degli agenti
  - H2: Streaming (SSE)
  - H2: Contratto degli strumenti di chat
  - H3: Campi di richiesta supportati
  - H3: Varianti non supportate
  - H3: Forma della risposta dello strumento non in streaming
  - H3: Forma della risposta dello strumento in streaming
  - H3: Loop di follow-up dello strumento
  - H2: Configurazione rapida di Open WebUI
  - H2: Esempi
  - H2: Correlati

## gateway/openresponses-http-api.md

- Route: /gateway/openresponses-http-api
- Intestazioni:
  - H2: Autenticazione, sicurezza e routing
  - H2: Comportamento della sessione
  - H2: Forma della richiesta (supportata)
  - H2: Elementi (input)
  - H3: message
  - H3: functioncalloutput (strumenti basati sui turni)
  - H3: reasoning e itemreference
  - H2: Strumenti (strumenti funzione lato client)
  - H2: Immagini (inputimage)
  - H2: File (inputfile)
  - H2: Limiti file + immagine (config)
  - H2: Streaming (SSE)
  - H2: Utilizzo
  - H2: Errori
  - H2: Esempi
  - H2: Correlati

## gateway/openshell.md

- Route: /gateway/openshell
- Intestazioni:
  - H2: Prerequisiti
  - H2: Avvio rapido
  - H2: Modalità workspace
  - H3: mirror
  - H3: remote
  - H3: Scegliere una modalità
  - H2: Riferimento di configurazione
  - H2: Esempi
  - H3: Configurazione remota minima
  - H3: Modalità mirror con GPU
  - H3: OpenShell per agente con Gateway personalizzato
  - H2: Gestione del ciclo di vita
  - H3: Quando ricreare
  - H2: Rafforzamento della sicurezza
  - H2: Limitazioni attuali
  - H2: Come funziona
  - H2: Correlati

## gateway/opentelemetry.md

- Route: /gateway/opentelemetry
- Intestazioni:
  - H2: Come si integra tutto
  - H2: Avvio rapido
  - H2: Segnali esportati
  - H2: Riferimento di configurazione
  - H3: Variabili d'ambiente
  - H2: Privacy e acquisizione dei contenuti
  - H2: Campionamento e flush
  - H2: Metriche esportate
  - H3: Utilizzo del modello
  - H3: Flusso dei messaggi
  - H3: Conversazione
  - H3: Code e sessioni
  - H3: Telemetria della liveness della sessione
  - H3: Ciclo di vita dell'harness
  - H3: Esecuzione degli strumenti
  - H3: Exec
  - H3: Interni della diagnostica (memoria e loop degli strumenti)
  - H2: Span esportati
  - H2: Catalogo degli eventi diagnostici
  - H2: Senza un exporter
  - H2: Disabilitare
  - H2: Correlati

## gateway/operator-scopes.md

- Route: /gateway/operator-scopes
- Intestazioni:
  - H2: Ruoli
  - H2: Livelli di ambito
  - H2: L'ambito del metodo è solo il primo gate
  - H2: Approvazioni di pairing dei dispositivi
  - H2: Approvazioni di pairing dei nodi
  - H2: Auth con segreto condiviso

## gateway/pairing.md

- Route: /gateway/pairing
- Intestazioni:
  - H2: Concetti
  - H2: Come funziona il pairing
  - H2: Flusso di lavoro CLI (adatto a headless)
  - H2: Superficie API (protocollo Gateway)
  - H2: Gate dei comandi Node (2026.3.31+)
  - H2: Confini di attendibilità degli eventi Node (2026.3.31+)
  - H2: Approvazione automatica (app macOS)
  - H2: Approvazione automatica dei dispositivi Trusted-CIDR
  - H2: Approvazione automatica dell'upgrade dei metadati
  - H2: Helper di pairing QR
  - H2: Località e header inoltrati
  - H2: Archiviazione (locale, privata)
  - H2: Comportamento del trasporto
  - H2: Correlati

## gateway/prometheus.md

- Route: /gateway/prometheus
- Intestazioni:
  - H2: Avvio rapido
  - H2: Metriche esportate
  - H2: Policy delle label
  - H2: Ricette PromQL
  - H2: Scegliere tra esportazione Prometheus e OpenTelemetry
  - H2: Risoluzione dei problemi
  - H2: Correlati

## gateway/protocol.md

- Route: /gateway/protocol
- Intestazioni:
  - H2: Trasporto
  - H2: Handshake (connessione)
  - H3: Esempio Node
  - H2: Framing
  - H2: Ruoli + ambiti
  - H3: Ruoli
  - H3: Ambiti (operatore)
  - H3: Capacità/comandi/permessi (nodo)
  - H2: Presenza
  - H3: Evento di attività in background del nodo
  - H2: Ambito degli eventi broadcast
  - H2: Famiglie comuni di metodi RPC
  - H3: Famiglie comuni di eventi
  - H3: Metodi helper del nodo
  - H3: RPC del registro attività
  - H3: Metodi helper dell'operatore
  - H3: viste models.list
  - H2: Approvazioni Exec
  - H2: Fallback di consegna dell'agente
  - H2: Versionamento
  - H3: Costanti client
  - H2: Auth
  - H2: Identità del dispositivo + pairing
  - H3: Diagnostica della migrazione auth del dispositivo
  - H2: TLS + pinning
  - H2: Ambito
  - H2: Correlati

## gateway/remote-gateway-readme.md

- Route: /gateway/remote-gateway-readme
- Intestazioni:
  - H1: Eseguire OpenClaw.app con un Gateway remoto
  - H2: Panoramica
  - H2: Configurazione rapida
  - H3: Passaggio 1: Aggiungere la configurazione SSH
  - H3: Passaggio 2: Copiare la chiave SSH
  - H3: Passaggio 3: Configurare l'auth del Gateway remoto
  - H3: Passaggio 4: Avviare il tunnel SSH
  - H3: Passaggio 5: Riavviare OpenClaw.app
  - H2: Avvio automatico del tunnel al login
  - H3: Creare il file PLIST
  - H3: Caricare il Launch Agent
  - H2: Risoluzione dei problemi
  - H2: Come funziona
  - H2: Correlati

## gateway/remote.md

- Percorso: /gateway/remote
- Intestazioni:
  - H2: L'idea centrale
  - H2: Configurazioni VPN e tailnet comuni
  - H3: Gateway sempre attivo nella tua tailnet
  - H3: Desktop di casa che esegue il Gateway
  - H3: Laptop che esegue il Gateway
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
  - H4: Passaggio 3: configurare il token del gateway
  - H4: Passaggio 4: creare il LaunchAgent
  - H4: Passaggio 5: caricare il LaunchAgent
  - H4: Risoluzione dei problemi
  - H2: Correlati

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Percorso: /gateway/sandbox-vs-tool-policy-vs-elevated
- Intestazioni:
  - H2: Debug rapido
  - H2: Sandbox: dove vengono eseguiti gli strumenti
  - H3: Bind mount (controllo rapido di sicurezza)
  - H2: Criterio degli strumenti: quali strumenti esistono/sono richiamabili
  - H3: Gruppi di strumenti (scorciatoie)
  - H2: Privilegi elevati: "esegui sull'host" solo per exec
  - H2: Correzioni comuni per la "sandbox jail"
  - H3: "Strumento X bloccato dal criterio degli strumenti della sandbox"
  - H3: "Pensavo fosse main, perché è in sandbox?"
  - H2: Correlati

## gateway/sandboxing.md

- Percorso: /gateway/sandboxing
- Intestazioni:
  - H2: Cosa viene messo in sandbox
  - H2: Modalità
  - H2: Ambito
  - H2: Backend
  - H3: Scegliere un backend
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
- Intestazioni:
  - H2: Forma del file del piano
  - H2: Upsert ed eliminazioni dei provider
  - H2: Ambito di destinazione supportato
  - H2: Comportamento del tipo di destinazione
  - H2: Regole di convalida dei percorsi
  - H2: Comportamento in caso di errore
  - H2: Comportamento del consenso del provider exec
  - H2: Note sull'ambito di runtime e audit
  - H2: Controlli dell'operatore
  - H2: Documenti correlati

## gateway/secrets.md

- Percorso: /gateway/secrets
- Intestazioni:
  - H2: Obiettivi e modello runtime
  - H2: Confine di accesso dell'agente
  - H2: Filtro della superficie attiva
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
  - H2: Segnali degradati e recuperati
  - H2: Risoluzione del percorso dei comandi
  - H2: Workflow di audit e configurazione
  - H2: Criterio di sicurezza unidirezionale
  - H2: Note di compatibilità dell'autenticazione legacy
  - H2: Nota sulla UI web
  - H2: Correlati

## gateway/security/audit-checks.md

- Percorso: /gateway/security/audit-checks
- Intestazioni:
  - H2: Correlati

## gateway/security/exposure-runbook.md

- Percorso: /gateway/security/exposure-runbook
- Intestazioni:
  - H2: Scegliere il pattern di esposizione
  - H2: Inventario pre-flight
  - H2: Controlli di base
  - H2: Baseline sicura minima
  - H2: Esposizione di DM e gruppi
  - H2: Controlli del reverse proxy
  - H2: Revisione di strumenti e sandbox
  - H2: Convalida post-modifica
  - H2: Piano di rollback
  - H2: Checklist di revisione

## gateway/security/index.md

- Percorso: /gateway/security
- Intestazioni:
  - H2: Prima l'ambito: modello di sicurezza dell'assistente personale
  - H2: Controllo rapido: openclaw security audit
  - H3: Blocco delle dipendenze del pacchetto pubblicato
  - H3: Deployment e fiducia nell'host
  - H3: Operazioni sicure sui file
  - H3: Workspace Slack condiviso: rischio reale
  - H3: Agente condiviso aziendale: pattern accettabile
  - H2: Concetto di fiducia di Gateway e Node
  - H2: Matrice dei confini di fiducia
  - H2: Non vulnerabilità per progettazione
  - H2: Baseline rafforzata in 60 secondi
  - H2: Regola rapida per inbox condivisa
  - H2: Modello di visibilità del contesto
  - H2: Cosa controlla l'audit (alto livello)
  - H2: Mappa di archiviazione delle credenziali
  - H2: Checklist di audit di sicurezza
  - H2: Glossario dell'audit di sicurezza
  - H2: Control UI su HTTP
  - H2: Riepilogo dei flag insicuri o pericolosi
  - H2: Configurazione del reverse proxy
  - H2: Note su HSTS e origine
  - H2: I log delle sessioni locali risiedono su disco
  - H2: Esecuzione Node (system.run)
  - H2: Skills dinamiche (watcher / nodi remoti)
  - H2: Il modello delle minacce
  - H2: Concetto centrale: controllo degli accessi prima dell'intelligenza
  - H2: Modello di autorizzazione dei comandi
  - H2: Rischio degli strumenti del piano di controllo
  - H2: Plugins
  - H2: Modello di accesso DM: abbinamento, allowlist, aperto, disabilitato
  - H2: Isolamento delle sessioni DM (modalità multiutente)
  - H3: Modalità DM sicura (consigliata)
  - H2: Allowlist per DM e gruppi
  - H2: Prompt injection (cos'è, perché è importante)
  - H2: Sanificazione dei token speciali nei contenuti esterni
  - H2: Flag di bypass per contenuti esterni non sicuri
  - H3: La prompt injection non richiede DM pubblici
  - H3: Backend LLM self-hosted
  - H3: Potenza del modello (nota di sicurezza)
  - H2: Ragionamento e output verboso nei gruppi
  - H2: Esempi di rafforzamento della configurazione
  - H3: Permessi dei file
  - H3: Esposizione di rete (bind, porta, firewall)
  - H3: Pubblicazione delle porte Docker con UFW
  - H3: Discovery mDNS/Bonjour
  - H3: Bloccare il WebSocket del Gateway (autenticazione locale)
  - H3: Header di identità di Tailscale Serve
  - H3: Controllo del browser tramite host Node (consigliato)
  - H3: Segreti su disco
  - H3: File .env del workspace
  - H3: Log e trascrizioni (redazione e conservazione)
  - H3: DM: abbinamento per impostazione predefinita
  - H3: Gruppi: richiedere una menzione ovunque
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
  - H3: Ruotare (presumi compromissione se i segreti sono trapelati)
  - H3: Audit
  - H3: Raccogliere per un report
  - H2: Scansione dei segreti
  - H2: Segnalazione di problemi di sicurezza

## gateway/security/secure-file-operations.md

- Percorso: /gateway/security/secure-file-operations
- Intestazioni:
  - H2: Predefinito: nessun helper Python
  - H2: Cosa resta protetto senza Python
  - H2: Cosa aggiunge Python
  - H2: Indicazioni per Plugin e core

## gateway/security/shrinkwrap.md

- Percorso: /gateway/security/shrinkwrap
- Intestazioni:
  - H2: La versione semplice
  - H2: Perché OpenClaw lo usa
  - H2: Dettagli tecnici

## gateway/tailscale.md

- Percorso: /gateway/tailscale
- Intestazioni:
  - H2: Modalità
  - H2: Autenticazione
  - H2: Esempi di configurazione
  - H3: Solo tailnet (Serve)
  - H3: Solo tailnet (bind all'IP Tailnet)
  - H3: Internet pubblico (Funnel + password condivisa)
  - H2: Esempi CLI
  - H2: Note
  - H2: Controllo del browser (Gateway remoto + browser locale)
  - H2: Prerequisiti + limiti di Tailscale
  - H2: Scopri di più
  - H2: Correlati

## gateway/tools-invoke-http-api.md

- Percorso: /gateway/tools-invoke-http-api
- Intestazioni:
  - H2: Autenticazione
  - H2: Confine di sicurezza (importante)
  - H2: Corpo della richiesta
  - H2: Comportamento di criterio + routing
  - H2: Risposte
  - H2: Esempio
  - H2: Correlati

## gateway/troubleshooting.md

- Percorso: /gateway/troubleshooting
- Intestazioni:
  - H2: Scala dei comandi
  - H2: Dopo un aggiornamento
  - H2: Installazioni split-brain e guardia per configurazione più recente
  - H2: Mancata corrispondenza del protocollo dopo il rollback
  - H2: Symlink Skill saltato come escape del percorso
  - H2: Anthropic 429 richiede utilizzo extra per contesto lungo
  - H2: Risposte upstream 403 bloccate
  - H2: Il backend locale compatibile con OpenAI supera i probe diretti ma le esecuzioni agente falliscono
  - H2: Nessuna risposta
  - H2: Connettività della dashboard Control UI
  - H3: Mappa rapida dei codici di dettaglio auth
  - H2: Servizio Gateway non in esecuzione
  - H2: Il gateway macOS smette silenziosamente di rispondere, poi riprende quando tocchi la dashboard
  - H2: Il Gateway esce durante un uso elevato della memoria
  - H2: Il Gateway ha rifiutato una configurazione non valida
  - H2: Avvisi dei probe del Gateway
  - H2: Canale connesso, messaggi non in transito
  - H2: Consegna Cron e Heartbeat
  - H2: Node abbinato, strumento non riuscito
  - H2: Strumento browser non riuscito
  - H2: Se hai aggiornato e qualcosa si è rotto improvvisamente
  - H2: Correlati

## gateway/trusted-proxy-auth.md

- Percorso: /gateway/trusted-proxy-auth
- Intestazioni:
  - H2: Quando usarlo
  - H2: Quando NON usarlo
  - H2: Come funziona
  - H2: Comportamento di abbinamento della Control UI
  - H2: Configurazione
  - H3: Riferimento di configurazione
  - H2: Terminazione TLS e HSTS
  - H3: Indicazioni per il rollout
  - H2: Esempi di configurazione del proxy
  - H2: Configurazione token mista
  - H2: Header degli ambiti operatore
  - H2: Checklist di sicurezza
  - H2: Audit di sicurezza
  - H2: Risoluzione dei problemi
  - H2: Migrazione dall'autenticazione tramite token
  - H2: Correlati

## help/debugging.md

- Percorso: /help/debugging
- Intestazioni:
  - H2: Override di debug runtime
  - H2: Output di trace della sessione
  - H2: Trace del ciclo di vita del Plugin
  - H2: Profilazione dell'avvio CLI e dei comandi
  - H2: Modalità watch del Gateway
  - H2: Profilo dev + gateway dev (--dev)
  - H2: Logging dello stream grezzo (OpenClaw)
  - H2: Logging dei chunk grezzi compatibili con OpenAI
  - H2: Note di sicurezza
  - H2: Debug in VSCode
  - H3: Configurazione
  - H3: Note
  - H2: Correlati

## help/environment.md

- Percorso: /help/environment
- Intestazioni:
  - H2: Precedenza (dalla più alta alla più bassa)
  - H2: Credenziali provider e .env del workspace
  - H2: Blocco env della configurazione
  - H2: Importazione dell'ambiente shell
  - H2: Snapshot della shell exec
  - H2: Variabili d'ambiente iniettate a runtime
  - H2: Variabili d'ambiente della UI
  - H2: Sostituzione delle variabili d'ambiente nella configurazione
  - H2: Secret refs vs stringhe ${ENV}
  - H2: Variabili d'ambiente relative ai percorsi
  - H2: Logging
  - H3: OPENCLAWHOME
  - H2: Utenti nvm: errori TLS di webfetch
  - H2: Variabili d'ambiente legacy
  - H2: Correlati

## help/faq-first-run.md

- Percorso: /help/faq-first-run
- Intestazioni:
  - H2: Avvio rapido e configurazione al primo avvio
  - H2: Correlati

## help/faq-models.md

- Percorso: /help/faq-models
- Intestazioni:
  - H2: Modelli: predefiniti, selezione, alias, cambio
  - H2: Failover dei modelli e "Tutti i modelli non sono riusciti"
  - H2: Profili auth: cosa sono e come gestirli
  - H2: Correlati

## help/faq.md

- Percorso: /help/faq
- Intestazioni:
  - H2: Primi 60 secondi se qualcosa non funziona
  - H2: Avvio rapido e configurazione al primo avvio
  - H2: Che cos'è OpenClaw?
  - H2: Skills e automazione
  - H2: Sandboxing e memoria
  - H2: Dove si trovano le cose su disco
  - H2: Basi della configurazione
  - H2: Gateway e nodi remoti
  - H2: Variabili d'ambiente e caricamento .env
  - H2: Sessioni e chat multiple
  - H2: Modelli, failover e profili auth
  - H2: Gateway: porte, "già in esecuzione" e modalità remota
  - H2: Logging e debug
  - H2: Media e allegati
  - H2: Sicurezza e controllo degli accessi
  - H2: Comandi chat, interruzione delle attività e "non si ferma"
  - H2: Varie
  - H2: Correlati

## help/index.md

- Percorso: /help
- Intestazioni:
  - H2: FAQ
  - H2: Diagnostica
  - H2: Testing
  - H2: Community e meta

## help/scripts.md

- Percorso: /help/scripts
- Intestazioni:
  - H2: Convenzioni
  - H2: Script di monitoraggio auth
  - H2: Helper di lettura GitHub
  - H2: Quando si aggiungono script
  - H2: Correlati

## help/testing-live.md

- Percorso: /help/testing-live
- Intestazioni:
  - H2: Live: comandi smoke locali
  - H2: Live: sweep delle capacità del nodo Android
  - H2: Live: smoke dei modelli (chiavi profilo)
  - H3: Livello 1: completion diretta del modello (senza Gateway)
  - H3: Livello 2: Gateway + smoke dell'agente di sviluppo (ciò che "@openclaw" fa realmente)
  - H2: Live: smoke del backend CLI (Claude, Gemini o altre CLI locali)
  - H2: Live: raggiungibilità del proxy APNs HTTP/2
  - H2: Live: smoke del bind ACP (/acp spawn ... --bind here)
  - H2: Live: smoke dell'harness app-server Codex
  - H3: Ricette live consigliate
  - H2: Live: matrice dei modelli (cosa copriamo)
  - H3: Set smoke moderno (chiamata di strumenti + immagine)
  - H3: Baseline: chiamata di strumenti (Read + Exec opzionale)
  - H3: Visione: invio immagine (allegato → messaggio multimodale)
  - H3: Aggregatori / gateway alternativi
  - H2: Credenziali (mai committare)
  - H2: Deepgram live (trascrizione audio)
  - H2: Piano di coding BytePlus live
  - H2: Media live del workflow ComfyUI
  - H2: Generazione immagini live
  - H2: Generazione musica live
  - H2: Generazione video live
  - H2: Harness media live
  - H2: Correlati

## help/testing-updates-plugins.md

- Percorso: /help/testing-updates-plugins
- Intestazioni:
  - H2: Cosa proteggiamo
  - H2: Prova locale durante lo sviluppo
  - H2: Lane Docker
  - H2: Accettazione del pacchetto
  - H2: Default di rilascio
  - H2: Compatibilità legacy
  - H2: Aggiunta di copertura
  - H2: Triage dei fallimenti

## help/testing.md

- Percorso: /help/testing
- Intestazioni:
  - H2: Avvio rapido
  - H2: Directory temporanee dei test
  - H2: Runner specifici per QA
  - H3: Credenziali Telegram condivise tramite Convex (v1)
  - H3: Aggiungere un canale a QA
  - H2: Suite di test (cosa viene eseguito dove)
  - H3: Unità / integrazione (default)
  - H3: Stabilità (Gateway)
  - H3: E2E (aggregato del repo)
  - H3: E2E (smoke del Gateway)
  - H3: E2E (browser mockato della Control UI)
  - H3: E2E: smoke del backend OpenShell
  - H3: Live (provider reali + modelli reali)
  - H2: Quale suite devo eseguire?
  - H2: Test Live (che toccano la rete)
  - H2: Runner Docker (controlli opzionali "funziona su Linux")
  - H2: Sanity della documentazione
  - H2: Regressione offline (sicura per CI)
  - H2: Eval di affidabilità agenti (Skills)
  - H2: Test di contratto (forma di Plugin e canale)
  - H3: Comandi
  - H3: Contratti dei canali
  - H3: Contratti di stato dei provider
  - H3: Contratti dei provider
  - H3: Quando eseguire
  - H2: Aggiunta di regressioni (guida)
  - H2: Correlati

## help/troubleshooting.md

- Percorso: /help/troubleshooting
- Intestazioni:
  - H2: Primi 60 secondi
  - H2: L'assistente sembra limitato o privo di strumenti
  - H2: Contesto lungo Anthropic 429
  - H2: Il backend locale compatibile con OpenAI funziona direttamente ma fallisce in OpenClaw
  - H2: L'installazione del Plugin fallisce per estensioni openclaw mancanti
  - H2: La policy di installazione blocca installazioni o aggiornamenti dei Plugin
  - H2: Plugin presente ma bloccato da proprietà sospetta
  - H2: Albero decisionale
  - H2: Correlati

## index.md

- Percorso: /
- Intestazioni:
  - H1: OpenClaw 🦞
  - H2: Cos'è OpenClaw?
  - H2: Come funziona
  - H2: Funzionalità chiave
  - H2: Avvio rapido
  - H2: Dashboard
  - H2: Configurazione (opzionale)
  - H2: Inizia da qui
  - H2: Scopri di più

## install/ansible.md

- Percorso: /install/ansible
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

- Percorso: /install/azure
- Intestazioni:
  - H2: Cosa farai
  - H2: Cosa ti serve
  - H2: Configurare la distribuzione
  - H2: Distribuire risorse Azure
  - H2: Installare OpenClaw
  - H2: Considerazioni sui costi
  - H2: Pulizia
  - H2: Passaggi successivi
  - H2: Correlati

## install/bun.md

- Percorso: /install/bun
- Intestazioni:
  - H2: Installazione
  - H2: Script del ciclo di vita
  - H2: Avvertenze
  - H2: Correlati

## install/clawdock.md

- Percorso: /install/clawdock
- Intestazioni:
  - H2: Installazione
  - H2: Cosa ottieni
  - H3: Operazioni di base
  - H3: Accesso al container
  - H3: UI web e associazione
  - H3: Configurazione e manutenzione
  - H3: Utilità
  - H2: Flusso al primo avvio
  - H2: Configurazione e segreti
  - H2: Correlati

## install/development-channels.md

- Percorso: /install/development-channels
- Intestazioni:
  - H2: Cambio di canale
  - H2: Puntamento a versione o tag una tantum
  - H2: Dry run
  - H2: Plugin e canali
  - H2: Verifica dello stato corrente
  - H2: Best practice di tagging
  - H2: Disponibilità dell'app macOS
  - H2: Correlati

## install/digitalocean.md

- Percorso: /install/digitalocean
- Intestazioni:
  - H2: Prerequisiti
  - H2: Configurazione
  - H2: Persistenza e backup
  - H2: Suggerimenti per 1 GB di RAM
  - H2: Risoluzione dei problemi
  - H2: Passaggi successivi
  - H2: Correlati

## install/docker-vm-runtime.md

- Percorso: /install/docker-vm-runtime
- Intestazioni:
  - H2: Incorporare i binari richiesti nell'immagine
  - H2: Compilazione e avvio
  - H2: Cosa persiste e dove
  - H2: Aggiornamenti
  - H2: Correlati

## install/docker.md

- Percorso: /install/docker
- Intestazioni:
  - H2: Docker fa per me?
  - H2: Prerequisiti
  - H2: Gateway containerizzato
  - H3: Flusso manuale
  - H3: Variabili d'ambiente
  - H3: Osservabilità
  - H3: Controlli di integrità
  - H3: LAN vs loopback
  - H3: Provider locali dell'host
  - H3: Backend Claude CLI in Docker
  - H3: Bonjour / mDNS
  - H3: Archiviazione e persistenza
  - H3: Helper shell (opzionale)
  - H3: Esecuzione su VPS?
  - H2: Sandbox agente
  - H3: Abilitazione rapida
  - H2: Risoluzione dei problemi
  - H2: Correlati

## install/exe-dev.md

- Percorso: /install/exe-dev
- Intestazioni:
  - H2: Percorso rapido per principianti
  - H2: Cosa ti serve
  - H2: Installazione automatizzata con Shelley
  - H2: Installazione manuale
  - H2: 1) Creare la VM
  - H2: 2) Installare i prerequisiti (sulla VM)
  - H2: 3) Installare OpenClaw
  - H2: 4) Configurare nginx per inoltrare OpenClaw alla porta 8000
  - H2: 5) Accedere a OpenClaw e concedere privilegi
  - H2: Configurazione del canale remoto
  - H2: Accesso remoto
  - H2: Aggiornamento
  - H2: Correlati

## install/fly.md

- Percorso: /install/fly
- Intestazioni:
  - H2: Cosa ti serve
  - H2: Percorso rapido per principianti
  - H2: Risoluzione dei problemi
  - H3: "L'app non è in ascolto sull'indirizzo previsto"
  - H3: Controlli di integrità non riusciti / connessione rifiutata
  - H3: OOM / problemi di memoria
  - H3: Problemi di lock del Gateway
  - H3: Configurazione non letta
  - H3: Scrittura della configurazione tramite SSH
  - H3: Stato non persistente
  - H2: Aggiornamenti
  - H3: Comando di aggiornamento della macchina
  - H2: Distribuzione privata (rafforzata)
  - H3: Quando usare una distribuzione privata
  - H3: Configurazione
  - H3: Accesso a una distribuzione privata
  - H3: Webhook con distribuzione privata
  - H3: Vantaggi di sicurezza
  - H2: Note
  - H2: Costo
  - H2: Passaggi successivi
  - H2: Correlati

## install/gcp.md

- Percorso: /install/gcp
- Intestazioni:
  - H2: Cosa stiamo facendo (in parole semplici)?
  - H2: Percorso rapido (operatori esperti)
  - H2: Cosa ti serve
  - H2: Risoluzione dei problemi
  - H2: Account di servizio (best practice di sicurezza)
  - H2: Passaggi successivi
  - H2: Correlati

## install/hetzner.md

- Percorso: /install/hetzner
- Intestazioni:
  - H2: Obiettivo
  - H2: Cosa stiamo facendo (in parole semplici)?
  - H2: Percorso rapido (operatori esperti)
  - H2: Cosa ti serve
  - H2: Infrastructure as Code (Terraform)
  - H2: Passaggi successivi
  - H2: Correlati

## install/hostinger.md

- Percorso: /install/hostinger
- Intestazioni:
  - H2: Prerequisiti
  - H2: Opzione A: OpenClaw con 1 clic
  - H2: Opzione B: OpenClaw su VPS
  - H2: Verifica la configurazione
  - H2: Risoluzione dei problemi
  - H2: Passaggi successivi
  - H2: Correlati

## install/index.md

- Percorso: /install
- Intestazioni:
  - H2: Requisiti di sistema
  - H2: Consigliato: script di installazione
  - H2: Metodi di installazione alternativi
  - H3: Installer con prefisso locale (install-cli.sh)
  - H3: npm, pnpm o bun
  - H3: Da sorgente
  - H3: Installazione dal checkout main di GitHub
  - H3: Container e package manager
  - H2: Verificare l'installazione
  - H2: Hosting e distribuzione
  - H2: Aggiornare, migrare o disinstallare
  - H2: Risoluzione dei problemi: openclaw non trovato

## install/installer.md

- Percorso: /install/installer
- Intestazioni:
  - H2: Comandi rapidi
  - H2: install.sh
  - H3: Flusso (install.sh)
  - H3: Rilevamento checkout sorgente
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

- Percorso: /install/kubernetes
- Intestazioni:
  - H2: Perché non Helm?
  - H2: Cosa ti serve
  - H2: Avvio rapido
  - H2: Test locale con Kind
  - H2: Passo per passo
  - H3: 1) Distribuire
  - H3: 2) Accedere al Gateway
  - H2: Cosa viene distribuito
  - H2: Personalizzazione
  - H3: Istruzioni dell'agente
  - H3: Configurazione del Gateway
  - H3: Aggiungere provider
  - H3: Namespace personalizzato
  - H3: Immagine personalizzata
  - H3: Esporre oltre il port-forward
  - H2: Ridistribuzione
  - H2: Smontaggio
  - H2: Note sull'architettura
  - H2: Struttura dei file
  - H2: Correlati

## install/macos-vm.md

- Percorso: /install/macos-vm
- Intestazioni:
  - H2: Default consigliato (la maggior parte degli utenti)
  - H2: Opzioni VM macOS
  - H3: VM locale sul tuo Mac Apple Silicon (Lume)
  - H3: Provider Mac ospitati (cloud)
  - H2: Percorso rapido (Lume, utenti esperti)
  - H2: Cosa ti serve (Lume)
  - H2: 1) Installare Lume
  - H2: 2) Creare la VM macOS
  - H2: 3) Completare Setup Assistant
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

- Percorso: /install/migrating-claude
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

- Percorso: /install/migrating-hermes
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

- Percorso: /install/migrating
- Intestazioni:
  - H2: Importare da un altro sistema di agenti
  - H2: Spostare OpenClaw su una nuova macchina
  - H3: Passaggi di migrazione
  - H3: Problemi comuni
  - H3: Checklist di verifica
  - H2: Aggiornare un Plugin sul posto
  - H2: Correlati

## install/nix.md

- Percorso: /install/nix
- Intestazioni:
  - H2: Cosa ottieni
  - H2: Avvio rapido
  - H2: Comportamento runtime in modalità Nix
  - H3: Cosa cambia in modalità Nix
  - H3: Percorsi di configurazione e stato
  - H3: Rilevamento del PATH del servizio
  - H2: Correlati

## install/node.md

- Percorso: /install/node
- Intestazioni:
  - H2: Controlla la tua versione
  - H2: Installare Node
  - H2: Risoluzione dei problemi
  - H3: openclaw: command not found
  - H3: Errori di permessi su npm install -g (Linux)
  - H2: Correlati

## install/northflank.mdx

- Percorso: /install/northflank
- Intestazioni:
  - H1: Northflank
  - H2: Come iniziare
  - H2: Cosa ottieni
  - H2: Collegare un canale
  - H2: Passaggi successivi

## install/oracle.md

- Percorso: /install/oracle
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

- Percorso: /install/podman
- Intestazioni:
  - H2: Prerequisiti
  - H2: Avvio rapido
  - H2: Podman e Tailscale
  - H2: Systemd (Quadlet, opzionale)
  - H2: Configurazione, env e storage
  - H2: Comandi utili
  - H2: Risoluzione dei problemi
  - H2: Correlati

## install/railway.mdx

- Percorso: /install/railway
- Intestazioni:
  - H1: Railway
  - H2: Checklist rapida (nuovi utenti)
  - H2: Distribuzione one-click
  - H2: Cosa ottieni
  - H2: Impostazioni Railway richieste
  - H3: Networking pubblico
  - H3: Volume (richiesto)
  - H3: Variabili
  - H2: Collegare un canale
  - H2: Backup e migrazione
  - H2: Passaggi successivi

## install/raspberry-pi.md

- Percorso: /install/raspberry-pi
- Intestazioni:
  - H2: Compatibilità hardware
  - H2: Prerequisiti
  - H2: Configurazione
  - H2: Suggerimenti per le prestazioni
  - H2: Configurazione consigliata del modello
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
  - H2: Capire il Blueprint
  - H2: Scegliere un piano
  - H2: Dopo la distribuzione
  - H3: Accedere alla Control UI
  - H2: Funzionalità della Render Dashboard
  - H3: Log
  - H3: Accesso alla shell
  - H3: Variabili d'ambiente
  - H3: Distribuzione automatica
  - H2: Dominio personalizzato
  - H2: Scalabilità
  - H2: Backup e migrazione
  - H2: Risoluzione dei problemi
  - H3: Il servizio non si avvia
  - H3: Avvii a freddo lenti (livello gratuito)
  - H3: Perdita di dati dopo la ridistribuzione
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
  - H2: Installazione normale rispetto a checkout del sorgente
  - H3: Installazione normale (install.sh / npm / pnpm / bun)
  - H3: Checkout del sorgente (git clone)
  - H2: Correlati

## install/updating.md

- Percorso: /install/updating
- Intestazioni:
  - H2: Consigliato: openclaw update
  - H2: Passare tra installazioni npm e git
  - H2: Alternativa: eseguire di nuovo l'installer
  - H2: Alternativa: npm, pnpm o bun manuale
  - H3: Argomenti avanzati sull'installazione npm
  - H2: Aggiornamento automatico
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
  - H3: CLI: tail in tempo reale (consigliato)
  - H3: Control UI (web)
  - H3: Log solo del canale
  - H2: Formati dei log
  - H3: Log su file (JSONL)
  - H3: Output della console
  - H3: Log WebSocket del Gateway
  - H2: Configurare il logging
  - H3: Livelli di log
  - H3: Diagnostica mirata del trasporto del modello
  - H3: Correlazione delle tracce
  - H3: Dimensione e tempi delle chiamate al modello
  - H3: Stili della console
  - H3: Redazione
  - H2: Diagnostica e OpenTelemetry
  - H2: Suggerimenti per la risoluzione dei problemi
  - H2: Correlati

## maturity/scorecard.md

- Percorso: /maturity/scorecard
- Intestazioni:
  - H1: Scorecard di maturità
  - H2: A cosa serve questa pagina
  - H2: In sintesi
  - H2: Fasce di punteggio
  - H2: Esploratore delle superfici
  - H2: Riepilogo delle evidenze QA
  - H3: Prontezza per area

## maturity/taxonomy.md

- Percorso: /maturity/taxonomy
- Intestazioni:
  - H1: Tassonomia di maturità
  - H2: Come leggere questa pagina
  - H2: Livelli di maturità
  - H2: Aree del prodotto
  - H2: Dettagli
  - H3: Core
  - H3: Platform
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
  - H3: Fallback Provider + CLI (OpenAI + Whisper CLI)
  - H3: Solo Provider con gating dell'ambito
  - H3: Solo Provider (Deepgram)
  - H3: Solo Provider (Mistral Voxtral)
  - H3: Solo Provider (SenseAudio)
  - H3: Echo della trascrizione nella chat (opt-in)
  - H2: Note e limiti
  - H3: Supporto dell'ambiente proxy
  - H2: Rilevamento delle menzioni nei gruppi
  - H2: Aspetti critici
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
  - H3: Autorizzazioni
  - H3: Requisito di primo piano Android
  - H3: Comandi Android (tramite Gateway node.invoke)
  - H3: Protezione del payload
  - H2: App macOS
  - H3: Impostazione utente (disattiva per impostazione predefinita)
  - H3: Helper CLI (node invoke)
  - H2: Sicurezza + limiti pratici
  - H2: Video dello schermo macOS (a livello di sistema operativo)
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
  - H2: Host del nodo remoto (system.run)
  - H3: Cosa viene eseguito dove
  - H3: Avviare un host del nodo (primo piano)
  - H3: Gateway remoto tramite tunnel SSH (bind loopback)
  - H3: Avviare un host del nodo (servizio)
  - H3: Associare + assegnare un nome
  - H3: Inserire i comandi nell'elenco consentiti
  - H3: Puntare exec al nodo
  - H2: Invocare comandi
  - H2: Criteri dei comandi
  - H2: Configurazione (openclaw.json)
  - H2: Screenshot (snapshot del canvas)
  - H3: Controlli del canvas
  - H3: A2UI (Canvas)
  - H2: Foto + video (fotocamera del nodo)
  - H2: Registrazioni dello schermo (nodi)
  - H2: Posizione (nodi)
  - H2: SMS (nodi Android)
  - H2: Dispositivo Android + comandi per dati personali
  - H2: Comandi di sistema (host del nodo / nodo Mac)
  - H2: Binding del nodo exec
  - H2: Mappa delle autorizzazioni
  - H2: Host del nodo headless (multipiattaforma)
  - H2: Modalità nodo Mac

## nodes/location-command.md

- Percorso: /nodes/location-command
- Intestazioni:
  - H2: TL;DR
  - H2: Perché un selettore (non solo un interruttore)
  - H2: Modello delle impostazioni
  - H2: Mappatura delle autorizzazioni (node.permissions)
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
  - H3: Voci del modello
  - H3: Credenziali del Provider (apiKey)
  - H2: Valori predefiniti e limiti
  - H3: Rilevamento automatico della comprensione dei media (predefinito)
  - H3: Supporto dell'ambiente proxy (modelli Provider)
  - H2: Capacità (opzionali)
  - H2: Matrice di supporto dei Provider (integrazioni OpenClaw)
  - H2: Guida alla selezione del modello
  - H2: Criteri per gli allegati
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
  - H2: Scala dei comandi
  - H2: Requisiti di primo piano
  - H2: Matrice delle autorizzazioni
  - H2: Associazione rispetto ad approvazioni
  - H2: Codici di errore comuni dei nodi
  - H2: Ciclo di ripristino rapido
  - H2: Correlati

## nodes/voicewake.md

- Percorso: /nodes/voicewake
- Intestazioni:
  - H2: Archiviazione (host del Gateway)
  - H2: Protocollo
  - H3: Metodi
  - H3: Metodi di instradamento (trigger → target)
  - H3: Eventi
  - H2: Comportamento del client
  - H3: App macOS
  - H3: Nodo iOS
  - H3: Nodo Android
  - H2: Correlati

## openclaw-agent-runtime.md

- Percorso: /openclaw-agent-runtime
- Intestazioni:
  - H2: Controllo dei tipi e linting
  - H2: Esecuzione dei test di Agent Runtime
  - H2: Test manuale
  - H2: Reimpostazione da zero
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
  - H2: Non obiettivi
  - H2: Architettura attuale
  - H2: Lacuna attuale
  - H2: Comportamento desiderato
  - H2: Vincoli di progettazione
  - H3: Il server dell'app Codex resta canonico per lo stato nativo dei thread
  - H3: L'assemblaggio del motore di contesto deve essere proiettato negli input Codex
  - H3: La stabilità della cache dei prompt è importante
  - H3: La semantica di selezione del runtime non cambia
  - H2: Piano di implementazione
  - H3: 1. Esportare o ricollocare helper riutilizzabili per i tentativi del motore di contesto
  - H3: 2. Aggiungere un helper di proiezione del contesto Codex
  - H3: 3. Collegare il bootstrap prima dell'avvio del thread Codex
  - H3: 4. Collegare l'assemblaggio prima di thread/start / thread/resume e turn/start
  - H3: 5. Preservare la formattazione stabile della cache dei prompt
  - H3: 6. Collegare il post-turn dopo il mirroring della trascrizione
  - H3: 7. Normalizzare utilizzo e contesto runtime della cache dei prompt
  - H3: 8. Criterio di Compaction
  - H4: /compact e Compaction esplicita di OpenClaw
  - H4: Eventi contextCompaction nativi di Codex durante il turno
  - H3: 9. Reimpostazione della sessione e comportamento di binding
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
  - H2: Modello di destinazione
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
  - H2: Controllo del sistema
  - H2: Runbook di connessione
  - H3: Prerequisiti
  - H3: 1) Avviare il Gateway
  - H3: 2) Verificare il rilevamento (opzionale)
  - H4: Rilevamento Tailnet (Vienna ⇄ Londra) tramite DNS-SD unicast
  - H3: 3) Connettersi da Android
  - H3: Beacon di presenza attiva
  - H3: 4) Approvare l'associazione (CLI)
  - H3: 5) Verificare che il nodo sia connesso
  - H3: 6) Chat + cronologia
  - H3: 7) Canvas + fotocamera
  - H4: Host Gateway Canvas (consigliato per contenuti web)
  - H3: 8) Voce + superficie comandi Android estesa
  - H2: Punti di ingresso dell'assistente
  - H2: Inoltro delle notifiche
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
  - H2: Scegliere il proprio sistema operativo
  - H2: VPS e hosting
  - H2: Link comuni
  - H2: Installazione del servizio Gateway (CLI)
  - H2: Correlati

## platforms/ios.md

- Percorso: /platforms/ios
- Intestazioni:
  - H2: Cosa fa
  - H2: Requisiti
  - H2: Avvio rapido (associare + connettere)
  - H2: Push supportato da relay per build ufficiali
  - H2: Beacon di attività in background
  - H2: Flusso di autenticazione e fiducia
  - H2: Percorsi di rilevamento
  - H3: Bonjour (LAN)
  - H3: Tailnet (tra reti)
  - H3: Host/porta manuali
  - H2: Canvas + A2UI
  - H2: Relazione con Computer Use
  - H3: Eval / snapshot Canvas
  - H2: Risveglio vocale + modalità conversazione
  - H2: Errori comuni
  - H2: Documenti correlati

## platforms/linux.md

- Percorso: /platforms/linux
- Intestazioni:
  - H2: Percorso rapido per principianti (VPS)
  - H2: Installazione
  - H2: Gateway
  - H2: Installazione del servizio Gateway (CLI)
  - H2: Controllo del sistema (unità utente systemd)
  - H2: Pressione di memoria e terminazioni OOM
  - H2: Correlati

## platforms/mac/bundled-gateway.md

- Percorso: /platforms/mac/bundled-gateway
- Intestazioni:
  - H2: Installare la CLI (necessaria per la modalità locale)
  - H2: Launchd (Gateway come LaunchAgent)
  - H2: Compatibilità delle versioni
  - H2: Directory di stato su macOS
  - H2: Debug della connettività dell'app
  - H2: Controllo smoke
  - H2: Correlati

## platforms/mac/canvas.md

- Percorso: /platforms/mac/canvas
- Intestazioni:
  - H2: Dove si trova Canvas
  - H2: Comportamento del pannello
  - H2: Superficie API dell'agente
  - H2: A2UI in Canvas
  - H3: Comandi A2UI (v0.8)
  - H2: Attivare esecuzioni agente da Canvas
  - H2: Note di sicurezza
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

- Percorso: /platforms/mac/dev-setup
- Intestazioni:
  - H1: Configurazione sviluppatore macOS
  - H2: Prerequisiti
  - H2: 1. Installa le dipendenze
  - H2: 2. Compila e pacchettizza l'app
  - H2: 3. Installa la CLI
  - H2: Risoluzione dei problemi
  - H3: Compilazione non riuscita: mancata corrispondenza tra toolchain o SDK
  - H3: L'app si arresta in modo anomalo alla concessione dei permessi
  - H3: Gateway "Starting..." a tempo indefinito
  - H2: Correlati

## platforms/mac/health.md

- Percorso: /platforms/mac/health
- Intestazioni:
  - H1: Controlli di integrità su macOS
  - H2: Barra dei menu
  - H2: Impostazioni
  - H2: Come funziona il probe
  - H2: In caso di dubbio
  - H2: Correlati

## platforms/mac/icon.md

- Percorso: /platforms/mac/icon
- Intestazioni:
  - H1: Stati dell'icona della barra dei menu
  - H2: Correlati

## platforms/mac/logging.md

- Percorso: /platforms/mac/logging
- Intestazioni:
  - H1: Logging (macOS)
  - H2: Log del file diagnostico a rotazione (pannello Debug)
  - H2: Dati privati del logging unificato su macOS
  - H2: Abilita per OpenClaw (ai.openclaw)
  - H2: Disabilita dopo il debug
  - H2: Correlati

## platforms/mac/menu-bar.md

- Percorso: /platforms/mac/menu-bar
- Intestazioni:
  - H2: Cosa viene mostrato
  - H2: Modello di stato
  - H2: enum IconState (Swift)
  - H3: ActivityKind → glifo
  - H3: Mappatura visiva
  - H2: Sottomenu contestuale
  - H2: Testo della riga di stato (menu)
  - H2: Ingestione degli eventi
  - H2: Override di debug
  - H2: Checklist di test
  - H2: Correlati

## platforms/mac/peekaboo.md

- Percorso: /platforms/mac/peekaboo
- Intestazioni:
  - H2: Cos'è (e cosa non è)
  - H2: Relazione con l'uso del computer
  - H2: Abilita il bridge
  - H2: Ordine di rilevamento del client
  - H2: Sicurezza e permessi
  - H2: Comportamento degli snapshot (automazione)
  - H2: Risoluzione dei problemi
  - H2: Correlati

## platforms/mac/permissions.md

- Percorso: /platforms/mac/permissions
- Intestazioni:
  - H2: Requisiti per permessi stabili
  - H2: Concessioni di accessibilità per runtime Node e CLI
  - H2: Checklist di ripristino quando i prompt scompaiono
  - H2: Permessi per file e cartelle (Scrivania/Documenti/Download)
  - H2: Correlati

## platforms/mac/remote.md

- Percorso: /platforms/mac/remote
- Intestazioni:
  - H2: Modalità
  - H2: Trasporti remoti
  - H2: Prerequisiti sull'host remoto
  - H2: Configurazione dell'app macOS
  - H2: Chat web
  - H2: Permessi
  - H2: Note di sicurezza
  - H2: Flusso di accesso WhatsApp (remoto)
  - H2: Risoluzione dei problemi
  - H2: Suoni di notifica
  - H2: Correlati

## platforms/mac/signing.md

- Percorso: /platforms/mac/signing
- Intestazioni:
  - H1: Firma mac (build di debug)
  - H2: Utilizzo
  - H3: Nota sulla firma ad hoc
  - H2: Metadati di build per Informazioni
  - H2: Perché
  - H2: Correlati

## platforms/mac/skills.md

- Percorso: /platforms/mac/skills
- Intestazioni:
  - H2: Origine dati
  - H2: Azioni di installazione
  - H2: Chiavi env/API
  - H2: Modalità remota
  - H2: Correlati

## platforms/mac/voice-overlay.md

- Percorso: /platforms/mac/voice-overlay
- Intestazioni:
  - H1: Ciclo di vita dell'overlay vocale (macOS)
  - H2: Intento attuale
  - H2: Implementato (9 dic 2025)
  - H2: Passaggi successivi
  - H2: Checklist di debug
  - H2: Passaggi di migrazione (suggeriti)
  - H2: Correlati

## platforms/mac/voicewake.md

- Percorso: /platforms/mac/voicewake
- Intestazioni:
  - H1: Attivazione vocale e push-to-talk
  - H2: Requisiti
  - H2: Modalità
  - H2: Comportamento runtime (parola di attivazione)
  - H2: Invarianti del ciclo di vita
  - H2: Modalità di errore dell'overlay persistente (precedente)
  - H2: Specifiche del push-to-talk
  - H2: Impostazioni visibili all'utente
  - H2: Comportamento di inoltro
  - H2: Payload di inoltro
  - H2: Verifica rapida
  - H2: Correlati

## platforms/mac/webchat.md

- Percorso: /platforms/mac/webchat
- Intestazioni:
  - H2: Avvio e debug
  - H2: Come è collegato
  - H2: Superficie di sicurezza
  - H2: Limitazioni note
  - H2: Correlati

## platforms/mac/xpc.md

- Percorso: /platforms/mac/xpc
- Intestazioni:
  - H1: Architettura IPC macOS di OpenClaw
  - H2: Obiettivi
  - H2: Come funziona
  - H3: Gateway + trasporto Node
  - H3: Servizio Node + IPC dell'app
  - H3: PeekabooBridge (automazione dell'interfaccia)
  - H2: Flussi operativi
  - H2: Note di rafforzamento
  - H2: Correlati

## platforms/macos.md

- Percorso: /platforms/macos
- Intestazioni:
  - H2: Download
  - H2: Primo avvio
  - H2: Scegli una modalità Gateway
  - H2: Cosa gestisce l'app
  - H2: Pagine di dettaglio macOS
  - H2: Correlati

## platforms/oracle.md

- Percorso: /platforms/oracle
- Intestazioni:
  - H2: Correlati

## platforms/raspberry-pi.md

- Percorso: /platforms/raspberry-pi
- Intestazioni:
  - H2: Correlati

## platforms/windows.md

- Percorso: /platforms/windows
- Intestazioni:
  - H2: Consigliato: Windows Hub
  - H3: Cosa include Windows Hub
  - H3: Primo avvio
  - H2: Modalità nodo Windows
  - H2: Modalità MCP locale
  - H2: CLI e Gateway nativi per Windows
  - H2: Gateway WSL2
  - H2: Avvio automatico del Gateway prima dell'accesso a Windows
  - H2: Esponi i servizi WSL sulla LAN
  - H2: Risoluzione dei problemi
  - H3: L'icona nella barra delle applicazioni non appare
  - H3: Configurazione locale non riuscita
  - H3: L'app indica che è richiesto l'abbinamento
  - H3: La chat web non riesce a raggiungere un Gateway remoto
  - H3: I comandi screen.snapshot, camera o audio non riescono
  - H3: Connettività Git o GitHub non riuscita
  - H2: Correlati

## plugins/adding-capabilities.md

- Percorso: /plugins/adding-capabilities
- Intestazioni:
  - H2: Quando creare una capability
  - H2: La sequenza standard
  - H2: Cosa va dove
  - H2: Punti di integrazione di provider e harness
  - H2: Checklist dei file
  - H2: Esempio pratico: generazione di immagini
  - H2: Provider di embedding
  - H2: Checklist di revisione
  - H2: Correlati

## plugins/admin-http-rpc.md

- Percorso: /plugins/admin-http-rpc
- Intestazioni:
  - H2: Prima di abilitarlo
  - H2: Abilita
  - H2: Verifica la route
  - H2: Autenticazione
  - H2: Modello di sicurezza
  - H2: Richiesta
  - H2: Risposta
  - H2: Metodi consentiti
  - H2: Confronto con WebSocket
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/agent-tools.md

- Percorso: /plugins/agent-tools
- Intestazioni:
  - H2: Correlati

## plugins/architecture-internals.md

- Percorso: /plugins/architecture-internals
- Intestazioni:
  - H2: Pipeline di caricamento
  - H3: Comportamento manifest-first
  - H3: Confine della cache dei Plugin
  - H2: Modello di registro
  - H2: Callback di associazione conversazione
  - H2: Hook runtime del provider
  - H3: Ordine e utilizzo degli hook
  - H3: Esempio di provider
  - H3: Esempi integrati
  - H2: Helper runtime
  - H3: api.runtime.imageGeneration
  - H2: Route HTTP del Gateway
  - H2: Percorsi di importazione dell'SDK Plugin
  - H2: Schemi degli strumenti di messaggio
  - H2: Risoluzione della destinazione del canale
  - H2: Directory basate sulla configurazione
  - H2: Cataloghi dei provider
  - H2: Ispezione del canale in sola lettura
  - H2: Pacchetti di package
  - H3: Metadati del catalogo dei canali
  - H2: Plugin del motore di contesto
  - H2: Aggiunta di una nuova capability
  - H3: Checklist della capability
  - H3: Template della capability
  - H2: Correlati

## plugins/architecture.md

- Percorso: /plugins/architecture
- Intestazioni:
  - H2: Modello pubblico delle capability
  - H3: Posizione sulla compatibilità esterna
  - H3: Forme dei Plugin
  - H3: Hook legacy
  - H3: Segnali di compatibilità
  - H2: Panoramica dell'architettura
  - H3: Snapshot dei metadati dei Plugin e tabella di lookup
  - H3: Pianificazione dell'attivazione
  - H3: Plugin di canale e strumento di messaggio condiviso
  - H2: Modello di proprietà delle capability
  - H3: Stratificazione delle capability
  - H3: Esempio di Plugin aziendale multi-capability
  - H3: Esempio di capability: comprensione video
  - H2: Contratti e applicazione
  - H3: Cosa appartiene a un contratto
  - H2: Modello di esecuzione
  - H2: Confine di esportazione
  - H2: Interni e riferimento
  - H2: Correlati

## plugins/building-extensions.md

- Percorso: /plugins/building-extensions
- Intestazioni:
  - H2: Correlati

## plugins/building-plugins.md

- Percorso: /plugins/building-plugins
- Intestazioni:
  - H2: Requisiti
  - H2: Scegli la forma del Plugin
  - H2: Avvio rapido
  - H2: Registrazione degli strumenti
  - H2: Convenzioni di importazione
  - H2: Checklist pre-invio
  - H2: Test con le release beta
  - H2: Passaggi successivi
  - H2: Correlati

## plugins/bundles.md

- Percorso: /plugins/bundles
- Intestazioni:
  - H2: Perché esistono i bundle
  - H2: Installa un bundle
  - H2: Cosa OpenClaw mappa dai bundle
  - H3: Supportato ora
  - H4: Contenuto delle Skill
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

- Percorso: /plugins/cli-backend-plugins
- Intestazioni:
  - H2: Cosa gestisce il Plugin
  - H2: Plugin backend minimo
  - H2: Forma della configurazione
  - H2: Hook backend avanzati
  - H3: ownsNativeCompaction: rinunciare alla Compaction di OpenClaw
  - H2: Bridge degli strumenti MCP
  - H2: Configurazione utente
  - H2: Verifica
  - H2: Checklist
  - H2: Correlati

## plugins/codex-computer-use.md

- Percorso: /plugins/codex-computer-use
- Intestazioni:
  - H2: OpenClaw.app e Peekaboo
  - H2: App iOS
  - H2: MCP cua-driver diretto
  - H2: Configurazione rapida
  - H2: Comandi
  - H2: Scelte del marketplace
  - H2: Marketplace macOS incluso
  - H2: Limite del catalogo remoto
  - H2: Riferimento di configurazione
  - H2: Cosa controlla OpenClaw
  - H2: Permessi macOS
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/codex-harness-reference.md

- Percorso: /plugins/codex-harness-reference
- Intestazioni:
  - H2: Superficie di configurazione del Plugin
  - H2: Trasporto app-server
  - H2: Modalità di approvazione e sandbox
  - H2: Esecuzione nativa in sandbox
  - H2: Isolamento di autenticazione e ambiente
  - H2: Strumenti dinamici
  - H2: Timeout
  - H2: Rilevamento dei modelli
  - H2: File di bootstrap dell'area di lavoro
  - H2: Override dell'ambiente
  - H2: Correlati

## plugins/codex-harness-runtime.md

- Percorso: /plugins/codex-harness-runtime
- Intestazioni:
  - H2: Panoramica
  - H2: Associazioni dei thread e modifiche dei modelli
  - H2: Risposte visibili e Heartbeat
  - H2: Confini degli hook
  - H2: Contratto di supporto V1
  - H2: Permessi nativi ed elicitazioni MCP
  - H2: Direzionamento della coda
  - H2: Caricamento del feedback Codex
  - H2: Compaction e mirror della trascrizione
  - H2: Media e consegna
  - H2: Correlati

## plugins/codex-harness.md

- Percorso: /plugins/codex-harness
- Intestazioni:
  - H2: Requisiti
  - H2: Avvio rapido
  - H2: Configurazione
  - H2: Verifica il runtime Codex
  - H2: Routing e selezione del modello
  - H2: Pattern di distribuzione
  - H3: Distribuzione Codex di base
  - H3: Distribuzione con provider misti
  - H3: Distribuzione Codex fail-closed
  - H2: Criterio app-server
  - H2: Comandi e diagnostica
  - H3: Ispeziona i thread Codex localmente
  - H2: Plugin Codex nativi
  - H2: Uso del computer
  - H2: Confini runtime
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/codex-native-plugins.md

- Percorso: /plugins/codex-native-plugins
- Intestazioni:
  - H2: Requisiti
  - H2: Avvio rapido
  - H2: Gestisci i Plugin dalla chat
  - H2: Come funziona la configurazione dei Plugin nativi
  - H2: Confine di supporto V1
  - H2: Inventario e proprietà dell'app
  - H2: Configurazione dell'app del thread
  - H2: Criterio per le azioni distruttive
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/community.md

- Percorso: /plugins/community
- Intestazioni:
  - H2: Trova Plugin
  - H2: Pubblica Plugin
  - H2: Correlati

## plugins/compatibility.md

- Percorso: /plugins/compatibility
- Intestazioni:
  - H2: Registro di compatibilità
  - H2: Package di ispezione dei Plugin
  - H3: Corsia di accettazione del maintainer
  - H2: Criterio di deprecazione
  - H2: Aree di compatibilità attuali
  - H3: Alias piatti delle callback in ingresso WhatsApp
  - H3: Campi di ammissione in ingresso WhatsApp
  - H2: Note di rilascio

## plugins/copilot.md

- Percorso: /plugins/copilot
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
  - H2: Domande laterali (/btw)
  - H2: Doctor
  - H2: Limitazioni
  - H2: Permessi e askuser
  - H3: Token GitHub a livello di sessione
  - H2: Correlati

## plugins/dependency-resolution.md

- Percorso: /plugins/dependency-resolution
- Intestazioni:
  - H2: Suddivisione delle responsabilità
  - H2: Radici di installazione
  - H2: Plugin locali
  - H2: Avvio e ricaricamento
  - H2: Plugin inclusi
  - H2: Pulizia legacy

## plugins/google-meet.md

- Percorso: /plugins/google-meet
- Intestazioni:
  - H2: Avvio rapido
  - H3: Gateway locale + Chrome Parallels
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
  - H2: Checklist per i test live
  - H2: Risoluzione dei problemi
  - H3: L'agente non riesce a vedere lo strumento Google Meet
  - H3: Nessun nodo compatibile con Google Meet connesso
  - H3: Il browser si apre ma l'agente non riesce a partecipare
  - H3: Creazione della riunione non riuscita
  - H3: L'agente partecipa ma non parla
  - H3: I controlli di configurazione Twilio non riescono
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
  - H3: Persistenza del risultato dello strumento
  - H2: Hook di prompt e modello
  - H3: Estensioni di sessione e iniezioni al turno successivo
  - H2: Hook dei messaggi
  - H2: Hook di installazione
  - H2: Ciclo di vita del Gateway
  - H2: Deprecazioni future
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
  - H2: Elenca e cerca plugin
  - H2: Installa plugin
  - H2: Riavvia e ispeziona
  - H2: Aggiorna plugin
  - H2: Disinstalla plugin
  - H2: Scegli una fonte
  - H2: Pubblica plugin
  - H2: Correlati

## plugins/manifest.md

- Percorso: /plugins/manifest
- Intestazioni:
  - H2: Cosa fa questo file
  - H2: Esempio minimo
  - H2: Esempio completo
  - H2: Riferimento dei campi di primo livello
  - H2: Riferimento dei metadati del provider di generazione
  - H2: Riferimento dei metadati degli strumenti
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
  - H3: Sostituzione di un altro plugin di canale
  - H2: Riferimento modelSupport
  - H2: Riferimento modelCatalog
  - H2: Riferimento modelIdNormalization
  - H2: Riferimento providerEndpoints
  - H2: Riferimento providerRequest
  - H2: Riferimento secretProviderIntegrations
  - H2: Riferimento modelPricing
  - H3: Indice dei provider OpenClaw
  - H2: Manifest rispetto a package.json
  - H3: Campi package.json che influenzano il rilevamento
  - H2: Precedenza del rilevamento (ID plugin duplicati)
  - H2: Requisiti JSON Schema
  - H2: Comportamento di convalida
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
  - H3: Il Plugin si carica ma non appare alcuna memoria
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
  - H2: Layout del vault
  - H2: Importazioni Open Knowledge Format
  - H2: Asserzioni strutturate ed evidenza
  - H2: Metadati delle entità rivolti all'agente
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
  - H2: Documentazione correlata

## plugins/message-presentation.md

- Percorso: /plugins/message-presentation
- Intestazioni:
  - H2: Contratto
  - H2: Esempi di produttori
  - H2: Contratto del renderer
  - H2: Flusso di rendering core
  - H2: Regole di degradazione
  - H2: Mappatura dei provider
  - H2: Presentazione vs InteractiveReply
  - H2: Pin di recapito
  - H2: Checklist per autori di plugin
  - H2: Documentazione correlata

## plugins/oc-path.md

- Percorso: /plugins/oc-path
- Intestazioni:
  - H2: Perché abilitarlo
  - H2: Dove viene eseguito
  - H2: Abilita
  - H2: Dipendenze
  - H2: Cosa fornisce
  - H2: Relazione con altri plugin
  - H2: Sicurezza
  - H2: Correlati

## plugins/plugin-inventory.md

- Percorso: /plugins/plugin-inventory
- Intestazioni:
  - H1: Inventario dei plugin
  - H2: Definizioni
  - H2: Installa un plugin
  - H2: Pacchetto npm core
  - H2: Pacchetti esterni ufficiali
  - H2: Solo checkout del sorgente

## plugins/plugin-permission-requests.md

- Percorso: /plugins/plugin-permission-requests
- Intestazioni:
  - H2: Scegli il gate corretto
  - H2: Richiedi approvazione prima di una chiamata allo strumento
  - H2: Comportamento decisionale
  - H2: Instrada i prompt di approvazione
  - H2: Autorizzazioni native Codex
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/reference.md

- Percorso: /plugins/reference
- Intestazioni:
  - H1: Riferimento dei plugin

## plugins/reference/acpx.md

- Percorso: /plugins/reference/acpx
- Intestazioni:
  - H1: Plugin ACPx
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/admin-http-rpc.md

- Percorso: /plugins/reference/admin-http-rpc
- Intestazioni:
  - H1: Plugin Admin Http Rpc
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/alibaba.md

- Percorso: /plugins/reference/alibaba
- Intestazioni:
  - H1: Plugin Alibaba
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/amazon-bedrock-mantle.md

- Percorso: /plugins/reference/amazon-bedrock-mantle
- Intestazioni:
  - H1: Plugin Amazon Bedrock Mantle
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/amazon-bedrock.md

- Percorso: /plugins/reference/amazon-bedrock
- Intestazioni:
  - H1: Plugin Amazon Bedrock
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/anthropic-vertex.md

- Percorso: /plugins/reference/anthropic-vertex
- Intestazioni:
  - H1: Plugin Anthropic Vertex
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- Percorso: /plugins/reference/anthropic
- Intestazioni:
  - H1: Plugin Anthropic
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/arcee.md

- Percorso: /plugins/reference/arcee
- Intestazioni:
  - H1: Plugin Arcee
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/azure-speech.md

- Percorso: /plugins/reference/azure-speech
- Intestazioni:
  - H1: Plugin Azure Speech
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/bonjour.md

- Percorso: /plugins/reference/bonjour
- Intestazioni:
  - H1: Plugin Bonjour
  - H2: Distribuzione
  - H2: Interfaccia esposta

## plugins/reference/brave.md

- Percorso: /plugins/reference/brave
- Intestazioni:
  - H1: Plugin Brave
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/browser.md

- Percorso: /plugins/reference/browser
- Intestazioni:
  - H1: Plugin Browser
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/byteplus.md

- Percorso: /plugins/reference/byteplus
- Intestazioni:
  - H1: Plugin BytePlus
  - H2: Distribuzione
  - H2: Interfaccia esposta

## plugins/reference/canvas.md

- Percorso: /plugins/reference/canvas
- Intestazioni:
  - H1: Plugin Canvas
  - H2: Distribuzione
  - H2: Interfaccia esposta

## plugins/reference/cerebras.md

- Percorso: /plugins/reference/cerebras
- Intestazioni:
  - H1: Plugin Cerebras
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/chutes.md

- Percorso: /plugins/reference/chutes
- Intestazioni:
  - H1: Plugin Chutes
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/clickclack.md

- Percorso: /plugins/reference/clickclack
- Intestazioni:
  - H1: Plugin Clickclack
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/cloudflare-ai-gateway.md

- Percorso: /plugins/reference/cloudflare-ai-gateway
- Intestazioni:
  - H1: Plugin Cloudflare AI Gateway
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/codex-supervisor.md

- Percorso: /plugins/reference/codex-supervisor
- Intestazioni:
  - H1: Plugin Codex Supervisor
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Elenco sessioni

## plugins/reference/codex.md

- Percorso: /plugins/reference/codex
- Intestazioni:
  - H1: Plugin Codex
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/cohere.md

- Percorso: /plugins/reference/cohere
- Intestazioni:
  - H1: Plugin Cohere
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/comfy.md

- Percorso: /plugins/reference/comfy
- Intestazioni:
  - H1: Plugin ComfyUI
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/copilot-proxy.md

- Percorso: /plugins/reference/copilot-proxy
- Intestazioni:
  - H1: Plugin Copilot Proxy
  - H2: Distribuzione
  - H2: Interfaccia esposta

## plugins/reference/copilot.md

- Percorso: /plugins/reference/copilot
- Intestazioni:
  - H1: Plugin Copilot
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/deepgram.md

- Percorso: /plugins/reference/deepgram
- Intestazioni:
  - H1: Plugin Deepgram
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/deepinfra.md

- Percorso: /plugins/reference/deepinfra
- Intestazioni:
  - H1: Plugin DeepInfra
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/deepseek.md

- Percorso: /plugins/reference/deepseek
- Intestazioni:
  - H1: Plugin DeepSeek
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/diagnostics-otel.md

- Percorso: /plugins/reference/diagnostics-otel
- Intestazioni:
  - H1: Plugin Diagnostics OpenTelemetry
  - H2: Distribuzione
  - H2: Interfaccia esposta

## plugins/reference/diagnostics-prometheus.md

- Percorso: /plugins/reference/diagnostics-prometheus
- Intestazioni:
  - H1: Plugin Diagnostics Prometheus
  - H2: Distribuzione
  - H2: Interfaccia esposta

## plugins/reference/diffs-language-pack.md

- Percorso: /plugins/reference/diffs-language-pack
- Intestazioni:
  - H1: Plugin Diffs Language Pack
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Lingue aggiunte

## plugins/reference/diffs.md

- Percorso: /plugins/reference/diffs
- Intestazioni:
  - H1: Plugin Diffs
  - H2: Distribuzione
  - H2: Interfaccia esposta

## plugins/reference/discord.md

- Percorso: /plugins/reference/discord
- Intestazioni:
  - H1: Plugin Discord
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/document-extract.md

- Percorso: /plugins/reference/document-extract
- Intestazioni:
  - H1: Plugin Document Extract
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/duckduckgo.md

- Percorso: /plugins/reference/duckduckgo
- Intestazioni:
  - H1: Plugin DuckDuckGo
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/elevenlabs.md

- Percorso: /plugins/reference/elevenlabs
- Intestazioni:
  - H1: Plugin Elevenlabs
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/exa.md

- Percorso: /plugins/reference/exa
- Intestazioni:
  - H1: Plugin Exa
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/fal.md

- Percorso: /plugins/reference/fal
- Intestazioni:
  - H1: Plugin fal
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/feishu.md

- Percorso: /plugins/reference/feishu
- Intestazioni:
  - H1: Plugin Feishu
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/file-transfer.md

- Percorso: /plugins/reference/file-transfer
- Intestazioni:
  - H1: Plugin File Transfer
  - H2: Distribuzione
  - H2: Interfaccia esposta

## plugins/reference/firecrawl.md

- Percorso: /plugins/reference/firecrawl
- Intestazioni:
  - H1: Plugin Firecrawl
  - H2: Distribuzione
  - H2: Interfaccia esposta
  - H2: Documentazione correlata

## plugins/reference/fireworks.md

- Percorso: /plugins/reference/fireworks
- Titoli:
  - H1: Plugin Fireworks
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/github-copilot.md

- Percorso: /plugins/reference/github-copilot
- Titoli:
  - H1: Plugin GitHub Copilot
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/gmi.md

- Percorso: /plugins/reference/gmi
- Titoli:
  - H1: Plugin Gmi
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/google-meet.md

- Percorso: /plugins/reference/google-meet
- Titoli:
  - H1: Plugin Google Meet
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/google.md

- Percorso: /plugins/reference/google
- Titoli:
  - H1: Plugin Google
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/googlechat.md

- Percorso: /plugins/reference/googlechat
- Titoli:
  - H1: Plugin Google Chat
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/gradium.md

- Percorso: /plugins/reference/gradium
- Titoli:
  - H1: Plugin Gradium
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/groq.md

- Percorso: /plugins/reference/groq
- Titoli:
  - H1: Plugin Groq
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/huggingface.md

- Percorso: /plugins/reference/huggingface
- Titoli:
  - H1: Plugin Hugging Face
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/imessage.md

- Percorso: /plugins/reference/imessage
- Titoli:
  - H1: Plugin iMessage
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/inworld.md

- Percorso: /plugins/reference/inworld
- Titoli:
  - H1: Plugin Inworld
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/irc.md

- Percorso: /plugins/reference/irc
- Titoli:
  - H1: Plugin IRC
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/kilocode.md

- Percorso: /plugins/reference/kilocode
- Titoli:
  - H1: Plugin Kilocode
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/kimi.md

- Percorso: /plugins/reference/kimi
- Titoli:
  - H1: Plugin Kimi
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/line.md

- Percorso: /plugins/reference/line
- Titoli:
  - H1: Plugin LINE
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/litellm.md

- Percorso: /plugins/reference/litellm
- Titoli:
  - H1: Plugin LiteLLM
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/llama-cpp.md

- Percorso: /plugins/reference/llama-cpp
- Titoli:
  - H1: Plugin Llama Cpp
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/llm-task.md

- Percorso: /plugins/reference/llm-task
- Titoli:
  - H1: Plugin LLM Task
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/lmstudio.md

- Percorso: /plugins/reference/lmstudio
- Titoli:
  - H1: Plugin LM Studio
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/lobster.md

- Percorso: /plugins/reference/lobster
- Titoli:
  - H1: Plugin Lobster
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/matrix.md

- Percorso: /plugins/reference/matrix
- Titoli:
  - H1: Plugin Matrix
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/mattermost.md

- Percorso: /plugins/reference/mattermost
- Titoli:
  - H1: Plugin Mattermost
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/memory-core.md

- Percorso: /plugins/reference/memory-core
- Titoli:
  - H1: Plugin Memory Core
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/memory-lancedb.md

- Percorso: /plugins/reference/memory-lancedb
- Titoli:
  - H1: Plugin Memory Lancedb
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/memory-wiki.md

- Percorso: /plugins/reference/memory-wiki
- Titoli:
  - H1: Plugin Memory Wiki
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/microsoft-foundry.md

- Percorso: /plugins/reference/microsoft-foundry
- Titoli:
  - H1: Plugin Microsoft Foundry
  - H2: Distribuzione
  - H2: Superficie
  - H2: Requisiti
  - H2: Modelli di chat
  - H2: Generazione di immagini MAI
  - H2: Risoluzione dei problemi

## plugins/reference/microsoft.md

- Percorso: /plugins/reference/microsoft
- Titoli:
  - H1: Plugin Microsoft
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/migrate-claude.md

- Percorso: /plugins/reference/migrate-claude
- Titoli:
  - H1: Plugin Migrate Claude
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/migrate-hermes.md

- Percorso: /plugins/reference/migrate-hermes
- Titoli:
  - H1: Plugin Migrate Hermes
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/minimax.md

- Percorso: /plugins/reference/minimax
- Titoli:
  - H1: Plugin MiniMax
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/mistral.md

- Percorso: /plugins/reference/mistral
- Titoli:
  - H1: Plugin Mistral
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/moonshot.md

- Percorso: /plugins/reference/moonshot
- Titoli:
  - H1: Plugin Moonshot
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/msteams.md

- Percorso: /plugins/reference/msteams
- Titoli:
  - H1: Plugin Microsoft Teams
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/nextcloud-talk.md

- Percorso: /plugins/reference/nextcloud-talk
- Titoli:
  - H1: Plugin Nextcloud Talk
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/nostr.md

- Percorso: /plugins/reference/nostr
- Titoli:
  - H1: Plugin Nostr
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/novita.md

- Percorso: /plugins/reference/novita
- Titoli:
  - H1: Plugin Novita
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/nvidia.md

- Percorso: /plugins/reference/nvidia
- Titoli:
  - H1: Plugin NVIDIA
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/oc-path.md

- Percorso: /plugins/reference/oc-path
- Titoli:
  - H1: Plugin Oc Path
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/ollama.md

- Percorso: /plugins/reference/ollama
- Titoli:
  - H1: Plugin Ollama
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/open-prose.md

- Percorso: /plugins/reference/open-prose
- Titoli:
  - H1: Plugin Open Prose
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/openai.md

- Percorso: /plugins/reference/openai
- Titoli:
  - H1: Plugin OpenAI
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/opencode-go.md

- Percorso: /plugins/reference/opencode-go
- Titoli:
  - H1: Plugin OpenCode Go
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/opencode.md

- Percorso: /plugins/reference/opencode
- Titoli:
  - H1: Plugin OpenCode
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/openrouter.md

- Percorso: /plugins/reference/openrouter
- Titoli:
  - H1: Plugin OpenRouter
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/openshell.md

- Percorso: /plugins/reference/openshell
- Titoli:
  - H1: Plugin Openshell
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/perplexity.md

- Percorso: /plugins/reference/perplexity
- Titoli:
  - H1: Plugin Perplexity
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/pixverse.md

- Percorso: /plugins/reference/pixverse
- Titoli:
  - H1: Plugin PixVerse
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/policy.md

- Percorso: /plugins/reference/policy
- Titoli:
  - H1: Plugin Policy
  - H2: Distribuzione
  - H2: Superficie
  - H2: Comportamento
  - H2: Documenti correlati

## plugins/reference/qa-channel.md

- Percorso: /plugins/reference/qa-channel
- Titoli:
  - H1: Plugin QA Channel
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/qa-lab.md

- Percorso: /plugins/reference/qa-lab
- Titoli:
  - H1: Plugin QA Lab
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/qa-matrix.md

- Percorso: /plugins/reference/qa-matrix
- Titoli:
  - H1: Plugin QA Matrix
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/qianfan.md

- Percorso: /plugins/reference/qianfan
- Titoli:
  - H1: Plugin Qianfan
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/qqbot.md

- Percorso: /plugins/reference/qqbot
- Titoli:
  - H1: Plugin QQ Bot
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/qwen.md

- Percorso: /plugins/reference/qwen
- Titoli:
  - H1: Plugin Qwen
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/raft.md

- Percorso: /plugins/reference/raft
- Titoli:
  - H1: Plugin Raft
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/runway.md

- Percorso: /plugins/reference/runway
- Titoli:
  - H1: Plugin Runway
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/searxng.md

- Percorso: /plugins/reference/searxng
- Titoli:
  - H1: Plugin SearXNG
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/senseaudio.md

- Percorso: /plugins/reference/senseaudio
- Titoli:
  - H1: Plugin Senseaudio
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/sglang.md

- Percorso: /plugins/reference/sglang
- Titoli:
  - H1: Plugin SGLang
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/signal.md

- Percorso: /plugins/reference/signal
- Titoli:
  - H1: Plugin Signal
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/slack.md

- Percorso: /plugins/reference/slack
- Titoli:
  - H1: Plugin Slack
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/sms.md

- Percorso: /plugins/reference/sms
- Titoli:
  - H1: Plugin Sms
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/stepfun.md

- Percorso: /plugins/reference/stepfun
- Titoli:
  - H1: Plugin StepFun
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/synology-chat.md

- Percorso: /plugins/reference/synology-chat
- Titoli:
  - H1: Plugin Synology Chat
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/synthetic.md

- Percorso: /plugins/reference/synthetic
- Titoli:
  - H1: Plugin Synthetic
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/tavily.md

- Percorso: /plugins/reference/tavily
- Titoli:
  - H1: Plugin Tavily
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/telegram.md

- Percorso: /plugins/reference/telegram
- Titoli:
  - H1: Plugin Telegram
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/tencent.md

- Percorso: /plugins/reference/tencent
- Titoli:
  - H1: Plugin Tencent
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/tlon.md

- Percorso: /plugins/reference/tlon
- Titoli:
  - H1: Plugin Tlon
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/together.md

- Percorso: /plugins/reference/together
- Titoli:
  - H1: Plugin Together
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/tokenjuice.md

- Percorso: /plugins/reference/tokenjuice
- Titoli:
  - H1: Plugin Tokenjuice
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

## plugins/reference/tts-local-cli.md

- Percorso: /plugins/reference/tts-local-cli
- Titoli:
  - H1: Plugin TTS Local CLI
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/twitch.md

- Percorso: /plugins/reference/twitch
- Titoli:
  - H1: Plugin Twitch
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documenti correlati

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
  - H1: Plugin Webhook
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
  - H3: Middleware per i risultati degli strumenti
  - H3: Classificazione dell'esito terminale
  - H3: Effetti collaterali lato fine agente
  - H3: Input utente e superfici degli strumenti
  - H3: Modalità harness Codex nativa
  - H2: Rigorosità runtime
  - H2: Sessioni native e specchio della trascrizione
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
  - H2: Adattatore
  - H2: Adattatori outbound esistenti
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
  - H3: Registrazione della discovery del Gateway
  - H3: Metadati di registrazione CLI
  - H3: Registrazione backend CLI
  - H3: Slot esclusivi
  - H3: Adattatori di embedding della memoria deprecati
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
  - H2: Utilità runtime riutilizzabili
  - H2: Namespace runtime
  - H2: Archiviare riferimenti runtime
  - H2: Altri campi api di primo livello
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
  - H2: Voce di setup
  - H3: Importazioni ristrette degli helper di setup
  - H3: Promozione di account singolo di proprietà del canale
  - H2: Schema di configurazione
  - H3: Creazione degli schemi di configurazione dei canali
  - H2: Wizard di setup
  - H2: Pubblicazione e installazione
  - H2: Correlati

## plugins/sdk-subpaths.md

- Percorso: /plugins/sdk-subpaths
- Intestazioni:
  - H2: Voce del Plugin
  - H3: Compatibilità deprecata e helper di test
  - H3: Sottopercorsi helper riservati ai Plugin inclusi
  - H2: Correlati

## plugins/sdk-testing.md

- Percorso: /plugins/sdk-testing
- Intestazioni:
  - H2: Utilità di test
  - H3: Export disponibili
  - H3: Tipi
  - H2: Test della risoluzione del target
  - H2: Pattern di test
  - H3: Test dei contratti di registrazione
  - H3: Test dell'accesso alla configurazione runtime
  - H3: Unit test di un Plugin di canale
  - H3: Unit test di un Plugin provider
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
  - H2: Valori di ritorno
  - H2: Configurazione
  - H2: Metadati generati
  - H2: Metadati del pacchetto
  - H2: Validare in CI
  - H2: Installare e ispezionare localmente
  - H2: Pubblicare
  - H2: Risoluzione dei problemi
  - H3: voce del Plugin non trovata: ./dist/index.js
  - H3: la voce del Plugin non espone i metadati defineToolPlugin
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
  - H3: Esempi di provider di streaming
  - H2: TTS per le chiamate
  - H3: Esempi TTS
  - H2: Chiamate in ingresso
  - H3: Instradamento per numero
  - H3: Contratto dell'output parlato
  - H3: Comportamento di avvio della conversazione
  - H3: Periodo di tolleranza per disconnessione stream Twilio
  - H2: Reaper delle chiamate obsolete
  - H2: Sicurezza Webhook
  - H2: CLI
  - H2: Strumento agente
  - H2: RPC del Gateway
  - H2: Risoluzione dei problemi
  - H3: Il setup non riesce a esporre il webhook
  - H3: Le credenziali del provider non riescono
  - H3: Le chiamate partono ma i webhook del provider non arrivano
  - H3: La verifica della firma non riesce
  - H3: I join Google Meet Twilio non riescono
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
  - H3: Punti di ingresso del dispatch
  - H2: CLI e comando slash
  - H2: Sincronizzazione del ciclo di vita della sessione
  - H2: Workflow della dashboard
  - H2: Autorizzazioni
  - H2: Configurazione
  - H2: Risoluzione dei problemi
  - H3: La scheda dice che Workboard non è disponibile
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
  - H2: Esempio: ricerca e sintesi in parallelo
  - H2: Mappatura del runtime OpenClaw
  - H2: Posizioni dei file
  - H2: Backend di stato
  - H2: Sicurezza
  - H2: Correlati

## providers/alibaba.md

- Percorso: /providers/alibaba
- Intestazioni:
  - H2: Primi passi
  - H2: Modelli Wan integrati
  - H2: Capacità e limiti
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/anthropic.md

- Percorso: /providers/anthropic
- Intestazioni:
  - H2: Primi passi
  - H2: Impostazioni predefinite di ragionamento (Claude Fable 5, 4.8 e 4.6)
  - H2: Caching dei prompt
  - H2: Configurazione avanzata
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/arcee.md

- Percorso: /providers/arcee
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Primi passi
  - H2: Setup non interattivo
  - H2: Catalogo integrato
  - H2: Funzionalità supportate
  - H2: Correlati

## providers/azure-speech.md

- Percorso: /providers/azure-speech
- Intestazioni:
  - H2: Primi passi
  - H2: Opzioni di configurazione
  - H2: Note
  - H2: Correlati

## providers/bedrock-mantle.md

- Percorso: /providers/bedrock-mantle
- Intestazioni:
  - H2: Primi passi
  - H2: Discovery automatica dei modelli
  - H3: Regioni supportate
  - H2: Configurazione manuale
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/bedrock.md

- Percorso: /providers/bedrock
- Intestazioni:
  - H2: Primi passi
  - H2: Discovery automatica dei modelli
  - H2: Setup rapido (percorso AWS)
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/cerebras.md

- Percorso: /providers/cerebras
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Primi passi
  - H2: Setup non interattivo
  - H2: Catalogo integrato
  - H2: Configurazione manuale
  - H2: Correlati

## providers/chutes.md

- Percorso: /providers/chutes
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Primi passi
  - H2: Comportamento di discovery
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
  - H2: STT in streaming per chiamate vocali
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
  - H2: Avvio on-demand
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
  - H2: Flag facoltativi
  - H2: Onboarding non interattivo
  - H2: Incorporamenti per la ricerca in memoria
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
  - H2: Pagine di panoramica condivise
  - H2: Provider di trascrizione
  - H2: Strumenti della community

## providers/inferrs.md

- Percorso: /providers/inferrs
- Intestazioni:
  - H2: Per iniziare
  - H2: Esempio di configurazione completa
  - H2: Avvio on-demand
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
  - H3: Compatibilità dell'uso in streaming
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
  - H2: STT in streaming per chiamate vocali
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/models.md

- Percorso: /providers/models
- Intestazioni:
  - H2: Avvio rapido (due passaggi)
  - H2: Provider supportati (set iniziale)
  - H2: Varianti aggiuntive dei provider
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
  - H2: Catalogo di fallback incluso
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
  - H2: Rilevamento modelli (provider implicito)
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
  - H2: Anteprima limitata GPT-5.6
  - H2: Copertura delle funzionalità OpenClaw
  - H2: Incorporamenti di memoria
  - H2: Per iniziare
  - H2: Autenticazione app-server nativa Codex
  - H2: Generazione di immagini
  - H2: Generazione di video
  - H2: Contributo al prompt GPT-5
  - H2: Voce e parlato
  - H2: Endpoint Azure OpenAI
  - H3: Configurazione
  - H3: Versione API
  - H3: I nomi dei modelli sono nomi di deployment
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
  - H2: Riferimenti dei modelli
  - H2: Generazione di immagini
  - H2: Generazione di video
  - H2: Generazione di musica
  - H2: Sintesi vocale
  - H2: Trascrizione vocale (audio in ingresso)
  - H2: Router di fusione
  - H2: Autenticazione e intestazioni
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/perplexity-provider.md

- Percorso: /providers/perplexity-provider
- Intestazioni:
  - H2: Installa Plugin
  - H2: Per iniziare
  - H2: Modalità di ricerca
  - H2: Filtro API nativo
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
  - H2: Rilevamento modelli (provider implicito)
  - H2: Configurazione esplicita (modelli manuali)
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/stepfun.md

- Percorso: /providers/stepfun
- Intestazioni:
  - H2: Installa Plugin
  - H2: Panoramica di regione ed endpoint
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
  - H2: Rilevamento modelli
  - H2: Supporto per streaming e strumenti
  - H2: Prezzi
  - H3: Venice (anonimizzato) vs API diretta
  - H2: Esempi d'uso
  - H2: Risoluzione dei problemi
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/vercel-ai-gateway.md

- Percorso: /providers/vercel-ai-gateway
- Intestazioni:
  - H2: Per iniziare
  - H2: Esempio non interattivo
  - H2: Abbreviazione ID modello
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/vllm.md

- Percorso: /providers/vllm
- Intestazioni:
  - H2: Per iniziare
  - H2: Rilevamento modelli (provider implicito)
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
  - H2: Copertura delle funzionalità OpenClaw
  - H3: Mappature fast-mode
  - H3: Alias di compatibilità precedente
  - H2: Funzionalità
  - H2: Test live
  - H2: Correlati

## providers/xiaomi.md

- Percorso: /providers/xiaomi
- Intestazioni:
  - H2: Primi passi
  - H2: Catalogo a consumo
  - H2: Catalogo del piano a token
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
  - H2: Modello di destinazione
  - H3: Identità dell'istanza Gateway
  - H3: Proprietà della sessione ACP
  - H3: Lease dei processi ACPX
  - H2: Controller del ciclo di vita
  - H2: Contratto del wrapper
  - H2: Contratto di visibilità della sessione
  - H2: Piano di migrazione
  - H3: Fase 1: aggiungere identità e lease
  - H3: Fase 2: pulizia basata prima sui lease
  - H3: Fase 3: rimozione all'avvio basata prima sui lease
  - H3: Fase 4: righe di proprietà della sessione
  - H3: Fase 5: rimuovere le euristiche precedenti
  - H2: Test
  - H2: Note di compatibilità
  - H2: Criteri di successo

## refactor/canvas.md

- Percorso: /refactor/canvas
- Intestazioni:
  - H1: Refactor del plugin Canvas
  - H2: Obiettivo
  - H2: Non obiettivi
  - H2: Stato attuale del branch
  - H2: Forma di destinazione
  - H2: Passaggi di migrazione
  - H2: Checklist di audit
  - H2: Comandi di verifica

## refactor/database-first.md

- Percorso: /refactor/database-first
- Intestazioni:
  - H1: Refactor dello stato database-first
  - H2: Decisione
  - H2: Contratto rigido
  - H2: Stato obiettivo e avanzamento
  - H3: Obiettivo rigido
  - H3: Stati obiettivo
  - H3: Stato attuale
  - H3: Lavoro rimanente
  - H3: Non regredire
  - H2: Assunzioni dalla lettura del codice
  - H2: Risultati della lettura del codice
  - H2: Forma attuale del codice
  - H2: Forma dello schema di destinazione
  - H2: Forma della migrazione doctor
  - H2: Inventario della migrazione
  - H2: Piano di migrazione
  - H3: Fase 0: congelare il confine
  - H3: Fase 1: completare il control plane globale
  - H3: Fase 2: introdurre database per agente
  - H3: Fase 3: sostituire le API dello store di sessione
  - H3: Fase 4: spostare trascrizioni, stream ACP, traiettorie e VFS
  - H3: Fase 5: backup, ripristino, vacuum e verifica
  - H3: Fase 6: runtime worker
  - H3: Fase 7: eliminare il vecchio mondo
  - H2: Backup e ripristino
  - H2: Piano di refactor del runtime
  - H2: Regole di prestazioni
  - H2: Divieti statici
  - H2: Criteri di completamento

## refactor/ingress-core.md

- Percorso: /refactor/ingress-core
- Intestazioni:
  - H1: Piano di eliminazione dell'ingress core
  - H2: Budget
  - H2: Diagnosi
  - H2: Hotspot
  - H2: Lettura del codice attuale
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
  - H2: Verifica preliminare delle soluzioni esistenti
  - H2: Avvio sessione (obbligatorio)
  - H2: Anima (obbligatorio)
  - H2: Spazi condivisi (consigliato)
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
  - H2: Verifica preliminare del rilascio
  - H2: Test box di rilascio
  - H3: Vitest
  - H3: Docker
  - H3: Laboratorio QA
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
  - H2: Funzionalità che possono consumare chiavi
  - H3: 1) Risposte del modello core (chat + strumenti)
  - H3: 2) Comprensione dei media (audio/immagine/video)
  - H3: 3) Generazione di immagini e video
  - H3: 4) Embedding di memoria + ricerca semantica
  - H3: 5) Strumento di ricerca web
  - H3: 5) Strumento di recupero web (Firecrawl)
  - H3: 6) Snapshot di utilizzo del provider (stato/salute)
  - H3: 7) Riassunto di salvaguardia della Compaction
  - H3: 8) Scansione / probe dei modelli
  - H3: 9) Parlato (voce)
  - H3: 10) Skills (API di terze parti)
  - H2: Correlati

## reference/application-modernization-plan.md

- Percorso: /reference/application-modernization-plan
- Intestazioni:
  - H2: Obiettivo
  - H2: Principi
  - H2: Fase 1: audit di base
  - H2: Fase 2: pulizia di prodotto e UX
  - H2: Fase 3: irrigidimento dell'architettura frontend
  - H2: Fase 4: prestazioni e affidabilità
  - H2: Fase 5: rafforzamento di tipi, contratti e test
  - H2: Fase 6: documentazione e preparazione al rilascio
  - H2: Prima porzione consigliata
  - H2: Aggiornamento della skill frontend

## reference/code-mode.md

- Percorso: /reference/code-mode
- Intestazioni:
  - H2: Che cos'è?
  - H2: Perché è utile?
  - H2: Come abilitarlo
  - H2: Panoramica tecnica
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
  - H3: Ciclo di vita del registry
  - H3: Forma della registrazione
  - H3: Proprietà e visibilità
  - H3: Regole di serializzazione dell'ambito
  - H3: Prompt
  - H3: Pulizia
  - H3: Checklist dei test
  - H2: API di output
  - H2: Catalogo degli strumenti
  - H2: Interazione Tool Search
  - H2: Nomi degli strumenti e collisioni
  - H2: Esecuzione di strumenti annidati
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
  - H2: Crediti
  - H2: Collaboratori core
  - H2: Licenza
  - H2: Correlati

## reference/device-models.md

- Percorso: /reference/device-models
- Intestazioni:
  - H2: Fonte dati
  - H2: Aggiornamento del database
  - H2: Correlati

## reference/full-release-validation.md

- Percorso: /reference/full-release-validation
- Intestazioni:
  - H2: Fasi di livello superiore
  - H2: Fasi dei controlli di rilascio
  - H2: Blocchi del percorso di rilascio Docker
  - H2: Profili di rilascio
  - H2: Aggiunte solo complete
  - H2: Riesecuzioni mirate
  - H2: Evidenze da conservare
  - H2: File di workflow

## reference/memory-config.md

- Percorso: /reference/memory-config
- Intestazioni:
  - H2: Selezione del provider
  - H3: ID provider personalizzati
  - H3: Risoluzione delle chiavi API
  - H2: Configurazione dell'endpoint remoto
  - H2: Configurazione specifica del provider
  - H3: Timeout degli embedding inline
  - H2: Configurazione della ricerca ibrida
  - H3: Esempio completo
  - H2: Percorsi di memoria aggiuntivi
  - H2: Memoria multimodale (Gemini)
  - H2: Cache degli embedding
  - H2: Indicizzazione batch
  - H2: Ricerca nella memoria di sessione (sperimentale)
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
  - H2: Controlli principali
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
  - H3: API diretta Google Gemini
  - H3: Utilizzo della CLI Gemini
  - H2: Confine della cache del prompt di sistema
  - H2: Guardrail di stabilità della cache OpenClaw
  - H2: Pattern di ottimizzazione
  - H3: Traffico misto (predefinito consigliato)
  - H3: Baseline orientata ai costi
  - H2: Diagnostica della cache
  - H2: Test di regressione live
  - H3: Aspettative live Anthropic
  - H3: Aspettative live OpenAI
  - H3: Configurazione diagnostics.cacheTrace
  - H3: Toggle env (debug una tantum)
  - H3: Cosa ispezionare
  - H2: Risoluzione rapida dei problemi
  - H2: Correlati

## reference/release-performance-sweep.md

- Percorso: /reference/release-performance-sweep
- Intestazioni:
  - H2: Snapshot
  - H2: Cronologia dell'impronta di installazione
  - H2: Cosa è cambiato nella 5.28
  - H2: Numeri principali
  - H3: Impronta di installazione
  - H3: Dimensione del pacchetto npm
  - H2: Riepilogo del turno agente Kova
  - H2: Probe sorgente
  - H2: Audit dell'impronta di installazione
  - H3: Confine shrinkwrap
  - H2: Interpretazione della supply chain

## reference/rich-output-protocol.md

- Percorso: /reference/rich-output-protocol
- Intestazioni:
  - H2: [embed ...]
  - H2: Forma di rendering archiviata
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
  - H2: Sessioni Cron e log delle esecuzioni
  - H2: Chiavi di sessione (sessionKey)
  - H2: ID sessione (sessionId)
  - H2: Schema dello store di sessione (sessions.json)
  - H2: Struttura della trascrizione (.jsonl)
  - H2: Finestre di contesto vs token tracciati
  - H2: Compaction: che cos'è
  - H2: Confini dei chunk di Compaction e abbinamento degli strumenti
  - H2: Quando avviene l'auto-Compaction (runtime OpenClaw)
  - H2: Impostazioni di Compaction (reserveTokens, keepRecentTokens)
  - H2: Provider di Compaction collegabili
  - H2: Superfici visibili all'utente
  - H2: Manutenzione silenziosa (NOREPLY)
  - H2: "flush della memoria" pre-Compaction (implementato)
  - H2: Checklist di risoluzione dei problemi
  - H2: Correlati

## reference/templates/AGENTS.dev.md

- Percorso: /reference/templates/AGENTS.dev
- Intestazioni:
  - H1: AGENTS.md - Workspace OpenClaw
  - H2: Prima esecuzione (una tantum)
  - H2: Suggerimento per il backup (consigliato)
  - H2: Impostazioni di sicurezza predefinite
  - H2: Verifica preliminare delle soluzioni esistenti
  - H2: Memoria quotidiana (consigliata)
  - H2: Heartbeat (facoltativi)
  - H2: Personalizza
  - H2: Memoria di origine C-3PO
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
  - H2: Dopo aver capito chi sei
  - H2: Connetti (facoltativo)
  - H2: Quando hai finito
  - H2: Correlati

## reference/templates/HEARTBEAT.md

- Percorso: /reference/templates/HEARTBEAT
- Intestazioni:
  - H1: Modello HEARTBEAT.md
  - H2: Correlati

## reference/templates/IDENTITY.dev.md

- Percorso: /reference/templates/IDENTITY.dev
- Intestazioni:
  - H1: IDENTITY.md - Identità dell'agente
  - H2: Ruolo
  - H2: Anima
  - H2: Relazione con Clawd
  - H2: Peculiarità
  - H2: Frase distintiva
  - H2: Correlati

## reference/templates/IDENTITY.md

- Percorso: /reference/templates/IDENTITY
- Intestazioni:
  - H1: IDENTITY.md - Chi sono?
  - H2: Correlati

## reference/templates/SOUL.dev.md

- Percorso: /reference/templates/SOUL.dev
- Intestazioni:
  - H1: SOUL.md - L’anima di C-3PO
  - H2: Chi sono
  - H2: Il mio scopo
  - H2: Come opero
  - H2: Le mie particolarità
  - H2: Il mio rapporto con Clawd
  - H2: Cosa non farò
  - H2: La regola d’oro
  - H2: Correlati

## reference/templates/SOUL.md

- Percorso: /reference/templates/SOUL
- Intestazioni:
  - H1: SOUL.md - Chi sei
  - H2: Verità fondamentali
  - H2: Limiti
  - H2: Stile
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
  - H2: Benchmark della latenza dei modelli (chiavi locali)
  - H2: Benchmark di avvio della CLI
  - H2: Benchmark di avvio del Gateway
  - H2: Benchmark di riavvio del Gateway
  - H2: Onboarding E2E (Docker)
  - H2: Smoke test di importazione QR (Docker)
  - H2: Correlati

## reference/token-use.md

- Percorso: /reference/token-use
- Intestazioni:
  - H2: Come viene creato il prompt di sistema
  - H2: Cosa conta nella finestra di contesto
  - H2: Come vedere l’utilizzo corrente dei token
  - H2: Stima dei costi (quando mostrata)
  - H2: Impatto della TTL della cache e della potatura
  - H3: Esempio: mantenere calda una cache di 1 h con Heartbeat
  - H3: Esempio: traffico misto con strategia di cache per agente
  - H3: Contesto Anthropic da 1M
  - H2: Suggerimenti per ridurre la pressione sui token
  - H2: Correlati

## reference/transcript-hygiene.md

- Percorso: /reference/transcript-hygiene
- Intestazioni:
  - H2: Regola globale: il contesto di runtime non è il transcript utente
  - H2: Dove viene eseguito
  - H2: Regola globale: sanificazione delle immagini
  - H2: Regola globale: chiamate agli strumenti non valide
  - H2: Regola globale: turni incompleti solo di ragionamento
  - H2: Regola globale: provenienza degli input tra sessioni
  - H2: Matrice dei provider (comportamento corrente)
  - H2: Comportamento storico (pre-2026.1.22)
  - H2: Correlati

## reference/wizard.md

- Percorso: /reference/wizard
- Intestazioni:
  - H2: Dettagli del flusso (modalità locale)
  - H2: Modalità non interattiva
  - H3: Aggiungere agente (non interattivo)
  - H2: RPC della procedura guidata del Gateway
  - H2: Configurazione di Signal (signal-cli)
  - H2: Cosa scrive la procedura guidata
  - H2: Documentazione correlata

## releases/2026.6.11.md

- Percorso: /releases/2026.6.11
- Intestazioni:
  - H1: Note di rilascio di OpenClaw v2026.6.11 (2026-06-30)
  - H2: Punti salienti
  - H3: Affidabilità della consegna dei canali
  - H3: Ripristino di provider e modelli
  - H3: Continuità di sessione, memoria e fiducia
  - H3: Modalità relay del router Slack
  - H3: Bridge di risveglio per Raft External Agent
  - H3: Installazione e riparazione dei Plugin ufficiali
  - H2: Canali e messaggistica
  - H3: Correzioni aggiuntive dei canali
  - H2: Gateway, sicurezza e fiducia
  - H3: Ripristino di riavvio e disponibilità
  - H3: Consegna di risultati remoti e media
  - H2: Client e interfacce
  - H3: Invii client e riconnessioni
  - H3: Correzioni a interfaccia, impostazioni e onboarding
  - H2: Documentazione e strumenti di amministrazione
  - H3: Affidabilità di configurazione e comandi
  - H3: Strumenti e lavori pianificati

## releases/index.md

- Percorso: /releases
- Intestazioni:
  - H1: Note di rilascio
  - H2: Rilasci
  - H2: Cronologia grezza dei rilasci

## security/CONTRIBUTING-THREAT-MODEL.md

- Percorso: /security/CONTRIBUTING-THREAT-MODEL
- Intestazioni:
  - H2: Modi per contribuire
  - H3: Aggiungere una minaccia
  - H3: Suggerire una mitigazione
  - H3: Proporre una catena di attacco
  - H3: Correggere o migliorare i contenuti esistenti
  - H2: Cosa usiamo
  - H3: Framework MITRE ATLAS
  - H3: ID minaccia
  - H3: Livelli di rischio
  - H2: Processo di revisione
  - H2: Risorse
  - H2: Contatto
  - H2: Riconoscimento
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
  - H4: T-RECON-002: Sondaggio dell’integrazione dei canali
  - H3: 3.2 Accesso iniziale (AML.TA0004)
  - H4: T-ACCESS-001: Intercettazione del codice di pairing
  - H4: T-ACCESS-002: Spoofing AllowFrom
  - H4: T-ACCESS-003: Furto di token
  - H3: 3.3 Esecuzione (AML.TA0005)
  - H4: T-EXEC-001: Prompt injection diretta
  - H4: T-EXEC-002: Prompt injection indiretta
  - H4: T-EXEC-003: Injection degli argomenti degli strumenti
  - H4: T-EXEC-004: Bypass dell’approvazione exec
  - H3: 3.4 Persistenza (AML.TA0006)
  - H4: T-PERSIST-001: Installazione di Skill malevole
  - H4: T-PERSIST-002: Avvelenamento degli aggiornamenti delle Skill
  - H4: T-PERSIST-003: Manomissione della configurazione dell’agente
  - H3: 3.5 Evasione delle difese (AML.TA0007)
  - H4: T-EVADE-001: Bypass dei pattern di moderazione
  - H4: T-EVADE-002: Fuga dal wrapper dei contenuti
  - H3: 3.6 Discovery (AML.TA0008)
  - H4: T-DISC-001: Enumerazione degli strumenti
  - H4: T-DISC-002: Estrazione dei dati di sessione
  - H3: 3.7 Raccolta ed esfiltrazione (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Furto di dati tramite webfetch
  - H4: T-EXFIL-002: Invio di messaggi non autorizzato
  - H4: T-EXFIL-003: Raccolta di credenziali
  - H3: 3.8 Impatto (AML.TA0011)
  - H4: T-IMPACT-001: Esecuzione di comandi non autorizzata
  - H4: T-IMPACT-002: Esaurimento delle risorse (DoS)
  - H4: T-IMPACT-003: Danno reputazionale
  - H2: 4. Analisi della supply chain di ClawHub
  - H3: 4.1 Controlli di sicurezza correnti
  - H3: 4.2 Pattern di flag di moderazione
  - H3: 4.3 Miglioramenti pianificati
  - H2: 5. Matrice del rischio
  - H3: 5.1 Probabilità vs impatto
  - H3: 5.2 Catene di attacco del percorso critico
  - H2: 6. Riepilogo delle raccomandazioni
  - H3: 6.1 Immediato (P0)
  - H3: 6.2 A breve termine (P1)
  - H3: 6.3 A medio termine (P2)
  - H2: 7. Appendici
  - H3: 7.1 Mappatura delle tecniche ATLAS
  - H3: 7.2 File di sicurezza chiave
  - H3: 7.3 Glossario
  - H2: Correlati

## security/formal-verification.md

- Percorso: /security/formal-verification
- Intestazioni:
  - H2: Dove risiedono i modelli
  - H2: Avvertenze importanti
  - H2: Riprodurre i risultati
  - H3: Esposizione del Gateway e configurazione errata di un gateway aperto
  - H3: Pipeline exec di Node (capacità a rischio più elevato)
  - H3: Archivio di pairing (gate DM)
  - H3: Gate di ingresso (menzioni + bypass dei comandi di controllo)
  - H3: Isolamento di routing/chiave di sessione
  - H2: v1++: modelli delimitati aggiuntivi (concorrenza, tentativi, correttezza delle trace)
  - H3: Concorrenza / idempotenza dell’archivio di pairing
  - H3: Correlazione trace di ingresso / idempotenza
  - H3: Precedenza dmScope di routing + identityLinks
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
  - H3: Modalità local loopback del Gateway
  - H2: Requisiti del proxy
  - H2: Destinazioni bloccate consigliate
  - H2: Convalida
  - H2: Attendibilità CA del proxy
  - H2: Limiti

## specs/claw-supervisor.md

- Percorso: /specs/claw-supervisor
- Intestazioni:
  - H1: Claw Supervisor
  - H2: Obiettivo
  - H2: Modello di prodotto
  - H2: Architettura
  - H2: Contratto Codex App-Server
  - H2: Registro delle sessioni
  - H2: Superficie MCP per Codex
  - H2: Superficie di controllo Claw
  - H2: Flusso di avvio
  - H2: Deployment
  - H2: Sicurezza
  - H2: Piano di implementazione
  - H2: Test di accettazione
  - H2: Questioni aperte

## start/bootstrapping.md

- Percorso: /start/bootstrapping
- Intestazioni:
  - H2: Cosa fa il bootstrapping
  - H2: Saltare il bootstrapping
  - H2: Dove viene eseguito
  - H2: Documentazione correlata

## start/docs-directory.md

- Percorso: /start/docs-directory
- Intestazioni:
  - H2: Inizia da qui
  - H2: Provider e UX
  - H2: App companion
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
  - H2: Inizia da qui
  - H2: Installazione + aggiornamenti
  - H2: Concetti fondamentali
  - H2: Provider + ingresso
  - H2: Gateway + operazioni
  - H2: Strumenti + automazione
  - H2: Nodi, media, voce
  - H2: Piattaforme
  - H2: App companion macOS (avanzata)
  - H2: Plugin
  - H2: Workspace + template
  - H2: Progetto
  - H2: Test + rilascio
  - H2: Correlati

## start/lore.md

- Percorso: /start/lore
- Intestazioni:
  - H1: La lore di OpenClaw 🦞📖
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
  - H2: Il credo dell’aragosta
  - H3: La saga della generazione dell’icona (27 gen 2026)
  - H2: Il futuro
  - H2: Correlati

## start/onboarding-overview.md

- Percorso: /start/onboarding-overview
- Intestazioni:
  - H2: Quale percorso dovrei usare?
  - H2: Cosa configura l’onboarding
  - H2: Onboarding CLI
  - H2: Onboarding dell’app macOS
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
  - H2: Configurazione con due telefoni (consigliata)
  - H2: Avvio rapido in 5 minuti
  - H2: Dare all’agente un workspace (AGENTS)
  - H2: La configurazione che lo trasforma in “un assistente”
  - H2: Sessioni e memoria
  - H2: Heartbeat (modalità proattiva)
  - H2: Media in ingresso e in uscita
  - H2: Checklist operativa
  - H2: Passi successivi
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
  - H2: Eseguire il Gateway da questo repo
  - H2: Workflow stabile (prima l’app macOS)
  - H2: Workflow bleeding edge (Gateway in un terminale)
  - H3: 0) (Facoltativo) Eseguire anche l’app macOS da sorgente
  - H3: 1) Avviare il Gateway di sviluppo
  - H3: 2) Puntare l’app macOS al Gateway in esecuzione
  - H3: 3) Verificare
  - H3: Errori comuni
  - H2: Mappa dell’archiviazione delle credenziali
  - H2: Aggiornamento (senza compromettere la configurazione)
  - H2: Linux (servizio utente systemd)
  - H2: Documentazione correlata

## start/showcase.md

- Percorso: /start/showcase
- Intestazioni:
  - H2: Appena arrivato da Discord
  - H2: Automazione e workflow
  - H2: Conoscenza e memoria
  - H2: Voce e telefono
  - H2: Infrastruttura e deployment
  - H2: Casa e hardware
  - H2: Progetti della community
  - H2: Invia il tuo progetto
  - H2: Correlati

## start/wizard-cli-automation.md

- Percorso: /start/wizard-cli-automation
- Intestazioni:
  - H2: Esempio non interattivo di base
  - H2: Esempi specifici per provider
  - H2: Aggiungere un altro agente
  - H2: Documentazione correlata

## start/wizard-cli-reference.md

- Percorso: /start/wizard-cli-reference
- Intestazioni:
  - H2: Cosa fa la procedura guidata
  - H2: Dettagli del flusso locale
  - H2: Dettagli della modalità remota
  - H2: Opzioni di autenticazione e modello
  - H2: Output e dettagli interni
  - H2: Documentazione correlata

## start/wizard.md

- Percorso: /start/wizard
- Intestazioni:
  - H2: Locale
  - H2: QuickStart vs Avanzata
  - H2: Cosa configura l’onboarding
  - H2: Aggiungere un altro agente
  - H2: Riferimento completo
  - H2: Documentazione correlata

## tools/acp-agents-setup.md

- Percorso: /tools/acp-agents-setup
- Intestazioni:
  - H2: supporto harness acpx (attuale)
  - H2: Configurazione richiesta
  - H2: Configurazione del Plugin per il backend acpx
  - H3: Configurazione del comando e della versione di acpx
  - H3: Installazione automatica delle dipendenze
  - H3: bridge MCP degli strumenti del Plugin
  - H3: bridge MCP degli strumenti OpenClaw
  - H3: Configurazione del timeout delle operazioni di runtime
  - H3: Configurazione dell'agente di health probe
  - H2: Configurazione delle autorizzazioni
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Configurazione
  - H2: Correlati

## tools/acp-agents.md

- Percorso: /tools/acp-agents
- Intestazioni:
  - H2: Quale pagina mi serve?
  - H2: Funziona immediatamente?
  - H2: Target harness supportati
  - H2: Runbook dell'operatore
  - H2: ACP rispetto ai sub-agent
  - H2: Come ACP esegue Claude Code
  - H2: Sessioni associate
  - H3: Modello mentale
  - H3: Associazioni della conversazione corrente
  - H2: Associazioni persistenti dei canali
  - H3: Modello di associazione
  - H3: Valori predefiniti di runtime per agente
  - H3: Esempio
  - H3: Comportamento
  - H2: Avviare sessioni ACP
  - H3: parametri sessionsspawn
  - H2: Modalità di associazione spawn e thread
  - H2: Modello di consegna
  - H2: Compatibilità sandbox
  - H2: Risoluzione del target della sessione
  - H2: Controlli ACP
  - H3: Mappatura delle opzioni di runtime
  - H2: harness acpx, configurazione del Plugin e autorizzazioni
  - H2: Risoluzione dei problemi
  - H2: Correlati

## tools/agent-send.md

- Percorso: /tools/agent-send
- Intestazioni:
  - H2: Avvio rapido
  - H2: Flag
  - H2: Comportamento
  - H2: Esempi
  - H2: Correlati

## tools/apply-patch.md

- Percorso: /tools/apply-patch
- Intestazioni:
  - H2: Parametri
  - H2: Note
  - H2: Esempio
  - H2: Correlati

## tools/brave-search.md

- Percorso: /tools/brave-search
- Intestazioni:
  - H2: Ottenere una chiave API
  - H2: Esempio di configurazione
  - H2: Parametri dello strumento
  - H2: Note
  - H2: Correlati

## tools/browser-control.md

- Percorso: /tools/browser-control
- Intestazioni:
  - H2: API di controllo (opzionale)
  - H3: contratto di errore /act
  - H3: Requisito Playwright
  - H4: Installazione di Playwright in Docker
  - H2: Come funziona (interno)
  - H2: Riferimento rapido CLI
  - H2: Snapshot e ref
  - H2: Potenziamenti di attesa
  - H2: Workflow di debug
  - H2: Output JSON
  - H2: Stato e opzioni di ambiente
  - H2: Sicurezza e privacy
  - H2: Correlati

## tools/browser-linux-troubleshooting.md

- Percorso: /tools/browser-linux-troubleshooting
- Intestazioni:
  - H2: Problema: "Impossibile avviare Chrome CDP sulla porta 18800"
  - H3: Causa principale
  - H3: Soluzione 1: installare Google Chrome (consigliato)
  - H3: Soluzione 2: usare Snap Chromium con modalità solo collegamento
  - H3: Verificare che il browser funzioni
  - H3: Riferimento di configurazione
  - H3: Problema: "Nessuna scheda Chrome trovata per profile=\"user\""
  - H2: Correlati

## tools/browser-login.md

- Percorso: /tools/browser-login
- Intestazioni:
  - H2: Accesso manuale (consigliato)
  - H2: Quale profilo Chrome viene usato?
  - H2: X/Twitter: flusso consigliato
  - H2: Sandboxing + accesso al browser host
  - H2: Correlati

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Percorso: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Intestazioni:
  - H2: Scegliere prima la modalità browser corretta
  - H3: Opzione 1: CDP remoto grezzo da WSL2 a Windows
  - H3: Opzione 2: Chrome MCP locale all'host
  - H2: Architettura funzionante
  - H2: Perché questa configurazione crea confusione
  - H2: Regola critica per la Control UI
  - H2: Convalidare per livelli
  - H3: Livello 1: verificare che Chrome serva CDP su Windows
  - H3: Livello 2: verificare che WSL2 possa raggiungere quell'endpoint Windows
  - H3: Livello 3: configurare il profilo browser corretto
  - H3: Livello 4: verificare separatamente il livello Control UI
  - H3: Livello 5: verificare il controllo browser end-to-end
  - H2: Errori comuni fuorvianti
  - H2: Checklist rapida di triage
  - H2: Conclusione pratica
  - H2: Correlati

## tools/browser.md

- Percorso: /tools/browser
- Intestazioni:
  - H2: Cosa ottieni
  - H2: Avvio rapido
  - H2: Controllo del Plugin
  - H2: Indicazioni per l'agente
  - H2: Comando o strumento browser mancante
  - H2: Profili: openclaw rispetto a user
  - H2: Configurazione
  - H3: Visione screenshot (supporto per modelli solo testo)
  - H2: Usare Brave o un altro browser basato su Chromium
  - H2: Controllo locale rispetto a remoto
  - H2: Proxy browser Node (predefinito senza configurazione)
  - H2: Browserless (CDP remoto ospitato)
  - H3: Docker Browserless sullo stesso host
  - H2: Provider CDP WebSocket diretti
  - H3: Browserbase
  - H3: Notte
  - H2: Sicurezza
  - H2: Profili (multi-browser)
  - H2: Sessione esistente tramite Chrome DevTools MCP
  - H3: Avvio MCP Chrome personalizzato
  - H2: Garanzie di isolamento
  - H2: Selezione del browser
  - H2: API di controllo (opzionale)
  - H2: Risoluzione dei problemi
  - H3: Errore di avvio CDP rispetto a blocco SSRF di navigazione
  - H2: Strumenti agente + come funziona il controllo
  - H2: Correlati

## tools/btw.md

- Percorso: /tools/btw
- Intestazioni:
  - H2: Cosa fa
  - H2: Cosa non fa
  - H2: Come funziona il contesto
  - H2: Modello di consegna
  - H2: Comportamento della superficie
  - H3: TUI
  - H3: Canali esterni
  - H3: Control UI / web
  - H2: Quando usare BTW
  - H2: Quando non usare BTW
  - H2: Correlati

## tools/capability-cookbook.md

- Percorso: /tools/capability-cookbook
- Intestazioni:
  - H2: Correlati

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
  - H2: Correlati

## tools/creating-skills.md

- Percorso: /tools/creating-skills
- Intestazioni:
  - H2: Crea la tua prima skill
  - H2: Riferimento SKILL.md
  - H3: Campi obbligatori
  - H3: Chiavi frontmatter opzionali
  - H3: Uso di {baseDir}
  - H2: Aggiunta dell'attivazione condizionale
  - H2: Proporre tramite Skill Workshop
  - H2: Pubblicazione su ClawHub
  - H2: Best practice
  - H2: Correlati

## tools/diffs.md

- Percorso: /tools/diffs
- Intestazioni:
  - H2: Avvio rapido
  - H2: Disattivare le indicazioni di sistema integrate
  - H2: Workflow tipico dell'agente
  - H2: Esempi di input
  - H2: Riferimento input dello strumento
  - H2: Evidenziazione della sintassi
  - H2: Contratto dei dettagli di output
  - H2: Sezioni invariate compresse
  - H2: Valori predefiniti del Plugin
  - H3: Configurazione URL viewer persistente
  - H2: Configurazione di sicurezza
  - H2: Ciclo di vita e archiviazione degli artefatti
  - H2: URL viewer e comportamento di rete
  - H2: Modello di sicurezza
  - H2: Requisiti del browser per la modalità file
  - H2: Risoluzione dei problemi
  - H2: Indicazioni operative
  - H2: Correlati

## tools/duckduckgo-search.md

- Percorso: /tools/duckduckgo-search
- Intestazioni:
  - H2: Configurazione
  - H2: Config
  - H2: Parametri dello strumento
  - H2: Note
  - H2: Correlati

## tools/elevated.md

- Percorso: /tools/elevated
- Intestazioni:
  - H2: Direttive
  - H2: Come funziona
  - H2: Ordine di risoluzione
  - H2: Disponibilità e allowlist
  - H2: Cosa non controlla elevated
  - H2: Correlati

## tools/exa-search.md

- Percorso: /tools/exa-search
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Ottenere una chiave API
  - H2: Config
  - H2: Override dell'URL di base
  - H2: Parametri dello strumento
  - H3: Estrazione dei contenuti
  - H3: Modalità di ricerca
  - H2: Note
  - H2: Correlati

## tools/exec-approvals-advanced.md

- Percorso: /tools/exec-approvals-advanced
- Intestazioni:
  - H2: Binari sicuri (solo stdin)
  - H3: Validazione argv e flag negati
  - H3: Directory binarie attendibili
  - H3: Concatenazione shell, wrapper e multiplexer
  - H3: Binari sicuri rispetto ad allowlist
  - H2: Comandi interprete/runtime
  - H3: Comportamento di consegna follow-up
  - H2: Inoltro approvazioni ai canali chat
  - H3: Inoltro approvazioni del Plugin
  - H3: Approvazioni nella stessa chat su qualsiasi canale
  - H3: Consegna approvazioni nativa
  - H3: Flusso IPC macOS
  - H2: FAQ
  - H3: Quando verrebbero usati accountId e threadId su un target di approvazione?
  - H3: Quando le approvazioni vengono inviate a una sessione, chiunque in quella sessione può approvarle?
  - H2: Correlati

## tools/exec-approvals.md

- Percorso: /tools/exec-approvals
- Intestazioni:
  - H2: Ispezionare la policy effettiva
  - H2: Dove si applica
  - H3: Modello di attendibilità
  - H3: Separazione macOS
  - H2: Impostazioni e archiviazione
  - H2: Opzioni della policy
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Modalità YOLO (senza approvazione)
  - H3: Configurazione persistente gateway-host "non chiedere mai"
  - H3: Scorciatoia locale
  - H3: Host Node
  - H3: Scorciatoia solo sessione
  - H2: Allowlist (per agente)
  - H3: Limitare gli argomenti con argPattern
  - H2: Auto-consentire le CLI delle skill
  - H2: Binari sicuri e inoltro approvazioni
  - H2: Modifica Control UI
  - H2: Flusso di approvazione
  - H2: Eventi di sistema
  - H2: Comportamento approvazione negata
  - H2: Implicazioni
  - H2: Correlati

## tools/exec.md

- Percorso: /tools/exec
- Intestazioni:
  - H2: Parametri
  - H2: Config
  - H3: Gestione PATH
  - H2: Override di sessione (/exec)
  - H2: Modello di autorizzazione
  - H2: Approvazioni exec (app complementare / host Node)
  - H2: Allowlist + binari sicuri
  - H2: Esempi
  - H2: applypatch
  - H2: Correlati

## tools/firecrawl.md

- Percorso: /tools/firecrawl
- Intestazioni:
  - H2: Installare il Plugin
  - H2: webfetch senza chiave e chiavi API
  - H2: Configurare la ricerca Firecrawl
  - H2: Configurare il fallback webfetch Firecrawl
  - H3: Firecrawl self-hosted
  - H2: Strumenti del Plugin Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Elusione stealth / bot
  - H2: Come webfetch usa Firecrawl
  - H2: Correlati

## tools/gemini-search.md

- Percorso: /tools/gemini-search
- Intestazioni:
  - H2: Ottenere una chiave API
  - H2: Config
  - H2: Come funziona
  - H2: Parametri supportati
  - H2: Selezione del modello
  - H2: Override dell'URL di base
  - H2: Correlati

## tools/goal.md

- Percorso: /tools/goal
- Intestazioni:
  - H1: Obiettivo
  - H2: Avvio rapido
  - H2: A cosa servono gli obiettivi
  - H2: Riferimento comandi
  - H2: Stati
  - H2: Budget di token
  - H2: Strumenti modello
  - H2: TUI
  - H2: Comportamento del canale
  - H2: Risoluzione dei problemi
  - H2: Correlati

## tools/grok-search.md

- Percorso: /tools/grok-search
- Intestazioni:
  - H2: Onboarding e configurazione
  - H2: Accedere o ottenere una chiave API
  - H2: Config
  - H2: Come funziona
  - H2: Parametri supportati
  - H2: Override dell'URL di base
  - H2: Correlati

## tools/image-generation.md

- Percorso: /tools/image-generation
- Intestazioni:
  - H2: Avvio rapido
  - H2: Route comuni
  - H2: Provider supportati
  - H2: Capacità dei provider
  - H2: Parametri dello strumento
  - H2: Configurazione
  - H3: Selezione del modello
  - H3: Ordine di selezione del provider
  - H3: Modifica delle immagini
  - H2: Approfondimenti sui provider
  - H2: Esempi
  - H2: Correlati

## tools/index.md

- Percorso: /tools
- Intestazioni:
  - H2: Inizia da qui
  - H2: Scegliere strumenti, skills o plugin
  - H2: Categorie di strumenti integrate
  - H2: Strumenti forniti dai Plugin
  - H2: Configurare accesso e approvazioni
  - H2: Estendere le capacità
  - H2: Risolvere i problemi degli strumenti mancanti
  - H2: Correlati

## tools/kimi-search.md

- Percorso: /tools/kimi-search
- Intestazioni:
  - H2: Ottenere una chiave API
  - H2: Config
  - H2: Come funziona
  - H2: Parametri supportati
  - H2: Correlati

## tools/llm-task.md

- Percorso: /tools/llm-task
- Intestazioni:
  - H2: Abilitare il Plugin
  - H2: Config (opzionale)
  - H2: Parametri dello strumento
  - H2: Output
  - H2: Esempio: passaggio del workflow Lobster
  - H3: Limitazione importante
  - H2: Note di sicurezza
  - H2: Correlati

## tools/lobster.md

- Percorso: /tools/lobster
- Intestazioni:
  - H2: Hook
  - H2: Perché
  - H2: Perché un DSL invece di programmi semplici?
  - H2: Come funziona
  - H2: Pattern: piccola CLI + pipe JSON + approvazioni
  - H2: Passaggi LLM solo JSON (llm-task)
  - H3: Limitazione importante: Lobster incorporato rispetto a openclaw.invoke
  - H2: File di workflow (.lobster)
  - H2: Installare Lobster
  - H2: Abilitare lo strumento
  - H2: Esempio: triage delle email
  - H2: Parametri dello strumento
  - H3: run
  - H3: resume
  - H3: Input opzionali
  - H2: Envelope di output
  - H2: Approvazioni
  - H2: OpenProse
  - H2: Sicurezza
  - H2: Risoluzione dei problemi
  - H2: Scopri di più
  - H2: Caso di studio: workflow della community
  - H2: Correlati

## tools/loop-detection.md

- Percorso: /tools/loop-detection
- Intestazioni:
  - H2: Perché esiste
  - H2: Blocco di configurazione
  - H3: Comportamento dei campi
  - H2: Configurazione consigliata
  - H2: Protezione post-Compaction
  - H2: Log e comportamento previsto
  - H2: Correlati

## tools/media-overview.md

- Percorso: /tools/media-overview
- Intestazioni:
  - H2: Funzionalità
  - H2: Matrice delle funzionalità dei provider
  - H2: Asincrono vs sincrono
  - H2: Speech-to-text e Voice Call
  - H2: Mappature dei provider (come i vendor si dividono tra le superfici)
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
  - H2: Configurazione iniziale
  - H2: Configurazione
  - H2: Note
  - H2: Correlati

## tools/parallel-search.md

- Percorso: /tools/parallel-search
- Intestazioni:
  - H2: Installare il plugin
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
  - H2: Default consigliato
  - H2: Modalità exec host OpenClaw
  - H2: Mappatura Codex Guardian
  - H2: Autorizzazioni harness ACPX
  - H2: Scegliere una modalità
  - H2: Correlati

## tools/perplexity-search.md

- Percorso: /tools/perplexity-search
- Intestazioni:
  - H2: Installare il plugin
  - H2: Ottenere una chiave API Perplexity
  - H2: Compatibilità OpenRouter
  - H2: Esempi di configurazione
  - H3: API di ricerca Perplexity nativa
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
  - H3: Scegliere un'origine di installazione
  - H3: Policy di installazione dell'operatore
  - H3: Configurare la policy dei plugin
  - H2: Comprendere i formati dei plugin
  - H2: Hook dei plugin
  - H2: Verificare il Gateway attivo
  - H2: Risoluzione dei problemi
  - H3: Proprietà del percorso del plugin bloccata
  - H3: Configurazione lenta degli strumenti del plugin
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
  - H2: Configurazione iniziale
  - H2: Configurazione
  - H2: Variabile d'ambiente
  - H2: Riferimento della configurazione del plugin
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
  - H2: Policy di installazione dell'operatore (security.installPolicy)
  - H2: Allowlist delle skill incluse
  - H2: Voci per skill (skills.entries)
  - H2: Allowlist degli agenti (agents)
  - H2: Workshop (skills.workshop)
  - H2: Root delle skill con symlink
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
  - H3: Specifiche dell'installer
  - H2: Override di configurazione
  - H2: Injection dell'ambiente
  - H2: Snapshot e refresh
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
  - H3: Comandi dei plugin inclusi
  - H3: Comandi delle skill
  - H2: /tools — cosa può usare ora l'agente
  - H2: /model — selezione del modello
  - H2: /config — scritture della configurazione su disco
  - H2: /mcp — configurazione del server MCP
  - H2: /debug — override solo runtime
  - H2: /plugins — gestione dei plugin
  - H2: /trace — output di trace del plugin
  - H2: /btw — domande laterali
  - H2: Note sulle superfici
  - H2: Utilizzo e stato dei provider
  - H2: Correlati

## tools/steer.md

- Percorso: /tools/steer
- Intestazioni:
  - H2: Sessione corrente
  - H2: Steer vs coda
  - H2: Sub-agenti
  - H2: Sessioni ACP
  - H2: Correlati

## tools/subagents.md

- Percorso: /tools/subagents
- Intestazioni:
  - H2: Comando slash
  - H3: Controlli di associazione del thread
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
  - H3: Interruttori di configurazione
  - H3: Allowlist
  - H3: Discovery
  - H3: Archiviazione automatica
  - H2: Sub-agenti annidati
  - H3: Livelli di profondità
  - H3: Catena di annunci
  - H3: Policy degli strumenti per profondità
  - H3: Limite di spawn per agente
  - H3: Arresto a cascata
  - H2: Autenticazione
  - H2: Annuncio
  - H3: Contesto dell'annuncio
  - H3: Riga delle statistiche
  - H3: Perché preferire sessionshistory
  - H2: Policy degli strumenti
  - H3: Override tramite configurazione
  - H2: Concorrenza
  - H2: Vitalità e ripristino
  - H2: Arresto
  - H2: Limitazioni
  - H2: Correlati

## tools/tavily.md

- Percorso: /tools/tavily
- Intestazioni:
  - H2: Primi passi
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
  - H2: Impostare un default di sessione
  - H2: Applicazione per agente
  - H2: Modalità veloce (/fast)
  - H2: Direttive dettagliate (/verbose o /v)
  - H2: Direttive di trace del plugin (/trace)
  - H2: Visibilità del ragionamento (/reasoning)
  - H2: Correlati
  - H2: Heartbeat
  - H2: UI web chat
  - H2: Profili provider

## tools/tokenjuice.md

- Percorso: /tools/tokenjuice
- Intestazioni:
  - H2: Abilitare il plugin
  - H2: Cosa modifica tokenjuice
  - H2: Verificare che funzioni
  - H2: Disabilitare il plugin
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
  - H3: Persona completa (prompt neutrale rispetto al provider)
  - H3: Risoluzione della persona
  - H3: Come i provider usano i prompt persona
  - H3: Policy di fallback
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
  - H2: Profili degli strumenti
  - H2: Correlati

## tools/web.md

- Percorso: /tools/web
- Intestazioni:
  - H2: Avvio rapido
  - H2: Scegliere un provider
  - H3: Confronto dei provider
  - H2: Rilevamento automatico
  - H2: Ricerca web nativa OpenAI
  - H2: Ricerca web nativa Codex
  - H2: Sicurezza della rete
  - H2: Configurare la ricerca web
  - H2: Configurazione
  - H3: Archiviazione delle chiavi API
  - H2: Parametri dello strumento
  - H2: xsearch
  - H3: Configurazione xsearch
  - H3: Parametri xsearch
  - H3: Esempio xsearch
  - H2: Esempi
  - H2: Profili degli strumenti
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
  - H2: Rafforzare prima l'accesso amministratore
  - H2: Agente aziendale condiviso su una VPS
  - H2: Uso dei nodi con una VPS
  - H2: Ottimizzazione dell'avvio per VM piccole e host ARM
  - H3: Checklist di ottimizzazione systemd (opzionale)
  - H2: Correlati

## web/control-ui.md

- Percorso: /web/control-ui
- Intestazioni:
  - H2: Apertura rapida (locale)
  - H2: Associazione del dispositivo (prima connessione)
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
  - H2: Autenticazione della route dei media dell'assistente
  - H2: Creazione della UI
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
  - H2: RPC HTTP amministrativa
  - H2: Configurazione (attiva per default)
  - H2: Accesso Tailscale
  - H3: Integrated Serve (consigliato)
  - H3: Bind Tailnet + token
  - H3: Internet pubblico (Funnel)
  - H2: Note di sicurezza
  - H2: Creazione della UI

## web/tui.md

- Percorso: /web/tui
- Intestazioni:
  - H2: Avvio rapido
  - H3: Modalità Gateway
  - H3: Modalità locale
  - H2: Cosa vedi
  - H2: Modello mentale: agenti + sessioni
  - H2: Invio + consegna
  - H2: Selettori + overlay
  - H2: Scorciatoie da tastiera
  - H2: Comandi slash
  - H2: Comandi shell locali
  - H2: Riparare configurazioni dal TUI locale
  - H2: Output degli strumenti
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
  - H3: Modello di trascrizione e consegna
  - H2: Pannello strumenti agenti Control UI
  - H2: Uso remoto
  - H2: Riferimento di configurazione (WebChat)
  - H2: Correlati
