---
read_when:
    - می‌خواهید از Together AI با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینهٔ احراز هویت CLI نیاز دارید
summary: راه‌اندازی Together AI (احراز هویت + انتخاب مدل)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T18:44:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) دسترسی به مدل‌های پیشرو متن‌باز
از جمله Llama، DeepSeek، Kimi و موارد بیشتر را از طریق یک API یکپارچه فراهم می‌کند.

| ویژگی | مقدار                         |
| -------- | ----------------------------- |
| ارائه‌دهنده | `together`                    |
| احراز هویت     | `TOGETHER_API_KEY`            |
| API      | سازگار با OpenAI             |
| URL پایه | `https://api.together.xyz/v1` |

## شروع به کار

<Steps>
  <Step title="Get an API key">
    یک API key در
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys) بسازید.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Set a default model">
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

### نمونه غیرتعاملی

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
پیش‌تنظیم onboarding
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.
</Note>

## کاتالوگ داخلی

OpenClaw این کاتالوگ همراه Together را ارائه می‌کند:

| ارجاع مدل                                          | نام                         | ورودی       | Context | یادداشت‌ها                |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | متن        | 131,072 | مدل پیش‌فرض        |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | متن، تصویر | 262,144 | مدل استدلال Kimi |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | متن        | 512,000 | مدل متنی استدلالی |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | متن        | 32,768  | مدل متنی سریع      |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | متن        | 202,752 | مدل متنی استدلالی |

## تولید ویدئو

Plugin همراه `together` همچنین تولید ویدئو را از طریق ابزار
مشترک `video_generate` ثبت می‌کند.

| ویژگی             | مقدار                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| مدل ویدئوی پیش‌فرض  | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| حالت‌ها                | متن‌به‌ویدئو؛ فقط مرجع تک‌تصویری با `Wan-AI/Wan2.2-I2V-A14B` |
| پارامترهای پشتیبانی‌شده | `aspectRatio`, `resolution`                                              |

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
برای پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار failover،
[تولید ویدئو](/fa/tools/video-generation) را ببینید.
</Tip>

<AccordionGroup>
  <Accordion title="Environment note">
    اگر Gateway به‌صورت daemon اجرا می‌شود (launchd/systemd)، مطمئن شوید
    `TOGETHER_API_KEY` برای آن فرایند در دسترس است (برای مثال، در
    `~/.openclaw/.env` یا از طریق `env.shellEnv`).

    <Warning>
    کلیدهایی که فقط در shell تعاملی شما تنظیم شده‌اند، برای فرایندهای gateway
    مدیریت‌شده توسط daemon قابل مشاهده نیستند. برای دسترسی پایدار، از پیکربندی
    `~/.openclaw/.env` یا `env.shellEnv` استفاده کنید.
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - بررسی کنید کلید شما کار می‌کند: `openclaw models list --provider together`
    - اگر مدل‌ها نمایش داده نمی‌شوند، تأیید کنید API key در محیط درست
      برای فرایند Gateway شما تنظیم شده است.
    - ارجاع‌های مدل از قالب `together/<model-id>` استفاده می‌کنند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    قواعد ارائه‌دهنده، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Video generation" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار مشترک تولید ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/configuration-reference" icon="gear">
    schema کامل پیکربندی، شامل تنظیمات ارائه‌دهنده.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    داشبورد Together AI، مستندات API، و قیمت‌گذاری.
  </Card>
</CardGroup>
