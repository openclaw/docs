---
read_when:
    - می‌خواهید از Together AI با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینهٔ احراز هویت CLI نیاز دارید
summary: راه‌اندازی Together AI (احراز هویت + انتخاب مدل)
title: Together AI
x-i18n:
    generated_at: "2026-04-29T23:29:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7713c0b1e64014bbdd87a120de0a950b583afd1481338f2c6cccfb2b7da76e7
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) دسترسی به مدل‌های متن‌باز پیشرو، از جمله Llama، DeepSeek، Kimi و موارد دیگر را از طریق یک API یکپارچه فراهم می‌کند.

| ویژگی | مقدار                         |
| -------- | ----------------------------- |
| ارائه‌دهنده | `together`                    |
| احراز هویت     | `TOGETHER_API_KEY`            |
| API      | سازگار با OpenAI             |
| URL پایه | `https://api.together.xyz/v1` |

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys) ایجاد کنید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="تنظیم مدل پیش‌فرض">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### نمونه غیرتعاملی

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
پیش‌تنظیم راه‌اندازی اولیه، `together/moonshotai/Kimi-K2.5` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.
</Note>

## کاتالوگ داخلی

OpenClaw این کاتالوگ همراه Together را عرضه می‌کند:

| ارجاع مدل                                                    | نام                                   | ورودی       | زمینه    | یادداشت‌ها                            |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | متن، تصویر | 262,144    | مدل پیش‌فرض؛ استدلال فعال است |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | متن        | 202,752    | مدل متن عمومی       |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | متن        | 131,072    | مدل دستورالعمل سریع           |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | متن، تصویر | 10,000,000 | چندوجهی                       |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | متن، تصویر | 20,000,000 | چندوجهی                       |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | متن        | 131,072    | مدل متن عمومی               |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | متن        | 131,072    | مدل استدلال                  |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | متن        | 262,144    | مدل متن ثانویه Kimi        |

## تولید ویدئو

Plugin همراه `together` همچنین تولید ویدئو را از طریق ابزار مشترک `video_generate` ثبت می‌کند.

| ویژگی             | مقدار                                 |
| -------------------- | ------------------------------------- |
| مدل ویدئوی پیش‌فرض  | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| حالت‌ها                | متن به ویدئو، ارجاع تک‌تصویر |
| پارامترهای پشتیبانی‌شده | `aspectRatio`, `resolution`           |

برای استفاده از Together به‌عنوان ارائه‌دهنده پیش‌فرض ویدئو:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
برای پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده و رفتار failover، [تولید ویدئو](/fa/tools/video-generation) را ببینید.
</Tip>

<AccordionGroup>
  <Accordion title="یادداشت محیط">
    اگر Gateway به‌صورت daemon اجرا می‌شود (launchd/systemd)، مطمئن شوید
    `TOGETHER_API_KEY` برای آن فرایند در دسترس است (برای مثال، در
    `~/.openclaw/.env` یا از طریق `env.shellEnv`).

    <Warning>
    کلیدهایی که فقط در پوسته تعاملی شما تنظیم شده‌اند، برای فرایندهای gateway مدیریت‌شده توسط daemon قابل مشاهده نیستند. برای دسترسی پایدار، از پیکربندی `~/.openclaw/.env` یا `env.shellEnv` استفاده کنید.
    </Warning>

  </Accordion>

  <Accordion title="عیب‌یابی">
    - بررسی کنید کلید شما کار می‌کند: `openclaw models list --provider together`
    - اگر مدل‌ها نمایش داده نمی‌شوند، تأیید کنید کلید API در محیط درست برای فرایند Gateway شما تنظیم شده است.
    - ارجاع‌های مدل از قالب `together/<model-id>` استفاده می‌کنند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    قوانین ارائه‌دهنده، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار مشترک تولید ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرحواره کامل پیکربندی، شامل تنظیمات ارائه‌دهنده.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    داشبورد Together AI، مستندات API و قیمت‌گذاری.
  </Card>
</CardGroup>
