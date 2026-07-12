---
read_when:
    - می‌خواهید از مدل‌های Volcano Engine یا Doubao با OpenClaw استفاده کنید
    - باید کلید API مربوط به Volcengine را تنظیم کنید
    - می‌خواهید از تبدیل متن به گفتار Volcengine Speech استفاده کنید
summary: راه‌اندازی Volcano Engine (مدل‌های Doubao، نقاط پایانی کدنویسی و تبدیل متن به گفتار Seed Speech)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-12T10:47:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e853a1c8847704caedf0ec83c38332569f72105c5e34ad973daf614a2e80550b
    source_path: providers/volcengine.md
    workflow: 16
---

ارائه‌دهنده Volcengine دسترسی به مدل‌های Doubao و مدل‌های شخص ثالث میزبانی‌شده در Volcano Engine را فراهم می‌کند و برای بارهای کاری عمومی و کدنویسی، نقطه‌های پایانی جداگانه‌ای دارد. همین Plugin همراه، Volcengine Speech را نیز به‌عنوان ارائه‌دهنده TTS ثبت می‌کند.

| جزئیات            | مقدار                                                       |
| ----------------- | ----------------------------------------------------------- |
| ارائه‌دهندگان     | `volcengine` (عمومی + TTS)، `volcengine-plan` (کدنویسی)     |
| احراز هویت مدل    | `VOLCANO_ENGINE_API_KEY`                                    |
| احراز هویت TTS    | `VOLCENGINE_TTS_API_KEY` یا `BYTEPLUS_SEED_SPEECH_API_KEY`  |
| API               | مدل‌های سازگار با OpenAI، سرویس TTS از BytePlus Seed Speech |

## شروع کار

<Steps>
  <Step title="تنظیم کلید API">
    فرایند راه‌اندازی تعاملی را اجرا کنید:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    این فرمان هر دو ارائه‌دهنده عمومی (`volcengine`) و کدنویسی (`volcengine-plan`) را با استفاده از یک کلید API ثبت می‌کند.

  </Step>
  <Step title="تنظیم مدل پیش‌فرض">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="بررسی در دسترس بودن مدل">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
برای راه‌اندازی غیرتعاملی (CI، اسکریپت‌نویسی)، کلید را مستقیماً ارسال کنید:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## ارائه‌دهندگان و نقطه‌های پایانی

| ارائه‌دهنده       | نقطه پایانی                              | مورد استفاده    |
| ----------------- | ----------------------------------------- | --------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | مدل‌های عمومی   |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | مدل‌های کدنویسی |

<Note>
هر دو ارائه‌دهنده با یک کلید API پیکربندی می‌شوند. فرایند راه‌اندازی هر دو را به‌طور خودکار ثبت می‌کند و انتخاب‌گر مدل ارائه‌دهنده کدنویسی نیز از احراز هویت ارائه‌دهنده عمومی استفاده می‌کند (`volcengine-plan` نام مستعار احراز هویت `volcengine` است).
</Note>

## فهرست داخلی

<Tabs>
  <Tab title="عمومی (volcengine)">
    | ارجاع مدل                                    | نام                             | ورودی      | زمینه  |
    | -------------------------------------------- | ------------------------------- | ---------- | ------ |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | متن، تصویر | 128,000 |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | متن، تصویر | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | متن، تصویر | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | متن، تصویر | 200,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | متن، تصویر | 256,000 |
  </Tab>
  <Tab title="کدنویسی (volcengine-plan)">
    | ارجاع مدل                                         | نام                      | ورودی | زمینه  |
    | ------------------------------------------------- | ------------------------ | ----- | ------ |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | متن   | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | متن   | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | متن   | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | متن   | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | متن   | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | متن   | 256,000 |
  </Tab>
</Tabs>

هر دو فهرست ایستا هستند (هیچ فراخوانی برای کشف `/models` انجام نمی‌شود) و از محاسبه مصرف در حالت جریانی سازگار با OpenAI پشتیبانی می‌کنند. طرح‌واره‌های ابزار برای هر دو ارائه‌دهنده، کلیدواژه‌های `minLength`، `maxLength`، `minItems`، `maxItems`، `minContains` و `maxContains` را به‌طور خودکار حذف می‌کنند، زیرا API فراخوانی ابزار Volcengine آن‌ها را رد می‌کند.

## تبدیل متن به گفتار

TTS در Volcengine از API مبتنی بر HTTP سرویس BytePlus Seed Speech (`voice.ap-southeast-1.bytepluses.com`) استفاده می‌کند و جدا از کلید API مدل Doubao سازگار با OpenAI پیکربندی می‌شود. در کنسول BytePlus، مسیر Seed Speech > Settings > API Keys را باز کنید، کلید API را کپی کنید و سپس مقادیر زیر را تنظیم کنید:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

سپس آن را در `openclaw.json` فعال کنید:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "byteplus_seed_speech_api_key",
          voice: "en_female_anna_mars_bigtts",
          speedRatio: 1.0,
        },
      },
    },
  },
}
```

فیلدهای موجود در `messages.tts.providers.volcengine` عبارت‌اند از: `apiKey`، `voice`، `speedRatio` (0.2-3.0)، `emotion`، `cluster`، `resourceId`، `appKey` و `baseUrl`. وقتی بازنویسی تنظیمات صدا مجاز باشد، `!emotion=<value>` نیز به‌عنوان دستور درون‌خطی صدا کار می‌کند.

برای مقصدهای پیام صوتی، OpenClaw قالب بومی ارائه‌دهنده یعنی `ogg_opus` را درخواست می‌کند. برای پیوست‌های صوتی معمولی، قالب `mp3` را درخواست می‌کند. نام‌های مستعار ارائه‌دهنده، یعنی `bytedance` و `doubao`، نیز به همین ارائه‌دهنده گفتار ارجاع داده می‌شوند.

شناسه منبع پیش‌فرض `seed-tts-1.0` است؛ این همان مجوزی است که BytePlus به‌طور پیش‌فرض به کلیدهای API تازه‌ساخته‌شده Seed Speech می‌دهد. اگر پروژه شما مجوز TTS 2.0 دارد، مقدار `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0` را تنظیم کنید.

<Warning>
`VOLCANO_ENGINE_API_KEY` برای نقطه‌های پایانی مدل ModelArk/Doubao است و کلید API سرویس Seed Speech محسوب نمی‌شود. TTS به یک کلید API سرویس Seed Speech از BytePlus Speech Console یا یک جفت AppID/توکن قدیمی Speech Console نیاز دارد.
</Warning>

احراز هویت قدیمی با AppID/توکن همچنان برای برنامه‌های قدیمی‌تر Speech Console پشتیبانی می‌شود:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

سایر متغیرهای محیطی اختیاری TTS عبارت‌اند از `VOLCENGINE_TTS_VOICE`، `VOLCENGINE_TTS_APP_KEY` و `VOLCENGINE_TTS_BASE_URL` که در صورت تنظیم، فیلدهای پیکربندی متناظر در `messages.tts.providers.volcengine` را بازنویسی می‌کنند.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="مدل پیش‌فرض پس از راه‌اندازی اولیه">
    فرمان `openclaw onboard --auth-choice volcengine-api-key` مدل `volcengine-plan/ark-code-latest` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند و هم‌زمان فهرست عمومی `volcengine` را نیز ثبت می‌کند.
  </Accordion>

  <Accordion title="رفتار جایگزین انتخاب‌گر مدل">
    هنگام انتخاب مدل در فرایند راه‌اندازی اولیه یا پیکربندی، گزینه احراز هویت Volcengine ردیف‌های `volcengine/*` و `volcengine-plan/*` را ترجیح می‌دهد. اگر این مدل‌ها هنوز بارگذاری نشده باشند، OpenClaw به‌جای نمایش انتخاب‌گر خالی و محدودشده به ارائه‌دهنده، از فهرست بدون فیلتر استفاده می‌کند.
  </Accordion>

  <Accordion title="متغیرهای محیطی برای فرایندهای دیمن">
    اگر Gateway به‌صورت دیمن (launchd/systemd) اجرا می‌شود، مطمئن شوید متغیرهای محیطی مدل و TTS مانند `VOLCANO_ENGINE_API_KEY`، `VOLCENGINE_TTS_API_KEY`، `BYTEPLUS_SEED_SPEECH_API_KEY`، `VOLCENGINE_TTS_APPID` و `VOLCENGINE_TTS_TOKEN` برای آن فرایند در دسترس هستند (برای مثال، در `~/.openclaw/.env` یا از طریق `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
هنگام اجرای OpenClaw به‌عنوان سرویس پس‌زمینه، متغیرهای محیطی تنظیم‌شده در پوسته تعاملی شما به‌طور خودکار به ارث برده نمی‌شوند. یادداشت مربوط به دیمن در بالا را ببینید.
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار تغییر مسیر هنگام خرابی.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی عامل‌ها، مدل‌ها و ارائه‌دهندگان.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و مراحل اشکال‌زدایی.
  </Card>
  <Card title="پرسش‌های متداول" href="/fa/help/faq" icon="circle-question">
    پرسش‌های متداول درباره راه‌اندازی OpenClaw.
  </Card>
</CardGroup>
