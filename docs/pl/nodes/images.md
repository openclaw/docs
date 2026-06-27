---
read_when:
    - Modyfikowanie potoku przetwarzania multimediów lub załączników
summary: Zasady obsługi obrazów i multimediów dla wysyłania, Gateway i odpowiedzi agenta
title: Obsługa obrazów i multimediów
x-i18n:
    generated_at: "2026-06-27T17:45:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeee181cae2798b7d0f5dbe0331c6b09612755b4d796d98baaeaf6989955def5
    source_path: nodes/images.md
    workflow: 16
---

Kanał WhatsApp działa przez **Baileys Web**. Ten dokument opisuje bieżące reguły obsługi multimediów dla wysyłania, Gateway i odpowiedzi agentów.

## Cele

- Wysyłanie multimediów z opcjonalnymi podpisami przez `openclaw message send --media`.
- Umożliwienie automatycznym odpowiedziom ze skrzynki odbiorczej web dołączania multimediów obok tekstu.
- Utrzymanie rozsądnych i przewidywalnych limitów dla poszczególnych typów.

## Interfejs CLI

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` jest opcjonalne; podpis może być pusty przy wysyłaniu samych multimediów.
  - `--dry-run` wypisuje rozwiązany ładunek; `--json` emituje `{ channel, to, messageId, mediaUrl, caption }`.

## Zachowanie kanału WhatsApp Web

- Dane wejściowe: lokalna ścieżka pliku **lub** adres URL HTTP(S).
- Przepływ: wczytaj do Buffer, wykryj rodzaj multimediów i zbuduj właściwy ładunek:
  - **Obrazy:** zmiana rozmiaru i ponowna kompresja do JPEG (maksymalny bok 2048px) z celem `channels.whatsapp.mediaMaxMb` (domyślnie: 50 MB).
  - **Audio/Głos/Wideo:** przekazywanie bez zmian do 16 MB; audio jest wysyłane jako notatka głosowa (`ptt: true`).
  - **Dokumenty:** wszystko inne, do 100 MB, z zachowaniem nazwy pliku, gdy jest dostępna.
- Odtwarzanie w stylu GIF w WhatsApp: wyślij MP4 z `gifPlayback: true` (CLI: `--gif-playback`), aby klienci mobilni zapętlali je inline.
- Wykrywanie MIME preferuje bajty magiczne, potem nagłówki, potem rozszerzenie pliku.
- Podpis pochodzi z `--message` albo `reply.text`; pusty podpis jest dozwolony.
- Logowanie: tryb niewerbose pokazuje `↩️`/`✅`; tryb verbose zawiera rozmiar i ścieżkę/URL źródła.

## Potok automatycznych odpowiedzi

- `getReplyFromConfig` zwraca `{ text?, mediaUrl?, mediaUrls? }`.
- Gdy multimedia są obecne, nadawca web rozwiązuje lokalne ścieżki lub adresy URL przy użyciu tego samego potoku co `openclaw message send`.
- Wiele pozycji multimedialnych jest wysyłanych sekwencyjnie, jeśli zostały podane.

## Multimedia przychodzące do poleceń

- Gdy przychodzące wiadomości web zawierają multimedia, OpenClaw pobiera je do pliku tymczasowego i udostępnia zmienne szablonów:
  - `{{MediaUrl}}` pseudo-URL dla przychodzących multimediów.
  - `{{MediaPath}}` lokalna ścieżka tymczasowa zapisana przed uruchomieniem polecenia.
- Gdy włączona jest piaskownica Docker dla sesji, przychodzące multimedia są kopiowane do obszaru roboczego piaskownicy, a `MediaPath`/`MediaUrl` są przepisywane na ścieżkę względną, taką jak `media/inbound/<filename>`.
- Rozumienie multimediów (jeśli skonfigurowane przez `tools.media.*` lub współdzielone `tools.media.models`) działa przed szablonowaniem i może wstawiać bloki `[Image]`, `[Audio]` i `[Video]` do `Body`.
  - Audio ustawia `{{Transcript}}` i używa transkrypcji do parsowania poleceń, aby polecenia z ukośnikiem nadal działały.
  - Opisy wideo i obrazów zachowują dowolny tekst podpisu na potrzeby parsowania poleceń.
  - Jeśli aktywny główny model obrazów już natywnie obsługuje widzenie, OpenClaw pomija blok podsumowania `[Image]` i zamiast tego przekazuje oryginalny obraz do modelu.
- Domyślnie przetwarzany jest tylko pierwszy pasujący załącznik obrazu/audio/wideo; ustaw `tools.media.<cap>.attachments`, aby przetwarzać wiele załączników.

## Limity i błędy

**Limity wysyłania wychodzącego (wysyłka WhatsApp web)**

- Obrazy: do `channels.whatsapp.mediaMaxMb` (domyślnie: 50 MB) po ponownej kompresji.
- Audio/głos/wideo: limit 16 MB; dokumenty: limit 100 MB.
- Zbyt duże lub nieczytelne multimedia → czytelny błąd w logach, a odpowiedź jest pomijana.

**Limity rozumienia multimediów (transkrypcja/opis)**

- Domyślnie obraz: 10 MB (`tools.media.image.maxBytes`).
- Domyślnie audio: 20 MB (`tools.media.audio.maxBytes`).
- Domyślnie wideo: 50 MB (`tools.media.video.maxBytes`).
- Zbyt duże multimedia pomijają rozumienie, ale odpowiedzi nadal przechodzą z oryginalną treścią.

## Uwagi do testów

- Obejmij przepływy wysyłania i odpowiedzi dla przypadków obrazu/audio/dokumentu.
- Zweryfikuj ponowną kompresję obrazów (ograniczenie rozmiaru) i flagę notatki głosowej dla audio.
- Upewnij się, że odpowiedzi z wieloma multimediami rozsyłają się jako sekwencyjne wysyłki.

## Powiązane

- [Przechwytywanie z kamery](/pl/nodes/camera)
- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Audio i notatki głosowe](/pl/nodes/audio)
