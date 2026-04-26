---
read_when:
    - تكوين مجموعات البث
    - تصحيح أخطاء ردود الوكلاء المتعددين في WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: بث رسالة WhatsApp إلى عدة وكلاء
title: مجموعات البث
x-i18n:
    generated_at: "2026-04-26T11:22:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b36710d9cc3eb4e2b8ba3d57031bd020aedbb6a502b400ec02a835a320d609
    source_path: channels/broadcast-groups.md
    workflow: 15
---

<Note>
**الحالة:** تجريبي. أُضيف في 2026.1.9.
</Note>

## نظرة عامة

تُمكّن مجموعات البث عدة وكلاء من معالجة الرسالة نفسها والرد عليها في الوقت نفسه. يتيح لك ذلك إنشاء فرق وكلاء متخصصة تعمل معًا داخل مجموعة WhatsApp واحدة أو في محادثة خاصة — وكل ذلك باستخدام رقم هاتف واحد.

النطاق الحالي: **WhatsApp فقط** (قناة الويب).

تُقيَّم مجموعات البث بعد قوائم السماح الخاصة بالقنوات وقواعد تفعيل المجموعات. في مجموعات WhatsApp، يعني هذا أن عمليات البث تحدث عندما يكون OpenClaw سيرد عادةً (على سبيل المثال: عند الإشارة، بحسب إعدادات مجموعتك).

## حالات الاستخدام

<AccordionGroup>
  <Accordion title="1. فرق وكلاء متخصصة">
    انشر عدة وكلاء بمسؤوليات محددة ومركزة:

    ```
    Group: "فريق التطوير"
    Agents:
      - CodeReviewer (يراجع مقتطفات الشيفرة)
      - DocumentationBot (ينشئ الوثائق)
      - SecurityAuditor (يفحص الثغرات الأمنية)
      - TestGenerator (يقترح حالات اختبار)
    ```

    يعالج كل وكيل الرسالة نفسها ويقدّم منظورَه المتخصص.

  </Accordion>
  <Accordion title="2. دعم متعدد اللغات">
    ```
    Group: "الدعم الدولي"
    Agents:
      - Agent_EN (يرد باللغة الإنجليزية)
      - Agent_DE (يرد باللغة الألمانية)
      - Agent_ES (يرد باللغة الإسبانية)
    ```
  </Accordion>
  <Accordion title="3. سير عمل ضمان الجودة">
    ```
    Group: "دعم العملاء"
    Agents:
      - SupportAgent (يقدّم الإجابة)
      - QAAgent (يراجع الجودة، ولا يرد إلا إذا وُجدت مشكلات)
    ```
  </Accordion>
  <Accordion title="4. أتمتة المهام">
    ```
    Group: "إدارة المشاريع"
    Agents:
      - TaskTracker (يحدّث قاعدة بيانات المهام)
      - TimeLogger (يسجل الوقت المستغرق)
      - ReportGenerator (ينشئ الملخصات)
    ```
  </Accordion>
</AccordionGroup>

## التكوين

### الإعداد الأساسي

أضف قسمًا علويًا باسم `broadcast` (بجوار `bindings`). المفاتيح هي معرّفات peers الخاصة بـ WhatsApp:

- محادثات المجموعات: معرّف JID للمجموعة (مثل `120363403215116621@g.us`)
- المحادثات الخاصة: رقم هاتف بصيغة E.164 (مثل `+15551234567`)

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
        "name": "مراجع الشيفرة",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "مدقق الأمان",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "منشئ الوثائق",
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
    تصل رسالة من مجموعة WhatsApp أو من محادثة خاصة.
  </Step>
  <Step title="فحص البث">
    يتحقق النظام مما إذا كان معرّف الـ peer موجودًا في `broadcast`.
  </Step>
  <Step title="إذا كان في قائمة البث">
    - يعالج جميع الوكلاء المدرجين الرسالة.
    - لكل وكيل مفتاح جلسة خاص به وسياق معزول.
    - يعالج الوكلاء بالتوازي (افتراضيًا) أو بالتسلسل.
  </Step>
  <Step title="إذا لم يكن في قائمة البث">
    يُطبَّق التوجيه العادي (أول binding مطابق).
  </Step>
</Steps>

<Note>
لا تتجاوز مجموعات البث قوائم السماح الخاصة بالقنوات أو قواعد تفعيل المجموعات (الإشارات/الأوامر/إلخ). فهي تغيّر فقط _أي الوكلاء يعملون_ عندما تكون الرسالة مؤهلة للمعالجة.
</Note>

### عزل الجلسات

يحافظ كل وكيل في مجموعة بث على عناصر منفصلة تمامًا:

- **مفاتيح الجلسات** (`agent:alfred:whatsapp:group:120363...` مقابل `agent:baerbel:whatsapp:group:120363...`)
- **سجل المحادثة** (لا يرى الوكيل رسائل الوكلاء الآخرين)
- **مساحة العمل** (مساحات sandbox منفصلة إذا كانت مهيأة)
- **إمكانية الوصول إلى الأدوات** (قوائم سماح/منع مختلفة)
- **الذاكرة/السياق** (`IDENTITY.md` و`SOUL.md` وغير ذلك بشكل منفصل)
- **مخزن سياق المجموعة** (أحدث رسائل المجموعة المستخدمة كسياق) يكون مشتركًا لكل peer، لذا ترى جميع وكلاء البث السياق نفسه عند التفعيل

يتيح ذلك لكل وكيل أن يمتلك:

- شخصيات مختلفة
- صلاحيات مختلفة للأدوات (مثل القراءة فقط مقابل القراءة والكتابة)
- نماذج مختلفة (مثل opus مقابل sonnet)
- Skills مختلفة مثبتة

### مثال: جلسات معزولة

في المجموعة `120363403215116621@g.us` مع الوكيلين `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="سياق Alfred">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [رسالة المستخدم، ردود alfred السابقة]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="سياق Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [رسالة المستخدم، ردود baerbel السابقة]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## أفضل الممارسات

<AccordionGroup>
  <Accordion title="1. أبقِ الوكلاء مركزين">
    صمّم كل وكيل بمسؤولية واحدة واضحة:

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
        "security-scanner": { "name": "ماسح الأمان" },
        "code-formatter": { "name": "منسق الشيفرة" },
        "test-generator": { "name": "مولد الاختبارات" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. اضبط صلاحيات أدوات مختلفة">
    امنح الوكلاء فقط الأدوات التي يحتاجونها:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // قراءة فقط
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // قراءة وكتابة
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. راقب الأداء">
    عند وجود عدد كبير من الوكلاء، ضع في الاعتبار ما يلي:

    - استخدام `"strategy": "parallel"` (الافتراضي) للسرعة
    - حصر مجموعات البث في 5 إلى 10 وكلاء
    - استخدام نماذج أسرع للوكلاء الأبسط

  </Accordion>
  <Accordion title="5. تعامل مع حالات الفشل بسلاسة">
    يفشل الوكلاء بشكل مستقل. خطأ أحد الوكلاء لا يمنع الآخرين:

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

تعمل مجموعات البث جنبًا إلى جنب مع التوجيه الحالي:

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
- `GROUP_B`: يرد agent1 وagent2 معًا (بث).

<Note>
**الأولوية:** تكون لـ `broadcast` أولوية أعلى من `bindings`.
</Note>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الوكلاء لا يردون">
    **تحقق من:**

    1. وجود معرّفات الوكلاء في `agents.list`.
    2. صحة تنسيق معرّف الـ peer (مثل `120363403215116621@g.us`).
    3. أن الوكلاء ليسوا ضمن قوائم المنع.

    **التصحيح:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="وكيل واحد فقط يرد">
    **السبب:** قد يكون معرّف الـ peer موجودًا في `bindings` وليس في `broadcast`.

    **الحل:** أضِفه إلى إعدادات البث أو أزِله من bindings.

  </Accordion>
  <Accordion title="مشكلات الأداء">
    إذا كان الأداء بطيئًا مع عدد كبير من الوكلاء:

    - قلّل عدد الوكلاء لكل مجموعة.
    - استخدم نماذج أخف (sonnet بدلًا من opus).
    - تحقّق من وقت بدء تشغيل sandbox.

  </Accordion>
</AccordionGroup>

## أمثلة

<AccordionGroup>
  <Accordion title="مثال 1: فريق مراجعة الشيفرة">
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

    **يرسل المستخدم:** مقتطف شيفرة.

    **الردود:**

    - code-formatter: "أصلحتُ المسافات البادئة وأضفتُ تلميحات للأنواع"
    - security-scanner: "⚠️ توجد ثغرة SQL injection في السطر 12"
    - test-coverage: "نسبة التغطية 45%، وهناك اختبارات مفقودة لحالات الخطأ"
    - docs-checker: "يوجد docstring مفقود للدالة `process_data`"

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
  كيفية معالجة الوكلاء. يشغّل `parallel` جميع الوكلاء في الوقت نفسه؛ ويشغّل `sequential` الوكلاء بترتيب المصفوفة.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  معرّف JID لمجموعة WhatsApp، أو رقم E.164، أو أي معرّف peer آخر. القيمة هي مصفوفة معرّفات الوكلاء الذين يجب أن يعالجوا الرسائل.
</ParamField>

## القيود

1. **الحد الأقصى للوكلاء:** لا يوجد حد صارم، لكن قد يصبح 10+ وكلاء بطيئًا.
2. **السياق المشترك:** لا يرى الوكلاء ردود بعضهم البعض (عن قصد).
3. **ترتيب الرسائل:** قد تصل الردود المتوازية بأي ترتيب.
4. **حدود المعدل:** يُحتسب جميع الوكلاء ضمن حدود معدل WhatsApp.

## تحسينات مستقبلية

الميزات المخطط لها:

- [ ] وضع السياق المشترك (يرى الوكلاء ردود بعضهم البعض)
- [ ] تنسيق بين الوكلاء (يمكن للوكلاء إرسال إشارات إلى بعضهم البعض)
- [ ] اختيار ديناميكي للوكلاء (اختيار الوكلاء بناءً على محتوى الرسالة)
- [ ] أولويات الوكلاء (يرد بعض الوكلاء قبل غيرهم)

## ذو صلة

- [توجيه القنوات](/ar/channels/channel-routing)
- [المجموعات](/ar/channels/groups)
- [أدوات sandbox متعددة الوكلاء](/ar/tools/multi-agent-sandbox-tools)
- [الاقتران](/ar/channels/pairing)
- [إدارة الجلسات](/ar/concepts/session)
