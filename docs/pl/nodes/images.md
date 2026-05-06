---
read_when:
    - Modyfikowanie potoku mediów lub załączników
summary: Reguły obsługi obrazów i multimediów dla send, Gateway oraz odpowiedzi agenta
title: Obsługa obrazów i multimediów
x-i18n:
    generated_at: "2026-05-06T17:58:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 069140a3ad3bade166d4576ead604b4675006a01e546672872379ce83291471c
    source_path: nodes/images.md
    workflow: 16
---

Kanał WhatsApp działa przez **Baileys Web**. Ten dokument opisuje bieżące reguły obsługi multimediów dla wysyłania, Gateway i odpowiedzi agenta.

## Cele

- Wysyłanie multimediów z opcjonalnymi podpisami przez `openclaw message send --media`.
- Umożliwienie odpowiedzi automatycznych ze skrzynki odbiorczej web z multimediami obok tekstu.
- Utrzymanie rozsądnych i przewidywalnych limitów dla poszczególnych typów.

## Interfejs CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` jest opcjonalne; podpis może być pusty przy wysyłkach zawierających tylko multimedia.
  - `--dry-run` wypisuje rozwiązany ładunek; `--json` emituje `{ channel, to, messageId, mediaUrl, caption }`.

## Zachowanie kanału WhatsApp Web

- Wejście: lokalna ścieżka pliku **lub** URL HTTP(S).
- Przepływ: wczytaj do Buffer, wykryj rodzaj multimediów i zbuduj poprawny ładunek:
  - **Obrazy:** zmień rozmiar i ponownie skompresuj do JPEG (maks. bok 2048px), celując w `channels.whatsapp.mediaMaxMb` (domyślnie: 50 MB).
  - **Audio/Głos/Wideo:** przekazuj bez zmian do 16 MB; audio jest wysyłane jako notatka głosowa (`ptt: true`).
  - **Dokumenty:** wszystko inne, do 100 MB, z zachowaniem nazwy pliku, gdy jest dostępna.
- Odtwarzanie w stylu GIF w WhatsApp: wyślij MP4 z `gifPlayback: true` (CLI: `--gif-playback`), aby klienci mobilni zapętlali je inline.
- Wykrywanie MIME preferuje magic bytes, potem nagłówki, a następnie rozszerzenie pliku.
- Podpis pochodzi z `--message` lub `reply.text`; pusty podpis jest dozwolony.
- Logowanie: tryb niewerbose pokazuje `↩️`/`✅`; tryb verbose zawiera rozmiar i ścieżkę/URL źródła.

## Potok odpowiedzi automatycznej

- `getReplyFromConfig` zwraca `{ text?, mediaUrl?, mediaUrls? }`.
- Gdy występują multimedia, nadawca web rozwiązuje lokalne ścieżki lub URL-e tym samym potokiem co `openclaw message send`.
- Wiele wpisów multimediów, jeśli podano, jest wysyłanych sekwencyjnie.

## Multimedia przychodzące do poleceń (Pi)

- Gdy przychodzące wiadomości web zawierają multimedia, OpenClaw pobiera je do pliku tymczasowego i udostępnia zmienne szablonów:
  - `{{MediaUrl}}` pseudo-URL dla multimediów przychodzących.
  - `{{MediaPath}}` lokalna ścieżka tymczasowa zapisana przed uruchomieniem polecenia.
- Gdy włączona jest sandbox Docker dla sesji, multimedia przychodzące są kopiowane do przestrzeni roboczej sandboxa, a `MediaPath`/`MediaUrl` są przepisywane na ścieżkę względną, taką jak `media/inbound/<filename>`.
- Rozumienie multimediów (jeśli skonfigurowane przez `tools.media.*` lub współdzielone `tools.media.models`) działa przed szablonowaniem i może wstawiać bloki `[Image]`, `[Audio]` oraz `[Video]` do `Body`.
  - Audio ustawia `{{Transcript}}` i używa transkrypcji do parsowania poleceń, dzięki czemu polecenia z ukośnikiem nadal działają.
  - Opisy wideo i obrazów zachowują cały tekst podpisu na potrzeby parsowania poleceń.
  - Jeśli aktywny podstawowy model obrazu obsługuje już natywnie widzenie, OpenClaw pomija blok podsumowania `[Image]` i zamiast tego przekazuje oryginalny obraz do modelu.
- Domyślnie przetwarzany jest tylko pierwszy pasujący załącznik obrazu/audio/wideo; ustaw `tools.media.<cap>.attachments`, aby przetwarzać wiele załączników.

## Limity i błędy

**Limity wysyłki wychodzącej (wysyłanie przez WhatsApp web)**

- Obrazy: do `channels.whatsapp.mediaMaxMb` (domyślnie: 50 MB) po ponownej kompresji.
- Audio/głos/wideo: limit 16 MB; dokumenty: limit 100 MB.
- Zbyt duże lub nieczytelne multimedia → jasny błąd w logach, a odpowiedź jest pomijana.

**Limity rozumienia multimediów (transkrypcja/opis)**

- Domyślnie obraz: 10 MB (`tools.media.image.maxBytes`).
- Domyślnie audio: 20 MB (`tools.media.audio.maxBytes`).
- Domyślnie wideo: 50 MB (`tools.media.video.maxBytes`).
- Zbyt duże multimedia pomijają rozumienie, ale odpowiedzi nadal przechodzą z oryginalną treścią.

## Uwagi do testów

- Obejmij przepływy wysyłania i odpowiedzi dla przypadków obrazu/audio/dokumentu.
- Zweryfikuj ponowną kompresję obrazów (ograniczenie rozmiaru) i flagę notatki głosowej dla audio.
- Upewnij się, że odpowiedzi z wieloma multimediami rozchodzą się jako sekwencyjne wysyłki.

## Powiązane

- [Przechwytywanie z kamery](/pl/nodes/camera)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Audio i notatki głosowe](/pl/nodes/audio)
