---
read_when:
    - می‌خواهید فایل‌های گردش‌کار `.prose` را اجرا کنید یا بنویسید
    - می‌خواهید Plugin ‏OpenProse را فعال کنید
    - باید درک کنید که OpenProse چگونه به سازوکارهای پایهٔ OpenClaw نگاشت می‌شود
sidebarTitle: OpenProse
summary: OpenProse یک قالب گردش‌کار مبتنی بر Markdown برای نشست‌های هوش مصنوعی چندعاملی است. در OpenClaw، این قالب به‌صورت یک Plugin همراه با فرمان اسلش `/prose` و یک بستهٔ Skills عرضه می‌شود.
title: OpenProse
x-i18n:
    generated_at: "2026-07-12T10:42:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b04eb23bf827fbec6db11c1e95993e7f6c617451c5f4fda771ad078674c12bc
    source_path: prose.md
    workflow: 16
---

OpenProse قالبی قابل‌حمل و مبتنی بر Markdown برای هماهنگ‌سازی نشست‌های هوش مصنوعی است. در OpenClaw، این قالب به‌صورت Plugin عرضه می‌شود که یک بسته Skill متعلق به OpenProse و یک فرمان اسلش `/prose` را نصب می‌کند. برنامه‌ها در فایل‌های `.prose` قرار می‌گیرند و می‌توانند چندین زیرعامل را با جریان کنترل صریح راه‌اندازی کنند.

<CardGroup cols={3}>
  <Card title="نصب" icon="download" href="#install">
    Plugin مربوط به OpenProse را فعال و Gateway را راه‌اندازی مجدد کنید.
  </Card>
  <Card title="اجرای برنامه" icon="play" href="#slash-command">
    برای اجرای یک فایل `.prose` یا برنامه‌ای راه‌دور، از `/prose run` استفاده کنید.
  </Card>
  <Card title="نوشتن برنامه‌ها" icon="pencil" href="#example-parallel-research-and-synthesis">
    گردش‌کارهای چندعاملی را با مراحل موازی و متوالی ایجاد کنید.
  </Card>
</CardGroup>

## نصب

<Steps>
  <Step title="فعال‌سازی Plugin">
    OpenProse همراه محصول ارائه می‌شود، اما به‌طور پیش‌فرض غیرفعال است. آن را فعال کنید:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="راه‌اندازی مجدد Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="تأیید">
    ```bash
    openclaw plugins list | grep prose
    ```

    باید `open-prose` را در حالت فعال ببینید. اکنون فرمان Skill یعنی `/prose` در گفت‌وگو در دسترس است.

  </Step>
</Steps>

از یک نسخه دریافت‌شده از مخزن می‌توانید Plugin را مستقیماً نصب کنید:
`openclaw plugins install ./extensions/open-prose`

## فرمان اسلش

OpenProse فرمان `/prose` را به‌عنوان یک فرمان Skill قابل‌فراخوانی توسط کاربر ثبت می‌کند:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` به `https://p.prose.md/<handle>/<slug>` نگاشت می‌شود.
نشانی‌های مستقیم با استفاده از ابزار `web_fetch` و بدون تغییر دریافت می‌شوند.

اجرای برنامه‌های راه‌دور در سطح بالا صریح است. واردکردن منابع راه‌دور درون یک برنامه `.prose` وابستگی‌های کد انتقالی محسوب می‌شود: پیش از اینکه OpenProse هر مقصد راه‌دور `use` را دریافت کند، فهرست نهایی واردات را نمایش می‌دهد و از متصدی می‌خواهد برای همان اجرا دقیقاً عبارت `approve remote prose imports` را پاسخ دهد.

## قابلیت‌ها

- پژوهش و ترکیب نتایج با چند عامل و موازی‌سازی صریح.
- گردش‌کارهای تکرارپذیر و ایمن از نظر تأیید، مانند بازبینی کد، تریاژ رخدادها و خط‌لوله‌های محتوا.
- برنامه‌های `.prose` قابل‌استفاده مجدد که می‌توانید آن‌ها را در محیط‌های اجرای عامل پشتیبانی‌شده اجرا کنید.

## مثال: پژوهش و ترکیب موازی

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
  context: { findings, draft }
```

## نگاشت محیط اجرای OpenClaw

برنامه‌های OpenProse به اجزای پایه OpenClaw نگاشت می‌شوند:

| مفهوم OpenProse            | ابزار OpenClaw                                    |
| ------------------------- | ----------------------------------------------- |
| ایجاد نشست / ابزار Task   | `sessions_spawn`                                |
| خواندن / نوشتن فایل       | `read` / `write`                                |
| دریافت از وب              | `web_fetch` (`exec` + curl در صورت نیاز به POST) |

<Warning>
  اگر فهرست مجاز ابزارهای شما `sessions_spawn`، `read`، `write` یا
  `web_fetch` را مسدود کند، برنامه‌های OpenProse با شکست مواجه می‌شوند. 
  [پیکربندی فهرست مجاز ابزارها](/fa/gateway/config-tools) را بررسی کنید.
</Warning>

## مکان فایل‌ها

OpenProse وضعیت را در پوشه `.prose/` فضای کاری شما نگه می‌دارد:

```text
.prose/
├── .env                      # config (key=value), e.g. OPENPROSE_POSTGRES_URL
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose     # copy of the running program
│       ├── state.md          # execution state
│       ├── bindings/
│       ├── imports/          # nested remote program runs
│       └── agents/
└── agents/                   # project-scoped persistent agents
```

عامل‌های پایدار در سطح کاربر که میان پروژه‌ها به‌اشتراک گذاشته می‌شوند، در مسیر زیر قرار دارند:

```text
~/.prose/agents/
```

## زیرساخت‌های ذخیره‌سازی وضعیت

<AccordionGroup>
  <Accordion title="سامانه فایل (پیش‌فرض)">
    وضعیت در مسیر `.prose/runs/...` در فضای کاری نوشته می‌شود. به هیچ وابستگی اضافی نیاز نیست.
  </Accordion>
  <Accordion title="درون‌بافت">
    وضعیت گذرا در پنجره بافت نگه‌داری می‌شود؛ آن را با `--in-context` انتخاب کنید.
    برای برنامه‌های کوچک و کوتاه‌مدت مناسب است.
  </Accordion>
  <Accordion title="sqlite (آزمایشی)">
    آن را با `--state=sqlite` انتخاب کنید. به فایل اجرایی `sqlite3` در `PATH`
    نیاز دارد و در صورت نبود آن به سامانه فایل بازمی‌گردد؛ وضعیت در
    `.prose/runs/{id}/state.db` ذخیره می‌شود.
  </Accordion>
  <Accordion title="postgres (آزمایشی)">
    آن را با `--state=postgres` انتخاب کنید. به `psql` و یک رشته اتصال در
    `OPENPROSE_POSTGRES_URL` نیاز دارد؛ آن را در `.prose/.env` تنظیم کنید.

    <Warning>
      اطلاعات احراز هویت Postgres وارد گزارش‌های زیرعامل‌ها می‌شود. از پایگاه داده‌ای اختصاصی با کمترین سطح دسترسی استفاده کنید.
    </Warning>

  </Accordion>
</AccordionGroup>

## امنیت

با فایل‌های `.prose` مانند کد رفتار کنید. پیش از اجرا، آن‌ها و واردات راه‌دور `use` را بازبینی کنید. درخواست‌های سطح بالای `/prose run https://...` صریح هستند، اما واردات انتقالی راه‌دور پیش از دریافت یا اجرا به تأیید جداگانه برای هر اجرا نیاز دارند. برای کنترل اثرات جانبی، از فهرست‌های مجاز ابزار و دروازه‌های تأیید OpenClaw استفاده کنید. برای گردش‌کارهای قطعی و نیازمند تأیید، آن را با [Lobster](/fa/tools/lobster) مقایسه کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="مرجع Skills" href="/fa/tools/skills" icon="puzzle-piece">
    نحوه بارگذاری بسته Skill مربوط به OpenProse و دروازه‌های اعمال‌شده.
  </Card>
  <Card title="زیرعامل‌ها" href="/fa/tools/subagents" icon="users">
    لایه بومی OpenClaw برای هماهنگی چندعاملی.
  </Card>
  <Card title="تبدیل متن به گفتار" href="/fa/tools/tts" icon="volume-high">
    خروجی صوتی را به گردش‌کارهای خود اضافه کنید.
  </Card>
  <Card title="فرمان‌های اسلش" href="/fa/tools/slash-commands" icon="terminal">
    همه فرمان‌های گفت‌وگوی موجود، از جمله `/prose`.
  </Card>
</CardGroup>

وب‌سایت رسمی: [https://www.prose.md](https://www.prose.md)
