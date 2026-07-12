---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: محدودیت‌های جعبه‌شن و ابزار برای هر عامل، تقدم و مثال‌ها
title: سندباکس و ابزارهای چندعاملی
x-i18n:
    generated_at: "2026-07-12T11:02:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

هر عامل در یک پیکربندی چندعاملی می‌تواند سندباکس سراسری و خط‌مشی ابزار را بازنویسی کند. این صفحه پیکربندی هر عامل، قواعد تقدم و نمونه‌ها را پوشش می‌دهد.

<CardGroup cols={3}>
  <Card title="سندباکس‌سازی" href="/fa/gateway/sandboxing">
    بک‌اندها و حالت‌ها — مرجع کامل سندباکس.
  </Card>
  <Card title="سندباکس در برابر خط‌مشی ابزار در برابر حالت ارتقایافته" href="/fa/gateway/sandbox-vs-tool-policy-vs-elevated">
    اشکال‌زدایی «چرا این مسدود شده است؟»
  </Card>
  <Card title="حالت ارتقایافته" href="/fa/tools/elevated">
    اجرای ارتقایافته برای فرستندگان مورد اعتماد.
  </Card>
</CardGroup>

<Warning>
احراز هویت در محدوده عامل است: هر عامل مخزن احراز هویت `agentDir` مخصوص خود را در `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` دارد. هرگز از یک `agentDir` برای چند عامل استفاده نکنید. عامل‌ها در صورت نداشتن پروفایل محلی می‌توانند پروفایل‌های احراز هویت عامل پیش‌فرض/اصلی را بخوانند، اما توکن‌های نوسازی OAuth در مخزن‌های عامل ثانویه همتاسازی نمی‌شوند. اگر اعتبارنامه‌ها را به‌صورت دستی کپی می‌کنید، فقط پروفایل‌های ایستای قابل‌انتقال `api_key` یا `token` را کپی کنید.
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

    - عامل `main`: روی میزبان اجرا می‌شود و به همه ابزارها دسترسی دارد.
    - عامل `family`: در Docker اجرا می‌شود (یک کانتینر برای هر عامل) و فقط امکان `read` و ارسال پیام در گفت‌وگوی جاری را دارد.

  </Accordion>
  <Accordion title="نمونه ۲: عامل کاری با سندباکس مشترک">
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
  <Accordion title="نمونه ۲ب: پروفایل برنامه‌نویسی سراسری + عامل صرفاً پیام‌رسان">
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

    - عامل‌های پیش‌فرض ابزارهای برنامه‌نویسی را دریافت می‌کنند.
    - عامل `support` صرفاً پیام‌رسان است (+ ابزار Slack).

  </Accordion>
  <Accordion title="نمونه ۳: حالت‌های متفاوت سندباکس برای هر عامل">
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

هنگامی که هم پیکربندی سراسری (`agents.defaults.*`) و هم پیکربندی مختص عامل (`agents.list[].*`) وجود داشته باشند:

### پیکربندی سندباکس

تنظیمات مختص عامل، تنظیمات سراسری را بازنویسی می‌کنند:

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` برای آن عامل، `agents.defaults.sandbox.{docker,browser,prune}.*` را بازنویسی می‌کند (وقتی محدوده سندباکس به `"shared"` منتهی شود، نادیده گرفته می‌شود).
</Note>

### محدودیت‌های ابزار

ترتیب پالایش به این صورت است:

<Steps>
  <Step title="پروفایل ابزار">
    `tools.profile` یا `agents.list[].tools.profile`.
  </Step>
  <Step title="پروفایل ابزار ارائه‌دهنده">
    `tools.byProvider[provider].profile` یا `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="خط‌مشی سراسری ابزار">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="خط‌مشی ابزار ارائه‌دهنده">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="خط‌مشی ابزار مختص عامل">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="خط‌مشی ارائه‌دهنده عامل">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="خط‌مشی ابزار سندباکس">
    `tools.sandbox.tools` یا `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="خط‌مشی ابزار عامل فرعی">
    `tools.subagents.tools`، در صورت کاربرد.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="قواعد تقدم">
    - هر سطح می‌تواند ابزارها را بیشتر محدود کند، اما نمی‌تواند ابزارهای ردشده در سطوح پیشین را دوباره مجاز کند.
    - اگر `agents.list[].tools.sandbox.tools` تنظیم شده باشد، برای آن عامل جایگزین `tools.sandbox.tools` می‌شود.
    - اگر `agents.list[].tools.profile` تنظیم شده باشد، برای آن عامل `tools.profile` را بازنویسی می‌کند.
    - کلیدهای ابزار ارائه‌دهنده، هم `provider` (برای نمونه `google-antigravity`) و هم `provider/model` (برای نمونه `openai/gpt-5.4`) را می‌پذیرند.

  </Accordion>
  <Accordion title="رفتار فهرست مجاز خالی">
    اگر هر فهرست مجاز صریحی در این زنجیره باعث شود اجرای عامل هیچ ابزار قابل‌فراخوانی نداشته باشد، OpenClaw پیش از ارسال اعلان به مدل متوقف می‌شود. این رفتار عمدی است: عاملی که با ابزاری ناموجود مانند `agents.list[].tools.allow: ["query_db"]` پیکربندی شده است، باید تا زمان فعال‌شدن Plugin ثبت‌کننده `query_db` با خطایی آشکار متوقف شود، نه اینکه به‌عنوان عاملی صرفاً متنی ادامه دهد.
  </Accordion>
</AccordionGroup>

خط‌مشی‌های ابزار از صورت‌های کوتاه `group:*` پشتیبانی می‌کنند که به چند ابزار گسترش می‌یابند. برای فهرست کامل، به [گروه‌های ابزار](/fa/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) مراجعه کنید.

بازنویسی‌های ارتقایافته هر عامل (`agents.list[].tools.elevated`) می‌توانند اجرای ارتقایافته را برای عامل‌های مشخص بیشتر محدود کنند. برای جزئیات، به [حالت ارتقایافته](/fa/tools/elevated) مراجعه کنید.

---

## مهاجرت از حالت تک‌عاملی

<Tabs>
  <Tab title="پیش از مهاجرت (تک‌عاملی)">
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
  <Tab title="پس از مهاجرت (چندعاملی)">
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
کلیدهای قدیمی پیکربندی `agents.defaults.*`/`agents.list[].*` (مانند `sandbox.perSession`، `agentRuntime` و `embeddedPi`) به‌وسیله `openclaw doctor` مهاجرت داده می‌شوند؛ از این پس `agents.defaults` + `agents.list` را ترجیح دهید.
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
  <Tab title="اجرای پوسته با ابزارهای سامانه فایل غیرفعال">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    این خط‌مشی ابزارهای سامانه فایل OpenClaw را غیرفعال می‌کند، اما `exec` همچنان یک پوسته است و می‌تواند در هر جایی که سامانه فایل میزبان یا سندباکس انتخاب‌شده اجازه دهد، فایل بنویسد. برای یک عامل فقط‌خواندنی، `exec` و `process` را رد کنید، یا دسترسی پوسته را با کنترل‌های سامانه فایل سندباکس مانند `agents.defaults.sandbox.workspaceAccess: "ro"` یا `"none"` ترکیب کنید.
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

    `sessions_history` در این پروفایل همچنان به‌جای تخلیه متن خام رونوشت، نمای بازیابی محدود و پاک‌سازی‌شده‌ای را برمی‌گرداند. بازیابی دستیار، برچسب‌های تفکر، چارچوب `<relevant-memories>`، محموله‌های XML متن ساده فراخوانی ابزار (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>` و بلوک‌های کوتاه‌شده فراخوانی ابزار)، چارچوب تنزل‌یافته فراخوانی ابزار، توکن‌های کنترلی نشت‌کرده مدل با نویسه‌های ASCII/تمام‌عرض و XML نادرست فراخوانی ابزار MiniMax را پیش از حذف اطلاعات حساس/کوتاه‌سازی حذف می‌کند.

  </Tab>
</Tabs>

---

## دام رایج: `"non-main"`

<Warning>
`agents.defaults.sandbox.mode: "non-main"` کلید نشست را با کلید نشست اصلی مقایسه می‌کند (که همیشه `"main"` است؛ `session.mainKey` به‌وسیله کاربر قابل پیکربندی نیست و OpenClaw درباره هر مقدار دیگری هشدار می‌دهد و آن را نادیده می‌گیرد)، نه شناسه عامل را. نشست‌های گروه/کانال همیشه کلیدهای مخصوص خود را دریافت می‌کنند، بنابراین غیر اصلی در نظر گرفته می‌شوند و در سندباکس قرار می‌گیرند. اگر می‌خواهید عاملی هرگز در سندباکس قرار نگیرد، `agents.list[].sandbox.mode: "off"` را تنظیم کنید.
</Warning>

---

## آزمایش

پس از پیکربندی سندباکس و ابزارهای چندعاملی:

<Steps>
  <Step title="بررسی تفکیک عامل">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="بررسی کانتینرهای سندباکس">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="آزمایش محدودیت‌های ابزار">
    - پیامی ارسال کنید که به ابزارهای محدودشده نیاز داشته باشد.
    - بررسی کنید که عامل نتواند از ابزارهای ردشده استفاده کند.

  </Step>
  <Step title="پایش گزارش‌ها">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## عیب‌یابی

<AccordionGroup>
  <Accordion title="عامل با وجود `mode: 'all'` در سندباکس قرار نگرفته است">
    - بررسی کنید آیا `agents.defaults.sandbox.mode` سراسری وجود دارد که آن را بازنویسی می‌کند.
    - پیکربندی مختص عامل تقدم دارد، بنابراین `agents.list[].sandbox.mode: "all"` را تنظیم کنید.

  </Accordion>
  <Accordion title="ابزارهایی که با وجود فهرست منع همچنان در دسترس‌اند">
    - [ترتیب کامل فیلترسازی](#tool-restrictions) را بررسی کنید: نمایه ← نمایه ارائه‌دهنده ← سیاست سراسری ← سیاست ارائه‌دهنده ← سیاست عامل ← سیاست ارائه‌دهنده عامل ← محیط ایزوله ← زیرعامل.
    - هر سطح فقط می‌تواند محدودیت‌های بیشتری اعمال کند و نمی‌تواند دسترسی را دوباره اعطا کند.
    - برای اشکال‌زدایی گام‌به‌گام، به [محیط ایزوله در برابر سیاست ابزار در برابر حالت ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) مراجعه کنید.

  </Accordion>
  <Accordion title="کانتینر برای هر عامل به‌صورت جداگانه ایزوله نشده است">
    - مقدار پیش‌فرض `scope` برابر با `"agent"` است (یک کانتینر به‌ازای هر شناسه عامل).
    - برای یک کانتینر به‌ازای هر نشست، `scope: "session"` را تنظیم کنید؛ یا برای استفاده مجدد از یک کانتینر میان عامل‌ها، `scope: "shared"` را تنظیم کنید.

  </Accordion>
</AccordionGroup>

---

## مطالب مرتبط

- [حالت ارتقایافته](/fa/tools/elevated)
- [مسیریابی چندعاملی](/fa/concepts/multi-agent)
- [پیکربندی محیط ایزوله](/fa/gateway/config-agents#agentsdefaultssandbox)
- [محیط ایزوله در برابر سیاست ابزار در برابر حالت ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) — اشکال‌زدایی «چرا این مسدود شده است؟»
- [ایزوله‌سازی](/fa/gateway/sandboxing) — مرجع کامل محیط ایزوله (حالت‌ها، دامنه‌ها، بک‌اندها و ایمیج‌ها)
- [مدیریت نشست](/fa/concepts/session)
