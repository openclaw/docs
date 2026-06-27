---
read_when:
    - می‌خواهید فایل‌های گردش‌کار .prose را اجرا یا بنویسید
    - می‌خواهید Plugin ‏OpenProse را فعال کنید
    - باید درک کنید که OpenProse چگونه به مفاهیم پایهٔ OpenClaw نگاشت می‌شود.
sidebarTitle: OpenProse
summary: OpenProse یک قالب گردش‌کار مبتنی بر Markdown برای نشست‌های هوش مصنوعی چندعاملی است. در OpenClaw، به‌صورت یک Plugin با دستور اسلش `/prose` و یک بسته Skills عرضه می‌شود.
title: OpenProse
x-i18n:
    generated_at: "2026-06-27T18:35:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde819215f99055c2a83ec32ed6e0700994654ca2d1d9c9dda98b71545f8a012
    source_path: prose.md
    workflow: 16
---

OpenProse یک قالب گردش‌کار قابل‌حمل و مقدم بر Markdown برای هماهنگ‌سازی نشست‌های هوش مصنوعی است. در OpenClaw، این قالب به‌صورت یک Plugin عرضه می‌شود که یک بسته Skills برای OpenProse و یک فرمان اسلش `/prose` نصب می‌کند. برنامه‌ها در فایل‌های `.prose` قرار می‌گیرند و می‌توانند چندین زیرعامل را با جریان کنترل صریح اجرا کنند.

<CardGroup cols={3}>
  <Card title="نصب" icon="download" href="#install">
    Plugin OpenProse را فعال کنید و Gateway را دوباره راه‌اندازی کنید.
  </Card>
  <Card title="اجرای یک برنامه" icon="play" href="#slash-command">
    برای اجرای یک فایل `.prose` یا برنامه راه‌دور، از `/prose run` استفاده کنید.
  </Card>
  <Card title="نوشتن برنامه‌ها" icon="pencil" href="#example">
    گردش‌کارهای چندعاملی را با گام‌های موازی و ترتیبی بنویسید.
  </Card>
</CardGroup>

## نصب

<Steps>
  <Step title="فعال‌سازی Plugin">
    Pluginهای همراه به‌طور پیش‌فرض غیرفعال هستند. OpenProse را فعال کنید:

    ```bash
    openclaw plugins enable open-prose
    ```

  </Step>
  <Step title="راه‌اندازی دوباره Gateway">
    ```bash
    openclaw gateway restart
    ```
  </Step>
  <Step title="تأیید">
    ```bash
    openclaw plugins list | grep prose
    ```

    باید `open-prose` را به‌صورت فعال‌شده ببینید. فرمان Skills به نام `/prose` اکنون
    در چت در دسترس است.

  </Step>
</Steps>

برای یک checkout محلی: `openclaw plugins install ./path/to/local/open-prose-plugin`

## فرمان اسلش

OpenProse،‏ `/prose` را به‌عنوان یک فرمان Skills قابل‌فراخوانی توسط کاربر ثبت می‌کند:

```text
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

`/prose run <handle/slug>` به `https://p.prose.md/<handle>/<slug>` resolve می‌شود.
URLهای مستقیم همان‌طور که هستند با ابزار `web_fetch` دریافت می‌شوند.

اجراهای راه‌دور در سطح بالا صریح هستند. importهای راه‌دور داخل یک برنامه `.prose`
وابستگی‌های کد گذرا هستند: پیش از آنکه OpenProse هر هدف `use` راه‌دور را دریافت کند،
فهرست importهای resolve‌شده را نشان می‌دهد و برای آن اجرا، اپراتور باید دقیقاً
`approve remote prose imports` را پاسخ دهد.

## چه کاری می‌تواند انجام دهد

- پژوهش و ترکیب چندعاملی با موازی‌سازی صریح.
- گردش‌کارهای تکرارپذیر و ایمن از نظر تأیید (بازبینی کد، تریاژ رخداد، pipelineهای محتوا).
- برنامه‌های `.prose` قابل‌استفاده مجدد که می‌توانید در runtimeهای عامل پشتیبانی‌شده اجرا کنید.

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

## نگاشت زمان اجرای OpenClaw

برنامه‌های OpenProse به بدوی‌های OpenClaw نگاشت می‌شوند:

| مفهوم OpenProse              | ابزار OpenClaw    |
| ---------------------------- | ---------------- |
| ایجاد نشست / ابزار Task      | `sessions_spawn` |
| خواندن / نوشتن فایل          | `read` / `write` |
| واکشی وب                     | `web_fetch`      |

<Warning>
  اگر فهرست مجاز ابزارهای شما `sessions_spawn`، `read`، `write` یا
  `web_fetch` را مسدود کند، برنامه‌های OpenProse شکست می‌خورند. پیکربندی
  [فهرست مجاز ابزارها](/fa/gateway/config-tools) را بررسی کنید.
</Warning>

## مکان فایل‌ها

OpenProse وضعیت را در فضای کاری شما زیر `.prose/` نگه می‌دارد:

```text
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

عامل‌های پایدار در سطح کاربر در این مسیر قرار دارند:

```text
~/.prose/agents/
```

## پشتوانه‌های وضعیت

<AccordionGroup>
  <Accordion title="filesystem (default)">
    وضعیت در فضای کاری در `.prose/runs/...` نوشته می‌شود. هیچ وابستگی
    اضافی لازم نیست.
  </Accordion>
  <Accordion title="in-context">
    وضعیت گذرا در پنجره زمینه نگه داشته می‌شود. برای برنامه‌های کوچک و
    کوتاه‌عمر مناسب است.
  </Accordion>
  <Accordion title="sqlite (experimental)">
    به باینری `sqlite3` روی `PATH` نیاز دارد.
  </Accordion>
  <Accordion title="postgres (experimental)">
    به `psql` و یک رشته اتصال نیاز دارد.

    <Warning>
      اعتبارنامه‌های Postgres وارد گزارش‌های زیرعامل‌ها می‌شوند. از یک
      پایگاه داده اختصاصی با حداقل سطح دسترسی استفاده کنید.
    </Warning>

  </Accordion>
</AccordionGroup>

## امنیت

با فایل‌های `.prose` مانند کد رفتار کنید. پیش از اجرا، آن‌ها را بازبینی کنید،
از جمله importهای راه دور `use`. درخواست‌های سطح بالای `/prose run https://...`
صریح هستند، اما importهای راه دورِ گذرا پیش از واکشی یا اجرا، برای هر اجرا به
تأیید نیاز دارند. برای کنترل اثرات جانبی، از فهرست‌های مجاز ابزار و دروازه‌های
تأیید OpenClaw استفاده کنید. برای گردش‌کارهای قطعی و دارای دروازه تأیید، با
[Lobster](/fa/tools/lobster) مقایسه کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Skills reference" href="/fa/tools/skills" icon="puzzle-piece">
    اینکه بسته Skills در OpenProse چگونه بارگذاری می‌شود و چه دروازه‌هایی اعمال می‌شوند.
  </Card>
  <Card title="Subagents" href="/fa/tools/subagents" icon="users">
    لایه بومی هماهنگی چندعاملی OpenClaw.
  </Card>
  <Card title="Text-to-speech" href="/fa/tools/tts" icon="volume-high">
    خروجی صوتی را به گردش‌کارهای خود اضافه کنید.
  </Card>
  <Card title="Slash commands" href="/fa/tools/slash-commands" icon="terminal">
    همه فرمان‌های چت موجود، از جمله /prose.
  </Card>
</CardGroup>

سایت رسمی: [https://www.prose.md](https://www.prose.md)
