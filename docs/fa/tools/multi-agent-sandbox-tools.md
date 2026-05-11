---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: محیط ایزوله و محدودیت‌های ابزار برای هر عامل، اولویت، و نمونه‌ها
title: محیط ایزوله و ابزارهای چندعاملی
x-i18n:
    generated_at: "2026-05-11T20:45:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

هر عامل در یک چیدمان چندعامله می‌تواند Sandbox و سیاست ابزار سراسری را بازنویسی کند. این صفحه پیکربندی به‌ازای هر عامل، قواعد تقدم، و نمونه‌ها را پوشش می‌دهد.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/fa/gateway/sandboxing">
    بک‌اندها و حالت‌ها — مرجع کامل Sandbox.
  </Card>
  <Card title="Sandbox در برابر سیاست ابزار در برابر elevated" href="/fa/gateway/sandbox-vs-tool-policy-vs-elevated">
    اشکال‌زدایی «چرا این مسدود شده است؟»
  </Card>
  <Card title="حالت elevated" href="/fa/tools/elevated">
    اجرای elevated برای فرستندگان مورد اعتماد.
  </Card>
</CardGroup>

<Warning>
احراز هویت بر اساس عامل محدود می‌شود: هر عامل ذخیره‌گاه احراز هویت `agentDir` خودش را در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` دارد. هرگز `agentDir` را بین عامل‌ها بازاستفاده نکنید. عامل‌ها وقتی پروفایل محلی ندارند می‌توانند پروفایل‌های احراز هویت عامل پیش‌فرض/اصلی را بخوانند، اما توکن‌های تازه‌سازی OAuth در ذخیره‌گاه‌های عامل‌های ثانویه کپی نمی‌شوند. اگر اعتبارنامه‌ها را دستی کپی می‌کنید، فقط پروفایل‌های ایستای قابل‌حمل `api_key` یا `token` را کپی کنید.
</Warning>

---

## نمونه‌های پیکربندی

<AccordionGroup>
  <Accordion title="نمونه ۱: عامل شخصی + عامل خانوادگی محدود">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "name": "Personal Assistant",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "Family Bot",
            "workspace": "~/.openclaw/workspace-family",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read", "message"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"],
              "message": {
                "crossContext": {
                  "allowWithinProvider": false,
                  "allowAcrossProviders": false
                }
              }
            }
          }
        ]
      },
      "bindings": [
        {
          "agentId": "family",
          "match": {
            "provider": "whatsapp",
            "accountId": "*",
            "peer": {
              "kind": "group",
              "id": "120363424282127706@g.us"
            }
          }
        }
      ]
    }
    ```

    **نتیجه:**

    - عامل `main`: روی میزبان اجرا می‌شود و دسترسی کامل به ابزارها دارد.
    - عامل `family`: در Docker اجرا می‌شود (یک کانتینر برای هر عامل)، فقط `read` و ارسال پیام در گفت‌وگوی فعلی.

  </Accordion>
  <Accordion title="نمونه ۲: عامل کاری با Sandbox مشترک">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "personal",
            "workspace": "~/.openclaw/workspace-personal",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "work",
            "workspace": "~/.openclaw/workspace-work",
            "sandbox": {
              "mode": "all",
              "scope": "shared",
              "workspaceRoot": "/tmp/work-sandboxes"
            },
            "tools": {
              "allow": ["read", "write", "apply_patch", "exec"],
              "deny": ["browser", "gateway", "discord"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="نمونه ۲ب: پروفایل کدنویسی سراسری + عامل فقط پیام‌رسانی">
    ```json
    {
      "tools": { "profile": "coding" },
      "agents": {
        "list": [
          {
            "id": "support",
            "tools": { "profile": "messaging", "allow": ["slack"] }
          }
        ]
      }
    }
    ```

    **نتیجه:**

    - عامل‌های پیش‌فرض ابزارهای کدنویسی را دریافت می‌کنند.
    - عامل `support` فقط پیام‌رسانی است (+ ابزار Slack).

  </Accordion>
  <Accordion title="نمونه ۳: حالت‌های Sandbox متفاوت برای هر عامل">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

---

## تقدم پیکربندی

وقتی هم پیکربندی سراسری (`agents.defaults.*`) و هم پیکربندی ویژه عامل (`agents.list[].*`) وجود داشته باشد:

### پیکربندی Sandbox

تنظیمات ویژه عامل، تنظیمات سراسری را بازنویسی می‌کنند:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` مقدار `agents.defaults.sandbox.{docker,browser,prune}.*` را برای آن عامل بازنویسی می‌کند (وقتی دامنه Sandbox به `"shared"` حل شود نادیده گرفته می‌شود).
</Note>

### محدودیت‌های ابزار

ترتیب فیلتر کردن این است:

<Steps>
  <Step title="پروفایل ابزار">
    `tools.profile` یا `agents.list[].tools.profile`.
  </Step>
  <Step title="پروفایل ابزار ارائه‌دهنده">
    `tools.byProvider[provider].profile` یا `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="سیاست ابزار سراسری">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="سیاست ابزار ارائه‌دهنده">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="سیاست ابزار ویژه عامل">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="سیاست ارائه‌دهنده عامل">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="سیاست ابزار Sandbox">
    `tools.sandbox.tools` یا `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="سیاست ابزار عامل فرعی">
    `tools.subagents.tools`، اگر قابل اعمال باشد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="قواعد تقدم">
    - هر سطح می‌تواند ابزارها را بیشتر محدود کند، اما نمی‌تواند ابزارهایی را که در سطوح قبلی رد شده‌اند دوباره مجاز کند.
    - اگر `agents.list[].tools.sandbox.tools` تنظیم شده باشد، برای آن عامل جایگزین `tools.sandbox.tools` می‌شود.
    - اگر `agents.list[].tools.profile` تنظیم شده باشد، برای آن عامل `tools.profile` را بازنویسی می‌کند.
    - کلیدهای ابزار ارائه‌دهنده می‌توانند یا `provider` (مثلاً `google-antigravity`) یا `provider/model` (مثلاً `openai/gpt-5.4`) باشند.

  </Accordion>
  <Accordion title="رفتار فهرست مجاز خالی">
    اگر هر فهرست مجاز صریحی در آن زنجیره اجرا را بدون هیچ ابزار قابل‌فراخوانی باقی بگذارد، OpenClaw پیش از ارسال پرامپت به مدل متوقف می‌شود. این عمدی است: عاملی که با یک ابزار مفقود مانند `agents.list[].tools.allow: ["query_db"]` پیکربندی شده است باید تا زمانی که Plugin ثبت‌کننده `query_db` فعال شود با خطای آشکار متوقف شود، نه اینکه به‌عنوان عامل فقط متنی ادامه دهد.
  </Accordion>
</AccordionGroup>

سیاست‌های ابزار از میان‌برهای `group:*` پشتیبانی می‌کنند که به چند ابزار گسترش می‌یابند. برای فهرست کامل، [گروه‌های ابزار](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) را ببینید.

بازنویسی‌های elevated به‌ازای هر عامل (`agents.list[].tools.elevated`) می‌توانند اجرای elevated را برای عامل‌های مشخص بیشتر محدود کنند. برای جزئیات، [حالت elevated](/fa/tools/elevated) را ببینید.

---

## مهاجرت از عامل تک‌عاملی

<Tabs>
  <Tab title="قبل (عامل تک‌عاملی)">
    ```json
    {
      "agents": {
        "defaults": {
          "workspace": "~/.openclaw/workspace",
          "sandbox": {
            "mode": "non-main"
          }
        }
      },
      "tools": {
        "sandbox": {
          "tools": {
            "allow": ["read", "write", "apply_patch", "exec"],
            "deny": []
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="بعد (چندعاملی)">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
پیکربندی‌های قدیمی `agent.*` توسط `openclaw doctor` مهاجرت داده می‌شوند؛ از این به بعد `agents.defaults` + `agents.list` را ترجیح دهید.
</Note>

---

## نمونه‌های محدودسازی ابزار

<Tabs>
  <Tab title="عامل فقط‌خواندنی">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="اجرای shell با ابزارهای فایل‌سیستم غیرفعال">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    این سیاست ابزارهای فایل‌سیستم OpenClaw را غیرفعال می‌کند، اما `exec` همچنان یک shell است و می‌تواند هرجا که میزبان انتخاب‌شده یا فایل‌سیستم sandbox اجازه دهد فایل بنویسد. برای یک عامل فقط‌خواندنی، `exec` و `process` را رد کنید، یا دسترسی shell را با کنترل‌های فایل‌سیستم sandbox مانند `agents.defaults.sandbox.workspaceAccess: "ro"` یا `"none"` ترکیب کنید.
    </Warning>

  </Tab>
  <Tab title="فقط ارتباطات">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` در این پروفایل همچنان به‌جای dump خام رونوشت، یک نمای یادآوری محدود و پاک‌سازی‌شده برمی‌گرداند. یادآوری دستیار برچسب‌های تفکر، داربست `<relevant-memories>`، payloadهای XML فراخوانی ابزار به‌صورت متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>` و بلوک‌های کوتاه‌شده فراخوانی ابزار)، داربست فراخوانی ابزار تنزل‌یافته، توکن‌های کنترلی مدل نشت‌کرده ASCII/تمام‌عرض، و XML بدشکل فراخوانی ابزار MiniMax را پیش از پوشاندن/کوتاه‌سازی حذف می‌کند.

  </Tab>
</Tabs>

---

## خطای رایج: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` بر پایه `session.mainKey` (پیش‌فرض `"main"`) است، نه شناسه عامل. نشست‌های گروه/کانال همیشه کلیدهای خودشان را می‌گیرند، بنابراین non-main در نظر گرفته می‌شوند و sandbox خواهند شد. اگر می‌خواهید یک عامل هرگز sandbox نشود، `agents.list[].sandbox.mode: "off"` را تنظیم کنید.
</Warning>

---

## آزمایش

پس از پیکربندی sandbox و ابزارهای چندعاملی:

<Steps>
  <Step title="بررسی تفکیک عامل">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="تأیید کانتینرهای sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="آزمایش محدودیت‌های ابزار">
    - پیامی ارسال کنید که به ابزارهای محدودشده نیاز داشته باشد.
    - تأیید کنید که عامل نمی‌تواند از ابزارهای ردشده استفاده کند.

  </Step>
  <Step title="پایش گزارش‌ها">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## عیب‌یابی

<AccordionGroup>
  <Accordion title="عامل با وجود `mode: 'all'` در sandbox نیست">
    - بررسی کنید آیا یک `agents.defaults.sandbox.mode` سراسری وجود دارد که آن را override می‌کند.
    - پیکربندی اختصاصی عامل اولویت دارد، بنابراین `agents.list[].sandbox.mode: "all"` را تنظیم کنید.

  </Accordion>
  <Accordion title="ابزارها با وجود فهرست deny همچنان در دسترس هستند">
    - ترتیب فیلترکردن ابزارها را بررسی کنید: سراسری → عامل → sandbox → زیرعامل.
    - هر سطح فقط می‌تواند بیشتر محدود کند، نه اینکه دوباره مجوز بدهد.
    - با گزارش‌ها تأیید کنید: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="کانتینر برای هر عامل ایزوله نیست">
    - در پیکربندی sandbox اختصاصی عامل، `scope: "agent"` را تنظیم کنید.
    - پیش‌فرض `"session"` است که برای هر نشست یک کانتینر ایجاد می‌کند.

  </Accordion>
</AccordionGroup>

---

## مرتبط

- [حالت ارتقایافته](/fa/tools/elevated)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
- [پیکربندی سندباکس](/fa/gateway/config-agents#agentsdefaultssandbox)
- [سندباکس در برابر سیاست ابزار در برابر ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) — اشکال‌زدایی «چرا این مسدود شده است؟»
- [سندباکسینگ](/fa/gateway/sandboxing) — مرجع کامل سندباکس (حالت‌ها، دامنه‌ها، بک‌اندها، ایمیج‌ها)
- [مدیریت نشست](/fa/concepts/session)
