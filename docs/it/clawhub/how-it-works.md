---
read_when:
    - Comprendere elenchi, versioni, installazioni, pubblicazione e moderazione
summary: Come funzionano le schede, le versioni, le installazioni, la pubblicazione, le scansioni e gli aggiornamenti di ClawHub.
x-i18n:
    generated_at: "2026-07-16T14:03:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Come funziona ClawHub

ClawHub è il livello di registro per le Skills e i Plugin di OpenClaw. Offre agli utenti un
luogo in cui scoprire i pacchetti, agli autori un luogo in cui pubblicare le versioni e
fornisce a OpenClaw metadati sufficienti per installare e aggiornare tali pacchetti in modo sicuro.

## Record del registro

Ogni elemento pubblico è un record del registro con:

- un proprietario e uno slug o un nome di pacchetto
- una o più versioni pubblicate
- metadati, riepilogo, file e attribuzione della fonte
- changelog e informazioni sui tag, come `latest`
- indicatori relativi a download, installazioni e stelle
- stato della scansione di sicurezza e della moderazione

La pagina dell'elemento è il luogo canonico in cui gli utenti possono verificare ciò che una skill o
un Plugin dichiara di fare prima di installarlo.

## Skills

Una skill è un bundle di testo con versioni, incentrato su `SKILL.md`. Può includere
file di supporto, esempi, modelli e script.

ClawHub legge il frontmatter di `SKILL.md` per determinare il nome della skill,
la descrizione, i requisiti, le variabili di ambiente e i metadati. Metadati
accurati sono importanti perché aiutano gli utenti a decidere se installare la skill e
consentono alle scansioni automatizzate di rilevare discrepanze tra il comportamento dichiarato e quello osservato.

Consultare [Formato delle skill](/it/clawhub/skill-format).

## Plugin

I Plugin sono estensioni OpenClaw distribuite come pacchetti. ClawHub memorizza i metadati dei pacchetti,
le informazioni sulla compatibilità, i collegamenti alle fonti, gli artefatti e i record delle versioni.

Quando OpenClaw installa un Plugin da ClawHub, verifica i metadati di compatibilità
dichiarati prima dell'installazione. I record dei pacchetti possono includere la compatibilità dell'API,
la versione minima del Gateway, le destinazioni host, i requisiti dell'ambiente e i digest
degli artefatti.

Utilizzare una fonte di installazione ClawHub esplicita quando si desidera che il registro sia la
fonte attendibile:

```bash
openclaw plugins install clawhub:<package>
```

## Pubblicazione

La pubblicazione crea un nuovo record di versione immutabile. Gli autori utilizzano la CLI `clawhub`
per i flussi di lavoro autenticati del registro:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Utilizzare le esecuzioni di prova per visualizzare in anteprima il payload risolto prima del caricamento. Le pagine pubbliche
mostrano quindi i metadati pubblicati, i file, l'attribuzione della fonte e lo stato della scansione.

## Installazioni e aggiornamenti

I comandi di installazione di OpenClaw utilizzano ClawHub come fonte dei pacchetti:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registra i metadati della fonte di installazione affinché gli aggiornamenti possano individuare in seguito lo stesso
pacchetto del registro. La CLI di ClawHub supporta inoltre flussi di lavoro diretti per l'installazione e
l'aggiornamento delle skill destinati agli utenti che desiderano cartelle di skill gestite dal registro al di fuori di uno
spazio di lavoro OpenClaw completo.

## Stato della sicurezza

ClawHub è aperto alla pubblicazione, ma le release sono comunque soggette a controlli di caricamento,
verifiche automatizzate, segnalazioni degli utenti e interventi dei moderatori.

Le pagine pubbliche mostrano i riepiloghi delle scansioni quando disponibili. I contenuti sospesi, nascosti
o bloccati possono scomparire dalla ricerca pubblica e dai flussi di installazione, pur rimanendo
visibili al proprietario per la diagnostica.

Consultare [Sicurezza](/clawhub/security), [Verifiche di sicurezza](/clawhub/security-audits),
[Moderazione e sicurezza dell'account](/it/clawhub/moderation) e
[Uso accettabile](/clawhub/acceptable-usage).

## Accesso API

ClawHub espone API pubbliche di lettura per l'esplorazione, la ricerca, i dettagli dei pacchetti e
i download. I cataloghi di terze parti possono utilizzare queste API purché rimandino
all'elemento canonico di ClawHub, rispettino i limiti di frequenza ed evitino di suggerire un'approvazione ufficiale.

Consultare [API pubblica](/clawhub/api) e [API HTTP](/clawhub/http-api).
