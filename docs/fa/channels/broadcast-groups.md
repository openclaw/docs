---
read_when:
    - پیکربندی گروه‌های پخش
    - اشکال‌زدایی پاسخ‌های چندعاملی در WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: ارسال همگانی یک پیام WhatsApp به چندین عامل
title: گروه‌های پخش
x-i18n:
    generated_at: "2026-05-04T02:21:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab43d3c3ffddb360340469433d74a380fbab98e662b2463a54f62eafc375b55
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**وضعیت:** آزمایشی. در 2026.1.9 اضافه شد.
</Note>

## نمای کلی

گروه‌های پخش به چند عامل امکان می‌دهند یک پیام واحد را هم‌زمان پردازش کنند و به آن پاسخ دهند. این قابلیت به شما اجازه می‌دهد تیم‌هایی از عامل‌های تخصصی بسازید که در یک گروه WhatsApp یا پیام مستقیم واحد با هم کار می‌کنند — همه با استفاده از یک شماره تلفن.

دامنه فعلی: **فقط WhatsApp** (کانال وب).

گروه‌های پخش پس از فهرست‌های مجاز کانال و قواعد فعال‌سازی گروه ارزیابی می‌شوند. در گروه‌های WhatsApp، این یعنی پخش‌ها زمانی انجام می‌شوند که OpenClaw در حالت عادی پاسخ می‌داد (برای مثال: هنگام اشاره، بسته به تنظیمات گروه شما).

## موارد استفاده

<AccordionGroup>
  <Accordion title="1. Specialized agent teams">
    چند عامل را با مسئولیت‌های اتمیک و متمرکز مستقر کنید:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    هر عامل همان پیام را پردازش می‌کند و دیدگاه تخصصی خود را ارائه می‌دهد.

  </Accordion>
  <Accordion title="2. Multi-language support">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Quality assurance workflows">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Task automation">
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

- گپ‌های گروهی: JID گروه (مثلاً `120363403215116621@g.us`)
- پیام‌های مستقیم: شماره تلفن E.164 (مثلاً `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**نتیجه:** وقتی OpenClaw در این گپ پاسخ می‌داد، هر سه عامل را اجرا می‌کند.

### راهبرد پردازش

نحوه پردازش پیام‌ها توسط عامل‌ها را کنترل کنید:

<Tabs>
  <Tab title="parallel (default)">
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
    عامل‌ها به‌ترتیب پردازش می‌کنند (هرکدام منتظر پایان عامل قبلی می‌ماند):

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

## نحوه کارکرد

### جریان پیام

<Steps>
  <Step title="Incoming message arrives">
    یک پیام گروهی یا پیام مستقیم WhatsApp می‌رسد.
  </Step>
  <Step title="Broadcast check">
    سیستم بررسی می‌کند که آیا شناسه همتا در `broadcast` وجود دارد یا نه.
  </Step>
  <Step title="If in broadcast list">
    - همه عامل‌های فهرست‌شده پیام را پردازش می‌کنند.
    - هر عامل کلید جلسه و زمینه جداگانه خودش را دارد.
    - عامل‌ها به‌صورت موازی (پیش‌فرض) یا ترتیبی پردازش می‌کنند.

  </Step>
  <Step title="If not in broadcast list">
    مسیریابی عادی اعمال می‌شود (اولین binding منطبق).
  </Step>
</Steps>

<Note>
گروه‌های پخش، فهرست‌های مجاز کانال یا قواعد فعال‌سازی گروه (اشاره‌ها/فرمان‌ها/و غیره) را دور نمی‌زنند. آن‌ها فقط تغییر می‌دهند که _کدام عامل‌ها اجرا شوند_ وقتی یک پیام واجد شرایط پردازش است.
</Note>

### جداسازی جلسه

هر عامل در یک گروه پخش موارد زیر را کاملاً جداگانه نگه می‌دارد:

- **کلیدهای جلسه** (`agent:alfred:whatsapp:group:120363...` در برابر `agent:baerbel:whatsapp:group:120363...`)
- **تاریخچه گفتگو** (عامل پیام‌های عامل‌های دیگر را نمی‌بیند)
- **فضای کاری** (sandboxهای جداگانه در صورت پیکربندی)
- **دسترسی ابزار** (فهرست‌های مجاز/ممنوع متفاوت)
- **حافظه/زمینه** (`IDENTITY.md`، `SOUL.md` و غیره جداگانه)
- **بافر زمینه گروه** (پیام‌های اخیر گروه که برای زمینه استفاده می‌شوند) برای هر همتا مشترک است، بنابراین همه عامل‌های پخش هنگام فعال‌شدن همان زمینه را می‌بینند

این به هر عامل امکان می‌دهد موارد زیر را داشته باشد:

- شخصیت‌های متفاوت
- دسترسی ابزار متفاوت (مثلاً فقط‌خواندنی در برابر خواندنی-نوشتنی)
- مدل‌های متفاوت (مثلاً opus در برابر sonnet)
- Skills نصب‌شده متفاوت

### مثال: جلسه‌های جداشده

در گروه `120363403215116621@g.us` با عامل‌های `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Alfred's context">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel's context">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## بهترین شیوه‌ها

<AccordionGroup>
  <Accordion title="1. Keep agents focused">
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
  <Accordion title="2. Use descriptive names">
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
  <Accordion title="3. Configure different tool access">
    فقط ابزارهایی را که عامل‌ها نیاز دارند به آن‌ها بدهید:

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
  <Accordion title="4. Monitor performance">
    با تعداد زیادی عامل، موارد زیر را در نظر بگیرید:

    - استفاده از `"strategy": "parallel"` (پیش‌فرض) برای سرعت
    - محدودکردن گروه‌های پخش به ۵ تا ۱۰ عامل
    - استفاده از مدل‌های سریع‌تر برای عامل‌های ساده‌تر

  </Accordion>
  <Accordion title="5. Handle failures gracefully">
    عامل‌ها مستقل از هم شکست می‌خورند. خطای یک عامل، دیگران را مسدود نمی‌کند:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## سازگاری

### ارائه‌دهنده‌ها

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
**اولویت:** `broadcast` بر `bindings` اولویت دارد.
</Note>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Agents not responding">
    **بررسی کنید:**

    1. شناسه‌های عامل در `agents.list` وجود داشته باشند.
    2. قالب شناسه همتا درست باشد (مثلاً `120363403215116621@g.us`).
    3. عامل‌ها در فهرست‌های ممنوع نباشند.

    **اشکال‌زدایی:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Only one agent responding">
    **علت:** شناسه همتا ممکن است در `bindings` باشد اما در `broadcast` نباشد.

    **رفع:** آن را به پیکربندی پخش اضافه کنید یا از bindings حذف کنید.

  </Accordion>
  <Accordion title="Performance issues">
    اگر با تعداد زیادی عامل کند است:

    - تعداد عامل‌ها در هر گروه را کاهش دهید.
    - از مدل‌های سبک‌تر استفاده کنید (sonnet به‌جای opus).
    - زمان راه‌اندازی sandbox را بررسی کنید.

  </Accordion>
</AccordionGroup>

## مثال‌ها

<AccordionGroup>
  <Accordion title="Example 1: Code review team">
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

    - code-formatter: "تورفتگی را اصلاح کردم و اشاره‌های نوع را اضافه کردم"
    - security-scanner: "⚠️ آسیب‌پذیری تزریق SQL در خط 12"
    - test-coverage: "پوشش 45٪ است، آزمون‌ها برای حالت‌های خطا وجود ندارند"
    - docs-checker: "docstring برای تابع `process_data` وجود ندارد"

  </Accordion>
  <Accordion title="Example 2: Multi-language support">
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

### طرح‌واره پیکربندی

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
  نحوه پردازش عامل‌ها. `parallel` همه عامل‌ها را هم‌زمان اجرا می‌کند؛ `sequential` آن‌ها را به‌ترتیب آرایه اجرا می‌کند.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID گروه WhatsApp، شماره E.164، یا شناسه همتای دیگر. مقدار، آرایه‌ای از شناسه‌های عامل‌هایی است که باید پیام‌ها را پردازش کنند.
</ParamField>

## محدودیت‌ها

1. **حداکثر عامل‌ها:** حد سختی وجود ندارد، اما بیش از ۱۰ عامل ممکن است کند باشد.
2. **زمینه مشترک:** عامل‌ها پاسخ‌های یکدیگر را نمی‌بینند (طبق طراحی).
3. **ترتیب پیام‌ها:** پاسخ‌های موازی ممکن است با هر ترتیبی برسند.
4. **محدودیت‌های نرخ:** همه عامل‌ها در محدودیت‌های نرخ WhatsApp حساب می‌شوند.

## بهبودهای آینده

ویژگی‌های برنامه‌ریزی‌شده:

- [ ] حالت زمینه مشترک (عامل‌ها پاسخ‌های یکدیگر را می‌بینند)
- [ ] هماهنگی عامل‌ها (عامل‌ها می‌توانند به یکدیگر سیگنال دهند)
- [ ] انتخاب پویای عامل (انتخاب عامل‌ها بر اساس محتوای پیام)
- [ ] اولویت‌های عامل (برخی عامل‌ها پیش از دیگران پاسخ می‌دهند)

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing)
- [گروه‌ها](/fa/channels/groups)
- [ابزارهای محیط ایزوله چندعاملی](/fa/tools/multi-agent-sandbox-tools)
- [جفت‌سازی](/fa/channels/pairing)
- [مدیریت نشست](/fa/concepts/session)
