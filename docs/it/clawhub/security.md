---
read_when:
    - Segnalare un problema di sicurezza di ClawHub
    - Comprendere la divulgazione delle vulnerabilità di ClawHub
    - Distinguere i problemi della piattaforma ClawHub dai problemi di Skills o Plugin di terze parti
sidebarTitle: Security
summary: Come segnalare problemi di sicurezza di ClawHub e quando le vulnerabilità vengono divulgate pubblicamente.
title: Sicurezza
x-i18n:
    generated_at: "2026-07-03T17:25:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Sicurezza

I problemi di sicurezza di ClawHub possono essere segnalati tramite GitHub Security Advisories per
`openclaw/clawhub`.

Usa GitHub Security Advisories per le vulnerabilità in ClawHub stesso. Le buone
segnalazioni di advisory per ClawHub includono bug in:

- il sito web, l'API o la CLI di ClawHub
- pubblicazione nel registro, download, installazioni o integrità degli artefatti
- autenticazione, autorizzazione o token API
- scansione, moderazione o gestione delle segnalazioni

Non usare gli advisory di ClawHub per vulnerabilità nel codice sorgente proprio di una skill o
Plugin di terze parti. Segnalale direttamente all'editore o al repository sorgente
collegato dalla scheda di ClawHub.

## Divulgazione delle vulnerabilità

Poiché ClawHub è un'applicazione cloud ospitata, le vulnerabilità del servizio ClawHub
non vengono divulgate pubblicamente per impostazione predefinita. Vengono divulgate pubblicamente quando esistono
prove di un impatto reale sugli utenti o quando gli utenti devono intraprendere un'azione.

Esempi di impatto reale sugli utenti includono sfruttamento confermato, esposizione di dati o segreti
degli utenti, contenuti dannosi che raggiungono gli utenti a causa di un errore della piattaforma,
o qualsiasi problema che richieda agli utenti di ruotare le credenziali, aggiornare software locale o
intraprendere altre azioni protettive.

Le vulnerabilità nel software installato dagli utenti vengono divulgate pubblicamente, come
pacchetti CLI di ClawHub, binari, librerie o altri artefatti di rilascio che gli utenti
devono aggiornare localmente.

## Pagine correlate

Per etichette di audit in fase di installazione, livelli di rischio, risultati e interpretazione, consulta
[Audit di sicurezza](/clawhub/security-audits).

Per segnalazioni del marketplace, blocchi di moderazione, schede nascoste, ban e stato
dell'account, consulta [Moderazione e sicurezza dell'account](/clawhub/moderation).
