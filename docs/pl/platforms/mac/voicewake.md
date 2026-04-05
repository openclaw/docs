---
read_when:
    - Praca nad ścieżkami Voice Wake lub PTT
summary: Tryby Voice Wake i push-to-talk oraz szczegóły routingu w aplikacji na Maca
title: Voice Wake (macOS)
x-i18n:
    generated_at: "2026-04-05T14:00:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: fed6524a2e1fad5373d34821c920b955a2b5a3fcd9c51cdb97cf4050536602a7
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Voice Wake i Push-to-Talk

## Tryby

- **Tryb słowa wybudzającego** (domyślny): stale aktywny rozpoznawacz mowy czeka na tokeny wyzwalające (`swabbleTriggerWords`). Po dopasowaniu rozpoczyna przechwytywanie, pokazuje nakładkę z częściowym tekstem i automatycznie wysyła po chwili ciszy.
- **Push-to-talk (przytrzymanie prawego klawisza Option)**: przytrzymaj prawy klawisz Option, aby natychmiast rozpocząć przechwytywanie — bez potrzeby wyzwalacza. Nakładka jest widoczna podczas przytrzymania; zwolnienie kończy działanie i przekazuje tekst po krótkim opóźnieniu, aby można było go jeszcze poprawić.

## Zachowanie w czasie działania (słowo wybudzające)

- Rozpoznawacz mowy działa w `VoiceWakeRuntime`.
- Wyzwolenie następuje tylko wtedy, gdy między słowem wybudzającym a następnym słowem występuje **znacząca pauza** (przerwa około 0,55 s). Nakładka/dźwięk mogą uruchomić się już podczas tej pauzy, jeszcze zanim rozpocznie się komenda.
- Okna ciszy: 2,0 s, gdy mowa trwa, 5,0 s, jeśli wykryto tylko wyzwalacz.
- Twarde zatrzymanie: 120 s, aby zapobiec niekontrolowanym sesjom.
- Debounce między sesjami: 350 ms.
- Nakładka jest sterowana przez `VoiceWakeOverlayController` z kolorystyką committed/volatile.
- Po wysłaniu rozpoznawacz uruchamia się ponownie w czysty sposób, aby nasłuchiwać kolejnego wyzwalacza.

## Niezmienniki cyklu życia

- Jeśli Voice Wake jest włączone i uprawnienia zostały przyznane, rozpoznawacz słowa wybudzającego powinien nasłuchiwać (z wyjątkiem jawnego przechwytywania push-to-talk).
- Widoczność nakładki (w tym ręczne zamknięcie przyciskiem X) nigdy nie może uniemożliwiać wznowienia działania rozpoznawacza.

## Tryb awarii z zablokowaną nakładką (wcześniej)

Wcześniej, jeśli nakładka zawiesiła się w stanie widocznym i została ręcznie zamknięta, Voice Wake mogło sprawiać wrażenie „martwego”, ponieważ próba ponownego uruchomienia w runtime mogła zostać zablokowana przez widoczność nakładki i nie planowano żadnego kolejnego restartu.

Utwardzenie:

- Restart runtime wybudzania nie jest już blokowany przez widoczność nakładki.
- Zakończenie zamknięcia nakładki wywołuje `VoiceWakeRuntime.refresh(...)` przez `VoiceSessionCoordinator`, więc ręczne zamknięcie przyciskiem X zawsze wznawia nasłuchiwanie.

## Szczegóły push-to-talk

- Wykrywanie skrótu klawiszowego używa globalnego monitora `.flagsChanged` dla **prawego klawisza Option** (`keyCode 61` + `.option`). Tylko obserwujemy zdarzenia (bez ich przechwytywania).
- Potok przechwytywania znajduje się w `VoicePushToTalk`: natychmiast uruchamia Speech, strumieniuje częściowe wyniki do nakładki i po zwolnieniu wywołuje `VoiceWakeForwarder`.
- Gdy rozpoczyna się push-to-talk, wstrzymujemy runtime słowa wybudzającego, aby uniknąć konfliktujących tapów audio; po zwolnieniu uruchamia się on ponownie automatycznie.
- Uprawnienia: wymaga dostępu do mikrofonu i Speech; obserwowanie zdarzeń wymaga zgody na Dostępność/Input Monitoring.
- Klawiatury zewnętrzne: niektóre mogą nie udostępniać prawego klawisza Option zgodnie z oczekiwaniami — jeśli użytkownicy zgłaszają problemy, zaproponuj skrót awaryjny.

## Ustawienia widoczne dla użytkownika

- Przełącznik **Voice Wake**: włącza runtime słowa wybudzającego.
- **Przytrzymaj Cmd+Fn, aby mówić**: włącza monitor push-to-talk. Wyłączone w macOS < 26.
- Selektory języka i mikrofonu, miernik poziomu na żywo, tabela słów wyzwalających, tester (tylko lokalnie; nie przekazuje dalej).
- Selektor mikrofonu zachowuje ostatni wybór po odłączeniu urządzenia, pokazuje wskazówkę o rozłączeniu i tymczasowo przełącza się na domyślne urządzenie systemowe do czasu jego powrotu.
- **Dźwięki**: sygnały przy wykryciu wyzwalacza i przy wysłaniu; domyślnie systemowy dźwięk macOS „Glass”. Dla każdego zdarzenia można wybrać dowolny plik ładowalny przez `NSSound` (np. MP3/WAV/AIFF) albo wybrać **No Sound**.

## Zachowanie przekazywania

- Gdy Voice Wake jest włączone, transkrypcje są przekazywane do aktywnego gateway/agent (ten sam tryb lokalny lub zdalny, którego używa reszta aplikacji na Maca).
- Odpowiedzi są dostarczane do **ostatnio używanego głównego providera** (WhatsApp/Telegram/Discord/WebChat). Jeśli dostarczenie się nie powiedzie, błąd jest logowany, a przebieg nadal jest widoczny w WebChat/logach sesji.

## Ładunek przekazywania

- `VoiceWakeForwarder.prefixedTranscript(_:)` dodaje wskazówkę o maszynie przed wysłaniem. Współdzielone między ścieżkami słowa wybudzającego i push-to-talk.

## Szybka weryfikacja

- Włącz push-to-talk, przytrzymaj Cmd+Fn, powiedz coś, zwolnij: nakładka powinna pokazać częściowe wyniki, a następnie wysłać.
- Podczas przytrzymania uszy na pasku menu powinny pozostać powiększone (używa `triggerVoiceEars(ttl:nil)`); po zwolnieniu wracają do normalnego stanu.
