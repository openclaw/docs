---
read_when:
    - تكوين مجموعات البث
    - تصحيح أخطاء ردود الوكلاء المتعددين في WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: إرسال رسالة WhatsApp إلى عدة وكلاء
title: مجموعات البث
x-i18n:
    generated_at: "2026-07-01T08:04:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97e8c2ade5d12a437864e6aca0d475e586289f71155188afed216881ebf89f88
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**الحالة:** تجريبي. أضيف في 2026.1.9.
</Note>

## نظرة عامة

تتيح مجموعات البث لعدة وكلاء معالجة الرسالة نفسها والرد عليها في الوقت نفسه. يتيح لك ذلك إنشاء فرق وكلاء متخصصة تعمل معا في مجموعة WhatsApp واحدة أو رسالة مباشرة واحدة، وكل ذلك باستخدام رقم هاتف واحد.

النطاق الحالي: **WhatsApp فقط** (قناة الويب).

تقيَّم مجموعات البث بعد قوائم السماح الخاصة بالقناة وقواعد تفعيل المجموعات. في مجموعات WhatsApp، يعني ذلك أن البث يحدث عندما يكون OpenClaw سيرد عادة (على سبيل المثال: عند الإشارة، حسب إعدادات مجموعتك).

يتضمن مسار ضمان جودة WhatsApp المباشر `whatsapp-broadcast-group-fanout`، الذي يتحقق من أن رسالة مجموعة واحدة تتضمن إشارة يمكن أن تنتج ردودا مرئية مميزة من وكيلين مكوّنين.

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

## التكوين

### الإعداد الأساسي

أضف قسما علويا باسم `broadcast` (بجوار `bindings`). المفاتيح هي معرّفات أقران WhatsApp:

- محادثات المجموعات: JID المجموعة (مثال: `120363403215116621@g.us`)
- الرسائل المباشرة: رقم هاتف بصيغة E.164 (مثال: `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**النتيجة:** عندما يكون OpenClaw سيرد في هذه المحادثة، سيشغّل الوكلاء الثلاثة جميعا.

### استراتيجية المعالجة

تحكم في كيفية معالجة الوكلاء للرسائل:

<Tabs>
  <Tab title="parallel (الافتراضي)">
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
    يعالج الوكلاء بالترتيب (ينتظر كل واحد اكتمال السابق):

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

## كيفية عمله

### تدفق الرسائل

<Steps>
  <Step title="وصول رسالة واردة">
    تصل رسالة من مجموعة WhatsApp أو رسالة مباشرة.
  </Step>
  <Step title="التوجيه والقبول">
    يطبق OpenClaw قوائم السماح الخاصة بالقناة، وقواعد تفعيل المجموعات، وملكية ارتباط ACP المكوّنة.
  </Step>
  <Step title="التحقق من البث">
    إذا لم يكن هناك ارتباط ACP مكوّن يملك المسار، يتحقق OpenClaw مما إذا كان معرّف النظير موجودا في `broadcast`.
  </Step>
  <Step title="إذا انطبق البث">
    - يعالج جميع الوكلاء المدرجين الرسالة.
    - لكل وكيل مفتاح جلسة خاص به وسياق معزول.
    - يعالج الوكلاء بالتوازي (افتراضيا) أو بالتتابع.

  </Step>
  <Step title="إذا لم ينطبق البث">
    يرسل OpenClaw المسار العادي أو مسار جلسة ACP المكوّن الذي تم اختياره أثناء التوجيه.
  </Step>
</Steps>

<Note>
لا تتجاوز مجموعات البث قوائم السماح الخاصة بالقناة أو قواعد تفعيل المجموعات (الإشارات/الأوامر/وما إلى ذلك). إنها لا تغيّر إلا _أي الوكلاء يعملون_ عندما تكون الرسالة مؤهلة للمعالجة.
</Note>

### عزل الجلسات

يحافظ كل وكيل في مجموعة بث على ما يلي بشكل منفصل تماما:

- **مفاتيح الجلسة** (`agent:alfred:whatsapp:group:120363...` مقابل `agent:baerbel:whatsapp:group:120363...`)
- **سجل المحادثة** (لا يرى الوكيل رسائل الوكلاء الآخرين)
- **مساحة العمل** (بيئات عزل منفصلة إذا كانت مكوّنة)
- **الوصول إلى الأدوات** (قوائم سماح/رفض مختلفة)
- **الذاكرة/السياق** (ملفات IDENTITY.md وSOUL.md وغيرها منفصلة)
- **مخزن سياق المجموعة المؤقت** (رسائل المجموعة الحديثة المستخدمة للسياق) مشترك لكل نظير، لذلك يرى جميع وكلاء البث السياق نفسه عند تشغيلهم

يتيح ذلك لكل وكيل أن يمتلك:

- شخصيات مختلفة
- وصولا مختلفا إلى الأدوات (مثلا، للقراءة فقط مقابل القراءة والكتابة)
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
    اجعل ما يفعله كل وكيل واضحا:

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
  <Accordion title="3. كوّن وصولا مختلفا إلى الأدوات">
    امنح الوكلاء الأدوات التي يحتاجون إليها فقط:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` مخصص للقراءة فقط. يمكن لـ `fixer` القراءة والكتابة.

  </Accordion>
  <Accordion title="4. راقب الأداء">
    مع وجود عدد كبير من الوكلاء، ضع في اعتبارك:

    - استخدام `"strategy": "parallel"` (الافتراضي) للسرعة
    - حصر مجموعات البث في 5-10 وكلاء
    - استخدام نماذج أسرع للوكلاء الأبسط

  </Accordion>
  <Accordion title="5. تعامل مع الإخفاقات بسلاسة">
    يفشل الوكلاء بشكل مستقل. لا يمنع خطأ وكيل واحد الآخرين:

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
- 🚧 Telegram (مخطط)
- 🚧 Discord (مخطط)
- 🚧 Slack (مخطط)

### التوجيه

تعمل مجموعات البث جنبا إلى جنب مع التوجيه الحالي:

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

- `GROUP_A`: يرد alfred فقط (توجيه عادي).
- `GROUP_B`: يرد agent1 وagent2 (بث).

<Note>
**الأسبقية:** يأخذ `broadcast` الأولوية على ارتباطات المسارات العادية. ارتباطات ACP المكوّنة (`bindings[].type="acp"`) حصرية: عند تطابق أحدها، يرسل OpenClaw إلى جلسة ACP المكوّنة بدلا من بث التوسيع.
</Note>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الوكلاء لا يردون">
    **تحقق من:**

    1. وجود معرّفات الوكلاء في `agents.list`.
    2. صحة تنسيق معرّف النظير (مثال: `120363403215116621@g.us`).
    3. عدم وجود الوكلاء في قوائم الرفض.

    **تصحيح الأخطاء:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="يرد وكيل واحد فقط">
    **السبب:** قد يكون معرّف النظير موجودا في ارتباطات المسارات العادية ولكن ليس في `broadcast`، أو قد يطابق ارتباط ACP مكوّنا حصريا.

    **الإصلاح:** أضف النظراء المرتبطين بمسارات عادية إلى تكوين البث، أو أزل/غيّر ارتباط ACP المكوّن إذا كان بث التوسيع مطلوبا.

  </Accordion>
  <Accordion title="مشكلات الأداء">
    إذا كان الأداء بطيئا مع عدد كبير من الوكلاء:

    - قلل عدد الوكلاء لكل مجموعة.
    - استخدم نماذج أخف (sonnet بدلا من opus).
    - تحقق من وقت بدء بيئة العزل.

  </Accordion>
</AccordionGroup>

## أمثلة

<AccordionGroup>
  <Accordion title="مثال 1: فريق مراجعة الكود">
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

    - code-formatter: "تم إصلاح الإزاحة وإضافة تلميحات الأنواع"
    - security-scanner: "⚠️ ثغرة حقن SQL في السطر 12"
    - test-coverage: "التغطية 45%، وتوجد اختبارات مفقودة لحالات الخطأ"
    - docs-checker: "سلسلة التوثيق مفقودة للدالة `process_data`"

  </Accordion>
  <Accordion title="مثال 2: دعم متعدد اللغات">
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

### مخطط التكوين

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
  كيفية معالجة الوكلاء. يشغّل `parallel` كل الوكلاء في الوقت نفسه؛ ويشغّلهم `sequential` بترتيبهم في المصفوفة.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID لمجموعة WhatsApp، أو رقم E.164، أو معرف نظير آخر. القيمة هي مصفوفة معرفات الوكلاء التي يجب أن تعالج الرسائل.
</ParamField>

## القيود

1. **الحد الأقصى للوكلاء:** لا يوجد حد صارم، لكن تشغيل أكثر من 10 وكلاء قد يكون بطيئًا.
2. **السياق المشترك:** لا يرى الوكلاء ردود بعضهم البعض (حسب التصميم).
3. **ترتيب الرسائل:** قد تصل الردود المتوازية بأي ترتيب.
4. **حدود المعدل:** يُحتسب كل الوكلاء ضمن حدود معدل WhatsApp.

## التحسينات المستقبلية

الميزات المخطط لها:

- [ ] وضع السياق المشترك (يرى الوكلاء ردود بعضهم البعض)
- [ ] تنسيق الوكلاء (يمكن للوكلاء إرسال إشارات إلى بعضهم البعض)
- [ ] الاختيار الديناميكي للوكلاء (اختيار الوكلاء بناءً على محتوى الرسالة)
- [ ] أولويات الوكلاء (يرد بعض الوكلاء قبل غيرهم)

## ذات صلة

- [توجيه القنوات](/ar/channels/channel-routing)
- [المجموعات](/ar/channels/groups)
- [أدوات بيئة الاختبار المعزولة متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools)
- [الإقران](/ar/channels/pairing)
- [إدارة الجلسات](/ar/concepts/session)
