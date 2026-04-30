---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: قيود بيئة العزل والأدوات لكل وكيل، والأسبقية، والأمثلة
title: بيئة عزل وأدوات متعددة الوكلاء
x-i18n:
    generated_at: "2026-04-30T08:31:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

يمكن لكل وكيل في إعداد متعدد الوكلاء تجاوز سياسة العزل والأدوات العامة. تغطي هذه الصفحة إعدادات التكوين لكل وكيل، وقواعد الأسبقية، وأمثلة.

<CardGroup cols={3}>
  <Card title="العزل" href="/ar/gateway/sandboxing">
    الواجهات الخلفية والأوضاع — مرجع العزل الكامل.
  </Card>
  <Card title="العزل مقابل سياسة الأدوات مقابل الوضع المرتفع" href="/ar/gateway/sandbox-vs-tool-policy-vs-elevated">
    تصحيح "لماذا تم حظر هذا؟"
  </Card>
  <Card title="الوضع المرتفع" href="/ar/tools/elevated">
    تنفيذ مرتفع للمرسلين الموثوقين.
  </Card>
</CardGroup>

<Warning>
تتم مصادقة كل وكيل ضمن نطاقه: لكل وكيل مخزن مصادقة `agentDir` خاص به في `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. لا تعِد استخدام `agentDir` مطلقًا بين الوكلاء. يمكن للوكلاء القراءة من ملفات تعريف المصادقة الخاصة بالوكيل الافتراضي/الرئيسي عندما لا يكون لديهم ملف تعريف محلي، لكن رموز تحديث OAuth لا تُنسخ إلى مخازن الوكلاء الثانوية. إذا نسخت بيانات الاعتماد يدويًا، فانسخ فقط ملفات تعريف `api_key` أو `token` الثابتة القابلة للنقل.
</Warning>

---

## أمثلة التكوين

<AccordionGroup>
  <Accordion title="مثال 1: وكيل شخصي + وكيل عائلي مقيّد">
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

    - وكيل `main`: يعمل على المضيف، مع وصول كامل إلى الأدوات.
    - وكيل `family`: يعمل في Docker (حاوية واحدة لكل وكيل)، مع أداة `read` فقط.

  </Accordion>
  <Accordion title="مثال 2: وكيل عمل بعزل مشترك">
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
  <Accordion title="مثال 2ب: ملف تعريف ترميز عام + وكيل مراسلة فقط">
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

    - تحصل الوكلاء الافتراضيون على أدوات الترميز.
    - وكيل `support` مخصص للمراسلة فقط (+ أداة Slack).

  </Accordion>
  <Accordion title="مثال 3: أوضاع عزل مختلفة لكل وكيل">
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

## أسبقية التكوين

عند وجود تكوينات عامة (`agents.defaults.*`) وخاصة بالوكيل (`agents.list[].*`) معًا:

### تكوين العزل

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
يتجاوز `agents.list[].sandbox.{docker,browser,prune}.*` قيمة `agents.defaults.sandbox.{docker,browser,prune}.*` لذلك الوكيل (ويُتجاهل عندما يُحل نطاق العزل إلى `"shared"`).
</Note>

### قيود الأدوات

ترتيب التصفية هو:

<Steps>
  <Step title="ملف تعريف الأداة">
    `tools.profile` أو `agents.list[].tools.profile`.
  </Step>
  <Step title="ملف تعريف أداة المزوّد">
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
  <Step title="سياسة أدوات العزل">
    `tools.sandbox.tools` أو `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="سياسة أدوات الوكيل الفرعي">
    `tools.subagents.tools`، إن كان ذلك منطبقًا.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="قواعد الأسبقية">
    - يمكن لكل مستوى تقييد الأدوات أكثر، لكنه لا يستطيع إعادة منح الأدوات المرفوضة في المستويات السابقة.
    - إذا تم ضبط `agents.list[].tools.sandbox.tools`، فإنه يستبدل `tools.sandbox.tools` لذلك الوكيل.
    - إذا تم ضبط `agents.list[].tools.profile`، فإنه يتجاوز `tools.profile` لذلك الوكيل.
    - تقبل مفاتيح أدوات المزوّد إما `provider` (مثل `google-antigravity`) أو `provider/model` (مثل `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="سلوك قائمة السماح الفارغة">
    إذا تركت أي قائمة سماح صريحة في تلك السلسلة التشغيل بلا أدوات قابلة للاستدعاء، يوقف OpenClaw العملية قبل إرسال الموجه إلى النموذج. هذا مقصود: يجب أن يفشل الوكيل المكوّن بأداة مفقودة مثل `agents.list[].tools.allow: ["query_db"]` بوضوح إلى أن يتم تمكين Plugin الذي يسجل `query_db`، لا أن يستمر كوكيل نصي فقط.
  </Accordion>
</AccordionGroup>

تدعم سياسات الأدوات اختصارات `group:*` التي تتوسع إلى عدة أدوات. راجع [مجموعات الأدوات](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) للاطلاع على القائمة الكاملة.

يمكن لتجاوزات الوضع المرتفع لكل وكيل (`agents.list[].tools.elevated`) أن تقيّد التنفيذ المرتفع أكثر لوكلاء محددين. راجع [الوضع المرتفع](/ar/tools/elevated) للتفاصيل.

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
  <Tab title="بعد (عدة وكلاء)">
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
يتم ترحيل تكوينات `agent.*` القديمة بواسطة `openclaw doctor`؛ فضّل استخدام `agents.defaults` + `agents.list` من الآن فصاعدًا.
</Note>

---

## أمثلة قيود الأدوات

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
  <Tab title="تنفيذ آمن (بلا تعديلات على الملفات)">
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

    لا يزال `sessions_history` في ملف التعريف هذا يعيد عرض استدعاء محدودًا ومنقحًا بدلًا من تفريغ خام للنص الكامل. يزيل استدعاء المساعد وسوم التفكير، وهيكل `<relevant-memories>`، وحمولات XML لاستدعاءات الأدوات بالنص العادي (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاءات الأدوات المقتطعة)، وهياكل استدعاءات الأدوات المخفّضة، ورموز التحكم في النموذج المسرّبة بصيغة ASCII/العرض الكامل، وXML استدعاءات أدوات MiniMax المشوّه قبل التنقيح/الاقتطاع.

  </Tab>
</Tabs>

---

## خطأ شائع: "non-main"

<Warning>
يعتمد `agents.defaults.sandbox.mode: "non-main"` على `session.mainKey` (الافتراضي `"main"`)، وليس على معرّف الوكيل. تحصل جلسات المجموعات/القنوات دائمًا على مفاتيحها الخاصة، لذلك تُعامل كغير رئيسية وسيتم عزلها. إذا أردت ألا يُعزل وكيل أبدًا، فاضبط `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## الاختبار

بعد تكوين عزل وأدوات الوكلاء المتعددين:

<Steps>
  <Step title="التحقق من حل الوكيل">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="التحقق من حاويات العزل">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="اختبار قيود الأدوات">
    - أرسل رسالة تتطلب أدوات مقيّدة.
    - تحقق من أن الوكيل لا يستطيع استخدام الأدوات المرفوضة.

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
  <Accordion title="الوكيل غير معزول رغم `mode: 'all'`">
    - تحقق مما إذا كان هناك `agents.defaults.sandbox.mode` عام يتجاوزه.
    - تكون للتكوين الخاص بالوكيل الأسبقية، لذا اضبط `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="الأدوات لا تزال متاحة رغم قائمة الرفض">
    - تحقق من ترتيب تصفية الأدوات: عام → وكيل → عزل → وكيل فرعي.
    - يمكن لكل مستوى أن يقيّد أكثر فقط، لا أن يعيد المنح.
    - تحقق من السجلات: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="الحاوية ليست معزولة لكل وكيل">
    - اضبط `scope: "agent"` في تكوين العزل الخاص بالوكيل.
    - الإعداد الافتراضي هو `"session"`، وهو ينشئ حاوية واحدة لكل جلسة.

  </Accordion>
</AccordionGroup>

---

## ذات صلة

- [الوضع المرتفع](/ar/tools/elevated)
- [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)
- [تكوين العزل](/ar/gateway/config-agents#agentsdefaultssandbox)
- [العزل مقابل سياسة الأدوات مقابل الوضع المرتفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) — تصحيح "لماذا تم حظر هذا؟"
- [العزل](/ar/gateway/sandboxing) — مرجع العزل الكامل (الأوضاع، النطاقات، الواجهات الخلفية، الصور)
- [إدارة الجلسات](/ar/concepts/session)
