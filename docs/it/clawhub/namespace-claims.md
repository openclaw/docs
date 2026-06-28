---
read_when:
    - Rivendicare un'organizzazione, un brand, un ambito di pacchetto, un handle del proprietario, uno slug di skill o un namespace di pacchetto
    - Risoluzione di uno spazio dei nomi già rivendicato o riservato
    - Decidere se usare una segnalazione, un ricorso o una rivendicazione di namespace
sidebarTitle: Org and Namespace Claims
summary: Come richiedere una revisione di ClawHub per controversie sulla proprietà di organizzazione, marchio, handle del proprietario, ambito del pacchetto, slug della skill o namespace.
title: Reclami di organizzazione e namespace
x-i18n:
    generated_at: "2026-06-28T20:41:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Rivendicazioni di organizzazioni e namespace

ClawHub usa identificativi dei proprietari, identificativi delle organizzazioni, slug delle Skills, nomi dei pacchetti Plugin e ambiti dei pacchetti come namespace pubblici. Se un namespace sembra appartenere a un progetto reale, a un marchio, a un ecosistema di pacchetti o a un'organizzazione, ma su ClawHub è già rivendicato, riservato, fuorviante o contestato, chiedi allo staff di esaminarlo con il [modulo per problemi di rivendicazione di organizzazione / namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Usa questo percorso per revisioni pubbliche e non sensibili della proprietà. Non usare le segnalazioni nel prodotto o il modulo di appello dell'account per le rivendicazioni di namespace.

## Quando aprire una rivendicazione

Apri una rivendicazione di namespace quando ritieni che lo staff di ClawHub debba valutare se un namespace debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias o modificato in altro modo per motivi di proprietà nel mondo reale.

Esempi:

- un identificativo di organizzazione che corrisponde alla tua organizzazione GitHub, al tuo progetto, alla tua azienda o alla tua comunità
- un ambito di pacchetto come `@example-org/*` che dovrebbe pubblicare solo sotto il proprietario ClawHub corrispondente
- uno slug di Skill o un nome di pacchetto Plugin che sembra impersonare un progetto
- una controversia su un marchio, un marchio registrato, la rinomina di un progetto o la cronologia di un pacchetto
- un proprietario eliminato, inattivo o irraggiungibile che blocca il legittimo proprietario del namespace

Se l'inserzione è non sicura, dannosa o fuorviante oltre alla controversia sulla proprietà, segui anche le indicazioni pertinenti per la moderazione o la sicurezza. Il modulo di rivendicazione del namespace serve per la revisione della proprietà, non per la divulgazione urgente di vulnerabilità.

## Prima di inviare

Verifica prima che tu stia pubblicando con il proprietario che corrisponde al namespace. Per i pacchetti Plugin, i nomi con ambito come `@example-org/example-plugin` devono essere pubblicati come proprietario `example-org` corrispondente.

Se puoi gestire il proprietario attuale, correggi direttamente il namespace pubblicando, rinominando, trasferendo, nascondendo o eliminando la risorsa interessata. Usa una rivendicazione quando non puoi gestire il proprietario attuale o quando lo staff deve risolvere una controversia.

## Prove da includere

Usa prove pubbliche e non sensibili. Le prove utili includono:

- cronologia dell'organizzazione GitHub, del repository, delle release o dei manutentori
- documentazione ufficiale del progetto che nomina il namespace
- prova del dominio o del dominio email ufficiale
- controllo dell'ambito su npm, PyPI, crates.io o altri registri di pacchetti
- prove di proprietà di marchio registrato, marchio o progetto che possono essere discusse pubblicamente in sicurezza
- cronologia del repository sorgente, cronologia del pacchetto o avvisi pubblici di rinomina
- link al proprietario, alla Skill, al Plugin, al pacchetto o al problema ClawHub contestato

Spiega cosa dimostra ogni link. Lo staff dovrebbe poter comprendere la relazione senza bisogno di credenziali private o segreti.

## Cosa non includere

Non inserire segreti o prove private in un problema GitHub pubblico. Non includere:

- token API, chiavi di firma o credenziali
- token di verifica DNS
- file o contratti legali privati
- documenti di identità personale
- email private, segnalazioni di sicurezza private o dati riservati dei clienti

Il modulo di rivendicazione chiede se le prove sensibili richiedono un canale privato con lo staff. Usa quell'opzione invece di pubblicare materiale sensibile pubblicamente.

## Possibili esiti

A seconda delle prove e del rischio, lo staff di ClawHub può riservare un namespace, trasferire la proprietà, rinominare una risorsa, nascondere o mettere in quarantena un'inserzione esistente, aggiungere un alias o un reindirizzamento, chiedere ulteriori prove o rifiutare la richiesta.

La revisione del namespace non garantisce che ogni nome corrispondente venga trasferito. Lo staff valuta le prove pubbliche, l'uso esistente, il rischio di sicurezza e l'impatto sugli utenti.

## Documentazione correlata

- [Pubblicazione](/it/clawhub/publishing)
- [Risoluzione dei problemi](/it/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderazione e sicurezza dell'account](/it/clawhub/moderation)
- [Sicurezza](/it/clawhub/security)
