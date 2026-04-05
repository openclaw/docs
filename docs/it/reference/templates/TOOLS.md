---
read_when:
    - Inizializzazione manuale di un workspace
summary: Template del workspace per TOOLS.md
title: Template di TOOLS.md
x-i18n:
    generated_at: "2026-04-05T14:03:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: eed204d57e7221ae0455a87272da2b0730d6aee6ddd2446a851703276e4a96b7
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Note locali

Le Skills definiscono _come_ funzionano gli strumenti. Questo file serve per le _tue_ specificità — le cose uniche della tua configurazione.

## Cosa inserire qui

Elementi come:

- Nomi e posizioni delle telecamere
- Host SSH e alias
- Voci preferite per TTS
- Nomi di altoparlanti/stanze
- Soprannomi dei dispositivi
- Qualsiasi cosa specifica dell'ambiente

## Esempi

```markdown
### Telecamere

- living-room → Area principale, grandangolo a 180°
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

Aggiungi qualsiasi cosa ti aiuti a svolgere il tuo lavoro. Questo è il tuo promemoria rapido.
