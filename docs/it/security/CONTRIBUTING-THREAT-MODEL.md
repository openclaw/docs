---
read_when:
    - Vuoi contribuire con segnalazioni di sicurezza o scenari di minaccia
    - Revisione o aggiornamento del modello di minaccia
summary: Come contribuire al modello delle minacce di OpenClaw
title: Contribuire al modello delle minacce
x-i18n:
    generated_at: "2026-05-06T18:00:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a23ca088d7893180a83c02d6971bbf1c32affa724e43019fd40276eaadc52278
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Grazie per contribuire a rendere OpenClaw più sicuro. Questo modello delle minacce è un documento vivo e accogliamo contributi da chiunque - non serve essere esperti di sicurezza.

## Modi per contribuire

### Aggiungere una minaccia

Hai individuato un vettore di attacco o un rischio che non abbiamo coperto? Apri una issue su [openclaw/trust](https://github.com/openclaw/trust/issues) e descrivilo con parole tue. Non devi conoscere framework né compilare ogni campo - descrivi semplicemente lo scenario.

**Utile da includere (ma non obbligatorio):**

- Lo scenario di attacco e come potrebbe essere sfruttato
- Quali parti di OpenClaw sono interessate (CLI, Gateway, canali, ClawHub, server MCP, ecc.)
- Quanto pensi sia grave (basso / medio / alto / critico)
- Eventuali link a ricerche correlate, CVE o esempi reali

Ci occuperemo della mappatura ATLAS, degli ID delle minacce e della valutazione del rischio durante la revisione. Se vuoi includere questi dettagli, ottimo - ma non è richiesto.

> **Questo serve ad aggiungere elementi al modello delle minacce, non a segnalare vulnerabilità attive.** Se hai trovato una vulnerabilità sfruttabile, consulta la nostra [pagina Trust](https://trust.openclaw.ai) per le istruzioni sulla divulgazione responsabile.

### Suggerire una mitigazione

Hai un'idea su come affrontare una minaccia esistente? Apri una issue o una PR che faccia riferimento alla minaccia. Le mitigazioni utili sono specifiche e attuabili - per esempio, "limitazione della frequenza per mittente a 10 messaggi/minuto al Gateway" è meglio di "implementare la limitazione della frequenza".

### Proporre una catena di attacco

Le catene di attacco mostrano come più minacce si combinano in uno scenario di attacco realistico. Se vedi una combinazione pericolosa, descrivi i passaggi e come un attaccante li concatenerebbe. Una breve narrazione di come l'attacco si sviluppa nella pratica è più preziosa di un modello formale.

### Correggere o migliorare contenuti esistenti

Refusi, chiarimenti, informazioni obsolete, esempi migliori - le PR sono benvenute, non serve una issue.

## Cosa usiamo

### Framework MITRE ATLAS

Questo modello delle minacce è basato su [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems), un framework progettato specificamente per minacce AI/ML come prompt injection, uso improprio degli strumenti e sfruttamento degli agenti. Non devi conoscere ATLAS per contribuire - mappiamo le segnalazioni al framework durante la revisione.

### ID delle minacce

Ogni minaccia riceve un ID come `T-EXEC-003`. Le categorie sono:

| Codice  | Categoria                                 |
| ------- | ----------------------------------------- |
| RECON   | Ricognizione - raccolta di informazioni   |
| ACCESS  | Accesso iniziale - ottenere l'ingresso     |
| EXEC    | Esecuzione - eseguire azioni malevole      |
| PERSIST | Persistenza - mantenere l'accesso          |
| EVADE   | Elusione della difesa - evitare il rilevamento |
| DISC    | Scoperta - conoscere l'ambiente            |
| EXFIL   | Esfiltrazione - rubare dati                |
| IMPACT  | Impatto - danno o interruzione             |

Gli ID vengono assegnati dai manutentori durante la revisione. Non devi sceglierne uno.

### Livelli di rischio

| Livello      | Significato                                                       |
| ------------ | ----------------------------------------------------------------- |
| **Critico**  | Compromissione completa del sistema, oppure alta probabilità + impatto critico |
| **Alto**     | Danno significativo probabile, oppure probabilità media + impatto critico |
| **Medio**    | Rischio moderato, oppure bassa probabilità + alto impatto         |
| **Basso**    | Improbabile e con impatto limitato                                |

Se non sei sicuro del livello di rischio, descrivi semplicemente l'impatto e lo valuteremo noi.

## Processo di revisione

1. **Triage** - Esaminiamo le nuove segnalazioni entro 48 ore
2. **Valutazione** - Verifichiamo la fattibilità, assegniamo la mappatura ATLAS e l'ID della minaccia, convalidiamo il livello di rischio
3. **Documentazione** - Ci assicuriamo che tutto sia formattato e completo
4. **Merge** - Aggiunta al modello delle minacce e alla visualizzazione

## Risorse

- [Sito web ATLAS](https://atlas.mitre.org/)
- [Tecniche ATLAS](https://atlas.mitre.org/techniques/)
- [Casi di studio ATLAS](https://atlas.mitre.org/studies/)
- [Modello delle minacce OpenClaw](/it/security/THREAT-MODEL-ATLAS)

## Contatto

- **Vulnerabilità di sicurezza:** consulta la nostra [pagina Trust](https://trust.openclaw.ai) per le istruzioni di segnalazione
- **Domande sul modello delle minacce:** apri una issue su [openclaw/trust](https://github.com/openclaw/trust/issues)
- **Chat generale:** canale Discord #security

## Riconoscimento

I contributori al modello delle minacce vengono riconosciuti nei ringraziamenti del modello delle minacce, nelle note di rilascio e nella hall of fame della sicurezza di OpenClaw per contributi significativi.

## Correlati

- [Modello delle minacce](/it/security/THREAT-MODEL-ATLAS)
- [Verifica formale](/it/security/formal-verification)
