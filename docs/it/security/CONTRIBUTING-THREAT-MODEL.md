---
read_when:
    - Vuoi contribuire con segnalazioni di sicurezza o scenari di minaccia
    - Revisione o aggiornamento del modello delle minacce
summary: Come contribuire al modello delle minacce di OpenClaw
title: Contribuire al modello delle minacce
x-i18n:
    generated_at: "2026-07-12T07:30:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

Il [modello delle minacce](/it/security/THREAT-MODEL-ATLAS) è un documento in continua evoluzione. I contributi sono benvenuti da parte di chiunque; non è necessaria alcuna esperienza in sicurezza o con MITRE ATLAS.

<Note>
Queste istruzioni servono per aggiungere contenuti al modello delle minacce, non per segnalare vulnerabilità attive. Se hai individuato una vulnerabilità sfruttabile, segui invece le istruzioni per la divulgazione responsabile nella [pagina Trust](https://trust.openclaw.ai).
</Note>

## Come contribuire

**Aggiungere una minaccia.** Apri una segnalazione su [openclaw/trust](https://github.com/openclaw/trust/issues) descrivendo lo scenario di attacco con parole tue. È utile, ma non obbligatorio, includere:

- Lo scenario di attacco e il modo in cui potrebbe essere sfruttato.
- I componenti interessati (CLI, Gateway, canali, ClawHub, server MCP e così via).
- La tua stima della gravità (bassa / media / alta / critica).
- Collegamenti a ricerche correlate, CVE o esempi reali.

Durante la revisione, i maintainer assegnano la mappatura ATLAS, l'ID della minaccia e il livello di rischio.

**Suggerire una mitigazione.** Apri una segnalazione o una PR che faccia riferimento alla minaccia. Formula una proposta specifica e attuabile: «limitazione della frequenza per mittente a 10 messaggi/minuto nel Gateway» è più utile di «implementare la limitazione della frequenza».

**Proporre una catena di attacco.** Le catene di attacco mostrano come più minacce possano combinarsi in uno scenario realistico. Descrivi i passaggi e il modo in cui un attaccante li concatenerebbe; una breve narrazione è preferibile a un modello formale.

**Correggere o migliorare i contenuti esistenti.** Refusi, chiarimenti, informazioni obsolete, esempi migliori: le PR sono benvenute e non è necessario aprire prima una segnalazione.

## Riferimento al framework

Le minacce sono mappate su [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), un framework per minacce specifiche dell'IA e del machine learning, come l'iniezione di prompt, l'uso improprio degli strumenti e lo sfruttamento degli agenti. Non è necessario conoscere ATLAS per contribuire; durante la revisione, i maintainer mappano i contributi ricevuti.

**ID delle minacce.** A ogni minaccia viene assegnato un ID come `T-EXEC-003` dai maintainer durante la revisione.

| Codice  | Categoria                                        |
| ------- | ------------------------------------------------ |
| RECON   | Ricognizione - raccolta di informazioni          |
| ACCESS  | Accesso iniziale - ottenimento dell'accesso       |
| EXEC    | Esecuzione - esecuzione di azioni dannose         |
| PERSIST | Persistenza - mantenimento dell'accesso           |
| EVADE   | Elusione delle difese - evitare il rilevamento    |
| DISC    | Individuazione - conoscenza dell'ambiente         |
| EXFIL   | Esfiltrazione - furto di dati                     |
| IMPACT  | Impatto - danni o interruzioni                    |

**Livelli di rischio.** Se non sai quale livello indicare, descrivi semplicemente l'impatto; saranno i maintainer a valutarlo.

| Livello      | Significato                                                               |
| ------------ | ------------------------------------------------------------------------- |
| **Critico**  | Compromissione completa del sistema oppure alta probabilità + impatto critico |
| **Alto**     | Danni significativi probabili oppure probabilità media + impatto critico  |
| **Medio**    | Rischio moderato oppure bassa probabilità + impatto elevato               |
| **Basso**    | Improbabile e con impatto limitato                                        |

## Processo di revisione

1. **Valutazione preliminare** - i nuovi contributi vengono esaminati entro 48 ore.
2. **Valutazione** - i maintainer verificano la fattibilità, assegnano la mappatura ATLAS e l'ID della minaccia e convalidano il livello di rischio.
3. **Documentazione** - verifica della formattazione e della completezza.
4. **Integrazione** - il contributo viene aggiunto al modello delle minacce e alla visualizzazione.

## Risorse

- [Sito web di ATLAS](https://atlas.mitre.org/)
- [Tecniche ATLAS](https://atlas.mitre.org/techniques/)
- [Casi di studio ATLAS](https://atlas.mitre.org/studies/)

## Contatti

- **Vulnerabilità di sicurezza:** consulta la [pagina Trust](https://trust.openclaw.ai) per le istruzioni di segnalazione oppure scrivi a `security@openclaw.ai`.
- **Domande sul modello delle minacce:** apri una segnalazione su [openclaw/trust](https://github.com/openclaw/trust/issues).
- **Chat generale:** canale Discord `#security`.

## Riconoscimenti

Chi contribuisce al modello delle minacce viene menzionato nei ringraziamenti del modello, nelle note di rilascio e, per i contributi significativi, nella hall of fame della sicurezza di OpenClaw.

## Contenuti correlati

- [Modello delle minacce](/it/security/THREAT-MODEL-ATLAS)
- [Risposta agli incidenti](/it/security/incident-response)
- [Verifica formale](/it/security/formal-verification)
