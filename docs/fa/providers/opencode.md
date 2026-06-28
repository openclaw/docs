---
read_when:
    - شما دسترسی به مدل میزبانی‌شده توسط OpenCode را می‌خواهید
    - می‌خواهید بین کاتالوگ‌های Zen و Go یکی را انتخاب کنید
summary: استفاده از کاتالوگ‌های OpenCode Zen و Go با OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:47:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode دو کاتالوگ میزبانی‌شده را در OpenClaw ارائه می‌کند:

| کاتالوگ | پیشوند            | ارائه‌دهندهٔ زمان اجرا |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

هر دو کاتالوگ از یک کلید API OpenCode مشترک استفاده می‌کنند. OpenClaw شناسه‌های ارائه‌دهندهٔ زمان اجرا را
جدا نگه می‌دارد تا مسیریابی بالادستی برای هر مدل درست بماند، اما راه‌اندازی اولیه و مستندات با آن‌ها
مثل یک تنظیم OpenCode واحد رفتار می‌کنند.

## شروع به کار

<Tabs>
  <Tab title="کاتالوگ Zen">
    **بهترین گزینه برای:** پروکسی چندمدلی گزینش‌شدهٔ OpenCode (Claude، GPT، Gemini، GLM).

    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        یا کلید را مستقیم وارد کنید:

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
    **بهترین گزینه برای:** مجموعهٔ Kimi، GLM و MiniMax میزبانی‌شده در OpenCode.

    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        یا کلید را مستقیم وارد کنید:

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

## نمونهٔ پیکربندی

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## کاتالوگ‌های داخلی

### Zen

| ویژگی         | مقدار                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------- |
| ارائه‌دهندهٔ زمان اجرا | `opencode`                                                                                    |
| مدل‌های نمونه   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| ویژگی         | مقدار                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| ارائه‌دهندهٔ زمان اجرا | `opencode-go`                                                            |
| مدل‌های نمونه   | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="نام‌های مستعار کلید API">
    `OPENCODE_ZEN_API_KEY` نیز به‌عنوان نام مستعار برای `OPENCODE_API_KEY` پشتیبانی می‌شود.
  </Accordion>

  <Accordion title="اعتبارنامه‌های مشترک">
    وارد کردن یک کلید OpenCode در زمان راه‌اندازی، اعتبارنامه‌ها را برای هر دو ارائه‌دهندهٔ
    زمان اجرا ذخیره می‌کند. لازم نیست هر کاتالوگ را جداگانه راه‌اندازی اولیه کنید.
  </Accordion>

  <Accordion title="صورتحساب و داشبورد">
    وارد OpenCode می‌شوید، جزئیات صورتحساب را اضافه می‌کنید و کلید API خود را کپی می‌کنید. صورتحساب
    و دسترس‌پذیری کاتالوگ از داشبورد OpenCode مدیریت می‌شوند.
  </Accordion>

  <Accordion title="رفتار بازپخش Gemini">
    ارجاع‌های OpenCode مبتنی بر Gemini روی مسیر پروکسی-Gemini باقی می‌مانند، بنابراین OpenClaw پاک‌سازی
    امضاهای فکری Gemini را در همان‌جا نگه می‌دارد، بدون اینکه اعتبارسنجی بازپخش بومی Gemini
    یا بازنویسی‌های bootstrap را فعال کند.
  </Accordion>

  <Accordion title="رفتار بازپخش غیر Gemini">
    ارجاع‌های غیر Gemini در OpenCode سیاست بازپخش حداقلی سازگار با OpenAI را حفظ می‌کنند.
  </Accordion>
</AccordionGroup>

<Tip>
وارد کردن یک کلید OpenCode در زمان راه‌اندازی، اعتبارنامه‌ها را برای هر دو ارائه‌دهندهٔ زمان اجرای Zen و
Go ذخیره می‌کند، بنابراین فقط یک بار باید راه‌اندازی اولیه کنید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای عامل‌ها، مدل‌ها و ارائه‌دهنده‌ها.
  </Card>
</CardGroup>
