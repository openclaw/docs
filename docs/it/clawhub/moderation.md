---
read_when:
    - Segnalare una skill, un plugin o un pacchetto
    - Recupero da un annuncio sospeso, nascosto o bloccato
    - Comprendere la moderazione di ClawHub, i ban o lo stato dell'account
sidebarTitle: Moderation and Account Safety
summary: Come funzionano le segnalazioni di ClawHub, i blocchi di moderazione, gli elenchi nascosti, i ban e lo stato dell'account.
title: Moderazione e sicurezza dell'account
x-i18n:
    generated_at: "2026-07-01T08:06:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderazione e sicurezza dell'account

ClawHub è aperto alla pubblicazione, ma le superfici pubbliche di scoperta e installazione hanno comunque bisogno di protezioni. Segnalazioni, sospensioni di moderazione, schede nascoste e azioni sugli account aiutano a proteggere gli utenti quando una release o un account appare non sicuro, fuorviante o non conforme alle policy.

Questa pagina copre la moderazione e lo stato dell'account. Per le etichette di audit come `Pass`, `Review`, `Warn`, `Malicious` e il livello di rischio, consulta [Audit di sicurezza](/clawhub/security-audits).

Vedi anche [Sicurezza](/clawhub/security) e [Uso accettabile](/clawhub/acceptable-usage). Per problemi relativi a copyright o altri diritti sui contenuti, usa [Richieste sui diritti dei contenuti](/clawhub/content-rights).

## Segnalazioni

Gli utenti che hanno effettuato l'accesso possono segnalare Skills, Plugin e pacchetti.

Usa le segnalazioni ClawHub solo per contenuti del marketplace non sicuri, come:

- schede dannose
- metadati fuorvianti
- credenziali o requisiti di autorizzazione non dichiarati
- istruzioni di installazione sospette
- impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano [Uso accettabile](/clawhub/acceptable-usage)

Usa il pulsante **Segnala skill** nella pagina di una skill, oppure il comando/API di segnalazione dei pacchetti per i pacchetti.

Non usare le segnalazioni ClawHub per vulnerabilità nel codice sorgente di una skill o di un Plugin di terze parti. Segnalale direttamente all'editore o al repository sorgente collegato dalla scheda. ClawHub non mantiene né corregge il codice di skill o Plugin di terze parti.

I GitHub Security Advisories per `openclaw/clawhub` sono destinati alle vulnerabilità in ClawHub stesso. Gli esempi includono bug nel sito web, nell'API, nella CLI, nel registro, nell'autenticazione, nella scansione, nella moderazione o nei confini di fiducia per download/installazione. Non usare gli advisory ClawHub per vulnerabilità in Skills o Plugin di terze parti.

Le buone segnalazioni sono specifiche e attuabili. L'abuso delle segnalazioni può a sua volta portare ad azioni sull'account.

## Rivendicazioni di organizzazione e namespace

Le dispute sulla proprietà di organizzazioni, marchi, ambiti di pacchetto, handle proprietario o namespace devono usare il processo [Rivendicazioni di organizzazione e namespace](/clawhub/namespace-claims), non il flusso di segnalazione nel prodotto o il modulo di ricorso dell'account.

Usa quel processo quando hai bisogno che lo staff di ClawHub esamini prove non sensibili secondo cui un namespace dovrebbe essere riservato, trasferito, rinominato, nascosto, messo in quarantena, avere un alias o essere altrimenti esaminato. Non includere segreti, documenti privati, file legali privati, documenti di identità personale, token API o token di challenge DNS in una issue pubblica.

## Sospensioni di moderazione

Alcuni rilievi gravi o problemi di policy possono sottoporre un editore o una scheda a una sospensione di moderazione. Quando ciò accade, il contenuto interessato può essere nascosto dalla scoperta pubblica oppure le pubblicazioni future possono iniziare nascoste fino alla revisione del problema.

Le sospensioni di moderazione servono a proteggere gli utenti mentre ClawHub risolve casi ad alto rischio. Possono anche essere revocate quando viene confermato un falso positivo.

## Schede nascoste o bloccate

Una scheda può essere sospesa, nascosta, messa in quarantena, revocata o comunque non disponibile sulle superfici pubbliche di installazione.

Se vedi uno di questi stati, non installare la release a meno che il proprietario risolva il problema o la moderazione la ripristini.

I proprietari possono comunque vedere la diagnostica per le proprie schede sospese o nascoste. Questa diagnostica aiuta a spiegare cosa è successo e cosa deve cambiare prima che la scheda possa tornare sulle superfici pubbliche.

## Ban e stato dell'account

Gli account che violano le policy di ClawHub possono perdere l'accesso alla pubblicazione. Abusi gravi possono comportare ban dell'account, revoca dei token, contenuti nascosti o schede rimosse. I segnali di pressione per abuso dell'editore vengono controllati quotidianamente. I segnali che raggiungono la soglia di possibile ban di ClawHub possono attivare un avviso automatico. Se la successiva scansione idonea dopo la scadenza dell'avviso colloca ancora l'editore nella soglia di possibile ban, ClawHub può applicare automaticamente l'azione sull'account. I segnali di revisione temporale a bassa confidenza e circoscritti restano esclusi dall'applicazione automatica.

Gli account eliminati, bannati o disabilitati non possono usare i token API di ClawHub. Se l'autenticazione CLI inizia a fallire dopo un'azione sull'account, accedi all'interfaccia web per verificare lo stato dell'account. Se l'accesso o il normale accesso CLI è bloccato da un ban o da un account disabilitato, usa il [modulo di ricorso ClawHub](https://appeals.openclaw.ai/) per la revisione del recupero.

Se un'email attivata dallo scanner indica come dannosa una versione di skill o Plugin, scarica i risultati della scansione archiviati per la versione inviata e bloccata:
`clawhub scan download <slug> --version <version>`. Per i Plugin, aggiungi `--kind plugin`. Esamina l'output della scansione, correggi la scheda, incrementa il numero di versione e carica la versione corretta.

## Linee guida per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili d'ambiente e le autorizzazioni richieste
- evita comandi di installazione offuscati
- collega il sorgente quando possibile
- usa dry run prima di pubblicare Plugin
- rispondi chiaramente se utenti o moderatori chiedono informazioni sul comportamento della release
