---
read_when:
    - Segnalazione di un problema di sicurezza di ClawHub
    - Comprendere la divulgazione delle vulnerabilità di ClawHub
    - Distinguere i problemi della piattaforma ClawHub dai problemi di Skills o Plugin di terze parti
sidebarTitle: Security
summary: Come segnalare problemi di sicurezza di ClawHub e quando le vulnerabilità vengono divulgate pubblicamente.
title: Sicurezza
x-i18n:
    generated_at: "2026-07-12T06:53:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Sicurezza

I problemi di sicurezza di ClawHub possono essere segnalati tramite gli avvisi di sicurezza di GitHub per
`openclaw/clawhub`.

Utilizza gli avvisi di sicurezza di GitHub per le vulnerabilità di ClawHub stesso. Le segnalazioni
di vulnerabilità ClawHub ben formulate includono bug relativi a:

- il sito web, l'API o la CLI di ClawHub
- la pubblicazione nel registro, i download, le installazioni o l'integrità degli artefatti
- l'autenticazione, l'autorizzazione o i token API
- la scansione, la moderazione o la gestione delle segnalazioni

Non utilizzare gli avvisi di ClawHub per le vulnerabilità nel codice sorgente di una Skill o di un
Plugin di terze parti. Segnalale direttamente all'editore o al repository
del codice sorgente indicato nella scheda di ClawHub.

## Divulgazione delle vulnerabilità

Poiché ClawHub è un'applicazione cloud ospitata, per impostazione predefinita le vulnerabilità
del servizio ClawHub non vengono divulgate pubblicamente. Vengono divulgate pubblicamente quando vi sono
prove di un impatto reale sugli utenti o quando gli utenti devono intervenire.

Esempi di impatto reale sugli utenti includono lo sfruttamento confermato, l'esposizione di dati
o segreti degli utenti, contenuti dannosi che raggiungono gli utenti a causa di un malfunzionamento della piattaforma
o qualsiasi problema che richieda agli utenti di sostituire le credenziali, aggiornare il software locale o
adottare altre misure di protezione.

Le vulnerabilità nel software installato dagli utenti vengono divulgate pubblicamente, come quelle relative a
pacchetti della CLI di ClawHub, file binari, librerie o altri artefatti di rilascio che gli utenti
devono aggiornare localmente.

## Pagine correlate

Per le etichette di controllo durante l'installazione, i livelli di rischio, i risultati e la relativa interpretazione, consulta
[Controlli di sicurezza](/clawhub/security-audits).

Per le segnalazioni del marketplace, le sospensioni per moderazione, le schede nascoste, i ban e lo stato
dell'account, consulta [Moderazione e sicurezza dell'account](/it/clawhub/moderation).
