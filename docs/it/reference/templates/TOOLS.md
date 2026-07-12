---
read_when:
    - Inizializzazione manuale di un'area di lavoro
summary: Modello dell'area di lavoro per TOOLS.md
title: Modello TOOLS.md
x-i18n:
    generated_at: "2026-07-12T07:30:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - Note locali

Le Skills definiscono _come_ funzionano gli strumenti. Questo file è dedicato alle _tue_ specificità, ossia tutto ciò che è esclusivo della tua configurazione: nomi e posizioni delle videocamere, host e alias SSH, voci TTS preferite, nomi di altoparlanti e stanze, nomi informali dei dispositivi e qualsiasi altro elemento specifico dell'ambiente.

## Esempi

```markdown
### Videocamere

- living-room → Area principale, grandangolo a 180°
- front-door → Ingresso, attivazione tramite movimento

### SSH

- home-server → 192.168.1.100, utente: admin

### TTS

- Voce preferita: "Nova" (calda, con un leggero accento britannico)
- Altoparlante predefinito: HomePod della cucina
```

## Perché tenerli separati?

Le Skills sono condivise. La tua configurazione appartiene a te. Mantenerle separate ti consente di aggiornare le Skills senza perdere le tue note e di condividerle senza divulgare informazioni sulla tua infrastruttura.

---

Aggiungi tutto ciò che ti aiuta a svolgere il tuo lavoro. Questo è il tuo promemoria.

## Contenuti correlati

- [Spazio di lavoro dell'agente](/it/concepts/agent-workspace)
