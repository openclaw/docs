---
read_when:
    - Segnalare uno skill, Plugin o pacchetto
    - Ripristino da un'inserzione sospesa, nascosta o bloccata
    - Comprendere la moderazione, i ban o lo stato dell'account su ClawHub
sidebarTitle: Moderation and Account Safety
summary: Come funzionano le segnalazioni di ClawHub, i blocchi di moderazione, le schede nascoste, i ban e lo stato dell'account.
title: Moderazione e sicurezza dell'account
x-i18n:
    generated_at: "2026-06-30T14:06:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderazione e sicurezza dell'account

ClawHub è aperto alla pubblicazione, ma le superfici di scoperta pubblica e installazione
hanno comunque bisogno di protezioni. Segnalazioni, blocchi di moderazione, schede nascoste e azioni sugli account
aiutano a proteggere gli utenti quando una release o un account sembra non sicuro, fuorviante o fuori
policy.

Questa pagina tratta la moderazione e lo stato dell'account. Per le etichette di audit come
`Pass`, `Review`, `Warn`, `Malicious` e il livello di rischio, consulta
[Audit di sicurezza](/clawhub/security-audits).

Vedi anche [Sicurezza](/clawhub/security) e
[Utilizzo accettabile](/clawhub/acceptable-usage). Per questioni relative al copyright o ad altri
diritti sui contenuti, usa [Richieste sui diritti dei contenuti](/clawhub/content-rights).

## Segnalazioni

Gli utenti autenticati possono segnalare Skills, plugin e pacchetti.

Usa le segnalazioni ClawHub solo per contenuti del marketplace non sicuri, come:

- schede dannose
- metadati fuorvianti
- credenziali o requisiti di autorizzazione non dichiarati
- istruzioni di installazione sospette
- impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano [Utilizzo accettabile](/clawhub/acceptable-usage)

Usa il pulsante **Segnala skill** in una pagina skill, oppure il comando/API di segnalazione
dei pacchetti per i pacchetti.

Non usare le segnalazioni ClawHub per vulnerabilità nel codice sorgente di una skill o di un
plugin di terze parti. Segnalale direttamente al publisher o al repository sorgente
collegato dalla scheda. ClawHub non mantiene né corregge
il codice di skill o plugin di terze parti.

I GitHub Security Advisories per `openclaw/clawhub` riguardano vulnerabilità in
ClawHub stesso. Alcuni esempi includono bug nel sito web, API, CLI, registro, autenticazione,
scansione, moderazione o confini di attendibilità di download/installazione. Non usare gli
advisory ClawHub per vulnerabilità in Skills o plugin di terze parti.

Le buone segnalazioni sono specifiche e utilizzabili. L'abuso delle segnalazioni può a sua volta portare a
un'azione sull'account.

## Rivendicazioni di organizzazioni e namespace

Le dispute sulla proprietà di organizzazioni, brand, ambiti di pacchetto, handle proprietario o namespace dovrebbero
usare il processo [Rivendicazioni di organizzazioni e namespace](/clawhub/namespace-claims), non il
flusso di segnalazione nel prodotto o il modulo di ricorso per l'account.

Usa quel processo quando hai bisogno che lo staff ClawHub esamini prove non sensibili del fatto che un
namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias
o altrimenti riesaminato. Non includere segreti, documenti privati, file legali privati,
documenti di identità personali, token API o token di challenge DNS in una
issue pubblica.

## Blocchi di moderazione

Alcuni risultati gravi o problemi di policy possono sottoporre un publisher o una scheda a un
blocco di moderazione. Quando ciò accade, il contenuto interessato può essere nascosto dalla
scoperta pubblica oppure le pubblicazioni future possono partire nascoste finché il problema non viene esaminato.

I blocchi di moderazione servono a proteggere gli utenti mentre ClawHub risolve casi ad alto rischio.
Possono anche essere revocati quando viene confermato un falso positivo.

## Schede nascoste o bloccate

Una scheda può essere trattenuta, nascosta, messa in quarantena, revocata o altrimenti non disponibile sulle
superfici di installazione pubbliche.

Se vedi uno di questi stati, non installare la release a meno che il proprietario
risolva il problema o la moderazione la ripristini.

I proprietari possono ancora vedere la diagnostica delle proprie schede trattenute o nascoste. Questa
diagnostica aiuta a spiegare cosa è successo e cosa deve cambiare prima che la
scheda possa tornare sulle superfici pubbliche.

## Ban e stato dell'account

Gli account che violano la policy ClawHub possono perdere l'accesso alla pubblicazione. Gli abusi gravi possono
comportare ban dell'account, revoca dei token, contenuti nascosti o schede rimosse.
I segnali di pressione da abuso del publisher vengono controllati ogni giorno. I segnali che raggiungono
la soglia di potenziale ban di ClawHub possono attivare un avviso automatico. Se la scansione
idonea successiva alla scadenza dell'avviso colloca ancora il publisher nella
soglia di potenziale ban, ClawHub può applicare automaticamente l'azione sull'account.
I segnali di revisione a minore confidenza e temporalmente limitati restano fuori
dall'applicazione automatica.

Gli account eliminati, bannati o disabilitati non possono usare i token API ClawHub. Se l'autenticazione CLI
inizia a non riuscire dopo un'azione sull'account, accedi all'interfaccia web per rivedere lo
stato dell'account. Se l'accesso o il normale accesso CLI è bloccato da un ban o da un account disabilitato,
usa il [modulo di ricorso ClawHub](https://appeals.openclaw.ai/) per una revisione di recupero.

Se un'email attivata dallo scanner indica una versione di una skill o di un plugin come dannosa,
scarica i risultati di scansione archiviati per la versione inviata bloccata:
`clawhub scan download <slug> --version <version>`. Per i plugin, aggiungi
`--kind plugin`. Esamina l'output della scansione, correggi la scheda, incrementa il numero di versione
e carica la versione corretta.

## Indicazioni per i publisher

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili d'ambiente e le autorizzazioni richieste
- evita comandi di installazione offuscati
- collega il sorgente quando possibile
- usa esecuzioni di prova prima di pubblicare plugin
- rispondi chiaramente se utenti o moderatori chiedono informazioni sul comportamento della release
