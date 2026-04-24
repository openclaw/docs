---
read_when:
    - Bootstrap manuale di un workspace
summary: Template del workspace per TOOLS.md
title: Template di TOOLS.md
x-i18n:
    generated_at: "2026-04-24T09:01:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Note locali

Le Skills definiscono _come_ funzionano gli strumenti. Questo file serve per le _tue_ specificità — le cose uniche della tua configurazione.

## Cosa va qui

Cose come:

- Nomi e posizioni delle telecamere
- Host e alias SSH
- Voci preferite per il TTS
- Nomi di altoparlanti/stanze
- Soprannomi dei dispositivi
- Qualsiasi cosa specifica dell'ambiente

## Esempi

```markdown
### Telecamere

- living-room → Area principale, grandangolo 180°
- front-door → Ingresso, attivata dal movimento

### SSH

- home-server → 192.168.1.100, utente: admin

### TTS

- Voce preferita: "Nova" (calda, leggermente britannica)
- Altoparlante predefinito: HomePod della cucina
```

## Perché separato?

Le Skills sono condivise. La tua configurazione è tua. Tenerle separate significa che puoi aggiornare le Skills senza perdere le tue note e condividere le Skills senza esporre la tua infrastruttura.

---

Aggiungi qualsiasi cosa ti aiuti a fare il tuo lavoro. Questo è il tuo promemoria rapido.

## Correlati

- [Workspace dell'agente](/it/concepts/agent-workspace)
