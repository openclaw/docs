---
read_when:
    - پیکربندی گروه‌های پخش
    - اشکال‌زدایی پاسخ‌های چندعاملی در WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: ارسال همگانی یک پیام WhatsApp به چندین عامل
title: گروه‌های پخش
x-i18n:
    generated_at: "2026-07-01T08:19:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97e8c2ade5d12a437864e6aca0d475e586289f71155188afed216881ebf89f88
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**وضعیت:** آزمایشی. در 2026.1.9 اضافه شد.
</Note>

## نمای کلی

گروه‌های پخش به چند عامل امکان می‌دهند یک پیام یکسان را هم‌زمان پردازش کنند و به آن پاسخ دهند. این قابلیت به شما اجازه می‌دهد تیم‌هایی از عامل‌های تخصصی بسازید که در یک گروه WhatsApp یا پیام مستقیم واحد با هم کار می‌کنند؛ همه با استفاده از یک شماره تلفن.

دامنه فعلی: **فقط WhatsApp** (کانال وب).

گروه‌های پخش پس از allowlistهای کانال و قواعد فعال‌سازی گروه ارزیابی می‌شوند. در گروه‌های WhatsApp، یعنی پخش زمانی انجام می‌شود که OpenClaw در حالت عادی پاسخ می‌داد (برای مثال: هنگام mention، بسته به تنظیمات گروه شما).

مسیر QA زنده WhatsApp شامل `whatsapp-broadcast-group-fanout` است که بررسی می‌کند یک پیام mention‌شده در گروه می‌تواند پاسخ‌های قابل مشاهده و متمایزی از دو عامل پیکربندی‌شده تولید کند.

## موارد استفاده

<AccordionGroup>
  <Accordion title="1. تیم‌های عامل تخصصی">
    چند عامل را با مسئولیت‌های اتمی و متمرکز مستقر کنید:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    هر عامل پیام یکسان را پردازش می‌کند و دیدگاه تخصصی خودش را ارائه می‌دهد.

  </Accordion>
  <Accordion title="2. پشتیبانی چندزبانه">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. گردش‌کارهای تضمین کیفیت">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. خودکارسازی وظایف">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## پیکربندی

### راه‌اندازی پایه

یک بخش سطح‌بالای `broadcast` اضافه کنید (کنار `bindings`). کلیدها شناسه‌های همتای WhatsApp هستند:

- گفت‌وگوهای گروهی: JID گروه (مثلاً `120363403215116621@g.us`)
- پیام‌های مستقیم: شماره تلفن E.164 (مثلاً `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**نتیجه:** وقتی OpenClaw در این گفت‌وگو پاسخ می‌داد، هر سه عامل را اجرا می‌کند.

### راهبرد پردازش

نحوه پردازش پیام‌ها توسط عامل‌ها را کنترل کنید:

<Tabs>
  <Tab title="parallel (پیش‌فرض)">
    همه عامل‌ها هم‌زمان پردازش می‌کنند:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    عامل‌ها به‌ترتیب پردازش می‌کنند (هرکدام منتظر می‌ماند قبلی تمام شود):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

### مثال کامل

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## سازوکار

### جریان پیام

<Steps>
  <Step title="پیام ورودی می‌رسد">
    یک پیام گروهی یا پیام مستقیم WhatsApp می‌رسد.
  </Step>
  <Step title="مسیریابی و پذیرش">
    OpenClaw، allowlistهای کانال، قواعد فعال‌سازی گروه، و مالکیت binding پیکربندی‌شده ACP را اعمال می‌کند.
  </Step>
  <Step title="بررسی پخش">
    اگر هیچ binding پیکربندی‌شده ACP مالک مسیر نباشد، OpenClaw بررسی می‌کند که آیا شناسه همتا در `broadcast` وجود دارد یا نه.
  </Step>
  <Step title="اگر پخش اعمال شود">
    - همه عامل‌های فهرست‌شده پیام را پردازش می‌کنند.
    - هر عامل کلید نشست و زمینه ایزوله خودش را دارد.
    - عامل‌ها به‌صورت موازی (پیش‌فرض) یا ترتیبی پردازش می‌کنند.

  </Step>
  <Step title="اگر پخش اعمال نشود">
    OpenClaw مسیر عادی یا مسیر نشست ACP پیکربندی‌شده را که هنگام مسیریابی انتخاب شده است dispatch می‌کند.
  </Step>
</Steps>

<Note>
گروه‌های پخش، allowlistهای کانال یا قواعد فعال‌سازی گروه (mentions/commands/etc) را دور نمی‌زنند. آن‌ها فقط تغییر می‌دهند _کدام عامل‌ها اجرا شوند_ وقتی یک پیام واجد شرایط پردازش است.
</Note>

### ایزوله‌سازی نشست

هر عامل در یک گروه پخش موارد زیر را کاملاً جداگانه نگه می‌دارد:

- **کلیدهای نشست** (`agent:alfred:whatsapp:group:120363...` در برابر `agent:baerbel:whatsapp:group:120363...`)
- **تاریخچه مکالمه** (عامل پیام‌های عامل‌های دیگر را نمی‌بیند)
- **Workspace** (در صورت پیکربندی، sandboxهای جداگانه)
- **دسترسی به ابزار** (فهرست‌های allow/deny متفاوت)
- **حافظه/زمینه** (IDENTITY.md، SOUL.md و غیره جداگانه)
- **بافر زمینه گروه** (پیام‌های اخیر گروه که برای زمینه استفاده می‌شوند) برای هر همتا مشترک است، بنابراین همه عامل‌های پخش هنگام trigger شدن زمینه یکسانی را می‌بینند

این به هر عامل امکان می‌دهد موارد زیر را داشته باشد:

- شخصیت‌های متفاوت
- دسترسی متفاوت به ابزار (مثلاً فقط‌خواندنی در برابر خواندن-نوشتن)
- مدل‌های متفاوت (مثلاً opus در برابر sonnet)
- Skills متفاوت نصب‌شده

### مثال: نشست‌های ایزوله

در گروه `120363403215116621@g.us` با عامل‌های `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="زمینه Alfred">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="زمینه Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## بهترین روش‌ها

<AccordionGroup>
  <Accordion title="1. عامل‌ها را متمرکز نگه دارید">
    هر عامل را با یک مسئولیت واحد و روشن طراحی کنید:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **خوب:** هر عامل یک کار دارد. ❌ **بد:** یک عامل عمومی "dev-helper".

  </Accordion>
  <Accordion title="2. از نام‌های توصیفی استفاده کنید">
    روشن کنید هر عامل چه کاری انجام می‌دهد:

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. دسترسی ابزار متفاوت پیکربندی کنید">
    فقط ابزارهایی را به عامل‌ها بدهید که نیاز دارند:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` فقط‌خواندنی است. `fixer` می‌تواند بخواند و بنویسد.

  </Accordion>
  <Accordion title="4. عملکرد را پایش کنید">
    با تعداد زیاد عامل، این موارد را در نظر بگیرید:

    - استفاده از `"strategy": "parallel"` (پیش‌فرض) برای سرعت
    - محدود کردن گروه‌های پخش به 5 تا 10 عامل
    - استفاده از مدل‌های سریع‌تر برای عامل‌های ساده‌تر

  </Accordion>
  <Accordion title="5. خرابی‌ها را با ظرافت مدیریت کنید">
    عامل‌ها به‌طور مستقل شکست می‌خورند. خطای یک عامل، عامل‌های دیگر را مسدود نمی‌کند:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## سازگاری

### ارائه‌دهندگان

گروه‌های پخش در حال حاضر با موارد زیر کار می‌کنند:

- ✅ WhatsApp (پیاده‌سازی‌شده)
- 🚧 Telegram (برنامه‌ریزی‌شده)
- 🚧 Discord (برنامه‌ریزی‌شده)
- 🚧 Slack (برنامه‌ریزی‌شده)

### مسیریابی

گروه‌های پخش در کنار مسیریابی موجود کار می‌کنند:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: فقط alfred پاسخ می‌دهد (مسیریابی عادی).
- `GROUP_B`: agent1 و agent2 پاسخ می‌دهند (پخش).

<Note>
**تقدم:** `broadcast` بر bindingهای مسیر عادی اولویت دارد. bindingهای ACP پیکربندی‌شده (`bindings[].type="acp"`) انحصاری هستند: وقتی یکی تطبیق پیدا کند، OpenClaw به‌جای پخش fan-out، به نشست ACP پیکربندی‌شده dispatch می‌کند.
</Note>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="عامل‌ها پاسخ نمی‌دهند">
    **بررسی کنید:**

    1. شناسه‌های عامل در `agents.list` وجود دارند.
    2. قالب شناسه همتا درست است (مثلاً `120363403215116621@g.us`).
    3. عامل‌ها در فهرست‌های deny نیستند.

    **اشکال‌زدایی:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="فقط یک عامل پاسخ می‌دهد">
    **علت:** شناسه همتا ممکن است در bindingهای مسیر عادی باشد اما در `broadcast` نباشد، یا ممکن است با یک binding پیکربندی‌شده ACP انحصاری تطبیق پیدا کند.

    **رفع:** همتاهای متصل به مسیر عادی را به پیکربندی broadcast اضافه کنید، یا اگر پخش fan-out مطلوب است، binding پیکربندی‌شده ACP را حذف/تغییر دهید.

  </Accordion>
  <Accordion title="مشکلات عملکرد">
    اگر با تعداد زیاد عامل کند است:

    - تعداد عامل‌ها در هر گروه را کاهش دهید.
    - از مدل‌های سبک‌تر استفاده کنید (sonnet به‌جای opus).
    - زمان راه‌اندازی sandbox را بررسی کنید.

  </Accordion>
</AccordionGroup>

## مثال‌ها

<AccordionGroup>
  <Accordion title="مثال 1: تیم بازبینی کد">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    **کاربر ارسال می‌کند:** قطعه کد.

    **پاسخ‌ها:**

    - code-formatter: "تورفتگی را اصلاح کرد و راهنمای نوع اضافه کرد"
    - security-scanner: "⚠️ آسیب‌پذیری تزریق SQL در خط 12"
    - test-coverage: "پوشش 45٪ است، تست‌های موارد خطا وجود ندارند"
    - docs-checker: "docstring برای تابع `process_data` وجود ندارد"

  </Accordion>
  <Accordion title="مثال 2: پشتیبانی چندزبانه">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## مرجع API

### شِمای پیکربندی

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### فیلدها

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  نحوه پردازش عامل‌ها. `parallel` همه عامل‌ها را هم‌زمان اجرا می‌کند؛ `sequential` آن‌ها را به ترتیب آرایه اجرا می‌کند.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID گروه WhatsApp، شماره E.164، یا شناسه همتای دیگر. مقدار، آرایه‌ای از شناسه‌های عامل‌هایی است که باید پیام‌ها را پردازش کنند.
</ParamField>

## محدودیت‌ها

1. **حداکثر عامل‌ها:** محدودیت سختی وجود ندارد، اما ۱۰ عامل یا بیشتر ممکن است کند باشد.
2. **زمینه مشترک:** عامل‌ها پاسخ‌های یکدیگر را نمی‌بینند (طبق طراحی).
3. **ترتیب پیام‌ها:** پاسخ‌های موازی ممکن است با هر ترتیبی برسند.
4. **محدودیت‌های نرخ:** همه عامل‌ها در محدودیت‌های نرخ WhatsApp محاسبه می‌شوند.

## بهبودهای آینده

قابلیت‌های برنامه‌ریزی‌شده:

- [ ] حالت زمینه مشترک (عامل‌ها پاسخ‌های یکدیگر را می‌بینند)
- [ ] هماهنگی عامل‌ها (عامل‌ها می‌توانند به یکدیگر سیگنال بدهند)
- [ ] انتخاب پویای عامل (عامل‌ها را بر اساس محتوای پیام انتخاب کنید)
- [ ] اولویت‌های عامل (برخی عامل‌ها پیش از دیگران پاسخ می‌دهند)

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing)
- [گروه‌ها](/fa/channels/groups)
- [ابزارهای سندباکس چندعاملی](/fa/tools/multi-agent-sandbox-tools)
- [جفت‌سازی](/fa/channels/pairing)
- [مدیریت نشست](/fa/concepts/session)
