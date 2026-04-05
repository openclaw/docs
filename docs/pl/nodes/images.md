---
read_when:
    - Modyfikujesz potok mediów lub załączniki
summary: Zasady obsługi obrazów i mediów dla send, gateway i odpowiedzi agentów
title: Obsługa obrazów i mediów
x-i18n:
    generated_at: "2026-04-05T13:58:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3bb372b45a3bae51eae03b41cb22c4cde144675a54ddfd12e01a96132e48a8a
    source_path: nodes/images.md
    workflow: 15
---

# Obsługa obrazów i mediów (2025-12-05)

Kanał WhatsApp działa przez **Baileys Web**. Ten dokument opisuje bieżące zasady obsługi mediów dla send, gateway i odpowiedzi agentów.

## Cele

- Wysyłanie mediów z opcjonalnymi podpisami przez `openclaw message send --media`.
- Umożliwienie, aby automatyczne odpowiedzi ze skrzynki web zawierały media obok tekstu.
- Utrzymanie sensownych i przewidywalnych limitów dla poszczególnych typów.

## Powierzchnia CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` jest opcjonalne; podpis może być pusty dla wysyłek zawierających tylko media.
  - `--dry-run` wypisuje rozwiązany ładunek; `--json` emituje `{ channel, to, messageId, mediaUrl, caption }`.

## Zachowanie kanału WhatsApp Web

- Wejście: lokalna ścieżka pliku **albo** URL HTTP(S).
- Przepływ: załaduj do Buffer, wykryj rodzaj medium i zbuduj poprawny ładunek:
  - **Obrazy:** zmiana rozmiaru i ponowna kompresja do JPEG (maksymalny bok 2048 px) z celem `channels.whatsapp.mediaMaxMb` (domyślnie: 50 MB).
  - **Audio/Voice/Video:** przekazywanie bez zmian do 16 MB; audio jest wysyłane jako voice note (`ptt: true`).
  - **Documents:** wszystko inne, do 100 MB, z zachowaniem nazwy pliku, jeśli jest dostępna.
- Odtwarzanie w stylu GIF w WhatsApp: wyślij MP4 z `gifPlayback: true` (CLI: `--gif-playback`), aby klienci mobilni zapętlali odtwarzanie inline.
- Wykrywanie MIME preferuje magic bytes, potem nagłówki, a następnie rozszerzenie pliku.
- Podpis pochodzi z `--message` lub `reply.text`; pusty podpis jest dozwolony.
- Logowanie: bez trybu verbose pokazuje `↩️`/`✅`; w trybie verbose zawiera rozmiar i źródłową ścieżkę/URL.

## Potok automatycznych odpowiedzi

- `getReplyFromConfig` zwraca `{ text?, mediaUrl?, mediaUrls? }`.
- Gdy obecne są media, nadawca web rozwiązuje lokalne ścieżki lub URL przy użyciu tego samego potoku co `openclaw message send`.
- Jeśli podano wiele wpisów mediów, są wysyłane kolejno.

## Media przychodzące do poleceń (Pi)

- Gdy przychodzące wiadomości web zawierają media, OpenClaw pobiera je do pliku tymczasowego i udostępnia zmienne szablonów:
  - `{{MediaUrl}}` pseudo-URL dla przychodzącego medium.
  - `{{MediaPath}}` lokalna ścieżka tymczasowa zapisana przed uruchomieniem polecenia.
- Gdy włączony jest Docker sandbox per sesja, przychodzące media są kopiowane do workspace sandboxa, a `MediaPath`/`MediaUrl` są przepisywane do ścieżki względnej, takiej jak `media/inbound/<filename>`.
- Media understanding (jeśli skonfigurowane przez `tools.media.*` lub współdzielone `tools.media.models`) działa przed templatingiem i może wstawiać bloki `[Image]`, `[Audio]` i `[Video]` do `Body`.
  - Audio ustawia `{{Transcript}}` i używa transkryptu do parsowania poleceń, dzięki czemu slash commands nadal działają.
  - Opisy wideo i obrazów zachowują tekst podpisu do parsowania poleceń.
  - Jeśli aktywny główny model obrazu już natywnie obsługuje vision, OpenClaw pomija blok podsumowania `[Image]` i zamiast tego przekazuje modelowi oryginalny obraz.
- Domyślnie przetwarzany jest tylko pierwszy pasujący załącznik obrazu/audio/wideo; ustaw `tools.media.<cap>.attachments`, aby przetwarzać wiele załączników.

## Limity i błędy

**Limity wysyłki wychodzącej (wysyłka przez WhatsApp web)**

- Obrazy: do `channels.whatsapp.mediaMaxMb` (domyślnie: 50 MB) po ponownej kompresji.
- Audio/voice/video: limit 16 MB; documents: 100 MB.
- Zbyt duże lub nieczytelne media → czytelny błąd w logach, a odpowiedź jest pomijana.

**Limity media understanding (transkrypcja/opis)**

- Domyślnie dla obrazów: 10 MB (`tools.media.image.maxBytes`).
- Domyślnie dla audio: 20 MB (`tools.media.audio.maxBytes`).
- Domyślnie dla wideo: 50 MB (`tools.media.video.maxBytes`).
- Zbyt duże media pomijają understanding, ale odpowiedzi nadal przechodzą z oryginalnym `Body`.

## Uwagi do testów

- Obejmij testami przepływy send + reply dla przypadków image/audio/document.
- Zweryfikuj ponowną kompresję obrazów (ograniczenie rozmiaru) oraz flagę voice note dla audio.
- Upewnij się, że odpowiedzi z wieloma mediami są rozsyłane jako kolejne wysyłki.
