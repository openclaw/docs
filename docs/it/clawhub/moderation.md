---
read_when:
    - Segnalazione di una skill, un Plugin o un pacchetto
    - Recupero da un'inserzione sospesa, nascosta o bloccata
    - Comprendere la moderazione, i ban o lo stato dell'account di ClawHub
sidebarTitle: Moderation and Account Safety
summary: Come funzionano segnalazioni, sospensioni di moderazione, inserzioni nascoste, ban e stato dell'account di ClawHub.
title: Moderazione e sicurezza dell'account
x-i18n:
    generated_at: "2026-06-28T00:11:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderazione e sicurezza dell'account

ClawHub è aperto alla pubblicazione, ma le superfici pubbliche di scoperta e installazione richiedono comunque barriere di protezione. Segnalazioni, blocchi di moderazione, schede nascoste e azioni sugli account aiutano a proteggere gli utenti quando una release o un account appare non sicuro, fuorviante o non conforme alle policy.

Questa pagina tratta la moderazione e lo stato dell'account. Per etichette di audit come `Pass`, `Review`, `Warn`, `Malicious` e il livello di rischio, consulta [Audit di sicurezza](/it/clawhub/security-audits).

Consulta anche [Sicurezza](/it/clawhub/security) e [Uso accettabile](/it/clawhub/acceptable-usage). Per dubbi su copyright o altri diritti sui contenuti, usa [Richieste sui diritti dei contenuti](/it/clawhub/content-rights).

## Segnalazioni

Gli utenti che hanno effettuato l'accesso possono segnalare Skills, plugin e pacchetti.

Usa le segnalazioni di ClawHub solo per contenuti del marketplace non sicuri, ad esempio:

- schede dannose
- metadati fuorvianti
- credenziali o requisiti di autorizzazione non dichiarati
- istruzioni di installazione sospette
- impersonificazione
- registrazioni in mala fede o uso improprio di marchi
- contenuti che violano l'[Uso accettabile](/it/clawhub/acceptable-usage)

Usa il pulsante **Segnala Skill** nella pagina di una Skill, oppure il comando/API di segnalazione pacchetto per i pacchetti.

Non usare le segnalazioni di ClawHub per vulnerabilità nel codice sorgente di una Skill o di un plugin di terze parti. Segnalale direttamente al publisher o al repository sorgente collegato dalla scheda. ClawHub non mantiene né corregge il codice di Skills o plugin di terze parti.

Gli avvisi di sicurezza GitHub per `openclaw/clawhub` riguardano vulnerabilità in ClawHub stesso. Alcuni esempi includono bug nel sito web, nell'API, nella CLI, nel registro, nell'autenticazione, nella scansione, nella moderazione o nei confini di attendibilità per download/installazione. Non usare gli avvisi di ClawHub per vulnerabilità in Skills o plugin di terze parti.

Le buone segnalazioni sono specifiche e utilizzabili. L'abuso del sistema di segnalazione può a sua volta portare ad azioni sull'account.

## Rivendicazioni di organizzazione e namespace

Le dispute sulla proprietà di organizzazioni, brand, ambiti di pacchetto, handle proprietario o namespace devono usare il processo [Rivendicazioni di organizzazione e namespace](/it/clawhub/namespace-claims), non il flusso di segnalazione nel prodotto o il modulo di ricorso dell'account.

Usa quel processo quando hai bisogno che lo staff di ClawHub esamini prove non sensibili del fatto che un namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias o comunque riesaminato. Non includere segreti, documenti privati, file legali privati, documenti di identità personali, token API o token di challenge DNS in una issue pubblica.

## Blocchi di moderazione

Alcuni risultati gravi o problemi di policy possono mettere un publisher o una scheda sotto blocco di moderazione. Quando succede, i contenuti interessati possono essere nascosti dalla scoperta pubblica oppure le pubblicazioni future possono iniziare nascoste finché il problema non viene esaminato.

I blocchi di moderazione servono a proteggere gli utenti mentre ClawHub risolve casi ad alto rischio. Possono anche essere rimossi quando viene confermato un falso positivo.

## Schede nascoste o bloccate

Una scheda può essere trattenuta, nascosta, messa in quarantena, revocata o comunque non disponibile sulle superfici pubbliche di installazione.

Se vedi uno di questi stati, non installare la release a meno che il proprietario non risolva il problema o la moderazione non la ripristini.

I proprietari possono comunque vedere la diagnostica per le proprie schede trattenute o nascoste. Questa diagnostica aiuta a spiegare cosa è successo e cosa deve cambiare prima che la scheda possa tornare sulle superfici pubbliche.

## Ban e stato dell'account

Gli account che violano le policy di ClawHub possono perdere l'accesso alla pubblicazione. Gli abusi gravi possono comportare ban dell'account, revoca dei token, contenuti nascosti o schede rimosse. I segnali di pressione da abuso del publisher vengono controllati quotidianamente. I segnali che raggiungono la soglia di potenziale ban di ClawHub possono attivare un avviso automatico. Se la successiva scansione idonea dopo la scadenza dell'avviso colloca ancora il publisher nella soglia di potenziale ban, ClawHub può applicare automaticamente l'azione sull'account. I segnali di revisione a minore confidenza e temporalmente limitati restano esclusi dall'applicazione automatica.

Gli account eliminati, bannati o disabilitati non possono usare token API di ClawHub. Se l'autenticazione CLI inizia a non riuscire dopo un'azione sull'account, accedi all'interfaccia web per esaminare lo stato dell'account. Se l'accesso o il normale accesso CLI è bloccato da un ban o da un account disabilitato, usa il [modulo di ricorso ClawHub](https://appeals.openclaw.ai/) per una revisione del recupero.

Se un'email attivata da uno scanner indica una versione di una Skill o di un plugin come dannosa, scarica i risultati di scansione archiviati per la versione inviata e bloccata:
`clawhub scan download <slug> --version <version>`. Per i plugin, aggiungi
`--kind plugin`. Esamina l'output della scansione, correggi la scheda, incrementa il numero di versione e carica la versione corretta.

## Indicazioni per i publisher

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili di ambiente e le autorizzazioni richieste
- evita comandi di installazione offuscati
- collega il sorgente quando possibile
- usa esecuzioni di prova prima di pubblicare plugin
- rispondi chiaramente se utenti o moderatori chiedono informazioni sul comportamento della release
