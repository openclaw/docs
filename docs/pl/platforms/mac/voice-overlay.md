---
read_when:
    - Dostosowywanie zachowania nakładki głosowej
summary: Cykl życia nakładki głosowej, gdy nakładają się wybudzanie słowem kluczowym i push-to-talk
title: Nakładka głosowa
x-i18n:
    generated_at: "2026-04-24T09:21:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ae98afad57dffe73e2c878eef4f3253e4464d68cadf531e9239b017cc160f28
    source_path: platforms/mac/voice-overlay.md
    workflow: 15
---

# Cykl życia nakładki głosowej (macOS)

Odbiorcy: współtwórcy aplikacji macOS. Cel: utrzymanie przewidywalności nakładki głosowej, gdy nakładają się wybudzanie słowem kluczowym i push-to-talk.

## Obecny zamiar

- Jeśli nakładka jest już widoczna z powodu wybudzenia słowem kluczowym i użytkownik naciśnie skrót klawiszowy, sesja skrótu _przejmuje_ istniejący tekst zamiast go resetować. Nakładka pozostaje widoczna, dopóki skrót jest przytrzymany. Gdy użytkownik puści: wyślij, jeśli istnieje przycięty tekst, w przeciwnym razie zamknij.
- Samo wybudzenie słowem kluczowym nadal wysyła automatycznie po ciszy; push-to-talk wysyła natychmiast po puszczeniu.

## Zaimplementowane (9 grudnia 2025)

- Sesje nakładki mają teraz token per przechwycenie (wybudzenie słowem kluczowym lub push-to-talk). Aktualizacje partial/final/send/dismiss/level są odrzucane, gdy token się nie zgadza, co zapobiega przestarzałym callbackom.
- Push-to-talk przejmuje dowolny widoczny tekst nakładki jako prefiks (więc naciśnięcie skrótu, gdy widoczna jest nakładka wybudzenia, zachowuje tekst i dopisuje nową mowę). Czeka do 1,5 s na końcową transkrypcję, po czym używa fallbacku do bieżącego tekstu.
- Logowanie chime/nakładki jest emitowane na poziomie `info` w kategoriach `voicewake.overlay`, `voicewake.ptt` i `voicewake.chime` (start sesji, partial, final, send, dismiss, powód chime).

## Następne kroki

1. **VoiceSessionCoordinator (aktor)**
   - Zarządza dokładnie jedną `VoiceSession` naraz.
   - API (oparte na tokenach): `beginWakeCapture`, `beginPushToTalk`, `updatePartial`, `endCapture`, `cancel`, `applyCooldown`.
   - Odrzuca callbacki zawierające przestarzałe tokeny (zapobiega ponownemu otwieraniu nakładki przez stare rozpoznawanie).
2. **VoiceSession (model)**
   - Pola: `token`, `source` (wakeWord|pushToTalk), tekst committed/volatile, flagi chime, timery (auto-send, idle), `overlayMode` (display|editing|sending), deadline cooldown.
3. **Powiązanie nakładki**
   - `VoiceSessionPublisher` (`ObservableObject`) odzwierciedla aktywną sesję do SwiftUI.
   - `VoiceWakeOverlayView` renderuje wyłącznie przez publisher; nigdy nie mutuje bezpośrednio globalnych singletonów.
   - Akcje użytkownika nakładki (`sendNow`, `dismiss`, `edit`) wywołują coordinator z tokenem sesji.
4. **Ujednolicona ścieżka wysyłania**
   - Przy `endCapture`: jeśli przycięty tekst jest pusty → zamknij; w przeciwnym razie `performSend(session:)` (odtwarza send chime raz, przekazuje dalej, zamyka).
   - Push-to-talk: bez opóźnienia; wybudzanie słowem kluczowym: opcjonalne opóźnienie dla auto-send.
   - Zastosuj krótki cooldown do runtime wybudzania po zakończeniu push-to-talk, aby słowo kluczowe nie wyzwoliło się natychmiast ponownie.
5. **Logowanie**
   - Coordinator emituje logi `.info` w subsystemie `ai.openclaw`, kategorie `voicewake.overlay` i `voicewake.chime`.
   - Kluczowe zdarzenia: `session_started`, `adopted_by_push_to_talk`, `partial`, `finalized`, `send`, `dismiss`, `cancel`, `cooldown`.

## Lista kontrolna debugowania

- Strumieniuj logi podczas odtwarzania „lepkiej” nakładki:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Potwierdź, że aktywny jest tylko jeden token sesji; przestarzałe callbacki powinny być odrzucane przez coordinator.
- Upewnij się, że puszczenie push-to-talk zawsze wywołuje `endCapture` z aktywnym tokenem; jeśli tekst jest pusty, oczekuj `dismiss` bez chime i bez wysyłania.

## Kroki migracji (sugestia)

1. Dodaj `VoiceSessionCoordinator`, `VoiceSession` i `VoiceSessionPublisher`.
2. Zrefaktoryzuj `VoiceWakeRuntime`, aby tworzył/aktualizował/kończył sesje zamiast bezpośrednio dotykać `VoiceWakeOverlayController`.
3. Zrefaktoryzuj `VoicePushToTalk`, aby przejmował istniejące sesje i wywoływał `endCapture` przy puszczeniu; zastosuj cooldown runtime.
4. Podłącz `VoiceWakeOverlayController` do publishera; usuń bezpośrednie wywołania z runtime/PTT.
5. Dodaj testy integracyjne dla przejmowania sesji, cooldown i zamykania przy pustym tekście.

## Powiązane

- [Aplikacja macOS](/pl/platforms/macos)
- [Voice wake (macOS)](/pl/platforms/mac/voicewake)
- [Talk mode](/pl/nodes/talk)
