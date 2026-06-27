---
read_when:
    - تكوين مجموعات البث
    - تصحيح أخطاء ردود الوكلاء المتعددين في WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: بث رسالة WhatsApp إلى عدة وكلاء
title: مجموعات البث
x-i18n:
    generated_at: "2026-06-27T17:09:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a89b936322baf0fea7b487cb5354b9fad3fc021abb2970f7cd934b1880da2a0e
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**الحالة:** تجريبي. أُضيف في 2026.1.9.
</Note>

## نظرة عامة

تتيح مجموعات البث لعدة وكلاء معالجة الرسالة نفسها والرد عليها في الوقت نفسه. يتيح لك ذلك إنشاء فرق وكلاء متخصصة تعمل معًا في مجموعة WhatsApp واحدة أو رسالة مباشرة واحدة، وكل ذلك باستخدام رقم هاتف واحد.

النطاق الحالي: **WhatsApp فقط** (قناة الويب).

تُقيَّم مجموعات البث بعد قوائم السماح للقنوات وقواعد تفعيل المجموعات. في مجموعات WhatsApp، يعني ذلك أن البث يحدث عندما يكون OpenClaw سيرد عادةً (مثلًا: عند الإشارة، بحسب إعدادات مجموعتك).

## حالات الاستخدام

<AccordionGroup>
  <Accordion title="1. فرق وكلاء متخصصة">
    انشر عدة وكلاء بمسؤوليات ذرّية ومركّزة:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    يعالج كل وكيل الرسالة نفسها ويقدّم منظوره المتخصص.

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

أضف قسم `broadcast` على المستوى الأعلى (بجانب `bindings`). المفاتيح هي معرّفات نظراء WhatsApp:

- محادثات المجموعات: JID المجموعة (مثل `120363403215116621@g.us`)
- الرسائل المباشرة: رقم هاتف E.164 (مثل `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**النتيجة:** عندما يكون OpenClaw سيرد في هذه المحادثة، سيشغّل الوكلاء الثلاثة جميعًا.

### استراتيجية المعالجة

تحكّم في كيفية معالجة الوكلاء للرسائل:

<Tabs>
  <Tab title="parallel (افتراضي)">
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
    يعالج الوكلاء بالترتيب (ينتظر أحدهم انتهاء السابق):

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
    تصل رسالة من مجموعة WhatsApp أو رسالة مباشرة.
  </Step>
  <Step title="التوجيه والقبول">
    يطبّق OpenClaw قوائم السماح للقنوات، وقواعد تفعيل المجموعات، وملكية ربط ACP المكوّنة.
  </Step>
  <Step title="فحص البث">
    إذا لم يكن هناك ربط ACP مكوّن يملك المسار، يفحص OpenClaw ما إذا كان معرّف النظير موجودًا في `broadcast`.
  </Step>
  <Step title="إذا انطبق البث">
    - يعالج جميع الوكلاء المدرجين الرسالة.
    - لكل وكيل مفتاح جلسة خاص وسياق معزول.
    - يعالج الوكلاء بالتوازي (افتراضيًا) أو بالتسلسل.

  </Step>
  <Step title="إذا لم ينطبق البث">
    يرسل OpenClaw إلى المسار العادي أو مسار جلسة ACP المكوّن الذي اختير أثناء التوجيه.
  </Step>
</Steps>

<Note>
لا تتجاوز مجموعات البث قوائم السماح للقنوات أو قواعد تفعيل المجموعات (الإشارات/الأوامر/إلخ). إنها تغيّر فقط _أي وكلاء يعملون_ عندما تكون الرسالة مؤهلة للمعالجة.
</Note>

### عزل الجلسات

يحافظ كل وكيل في مجموعة بث على فصل كامل لما يلي:

- **مفاتيح الجلسات** (`agent:alfred:whatsapp:group:120363...` مقابل `agent:baerbel:whatsapp:group:120363...`)
- **سجل المحادثة** (لا يرى الوكيل رسائل الوكلاء الآخرين)
- **مساحة العمل** (صناديق رمل منفصلة إذا جرت تهيئتها)
- **الوصول إلى الأدوات** (قوائم سماح/منع مختلفة)
- **الذاكرة/السياق** (ملفات IDENTITY.md وSOUL.md وما إلى ذلك منفصلة)
- **مخزن سياق المجموعة المؤقت** (رسائل المجموعة الأخيرة المستخدمة للسياق) مشترك لكل نظير، لذلك يرى جميع وكلاء البث السياق نفسه عند تشغيلهم

يتيح ذلك لكل وكيل أن يمتلك:

- شخصيات مختلفة
- وصولًا مختلفًا إلى الأدوات (مثلًا: قراءة فقط مقابل قراءة وكتابة)
- نماذج مختلفة (مثلًا: opus مقابل sonnet)
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
  <Accordion title="1. أبقِ الوكلاء مركّزين">
    صمّم كل وكيل بمسؤولية واحدة وواضحة:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **جيد:** لكل وكيل مهمة واحدة. ❌ **سيئ:** وكيل عام واحد "dev-helper".

  </Accordion>
  <Accordion title="2. استخدم أسماء وصفية">
    اجعل ما يفعله كل وكيل واضحًا:

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
  <Accordion title="3. اضبط وصولًا مختلفًا إلى الأدوات">
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

    `reviewer` للقراءة فقط. يمكن لـ `fixer` القراءة والكتابة.

  </Accordion>
  <Accordion title="4. راقب الأداء">
    عند وجود وكلاء كثيرين، ضع في اعتبارك:

    - استخدام `"strategy": "parallel"` (افتراضيًا) للسرعة
    - حصر مجموعات البث بين 5 و10 وكلاء
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

تعمل مجموعات البث حاليًا مع:

- ✅ WhatsApp (منفّذ)
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

- `GROUP_A`: يرد alfred فقط (توجيه عادي).
- `GROUP_B`: يرد agent1 وagent2 (بث).

<Note>
**الأسبقية:** يأخذ `broadcast` الأولوية على روابط المسارات العادية. روابط ACP المكوّنة (`bindings[].type="acp"`) حصرية: عند مطابقة أحدها، يرسل OpenClaw إلى جلسة ACP المكوّنة بدل بث fan-out.
</Note>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الوكلاء لا يردون">
    **تحقق من:**

    1. وجود معرّفات الوكلاء في `agents.list`.
    2. صحة تنسيق معرّف النظير (مثل `120363403215116621@g.us`).
    3. عدم وجود الوكلاء في قوائم المنع.

    **التصحيح:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="وكيل واحد فقط يرد">
    **السبب:** قد يكون معرّف النظير موجودًا في روابط المسارات العادية وليس في `broadcast`، أو قد يطابق ربط ACP مكوّنًا حصريًا.

    **الإصلاح:** أضف النظراء المرتبطين بالمسارات العادية إلى إعداد البث، أو أزل/غيّر ربط ACP المكوّن إذا كان بث fan-out مطلوبًا.

  </Accordion>
  <Accordion title="مشكلات الأداء">
    إذا كان بطيئًا مع عدد كبير من الوكلاء:

    - قلّل عدد الوكلاء لكل مجموعة.
    - استخدم نماذج أخف (sonnet بدل opus).
    - تحقق من وقت بدء تشغيل صندوق الرمل.

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

    - code-formatter: "أصلح المسافات البادئة وأضاف تلميحات الأنواع"
    - security-scanner: "⚠️ ثغرة حقن SQL في السطر 12"
    - test-coverage: "التغطية 45%، وهناك اختبارات مفقودة لحالات الخطأ"
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
  كيفية معالجة الوكلاء. يشغّل `parallel` جميع الوكلاء في الوقت نفسه؛ ويشغّلهم `sequential` بترتيب المصفوفة.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID مجموعة WhatsApp، أو رقم E.164، أو معرّف نظير آخر. القيمة هي مصفوفة معرّفات الوكلاء التي يجب أن تعالج الرسائل.
</ParamField>

## القيود

1. **الحد الأقصى للوكلاء:** لا يوجد حد صارم، لكن أكثر من 10 وكلاء قد يكون بطيئًا.
2. **السياق المشترك:** لا يرى الوكلاء ردود بعضهم بعضًا (حسب التصميم).
3. **ترتيب الرسائل:** قد تصل الردود المتوازية بأي ترتيب.
4. **حدود المعدل:** تُحتسب جميع الوكلاء ضمن حدود معدل WhatsApp.

## التحسينات المستقبلية

الميزات المخطط لها:

- [ ] وضع السياق المشترك (يرى الوكلاء ردود بعضهم بعضًا)
- [ ] تنسيق الوكلاء (يمكن للوكلاء إرسال إشارات إلى بعضهم بعضًا)
- [ ] الاختيار الديناميكي للوكلاء (اختيار الوكلاء بناءً على محتوى الرسالة)
- [ ] أولويات الوكلاء (يرد بعض الوكلاء قبل غيرهم)

## ذات صلة

- [توجيه القنوات](/ar/channels/channel-routing)
- [المجموعات](/ar/channels/groups)
- [أدوات بيئة الاختبار متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools)
- [الاقتران](/ar/channels/pairing)
- [إدارة الجلسات](/ar/concepts/session)
