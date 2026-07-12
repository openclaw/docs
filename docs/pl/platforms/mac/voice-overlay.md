---
read_when:
    - Dostosowywanie działania nakładki głosowej
summary: Cykl życia nakładki głosowej przy nakładaniu się aktywacji słowem wybudzającym i funkcji „naciśnij, aby mówić”
title: Nakładka głosowa
x-i18n:
    generated_at: "2026-07-12T15:21:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# Cykl życia nakładki głosowej (macOS)

Odbiorcy: współtwórcy aplikacji na macOS. Cel: zapewnienie przewidywalnego działania nakładki głosowej, gdy aktywacja słowem wybudzającym i funkcja „naciśnij, aby mówić” nakładają się na siebie.

## Działanie

- Jeśli nakładka jest już widoczna po aktywacji słowem wybudzającym, a użytkownik naciśnie klawisz skrótu, sesja funkcji „naciśnij, aby mówić” przejmuje istniejący tekst zamiast go resetować. Nakładka pozostaje widoczna, dopóki klawisz skrótu jest przytrzymywany. Po zwolnieniu: tekst jest wysyłany, jeśli po usunięciu zbędnych białych znaków nie jest pusty; w przeciwnym razie nakładka jest zamykana.
- Samo słowo wybudzające nadal powoduje automatyczne wysłanie po wykryciu ciszy; funkcja „naciśnij, aby mówić” wysyła tekst natychmiast po zwolnieniu klawisza.

## Implementacja

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) jest jedynym właścicielem aktywnej sesji głosowej. Jest singletonem `@MainActor @Observable`, a nie aktorem. API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`. Każda sesja zawiera token `UUID`; wywołania z nieaktualnym lub niezgodnym tokenem są odrzucane.
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) renderuje nakładkę i przekazuje działania użytkownika (`requestSend`, `dismiss`) z powrotem do koordynatora za pośrednictwem tokenu sesji. Nigdy nie jest właścicielem stanu sesji.
- Funkcja „naciśnij, aby mówić” (`VoicePushToTalk.begin()`) przejmuje tekst z każdej widocznej nakładki jako `adoptedPrefix` (za pośrednictwem `VoiceSessionCoordinator.shared.snapshot()`), dzięki czemu naciśnięcie klawisza skrótu, gdy nakładka aktywowana słowem wybudzającym jest widoczna, zachowuje tekst i dołącza nową wypowiedź. Po zwolnieniu klawisza funkcja czeka do 1,5 s na ostateczną transkrypcję, a następnie w razie jej braku używa bieżącego tekstu.
- Po wywołaniu `dismiss` nakładka wywołuje `VoiceSessionCoordinator.overlayDidDismiss`, co uruchamia `VoiceWakeRuntime.refresh(state:)`, dzięki czemu ręczne zamknięcie przyciskiem X, zamknięcie z powodu pustego tekstu i zamknięcie po wysłaniu wznawiają nasłuchiwanie słowa wybudzającego.
- Ujednolicona ścieżka wysyłania: jeśli tekst po usunięciu zbędnych białych znaków jest pusty, nakładka zostaje zamknięta; w przeciwnym razie `sendNow` jednokrotnie odtwarza sygnał wysłania, przekazuje tekst za pośrednictwem `VoiceWakeForwarder`, a następnie zamyka nakładkę.

## Rejestrowanie zdarzeń

Podsystem głosowy to `ai.openclaw`; każdy komponent rejestruje zdarzenia we własnej kategorii:

| Kategoria               | Komponent                                       |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | Klawisz skrótu i rejestrowanie funkcji „naciśnij, aby mówić” |
| `voicewake.runtime`     | Środowisko uruchomieniowe słowa wybudzającego   |
| `voicewake.chime`       | Odtwarzanie sygnału dźwiękowego                  |
| `voicewake.sync`        | Synchronizacja ustawień globalnych               |
| `voicewake.forward`     | Przekazywanie transkrypcji                       |
| `voicewake.meter`       | Monitor poziomu mikrofonu                        |

## Lista kontrolna debugowania

- Wyświetlaj strumień dzienników podczas odtwarzania problemu z nakładką, która nie znika:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- Sprawdź, czy aktywny jest tylko jeden token sesji; nieaktualne wywołania zwrotne są odrzucane przez koordynatora.
- Potwierdź, że zwolnienie klawisza funkcji „naciśnij, aby mówić” zawsze wywołuje `end()` z aktywnym tokenem; jeśli tekst jest pusty, oczekiwane jest zamknięcie bez sygnału dźwiękowego ani wysyłania.

## Powiązane

- [Aplikacja na macOS](/pl/platforms/macos)
- [Aktywacja głosowa (macOS)](/pl/platforms/mac/voicewake)
- [Tryb rozmowy](/pl/nodes/talk)
