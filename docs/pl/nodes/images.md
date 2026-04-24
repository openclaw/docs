---
read_when:
    - Modyfikowanie potoku multimediów lub załączników
summary: Zasady obsługi obrazów i multimediów dla wysyłania, gateway i odpowiedzi agenta
title: Obsługa obrazów i multimediów
x-i18n:
    generated_at: "2026-04-24T09:18:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26fa460f7dcdac9f15c9d79c3c3370adbce526da5cfa9a6825a8ed20b41e0a29
    source_path: nodes/images.md
    workflow: 15
---

# Obsługa obrazów i multimediów (2025-12-05)

Kanał WhatsApp działa przez **Baileys Web**. Ten dokument opisuje bieżące zasady obsługi multimediów dla wysyłania, gateway i odpowiedzi agenta.

## Cele

- Wysyłanie multimediów z opcjonalnymi podpisami przez `openclaw message send --media`.
- Umożliwienie, aby automatyczne odpowiedzi z web inbox mogły zawierać multimedia obok tekstu.
- Utrzymanie rozsądnych i przewidywalnych limitów per typ.

## Powierzchnia CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` jest opcjonalne; podpis może być pusty dla wysyłek wyłącznie multimedialnych.
  - `--dry-run` drukuje rozwiązany ładunek; `--json` emituje `{ channel, to, messageId, mediaUrl, caption }`.

## Zachowanie kanału WhatsApp Web

- Wejście: lokalna ścieżka pliku **albo** URL HTTP(S).
- Przepływ: wczytanie do Buffer, wykrycie rodzaju multimediów i zbudowanie właściwego ładunku:
  - **Obrazy:** zmiana rozmiaru i ponowna kompresja do JPEG (maksymalny bok 2048 px) z celem `channels.whatsapp.mediaMaxMb` (domyślnie: 50 MB).
  - **Audio/Voice/Wideo:** przekazanie bez zmian do 16 MB; audio jest wysyłane jako notatka głosowa (`ptt: true`).
  - **Dokumenty:** wszystko inne, do 100 MB, z zachowaniem nazwy pliku, jeśli jest dostępna.
- Odtwarzanie w stylu GIF w WhatsApp: wyślij MP4 z `gifPlayback: true` (CLI: `--gif-playback`), aby klienci mobilni zapętlali odtwarzanie inline.
- Wykrywanie MIME preferuje magic bytes, potem nagłówki, a następnie rozszerzenie pliku.
- Podpis pochodzi z `--message` albo `reply.text`; pusty podpis jest dozwolony.
- Logowanie: bez verbose pokazuje `↩️`/`✅`; tryb verbose zawiera rozmiar i źródłową ścieżkę/URL.

## Potok Auto-Reply

- `getReplyFromConfig` zwraca `{ text?, mediaUrl?, mediaUrls? }`.
- Gdy obecne są multimedia, nadawca web rozwiązuje lokalne ścieżki albo URL-e przy użyciu tego samego potoku co `openclaw message send`.
- Jeśli podano wiele pozycji multimediów, są wysyłane sekwencyjnie.

## Multimedia przychodzące do poleceń (Pi)

- Gdy przychodzące wiadomości web zawierają multimedia, OpenClaw pobiera je do pliku tymczasowego i udostępnia zmienne szablonów:
  - `{{MediaUrl}}` pseudo-URL dla przychodzących multimediów.
  - `{{MediaPath}}` lokalna ścieżka tymczasowa zapisywana przed uruchomieniem polecenia.
- Gdy włączony jest per-session Docker sandbox, przychodzące multimedia są kopiowane do obszaru roboczego sandbox, a `MediaPath`/`MediaUrl` są przepisywane na ścieżkę względną taką jak `media/inbound/<filename>`.
- Rozumienie multimediów (jeśli skonfigurowane przez `tools.media.*` albo współdzielone `tools.media.models`) działa przed szablonowaniem i może wstawiać bloki `[Image]`, `[Audio]` i `[Video]` do `Body`.
  - Audio ustawia `{{Transcript}}` i używa transkryptu do parsowania poleceń, aby polecenia slash nadal działały.
  - Opisy wideo i obrazów zachowują tekst podpisu do parsowania poleceń.
  - Jeśli aktywny podstawowy model obrazów natywnie obsługuje vision, OpenClaw pomija blok podsumowania `[Image]` i zamiast tego przekazuje do modelu oryginalny obraz.
- Domyślnie przetwarzany jest tylko pierwszy pasujący załącznik obrazu/audio/wideo; ustaw `tools.media.<cap>.attachments`, aby przetwarzać wiele załączników.

## Limity i błędy

**Limity wysyłki wychodzącej (wysyłka przez WhatsApp web)**

- Obrazy: do `channels.whatsapp.mediaMaxMb` (domyślnie: 50 MB) po ponownej kompresji.
- Audio/voice/wideo: limit 16 MB; dokumenty: limit 100 MB.
- Multimedia zbyt duże albo nieczytelne → czytelny błąd w logach, a odpowiedź jest pomijana.

**Limity rozumienia multimediów (transkrypcja/opis)**

- Domyślnie obraz: 10 MB (`tools.media.image.maxBytes`).
- Domyślnie audio: 20 MB (`tools.media.audio.maxBytes`).
- Domyślnie wideo: 50 MB (`tools.media.video.maxBytes`).
- Zbyt duże multimedia pomijają rozumienie, ale odpowiedzi nadal przechodzą z oryginalnym `Body`.

## Uwagi dotyczące testów

- Obejmij przepływy wysyłania + odpowiedzi dla przypadków obrazu/audio/dokumentu.
- Zweryfikuj ponowną kompresję obrazów (ograniczenie rozmiaru) i flagę notatki głosowej dla audio.
- Upewnij się, że odpowiedzi z wieloma multimediami są rozsyłane jako sekwencyjne wysyłki.

## Powiązane

- [Przechwytywanie z kamery](/pl/nodes/camera)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Audio i notatki głosowe](/pl/nodes/audio)
