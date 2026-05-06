---
read_when:
    - Dostosowywanie zachowania nakładki głosowej
summary: Cykl życia nakładki głosowej, gdy słowo wybudzające i funkcja „naciśnij, aby mówić” nakładają się
title: Nakładka głosowa
x-i18n:
    generated_at: "2026-05-06T09:22:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b30f50512e557bd5a50f0e4e8b7955a847b3b554694347d56638581fcda9514
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Cykl życia nakładki głosowej (macOS)

Odbiorcy: kontrybutorzy aplikacji macOS. Cel: utrzymać przewidywalne działanie nakładki głosowej, gdy słowo wybudzające i tryb naciśnij, aby mówić nakładają się na siebie.

## Obecny zamiar

- Jeśli nakładka jest już widoczna po słowie wybudzającym, a użytkownik naciśnie skrót klawiszowy, sesja skrótu klawiszowego _przejmuje_ istniejący tekst zamiast go resetować. Nakładka pozostaje widoczna, dopóki skrót klawiszowy jest przytrzymywany. Gdy użytkownik go zwolni: wyślij, jeśli istnieje przycięty tekst, w przeciwnym razie odrzuć.
- Samo słowo wybudzające nadal wysyła automatycznie po ciszy; tryb naciśnij, aby mówić wysyła natychmiast po zwolnieniu.

## Wdrożono (9 grudnia 2025)

- Sesje nakładki przenoszą teraz token dla każdego przechwytywania (słowo wybudzające lub tryb naciśnij, aby mówić). Aktualizacje częściowe/końcowe/wysyłania/odrzucania/poziomu są odrzucane, gdy token nie pasuje, co pozwala uniknąć nieaktualnych wywołań zwrotnych.
- Tryb naciśnij, aby mówić przejmuje każdy widoczny tekst nakładki jako prefiks (więc naciśnięcie skrótu klawiszowego, gdy nakładka wybudzania jest widoczna, zachowuje tekst i dopisuje nową wypowiedź). Czeka do 1,5 s na końcową transkrypcję, zanim awaryjnie użyje bieżącego tekstu.
- Logowanie dźwięku/nakładki jest emitowane na poziomie `info` w kategoriach `voicewake.overlay`, `voicewake.ptt` i `voicewake.chime` (start sesji, część, finał, wysłanie, odrzucenie, powód dźwięku).

## Następne kroki

1. **VoiceSessionCoordinator (aktor)**
   - Posiada dokładnie jedną `VoiceSession` naraz.
   - API (oparte na tokenach): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Odrzuca wywołania zwrotne przenoszące nieaktualne tokeny (zapobiega ponownemu otwieraniu nakładki przez stare rozpoznawacze).
2. **VoiceSession (model)**
   - Pola: `token`, `source` (wakeWord|pushToTalk), zatwierdzony/ulotny tekst, flagi dźwięku, timery (automatyczne wysyłanie, bezczynność), `overlayMode` (display|editing|sending), termin końca okresu blokady.
3. **Powiązanie nakładki**
   - `VoiceSessionPublisher` (`ObservableObject`) odzwierciedla aktywną sesję w SwiftUI.
   - `VoiceWakeOverlayView` renderuje tylko przez publisher; nigdy nie modyfikuje globalnych singletonów bezpośrednio.
   - Akcje użytkownika nakładki (`sendNow`, `dismiss`, `edit`) wywołują koordynator z tokenem sesji.
4. **Ujednolicona ścieżka wysyłania**
   - Przy `endCapture`: jeśli przycięty tekst jest pusty → odrzuć; w przeciwnym razie `performSend(session:)` (odtwarza dźwięk wysyłania raz, przekazuje dalej, odrzuca).
   - Tryb naciśnij, aby mówić: bez opóźnienia; słowo wybudzające: opcjonalne opóźnienie dla automatycznego wysyłania.
   - Zastosuj krótki okres blokady do środowiska uruchomieniowego wybudzania po zakończeniu trybu naciśnij, aby mówić, aby słowo wybudzające nie uruchomiło się ponownie natychmiast.
5. **Logowanie**
   - Koordynator emituje logi `.info` w podsystemie `ai.openclaw`, w kategoriach `voicewake.overlay` i `voicewake.chime`.
   - Kluczowe zdarzenia: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Lista kontrolna debugowania

- Strumieniuj logi podczas odtwarzania zacinającej się nakładki:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Zweryfikuj, że aktywny jest tylko jeden token sesji; nieaktualne wywołania zwrotne powinny być odrzucane przez koordynator.
- Upewnij się, że zwolnienie w trybie naciśnij, aby mówić zawsze wywołuje `endCapture` z aktywnym tokenem; jeśli tekst jest pusty, oczekuj `dismiss` bez dźwięku ani wysyłania.

## Kroki migracji (sugerowane)

1. Dodaj `VoiceSessionCoordinator`, `VoiceSession` i `VoiceSessionPublisher`.
2. Zrefaktoryzuj `VoiceWakeRuntime`, aby tworzył/aktualizował/kończył sesje zamiast bezpośrednio dotykać `VoiceWakeOverlayController`.
3. Zrefaktoryzuj `VoicePushToTalk`, aby przejmował istniejące sesje i wywoływał `endCapture` po zwolnieniu; zastosuj okres blokady środowiska uruchomieniowego.
4. Podłącz `VoiceWakeOverlayController` do publishera; usuń bezpośrednie wywołania ze środowiska uruchomieniowego/PTT.
5. Dodaj testy integracyjne dla przejmowania sesji, okresu blokady i odrzucania pustego tekstu.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Wybudzanie głosowe (macOS)](/pl/platforms/mac/voicewake)
- [Tryb rozmowy](/pl/nodes/talk)
