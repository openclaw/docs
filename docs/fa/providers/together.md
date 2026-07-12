---
read_when:
    - می‌خواهید از Together AI با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینه احراز هویت CLI نیاز دارید
summary: راه‌اندازی Together AI (احراز هویت + انتخاب مدل)
title: Together AI
x-i18n:
    generated_at: "2026-07-12T10:44:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) از طریق یک API یکپارچه، دسترسی به مدل‌های متن‌باز پیشرو از جمله Llama، DeepSeek، Kimi و مدل‌های دیگر را فراهم می‌کند.
OpenClaw آن را به‌عنوان ارائه‌دهندهٔ `together` عرضه می‌کند.

| ویژگی | مقدار                         |
| -------- | ----------------------------- |
| ارائه‌دهنده | `together`                    |
| احراز هویت     | `TOGETHER_API_KEY`            |
| API      | سازگار با OpenAI             |
| نشانی پایه | `https://api.together.xyz/v1` |

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
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### نمونهٔ غیرتعاملی

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
راه‌اندازی اولیه، `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` را به‌عنوان
مدل پیش‌فرض تنظیم می‌کند.
</Note>

## فهرست داخلی

هزینه بر حسب دلار آمریکا به‌ازای هر یک میلیون توکن است.

| ارجاع مدل                                          | نام                         | ورودی       | پنجرهٔ زمینه | حداکثر خروجی | هزینه (ورودی/خروجی) | توضیحات               |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | ---------- | ------------- | ------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | متن        | 131,072 | 8,192      | 0.88 / 0.88   | مدل پیش‌فرض       |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | متن، تصویر | 262,144 | 32,768     | 1.20 / 4.50   | مدل استدلالی     |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | متن        | 512,000 | 8,192      | 2.10 / 4.40   | مدل استدلالی     |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | متن        | 32,768  | 8,192      | 0.30 / 0.30   | سریع، بدون استدلال |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | متن        | 202,752 | 8,192      | 1.40 / 4.40   | مدل استدلالی     |

## تولید ویدئو

Plugin همراه `together`، تولید ویدئو را نیز از طریق ابزار مشترک
`video_generate` ثبت می‌کند.

| ویژگی             | مقدار                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| مدل پیش‌فرض ویدئو  | `Wan-AI/Wan2.2-T2V-A14B`                                                                  |
| مدل‌های دیگر         | `Wan-AI/Wan2.2-I2V-A14B`، `minimax/Hailuo-02`، `Kwai/Kling-2.1-Master`                    |
| حالت‌ها                | متن به ویدئو؛ تصویر به ویدئو فقط با `Wan-AI/Wan2.2-I2V-A14B` (یک تصویر مرجع) |
| مدت             | ۱ تا ۱۰ ثانیه                                                                              |
| پارامترهای پشتیبانی‌شده | `size` (با قالب `<width>x<height>` تجزیه می‌شود)؛ `aspectRatio`/`resolution` خوانده نمی‌شوند            |

برای استفاده از Together به‌عنوان ارائه‌دهندهٔ پیش‌فرض ویدئو:

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
برای آگاهی از پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده و رفتار جایگزینی هنگام خرابی، به [تولید ویدئو](/fa/tools/video-generation) مراجعه کنید.
</Tip>

<AccordionGroup>
  <Accordion title="نکتهٔ محیطی">
    اگر Gateway به‌صورت سرویس پس‌زمینه (launchd/systemd) اجرا می‌شود، مطمئن شوید
    `TOGETHER_API_KEY` برای آن فرایند در دسترس است (برای نمونه، در
    `~/.openclaw/.env` یا از طریق `env.shellEnv`).

    <Warning>
    کلیدهایی که فقط در پوستهٔ تعاملی شما تنظیم شده‌اند، برای فرایندهای Gateway
    تحت مدیریت سرویس پس‌زمینه قابل مشاهده نیستند. برای دسترسی پایدار، از
    `~/.openclaw/.env` یا پیکربندی `env.shellEnv` استفاده کنید.
    </Warning>

  </Accordion>

  <Accordion title="رفع اشکال">
    - بررسی کنید کلیدتان کار می‌کند: `openclaw models list --provider together`
    - اگر مدل‌ها نمایش داده نمی‌شوند، تأیید کنید که کلید API در محیط صحیح
      فرایند Gateway شما تنظیم شده است.
    - ارجاع‌های مدل از قالب `together/<model-id>` استفاده می‌کنند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    قواعد ارائه‌دهنده، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار مشترک تولید ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌وارهٔ کامل پیکربندی، شامل تنظیمات ارائه‌دهنده.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    داشبورد، مستندات API و قیمت‌گذاری Together AI.
  </Card>
</CardGroup>
