---
read_when:
    - Zmiana transkrypcji dźwięku lub obsługi multimediów
summary: Jak przychodzące pliki audio i wiadomości głosowe są pobierane, transkrybowane i dołączane do odpowiedzi
title: Notatki dźwiękowe i głosowe
x-i18n:
    generated_at: "2026-07-12T15:17:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## Co to robi

Gdy rozumienie dźwięku jest włączone (lub wykryte automatycznie), OpenClaw:

1. Lokalizuje pierwszy załącznik audio (ścieżkę lokalną lub adres URL) i w razie potrzeby go pobiera.
2. Egzekwuje limit `maxBytes` przed wysłaniem do każdego wpisu modelu.
3. Uruchamia pierwszy kwalifikujący się wpis modelu w podanej kolejności (dostawca lub CLI); jeśli wpis zakończy się niepowodzeniem albo zostanie pominięty (rozmiar/przekroczenie limitu czasu), podejmowana jest próba użycia następnego wpisu.
4. Po powodzeniu zastępuje `Body` blokiem `[Audio]` i ustawia `{{Transcript}}`.

Po pomyślnej transkrypcji pola `CommandBody`/`RawBody` również otrzymują treść transkrypcji, dzięki czemu polecenia z ukośnikiem nadal działają. Przy użyciu `--verbose` dzienniki pokazują, kiedy wykonywana jest transkrypcja i kiedy zastępuje ona treść wiadomości.

## Automatyczne wykrywanie (domyślne)

Jeśli nie skonfigurowano modeli, a `tools.media.audio.enabled` nie ma wartości `false`, OpenClaw automatycznie sprawdza poniższe opcje w podanej kolejności i zatrzymuje się na pierwszej działającej:

1. **Aktywny model odpowiedzi**, jeśli jego dostawca obsługuje rozumienie dźwięku.
2. **Skonfigurowane uwierzytelnianie dostawcy** — dowolny wpis `models.providers.*` z dostępnym uwierzytelnianiem dla dostawcy obsługującego transkrypcję dźwięku. Jest to sprawdzane przed lokalnymi narzędziami CLI, dlatego skonfigurowany klucz API zawsze ma pierwszeństwo przed lokalnym plikiem wykonywalnym w `PATH`.
   Priorytet dostawców, gdy skonfigurowano wielu: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **Lokalne narzędzia CLI** (tylko jeśli nie znaleziono uwierzytelniania dostawcy). OpenClaw tworzy uporządkowaną listę opcji zapasowych:
   - `whisper-cli`, przed domyślnymi opcjami procesora CPU tylko wtedy, gdy wcześniejsze wywołanie modelu w bieżącym procesie wykryło Metal lub CUDA
   - `sherpa-onnx-offline` z domyślnym dostawcą CPU (wymaga `SHERPA_ONNX_MODEL_DIR` zawierającego `tokens.txt`, `encoder.onnx`, `decoder.onnx` i `joiner.onnx`)
   - `whisper-cli`, gdy kompilacja obsługuje jedynie Metal/CUDA albo wybrany backend nie został w inny sposób zaobserwowany
   - `parakeet-mlx` na Apple Silicon (obsługuje MLX; użycie urządzenia pozostaje niezaobserwowane)
   - `whisper` (CLI w Pythonie; automatycznie pobiera modele)

Pochodzenie instalacji lub dowiązania stanowi dowód możliwości, a nie wykonania. Samo w sobie nigdy nie przesuwa kandydata przed sherpa korzystającą z CPU. OpenClaw nie ładuje modelu podczas konfiguracji ani sprawdzania stanu wyłącznie w celu zbadania backendu.
Automatycznie wykryty whisper.cpp zachowuje włączone standardowe dzienniki uruchomienia modelu, aby OpenClaw mógł zarejestrować pochodzący z niego wiersz `using … backend`. Jawne wpisy CLI zachowują skonfigurowane flagi wyjścia.

Automatyczne wykrywanie Gemini CLI na potrzeby rozumienia multimediów zastąpiono działającą w piaskownicy opcją zapasową Antigravity CLI (`agy`) dla obrazów i filmów; w przypadku dźwięku nie jest używana żadna opcja zapasowa CLI poza wymienionymi wyżej lokalnymi plikami wykonywalnymi.

Aby wyłączyć automatyczne wykrywanie, ustaw `tools.media.audio.enabled: false`. Aby je dostosować, ustaw `tools.media.audio.models`.

<Note>
Wykrywanie plików wykonywalnych w systemach macOS/Linux/Windows odbywa się w miarę możliwości. Upewnij się, że CLI znajduje się w `PATH` (`~` jest rozwijane), albo ustaw jawny model CLI z pełną ścieżką polecenia.
</Note>

Sprawdź wybór lokalny bez wykonywania transkrypcji dźwięku:

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

Inwentarz dostawców raportuje zwycięską lokalną opcję zapasową oddzielnie od globalnego wyboru dostawcy, a także pola obsługiwanego, żądanego i zaobserwowanego backendu. Po wykonaniu transkrypcji `/status` podaje żądany lub zaobserwowany backend w wierszu multimediów. Jawne wpisy CLI w `tools.media.audio.models` nadal pomijają automatyczny wybór; używaj właściwych dla danego backendu flag, takich jak `--provider=cuda` dla sherpa lub `--no-gpu`/`--device` dla whisper.cpp.

## Przykłady konfiguracji

### Dostawca i zapasowe CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
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

### Tylko dostawca z ograniczeniem zakresu

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
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
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

### Powtórzenie transkrypcji na czacie (opcjonalne)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // domyślnie false
        echoFormat: '📝 "{transcript}"', // opcjonalne, obsługuje {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Uwagi i ograniczenia

- Uwierzytelnianie dostawcy odbywa się zgodnie ze standardową kolejnością uwierzytelniania modeli (profile uwierzytelniania, zmienne środowiskowe, `models.providers.*.apiKey`).
- Szczegóły konfiguracji Groq: [Groq](/pl/providers/groq).
- Deepgram pobiera wartość `DEEPGRAM_API_KEY`, gdy używane jest `provider: "deepgram"`. Szczegóły konfiguracji: [Deepgram](/pl/providers/deepgram).
- Szczegóły konfiguracji Mistral: [Mistral](/pl/providers/mistral).
- SenseAudio pobiera wartość `SENSEAUDIO_API_KEY`, gdy używane jest `provider: "senseaudio"`. Szczegóły konfiguracji: [SenseAudio](/pl/providers/senseaudio).
- Dostawcy dźwięku mogą nadpisywać `baseUrl`, `headers` i `providerOptions` za pośrednictwem `tools.media.audio`.
- Domyślny limit rozmiaru wynosi 20 MB (`tools.media.audio.maxBytes`). Dźwięk przekraczający limit jest pomijany dla danego modelu i podejmowana jest próba użycia następnego wpisu.
- Pliki audio mniejsze niż 1024 bajty są pomijane przed transkrypcją przez dostawcę lub CLI.
- Domyślna wartość `maxChars` dla dźwięku jest **nieustawiona** (pełna transkrypcja). Ustaw `tools.media.audio.maxChars` lub `maxChars` dla konkretnego wpisu, aby skrócić dane wyjściowe.
- Domyślnym modelem automatycznego wykrywania OpenAI jest `gpt-4o-transcribe`; ustaw `model: "gpt-4o-mini-transcribe"`, aby użyć tańszej i szybszej opcji.
- Użyj `tools.media.audio.attachments`, aby przetwarzać wiele notatek głosowych (`mode: "all"` wraz z `maxAttachments`, domyślnie 1).
- Transkrypcja jest dostępna w szablonach jako `{{Transcript}}`.
- `tools.media.audio.echoTranscript` jest domyślnie wyłączone; włącz tę opcję, aby przed przetwarzaniem przez agenta wysłać potwierdzenie transkrypcji z powrotem do czatu źródłowego.
- `tools.media.audio.echoFormat` dostosowuje tekst powtórzenia (symbol zastępczy: `{transcript}`; domyślnie `📝 "{transcript}"`).
- Standardowe wyjście CLI jest ograniczone do 5 MB; zadbaj o zwięzłe dane wyjściowe CLI.
- `args` narzędzia CLI powinno używać `{{MediaPath}}` jako lokalnej ścieżki pliku audio. Uruchom `openclaw doctor --fix`, aby zmigrować przestarzałe symbole zastępcze `{input}` ze starszych konfiguracji `audio.transcription.command` (wycofany klucz: `audio.transcription`, zastąpiony przez `tools.media.audio.models`).
- `tools.media.concurrency` ogranicza liczbę zadań multimedialnych; nie jest to harmonogram zadań GPU.

### Rezydentne lokalne STT

Automatycznie wykrywane lokalne STT nadal działa w modelu osobnego procesu dla każdego żądania. OpenClaw nie zarządza obecnie rezydentnym serwerem whisper.cpp, ponieważ standardowy pakiet Homebrew `whisper-cpp` wyłącza ten serwer, a przykład z projektu źródłowego nie ma skonfigurowanej kolejki przyjmowania o ograniczonym rozmiarze. Aby można było bezpiecznie włączyć rezydentny cykl życia należący do pluginu, potrzebny jest utrzymywany, pakietowany proces roboczy z kontrolą kondycji i uruchamiania, trwałym załadowaniem modelu, ograniczonym kolejkowaniem, anulowaniem i limitami czasu, działaniem bez uwierzytelniania wyłącznie przez local loopback oraz bez zapasowego przełączania do chmury.

### Obsługa środowiska proxy

Transkrypcja dźwięku oparta na dostawcach respektuje standardowe zmienne środowiskowe wychodzącego proxy zgodnie z semantyką `EnvHttpProxyAgent` z undici:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

Zmienne pisane małymi literami mają pierwszeństwo przed zmiennymi pisanymi wielkimi literami; wpisy `NO_PROXY`/`no_proxy` (nazwy hostów, `*.suffix` lub `host:port`) omijają proxy. Jeśli nie ustawiono żadnych zmiennych środowiskowych proxy, używane jest bezpośrednie połączenie wychodzące. Jeśli konfiguracja proxy się nie powiedzie (nieprawidłowy adres URL), OpenClaw zapisuje ostrzeżenie w dzienniku i przechodzi na bezpośrednie pobieranie.

## Wykrywanie wzmianek w grupach

W kanałach obsługujących wstępne przetwarzanie dźwięku OpenClaw wykonuje transkrypcję **przed** sprawdzeniem wzmianek, gdy dla czatu grupowego ustawiono `requireMention: true`. Dzięki temu notatka głosowa bez podpisu może przejść kontrolę wzmianki, jeśli jej transkrypcja zawiera skonfigurowany wzorzec wzmianki. Dokumentacja poszczególnych kanałów opisuje transporty, które zamiast tego wymagają wpisanej wzmianki.

**Jak to działa:**

1. Jeśli wiadomość głosowa nie zawiera tekstu, a grupa wymaga wzmianek, OpenClaw wykonuje wstępną transkrypcję pierwszego załącznika audio.
2. Transkrypcja jest sprawdzana pod kątem wzorców wzmianek (na przykład `@BotName`, wyzwalaczy emoji).
3. Jeśli zostanie znaleziona wzmianka, wiadomość przechodzi przez pełny potok odpowiedzi.

**Działanie zapasowe:** jeśli wstępna transkrypcja się nie powiedzie (przekroczenie limitu czasu, błąd API itp.), wiadomość przechodzi na wykrywanie wzmianek wyłącznie w tekście, dzięki czemu wiadomości mieszane (tekst + dźwięk) nigdy nie są odrzucane.

**Wyłączenie dla grupy lub tematu Telegramu:**

- Ustaw `channels.telegram.groups.<chatId>.disableAudioPreflight: true`, aby pominąć wstępne sprawdzanie wzmianek w transkrypcji dla tej grupy.
- Ustaw `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight`, aby nadpisać ustawienie dla danego tematu (`true`, aby pominąć; `false`, aby wymusić włączenie).
- Wartość domyślna to `false` (wstępne przetwarzanie jest włączone, gdy spełnione są warunki wymagania wzmianki).

**Przykład:** użytkownik wysyła w grupie Telegram z ustawieniem `requireMention: true` notatkę głosową o treści „Hej @Claude, jaka jest pogoda?”. Notatka głosowa zostaje przepisana, wzmianka zostaje wykryta, a agent odpowiada.

## Pułapki

- Reguły zakresu stosują zasadę pierwszego dopasowania; `chatType` jest normalizowane do `direct`, `group` lub `channel`.
- Upewnij się, że CLI kończy działanie z kodem 0 i wyświetla zwykły tekst; dane wyjściowe JSON trzeba przekształcić za pomocą `jq -r .text`.
- Znane tryby zapisu do pliku są rozstrzygające: pusty lub brakujący wywnioskowany plik transkrypcji oznacza brak transkrypcji zamiast przejścia na dane o postępie z CLI.
- W przypadku `parakeet-mlx` użyj `--output-format txt` (lub `all`) wraz z `--output-dir` oraz domyślnym szablonem wyjściowym `{filename}`. Obsługiwane są również pochodzące z projektu źródłowego zmienne środowiskowe `PARAKEET_OUTPUT_FORMAT` i `PARAKEET_OUTPUT_TEMPLATE`. OpenClaw odczytuje `<output-dir>/<media-basename>.txt`; domyślny format `srt`, inne formaty i niestandardowe szablony wyjściowe nadal korzystają ze standardowego wyjścia.
- Ustawiaj rozsądne limity czasu (`timeoutSeconds`, domyślnie 60 s), aby uniknąć blokowania kolejki odpowiedzi.
- Wstępna transkrypcja przetwarza na potrzeby wykrywania wzmianek wyłącznie **pierwszy** załącznik audio. Dodatkowe załączniki audio są przetwarzane podczas głównego etapu rozumienia multimediów.

## Powiązane

- [Rozumienie multimediów](/pl/nodes/media-understanding)
- [Tryb rozmowy](/pl/nodes/talk)
- [Wybudzanie głosowe](/pl/nodes/voicewake)
