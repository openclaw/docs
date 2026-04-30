---
read_when:
    - Chcesz używać Together AI z OpenClaw
    - Potrzebujesz zmiennej środowiskowej z kluczem API albo wyboru uwierzytelniania CLI
summary: Konfiguracja Together AI (uwierzytelnianie + wybór modelu)
title: Together AI
x-i18n:
    generated_at: "2026-04-30T10:15:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7713c0b1e64014bbdd87a120de0a950b583afd1481338f2c6cccfb2b7da76e7
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) zapewnia dostęp do czołowych modeli open-source, w tym Llama, DeepSeek, Kimi i innych, przez ujednolicone API.

| Właściwość | Wartość                      |
| ---------- | ---------------------------- |
| Dostawca   | `together`                   |
| Uwierzytelnianie | `TOGETHER_API_KEY`     |
| API        | Zgodne z OpenAI              |
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
          model: { primary: "together/moonshotai/Kimi-K2.5" },
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
Preset onboardingu ustawia `together/moonshotai/Kimi-K2.5` jako domyślny
model.
</Note>

## Wbudowany katalog

OpenClaw dostarcza ten dołączony katalog Together:

| Referencja modelu                                            | Nazwa                                  | Dane wejściowe | Kontekst  | Uwagi                                      |
| ------------------------------------------------------------ | -------------------------------------- | -------------- | --------- | ------------------------------------------ |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | tekst, obraz   | 262,144   | Model domyślny; rozumowanie włączone       |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | tekst          | 202,752   | Uniwersalny model tekstowy                 |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | tekst          | 131,072   | Szybki model instrukcyjny                  |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | tekst, obraz   | 10,000,000 | Multimodalny                              |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | tekst, obraz   | 20,000,000 | Multimodalny                              |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | tekst          | 131,072   | Ogólny model tekstowy                      |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | tekst          | 131,072   | Model rozumujący                           |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | tekst          | 262,144   | Dodatkowy model tekstowy Kimi              |

## Generowanie wideo

Dołączony plugin `together` rejestruje także generowanie wideo przez
współdzielone narzędzie `video_generate`.

| Właściwość          | Wartość                               |
| ------------------- | ------------------------------------- |
| Domyślny model wideo | `together/Wan-AI/Wan2.2-T2V-A14B`    |
| Tryby               | tekst na wideo, referencja pojedynczego obrazu |
| Obsługiwane parametry | `aspectRatio`, `resolution`         |

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
Zobacz [Generowanie wideo](/pl/tools/video-generation), aby poznać współdzielone parametry narzędzia,
wybór dostawcy i zachowanie przełączania awaryjnego.
</Tip>

<AccordionGroup>
  <Accordion title="Uwaga dotycząca środowiska">
    Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że
    `TOGETHER_API_KEY` jest dostępny dla tego procesu (na przykład w
    `~/.openclaw/.env` lub przez `env.shellEnv`).

    <Warning>
    Klucze ustawione tylko w interaktywnej powłoce nie są widoczne dla procesów
    gateway zarządzanych przez daemon. Użyj `~/.openclaw/.env` lub konfiguracji
    `env.shellEnv`, aby zapewnić trwałą dostępność.
    </Warning>

  </Accordion>

  <Accordion title="Rozwiązywanie problemów">
    - Sprawdź, czy klucz działa: `openclaw models list --provider together`
    - Jeśli modele się nie pojawiają, potwierdź, że klucz API jest ustawiony we właściwym
      środowisku dla procesu Gateway.
    - Referencje modeli używają formatu `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Powiązane

<CardGroup cols={2}>
  <Card title="Wybór modelu" href="/pl/concepts/model-providers" icon="layers">
    Reguły dostawcy, referencje modeli i zachowanie przełączania awaryjnego.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Parametry współdzielonego narzędzia generowania wideo i wybór dostawcy.
  </Card>
  <Card title="Dokumentacja konfiguracji" href="/pl/gateway/configuration-reference" icon="gear">
    Pełny schemat konfiguracji, w tym ustawienia dostawcy.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Panel Together AI, dokumentacja API i cennik.
  </Card>
</CardGroup>
