---
read_when:
    - Vuoi contribuire con risultati di sicurezza o scenari di minaccia
    - Stai revisionando o aggiornando il threat model
summary: Come contribuire al threat model di OpenClaw
title: Contribuire al Threat Model
x-i18n:
    generated_at: "2026-04-05T14:03:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd212d456571a25da63031588d3b584bdfc119e2096b528b97a3f7ec5e4b3db
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 15
---

# Contribuire al Threat Model di OpenClaw

Grazie per aiutare a rendere OpenClaw più sicuro. Questo threat model è un documento vivo e accogliamo con favore i contributi di chiunque: non è necessario essere esperti di sicurezza.

## Modi per contribuire

### Aggiungere una minaccia

Hai individuato un vettore di attacco o un rischio che non abbiamo coperto? Apri una issue su [openclaw/trust](https://github.com/openclaw/trust/issues) e descrivila con parole tue. Non devi conoscere framework specifici né compilare ogni campo: basta descrivere lo scenario.

**È utile includere (ma non è obbligatorio):**

- Lo scenario di attacco e come potrebbe essere sfruttato
- Quali parti di OpenClaw sono coinvolte (CLI, gateway, canali, ClawHub, server MCP, ecc.)
- Quanto pensi che sia grave (low / medium / high / critical)
- Eventuali link a ricerche correlate, CVE o esempi del mondo reale

Ci occuperemo noi della mappatura ATLAS, degli ID delle minacce e della valutazione del rischio durante la revisione. Se vuoi includere anche questi dettagli, ottimo, ma non è richiesto.

> **Questo serve per aggiungere elementi al threat model, non per segnalare vulnerabilità attive.** Se hai trovato una vulnerabilità sfruttabile, consulta la nostra [pagina Trust](https://trust.openclaw.ai) per le istruzioni sulla responsible disclosure.

### Suggerire una mitigazione

Hai un'idea su come affrontare una minaccia esistente? Apri una issue o una PR facendo riferimento alla minaccia. Le mitigazioni utili sono specifiche e attuabili: per esempio, "rate limiting per mittente di 10 messaggi/minuto al gateway" è meglio di "implementare rate limiting".

### Proporre una catena di attacco

Le catene di attacco mostrano come più minacce si combinano in uno scenario di attacco realistico. Se vedi una combinazione pericolosa, descrivi i passaggi e come un attaccante li concatenerebbe. Un breve racconto di come l'attacco si sviluppa nella pratica è più prezioso di un template formale.

### Correggere o migliorare il contenuto esistente

Refusi, chiarimenti, informazioni obsolete, esempi migliori: le PR sono benvenute, senza bisogno di aprire una issue.

## Cosa usiamo

### MITRE ATLAS

Questo threat model si basa su [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), un framework progettato specificamente per minacce AI/ML come prompt injection, uso improprio degli strumenti e sfruttamento degli agenti. Non serve conoscere ATLAS per contribuire: durante la revisione mappiamo noi i contributi sul framework.

### ID delle minacce

Ogni minaccia riceve un ID come `T-EXEC-003`. Le categorie sono:

| Codice  | Categoria                                   |
| ------- | ------------------------------------------- |
| RECON   | Ricognizione - raccolta di informazioni     |
| ACCESS  | Accesso iniziale - ottenere ingresso        |
| EXEC    | Esecuzione - eseguire azioni malevole       |
| PERSIST | Persistenza - mantenere l'accesso           |
| EVADE   | Elusione delle difese - evitare il rilevamento |
| DISC    | Scoperta - conoscere l'ambiente             |
| EXFIL   | Esfiltrazione - sottrarre dati              |
| IMPACT  | Impatto - danno o interruzione              |

Gli ID vengono assegnati dai maintainer durante la revisione. Non devi sceglierne uno.

### Livelli di rischio

| Livello      | Significato                                                       |
| ------------ | ----------------------------------------------------------------- |
| **Critical** | Compromissione completa del sistema, oppure alta probabilità + impatto critico |
| **High**     | Danno significativo probabile, oppure probabilità media + impatto critico |
| **Medium**   | Rischio moderato, oppure bassa probabilità + alto impatto         |
| **Low**      | Improbabile e con impatto limitato                                |

Se non sei sicuro del livello di rischio, descrivi semplicemente l'impatto e lo valuteremo noi.

## Processo di revisione

1. **Triage** - Esaminiamo i nuovi contributi entro 48 ore
2. **Valutazione** - Verifichiamo la fattibilità, assegniamo la mappatura ATLAS e l'ID della minaccia, validiamo il livello di rischio
3. **Documentazione** - Ci assicuriamo che tutto sia formattato correttamente e completo
4. **Merge** - Aggiunta al threat model e alla visualizzazione

## Risorse

- [Sito web ATLAS](https://atlas.mitre.org/)
- [Tecniche ATLAS](https://atlas.mitre.org/techniques/)
- [Case study ATLAS](https://atlas.mitre.org/studies/)
- [Threat Model di OpenClaw](/security/THREAT-MODEL-ATLAS)

## Contatti

- **Vulnerabilità di sicurezza:** consulta la nostra [pagina Trust](https://trust.openclaw.ai) per le istruzioni di segnalazione
- **Domande sul threat model:** apri una issue su [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Chat generale:** canale Discord #security

## Riconoscimento

I contributori al threat model vengono riconosciuti nei ringraziamenti del threat model, nelle note di rilascio e nella hall of fame della sicurezza di OpenClaw per i contributi significativi.
