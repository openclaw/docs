---
read_when:
    - إعداد دعم iMessage
    - تصحيح أخطاء إرسال/استقبال iMessage
summary: دعم iMessage الأصلي عبر imsg (JSON-RPC عبر stdio)، مع إجراءات API خاصة للردود، والتفاعلات السريعة، والتأثيرات، والمرفقات، وإدارة المجموعات. يُفضَّل لإعدادات OpenClaw iMessage الجديدة عندما تكون متطلبات المضيف مناسبة.
title: iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: cbce499e35c3dac12e6bb3f157d624a02a9bc8c26356f3decdfe62c85db6ee15
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
لنشرات OpenClaw عبر iMessage، استخدم `imsg` على مضيف Messages في macOS تم تسجيل الدخول إليه. إذا كان Gateway لديك يعمل على Linux أو Windows، فاجعل `channels.imessage.cliPath` يشير إلى مغلّف SSH يشغّل `imsg` على جهاز Mac.

**استدراك توقف Gateway اختياري.** عند تمكينه (`channels.imessage.catchup.enabled: true`)، يعيد Gateway تشغيل الرسائل الواردة التي وصلت إلى `chat.db` أثناء انقطاعه (تعطل، إعادة تشغيل، سكون Mac) عند بدء التشغيل التالي. يكون معطلا افتراضيا — راجع [الاستدراك بعد توقف Gateway](#catching-up-after-gateway-downtime). يغلق [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
أزيل دعم BlueBubbles. انقل إعدادات `channels.bluebubbles` إلى `channels.imessage`؛ يدعم OpenClaw iMessage عبر `imsg` فقط. ابدأ بـ [إزالة BlueBubbles ومسار imsg في iMessage](/ar/announcements/bluebubbles-imessage) للإعلان المختصر، أو [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles) لجدول الترحيل الكامل.
</Warning>

الحالة: تكامل CLI خارجي أصلي. يشغّل Gateway الأمر `imsg rpc` ويتواصل عبر JSON-RPC على stdio (بدون عفريت/منفذ منفصل). تتطلب الإجراءات المتقدمة `imsg launch` وفحص API خاص ناجحا.

<CardGroup cols={3}>
  <Card title="إجراءات API الخاصة" icon="wand-sparkles" href="#private-api-actions">
    الردود، وtapbacks، والتأثيرات، والمرفقات، وإدارة المجموعات.
  </Card>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تعتمد الرسائل المباشرة في iMessage وضع الاقتران افتراضيا.
  </Card>
  <Card title="Mac بعيد" icon="terminal" href="#remote-mac-over-ssh">
    استخدم مغلّف SSH عندما لا يكون Gateway قيد التشغيل على جهاز Mac الخاص بـ Messages.
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

      <Step title="الموافقة على اقتران أول رسالة مباشرة (dmPolicy الافتراضي)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac بعيد عبر SSH">
    لا يتطلب OpenClaw إلا `cliPath` متوافقا مع stdio، لذلك يمكنك جعل `cliPath` يشير إلى سكربت مغلّف يتصل عبر SSH بجهاز Mac بعيد ويشغّل `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    الإعداد الموصى به عند تمكين المرفقات:

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

    إذا لم يتم ضبط `remoteHost`، يحاول OpenClaw اكتشافه تلقائيا عبر تحليل سكربت مغلّف SSH.
    يجب أن يكون `remoteHost` بصيغة `host` أو `user@host` (بدون مسافات أو خيارات SSH).
    يستخدم OpenClaw فحصا صارما لمفتاح المضيف عند استخدام SCP، لذلك يجب أن يكون مفتاح مضيف الترحيل موجودا مسبقا في `~/.ssh/known_hosts`.
    تتحقق مسارات المرفقات مقابل الجذور المسموح بها (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## المتطلبات والأذونات (macOS)

- يجب تسجيل الدخول إلى Messages على جهاز Mac الذي يشغّل `imsg`.
- يلزم Full Disk Access لسياق العملية الذي يشغّل OpenClaw/`imsg` (للوصول إلى قاعدة بيانات Messages).
- يلزم إذن Automation لإرسال الرسائل عبر Messages.app.
- للإجراءات المتقدمة (تفاعل / تعديل / إلغاء إرسال / رد مترابط / تأثيرات / عمليات المجموعات)، يجب تعطيل System Integrity Protection — راجع [تمكين API الخاصة في imsg](#enabling-the-imsg-private-api) أدناه. يعمل إرسال/استقبال النصوص والوسائط الأساسي بدونه.

<Tip>
تمنح الأذونات لكل سياق عملية. إذا كان Gateway يعمل بدون واجهة (LaunchAgent/SSH)، فشغّل أمرا تفاعليا لمرة واحدة في السياق نفسه لتشغيل المطالبات:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## تمكين API الخاصة في imsg

يأتي `imsg` بوضعين تشغيليين:

- **الوضع الأساسي** (افتراضي، ولا يحتاج إلى تغييرات SIP): النصوص والوسائط الصادرة عبر `send`، ومراقبة/سجل الوارد، وقائمة المحادثات. هذا ما تحصل عليه مباشرة من تثبيت جديد عبر `brew install steipete/tap/imsg` مع أذونات macOS القياسية أعلاه.
- **وضع API الخاصة**: يحقن `imsg` مكتبة dylib مساعدة في `Messages.app` لاستدعاء دوال `IMCore` الداخلية. هذا ما يفتح `react` و`edit` و`unsend` و`reply` (المترابط) و`sendWithEffect` و`renameGroup` و`setGroupIcon` و`addParticipant` و`removeParticipant` و`leaveGroup`، إضافة إلى مؤشرات الكتابة وإيصالات القراءة.

للوصول إلى سطح الإجراءات المتقدمة الذي توثقه صفحة القناة هذه، تحتاج إلى وضع API الخاصة. يوضح README الخاص بـ `imsg` المتطلب صراحة:

> الميزات المتقدمة مثل `read` و`typing` و`launch` والإرسال الغني المدعوم بالجسر وتعديل الرسائل وإدارة المحادثات اختيارية. تتطلب تعطيل SIP وحقن مكتبة dylib مساعدة في `Messages.app`. يرفض `imsg launch` الحقن عندما يكون SIP ممكنا.

تستخدم تقنية حقن المساعد مكتبة dylib الخاصة بـ `imsg` للوصول إلى واجهات API الخاصة في Messages. لا يوجد خادم تابع لجهة خارجية أو وقت تشغيل BlueBubbles في مسار OpenClaw iMessage.

<Warning>
**تعطيل SIP مقايضة أمنية حقيقية.** SIP إحدى حمايات macOS الأساسية ضد تشغيل كود نظام معدل؛ وإيقافه على مستوى النظام يفتح مساحة هجوم وآثارا جانبية إضافية. تحديدا، **تعطيل SIP على أجهزة Mac ذات Apple Silicon يعطل أيضا القدرة على تثبيت وتشغيل تطبيقات iOS على جهاز Mac**.

تعامل مع هذا كخيار تشغيلي متعمد، لا كخيار افتراضي. إذا كان نموذج التهديد لديك لا يتحمل إيقاف SIP، فسيقتصر iMessage المضمّن على الوضع الأساسي — إرسال/استقبال النصوص والوسائط فقط، بدون تفاعلات / تعديل / إلغاء إرسال / تأثيرات / عمليات المجموعات.
</Warning>

### الإعداد

1. **ثبّت (أو رقّ) `imsg`** على جهاز Mac الذي يشغّل Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   يبلّغ خرج `imsg status --json` عن `bridge_version` و`rpc_methods` و`selectors` لكل طريقة لكي ترى ما يدعمه البناء الحالي قبل البدء.

2. **عطّل System Integrity Protection.** هذا خاص بإصدار macOS لأن متطلب Apple الأساسي يعتمد على نظام التشغيل والعتاد:
   - **macOS 10.13–10.15 (Sierra–Catalina):** عطّل Library Validation عبر Terminal، وأعد التشغيل إلى Recovery Mode، وشغّل `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+ (Big Sur والإصدارات الأحدث)، Intel:** Recovery Mode (أو Internet Recovery)، ثم `csrutil disable`، ثم إعادة التشغيل.
   - **macOS 11+، Apple Silicon:** تسلسل بدء التشغيل بزر الطاقة للدخول إلى Recovery؛ في إصدارات macOS الحديثة اضغط باستمرار على مفتاح **Left Shift** عند النقر على Continue، ثم `csrutil disable`. تتبع إعدادات الأجهزة الافتراضية مسارا منفصلا — خذ لقطة VM أولا.
   - **macOS 26 / Tahoe:** أصبحت سياسات library-validation وفحوصات الاستحقاقات الخاصة في `imagent` أكثر صرامة؛ قد يحتاج `imsg` إلى بناء محدث لمواكبتها. إذا بدأ حقن `imsg launch` أو `selectors` محددة بإرجاع false بعد ترقية رئيسية لـ macOS، فتحقق من ملاحظات إصدار `imsg` قبل افتراض أن خطوة SIP نجحت.

   اتبع مسار Recovery Mode من Apple لجهاز Mac لديك لتعطيل SIP قبل تشغيل `imsg launch`.

3. **احقن المساعد.** مع تعطيل SIP وتسجيل الدخول إلى Messages.app:

   ```bash
   imsg launch
   ```

   يرفض `imsg launch` الحقن إذا كان SIP لا يزال ممكنا، لذلك يعمل هذا أيضا كتأكيد على نجاح الخطوة 2.

4. **تحقق من الجسر من OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   يجب أن يبلّغ إدخال iMessage عن `works`، ويجب أن يعرض `imsg status --json | jq '.selectors'` قيمة `retractMessagePart: true` إضافة إلى أي محددات تعديل / كتابة / قراءة يكشفها بناء macOS لديك. لا يعلن Plugin OpenClaw عن الإجراءات في `actions.ts` إلا لكل طريقة يكون المحدد الأساسي لها `true`، لذلك يعكس سطح الإجراءات الذي تراه في قائمة أدوات الوكيل ما يستطيع الجسر فعله فعليا على هذا المضيف.

إذا أبلغ `openclaw channels status --probe` عن القناة كـ `works` لكن إجراءات محددة ترمي الخطأ "iMessage `<action>` requires the imsg private API bridge" وقت الإرسال، فشغّل `imsg launch` مرة أخرى — يمكن أن يسقط المساعد (إعادة تشغيل Messages.app، تحديث نظام التشغيل، وغير ذلك) وستستمر حالة `available: true` المخزنة مؤقتا في الإعلان عن الإجراءات حتى يحدّث الفحص التالي الحالة.

### عندما لا يمكنك تعطيل SIP

إذا لم يكن تعطيل SIP مقبولا لنموذج التهديد لديك:

- يعود `imsg` إلى الوضع الأساسي — نص + وسائط + استقبال فقط.
- يظل Plugin الخاص بـ OpenClaw يعلن عن إرسال النصوص/الوسائط والمراقبة الواردة؛ لكنه يخفي فقط `react` و`edit` و`unsend` و`reply` و`sendWithEffect` وعمليات المجموعات من سطح الإجراءات (وفقا لبوابة القدرات لكل طريقة).
- يمكنك تشغيل جهاز Mac منفصل ليس من نوع Apple Silicon (أو جهاز Mac مخصص للروبوت) مع إيقاف SIP لعبء عمل iMessage، مع إبقاء SIP ممكنا على أجهزتك الأساسية. راجع [مستخدم macOS مخصص للروبوت (هوية iMessage منفصلة)](#deployment-patterns) أدناه.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.imessage.dmPolicy` في الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    حقل قائمة السماح: `channels.imessage.allowFrom`.

    يمكن أن تكون إدخالات قائمة السماح معرّفات، أو مجموعات وصول مرسل ثابتة (`accessGroup:<name>`)، أو أهداف محادثة (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`).

  </Tab>

  <Tab title="سياسة المجموعات + الإشارات">
    يتحكم `channels.imessage.groupPolicy` في التعامل مع المجموعات:

    - `allowlist` (افتراضي عند ضبطه)
    - `open`
    - `disabled`

    قائمة السماح لمرسل المجموعة: `channels.imessage.groupAllowFrom`.

    يمكن لإدخالات `groupAllowFrom` أيضا الإشارة إلى مجموعات وصول مرسل ثابتة (`accessGroup:<name>`).

    رجوع وقت التشغيل: إذا لم يتم ضبط `groupAllowFrom`، تعود فحوصات مرسلي مجموعات iMessage إلى `allowFrom` عند توفره.
    ملاحظة وقت التشغيل: إذا كان `channels.imessage` مفقودا تماما، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرا (حتى إذا كان `channels.defaults.groupPolicy` مضبوطا).

    <Warning>
    لتوجيه المجموعات بوابتا قائمة سماح تعملان **كلتاهما** بالتتابع، ويجب أن تنجحا معا:

    1. **قائمة السماح للمرسل / هدف المحادثة** (`channels.imessage.groupAllowFrom`) — معرّف، أو `chat_guid`، أو `chat_identifier`، أو `chat_id`.
    2. **سجل المجموعات** (`channels.imessage.groups`) — مع `groupPolicy: "allowlist"`، تتطلب هذه البوابة إما إدخال بدل عام `groups: { "*": { ... } }` (يضبط `allowAll = true`)، أو إدخالا صريحا لكل `chat_id` تحت `groups`.

    إذا لم يكن في البوابة 2 أي شيء، تسقط كل رسالة مجموعة. يصدر Plugin إشارتين بمستوى `warn` عند مستوى السجل الافتراضي:

    - مرة واحدة لكل حساب عند بدء التشغيل: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - مرة واحدة لكل `chat_id` وقت التشغيل: `imessage: dropping group message from chat_id=<id> ...`

    تستمر الرسائل المباشرة في العمل لأنها تسلك مسار كود مختلفا.

    الحد الأدنى من الإعدادات لإبقاء المجموعات متدفقة تحت `groupPolicy: "allowlist"`:

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

    إذا ظهرت أسطر `warn` هذه في سجل Gateway، فإن البوابة 2 تُسقِط الرسائل — أضِف كتلة `groups`.
    </Warning>

    اذكر البوابات الخاصة بالمجموعات:

    - لا يحتوي iMessage على بيانات وصفية أصلية للإشارات
    - يستخدم اكتشاف الإشارات أنماط regex (`agents.list[].groupChat.mentionPatterns`، والبديل `messages.groupChat.mentionPatterns`)
    - من دون أنماط مهيّأة، لا يمكن فرض بوابة الإشارات

    يمكن لأوامر التحكم من المرسلين المصرح لهم تجاوز بوابة الإشارات في المجموعات.

    `systemPrompt` لكل مجموعة:

    يقبل كل إدخال ضمن `channels.imessage.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن القيمة في مطالبة نظام الوكيل في كل دورة تعالج رسالة في تلك المجموعة. يماثل الحل آلية حل المطالبة لكل مجموعة المستخدمة بواسطة `channels.whatsapp.groups`:

    1. **مطالبة النظام الخاصة بالمجموعة** (`groups["<chat_id>"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` معرّفًا. إذا كانت `systemPrompt` سلسلة فارغة (`""`) فيُمنع wildcard ولا تُطبق أي مطالبة نظام على تلك المجموعة.
    2. **مطالبة نظام wildcard للمجموعات** (`groups["*"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

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

    تُطبق مطالبات كل مجموعة على رسائل المجموعات فقط — ولا تتأثر الرسائل المباشرة في هذه القناة.

  </Tab>

  <Tab title="الجلسات والردود الحتمية">
    - تستخدم الرسائل المباشرة التوجيه المباشر؛ وتستخدم المجموعات توجيه المجموعات.
    - مع الإعداد الافتراضي `session.dmScope=main`، تُدمج رسائل iMessage المباشرة في الجلسة الرئيسية للوكيل.
    - جلسات المجموعات معزولة (`agent:<agentId>:imessage:group:<chat_id>`).
    - تُوجَّه الردود مرة أخرى إلى iMessage باستخدام بيانات القناة/الهدف الوصفية الأصلية.

    سلوك سلاسل المحادثة الشبيهة بالمجموعات:

    قد تصل بعض سلاسل iMessage متعددة المشاركين مع `is_group=false`.
    إذا كان ذلك `chat_id` مهيأ صراحةً ضمن `channels.imessage.groups`، فيتعامل OpenClaw معه كحركة مرور مجموعة (بوابة المجموعة + عزل جلسة المجموعة).

  </Tab>
</Tabs>

## ارتباطات محادثات ACP

يمكن أيضًا ربط محادثات iMessage القديمة بجلسات ACP.

تدفق سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو محادثة المجموعة المسموح بها.
- تُوجَّه الرسائل المستقبلية في محادثة iMessage نفسها إلى جلسة ACP المُنشأة.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

تُدعم الارتباطات المستمرة المهيأة عبر إدخالات `bindings[]` من المستوى الأعلى مع `type: "acp"` و`match.channel: "imessage"`.

يمكن أن يستخدم `match.peer.id`:

- معرّف رسالة مباشرة مُطبّع مثل `+15555550123` أو `user@example.com`
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

راجع [وكلاء ACP](/ar/tools/acp-agents) لمعرفة سلوك ارتباط ACP المشترك.

## أنماط النشر

<AccordionGroup>
  <Accordion title="مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)">
    استخدم Apple ID مخصصًا ومستخدم macOS مخصصًا حتى تُعزل حركة مرور البوت عن ملفك الشخصي في Messages.

    التدفق المعتاد:

    1. أنشئ مستخدم macOS مخصصًا أو سجّل الدخول إليه.
    2. سجّل الدخول إلى Messages باستخدام Apple ID الخاص بالبوت في ذلك المستخدم.
    3. ثبّت `imsg` في ذلك المستخدم.
    4. أنشئ مغلّف SSH حتى يتمكن OpenClaw من تشغيل `imsg` في سياق ذلك المستخدم.
    5. وجّه `channels.imessage.accounts.<id>.cliPath` و`.dbPath` إلى ملف تعريف ذلك المستخدم.

    قد يتطلب التشغيل الأول موافقات واجهة رسومية (Automation + Full Disk Access) في جلسة مستخدم البوت تلك.

  </Accordion>

  <Accordion title="جهاز Mac بعيد عبر Tailscale (مثال)">
    البنية الشائعة:

    - يعمل Gateway على Linux/VM
    - يعمل iMessage و`imsg` على جهاز Mac في tailnet الخاصة بك
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

    استخدم مفاتيح SSH حتى يكون كل من SSH وSCP غير تفاعليين.
    تأكد أولًا من الوثوق بمفتاح المضيف (مثلًا `ssh bot@mac-mini.tailnet-1234.ts.net`) حتى تُملأ `known_hosts`.

  </Accordion>

  <Accordion title="نمط الحسابات المتعددة">
    يدعم iMessage التهيئة لكل حساب ضمن `channels.imessage.accounts`.

    يمكن لكل حساب تجاوز حقول مثل `cliPath` و`dbPath` و`allowFrom` و`groupPolicy` و`mediaMaxMb` وإعدادات السجل وقوائم السماح لجذور المرفقات.

  </Accordion>
</AccordionGroup>

## الوسائط والتقسيم وأهداف التسليم

<AccordionGroup>
  <Accordion title="المرفقات والوسائط">
    - استيعاب المرفقات الواردة **معطّل افتراضيًا** — عيّن `channels.imessage.includeAttachments: true` لتمرير الصور والمذكرات الصوتية والفيديو والمرفقات الأخرى إلى الوكيل. عند تعطيله، تُسقَط رسائل iMessage التي تحتوي على مرفقات فقط قبل الوصول إلى الوكيل وقد لا تنتج أي سطر سجل `Inbound message` إطلاقًا.
    - يمكن جلب مسارات المرفقات البعيدة عبر SCP عند تعيين `remoteHost`
    - يجب أن تطابق مسارات المرفقات الجذور المسموح بها:
      - `channels.imessage.attachmentRoots` (محلي)
      - `channels.imessage.remoteAttachmentRoots` (وضع SCP البعيد)
      - نمط الجذر الافتراضي: `/Users/*/Library/Messages/Attachments`
    - يستخدم SCP تحققًا صارمًا من مفتاح المضيف (`StrictHostKeyChecking=yes`)
    - يستخدم حجم الوسائط الصادرة `channels.imessage.mediaMaxMb` (الافتراضي 16 MB)

  </Accordion>

  <Accordion title="تقسيم الصادر">
    - حد تقسيم النص: `channels.imessage.textChunkLimit` (الافتراضي 4000)
    - وضع التقسيم: `channels.imessage.chunkMode`
      - `length` (الافتراضي)
      - `newline` (تقسيم يقدّم الفقرات أولًا)

  </Accordion>

  <Accordion title="تنسيقات العناوين">
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

## إجراءات واجهة API الخاصة

عندما يكون `imsg launch` قيد التشغيل ويُبلغ `openclaw channels status --probe` عن `privateApi.available: true`، يمكن لأداة الرسائل استخدام إجراءات iMessage الأصلية إلى جانب إرسال النصوص العادي.

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
    - **react**: إضافة/إزالة tapbacks في iMessage (`messageId` و`emoji` و`remove`). تُطابق tapbacks المدعومة الحب والإعجاب وعدم الإعجاب والضحك والتأكيد والسؤال.
    - **reply**: إرسال رد ضمن سلسلة إلى رسالة موجودة (`messageId` و`text` أو `message`، بالإضافة إلى `chatGuid` أو `chatId` أو `chatIdentifier` أو `to`).
    - **sendWithEffect**: إرسال نص مع تأثير iMessage (`text` أو `message`، و`effect` أو `effectId`).
    - **edit**: تعديل رسالة مرسلة على إصدارات macOS/واجهة API الخاصة المدعومة (`messageId` و`text` أو `newText`).
    - **unsend**: سحب رسالة مرسلة على إصدارات macOS/واجهة API الخاصة المدعومة (`messageId`).
    - **upload-file**: إرسال وسائط/ملفات (`buffer` بصيغة base64 أو `media`/`path`/`filePath` مُهيّأ، و`filename`، و`asVoice` اختياري). الاسم المستعار القديم: `sendAttachment`.
    - **renameGroup** و**setGroupIcon** و**addParticipant** و**removeParticipant** و**leaveGroup**: إدارة محادثات المجموعات عندما يكون الهدف الحالي محادثة مجموعة.

  </Accordion>

  <Accordion title="معرّفات الرسائل">
    يتضمن سياق iMessage الوارد قيم `MessageSid` قصيرة وGUIDs كاملة للرسائل عند توفرها. تكون المعرّفات القصيرة ضمن نطاق ذاكرة التخزين المؤقت الحديثة للردود في الذاكرة وتُفحص مقابل الدردشة الحالية قبل الاستخدام. إذا انتهت صلاحية معرّف قصير أو كان ينتمي إلى دردشة أخرى، فأعد المحاولة باستخدام `MessageSidFull` الكامل.

  </Accordion>

  <Accordion title="اكتشاف القدرات">
    يخفي OpenClaw إجراءات واجهة API الخاصة فقط عندما تشير حالة الفحص المخزنة مؤقتًا إلى أن الجسر غير متاح. إذا كانت الحالة غير معروفة، تبقى الإجراءات مرئية وتُشغّل فحوصات الإرسال بشكل كسول بحيث يمكن أن ينجح الإجراء الأول بعد `imsg launch` من دون تحديث يدوي منفصل للحالة.

  </Accordion>

  <Accordion title="إيصالات القراءة والكتابة">
    عندما يكون جسر واجهة API الخاصة متاحًا، تُعلَّم الدردشات الواردة المقبولة كمقروءة قبل الإرسال وتُعرض فقاعة كتابة للمرسل أثناء إنشاء الوكيل للرد. عطّل تعليم القراءة باستخدام:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    ستوقف إصدارات `imsg` الأقدم، التي تسبق قائمة القدرات لكل طريقة، الكتابة/القراءة بصمت؛ ويسجل OpenClaw تحذيرًا لمرة واحدة لكل إعادة تشغيل حتى يمكن عزو الإيصال المفقود.

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

## دمج الرسائل المباشرة المقسّمة عند الإرسال (أمر + عنوان URL في تركيب واحد)

عندما يكتب مستخدم أمرًا وعنوان URL معًا — مثل `Dump https://example.com/article` — يقسّم تطبيق Messages من Apple الإرسال إلى **صفّين منفصلين في `chat.db`**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

يصل الصفان إلى OpenClaw بفاصل يقارب 0.8-2.0 ثانية في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في الدورة 1، ويرد (غالبًا "أرسل لي عنوان URL")، ولا يرى عنوان URL إلا في الدورة 2 — وعندها يكون سياق الأمر قد فُقد بالفعل. هذا مسار إرسال Apple، وليس شيئًا يضيفه OpenClaw أو `imsg`.

يختار `channels.imessage.coalesceSameSenderDms` إدخال رسالة مباشرة في دمج الصفوف المتتالية من المرسل نفسه في دورة وكيل واحدة. تستمر دردشات المجموعات في الإرسال لكل رسالة حتى تُحفظ بنية دورات المستخدمين المتعددين.

<Tabs>
  <Tab title="متى تفعّله">
    فعّله عندما:

    - تشحن Skills تتوقع `command + payload` في رسالة واحدة (تفريغ، لصق، حفظ، قائمة انتظار، إلخ).
    - يلصق المستخدمون عناوين URL أو صورًا أو محتوى طويلًا بجانب الأوامر.
    - يمكنك قبول زمن انتظار إضافي لدورة الرسائل المباشرة (انظر أدناه).

    اتركه معطلًا عندما:

    - تحتاج إلى أقل زمن انتظار للأوامر لمشغلات الرسائل المباشرة ذات الكلمة الواحدة.
    - تكون كل تدفقاتك أوامر لمرة واحدة من دون متابعات حمولة.

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

    عند تفعيل العلامة ومن دون وجود `messages.inbound.byChannel.imessage` صريح، تتسع نافذة إزالة الارتداد إلى **2500 ms** (القيمة الافتراضية القديمة هي 0 ms — أي بلا إزالة ارتداد). النافذة الأوسع مطلوبة لأن وتيرة الإرسال المقسّم من Apple، البالغة 0.8-2.0 s، لا تناسب قيمة افتراضية أضيق.

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
  <Tab title="Trade-offs">
    - **زمن انتقال إضافي لرسائل DM.** عند تفعيل العلامة، تنتظر كل رسالة DM (بما في ذلك أوامر التحكم المستقلة والمتابعات ذات النص الواحد) حتى انتهاء نافذة إزالة الارتداد قبل الإرسال، تحسبًا لوصول صف حمولة. تحتفظ رسائل الدردشة الجماعية بالإرسال الفوري.
    - **المخرجات المدمجة محدودة.** يحد النص المدمج عند 4000 حرف مع علامة `…[truncated]` صريحة؛ وتحد المرفقات عند 20؛ وتحد إدخالات المصدر عند 10 (مع الاحتفاظ بالأول والأحدث بعد ذلك). يتم تتبع كل GUID مصدر في `coalescedMessageGuids` من أجل القياسات اللاحقة.
    - **DM فقط.** تمر الدردشات الجماعية إلى الإرسال لكل رسالة حتى يبقى البوت سريع الاستجابة عندما يكتب عدة أشخاص.
    - **تفعيل اختياري، لكل قناة.** لا تتأثر القنوات الأخرى (Telegram، WhatsApp، Slack، …). يجب على إعدادات BlueBubbles القديمة التي تضبط `channels.bluebubbles.coalesceSameSenderDms` ترحيل تلك القيمة إلى `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

| ما ينشئه المستخدم                                                  | ما ينتجه `chat.db`    | العلامة معطلة (افتراضيًا)                | العلامة مفعلة + نافذة 2500 ms                                           |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                            | صفان يفصل بينهما ~1 s | دورتا وكيل: "Dump" وحدها، ثم URL        | دورة واحدة: نص مدمج `Dump https://example.com`                         |
| `Save this 📎image.jpg caption` (مرفق + نص)                        | صفان                  | دورتان (يسقط المرفق عند الدمج)          | دورة واحدة: النص + الصورة محفوظان                                      |
| `/status` (أمر مستقل)                                              | صف واحد               | إرسال فوري                              | **انتظار حتى النافذة، ثم إرسال**                                       |
| URL ملصق وحده                                                       | صف واحد               | إرسال فوري                              | إرسال فوري (إدخال واحد فقط في الحاوية)                                 |
| نص + URL مرسلان كرسالتين منفصلتين عمدًا، بينهما دقائق             | صفان خارج النافذة     | دورتان                                  | دورتان (تنتهي النافذة بينهما)                                          |
| تدفق سريع (>10 رسائل DM صغيرة داخل النافذة)                        | N صفوف                | N دورات                                 | دورة واحدة، مخرجات محدودة (الأول + الأحدث، مع تطبيق حدود النص/المرفقات) |
| شخصان يكتبان في دردشة جماعية                                       | N صفوف من M مرسلين    | M+ دورات (واحدة لكل حاوية مرسل)         | M+ دورات — لا يتم دمج الدردشات الجماعية                                |

## اللحاق بعد توقف Gateway

عندما يكون Gateway غير متصل (تعطل، إعادة تشغيل، نوم Mac، إيقاف الجهاز)، يستأنف `imsg watch` من حالة `chat.db` الحالية بمجرد عودة Gateway للعمل — وأي شيء وصل أثناء الفجوة لا تتم رؤيته افتراضيًا. يعيد اللحاق تشغيل تلك الرسائل عند بدء التشغيل التالي حتى لا يفوت الوكيل حركة واردة بصمت.

اللحاق **معطل افتراضيًا**. فعّله لكل قناة:

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

تمريرة واحدة لكل بدء تشغيل `monitorIMessageProvider`، مرتبة كالتالي: جاهزية `imsg launch` ← `watch.subscribe` ← `performIMessageCatchup` ← حلقة الإرسال الحي. يستخدم اللحاق نفسه `chats.list` + `messages.history` لكل دردشة عبر عميل JSON-RPC نفسه المستخدم بواسطة `imsg watch`. أي شيء يصل أثناء تمريرة اللحاق يتدفق عبر الإرسال الحي بشكل طبيعي؛ وتمتص ذاكرة التخزين المؤقت الحالية لإزالة تكرار الوارد أي تداخل مع الصفوف المعاد تشغيلها.

يمر كل صف معاد تشغيله عبر مسار الإرسال الحي (`evaluateIMessageInbound` + `dispatchInboundMessage`)، لذلك تتصرف قوائم السماح، وسياسة المجموعات، ومزيل الارتداد، وذاكرة صدى التخزين المؤقت، وإيصالات القراءة بشكل مطابق في الرسائل المعاد تشغيلها والرسائل الحية.

### دلالات المؤشر وإعادة المحاولة

يحتفظ اللحاق بمؤشر لكل حساب عند `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (مجلد حالة OpenClaw الافتراضي هو `~/.openclaw`، ويمكن تجاوزه باستخدام `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- يتقدم المؤشر عند كل إرسال ناجح، ويبقى ثابتًا عندما يطرح إرسال صف خطأ — يعيد بدء التشغيل التالي محاولة الصف نفسه من المؤشر المحتفظ به.
- بعد `maxFailureRetries` من الأخطاء المتتالية ضد `guid` نفسه، يسجل اللحاق `warn` ويفرض تقدم المؤشر بعد الرسالة العالقة حتى تتمكن عمليات بدء التشغيل اللاحقة من المتابعة.
- يتم تخطي GUIDs التي تم التخلي عنها سابقًا عند رؤيتها (بلا محاولة إرسال) في التشغيلات اللاحقة، وتُحتسب ضمن `skippedGivenUp` في ملخص التشغيل.

### إشارات مرئية للمشغل

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

يعني سطر `WARN ... capped to perRunLimit` أن بدء تشغيل واحد لم يفرغ كامل التراكم. ارفع `perRunLimit` (الحد الأقصى 500) إذا كانت الفجوات لديك تتجاوز بانتظام القيمة الافتراضية البالغة 50 صفًا لكل تمريرة.

### متى تتركه معطلاً

- يعمل Gateway باستمرار مع إعادة تشغيل تلقائية عبر المراقب، والفجوات دائمًا < بضع ثوان — القيمة الافتراضية المعطلة مناسبة.
- حجم DM منخفض، والرسائل الفائتة لن تغير سلوك الوكيل — يمكن أن ترسل نافذة `firstRunLookbackMinutes` الأولية سياقًا قديمًا مفاجئًا عند التفعيل الأول.

عند تفعيل اللحاق، ينظر بدء التشغيل الأول بلا مؤشر إلى الوراء بمقدار `firstRunLookbackMinutes` فقط (الافتراضي 30 دقيقة)، وليس كامل نافذة `maxAgeMinutes` — وهذا يتجنب إعادة تشغيل تاريخ طويل من الرسائل السابقة للتفعيل.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    تحقق من الملف التنفيذي ودعم RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    إذا أبلغ الفحص أن RPC غير مدعوم، فحدّث `imsg`. إذا كانت إجراءات API الخاصة غير متاحة، فشغّل `imsg launch` في جلسة مستخدم macOS المسجل دخوله وافحص مجددًا. إذا لم يكن Gateway يعمل على macOS، فاستخدم إعداد Mac البعيد عبر SSH أعلاه بدلًا من مسار `imsg` المحلي الافتراضي.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    يجب أن يعمل `cliPath: "imsg"` الافتراضي على جهاز Mac المسجل دخوله إلى Messages. على Linux أو Windows، اضبط `channels.imessage.cliPath` على سكربت تغليف يتصل بذلك Mac عبر SSH ويشغل `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    ثم شغّل:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    تحقق من:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - موافقات الاقتران (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    تحقق من:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - سلوك قائمة السماح `channels.imessage.groups`
    - إعداد نمط الإشارة (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    تحقق من:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - مصادقة مفتاح SSH/SCP من مضيف Gateway
    - وجود مفتاح المضيف في `~/.ssh/known_hosts` على مضيف Gateway
    - قابلية قراءة المسار البعيد على جهاز Mac الذي يشغل Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    أعد التشغيل في طرفية GUI تفاعلية ضمن سياق المستخدم/الجلسة نفسه ووافق على المطالبات:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    تأكد من منح Full Disk Access + Automation لسياق العملية التي تشغل OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## مؤشرات مرجع الإعدادات

- [مرجع الإعدادات - iMessage](/ar/gateway/config-channels#imessage)
- [إعدادات Gateway](/ar/gateway/configuration)
- [الاقتران](/ar/channels/pairing)

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [إزالة BlueBubbles ومسار imsg iMessage](/ar/announcements/bluebubbles-imessage) — الإعلان وملخص الترحيل
- [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles) — جدول ترجمة الإعدادات والتحويل خطوة بخطوة
- [الاقتران](/ar/channels/pairing) — مصادقة DM وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
