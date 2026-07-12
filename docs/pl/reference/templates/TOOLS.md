---
read_when:
    - Ręczne inicjowanie przestrzeni roboczej
summary: Szablon przestrzeni roboczej dla TOOLS.md
title: Szablon TOOLS.md
x-i18n:
    generated_at: "2026-07-12T15:35:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md — Notatki lokalne

Skills określają, _jak_ działają narzędzia. Ten plik jest przeznaczony na _Twoje_ informacje szczegółowe — elementy właściwe dla Twojej konfiguracji: nazwy i lokalizacje kamer, hosty i aliasy SSH, preferowane głosy TTS, nazwy głośników i pomieszczeń, przyjazne nazwy urządzeń oraz wszystko, co jest specyficzne dla środowiska.

## Przykłady

```markdown
### Kamery

- living-room → Główna przestrzeń, szeroki kąt 180°
- front-door → Wejście, aktywacja po wykryciu ruchu

### SSH

- home-server → 192.168.1.100, użytkownik: admin

### TTS

- Preferowany głos: "Nova" (ciepły, z lekkim brytyjskim akcentem)
- Domyślny głośnik: Kitchen HomePod
```

## Dlaczego osobno?

Skills są współdzielone. Twoja konfiguracja należy do Ciebie. Rozdzielenie ich oznacza, że możesz aktualizować Skills bez utraty swoich notatek oraz udostępniać Skills bez ujawniania swojej infrastruktury.

---

Dodaj wszystko, co pomaga Ci wykonywać pracę. To Twoja podręczna ściągawka.

## Powiązane

- [Przestrzeń robocza agenta](/pl/concepts/agent-workspace)
