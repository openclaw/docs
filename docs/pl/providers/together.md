---
read_when:
    - Chcesz używać Together AI z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API albo wyboru uwierzytelniania CLI
summary: Konfiguracja Together AI (uwierzytelnianie + wybór modelu)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T18:15:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) zapewnia dostęp do wiodących modeli open-source, w tym Llama, DeepSeek, Kimi i innych, przez ujednolicone API.

| Właściwość | Wartość                       |
| ---------- | ----------------------------- |
| Dostawca   | `together`                    |
| Uwierzytelnianie | `TOGETHER_API_KEY`      |
| API        | zgodne z OpenAI               |
| Bazowy URL | `https://api.together.xyz/v1` |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API na stronie
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Ustaw domyślny model">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### Przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
Preset onboardingu ustawia
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` jako model domyślny.
</Note>

## Wbudowany katalog

OpenClaw dostarcza ten dołączony katalog Together:

| Odwołanie do modelu                                | Nazwa                        | Wejście     | Kontekst | Uwagi                        |
| -------------------------------------------------- | ---------------------------- | ----------- | -------- | ---------------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | tekst       | 131,072  | Model domyślny               |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | tekst, obraz | 262,144 | Model rozumowania Kimi       |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | tekst       | 512,000  | Tekstowy model rozumowania   |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | tekst       | 32,768   | Szybki model tekstowy        |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | tekst       | 202,752  | Tekstowy model rozumowania   |

## Generowanie wideo

Dołączony Plugin `together` rejestruje także generowanie wideo za pomocą wspólnego narzędzia `video_generate`.

| Właściwość            | Wartość                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| Domyślny model wideo  | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| Tryby                 | tekst na wideo; tylko referencja z pojedynczego obrazu z `Wan-AI/Wan2.2-I2V-A14B` |
| Obsługiwane parametry | `aspectRatio`, `resolution`                                              |

Aby używać Together jako domyślnego dostawcy wideo:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać parametry wspólnego narzędzia, wybór dostawcy i działanie przełączania awaryjnego.
</Tip>

<AccordionGroup>
  <Accordion title="Uwaga dotycząca środowiska">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że
    `TOGETHER_API_KEY` jest dostępny dla tego procesu (na przykład w
    `~/.openclaw/.env` lub przez `env.shellEnv`).

    <Warning>
    Klucze ustawione tylko w interaktywnej powłoce nie są widoczne dla procesów Gateway zarządzanych przez demona. Użyj konfiguracji `~/.openclaw/.env` lub `env.shellEnv`, aby zapewnić trwałą dostępność.
    </Warning>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Sprawdź, czy klucz działa: `openclaw models list --provider together`
    - Jeśli modele się nie pojawiają, potwierdź, że klucz API jest ustawiony we właściwym środowisku dla procesu Gateway.
    - Odwołania do modeli używają formy `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Reguły dostawców, odwołania do modeli i działanie przełączania awaryjnego.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Parametry wspólnego narzędzia generowania wideo i wybór dostawcy.
  </Card>
  <Card title="Informacje o konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia dostawców.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Panel Together AI, dokumentacja API i cennik.
  </Card>
</CardGroup>
