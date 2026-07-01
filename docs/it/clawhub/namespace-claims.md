---
read_when:
    - Rivendicare un'organizzazione, un brand, uno scope di pacchetto, un handle proprietario, uno slug di skill o un namespace di pacchetto
    - Risoluzione di un namespace già rivendicato o riservato
    - Decidere se usare una segnalazione, un ricorso o una rivendicazione di namespace
sidebarTitle: Org and Namespace Claims
summary: Come richiedere una revisione ClawHub per controversie sulla titolarità di org, brand, handle del proprietario, ambito del pacchetto, slug della skill o namespace.
title: Rivendicazioni di organizzazione e spazio dei nomi
x-i18n:
    generated_at: "2026-07-01T18:13:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Rivendicazioni di organizzazione e namespace

ClawHub usa handle dei proprietari, handle delle organizzazioni, slug delle skill, nomi di pacchetti Plugin e
scope dei pacchetti come namespace pubblici. Se un namespace sembra appartenere a un
progetto reale, brand, ecosistema di pacchetti o organizzazione, ma è già
rivendicato, riservato, fuorviante o contestato su ClawHub, chiedi allo staff di esaminarlo
con il
[modulo di issue per rivendicazione di organizzazione / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Usa questo percorso per revisioni pubbliche e non sensibili della proprietà. Non usare le
segnalazioni nel prodotto o il modulo di appello dell'account per rivendicazioni di namespace.

## Quando aprire una rivendicazione

Apri una rivendicazione di namespace quando ritieni che lo staff di ClawHub debba verificare se un
namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias
o modificato in altro modo a causa della proprietà nel mondo reale.

Gli esempi includono:

- un handle di organizzazione che corrisponde alla tua organizzazione GitHub, al tuo progetto, alla tua azienda o alla tua community
- uno scope di pacchetto come `@example-org/*` che dovrebbe pubblicare solo sotto il
  proprietario ClawHub corrispondente
- uno slug di skill o un nome di pacchetto Plugin che sembra impersonare un progetto
- una controversia su brand, marchio, rinomina di progetto o cronologia dei pacchetti
- un proprietario eliminato, inattivo o non raggiungibile che blocca il proprietario legittimo del namespace

Se la voce è non sicura, dannosa o fuorviante oltre alla controversia sulla proprietà,
segui anche le indicazioni pertinenti per la moderazione o la sicurezza. Il modulo di rivendicazione di namespace
serve per la revisione della proprietà, non per la divulgazione urgente di vulnerabilità.

## Prima di inviare

Per prima cosa conferma che stai pubblicando con il proprietario che corrisponde al namespace.
Per i pacchetti Plugin, i nomi con scope come `@example-org/example-plugin` devono essere
pubblicati come proprietario `example-org` corrispondente.

Se puoi gestire il proprietario corrente, correggi direttamente il namespace pubblicando,
rinominando, trasferendo, nascondendo o eliminando la risorsa interessata. Usa una rivendicazione
quando non puoi gestire il proprietario corrente o quando lo staff deve risolvere una
controversia.

## Prove da includere

Usa prove pubbliche e non sensibili. Le prove utili includono:

- cronologia di organizzazioni, repository, release o maintainer GitHub
- documentazione ufficiale del progetto che nomina il namespace
- prove relative al dominio o al dominio email ufficiale
- controllo dello scope su npm, PyPI, crates.io o altri registri di pacchetti
- prove di proprietà di marchio, brand o progetto che siano sicure da discutere
  pubblicamente
- cronologia del repository sorgente, cronologia dei pacchetti o avvisi pubblici di rinomina
- link al proprietario, alla skill, al Plugin, al pacchetto o all'issue ClawHub contestati

Spiega cosa prova ogni link. Lo staff dovrebbe poter comprendere la
relazione senza bisogno di credenziali private o segreti.

## Cosa non includere

Non inserire segreti o prove private in un'issue GitHub pubblica. Non includere:

- token API, chiavi di firma o credenziali
- token di verifica DNS
- file o contratti legali privati
- documenti di identità personali
- email private, segnalazioni di sicurezza private o dati riservati dei clienti

Il modulo di rivendicazione chiede se le prove sensibili richiedono un canale privato con lo staff.
Usa quell'opzione invece di pubblicare materiale sensibile pubblicamente.

## Possibili esiti

A seconda delle prove e del rischio, lo staff di ClawHub può riservare un namespace,
trasferire la proprietà, rinominare una risorsa, nascondere o mettere in quarantena una voce esistente,
aggiungere un alias o un reindirizzamento, chiedere ulteriori prove o rifiutare la richiesta.

La revisione del namespace non garantisce che ogni nome corrispondente venga trasferito.
Lo staff valuta le prove pubbliche, l'uso esistente, il rischio per la sicurezza e l'impatto sugli utenti.

## Documentazione correlata

- [Pubblicazione](/it/clawhub/publishing)
- [Risoluzione dei problemi](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderazione e sicurezza dell'account](/clawhub/moderation)
- [Sicurezza](/clawhub/security)
