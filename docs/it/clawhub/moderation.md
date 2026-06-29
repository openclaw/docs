---
read_when:
    - Segnalare una skill, un plugin o un pacchetto
    - Ripristino da un annuncio sospeso, nascosto o bloccato
    - Comprendere la moderazione, i ban o lo stato dell'account di ClawHub
sidebarTitle: Moderation and Account Safety
summary: Come funzionano segnalazioni ClawHub, sospensioni di moderazione, inserzioni nascoste, ban e stato dell’account.
title: Moderazione e sicurezza dell'account
x-i18n:
    generated_at: "2026-06-28T22:32:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderazione e sicurezza degli account

ClawHub è aperto alla pubblicazione, ma le superfici pubbliche di scoperta e installazione hanno comunque bisogno di protezioni. Segnalazioni, sospensioni di moderazione, inserzioni nascoste e azioni sugli account aiutano a proteggere gli utenti quando una release o un account appare non sicuro, fuorviante o non conforme alle policy.

Questa pagina riguarda la moderazione e lo stato dell'account. Per etichette di audit come `Pass`, `Review`, `Warn`, `Malicious` e il livello di rischio, consulta [Audit di sicurezza](/it/clawhub/security-audits).

Vedi anche [Sicurezza](/it/clawhub/security) e [Utilizzo accettabile](/it/clawhub/acceptable-usage). Per dubbi su copyright o altri diritti sui contenuti, usa [Richieste sui diritti dei contenuti](/it/clawhub/content-rights).

## Segnalazioni

Gli utenti che hanno effettuato l'accesso possono segnalare Skills, Plugin e pacchetti.

Usa le segnalazioni ClawHub solo per contenuti del marketplace non sicuri, come:

- inserzioni dannose
- metadati fuorvianti
- credenziali o requisiti di autorizzazione non dichiarati
- istruzioni di installazione sospette
- impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano l'[Utilizzo accettabile](/it/clawhub/acceptable-usage)

Usa il pulsante **Segnala Skill** nella pagina di una Skill, oppure il comando/API di segnalazione pacchetto per i pacchetti.

Non usare le segnalazioni ClawHub per vulnerabilità nel codice sorgente proprio di una Skill o di un Plugin di terze parti. Segnalale direttamente al publisher o al repository sorgente collegato dall'inserzione. ClawHub non mantiene né corregge il codice di Skill o Plugin di terze parti.

I GitHub Security Advisories per `openclaw/clawhub` riguardano vulnerabilità in ClawHub stesso. Gli esempi includono bug nel sito web, nell'API, nella CLI, nel registro, nell'autenticazione, nella scansione, nella moderazione o nei confini di attendibilità di download/installazione. Non usare gli advisory di ClawHub per vulnerabilità in Skills o Plugin di terze parti.

Le buone segnalazioni sono specifiche e attuabili. L'abuso delle segnalazioni può a sua volta portare ad azioni sull'account.

## Rivendicazioni di organizzazioni e namespace

Le dispute sulla proprietà di organizzazioni, brand, ambiti di pacchetto, handle di proprietari o namespace devono usare il processo [Rivendicazioni di organizzazioni e namespace](/it/clawhub/namespace-claims), non il flusso di segnalazione nel prodotto o il modulo di appello dell'account.

Usa quel processo quando hai bisogno che lo staff di ClawHub esamini prove non sensibili del fatto che un namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, aliasato o altrimenti esaminato. Non includere segreti, documenti privati, file legali privati, documenti di identità personali, token API o token di challenge DNS in una issue pubblica.

## Sospensioni di moderazione

Alcuni rilievi gravi o problemi di policy possono sottoporre un publisher o un'inserzione a una sospensione di moderazione. Quando accade, il contenuto interessato può essere nascosto dalla scoperta pubblica oppure le pubblicazioni future possono iniziare come nascoste finché il problema non viene esaminato.

Le sospensioni di moderazione servono a proteggere gli utenti mentre ClawHub risolve casi ad alto rischio. Possono anche essere revocate quando viene confermato un falso positivo.

## Inserzioni nascoste o bloccate

Un'inserzione può essere sospesa, nascosta, messa in quarantena, revocata o altrimenti non disponibile sulle superfici pubbliche di installazione.

Se vedi uno di questi stati, non installare la release a meno che il proprietario non risolva il problema o la moderazione non la ripristini.

I proprietari possono comunque vedere la diagnostica per le proprie inserzioni sospese o nascoste. Questa diagnostica aiuta a spiegare cosa è successo e cosa deve cambiare prima che l'inserzione possa tornare sulle superfici pubbliche.

## Ban e stato dell'account

Gli account che violano la policy di ClawHub possono perdere l'accesso alla pubblicazione. Gli abusi gravi possono comportare ban dell'account, revoca dei token, contenuti nascosti o inserzioni rimosse. I segnali di pressione da abuso dei publisher vengono controllati quotidianamente. I segnali che raggiungono la soglia di potenziale ban di ClawHub possono attivare un avviso automatico. Se la successiva scansione idonea dopo la scadenza dell'avviso colloca ancora il publisher nella soglia di potenziale ban, ClawHub può applicare automaticamente l'azione sull'account. I segnali di revisione a minore confidenza e temporalmente limitati restano fuori dall'applicazione automatica.

Gli account eliminati, bannati o disabilitati non possono usare token API di ClawHub. Se l'autenticazione CLI inizia a non riuscire dopo un'azione sull'account, accedi all'interfaccia web per verificare lo stato dell'account. Se l'accesso o il normale accesso CLI è bloccato da un ban o da un account disabilitato, usa il [modulo di appello ClawHub](https://appeals.openclaw.ai/) per la revisione del recupero.

Se un'email attivata da scanner indica una versione di Skill o Plugin come dannosa, scarica i risultati di scansione archiviati per la versione inviata bloccata: `clawhub scan download <slug> --version <version>`. Per i Plugin, aggiungi `--kind plugin`. Esamina l'output della scansione, correggi l'inserzione, incrementa il numero di versione e carica la versione corretta.

## Indicazioni per i publisher

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili d'ambiente e le autorizzazioni richieste
- evita comandi di installazione offuscati
- collega il sorgente quando possibile
- usa esecuzioni di prova prima di pubblicare Plugin
- rispondi con chiarezza se utenti o moderatori chiedono informazioni sul comportamento della release
