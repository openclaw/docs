---
read_when:
    - Praca nad ścieżkami wybudzania głosowego lub PTT
summary: Tryby aktywacji głosowej i naciśnij, aby mówić oraz szczegóły routingu w aplikacji na Maca
title: Wybudzanie głosowe (macOS)
x-i18n:
    generated_at: "2026-07-12T15:18:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Aktywacja głosowa i naciśnij, aby mówić

## Wymagania

Aktywacja głosowa i funkcja naciśnij, aby mówić wymagają systemu macOS 26 lub nowszego. W starszych wersjach macOS elementy sterujące są ukryte na stronie ustawień głosu, która zamiast nich wyświetla informację o wymaganiu systemu macOS 26.

## Tryby

- **Tryb słowa aktywującego** (domyślny): stale włączony mechanizm rozpoznawania mowy oczekuje na frazy aktywujące (`swabbleTriggerWords`). Po wykryciu zgodności rozpoczyna przechwytywanie, wyświetla nakładkę z częściowym tekstem i automatycznie wysyła treść po zapadnięciu ciszy.
- **Naciśnij, aby mówić (przytrzymaj prawy Option)**: przytrzymaj prawy klawisz Option, aby natychmiast rozpocząć przechwytywanie bez konieczności użycia frazy aktywującej. Nakładka jest widoczna podczas przytrzymywania klawisza; jego zwolnienie kończy przechwytywanie i po krótkim opóźnieniu przekazuje treść dalej, umożliwiając edycję tekstu.

## Zachowanie w czasie działania (słowo aktywujące)

- Mechanizm rozpoznawania znajduje się w `VoiceWakeRuntime`.
- Aktywacja następuje tylko wtedy, gdy między słowem aktywującym a następnym słowem wystąpi wyraźna pauza (`triggerPauseWindow` = 0,55 s). Nakładka lub sygnał dźwiękowy mogą zostać uruchomione podczas pauzy, jeszcze przed rozpoczęciem polecenia.
- Okna ciszy: 2,0 s (`silenceWindow`), gdy mowa jest kontynuowana, oraz 5,0 s (`triggerOnlySilenceWindow`), jeśli wykryto tylko frazę aktywującą.
- Wymuszone zatrzymanie: 120 s (`captureHardStop`), aby zapobiegać niekontrolowanym sesjom.
- Ograniczenie częstotliwości między sesjami: 350 ms (`debounceAfterSend`) po wysłaniu.
- Nakładką steruje `VoiceWakeOverlayController`, z odrębnymi kolorami tekstu zatwierdzonego i tymczasowego.
- Po wysłaniu mechanizm rozpoznawania jest ponownie uruchamiany w czystym stanie i nasłuchuje kolejnej frazy aktywującej.

## Niezmienniki cyklu życia

- Jeśli aktywacja głosowa jest włączona i przyznano uprawnienia, mechanizm rozpoznawania słowa aktywującego stale nasłuchuje, z wyjątkiem aktywnego przechwytywania w trybie naciśnij, aby mówić.
- Zamknięcie nakładki, w tym ręczne za pomocą przycisku X, zawsze wznawia działanie mechanizmu rozpoznawania: `VoiceSessionCoordinator.overlayDidDismiss` wywołuje `VoiceWakeRuntime.refresh(state:)` na każdej ścieżce zamknięcia. Opis modelu sesji i tokenów zawiera strona [Nakładka głosowa](/pl/platforms/mac/voice-overlay).

## Szczegóły funkcji naciśnij, aby mówić

- Wykrywanie skrótu klawiszowego korzysta z globalnego monitora `.flagsChanged` dla prawego klawisza Option (`keyCode 61` + `.option`). Monitor jedynie obserwuje zdarzenia i nigdy ich nie przechwytuje.
- Przechwytywanie odbywa się w `VoicePushToTalk`: natychmiast uruchamia rozpoznawanie mowy, przesyła częściowe wyniki do nakładki i po zwolnieniu klawisza wywołuje `VoiceWakeForwarder`.
- Rozpoczęcie przechwytywania w trybie naciśnij, aby mówić wstrzymuje środowisko słowa aktywującego, aby uniknąć konkurujących źródeł przechwytywania dźwięku; po zwolnieniu klawisza jest ono automatycznie ponownie uruchamiane.
- Uprawnienia: wymagany jest dostęp do mikrofonu i rozpoznawania mowy; odbieranie zdarzeń klawiatury wymaga zatwierdzenia dostępu do ułatwień dostępu lub monitorowania wprowadzania.
- Klawiatury zewnętrzne: niektóre nie udostępniają prawego klawisza Option w oczekiwany sposób. Jeśli użytkownicy zgłaszają niewykrywanie naciśnięć, należy zaoferować skrót zastępczy.

## Ustawienia widoczne dla użytkownika

- Przełącznik **Aktywacja głosowa**: włącza środowisko słowa aktywującego.
- **Przytrzymaj prawy Option, aby mówić**: włącza monitor funkcji naciśnij, aby mówić.
- Selektory języka i mikrofonu, miernik poziomu na żywo, tabela fraz aktywujących oraz tester działający wyłącznie lokalnie, który nigdy niczego nie przekazuje.
- Selektor mikrofonu zachowuje ostatni wybór po odłączeniu urządzenia, wyświetla informację o rozłączeniu i tymczasowo przełącza się na domyślne urządzenie systemowe do czasu ponownego podłączenia wybranego urządzenia.
- **Dźwięki**: sygnały dźwiękowe po wykryciu frazy aktywującej i wysłaniu treści, domyślnie używające systemowego dźwięku „Glass” z macOS. Dla każdego zdarzenia można wybrać dowolny plik obsługiwany przez `NSSound` (np. MP3/WAV/AIFF) albo wybrać **Bez dźwięku**.

## Zachowanie przekazywania

- Podczas przekazywania `VoiceWakeForwarder.selectedSessionOptions` wybiera klucz aktywnej sesji WebChat, jeśli został ustawiony; w przeciwnym razie wybiera klucz głównej sesji Gateway.
- Wyszukuje tę sesję za pomocą `sessions.list` i ustala kanał oraz cel dostarczenia na podstawie kontekstu dostarczania sesji. Jeśli to niemożliwe, kolejno używa ostatniego kanału i celu, a następnie przeanalizowanego klucza sesji. Jeśli niczego nie uda się ustalić, domyślnie wybiera WebChat.
- Jeśli dostarczenie się nie powiedzie, błąd zostaje zapisany w dzienniku (kategoria `voicewake.forward`), a przebieg nadal jest widoczny w dziennikach WebChat lub sesji.

## Dane przekazywania

- `VoiceWakeForwarder.prefixedTranscript(_:)` dodaje przed transkrypcją wiersz ze wskazówką dla maszyny — ustaloną nazwą hosta lub, jeśli jest niedostępna, tekstem „ten Mac”. Mechanizm ten jest współdzielony przez ścieżki słowa aktywującego i funkcji naciśnij, aby mówić.

## Szybka weryfikacja

- Włącz funkcję naciśnij, aby mówić, przytrzymaj prawy Option, zacznij mówić, a następnie zwolnij klawisz: nakładka powinna wyświetlić częściowe wyniki, a następnie wysłać treść.
- Podczas przytrzymywania uszy na pasku menu powinny pozostać powiększone (`triggerVoiceEars(ttl: nil)`); po zwolnieniu klawisza wracają do normalnego rozmiaru.

## Powiązane

- [Aktywacja głosowa](/pl/nodes/voicewake)
- [Nakładka głosowa](/pl/platforms/mac/voice-overlay)
- [Aplikacja macOS](/pl/platforms/macos)
