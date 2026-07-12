---
read_when:
    - Comprendere elenchi, versioni, installazioni, pubblicazione e moderazione
summary: Come funzionano le schede, le versioni, le installazioni, la pubblicazione, le scansioni e gli aggiornamenti di ClawHub.
x-i18n:
    generated_at: "2026-07-12T06:52:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Come funziona ClawHub

ClawHub è il livello di registro per Skills e Plugin di OpenClaw. Offre agli utenti un
luogo in cui scoprire i pacchetti, agli autori un luogo in cui pubblicare le versioni e
fornisce a OpenClaw metadati sufficienti per installare e aggiornare tali pacchetti in sicurezza.

## Record del registro

Ogni voce pubblica è un record del registro con:

- un proprietario e uno slug o un nome di pacchetto
- una o più versioni pubblicate
- metadati, riepilogo, file e attribuzione della fonte
- informazioni sul changelog e sui tag, come `latest`
- indicatori di download, installazione e preferiti
- stato della scansione di sicurezza e della moderazione

La pagina della voce è il luogo di riferimento in cui gli utenti possono verificare cosa
una Skills o un Plugin dichiara di fare prima di installarlo.

## Skills

Una Skills è un pacchetto di testo con versioni, incentrato su `SKILL.md`. Può includere
file di supporto, esempi, modelli e script.

ClawHub legge il frontmatter di `SKILL.md` per comprendere il nome della Skills,
la descrizione, i requisiti, le variabili di ambiente e i metadati. L'accuratezza
dei metadati è importante perché aiuta gli utenti a decidere se installare la Skills e
aiuta le scansioni automatizzate a rilevare discrepanze tra il comportamento dichiarato e quello osservato.

Vedi [Formato delle Skills](/clawhub/skill-format).

## Plugin

I Plugin sono estensioni OpenClaw distribuite come pacchetti. ClawHub archivia i metadati dei pacchetti,
le informazioni sulla compatibilità, i collegamenti alle fonti, gli artefatti e i record delle versioni.

Quando OpenClaw installa un Plugin da ClawHub, verifica i metadati di compatibilità
dichiarati prima dell'installazione. I record dei pacchetti possono includere la compatibilità con le API,
la versione minima del Gateway, le piattaforme host di destinazione, i requisiti di ambiente e i digest
degli artefatti.

Usa una fonte di installazione ClawHub esplicita quando vuoi che il registro sia la
fonte autorevole:

```bash
openclaw plugins install clawhub:<package>
```

## Pubblicazione

La pubblicazione crea un nuovo record di versione immutabile. Gli autori usano la CLI `clawhub`
per i flussi di lavoro autenticati del registro:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa le simulazioni per visualizzare in anteprima il payload risolto prima del caricamento. Le pagine pubbliche
mostrano quindi i metadati pubblicati, i file, l'attribuzione della fonte e lo stato della scansione.

## Installazioni e aggiornamenti

I comandi di installazione di OpenClaw usano ClawHub come fonte dei pacchetti:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registra i metadati della fonte di installazione affinché gli aggiornamenti possano risolvere in seguito lo stesso
pacchetto del registro. La CLI ClawHub supporta anche flussi di lavoro diretti di installazione e
aggiornamento delle Skills per gli utenti che desiderano cartelle delle Skills gestite dal registro al di fuori di uno
spazio di lavoro OpenClaw completo.

## Stato della sicurezza

ClawHub consente la pubblicazione aperta, ma le versioni sono comunque soggette a controlli di caricamento,
verifiche automatizzate, segnalazioni degli utenti e interventi dei moderatori.

Le pagine pubbliche mostrano i riepiloghi delle scansioni quando disponibili. I contenuti sospesi, nascosti
o bloccati possono scomparire dalla ricerca pubblica e dai flussi di installazione, pur rimanendo
visibili al proprietario a fini diagnostici.

Vedi [Sicurezza](/it/clawhub/security), [Audit di sicurezza](/clawhub/security-audits),
[Moderazione e sicurezza dell'account](/it/clawhub/moderation) e
[Uso accettabile](/clawhub/acceptable-usage).

## Accesso alle API

ClawHub espone API pubbliche di lettura per l'esplorazione, la ricerca, i dettagli dei pacchetti e
i download. I cataloghi di terze parti possono usare queste API purché rimandino alla
voce canonica di ClawHub, rispettino i limiti di frequenza ed evitino di suggerire un'approvazione.

Vedi [API pubblica](/clawhub/api) e [API HTTP](/clawhub/http-api).
