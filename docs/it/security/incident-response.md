---
read_when:
    - Rispondere a una segnalazione di sicurezza o a un presunto incidente di sicurezza
    - Preparare una divulgazione coordinata o un rilascio di sicurezza con correzioni
    - Revisione delle aspettative per le azioni successive all'incidente
summary: Come OpenClaw esegue il triage, risponde e dà seguito agli incidenti di sicurezza
title: Risposta agli incidenti
x-i18n:
    generated_at: "2026-05-06T09:08:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 546b69242fc4674e3d27e79e4c7b5cfecb83bcb17e8edb2a4b62f1a7498fb84f
    source_path: security/incident-response.md
    workflow: 16
---

## 1. Rilevamento e triage

Monitoriamo i segnali di sicurezza da:

- Avvisi di sicurezza di GitHub (GHSA) e segnalazioni private di vulnerabilità.
- Issue/discussioni pubbliche su GitHub quando le segnalazioni non sono sensibili.
- Segnali automatizzati (per esempio Dependabot, CodeQL, avvisi npm e scansione dei segreti).

Triage iniziale:

1. Confermare componente, versione e impatto sul perimetro di fiducia interessati.
2. Classificare come problema di sicurezza rispetto a rafforzamento/nessuna azione usando l'ambito e le regole di esclusione dall'ambito del repository `SECURITY.md`.
3. Un responsabile dell'incidente risponde di conseguenza.

## 2. Valutazione

Guida alla gravità:

- **Critica:** Compromissione di pacchetto/rilascio/repository, sfruttamento attivo o bypass non autenticato del perimetro di fiducia con controllo ad alto impatto o esposizione di dati.
- **Alta:** Bypass verificato del perimetro di fiducia che richiede precondizioni limitate (per esempio azione autenticata ma non autorizzata ad alto impatto), oppure esposizione di credenziali sensibili di proprietà di OpenClaw.
- **Media:** Debolezza di sicurezza significativa con impatto pratico ma sfruttabilità limitata o prerequisiti sostanziali.
- **Bassa:** Risultati di difesa in profondità, denial-of-service con ambito ristretto o lacune di rafforzamento/parità senza un bypass dimostrato del perimetro di fiducia.

## 3. Risposta

1. Confermare la ricezione al segnalatore (in privato quando sensibile).
2. Riprodurre sulle release supportate e sull'ultimo `main`, quindi implementare e convalidare una patch con copertura di regressione.
3. Per incidenti critici/alti, preparare le release corrette il più rapidamente possibile.
4. Per incidenti medi/bassi, correggere nel normale flusso di release e documentare le indicazioni di mitigazione.

## 4. Comunicazione

Comunichiamo tramite:

- Avvisi di sicurezza di GitHub nel repository interessato.
- Note di release/voci del changelog per le versioni corrette.
- Follow-up diretto con il segnalatore su stato e risoluzione.

Politica di divulgazione:

- Gli incidenti critici/alti devono ricevere divulgazione coordinata, con emissione di CVE quando appropriato.
- I risultati di rafforzamento a basso rischio possono essere documentati nelle note di release o negli avvisi senza CVE, a seconda dell'impatto e dell'esposizione degli utenti.

## 5. Ripristino e follow-up

Dopo aver distribuito la correzione:

1. Verificare le mitigazioni in CI e negli artefatti di release.
2. Eseguire una breve revisione post-incidente (cronologia, causa radice, lacuna di rilevamento, piano di prevenzione).
3. Aggiungere attività di follow-up per rafforzamento/test/documentazione e monitorarle fino al completamento.
