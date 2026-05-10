---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: سندباکس و محدودیت‌های ابزار به‌ازای هر عامل، تقدم، و مثال‌ها
title: محیط ایزوله و ابزارهای چندعامله
x-i18n:
    generated_at: "2026-05-10T20:10:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c988613438f2d179b859902d3f7a39a1e29b60a0e2ae6ed598bb5f5881cf0b9f
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

هر عامل در یک راه‌اندازی چندعاملی می‌تواند sandbox و سیاست ابزار سراسری را بازنویسی کند. این صفحه پیکربندی به‌ازای هر عامل، قواعد اولویت، و مثال‌ها را پوشش می‌دهد.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/fa/gateway/sandboxing">
    backendها و حالت‌ها — مرجع کامل sandbox.
  </Card>
  <Card title="sandbox در برابر سیاست ابزار در برابر elevated" href="/fa/gateway/sandbox-vs-tool-policy-vs-elevated">
    اشکال‌زدایی «چرا این مسدود شده است؟»
  </Card>
  <Card title="حالت elevated" href="/fa/tools/elevated">
    اجرای elevated برای فرستندگان مورد اعتماد.
  </Card>
</CardGroup>

<Warning>
احراز هویت بر اساس عامل محدوده‌بندی می‌شود: هر عامل فروشگاه احراز هویت `agentDir` خودش را در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` دارد. هرگز `agentDir` را بین عامل‌ها دوباره استفاده نکنید. وقتی عامل‌ها پروفایل محلی ندارند، می‌توانند پروفایل‌های احراز هویت عامل پیش‌فرض/اصلی را بخوانند، اما توکن‌های تازه‌سازی OAuth در فروشگاه‌های عامل ثانویه clone نمی‌شوند. اگر اعتبارنامه‌ها را دستی کپی می‌کنید، فقط پروفایل‌های ایستای قابل‌حمل `api_key` یا `token` را کپی کنید.
</Warning>

---

## مثال‌های پیکربندی

<AccordionGroup>
  <Accordion title="مثال ۱: عامل شخصی + عامل خانوادگی محدودشده">
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
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
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

    - عامل `main`: روی میزبان اجرا می‌شود، با دسترسی کامل به ابزارها.
    - عامل `family`: در Docker اجرا می‌شود (یک container به‌ازای هر عامل)، فقط ابزار `read`.

  </Accordion>
  <Accordion title="مثال ۲: عامل کاری با sandbox مشترک">
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
  <Accordion title="مثال ۲ب: پروفایل کدنویسی سراسری + عامل فقط پیام‌رسانی">
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
  <Accordion title="مثال ۳: حالت‌های sandbox متفاوت برای هر عامل">
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

## اولویت پیکربندی

وقتی هر دو پیکربندی سراسری (`agents.defaults.*`) و مخصوص عامل (`agents.list[].*`) وجود داشته باشند:

### پیکربندی sandbox

تنظیمات مخصوص عامل، تنظیمات سراسری را بازنویسی می‌کنند:

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
`agents.list[].sandbox.{docker,browser,prune}.*` برای آن عامل `agents.defaults.sandbox.{docker,browser,prune}.*` را بازنویسی می‌کند (وقتی محدوده sandbox به `"shared"` حل شود نادیده گرفته می‌شود).
</Note>

### محدودیت‌های ابزار

ترتیب فیلتر کردن این است:

<Steps>
  <Step title="پروفایل ابزار">
    `tools.profile` یا `agents.list[].tools.profile`.
  </Step>
  <Step title="پروفایل ابزار provider">
    `tools.byProvider[provider].profile` یا `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="سیاست ابزار سراسری">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="سیاست ابزار provider">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="سیاست ابزار مخصوص عامل">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="سیاست provider عامل">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="سیاست ابزار sandbox">
    `tools.sandbox.tools` یا `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="سیاست ابزار زیرعامل">
    `tools.subagents.tools`، اگر قابل اعمال باشد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="قواعد اولویت">
    - هر سطح می‌تواند ابزارها را بیشتر محدود کند، اما نمی‌تواند ابزارهایی را که در سطح‌های قبلی رد شده‌اند دوباره مجاز کند.
    - اگر `agents.list[].tools.sandbox.tools` تنظیم شده باشد، برای آن عامل جایگزین `tools.sandbox.tools` می‌شود.
    - اگر `agents.list[].tools.profile` تنظیم شده باشد، برای آن عامل `tools.profile` را بازنویسی می‌کند.
    - کلیدهای ابزار provider یا `provider` (برای مثال `google-antigravity`) یا `provider/model` (برای مثال `openai/gpt-5.4`) را می‌پذیرند.

  </Accordion>
  <Accordion title="رفتار allowlist خالی">
    اگر هر allowlist صریح در آن زنجیره باعث شود اجرا هیچ ابزار قابل فراخوانی نداشته باشد، OpenClaw قبل از ارسال prompt به مدل متوقف می‌شود. این عمدی است: عاملی که با یک ابزار غایب مانند `agents.list[].tools.allow: ["query_db"]` پیکربندی شده است باید تا زمانی که Plugin ثبت‌کننده `query_db` فعال نشده با خطای واضح شکست بخورد، نه اینکه به‌عنوان یک عامل فقط متنی ادامه دهد.
  </Accordion>
</AccordionGroup>

سیاست‌های ابزار از میان‌برهای `group:*` پشتیبانی می‌کنند که به چند ابزار گسترش می‌یابند. برای فهرست کامل، [گروه‌های ابزار](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) را ببینید.

بازنویسی‌های elevated به‌ازای هر عامل (`agents.list[].tools.elevated`) می‌توانند اجرای elevated را برای عامل‌های خاص بیشتر محدود کنند. برای جزئیات، [حالت elevated](/fa/tools/elevated) را ببینید.

---

## مهاجرت از تک‌عامل

<Tabs>
  <Tab title="قبل (تک‌عامل)">
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
  <Tab title="بعد (چندعامل)">
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
پیکربندی‌های قدیمی `agent.*` توسط `openclaw doctor` مهاجرت داده می‌شوند؛ از این پس `agents.defaults` + `agents.list` را ترجیح دهید.
</Note>

---

## مثال‌های محدودیت ابزار

<Tabs>
  <Tab title="عامل فقط خواندنی">
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
    این سیاست ابزارهای فایل‌سیستم OpenClaw را غیرفعال می‌کند، اما `exec` همچنان یک shell است و می‌تواند هر جا که فایل‌سیستم میزبان یا sandbox انتخاب‌شده اجازه دهد، فایل بنویسد. برای یک عامل فقط خواندنی، `exec` و `process` را رد کنید، یا دسترسی shell را با کنترل‌های فایل‌سیستم sandbox مانند `agents.defaults.sandbox.workspaceAccess: "ro"` یا `"none"` ترکیب کنید.
    </Warning>

  </Tab>
  <Tab title="فقط ارتباطی">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` در این پروفایل همچنان یک نمای یادآوری محدود و پاک‌سازی‌شده برمی‌گرداند، نه یک dump خام از transcript. یادآوری assistant تگ‌های thinking، چارچوب `<relevant-memories>`، payloadهای XML فراخوانی ابزار به‌صورت متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های کوتاه‌شده فراخوانی ابزار)، چارچوب فراخوانی ابزار تنزل‌داده‌شده، توکن‌های کنترلی مدل لو رفته ASCII/تمام‌عرض، و XML بدشکل فراخوانی ابزار MiniMax را پیش از redaction/truncation حذف می‌کند.

  </Tab>
</Tabs>

---

## دام رایج: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` بر اساس `session.mainKey` (پیش‌فرض `"main"`) است، نه شناسه عامل. نشست‌های گروه/کانال همیشه کلیدهای خودشان را می‌گیرند، بنابراین به‌عنوان غیر اصلی در نظر گرفته می‌شوند و sandbox می‌شوند. اگر می‌خواهید یک عامل هرگز sandbox نشود، `agents.list[].sandbox.mode: "off"` را تنظیم کنید.
</Warning>

---

## آزمون

پس از پیکربندی sandbox و ابزارهای چندعاملی:

<Steps>
  <Step title="بررسی حل‌وفصل عامل">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="راستی‌آزمایی containerهای sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="آزمون محدودیت‌های ابزار">
    - پیامی ارسال کنید که به ابزارهای محدودشده نیاز دارد.
    - راستی‌آزمایی کنید که عامل نمی‌تواند از ابزارهای ردشده استفاده کند.

  </Step>
  <Step title="پایش logها">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## عیب‌یابی

<AccordionGroup>
  <Accordion title="عامل با وجود `mode: 'all'` در sandbox نیست">
    - بررسی کنید آیا یک `agents.defaults.sandbox.mode` سراسری وجود دارد که آن را بازنویسی می‌کند.
    - پیکربندی مخصوص عامل اولویت دارد، پس `agents.list[].sandbox.mode: "all"` را تنظیم کنید.

  </Accordion>
  <Accordion title="ابزارها با وجود فهرست deny همچنان در دسترس هستند">
    - ترتیب فیلتر کردن ابزار را بررسی کنید: سراسری → عامل → sandbox → زیرعامل.
    - هر سطح فقط می‌تواند بیشتر محدود کند، نه اینکه دوباره مجوز بدهد.
    - با logها راستی‌آزمایی کنید: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="container به‌ازای هر عامل ایزوله نیست">
    - در پیکربندی sandbox مخصوص عامل، `scope: "agent"` را تنظیم کنید.
    - مقدار پیش‌فرض `"session"` است که به‌ازای هر نشست یک container می‌سازد.

  </Accordion>
</AccordionGroup>

---

## مرتبط

- [حالت ارتقایافته](/fa/tools/elevated)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
- [پیکربندی سندباکس](/fa/gateway/config-agents#agentsdefaultssandbox)
- [سندباکس در برابر سیاست ابزار در برابر ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) — اشکال‌زدایی "چرا این مسدود شده است؟"
- [سندباکسینگ](/fa/gateway/sandboxing) — مرجع کامل سندباکس (حالت‌ها، دامنه‌ها، بک‌اندها، تصاویر)
- [مدیریت نشست](/fa/concepts/session)
