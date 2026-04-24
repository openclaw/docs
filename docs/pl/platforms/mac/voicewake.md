---
read_when:
    - Praca nad ścieżkami wybudzania głosem lub PTT
summary: Tryby wybudzania głosem i push-to-talk oraz szczegóły routingu w aplikacji Mac
title: Wybudzanie głosem (macOS)
x-i18n:
    generated_at: "2026-04-24T09:21:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Wybudzanie głosem i push-to-talk

## Tryby

- **Tryb słowa wybudzającego** (domyślny): zawsze aktywny rozpoznawacz mowy czeka na tokeny wyzwalające (`swabbleTriggerWords`). Po dopasowaniu rozpoczyna przechwytywanie, pokazuje nakładkę z częściowym tekstem i automatycznie wysyła po ciszy.
- **Push-to-talk (przytrzymanie prawego Option)**: przytrzymaj prawy klawisz Option, aby natychmiast rozpocząć przechwytywanie — bez potrzeby użycia wyzwalacza. Nakładka pojawia się podczas przytrzymania; zwolnienie klawisza finalizuje i przekazuje dalej po krótkim opóźnieniu, aby można było jeszcze poprawić tekst.

## Zachowanie runtime (słowo wybudzające)

- Rozpoznawacz mowy działa w `VoiceWakeRuntime`.
- Wyzwalacz uruchamia się tylko wtedy, gdy między słowem wybudzającym a następnym słowem występuje **znacząca pauza** (przerwa około 0,55 s). Nakładka/dźwięk mogą rozpocząć się na tej pauzie, jeszcze zanim zacznie się polecenie.
- Okna ciszy: 2,0 s, gdy mowa płynie, 5,0 s, jeśli usłyszano tylko wyzwalacz.
- Twarde zatrzymanie: 120 s, aby zapobiec niekontrolowanym sesjom.
- Debounce między sesjami: 350 ms.
- Nakładka jest sterowana przez `VoiceWakeOverlayController` z kolorowaniem committed/volatile.
- Po wysłaniu rozpoznawacz uruchamia się ponownie w czysty sposób, aby nasłuchiwać następnego wyzwalacza.

## Niezmienniki cyklu życia

- Jeśli Voice Wake jest włączone i przyznano uprawnienia, rozpoznawacz słowa wybudzającego powinien nasłuchiwać (z wyjątkiem jawnego przechwytywania push-to-talk).
- Widoczność nakładki (w tym ręczne zamknięcie przyciskiem X) nigdy nie może uniemożliwiać wznowienia pracy rozpoznawacza.

## Tryb awarii z zablokowaną nakładką (wcześniej)

Wcześniej, jeśli nakładka zacięła się w stanie widocznym i została ręcznie zamknięta, Voice Wake mogło sprawiać wrażenie „martwego”, ponieważ próba ponownego uruchomienia runtime mogła zostać zablokowana przez widoczność nakładki, a kolejne wznowienie nie było planowane.

Utwardzenie:

- Ponowne uruchomienie runtime wybudzania nie jest już blokowane przez widoczność nakładki.
- Zakończenie zamknięcia nakładki wyzwala `VoiceWakeRuntime.refresh(...)` przez `VoiceSessionCoordinator`, więc ręczne zamknięcie przyciskiem X zawsze wznawia nasłuchiwanie.

## Szczegóły push-to-talk

- Wykrywanie skrótu używa globalnego monitora `.flagsChanged` dla **prawego Option** (`keyCode 61` + `.option`). Zdarzenia są tylko obserwowane (bez przechwytywania).
- Potok przechwytywania działa w `VoicePushToTalk`: natychmiast uruchamia Speech, przesyła częściowe wyniki do nakładki i wywołuje `VoiceWakeForwarder` przy zwolnieniu.
- Gdy push-to-talk się rozpoczyna, wstrzymujemy runtime słowa wybudzającego, aby uniknąć konkurujących przechwyceń audio; po zwolnieniu uruchamia się on ponownie automatycznie.
- Uprawnienia: wymaga dostępu do mikrofonu + Speech; obserwowanie zdarzeń wymaga zatwierdzenia Accessibility/Input Monitoring.
- Klawiatury zewnętrzne: niektóre mogą nie udostępniać prawego Option zgodnie z oczekiwaniami — zaoferuj skrót awaryjny, jeśli użytkownicy zgłaszają pominięcia.

## Ustawienia widoczne dla użytkownika

- Przełącznik **Voice Wake**: włącza runtime słowa wybudzającego.
- **Hold Cmd+Fn to talk**: włącza monitor push-to-talk. Wyłączone na macOS < 26.
- Selektory języka i mikrofonu, wskaźnik poziomu na żywo, tabela słów wybudzających, tester (tylko lokalny; niczego nie przekazuje dalej).
- Selektor mikrofonu zachowuje ostatni wybór, jeśli urządzenie zostanie odłączone, pokazuje wskazówkę o rozłączeniu i tymczasowo przełącza się na domyślne urządzenie systemowe, dopóki wybrane nie wróci.
- **Dźwięki**: sygnały przy wykryciu wyzwalacza i przy wysyłaniu; domyślnie dźwięk systemowy macOS „Glass”. Dla każdego zdarzenia można wybrać dowolny plik ładowalny przez `NSSound` (np. MP3/WAV/AIFF) albo opcję **No Sound**.

## Zachowanie przekazywania

- Gdy Voice Wake jest włączone, transkrypcje są przekazywane do aktywnego gateway/agenta (ten sam tryb lokalny lub zdalny, którego używa reszta aplikacji Mac).
- Odpowiedzi są dostarczane do **ostatnio używanego głównego dostawcy** (WhatsApp/Telegram/Discord/WebChat). Jeśli dostarczenie się nie powiedzie, błąd jest logowany, a wykonanie nadal jest widoczne przez WebChat/logi sesji.

## Payload przekazywania

- `VoiceWakeForwarder.prefixedTranscript(_:)` dodaje podpowiedź maszyny przed wysłaniem. Współdzielone między ścieżkami słowa wybudzającego i push-to-talk.

## Szybka weryfikacja

- Włącz push-to-talk, przytrzymaj Cmd+Fn, mów, zwolnij: nakładka powinna pokazywać częściowe wyniki, a następnie wysłać wiadomość.
- Podczas przytrzymania uszy na pasku menu powinny pozostać powiększone (używa `triggerVoiceEars(ttl:nil)`); po zwolnieniu wracają do normalnego rozmiaru.

## Powiązane

- [Wybudzanie głosem](/pl/nodes/voicewake)
- [Nakładka głosowa](/pl/platforms/mac/voice-overlay)
- [Aplikacja macOS](/pl/platforms/macos)
