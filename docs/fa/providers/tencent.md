---
read_when:
    - می‌خواهید از پیش‌نمایش Tencent Hy3 با OpenClaw استفاده کنید
    - به راه‌اندازی کلید API TokenHub نیاز دارید
summary: راه‌اندازی Tencent Cloud TokenHub برای پیش‌نمایش Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-06-27T18:44:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62bcdd795cc0334f409405fa7c369ed9966854616a89dbc7153f91ee349895ad
    source_path: providers/tencent.md
    workflow: 16
---

Plugin رسمی ارائه‌دهنده Tencent Cloud را نصب کنید تا از طریق نقطه پایانی TokenHub (`tencent-tokenhub`) و با استفاده از API سازگار با OpenAI به پیش‌نمایش Tencent Hy3 دسترسی پیدا کنید.

| ویژگی | مقدار |
| ---------------- | ----------------------------------------------------- |
| شناسه ارائه‌دهنده | `tencent-tokenhub` |
| بسته | `@openclaw/tencent-provider` |
| متغیر محیطی احراز هویت | `TOKENHUB_API_KEY` |
| پرچم راه‌اندازی اولیه | `--auth-choice tokenhub-api-key` |
| پرچم مستقیم CLI | `--tokenhub-api-key <key>` |
| API | سازگار با OpenAI (`openai-completions`) |
| URL پایه پیش‌فرض | `https://tokenhub.tencentmaas.com/v1` |
| URL پایه سراسری | `https://tokenhub-intl.tencentmaas.com/v1` (بازنویسی) |
| مدل پیش‌فرض | `tencent-tokenhub/hy3-preview` |

## شروع سریع

<Steps>
  <Step title="نصب Plugin">
    ```bash
    openclaw plugins install @openclaw/tencent-provider
    ```
  </Step>
  <Step title="ساخت کلید API برای TokenHub">
    یک کلید API در Tencent Cloud TokenHub بسازید. اگر برای کلید دامنه دسترسی محدودی انتخاب می‌کنید، **Hy3 preview** را در مدل‌های مجاز قرار دهید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    <CodeGroup>

```bash راه‌اندازی اولیه
openclaw onboard --auth-choice tokenhub-api-key
```

```bash پرچم مستقیم
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash فقط محیط
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="اعتبارسنجی مدل">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## راه‌اندازی غیرتعاملی

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## کاتالوگ داخلی

| مرجع مدل | نام | ورودی | زمینه | حداکثر خروجی | یادداشت‌ها |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | متن | 256,000 | 64,000 | پیش‌فرض؛ دارای قابلیت استدلال |

Hy3 preview مدل زبانی بزرگ MoE متعلق به Tencent Hunyuan برای استدلال، پیروی از دستورهای دارای زمینه طولانی، کدنویسی و گردش‌کارهای عامل است. نمونه‌های سازگار با OpenAI شرکت Tencent از `hy3-preview` به‌عنوان شناسه مدل استفاده می‌کنند و فراخوانی ابزار استاندارد chat-completions به‌همراه `reasoning_effort` را پشتیبانی می‌کنند.

<Tip>
  شناسه مدل `hy3-preview` است. آن را با مدل‌های `HY-3D-*` شرکت Tencent اشتباه نگیرید؛ آن‌ها APIهای تولید سه‌بعدی هستند و مدل گفت‌وگوی OpenClaw پیکربندی‌شده توسط این ارائه‌دهنده نیستند.
</Tip>

## قیمت‌گذاری پلکانی

کاتالوگ ارائه‌دهنده فراداده هزینه پلکانی را همراه دارد که با طول پنجره ورودی مقیاس می‌شود، بنابراین برآوردهای هزینه بدون بازنویسی دستی پر می‌شوند.

| بازه توکن‌های ورودی | نرخ ورودی | نرخ خروجی | خواندن کش |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000 | 0.176 | 0.587 | 0.059 |
| 16,000 - 32,000 | 0.235 | 0.939 | 0.088 |
| 32,000+ | 0.293 | 1.173 | 0.117 |

نرخ‌ها به‌ازای هر یک میلیون توکن و برحسب دلار آمریکا هستند، همان‌طور که Tencent اعلام کرده است. قیمت‌گذاری را فقط زمانی زیر `models.providers.tencent-tokenhub` بازنویسی کنید که به سطح متفاوتی نیاز دارید.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="بازنویسی نقطه پایانی">
    OpenClaw به‌صورت پیش‌فرض از نقطه پایانی `https://tokenhub.tencentmaas.com/v1` متعلق به Tencent Cloud استفاده می‌کند. Tencent همچنین یک نقطه پایانی بین‌المللی TokenHub را مستند کرده است:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    فقط زمانی نقطه پایانی را بازنویسی کنید که حساب یا منطقه TokenHub شما به آن نیاز دارد.

  </Accordion>

  <Accordion title="دسترس‌پذیری محیط برای daemon">
    اگر Gateway به‌عنوان یک سرویس مدیریت‌شده اجرا می‌شود (launchd، systemd، Docker)، `TOKENHUB_API_KEY` باید برای آن فرایند قابل مشاهده باشد. آن را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا محیط‌های launchd، systemd یا Docker exec بتوانند آن را بخوانند.

    <Warning>
      کلیدهایی که فقط در یک پوسته تعاملی export شده‌اند برای فرایندهای مدیریت‌شده gateway قابل مشاهده نیستند. برای دسترس‌پذیری پایدار، از فایل env یا محل اتصال پیکربندی استفاده کنید.
    </Warning>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، مراجع مدل و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration" icon="gear">
    طرح‌واره کامل پیکربندی، شامل تنظیمات ارائه‌دهنده.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    صفحه محصول TokenHub شرکت Tencent Cloud.
  </Card>
  <Card title="کارت مدل Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    جزئیات و بنچمارک‌های Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
