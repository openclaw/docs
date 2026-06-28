---
read_when:
    - Segnalare una skill, un plugin o un pacchetto
    - Ripristino da un’inserzione sospesa, nascosta o bloccata
    - Comprendere la moderazione, i ban o lo stato dell'account di ClawHub
sidebarTitle: Moderation and Account Safety
summary: Come funzionano segnalazioni ClawHub, blocchi di moderazione, inserzioni nascoste, ban e stato dell'account.
title: Moderazione e sicurezza dell'account
x-i18n:
    generated_at: "2026-06-28T07:41:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderazione e sicurezza dell'account

ClawHub è aperto alla pubblicazione, ma le superfici pubbliche di scoperta e installazione
hanno comunque bisogno di misure di protezione. Segnalazioni, blocchi di moderazione, listing nascosti e azioni sugli account
aiutano a proteggere gli utenti quando una release o un account appare non sicuro, fuorviante o fuori
dalle policy.

Questa pagina tratta la moderazione e lo stato degli account. Per le etichette di audit come
`Pass`, `Review`, `Warn`, `Malicious` e il livello di rischio, consulta
[Audit di sicurezza](/it/clawhub/security-audits).

Vedi anche [Sicurezza](/it/clawhub/security) e
[Uso accettabile](/it/clawhub/acceptable-usage). Per copyright o altri dubbi sui diritti
dei contenuti, usa [Richieste sui diritti dei contenuti](/it/clawhub/content-rights).

## Segnalazioni

Gli utenti autenticati possono segnalare skill, plugin e pacchetti.

Usa le segnalazioni ClawHub solo per contenuti marketplace non sicuri, come:

- listing dannosi
- metadati fuorvianti
- credenziali o requisiti di autorizzazione non dichiarati
- istruzioni di installazione sospette
- impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano [Uso accettabile](/it/clawhub/acceptable-usage)

Usa il pulsante **Segnala skill** nella pagina di una skill, oppure il comando/API di segnalazione
dei pacchetti per i pacchetti.

Non usare le segnalazioni ClawHub per vulnerabilità nel codice sorgente di una skill o
di un plugin di terze parti. Segnalale direttamente all'editore o al repository sorgente
collegato dal listing. ClawHub non mantiene né corregge
codice di skill o plugin di terze parti.

Gli avvisi di sicurezza GitHub per `openclaw/clawhub` riguardano vulnerabilità in
ClawHub stesso. Gli esempi includono bug nel sito web, nell'API, nella CLI, nel registro, nell'autenticazione,
nella scansione, nella moderazione o nei confini di attendibilità di download/installazione. Non usare gli avvisi
ClawHub per vulnerabilità in skill o plugin di terze parti.

Le buone segnalazioni sono specifiche e azionabili. L'abuso delle segnalazioni può a sua volta portare a
un'azione sull'account.

## Rivendicazioni di organizzazioni e namespace

Le controversie sulla proprietà di organizzazioni, brand, scope di pacchetti, handle di proprietari o namespace devono
usare il processo [Rivendicazioni di organizzazioni e namespace](/it/clawhub/namespace-claims), non il
flusso di segnalazione nel prodotto o il modulo di ricorso dell'account.

Usa quel processo quando hai bisogno che lo staff ClawHub esamini prove non sensibili del fatto che un
namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato ad alias
o altrimenti revisionato. Non includere segreti, documenti privati, file legali privati,
documenti di identità personali, token API o token di verifica DNS in una
issue pubblica.

## Blocchi di moderazione

Alcuni risultati gravi o problemi di policy possono mettere un editore o un listing sotto
blocco di moderazione. Quando accade, i contenuti interessati possono essere nascosti dalla scoperta
pubblica oppure le pubblicazioni future possono iniziare come nascoste finché il problema non viene esaminato.

I blocchi di moderazione servono a proteggere gli utenti mentre ClawHub risolve casi
ad alto rischio. Possono anche essere rimossi quando viene confermato un falso positivo.

## Listing nascosti o bloccati

Un listing può essere bloccato, nascosto, messo in quarantena, revocato o altrimenti non disponibile sulle
superfici pubbliche di installazione.

Se vedi uno di questi stati, non installare la release a meno che il proprietario
risolva il problema o la moderazione la ripristini.

I proprietari possono comunque vedere diagnostiche per i propri listing bloccati o nascosti. Queste
diagnostiche aiutano a spiegare cosa è successo e cosa deve cambiare prima che il
listing possa tornare sulle superfici pubbliche.

## Ban e stato dell'account

Gli account che violano la policy di ClawHub possono perdere l'accesso alla pubblicazione. Abusi gravi possono
comportare ban dell'account, revoca dei token, contenuti nascosti o listing rimossi.
I segnali di pressione da abuso degli editori vengono controllati quotidianamente. I segnali che raggiungono
la soglia di potenziale ban di ClawHub possono attivare un avviso automatico. Se la scansione
idonea successiva alla scadenza dell'avviso colloca ancora l'editore nella
soglia di potenziale ban, ClawHub può applicare automaticamente l'azione sull'account.
I segnali di revisione a minore confidenza e temporalmente limitati restano fuori
dall'applicazione automatica.

Gli account eliminati, bannati o disabilitati non possono usare token API ClawHub. Se l'autenticazione CLI
inizia a fallire dopo un'azione sull'account, accedi alla UI web per verificare lo
stato dell'account. Se l'accesso o il normale accesso CLI è bloccato da un ban o da un account disabilitato,
usa il [modulo di ricorso ClawHub](https://appeals.openclaw.ai/) per la revisione di recupero.

Se un'email attivata dallo scanner indica una versione di una skill o di un plugin come dannosa,
scarica i risultati della scansione memorizzati per la versione inviata bloccata:
`clawhub scan download <slug> --version <version>`. Per i plugin, aggiungi
`--kind plugin`. Esamina l'output della scansione, correggi il listing, incrementa il numero di versione
e carica la versione corretta.

## Linee guida per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili d'ambiente e le autorizzazioni richieste
- evita comandi di installazione offuscati
- collega il sorgente quando possibile
- usa esecuzioni di prova prima di pubblicare plugin
- rispondi chiaramente se utenti o moderatori chiedono informazioni sul comportamento della release
