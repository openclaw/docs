---
read_when:
    - Zmiana transkrypcji audio lub obsługi multimediów
summary: Jak przychodzące audio/wiadomości głosowe są pobierane, transkrybowane i wstrzykiwane do odpowiedzi
title: Audio i wiadomości głosowe
x-i18n:
    generated_at: "2026-04-24T09:18:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# Audio / wiadomości głosowe (2026-01-17)

## Co działa

- **Rozumienie multimediów (audio)**: Jeśli rozumienie audio jest włączone (lub wykrywane automatycznie), OpenClaw:
  1. Lokalizuje pierwszy załącznik audio (lokalna ścieżka lub URL) i w razie potrzeby go pobiera.
  2. Egzekwuje `maxBytes` przed wysłaniem do każdego wpisu modelu.
  3. Uruchamia pierwszy kwalifikujący się wpis modelu w kolejności (provider lub CLI).
  4. Jeśli się nie powiedzie lub zostanie pominięty (rozmiar/limit czasu), próbuje następnego wpisu.
  5. Po powodzeniu zastępuje `Body` blokiem `[Audio]` i ustawia `{{Transcript}}`.
- **Parsowanie poleceń**: Gdy transkrypcja się powiedzie, `CommandBody`/`RawBody` są ustawiane na transkrypt, dzięki czemu polecenia slash nadal działają.
- **Szczegółowe logowanie**: W trybie `--verbose` logujemy moment uruchomienia transkrypcji i moment zastąpienia treści.

## Automatyczne wykrywanie (domyślnie)

Jeśli **nie skonfigurujesz modeli** i `tools.media.audio.enabled` **nie** jest ustawione na `false`,
OpenClaw wykrywa automatycznie w tej kolejności i zatrzymuje się na pierwszej działającej opcji:

1. **Aktywny model odpowiedzi**, gdy jego provider obsługuje rozumienie audio.
2. **Lokalne CLI** (jeśli zainstalowane)
   - `sherpa-onnx-offline` (wymaga `SHERPA_ONNX_MODEL_DIR` z encoder/decoder/joiner/tokens)
   - `whisper-cli` (z `whisper-cpp`; używa `WHISPER_CPP_MODEL` lub dołączonego modelu tiny)
   - `whisper` (Python CLI; automatycznie pobiera modele)
3. **Gemini CLI** (`gemini`) używające `read_many_files`
4. **Auth providera**
   - Najpierw próbowane są skonfigurowane wpisy `models.providers.*`, które obsługują audio
   - Dołączona kolejność awaryjna: OpenAI → Groq → Deepgram → Google → Mistral

Aby wyłączyć automatyczne wykrywanie, ustaw `tools.media.audio.enabled: false`.
Aby dostosować działanie, ustaw `tools.media.audio.models`.
Uwaga: wykrywanie binariów jest best-effort na macOS/Linux/Windows; upewnij się, że CLI jest w `PATH` (rozwijamy `~`) lub ustaw jawny model CLI z pełną ścieżką do polecenia.

## Przykłady konfiguracji

### Provider + awaryjny CLI (OpenAI + Whisper CLI)

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

### Tylko provider z ograniczeniem zakresu

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

### Echo transkryptu do czatu (opt-in)

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

- Auth providera podąża za standardową kolejnością auth modeli (profile auth, zmienne env, `models.providers.*.apiKey`).
- Szczegóły konfiguracji Groq: [Groq](/pl/providers/groq).
- Deepgram pobiera `DEEPGRAM_API_KEY`, gdy używane jest `provider: "deepgram"`.
- Szczegóły konfiguracji Deepgram: [Deepgram (transkrypcja audio)](/pl/providers/deepgram).
- Szczegóły konfiguracji Mistral: [Mistral](/pl/providers/mistral).
- Providerzy audio mogą nadpisywać `baseUrl`, `headers` i `providerOptions` przez `tools.media.audio`.
- Domyślny limit rozmiaru to 20MB (`tools.media.audio.maxBytes`). Zbyt duże audio jest pomijane dla tego modelu i próbowany jest następny wpis.
- Bardzo małe/puste pliki audio poniżej 1024 bajtów są pomijane przed transkrypcją przez providera/CLI.
- Domyślne `maxChars` dla audio jest **nieustawione** (pełny transkrypt). Ustaw `tools.media.audio.maxChars` lub per-entry `maxChars`, aby przyciąć wynik.
- Domyślna wartość OpenAI to `gpt-4o-mini-transcribe`; ustaw `model: "gpt-4o-transcribe"`, aby uzyskać większą dokładność.
- Użyj `tools.media.audio.attachments`, aby przetwarzać wiele wiadomości głosowych (`mode: "all"` + `maxAttachments`).
- Transkrypt jest dostępny dla szablonów jako `{{Transcript}}`.
- `tools.media.audio.echoTranscript` jest domyślnie wyłączone; włącz je, aby wysyłać potwierdzenie transkryptu z powrotem do czatu źródłowego przed przetwarzaniem przez agenta.
- `tools.media.audio.echoFormat` dostosowuje tekst echo (placeholder: `{transcript}`).
- Stdout CLI jest ograniczone (5MB); utrzymuj zwięzłe dane wyjściowe CLI.

### Obsługa zmiennych środowiskowych proxy

Transkrypcja audio oparta na providerach honoruje standardowe zmienne env proxy dla ruchu wychodzącego:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Jeśli nie ustawiono żadnych zmiennych env proxy, używany jest bezpośredni egress. Jeśli konfiguracja proxy jest nieprawidłowa, OpenClaw zapisuje ostrzeżenie w logu i wraca do bezpośredniego pobierania.

## Wykrywanie wzmianek w grupach

Gdy dla czatu grupowego ustawiono `requireMention: true`, OpenClaw wykonuje teraz transkrypcję audio **przed** sprawdzeniem wzmianek. Dzięki temu wiadomości głosowe mogą być przetwarzane nawet wtedy, gdy zawierają wzmianki.

**Jak to działa:**

1. Jeśli wiadomość głosowa nie ma tekstowego body, a grupa wymaga wzmianki, OpenClaw wykonuje transkrypcję „preflight”.
2. Transkrypt jest sprawdzany pod kątem wzorców wzmianek (np. `@BotName`, wyzwalacze emoji).
3. Jeśli wzmianka zostanie znaleziona, wiadomość przechodzi przez pełny potok odpowiedzi.
4. Transkrypt jest używany do wykrywania wzmianek, dzięki czemu wiadomości głosowe mogą przejść przez bramkę wzmianki.

**Zachowanie awaryjne:**

- Jeśli transkrypcja nie powiedzie się podczas preflight (limit czasu, błąd API itp.), wiadomość jest przetwarzana na podstawie wykrywania wzmianek tylko w tekście.
- Dzięki temu wiadomości mieszane (tekst + audio) nigdy nie są błędnie odrzucane.

**Opt-out per grupa/temat Telegram:**

- Ustaw `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, aby pominąć sprawdzanie wzmianki w transkrypcji preflight dla tej grupy.
- Ustaw `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, aby nadpisać per topic (`true`, aby pominąć, `false`, aby wymusić włączenie).
- Domyślnie jest to `false` (preflight włączony, gdy pasują warunki wymagania wzmianki).

**Przykład:** Użytkownik wysyła wiadomość głosową z treścią „Hej @Claude, jaka jest pogoda?” w grupie Telegram z `requireMention: true`. Wiadomość głosowa jest transkrybowana, wzmianka zostaje wykryta i agent odpowiada.

## Pułapki

- Reguły zakresu używają zasady first-match wins. `chatType` jest normalizowane do `direct`, `group` lub `room`.
- Upewnij się, że Twoje CLI kończy się kodem 0 i wypisuje zwykły tekst; JSON trzeba przekształcić przez `jq -r .text`.
- W przypadku `parakeet-mlx`, jeśli przekażesz `--output-dir`, OpenClaw odczytuje `<output-dir>/<media-basename>.txt`, gdy `--output-format` ma wartość `txt` (lub jest pominięte); formaty wyjściowe inne niż `txt` wracają do parsowania stdout.
- Utrzymuj rozsądne limity czasu (`timeoutSeconds`, domyślnie 60 s), aby nie blokować kolejki odpowiedzi.
- Transkrypcja preflight przetwarza tylko **pierwszy** załącznik audio do wykrywania wzmianek. Dodatkowe audio jest przetwarzane w głównej fazie rozumienia multimediów.

## Powiązane

- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Tryb Talk](/pl/nodes/talk)
- [Voice wake](/pl/nodes/voicewake)
