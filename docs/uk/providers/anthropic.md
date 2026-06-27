---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використовуйте Anthropic Claude через ключі API або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T18:08:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic створює сімейство моделей **Claude**. OpenClaw підтримує два маршрути автентифікації:

- **API-ключ** — прямий доступ до Anthropic API з оплатою за використання (моделі `anthropic/*`)
- **Claude CLI** — повторне використання наявного входу Claude Code на тому самому хості

<Warning>
Бекенд Claude CLI в OpenClaw запускає встановлений Claude Code CLI у
неінтерактивному режимі друку. Поточна документація Anthropic для Claude Code описує
`claude -p` як використання Agent SDK/програмне використання. Починаючи з 15 червня 2026 року, Anthropic
повідомляє, що використання `claude -p` у межах підписного плану більше не витрачає звичайні ліміти плану Claude;
воно спочатку витрачає окремий щомісячний кредит Agent SDK, а потім
кредити використання за стандартними тарифами API, якщо ці кредити ввімкнено.

Інтерактивний Claude Code і надалі витрачає ліміти плану Claude, у який виконано вхід. Автентифікація
API-ключем залишається прямою оплатою API за фактичне використання. Для довготривалих хостів gateway,
спільної автоматизації та прогнозованих виробничих витрат використовуйте API-ключ Anthropic.

Поточна публічна документація Anthropic:

- [Довідник Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Використання Claude Agent SDK зі своїм планом Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Використання Claude Code зі своїм планом Pro або Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code зі своїм планом Team або Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Керування витратами Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Початок роботи

<Tabs>
  <Tab title="API-ключ">
    **Найкраще для:** стандартного доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій API-ключ">
        Створіть API-ключ у [Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Або передайте ключ безпосередньо:

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
    **Найкраще для:** повторного використання наявного входу Claude CLI без окремого API-ключа.

    <Steps>
      <Step title="Переконайтеся, що Claude CLI встановлено й виконано вхід">
        Перевірте за допомогою:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Запустіть початкове налаштування">
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
    Подробиці налаштування та виконання для бекенда Claude CLI наведено в [Бекенди CLI](/uk/gateway/cli-backends).
    </Note>

    <Warning>
    Повторне використання Claude CLI передбачає, що процес OpenClaw працює на тому самому хості, що й
    вхід Claude CLI. Встановлення Docker можуть зберігати домашній каталог контейнера та виконувати вхід у
    Claude Code там; див.
    [Бекенд Claude CLI у Docker](/uk/install/docker#claude-cli-backend-in-docker).
    Інші контейнерні встановлення, як-от [Podman](/uk/install/podman), не монтують хостовий
    `~/.claude` у налаштування або runtime; використовуйте там API-ключ Anthropic або виберіть
    провайдера з керованим OpenClaw OAuth, як-от
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

    Застарілі посилання на моделі `claude-cli/claude-opus-4-7` і далі працюють для
    сумісності, але нова конфігурація має зберігати вибір провайдера/моделі як
    `anthropic/*` і розміщувати бекенд виконання в політиці runtime провайдера/моделі.

    ### Виставлення рахунків і `claude -p`

    OpenClaw використовує неінтерактивний шлях Claude Code `claude -p` для запусків Claude CLI.
    Anthropic наразі трактує цей шлях як використання Agent SDK/програмне використання:

    - До 15 червня 2026 року обробка підписного плану відповідає активним
      правилам Anthropic Claude Code для облікового запису, у який виконано вхід.
    - Починаючи з 15 червня 2026 року, використання `claude -p` у межах підписного плану витрачає
      щомісячний кредит Agent SDK користувача спочатку, а потім кредити використання за стандартними
      тарифами API, якщо кредити використання ввімкнено.
    - Входи Console/API-ключем використовують оплату API за фактичне використання й не отримують
      кредит Agent SDK за підпискою.

    Anthropic може змінювати поведінку виставлення рахунків і лімітів швидкості Claude Code без
    релізу OpenClaw. Перевіряйте `claude auth status`, `/status` і
    пов'язану документацію Anthropic, коли важлива прогнозованість рахунків.

    <Tip>
    Для спільної виробничої автоматизації використовуйте API-ключ Anthropic замість
    Claude CLI. OpenClaw також підтримує варіанти в стилі підписки від
    [OpenAI Codex](/uk/providers/openai), [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax) і [Z.AI / GLM](/uk/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Типові налаштування thinking (Claude Fable 5, 4.8 і 4.6)

`anthropic/claude-fable-5` завжди використовує адаптивне thinking і за замовчуванням має зусилля `high`.
Оскільки Anthropic не дозволяє вимкнути thinking для цієї моделі,
`/think off` і `/think minimal` використовують зусилля `low`. OpenClaw також не додає користувацькі
значення temperature для запитів Fable 5.

Claude Opus 4.8 за замовчуванням тримає thinking вимкненим в OpenClaw. Коли ви явно вмикаєте адаптивне thinking за допомогою `/think high|xhigh|max`, OpenClaw надсилає значення зусиль Anthropic для Opus 4.8; моделі Claude 4.6 за замовчуванням використовують `adaptive`.

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
Пов'язана документація Anthropic:
- [Адаптивне thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Розширене thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Кешування промптів

OpenClaw підтримує функцію кешування промптів Anthropic для автентифікації API-ключем.

| Значення            | Тривалість кешу | Опис                                                   |
| ------------------- | --------------- | ------------------------------------------------------ |
| `"short"` (типово)  | 5 хвилин        | Застосовується автоматично для автентифікації API-ключем |
| `"long"`            | 1 година        | Розширений кеш                                         |
| `"none"`            | Без кешування   | Вимкнути кешування промптів                            |

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
  <Accordion title="Перевизначення кешу для окремого агента">
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

    Порядок злиття конфігурації:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (відповідний `id`, перевизначає за ключем)

    Це дає змогу одному агенту зберігати довготривалий кеш, тоді як інший агент на тій самій моделі вимикає кешування для сплескового трафіку або трафіку з низьким повторним використанням.

  </Accordion>

  <Accordion title="Примітки щодо Bedrock Claude">
    - Моделі Anthropic Claude на Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізний `cacheRetention`, коли його налаштовано.
    - Для не-Anthropic моделей Bedrock під час виконання примусово встановлюється `cacheRetention: "none"`.
    - Розумні типові налаштування API-ключа також задають `cacheRetention: "short"` для посилань Claude-on-Bedrock, коли явне значення не встановлено.

  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Швидкий режим">
    Спільний перемикач OpenClaw `/fast` підтримує прямий трафік Anthropic (API-ключ і OAuth до `api.anthropic.com`).

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
    - Додається лише для прямих запитів до `api.anthropic.com`. Proxy-маршрути залишають `service_tier` без змін.
    - Явні параметри `serviceTier` або `service_tier` перевизначають `/fast`, коли встановлено обидва.
    - Для облікових записів без потужності Priority Tier `service_tier: "auto"` може розв'язуватися в `standard`.

    </Note>

  </Accordion>

  <Accordion title="Розуміння медіа (зображення і PDF)">
    Вбудований Anthropic Plugin реєструє розуміння зображень і PDF. OpenClaw
    автоматично розв'язує медіаможливості з налаштованої автентифікації Anthropic — додаткова
    конфігурація не потрібна.

    | Властивість        | Значення              |
    | ------------------ | --------------------- |
    | Типова модель      | `claude-opus-4-8`     |
    | Підтримуваний вхід | Зображення, PDF-документи |

    Коли зображення або PDF прикріплено до розмови, OpenClaw автоматично
    маршрутизує його через провайдера розуміння медіа Anthropic.

  </Accordion>

  <Accordion title="Контекстне вікно 1M">
    Контекстне вікно 1M від Anthropic доступне на GA-сумісних моделях Claude 4.x,
    таких як Opus 4.8, Opus 4.7, Opus 4.6 і Sonnet 4.6. OpenClaw автоматично задає цим моделям
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

    `params.context1m: true` також застосовується до бекенда Claude CLI
    (`claude-cli/*`) для придатних GA-сумісних моделей Opus і Sonnet, зберігаючи
    контекстне вікно runtime для цих сеансів CLI відповідним до поведінки прямого API.

    <Warning>
    Потребує доступу до довгого контексту у ваших облікових даних Anthropic. Автентифікація OAuth/токеном підписки зберігає свої обов'язкові beta-заголовки Anthropic, але OpenClaw прибирає вилучений beta-заголовок 1M, якщо він лишається в старішій конфігурації.
    </Warning>

  </Accordion>

  <Accordion title="Контекст Claude Opus 4.8 1M">
    `anthropic/claude-opus-4-8` і його варіант `claude-cli` мають контекстне
    вікно 1M за замовчуванням — `params.context1m: true` не потрібен.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилки 401 / токен раптово недійсний">
    Автентифікація токеном Anthropic спливає й може бути відкликана. Для нових налаштувань натомість використовуйте API-ключ Anthropic.
  </Accordion>

  <Accordion title='Не знайдено ключ API для постачальника "anthropic"'>
    Автентифікація Anthropic є **окремою для кожного агента** — нові агенти не успадковують ключі головного агента. Повторно запустіть onboarding для цього агента (або налаштуйте ключ API на хості Gateway), потім перевірте за допомогою `openclaw models status`.
  </Accordion>

  <Accordion title='Не знайдено облікових даних для профілю "anthropic:default"'>
    Виконайте `openclaw models status`, щоб побачити, який профіль автентифікації активний. Повторно запустіть onboarding або налаштуйте ключ API для цього шляху профілю.
  </Accordion>

  <Accordion title="Немає доступного профілю автентифікації (усі в періоді очікування)">
    Перевірте `auth.unusableProfiles` у `openclaw models status --json`. Періоди очікування через обмеження швидкості Anthropic можуть бути обмежені конкретною моделлю, тому суміжна модель Anthropic усе ще може бути придатною до використання. Додайте інший профіль Anthropic або дочекайтеся завершення періоду очікування.
  </Accordion>
</AccordionGroup>

<Note>
Більше довідки: [Усунення несправностей](/uk/help/troubleshooting) і [Поширені запитання](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки failover.
  </Card>
  <Card title="CLI-бекенди" href="/uk/gateway/cli-backends" icon="terminal">
    Налаштування бекенду Claude CLI і деталі виконання.
  </Card>
  <Card title="Кешування prompt" href="/uk/reference/prompt-caching" icon="database">
    Як кешування prompt працює між постачальниками.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Деталі автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
