---
read_when:
    - Zmiana transkrypcji audio lub obsługi multimediów
summary: Jak przychodzące audio/notatki głosowe są pobierane, transkrybowane i wstawiane do odpowiedzi
title: Dźwięk i notatki głosowe
x-i18n:
    generated_at: "2026-05-06T09:19:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520620da5a643bb8e17318d7304ae4be3bd2586b0866614ad741685de5b8ef05
    source_path: nodes/audio.md
    workflow: 16
---

# Notatki audio / głosowe (2026-01-17)

## Co działa

- **Rozumienie mediów (audio)**: Jeśli rozumienie audio jest włączone (lub wykryte automatycznie), OpenClaw:
  1. Lokalizuje pierwszy załącznik audio (ścieżka lokalna lub URL) i pobiera go w razie potrzeby.
  2. Wymusza `maxBytes` przed wysłaniem do każdego wpisu modelu.
  3. Uruchamia pierwszy kwalifikujący się wpis modelu w kolejności (dostawca lub CLI).
  4. Jeśli się nie powiedzie albo zostanie pominięty (rozmiar/limit czasu), próbuje następnego wpisu.
  5. Po powodzeniu zastępuje `Body` blokiem `[Audio]` i ustawia `{{Transcript}}`.
- **Parsowanie poleceń**: Gdy transkrypcja się powiedzie, `CommandBody`/`RawBody` są ustawiane na transkrypcję, więc polecenia ukośnikowe nadal działają.
- **Szczegółowe logowanie**: W trybie `--verbose` logujemy, kiedy działa transkrypcja i kiedy zastępuje treść.

## Automatyczne wykrywanie (domyślne)

Jeśli **nie skonfigurujesz modeli**, a `tools.media.audio.enabled` **nie** jest ustawione na `false`,
OpenClaw wykrywa automatycznie w tej kolejności i zatrzymuje się na pierwszej działającej opcji:

1. **Aktywny model odpowiedzi**, gdy jego dostawca obsługuje rozumienie audio.
2. **Lokalne CLI** (jeśli są zainstalowane)
   - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
   - `whisper-cli` (z `whisper-cpp`; używa `WHISPER_CPP_MODEL` albo dołączonego modelu tiny)
   - `whisper` (Python CLI; automatycznie pobiera modele)
3. **Gemini CLI** (`gemini`) przy użyciu `read_many_files`
4. **Uwierzytelnianie dostawcy**
   - Skonfigurowane wpisy `models.providers.*` obsługujące audio są próbowane jako pierwsze
   - Dołączona kolejność awaryjna: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Aby wyłączyć automatyczne wykrywanie, ustaw `tools.media.audio.enabled: false`.
Aby dostosować działanie, ustaw `tools.media.audio.models`.
Uwaga: wykrywanie plików binarnych działa na zasadzie najlepszej próby w systemach macOS/Linux/Windows; upewnij się, że CLI znajduje się w `PATH` (rozwijamy `~`), albo ustaw jawny model CLI z pełną ścieżką polecenia.

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

### Tylko dostawca z ograniczaniem zakresu

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

### Echo transkrypcji na czacie (opcjonalne)

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

## Uwagi i ograniczenia

- Uwierzytelnianie dostawcy stosuje standardową kolejność uwierzytelniania modelu (profile uwierzytelniania, zmienne środowiskowe, `models.providers.*.apiKey`).
- Szczegóły konfiguracji Groq: [Groq](/pl/providers/groq).
- Deepgram pobiera `DEEPGRAM_API_KEY`, gdy używane jest `provider: "deepgram"`.
- Szczegóły konfiguracji Deepgram: [Deepgram (transkrypcja audio)](/pl/providers/deepgram).
- Szczegóły konfiguracji Mistral: [Mistral](/pl/providers/mistral).
- SenseAudio pobiera `SENSEAUDIO_API_KEY`, gdy używane jest `provider: "senseaudio"`.
- Szczegóły konfiguracji SenseAudio: [SenseAudio](/pl/providers/senseaudio).
- Dostawcy audio mogą nadpisywać `baseUrl`, `headers` i `providerOptions` przez `tools.media.audio`.
- Domyślny limit rozmiaru to 20MB (`tools.media.audio.maxBytes`). Zbyt duże audio jest pomijane dla danego modelu i próbowany jest następny wpis.
- Bardzo małe/puste pliki audio poniżej 1024 bajtów są pomijane przed transkrypcją dostawcy/CLI.
- Domyślne `maxChars` dla audio jest **nieustawione** (pełna transkrypcja). Ustaw `tools.media.audio.maxChars` albo `maxChars` dla wpisu, aby przyciąć wynik.
- Domyślny automatyczny model OpenAI to `gpt-4o-mini-transcribe`; ustaw `model: "gpt-4o-transcribe"` dla większej dokładności.
- Użyj `tools.media.audio.attachments`, aby przetwarzać wiele notatek głosowych (`mode: "all"` + `maxAttachments`).
- Transkrypcja jest dostępna dla szablonów jako `{{Transcript}}`.
- `tools.media.audio.echoTranscript` jest domyślnie wyłączone; włącz je, aby wysyłać potwierdzenie transkrypcji z powrotem do czatu źródłowego przed przetwarzaniem przez agenta.
- `tools.media.audio.echoFormat` dostosowuje tekst echa (placeholder: `{transcript}`).
- stdout CLI jest ograniczony (5MB); utrzymuj wynik CLI zwięzły.
- `args` CLI powinno używać `{{MediaPath}}` dla lokalnej ścieżki pliku audio. Uruchom `openclaw doctor --fix`, aby zmigrować przestarzałe placeholdery `{input}` ze starszych konfiguracji `audio.transcription.command`.

### Obsługa środowiska proxy

Transkrypcja audio oparta na dostawcy respektuje standardowe wychodzące zmienne środowiskowe proxy:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Jeśli nie ustawiono zmiennych środowiskowych proxy, używane jest bezpośrednie połączenie wychodzące. Jeśli konfiguracja proxy jest nieprawidłowa, OpenClaw loguje ostrzeżenie i wraca do bezpośredniego pobierania.

## Wykrywanie wzmianek w grupach

Gdy dla czatu grupowego ustawiono `requireMention: true`, OpenClaw transkrybuje teraz audio **przed** sprawdzeniem wzmianek. Dzięki temu notatki głosowe mogą być przetwarzane nawet wtedy, gdy zawierają wzmianki.

**Jak to działa:**

1. Jeśli wiadomość głosowa nie ma treści tekstowej, a grupa wymaga wzmianek, OpenClaw wykonuje transkrypcję „preflight”.
2. Transkrypcja jest sprawdzana pod kątem wzorców wzmianek (np. `@BotName`, wyzwalacze emoji).
3. Jeśli wzmianka zostanie znaleziona, wiadomość przechodzi przez pełny potok odpowiedzi.
4. Transkrypcja jest używana do wykrywania wzmianek, aby notatki głosowe mogły przejść bramkę wzmianek.

**Zachowanie awaryjne:**

- Jeśli transkrypcja nie powiedzie się podczas preflight (limit czasu, błąd API itd.), wiadomość jest przetwarzana na podstawie wykrywania wzmianek tylko w tekście.
- Zapewnia to, że wiadomości mieszane (tekst + audio) nigdy nie zostaną niepoprawnie odrzucone.

**Rezygnacja dla grupy/tematu Telegram:**

- Ustaw `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, aby pominąć sprawdzanie wzmianek w transkrypcji preflight dla tej grupy.
- Ustaw `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, aby nadpisać ustawienie dla tematu (`true`, aby pominąć, `false`, aby wymusić włączenie).
- Domyślnie jest to `false` (preflight włączone, gdy pasują warunki bramkowania wzmiankami).

**Przykład:** Użytkownik wysyła notatkę głosową mówiącą „Hej @Claude, jaka jest pogoda?” w grupie Telegram z `requireMention: true`. Notatka głosowa jest transkrybowana, wzmianka zostaje wykryta, a agent odpowiada.

## Pułapki

- Reguły zakresu używają zasady pierwszego dopasowania. `chatType` jest normalizowane do `direct`, `group` albo `room`.
- Upewnij się, że Twoje CLI kończy działanie z kodem 0 i wypisuje zwykły tekst; JSON trzeba przetworzyć przez `jq -r .text`.
- Dla `parakeet-mlx`, jeśli przekażesz `--output-dir`, OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy `--output-format` ma wartość `txt` (albo jest pominięte); formaty wyjściowe inne niż `txt` wracają do parsowania stdout.
- Utrzymuj rozsądne limity czasu (`timeoutSeconds`, domyślnie 60s), aby uniknąć blokowania kolejki odpowiedzi.
- Transkrypcja preflight przetwarza tylko **pierwszy** załącznik audio na potrzeby wykrywania wzmianek. Dodatkowe audio jest przetwarzane podczas głównej fazy rozumienia mediów.

## Powiązane

- [Rozumienie mediów](/pl/nodes/media-understanding)
- [Tryb rozmowy](/pl/nodes/talk)
- [Wybudzanie głosem](/pl/nodes/voicewake)
