---
read_when:
    - Ręczne inicjowanie obszaru roboczego
summary: Szablon obszaru roboczego dla TOOLS.md
title: Szablon TOOLS.md
x-i18n:
    generated_at: "2026-04-24T09:32:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Notatki lokalne

Skills określają, _jak_ działają narzędzia. Ten plik dotyczy _Twoich_ szczegółów — rzeczy unikalnych dla Twojej konfiguracji.

## Co tu umieścić

Na przykład:

- Nazwy i lokalizacje kamer
- Hosty i aliasy SSH
- Preferowane głosy dla TTS
- Nazwy głośników/pomieszczeń
- Pseudonimy urządzeń
- Wszystko, co zależy od środowiska

## Przykłady

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Dlaczego osobno?

Skills są współdzielone. Twoja konfiguracja należy do Ciebie. Trzymanie ich osobno oznacza, że możesz aktualizować Skills bez utraty swoich notatek i udostępniać Skills bez ujawniania swojej infrastruktury.

---

Dodaj wszystko, co pomaga Ci wykonywać swoją pracę. To Twoja ściągawka.

## Powiązane

- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
