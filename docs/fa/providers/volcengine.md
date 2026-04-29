---
read_when:
    - می‌خواهید از مدل‌های Volcano Engine یا Doubao با OpenClaw استفاده کنید
    - به راه‌اندازی کلید API Volcengine نیاز دارید
    - می‌خواهید از تبدیل متن به گفتار Volcengine Speech استفاده کنید
summary: راه‌اندازی Volcano Engine (مدل‌های Doubao، نقاط پایانی کدنویسی، و Seed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-29T23:30:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7948a26cc898e125d445e9ae091704f5cf442266d29e712c0dcedbe0dc0cce7
    source_path: providers/volcengine.md
    workflow: 16
---

ارائه‌دهنده Volcengine دسترسی به مدل‌های Doubao و مدل‌های شخص ثالث
میزبانی‌شده روی Volcano Engine را، با نقاط پایانی جداگانه برای بارهای کاری عمومی و کدنویسی،
فراهم می‌کند. همین Plugin همراه می‌تواند Volcengine Speech را نیز به‌عنوان یک ارائه‌دهنده TTS
ثبت کند.

| جزئیات     | مقدار                                                      |
| ---------- | ---------------------------------------------------------- |
| ارائه‌دهندگان  | `volcengine` (عمومی + TTS) + `volcengine-plan` (کدنویسی)  |
| احراز هویت مدل | `VOLCANO_ENGINE_API_KEY`                                   |
| احراز هویت TTS   | `VOLCENGINE_TTS_API_KEY` یا `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API        | مدل‌های سازگار با OpenAI، BytePlus Seed Speech TTS         |

## شروع به کار

<Steps>
  <Step title="تنظیم کلید API">
    راه‌اندازی تعاملی را اجرا کنید:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    این کار هر دو ارائه‌دهنده عمومی (`volcengine`) و کدنویسی (`volcengine-plan`) را از یک کلید API واحد ثبت می‌کند.

  </Step>
  <Step title="تنظیم یک مدل پیش‌فرض">
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
برای راه‌اندازی غیرتعاملی (CI، اسکریپت‌نویسی)، کلید را مستقیما پاس بدهید:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## ارائه‌دهندگان و نقاط پایانی

| ارائه‌دهنده          | نقطه پایانی                                  | مورد استفاده       |
| ----------------- | ----------------------------------------- | -------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | مدل‌های عمومی |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | مدل‌های کدنویسی  |

<Note>
هر دو ارائه‌دهنده از یک کلید API واحد پیکربندی می‌شوند. راه‌اندازی هر دو را به‌صورت خودکار ثبت می‌کند.
</Note>

## کاتالوگ داخلی

<Tabs>
  <Tab title="عمومی (volcengine)">
    | ارجاع مدل                                    | نام                            | ورودی       | زمینه |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | متن، تصویر | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | متن، تصویر | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | متن، تصویر | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | متن، تصویر | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | متن، تصویر | 128,000 |
  </Tab>
  <Tab title="کدنویسی (volcengine-plan)">
    | ارجاع مدل                                         | نام                     | ورودی | زمینه |
    | ------------------------------------------------- | ------------------------ | ----- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | متن  | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | متن  | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | متن  | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | متن  | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | متن  | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | متن  | 256,000 |
  </Tab>
</Tabs>

## تبدیل متن به گفتار

Volcengine TTS از BytePlus Seed Speech HTTP API استفاده می‌کند و جدا از کلید API مدل Doubao سازگار با OpenAI
پیکربندی می‌شود. در کنسول BytePlus،
Seed Speech > Settings > API Keys را باز کنید و کلید API را کپی کنید، سپس تنظیم کنید:

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

برای مقصدهای یادداشت صوتی، OpenClaw از Volcengine فرمت بومی ارائه‌دهنده
`ogg_opus` را درخواست می‌کند. برای پیوست‌های صوتی عادی، `mp3` را درخواست می‌کند. نام‌های مستعار ارائه‌دهنده
`bytedance` و `doubao` نیز به همان ارائه‌دهنده گفتار ارجاع می‌شوند.

شناسه منبع پیش‌فرض `seed-tts-1.0` است، چون BytePlus همین مورد را
به کلیدهای API تازه‌ساخته Seed Speech در پروژه پیش‌فرض اعطا می‌کند. اگر پروژه شما
مجوز TTS 2.0 دارد، `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0` را تنظیم کنید.

<Warning>
`VOLCANO_ENGINE_API_KEY` برای نقاط پایانی مدل ModelArk/Doubao است و کلید API
Seed Speech نیست. TTS به یک کلید API Seed Speech از BytePlus Speech
Console یا یک جفت AppID/token قدیمی Speech Console نیاز دارد.
</Warning>

احراز هویت AppID/token قدیمی همچنان برای برنامه‌های قدیمی‌تر Speech Console پشتیبانی می‌شود:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="مدل پیش‌فرض پس از راه‌اندازی">
    `openclaw onboard --auth-choice volcengine-api-key` در حال حاضر
    `volcengine-plan/ark-code-latest` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند و هم‌زمان
    کاتالوگ عمومی `volcengine` را نیز ثبت می‌کند.
  </Accordion>

  <Accordion title="رفتار جایگزین انتخابگر مدل">
    هنگام انتخاب مدل در راه‌اندازی/پیکربندی، گزینه احراز هویت Volcengine ردیف‌های
    `volcengine/*` و `volcengine-plan/*` را ترجیح می‌دهد. اگر آن مدل‌ها هنوز
    بارگذاری نشده باشند، OpenClaw به‌جای نمایش یک انتخابگر خالی محدودشده به ارائه‌دهنده،
    به کاتالوگ فیلترنشده برمی‌گردد.
  </Accordion>

  <Accordion title="متغیرهای محیطی برای فرایندهای daemon">
    اگر Gateway به‌صورت daemon اجرا می‌شود (launchd/systemd)، مطمئن شوید متغیرهای محیطی
    مدل و TTS مانند `VOLCANO_ENGINE_API_KEY`، `VOLCENGINE_TTS_API_KEY`،
    `BYTEPLUS_SEED_SPEECH_API_KEY`، `VOLCENGINE_TTS_APPID` و
    `VOLCENGINE_TTS_TOKEN` برای آن فرایند در دسترس هستند (برای مثال، در
    `~/.openclaw/.env` یا از طریق `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
وقتی OpenClaw را به‌عنوان یک سرویس پس‌زمینه اجرا می‌کنید، متغیرهای محیطی تنظیم‌شده در
پوسته تعاملی شما به‌صورت خودکار به ارث برده نمی‌شوند. یادداشت daemon بالا را ببینید.
</Warning>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی برای عامل‌ها، مدل‌ها و ارائه‌دهندگان.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و مراحل اشکال‌زدایی.
  </Card>
  <Card title="پرسش‌های متداول" href="/fa/help/faq" icon="circle-question">
    پرسش‌های متداول درباره راه‌اندازی OpenClaw.
  </Card>
</CardGroup>
