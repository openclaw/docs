---
read_when:
    - Rivendicare un'organizzazione, un brand, un ambito di pacchetto, un handle proprietario, uno slug di skill o un namespace di pacchetto
    - Risoluzione di uno spazio dei nomi già rivendicato o riservato
    - Decidere se usare una segnalazione, un ricorso o una rivendicazione di namespace
sidebarTitle: Org and Namespace Claims
summary: Come richiedere una revisione ClawHub per controversie sulla proprietà di organizzazione, brand, handle del proprietario, ambito del pacchetto, skill-slug o spazio dei nomi.
title: Rivendicazioni di organizzazione e namespace
x-i18n:
    generated_at: "2026-07-04T20:32:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Rivendicazioni di organizzazione e namespace

ClawHub usa handle dei proprietari, handle delle organizzazioni, slug delle skill, nomi dei pacchetti plugin e
scope dei pacchetti come namespace pubblici. Se un namespace sembra appartenere a un
progetto reale, brand, ecosistema di pacchetti o organizzazione, ma risulta già
rivendicato, riservato, fuorviante o contestato su ClawHub, chiedi allo staff di esaminarlo
con il
[modulo issue per rivendicazione di organizzazione / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Usa questo percorso per la revisione pubblica e non sensibile della proprietà. Non usare le segnalazioni
nel prodotto o il modulo di ricorso dell’account per le rivendicazioni di namespace.

## Quando Aprire una Rivendicazione

Apri una rivendicazione di namespace quando ritieni che lo staff di ClawHub debba valutare se un
namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias
o altrimenti modificato a causa della proprietà nel mondo reale.

Esempi includono:

- un handle di organizzazione che corrisponde alla tua organizzazione GitHub, al tuo progetto, alla tua azienda o alla tua community
- uno scope di pacchetto come `@example-org/*` che dovrebbe pubblicare solo sotto il
  proprietario ClawHub corrispondente
- uno slug di skill o un nome di pacchetto plugin che sembra impersonare un progetto
- una disputa su brand, marchio registrato, rinomina di progetto o cronologia di pacchetto
- un proprietario eliminato, inattivo o irraggiungibile che blocca il legittimo proprietario del namespace

Se la scheda è non sicura, malevola o fuorviante oltre alla disputa di proprietà,
segui anche le indicazioni pertinenti per moderazione o sicurezza. Il modulo di rivendicazione di namespace
serve alla revisione della proprietà, non alla divulgazione urgente di vulnerabilità.

## Prima di Inviare

Verifica prima che tu stia pubblicando con il proprietario che corrisponde al namespace.
Per i pacchetti plugin, i nomi con scope come `@example-org/example-plugin` devono essere
pubblicati come proprietario `example-org` corrispondente.

Se puoi gestire il proprietario attuale, correggi direttamente il namespace pubblicando,
rinominando, trasferendo, nascondendo o eliminando la risorsa interessata. Usa una rivendicazione
quando non puoi gestire il proprietario attuale o quando lo staff deve risolvere una
disputa.

## Prove da Includere

Usa prove pubbliche e non sensibili. Le prove utili includono:

- organizzazione GitHub, repository, release o cronologia dei maintainer
- documentazione ufficiale del progetto che nomina il namespace
- prova tramite dominio o dominio email ufficiale
- controllo dello scope su npm, PyPI, crates.io o altri registri di pacchetti
- prove di proprietà di marchio registrato, brand o progetto che siano sicure da discutere
  pubblicamente
- cronologia del repository sorgente, cronologia del pacchetto o avvisi pubblici di rinomina
- link al proprietario, alla skill, al plugin, al pacchetto o all’issue ClawHub contestati

Spiega cosa prova ogni link. Lo staff dovrebbe poter comprendere la
relazione senza bisogno di credenziali private o segreti.

## Cosa Non Includere

Non inserire segreti o prove private in una issue GitHub pubblica. Non includere:

- token API, chiavi di firma o credenziali
- token di challenge DNS
- file legali o contratti privati
- documenti di identità personali
- email private, report di sicurezza privati o dati riservati dei clienti

Il modulo di rivendicazione chiede se le prove sensibili richiedono un canale privato con lo staff.
Usa quell’opzione invece di pubblicare materiale sensibile pubblicamente.

## Esiti Possibili

A seconda delle prove e del rischio, lo staff di ClawHub può riservare un namespace,
trasferire la proprietà, rinominare una risorsa, nascondere o mettere in quarantena una scheda esistente,
aggiungere un alias o un reindirizzamento, chiedere ulteriori prove o rifiutare la richiesta.

La revisione del namespace non garantisce che ogni nome corrispondente verrà trasferito.
Lo staff valuta le prove pubbliche, l’uso esistente, il rischio per la sicurezza e l’impatto sugli utenti.

## Documentazione Correlata

- [Pubblicazione](/it/clawhub/publishing)
- [Risoluzione dei problemi](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderazione e sicurezza dell’account](/clawhub/moderation)
- [Sicurezza](/clawhub/security)
