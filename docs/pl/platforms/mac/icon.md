---
read_when:
    - Zmiana zachowania ikony na pasku menu
summary: Stany i animacje ikony na pasku menu OpenClaw w systemie macOS
title: Ikona na pasku menu
x-i18n:
    generated_at: "2026-07-16T18:47:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8a38f1253f0c376ef2ce6c0ae339b67084c472c764964bcc7ad21e10133e2b47
    source_path: platforms/mac/icon.md
    workflow: 16
---

# Stany ikony na pasku menu

Zakres: aplikacja macOS (`apps/macos`). Renderowanie: `CritterIconRenderer.makeIcon(...)`. Obsługa animacji i stanów: `CritterStatusLabel` + `CritterStatusLabel+Behavior.swift`.

## Stany

| Stan                  | Wyzwalacz                                | Wygląd                                                                                                             |
| --------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Bezczynność            | Domyślnie                                 | Zwykła animacja mrugania/kołysania; otwarte oczy zachowują lśniący refleks                                        |
| Wstrzymanie            | `isPaused=true`                        | Czułki opadają („po służbie”), a oczy pozostają otwarte; brak ruchu                                               |
| Uśpienie               | Gateway rozłączony/nieskonfigurowany      | Czułki opadają, a oczy zamykają się, tworząc powieki `⌣ ⌣`; brak ruchu                               |
| Świętowanie            | Wysłano wiadomość (`sendCelebrationTick`)    | Oczy rozbłyskują radosnymi łukami `∩ ∩` przez ~0.9s, czemu towarzyszy kopnięcie nogą                 |
| Wybudzenie głosowe (duże uszy) | Wykryto słowo wybudzające         | Czułki prostują się i stają się wyższe (`earScale=1.9`); opadają po nastaniu ciszy                            |
| Praca                  | `isWorking=true` lub aktywne `IconState` | Szybsze poruszanie nogami (`legWiggle` do `1.0`) i niewielkie przesunięcie poziome; nakłada się na kołysanie w stanie bezczynności |

Wskaźnik aktywności narzędzia (znaczek z symbolem SF Symbol, np. `chevron.left.slash.chevron.right` dla wykonania polecenia) może być wyświetlany nad tą samą ikoną stworzonka, gdy sesja ma aktywne zadanie lub narzędzie. Wskaźnik ten pochodzi z `IconState`/`ActivityKind`; pełny model stanów opisano w sekcji [Pasek menu](/pl/platforms/mac/menu-bar).

## Uszy wybudzania głosowego

- Wyzwalacz: `AppStateStore.shared.triggerVoiceEars(ttl: nil)`, wywoływany z potoku przechwytywania wybudzania głosowego (`VoiceWakeRuntime`) oraz z narzędzi do debugowania/testowania wybudzania głosowego (`VoiceWakeTester`, `VoiceWakeOverlayController`).
- Zatrzymanie: `stopVoiceEars()`, wywoływane po zakończeniu przechwytywania.
- Okno ciszy przed zakończeniem: zwykle `2.0s`, a `5.0s`, jeśli usłyszano tylko słowo wyzwalające i nie nastąpiła po nim żadna dalsza wypowiedź (`VoiceWakeRuntime.silenceWindow` / `triggerOnlySilenceWindow`).
- Podczas wzmocnienia zegary bezczynnego mrugania, kołysania, ruchu nóg i uszu są wstrzymywane (`earBoostActive` steruje zadaniem animacji w `CritterStatusLabel+Behavior`).

## Kształty i rozmiary

- Obszar roboczy: obraz szablonowy 18x18pt, renderowany w buforze bitmapowym 36x36px (2x), dzięki czemu ikona pozostaje wyraźna na ekranach Retina.
- Domyślna skala uszu to `1.0`; wzmocnienie głosowe ustawia `earScale=1.9` bez zmiany całkowitej ramki.
- `antennaDroop` (0-1) opuszcza czułki w pozycjach wstrzymania i uśpienia.
- Szybki ruch nóg wykorzystuje zakres od `legWiggle` do `1.0` z niewielkim poziomym drżeniem.

## Uwagi dotyczące działania

- Nie ma zewnętrznego przełącznika CLI/brokera dla uszu ani stanu pracy; oba są sterowane wewnętrznie przez sygnały aplikacji (`AppState.setWorking`, `AppState.triggerVoiceEars`), aby uniknąć przypadkowego, naprzemiennego przełączania.
- Każdy nowy TTL powinien być krótki (znacznie poniżej 10s), aby ikona szybko wracała do stanu bazowego w przypadku zawieszenia zadania.

## Powiązane

- [Pasek menu](/pl/platforms/mac/menu-bar)
- [Aplikacja macOS](/pl/platforms/macos)
