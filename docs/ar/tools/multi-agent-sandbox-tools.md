---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: بيئة العزل وقيود الأدوات لكل وكيل، والأسبقية، والأمثلة
title: صندوق حماية متعدد الوكلاء والأدوات
x-i18n:
    generated_at: "2026-05-10T20:04:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c988613438f2d179b859902d3f7a39a1e29b60a0e2ae6ed598bb5f5881cf0b9f
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

يمكن لكل وكيل في إعداد متعدد الوكلاء تجاوز سياسة العزل والأدوات العامة. تغطي هذه الصفحة الإعدادات الخاصة بكل وكيل، وقواعد الأسبقية، والأمثلة.

<CardGroup cols={3}>
  <Card title="العزل" href="/ar/gateway/sandboxing">
    الخلفيات والأوضاع — مرجع العزل الكامل.
  </Card>
  <Card title="العزل مقابل سياسة الأدوات مقابل الوضع المرتفع" href="/ar/gateway/sandbox-vs-tool-policy-vs-elevated">
    تصحيح "لماذا تم حظر هذا؟"
  </Card>
  <Card title="الوضع المرتفع" href="/ar/tools/elevated">
    تنفيذ مرتفع للمرسلين الموثوقين.
  </Card>
</CardGroup>

<Warning>
المصادقة محددة النطاق حسب الوكيل: لكل وكيل مخزن مصادقة `agentDir` خاص به في `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. لا تعد استخدام `agentDir` مطلقا عبر الوكلاء. يمكن للوكلاء القراءة وصولا إلى ملفات تعريف المصادقة الخاصة بالوكيل الافتراضي/الرئيسي عندما لا يكون لديهم ملف تعريف محلي، لكن رموز تحديث OAuth لا تستنسخ إلى مخازن الوكلاء الثانوية. إذا نسخت بيانات الاعتماد يدويا، فانسخ فقط ملفات تعريف `api_key` أو `token` الثابتة القابلة للنقل.
</Warning>

---

## أمثلة الإعدادات

<AccordionGroup>
  <Accordion title="مثال 1: وكيل شخصي + وكيل عائلي مقيد">
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
    - وكيل `family`: يعمل في Docker (حاوية واحدة لكل وكيل)، وأداة `read` فقط.

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
  <Accordion title="مثال 2ب: ملف تعريف برمجة عام + وكيل للمراسلة فقط">
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

    - يحصل الوكلاء الافتراضيون على أدوات البرمجة.
    - وكيل `support` للمراسلة فقط (+ أداة Slack).

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

## أسبقية الإعدادات

عند وجود إعدادات عامة (`agents.defaults.*`) وأخرى خاصة بالوكيل (`agents.list[].*`):

### إعدادات العزل

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
يتجاوز `agents.list[].sandbox.{docker,browser,prune}.*` القيمة `agents.defaults.sandbox.{docker,browser,prune}.*` لذلك الوكيل (ويتم تجاهله عندما ينتهي نطاق العزل إلى `"shared"`).
</Note>

### قيود الأدوات

ترتيب التصفية هو:

<Steps>
  <Step title="ملف تعريف الأداة">
    `tools.profile` أو `agents.list[].tools.profile`.
  </Step>
  <Step title="ملف تعريف أداة المزود">
    `tools.byProvider[provider].profile` أو `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="سياسة الأدوات العامة">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="سياسة أداة المزود">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="سياسة الأدوات الخاصة بالوكيل">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="سياسة مزود الوكيل">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="سياسة أدوات العزل">
    `tools.sandbox.tools` أو `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="سياسة أدوات الوكيل الفرعي">
    `tools.subagents.tools`، إن كانت قابلة للتطبيق.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="قواعد الأسبقية">
    - يمكن لكل مستوى تقييد الأدوات أكثر، لكنه لا يستطيع إعادة منح الأدوات المرفوضة من المستويات السابقة.
    - إذا تم تعيين `agents.list[].tools.sandbox.tools`، فإنه يستبدل `tools.sandbox.tools` لذلك الوكيل.
    - إذا تم تعيين `agents.list[].tools.profile`، فإنه يتجاوز `tools.profile` لذلك الوكيل.
    - تقبل مفاتيح أدوات المزود إما `provider` (مثل `google-antigravity`) أو `provider/model` (مثل `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="سلوك قائمة السماح الفارغة">
    إذا تركت أي قائمة سماح صريحة في تلك السلسلة التشغيل بلا أدوات قابلة للاستدعاء، يوقف OpenClaw العملية قبل إرسال الموجه إلى النموذج. هذا مقصود: يجب أن يفشل الوكيل المهيأ بأداة مفقودة مثل `agents.list[].tools.allow: ["query_db"]` بوضوح إلى أن يتم تمكين Plugin الذي يسجل `query_db`، لا أن يستمر كوكيل نصي فقط.
  </Accordion>
</AccordionGroup>

تدعم سياسات الأدوات اختصارات `group:*` التي تتوسع إلى أدوات متعددة. راجع [مجموعات الأدوات](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) للاطلاع على القائمة الكاملة.

يمكن لتجاوزات الوضع المرتفع لكل وكيل (`agents.list[].tools.elevated`) أن تزيد تقييد التنفيذ المرتفع لوكلاء محددين. راجع [الوضع المرتفع](/ar/tools/elevated) للتفاصيل.

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
يتم ترحيل إعدادات `agent.*` القديمة بواسطة `openclaw doctor`؛ يفضل استخدام `agents.defaults` + `agents.list` مستقبلا.
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
  <Tab title="تنفيذ Shell مع تعطيل أدوات نظام الملفات">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    تعطل هذه السياسة أدوات نظام الملفات في OpenClaw، لكن `exec` لا يزال Shell ويمكنه كتابة الملفات في أي مكان يسمح به نظام ملفات المضيف أو العزل المحدد. لوكيل للقراءة فقط، ارفض `exec` و`process`، أو ادمج وصول Shell مع ضوابط نظام ملفات العزل مثل `agents.defaults.sandbox.workspaceAccess: "ro"` أو `"none"`.
    </Warning>

  </Tab>
  <Tab title="للاتصال فقط">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    لا يزال `sessions_history` في ملف التعريف هذا يعيد عرض استدعاء محدودا ومنقحا بدلا من تفريغ خام للنص الكامل. يزيل استدعاء المساعد وسوم التفكير، وسقالات `<relevant-memories>`، وحمولات XML لاستدعاءات الأدوات بنص عادي (بما في ذلك `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المقتطعة)، وسقالات استدعاءات الأدوات المخفضة، ورموز تحكم النموذج المسرّبة بصيغة ASCII/العرض الكامل، وXML استدعاءات أدوات MiniMax المشوه قبل التنقيح/الاقتطاع.

  </Tab>
</Tabs>

---

## مزلق شائع: "non-main"

<Warning>
يعتمد `agents.defaults.sandbox.mode: "non-main"` على `session.mainKey` (الافتراضي `"main"`)، وليس على معرف الوكيل. تحصل جلسات المجموعة/القناة دائما على مفاتيحها الخاصة، لذلك تعامل على أنها غير رئيسية وسيتم عزلها. إذا أردت ألا يخضع وكيل للعزل مطلقا، فعيّن `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## الاختبار

بعد إعداد العزل والأدوات للوكلاء المتعددين:

<Steps>
  <Step title="تحقق من حل الوكيل">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="تحقق من حاويات العزل">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="اختبر قيود الأدوات">
    - أرسل رسالة تتطلب أدوات مقيدة.
    - تحقق من أن الوكيل لا يستطيع استخدام الأدوات المرفوضة.

  </Step>
  <Step title="راقب السجلات">
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
    - للإعدادات الخاصة بالوكيل الأسبقية، لذلك عيّن `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="الأدوات لا تزال متاحة رغم قائمة الرفض">
    - تحقق من ترتيب تصفية الأدوات: عام → وكيل → عزل → وكيل فرعي.
    - لا يمكن لكل مستوى إلا زيادة التقييد، لا إعادة المنح.
    - تحقق من السجلات: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="الحاوية غير معزولة لكل وكيل">
    - عيّن `scope: "agent"` في إعدادات العزل الخاصة بالوكيل.
    - الافتراضي هو `"session"` الذي ينشئ حاوية واحدة لكل جلسة.

  </Accordion>
</AccordionGroup>

---

## ذو صلة

- [وضع الصلاحيات المرتفعة](/ar/tools/elevated)
- [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)
- [تكوين بيئة العزل](/ar/gateway/config-agents#agentsdefaultssandbox)
- [بيئة العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) — تصحيح أخطاء "لماذا تم حظر هذا؟"
- [العزل](/ar/gateway/sandboxing) — مرجع بيئة العزل الكامل (الأوضاع، النطاقات، الخلفيات، الصور)
- [إدارة الجلسات](/ar/concepts/session)
