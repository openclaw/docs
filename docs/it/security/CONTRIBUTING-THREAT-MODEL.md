---
read_when:
    - Vuoi contribuire con risultati di sicurezza o scenari di minaccia
    - Revisione o aggiornamento del modello di minaccia
summary: Come contribuire al modello di minaccia di OpenClaw
title: Contribuire al modello di minaccia
x-i18n:
    generated_at: "2026-04-24T09:01:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 21cf130c2d8641b66b87de86a3ea718cd7c751c29ed9bf5e0bd76b43d65d0964
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Contribuire al modello di minaccia di OpenClaw

Grazie per aiutare a rendere OpenClaw più sicuro. Questo modello di minaccia è un documento vivo e accogliamo contributi da chiunque - non è necessario essere esperti di sicurezza.

## Modi per contribuire

### Aggiungi una minaccia

Hai individuato un vettore di attacco o un rischio che non abbiamo coperto? Apri una issue su [openclaw/trust](https://github.com/openclaw/trust/issues) e descrivilo con parole tue. Non devi conoscere framework o compilare ogni campo - descrivi semplicemente lo scenario.

**Utile da includere (ma non obbligatorio):**

- Lo scenario di attacco e come potrebbe essere sfruttato
- Quali parti di OpenClaw sono coinvolte (CLI, gateway, canali, ClawHub, server MCP, ecc.)
- Quanto pensi sia grave (low / medium / high / critical)
- Eventuali link a ricerche correlate, CVE o esempi reali

Ci occuperemo noi della mappatura ATLAS, degli ID di minaccia e della valutazione del rischio durante la review. Se vuoi includere questi dettagli, ottimo - ma non è previsto.

> **Questo serve per aggiungere elementi al modello di minaccia, non per segnalare vulnerabilità live.** Se hai trovato una vulnerabilità sfruttabile, consulta la nostra [Trust page](https://trust.openclaw.ai) per le istruzioni sulla responsible disclosure.

### Suggerisci una mitigazione

Hai un'idea su come affrontare una minaccia esistente? Apri una issue o una PR facendo riferimento alla minaccia. Le mitigazioni utili sono specifiche e attuabili - ad esempio, "rate limiting per mittente di 10 messaggi/minuto sul gateway" è meglio di "implementare rate limiting".

### Proponi una catena di attacco

Le catene di attacco mostrano come più minacce si combinano in uno scenario di attacco realistico. Se vedi una combinazione pericolosa, descrivi i passaggi e come un attaccante li concatenerebbe. Una breve narrazione di come l'attacco si sviluppa nella pratica è più preziosa di un template formale.

### Correggi o migliora contenuti esistenti

Refusi, chiarimenti, informazioni obsolete, esempi migliori - le PR sono benvenute, non serve aprire prima una issue.

## Cosa usiamo

### MITRE ATLAS

Questo modello di minaccia si basa su [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), un framework progettato specificamente per minacce AI/ML come prompt injection, uso improprio degli strumenti e sfruttamento degli agenti. Non devi conoscere ATLAS per contribuire - mappiamo noi i contributi al framework durante la review.

### ID di minaccia

Ogni minaccia riceve un ID come `T-EXEC-003`. Le categorie sono:

| Codice  | Categoria                                  |
| ------- | ------------------------------------------ |
| RECON   | Ricognizione - raccolta di informazioni    |
| ACCESS  | Accesso iniziale - ottenimento dell'accesso |
| EXEC    | Esecuzione - esecuzione di azioni malevole |
| PERSIST | Persistenza - mantenimento dell'accesso    |
| EVADE   | Evasione delle difese - evitare il rilevamento |
| DISC    | Discovery - apprendimento dell'ambiente    |
| EXFIL   | Esfiltrazione - furto di dati              |
| IMPACT  | Impatto - danno o interruzione             |

Gli ID vengono assegnati dai maintainer durante la review. Non devi sceglierne uno.

### Livelli di rischio

| Livello      | Significato                                                        |
| ------------ | ------------------------------------------------------------------ |
| **Critical** | Compromissione completa del sistema, oppure alta probabilità + impatto critico |
| **High**     | Danno significativo probabile, oppure probabilità media + impatto critico |
| **Medium**   | Rischio moderato, oppure bassa probabilità + alto impatto          |
| **Low**      | Improbabile e con impatto limitato                                 |

Se non sei sicuro del livello di rischio, descrivi semplicemente l'impatto e lo valuteremo noi.

## Processo di review

1. **Triage** - Esaminiamo i nuovi contributi entro 48 ore
2. **Assessment** - Verifichiamo la fattibilità, assegniamo mappatura ATLAS e ID di minaccia, validiamo il livello di rischio
3. **Documentation** - Ci assicuriamo che tutto sia formattato correttamente e completo
4. **Merge** - Aggiunta al modello di minaccia e alla visualizzazione

## Risorse

- [ATLAS Website](https://atlas.mitre.org/)
- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [OpenClaw Threat Model](/it/security/THREAT-MODEL-ATLAS)

## Contatti

- **Vulnerabilità di sicurezza:** consulta la nostra [Trust page](https://trust.openclaw.ai) per le istruzioni di segnalazione
- **Domande sul modello di minaccia:** apri una issue su [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Chat generale:** canale Discord #security

## Riconoscimenti

I contributori al modello di minaccia vengono riconosciuti nei ringraziamenti del modello di minaccia, nelle note di rilascio e nella hall of fame della sicurezza di OpenClaw per contributi significativi.

## Correlati

- [Threat model](/it/security/THREAT-MODEL-ATLAS)
- [Formal verification](/it/security/formal-verification)
