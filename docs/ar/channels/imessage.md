---
read_when:
    - إعداد دعم iMessage
    - تصحيح أخطاء إرسال/استقبال iMessage
summary: دعم iMessage الأصلي عبر imsg (JSON-RPC عبر stdio)، مع إجراءات واجهة برمجة التطبيقات الخاصة للردود، وردود التفاعل السريعة، والتأثيرات، والمرفقات، وإدارة المجموعات. وهو الخيار المفضل لإعدادات OpenClaw iMessage الجديدة عندما تلائم متطلبات المضيف.
title: iMessage
x-i18n:
    generated_at: "2026-05-13T02:51:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8125beab13c067e287f4cc041b65632989b8aaadce9b3719cc5e7312a0927aeb
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
بالنسبة إلى عمليات نشر OpenClaw iMessage، استخدم `imsg` على مضيف macOS Messages مسجّل الدخول. إذا كان Gateway يعمل على Linux أو Windows، فوجّه `channels.imessage.cliPath` إلى مغلّف SSH يشغّل `imsg` على Mac.

**اللحاق بعد توقف Gateway اختياري.** عند تفعيله (`channels.imessage.catchup.enabled: true`)، يعيد Gateway تشغيل الرسائل الواردة التي وصلت إلى `chat.db` أثناء توقفه عن الاتصال (تعطل، إعادة تشغيل، سكون Mac) عند بدء التشغيل التالي. معطّل افتراضيًا — راجع [اللحاق بعد توقف Gateway](#catching-up-after-gateway-downtime). يغلق [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
أُزيل دعم BlueBubbles. انقل إعدادات `channels.bluebubbles` إلى `channels.imessage`؛ يدعم OpenClaw iMessage عبر `imsg` فقط. ابدأ بـ [إزالة BlueBubbles ومسار imsg لـ iMessage](/ar/announcements/bluebubbles-imessage) للاطلاع على الإعلان المختصر، أو [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles) للاطلاع على جدول الترحيل الكامل.
</Warning>

الحالة: تكامل CLI خارجي أصلي. يشغّل Gateway الأمر `imsg rpc` ويتواصل عبر JSON-RPC على stdio (من دون عفريت/منفذ منفصل). تتطلب الإجراءات المتقدمة `imsg launch` وفحصًا ناجحًا لواجهة API الخاصة.

<CardGroup cols={3}>
  <Card title="إجراءات واجهة API الخاصة" icon="wand-sparkles" href="#private-api-actions">
    الردود، والتفاعلات، والمؤثرات، والمرفقات، وإدارة المجموعات.
  </Card>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    تبدأ رسائل iMessage المباشرة افتراضيًا في وضع الإقران.
  </Card>
  <Card title="Mac بعيد" icon="terminal" href="#remote-mac-over-ssh">
    استخدم مغلّف SSH عندما لا يعمل Gateway على Mac الخاص بـ Messages.
  </Card>
  <Card title="مرجع الإعدادات" icon="settings" href="/ar/gateway/config-channels#imessage">
    مرجع كامل لحقول iMessage.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="Mac محلي (المسار السريع)">
    <Steps>
      <Step title="ثبّت imsg وتحقق منه">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="اضبط OpenClaw">

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

      <Step title="ابدأ Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="وافق على أول إقران DM (dmPolicy الافتراضي)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        تنتهي صلاحية طلبات الإقران بعد ساعة واحدة.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac بعيد عبر SSH">
    لا يتطلب OpenClaw إلا `cliPath` متوافقًا مع stdio، لذلك يمكنك توجيه `cliPath` إلى سكربت مغلّف يستخدم SSH للاتصال بـ Mac بعيد وتشغيل `imsg`.

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
    يجب أن يكون `remoteHost` على صورة `host` أو `user@host` (من دون مسافات أو خيارات SSH).
    يستخدم OpenClaw فحصًا صارمًا لمفتاح المضيف مع SCP، لذلك يجب أن يكون مفتاح مضيف الترحيل موجودًا مسبقًا في `~/.ssh/known_hosts`.
    يتم التحقق من مسارات المرفقات مقابل الجذور المسموح بها (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## المتطلبات والأذونات (macOS)

- يجب تسجيل الدخول إلى Messages على Mac الذي يشغّل `imsg`.
- يلزم إذن Full Disk Access لسياق العملية التي تشغّل OpenClaw/`imsg` (للوصول إلى قاعدة بيانات Messages).
- يلزم إذن Automation لإرسال الرسائل عبر Messages.app.
- للإجراءات المتقدمة (تفاعل / تعديل / إلغاء إرسال / رد ضمن سلسلة / مؤثرات / عمليات المجموعات)، يجب تعطيل System Integrity Protection — راجع [تفعيل واجهة API الخاصة في imsg](#enabling-the-imsg-private-api) أدناه. يعمل إرسال/استقبال النصوص والوسائط الأساسي من دونه.

<Tip>
تُمنح الأذونات لكل سياق عملية. إذا كان Gateway يعمل بلا واجهة (LaunchAgent/SSH)، شغّل أمرًا تفاعليًا لمرة واحدة في السياق نفسه لتحفيز المطالبات:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## تفعيل واجهة API الخاصة في imsg

يأتي `imsg` بوضعين تشغيليين:

- **الوضع الأساسي** (افتراضي، لا يحتاج تغييرات SIP): نصوص ووسائط صادرة عبر `send`، ومراقبة/سجل وارد، وقائمة محادثات. هذا ما تحصل عليه مباشرة من تثبيت جديد باستخدام `brew install steipete/tap/imsg` مع أذونات macOS القياسية أعلاه.
- **وضع واجهة API الخاصة**: يحقن `imsg` مكتبة dylib مساعدة في `Messages.app` لاستدعاء دوال `IMCore` الداخلية. هذا ما يفعّل `react`، و`edit`، و`unsend`، و`reply` (ضمن سلسلة)، و`sendWithEffect`، و`renameGroup`، و`setGroupIcon`، و`addParticipant`، و`removeParticipant`، و`leaveGroup`، إضافةً إلى مؤشرات الكتابة وإيصالات القراءة.

للوصول إلى سطح الإجراءات المتقدمة الذي توثقه صفحة القناة هذه، تحتاج إلى وضع واجهة API الخاصة. يوضح README الخاص بـ `imsg` المتطلب صراحةً:

> الميزات المتقدمة مثل `read`، و`typing`، و`launch`، والإرسال الغني المدعوم بالجسر، وتعديل الرسائل، وإدارة المحادثات اختيارية. تتطلب تعطيل SIP وحقن مكتبة dylib مساعدة في `Messages.app`. يرفض `imsg launch` الحقن عندما يكون SIP مفعّلًا.

تستخدم تقنية حقن المساعد مكتبة dylib الخاصة بـ `imsg` للوصول إلى واجهات API الخاصة في Messages. لا يوجد خادم تابع لجهة خارجية أو وقت تشغيل BlueBubbles في مسار OpenClaw iMessage.

<Warning>
**تعطيل SIP مقايضة أمنية حقيقية.** يُعد SIP أحد وسائل الحماية الأساسية في macOS ضد تشغيل كود نظام معدّل؛ وإيقافه على مستوى النظام يفتح مساحة هجوم إضافية وآثارًا جانبية. وبشكل خاص، **يؤدي تعطيل SIP على أجهزة Apple Silicon Mac أيضًا إلى تعطيل القدرة على تثبيت تطبيقات iOS وتشغيلها على Mac الخاص بك**.

تعامل مع هذا بوصفه خيارًا تشغيليًا مقصودًا، لا خيارًا افتراضيًا. إذا كان نموذج التهديد لديك لا يحتمل إيقاف SIP، فسيكون iMessage المضمّن محدودًا بالوضع الأساسي — إرسال/استقبال النصوص والوسائط فقط، من دون تفاعلات / تعديل / إلغاء إرسال / مؤثرات / عمليات مجموعات.
</Warning>

### الإعداد

1. **ثبّت (أو حدّث) `imsg`** على Mac الذي يشغّل Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   يعرض خرج `imsg status --json` الحقول `bridge_version`، و`rpc_methods`، و`selectors` لكل طريقة كي تتمكن من رؤية ما يدعمه البناء الحالي قبل البدء.

2. **عطّل System Integrity Protection.** يختلف ذلك حسب إصدار macOS لأن متطلب Apple الأساسي يعتمد على نظام التشغيل والعتاد:
   - **macOS 10.13–10.15 (Sierra–Catalina):** عطّل Library Validation عبر Terminal، وأعد التشغيل إلى Recovery Mode، وشغّل `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+ (Big Sur والإصدارات الأحدث)، Intel:** Recovery Mode (أو Internet Recovery)، ثم `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+، Apple Silicon:** استخدم تسلسل بدء التشغيل بزر التشغيل للدخول إلى Recovery؛ في إصدارات macOS الحديثة اضغط باستمرار على مفتاح **Left Shift** عند النقر على Continue، ثم `csrutil disable`. تتبع إعدادات الآلات الافتراضية مسارًا منفصلًا — خذ لقطة VM أولًا.
   - **macOS 26 / Tahoe:** أصبحت سياسات library-validation وفحوص استحقاقات `imagent` الخاصة أكثر تشددًا؛ قد يحتاج `imsg` إلى بناء محدّث لمواكبة ذلك. إذا بدأت عملية حقن `imsg launch` أو `selectors` محددة بإرجاع false بعد ترقية رئيسية لـ macOS، فراجع ملاحظات إصدار `imsg` قبل افتراض نجاح خطوة SIP.

   اتبع مسار Recovery Mode الخاص بـ Apple على Mac لتعطيل SIP قبل تشغيل `imsg launch`.

3. **احقن المساعد.** بعد تعطيل SIP وتسجيل الدخول إلى Messages.app:

   ```bash
   imsg launch
   ```

   يرفض `imsg launch` الحقن إذا كان SIP لا يزال مفعّلًا، لذلك يعمل هذا أيضًا كتأكيد على نجاح الخطوة 2.

4. **تحقق من الجسر من OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   يجب أن يبلّغ إدخال iMessage عن `works`، ويجب أن يعرض `imsg status --json | jq '.selectors'` القيمة `retractMessagePart: true` إضافةً إلى محددات التعديل / الكتابة / القراءة التي يوفّرها بناء macOS لديك. لا يعلن تقييد OpenClaw Plugin لكل طريقة في `actions.ts` إلا عن الإجراءات التي يكون محددها الأساسي `true`، لذلك يعكس سطح الإجراءات الذي تراه في قائمة أدوات الوكيل ما يستطيع الجسر فعله فعليًا على هذا المضيف.

إذا أبلغ `openclaw channels status --probe` أن القناة `works` لكن إجراءات محددة ترمي "iMessage `<action>` requires the imsg private API bridge" وقت الإرسال، فشغّل `imsg launch` مرة أخرى — قد يخرج المساعد من الخدمة (إعادة تشغيل Messages.app، تحديث نظام التشغيل، إلخ)، وستستمر الحالة المخبأة `available: true` في الإعلان عن الإجراءات حتى يحدّث الفحص التالي الحالة.

### عندما لا يمكنك تعطيل SIP

إذا لم يكن تعطيل SIP مقبولًا لنموذج التهديد لديك:

- يعود `imsg` إلى الوضع الأساسي — نص + وسائط + استقبال فقط.
- يظل OpenClaw Plugin يعلن عن إرسال النصوص/الوسائط والمراقبة الواردة؛ لكنه يخفي فقط `react`، و`edit`، و`unsend`، و`reply`، و`sendWithEffect`، وعمليات المجموعات من سطح الإجراءات (وفق بوابة الإمكانية لكل طريقة).
- يمكنك تشغيل Mac منفصل غير Apple-Silicon (أو Mac مخصص للبوت) مع إيقاف SIP لعبء عمل iMessage، مع إبقاء SIP مفعّلًا على أجهزتك الأساسية. راجع [مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)](#deployment-patterns) أدناه.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة DM">
    يتحكم `channels.imessage.dmPolicy` في الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    حقل قائمة السماح: `channels.imessage.allowFrom`.

    يجب أن تحدد إدخالات قائمة السماح المرسلين: المعرّفات أو مجموعات وصول مرسل ثابتة (`accessGroup:<name>`). استخدم `channels.imessage.groupAllowFrom` لأهداف المحادثة مثل `chat_id:*`، أو `chat_guid:*`، أو `chat_identifier:*`؛ واستخدم `channels.imessage.groups` لمفاتيح سجل `chat_id` الرقمية.

  </Tab>

  <Tab title="سياسة المجموعات + الإشارات">
    يتحكم `channels.imessage.groupPolicy` في معالجة المجموعات:

    - `allowlist` (افتراضي عند ضبطه)
    - `open`
    - `disabled`

    قائمة السماح لمرسلي المجموعة: `channels.imessage.groupAllowFrom`.

    يمكن لإدخالات `groupAllowFrom` أيضًا الإشارة إلى مجموعات وصول مرسل ثابتة (`accessGroup:<name>`).

    بديل وقت التشغيل: إذا لم يتم تعيين `groupAllowFrom`، تستخدم فحوص مرسل مجموعة iMessage القيمة `allowFrom`؛ عيّن `groupAllowFrom` عندما ينبغي أن يختلف قبول DM عن قبول المجموعات.
    ملاحظة وقت التشغيل: إذا كان `channels.imessage` مفقودًا تمامًا، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا كان `channels.defaults.groupPolicy` مضبوطًا).

    <Warning>
    يحتوي توجيه المجموعات على **بوابتي** قائمة سماح تعملان بالتتابع، ويجب أن تنجح كلتاهما:

    1. **قائمة سماح المرسل / هدف المحادثة** (`channels.imessage.groupAllowFrom`) — معرّف، أو `chat_guid`، أو `chat_identifier`، أو `chat_id`.
    2. **سجل المجموعات** (`channels.imessage.groups`) — مع `groupPolicy: "allowlist"`، تتطلب هذه البوابة إما إدخال بدل عام `groups: { "*": { ... } }` (يعيّن `allowAll = true`)، أو إدخالًا صريحًا لكل `chat_id` ضمن `groups`.

    إذا لم يكن في البوابة 2 أي شيء، تُسقط كل رسالة مجموعة. يصدر Plugin إشارتين بمستوى `warn` عند مستوى السجل الافتراضي:

    - مرة واحدة لكل حساب عند بدء التشغيل: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - مرة واحدة لكل `chat_id` في وقت التشغيل: `imessage: dropping group message from chat_id=<id> ...`

    تستمر رسائل DM في العمل لأنها تتبع مسار كود مختلفًا.

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

    إذا ظهرت أسطر `warn` هذه في سجل Gateway، فهذا يعني أن البوابة 2 تُسقِط الرسائل — أضِف كتلة `groups`.
    </Warning>

    بوابة الإشارة للمجموعات:

    - لا يحتوي iMessage على بيانات وصفية أصلية للإشارات
    - يستخدم اكتشاف الإشارات أنماط regex (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - من دون أنماط مكوّنة، لا يمكن فرض بوابة الإشارة

    يمكن لأوامر التحكم من المرسلين المخوّلين تجاوز بوابة الإشارة في المجموعات.

    `systemPrompt` لكل مجموعة:

    يقبل كل إدخال ضمن `channels.imessage.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن القيمة في مطالبة النظام الخاصة بالوكيل في كل دورة تعالج رسالة في تلك المجموعة. يحاكي الحل طريقة حل المطالبة لكل مجموعة المستخدمة بواسطة `channels.whatsapp.groups`:

    1. **مطالبة نظام خاصة بالمجموعة** (`groups["<chat_id>"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة موجودًا في الخريطة **و** يكون مفتاح `systemPrompt` معرّفًا. إذا كان `systemPrompt` سلسلة فارغة (`""`) فسيتم كبح حرف البدل ولن تُطبّق أي مطالبة نظام على تلك المجموعة.
    2. **مطالبة نظام حرف البدل للمجموعة** (`groups["*"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة غائبًا تمامًا عن الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

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

    لا تنطبق المطالبات لكل مجموعة إلا على رسائل المجموعات — ولا تتأثر الرسائل المباشرة في هذه القناة.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - تستخدم الرسائل الخاصة التوجيه المباشر؛ وتستخدم المجموعات توجيه المجموعات.
    - مع الإعداد الافتراضي `session.dmScope=main`، تُدمج رسائل iMessage الخاصة في جلسة الوكيل الرئيسية.
    - جلسات المجموعات معزولة (`agent:<agentId>:imessage:group:<chat_id>`).
    - تُوجّه الردود عائدة إلى iMessage باستخدام بيانات تعريف القناة/الهدف الأصلية.

    سلوك السلاسل الشبيهة بالمجموعات:

    يمكن أن تصل بعض سلاسل iMessage متعددة المشاركين مع `is_group=false`.
    إذا كان ذلك `chat_id` مكوّنًا صراحة ضمن `channels.imessage.groups`، فيتعامل OpenClaw معه كزيارات مجموعة (بوابة المجموعة + عزل جلسة المجموعة).

  </Tab>
</Tabs>

## ارتباطات محادثات ACP

يمكن أيضًا ربط محادثات iMessage القديمة بجلسات ACP.

تدفق سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل الرسالة الخاصة أو دردشة المجموعة المسموح بها.
- ستُوجّه الرسائل المستقبلية في محادثة iMessage نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

تُدعم الارتباطات الدائمة المكوّنة من خلال إدخالات `bindings[]` على المستوى الأعلى مع `type: "acp"` و`match.channel: "imessage"`.

يمكن أن يستخدم `match.peer.id` ما يلي:

- معرّف رسالة خاصة مطبّع مثل `+15555550123` أو `user@example.com`
- `chat_id:<id>` (موصى به لارتباطات المجموعات الثابتة)
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
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    استخدم Apple ID ومستخدم macOS مخصصين حتى تكون زيارات البوت معزولة عن ملفك الشخصي في Messages.

    التدفق المعتاد:

    1. أنشئ مستخدم macOS مخصصًا/سجّل الدخول إليه.
    2. سجّل الدخول إلى Messages باستخدام Apple ID الخاص بالبوت في ذلك المستخدم.
    3. ثبّت `imsg` في ذلك المستخدم.
    4. أنشئ مغلّف SSH حتى يتمكن OpenClaw من تشغيل `imsg` في سياق ذلك المستخدم.
    5. وجّه `channels.imessage.accounts.<id>.cliPath` و`.dbPath` إلى ملف ذلك المستخدم الشخصي.

    قد يتطلب التشغيل الأول موافقات واجهة رسومية (الأتمتة + الوصول الكامل إلى القرص) في جلسة مستخدم البوت تلك.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    البنية الشائعة:

    - يعمل Gateway على Linux/VM
    - يعمل iMessage + `imsg` على Mac في شبكة tailnet الخاصة بك
    - يستخدم مغلّف `cliPath` SSH لتشغيل `imsg`
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

    استخدم مفاتيح SSH حتى يكون كل من SSH وSCP غير تفاعليين.
    تأكد أولًا من الوثوق بمفتاح المضيف (على سبيل المثال `ssh bot@mac-mini.tailnet-1234.ts.net`) حتى يتم ملء `known_hosts`.

  </Accordion>

  <Accordion title="Multi-account pattern">
    يدعم iMessage التكوين لكل حساب ضمن `channels.imessage.accounts`.

    يمكن لكل حساب تجاوز حقول مثل `cliPath` و`dbPath` و`allowFrom` و`groupPolicy` و`mediaMaxMb` وإعدادات السجل وقوائم السماح لجذور المرفقات.

  </Accordion>
</AccordionGroup>

## الوسائط والتقسيم وأهداف التسليم

<AccordionGroup>
  <Accordion title="Attachments and media">
    - استيعاب المرفقات الواردة **متوقف افتراضيًا** — اضبط `channels.imessage.includeAttachments: true` لتمرير الصور والمذكرات الصوتية والفيديو والمرفقات الأخرى إلى الوكيل. عند تعطيله، تُسقَط رسائل iMessage التي تحتوي على مرفقات فقط قبل أن تصل إلى الوكيل، وقد لا تنتج أي سطر سجل `Inbound message` إطلاقًا.
    - يمكن جلب مسارات المرفقات البعيدة عبر SCP عند ضبط `remoteHost`
    - يجب أن تطابق مسارات المرفقات الجذور المسموح بها:
      - `channels.imessage.attachmentRoots` (محلي)
      - `channels.imessage.remoteAttachmentRoots` (وضع SCP البعيد)
      - نمط الجذر الافتراضي: `/Users/*/Library/Messages/Attachments`
    - يستخدم SCP فحصًا صارمًا لمفتاح المضيف (`StrictHostKeyChecking=yes`)
    - يستخدم حجم الوسائط الصادرة `channels.imessage.mediaMaxMb` (الافتراضي 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - حد تقسيم النص: `channels.imessage.textChunkLimit` (الافتراضي 4000)
    - وضع التقسيم: `channels.imessage.chunkMode`
      - `length` (الافتراضي)
      - `newline` (تقسيم يعطي الأولوية للفقرات)

  </Accordion>

  <Accordion title="Addressing formats">
    الأهداف الصريحة المفضلة:

    - `chat_id:123` (موصى به للتوجيه الثابت)
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

عندما يكون `imsg launch` قيد التشغيل ويُبلغ `openclaw channels status --probe` عن `privateApi.available: true`، يمكن لأداة الرسائل استخدام إجراءات iMessage الأصلية بالإضافة إلى الإرسال النصي العادي.

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
    - **react**: إضافة/إزالة tapbacks في iMessage (`messageId`، `emoji`، `remove`). تُعيَّن tapbacks المدعومة إلى love وlike وdislike وlaugh وemphasize وquestion.
    - **reply**: إرسال رد مترابط على رسالة موجودة (`messageId`، و`text` أو `message`، بالإضافة إلى `chatGuid` أو `chatId` أو `chatIdentifier` أو `to`).
    - **sendWithEffect**: إرسال نص مع تأثير iMessage (`text` أو `message`، و`effect` أو `effectId`).
    - **edit**: تعديل رسالة مُرسلة على إصدارات macOS/API الخاصة المدعومة (`messageId`، و`text` أو `newText`).
    - **unsend**: سحب رسالة مُرسلة على إصدارات macOS/API الخاصة المدعومة (`messageId`).
    - **upload-file**: إرسال وسائط/ملفات (`buffer` كـ base64 أو `media`/`path`/`filePath` مُحضّر، و`filename`، و`asVoice` اختياري). الاسم البديل القديم: `sendAttachment`.
    - **renameGroup**، **setGroupIcon**، **addParticipant**، **removeParticipant**، **leaveGroup**: إدارة دردشات المجموعات عندما يكون الهدف الحالي محادثة مجموعة.

  </Accordion>

  <Accordion title="Message IDs">
    يتضمن سياق iMessage الوارد كلًا من قيم `MessageSid` القصيرة ومعرّفات GUID الكاملة للرسائل عند توفرها. تكون المعرّفات القصيرة محدودة النطاق إلى ذاكرة التخزين المؤقت الحديثة للردود في الذاكرة، وتُفحص مقابل الدردشة الحالية قبل الاستخدام. إذا انتهت صلاحية معرّف قصير أو كان ينتمي إلى دردشة أخرى، فأعد المحاولة باستخدام `MessageSidFull` الكامل.

  </Accordion>

  <Accordion title="Capability detection">
    يخفي OpenClaw إجراءات API الخاصة فقط عندما تقول حالة الفحص المخزنة مؤقتًا إن الجسر غير متاح. إذا كانت الحالة غير معروفة، تظل الإجراءات مرئية وتُجري عمليات الفحص عند الإرسال بشكل كسول حتى ينجح الإجراء الأول بعد `imsg launch` من دون تحديث حالة يدوي منفصل.

  </Accordion>

  <Accordion title="Read receipts and typing">
    عندما يكون جسر API الخاصة قيد التشغيل، تُعلَّم الدردشات الواردة المقبولة كمقروءة قبل الإرسال، وتظهر فقاعة كتابة للمرسل أثناء توليد الوكيل. عطّل التعليم كمقروء باستخدام:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    إصدارات `imsg` الأقدم التي تسبق قائمة الإمكانات لكل طريقة ستعطّل الكتابة/القراءة بصمت؛ يسجل OpenClaw تحذيرًا لمرة واحدة في كل إعادة تشغيل حتى يكون إيصال القراءة المفقود قابلًا للإسناد.

  </Accordion>

  <Accordion title="Inbound tapbacks">
    يشترك OpenClaw في tapbacks الخاصة بـ iMessage ويوجه التفاعلات المقبولة كأحداث نظام بدلًا من نص رسالة عادي، لذلك لا يؤدي tapback من مستخدم إلى تشغيل حلقة رد عادية.

    يتحكم `channels.imessage.reactionNotifications` في وضع الإشعارات:

    - `"own"` (الافتراضي): الإشعار فقط عندما يتفاعل المستخدمون مع رسائل أنشأها البوت.
    - `"all"`: الإشعار بجميع tapbacks الواردة من المرسلين المخوّلين.
    - `"off"`: تجاهل tapbacks الواردة.

    تستخدم التجاوزات لكل حساب `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>
</AccordionGroup>

## كتابات التكوين

يسمح iMessage افتراضيًا بكتابات التكوين التي تبدأها القناة (لـ `/config set|unset` عندما يكون `commands.config: true`).

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

## دمج الرسائل الخاصة المرسلة على دفعتين (أمر + URL في تركيب واحد)

عندما يكتب مستخدم أمرًا وURL معًا — مثل `Dump https://example.com/article` — يقسّم تطبيق Messages من Apple الإرسال إلى **صفَّين منفصلين في `chat.db`**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

يصل الصفان إلى OpenClaw بفاصل يقارب 0.8-2.0 ثانية في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في الدور 1، ويرد غالبا ("أرسل لي عنوان URL")، ولا يرى عنوان URL إلا في الدور 2 — وعندها يكون سياق الأمر قد فُقد بالفعل. هذا من مسار الإرسال الخاص بـ Apple، وليس شيئا يضيفه OpenClaw أو `imsg`.

يتيح `channels.imessage.coalesceSameSenderDms` لرسالة مباشرة دمج الصفوف المتتالية من المرسل نفسه في دور وكيل واحد. تستمر محادثات المجموعات في الإرسال لكل رسالة كي تُحفَظ بنية الأدوار متعددة المستخدمين.

<Tabs>
  <Tab title="متى تفعّله">
    فعّله عندما:

    - تشحن Skills تتوقع `command + payload` في رسالة واحدة (تفريغ، لصق، حفظ، وضع في الطابور، إلخ).
    - يلصق مستخدموك عناوين URL أو صورا أو محتوى طويلا بجانب الأوامر.
    - يمكنك قبول زمن انتظار دور الرسالة المباشرة الإضافي (انظر أدناه).

    اتركه معطلا عندما:

    - تحتاج إلى أقل زمن انتظار للأوامر لمشغلات الرسائل المباشرة ذات الكلمة الواحدة.
    - تكون كل تدفقاتك أوامر أحادية التنفيذ من دون متابعات حمولة.

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

    مع تفعيل العلامة وعدم وجود `messages.inbound.byChannel.imessage` صريح، تتسع نافذة إزالة الارتداد إلى **2500 ms** (القيمة الافتراضية القديمة هي 0 ms — بلا إزالة ارتداد). النافذة الأوسع مطلوبة لأن إيقاع الإرسال المقسّم من Apple البالغ 0.8-2.0 ثانية لا يناسب قيمة افتراضية أضيق.

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
    - **زمن انتظار إضافي لرسائل الرسائل المباشرة.** مع تفعيل العلامة، تنتظر كل رسالة مباشرة (بما في ذلك أوامر التحكم المستقلة والمتابعات النصية الواحدة) حتى نافذة إزالة الارتداد قبل الإرسال، تحسبا لوصول صف حمولة. تحتفظ رسائل محادثات المجموعات بالإرسال الفوري.
    - **المخرجات المدمجة محدودة.** يقتصر النص المدمج على 4000 حرف مع علامة `…[truncated]` صريحة؛ والمرفقات على 20؛ وإدخالات المصدر على 10 (مع الاحتفاظ بالأول والأحدث بعد ذلك). يُتتبع كل GUID مصدر في `coalescedMessageGuids` للقياسات اللاحقة.
    - **للرسائل المباشرة فقط.** تمر محادثات المجموعات إلى الإرسال لكل رسالة كي يبقى البوت مستجيبا عندما يكتب عدة أشخاص.
    - **اختياري، لكل قناة.** لا تتأثر القنوات الأخرى (Telegram وWhatsApp وSlack و…). يجب على إعدادات BlueBubbles القديمة التي تضبط `channels.bluebubbles.coalesceSameSenderDms` ترحيل تلك القيمة إلى `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

| ما ينشئه المستخدم                                                   | ما ينتجه `chat.db`     | العلامة متوقفة (افتراضي)                  | العلامة مفعلة + نافذة 2500 ms                                            |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                              | صفان بفاصل يقارب 1 s   | دوران للوكيل: "Dump" وحده، ثم عنوان URL | دور واحد: نص مدمج `Dump https://example.com`                            |
| `Save this 📎image.jpg caption` (مرفق + نص)                | صفان                  | دوران (يُسقط المرفق عند الدمج)          | دور واحد: النص + الصورة محفوظان                                         |
| `/status` (أمر مستقل)                                     | صف واحد               | إرسال فوري                              | **انتظار حتى النافذة، ثم إرسال**                                        |
| عنوان URL ملصوق وحده                                                | صف واحد               | إرسال فوري                              | إرسال فوري (إدخال واحد فقط في الحاوية)                                  |
| نص + عنوان URL مرسلان كرسالتين منفصلتين عمدا، بفاصل دقائق | صفان خارج النافذة     | دوران                                   | دوران (تنتهي النافذة بينهما)                                           |
| تدفق سريع (>10 رسائل مباشرة صغيرة داخل النافذة)                     | N صفوف                | N أدوار                                 | دور واحد، مخرجات محدودة (الأول + الأحدث، مع تطبيق حدود النص/المرفقات) |
| شخصان يكتبان في محادثة مجموعة                                      | N صفوف من M مرسلين    | M+ أدوار (واحد لكل حاوية مرسل)          | M+ أدوار — لا تُدمج محادثات المجموعات                                  |

## اللحاق بعد توقف Gateway

عندما يكون Gateway غير متصل (تعطل، إعادة تشغيل، نوم Mac، إيقاف الجهاز)، يستأنف `imsg watch` من حالة `chat.db` الحالية بمجرد عودة Gateway — أي شيء وصل أثناء الفجوة، افتراضيا، لا يُرى أبدا. يعيد اللحاق تشغيل تلك الرسائل عند بدء التشغيل التالي كي لا يفوّت الوكيل حركة المرور الواردة بصمت.

اللحاق **معطل افتراضيا**. فعّله لكل قناة:

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

تمريرة واحدة لكل بدء تشغيل لـ `monitorIMessageProvider`، بالتسلسل: جاهزية `imsg launch` → `watch.subscribe` → `performIMessageCatchup` → حلقة الإرسال الحي. يستخدم اللحاق نفسه `chats.list` + `messages.history` لكل محادثة عبر عميل JSON-RPC نفسه المستخدم بواسطة `imsg watch`. أي شيء يصل أثناء تمريرة اللحاق يمر عبر الإرسال الحي بشكل طبيعي؛ وتمتص ذاكرة إزالة التكرار الوارد الحالية أي تداخل مع الصفوف المُعادة.

يُمرر كل صف مُعاد عبر مسار الإرسال الحي (`evaluateIMessageInbound` + `dispatchInboundMessage`)، لذلك تتصرف قوائم السماح وسياسة المجموعة ومزيل الارتداد وذاكرة صدى الرسائل وإيصالات القراءة بالطريقة نفسها في الرسائل المُعادة والرسائل الحية.

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

- يتقدم المؤشر عند كل إرسال ناجح ويُحجز عندما يرمي إرسال صف خطأ — يعيد بدء التشغيل التالي محاولة الصف نفسه من المؤشر المحجوز.
- بعد `maxFailureRetries` أخطاء متتالية مقابل `guid` نفسه، يسجل اللحاق `warn` ويفرض تقدم المؤشر إلى ما بعد الرسالة العالقة كي تتمكن عمليات بدء التشغيل اللاحقة من التقدم.
- تُتخطى معرفات guid التي تم التخلي عنها بالفعل عند رؤيتها (من دون محاولة إرسال) في التشغيلات اللاحقة وتُحتسب تحت `skippedGivenUp` في ملخص التشغيل.

### إشارات مرئية للمشغل

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

يعني سطر `WARN ... capped to perRunLimit` أن بدء تشغيل واحدا لم يفرغ كامل التراكم. ارفع `perRunLimit` (الحد الأقصى 500) إذا كانت فجواتك تتجاوز بانتظام تمريرة الصفوف الخمسين الافتراضية.

### متى تتركه متوقفا

- يعمل Gateway باستمرار مع إعادة تشغيل تلقائية عبر مراقب، والفجوات دائما < بضع ثوان — الافتراضي المتوقف مناسب.
- حجم الرسائل المباشرة منخفض والرسائل الفائتة لن تغير سلوك الوكيل — قد ترسل نافذة `firstRunLookbackMinutes` الأولية سياقا قديما مفاجئا عند أول تفعيل.

عندما تشغّل اللحاق، فإن أول بدء تشغيل بلا مؤشر ينظر إلى الوراء بمقدار `firstRunLookbackMinutes` فقط (30 دقيقة افتراضيا)، لا نافذة `maxAgeMinutes` كاملة — وهذا يتجنب إعادة تشغيل تاريخ طويل من الرسائل السابقة للتفعيل.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم يُعثر على imsg أو RPC غير مدعوم">
    تحقق من الملف الثنائي ودعم RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    إذا أبلغ الفحص أن RPC غير مدعوم، فحدّث `imsg`. إذا كانت إجراءات API الخاصة غير متاحة، فشغّل `imsg launch` في جلسة مستخدم macOS المسجل دخوله وافحص مرة أخرى. إذا لم يكن Gateway يعمل على macOS، فاستخدم إعداد Remote Mac عبر SSH أعلاه بدلا من مسار `imsg` المحلي الافتراضي.

  </Accordion>

  <Accordion title="Gateway لا يعمل على macOS">
    يجب أن يعمل `cliPath: "imsg"` الافتراضي على Mac المسجل دخوله إلى Messages. على Linux أو Windows، اضبط `channels.imessage.cliPath` إلى سكربت غلاف يستخدم SSH إلى ذلك الـ Mac ويشغّل `imsg "$@"`.

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

## مؤشرات مرجع الإعدادات

- [مرجع الإعدادات - iMessage](/ar/gateway/config-channels#imessage)
- [إعدادات Gateway](/ar/gateway/configuration)
- [الاقتران](/ar/channels/pairing)

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [إزالة BlueBubbles ومسار imsg iMessage](/ar/announcements/bluebubbles-imessage) — الإعلان وملخص الترحيل
- [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles) — جدول ترجمة الإعدادات والانتقال خطوة بخطوة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك محادثات المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتحصين
