---
read_when:
    - Comprendere elenchi, versioni, installazioni, pubblicazione e moderazione
summary: Come funzionano le schede, le versioni, le installazioni, la pubblicazione, le scansioni e gli aggiornamenti di ClawHub.
x-i18n:
    generated_at: "2026-06-28T06:00:52Z"
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
fornisce a OpenClaw metadati sufficienti per installare e aggiornare quei pacchetti in modo sicuro.

## Record del registro

Ogni elenco pubblico è un record del registro con:

- un proprietario e uno slug o nome di pacchetto
- una o più versioni pubblicate
- metadati, riepilogo, file e attribuzione della fonte
- informazioni di changelog e tag come `latest`
- segnali di download, installazione e preferiti
- stato di scansione di sicurezza e moderazione

La pagina dell'elenco è il luogo canonico in cui gli utenti possono esaminare cosa uno skill o
un plugin dichiara di fare prima di installarlo.

## Skills

Uno skill è un bundle di testo versionato incentrato su `SKILL.md`. Può includere
file di supporto, esempi, modelli e script.

ClawHub legge il frontmatter di `SKILL.md` per comprendere il nome dello skill,
la descrizione, i requisiti, le variabili d'ambiente e i metadati. Metadati accurati
sono importanti perché aiutano gli utenti a decidere se installare lo skill e
aiutano le scansioni automatizzate a rilevare discrepanze tra comportamento dichiarato e osservato.

Vedi [Formato Skill](/it/clawhub/skill-format).

## Plugin

I Plugin sono estensioni OpenClaw pacchettizzate. ClawHub archivia metadati del pacchetto,
informazioni di compatibilità, link alle fonti, artefatti e record di versione.

Quando OpenClaw installa un plugin da ClawHub, controlla i metadati di compatibilità
dichiarati prima dell'installazione. I record dei pacchetti possono includere compatibilità API,
versione minima del gateway, target host, requisiti d'ambiente e digest degli artefatti.

Usa una fonte di installazione ClawHub esplicita quando vuoi che il registro sia la
fonte di verità:

```bash
openclaw plugins install clawhub:<package>
```

## Pubblicazione

La pubblicazione crea un nuovo record di versione immutabile. Gli editori usano la CLI `clawhub`
per flussi di lavoro autenticati del registro:

```bash
clawhub skill publish ./my-skill
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Usa le prove a secco per visualizzare in anteprima il payload risolto prima del caricamento. Le pagine pubbliche poi
mostrano i metadati pubblicati, i file, l'attribuzione della fonte e lo stato della scansione.

## Installazioni e aggiornamenti

I comandi di installazione di OpenClaw usano ClawHub come fonte di pacchetti:

```bash
openclaw skills install @openclaw/demo
openclaw plugins install clawhub:<package>
```

OpenClaw registra i metadati della fonte di installazione così gli aggiornamenti possono risolvere lo stesso
pacchetto del registro in seguito. La CLI ClawHub supporta anche flussi di lavoro diretti di installazione e
aggiornamento degli skill per gli utenti che vogliono cartelle skill gestite dal registro fuori da un
workspace OpenClaw completo.

## Stato di sicurezza

ClawHub è aperto alla pubblicazione, ma i rilasci restano soggetti a gate di caricamento,
controlli automatizzati, segnalazioni degli utenti e azioni dei moderatori.

Le pagine pubbliche mostrano riepiloghi delle scansioni quando disponibili. I contenuti trattenuti, nascosti
o bloccati possono scomparire dai flussi pubblici di ricerca e installazione pur restando
visibili al proprietario per la diagnostica.

Vedi [Sicurezza](/it/clawhub/security), [Audit di sicurezza](/it/clawhub/security-audits),
[Moderazione e sicurezza dell'account](/it/clawhub/moderation) e
[Uso accettabile](/it/clawhub/acceptable-usage).

## Accesso API

ClawHub espone API di lettura pubbliche per scoperta, ricerca, dettagli dei pacchetti e
download. I cataloghi di terze parti possono usare queste API quando rimandano all'elenco
canonico di ClawHub, rispettano i limiti di frequenza ed evitano di implicare un'approvazione.

Vedi [API pubblica](/it/clawhub/api) e [API HTTP](/it/clawhub/http-api).
