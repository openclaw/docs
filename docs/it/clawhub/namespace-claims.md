---
read_when:
    - Reclamare un'organizzazione, un marchio, un ambito di pacchetto, un handle del proprietario, uno slug di skill o un namespace di pacchetto
    - Risoluzione di un namespace già rivendicato o riservato
    - Decidere se usare una segnalazione, un ricorso o una rivendicazione di namespace
sidebarTitle: Org and Namespace Claims
summary: Come richiedere una revisione di ClawHub per controversie sulla proprietà di organizzazioni, brand, handle del proprietario, ambito del pacchetto, slug della skill o namespace.
title: Rivendicazioni di organizzazione e namespace
x-i18n:
    generated_at: "2026-07-01T13:04:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Richieste su organizzazioni e spazi dei nomi

ClawHub usa identificativi dei proprietari, identificativi delle organizzazioni, slug delle Skills, nomi dei pacchetti Plugin e ambiti dei pacchetti come spazi dei nomi pubblici. Se uno spazio dei nomi sembra appartenere a un progetto reale, a un marchio, a un ecosistema di pacchetti o a un'organizzazione, ma su ClawHub è già rivendicato, riservato, fuorviante o contestato, chiedi allo staff di esaminarlo con il
[modulo per richieste su organizzazioni / spazi dei nomi](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Usa questo percorso per revisioni pubbliche e non sensibili della proprietà. Non usare le segnalazioni nel prodotto o il modulo di ricorso dell'account per le richieste sugli spazi dei nomi.

## Quando aprire una richiesta

Apri una richiesta su uno spazio dei nomi quando ritieni che lo staff di ClawHub debba verificare se uno spazio dei nomi debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias o modificato in altro modo a causa della proprietà nel mondo reale.

Gli esempi includono:

- un identificativo di organizzazione che corrisponde alla tua organizzazione GitHub, al tuo progetto, alla tua azienda o alla tua community
- un ambito di pacchetto come `@example-org/*` che dovrebbe pubblicare solo sotto il proprietario ClawHub corrispondente
- uno slug di Skill o un nome di pacchetto Plugin che sembra impersonare un progetto
- una controversia su marchio, trademark, rinomina di progetto o cronologia dei pacchetti
- un proprietario eliminato, inattivo o irraggiungibile che blocca il proprietario legittimo dello spazio dei nomi

Se la voce è non sicura, dannosa o fuorviante oltre alla controversia sulla proprietà, segui anche le indicazioni pertinenti per moderazione o sicurezza. Il modulo di richiesta sullo spazio dei nomi serve alla revisione della proprietà, non alla divulgazione urgente di vulnerabilità.

## Prima di inviare

Verifica prima che tu stia pubblicando con il proprietario che corrisponde allo spazio dei nomi. Per i pacchetti Plugin, i nomi con ambito come `@example-org/example-plugin` devono essere pubblicati come proprietario `example-org` corrispondente.

Se puoi gestire il proprietario attuale, correggi direttamente lo spazio dei nomi pubblicando, rinominando, trasferendo, nascondendo o eliminando la risorsa interessata. Usa una richiesta quando non puoi gestire il proprietario attuale o quando lo staff deve risolvere una controversia.

## Prove da includere

Usa prove pubbliche e non sensibili. Prove utili includono:

- organizzazione GitHub, repository, rilascio o cronologia dei maintainer
- documentazione ufficiale del progetto che nomina lo spazio dei nomi
- prova del dominio o del dominio email ufficiale
- controllo dell'ambito su npm, PyPI, crates.io o altri registri di pacchetti
- prova di proprietà di trademark, marchio o progetto che sia sicura da discutere pubblicamente
- cronologia del repository sorgente, cronologia del pacchetto o avvisi pubblici di rinomina
- link al proprietario, alla Skill, al Plugin, al pacchetto o alla segnalazione ClawHub contestati

Spiega cosa prova ogni link. Lo staff deve poter comprendere la relazione senza dover usare credenziali private o segreti.

## Cosa non includere

Non inserire segreti o prove private in una segnalazione GitHub pubblica. Non includere:

- token API, chiavi di firma o credenziali
- token di challenge DNS
- file legali o contratti privati
- documenti di identità personali
- email private, segnalazioni di sicurezza private o dati cliente riservati

Il modulo di richiesta chiede se le prove sensibili richiedono un canale privato con lo staff. Usa quell'opzione invece di pubblicare materiale sensibile pubblicamente.

## Esiti possibili

A seconda delle prove e del rischio, lo staff di ClawHub può riservare uno spazio dei nomi, trasferire la proprietà, rinominare una risorsa, nascondere o mettere in quarantena una voce esistente, aggiungere un alias o un reindirizzamento, chiedere ulteriori prove o rifiutare la richiesta.

La revisione dello spazio dei nomi non garantisce che ogni nome corrispondente venga trasferito. Lo staff valuta le prove pubbliche, l'uso esistente, il rischio per la sicurezza e l'impatto sugli utenti.

## Documentazione correlata

- [Pubblicazione](/it/clawhub/publishing)
- [Risoluzione dei problemi](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderazione e sicurezza dell'account](/clawhub/moderation)
- [Sicurezza](/clawhub/security)
