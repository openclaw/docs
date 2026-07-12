---
read_when:
    - Segnalazione di una skill, un plugin o un pacchetto
    - Ripristino da un'inserzione sospesa, nascosta o bloccata
    - Comprendere la moderazione di ClawHub, i ban o lo stato dell'account
sidebarTitle: Moderation and Account Safety
summary: Come funzionano le segnalazioni, i blocchi di moderazione, le inserzioni nascoste, i ban e lo stato dell'account su ClawHub.
title: Moderazione e sicurezza dell'account
x-i18n:
    generated_at: "2026-07-12T06:52:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderazione e sicurezza dell'account

ClawHub consente liberamente la pubblicazione, ma la scoperta pubblica e le superfici di installazione necessitano comunque di misure di protezione. Segnalazioni, sospensioni per moderazione, inserzioni nascoste e provvedimenti sugli account contribuiscono a proteggere gli utenti quando una versione o un account appare non sicuro, ingannevole o non conforme alle norme.

Questa pagina tratta la moderazione e lo stato dell'account. Per le etichette di verifica come `Pass`, `Review`, `Warn`, `Malicious` e il livello di rischio, consulta
[Verifiche di sicurezza](/clawhub/security-audits).

Vedi anche [Sicurezza](/it/clawhub/security) e
[Uso accettabile](/clawhub/acceptable-usage). Per questioni relative al copyright o ad altri diritti sui contenuti, utilizza [Richieste relative ai diritti sui contenuti](/clawhub/content-rights).

## Segnalazioni

Gli utenti autenticati possono segnalare Skills, Plugin e pacchetti.

Utilizza le segnalazioni di ClawHub solo per contenuti non sicuri nel marketplace, come:

- inserzioni dannose
- metadati ingannevoli
- credenziali o requisiti di autorizzazione non dichiarati
- istruzioni di installazione sospette
- furto d'identità
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano le norme sull'[Uso accettabile](/clawhub/acceptable-usage)

Utilizza il pulsante **Segnala skill** nella pagina di una skill oppure il comando o l'API di segnalazione dei pacchetti.

Non utilizzare le segnalazioni di ClawHub per vulnerabilità nel codice sorgente di una skill o di un Plugin di terze parti. Segnalale direttamente all'editore o al repository del codice sorgente collegato nell'inserzione. ClawHub non gestisce né corregge il codice di Skills o Plugin di terze parti.

Gli avvisi di sicurezza di GitHub per `openclaw/clawhub` riguardano vulnerabilità di ClawHub stesso. Alcuni esempi sono bug nel sito web, nell'API, nella CLI, nel registro, nell'autenticazione, nella scansione, nella moderazione o nei confini di attendibilità del download e dell'installazione. Non utilizzare gli avvisi di ClawHub per vulnerabilità in Skills o Plugin di terze parti.

Le segnalazioni efficaci sono specifiche e consentono di intervenire. L'abuso del sistema di segnalazione può a sua volta comportare provvedimenti sull'account.

## Rivendicazioni di organizzazioni e spazi dei nomi

Le controversie sulla proprietà di organizzazioni, marchi, ambiti dei pacchetti, identificativi dei proprietari o spazi dei nomi devono seguire la procedura [Rivendicazioni di organizzazioni e spazi dei nomi](/clawhub/namespace-claims), non il flusso di segnalazione interno al prodotto né il modulo di ricorso relativo all'account.

Utilizza questa procedura quando è necessario che il personale di ClawHub esamini prove non sensibili per stabilire se uno spazio dei nomi debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias o sottoposto ad altra verifica. Non includere segreti, documenti privati, atti legali privati, documenti d'identità personali, token API o token di verifica DNS in una segnalazione pubblica.

## Sospensioni per moderazione

Alcuni riscontri gravi o violazioni delle norme possono comportare una sospensione per moderazione di un editore o di un'inserzione. In questo caso, i contenuti interessati possono essere nascosti dalla scoperta pubblica oppure le pubblicazioni future possono essere inizialmente nascoste fino alla verifica del problema.

Le sospensioni per moderazione servono a proteggere gli utenti mentre ClawHub risolve i casi ad alto rischio. Possono anche essere revocate quando viene confermato un falso positivo.

## Inserzioni nascoste o bloccate

Un'inserzione può essere sospesa, nascosta, messa in quarantena, revocata o resa altrimenti non disponibile sulle superfici pubbliche di installazione.

Se riscontri uno di questi stati, non installare la versione finché il proprietario non risolve il problema o la moderazione non ne ripristina la disponibilità.

I proprietari possono continuare a visualizzare informazioni diagnostiche per le proprie inserzioni sospese o nascoste. Queste informazioni aiutano a spiegare che cosa è accaduto e quali modifiche sono necessarie prima che l'inserzione possa tornare sulle superfici pubbliche.

## Ban e stato dell'account

Gli account che violano le norme di ClawHub possono perdere l'accesso alla pubblicazione. Gli abusi gravi possono comportare il ban dell'account, la revoca dei token, contenuti nascosti o inserzioni rimosse. Gli indicatori di rischio di abuso da parte degli editori vengono controllati ogni giorno. Gli indicatori che raggiungono la soglia di ClawHub per un potenziale ban possono attivare un avviso automatico. Se la prima scansione idonea successiva alla scadenza dell'avviso colloca ancora l'editore nella soglia di potenziale ban, ClawHub può applicare automaticamente il provvedimento sull'account. Gli indicatori di verifica temporale con confidenza inferiore e portata limitata restano esclusi dall'applicazione automatica delle misure.

Gli account eliminati, soggetti a ban o disabilitati non possono utilizzare i token API di ClawHub. Se l'autenticazione tramite CLI inizia a non riuscire dopo un provvedimento sull'account, accedi all'interfaccia web per verificarne lo stato. Se l'accesso o il normale utilizzo della CLI è bloccato da un ban o da un account disabilitato, utilizza il [modulo di ricorso di ClawHub](https://appeals.openclaw.ai/) per richiedere una verifica ai fini del ripristino.

Se un'email attivata dallo scanner indica come dannosa una versione di una skill o di un Plugin, scarica i risultati di scansione archiviati per la versione inviata e bloccata:
`clawhub scan download <slug> --version <version>`. Per i Plugin, aggiungi
`--kind plugin`. Esamina i risultati della scansione, correggi l'inserzione, incrementa il numero di versione e carica la versione corretta.

## Indicazioni per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e registri delle modifiche
- dichiara le variabili di ambiente e le autorizzazioni necessarie
- evita comandi di installazione offuscati
- inserisci un collegamento al codice sorgente quando possibile
- esegui simulazioni prima di pubblicare Plugin
- rispondi con chiarezza se utenti o moderatori chiedono informazioni sul comportamento di una versione
