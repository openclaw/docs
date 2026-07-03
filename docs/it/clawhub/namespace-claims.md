---
read_when:
    - Rivendicazione di un'organizzazione, un brand, un ambito di pacchetto, un handle proprietario, uno slug di skill o un namespace di pacchetto
    - Risoluzione di uno spazio dei nomi già rivendicato o riservato
    - Decidere se usare una segnalazione, un ricorso o una rivendicazione di namespace
sidebarTitle: Org and Namespace Claims
summary: Come richiedere la revisione di ClawHub per controversie sulla proprietà di org, brand, owner-handle, package-scope, skill-slug o namespace.
title: Rivendicazioni di organizzazioni e namespace
x-i18n:
    generated_at: "2026-07-03T15:31:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Rivendicazioni di organizzazione e namespace

ClawHub usa handle di proprietari, handle di organizzazioni, slug di skill, nomi di pacchetti Plugin e
scope di pacchetti come namespace pubblici. Se un namespace sembra appartenere a un
progetto reale, brand, ecosistema di pacchetti o organizzazione, ma è già
rivendicato, riservato, fuorviante o contestato su ClawHub, chiedi allo staff di esaminarlo
con il
[modulo issue Rivendicazione di organizzazione / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Usa questo percorso per revisioni pubbliche e non sensibili della proprietà. Non usare le
segnalazioni nel prodotto o il modulo di ricorso dell'account per le rivendicazioni di namespace.

## Quando aprire una rivendicazione

Apri una rivendicazione di namespace quando ritieni che lo staff di ClawHub debba verificare se un
namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias
o modificato in altro modo a causa di una proprietà nel mondo reale.

Esempi:

- un handle di organizzazione che corrisponde alla tua organizzazione GitHub, progetto, azienda o community
- uno scope di pacchetto come `@example-org/*` che dovrebbe pubblicare solo sotto il
  proprietario ClawHub corrispondente
- uno slug di skill o un nome di pacchetto Plugin che sembra impersonare un progetto
- una controversia su brand, marchio, rinomina di progetto o cronologia di pacchetto
- un proprietario eliminato, inattivo o irraggiungibile che blocca il legittimo proprietario del namespace

Se la voce è non sicura, dannosa o fuorviante oltre alla controversia sulla proprietà,
segui anche le linee guida pertinenti di moderazione o sicurezza. Il modulo di rivendicazione di namespace
serve per la revisione della proprietà, non per la divulgazione urgente di vulnerabilità.

## Prima di inviare

Per prima cosa conferma che stai pubblicando con il proprietario che corrisponde al namespace.
Per i pacchetti Plugin, i nomi con scope come `@example-org/example-plugin` devono essere
pubblicati come proprietario `example-org` corrispondente.

Se puoi gestire il proprietario attuale, correggi direttamente il namespace pubblicando,
rinominando, trasferendo, nascondendo o eliminando la risorsa interessata. Usa una rivendicazione
quando non puoi gestire il proprietario attuale o quando lo staff deve risolvere una
controversia.

## Prove da includere

Usa prove pubbliche e non sensibili. Le prove utili includono:

- cronologia di organizzazione, repository, release o manutentori GitHub
- documentazione ufficiale del progetto che nomina il namespace
- prova del dominio o del dominio email ufficiale
- controllo dello scope su npm, PyPI, crates.io o altri registri di pacchetti
- prove di proprietà di marchio, brand o progetto che possono essere discusse
  pubblicamente in modo sicuro
- cronologia del repository sorgente, cronologia del pacchetto o avvisi pubblici di rinomina
- link al proprietario, skill, Plugin, pacchetto o issue ClawHub contestato

Spiega cosa dimostra ogni link. Lo staff deve poter comprendere la
relazione senza bisogno di credenziali private o segreti.

## Cosa non includere

Non inserire segreti o prove private in una issue GitHub pubblica. Non includere:

- token API, chiavi di firma o credenziali
- token di challenge DNS
- file legali o contratti privati
- documenti di identità personali
- email private, segnalazioni di sicurezza private o dati riservati dei clienti

Il modulo di rivendicazione chiede se le prove sensibili richiedono un canale privato con lo staff.
Usa quell'opzione invece di pubblicare materiale sensibile pubblicamente.

## Possibili esiti

A seconda delle prove e del rischio, lo staff di ClawHub può riservare un namespace,
trasferire la proprietà, rinominare una risorsa, nascondere o mettere in quarantena una voce esistente,
aggiungere un alias o un reindirizzamento, chiedere ulteriori prove o respingere la richiesta.

La revisione del namespace non garantisce che ogni nome corrispondente venga trasferito.
Lo staff valuta prove pubbliche, utilizzo esistente, rischio di sicurezza e impatto sugli utenti.

## Documenti correlati

- [Pubblicazione](/it/clawhub/publishing)
- [Risoluzione dei problemi](/it/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderazione e sicurezza dell'account](/it/clawhub/moderation)
- [Sicurezza](/it/clawhub/security)
