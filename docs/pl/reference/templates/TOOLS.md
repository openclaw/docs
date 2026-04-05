---
read_when:
    - Ręcznie inicjalizujesz workspace
summary: Szablon TOOLS.md dla workspace
title: Szablon TOOLS.md
x-i18n:
    generated_at: "2026-04-05T14:05:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: eed204d57e7221ae0455a87272da2b0730d6aee6ddd2446a851703276e4a96b7
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - Lokalne notatki

Skills definiują _jak_ działają narzędzia. Ten plik jest dla _Twoich_ konkretów — rzeczy unikalnych dla Twojej konfiguracji.

## Co tu trafia

Rzeczy takie jak:

- Nazwy i lokalizacje kamer
- Hosty i aliasy SSH
- Preferowane głosy dla TTS
- Nazwy głośników/pomieszczeń
- Pseudonimy urządzeń
- Wszystko, co jest specyficzne dla środowiska

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

Skills są współdzielone. Twoja konfiguracja jest Twoja. Trzymanie ich osobno oznacza, że możesz aktualizować Skills bez utraty swoich notatek i udostępniać Skills bez ujawniania swojej infrastruktury.

---

Dodaj wszystko, co pomaga Ci wykonywać pracę. To Twoja ściąga.
