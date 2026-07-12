---
read_when:
    - می‌خواهید به مدل‌های میزبانی‌شده در OpenCode دسترسی داشته باشید
    - می‌خواهید بین کاتالوگ‌های Zen و Go یکی را انتخاب کنید
summary: از کاتالوگ‌های OpenCode Zen و Go با OpenClaw استفاده کنید
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T10:40:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode دو کاتالوگ میزبانی‌شده را در OpenClaw ارائه می‌کند:

| کاتالوگ | پیشوند            | ارائه‌دهنده زمان اجرا |
| ------- | ----------------- | --------------------- |
| **Zen** | `opencode/...`    | `opencode`            |
| **Go**  | `opencode-go/...` | `opencode-go`         |

هر دو کاتالوگ از یک کلید API متعلق به OpenCode استفاده می‌کنند (`OPENCODE_API_KEY`، با نام مستعار
`OPENCODE_ZEN_API_KEY`). OpenClaw شناسه‌های ارائه‌دهنده زمان اجرا را جدا نگه می‌دارد تا
مسیریابی بالادستی برای هر مدل درست باقی بماند، اما راه‌اندازی اولیه و مستندات آن‌ها را به‌عنوان
یک پیکربندی OpenCode در نظر می‌گیرند.

## شروع به کار

<Tabs>
  <Tab title="کاتالوگ Zen">
    **بهترین گزینه برای:** پراکسی چندمدلی منتخب OpenCode (Claude، GPT، Gemini، GLM،
    DeepSeek، Kimi، MiniMax، Qwen).

    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        یا کلید را مستقیماً وارد کنید:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="تنظیم یک مدل Zen به‌عنوان پیش‌فرض">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="بررسی در دسترس بودن مدل‌ها">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="کاتالوگ Go">
    **بهترین گزینه برای:** مجموعه مدل‌های Kimi، GLM، MiniMax، Qwen و DeepSeek میزبانی‌شده در OpenCode.

    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        یا کلید را مستقیماً وارد کنید:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
</Tabs>

## نمونه پیکربندی

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## کاتالوگ‌های داخلی

### Zen

| ویژگی                | مقدار                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------- |
| ارائه‌دهنده زمان اجرا | `opencode`                                                                                    |
| مدل‌های نمونه         | `opencode/claude-opus-4-6`، `opencode/gpt-5.5`، `opencode/gemini-3.1-pro`، `opencode/glm-5.2` |

برای مشاهده فهرست کامل و فعلی، `openclaw models list --provider opencode` را اجرا کنید؛ این فهرست
ردیف‌های سطح رایگان مانند `opencode/big-pickle` و
`opencode/deepseek-v4-flash-free` را نیز شامل می‌شود.

### Go

| ویژگی                | مقدار                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| ارائه‌دهنده زمان اجرا | `opencode-go`                                                            |
| مدل‌های نمونه         | `opencode-go/kimi-k2.6`، `opencode-go/glm-5`، `opencode-go/minimax-m2.5` |

برای مشاهده جدول کامل مدل‌های Go، به [OpenCode Go](/fa/providers/opencode-go) مراجعه کنید.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="نام‌های مستعار کلید API">
    `OPENCODE_ZEN_API_KEY` نیز به‌عنوان نام مستعار `OPENCODE_API_KEY` پذیرفته می‌شود.
  </Accordion>

  <Accordion title="اعتبارنامه‌های مشترک">
    وارد کردن یک کلید OpenCode هنگام پیکربندی، اعتبارنامه‌های هر دو ارائه‌دهنده
    زمان اجرا را ذخیره می‌کند. لازم نیست راه‌اندازی اولیه هر کاتالوگ را جداگانه انجام دهید.
  </Accordion>

  <Accordion title="دریافت کلید API">
    یک حساب OpenCode ایجاد کنید و در
    [opencode.ai/auth](https://opencode.ai/auth) یک کلید API بسازید. صورت‌حساب و دسترس‌پذیری
    کاتالوگ از داشبورد OpenCode مدیریت می‌شوند.
  </Accordion>

  <Accordion title="رفتار بازپخش Gemini">
    ارجاع‌های OpenCode مبتنی بر Gemini در مسیر پراکسی Gemini باقی می‌مانند؛ بنابراین OpenClaw
    پاک‌سازی امضای تفکر Gemini را در آن مسیر حفظ می‌کند، بدون آنکه اعتبارسنجی بومی بازپخش
    Gemini یا بازنویسی‌های راه‌اندازی اولیه را فعال کند.
  </Accordion>

  <Accordion title="رفتار بازپخش مدل‌های غیر Gemini">
    ارجاع‌های OpenCode غیر Gemini، خط‌مشی حداقلی بازپخش سازگار با OpenAI را حفظ می‌کنند.
  </Accordion>
</AccordionGroup>

## مطالب مرتبط

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/fa/providers/opencode-go" icon="server">
    مرجع کامل کاتالوگ Go.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی عامل‌ها، مدل‌ها و ارائه‌دهندگان.
  </Card>
</CardGroup>
