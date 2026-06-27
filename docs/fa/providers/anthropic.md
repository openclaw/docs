---
read_when:
    - می‌خواهید از مدل‌های Anthropic در OpenClaw استفاده کنید
summary: از Anthropic Claude از طریق کلیدهای API یا Claude CLI در OpenClaw استفاده کنید
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T18:35:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic خانواده مدل **Claude** را می‌سازد. OpenClaw از دو مسیر احراز هویت پشتیبانی می‌کند:

- **کلید API** — دسترسی مستقیم به API Anthropic با صورت‌حساب مبتنی بر مصرف (مدل‌های `anthropic/*`)
- **Claude CLI** — استفاده دوباره از ورود موجود Claude Code روی همان میزبان

<Warning>
بک‌اند Claude CLI در OpenClaw، Claude Code CLI نصب‌شده را در حالت چاپ غیرتعاملی اجرا می‌کند. مستندات فعلی Claude Code از Anthropic، `claude -p` را به‌عنوان استفاده Agent SDK/برنامه‌نویسی توصیف می‌کند. از ۱۵ ژوئن ۲۰۲۶، Anthropic می‌گوید استفاده از `claude -p` در پلن‌های اشتراکی دیگر از محدودیت‌های معمول پلن Claude کسر نمی‌شود؛ ابتدا از اعتبار ماهانه جداگانه Agent SDK کسر می‌شود و سپس، اگر اعتبارهای مصرف فعال باشند، با نرخ‌های استاندارد API از اعتبارهای مصرف کسر می‌شود.

Claude Code تعاملی همچنان از محدودیت‌های پلن Claude کاربر واردشده کسر می‌شود. احراز هویت با کلید API همچنان صورت‌حساب مستقیم API به‌صورت پرداخت به‌ازای مصرف دارد. برای میزبان‌های Gateway بلندمدت، خودکارسازی مشترک، و هزینه تولید قابل پیش‌بینی، از کلید API Anthropic استفاده کنید.

مستندات عمومی فعلی Anthropic:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [استفاده از Claude Agent SDK با پلن Claude خود](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [استفاده از Claude Code با پلن Pro یا Max خود](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [استفاده از Claude Code با پلن Team یا Enterprise خود](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [مدیریت هزینه‌های Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## شروع به کار

<Tabs>
  <Tab title="API key">
    **مناسب برای:** دسترسی استاندارد API و صورت‌حساب مبتنی بر مصرف.

    <Steps>
      <Step title="Get your API key">
        یک کلید API در [Anthropic Console](https://console.anthropic.com/) بسازید.
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        یا کلید را مستقیماً ارسال کنید:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### نمونه پیکربندی

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **مناسب برای:** استفاده دوباره از ورود موجود Claude CLI بدون کلید API جداگانه.

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        با این دستور بررسی کنید:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw اعتبارنامه‌های موجود Claude CLI را شناسایی و دوباره استفاده می‌کند.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    جزئیات راه‌اندازی و زمان اجرا برای بک‌اند Claude CLI در [بک‌اندهای CLI](/fa/gateway/cli-backends) آمده است.
    </Note>

    <Warning>
    استفاده دوباره از Claude CLI انتظار دارد فرایند OpenClaw روی همان میزبانی اجرا شود که ورود Claude CLI روی آن انجام شده است. نصب‌های Docker می‌توانند home کانتینر را پایدار نگه دارند و در همان‌جا به Claude Code وارد شوند؛ [بک‌اند Claude CLI در Docker](/fa/install/docker#claude-cli-backend-in-docker) را ببینید. نصب‌های کانتینری دیگر مانند [Podman](/fa/install/podman)، `~/.claude` میزبان را در راه‌اندازی یا زمان اجرا mount نمی‌کنند؛ در آنجا از کلید API Anthropic استفاده کنید، یا ارائه‌دهنده‌ای با OAuth مدیریت‌شده توسط OpenClaw مانند [OpenAI Codex](/fa/providers/openai) را انتخاب کنید.
    </Warning>

    ### نمونه پیکربندی

    مرجع مدل رسمی Anthropic را همراه با بازنویسی زمان اجرای CLI ترجیح دهید:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    مراجع مدل قدیمی `claude-cli/claude-opus-4-7` همچنان برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب ارائه‌دهنده/مدل را به‌صورت `anthropic/*` نگه دارد و بک‌اند اجرا را در سیاست زمان اجرای ارائه‌دهنده/مدل قرار دهد.

    ### صورت‌حساب و `claude -p`

    OpenClaw برای اجراهای Claude CLI از مسیر غیرتعاملی `claude -p` در Claude Code استفاده می‌کند. Anthropic در حال حاضر این مسیر را به‌عنوان استفاده Agent SDK/برنامه‌نویسی در نظر می‌گیرد:

    - تا ۱۵ ژوئن ۲۰۲۶، مدیریت پلن اشتراکی از قواعد فعال Claude Code در Anthropic برای حساب واردشده پیروی می‌کند.
    - از ۱۵ ژوئن ۲۰۲۶، استفاده از `claude -p` در پلن اشتراکی ابتدا از اعتبار ماهانه Agent SDK کاربر کسر می‌شود و سپس، اگر اعتبارهای مصرف فعال باشند، با نرخ‌های استاندارد API از اعتبارهای مصرف کسر می‌شود.
    - ورودهای Console/کلید API از صورت‌حساب API به‌صورت پرداخت به‌ازای مصرف استفاده می‌کنند و اعتبار اشتراکی Agent SDK را دریافت نمی‌کنند.

    Anthropic می‌تواند رفتار صورت‌حساب و محدودیت نرخ Claude Code را بدون انتشار OpenClaw تغییر دهد. وقتی پیش‌بینی‌پذیری صورت‌حساب اهمیت دارد، `claude auth status`، `/status`، و مستندات پیوندشده Anthropic را بررسی کنید.

    <Tip>
    برای خودکارسازی تولید مشترک، به‌جای Claude CLI از کلید API Anthropic استفاده کنید. OpenClaw همچنین از گزینه‌های سبک اشتراکی از [OpenAI Codex](/fa/providers/openai)، [Qwen Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [Z.AI / GLM](/fa/providers/zai) پشتیبانی می‌کند.
    </Tip>

  </Tab>
</Tabs>

## پیش‌فرض‌های تفکر (Claude Fable 5، 4.8، و 4.6)

`anthropic/claude-fable-5` همیشه از تفکر تطبیقی استفاده می‌کند و به‌صورت پیش‌فرض effort را روی `high` می‌گذارد. چون Anthropic اجازه غیرفعال کردن تفکر را برای این مدل نمی‌دهد، `/think off` و `/think minimal` از effort برابر با `low` استفاده می‌کنند. OpenClaw همچنین مقادیر سفارشی temperature را برای درخواست‌های Fable 5 حذف می‌کند.

Claude Opus 4.8 در OpenClaw به‌صورت پیش‌فرض تفکر را خاموش نگه می‌دارد. وقتی تفکر تطبیقی را صراحتاً با `/think high|xhigh|max` فعال کنید، OpenClaw مقادیر effort مربوط به Opus 4.8 در Anthropic را ارسال می‌کند؛ مدل‌های Claude 4.6 به‌صورت پیش‌فرض روی `adaptive` هستند.

برای هر پیام با `/think:<level>` یا در پارامترهای مدل بازنویسی کنید:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
مستندات مرتبط Anthropic:
- [تفکر تطبیقی](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [تفکر گسترده](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## کش کردن پرامپت

OpenClaw از قابلیت کش کردن پرامپت Anthropic برای احراز هویت با کلید API پشتیبانی می‌کند.

| مقدار               | مدت کش | توضیح                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (پیش‌فرض) | ۵ دقیقه      | به‌صورت خودکار برای احراز هویت با کلید API اعمال می‌شود |
| `"long"`            | ۱ ساعت         | کش گسترده                         |
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
  <Accordion title="Per-agent cache overrides">
    از پارامترهای سطح مدل به‌عنوان خط پایه استفاده کنید، سپس agentهای مشخص را از طریق `agents.list[].params` بازنویسی کنید:

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

    این اجازه می‌دهد یک agent کشی بلندمدت را نگه دارد، در حالی که agent دیگری روی همان مدل، کش را برای ترافیک انفجاری/کم‌استفاده‌مجدد غیرفعال می‌کند.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - مدل‌های Anthropic Claude روی Bedrock (`amazon-bedrock/*anthropic.claude*`) هنگام پیکربندی، عبور مستقیم `cacheRetention` را می‌پذیرند.
    - مدل‌های غیر Anthropic در Bedrock در زمان اجرا مجبور به `cacheRetention: "none"` می‌شوند.
    - پیش‌فرض‌های هوشمند کلید API همچنین برای مراجع Claude-on-Bedrock، وقتی مقدار صریحی تنظیم نشده باشد، `cacheRetention: "short"` را مقداردهی اولیه می‌کنند.

  </Accordion>
</AccordionGroup>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Fast mode">
    کلید مشترک `/fast` در OpenClaw از ترافیک مستقیم Anthropic (کلید API و OAuth به `api.anthropic.com`) پشتیبانی می‌کند.

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
    - در حساب‌هایی بدون ظرفیت Priority Tier، `service_tier: "auto"` ممکن است به `standard` تبدیل شود.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Plugin بسته‌بندی‌شده Anthropic، درک تصویر و PDF را ثبت می‌کند. OpenClaw قابلیت‌های رسانه را به‌صورت خودکار از احراز هویت Anthropic پیکربندی‌شده resolve می‌کند و به پیکربندی اضافی نیاز نیست.

    | ویژگی        | مقدار                 |
    | --------------- | --------------------- |
    | مدل پیش‌فرض   | `claude-opus-4-8`     |
    | ورودی پشتیبانی‌شده | تصاویر، سندهای PDF |

    وقتی تصویر یا PDF به یک گفت‌وگو پیوست شود، OpenClaw آن را به‌صورت خودکار از طریق ارائه‌دهنده درک رسانه Anthropic مسیریابی می‌کند.

  </Accordion>

  <Accordion title="1M context window">
    پنجره زمینه 1M در Anthropic روی مدل‌های Claude 4.x دارای قابلیت GA مانند Opus 4.8، Opus 4.7، Opus 4.6، و Sonnet 4.6 در دسترس است. OpenClaw اندازه این مدل‌ها را به‌صورت خودکار 1M تنظیم می‌کند:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    پیکربندی‌های قدیمی‌تر می‌توانند `params.context1m: true` را نگه دارند، اما OpenClaw دیگر header بتای بازنشسته `context-1m-2025-08-07` را ارسال نمی‌کند. ورودی‌های قدیمی‌تر `anthropicBeta` با آن مقدار هنگام resolve کردن header درخواست نادیده گرفته می‌شوند و مدل‌های قدیمی‌تر پشتیبانی‌نشده Claude روی پنجره زمینه معمول خود باقی می‌مانند.

    `params.context1m: true` همچنین برای بک‌اند Claude CLI (`claude-cli/*`) روی مدل‌های Opus و Sonnet واجد شرایط و دارای قابلیت GA اعمال می‌شود و پنجره زمینه زمان اجرا را برای آن نشست‌های CLI حفظ می‌کند تا با رفتار API مستقیم مطابقت داشته باشد.

    <Warning>
    به دسترسی زمینه بلند روی اعتبارنامه Anthropic شما نیاز دارد. احراز هویت OAuth/توکن اشتراک، headerهای بتای موردنیاز Anthropic را نگه می‌دارد، اما اگر header بتای بازنشسته 1M در پیکربندی قدیمی‌تر باقی مانده باشد، OpenClaw آن را حذف می‌کند.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M context">
    `anthropic/claude-opus-4-8` و variant آن با `claude-cli` به‌صورت پیش‌فرض پنجره زمینه 1M دارند و به `params.context1m: true` نیاز نیست.
  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    احراز هویت با توکن Anthropic منقضی می‌شود و می‌تواند لغو شود. برای راه‌اندازی‌های جدید، به‌جای آن از کلید API Anthropic استفاده کنید.
  </Accordion>

  <Accordion title='هیچ کلید API برای ارائه‌دهنده "anthropic" یافت نشد'>
    احراز هویت Anthropic **برای هر عامل جداگانه است** — عامل‌های جدید کلیدهای عامل اصلی را به ارث نمی‌برند. فرایند راه‌اندازی اولیه را برای آن عامل دوباره اجرا کنید (یا یک کلید API را روی میزبان Gateway پیکربندی کنید)، سپس با `openclaw models status` بررسی کنید.
  </Accordion>

  <Accordion title='هیچ اعتبارنامه‌ای برای نمایه "anthropic:default" یافت نشد'>
    `openclaw models status` را اجرا کنید تا ببینید کدام نمایه احراز هویت فعال است. فرایند راه‌اندازی اولیه را دوباره اجرا کنید، یا یک کلید API برای آن مسیر نمایه پیکربندی کنید.
  </Accordion>

  <Accordion title="هیچ نمایه احراز هویت در دسترسی نیست (همه در دوره انتظار هستند)">
    برای `auth.unusableProfiles`، `openclaw models status --json` را بررسی کنید. دوره‌های انتظار محدودیت نرخ Anthropic می‌توانند به مدل محدود باشند، بنابراین ممکن است یک مدل Anthropic هم‌خانواده همچنان قابل استفاده باشد. یک نمایه Anthropic دیگر اضافه کنید یا تا پایان دوره انتظار صبر کنید.
  </Accordion>
</AccordionGroup>

<Note>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل و رفتار انتقال هنگام خرابی.
  </Card>
  <Card title="پشتانه‌های CLI" href="/fa/gateway/cli-backends" icon="terminal">
    راه‌اندازی پشتانه Claude CLI و جزئیات زمان اجرا.
  </Card>
  <Card title="ذخیره‌سازی موقت پرامپت" href="/fa/reference/prompt-caching" icon="database">
    نحوه کار ذخیره‌سازی موقت پرامپت در میان ارائه‌دهنده‌ها.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده مجدد از اعتبارنامه‌ها.
  </Card>
</CardGroup>
