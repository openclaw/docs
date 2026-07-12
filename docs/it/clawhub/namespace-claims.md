---
read_when:
    - Rivendicazione di un'organizzazione, un marchio, un ambito di pacchetto, un identificativo del proprietario, uno slug di skill o uno spazio dei nomi di pacchetto
    - Risoluzione di uno spazio dei nomi già rivendicato o riservato
    - Decidere se utilizzare una segnalazione, un ricorso o una rivendicazione dello spazio dei nomi
sidebarTitle: Org and Namespace Claims
summary: Come richiedere una revisione di ClawHub per controversie sulla titolarità di organizzazioni, marchi, handle del proprietario, ambiti dei pacchetti, slug delle skill o namespace.
title: Rivendicazioni di organizzazioni e spazi dei nomi
x-i18n:
    generated_at: "2026-07-12T06:51:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Rivendicazioni di organizzazioni e spazi dei nomi

ClawHub utilizza gli identificativi dei proprietari, gli identificativi delle organizzazioni, gli slug delle Skills, i nomi dei pacchetti dei Plugin e gli ambiti dei pacchetti come spazi dei nomi pubblici. Se uno spazio dei nomi sembra appartenere a un progetto, un marchio, un ecosistema di pacchetti o un'organizzazione reale, ma risulta già rivendicato, riservato, fuorviante o contestato su ClawHub, chiedi allo staff di esaminarlo tramite il
[modulo per la rivendicazione di un'organizzazione o di uno spazio dei nomi](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilizza questa procedura per la verifica pubblica e non sensibile della titolarità. Non utilizzare le segnalazioni all'interno del prodotto o il modulo di ricorso relativo all'account per le rivendicazioni degli spazi dei nomi.

## Quando presentare una rivendicazione

Presenta una rivendicazione relativa a uno spazio dei nomi quando ritieni che lo staff di ClawHub debba valutare se riservarlo, trasferirlo, rinominarlo, nasconderlo, metterlo in quarantena, associargli un alias o modificarlo in altro modo a causa della sua titolarità nel mondo reale.

Alcuni esempi:

- un identificativo di organizzazione che corrisponde alla tua organizzazione GitHub, al tuo progetto, alla tua azienda o alla tua comunità
- un ambito di pacchetti come `@example-org/*` che dovrebbe consentire la pubblicazione solo al proprietario ClawHub corrispondente
- uno slug di una Skill o il nome del pacchetto di un Plugin che sembra impersonare un progetto
- una controversia relativa a un marchio, un marchio registrato, la ridenominazione di un progetto o la cronologia di un pacchetto
- un proprietario eliminato, inattivo o irraggiungibile che impedisce al legittimo titolare dello spazio dei nomi di utilizzarlo

Se l'elemento pubblicato è pericoloso, dannoso o fuorviante al di là della controversia sulla titolarità, segui anche le indicazioni pertinenti per la moderazione o la sicurezza. Il modulo di rivendicazione dello spazio dei nomi serve per verificare la titolarità, non per segnalare urgentemente una vulnerabilità.

## Prima di presentare la richiesta

Verifica innanzitutto di pubblicare con il proprietario corrispondente allo spazio dei nomi. Per i pacchetti dei Plugin, i nomi con ambito come `@example-org/example-plugin` devono essere pubblicati con il proprietario `example-org` corrispondente.

Se puoi gestire il proprietario attuale, correggi direttamente lo spazio dei nomi pubblicando, rinominando, trasferendo, nascondendo o eliminando la risorsa interessata. Presenta una rivendicazione quando non puoi gestire il proprietario attuale o quando è necessario l'intervento dello staff per risolvere una controversia.

## Prove da includere

Utilizza prove pubbliche e non sensibili. Le prove utili includono:

- cronologia dell'organizzazione GitHub, del repository, delle release o dei manutentori
- documentazione ufficiale del progetto che indica lo spazio dei nomi
- prova relativa al dominio o al dominio di posta elettronica ufficiale
- controllo dell'ambito su npm, PyPI, crates.io o un altro registro di pacchetti
- prove della titolarità di un marchio, di un marchio registrato o di un progetto che possano essere discusse pubblicamente in sicurezza
- cronologia del repository sorgente, cronologia del pacchetto o avvisi pubblici di ridenominazione
- collegamenti al proprietario, alla Skill, al Plugin, al pacchetto o alla segnalazione ClawHub oggetto della controversia

Spiega cosa dimostra ciascun collegamento. Lo staff deve poter comprendere la relazione senza aver bisogno di credenziali private o segreti.

## Cosa non includere

Non inserire segreti o prove private in una segnalazione pubblica su GitHub. Non includere:

- token API, chiavi di firma o credenziali
- token di verifica DNS
- documenti legali o contratti privati
- documenti di identità personali
- messaggi di posta elettronica privati, segnalazioni di sicurezza private o dati riservati dei clienti

Il modulo di rivendicazione chiede se le prove sensibili richiedono un canale privato con lo staff. Utilizza tale opzione anziché pubblicare materiale sensibile.

## Possibili esiti

A seconda delle prove e del rischio, lo staff di ClawHub può riservare uno spazio dei nomi, trasferirne la titolarità, rinominare una risorsa, nascondere o mettere in quarantena un elemento pubblicato esistente, aggiungere un alias o un reindirizzamento, richiedere ulteriori prove oppure rifiutare la richiesta.

La verifica dello spazio dei nomi non garantisce il trasferimento di ogni nome corrispondente. Lo staff valuta le prove pubbliche, l'utilizzo esistente, il rischio per la sicurezza e l'impatto sugli utenti.

## Documentazione correlata

- [Pubblicazione](/it/clawhub/publishing)
- [Risoluzione dei problemi](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderazione e sicurezza dell'account](/clawhub/moderation)
- [Sicurezza](/clawhub/security)
