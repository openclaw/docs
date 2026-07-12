---
read_when:
    - Chcesz używać Groq z OpenClaw
    - Potrzebujesz zmiennej środowiskowej z kluczem API lub opcji uwierzytelniania w CLI
    - Konfigurujesz transkrypcję dźwięku Whisper w Groq
summary: Konfiguracja Groq (uwierzytelnianie + wybór modelu + transkrypcja Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-12T15:29:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) zapewnia ultraszybkie wnioskowanie dla modeli z otwartymi wagami (Llama, Gemma, Kimi, Qwen, GPT OSS i innych) przy użyciu niestandardowego sprzętu LPU. Plugin Groq rejestruje zarówno dostawcę czatu zgodnego z OpenAI, jak i dostawcę rozpoznawania zawartości multimediów audio.

| Właściwość                     | Wartość                                  |
| ------------------------------ | ---------------------------------------- |
| Identyfikator dostawcy         | `groq`                                   |
| Plugin                         | oficjalny pakiet zewnętrzny              |
| Zmienna środowiskowa autoryzacji | `GROQ_API_KEY`                         |
| API                            | zgodne z OpenAI (`openai-completions`)   |
| Bazowy adres URL               | `https://api.groq.com/openai/v1`         |
| Transkrypcja audio             | `whisper-large-v3-turbo` (domyślnie)     |
| Sugerowany domyślny model czatu | `groq/llama-3.3-70b-versatile`          |

## Instalowanie pluginu

Zainstaluj oficjalny plugin, a następnie uruchom ponownie Gateway:

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
  <Step title="Sprawdź dostępność katalogu">
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

OpenClaw zawiera oparty na manifeście katalog Groq, obejmujący zarówno pozycje z rozumowaniem, jak i bez niego. Uruchom `openclaw models list --provider groq`, aby wyświetlić statyczne pozycje dla zainstalowanej wersji, lub sprawdź [console.groq.com/docs/models](https://console.groq.com/docs/models), aby poznać oficjalną listę Groq.

| Odwołanie do modelu                              | Nazwa                   | Rozumowanie | Dane wejściowe | Kontekst |
| ------------------------------------------------ | ----------------------- | ----------- | --------------- | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | nie         | tekst           | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | nie         | tekst           | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | nie         | tekst + obraz   | 131,072  |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | tak         | tekst           | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | tak         | tekst           | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | tak         | tekst           | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | tak         | tekst           | 131,072  |
| `groq/groq/compound`                             | Compound                | tak         | tekst           | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | tak         | tekst           | 131,072  |

<Tip>
  Katalog zmienia się z każdym wydaniem OpenClaw. Polecenie `openclaw models list --provider groq` wyświetla pozycje znane zainstalowanej wersji; porównaj je z [console.groq.com/docs/models](https://console.groq.com/docs/models), aby sprawdzić nowo dodane lub wycofane modele.
</Tip>

## Modele rozumujące

Modele rozumujące Groq (`reasoning: true` w powyższej tabeli) odwzorowują wspólne poziomy `/think` OpenClaw na wartości `reasoning_effort`: `low`, `medium` lub `high`. Polecenia `/think off` lub `/think none` pomijają `reasoning_effort` w żądaniu, zamiast wysyłać wartość oznaczającą wyłączenie.

Zobacz [Tryby myślenia](/pl/tools/thinking), aby poznać wspólne poziomy `/think` i sposób, w jaki OpenClaw tłumaczy je dla poszczególnych dostawców.

## Transkrypcja audio

Plugin Groq rejestruje również **dostawcę rozpoznawania zawartości multimediów audio**, dzięki czemu wiadomości głosowe mogą być transkrybowane za pośrednictwem wspólnego interfejsu `tools.media.audio`.

| Właściwość                    | Wartość                                   |
| ----------------------------- | ----------------------------------------- |
| Wspólna ścieżka konfiguracji  | `tools.media.audio`                       |
| Domyślny bazowy adres URL     | `https://api.groq.com/openai/v1`          |
| Domyślny model                | `whisper-large-v3-turbo`                  |
| Automatyczny priorytet        | 20                                        |
| Punkt końcowy API             | zgodny z OpenAI `/audio/transcriptions`   |

Aby ustawić Groq jako domyślny mechanizm obsługi audio:

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
    Jeśli Gateway działa jako zarządzana usługa (launchd, systemd, Docker), zmienna `GROQ_API_KEY` musi być widoczna dla tego procesu — nie tylko dla interaktywnej powłoki.

    <Warning>
      Klucz wyeksportowany wyłącznie w interaktywnej powłoce nie będzie dostępny dla demona launchd ani systemd, chyba że to środowisko zostanie również do niego zaimportowane. Ustaw klucz w `~/.openclaw/.env` lub za pomocą `env.shellEnv`, aby proces Gateway mógł go odczytać.
    </Warning>

  </Accordion>

  <Accordion title="Niestandardowe identyfikatory modeli Groq">
    OpenClaw akceptuje podczas działania dowolny identyfikator modelu Groq. Użyj dokładnego identyfikatora podanego przez Groq i poprzedź go prefiksem `groq/`. Statyczny katalog obejmuje typowe przypadki; identyfikatory spoza katalogu korzystają z domyślnego szablonu zgodnego z OpenAI.

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

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Wybieranie dostawców, odwołań do modeli i sposobu działania mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Tryby myślenia" href="/pl/tools/thinking" icon="brain">
    Poziomy nakładu na rozumowanie i ich współdziałanie z zasadami dostawcy.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia dostawcy i audio.
  </Card>
  <Card title="Konsola Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Panel Groq, dokumentacja API i cennik.
  </Card>
</CardGroup>
