---
read_when:
    - Praca nad ścieżkami wybudzania głosowego lub PTT
summary: Tryby budzenia głosowego i „naciśnij, aby mówić” oraz szczegóły routingu w aplikacji na Maca
title: Aktywacja głosowa (macOS)
x-i18n:
    generated_at: "2026-05-06T09:22:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 312895b5767c447233bd77cbcd48ea81bb6c700080abc31974188b610a1b1ef0
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Wybudzanie głosem i naciśnij, aby mówić

## Tryby

- **Tryb słowa wybudzającego** (domyślny): zawsze włączony rozpoznawacz mowy czeka na tokeny wyzwalające (`swabbleTriggerWords`). Po dopasowaniu rozpoczyna przechwytywanie, pokazuje nakładkę z częściowym tekstem i automatycznie wysyła po ciszy.
- **Naciśnij, aby mówić (przytrzymanie prawego Option)**: przytrzymaj prawy klawisz Option, aby natychmiast rozpocząć przechwytywanie — bez potrzeby użycia wyzwalacza. Nakładka pojawia się podczas przytrzymania; zwolnienie finalizuje i przekazuje tekst po krótkim opóźnieniu, aby można było go dopracować.

## Zachowanie w czasie działania (słowo wybudzające)

- Rozpoznawacz mowy działa w `VoiceWakeRuntime`.
- Wyzwalacz uruchamia się tylko wtedy, gdy między słowem wybudzającym a następnym słowem występuje **znacząca pauza** (przerwa ok. 0,55 s). Nakładka/dźwięk może rozpocząć się na pauzie, jeszcze zanim zacznie się polecenie.
- Okna ciszy: 2,0 s, gdy mowa trwa, 5,0 s, jeśli usłyszano tylko wyzwalacz.
- Twarde zatrzymanie: 120 s, aby zapobiec niekontrolowanym sesjom.
- Debounce między sesjami: 350 ms.
- Nakładka jest sterowana przez `VoiceWakeOverlayController` z kolorowaniem zatwierdzonym/ulotnym.
- Po wysłaniu rozpoznawacz uruchamia się ponownie w czysty sposób, aby nasłuchiwać następnego wyzwalacza.

## Niezmienniki cyklu życia

- Jeśli wybudzanie głosem jest włączone, a uprawnienia zostały przyznane, rozpoznawacz słowa wybudzającego powinien nasłuchiwać (z wyjątkiem jawnego przechwytywania w trybie naciśnij, aby mówić).
- Widoczność nakładki (w tym ręczne zamknięcie przyciskiem X) nigdy nie może uniemożliwiać wznowienia działania rozpoznawacza.

## Tryb awarii przyklejonej nakładki (wcześniej)

Wcześniej, jeśli nakładka utknęła jako widoczna i została ręcznie zamknięta, wybudzanie głosem mogło wyglądać na „martwe”, ponieważ próba ponownego uruchomienia środowiska działania mogła zostać zablokowana przez widoczność nakładki i nie planowano kolejnego ponownego uruchomienia.

Utwardzenie:

- Ponowne uruchomienie środowiska działania wybudzania nie jest już blokowane przez widoczność nakładki.
- Zakończenie zamykania nakładki wyzwala `VoiceWakeRuntime.refresh(...)` przez `VoiceSessionCoordinator`, więc ręczne zamknięcie przyciskiem X zawsze wznawia nasłuchiwanie.

## Szczegóły trybu naciśnij, aby mówić

- Wykrywanie skrótu używa globalnego monitora `.flagsChanged` dla **prawego Option** (`keyCode 61` + `.option`). Tylko obserwujemy zdarzenia (bez ich przechwytywania).
- Potok przechwytywania działa w `VoicePushToTalk`: natychmiast uruchamia mowę, strumieniuje częściowe wyniki do nakładki i wywołuje `VoiceWakeForwarder` po zwolnieniu.
- Gdy tryb naciśnij, aby mówić się uruchamia, wstrzymujemy środowisko działania słowa wybudzającego, aby uniknąć rywalizujących zaczepów audio; uruchamia się ono ponownie automatycznie po zwolnieniu.
- Uprawnienia: wymaga mikrofonu i mowy; odbieranie zdarzeń wymaga zgody na dostępność/monitorowanie wejścia.
- Klawiatury zewnętrzne: niektóre mogą nie udostępniać prawego Option zgodnie z oczekiwaniami — zaoferuj zapasowy skrót, jeśli użytkownicy zgłaszają pominięcia.

## Ustawienia widoczne dla użytkownika

- Przełącznik **Wybudzanie głosem**: włącza środowisko działania słowa wybudzającego.
- **Przytrzymaj Cmd+Fn, aby mówić**: włącza monitor trybu naciśnij, aby mówić. Wyłączone na macOS < 26.
- Selektory języka i mikrofonu, aktywny miernik poziomu, tabela słów wyzwalających, tester (tylko lokalny; nie przekazuje dalej).
- Selektor mikrofonu zachowuje ostatni wybór, jeśli urządzenie zostanie odłączone, pokazuje wskazówkę o odłączeniu i tymczasowo przełącza się na domyślne urządzenie systemowe, dopóki nie wróci.
- **Dźwięki**: dzwonki przy wykryciu wyzwalacza i przy wysłaniu; domyślnie systemowy dźwięk macOS „Glass”. Dla każdego zdarzenia można wybrać dowolny plik możliwy do załadowania przez `NSSound` (np. MP3/WAV/AIFF) albo wybrać **Brak dźwięku**.

## Zachowanie przekazywania

- Gdy wybudzanie głosem jest włączone, transkrypcje są przekazywane do aktywnego gatewaya/agenta (ten sam tryb lokalny lub zdalny, którego używa reszta aplikacji na Maca).
- Odpowiedzi są dostarczane do **ostatnio używanego głównego dostawcy** (WhatsApp/Telegram/Discord/WebChat). Jeśli dostarczenie się nie powiedzie, błąd jest rejestrowany, a uruchomienie nadal jest widoczne przez WebChat/logi sesji.

## Ładunek przekazywania

- `VoiceWakeForwarder.prefixedTranscript(_:)` dodaje podpowiedź maszyny przed wysłaniem. Współdzielone między ścieżkami słowa wybudzającego i naciśnij, aby mówić.

## Szybka weryfikacja

- Włącz tryb naciśnij, aby mówić, przytrzymaj Cmd+Fn, powiedz coś, zwolnij: nakładka powinna pokazać częściowe wyniki, a następnie wysłać.
- Podczas przytrzymywania uszy na pasku menu powinny pozostać powiększone (używa `triggerVoiceEars(ttl:nil)`); wracają po zwolnieniu.

## Powiązane

- [Wybudzanie głosem](/pl/nodes/voicewake)
- [Nakładka głosowa](/pl/platforms/mac/voice-overlay)
- [Aplikacja macOS](/pl/platforms/macos)
