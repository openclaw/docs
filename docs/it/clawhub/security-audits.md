---
read_when:
    - Comprendere i risultati dell'audit di sicurezza di ClawHub
    - Decidere se installare una skill o un plugin
    - Spiegazione dello stato dell’audit di ClawHub, del livello di rischio o dei risultati riscontrati
sidebarTitle: Security Audits
summary: Come comprendere i risultati dell’audit di sicurezza di ClawHub prima di installare una skill o un plugin.
title: Audit di sicurezza
x-i18n:
    generated_at: "2026-07-12T06:54:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audit di sicurezza

Gli audit di sicurezza di ClawHub ti aiutano a decidere se una skill o un plugin è sufficientemente sicuro
da installare. Mostrano cosa fa una release, quali autorizzazioni richiede e
se vi siano aspetti che meritano ulteriore attenzione prima che possa accedere a file, account,
credenziali, codice o servizi esterni.

Gli audit costituiscono validi indicatori di sicurezza, ma non garantiscono che una release sia
priva di rischi. Valuta sempre attentamente prima di concedere accessi sensibili.

Vedi anche [Sicurezza](/clawhub/security), [Uso accettabile](/clawhub/acceptable-usage)
e [Moderazione e sicurezza dell'account](/clawhub/moderation).

## Cosa controllare prima dell'installazione

Prima dell'installazione, esamina:

- lo stato complessivo dell'audit
- il livello di rischio
- gli eventuali rilievi elencati
- le credenziali, le autorizzazioni o le variabili d'ambiente richieste
- il proprietario, il codice sorgente, la versione, il changelog, i download, le stelle e altri indicatori di affidabilità

Installa solo contenuti che comprendi e ritieni affidabili.

## Stato dell'audit

Lo stato dell'audit indica come reagire al relativo risultato:

| Stato       | Significato                                                                        |
| ----------- | ---------------------------------------------------------------------------------- |
| `Pass`      | Non è stato rilevato alcun problema visibile con rischio superiore a quello basso. |
| `Review`    | Leggi i rilievi prima dell'installazione. La release potrebbe comunque essere legittima. |
| `Warn`      | Procedi con particolare cautela. ClawHub ha rilevato un problema ad alto impatto o un segnale di allarme. |
| `Malicious` | Non installare.                                                                    |
| `Pending`   | Gli audit non sono ancora terminati.                                               |
| `Error`     | Non è stato possibile completare l'audit.                                          |

Un risultato `Pass` è rassicurante, ma non sostituisce la tua valutazione. Questo aspetto è
particolarmente importante per gli strumenti in grado di pubblicare contenuti, modificare dati, eseguire comandi, leggere file o
accedere a sistemi di produzione.

## Livello di rischio

Il livello di rischio descrive il raggio d'impatto: quanto potere sembra avere la release se
la utilizzi come previsto.

| Livello di rischio | Significato                                                                          |
| ------------------ | ------------------------------------------------------------------------------------ |
| `Low`              | Sono state rilevate poche autorizzazioni sensibili o conseguenze per l'utente.        |
| `Medium`           | La release dispone di autorizzazioni significative, come l'accesso agli account o la modifica dei dati. |
| `High`             | La release dispone di autorizzazioni ad alto impatto, presenta rilievi gravi o segnali dannosi. |

Il livello di rischio e lo stato dell'audit rispondono a domande diverse:

- Il livello di rischio chiede: "Quanto potere è presente?"
- Lo stato dell'audit chiede: "Cosa devo fare con questo risultato?"

Ad esempio, una skill di pubblicazione potrebbe mostrare `Review` con rischio `Medium`. Ciò
non significa che sia dannosa. Significa che la skill sembra coerente con il proprio scopo, ma può
operare con autorizzazioni significative sull'account.

## Rilievi

I rilievi spiegano perché è stato mostrato un determinato risultato dell'audit. Ogni rilievo solitamente include:

- cosa significa
- perché è stato segnalato
- il contenuto pertinente della skill o del plugin
- una raccomandazione

I rilievi possono essere classificati come `Info`, `Low`, `Medium`, `High` o `Critical`. I rilievi con
gravità maggiore incidono più significativamente sul livello di rischio e sullo stato dell'audit.

I rilievi con un basso livello di attendibilità sono esclusi dal riepilogo pubblico dell'audit, affinché la pagina
rimanga incentrata su elementi probatori utili.

## Cosa controlla ClawHub

ClawHub esamina gli artefatti delle release inviate, tra cui:

- le istruzioni della skill o i metadati del plugin
- le variabili d'ambiente e le autorizzazioni dichiarate
- le istruzioni di installazione e i metadati del pacchetto
- i file inclusi e i manifest dei file
- i metadati relativi alla compatibilità e alle funzionalità

La domanda principale riguarda la coerenza: il nome, il riepilogo, i metadati, le
autorizzazioni richieste e il contenuto effettivo corrispondono a ciò che gli utenti potrebbero ragionevolmente aspettarsi?

Un comportamento potente non è automaticamente negativo. Molti strumenti utili richiedono credenziali,
comandi locali, API dei fornitori o installazioni di pacchetti. L'audit verifica se tale
potere sia previsto, dichiarato e proporzionato.

Le pagine degli artefatti rimandano all'audit completo all'indirizzo:

```text
/<owner>/skills/<slug>/security-audit
```

La pagina dell'audit combina:

1. SkillSpector
2. VirusTotal
3. Analisi del rischio

## VirusTotal

ClawHub utilizza VirusTotal come telemetria antimalware nella serie di controlli dell'audit. VirusTotal è uno
standard di settore affidabile per la reputazione dei file e la scansione antimalware, e la nostra
partnership consente a ClawHub di integrare informazioni di sicurezza più ampie nella revisione di skill e plugin.

VirusTotal è particolarmente utile per gli artefatti dannosi noti, i rilevamenti dei motori e
gli indicatori di reputazione che completano la revisione di ClawHub orientata agli agenti. Quando sono
disponibili i conteggi dei motori dei fornitori, l'audit li riassume in un linguaggio semplice, ad
esempio:

```text
62/62 fornitori hanno contrassegnato questa skill come sicura.
```

oppure:

```text
2/64 fornitori hanno contrassegnato questa skill come dannosa, 1/64 come sospetta e 61/64 come sicura.
```

Quando ClawHub non dispone di telemetria sui conteggi dei fornitori da riepilogare, l'audit indica:

```text
Nessun rilievo di VirusTotal
```

VirusTotal rimane una fonte di telemetria. Non sostituisce l'analisi del rischio di ClawHub
basata sugli artefatti.

## Analisi del rischio

L'analisi del rischio è gestita internamente da ClawScan, il sistema di audit di sicurezza
proprietario di ClawHub. Esamina ogni release come artefatto destinato agli agenti: istruzioni,
metadati, autorizzazioni dichiarate, file, indicatori delle funzionalità, indicatori della scansione statica,
rilievi di SkillSpector, telemetria di VirusTotal e contesto fornito dall'editore.
Gli indicatori della scansione statica costituiscono un contesto interno per questa revisione; non sono una
sezione pubblica autonoma dell'audit né un verdetto che impedisce l'installazione.

L'analisi del rischio utilizza la
[Top 10 OWASP per le Skills agentiche](https://owasp.org/www-project-agentic-skills-top-10/)
come riferimento per rischi quali l'iniezione di prompt, l'uso improprio degli strumenti, l'esposizione delle credenziali,
l'esecuzione non sicura, l'avvelenamento della memoria o del contesto e l'autonomia eccessiva.

ClawScan non considera automaticamente dannosa una funzionalità dall'aspetto allarmante.
Valuta se la funzionalità sia dichiarata, coerente con lo scopo e supportata
dal caso d'uso dichiarato della release.
