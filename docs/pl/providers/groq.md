---
read_when:
    - Chcesz korzystać z Groq w OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API albo wyboru uwierzytelniania CLI
    - Konfigurujesz transkrypcję audio Whisper na platformie Groq
summary: Konfiguracja Groq (uwierzytelnianie + wybór modelu + transkrypcja Whisper)
title: Groq
x-i18n:
    generated_at: "2026-05-06T09:27:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) zapewnia ultraszybką inferencję na modelach o otwartych wagach (Llama, Gemma, Kimi, Qwen, GPT OSS i innych) przy użyciu niestandardowego sprzętu LPU. OpenClaw zawiera dołączony Plugin Groq, który rejestruje zarówno dostawcę czatu zgodnego z OpenAI, jak i dostawcę rozumienia multimediów audio.

| Właściwość                 | Wartość                                  |
| -------------------------- | ---------------------------------------- |
| Identyfikator dostawcy     | `groq`                                   |
| Plugin                     | dołączony, `enabledByDefault: true`      |
| Zmienna środowiskowa auth  | `GROQ_API_KEY`                           |
| Flaga onboardingu          | `--auth-choice groq-api-key`             |
| API                        | zgodne z OpenAI (`openai-completions`)   |
| Bazowy URL                 | `https://api.groq.com/openai/v1`         |
| Transkrypcja audio         | `whisper-large-v3-turbo` (domyślnie)     |
| Sugerowany domyślny czat   | `groq/llama-3.3-70b-versatile`           |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API na [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Ustaw klucz API">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice groq-api-key
```

```bash Tylko środowisko
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

  </Step>
  <Step title="Ustaw model domyślny">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="Sprawdź, czy katalog jest osiągalny">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Przykład pliku konfiguracyjnego

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Wbudowany katalog

OpenClaw dostarcza oparty na manifeście katalog Groq z wpisami obsługującymi rozumowanie i bez rozumowania. Uruchom `openclaw models list --provider groq`, aby zobaczyć dołączone wiersze dla zainstalowanej wersji, albo sprawdź [console.groq.com/docs/models](https://console.groq.com/docs/models), aby uzyskać autorytatywną listę Groq.

| Referencja modelu                                    | Nazwa                         | Rozumowanie | Wejście      | Kontekst |
| ---------------------------------------------------- | ----------------------------- | ----------- | ------------ | -------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | nie         | tekst        | 131,072  |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | nie         | tekst        | 131,072  |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | nie         | tekst + obraz | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | nie         | tekst + obraz | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | nie         | tekst        | 8,192    |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | nie         | tekst        | 8,192    |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | nie         | tekst        | 8,192    |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | nie         | tekst        | 32,768   |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | nie         | tekst        | 131,072  |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | nie         | tekst        | 262,144  |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | tak         | tekst        | 131,072  |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | tak         | tekst        | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | tak         | tekst        | 131,072  |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | tak         | tekst        | 131,072  |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | tak         | tekst        | 131,072  |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | tak         | tekst        | 131,072  |
| `groq/groq/compound`                                 | Compound                      | tak         | tekst        | 131,072  |
| `groq/groq/compound-mini`                            | Compound Mini                 | tak         | tekst        | 131,072  |

<Tip>
  Katalog ewoluuje wraz z każdym wydaniem OpenClaw. `openclaw models list --provider groq` pokazuje wiersze znane zainstalowanej wersji; porównaj je z [console.groq.com/docs/models](https://console.groq.com/docs/models), aby sprawdzić nowo dodane lub wycofane modele.
</Tip>

## Modele rozumujące

OpenClaw mapuje swoje współdzielone poziomy `/think` na specyficzne dla modeli Groq wartości `reasoning_effort`:

- Dla `qwen/qwen3-32b` wyłączone myślenie wysyła `none`, a włączone myślenie wysyła `default`.
- Dla modeli rozumujących Groq GPT OSS (`openai/gpt-oss-*`) OpenClaw wysyła `low`, `medium` lub `high` na podstawie poziomu `/think`. Wyłączone myślenie pomija `reasoning_effort`, ponieważ te modele nie obsługują wartości wyłączającej.
- DeepSeek R1 Distill, Qwen QwQ i Compound używają natywnej powierzchni rozumowania Groq; `/think` kontroluje widoczność, ale model zawsze rozumuje.

Zobacz [Tryby myślenia](/pl/tools/thinking), aby poznać współdzielone poziomy `/think` i sposób, w jaki OpenClaw tłumaczy je dla każdego dostawcy.

## Transkrypcja audio

Dołączony Plugin Groq rejestruje także **dostawcę rozumienia multimediów audio**, aby wiadomości głosowe mogły być transkrybowane przez współdzieloną powierzchnię `tools.media.audio`.

| Właściwość                 | Wartość                                   |
| -------------------------- | ----------------------------------------- |
| Współdzielona ścieżka konfiguracji | `tools.media.audio`               |
| Domyślny bazowy URL        | `https://api.groq.com/openai/v1`          |
| Model domyślny             | `whisper-large-v3-turbo`                  |
| Priorytet automatyczny     | 20                                        |
| Punkt końcowy API          | zgodny z OpenAI `/audio/transcriptions`   |

Aby ustawić Groq jako domyślny backend audio:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Dostępność środowiska dla demona">
    Jeśli Gateway działa jako usługa zarządzana (launchd, systemd, Docker), `GROQ_API_KEY` musi być widoczny dla tego procesu, a nie tylko dla interaktywnej powłoki.

    <Warning>
      Klucz znajdujący się tylko w `~/.profile` nie pomoże demonowi launchd ani systemd, chyba że to środowisko zostanie tam również zaimportowane. Ustaw klucz w `~/.openclaw/.env` lub przez `env.shellEnv`, aby był czytelny z procesu gateway.
    </Warning>

  </Accordion>

  <Accordion title="Niestandardowe identyfikatory modeli Groq">
    OpenClaw akceptuje w czasie działania dowolny identyfikator modelu Groq. Użyj dokładnego identyfikatora pokazanego przez Groq i poprzedź go prefiksem `groq/`. Dołączony katalog obejmuje typowe przypadki; nieskatalogowane identyfikatory przechodzą do domyślnego szablonu zgodnego z OpenAI.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybór dostawców, referencji modeli i zachowania przełączania awaryjnego.
  </Card>
  <Card title="Tryby myślenia" href="/pl/tools/thinking" icon="brain">
    Poziomy wysiłku rozumowania i interakcja z polityką dostawcy.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji obejmujący ustawienia dostawcy i audio.
  </Card>
  <Card title="Konsola Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Panel Groq, dokumentacja API i ceny.
  </Card>
</CardGroup>
