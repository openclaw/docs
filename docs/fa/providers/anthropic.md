---
read_when:
    - می‌خواهید از مدل‌های Anthropic در OpenClaw استفاده کنید
    - می‌خواهید نشست‌های Claude CLI یا Claude Desktop را در رایانه‌های جفت‌شده مرور کنید
summary: استفاده از Anthropic Claude از طریق کلیدهای API یا Claude CLI در OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-07-16T17:36:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a61b4585092586727df48f7b809be73d80b0a9f1400294e76aea1b48313a216
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic خانواده مدل **Claude** را می‌سازد. OpenClaw از دو مسیر احراز هویت پشتیبانی می‌کند:

- **کلید API** - دسترسی مستقیم به API شرکت Anthropic با صورت‌حساب مبتنی بر میزان استفاده (مدل‌های `anthropic/*`)
- **Claude CLI** - استفاده مجدد از ورود موجود Claude Code در همان میزبان

## ردیابی استفاده و هزینه

OpenClaw اعتبارنامه موجود Anthropic را شناسایی و نمای استفاده متناسب را انتخاب می‌کند:

- اعتبارنامه‌های اشتراک/راه‌اندازی Claude، بازه‌های سهمیه و بودجه اختیاری استفاده مازاد را نشان می‌دهند.
- `ANTHROPIC_ADMIN_KEY` یا `ANTHROPIC_ADMIN_API_KEY`، 30 روز هزینه سازمانی گزارش‌شده از سوی ارائه‌دهنده و میزان استفاده از Messages API را در بخش **استفاده** رابط کنترل نشان می‌دهد؛ از جمله هزینه روزانه، مجموع توکن/کش، مدل‌های برتر و دسته‌بندی‌های هزینه.
- اعتبارنامه `sk-ant-admin...` ذخیره‌شده در نمایه ارائه‌دهنده Anthropic به‌طور خودکار به‌عنوان کلید Admin API شناسایی می‌شود.

تاریخچه هزینه Admin API از [API استفاده و هزینه](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) شرکت Anthropic دریافت می‌شود. این هزینه واقعی صورت‌حساب ارائه‌دهنده است و از هزینه تخمینی OpenClaw که از نشست‌ها محاسبه می‌شود، جداست.

<Warning>
بخش پشتیبان Claude CLI در OpenClaw، رابط خط فرمان نصب‌شده Claude Code را در
حالت چاپ غیرتعاملی (`claude -p`) اجرا می‌کند. مستندات فعلی Claude Code شرکت Anthropic
این حالت را استفاده از Agent SDK/برنامه‌نویسی توصیف می‌کنند. به‌روزرسانی پشتیبانی Anthropic در 15 ژوئن 2026
تغییر اعلام‌شده برای صورت‌حساب جداگانه Agent SDK را متوقف کرد: استفاده از Claude
Agent SDK، `claude -p` و برنامه‌های شخص ثالث همچنان از محدودیت‌های استفاده
اشتراک واردشده کسر می‌شود و اعتبار ماهانه Agent SDK که پیش‌تر اعلام شده بود،
تا زمانی که Anthropic این طرح را بازنگری کند در دسترس نیست.

Claude Code تعاملی همچنان از محدودیت‌های طرح Claude واردشده استفاده می‌کند.
احراز هویت با کلید API مستقیماً بر اساس میزان مصرف صورت‌حساب می‌شود و به آن طرح وابسته نیست.
برای میزبان‌های Gateway با عمر طولانی، خودکارسازی مشترک و هزینه‌های تولیدی
قابل پیش‌بینی، از کلید API شرکت Anthropic استفاده کنید.

مقالات پشتیبانی فعلی Anthropic می‌توانند این رفتار را بدون انتشار نسخه‌ای از
OpenClaw تغییر دهند:

- [مرجع Claude Code CLI](https://code.claude.com/docs/en/cli-usage)
- [استفاده از Claude Agent SDK با طرح Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [استفاده از Claude Code با طرح Pro یا Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [استفاده از Claude Code با طرح Team یا Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [مدیریت هزینه‌های Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## شروع به کار

<Tabs>
  <Tab title="کلید API">
    **مناسب برای:** دسترسی استاندارد به API و صورت‌حساب مبتنی بر میزان استفاده.

    <Steps>
      <Step title="دریافت کلید API">
        یک کلید API در [کنسول Anthropic](https://console.anthropic.com/) ایجاد کنید.
      </Step>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard
        # انتخاب کنید: کلید API شرکت Anthropic
        ```

        یا کلید را مستقیماً ارسال کنید:

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
    **مناسب برای:** استفاده مجدد از ورود موجود Claude CLI بدون نیاز به کلید API جداگانه.

    <Steps>
      <Step title="اطمینان از نصب بودن Claude CLI و ورود به آن">
        با دستور زیر بررسی کنید:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard
        # انتخاب کنید: Claude CLI
        ```

        OpenClaw اعتبارنامه‌های موجود Claude CLI را شناسایی می‌کند و دوباره به‌کار می‌گیرد.
      </Step>
      <Step title="بررسی در دسترس بودن مدل">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    جزئیات راه‌اندازی و زمان اجرا برای بخش پشتیبان Claude CLI در [بخش‌های پشتیبان CLI](/fa/gateway/cli-backends) آمده است.
    </Note>

    <Warning>
    استفاده مجدد از Claude CLI مستلزم آن است که فرایند OpenClaw روی همان میزبانی اجرا شود که
    ورود Claude CLI در آن انجام شده است. نصب‌های Docker می‌توانند پوشه خانه کانتینر را پایدار نگه دارند و
    در همان‌جا وارد Claude Code شوند؛ به
    [بخش پشتیبان Claude CLI در Docker](/fa/install/docker#claude-cli-backend-in-docker)
    مراجعه کنید.
    سایر نصب‌های کانتینری مانند [Podman](/fa/install/podman)،
    `~/.claude` میزبان را در راه‌اندازی یا زمان اجرا متصل نمی‌کنند؛ در آن‌ها از کلید API شرکت Anthropic استفاده کنید یا
    ارائه‌دهنده‌ای با OAuth مدیریت‌شده توسط OpenClaw مانند
    [OpenAI Codex](/fa/providers/openai) را انتخاب کنید.
    </Warning>

    ### دریافت توکن راه‌اندازی

    دستور `claude setup-token` را روی هر دستگاهی که Claude Code در آن نصب است اجرا کنید. این دستور
    توکنی با عمر طولانی چاپ می‌کند که با `sk-ant-oat01-` آغاز می‌شود.

    هنگام راه‌اندازی اولیه، در برنامه macOS با انتخاب
    **Anthropic setup-token** در بخش **Connect with an API key or token** توکن را جای‌گذاری کنید، یا از دستور زیر استفاده کنید:

    ```bash
    openclaw models auth login --provider anthropic --method setup-token
    ```

    ### نمونه پیکربندی

    ارجاع متعارف مدل Anthropic را همراه با بازنویسی زمان اجرای CLI ترجیح دهید:

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

    ارجاع‌های قدیمی مدل `claude-cli/claude-opus-4-7` همچنان برای
    سازگاری کار می‌کنند، اما پیکربندی جدید باید انتخاب ارائه‌دهنده/مدل را به‌شکل
    `anthropic/*` نگه دارد و بخش پشتیبان اجرا را در سیاست زمان اجرای ارائه‌دهنده/مدل قرار دهد.

    ### صورت‌حساب و `claude -p`

    OpenClaw برای اجرای Claude CLI از مسیر غیرتعاملی `claude -p` در Claude Code
    استفاده می‌کند. Anthropic در حال حاضر این مسیر را استفاده از Agent SDK/برنامه‌نویسی در نظر می‌گیرد:

    - به‌روزرسانی پشتیبانی Anthropic در 15 ژوئن 2026، طرح اعتبار جداگانه Agent SDK را که پیش‌تر اعلام شده بود
      متوقف کرد.
    - استفاده از Claude Agent SDK، `claude -p` و برنامه‌های شخص ثالث در طرح اشتراکی
      همچنان از محدودیت‌های استفاده اشتراک واردشده کسر می‌شود.
    - اعتبار ماهانه Agent SDK که پیش‌تر اعلام شده بود، تا زمانی که
      Anthropic این طرح را بازنگری کند در دسترس نیست.
    - ورودهای Console/کلید API از صورت‌حساب API مبتنی بر میزان مصرف استفاده می‌کنند و
      اعتبار Agent SDK اشتراک را دریافت نمی‌کنند.

    برای اطلاعیه توقف، به [مقاله طرح Agent SDK
    شرکت Anthropic](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    و برای رفتار اشتراک Claude Code به مقالات طرح
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    و
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    مراجعه کنید.

    Anthropic می‌تواند رفتار صورت‌حساب و محدودیت نرخ Claude Code را بدون
    انتشار نسخه‌ای از OpenClaw تغییر دهد. هنگامی که پیش‌بینی‌پذیری صورت‌حساب اهمیت دارد،
    `claude auth status`، `/status` و مستندات پیوندشده Anthropic را بررسی کنید.

    <Tip>
    برای خودکارسازی مشترک در محیط تولید، به‌جای
    Claude CLI از کلید API شرکت Anthropic استفاده کنید. OpenClaw همچنین از گزینه‌های اشتراک‌محور
    [OpenAI Codex](/fa/providers/openai)، [Qwen Cloud](/fa/providers/qwen)،
    [MiniMax](/fa/providers/minimax) و [Z.AI / GLM](/fa/providers/zai) پشتیبانی می‌کند.
    </Tip>

  </Tab>
</Tabs>

## نشست‌های Claude در رایانه‌های مختلف

Plugin همراه Anthropic، گروهی با عنوان **Claude Code** به نوار کناری معمول نشست‌ها
اضافه می‌کند. ردیف‌ها در پنل معمول گفتگو باز می‌شوند. این Plugin نشست‌های بایگانی‌نشده Claude
Code را در Gateway و میزبان‌های Node متصل کشف می‌کند:

- نشست‌های Claude CLI از رکوردهای معتبر نمایه پروژه و فایل‌های JSONL فعلی
  به‌دست می‌آیند که پیشوند محدود فراداده آن‌ها یک نشست غیرزنجیره‌جانبی `sdk-cli`
  را در مسیر `~/.claude/projects/` شناسایی می‌کند.
- نشست‌های Claude Desktop زمانی از عنوان Desktop، زمان فعالیت و
  وضعیت بایگانی استفاده می‌کنند که فراداده آن به همان شناسه نشست Claude Code اشاره کند.
- یک نشست فقط-CLI پرچم بایگانی ندارد، بنابراین تا زمانی که
  رونوشت آن موجود باشد، قابل مشاهده می‌ماند.

برای کشف، پیکربندی اضافی OpenClaw لازم نیست. Plugin شرکت Anthropic
همراه محصول است و به‌طور پیش‌فرض فعال می‌شود؛ یک Node بومی macOS هنگامی که پوشه محلی
`~/.claude/projects/` وجود داشته باشد، فرمان‌های فقط‌خواندنی نشست Claude را اعلام می‌کند.
هنگامی که این فرمان‌ها برای نخستین بار ظاهر شدند، ارتقای جفت‌سازی Node را تأیید کنید.

نوار کناری ردیف‌ها را بر اساس میزبان Gateway یا Node جفت‌شده گروه‌بندی می‌کند، با
جدیدترین صفحه محدود از هر میزبان آغاز می‌شود و طبق چرخه معمول 30 ثانیه‌ای
تازه‌سازی می‌شود. برای افزودن صفحه بعدی از هر میزبانی که تاریخچه بیشتری دارد، از **بارگیری نشست‌های بیشتر**
در زیر یک گروه کاتالوگ استفاده کنید؛ ردیف‌های افزوده‌شده قابل مشاهده می‌مانند و
در تازه‌سازی‌ها با همان عمق دوباره دریافت می‌شوند. کلاینت‌های کاتالوگ از
`sessions.catalog.list` استفاده می‌کنند؛ باز کردن یک ردیف از `sessions.catalog.read` استفاده می‌کند.

در اختیار گرفتن ترمینال، `claude` را ابتدا از PATH پوسته ورود کاربر میزبان مالک
و سپس از PATH سرویس/دیمن پیدا می‌کند. این کار نشست‌های اجراشده از برنامه را با
Claude CLI که اپراتور در یک ترمینال معمولی در اختیار دارد هم‌راستا نگه می‌دارد.

با انتخاب یک ردیف، ابتدا جدیدترین صفحه رونوشت خوانده می‌شود. **بارگیری موارد قدیمی‌تر رونوشت**
یک مکان‌نمای بایت مات را دنبال می‌کند و به‌جای بارگیری کل تاریخچه، بخش محدود دیگری را از
فایل JSONL می‌خواند. محتوای معمول کاربر، دستیار،
استدلال، فراخوانی ابزار و نتیجه ابزار حفظ می‌شود. هر مورد منفردی
که از سقف ایمنی Node/Gateway بزرگ‌تر باشد، به‌وضوح به‌عنوان کوتاه‌شده علامت‌گذاری می‌شود.

برای یک ردیف محلی Gateway با مقدار `claude-cli`، تایپ در کادر نگارش معمول
تابع `sessions.catalog.continue` را فراخوانی می‌کند. OpenClaw رکورد کاتالوگ محلی را دوباره پیدا می‌کند،
یک نشست بومی قفل‌شده به مدل ایجاد می‌کند یا دوباره به‌کار می‌گیرد، حداکثر 200 مورد قابل مشاهده
یا 512 KiB را وارد می‌کند و اتصال Claude CLI را مقداردهی اولیه می‌کند. نوبت نخست با
`--fork-session` ادامه می‌یابد؛ Claude به انشعاب یک شناسه نشست جدید اختصاص می‌دهد، بنابراین نوبت‌های بعدی از
انشعاب استفاده می‌کنند و نشست مبدأ دست‌نخورده باقی می‌ماند.

یک میزبان Node بدون رابط نیز می‌تواند با فعال‌کردن
تنظیم محلی Node در زیر و راه‌اندازی مجدد میزبان Node، ردیف‌های Claude CLI خود را قابل ادامه کند:

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node فقط زمانی `agent.cli.claude.run.v1` را اعلام می‌کند که تنظیم فعال باشد
و فایل اجرایی محلی `claude` آن پیدا شود. OpenClaw رکورد کاتالوگ را
در آن Node دوباره پیدا می‌کند، همان تاریخچه محدود را وارد می‌کند و نشست پذیرفته‌شده را
به Node و پوشه کاری گزارش‌شده توسط کاتالوگ متصل می‌کند. هر نوبت، فرایند واقعی
`claude -p` در Node را با استفاده از فایل‌های Claude و ورود همان Node اجرا می‌کند. سیاست
تأیید اجرای Node همچنان اعمال می‌شود؛ Gateway نمی‌تواند این فعال‌سازی اختیاری را تحمیل کند.

نسخه 1 ادامه نشست Node فقط یک‌بار اجرا می‌شود. این نسخه پیکربندی MCP بازگشتی Gateway و
آرگومان‌های Plugin مهارت‌های Gateway را حذف می‌کند، از رونوشت Gateway دوباره مقداردهی اولیه نمی‌شود و
پیوست‌ها و تصاویر را رد می‌کند. ردیف‌های Claude Desktop فقط قابل مشاهده باقی می‌مانند. Nodeهای بومی
برنامه macOS نیز تا زمانی که برنامه فرمان اجرا را اعلام نکند، فقط قابل مشاهده باقی می‌مانند.

<Note>
نشست‌های Claude در Node جفت‌شده فقط‌خواندنی باقی می‌مانند، مگر اینکه Node بدون رابط به‌طور صریح
`agent.cli.claude.run.v1` را اعلام کند. OpenClaw هرگز فراداده Claude Desktop را
تغییر نمی‌دهد و نشست‌های Claude را بایگانی نمی‌کند. این صفحه به اتصال اپراتور
با دامنه نوشتن نیاز دارد، زیرا از `node.invoke` احرازشده استفاده می‌کند؛ فهرست‌کردن و خواندن
حتی در Node دارای قابلیت ادامه نیز فقط‌خواندنی باقی می‌مانند.
</Note>

برای فرمان Node و مرز امنیتی به [Nodeها: نشست‌ها و رونوشت‌های Claude](/fa/nodes#claude-sessions-and-transcripts)
مراجعه کنید.

## پیش‌فرض‌های تفکر (Claude Sonnet 5، Mythos 5، Fable 5، 4.8 و 4.6)

`anthropic/claude-sonnet-5` به‌طور پیش‌فرض از تفکر تطبیقی با سطح تلاش `high` استفاده می‌کند.
برای غیرفعال‌کردن تفکر از `/think off`، یا برای سطوح بالاتر تلاش بومی مدل از
`/think xhigh|max` استفاده کنید. OpenClaw بودجه‌های دستی تفکر، پارامترهای سفارشی
نمونه‌برداری، پیش‌پرکردن‌های دستیار و Priority Tier را برای Sonnet 5 حذف می‌کند، زیرا
Anthropic از این قابلیت‌های درخواست در این مدل پشتیبانی نمی‌کند.
کاتالوگ تا 31 اوت 2026 از قیمت‌گذاری مقدماتی ورودی/خروجی `$2/$10` متعلق به Anthropic استفاده می‌کند؛
قیمت‌گذاری استاندارد `$3/$15` از 1 سپتامبر 2026 آغاز می‌شود.

`anthropic/claude-fable-5` همیشه از تفکر تطبیقی استفاده می‌کند و سطح تلاش پیش‌فرض آن `high`
است. Anthropic اجازه نمی‌دهد تفکر برای این مدل غیرفعال شود، بنابراین
`/think off` و `/think minimal` در عوض به سطح تلاش `low` نگاشت می‌شوند. OpenClaw همچنین
مقادیر سفارشی دما را از درخواست‌های Fable 5 حذف می‌کند، زیرا Anthropic
بازنویسی دما را در هر درخواست دارای تفکر رد می‌کند.

`anthropic/claude-mythos-5` مدلی با دسترسی محدود و همان قرارداد
تفکر تطبیقیِ همیشه‌فعال است. پیش‌فرض OpenClaw برابر `high` است، `/think off` و
`/think minimal` را به `low` نگاشت می‌کند و پارامترهای نمونه‌برداری انتخاب‌شده توسط فراخواننده را حذف می‌کند.
کاتالوگ پنجره زمینه 1,000,000 توکنی، محدودیت خروجی
128,000 توکنی، ورودی تصویر و قیمت‌گذاری ورودی/خروجی `$10/$50` آن را منتشر می‌کند.

تفکر در Claude Opus 4.8 به‌طور پیش‌فرض در OpenClaw غیرفعال می‌ماند. وقتی تفکر تطبیقی را صراحتاً
با `/think high|xhigh|max` فعال می‌کنید، OpenClaw مقادیر تلاش Opus 4.8 متعلق به
Anthropic را ارسال می‌کند؛ مقدار پیش‌فرض مدل‌های Claude 4.6‏ (Opus 4.6 و Sonnet 4.6)
برابر `adaptive` است.

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

## بازگشت جایگزین هنگام امتناع ایمنی (Claude Fable 5)

<Warning>
استفاده از Claude Fable 5 به‌معنای استفاده از Claude Opus 4.8 نیز هست. Fable 5 همراه با
دسته‌بندهای ایمنی عرضه می‌شود که ممکن است درخواستی را نپذیرند، و روش بازیابی مورد تأیید Anthropic
این است که `claude-opus-4-8` آن نوبت را پاسخ دهد. OpenClaw برای درخواست‌های مستقیم با کلید API
به‌طور خودکار این قابلیت را فعال می‌کند، بنابراین برخی نوبت‌های Fable توسط Claude Opus 4.8 پاسخ داده
و صورتحساب آن‌ها نیز بر همین اساس محاسبه می‌شود. اگر خط‌مشی یا بودجه شما پذیرای نوبت‌های
پاسخ‌داده‌شده توسط Opus نیست، `anthropic/claude-fable-5` را انتخاب نکنید.
</Warning>

### دلیل وجود این قابلیت

دسته‌بندهای Fable 5 برای درخواست‌های حوزه‌های محدودشده `stop_reason: "refusal"` را برمی‌گردانند
و در کارهای بی‌خطری که به این حوزه‌ها نزدیک‌اند نیز مثبت کاذب می‌دهند (ابزارهای
امنیتی، علوم زیستی یا حتی درخواست از مدل برای بازتولید استدلال خام خود).
بدون مدل جایگزین، نوبت با خطا خاتمه می‌یابد، با اینکه مدل دیگری از Claude با رضایت
آن را پاسخ می‌دهد؛ پیام امتناع خود Anthropic به یکپارچه‌سازهای API می‌گوید
یک مدل جایگزین پیکربندی کنند.

### نحوه کار

1. برای هر درخواست مستقیم با کلید API به `anthropic/claude-fable-5`، OpenClaw
   اعلام پذیرش بازگشت جایگزین سمت سرور Anthropic را ارسال می‌کند:
   هدر بتای `server-side-fallback-2026-06-01` به‌همراه
   `fallbacks: [{"model": "claude-opus-4-8"}]`. Claude Opus 4.8 تنها
   مقصد جایگزینی است که Anthropic برای Fable 5 مجاز می‌داند.
2. فقط عدم پذیرش توسط دسته‌بند ایمنی، بازگشت جایگزین را فعال می‌کند. محدودیت‌های نرخ،
   اضافه‌بار و خطاهای سرور دقیقاً مانند قبل عمل می‌کنند و از
   [جابه‌جایی خودکار مدل](/fa/concepts/model-failover) معمول OpenClaw عبور می‌کنند.
3. بازیابی درون همان فراخوانی انجام می‌شود. عدم پذیرش پیش از هرگونه خروجی،
   به‌جز تأخیر، نامرئی است؛ کل پاسخ از Opus 4.8 می‌آید. در صورت عدم پذیرش
   میان جریان، متن جزئی به‌عنوان پیشوندی که مدل جایگزین از آن ادامه می‌دهد حفظ می‌شود،
   درحالی‌که استدلال و فراخوانی‌های ابزار مدلِ ردکننده طبق قواعد بازپخش Anthropic
   کنار گذاشته می‌شوند (نباید بازتاب داده یا اجرا شوند).
4. اگر Claude Opus 4.8 نیز درخواست را نپذیرد، نوبت امتناع را مانند
   پیش از این قابلیت، به‌صورت خطا نمایش می‌دهد.

بازگشت جایگزین در سطح API Anthropic انجام می‌شود، بنابراین لازم نیست `claude-opus-4-8`
در فهرست مدل‌های پیکربندی‌شده یا زنجیره جایگزین شما باشد؛ یک کلید API دارای قابلیت Fable
همیشه می‌تواند Opus را ارائه کند.

### مشاهده‌پذیری و صورتحساب

- نوبتی که مدل جایگزین پاسخ داده است، یک عیب‌یابی `provider_fallback` روی پیام
  دستیار ثبت می‌کند که `fromModel` و `toModel` را نام می‌برد، و
  `responseModel` پیام، `claude-opus-4-8` را گزارش می‌کند.
- Anthropic به‌ازای هر تلاش صورتحساب صادر می‌کند: عدم پذیرش پیش از خروجی رایگان است و بازیابی
  با نرخ‌های Claude Opus 4.8 محاسبه می‌شود (درحال‌حاضر نصف نرخ‌های Fable 5). برآورد
  هزینه هر نوبت OpenClaw برای تطابق، نوبت‌های پاسخ‌داده‌شده توسط مدل جایگزین را با نرخ‌های Opus محاسبه می‌کند.
- عدم پذیرش میان جریان علاوه بر این باعث می‌شود Anthropic برای بخش جزئی Fable که از قبل
  پخش شده است صورتحساب صادر کند؛ آن بخش در میزان مصرف هر تلاش API گزارش می‌شود،
  اما در برآورد هر نوبت OpenClaw منظور نمی‌شود.

### دامنه

برای `anthropic/claude-fable-5` با احراز هویت کلید API در برابر
`api.anthropic.com` اعمال می‌شود. OAuth (استفاده مجدد از اشتراک Claude CLI)، نشانی‌های پایه پراکسی،
درخواست‌های Bedrock، Vertex و Foundry تغییری نمی‌کنند و همچنان
امتناع‌ها را در آنجا به‌صورت خطا نمایش می‌دهند.

تأیید زنده: یک درخواست بی‌خطر که از Fable 5 می‌خواهد زنجیره خام
تفکر خود را بازتولید کند، هنگام ارسال بدون مدل‌های جایگزین با `category: "reasoning_extraction"`
رد می‌شود، و همان درخواست از طریق OpenClaw یک پاسخ عادی ارائه‌شده توسط Opus
را با عیب‌یابی `provider_fallback` پیوست‌شده برمی‌گرداند.

برای رفتار زیربنایی، [راهنمای امتناع‌ها و مدل جایگزین
Anthropic](https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback)
را ببینید.

## ذخیره‌سازی موقت پرامپت

OpenClaw از قابلیت ذخیره‌سازی موقت پرامپت Anthropic برای احراز هویت کلید API پشتیبانی می‌کند.

| مقدار               | مدت ذخیره موقت | توضیحات                            |
| ------------------- | -------------- | -------------------------------------- |
| `"short"` (پیش‌فرض) | 5 دقیقه      | به‌طور خودکار برای احراز هویت کلید API اعمال می‌شود |
| `"long"`            | 1 ساعت         | ذخیره موقت طولانی‌مدت                         |
| `"none"`            | بدون ذخیره موقت     | غیرفعال‌کردن ذخیره‌سازی موقت پرامپت                 |

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
  <Accordion title="بازنویسی‌های ذخیره موقت برای هر عامل">
    پارامترهای سطح مدل را به‌عنوان مبنا استفاده کنید، سپس عامل‌های مشخص را از طریق `agents.list[].params` بازنویسی کنید:

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

    این امکان را فراهم می‌کند که یک عامل، حافظهٔ نهان بلندمدتی را حفظ کند، درحالی‌که عامل دیگری روی همان مدل، ذخیره‌سازی در حافظهٔ نهان را برای ترافیک مقطعی/با استفادهٔ مجدد کم غیرفعال می‌کند.

  </Accordion>

  <Accordion title="نکات Claude در Bedrock">
    - مدل‌های Anthropic Claude در Bedrock (`amazon-bedrock/*anthropic.claude*`) در صورت پیکربندی، انتقال مستقیم `cacheRetention` را می‌پذیرند.
    - مدل‌های غیر Anthropic در Bedrock هنگام اجرا به‌اجبار روی `cacheRetention: "none"` تنظیم می‌شوند.
    - پیش‌فرض‌های هوشمند کلید API نیز برای ارجاع‌های Claude در Bedrock، در صورت نبود مقدار صریح، `cacheRetention: "short"` را مقداردهی اولیه می‌کنند.

  </Accordion>
</AccordionGroup>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="حالت سریع">
    کلید مشترک `/fast` در OpenClaw، فیلد `service_tier` متعلق به Anthropic را برای ترافیک مستقیم با کلید API روی `api.anthropic.com` تنظیم می‌کند.

    | فرمان | نگاشت به |
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
    - فقط برای درخواست‌های مستقیم `api.anthropic.com` که با کلید API ارسال می‌شوند اعمال می‌شود. درخواست‌های OAuth/توکن اشتراک و مسیرهای پراکسی هرگز فیلد `service_tier` دریافت نمی‌کنند.
    - اگر هر دو تنظیم شده باشند، پارامترهای صریح `serviceTier` یا `service_tier` بر `/fast` اولویت دارند.
    - در حساب‌هایی که ظرفیت Priority Tier ندارند، ممکن است `service_tier: "auto"` به `standard` تبدیل شود.

    </Note>

  </Accordion>

  <Accordion title="درک رسانه (تصویر و PDF)">
    Plugin همراه Anthropic قابلیت درک تصویر و PDF را ثبت می‌کند. OpenClaw
    قابلیت‌های رسانه‌ای را به‌طور خودکار از احراز هویت پیکربندی‌شدهٔ Anthropic
    تشخیص می‌دهد؛ نیازی به پیکربندی اضافی نیست.

    | ویژگی           | مقدار                  |
    | --------------- | --------------------- |
    | مدل پیش‌فرض     | `claude-opus-4-8`     |
    | ورودی پشتیبانی‌شده | تصاویر، اسناد PDF |

    هنگامی که تصویر یا PDF به مکالمه‌ای پیوست شود، OpenClaw آن را به‌طور خودکار
    از طریق ارائه‌دهندهٔ درک رسانهٔ Anthropic مسیریابی می‌کند.

  </Accordion>

  <Accordion title="پنجرهٔ زمینهٔ 1M">
    Claude Sonnet 5، Mythos 5 و Fable 5 دارای پنجرهٔ ورودی دقیقاً 1,000,000 توکنی
    هستند و تا 128,000 توکن خروجی را پشتیبانی می‌کنند. پنجرهٔ زمینهٔ 1M متعلق به Anthropic
    برای مدل‌های Claude 4.x با تفکر تطبیقی نیز به‌طور عمومی در دسترس است: Opus 4.8،
    Opus 4.7، Opus 4.6 و Sonnet 4.6. OpenClaw اندازهٔ این مدل‌ها را
    به‌طور خودکار تعیین می‌کند و نیازی به `params.context1m` نیست:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-5": {},
            "anthropic/claude-mythos-5": {},
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    پیکربندی‌های قدیمی‌تر می‌توانند `params.context1m: true` را حفظ کنند؛ این مقدار برای
    این مدل‌ها عملیاتی بی‌اثر و بی‌ضرر است و OpenClaw دیگر در هیچ شرایطی سرآیند بتای
    منسوخ‌شدهٔ `context-1m-2025-08-07` را ارسال نمی‌کند. ورودی‌های قدیمی‌تر پیکربندی `anthropicBeta`
    با آن مقدار هنگام تعیین سرآیندهای درخواست حذف می‌شوند و مدل‌های قدیمی‌تر Claude که
    پشتیبانی نمی‌شوند، پنجرهٔ زمینهٔ عادی خود را حفظ می‌کنند.

    `params.context1m: true` برای بک‌اند CLI مدل Claude
    (`claude-cli/*`) نیز به همین شکل عمل می‌کند: مدل‌های واجد شرایط Opus و Sonnet که قابلیت
    دسترسی عمومی را دارند، از پیش پنجرهٔ 1M را به‌طور خودکار دریافت می‌کنند؛ بنابراین این پارامتر در آنجا نیز اختیاری است.

    <Warning>
    به دسترسی زمینهٔ طولانی در اعتبارنامهٔ Anthropic نیاز دارد. احراز هویت با OAuth/توکن اشتراک، سرآیندهای بتای الزامی Anthropic را حفظ می‌کند، اما اگر سرآیند بتای منسوخ‌شدهٔ 1M در پیکربندی قدیمی باقی مانده باشد، OpenClaw آن را حذف می‌کند.
    </Warning>

  </Accordion>

  <Accordion title="زمینهٔ 1M در Claude Opus 4.8">
    `anthropic/claude-opus-4-8` و گونهٔ `claude-cli` آن به‌طور پیش‌فرض پنجرهٔ زمینهٔ
    1M دارند و نیازی به `params.context1m: true` نیست.
  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="خطاهای 401 / نامعتبر شدن ناگهانی توکن">
    احراز هویت توکنی Anthropic منقضی می‌شود و ممکن است لغو شود. برای راه‌اندازی‌های جدید، به‌جای آن از کلید API متعلق به Anthropic استفاده کنید.
  </Accordion>

  <Accordion title='هیچ کلید API برای ارائه‌دهندهٔ "anthropic" یافت نشد'>
    احراز هویت Anthropic **برای هر عامل مجزا است**؛ عامل‌های جدید کلیدهای عامل اصلی را به ارث نمی‌برند. فرایند راه‌اندازی اولیه را برای آن عامل دوباره اجرا کنید (یا یک کلید API روی میزبان Gateway پیکربندی کنید)، سپس با `openclaw models status` آن را بررسی کنید.
  </Accordion>

  <Accordion title='هیچ اعتبارنامه‌ای برای نمایهٔ "anthropic:default" یافت نشد'>
    برای مشاهدهٔ نمایهٔ احراز هویت فعال، `openclaw models status` را اجرا کنید. فرایند راه‌اندازی اولیه را دوباره اجرا کنید یا یک کلید API برای مسیر آن نمایه پیکربندی کنید.
  </Accordion>

  <Accordion title="هیچ پروفایل احراز هویت در دسترس نیست (همه در دوره انتظار هستند)">
    `openclaw models status --json` را برای `auth.unusableProfiles` بررسی کنید. دوره‌های انتظار محدودیت نرخ Anthropic می‌توانند مختص مدل باشند، بنابراین ممکن است همچنان بتوان از مدل هم‌خانواده دیگری از Anthropic استفاده کرد. پروفایل Anthropic دیگری اضافه کنید یا تا پایان دوره انتظار منتظر بمانید.
  </Accordion>
</AccordionGroup>

<Note>
راهنمای بیشتر: [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq).
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="بک‌اندهای CLI" href="/fa/gateway/cli-backends" icon="terminal">
    جزئیات راه‌اندازی و زمان اجرای بک‌اند Claude CLI.
  </Card>
  <Card title="کش‌کردن پرامپت" href="/fa/reference/prompt-caching" icon="database">
    نحوه کار کش‌کردن پرامپت در ارائه‌دهندگان مختلف.
  </Card>
  <Card title="OAuth و احراز هویت" href="/fa/gateway/authentication" icon="key">
    جزئیات احراز هویت و قواعد استفاده مجدد از اعتبارنامه‌ها.
  </Card>
</CardGroup>
