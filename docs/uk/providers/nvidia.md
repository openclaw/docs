---
read_when:
    - Ви хочете безкоштовно використовувати відкриті моделі в OpenClaw
    - Вам потрібно налаштувати `NVIDIA_API_KEY`
summary: Використання OpenAI-compatible API від NVIDIA в OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-23T21:07:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2d056be5be012be537ba5c4d5812ea15ec440e5a552b235854e2078064376192
    source_path: providers/nvidia.md
    workflow: 15
---

NVIDIA надає OpenAI-compatible API за адресою `https://integrate.api.nvidia.com/v1` для
безкоштовного використання відкритих моделей. Автентифікація здійснюється через API key з
[build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Початок роботи

<Steps>
  <Step title="Отримайте свій API key">
    Створіть API key на [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Експортуйте ключ і запустіть onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="Встановіть модель NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
Якщо ви передасте `--token` замість env var, значення потрапить в історію shell і
у вивід `ps`. Якщо можливо, віддавайте перевагу змінній середовища `NVIDIA_API_KEY`.
</Warning>

## Приклад конфігурації

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Вбудований каталог

| Model ref                                  | Name                         | Context | Max output |
| ------------------------------------------ | ---------------------------- | ------- | ---------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192      |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192      |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192      |

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Поведінка auto-enable">
    Провайдер автоматично вмикається, коли задано змінну середовища `NVIDIA_API_KEY`.
    Окрім самого ключа, явна конфігурація провайдера не потрібна.
  </Accordion>

  <Accordion title="Каталог і тарифікація">
    Вбудований каталог є статичним. Вартість у source типово дорівнює `0`, оскільки NVIDIA
    наразі надає безкоштовний доступ до API для перелічених моделей.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA використовує стандартний endpoint completions `/v1`. Будь-який OpenAI-compatible
    інструментарій має працювати одразу з base URL NVIDIA.
  </Accordion>
</AccordionGroup>

<Tip>
Моделі NVIDIA наразі безкоштовні у використанні. Перевіряйте
[build.nvidia.com](https://build.nvidia.com/) для актуальної інформації про доступність і
ліміти rate-limit.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, model ref і поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
