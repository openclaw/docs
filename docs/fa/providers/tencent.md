---
read_when:
    - می‌خواهید از پیش‌نمایش Tencent Hy3 با OpenClaw استفاده کنید
    - به راه‌اندازی کلید API TokenHub نیاز دارید
summary: راه‌اندازی Tencent Cloud TokenHub برای پیش‌نمایش Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T09:40:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud به‌صورت یک Plugin ارائه‌دهندهٔ همراه در OpenClaw عرضه می‌شود. این قابلیت از طریق نقطهٔ پایانی TokenHub (`tencent-tokenhub`) و با استفاده از یک API سازگار با OpenAI، دسترسی به پیش‌نمایش Tencent Hy3 را فراهم می‌کند.

| ویژگی            | مقدار                                                 |
| ---------------- | ----------------------------------------------------- |
| شناسهٔ ارائه‌دهنده | `tencent-tokenhub`                                    |
| Plugin           | همراه، `enabledByDefault: true`                       |
| متغیر محیطی احراز هویت | `TOKENHUB_API_KEY`                                    |
| پرچم راه‌اندازی اولیه | `--auth-choice tokenhub-api-key`                      |
| پرچم مستقیم CLI  | `--tokenhub-api-key <key>`                            |
| API              | سازگار با OpenAI (`openai-completions`)               |
| URL پایهٔ پیش‌فرض | `https://tokenhub.tencentmaas.com/v1`                 |
| URL پایهٔ جهانی  | `https://tokenhub-intl.tencentmaas.com/v1` (بازنویسی) |
| مدل پیش‌فرض      | `tencent-tokenhub/hy3-preview`                        |

## شروع سریع

<Steps>
  <Step title="یک کلید API برای TokenHub ایجاد کنید">
    در Tencent Cloud TokenHub یک کلید API ایجاد کنید. اگر برای کلید دامنهٔ دسترسی محدودی انتخاب می‌کنید، **Hy3 preview** را در مدل‌های مجاز بگنجانید.
  </Step>
  <Step title="راه‌اندازی اولیه را اجرا کنید">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env only
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="مدل را تأیید کنید">
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

| ارجاع مدل                      | نام                    | ورودی | زمینه | حداکثر خروجی | یادداشت‌ها                 |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | متن   | 256,000 | 64,000     | پیش‌فرض؛ دارای قابلیت استدلال |

Hy3 preview مدل زبانی بزرگ MoE متعلق به Tencent Hunyuan برای استدلال، پیروی از دستورالعمل‌ها با زمینهٔ طولانی، کدنویسی و گردش‌کارهای عامل است. نمونه‌های سازگار با OpenAI از Tencent از `hy3-preview` به‌عنوان شناسهٔ مدل استفاده می‌کنند و علاوه بر فراخوانی ابزار استاندارد chat-completions، از `reasoning_effort` نیز پشتیبانی می‌کنند.

<Tip>
  شناسهٔ مدل `hy3-preview` است. آن را با مدل‌های `HY-3D-*` Tencent اشتباه نگیرید؛ این مدل‌ها APIهای تولید سه‌بعدی هستند و مدل گفت‌وگوی OpenClaw پیکربندی‌شده توسط این ارائه‌دهنده نیستند.
</Tip>

## قیمت‌گذاری پلکانی

کاتالوگ همراه، فرادادهٔ هزینهٔ پلکانی را ارائه می‌کند که بر اساس طول پنجرهٔ ورودی مقیاس می‌شود؛ بنابراین برآوردهای هزینه بدون بازنویسی دستی پر می‌شوند.

| محدودهٔ توکن‌های ورودی | نرخ ورودی | نرخ خروجی | خواندن از کش |
| ------------------ | ---------- | ----------- | ---------- |
| 0 - 16,000         | 0.176      | 0.587       | 0.059      |
| 16,000 - 32,000    | 0.235      | 0.939       | 0.088      |
| 32,000+            | 0.293      | 1.173       | 0.117      |

نرخ‌ها به‌ازای هر یک میلیون توکن و به دلار آمریکا هستند، همان‌گونه که Tencent اعلام کرده است. قیمت‌گذاری را فقط زمانی زیر `models.providers.tencent-tokenhub` بازنویسی کنید که به سطح متفاوتی نیاز دارید.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="بازنویسی نقطهٔ پایانی">
    OpenClaw به‌طور پیش‌فرض از نقطهٔ پایانی `https://tokenhub.tencentmaas.com/v1` متعلق به Tencent Cloud استفاده می‌کند. Tencent همچنین یک نقطهٔ پایانی بین‌المللی برای TokenHub مستند کرده است:

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    نقطهٔ پایانی را فقط زمانی بازنویسی کنید که حساب یا منطقهٔ TokenHub شما به آن نیاز داشته باشد.

  </Accordion>

  <Accordion title="در دسترس بودن محیط برای daemon">
    اگر Gateway به‌صورت یک سرویس مدیریت‌شده اجرا می‌شود (launchd، systemd، Docker)، `TOKENHUB_API_KEY` باید برای آن فرایند قابل مشاهده باشد. آن را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا محیط‌های launchd، systemd یا Docker exec بتوانند آن را بخوانند.

    <Warning>
      کلیدهایی که فقط در `~/.profile` تنظیم شده‌اند برای فرایندهای مدیریت‌شدهٔ Gateway قابل مشاهده نیستند. برای دسترس‌پذیری پایدار، از فایل env یا seam پیکربندی استفاده کنید.
    </Warning>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration" icon="gear">
    طرح‌وارهٔ کامل پیکربندی، شامل تنظیمات ارائه‌دهنده.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    صفحهٔ محصول TokenHub متعلق به Tencent Cloud.
  </Card>
  <Card title="کارت مدل Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    جزئیات و بنچمارک‌های Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
