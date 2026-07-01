---
read_when:
    - Comprendere i risultati dell'audit di sicurezza di ClawHub
    - Decidere se installare una skill o un Plugin
    - Spiegazione dello stato di audit, del livello di rischio o dei risultati di ClawHub
sidebarTitle: Security Audits
summary: Come comprendere i risultati dell'audit di sicurezza di ClawHub prima di installare una skill o un Plugin.
title: Audit di sicurezza
x-i18n:
    generated_at: "2026-07-01T20:24:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audit di sicurezza

Gli audit di sicurezza di ClawHub ti aiutano a decidere se una skill o un plugin è abbastanza sicuro
da installare. Mostrano cosa fa una release, quale autorità richiede e
se qualcosa merita ulteriore attenzione prima che possa accedere a file, account,
credenziali, codice o servizi esterni.

Gli audit sono forti segnali di sicurezza, ma non garantiscono che una release sia
priva di rischi. Usa sempre il tuo giudizio prima di concedere accessi sensibili.

Vedi anche [Sicurezza](/clawhub/security), [Uso accettabile](/clawhub/acceptable-usage),
e [Moderazione e sicurezza dell'account](/clawhub/moderation).

## Cosa controllare prima dell'installazione

Prima dell'installazione, verifica:

- lo stato complessivo dell'audit
- il livello di rischio
- eventuali rilievi elencati
- credenziali, autorizzazioni o variabili d'ambiente richieste
- proprietario, origine, versione, changelog, download, stelle e altri segnali di affidabilità

Installa solo contenuti che comprendi e di cui ti fidi.

## Stato dell'audit

Lo stato dell'audit ti indica come reagire al risultato dell'audit:

| Stato       | Significato                                                               |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Non è stato trovato alcun problema visibile sopra il rischio basso.       |
| `Review`    | Leggi i rilievi prima dell'installazione. La release potrebbe comunque essere legittima. |
| `Warn`      | Usa maggiore cautela. ClawHub ha trovato un problema ad alto impatto o un segnale di avvertimento. |
| `Malicious` | Non installare.                                                           |
| `Pending`   | Gli audit non sono ancora terminati.                                      |
| `Error`     | Non è stato possibile completare l'audit.                                 |

Un `Pass` è rassicurante, ma non sostituisce il tuo giudizio. Questo è importante
soprattutto per gli strumenti che possono pubblicare contenuti, modificare dati, eseguire comandi, leggere file o
accedere a sistemi di produzione.

## Livello di rischio

Il livello di rischio descrive il raggio d'impatto: quanto potere sembra avere la release se
la usi come previsto.

| Livello di rischio | Significato                                                                  |
| ------------------ | ---------------------------------------------------------------------------- |
| `Low`              | È stata trovata poca autorità sensibile o poco impatto sull'utente.           |
| `Medium`           | La release ha un'autorità significativa, come accesso all'account o modifiche ai dati. |
| `High`             | La release ha un'autorità ad alto impatto, rilievi gravi o segnali dannosi.   |

Livello di rischio e stato dell'audit rispondono a domande diverse:

- Il livello di rischio chiede: "Quanto potere c'è qui?"
- Lo stato dell'audit chiede: "Cosa dovrei fare con questo risultato?"

Ad esempio, una skill di pubblicazione può mostrare `Review` con rischio `Medium`. Questo
non significa che sia dannosa. Significa che la skill sembra allineata allo scopo, ma può
agire con un'autorità significativa sull'account.

## Rilievi

I rilievi spiegano perché è stato mostrato un risultato di audit. Ogni rilievo di solito include:

- cosa significa
- perché è stato segnalato
- il contenuto pertinente della skill o del plugin
- una raccomandazione

I rilievi possono essere etichettati come `Info`, `Low`, `Medium`, `High` o `Critical`. I rilievi con
gravità maggiore contribuiscono più fortemente al livello di rischio e allo stato dell'audit.

I rilievi a bassa affidabilità sono nascosti dal riepilogo pubblico dell'audit, così la pagina
resta concentrata sulle prove utili.

## Cosa controlla ClawHub

ClawHub esegue audit sugli artefatti di release inviati, tra cui:

- istruzioni della skill o metadati del plugin
- variabili d'ambiente e autorizzazioni dichiarate
- istruzioni di installazione e metadati del pacchetto
- file inclusi e manifesti dei file
- metadati di compatibilità e capacità

La domanda principale è la coerenza: nome, riepilogo, metadati, autorità richiesta
e contenuto effettivo sono allineati con ciò che gli utenti si aspetterebbero ragionevolmente?

Un comportamento potente non è automaticamente negativo. Molti strumenti utili richiedono credenziali,
comandi locali, API di provider o installazioni di pacchetti. L'audit verifica se quel
potere è atteso, dichiarato e proporzionato.

Le pagine degli artefatti rimandano all'audit completo in:

```text
/<owner>/skills/<slug>/security-audit
```

La pagina dell'audit combina:

1. SkillSpector
2. VirusTotal
3. Analisi del rischio

## VirusTotal

ClawHub usa VirusTotal come telemetria malware nello stack di audit. VirusTotal è uno
standard di settore affidabile per la reputazione dei file e la scansione malware, e la nostra
partnership consente a ClawHub di aggiungere intelligence di sicurezza più ampia alla revisione di skill e plugin.

VirusTotal è particolarmente utile per artefatti dannosi noti, rilevamenti dei motori e
segnali di reputazione che completano la revisione di ClawHub consapevole degli agenti. Quando sono disponibili
i conteggi dei motori dei vendor, l'audit li riassume in linguaggio semplice, ad
esempio:

```text
62/62 vendors flagged this skill as clean.
```

oppure:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Quando ClawHub non dispone di telemetria sui conteggi dei vendor da riassumere, l'audit dice:

```text
No VirusTotal findings
```

VirusTotal resta telemetria. Non sostituisce l'analisi del rischio di ClawHub
consapevole dell'artefatto.

## Analisi del rischio

L'analisi del rischio è alimentata internamente da ClawScan, il sistema di audit di sicurezza
di ClawHub. Esamina ogni release come artefatto destinato agli agenti: istruzioni,
metadati, autorizzazioni dichiarate, file, segnali di capacità, segnali di scansione statica,
rilievi di SkillSpector, telemetria di VirusTotal e contesto fornito dall'editore.
I segnali di scansione statica sono contesto interno per questa revisione; non sono una
sezione di audit pubblica autonoma né un verdetto che blocca l'installazione.

L'analisi del rischio usa
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
come lente per rischi quali prompt injection, uso improprio degli strumenti, esposizione delle credenziali,
esecuzione non sicura, avvelenamento della memoria o del contesto ed eccessiva agency.

ClawScan non considera automaticamente dannosa una capacità dall'aspetto preoccupante.
Chiede se la capacità è dichiarata, allineata allo scopo e supportata
dal caso d'uso dichiarato della release.
