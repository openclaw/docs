---
read_when:
    - Chcesz używać Together AI z OpenClaw
    - Potrzebujesz zmiennej środowiskowej z kluczem API lub opcji uwierzytelniania w CLI
summary: Konfiguracja Together AI (uwierzytelnianie + wybór modelu)
title: Together AI
x-i18n:
    generated_at: "2026-07-12T15:32:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) zapewnia dostęp do wiodących modeli open source,
w tym Llama, DeepSeek, Kimi i innych, za pośrednictwem ujednoliconego API.
OpenClaw udostępnia go jako dostawcę `together`.

| Właściwość | Wartość                       |
| ----------- | ----------------------------- |
| Dostawca    | `together`                    |
| Uwierzytelnianie | `TOGETHER_API_KEY`       |
| API         | zgodne z OpenAI               |
| Bazowy URL  | `https://api.together.xyz/v1` |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API na stronie
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Uruchom proces konfiguracji początkowej">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Ustaw model domyślny">
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
Proces konfiguracji początkowej ustawia `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`
jako model domyślny.
</Note>

## Wbudowany katalog

Koszt podano w USD za milion tokenów.

| Identyfikator modelu                                | Nazwa                        | Dane wejściowe | Kontekst | Maks. dane wyjściowe | Koszt (wej./wyj.) | Uwagi                         |
| -------------------------------------------------- | ---------------------------- | ---------------- | -------- | -------------------- | ----------------- | ----------------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | tekst            | 131,072  | 8,192                | 0.88 / 0.88       | Model domyślny                |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | tekst, obraz     | 262,144  | 32,768               | 1.20 / 4.50       | Model rozumujący              |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | tekst            | 512,000  | 8,192                | 2.10 / 4.40       | Model rozumujący              |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | tekst            | 32,768   | 8,192                | 0.30 / 0.30       | Szybki, bez funkcji rozumowania |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | tekst            | 202,752  | 8,192                | 1.40 / 4.40       | Model rozumujący              |

## Generowanie wideo

Dołączony plugin `together` rejestruje również funkcję generowania wideo za
pośrednictwem współdzielonego narzędzia `video_generate`.

| Właściwość              | Wartość                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| Domyślny model wideo    | `Wan-AI/Wan2.2-T2V-A14B`                                                                                 |
| Inne modele             | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                                   |
| Tryby                    | tekst na wideo; obraz na wideo tylko z `Wan-AI/Wan2.2-I2V-A14B` (jeden obraz referencyjny)                |
| Czas trwania             | 1–10 sekund                                                                                              |
| Obsługiwane parametry    | `size` (interpretowany jako `<width>x<height>`); `aspectRatio`/`resolution` nie są odczytywane            |

Aby używać Together jako domyślnego dostawcy generowania wideo:

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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać parametry
współdzielonego narzędzia, sposób wyboru dostawcy i zachowanie mechanizmu przełączania awaryjnego.
</Tip>

<AccordionGroup>
  <Accordion title="Uwaga dotycząca środowiska">
    Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że
    `TOGETHER_API_KEY` jest dostępny dla tego procesu (na przykład w
    `~/.openclaw/.env` lub za pośrednictwem `env.shellEnv`).

    <Warning>
    Klucze ustawione wyłącznie w interaktywnej powłoce nie są widoczne dla procesów
    Gateway zarządzanych jako demony. Aby zapewnić stałą dostępność, użyj
    `~/.openclaw/.env` lub konfiguracji `env.shellEnv`.
    </Warning>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Sprawdź, czy klucz działa: `openclaw models list --provider together`
    - Jeśli modele się nie pojawiają, upewnij się, że klucz API jest ustawiony
      we właściwym środowisku procesu Gateway.
    - Identyfikatory modeli mają postać `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Powiązane materiały

<CardGroup cols={2}>
  <Card title="Dostawcy modeli" href="/pl/concepts/model-providers" icon="layers">
    Reguły dostawców, identyfikatory modeli i zachowanie mechanizmu przełączania awaryjnego.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Parametry współdzielonego narzędzia do generowania wideo i wybór dostawcy.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia dostawców.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Panel Together AI, dokumentacja API i cennik.
  </Card>
</CardGroup>
