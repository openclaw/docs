---
read_when:
    - Comprendere elenchi, versioni, installazioni, pubblicazione e moderazione
summary: Come funzionano schede, versioni, installazioni, pubblicazione, scansioni e aggiornamenti di ClawHub.
x-i18n:
    generated_at: "2026-07-03T00:57:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 747079343899e42d00f84b00c553447abe0b83f2c4f1c9cdbf54725e34779eaf
    source_path: clawhub/how-it-works.md
    workflow: 16
---

# Come funziona ClawHub

ClawHub è il livello di registro per Skills e Plugin di OpenClaw. Offre agli utenti un
luogo in cui scoprire pacchetti, agli editori un luogo in cui rilasciare versioni e
a OpenClaw metadati sufficienti per installare e aggiornare quei pacchetti in sicurezza.

## Record del registro

Ogni scheda pubblica è un record del registro con:

- un proprietario e uno slug o nome del pacchetto
- una o più versioni pubblicate
- metadati, riepilogo, file e attribuzione della fonte
- informazioni su changelog e tag, ad esempio `latest`
- segnali di download, installazione e preferiti
- stato di scansione di sicurezza e moderazione

La pagina della scheda è il luogo canonico in cui gli utenti possono esaminare cosa una skill o
un plugin dichiara di fare prima di installarlo.

## Skills

Una skill è un bundle di testo versionato incentrato su `SKILL.md`. Può includere
file di supporto, esempi, modelli e script.

ClawHub legge il frontmatter di `SKILL.md` per comprendere nome,
descrizione, requisiti, variabili d'ambiente e metadati della skill. Metadati accurati
sono importanti perché aiutano gli utenti a decidere se installare la skill e
aiutano le scansioni automatizzate a rilevare discrepanze tra comportamento dichiarato e osservato.

Vedi [Formato delle skill](/it/clawhub/skill-format).

## Plugins

I Plugin sono estensioni OpenClaw pacchettizzate. ClawHub archivia metadati del pacchetto,
informazioni di compatibilità, link alla fonte, artefatti e record di versione.

Quando OpenClaw installa un plugin da ClawHub, verifica i metadati di compatibilità
dichiarati prima dell'installazione. I record dei pacchetti possono includere compatibilità API,
versione minima del Gateway, destinazioni host, requisiti d'ambiente e digest degli artefatti.

Usa una fonte di installazione ClawHub esplicita quando vuoi che il registro sia la
fonte di verità:

```bash
openclaw plugins install clawhub:<package>
```

## Pubblicazione

La pubblicazione crea un nuovo record di versione immutabile. Gli editori usano la CLI `clawhub`
per flussi di lavoro di registro autenticati:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa le esecuzioni di prova per visualizzare in anteprima il payload risolto prima del caricamento. Le pagine pubbliche poi
mostrano i metadati pubblicati, i file, l'attribuzione della fonte e lo stato della scansione.

## Installazioni e aggiornamenti

I comandi di installazione di OpenClaw usano ClawHub come fonte dei pacchetti:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registra i metadati della fonte di installazione in modo che gli aggiornamenti possano risolvere lo stesso
pacchetto del registro in seguito. La CLI di ClawHub supporta anche flussi di lavoro diretti di installazione e
aggiornamento delle skill per gli utenti che vogliono cartelle di skill gestite dal registro al di fuori di un
workspace OpenClaw completo.

## Stato della sicurezza

ClawHub è aperto alla pubblicazione, ma le release sono comunque soggette a gate di caricamento,
controlli automatizzati, segnalazioni degli utenti e interventi dei moderatori.

Le pagine pubbliche mostrano riepiloghi delle scansioni quando disponibili. I contenuti trattenuti, nascosti
o bloccati possono scomparire dalla ricerca pubblica e dai flussi di installazione, pur rimanendo
visibili al proprietario per la diagnostica.

Vedi [Sicurezza](/clawhub/security), [Audit di sicurezza](/clawhub/security-audits),
[Moderazione e sicurezza dell'account](/it/clawhub/moderation) e
[Uso accettabile](/clawhub/acceptable-usage).

## Accesso API

ClawHub espone API di lettura pubbliche per scoperta, ricerca, dettagli dei pacchetti e
download. I cataloghi di terze parti possono usare queste API quando rimandano alla scheda
canonica di ClawHub, rispettano i limiti di frequenza ed evitano di implicare approvazione.

Vedi [API pubblica](/it/clawhub/api) e [API HTTP](/clawhub/http-api).
