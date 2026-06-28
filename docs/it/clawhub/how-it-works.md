---
read_when:
    - Comprendere elenchi, versioni, installazioni, pubblicazione e moderazione
summary: Come funzionano inserzioni, versioni, installazioni, pubblicazione, scansioni e aggiornamenti di ClawHub.
x-i18n:
    generated_at: "2026-06-28T00:10:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Come funziona ClawHub

ClawHub è il livello di registro per Skills e plugin di OpenClaw. Offre agli utenti un
luogo in cui scoprire pacchetti, agli autori un luogo in cui rilasciare versioni e a
OpenClaw metadati sufficienti per installare e aggiornare quei pacchetti in sicurezza.

## Record del registro

Ogni scheda pubblica è un record del registro con:

- un proprietario e uno slug o nome del pacchetto
- una o più versioni pubblicate
- metadati, riepilogo, file e attribuzione della sorgente
- changelog e informazioni sui tag come `latest`
- segnali di download, installazione e stelle
- stato della scansione di sicurezza e della moderazione

La pagina della scheda è il luogo canonico in cui gli utenti possono verificare cosa
dichiara di fare una skill o un plugin prima di installarlo.

## Skills

Una skill è un bundle di testo versionato centrato su `SKILL.md`. Può includere
file di supporto, esempi, modelli e script.

ClawHub legge il frontmatter di `SKILL.md` per comprendere nome della skill,
descrizione, requisiti, variabili di ambiente e metadati. Metadati accurati sono
importanti perché aiutano gli utenti a decidere se installare la skill e aiutano
le scansioni automatizzate a rilevare discrepanze tra comportamento dichiarato e
osservato.

Vedi [Formato delle skill](/it/clawhub/skill-format).

## Plugin

I plugin sono estensioni OpenClaw pacchettizzate. ClawHub memorizza metadati del
pacchetto, informazioni di compatibilità, link alla sorgente, artefatti e record
di versione.

Quando OpenClaw installa un plugin da ClawHub, controlla i metadati di
compatibilità dichiarati prima dell'installazione. I record dei pacchetti possono
includere compatibilità API, versione minima del gateway, target host, requisiti
di ambiente e digest degli artefatti.

Usa una sorgente di installazione ClawHub esplicita quando vuoi che il registro
sia la fonte autorevole:

```bash
openclaw plugins install clawhub:<package>
```

## Pubblicazione

La pubblicazione crea un nuovo record di versione immutabile. Gli autori usano la
CLI `clawhub` per flussi di lavoro del registro autenticati:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa le esecuzioni di prova per visualizzare in anteprima il payload risolto prima
del caricamento. Le pagine pubbliche mostrano poi metadati pubblicati, file,
attribuzione della sorgente e stato della scansione.

## Installazioni e aggiornamenti

I comandi di installazione di OpenClaw usano ClawHub come sorgente di pacchetti:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registra i metadati della sorgente di installazione in modo che gli
aggiornamenti possano risolvere in seguito lo stesso pacchetto del registro. La
CLI di ClawHub supporta anche flussi di lavoro diretti di installazione e
aggiornamento delle skill per gli utenti che vogliono cartelle di skill gestite
dal registro al di fuori di un workspace OpenClaw completo.

## Stato della sicurezza

ClawHub è aperto alla pubblicazione, ma le release sono comunque soggette a gate
di caricamento, controlli automatizzati, segnalazioni degli utenti e azioni dei
moderatori.

Le pagine pubbliche mostrano riepiloghi delle scansioni quando disponibili. I
contenuti trattenuti, nascosti o bloccati possono scomparire dalla ricerca
pubblica e dai flussi di installazione, pur restando visibili al proprietario per
la diagnostica.

Vedi [Sicurezza](/it/clawhub/security), [Audit di sicurezza](/it/clawhub/security-audits),
[Moderazione e sicurezza dell'account](/it/clawhub/moderation) e
[Utilizzo accettabile](/it/clawhub/acceptable-usage).

## Accesso API

ClawHub espone API pubbliche in lettura per scoperta, ricerca, dettagli dei
pacchetti e download. I cataloghi di terze parti possono usare queste API quando
rimandano alla scheda ClawHub canonica, rispettano i limiti di frequenza ed
evitano di implicare un'approvazione.

Vedi [API pubblica](/it/clawhub/api) e [API HTTP](/it/clawhub/http-api).
