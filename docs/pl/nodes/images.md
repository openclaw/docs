---
read_when:
    - Modyfikowanie potoku mediów lub załączników
summary: Reguły obsługi obrazów i multimediów przy wysyłaniu, w Gateway i w odpowiedziach agenta
title: Obsługa obrazów i multimediów
x-i18n:
    generated_at: "2026-05-06T09:20:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a38224fdf42f32fe206ad8cf3fcc3b06a078b1978d447adeb671fdb3ff4e4b32
    source_path: nodes/images.md
    workflow: 16
---

# Obsługa obrazów i multimediów (2025-12-05)

Kanał WhatsApp działa przez **Baileys Web**. Ten dokument opisuje aktualne reguły obsługi multimediów dla wysyłania, Gateway i odpowiedzi agentów.

## Cele

- Wysyłanie multimediów z opcjonalnymi podpisami przez `openclaw message send --media`.
- Umożliwienie automatycznym odpowiedziom z webowej skrzynki odbiorczej dołączania multimediów obok tekstu.
- Utrzymanie rozsądnych i przewidywalnych limitów dla poszczególnych typów.

## Powierzchnia CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` jest opcjonalne; podpis może być pusty przy wysyłce samych multimediów.
  - `--dry-run` wypisuje rozwiązany ładunek; `--json` emituje `{ channel, to, messageId, mediaUrl, caption }`.

## Zachowanie kanału WhatsApp Web

- Wejście: lokalna ścieżka pliku **lub** URL HTTP(S).
- Przepływ: wczytanie do Buffer, wykrycie rodzaju multimediów i zbudowanie poprawnego ładunku:
  - **Obrazy:** zmiana rozmiaru i ponowna kompresja do JPEG (maksymalny bok 2048 px) z celem `channels.whatsapp.mediaMaxMb` (domyślnie: 50 MB).
  - **Audio/Głos/Wideo:** przekazanie bez zmian do 16 MB; audio jest wysyłane jako notatka głosowa (`ptt: true`).
  - **Dokumenty:** wszystko inne, do 100 MB, z zachowaniem nazwy pliku, gdy jest dostępna.
- Odtwarzanie w stylu GIF w WhatsApp: wyślij MP4 z `gifPlayback: true` (CLI: `--gif-playback`), aby klienci mobilni zapętlali je w treści.
- Wykrywanie MIME preferuje bajty magiczne, potem nagłówki, a następnie rozszerzenie pliku.
- Podpis pochodzi z `--message` lub `reply.text`; pusty podpis jest dozwolony.
- Rejestrowanie: tryb bez szczegółów pokazuje `↩️`/`✅`; tryb szczegółowy zawiera rozmiar i ścieżkę/URL źródła.

## Potok automatycznych odpowiedzi

- `getReplyFromConfig` zwraca `{ text?, mediaUrl?, mediaUrls? }`.
- Gdy multimedia są obecne, webowy nadawca rozwiązuje lokalne ścieżki lub URL-e, używając tego samego potoku co `openclaw message send`.
- Wiele wpisów multimediów, jeśli podano, jest wysyłanych sekwencyjnie.

## Multimedia przychodzące do poleceń (Pi)

- Gdy przychodzące wiadomości webowe zawierają multimedia, OpenClaw pobiera je do pliku tymczasowego i udostępnia zmienne szablonów:
  - `{{MediaUrl}}` pseudo-URL dla multimediów przychodzących.
  - `{{MediaPath}}` lokalna ścieżka tymczasowa zapisana przed uruchomieniem polecenia.
- Gdy włączona jest sesyjna piaskownica Docker, multimedia przychodzące są kopiowane do obszaru roboczego piaskownicy, a `MediaPath`/`MediaUrl` są przepisywane na ścieżkę względną, taką jak `media/inbound/<filename>`.
- Rozumienie multimediów (jeśli skonfigurowane przez `tools.media.*` lub współdzielone `tools.media.models`) działa przed szablonowaniem i może wstawiać bloki `[Image]`, `[Audio]` oraz `[Video]` do `Body`.
  - Audio ustawia `{{Transcript}}` i używa transkrypcji do parsowania poleceń, więc polecenia ukośnikowe nadal działają.
  - Opisy wideo i obrazów zachowują dowolny tekst podpisu na potrzeby parsowania poleceń.
  - Jeśli aktywny główny model obrazu obsługuje już natywnie widzenie, OpenClaw pomija blok podsumowania `[Image]` i zamiast tego przekazuje oryginalny obraz do modelu.
- Domyślnie przetwarzany jest tylko pierwszy pasujący załącznik obrazu/audio/wideo; ustaw `tools.media.<cap>.attachments`, aby przetwarzać wiele załączników.

## Limity i błędy

**Limity wysyłki wychodzącej (wysyłka przez WhatsApp web)**

- Obrazy: do `channels.whatsapp.mediaMaxMb` (domyślnie: 50 MB) po ponownej kompresji.
- Audio/głos/wideo: limit 16 MB; dokumenty: limit 100 MB.
- Zbyt duże lub nieczytelne multimedia → czytelny błąd w logach, a odpowiedź jest pomijana.

**Limity rozumienia multimediów (transkrypcja/opis)**

- Domyślnie obraz: 10 MB (`tools.media.image.maxBytes`).
- Domyślnie audio: 20 MB (`tools.media.audio.maxBytes`).
- Domyślnie wideo: 50 MB (`tools.media.video.maxBytes`).
- Zbyt duże multimedia pomijają rozumienie, ale odpowiedzi nadal przechodzą z oryginalną treścią.

## Uwagi do testów

- Objąć przypadki wysyłki i odpowiedzi dla obrazów/audio/dokumentów.
- Zweryfikować ponowną kompresję obrazów (ograniczenie rozmiaru) i flagę notatki głosowej dla audio.
- Upewnić się, że odpowiedzi z wieloma multimediami rozchodzą się jako sekwencyjne wysyłki.

## Powiązane

- [Przechwytywanie z kamery](/pl/nodes/camera)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Audio i notatki głosowe](/pl/nodes/audio)
