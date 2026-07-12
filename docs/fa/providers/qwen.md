---
read_when:
    - می‌خواهید از Qwen با OpenClaw استفاده کنید
    - شما اشتراک Alibaba Cloud Token Plan دارید
    - قبلاً از OAuth کیوِن استفاده کرده‌اید
summary: از Qwen Cloud از طریق Plugin آن برای OpenClaw استفاده کنید
title: Qwen
x-i18n:
    generated_at: "2026-07-12T10:41:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud یک Plugin رسمی و خارجی برای ارائه‌دهنده OpenClaw با شناسهٔ استاندارد `qwen` است. این Plugin نقاط پایانی Standard و Coding Plan در Qwen Cloud / Alibaba DashScope را هدف قرار می‌دهد، Token Plan را با نام `qwen-token-plan` ارائه می‌کند، `modelstudio` را به‌عنوان نام مستعار سازگاری نگه می‌دارد، مستقلاً مالک شناسهٔ ارائه‌دهندهٔ سفارشی `bailian-token-plan` مستندشده توسط Alibaba است و جریان توکن Qwen Portal را با نام [`qwen-oauth`](/fa/providers/qwen-oauth) ارائه می‌کند.

| ویژگی                          | مقدار                                      |
| ----------------------------- | ------------------------------------------ |
| ارائه‌دهنده                    | `qwen`                                     |
| ارائه‌دهندهٔ Token Plan       | `qwen-token-plan`                          |
| ارائه‌دهندهٔ Portal           | [`qwen-oauth`](/fa/providers/qwen-oauth)      |
| متغیر محیطی ترجیحی            | `QWEN_API_KEY`                             |
| متغیر محیطی Token Plan        | `QWEN_TOKEN_PLAN_API_KEY`                  |
| موارد پذیرفته‌شدهٔ دیگر (سازگاری) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| سبک API                       | سازگار با OpenAI                           |

<Tip>
`qwen3.7-plus` و `qwen3.6-plus` با نقاط پایانی Coding Plan و Standard کار می‌کنند.
برای `qwen3.7-max` یا `qwen3.6-flash`، از یک نقطهٔ پایانی **Standard (پرداخت به‌ازای مصرف)** استفاده کنید.
</Tip>

## نصب Plugin

`qwen` به‌صورت یک Plugin رسمی و خارجی عرضه می‌شود و همراه هسته نیست. آن را نصب و Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## شروع به کار

نوع طرح خود را انتخاب و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="Coding Plan (اشتراکی)">
    **مناسب برای:** دسترسی مبتنی بر اشتراک از طریق Qwen Coding Plan.

    <Steps>
      <Step title="دریافت کلید API">
        یک کلید API در [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) ایجاد یا از آنجا کپی کنید.
      </Step>
      <Step title="اجرای راه‌اندازی اولیه">
        برای نقطهٔ پایانی **سراسری**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        برای نقطهٔ پایانی **چین**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="تنظیم مدل پیش‌فرض">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="بررسی دردسترس‌بودن مدل">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    شناسه‌های قدیمی انتخاب احراز هویت `modelstudio-*` و ارجاع‌های مدل `modelstudio/...`
    همچنان به‌عنوان نام‌های مستعار سازگاری کار می‌کنند، اما جریان‌های راه‌اندازی جدید باید
    شناسه‌های استاندارد انتخاب احراز هویت `qwen-*` و ارجاع‌های مدل `qwen/...` را ترجیح دهند.
    اگر یک ورودی سفارشی دقیق `models.providers.modelstudio` با مقدار دیگری برای `api`
    تعریف کنید، آن ارائه‌دهندهٔ سفارشی به‌جای نام مستعار سازگاری Qwen، مالک ارجاع‌های
    `modelstudio/...` خواهد بود.
    </Note>

  </Tab>

  <Tab title="Standard (پرداخت به‌ازای مصرف)">
    **مناسب برای:** دسترسی پرداخت به‌ازای مصرف از طریق نقطهٔ پایانی Standard در Model Studio، شامل `qwen3.7-max` و `qwen3.6-flash` که در Coding Plan در دسترس نیستند.

    <Steps>
      <Step title="دریافت کلید API">
        یک کلید API در [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) ایجاد یا از آنجا کپی کنید.
      </Step>
      <Step title="اجرای راه‌اندازی اولیه">
        برای نقطهٔ پایانی **سراسری**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        برای نقطهٔ پایانی **چین**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="تنظیم مدل پیش‌فرض">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="بررسی دردسترس‌بودن مدل">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    شناسه‌های قدیمی انتخاب احراز هویت `modelstudio-*` و ارجاع‌های مدل `modelstudio/...`
    همچنان به‌عنوان نام‌های مستعار سازگاری کار می‌کنند، اما جریان‌های راه‌اندازی جدید باید
    شناسه‌های استاندارد انتخاب احراز هویت `qwen-*` و ارجاع‌های مدل `qwen/...` را ترجیح دهند.
    اگر یک ورودی سفارشی دقیق `models.providers.modelstudio` با مقدار دیگری برای `api`
    تعریف کنید، آن ارائه‌دهندهٔ سفارشی به‌جای نام مستعار سازگاری Qwen، مالک ارجاع‌های
    `modelstudio/...` خواهد بود.
    </Note>

  </Tab>

  <Tab title="Token Plan (نسخهٔ تیمی)">
    **مناسب برای:** دسترسی اشتراکی تیمی مبتنی بر اعتبار به Qwen و مدل‌های شخص ثالث پشتیبانی‌شده از طریق Alibaba Cloud Model Studio.

    <Steps>
      <Step title="دریافت کلید اختصاصی">
        یک جایگاه Token Plan اختصاص دهید و کلید اختصاصی `sk-sp-...` آن را ایجاد کنید. کلیدهای Token Plan،‏ Coding Plan و پرداخت به‌ازای مصرف قابل جایگزینی با یکدیگر نیستند. به [نمای کلی Token Plan سراسری](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) یا [نمای کلی Token Plan چین](https://help.aliyun.com/zh/model-studio/token-plan-overview) مراجعه کنید.
      </Step>
      <Step title="اجرای راه‌اندازی اولیه">
        برای نقطهٔ پایانی **سراسری / بین‌المللی** در سنگاپور:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        برای نقطهٔ پایانی **چین** در پکن:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="بررسی ارائه‌دهنده">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Reply with: token plan ready"
        ```
      </Step>
    </Steps>

    <Note>
    راهنمای OpenClaw شرکت Alibaba برای یک ارائه‌دهندهٔ سفارشی دستی از
    `bailian-token-plan` استفاده می‌کند. Plugin این شناسه را به‌عنوان مالک سازگاری
    ثبت می‌کند، اما پیکربندی‌های جدید باید از `qwen-token-plan` استفاده کنند. یک
    ورودی سفارشی دقیق `models.providers.bailian-token-plan` مالکیت انتقال و کاتالوگ
    پیکربندی‌شدهٔ خود را حفظ می‌کند؛ این ورودی هرگز با کاتالوگ استاندارد OpenAI
    ادغام نمی‌شود.
    </Note>

    <Warning>
    از Token Plan فقط برای نشست‌های تعاملی OpenClaw استفاده کنید. آن را برای
    کارهای Cron، اسکریپت‌های بدون نظارت یا بخش‌های پشتی برنامه انتخاب نکنید.
    Alibaba اعلام کرده است که استفادهٔ غیرتعاملی می‌تواند باعث تعلیق اشتراک یا
    لغو کلید API آن شود.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **مناسب برای:** استفاده از توکن Qwen Portal در برابر `https://portal.qwen.ai/v1`.

    برای صفحهٔ اختصاصی ارائه‌دهنده و یادداشت‌های مهاجرت، به
    [Qwen OAuth / Portal](/fa/providers/qwen-oauth) مراجعه کنید.

    <Steps>
      <Step title="ارائهٔ توکن Portal">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="تنظیم مدل پیش‌فرض">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="بررسی دردسترس‌بودن مدل">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` از همان نام متغیر محیطی `QWEN_API_KEY` ارائه‌دهندهٔ Qwen Cloud
    استفاده می‌کند، اما وقتی از طریق راه‌اندازی اولیه OpenClaw پیکربندی شود،
    اطلاعات احراز هویت را زیر شناسهٔ ارائه‌دهندهٔ `qwen-oauth` ذخیره می‌کند.
    </Note>

  </Tab>
</Tabs>

## انواع طرح و نقاط پایانی

| طرح                         | منطقه  | انتخاب احراز هویت          | نقطهٔ پایانی                                                     |
| --------------------------- | ------ | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (اشتراکی)       | چین    | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (اشتراکی)       | سراسری | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                 | سراسری | `qwen-oauth`               | `portal.qwen.ai/v1`                                              |
| Standard (پرداخت به‌ازای مصرف) | چین | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (پرداخت به‌ازای مصرف) | سراسری | `qwen-standard-api-key`  | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (نسخهٔ تیمی)     | چین    | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (نسخهٔ تیمی)     | سراسری | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

ارائه‌دهنده بر اساس انتخاب احراز هویت شما، نقطهٔ پایانی را به‌طور خودکار انتخاب
می‌کند. انتخاب‌های استاندارد از خانوادهٔ `qwen-*` استفاده می‌کنند؛
`modelstudio-*` فقط برای سازگاری باقی مانده است. برای بازنویسی این رفتار، یک
`baseUrl` سفارشی در پیکربندی تعیین کنید.

<Tip>
**مدیریت کلیدها:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**مستندات:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## کاتالوگ داخلی

OpenClaw این کاتالوگ ایستای Qwen را ارائه می‌کند. کاتالوگ از نقطهٔ پایانی آگاه
است: پیکربندی‌های Coding Plan مدل‌هایی را که فقط در نقطهٔ پایانی Standard کار
می‌کنند، حذف می‌کنند.

| ارجاع مدل                    | ورودی       | زمینه     | یادداشت‌ها                    |
| --------------------------- | ----------- | --------- | ----------------------------- |
| `qwen/qwen3.5-plus`         | متن، تصویر  | 1,000,000 | مدل پیش‌فرض                   |
| `qwen/qwen3.6-flash`        | متن، تصویر  | 1,000,000 | فقط نقاط پایانی Standard      |
| `qwen/qwen3.6-plus`         | متن، تصویر  | 1,000,000 | Coding Plan و Standard        |
| `qwen/qwen3.7-max`          | متن         | 1,000,000 | فقط نقاط پایانی Standard      |
| `qwen/qwen3.7-plus`         | متن، تصویر  | 1,000,000 | Coding Plan و Standard        |
| `qwen/qwen3-max-2026-01-23` | متن         | 262,144   | خانوادهٔ Qwen Max             |
| `qwen/qwen3-coder-next`     | متن         | 262,144   | کدنویسی                       |
| `qwen/qwen3-coder-plus`     | متن         | 1,000,000 | کدنویسی                       |
| `qwen/MiniMax-M2.5`         | متن         | 1,000,000 | استدلال فعال                  |
| `qwen/glm-5`                | متن         | 202,752   | GLM                           |
| `qwen/glm-4.7`              | متن         | 202,752   | GLM                           |
| `qwen/kimi-k2.5`            | متن، تصویر  | 262,144   | Moonshot AI از طریق Alibaba   |
| `qwen-oauth/qwen3.5-plus`   | متن، تصویر  | 1,000,000 | پیش‌فرض Qwen Portal           |

<Note>
حتی وقتی مدلی در کاتالوگ ایستا وجود دارد، دردسترس‌بودن آن ممکن است بسته به نقطهٔ
پایانی و طرح صورت‌حساب متفاوت باشد.
</Note>

### کاتالوگ Token Plan

Token Plan از یک فهرست مجاز جداگانه با تطبیق دقیق رشته استفاده می‌کند. مدل‌های
طرح که فقط برای تولید تصویر هستند، در اینجا گنجانده نشده‌اند، زیرا از APIهای
متفاوتی استفاده می‌کنند.

| ارجاع مدل                            | ورودی       | زمینه     |
| ----------------------------------- | ----------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | متن         | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | متن، تصویر  | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | متن، تصویر  | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | متن، تصویر  | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | متن         | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | متن         | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | متن         | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | متن، تصویر  | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | متن، تصویر  | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | متن، تصویر  | 262,144   |
| `qwen-token-plan/glm-5.2`           | متن         | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | متن         | 202,752   |
| `qwen-token-plan/glm-5`             | متن         | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | متن         | 196,608   |

## کنترل‌های تفکر

`qwen3.7-max`، `qwen3.7-plus`، `qwen3.6-flash` و `qwen3.6-plus` در فهرست داخلی از قابلیت استدلال برخوردارند. برای مدل‌های استدلالی خانوادهٔ `qwen`، ارائه‌دهنده سطوح تفکر OpenClaw را به پرچم سطح‌بالای `enable_thinking` در درخواست DashScope نگاشت می‌کند: در حالت تفکر غیرفعال، `enable_thinking: false` ارسال می‌شود و در هر سطح دیگری، `enable_thinking: true` ارسال می‌شود. مدل‌های سفارشی می‌توانند با تنظیم `compat.thinkingFormat: "qwen-chat-template"` در ورودی مدل، محمولهٔ جایگزین تفکر مبتنی بر قالب چت را فعال کنند.

مدل‌های Token Plan نیز دارای قابلیت استدلال علامت‌گذاری شده‌اند. `kimi-k2.7-code` و `MiniMax-M2.5` فقط در حالت تفکر کار می‌کنند؛ بنابراین OpenClaw حتی زمانی که نشست `/think off` را درخواست می‌کند، تفکر را فعال نگه می‌دارد. DeepSeek V4 سطوح `minimal` تا `high` را به میزان تلاش `high` سرویس و `xhigh` یا `max` را به `max` نگاشت می‌کند. GLM 5.2 دامنهٔ کامل `minimal` تا `max` را می‌پذیرد؛ GLM 5.1 و GLM 5 تا `xhigh` را می‌پذیرند و مقدار پیش‌فرض هر سه `high` است. سایر مدل‌های ترکیبی از وضعیت روشن/خاموش درخواستی پیروی می‌کنند.

## افزونه‌های چندوجهی

Plugin مربوط به `qwen` قابلیت‌های چندوجهی را فقط در نقطه‌های پایانی **استاندارد** DashScope ارائه می‌کند، نه در نقطه‌های پایانی Coding Plan:

- **درک تصویر و ویدئو** از طریق `qwen-vl-max-latest`
- **تولید ویدئوی Wan** از طریق `wan2.6-t2v` (پیش‌فرض)، `wan2.6-i2v`، `wan2.6-r2v`، `wan2.6-r2v-flash`، `wan2.7-r2v`

احراز هویت درک رسانه به‌طور خودکار از احراز هویت پیکربندی‌شدهٔ Qwen استخراج می‌شود و به پیکربندی اضافی نیازی نیست. برای کارکرد درک رسانه، مطمئن شوید که از یک نقطهٔ پایانی استاندارد (پرداخت به‌ازای مصرف) استفاده می‌کنید.

برای تعیین Qwen به‌عنوان ارائه‌دهندهٔ پیش‌فرض ویدئو:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

محدودیت‌های تولید ویدئو: در هر درخواست ۱ ویدئوی خروجی، حداکثر ۱ تصویر ورودی (تبدیل تصویر به ویدئو)، حداکثر ۴ ویدئوی ورودی (تبدیل ویدئو به ویدئو) و حداکثر مدت ۱۰ ثانیه. از `size`، `aspectRatio`، `resolution`، `audio` و `watermark` پشتیبانی می‌شود. ورودی‌های تصویر/ویدئوی مرجع باید URLهای راه‌دور http(s) باشند؛ مسیرهای فایل محلی از ابتدا رد می‌شوند، زیرا نقطهٔ پایانی ویدئوی DashScope بافرهای محلی بارگذاری‌شده را برای این مراجع نمی‌پذیرد.

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار جایگزینی هنگام خرابی، به [تولید ویدئو](/fa/tools/video-generation) مراجعه کنید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="دسترس‌پذیری Qwen 3.6 و 3.7">
    `qwen3.7-plus` و `qwen3.6-plus` در نقطه‌های پایانی Coding Plan و استاندارد در دسترس‌اند. `qwen3.7-max` و `qwen3.6-flash` فقط در نقطه‌های پایانی استاندارد در دسترس‌اند. نقطه‌های پایانی استاندارد (پرداخت به‌ازای مصرف) عبارت‌اند از:

    - چین: `dashscope.aliyuncs.com/compatible-mode/v1`
    - جهانی: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw مدل‌های `qwen3.7-max` و `qwen3.6-flash` را در فهرست‌های Coding Plan قرار نمی‌دهد.
    اگر یک نقطهٔ پایانی Coding Plan برای هرکدام خطای «مدل پشتیبانی‌نشده» برگرداند، از نقطهٔ پایانی استاندارد و کلید متناظر استفاده کنید.

  </Accordion>

  <Accordion title="مسیریابی منطقه‌ای تولید ویدئو">
    OpenClaw پیش از ارسال یک کار تولید ویدئو، منطقهٔ پیکربندی‌شدهٔ Qwen را به میزبان متناظر AIGC در DashScope نگاشت می‌کند:

    - جهانی/بین‌المللی: `https://dashscope-intl.aliyuncs.com`
    - چین: `https://dashscope.aliyuncs.com`

    یک `models.providers.qwen.baseUrl` معمولی که به میزبان‌های Coding Plan یا استاندارد Qwen اشاره می‌کند، همچنان تولید ویدئو را به نقطهٔ پایانی منطقه‌ای متناظر ویدئوی DashScope هدایت می‌کند.

  </Accordion>

  <Accordion title="سازگاری مصرف در پخش جریانی">
    نقطه‌های پایانی بومی Qwen سازگاری مصرف در پخش جریانی را روی انتقال مشترک `openai-completions` اعلام می‌کنند؛ بنابراین شناسه‌های سفارشی ارائه‌دهندهٔ سازگار با DashScope که همان میزبان‌های بومی را هدف می‌گیرند، بدون نیاز اختصاصی به شناسهٔ ارائه‌دهندهٔ داخلی `qwen`، همان رفتار را به ارث می‌برند. این موضوع برای نقطه‌های پایانی Coding Plan، استاندارد و Token Plan صدق می‌کند:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="برنامهٔ قابلیت‌ها">
    Plugin مربوط به `qwen` در حال تبدیل‌شدن به جایگاه اصلی فروشنده برای کل مجموعهٔ قابلیت‌های Qwen Cloud است، نه فقط مدل‌های کدنویسی/متن.

    - **مدل‌های متن/چت:** از طریق Plugin در دسترس‌اند
    - **فراخوانی ابزار، خروجی ساخت‌یافته، تفکر:** از انتقال سازگار با OpenAI به ارث می‌رسند
    - **تولید تصویر:** برای لایهٔ Plugin ارائه‌دهنده برنامه‌ریزی شده است
    - **درک تصویر/ویدئو:** از طریق Plugin در نقطهٔ پایانی استاندارد در دسترس است
    - **گفتار/صدا:** برای لایهٔ Plugin ارائه‌دهنده برنامه‌ریزی شده است
    - **تعبیه‌سازی/بازرتبه‌بندی حافظه:** برای سطح آداپتور تعبیه‌سازی برنامه‌ریزی شده است
    - **تولید ویدئو:** از طریق Plugin و قابلیت مشترک تولید ویدئو در دسترس است

  </Accordion>

  <Accordion title="راه‌اندازی محیط و دیمن">
    اگر Gateway به‌صورت دیمن (launchd/systemd) اجرا می‌شود، مطمئن شوید `QWEN_API_KEY` یا `QWEN_TOKEN_PLAN_API_KEY` برای آن فرایند در دسترس است (برای مثال، در `~/.openclaw/.env` یا از طریق `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Alibaba Model Studio" href="/fa/providers/alibaba" icon="cloud">
    ارائه‌دهندهٔ همراه تولید ویدئوی Wan روی همان پلتفرم DashScope.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
