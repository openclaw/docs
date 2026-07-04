---
read_when:
    - Rivendicare un'organizzazione, un brand, un ambito di pacchetto, un handle proprietario, uno slug skill o uno spazio dei nomi del pacchetto
    - Risoluzione di uno spazio dei nomi già rivendicato o riservato
    - Decidere se usare una segnalazione, un ricorso o una rivendicazione di namespace
sidebarTitle: Org and Namespace Claims
summary: Come richiedere una revisione ClawHub per controversie sulla proprietà di organizzazione, brand, handle del proprietario, ambito del pacchetto, slug della skill o namespace.
title: Rivendicazioni di organizzazione e namespace
x-i18n:
    generated_at: "2026-07-04T03:49:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Richieste su organizzazioni e namespace

ClawHub usa handle dei proprietari, handle delle organizzazioni, slug delle Skills, nomi dei pacchetti Plugin e
ambiti dei pacchetti come namespace pubblici. Se un namespace sembra appartenere a un
progetto reale, a un brand, a un ecosistema di pacchetti o a un'organizzazione, ma è già
rivendicato, riservato, fuorviante o contestato su ClawHub, chiedi allo staff di esaminarlo
con il
[modulo di segnalazione Org / Namespace Claim](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Usa questo percorso per una revisione pubblica e non sensibile della proprietà. Non usare le segnalazioni
all'interno del prodotto o il modulo di ricorso dell'account per le richieste sui namespace.

## Quando aprire una richiesta

Apri una richiesta su un namespace quando ritieni che lo staff di ClawHub debba valutare se un
namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, aliasato
o modificato in altro modo a causa della proprietà nel mondo reale.

Esempi:

- un handle di organizzazione che corrisponde alla tua organizzazione GitHub, al tuo progetto, alla tua azienda o alla tua community
- un ambito di pacchetto come `@example-org/*` che dovrebbe pubblicare solo con il
  proprietario ClawHub corrispondente
- uno slug di Skills o un nome di pacchetto Plugin che sembra impersonare un progetto
- una disputa su brand, marchio, rinomina di progetto o cronologia dei pacchetti
- un proprietario eliminato, inattivo o irraggiungibile che blocca il legittimo proprietario del namespace

Se la scheda è non sicura, dannosa o fuorviante oltre alla disputa sulla proprietà,
segui anche le indicazioni pertinenti su moderazione o sicurezza. Il modulo di richiesta sul namespace
serve per la revisione della proprietà, non per la divulgazione urgente di vulnerabilità.

## Prima di inviare

Verifica innanzitutto che tu stia pubblicando con il proprietario che corrisponde al namespace.
Per i pacchetti Plugin, i nomi con ambito come `@example-org/example-plugin` devono essere
pubblicati come proprietario `example-org` corrispondente.

Se puoi gestire il proprietario attuale, correggi direttamente il namespace pubblicando,
rinominando, trasferendo, nascondendo o eliminando la risorsa interessata. Usa una richiesta
quando non puoi gestire il proprietario attuale o quando lo staff deve risolvere una
disputa.

## Prove da includere

Usa prove pubbliche e non sensibili. Prove utili includono:

- organizzazione GitHub, repository, release o cronologia dei manutentori
- documentazione ufficiale del progetto che nomina il namespace
- prova del dominio o del dominio email ufficiale
- controllo dell'ambito su npm, PyPI, crates.io o altri registri di pacchetti
- prove di proprietà di marchio, brand o progetto che possono essere discusse
  pubblicamente in sicurezza
- cronologia del repository sorgente, cronologia del pacchetto o avvisi pubblici di rinomina
- link al proprietario, alla Skills, al Plugin, al pacchetto o all'issue ClawHub contestati

Spiega cosa dimostra ciascun link. Lo staff deve poter comprendere la
relazione senza bisogno di credenziali private o segreti.

## Cosa non includere

Non inserire segreti o prove private in un'issue GitHub pubblica. Non includere:

- token API, chiavi di firma o credenziali
- token di challenge DNS
- documenti legali o contratti privati
- documenti di identità personali
- email private, report di sicurezza privati o dati riservati dei clienti

Il modulo di richiesta chiede se le prove sensibili richiedono un canale privato con lo staff.
Usa quell'opzione invece di pubblicare materiale sensibile pubblicamente.

## Possibili esiti

A seconda delle prove e del rischio, lo staff di ClawHub può riservare un namespace,
trasferire la proprietà, rinominare una risorsa, nascondere o mettere in quarantena una scheda esistente,
aggiungere un alias o un reindirizzamento, chiedere ulteriori prove o rifiutare la richiesta.

La revisione del namespace non garantisce che ogni nome corrispondente venga trasferito.
Lo staff valuta prove pubbliche, uso esistente, rischio per la sicurezza e impatto sugli utenti.

## Documentazione correlata

- [Pubblicazione](/it/clawhub/publishing)
- [Risoluzione dei problemi](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderazione e sicurezza degli account](/clawhub/moderation)
- [Sicurezza](/clawhub/security)
