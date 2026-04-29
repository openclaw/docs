---
read_when:
    - پیکربندی گروه‌های پخش
    - اشکال‌زدایی پاسخ‌های چندعاملی در WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: ارسال همگانی یک پیام WhatsApp به چندین عامل
title: گروه‌های پخش
x-i18n:
    generated_at: "2026-04-29T22:24:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0de4ccc85bf79e2ceb1dddd60db067309b15b7f876c92e7d591ff0b4b4315ec
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**وضعیت:** آزمایشی. در 2026.1.9 اضافه شد.
</Note>

## نمای کلی

گروه‌های پخش به چند عامل امکان می‌دهند یک پیام واحد را هم‌زمان پردازش کنند و به آن پاسخ دهند. این قابلیت به شما اجازه می‌دهد تیم‌هایی از عامل‌های تخصصی بسازید که در یک گروه WhatsApp یا پیام مستقیم با هم کار می‌کنند — همه با استفاده از یک شماره تلفن.

دامنه فعلی: **فقط WhatsApp** (کانال وب).

گروه‌های پخش پس از allowlistهای کانال و قواعد فعال‌سازی گروه ارزیابی می‌شوند. در گروه‌های WhatsApp، یعنی پخش زمانی انجام می‌شود که OpenClaw در حالت عادی پاسخ می‌داد (برای مثال: هنگام mention، بسته به تنظیمات گروه شما).

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

    هر عامل همان پیام را پردازش می‌کند و دیدگاه تخصصی خود را ارائه می‌دهد.

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

یک بخش سطح‌بالای `broadcast` اضافه کنید (کنار `bindings`). کلیدها شناسه‌های peer در WhatsApp هستند:

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

کنترل کنید عامل‌ها چگونه پیام‌ها را پردازش کنند:

<Tabs>
  <Tab title="موازی (پیش‌فرض)">
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
  <Tab title="ترتیبی">
    عامل‌ها به‌ترتیب پردازش می‌کنند (هرکدام منتظر پایان قبلی می‌ماند):

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

## نحوه کار

### جریان پیام

<Steps>
  <Step title="پیام ورودی می‌رسد">
    یک پیام گروه WhatsApp یا پیام مستقیم می‌رسد.
  </Step>
  <Step title="بررسی پخش">
    سیستم بررسی می‌کند آیا شناسه peer در `broadcast` وجود دارد یا نه.
  </Step>
  <Step title="اگر در فهرست پخش باشد">
    - همه عامل‌های فهرست‌شده پیام را پردازش می‌کنند.
    - هر عامل کلید نشست و زمینه ایزوله خودش را دارد.
    - عامل‌ها به‌صورت موازی (پیش‌فرض) یا ترتیبی پردازش می‌کنند.

  </Step>
  <Step title="اگر در فهرست پخش نباشد">
    مسیریابی عادی اعمال می‌شود (اولین binding منطبق).
  </Step>
</Steps>

<Note>
گروه‌های پخش، allowlistهای کانال یا قواعد فعال‌سازی گروه (mentions/commands/و غیره) را دور نمی‌زنند. آن‌ها فقط تغییر می‌دهند _کدام عامل‌ها اجرا شوند_ وقتی یک پیام واجد شرایط پردازش است.
</Note>

### ایزوله‌سازی نشست

هر عامل در یک گروه پخش موارد زیر را کاملاً جداگانه نگه می‌دارد:

- **کلیدهای نشست** (`agent:alfred:whatsapp:group:120363...` در برابر `agent:baerbel:whatsapp:group:120363...`)
- **تاریخچه گفت‌وگو** (عامل پیام‌های عامل‌های دیگر را نمی‌بیند)
- **Workspace** (sandboxهای جداگانه اگر پیکربندی شده باشند)
- **دسترسی ابزار** (فهرست‌های allow/deny متفاوت)
- **حافظه/زمینه** (IDENTITY.md، SOUL.md و غیره جداگانه)
- **بافر زمینه گروه** (پیام‌های اخیر گروه که برای زمینه استفاده می‌شوند) برای هر peer مشترک است، بنابراین همه عامل‌های پخش هنگام trigger شدن همان زمینه را می‌بینند

این اجازه می‌دهد هر عامل موارد زیر را داشته باشد:

- شخصیت‌های متفاوت
- دسترسی ابزار متفاوت (مثلاً فقط خواندنی در برابر خواندن-نوشتن)
- مدل‌های متفاوت (مثلاً opus در برابر sonnet)
- Skills نصب‌شده متفاوت

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

## بهترین شیوه‌ها

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
          "tools": { "allow": ["read", "exec"] } // Read-only
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. عملکرد را پایش کنید">
    با تعداد زیاد عامل، این موارد را در نظر بگیرید:

    - استفاده از `"strategy": "parallel"` (پیش‌فرض) برای سرعت
    - محدود کردن گروه‌های پخش به 5 تا 10 عامل
    - استفاده از مدل‌های سریع‌تر برای عامل‌های ساده‌تر

  </Accordion>
  <Accordion title="5. خطاها را با ظرافت مدیریت کنید">
    عامل‌ها مستقل از هم fail می‌شوند. خطای یک عامل مانع دیگران نمی‌شود:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## سازگاری

### ارائه‌دهنده‌ها

گروه‌های پخش در حال حاضر با موارد زیر کار می‌کنند:

- ✅ WhatsApp (پیاده‌سازی شده)
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
**اولویت:** `broadcast` نسبت به `bindings` اولویت دارد.
</Note>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="عامل‌ها پاسخ نمی‌دهند">
    **بررسی کنید:**

    1. شناسه‌های عامل در `agents.list` وجود داشته باشند.
    2. قالب شناسه peer درست باشد (مثلاً `120363403215116621@g.us`).
    3. عامل‌ها در فهرست‌های deny نباشند.

    **اشکال‌زدایی:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="فقط یک عامل پاسخ می‌دهد">
    **علت:** ممکن است شناسه peer در `bindings` باشد اما در `broadcast` نباشد.

    **رفع:** آن را به پیکربندی پخش اضافه کنید یا از bindings حذف کنید.

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

    **کاربر می‌فرستد:** قطعه کد.

    **پاسخ‌ها:**

    - code-formatter: "تورفتگی را اصلاح کرد و type hint اضافه کرد"
    - security-scanner: "⚠️ آسیب‌پذیری SQL injection در خط 12"
    - test-coverage: "پوشش 45٪ است، تست‌هایی برای حالت‌های خطا وجود ندارد"
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
  نحوه پردازش عامل‌ها. `parallel` همه عامل‌ها را هم‌زمان اجرا می‌کند؛ `sequential` آن‌ها را به‌ترتیب آرایه اجرا می‌کند.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID گروه WhatsApp، شماره E.164، یا شناسه peer دیگر. مقدار، آرایه‌ای از شناسه‌های عامل است که باید پیام‌ها را پردازش کنند.
</ParamField>

## محدودیت‌ها

1. **حداکثر عامل‌ها:** محدودیت سختی وجود ندارد، اما 10+ عامل ممکن است کند باشد.
2. **زمینه مشترک:** عامل‌ها پاسخ‌های یکدیگر را نمی‌بینند (بر اساس طراحی).
3. **ترتیب پیام‌ها:** پاسخ‌های موازی ممکن است به هر ترتیبی برسند.
4. **محدودیت‌های نرخ:** همه عامل‌ها در محدودیت‌های نرخ WhatsApp شمرده می‌شوند.

## بهبودهای آینده

قابلیت‌های برنامه‌ریزی‌شده:

- [ ] حالت زمینه مشترک (عامل‌ها پاسخ‌های یکدیگر را می‌بینند)
- [ ] هماهنگی عامل‌ها (عامل‌ها می‌توانند به یکدیگر signal بدهند)
- [ ] انتخاب پویای عامل (انتخاب عامل‌ها بر اساس محتوای پیام)
- [ ] اولویت‌های عامل (برخی عامل‌ها پیش از دیگران پاسخ می‌دهند)

## مرتبط

- [مسیریابی کانال](/fa/channels/channel-routing)
- [گروه‌ها](/fa/channels/groups)
- [ابزارهای سندباکس چندعاملی](/fa/tools/multi-agent-sandbox-tools)
- [جفت‌سازی](/fa/channels/pairing)
- [مدیریت نشست](/fa/concepts/session)
