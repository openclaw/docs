---
read_when:
    - Segnalare una skill, un Plugin o un pacchetto
    - Ripristino da una pubblicazione sospesa, nascosta o bloccata
    - Comprendere la moderazione, i ban o lo stato dell'account su ClawHub
sidebarTitle: Moderation and Account Safety
summary: Come funzionano segnalazioni ClawHub, sospensioni per moderazione, inserzioni nascoste, ban e stato dell'account.
title: Moderazione e sicurezza dell'account
x-i18n:
    generated_at: "2026-07-01T20:22:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderazione e sicurezza dell'account

ClawHub è aperto alla pubblicazione, ma le superfici pubbliche di scoperta e installazione
richiedono comunque protezioni. Segnalazioni, blocchi di moderazione, schede nascoste e azioni
sull'account aiutano a proteggere gli utenti quando una release o un account appare non sicuro,
fuorviante o non conforme alle policy.

Questa pagina tratta la moderazione e lo stato dell'account. Per le etichette di audit come
`Pass`, `Review`, `Warn`, `Malicious` e il livello di rischio, vedi
[Audit di sicurezza](/clawhub/security-audits).

Vedi anche [Sicurezza](/clawhub/security) e
[Uso accettabile](/clawhub/acceptable-usage). Per questioni relative a copyright o ad altri
diritti sui contenuti, usa [Richieste sui diritti dei contenuti](/clawhub/content-rights).

## Segnalazioni

Gli utenti autenticati possono segnalare skill, plugin e pacchetti.

Usa le segnalazioni ClawHub solo per contenuti del marketplace non sicuri, ad esempio:

- schede malevole
- metadati fuorvianti
- credenziali o requisiti di autorizzazione non dichiarati
- istruzioni di installazione sospette
- impersonificazione
- registrazioni in malafede o uso improprio del marchio
- contenuti che violano l'[Uso accettabile](/clawhub/acceptable-usage)

Usa il pulsante **Segnala skill** nella pagina di una skill, oppure il
comando/API di segnalazione dei pacchetti per i pacchetti.

Non usare le segnalazioni ClawHub per vulnerabilità nel codice sorgente proprio di una skill o
di un plugin di terze parti. Segnalale direttamente all'autore o al repository sorgente
collegato dalla scheda. ClawHub non mantiene né corregge il codice di skill o plugin di terze parti.

Gli avvisi GitHub Security Advisories per `openclaw/clawhub` riguardano vulnerabilità in
ClawHub stesso. Gli esempi includono bug nel sito web, API, CLI, registro, autenticazione,
scansione, moderazione o confini di attendibilità per download/installazione. Non usare gli
avvisi ClawHub per vulnerabilità in skill o plugin di terze parti.

Le buone segnalazioni sono specifiche e azionabili. L'abuso delle segnalazioni può a sua volta
portare ad azioni sull'account.

## Rivendicazioni di organizzazione e namespace

Le dispute sulla proprietà di organizzazioni, brand, ambiti di pacchetto, handle del proprietario
o namespace devono usare il processo [Rivendicazioni di organizzazione e namespace](/clawhub/namespace-claims),
non il flusso di segnalazione nel prodotto né il modulo di ricorso dell'account.

Usa quel processo quando hai bisogno che lo staff di ClawHub esamini prove non sensibili che un
namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena,
associato a un alias o comunque riesaminato. Non includere segreti, documenti privati,
file legali privati, documenti di identità personali, token API o token di verifica DNS in una
issue pubblica.

## Blocchi di moderazione

Alcuni risultati gravi o problemi di policy possono porre un autore o una scheda sotto un
blocco di moderazione. Quando questo accade, i contenuti interessati possono essere nascosti
dalla scoperta pubblica oppure le pubblicazioni future possono iniziare come nascoste finché
il problema non viene riesaminato.

I blocchi di moderazione servono a proteggere gli utenti mentre ClawHub risolve casi ad alto
rischio. Possono anche essere rimossi quando viene confermato un falso positivo.

## Schede nascoste o bloccate

Una scheda può essere trattenuta, nascosta, messa in quarantena, revocata o comunque non
disponibile sulle superfici pubbliche di installazione.

Se vedi uno di questi stati, non installare la release a meno che il proprietario non risolva
il problema o la moderazione non la ripristini.

I proprietari possono comunque vedere la diagnostica per le proprie schede trattenute o nascoste.
Questa diagnostica aiuta a spiegare cosa è successo e cosa deve cambiare prima che la scheda
possa tornare sulle superfici pubbliche.

## Ban e stato dell'account

Gli account che violano le policy di ClawHub possono perdere l'accesso alla pubblicazione.
Gli abusi gravi possono comportare ban dell'account, revoca dei token, contenuti nascosti o
schede rimosse. I segnali di pressione da abuso degli autori vengono controllati ogni giorno.
I segnali che raggiungono la soglia di possibile ban di ClawHub possono attivare un avviso
automatico. Se la successiva scansione idonea dopo la scadenza dell'avviso colloca ancora
l'autore nella soglia di possibile ban, ClawHub può applicare automaticamente l'azione
sull'account. I segnali di revisione temporale a bassa confidenza e limitati restano esclusi
dall'applicazione automatica.

Gli account eliminati, bannati o disabilitati non possono usare i token API di ClawHub. Se
l'autenticazione CLI inizia a non riuscire dopo un'azione sull'account, accedi all'interfaccia
web per rivedere lo stato dell'account. Se l'accesso o il normale accesso CLI sono bloccati da
un ban o da un account disabilitato, usa il [modulo di ricorso ClawHub](https://appeals.openclaw.ai/)
per la revisione del recupero.

Se un'email attivata da uno scanner indica una versione di skill o plugin come malevola,
scarica i risultati di scansione memorizzati per la versione inviata e bloccata:
`clawhub scan download <slug> --version <version>`. Per i plugin, aggiungi
`--kind plugin`. Esamina l'output della scansione, correggi la scheda, incrementa il numero di
versione e carica la versione corretta.

## Indicazioni per gli autori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili d'ambiente e le autorizzazioni richieste
- evita comandi di installazione offuscati
- collega il sorgente quando possibile
- usa esecuzioni di prova prima di pubblicare plugin
- rispondi chiaramente se utenti o moderatori chiedono informazioni sul comportamento della release
