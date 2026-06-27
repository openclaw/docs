---
read_when:
    - إعداد دعم iMessage
    - تصحيح أخطاء إرسال/استقبال iMessage
summary: دعم iMessage الأصلي عبر imsg (JSON-RPC عبر stdio)، مع إجراءات API خاصة للردود، وردود النقر، والتأثيرات، والمرفقات، وإدارة المجموعات. مفضّل لإعدادات OpenClaw iMessage الجديدة عندما تكون متطلبات المضيف مناسبة.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
لنشرات OpenClaw iMessage، استخدم `imsg` على مضيف macOS Messages تم تسجيل الدخول إليه. إذا كان Gateway يعمل على Linux أو Windows، فوجّه `channels.imessage.cliPath` إلى مغلّف SSH يشغّل `imsg` على جهاز Mac.

**استرداد الوارد تلقائي.** بعد إعادة تشغيل الجسر أو Gateway، يعيد iMessage تشغيل الرسائل التي فاتت أثناء تعطله ويمنع "قنبلة التراكم" القديمة التي قد تفرغها Apple بعد استرداد Push، مع إزالة التكرار حتى لا يُرسَل أي شيء مرتين. لا يوجد إعداد لتفعيله — راجع [استرداد الوارد بعد إعادة تشغيل جسر أو Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
تمت إزالة دعم BlueBubbles. رحّل إعدادات `channels.bluebubbles` إلى `channels.imessage`؛ يدعم OpenClaw iMessage عبر `imsg` فقط. ابدأ بـ [إزالة BlueBubbles ومسار imsg iMessage](/ar/announcements/bluebubbles-imessage) للإعلان المختصر، أو [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles) لجدول الترحيل الكامل.
</Warning>

الحالة: تكامل CLI خارجي أصلي. يشغّل Gateway الأمر `imsg rpc` ويتواصل عبر JSON-RPC على stdio (من دون خادم أو منفذ منفصل). تتطلب الإجراءات المتقدمة `imsg launch` ونجاح فحص API خاص.

<CardGroup cols={3}>
  <Card title="إجراءات API الخاصة" icon="wand-sparkles" href="#private-api-actions">
    الردود، والتفاعلات، والمؤثرات، والمرفقات، وإدارة المجموعات.
  </Card>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    الرسائل المباشرة في iMessage تستخدم وضع الإقران افتراضيًا.
  </Card>
  <Card title="Mac بعيد" icon="terminal" href="#remote-mac-over-ssh">
    استخدم مغلّف SSH عندما لا يعمل Gateway على جهاز Mac الخاص بـ Messages.
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

      <Step title="تشغيل Gateway">

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
    لا يتطلب OpenClaw إلا `cliPath` متوافقًا مع stdio، لذا يمكنك توجيه `cliPath` إلى سكربت مغلّف يتصل عبر SSH بجهاز Mac بعيد ويشغّل `imsg`.

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

    إذا لم يتم تعيين `remoteHost`، يحاول OpenClaw اكتشافه تلقائيًا عبر تحليل سكربت مغلّف SSH.
    يجب أن يكون `remoteHost` على هيئة `host` أو `user@host` (من دون مسافات أو خيارات SSH).
    يستخدم OpenClaw تحققًا صارمًا من مفتاح المضيف لـ SCP، لذلك يجب أن يكون مفتاح مضيف الترحيل موجودًا مسبقًا في `~/.ssh/known_hosts`.
    تُتحقق مسارات المرفقات مقابل الجذور المسموح بها (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
أي مغلّف `cliPath` أو وكيل SSH تضعه أمام `imsg` يجب أن يتصرف كأنبوب stdio شفاف لـ JSON-RPC طويل العمر. يتبادل OpenClaw رسائل JSON-RPC صغيرة مؤطرة بأسطر جديدة عبر stdin/stdout الخاصين بالمغلّف طوال عمر القناة:

- مرّر كل جزء/سطر من stdin **بمجرد توفر البايتات** — لا تنتظر EOF.
- مرّر كل جزء/سطر من stdout فورًا في الاتجاه المعاكس.
- حافظ على الأسطر الجديدة.
- تجنب القراءات الحاجبة ذات الحجم الثابت (`read(4096)`, `cat | buffer`, default shell `read`) التي قد تحرم الإطارات الصغيرة.
- أبقِ stderr منفصلًا عن تدفق stdout الخاص بـ JSON-RPC.

المغلّف الذي يخزّن stdin مؤقتًا حتى يمتلئ حظر كبير سينتج أعراضًا تبدو كانقطاع في iMessage — `imsg rpc timeout (chats.list)` أو إعادة تشغيل القناة مرارًا — رغم أن `imsg rpc` نفسه سليم. إن `ssh -T host imsg "$@"` (أعلاه) آمن لأنه يمرّر وسائط `cliPath` الخاصة بـ OpenClaw مثل `rpc` و`--db`. أما خطوط الأنابيب مثل `ssh host imsg | grep -v '^DEBUG'` فليست آمنة — قد تظل الأدوات المخزنة سطريًا تحتجز الإطارات؛ استخدم `stdbuf -oL -eL` في كل مرحلة إذا كان لا بد من التصفية.
</Warning>

  </Tab>
</Tabs>

## المتطلبات والأذونات (macOS)

- يجب تسجيل الدخول إلى Messages على جهاز Mac الذي يشغّل `imsg`.
- يلزم منح Full Disk Access لسياق العملية الذي يشغّل OpenClaw/`imsg` (للوصول إلى قاعدة بيانات Messages).
- يلزم إذن Automation لإرسال الرسائل عبر Messages.app.
- للإجراءات المتقدمة (التفاعل / التحرير / إلغاء الإرسال / الرد المتسلسل / المؤثرات / عمليات المجموعات)، يجب تعطيل System Integrity Protection — راجع [تفعيل API الخاص في imsg](#enabling-the-imsg-private-api) أدناه. يعمل إرسال/استقبال النصوص والوسائط الأساسي من دونه.

<Tip>
تُمنح الأذونات لكل سياق عملية. إذا كان Gateway يعمل بلا واجهة (LaunchAgent/SSH)، شغّل أمرًا تفاعليًا لمرة واحدة في السياق نفسه لتفعيل المطالبات:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="فشل الإرسال عبر مغلّف SSH مع AppleEvents -1743">
  يمكن لإعداد SSH بعيد قراءة المحادثات، واجتياز `channels status --probe`، ومعالجة الرسائل الواردة بينما يستمر فشل الإرسال الصادر بخطأ تفويض AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

تحقق من قاعدة بيانات TCC لمستخدم Mac المسجل الدخول أو System Settings > Privacy & Security > Automation. إذا كان إدخال Automation مسجلًا لـ `/usr/libexec/sshd-keygen-wrapper` بدل عملية `imsg` أو الصدفة المحلية، فقد لا يعرض macOS مفتاح تبديل Messages صالحًا لذلك العميل على جانب خادم SSH:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

في هذه الحالة، قد يستمر فشل تكرار `tccutil reset AppleEvents` أو إعادة تشغيل `imsg send` عبر مغلّف SSH نفسه لأن سياق العملية الذي يحتاج Automation لـ Messages هو مغلّف SSH، وليس تطبيقًا يمكن للواجهة منحه الإذن.

استخدم أحد سياقات عملية `imsg` المدعومة بدلًا من ذلك:

- شغّل Gateway، أو على الأقل جسر `imsg`، في جلسة المستخدم المحلية المسجل الدخول إلى Messages.
- ابدأ Gateway باستخدام LaunchAgent لذلك المستخدم بعد منح Full Disk Access وAutomation من الجلسة نفسها.
- إذا أبقيت طوبولوجيا SSH بمستخدمين اثنين، فتحقق من نجاح إرسال `imsg send` صادر حقيقي عبر المغلّف نفسه بالضبط قبل تفعيل القناة. إذا تعذر منح Automation، فأعد الإعداد إلى إعداد `imsg` بمستخدم واحد بدل الاعتماد على مغلّف SSH للإرسال.

</Accordion>

## تفعيل API الخاص في imsg

يعمل `imsg` بوضعين تشغيليين:

- **الوضع الأساسي** (افتراضي، لا حاجة لتغييرات SIP): النصوص والوسائط الصادرة عبر `send`، ومراقبة/سجل الوارد، وقائمة المحادثات. هذا ما تحصل عليه مباشرة بعد `brew install steipete/tap/imsg` جديد مع أذونات macOS القياسية أعلاه.
- **وضع API الخاص**: يحقن `imsg` مكتبة dylib مساعدة في `Messages.app` لاستدعاء دوال `IMCore` الداخلية. هذا ما يفتح `react` و`edit` و`unsend` و`reply` (متسلسل) و`sendWithEffect` و`renameGroup` و`setGroupIcon` و`addParticipant` و`removeParticipant` و`leaveGroup`، إضافة إلى مؤشرات الكتابة وإيصالات القراءة.

للوصول إلى سطح الإجراءات المتقدمة الذي توثقه صفحة القناة هذه، تحتاج إلى وضع API الخاص. يوضح README الخاص بـ `imsg` المتطلب صراحةً:

> الميزات المتقدمة مثل `read` و`typing` و`launch` والإرسال الغني المدعوم بالجسر وتعديل الرسائل وإدارة المحادثات اختيارية. تتطلب تعطيل SIP وحقن مكتبة dylib مساعدة في `Messages.app`. يرفض `imsg launch` الحقن عندما يكون SIP مفعّلًا.

تستخدم تقنية حقن المساعد مكتبة dylib الخاصة بـ `imsg` للوصول إلى APIs الخاصة في Messages. لا يوجد خادم طرف ثالث أو تشغيل BlueBubbles في مسار OpenClaw iMessage.

<Warning>
**تعطيل SIP مفاضلة أمنية حقيقية.** SIP هو أحد وسائل الحماية الأساسية في macOS ضد تشغيل كود نظام معدل؛ وتعطيله على مستوى النظام يفتح سطح هجوم إضافيًا وآثارًا جانبية. وعلى وجه الخصوص، **تعطيل SIP على أجهزة Apple Silicon Mac يعطّل أيضًا القدرة على تثبيت وتشغيل تطبيقات iOS على جهاز Mac**.

تعامل مع هذا كخيار تشغيلي مقصود، وليس كإعداد افتراضي. إذا كان نموذج التهديد لديك لا يتحمل إيقاف SIP، فإن iMessage المضمّن يقتصر على الوضع الأساسي — إرسال/استقبال النصوص والوسائط فقط، بلا تفاعلات / تحرير / إلغاء إرسال / مؤثرات / عمليات مجموعات.
</Warning>

### الإعداد

1. **ثبّت (أو رقّ) `imsg`** على جهاز Mac الذي يشغّل Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   يبلّغ خرج `imsg status --json` عن `bridge_version` و`rpc_methods` و`selectors` لكل طريقة حتى تتمكن من رؤية ما يدعمه البناء الحالي قبل البدء.

2. **عطّل System Integrity Protection، و(على macOS الحديث) Library Validation.** يتطلب حقن مكتبة dylib مساعدة غير تابعة لـ Apple في `Messages.app` الموقّع من Apple إيقاف SIP **و** تخفيف Library Validation. خطوة SIP في وضع Recovery خاصة بإصدار macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** عطّل Library Validation عبر Terminal، وأعد التشغيل إلى Recovery Mode، وشغّل `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+ (Big Sur والإصدارات اللاحقة)، Intel:** Recovery Mode (أو Internet Recovery)، ثم `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+، Apple Silicon:** تسلسل بدء التشغيل بزر الطاقة للدخول إلى Recovery؛ في إصدارات macOS الحديثة اضغط باستمرار على مفتاح **Left Shift** عند النقر على Continue، ثم `csrutil disable`. تتبع إعدادات الأجهزة الافتراضية مسارًا منفصلًا، لذا خذ لقطة VM أولًا.

   **على macOS 11 والإصدارات اللاحقة، لا يكون `csrutil disable` وحده كافيًا عادةً.** لا تزال Apple تفرض Library Validation على `Messages.app` باعتباره ملفًا ثنائيًا للمنصة، لذلك يُرفض المساعد الموقّع adhoc (`Library Validation failed: ... platform binary, but mapped file is not`) حتى مع إيقاف SIP. بعد تعطيل SIP، عطّل أيضًا Library Validation وأعد التشغيل:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe)، تم التحقق على 26.5.1:** إيقاف SIP **مع** أمر `DisableLibraryValidation` أعلاه يكفي لحقن المساعد عبر 26.0 حتى 26.5.x. **لا يلزم أي boot-args.** ملف plist هو العامل الحاسم والخطوة الناقصة الأكثر شيوعًا عند فشل الحقن على Tahoe:
   - **مع plist:** يحقن `imsg launch` ويبلّغ `imsg status` عن `advanced_features: true`.
   - **من دون plist (حتى مع إيقاف SIP):** يفشل `imsg launch` مع `Failed to launch: Timeout waiting for Messages.app to initialize`. يرفض AMFI المساعد الموقّع adhoc عند التحميل، لذلك لا يصبح الجسر جاهزًا مطلقًا وتنتهي عملية التشغيل بالمهلة. هذه المهلة هي العرض الذي يصادفه معظم الأشخاص على Tahoe، والحل هو ملف plist أعلاه، لا أي إجراء أكثر حدة.

   تم تأكيد ذلك باختبار مضبوط قبل/بعد على macOS 26.5.1 (Apple Silicon): مع ملف plist، تُعيّن مكتبة dylib داخل `Messages.app` ويعمل الجسر؛ أزل ملف plist وأعد التشغيل، وينتج `imsg launch` فشل المهلة أعلاه مع عدم تعيين مكتبة dylib.

   إذا بدأت عملية حقن `imsg launch` أو `selectors` محددة تعيد false بعد ترقية macOS، فعادة ما تكون هذه البوابة هي السبب. تحقق من حالة SIP والتحقق من صحة المكتبة لديك قبل افتراض أن خطوة SIP نفسها فشلت. إذا كانت هذه الإعدادات صحيحة وما زال الجسر غير قادر على الحقن، فاجمع `imsg status --json` مع مخرجات `imsg launch` وأبلغ مشروع `imsg` بها بدلا من إضعاف عناصر تحكم أمان إضافية على مستوى النظام.

   اتبع مسار وضع الاسترداد من Apple الخاص بجهاز Mac لديك لتعطيل SIP قبل تشغيل `imsg launch`.

3. **احقن المساعد.** بعد تعطيل SIP وتسجيل الدخول إلى Messages.app:

   ```bash
   imsg launch
   ```

   يرفض `imsg launch` الحقن عندما يكون SIP ما زال مفعلا، لذلك يعمل هذا أيضا كتأكيد على نجاح الخطوة 2.

4. **تحقق من الجسر من OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   يجب أن يبلغ إدخال iMessage عن `works`، ويجب أن يعرض `imsg status --json | jq '.selectors'` القيمة `retractMessagePart: true` بالإضافة إلى أي محددات تحرير / كتابة / قراءة يكشفها إصدار macOS لديك. لا يعلن Plugin الخاص بـ OpenClaw، عبر بوابة كل طريقة في `actions.ts`، إلا عن الإجراءات التي يكون المحدد الأساسي لها `true`، لذلك يعكس سطح الإجراءات الذي تراه في قائمة أدوات الوكيل ما يستطيع الجسر فعله فعليا على هذا المضيف.

إذا أبلغ `openclaw channels status --probe` أن القناة `works` لكن إجراءات محددة تطرح "iMessage `<action>` requires the imsg private API bridge" وقت الإرسال، فشغل `imsg launch` مرة أخرى — يمكن أن يخرج المساعد من الخدمة (إعادة تشغيل Messages.app، تحديث نظام التشغيل، وما إلى ذلك) وستستمر حالة `available: true` المخزنة مؤقتا في الإعلان عن الإجراءات حتى يحدّث الفحص التالي الحالة.

### عندما لا يمكنك تعطيل SIP

إذا لم يكن تعطيل SIP مقبولا لنموذج التهديد لديك:

- يعود `imsg` إلى الوضع الأساسي — النص + الوسائط + الاستقبال فقط.
- يستمر Plugin الخاص بـ OpenClaw في الإعلان عن إرسال النص/الوسائط والمراقبة الواردة؛ لكنه يخفي `react` و`edit` و`unsend` و`reply` و`sendWithEffect` وعمليات المجموعات من سطح الإجراءات (وفقا لبوابة الإمكانات لكل طريقة).
- يمكنك تشغيل Mac منفصل غير Apple-Silicon (أو Mac مخصص للبوت) مع إيقاف SIP لحمل عمل iMessage، مع إبقاء SIP مفعلا على أجهزتك الأساسية. راجع [مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)](#deployment-patterns) أدناه.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="DM policy">
    يتحكم `channels.imessage.dmPolicy` في الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    حقل قائمة السماح: `channels.imessage.allowFrom`.

    يجب أن تحدد إدخالات قائمة السماح المرسلين: المعالجات أو مجموعات وصول المرسل الثابتة (`accessGroup:<name>`). استخدم `channels.imessage.groupAllowFrom` لأهداف الدردشة مثل `chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`؛ واستخدم `channels.imessage.groups` لمفاتيح سجل `chat_id` الرقمية.

  </Tab>

  <Tab title="Group policy + mentions">
    يتحكم `channels.imessage.groupPolicy` في التعامل مع المجموعات:

    - `allowlist` (الافتراضي عند تكوينه)
    - `open`
    - `disabled`

    قائمة السماح لمرسلي المجموعة: `channels.imessage.groupAllowFrom`.

    يمكن لإدخالات `groupAllowFrom` أيضا الإشارة إلى مجموعات وصول المرسل الثابتة (`accessGroup:<name>`).

    الرجوع الاحتياطي وقت التشغيل: إذا لم يتم تعيين `groupAllowFrom`، تستخدم فحوصات مرسلي مجموعات iMessage قيمة `allowFrom`؛ عيّن `groupAllowFrom` عندما يجب أن يختلف قبول الرسائل المباشرة عن قبول المجموعات.
    ملاحظة وقت التشغيل: إذا كان `channels.imessage` مفقودا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرا (حتى إذا كان `channels.defaults.groupPolicy` معينا).

    <Warning>
    يحتوي توجيه المجموعات على بوابتي قائمة سماح **اثنتين** تعملان تباعا، ويجب أن تنجح كلتاهما:

    1. **قائمة سماح المرسل / هدف الدردشة** (`channels.imessage.groupAllowFrom`) — المعالج أو `chat_guid` أو `chat_identifier` أو `chat_id`.
    2. **سجل المجموعة** (`channels.imessage.groups`) — مع `groupPolicy: "allowlist"`، تتطلب هذه البوابة إما إدخال بدل `groups: { "*": { ... } }` (يضبط `allowAll = true`)، أو إدخالا صريحا لكل `chat_id` تحت `groups`.

    إذا لم تكن البوابة 2 تحتوي على أي شيء، فسيتم إسقاط كل رسالة مجموعة. يصدر Plugin إشارتين بمستوى `warn` عند مستوى السجل الافتراضي:

    - مرة واحدة لكل حساب عند بدء التشغيل: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - مرة واحدة لكل `chat_id` وقت التشغيل: `imessage: dropping group message from chat_id=<id> ...`

    تستمر الرسائل المباشرة في العمل لأنها تستخدم مسار كود مختلفا.

    الحد الأدنى من الإعداد لإبقاء المجموعات تتدفق ضمن `groupPolicy: "allowlist"`:

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

    إذا ظهرت أسطر `warn` هذه في سجل Gateway، فإن البوابة 2 تسقط الرسائل — أضف كتلة `groups`.
    </Warning>

    بوابة الإشارات للمجموعات:

    - لا يحتوي iMessage على بيانات وصفية أصلية للإشارات
    - يستخدم اكتشاف الإشارات أنماط regex (`agents.list[].groupChat.mentionPatterns`، والرجوع الاحتياطي `messages.groupChat.mentionPatterns`)
    - من دون أنماط مكوّنة، لا يمكن فرض بوابة الإشارات

    يمكن لأوامر التحكم من المرسلين المصرح لهم تجاوز بوابة الإشارات في المجموعات.

    `systemPrompt` لكل مجموعة:

    يقبل كل إدخال تحت `channels.imessage.groups.*` سلسلة `systemPrompt` اختيارية. يتم حقن القيمة في موجه نظام الوكيل في كل دورة تعالج رسالة في تلك المجموعة. يعكس الحل طريقة حل الموجه لكل مجموعة المستخدمة بواسطة `channels.whatsapp.groups`:

    1. **موجه نظام خاص بالمجموعة** (`groups["<chat_id>"].systemPrompt`): يستخدم عندما يكون إدخال المجموعة المحددة موجودا في الخريطة **و** يكون مفتاح `systemPrompt` الخاص به معرّفا. إذا كانت `systemPrompt` سلسلة فارغة (`""`) فسيتم منع البدل ولن يطبق أي موجه نظام على تلك المجموعة.
    2. **موجه نظام بدل للمجموعات** (`groups["*"].systemPrompt`): يستخدم عندما يكون إدخال المجموعة المحددة غير موجود في الخريطة بالكامل، أو عندما يكون موجودا لكنه لا يعرّف مفتاح `systemPrompt`.

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

    لا تنطبق الموجهات لكل مجموعة إلا على رسائل المجموعات — ولا تتأثر الرسائل المباشرة في هذه القناة.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - تستخدم الرسائل المباشرة التوجيه المباشر؛ وتستخدم المجموعات توجيه المجموعات.
    - مع الإعداد الافتراضي `session.dmScope=main`، تندمج رسائل iMessage المباشرة في جلسة الوكيل الرئيسية.
    - جلسات المجموعات معزولة (`agent:<agentId>:imessage:group:<chat_id>`).
    - تعود الردود إلى iMessage باستخدام بيانات وصفية للقناة/الهدف الأصلي.

    سلوك سلاسل المحادثات الشبيهة بالمجموعات:

    يمكن أن تصل بعض سلاسل iMessage متعددة المشاركين مع `is_group=false`.
    إذا كان ذلك `chat_id` مكوّنا صراحة تحت `channels.imessage.groups`، يعامله OpenClaw كحركة مرور مجموعة (بوابة المجموعة + عزل جلسة المجموعة).

  </Tab>
</Tabs>

## ربط محادثات ACP

يمكن أيضا ربط دردشات iMessage القديمة بجلسات ACP.

تدفق المشغل السريع:

- شغل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو دردشة المجموعة المسموح بها.
- يتم توجيه الرسائل المستقبلية في محادثة iMessage نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

تدعم الارتباطات المستمرة المكوّنة من خلال إدخالات `bindings[]` العلوية مع `type: "acp"` و`match.channel: "imessage"`.

يمكن أن يستخدم `match.peer.id`:

- معالج رسالة مباشرة مطبّعا مثل `+15555550123` أو `user@example.com`
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

راجع [وكلاء ACP](/ar/tools/acp-agents) لمعرفة سلوك ربط ACP المشترك.

## أنماط النشر

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    استخدم Apple ID ومستخدم macOS مخصصين بحيث تكون حركة مرور البوت معزولة عن ملف Messages الشخصي لديك.

    التدفق المعتاد:

    1. أنشئ/سجل الدخول إلى مستخدم macOS مخصص.
    2. سجل الدخول إلى Messages باستخدام Apple ID الخاص بالبوت في ذلك المستخدم.
    3. ثبّت `imsg` في ذلك المستخدم.
    4. أنشئ مغلف SSH حتى يتمكن OpenClaw من تشغيل `imsg` في سياق ذلك المستخدم.
    5. وجّه `channels.imessage.accounts.<id>.cliPath` و`.dbPath` إلى ملف ذلك المستخدم.

    قد يتطلب التشغيل الأول موافقات واجهة رسومية (Automation + Full Disk Access) في جلسة مستخدم البوت تلك.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    البنية الشائعة:

    - يعمل Gateway على Linux/VM
    - يعمل iMessage + `imsg` على Mac في tailnet لديك
    - يستخدم مغلف `cliPath` SSH لتشغيل `imsg`
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
    تأكد أولا من الوثوق بمفتاح المضيف (على سبيل المثال `ssh bot@mac-mini.tailnet-1234.ts.net`) حتى تتم تعبئة `known_hosts`.

  </Accordion>

  <Accordion title="Multi-account pattern">
    يدعم iMessage إعدادات لكل حساب تحت `channels.imessage.accounts`.

    يمكن لكل حساب تجاوز حقول مثل `cliPath` و`dbPath` و`allowFrom` و`groupPolicy` و`mediaMaxMb` وإعدادات السجل وقوائم السماح لجذر المرفقات.

  </Accordion>

  <Accordion title="Direct-message history">
    عيّن `channels.imessage.dmHistoryLimit` لتهيئة جلسات الرسائل المباشرة الجديدة بسجل `imsg` حديث مفكوك الترميز لتلك المحادثة. استخدم `channels.imessage.dms["<sender>"].historyLimit` للتجاوزات لكل مرسل، بما في ذلك `0` لتعطيل السجل لمرسل.

    يتم جلب سجل رسائل iMessage المباشرة عند الطلب من `imsg`. ترك `dmHistoryLimit` غير معيّن يعطل تهيئة سجل الرسائل المباشرة العالمي، لكن قيمة موجبة لكل مرسل في `channels.imessage.dms["<sender>"].historyLimit` ما زالت تفعّل التهيئة لذلك المرسل.

  </Accordion>
</AccordionGroup>

## الوسائط والتقسيم وأهداف التسليم

<AccordionGroup>
  <Accordion title="المرفقات والوسائط">
    - استيعاب المرفقات الواردة **متوقف افتراضيًا** — اضبط `channels.imessage.includeAttachments: true` لتمرير الصور والمذكرات الصوتية والفيديو والمرفقات الأخرى إلى الوكيل. عند تعطيله، تُسقط رسائل iMessage التي تحتوي على مرفقات فقط قبل أن تصل إلى الوكيل وقد لا تُنتج أي سطر سجل `Inbound message` على الإطلاق.
    - يمكن جلب مسارات المرفقات البعيدة عبر SCP عند ضبط `remoteHost`
    - يجب أن تطابق مسارات المرفقات الجذور المسموح بها:
      - `channels.imessage.attachmentRoots` (محلي)
      - `channels.imessage.remoteAttachmentRoots` (وضع SCP البعيد)
      - نمط الجذر الافتراضي: `/Users/*/Library/Messages/Attachments`
    - يستخدم SCP تحققًا صارمًا من مفتاح المضيف (`StrictHostKeyChecking=yes`)
    - يستخدم حجم الوسائط الصادرة `channels.imessage.mediaMaxMb` (الافتراضي 16 MB)

  </Accordion>

  <Accordion title="تجزئة الرسائل الصادرة">
    - حد تجزئة النص: `channels.imessage.textChunkLimit` (الافتراضي 4000)
    - وضع التجزئة: `channels.imessage.chunkMode`
      - `length` (الافتراضي)
      - `newline` (تقسيم يبدأ بالفقرات)

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

عندما يكون `imsg launch` قيد التشغيل ويبلغ `openclaw channels status --probe` عن `privateApi.available: true`، يمكن لأداة الرسائل استخدام إجراءات iMessage الأصلية بالإضافة إلى إرسال النصوص العادية.

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
    - **react**: إضافة/إزالة ردود Tapback في iMessage (`messageId`، `emoji`، `remove`). تُطابق ردود Tapback المدعومة الحب، والإعجاب، وعدم الإعجاب، والضحك، والتأكيد، والسؤال.
    - **reply**: إرسال رد مترابط على رسالة موجودة (`messageId`، `text` أو `message`، بالإضافة إلى `chatGuid` أو `chatId` أو `chatIdentifier` أو `to`).
    - **sendWithEffect**: إرسال نص مع تأثير iMessage (`text` أو `message`، `effect` أو `effectId`).
    - **edit**: تعديل رسالة مُرسلة على إصدارات macOS/API الخاصة المدعومة (`messageId`، `text` أو `newText`).
    - **unsend**: سحب رسالة مُرسلة على إصدارات macOS/API الخاصة المدعومة (`messageId`).
    - **upload-file**: إرسال وسائط/ملفات (`buffer` بصيغة base64 أو `media`/`path`/`filePath` مُحضّر، `filename`، و`asVoice` اختياري). الاسم المستعار القديم: `sendAttachment`.
    - **renameGroup**، **setGroupIcon**، **addParticipant**، **removeParticipant**، **leaveGroup**: إدارة محادثات المجموعات عندما يكون الهدف الحالي محادثة جماعية.

  </Accordion>

  <Accordion title="معرّفات الرسائل">
    يتضمن سياق iMessage الوارد قيم `MessageSid` القصيرة ومعرّفات GUID الكاملة للرسائل عند توفرها. تُحصر المعرّفات القصيرة في ذاكرة التخزين المؤقت الحديثة للردود المدعومة بـ SQLite، ويُتحقق منها مقابل المحادثة الحالية قبل الاستخدام. إذا انتهت صلاحية معرّف قصير أو كان ينتمي إلى محادثة أخرى، فأعد المحاولة باستخدام `MessageSidFull` الكامل.

  </Accordion>

  <Accordion title="اكتشاف القدرات">
    يخفي OpenClaw إجراءات API الخاصة فقط عندما تشير حالة الفحص المخزنة مؤقتًا إلى أن الجسر غير متاح. إذا كانت الحالة غير معروفة، تظل الإجراءات مرئية وتُشغّل فحوصات الإرسال بتكاسل بحيث يمكن لأول إجراء أن ينجح بعد `imsg launch` دون تحديث حالة يدوي منفصل.

  </Accordion>

  <Accordion title="إيصالات القراءة والكتابة">
    عندما يكون جسر API الخاصة متاحًا، تُعلَّم المحادثات الواردة المقبولة كمقروءة وتعرض المحادثات المباشرة فقاعة كتابة بمجرد قبول الدور، بينما يجهّز الوكيل السياق ويولّد الرد. عطّل تعليم القراءة باستخدام:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    ستعطّل إصدارات `imsg` الأقدم، التي تسبق قائمة القدرات لكل طريقة، الكتابة/القراءة بصمت؛ يسجل OpenClaw تحذيرًا لمرة واحدة لكل إعادة تشغيل بحيث يمكن عزو الإيصال المفقود.

  </Accordion>

  <Accordion title="ردود Tapback الواردة">
    يشترك OpenClaw في ردود Tapback الخاصة بـ iMessage ويوجه التفاعلات المقبولة كأحداث نظام بدلًا من نص رسائل عادي، لذلك لا يؤدي رد Tapback من المستخدم إلى تشغيل حلقة رد عادية.

    يتحكم `channels.imessage.reactionNotifications` في وضع الإشعارات:

    - `"own"` (الافتراضي): الإشعار فقط عندما يتفاعل المستخدمون مع رسائل كتبها البوت.
    - `"all"`: الإشعار بكل ردود Tapback الواردة من المرسلين المصرح لهم.
    - `"off"`: تجاهل ردود Tapback الواردة.

    تستخدم التجاوزات لكل حساب `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="تفاعلات الموافقة (👍 / 👎)">
    عندما يكون `approvals.exec.enabled` أو `approvals.plugin.enabled` صحيحًا ويُوجَّه الطلب إلى iMessage، يسلّم Gateway مطالبة موافقة بشكل أصلي ويقبل رد Tapback لحلها:

    - `👍` (رد Tapback إعجاب) → `allow-once`
    - `👎` (رد Tapback عدم إعجاب) → `deny`
    - يظل `allow-always` بديلًا يدويًا: أرسل `/approve <id> allow-always` كرد عادي.

    تتطلب معالجة التفاعل أن يكون معرّف المستخدم المتفاعل مُعتمِدًا صريحًا. تُقرأ قائمة المعتمدين من `channels.imessage.allowFrom` (أو `channels.imessage.accounts.<id>.allowFrom`)؛ أضف رقم هاتف المستخدم بصيغة E.164 أو بريد Apple ID الخاص به. يُحترم إدخال البدل `"*"` لكنه يسمح لأي مرسل بالموافقة. يتجاوز اختصار التفاعل عمدًا `reactionNotifications` و`dmPolicy` و`groupAllowFrom` لأن قائمة السماح للمعتمدين الصريحين هي البوابة الوحيدة المهمة لحل الموافقة.

    **تغيير السلوك في هذا الإصدار:** عندما تكون `channels.imessage.allowFrom` غير فارغة، يُصرّح الآن لأمر النص `/approve <id> <decision>` وفقًا لقائمة المعتمدين تلك (وليس قائمة السماح الأوسع للرسائل المباشرة). سيتلقى المرسلون المسموح لهم في قائمة سماح الرسائل المباشرة لكن غير الموجودين في `allowFrom` رفضًا صريحًا. أضف كل مشغّل يجب أن يتمكن من الموافقة عبر `/approve` (وعبر التفاعلات) إلى `allowFrom` للحفاظ على السلوك السابق. عندما تكون `allowFrom` فارغة، يظل "بديل نفس المحادثة" القديم ساريًا ويواصل `/approve` التصريح لأي شخص تسمح له قائمة سماح الرسائل المباشرة.

    ملاحظات المشغّل:
    - يُخزن ربط التفاعل في الذاكرة (مع TTL مطابق لانتهاء صلاحية الموافقة) وفي المخزن الدائم ذي المفاتيح الخاص بـ Gateway، لذلك يظل رد Tapback الذي يصل بعد وقت قصير من إعادة تشغيل Gateway قادرًا على حل الموافقة.
    - تُتجاهل عمدًا ردود Tapback عبر الأجهزة ذات `is_from_me=true` (تفاعل المشغّل نفسه على جهاز Apple مقترن) حتى لا يتمكن البوت من الموافقة لنفسه.
    - لا يمكن لردود Tapback النصية القديمة (`Liked "…"` كنص عادي من عملاء Apple قدامى جدًا) حل الموافقات لأنها لا تحمل GUID للرسالة؛ يتطلب حل التفاعل بيانات Tapback الوصفية المهيكلة التي تُصدرها عملاء macOS / iOS الحالية.

  </Accordion>
</AccordionGroup>

## عمليات كتابة الإعدادات

يسمح iMessage افتراضيًا بعمليات كتابة الإعدادات التي تبدأها القناة (لـ `/config set|unset` عندما تكون `commands.config: true`).

للتعطيل:

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

## دمج الرسائل المباشرة المقسمة عند الإرسال (أمر + URL في تركيب واحد)

عندما يكتب مستخدم أمرًا وURL معًا — مثل `Dump https://example.com/article` — يقسم تطبيق Messages من Apple الإرسال إلى **صفين منفصلين في `chat.db`**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة URL (`"https://..."`) مع صور معاينة OG كمرفقات.

يصل الصفان إلى OpenClaw بفارق يقارب 0.8-2.0 ثانية في معظم الإعدادات. بدون الدمج، يتلقى الوكيل الأمر وحده في الدور 1، ويرد (غالبًا "أرسل لي URL")، ولا يرى URL إلا في الدور 2 — وعندها يكون سياق الأمر قد فُقد بالفعل. هذا جزء من مسار الإرسال في Apple، وليس شيئًا يضيفه OpenClaw أو `imsg`.

يُدخل `channels.imessage.coalesceSameSenderDms` الرسالة المباشرة في تخزين مؤقت للصفوف المتتالية من نفس المرسل. عندما يكشف `imsg` علامة معاينة URL البنيوية `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` في أحد صفوف المصدر، يدمج OpenClaw فقط هذا الإرسال المقسّم الحقيقي ويبقي أي صفوف أخرى مخزنة مؤقتًا كأدوار منفصلة. في إصدارات `imsg` الأقدم التي لا تصدر أي بيانات وصفية للفقاعة على الإطلاق، لا يستطيع OpenClaw تمييز الإرسال المقسّم من عمليات الإرسال المنفصلة، لذلك يعود إلى دمج الحاوية. يحافظ ذلك على السلوك السابق للبيانات الوصفية بدلًا من التسبب في تراجع إرسال `Dump <url>` المقسّم إلى دورين. تستمر محادثات المجموعات في الإرسال لكل رسالة حتى تُحفظ بنية الأدوار متعددة المستخدمين.

<Tabs>
  <Tab title="متى تفعّله">
    فعّله عندما:

    - تشحن Skills تتوقع `command + payload` في رسالة واحدة (dump، paste، save، queue، وما إلى ذلك).
    - يلصق مستخدموك عناوين URL إلى جانب الأوامر.
    - يمكنك قبول زيادة زمن انتقال دور الرسالة المباشرة (انظر أدناه).

    اتركه معطلًا عندما:

    - تحتاج إلى أقل زمن انتقال للأوامر لمحفزات الرسائل المباشرة ذات الكلمة الواحدة.
    - تكون كل تدفقاتك أوامر لمرة واحدة بدون متابعات حمولة.

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

    مع تفعيل العلم وبدون `messages.inbound.byChannel.imessage` صريح أو `messages.inbound.debounceMs` عام، تتسع نافذة إزالة الارتداد إلى **7000 ms** (الافتراضي القديم هو 0 ms — بلا إزالة ارتداد). النافذة الأوسع مطلوبة لأن وتيرة الإرسال المقسّم لمعاينة URL في Apple قد تمتد إلى عدة ثوانٍ بينما يصدر Messages.app صف المعاينة.

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
    - **يتطلب الدمج الدقيق بيانات وصفية حالية من حمولة `imsg`.** عندما يتضمن صف URL قيمة `balloon_bundle_id`، يُدمج فقط ذلك الإرسال المقسّم الحقيقي وتبقى الصفوف الأخرى المخزنة مؤقتًا منفصلة. في إصدارات `imsg` الأقدم التي لا تعرض أي بيانات وصفية للفقاعة، يعود OpenClaw إلى دمج الحاوية المخزنة مؤقتًا حتى لا تتراجع عمليات الإرسال المقسّم `Dump <url>` إلى دورين (توافق مؤقت مع الإصدارات السابقة، يُزال بمجرد أن يدمج `imsg` عمليات الإرسال المقسّم في المنبع).
    - **زمن انتقال إضافي لرسائل DM.** مع تفعيل العلم، تنتظر كل رسالة DM (بما في ذلك أوامر التحكم المستقلة والمتابعات النصية المفردة) حتى نافذة إزالة الارتداد قبل الإرسال، تحسبًا لقدوم صف معاينة URL. تحتفظ رسائل المحادثات الجماعية بالإرسال الفوري.
    - **الإخراج المدمج محدود.** يُحد النص المدمج عند 4000 حرف مع علامة `…[truncated]` صريحة؛ وتُحد المرفقات عند 20؛ وتُحد إدخالات المصدر عند 10 (مع الاحتفاظ بالأول والأحدث بعد ذلك). يُتتبع كل GUID مصدر في `coalescedMessageGuids` لقياسات التتبع اللاحقة.
    - **للرسائل المباشرة فقط.** تمر محادثات المجموعات إلى الإرسال لكل رسالة حتى يبقى البوت سريع الاستجابة عندما يكتب عدة أشخاص.
    - **اختياري، لكل قناة.** لا تتأثر القنوات الأخرى (Telegram، WhatsApp، Slack، …). يجب على إعدادات BlueBubbles القديمة التي تضبط `channels.bluebubbles.coalesceSameSenderDms` نقل تلك القيمة إلى `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

يعرض عمود "العلم مفعّل" السلوك في إصدار `imsg` يصدر `balloon_bundle_id`. في إصدارات `imsg` الأقدم التي لا تصدر أي بيانات تعريفية للبالون إطلاقًا، تعود الصفوف أدناه الموسومة "دورتان" / "N دورات" بدلًا من ذلك إلى الدمج القديم (دورة واحدة): لا يستطيع OpenClaw التمييز بنيويًا بين إرسال مقسّم وإرسالات منفصلة، لذلك يحافظ على دمج ما قبل البيانات التعريفية. يبدأ الفصل الدقيق بمجرد أن يصدر الإصدار بيانات البالون التعريفية.

| ما يؤلفه المستخدم                                                  | ما ينتجه `chat.db`                  | العلم معطّل (افتراضيًا)                | العلم مفعّل + نافذة (يصدر imsg بيانات البالون التعريفية)                                            |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                            | صفان بفاصل ~1 ثانية                 | دورتا وكيل: "Dump" وحدها، ثم URL       | دورة واحدة: نص مدمج `Dump https://example.com`                                                      |
| `Save this 📎image.jpg caption` (مرفق + نص)                        | صفان من دون بيانات تعريفية لبالون URL | دورتان                                 | دورتان بعد رصد البيانات التعريفية؛ دورة مدمجة واحدة في الجلسات القديمة/ما قبل التثبيت بلا بيانات تعريفية |
| `/status` (أمر مستقل)                                             | صف واحد                             | إرسال فوري                              | **انتظار حتى انتهاء النافذة، ثم الإرسال**                                                           |
| URL ملصوق وحده                                                     | صف واحد                             | إرسال فوري                              | انتظار حتى انتهاء النافذة، ثم الإرسال                                                              |
| نص + URL أُرسلا كرسالتين منفصلتين عمدًا، بفاصل دقائق              | صفان خارج النافذة                   | دورتان                                 | دورتان (تنتهي النافذة بينهما)                                                                       |
| سيل سريع (>10 رسائل DM صغيرة داخل النافذة)                        | N صفوف من دون بيانات تعريفية لبالون URL | N دورات                                | N دورات بعد رصد البيانات التعريفية؛ دورة مدمجة محدودة واحدة في الجلسات القديمة/ما قبل التثبيت بلا بيانات تعريفية |
| شخصان يكتبان في دردشة جماعية                                      | N صفوف من M مرسلين                 | M+ دورات (واحدة لكل حاوية مرسل)        | M+ دورات — لا تُدمج الدردشات الجماعية                                                               |

## الاسترداد الوارد بعد إعادة تشغيل جسر أو Gateway

يسترد iMessage الرسائل الفائتة أثناء تعطل Gateway، وفي الوقت نفسه يكبت "قنبلة السجل المتراكم" القديمة التي يمكن أن تفرغها Apple بعد استرداد Push. السلوك الافتراضي مفعّل دائمًا، ومبني على إزالة تكرار الوارد.

- **إزالة تكرار إعادة التشغيل.** تُسجّل كل رسالة واردة مُرسلة بواسطة Apple GUID الخاص بها في حالة Plugin الدائمة (`imessage.inbound-dedupe`)، وتُحجز عند الإدخال وتُثبّت بعد المعالجة (وتُحرر عند فشل عابر لكي يمكن إعادة المحاولة). يُسقط أي شيء عولج بالفعل بدل إرساله مرتين. هذا ما يتيح للاسترداد إعادة التشغيل بقوة من دون مسك دفاتر لكل رسالة.
- **استرداد فترة التعطل.** عند بدء التشغيل، يتذكر المراقب آخر `chat.db` rowid مُرسل (مؤشر دائم لكل حساب) ويمرره إلى `imsg watch.subscribe` باسم `since_rowid`، لكي يعيد imsg تشغيل الصفوف التي وصلت أثناء تعطل Gateway، ثم يتابع المباشر. تقتصر إعادة التشغيل على أحدث الصفوف وعلى الرسائل التي لا يزيد عمرها عن ~2 ساعتين، وتُسقط إزالة التكرار أي شيء عولج بالفعل.
- **حاجز عمر السجل المتراكم القديم.** الصفوف فوق حد بدء التشغيل مباشرة حقيقية؛ أما الصف الذي يكون تاريخ إرساله أقدم من وصوله بأكثر من ~15 دقيقة فهو سجل متراكم من تفريغ Push ويُكبت. تستخدم الصفوف المعاد تشغيلها (عند الحد أو دونه) نافذة الاسترداد الأوسع بدلًا من ذلك، لذلك تُسلّم الرسالة الفائتة حديثًا بينما لا يُسلّم التاريخ القديم جدًا.

يعمل الاسترداد عبر إعدادات `cliPath` المحلية والبعيدة، لأن إعادة تشغيل `since_rowid` تعمل عبر اتصال RPC نفسه الخاص بـ `imsg`. الفرق هو النافذة: عندما يستطيع Gateway قراءة `chat.db` (محليًا)، يثبت حد rowid عند بدء التشغيل، ويحدّ مدى إعادة التشغيل، ويسلم الرسائل الفائتة حتى عمر بضع ساعات. عبر `cliPath` بعيد باستخدام SSH لا يستطيع قراءة قاعدة البيانات، لذلك تكون إعادة التشغيل غير محدودة ويستخدم كل صف حاجز العمر المباشر — ما زال يسترد الرسائل الفائتة حديثًا وما زال يكبت السجل المتراكم القديم، لكن بنافذة مباشرة أضيق. شغّل Gateway على جهاز Mac الخاص بالرسائل للحصول على نافذة الاسترداد الأوسع.

### إشارة مرئية للمشغل

يُسجّل السجل المتراكم المكبوت على المستوى الافتراضي، ولا يُسقط بصمت أبدًا (يعرض علم `recovery` أي نافذة طُبقت):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### الترحيل

`channels.imessage.catchup.*` مهمل — أصبح استرداد فترة التعطل تلقائيًا الآن ولا يحتاج إلى إعدادات في الإعدادات الجديدة. تظل الإعدادات الحالية التي تحتوي على `catchup.enabled: true` محترمة كملف توافق لنافذة إعادة تشغيل الاسترداد. كتل catchup المعطلة (`enabled: false` أو عدم وجود `enabled: true`) متقاعدة؛ يزيلها `openclaw doctor --fix`.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم يُعثر على imsg أو RPC غير مدعوم">
    تحقق من الملف الثنائي ودعم RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    إذا أفاد الفحص بأن RPC غير مدعوم، فحدّث `imsg`. إذا كانت إجراءات API الخاصة غير متاحة، فشغّل `imsg launch` في جلسة مستخدم macOS المسجل دخوله وافحص مرة أخرى. إذا لم يكن Gateway يعمل على macOS، فاستخدم إعداد Mac البعيد عبر SSH أعلاه بدل مسار `imsg` المحلي الافتراضي.

  </Accordion>

  <Accordion title="تُرسل الرسائل لكن iMessages الواردة لا تصل">
    أثبت أولًا ما إذا كانت الرسالة قد وصلت إلى Mac المحلي. إذا لم يتغير `chat.db`، فلا يستطيع OpenClaw تلقي الرسالة حتى عندما يبلغ `imsg status --json` عن جسر سليم.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    إذا لم تُنشئ الرسائل المرسلة من الهاتف صفوفًا جديدة، فأصلح طبقة رسائل macOS وApple Push قبل تغيير إعدادات OpenClaw. غالبًا ما يكون تحديث خدمة لمرة واحدة كافيًا:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    أرسل iMessage جديدة من الهاتف وأكد وجود صف `chat.db` جديد أو حدث `imsg watch` قبل تصحيح جلسات OpenClaw. لا تشغّل هذا كحلقة دورية لإعادة إطلاق الجسر؛ يمكن أن تؤدي عمليات `imsg launch` المتكررة مع إعادة تشغيل Gateway أثناء العمل النشط إلى مقاطعة عمليات التسليم وترك تشغيلات القناة الجارية عالقة.

  </Accordion>

  <Accordion title="Gateway لا يعمل على macOS">
    يجب أن يعمل `cliPath: "imsg"` الافتراضي على جهاز Mac المسجل دخوله في Messages. على Linux أو Windows، اضبط `channels.imessage.cliPath` على سكربت تغليف يستخدم SSH إلى ذلك Mac ويشغّل `imsg "$@"`.

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

  <Accordion title="يتم تجاهل الرسائل الجماعية">
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

    أكد منح Full Disk Access + Automation لسياق العملية الذي يشغّل OpenClaw/`imsg`.

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
- [الاقتران](/ar/channels/pairing) — مصادقة DM وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
