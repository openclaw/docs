---
read_when:
    - تكوين مجموعات البث
    - تصحيح أخطاء ردود الوكلاء المتعددين في WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: بث رسالة WhatsApp إلى عدة وكلاء
title: مجموعات البث
x-i18n:
    generated_at: "2026-07-12T05:33:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**الحالة:** تجريبية. أُضيفت في 2026.1.9. متاحة لـ WhatsApp (قناة الويب) فقط.
</Note>

## نظرة عامة

تُشغّل مجموعات البث **وكلاء متعددين** لمعالجة الرسالة الواردة نفسها. يعالج كل وكيل الرسالة في جلسته المعزولة وينشر رده الخاص، بحيث يمكن لرقم WhatsApp واحد استضافة فريق من الوكلاء المتخصصين في محادثة جماعية واحدة أو رسالة خاصة.

تُقيَّم مجموعات البث بعد قوائم السماح الخاصة بالقناة وقواعد تفعيل المجموعة. في مجموعات WhatsApp، يحدث البث عندما يكون من المعتاد أن يرد OpenClaw (على سبيل المثال: عند الإشارة إليه، وفقًا لإعدادات مجموعتك). وهي لا تغيّر سوى **الوكلاء الذين يعملون**، ولا تغيّر مطلقًا ما إذا كانت الرسالة مؤهلة للمعالجة.

يتضمن مسار ضمان الجودة المباشر لـ WhatsApp الاختبار `whatsapp-broadcast-group-fanout`، الذي يتحقق من أن رسالة واحدة في مجموعة تتضمن إشارة يمكن أن تنتج ردودًا مرئية ومختلفة من وكيلين مهيأين.

## الإعداد

### الإعداد الأساسي

أضف قسم `broadcast` في المستوى الأعلى (بجوار `bindings`). المفاتيح هي معرّفات نظراء WhatsApp، والقيم هي مصفوفات من معرّفات الوكلاء:

- المحادثات الجماعية: معرّف JID للمجموعة (مثل `120363403215116621@g.us`)
- الرسائل الخاصة: رقم هاتف المرسل بتنسيق E.164 (مثل `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**النتيجة:** عندما يرد OpenClaw في هذه المحادثة، فإنه يشغّل الوكلاء الثلاثة جميعًا.

يجب أن يكون كل معرّف وكيل مُدرج موجودًا في `agents.list`: يُبلغ التحقق من صحة الإعداد عن المعرّفات غير المعروفة، ويتخطاها وقت التشغيل مع التحذير `Broadcast agent <id> not found in agents.list; skipping`.

### استراتيجية المعالجة

يحدد `broadcast.strategy` كيفية معالجة الوكلاء للرسالة:

| الاستراتيجية             | السلوك                                                              |
| -------------------- | --------------------------------------------------------------------- |
| `parallel` (الافتراضية) | يعالج جميع الوكلاء الرسالة بالتزامن؛ وقد تصل الردود بأي ترتيب.       |
| `sequential`         | يعالج الوكلاء الرسالة وفق ترتيب المصفوفة؛ وينتظر كل وكيل انتهاء الوكيل السابق. |

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

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

## آلية العمل

### تدفق الرسالة

<Steps>
  <Step title="وصول رسالة واردة">
    تصل رسالة من مجموعة WhatsApp أو رسالة خاصة.
  </Step>
  <Step title="التوجيه والقبول">
    يطبّق OpenClaw قوائم السماح الخاصة بالقناة وقواعد تفعيل المجموعة وملكية ربط ACP المهيأة.
  </Step>
  <Step title="التحقق من البث">
    إذا لم يمتلك أي ربط ACP مهيأ المسار، يتحقق OpenClaw مما إذا كان معرّف النظير موجودًا في `broadcast`.
  </Step>
  <Step title="إذا انطبق البث">
    - يعالج جميع الوكلاء المُدرجين الرسالة.
    - لكل وكيل مفتاح جلسة خاص به وسياق معزول.
    - يعالج الوكلاء الرسالة بالتوازي (افتراضيًا) أو بالتتابع.
    - تُنسخ المرفقات الصوتية نصيًا مرة واحدة قبل التوزيع، بحيث يتشارك الوكلاء نصًا منسوخًا واحدًا بدلًا من إجراء استدعاءات STT منفصلة.

  </Step>
  <Step title="إذا لم ينطبق البث">
    يرسل OpenClaw الرسالة عبر المسار العادي أو مسار جلسة ACP المهيأ الذي تم اختياره أثناء التوجيه.
  </Step>
</Steps>

<Note>
لا تتجاوز مجموعات البث قوائم السماح الخاصة بالقناة أو قواعد تفعيل المجموعة (الإشارات/الأوامر/وما إلى ذلك). وإنما تغيّر فقط _الوكلاء الذين يعملون_ عندما تكون الرسالة مؤهلة للمعالجة.
</Note>

### عزل الجلسات

يحتفظ كل وكيل في مجموعة بث بما يلي بصورة منفصلة تمامًا:

- **مفاتيح الجلسات** (`agent:alfred:whatsapp:group:120363...` مقابل `agent:baerbel:whatsapp:group:120363...`)
- **سجل المحادثة** (لا يرى الوكيل ردود الوكلاء الآخرين)
- **مساحة العمل** (بيئات معزولة منفصلة إذا كانت مهيأة)
- **الوصول إلى الأدوات** (قوائم سماح/رفض مختلفة)
- **الذاكرة/السياق** (ملفات `IDENTITY.md` و`SOUL.md` منفصلة، وما إلى ذلك)

يوجد استثناء واحد مشترك عمدًا: **مخزن سياق المجموعة المؤقت** (رسائل المجموعة الأخيرة المستخدمة للسياق) مشترك لكل نظير، بحيث يرى جميع وكلاء البث السياق نفسه عند تشغيلهم. ويُمسح مرة واحدة بعد اكتمال التوزيع.

يتيح ذلك لكل وكيل امتلاك شخصيات ونماذج وSkills وإمكانية وصول إلى الأدوات مختلفة (مثل القراءة فقط مقابل القراءة والكتابة).

### مثال: جلسات معزولة

في المجموعة `120363403215116621@g.us` مع الوكيلين `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="سياق Alfred">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="سياق Baerbel">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## حالات الاستخدام

- **فرق الوكلاء المتخصصين**: مجموعة تطوير يجيب فيها كل من `code-reviewer` و`security-auditor` و`test-generator` و`docs-checker` عن الرسالة نفسها من منظوره الخاص.
- **دعم متعدد اللغات**: محادثة دعم واحدة يستجيب فيها `support-en` و`support-de` و`support-es` بلغاتهم.
- **ضمان الجودة**: يجيب `support-agent` بينما يراجع `qa-agent` ولا يستجيب إلا عندما يعثر على مشكلات.
- **أتمتة المهام**: يستهلك كل من `task-tracker` و`time-logger` و`report-generator` تحديث الحالة نفسه.

## أفضل الممارسات

<AccordionGroup>
  <Accordion title="1. حافظ على تركيز الوكلاء">
    امنح كل وكيل مسؤولية واحدة واضحة (`formatter` أو `linter` أو `tester`) بدلًا من وكيل عام باسم "dev-helper".
  </Accordion>
  <Accordion title="2. استخدم معرّفات وأسماء وصفية">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. هيّئ صلاحيات وصول مختلفة إلى الأدوات">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    يمتلك `reviewer` صلاحية القراءة فقط. ويمكن لـ `fixer` القراءة والكتابة.

  </Accordion>
  <Accordion title="4. راقب الأداء">
    عند استخدام عدد كبير من الوكلاء، فضّل `"strategy": "parallel"` (الافتراضية)، واقصر مجموعات البث على عدد قليل من الوكلاء، واستخدم نماذج أسرع للوكلاء الأبسط.
  </Accordion>
  <Accordion title="5. تظل حالات الفشل معزولة">
    يفشل الوكلاء بصورة مستقلة. يُسجَّل خطأ أي وكيل (`Broadcast agent <id> failed: ...`) ولا يحظر الوكلاء الآخرين.
  </Accordion>
</AccordionGroup>

## التوافق

### المزوّدون

تُنفَّذ مجموعات البث حاليًا لـ WhatsApp (قناة الويب) فقط. وتتجاهل القنوات الأخرى إعداد `broadcast`.

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

- `GROUP_A`: يستجيب alfred فقط (التوجيه العادي).
- `GROUP_B`: يستجيب agent1 وagent2 (البث).

<Note>
**الأسبقية:** تكون لـ `broadcast` الأولوية على روابط المسارات العادية. روابط ACP المهيأة (`bindings[].type="acp"`) حصرية: عند تطابق أحدها، يرسل OpenClaw الرسالة إلى جلسة ACP المهيأة بدلًا من بث التوزيع.
</Note>

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="الوكلاء لا يستجيبون">
    **تحقق مما يلي:**

    1. معرّفات الوكلاء موجودة في `agents.list` (يرفض التحقق من صحة الإعداد المعرّفات غير المعروفة).
    2. تنسيق معرّف النظير صحيح (معرّف JID للمجموعة مثل `120363403215116621@g.us`، أو رقم E.164 مثل `+15551234567` للرسائل الخاصة).
    3. اجتازت الرسالة ضوابط القبول المعتادة (تظل قواعد الإشارة/التفعيل سارية).

    **تصحيح الأخطاء:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    يُسجّل التوزيع الناجح `Broadcasting message to <n> agents (<strategy>)`.

  </Accordion>
  <Accordion title="استجابة وكيل واحد فقط">
    **السبب:** قد يكون معرّف النظير موجودًا في روابط المسارات العادية وليس في `broadcast`، أو قد يتطابق مع ربط ACP حصري مهيأ.

    **الحل:** أضف النظراء المرتبطين بمسارات عادية إلى إعداد البث، أو أزل/غيّر ربط ACP المهيأ إذا كنت تريد بث التوزيع.

  </Accordion>
  <Accordion title="مشكلات الأداء">
    إذا كان الأداء بطيئًا مع عدد كبير من الوكلاء: قلّل عدد الوكلاء لكل مجموعة، واستخدم نماذج أخف، وتحقق من زمن بدء البيئة المعزولة.
  </Accordion>
</AccordionGroup>

## أمثلة

<AccordionGroup>
  <Accordion title="المثال 1: فريق مراجعة الشيفرة">
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

    ينتج عن مقتطف شيفرة واحد في المجموعة أربعة ردود: إصلاحات التنسيق، وملاحظة أمنية، وفجوة في التغطية، وملاحظة طفيفة على التوثيق.

  </Accordion>
  <Accordion title="المثال 2: مسار معالجة متعدد اللغات">
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
  كيفية معالجة الوكلاء. يشغّل `parallel` جميع الوكلاء بالتزامن؛ بينما يشغّلهم `sequential` وفق ترتيب المصفوفة.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  معرّف JID لمجموعة WhatsApp أو رقم هاتف بتنسيق E.164. القيمة هي مصفوفة معرّفات الوكلاء الذين يجب أن يعالجوا جميعًا الرسائل الواردة من ذلك النظير.
</ParamField>

## القيود

1. **الحد الأقصى للوكلاء:** لا يوجد حد صارم، لكن استخدام عدد كبير من الوكلاء (10 فأكثر) قد يكون بطيئًا.
2. **السياق المشترك:** لا يرى الوكلاء ردود بعضهم بعضًا (حسب التصميم).
3. **ترتيب الرسائل:** قد تصل الردود المتوازية بأي ترتيب.
4. **حدود المعدل:** تصدر جميع الردود من حساب WhatsApp واحد، لذا يُحتسب رد كل وكيل ضمن حدود معدل WhatsApp نفسها.

## ذو صلة

- [توجيه القنوات](/ar/channels/channel-routing)
- [المجموعات](/ar/channels/groups)
- [أدوات وضع الحماية متعدد الوكلاء](/ar/tools/multi-agent-sandbox-tools)
- [الإقران](/ar/channels/pairing)
- [إدارة الجلسات](/ar/concepts/session)
