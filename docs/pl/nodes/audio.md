---
read_when:
    - Zmiana transkrypcji dźwięku lub obsługi multimediów
summary: Jak przychodzące nagrania audio/notatki głosowe są pobierane, transkrybowane i wstawiane do odpowiedzi
title: Dźwięk i notatki głosowe
x-i18n:
    generated_at: "2026-04-30T10:02:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# Audio / Notatki głosowe (2026-01-17)

## Co działa

- **Rozumienie multimediów (audio)**: Jeśli rozumienie audio jest włączone (lub automatycznie wykryte), OpenClaw:
  1. Lokalizuje pierwszy załącznik audio (ścieżka lokalna lub URL) i w razie potrzeby go pobiera.
  2. Wymusza `maxBytes` przed wysłaniem do każdego wpisu modelu.
  3. Uruchamia pierwszy kwalifikujący się wpis modelu w kolejności (dostawca lub CLI).
  4. Jeśli zakończy się niepowodzeniem lub zostanie pominięty (rozmiar/limit czasu), próbuje kolejnego wpisu.
  5. Po powodzeniu zastępuje `Body` blokiem `[Audio]` i ustawia `{{Transcript}}`.
- **Parsowanie poleceń**: Gdy transkrypcja się powiedzie, `CommandBody`/`RawBody` są ustawiane na transkrypt, więc polecenia slash nadal działają.
- **Szczegółowe logowanie**: W trybie `--verbose` logujemy, kiedy działa transkrypcja i kiedy zastępuje treść.

## Automatyczne wykrywanie (domyślnie)

Jeśli **nie skonfigurujesz modeli**, a `tools.media.audio.enabled` **nie** jest ustawione na `false`,
OpenClaw automatycznie wykrywa opcje w tej kolejności i zatrzymuje się na pierwszej działającej:

1. **Aktywny model odpowiedzi**, gdy jego dostawca obsługuje rozumienie audio.
2. **Lokalne CLI** (jeśli zainstalowane)
   - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
   - `whisper-cli` (z `whisper-cpp`; używa `WHISPER_CPP_MODEL` albo dołączonego modelu tiny)
   - `whisper` (CLI Pythona; automatycznie pobiera modele)
3. **Gemini CLI** (`gemini`) z użyciem `read_many_files`
4. **Uwierzytelnianie dostawcy**
   - Najpierw próbowane są skonfigurowane wpisy `models.providers.*`, które obsługują audio
   - Dołączona kolejność awaryjna: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Aby wyłączyć automatyczne wykrywanie, ustaw `tools.media.audio.enabled: false`.
Aby dostosować, ustaw `tools.media.audio.models`.
Uwaga: wykrywanie plików binarnych jest best-effort w macOS/Linux/Windows; upewnij się, że CLI jest w `PATH` (rozwijamy `~`), albo ustaw jawny model CLI z pełną ścieżką polecenia.

## Przykłady konfiguracji

### Dostawca + awaryjny CLI (OpenAI + Whisper CLI)

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

### Tylko dostawca z bramkowaniem zakresu

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

### Wyślij transkrypt na czat (opcjonalnie)

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

- Uwierzytelnianie dostawcy korzysta ze standardowej kolejności uwierzytelniania modelu (profile uwierzytelniania, zmienne env, `models.providers.*.apiKey`).
- Szczegóły konfiguracji Groq: [Groq](/pl/providers/groq).
- Deepgram pobiera `DEEPGRAM_API_KEY`, gdy używane jest `provider: "deepgram"`.
- Szczegóły konfiguracji Deepgram: [Deepgram (transkrypcja audio)](/pl/providers/deepgram).
- Szczegóły konfiguracji Mistral: [Mistral](/pl/providers/mistral).
- SenseAudio pobiera `SENSEAUDIO_API_KEY`, gdy używane jest `provider: "senseaudio"`.
- Szczegóły konfiguracji SenseAudio: [SenseAudio](/pl/providers/senseaudio).
- Dostawcy audio mogą nadpisywać `baseUrl`, `headers` i `providerOptions` przez `tools.media.audio`.
- Domyślny limit rozmiaru to 20MB (`tools.media.audio.maxBytes`). Zbyt duże audio jest pomijane dla tego modelu i próbowany jest kolejny wpis.
- Bardzo małe/puste pliki audio poniżej 1024 bajtów są pomijane przed transkrypcją dostawcy/CLI.
- Domyślne `maxChars` dla audio jest **nieustawione** (pełny transkrypt). Ustaw `tools.media.audio.maxChars` albo `maxChars` dla konkretnego wpisu, aby przyciąć dane wyjściowe.
- Domyślny model OpenAI auto to `gpt-4o-mini-transcribe`; ustaw `model: "gpt-4o-transcribe"` dla wyższej dokładności.
- Użyj `tools.media.audio.attachments`, aby przetwarzać wiele notatek głosowych (`mode: "all"` + `maxAttachments`).
- Transkrypt jest dostępny dla szablonów jako `{{Transcript}}`.
- `tools.media.audio.echoTranscript` jest domyślnie wyłączone; włącz je, aby wysłać potwierdzenie transkryptu z powrotem do czatu źródłowego przed przetwarzaniem przez agenta.
- `tools.media.audio.echoFormat` dostosowuje tekst echo (placeholder: `{transcript}`).
- stdout CLI jest limitowany (5MB); utrzymuj dane wyjściowe CLI zwięzłe.
- `args` CLI powinny używać `{{MediaPath}}` dla ścieżki lokalnego pliku audio. Uruchom `openclaw doctor --fix`, aby zmigrować przestarzałe placeholdery `{input}` ze starszych konfiguracji `audio.transcription.command`.

### Obsługa środowiska proxy

Transkrypcja audio oparta na dostawcy honoruje standardowe wychodzące zmienne env proxy:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Jeśli nie ustawiono zmiennych env proxy, używane jest bezpośrednie wyjście. Jeśli konfiguracja proxy jest nieprawidłowa, OpenClaw loguje ostrzeżenie i wraca do bezpośredniego pobierania.

## Wykrywanie wzmianek w grupach

Gdy `requireMention: true` jest ustawione dla czatu grupowego, OpenClaw transkrybuje teraz audio **przed** sprawdzeniem wzmianek. Dzięki temu notatki głosowe mogą być przetwarzane nawet wtedy, gdy zawierają wzmianki.

**Jak to działa:**

1. Jeśli wiadomość głosowa nie ma treści tekstowej, a grupa wymaga wzmianek, OpenClaw wykonuje transkrypcję „preflight”.
2. Transkrypt jest sprawdzany pod kątem wzorców wzmianek (np. `@BotName`, wyzwalacze emoji).
3. Jeśli wzmianka zostanie znaleziona, wiadomość przechodzi przez pełny pipeline odpowiedzi.
4. Transkrypt jest używany do wykrywania wzmianek, aby notatki głosowe mogły przejść przez bramkę wzmianek.

**Zachowanie awaryjne:**

- Jeśli transkrypcja nie powiedzie się podczas preflight (limit czasu, błąd API itd.), wiadomość jest przetwarzana na podstawie wykrywania wzmianek wyłącznie w tekście.
- Zapewnia to, że wiadomości mieszane (tekst + audio) nigdy nie zostaną niepoprawnie odrzucone.

**Rezygnacja dla grupy/tematu Telegram:**

- Ustaw `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, aby pominąć sprawdzanie wzmianek w transkrypcie preflight dla tej grupy.
- Ustaw `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, aby nadpisać ustawienie dla tematu (`true`, aby pominąć, `false`, aby wymusić włączenie).
- Domyślnie `false` (preflight włączony, gdy warunki bramkowania wzmiankami pasują).

**Przykład:** Użytkownik wysyła notatkę głosową mówiącą „Hej @Claude, jaka jest pogoda?” w grupie Telegram z `requireMention: true`. Notatka głosowa jest transkrybowana, wzmianka zostaje wykryta, a agent odpowiada.

## Pułapki

- Reguły zakresu używają zasady pierwszego dopasowania. `chatType` jest normalizowane do `direct`, `group` albo `room`.
- Upewnij się, że CLI kończy działanie kodem 0 i wypisuje zwykły tekst; JSON trzeba przetworzyć przez `jq -r .text`.
- Dla `parakeet-mlx`, jeśli przekażesz `--output-dir`, OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy `--output-format` ma wartość `txt` (albo jest pominięty); formaty wyjściowe inne niż `txt` wracają do parsowania stdout.
- Utrzymuj rozsądne limity czasu (`timeoutSeconds`, domyślnie 60s), aby nie blokować kolejki odpowiedzi.
- Transkrypcja preflight przetwarza tylko **pierwszy** załącznik audio do wykrywania wzmianek. Dodatkowe audio jest przetwarzane podczas głównej fazy rozumienia multimediów.

## Powiązane

- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Tryb rozmowy](/pl/nodes/talk)
- [Wybudzanie głosem](/pl/nodes/voicewake)
