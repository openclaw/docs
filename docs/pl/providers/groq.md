---
read_when:
    - Chcesz używać Groq z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API albo wyboru uwierzytelniania CLI
    - Konfigurujesz transkrypcję audio Whisper w Groq
summary: Konfiguracja Groq (uwierzytelnianie + wybór modelu + transkrypcja Whisper)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:12:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) zapewnia ultraszybką inferencję na modelach o otwartych wagach (Llama, Gemma, Kimi, Qwen, GPT OSS i innych) przy użyciu niestandardowego sprzętu LPU. Plugin Groq rejestruje zarówno zgodnego z OpenAI dostawcę czatu, jak i dostawcę rozumienia multimediów audio.

| Właściwość                  | Wartość                                  |
| --------------------------- | ---------------------------------------- |
| Identyfikator dostawcy      | `groq`                                   |
| Plugin                      | oficjalny pakiet zewnętrzny              |
| Zmienna env uwierzytelniania | `GROQ_API_KEY`                           |
| API                         | zgodne z OpenAI (`openai-completions`)   |
| Bazowy URL                  | `https://api.groq.com/openai/v1`         |
| Transkrypcja audio          | `whisper-large-v3-turbo` (domyślnie)     |
| Sugerowana domyślna wartość czatu | `groq/llama-3.3-70b-versatile`     |

## Zainstaluj Plugin

Zainstaluj oficjalny Plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API na stronie [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Ustaw klucz API">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Ustaw domyślny model">
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

OpenClaw dostarcza oparty na manifeście katalog Groq z pozycjami obsługującymi rozumowanie i bez rozumowania. Uruchom `openclaw models list --provider groq`, aby zobaczyć statyczne wiersze dla zainstalowanej wersji, albo sprawdź [console.groq.com/docs/models](https://console.groq.com/docs/models), aby uzyskać autorytatywną listę Groq.

| Odwołanie do modelu                              | Nazwa                   | Rozumowanie | Dane wejściowe | Kontekst |
| ------------------------------------------------ | ----------------------- | ----------- | -------------- | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | nie         | tekst          | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | nie         | tekst          | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | nie         | tekst + obraz  | 131,072  |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | tak         | tekst          | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | tak         | tekst          | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | tak         | tekst          | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | tak         | tekst          | 131,072  |
| `groq/groq/compound`                             | Compound                | tak         | tekst          | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | tak         | tekst          | 131,072  |

<Tip>
  Katalog rozwija się z każdym wydaniem OpenClaw. `openclaw models list --provider groq` pokazuje wiersze znane zainstalowanej wersji; porównaj z [console.groq.com/docs/models](https://console.groq.com/docs/models), aby sprawdzić nowo dodane lub wycofane modele.
</Tip>

## Modele rozumowania

OpenClaw mapuje wspólne poziomy `/think` na specyficzne dla modeli Groq wartości `reasoning_effort`:

- Dla `qwen/qwen3-32b` wyłączone myślenie wysyła `none`, a włączone myślenie wysyła `default`.
- Dla modeli rozumowania Groq GPT OSS (`openai/gpt-oss-*`) OpenClaw wysyła `low`, `medium` lub `high` na podstawie poziomu `/think`. Wyłączone myślenie pomija `reasoning_effort`, ponieważ te modele nie obsługują wartości wyłączonej.
- DeepSeek R1 Distill, Qwen QwQ i Compound używają natywnego interfejsu rozumowania Groq; `/think` kontroluje widoczność, ale model zawsze rozumuje.

Zobacz [Tryby myślenia](/pl/tools/thinking), aby poznać wspólne poziomy `/think` i sposób, w jaki OpenClaw tłumaczy je dla poszczególnych dostawców.

## Transkrypcja audio

Plugin Groq rejestruje też **dostawcę rozumienia multimediów audio**, dzięki czemu wiadomości głosowe można transkrybować przez wspólny interfejs `tools.media.audio`.

| Właściwość                 | Wartość                                      |
| -------------------------- | -------------------------------------------- |
| Wspólna ścieżka konfiguracji | `tools.media.audio`                        |
| Domyślny bazowy URL        | `https://api.groq.com/openai/v1`             |
| Domyślny model             | `whisper-large-v3-turbo`                     |
| Automatyczny priorytet     | 20                                           |
| Punkt końcowy API          | Zgodny z OpenAI `/audio/transcriptions`      |

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
    Jeśli Gateway działa jako usługa zarządzana (launchd, systemd, Docker), `GROQ_API_KEY` musi być widoczny dla tego procesu — nie tylko dla interaktywnej powłoki.

    <Warning>
      Klucz wyeksportowany tylko w interaktywnej powłoce nie pomoże demonowi launchd ani systemd, chyba że to środowisko również zostanie tam zaimportowane. Ustaw klucz w `~/.openclaw/.env` lub przez `env.shellEnv`, aby był odczytywalny z procesu Gateway.
    </Warning>

  </Accordion>

  <Accordion title="Niestandardowe identyfikatory modeli Groq">
    OpenClaw akceptuje w czasie działania dowolny identyfikator modelu Groq. Użyj dokładnego identyfikatora podanego przez Groq i poprzedź go prefiksem `groq/`. Katalog statyczny obejmuje typowe przypadki; identyfikatory spoza katalogu przechodzą do domyślnego szablonu zgodnego z OpenAI.

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
    Pełny schemat konfiguracji, w tym ustawienia dostawców i audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Panel Groq, dokumentacja API i ceny.
  </Card>
</CardGroup>
