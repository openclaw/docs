---
read_when:
    - Segnalazione di una skill, un plugin o un pacchetto
    - Ripristino di un'inserzione sospesa, nascosta o bloccata
    - Comprendere la moderazione di ClawHub, i ban o lo stato dell'account
sidebarTitle: Moderation and Account Safety
summary: Come funzionano le segnalazioni, i blocchi di moderazione, gli elementi nascosti, i ban e lo stato dell'account in ClawHub.
title: Moderazione e sicurezza dell'account
x-i18n:
    generated_at: "2026-07-16T14:03:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderazione e sicurezza dell'account

ClawHub è aperto alla pubblicazione, ma le superfici di individuazione pubblica e installazione necessitano comunque di misure di protezione. Segnalazioni, sospensioni per moderazione, inserzioni nascoste e provvedimenti sugli account contribuiscono a proteggere gli utenti quando una versione o un account appare non sicuro, fuorviante o non conforme alle norme.

Questa pagina tratta la moderazione e lo stato dell'account. Per le etichette di controllo come
`Pass`, `Review`, `Warn`, `Malicious` e il livello di rischio, consultare
[Controlli di sicurezza](/clawhub/security-audits).

Consultare anche [Sicurezza](/clawhub/security) e
[Uso accettabile](/clawhub/acceptable-usage). Per questioni relative al copyright o ad altri diritti sui contenuti, utilizzare [Richieste relative ai diritti sui contenuti](/clawhub/content-rights).

## Segnalazioni

Gli utenti autenticati possono segnalare skill, Plugin e pacchetti.

Utilizzare le segnalazioni di ClawHub solo per contenuti non sicuri del marketplace, come:

- inserzioni dannose
- metadati fuorvianti
- credenziali o requisiti di autorizzazione non dichiarati
- istruzioni di installazione sospette
- furto d'identità
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano l'[Uso accettabile](/clawhub/acceptable-usage)

Utilizzare il pulsante **Report skill** nella pagina di una skill oppure il comando/API di segnalazione dei pacchetti.

Non utilizzare le segnalazioni di ClawHub per vulnerabilità nel codice sorgente di una skill o di un Plugin di terze parti. Segnalarle direttamente all'editore o al repository del codice sorgente collegato dall'inserzione. ClawHub non gestisce né corregge il codice di skill o Plugin di terze parti.

I GitHub Security Advisories per `openclaw/clawhub` riguardano le vulnerabilità di ClawHub stesso. Alcuni esempi includono bug nel sito web, nell'API, nella CLI, nel registro, nell'autenticazione, nella scansione, nella moderazione o nei confini di attendibilità del download e dell'installazione. Non utilizzare gli advisory di ClawHub per vulnerabilità in skill o Plugin di terze parti.

Le segnalazioni valide sono specifiche e consentono di intervenire. L'abuso delle segnalazioni può comportare a sua volta provvedimenti sull'account.

## Rivendicazioni di organizzazioni e spazi dei nomi

Le controversie sulla proprietà di organizzazioni, marchi, ambiti dei pacchetti, identificativi dei proprietari o spazi dei nomi devono utilizzare la procedura [Rivendicazioni di organizzazioni e spazi dei nomi](/clawhub/namespace-claims), non il flusso di segnalazione nel prodotto o il modulo di ricorso relativo all'account.

Utilizzare tale procedura quando è necessario che il personale di ClawHub esamini prove non sensibili del fatto che uno spazio dei nomi debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias o altrimenti sottoposto a verifica. Non includere segreti, documenti privati, fascicoli legali privati, documenti di identità personale, token API o token di verifica DNS in una issue pubblica.

## Sospensioni per moderazione

Alcuni rilevamenti gravi o problemi relativi alle norme possono sottoporre un editore o un'inserzione a una sospensione per moderazione. In questo caso, i contenuti interessati possono essere nascosti dall'individuazione pubblica oppure le pubblicazioni future possono essere inizialmente nascoste fino al completamento della verifica del problema.

Le sospensioni per moderazione hanno lo scopo di proteggere gli utenti mentre ClawHub risolve i casi ad alto rischio. Possono anche essere revocate quando viene confermato un falso positivo.

## Inserzioni nascoste o bloccate

Un'inserzione può essere sospesa, nascosta, messa in quarantena, revocata o altrimenti resa non disponibile nelle superfici pubbliche di installazione.

Se viene visualizzato uno di questi stati, non installare la versione finché il proprietario non risolve il problema o la moderazione non la ripristina.

I proprietari possono comunque visualizzare la diagnostica delle proprie inserzioni sospese o nascoste. Queste informazioni diagnostiche aiutano a spiegare cosa è accaduto e cosa deve cambiare prima che l'inserzione possa tornare sulle superfici pubbliche.

## Ban e stato dell'account

Gli account che violano le norme di ClawHub possono perdere l'accesso alla pubblicazione. Gli abusi gravi possono comportare il ban dell'account, la revoca dei token, l'occultamento dei contenuti o la rimozione delle inserzioni. I segnali di pressione relativi agli abusi degli editori vengono controllati quotidianamente. I segnali che raggiungono la soglia di potenziale ban di ClawHub possono attivare un avviso automatico. Se la prima scansione idonea dopo la scadenza dell'avviso colloca ancora l'editore nella soglia di potenziale ban, ClawHub può applicare automaticamente il provvedimento sull'account. I segnali con un livello di attendibilità inferiore e quelli relativi a verifiche temporali limitate sono esclusi dall'applicazione automatica.

Gli account eliminati, banditi o disabilitati non possono utilizzare i token API di ClawHub. Se l'autenticazione della CLI inizia a non riuscire dopo un provvedimento sull'account, accedere all'interfaccia web per verificarne lo stato. Se l'accesso o il normale utilizzo della CLI sono bloccati a causa di un ban o di un account disabilitato, utilizzare il [modulo di ricorso di ClawHub](https://appeals.openclaw.ai/) per richiedere una verifica ai fini del ripristino.

Se un'email attivata da uno scanner identifica come dannosa una versione di una skill o di un Plugin, scaricare i risultati della scansione archiviati per la versione inviata e bloccata:
`clawhub scan download <slug> --version <version>`. Per i Plugin, aggiungere
`--kind plugin`. Esaminare l'output della scansione, correggere l'inserzione, incrementare il numero di versione e caricare la versione corretta.

## Indicazioni per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantenere accurati nomi, riepiloghi, tag e changelog
- dichiarare le variabili di ambiente e le autorizzazioni richieste
- evitare comandi di installazione offuscati
- inserire, quando possibile, un collegamento al codice sorgente
- utilizzare esecuzioni di prova prima di pubblicare Plugin
- rispondere chiaramente se gli utenti o i moderatori pongono domande sul comportamento della versione
