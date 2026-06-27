---
read_when:
    - Praca nad ścieżkami wybudzania głosowego lub PTT
summary: Tryby wybudzania głosem i push-to-talk oraz szczegóły routingu w aplikacji na Maca
title: Wybudzanie głosowe (macOS)
x-i18n:
    generated_at: "2026-06-27T17:48:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33c6132d03efb837ae06f4810ff87eb981ad742d793657bc607f4ec214bc2afa
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Wybudzanie głosem i push-to-talk

## Wymagania

Wybudzanie głosem i push-to-talk wymagają macOS 26 lub nowszego. W starszych wersjach macOS elementy sterujące są ukryte na stronie ustawień głosu, która pokazuje wymaganie macOS 26.

## Tryby

- **Tryb słowa wybudzającego** (domyślny): zawsze włączony rozpoznawacz mowy czeka na tokeny wyzwalające (`swabbleTriggerWords`). Po dopasowaniu rozpoczyna przechwytywanie, pokazuje nakładkę z tekstem częściowym i automatycznie wysyła po ciszy.
- **Push-to-talk (przytrzymanie prawego Option)**: przytrzymaj prawy klawisz Option, aby natychmiast rozpocząć przechwytywanie — bez potrzeby wyzwalacza. Nakładka jest widoczna podczas przytrzymania; puszczenie finalizuje i przekazuje po krótkim opóźnieniu, aby można było poprawić tekst.

## Zachowanie w czasie działania (słowo wybudzające)

- Rozpoznawacz mowy działa w `VoiceWakeRuntime`.
- Wyzwalacz uruchamia się tylko wtedy, gdy między słowem wybudzającym a następnym słowem występuje **znacząca pauza** (odstęp ok. 0,55 s). Nakładka/dzwonek mogą uruchomić się przy pauzie, nawet zanim rozpocznie się polecenie.
- Okna ciszy: 2,0 s, gdy mowa trwa, 5,0 s, jeśli usłyszano tylko wyzwalacz.
- Twarde zatrzymanie: 120 s, aby zapobiec niekontrolowanym sesjom.
- Debounce między sesjami: 350 ms.
- Nakładka jest sterowana przez `VoiceWakeOverlayController` z kolorowaniem zatwierdzonym/ulotnym.
- Po wysłaniu rozpoznawacz uruchamia się ponownie w czysty sposób, aby nasłuchiwać następnego wyzwalacza.

## Niezmienniki cyklu życia

- Jeśli wybudzanie głosem jest włączone, a uprawnienia zostały przyznane, rozpoznawacz słowa wybudzającego powinien nasłuchiwać (z wyjątkiem jawnego przechwytywania push-to-talk).
- Widoczność nakładki (w tym ręczne odrzucenie przyciskiem X) nigdy nie może uniemożliwiać wznowienia rozpoznawacza.

## Tryb awarii przyklejonej nakładki (poprzednio)

Wcześniej, jeśli nakładka zacięła się jako widoczna i została ręcznie zamknięta, wybudzanie głosem mogło wyglądać na „martwe”, ponieważ próba ponownego uruchomienia w runtime mogła zostać zablokowana przez widoczność nakładki, a kolejne ponowne uruchomienie nie było zaplanowane.

Wzmocnienia:

- Ponowne uruchomienie runtime wybudzania nie jest już blokowane przez widoczność nakładki.
- Zakończenie odrzucania nakładki wyzwala `VoiceWakeRuntime.refresh(...)` przez `VoiceSessionCoordinator`, więc ręczne odrzucenie X zawsze wznawia nasłuchiwanie.

## Szczegóły push-to-talk

- Wykrywanie skrótu klawiszowego używa globalnego monitora `.flagsChanged` dla **prawego Option** (`keyCode 61` + `.option`). Tylko obserwujemy zdarzenia (bez ich przechwytywania).
- Potok przechwytywania działa w `VoicePushToTalk`: natychmiast uruchamia Speech, strumieniuje częściowe wyniki do nakładki i wywołuje `VoiceWakeForwarder` po puszczeniu.
- Gdy push-to-talk się rozpoczyna, wstrzymujemy runtime słowa wybudzającego, aby uniknąć konkurujących punktów przechwytywania audio; uruchamia się ponownie automatycznie po puszczeniu.
- Uprawnienia: wymaga mikrofonu i Speech; widzenie zdarzeń wymaga zgody na Dostępność/Monitorowanie wejścia.
- Klawiatury zewnętrzne: niektóre mogą nie udostępniać prawego Option zgodnie z oczekiwaniami — zaoferuj skrót awaryjny, jeśli użytkownicy zgłaszają pominięcia.

## Ustawienia widoczne dla użytkownika

- Przełącznik **Wybudzanie głosem**: włącza runtime słowa wybudzającego.
- **Przytrzymaj prawy Option, aby mówić**: włącza monitor push-to-talk.
- Selektory języka i mikrofonu, miernik poziomu na żywo, tabela słów wyzwalających, tester (tylko lokalny; nie przekazuje dalej).
- Selektor mikrofonu zachowuje ostatni wybór, jeśli urządzenie zostanie odłączone, pokazuje podpowiedź o odłączeniu i tymczasowo przełącza się na domyślne urządzenie systemowe, dopóki urządzenie nie wróci.
- **Dźwięki**: dzwonki przy wykryciu wyzwalacza i przy wysłaniu; domyślnie systemowy dźwięk macOS „Glass”. Możesz wybrać dowolny plik ładowalny przez `NSSound` (np. MP3/WAV/AIFF) dla każdego zdarzenia albo wybrać **Brak dźwięku**.

## Zachowanie przekazywania

- Gdy wybudzanie głosem jest włączone, transkrypcje są przekazywane do aktywnego gateway/agenta (ten sam tryb lokalny lub zdalny, którego używa reszta aplikacji na Maca).
- Odpowiedzi są dostarczane do **ostatnio używanego głównego dostawcy** (WhatsApp/Telegram/Discord/WebChat). Jeśli dostarczenie się nie powiedzie, błąd jest rejestrowany, a uruchomienie nadal jest widoczne przez WebChat/logi sesji.

## Ładunek przekazywania

- `VoiceWakeForwarder.prefixedTranscript(_:)` dodaje wskazówkę o maszynie przed wysłaniem. Współdzielone między ścieżkami słowa wybudzającego i push-to-talk.

## Szybka weryfikacja

- Włącz push-to-talk, przytrzymaj prawy Option, mów, puść: nakładka powinna pokazać częściowe wyniki, a potem wysłać.
- Podczas przytrzymywania uszy na pasku menu powinny pozostać powiększone (używa `triggerVoiceEars(ttl:nil)`); opadają po puszczeniu.

## Powiązane

- [Wybudzanie głosem](/pl/nodes/voicewake)
- [Nakładka głosowa](/pl/platforms/mac/voice-overlay)
- [Aplikacja macOS](/pl/platforms/macos)
