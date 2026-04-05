---
read_when:
    - Zmieniasz transkrypcję audio lub obsługę multimediów
summary: Jak przychodzące audio/notatki głosowe są pobierane, transkrybowane i wstrzykiwane do odpowiedzi
title: Audio i notatki głosowe
x-i18n:
    generated_at: "2026-04-05T13:58:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd464df24268b1104c9bbdb6f424ba90747342b4c0f4d2e39d95055708cbd0ae
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / notatki głosowe (2026-01-17)

## Co działa

- **Rozumienie multimediów (audio)**: jeśli rozumienie audio jest włączone (lub wykrywane automatycznie), OpenClaw:
  1. Lokalizuje pierwszy załącznik audio (ścieżka lokalna lub URL) i pobiera go w razie potrzeby.
  2. Egzekwuje `maxBytes` przed wysłaniem do każdego wpisu modelu.
  3. Uruchamia pierwszy kwalifikujący się wpis modelu zgodnie z kolejnością (provider lub CLI).
  4. Jeśli to się nie powiedzie lub zostanie pominięte (rozmiar/timeout), próbuje następnego wpisu.
  5. Po sukcesie zastępuje `Body` blokiem `[Audio]` i ustawia `{{Transcript}}`.
- **Parsowanie poleceń**: gdy transkrypcja zakończy się sukcesem, `CommandBody`/`RawBody` są ustawiane na transkrypt, dzięki czemu polecenia slash nadal działają.
- **Szczegółowe logowanie**: w `--verbose` logujemy moment uruchomienia transkrypcji oraz moment zastąpienia treści.

## Automatyczne wykrywanie (domyślne)

Jeśli **nie skonfigurujesz modeli**, a `tools.media.audio.enabled` **nie** jest ustawione na `false`,
OpenClaw automatycznie wykrywa w tej kolejności i zatrzymuje się na pierwszej działającej opcji:

1. **Aktywny model odpowiedzi**, jeśli jego provider obsługuje rozumienie audio.
2. **Lokalne CLI** (jeśli są zainstalowane)
   - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
   - `whisper-cli` (z `whisper-cpp`; używa `WHISPER_CPP_MODEL` lub dołączonego małego modelu)
   - `whisper` (Python CLI; automatycznie pobiera modele)
3. **Gemini CLI** (`gemini`) używające `read_many_files`
4. **Uwierzytelnianie providera**
   - Najpierw próbowane są skonfigurowane wpisy `models.providers.*` obsługujące audio
   - Wbudowana kolejność fallbacku: OpenAI → Groq → Deepgram → Google → Mistral

Aby wyłączyć automatyczne wykrywanie, ustaw `tools.media.audio.enabled: false`.
Aby je dostosować, ustaw `tools.media.audio.models`.
Uwaga: wykrywanie binarek jest best-effort na macOS/Linux/Windows; upewnij się, że CLI jest w `PATH` (rozwijamy `~`), albo ustaw jawny model CLI z pełną ścieżką polecenia.

## Przykłady konfiguracji

### Fallback providera + CLI (OpenAI + Whisper CLI)

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

### Tylko provider z gatingiem zakresu

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

### Tylko provider (Deepgram)

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

### Tylko provider (Mistral Voxtral)

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

### Odesłanie transkryptu do czatu (opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // domyślnie false
        echoFormat: '📝 "{transcript}"', // opcjonalne, obsługuje {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Uwagi i limity

- Uwierzytelnianie providera korzysta ze standardowej kolejności auth modeli (profile uwierzytelniania, zmienne env, `models.providers.*.apiKey`).
- Szczegóły konfiguracji Groq: [Groq](/providers/groq).
- Deepgram pobiera `DEEPGRAM_API_KEY`, gdy używane jest `provider: "deepgram"`.
- Szczegóły konfiguracji Deepgram: [Deepgram (transkrypcja audio)](/providers/deepgram).
- Szczegóły konfiguracji Mistral: [Mistral](/providers/mistral).
- Providery audio mogą nadpisywać `baseUrl`, `headers` i `providerOptions` przez `tools.media.audio`.
- Domyślny limit rozmiaru to 20 MB (`tools.media.audio.maxBytes`). Zbyt duże audio jest pomijane dla danego modelu i próbowany jest następny wpis.
- Małe/puste pliki audio poniżej 1024 bajtów są pomijane przed transkrypcją przez providera/CLI.
- Domyślne `maxChars` dla audio jest **nieustawione** (pełny transkrypt). Ustaw `tools.media.audio.maxChars` lub `maxChars` dla konkretnego wpisu, aby przyciąć wynik.
- Domyślnym auto ustawieniem OpenAI jest `gpt-4o-mini-transcribe`; ustaw `model: "gpt-4o-transcribe"`, aby uzyskać większą dokładność.
- Użyj `tools.media.audio.attachments`, aby przetwarzać wiele notatek głosowych (`mode: "all"` + `maxAttachments`).
- Transkrypt jest dostępny dla szablonów jako `{{Transcript}}`.
- `tools.media.audio.echoTranscript` jest domyślnie wyłączone; włącz je, aby wysyłać potwierdzenie transkryptu z powrotem do czatu źródłowego przed przetwarzaniem przez agenta.
- `tools.media.audio.echoFormat` dostosowuje tekst echo (placeholder: `{transcript}`).
- `stdout` CLI jest ograniczone (5 MB); utrzymuj zwięzłe dane wyjściowe CLI.

### Obsługa środowiska proxy

Transkrypcja audio oparta na providerze respektuje standardowe zmienne env dla wychodzącego proxy:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jeśli nie ustawiono żadnych zmiennych env proxy, używany jest bezpośredni egress. Jeśli konfiguracja proxy jest nieprawidłowa, OpenClaw zapisuje ostrzeżenie w logach i wraca do bezpośredniego pobierania.

## Wykrywanie wzmianek w grupach

Gdy dla czatu grupowego ustawiono `requireMention: true`, OpenClaw teraz transkrybuje audio **przed** sprawdzeniem wzmianek. Dzięki temu notatki głosowe mogą być przetwarzane nawet wtedy, gdy zawierają wzmianki.

**Jak to działa:**

1. Jeśli wiadomość głosowa nie ma tekstowej treści, a grupa wymaga wzmianek, OpenClaw wykonuje transkrypcję „preflight”.
2. Transkrypt jest sprawdzany pod kątem wzorców wzmianek (na przykład `@BotName`, wyzwalaczy emoji).
3. Jeśli wzmianka zostanie znaleziona, wiadomość przechodzi przez pełny pipeline odpowiedzi.
4. Transkrypt jest używany do wykrywania wzmianek, dzięki czemu notatki głosowe mogą przejść przez bramkę wzmianki.

**Zachowanie fallbacku:**

- Jeśli transkrypcja nie powiedzie się podczas preflight (timeout, błąd API itp.), wiadomość jest przetwarzana na podstawie wykrywania wzmianek wyłącznie z tekstu.
- Dzięki temu wiadomości mieszane (tekst + audio) nigdy nie są błędnie odrzucane.

**Opt-out dla konkretnej grupy/tematu Telegram:**

- Ustaw `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, aby pominąć kontrolę wzmianki w transkrypcie preflight dla tej grupy.
- Ustaw `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, aby nadpisać to dla konkretnego tematu (`true`, aby pominąć, `false`, aby wymusić włączenie).
- Domyślna wartość to `false` (preflight włączony, gdy warunki gated wzmiankami pasują).

**Przykład:** użytkownik wysyła notatkę głosową z treścią „Hej @Claude, jaka jest pogoda?” w grupie Telegram z `requireMention: true`. Notatka głosowa jest transkrybowana, wzmianka zostaje wykryta i agent odpowiada.

## Pułapki

- Reguły zakresu używają zasady first-match wins. `chatType` jest normalizowane do `direct`, `group` lub `room`.
- Upewnij się, że Twoje CLI kończy się kodem 0 i wypisuje zwykły tekst; JSON trzeba przekształcić, na przykład przez `jq -r .text`.
- Dla `parakeet-mlx`, jeśli przekażesz `--output-dir`, OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy `--output-format` ma wartość `txt` (lub jest pominięte); formaty wyjściowe inne niż `txt` wracają do parsowania `stdout`.
- Utrzymuj rozsądne timeouty (`timeoutSeconds`, domyślnie 60 s), aby nie blokować kolejki odpowiedzi.
- Transkrypcja preflight przetwarza tylko **pierwszy** załącznik audio do wykrywania wzmianek. Dodatkowe audio jest przetwarzane podczas głównej fazy rozumienia multimediów.
