---
read_when:
    - Ви хочете використовувати моделі Anthropic в OpenClaw
summary: Використовуйте Anthropic Claude через API-ключі або Claude CLI в OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:33:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic створює сімейство моделей **Claude**. OpenClaw підтримує два способи автентифікації:

- **Ключ API** — прямий доступ до Anthropic API з оплатою за використання (моделі `anthropic/*`)
- **Claude CLI** — повторне використання наявного входу Claude Code на тому самому хості

<Warning>
Бекенд Claude CLI в OpenClaw запускає встановлений Claude Code CLI у
неінтерактивному режимі друку. Поточна документація Anthropic для Claude Code описує
`claude -p` як використання Agent SDK/програмне використання. Оновлення підтримки Anthropic
від 15 червня 2026 року призупинило оголошену зміну білінгу Agent SDK. Наразі Anthropic
повідомляє, що використання Claude Agent SDK, `claude -p` і сторонніх застосунків усе ще
витрачає ліміти використання передплати. Раніше оголошений щомісячний кредит Agent SDK
недоступний, поки Anthropic переглядає цей план.

Інтерактивний Claude Code усе ще витрачає ліміти плану Claude, у який виконано вхід.
Автентифікація ключем API залишається прямим API-білінгом з оплатою за фактом використання.
Для довготривалих хостів Gateway, спільної автоматизації та передбачуваних виробничих витрат
використовуйте ключ API Anthropic.

Перевірте поточні статті підтримки Anthropic, перш ніж покладатися на поведінку білінгу
передплати:

- [Довідник Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [Використання Claude Agent SDK з вашим планом Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Використання Claude Code з вашим планом Pro або Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Використання Claude Code з вашим планом Team або Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Керування витратами Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Початок роботи

<Tabs>
  <Tab title="Ключ API">
    **Найкраще для:** стандартного доступу до API та білінгу за використанням.

    <Steps>
      <Step title="Отримайте свій ключ API">
        Створіть ключ API у [консолі Anthropic](https://console.anthropic.com/).
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
    **Найкраще для:** повторного використання наявного входу Claude CLI без окремого ключа API.

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

        OpenClaw виявляє і повторно використовує наявні облікові дані Claude CLI.
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Деталі налаштування та виконання для бекенду Claude CLI наведені в [бекендах CLI](/uk/gateway/cli-backends).
    </Note>

    <Warning>
    Повторне використання Claude CLI очікує, що процес OpenClaw працюватиме на тому самому хості,
    де виконано вхід у Claude CLI. Інсталяції Docker можуть зберігати домашній каталог контейнера
    і виконувати вхід у Claude Code там; див.
    [бекенд Claude CLI у Docker](/uk/install/docker#claude-cli-backend-in-docker).
    Інші контейнерні інсталяції, як-от [Podman](/uk/install/podman), не монтують хостовий
    `~/.claude` у налаштування або середовище виконання; використовуйте там ключ API Anthropic
    або виберіть провайдера з OAuth, керованим OpenClaw, наприклад
    [OpenAI Codex](/uk/providers/openai).
    </Warning>

    ### Приклад конфігурації

    Надавайте перевагу канонічному посиланню на модель Anthropic плюс перевизначенню середовища виконання CLI:

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

    Застарілі посилання на моделі `claude-cli/claude-opus-4-7` усе ще працюють для
    сумісності, але нова конфігурація має зберігати вибір провайдера/моделі як
    `anthropic/*` і розміщувати бекенд виконання в політиці середовища виконання провайдера/моделі.

    ### Білінг і `claude -p`

    OpenClaw використовує неінтерактивний шлях Claude Code `claude -p` для запусків Claude CLI.
    Anthropic наразі розглядає цей шлях як використання Agent SDK/програмне використання:

    - Оновлення підтримки Anthropic від 15 червня 2026 року призупинило раніше оголошений
      окремий кредитний план Agent SDK.
    - Наразі Claude Agent SDK у межах передплатного плану, `claude -p` і використання
      сторонніх застосунків усе ще витрачають ліміти використання передплати, у яку виконано вхід.
    - Раніше оголошений щомісячний кредит Agent SDK недоступний, поки Anthropic переглядає цей план.
    - Входи через Console/ключ API використовують API-білінг з оплатою за фактом використання
      і не отримують кредит Agent SDK передплати.

    Див. [статтю про план Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    Anthropic щодо повідомлення про призупинення, а також статті про плани Claude Code для
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    і
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    щодо поведінки передплати.

    Anthropic може змінювати білінг Claude Code і поведінку обмеження швидкості без
    релізу OpenClaw. Перевіряйте `claude auth status`, `/status` і
    пов’язану документацію Anthropic, коли важлива передбачуваність білінгу.

    <Tip>
    Для спільної виробничої автоматизації використовуйте ключ API Anthropic замість
    Claude CLI. OpenClaw також підтримує варіанти у стилі передплати від
    [OpenAI Codex](/uk/providers/openai), [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax) і [Z.AI / GLM](/uk/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Типові налаштування мислення (Claude Fable 5, 4.8 і 4.6)

`anthropic/claude-fable-5` завжди використовує адаптивне мислення і за замовчуванням має
зусилля `high`. Оскільки Anthropic не дозволяє вимикати мислення для цієї моделі,
`/think off` і `/think minimal` використовують зусилля `low`. OpenClaw також пропускає власні
значення температури для запитів Fable 5.

Claude Opus 4.8 у OpenClaw за замовчуванням тримає мислення вимкненим. Коли ви явно вмикаєте адаптивне мислення через `/think high|xhigh|max`, OpenClaw надсилає значення зусилля Opus 4.8 від Anthropic; моделі Claude 4.6 за замовчуванням використовують `adaptive`.

Перевизначайте для окремого повідомлення через `/think:<level>` або в параметрах моделі:

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

## Резервний перехід після відмови безпеки (Claude Fable 5)

<Warning>
Використання Claude Fable 5 також означає використання Claude Opus 4.8. Fable 5 постачається з
класифікаторами безпеки, які можуть відхилити запит, і санкціоноване Anthropic
відновлення полягає в тому, щоб `claude-opus-4-8` обслугував цей хід. OpenClaw автоматично
вмикає це для прямих запитів із ключем API, тому деякі ходи Fable отримують відповіді
і тарифікуються як Claude Opus 4.8. Якщо ваша політика або бюджет не можуть прийняти
ходи, обслужені Opus, не вибирайте `anthropic/claude-fable-5`.
</Warning>

### Навіщо це існує

Класифікатори Fable 5 повертають `stop_reason: "refusal"` для запитів в обмежених
доменах, а також дають хибнопозитивні спрацювання на близьких до дозволених завданнях
(інструменти безпеки, науки про життя або навіть прохання до моделі відтворити її сирі
міркування). Без резервного переходу хід завершується помилкою, хоча
інша модель Claude із готовністю його обслужила б — власне повідомлення Anthropic про відмову
вказує інтеграторам API налаштувати резервну модель.

### Як це працює

1. Для кожного прямого запиту з ключем API до `anthropic/claude-fable-5` OpenClaw
   надсилає згоду на серверний резервний перехід Anthropic: beta-заголовок
   `server-side-fallback-2026-06-01` плюс
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 — єдина
   резервна ціль, яку Anthropic дозволяє для Fable 5.
2. Резервний перехід запускає лише відхилення класифікатором безпеки. Обмеження швидкості,
   перевантаження та помилки сервера поводяться точно як раніше і проходять через
   звичайне [перемикання моделі після збою](/uk/concepts/model-failover) OpenClaw.
3. Відновлення відбувається всередині того самого виклику. Відхилення до будь-якого виводу
   непомітне, крім затримки; уся відповідь надходить від Opus 4.8. У разі відхилення
   посеред потоку частковий текст зберігається як префікс, з якого продовжує резервна
   модель, тоді як міркування та виклики інструментів відхиленої моделі
   відкидаються згідно з правилами відтворення Anthropic (їх не можна повертати назад або
   виконувати).
4. Якщо Claude Opus 4.8 також відхиляє запит, хід показує відмову як
   помилку, точно як до цієї функції.

Резервний перехід відбувається на рівні Anthropic API, тому `claude-opus-4-8` не
потрібно додавати до вашого налаштованого списку моделей або ланцюга резервування — ключ API
з підтримкою Fable завжди може обслуговувати Opus.

### Спостережуваність і білінг

- Хід, обслужений резервною моделлю, записує діагностику `provider_fallback` у
  повідомленні асистента з назвами `fromModel` і `toModel`, а поле повідомлення
  `responseModel` повідомляє `claude-opus-4-8`.
- Anthropic виставляє рахунок за кожну спробу: відхилення до виводу безкоштовне, а відновлення
  тарифікується за ставками Claude Opus 4.8 (зараз це половина ставок Fable 5). Оцінка
  вартості за хід в OpenClaw оцінює ходи, обслужені резервною моделлю, за ставками Opus, щоб відповідати цьому.
- Відхилення посеред потоку додатково тарифікує вже передану частину Fable
  на боці Anthropic; ця частина відображається у використанні за спробу в API,
  але не включається до оцінки вартості за хід в OpenClaw.

### Область дії

Застосовується до `anthropic/claude-fable-5` з автентифікацією ключем API проти
`api.anthropic.com`. OAuth (повторне використання передплати Claude CLI), базові URL проксі,
запити Bedrock, Vertex і Foundry не змінені й усе ще показують
відмови як помилки.

Перевірено наживо: безпечний промпт із проханням до Fable 5 відтворити сирий ланцюжок
міркувань відхиляється з `category: "reasoning_extraction"`, коли надсилається без
резервних варіантів, а той самий промпт через OpenClaw повертає звичайну відповідь, обслужену Opus,
із доданою діагностикою `provider_fallback`.

Див. [посібник Anthropic щодо відмов і резервного переходу](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
для базової поведінки.

## Кешування промптів

OpenClaw підтримує функцію кешування промптів Anthropic для автентифікації ключем API.

| Значення            | Тривалість кешу | Опис                                             |
| ------------------- | --------------- | ------------------------------------------------ |
| `"short"` (типово)  | 5 хвилин        | Застосовується автоматично для автентифікації ключем API |
| `"long"`            | 1 година        | Розширений кеш                                  |
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

    Порядок об’єднання конфігурації:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (відповідний `id`, перевизначає за ключем)

    Це дає змогу одному агенту зберігати довготривалий кеш, тоді як інший агент на тій самій моделі вимикає кешування для пікового трафіку або трафіку з низьким повторним використанням.

  </Accordion>

  <Accordion title="Нотатки щодо Bedrock Claude">
    - Моделі Anthropic Claude на Bedrock (`amazon-bedrock/*anthropic.claude*`) приймають наскрізний `cacheRetention`, коли його налаштовано.
    - Не-Anthropic моделі Bedrock примусово отримують `cacheRetention: "none"` під час виконання.
    - Розумні стандартні значення для API-ключа також задають `cacheRetention: "short"` для посилань Claude-on-Bedrock, коли явне значення не встановлено.

  </Accordion>
</AccordionGroup>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Швидкий режим">
    Спільний перемикач OpenClaw `/fast` підтримує прямий трафік Anthropic (API-ключ і OAuth до `api.anthropic.com`).

    | Команда | Відповідає |
    |---------|---------|
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
    - В облікових записах без місткості Priority Tier `service_tier: "auto"` може перетворитися на `standard`.

    </Note>

  </Accordion>

  <Accordion title="Розуміння медіа (зображення та PDF)">
    Вбудований Plugin Anthropic реєструє розуміння зображень і PDF. OpenClaw
    автоматично визначає медіаможливості з налаштованої автентифікації Anthropic — додаткова
    конфігурація не потрібна.

    | Властивість        | Значення                 |
    | --------------- | --------------------- |
    | Стандартна модель   | `claude-opus-4-8`     |
    | Підтримуване введення | Зображення, PDF-документи |

    Коли до розмови прикріплено зображення або PDF, OpenClaw автоматично
    маршрутизує його через провайдера розуміння медіа Anthropic.

  </Accordion>

  <Accordion title="Контекстне вікно 1M">
    Контекстне вікно Anthropic 1M доступне в GA-сумісних моделях Claude 4.x,
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
    вилучений бета-заголовок `context-1m-2025-08-07`. Старіші записи конфігурації `anthropicBeta`
    з цим значенням ігноруються під час визначення заголовків запиту, а
    непідтримувані старіші моделі Claude залишаються на своєму звичайному контекстному вікні.

    `params.context1m: true` також застосовується до бекенда Claude CLI
    (`claude-cli/*`) для відповідних GA-сумісних моделей Opus і Sonnet, зберігаючи
    контекстне вікно під час виконання для цих сеансів CLI, щоб воно відповідало поведінці
    прямого API.

    <Warning>
    Потрібен доступ до довгого контексту для ваших облікових даних Anthropic. Автентифікація через OAuth/токен підписки зберігає потрібні бета-заголовки Anthropic, але OpenClaw видаляє вилучений бета-заголовок 1M, якщо він лишається в старішій конфігурації.
    </Warning>

  </Accordion>

  <Accordion title="Контекст 1M для Claude Opus 4.8">
    `anthropic/claude-opus-4-8` та його варіант `claude-cli` мають контекстне
    вікно 1M за замовчуванням — `params.context1m: true` не потрібен.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилки 401 / токен раптово став недійсним">
    Автентифікація токеном Anthropic має строк дії та може бути відкликана. Для нових налаштувань натомість використовуйте API-ключ Anthropic.
  </Accordion>

  <Accordion title='API-ключ для провайдера "anthropic" не знайдено'>
    Автентифікація Anthropic є **окремою для кожного агента** — нові агенти не успадковують ключі головного агента. Повторно запустіть онбординг для цього агента (або налаштуйте API-ключ на хості Gateway), потім перевірте за допомогою `openclaw models status`.
  </Accordion>

  <Accordion title='Облікові дані для профілю "anthropic:default" не знайдено'>
    Запустіть `openclaw models status`, щоб побачити, який профіль автентифікації активний. Повторно запустіть онбординг або налаштуйте API-ключ для цього шляху профілю.
  </Accordion>

  <Accordion title="Немає доступного профілю автентифікації (усі в cooldown)">
    Перевірте `auth.unusableProfiles` у `openclaw models status --json`. Cooldown через обмеження частоти Anthropic може бути прив’язаний до моделі, тому споріднена модель Anthropic може все ще бути придатною для використання. Додайте інший профіль Anthropic або зачекайте завершення cooldown.
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
  <Card title="Бекенди CLI" href="/uk/gateway/cli-backends" icon="terminal">
    Налаштування бекенда Claude CLI та деталі виконання.
  </Card>
  <Card title="Кешування промптів" href="/uk/reference/prompt-caching" icon="database">
    Як кешування промптів працює між провайдерами.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Деталі автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
