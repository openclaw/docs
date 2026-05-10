---
read_when:
    - Comprendere schede, versioni, installazioni, pubblicazione e moderazione
summary: Come funzionano le schede, le versioni, le installazioni, la pubblicazione, le scansioni e gli aggiornamenti di ClawHub.
x-i18n:
    generated_at: "2026-05-10T19:25:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4b995124c07d598a60897fa79fb61c4250a28f47d93d3bd62949f3a3364072e
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Come funziona ClawHub

ClawHub è il livello di registro per Skills e plugin di OpenClaw. Offre agli utenti un
luogo in cui scoprire pacchetti, ai publisher un luogo in cui rilasciare versioni e
fornisce a OpenClaw metadati sufficienti per installare e aggiornare quei pacchetti in modo sicuro.

## Record del registro

Ogni inserzione pubblica è un record del registro con:

- un proprietario e uno slug o un nome di pacchetto
- una o più versioni pubblicate
- metadati, riepilogo, file e attribuzione della fonte
- changelog e informazioni sui tag come `latest`
- segnali di download, installazione, preferiti e commenti
- stato della scansione di sicurezza e della moderazione

La pagina dell'inserzione è il luogo canonico in cui gli utenti possono verificare cosa uno skill o
un plugin dichiara di fare prima di installarlo.

## Skills

Uno skill è un bundle di testo versionato incentrato su `SKILL.md`. Può includere
file di supporto, esempi, template e script.

ClawHub legge il frontmatter di `SKILL.md` per comprendere il nome dello skill,
la descrizione, i requisiti, le variabili d'ambiente e i metadati. Metadati accurati
sono importanti perché aiutano gli utenti a decidere se installare lo skill e
aiutano le scansioni automatizzate a rilevare discrepanze tra comportamento dichiarato e osservato.

Vedi [Formato degli skill](/it/clawhub/skill-format).

## Plugin

I plugin sono estensioni OpenClaw pacchettizzate. ClawHub archivia metadati del pacchetto,
informazioni di compatibilità, link alla fonte, artefatti e record di versione.

Quando OpenClaw installa un plugin da ClawHub, controlla i metadati di compatibilità
dichiarati prima dell'installazione. I record dei pacchetti possono includere compatibilità API,
versione minima del gateway, destinazioni host, requisiti d'ambiente e digest
degli artefatti.

Usa una fonte di installazione ClawHub esplicita quando vuoi che il registro sia la
fonte di verità:

```bash
openclaw plugins install clawhub:<package>
```

## Pubblicazione

La pubblicazione crea un nuovo record di versione immutabile. I publisher usano la CLI `clawhub`
per flussi di lavoro autenticati del registro:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa le esecuzioni di prova per visualizzare in anteprima il payload risolto prima del caricamento. Le pagine pubbliche quindi
mostrano i metadati pubblicati, i file, l'attribuzione della fonte e lo stato della scansione.

## Installazioni e aggiornamenti

I comandi di installazione di OpenClaw usano ClawHub come fonte di pacchetti:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw registra i metadati della fonte di installazione così gli aggiornamenti possono risolvere in seguito lo stesso
pacchetto del registro. La CLI ClawHub supporta anche flussi di lavoro diretti di installazione e
aggiornamento degli skill per gli utenti che desiderano cartelle di skill gestite dal registro al di fuori di un
workspace OpenClaw completo.

## Stato di sicurezza

ClawHub è aperto alla pubblicazione, ma i rilasci sono comunque soggetti a gate di caricamento,
controlli automatizzati, segnalazioni degli utenti e azioni dei moderatori.

Le pagine pubbliche mostrano riepiloghi delle scansioni quando disponibili. I contenuti trattenuti, nascosti
o bloccati possono scomparire dalla ricerca pubblica e dai flussi di installazione pur rimanendo
visibili al proprietario per diagnosi o ricorso.

Vedi [Sicurezza + moderazione](/it/clawhub/security) e
[Uso accettabile](/it/clawhub/acceptable-usage).

## Accesso API

ClawHub espone API pubbliche in lettura per scoperta, ricerca, dettagli dei pacchetti e
download. I cataloghi di terze parti possono usare queste API quando rimandano
all'inserzione canonica di ClawHub, rispettano i limiti di frequenza ed evitano di implicare un'approvazione.

Vedi [API pubblica](/it/clawhub/api) e [API HTTP](/it/clawhub/http-api).
