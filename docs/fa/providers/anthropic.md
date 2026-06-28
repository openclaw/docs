---
read_when:
    - می‌خواهید از مدل‌های Anthropic در OpenClaw استفاده کنید
summary: در OpenClaw از Anthropic Claude از طریق کلیدهای API یا Claude CLI استفاده کنید
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:46:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic خانواده مدل **Claude** را می‌سازد. OpenClaw از دو مسیر احراز هویت پشتیبانی می‌کند:

- **کلید API** — دسترسی مستقیم به API شرکت Anthropic با صورت‌حساب مبتنی بر مصرف (مدل‌های `anthropic/*`)
- **Claude CLI** — استفاده دوباره از ورود موجود Claude Code روی همان میزبان

<Warning>
بک‌اند Claude CLI در OpenClaw، Claude Code CLI نصب‌شده را در حالت چاپ غیرتعاملی اجرا می‌کند. مستندات فعلی Claude Code از Anthropic، دستور `claude -p` را به‌عنوان استفاده Agent SDK/برنامه‌نویسی توصیف می‌کند. به‌روزرسانی پشتیبانی Anthropic در 15 ژوئن 2026 تغییر اعلام‌شده صورت‌حساب Agent SDK را متوقف کرد. فعلاً Anthropic می‌گوید استفاده از Claude Agent SDK، `claude -p` و برنامه‌های شخص ثالث همچنان از سقف‌های مصرف اشتراک کسر می‌شود. اعتبار ماهانه Agent SDK که قبلاً اعلام شده بود، تا زمانی که Anthropic این طرح را بازنگری می‌کند در دسترس نیست.

Claude Code تعاملی همچنان از سقف‌های طرح Claude واردشده کسر می‌شود. احراز هویت با کلید API همچنان صورت‌حساب مستقیم API به‌صورت پرداخت به‌ازای مصرف است. برای میزبان‌های Gateway بلندمدت، خودکارسازی مشترک، و هزینه تولید قابل پیش‌بینی، از کلید API شرکت Anthropic استفاده کنید.

پیش از تکیه بر رفتار صورت‌حساب اشتراک، مقاله‌های پشتیبانی فعلی Anthropic را بررسی کنید:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [استفاده از Claude Agent SDK با طرح Claude شما](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [استفاده از Claude Code با طرح Pro یا Max شما](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [استفاده از Claude Code با طرح Team یا Enterprise شما](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [مدیریت هزینه‌های Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## شروع کار

<Tabs>
  <Tab title="کلید API">
    **بهترین گزینه برای:** دسترسی استاندارد API و صورت‌حساب مبتنی بر مصرف.

    <Steps>
      <Step title="کلید API خود را دریافت کنید">
        در [کنسول Anthropic](https://console.anthropic.com/) یک کلید API بسازید.
      </Step>
      <Step title="onboarding را اجرا کنید">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        یا کلید را مستقیم وارد کنید:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="بررسی کنید مدل در دسترس است">
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
    **بهترین گزینه برای:** استفاده دوباره از ورود موجود Claude CLI بدون کلید API جداگانه.

    <Steps>
      <Step title="مطمئن شوید Claude CLI نصب شده و وارد حساب شده است">
        با این دستور بررسی کنید:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="onboarding را اجرا کنید">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw اعتبارنامه‌های موجود Claude CLI را شناسایی کرده و دوباره استفاده می‌کند.
      </Step>
      <Step title="بررسی کنید مدل در دسترس است">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    جزئیات راه‌اندازی و زمان اجرا برای بک‌اند Claude CLI در [بک‌اندهای CLI](/fa/gateway/cli-backends) آمده است.
    </Note>

    <Warning>
    استفاده دوباره از Claude CLI انتظار دارد فرایند OpenClaw روی همان میزبانی اجرا شود که ورود Claude CLI روی آن انجام شده است. نصب‌های Docker می‌توانند home کانتینر را پایدار نگه دارند و در همان‌جا وارد Claude Code شوند؛ [بک‌اند Claude CLI در Docker](/fa/install/docker#claude-cli-backend-in-docker) را ببینید. نصب‌های کانتینری دیگر مانند [Podman](/fa/install/podman)، مسیر `~/.claude` میزبان را در راه‌اندازی یا زمان اجرا mount نمی‌کنند؛ در آنجا از کلید API شرکت Anthropic استفاده کنید، یا ارائه‌دهنده‌ای با OAuth مدیریت‌شده توسط OpenClaw مانند [OpenAI Codex](/fa/providers/openai) را انتخاب کنید.
    </Warning>

    ### نمونه پیکربندی

    مرجع مدل canonical Anthropic به‌همراه بازنویسی زمان اجرای CLI را ترجیح دهید:

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

    مراجع مدل قدیمی `claude-cli/claude-opus-4-7` هنوز برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب ارائه‌دهنده/مدل را به‌صورت `anthropic/*` نگه دارد و بک‌اند اجرا را در سیاست زمان اجرای ارائه‌دهنده/مدل قرار دهد.

    ### صورت‌حساب و `claude -p`

    OpenClaw برای اجراهای Claude CLI از مسیر غیرتعاملی `claude -p` در Claude Code استفاده می‌کند. Anthropic در حال حاضر این مسیر را به‌عنوان استفاده Agent SDK/برنامه‌نویسی در نظر می‌گیرد:

    - به‌روزرسانی پشتیبانی Anthropic در 15 ژوئن 2026 طرح اعتبار جداگانه Agent SDK را که قبلاً اعلام شده بود متوقف کرد.
    - فعلاً استفاده از Claude Agent SDK در طرح اشتراک، `claude -p`، و برنامه‌های شخص ثالث همچنان از سقف‌های مصرف اشتراک واردشده کسر می‌شود.
    - اعتبار ماهانه Agent SDK که قبلاً اعلام شده بود، تا زمانی که Anthropic آن طرح را بازنگری می‌کند در دسترس نیست.
    - ورودهای Console/کلید API از صورت‌حساب API به‌صورت پرداخت به‌ازای مصرف استفاده می‌کنند و اعتبار Agent SDK اشتراک را دریافت نمی‌کنند.

    برای اطلاعیه توقف، مقاله [طرح Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) از Anthropic را ببینید، و برای رفتار اشتراک، مقاله‌های طرح Claude Code برای [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) و [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) را بررسی کنید.

    Anthropic می‌تواند رفتار صورت‌حساب و محدودیت نرخ Claude Code را بدون انتشار نسخه OpenClaw تغییر دهد. وقتی قابل پیش‌بینی بودن صورت‌حساب مهم است، `claude auth status`، `/status`، و مستندات پیوندشده Anthropic را بررسی کنید.

    <Tip>
    برای خودکارسازی تولید مشترک، به‌جای Claude CLI از کلید API شرکت Anthropic استفاده کنید. OpenClaw همچنین از گزینه‌های سبک اشتراکی از [OpenAI Codex](/fa/providers/openai)، [Qwen Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [Z.AI / GLM](/fa/providers/zai) پشتیبانی می‌کند.
    </Tip>

  </Tab>
</Tabs>

## پیش‌فرض‌های thinking (Claude Fable 5، 4.8، و 4.6)

`anthropic/claude-fable-5` همیشه از thinking تطبیقی استفاده می‌کند و به‌صورت پیش‌فرض effort آن `high` است. از آنجا که Anthropic اجازه نمی‌دهد thinking برای این مدل غیرفعال شود، `/think off` و `/think minimal` از effort با مقدار `low` استفاده می‌کنند. OpenClaw همچنین مقدارهای temperature سفارشی را برای درخواست‌های Fable 5 حذف می‌کند.

Claude Opus 4.8 در OpenClaw به‌طور پیش‌فرض تفکر را خاموش نگه می‌دارد. وقتی تفکر تطبیقی را صراحتاً با `/think high|xhigh|max` فعال کنید، OpenClaw مقادیر تلاش Opus 4.8 مربوط به Anthropic را ارسال می‌کند؛ مدل‌های Claude 4.6 به‌طور پیش‌فرض روی `adaptive` هستند.

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

## ذخیره‌سازی موقت Prompt

OpenClaw از قابلیت ذخیره‌سازی موقت Prompt در Anthropic برای احراز هویت با کلید API پشتیبانی می‌کند.

| مقدار               | مدت‌زمان cache | توضیح                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (پیش‌فرض) | ۵ دقیقه      | به‌طور خودکار برای احراز هویت با کلید API اعمال می‌شود |
| `"long"`            | ۱ ساعت         | cache گسترده                         |
| `"none"`            | بدون cache     | غیرفعال‌سازی ذخیره‌سازی موقت Prompt                 |

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
    از پارامترهای سطح مدل به‌عنوان خط مبنا استفاده کنید، سپس عامل‌های مشخص را از طریق `agents.list[].params` بازنویسی کنید:

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

    این امکان را می‌دهد که یک عامل cache با عمر طولانی را حفظ کند، در حالی که عامل دیگری روی همان مدل، cache را برای ترافیک جهشی/با استفاده مجدد کم غیرفعال می‌کند.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - مدل‌های Anthropic Claude روی Bedrock (`amazon-bedrock/*anthropic.claude*`) در صورت پیکربندی، عبور مستقیم `cacheRetention` را می‌پذیرند.
    - مدل‌های غیر Anthropic در Bedrock هنگام اجرا اجباراً روی `cacheRetention: "none"` قرار می‌گیرند.
    - پیش‌فرض‌های هوشمند کلید API همچنین برای ارجاع‌های Claude روی Bedrock، وقتی مقدار صریحی تنظیم نشده باشد، `cacheRetention: "short"` را مقداردهی اولیه می‌کنند.

  </Accordion>
</AccordionGroup>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Fast mode">
    کلید مشترک `/fast` در OpenClaw از ترافیک مستقیم Anthropic پشتیبانی می‌کند (کلید API و OAuth به `api.anthropic.com`).

    | دستور | نگاشت به |
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
    - فقط برای درخواست‌های مستقیم `api.anthropic.com` تزریق می‌شود. مسیرهای پراکسی `service_tier` را دست‌نخورده باقی می‌گذارند.
    - پارامترهای صریح `serviceTier` یا `service_tier` وقتی هر دو تنظیم شده باشند، `/fast` را بازنویسی می‌کنند.
    - در حساب‌هایی که ظرفیت Priority Tier ندارند، `service_tier: "auto"` ممکن است به `standard` حل شود.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Plugin همراه Anthropic، فهم تصویر و PDF را ثبت می‌کند. OpenClaw
    قابلیت‌های رسانه را به‌طور خودکار از احراز هویت Anthropic پیکربندی‌شده حل می‌کند؛
    به پیکربندی اضافی نیاز نیست.

    | ویژگی        | مقدار                 |
    | --------------- | --------------------- |
    | مدل پیش‌فرض   | `claude-opus-4-8`     |
    | ورودی پشتیبانی‌شده | تصاویر، اسناد PDF |

    وقتی تصویر یا PDF به یک گفتگو پیوست شود، OpenClaw به‌طور خودکار
    آن را از طریق ارائه‌دهنده فهم رسانه Anthropic مسیریابی می‌کند.

  </Accordion>

  <Accordion title="1M context window">
    پنجره context یک‌میلیونی Anthropic روی مدل‌های Claude 4.x دارای قابلیت GA
    مانند Opus 4.8، Opus 4.7، Opus 4.6 و Sonnet 4.6 در دسترس است. OpenClaw این مدل‌ها را
    به‌طور خودکار روی 1M اندازه‌گذاری می‌کند:

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

    پیکربندی‌های قدیمی‌تر می‌توانند `params.context1m: true` را نگه دارند، اما OpenClaw دیگر
    هدر بتای بازنشسته `context-1m-2025-08-07` را ارسال نمی‌کند. ورودی‌های پیکربندی قدیمی‌تر `anthropicBeta`
    با آن مقدار هنگام حل هدر درخواست نادیده گرفته می‌شوند و
    مدل‌های قدیمی‌تر Claude که پشتیبانی نمی‌شوند روی پنجره context عادی خود باقی می‌مانند.

    `params.context1m: true` همچنین برای بک‌اند Claude CLI
    (`claude-cli/*`) برای مدل‌های واجد شرایط Opus و Sonnet دارای قابلیت GA اعمال می‌شود و
    پنجره context زمان اجرا را برای آن نشست‌های CLI حفظ می‌کند تا با رفتار API مستقیم
    مطابقت داشته باشد.

    <Warning>
    به دسترسی context طولانی روی اعتبار Anthropic شما نیاز دارد. احراز هویت با توکن OAuth/اشتراک، هدرهای بتای Anthropic مورد نیاز خود را حفظ می‌کند، اما OpenClaw هدر بتای 1M بازنشسته را در صورت باقی‌ماندن در پیکربندی قدیمی‌تر حذف می‌کند.
    </Warning>

  </Accordion>

  <Accordion title="زمینه 1M Claude Opus 4.8">
    `anthropic/claude-opus-4-8` و گونه `claude-cli` آن به‌صورت پیش‌فرض یک پنجره
    زمینه 1M دارند — نیازی به `params.context1m: true` نیست.
  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="خطاهای 401 / توکن ناگهان نامعتبر شده است">
    احراز هویت توکن Anthropic منقضی می‌شود و می‌تواند لغو شود. برای راه‌اندازی‌های جدید، به‌جای آن از کلید API Anthropic استفاده کنید.
  </Accordion>

  <Accordion title='هیچ کلید API برای ارائه‌دهنده "anthropic" پیدا نشد'>
    احراز هویت Anthropic **به‌ازای هر عامل** است — عامل‌های جدید کلیدهای عامل اصلی را به ارث نمی‌برند. راه‌اندازی اولیه را برای آن عامل دوباره اجرا کنید (یا یک کلید API روی میزبان Gateway پیکربندی کنید)، سپس با `openclaw models status` بررسی کنید.
  </Accordion>

  <Accordion title='هیچ اعتبارنامه‌ای برای نمایه "anthropic:default" پیدا نشد'>
    `openclaw models status` را اجرا کنید تا ببینید کدام نمایه احراز هویت فعال است. راه‌اندازی اولیه را دوباره اجرا کنید، یا یک کلید API برای آن مسیر نمایه پیکربندی کنید.
  </Accordion>

  <Accordion title="هیچ نمایه احراز هویت در دسترسی نیست (همه در دوره انتظار هستند)">
    برای `auth.unusableProfiles`، `openclaw models status --json` را بررسی کنید. دوره‌های انتظار محدودیت نرخ Anthropic می‌توانند مختص مدل باشند، بنابراین ممکن است یک مدل هم‌خانواده Anthropic همچنان قابل استفاده باشد. یک نمایه Anthropic دیگر اضافه کنید یا منتظر پایان دوره انتظار بمانید.
  </Accordion>
</AccordionGroup>

<Note>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [سؤالات متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار جابه‌جایی هنگام خرابی.
  </Card>
  <Card title="بک‌اندهای CLI" href="/fa/gateway/cli-backends" icon="terminal">
    راه‌اندازی بک‌اند Claude CLI و جزئیات زمان اجرا.
  </Card>
  <Card title="کش‌کردن پرامپت" href="/fa/reference/prompt-caching" icon="database">
    نحوه کار کش‌کردن پرامپت در میان ارائه‌دهندگان.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده مجدد از اعتبارنامه.
  </Card>
</CardGroup>
