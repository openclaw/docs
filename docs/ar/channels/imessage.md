---
read_when:
    - إعداد دعم iMessage
    - تصحيح أخطاء الإرسال/الاستقبال في iMessage
summary: دعم iMessage الأصلي عبر imsg (JSON-RPC عبر stdio)، مع إجراءات API خاصة للردود وTapbacks والتأثيرات والمرفقات وإدارة المجموعات. مفضّل لإعدادات OpenClaw iMessage الجديدة عندما تتوافق متطلبات المضيف.
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
بالنسبة إلى عمليات نشر OpenClaw iMessage، استخدم `imsg` على مضيف macOS Messages مسجل الدخول. إذا كان Gateway يعمل على Linux أو Windows، فاجعل `channels.imessage.cliPath` يشير إلى مغلف SSH يشغل `imsg` على جهاز Mac.

**استدراك توقف Gateway اختياري.** عند تفعيله (`channels.imessage.catchup.enabled: true`)، يعيد Gateway تشغيل الرسائل الواردة التي وصلت إلى `chat.db` أثناء انقطاعه عن العمل (تعطل، إعادة تشغيل، سكون Mac) عند بدء التشغيل التالي. معطل افتراضيا — راجع [الاستدراك بعد توقف Gateway](#catching-up-after-gateway-downtime). يغلق [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
تمت إزالة دعم BlueBubbles. انقل إعدادات `channels.bluebubbles` إلى `channels.imessage`؛ يدعم OpenClaw iMessage عبر `imsg` فقط. ابدأ بـ [إزالة BlueBubbles ومسار imsg iMessage](/ar/announcements/bluebubbles-imessage) للإعلان المختصر، أو [القادمون من BlueBubbles](/ar/channels/imessage-from-bluebubbles) للاطلاع على جدول الترحيل الكامل.
</Warning>

الحالة: تكامل CLI خارجي أصلي. يشغل Gateway الأمر `imsg rpc` ويتواصل عبر JSON-RPC على stdio (بلا daemon/منفذ منفصل). تتطلب الإجراءات المتقدمة `imsg launch` وفحص private API ناجحا.

<CardGroup cols={3}>
  <Card title="إجراءات private API" icon="wand-sparkles" href="#private-api-actions">
    الردود، tapbacks، التأثيرات، المرفقات، وإدارة المجموعات.
  </Card>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    رسائل iMessage المباشرة تضبط افتراضيا على وضع الإقران.
  </Card>
  <Card title="Mac بعيد" icon="terminal" href="#remote-mac-over-ssh">
    استخدم مغلف SSH عندما لا يعمل Gateway على Mac الخاص بـ Messages.
  </Card>
  <Card title="مرجع الإعدادات" icon="settings" href="/ar/gateway/config-channels#imessage">
    مرجع حقول iMessage الكامل.
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

      <Step title="الموافقة على أول إقران رسالة مباشرة (dmPolicy الافتراضي)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        تنتهي صلاحية طلبات الإقران بعد ساعة واحدة.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac بعيد عبر SSH">
    لا يتطلب OpenClaw إلا `cliPath` متوافقا مع stdio، لذا يمكنك جعل `cliPath` يشير إلى سكربت مغلف يتصل عبر SSH بجهاز Mac بعيد ويشغل `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    الإعداد الموصى به عند تفعيل المرفقات:

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

    إذا لم يتم ضبط `remoteHost`، يحاول OpenClaw اكتشافه تلقائيا عن طريق تحليل سكربت مغلف SSH.
    يجب أن يكون `remoteHost` على شكل `host` أو `user@host` (بلا مسافات أو خيارات SSH).
    يستخدم OpenClaw فحصا صارما لمفتاح المضيف في SCP، لذا يجب أن يكون مفتاح مضيف relay موجودا مسبقا في `~/.ssh/known_hosts`.
    يتم التحقق من مسارات المرفقات مقابل الجذور المسموح بها (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## المتطلبات والأذونات (macOS)

- يجب تسجيل الدخول إلى Messages على جهاز Mac الذي يشغل `imsg`.
- يلزم Full Disk Access لسياق العملية التي تشغل OpenClaw/`imsg` (للوصول إلى قاعدة بيانات Messages).
- يلزم إذن Automation لإرسال الرسائل عبر Messages.app.
- بالنسبة إلى الإجراءات المتقدمة (react / edit / unsend / threaded reply / effects / group ops)، يجب تعطيل System Integrity Protection — راجع [تفعيل imsg private API](#enabling-the-imsg-private-api) أدناه. يعمل إرسال/استقبال النصوص والوسائط الأساسيان من دونه.

<Tip>
تمنح الأذونات لكل سياق عملية. إذا كان Gateway يعمل بلا واجهة (LaunchAgent/SSH)، فشغل أمرا تفاعليا لمرة واحدة في السياق نفسه لاستدعاء المطالبات:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## تفعيل imsg private API

يأتي `imsg` بوضعين تشغيليين:

- **الوضع الأساسي** (افتراضي، لا يلزم تغيير SIP): النصوص والوسائط الصادرة عبر `send`، مراقبة/سجل الوارد، وقائمة المحادثات. هذا ما تحصل عليه مباشرة من تثبيت جديد بـ `brew install steipete/tap/imsg` مع أذونات macOS القياسية أعلاه.
- **وضع Private API**: يحقن `imsg` مكتبة dylib مساعدة في `Messages.app` لاستدعاء دوال `IMCore` الداخلية. هذا ما يتيح `react` و`edit` و`unsend` و`reply` (المترابط) و`sendWithEffect` و`renameGroup` و`setGroupIcon` و`addParticipant` و`removeParticipant` و`leaveGroup`، إضافة إلى مؤشرات الكتابة وإيصالات القراءة.

للوصول إلى سطح الإجراءات المتقدمة الذي توثقه صفحة القناة هذه، تحتاج إلى وضع Private API. يوضح README الخاص بـ `imsg` المتطلب صراحة:

> الميزات المتقدمة مثل `read` و`typing` و`launch` والإرسال الغني المدعوم بالجسر وتعديل الرسائل وإدارة المحادثات اختيارية التفعيل. وهي تتطلب تعطيل SIP وحقن مكتبة dylib مساعدة في `Messages.app`. يرفض `imsg launch` الحقن عندما يكون SIP مفعلا.

تستخدم تقنية حقن المساعد مكتبة dylib الخاصة بـ `imsg` للوصول إلى واجهات Messages الخاصة. لا يوجد خادم طرف ثالث أو تشغيل BlueBubbles في مسار OpenClaw iMessage.

<Warning>
**تعطيل SIP مفاضلة أمنية حقيقية.** SIP هو أحد وسائل الحماية الأساسية في macOS ضد تشغيل شيفرة نظام معدلة؛ وإيقافه على مستوى النظام يفتح مساحة هجوم إضافية وآثارا جانبية. وبشكل خاص، **تعطيل SIP على أجهزة Apple Silicon Mac يعطل أيضا القدرة على تثبيت وتشغيل تطبيقات iOS على جهاز Mac**.

تعامل مع هذا كخيار تشغيلي مقصود، لا كإعداد افتراضي. إذا كان نموذج التهديد لديك لا يحتمل إيقاف SIP، فإن iMessage المضمن يقتصر على الوضع الأساسي — إرسال/استقبال النصوص والوسائط فقط، بلا تفاعلات / تعديل / إلغاء إرسال / تأثيرات / عمليات مجموعات.
</Warning>

### الإعداد

1. **ثبت (أو رق) `imsg`** على جهاز Mac الذي يشغل Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   يعرض خرج `imsg status --json` القيم `bridge_version` و`rpc_methods` و`selectors` لكل طريقة حتى تتمكن من معرفة ما يدعمه البناء الحالي قبل البدء.

2. **عطل System Integrity Protection.** يختلف هذا حسب إصدار macOS لأن متطلب Apple الأساسي يعتمد على نظام التشغيل والعتاد:
   - **macOS 10.13–10.15 (Sierra–Catalina):** عطل Library Validation عبر Terminal، ثم أعد التشغيل إلى Recovery Mode، وشغل `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+ (Big Sur والإصدارات الأحدث)، Intel:** Recovery Mode (أو Internet Recovery)، ثم `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+، Apple Silicon:** تسلسل بدء التشغيل بزر الطاقة للدخول إلى Recovery؛ في إصدارات macOS الحديثة اضغط باستمرار على مفتاح **Left Shift** عند النقر على Continue، ثم `csrutil disable`. تتبع إعدادات الأجهزة الافتراضية مسارا منفصلا — خذ لقطة VM أولا.
   - **macOS 26 / Tahoe:** أصبحت سياسات library-validation وفحوص private-entitlement الخاصة بـ `imagent` أكثر تشددا؛ قد يحتاج `imsg` إلى بناء محدث لمواكبتها. إذا بدأ حقن `imsg launch` أو `selectors` محددة بإرجاع false بعد ترقية كبرى لـ macOS، فراجع ملاحظات إصدار `imsg` قبل افتراض نجاح خطوة SIP.

   اتبع تدفق Recovery-mode من Apple الخاص بجهاز Mac لديك لتعطيل SIP قبل تشغيل `imsg launch`.

3. **احقن المساعد.** مع تعطيل SIP وتسجيل الدخول في Messages.app:

   ```bash
   imsg launch
   ```

   يرفض `imsg launch` الحقن عندما يظل SIP مفعلا، لذلك يعمل هذا أيضا كتأكيد على نجاح الخطوة 2.

4. **تحقق من الجسر من OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   يجب أن يبلغ إدخال iMessage عن `works`، ويجب أن يعرض `imsg status --json | jq '.selectors'` القيمة `retractMessagePart: true` إضافة إلى أي محددات تعديل / كتابة / قراءة يكشفها بناء macOS لديك. لا يعلن حاجب الإمكانات لكل طريقة في Plugin الخاص بـ OpenClaw ضمن `actions.ts` إلا عن الإجراءات التي يكون محددها الأساسي `true`، لذلك يعكس سطح الإجراءات الذي تراه في قائمة أدوات الوكيل ما يمكن للجسر فعله فعليا على هذا المضيف.

إذا أبلغ `openclaw channels status --probe` أن القناة `works` لكن إجراءات محددة ترمي "iMessage `<action>` requires the imsg private API bridge" وقت الإرسال، فشغل `imsg launch` مجددا — قد يسقط المساعد (إعادة تشغيل Messages.app، تحديث نظام التشغيل، إلخ) وستواصل حالة `available: true` المخزنة مؤقتا إعلان الإجراءات حتى يحدّث الفحص التالي الحالة.

### عندما لا يمكنك تعطيل SIP

إذا لم يكن تعطيل SIP مقبولا لنموذج التهديد لديك:

- يعود `imsg` إلى الوضع الأساسي — النص + الوسائط + الاستقبال فقط.
- يظل Plugin الخاص بـ OpenClaw يعلن إرسال النصوص/الوسائط والمراقبة الواردة؛ لكنه يخفي `react` و`edit` و`unsend` و`reply` و`sendWithEffect` وعمليات المجموعات من سطح الإجراءات (وفقا لحاجب الإمكانات لكل طريقة).
- يمكنك تشغيل Mac منفصل غير Apple-Silicon (أو Mac مخصص للبوت) مع إيقاف SIP لعبء عمل iMessage، مع إبقاء SIP مفعلا على أجهزتك الأساسية. راجع [مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)](#deployment-patterns) أدناه.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.imessage.dmPolicy` في الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    حقل قائمة السماح: `channels.imessage.allowFrom`.

    يمكن أن تكون إدخالات قائمة السماح handles، أو مجموعات وصول مرسل ثابتة (`accessGroup:<name>`)، أو أهداف محادثة (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`).

  </Tab>

  <Tab title="سياسة المجموعات + الإشارات">
    يتحكم `channels.imessage.groupPolicy` في معالجة المجموعات:

    - `allowlist` (افتراضي عند الإعداد)
    - `open`
    - `disabled`

    قائمة السماح لمرسلي المجموعات: `channels.imessage.groupAllowFrom`.

    يمكن أن تشير إدخالات `groupAllowFrom` أيضا إلى مجموعات وصول مرسل ثابتة (`accessGroup:<name>`).

    رجوع وقت التشغيل: إذا لم يتم ضبط `groupAllowFrom`، ترجع فحوص مرسل مجموعة iMessage إلى `allowFrom` عند توفره.
    ملاحظة وقت التشغيل: إذا كان `channels.imessage` مفقودا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرا (حتى إذا كان `channels.defaults.groupPolicy` مضبوطا).

    <Warning>
    لتوجيه المجموعات بوابتا قائمة سماح **اثنتان** تعملان تباعا، ويجب أن تنجحا كلتاهما:

    1. **قائمة سماح المرسل / هدف المحادثة** (`channels.imessage.groupAllowFrom`) — handle أو `chat_guid` أو `chat_identifier` أو `chat_id`.
    2. **سجل المجموعات** (`channels.imessage.groups`) — مع `groupPolicy: "allowlist"`، تتطلب هذه البوابة إما إدخال wildcard بالشكل `groups: { "*": { ... } }` (يضبط `allowAll = true`)، أو إدخالا صريحا لكل `chat_id` ضمن `groups`.

    إذا لم تحتو البوابة 2 على أي شيء، فسيتم إسقاط كل رسالة مجموعة. يصدر Plugin إشارتين بمستوى `warn` عند مستوى السجل الافتراضي:

    - مرة واحدة لكل حساب عند بدء التشغيل: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - مرة واحدة لكل `chat_id` أثناء التشغيل: `imessage: dropping group message from chat_id=<id> ...`

    تستمر الرسائل المباشرة في العمل لأنها تسلك مسار شيفرة مختلفا.

    الحد الأدنى من الإعدادات لإبقاء المجموعات جارية ضمن `groupPolicy: "allowlist"`:

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

    إذا ظهرت أسطر `warn` تلك في سجل Gateway، فهذا يعني أن البوابة 2 تُسقِط الرسائل — أضف كتلة `groups`.
    </Warning>

    اذكر بوابة السماح للمجموعات:

    - لا يحتوي iMessage على بيانات وصفية أصلية للمنشن
    - يستخدم اكتشاف المنشن أنماط regex (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - من دون أنماط مهيأة، لا يمكن فرض بوابة السماح بالمنشن

    يمكن لأوامر التحكم من المرسلين المصرح لهم تجاوز بوابة السماح بالمنشن في المجموعات.

    `systemPrompt` لكل مجموعة:

    يقبل كل إدخال ضمن `channels.imessage.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن القيمة في موجّه النظام الخاص بالوكيل في كل دورة تعالج رسالة في تلك المجموعة. تطابق آلية الحل حلّ الموجّه لكل مجموعة المستخدم بواسطة `channels.whatsapp.groups`:

    1. **موجّه النظام الخاص بالمجموعة** (`groups["<chat_id>"].systemPrompt`): يُستخدم عندما يكون إدخال المجموعة المحددة موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` معرّفًا. إذا كان `systemPrompt` سلسلة فارغة (`""`) فسيتم كبت البدل ولن يُطبق أي موجّه نظام على تلك المجموعة.
    2. **موجّه نظام بدل المجموعة** (`groups["*"].systemPrompt`): يُستخدم عندما يكون إدخال المجموعة المحددة غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

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

  <Tab title="الجلسات والردود الحتمية">
    - تستخدم الرسائل المباشرة التوجيه المباشر؛ وتستخدم المجموعات توجيه المجموعات.
    - مع الإعداد الافتراضي `session.dmScope=main`، تُدمج رسائل iMessage المباشرة في جلسة الوكيل الرئيسية.
    - جلسات المجموعات معزولة (`agent:<agentId>:imessage:group:<chat_id>`).
    - تُوجّه الردود إلى iMessage باستخدام بيانات وصفية للقناة/الهدف الأصليين.

    سلوك السلاسل الشبيهة بالمجموعات:

    يمكن أن تصل بعض سلاسل iMessage متعددة المشاركين مع `is_group=false`.
    إذا كان ذلك `chat_id` مهيأً صراحة ضمن `channels.imessage.groups`، يعامله OpenClaw كحركة مرور مجموعة (بوابة سماح المجموعة + عزل جلسة المجموعة).

  </Tab>
</Tabs>

## ارتباطات محادثات ACP

يمكن أيضًا ربط دردشات iMessage القديمة بجلسات ACP.

تدفق المشغل السريع:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو دردشة المجموعة المسموح بها.
- ستُوجّه الرسائل المستقبلية في محادثة iMessage نفسها إلى جلسة ACP المنشأة.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

تُدعم الارتباطات المستمرة المهيأة عبر إدخالات `bindings[]` على المستوى الأعلى مع `type: "acp"` و`match.channel: "imessage"`.

يمكن أن يستخدم `match.peer.id`:

- معرّف رسالة مباشرة مُطبّعًا مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>` (موصى به لارتباطات المجموعات المستقرة)
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

راجع [وكلاء ACP](/ar/tools/acp-agents) لسلوك ارتباط ACP المشترك.

## أنماط النشر

<AccordionGroup>
  <Accordion title="مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)">
    استخدم Apple ID مخصصًا ومستخدم macOS مخصصًا بحيث تكون حركة مرور البوت معزولة عن ملف Messages الشخصي لديك.

    التدفق المعتاد:

    1. أنشئ/سجّل الدخول إلى مستخدم macOS مخصص.
    2. سجّل الدخول إلى Messages باستخدام Apple ID الخاص بالبوت في ذلك المستخدم.
    3. ثبّت `imsg` في ذلك المستخدم.
    4. أنشئ مغلّف SSH بحيث يستطيع OpenClaw تشغيل `imsg` في سياق ذلك المستخدم.
    5. وجّه `channels.imessage.accounts.<id>.cliPath` و`.dbPath` إلى ملف تعريف ذلك المستخدم.

    قد يتطلب التشغيل الأول موافقات واجهة رسومية (Automation + Full Disk Access) في جلسة مستخدم البوت تلك.

  </Accordion>

  <Accordion title="Mac بعيد عبر Tailscale (مثال)">
    البنية الشائعة:

    - يعمل Gateway على Linux/VM
    - يعمل iMessage + `imsg` على Mac في tailnet لديك
    - يستخدم مغلّف `cliPath` SSH لتشغيل `imsg`
    - يفعّل `remoteHost` جلب مرفقات SCP

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
    تأكد أولًا من أن مفتاح المضيف موثوق (مثلًا `ssh bot@mac-mini.tailnet-1234.ts.net`) بحيث تتم تعبئة `known_hosts`.

  </Accordion>

  <Accordion title="نمط الحسابات المتعددة">
    يدعم iMessage التهيئة لكل حساب ضمن `channels.imessage.accounts`.

    يمكن لكل حساب تجاوز حقول مثل `cliPath` و`dbPath` و`allowFrom` و`groupPolicy` و`mediaMaxMb` وإعدادات السجل وقوائم السماح لجذور المرفقات.

  </Accordion>
</AccordionGroup>

## الوسائط، والتقسيم إلى أجزاء، وأهداف التسليم

<AccordionGroup>
  <Accordion title="المرفقات والوسائط">
    - استيعاب المرفقات الواردة **معطّل افتراضيًا** — عيّن `channels.imessage.includeAttachments: true` لتمرير الصور، والمذكرات الصوتية، والفيديو، والمرفقات الأخرى إلى الوكيل. عند تعطيله، تُسقَط رسائل iMessage التي تحتوي على مرفقات فقط قبل الوصول إلى الوكيل وقد لا تنتج أي سطر سجل `Inbound message` إطلاقًا.
    - يمكن جلب مسارات المرفقات البعيدة عبر SCP عند ضبط `remoteHost`
    - يجب أن تطابق مسارات المرفقات الجذور المسموح بها:
      - `channels.imessage.attachmentRoots` (محلي)
      - `channels.imessage.remoteAttachmentRoots` (وضع SCP البعيد)
      - نمط الجذر الافتراضي: `/Users/*/Library/Messages/Attachments`
    - يستخدم SCP فحصًا صارمًا لمفتاح المضيف (`StrictHostKeyChecking=yes`)
    - يستخدم حجم الوسائط الصادرة `channels.imessage.mediaMaxMb` (الافتراضي 16 MB)

  </Accordion>

  <Accordion title="تقسيم الصادر إلى أجزاء">
    - حد جزء النص: `channels.imessage.textChunkLimit` (الافتراضي 4000)
    - وضع التقسيم إلى أجزاء: `channels.imessage.chunkMode`
      - `length` (الافتراضي)
      - `newline` (تقسيم يعطي الأولوية للفقرات)

  </Accordion>

  <Accordion title="تنسيقات العنونة">
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

عندما يكون `imsg launch` قيد التشغيل ويبلغ `openclaw channels status --probe` عن `privateApi.available: true`، يمكن لأداة الرسائل استخدام إجراءات iMessage الأصلية إضافة إلى إرسال النص العادي.

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
  <Accordion title="الإجراءات المتاحة">
    - **react**: إضافة/إزالة tapbacks في iMessage (`messageId`، `emoji`، `remove`). تُطابق tapbacks المدعومة الحب، والإعجاب، وعدم الإعجاب، والضحك، والتأكيد، والسؤال.
    - **reply**: إرسال رد ضمن سلسلة إلى رسالة موجودة (`messageId`، `text` أو `message`، بالإضافة إلى `chatGuid` أو `chatId` أو `chatIdentifier` أو `to`).
    - **sendWithEffect**: إرسال نص بتأثير iMessage (`text` أو `message`، `effect` أو `effectId`).
    - **edit**: تعديل رسالة مرسلة على إصدارات macOS/API الخاصة المدعومة (`messageId`، `text` أو `newText`).
    - **unsend**: سحب رسالة مرسلة على إصدارات macOS/API الخاصة المدعومة (`messageId`).
    - **upload-file**: إرسال وسائط/ملفات (`buffer` كـ base64 أو `media`/`path`/`filePath` مرطّب، و`filename`، و`asVoice` اختياري). الاسم المستعار القديم: `sendAttachment`.
    - **renameGroup**، **setGroupIcon**، **addParticipant**، **removeParticipant**، **leaveGroup**: إدارة دردشات المجموعات عندما يكون الهدف الحالي محادثة مجموعة.

  </Accordion>

  <Accordion title="معرّفات الرسائل">
    يتضمن سياق iMessage الوارد قيم `MessageSid` قصيرة ومعرّفات GUID كاملة للرسائل عند توفرها. تقتصر المعرّفات القصيرة على ذاكرة التخزين المؤقت للردود الحديثة في الذاكرة ويتم التحقق منها مقابل الدردشة الحالية قبل الاستخدام. إذا انتهت صلاحية معرّف قصير أو كان ينتمي إلى دردشة أخرى، فأعد المحاولة باستخدام `MessageSidFull` الكامل.

  </Accordion>

  <Accordion title="اكتشاف القدرات">
    يخفي OpenClaw إجراءات API الخاصة فقط عندما تفيد حالة الفحص المخزنة مؤقتًا بأن الجسر غير متاح. إذا كانت الحالة غير معروفة، تبقى الإجراءات مرئية وتُشغّل فحوصات الإرسال بشكل كسول بحيث يمكن لأول إجراء النجاح بعد `imsg launch` من دون تحديث حالة يدوي منفصل.

  </Accordion>

  <Accordion title="إيصالات القراءة والكتابة">
    عندما يكون جسر API الخاصة قيد التشغيل، تُعلّم الدردشات الواردة المقبولة كمقروءة قبل الإرسال وتُعرض فقاعة كتابة للمرسل أثناء توليد الوكيل. عطّل التعليم كمقروء باستخدام:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    إصدارات `imsg` الأقدم التي تسبق قائمة القدرات لكل طريقة ستعطّل الكتابة/القراءة بصمت؛ يسجل OpenClaw تحذيرًا لمرة واحدة لكل إعادة تشغيل بحيث يكون إيصال القراءة المفقود قابلًا للتتبع.

  </Accordion>

  <Accordion title="Tapbacks الواردة">
    يشترك OpenClaw في tapbacks الخاصة بـ iMessage ويوجّه التفاعلات المقبولة كأحداث نظام بدلًا من نص رسالة عادي، لذلك لا يؤدي tapback من المستخدم إلى تشغيل حلقة رد عادية.

    يتحكم `channels.imessage.reactionNotifications` في وضع الإشعارات:

    - `"own"` (الافتراضي): الإخطار فقط عندما يتفاعل المستخدمون مع رسائل ألّفها البوت.
    - `"all"`: الإخطار بكل tapbacks الواردة من المرسلين المصرح لهم.
    - `"off"`: تجاهل tapbacks الواردة.

    تستخدم تجاوزات كل حساب `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>
</AccordionGroup>

## كتابات التهيئة

يسمح iMessage افتراضيًا بكتابات التهيئة التي تبدأها القناة (لـ `/config set|unset` عندما يكون `commands.config: true`).

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

## دمج الرسائل المباشرة المرسلة بشكل مقسّم (أمر + URL في إنشاء واحد)

عندما يكتب مستخدم أمرًا وURL معًا — مثل `Dump https://example.com/article` — يقسم تطبيق Messages من Apple الإرسال إلى **صفّين منفصلين في `chat.db`**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

يصل الصفان إلى OpenClaw بفاصل يقارب 0.8-2.0 ثانية في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في الدورة 1، ويرد (غالبًا "أرسل لي URL")، ولا يرى URL إلا في الدورة 2 — وعندها يكون سياق الأمر قد ضاع بالفعل. هذه هي سلسلة إرسال Apple، وليست شيئًا يضيفه OpenClaw أو `imsg`.

`channels.imessage.coalesceSameSenderDms` يجعل الرسالة المباشرة تختار دمج الصفوف المتتالية من المرسل نفسه في دورة وكيل واحدة. تستمر محادثات المجموعات في الإرسال لكل رسالة على حدة كي تُحفَظ بنية دورات المستخدمين المتعددين.

<Tabs>
  <Tab title="متى تُفعّل">
    فعّل عندما:

    - تنشر Skills تتوقع `command + payload` في رسالة واحدة (dump، paste، save، queue، إلخ).
    - يلصق المستخدمون لديك عناوين URL أو صوراً أو محتوى طويلاً إلى جانب الأوامر.
    - يمكنك قبول زمن تأخير دورة الرسالة المباشرة المضاف (انظر أدناه).

    اتركه معطلاً عندما:

    - تحتاج إلى أدنى زمن تأخير للأمر لمشغلات الرسائل المباشرة المكوّنة من كلمة واحدة.
    - تكون كل تدفقاتك أوامر أحادية التنفيذ بلا متابعات حمولة.

  </Tab>
  <Tab title="التفعيل">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    مع تفعيل العلامة ومن دون `messages.inbound.byChannel.imessage` صريح، تتسع نافذة التهدئة إلى **2500 ms** (القيمة الافتراضية القديمة هي 0 ms — بلا تهدئة). النافذة الأوسع مطلوبة لأن إيقاع الإرسال المقسّم لدى Apple البالغ 0.8-2.0 s لا يناسب قيمة افتراضية أضيق.

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
    - **زمن تأخير مضاف للرسائل المباشرة.** مع تفعيل العلامة، تنتظر كل رسالة مباشرة (بما في ذلك أوامر التحكم المستقلة والمتابعات النصية المفردة) حتى نافذة التهدئة قبل الإرسال، تحسباً لوصول صف حمولة. تحتفظ رسائل محادثات المجموعات بالإرسال الفوري.
    - **الناتج المدمج محدود.** يبلغ سقف النص المدمج 4000 حرف مع علامة `…[truncated]` صريحة؛ وسقف المرفقات 20؛ وسقف إدخالات المصدر 10 (يُحتفَظ بالأول والأحدث بعد ذلك). يُتتبّع كل معرّف GUID للمصدر في `coalescedMessageGuids` للقياسات اللاحقة.
    - **للرسائل المباشرة فقط.** تنتقل محادثات المجموعات إلى الإرسال لكل رسالة على حدة كي يبقى الوكيل سريع الاستجابة عندما يكتب عدة أشخاص.
    - **اختياري، لكل قناة.** القنوات الأخرى (Telegram، WhatsApp، Slack، …) لا تتأثر. يجب على إعدادات BlueBubbles القديمة التي تضبط `channels.bluebubbles.coalesceSameSenderDms` ترحيل تلك القيمة إلى `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

| ما ينشئه المستخدم                                                  | ما ينتجه `chat.db`   | العلامة متوقفة (افتراضي)                | العلامة مفعّلة + نافذة 2500 ms                                      |
| ------------------------------------------------------------------ | -------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                            | صفان يفصل بينهما ~1 s | دورتا وكيل: "Dump" وحدها، ثم عنوان URL | دورة واحدة: نص مدمج `Dump https://example.com`                       |
| `Save this 📎image.jpg caption` (مرفق + نص)                        | صفان                 | دورتان (يُسقَط المرفق عند الدمج)        | دورة واحدة: النص + الصورة محفوظان                                    |
| `/status` (أمر مستقل)                                              | صف واحد              | إرسال فوري                              | **انتظار حتى النافذة، ثم الإرسال**                                   |
| عنوان URL ملصق وحده                                                | صف واحد              | إرسال فوري                              | إرسال فوري (إدخال واحد فقط في الحزمة)                                |
| نص + عنوان URL أُرسلا كرسالتين منفصلتين عمداً، بفاصل دقائق        | صفان خارج النافذة    | دورتان                                  | دورتان (تنتهي النافذة بينهما)                                        |
| تدفق سريع (>10 رسائل مباشرة صغيرة داخل النافذة)                   | N صفوف               | N دورات                                 | دورة واحدة، ناتج محدود (الأول + الأحدث، مع تطبيق سقوف النص/المرفقات) |
| شخصان يكتبان في محادثة مجموعة                                      | N صفوف من M مرسلين   | M+ دورات (واحدة لكل حزمة مرسل)          | M+ دورات — لا تُدمج محادثات المجموعات                                |

## اللحاق بعد توقف Gateway

عندما يكون Gateway غير متصل (تعطل، إعادة تشغيل، سكون Mac، إيقاف الجهاز)، يستأنف `imsg watch` من حالة `chat.db` الحالية بمجرد عودة Gateway للعمل — وأي شيء وصل أثناء الفجوة لا يُرى افتراضياً أبداً. يعيد اللحاق تمرير تلك الرسائل عند بدء التشغيل التالي كي لا يفوّت الوكيل حركة الرسائل الواردة بصمت.

اللحاق **معطّل افتراضياً**. فعّله لكل قناة:

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

### كيف يعمل

مرور واحد لكل بدء تشغيل لـ `monitorIMessageProvider`، مرتّباً كالتالي: جاهزية `imsg launch` → `watch.subscribe` → `performIMessageCatchup` → حلقة الإرسال الحي. يستخدم اللحاق نفسه `chats.list` + `messages.history` لكل محادثة عبر عميل JSON-RPC نفسه الذي يستخدمه `imsg watch`. أي شيء يصل أثناء مرور اللحاق يتدفق عبر الإرسال الحي بشكل طبيعي؛ وتمتص ذاكرة إزالة تكرار الوارد المؤقتة الحالية أي تداخل مع الصفوف المُعاد تمريرها.

يُمرَّر كل صف مُعاد تمريره عبر مسار الإرسال الحي (`evaluateIMessageInbound` + `dispatchInboundMessage`)، لذلك تتصرف قوائم السماح وسياسة المجموعة والمهدئ وذاكرة الصدى وإيصالات القراءة بشكل متطابق في الرسائل المُعاد تمريرها والرسائل الحية.

### دلالات المؤشر وإعادة المحاولة

يحتفظ اللحاق بمؤشر لكل حساب في `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (دليل حالة OpenClaw الافتراضي هو `~/.openclaw`، ويمكن تجاوزه باستخدام `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- يتقدم المؤشر عند كل إرسال ناجح ويبقى ثابتاً عندما يرمي إرسال صف استثناءً — يعيد بدء التشغيل التالي محاولة الصف نفسه من المؤشر الثابت.
- بعد `maxFailureRetries` استثناءات متتالية ضد `guid` نفسه، يسجل اللحاق `warn` ويدفع المؤشر قسراً إلى ما بعد الرسالة العالقة كي تتمكن عمليات بدء التشغيل اللاحقة من التقدم.
- تُتخطى معرّفات GUID التي تم التخلي عنها مسبقاً بمجرد رؤيتها (بلا محاولة إرسال) في التشغيلات اللاحقة وتُحتسب ضمن `skippedGivenUp` في ملخص التشغيل.

### إشارات مرئية للمشغّل

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

يعني سطر `WARN ... capped to perRunLimit` أن بدء تشغيل واحداً لم يفرغ كامل التراكم. ارفع `perRunLimit` (الحد الأقصى 500) إذا كانت الفجوات لديك تتجاوز بانتظام مرور 50 صفاً الافتراضي.

### متى تتركه معطلاً

- يعمل Gateway باستمرار مع إعادة تشغيل تلقائية عبر المراقب والفجوات دائماً < بضع ثوانٍ — القيمة الافتراضية المعطلة مناسبة.
- حجم الرسائل المباشرة منخفض والرسائل الفائتة لن تغيّر سلوك الوكيل — يمكن لنافذة `firstRunLookbackMinutes` الأولية إرسال سياق قديم مفاجئ عند أول تفعيل.

عندما تفعّل اللحاق، فإن أول بدء تشغيل بلا مؤشر لا ينظر إلا إلى `firstRunLookbackMinutes` (افتراضياً 30 دقيقة)، لا إلى نافذة `maxAgeMinutes` الكاملة — وهذا يتجنب إعادة تمرير تاريخ طويل من رسائل ما قبل التفعيل.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="تعذّر العثور على imsg أو RPC غير مدعوم">
    تحقّق من الملف الثنائي ودعم RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    إذا أبلغ الفحص أن RPC غير مدعوم، فحدّث `imsg`. إذا كانت إجراءات API الخاصة غير متاحة، فشغّل `imsg launch` في جلسة مستخدم macOS المسجّل دخوله وافحص مجدداً. إذا لم يكن Gateway يعمل على macOS، فاستخدم إعداد Mac البعيد عبر SSH أعلاه بدلاً من مسار `imsg` المحلي الافتراضي.

  </Accordion>

  <Accordion title="Gateway لا يعمل على macOS">
    يجب أن يعمل `cliPath: "imsg"` الافتراضي على Mac المسجّل دخوله إلى Messages. على Linux أو Windows، اضبط `channels.imessage.cliPath` على برنامج نصي غلاف يتصل بذلك Mac عبر SSH ويشغّل `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    ثم شغّل:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="يتم تجاهل الرسائل المباشرة">
    تحقّق من:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - موافقات الإقران (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعات">
    تحقّق من:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - سلوك قائمة السماح `channels.imessage.groups`
    - تكوين أنماط الإشارة (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="تفشل المرفقات البعيدة">
    تحقّق من:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - مصادقة مفاتيح SSH/SCP من مضيف Gateway
    - وجود مفتاح المضيف في `~/.ssh/known_hosts` على مضيف Gateway
    - قابلية قراءة المسار البعيد على Mac الذي يشغّل Messages

  </Accordion>

  <Accordion title="فُوّتت مطالبات أذونات macOS">
    أعد التشغيل في طرفية GUI تفاعلية ضمن سياق المستخدم/الجلسة نفسه ووافق على المطالبات:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    تأكد من منح Full Disk Access + Automation لسياق العملية الذي يشغّل OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## روابط مرجع التكوين

- [مرجع التكوين - iMessage](/ar/gateway/config-channels#imessage)
- [تكوين Gateway](/ar/gateway/configuration)
- [الإقران](/ar/channels/pairing)

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [إزالة BlueBubbles ومسار imsg لـ iMessage](/ar/announcements/bluebubbles-imessage) — إعلان وملخص ترحيل
- [القادمون من BlueBubbles](/ar/channels/imessage-from-bluebubbles) — جدول ترجمة التكوين والانتقال خطوة بخطوة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك محادثات المجموعات وحراسة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتحصين
