---
read_when:
    - Zmiana transkrypcji audio lub obsługi multimediów
summary: Jak przychodzące audio/notatki głosowe są pobierane, transkrybowane i wstawiane do odpowiedzi
title: Dźwięk i notatki głosowe
x-i18n:
    generated_at: "2026-05-02T23:39:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91cd6951f80c6137061a7d4e82415b0872bc92c6d6ad136273a2e9ad7ec00ac1
    source_path: nodes/audio.md
    workflow: 16
---

# Audio / Notatki głosowe (2026-01-17)

## Co działa

- **Rozumienie mediów (audio)**: Jeśli rozumienie audio jest włączone (lub automatycznie wykryte), OpenClaw:
  1. Lokalizuje pierwszy załącznik audio (ścieżka lokalna lub URL) i pobiera go w razie potrzeby.
  2. Egzekwuje `maxBytes` przed wysłaniem do każdego wpisu modelu.
  3. Uruchamia pierwszy kwalifikujący się wpis modelu w kolejności (dostawca lub CLI).
  4. Jeśli się nie powiedzie albo zostanie pominięty (rozmiar/limit czasu), próbuje następnego wpisu.
  5. Po powodzeniu zastępuje `Body` blokiem `[Audio]` i ustawia `{{Transcript}}`.
- **Parsowanie poleceń**: Gdy transkrypcja się powiedzie, `CommandBody`/`RawBody` są ustawiane na transkrypcję, więc polecenia ukośnikiem nadal działają.
- **Szczegółowe logowanie**: W trybie `--verbose` logujemy, kiedy transkrypcja jest uruchamiana i kiedy zastępuje treść.
- **Dyktowanie w Control UI**: Kompozytor Chat może wysłać nagrany w przeglądarce klip z mikrofonu do `chat.transcribeAudio`. To Gateway RPC zapisuje klip do tymczasowego pliku lokalnego, uruchamia ten sam potok transkrypcji audio, zwraca tekst szkicu do przeglądarki i usuwa plik tymczasowy. Samo w sobie nie tworzy uruchomienia agenta.

## Automatyczne wykrywanie (domyślne)

Jeśli **nie skonfigurujesz modeli**, a `tools.media.audio.enabled` **nie** jest ustawione na `false`,
OpenClaw automatycznie wykrywa w tej kolejności i zatrzymuje się na pierwszej działającej opcji:

1. **Aktywny model odpowiedzi**, gdy jego dostawca obsługuje rozumienie audio.
2. **Lokalne CLI** (jeśli zainstalowane)
   - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
   - `whisper-cli` (z `whisper-cpp`; używa `WHISPER_CPP_MODEL` lub dołączonego modelu tiny)
   - `whisper` (Python CLI; automatycznie pobiera modele)
3. **Gemini CLI** (`gemini`) z użyciem `read_many_files`
4. **Uwierzytelnianie dostawcy**
   - Najpierw próbowane są skonfigurowane wpisy `models.providers.*`, które obsługują audio
   - Dołączona kolejność awaryjna: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Aby wyłączyć automatyczne wykrywanie, ustaw `tools.media.audio.enabled: false`.
Aby dostosować, ustaw `tools.media.audio.models`.
Uwaga: wykrywanie plików binarnych działa na zasadzie najlepszej próby w systemach macOS/Linux/Windows; upewnij się, że CLI jest w `PATH` (rozwijamy `~`), albo ustaw jawny model CLI z pełną ścieżką polecenia.

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

### Echo transkrypcji do czatu (opcjonalne)

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

- Uwierzytelnianie dostawcy działa zgodnie ze standardową kolejnością uwierzytelniania modeli (profile uwierzytelniania, zmienne środowiskowe, `models.providers.*.apiKey`).
- Szczegóły konfiguracji Groq: [Groq](/pl/providers/groq).
- Deepgram pobiera `DEEPGRAM_API_KEY`, gdy używane jest `provider: "deepgram"`.
- Szczegóły konfiguracji Deepgram: [Deepgram (transkrypcja audio)](/pl/providers/deepgram).
- Szczegóły konfiguracji Mistral: [Mistral](/pl/providers/mistral).
- SenseAudio pobiera `SENSEAUDIO_API_KEY`, gdy używane jest `provider: "senseaudio"`.
- Szczegóły konfiguracji SenseAudio: [SenseAudio](/pl/providers/senseaudio).
- Dostawcy audio mogą nadpisywać `baseUrl`, `headers` i `providerOptions` przez `tools.media.audio`.
- Domyślny limit rozmiaru to 20MB (`tools.media.audio.maxBytes`). Zbyt duże audio jest pomijane dla tego modelu i próbowany jest następny wpis.
- Bardzo małe/puste pliki audio poniżej 1024 bajtów są pomijane przed transkrypcją przez dostawcę/CLI.
- Domyślne `maxChars` dla audio jest **nieustawione** (pełna transkrypcja). Ustaw `tools.media.audio.maxChars` albo `maxChars` dla pojedynczego wpisu, aby przyciąć wynik.
- Domyślna wartość automatyczna OpenAI to `gpt-4o-mini-transcribe`; ustaw `model: "gpt-4o-transcribe"` dla większej dokładności.
- Użyj `tools.media.audio.attachments`, aby przetwarzać wiele notatek głosowych (`mode: "all"` + `maxAttachments`).
- Transkrypcja jest dostępna dla szablonów jako `{{Transcript}}`.
- `tools.media.audio.echoTranscript` jest domyślnie wyłączone; włącz je, aby wysłać potwierdzenie transkrypcji z powrotem do czatu źródłowego przed przetwarzaniem przez agenta.
- `tools.media.audio.echoFormat` dostosowuje tekst echa (placeholder: `{transcript}`).
- stdout CLI jest limitowany (5MB); utrzymuj zwięzły wynik CLI.
- `args` CLI powinno używać `{{MediaPath}}` dla ścieżki lokalnego pliku audio. Uruchom `openclaw doctor --fix`, aby zmigrować przestarzałe placeholdery `{input}` ze starszych konfiguracji `audio.transcription.command`.

### Obsługa środowiska proxy

Transkrypcja audio oparta na dostawcy respektuje standardowe zmienne środowiskowe proxy dla ruchu wychodzącego:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Jeśli nie ustawiono żadnych zmiennych środowiskowych proxy, używane jest bezpośrednie wyjście. Jeśli konfiguracja proxy jest niepoprawna, OpenClaw loguje ostrzeżenie i wraca do bezpośredniego pobierania.

## Wykrywanie wzmianek w grupach

Gdy `requireMention: true` jest ustawione dla czatu grupowego, OpenClaw transkrybuje teraz audio **przed** sprawdzeniem wzmianek. Pozwala to przetwarzać notatki głosowe nawet wtedy, gdy zawierają wzmianki.

**Jak to działa:**

1. Jeśli wiadomość głosowa nie ma treści tekstowej, a grupa wymaga wzmianek, OpenClaw wykonuje transkrypcję wstępną.
2. Transkrypcja jest sprawdzana pod kątem wzorców wzmianek (np. `@BotName`, wyzwalacze emoji).
3. Jeśli wzmianka zostanie znaleziona, wiadomość przechodzi przez pełny potok odpowiedzi.
4. Transkrypcja jest używana do wykrywania wzmianek, aby notatki głosowe mogły przejść bramkę wzmianek.

**Zachowanie awaryjne:**

- Jeśli transkrypcja nie powiedzie się podczas etapu wstępnego (limit czasu, błąd API itd.), wiadomość jest przetwarzana na podstawie wykrywania wzmianek tylko w tekście.
- Dzięki temu wiadomości mieszane (tekst + audio) nigdy nie są błędnie odrzucane.

**Rezygnacja dla grupy/tematu Telegram:**

- Ustaw `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, aby pominąć wstępne sprawdzanie wzmianek w transkrypcji dla tej grupy.
- Ustaw `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, aby nadpisać dla tematu (`true`, aby pominąć, `false`, aby wymusić włączenie).
- Domyślnie jest `false` (etap wstępny włączony, gdy pasują warunki bramkowania wzmiankami).

**Przykład:** Użytkownik wysyła notatkę głosową mówiącą „Hej @Claude, jaka jest pogoda?” w grupie Telegram z `requireMention: true`. Notatka głosowa zostaje przetranskrybowana, wzmianka wykryta, a agent odpowiada.

## Pułapki

- Reguły zakresu używają zasady pierwszego dopasowania. `chatType` jest normalizowane do `direct`, `group` albo `room`.
- Upewnij się, że Twoje CLI kończy działanie kodem 0 i wypisuje zwykły tekst; JSON trzeba przetworzyć przez `jq -r .text`.
- Dla `parakeet-mlx`, jeśli przekażesz `--output-dir`, OpenClaw odczyta `<output-dir>/<media-basename>.txt`, gdy `--output-format` to `txt` (lub jest pominięty); formaty wyjściowe inne niż `txt` wracają do parsowania stdout.
- Utrzymuj rozsądne limity czasu (`timeoutSeconds`, domyślnie 60s), aby nie blokować kolejki odpowiedzi.
- Transkrypcja wstępna przetwarza tylko **pierwszy** załącznik audio do wykrywania wzmianek. Dodatkowe audio jest przetwarzane podczas głównej fazy rozumienia mediów.

## Powiązane

- [Rozumienie mediów](/pl/nodes/media-understanding)
- [Tryb rozmowy](/pl/nodes/talk)
- [Wybudzanie głosem](/pl/nodes/voicewake)
