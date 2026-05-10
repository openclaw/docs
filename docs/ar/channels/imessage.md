---
read_when:
    - إعداد دعم iMessage
    - تصحيح أخطاء الإرسال/الاستقبال في iMessage
summary: دعم iMessage أصلي عبر imsg ‏(JSON-RPC عبر stdio)، مع إجراءات API خاصة للردود وtapbacks والمؤثرات والمرفقات وإدارة المجموعات. مفضّل لإعدادات OpenClaw iMessage الجديدة عندما تكون متطلبات المضيف مناسبة.
title: iMessage
x-i18n:
    generated_at: "2026-05-10T19:22:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 249d5faf9718e354caecaeb8ee22f66f9e24b50c6b091997d1c2286c44c1581d
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
بالنسبة إلى عمليات نشر iMessage في OpenClaw، استخدم `imsg` على مضيف macOS Messages مسجّل الدخول. إذا كان Gateway لديك يعمل على Linux أو Windows، فوجّه `channels.imessage.cliPath` إلى مغلّف SSH يشغّل `imsg` على جهاز Mac.

**تعويض توقّف Gateway اختياري.** عند تفعيله (`channels.imessage.catchup.enabled: true`)، يعيد Gateway تشغيل الرسائل الواردة التي وصلت إلى `chat.db` أثناء توقفه عن الاتصال (تعطّل، إعادة تشغيل، سكون Mac) عند بدء التشغيل التالي. معطّل افتراضيًا — راجع [التعويض بعد توقّف Gateway](#catching-up-after-gateway-downtime). يغلق [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
تمت إزالة دعم BlueBubbles. انقل إعدادات `channels.bluebubbles` إلى `channels.imessage`؛ يدعم OpenClaw ‏iMessage عبر `imsg` فقط.
</Warning>

الحالة: تكامل CLI خارجي أصلي. يشغّل Gateway الأمر `imsg rpc` ويتواصل عبر JSON-RPC على stdio (لا توجد خدمة/منفذ منفصل). تتطلب الإجراءات المتقدمة `imsg launch` وفحص API خاص ناجحًا.

<CardGroup cols={3}>
  <Card title="إجراءات API الخاصة" icon="wand-sparkles" href="#private-api-actions">
    الردود، وردود tapback، والتأثيرات، والمرفقات، وإدارة المجموعات.
  </Card>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    رسائل iMessage المباشرة تعتمد وضع الاقتران افتراضيًا.
  </Card>
  <Card title="Mac بعيد" icon="terminal" href="#remote-mac-over-ssh">
    استخدم مغلّف SSH عندما لا يكون Gateway يعمل على جهاز Mac الخاص بـ Messages.
  </Card>
  <Card title="مرجع الإعدادات" icon="settings" href="/ar/gateway/config-channels#imessage">
    مرجع كامل لحقول iMessage.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Mac محلي (المسار السريع)">
    <Steps>
      <Step title="تثبيت imsg والتحقق منه">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="إعداد OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="بدء Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="اعتماد أول اقتران لرسالة مباشرة (dmPolicy الافتراضي)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac بعيد عبر SSH">
    لا يتطلب OpenClaw إلا `cliPath` متوافقًا مع stdio، لذا يمكنك توجيه `cliPath` إلى سكربت مغلّف يتصل عبر SSH بجهاز Mac بعيد ويشغّل `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    الإعدادات الموصى بها عند تفعيل المرفقات:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    إذا لم يتم تعيين `remoteHost`، يحاول OpenClaw اكتشافه تلقائيًا عبر تحليل سكربت مغلّف SSH.
    يجب أن يكون `remoteHost` على شكل `host` أو `user@host` (بدون مسافات أو خيارات SSH).
    يستخدم OpenClaw تحققًا صارمًا من مفتاح المضيف لـ SCP، لذلك يجب أن يكون مفتاح مضيف الترحيل موجودًا مسبقًا في `~/.ssh/known_hosts`.
    يتم التحقق من مسارات المرفقات مقابل الجذور المسموح بها (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## المتطلبات والأذونات (macOS)

- يجب تسجيل الدخول إلى Messages على جهاز Mac الذي يشغّل `imsg`.
- يلزم منح Full Disk Access لسياق العملية الذي يشغّل OpenClaw/`imsg` (للوصول إلى قاعدة بيانات Messages).
- يلزم إذن Automation لإرسال الرسائل عبر Messages.app.
- بالنسبة إلى الإجراءات المتقدمة (تفاعل / تعديل / إلغاء إرسال / رد مترابط / تأثيرات / عمليات المجموعات)، يجب تعطيل System Integrity Protection — راجع [تفعيل API الخاصة بـ imsg](#enabling-the-imsg-private-api) أدناه. يعمل إرسال/استقبال النصوص والوسائط الأساسي بدونه.

<Tip>
تُمنح الأذونات لكل سياق عملية. إذا كان Gateway يعمل دون واجهة (LaunchAgent/SSH)، فشغّل أمرًا تفاعليًا لمرة واحدة في السياق نفسه لتشغيل المطالبات:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## تفعيل API الخاصة بـ imsg

يُشحن `imsg` في وضعين تشغيليين:

- **الوضع الأساسي** (افتراضي، لا يلزم إجراء تغييرات على SIP): نصوص ووسائط صادرة عبر `send`، ومراقبة/سجل وارد، وقائمة محادثات. هذا ما تحصل عليه مباشرة من تثبيت جديد باستخدام `brew install steipete/tap/imsg` مع أذونات macOS القياسية أعلاه.
- **وضع API الخاصة**: يحقن `imsg` مكتبة dylib مساعدة داخل `Messages.app` لاستدعاء دوال `IMCore` الداخلية. هذا ما يفعّل `react`، و`edit`، و`unsend`، و`reply` (المترابط)، و`sendWithEffect`، و`renameGroup`، و`setGroupIcon`، و`addParticipant`، و`removeParticipant`، و`leaveGroup`، إضافة إلى مؤشرات الكتابة وإيصالات القراءة.

للوصول إلى سطح الإجراءات المتقدمة الذي توثّقه صفحة القناة هذه، تحتاج إلى وضع API الخاصة. يوضح ملف README الخاص بـ `imsg` المتطلب صراحة:

> الميزات المتقدمة مثل `read`، و`typing`، و`launch`، والإرسال الغني المدعوم بجسر، وتعديل الرسائل، وإدارة المحادثات اختيارية التفعيل. تتطلب تعطيل SIP وحقن مكتبة dylib مساعدة داخل `Messages.app`. يرفض `imsg launch` الحقن عندما يكون SIP مفعّلًا.

تستخدم تقنية حقن المساعد مكتبة dylib الخاصة بـ `imsg` للوصول إلى واجهات API الخاصة في Messages. لا يوجد خادم خارجي تابع لطرف ثالث أو وقت تشغيل BlueBubbles في مسار iMessage داخل OpenClaw.

<Warning>
**تعطيل SIP مفاضلة أمنية حقيقية.** يُعد SIP أحد وسائل الحماية الأساسية في macOS ضد تشغيل كود نظام معدّل؛ وإيقافه على مستوى النظام يفتح سطح هجوم إضافيًا وآثارًا جانبية. من الجدير بالذكر أن **تعطيل SIP على أجهزة Apple Silicon Mac يعطّل أيضًا إمكانية تثبيت وتشغيل تطبيقات iOS على جهاز Mac لديك**.

تعامل مع هذا كخيار تشغيلي متعمد، وليس كإعداد افتراضي. إذا كان نموذج التهديد لديك لا يمكنه تحمّل إيقاف SIP، فإن iMessage المضمّن يقتصر على الوضع الأساسي — إرسال/استقبال النصوص والوسائط فقط، بدون تفاعلات / تعديل / إلغاء إرسال / تأثيرات / عمليات مجموعات.
</Warning>

### الإعداد

1. **ثبّت (أو حدّث) `imsg`** على جهاز Mac الذي يشغّل Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   يعرض خرج `imsg status --json` القيم `bridge_version` و`rpc_methods` و`selectors` لكل طريقة، حتى تتمكن من معرفة ما يدعمه البناء الحالي قبل البدء.

2. **عطّل System Integrity Protection.** هذا خاص بإصدار macOS لأن متطلب Apple الأساسي يعتمد على نظام التشغيل والعتاد:
   - **macOS 10.13–10.15 (Sierra–Catalina):** عطّل Library Validation عبر Terminal، وأعد التشغيل إلى Recovery Mode، وشغّل `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+ (Big Sur والإصدارات اللاحقة)، Intel:** Recovery Mode (أو Internet Recovery)، ثم `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+، Apple Silicon:** استخدم تسلسل بدء التشغيل بزر الطاقة للدخول إلى Recovery؛ في إصدارات macOS الحديثة اضغط باستمرار على مفتاح **Left Shift** عند النقر على Continue، ثم `csrutil disable`. تتبع إعدادات الأجهزة الافتراضية مسارًا منفصلًا — خذ لقطة VM أولًا.
   - **macOS 26 / Tahoe:** أصبحت سياسات library-validation وفحوصات الاستحقاقات الخاصة في `imagent` أكثر صرامة؛ قد يحتاج `imsg` إلى بناء محدّث لمواكبتها. إذا بدأ حقن `imsg launch` أو `selectors` محددة بإرجاع false بعد ترقية رئيسية لـ macOS، فراجع ملاحظات إصدار `imsg` قبل افتراض نجاح خطوة SIP.

   اتبع مسار Recovery Mode من Apple لجهاز Mac لديك لتعطيل SIP قبل تشغيل `imsg launch`.

3. **احقن المساعد.** مع تعطيل SIP وتسجيل الدخول إلى Messages.app:

   ```bash
   imsg launch
   ```

   يرفض `imsg launch` الحقن عندما يكون SIP لا يزال مفعّلًا، لذا يعمل هذا أيضًا كتأكيد على نجاح الخطوة 2.

4. **تحقق من الجسر من OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   يجب أن يُبلغ إدخال iMessage عن `works`، ويجب أن يعرض `imsg status --json | jq '.selectors'` القيمة `retractMessagePart: true` إضافة إلى أي محددات تعديل / كتابة / قراءة يتيحها بناء macOS لديك. لا يعلن gating لكل طريقة في Plugin الخاص بـ OpenClaw داخل `actions.ts` إلا عن الإجراءات التي يكون المحدد الأساسي لها `true`، لذلك يعكس سطح الإجراءات الذي تراه في قائمة أدوات الوكيل ما يستطيع الجسر فعله فعليًا على هذا المضيف.

إذا أبلغ `openclaw channels status --probe` أن القناة `works` لكن إجراءات محددة ترمي الخطأ "يتطلب iMessage `<action>` جسر API الخاصة بـ imsg" عند وقت الإرسال، فشغّل `imsg launch` مرة أخرى — قد يخرج المساعد من الخدمة (إعادة تشغيل Messages.app، تحديث نظام التشغيل، إلخ)، وستستمر حالة `available: true` المخزنة مؤقتًا في الإعلان عن الإجراءات حتى يحدّث الفحص التالي الحالة.

### عندما لا يمكنك تعطيل SIP

إذا لم يكن تعطيل SIP مقبولًا لنموذج التهديد لديك:

- يعود `imsg` إلى الوضع الأساسي — نص + وسائط + استقبال فقط.
- يظل Plugin الخاص بـ OpenClaw يعلن عن إرسال النصوص/الوسائط والمراقبة الواردة؛ لكنه يخفي `react`، و`edit`، و`unsend`، و`reply`، و`sendWithEffect`، وعمليات المجموعات من سطح الإجراءات (وفق بوابة القدرة لكل طريقة).
- يمكنك تشغيل جهاز Mac منفصل غير Apple Silicon (أو جهاز Mac مخصص للبوت) مع إيقاف SIP لعبء عمل iMessage، مع إبقاء SIP مفعّلًا على أجهزتك الأساسية. راجع [مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)](#deployment-patterns) أدناه.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.imessage.dmPolicy` في الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    حقل قائمة السماح: `channels.imessage.allowFrom`.

    يمكن أن تكون إدخالات قائمة السماح معرفات، أو مجموعات وصول ثابتة للمرسل (`accessGroup:<name>`)، أو أهداف محادثة (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`).

  </Tab>

  <Tab title="سياسة المجموعات + الإشارات">
    يتحكم `channels.imessage.groupPolicy` في التعامل مع المجموعات:

    - `allowlist` (افتراضي عند تهيئته)
    - `open`
    - `disabled`

    قائمة سماح مرسل المجموعة: `channels.imessage.groupAllowFrom`.

    يمكن أن تشير إدخالات `groupAllowFrom` أيضًا إلى مجموعات وصول ثابتة للمرسل (`accessGroup:<name>`).

    fallback وقت التشغيل: إذا لم يتم تعيين `groupAllowFrom`، تعود فحوصات مرسل مجموعة iMessage إلى `allowFrom` عند توفرها.
    ملاحظة وقت التشغيل: إذا كان `channels.imessage` مفقودًا تمامًا، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا تم تعيين `channels.defaults.groupPolicy`).

    <Warning>
    يحتوي توجيه المجموعات على بوابتي قائمة سماح **اثنتين** تعملان بالتتابع، ويجب أن تنجحا كلتاهما:

    1. **قائمة سماح المرسل / هدف المحادثة** (`channels.imessage.groupAllowFrom`) — معرف، أو `chat_guid`، أو `chat_identifier`، أو `chat_id`.
    2. **سجل المجموعات** (`channels.imessage.groups`) — مع `groupPolicy: "allowlist"`، تتطلب هذه البوابة إما إدخالًا عامًا `groups: { "*": { ... } }` (يضبط `allowAll = true`)، أو إدخالًا صريحًا لكل `chat_id` ضمن `groups`.

    إذا لم تحتوِ البوابة 2 على أي شيء، يتم إسقاط كل رسالة مجموعة. يصدر Plugin إشارتين بمستوى `warn` على مستوى السجل الافتراضي:

    - مرة واحدة لكل حساب عند بدء التشغيل: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - مرة واحدة لكل `chat_id` في وقت التشغيل: `imessage: dropping group message from chat_id=<id> ...`

    تستمر الرسائل المباشرة في العمل لأنها تسلك مسار كود مختلفًا.

    الحد الأدنى من الإعدادات لإبقاء المجموعات متدفقة ضمن `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    إذا ظهرت أسطر `warn` هذه في سجل Gateway، فإن البوابة 2 تُسقط الرسائل — أضف كتلة `groups`.
    </Warning>

    بوابة الإشارات للمجموعات:

    - لا يحتوي iMessage على بيانات وصفية أصلية للإشارة
    - يستخدم اكتشاف الإشارات أنماط regex (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - من دون أنماط مهيأة، لا يمكن فرض بوابة الإشارة

    يمكن لأوامر التحكم من المرسلين المصرح لهم تجاوز بوابة الإشارة في المجموعات.

    `systemPrompt` لكل مجموعة:

    يقبل كل إدخال ضمن `channels.imessage.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن القيمة في موجّه النظام الخاص بالوكيل في كل دور يعالج رسالة في تلك المجموعة. يحاكي الحل طريقة حل الموجّه لكل مجموعة المستخدمة بواسطة `channels.whatsapp.groups`:

    1. **موجّه النظام الخاص بالمجموعة** (`groups["<chat_id>"].systemPrompt`): يُستخدم عندما يكون إدخال المجموعة المحددة موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` معرّفًا. إذا كانت `systemPrompt` سلسلة فارغة (`""`) فسيتم كبت حرف البدل ولن يُطبق أي موجّه نظام على تلك المجموعة.
    2. **موجّه نظام حرف البدل للمجموعات** (`groups["*"].systemPrompt`): يُستخدم عندما يكون إدخال المجموعة المحددة غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    لا تنطبق موجّهات كل مجموعة إلا على رسائل المجموعات — ولا تتأثر الرسائل المباشرة في هذه القناة.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - تستخدم الرسائل المباشرة التوجيه المباشر؛ وتستخدم المجموعات توجيه المجموعات.
    - مع الإعداد الافتراضي `session.dmScope=main`، تُدمج رسائل iMessage المباشرة في جلسة الوكيل الرئيسية.
    - جلسات المجموعات معزولة (`agent:<agentId>:imessage:group:<chat_id>`).
    - تُوجَّه الردود مرة أخرى إلى iMessage باستخدام البيانات الوصفية للقناة/الهدف الأصليين.

    سلوك سلاسل المحادثات الشبيهة بالمجموعات:

    قد تصل بعض سلاسل iMessage متعددة المشاركين مع `is_group=false`.
    إذا كان ذلك `chat_id` مهيأً صراحةً ضمن `channels.imessage.groups`، يعامله OpenClaw كحركة مرور مجموعة (بوابة المجموعة + عزل جلسة المجموعة).

  </Tab>
</Tabs>

## روابط محادثات ACP

يمكن أيضًا ربط محادثات iMessage القديمة بجلسات ACP.

تدفق سريع للمشغل:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو محادثة المجموعة المسموح بها.
- ستُوجَّه الرسائل المستقبلية في محادثة iMessage نفسها إلى جلسة ACP المنشأة.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

تُدعم الروابط الدائمة المهيأة عبر إدخالات `bindings[]` في المستوى الأعلى مع `type: "acp"` و`match.channel: "imessage"`.

يمكن أن يستخدم `match.peer.id` ما يلي:

- معرّف رسالة مباشرة مطبّع مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>` (موصى به لروابط المجموعات المستقرة)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

مثال:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

راجع [وكلاء ACP](/ar/tools/acp-agents) لمعرفة سلوك ربط ACP المشترك.

## أنماط النشر

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    استخدم Apple ID ومستخدم macOS مخصصين حتى تُعزل حركة مرور البوت عن ملف Messages الشخصي لديك.

    التدفق المعتاد:

    1. أنشئ/سجّل الدخول إلى مستخدم macOS مخصص.
    2. سجّل الدخول إلى Messages باستخدام Apple ID الخاص بالبوت في ذلك المستخدم.
    3. ثبّت `imsg` في ذلك المستخدم.
    4. أنشئ غلاف SSH حتى يتمكن OpenClaw من تشغيل `imsg` في سياق ذلك المستخدم.
    5. وجّه `channels.imessage.accounts.<id>.cliPath` و`.dbPath` إلى ملف ذلك المستخدم.

    قد يتطلب التشغيل الأول موافقات واجهة رسومية (Automation + Full Disk Access) في جلسة مستخدم البوت تلك.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    البنية الشائعة:

    - يعمل Gateway على Linux/VM
    - يعمل iMessage + `imsg` على Mac في شبكتك tailnet
    - يستخدم غلاف `cliPath` SSH لتشغيل `imsg`
    - يفعّل `remoteHost` جلب المرفقات عبر SCP

    مثال:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    استخدم مفاتيح SSH بحيث يكون كل من SSH وSCP غير تفاعليين.
    تأكد أولًا من الوثوق بمفتاح المضيف (مثلًا `ssh bot@mac-mini.tailnet-1234.ts.net`) حتى تتم تعبئة `known_hosts`.

  </Accordion>

  <Accordion title="Multi-account pattern">
    يدعم iMessage تهيئة لكل حساب ضمن `channels.imessage.accounts`.

    يمكن لكل حساب تجاوز حقول مثل `cliPath` و`dbPath` و`allowFrom` و`groupPolicy` و`mediaMaxMb` وإعدادات السجل وقوائم السماح لجذور المرفقات.

  </Accordion>
</AccordionGroup>

## الوسائط والتقسيم وأهداف التسليم

<AccordionGroup>
  <Accordion title="Attachments and media">
    - إدخال المرفقات الواردة **متوقف افتراضيًا** — عيّن `channels.imessage.includeAttachments: true` لتمرير الصور والمذكرات الصوتية والفيديو والمرفقات الأخرى إلى الوكيل. عند تعطيله، تُسقط رسائل iMessage التي تحتوي على مرفقات فقط قبل الوصول إلى الوكيل وقد لا تُنتج أي سطر سجل `Inbound message` على الإطلاق.
    - يمكن جلب مسارات المرفقات البعيدة عبر SCP عند تعيين `remoteHost`
    - يجب أن تطابق مسارات المرفقات الجذور المسموح بها:
      - `channels.imessage.attachmentRoots` (محلي)
      - `channels.imessage.remoteAttachmentRoots` (وضع SCP البعيد)
      - نمط الجذر الافتراضي: `/Users/*/Library/Messages/Attachments`
    - يستخدم SCP فحصًا صارمًا لمفتاح المضيف (`StrictHostKeyChecking=yes`)
    - يستخدم حجم الوسائط الصادرة `channels.imessage.mediaMaxMb` (الافتراضي 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - حد مقطع النص: `channels.imessage.textChunkLimit` (الافتراضي 4000)
    - وضع التقسيم: `channels.imessage.chunkMode`
      - `length` (الافتراضي)
      - `newline` (تقسيم يعطي الأولوية للفقرات)

  </Accordion>

  <Accordion title="Addressing formats">
    الأهداف الصريحة المفضلة:

    - `chat_id:123` (موصى به للتوجيه المستقر)
    - `chat_guid:...`
    - `chat_identifier:...`

    أهداف المعرّفات مدعومة أيضًا:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## إجراءات API الخاصة

عندما يكون `imsg launch` قيد التشغيل ويبلغ `openclaw channels status --probe` عن `privateApi.available: true`، يمكن لأداة الرسائل استخدام إجراءات iMessage الأصلية إضافةً إلى عمليات إرسال النص العادية.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**: إضافة/إزالة tapbacks في iMessage (`messageId`، `emoji`، `remove`). تُطابق tapbacks المدعومة الحب، والإعجاب، وعدم الإعجاب، والضحك، والتأكيد، والسؤال.
    - **reply**: إرسال رد ضمن سلسلة إلى رسالة موجودة (`messageId`، `text` أو `message`، إضافة إلى `chatGuid` أو `chatId` أو `chatIdentifier` أو `to`).
    - **sendWithEffect**: إرسال نص مع تأثير iMessage (`text` أو `message`، `effect` أو `effectId`).
    - **edit**: تعديل رسالة مرسلة على إصدارات macOS/API الخاصة المدعومة (`messageId`، `text` أو `newText`).
    - **unsend**: سحب رسالة مرسلة على إصدارات macOS/API الخاصة المدعومة (`messageId`).
    - **upload-file**: إرسال وسائط/ملفات (`buffer` بصيغة base64 أو `media`/`path`/`filePath` مروّى، و`filename`، و`asVoice` اختياري). الاسم المستعار القديم: `sendAttachment`.
    - **renameGroup** و**setGroupIcon** و**addParticipant** و**removeParticipant** و**leaveGroup**: إدارة محادثات المجموعات عندما يكون الهدف الحالي محادثة مجموعة.

  </Accordion>

  <Accordion title="Message IDs">
    يتضمن سياق iMessage الوارد قيم `MessageSid` قصيرة ومعرّفات GUID كاملة للرسائل عند توفرها. تُحصر المعرّفات القصيرة في ذاكرة التخزين المؤقت الحديثة للردود داخل الذاكرة، ويتم فحصها مقابل المحادثة الحالية قبل الاستخدام. إذا انتهت صلاحية معرّف قصير أو كان ينتمي إلى محادثة أخرى، أعد المحاولة باستخدام `MessageSidFull` الكامل.

  </Accordion>

  <Accordion title="Capability detection">
    يخفي OpenClaw إجراءات API الخاصة فقط عندما تشير حالة الفحص المخزنة مؤقتًا إلى أن الجسر غير متاح. إذا كانت الحالة غير معروفة، تظل الإجراءات مرئية وتُرسل الفحوصات كسولًا حتى ينجح الإجراء الأول بعد `imsg launch` من دون تحديث حالة يدوي منفصل.

  </Accordion>

  <Accordion title="Read receipts and typing">
    عندما يكون جسر API الخاصة قيد التشغيل، تُعلّم المحادثات الواردة المقبولة كمقروءة قبل الإرسال وتظهر فقاعة كتابة للمرسل أثناء توليد الوكيل. عطّل التعليم كمقروء باستخدام:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    ستوقف إصدارات `imsg` الأقدم التي تسبق قائمة القدرات لكل طريقة الكتابة/القراءة بصمت؛ ويسجل OpenClaw تحذيرًا لمرة واحدة لكل إعادة تشغيل حتى يمكن عزو إيصال القراءة المفقود.

  </Accordion>
</AccordionGroup>

## عمليات كتابة التهيئة

يسمح iMessage افتراضيًا بعمليات كتابة التهيئة التي تبدأها القناة (لـ `/config set|unset` عندما تكون `commands.config: true`).

تعطيل:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## دمج الرسائل المباشرة المرسلة على دفعات منفصلة (أمر + URL في إنشاء واحد)

عندما يكتب مستخدم أمرًا وURL معًا — مثل `Dump https://example.com/article` — يقسم تطبيق Messages من Apple الإرسال إلى **صفين منفصلين في `chat.db`**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

يصل الصفان إلى OpenClaw بفاصل يقارب 0.8-2.0 ثانية في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في الدور 1، ويرد (غالبًا "أرسل لي URL")، ولا يرى URL إلا في الدور 2 — وعندها يكون سياق الأمر قد فُقد بالفعل. هذا جزء من خط إرسال Apple، وليس شيئًا يضيفه OpenClaw أو `imsg`.

يُدخل `channels.imessage.coalesceSameSenderDms` الرسالة المباشرة في دمج الصفوف المتتالية من المرسل نفسه في دور وكيل واحد. تستمر محادثات المجموعات في الإرسال لكل رسالة حتى تُحفظ بنية الأدوار متعددة المستخدمين.

<Tabs>
  <Tab title="When to enable">
    فعّل عندما:

    - توفر Skills تتوقع `command + payload` في رسالة واحدة (dump، paste، save، queue، إلخ).
    - يلصق المستخدمون URLs أو صورًا أو محتوى طويلًا إلى جانب الأوامر.
    - يمكنك قبول زمن التأخير المضاف لدور الرسالة المباشرة (انظر أدناه).

    اتركه معطلًا عندما:

    - تحتاج إلى أقل زمن تأخير للأوامر لمشغلات الرسائل المباشرة المكونة من كلمة واحدة.
    - تكون كل تدفقاتك أوامر أحادية التنفيذ بلا متابعات حمولة.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    مع تفعيل العلامة ومن دون `messages.inbound.byChannel.imessage` صريح، تتسع نافذة إزالة الارتداد إلى **2500 ms** (القيمة الافتراضية القديمة هي 0 ms — بلا إزالة ارتداد). النافذة الأوسع مطلوبة لأن وتيرة الإرسال المقسّم من Apple البالغة 0.8-2.0 s لا تلائم قيمة افتراضية أضيق.

    لضبط النافذة بنفسك:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="المفاضلات">
    - **زمن انتقال إضافي لرسائل DM.** مع تفعيل العلامة، تنتظر كل رسالة DM (بما في ذلك أوامر التحكم المستقلة والمتابعات ذات النص الواحد) حتى نافذة إزالة الارتداد قبل الإرسال، تحسبا لوصول صف حمولة. تحتفظ رسائل الدردشة الجماعية بالإرسال الفوري.
    - **المخرجات المدمجة محدودة.** النص المدمج محدود بـ 4000 حرف مع علامة `…[truncated]` صريحة؛ والمرفقات محدودة بـ 20؛ وإدخالات المصدر محدودة بـ 10 (مع الاحتفاظ بالأول والأحدث بعد ذلك). يتم تتبع كل GUID مصدر في `coalescedMessageGuids` للقياسات اللاحقة.
    - **لرسائل DM فقط.** تمر الدردشات الجماعية إلى الإرسال لكل رسالة حتى يبقى الروبوت سريع الاستجابة عندما يكتب عدة أشخاص.
    - **اشتراك اختياري، لكل قناة.** لا تتأثر القنوات الأخرى (Telegram، WhatsApp، Slack، …). يجب أن تنقل إعدادات BlueBubbles القديمة التي تضبط `channels.bluebubbles.coalesceSameSenderDms` تلك القيمة إلى `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

| ما ينشئه المستخدم                                                      | ينتج `chat.db`    | العلامة غير مفعلة (الافتراضي)                      | العلامة مفعلة + نافذة 2500 ms                                                |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                              | صفان يفصل بينهما ~1 s     | دورتا وكيل: "Dump" وحدها، ثم URL | دورة واحدة: نص مدمج `Dump https://example.com`                        |
| `Save this 📎image.jpg caption` (مرفق + نص)                | صفان                | دورتان (يتم إسقاط المرفق عند الدمج) | دورة واحدة: يتم حفظ النص + الصورة                                        |
| `/status` (أمر مستقل)                                     | صف واحد                 | إرسال فوري                        | **انتظار حتى النافذة، ثم إرسال**                                    |
| URL ملصق وحده                                                   | صف واحد                 | إرسال فوري                        | إرسال فوري (إدخال واحد فقط في الحاوية)                             |
| نص + URL أُرسلا كرسالتين منفصلتين عمدا، تفصل بينهما دقائق | صفان خارج النافذة | دورتان                               | دورتان (تنتهي النافذة بينهما)                                 |
| تدفق سريع (>10 رسائل DM صغيرة داخل النافذة)                          | N صفوف                | N دورات                                 | دورة واحدة، مخرجات محدودة (الأول + الأحدث، مع تطبيق حدود النص/المرفقات) |
| شخصان يكتبان في دردشة جماعية                                  | N صفوف من M مرسلين | M+ دورات (واحدة لكل حاوية مرسل)        | M+ دورات — لا يتم دمج الدردشات الجماعية                                |

## اللحاق بعد تعطل Gateway

عندما يكون Gateway غير متصل (تعطل، إعادة تشغيل، نوم Mac، إيقاف الجهاز)، يستأنف `imsg watch` من حالة `chat.db` الحالية عند عودة Gateway للعمل — وأي شيء وصل أثناء الفجوة لا يُرى افتراضيا أبدا. تعيد ميزة اللحاق تشغيل تلك الرسائل عند بدء التشغيل التالي حتى لا يفوت الوكيل حركة واردة بصمت.

ميزة اللحاق **معطلة افتراضيا**. فعّلها لكل قناة:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### كيفية تشغيلها

تمريرة واحدة لكل بدء تشغيل `monitorIMessageProvider`، بالتسلسل: جاهزية `imsg launch` → `watch.subscribe` → `performIMessageCatchup` → حلقة الإرسال الحي. تستخدم ميزة اللحاق نفسها `chats.list` + `messages.history` لكل دردشة عبر عميل JSON-RPC نفسه المستخدم بواسطة `imsg watch`. أي شيء يصل أثناء تمريرة اللحاق يمر عبر الإرسال الحي بشكل طبيعي؛ تمتص ذاكرة التخزين المؤقت الحالية لإزالة تكرار الوارد أي تداخل مع الصفوف المعاد تشغيلها.

يمر كل صف مُعاد تشغيله عبر مسار الإرسال الحي (`evaluateIMessageInbound` + `dispatchInboundMessage`)، لذلك تتصرف قوائم السماح، وسياسة المجموعات، ومزيل الارتداد، وذاكرة صدى الرسائل، وإيصالات القراءة بالطريقة نفسها في الرسائل المعاد تشغيلها والحية.

### دلالات المؤشر وإعادة المحاولة

تحتفظ ميزة اللحاق بمؤشر لكل حساب في `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (دليل حالة OpenClaw الافتراضي هو `~/.openclaw`، ويمكن تجاوزه باستخدام `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- يتقدم المؤشر مع كل إرسال ناجح ويظل ثابتا عندما يرمي إرسال صف خطأ — يعيد بدء التشغيل التالي محاولة الصف نفسه من المؤشر المثبت.
- بعد `maxFailureRetries` رميات متتالية مقابل `guid` نفسه، تسجل ميزة اللحاق `warn` وتدفع المؤشر قسريا إلى ما بعد الرسالة العالقة حتى تتمكن عمليات بدء التشغيل اللاحقة من التقدم.
- يتم تخطي المعرفات guid التي تم التخلي عنها سابقا عند رؤيتها (من دون محاولة إرسال) في التشغيلات اللاحقة وتُحتسب ضمن `skippedGivenUp` في ملخص التشغيل.

### إشارات مرئية للمشغل

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

يعني سطر `WARN ... capped to perRunLimit` أن بدء تشغيل واحدا لم يفرغ كل التراكم. ارفع `perRunLimit` (بحد أقصى 500) إذا كانت الفجوات لديك تتجاوز بانتظام التمريرة الافتراضية ذات 50 صفا.

### متى تتركها معطلة

- يعمل Gateway باستمرار مع إعادة تشغيل تلقائية عبر المراقب، والفجوات دائما < بضع ثوان — لا بأس بالافتراضي المعطل.
- حجم رسائل DM منخفض، والرسائل الفائتة لن تغير سلوك الوكيل — قد ترسل نافذة `firstRunLookbackMinutes` الأولية سياقا قديما مفاجئا عند أول تفعيل.

عند تفعيل ميزة اللحاق، فإن أول بدء تشغيل بلا مؤشر ينظر فقط إلى الخلف بمقدار `firstRunLookbackMinutes` (الافتراضي 30 دقيقة)، وليس نافذة `maxAgeMinutes` كاملة — وهذا يتجنب إعادة تشغيل سجل طويل من الرسائل السابقة للتفعيل.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم يتم العثور على imsg أو RPC غير مدعوم">
    تحقق من الملف الثنائي ودعم RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    إذا أبلغ الفحص أن RPC غير مدعوم، فحدّث `imsg`. إذا لم تكن إجراءات API الخاصة متاحة، فشغّل `imsg launch` في جلسة مستخدم macOS المسجل دخوله وافحص مرة أخرى. إذا لم يكن Gateway يعمل على macOS، فاستخدم إعداد Mac البعيد عبر SSH أعلاه بدلا من مسار `imsg` المحلي الافتراضي.

  </Accordion>

  <Accordion title="Gateway لا يعمل على macOS">
    يجب أن يعمل `cliPath: "imsg"` الافتراضي على جهاز Mac المسجل دخوله إلى Messages. على Linux أو Windows، اضبط `channels.imessage.cliPath` على سكربت التفاف يستخدم SSH إلى ذلك Mac ويشغل `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    ثم شغّل:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="يتم تجاهل رسائل DM">
    تحقق من:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - موافقات الاقتران (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعات">
    تحقق من:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - سلوك قائمة السماح `channels.imessage.groups`
    - إعداد نمط الإشارة (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="تفشل المرفقات البعيدة">
    تحقق من:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - مصادقة مفتاح SSH/SCP من مضيف Gateway
    - وجود مفتاح المضيف في `~/.ssh/known_hosts` على مضيف Gateway
    - قابلية قراءة المسار البعيد على جهاز Mac الذي يشغل Messages

  </Accordion>

  <Accordion title="تم تفويت مطالبات أذونات macOS">
    أعد التشغيل في طرفية GUI تفاعلية ضمن سياق المستخدم/الجلسة نفسه ووافق على المطالبات:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    تأكد من منح Full Disk Access + Automation لسياق العملية الذي يشغل OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## مؤشرات مرجع الإعدادات

- [مرجع الإعدادات - iMessage](/ar/gateway/config-channels#imessage)
- [إعدادات Gateway](/ar/gateway/configuration)
- [الاقتران](/ar/channels/pairing)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [القادمون من BlueBubbles](/ar/channels/imessage-from-bluebubbles) — جدول ترجمة الإعدادات والانتقال خطوة بخطوة
- [الاقتران](/ar/channels/pairing) — مصادقة DM وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
