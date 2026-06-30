---
read_when:
    - Segnalare una skill, un Plugin o un pacchetto
    - Ripristino da un'inserzione trattenuta, nascosta o bloccata
    - Comprendere la moderazione, i ban o lo stato dell'account di ClawHub
sidebarTitle: Moderation and Account Safety
summary: Come funzionano le segnalazioni di ClawHub, i blocchi di moderazione, le inserzioni nascoste, i ban e lo stato dell'account.
title: Moderazione e sicurezza dell'account
x-i18n:
    generated_at: "2026-06-30T22:17:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Sicurezza della moderazione e degli account

ClawHub è aperto alla pubblicazione, ma le superfici pubbliche di individuazione e installazione hanno comunque bisogno di protezioni. Segnalazioni, blocchi di moderazione, inserzioni nascoste e azioni sugli account aiutano a proteggere gli utenti quando una release o un account appare non sicuro, fuorviante o non conforme alle norme.

Questa pagina riguarda la moderazione e lo stato dell'account. Per etichette di audit come `Pass`, `Review`, `Warn`, `Malicious` e il livello di rischio, consulta [Audit di sicurezza](/clawhub/security-audits).

Vedi anche [Sicurezza](/clawhub/security) e [Uso accettabile](/clawhub/acceptable-usage). Per problemi di copyright o altri diritti sui contenuti, usa [Richieste sui diritti dei contenuti](/clawhub/content-rights).

## Segnalazioni

Gli utenti autenticati possono segnalare skill, plugin e pacchetti.

Usa le segnalazioni di ClawHub solo per contenuti del marketplace non sicuri, come:

- inserzioni dannose
- metadati fuorvianti
- credenziali o requisiti di autorizzazione non dichiarati
- istruzioni di installazione sospette
- impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano l'[Uso accettabile](/clawhub/acceptable-usage)

Usa il pulsante **Segnala skill** nella pagina di una skill, oppure il comando/API di segnalazione dei pacchetti per i pacchetti.

Non usare le segnalazioni di ClawHub per vulnerabilità nel codice sorgente proprio di una skill o di un plugin di terze parti. Segnalale direttamente all'editore o al repository sorgente collegato dall'inserzione. ClawHub non mantiene né corregge il codice di skill o plugin di terze parti.

Gli avvisi di sicurezza GitHub per `openclaw/clawhub` riguardano vulnerabilità in ClawHub stesso. Gli esempi includono bug nel sito web, nell'API, nella CLI, nel registro, nell'autenticazione, nella scansione, nella moderazione o nei confini di attendibilità del download/installazione. Non usare gli avvisi di ClawHub per vulnerabilità in skill o plugin di terze parti.

Le buone segnalazioni sono specifiche e attuabili. L'abuso delle segnalazioni può a sua volta portare ad azioni sull'account.

## Rivendicazioni di organizzazione e namespace

Le dispute sulla proprietà di organizzazioni, brand, ambiti di pacchetto, handle del proprietario o namespace devono usare la procedura [Rivendicazioni di organizzazioni e namespace](/clawhub/namespace-claims), non il flusso di segnalazione nel prodotto o il modulo di appello dell'account.

Usa questa procedura quando hai bisogno che lo staff di ClawHub esamini prove non sensibili che dimostrino che un namespace deve essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias o comunque esaminato. Non includere segreti, documenti privati, file legali privati, documenti di identità personale, token API o token di verifica DNS in una issue pubblica.

## Blocchi di moderazione

Alcuni rilievi gravi o problemi di policy possono porre un editore o un'inserzione sotto blocco di moderazione. Quando questo accade, il contenuto interessato può essere nascosto dall'individuazione pubblica oppure le pubblicazioni future possono iniziare come nascoste finché il problema non viene esaminato.

I blocchi di moderazione servono a proteggere gli utenti mentre ClawHub risolve casi ad alto rischio. Possono anche essere revocati quando viene confermato un falso positivo.

## Inserzioni nascoste o bloccate

Un'inserzione può essere trattenuta, nascosta, messa in quarantena, revocata o comunque non disponibile sulle superfici pubbliche di installazione.

Se vedi uno di questi stati, non installare la release a meno che il proprietario non risolva il problema o la moderazione non la ripristini.

I proprietari possono comunque vedere la diagnostica per le proprie inserzioni trattenute o nascoste. Questa diagnostica aiuta a spiegare cosa è successo e cosa deve cambiare prima che l'inserzione possa tornare sulle superfici pubbliche.

## Ban e stato dell'account

Gli account che violano la policy di ClawHub possono perdere l'accesso alla pubblicazione. Gli abusi gravi possono comportare ban dell'account, revoca dei token, contenuti nascosti o inserzioni rimosse. I segnali di pressione da abuso dell'editore vengono controllati quotidianamente. I segnali che raggiungono la soglia di potenziale ban di ClawHub possono attivare un avviso automatico. Se la successiva scansione idonea dopo la scadenza dell'avviso colloca ancora l'editore nella soglia di potenziale ban, ClawHub può applicare automaticamente l'azione sull'account. I segnali di revisione a minore confidenza e limitati temporalmente restano fuori dall'applicazione automatica.

Gli account eliminati, bannati o disabilitati non possono usare i token API di ClawHub. Se l'autenticazione CLI inizia a non riuscire dopo un'azione sull'account, accedi all'interfaccia web per esaminare lo stato dell'account. Se l'accesso o il normale accesso CLI è bloccato da un ban o da un account disabilitato, usa il [modulo di appello ClawHub](https://appeals.openclaw.ai/) per la revisione del recupero.

Se un'email attivata da uno scanner indica una versione di skill o plugin come dannosa, scarica i risultati di scansione archiviati per la versione inviata bloccata: `clawhub scan download <slug> --version <version>`. Per i plugin, aggiungi `--kind plugin`. Esamina l'output della scansione, correggi l'inserzione, incrementa il numero di versione e carica la versione corretta.

## Linee guida per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili d'ambiente e le autorizzazioni richieste
- evita comandi di installazione offuscati
- collega il sorgente quando possibile
- usa esecuzioni di prova prima di pubblicare plugin
- rispondi chiaramente se utenti o moderatori chiedono informazioni sul comportamento della release
