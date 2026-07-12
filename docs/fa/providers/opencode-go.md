---
read_when:
    - شما کاتالوگ OpenCode Go را می‌خواهید
    - برای مدل‌های میزبانی‌شده توسط Go به ارجاعات مدل زمان اجرا نیاز دارید
summary: از کاتالوگ OpenCode Go همراه با راه‌اندازی مشترک OpenCode استفاده کنید
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T10:46:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go کاتالوگ Go درون [OpenCode](/fa/providers/opencode) است. این کاتالوگ اعتبارنامهٔ `OPENCODE_API_KEY` را با کاتالوگ Zen به اشتراک می‌گذارد، اما شناسهٔ ارائه‌دهندهٔ زمان اجرای مستقل خود (`opencode-go`) را حفظ می‌کند تا مسیریابی بالادستی برای هر مدل درست باقی بماند.

| ویژگی                  | مقدار                                              |
| ---------------------- | -------------------------------------------------- |
| ارائه‌دهندهٔ زمان اجرا | `opencode-go`                                      |
| احراز هویت             | `OPENCODE_API_KEY` (نام مستعار: `OPENCODE_ZEN_API_KEY`) |
| راه‌اندازی والد        | [OpenCode](/fa/providers/opencode)                    |

## شروع کار

<Tabs>
  <Tab title="تعاملی">
    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
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

## کاتالوگ داخلی

برای مشاهدهٔ فهرست فعلی مدل‌ها، `openclaw models list --provider opencode-go` را اجرا کنید.
ردیف‌های همراه:

| ارجاع مدل                       | نام               | زمینه     | حداکثر خروجی | ورودی تصویر |
| ------------------------------- | ----------------- | --------- | ------------ | ----------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K         | خیر         |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K         | خیر         |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768       | خیر         |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768       | خیر         |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072      | خیر         |
| `opencode-go/hy3-preview`       | پیش‌نمایش HY3     | 262,144   | 32,768       | خیر         |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536       | بله         |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536       | بله         |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144      | بله         |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000      | بله         |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000      | خیر         |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536       | خیر         |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072      | خیر         |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072      | خیر         |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536       | بله         |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536       | بله         |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536       | خیر         |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536       | بله         |

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="رفتار مسیریابی">
    OpenClaw هر ارجاع مدل `opencode-go/...` را به‌طور خودکار مسیریابی می‌کند. هیچ پیکربندی اضافی برای ارائه‌دهنده لازم نیست.
  </Accordion>

  <Accordion title="قرارداد ارجاع زمان اجرا">
    ارجاع‌های زمان اجرا صریح باقی می‌مانند: `opencode/...` برای Zen و `opencode-go/...` برای Go. این کار مسیریابی بالادستی برای هر مدل را در هر دو کاتالوگ درست نگه می‌دارد.
  </Accordion>

  <Accordion title="اعتبارنامه‌های مشترک">
    یک `OPENCODE_API_KEY` هر دو کاتالوگ Zen و Go را پوشش می‌دهد. وارد کردن کلید هنگام راه‌اندازی، اعتبارنامه‌ها را برای هر دو ارائه‌دهندهٔ زمان اجرا ذخیره می‌کند.
  </Accordion>
</AccordionGroup>

<Tip>
برای نمای کلی راه‌اندازی اولیهٔ مشترک و مرجع کامل کاتالوگ‌های Zen و Go، به [OpenCode](/fa/providers/opencode) مراجعه کنید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="OpenCode (والد)" href="/fa/providers/opencode" icon="server">
    راه‌اندازی اولیهٔ مشترک، نمای کلی کاتالوگ و نکات پیشرفته.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جابه‌جایی هنگام خرابی.
  </Card>
</CardGroup>
