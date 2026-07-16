---
read_when:
    - Segnalazione di un problema di sicurezza di ClawHub
    - Comprendere la divulgazione delle vulnerabilità di ClawHub
    - Distinguere i problemi della piattaforma ClawHub dai problemi di Skills o Plugin di terze parti
sidebarTitle: Security
summary: Come segnalare problemi di sicurezza di ClawHub e quando le vulnerabilità vengono divulgate pubblicamente.
title: Sicurezza
x-i18n:
    generated_at: "2026-07-16T13:58:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Sicurezza

I problemi di sicurezza di ClawHub possono essere segnalati tramite gli avvisi di sicurezza di GitHub per
`openclaw/clawhub`.

Utilizzare gli avvisi di sicurezza di GitHub per le vulnerabilità di ClawHub stesso. Le segnalazioni
appropriate per gli avvisi di ClawHub includono bug relativi a:

- il sito web, l'API o la CLI di ClawHub
- pubblicazione nel registro, download, installazioni o integrità degli artefatti
- autenticazione, autorizzazione o token API
- scansione, moderazione o gestione delle segnalazioni

Non utilizzare gli avvisi di ClawHub per le vulnerabilità presenti nel codice sorgente di una skill o
di un plugin di terze parti. Segnalarle direttamente all'editore o al repository
del codice sorgente indicato nella relativa pagina di ClawHub.

## Divulgazione delle vulnerabilità

Poiché ClawHub è un'applicazione cloud in hosting, per impostazione predefinita le vulnerabilità
del servizio ClawHub non vengono divulgate pubblicamente. Vengono divulgate pubblicamente quando vi sono
prove di un impatto reale sugli utenti o quando questi devono intraprendere azioni.

Esempi di impatto reale sugli utenti includono lo sfruttamento confermato, l'esposizione di dati
o segreti degli utenti, la distribuzione di contenuti dannosi agli utenti a causa di un malfunzionamento della piattaforma
o qualsiasi problema che richieda agli utenti di ruotare le credenziali, aggiornare il software locale o
adottare altre misure di protezione.

Le vulnerabilità nel software installato dagli utenti vengono divulgate pubblicamente, ad esempio quelle nei
pacchetti della CLI di ClawHub, nei file binari, nelle librerie o in altri artefatti di rilascio che gli utenti
devono aggiornare localmente.

## Pagine correlate

Per le etichette di controllo al momento dell'installazione, i livelli di rischio, i risultati e la relativa interpretazione, consultare
[Controlli di sicurezza](/clawhub/security-audits).

Per le segnalazioni del marketplace, le sospensioni per moderazione, le inserzioni nascoste, i divieti e lo stato
dell'account, consultare [Moderazione e sicurezza dell'account](/clawhub/moderation).
