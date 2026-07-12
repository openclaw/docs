---
read_when:
    - می‌خواهید از Tencent hy3 با OpenClaw استفاده کنید
    - باید کلید API مربوط به TokenHub یا TokenPlan را تنظیم کنید
summary: راه‌اندازی Tencent Cloud TokenHub و TokenPlan برای hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T10:41:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Plugin رسمی ارائه‌دهنده Tencent Cloud را نصب کنید تا با استفاده از یک API سازگار با OpenAI، از طریق دو نقطه پایانی TokenHub (`tencent-tokenhub`) و TokenPlan (`tencent-tokenplan`) به Tencent Hy3 دسترسی پیدا کنید.

| ویژگی                          | مقدار                                                 |
| ------------------------------ | ----------------------------------------------------- |
| شناسه‌های ارائه‌دهنده          | `tencent-tokenhub`، `tencent-tokenplan`               |
| بسته                           | `@openclaw/tencent-provider`                          |
| متغیر محیطی احراز هویت TokenHub  | `TOKENHUB_API_KEY`                                    |
| متغیر محیطی احراز هویت TokenPlan | `TOKENPLAN_API_KEY`                                   |
| پرچم راه‌اندازی اولیه TokenHub   | `--auth-choice tokenhub-api-key`                      |
| پرچم راه‌اندازی اولیه TokenPlan  | `--auth-choice tokenplan-api-key`                     |
| پرچم مستقیم CLI برای TokenHub    | `--tokenhub-api-key <key>`                            |
| پرچم مستقیم CLI برای TokenPlan   | `--tokenplan-api-key <key>`                           |
| API                            | سازگار با OpenAI (`openai-completions`)               |
| نشانی پایه TokenHub            | `https://tokenhub.tencentmaas.com/v1`                 |
| نشانی پایه جهانی TokenHub      | `https://tokenhub-intl.tencentmaas.com/v1` (بازنویسی) |
| نشانی پایه TokenPlan           | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| مدل پیش‌فرض                    | `tencent-tokenhub/hy3`                                |

## شروع سریع

<Steps>
  <Step title="ایجاد کلید API برای Tencent">
    برای Tencent Cloud TokenHub و TokenPlan یک کلید API ایجاد کنید. اگر برای کلید، دامنه دسترسی محدودی انتخاب می‌کنید، **hy3** (و اگر قصد دارید از آن در TokenHub استفاده کنید، **hy3 preview**) را در مدل‌های مجاز قرار دهید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    <CodeGroup>

```bash راه‌اندازی اولیه TokenHub
openclaw onboard --auth-choice tokenhub-api-key
```

```bash پرچم مستقیم TokenHub
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash راه‌اندازی اولیه TokenPlan
openclaw onboard --auth-choice tokenplan-api-key
```

```bash پرچم مستقیم TokenPlan
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash فقط متغیرهای محیطی
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="بررسی مدل">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## راه‌اندازی غیرتعاملی

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
استفاده از `--accept-risk` همراه با `--non-interactive` الزامی است.
</Note>

## فهرست داخلی

| مرجع مدل                       | نام                    | ورودی | زمینه  | حداکثر خروجی | نکات              |
| ------------------------------ | ---------------------- | ----- | ------- | ------------ | ------------------ |
| `tencent-tokenhub/hy3-preview` | پیش‌نمایش hy3 (TokenHub) | متن   | 256,000 | 64,000       | دارای قابلیت استدلال |
| `tencent-tokenhub/hy3`         | hy3 (TokenHub)         | متن   | 256,000 | 64,000       | دارای قابلیت استدلال |
| `tencent-tokenplan/hy3`        | hy3 (TokenPlan)        | متن   | 256,000 | 64,000       | دارای قابلیت استدلال |

hy3 مدل زبانی بزرگ MoE متعلق به Tencent Hunyuan برای استدلال، پیروی از دستورالعمل‌ها در زمینه‌های طولانی، کدنویسی و گردش‌های کاری عامل‌ها است. نمونه‌های سازگار با OpenAI متعلق به Tencent از `hy3` به‌عنوان شناسه مدل استفاده می‌کنند و از فراخوانی استاندارد ابزار در تکمیل‌های گفت‌وگو، به‌همراه `reasoning_effort` پشتیبانی می‌کنند.

<Tip>
  شناسه مدل `hy3` است. آن را با مدل‌های `HY-3D-*` متعلق به Tencent اشتباه نگیرید؛ آن‌ها APIهای تولید سه‌بعدی هستند و مدل گفت‌وگوی OpenClaw که این ارائه‌دهنده پیکربندی می‌کند، نیستند.
</Tip>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="بازنویسی نقطه پایانی">
    فهرست داخلی OpenClaw از نقطه پایانی `https://tokenhub.tencentmaas.com/v1` متعلق به Tencent Cloud استفاده می‌کند. فقط در صورتی آن را بازنویسی کنید که حساب یا منطقه TokenHub شما به نقطه پایانی دیگری نیاز داشته باشد:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="دسترس‌پذیری متغیرهای محیطی برای دیمن">
    اگر Gateway به‌صورت یک سرویس مدیریت‌شده (launchd، systemd، Docker) اجرا می‌شود، `TOKENHUB_API_KEY` و `TOKENPLAN_API_KEY` باید برای آن فرایند قابل مشاهده باشند. آن‌ها را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا محیط‌های اجرای launchd،‏ systemd یا Docker بتوانند آن‌ها را بخوانند.

    <Warning>
      کلیدهایی که فقط در یک پوسته تعاملی صادر شده‌اند، برای فرایندهای مدیریت‌شده Gateway قابل مشاهده نیستند. برای دسترس‌پذیری پایدار، از فایل متغیرهای محیطی یا مسیر پیکربندی استفاده کنید.
    </Warning>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، مراجع مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی، شامل تنظیمات ارائه‌دهنده.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    صفحه محصول TokenHub متعلق به Tencent Cloud.
  </Card>
  <Card title="کارت مدل پیش‌نمایش Hy3" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    جزئیات و معیارهای سنجش پیش‌نمایش Tencent Hunyuan Hy3.
  </Card>
</CardGroup>
