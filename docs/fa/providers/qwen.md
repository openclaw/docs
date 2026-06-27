---
read_when:
    - می‌خواهید از Qwen با OpenClaw استفاده کنید
    - شما قبلاً از Qwen OAuth استفاده کرده‌اید
summary: از Qwen Cloud از طریق Plugin آن در OpenClaw استفاده کنید
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:43:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw اکنون Qwen را به‌عنوان یک Plugin ارائه‌دهنده درجه‌اول با شناسه کانونی
`qwen` در نظر می‌گیرد. Plugin ارائه‌دهنده، نقاط پایانی Qwen Cloud / Alibaba DashScope و
Coding Plan را هدف می‌گیرد، شناسه‌های قدیمی `modelstudio` را به‌عنوان نام مستعار سازگاری
فعال نگه می‌دارد و همچنین جریان توکن پورتال Qwen را به‌عنوان ارائه‌دهنده `qwen-oauth` در دسترس می‌گذارد.

- ارائه‌دهنده: `qwen`
- ارائه‌دهنده پورتال: [`qwen-oauth`](/fa/providers/qwen-oauth)
- متغیر محیطی ترجیحی: `QWEN_API_KEY`
- برای سازگاری نیز پذیرفته می‌شود: `MODELSTUDIO_API_KEY`، `DASHSCOPE_API_KEY`
- سبک API: سازگار با OpenAI

<Tip>
اگر `qwen3.6-plus` را می‌خواهید، نقطه پایانی **استاندارد (پرداخت به‌ازای مصرف)** را ترجیح دهید.
پشتیبانی Coding Plan ممکن است از کاتالوگ عمومی عقب‌تر باشد.
</Tip>

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را بازراه‌اندازی کنید:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## شروع به کار

نوع طرح خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="Coding Plan (اشتراکی)">
    **بهترین برای:** دسترسی مبتنی بر اشتراک از طریق Qwen Coding Plan.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        یک کلید API از [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) بسازید یا کپی کنید.
      </Step>
      <Step title="آنبوردینگ را اجرا کنید">
        برای نقطه پایانی **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        برای نقطه پایانی **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="یک مدل پیش‌فرض تنظیم کنید">
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
      <Step title="بررسی کنید مدل در دسترس است">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    شناسه‌های auth-choice قدیمی `modelstudio-*` و ارجاع‌های مدل `modelstudio/...` همچنان
    به‌عنوان نام‌های مستعار سازگاری کار می‌کنند، اما جریان‌های راه‌اندازی جدید باید شناسه‌های auth-choice کانونی
    `qwen-*` و ارجاع‌های مدل `qwen/...` را ترجیح دهند. اگر یک ورودی سفارشی دقیق
    `models.providers.modelstudio` با مقدار `api` دیگری تعریف کنید، آن
    ارائه‌دهنده سفارشی به‌جای نام مستعار سازگاری Qwen مالک ارجاع‌های `modelstudio/...` خواهد بود.
    </Note>

  </Tab>

  <Tab title="استاندارد (پرداخت به‌ازای مصرف)">
    **بهترین برای:** دسترسی پرداخت به‌ازای مصرف از طریق نقطه پایانی استاندارد Model Studio، از جمله مدل‌هایی مانند `qwen3.6-plus` که ممکن است در Coding Plan در دسترس نباشند.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        یک کلید API از [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) بسازید یا کپی کنید.
      </Step>
      <Step title="آنبوردینگ را اجرا کنید">
        برای نقطه پایانی **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        برای نقطه پایانی **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="یک مدل پیش‌فرض تنظیم کنید">
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
      <Step title="بررسی کنید مدل در دسترس است">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    شناسه‌های auth-choice قدیمی `modelstudio-*` و ارجاع‌های مدل `modelstudio/...` همچنان
    به‌عنوان نام‌های مستعار سازگاری کار می‌کنند، اما جریان‌های راه‌اندازی جدید باید شناسه‌های auth-choice کانونی
    `qwen-*` و ارجاع‌های مدل `qwen/...` را ترجیح دهند. اگر یک ورودی سفارشی دقیق
    `models.providers.modelstudio` با مقدار `api` دیگری تعریف کنید، آن
    ارائه‌دهنده سفارشی به‌جای نام مستعار سازگاری Qwen مالک ارجاع‌های `modelstudio/...` خواهد بود.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / پورتال">
    **بهترین برای:** توکن پورتال Qwen در برابر `https://portal.qwen.ai/v1`.

    برای صفحه اختصاصی ارائه‌دهنده و یادداشت‌های مهاجرت، [Qwen OAuth / پورتال](/fa/providers/qwen-oauth) را ببینید.

    <Steps>
      <Step title="توکن پورتال خود را ارائه کنید">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="یک مدل پیش‌فرض تنظیم کنید">
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
      <Step title="بررسی کنید مدل در دسترس است">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` از همان نام متغیر محیطی `QWEN_API_KEY` استفاده می‌کند که ارائه‌دهنده DashScope
    استفاده می‌کند، اما وقتی از طریق آنبوردینگ OpenClaw پیکربندی شود، احراز هویت را زیر شناسه ارائه‌دهنده
    `qwen-oauth` ذخیره می‌کند.
    </Note>

  </Tab>
</Tabs>

## انواع طرح و نقاط پایانی

| طرح                       | منطقه | انتخاب احراز هویت                | نقطه پایانی                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| استاندارد (پرداخت به‌ازای مصرف)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| استاندارد (پرداخت به‌ازای مصرف)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (اشتراکی) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (اشتراکی) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| پورتال Qwen                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

ارائه‌دهنده بر اساس انتخاب احراز هویت شما نقطه پایانی را به‌صورت خودکار انتخاب می‌کند. انتخاب‌های کانونی
از خانواده `qwen-*` استفاده می‌کنند؛ `modelstudio-*` فقط برای سازگاری باقی مانده است.
می‌توانید با یک `baseUrl` سفارشی در پیکربندی آن را بازنویسی کنید.

<Tip>
**مدیریت کلیدها:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**مستندات:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## کاتالوگ داخلی

OpenClaw در حال حاضر این کاتالوگ ایستای Qwen را ارائه می‌کند. کاتالوگ پیکربندی‌شده
از نقطه پایانی آگاه است: پیکربندی‌های Coding Plan مدل‌هایی را که فقط برای کار روی
نقطه پایانی استاندارد شناخته شده‌اند حذف می‌کنند.

| ارجاع مدل                   | ورودی       | زمینه   | یادداشت‌ها                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | متن، تصویر | 1,000,000 | مدل پیش‌فرض                                      |
| `qwen/qwen3.6-plus`         | متن، تصویر | 1,000,000 | وقتی به این مدل نیاز دارید، نقاط پایانی استاندارد را ترجیح دهید |
| `qwen/qwen3-max-2026-01-23` | متن        | 262,144   | خط Qwen Max                                      |
| `qwen/qwen3-coder-next`     | متن        | 262,144   | کدنویسی                                             |
| `qwen/qwen3-coder-plus`     | متن        | 1,000,000 | کدنویسی                                             |
| `qwen/MiniMax-M2.5`         | متن        | 1,000,000 | استدلال فعال است                                  |
| `qwen/glm-5`                | متن        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | متن        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | متن، تصویر | 262,144   | Moonshot AI از طریق Alibaba                            |
| `qwen-oauth/qwen3.5-plus`   | متن، تصویر | 1,000,000 | پیش‌فرض پورتال Qwen                                |

<Note>
حتی وقتی یک مدل در کاتالوگ ایستا وجود دارد، دسترس‌پذیری همچنان می‌تواند بر اساس نقطه پایانی و طرح صورتحساب متفاوت باشد.
</Note>

## کنترل‌های تفکر

برای مدل‌های Qwen Cloud با قابلیت استدلال، ارائه‌دهنده سطوح تفکر OpenClaw را
به پرچم درخواست سطح‌بالای `enable_thinking` در DashScope نگاشت می‌کند. تفکر غیرفعال
`enable_thinking: false` ارسال می‌کند؛ سطوح دیگر تفکر
`enable_thinking: true` ارسال می‌کنند.

## افزونه‌های چندوجهی

Plugin `qwen` همچنین قابلیت‌های چندوجهی را روی نقاط پایانی **استاندارد**
DashScope در دسترس می‌گذارد (نه نقاط پایانی Coding Plan):

- **درک ویدیو** از طریق `qwen-vl-max-latest`
- **تولید ویدیوی Wan** از طریق `wan2.6-t2v` (پیش‌فرض)، `wan2.6-i2v`، `wan2.6-r2v`، `wan2.6-r2v-flash`، `wan2.7-r2v`

برای استفاده از Qwen به‌عنوان ارائه‌دهنده ویدیوی پیش‌فرض:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار failover، [تولید ویدیو](/fa/tools/video-generation) را ببینید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="درک تصویر و ویدیو">
    Plugin Qwen درک رسانه را برای تصویرها و ویدیو
    روی نقاط پایانی **استاندارد** DashScope ثبت می‌کند (نه نقاط پایانی Coding Plan).

    | ویژگی      | مقدار                 |
    | ------------- | --------------------- |
    | مدل         | `qwen-vl-max-latest`  |
    | ورودی پشتیبانی‌شده | تصویرها، ویدیو       |

    درک رسانه از احراز هویت پیکربندی‌شده Qwen به‌صورت خودکار حل می‌شود؛ هیچ
    پیکربندی اضافی لازم نیست. مطمئن شوید برای پشتیبانی از درک رسانه از یک نقطه پایانی استاندارد (پرداخت به‌ازای مصرف)
    استفاده می‌کنید.

  </Accordion>

  <Accordion title="دسترس‌پذیری Qwen 3.6 Plus">
    `qwen3.6-plus` روی نقاط پایانی استاندارد (پرداخت به‌ازای مصرف) Model Studio
    در دسترس است:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    اگر نقاط پایانی Coding Plan برای `qwen3.6-plus` خطای «مدل پشتیبانی‌نشده» برگردانند،
    به‌جای جفت نقطه پایانی/کلید Coding Plan، به استاندارد (پرداخت به‌ازای مصرف) تغییر دهید.

    کاتالوگ ایستای Qwen در OpenClaw، `qwen3.6-plus` را روی نقاط پایانی Coding
    Plan تبلیغ نمی‌کند، اما ورودی‌های `qwen/qwen3.6-plus` که به‌صراحت زیر
    `models.providers.qwen.models` پیکربندی شده باشند روی baseUrlهای Coding Plan رعایت می‌شوند تا
    اگر Aliyun آن مدل را برای اشتراک شما فعال کرد، بتوانید آن را انتخاب کنید. API
    بالادستی همچنان تصمیم می‌گیرد که فراخوانی موفق شود یا نه.

  </Accordion>

  <Accordion title="طرح قابلیت‌ها">
    Plugin `qwen` در حال جای‌گیری به‌عنوان خانه فروشنده برای کل سطح Qwen
    Cloud است، نه فقط مدل‌های کدنویسی/متنی.

    - **مدل‌های متن/چت:** از طریق Plugin در دسترس است
    - **فراخوانی ابزار، خروجی ساختاریافته، تفکر:** از انتقال سازگار با OpenAI به ارث می‌رسد
    - **تولید تصویر:** در لایه Plugin ارائه‌دهنده برنامه‌ریزی شده است
    - **درک تصویر/ویدیو:** از طریق Plugin روی نقطه پایانی استاندارد در دسترس است
    - **گفتار/صدا:** در لایه Plugin ارائه‌دهنده برنامه‌ریزی شده است
    - **امبدینگ/بازرتبه‌بندی حافظه:** از طریق سطح آداپتر امبدینگ برنامه‌ریزی شده است
    - **تولید ویدیو:** از طریق Plugin و قابلیت مشترک تولید ویدیو در دسترس است

  </Accordion>

  <Accordion title="جزئیات تولید ویدیو">
    برای تولید ویدیو، OpenClaw پیش از ارسال کار، منطقه پیکربندی‌شده Qwen را به میزبان
    متناظر DashScope AIGC نگاشت می‌کند:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    این یعنی یک `models.providers.qwen.baseUrl` عادی که به میزبان‌های
    Coding Plan یا استاندارد Qwen اشاره کند، همچنان تولید ویدیو را روی نقطه پایانی ویدیوی منطقه‌ای درست
    DashScope نگه می‌دارد.

    محدودیت‌های فعلی تولید ویدیوی Qwen:

    - تا **1** ویدیوی خروجی در هر درخواست
    - تا **1** تصویر ورودی
    - تا **4** ویدیوی ورودی
    - تا **10 ثانیه** مدت
    - از `size`، `aspectRatio`، `resolution`، `audio` و `watermark` پشتیبانی می‌کند
    - حالت تصویر/ویدیوی مرجع در حال حاضر به **URLهای http(s) راه‌دور** نیاز دارد. مسیرهای
      فایل محلی از ابتدا رد می‌شوند، زیرا نقطه پایانی ویدیوی DashScope بافرهای محلی بارگذاری‌شده را برای آن مراجع
      نمی‌پذیرد.

  </Accordion>

  <Accordion title="سازگاری مصرف در جریان‌سازی">
    endpointهای بومی Model Studio سازگاری مصرف در جریان‌سازی را روی
    ترابری مشترک `openai-completions` اعلام می‌کنند. OpenClaw اکنون این را بر اساس
    قابلیت‌های endpoint تنظیم می‌کند، بنابراین شناسه‌های ارائه‌دهنده سفارشی سازگار با DashScope که
    همان میزبان‌های بومی را هدف می‌گیرند، به‌جای نیاز مشخص به شناسه ارائه‌دهنده داخلی `qwen`،
    همان رفتار مصرف در جریان‌سازی را به ارث می‌برند.

    سازگاری مصرف در جریان‌سازی بومی هم برای میزبان‌های Coding Plan و هم
    میزبان‌های استاندارد سازگار با DashScope اعمال می‌شود:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="ناحیه‌های endpoint چندوجهی">
    سطح‌های چندوجهی (درک ویدئو و تولید ویدئوی Wan) از endpointهای
    DashScope **استاندارد** استفاده می‌کنند، نه endpointهای Coding Plan:

    - نشانی پایه استاندارد جهانی/بین‌المللی: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - نشانی پایه استاندارد چین: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="راه‌اندازی محیط و daemon">
    اگر Gateway به‌صورت daemon اجرا می‌شود (launchd/systemd)، مطمئن شوید `QWEN_API_KEY`
    برای آن فرایند در دسترس است (برای مثال، در `~/.openclaw/.env` یا از طریق
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدئوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/fa/providers/alibaba" icon="cloud">
    ارائه‌دهنده قدیمی ModelStudio و یادداشت‌های مهاجرت.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
