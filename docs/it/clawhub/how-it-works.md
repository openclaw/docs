---
read_when:
    - Comprendere schede, versioni, installazioni, pubblicazione e moderazione
summary: Come funzionano le schede, le versioni, le installazioni, la pubblicazione, le scansioni e gli aggiornamenti di ClawHub.
x-i18n:
    generated_at: "2026-05-12T08:44:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Come funziona ClawHub

ClawHub è il livello di registro per gli Skills e i Plugin di OpenClaw. Offre agli utenti un
luogo in cui scoprire pacchetti, agli editori un luogo in cui rilasciare versioni e
fornisce a OpenClaw metadati sufficienti per installare e aggiornare quei pacchetti in sicurezza.

## Record del registro

Ogni inserzione pubblica è un record del registro con:

- un proprietario e uno slug o un nome di pacchetto
- una o più versioni pubblicate
- metadati, riepilogo, file e attribuzione della fonte
- informazioni su changelog e tag come `latest`
- segnali di download, installazione, preferiti e commenti
- stato di scansione di sicurezza e moderazione

La pagina dell’inserzione è il luogo canonico in cui gli utenti possono esaminare ciò che uno skill o
un plugin dichiara di fare prima di installarlo.

## Skills

Uno skill è un bundle di testo versionato incentrato su `SKILL.md`. Può includere
file di supporto, esempi, template e script.

ClawHub legge il frontmatter di `SKILL.md` per comprendere il nome dello skill,
la descrizione, i requisiti, le variabili d’ambiente e i metadati. Metadati accurati
sono importanti perché aiutano gli utenti a decidere se installare lo skill e
aiutano le scansioni automatizzate a rilevare discrepanze tra il comportamento dichiarato e quello osservato.

Vedi [Formato dello skill](/it/clawhub/skill-format).

## Plugins

I Plugin sono estensioni OpenClaw pacchettizzate. ClawHub archivia metadati del pacchetto,
informazioni di compatibilità, link alla fonte, artefatti e record di versione.

Quando OpenClaw installa un plugin da ClawHub, verifica i metadati di compatibilità
dichiarati prima dell’installazione. I record dei pacchetti possono includere compatibilità API,
versione minima del gateway, target host, requisiti d’ambiente e digest degli artefatti.

Usa una fonte di installazione ClawHub esplicita quando vuoi che il registro sia la
fonte di riferimento:

```bash
openclaw plugins install clawhub:<package>
```

## Pubblicazione

La pubblicazione crea un nuovo record di versione immutabile. Gli editori usano la CLI `clawhub`
per workflow di registro autenticati:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa le prove a secco per visualizzare in anteprima il payload risolto prima del caricamento. Le pagine pubbliche quindi
mostrano i metadati pubblicati, i file, l’attribuzione della fonte e lo stato della scansione.

## Installazioni e aggiornamenti

I comandi di installazione di OpenClaw usano ClawHub come fonte di pacchetti:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw registra i metadati della fonte di installazione affinché gli aggiornamenti possano risolvere lo stesso
pacchetto del registro in seguito. La CLI ClawHub supporta anche workflow diretti di installazione e
aggiornamento degli skill per gli utenti che desiderano cartelle di skill gestite dal registro al di fuori di un
workspace OpenClaw completo.

## Stato di sicurezza

ClawHub è aperto alla pubblicazione, ma i rilasci restano soggetti a gate di caricamento,
controlli automatizzati, segnalazioni degli utenti e interventi dei moderatori.

Le pagine pubbliche mostrano riepiloghi delle scansioni quando disponibili. I contenuti trattenuti, nascosti
o bloccati possono scomparire dalla ricerca pubblica e dai flussi di installazione, pur rimanendo
visibili al proprietario per la diagnostica.

Vedi [Sicurezza + moderazione](/it/clawhub/security) e
[Uso accettabile](/it/clawhub/acceptable-usage).

## Accesso API

ClawHub espone API pubbliche in lettura per scoperta, ricerca, dettagli dei pacchetti e
download. I cataloghi di terze parti possono usare queste API quando rimandano
all’inserzione ClawHub canonica, rispettano i limiti di frequenza ed evitano di implicare un’approvazione.

Vedi [API pubblica](/it/clawhub/api) e [API HTTP](/it/clawhub/http-api).
