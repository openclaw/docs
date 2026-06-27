---
read_when:
    - Zmiana transkrypcji audio lub obsługi multimediów
summary: Jak przychodzące notatki audio/głosowe są pobierane, transkrybowane i wstrzykiwane do odpowiedzi
title: Notatki audio i głosowe
x-i18n:
    generated_at: "2026-06-27T17:44:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90e66cf76537b090afdcd3a7791b40107ae51d6be89c84fcb14c034e38df875e
    source_path: nodes/audio.md
    workflow: 16
---

## Co działa

- **Rozumienie multimediów (audio)**: Jeśli rozumienie audio jest włączone (lub wykryte automatycznie), OpenClaw:
  1. Lokalizuje pierwszy załącznik audio (ścieżkę lokalną lub URL) i pobiera go w razie potrzeby.
  2. Wymusza `maxBytes` przed wysłaniem do każdego wpisu modelu.
  3. Uruchamia pierwszy kwalifikujący się wpis modelu w kolejności (dostawca lub CLI).
  4. Jeśli zakończy się niepowodzeniem lub zostanie pominięty (rozmiar/limit czasu), próbuje kolejnego wpisu.
  5. Po sukcesie zastępuje `Body` blokiem `[Audio]` i ustawia `{{Transcript}}`.
- **Parsowanie poleceń**: Gdy transkrypcja się powiedzie, `CommandBody`/`RawBody` są ustawiane na transkrypcję, aby polecenia z ukośnikiem nadal działały.
- **Szczegółowe logowanie**: W trybie `--verbose` logujemy, kiedy transkrypcja jest uruchamiana i kiedy zastępuje treść.

## Automatyczne wykrywanie (domyślnie)

Jeśli **nie skonfigurujesz modeli**, a `tools.media.audio.enabled` **nie** jest ustawione na `false`,
OpenClaw wykrywa automatycznie w tej kolejności i zatrzymuje się na pierwszej działającej opcji:

1. **Aktywny model odpowiedzi**, gdy jego dostawca obsługuje rozumienie audio.
2. **Lokalne CLI** (jeśli zainstalowane)
   - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
   - `whisper-cli` (z `whisper-cpp`; używa `WHISPER_CPP_MODEL` lub dołączonego modelu tiny)
   - `whisper` (Python CLI; automatycznie pobiera modele)
3. **Uwierzytelnianie dostawcy**
   - Najpierw próbowane są skonfigurowane wpisy `models.providers.*`, które obsługują audio
   - Kolejność awaryjna dostawców: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Od 2026-05-22 automatyczne wykrywanie Gemini CLI nie jest już obsługiwane dla rozumienia multimediów. Google przenosi użytkowników Gemini CLI do Antigravity CLI; audio powinno używać lokalnej transkrypcji lub transkrypcji dostawcy, a awaryjna obsługa CLI dla obrazów/wideo powinna przejść do Antigravity CLI (`agy`).

Aby wyłączyć automatyczne wykrywanie, ustaw `tools.media.audio.enabled: false`.
Aby dostosować, ustaw `tools.media.audio.models`.
Uwaga: wykrywanie binariów działa na zasadzie najlepszej próby w systemach macOS/Linux/Windows; upewnij się, że CLI jest w `PATH` (rozwijamy `~`), albo ustaw jawny model CLI z pełną ścieżką polecenia.

## Przykłady konfiguracji

### Dostawca + awaryjne CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Tylko dostawca z ograniczaniem według zakresu

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Tylko dostawca (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Tylko dostawca (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Tylko dostawca (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Echo transkrypcji do czatu (opcjonalnie)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Uwagi i limity

- Uwierzytelnianie dostawcy stosuje standardową kolejność uwierzytelniania modeli (profile uwierzytelniania, zmienne środowiskowe, `models.providers.*.apiKey`).
- Szczegóły konfiguracji Groq: [Groq](/pl/providers/groq).
- Deepgram pobiera `DEEPGRAM_API_KEY`, gdy używane jest `provider: "deepgram"`.
- Szczegóły konfiguracji Deepgram: [Deepgram (transkrypcja audio)](/pl/providers/deepgram).
- Szczegóły konfiguracji Mistral: [Mistral](/pl/providers/mistral).
- SenseAudio pobiera `SENSEAUDIO_API_KEY`, gdy używane jest `provider: "senseaudio"`.
- Szczegóły konfiguracji SenseAudio: [SenseAudio](/pl/providers/senseaudio).
- Dostawcy audio mogą nadpisywać `baseUrl`, `headers` i `providerOptions` przez `tools.media.audio`.
- Domyślny limit rozmiaru to 20 MB (`tools.media.audio.maxBytes`). Zbyt duże audio jest pomijane dla tego modelu i próbowany jest kolejny wpis.
- Bardzo małe/puste pliki audio poniżej 1024 bajtów są pomijane przed transkrypcją dostawcy/CLI.
- Domyślne `maxChars` dla audio jest **nieustawione** (pełna transkrypcja). Ustaw `tools.media.audio.maxChars` lub `maxChars` dla pojedynczego wpisu, aby przyciąć wynik.
- Domyślna automatyczna wartość OpenAI to `gpt-4o-mini-transcribe`; ustaw `model: "gpt-4o-transcribe"` dla wyższej dokładności.
- Użyj `tools.media.audio.attachments`, aby przetwarzać wiele notatek głosowych (`mode: "all"` + `maxAttachments`).
- Transkrypcja jest dostępna dla szablonów jako `{{Transcript}}`.
- `tools.media.audio.echoTranscript` jest domyślnie wyłączone; włącz je, aby wysłać potwierdzenie transkrypcji z powrotem do czatu źródłowego przed przetwarzaniem przez agenta.
- `tools.media.audio.echoFormat` dostosowuje tekst echa (placeholder: `{transcript}`).
- stdout CLI jest ograniczony (5 MB); utrzymuj zwięzły wynik CLI.
- `args` CLI powinno używać `{{MediaPath}}` dla ścieżki lokalnego pliku audio. Uruchom `openclaw doctor --fix`, aby zmigrować przestarzałe placeholdery `{input}` ze starszych konfiguracji `audio.transcription.command`.

### Obsługa środowiska proxy

Transkrypcja audio oparta na dostawcy honoruje standardowe zmienne środowiskowe proxy dla ruchu wychodzącego:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Jeśli nie ustawiono zmiennych środowiskowych proxy, używane jest bezpośrednie wyjście. Jeśli konfiguracja proxy jest nieprawidłowa, OpenClaw loguje ostrzeżenie i wraca do bezpośredniego pobierania.

## Wykrywanie wzmianek w grupach

Gdy dla czatu grupowego ustawiono `requireMention: true`, OpenClaw transkrybuje teraz audio **przed** sprawdzeniem wzmianek. Pozwala to przetwarzać notatki głosowe nawet wtedy, gdy zawierają wzmianki.

**Jak to działa:**

1. Jeśli wiadomość głosowa nie ma treści tekstowej, a grupa wymaga wzmianek, OpenClaw wykonuje transkrypcję „preflight”.
2. Transkrypcja jest sprawdzana pod kątem wzorców wzmianek (np. `@BotName`, wyzwalacze emoji).
3. Jeśli wzmianka zostanie znaleziona, wiadomość przechodzi przez pełny potok odpowiedzi.
4. Transkrypcja jest używana do wykrywania wzmianek, aby notatki głosowe mogły przejść bramkę wzmianek.

**Zachowanie awaryjne:**

- Jeśli transkrypcja nie powiedzie się podczas preflight (limit czasu, błąd API itp.), wiadomość jest przetwarzana na podstawie wykrywania wzmianek wyłącznie w tekście.
- Dzięki temu wiadomości mieszane (tekst + audio) nigdy nie są błędnie odrzucane.

**Rezygnacja dla grupy/tematu Telegram:**

- Ustaw `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, aby pominąć kontrole wzmianek w transkrypcji preflight dla tej grupy.
- Ustaw `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, aby nadpisać dla tematu (`true`, aby pominąć, `false`, aby wymusić włączenie).
- Domyślnie `false` (preflight włączony, gdy pasują warunki bramkowania wzmianką).

**Przykład:** Użytkownik wysyła notatkę głosową mówiącą „Hej @Claude, jaka jest pogoda?” w grupie Telegram z `requireMention: true`. Notatka głosowa jest transkrybowana, wzmianka zostaje wykryta, a agent odpowiada.

## Pułapki

- Reguły zakresu używają zasady pierwszego dopasowania. `chatType` jest normalizowane do `direct`, `group` lub `room`.
- Upewnij się, że CLI kończy się kodem 0 i wypisuje zwykły tekst; JSON trzeba przetworzyć przez `jq -r .text`.
- Dla `parakeet-mlx`, jeśli przekażesz `--output-dir`, OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy `--output-format` to `txt` (lub pominięto); formaty wyjściowe inne niż `txt` wracają do parsowania stdout.
- Utrzymuj rozsądne limity czasu (`timeoutSeconds`, domyślnie 60 s), aby uniknąć blokowania kolejki odpowiedzi.
- Transkrypcja preflight przetwarza tylko **pierwszy** załącznik audio na potrzeby wykrywania wzmianek. Dodatkowe audio jest przetwarzane podczas głównej fazy rozumienia multimediów.

## Powiązane

- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Tryb rozmowy](/pl/nodes/talk)
- [Voice wake](/pl/nodes/voicewake)
