---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використовуйте Anthropic Claude через ключі API або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic створює сімейство моделей **Claude**. OpenClaw підтримує два способи автентифікації:

- **API key** — прямий доступ до Anthropic API з оплатою за використання (моделі `anthropic/*`)
- **Claude CLI** — повторне використання наявного входу Claude Code на тому самому хості

<Warning>
Бекенд Claude CLI в OpenClaw запускає встановлений Claude Code CLI в
неінтерактивному режимі друку. Поточна документація Claude Code від Anthropic описує
`claude -p` як використання Agent SDK/програмне використання. Оновлення підтримки Anthropic від 15 червня 2026 року
призупинило оголошену зміну білінгу Agent SDK. Наразі Anthropic повідомляє, що
Claude Agent SDK, `claude -p` і використання сторонніх застосунків усе ще витрачають
ліміти використання підписки. Раніше оголошений щомісячний кредит Agent SDK
недоступний, поки Anthropic переглядає цей план.

Інтерактивний Claude Code досі витрачає ліміти плану Claude, у який виконано вхід. Автентифікація
через API key залишається прямим API-білінгом з оплатою за фактичне використання. Для довготривалих хостів Gateway,
спільної автоматизації та передбачуваних витрат у продакшені використовуйте Anthropic API key.

Перевіряйте поточні статті підтримки Anthropic, перш ніж покладатися на поведінку
білінгу підписки:

- [Довідник Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Використання Claude Agent SDK з вашим планом Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Використання Claude Code з вашим планом Pro або Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code з вашим планом Team або Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Керування витратами Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Початок роботи

<Tabs>
  <Tab title="API key">
    **Найкраще для:** стандартного доступу до API та білінгу за використанням.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть API key у [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Приклад конфігурації

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Найкраще для:** повторного використання наявного входу Claude CLI без окремого API key.

    <Steps>
      <Step title="Переконайтеся, що Claude CLI встановлено і вхід виконано">
        Перевірте за допомогою:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw виявляє та повторно використовує наявні облікові дані Claude CLI.
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Подробиці налаштування та виконання для бекенду Claude CLI наведено в [Бекенди CLI](/uk/gateway/cli-backends).
    </Note>

    <Warning>
    Повторне використання Claude CLI очікує, що процес OpenClaw працюватиме на тому самому хості, що й
    вхід Claude CLI. Інсталяції Docker можуть зберігати домашній каталог контейнера та виконувати вхід у
    Claude Code там; див.
    [Бекенд Claude CLI у Docker](/uk/install/docker#claude-cli-backend-in-docker).
    Інші контейнерні інсталяції, як-от [Podman](/uk/install/podman), не монтують хостовий
    `~/.claude` під час налаштування або виконання; використовуйте там Anthropic API key або виберіть
    провайдера з OAuth, керованим OpenClaw, як-от
    [OpenAI Codex](/uk/providers/openai).
    </Warning>

    ### Приклад конфігурації

    Надавайте перевагу канонічному посиланню на модель Anthropic плюс перевизначенню runtime CLI:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Застарілі посилання на моделі `claude-cli/claude-opus-4-7` досі працюють для
    сумісності, але нова конфігурація має зберігати вибір провайдера/моделі як
    `anthropic/*`, а бекенд виконання розміщувати в політиці runtime провайдера/моделі.

    ### Білінг і `claude -p`

    OpenClaw використовує неінтерактивний шлях Claude Code `claude -p` для запусків Claude CLI.
    Наразі Anthropic розглядає цей шлях як використання Agent SDK/програмне використання:

    - Оновлення підтримки Anthropic від 15 червня 2026 року призупинило раніше оголошений
      окремий план кредитів Agent SDK.
    - Наразі Claude Agent SDK у межах підписки, `claude -p` і використання сторонніх
      застосунків усе ще витрачають ліміти використання підписки, у яку виконано вхід.
    - Раніше оголошений щомісячний кредит Agent SDK недоступний, поки
      Anthropic переглядає цей план.
    - Входи Console/API-key використовують API-білінг з оплатою за фактичне використання і не отримують
      кредит Agent SDK підписки.

    Див. [статтю про план Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    від Anthropic щодо повідомлення про паузу, а також статті про плани Claude Code для поведінки підписок
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    і
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic може змінювати білінг Claude Code і поведінку лімітів швидкості без
    випуску OpenClaw. Перевіряйте `claude auth status`, `/status` і
    пов’язану документацію Anthropic, коли важлива передбачуваність білінгу.

    <Tip>
    Для спільної продакшн-автоматизації використовуйте Anthropic API key замість
    Claude CLI. OpenClaw також підтримує варіанти в стилі підписки від
    [OpenAI Codex](/uk/providers/openai), [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax) і [Z.AI / GLM](/uk/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Типові налаштування мислення (Claude Fable 5, 4.8 і 4.6)

`anthropic/claude-fable-5` завжди використовує адаптивне мислення і за замовчуванням має `high`
зусилля. Оскільки Anthropic не дозволяє вимикати мислення для цієї моделі,
`/think off` і `/think minimal` використовують `low` зусилля. OpenClaw також пропускає власні
значення temperature для запитів Fable 5.

Claude Opus 4.8 за замовчуванням в OpenClaw тримає мислення вимкненим. Коли ви явно вмикаєте адаптивне мислення через `/think high|xhigh|max`, OpenClaw надсилає значення зусиль Opus 4.8 від Anthropic; моделі Claude 4.6 за замовчуванням використовують `adaptive`.

Перевизначайте для окремого повідомлення за допомогою `/think:<level>` або в параметрах моделі:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Пов’язана документація Anthropic:
- [Адаптивне мислення](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Розширене мислення](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Кешування промптів

OpenClaw підтримує функцію кешування промптів Anthropic для автентифікації через API key.

| Значення            | Тривалість кешу | Опис                                             |
| ------------------- | --------------- | ------------------------------------------------ |
| `"short"` (типово)  | 5 хвилин        | Застосовується автоматично для автентифікації API key |
| `"long"`            | 1 година        | Розширений кеш                                   |
| `"none"`            | Без кешування   | Вимкнути кешування промптів                      |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Перевизначення кешу для окремих агентів">
    Використовуйте параметри рівня моделі як базові, а потім перевизначайте конкретних агентів через `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Порядок об’єднання конфігурації:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (відповідний `id`, перевизначення за ключем)

    Це дає змогу одному агенту зберігати довготривалий кеш, тоді як інший агент на тій самій моделі вимикає кешування для сплескового трафіку або трафіку з низьким повторним використанням.

  </Accordion>

  <Accordion title="Примітки щодо Bedrock Claude">
    - Моделі Anthropic Claude на Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізний `cacheRetention`, коли його налаштовано.
    - Для моделей Bedrock, які не належать Anthropic, під час виконання примусово встановлюється `cacheRetention: "none"`.
    - Розумні типові значення API-key також задають `cacheRetention: "short"` для посилань Claude-on-Bedrock, коли явне значення не встановлено.

  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Швидкий режим">
    Спільний перемикач `/fast` в OpenClaw підтримує прямий трафік Anthropic (API-key і OAuth до `api.anthropic.com`).

    | Команда | Відповідає |
    |---------|------------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Додається лише для прямих запитів до `api.anthropic.com`. Проксі-маршрути залишають `service_tier` без змін.
    - Явні параметри `serviceTier` або `service_tier` перевизначають `/fast`, коли встановлено обидва.
    - В облікових записах без доступної місткості Priority Tier `service_tier: "auto"` може перейти в `standard`.

    </Note>

  </Accordion>

  <Accordion title="Розуміння медіа (зображення та PDF)">
    Вбудований Plugin Anthropic реєструє розуміння зображень і PDF. OpenClaw
    автоматично визначає можливості медіа з налаштованої автентифікації Anthropic — додаткова
    конфігурація не потрібна.

    | Властивість      | Значення              |
    | ---------------- | --------------------- |
    | Типова модель    | `claude-opus-4-8`     |
    | Підтримуваний ввід | Зображення, PDF-документи |

    Коли до розмови прикріплено зображення або PDF, OpenClaw автоматично
    маршрутизує його через провайдера розуміння медіа Anthropic.

  </Accordion>

  <Accordion title="Контекстне вікно 1M">
    Контекстне вікно 1M від Anthropic доступне в моделях Claude 4.x з підтримкою GA,
    як-от Opus 4.8, Opus 4.7, Opus 4.6 і Sonnet 4.6. OpenClaw автоматично задає для цих моделей
    розмір 1M:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Старіші конфігурації можуть зберігати `params.context1m: true`, але OpenClaw більше не надсилає
    вилучений beta-заголовок `context-1m-2025-08-07`. Старіші записи конфігурації `anthropicBeta`
    з цим значенням ігноруються під час визначення заголовків запиту, а
    непідтримувані старіші моделі Claude залишаються на своєму звичайному контекстному вікні.

    `params.context1m: true` також застосовується до бекенду Claude CLI
    (`claude-cli/*`) для відповідних моделей Opus і Sonnet з підтримкою GA, зберігаючи
    контекстне вікно runtime для цих сеансів CLI відповідно до поведінки прямого API.

    <Warning>
    Потрібен доступ до довгого контексту у ваших облікових даних Anthropic. Автентифікація через OAuth/токен підписки зберігає потрібні Anthropic beta-заголовки, але OpenClaw вилучає застарілий beta-заголовок 1M, якщо він залишився в старішій конфігурації.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 з контекстом 1M">
    `anthropic/claude-opus-4-8` і його варіант `claude-cli` за замовчуванням мають
    контекстне вікно 1M — `params.context1m: true` не потрібен.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилки 401 / токен раптово став недійсним">
    Автентифікація токеном Anthropic має строк дії та може бути відкликана. Для нових налаштувань натомість використовуйте API-ключ Anthropic.
  </Accordion>

  <Accordion title='Не знайдено API-ключ для провайдера "anthropic"'>
    Автентифікація Anthropic є **окремою для кожного агента** — нові агенти не успадковують ключі основного агента. Повторно запустіть онбординг для цього агента (або налаштуйте API-ключ на хості Gateway), потім перевірте за допомогою `openclaw models status`.
  </Accordion>

  <Accordion title='Не знайдено облікових даних для профілю "anthropic:default"'>
    Запустіть `openclaw models status`, щоб побачити, який профіль автентифікації активний. Повторно запустіть онбординг або налаштуйте API-ключ для цього шляху профілю.
  </Accordion>

  <Accordion title="Немає доступного профілю автентифікації (усі в періоді очікування)">
    Перевірте `auth.unusableProfiles` у `openclaw models status --json`. Періоди очікування через обмеження швидкості Anthropic можуть бути прив’язані до моделі, тому споріднена модель Anthropic усе ще може бути придатною до використання. Додайте інший профіль Anthropic або зачекайте завершення періоду очікування.
  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [Поширені запитання](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="CLI-бекенди" href="/uk/gateway/cli-backends" icon="terminal">
    Налаштування бекенду Claude CLI та подробиці виконання.
  </Card>
  <Card title="Кешування промптів" href="/uk/reference/prompt-caching" icon="database">
    Як кешування промптів працює між провайдерами.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
