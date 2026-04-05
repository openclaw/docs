---
read_when:
    - Zmiana zachowania ikony paska menu
summary: Stany ikony paska menu i animacje dla OpenClaw na macOS
title: Menu Bar Icon
x-i18n:
    generated_at: "2026-04-05T13:59:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: a67a6e6bbdc2b611ba365d3be3dd83f9e24025d02366bc35ffcce9f0b121872b
    source_path: platforms/mac/icon.md
    workflow: 15
---

# Stany ikony paska menu

Autor: steipete · Zaktualizowano: 2025-12-06 · Zakres: aplikacja macOS (`apps/macos`)

- **Bezczynny:** Normalna animacja ikony (mruganie, okazjonalne poruszenie).
- **Wstrzymany:** Element paska stanu używa `appearsDisabled`; bez ruchu.
- **Wyzwalacz głosowy (duże uszy):** Detektor wybudzania głosem wywołuje `AppState.triggerVoiceEars(ttl: nil)`, gdy usłyszy słowo wybudzające, utrzymując `earBoostActive=true`, gdy wypowiedź jest przechwytywana. Uszy powiększają się (1.9x), dostają okrągłe otwory w uszach dla lepszej czytelności, a następnie wracają do normy przez `stopVoiceEars()` po 1 s ciszy. Wyzwalane tylko z potoku głosowego w aplikacji.
- **Praca w toku (uruchomiony agent):** `AppState.isWorking=true` steruje mikroruchem „truchtania ogona/nóg”: szybszym poruszaniem nogami i niewielkim przesunięciem, gdy praca jest wykonywana. Obecnie przełączane wokół uruchomień agentów WebChat; dodaj to samo przełączanie wokół innych długotrwałych zadań, gdy będziesz je podpinać.

Punkty podłączenia

- Wybudzanie głosem: runtime/tester wywołuje `AppState.triggerVoiceEars(ttl: nil)` przy wyzwoleniu oraz `stopVoiceEars()` po 1 s ciszy, aby dopasować do okna przechwytywania.
- Aktywność agenta: ustaw `AppStateStore.shared.setWorking(true/false)` wokół zakresów pracy (już zrobione w wywołaniu agenta WebChat). Utrzymuj zakresy krótkie i resetuj je w blokach `defer`, aby uniknąć zawieszonych animacji.

Kształty i rozmiary

- Ikona bazowa jest rysowana w `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)`.
- Skala uszu domyślnie wynosi `1.0`; wzmocnienie głosowe ustawia `earScale=1.9` i przełącza `earHoles=true` bez zmiany całej ramki (obraz szablonu 18×18 pt renderowany do bufora Retina 36×36 px).
- Truchtanie używa poruszania nogami do ~1.0 z niewielkim poziomym drganiem; jest addytywne względem istniejącego poruszenia w stanie bezczynnym.

Uwagi dotyczące zachowania

- Brak zewnętrznego przełącznika CLI/brokera dla uszu/pracy w toku; utrzymuj to jako wewnętrzne sygnały samej aplikacji, aby uniknąć przypadkowego migotania.
- Utrzymuj TTL krótkie (&lt;10s), aby ikona szybko wracała do stanu bazowego, jeśli zadanie się zawiesi.
