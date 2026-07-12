---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: وضع الحماية لكل وكيل + قيود الأدوات، والأسبقية، والأمثلة
title: بيئة العزل والأدوات متعددة الوكلاء
x-i18n:
    generated_at: "2026-07-12T06:42:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

يمكن لكل وكيل في إعداد متعدد الوكلاء تجاوز سياسة العزل والأدوات العامة. تتناول هذه الصفحة الإعداد لكل وكيل، وقواعد الأولوية، وأمثلة.

<CardGroup cols={3}>
  <Card title="العزل" href="/ar/gateway/sandboxing">
    الواجهات الخلفية والأوضاع — المرجع الكامل للعزل.
  </Card>
  <Card title="العزل مقابل سياسة الأدوات مقابل الوضع المرتفع" href="/ar/gateway/sandbox-vs-tool-policy-vs-elevated">
    تصحيح سبب الحظر.
  </Card>
  <Card title="الوضع المرتفع" href="/ar/tools/elevated">
    تنفيذ مرتفع للمرسلين الموثوقين.
  </Card>
</CardGroup>

<Warning>
يقتصر نطاق المصادقة على الوكيل: لكل وكيل مخزن مصادقة خاص به في `agentDir` ضمن `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. لا تُعِد استخدام `agentDir` مطلقًا بين الوكلاء. يمكن للوكلاء الرجوع إلى ملفات تعريف المصادقة الخاصة بالوكيل الافتراضي/الرئيسي عندما لا يكون لديهم ملف تعريف محلي، لكن رموز تحديث OAuth لا تُنسخ إلى مخازن الوكلاء الثانويين. إذا نسخت بيانات الاعتماد يدويًا، فلا تنسخ سوى ملفات تعريف `api_key` أو `token` الثابتة والقابلة للنقل.
</Warning>

---

## أمثلة الإعداد

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

    **النتيجة:**

    - الوكيل `main`: يعمل على المضيف ويتمتع بوصول كامل إلى الأدوات.
    - الوكيل `family`: يعمل داخل Docker (حاوية واحدة لكل وكيل)، ولا يُسمح له إلا باستخدام `read` وإرسال الرسائل ضمن المحادثة الحالية.

  </Accordion>
  <Accordion title="المثال 2: وكيل عمل بعزل مشترك">
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
  <Accordion title="المثال 2ب: ملف تعريف عام للبرمجة + وكيل للمراسلة فقط">
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

    - تحصل الوكلاء الافتراضية على أدوات البرمجة.
    - يقتصر الوكيل `support` على المراسلة فقط (+ أداة Slack).

  </Accordion>
  <Accordion title="المثال 3: أوضاع عزل مختلفة لكل وكيل">
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

## أولوية الإعداد

عند وجود إعدادات عامة (`agents.defaults.*`) وأخرى خاصة بالوكيل (`agents.list[].*`) معًا:

### إعداد العزل

تتجاوز الإعدادات الخاصة بالوكيل الإعدادات العامة:

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
يتجاوز `agents.list[].sandbox.{docker,browser,prune}.*` الإعداد `agents.defaults.sandbox.{docker,browser,prune}.*` لذلك الوكيل (ويُتجاهل عندما يُحسم نطاق العزل إلى `"shared"`).
</Note>

### قيود الأدوات

ترتيب التصفية هو:

<Steps>
  <Step title="ملف تعريف الأدوات">
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
  <Step title="سياسة أدوات العزل">
    `tools.sandbox.tools` أو `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="سياسة أدوات الوكيل الفرعي">
    `tools.subagents.tools`، إن كانت منطبقة.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="قواعد الأولوية">
    - يمكن لكل مستوى فرض قيود إضافية على الأدوات، لكنه لا يستطيع إعادة منح الأدوات التي حُظرت في مستويات سابقة.
    - إذا ضُبط `agents.list[].tools.sandbox.tools`، فإنه يحل محل `tools.sandbox.tools` لذلك الوكيل.
    - إذا ضُبط `agents.list[].tools.profile`، فإنه يتجاوز `tools.profile` لذلك الوكيل.
    - تقبل مفاتيح أدوات المزوّد إما `provider` (مثل `google-antigravity`) أو `provider/model` (مثل `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="سلوك قائمة السماح الفارغة">
    إذا أدت أي قائمة سماح صريحة في تلك السلسلة إلى عدم توفر أي أدوات قابلة للاستدعاء للتشغيل، يتوقف OpenClaw قبل إرسال الموجّه إلى النموذج. هذا مقصود: يجب أن يفشل الوكيل المضبوط بأداة مفقودة مثل `agents.list[].tools.allow: ["query_db"]` بوضوح إلى أن يُفعّل Plugin الذي يسجّل `query_db`، بدلًا من الاستمرار بصفته وكيلًا نصيًا فقط.
  </Accordion>
</AccordionGroup>

تدعم سياسات الأدوات الاختصارات `group:*` التي تتوسع إلى عدة أدوات. راجع [مجموعات الأدوات](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) للاطلاع على القائمة الكاملة.

يمكن لتجاوزات الوضع المرتفع لكل وكيل (`agents.list[].tools.elevated`) فرض قيود إضافية على التنفيذ المرتفع لوكلاء محددين. راجع [الوضع المرتفع](/ar/tools/elevated) للاطلاع على التفاصيل.

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
  <Tab title="بعد (وكلاء متعددون)">
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
يرحّل `openclaw doctor` مفاتيح إعداد `agents.defaults.*`/`agents.list[].*` القديمة (مثل `sandbox.perSession` و`agentRuntime` و`embeddedPi`)؛ ويُفضّل استخدام `agents.defaults` + `agents.list` من الآن فصاعدًا.
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
  <Tab title="تنفيذ الصدفة مع تعطيل أدوات نظام الملفات">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    تعطل هذه السياسة أدوات نظام الملفات في OpenClaw، لكن `exec` يظل صدفةً ويمكنه كتابة الملفات في أي موضع يسمح به نظام ملفات المضيف أو العزل المحدد. للحصول على وكيل للقراءة فقط، احظر `exec` و`process`، أو ادمج الوصول إلى الصدفة مع ضوابط نظام ملفات العزل مثل `agents.defaults.sandbox.workspaceAccess: "ro"` أو `"none"`.
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

    يظل `sessions_history` في ملف التعريف هذا يعيد عرض استرجاع محدودًا ومنقّحًا بدلًا من تفريغ نص المحادثة الخام. يزيل استرجاع المساعد وسوم التفكير، وبنية `<relevant-memories>`، وحمولات XML النصية العادية لاستدعاءات الأدوات (بما فيها `<tool_call>...</tool_call>` و`<function_call>...</function_call>` و`<tool_calls>...</tool_calls>` و`<function_calls>...</function_calls>` وكتل استدعاءات الأدوات المبتورة)، وبنية استدعاءات الأدوات التي خُفّض مستواها، ورموز التحكم المسرّبة للنموذج بتنسيق ASCII/العرض الكامل، وXML المشوّه لاستدعاءات أدوات MiniMax، وذلك قبل التنقيح/الاقتطاع.

  </Tab>
</Tabs>

---

## خطأ شائع: `"non-main"`

<Warning>
يتحقق `agents.defaults.sandbox.mode: "non-main"` من مفتاح الجلسة مقارنةً بمفتاح الجلسة الرئيسية (وهو دائمًا `"main"`؛ لا يمكن للمستخدم ضبط `session.mainKey`، ويحذّر OpenClaw من أي قيمة أخرى ويتجاهلها)، وليس من معرّف الوكيل. تحصل جلسات المجموعات/القنوات دائمًا على مفاتيحها الخاصة، لذا تُعامل على أنها غير رئيسية وتُعزل. إذا أردت ألا يُعزل وكيل مطلقًا، فاضبط `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## الاختبار

بعد إعداد العزل والأدوات للوكلاء المتعددين:

<Steps>
  <Step title="التحقق من حسم الوكيل">
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
    - تحقق من أن الوكيل لا يستطيع استخدام الأدوات المحظورة.

  </Step>
  <Step title="مراقبة السجلات">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الوكيل غير معزول رغم `mode: 'all'`">
    - تحقق مما إذا كان هناك `agents.defaults.sandbox.mode` عام يتجاوزه.
    - للإعداد الخاص بالوكيل الأولوية، لذا اضبط `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="الأدوات التي تظل متاحة رغم قائمة المنع">
    - تحقّق من [ترتيب التصفية الكامل](#tool-restrictions): ملف التعريف ← ملف تعريف المزوّد ← السياسة العامة ← سياسة المزوّد ← سياسة الوكيل ← سياسة مزوّد الوكيل ← البيئة المعزولة ← الوكيل الفرعي.
    - لا يمكن لكل مستوى إلا فرض مزيد من القيود، ولا يمكنه إعادة منح الصلاحيات.
    - راجع [البيئة المعزولة مقابل سياسة الأدوات مقابل الوضع المرتفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) لتصحيح الأخطاء خطوة بخطوة.

  </Accordion>
  <Accordion title="الحاوية غير معزولة لكل وكيل">
    - قيمة `scope` الافتراضية هي `"agent"` (حاوية واحدة لكل معرّف وكيل).
    - عيّن `scope: "session"` لاستخدام حاوية واحدة لكل جلسة، أو `scope: "shared"` لإعادة استخدام حاوية واحدة عبر الوكلاء.

  </Accordion>
</AccordionGroup>

---

## ذو صلة

- [الوضع المرتفع](/ar/tools/elevated)
- [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)
- [تهيئة البيئة المعزولة](/ar/gateway/config-agents#agentsdefaultssandbox)
- [البيئة المعزولة مقابل سياسة الأدوات مقابل الوضع المرتفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) — تصحيح سبب حظر هذا
- [العزل](/ar/gateway/sandboxing) — المرجع الكامل للبيئة المعزولة (الأوضاع، والنطاقات، والواجهات الخلفية، والصور)
- [إدارة الجلسات](/ar/concepts/session)
