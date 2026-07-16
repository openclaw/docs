---
read_when:
    - Comprendere i risultati dell'audit di sicurezza di ClawHub
    - Decidere se installare una skill o un plugin
    - Spiegazione dello stato dell’audit, del livello di rischio o dei risultati di ClawHub
sidebarTitle: Security Audits
summary: Come interpretare i risultati dell’audit di sicurezza di ClawHub prima di installare una skill o un plugin.
title: Audit di sicurezza
x-i18n:
    generated_at: "2026-07-16T14:11:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c4178a568c9b8e202da666ed95d2200ad73f931a22c7e473aeaba84545e8bb25
    source_path: clawhub/security-audits.md
    workflow: 16
---

# Audit di sicurezza

Gli audit di sicurezza di ClawHub aiutano a decidere se una skill o un plugin è sufficientemente sicuro
da installare. Mostrano cosa fa una release, quali autorizzazioni richiede e
se vi sono aspetti che meritano ulteriore attenzione prima che possa accedere a file, account,
credenziali, codice o servizi esterni.

Gli audit costituiscono importanti indicatori di sicurezza, ma non garantiscono che una release sia
priva di rischi. Valutare sempre con attenzione prima di concedere accessi sensibili.

Vedere anche [Sicurezza](/clawhub/security), [Utilizzo accettabile](/it/clawhub/acceptable-usage)
e [Moderazione e sicurezza dell'account](/clawhub/moderation).

## Cosa verificare prima dell'installazione

Prima dell'installazione, esaminare:

- lo stato complessivo dell'audit
- il livello di rischio
- tutti i risultati elencati
- le credenziali, le autorizzazioni o le variabili d'ambiente richieste
- il proprietario, l'origine, la versione, il changelog, i download, le stelle e altri indicatori di affidabilità

Installare solo contenuti che si comprendono e di cui ci si fida.

## Stato dell'audit

Lo stato dell'audit indica come reagire al relativo risultato:

| Stato      | Significato                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| `Pass`      | Non è stato rilevato alcun problema visibile superiore al rischio basso.                                |
| `Review`    | Leggere i risultati prima dell'installazione. La release potrebbe comunque essere legittima. |
| `Warn`      | Prestare particolare attenzione. ClawHub ha rilevato un problema ad alto impatto o un segnale di allarme. |
| `Malicious` | Non installare.                                                           |
| `Pending`   | Gli audit non sono ancora terminati.                                             |
| `Error`     | Non è stato possibile completare l'audit.                                         |

Un `Pass` è rassicurante, ma non sostituisce una valutazione personale. Questo aspetto è
particolarmente importante per gli strumenti che possono pubblicare contenuti, modificare dati, eseguire comandi, leggere file o
accedere a sistemi di produzione.

## Livello di rischio

Il livello di rischio descrive il raggio d'impatto: quanto potere sembra avere la release se
viene utilizzata come previsto.

| Livello di rischio | Significato                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `Low`      | È stata rilevata un'autorità sensibile o un'incidenza sull'utente minima.                          |
| `Medium`   | La release dispone di un'autorità significativa, come l'accesso all'account o la modifica dei dati. |
| `High`     | La release dispone di un'autorità ad alto impatto, presenta risultati gravi o segnali dannosi. |

Il livello di rischio e lo stato dell'audit rispondono a domande diverse:

- Il livello di rischio chiede: "Quanto potere è presente?"
- Lo stato dell'audit chiede: "Cosa si deve fare con questo risultato?"

Ad esempio, una skill di pubblicazione può mostrare `Review` con rischio `Medium`. Ciò
non significa che sia dannosa. Significa che la skill appare coerente con il proprio scopo, ma può
agire con un'autorità significativa sull'account.

## Risultati

I risultati spiegano perché è stato mostrato un determinato esito dell'audit. Ogni risultato solitamente include:

- cosa significa
- perché è stato segnalato
- il contenuto pertinente della skill o del plugin
- una raccomandazione

I risultati possono essere classificati come `Info`, `Low`, `Medium`, `High` o `Critical`. I risultati di
maggiore gravità incidono più fortemente sul livello di rischio e sullo stato dell'audit.

I risultati con un basso livello di attendibilità sono nascosti dal riepilogo pubblico dell'audit affinché la pagina
rimanga incentrata su elementi utili.

## Cosa verifica ClawHub

ClawHub sottopone ad audit gli artefatti delle release inviate, tra cui:

- le istruzioni della skill o i metadati del plugin
- le variabili d'ambiente e le autorizzazioni dichiarate
- le istruzioni di installazione e i metadati del pacchetto
- i file inclusi e i manifest dei file
- i metadati relativi a compatibilità e funzionalità

La domanda principale riguarda la coerenza: il nome, il riepilogo, i metadati, l'autorità richiesta
e il contenuto effettivo corrispondono a ciò che gli utenti potrebbero ragionevolmente aspettarsi?

Un comportamento potente non è automaticamente negativo. Molti strumenti utili richiedono credenziali,
comandi locali, API dei provider o installazioni di pacchetti. L'audit verifica se tale
potere è previsto, dichiarato e proporzionato.

Le pagine degli artefatti rimandano all'audit completo all'indirizzo:

```text
/<owner>/skills/<slug>/security-audit
```

La pagina dell'audit combina:

1. SkillSpector
2. VirusTotal
3. Analisi dei rischi

## VirusTotal

ClawHub utilizza VirusTotal come telemetria antimalware nello stack di audit. VirusTotal è uno
standard di settore affidabile per la reputazione dei file e la scansione antimalware, e la nostra
collaborazione consente a ClawHub di aggiungere informazioni di sicurezza più ampie alla revisione di skill e plugin.

VirusTotal è particolarmente utile per gli artefatti dannosi noti, i rilevamenti dei motori e
gli indicatori di reputazione che integrano la revisione di ClawHub orientata agli agenti. Quando
sono disponibili i conteggi dei motori dei fornitori, l'audit li riassume con un linguaggio semplice, ad
esempio:

```text
62/62 fornitori hanno contrassegnato questa skill come sicura.
```

oppure:

```text
2/64 fornitori hanno contrassegnato questa skill come dannosa, 1/64 come sospetta e 61/64 come sicura.
```

Quando ClawHub non dispone di dati telemetrici sui conteggi dei fornitori da riepilogare, l'audit indica:

```text
Nessun risultato di VirusTotal
```

VirusTotal rimane una fonte di telemetria. Non sostituisce l'analisi dei rischi di ClawHub
basata sugli artefatti.

## Analisi dei rischi

L'analisi dei rischi è gestita internamente da ClawScan, il sistema di audit di sicurezza
proprietario di ClawHub. Esamina ogni release come un artefatto destinato agli agenti: istruzioni,
metadati, autorizzazioni dichiarate, file, indicatori di funzionalità, segnali di scansione statica,
risultati di SkillSpector, telemetria di VirusTotal e contesto fornito dall'editore.
I segnali di scansione statica costituiscono un contesto interno per questa revisione; non rappresentano una
sezione pubblica autonoma dell'audit né un verdetto che blocca l'installazione.

L'analisi dei rischi utilizza la
[Top 10 OWASP per le skill agentiche](https://owasp.org/www-project-agentic-skills-top-10/)
come riferimento per rischi quali prompt injection, uso improprio degli strumenti, esposizione delle credenziali,
esecuzione non sicura, avvelenamento della memoria o del contesto e autonomia eccessiva.

ClawScan non considera automaticamente dannosa una funzionalità dall'aspetto preoccupante.
Verifica se la funzionalità è dichiarata, coerente con lo scopo e supportata
dal caso d'uso dichiarato della release.
