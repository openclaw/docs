---
read_when:
    - Risposta a una segnalazione di sicurezza o a un sospetto incidente di sicurezza
    - Preparazione di una divulgazione coordinata o di una versione di sicurezza corretta
    - Revisione delle aspettative di follow-up successive all'incidente
summary: Come OpenClaw valuta, gestisce e monitora gli incidenti di sicurezza
title: Risposta agli incidenti
x-i18n:
    generated_at: "2026-07-12T07:30:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30f2d754408e95133ee86254ce193c0d8aab293040df55e0c1cec0c4d7644c56
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Rilevamento e valutazione

Le segnalazioni di sicurezza provengono da:

- Avvisi di sicurezza GitHub (GHSA) e segnalazioni private di vulnerabilità.
- Issue e discussioni pubbliche su GitHub quando le segnalazioni non contengono informazioni sensibili.
- Segnalazioni automatizzate: Dependabot, CodeQL, avvisi npm, scansione dei segreti.

Valutazione iniziale:

1. Confermare il componente e la versione interessati, nonché l'impatto sul confine di fiducia.
2. Classificare il caso come problema di sicurezza oppure come intervento di rafforzamento/nessun intervento, applicando le regole relative all'ambito e agli elementi esclusi dall'ambito definite in `SECURITY.md`.
3. Un responsabile dell'incidente interviene di conseguenza.

## 2. Gravità

| Gravità  | Definizione                                                                                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critica  | Compromissione di un pacchetto, di una versione o del repository, sfruttamento attivo oppure elusione non autenticata del confine di fiducia con controllo ad alto impatto o esposizione di dati.                                  |
| Alta     | Elusione verificata del confine di fiducia che richiede prerequisiti limitati (ad esempio, un'azione autenticata ma non autorizzata ad alto impatto), oppure esposizione di credenziali sensibili appartenenti a OpenClaw.          |
| Media    | Debolezza di sicurezza significativa con impatto concreto, ma con possibilità di sfruttamento limitata o prerequisiti sostanziali.                                                                                               |
| Bassa    | Problemi relativi alla difesa in profondità, attacchi denial-of-service con ambito ristretto oppure lacune di rafforzamento o uniformità senza un'elusione dimostrata del confine di fiducia.                                      |

## 3. Risposta

1. Confermare la ricezione della segnalazione all'autore, privatamente quando contiene informazioni sensibili.
2. Riprodurre il problema nelle versioni supportate e nell'ultima versione di `main`, quindi implementare e convalidare una correzione con test di regressione.
3. Gravità critica/alta: preparare le versioni corrette nel minor tempo ragionevolmente possibile.
4. Gravità media/bassa: integrare la correzione nel normale flusso di rilascio e documentare le indicazioni per la mitigazione.

## 4. Comunicazione e divulgazione

Comunicare tramite gli avvisi di sicurezza GitHub nel repository interessato, le note di rilascio o le voci del changelog per le versioni corrette e un contatto diretto con l'autore della segnalazione in merito allo stato e alla risoluzione.

Gli incidenti di gravità critica o alta prevedono una divulgazione coordinata, con l'assegnazione di un CVE quando opportuno. I problemi di rafforzamento a basso rischio possono essere documentati nelle note di rilascio o negli avvisi senza un CVE, a seconda dell'impatto e dell'esposizione degli utenti.

## 5. Ripristino e attività successive

Dopo il rilascio della correzione:

1. Verificare gli interventi correttivi nella CI e negli artefatti di rilascio.
2. Eseguire una breve analisi successiva all'incidente: cronologia, causa principale, lacuna nel rilevamento, piano di prevenzione.
3. Aggiungere attività successive di rafforzamento, test e documentazione e monitorarle fino al completamento.

## Contenuti correlati

- [Politica di sicurezza](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) — ambito delle segnalazioni e modello di fiducia.
- [Modello delle minacce](/it/security/THREAT-MODEL-ATLAS)
