---
read_when:
    - Dostrajasz zachowanie nakładki głosowej
summary: Cykl życia nakładki głosowej, gdy wake-word i push-to-talk nachodzą na siebie
title: Nakładka głosowa
x-i18n:
    generated_at: "2026-04-05T14:00:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1efcc26ec05d2f421cb2cf462077d002381995b338d00db77d5fdba9b8d938b6
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Cykl życia nakładki głosowej (macOS)

Odbiorcy: współtwórcy aplikacji macOS. Cel: utrzymać przewidywalne działanie nakładki głosowej, gdy wake-word i push-to-talk nachodzą na siebie.

## Obecna intencja

- Jeśli nakładka jest już widoczna z powodu wake-word, a użytkownik naciśnie hotkey, sesja hotkey _przejmuje_ istniejący tekst zamiast go resetować. Nakładka pozostaje widoczna tak długo, jak długo hotkey jest przytrzymany. Gdy użytkownik puści klawisz: wyślij, jeśli istnieje tekst po `trim`, w przeciwnym razie zamknij.
- Sam wake-word nadal automatycznie wysyła po ciszy; push-to-talk wysyła natychmiast po puszczeniu.

## Zaimplementowane (9 grudnia 2025)

- Sesje nakładki mają teraz token per przechwycenie (wake-word albo push-to-talk). Aktualizacje partial/final/send/dismiss/level są odrzucane, gdy token nie pasuje, co zapobiega nieaktualnym callbackom.
- Push-to-talk przejmuje dowolny widoczny tekst nakładki jako prefiks (więc naciśnięcie hotkey, gdy nakładka wake jest widoczna, zachowuje tekst i dopisuje nową mowę). Czeka do 1,5 s na końcową transkrypcję, po czym wraca do bieżącego tekstu.
- Logowanie chime/nakładki jest emitowane na poziomie `info` w kategoriach `voicewake.overlay`, `voicewake.ptt` i `voicewake.chime` (start sesji, partial, final, send, dismiss, powód chime).

## Kolejne kroki

1. **VoiceSessionCoordinator (actor)**
   - Zarządza dokładnie jedną `VoiceSession` naraz.
   - API (oparte na tokenach): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Odrzuca callbacki niosące nieaktualne tokeny (zapobiega ponownemu otwieraniu nakładki przez stare rozpoznawacze).
2. **VoiceSession (model)**
   - Pola: `token`, `source` (wakeWord|pushToTalk), tekst committed/volatile, flagi chime, timery (auto-send, idle), `overlayMode` (display|editing|sending), termin cooldownu.
3. **Powiązanie nakładki**
   - `VoiceSessionPublisher` (`ObservableObject`) odwzorowuje aktywną sesję do SwiftUI.
   - `VoiceWakeOverlayView` renderuje wyłącznie przez publisher; nigdy nie mutuje bezpośrednio globalnych singletonów.
   - Akcje użytkownika w nakładce (`sendNow`, `dismiss`, `edit`) wywołują callback do coordinatora z tokenem sesji.
4. **Ujednolicona ścieżka wysyłki**
   - Przy `endCapture`: jeśli tekst po trim jest pusty → zamknij; w przeciwnym razie `performSend(session:)` (odtwarza send chime raz, przekazuje dalej, zamyka).
   - Push-to-talk: bez opóźnienia; wake-word: opcjonalne opóźnienie dla auto-send.
   - Zastosuj krótki cooldown do runtime wake po zakończeniu push-to-talk, aby wake-word nie wyzwolił się od razu ponownie.
5. **Logowanie**
   - Coordinator emituje logi `.info` w subsystemie `ai.openclaw`, w kategoriach `voicewake.overlay` i `voicewake.chime`.
   - Kluczowe zdarzenia: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Lista kontrolna debugowania

- Strumieniuj logi podczas odtwarzania problemu z „lepka” nakładką:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Zweryfikuj, że aktywny jest tylko jeden token sesji; nieaktualne callbacki powinny być odrzucane przez coordinator.
- Upewnij się, że puszczenie push-to-talk zawsze wywołuje `endCapture` z aktywnym tokenem; jeśli tekst jest pusty, oczekuj `dismiss` bez chime ani wysyłki.

## Kroki migracji (sugerowane)

1. Dodaj `VoiceSessionCoordinator`, `VoiceSession` i `VoiceSessionPublisher`.
2. Zrefaktoryzuj `VoiceWakeRuntime`, aby tworzył/aktualizował/kończył sesje zamiast bezpośrednio dotykać `VoiceWakeOverlayController`.
3. Zrefaktoryzuj `VoicePushToTalk`, aby przejmował istniejące sesje i wywoływał `endCapture` przy puszczeniu; zastosuj runtime cooldown.
4. Podłącz `VoiceWakeOverlayController` do publishera; usuń bezpośrednie wywołania z runtime/PTT.
5. Dodaj testy integracyjne dla przejmowania sesji, cooldownu i zamykania przy pustym tekście.
