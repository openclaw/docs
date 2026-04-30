---
read_when:
    - تكوين مجموعات البث
    - استكشاف أخطاء الردود متعددة الوكلاء في WhatsApp وإصلاحها
sidebarTitle: Broadcast groups
status: experimental
summary: بثّ رسالة WhatsApp إلى عدة وكلاء
title: مجموعات البث
x-i18n:
    generated_at: "2026-04-30T07:40:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0de4ccc85bf79e2ceb1dddd60db067309b15b7f876c92e7d591ff0b4b4315ec
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**الحالة:** تجريبي. أُضيف في 2026.1.9.
</Note>

## نظرة عامة

تتيح مجموعات البث لعدة وكلاء معالجة الرسالة نفسها والرد عليها في الوقت نفسه. يتيح لك ذلك إنشاء فرق وكلاء متخصصة تعمل معا داخل مجموعة WhatsApp واحدة أو رسالة مباشرة واحدة، وكل ذلك باستخدام رقم هاتف واحد.

النطاق الحالي: **WhatsApp فقط** (قناة الويب).

تُقيَّم مجموعات البث بعد قوائم السماح للقنوات وقواعد تفعيل المجموعات. في مجموعات WhatsApp، يعني ذلك أن البث يحدث عندما كان OpenClaw سيرد عادة (مثلا: عند الإشارة، بحسب إعدادات مجموعتك).

## حالات الاستخدام

<AccordionGroup>
  <Accordion title="1. فرق وكلاء متخصصة">
    انشر عدة وكلاء بمسؤوليات محددة ومركزة:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    يعالج كل وكيل الرسالة نفسها ويقدم منظوره المتخصص.

  </Accordion>
  <Accordion title="2. دعم متعدد اللغات">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. سير عمل ضمان الجودة">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. أتمتة المهام">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## الإعداد

### الإعداد الأساسي

أضف قسم `broadcast` على المستوى الأعلى (بجوار `bindings`). المفاتيح هي معرفات أقران WhatsApp:

- محادثات المجموعات: JID المجموعة (مثلا `120363403215116621@g.us`)
- الرسائل المباشرة: رقم هاتف بصيغة E.164 (مثلا `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**النتيجة:** عندما كان OpenClaw سيرد في هذه المحادثة، سيشغل الوكلاء الثلاثة جميعا.

### استراتيجية المعالجة

تحكم في كيفية معالجة الوكلاء للرسائل:

<Tabs>
  <Tab title="parallel (default)">
    يعالج جميع الوكلاء في الوقت نفسه:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    يعالج الوكلاء بالترتيب (ينتظر كل واحد انتهاء السابق):

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

### مثال كامل

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

## كيف يعمل

### تدفق الرسائل

<Steps>
  <Step title="وصول رسالة واردة">
    تصل رسالة مجموعة WhatsApp أو رسالة مباشرة.
  </Step>
  <Step title="فحص البث">
    يتحقق النظام مما إذا كان معرف النظير موجودا في `broadcast`.
  </Step>
  <Step title="إذا كان ضمن قائمة البث">
    - يعالج جميع الوكلاء المدرجين الرسالة.
    - لكل وكيل مفتاح جلسة خاص به وسياق معزول.
    - يعالج الوكلاء بالتوازي (افتراضيا) أو بالتتابع.

  </Step>
  <Step title="إذا لم يكن ضمن قائمة البث">
    ينطبق التوجيه العادي (أول ربط مطابق).
  </Step>
</Steps>

<Note>
لا تتجاوز مجموعات البث قوائم السماح للقنوات أو قواعد تفعيل المجموعات (الإشارات/الأوامر/إلخ). إنها تغير فقط _أي الوكلاء يعملون_ عندما تكون الرسالة مؤهلة للمعالجة.
</Note>

### عزل الجلسات

يحتفظ كل وكيل في مجموعة بث بما يلي منفصلا تماما:

- **مفاتيح الجلسة** (`agent:alfred:whatsapp:group:120363...` مقابل `agent:baerbel:whatsapp:group:120363...`)
- **سجل المحادثة** (لا يرى الوكيل رسائل الوكلاء الآخرين)
- **مساحة العمل** (بيئات sandbox منفصلة إذا تم إعدادها)
- **الوصول إلى الأدوات** (قوائم سماح/رفض مختلفة)
- **الذاكرة/السياق** (ملفات IDENTITY.md وSOUL.md منفصلة، إلخ)
- **مخزن سياق المجموعة** (رسائل المجموعة الحديثة المستخدمة للسياق) مشترك لكل نظير، لذلك يرى جميع وكلاء البث السياق نفسه عند تشغيلهم

يتيح هذا لكل وكيل أن يمتلك:

- شخصيات مختلفة
- وصولا مختلفا إلى الأدوات (مثلا، قراءة فقط مقابل قراءة وكتابة)
- نماذج مختلفة (مثلا، opus مقابل sonnet)
- Skills مختلفة مثبتة

### مثال: جلسات معزولة

في المجموعة `120363403215116621@g.us` مع الوكلاء `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="سياق Alfred">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="سياق Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## أفضل الممارسات

<AccordionGroup>
  <Accordion title="1. أبق الوكلاء مركزين">
    صمم كل وكيل بمسؤولية واحدة واضحة:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **جيد:** لكل وكيل مهمة واحدة. ❌ **سيئ:** وكيل عام واحد باسم "dev-helper".

  </Accordion>
  <Accordion title="2. استخدم أسماء وصفية">
    اجعل وظيفة كل وكيل واضحة:

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
  <Accordion title="3. اضبط وصولا مختلفا إلى الأدوات">
    امنح الوكلاء الأدوات التي يحتاجونها فقط:

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
  <Accordion title="4. راقب الأداء">
    مع كثرة الوكلاء، ضع في الحسبان:

    - استخدام `"strategy": "parallel"` (الافتراضي) للسرعة
    - قصر مجموعات البث على 5-10 وكلاء
    - استخدام نماذج أسرع للوكلاء الأبسط

  </Accordion>
  <Accordion title="5. تعامل مع الإخفاقات بسلاسة">
    يفشل الوكلاء بشكل مستقل. خطأ وكيل واحد لا يحظر الآخرين:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## التوافق

### المزوّدون

تعمل مجموعات البث حاليا مع:

- ✅ WhatsApp (منفذ)
- 🚧 Telegram (مخطط له)
- 🚧 Discord (مخطط له)
- 🚧 Slack (مخطط له)

### التوجيه

تعمل مجموعات البث إلى جانب التوجيه الحالي:

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

- `GROUP_A`: يرد alfred فقط (التوجيه العادي).
- `GROUP_B`: يرد agent1 وagent2 (البث).

<Note>
**الأسبقية:** تأخذ `broadcast` الأولوية على `bindings`.
</Note>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الوكلاء لا يردون">
    **تحقق مما يلي:**

    1. معرفات الوكلاء موجودة في `agents.list`.
    2. تنسيق معرف النظير صحيح (مثلا، `120363403215116621@g.us`).
    3. الوكلاء ليسوا في قوائم الرفض.

    **التصحيح:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="وكيل واحد فقط يرد">
    **السبب:** قد يكون معرف النظير موجودا في `bindings` لكنه غير موجود في `broadcast`.

    **الإصلاح:** أضفه إلى إعداد البث أو أزله من bindings.

  </Accordion>
  <Accordion title="مشكلات الأداء">
    إذا كان الأداء بطيئا مع كثرة الوكلاء:

    - قلل عدد الوكلاء لكل مجموعة.
    - استخدم نماذج أخف (sonnet بدلا من opus).
    - تحقق من وقت بدء تشغيل sandbox.

  </Accordion>
</AccordionGroup>

## أمثلة

<AccordionGroup>
  <Accordion title="المثال 1: فريق مراجعة الكود">
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

    **يرسل المستخدم:** مقتطف كود.

    **الردود:**

    - code-formatter: "تم إصلاح المسافات البادئة وإضافة تلميحات الأنواع"
    - security-scanner: "⚠️ ثغرة حقن SQL في السطر 12"
    - test-coverage: "التغطية 45%، والاختبارات لحالات الخطأ مفقودة"
    - docs-checker: "سلسلة التوثيق مفقودة للدالة `process_data`"

  </Accordion>
  <Accordion title="المثال 2: دعم متعدد اللغات">
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

### مخطط الإعداد

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### الحقول

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  كيفية معالجة الوكلاء. يشغل `parallel` جميع الوكلاء في الوقت نفسه؛ ويشغلهم `sequential` بترتيب المصفوفة.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID مجموعة WhatsApp أو رقم E.164 أو معرف نظير آخر. القيمة هي مصفوفة معرفات الوكلاء الذين ينبغي أن يعالجوا الرسائل.
</ParamField>

## القيود

1. **الحد الأقصى للوكلاء:** لا يوجد حد صارم، لكن 10 وكلاء أو أكثر قد يكون بطيئا.
2. **السياق المشترك:** لا يرى الوكلاء ردود بعضهم البعض (حسب التصميم).
3. **ترتيب الرسائل:** قد تصل الردود المتوازية بأي ترتيب.
4. **حدود المعدل:** يحتسب جميع الوكلاء ضمن حدود معدل WhatsApp.

## التحسينات المستقبلية

الميزات المخطط لها:

- [ ] وضع السياق المشترك (يرى الوكلاء ردود بعضهم البعض)
- [ ] تنسيق الوكلاء (يمكن للوكلاء إرسال إشارات لبعضهم البعض)
- [ ] اختيار الوكلاء ديناميكيا (اختيار الوكلاء بناء على محتوى الرسالة)
- [ ] أولويات الوكلاء (يرد بعض الوكلاء قبل غيرهم)

## ذو صلة

- [توجيه القنوات](/ar/channels/channel-routing)
- [المجموعات](/ar/channels/groups)
- [أدوات صندوق الرمل متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools)
- [الإقران](/ar/channels/pairing)
- [إدارة الجلسات](/ar/concepts/session)
