---
read_when:
    - إعداد دعم iMessage
    - تصحيح أخطاء إرسال/استقبال iMessage
summary: دعم iMessage الأصلي عبر imsg (JSON-RPC عبر stdio)، مع إجراءات API خاصة للردود، وtapbacks، والمؤثرات، والاستطلاعات، والمرفقات، وإدارة المجموعات. يُفضّل لإعدادات OpenClaw iMessage الجديدة عندما تكون متطلبات المضيف مناسبة.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T12:59:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
لنشرات OpenClaw iMessage، استخدم `imsg` على مضيف macOS Messages مسجّل الدخول. إذا كان Gateway يعمل على Linux أو Windows، فاجعل `channels.imessage.cliPath` يشير إلى مغلّف SSH يشغّل `imsg` على Mac.

**استرداد الوارد تلقائي.** بعد إعادة تشغيل الجسر أو Gateway، يعيد iMessage تشغيل الرسائل التي فاتت أثناء توقفه ويمنع "انفجار التراكم" القديم الذي قد تفرغه Apple بعد استرداد Push، مع إزالة التكرار بحيث لا يُرسَل أي شيء مرتين. لا يوجد إعداد لتفعيله — راجع [استرداد الوارد بعد إعادة تشغيل الجسر أو Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
أُزيل دعم BlueBubbles. انقل إعدادات `channels.bluebubbles` إلى `channels.imessage`؛ يدعم OpenClaw iMessage عبر `imsg` فقط. ابدأ بـ [إزالة BlueBubbles ومسار imsg iMessage](/ar/announcements/bluebubbles-imessage) للاطلاع على الإعلان المختصر، أو [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles) للاطلاع على جدول الترحيل الكامل.
</Warning>

الحالة: تكامل CLI خارجي أصلي. يشغّل Gateway الأمر `imsg rpc` ويتواصل عبر JSON-RPC على stdio (من دون daemon/منفذ منفصل). تتطلب الإجراءات المتقدمة `imsg launch` وفحص API خاص ناجحًا.

<CardGroup cols={3}>
  <Card title="إجراءات API الخاصة" icon="wand-sparkles" href="#private-api-actions">
    الردود، وtapbacks، والتأثيرات، والاستطلاعات، والمرفقات، وإدارة المجموعات.
  </Card>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    الرسائل المباشرة في iMessage تستخدم وضع الاقتران افتراضيًا.
  </Card>
  <Card title="Mac بعيد" icon="terminal" href="#remote-mac-over-ssh">
    استخدم مغلّف SSH عندما لا يكون Gateway قيد التشغيل على Mac الخاص بتطبيق Messages.
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

      <Step title="اعتماد أول اقتران DM (dmPolicy الافتراضي)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac بعيد عبر SSH">
    لا يتطلب OpenClaw سوى `cliPath` متوافق مع stdio، لذلك يمكنك توجيه `cliPath` إلى سكربت مغلّف يستخدم SSH إلى Mac بعيد ويشغّل `imsg`.

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

    إذا لم يُضبط `remoteHost`، يحاول OpenClaw اكتشافه تلقائيًا عبر تحليل سكربت مغلّف SSH.
    يجب أن يكون `remoteHost` بصيغة `host` أو `user@host` (من دون مسافات أو خيارات SSH).
    يستخدم OpenClaw تحققًا صارمًا من مفتاح المضيف لـ SCP، لذلك يجب أن يكون مفتاح مضيف الترحيل موجودًا مسبقًا في `~/.ssh/known_hosts`.
    تُتحقَّق مسارات المرفقات مقابل الجذور المسموح بها (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
أي مغلّف `cliPath` أو وكيل SSH تضعه أمام `imsg` يجب أن يتصرف كأنبوب stdio شفاف لـ JSON-RPC طويل العمر. يتبادل OpenClaw رسائل JSON-RPC صغيرة مؤطرة بأسطر جديدة عبر stdin/stdout للمغلّف طوال عمر القناة:

- مرّر كل مقطع/سطر من stdin **فور توفر البايتات** — لا تنتظر EOF.
- مرّر كل مقطع/سطر من stdout بسرعة في الاتجاه العكسي.
- حافظ على الأسطر الجديدة.
- تجنّب قراءات الحظر ذات الحجم الثابت (`read(4096)`, `cat | buffer`, `read` الافتراضي في shell) التي قد تحرم الإطارات الصغيرة من المعالجة.
- أبقِ stderr منفصلًا عن دفق stdout الخاص بـ JSON-RPC.

المغلّف الذي يخزن stdin مؤقتًا حتى يمتلئ حظر كبير سيُنتج أعراضًا تبدو كتعطل iMessage — `imsg rpc timeout (chats.list)` أو عمليات إعادة تشغيل متكررة للقناة — رغم أن `imsg rpc` نفسه سليم. الأمر `ssh -T host imsg "$@"` (أعلاه) آمن لأنه يمرر وسيطات `cliPath` الخاصة بـ OpenClaw مثل `rpc` و`--db`. أما خطوط الأنابيب مثل `ssh host imsg | grep -v '^DEBUG'` فليست آمنة — لا تزال الأدوات ذات التخزين المؤقت على مستوى السطر قادرة على حجز الإطارات؛ استخدم `stdbuf -oL -eL` في كل مرحلة إذا كان لا بد من التصفية.
</Warning>

  </Tab>
</Tabs>

## المتطلبات والأذونات (macOS)

- يجب أن يكون تطبيق Messages مسجّل الدخول على Mac الذي يشغّل `imsg`.
- يلزم Full Disk Access لسياق العملية الذي يشغّل OpenClaw/`imsg` (للوصول إلى قاعدة بيانات Messages).
- يلزم إذن Automation لإرسال الرسائل عبر Messages.app.
- للإجراءات المتقدمة (التفاعل / التحرير / إلغاء الإرسال / الرد المتسلسل / التأثيرات / الاستطلاعات / عمليات المجموعات)، يجب تعطيل System Integrity Protection — راجع [تفعيل API الخاص لـ imsg](#enabling-the-imsg-private-api) أدناه. يعمل إرسال/استقبال النصوص والوسائط الأساسي من دونه.

<Tip>
تُمنح الأذونات لكل سياق عملية. إذا كان Gateway يعمل بلا واجهة (LaunchAgent/SSH)، فشغّل أمرًا تفاعليًا لمرة واحدة في السياق نفسه لتشغيل المطالبات:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="فشل إرسال مغلّف SSH مع AppleEvents -1743">
  يمكن لإعداد SSH بعيد قراءة المحادثات، واجتياز `channels status --probe`، ومعالجة الرسائل الواردة بينما تستمر عمليات الإرسال الصادرة بالفشل مع خطأ تفويض AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

تحقق من قاعدة بيانات TCC لمستخدم Mac المسجّل الدخول أو System Settings > Privacy & Security > Automation. إذا كان إدخال Automation مسجلًا لـ `/usr/libexec/sshd-keygen-wrapper` بدل عملية `imsg` أو shell المحلية، فقد لا يعرض macOS مفتاح تبديل Messages قابلًا للاستخدام لعميل جانب خادم SSH هذا:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

في هذه الحالة، قد يستمر فشل تكرار `tccutil reset AppleEvents` أو إعادة تشغيل `imsg send` عبر مغلّف SSH نفسه لأن سياق العملية الذي يحتاج إلى Automation الخاص بـ Messages هو مغلّف SSH، وليس تطبيقًا يمكن للواجهة منحه الإذن.

استخدم أحد سياقات عملية `imsg` المدعومة بدلًا من ذلك:

- شغّل Gateway، أو على الأقل جسر `imsg`، في جلسة المستخدم المحلي المسجّل الدخول في Messages.
- ابدأ Gateway باستخدام LaunchAgent لذلك المستخدم بعد منح Full Disk Access وAutomation من الجلسة نفسها.
- إذا أبقيت بنية SSH ذات المستخدمين، فتحقق من نجاح إرسال `imsg send` صادر حقيقي عبر المغلّف نفسه قبل تفعيل القناة. إذا تعذر منحه Automation، فأعد الإعداد إلى إعداد `imsg` بمستخدم واحد بدل الاعتماد على مغلّف SSH للإرسال.

</Accordion>

## تفعيل API الخاص لـ imsg

يشحن `imsg` بوضعين تشغيليين:

- **الوضع الأساسي** (افتراضي، لا حاجة إلى تغييرات SIP): النصوص والوسائط الصادرة عبر `send`، ومراقبة/سجل الوارد، وقائمة المحادثات. هذا ما تحصل عليه مباشرة من تثبيت `brew install steipete/tap/imsg` جديد مع أذونات macOS القياسية أعلاه.
- **وضع API الخاص**: يحقن `imsg` مكتبة dylib مساعدة في `Messages.app` لاستدعاء دوال `IMCore` داخلية. هذا ما يفعّل `react` و`edit` و`unsend` و`reply` (المتسلسل)، و`sendWithEffect`، و`poll` و`poll-vote` (استطلاعات Messages الأصلية)، و`renameGroup`، و`setGroupIcon`، و`addParticipant`، و`removeParticipant`، و`leaveGroup`، بالإضافة إلى مؤشرات الكتابة وإيصالات القراءة.

للوصول إلى سطح الإجراءات المتقدمة الذي توثقه صفحة القناة هذه، تحتاج إلى وضع API الخاص. يوضح README الخاص بـ `imsg` المتطلب صراحةً:

> الميزات المتقدمة مثل `read` و`typing` و`launch` والإرسال الغني المدعوم بالجسر وتعديل الرسائل وإدارة المحادثات اختيارية. تتطلب تعطيل SIP وحقن مكتبة dylib مساعدة في `Messages.app`. يرفض `imsg launch` الحقن عند تفعيل SIP.

تستخدم تقنية حقن المساعد مكتبة dylib الخاصة بـ `imsg` للوصول إلى واجهات API الخاصة في Messages. لا يوجد خادم تابع لجهة خارجية أو وقت تشغيل BlueBubbles في مسار OpenClaw iMessage.

<Warning>
**تعطيل SIP مفاضلة أمنية حقيقية.** SIP أحد وسائل الحماية الأساسية في macOS ضد تشغيل كود نظام معدّل؛ إيقافه على مستوى النظام يفتح سطح هجوم إضافيًا وآثارًا جانبية. وبشكل ملحوظ، **تعطيل SIP على أجهزة Apple Silicon Mac يعطّل أيضًا القدرة على تثبيت وتشغيل تطبيقات iOS على Mac**.

تعامل مع هذا كخيار تشغيلي مقصود، وليس افتراضيًا. إذا كان نموذج التهديد لديك لا يتحمل إيقاف SIP، فإن iMessage المضمّن يقتصر على الوضع الأساسي — إرسال/استقبال النصوص والوسائط فقط، بلا تفاعلات / تحرير / إلغاء إرسال / تأثيرات / عمليات مجموعات.
</Warning>

### الإعداد

1. **ثبّت (أو حدّث) `imsg`** على Mac الذي يشغّل Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   يعرض خرج `imsg status --json` القيم `bridge_version` و`rpc_methods` و`selectors` لكل طريقة حتى تتمكن من معرفة ما يدعمه البناء الحالي قبل البدء.

2. **عطّل System Integrity Protection، و(على macOS الحديث) Library Validation.** يتطلب حقن مكتبة dylib مساعدة غير تابعة لـ Apple داخل `Messages.app` الموقّع من Apple إيقاف SIP **و** تخفيف library validation. خطوة SIP في وضع Recovery خاصة بإصدار macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** عطّل Library Validation عبر Terminal، وأعد التشغيل إلى Recovery Mode، وشغّل `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+ (Big Sur والأحدث)، Intel:** Recovery Mode (أو Internet Recovery)، ثم `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+، Apple Silicon:** تسلسل بدء التشغيل بزر الطاقة للدخول إلى Recovery؛ في إصدارات macOS الحديثة اضغط باستمرار على مفتاح **Left Shift** عند النقر على Continue، ثم `csrutil disable`. تتبع إعدادات الآلات الافتراضية مسارًا منفصلًا، لذلك خذ لقطة VM أولًا.

   **في macOS 11 والأحدث، لا يكون `csrutil disable` وحده كافيًا عادةً.** لا تزال Apple تفرض library validation على `Messages.app` باعتباره ثنائيًا للنظام الأساسي، لذلك تُرفض مكتبة مساعدة موقعة adhoc (`Library Validation failed: ... platform binary, but mapped file is not`) حتى مع إيقاف SIP. بعد تعطيل SIP، عطّل library validation أيضًا وأعد التشغيل:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe)، تم التحقق على 26.5.1:** إيقاف SIP **مع** أمر `DisableLibraryValidation` أعلاه كافيان لحقن المساعد عبر 26.0 حتى 26.5.x. **لا حاجة إلى boot-args.** ملف plist هو العامل الحاسم والخطوة الأكثر شيوعًا التي تنقص عند فشل الحقن على Tahoe:
   - **مع plist:** يحقن `imsg launch` ويعرض `imsg status` القيمة `advanced_features: true`.
   - **من دون plist (حتى مع إيقاف SIP):** يفشل `imsg launch` بالرسالة `Failed to launch: Timeout waiting for Messages.app to initialize`. ترفض AMFI تحميل المساعد الموقّع adhoc، لذلك لا يصبح الجسر جاهزًا أبدًا وتنتهي عملية التشغيل بالمهلة. هذه المهلة هي العرض الأكثر شيوعًا على Tahoe، والإصلاح هو plist أعلاه، وليس أي إجراء أشد.

   تم تأكيد ذلك بمقارنة مضبوطة قبل/بعد على macOS 26.5.1 (Apple Silicon): مع plist، تُحمّل dylib داخل `Messages.app` ويعمل الجسر؛ أزل plist وأعد التشغيل، وسيُنتج `imsg launch` فشل المهلة أعلاه من دون تحميل dylib.

   إذا بدأ حقن `imsg launch` أو بدأت `selectors` معيّنة تُرجع false بعد ترقية macOS، فهذه البوابة هي السبب المعتاد. تحقّق من حالة SIP والتحقق من المكتبات قبل افتراض أن خطوة SIP نفسها فشلت. إذا كانت هذه الإعدادات صحيحة وما زال الجسر غير قادر على الحقن، فاجمع `imsg status --json` مع خرج `imsg launch` وأبلغ مشروع `imsg` بذلك بدلاً من إضعاف عناصر تحكم أمان إضافية على مستوى النظام.

   اتبع مسار Apple في وضع الاسترداد لجهاز Mac لديك لتعطيل SIP قبل تشغيل `imsg launch`.

3. **احقن المساعد.** مع تعطيل SIP وتسجيل الدخول إلى Messages.app:

   ```bash
   imsg launch
   ```

   يرفض `imsg launch` الحقن عندما يظل SIP مفعلاً، لذلك يعمل هذا أيضاً كتأكيد على نجاح الخطوة 2.

4. **تحقّق من الجسر من OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   يجب أن يُبلغ إدخال iMessage عن `works`، ويجب أن يُظهر `imsg status --json | jq '{rpc_methods, selectors}'` القدرات التي يتيحها بناء macOS لديك. يتطلب إنشاء الاستطلاعات `selectors.pollPayloadMessage`؛ ويتطلب التصويت كلاً من `selectors.pollVoteMessage` وطريقة RPC `poll.vote`. لا يعلن Plugin الخاص بـ OpenClaw إلا عن الإجراءات التي يدعمها الفحص المخزن مؤقتاً، بينما تبقى الذاكرة المؤقتة الفارغة متفائلة وتفحص عند أول إرسال.

إذا أبلغ `openclaw channels status --probe` أن القناة `works` لكن إجراءات معيّنة ترمي الخطأ "يتطلب iMessage `<action>` جسر واجهة برمجة التطبيقات الخاصة imsg" وقت الإرسال، فشغّل `imsg launch` مرة أخرى — يمكن أن يسقط المساعد (إعادة تشغيل Messages.app، تحديث نظام التشغيل، إلخ) وستستمر حالة `available: true` المخزنة مؤقتاً في الإعلان عن الإجراءات حتى يحدّث الفحص التالي الحالة.

### عندما لا يمكنك تعطيل SIP

إذا لم يكن تعطيل SIP مقبولاً لنموذج التهديد لديك:

- يعود `imsg` إلى الوضع الأساسي — النص + الوسائط + الاستقبال فقط.
- يظل Plugin الخاص بـ OpenClaw يعلن إرسال النص/الوسائط والمراقبة الواردة؛ لكنه يخفي فقط `react` و`edit` و`unsend` و`reply` و`sendWithEffect` وعمليات المجموعات من سطح الإجراءات (وفقاً لبوابة القدرة لكل طريقة).
- يمكنك تشغيل Mac منفصل غير Apple-Silicon (أو Mac مخصص للبوت) مع إيقاف SIP لعبء عمل iMessage، مع إبقاء SIP مفعلاً على أجهزتك الأساسية. راجع [مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)](#deployment-patterns) أدناه.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.imessage.dmPolicy` في الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    حقل قائمة السماح: `channels.imessage.allowFrom`.

    يجب أن تحدد إدخالات قائمة السماح المرسلين: المعرّفات أو مجموعات وصول المرسلين الثابتة (`accessGroup:<name>`). استخدم `channels.imessage.groupAllowFrom` لأهداف الدردشة مثل `chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`؛ واستخدم `channels.imessage.groups` لمفاتيح سجل `chat_id` الرقمية.

  </Tab>

  <Tab title="سياسة المجموعات + الإشارات">
    يتحكم `channels.imessage.groupPolicy` في التعامل مع المجموعات:

    - `allowlist` (الافتراضي عند التهيئة)
    - `open`
    - `disabled`

    قائمة سماح مرسلي المجموعات: `channels.imessage.groupAllowFrom`.

    يمكن لإدخالات `groupAllowFrom` أيضاً الإشارة إلى مجموعات وصول المرسلين الثابتة (`accessGroup:<name>`).

    الرجوع الاحتياطي في وقت التشغيل: إذا لم يتم تعيين `groupAllowFrom`، تستخدم فحوص مرسلي مجموعات iMessage `allowFrom`؛ عيّن `groupAllowFrom` عندما ينبغي أن يختلف قبول الرسائل المباشرة والمجموعات.
    ملاحظة وقت التشغيل: إذا كانت `channels.imessage` مفقودة تماماً، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيراً (حتى إذا كانت `channels.defaults.groupPolicy` معيّنة).

    <Warning>
    يحتوي توجيه المجموعات على بوابتي قائمة سماح تعملان تباعاً، ويجب أن تنجحا كلتاهما:

    1. **قائمة سماح المرسل / هدف الدردشة** (`channels.imessage.groupAllowFrom`) — المعرّف أو `chat_guid` أو `chat_identifier` أو `chat_id`.
    2. **سجل المجموعات** (`channels.imessage.groups`) — مع `groupPolicy: "allowlist"`، تتطلب هذه البوابة إما إدخال بدل `groups: { "*": { ... } }` (يضبط `allowAll = true`)، أو إدخالاً صريحاً لكل `chat_id` ضمن `groups`.

    إذا لم يكن لدى البوابة 2 أي شيء، تُسقط كل رسالة مجموعة. يصدر Plugin إشارتين بمستوى `warn` عند مستوى السجل الافتراضي:

    - مرة واحدة لكل حساب عند بدء التشغيل: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - مرة واحدة لكل `chat_id` في وقت التشغيل: `imessage: dropping group message from chat_id=<id> ...`

    تستمر الرسائل المباشرة في العمل لأنها تسلك مسار كود مختلفاً.

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

    إذا ظهرت أسطر `warn` هذه في سجل Gateway، فالبوابة 2 تُسقط الرسائل — أضف كتلة `groups`.
    </Warning>

    بوابة الإشارات للمجموعات:

    - لا يحتوي iMessage على بيانات وصفية أصلية للإشارات
    - يستخدم اكتشاف الإشارات أنماط regex (`agents.list[].groupChat.mentionPatterns`، مع الرجوع إلى `messages.groupChat.mentionPatterns`)
    - مع عدم وجود أنماط مهيأة، لا يمكن فرض بوابة الإشارات

    يمكن لأوامر التحكم من المرسلين المصرح لهم تجاوز بوابة الإشارات في المجموعات.

    `systemPrompt` لكل مجموعة:

    يقبل كل إدخال ضمن `channels.imessage.groups.*` سلسلة `systemPrompt` اختيارية. تُحقن القيمة في مطالبة النظام الخاصة بالوكيل في كل دورة تعالج رسالة في تلك المجموعة. تطابق آلية الحل حل المطالبة لكل مجموعة المستخدم بواسطة `channels.whatsapp.groups`:

    1. **مطالبة النظام الخاصة بالمجموعة** (`groups["<chat_id>"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة موجوداً في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفاً. إذا كان `systemPrompt` سلسلة فارغة (`""`) يُكبت البدل ولا تُطبق أي مطالبة نظام على تلك المجموعة.
    2. **مطالبة النظام البدل للمجموعة** (`groups["*"].systemPrompt`): تُستخدم عندما يكون إدخال المجموعة المحددة غائباً تماماً عن الخريطة، أو عندما يكون موجوداً لكنه لا يعرّف مفتاح `systemPrompt`.

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

  <Tab title="الجلسات والردود الحتمية">
    - تستخدم الرسائل المباشرة التوجيه المباشر؛ وتستخدم المجموعات توجيه المجموعات.
    - مع الإعداد الافتراضي `session.dmScope=main`، تندمج رسائل iMessage المباشرة في الجلسة الرئيسية للوكيل.
    - جلسات المجموعات معزولة (`agent:<agentId>:imessage:group:<chat_id>`).
    - تُوجّه الردود مرة أخرى إلى iMessage باستخدام بيانات تعريف القناة/الهدف الأصلية.

    سلوك يشبه سلاسل المجموعات:

    يمكن أن تصل بعض سلاسل iMessage متعددة المشاركين مع `is_group=false`.
    إذا كان ذلك `chat_id` مهيأً صراحة ضمن `channels.imessage.groups`، يتعامل OpenClaw معه كحركة مرور مجموعة (بوابة المجموعات + عزل جلسة المجموعة).

  </Tab>
</Tabs>

## ارتباطات محادثات ACP

يمكن أيضاً ربط دردشات iMessage القديمة بجلسات ACP.

تدفق سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو دردشة المجموعة المسموح بها.
- تُوجّه الرسائل المستقبلية في محادثة iMessage نفسها إلى جلسة ACP المنشأة.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

تُدعم الارتباطات الدائمة المهيأة عبر إدخالات `bindings[]` على المستوى الأعلى مع `type: "acp"` و`match.channel: "imessage"`.

يمكن أن يستخدم `match.peer.id`:

- معرّف رسالة مباشرة مطبّع مثل `+15555550123` أو `user@example.com`
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
    استخدم Apple ID مخصصاً ومستخدم macOS مخصصاً حتى تكون حركة مرور البوت معزولة عن ملف Messages الشخصي لديك.

    التدفق المعتاد:

    1. أنشئ/سجّل الدخول إلى مستخدم macOS مخصص.
    2. سجّل الدخول إلى Messages باستخدام Apple ID الخاص بالبوت في ذلك المستخدم.
    3. ثبّت `imsg` في ذلك المستخدم.
    4. أنشئ مغلف SSH حتى يتمكن OpenClaw من تشغيل `imsg` في سياق ذلك المستخدم.
    5. وجّه `channels.imessage.accounts.<id>.cliPath` و`.dbPath` إلى ملف تعريف ذلك المستخدم.

    قد يتطلب التشغيل الأول موافقات واجهة رسومية (الأتمتة + الوصول الكامل إلى القرص) في جلسة مستخدم البوت هذه.

  </Accordion>

  <Accordion title="Mac بعيد عبر Tailscale (مثال)">
    طوبولوجيا شائعة:

    - يعمل Gateway على Linux/VM
    - يعمل iMessage + `imsg` على Mac في tailnet لديك
    - يستخدم مغلف `cliPath` SSH لتشغيل `imsg`
    - يتيح `remoteHost` جلب مرفقات SCP

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
    تأكد من الوثوق بمفتاح المضيف أولاً (على سبيل المثال `ssh bot@mac-mini.tailnet-1234.ts.net`) حتى تتم تعبئة `known_hosts`.

  </Accordion>

  <Accordion title="نمط الحسابات المتعددة">
    يدعم iMessage التهيئة لكل حساب ضمن `channels.imessage.accounts`.

    يمكن لكل حساب تجاوز حقول مثل `cliPath` و`dbPath` و`allowFrom` و`groupPolicy` و`mediaMaxMb` وإعدادات السجل وقوائم السماح لجذور المرفقات.

  </Accordion>

  <Accordion title="سجل الرسائل المباشرة">
    عيّن `channels.imessage.dmHistoryLimit` لتهيئة جلسات الرسائل المباشرة الجديدة بسجل `imsg` حديث ومفكوك الترميز لتلك المحادثة. استخدم `channels.imessage.dms["<sender>"].historyLimit` لتجاوزات كل مرسل، بما في ذلك `0` لتعطيل السجل لمرسل.

    يُجلب سجل الرسائل المباشرة في iMessage عند الطلب من `imsg`. ترك `dmHistoryLimit` دون تعيين يعطل تهيئة سجل الرسائل المباشرة العامة، لكن قيمة موجبة لكل مرسل في `channels.imessage.dms["<sender>"].historyLimit` ما تزال تفعّل التهيئة لذلك المرسل.

  </Accordion>
</AccordionGroup>

## الوسائط والتقسيم وأهداف التسليم

<AccordionGroup>
  <Accordion title="المرفقات والوسائط">
    - استيعاب المرفقات الواردة **متوقف افتراضيًا** — اضبط `channels.imessage.includeAttachments: true` لتمرير الصور والمذكرات الصوتية والفيديو والمرفقات الأخرى إلى الوكيل. عند تعطيله، تُسقط رسائل iMessage التي تحتوي على مرفقات فقط قبل أن تصل إلى الوكيل وقد لا تنتج أي سطر سجل `Inbound message` إطلاقًا.
    - يمكن جلب مسارات المرفقات البعيدة عبر SCP عند تعيين `remoteHost`
    - يجب أن تطابق مسارات المرفقات الجذور المسموح بها:
      - `channels.imessage.attachmentRoots` (محلي)
      - `channels.imessage.remoteAttachmentRoots` (وضع SCP البعيد)
      - نمط الجذر الافتراضي: `/Users/*/Library/Messages/Attachments`
    - يستخدم SCP تحققًا صارمًا من مفتاح المضيف (`StrictHostKeyChecking=yes`)
    - يستخدم حجم الوسائط الصادرة `channels.imessage.mediaMaxMb` (الافتراضي 16 MB)

  </Accordion>

  <Accordion title="تقسيم الرسائل الصادرة">
    - حد تقسيم النص: `channels.imessage.textChunkLimit` (الافتراضي 4000)
    - وضع التقسيم: `channels.imessage.chunkMode`
      - `length` (الافتراضي)
      - `newline` (تقسيم يعطي الأولوية للفقرات)

  </Accordion>

  <Accordion title="تنسيقات العنونة">
    الأهداف الصريحة المفضلة:

    - `chat_id:123` (موصى به للتوجيه المستقر)
    - `chat_guid:...`
    - `chat_identifier:...`

    أهداف المعالجات مدعومة أيضًا:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## إجراءات API الخاصة

عند تشغيل `imsg launch` وإبلاغ `openclaw channels status --probe` عن `privateApi.available: true`، يمكن لأداة الرسائل استخدام إجراءات iMessage الأصلية بالإضافة إلى عمليات إرسال النص العادية.

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
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="الإجراءات المتاحة">
    - **react**: إضافة/إزالة tapbacks في iMessage (`messageId`، `emoji`، `remove`). تُطابق tapbacks المدعومة الحب، والإعجاب، وعدم الإعجاب، والضحك، والتأكيد، والسؤال.
    - **reply**: إرسال رد ضمن سلسلة إلى رسالة موجودة (`messageId`، `text` أو `message`، بالإضافة إلى `chatGuid` أو `chatId` أو `chatIdentifier` أو `to`).
    - **sendWithEffect**: إرسال نص مع تأثير iMessage (`text` أو `message`، `effect` أو `effectId`).
    - **edit**: تعديل رسالة مرسلة على إصدارات macOS/API الخاصة المدعومة (`messageId`، `text` أو `newText`).
    - **unsend**: سحب رسالة مرسلة على إصدارات macOS/API الخاصة المدعومة (`messageId`).
    - **upload-file**: إرسال وسائط/ملفات (`buffer` بترميز base64 أو `media`/`path`/`filePath` محمّل، و`filename`، و`asVoice` اختياري). الاسم البديل القديم: `sendAttachment`.
    - **renameGroup** و**setGroupIcon** و**addParticipant** و**removeParticipant** و**leaveGroup**: إدارة محادثات المجموعات عندما يكون الهدف الحالي محادثة مجموعة.
    - **poll**: إنشاء استطلاع أصلي في Apple Messages (`pollQuestion`، وتكرار `pollOption` من 2 إلى 12 مرة، بالإضافة إلى `chatGuid` أو `chatId` أو `chatIdentifier` أو `to`). يراه المستلمون على iOS/iPadOS/macOS 26+ ويصوتون عليه أصليًا؛ وتحصل إصدارات نظام التشغيل الأقدم على بديل نصي "Sent a poll". يتطلب `selectors.pollPayloadMessage`.
    - **poll-vote**: التصويت على استطلاع موجود (`pollId` أو `messageId`، بالإضافة إلى واحد فقط من `pollOptionIndex` أو `pollOptionId` أو `pollOptionText`). يتطلب `selectors.pollVoteMessage` وطريقة RPC ‏`poll.vote`.

    تُعرض الاستطلاعات الواردة المقبولة للوكيل مع السؤال، وتسميات الخيارات المرقمة، وعدد الأصوات، ومعرّف رسالة الاستطلاع المطلوب بواسطة `poll-vote`.

  </Accordion>

  <Accordion title="معرّفات الرسائل">
    يتضمن سياق iMessage الوارد قيم `MessageSid` قصيرة ومعرّفات GUID كاملة للرسائل عند توفرها. تقتصر المعرّفات القصيرة على ذاكرة التخزين المؤقت للردود الحديثة المدعومة بـ SQLite ويُتحقق منها مقابل المحادثة الحالية قبل الاستخدام. إذا انتهت صلاحية معرّف قصير أو كان تابعًا لمحادثة أخرى، فأعد المحاولة باستخدام `MessageSidFull` الكامل.

  </Accordion>

  <Accordion title="اكتشاف القدرات">
    يخفي OpenClaw إجراءات API الخاصة فقط عندما تفيد حالة الفحص المخزنة مؤقتًا بأن الجسر غير متاح. إذا كانت الحالة غير معروفة، تظل الإجراءات مرئية وتُرسل الفحوصات بتكاسل بحيث يمكن أن ينجح الإجراء الأول بعد `imsg launch` دون تحديث يدوي منفصل للحالة.

  </Accordion>

  <Accordion title="إيصالات القراءة والكتابة">
    عندما يكون جسر API الخاصة قيد التشغيل، تُعلّم المحادثات الواردة المقبولة كمقروءة وتعرض المحادثات المباشرة فقاعة كتابة بمجرد قبول الدور، بينما يحضّر الوكيل السياق ويولّد. عطّل تعليم القراءة باستخدام:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    ستعطل إصدارات `imsg` الأقدم التي تسبق قائمة القدرات لكل طريقة الكتابة/القراءة بصمت؛ ويسجل OpenClaw تحذيرًا لمرة واحدة لكل إعادة تشغيل بحيث يمكن عزو الإيصال المفقود.

  </Accordion>

  <Accordion title="tapbacks الواردة">
    يشترك OpenClaw في tapbacks الخاصة بـ iMessage ويوجه التفاعلات المقبولة كأحداث نظام بدلًا من نص رسالة عادي، لذلك لا يؤدي tapback من المستخدم إلى تشغيل حلقة رد عادية.

    يتحكم `channels.imessage.reactionNotifications` في وضع الإشعارات:

    - `"own"` (الافتراضي): الإخطار فقط عندما يتفاعل المستخدمون مع رسائل كتبها البوت.
    - `"all"`: الإخطار لكل tapbacks الواردة من المرسلين المصرح لهم.
    - `"off"`: تجاهل tapbacks الواردة.

    تستخدم التجاوزات لكل حساب `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="تفاعلات الموافقة (👍 / 👎)">
    عندما يكون `approvals.exec.enabled` أو `approvals.plugin.enabled` صحيحًا ويوجه الطلب إلى iMessage، يسلّم Gateway مطالبة موافقة أصليًا ويقبل tapback لحلها:

    - `👍` (Like tapback) → `allow-once`
    - `👎` (Dislike tapback) → `deny`
    - يظل `allow-always` بديلًا يدويًا: أرسل `/approve <id> allow-always` كرد عادي.

    تتطلب معالجة التفاعل أن يكون معالج المستخدم المتفاعل موافقًا صريحًا. تُقرأ قائمة الموافقين من `channels.imessage.allowFrom` (أو `channels.imessage.accounts.<id>.allowFrom`)؛ أضف رقم هاتف المستخدم بصيغة E.164 أو بريد Apple ID الإلكتروني الخاص به. يُحترم الإدخال البدل `"*"` لكنه يسمح لأي مرسل بالموافقة. يتجاوز اختصار التفاعل عمدًا `reactionNotifications` و`dmPolicy` و`groupAllowFrom` لأن قائمة السماح للموافقين الصريحين هي البوابة الوحيدة المهمة لحل الموافقة.

    **تغيير السلوك في هذا الإصدار:** عندما يكون `channels.imessage.allowFrom` غير فارغ، يصبح أمر النص `/approve <id> <decision>` مخولًا مقابل قائمة الموافقين تلك (وليس قائمة السماح الأوسع للرسائل المباشرة). سيتلقى المرسلون المسموح لهم في قائمة سماح الرسائل المباشرة وغير الموجودين في `allowFrom` رفضًا صريحًا. أضف كل مشغّل ينبغي أن يتمكن من الموافقة عبر `/approve` (وعبر التفاعلات) إلى `allowFrom` للحفاظ على السلوك السابق. عندما تكون `allowFrom` فارغة، يبقى "بديل نفس المحادثة" القديم ساريًا ويستمر `/approve` في تخويل أي شخص تسمح به قائمة سماح الرسائل المباشرة.

    ملاحظات المشغل:
    - يُخزّن ربط التفاعل في الذاكرة (مع TTL مطابق لانتهاء صلاحية الموافقة) وفي مخزن Gateway الدائم ذي المفاتيح، لذلك لا يزال tapback الذي يصل بعد وقت قصير من إعادة تشغيل Gateway يحل الموافقة.
    - يتم تجاهل tapbacks عبر الأجهزة التي تكون `is_from_me=true` (تفاعل المشغل نفسه على جهاز Apple مقترن) عمدًا حتى لا يتمكن البوت من الموافقة لنفسه.
    - لا يمكن لـ tapbacks النصية القديمة (`Liked "…"` كنص عادي من عملاء Apple قدامى جدًا) حل الموافقات لأنها لا تحمل GUID للرسالة؛ يتطلب حل التفاعل بيانات tapback الوصفية المنظمة التي يصدرها عملاء macOS / iOS الحاليون.

  </Accordion>
</AccordionGroup>

## عمليات كتابة الإعدادات

يسمح iMessage افتراضيًا بعمليات كتابة الإعدادات التي تبدأها القناة (لـ `/config set|unset` عندما يكون `commands.config: true`).

التعطيل:

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

## دمج الرسائل المباشرة ذات الإرسال المقسم (أمر + URL في إنشاء واحد)

عندما يكتب المستخدم أمرًا وURL معًا — مثل `Dump https://example.com/article` — يقسم تطبيق Messages من Apple الإرسال إلى **صفّين منفصلين في `chat.db`**:

1. رسالة نصية (`"Dump"`).
2. بالون معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

يصل الصفان إلى OpenClaw بفاصل يقارب 0.8-2.0 ثانية في معظم الإعدادات. بدون الدمج، يتلقى الوكيل الأمر وحده في الدور 1، ويرد (غالبًا "أرسل لي URL")، ولا يرى URL إلا في الدور 2 — وعندها يكون سياق الأمر قد فُقد بالفعل. هذا مسار إرسال Apple، وليس شيئًا يضيفه OpenClaw أو `imsg`.

يختار `channels.imessage.coalesceSameSenderDms` إدخال الرسالة المباشرة في تخزين مؤقت للصفوف المتتالية من نفس المرسل. عندما يكشف `imsg` علامة معاينة URL البنيوية `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` في أحد الصفوف المصدرية، يدمج OpenClaw ذلك الإرسال المقسم الحقيقي فقط ويحافظ على أي صفوف مخزنة مؤقتًا أخرى كأدوار منفصلة. في إصدارات `imsg` الأقدم التي لا تصدر أي بيانات وصفية للبالون إطلاقًا، لا يستطيع OpenClaw تمييز الإرسال المقسم عن الإرسالات المنفصلة، لذلك يعود إلى دمج الحاوية. يحافظ ذلك على سلوك ما قبل البيانات الوصفية بدلًا من التراجع عن إرسالات `Dump <url>` المقسمة إلى دورين. تستمر محادثات المجموعات في الإرسال لكل رسالة للحفاظ على بنية الأدوار متعددة المستخدمين.

<Tabs>
  <Tab title="متى تفعّل">
    فعّل عندما:

    - تشحن Skills تتوقع `command + payload` في رسالة واحدة (dump، paste، save، queue، وما إلى ذلك).
    - يلصق المستخدمون لديك URLs إلى جانب الأوامر.
    - يمكنك قبول زمن انتقال الدور الإضافي للرسائل المباشرة (انظر أدناه).

    اتركه معطلًا عندما:

    - تحتاج إلى أقل زمن انتقال للأوامر لمحفزات الرسائل المباشرة ذات الكلمة الواحدة.
    - تكون كل تدفقاتك أوامر لمرة واحدة بدون متابعات للحمولة.

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

    عند تفعيل العلامة وعدم وجود `messages.inbound.byChannel.imessage` صريح أو `messages.inbound.debounceMs` عام، تتسع نافذة إزالة الارتداد إلى **7000 ms** (الافتراضي القديم هو 0 ms — بلا إزالة ارتداد). النافذة الأوسع مطلوبة لأن إيقاع إرسال معاينة URL المقسم في Apple قد يمتد إلى عدة ثوان بينما يصدر Messages.app صف المعاينة.

    لضبط النافذة بنفسك:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="المفاضلات">
    - **يتطلب الدمج الدقيق بيانات وصفية حالية لحمولة `imsg`.** عندما يتضمن صف URL قيمة `balloon_bundle_id`، لا يُدمج إلا ذلك الإرسال المقسّم الحقيقي، وتبقى الصفوف المخزنة مؤقتًا الأخرى منفصلة. في إصدارات `imsg` الأقدم التي لا تعرض أي بيانات وصفية للفقاعة، يعود OpenClaw إلى دمج الحاوية المخزنة مؤقتًا حتى لا تتراجع عمليات الإرسال المقسّم مثل `Dump <url>` إلى دورتين (توافق مؤقت مع الإصدارات السابقة، يُزال بمجرد أن يدمج `imsg` عمليات الإرسال المقسّم في المصدر).
    - **زمن استجابة إضافي لرسائل DM.** عند تفعيل العلم، تنتظر كل رسالة DM (بما في ذلك أوامر التحكم المستقلة والمتابعات النصية المفردة) حتى نافذة إزالة الارتداد قبل الإرسال، لاحتمال وصول صف معاينة URL. تحتفظ رسائل محادثات المجموعات بالإرسال الفوري.
    - **المخرجات المدمجة محدودة.** يُحد النص المدمج عند 4000 حرف مع علامة `…[truncated]` صريحة؛ وتُحد المرفقات عند 20؛ وتُحد إدخالات المصدر عند 10 (مع الاحتفاظ بالأول والأحدث بعد ذلك). يُتتبع كل GUID مصدر في `coalescedMessageGuids` للقياسات اللاحقة.
    - **DM فقط.** تمر محادثات المجموعات إلى الإرسال لكل رسالة حتى يبقى البوت سريع الاستجابة عندما يكتب عدة أشخاص.
    - **اختياري، لكل قناة.** لا تتأثر القنوات الأخرى (Telegram، WhatsApp، Slack، …). يجب على إعدادات BlueBubbles القديمة التي تعين `channels.bluebubbles.coalesceSameSenderDms` ترحيل تلك القيمة إلى `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

يعرض عمود "العلم مفعل" السلوك على إصدار `imsg` يصدر `balloon_bundle_id`. في إصدارات `imsg` الأقدم التي لا تصدر أي بيانات وصفية للفقاعة إطلاقًا، تعود الصفوف أدناه الموسومة "دورتان" / "N دورات" بدلًا من ذلك إلى دمج قديم (دورة واحدة): لا يستطيع OpenClaw تمييز الإرسال المقسّم بنيويًا عن عمليات الإرسال المنفصلة، لذلك يحافظ على الدمج السابق للبيانات الوصفية. ينشط الفصل الدقيق بمجرد أن يصدر الإصدار بيانات وصفية للفقاعة.

| ما يؤلفه المستخدم                                                 | ما ينتجه `chat.db`                  | العلم معطل (الافتراضي)                  | العلم مفعل + النافذة (`imsg` يصدر بيانات وصفية للفقاعة)                                             |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                            | صفان بفاصل ~1 ثانية                 | دورتا وكيل: "Dump" وحدها، ثم URL        | دورة واحدة: نص مدمج `Dump https://example.com`                                                      |
| `Save this 📎image.jpg caption` (مرفق + نص)                        | صفان بلا بيانات وصفية لفقاعة URL    | دورتان                                  | دورتان بعد رصد البيانات الوصفية؛ دورة مدمجة واحدة في الجلسات القديمة/قبل التثبيت الخالية من البيانات الوصفية |
| `/status` (أمر مستقل)                                              | صف واحد                             | إرسال فوري                              | **انتظار حتى النافذة، ثم الإرسال**                                                                  |
| لصق URL وحده                                                       | صف واحد                             | إرسال فوري                              | انتظار حتى النافذة، ثم الإرسال                                                                     |
| نص + URL مرسلان كرسالتين منفصلتين عمدًا، بفارق دقائق              | صفان خارج النافذة                   | دورتان                                  | دورتان (تنتهي النافذة بينهما)                                                                      |
| تدفق سريع (>10 رسائل DM صغيرة داخل النافذة)                       | N صفوف بلا بيانات وصفية لفقاعة URL  | N دورات                                 | N دورات بعد رصد البيانات الوصفية؛ دورة مدمجة محدودة واحدة في الجلسات القديمة/قبل التثبيت الخالية من البيانات الوصفية |
| شخصان يكتبان في محادثة مجموعة                                      | N صفوف من M مرسلين                  | M+ دورات (واحدة لكل حاوية مرسل)         | M+ دورات — لا تُدمج محادثات المجموعات                                                              |

## استرداد الوارد بعد إعادة تشغيل الجسر أو Gateway

يسترد iMessage الرسائل الفائتة أثناء تعطل Gateway، وفي الوقت نفسه يكبح "قنبلة السجل المتراكم" القديمة التي يمكن أن يفرغها Apple بعد استرداد Push. السلوك الافتراضي مفعل دائمًا، ومبني على إزالة تكرار الوارد.

- **إزالة تكرار إعادة التشغيل.** تُسجل كل رسالة واردة مُرسلة بواسطة Apple GUID الخاص بها في حالة Plugin الدائمة (`imessage.inbound-dedupe`)، وتُحجز عند الإدخال وتُثبت بعد المعالجة (وتُحرر عند فشل عابر حتى يمكن إعادة المحاولة). يُسقط أي شيء عولج مسبقًا بدلًا من إرساله مرتين. هذا ما يسمح لإعادة الاسترداد بأن تكون عدوانية بلا تتبع لكل رسالة.
- **استرداد وقت التعطل.** عند بدء التشغيل، يتذكر المراقب آخر `chat.db` rowid مُرسل (مؤشر مستمر لكل حساب) ويمرره إلى `imsg watch.subscribe` باسم `since_rowid`، بحيث يعيد imsg تشغيل الصفوف التي وصلت أثناء تعطل Gateway، ثم يتابع المباشر. إعادة التشغيل محدودة بأحدث الصفوف وبالرسائل التي يصل عمرها إلى ~ساعتين، وتُسقط إزالة التكرار أي شيء عولج مسبقًا.
- **سياج عمر السجل المتراكم القديم.** الصفوف فوق حد بدء التشغيل مباشرة بالفعل؛ أما الصف الذي يكون تاريخ إرساله أقدم من وصوله بأكثر من ~15 دقيقة فهو سجل Push المتراكم المفرغ ويُكبح. تستخدم الصفوف المعاد تشغيلها (عند الحد أو دونه) نافذة الاسترداد الأوسع بدلًا من ذلك، بحيث تُسلّم الرسالة الفائتة مؤخرًا بينما لا يُسلّم التاريخ القديم.

يعمل الاسترداد عبر إعدادات `cliPath` المحلية والبعيدة، لأن إعادة تشغيل `since_rowid` تعمل عبر اتصال RPC نفسه الخاص بـ `imsg`. الفرق هو النافذة: عندما يستطيع Gateway قراءة `chat.db` (محليًا)، فإنه يثبت حد rowid عند بدء التشغيل، ويحد نطاق إعادة التشغيل، ويسلم الرسائل الفائتة حتى عمر ساعتين تقريبًا. عبر `cliPath` بعيد باستخدام SSH، لا يمكنه قراءة قاعدة البيانات، لذلك تكون إعادة التشغيل غير محدودة ويستخدم كل صف سياج العمر المباشر — ما يزال يسترد الرسائل الفائتة مؤخرًا ويكبح السجل المتراكم القديم، لكن ضمن النافذة المباشرة الأضيق. شغّل Gateway على جهاز Mac الخاص بـ Messages للحصول على نافذة الاسترداد الأوسع.

### إشارة مرئية للمشغل

يُسجل السجل المتراكم المكبوح عند المستوى الافتراضي، ولا يُسقط بصمت أبدًا (يبين علم `recovery` أي نافذة طُبقت):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### الترحيل

تم إهمال `channels.imessage.catchup.*` — أصبح استرداد وقت التعطل تلقائيًا الآن ولا يحتاج إلى إعدادات للتثبيتات الجديدة. تظل الإعدادات الحالية التي تحتوي على `catchup.enabled: true` محترمة كملف توافق لنافذة إعادة تشغيل الاسترداد. أُحيلت كتل catchup المعطلة (`enabled: false` أو بلا `enabled: true`) إلى التقاعد؛ يزيلها `openclaw doctor --fix`.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم يُعثر على imsg أو RPC غير مدعوم">
    تحقق من الملف الثنائي ودعم RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    إذا أفاد الفحص بأن RPC غير مدعوم، فحدّث `imsg`. إذا كانت إجراءات API الخاصة غير متاحة، فشغّل `imsg launch` في جلسة مستخدم macOS المسجل دخوله وافحص مرة أخرى. إذا لم يكن Gateway يعمل على macOS، فاستخدم إعداد Remote Mac عبر SSH أعلاه بدلًا من مسار `imsg` المحلي الافتراضي.

  </Accordion>

  <Accordion title="تُرسل Messages لكن رسائل iMessage الواردة لا تصل">
    أثبت أولًا ما إذا كانت الرسالة وصلت إلى جهاز Mac المحلي. إذا لم يتغير `chat.db`، فلا يستطيع OpenClaw تلقي الرسالة حتى عندما يبلغ `imsg status --json` عن جسر سليم.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    إذا لم تُنشئ الرسائل المرسلة من الهاتف صفوفًا جديدة، فأصلح طبقة macOS Messages وApple Push قبل تغيير إعدادات OpenClaw. غالبًا ما يكون تحديث خدمة لمرة واحدة كافيًا:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    أرسل iMessage جديدة من الهاتف وتأكد من وجود صف `chat.db` جديد أو حدث `imsg watch` قبل تصحيح جلسات OpenClaw. لا تشغّل هذا كحلقة دورية لإعادة إطلاق الجسر؛ يمكن أن تؤدي عمليات `imsg launch` المتكررة مع إعادة تشغيل Gateway أثناء العمل النشط إلى مقاطعة عمليات التسليم وترك تشغيلات القناة قيد التنفيذ عالقة.

  </Accordion>

  <Accordion title="Gateway لا يعمل على macOS">
    يجب أن يعمل `cliPath: "imsg"` الافتراضي على جهاز Mac المسجل دخوله إلى Messages. على Linux أو Windows، عيّن `channels.imessage.cliPath` إلى سكربت غلاف يستخدم SSH إلى ذلك الـ Mac ويشغل `imsg "$@"`.

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

    تأكد من منح Full Disk Access + Automation لسياق العملية الذي يشغّل OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## مؤشرات مرجع الإعدادات

- [مرجع الإعدادات - iMessage](/ar/gateway/config-channels#imessage)
- [إعدادات Gateway](/ar/gateway/configuration)
- [الاقتران](/ar/channels/pairing)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [إزالة BlueBubbles ومسار imsg iMessage](/ar/announcements/bluebubbles-imessage) — الإعلان وملخص الترحيل
- [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles) — جدول ترجمة الإعدادات والتحويل خطوة بخطوة
- [الاقتران](/ar/channels/pairing) — مصادقة DM وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك محادثات المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
