---
read_when:
    - Rivendicare un'organizzazione, un brand, un ambito di pacchetto, un handle proprietario, uno slug skill o un namespace di pacchetto
    - Risoluzione di uno spazio dei nomi già rivendicato o riservato
    - Decidere se usare una segnalazione, un ricorso o una rivendicazione di namespace
sidebarTitle: Org and Namespace Claims
summary: Come richiedere una revisione ClawHub per controversie sulla proprietà di organizzazione, marchio, handle del proprietario, ambito del pacchetto, slug della skill o namespace.
title: Rivendicazioni di organizzazione e namespace
x-i18n:
    generated_at: "2026-06-28T00:11:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Rivendicazioni di organizzazioni e namespace

ClawHub usa handle dei proprietari, handle delle organizzazioni, slug delle skill, nomi dei pacchetti Plugin e
scope dei pacchetti come namespace pubblici. Se un namespace sembra appartenere a un
progetto reale, a un brand, a un ecosistema di pacchetti o a un'organizzazione, ma è già
rivendicato, riservato, fuorviante o contestato su ClawHub, chiedi allo staff di esaminarlo
con il
[modulo di issue per rivendicazioni di organizzazioni / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Usa questo percorso per la revisione pubblica e non sensibile della proprietà. Non usare le segnalazioni
nel prodotto o il modulo di ricorso dell'account per le rivendicazioni di namespace.

## Quando aprire una rivendicazione

Apri una rivendicazione di namespace quando ritieni che lo staff di ClawHub debba verificare se un
namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, dotato di alias
o altrimenti modificato a causa di una proprietà reale.

Gli esempi includono:

- un handle di organizzazione che corrisponde alla tua organizzazione GitHub, al tuo progetto, alla tua azienda o alla tua comunità
- uno scope di pacchetto come `@example-org/*` che dovrebbe pubblicare solo sotto il
  proprietario ClawHub corrispondente
- uno slug di skill o un nome di pacchetto Plugin che sembra impersonare un progetto
- una disputa su brand, marchio, rinomina di progetto o cronologia di pacchetto
- un proprietario eliminato, inattivo o irraggiungibile che blocca il legittimo proprietario
  del namespace

Se l'inserzione è non sicura, dannosa o fuorviante oltre alla disputa sulla proprietà,
segui anche le relative linee guida di moderazione o sicurezza. Il modulo di rivendicazione del namespace
serve per la revisione della proprietà, non per la divulgazione urgente di vulnerabilità.

## Prima dell'invio

Prima conferma che stai pubblicando con il proprietario che corrisponde al namespace.
Per i pacchetti Plugin, i nomi con scope come `@example-org/example-plugin` devono essere
pubblicati come proprietario `example-org` corrispondente.

Se puoi gestire il proprietario attuale, correggi direttamente il namespace pubblicando,
rinominando, trasferendo, nascondendo o eliminando la risorsa interessata. Usa una rivendicazione
quando non puoi gestire il proprietario attuale o quando lo staff deve risolvere una
disputa.

## Prove da includere

Usa prove pubbliche e non sensibili. Le prove utili includono:

- cronologia di organizzazione, repository, release o manutentori GitHub
- documentazione ufficiale del progetto che nomina il namespace
- prove di dominio o di dominio email ufficiale
- controllo dello scope su npm, PyPI, crates.io o altri registri di pacchetti
- prove di marchio, brand o proprietà del progetto che sia sicuro discutere
  pubblicamente
- cronologia del repository sorgente, cronologia del pacchetto o avvisi pubblici di rinomina
- link al proprietario, alla skill, al Plugin, al pacchetto o all'issue ClawHub contestati

Spiega cosa prova ciascun link. Lo staff dovrebbe poter comprendere la
relazione senza aver bisogno di credenziali private o segreti.

## Cosa non includere

Non inserire segreti o prove private in un'issue GitHub pubblica. Non includere:

- token API, chiavi di firma o credenziali
- token di challenge DNS
- file legali o contratti privati
- documenti di identità personali
- email private, segnalazioni di sicurezza private o dati riservati dei clienti

Il modulo di rivendicazione chiede se le prove sensibili richiedono un canale privato con lo staff.
Usa quell'opzione invece di pubblicare materiale sensibile pubblicamente.

## Esiti possibili

A seconda delle prove e del rischio, lo staff di ClawHub può riservare un namespace,
trasferire la proprietà, rinominare una risorsa, nascondere o mettere in quarantena un'inserzione esistente,
aggiungere un alias o un reindirizzamento, chiedere altre prove o rifiutare la richiesta.

La revisione del namespace non garantisce che ogni nome corrispondente venga trasferito.
Lo staff valuta prove pubbliche, uso esistente, rischio di sicurezza e impatto sugli utenti.

## Documentazione correlata

- [Pubblicazione](/it/clawhub/publishing)
- [Risoluzione dei problemi](/it/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderazione e sicurezza dell'account](/it/clawhub/moderation)
- [Sicurezza](/it/clawhub/security)
