---
read_when:
    - Modyfikowanie potoku multimediów lub załączników
summary: Reguły obsługi obrazów i multimediów w odpowiedziach wysyłania, Gateway oraz agenta
title: Obsługa obrazów i multimediów
x-i18n:
    generated_at: "2026-07-12T15:17:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

Kanał WhatsApp działa na Baileys Web. Ta strona opisuje reguły obsługi multimediów podczas wysyłania, w Gateway i w odpowiedziach agenta.

## Cele

- Wysyłanie multimediów z opcjonalnym podpisem za pomocą `openclaw message send --media`.
- Umożliwienie dołączania multimediów obok tekstu do automatycznych odpowiedzi ze skrzynki odbiorczej w interfejsie WWW.
- Utrzymanie rozsądnych i przewidywalnych limitów dla poszczególnych typów.

## Interfejs CLI

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — dołącza multimedia (obraz/dźwięk/film/dokument); akceptuje ścieżki lokalne lub adresy URL. Opcjonalne; podpis może być pusty przy wysyłaniu samych multimediów.
- `--gif-playback` — traktuje film jako animację GIF (tylko WhatsApp).
- `--force-document` — wysyła multimedia jako dokument, aby uniknąć kompresji przez kanał (Telegram, WhatsApp); dotyczy obrazów, plików GIF i filmów.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — opcje dostarczania i wątków współdzielone z wiadomościami zawierającymi tylko tekst.
- `--dry-run` — wyświetla wynikowy ładunek i pomija wysyłanie.
- `--json` — wyświetla wynik jako JSON: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload` zawiera wynik wysyłania specyficzny dla kanału, w tym ewentualne odwołanie do multimediów).

## Zachowanie kanału WhatsApp Web

- Dane wejściowe: lokalna ścieżka do pliku **lub** adres URL HTTP(S).
- Przepływ: wczytanie do bufora, wykrycie rodzaju multimediów, a następnie utworzenie wychodzącego ładunku odpowiedniego dla danego rodzaju:
  - **Obrazy:** optymalizowane tak, aby zmieściły się w limicie `channels.whatsapp.mediaMaxMb` (domyślnie 50 MB). Obrazy bez przezroczystości są ponownie kompresowane do JPEG (domyślna sekwencja rozmiarów boków zaczyna się od 2048 px i maleje przy kolejnych przekroczeniach rozmiaru); obrazy z przezroczystością pozostają w formacie PNG. Jeśli źródło jest już akceptowalnym plikiem JPEG/PNG/WebP mieszczącym się w limitach rozmiaru i długości boku, oryginalne bajty pozostają niezmienione zamiast podlegać ponownej kompresji. Animowane pliki GIF nigdy nie są ponownie kodowane — sprawdzany jest jedynie ich rozmiar.
  - **Dźwięk/wiadomości głosowe:** jeśli dźwięk nie jest już w natywnym formacie wiadomości głosowej (`.ogg`/`.opus` albo `audio/ogg`/`audio/opus`), przed wysłaniem jako wiadomość głosowa (`ptt: true`) jest transkodowany przez `ffmpeg` do Opus/OGG (48 kHz, mono, 64 kb/s, maksymalnie 20 minut).
  - **Filmy:** przekazywane bez zmian do 16 MB.
  - **Dokumenty:** wszystkie pozostałe typy, do 100 MB, z zachowaniem nazwy pliku, jeśli jest dostępna.
- Odtwarzanie w stylu GIF w WhatsApp: wysłanie pliku MP4 z `gifPlayback: true` (CLI: `--gif-playback`), aby klienci mobilni odtwarzali go w pętli bezpośrednio w wiadomości.
- Wykrywanie typu MIME preferuje sygnaturę bajtową, następnie rozszerzenie pliku, a na końcu nagłówki odpowiedzi; ogólny wykryty kontener (`application/octet-stream`, `zip`) nigdy nie zastępuje bardziej szczegółowego mapowania rozszerzenia (na przykład XLSX zamiast ZIP).
- Podpis pochodzi z `--message` lub `reply.text`; pusty podpis jest dozwolony.
- Rejestrowanie: tryb bez szczegółów pokazuje `↩️`/`✅`; tryb szczegółowy obejmuje rozmiar oraz ścieżkę źródłową/adres URL.

<Note>
Podane wyżej wartości 16 MB dla dźwięku i filmu oraz 100 MB dla dokumentów są współdzielonymi domyślnymi limitami dla poszczególnych rodzajów multimediów, używanymi, gdy nie przekazano jawnego limitu bajtów. Wysyłanie przez WhatsApp ustawia jawny limit na podstawie `channels.whatsapp.mediaMaxMb` (domyślnie 50 MB), stosowany jednakowo do wszystkich rodzajów multimediów na danym koncie.
</Note>

## Potok automatycznych odpowiedzi

- `getReplyFromConfig` zwraca ładunek odpowiedzi (lub tablicę ładunków), zawierający między innymi pola `text?`, `mediaUrl?` i `mediaUrls?`.
- Gdy multimedia są obecne, moduł wysyłający w interfejsie WWW rozpoznaje lokalne ścieżki lub adresy URL przy użyciu tego samego potoku co `openclaw message send`.
- Jeśli podano wiele multimediów, są one wysyłane kolejno.

## Multimedia przychodzące w poleceniach

- Gdy przychodzące wiadomości internetowe zawierają multimedia, OpenClaw pobiera je do pliku tymczasowego i udostępnia zmienne szablonu:
  - `{{MediaUrl}}` — pseudoadres URL przychodzącego pliku multimedialnego.
  - `{{MediaPath}}` — lokalna ścieżka tymczasowa zapisywana przed uruchomieniem polecenia.
- Gdy włączona jest osobna piaskownica Docker dla każdej sesji, przychodzące multimedia są kopiowane do przestrzeni roboczej piaskownicy, a `MediaPath`/`MediaUrl` są przekształcane na ścieżkę względną wobec piaskownicy, na przykład `media/inbound/<filename>`.
- Analiza multimediów (skonfigurowana za pomocą `tools.media.*` lub współdzielonego `tools.media.models`) jest wykonywana przed zastosowaniem szablonu i może wstawiać bloki `[Image]`, `[Audio]` i `[Video]` do `Body`.
  - Dźwięk ustawia `{{Transcript}}` i używa transkrypcji do analizy poleceń, dzięki czemu polecenia z ukośnikiem nadal działają.
  - Opisy filmów i obrazów zachowują tekst podpisu na potrzeby analizy poleceń.
  - Jeśli aktywny model główny natywnie obsługuje już analizę obrazu, OpenClaw pomija blok podsumowania `[Image]` i zamiast niego przekazuje modelowi oryginalny obraz.
- Domyślnie przetwarzany jest tylko pierwszy pasujący załącznik obrazu, dźwięku lub filmu; ustaw `tools.media.<capability>.attachments`, aby przetwarzać wiele załączników.

## Limity i błędy

**Limity wysyłania wychodzącego (wysyłanie przez WhatsApp Web)**

- Obrazy: do `channels.whatsapp.mediaMaxMb` (domyślnie 50 MB) po optymalizacji.
- Dźwięk/film: limit 16 MB (współdzielona wartość domyślna; podczas wysyłania przez WhatsApp zastępowana przez `mediaMaxMb`).
- Dokumenty: limit 100 MB (współdzielona wartość domyślna; podczas wysyłania przez WhatsApp zastępowana przez `mediaMaxMb`).
- Multimedia o zbyt dużym rozmiarze lub niemożliwe do odczytania powodują wyświetlenie jednoznacznego błędu w dziennikach, a odpowiedź jest pomijana.

**Limity analizy multimediów (transkrypcja/opis)**

- Domyślny limit obrazu: 10 MB (`tools.media.image.maxBytes`).
- Domyślny limit dźwięku: 20 MB (`tools.media.audio.maxBytes`).
- Domyślny limit filmu: 50 MB (`tools.media.video.maxBytes`).
- Multimedia o zbyt dużym rozmiarze nie są analizowane, ale odpowiedź nadal jest wysyłana z oryginalną treścią.

## Uwagi dotyczące testów

- Uwzględnij przepływy wysyłania i odpowiedzi dla obrazów, dźwięku oraz dokumentów.
- Zweryfikuj limity rozmiaru po optymalizacji obrazu oraz flagę wiadomości głosowej dla dźwięku.
- Upewnij się, że odpowiedzi zawierające wiele multimediów są rozdzielane na kolejne wysyłki.

## Powiązane materiały

- [Przechwytywanie obrazu z kamery](/pl/nodes/camera)
- [Analiza multimediów](/pl/nodes/media-understanding)
- [Dźwięk i wiadomości głosowe](/pl/nodes/audio)
