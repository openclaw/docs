---
read_when:
    - Ви встановлюєте, налаштовуєте або перевіряєте Plugin microsoft-foundry.
summary: Додає підтримку постачальника моделей Microsoft Foundry в OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-07-12T13:35:09Z"
    model: gpt-5.6
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
- Спосіб установлення: входить до складу OpenClaw

## Поверхня

постачальники: microsoft-foundry; контракти: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Постачальник генерування зображень: `microsoft-foundry`

## Вимоги

- Ресурс Microsoft Foundry або Azure AI Foundry із розгортаннями.
- Автентифікація за ключем API через `AZURE_OPENAI_API_KEY` або налаштований ключ API постачальника.
- Для автентифікації Entra ID установіть Azure CLI та виконайте `az login` перед
  початковим налаштуванням. OpenClaw оновлює токени середовища виконання Microsoft Foundry за допомогою
  `az account get-access-token`.

## Моделі чату

Розгортання чату Microsoft Foundry використовують посилання на модель постачальника
`microsoft-foundry/<deployment-name>`. Під час початкового налаштування ресурси
та розгортання Foundry виявляються за допомогою Azure CLI, після чого назва вибраного розгортання записується
до конфігурації моделі.

OpenClaw використовує кінцеву точку Foundry `/openai/v1` для підтримуваних
сумісних з OpenAI API чату:

- Сімейства моделей GPT, `o*`, `computer-use-preview` і DeepSeek-V4 за замовчуванням використовують
  `openai-responses`.
- MAI-DS-R1 та інші розгортання завершення чату використовують `openai-completions`,
  якщо явно не налаштовано інший підтримуваний API.
- MAI-DS-R1 позначається як здатна до міркування на основі вмісту міркувань, а не
  через `reasoning_effort`. Метадані її контексту та вихідних токенів становлять
  163 840 токенів.

Розгортання Anthropic Claude у Microsoft Foundry використовують формат API Anthropic Messages,
а не сумісний з OpenAI формат `/openai/v1`. Налаштуйте їх як
власного постачальника `anthropic-messages`, доки Plugin Microsoft Foundry не отримає
власне середовище виконання Anthropic. Якщо назва розгортання Foundry відрізняється від
ідентифікатора моделі Claude, задайте `params.canonicalModelId` у записі моделі, щоб OpenClaw
міг застосовувати специфічні для моделі протокольні контракти, правильно зіставляти `/think off` і
безпечно зберігати підписані міркування.

## Генерування зображень MAI

Plugin реєструє `microsoft-foundry` для `image_generate` з актуальними
моделями зображень Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Використовуйте назву розгорнутого розгортання зображень MAI як посилання на модель. Постачальник
не оголошує модель зображень за замовчуванням, оскільки API MAI вимагає назву вашого розгортання
в полі `model` запиту:

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

Генерування лише за текстовим запитом викликає кінцеву точку генерування MAI Microsoft Foundry:
`/mai/v1/images/generations`. Редагування за еталонним зображенням викликає
`/mai/v1/images/edits` і обмежується розгортаннями `MAI-Image-2.5-Flash` та
`MAI-Image-2.5`.

Для генерування лише за текстовим запитом можна використовувати власну назву розгортання, налаштувавши лише кінцеву точку
Foundry. Для редагування зображень із власною назвою розгортання виберіть
розгортання під час початкового налаштування або додайте метадані моделі, щоб OpenClaw міг перевірити,
що розгортання працює на основі `MAI-Image-2.5-Flash` або `MAI-Image-2.5`.

Обмеження зображень MAI:

- Результат: одне зображення PNG на запит.
- Розмір: за замовчуванням `1024x1024`; ширина й висота мають становити щонайменше 768 пікселів.
- Загальна кількість пікселів: ширина × висота не повинна перевищувати 1 048 576.
- Редагування: одне вхідне зображення PNG або JPEG.
- Непідтримувані спільні підказки, як-от `aspectRatio`, `resolution`, `quality`,
  `background` і відмінний від PNG `outputFormat`, не надсилаються до Microsoft Foundry.

## Усунення несправностей

- `az: command not found`: установіть Azure CLI або використовуйте автентифікацію за ключем API.
- `Microsoft Foundry endpoint missing for MAI image generation`: виберіть
  розгортання Foundry під час початкового налаштування або додайте `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: вибрана модель зображень посилається на
  розгортання, що не належить до MAI. Використовуйте розгорнуту модель зображень MAI для `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
