---
read_when:
    - Comprendere elenchi, versioni, installazioni, pubblicazione e moderazione
summary: Come funzionano le schede, le versioni, le installazioni, la pubblicazione, le scansioni e gli aggiornamenti di ClawHub.
x-i18n:
    generated_at: "2026-05-12T12:48:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfd3614e9ddbcb167329e49a6fa92e32ca8d0a85235914a017452166ae49b594
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Come funziona ClawHub

ClawHub è il livello di registro per Skills e plugin di OpenClaw. Offre agli utenti un
luogo in cui scoprire i pacchetti, agli editori un luogo in cui rilasciare versioni e
a OpenClaw metadati sufficienti per installare e aggiornare tali pacchetti in modo sicuro.

## Record del registro

Ogni inserzione pubblica è un record del registro con:

- un proprietario e uno slug o un nome di pacchetto
- una o più versioni pubblicate
- metadati, riepilogo, file e attribuzione della fonte
- informazioni su changelog e tag come `latest`
- segnali di download, installazione, stelle e commenti
- stato di scansione di sicurezza e moderazione

La pagina dell’inserzione è il luogo canonico in cui gli utenti possono esaminare cosa
una skill o un plugin dichiara di fare prima di installarlo.

## Skills

Una skill è un bundle di testo versionato incentrato su `SKILL.md`. Può includere
file di supporto, esempi, template e script.

ClawHub legge il frontmatter di `SKILL.md` per comprendere il nome della skill,
la descrizione, i requisiti, le variabili d’ambiente e i metadati. Metadati accurati
sono importanti perché aiutano gli utenti a decidere se installare la skill e
aiutano le scansioni automatizzate a rilevare discrepanze tra il comportamento
dichiarato e quello osservato.

Vedi [Formato delle skill](/it/clawhub/skill-format).

## Plugin

I plugin sono estensioni OpenClaw pacchettizzate. ClawHub memorizza metadati del pacchetto,
informazioni di compatibilità, link alla fonte, artefatti e record di versione.

Quando OpenClaw installa un plugin da ClawHub, controlla i metadati di compatibilità
dichiarati prima dell’installazione. I record dei pacchetti possono includere compatibilità API,
versione minima del Gateway, destinazioni host, requisiti d’ambiente e digest degli artefatti.

Usa una fonte di installazione ClawHub esplicita quando vuoi che il registro sia la
fonte di verità:

```bash
openclaw plugins install clawhub:<package>
```

## Pubblicazione

La pubblicazione crea un nuovo record di versione immutabile. Gli editori usano la CLI
`clawhub` per flussi di lavoro autenticati del registro:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa le esecuzioni di prova per visualizzare in anteprima il payload risolto prima del caricamento.
Le pagine pubbliche mostrano quindi i metadati pubblicati, i file, l’attribuzione della fonte
e lo stato della scansione.

## Installazioni e aggiornamenti

I comandi di installazione di OpenClaw usano ClawHub come fonte di pacchetti:

```bash
openclaw skills install <skill-slug>
openclaw plugins install clawhub:<package>
```

OpenClaw registra i metadati della fonte di installazione in modo che gli aggiornamenti possano
risolvere lo stesso pacchetto del registro in seguito. La CLI ClawHub supporta anche flussi
di installazione e aggiornamento diretti delle skill per gli utenti che desiderano cartelle
di skill gestite dal registro al di fuori di un workspace OpenClaw completo.

## Stato della sicurezza

ClawHub è aperto alla pubblicazione, ma i rilasci sono comunque soggetti a gate di caricamento,
controlli automatizzati, segnalazioni degli utenti e interventi dei moderatori.

Le pagine pubbliche mostrano i riepiloghi delle scansioni quando disponibili. I contenuti
trattenuti, nascosti o bloccati possono scomparire dalla ricerca pubblica e dai flussi
di installazione, pur rimanendo visibili al proprietario per la diagnostica.

Vedi [Sicurezza + moderazione](/it/clawhub/security) e
[Uso accettabile](/it/clawhub/acceptable-usage).

## Accesso API

ClawHub espone API pubbliche di lettura per scoperta, ricerca, dettagli dei pacchetti e
download. I cataloghi di terze parti possono usare queste API quando rimandano
all’inserzione canonica di ClawHub, rispettano i limiti di frequenza ed evitano di
suggerire un’approvazione.

Vedi [API pubblica](/it/clawhub/api) e [API HTTP](/it/clawhub/http-api).
