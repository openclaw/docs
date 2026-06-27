---
read_when:
    - شما کاتالوگ Go مربوط به OpenCode را می‌خواهید
    - به ارجاع‌های مدل زمان اجرا برای مدل‌های میزبانی‌شده با Go نیاز دارید
summary: از کاتالوگ Go در OpenCode با راه‌اندازی مشترک OpenCode استفاده کنید
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T18:42:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go کاتالوگ Go در [OpenCode](/fa/providers/opencode) است.
این کاتالوگ از همان `OPENCODE_API_KEY` کاتالوگ Zen استفاده می‌کند، اما شناسهٔ ارائه‌دهندهٔ زمان اجرا
`opencode-go` را نگه می‌دارد تا مسیریابی بالادستی برای هر مدل درست بماند.

| ویژگی | مقدار |
| ---------------- | ------------------------------- |
| ارائه‌دهندهٔ زمان اجرا | `opencode-go`                   |
| احراز هویت | `OPENCODE_API_KEY`              |
| راه‌اندازی والد | [OpenCode](/fa/providers/opencode) |

## کاتالوگ داخلی

OpenClaw بیشتر ردیف‌های کاتالوگ Go را از رجیستری مدل همراه OpenClaw می‌گیرد و
تا زمانی که رجیستری به‌روز شود، ردیف‌های فعلی بالادستی را تکمیل می‌کند. برای فهرست فعلی مدل‌ها
`openclaw models list --provider opencode-go` را اجرا کنید.

این ارائه‌دهنده شامل موارد زیر است:

| ارجاع مدل | نام |
| ------------------------------- | --------------------- |
| `opencode-go/glm-5`             | GLM-5                 |
| `opencode-go/glm-5.1`           | GLM-5.1               |
| `opencode-go/glm-5.2`           | GLM-5.2               |
| `opencode-go/kimi-k2.5`         | Kimi K2.5             |
| `opencode-go/kimi-k2.6`         | Kimi K2.6 (محدودیت‌های 3 برابر) |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`      | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`       | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus          |

GLM-5.2 از پنجرهٔ زمینهٔ 1M توکنی استفاده می‌کند و تا 131K توکن خروجی را پشتیبانی می‌کند.

## شروع به کار

<Tabs>
  <Tab title="تعاملی">
    <Steps>
      <Step title="اجرای آماده‌سازی اولیه">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="تنظیم یک مدل Go به‌عنوان پیش‌فرض">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="بررسی در دسترس بودن مدل‌ها">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="غیرتعاملی">
    <Steps>
      <Step title="ارسال مستقیم کلید">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="بررسی در دسترس بودن مدل‌ها">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## نمونهٔ پیکربندی

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="رفتار مسیریابی">
    وقتی ارجاع مدل از
    `opencode-go/...` استفاده کند، OpenClaw مسیریابی برای هر مدل را به‌صورت خودکار انجام می‌دهد. هیچ پیکربندی اضافه‌ای برای ارائه‌دهنده لازم نیست.
  </Accordion>

  <Accordion title="قرارداد ارجاع زمان اجرا">
    ارجاع‌های زمان اجرا صریح می‌مانند: `opencode/...` برای Zen و `opencode-go/...` برای Go.
    این کار مسیریابی بالادستی برای هر مدل را در هر دو کاتالوگ درست نگه می‌دارد.
  </Accordion>

  <Accordion title="اعتبارنامه‌های مشترک">
    همان `OPENCODE_API_KEY` توسط هر دو کاتالوگ Zen و Go استفاده می‌شود. وارد کردن
    کلید در زمان راه‌اندازی، اعتبارنامه‌ها را برای هر دو ارائه‌دهندهٔ زمان اجرا ذخیره می‌کند.
  </Accordion>
</AccordionGroup>

<Tip>
برای نمای کلی آماده‌سازی اولیهٔ مشترک و مرجع کامل کاتالوگ
Zen + Go، [OpenCode](/fa/providers/opencode) را ببینید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="OpenCode (والد)" href="/fa/providers/opencode" icon="server">
    آماده‌سازی اولیهٔ مشترک، نمای کلی کاتالوگ، و نکات پیشرفته.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
</CardGroup>
