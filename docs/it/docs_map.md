---
read_when: Finding which docs page covers a topic before reading the page
summary: Mappa delle intestazioni generata per le pagine della documentazione di OpenClaw
title: Mappa della documentazione
x-i18n:
    generated_at: "2026-07-04T15:21:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e180b7c652be24b73af51fecc5cf9a566184c1eff65ca0acdc0133bbc49c332
    source_path: docs_map.md
    workflow: 16
---

# Mappa della documentazione OpenClaw

Questo file è generato dalle intestazioni di `docs/**/*.md` e `docs/**/*.mdx` per aiutare gli agenti a navigare nell’albero della documentazione.
Non modificarlo a mano; esegui `pnpm docs:map:gen`.

## agent-runtime-architecture.md

- Route: /agent-runtime-architecture
- Headings:
  - H2: Layout del runtime
  - H2: Confini
  - H2: Manifest
  - H2: Selezione del runtime
  - H2: Correlati

## announcements/bluebubbles-imessage.md

- Route: /announcements/bluebubbles-imessage
- Headings:
  - H1: Rimozione di BlueBubbles e percorso iMessage con imsg
  - H2: Cosa è cambiato
  - H2: Cosa fare
  - H2: Note di migrazione
  - H2: Vedi anche

## auth-credential-semantics.md

- Route: /auth-credential-semantics
- Headings:
  - H2: Codici motivo stabili per le probe
  - H2: Credenziali token
  - H3: Regole di idoneità
  - H3: Regole di risoluzione
  - H2: Portabilità della copia dell’agente
  - H2: Route di autenticazione solo da configurazione
  - H2: Filtro esplicito dell’ordine di autenticazione
  - H2: Risoluzione del target della probe
  - H2: Rilevamento delle credenziali CLI esterne
  - H2: Protezione delle policy OAuth SecretRef
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
  - H2: Consegna e output
  - H2: Lingua dell’output
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
  - H3: Sequenza di comandi
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
  - H2: Scegli la superficie corretta
  - H2: Avvio rapido
  - H2: Tipi di evento
  - H2: Scrivere hook
  - H3: Struttura degli hook
  - H3: Formato HOOK.md
  - H3: Implementazione dell’handler
  - H3: Elementi principali del contesto evento
  - H2: Rilevamento degli hook
  - H3: Pacchetti di hook
  - H2: Hook inclusi
  - H3: dettagli di session-memory
  - H3: configurazione bootstrap-extra-files
  - H3: dettagli di command-logger
  - H3: dettagli di compaction-notifier
  - H3: dettagli di boot-md
  - H2: Hook dei Plugin
  - H2: Configurazione
  - H2: Riferimento CLI
  - H2: Buone pratiche
  - H2: Risoluzione dei problemi
  - H3: Hook non rilevato
  - H3: Hook non idoneo
  - H3: Hook non in esecuzione
  - H2: Correlati

## automation/index.md

- Route: /automation
- Headings:
  - H2: Guida rapida alla scelta
  - H3: Attività pianificate (Cron) vs Heartbeat
  - H2: Concetti fondamentali
  - H3: Attività pianificate (Cron)
  - H3: Attività
  - H3: Impegni dedotti
  - H3: Flusso attività
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
  - H2: Anatomia di un’istruzione permanente
  - H2: Istruzioni permanenti più job Cron
  - H2: Esempi
  - H3: Esempio 1: contenuti e social media (ciclo settimanale)
  - H3: Esempio 2: operazioni finanziarie (attivate da evento)
  - H3: Esempio 3: monitoraggio e avvisi (continuo)
  - H2: Schema esegui-verifica-segnala
  - H2: Architettura multiprogramma
  - H2: Buone pratiche
  - H3: Da fare
  - H3: Da evitare
  - H2: Correlati

## automation/taskflow.md

- Route: /automation/taskflow
- Headings:
  - H2: Quando usare Task Flow
  - H2: Schema di workflow pianificato affidabile
  - H2: Modalità di sincronizzazione
  - H3: Modalità gestita
  - H3: Modalità rispecchiata
  - H2: Stato durevole e tracciamento delle revisioni
  - H2: Comportamento di annullamento
  - H2: Comandi CLI
  - H2: Relazione tra flussi e attività
  - H2: Correlati

## automation/tasks.md

- Route: /automation/tasks
- Headings:
  - H2: TL;DR
  - H2: Avvio rapido
  - H2: Cosa crea un’attività
  - H2: Ciclo di vita dell’attività
  - H2: Consegna e notifiche
  - H3: Policy di notifica
  - H2: Riferimento CLI
  - H2: Bacheca attività in chat (/tasks)
  - H2: Integrazione dello stato (pressione delle attività)
  - H2: Archiviazione e manutenzione
  - H3: Dove vivono le attività
  - H3: Manutenzione automatica
  - H2: Relazione tra attività e altri sistemi
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
  - H2: Percorsi di canali di messaggistica supportati
  - H2: Diagnostica dei Plugin
  - H2: Pubblici dei canali Discord
  - H2: Note di sicurezza
  - H2: Risoluzione dei problemi

## channels/ambient-room-events.md

- Route: /channels/ambient-room-events
- Headings:
  - H2: Configurazione consigliata
  - H2: Cosa cambia
  - H2: Esempio Discord
  - H2: Esempio Slack
  - H2: Esempio Telegram
  - H2: Policy specifica dell’agente
  - H2: Modalità di risposta visibili
  - H2: Cronologia
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/bot-loop-protection.md

- Route: /channels/bot-loop-protection
- Headings:
  - H1: Protezione dai loop dei bot
  - H2: Valori predefiniti
  - H2: Configurare i valori predefiniti condivisi
  - H2: Override per canale o account
  - H2: Supporto dei canali

## channels/broadcast-groups.md

- Route: /channels/broadcast-groups
- Headings:
  - H2: Panoramica
  - H2: Casi d’uso
  - H2: Configurazione
  - H3: Configurazione di base
  - H3: Strategia di elaborazione
  - H3: Esempio completo
  - H2: Come funziona
  - H3: Flusso dei messaggi
  - H3: Isolamento delle sessioni
  - H3: Esempio: sessioni isolate
  - H2: Buone pratiche
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
  - H1: Canali &amp; routing
  - H2: Termini chiave
  - H2: Prefissi dei target in uscita
  - H2: Forme delle chiavi di sessione (esempi)
  - H2: Fissaggio della route DM principale
  - H2: Registrazione in ingresso protetta
  - H2: Regole di routing (come viene scelto un agente)
  - H2: Gruppi broadcast (eseguire più agenti)
  - H2: Panoramica della configurazione
  - H2: Archiviazione delle sessioni
  - H2: Comportamento di WebChat
  - H2: Contesto di risposta
  - H2: Correlati

## channels/clickclack.md

- Route: /channels/clickclack
- Headings:
  - H2: Configurazione rapida
  - H2: Più bot
  - H2: Target
  - H2: Permessi
  - H2: Risoluzione dei problemi

## channels/discord.md

- Route: /channels/discord
- Headings:
  - H2: Configurazione rapida
  - H2: Consigliato: configura uno spazio di lavoro guild
  - H2: Modello di runtime
  - H2: Canali forum
  - H2: Componenti interattivi
  - H2: Controllo accessi e routing
  - H3: Routing dell’agente basato sui ruoli
  - H2: Comandi nativi e autorizzazione dei comandi
  - H2: Dettagli delle funzionalità
  - H2: Strumenti e gate delle azioni
  - H2: UI Components v2
  - H2: Voce
  - H3: Canali vocali
  - H3: Seguire gli utenti in voce
  - H3: Messaggi vocali
  - H2: Risoluzione dei problemi
  - H2: Riferimento di configurazione
  - H2: Sicurezza e operazioni
  - H2: Correlati

## channels/feishu.md

- Route: /channels/feishu
- Headings:
  - H2: Avvio rapido
  - H2: Controllo accessi
  - H3: Messaggi diretti
  - H3: Chat di gruppo
  - H2: Esempi di configurazione dei gruppi
  - H3: Consenti tutti i gruppi, nessuna @mention richiesta
  - H3: Consenti tutti i gruppi, richiedi comunque @mention
  - H3: Consenti solo gruppi specifici
  - H3: Limita i mittenti all’interno di un gruppo
  - H2: Ottieni ID di gruppi/utenti
  - H3: ID gruppo (chatid, formato: ocxxx)
  - H3: ID utente (openid, formato: ouxxx)
  - H2: Comandi comuni
  - H2: Risoluzione dei problemi
  - H3: Il bot non risponde nelle chat di gruppo
  - H3: Il bot non riceve messaggi
  - H3: La configurazione QR non reagisce nell’app mobile Feishu
  - H3: App Secret trapelato
  - H2: Configurazione avanzata
  - H3: Account multipli
  - H3: Limiti dei messaggi
  - H3: Streaming
  - H3: Ottimizzazione della quota
  - H3: Sessioni ACP
  - H4: Binding ACP persistente
  - H4: Generare ACP dalla chat
  - H3: Routing multi-agente
  - H2: Isolamento agente per utente (creazione dinamica di agenti)
  - H3: Configurazione rapida
  - H3: Come funziona
  - H3: Opzioni di configurazione
  - H3: Ambito della sessione
  - H3: Distribuzione multiutente tipica
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
  - H2: Aggiungi a Google Chat
  - H2: URL pubblico (solo Webhook)
  - H3: Opzione A: Tailscale Funnel (consigliata)
  - H3: Opzione B: Reverse Proxy (Caddy)
  - H3: Opzione C: Cloudflare Tunnel
  - H2: Come funziona
  - H2: Target
  - H2: Elementi principali della configurazione
  - H2: Risoluzione dei problemi
  - H3: 405 Method Not Allowed
  - H3: Altri problemi
  - H2: Correlati

## channels/group-messages.md

- Route: /channels/group-messages
- Headings:
  - H2: Comportamento
  - H2: Esempio di configurazione (WhatsApp)
  - H3: Comando di attivazione (solo owner)
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
  - H2: Schema: DM personali + gruppi pubblici (agente singolo)
  - H2: Etichette visualizzate
  - H2: Policy di gruppo
  - H2: Gate sulle menzioni (predefinito)
  - H2: Definire l’ambito dei pattern di menzione configurati
  - H2: Restrizioni degli strumenti per gruppi/canali (opzionale)
  - H2: Allowlist dei gruppi
  - H2: Attivazione (solo owner)
  - H2: Campi del contesto
  - H2: Specificità di iMessage
  - H2: Prompt di sistema WhatsApp
  - H2: Specificità di WhatsApp
  - H2: Correlati

## channels/imessage-from-bluebubbles.md

- Route: /channels/imessage-from-bluebubbles
- Headings:
  - H2: Checklist di migrazione
  - H2: Quando questa migrazione ha senso
  - H2: Cosa fa imsg
  - H2: Prima di iniziare
  - H2: Traduzione della configurazione
  - H2: Insidia del registro gruppi
  - H2: Passo dopo passo
  - H2: Parità delle azioni a colpo d’occhio
  - H2: Abbinamento, sessioni e binding ACP
  - H2: Nessun canale di rollback
  - H2: Correlati

## channels/imessage.md

- Route: /channels/imessage
- Headings:
  - H2: Configurazione rapida
  - H2: Requisiti e permessi (macOS)
  - H2: Abilitazione dell’API privata imsg
  - H3: Configurazione
  - H3: Quando non puoi disabilitare SIP
  - H2: Controllo accessi e routing
  - H2: Binding delle conversazioni ACP
  - H2: Pattern di distribuzione
  - H2: Media, suddivisione in chunk e target di consegna
  - H2: Azioni dell’API privata
  - H2: Scritture della configurazione
  - H2: Coalescenza di DM con invii separati (comando + URL in una composizione)
  - H3: Scenari e cosa vede l’agente
  - H2: Recupero in ingresso dopo il riavvio di un bridge o Gateway
  - H3: Segnale visibile all’operatore
  - H3: Migrazione
  - H2: Risoluzione dei problemi
  - H2: Puntatori al riferimento di configurazione
  - H2: Correlati

## channels/index.md

- Route: /channels
- Headings:
  - H2: Note di consegna
  - H2: Canali supportati
  - H2: Note

## channels/irc.md

- Route: /channels/irc
- Headings:
  - H2: Avvio rapido
  - H2: Valori predefiniti di sicurezza
  - H2: Controllo accessi
  - H3: Problema comune: allowFrom è per i DM, non per i canali
  - H2: Attivazione delle risposte (menzioni)
  - H2: Nota di sicurezza (consigliata per canali pubblici)
  - H3: Stessi strumenti per tutti nel canale
  - H3: Strumenti diversi per mittente (l’owner ha più potere)
  - H2: NickServ
  - H2: Variabili d’ambiente
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/line.md

- Percorso: /channels/line
- Intestazioni:
  - H2: Installa
  - H2: Configurazione
  - H2: Configura
  - H2: Controllo degli accessi
  - H2: Comportamento dei messaggi
  - H2: Dati del canale (messaggi ricchi)
  - H2: Supporto ACP
  - H2: Media in uscita
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/location.md

- Percorso: /channels/location
- Intestazioni:
  - H2: Formattazione del testo
  - H2: Campi di contesto
  - H2: Note sul canale
  - H2: Correlati

## channels/matrix-migration.md

- Percorso: /channels/matrix-migration
- Intestazioni:
  - H2: Cosa fa automaticamente la migrazione
  - H2: Cosa non può fare automaticamente la migrazione
  - H2: Flusso di aggiornamento consigliato
  - H2: Come funziona la migrazione crittografata
  - H2: Messaggi comuni e cosa significano
  - H3: Messaggi di aggiornamento e rilevamento
  - H3: Messaggi di recupero dello stato crittografato
  - H3: Messaggi di recupero manuale
  - H3: Messaggi di installazione di Plugin personalizzati
  - H2: Se la cronologia crittografata continua a non tornare
  - H2: Se vuoi ricominciare da capo per i messaggi futuri
  - H2: Correlati

## channels/matrix-presentation.md

- Percorso: /channels/matrix-presentation
- Intestazioni:
  - H2: Contenuto dell'evento
  - H2: Comportamento di fallback
  - H2: Blocchi supportati
  - H2: Interazioni
  - H2: Relazione con i metadati di approvazione
  - H2: Messaggi multimediali

## channels/matrix-push-rules.md

- Percorso: /channels/matrix-push-rules
- Intestazioni:
  - H2: Prerequisiti
  - H2: Passaggi
  - H2: Note multi-bot
  - H2: Note sull'homeserver
  - H2: Correlati

## channels/matrix.md

- Percorso: /channels/matrix
- Intestazioni:
  - H2: Installa
  - H2: Configurazione
  - H3: Configurazione interattiva
  - H3: Configurazione minima
  - H3: Accesso automatico
  - H3: Formati di destinazione della lista consentita
  - H3: Normalizzazione dell'ID account
  - H3: Credenziali memorizzate nella cache
  - H3: Variabili d'ambiente
  - H2: Esempio di configurazione
  - H2: Anteprime in streaming
  - H2: Messaggi vocali
  - H2: Metadati di approvazione
  - H3: Regole push self-hosted per anteprime finalizzate silenziose
  - H2: Stanze bot-to-bot
  - H2: Crittografia e verifica
  - H3: Abilita crittografia
  - H3: Stato e segnali di fiducia
  - H3: Verifica questo dispositivo con una chiave di recupero
  - H3: Inizializza o ripara il cross-signing
  - H3: Backup delle chiavi della stanza
  - H3: Elencare, richiedere e rispondere alle verifiche
  - H3: Note multi-account
  - H2: Gestione del profilo
  - H2: Thread
  - H3: Instradamento sessione (sessionScope)
  - H3: Risposte in thread (threadReplies)
  - H3: Ereditarietà dei thread e comandi slash
  - H2: Binding delle conversazioni ACP
  - H3: Configurazione del binding dei thread
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
  - H3: Crittografia
  - H3: Accesso e criteri
  - H3: Comportamento delle risposte
  - H3: Impostazioni delle reazioni
  - H3: Strumenti e override per stanza
  - H3: Impostazioni di approvazione exec
  - H2: Correlati

## channels/mattermost.md

- Percorso: /channels/mattermost
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
  - H2: Nuovo tentativo per canale DM
  - H2: Streaming delle anteprime
  - H2: Reazioni (strumento messaggi)
  - H2: Pulsanti interattivi (strumento messaggi)
  - H3: Integrazione API diretta (script esterni)
  - H2: Adattatore directory
  - H2: Multi-account
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/msteams.md

- Percorso: /channels/msteams
- Intestazioni:
  - H2: Plugin incluso
  - H2: Configurazione rapida
  - H2: Obiettivi
  - H2: Scritture di configurazione
  - H2: Controllo degli accessi (DM + gruppi)
  - H3: Come funziona
  - H3: Passaggio 1: Crea Azure Bot
  - H3: Passaggio 2: Ottieni le credenziali
  - H3: Passaggio 3: Configura l'endpoint di messaggistica
  - H3: Passaggio 4: Abilita il canale Teams
  - H3: Passaggio 5: Crea il manifest dell'app Teams
  - H3: Passaggio 6: Configura OpenClaw
  - H3: Passaggio 7: Esegui il Gateway
  - H2: Autenticazione federata (certificato più identità gestita)
  - H3: Opzione A: Autenticazione basata su certificato
  - H3: Opzione B: Azure Managed Identity
  - H3: Configurazione di AKS Workload Identity
  - H3: Confronto dei tipi di autenticazione
  - H2: Sviluppo locale (tunneling)
  - H2: Test del Bot
  - H2: Variabili d'ambiente
  - H2: Azione informazioni membro
  - H2: Contesto della cronologia
  - H2: Autorizzazioni RSC Teams correnti (manifest)
  - H2: Manifest Teams di esempio (redatto)
  - H3: Avvertenze sul manifest (campi obbligatori)
  - H3: Aggiornamento di un'app esistente
  - H2: Funzionalità: solo RSC vs Graph
  - H3: Solo con Teams RSC (app installata, nessuna autorizzazione Graph API)
  - H3: Con Teams RSC + autorizzazioni applicazione Microsoft Graph
  - H3: RSC vs Graph API
  - H2: Media + cronologia abilitati da Graph (obbligatorio per i canali)
  - H2: Limitazioni note
  - H3: Timeout dei Webhook
  - H3: Supporto per cloud Teams e URL del servizio
  - H3: Formattazione
  - H2: Configurazione
  - H2: Instradamento e sessioni
  - H2: Stile di risposta: thread vs post
  - H3: Precedenza di risoluzione
  - H3: Conservazione del contesto del thread
  - H2: Allegati e immagini
  - H2: Invio di file nelle chat di gruppo
  - H3: Perché le chat di gruppo richiedono SharePoint
  - H3: Configurazione
  - H3: Comportamento di condivisione
  - H3: Comportamento di fallback
  - H3: Posizione di archiviazione dei file
  - H2: Sondaggi (Adaptive Cards)
  - H2: Schede di presentazione
  - H2: Formati di destinazione
  - H2: Messaggistica proattiva
  - H2: ID di team e canale (problema comune)
  - H2: Canali privati
  - H2: Risoluzione dei problemi
  - H3: Problemi comuni
  - H3: Errori di caricamento del manifest
  - H3: Autorizzazioni RSC non funzionanti
  - H2: Riferimenti
  - H2: Correlati

## channels/nextcloud-talk.md

- Percorso: /channels/nextcloud-talk
- Intestazioni:
  - H2: Plugin incluso
  - H2: Configurazione rapida (principiante)
  - H2: Note
  - H2: Controllo degli accessi (DM)
  - H2: Stanze (gruppi)
  - H2: Funzionalità
  - H2: Riferimento di configurazione (Nextcloud Talk)
  - H2: Correlati

## channels/nostr.md

- Percorso: /channels/nostr
- Intestazioni:
  - H2: Plugin incluso
  - H3: Installazioni meno recenti/personalizzate
  - H3: Configurazione non interattiva
  - H2: Configurazione rapida
  - H2: Riferimento di configurazione
  - H2: Metadati del profilo
  - H2: Controllo degli accessi
  - H3: Criteri DM
  - H3: Esempio di lista consentita
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
- Intestazioni:
  - H2: 1) Associazione DM (accesso chat in ingresso)
  - H3: Approva un mittente
  - H3: Gruppi di mittenti riutilizzabili
  - H3: Dove risiede lo stato
  - H2: 2) Associazione dispositivo Node (nodi iOS/Android/macOS/headless)
  - H3: Associa tramite Telegram (consigliato per iOS)
  - H3: Approva un dispositivo Node
  - H3: Approvazione automatica opzionale del Node con CIDR attendibile
  - H3: Archiviazione dello stato di associazione del Node
  - H3: Note
  - H2: Documentazione correlata

## channels/qa-channel.md

- Percorso: /channels/qa-channel
- Intestazioni:
  - H2: Cosa fa
  - H2: Configurazione
  - H2: Runner
  - H2: Correlati

## channels/qqbot.md

- Percorso: /channels/qqbot
- Intestazioni:
  - H2: Installa
  - H2: Configurazione
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

- Percorso: /channels/raft
- Intestazioni:
  - H2: Installa
  - H2: Prerequisiti
  - H2: Configura
  - H2: Come funziona
  - H2: Verifica
  - H2: Risoluzione dei problemi
  - H2: Riferimenti

## channels/signal.md

- Percorso: /channels/signal
- Intestazioni:
  - H2: Prerequisiti
  - H2: Configurazione rapida (principiante)
  - H2: Che cos'è
  - H2: Scritture di configurazione
  - H2: Il modello del numero (importante)
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
  - H2: Note sulla sicurezza
  - H2: Riferimento di configurazione (Signal)
  - H2: Correlati

## channels/slack.md

- Percorso: /channels/slack
- Intestazioni:
  - H2: Scegliere Socket Mode o URL di richiesta HTTP
  - H3: Modalità relay
  - H2: Installa
  - H2: Configurazione rapida
  - H2: Ottimizzazione del trasporto Socket Mode
  - H2: Checklist di manifest e scope
  - H3: Impostazioni aggiuntive del manifest
  - H2: Modello dei token
  - H2: Azioni e gate
  - H2: Controllo degli accessi e instradamento
  - H2: Thread, sessioni e tag di risposta
  - H2: Reazioni di ack
  - H3: Emoji (ackReaction)
  - H3: Scope (messages.ackReactionScope)
  - H2: Streaming di testo
  - H2: Fallback della reazione di digitazione
  - H2: Media, suddivisione in chunk e consegna
  - H2: Comandi e comportamento slash
  - H2: Risposte interattive
  - H3: Invii di modali di proprietà del Plugin
  - H2: Approvazioni native in Slack
  - H2: Eventi e comportamento operativo
  - H2: Riferimento di configurazione
  - H2: Risoluzione dei problemi
  - H2: Riferimento visione allegati
  - H3: Tipi di media supportati
  - H3: Pipeline in ingresso
  - H3: Ereditarietà degli allegati della radice del thread
  - H3: Gestione di allegati multipli
  - H3: Limiti di dimensione, download e modello
  - H3: Limiti noti
  - H3: Documentazione correlata
  - H2: Correlati

## channels/sms.md

- Percorso: /channels/sms
- Intestazioni:
  - H2: Prima di iniziare
  - H2: Configurazione rapida
  - H2: Esempi di configurazione
  - H3: File di configurazione
  - H3: Variabili d'ambiente
  - H3: Token di autenticazione SecretRef
  - H3: Numero privato solo con lista consentita
  - H3: Mittente del Messaging Service
  - H3: Destinazione in uscita predefinita
  - H2: Controllo degli accessi
  - H2: Invio di SMS
  - H2: Verifica configurazione
  - H3: Test end-to-end da macOS iMessage/SMS
  - H2: Sicurezza del Webhook
  - H2: Configurazione multi-account
  - H2: Risoluzione dei problemi
  - H3: Twilio restituisce 403 oppure OpenClaw rifiuta il Webhook
  - H3: Non compare alcuna richiesta di associazione
  - H3: Gli invii in uscita non riescono
  - H3: I messaggi arrivano ma l'agente non risponde

## channels/synology-chat.md

- Percorso: /channels/synology-chat
- Intestazioni:
  - H2: Plugin incluso
  - H2: Configurazione rapida
  - H2: Variabili d'ambiente
  - H2: Criterio DM e controllo degli accessi
  - H2: Consegna in uscita
  - H2: Multi-account
  - H2: Note sulla sicurezza
  - H2: Risoluzione dei problemi
  - H2: Correlati

## channels/telegram.md

- Percorso: /channels/telegram
- Intestazioni:
  - H2: Configurazione rapida
  - H2: Impostazioni lato Telegram
  - H2: Controllo degli accessi e attivazione
  - H3: Identità del bot di gruppo
  - H2: Comportamento runtime
  - H2: Riferimento funzionalità
  - H2: Controlli delle risposte di errore
  - H2: Risoluzione dei problemi
  - H2: Riferimento di configurazione
  - H2: Correlati

## channels/tlon.md

- Percorso: /channels/tlon
- Intestazioni:
  - H2: Plugin incluso
  - H2: Configurazione
  - H2: Ship privati/LAN
  - H2: Canali di gruppo
  - H2: Controllo degli accessi
  - H2: Sistema di proprietario e approvazione
  - H2: Impostazioni di accettazione automatica
  - H2: Destinazioni di consegna (CLI/Cron)
  - H2: Skill incluso
  - H2: Funzionalità
  - H2: Risoluzione dei problemi
  - H2: Riferimento di configurazione
  - H2: Note
  - H2: Correlati

## channels/troubleshooting.md

- Percorso: /channels/troubleshooting
- Intestazioni:
  - H2: Sequenza di comandi
  - H2: Dopo un aggiornamento
  - H2: WhatsApp
  - H3: Firme di errore di WhatsApp
  - H2: Telegram
  - H3: Firme di errore di Telegram
  - H2: Discord
  - H3: Firme di errore di Discord
  - H2: Slack
  - H3: Firme di errore di Slack
  - H2: iMessage
  - H3: Firme di errore di iMessage
  - H2: Signal
  - H3: Firme di errore di Signal
  - H2: QQ Bot
  - H3: Firme di errore di QQ Bot
  - H2: Matrix
  - H3: Firme di errore di Matrix
  - H2: Correlati

## channels/twitch.md

- Percorso: /channels/twitch
- Titoli:
  - H2: Plugin incluso
  - H2: Configurazione rapida (principiante)
  - H2: Che cos'è
  - H2: Configurazione (dettagliata)
  - H3: Generare le credenziali
  - H3: Configurare il bot
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
- Titoli:
  - H2: Nomenclatura
  - H2: Come funziona
  - H2: Installazione
  - H2: Accesso
  - H2: Controllo degli accessi
  - H2: Compatibilità
  - H2: Processo sidecar
  - H2: Risoluzione dei problemi
  - H2: Documenti correlati

## channels/whatsapp.md

- Percorso: /channels/whatsapp
- Titoli:
  - H2: Installazione (su richiesta)
  - H2: Configurazione rapida
  - H2: Chiamare il richiedente attuale con MeowCaller (sperimentale)
  - H2: Schemi di distribuzione
  - H2: Modello di runtime
  - H2: Prompt di approvazione
  - H2: Hook del Plugin e privacy
  - H2: Controllo degli accessi e attivazione
  - H2: Associazioni ACP configurate
  - H2: Comportamento del numero personale e della chat con se stessi
  - H2: Normalizzazione dei messaggi e contesto
  - H2: Recapito, suddivisione in blocchi e media
  - H2: Citazione delle risposte
  - H2: Livello di reazione
  - H2: Reazioni di conferma
  - H2: Reazioni di stato del ciclo di vita
  - H2: Multi-account e credenziali
  - H2: Strumenti, azioni e scritture della configurazione
  - H2: Risoluzione dei problemi
  - H2: Prompt di sistema
  - H2: Riferimenti alla configurazione
  - H2: Correlati

## channels/yuanbao.md

- Percorso: /channels/yuanbao
- Titoli:
  - H2: Avvio rapido
  - H3: Configurazione interattiva (alternativa)
  - H2: Controllo degli accessi
  - H3: Messaggi diretti
  - H3: Chat di gruppo
  - H2: Esempi di configurazione
  - H3: Configurazione di base con criterio DM aperto
  - H3: Limitare i DM a utenti specifici
  - H3: Disabilitare il requisito di @mention nei gruppi
  - H3: Ottimizzare il recapito dei messaggi in uscita
  - H3: Regolare la strategia merge-text
  - H2: Comandi comuni
  - H2: Risoluzione dei problemi
  - H3: Il bot non risponde nelle chat di gruppo
  - H3: Il bot non riceve messaggi
  - H3: Il bot invia risposte vuote o di fallback
  - H3: App Secret trapelato
  - H2: Configurazione avanzata
  - H3: Account multipli
  - H3: Limiti dei messaggi
  - H3: Streaming
  - H3: Contesto della cronologia della chat di gruppo
  - H3: Modalità reply-to
  - H3: Inserimento di suggerimenti Markdown
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
- Titoli:
  - H2: Plugin incluso
  - H2: Configurazione rapida (principiante)
  - H2: Che cos'è
  - H2: Configurazione (percorso rapido)
  - H3: 1) Creare un token del bot (Zalo Bot Platform)
  - H3: 2) Configurare il token (env o configurazione)
  - H2: Come funziona (comportamento)
  - H2: Limiti
  - H2: Controllo degli accessi (DM)
  - H3: Accesso DM
  - H2: Controllo degli accessi (gruppi)
  - H2: Long polling e Webhook
  - H2: Tipi di messaggio supportati
  - H2: Funzionalità
  - H2: Destinatari di recapito (CLI/Cron)
  - H2: Risoluzione dei problemi
  - H2: Riferimento di configurazione (Zalo)
  - H2: Correlati

## channels/zaloclawbot.md

- Percorso: /channels/zaloclawbot
- Titoli:
  - H2: Compatibilità
  - H2: Prerequisiti
  - H2: Installazione con onboard (consigliata)
  - H2: Installazione manuale
  - H3: 1. Installare il Plugin
  - H3: 2. Abilitare il Plugin nella configurazione
  - H3: 3. Generare il codice QR e accedere
  - H3: 4. Riavviare il Gateway
  - H2: Come funziona
  - H2: Dietro le quinte
  - H2: Risoluzione dei problemi

## channels/zalouser.md

- Percorso: /channels/zalouser
- Titoli:
  - H2: Plugin incluso
  - H2: Configurazione rapida (principiante)
  - H2: Che cos'è
  - H2: Nomenclatura
  - H2: Trovare gli ID (directory)
  - H2: Limiti
  - H2: Controllo degli accessi (DM)
  - H2: Accesso ai gruppi (facoltativo)
  - H3: Gate sulle menzioni di gruppo
  - H2: Multi-account
  - H2: Variabili d'ambiente
  - H2: Digitazione, reazioni e conferme di recapito
  - H2: Risoluzione dei problemi
  - H2: Correlati

## ci.md

- Percorso: /ci
- Titoli:
  - H2: Panoramica della pipeline
  - H2: Ordine fail-fast
  - H2: Contesto e prove della PR
  - H2: Ambito e instradamento
  - H2: Inoltro dell'attività di ClawSweeper
  - H2: Esecuzioni manuali
  - H2: Runner
  - H2: Budget di registrazione dei runner
  - H2: Equivalenti locali
  - H2: Prestazioni di OpenClaw
  - H2: Convalida completa della release
  - H2: Shard live ed E2E
  - H2: Accettazione del pacchetto
  - H3: Job
  - H3: Origini dei candidati
  - H3: Profili della suite
  - H3: Finestre di compatibilità legacy
  - H3: Esempi
  - H2: Smoke di installazione
  - H2: E2E Docker locale
  - H3: Parametri regolabili
  - H3: Workflow live/E2E riutilizzabile
  - H3: Blocchi del percorso di release
  - H2: Prerelease dei Plugin
  - H2: QA Lab
  - H2: CodeQL
  - H3: Categorie di sicurezza
  - H3: Shard di sicurezza specifici della piattaforma
  - H3: Categorie di qualità critica
  - H2: Workflow di manutenzione
  - H3: Agente documentazione
  - H3: Agente prestazioni dei test
  - H3: PR duplicate dopo il merge
  - H2: Gate di controllo locali e instradamento delle modifiche
  - H2: Convalida Testbox
  - H2: Correlati

## clawhub/cli.md

- Percorso: /clawhub/cli
- Titoli:
  - H1: CLI di ClawHub
  - H2: Scoprire e installare
  - H2: Pubblicare e mantenere
  - H2: Correlati

## clawhub/publishing.md

- Percorso: /clawhub/publishing
- Titoli:
  - H1: Pubblicazione su ClawHub
  - H2: Proprietari
  - H2: Skills
  - H2: Plugin
  - H2: Flusso di release
  - H2: FAQ
  - H3: L'ambito del pacchetto deve corrispondere al proprietario selezionato

## cli/acp.md

- Percorso: /cli/acp
- Titoli:
  - H2: Cosa non è
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
  - H3: opzioni del client acp
  - H2: Correlati

## cli/agent.md

- Percorso: /cli/agent
- Titoli:
  - H1: openclaw agent
  - H2: Opzioni
  - H2: Esempi
  - H2: Note
  - H2: Stato di recapito JSON
  - H2: Correlati

## cli/agents.md

- Percorso: /cli/agents
- Titoli:
  - H1: openclaw agents
  - H2: Esempi
  - H2: Associazioni di instradamento
  - H3: formato --bind
  - H3: Comportamento dell'ambito dell'associazione
  - H2: Superficie dei comandi
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete &lt;id&gt;
  - H2: File di identità
  - H2: Impostare l'identità
  - H2: Correlati

## cli/approvals.md

- Percorso: /cli/approvals
- Titoli:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Comandi comuni
  - H2: Sostituire le approvazioni da un file
  - H2: Esempio "Never prompt" / YOLO
  - H2: Helper allowlist
  - H2: Opzioni comuni
  - H2: Note
  - H2: Correlati

## cli/attach.md

- Percorso: /cli/attach
- Titoli: nessuno

## cli/backup.md

- Percorso: /cli/backup
- Titoli:
  - H1: openclaw backup
  - H2: Note
  - H2: Cosa viene incluso nel backup
  - H2: Comportamento con configurazione non valida
  - H2: Dimensioni e prestazioni
  - H2: Correlati

## cli/browser.md

- Percorso: /cli/browser
- Titoli:
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
  - H2: Controllo remoto del browser (proxy host Node)
  - H2: Correlati

## cli/channels.md

- Percorso: /cli/channels
- Titoli:
  - H1: openclaw channels
  - H2: Comandi comuni
  - H2: Stato / funzionalità / risoluzione / log
  - H2: Aggiungere / rimuovere account
  - H2: Accesso e disconnessione (interattivi)
  - H2: Risoluzione dei problemi
  - H2: Sonda delle funzionalità
  - H2: Risolvere i nomi in ID
  - H2: Correlati

## cli/clawbot.md

- Percorso: /cli/clawbot
- Titoli:
  - H1: openclaw clawbot
  - H2: Migrazione
  - H2: Correlati

## cli/commitments.md

- Percorso: /cli/commitments
- Titoli:
  - H2: Utilizzo
  - H2: Opzioni
  - H2: Esempi
  - H2: Output
  - H2: Correlati

## cli/completion.md

- Percorso: /cli/completion
- Titoli:
  - H1: openclaw completion
  - H2: Utilizzo
  - H2: Opzioni
  - H2: Note
  - H2: Correlati

## cli/config.md

- Percorso: /cli/config
- Titoli:
  - H2: Opzioni radice
  - H2: Esempi
  - H3: config schema
  - H3: Percorsi
  - H2: Valori
  - H2: modalità config set
  - H2: config patch
  - H2: Flag del builder del provider
  - H2: Dry run
  - H3: Forma dell'output JSON
  - H2: Sicurezza della scrittura
  - H2: Sottocomandi
  - H2: Convalida
  - H2: Correlati

## cli/configure.md

- Percorso: /cli/configure
- Titoli:
  - H1: openclaw configure
  - H2: Opzioni
  - H2: Esempi
  - H2: Correlati

## cli/crestodian.md

- Percorso: /cli/crestodian
- Titoli:
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
- Titoli:
  - H1: openclaw cron
  - H2: Creare job rapidamente
  - H2: Sessioni
  - H2: Recapito
  - H3: Proprietà del recapito
  - H3: Recapito degli errori
  - H2: Pianificazione
  - H3: Job one-shot
  - H3: Job ricorrenti
  - H3: Esecuzioni manuali
  - H2: Modelli
  - H3: Precedenza del modello Cron isolato
  - H3: Modalità veloce
  - H3: Tentativi di cambio modello live
  - H2: Output dell'esecuzione e negazioni
  - H3: Soppressione delle conferme obsolete
  - H3: Soppressione dei token silenziosi
  - H3: Negazioni strutturate
  - H2: Conservazione
  - H2: Migrazione dei job meno recenti
  - H2: Modifiche comuni
  - H2: Comandi amministrativi comuni
  - H2: Correlati

## cli/daemon.md

- Percorso: /cli/daemon
- Titoli:
  - H1: openclaw daemon
  - H2: Utilizzo
  - H2: Sottocomandi
  - H2: Opzioni comuni
  - H2: Preferenze
  - H2: Correlati

## cli/dashboard.md

- Percorso: /cli/dashboard
- Titoli:
  - H1: openclaw dashboard
  - H2: Correlati

## cli/devices.md

- Percorso: /cli/devices
- Titoli:
  - H1: openclaw devices
  - H2: Comandi
  - H3: openclaw devices list
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Prima approvazione di Paperclip / openclawgateway
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: Opzioni comuni
  - H2: Note
  - H2: Checklist di recupero dal drift dei token
  - H2: Correlati

## cli/directory.md

- Percorso: /cli/directory
- Titoli:
  - H1: openclaw directory
  - H2: Flag comuni
  - H2: Note
  - H2: Uso dei risultati con l'invio di messaggi
  - H2: Formati degli ID (per canale)
  - H2: Se stesso ("me")
  - H2: Peer (contatti/utenti)
  - H2: Gruppi
  - H2: Correlati

## cli/dns.md

- Percorso: /cli/dns
- Titoli:
  - H1: openclaw dns
  - H2: Configurazione
  - H2: dns setup
  - H2: Correlati

## cli/docs.md

- Percorso: /cli/docs
- Titoli:
  - H1: openclaw docs
  - H2: Utilizzo
  - H2: Esempi
  - H2: Come funziona
  - H2: Output
  - H2: Codici di uscita
  - H2: Correlati

## cli/doctor.md

- Percorso: /cli/doctor
- Titoli:
  - H1: openclaw doctor
  - H2: Perché usarlo
  - H2: Esempi
  - H2: Opzioni
  - H2: Modalità lint
  - H2: Controlli di integrità strutturati
  - H2: Selezione dei controlli
  - H2: Modalità post-upgrade
  - H2: macOS: override env di launchctl
  - H2: Correlati

## cli/flows.md

- Percorso: /cli/flows
- Titoli:
  - H1: openclaw tasks flow
  - H2: Sottocomandi
  - H3: Valori del filtro di stato
  - H2: Esempi
  - H2: Correlati

## cli/gateway.md

- Percorso: /cli/gateway
- Titoli:
  - H2: Eseguire il Gateway
  - H3: Opzioni
  - H2: Riavviare il Gateway
  - H3: Profilazione del Gateway
  - H2: Interrogare un Gateway in esecuzione
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: Remoto su SSH (parità app Mac)
  - H3: gateway call &lt;method&gt;
  - H2: Gestire il servizio Gateway
  - H3: Installare con un wrapper
  - H2: Scoprire i gateway (Bonjour)
  - H3: gateway discover
  - H2: Correlati

## cli/health.md

- Percorso: /cli/health
- Titoli:
  - H1: openclaw health
  - H2: Opzioni
  - H2: Correlati

## cli/hooks.md

- Percorso: /cli/hooks
- Intestazioni:
  - H1: openclaw hooks
  - H2: Elenca tutti gli hook
  - H2: Ottieni informazioni sugli hook
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
  - H2: Insidie comuni
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
  - H2: UI di controllo
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
  - H2: Comportamento SecretRef
  - H2: Azioni
  - H3: Nucleo
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
  - H2: Perché usare un host nodo?
  - H2: Proxy browser (zero-config)
  - H2: Esegui (in primo piano)
  - H2: Autenticazione Gateway per host nodo
  - H2: Servizio (in background)
  - H2: Associazione
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
  - H2: Comandi di follow-up comuni

## cli/pairing.md

- Percorso: /cli/pairing
- Intestazioni:
  - H1: openclaw pairing
  - H2: Comandi
  - H2: elenco pairing
  - H2: approvazione pairing
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
  - H3: Riferimento delle regole di policy
  - H4: Overlay con ambito
  - H4: Canali
  - H4: Server MCP
  - H4: Provider di modelli
  - H4: Rete
  - H4: Ingress e accesso ai canali
  - H4: Gateway
  - H4: Area di lavoro dell'agente
  - H4: Postura sandbox
  - H4: Gestione dei dati
  - H4: Segreti
  - H4: Approvazioni exec
  - H4: Profili di autenticazione
  - H4: Metadati degli strumenti
  - H4: Postura degli strumenti
  - H2: Configura la policy
  - H2: Accetta lo stato della policy
  - H2: Risultati
  - H2: Ripara
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
  - H3: Dopo l'aggiornamento di un'immagine Docker
  - H3: Dopo la modifica della configurazione sandbox
  - H3: Dopo la modifica del target SSH o del materiale di autenticazione SSH
  - H3: Dopo la modifica dell'origine, della policy o della modalità di OpenShell
  - H3: Dopo la modifica di setupCommand
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
  - H2: Cosa modifica --fix
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
  - H2: Workshop delle Skill
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
  - H2: evento di sistema
  - H2: system heartbeat last|enable|disable
  - H2: presenza di sistema
  - H2: Note
  - H2: Correlati

## cli/tasks.md

- Percorso: /cli/tasks
- Intestazioni:
  - H2: Utilizzo
  - H2: Opzioni radice
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
  - H2: configurazione webhooks gmail
  - H3: Obbligatorio
  - H3: Opzioni Pub/Sub
  - H3: Opzioni di consegna OpenClaw
  - H3: opzioni gog watch serve
  - H3: Esposizione Tailscale
  - H3: Output
  - H2: esecuzione webhooks gmail
  - H2: Flusso end-to-end
  - H2: Correlati

## cli/wiki.md

- Percorso: /cli/wiki
- Intestazioni:
  - H1: openclaw wiki
  - H2: A cosa serve
  - H2: Comandi comuni
  - H2: Comandi
  - H3: stato wiki
  - H3: doctor wiki
  - H3: inizializzazione wiki
  - H3: ingest wiki &lt;path-or-url&gt;
  - H3: importazione wiki okf &lt;path&gt;
  - H3: compilazione wiki
  - H3: lint wiki
  - H3: ricerca wiki &lt;query&gt;
  - H3: get wiki &lt;lookup&gt;
  - H3: apply wiki
  - H3: importazione wiki bridge
  - H3: importazione wiki unsafe-local
  - H3: wiki obsidian ...
  - H2: Indicazioni pratiche di utilizzo
  - H2: Collegamenti alla configurazione
  - H2: Correlati

## cli/workboard.md

- Percorso: /cli/workboard
- Intestazioni:
  - H2: Utilizzo
  - H2: elenco
  - H2: crea
  - H2: mostra
  - H2: dispatch
  - H2: Parità dei comandi slash
  - H2: Permessi
  - H2: Risoluzione dei problemi
  - H3: Non appare alcuna scheda
  - H3: Dispatch indica solo dati
  - H3: Dispatch non avvia nulla
  - H2: Correlati

## concepts/active-memory.md

- Percorso: /concepts/active-memory
- Intestazioni:
  - H2: Avvio rapido
  - H2: Raccomandazioni sulla velocità
  - H3: Configurazione Cerebras
  - H2: Come vederla
  - H2: Toggle di sessione
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
  - H2: Vie di fuga avanzate
  - H2: Persistenza delle trascrizioni
  - H2: Configurazione
  - H2: Configurazione consigliata
  - H3: Periodo di tolleranza per avvio a freddo
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
  - H2: Punti di hook (dove puoi intercettare)
  - H3: Hook interni (hook del Gateway)
  - H3: Hook dei Plugin (ciclo di vita agente + gateway)
  - H2: Streaming + risposte parziali
  - H2: Esecuzione degli strumenti + strumenti di messaggistica
  - H2: Modellazione della risposta + soppressione
  - H2: Compaction + nuovi tentativi
  - H2: Flussi di eventi (oggi)
  - H2: Gestione del canale chat
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
  - H2: Cartelle workspace aggiuntive
  - H2: Mappa dei file del workspace
  - H2: Cosa NON è incluso nel workspace
  - H2: Backup Git (consigliato, privato)
  - H2: Non eseguire commit di segreti
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
  - H2: Confini di runtime
  - H2: Sessioni
  - H2: Orientamento durante lo streaming
  - H2: Riferimenti modello
  - H2: Configurazione (minima)
  - H2: Correlati

## concepts/architecture.md

- Percorso: /concepts/architecture
- Intestazioni:
  - H2: Panoramica
  - H2: Componenti e flussi
  - H3: Gateway (daemon)
  - H3: Client (app Mac / CLI / amministrazione web)
  - H3: Nodi (macOS / iOS / Android / senza interfaccia)
  - H3: WebChat
  - H2: Ciclo di vita della connessione (singolo client)
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
  - H2: Privacy e costi
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
  - H3: Protezione sui byte della trascrizione attiva
  - H3: Trascrizioni successive
  - H3: Avvisi di Compaction
  - H3: Flush della memoria
  - H2: Provider di Compaction collegabili
  - H2: Compaction e potatura
  - H2: Risoluzione dei problemi
  - H2: Correlati

## concepts/context-engine.md

- Percorso: /concepts/context-engine
- Intestazioni:
  - H2: Avvio rapido
  - H2: Come funziona
  - H3: Ciclo di vita del subagent (facoltativo)
  - H3: Aggiunta al prompt di sistema
  - H2: Il motore legacy
  - H2: Motori Plugin
  - H3: L'interfaccia ContextEngine
  - H3: Impostazioni di runtime
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
  - H2: Cosa rientra nella finestra di contesto
  - H2: Come OpenClaw costruisce il prompt di sistema
  - H2: File workspace iniettati (contesto del progetto)
  - H2: Skills: iniettate o caricate su richiesta
  - H2: Strumenti: ci sono due costi
  - H2: Comandi, direttive e "scorciatoie inline"
  - H2: Sessioni, Compaction e potatura (cosa persiste)
  - H2: Cosa riporta effettivamente /context
  - H2: Correlati

## concepts/delegate-architecture.md

- Percorso: /concepts/delegate-architecture
- Intestazioni:
  - H2: Che cos'è un delegato?
  - H2: Perché usare delegati?
  - H2: Livelli di capacità
  - H3: Livello 1: sola lettura + bozza
  - H3: Livello 2: invio per conto di
  - H3: Livello 3: proattivo
  - H2: Prerequisiti: isolamento e rafforzamento
  - H3: Blocchi rigidi (non negoziabili)
  - H3: Restrizioni sugli strumenti
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
  - H2: Schema di scalabilità
  - H2: Correlati

## concepts/dreaming.md

- Percorso: /concepts/dreaming
- Intestazioni:
  - H2: Cosa scrive Dreaming
  - H2: Modello a fasi
  - H2: Ingestione della trascrizione della sessione
  - H2: Diario dei sogni
  - H2: Segnali di ranking profondi
  - H2: Copertura dei report di prova shadow QA
  - H2: Pianificazione
  - H2: Avvio rapido
  - H2: Comando slash
  - H2: Flusso di lavoro CLI
  - H2: Valori predefiniti principali
  - H2: Interfaccia sogni
  - H2: Dreaming non viene mai eseguito: lo stato mostra bloccato
  - H2: Correlati

## concepts/experimental-features.md

- Percorso: /concepts/experimental-features
- Intestazioni:
  - H2: Flag attualmente documentati
  - H2: Modalità snella per modello locale
  - H3: Perché questi tre strumenti
  - H3: Quando attivarla
  - H3: Quando lasciarla disattivata
  - H3: Abilitare
  - H2: Sperimentale non significa nascosto
  - H2: Correlati

## concepts/features.md

- Percorso: /concepts/features
- Intestazioni:
  - H2: Punti salienti
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
  - H2: Checklist delle prove
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
  - H2: Modello di prove
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
  - H2: Regole di suddivisione in blocchi
  - H2: Policy sui link
  - H2: Spoiler
  - H2: Come aggiungere o aggiornare un formatter di canale
  - H2: Insidie comuni
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
  - H2: Migrare la memoria esistente
  - H2: Come funziona
  - H2: Honcho e memoria integrata
  - H2: Comandi CLI
  - H2: Altre letture
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
  - H2: Indicizzare percorsi aggiuntivi
  - H2: Indicizzare le trascrizioni delle sessioni
  - H2: Ambito di ricerca
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
  - H2: Altre letture
  - H2: Correlati

## concepts/memory.md

- Percorso: /concepts/memory
- Intestazioni:
  - H2: Come funziona
  - H2: Cosa va dove
  - H2: Memorie sensibili alle azioni
  - H2: Impegni inferiti
  - H2: Strumenti di memoria
  - H2: Plugin companion Memory Wiki
  - H2: Ricerca in memoria
  - H2: Backend di memoria
  - H2: Livello wiki della conoscenza
  - H2: Flush automatico della memoria
  - H2: Dreaming
  - H2: Backfill fondato e promozione live
  - H2: CLI
  - H2: Altre letture
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
  - H3: Destinazione
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
  - H2: Mapping dei canali
  - H2: Piano di migrazione
  - H3: Fase 1: Dominio interno dei messaggi
  - H3: Fase 2: Core di invio durevole
  - H3: Fase 3: Bridge inbound del canale
  - H3: Fase 4: Bridge dispatcher preparato
  - H3: Fase 5: Ciclo di vita live unificato
  - H3: Fase 6: SDK pubblico
  - H3: Fase 7: Tutti i mittenti
  - H3: Fase 8: Rimuovere la compatibilità con nomi basati su turn
  - H2: Piano di test
  - H2: Domande aperte
  - H2: Criteri di accettazione
  - H2: Correlati

## concepts/messages.md

- Percorso: /concepts/messages
- Intestazioni:
  - H2: Flusso dei messaggi (alto livello)
  - H2: Deduplicazione inbound
  - H2: Debouncing inbound
  - H2: Sessioni e dispositivi
  - H2: Metadati dei risultati degli strumenti
  - H2: Corpi inbound e contesto della cronologia
  - H2: Accodamento e follow-up
  - H2: Proprietà dell'esecuzione del canale
  - H2: Streaming, suddivisione in blocchi e batching
  - H2: Visibilità del reasoning e token
  - H2: Prefissi, threading e risposte
  - H2: Risposte silenziose
  - H2: Correlati

## concepts/model-failover.md

- Percorso: /concepts/model-failover
- Intestazioni:
  - H2: Flusso di runtime
  - H2: Policy della sorgente di selezione
  - H2: Cache di salto degli errori di autenticazione
  - H2: Avvisi di fallback visibili all'utente
  - H2: Archiviazione dell'autenticazione (chiavi + OAuth)
  - H2: ID profilo
  - H2: Ordine di rotazione
  - H3: Persistenza della sessione (favorevole alla cache)
  - H3: Abbonamento OpenAI Codex più backup con chiave API
  - H2: Cooldown
  - H2: Disattivazioni per fatturazione
  - H2: Fallback del modello
  - H3: Regole della catena dei candidati
  - H3: Quali errori fanno avanzare il fallback
  - H3: Salto per cooldown e comportamento di probe
  - H2: Override di sessione e cambio modello live
  - H2: Osservabilità e riepiloghi degli errori
  - H2: Configurazione correlata

## concepts/model-providers.md

- Percorso: /concepts/model-providers
- Intestazioni:
  - H2: Regole rapide
  - H2: Comportamento dei provider di proprietà dei Plugin
  - H2: Rotazione delle chiavi API
  - H2: Plugin provider ufficiali
  - H3: OpenAI
  - H3: Anthropic
  - H3: OAuth OpenAI ChatGPT/Codex
  - H3: Altre opzioni ospitate in stile abbonamento
  - H3: OpenCode
  - H3: Google Gemini (chiave API)
  - H3: Google Vertex e Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Altri Plugin provider in bundle
  - H4: Particolarità utili da conoscere
  - H2: Provider tramite models.providers (URL personalizzato/di base)
  - H3: Moonshot AI (Kimi)
  - H3: Kimi coding
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (International)
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
  - H2: Policy rapida sui modelli
  - H2: Onboarding (consigliato)
  - H2: Chiavi di configurazione (panoramica)
  - H3: Modifiche sicure all'allowlist
  - H2: "Model is not allowed" (e perché le risposte si fermano)
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
  - H2: Esempi di piattaforma
  - H2: Schemi comuni
  - H2: Sandbox e configurazione degli strumenti per agente
  - H2: Correlati

## concepts/oauth.md

- Percorso: /concepts/oauth
- Intestazioni:
  - H2: Il sink dei token (perché esiste)
  - H2: Archiviazione (dove risiedono i token)
  - H2: Compatibilità con i token legacy di Anthropic
  - H2: Migrazione della CLI Anthropic Claude
  - H2: Scambio OAuth (come funziona l'accesso)
  - H3: setup-token di Anthropic
  - H3: OpenAI Codex (OAuth ChatGPT)
  - H2: Aggiornamento + scadenza
  - H2: Account multipli (profili) + instradamento
  - H3: 1) Preferito: agenti separati
  - H3: 2) Avanzato: più profili in un agente
  - H2: Correlati

## concepts/parallel-specialist-lanes.md

- Percorso: /concepts/parallel-specialist-lanes
- Intestazioni:
  - H2: Principi fondamentali
  - H2: Distribuzione consigliata
  - H3: Fase 1: contratti di corsia + lavoro pesante in background
  - H3: Fase 2: controlli di priorità e concorrenza
  - H3: Fase 3: coordinatore / controllore del traffico
  - H2: Modello minimo di contratto di corsia
  - H2: Correlati

## concepts/personal-agent-benchmark-pack.md

- Percorso: /concepts/personal-agent-benchmark-pack
- Intestazioni:
  - H2: Scenari
  - H2: Modello di privacy
  - H2: Estendere il pacchetto

## concepts/presence.md

- Percorso: /concepts/presence
- Intestazioni:
  - H2: Campi di presenza (cosa viene mostrato)
  - H2: Produttori (da dove proviene la presenza)
  - H3: 1) Voce autonoma del Gateway
  - H3: 2) Connessione WebSocket
  - H4: Perché i comandi CLI una tantum non vengono mostrati
  - H3: 3) beacon system-event
  - H3: 4) Connessioni Node (ruolo: node)
  - H2: Regole di fusione + deduplicazione (perché instanceId è importante)
  - H2: TTL e dimensione limitata
  - H2: Avvertenza remoto/tunnel (IP loopback)
  - H2: Consumatori
  - H3: Scheda Istanze macOS
  - H2: Suggerimenti per il debug
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
  - H2: Flusso operatore
  - H2: Copertura del trasporto live
  - H2: Riferimento QA per Telegram, Discord, Slack e WhatsApp
  - H3: Flag CLI condivisi
  - H3: QA Telegram
  - H3: QA Discord
  - H3: QA Slack
  - H4: Configurare l'area di lavoro Slack
  - H3: QA WhatsApp
  - H3: Pool di credenziali Convex
  - H2: Seed basati sul repo
  - H2: Corsie di mock del provider
  - H2: Adattatori di trasporto
  - H3: Aggiungere un canale
  - H3: Nomi degli helper di scenario
  - H2: Reportistica
  - H2: Documenti correlati

## concepts/qa-matrix.md

- Percorso: /concepts/qa-matrix
- Intestazioni:
  - H2: Avvio rapido
  - H2: Cosa fa la corsia
  - H2: CLI
  - H3: Flag comuni
  - H3: Flag del provider
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
  - H2: Confine di runtime
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

- Percorso: /concepts/retry
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

- Percorso: /concepts/session-pruning
- Intestazioni:
  - H2: Perché è importante
  - H2: Come funziona
  - H2: Pulizia delle immagini legacy
  - H2: Predefiniti intelligenti
  - H2: Abilitare o disabilitare
  - H2: Pruning vs compaction
  - H2: Ulteriori letture
  - H2: Correlati

## concepts/session-tool.md

- Percorso: /concepts/session-tool
- Intestazioni:
  - H2: Strumenti disponibili
  - H2: Elencare e leggere le sessioni
  - H2: Inviare messaggi tra sessioni
  - H2: Helper di stato e orchestrazione
  - H2: Generare sub-agenti
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
  - H2: Manutenzione delle sessioni
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
  - H2: Un avviso
  - H2: Correlati

## concepts/streaming.md

- Percorso: /concepts/streaming
- Intestazioni:
  - H2: Streaming a blocchi (messaggi di canale)
  - H3: Consegna di contenuti multimediali con streaming a blocchi
  - H2: Algoritmo di suddivisione in chunk (limiti basso/alto)
  - H2: Coalescenza (unire i blocchi trasmessi in streaming)
  - H2: Ritmo simile a quello umano tra i blocchi
  - H2: "Trasmettere chunk o tutto"
  - H2: Modalità di streaming dell'anteprima
  - H3: Mappatura dei canali
  - H3: Comportamento di runtime
  - H3: Aggiornamenti dell'anteprima di avanzamento degli strumenti
  - H3: Corsia di avanzamento dei commenti
  - H2: Correlati

## concepts/system-prompt.md

- Percorso: /concepts/system-prompt
- Intestazioni:
  - H2: Struttura
  - H2: Modalità del prompt
  - H2: Snapshot del prompt
  - H2: Iniezione bootstrap dell'area di lavoro
  - H2: Gestione del tempo
  - H2: Skills
  - H2: Documentazione
  - H2: Correlati

## concepts/timezone.md

- Percorso: /concepts/timezone
- Intestazioni:
  - H2: Tre superfici di fuso orario
  - H2: Impostare il fuso orario dell'utente
  - H2: Quando eseguire l'override
  - H2: Correlati

## concepts/typebox.md

- Percorso: /concepts/typebox
- Intestazioni:
  - H2: Modello mentale (30 secondi)
  - H2: Dove risiedono gli schemi
  - H2: Pipeline attuale
  - H2: Come gli schemi vengono usati a runtime
  - H2: Frame di esempio
  - H2: Client minimo (Node.js)
  - H2: Esempio pratico: aggiungere un metodo end-to-end
  - H2: Comportamento del codegen Swift
  - H2: Versionamento + compatibilità
  - H2: Pattern e convenzioni degli schemi
  - H2: JSON dello schema live
  - H2: Quando modifichi gli schemi
  - H2: Correlati

## concepts/typing-indicators.md

- Percorso: /concepts/typing-indicators
- Intestazioni:
  - H2: Predefiniti
  - H2: Modalità
  - H2: Configurazione
  - H2: Note
  - H2: Correlati

## concepts/usage-tracking.md

- Percorso: /concepts/usage-tracking
- Intestazioni:
  - H2: Che cos'è
  - H2: Dove viene mostrato
  - H2: Modalità predefinita del footer di utilizzo
  - H3: Tre stati di sessione distinti
  - H3: Precedenza
  - H3: Reimpostare vs disattivare
  - H3: Comportamento del toggle
  - H3: Configurazione
  - H2: Footer completo personalizzato /usage
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
  - H2: Riproduzione (solo Node)
  - H2: Riproduzione minima nel repo
  - H2: Controllo della versione Node
  - H2: Note / ipotesi
  - H2: Cronologia della regressione
  - H2: Soluzioni alternative
  - H2: Riferimenti
  - H2: Passaggi successivi
  - H2: Correlati

## diagnostics/flags.md

- Percorso: /diagnostics/flags
- Intestazioni:
  - H2: Come funziona
  - H2: Abilitare tramite configurazione
  - H2: Override env (una tantum)
  - H2: Flag di profiling
  - H2: Artefatti della timeline
  - H2: Dove vanno i log
  - H2: Estrarre i log
  - H2: Note
  - H2: Correlati

## gateway/authentication.md

- Percorso: /gateway/authentication
- Intestazioni:
  - H2: Configurazione consigliata (chiave API, qualsiasi provider)
  - H2: Anthropic: Claude CLI e compatibilità dei token
  - H2: Nota su Anthropic
  - H2: Controllare lo stato di autenticazione del modello
  - H2: Comportamento di rotazione della chiave API (Gateway)
  - H2: Rimuovere l'autenticazione del provider mentre il Gateway è in esecuzione
  - H2: Controllare quale credenziale viene usata
  - H3: OpenAI e ID legacy openai-codex
  - H3: Durante l'accesso (CLI)
  - H3: Per sessione (comando chat)
  - H3: Per agente (override CLI)
  - H2: Risoluzione dei problemi
  - H3: "Nessuna credenziale trovata"
  - H3: Token in scadenza/scaduto
  - H2: Correlati

## gateway/background-process.md

- Percorso: /gateway/background-process
- Intestazioni:
  - H2: strumento exec
  - H2: Bridge dei processi child
  - H2: strumento process
  - H2: Esempi
  - H2: Correlati

## gateway/bonjour.md

- Percorso: /gateway/bonjour
- Intestazioni:
  - H2: Bonjour wide-area (Unicast DNS-SD) su Tailscale
  - H3: Configurazione Gateway (consigliata)
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
  - H2: Handshake + associazione
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
  - H2: Preludio fallback dalle sessioni claude-cli
  - H2: Immagini (pass-through)
  - H2: Input / output
  - H2: Predefiniti (di proprietà del Plugin)
  - H2: Predefiniti di proprietà del Plugin
  - H2: Proprietà della compaction nativa
  - H2: Overlay MCP del bundle
  - H2: Limite alla reseed history
  - H2: Limitazioni
  - H2: Risoluzione dei problemi
  - H2: Correlati

## gateway/config-agents.md

- Percorso: /gateway/config-agents
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
  - H3: Policy di runtime
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
  - H2: Instradamento multi-agente
  - H3: Campi di corrispondenza del binding
  - H3: Profili di accesso per agente
  - H2: Sessione
  - H2: Messaggi
  - H3: Prefisso della risposta
  - H3: Reazione di conferma
  - H3: Debounce in entrata
  - H3: TTS (text-to-speech)
  - H2: Talk
  - H2: Correlati

## gateway/config-channels.md

- Route: /gateway/config-channels
- Intestazioni:
  - H2: Canali
  - H3: Accesso a DM e gruppi
  - H3: Override del modello del canale
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
  - H3: Gating delle menzioni nelle chat di gruppo
  - H4: Limiti della cronologia dei DM
  - H4: Modalità chat con sé stessi
  - H3: Comandi (gestione dei comandi chat)
  - H2: Correlati

## gateway/config-tools.md

- Route: /gateway/config-tools
- Intestazioni:
  - H2: Strumenti
  - H3: Profili degli strumenti
  - H3: Gruppi di strumenti
  - H3: Strumenti MCP e Plugin nella policy degli strumenti sandbox
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
  - H3: Minimo assoluto
  - H3: Configurazione iniziale consigliata
  - H2: Esempio ampliato (opzioni principali)
  - H3: Repository di skill sibling collegato con symlink
  - H2: Pattern comuni
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
- Intestazioni:
  - H2: Canali
  - H2: Valori predefiniti degli agenti, multi-agente, sessioni e messaggi
  - H2: Strumenti e provider personalizzati
  - H2: Modelli
  - H2: MCP
  - H2: Skills
  - H2: Plugins
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
  - H3: Superficie delle credenziali supportata
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
  - H2: Variabili del template del modello media
  - H2: Include della configurazione ($include)
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
  - H2: Recorder di stabilità
  - H2: Opzioni utili
  - H2: Disabilitare la diagnostica
  - H2: Correlati

## gateway/discovery.md

- Route: /gateway/discovery
- Intestazioni:
  - H2: Termini
  - H2: Perché manteniamo sia diretto sia SSH
  - H2: Input di Discovery (come i client scoprono dove si trova il gateway)
  - H3: 1) Discovery Bonjour / DNS-SD
  - H4: Dettagli del beacon di servizio
  - H3: 2) Tailnet (tra reti)
  - H3: 3) Target manuale / SSH
  - H2: Selezione del trasporto (policy client)
  - H2: Abbinamento + auth (trasporto diretto)
  - H2: Responsabilità per componente
  - H2: Correlati

## gateway/doctor.md

- Route: /gateway/doctor
- Intestazioni:
  - H2: Avvio rapido
  - H3: Modalità headless e automazione
  - H2: Modalità lint di sola lettura
  - H2: Cosa fa (riepilogo)
  - H2: Backfill e reset dell'interfaccia Dreams
  - H2: Comportamento dettagliato e motivazione
  - H2: Correlati

## gateway/external-apps.md

- Route: /gateway/external-apps
- Intestazioni:
  - H2: Cosa è disponibile oggi
  - H2: Percorso consigliato
  - H2: Codice dell'app e codice del plugin
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
  - H2: Configurazione del monitor di salute
  - H2: Monitoraggio dell'uptime
  - H3: Esempi di configurazione del servizio di monitoraggio
  - H2: Quando qualcosa fallisce
  - H2: Comando dedicato "health"
  - H2: Correlati

## gateway/heartbeat.md

- Route: /gateway/heartbeat
- Intestazioni:
  - H2: Avvio rapido (principiante)
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
  - H3: Esempi per canale e per account
  - H3: Pattern comuni
  - H2: HEARTBEAT.md (opzionale)
  - H3: Blocchi tasks:
  - H3: L'agente può aggiornare HEARTBEAT.md?
  - H2: Risveglio manuale (on-demand)
  - H2: Consegna del reasoning (opzionale)
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
  - H2: Più gateway (stesso host)
  - H2: Accesso remoto
  - H2: Supervisione e ciclo di vita del servizio
  - H2: Percorso rapido del profilo dev
  - H2: Riferimento rapido del protocollo (vista operatore)
  - H2: Controlli operativi
  - H3: Liveness
  - H3: Readiness
  - H3: Recupero dei gap
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
  - H3: Configurazione ibrida: primario hosted, fallback locale
  - H3: Local-first con rete di sicurezza hosted
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
  - H2: Cattura della console
  - H2: Redazione
  - H2: Log WebSocket del Gateway
  - H3: Stile dei log WS
  - H2: Formattazione della console (logging del sottosistema)
  - H2: Correlati

## gateway/multiple-gateways.md

- Route: /gateway/multiple-gateways
- Intestazioni:
  - H2: Migliore configurazione consigliata
  - H2: Avvio rapido Rescue-Bot
  - H2: Perché funziona
  - H2: Cosa cambia con --profile rescue onboard
  - H2: Configurazione multi-gateway generale
  - H2: Checklist di isolamento
  - H2: Mappatura delle porte (derivata)
  - H2: Note su Browser/CDP (errore comune)
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
  - H2: Contratto degli strumenti chat
  - H3: Campi di richiesta supportati
  - H3: Varianti non supportate
  - H3: Forma della risposta dello strumento non in streaming
  - H3: Forma della risposta dello strumento in streaming
  - H3: Loop di follow-up degli strumenti
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
  - H3: functioncalloutput (strumenti turn-based)
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
  - H3: OpenShell per agente con gateway personalizzato
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
  - H2: Privacy e cattura dei contenuti
  - H2: Campionamento e flush
  - H2: Metriche esportate
  - H3: Utilizzo del modello
  - H3: Flusso dei messaggi
  - H3: Parlato
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
  - H2: Approvazioni dell'abbinamento dei dispositivi
  - H2: Approvazioni dell'abbinamento dei nodi
  - H2: Auth con segreto condiviso

## gateway/pairing.md

- Route: /gateway/pairing
- Intestazioni:
  - H2: Concetti
  - H2: Come funziona l'abbinamento
  - H2: Workflow CLI (adatto a headless)
  - H2: Superficie API (protocollo gateway)
  - H2: Gating dei comandi del nodo (2026.3.31+)
  - H2: Confini di trust degli eventi del nodo (2026.3.31+)
  - H2: Approvazione automatica (app macOS)
  - H2: Approvazione automatica dei dispositivi trusted-CIDR
  - H2: Approvazione automatica dell'upgrade dei metadata
  - H2: Helper per abbinamento QR
  - H2: Località e header inoltrati
  - H2: Archiviazione (locale, privata)
  - H2: Comportamento del trasporto
  - H2: Correlati

## gateway/prometheus.md

- Route: /gateway/prometheus
- Intestazioni:
  - H2: Avvio rapido
  - H2: Metriche esportate
  - H2: Policy delle etichette
  - H2: Ricette PromQL
  - H2: Scegliere tra Prometheus ed esportazione OpenTelemetry
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
  - H3: Caps/comandi/autorizzazioni (nodo)
  - H2: Presence
  - H3: Evento alive in background del nodo
  - H2: Ambito degli eventi broadcast
  - H2: Famiglie comuni di metodi RPC
  - H3: Famiglie comuni di eventi
  - H3: Metodi helper del nodo
  - H3: RPC del registro attività
  - H3: Metodi helper dell'operatore
  - H3: Viste models.list
  - H2: Approvazioni exec
  - H2: Fallback di consegna dell'agente
  - H2: Versionamento
  - H3: Costanti client
  - H2: Auth
  - H2: Identità dispositivo + abbinamento
  - H3: Diagnostica della migrazione dell'auth dispositivo
  - H2: TLS + pinning
  - H2: Ambito
  - H2: Correlati

## gateway/remote-gateway-readme.md

- Percorso: /gateway/remote-gateway-readme
- Intestazioni:
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
- Intestazioni:
  - H2: L'idea centrale
  - H2: Configurazioni VPN e tailnet comuni
  - H3: Gateway sempre attivo nella tua tailnet
  - H3: Il desktop di casa esegue il Gateway
  - H3: Il laptop esegue il Gateway
  - H2: Flusso dei comandi (cosa viene eseguito dove)
  - H2: Tunnel SSH (CLI + strumenti)
  - H2: Valori predefiniti remoti della CLI
  - H2: Precedenza delle credenziali
  - H2: Accesso remoto alla UI di chat
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
  - H3: Bind mount (controllo rapido della sicurezza)
  - H2: Policy degli strumenti: quali strumenti esistono/sono richiamabili
  - H3: Gruppi di strumenti (abbreviazioni)
  - H2: Elevated: "esecuzione sull'host" solo per exec
  - H2: Correzioni comuni per la "gabbia sandbox"
  - H3: "Strumento X bloccato dalla policy degli strumenti sandbox"
  - H3: "Pensavo fosse main, perché è in sandbox?"
  - H2: Correlati

## gateway/sandboxing.md

- Percorso: /gateway/sandboxing
- Intestazioni:
  - H2: Cosa viene isolato in sandbox
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
  - H2: setupCommand (configurazione una tantum del container)
  - H2: Policy degli strumenti e vie di uscita
  - H2: Override multi-agente
  - H2: Esempio minimo di abilitazione
  - H2: Correlati

## gateway/secrets-plan-contract.md

- Percorso: /gateway/secrets-plan-contract
- Intestazioni:
  - H2: Forma del file di piano
  - H2: Upsert ed eliminazioni del provider
  - H2: Ambito di destinazione supportato
  - H2: Comportamento del tipo di destinazione
  - H2: Regole di validazione dei percorsi
  - H2: Comportamento in caso di errore
  - H2: Comportamento del consenso del provider exec
  - H2: Note su runtime e ambito di audit
  - H2: Controlli dell'operatore
  - H2: Documenti correlati

## gateway/secrets.md

- Percorso: /gateway/secrets
- Intestazioni:
  - H2: Obiettivi e modello runtime
  - H2: Confine di accesso dell'agente
  - H2: Filtro della superficie attiva
  - H2: Diagnostica della superficie di autenticazione del Gateway
  - H2: Preflight di riferimento dell'onboarding
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
  - H2: Workflow di audit e configurazione
  - H2: Policy di sicurezza unidirezionale
  - H2: Note sulla compatibilità dell'autenticazione legacy
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
  - H2: Controlli di baseline
  - H2: Baseline minima sicura
  - H2: Esposizione di DM e gruppi
  - H2: Controlli del proxy inverso
  - H2: Revisione di strumenti e sandbox
  - H2: Validazione post-modifica
  - H2: Piano di rollback
  - H2: Checklist di revisione

## gateway/security/index.md

- Percorso: /gateway/security
- Intestazioni:
  - H2: Prima l'ambito: modello di sicurezza dell'assistente personale
  - H2: Controllo rapido: openclaw security audit
  - H3: Blocco delle dipendenze dei pacchetti pubblicati
  - H3: Distribuzione e fiducia nell'host
  - H3: Operazioni sicure sui file
  - H3: Workspace Slack condiviso: rischio reale
  - H3: Agente condiviso in azienda: pattern accettabile
  - H2: Concetto di fiducia tra Gateway e node
  - H2: Matrice dei confini di fiducia
  - H2: Non vulnerabilità per progettazione
  - H2: Baseline rafforzata in 60 secondi
  - H2: Regola rapida per inbox condivisa
  - H2: Modello di visibilità del contesto
  - H2: Cosa controlla l'audit (ad alto livello)
  - H2: Mappa di archiviazione delle credenziali
  - H2: Checklist dell'audit di sicurezza
  - H2: Glossario dell'audit di sicurezza
  - H2: UI di controllo su HTTP
  - H2: Riepilogo dei flag non sicuri o pericolosi
  - H2: Configurazione del proxy inverso
  - H2: Note su HSTS e origine
  - H2: I log delle sessioni locali risiedono su disco
  - H2: Esecuzione del Node (system.run)
  - H2: Skills dinamiche (watcher / node remoti)
  - H2: Il modello di minaccia
  - H2: Concetto centrale: controllo degli accessi prima dell'intelligenza
  - H2: Modello di autorizzazione dei comandi
  - H2: Rischio degli strumenti del control plane
  - H2: Plugins
  - H2: Modello di accesso DM: pairing, allowlist, aperto, disabilitato
  - H2: Isolamento delle sessioni DM (modalità multiutente)
  - H3: Modalità DM sicura (consigliata)
  - H2: Allowlists per DM e gruppi
  - H2: Prompt injection (cos'è, perché è importante)
  - H2: Sanitizzazione dei token speciali nei contenuti esterni
  - H2: Flag di bypass non sicuri dei contenuti esterni
  - H3: La prompt injection non richiede DM pubblici
  - H3: Backend LLM self-hosted
  - H3: Forza del modello (nota di sicurezza)
  - H2: Ragionamento e output verboso nei gruppi
  - H2: Esempi di hardening della configurazione
  - H3: Permessi dei file
  - H3: Esposizione di rete (bind, porta, firewall)
  - H3: Pubblicazione delle porte Docker con UFW
  - H3: Discovery mDNS/Bonjour
  - H3: Bloccare il WebSocket del Gateway (autenticazione locale)
  - H3: Header di identità Tailscale Serve
  - H3: Controllo del browser tramite host node (consigliato)
  - H3: Segreti su disco
  - H3: File .env del workspace
  - H3: Log e trascrizioni (redazione e conservazione)
  - H3: DM: pairing predefinito
  - H3: Gruppi: richiedere la menzione ovunque
  - H3: Numeri separati (WhatsApp, Signal, Telegram)
  - H3: Modalità sola lettura (tramite sandbox e strumenti)
  - H3: Baseline sicura (copia/incolla)
  - H2: Sandboxing (consigliato)
  - H3: Guardrail per la delega a sub-agenti
  - H2: Rischi del controllo del browser
  - H3: Policy SSRF del browser (rigorosa per impostazione predefinita)
  - H2: Profili di accesso per agente (multi-agente)
  - H3: Esempio: accesso completo (nessuna sandbox)
  - H3: Esempio: strumenti di sola lettura + workspace di sola lettura
  - H3: Esempio: nessun accesso a filesystem/shell (messaggistica del provider consentita)
  - H2: Risposta agli incidenti
  - H3: Contenere
  - H3: Ruotare (presumere la compromissione se sono trapelati segreti)
  - H3: Audit
  - H3: Raccogliere per un report
  - H2: Scansione dei segreti
  - H2: Segnalare problemi di sicurezza

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
  - H2: Per saperne di più
  - H2: Correlati

## gateway/tools-invoke-http-api.md

- Percorso: /gateway/tools-invoke-http-api
- Intestazioni:
  - H2: Autenticazione
  - H2: Confine di sicurezza (importante)
  - H2: Corpo della richiesta
  - H2: Policy + comportamento di routing
  - H2: Risposte
  - H2: Esempio
  - H2: Correlati

## gateway/troubleshooting.md

- Percorso: /gateway/troubleshooting
- Intestazioni:
  - H2: Scala dei comandi
  - H2: Dopo un aggiornamento
  - H2: Installazioni split brain e guardia per configurazioni più recenti
  - H2: Mancata corrispondenza del protocollo dopo il rollback
  - H2: Symlink Skill saltato perché evade dal percorso
  - H2: Anthropic 429 richiede utilizzo extra per il contesto lungo
  - H2: Risposte upstream 403 bloccate
  - H2: Il backend locale compatibile con OpenAI supera i probe diretti ma le esecuzioni dell'agente falliscono
  - H2: Nessuna risposta
  - H2: Connettività della UI di controllo della dashboard
  - H3: Mappa rapida dei codici di dettaglio dell'autenticazione
  - H2: Servizio Gateway non in esecuzione
  - H2: Il gateway macOS smette silenziosamente di rispondere, poi riprende quando tocchi la dashboard
  - H2: Il Gateway si chiude durante l'uso elevato di memoria
  - H2: Il Gateway ha rifiutato una configurazione non valida
  - H2: Avvisi dei probe del Gateway
  - H2: Canale connesso, messaggi non in transito
  - H2: Consegna di Cron e Heartbeat
  - H2: Node associato, strumento non riuscito
  - H2: Strumento browser non riuscito
  - H2: Se hai aggiornato e qualcosa si è improvvisamente rotto
  - H2: Correlati

## gateway/trusted-proxy-auth.md

- Percorso: /gateway/trusted-proxy-auth
- Intestazioni:
  - H2: Quando usarlo
  - H2: Quando NON usarlo
  - H2: Come funziona
  - H2: Comportamento di pairing della UI di controllo
  - H2: Configurazione
  - H3: Riferimento di configurazione
  - H2: Terminazione TLS e HSTS
  - H3: Indicazioni per il rollout
  - H2: Esempi di configurazione del proxy
  - H2: Configurazione mista dei token
  - H2: Header degli ambiti operatore
  - H2: Checklist di sicurezza
  - H2: Audit di sicurezza
  - H2: Risoluzione dei problemi
  - H2: Migrazione dall'autenticazione con token
  - H2: Correlati

## help/debugging.md

- Percorso: /help/debugging
- Intestazioni:
  - H2: Override di debug del runtime
  - H2: Output di traccia della sessione
  - H2: Traccia del ciclo di vita del Plugin
  - H2: Avvio CLI e profilazione dei comandi
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
- Intestazioni:
  - H2: Precedenza (dalla più alta alla più bassa)
  - H2: Credenziali del provider e .env del workspace
  - H2: Blocco env della configurazione
  - H2: Importazione env dalla shell
  - H2: Snapshot della shell exec
  - H2: Variabili env iniettate dal runtime
  - H2: Variabili env della UI
  - H2: Sostituzione delle variabili env nella configurazione
  - H2: Secret refs vs stringhe ${ENV}
  - H2: Variabili env relative ai percorsi
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
  - H2: Modelli: valori predefiniti, selezione, alias, cambio
  - H2: Failover dei modelli e "Tutti i modelli non sono riusciti"
  - H2: Profili di autenticazione: cosa sono e come gestirli
  - H2: Correlati

## help/faq.md

- Percorso: /help/faq
- Intestazioni:
  - H2: Primi 60 secondi se qualcosa non funziona
  - H2: Avvio rapido e configurazione al primo avvio
  - H2: Che cos'è OpenClaw?
  - H2: Skills e automazione
  - H2: Sandboxing e memoria
  - H2: Dove risiedono le cose su disco
  - H2: Basi della configurazione
  - H2: Gateway e node remoti
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
- Intestazioni:
  - H2: FAQ
  - H2: Diagnostica
  - H2: Test
  - H2: Community e metadati

## help/scripts.md

- Percorso: /help/scripts
- Intestazioni:
  - H2: Convenzioni
  - H2: Script di monitoraggio dell'autenticazione
  - H2: Helper di lettura GitHub
  - H2: Quando aggiungere script
  - H2: Correlati

## help/testing-live.md

- Percorso: /help/testing-live
- Intestazioni:
  - H2: Live: comandi di smoke test locali
  - H2: Live: sweep delle capacità del nodo Android
  - H2: Live: smoke test dei modelli (chiavi profilo)
  - H3: Livello 1: completamento diretto del modello (nessun Gateway)
  - H3: Livello 2: Gateway + smoke test dell'agente di sviluppo (cosa fa davvero "@openclaw")
  - H2: Live: smoke test del backend CLI (Claude, Gemini o altre CLI locali)
  - H2: Live: raggiungibilità del proxy APNs HTTP/2
  - H2: Live: smoke test del bind ACP (/acp spawn ... --bind here)
  - H2: Live: smoke test dell'harness app-server Codex
  - H3: Ricette live consigliate
  - H2: Live: matrice dei modelli (cosa copriamo)
  - H3: Set di smoke test moderno (chiamata di strumenti + immagine)
  - H3: Baseline: chiamata di strumenti (Read + Exec opzionale)
  - H3: Visione: invio immagine (allegato → messaggio multimodale)
  - H3: Aggregatori / Gateway alternativi
  - H2: Credenziali (mai committare)
  - H2: Deepgram live (trascrizione audio)
  - H2: Piano di coding BytePlus live
  - H2: Media workflow ComfyUI live
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
  - H2: Predefinito di release
  - H2: Compatibilità legacy
  - H2: Aggiunta di copertura
  - H2: Triage degli errori

## help/testing.md

- Percorso: /help/testing
- Intestazioni:
  - H2: Avvio rapido
  - H2: Directory temporanee di test
  - H2: Runner specifici per QA
  - H3: Credenziali Telegram condivise tramite Convex (v1)
  - H3: Aggiunta di un canale a QA
  - H2: Suite di test (cosa gira dove)
  - H3: Unità / integrazione (predefinito)
  - H3: Stabilità (Gateway)
  - H3: E2E (aggregato del repository)
  - H3: E2E (smoke test del Gateway)
  - H3: E2E (browser mockato della Control UI)
  - H3: E2E: smoke test del backend OpenShell
  - H3: Live (provider reali + modelli reali)
  - H2: Quale suite devo eseguire?
  - H2: Test live (che toccano la rete)
  - H2: Runner Docker (controlli opzionali "funziona su Linux")
  - H2: Sanity check della documentazione
  - H2: Regressione offline (sicura per CI)
  - H2: Valutazioni di affidabilità degli agenti (Skills)
  - H2: Test di contratto (forma di Plugin e canale)
  - H3: Comandi
  - H3: Contratti dei canali
  - H3: Contratti di stato dei provider
  - H3: Contratti dei provider
  - H3: Quando eseguire
  - H2: Aggiunta di regressioni (linee guida)
  - H2: Correlati

## help/troubleshooting.md

- Percorso: /help/troubleshooting
- Intestazioni:
  - H2: Primi 60 secondi
  - H2: L'assistente sembra limitato o senza strumenti
  - H2: Contesto lungo Anthropic 429
  - H2: Il backend locale compatibile con OpenAI funziona direttamente ma non in OpenClaw
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
  - H2: Capacità principali
  - H2: Avvio rapido
  - H2: Dashboard
  - H2: Configurazione (opzionale)
  - H2: Inizia qui
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
  - H2: Configurare il deployment
  - H2: Distribuire le risorse Azure
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
  - H2: Flusso iniziale
  - H2: Configurazione e segreti
  - H2: Correlati

## install/development-channels.md

- Percorso: /install/development-channels
- Intestazioni:
  - H2: Cambio dei canali
  - H2: Targeting one-off di versione o tag
  - H2: Dry run
  - H2: Plugin e canali
  - H2: Controllo dello stato attuale
  - H2: Best practice per i tag
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
  - H2: Includere i binari richiesti nell'immagine
  - H2: Build e avvio
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
  - H3: Helper shell (opzionali)
  - H3: Esecuzione su un VPS?
  - H2: Sandbox dell'agente
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
  - H2: 4) Configurare nginx per fare da proxy a OpenClaw sulla porta 8000
  - H2: 5) Accedere a OpenClaw e concedere i privilegi
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
  - H2: Deployment privato (rafforzato)
  - H3: Quando usare un deployment privato
  - H3: Configurazione
  - H3: Accesso a un deployment privato
  - H3: Webhook con deployment privato
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
  - H2: Verificare la configurazione
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
  - H3: Dal sorgente
  - H3: Installazione dal checkout main di GitHub
  - H3: Container e package manager
  - H2: Verificare l'installazione
  - H2: Hosting e deployment
  - H2: Aggiornare, migrare o disinstallare
  - H2: Risoluzione dei problemi: openclaw non trovato

## install/installer.md

- Percorso: /install/installer
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

- Percorso: /install/kubernetes
- Intestazioni:
  - H2: Perché non Helm?
  - H2: Cosa ti serve
  - H2: Avvio rapido
  - H2: Test locale con Kind
  - H2: Passo dopo passo
  - H3: 1) Deploy
  - H3: 2) Accedere al Gateway
  - H2: Cosa viene distribuito
  - H2: Personalizzazione
  - H3: Istruzioni dell'agente
  - H3: Configurazione del Gateway
  - H3: Aggiungere provider
  - H3: Namespace personalizzato
  - H3: Immagine personalizzata
  - H3: Esporre oltre il port-forward
  - H2: Nuovo deploy
  - H2: Smontaggio
  - H2: Note architetturali
  - H2: Struttura dei file
  - H2: Correlati

## install/macos-vm.md

- Percorso: /install/macos-vm
- Intestazioni:
  - H2: Predefinito consigliato (per la maggior parte degli utenti)
  - H2: Opzioni VM macOS
  - H3: VM locale sul tuo Mac Apple Silicon (Lume)
  - H3: Provider Mac gestiti (cloud)
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
  - H3: Errori comuni
  - H3: Checklist di verifica
  - H2: Aggiornare un Plugin in loco
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
  - H2: Controllare la versione
  - H2: Installare Node
  - H2: Risoluzione dei problemi
  - H3: openclaw: comando non trovato
  - H3: Errori di permesso su npm install -g (Linux)
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
  - H2: Configurazione, env e archiviazione
  - H2: Comandi utili
  - H2: Risoluzione dei problemi
  - H2: Correlati

## install/railway.mdx

- Percorso: /install/railway
- Intestazioni:
  - H1: Railway
  - H2: Checklist rapida (nuovi utenti)
  - H2: Deploy con un clic
  - H2: Cosa ottieni
  - H2: Impostazioni Railway richieste
  - H3: Networking pubblico
  - H3: Volume (richiesto)
  - H3: Variabili
  - H2: Collegare un canale
  - H2: Backup &amp; migrazione
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
  - H2: Distribuire con un Blueprint Render
  - H2: Comprendere il Blueprint
  - H2: Scegliere un piano
  - H2: Dopo la distribuzione
  - H3: Accedere alla Control UI
  - H2: Funzionalità della Dashboard Render
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
  - H3: Errori del controllo di integrità
  - H2: Passaggi successivi

## install/uninstall.md

- Percorso: /install/uninstall
- Intestazioni:
  - H2: Percorso semplice (CLI ancora installata)
  - H2: Rimozione manuale del servizio (CLI non installata)
  - H3: macOS (launchd)
  - H3: Linux (unità utente systemd)
  - H3: Windows (Attività pianificata)
  - H2: Installazione normale vs checkout del sorgente
  - H3: Installazione normale (install.sh / npm / pnpm / bun)
  - H3: Checkout del sorgente (git clone)
  - H2: Correlati

## install/updating.md

- Percorso: /install/updating
- Intestazioni:
  - H2: Consigliato: openclaw update
  - H2: Passare tra installazioni npm e git
  - H2: Alternativa: rieseguire il programma di installazione
  - H2: Alternativa: npm, pnpm o bun manuale
  - H3: Argomenti avanzati sull'installazione npm
  - H2: Aggiornamento automatico
  - H2: Dopo l'aggiornamento
  - H3: Eseguire doctor
  - H3: Riavviare il gateway
  - H3: Verificare
  - H2: Rollback
  - H3: Fissare una versione (npm)
  - H3: Fissare un commit (sorgente)
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
  - H3: Dimensioni e tempi delle chiamate al modello
  - H3: Stili della console
  - H3: Redazione
  - H2: Diagnostica e OpenTelemetry
  - H2: Suggerimenti per la risoluzione dei problemi
  - H2: Correlati

## maturity/scorecard.md

- Percorso: /maturity/scorecard
- Intestazioni:
  - H1: Scheda punteggio maturità
  - H2: A cosa serve questa pagina
  - H2: Panoramica
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
  - H2: Aree del prodotto
  - H2: Dettagli
  - H3: Core
  - H3: Piattaforma
  - H3: Canale
  - H3: Provider e strumento

## network.md

- Percorso: /network
- Intestazioni:
  - H2: Modello di base
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
  - H3: Solo Provider con gate per ambito
  - H3: Solo Provider (Deepgram)
  - H3: Solo Provider (Mistral Voxtral)
  - H3: Solo Provider (SenseAudio)
  - H3: Trascrizione echo nella chat (opt-in)
  - H2: Note e limiti
  - H3: Supporto dell'ambiente proxy
  - H2: Rilevamento delle menzioni nei gruppi
  - H2: Insidie
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
  - H3: Impostazione utente (disattivata per impostazione predefinita)
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
  - H2: Host nodo remoto (system.run)
  - H3: Cosa viene eseguito dove
  - H3: Avviare un host nodo (primo piano)
  - H3: Gateway remoto tramite tunnel SSH (bind loopback)
  - H3: Avviare un host nodo (servizio)
  - H3: Associare + assegnare un nome
  - H3: Aggiungere i comandi all'elenco consentiti
  - H3: Puntare exec al nodo
  - H3: Inferenza del modello locale
  - H2: Invocare comandi
  - H2: Criteri dei comandi
  - H2: Configurazione (openclaw.json)
  - H2: Screenshot (snapshot canvas)
  - H3: Controlli canvas
  - H3: A2UI (Canvas)
  - H2: Foto + video (fotocamera del nodo)
  - H2: Registrazioni dello schermo (nodi)
  - H2: Posizione (nodi)
  - H2: SMS (nodi Android)
  - H2: Dispositivo Android + comandi per dati personali
  - H2: Comandi di sistema (host nodo / nodo Mac)
  - H2: Binding nodo exec
  - H2: Mappa delle autorizzazioni
  - H2: Host nodo headless (multipiattaforma)
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
  - H2: Capacità (facoltative)
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
  - H2: Archiviazione (host Gateway)
  - H2: Protocollo
  - H3: Metodi
  - H3: Metodi di routing (trigger → destinazione)
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
  - H2: Non obiettivi
  - H2: Architettura attuale
  - H2: Lacuna attuale
  - H2: Comportamento desiderato
  - H2: Vincoli di progettazione
  - H3: L'app-server Codex resta canonico per lo stato nativo dei thread
  - H3: L'assemblaggio del context engine deve essere proiettato negli input Codex
  - H3: La stabilità della cache dei prompt è importante
  - H3: La semantica di selezione del runtime non cambia
  - H2: Piano di implementazione
  - H3: 1. Esportare o ricollocare gli helper riutilizzabili dei tentativi del context engine
  - H3: 2. Aggiungere un helper di proiezione del contesto Codex
  - H3: 3. Collegare il bootstrap prima dell'avvio del thread Codex
  - H3: 4. Collegare assemble prima di thread/start / thread/resume e turn/start
  - H3: 5. Preservare la formattazione stabile per la cache dei prompt
  - H3: 6. Collegare il post-turn dopo il mirroring della trascrizione
  - H3: 7. Normalizzare l'utilizzo e il contesto runtime della cache dei prompt
  - H3: 8. Criteri di Compaction
  - H4: /compact e Compaction OpenClaw esplicita
  - H4: Eventi nativi Codex contextCompaction durante il turno
  - H3: 9. Ripristino della sessione e comportamento di binding
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
  - H2: Passaggi di refactor
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
  - H3: 2) Verificare il rilevamento (facoltativo)
  - H4: Rilevamento Tailnet (Vienna ⇄ Londra) tramite DNS-SD unicast
  - H3: 3) Connettersi da Android
  - H3: Beacon di presenza attiva
  - H3: 4) Approvare l'associazione (CLI)
  - H3: 5) Verificare che il nodo sia connesso
  - H3: 6) Chat + cronologia
  - H3: 7) Canvas + fotocamera
  - H4: Gateway Canvas Host (consigliato per contenuti web)
  - H3: 8) Voce + superficie di comandi Android estesa
  - H2: Entry point dell'assistente
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
  - H2: Scegliere il sistema operativo
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
  - H2: Push supportato da relay per build ufficiali
  - H2: Beacon di attività in background
  - H2: Flusso di autenticazione e fiducia
  - H2: Percorsi di rilevamento
  - H3: Bonjour (LAN)
  - H3: Tailnet (cross-network)
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
  - H2: Pressione sulla memoria e terminazioni OOM
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
  - H2: Attivare esecuzioni dell'agente da Canvas
  - H2: Note sulla sicurezza
  - H2: Correlati

## platforms/mac/child-process.md

- Percorso: /platforms/mac/child-process
- Intestazioni:
  - H2: Comportamento predefinito (launchd)
  - H2: Build di sviluppo non firmate
  - H2: Modalità solo attach
  - H2: Modalità remota
  - H2: Perché preferiamo launchd
  - H2: Correlati

## platforms/mac/dev-setup.md

- Percorso: /platforms/mac/dev-setup
- Intestazioni:
  - H1: Configurazione per sviluppatori macOS
  - H2: Prerequisiti
  - H2: 1. Installare le dipendenze
  - H2: 2. Compilare e pacchettizzare l'app
  - H2: 3. Installare CLI e Gateway
  - H2: Risoluzione dei problemi
  - H3: La build non riesce: mancata corrispondenza tra toolchain o SDK
  - H3: L'app va in crash alla concessione dei permessi
  - H3: Gateway "Starting..." indefinitamente
  - H2: Correlati

## platforms/mac/health.md

- Percorso: /platforms/mac/health
- Intestazioni:
  - H1: Controlli di integrità su macOS
  - H2: Barra dei menu
  - H2: Impostazioni
  - H2: Come funziona la sonda
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
  - H2: Log diagnostico su file con rotazione (pannello Debug)
  - H2: Dati privati del logging unificato su macOS
  - H2: Abilitare per OpenClaw (ai.openclaw)
  - H2: Disabilitare dopo il debug
  - H2: Correlati

## platforms/mac/menu-bar.md

- Percorso: /platforms/mac/menu-bar
- Intestazioni:
  - H2: Cosa viene mostrato
  - H2: Modello di stato
  - H2: Enum IconState (Swift)
  - H3: ActivityKind → glifo
  - H3: Mappatura visiva
  - H2: Sottomenu contestuale
  - H2: Testo della riga di stato (menu)
  - H2: Acquisizione degli eventi
  - H2: Override di debug
  - H2: Checklist di test
  - H2: Correlati

## platforms/mac/peekaboo.md

- Percorso: /platforms/mac/peekaboo
- Intestazioni:
  - H2: Che cos'è (e che cosa non è)
  - H2: Relazione con Computer Use
  - H2: Abilitare il bridge
  - H2: Ordine di discovery del client
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
  - H2: Permessi per file e cartelle (Desktop/Documenti/Download)
  - H2: Correlati

## platforms/mac/remote.md

- Percorso: /platforms/mac/remote
- Intestazioni:
  - H2: Modalità
  - H2: Trasporti remoti
  - H2: Prerequisiti sull'host remoto
  - H2: Configurazione dell'app macOS
  - H2: Web Chat
  - H2: Permessi
  - H2: Note sulla sicurezza
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
  - H1: Ciclo di vita del Voice Overlay (macOS)
  - H2: Intento attuale
  - H2: Implementato (9 dic 2025)
  - H2: Prossimi passaggi
  - H2: Checklist di debug
  - H2: Passaggi di migrazione (suggeriti)
  - H2: Correlati

## platforms/mac/voicewake.md

- Percorso: /platforms/mac/voicewake
- Intestazioni:
  - H1: Attivazione vocale &amp; Push-to-Talk
  - H2: Requisiti
  - H2: Modalità
  - H2: Comportamento runtime (wake-word)
  - H2: Invarianti del ciclo di vita
  - H2: Modalità di errore overlay persistente (precedente)
  - H2: Dettagli specifici del push-to-talk
  - H2: Impostazioni rivolte all'utente
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
  - H3: Gateway + trasporto node
  - H3: Servizio Node + IPC app
  - H3: PeekabooBridge (automazione UI)
  - H2: Flussi operativi
  - H2: Note di hardening
  - H2: Correlati

## platforms/macos.md

- Percorso: /platforms/macos
- Intestazioni:
  - H2: Download
  - H2: Primo avvio
  - H2: Scegliere una modalità Gateway
  - H2: Che cosa gestisce l'app
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
  - H2: Avvio automatico del Gateway prima del login a Windows
  - H2: Esporre i servizi WSL sulla LAN
  - H2: Risoluzione dei problemi
  - H3: L'icona nella tray non appare
  - H3: La configurazione locale non riesce
  - H3: L'app indica che è richiesto l'abbinamento
  - H3: La chat web non riesce a raggiungere un Gateway remoto
  - H3: I comandi screen.snapshot, camera o audio non riescono
  - H3: La connettività Git o GitHub non riesce
  - H2: Correlati

## plugins/adding-capabilities.md

- Percorso: /plugins/adding-capabilities
- Intestazioni:
  - H2: Quando creare una capability
  - H2: La sequenza standard
  - H2: Cosa va dove
  - H2: Confini tra provider e harness
  - H2: Checklist dei file
  - H2: Esempio completo: generazione di immagini
  - H2: Provider di embedding
  - H2: Checklist di revisione
  - H2: Correlati

## plugins/admin-http-rpc.md

- Percorso: /plugins/admin-http-rpc
- Intestazioni:
  - H2: Prima di abilitarlo
  - H2: Abilitare
  - H2: Verificare la route
  - H2: Autenticazione
  - H2: Modello di sicurezza
  - H2: Richiesta
  - H2: Risposta
  - H2: Metodi consentiti
  - H2: Confronto WebSocket
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
  - H2: Modello del registro
  - H2: Callback di binding delle conversazioni
  - H2: Hook runtime dei provider
  - H3: Ordine e uso degli hook
  - H3: Esempio di provider
  - H3: Esempi integrati
  - H2: Helper runtime
  - H3: api.runtime.imageGeneration
  - H2: Route HTTP del Gateway
  - H2: Percorsi di importazione del Plugin SDK
  - H2: Schemi degli strumenti di messaggistica
  - H2: Risoluzione del target del canale
  - H2: Directory basate sulla configurazione
  - H2: Cataloghi dei provider
  - H2: Ispezione del canale in sola lettura
  - H2: Pacchetti di package
  - H3: Metadati del catalogo canali
  - H2: Plugin del motore di contesto
  - H2: Aggiungere una nuova capability
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
  - H3: Plugin di canale e strumento di messaggistica condiviso
  - H2: Modello di ownership delle capability
  - H3: Stratificazione delle capability
  - H3: Esempio di Plugin aziendale multi-capability
  - H3: Esempio di capability: comprensione video
  - H2: Contratti e enforcement
  - H3: Cosa rientra in un contratto
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
  - H2: Scegliere la forma del Plugin
  - H2: Quickstart
  - H2: Registrazione degli strumenti
  - H2: Convenzioni di importazione
  - H2: Checklist prima dell'invio
  - H2: Testare con le release beta
  - H2: Passaggi successivi
  - H2: Correlati

## plugins/bundles.md

- Percorso: /plugins/bundles
- Intestazioni:
  - H2: Perché esistono i bundle
  - H2: Installare un bundle
  - H2: Cosa OpenClaw mappa dai bundle
  - H3: Attualmente supportato
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

- Percorso: /plugins/cli-backend-plugins
- Intestazioni:
  - H2: Cosa gestisce il Plugin
  - H2: Plugin backend minimale
  - H2: Forma della configurazione
  - H2: Hook backend avanzati
  - H3: ownsNativeCompaction: disattivare la Compaction di OpenClaw
  - H2: Bridge per strumenti MCP
  - H2: Configurazione utente
  - H2: Verifica
  - H2: Checklist
  - H2: Correlati

## plugins/codex-computer-use.md

- Percorso: /plugins/codex-computer-use
- Intestazioni:
  - H2: OpenClaw.app e Peekaboo
  - H2: App iOS
  - H2: cua-driver MCP diretto
  - H2: Configurazione rapida
  - H2: Comandi
  - H2: Scelte nel marketplace
  - H2: Marketplace macOS in bundle
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
  - H2: Discovery dei modelli
  - H2: File di bootstrap del workspace
  - H2: Override dell'ambiente
  - H2: Correlati

## plugins/codex-harness-runtime.md

- Percorso: /plugins/codex-harness-runtime
- Intestazioni:
  - H2: Panoramica
  - H2: Binding dei thread e modifiche del modello
  - H2: Risposte visibili e Heartbeat
  - H2: Confini degli hook
  - H2: Contratto di supporto V1
  - H2: Permessi nativi e richieste MCP
  - H2: Instradamento della coda
  - H2: Caricamento del feedback Codex
  - H2: Compaction e mirror della trascrizione
  - H2: Media e consegna
  - H2: Correlati

## plugins/codex-harness.md

- Percorso: /plugins/codex-harness
- Intestazioni:
  - H2: Requisiti
  - H2: Quickstart
  - H2: Condividere thread con Codex Desktop e CLI
  - H2: Configurazione
  - H2: Verificare il runtime Codex
  - H2: Routing e selezione del modello
  - H2: Pattern di distribuzione
  - H3: Distribuzione Codex di base
  - H3: Distribuzione con provider misti
  - H3: Distribuzione Codex fail-closed
  - H2: Policy app-server
  - H2: Comandi e diagnostica
  - H3: Ispezionare localmente i thread Codex
  - H2: Plugin Codex nativi
  - H2: Computer Use
  - H2: Confini runtime
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/codex-native-plugins.md

- Percorso: /plugins/codex-native-plugins
- Intestazioni:
  - H2: Requisiti
  - H2: Quickstart
  - H2: Gestire i Plugin dalla chat
  - H2: Come funziona la configurazione dei Plugin nativi
  - H2: Confine di supporto V1
  - H2: Inventario app e ownership
  - H2: Configurazione app del thread
  - H2: Policy sulle azioni distruttive
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/community.md

- Percorso: /plugins/community
- Intestazioni:
  - H2: Trovare Plugin
  - H2: Pubblicare Plugin
  - H2: Correlati

## plugins/compatibility.md

- Percorso: /plugins/compatibility
- Intestazioni:
  - H2: Registro di compatibilità
  - H2: Package inspector dei Plugin
  - H3: Lane di accettazione del maintainer
  - H2: Policy di deprecazione
  - H2: Aree di compatibilità attuali
  - H3: Alias piatti dei callback in ingresso WhatsApp
  - H3: Campi di ammissione in ingresso WhatsApp
  - H2: Note di release

## plugins/copilot.md

- Percorso: /plugins/copilot
- Intestazioni:
  - H2: Requisiti
  - H2: Installazione del Plugin
  - H2: Quickstart
  - H2: Provider supportati
  - H2: BYOK
  - H2: Auth
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
  - H2: Root di installazione
  - H2: Plugin locali
  - H2: Avvio e ricaricamento
  - H2: Plugin in bundle
  - H2: Pulizia legacy

## plugins/google-meet.md

- Percorso: /plugins/google-meet
- Titoli:
  - H2: Avvio rapido
  - H3: Gateway locale + Parallels Chrome
  - H2: Note di installazione
  - H2: Trasporti
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth e preflight
  - H3: Crea le credenziali Google
  - H3: Genera il refresh token
  - H3: Verifica OAuth con doctor
  - H2: Configurazione
  - H2: Strumento
  - H2: Modalità agente e bidi
  - H2: Checklist per il test live
  - H2: Risoluzione dei problemi
  - H3: L'agente non riesce a vedere lo strumento Google Meet
  - H3: Nessun Node connesso compatibile con Google Meet
  - H3: Il browser si apre ma l'agente non riesce a partecipare
  - H3: La creazione della riunione non riesce
  - H3: L'agente partecipa ma non parla
  - H3: I controlli di configurazione Twilio non riescono
  - H3: La chiamata Twilio parte ma non entra mai nella riunione
  - H2: Note
  - H2: Correlati

## plugins/hooks.md

- Percorso: /plugins/hooks
- Titoli:
  - H2: Avvio rapido
  - H2: Catalogo degli hook
  - H2: Debug degli hook di runtime
  - H2: Criterio delle chiamate agli strumenti
  - H3: Hook dell'ambiente di esecuzione
  - H3: Persistenza dei risultati degli strumenti
  - H2: Hook di prompt e modello
  - H3: Estensioni di sessione e iniezioni del turno successivo
  - H2: Hook dei messaggi
  - H2: Hook di installazione
  - H2: Ciclo di vita del Gateway
  - H2: Deprecazioni imminenti
  - H2: Correlati

## plugins/install-overrides.md

- Percorso: /plugins/install-overrides
- Titoli:
  - H2: Ambiente
  - H2: Comportamento
  - H2: E2E del pacchetto

## plugins/llama-cpp.md

- Percorso: /plugins/llama-cpp
- Titoli:
  - H2: Configurazione
  - H2: Runtime nativo

## plugins/manage-plugins.md

- Percorso: /plugins/manage-plugins
- Titoli:
  - H2: Elencare e cercare i plugin
  - H2: Installare i plugin
  - H2: Riavviare e ispezionare
  - H2: Aggiornare i plugin
  - H2: Disinstallare i plugin
  - H2: Scegliere una sorgente
  - H2: Pubblicare i plugin
  - H2: Correlati

## plugins/manifest.md

- Percorso: /plugins/manifest
- Titoli:
  - H2: Cosa fa questo file
  - H2: Esempio minimale
  - H2: Esempio completo
  - H2: Riferimento dei campi di primo livello
  - H2: Riferimento dei metadati del provider di generazione
  - H2: Riferimento dei metadati degli strumenti
  - H2: Riferimento di providerAuthChoices
  - H2: Riferimento di commandAliases
  - H2: Riferimento di activation
  - H2: Riferimento di qaRunners
  - H2: Riferimento di setup
  - H3: Riferimento di setup.providers
  - H3: Campi di setup
  - H2: Riferimento di uiHints
  - H2: Riferimento di contracts
  - H2: Riferimento di mediaUnderstandingProviderMetadata
  - H2: Riferimento di channelConfigs
  - H3: Sostituzione di un altro plugin di canale
  - H2: Riferimento di modelSupport
  - H2: Riferimento di modelCatalog
  - H2: Riferimento di modelIdNormalization
  - H2: Riferimento di providerEndpoints
  - H2: Riferimento di providerRequest
  - H2: Riferimento di secretProviderIntegrations
  - H2: Riferimento di modelPricing
  - H3: Indice dei provider OpenClaw
  - H2: Manifesto rispetto a package.json
  - H3: Campi di package.json che influenzano il rilevamento
  - H2: Precedenza del rilevamento (ID plugin duplicati)
  - H2: Requisiti dello schema JSON
  - H2: Comportamento di convalida
  - H2: Note
  - H2: Correlati

## plugins/memory-lancedb.md

- Percorso: /plugins/memory-lancedb
- Titoli:
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
  - H3: Il Plugin viene caricato ma non appare alcun ricordo
  - H2: Correlati

## plugins/memory-wiki.md

- Percorso: /plugins/memory-wiki
- Titoli:
  - H2: Cosa aggiunge
  - H2: Come si integra con la memoria
  - H2: Pattern ibrido consigliato
  - H2: Modalità vault
  - H3: isolata
  - H3: ponte
  - H3: locale non sicura
  - H2: Layout del vault
  - H2: Importazioni Open Knowledge Format
  - H2: Asserzioni strutturate ed evidenze
  - H2: Metadati delle entità rivolti all'agente
  - H2: Pipeline di compilazione
  - H2: Dashboard e report di integrità
  - H2: Ricerca e recupero
  - H2: Strumenti dell'agente
  - H2: Comportamento di prompt e contesto
  - H2: Configurazione
  - H3: Esempio: QMD + modalità ponte
  - H2: CLI
  - H2: Supporto Obsidian
  - H2: Flusso di lavoro consigliato
  - H2: Documentazione correlata

## plugins/message-presentation.md

- Percorso: /plugins/message-presentation
- Titoli:
  - H2: Contratto
  - H2: Esempi di produttori
  - H2: Contratto del renderer
  - H2: Flusso di rendering core
  - H2: Regole di degradazione
  - H3: Visibilità del fallback del valore del pulsante
  - H2: Mappatura del provider
  - H2: Presentazione rispetto a InteractiveReply
  - H2: Pin di consegna
  - H2: Checklist per autori di Plugin
  - H2: Documentazione correlata

## plugins/oc-path.md

- Percorso: /plugins/oc-path
- Titoli:
  - H2: Perché abilitarlo
  - H2: Dove viene eseguito
  - H2: Abilitare
  - H2: Dipendenze
  - H2: Cosa fornisce
  - H2: Relazione con altri plugin
  - H2: Sicurezza
  - H2: Correlati

## plugins/plugin-inventory.md

- Percorso: /plugins/plugin-inventory
- Titoli:
  - H1: Inventario dei Plugin
  - H2: Definizioni
  - H2: Installare un Plugin
  - H2: Pacchetto npm core
  - H2: Pacchetti esterni ufficiali
  - H2: Solo checkout del codice sorgente

## plugins/plugin-permission-requests.md

- Percorso: /plugins/plugin-permission-requests
- Titoli:
  - H2: Scegliere il gate corretto
  - H2: Richiedere l'approvazione prima di una chiamata allo strumento
  - H2: Comportamento delle decisioni
  - H2: Instradare i prompt di approvazione
  - H2: Autorizzazioni native di Codex
  - H2: Risoluzione dei problemi
  - H2: Correlati

## plugins/reference.md

- Percorso: /plugins/reference
- Titoli:
  - H1: Riferimento dei Plugin

## plugins/reference/acpx.md

- Percorso: /plugins/reference/acpx
- Titoli:
  - H1: Plugin ACPx
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/admin-http-rpc.md

- Percorso: /plugins/reference/admin-http-rpc
- Titoli:
  - H1: Plugin Admin Http Rpc
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/alibaba.md

- Percorso: /plugins/reference/alibaba
- Titoli:
  - H1: Plugin Alibaba
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/amazon-bedrock-mantle.md

- Percorso: /plugins/reference/amazon-bedrock-mantle
- Titoli:
  - H1: Plugin Amazon Bedrock Mantle
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/amazon-bedrock.md

- Percorso: /plugins/reference/amazon-bedrock
- Titoli:
  - H1: Plugin Amazon Bedrock
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/anthropic-vertex.md

- Percorso: /plugins/reference/anthropic-vertex
- Titoli:
  - H1: Plugin Anthropic Vertex
  - H2: Distribuzione
  - H2: Superficie
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- Percorso: /plugins/reference/anthropic
- Titoli:
  - H1: Plugin Anthropic
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/arcee.md

- Percorso: /plugins/reference/arcee
- Titoli:
  - H1: Plugin Arcee
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/azure-speech.md

- Percorso: /plugins/reference/azure-speech
- Titoli:
  - H1: Plugin Azure Speech
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/bonjour.md

- Percorso: /plugins/reference/bonjour
- Titoli:
  - H1: Plugin Bonjour
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/brave.md

- Percorso: /plugins/reference/brave
- Titoli:
  - H1: Plugin Brave
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/browser.md

- Percorso: /plugins/reference/browser
- Titoli:
  - H1: Plugin Browser
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/byteplus.md

- Percorso: /plugins/reference/byteplus
- Titoli:
  - H1: Plugin BytePlus
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/canvas.md

- Percorso: /plugins/reference/canvas
- Titoli:
  - H1: Plugin Canvas
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/cerebras.md

- Percorso: /plugins/reference/cerebras
- Titoli:
  - H1: Plugin Cerebras
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/chutes.md

- Percorso: /plugins/reference/chutes
- Titoli:
  - H1: Plugin Chutes
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/clawrouter.md

- Percorso: /plugins/reference/clawrouter
- Titoli:
  - H1: Plugin ClawRouter
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/clickclack.md

- Percorso: /plugins/reference/clickclack
- Titoli:
  - H1: Plugin Clickclack
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/cloudflare-ai-gateway.md

- Percorso: /plugins/reference/cloudflare-ai-gateway
- Titoli:
  - H1: Plugin Cloudflare AI Gateway
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/codex-supervisor.md

- Percorso: /plugins/reference/codex-supervisor
- Titoli:
  - H1: Plugin Codex Supervisor
  - H2: Distribuzione
  - H2: Superficie
  - H2: Elenco delle sessioni

## plugins/reference/codex.md

- Percorso: /plugins/reference/codex
- Titoli:
  - H1: Plugin Codex
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/cohere.md

- Percorso: /plugins/reference/cohere
- Titoli:
  - H1: Plugin Cohere
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/comfy.md

- Percorso: /plugins/reference/comfy
- Titoli:
  - H1: Plugin ComfyUI
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/copilot-proxy.md

- Percorso: /plugins/reference/copilot-proxy
- Titoli:
  - H1: Plugin Copilot Proxy
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/copilot.md

- Percorso: /plugins/reference/copilot
- Titoli:
  - H1: Plugin Copilot
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/deepgram.md

- Percorso: /plugins/reference/deepgram
- Titoli:
  - H1: Plugin Deepgram
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/deepinfra.md

- Percorso: /plugins/reference/deepinfra
- Titoli:
  - H1: Plugin DeepInfra
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/deepseek.md

- Percorso: /plugins/reference/deepseek
- Titoli:
  - H1: Plugin DeepSeek
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/diagnostics-otel.md

- Percorso: /plugins/reference/diagnostics-otel
- Titoli:
  - H1: Plugin Diagnostics OpenTelemetry
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/diagnostics-prometheus.md

- Percorso: /plugins/reference/diagnostics-prometheus
- Titoli:
  - H1: Plugin Diagnostics Prometheus
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/diffs-language-pack.md

- Percorso: /plugins/reference/diffs-language-pack
- Titoli:
  - H1: Plugin Diffs Language Pack
  - H2: Distribuzione
  - H2: Superficie
  - H2: Lingue aggiunte

## plugins/reference/diffs.md

- Percorso: /plugins/reference/diffs
- Titoli:
  - H1: Plugin Diffs
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/discord.md

- Percorso: /plugins/reference/discord
- Titoli:
  - H1: Plugin Discord
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/document-extract.md

- Percorso: /plugins/reference/document-extract
- Titoli:
  - H1: Plugin Document Extract
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/duckduckgo.md

- Percorso: /plugins/reference/duckduckgo
- Titoli:
  - H1: Plugin DuckDuckGo
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/elevenlabs.md

- Percorso: /plugins/reference/elevenlabs
- Titoli:
  - H1: Plugin Elevenlabs
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/exa.md

- Percorso: /plugins/reference/exa
- Titoli:
  - H1: Plugin Exa
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/fal.md

- Percorso: /plugins/reference/fal
- Titoli:
  - H1: Plugin fal
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/feishu.md

- Percorso: /plugins/reference/feishu
- Titoli:
  - H1: Plugin Feishu
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/file-transfer.md

- Percorso: /plugins/reference/file-transfer
- Titoli:
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

- Route: /plugins/reference/twitch
- Intestazioni:
  - H1: Plugin Twitch
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/venice.md

- Route: /plugins/reference/venice
- Intestazioni:
  - H1: Plugin Venice
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/vercel-ai-gateway.md

- Route: /plugins/reference/vercel-ai-gateway
- Intestazioni:
  - H1: Plugin Vercel AI Gateway
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/vllm.md

- Route: /plugins/reference/vllm
- Intestazioni:
  - H1: Plugin vLLM
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/voice-call.md

- Route: /plugins/reference/voice-call
- Intestazioni:
  - H1: Plugin Voice Call
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/volcengine.md

- Route: /plugins/reference/volcengine
- Intestazioni:
  - H1: Plugin Volcengine
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/voyage.md

- Route: /plugins/reference/voyage
- Intestazioni:
  - H1: Plugin Voyage
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/vydra.md

- Route: /plugins/reference/vydra
- Intestazioni:
  - H1: Plugin Vydra
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/web-readability.md

- Route: /plugins/reference/web-readability
- Intestazioni:
  - H1: Plugin Web Readability
  - H2: Distribuzione
  - H2: Superficie

## plugins/reference/webhooks.md

- Route: /plugins/reference/webhooks
- Intestazioni:
  - H1: Plugin Webhook
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/whatsapp.md

- Route: /plugins/reference/whatsapp
- Intestazioni:
  - H1: Plugin WhatsApp
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/workboard.md

- Route: /plugins/reference/workboard
- Intestazioni:
  - H1: Plugin Workboard
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/xai.md

- Route: /plugins/reference/xai
- Intestazioni:
  - H1: Plugin xAI
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/xiaomi.md

- Route: /plugins/reference/xiaomi
- Intestazioni:
  - H1: Plugin Xiaomi
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/zai.md

- Route: /plugins/reference/zai
- Intestazioni:
  - H1: Plugin Z.AI
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/zalo.md

- Route: /plugins/reference/zalo
- Intestazioni:
  - H1: Plugin Zalo
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/reference/zalouser.md

- Route: /plugins/reference/zalouser
- Intestazioni:
  - H1: Plugin Zalo Personal
  - H2: Distribuzione
  - H2: Superficie
  - H2: Documentazione correlata

## plugins/sdk-agent-harness.md

- Route: /plugins/sdk-agent-harness
- Intestazioni:
  - H2: Quando usare un harness
  - H2: Cosa possiede ancora il core
  - H2: Registrare un harness
  - H2: Criterio di selezione
  - H2: Abbinamento tra provider e harness
  - H3: Middleware dei risultati degli strumenti
  - H3: Classificazione dell'esito terminale
  - H3: Effetti collaterali a fine agente
  - H3: Input utente e superfici degli strumenti
  - H3: Modalità harness nativa Codex
  - H2: Rigidità del runtime
  - H2: Sessioni native e mirror della trascrizione
  - H2: Risultati di strumenti e media
  - H2: Limitazioni attuali
  - H2: Correlati

## plugins/sdk-channel-inbound.md

- Route: /plugins/sdk-channel-inbound
- Intestazioni:
  - H2: Helper core
  - H2: Migrazione

## plugins/sdk-channel-ingress.md

- Route: /plugins/sdk-channel-ingress
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

- Route: /plugins/sdk-channel-message
- Intestazioni: nessuna

## plugins/sdk-channel-outbound.md

- Route: /plugins/sdk-channel-outbound
- Intestazioni:
  - H2: Adapter
  - H2: Adapter outbound esistenti
  - H2: Invii durevoli
  - H2: Dispatch di compatibilità

## plugins/sdk-channel-plugins.md

- Route: /plugins/sdk-channel-plugins
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

- Route: /plugins/sdk-channel-turn
- Intestazioni: nessuna

## plugins/sdk-entrypoints.md

- Route: /plugins/sdk-entrypoints
- Intestazioni:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Modalità di registrazione
  - H2: Forme dei Plugin
  - H2: Correlati

## plugins/sdk-migration.md

- Route: /plugins/sdk-migration
- Intestazioni:
  - H2: Cosa cambia
  - H2: Perché è cambiato
  - H2: Piano di migrazione per voce talk e realtime
  - H2: Criterio di compatibilità
  - H2: Come migrare
  - H2: Riferimento dei percorsi di importazione
  - H2: Deprecazioni attive
  - H2: Tempistica di rimozione
  - H2: Sopprimere temporaneamente gli avvisi
  - H2: Correlati

## plugins/sdk-overview.md

- Route: /plugins/sdk-overview
- Intestazioni:
  - H2: Convenzione di importazione
  - H2: Riferimento dei sottopercorsi
  - H2: API di registrazione
  - H3: Registrazione delle capacità
  - H3: Strumenti e comandi
  - H3: Infrastruttura
  - H3: Hook host per Plugin di workflow
  - H3: Registrazione della discovery Gateway
  - H3: Metadati di registrazione CLI
  - H3: Registrazione del backend CLI
  - H3: Slot esclusivi
  - H3: Adapter deprecati per embedding della memoria
  - H3: Eventi e ciclo di vita
  - H3: Semantica decisionale degli hook
  - H3: Campi dell'oggetto API
  - H2: Convenzione dei moduli interni
  - H2: Correlati

## plugins/sdk-provider-plugins.md

- Route: /plugins/sdk-provider-plugins
- Intestazioni:
  - H2: Procedura guidata
  - H2: Pubblicare su ClawHub
  - H2: Struttura dei file
  - H2: Riferimento dell'ordine del catalogo
  - H2: Passaggi successivi
  - H2: Correlati

## plugins/sdk-runtime.md

- Route: /plugins/sdk-runtime
- Intestazioni:
  - H2: Caricamento e scrittura della configurazione
  - H2: Utilità runtime riutilizzabili
  - H2: Namespace runtime
  - H2: Archiviazione dei riferimenti runtime
  - H2: Altri campi api di primo livello
  - H2: Correlati

## plugins/sdk-setup.md

- Route: /plugins/sdk-setup
- Intestazioni:
  - H2: Metadati del pacchetto
  - H3: Campi openclaw
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Caricamento completo differito
  - H2: Manifest del Plugin
  - H2: Pubblicazione su ClawHub
  - H2: Voce di configurazione
  - H3: Importazioni ristrette degli helper di configurazione
  - H3: Promozione di account singolo posseduta dal canale
  - H2: Schema di configurazione
  - H3: Creazione degli schemi di configurazione del canale
  - H2: Wizard di configurazione
  - H2: Pubblicazione e installazione
  - H2: Correlati

## plugins/sdk-subpaths.md

- Route: /plugins/sdk-subpaths
- Intestazioni:
  - H2: Voce del Plugin
  - H3: Helper di test e compatibilità deprecati
  - H3: Sottopercorsi helper riservati dei Plugin in bundle
  - H2: Correlati

## plugins/sdk-testing.md

- Route: /plugins/sdk-testing
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
  - H3: Mock del runtime del Plugin
  - H3: Test con stub per istanza
  - H2: Test di contratto (Plugin nel repo)
  - H3: Esecuzione di test con ambito
  - H2: Applicazione del lint (Plugin nel repo)
  - H2: Configurazione dei test
  - H2: Correlati

## plugins/tool-plugins.md

- Route: /plugins/tool-plugins
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
  - H3: voce del Plugin non trovata: ./dist/index.js
  - H3: la voce del Plugin non espone metadati defineToolPlugin
  - H3: i metadati generati openclaw.plugin.json sono obsoleti
  - H3: package.json openclaw.extensions deve includere ./dist/index.js
  - H3: Impossibile trovare il pacchetto 'typebox'
  - H3: Lo strumento non appare dopo l'installazione
  - H2: Vedi anche

## plugins/voice-call.md

- Route: /plugins/voice-call
- Intestazioni:
  - H2: Avvio rapido
  - H2: Configurazione
  - H2: Ambito della sessione
  - H2: Conversazioni vocali realtime
  - H3: Criterio degli strumenti
  - H3: Contesto vocale dell'agente
  - H3: Esempi di provider realtime
  - H2: Trascrizione in streaming
  - H3: Esempi di provider in streaming
  - H2: TTS per chiamate
  - H3: Esempi TTS
  - H2: Chiamate in ingresso
  - H3: Routing per numero
  - H3: Contratto dell'output parlato
  - H3: Comportamento di avvio della conversazione
  - H3: Periodo di tolleranza per disconnessione dello stream Twilio
  - H2: Reaper delle chiamate obsolete
  - H2: Sicurezza Webhook
  - H2: CLI
  - H2: Strumento dell'agente
  - H2: RPC Gateway
  - H2: Risoluzione dei problemi
  - H3: La configurazione non riesce nell'esposizione del Webhook
  - H3: Le credenziali del provider non funzionano
  - H3: Le chiamate partono ma i Webhook del provider non arrivano
  - H3: La verifica della firma non riesce
  - H3: Gli accessi Twilio a Google Meet non riescono
  - H3: La chiamata realtime non contiene voce
  - H2: Correlati

## plugins/webhooks.md

- Route: /plugins/webhooks
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

- Route: /plugins/workboard
- Intestazioni:
  - H2: Stato predefinito
  - H2: Cosa contengono le schede
  - H2: Esecuzioni delle schede e attività
  - H2: Coordinamento degli agenti
  - H3: Selezione del worker di dispatch
  - H3: Prompt del worker e ciclo di vita
  - H3: Entry point di dispatch
  - H2: CLI e comando slash
  - H2: Sincronizzazione del ciclo di vita della sessione
  - H2: Workflow della dashboard
  - H2: Autorizzazioni
  - H2: Configurazione
  - H2: Risoluzione dei problemi
  - H3: La tab dice che Workboard non è disponibile
  - H3: Le schede non vengono salvate
  - H3: Avviare una scheda non apre la sessione prevista
  - H3: Il dispatch non avvia un worker
  - H2: Correlati

## plugins/zalouser.md

- Route: /plugins/zalouser
- Intestazioni:
  - H2: Nomenclatura
  - H2: Dove viene eseguito
  - H2: Installazione
  - H3: Opzione A: installare da npm
  - H3: Opzione B: installare da una cartella locale (dev)
  - H2: Configurazione
  - H2: CLI
  - H2: Strumento dell'agente
  - H2: Correlati

## prose.md

- Route: /prose
- Intestazioni:
  - H2: Installazione
  - H2: Comando slash
  - H2: Cosa può fare
  - H2: Esempio: ricerca parallela e sintesi
  - H2: Mappatura del runtime OpenClaw
  - H2: Posizioni dei file
  - H2: Backend di stato
  - H2: Sicurezza
  - H2: Correlati

## providers/alibaba.md

- Route: /providers/alibaba
- Intestazioni:
  - H2: Introduzione
  - H2: Modelli Wan integrati
  - H2: Capacità e limiti
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/anthropic.md

- Route: /providers/anthropic
- Intestazioni:
  - H2: Introduzione
  - H2: Impostazioni predefinite di ragionamento (Claude Fable 5, 4.8 e 4.6)
  - H2: Fallback per rifiuto di sicurezza (Claude Fable 5)
  - H3: Perché esiste
  - H3: Come funziona
  - H3: Osservabilità e fatturazione
  - H3: Ambito
  - H2: Caching dei prompt
  - H2: Configurazione avanzata
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/arcee.md

- Route: /providers/arcee
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Introduzione
  - H2: Configurazione non interattiva
  - H2: Catalogo integrato
  - H2: Funzionalità supportate
  - H2: Correlati

## providers/azure-speech.md

- Route: /providers/azure-speech
- Intestazioni:
  - H2: Introduzione
  - H2: Opzioni di configurazione
  - H2: Note
  - H2: Correlati

## providers/bedrock-mantle.md

- Route: /providers/bedrock-mantle
- Intestazioni:
  - H2: Introduzione
  - H2: Discovery automatica dei modelli
  - H3: Regioni supportate
  - H2: Configurazione manuale
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/bedrock.md

- Route: /providers/bedrock
- Intestazioni:
  - H2: Introduzione
  - H2: Discovery automatica dei modelli
  - H2: Configurazione rapida (percorso AWS)
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/cerebras.md

- Route: /providers/cerebras
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Introduzione
  - H2: Configurazione non interattiva
  - H2: Catalogo integrato
  - H2: Configurazione manuale
  - H2: Correlati

## providers/chutes.md

- Percorso: /providers/chutes
- Intestazioni:
  - H2: Installa Plugin
  - H2: Introduzione
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
  - H2: Introduzione
  - H2: Catalogo integrato
  - H2: Configurazione avanzata
  - H2: Note
  - H2: Correlati

## providers/clawrouter.md

- Percorso: /providers/clawrouter
- Intestazioni:
  - H2: Introduzione
  - H2: Discovery dei modelli
  - H2: Protocollo e Plugin provider
  - H2: Quote e utilizzo
  - H2: Risoluzione dei problemi
  - H2: Comportamento di sicurezza
  - H2: Correlati

## providers/cloudflare-ai-gateway.md

- Percorso: /providers/cloudflare-ai-gateway
- Intestazioni:
  - H2: Installa Plugin
  - H2: Introduzione
  - H2: Esempio non interattivo
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/cohere.md

- Percorso: /providers/cohere
- Intestazioni:
  - H2: Inizia
  - H2: Configurazione solo tramite ambiente
  - H2: Correlati

## providers/comfy.md

- Percorso: /providers/comfy
- Intestazioni:
  - H2: Cosa supporta
  - H2: Introduzione
  - H2: Configurazione
  - H3: Chiavi condivise
  - H3: Chiavi per capacità
  - H2: Dettagli del workflow
  - H2: Correlati

## providers/deepgram.md

- Percorso: /providers/deepgram
- Intestazioni:
  - H2: Introduzione
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
  - H2: Introduzione
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
  - H2: Avvio on demand
  - H2: Think Max
  - H2: Test
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/elevenlabs.md

- Percorso: /providers/elevenlabs
- Intestazioni:
  - H2: Autenticazione
  - H2: Da testo a voce
  - H2: Da voce a testo
  - H2: STT in streaming
  - H2: Correlati

## providers/fal.md

- Percorso: /providers/fal
- Intestazioni:
  - H2: Introduzione
  - H2: Generazione di immagini
  - H2: Generazione di video
  - H2: Generazione di musica
  - H2: Correlati

## providers/fireworks.md

- Percorso: /providers/fireworks
- Intestazioni:
  - H2: Introduzione
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
  - H2: Embedding per ricerca in memoria
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
  - H2: Introduzione
  - H2: Capacità
  - H2: Ricerca web
  - H2: Generazione di immagini
  - H2: Generazione di video
  - H2: Generazione di musica
  - H2: Da testo a voce
  - H2: Voce in tempo reale
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/gradium.md

- Percorso: /providers/gradium
- Intestazioni:
  - H2: Installa Plugin
  - H2: Configurazione
  - H2: Config
  - H2: Voci
  - H3: Override della voce per messaggio
  - H2: Output
  - H2: Ordine di selezione automatica
  - H2: Correlati

## providers/groq.md

- Percorso: /providers/groq
- Intestazioni:
  - H2: Installa Plugin
  - H2: Introduzione
  - H3: Esempio di file di configurazione
  - H2: Catalogo integrato
  - H2: Modelli di ragionamento
  - H2: Trascrizione audio
  - H2: Correlati

## providers/huggingface.md

- Percorso: /providers/huggingface
- Intestazioni:
  - H2: Introduzione
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
  - H2: Introduzione
  - H2: Esempio di configurazione completa
  - H2: Avvio on demand
  - H2: Configurazione avanzata
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/inworld.md

- Percorso: /providers/inworld
- Intestazioni:
  - H2: Installa Plugin
  - H2: Introduzione
  - H2: Opzioni di configurazione
  - H2: Note
  - H2: Correlati

## providers/kilocode.md

- Percorso: /providers/kilocode
- Intestazioni:
  - H2: Installa Plugin
  - H2: Introduzione
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
  - H3: Compatibilità dell'utilizzo in streaming
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
  - H2: Introduzione
  - H2: Configura tramite openclaw configure
  - H2: Capacità
  - H3: Generazione di immagini
  - H3: Da testo a voce
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
  - H2: Introduzione
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
  - H2: Varianti provider aggiuntive
  - H2: Correlati

## providers/moonshot.md

- Percorso: /providers/moonshot
- Intestazioni:
  - H2: Catalogo modelli integrato
  - H2: Introduzione
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
  - H2: Introduzione
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
  - H2: Introduzione
  - H2: Modelli cloud
  - H2: Discovery dei modelli (provider implicito)
  - H2: Inferenza locale al Node
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
  - H2: Introduzione
  - H2: Autenticazione app-server Codex nativa
  - H2: Generazione di immagini
  - H2: Generazione di video
  - H2: Contributo ai prompt GPT-5
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
  - H2: Introduzione
  - H2: Esempio di configurazione
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/opencode.md

- Percorso: /providers/opencode
- Intestazioni:
  - H2: Introduzione
  - H2: Esempio di configurazione
  - H2: Cataloghi integrati
  - H3: Zen
  - H3: Go
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/openrouter.md

- Percorso: /providers/openrouter
- Intestazioni:
  - H2: Introduzione
  - H2: Esempio di configurazione
  - H2: Riferimenti dei modelli
  - H2: Generazione di immagini
  - H2: Generazione di video
  - H2: Generazione di musica
  - H2: Da testo a voce
  - H2: Da voce a testo (audio in ingresso)
  - H2: Router Fusion
  - H2: Autenticazione e header
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/perplexity-provider.md

- Percorso: /providers/perplexity-provider
- Intestazioni:
  - H2: Installa Plugin
  - H2: Introduzione
  - H2: Modalità di ricerca
  - H2: Filtro API nativo
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/pixverse.md

- Percorso: /providers/pixverse
- Intestazioni:
  - H2: Introduzione
  - H2: Modalità e modelli supportati
  - H2: Opzioni del provider
  - H2: Configurazione
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/qianfan.md

- Percorso: /providers/qianfan
- Intestazioni:
  - H2: Installa Plugin
  - H2: Introduzione
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
  - H2: Introduzione
  - H2: Tipi di piano ed endpoint
  - H2: Catalogo integrato
  - H2: Controlli di ragionamento
  - H2: Componenti aggiuntivi multimodali
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/runway.md

- Percorso: /providers/runway
- Intestazioni:
  - H2: Introduzione
  - H2: Modalità e modelli supportati
  - H2: Configurazione
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/senseaudio.md

- Percorso: /providers/senseaudio
- Intestazioni:
  - H2: Introduzione
  - H2: Opzioni
  - H2: Correlati

## providers/sglang.md

- Percorso: /providers/sglang
- Intestazioni:
  - H2: Introduzione
  - H2: Discovery dei modelli (provider implicito)
  - H2: Configurazione esplicita (modelli manuali)
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/stepfun.md

- Percorso: /providers/stepfun
- Intestazioni:
  - H2: Installa Plugin
  - H2: Panoramica di regione ed endpoint
  - H2: Catalogo integrato
  - H2: Introduzione
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/synthetic.md

- Percorso: /providers/synthetic
- Intestazioni:
  - H2: Introduzione
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
  - H2: Introduzione
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
  - H2: Introduzione
  - H2: Selezione del modello
  - H2: Comportamento di replay di DeepSeek V4
  - H2: Catalogo integrato (41 in totale)
  - H2: Discovery dei modelli
  - H2: Streaming e supporto strumenti
  - H2: Prezzi
  - H3: Venice (anonimizzata) vs API diretta
  - H2: Esempi di utilizzo
  - H2: Risoluzione dei problemi
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/vercel-ai-gateway.md

- Route: /providers/vercel-ai-gateway
- Intestazioni:
  - H2: Per iniziare
  - H2: Esempio non interattivo
  - H2: Abbreviazione dell'ID modello
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/vllm.md

- Route: /providers/vllm
- Intestazioni:
  - H2: Per iniziare
  - H2: Rilevamento dei modelli (provider implicito)
  - H2: Configurazione esplicita (modelli manuali)
  - H2: Configurazione avanzata
  - H2: Risoluzione dei problemi
  - H2: Correlati

## providers/volcengine.md

- Route: /providers/volcengine
- Intestazioni:
  - H2: Per iniziare
  - H2: Provider ed endpoint
  - H2: Catalogo integrato
  - H2: Sintesi vocale
  - H2: Configurazione avanzata
  - H2: Correlati

## providers/vydra.md

- Route: /providers/vydra
- Intestazioni:
  - H2: Configurazione
  - H2: Funzionalità
  - H2: Correlati

## providers/xai.md

- Route: /providers/xai
- Intestazioni:
  - H2: Scegli il percorso di configurazione
  - H2: Risoluzione dei problemi OAuth
  - H2: Catalogo integrato
  - H2: Copertura delle funzionalità di OpenClaw
  - H3: Mappature della modalità veloce
  - H3: Alias di compatibilità legacy
  - H2: Funzionalità
  - H2: Test live
  - H2: Correlati

## providers/xiaomi.md

- Route: /providers/xiaomi
- Intestazioni:
  - H2: Per iniziare
  - H2: Catalogo pay-as-you-go
  - H2: Catalogo Token Plan
  - H2: Sintesi vocale
  - H2: Esempio di configurazione
  - H2: Correlati

## providers/zai.md

- Route: /providers/zai
- Intestazioni:
  - H2: Modelli GLM
  - H2: Per iniziare
  - H2: Esempio di configurazione
  - H2: Catalogo integrato
  - H2: Configurazione avanzata
  - H2: Correlati

## refactor/access.md

- Route: /refactor/access
- Intestazioni: nessuna

## refactor/acp.md

- Route: /refactor/acp
- Intestazioni:
  - H2: Obiettivi
  - H2: Non obiettivi
  - H2: Modello target
  - H3: Identità dell'istanza Gateway
  - H3: Proprietà della sessione ACP
  - H3: Lease dei processi ACPX
  - H2: Controller del ciclo di vita
  - H2: Contratto del wrapper
  - H2: Contratto di visibilità della sessione
  - H2: Piano di migrazione
  - H3: Fase 1: aggiungere identità e lease
  - H3: Fase 2: pulizia con priorità ai lease
  - H3: Fase 3: reaping all'avvio con priorità ai lease
  - H3: Fase 4: righe di proprietà della sessione
  - H3: Fase 5: rimuovere le euristiche legacy
  - H2: Test
  - H2: Note sulla compatibilità
  - H2: Criteri di successo

## refactor/canvas.md

- Route: /refactor/canvas
- Intestazioni:
  - H1: Refactor del plugin Canvas
  - H2: Obiettivo
  - H2: Non obiettivi
  - H2: Stato del branch corrente
  - H2: Forma target
  - H2: Passaggi di migrazione
  - H2: Checklist di audit
  - H2: Comandi di verifica

## refactor/database-first.md

- Route: /refactor/database-first
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
  - H2: Presupposti dalla lettura del codice
  - H2: Risultati dalla lettura del codice
  - H2: Forma corrente del codice
  - H2: Forma dello schema target
  - H2: Forma della migrazione Doctor
  - H2: Inventario della migrazione
  - H2: Piano di migrazione
  - H3: Fase 0: bloccare il confine
  - H3: Fase 1: completare il piano di controllo globale
  - H3: Fase 2: introdurre database per agente
  - H3: Fase 3: sostituire le API dell'archivio sessioni
  - H3: Fase 4: spostare trascrizioni, stream ACP, traiettorie e VFS
  - H3: Fase 5: backup, ripristino, vacuum e verifica
  - H3: Fase 6: runtime dei worker
  - H3: Fase 7: eliminare il vecchio mondo
  - H2: Backup e ripristino
  - H2: Piano di refactor del runtime
  - H2: Regole di prestazioni
  - H2: Divieti statici
  - H2: Criteri di completamento

## refactor/ingress-core.md

- Route: /refactor/ingress-core
- Intestazioni:
  - H1: Piano di eliminazione del core di ingress
  - H2: Budget
  - H2: Diagnosi
  - H2: Hotspot
  - H2: Lettura del codice corrente
  - H2: Confine
  - H2: Regola di accettazione
  - H2: Pacchetti di lavoro
  - H2: Ondate di eliminazione
  - H2: Non spostare
  - H2: Verifica
  - H2: Criteri di uscita

## reference/AGENTS.default.md

- Route: /reference/AGENTS.default
- Intestazioni:
  - H2: Prima esecuzione (consigliata)
  - H2: Impostazioni di sicurezza predefinite
  - H2: Preflight delle soluzioni esistenti
  - H2: Avvio della sessione (obbligatorio)
  - H2: Anima (obbligatorio)
  - H2: Spazi condivisi (consigliati)
  - H2: Sistema di memoria (consigliato)
  - H2: Strumenti e Skills
  - H2: Suggerimento di backup (consigliato)
  - H2: Cosa fa OpenClaw
  - H2: Skills principali (abilita in Impostazioni → Skills)
  - H2: Note d'uso
  - H2: Correlati

## reference/RELEASING.md

- Route: /reference/RELEASING
- Intestazioni:
  - H2: Nomenclatura delle versioni
  - H2: Cadenza dei rilasci
  - H2: Checklist dell'operatore di rilascio
  - H2: Chiusura della main stabile
  - H2: Preflight del rilascio
  - H2: Test box di rilascio
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Package
  - H2: Automazione della pubblicazione del rilascio
  - H2: Input del workflow NPM
  - H2: Sequenza di rilascio npm stabile
  - H2: Riferimenti pubblici
  - H2: Correlati

## reference/api-usage-costs.md

- Route: /reference/api-usage-costs
- Intestazioni:
  - H2: Dove compaiono i costi (chat + CLI)
  - H2: Come vengono rilevate le chiavi
  - H2: Funzionalità che possono spendere chiavi
  - H3: 1) Risposte del modello core (chat + strumenti)
  - H3: 2) Comprensione dei media (audio/immagine/video)
  - H3: 3) Generazione di immagini e video
  - H3: 4) Embedding di memoria + ricerca semantica
  - H3: 5) Strumento di ricerca web
  - H3: 5) Strumento di recupero web (Firecrawl)
  - H3: 6) Snapshot di utilizzo dei provider (stato/salute)
  - H3: 7) Riepilogo di salvaguardia Compaction
  - H3: 8) Scansione / probe dei modelli
  - H3: 9) Parlato (speech)
  - H3: 10) Skills (API di terze parti)
  - H2: Correlati

## reference/application-modernization-plan.md

- Route: /reference/application-modernization-plan
- Intestazioni:
  - H2: Obiettivo
  - H2: Principi
  - H2: Fase 1: audit di base
  - H2: Fase 2: pulizia di prodotto e UX
  - H2: Fase 3: rafforzamento dell'architettura frontend
  - H2: Fase 4: prestazioni e affidabilità
  - H2: Fase 5: rafforzamento di tipi, contratti e test
  - H2: Fase 6: documentazione e preparazione al rilascio
  - H2: Primo segmento consigliato
  - H2: Aggiornamento della skill frontend

## reference/code-mode.md

- Route: /reference/code-mode
- Intestazioni:
  - H2: Che cos'è?
  - H2: Perché è utile?
  - H2: Come abilitarla
  - H2: Tour tecnico
  - H2: Stato del runtime
  - H2: Ambito
  - H2: Termini
  - H2: Configurazione
  - H2: Attivazione
  - H2: Strumenti visibili al modello
  - H2: exec
  - H2: wait
  - H2: API runtime guest
  - H2: Namespace interni
  - H3: Ciclo di vita del registro
  - H3: Forma di registrazione
  - H3: Proprietà e visibilità
  - H3: Regole di serializzazione dell'ambito
  - H3: Prompt
  - H3: Pulizia
  - H3: Checklist di test
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
  - H2: Checklist di convalida
  - H2: Piano di test E2E
  - H2: Correlati

## reference/credits.md

- Route: /reference/credits
- Intestazioni:
  - H2: Il nome
  - H2: Riconoscimenti
  - H2: Collaboratori principali
  - H2: Licenza
  - H2: Correlati

## reference/device-models.md

- Route: /reference/device-models
- Intestazioni:
  - H2: Fonte dati
  - H2: Aggiornamento del database
  - H2: Correlati

## reference/full-release-validation.md

- Route: /reference/full-release-validation
- Intestazioni:
  - H2: Fasi di alto livello
  - H2: Fasi dei controlli di rilascio
  - H2: Segmenti del percorso di rilascio Docker
  - H2: Profili di rilascio
  - H2: Aggiunte solo complete
  - H2: Riesecuzioni focalizzate
  - H2: Prove da conservare
  - H2: File di workflow

## reference/memory-config.md

- Route: /reference/memory-config
- Intestazioni:
  - H2: Selezione del provider
  - H3: ID provider personalizzati
  - H3: Risoluzione delle chiavi API
  - H2: Configurazione endpoint remoto
  - H2: Configurazione specifica del provider
  - H3: Timeout embedding inline
  - H2: Configurazione della ricerca ibrida
  - H3: Esempio completo
  - H2: Percorsi di memoria aggiuntivi
  - H2: Memoria multimodale (Gemini)
  - H2: Cache degli embedding
  - H2: Indicizzazione batch
  - H2: Ricerca nella memoria di sessione (sperimentale)
  - H2: Accelerazione vettoriale SQLite (sqlite-vec)
  - H2: Archiviazione dell'indice
  - H2: Configurazione backend QMD
  - H3: Esempio QMD completo
  - H2: Dreaming
  - H3: Impostazioni utente
  - H3: Esempio
  - H2: Correlati

## reference/prompt-caching.md

- Route: /reference/prompt-caching
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

- Route: /reference/release-performance-sweep
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
  - H3: Confine shrinkwrap
  - H2: Interpretazione della supply chain

## reference/rich-output-protocol.md

- Route: /reference/rich-output-protocol
- Intestazioni:
  - H2: [embed ...]
  - H2: Forma di rendering archiviata
  - H2: Correlati

## reference/rpc.md

- Route: /reference/rpc
- Intestazioni:
  - H2: Pattern A: daemon HTTP (signal-cli)
  - H2: Pattern B: processo figlio stdio (imsg)
  - H2: Linee guida per adapter
  - H2: Correlati

## reference/secret-placeholder-conventions.md

- Route: /reference/secret-placeholder-conventions
- Intestazioni:
  - H1: Convenzioni per placeholder di segreti
  - H2: Stile consigliato
  - H2: Evita questi pattern nella documentazione
  - H2: Esempio

## reference/secretref-credential-surface.md

- Route: /reference/secretref-credential-surface
- Intestazioni:
  - H2: Credenziali supportate
  - H3: target openclaw.json (secrets configure + secrets apply + secrets audit)
  - H3: target auth-profiles.json (secrets configure + secrets apply + secrets audit)
  - H2: Credenziali non supportate
  - H2: Correlati

## reference/session-management-compaction.md

- Route: /reference/session-management-compaction
- Intestazioni:
  - H2: Fonte di verità: il Gateway
  - H2: Due livelli di persistenza
  - H2: Posizioni su disco
  - H2: Manutenzione dello store e controlli del disco
  - H2: Sessioni Cron e log di esecuzione
  - H2: Chiavi di sessione (sessionKey)
  - H2: ID sessione (sessionId)
  - H2: Schema dello store sessioni (sessions.json)
  - H2: Struttura delle trascrizioni (.jsonl)
  - H2: Finestre di contesto vs token tracciati
  - H2: Compaction: che cos'è
  - H2: Confini dei chunk di Compaction e pairing degli strumenti
  - H2: Quando avviene l'auto-Compaction (runtime OpenClaw)
  - H2: Impostazioni Compaction (reserveTokens, keepRecentTokens)
  - H2: Provider di Compaction collegabili
  - H2: Superfici visibili all'utente
  - H2: Manutenzione silenziosa (NOREPLY)
  - H2: "Flush della memoria" pre-Compaction (implementato)
  - H2: Checklist di risoluzione dei problemi
  - H2: Correlati

## reference/templates/AGENTS.dev.md

- Route: /reference/templates/AGENTS.dev
- Intestazioni:
  - H1: AGENTS.md - Workspace OpenClaw
  - H2: Prima esecuzione (una tantum)
  - H2: Suggerimento di backup (consigliato)
  - H2: Impostazioni di sicurezza predefinite
  - H2: Preflight delle soluzioni esistenti
  - H2: Memoria giornaliera (consigliata)
  - H2: Heartbeat (facoltativi)
  - H2: Personalizza
  - H2: Memoria di origine C-3PO
  - H3: Giorno di nascita: 2026-01-09
  - H3: Verità fondamentali (da Clawd)
  - H2: Correlati

## reference/templates/BOOT.md

- Route: /reference/templates/BOOT
- Intestazioni:
  - H1: BOOT.md
  - H2: Correlati

## reference/templates/BOOTSTRAP.md

- Route: /reference/templates/BOOTSTRAP
- Intestazioni:
  - H1: BOOTSTRAP.md - Ciao, mondo
  - H2: La conversazione
  - H2: Dopo che sai chi sei
  - H2: Connetti (facoltativo)
  - H2: Quando hai finito
  - H2: Correlati

## reference/templates/HEARTBEAT.md

- Percorso: /reference/templates/HEARTBEAT
- Titoli:
  - H1: Template HEARTBEAT.md
  - H2: Correlati

## reference/templates/IDENTITY.dev.md

- Percorso: /reference/templates/IDENTITY.dev
- Titoli:
  - H1: IDENTITY.md - Identità dell'agente
  - H2: Ruolo
  - H2: Anima
  - H2: Relazione con Clawd
  - H2: Particolarità
  - H2: Frase distintiva
  - H2: Correlati

## reference/templates/IDENTITY.md

- Percorso: /reference/templates/IDENTITY
- Titoli:
  - H1: IDENTITY.md - Chi sono?
  - H2: Correlati

## reference/templates/SOUL.dev.md

- Percorso: /reference/templates/SOUL.dev
- Titoli:
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
- Titoli:
  - H1: SOUL.md - Chi sei
  - H2: Verità fondamentali
  - H2: Limiti
  - H2: Stile
  - H2: Continuità
  - H2: Correlati

## reference/templates/TOOLS.dev.md

- Percorso: /reference/templates/TOOLS.dev
- Titoli:
  - H1: TOOLS.md - Note sugli strumenti utente (modificabile)
  - H2: Esempi
  - H3: imsg
  - H3: sag
  - H2: Correlati

## reference/templates/TOOLS.md

- Percorso: /reference/templates/TOOLS
- Titoli:
  - H1: TOOLS.md - Note locali
  - H2: Cosa inserire qui
  - H2: Esempi
  - H2: Perché separare?
  - H2: Correlati

## reference/templates/USER.dev.md

- Percorso: /reference/templates/USER.dev
- Titoli:
  - H1: USER.md - Profilo utente
  - H2: Correlati

## reference/templates/USER.md

- Percorso: /reference/templates/USER
- Titoli:
  - H1: USER.md - Informazioni sul tuo umano
  - H2: Contesto
  - H2: Correlati

## reference/test.md

- Percorso: /reference/test
- Titoli:
  - H2: Gate PR locale
  - H2: Benchmark di latenza del modello (chiavi locali)
  - H2: Benchmark di avvio della CLI
  - H2: Benchmark di avvio del Gateway
  - H2: Benchmark di riavvio del Gateway
  - H2: Onboarding E2E (Docker)
  - H2: Smoke test dell'importazione QR (Docker)
  - H2: Correlati

## reference/token-use.md

- Percorso: /reference/token-use
- Titoli:
  - H2: Come viene costruito il prompt di sistema
  - H2: Cosa rientra nella finestra di contesto
  - H2: Come vedere l'uso attuale dei token
  - H2: Stima dei costi (quando mostrata)
  - H2: Impatto della TTL della cache e della potatura
  - H3: Esempio: mantenere calda la cache di 1 h con Heartbeat
  - H3: Esempio: traffico misto con strategia di cache per agente
  - H3: Contesto Anthropic da 1M
  - H2: Suggerimenti per ridurre la pressione sui token
  - H2: Correlati

## reference/transcript-hygiene.md

- Percorso: /reference/transcript-hygiene
- Titoli:
  - H2: Regola globale: il contesto runtime non è la trascrizione utente
  - H2: Dove viene eseguito
  - H2: Regola globale: sanitizzazione delle immagini
  - H2: Regola globale: chiamate agli strumenti malformate
  - H2: Regola globale: turni incompleti di solo ragionamento
  - H2: Regola globale: provenienza dell'input tra sessioni
  - H2: Matrice dei provider (comportamento attuale)
  - H2: Comportamento storico (prima di 2026.1.22)
  - H2: Correlati

## reference/wizard.md

- Percorso: /reference/wizard
- Titoli:
  - H2: Dettagli del flusso (modalità locale)
  - H2: Modalità non interattiva
  - H3: Aggiungi agente (non interattivo)
  - H2: RPC della procedura guidata del Gateway
  - H2: Configurazione di Signal (signal-cli)
  - H2: Cosa scrive la procedura guidata
  - H2: Documenti correlati

## releases/2026.6.11.md

- Percorso: /releases/2026.6.11
- Titoli:
  - H1: Note di rilascio OpenClaw v2026.6.11 (2026-06-30)
  - H2: Punti salienti
  - H3: Affidabilità della consegna nei canali
  - H3: Recupero di provider e modelli
  - H3: Continuità di sessione, memoria e fiducia
  - H3: Modalità relay del router Slack
  - H3: Ponte di riattivazione Raft External Agent
  - H3: Installazione e riparazione dei plugin ufficiali
  - H2: Canali e messaggistica
  - H3: Correzioni aggiuntive dei canali
  - H2: Gateway, sicurezza e fiducia
  - H3: Recupero da riavvio e prontezza
  - H3: Consegna di risultati remoti e media
  - H2: Client e interfacce
  - H3: Invii dei client e riconnessioni
  - H3: Correzioni a interfaccia, impostazioni e onboarding
  - H2: Documenti e strumenti di amministrazione
  - H3: Affidabilità di configurazione e comandi
  - H3: Strumenti e lavoro pianificato

## releases/index.md

- Percorso: /releases
- Titoli:
  - H1: Note di rilascio
  - H2: Rilasci
  - H2: Cronologia grezza dei rilasci

## security/CONTRIBUTING-THREAT-MODEL.md

- Percorso: /security/CONTRIBUTING-THREAT-MODEL
- Titoli:
  - H2: Modi per contribuire
  - H3: Aggiungi una minaccia
  - H3: Suggerisci una mitigazione
  - H3: Proponi una catena di attacco
  - H3: Correggi o migliora i contenuti esistenti
  - H2: Cosa usiamo
  - H3: Framework MITRE ATLAS
  - H3: ID delle minacce
  - H3: Livelli di rischio
  - H2: Processo di revisione
  - H2: Risorse
  - H2: Contatto
  - H2: Riconoscimento
  - H2: Correlati

## security/THREAT-MODEL-ATLAS.md

- Percorso: /security/THREAT-MODEL-ATLAS
- Titoli:
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
  - H4: T-RECON-001: Rilevamento degli endpoint degli agenti
  - H4: T-RECON-002: Sondaggio delle integrazioni dei canali
  - H3: 3.2 Accesso iniziale (AML.TA0004)
  - H4: T-ACCESS-001: Intercettazione del codice di associazione
  - H4: T-ACCESS-002: Spoofing di AllowFrom
  - H4: T-ACCESS-003: Furto di token
  - H3: 3.3 Esecuzione (AML.TA0005)
  - H4: T-EXEC-001: Prompt Injection diretta
  - H4: T-EXEC-002: Prompt Injection indiretta
  - H4: T-EXEC-003: Injection negli argomenti degli strumenti
  - H4: T-EXEC-004: Bypass dell'approvazione exec
  - H3: 3.4 Persistenza (AML.TA0006)
  - H4: T-PERSIST-001: Installazione di Skill dannosa
  - H4: T-PERSIST-002: Avvelenamento degli aggiornamenti delle Skill
  - H4: T-PERSIST-003: Manomissione della configurazione dell'agente
  - H3: 3.5 Elusione della difesa (AML.TA0007)
  - H4: T-EVADE-001: Bypass dei pattern di moderazione
  - H4: T-EVADE-002: Fuga dal wrapper di contenuto
  - H3: 3.6 Discovery (AML.TA0008)
  - H4: T-DISC-001: Enumerazione degli strumenti
  - H4: T-DISC-002: Estrazione dei dati di sessione
  - H3: 3.7 Raccolta &amp; esfiltrazione (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: Furto di dati tramite webfetch
  - H4: T-EXFIL-002: Invio non autorizzato di messaggi
  - H4: T-EXFIL-003: Raccolta di credenziali
  - H3: 3.8 Impatto (AML.TA0011)
  - H4: T-IMPACT-001: Esecuzione non autorizzata di comandi
  - H4: T-IMPACT-002: Esaurimento delle risorse (DoS)
  - H4: T-IMPACT-003: Danno reputazionale
  - H2: 4. Analisi della supply chain di ClawHub
  - H3: 4.1 Controlli di sicurezza attuali
  - H3: 4.2 Pattern dei flag di moderazione
  - H3: 4.3 Miglioramenti pianificati
  - H2: 5. Matrice dei rischi
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
- Titoli:
  - H2: Dove si trovano i modelli
  - H2: Avvertenze importanti
  - H2: Riprodurre i risultati
  - H3: Esposizione del Gateway e configurazione errata del gateway aperto
  - H3: Pipeline exec di Node (capacità a rischio più elevato)
  - H3: Archivio di associazione (gating DM)
  - H3: Gating di ingresso (menzioni + bypass dei comandi di controllo)
  - H3: Isolamento del routing/chiave di sessione
  - H2: v1++: modelli limitati aggiuntivi (concorrenza, tentativi, correttezza della traccia)
  - H3: Concorrenza / idempotenza dell'archivio di associazione
  - H3: Correlazione / idempotenza della traccia di ingresso
  - H3: Precedenza di routing dmScope + identityLinks
  - H2: Correlati

## security/incident-response.md

- Percorso: /security/incident-response
- Titoli:
  - H2: 1. Rilevamento e triage
  - H2: 2. Valutazione
  - H2: 3. Risposta
  - H2: 4. Comunicazione
  - H2: 5. Ripristino e follow-up

## security/network-proxy.md

- Percorso: /security/network-proxy
- Titoli:
  - H2: Perché usare un proxy
  - H2: Come OpenClaw instrada il traffico
  - H2: Termini proxy correlati
  - H2: Configurazione
  - H3: Modalità local loopback del Gateway
  - H2: Requisiti del proxy
  - H2: Destinazioni bloccate consigliate
  - H2: Convalida
  - H2: Fiducia nella CA del proxy
  - H2: Limiti

## specs/claw-supervisor.md

- Percorso: /specs/claw-supervisor
- Titoli:
  - H1: Claw Supervisor
  - H2: Obiettivo
  - H2: Modello di prodotto
  - H2: Architettura
  - H2: Contratto Codex App-Server
  - H2: Registro sessioni
  - H2: Superficie MCP per Codex
  - H2: Superficie Claw Control
  - H2: Flusso di avvio
  - H2: Distribuzione
  - H2: Sicurezza
  - H2: Piano di implementazione
  - H2: Test di accettazione
  - H2: Domande aperte

## start/bootstrapping.md

- Percorso: /start/bootstrapping
- Titoli:
  - H2: Cosa fa il bootstrapping
  - H2: Saltare il bootstrapping
  - H2: Dove viene eseguito
  - H2: Documenti correlati

## start/docs-directory.md

- Percorso: /start/docs-directory
- Titoli:
  - H2: Inizia qui
  - H2: Provider e UX
  - H2: App companion
  - H2: Operazioni e sicurezza
  - H2: Correlati

## start/getting-started.md

- Percorso: /start/getting-started
- Titoli:
  - H2: Cosa ti serve
  - H2: Configurazione rapida
  - H2: Cosa fare dopo
  - H2: Correlati

## start/hubs.md

- Percorso: /start/hubs
- Titoli:
  - H2: Inizia qui
  - H2: Installazione + aggiornamenti
  - H2: Concetti fondamentali
  - H2: Provider + ingresso
  - H2: Gateway + operazioni
  - H2: Strumenti + automazione
  - H2: Nodi, media, voce
  - H2: Piattaforme
  - H2: App companion macOS (avanzato)
  - H2: Plugin
  - H2: Area di lavoro + template
  - H2: Progetto
  - H2: Test + rilascio
  - H2: Correlati

## start/lore.md

- Percorso: /start/lore
- Titoli:
  - H1: La leggenda di OpenClaw 🦞📖
  - H2: La storia delle origini
  - H2: La prima muta (27 gennaio 2026)
  - H2: Il nome
  - H2: I Dalek contro le aragoste
  - H2: Personaggi chiave
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Il Moltiverso
  - H2: I grandi incidenti
  - H3: Il dump della directory (3 dic 2025)
  - H3: La grande muta (27 gen 2026)
  - H3: La forma finale (30 gennaio 2026)
  - H3: La spesa del robot (3 dic 2025)
  - H2: Testi sacri
  - H2: Il credo dell'aragosta
  - H3: La saga della generazione dell'icona (27 gen 2026)
  - H2: Il futuro
  - H2: Correlati

## start/onboarding-overview.md

- Percorso: /start/onboarding-overview
- Titoli:
  - H2: Quale percorso dovrei usare?
  - H2: Cosa configura l'onboarding
  - H2: Onboarding CLI
  - H2: Onboarding dell'app macOS
  - H2: Provider personalizzati o non elencati
  - H2: Correlati

## start/onboarding.md

- Percorso: /start/onboarding
- Titoli:
  - H2: Correlati

## start/openclaw.md

- Percorso: /start/openclaw
- Titoli:
  - H2: ⚠️ Prima la sicurezza
  - H2: Prerequisiti
  - H2: Configurazione a due telefoni (consigliata)
  - H2: Avvio rapido in 5 minuti
  - H2: Dai all'agente un'area di lavoro (AGENTS)
  - H2: La configurazione che lo trasforma in "un assistente"
  - H2: Sessioni e memoria
  - H2: Heartbeat (modalità proattiva)
  - H2: Media in ingresso e in uscita
  - H2: Checklist operativa
  - H2: Passaggi successivi
  - H2: Correlati

## start/quickstart.md

- Percorso: /start/quickstart
- Titoli:
  - H2: Correlati

## start/setup.md

- Percorso: /start/setup
- Titoli:
  - H2: TL;DR
  - H2: Prerequisiti (da sorgente)
  - H2: Strategia di personalizzazione (per evitare problemi con gli aggiornamenti)
  - H2: Esegui il Gateway da questo repository
  - H2: Flusso di lavoro stabile (prima app macOS)
  - H2: Flusso di lavoro bleeding edge (Gateway in un terminale)
  - H3: 0) (Facoltativo) Esegui anche l'app macOS da sorgente
  - H3: 1) Avvia il Gateway di sviluppo
  - H3: 2) Punta l'app macOS al Gateway in esecuzione
  - H3: 3) Verifica
  - H3: Errori comuni
  - H2: Mappa dell'archiviazione delle credenziali
  - H2: Aggiornamento (senza rovinare la configurazione)
  - H2: Linux (servizio utente systemd)
  - H2: Documenti correlati

## start/showcase.md

- Percorso: /start/showcase
- Titoli:
  - H2: Fresco da Discord
  - H2: Automazione e flussi di lavoro
  - H2: Conoscenza e memoria
  - H2: Voce e telefono
  - H2: Infrastruttura e distribuzione
  - H2: Casa e hardware
  - H2: Progetti della community
  - H2: Invia il tuo progetto
  - H2: Correlati

## start/wizard-cli-automation.md

- Percorso: /start/wizard-cli-automation
- Titoli:
  - H2: Esempio non interattivo di base
  - H2: Esempi specifici per provider
  - H2: Aggiungi un altro agente
  - H2: Documenti correlati

## start/wizard-cli-reference.md

- Percorso: /start/wizard-cli-reference
- Intestazioni:
  - H2: Cosa fa la procedura guidata
  - H2: Dettagli del flusso locale
  - H2: Dettagli della modalità remota
  - H2: Opzioni di autenticazione e modello
  - H2: Output e componenti interni
  - H2: Documenti correlati

## start/wizard.md

- Percorso: /start/wizard
- Intestazioni:
  - H2: Impostazioni locali
  - H2: QuickStart rispetto ad avanzato
  - H2: Cosa configura l'onboarding
  - H2: Aggiungere un altro agente
  - H2: Riferimento completo
  - H2: Documenti correlati

## tools/acp-agents-setup.md

- Percorso: /tools/acp-agents-setup
- Intestazioni:
  - H2: Supporto dell'harness acpx (attuale)
  - H2: Configurazione richiesta
  - H2: Configurazione del Plugin per backend acpx
  - H3: Comando acpx e configurazione della versione
  - H3: Installazione automatica delle dipendenze
  - H3: Bridge MCP degli strumenti del Plugin
  - H3: Bridge MCP degli strumenti OpenClaw
  - H3: Configurazione del timeout delle operazioni di runtime
  - H3: Configurazione dell'agente di probe dello stato
  - H2: Configurazione dei permessi
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Configurazione
  - H2: Correlati

## tools/acp-agents.md

- Percorso: /tools/acp-agents
- Intestazioni:
  - H2: Quale pagina mi serve?
  - H2: Funziona subito?
  - H2: Target harness supportati
  - H2: Runbook dell'operatore
  - H2: ACP rispetto ai sub-agenti
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
  - H3: Parametri sessionsspawn
  - H2: Modalità di associazione allo spawn e thread
  - H2: Modello di recapito
  - H2: Compatibilità sandbox
  - H2: Risoluzione del target della sessione
  - H2: Controlli ACP
  - H3: Mappatura delle opzioni di runtime
  - H2: Harness acpx, configurazione del Plugin e permessi
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
  - H3: Contratto di errore /act
  - H3: Requisito Playwright
  - H4: Installazione Docker Playwright
  - H2: Come funziona (interno)
  - H2: Riferimento rapido CLI
  - H2: Snapshot e riferimenti
  - H2: Potenziamenti dell'attesa
  - H2: Flussi di lavoro di debug
  - H2: Output JSON
  - H2: Stato e parametri dell'ambiente
  - H2: Sicurezza e privacy
  - H2: Correlati

## tools/browser-linux-troubleshooting.md

- Percorso: /tools/browser-linux-troubleshooting
- Intestazioni:
  - H2: Problema: "Impossibile avviare Chrome CDP sulla porta 18800"
  - H3: Causa principale
  - H3: Soluzione 1: installare Google Chrome (consigliato)
  - H3: Soluzione 2: usare Snap Chromium con modalità Attach-Only
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
  - H3: Opzione 2: Chrome MCP locale sull'host
  - H2: Architettura funzionante
  - H2: Perché questa configurazione crea confusione
  - H2: Regola critica per la Control UI
  - H2: Convalidare a strati
  - H3: Strato 1: verificare che Chrome stia servendo CDP su Windows
  - H3: Strato 2: verificare che WSL2 possa raggiungere quell'endpoint Windows
  - H3: Strato 3: configurare il profilo browser corretto
  - H3: Strato 4: verificare separatamente lo strato della Control UI
  - H3: Strato 5: verificare il controllo browser end-to-end
  - H2: Errori fuorvianti comuni
  - H2: Checklist di triage rapido
  - H2: Conclusione pratica
  - H2: Correlati

## tools/browser.md

- Percorso: /tools/browser
- Intestazioni:
  - H2: Cosa si ottiene
  - H2: Avvio rapido
  - H2: Controllo del Plugin
  - H2: Indicazioni per l'agente
  - H2: Comando o strumento del browser mancante
  - H2: Profili: openclaw rispetto a user
  - H2: Configurazione
  - H3: Visione da screenshot (supporto per modelli solo testo)
  - H2: Usare Brave o un altro browser basato su Chromium
  - H2: Controllo locale rispetto a remoto
  - H2: Proxy browser Node (predefinito zero-config)
  - H2: Browserless (CDP remoto ospitato)
  - H3: Docker Browserless sullo stesso host
  - H2: Provider CDP WebSocket diretti
  - H3: Browserbase
  - H3: Notte
  - H2: Sicurezza
  - H2: Profili (multi-browser)
  - H2: Sessione esistente tramite Chrome DevTools MCP
  - H3: Avvio Chrome MCP personalizzato
  - H2: Garanzie di isolamento
  - H2: Selezione del browser
  - H2: API di controllo (opzionale)
  - H2: Risoluzione dei problemi
  - H3: Errore di avvio CDP rispetto a blocco SSRF della navigazione
  - H2: Strumenti dell'agente + come funziona il controllo
  - H2: Correlati

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
  - H2: Creare la prima skill
  - H2: Riferimento SKILL.md
  - H3: Campi obbligatori
  - H3: Chiavi frontmatter opzionali
  - H3: Uso di {baseDir}
  - H2: Aggiungere l'attivazione condizionale
  - H2: Proporre tramite Skill Workshop
  - H2: Pubblicazione su ClawHub
  - H2: Best practice
  - H2: Correlati

## tools/diffs.md

- Percorso: /tools/diffs
- Intestazioni:
  - H2: Avvio rapido
  - H2: Disattivare la guida di sistema integrata
  - H2: Flusso di lavoro tipico dell'agente
  - H2: Esempi di input
  - H2: Riferimento di input dello strumento
  - H2: Evidenziazione della sintassi
  - H2: Contratto dei dettagli di output
  - H2: Sezioni invariate compresse
  - H2: Impostazioni predefinite del Plugin
  - H3: Configurazione dell'URL persistente del visualizzatore
  - H2: Configurazione della sicurezza
  - H2: Ciclo di vita e archiviazione degli artefatti
  - H2: URL del visualizzatore e comportamento di rete
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
  - H2: Cosa elevated non controlla
  - H2: Correlati

## tools/exa-search.md

- Percorso: /tools/exa-search
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Ottenere una chiave API
  - H2: Config
  - H2: Override dell'URL di base
  - H2: Parametri dello strumento
  - H3: Estrazione del contenuto
  - H3: Modalità di ricerca
  - H2: Note
  - H2: Correlati

## tools/exec-approvals-advanced.md

- Percorso: /tools/exec-approvals-advanced
- Intestazioni:
  - H2: Binari sicuri (solo stdin)
  - H3: Validazione di argv e flag negati
  - H3: Directory di binari attendibili
  - H3: Concatenamento shell, wrapper e multiplexer
  - H3: Binari sicuri rispetto ad allowlist
  - H2: Comandi interprete/runtime
  - H3: Comportamento di recapito del follow-up
  - H2: Inoltro delle approvazioni ai canali chat
  - H3: Inoltro delle approvazioni del Plugin
  - H3: Approvazioni nella stessa chat su qualsiasi canale
  - H3: Recapito nativo delle approvazioni
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
  - H2: Parametri della policy
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: Modalità YOLO (senza approvazione)
  - H3: Configurazione persistente "never prompt" dell'host Gateway
  - H3: Scorciatoia locale
  - H3: Host Node
  - H3: Scorciatoia solo sessione
  - H2: Allowlist (per agente)
  - H3: Limitare gli argomenti con argPattern
  - H2: Consenti automaticamente le CLI delle skill
  - H2: Binari sicuri e inoltro delle approvazioni
  - H2: Modifica nella Control UI
  - H2: Flusso di approvazione
  - H2: Eventi di sistema
  - H2: Comportamento in caso di approvazione negata
  - H2: Implicazioni
  - H2: Correlati

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
  - H2: Correlati

## tools/firecrawl.md

- Percorso: /tools/firecrawl
- Intestazioni:
  - H2: Installare il Plugin
  - H2: Webfetch senza chiave e chiavi API
  - H2: Configurare la ricerca Firecrawl
  - H2: Configurare il fallback webfetch Firecrawl
  - H3: Firecrawl self-hosted
  - H2: Strumenti del Plugin Firecrawl
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Stealth / aggiramento dei bot
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
  - H2: Riferimento dei comandi
  - H2: Stati
  - H2: Budget di token
  - H2: Strumenti del modello
  - H2: TUI
  - H2: Comportamento dei canali
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
  - H2: Funzionalità dei provider
  - H2: Parametri dello strumento
  - H2: Configurazione
  - H3: Selezione del modello
  - H3: Ordine di selezione dei provider
  - H3: Modifica delle immagini
  - H2: Approfondimenti sui provider
  - H2: Esempi
  - H2: Correlati

## tools/index.md

- Percorso: /tools
- Intestazioni:
  - H2: Iniziare da qui
  - H2: Scegliere strumenti, Skills o Plugin
  - H2: Categorie di strumenti integrati
  - H2: Strumenti forniti dai Plugin
  - H2: Configurare accesso e approvazioni
  - H2: Estendere le funzionalità
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
  - H2: Esempio: passaggio del flusso di lavoro Lobster
  - H3: Limitazione importante
  - H2: Note sulla sicurezza
  - H2: Correlati

## tools/lobster.md

- Percorso: /tools/lobster
- Intestazioni:
  - H2: Hook
  - H2: Perché
  - H2: Perché una DSL invece di programmi semplici?
  - H2: Come funziona
  - H2: Pattern: piccola CLI + pipe JSON + approvazioni
  - H2: Passaggi LLM solo JSON (llm-task)
  - H3: Limitazione importante: Lobster incorporato rispetto a openclaw.invoke
  - H2: File del flusso di lavoro (.lobster)
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
  - H2: Caso di studio: flussi di lavoro della community
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
  - H2: Speech-to-text e chiamata vocale
  - H2: Mappature dei provider (come i vendor si suddividono tra le superfici)
  - H2: Correlati

## tools/minimax-search.md

- Percorso: /tools/minimax-search
- Intestazioni:
  - H2: Ottieni una credenziale Token Plan
  - H2: Configurazione
  - H2: Selezione della regione
  - H2: Parametri supportati
  - H2: Correlati

## tools/multi-agent-sandbox-tools.md

- Percorso: /tools/multi-agent-sandbox-tools
- Intestazioni:
  - H2: Esempi di configurazione
  - H2: Precedenza della configurazione
  - H3: Configurazione sandbox
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
  - H3: Ordine di selezione del provider
  - H2: Note sui provider
  - H2: Scelta del percorso corretto
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
  - H2: Installa il Plugin
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
  - H2: Comportamento degli errori
  - H2: Esempi
  - H2: Correlati

## tools/permission-modes.md

- Percorso: /tools/permission-modes
- Intestazioni:
  - H2: Valore predefinito consigliato
  - H2: Modalità exec dell'host OpenClaw
  - H2: Mappatura Codex Guardian
  - H2: Autorizzazioni dell'harness ACPX
  - H2: Scelta di una modalità
  - H2: Correlati

## tools/perplexity-search.md

- Percorso: /tools/perplexity-search
- Intestazioni:
  - H2: Installa il Plugin
  - H2: Ottenere una chiave API Perplexity
  - H2: Compatibilità OpenRouter
  - H2: Esempi di configurazione
  - H3: API Perplexity Search nativa
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
  - H3: Scegli una sorgente di installazione
  - H3: Policy di installazione dell'operatore
  - H3: Configura la policy dei Plugin
  - H2: Comprendere i formati dei Plugin
  - H2: Hook dei Plugin
  - H2: Verifica il Gateway attivo
  - H2: Risoluzione dei problemi
  - H3: Proprietà del percorso del Plugin bloccata
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
  - H2: Policy di installazione dell'operatore (security.installPolicy)
  - H2: Allowlist delle Skills incluse
  - H2: Voci per Skill (skills.entries)
  - H2: Allowlist degli agenti (agents)
  - H2: Workshop (skills.workshop)
  - H2: Radici delle Skill collegate con symlink
  - H2: Skills in sandbox e variabili d'ambiente
  - H2: Promemoria sull'ordine di caricamento
  - H2: Correlati

## tools/skills.md

- Percorso: /tools/skills
- Intestazioni:
  - H2: Ordine di caricamento
  - H2: Skills per agente vs condivise
  - H2: Allowlist degli agenti
  - H2: Plugin e Skills
  - H2: Skill Workshop
  - H2: Installazione da ClawHub
  - H2: Sicurezza
  - H2: Formato SKILL.md
  - H3: Chiavi frontmatter facoltative
  - H2: Gating
  - H3: Specifiche dell'installer
  - H2: Override di configurazione
  - H2: Iniezione dell'ambiente
  - H2: Snapshot e aggiornamento
  - H2: Impatto sui token
  - H2: Correlati

## tools/slash-commands.md

- Percorso: /tools/slash-commands
- Intestazioni:
  - H2: Tre tipi di comando
  - H2: Configurazione
  - H2: Elenco dei comandi
  - H3: Comandi core
  - H3: Comandi dock
  - H3: Comandi dei Plugin inclusi
  - H3: Comandi Skill
  - H2: /tools — cosa può usare ora l'agente
  - H2: /model — selezione del modello
  - H2: /config — scritture della configurazione su disco
  - H2: /mcp — configurazione del server MCP
  - H2: /debug — override solo runtime
  - H2: /plugins — gestione dei Plugin
  - H2: /trace — output di trace dei Plugin
  - H2: /btw — domande secondarie
  - H2: Note sulle superfici
  - H2: Utilizzo e stato dei provider
  - H2: Correlati

## tools/steer.md

- Percorso: /tools/steer
- Intestazioni:
  - H2: Sessione corrente
  - H2: Steer vs coda
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
  - H3: Discovery
  - H3: Archiviazione automatica
  - H2: Sotto-agenti annidati
  - H3: Livelli di profondità
  - H3: Catena di annuncio
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
  - H2: Per iniziare
  - H2: Riferimento dello strumento
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Scelta dello strumento corretto
  - H2: Configurazione avanzata
  - H2: Correlati

## tools/thinking.md

- Percorso: /tools/thinking
- Intestazioni:
  - H2: Cosa fa
  - H2: Ordine di risoluzione
  - H2: Impostazione di un valore predefinito di sessione
  - H2: Applicazione per agente
  - H2: Modalità veloce (/fast)
  - H2: Direttive verbose (/verbose o /v)
  - H2: Direttive di trace dei Plugin (/trace)
  - H2: Visibilità del reasoning (/reasoning)
  - H2: Correlati
  - H2: Heartbeat
  - H2: UI chat web
  - H2: Profili provider

## tools/tokenjuice.md

- Percorso: /tools/tokenjuice
- Intestazioni:
  - H2: Abilita il Plugin
  - H2: Cosa cambia tokenjuice
  - H2: Verifica che funzioni
  - H2: Disabilita il Plugin
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
  - H2: Posizione della cattura
  - H2: Disabilita la cattura
  - H2: Regola il timeout di flush
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
  - H2: Personaggi
  - H3: Personaggio minimo
  - H3: Personaggio completo (prompt neutrale rispetto al provider)
  - H3: Risoluzione del personaggio
  - H3: Come i provider usano i prompt del personaggio
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
  - H3: Avanzate
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
  - H2: Scelta di un provider
  - H3: Confronto tra provider
  - H2: Rilevamento automatico
  - H2: Ricerca web OpenAI nativa
  - H2: Ricerca web Codex nativa
  - H2: Sicurezza della rete
  - H2: Configurazione della ricerca web
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
  - H2: Scegli un provider
  - H2: Come funzionano le configurazioni cloud
  - H2: Rafforza prima l'accesso amministratore
  - H2: Agente aziendale condiviso su un VPS
  - H2: Uso dei nodi con un VPS
  - H2: Ottimizzazione dell'avvio per VM piccole e host ARM
  - H3: Checklist di ottimizzazione systemd (facoltativa)
  - H2: Correlati

## web/control-ui.md

- Percorso: /web/control-ui
- Intestazioni:
  - H2: Apertura rapida (locale)
  - H2: Associazione dispositivo (prima connessione)
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
  - H2: Accesso tailnet (consigliato)
  - H2: HTTP non sicuro
  - H2: Content security policy
  - H2: Autenticazione della route avatar
  - H2: Autenticazione della route media dell'assistente
  - H2: Build della UI
  - H2: Pagina Control UI vuota
  - H2: Debug/test: dev server + Gateway remoto
  - H2: Correlati

## web/dashboard.md

- Percorso: /web/dashboard
- Intestazioni:
  - H2: Percorso rapido (consigliato)
  - H2: Fondamenti dell'autenticazione (locale vs remoto)
  - H2: Se vedi "unauthorized" / 1008
  - H2: Correlati

## web/index.md

- Percorso: /web
- Intestazioni:
  - H2: Webhook
  - H2: RPC HTTP amministrativa
  - H2: Configurazione (attiva per impostazione predefinita)
  - H2: Accesso Tailscale
  - H3: Serve integrato (consigliato)
  - H3: Bind tailnet + token
  - H3: Internet pubblico (Funnel)
  - H2: Note di sicurezza
  - H2: Build della UI

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
  - H2: Ripara le configurazioni dalla TUI locale
  - H2: Output degli strumenti
  - H2: Colori del terminale
  - H2: Cronologia + streaming
  - H2: Dettagli della connessione
  - H2: Opzioni
  - H2: Risoluzione dei problemi
  - H2: Risoluzione dei problemi di connessione
  - H2: Correlati

## web/webchat.md

  - Route: /web/webchat
  - Titoli:
  - H2: Che cos'è
  - H2: Avvio rapido
  - H2: Come funziona (comportamento)
  - H3: Trascrizione e modello di consegna
  - H2: Pannello strumenti agenti dell'interfaccia di controllo
  - H2: Uso remoto
  - H2: Riferimento di configurazione (WebChat)
  - H2: Correlati
