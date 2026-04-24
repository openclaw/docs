---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: '"Sandboxing لكل وكيل + تقييدات الأدوات، والأولوية، والأمثلة"'
title: Sandboxing متعددة الوكلاء والأدوات
x-i18n:
    generated_at: "2026-04-24T08:10:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7239e28825759efb060b821f87f5ebd9a7f3b720b30ff16dc076b186e47fcde9
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# إعداد Sandboxing والأدوات متعددة الوكلاء

يمكن لكل وكيل في إعداد متعدد الوكلاء أن يتجاوز إعدادات sandbox العالمية وسياسة
الأدوات. تغطي هذه الصفحة إعدادات كل وكيل، وقواعد الأولوية، و
الأمثلة.

- **الواجهات الخلفية وأنماط sandbox**: راجع [Sandboxing](/ar/gateway/sandboxing).
- **تصحيح الأدوات المحجوبة**: راجع [Sandbox مقابل سياسة الأداة مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) والأمر `openclaw sandbox explain`.
- **Exec المرتفع**: راجع [Elevated Mode](/ar/tools/elevated).

تكون المصادقة لكل وكيل: يقرأ كل وكيل من مخزن المصادقة الخاص به في `agentDir`
عند `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
لا تتم **مشاركة** بيانات الاعتماد بين الوكلاء. لا تعِد استخدام `agentDir` بين الوكلاء أبدًا.
إذا كنت تريد مشاركة بيانات الاعتماد، فانسخ `auth-profiles.json` إلى `agentDir` الخاصة بالوكيل الآخر.

---

## أمثلة على الإعداد

### المثال 1: وكيل شخصي + وكيل عائلي مقيّد

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

- وكيل `main`: يعمل على المضيف، مع وصول كامل إلى الأدوات
- وكيل `family`: يعمل في Docker (حاوية واحدة لكل وكيل)، مع أداة `read` فقط

---

### المثال 2: وكيل عمل مع Sandbox مشتركة

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

---

### المثال 2b: ملف تعريف برمجي عام + وكيل مراسلة فقط

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

- تحصل الوكلاء الافتراضيون على أدوات البرمجة
- يكون وكيل `support` مخصصًا للمراسلة فقط (+ أداة Slack)

---

### المثال 3: أوضاع Sandbox مختلفة لكل وكيل

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Global default
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Override: main never sandboxed
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public always sandboxed
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

---

## أولوية الإعداد

عند وجود كل من الإعدادات العالمية (`agents.defaults.*`) والإعدادات الخاصة بالوكيل (`agents.list[].*`):

### إعداد Sandbox

تتغلب الإعدادات الخاصة بالوكيل على الإعدادات العالمية:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**ملاحظات:**

- تتغلب `agents.list[].sandbox.{docker,browser,prune}.*` على `agents.defaults.sandbox.{docker,browser,prune}.*` لذلك الوكيل (ويتم تجاهلها عندما يُحل نطاق sandbox إلى `"shared"`).

### تقييدات الأدوات

ترتيب التصفية هو:

1. **ملف تعريف الأداة** (`tools.profile` أو `agents.list[].tools.profile`)
2. **ملف تعريف أداة المزوّد** (`tools.byProvider[provider].profile` أو `agents.list[].tools.byProvider[provider].profile`)
3. **سياسة الأدوات العامة** (`tools.allow` / `tools.deny`)
4. **سياسة أداة المزوّد** (`tools.byProvider[provider].allow/deny`)
5. **سياسة الأدوات الخاصة بالوكيل** (`agents.list[].tools.allow/deny`)
6. **سياسة مزوّد الوكيل** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **سياسة أداة sandbox** (`tools.sandbox.tools` أو `agents.list[].tools.sandbox.tools`)
8. **سياسة أداة الوكيل الفرعي** (`tools.subagents.tools`، عند الانطباق)

يمكن لكل مستوى أن يزيد من تقييد الأدوات، لكنه لا يستطيع استرجاع أدوات مرفوضة من مستويات سابقة.
إذا كانت `agents.list[].tools.sandbox.tools` مضبوطة، فإنها تستبدل `tools.sandbox.tools` لذلك الوكيل.
وإذا كانت `agents.list[].tools.profile` مضبوطة، فإنها تتجاوز `tools.profile` لذلك الوكيل.
تقبل مفاتيح أدوات المزوّد إما `provider` (مثل `google-antigravity`) أو `provider/model` (مثل `openai/gpt-5.4`).

تدعم سياسات الأدوات اختصارات `group:*` التي تتوسع إلى عدة أدوات. راجع [مجموعات الأدوات](/ar/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) للحصول على القائمة الكاملة.

يمكن لتجاوزات elevated الخاصة بكل وكيل (`agents.list[].tools.elevated`) أن تزيد من تقييد exec المرتفع لوكلاء محددين. راجع [Elevated Mode](/ar/tools/elevated) لمعرفة التفاصيل.

---

## الترحيل من وكيل واحد

**قبل (وكيل واحد):**

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

**بعد (متعدد الوكلاء مع ملفات تعريف مختلفة):**

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

يتم ترحيل إعدادات `agent.*` القديمة بواسطة `openclaw doctor`؛ وفضّل `agents.defaults` + `agents.list` للمضي قدمًا.

---

## أمثلة على تقييد الأدوات

### وكيل للقراءة فقط

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### وكيل تنفيذ آمن (من دون تعديل ملفات)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### وكيل مخصص للتواصل فقط

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

لا يزال `sessions_history` في هذا الملف الشخصي يعيد عرض استدعاء محدودًا ومنقحًا
بدلًا من تفريغ نص خام. ويقوم استدعاء المساعد بإزالة وسوم التفكير،
وهيكل `<relevant-memories>`،
وحمولات XML الخاصة باستدعاء الأدوات في النص العادي
(بما في ذلك `<tool_call>...</tool_call>`،
و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المقتطعة)،
وهياكل استدعاء الأدوات المخفّضة، ورموز التحكم
الخاصة بالنموذج المتسربة بصيغة ASCII/العرض الكامل، وXML الخاصة باستدعاء أدوات MiniMax المشوهة قبل التنقيح/الاقتطاع.

---

## خطأ شائع: "non-main"

تعتمد `agents.defaults.sandbox.mode: "non-main"` على `session.mainKey` (الافتراضي `"main"`)،
وليس على معرّف الوكيل. تحصل جلسات المجموعة/القناة دائمًا على مفاتيحها الخاصة، لذا
تُعامل على أنها غير رئيسية وسيتم وضعها داخل sandbox. وإذا كنت تريد ألا يخضع وكيل ما إلى sandbox أبدًا، فاضبط `agents.list[].sandbox.mode: "off"`.

---

## الاختبار

بعد تهيئة multi-agent sandbox والأدوات:

1. **تحقّق من حلّ الوكيل:**

   ```exec
   openclaw agents list --bindings
   ```

2. **تحقق من حاويات sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **اختبر تقييدات الأدوات:**
   - أرسل رسالة تتطلب أدوات مقيّدة
   - تحقق من أن الوكيل لا يستطيع استخدام الأدوات المرفوضة

4. **راقب السجلات:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## استكشاف الأخطاء وإصلاحها

### الوكيل غير موجود داخل sandbox رغم `mode: "all"`

- تحقق مما إذا كانت هناك قيمة عامة `agents.defaults.sandbox.mode` تتغلب عليها
- تتقدّم الإعدادات الخاصة بالوكيل في الأولوية، لذا اضبط `agents.list[].sandbox.mode: "all"`

### لا تزال الأدوات متاحة رغم قائمة deny

- تحقق من ترتيب تصفية الأدوات: عام → وكيل → sandbox → وكيل فرعي
- يمكن لكل مستوى فقط أن يزيد التقييد، ولا يمكنه استرجاع ما تم منعه
- تحقّق عبر السجلات: ‏`[tools] filtering tools for agent:${agentId}`

### الحاوية غير معزولة لكل وكيل

- اضبط `scope: "agent"` في إعداد sandbox الخاص بالوكيل
- الافتراضي هو `"session"` الذي ينشئ حاوية واحدة لكل جلسة

---

## ذو صلة

- [Sandboxing](/ar/gateway/sandboxing) -- المرجع الكامل لـ sandbox ‏(الأوضاع، والنطاقات، والواجهات الخلفية، والصور)
- [Sandbox مقابل سياسة الأداة مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated) -- لتصحيح "لماذا هذا محجوب؟"
- [Elevated Mode](/ar/tools/elevated)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [إعداد Sandbox](/ar/gateway/config-agents#agentsdefaultssandbox)
- [إدارة الجلسات](/ar/concepts/session)
