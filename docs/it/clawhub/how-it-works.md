---
read_when:
    - Comprendere elenchi, versioni, installazioni, pubblicazione e moderazione
summary: Come funzionano le schede, le versioni, le installazioni, la pubblicazione, le scansioni e gli aggiornamenti di ClawHub.
x-i18n:
    generated_at: "2026-05-11T20:23:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Come Funziona ClawHub

ClawHub è il livello di registro per Skills e Plugin di OpenClaw. Offre agli utenti un
posto in cui scoprire pacchetti, agli autori un posto in cui rilasciare versioni, e
fornisce a OpenClaw metadati sufficienti per installare e aggiornare quei pacchetti in sicurezza.

## Record del registro

Ogni inserzione pubblica è un record del registro con:

- un proprietario e uno slug o nome del pacchetto
- una o più versioni pubblicate
- metadati, riepilogo, file e attribuzione della sorgente
- changelog e informazioni sui tag come `latest`
- segnali di download, installazione, preferiti e commenti
- stato di scansione di sicurezza e moderazione

La pagina dell'inserzione è il luogo canonico in cui gli utenti possono esaminare cosa una skill o un
plugin dichiara di fare prima di installarlo.

## Skills

Una skill è un bundle di testo versionato incentrato su `SKILL.md`. Può includere
file di supporto, esempi, modelli e script.

ClawHub legge il frontmatter di `SKILL.md` per comprendere il nome della skill,
la descrizione, i requisiti, le variabili d'ambiente e i metadati. Metadati accurati
sono importanti perché aiutano gli utenti a decidere se installare la skill e
aiutano le scansioni automatizzate a rilevare incongruenze tra il comportamento dichiarato e quello osservato.

Vedi [Formato della skill](/it/clawhub/skill-format).

## Plugin

I Plugin sono estensioni OpenClaw pacchettizzate. ClawHub memorizza metadati del pacchetto,
informazioni di compatibilità, link alla sorgente, artefatti e record di versione.

Quando OpenClaw installa un plugin da ClawHub, verifica i metadati di compatibilità
dichiarati prima dell'installazione. I record dei pacchetti possono includere compatibilità API,
versione minima del gateway, destinazioni host, requisiti d'ambiente e digest degli artefatti.

Usa una sorgente di installazione ClawHub esplicita quando vuoi che il registro sia la
fonte di riferimento:

```bash
openclaw plugins install clawhub:<package>
```

## Pubblicazione

La pubblicazione crea un nuovo record di versione immutabile. Gli autori usano la CLI `clawhub`
per i workflow di registro autenticati:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa le simulazioni per visualizzare in anteprima il payload risolto prima del caricamento. Le pagine pubbliche quindi
mostrano i metadati pubblicati, i file, l'attribuzione della sorgente e lo stato della scansione.

## Installazioni e aggiornamenti

I comandi di installazione di OpenClaw usano ClawHub come sorgente dei pacchetti:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw registra i metadati della sorgente di installazione, così gli aggiornamenti possono risolvere lo stesso
pacchetto del registro in seguito. La CLI di ClawHub supporta anche workflow diretti di installazione e
aggiornamento delle skill per gli utenti che vogliono cartelle di skill gestite dal registro al di fuori di un
workspace OpenClaw completo.

## Stato di sicurezza

ClawHub è aperto alla pubblicazione, ma i rilasci sono comunque soggetti a gate di caricamento,
controlli automatizzati, segnalazioni degli utenti e azioni dei moderatori.

Le pagine pubbliche mostrano i riepiloghi delle scansioni quando disponibili. I contenuti trattenuti, nascosti
o bloccati possono scomparire dalla ricerca pubblica e dai flussi di installazione pur restando
visibili al proprietario per diagnostica o ricorso.

Vedi [Sicurezza + moderazione](/it/clawhub/security) e
[Utilizzo accettabile](/it/clawhub/acceptable-usage).

## Accesso API

ClawHub espone API di lettura pubbliche per scoperta, ricerca, dettagli dei pacchetti e
download. Cataloghi di terze parti possono usare queste API quando rimandano all'inserzione
ClawHub canonica, rispettano i limiti di frequenza ed evitano di implicare approvazione.

Vedi [API pubblica](/it/clawhub/api) e [API HTTP](/it/clawhub/http-api).
