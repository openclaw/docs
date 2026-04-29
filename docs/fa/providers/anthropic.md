---
read_when:
    - می‌خواهید از مدل‌های Anthropic در OpenClaw استفاده کنید
summary: استفاده از Anthropic Claude از طریق کلیدهای API یا Claude CLI در OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-29T23:22:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfaba2eea6a2d263d76036d1e6859fc3b487e886ec460ef2ced83e5e8e834327
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic خانوادهٔ مدل **Claude** را می‌سازد. OpenClaw از دو مسیر احراز هویت پشتیبانی می‌کند:

- **کلید API** — دسترسی مستقیم به API شرکت Anthropic با صورت‌حساب مبتنی بر مصرف (مدل‌های `anthropic/*`)
- **Claude CLI** — استفادهٔ مجدد از ورود موجود Claude CLI روی همان میزبان

<Warning>
کارکنان Anthropic به ما گفته‌اند استفادهٔ OpenClaw-مانند از Claude CLI دوباره مجاز است، بنابراین
OpenClaw استفادهٔ مجدد از Claude CLI و استفاده از `claude -p` را مجاز تلقی می‌کند مگر اینکه
Anthropic سیاست جدیدی منتشر کند.

برای میزبان‌های Gateway بلندمدت، کلیدهای API شرکت Anthropic همچنان شفاف‌ترین و
قابل‌پیش‌بینی‌ترین مسیر تولید هستند.

مستندات عمومی فعلی Anthropic:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [نمای کلی Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [استفاده از Claude Code با طرح Pro یا Max شما](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [استفاده از Claude Code با طرح Team یا Enterprise شما](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## شروع به کار

<Tabs>
  <Tab title="کلید API">
    **بهترین گزینه برای:** دسترسی استاندارد API و صورت‌حساب مبتنی بر مصرف.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        در [Anthropic Console](https://console.anthropic.com/) یک کلید API بسازید.
      </Step>
      <Step title="راه‌اندازی اولیه را اجرا کنید">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        یا کلید را مستقیم وارد کنید:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="در دسترس بودن مدل را بررسی کنید">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### نمونهٔ پیکربندی

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **بهترین گزینه برای:** استفادهٔ مجدد از ورود موجود Claude CLI بدون کلید API جداگانه.

    <Steps>
      <Step title="مطمئن شوید Claude CLI نصب شده و وارد شده است">
        با این دستور بررسی کنید:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="راه‌اندازی اولیه را اجرا کنید">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw اعتبارنامه‌های موجود Claude CLI را شناسایی کرده و دوباره استفاده می‌کند.
      </Step>
      <Step title="در دسترس بودن مدل را بررسی کنید">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    جزئیات راه‌اندازی و زمان اجرا برای بک‌اند Claude CLI در [بک‌اندهای CLI](/fa/gateway/cli-backends) آمده است.
    </Note>

    ### نمونهٔ پیکربندی

    ارجاع مدل متعارف Anthropic را همراه با بازنویسی زمان اجرای CLI ترجیح دهید:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    ارجاع‌های مدل قدیمی `claude-cli/claude-opus-4-7` همچنان برای
    سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب ارائه‌دهنده/مدل را به صورت
    `anthropic/*` نگه دارد و بک‌اند اجرا را در `agentRuntime.id` قرار دهد.

    <Tip>
    اگر شفاف‌ترین مسیر صورت‌حساب را می‌خواهید، به‌جای آن از کلید API شرکت Anthropic استفاده کنید. OpenClaw همچنین از گزینه‌های اشتراکی از [OpenAI Codex](/fa/providers/openai)، [Qwen Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [Z.AI / GLM](/fa/providers/glm) پشتیبانی می‌کند.
    </Tip>

  </Tab>
</Tabs>

## پیش‌فرض‌های تفکر (Claude 4.6)

مدل‌های Claude 4.6 وقتی سطح تفکر صریحی تنظیم نشده باشد، به‌صورت پیش‌فرض در OpenClaw از تفکر `adaptive` استفاده می‌کنند.

برای هر پیام با `/think:<level>` یا در پارامترهای مدل بازنویسی کنید:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
مستندات مرتبط Anthropic:
- [تفکر adaptive](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [تفکر گسترش‌یافته](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## کش کردن پرامپت

OpenClaw از قابلیت کش کردن پرامپت Anthropic برای احراز هویت با کلید API پشتیبانی می‌کند.

| مقدار               | مدت کش | توضیح                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (پیش‌فرض) | 5 دقیقه      | به‌طور خودکار برای احراز هویت با کلید API اعمال می‌شود |
| `"long"`            | 1 ساعت         | کش گسترش‌یافته                         |
| `"none"`            | بدون کش     | کش کردن پرامپت را غیرفعال می‌کند                 |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="بازنویسی‌های کش برای هر عامل">
    از پارامترهای سطح مدل به‌عنوان مبنا استفاده کنید، سپس عامل‌های مشخص را از طریق `agents.list[].params` بازنویسی کنید:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    ترتیب ادغام پیکربندی:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (مطابق با `id`، بازنویسی بر اساس کلید)

    این کار اجازه می‌دهد یک عامل کش بلندمدت را حفظ کند، در حالی که عامل دیگری روی همان مدل کش را برای ترافیک جهشی/با استفادهٔ مجدد کم غیرفعال می‌کند.

  </Accordion>

  <Accordion title="نکته‌های Bedrock Claude">
    - مدل‌های Anthropic Claude روی Bedrock (`amazon-bedrock/*anthropic.claude*`) در صورت پیکربندی، عبور مستقیم `cacheRetention` را می‌پذیرند.
    - مدل‌های غیر Anthropic در Bedrock در زمان اجرا به `cacheRetention: "none"` اجبار می‌شوند.
    - پیش‌فرض‌های هوشمند کلید API همچنین برای ارجاع‌های Claude-on-Bedrock وقتی مقدار صریحی تنظیم نشده باشد، `cacheRetention: "short"` را مقداردهی اولیه می‌کنند.

  </Accordion>
</AccordionGroup>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="حالت سریع">
    کلید مشترک `/fast` در OpenClaw از ترافیک مستقیم Anthropic پشتیبانی می‌کند (کلید API و OAuth به `api.anthropic.com`).

    | دستور | نگاشت می‌شود به |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - فقط برای درخواست‌های مستقیم `api.anthropic.com` تزریق می‌شود. مسیرهای پراکسی `service_tier` را دست‌نخورده می‌گذارند.
    - پارامترهای صریح `serviceTier` یا `service_tier` وقتی هر دو تنظیم شده باشند، `/fast` را بازنویسی می‌کنند.
    - در حساب‌هایی بدون ظرفیت Priority Tier، ممکن است `service_tier: "auto"` به `standard` تبدیل شود.

    </Note>

  </Accordion>

  <Accordion title="درک رسانه (تصویر و PDF)">
    Plugin همراه Anthropic درک تصویر و PDF را ثبت می‌کند. OpenClaw
    قابلیت‌های رسانه را به‌طور خودکار از احراز هویت پیکربندی‌شدهٔ Anthropic حل می‌کند — هیچ
    پیکربندی اضافی لازم نیست.

    | ویژگی       | مقدار                |
    | -------------- | -------------------- |
    | مدل پیش‌فرض  | `claude-opus-4-6`    |
    | ورودی پشتیبانی‌شده | تصاویر، اسناد PDF |

    وقتی یک تصویر یا PDF به مکالمه پیوست می‌شود، OpenClaw آن را به‌طور خودکار
    از طریق ارائه‌دهندهٔ درک رسانهٔ Anthropic مسیریابی می‌کند.

  </Accordion>

  <Accordion title="پنجرهٔ زمینهٔ 1M (بتا)">
    پنجرهٔ زمینهٔ 1M شرکت Anthropic پشت دروازهٔ بتا است. آن را برای هر مدل فعال کنید:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw این را در درخواست‌ها به `anthropic-beta: context-1m-2025-08-07` نگاشت می‌کند.

    `params.context1m: true` همچنین برای بک‌اند Claude CLI
    (`claude-cli/*`) برای مدل‌های واجد شرایط Opus و Sonnet اعمال می‌شود و پنجرهٔ زمینهٔ زمان اجرا را
    برای آن نشست‌های CLI گسترش می‌دهد تا با رفتار API مستقیم مطابقت داشته باشد.

    <Warning>
    به دسترسی زمینهٔ بلند روی اعتبارنامهٔ Anthropic شما نیاز دارد. احراز هویت توکن قدیمی (`sk-ant-oat-*`) برای درخواست‌های زمینهٔ 1M رد می‌شود — OpenClaw هشدار ثبت می‌کند و به پنجرهٔ زمینهٔ استاندارد برمی‌گردد.
    </Warning>

  </Accordion>

  <Accordion title="زمینهٔ 1M در Claude Opus 4.7">
    `anthropic/claude-opus-4.7` و گونهٔ `claude-cli` آن به‌صورت پیش‌فرض پنجرهٔ زمینهٔ 1M
    دارند — نیازی به `params.context1m: true` نیست.
  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="خطاهای 401 / توکن ناگهان نامعتبر شده است">
    احراز هویت توکن Anthropic منقضی می‌شود و می‌تواند لغو شود. برای راه‌اندازی‌های جدید، به‌جای آن از کلید API شرکت Anthropic استفاده کنید.
  </Accordion>

  <Accordion title='هیچ کلید API برای ارائه‌دهندهٔ "anthropic" پیدا نشد'>
    احراز هویت Anthropic **برای هر عامل جداگانه** است — عامل‌های جدید کلیدهای عامل اصلی را به ارث نمی‌برند. راه‌اندازی اولیه را برای آن عامل دوباره اجرا کنید (یا یک کلید API روی میزبان Gateway پیکربندی کنید)، سپس با `openclaw models status` بررسی کنید.
  </Accordion>

  <Accordion title='هیچ اعتبارنامه‌ای برای پروفایل "anthropic:default" پیدا نشد'>
    `openclaw models status` را اجرا کنید تا ببینید کدام پروفایل احراز هویت فعال است. راه‌اندازی اولیه را دوباره اجرا کنید، یا یک کلید API برای آن مسیر پروفایل پیکربندی کنید.
  </Accordion>

  <Accordion title="هیچ پروفایل احراز هویت در دسترسی نیست (همه در دورهٔ خنک‌سازی هستند)">
    `openclaw models status --json` را برای `auth.unusableProfiles` بررسی کنید. دوره‌های خنک‌سازی محدودیت نرخ Anthropic می‌توانند وابسته به مدل باشند، بنابراین یک مدل Anthropic هم‌خانواده ممکن است همچنان قابل استفاده باشد. یک پروفایل Anthropic دیگر اضافه کنید یا منتظر پایان دورهٔ خنک‌سازی بمانید.
  </Accordion>
</AccordionGroup>

<Note>
کمک بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="بک‌اندهای CLI" href="/fa/gateway/cli-backends" icon="terminal">
    جزئیات راه‌اندازی و زمان اجرای بک‌اند Claude CLI.
  </Card>
  <Card title="کش کردن پرامپت" href="/fa/reference/prompt-caching" icon="database">
    نحوهٔ کار کش کردن پرامپت در میان ارائه‌دهنده‌ها.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفادهٔ مجدد از اعتبارنامه.
  </Card>
</CardGroup>
