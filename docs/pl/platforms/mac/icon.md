---
read_when:
    - Zmiana zachowania ikony na pasku menu
summary: Stany i animacje ikony paska menu dla OpenClaw na macOS
title: Ikona paska menu
x-i18n:
    generated_at: "2026-05-06T09:21:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5497927721ff7486e9585a8a3edc2d5140408b2b0707acdcef2388e87bca20ec
    source_path: platforms/mac/icon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Stany ikony na pasku menu

Autor: steipete · Zaktualizowano: 2025-12-06 · Zakres: aplikacja macOS (`apps/macos`)

- **Bezczynność:** Normalna animacja ikony (mruganie, sporadyczne poruszenie).
- **Wstrzymanie:** Element statusu używa `appearsDisabled`; brak ruchu.
- **Wyzwalacz głosowy (duże uszy):** Detektor wybudzania głosem wywołuje `AppState.triggerVoiceEars(ttl: nil)`, gdy usłyszy słowo wybudzające, utrzymując `earBoostActive=true` podczas przechwytywania wypowiedzi. Uszy powiększają się (1.9x), otrzymują okrągłe otwory dla czytelności, a następnie są wyłączane przez `stopVoiceEars()` po 1 s ciszy. Uruchamiane tylko z wewnętrznego potoku głosowego aplikacji.
- **Praca (działający agent):** `AppState.isWorking=true` steruje mikroruchem typu „szybkie przebieranie ogonem/nogami”: szybsze poruszanie nogami i niewielkie przesunięcie, gdy praca jest w toku. Obecnie przełączane wokół uruchomień agenta WebChat; dodaj ten sam przełącznik wokół innych długich zadań, gdy je podłączysz.

Punkty podłączenia

- Wybudzanie głosem: runtime/tester wywołuje `AppState.triggerVoiceEars(ttl: nil)` po wyzwoleniu oraz `stopVoiceEars()` po 1 s ciszy, aby dopasować okno przechwytywania.
- Aktywność agenta: ustawiaj `AppStateStore.shared.setWorking(true/false)` wokół odcinków pracy (już zrobione w wywołaniu agenta WebChat). Utrzymuj odcinki krótkie i resetuj je w blokach `defer`, aby uniknąć zablokowanych animacji.

Kształty i rozmiary

- Ikona bazowa jest rysowana w `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Skala uszu domyślnie wynosi `1.0`; wzmocnienie głosowe ustawia `earScale=1.9` i przełącza `earHoles=true` bez zmiany całej ramki (obraz szablonu 18×18 pt renderowany do magazynu Retina 36×36 px).
- Szybkie poruszanie używa wychylenia nóg do ~1.0 z niewielkim poziomym drgnięciem; nakłada się addytywnie na każde istniejące poruszanie w stanie bezczynności.

Uwagi behawioralne

- Brak zewnętrznego przełącznika CLI/brokera dla uszu/pracy; trzymaj to wewnątrz własnych sygnałów aplikacji, aby uniknąć przypadkowego migotania.
- Utrzymuj krótkie TTL-e (&lt;10 s), aby ikona szybko wracała do stanu bazowego, jeśli zadanie się zawiesi.

## Powiązane

- [Pasek menu](/pl/platforms/mac/menu-bar)
- [Aplikacja macOS](/pl/platforms/macos)
