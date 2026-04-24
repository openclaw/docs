---
read_when:
    - Ви хочете використовувати моделі OpenAI в OpenClaw
    - Ви хочете використовувати автентифікацію за підпискою Codex замість API-ключів
    - Вам потрібна суворіша поведінка виконання агента GPT-5
summary: Використовуйте OpenAI через API-ключі або підписку Codex в OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-24T05:42:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d533338fa15d866bb69584706162ce099bb4a1edc9851183fb5442730ebdd9b
    source_path: providers/openai.md
    workflow: 15
---

OpenAI надає API для розробників для моделей GPT. OpenClaw підтримує три маршрути сімейства OpenAI. Префікс моделі визначає маршрут:

- **API key** — прямий доступ до платформи OpenAI з оплатою за використання (моделі `openai/*`)
- **Підписка Codex через PI** — вхід через ChatGPT/Codex із доступом за підпискою (моделі `openai-codex/*`)
- **Обв’язка app-server Codex** — нативне виконання через app-server Codex (`openai/*` моделі плюс `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI прямо підтримує використання OAuth-підписки у зовнішніх інструментах і робочих процесах, таких як OpenClaw.

<Note>
GPT-5.5 наразі доступна в OpenClaw через маршрути підписки/OAuth:
`openai-codex/gpt-5.5` із виконавцем PI або `openai/gpt-5.5` з
обв’язкою app-server Codex. Прямий доступ за API-ключем для `openai/gpt-5.5`
підтримується, щойно OpenAI увімкне GPT-5.5 у публічному API; до того часу використовуйте
модель з доступом через API, наприклад `openai/gpt-5.4`, для конфігурацій
`OPENAI_API_KEY`.
</Note>

<Note>
Увімкнення Plugin OpenAI або вибір моделі `openai-codex/*` не
увімкне вбудований Plugin app-server Codex. OpenClaw вмикає цей Plugin лише
коли ви явно вибираєте нативну обв’язку Codex через
`embeddedHarness.runtime: "codex"` або використовуєте застаріле посилання на модель `codex/*`.
</Note>

## Покриття можливостей OpenClaw

| Можливість OpenAI         | Поверхня OpenClaw                                         | Статус                                                 |
| ------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | постачальник моделі `openai/<model>`                      | Так                                                    |
| Моделі підписки Codex     | `openai-codex/<model>` з OAuth `openai-codex`             | Так                                                    |
| Обв’язка app-server Codex | `openai/<model>` з `embeddedHarness.runtime: codex`       | Так                                                    |
| Пошук у вебі на стороні сервера | нативний інструмент OpenAI Responses                | Так, коли вебпошук увімкнено і постачальник не закріплений |
| Зображення                | `image_generate`                                          | Так                                                    |
| Відео                     | `video_generate`                                          | Так                                                    |
| Перетворення тексту на мовлення | `messages.tts.provider: "openai"` / `tts`           | Так                                                    |
| Пакетне перетворення мовлення на текст | `tools.media.audio` / розуміння медіа         | Так                                                    |
| Потокове перетворення мовлення на текст | Voice Call `streaming.provider: "openai"`    | Так                                                    |
| Голос у реальному часі    | Voice Call `realtime.provider: "openai"` / Control UI Talk | Так                                                   |
| Embeddings                | постачальник embedding для пам’яті                        | Так                                                    |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="API key (платформа OpenAI)">
    **Найкраще для:** прямого доступу до API та оплати за використання.

    <Steps>
      <Step title="Отримайте свій API key">
        Створіть або скопіюйте API key з [інформаційної панелі платформи OpenAI](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Запустіть первинне налаштування">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Model ref | Маршрут | Автентифікація |
    |-----------|---------|----------------|
    | `openai/gpt-5.4` | Прямий API платформи OpenAI | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | Прямий API платформи OpenAI | `OPENAI_API_KEY` |
    | `openai/gpt-5.5` | Майбутній прямий маршрут API, коли OpenAI увімкне GPT-5.5 в API | `OPENAI_API_KEY` |

    <Note>
    `openai/*` — це прямий маршрут OpenAI за API-ключем, якщо ви явно не примусите
    обв’язку app-server Codex. Сама GPT-5.5 наразі доступна лише через підписку/OAuth;
    використовуйте `openai-codex/*` для OAuth Codex через виконавець PI за замовчуванням.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **не** надає `openai/gpt-5.3-codex-spark`. Активні запити до API OpenAI відхиляють цю модель, і поточний каталог Codex також її не надає.
    </Warning>

  </Tab>

  <Tab title="Підписка Codex">
    **Найкраще для:** використання вашої підписки ChatGPT/Codex замість окремого API key. Codex cloud потребує входу через ChatGPT.

    <Steps>
      <Step title="Запустіть OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        Або запустіть OAuth напряму:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        Для безголових середовищ або конфігурацій, де зворотний виклик незручний, додайте `--device-code`, щоб увійти через потік коду пристрою ChatGPT замість зворотного виклику браузера localhost:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="Встановіть модель за замовчуванням">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### Підсумок маршруту

    | Model ref | Маршрут | Автентифікація |
    |-----------|---------|----------------|
    | `openai-codex/gpt-5.5` | OAuth ChatGPT/Codex через PI | Вхід Codex |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Обв’язка app-server Codex | Автентифікація app-server Codex |

    <Note>
    Продовжуйте використовувати ідентифікатор постачальника `openai-codex` для команд автентифікації/профілю. Префікс моделі
    `openai-codex/*` також є явним маршрутом PI для OAuth Codex.
    Він не вибирає і не автовмикає вбудовану обв’язку app-server Codex.
    </Note>

    ### Приклад конфігурації

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    Первинне налаштування більше не імпортує OAuth-матеріали з `~/.codex`. Увійдіть через OAuth у браузері (за замовчуванням) або через потік коду пристрою вище — OpenClaw керує отриманими обліковими даними у власному сховищі автентифікації агента.
    </Note>

    ### Індикатор стану

    У чаті `/status` показує, яка вбудована обв’язка активна для поточної
    сесії. Обв’язка PI за замовчуванням відображається як `Runner: pi (embedded)` і
    не додає окремого значка. Коли вибрано вбудовану обв’язку app-server Codex,
    `/status` додає ідентифікатор обв’язки не-PI поруч із `Fast`, наприклад
    `Fast · codex`. Наявні сесії зберігають записаний для них ідентифікатор обв’язки, тому використовуйте
    `/new` або `/reset` після зміни `embeddedHarness`, якщо хочете, щоб `/status`
    відображав новий вибір PI/Codex.

    ### Обмеження вікна контексту

    OpenClaw розглядає метадані моделі та обмеження контексту середовища виконання як окремі значення.

    Для `openai-codex/gpt-5.5` через OAuth Codex:

    - Нативний `contextWindow`: `1000000`
    - Обмеження `contextTokens` середовища виконання за замовчуванням: `272000`

    Менше обмеження за замовчуванням на практиці дає кращі характеристики затримки та якості. Перевизначте його через `contextTokens`:

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Використовуйте `contextWindow`, щоб оголосити нативні метадані моделі. Використовуйте `contextTokens`, щоб обмежити бюджет контексту середовища виконання.
    </Note>

  </Tab>
</Tabs>

## Генерація зображень

Вбудований Plugin `openai` реєструє генерацію зображень через інструмент `image_generate`.
Він підтримує і генерацію зображень OpenAI за API-ключем, і генерацію зображень через OAuth Codex
через те саме посилання на модель `openai/gpt-image-2`.

| Можливість               | API key OpenAI                     | OAuth Codex                         |
| ------------------------ | ---------------------------------- | ----------------------------------- |
| Model ref                | `openai/gpt-image-2`               | `openai/gpt-image-2`                |
| Автентифікація           | `OPENAI_API_KEY`                   | Вхід через OAuth OpenAI Codex       |
| Транспорт                | API зображень OpenAI               | бекенд Codex Responses              |
| Макс. зображень на запит | 4                                  | 4                                   |
| Режим редагування        | Увімкнено (до 5 еталонних зображень) | Увімкнено (до 5 еталонних зображень) |
| Перевизначення розміру   | Підтримується, включно з розмірами 2K/4K | Підтримується, включно з розмірами 2K/4K |
| Співвідношення сторін / роздільна здатність | Не передається до API зображень OpenAI | Відображається у підтримуваний розмір, коли це безпечно |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Див. [Генерація зображень](/uk/tools/image-generation), щоб дізнатися про спільні параметри інструмента, вибір постачальника та поведінку при перемиканні на резервний варіант.
</Note>

`gpt-image-2` — модель за замовчуванням і для перетворення тексту на зображення OpenAI, і для
редагування зображень. `gpt-image-1` залишається доступною як явне перевизначення моделі, але нові
робочі процеси OpenAI для зображень мають використовувати `openai/gpt-image-2`.

Для інсталяцій із OAuth Codex зберігайте те саме посилання `openai/gpt-image-2`. Коли
налаштовано OAuth-профіль `openai-codex`, OpenClaw визначає цей збережений токен доступу OAuth
і надсилає запити на зображення через бекенд Codex Responses. Він
не спочатку пробує `OPENAI_API_KEY` і не виконує безшумний перехід на API key для цього
запиту. Явно налаштуйте `models.providers.openai` з API key,
власним базовим URL або кінцевою точкою Azure, якщо ви хочете використовувати
прямий маршрут API зображень OpenAI.
Якщо ця власна кінцева точка зображень розташована в довіреній LAN/приватній адресі, також встановіть
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; OpenClaw і надалі
блокує приватні/внутрішні OpenAI-сумісні кінцеві точки зображень, якщо цей явний дозвіл
не задано.

Генерація:

```
/tool image_generate model=openai/gpt-image-2 prompt="Відполірований постер запуску OpenClaw на macOS" size=3840x2160 count=1
```

Редагування:

```
/tool image_generate model=openai/gpt-image-2 prompt="Збережіть форму об’єкта, змініть матеріал на напівпрозоре скло" image=/path/to/reference.png size=1024x1536
```

## Генерація відео

Вбудований Plugin `openai` реєструє генерацію відео через інструмент `video_generate`.

| Можливість       | Значення                                                                          |
| ---------------- | --------------------------------------------------------------------------------- |
| Модель за замовчуванням | `openai/sora-2`                                                            |
| Режими           | Перетворення тексту на відео, зображення на відео, редагування одного відео      |
| Еталонні вхідні дані | 1 зображення або 1 відео                                                       |
| Перевизначення розміру | Підтримується                                                                |
| Інші перевизначення | `aspectRatio`, `resolution`, `audio`, `watermark` ігноруються з попередженням інструмента |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Див. [Генерація відео](/uk/tools/video-generation), щоб дізнатися про спільні параметри інструмента, вибір постачальника та поведінку при перемиканні на резервний варіант.
</Note>

## Внесок у промпт GPT-5

OpenClaw додає спільний внесок у промпт GPT-5 для запусків сімейства GPT-5 у різних постачальників. Він застосовується за ідентифікатором моделі, тому `openai-codex/gpt-5.5`, `openai/gpt-5.4`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` та інші сумісні посилання GPT-5 отримують однакове накладання. Старіші моделі GPT-4.x цього не отримують.

Вбудована нативна обв’язка Codex використовує ту саму поведінку GPT-5 і накладання Heartbeat через інструкції розробника app-server Codex, тому сесії `openai/gpt-5.x`, примусово спрямовані через `embeddedHarness.runtime: "codex"`, зберігають ті самі вказівки щодо доведення справ до кінця та проактивного Heartbeat, навіть попри те, що рештою промпта обв’язки керує Codex.

Внесок GPT-5 додає тегований контракт поведінки для збереження персони, безпеки виконання, дисципліни інструментів, форми виводу, перевірок завершення та верифікації. Специфічна для каналів поведінка відповіді та тихих повідомлень залишається у спільному системному промпті OpenClaw і політиці вихідної доставки. Вказівки GPT-5 завжди ввімкнені для відповідних моделей. Шар дружнього стилю взаємодії є окремим і налаштовуваним.

| Значення               | Ефект                                      |
| ---------------------- | ------------------------------------------ |
| `"friendly"` (типово)  | Увімкнути шар дружнього стилю взаємодії    |
| `"on"`                 | Псевдонім для `"friendly"`                 |
| `"off"`                | Вимкнути лише шар дружнього стилю          |

<Tabs>
  <Tab title="Конфігурація">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Під час виконання значення нечутливі до регістру, тому і `"Off"`, і `"off"` вимикають шар дружнього стилю.
</Tip>

<Note>
Застаріле `plugins.entries.openai.config.personality` усе ще зчитується як резервний варіант сумісності, коли спільне налаштування `agents.defaults.promptOverlays.gpt5.personality` не задане.
</Note>

## Голос і мовлення

<AccordionGroup>
  <Accordion title="Синтез мовлення (TTS)">
    Вбудований Plugin `openai` реєструє синтез мовлення для поверхні `messages.tts`.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | Голос | `messages.tts.providers.openai.voice` | `coral` |
    | Швидкість | `messages.tts.providers.openai.speed` | (не задано) |
    | Інструкції | `messages.tts.providers.openai.instructions` | (не задано, лише `gpt-4o-mini-tts`) |
    | Формат | `messages.tts.providers.openai.responseFormat` | `opus` для голосових нотаток, `mp3` для файлів |
    | API key | `messages.tts.providers.openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    Доступні моделі: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Доступні голоси: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Установіть `OPENAI_TTS_BASE_URL`, щоб перевизначити базовий URL TTS, не впливаючи на кінцеву точку API чату.
    </Note>

  </Accordion>

  <Accordion title="Перетворення мовлення на текст">
    Вбудований Plugin `openai` реєструє пакетне перетворення мовлення на текст через
    поверхню транскрибування розуміння медіа в OpenClaw.

    - Типова модель: `gpt-4o-transcribe`
    - Кінцева точка: OpenAI REST `/v1/audio/transcriptions`
    - Шлях введення: multipart-вивантаження аудіофайлу
    - Підтримується в OpenClaw всюди, де вхідне транскрибування аудіо використовує
      `tools.media.audio`, включно з сегментами голосових каналів Discord і
      аудіовкладеннями каналів

    Щоб примусово використовувати OpenAI для транскрибування вхідного аудіо:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Підказки щодо мови та промпта передаються до OpenAI, коли вони надаються
    спільною конфігурацією аудіомедіа або запитом транскрибування для окремого виклику.

  </Accordion>

  <Accordion title="Транскрибування в реальному часі">
    Вбудований Plugin `openai` реєструє транскрибування в реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Мова | `...openai.language` | (не задано) |
    | Промпт | `...openai.prompt` | (не задано) |
    | Тривалість тиші | `...openai.silenceDurationMs` | `800` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Використовує WebSocket-з’єднання з `wss://api.openai.com/v1/realtime` з аудіо у форматі G.711 u-law (`g711_ulaw` / `audio/pcmu`). Цей постачальник потокового передавання призначений для шляху транскрибування в реальному часі у Voice Call; голос Discord наразі записує короткі сегменти і натомість використовує пакетний шлях транскрибування `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Голос у реальному часі">
    Вбудований Plugin `openai` реєструє голос у реальному часі для Plugin Voice Call.

    | Налаштування | Шлях конфігурації | Типово |
    |---------|------------|---------|
    | Модель | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | Голос | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | Поріг VAD | `...openai.vadThreshold` | `0.5` |
    | Тривалість тиші | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | Резервно використовує `OPENAI_API_KEY` |

    <Note>
    Підтримує Azure OpenAI через ключі конфігурації `azureEndpoint` і `azureDeployment`. Підтримує двонапрямлений виклик інструментів. Використовує аудіоформат G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## Кінцеві точки Azure OpenAI

Вбудований постачальник `openai` може спрямовувати генерацію зображень до ресурсу Azure OpenAI
шляхом перевизначення базового URL. На шляху генерації зображень OpenClaw
визначає імена хостів Azure у `models.providers.openai.baseUrl` і автоматично
перемикається на формат запитів Azure.

<Note>
Голос у реальному часі використовує окремий шлях конфігурації
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
і не залежить від `models.providers.openai.baseUrl`. Див. акордеон **Голос у реальному
часі** в розділі [Голос і мовлення](#voice-and-speech) для його налаштувань Azure.
</Note>

Використовуйте Azure OpenAI, якщо:

- У вас уже є підписка Azure OpenAI, квота або корпоративна угода
- Вам потрібна регіональна локалізація даних або засоби відповідності вимогам, які надає Azure
- Ви хочете зберігати трафік у межах наявного середовища Azure

### Конфігурація

Для генерації зображень через Azure за допомогою вбудованого постачальника `openai` вкажіть
`models.providers.openai.baseUrl` на ваш ресурс Azure і встановіть `apiKey` у значення
ключа Azure OpenAI (а не ключа платформи OpenAI):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw розпізнає такі суфікси хостів Azure для маршруту генерації зображень Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Для запитів генерації зображень на розпізнаному хості Azure OpenClaw:

- Надсилає заголовок `api-key` замість `Authorization: Bearer`
- Використовує шляхи, прив’язані до розгортання (`/openai/deployments/{deployment}/...`)
- Додає `?api-version=...` до кожного запиту

Інші базові URL (публічний OpenAI, OpenAI-сумісні проксі) зберігають стандартний
формат запиту зображень OpenAI.

<Note>
Маршрутизація Azure для шляху генерації зображень постачальника `openai` вимагає
OpenClaw 2026.4.22 або новішої версії. У раніших версіях будь-який користувацький
`openai.baseUrl` обробляється як публічна кінцева точка OpenAI і не працюватиме з розгортаннями
зображень Azure.
</Note>

### Версія API

Установіть `AZURE_OPENAI_API_VERSION`, щоб зафіксувати конкретну preview- або GA-версію Azure
для шляху генерації зображень Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

Типове значення — `2024-12-01-preview`, коли змінну не задано.

### Імена моделей є іменами розгортань

Azure OpenAI прив’язує моделі до розгортань. Для запитів генерації зображень Azure,
спрямованих через вбудованого постачальника `openai`, поле `model` в OpenClaw
має бути **іменем розгортання Azure**, яке ви налаштували в порталі Azure, а не
ідентифікатором публічної моделі OpenAI.

Якщо ви створили розгортання з назвою `gpt-image-2-prod`, яке обслуговує `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Чистий постер" size=1024x1024 count=1
```

Те саме правило імені розгортання застосовується до викликів генерації зображень,
спрямованих через вбудованого постачальника `openai`.

### Регіональна доступність

Генерація зображень Azure наразі доступна лише в підмножині регіонів
(наприклад, `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Перевірте актуальний список регіонів Microsoft перед створенням
розгортання, а також підтвердьте, що конкретна модель доступна у вашому регіоні.

### Відмінності параметрів

Azure OpenAI і публічний OpenAI не завжди приймають однакові параметри зображень.
Azure може відхиляти параметри, які дозволяє публічний OpenAI (наприклад, певні
значення `background` для `gpt-image-2`), або надавати їх лише для певних версій
моделі. Ці відмінності походять від Azure і базової моделі, а не від
OpenClaw. Якщо запит Azure завершується помилкою валідації, перевірте
набір параметрів, який підтримується вашим конкретним розгортанням і версією API в
порталі Azure.

<Note>
Azure OpenAI використовує нативний транспорт і поведінку сумісності, але не отримує
приховані заголовки атрибуції OpenClaw — див. акордеон **Нативні та OpenAI-сумісні
маршрути** в розділі [Розширена конфігурація](#advanced-configuration).

Для трафіку чату або Responses в Azure (поза генерацією зображень) використовуйте
потік первинного налаштування або окрему конфігурацію постачальника Azure — одного лише
`openai.baseUrl` недостатньо, щоб застосувати формат API/автентифікації Azure. Існує
окремий постачальник `azure-openai-responses/*`; див.
акордеон Server-side Compaction нижче.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Транспорт (WebSocket проти SSE)">
    OpenClaw використовує пріоритет WebSocket із резервним переходом на SSE (`"auto"`) і для `openai/*`, і для `openai-codex/*`.

    У режимі `"auto"` OpenClaw:
    - Повторює одну ранню помилку WebSocket перед переходом на SSE
    - Після помилки позначає WebSocket як деградований приблизно на 60 секунд і використовує SSE під час періоду охолодження
    - Додає стабільні заголовки ідентичності сесії та ходу для повторних спроб і перепідключень
    - Нормалізує лічильники використання (`input_tokens` / `prompt_tokens`) між варіантами транспорту

    | Значення | Поведінка |
    |-------|----------|
    | `"auto"` (типово) | Спочатку WebSocket, резервний перехід на SSE |
    | `"sse"` | Примусово лише SSE |
    | `"websocket"` | Примусово лише WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Пов’язані документи OpenAI:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Прогрівання WebSocket">
    OpenClaw типово вмикає прогрівання WebSocket для `openai/*` і `openai-codex/*`, щоб зменшити затримку першого ходу.

    ```json5
    // Вимкнути прогрівання
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Швидкий режим">
    OpenClaw надає спільний перемикач швидкого режиму для `openai/*` і `openai-codex/*`:

    - **Чат/UI:** `/fast status|on|off`
    - **Конфігурація:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Коли його ввімкнено, OpenClaw зіставляє швидкий режим із пріоритетною обробкою OpenAI (`service_tier = "priority"`). Наявні значення `service_tier` зберігаються, а швидкий режим не переписує `reasoning` або `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Перевизначення сесії мають вищий пріоритет за конфігурацію. Очищення перевизначення сесії в UI сесій повертає сесію до налаштованого типового значення.
    </Note>

  </Accordion>

  <Accordion title="Пріоритетна обробка (service_tier)">
    API OpenAI надає пріоритетну обробку через `service_tier`. Налаштуйте її для кожної моделі в OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Підтримувані значення: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` передається лише до нативних кінцевих точок OpenAI (`api.openai.com`) і нативних кінцевих точок Codex (`chatgpt.com/backend-api`). Якщо ви маршрутизуєте будь-якого з цих постачальників через проксі, OpenClaw залишає `service_tier` без змін.
    </Warning>

  </Accordion>

  <Accordion title="Server-side Compaction (Responses API)">
    Для прямих моделей OpenAI Responses (`openai/*` на `api.openai.com`) обгортка потоку Pi-harness Plugin OpenAI автоматично вмикає Server-side Compaction:

    - Примусово встановлює `store: true` (якщо лише compat моделі не задає `supportsStore: false`)
    - Вставляє `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Типове значення `compact_threshold`: 70% від `contextWindow` (або `80000`, якщо недоступне)

    Це застосовується до вбудованого шляху Pi harness і до хуків постачальника OpenAI, які використовуються вбудованими запусками. Нативна обв’язка app-server Codex керує власним контекстом через Codex і налаштовується окремо через `agents.defaults.embeddedHarness.runtime`.

    <Tabs>
      <Tab title="Явно ввімкнути">
        Корисно для сумісних кінцевих точок, таких як Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Власний поріг">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Вимкнути">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` керує лише вставкою `context_management`. Прямі моделі OpenAI Responses усе одно примусово використовують `store: true`, якщо compat не задає `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Суворий агентний режим GPT">
    Для запусків сімейства GPT-5 на `openai/*` OpenClaw може використовувати суворіший вбудований контракт виконання:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    Із `strict-agentic` OpenClaw:
    - Більше не вважає хід лише з планом успішним прогресом, коли доступна дія інструмента
    - Повторює хід із вказівкою діяти негайно
    - Автоматично вмикає `update_plan` для суттєвої роботи
    - Показує явний заблокований стан, якщо модель продовжує планувати без дій

    <Note>
    Обмежено лише запуском сімейства GPT-5 OpenAI і Codex. Інші постачальники та старіші сімейства моделей зберігають типову поведінку.
    </Note>

  </Accordion>

  <Accordion title="Нативні та OpenAI-сумісні маршрути">
    OpenClaw по-різному обробляє прямі кінцеві точки OpenAI, Codex і Azure OpenAI порівняно із загальними OpenAI-сумісними проксі `/v1`:

    **Нативні маршрути** (`openai/*`, Azure OpenAI):
    - Зберігають `reasoning: { effort: "none" }` лише для моделей, які підтримують OpenAI `none` effort
    - Пропускають вимкнений reasoning для моделей або проксі, які відхиляють `reasoning.effort: "none"`
    - Типово використовують суворий режим для схем інструментів
    - Додають приховані заголовки атрибуції лише на перевірених нативних хостах
    - Зберігають формування запитів, специфічне для OpenAI (`service_tier`, `store`, compat reasoning, підказки кешу промптів)

    **Проксі/сумісні маршрути:**
    - Використовують м’якшу compat-поведінку
    - Не примушують до суворих схем інструментів або нативних заголовків

    Azure OpenAI використовує нативний транспорт і compat-поведінку, але не отримує прихованих заголовків атрибуції.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір постачальника.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір постачальника.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
