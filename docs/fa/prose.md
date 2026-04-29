---
read_when:
    - می‌خواهید گردش‌کارهای .prose را اجرا کنید یا بنویسید
    - می‌خواهید Plugin OpenProse را فعال کنید
    - لازم است ذخیره‌سازی وضعیت را درک کنید
summary: 'OpenProse: جریان‌های کاری .prose، دستورهای اسلش، و وضعیت در OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-29T23:22:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1d6f3aa64c403daedaeaa2d7934b8474c0756fe09eed09efd1efeef62413e9e
    source_path: prose.md
    workflow: 16
---

OpenProse یک قالب گردش‌کار قابل‌حمل و مبتنی بر markdown برای هماهنگ‌سازی نشست‌های هوش مصنوعی است. در OpenClaw، این قالب به‌صورت یک Plugin ارائه می‌شود که یک بسته Skills برای OpenProse به‌همراه دستور اسلش `/prose` نصب می‌کند. برنامه‌ها در فایل‌های `.prose` قرار می‌گیرند و می‌توانند چندین زیرعامل را با جریان کنترل صریح ایجاد کنند.

سایت رسمی: [https://www.prose.md](https://www.prose.md)

## چه کارهایی می‌تواند انجام دهد

- پژوهش چندعاملی + ترکیب با موازی‌سازی صریح.
- گردش‌کارهای تکرارپذیر و امن از نظر تأیید (بازبینی کد، تریاژ رخداد، خط لوله‌های محتوا).
- برنامه‌های `.prose` قابل‌استفاده‌مجدد که می‌توانید در زمان‌های اجرای عامل پشتیبانی‌شده اجرا کنید.

## نصب + فعال‌سازی

Pluginهای همراه به‌صورت پیش‌فرض غیرفعال هستند. OpenProse را فعال کنید:

```bash
openclaw plugins enable open-prose
```

پس از فعال‌سازی Plugin، Gateway را دوباره راه‌اندازی کنید.

checkout توسعه/محلی: `openclaw plugins install ./path/to/local/open-prose-plugin`

مستندات مرتبط: [Pluginها](/fa/tools/plugin)، [مانیفست Plugin](/fa/plugins/manifest)، [Skills](/fa/tools/skills).

## دستور اسلش

OpenProse دستور `/prose` را به‌عنوان یک دستور Skills قابل‌فراخوانی توسط کاربر ثبت می‌کند. این دستور به دستورالعمل‌های ماشین مجازی OpenProse هدایت می‌شود و در پشت‌صحنه از ابزارهای OpenClaw استفاده می‌کند.

دستورهای رایج:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## نمونه: یک فایل ساده `.prose`

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

## مکان‌های فایل

OpenProse وضعیت را در فضای کاری شما زیر `.prose/` نگه می‌دارد:

```
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

```
~/.prose/agents/
```

## حالت‌های وضعیت

OpenProse از چندین پشتوانه وضعیت پشتیبانی می‌کند:

- **filesystem** (پیش‌فرض): `.prose/runs/...`
- **in-context**: گذرا، برای برنامه‌های کوچک
- **sqlite** (آزمایشی): به باینری `sqlite3` نیاز دارد
- **postgres** (آزمایشی): به `psql` و یک رشته اتصال نیاز دارد

نکته‌ها:

- sqlite/postgres اختیاری و آزمایشی هستند.
- اعتبارنامه‌های postgres وارد گزارش‌های زیرعامل می‌شوند؛ از یک پایگاه داده اختصاصی با کمترین سطح دسترسی لازم استفاده کنید.

## برنامه‌های راه‌دور

`/prose run <handle/slug>` به `https://p.prose.md/<handle>/<slug>` resolve می‌شود.
URLهای مستقیم همان‌طور که هستند واکشی می‌شوند. این کار از ابزار `web_fetch` (یا `exec` برای POST) استفاده می‌کند.

## نگاشت زمان اجرای OpenClaw

برنامه‌های OpenProse به ابتدایی‌های OpenClaw نگاشت می‌شوند:

| مفهوم OpenProse           | ابزار OpenClaw    |
| ------------------------- | ---------------- |
| ایجاد نشست / ابزار Task | `sessions_spawn` |
| خواندن/نوشتن فایل        | `read` / `write` |
| واکشی وب                 | `web_fetch`      |

اگر allowlist ابزارهای شما این ابزارها را مسدود کند، برنامه‌های OpenProse شکست می‌خورند. [پیکربندی Skills](/fa/tools/skills-config) را ببینید.

## امنیت + تأییدها

با فایل‌های `.prose` مانند کد رفتار کنید. پیش از اجرا آن‌ها را بازبینی کنید. برای کنترل اثرات جانبی، از allowlistهای ابزار OpenClaw و دروازه‌های تأیید استفاده کنید.

برای گردش‌کارهای قطعی و دارای دروازه تأیید، با [Lobster](/fa/tools/lobster) مقایسه کنید.

## مرتبط

- [تبدیل متن به گفتار](/fa/tools/tts)
- [قالب‌بندی Markdown](/fa/concepts/markdown-formatting)
