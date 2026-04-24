---
read_when:
    - Zmiana zachowania ikony paska menu
summary: Stany i animacje ikony paska menu dla OpenClaw na macOS
title: Ikona paska menu
x-i18n:
    generated_at: "2026-04-24T09:21:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6900d702358afcf0481f713ea334236e1abf973d0eeff60eaf0afcf88f9327b2
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Stany ikony paska menu

Autor: steipete · Zaktualizowano: 2025-12-06 · Zakres: aplikacja macOS (`apps/macos`)

- **Bezczynność:** normalna animacja ikony (mruganie, okazjonalne poruszenie).
- **Wstrzymane:** element statusu używa `appearsDisabled`; bez ruchu.
- **Wyzwalacz głosowy (duże uszy):** detektor voice wake wywołuje `AppState.triggerVoiceEars(ttl: nil)`, gdy usłyszy słowo wybudzające, utrzymując `earBoostActive=true` podczas przechwytywania wypowiedzi. Uszy skalują się w górę (1.9x), otrzymują okrągłe otwory dla lepszej czytelności, a następnie wracają po `stopVoiceEars()` po 1 s ciszy. Wyzwalane tylko z wewnętrznego potoku głosowego aplikacji.
- **Praca (agent działa):** `AppState.isWorking=true` steruje mikro-ruchem „szurania ogonem/nogami”: szybszym poruszaniem nóg i lekkim przesunięciem podczas trwania pracy. Obecnie przełączane wokół uruchomień agentów WebChat; po dodaniu innych długich zadań podłącz to samo przełączanie również wokół nich.

Punkty podłączenia

- Voice wake: runtime/tester wywołuje `AppState.triggerVoiceEars(ttl: nil)` przy wyzwoleniu oraz `stopVoiceEars()` po 1 s ciszy, aby dopasować się do okna przechwytywania.
- Aktywność agenta: ustaw `AppStateStore.shared.setWorking(true/false)` wokół zakresów pracy (już zrobione w wywołaniu agenta WebChat). Zachowuj krótkie zakresy i resetuj w blokach `defer`, aby uniknąć zablokowanych animacji.

Kształty i rozmiary

- Ikona bazowa rysowana w `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Domyślna skala uszu to `1.0`; podbicie głosu ustawia `earScale=1.9` i przełącza `earHoles=true` bez zmiany ogólnej ramki (obraz szablonu 18×18 pt renderowany do bufora Retina 36×36 px).
- Ruch szurania używa poruszania nóg do około `~1.0` z niewielkim poziomym drganiem; dodaje się do istniejącego poruszenia bezczynności.

Uwagi o zachowaniu

- Brak zewnętrznego przełącznika CLI/brokera dla uszu/pracy; utrzymuj to jako sygnały wewnętrzne aplikacji, aby uniknąć przypadkowego migotania.
- Utrzymuj krótkie TTL-e (&lt;10 s), aby ikona szybko wracała do stanu bazowego, jeśli zadanie się zawiesi.

## Powiązane

- [Pasek menu](/pl/platforms/mac/menu-bar)
- [Aplikacja macOS](/pl/platforms/macos)
