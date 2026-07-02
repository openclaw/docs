---
read_when:
    - Rivendicazione di un'organizzazione, un brand, un ambito di pacchetto, un handle proprietario, uno slug di skill o un namespace di pacchetto
    - Risoluzione di uno spazio dei nomi già rivendicato o riservato
    - Decidere se usare una segnalazione, un ricorso o una rivendicazione di namespace
sidebarTitle: Org and Namespace Claims
summary: Come richiedere una revisione ClawHub per controversie sulla proprietà di organizzazione, brand, handle del proprietario, ambito del pacchetto, slug della skill o namespace.
title: Rivendicazioni di organizzazione e namespace
x-i18n:
    generated_at: "2026-07-02T08:24:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Rivendicazioni di organizzazioni e spazi dei nomi

ClawHub usa handle dei proprietari, handle delle organizzazioni, slug delle skill, nomi dei pacchetti Plugin e
ambiti dei pacchetti come spazi dei nomi pubblici. Se uno spazio dei nomi sembra appartenere a un
progetto reale, un brand, un ecosistema di pacchetti o un'organizzazione, ma è già
rivendicato, riservato, fuorviante o contestato su ClawHub, chiedi allo staff di esaminarlo
con il
[modulo per issue di rivendicazione di organizzazione / spazio dei nomi](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Usa questo percorso per revisioni pubbliche e non sensibili della proprietà. Non usare le segnalazioni
nel prodotto o il modulo di ricorso per l'account per le rivendicazioni di spazi dei nomi.

## Quando aprire una rivendicazione

Apri una rivendicazione di spazio dei nomi quando ritieni che lo staff di ClawHub debba valutare se uno
spazio dei nomi debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias
o altrimenti modificato a causa di una proprietà nel mondo reale.

Gli esempi includono:

- un handle di organizzazione che corrisponde alla tua organizzazione GitHub, al tuo progetto, alla tua azienda o alla tua community
- un ambito di pacchetto come `@example-org/*` che dovrebbe pubblicare solo sotto il
  proprietario ClawHub corrispondente
- uno slug di skill o un nome di pacchetto Plugin che sembra impersonare un progetto
- una disputa su brand, marchio, rinomina di progetto o cronologia dei pacchetti
- un proprietario eliminato, inattivo o irraggiungibile che blocca il legittimo proprietario dello spazio dei nomi

Se la scheda è non sicura, dannosa o fuorviante oltre alla disputa sulla proprietà,
segui anche le indicazioni pertinenti per la moderazione o la sicurezza. Il modulo di rivendicazione dello spazio dei nomi
serve per la revisione della proprietà, non per la divulgazione urgente di vulnerabilità.

## Prima di inviare

Verifica prima di pubblicare con il proprietario che corrisponde allo spazio dei nomi.
Per i pacchetti Plugin, i nomi con ambito come `@example-org/example-plugin` devono essere
pubblicati come il proprietario `example-org` corrispondente.

Se puoi gestire il proprietario attuale, correggi direttamente lo spazio dei nomi pubblicando,
rinominando, trasferendo, nascondendo o eliminando la risorsa interessata. Usa una rivendicazione
quando non puoi gestire il proprietario attuale o quando lo staff deve risolvere una
disputa.

## Prove da includere

Usa prove pubbliche e non sensibili. Le prove utili includono:

- cronologia di organizzazioni GitHub, repository, release o maintainer
- documentazione ufficiale del progetto che nomina lo spazio dei nomi
- prova del dominio o del dominio email ufficiale
- controllo dell'ambito in npm, PyPI, crates.io o altri registri di pacchetti
- prove di proprietà di marchio, brand o progetto che sia sicuro discutere
  pubblicamente
- cronologia del repository sorgente, cronologia del pacchetto o avvisi pubblici di rinomina
- link al proprietario, alla skill, al Plugin, al pacchetto o all'issue ClawHub contestati

Spiega cosa dimostra ciascun link. Lo staff dovrebbe poter comprendere la
relazione senza bisogno di credenziali private o segreti.

## Cosa non includere

Non inserire segreti o prove private in un'issue GitHub pubblica. Non includere:

- token API, chiavi di firma o credenziali
- token di verifica DNS
- file legali o contratti privati
- documenti di identità personali
- email private, segnalazioni di sicurezza private o dati riservati dei clienti

Il modulo di rivendicazione chiede se le prove sensibili richiedono un canale privato con lo staff.
Usa questa opzione invece di pubblicare materiale sensibile pubblicamente.

## Possibili esiti

A seconda delle prove e del rischio, lo staff di ClawHub può riservare uno spazio dei nomi,
trasferire la proprietà, rinominare una risorsa, nascondere o mettere in quarantena una scheda esistente,
aggiungere un alias o un reindirizzamento, chiedere ulteriori prove o rifiutare la richiesta.

La revisione dello spazio dei nomi non garantisce che ogni nome corrispondente venga trasferito.
Lo staff valuta le prove pubbliche, l'uso esistente, il rischio per la sicurezza e l'impatto sugli utenti.

## Documentazione correlata

- [Pubblicazione](/it/clawhub/publishing)
- [Risoluzione dei problemi](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderazione e sicurezza dell'account](/clawhub/moderation)
- [Sicurezza](/clawhub/security)
