---
read_when:
    - Ви встановлюєте, налаштовуєте або перевіряєте plugin microsoft-foundry
summary: Додає підтримку провайдера моделей Microsoft Foundry до OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-06-27T18:00:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

Додає до OpenClaw підтримку постачальника моделей Microsoft Foundry.

## Розповсюдження

- Пакет: `@openclaw/microsoft-foundry`
- Маршрут інсталяції: включено в OpenClaw

## Інтерфейс

постачальники: microsoft-foundry; контракти: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Постачальник генерації зображень: `microsoft-foundry`

## Вимоги

- Ресурс Microsoft Foundry або Azure AI Foundry із розгортаннями.
- Автентифікація за API-ключем через `AZURE_OPENAI_API_KEY` або налаштований API-ключ постачальника.
- Для автентифікації Entra ID установіть Azure CLI і виконайте `az login` перед
  онбордингом. OpenClaw оновлює runtime-токени Microsoft Foundry через
  `az account get-access-token`.

## Моделі чату

Чат-розгортання Microsoft Foundry використовують посилання на модель постачальника
`microsoft-foundry/<deployment-name>`. Онбординг виявляє ресурси Foundry
і розгортання за допомогою Azure CLI, а потім записує вибрану назву розгортання в
конфігурацію моделі.

OpenClaw використовує кінцеву точку Foundry `/openai/v1` для підтримуваних OpenAI-сумісних
API чату:

- Сімейства моделей GPT, `o*`, `computer-use-preview` і DeepSeek-V4 за замовчуванням використовують
  `openai-responses`.
- MAI-DS-R1 та інші розгортання chat-completion використовують `openai-completions`,
  якщо не налаштовано явно підтримуваний API.
- MAI-DS-R1 записується як здатна до reasoning через reasoning-вміст, а не
  через `reasoning_effort`. Її метадані контексту й вихідних токенів становлять
  163 840 токенів.

Розгортання Anthropic Claude у Microsoft Foundry використовують форму API Anthropic Messages,
а не OpenAI-сумісну форму `/openai/v1`. Налаштовуйте їх як
користувацький постачальник `anthropic-messages`, доки Plugin Microsoft Foundry не отримає
нативний runtime Anthropic. Коли назва розгортання Foundry відрізняється від
ID моделі Claude, задайте `params.canonicalModelId` у записі моделі, щоб OpenClaw
міг застосовувати специфічні для моделі wire-контракти, правильно зіставляти `/think off` і
безпечно зберігати підписане thinking.

## Генерація зображень MAI

Plugin реєструє `microsoft-foundry` для `image_generate` з поточними
моделями зображень Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Використовуйте назву розгорнутого розгортання зображень MAI як посилання на модель. Постачальник не
оголошує модель зображень за замовчуванням, оскільки API MAI потребує назву вашого розгортання
в полі запиту `model`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

Виклики генерації лише за промптом використовують кінцеву точку генерацій MAI Microsoft Foundry:
`/mai/v1/images/generations`. Редагування з референсним зображенням використовують
`/mai/v1/images/edits` і обмежені розгортаннями `MAI-Image-2.5-Flash` та
`MAI-Image-2.5`.

Генерація лише за промптом може використовувати користувацьку назву розгортання лише з налаштованою
кінцевою точкою Foundry. Для редагувань зображень із користувацькою назвою розгортання виберіть
розгортання через онбординг або додайте метадані моделі, щоб OpenClaw міг перевірити,
що розгортання базується на `MAI-Image-2.5-Flash` або `MAI-Image-2.5`.

Обмеження зображень MAI:

- Вивід: одне зображення PNG на запит.
- Розмір: за замовчуванням `1024x1024`; і ширина, і висота мають бути щонайменше 768 px.
- Загальна кількість пікселів: ширина × висота має бути не більшою за 1 048 576.
- Редагування: одне вхідне зображення PNG або JPEG.
- Непідтримувані спільні підказки, як-от `aspectRatio`, `resolution`, `quality`,
  `background` і не-PNG `outputFormat`, не надсилаються до Microsoft Foundry.

## Усунення неполадок

- `az: command not found`: установіть Azure CLI або використовуйте автентифікацію за API-ключем.
- `Microsoft Foundry endpoint missing for MAI image generation`: виберіть
  розгортання Foundry через онбординг або додайте `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: вибрана модель зображень указує на
  не-MAI розгортання. Використовуйте розгорнуту модель зображень MAI для `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
