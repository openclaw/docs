---
read_when:
    - Rivendicazione di un'organizzazione, un marchio, un ambito di pacchetti, un identificativo del proprietario, uno slug di una skill o uno spazio dei nomi di pacchetti
    - Risoluzione di uno spazio dei nomi già rivendicato o riservato
    - Decidere se utilizzare una segnalazione, un ricorso o una rivendicazione dello spazio dei nomi
sidebarTitle: Org and Namespace Claims
summary: Come richiedere una revisione di ClawHub per controversie sulla proprietà di organizzazioni, marchi, handle dei proprietari, ambiti dei pacchetti, slug delle skill o namespace.
title: Rivendicazioni di organizzazioni e spazi dei nomi
x-i18n:
    generated_at: "2026-07-16T14:10:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Rivendicazioni di organizzazioni e spazi dei nomi

ClawHub utilizza gli handle dei proprietari, gli handle delle organizzazioni, gli slug delle skill, i nomi dei pacchetti dei plugin e
gli scope dei pacchetti come spazi dei nomi pubblici. Se uno spazio dei nomi sembra appartenere a un
progetto reale, un marchio, un ecosistema di pacchetti o un'organizzazione, ma risulta già
rivendicato, riservato, fuorviante o contestato su ClawHub, richiederne la verifica allo staff
tramite il
[modulo per la rivendicazione di organizzazioni/spazi dei nomi](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Utilizzare questa procedura per una verifica pubblica e non sensibile della proprietà. Non utilizzare le
segnalazioni interne al prodotto o il modulo di ricorso per l'account per le rivendicazioni degli spazi dei nomi.

## Quando presentare una rivendicazione

Presentare una rivendicazione per uno spazio dei nomi quando si ritiene che lo staff di ClawHub debba verificare se uno
spazio dei nomi debba essere riservato, trasferito, rinominato, nascosto, messo in quarantena, associato a un alias
o altrimenti modificato a causa della proprietà nel mondo reale.

Gli esempi includono:

- un handle di organizzazione che corrisponde alla propria organizzazione GitHub, al proprio progetto, alla propria azienda o comunità
- uno scope di pacchetto come `@example-org/*` che dovrebbe consentire la pubblicazione solo al
  proprietario ClawHub corrispondente
- uno slug di skill o il nome di un pacchetto di plugin che sembra spacciarsi per un progetto
- una controversia relativa a un marchio, un marchio registrato, la ridenominazione di un progetto o la cronologia di un pacchetto
- un proprietario eliminato, inattivo o irraggiungibile che impedisce al legittimo proprietario dello spazio dei nomi
  di utilizzarlo

Se l'inserzione è pericolosa, dannosa o fuorviante oltre la controversia sulla proprietà,
seguire anche le indicazioni pertinenti sulla moderazione o sulla sicurezza. Il modulo di rivendicazione dello spazio dei nomi
serve per la verifica della proprietà, non per la divulgazione urgente di vulnerabilità.

## Prima di presentare la richiesta

Verificare innanzitutto che la pubblicazione avvenga con il proprietario corrispondente allo spazio dei nomi.
Per i pacchetti di plugin, i nomi con scope come `@example-org/example-plugin` devono essere
pubblicati dal proprietario `example-org` corrispondente.

Se è possibile gestire il proprietario attuale, correggere direttamente lo spazio dei nomi pubblicando,
rinominando, trasferendo, nascondendo o eliminando la risorsa interessata. Presentare una rivendicazione
quando non è possibile gestire il proprietario attuale o quando è necessario che lo staff risolva una
controversia.

## Prove da includere

Utilizzare prove pubbliche e non sensibili. Le prove utili includono:

- cronologia dell'organizzazione GitHub, del repository, delle release o dei maintainer
- documentazione ufficiale del progetto che indica lo spazio dei nomi
- prova relativa al dominio o al dominio email ufficiale
- controllo dello scope su npm, PyPI, crates.io o un altro registro di pacchetti
- prove della proprietà di un marchio registrato, un marchio o un progetto che possano essere discusse in modo sicuro
  pubblicamente
- cronologia del repository del codice sorgente, cronologia del pacchetto o avvisi pubblici di ridenominazione
- link al proprietario, alla skill, al plugin, al pacchetto o alla segnalazione ClawHub oggetto della controversia

Spiegare ciò che dimostra ciascun link. Lo staff deve poter comprendere la
relazione senza dover ricorrere a credenziali private o segreti.

## Contenuti da non includere

Non inserire segreti o prove private in una segnalazione GitHub pubblica. Non includere:

- token API, chiavi di firma o credenziali
- token di verifica DNS
- documenti legali o contratti privati
- documenti di identità personali
- email private, segnalazioni di sicurezza private o dati riservati dei clienti

Il modulo di rivendicazione chiede se le prove sensibili richiedono un canale privato con lo staff.
Utilizzare tale opzione anziché pubblicare materiale sensibile.

## Possibili esiti

In base alle prove e al rischio, lo staff di ClawHub può riservare uno spazio dei nomi,
trasferirne la proprietà, rinominare una risorsa, nascondere o mettere in quarantena un'inserzione esistente,
aggiungere un alias o un reindirizzamento, richiedere ulteriori prove oppure respingere la richiesta.

La verifica dello spazio dei nomi non garantisce che ogni nome corrispondente venga trasferito.
Lo staff valuta le prove pubbliche, l'utilizzo esistente, il rischio per la sicurezza e l'impatto sugli utenti.

## Documentazione correlata

- [Pubblicazione](/it/clawhub/publishing)
- [Risoluzione dei problemi](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderazione e sicurezza dell'account](/clawhub/moderation)
- [Sicurezza](/clawhub/security)
