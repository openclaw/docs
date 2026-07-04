---
read_when:
    - می‌خواهید از مدل‌های Anthropic در OpenClaw استفاده کنید
summary: از Anthropic Claude از طریق کلیدهای API یا Claude CLI در OpenClaw استفاده کنید
title: Anthropic
x-i18n:
    generated_at: "2026-07-04T15:26:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e6fd143b85bb448f65d5d1b35ce465cce7c6f41987b39b9665910cf71761032
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic خانواده مدل‌های **Claude** را می‌سازد. OpenClaw از دو مسیر احراز هویت پشتیبانی می‌کند:

- **کلید API** — دسترسی مستقیم به API شرکت Anthropic با صورت‌حساب مبتنی بر میزان استفاده (مدل‌های `anthropic/*`)
- **Claude CLI** — استفاده دوباره از ورود موجود Claude Code روی همان میزبان

<Warning>
بک‌اند Claude CLI در OpenClaw، Claude Code CLI نصب‌شده را در حالت چاپ غیرتعاملی اجرا می‌کند. مستندات فعلی Claude Code شرکت Anthropic، `claude -p` را به‌عنوان استفاده Agent SDK/برنامه‌نویسی توصیف می‌کند. به‌روزرسانی پشتیبانی Anthropic در 15 ژوئن 2026، تغییر اعلام‌شده صورت‌حساب Agent SDK را متوقف کرد. فعلا Anthropic می‌گوید Claude Agent SDK، `claude -p`، و استفاده از برنامه‌های شخص ثالث همچنان از محدودیت‌های استفاده اشتراک کم می‌کنند. اعتبار ماهانه Agent SDK که قبلا اعلام شده بود، تا زمانی که Anthropic آن طرح را بازنگری می‌کند، در دسترس نیست.

Claude Code تعاملی همچنان از محدودیت‌های طرح Claude که با آن وارد شده‌اید کم می‌کند. احراز هویت با کلید API همچنان صورت‌حساب مستقیم API به‌صورت پرداخت به‌ازای مصرف دارد. برای میزبان‌های Gateway بلندمدت، خودکارسازی مشترک، و هزینه تولید قابل پیش‌بینی، از کلید API شرکت Anthropic استفاده کنید.

پیش از اتکا به رفتار صورت‌حساب اشتراک، مقاله‌های پشتیبانی فعلی Anthropic را بررسی کنید:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [استفاده از Claude Agent SDK با طرح Claude خود](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [استفاده از Claude Code با طرح Pro یا Max خود](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [استفاده از Claude Code با طرح Team یا Enterprise خود](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [مدیریت هزینه‌های Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## شروع کار

<Tabs>
  <Tab title="کلید API">
    **بهترین برای:** دسترسی استاندارد به API و صورت‌حساب مبتنی بر میزان استفاده.

    <Steps>
      <Step title="دریافت کلید API">
        یک کلید API در [کنسول Anthropic](https://console.anthropic.com/) بسازید.
      </Step>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        یا کلید را مستقیم ارسال کنید:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="بررسی در دسترس بودن مدل">
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
    **بهترین برای:** استفاده دوباره از ورود موجود Claude CLI بدون کلید API جداگانه.

    <Steps>
      <Step title="اطمینان از نصب بودن Claude CLI و ورود به آن">
        با این دستور بررسی کنید:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw اطلاعات ورود موجود Claude CLI را تشخیص می‌دهد و دوباره استفاده می‌کند.
      </Step>
      <Step title="بررسی در دسترس بودن مدل">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    جزئیات راه‌اندازی و اجرا برای بک‌اند Claude CLI در [بک‌اندهای CLI](/fa/gateway/cli-backends) آمده است.
    </Note>

    <Warning>
    استفاده دوباره از Claude CLI انتظار دارد فرایند OpenClaw روی همان میزبانی اجرا شود که ورود Claude CLI روی آن انجام شده است. نصب‌های Docker می‌توانند خانه کانتینر را پایدار نگه دارند و همان‌جا به Claude Code وارد شوند؛ [بک‌اند Claude CLI در Docker](/fa/install/docker#claude-cli-backend-in-docker) را ببینید. نصب‌های کانتینری دیگر مانند [Podman](/fa/install/podman)، `~/.claude` میزبان را در راه‌اندازی یا اجرا mount نمی‌کنند؛ در آنجا از کلید API شرکت Anthropic استفاده کنید، یا ارائه‌دهنده‌ای با OAuth مدیریت‌شده توسط OpenClaw مانند [OpenAI Codex](/fa/providers/openai) را انتخاب کنید.
    </Warning>

    ### نمونه پیکربندی

    مرجع مدل استاندارد Anthropic را همراه با بازنویسی runtime برای CLI ترجیح دهید:

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

    مراجع مدل قدیمی `claude-cli/claude-opus-4-7` هنوز برای سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب ارائه‌دهنده/مدل را به‌صورت `anthropic/*` نگه دارد و بک‌اند اجرا را در سیاست runtime ارائه‌دهنده/مدل قرار دهد.

    ### صورت‌حساب و `claude -p`

    OpenClaw برای اجراهای Claude CLI از مسیر غیرتعاملی `claude -p` در Claude Code استفاده می‌کند. Anthropic در حال حاضر آن مسیر را به‌عنوان استفاده Agent SDK/برنامه‌نویسی در نظر می‌گیرد:

    - به‌روزرسانی پشتیبانی Anthropic در 15 ژوئن 2026، طرح اعتبار جداگانه Agent SDK را که قبلا اعلام شده بود متوقف کرد.
    - فعلا Claude Agent SDK در طرح‌های اشتراکی، `claude -p`، و استفاده از برنامه‌های شخص ثالث همچنان از محدودیت‌های استفاده اشتراکی که با آن وارد شده‌اید کم می‌کنند.
    - اعتبار ماهانه Agent SDK که قبلا اعلام شده بود، تا زمانی که Anthropic آن طرح را بازنگری می‌کند، در دسترس نیست.
    - ورودهای Console/کلید API از صورت‌حساب API به‌صورت پرداخت به‌ازای مصرف استفاده می‌کنند و اعتبار Agent SDK اشتراک را دریافت نمی‌کنند.

    برای اطلاعیه توقف، مقاله [طرح Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) شرکت Anthropic را ببینید، و برای رفتار اشتراک، مقاله‌های طرح Claude Code برای [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) و [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan) را مطالعه کنید.

    Anthropic می‌تواند رفتار صورت‌حساب و محدودیت نرخ Claude Code را بدون انتشار نسخه جدید OpenClaw تغییر دهد. وقتی پیش‌بینی‌پذیری صورت‌حساب مهم است، `claude auth status`، `/status`، و مستندات پیوندشده Anthropic را بررسی کنید.

    <Tip>
    برای خودکارسازی تولیدی مشترک، به‌جای Claude CLI از کلید API شرکت Anthropic استفاده کنید. OpenClaw همچنین از گزینه‌های سبک اشتراکی از [OpenAI Codex](/fa/providers/openai)، [Qwen Cloud](/fa/providers/qwen)، [MiniMax](/fa/providers/minimax)، و [Z.AI / GLM](/fa/providers/zai) پشتیبانی می‌کند.
    </Tip>

  </Tab>
</Tabs>

## پیش‌فرض‌های تفکر (Claude Fable 5، 4.8، و 4.6)

`anthropic/claude-fable-5` همیشه از تفکر تطبیقی استفاده می‌کند و به‌صورت پیش‌فرض روی تلاش `high` قرار دارد. چون Anthropic اجازه نمی‌دهد تفکر برای این مدل غیرفعال شود، `/think off` و `/think minimal` از تلاش `low` استفاده می‌کنند. OpenClaw همچنین مقادیر سفارشی temperature را برای درخواست‌های Fable 5 حذف می‌کند.

Claude Opus 4.8 در OpenClaw به‌صورت پیش‌فرض تفکر را خاموش نگه می‌دارد. وقتی تفکر تطبیقی را با `/think high|xhigh|max` صراحتا فعال می‌کنید، OpenClaw مقادیر تلاش Opus 4.8 شرکت Anthropic را ارسال می‌کند؛ مدل‌های Claude 4.6 به‌صورت پیش‌فرض روی `adaptive` هستند.

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
- [تفکر توسعه‌یافته](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## fallback رد ایمنی (Claude Fable 5)

<Warning>
استفاده از Claude Fable 5 یعنی استفاده از Claude Opus 4.8 نیز. Fable 5 همراه با دسته‌بندهای ایمنی عرضه می‌شود که می‌توانند یک درخواست را رد کنند، و بازیابی مجاز Anthropic این است که `claude-opus-4-8` آن نوبت را پاسخ دهد. OpenClaw برای درخواست‌های مستقیم با کلید API، به‌صورت خودکار این را فعال می‌کند، بنابراین برخی نوبت‌های Fable به‌عنوان Claude Opus 4.8 پاسخ داده و صورت‌حساب می‌شوند. اگر سیاست یا بودجه شما نمی‌تواند نوبت‌هایی را که Opus پاسخ می‌دهد بپذیرد، `anthropic/claude-fable-5` را انتخاب نکنید.
</Warning>

### چرا این وجود دارد

دسته‌بندهای Fable 5 برای درخواست‌ها در دامنه‌های محدودشده، `stop_reason: "refusal"` برمی‌گردانند، و همچنین روی کارهای نزدیک به موارد بی‌خطر (ابزارهای امنیتی، علوم زیستی، یا حتی درخواست از مدل برای بازتولید استدلال خام خودش) مثبت کاذب می‌دهند. بدون fallback، نوبت با خطا از بین می‌رود، هرچند یک مدل Claude دیگر با میل آن را پاسخ می‌داد — پیام رد خود Anthropic به یکپارچه‌سازان API می‌گوید یک مدل fallback پیکربندی کنند.

### نحوه کار

1. برای هر درخواست مستقیم با کلید API به `anthropic/claude-fable-5`، OpenClaw opt-in fallback سمت سرور Anthropic را ارسال می‌کند: هدر بتای `server-side-fallback-2026-06-01` به‌همراه `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 تنها هدف fallback است که Anthropic برای Fable 5 اجازه می‌دهد.
2. فقط رد توسط دسته‌بند ایمنی fallback را فعال می‌کند. محدودیت‌های نرخ، بار بیش‌ازحد، و خطاهای سرور دقیقا مانند قبل رفتار می‌کنند و از [failover مدل](/fa/concepts/model-failover) عادی OpenClaw عبور می‌کنند.
3. نجات داخل همان فراخوانی رخ می‌دهد. رد پیش از هر خروجی، جز از نظر تاخیر، نامرئی است؛ کل پاسخ از Opus 4.8 می‌آید. در رد وسط جریان، متن جزئی به‌عنوان پیشوندی نگه داشته می‌شود که مدل fallback از آن ادامه می‌دهد، در حالی که استدلال و فراخوانی‌های ابزار مدل ردشده طبق قوانین بازپخش Anthropic دور ریخته می‌شوند (نباید دوباره بازتاب داده یا اجرا شوند).
4. اگر Claude Opus 4.8 هم رد کند، نوبت رد را به‌صورت خطا نشان می‌دهد، دقیقا مانند پیش از این قابلیت.

fallback در سطح API شرکت Anthropic رخ می‌دهد، بنابراین لازم نیست `claude-opus-4-8` در فهرست مدل‌های پیکربندی‌شده یا زنجیره fallback شما باشد — یک کلید API سازگار با Fable همیشه می‌تواند Opus را سرویس دهد.

### مشاهده‌پذیری و صورت‌حساب

- نوبتی که با fallback پاسخ داده شده است، یک diagnostic با نام `provider_fallback` روی پیام دستیار ثبت می‌کند که `fromModel` و `toModel` را نام می‌برد، و `responseModel` پیام، `claude-opus-4-8` را گزارش می‌کند.
- Anthropic به‌ازای هر تلاش صورت‌حساب می‌کند: رد پیش از خروجی رایگان است، و نجات با نرخ‌های Claude Opus 4.8 صورت‌حساب می‌شود (در حال حاضر نصف نرخ‌های Fable 5). برآورد هزینه هر نوبت OpenClaw، نوبت‌های پاسخ‌داده‌شده با fallback را با نرخ‌های Opus قیمت‌گذاری می‌کند تا همخوان باشد.
- رد وسط جریان، علاوه بر این، بخش جزئی Fable را که از قبل stream شده روی سمت Anthropic صورت‌حساب می‌کند؛ آن بخش در میزان استفاده هر تلاش API گزارش می‌شود اما در برآورد هر نوبت OpenClaw ادغام نمی‌شود.

### دامنه

برای `anthropic/claude-fable-5` با احراز هویت کلید API در برابر `api.anthropic.com` اعمال می‌شود. OAuth (استفاده دوباره از اشتراک Claude CLI)، URLهای پایه پروکسی، Bedrock، Vertex، و درخواست‌های Foundry بدون تغییر هستند و همچنان ردها را در آنجا به‌صورت خطا نشان می‌دهند.

راستی‌آزمایی زنده: یک prompt بی‌خطر که از Fable 5 می‌خواهد زنجیره تفکر خام خود را بازتولید کند، وقتی بدون fallback ارسال شود با `category: "reasoning_extraction"` رد می‌شود، و همان prompt از طریق OpenClaw یک پاسخ عادی سرویس‌شده توسط Opus با diagnostic پیوست‌شده `provider_fallback` برمی‌گرداند.

برای رفتار زیربنایی، [راهنمای ردها و fallback](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback) شرکت Anthropic را ببینید.

## cache کردن prompt

OpenClaw از قابلیت cache کردن prompt شرکت Anthropic برای احراز هویت با کلید API پشتیبانی می‌کند.

| مقدار               | مدت cache | توضیح                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (پیش‌فرض) | 5 دقیقه      | به‌صورت خودکار برای احراز هویت با کلید API اعمال می‌شود |
| `"long"`            | 1 ساعت         | cache توسعه‌یافته                         |
| `"none"`            | بدون cache     | غیرفعال کردن cache کردن prompt                 |

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
  <Accordion title="بازنویسی‌های cache برای هر عامل">
    از پارامترهای سطح مدل به‌عنوان مبنای خود استفاده کنید، سپس عامل‌های مشخص را از طریق `agents.list[].params` بازنویسی کنید:

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
    2. `agents.list[].params` (`id` مطابق، بازنویسی بر اساس کلید)

    این باعث می‌شود یک عامل یک کش بلندمدت نگه دارد، در حالی که عامل دیگری روی همان مدل، کش‌کردن را برای ترافیک جهشی/با استفادهٔ مجدد کم غیرفعال می‌کند.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - مدل‌های Anthropic Claude روی Bedrock (`amazon-bedrock/*anthropic.claude*`) وقتی پیکربندی شده باشند، عبور مستقیم `cacheRetention` را می‌پذیرند.
    - مدل‌های غیر Anthropic در Bedrock در زمان اجرا به `cacheRetention: "none"` اجبار می‌شوند.
    - پیش‌فرض‌های هوشمند کلید API نیز وقتی مقدار صریحی تنظیم نشده باشد، برای ارجاع‌های Claude-on-Bedrock مقدار `cacheRetention: "short"` را مقداردهی اولیه می‌کنند.

  </Accordion>
</AccordionGroup>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Fast mode">
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
    - در حساب‌هایی که ظرفیت Priority Tier ندارند، `service_tier: "auto"` ممکن است به `standard` تبدیل شود.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Plugin همراه Anthropic درک تصویر و PDF را ثبت می‌کند. OpenClaw
    قابلیت‌های رسانه را به‌طور خودکار از احراز هویت پیکربندی‌شدهٔ Anthropic حل می‌کند؛
    هیچ پیکربندی اضافه‌ای لازم نیست.

    | ویژگی        | مقدار                 |
    | --------------- | --------------------- |
    | مدل پیش‌فرض   | `claude-opus-4-8`     |
    | ورودی پشتیبانی‌شده | تصاویر، سندهای PDF |

    وقتی یک تصویر یا PDF به مکالمه پیوست می‌شود، OpenClaw به‌طور خودکار
    آن را از طریق ارائه‌دهندهٔ درک رسانهٔ Anthropic مسیریابی می‌کند.

  </Accordion>

  <Accordion title="1M context window">
    پنجرهٔ زمینهٔ 1M Anthropic روی مدل‌های Claude 4.x با قابلیت GA،
    مانند Opus 4.8، Opus 4.7، Opus 4.6 و Sonnet 4.6 در دسترس است. OpenClaw اندازهٔ آن مدل‌ها را
    به‌طور خودکار 1M تنظیم می‌کند:

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
    هدر بتای بازنشستهٔ `context-1m-2025-08-07` را ارسال نمی‌کند. ورودی‌های پیکربندی قدیمی‌تر `anthropicBeta`
    با آن مقدار هنگام حل هدر درخواست نادیده گرفته می‌شوند و
    مدل‌های قدیمی‌تر پشتیبانی‌نشدهٔ Claude روی پنجرهٔ زمینهٔ معمول خود باقی می‌مانند.

    `params.context1m: true` همچنین برای بک‌اند Claude CLI
    (`claude-cli/*`) روی مدل‌های واجد شرایط Opus و Sonnet با قابلیت GA اعمال می‌شود و
    پنجرهٔ زمینهٔ زمان اجرا را برای آن نشست‌های CLI حفظ می‌کند تا با رفتار API مستقیم
    هم‌خوان باشد.

    <Warning>
    به دسترسی زمینهٔ بلند روی اعتبارنامهٔ Anthropic شما نیاز دارد. احراز هویت با OAuth/توکن اشتراک هدرهای بتای Anthropic موردنیاز خود را نگه می‌دارد، اما اگر هدر بتای بازنشستهٔ 1M در پیکربندی قدیمی‌تر باقی مانده باشد، OpenClaw آن را حذف می‌کند.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M context">
    `anthropic/claude-opus-4-8` و گونهٔ `claude-cli` آن به‌طور پیش‌فرض یک پنجرهٔ زمینهٔ 1M دارند؛
    نیازی به `params.context1m: true` نیست.
  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    احراز هویت توکن Anthropic منقضی می‌شود و می‌تواند لغو شود. برای راه‌اندازی‌های جدید، به‌جای آن از یک کلید API متعلق به Anthropic استفاده کنید.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    احراز هویت Anthropic **برای هر عامل جداگانه** است؛ عامل‌های جدید کلیدهای عامل اصلی را به ارث نمی‌برند. راه‌اندازی اولیه را برای آن عامل دوباره اجرا کنید (یا یک کلید API روی میزبان Gateway پیکربندی کنید)، سپس با `openclaw models status` بررسی کنید.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    `openclaw models status` را اجرا کنید تا ببینید کدام نمایهٔ احراز هویت فعال است. راه‌اندازی اولیه را دوباره اجرا کنید، یا برای آن مسیر نمایه یک کلید API پیکربندی کنید.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    برای `auth.unusableProfiles` خروجی `openclaw models status --json` را بررسی کنید. دوره‌های انتظار محدودیت نرخ Anthropic می‌توانند در سطح مدل باشند، بنابراین یک مدل هم‌خانوادهٔ Anthropic ممکن است همچنان قابل استفاده باشد. یک نمایهٔ Anthropic دیگر اضافه کنید یا تا پایان دورهٔ انتظار صبر کنید.
  </Accordion>
</AccordionGroup>

<Note>
کمک بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="CLI backends" href="/fa/gateway/cli-backends" icon="terminal">
    راه‌اندازی بک‌اند Claude CLI و جزئیات زمان اجرا.
  </Card>
  <Card title="Prompt caching" href="/fa/reference/prompt-caching" icon="database">
    نحوهٔ کار کش‌کردن پرامپت در میان ارائه‌دهنده‌ها.
  </Card>
  <Card title="OAuth and auth" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفادهٔ مجدد از اعتبارنامه.
  </Card>
</CardGroup>
