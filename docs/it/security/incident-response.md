---
read_when:
    - Rispondere a una segnalazione di sicurezza o a un sospetto incidente di sicurezza
    - Preparazione di una divulgazione coordinata o di una release di sicurezza con patch
    - Revisione delle aspettative relative alle azioni successive all'incidente
summary: Come OpenClaw valuta, risponde e dà seguito agli incidenti di sicurezza
title: Risposta agli incidenti
x-i18n:
    generated_at: "2026-05-03T21:43:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef39b037cf3574a61fd67b356654f1ea0b91d84f89345c22aae93c1db7694df8
    source_path: security/incident-response.md
    workflow: 16
---

# Risposta agli incidenti

## 1. Rilevamento e triage

Monitoriamo i segnali di sicurezza da:

- GitHub Security Advisories (GHSA) e segnalazioni private di vulnerabilità.
- Issue/discussioni pubbliche su GitHub quando le segnalazioni non sono sensibili.
- Segnali automatizzati (ad esempio Dependabot, CodeQL, avvisi npm e scansione dei segreti).

Triage iniziale:

1. Confermare il componente interessato, la versione e l'impatto sul perimetro di fiducia.
2. Classificare come problema di sicurezza o come hardening/nessuna azione usando l'ambito e le regole fuori ambito del repository `SECURITY.md`.
3. Un responsabile dell'incidente risponde di conseguenza.

## 2. Valutazione

Guida alla gravità:

- **Critica:** Compromissione del pacchetto/della release/del repository, sfruttamento attivo o bypass non autenticato del perimetro di fiducia con controllo ad alto impatto o esposizione dei dati.
- **Alta:** Bypass verificato del perimetro di fiducia che richiede precondizioni limitate (ad esempio azione autenticata ma non autorizzata ad alto impatto), oppure esposizione di credenziali sensibili di proprietà di OpenClaw.
- **Media:** Debolezza di sicurezza significativa con impatto pratico ma sfruttabilità limitata o prerequisiti sostanziali.
- **Bassa:** Riscontri di difesa in profondità, denial-of-service con ambito ristretto o lacune di hardening/parità senza un bypass dimostrato del perimetro di fiducia.

## 3. Risposta

1. Confermare la ricezione al segnalatore (in privato quando la segnalazione è sensibile).
2. Riprodurre sulle release supportate e sull'ultimo `main`, quindi implementare e convalidare una patch con copertura di regressione.
3. Per incidenti critici/alti, preparare le release corrette il più rapidamente possibile.
4. Per incidenti medi/bassi, applicare la patch nel normale flusso di release e documentare le indicazioni di mitigazione.

## 4. Comunicazione

Comunichiamo tramite:

- GitHub Security Advisories nel repository interessato.
- Note di release/voci del changelog per le versioni corrette.
- Follow-up diretto con il segnalatore su stato e risoluzione.

Politica di divulgazione:

- Gli incidenti critici/alti dovrebbero ricevere una divulgazione coordinata, con emissione di CVE quando appropriato.
- I riscontri di hardening a basso rischio possono essere documentati nelle note di release o negli avvisi senza CVE, a seconda dell'impatto e dell'esposizione degli utenti.

## 5. Ripristino e follow-up

Dopo aver distribuito la correzione:

1. Verificare le mitigazioni in CI e negli artefatti di release.
2. Eseguire una breve revisione post-incidente (cronologia, causa radice, lacuna di rilevamento, piano di prevenzione).
3. Aggiungere attività di follow-up per hardening/test/documentazione e tracciarle fino al completamento.
