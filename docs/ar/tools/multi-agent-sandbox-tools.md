---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: قيود sandbox والأدوات لكل وكيل، وترتيب الأولوية، والأمثلة
title: sandbox والأدوات متعددة الوكلاء
x-i18n:
    generated_at: "2026-04-26T11:41:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

يمكن لكل وكيل في إعداد متعدد الوكلاء أن يتجاوز سياسة sandbox والأدوات العامة. تغطي هذه الصفحة الإعدادات الخاصة بكل وكيل، وقواعد ترتيب الأولوية، والأمثلة.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/ar/gateway/sandboxing">
    الواجهات الخلفية والأوضاع — المرجع الكامل لـ sandbox.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/ar/gateway/sandbox-vs-tool-policy-vs-elevated">
    تصحيح "لماذا تم حظر هذا؟"
  </Card>
  <Card title="Elevated mode" href="/ar/tools/elevated">
    تنفيذ Elevated للمرسلين الموثوقين.
  </Card>
</CardGroup>

<Warning>
المصادقة خاصة بكل وكيل: يقرأ كل وكيل من مخزن المصادقة الخاص به في `agentDir` عند `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. بيانات الاعتماد **غير** مشتركة بين الوكلاء. لا تعِد استخدام `agentDir` بين الوكلاء مطلقًا. إذا أردت مشاركة بيانات الاعتماد، فانسخ `auth-profiles.json` إلى `agentDir` الخاص بالوكيل الآخر.
</Warning>

---

## أمثلة الإعدادات

<AccordionGroup>
  <Accordion title="المثال 1: وكيل شخصي + وكيل عائلي مقيّد">
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

    **النتيجة:**

    - الوكيل `main`: يعمل على المضيف، مع وصول كامل إلى الأدوات.
    - الوكيل `family`: يعمل داخل Docker (حاوية واحدة لكل وكيل)، وبأداة `read` فقط.

  </Accordion>
  <Accordion title="المثال 2: وكيل عمل مع sandbox مشتركة">
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
  <Accordion title="المثال 2b: ملف تعريف برمجي عام + وكيل للمراسلة فقط">
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

    **النتيجة:**

    - الوكلاء الافتراضيون يحصلون على أدوات البرمجة.
    - الوكيل `support` مخصّص للمراسلة فقط (+ أداة Slack).

  </Accordion>
  <Accordion title="المثال 3: أوضاع sandbox مختلفة لكل وكيل">
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

## أولوية الإعدادات

عند وجود إعدادات عامة (`agents.defaults.*`) وإعدادات خاصة بالوكيل (`agents.list[].*`) معًا:

### إعدادات sandbox

تتجاوز الإعدادات الخاصة بالوكيل الإعدادات العامة:

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
تتجاوز `agents.list[].sandbox.{docker,browser,prune}.*` القيم في `agents.defaults.sandbox.{docker,browser,prune}.*` لذلك الوكيل (ويُتجاهل هذا عندما يُحل نطاق sandbox إلى `"shared"`).
</Note>

### قيود الأدوات

ترتيب التصفية هو:

<Steps>
  <Step title="ملف تعريف الأداة">
    `tools.profile` أو `agents.list[].tools.profile`.
  </Step>
  <Step title="ملف تعريف أدوات المزوّد">
    `tools.byProvider[provider].profile` أو `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="سياسة الأدوات العامة">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="سياسة أدوات المزوّد">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="سياسة الأدوات الخاصة بالوكيل">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="سياسة مزوّد الوكيل">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="سياسة أدوات sandbox">
    `tools.sandbox.tools` أو `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="سياسة أدوات الوكيل الفرعي">
    `tools.subagents.tools`، إذا كانت منطبقة.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="قواعد الأولوية">
    - يمكن لكل مستوى أن يقيّد الأدوات أكثر، لكنه لا يمكنه إعادة منح أدوات رُفضت في مستويات سابقة.
    - إذا تم تعيين `agents.list[].tools.sandbox.tools`، فإنه يستبدل `tools.sandbox.tools` لذلك الوكيل.
    - إذا تم تعيين `agents.list[].tools.profile`، فإنه يتجاوز `tools.profile` لذلك الوكيل.
    - تقبل مفاتيح أدوات المزوّد إما `provider` (مثل `google-antigravity`) أو `provider/model` (مثل `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="سلوك قائمة السماح الفارغة">
    إذا أدّت أي قائمة سماح صريحة في هذه السلسلة إلى عدم بقاء أي أدوات قابلة للاستدعاء أثناء التشغيل، فإن OpenClaw يتوقف قبل إرسال prompt إلى النموذج. هذا مقصود: يجب أن يفشل الوكيل المضبوط بأداة مفقودة مثل `agents.list[].tools.allow: ["query_db"]` بشكل واضح إلى أن يتم تفعيل Plugin التي تسجّل `query_db`، لا أن يستمر كوكيل نصي فقط.
  </Accordion>
</AccordionGroup>

تدعم سياسات الأدوات الصيغ المختصرة `group:*` التي تتوسع إلى عدة أدوات. راجع [مجموعات الأدوات](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) للاطلاع على القائمة الكاملة.

يمكن لتجاوزات Elevated الخاصة بكل وكيل (`agents.list[].tools.elevated`) أن تقيّد تنفيذ Elevated أكثر لوكلاء محددين. راجع [Elevated mode](/ar/tools/elevated) للتفاصيل.

---

## الترحيل من وكيل واحد

<Tabs>
  <Tab title="قبل (وكيل واحد)">
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
  <Tab title="بعد (متعدد الوكلاء)">
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
تُرحَّل إعدادات `agent.*` القديمة بواسطة `openclaw doctor`؛ ويُفضَّل استخدام `agents.defaults` + `agents.list` مستقبلًا.
</Note>

---

## أمثلة على قيود الأدوات

<Tabs>
  <Tab title="وكيل للقراءة فقط">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="تنفيذ آمن (من دون تعديل ملفات)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="اتصال فقط">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    يظل `sessions_history` في ملف التعريف هذا يعرض عرض استدعاء محدودًا ومنقّى بدلًا من تفريغ نص منسوخ خام. يقوم استدعاء المساعد بإزالة وسوم Thinking، وبنية `<relevant-memories>`، وحمولات XML النصية العادية لاستدعاءات الأدوات (بما في ذلك `<tool_call>...</tool_call>`، و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`، و`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المقتطعة)، وبنية استدعاءات الأدوات المخفّضة، ورموز التحكم الخاصة بالنموذج المتسربة بصيغة ASCII/العرض الكامل، وXML استدعاءات أدوات MiniMax المشوّه قبل التنقيح/الاقتطاع.

  </Tab>
</Tabs>

---

## مطب شائع: `"non-main"`

<Warning>
تعتمد `agents.defaults.sandbox.mode: "non-main"` على `session.mainKey` (الافتراضي `"main"`)، وليس على معرّف الوكيل. تحصل جلسات المجموعات/القنوات دائمًا على مفاتيحها الخاصة، لذا تُعامل على أنها non-main وسيُطبَّق عليها sandbox. إذا أردت ألّا يدخل وكيل ما sandbox مطلقًا، فاضبط `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## الاختبار

بعد إعداد sandbox والأدوات في بيئة متعددة الوكلاء:

<Steps>
  <Step title="التحقق من حل الوكيل">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="التحقق من حاويات sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="اختبار قيود الأدوات">
    - أرسل رسالة تتطلب أدوات مقيّدة.
    - تحقّق من أن الوكيل لا يمكنه استخدام الأدوات المرفوضة.

  </Step>
  <Step title="مراقبة السجلات">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الوكيل غير معزول داخل sandbox رغم `mode: 'all'`">
    - تحقّق مما إذا كانت هناك قيمة عامة في `agents.defaults.sandbox.mode` تتجاوزها.
    - إعدادات الوكيل الخاصة لها الأولوية، لذا اضبط `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="الأدوات ما تزال متاحة رغم قائمة الرفض">
    - تحقّق من ترتيب تصفية الأدوات: عام → وكيل → sandbox → وكيل فرعي.
    - يمكن لكل مستوى أن يقيّد فقط، ولا يمكنه إعادة منح الأدوات.
    - تحقّق عبر السجلات: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="الحاوية غير معزولة لكل وكيل">
    - اضبط `scope: "agent"` في إعدادات sandbox الخاصة بالوكيل.
    - القيمة الافتراضية هي `"session"`، ما ينشئ حاوية واحدة لكل جلسة.

  </Accordion>
</AccordionGroup>

---

## ذو صلة

- [Elevated mode](/ar/tools/elevated)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [إعدادات sandbox](/ar/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs tool policy vs elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) — تصحيح "لماذا تم حظر هذا؟"
- [Sandboxing](/ar/gateway/sandboxing) — المرجع الكامل لـ sandbox (الأوضاع، والنطاقات، والواجهات الخلفية، والصور)
- [إدارة الجلسات](/ar/concepts/session)
