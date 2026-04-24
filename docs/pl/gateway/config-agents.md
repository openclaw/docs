---
read_when:
    - Dostrajanie ustawień domyślnych agenta (modele, thinking, obszar roboczy, Heartbeat, multimedia, Skills)
    - Konfigurowanie routowania wielu agentów i powiązań
    - Dostosowywanie zachowania sesji, dostarczania wiadomości i trybu talk
summary: Ustawienia domyślne agenta, routowanie wielu agentów, konfiguracja sesji, wiadomości i talk
title: Konfiguracja — agenci
x-i18n:
    generated_at: "2026-04-24T09:08:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: de1587358404808b4a11a92a9392d7cc5bdd2b599773f8a0f7b4331551841991
    source_path: gateway/config-agents.md
    workflow: 15
---

Klucze konfiguracji ograniczone do agenta w `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` i `talk.*`. Dla kanałów, narzędzi, runtime Gateway i innych
kluczy najwyższego poziomu zobacz [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

## Ustawienia domyślne agenta

### `agents.defaults.workspace`

Domyślnie: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Opcjonalny katalog główny repozytorium pokazywany w wierszu Runtime w prompt systemowym. Jeśli nie jest ustawiony, OpenClaw wykrywa go automatycznie, idąc w górę od obszaru roboczego.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Opcjonalna domyślna allowlist Skills dla agentów, które nie ustawiają
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje wartości domyślne
      { id: "locked-down", skills: [] }, // brak Skills
    ],
  },
}
```

- Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
- Pomiń `agents.list[].skills`, aby dziedziczyć wartości domyślne.
- Ustaw `agents.list[].skills: []`, aby nie mieć żadnych Skills.
- Niepusta lista `agents.list[].skills` jest ostatecznym zestawem dla tego agenta; nie
  łączy się z wartościami domyślnymi.

### `agents.defaults.skipBootstrap`

Wyłącza automatyczne tworzenie plików bootstrap obszaru roboczego (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Kontroluje, kiedy pliki bootstrap obszaru roboczego są wstrzykiwane do promptu systemowego. Domyślnie: `"always"`.

- `"continuation-skip"`: bezpieczne tury kontynuacji (po zakończonej odpowiedzi asystenta) pomijają ponowne wstrzyknięcie bootstrap obszaru roboczego, zmniejszając rozmiar promptu. Uruchomienia Heartbeat i ponowienia po Compaction nadal odbudowują kontekst.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maksymalna liczba znaków na plik bootstrap obszaru roboczego przed obcięciem. Domyślnie: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maksymalna łączna liczba znaków wstrzykiwanych ze wszystkich plików bootstrap obszaru roboczego. Domyślnie: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kontroluje widoczny dla agenta tekst ostrzeżenia, gdy kontekst bootstrap jest obcinany.
Domyślnie: `"once"`.

- `"off"`: nigdy nie wstrzykuj tekstu ostrzeżenia do promptu systemowego.
- `"once"`: wstrzyknij ostrzeżenie raz dla każdego unikalnego podpisu obcięcia (zalecane).
- `"always"`: wstrzykuj ostrzeżenie przy każdym uruchomieniu, gdy istnieje obcięcie.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa własności budżetu kontekstu

OpenClaw ma wiele budżetów promptu/kontekstu o dużej objętości i są one
celowo rozdzielone według podsystemów zamiast przechodzić przez jedno ogólne
ustawienie.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  zwykłe wstrzykiwanie bootstrap obszaru roboczego.
- `agents.defaults.startupContext.*`:
  jednorazowe preludium startowe dla `/new` i `/reset`, w tym ostatnie dzienne
  pliki `memory/*.md`.
- `skills.limits.*`:
  kompaktowa lista Skills wstrzykiwana do promptu systemowego.
- `agents.defaults.contextLimits.*`:
  ograniczone fragmenty runtime i wstrzykiwane bloki należące do runtime.
- `memory.qmd.limits.*`:
  rozmiar fragmentów indeksowanego wyszukiwania pamięci i ich wstrzykiwania.

Używaj odpowiadającego nadpisania per agent tylko wtedy, gdy jeden agent potrzebuje innego
budżetu:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kontroluje preludium startowe pierwszej tury wstrzykiwane przy pustych uruchomieniach `/new` i `/reset`.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Współdzielone wartości domyślne dla ograniczonych powierzchni kontekstu runtime.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: domyślny limit fragmentu `memory_get` przed dodaniem
  metadanych obcięcia i informacji o kontynuacji.
- `memoryGetDefaultLines`: domyślne okno wierszy `memory_get`, gdy pominięto `lines`.
- `toolResultMaxChars`: limit aktywnego wyniku narzędzia używany dla zapisanych wyników i
  odzyskiwania po przepełnieniu.
- `postCompactionMaxChars`: limit fragmentu AGENTS.md używany podczas wstrzykiwania
  odświeżenia po Compaction.

#### `agents.list[].contextLimits`

Nadpisanie per agent dla współdzielonych ustawień `contextLimits`. Pominięte pola dziedziczą
z `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globalny limit dla kompaktowej listy Skills wstrzykiwanej do promptu systemowego. To
nie wpływa na odczytywanie plików `SKILL.md` na żądanie.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Nadpisanie per agent dla budżetu promptu Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Maksymalny rozmiar w pikselach dla dłuższego boku obrazu w blokach obrazu transkryptu/narzędzi przed wywołaniami providera.
Domyślnie: `1200`.

Niższe wartości zwykle zmniejszają użycie vision-tokenów i rozmiar ładunku żądania w przebiegach z dużą liczbą zrzutów ekranu.
Wyższe wartości zachowują więcej szczegółów wizualnych.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Strefa czasowa dla kontekstu promptu systemowego (nie dla znaczników czasu wiadomości). Rezerwa to strefa czasowa hosta.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format czasu w promptcie systemowym. Domyślnie: `auto` (preferencja OS).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // globalne domyślne parametry providera
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, np. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Forma ciągu ustawia tylko model podstawowy.
  - Forma obiektu ustawia model podstawowy oraz uporządkowane modele failover.
- `imageModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez ścieżkę narzędzia `image` jako konfiguracja modelu vision.
  - Używany także jako routowanie rezerwowe, gdy wybrany/dom yślny model nie może przyjąć obrazu jako wejścia.
- `imageGenerationModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną możliwość generowania obrazów oraz każdą przyszłą powierzchnię narzędzia/Pluginu generującą obrazy.
  - Typowe wartości: `google/gemini-3.1-flash-image-preview` dla natywnego generowania obrazów Gemini, `fal/fal-ai/flux/dev` dla fal albo `openai/gpt-image-2` dla OpenAI Images.
  - Jeśli wybierzesz provider/model bezpośrednio, skonfiguruj też pasujące uwierzytelnianie providera (na przykład `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla `google/*`, `OPENAI_API_KEY` lub OpenAI Codex OAuth dla `openai/gpt-image-2`, `FAL_KEY` dla `fal/*`).
  - Jeśli to pole zostanie pominięte, `image_generate` nadal może wywnioskować domyślnego providera z obsługą uwierzytelniania. Najpierw próbuje bieżącego domyślnego providera, a potem pozostałych zarejestrowanych providerów generowania obrazów w kolejności identyfikatorów providerów.
- `musicGenerationModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną możliwość generowania muzyki oraz wbudowane narzędzie `music_generate`.
  - Typowe wartości: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` albo `minimax/music-2.5+`.
  - Jeśli to pole zostanie pominięte, `music_generate` nadal może wywnioskować domyślnego providera z obsługą uwierzytelniania. Najpierw próbuje bieżącego domyślnego providera, a potem pozostałych zarejestrowanych providerów generowania muzyki w kolejności identyfikatorów providerów.
  - Jeśli wybierzesz provider/model bezpośrednio, skonfiguruj też pasujące uwierzytelnianie providera/klucz API.
- `videoGenerationModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną możliwość generowania wideo oraz wbudowane narzędzie `video_generate`.
  - Typowe wartości: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` albo `qwen/wan2.7-r2v`.
  - Jeśli to pole zostanie pominięte, `video_generate` nadal może wywnioskować domyślnego providera z obsługą uwierzytelniania. Najpierw próbuje bieżącego domyślnego providera, a potem pozostałych zarejestrowanych providerów generowania wideo w kolejności identyfikatorów providerów.
  - Jeśli wybierzesz provider/model bezpośrednio, skonfiguruj też pasujące uwierzytelnianie providera/klucz API.
  - Bundled provider generowania wideo Qwen obsługuje maksymalnie 1 wyjściowe wideo, 1 wejściowy obraz, 4 wejściowe wideo, długość 10 sekund oraz opcje poziomu providera `size`, `aspectRatio`, `resolution`, `audio` i `watermark`.
- `pdfModel`: akceptuje albo ciąg (`"provider/model"`), albo obiekt (`{ primary, fallbacks }`).
  - Używany przez narzędzie `pdf` do routowania modeli.
  - Jeśli zostanie pominięty, narzędzie PDF przechodzi rezerwowo do `imageModel`, a następnie do rozwiązanego modelu sesji/dom yślnego.
- `pdfMaxBytesMb`: domyślny limit rozmiaru PDF dla narzędzia `pdf`, gdy podczas wywołania nie przekazano `maxBytesMb`.
- `pdfMaxPages`: domyślna maksymalna liczba stron uwzględnianych przez tryb rezerwowego wyodrębniania w narzędziu `pdf`.
- `verboseDefault`: domyślny poziom verbose dla agentów. Wartości: `"off"`, `"on"`, `"full"`. Domyślnie: `"off"`.
- `elevatedDefault`: domyślny poziom elevated-output dla agentów. Wartości: `"off"`, `"on"`, `"ask"`, `"full"`. Domyślnie: `"on"`.
- `model.primary`: format `provider/model` (np. `openai/gpt-5.4` dla dostępu przez klucz API albo `openai-codex/gpt-5.5` dla Codex OAuth). Jeśli pominiesz providera, OpenClaw najpierw próbuje aliasu, potem jednoznacznego dopasowania skonfigurowanego providera dla dokładnego identyfikatora modelu, a dopiero potem wraca do skonfigurowanego domyślnego providera (przestarzałe zachowanie zgodności, więc preferuj jawne `provider/model`). Jeśli ten provider nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw przechodzi do pierwszego skonfigurowanego provider/model zamiast ujawniać nieaktualny domyślny model usuniętego providera.
- `models`: skonfigurowany katalog modeli i allowlist dla `/model`. Każdy wpis może zawierać `alias` (skrót) i `params` (specyficzne dla providera, na przykład `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`).
  - Bezpieczne edycje: użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy. `config set` odmawia zastąpień, które usunęłyby istniejące wpisy allowlist, chyba że przekażesz `--replace`.
  - Przepływy configure/onboarding ograniczone do providera scalają wybrane modele providera z tą mapą i zachowują niepowiązanych providerów już skonfigurowanych.
  - Dla bezpośrednich modeli OpenAI Responses server-side Compaction jest włączane automatycznie. Użyj `params.responsesServerCompaction: false`, aby przestać wstrzykiwać `context_management`, albo `params.responsesCompactThreshold`, aby nadpisać próg. Zobacz [OpenAI server-side compaction](/pl/providers/openai#server-side-compaction-responses-api).
- `params`: globalne domyślne parametry providera stosowane do wszystkich modeli. Ustawiane w `agents.defaults.params` (np. `{ cacheRetention: "long" }`).
- Pierwszeństwo scalania `params` (konfiguracja): `agents.defaults.params` (globalna baza) jest nadpisywane przez `agents.defaults.models["provider/model"].params` (per model), a następnie `agents.list[].params` (pasujący identyfikator agenta) nadpisuje według klucza. Zobacz [Prompt Caching](/pl/reference/prompt-caching), aby poznać szczegóły.
- `embeddedHarness`: domyślne zasady niskopoziomowego runtime osadzonego agenta. Użyj `runtime: "auto"`, aby zarejestrowane Plugin harnesses mogły przejąć obsługiwane modele, `runtime: "pi"`, aby wymusić wbudowany harness PI, albo zarejestrowanego identyfikatora harness, takiego jak `runtime: "codex"`. Ustaw `fallback: "none"`, aby wyłączyć automatyczny fallback PI.
- Konfiguratory zapisujące te pola (na przykład `/models set`, `/models set-image` oraz polecenia add/remove dla fallback) zapisują kanoniczną formę obiektu i, gdy to możliwe, zachowują istniejące listy fallback.
- `maxConcurrent`: maksymalna liczba równoległych uruchomień agentów między sesjami (każda sesja nadal jest serializowana). Domyślnie: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` kontroluje, który niskopoziomowy wykonawca uruchamia osadzone tury agenta.
W większości wdrożeń należy pozostawić wartość domyślną `{ runtime: "auto", fallback: "pi" }`.
Użyj tego, gdy zaufany Plugin udostępnia natywny harness, taki jak bundled
harness serwera aplikacji Codex.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` albo identyfikator zarejestrowanego Plugin harness. Bundled plugin Codex rejestruje `codex`.
- `fallback`: `"pi"` albo `"none"`. `"pi"` zachowuje wbudowany harness PI jako fallback zgodności, gdy nie wybrano żadnego Plugin harness. `"none"` powoduje, że brakujący albo nieobsługiwany wybór Plugin harness kończy się błędem zamiast cichego użycia PI. Błędy wybranego Plugin harness są zawsze ujawniane bezpośrednio.
- Nadpisania środowiskowe: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` nadpisuje `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` wyłącza fallback PI dla tego procesu.
- W przypadku wdrożeń tylko z Codex ustaw `model: "openai/gpt-5.5"`, `embeddedHarness.runtime: "codex"` i `embeddedHarness.fallback: "none"`.
- Wybór harness jest przypinany per identyfikator sesji po pierwszym osadzonym uruchomieniu. Zmiany konfiguracji/env wpływają na nowe lub zresetowane sesje, a nie na istniejący transkrypt. Starsze sesje z historią transkryptu, ale bez zapisanego przypięcia, są traktowane jako przypięte do PI. `/status` pokazuje identyfikatory harness inne niż PI, takie jak `codex`, obok `Fast`.
- To kontroluje tylko osadzony harness czatu. Generowanie multimediów, vision, PDF, muzyka, wideo i TTS nadal używają swoich ustawień provider/model.

**Wbudowane skróty aliasów** (działają tylko wtedy, gdy model znajduje się w `agents.defaults.models`):

| Alias               | Model                                              |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` lub skonfigurowany Codex OAuth GPT-5.5 |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

Twoje skonfigurowane aliasy zawsze mają pierwszeństwo przed domyślnymi.

Modele Z.AI GLM-4.x automatycznie włączają tryb thinking, chyba że ustawisz `--thinking off` albo samodzielnie zdefiniujesz `agents.defaults.models["zai/<model>"].params.thinking`.
Modele Z.AI domyślnie włączają `tool_stream` dla strumieniowania wywołań narzędzi. Ustaw `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby to wyłączyć.
Modele Anthropic Claude 4.6 domyślnie używają thinking `adaptive`, gdy nie ustawiono jawnego poziomu thinking.

### `agents.defaults.cliBackends`

Opcjonalne backendy CLI dla tekstowych uruchomień rezerwowych (bez wywołań narzędzi). Przydatne jako kopia zapasowa, gdy providerzy API zawodzą.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backendy CLI są tekstowe w pierwszej kolejności; narzędzia są zawsze wyłączone.
- Sesje są obsługiwane, gdy ustawiono `sessionArg`.
- Przekazywanie obrazów jest obsługiwane, gdy `imageArg` akceptuje ścieżki plików.

### `agents.defaults.systemPromptOverride`

Zastępuje cały prompt systemowy złożony przez OpenClaw stałym ciągiem. Ustaw na poziomie domyślnym (`agents.defaults.systemPromptOverride`) albo per agent (`agents.list[].systemPromptOverride`). Wartości per agent mają pierwszeństwo; pusta wartość albo zawierająca tylko białe znaki jest ignorowana. Przydatne do kontrolowanych eksperymentów z promptami.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Niezależne od providera nakładki promptu stosowane według rodziny modeli. Identyfikatory modeli z rodziny GPT-5 otrzymują współdzielony kontrakt zachowania między providerami; `personality` kontroluje tylko warstwę przyjaznego stylu interakcji.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (domyślnie) i `"on"` włączają warstwę przyjaznego stylu interakcji.
- `"off"` wyłącza tylko warstwę przyjazną; oznaczony kontrakt zachowania GPT-5 pozostaje włączony.
- Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane, gdy to współdzielone ustawienie nie jest ustawione.

### `agents.defaults.heartbeat`

Okresowe uruchomienia Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m wyłącza
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // domyślnie: true; false pomija sekcję Heartbeat w promptcie systemowym
        lightContext: false, // domyślnie: false; true zachowuje tylko HEARTBEAT.md z plików bootstrap obszaru roboczego
        isolatedSession: false, // domyślnie: false; true uruchamia każdy Heartbeat w świeżej sesji (bez historii rozmowy)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (domyślnie) | block
        target: "none", // domyślnie: none | opcje: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: ciąg czasu trwania (ms/s/m/h). Domyślnie: `30m` (uwierzytelnianie kluczem API) albo `1h` (uwierzytelnianie OAuth). Ustaw `0m`, aby wyłączyć.
- `includeSystemPromptSection`: gdy ma wartość false, pomija sekcję Heartbeat w promptcie systemowym i pomija wstrzyknięcie `HEARTBEAT.md` do kontekstu bootstrap. Domyślnie: `true`.
- `suppressToolErrorWarnings`: gdy ma wartość true, ukrywa ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.
- `timeoutSeconds`: maksymalny czas w sekundach dozwolony dla tury agenta Heartbeat, po którym zostaje przerwana. Pozostaw nieustawione, aby użyć `agents.defaults.timeoutSeconds`.
- `directPolicy`: zasady dostarczania bezpośredniego/DM. `allow` (domyślnie) zezwala na dostarczanie do celu bezpośredniego. `block` blokuje dostarczanie do celu bezpośredniego i emituje `reason=dm-blocked`.
- `lightContext`: gdy ma wartość true, uruchomienia Heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap obszaru roboczego.
- `isolatedSession`: gdy ma wartość true, każdy Heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Ten sam wzorzec izolacji co Cron `sessionTarget: "isolated"`. Zmniejsza koszt tokenów per Heartbeat z około ~100K do ~2-5K tokenów.
- Per agent: ustaw `agents.list[].heartbeat`. Gdy jakikolwiek agent definiuje `heartbeat`, **tylko ci agenci** uruchamiają Heartbeat.
- Heartbeat uruchamia pełne tury agenta — krótsze interwały spalają więcej tokenów.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id zarejestrowanego Pluginu providera Compaction (opcjonalnie)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // używane, gdy identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] wyłącza ponowne wstrzykiwanie
        model: "openrouter/anthropic/claude-sonnet-4-6", // opcjonalne nadpisanie modelu tylko dla Compaction
        notifyUser: true, // wysyłaj krótkie powiadomienia, gdy Compaction się zaczyna i kończy (domyślnie: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` albo `safeguard` (podsumowanie w fragmentach dla długich historii). Zobacz [Compaction](/pl/concepts/compaction).
- `provider`: identyfikator zarejestrowanego Pluginu providera Compaction. Gdy ustawiony, wywoływane jest `summarize()` providera zamiast wbudowanego podsumowania LLM. W przypadku błędu następuje fallback do wbudowanego rozwiązania. Ustawienie providera wymusza `mode: "safeguard"`. Zobacz [Compaction](/pl/concepts/compaction).
- `timeoutSeconds`: maksymalna liczba sekund dozwolona dla pojedynczej operacji Compaction, po której OpenClaw ją przerywa. Domyślnie: `900`.
- `identifierPolicy`: `strict` (domyślnie), `off` albo `custom`. `strict` dodaje wbudowane wskazówki zachowania nieprzezroczystych identyfikatorów podczas podsumowywania Compaction.
- `identifierInstructions`: opcjonalny własny tekst zachowania identyfikatorów używany, gdy `identifierPolicy=custom`.
- `postCompactionSections`: opcjonalne nazwy sekcji H2/H3 z AGENTS.md do ponownego wstrzyknięcia po Compaction. Domyślnie `["Session Startup", "Red Lines"]`; ustaw `[]`, aby wyłączyć ponowne wstrzykiwanie. Gdy nieustawione albo jawnie ustawione na tę domyślną parę, starsze nagłówki `Every Session`/`Safety` są również akceptowane jako starszy fallback.
- `model`: opcjonalne nadpisanie `provider/model-id` tylko dla podsumowania Compaction. Użyj tego, gdy główna sesja powinna zachować jeden model, ale podsumowania Compaction powinny działać na innym; gdy nieustawione, Compaction używa modelu podstawowego sesji.
- `notifyUser`: gdy `true`, wysyła użytkownikowi krótkie powiadomienia, gdy Compaction się zaczyna i kończy (na przykład „Compacting context...” i „Compaction complete”). Domyślnie wyłączone, aby Compaction pozostało ciche.
- `memoryFlush`: cicha tura agentowa przed automatycznym Compaction w celu zapisania trwałych wspomnień. Pomijane, gdy obszar roboczy jest tylko do odczytu.

### `agents.defaults.contextPruning`

Przycina **stare wyniki narzędzi** z kontekstu w pamięci przed wysłaniem do LLM. **Nie** modyfikuje historii sesji na dysku.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // czas trwania (ms/s/m/h), domyślna jednostka: minuty
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Zachowanie trybu cache-ttl">

- `mode: "cache-ttl"` włącza przebiegi przycinania.
- `ttl` kontroluje, jak często przycinanie może uruchomić się ponownie (po ostatnim dotknięciu cache).
- Przycinanie najpierw miękko obcina zbyt duże wyniki narzędzi, a następnie w razie potrzeby twardo czyści starsze wyniki narzędzi.

**Soft-trim** zachowuje początek + koniec i wstawia `...` pośrodku.

**Hard-clear** zastępuje cały wynik narzędzia placeholderem.

Uwagi:

- Bloki obrazów nigdy nie są obcinane/czyszczone.
- Współczynniki są oparte na znakach (w przybliżeniu), a nie na dokładnej liczbie tokenów.
- Jeśli istnieje mniej niż `keepLastAssistants` wiadomości asystenta, przycinanie jest pomijane.

</Accordion>

Zobacz [Przycinanie sesji](/pl/concepts/session-pruning), aby poznać szczegóły zachowania.

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (użyj minMs/maxMs)
    },
  },
}
```

- Kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`, aby włączyć odpowiedzi blokowe.
- Nadpisania kanałów: `channels.<channel>.blockStreamingCoalesce` (oraz warianty per konto). Signal/Slack/Discord/Google Chat mają domyślnie `minChars: 1500`.
- `humanDelay`: losowa przerwa między odpowiedziami blokowymi. `natural` = 800–2500 ms. Nadpisanie per agent: `agents.list[].humanDelay`.

Zobacz [Streaming](/pl/concepts/streaming), aby poznać szczegóły zachowania i fragmentacji.

### Wskaźniki pisania

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Domyślnie: `instant` dla czatów bezpośrednich/wzmianek, `message` dla niewspomnianych czatów grupowych.
- Nadpisania per sesja: `session.typingMode`, `session.typingIntervalSeconds`.

Zobacz [Wskaźniki pisania](/pl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Opcjonalny sandboxing dla osadzonego agenta. Zobacz [Sandboxing](/pl/gateway/sandboxing), aby zapoznać się z pełnym przewodnikiem.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRef / treści inline również są obsługiwane:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Szczegóły sandbox">

**Backend:**

- `docker`: lokalny runtime Docker (domyślnie)
- `ssh`: ogólny zdalny runtime oparty na SSH
- `openshell`: runtime OpenShell

Gdy wybrano `backend: "openshell"`, ustawienia specyficzne dla runtime przenoszą się do
`plugins.entries.openshell.config`.

**Konfiguracja backendu SSH:**

- `target`: cel SSH w postaci `user@host[:port]`
- `command`: polecenie klienta SSH (domyślnie: `ssh`)
- `workspaceRoot`: bezwzględny zdalny katalog główny używany dla obszarów roboczych per scope
- `identityFile` / `certificateFile` / `knownHostsFile`: istniejące lokalne pliki przekazywane do OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: treści inline albo SecretRef, które OpenClaw materializuje do plików tymczasowych w runtime
- `strictHostKeyChecking` / `updateHostKeys`: ustawienia zasad kluczy hosta OpenSSH

**Pierwszeństwo uwierzytelniania SSH:**

- `identityData` ma pierwszeństwo przed `identityFile`
- `certificateData` ma pierwszeństwo przed `certificateFile`
- `knownHostsData` ma pierwszeństwo przed `knownHostsFile`
- Wartości `*Data` oparte na SecretRef są rozwiązywane z aktywnej migawki runtime sekretów przed startem sesji sandbox

**Zachowanie backendu SSH:**

- inicjalizuje zdalny obszar roboczy raz po utworzeniu lub odtworzeniu
- następnie utrzymuje zdalny obszar roboczy SSH jako kanoniczny
- routuje `exec`, narzędzia plikowe i ścieżki multimediów przez SSH
- nie synchronizuje automatycznie zdalnych zmian z powrotem do hosta
- nie obsługuje kontenerów przeglądarki sandbox

**Dostęp do obszaru roboczego:**

- `none`: obszar roboczy sandbox per scope w `~/.openclaw/sandboxes`
- `ro`: obszar roboczy sandbox w `/workspace`, obszar roboczy agenta montowany tylko do odczytu w `/agent`
- `rw`: obszar roboczy agenta montowany do odczytu i zapisu w `/workspace`

**Scope:**

- `session`: kontener + obszar roboczy per sesja
- `agent`: jeden kontener + obszar roboczy per agent (domyślnie)
- `shared`: współdzielony kontener i obszar roboczy (brak izolacji między sesjami)

**Konfiguracja Pluginu OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opcjonalnie
          gatewayEndpoint: "https://lab.example", // opcjonalnie
          policy: "strict", // opcjonalny identyfikator zasad OpenShell
          providers: ["openai"], // opcjonalnie
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Tryb OpenShell:**

- `mirror`: zainicjalizuj zdalny obszar na podstawie lokalnego przed exec, zsynchronizuj z powrotem po exec; lokalny obszar roboczy pozostaje kanoniczny
- `remote`: zainicjalizuj zdalny obszar raz przy tworzeniu sandbox, a potem utrzymuj zdalny obszar roboczy jako kanoniczny

W trybie `remote` lokalne edycje hosta wykonane poza OpenClaw nie są automatycznie synchronizowane do sandbox po kroku inicjalizacji.
Transport odbywa się przez SSH do sandbox OpenShell, ale Plugin zarządza cyklem życia sandbox oraz opcjonalną synchronizacją mirror.

**`setupCommand`** uruchamia się raz po utworzeniu kontenera (przez `sh -lc`). Wymaga wychodzącego dostępu do sieci, zapisywalnego katalogu głównego i użytkownika root.

**Kontenery domyślnie używają `network: "none"`** — ustaw `"bridge"` (albo własną sieć bridge), jeśli agent potrzebuje dostępu wychodzącego.
`"host"` jest blokowane. `"container:<id>"` jest domyślnie blokowane, chyba że jawnie ustawisz
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (awaryjnie).

**Załączniki przychodzące** są przygotowywane w `media/inbound/*` w aktywnym obszarze roboczym.

**`docker.binds`** montuje dodatkowe katalogi hosta; globalne oraz per-agent binds są scalane.

**Przeglądarka sandboxed** (`sandbox.browser.enabled`): Chromium + CDP w kontenerze. Adres URL noVNC jest wstrzykiwany do promptu systemowego. Nie wymaga `browser.enabled` w `openclaw.json`.
Dostęp obserwacyjny noVNC domyślnie używa uwierzytelniania VNC, a OpenClaw emituje adres URL z krótkotrwałym tokenem (zamiast ujawniać hasło we współdzielonym adresie URL).

- `allowHostControl: false` (domyślnie) blokuje sesjom sandboxed kierowanie do przeglądarki hosta.
- `network` domyślnie ma wartość `openclaw-sandbox-browser` (dedykowana sieć bridge). Ustaw `bridge` tylko wtedy, gdy jawnie chcesz globalnej łączności bridge.
- `cdpSourceRange` opcjonalnie ogranicza ruch przychodzący CDP na krawędzi kontenera do zakresu CIDR (na przykład `172.21.0.1/32`).
- `sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko do kontenera przeglądarki sandbox. Gdy jest ustawione (w tym `[]`), zastępuje `docker.binds` dla kontenera przeglądarki.
- Domyślne parametry uruchamiania są zdefiniowane w `scripts/sandbox-browser-entrypoint.sh` i dostrojone dla hostów kontenerowych:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (domyślnie włączone)
  - `--disable-3d-apis`, `--disable-software-rasterizer` i `--disable-gpu` są
    domyślnie włączone i można je wyłączyć przez
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, jeśli workflow wymaga WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ponownie włącza rozszerzenia, jeśli twój workflow
    ich wymaga.
  - `--renderer-process-limit=2` można zmienić przez
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ustaw `0`, aby użyć
    domyślnego limitu procesów Chromium.
  - plus `--no-sandbox` i `--disable-setuid-sandbox`, gdy włączono `noSandbox`.
  - Domyślne ustawienia są bazą obrazu kontenera; użyj własnego obrazu przeglądarki z własnym
    entrypoint, aby zmienić domyślne ustawienia kontenera.

</Accordion>

Sandboxing przeglądarki i `sandbox.docker.binds` działają tylko dla Docker.

Zbuduj obrazy:

```bash
scripts/sandbox-setup.sh           # główny obraz sandbox
scripts/sandbox-browser-setup.sh   # opcjonalny obraz przeglądarki
```

### `agents.list` (nadpisania per agent)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // albo { primary, fallbacks }
        thinkingDefault: "high", // nadpisanie poziomu thinking per agent
        reasoningDefault: "on", // nadpisanie widoczności reasoning per agent
        fastModeDefault: false, // nadpisanie trybu fast per agent
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // nadpisuje pasujące defaults.models params według klucza
        skills: ["docs-search"], // zastępuje agents.defaults.skills, gdy ustawione
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: stabilny identyfikator agenta (wymagany).
- `default`: gdy ustawiono wiele, wygrywa pierwszy (zapisywane jest ostrzeżenie). Jeśli żaden nie jest ustawiony, domyślny jest pierwszy wpis listy.
- `model`: forma ciągu nadpisuje tylko `primary`; forma obiektu `{ primary, fallbacks }` nadpisuje oba (`[]` wyłącza globalne fallback). Zadania Cron, które nadpisują tylko `primary`, nadal dziedziczą domyślne fallback, chyba że ustawisz `fallbacks: []`.
- `params`: parametry strumienia per agent scalane nad wybranym wpisem modelu w `agents.defaults.models`. Używaj tego do nadpisań specyficznych dla agenta, takich jak `cacheRetention`, `temperature` lub `maxTokens`, bez duplikowania całego katalogu modeli.
- `skills`: opcjonalna allowlist Skills per agent. Jeśli pominięta, agent dziedziczy `agents.defaults.skills`, gdy jest ustawione; jawna lista zastępuje wartości domyślne zamiast je scalać, a `[]` oznacza brak Skills.
- `thinkingDefault`: opcjonalny domyślny poziom thinking per agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Nadpisuje `agents.defaults.thinkingDefault` dla tego agenta, gdy nie ustawiono nadpisania per wiadomość ani per sesja.
- `reasoningDefault`: opcjonalna domyślna widoczność reasoning per agent (`on | off | stream`). Obowiązuje, gdy nie ustawiono nadpisania reasoning per wiadomość ani per sesja.
- `fastModeDefault`: opcjonalna domyślna wartość trybu fast per agent (`true | false`). Obowiązuje, gdy nie ustawiono nadpisania per wiadomość ani per sesja.
- `embeddedHarness`: opcjonalne nadpisanie zasad niskopoziomowego harness per agent. Użyj `{ runtime: "codex", fallback: "none" }`, aby jeden agent był tylko dla Codex, podczas gdy inni agenci zachowują domyślny fallback PI.
- `runtime`: opcjonalny deskryptor runtime per agent. Użyj `type: "acp"` z domyślnymi ustawieniami `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), gdy agent powinien domyślnie używać sesji harness ACP.
- `identity.avatar`: ścieżka względna do obszaru roboczego, adres URL `http(s)` albo URI `data:`.
- `identity` wyprowadza wartości domyślne: `ackReaction` z `emoji`, `mentionPatterns` z `name`/`emoji`.
- `subagents.allowAgents`: allowlist identyfikatorów agentów dla `sessions_spawn` (`["*"]` = dowolny; domyślnie: tylko ten sam agent).
- Ochrona dziedziczenia sandbox: jeśli sesja żądająca jest sandboxed, `sessions_spawn` odrzuca cele, które działałyby bez sandbox.
- `subagents.requireAgentId`: gdy ma wartość true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu; domyślnie: false).

---

## Routowanie wielu agentów

Uruchamiaj wielu izolowanych agentów w jednej Gateway. Zobacz [Multi-Agent](/pl/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Pola dopasowania powiązań

- `type` (opcjonalnie): `route` dla zwykłego routowania (brak typu domyślnie oznacza route), `acp` dla trwałych powiązań rozmów ACP.
- `match.channel` (wymagane)
- `match.accountId` (opcjonalnie; `*` = dowolne konto; pominięte = konto domyślne)
- `match.peer` (opcjonalnie; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcjonalnie; specyficzne dla kanału)
- `acp` (opcjonalnie; tylko dla `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministyczna kolejność dopasowania:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (dokładne, bez peer/guild/team)
5. `match.accountId: "*"` (dla całego kanału)
6. Agent domyślny

W obrębie każdego poziomu wygrywa pierwszy pasujący wpis `bindings`.

Dla wpisów `type: "acp"` OpenClaw rozwiązuje po dokładnej tożsamości rozmowy (`match.channel` + konto + `match.peer.id`) i nie używa powyższej kolejności poziomów powiązań routingu.

### Profile dostępu per agent

<Accordion title="Pełny dostęp (bez sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Narzędzia tylko do odczytu + obszar roboczy">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Brak dostępu do systemu plików (tylko wiadomości)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Zobacz [Sandbox i narzędzia Multi-Agent](/pl/tools/multi-agent-sandbox-tools), aby poznać szczegóły pierwszeństwa.

---

## Sesja

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // pomiń fork z wątku nadrzędnego powyżej tej liczby tokenów (0 wyłącza)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // czas trwania albo false
      maxDiskBytes: "500mb", // opcjonalny twardy budżet
      highWaterBytes: "400mb", // opcjonalny cel czyszczenia
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // domyślne automatyczne odwiązanie po bezczynności w godzinach (`0` wyłącza)
      maxAgeHours: 0, // domyślny twardy maksymalny wiek w godzinach (`0` wyłącza)
    },
    mainKey: "main", // starsze pole (runtime zawsze używa "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Szczegóły pól sesji">

- **`scope`**: bazowa strategia grupowania sesji dla kontekstów czatów grupowych.
  - `per-sender` (domyślnie): każdy nadawca dostaje izolowaną sesję w kontekście kanału.
  - `global`: wszyscy uczestnicy w kontekście kanału współdzielą jedną sesję (używaj tylko wtedy, gdy zamierzony jest współdzielony kontekst).
- **`dmScope`**: sposób grupowania DM.
  - `main`: wszystkie DM współdzielą główną sesję.
  - `per-peer`: izolacja według identyfikatora nadawcy między kanałami.
  - `per-channel-peer`: izolacja per kanał + nadawca (zalecane dla skrzynek odbiorczych wielu użytkowników).
  - `per-account-channel-peer`: izolacja per konto + kanał + nadawca (zalecane dla wielu kont).
- **`identityLinks`**: mapuje kanoniczne identyfikatory na peery z prefiksem providera dla współdzielenia sesji między kanałami.
- **`reset`**: podstawowe zasady resetu. `daily` resetuje o `atHour` czasu lokalnego; `idle` resetuje po `idleMinutes`. Gdy skonfigurowano oba, wygrywa to, które wygaśnie wcześniej.
- **`resetByType`**: nadpisania per typ (`direct`, `group`, `thread`). Starsze `dm` jest akceptowane jako alias dla `direct`.
- **`parentForkMaxTokens`**: maksymalna liczba `totalTokens` sesji nadrzędnej dozwolona przy tworzeniu sesji wątku z fork (`100000` domyślnie).
  - Jeśli `totalTokens` nadrzędnej sesji przekracza tę wartość, OpenClaw uruchamia świeżą sesję wątku zamiast dziedziczyć historię transkryptu nadrzędnego.
  - Ustaw `0`, aby wyłączyć tę ochronę i zawsze zezwalać na fork z rodzica.
- **`mainKey`**: starsze pole. Runtime zawsze używa `"main"` dla głównego zasobnika czatu bezpośredniego.
- **`agentToAgent.maxPingPongTurns`**: maksymalna liczba tur reply-back między agentami podczas wymiany agent-do-agenta (liczba całkowita, zakres: `0`–`5`). `0` wyłącza łańcuchowanie ping-pong.
- **`sendPolicy`**: dopasowuje według `channel`, `chatType` (`direct|group|channel`, ze starszym aliasem `dm`), `keyPrefix` albo `rawKeyPrefix`. Pierwsza reguła deny wygrywa.
- **`maintenance`**: kontrola czyszczenia + retencji magazynu sesji.
  - `mode`: `warn` emituje tylko ostrzeżenia; `enforce` stosuje czyszczenie.
  - `pruneAfter`: granica wieku dla nieaktualnych wpisów (domyślnie `30d`).
  - `maxEntries`: maksymalna liczba wpisów w `sessions.json` (domyślnie `500`).
  - `rotateBytes`: rotuje `sessions.json`, gdy przekroczy ten rozmiar (domyślnie `10mb`).
  - `resetArchiveRetention`: retencja dla archiwów transkryptów `*.reset.<timestamp>`. Domyślnie odpowiada `pruneAfter`; ustaw `false`, aby wyłączyć.
  - `maxDiskBytes`: opcjonalny budżet dyskowy katalogu sesji. W trybie `warn` zapisuje ostrzeżenia; w trybie `enforce` najpierw usuwa najstarsze artefakty/sesje.
  - `highWaterBytes`: opcjonalny cel po czyszczeniu budżetu. Domyślnie `80%` z `maxDiskBytes`.
- **`threadBindings`**: globalne wartości domyślne dla funkcji sesji powiązanych z wątkiem.
  - `enabled`: główny domyślny przełącznik (providerzy mogą nadpisywać; Discord używa `channels.discord.threadBindings.enabled`)
  - `idleHours`: domyślne automatyczne odwiązanie po bezczynności w godzinach (`0` wyłącza; providerzy mogą nadpisywać)
  - `maxAgeHours`: domyślny twardy maksymalny wiek w godzinach (`0` wyłącza; providerzy mogą nadpisywać)

</Accordion>

---

## Wiadomości

```json5
{
  messages: {
    responsePrefix: "🦞", // albo "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 wyłącza
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefiks odpowiedzi

Nadpisania per kanał/konto: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Rozwiązywanie (wygrywa najbardziej szczegółowe): konto → kanał → globalne. `""` wyłącza i zatrzymuje kaskadę. `"auto"` wyprowadza `[{identity.name}]`.

**Zmienne szablonu:**

| Zmienna          | Opis                        | Przykład                    |
| ---------------- | --------------------------- | --------------------------- |
| `{model}`         | Krótka nazwa modelu         | `claude-opus-4-6`           |
| `{modelFull}`     | Pełny identyfikator modelu  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nazwa providera             | `anthropic`                 |
| `{thinkingLevel}` | Bieżący poziom thinking     | `high`, `low`, `off`        |
| `{identity.name}` | Nazwa tożsamości agenta     | (to samo co `"auto"`)       |

Zmienne są niewrażliwe na wielkość liter. `{think}` to alias dla `{thinkingLevel}`.

### Reakcja potwierdzająca

- Domyślnie używa `identity.emoji` aktywnego agenta, w przeciwnym razie `"👀"`. Ustaw `""`, aby wyłączyć.
- Nadpisania per kanał: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Kolejność rozwiązywania: konto → kanał → `messages.ackReaction` → fallback tożsamości.
- Zakres: `group-mentions` (domyślnie), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: usuwa potwierdzenie po odpowiedzi w Slack, Discord i Telegram.
- `messages.statusReactions.enabled`: włącza reakcje statusu cyklu życia w Slack, Discord i Telegram.
  W Slack i Discord pozostawienie nieustawionego pola utrzymuje reakcje statusu włączone, gdy aktywne są reakcje potwierdzające.
  W Telegram ustaw to jawnie na `true`, aby włączyć reakcje statusu cyklu życia.

### Debounce wejściowy

Łączy szybkie wiadomości tekstowe od tego samego nadawcy w jedną turę agenta. Multimedia/załączniki są opróżniane natychmiast. Polecenia sterujące omijają debounce.

### TTS (zamiana tekstu na mowę)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` kontroluje domyślny tryb auto-TTS: `off`, `always`, `inbound` albo `tagged`. `/tts on|off` może nadpisywać lokalne preferencje, a `/tts status` pokazuje stan efektywny.
- `summaryModel` nadpisuje `agents.defaults.model.primary` dla auto-summary.
- `modelOverrides` jest domyślnie włączone; `modelOverrides.allowProvider` ma domyślnie wartość `false` (opcja opt-in).
- Klucze API mają fallback do `ELEVENLABS_API_KEY`/`XI_API_KEY` oraz `OPENAI_API_KEY`.
- `openai.baseUrl` nadpisuje endpoint OpenAI TTS. Kolejność rozwiązywania to konfiguracja, potem `OPENAI_TTS_BASE_URL`, a na końcu `https://api.openai.com/v1`.
- Gdy `openai.baseUrl` wskazuje endpoint inny niż OpenAI, OpenClaw traktuje go jako serwer TTS zgodny z OpenAI i łagodzi walidację modelu/głosu.

---

## Talk

Wartości domyślne dla trybu Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` musi pasować do klucza w `talk.providers`, gdy skonfigurowano wielu providerów Talk.
- Starsze płaskie klucze Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) służą wyłącznie zgodności i są automatycznie migrowane do `talk.providers.<provider>`.
- Identyfikatory głosów mają fallback do `ELEVENLABS_VOICE_ID` lub `SAG_VOICE_ID`.
- `providers.*.apiKey` akceptuje zwykłe ciągi tekstowe albo obiekty SecretRef.
- Fallback `ELEVENLABS_API_KEY` działa tylko wtedy, gdy nie skonfigurowano klucza API Talk.
- `providers.*.voiceAliases` pozwala dyrektywom Talk używać przyjaznych nazw.
- `silenceTimeoutMs` kontroluje, jak długo tryb Talk czeka po ciszy użytkownika, zanim wyśle transkrypt. Pozostawienie nieustawionego pola zachowuje domyślne okno pauzy platformy (`700 ms na macOS i Android, 900 ms na iOS`).

---

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — wszystkie pozostałe klucze konfiguracji
- [Konfiguracja](/pl/gateway/configuration) — typowe zadania i szybka konfiguracja
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
