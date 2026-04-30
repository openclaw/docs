---
read_when:
    - Modyfikowanie potoku mediów lub załączników
summary: Reguły obsługi obrazów i multimediów dla wysyłania, Gateway i odpowiedzi agentów
title: Obsługa obrazów i multimediów
x-i18n:
    generated_at: "2026-04-30T10:03:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb07bc638a755be5597e78c07041a52cfc0297b00d70c5adbfe5f3ad8c1a372
    source_path: nodes/images.md
    workflow: 16
---

# Obsługa obrazów i multimediów (2025-12-05)

Kanał WhatsApp działa przez **Baileys Web**. Ten dokument opisuje bieżące zasady obsługi multimediów dla wysyłania, Gateway i odpowiedzi agentów.

## Cele

- Wysyłanie multimediów z opcjonalnymi podpisami przez `openclaw message send --media`.
- Umożliwienie automatycznym odpowiedziom z webowej skrzynki odbiorczej dołączania multimediów obok tekstu.
- Utrzymanie rozsądnych i przewidywalnych limitów dla poszczególnych typów.

## Powierzchnia CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` opcjonalne; podpis może być pusty dla wysyłek zawierających tylko multimedia.
  - `--dry-run` wypisuje rozwiązany ładunek; `--json` emituje `{ channel, to, messageId, mediaUrl, caption }`.

## Zachowanie kanału WhatsApp Web

- Dane wejściowe: ścieżka pliku lokalnego **lub** URL HTTP(S).
- Przepływ: wczytaj do bufora Buffer, wykryj rodzaj multimediów i zbuduj właściwy ładunek:
  - **Obrazy:** zmiana rozmiaru i ponowna kompresja do JPEG (maksymalny bok 2048 px) z celem `channels.whatsapp.mediaMaxMb` (domyślnie: 50 MB).
  - **Audio/Głos/Wideo:** przekazywanie bez zmian do 16 MB; audio jest wysyłane jako wiadomość głosowa (`ptt: true`).
  - **Dokumenty:** wszystko inne, do 100 MB, z zachowaniem nazwy pliku, gdy jest dostępna.
- Odtwarzanie w stylu GIF w WhatsApp: wyślij MP4 z `gifPlayback: true` (CLI: `--gif-playback`), aby klienci mobilni zapętlali go inline.
- Wykrywanie MIME preferuje magic bytes, następnie nagłówki, a potem rozszerzenie pliku.
- Podpis pochodzi z `--message` lub `reply.text`; pusty podpis jest dozwolony.
- Logowanie: tryb niewerbalny pokazuje `↩️`/`✅`; tryb szczegółowy zawiera rozmiar oraz ścieżkę/URL źródła.

## Potok automatycznej odpowiedzi

- `getReplyFromConfig` zwraca `{ text?, mediaUrl?, mediaUrls? }`.
- Gdy multimedia są obecne, webowy nadawca rozwiązuje lokalne ścieżki lub adresy URL przy użyciu tego samego potoku co `openclaw message send`.
- Wiele wpisów multimedialnych, jeśli podane, jest wysyłanych sekwencyjnie.

## Multimedia przychodzące do poleceń (Pi)

- Gdy przychodzące wiadomości webowe zawierają multimedia, OpenClaw pobiera je do pliku tymczasowego i udostępnia zmienne szablonów:
  - `{{MediaUrl}}` pseudo-URL dla przychodzących multimediów.
  - `{{MediaPath}}` lokalna ścieżka tymczasowa zapisana przed uruchomieniem polecenia.
- Gdy włączona jest piaskownica Docker dla sesji, przychodzące multimedia są kopiowane do obszaru roboczego piaskownicy, a `MediaPath`/`MediaUrl` są przepisywane na ścieżkę względną, taką jak `media/inbound/<filename>`.
- Rozumienie multimediów (jeśli skonfigurowane przez `tools.media.*` lub współdzielone `tools.media.models`) uruchamia się przed szablonowaniem i może wstawiać bloki `[Image]`, `[Audio]` oraz `[Video]` do `Body`.
  - Audio ustawia `{{Transcript}}` i używa transkrypcji do parsowania poleceń, aby polecenia slash nadal działały.
  - Opisy wideo i obrazów zachowują każdy tekst podpisu na potrzeby parsowania poleceń.
  - Jeśli aktywny główny model obrazów już natywnie obsługuje widzenie, OpenClaw pomija blok podsumowania `[Image]` i zamiast tego przekazuje oryginalny obraz do modelu.
- Domyślnie przetwarzany jest tylko pierwszy pasujący załącznik obrazu/audio/wideo; ustaw `tools.media.<cap>.attachments`, aby przetwarzać wiele załączników.

## Limity i błędy

**Limity wysyłania wychodzącego (wysyłka przez WhatsApp web)**

- Obrazy: do `channels.whatsapp.mediaMaxMb` (domyślnie: 50 MB) po ponownej kompresji.
- Audio/głos/wideo: limit 16 MB; dokumenty: limit 100 MB.
- Zbyt duże lub nieczytelne multimedia → czytelny błąd w logach, a odpowiedź jest pomijana.

**Limity rozumienia multimediów (transkrypcja/opis)**

- Domyślnie dla obrazu: 10 MB (`tools.media.image.maxBytes`).
- Domyślnie dla audio: 20 MB (`tools.media.audio.maxBytes`).
- Domyślnie dla wideo: 50 MB (`tools.media.video.maxBytes`).
- Zbyt duże multimedia pomijają rozumienie, ale odpowiedzi nadal przechodzą z oryginalną treścią.

## Uwagi do testów

- Obejmij przepływy wysyłania i odpowiedzi dla przypadków obrazu/audio/dokumentu.
- Zweryfikuj ponowną kompresję obrazów (ograniczenie rozmiaru) oraz flagę wiadomości głosowej dla audio.
- Upewnij się, że odpowiedzi z wieloma multimediami rozchodzą się jako sekwencyjne wysyłki.

## Powiązane

- [Przechwytywanie z kamery](/pl/nodes/camera)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Audio i wiadomości głosowe](/pl/nodes/audio)
