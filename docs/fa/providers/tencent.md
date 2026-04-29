---
read_when:
    - می‌خواهید از پیش‌نمایش Tencent Hy3 با OpenClaw استفاده کنید
    - باید کلید API TokenHub را تنظیم کنید
summary: راه‌اندازی Tencent Cloud TokenHub برای پیش‌نمایش Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-29T23:29:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c64afffc66dccca256ec658235ae1fbc18e46608b594bc07875118f54b2a494d
    source_path: providers/tencent.md
    workflow: 16
---

# Tencent Cloud TokenHub

Tencent Cloud به‌عنوان یک **Plugin ارائه‌دهندهٔ همراه** در OpenClaw عرضه می‌شود. این Plugin از طریق نقطهٔ پایانی TokenHub (`tencent-tokenhub`) به پیش‌نمایش Tencent Hy3 دسترسی می‌دهد.

این ارائه‌دهنده از یک API سازگار با OpenAI استفاده می‌کند.

| ویژگی      | مقدار                                      |
| ------------- | ------------------------------------------ |
| ارائه‌دهنده      | `tencent-tokenhub`                         |
| مدل پیش‌فرض | `tencent-tokenhub/hy3-preview`             |
| احراز هویت          | `TOKENHUB_API_KEY`                         |
| API           | تکمیل‌های گفت‌وگوی سازگار با OpenAI         |
| نشانی پایه      | `https://tokenhub.tencentmaas.com/v1`      |
| نشانی جهانی    | `https://tokenhub-intl.tencentmaas.com/v1` |

## شروع سریع

<Steps>
  <Step title="ایجاد کلید API برای TokenHub">
    یک کلید API در Tencent Cloud TokenHub ایجاد کنید. اگر برای کلید دامنهٔ دسترسی محدودی انتخاب می‌کنید، **پیش‌نمایش Hy3** را در مدل‌های مجاز بگنجانید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice tokenhub-api-key
    ```
  </Step>
  <Step title="راستی‌آزمایی مدل">
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

| ارجاع مدل                      | نام                   | ورودی | زمینه | حداکثر خروجی | یادداشت‌ها                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | پیش‌نمایش Hy3 (TokenHub) | متن  | 256,000 | 64,000     | پیش‌فرض؛ با قابلیت استدلال |

پیش‌نمایش Hy3 مدل زبانی بزرگ MoE شرکت Tencent Hunyuan برای استدلال، پیروی از دستورها با زمینهٔ بلند، کدنویسی و گردش‌کارهای عامل است. نمونه‌های سازگار با OpenAI شرکت Tencent از `hy3-preview` به‌عنوان شناسهٔ مدل استفاده می‌کنند و از فراخوانی ابزار در تکمیل‌های گفت‌وگوی استاندارد به‌همراه `reasoning_effort` پشتیبانی می‌کنند.

<Tip>
شناسهٔ مدل `hy3-preview` است. آن را با مدل‌های `HY-3D-*` شرکت Tencent اشتباه نگیرید؛ آن‌ها APIهای تولید سه‌بعدی هستند و مدل گفت‌وگوی OpenClaw نیستند که توسط این ارائه‌دهنده پیکربندی شده است.
</Tip>

## بازنویسی نقطهٔ پایانی

OpenClaw به‌صورت پیش‌فرض از نقطهٔ پایانی `https://tokenhub.tencentmaas.com/v1` متعلق به Tencent Cloud استفاده می‌کند. Tencent همچنین یک نقطهٔ پایانی بین‌المللی برای TokenHub مستند کرده است:

```bash
openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
```

نقطهٔ پایانی را فقط زمانی بازنویسی کنید که حساب یا منطقهٔ TokenHub شما به آن نیاز داشته باشد.

## یادداشت‌ها

- ارجاع‌های مدل TokenHub از `tencent-tokenhub/<modelId>` استفاده می‌کنند.
- کاتالوگ همراه در حال حاضر شامل `hy3-preview` است.
- این Plugin پیش‌نمایش Hy3 را دارای قابلیت استدلال و قابلیت استفادهٔ جریانی علامت‌گذاری می‌کند.
- این Plugin با فرادادهٔ قیمت‌گذاری لایه‌ای Hy3 عرضه می‌شود، بنابراین برآوردهای هزینه بدون بازنویسی دستی قیمت‌گذاری پر می‌شوند.
- فرادادهٔ قیمت‌گذاری، زمینه یا نقطهٔ پایانی را فقط در صورت نیاز در `models.providers` بازنویسی کنید.

## یادداشت محیطی

اگر Gateway به‌صورت daemon اجرا می‌شود (launchd/systemd)، مطمئن شوید `TOKENHUB_API_KEY`
برای آن فرایند در دسترس است (برای مثال، در `~/.openclaw/.env` یا از طریق
`env.shellEnv`).

## مستندات مرتبط

- [پیکربندی OpenClaw](/fa/gateway/configuration)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [صفحهٔ محصول Tencent TokenHub](https://cloud.tencent.com/product/tokenhub)
- [تولید متن Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130079)
- [راه‌اندازی Cline در Tencent TokenHub برای پیش‌نمایش Hy3](https://cloud.tencent.com/document/product/1823/130932)
- [کارت مدل پیش‌نمایش Tencent Hy3](https://huggingface.co/tencent/Hy3-preview)
