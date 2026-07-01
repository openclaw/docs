---
read_when:
    - Comprendere i risultati dell'audit di sicurezza di ClawHub
    - Decidere se installare uno skill o un plugin
    - Spiegazione dello stato dell'audit di ClawHub, del livello di rischio o dei rilievi
sidebarTitle: Security Audits
summary: Come comprendere i risultati dell'audit di sicurezza di ClawHub prima di installare una skill o un plugin.
title: Audit di sicurezza
x-i18n:
    generated_at: "2026-07-01T18:13:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audit di sicurezza

Gli audit di sicurezza di ClawHub ti aiutano a decidere se una skill o un Plugin è abbastanza sicuro da installare. Mostrano cosa fa una versione, quale autorità richiede e se qualcosa merita maggiore attenzione prima che possa accedere a file, account, credenziali, codice o servizi esterni.

Gli audit sono segnali di sicurezza forti, ma non garantiscono che una versione sia priva di rischi. Usa sempre il tuo giudizio prima di concedere accessi sensibili.

Vedi anche [Sicurezza](/clawhub/security), [Uso accettabile](/clawhub/acceptable-usage) e [Moderazione e sicurezza dell'account](/clawhub/moderation).

## Cosa controllare prima dell'installazione

Prima di installare, esamina:

- lo stato complessivo dell'audit
- il livello di rischio
- eventuali risultati elencati
- credenziali, autorizzazioni o variabili di ambiente richieste
- proprietario, sorgente, versione, changelog, download, stelle e altri segnali di affidabilità

Installa solo contenuti che comprendi e di cui ti fidi.

## Stato dell'audit

Lo stato dell'audit indica come reagire al risultato dell'audit:

| Stato       | Significato                                                               |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Non è stato trovato alcun problema visibile sopra il rischio basso.       |
| `Review`    | Leggi i risultati prima di installare. La versione potrebbe comunque essere legittima. |
| `Warn`      | Usa maggiore cautela. ClawHub ha trovato un problema ad alto impatto o un segnale di avviso. |
| `Malicious` | Non installare.                                                           |
| `Pending`   | Gli audit non sono ancora terminati.                                      |
| `Error`     | Non è stato possibile completare l'audit.                                 |

Un `Pass` è rassicurante, ma non sostituisce il tuo giudizio. Questo conta soprattutto per gli strumenti che possono pubblicare contenuti, modificare dati, eseguire comandi, leggere file o accedere a sistemi di produzione.

## Livello di rischio

Il livello di rischio descrive il raggio d'impatto: quanto potere sembra avere la versione se la usi come previsto.

| Livello di rischio | Significato                                                                 |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | È stata trovata poca autorità sensibile o poco impatto sull'utente.           |
| `Medium`   | La versione ha un'autorità significativa, come accesso all'account o modifiche ai dati. |
| `High`     | La versione ha autorità ad alto impatto, risultati gravi o segnali dannosi.   |

Il livello di rischio e lo stato dell'audit rispondono a domande diverse:

- Il livello di rischio chiede: "Quanto potere c'è qui?"
- Lo stato dell'audit chiede: "Cosa dovrei fare con questo risultato?"

Ad esempio, una skill di pubblicazione può mostrare `Review` con rischio `Medium`. Questo non significa che sia dannosa. Significa che la skill sembra allineata allo scopo, ma può agire con un'autorità significativa sull'account.

## Risultati

I risultati spiegano perché è stato mostrato un risultato di audit. Ogni risultato di solito include:

- cosa significa
- perché è stato segnalato
- il contenuto pertinente della skill o del Plugin
- una raccomandazione

I risultati possono essere etichettati come `Info`, `Low`, `Medium`, `High` o `Critical`. I risultati con gravità più alta contribuiscono più fortemente al livello di rischio e allo stato dell'audit.

I risultati a bassa confidenza sono nascosti dal riepilogo pubblico dell'audit, così la pagina resta concentrata su prove utili.

## Cosa controlla ClawHub

ClawHub audita gli artefatti di versione inviati, tra cui:

- istruzioni della skill o metadati del Plugin
- variabili di ambiente e autorizzazioni dichiarate
- istruzioni di installazione e metadati del pacchetto
- file inclusi e manifest dei file
- metadati di compatibilità e capacità

La domanda principale è la coerenza: nome, riepilogo, metadati, autorità richiesta e contenuto effettivo sono allineati con ciò che gli utenti si aspetterebbero ragionevolmente?

Un comportamento potente non è automaticamente negativo. Molti strumenti utili hanno bisogno di credenziali, comandi locali, API di provider o installazioni di pacchetti. L'audit controlla se quel potere è previsto, dichiarato e proporzionato.

Le pagine degli artefatti rimandano all'audit completo in:

```text
/<owner>/skills/<slug>/security-audit
```

La pagina dell'audit combina:

1. SkillSpector
2. VirusTotal
3. Analisi del rischio

## VirusTotal

ClawHub usa VirusTotal come telemetria malware nello stack di audit. VirusTotal è uno standard di settore affidabile per la reputazione dei file e la scansione malware, e la nostra partnership consente a ClawHub di aggiungere intelligence di sicurezza più ampia alla revisione di skill e Plugin.

VirusTotal è particolarmente utile per artefatti dannosi noti, rilevamenti dei motori e segnali di reputazione che completano la revisione consapevole degli agenti di ClawHub. Quando sono disponibili i conteggi dei motori dei fornitori, l'audit li riassume in linguaggio semplice, ad esempio:

```text
62/62 vendors flagged this skill as clean.
```

oppure:

```text
2/64 vendors flagged this skill as malicious, 1/64 flagged it as suspicious, and 61/64 flagged it as clean.
```

Quando ClawHub non dispone di telemetria sui conteggi dei fornitori da riassumere, l'audit dice:

```text
No VirusTotal findings
```

VirusTotal resta telemetria. Non sostituisce l'analisi del rischio consapevole degli artefatti di ClawHub.

## Analisi del rischio

L'analisi del rischio è alimentata internamente da ClawScan, il sistema di audit di sicurezza di ClawHub. Esamina ogni versione come un artefatto rivolto agli agenti: istruzioni, metadati, autorizzazioni dichiarate, file, segnali di capacità, segnali di scansione statica, risultati di SkillSpector, telemetria di VirusTotal e contesto fornito dall'editore. I segnali di scansione statica sono contesto interno per questa revisione; non sono una sezione pubblica autonoma dell'audit né un verdetto che blocca l'installazione.

L'analisi del rischio usa la
[OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/)
come lente per rischi come prompt injection, uso improprio degli strumenti, esposizione delle credenziali, esecuzione non sicura, avvelenamento della memoria o del contesto ed eccessiva agency.

ClawScan non considera automaticamente dannosa una capacità dall'aspetto preoccupante. Si chiede se la capacità sia dichiarata, allineata allo scopo e supportata dal caso d'uso dichiarato della versione.
