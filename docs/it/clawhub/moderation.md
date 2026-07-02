---
read_when:
    - Segnalare una skill, un plugin o un pacchetto
    - Recupero da una scheda sospesa, nascosta o bloccata
    - Comprendere la moderazione, i ban o lo stato dell'account di ClawHub
sidebarTitle: Moderation and Account Safety
summary: Come funzionano le segnalazioni di ClawHub, i blocchi di moderazione, le inserzioni nascoste, i ban e lo stato dell'account.
title: Sicurezza della moderazione e dell'account
x-i18n:
    generated_at: "2026-07-02T08:24:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54c1e0860411e6599923ef4d7db65d5cd5406ec63bf67c52968b4f99d893ffef
    source_path: clawhub/moderation.md
    workflow: 16
---

# Moderazione e sicurezza dell'account

ClawHub è aperto alla pubblicazione, ma le superfici pubbliche di scoperta e installazione richiedono comunque
protezioni. Segnalazioni, blocchi di moderazione, inserzioni nascoste e azioni sugli account
aiutano a proteggere gli utenti quando una release o un account appare non sicuro, fuorviante o fuori
policy.

Questa pagina riguarda la moderazione e lo stato dell'account. Per etichette di audit come
`Pass`, `Review`, `Warn`, `Malicious` e il livello di rischio, consulta
[Audit di sicurezza](/clawhub/security-audits).

Vedi anche [Sicurezza](/clawhub/security) e
[Uso accettabile](/clawhub/acceptable-usage). Per dubbi sul copyright o su altri
diritti sui contenuti, usa [Richieste sui diritti dei contenuti](/clawhub/content-rights).

## Segnalazioni

Gli utenti che hanno effettuato l'accesso possono segnalare Skills, plugin e pacchetti.

Usa le segnalazioni di ClawHub solo per contenuti del marketplace non sicuri, come:

- inserzioni malevole
- metadati fuorvianti
- credenziali o requisiti di autorizzazione non dichiarati
- istruzioni di installazione sospette
- impersonificazione
- registrazioni in malafede o uso improprio di marchi
- contenuti che violano [Uso accettabile](/clawhub/acceptable-usage)

Usa il pulsante **Segnala skill** nella pagina di una skill, oppure il comando/API di segnalazione
dei pacchetti per i pacchetti.

Non usare le segnalazioni di ClawHub per vulnerabilità nel codice sorgente di una skill o di un
plugin di terze parti. Segnalale direttamente all'editore o al repository sorgente
collegato dall'inserzione. ClawHub non mantiene né corregge
codice di skill o plugin di terze parti.

Gli avvisi di sicurezza GitHub per `openclaw/clawhub` riguardano vulnerabilità in
ClawHub stesso. Gli esempi includono bug nel sito web, nell'API, nella CLI, nel registry, nell'autenticazione,
nella scansione, nella moderazione o nei confini di fiducia per download/installazione. Non usare gli avvisi
di ClawHub per vulnerabilità in Skills o plugin di terze parti.

Le buone segnalazioni sono specifiche e azionabili. L'abuso delle segnalazioni può a sua volta portare a
un'azione sull'account.

## Rivendicazioni di organizzazione e namespace

Le dispute sulla titolarità di organizzazioni, brand, ambiti di pacchetti, handle dei proprietari o namespace dovrebbero
usare il processo [Rivendicazioni di organizzazione e namespace](/clawhub/namespace-claims), non il
flusso di segnalazione nel prodotto o il modulo di ricorso dell'account.

Usa quel processo quando hai bisogno che lo staff di ClawHub esamini prove non sensibili che un
namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias
o altrimenti riesaminato. Non includere segreti, documenti privati, file legali privati,
documenti di identità personali, token API o token di challenge DNS in una
issue pubblica.

## Blocchi di moderazione

Alcuni risultati gravi o problemi di policy possono sottoporre un editore o un'inserzione a un
blocco di moderazione. Quando ciò accade, i contenuti interessati possono essere nascosti dalla scoperta
pubblica oppure le pubblicazioni future possono iniziare nascoste finché il problema non viene riesaminato.

I blocchi di moderazione servono a proteggere gli utenti mentre ClawHub risolve casi ad alto rischio.
Possono anche essere revocati quando viene confermato un falso positivo.

## Inserzioni nascoste o bloccate

Un'inserzione può essere bloccata, nascosta, messa in quarantena, revocata o altrimenti non disponibile sulle
superfici pubbliche di installazione.

Se vedi uno di questi stati, non installare la release a meno che il proprietario
non risolva il problema o la moderazione non la ripristini.

I proprietari possono comunque vedere la diagnostica per le proprie inserzioni bloccate o nascoste. Questa
diagnostica aiuta a spiegare cosa è successo e cosa deve cambiare prima che
l'inserzione possa tornare sulle superfici pubbliche.

## Ban e stato dell'account

Gli account che violano la policy di ClawHub possono perdere l'accesso alla pubblicazione. Abusi gravi possono
comportare ban dell'account, revoca dei token, contenuti nascosti o inserzioni rimosse.
I segnali di pressione da abuso degli editori vengono controllati quotidianamente. I segnali che raggiungono
la soglia di potenziale ban di ClawHub possono attivare un avviso automatico. Se la successiva
scansione idonea dopo la scadenza dell'avviso colloca ancora l'editore nella
soglia di potenziale ban, ClawHub può applicare automaticamente l'azione sull'account.
I segnali di revisione con minore confidenza e temporalmente limitati restano esclusi dall'applicazione
automatica.

Gli account eliminati, bannati o disabilitati non possono usare i token API di ClawHub. Se l'autenticazione CLI
inizia a non riuscire dopo un'azione sull'account, accedi all'interfaccia web per verificare lo
stato dell'account. Se l'accesso o il normale accesso CLI è bloccato da un ban o da un account disabilitato,
usa il [modulo di ricorso ClawHub](https://appeals.openclaw.ai/) per la revisione del recupero.

Se un'email attivata dallo scanner indica come malevola una versione di skill o plugin,
scarica i risultati di scansione archiviati per la versione inviata bloccata:
`clawhub scan download <slug> --version <version>`. Per i plugin, aggiungi
`--kind plugin`. Esamina l'output della scansione, correggi l'inserzione, incrementa il numero di versione
e carica la versione corretta.

## Guida per gli editori

Per ridurre i falsi positivi e migliorare la fiducia degli utenti:

- mantieni accurati nomi, riepiloghi, tag e changelog
- dichiara le variabili d'ambiente e le autorizzazioni richieste
- evita comandi di installazione offuscati
- collega il sorgente quando possibile
- usa dry run prima di pubblicare plugin
- rispondi chiaramente se utenti o moderatori chiedono informazioni sul comportamento della release
