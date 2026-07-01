---
read_when:
    - Segnalare una skill, un plugin o un pacchetto
    - Recupero da un annuncio trattenuto, nascosto o bloccato
    - Comprendere la moderazione, i ban o lo stato dell'account di ClawHub
sidebarTitle: Moderation and Account Safety
summary: Come funzionano le segnalazioni di ClawHub, i blocchi di moderazione, gli elenchi nascosti, i ban e lo stato dell'account.
title: Moderazione e sicurezza dell'account
x-i18n:
    generated_at: "2026-07-01T18:13:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderazione e sicurezza degli account

ClawHub è aperto alla pubblicazione, ma le superfici pubbliche di scoperta e installazione hanno comunque
bisogno di protezioni. Segnalazioni, sospensioni di moderazione, inserzioni nascoste e azioni sugli account
aiutano a proteggere gli utenti quando una release o un account appare non sicuro, fuorviante o fuori
policy.

Questa pagina riguarda la moderazione e lo stato dell'account. Per etichette di audit come
`Pass`, `Review`, `Warn`, `Malicious` e livello di rischio, consulta
[Audit di sicurezza](/clawhub/security-audits).

Vedi anche [Sicurezza](/clawhub/security) e
[Uso accettabile](/clawhub/acceptable-usage). Per dubbi su copyright o altri diritti sui contenuti,
usa [Richieste sui diritti dei contenuti](/clawhub/content-rights).

## Segnalazioni

Gli utenti autenticati possono segnalare Skills, Plugin e pacchetti.

Usa le segnalazioni di ClawHub solo per contenuti del marketplace non sicuri, come:

- inserzioni dannose
- metadati fuorvianti
- credenziali o requisiti di autorizzazione non dichiarati
- istruzioni di installazione sospette
- impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano [Uso accettabile](/clawhub/acceptable-usage)

Usa il pulsante **Segnala skill** in una pagina skill, oppure il comando/API di segnalazione
dei pacchetti per i pacchetti.

Non usare le segnalazioni di ClawHub per vulnerabilità nel codice sorgente proprio di una skill o di un
Plugin di terze parti. Segnalale direttamente all'editore o al repository sorgente collegato
dall'inserzione. ClawHub non mantiene né corregge il codice di skill o Plugin di terze parti.

Gli avvisi di sicurezza GitHub per `openclaw/clawhub` riguardano vulnerabilità in
ClawHub stesso. Gli esempi includono bug nel sito web, API, CLI, registro, autenticazione,
scansione, moderazione o nei confini di fiducia di download/installazione. Non usare gli
avvisi di ClawHub per vulnerabilità in skill o Plugin di terze parti.

Le buone segnalazioni sono specifiche e utilizzabili. Anche l'abuso delle segnalazioni può portare ad
azioni sull'account.

## Rivendicazioni di organizzazioni e namespace

Le dispute su proprietà di organizzazioni, brand, ambiti di pacchetti, handle proprietario o namespace devono
usare il processo [Rivendicazioni di organizzazioni e namespace](/clawhub/namespace-claims), non il
flusso di segnalazione nel prodotto né il modulo di ricorso dell'account.

Usa quel processo quando hai bisogno che lo staff di ClawHub esamini prove non sensibili del fatto che un
namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias
o altrimenti revisionato. Non includere segreti, documenti privati, file legali privati,
documenti di identità personale, token API o token di challenge DNS in una issue pubblica.

## Sospensioni di moderazione

Alcune rilevazioni gravi o problemi di policy possono mettere un editore o un'inserzione sotto
sospensione di moderazione. Quando questo accade, il contenuto interessato può essere nascosto dalla scoperta
pubblica oppure le pubblicazioni future possono iniziare come nascoste finché il problema non viene esaminato.

Le sospensioni di moderazione servono a proteggere gli utenti mentre ClawHub risolve casi ad alto rischio.
Possono anche essere revocate quando viene confermato un falso positivo.

## Inserzioni nascoste o bloccate

Un'inserzione può essere sospesa, nascosta, messa in quarantena, revocata o altrimenti non disponibile sulle
superfici pubbliche di installazione.

Se vedi uno di questi stati, non installare la release a meno che il proprietario non risolva il problema
o la moderazione non la ripristini.

I proprietari possono comunque vedere la diagnostica per le proprie inserzioni sospese o nascoste. Questa
diagnostica aiuta a spiegare cosa è successo e cosa deve cambiare prima che l'inserzione possa tornare sulle
superfici pubbliche.

## Ban e stato dell'account

Gli account che violano la policy di ClawHub possono perdere l'accesso alla pubblicazione. Abusi gravi possono
comportare ban dell'account, revoca dei token, contenuti nascosti o inserzioni rimosse.
I segnali di pressione di abuso degli editori vengono controllati quotidianamente. I segnali che raggiungono
la soglia di potenziale ban di ClawHub possono attivare un avviso automatico. Se la successiva
scansione idonea dopo la scadenza dell'avviso colloca ancora l'editore nella
soglia di potenziale ban, ClawHub può applicare automaticamente l'azione sull'account.
I segnali di revisione a minore confidenza e temporalmente limitati restano fuori dall'applicazione
automatica.

Gli account eliminati, bannati o disabilitati non possono usare token API di ClawHub. Se l'autenticazione CLI
inizia a non riuscire dopo un'azione sull'account, accedi all'interfaccia web per controllare lo
stato dell'account. Se l'accesso o il normale accesso CLI è bloccato da un ban o da un account disabilitato,
usa il [modulo di ricorso ClawHub](https://appeals.openclaw.ai/) per la revisione del recupero.

Se un'email attivata dallo scanner indica una versione di skill o Plugin come dannosa,
scarica i risultati di scansione memorizzati per la versione inviata bloccata:
`clawhub scan download <slug> --version <version>`. Per i Plugin, aggiungi
`--kind plugin`. Esamina l'output della scansione, correggi l'inserzione, incrementa il numero di versione
e carica la versione corretta.

## Linee guida per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili d'ambiente e le autorizzazioni richieste
- evita comandi di installazione offuscati
- collega il sorgente quando possibile
- usa esecuzioni di prova prima di pubblicare Plugin
- rispondi chiaramente se utenti o moderatori chiedono informazioni sul comportamento della release
