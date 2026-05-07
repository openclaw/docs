---
read_when:
    - می‌خواهید از مدل‌های Anthropic در OpenClaw استفاده کنید
summary: استفاده از Anthropic Claude از طریق کلیدهای API یا Claude CLI در OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T13:29:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic خانواده مدل‌های **Claude** را می‌سازد. OpenClaw از دو مسیر احراز هویت پشتیبانی می‌کند:

- **کلید API** — دسترسی مستقیم به Anthropic API با صورت‌حساب مبتنی بر میزان استفاده (مدل‌های `anthropic/*`)
- **Claude CLI** — استفاده دوباره از ورود Claude CLI موجود روی همان میزبان

<Warning>
کارکنان Anthropic به ما گفته‌اند استفاده از Claude CLI به سبک OpenClaw دوباره مجاز است، بنابراین
OpenClaw استفاده دوباره از Claude CLI و کاربرد `claude -p` را مجاز تلقی می‌کند مگر اینکه
Anthropic سیاست جدیدی منتشر کند.

برای میزبان‌های Gateway بلندمدت، کلیدهای Anthropic API همچنان روشن‌ترین و
قابل‌پیش‌بینی‌ترین مسیر تولید هستند.

مستندات عمومی فعلی Anthropic:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [نمای کلی Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [استفاده از Claude Code با طرح Pro یا Max خود](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [استفاده از Claude Code با طرح Team یا Enterprise خود](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## شروع به کار

<Tabs>
  <Tab title="کلید API">
    **بهترین گزینه برای:** دسترسی استاندارد API و صورت‌حساب مبتنی بر میزان استفاده.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        یک کلید API در [Anthropic Console](https://console.anthropic.com/) بسازید.
      </Step>
      <Step title="راه‌اندازی اولیه را اجرا کنید">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        یا کلید را مستقیما پاس دهید:

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

    ### نمونه پیکربندی

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **بهترین گزینه برای:** استفاده دوباره از ورود Claude CLI موجود بدون کلید API جداگانه.

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

        OpenClaw اعتبارنامه‌های Claude CLI موجود را تشخیص می‌دهد و دوباره استفاده می‌کند.
      </Step>
      <Step title="در دسترس بودن مدل را بررسی کنید">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    جزئیات راه‌اندازی و زمان اجرا برای پشتوانه Claude CLI در [پشتوانه‌های CLI](/fa/gateway/cli-backends) آمده است.
    </Note>

    ### نمونه پیکربندی

    مرجع مدل استاندارد Anthropic را همراه با بازنویسی زمان اجرای CLI ترجیح دهید:

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

    مراجع مدل قدیمی `claude-cli/claude-opus-4-7` همچنان برای
    سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب provider/model را به صورت
    `anthropic/*` نگه دارد و پشتوانه اجرا را در `agentRuntime.id` قرار دهد.

    <Tip>
    اگر روشن‌ترین مسیر صورت‌حساب را می‌خواهید، به جای آن از یک کلید Anthropic API استفاده کنید. OpenClaw همچنین از گزینه‌های سبک اشتراک از [OpenAI Codex](/fa/providers/openai)، [Qwen Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [Z.AI / GLM](/fa/providers/glm) پشتیبانی می‌کند.
    </Tip>

  </Tab>
</Tabs>

## پیش‌فرض‌های تفکر (Claude 4.6)

مدل‌های Claude 4.6 در OpenClaw وقتی سطح تفکر صریحی تنظیم نشده باشد، به طور پیش‌فرض از تفکر `adaptive` استفاده می‌کنند.

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
- [تفکر گسترده](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## کش‌کردن پرامپت

OpenClaw از قابلیت کش‌کردن پرامپت Anthropic برای احراز هویت با کلید API پشتیبانی می‌کند.

| مقدار               | مدت کش | توضیح                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (پیش‌فرض) | ۵ دقیقه      | برای احراز هویت با کلید API به طور خودکار اعمال می‌شود |
| `"long"`            | ۱ ساعت         | کش گسترش‌یافته                         |
| `"none"`            | بدون کش     | کش‌کردن پرامپت را غیرفعال می‌کند                 |

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
    از پارامترهای سطح مدل به عنوان مبنای خود استفاده کنید، سپس عامل‌های مشخص را از طریق `agents.list[].params` بازنویسی کنید:

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
    2. `agents.list[].params` (`id` منطبق، بازنویسی بر اساس کلید)

    این امکان را می‌دهد که یک عامل کش بلندمدت را نگه دارد، در حالی که عامل دیگری روی همان مدل کش را برای ترافیک جهشی یا با استفاده دوباره کم غیرفعال کند.

  </Accordion>

  <Accordion title="نکته‌های Bedrock Claude">
    - مدل‌های Anthropic Claude روی Bedrock (`amazon-bedrock/*anthropic.claude*`) وقتی پیکربندی شده باشند، عبور مستقیم `cacheRetention` را می‌پذیرند.
    - مدل‌های غیر Anthropic در Bedrock در زمان اجرا به `cacheRetention: "none"` مجبور می‌شوند.
    - پیش‌فرض‌های هوشمند کلید API همچنین برای مراجع Claude-on-Bedrock وقتی مقدار صریحی تنظیم نشده باشد، `cacheRetention: "short"` را مقداردهی اولیه می‌کنند.

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
    - فقط برای درخواست‌های مستقیم `api.anthropic.com` تزریق می‌شود. مسیرهای پروکسی `service_tier` را دست‌نخورده می‌گذارند.
    - پارامترهای صریح `serviceTier` یا `service_tier` وقتی هر دو تنظیم شده باشند، `/fast` را بازنویسی می‌کنند.
    - در حساب‌های بدون ظرفیت Priority Tier، `service_tier: "auto"` ممکن است به `standard` منتهی شود.

    </Note>

  </Accordion>

  <Accordion title="درک رسانه (تصویر و PDF)">
    Plugin همراه Anthropic درک تصویر و PDF را ثبت می‌کند. OpenClaw
    قابلیت‌های رسانه را از احراز هویت پیکربندی‌شده Anthropic به طور خودکار حل می‌کند؛
    پیکربندی اضافه‌ای لازم نیست.

    | ویژگی        | مقدار                 |
    | --------------- | --------------------- |
    | مدل پیش‌فرض   | `claude-opus-4-7`     |
    | ورودی پشتیبانی‌شده | تصاویر، اسناد PDF |

    وقتی تصویر یا PDF به یک گفت‌وگو پیوست شود، OpenClaw آن را به طور خودکار
    از طریق فراهم‌کننده درک رسانه Anthropic مسیریابی می‌کند.

  </Accordion>

  <Accordion title="پنجره زمینه 1M (بتا)">
    پنجره زمینه 1M در Anthropic پشت دروازه بتا است. آن را برای هر مدل فعال کنید:

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

    `params.context1m: true` همچنین برای پشتوانه Claude CLI
    (`claude-cli/*`) در مدل‌های واجد شرایط Opus و Sonnet اعمال می‌شود و پنجره زمینه
    زمان اجرا را برای آن نشست‌های CLI گسترش می‌دهد تا با رفتار API مستقیم منطبق شود.

    <Warning>
    به دسترسی زمینه بلند روی اعتبارنامه Anthropic شما نیاز دارد. احراز هویت توکن قدیمی (`sk-ant-oat-*`) برای درخواست‌های زمینه 1M رد می‌شود — OpenClaw یک هشدار ثبت می‌کند و به پنجره زمینه استاندارد برمی‌گردد.
    </Warning>

  </Accordion>

  <Accordion title="زمینه 1M در Claude Opus 4.7">
    `anthropic/claude-opus-4.7` و نوع `claude-cli` آن به طور پیش‌فرض پنجره زمینه 1M
    دارند — نیازی به `params.context1m: true` نیست.
  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="خطاهای 401 / توکن ناگهان نامعتبر شد">
    احراز هویت توکن Anthropic منقضی می‌شود و می‌تواند باطل شود. برای راه‌اندازی‌های جدید، به جای آن از کلید Anthropic API استفاده کنید.
  </Accordion>

  <Accordion title='هیچ کلید API برای provider "anthropic" پیدا نشد'>
    احراز هویت Anthropic **برای هر عامل جداگانه** است — عامل‌های جدید کلیدهای عامل اصلی را به ارث نمی‌برند. راه‌اندازی اولیه را برای آن عامل دوباره اجرا کنید (یا یک کلید API را روی میزبان Gateway پیکربندی کنید)، سپس با `openclaw models status` بررسی کنید.
  </Accordion>

  <Accordion title='هیچ اعتبارنامه‌ای برای پروفایل "anthropic:default" پیدا نشد'>
    `openclaw models status` را اجرا کنید تا ببینید کدام پروفایل احراز هویت فعال است. راه‌اندازی اولیه را دوباره اجرا کنید، یا یک کلید API برای مسیر آن پروفایل پیکربندی کنید.
  </Accordion>

  <Accordion title="هیچ پروفایل احراز هویت در دسترسی نیست (همه در دوره cooldown هستند)">
    `openclaw models status --json` را برای `auth.unusableProfiles` بررسی کنید. دوره‌های cooldown محدودیت نرخ Anthropic می‌توانند محدود به مدل باشند، بنابراین یک مدل Anthropic هم‌خانواده ممکن است همچنان قابل استفاده باشد. یک پروفایل Anthropic دیگر اضافه کنید یا تا پایان cooldown صبر کنید.
  </Accordion>
</AccordionGroup>

<Note>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب فراهم‌کننده‌ها، مراجع مدل، و رفتار failover.
  </Card>
  <Card title="پشتوانه‌های CLI" href="/fa/gateway/cli-backends" icon="terminal">
    جزئیات راه‌اندازی و زمان اجرای پشتوانه Claude CLI.
  </Card>
  <Card title="کش‌کردن پرامپت" href="/fa/reference/prompt-caching" icon="database">
    نحوه کار کش‌کردن پرامپت در فراهم‌کننده‌ها.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده دوباره از اعتبارنامه.
  </Card>
</CardGroup>
