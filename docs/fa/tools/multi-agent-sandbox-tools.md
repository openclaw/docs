---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: محیط ایزوله و محدودیت‌های ابزار به ازای هر عامل، ترتیب تقدم، و مثال‌ها
title: محیط ایزوله و ابزارهای چندعاملی
x-i18n:
    generated_at: "2026-04-29T23:44:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

هر agent در یک پیکربندی چند-agent می‌تواند sandbox سراسری و سیاست ابزار را بازنویسی کند. این صفحه پیکربندی برای هر agent، قواعد اولویت، و نمونه‌ها را پوشش می‌دهد.

<CardGroup cols={3}>
  <Card title="ایزوله‌سازی" href="/fa/gateway/sandboxing">
    بک‌اندها و حالت‌ها — مرجع کامل sandbox.
  </Card>
  <Card title="sandbox در برابر سیاست ابزار در برابر ارتقایافته" href="/fa/gateway/sandbox-vs-tool-policy-vs-elevated">
    اشکال‌زدایی «چرا این مسدود شده است؟»
  </Card>
  <Card title="حالت ارتقایافته" href="/fa/tools/elevated">
    اجرای ارتقایافته برای فرستنده‌های مورد اعتماد.
  </Card>
</CardGroup>

<Warning>
احراز هویت بر اساس agent محدوده‌بندی می‌شود: هر agent ذخیره‌گاه احراز هویت `agentDir` خودش را در `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` دارد. هرگز `agentDir` را بین agentها بازاستفاده نکنید. وقتی agentها پروفایل محلی ندارند، می‌توانند پروفایل‌های احراز هویت agent پیش‌فرض/اصلی را بخوانند، اما توکن‌های تازه‌سازی OAuth در ذخیره‌گاه‌های agentهای ثانویه کپی نمی‌شوند. اگر گواهی‌ها را دستی کپی می‌کنید، فقط پروفایل‌های ثابت و قابل‌حمل `api_key` یا `token` را کپی کنید.
</Warning>

---

## نمونه‌های پیکربندی

<AccordionGroup>
  <Accordion title="نمونه ۱: agent شخصی + خانوادگی محدود">
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

    - agent `main`: روی میزبان اجرا می‌شود و دسترسی کامل به ابزارها دارد.
    - agent `family`: در Docker اجرا می‌شود (یک کانتینر برای هر agent)، فقط ابزار `read`.

  </Accordion>
  <Accordion title="نمونه ۲: agent کاری با sandbox مشترک">
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
  <Accordion title="نمونه ۲ب: پروفایل کدنویسی سراسری + agent فقط پیام‌رسانی">
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

    - agentهای پیش‌فرض ابزارهای کدنویسی را دریافت می‌کنند.
    - agent `support` فقط پیام‌رسانی است (+ ابزار Slack).

  </Accordion>
  <Accordion title="نمونه ۳: حالت‌های sandbox متفاوت برای هر agent">
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

وقتی هم پیکربندی‌های سراسری (`agents.defaults.*`) و هم پیکربندی‌های مختص agent (`agents.list[].*`) وجود داشته باشند:

### پیکربندی sandbox

تنظیمات مختص agent تنظیمات سراسری را بازنویسی می‌کنند:

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
`agents.list[].sandbox.{docker,browser,prune}.*` برای آن agent مقدار `agents.defaults.sandbox.{docker,browser,prune}.*` را بازنویسی می‌کند (وقتی محدوده sandbox به `"shared"` resolve شود نادیده گرفته می‌شود).
</Note>

### محدودیت‌های ابزار

ترتیب فیلتر کردن چنین است:

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
  <Step title="سیاست ابزار مختص agent">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="سیاست provider برای agent">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="سیاست ابزار sandbox">
    `tools.sandbox.tools` یا `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="سیاست ابزار subagent">
    `tools.subagents.tools`، اگر قابل اعمال باشد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="قواعد اولویت">
    - هر سطح می‌تواند ابزارها را بیشتر محدود کند، اما نمی‌تواند ابزارهایی را که در سطوح قبلی رد شده‌اند دوباره مجاز کند.
    - اگر `agents.list[].tools.sandbox.tools` تنظیم شده باشد، برای آن agent جایگزین `tools.sandbox.tools` می‌شود.
    - اگر `agents.list[].tools.profile` تنظیم شده باشد، برای آن agent مقدار `tools.profile` را بازنویسی می‌کند.
    - کلیدهای ابزار provider یا `provider` (مثلاً `google-antigravity`) یا `provider/model` (مثلاً `openai/gpt-5.4`) را می‌پذیرند.

  </Accordion>
  <Accordion title="رفتار allowlist خالی">
    اگر هر allowlist صریحی در آن زنجیره باعث شود اجرا هیچ ابزار قابل‌فراخوانی نداشته باشد، OpenClaw پیش از ارسال prompt به مدل متوقف می‌شود. این عمدی است: agentی که با ابزار مفقودی مانند `agents.list[].tools.allow: ["query_db"]` پیکربندی شده است باید تا زمانی که Plugin ثبت‌کننده `query_db` فعال نشده، آشکارا خطا بدهد، نه اینکه به‌عنوان agent فقط متنی ادامه دهد.
  </Accordion>
</AccordionGroup>

سیاست‌های ابزار از میان‌برهای `group:*` پشتیبانی می‌کنند که به چندین ابزار گسترش می‌یابند. برای فهرست کامل، [گروه‌های ابزار](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) را ببینید.

بازنویسی‌های ارتقایافته برای هر agent (`agents.list[].tools.elevated`) می‌توانند اجرای ارتقایافته را برای agentهای خاص بیشتر محدود کنند. برای جزئیات، [حالت ارتقایافته](/fa/tools/elevated) را ببینید.

---

## مهاجرت از عامل واحد

<Tabs>
  <Tab title="Before (single agent)">
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
  <Tab title="After (multi-agent)">
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

## نمونه‌های محدودسازی ابزار

<Tabs>
  <Tab title="Read-only agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Safe execution (no file modifications)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="Communication-only">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` در این پروفایل همچنان به‌جای رونوشت خام مکالمه، یک نمای یادآوری محدود و پاک‌سازی‌شده برمی‌گرداند. یادآوری دستیار برچسب‌های تفکر، داربست `<relevant-memories>`، محموله‌های XML فراخوانی ابزار به‌صورت متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>` و بلوک‌های کوتاه‌شده فراخوانی ابزار)، داربست تنزل‌یافته فراخوانی ابزار، توکن‌های کنترلی مدل ASCII/تمام‌عرض نشت‌کرده، و XML نادرست فراخوانی ابزار MiniMax را پیش از ویرایش/کوتاه‌سازی حذف می‌کند.

  </Tab>
</Tabs>

---

## دام رایج: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` بر پایه `session.mainKey` (پیش‌فرض `"main"`) است، نه شناسه عامل. نشست‌های گروه/کانال همیشه کلیدهای خودشان را می‌گیرند، بنابراین غیر-main تلقی می‌شوند و در sandbox قرار می‌گیرند. اگر می‌خواهید یک عامل هرگز sandbox نشود، `agents.list[].sandbox.mode: "off"` را تنظیم کنید.
</Warning>

---

## آزمایش

پس از پیکربندی sandbox و ابزارهای چندعامله:

<Steps>
  <Step title="Check agent resolution">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verify sandbox containers">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Test tool restrictions">
    - پیامی ارسال کنید که به ابزارهای محدودشده نیاز دارد.
    - تأیید کنید که عامل نمی‌تواند از ابزارهای ردشده استفاده کند.

  </Step>
  <Step title="Monitor logs">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Agent not sandboxed despite `mode: 'all'`">
    - بررسی کنید آیا یک `agents.defaults.sandbox.mode` سراسری وجود دارد که آن را بازنویسی می‌کند.
    - پیکربندی اختصاصی عامل اولویت دارد، بنابراین `agents.list[].sandbox.mode: "all"` را تنظیم کنید.

  </Accordion>
  <Accordion title="Tools still available despite deny list">
    - ترتیب فیلتر ابزار را بررسی کنید: سراسری → عامل → sandbox → زیرعامل.
    - هر سطح فقط می‌تواند محدودیت بیشتری اعمال کند، نه اینکه دسترسی را دوباره اعطا کند.
    - با لاگ‌ها تأیید کنید: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container not isolated per agent">
    - در پیکربندی sandbox اختصاصی عامل، `scope: "agent"` را تنظیم کنید.
    - پیش‌فرض `"session"` است که برای هر نشست یک کانتینر ایجاد می‌کند.

  </Accordion>
</AccordionGroup>

---

## مرتبط

- [حالت ارتقایافته](/fa/tools/elevated)
- [مسیریابی چندعامله](/fa/concepts/multi-agent)
- [پیکربندی sandbox](/fa/gateway/config-agents#agentsdefaultssandbox)
- [sandbox در برابر سیاست ابزار در برابر ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) — عیب‌یابی «چرا این مسدود شده است؟»
- [sandbox کردن](/fa/gateway/sandboxing) — مرجع کامل sandbox (حالت‌ها، دامنه‌ها، backendها، imageها)
- [مدیریت نشست](/fa/concepts/session)
