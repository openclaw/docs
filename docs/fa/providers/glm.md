---
read_when:
    - می‌خواهید مدل‌های GLM را در OpenClaw داشته باشید
    - به قرارداد نام‌گذاری مدل و راه‌اندازی نیاز دارید
summary: نمای کلی خانوادهٔ مدل GLM + نحوهٔ استفاده از آن در OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-29T23:25:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
    source_path: providers/glm.md
    workflow: 16
---

# مدل‌های GLM

GLM یک **خانوادهٔ مدل** است (نه یک شرکت) که از طریق پلتفرم Z.AI در دسترس است. در OpenClaw، مدل‌های GLM
از طریق ارائه‌دهندهٔ `zai` و شناسه‌های مدل مانند `zai/glm-5` استفاده می‌شوند.

## شروع به کار

<Steps>
  <Step title="Choose an auth route and run onboarding">
    گزینهٔ راه‌اندازی اولیه‌ای را انتخاب کنید که با طرح و منطقهٔ Z.AI شما مطابقت دارد:

    | گزینهٔ احراز هویت | مناسب برای |
    | ----------- | -------- |
    | `zai-api-key` | راه‌اندازی عمومی با کلید API همراه با تشخیص خودکار endpoint |
    | `zai-coding-global` | کاربران Coding Plan (سراسری) |
    | `zai-coding-cn` | کاربران Coding Plan (منطقهٔ چین) |
    | `zai-global` | API عمومی (سراسری) |
    | `zai-cn` | API عمومی (منطقهٔ چین) |

    ```bash
    # Example: generic auto-detect
    openclaw onboard --auth-choice zai-api-key

    # Example: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Set GLM as the default model">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## نمونهٔ پیکربندی

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` به OpenClaw اجازه می‌دهد endpoint متناظر Z.AI را از روی کلید تشخیص دهد و
نشانی پایهٔ درست را به‌صورت خودکار اعمال کند. وقتی می‌خواهید یک سطح مشخص از Coding Plan یا API عمومی
منطقه‌ای را اجبار کنید، از گزینه‌های منطقه‌ای صریح استفاده کنید.
</Tip>

## کاتالوگ داخلی

OpenClaw در حال حاضر ارائه‌دهندهٔ همراه `zai` را با این ارجاع‌های GLM مقداردهی اولیه می‌کند:

| مدل           | مدل            |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
ارجاع مدل همراه پیش‌فرض `zai/glm-5.1` است. نسخه‌ها و دسترس‌پذیری GLM
ممکن است تغییر کنند؛ برای تازه‌ترین اطلاعات، مستندات Z.AI را بررسی کنید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Endpoint auto-detection">
    وقتی از گزینهٔ احراز هویت `zai-api-key` استفاده می‌کنید، OpenClaw قالب کلید را بررسی می‌کند
    تا نشانی پایهٔ درست Z.AI را تعیین کند. گزینه‌های منطقه‌ای صریح
    (`zai-coding-global`، `zai-coding-cn`، `zai-global`، `zai-cn`) تشخیص خودکار را نادیده می‌گیرند
    و endpoint را مستقیماً ثابت می‌کنند.
  </Accordion>

  <Accordion title="Provider details">
    مدل‌های GLM توسط ارائه‌دهندهٔ زمان اجرای `zai` ارائه می‌شوند. برای پیکربندی کامل ارائه‌دهنده،
    endpointهای منطقه‌ای، و قابلیت‌های بیشتر، به
    [مستندات ارائه‌دهندهٔ Z.AI](/fa/providers/zai) مراجعه کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Z.AI provider" href="/fa/providers/zai" icon="server">
    پیکربندی کامل ارائه‌دهندهٔ Z.AI و endpointهای منطقه‌ای.
  </Card>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
</CardGroup>
