---
read_when:
    - Comprendere schede, versioni, installazioni, pubblicazione e moderazione
summary: Come funzionano le schede, le versioni, le installazioni, la pubblicazione, le scansioni e gli aggiornamenti di ClawHub.
x-i18n:
    generated_at: "2026-05-11T22:19:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Come funziona ClawHub

ClawHub è il livello di registro per Skills e Plugin di OpenClaw. Offre agli utenti un
luogo in cui scoprire pacchetti, agli autori un luogo in cui rilasciare versioni e
fornisce a OpenClaw metadati sufficienti per installare e aggiornare tali pacchetti in sicurezza.

## Record del registro

Ogni inserzione pubblica è un record del registro con:

- un proprietario e uno slug o nome di pacchetto
- una o più versioni pubblicate
- metadati, riepilogo, file e attribuzione della fonte
- informazioni su changelog e tag, come `latest`
- segnali di download, installazione, stelle e commenti
- stato di scansione di sicurezza e moderazione

La pagina dell'inserzione è il luogo canonico in cui gli utenti possono esaminare ciò che una skill o un
Plugin dichiara di fare prima di installarlo.

## Skills

Una skill è un bundle di testo versionato incentrato su `SKILL.md`. Può includere
file di supporto, esempi, modelli e script.

ClawHub legge il frontmatter di `SKILL.md` per comprendere nome della skill,
descrizione, requisiti, variabili d'ambiente e metadati. Metadati accurati
sono importanti perché aiutano gli utenti a decidere se installare la skill e
aiutano le scansioni automatiche a rilevare discrepanze tra comportamento dichiarato e osservato.

Vedi [Formato skill](/it/clawhub/skill-format).

## Plugins

I Plugin sono estensioni OpenClaw pacchettizzate. ClawHub archivia metadati dei pacchetti,
informazioni di compatibilità, link sorgente, artefatti e record di versione.

Quando OpenClaw installa un Plugin da ClawHub, verifica i metadati di compatibilità
dichiarati prima dell'installazione. I record dei pacchetti possono includere compatibilità API,
versione minima del Gateway, target host, requisiti d'ambiente e digest degli artefatti.

Usa una sorgente di installazione ClawHub esplicita quando vuoi che il registro sia la
fonte di verità:

```bash
openclaw plugins install clawhub:<package>
```

## Pubblicazione

La pubblicazione crea un nuovo record di versione immutabile. Gli autori usano la CLI `clawhub`
per workflow di registro autenticati:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa le prove a secco per visualizzare in anteprima il payload risolto prima del caricamento. Le pagine pubbliche quindi
mostrano metadati pubblicati, file, attribuzione della fonte e stato della scansione.

## Installazioni e aggiornamenti

I comandi di installazione di OpenClaw usano ClawHub come sorgente di pacchetti:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw registra i metadati della sorgente di installazione, così gli aggiornamenti possono risolvere lo stesso
pacchetto del registro in seguito. La CLI di ClawHub supporta anche workflow diretti di installazione e
aggiornamento delle skill per utenti che desiderano cartelle skill gestite dal registro al di fuori di un
workspace OpenClaw completo.

## Stato della sicurezza

ClawHub è aperto alla pubblicazione, ma i rilasci sono comunque soggetti a gate di caricamento,
controlli automatici, segnalazioni degli utenti e interventi dei moderatori.

Le pagine pubbliche mostrano riepiloghi delle scansioni quando disponibili. I contenuti trattenuti, nascosti
o bloccati possono scomparire dai flussi pubblici di ricerca e installazione, pur rimanendo
visibili al proprietario per la diagnostica.

Vedi [Sicurezza + moderazione](/it/clawhub/security) e
[Uso accettabile](/it/clawhub/acceptable-usage).

## Accesso API

ClawHub espone API di lettura pubbliche per scoperta, ricerca, dettagli dei pacchetti e
download. I cataloghi di terze parti possono usare queste API quando rimandano con un link
all'inserzione ClawHub canonica, rispettano i limiti di frequenza ed evitano di implicare approvazione.

Vedi [API pubblica](/it/clawhub/api) e [API HTTP](/it/clawhub/http-api).
