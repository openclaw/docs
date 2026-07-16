---
read_when:
    - إعداد دعم iMessage
    - تصحيح أخطاء إرسال/استقبال iMessage
summary: دعم أصلي لـ iMessage عبر imsg ‏(JSON-RPC عبر stdio)، مع إجراءات API خاصة للردود وردود الفعل tapback والتأثيرات واستطلاعات الرأي والمرفقات وإدارة المجموعات. يُفضَّل لإعدادات OpenClaw الجديدة مع iMessage عندما تكون متطلبات المضيف ملائمة.
title: iMessage
x-i18n:
    generated_at: "2026-07-16T13:18:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 78b7ff7621e66e3b0122b5581c097140b7f62998b78981741bd3edbc0e1608bd
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
في نشر iMessage المعتاد لـ OpenClaw، شغّل Gateway و`imsg` على مضيف macOS نفسه المسجّل الدخول إلى Messages. إذا كان Gateway يعمل في مكان آخر، فوجّه `channels.imessage.cliPath` إلى مغلّف SSH شفاف يشغّل `imsg` على جهاز Mac.

**الاسترداد الوارد تلقائي.** بعد إعادة تشغيل الجسر أو Gateway، يعيد iMessage تشغيل الرسائل التي فاتت أثناء توقفه ويمنع «دفعة التراكم القديمة» التي قد يرسلها Apple بعد استرداد Push، مع إزالة التكرار كي لا يُرسَل أي شيء مرتين. لا يوجد إعداد لتمكين ذلك — راجع [الاسترداد الوارد بعد إعادة تشغيل الجسر أو Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
أُزيل دعم BlueBubbles. رحّل إعدادات `channels.bluebubbles` إلى `channels.imessage`؛ لا يدعم OpenClaw بروتوكول iMessage إلا عبر `imsg`. ابدأ بـ[إزالة BlueBubbles ومسار imsg لـ iMessage](/ar/announcements/bluebubbles-imessage) للاطلاع على الإعلان المختصر، أو [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles) للاطلاع على جدول الترحيل الكامل.
</Warning>

الحالة: تكامل CLI خارجي أصلي. يشغّل Gateway العملية `imsg rpc` ويتواصل عبر JSON-RPC من خلال الإدخال والإخراج القياسيين — دون خدمة خفية أو منفذ منفصل. يُوصى بشدة بوضع API الخاص لتوفير قناة iMessage متكاملة؛ إذ تتطلب الردود وردود الفعل والتأثيرات والاستطلاعات والردود على المرفقات وإجراءات المجموعات `imsg launch` واجتياز فحص API الخاص بنجاح.

في الإعداد المحلي الشائع، يمكن لإعداد OpenClaw عرض تثبيت `imsg` أو تحديثه عبر Homebrew على جهاز Mac المسجّل الدخول إلى Messages بعد تأكيد المستخدم. تظل الإعدادات اليدوية والبنى التي تستخدم مغلّف SSH تحت إدارة المشغّل: ثبّت `imsg` أو حدّثه ضمن سياق المستخدم نفسه الذي سيشغّل Gateway أو المغلّف.

<CardGroup cols={3}>
  <Card title="إجراءات API الخاص" icon="wand-sparkles" href="#private-api-actions">
    الردود وردود الفعل والتأثيرات والاستطلاعات والمرفقات وإدارة المجموعات.
  </Card>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم رسائل iMessage المباشرة وضع الاقتران افتراضيًا.
  </Card>
  <Card title="جهاز Mac بعيد" icon="terminal" href="#remote-mac-over-ssh">
    استخدم مغلّف SSH عندما لا يعمل Gateway على جهاز Mac الخاص بـ Messages.
  </Card>
  <Card title="مرجع الإعدادات" icon="settings" href="/ar/gateway/config-channels#imessage">
    المرجع الكامل لحقول iMessage.
  </Card>
</CardGroup>

## الإعداد السريع

<Tabs>
  <Tab title="جهاز Mac محلي (المسار السريع)">
    <Steps>
      <Step title="تثبيت imsg والتحقق منه">

```bash
brew install steipete/tap/imsg
brew update && brew upgrade imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

        عندما يكتشف معالج الإعداد المحلي غياب أمر `imsg` الافتراضي، يمكنه طلب تثبيت `steipete/tap/imsg` عبر Homebrew. وإذا اكتشف `imsg` مُدارًا بواسطة Homebrew، فيمكنه طلب إعادة تثبيته أو تحديثه. لا تُعدَّل مغلّفات `cliPath` المخصصة.

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

      <Step title="الموافقة على اقتران أول رسالة مباشرة (dmPolicy الافتراضية)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        تنتهي صلاحية طلبات الاقتران بعد 1 hour.
      </Step>
    </Steps>

  </Tab>

  <Tab title="جهاز Mac بعيد عبر SSH">
    لا تحتاج معظم الإعدادات إلى SSH. استخدم هذه البنية فقط عندما يتعذر تشغيل Gateway على جهاز Mac المسجّل الدخول إلى Messages. لا يتطلب OpenClaw سوى `cliPath` متوافق مع الإدخال والإخراج القياسيين، لذا يمكنك توجيه `cliPath` إلى نص برمجي مغلّف يتصل بجهاز Mac بعيد عبر SSH ويشغّل `imsg`.
    ثبّت `imsg` وحدّثه على جهاز Mac البعيد، لا على مضيف Gateway:

```bash
ssh messages-mac 'brew install steipete/tap/imsg && brew update && brew upgrade imsg'
```

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    الإعداد الموصى به عند تمكين المرفقات:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // يُستخدم لجلب المرفقات عبر SCP
      includeAttachments: true,
      // اختياري: جذور إضافية مسموح بها للمرفقات (تُدمج مع الجذر الافتراضي
      // /Users/*/Library/Messages/Attachments).
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    إذا لم تُضبط `remoteHost`، يحاول OpenClaw اكتشافها تلقائيًا عبر تحليل النص البرمجي لمغلّف SSH.
    يجب أن تكون `remoteHost` إما `host` أو `user@host` (دون مسافات أو خيارات SSH)؛ وتُتجاهل القيم غير الآمنة.
    يستخدم OpenClaw تحققًا صارمًا من مفتاح المضيف في SCP، لذا يجب أن يكون مفتاح مضيف الترحيل موجودًا مسبقًا في `~/.ssh/known_hosts`.
    تُتحقق مسارات المرفقات بالاستناد إلى الجذور المسموح بها (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
يجب أن يتصرف أي مغلّف `cliPath` أو وكيل SSH تضعه أمام `imsg` كأنبوب شفاف للإدخال والإخراج القياسيين لاتصال JSON-RPC طويل الأمد. يتبادل OpenClaw رسائل JSON-RPC صغيرة محددة بأسطر جديدة عبر الإدخال والإخراج القياسيين للمغلّف طوال عمر القناة:

- مرّر كل جزء أو سطر من الإدخال القياسي **بمجرد توفر البايتات** — لا تنتظر EOF.
- مرّر كل جزء أو سطر من الإخراج القياسي فورًا في الاتجاه المعاكس.
- حافظ على الأسطر الجديدة.
- تجنب عمليات القراءة الحاجبة ذات الحجم الثابت (`read(4096)` و`cat | buffer` و`read` الافتراضية للصدفة) التي قد تحرم الإطارات الصغيرة.
- افصل الخطأ القياسي عن تدفق إخراج JSON-RPC القياسي.

سيؤدي المغلّف الذي يخزّن الإدخال القياسي مؤقتًا حتى امتلاء كتلة كبيرة إلى أعراض تبدو كأنها انقطاع في iMessage — `imsg rpc timeout (chats.list)` أو عمليات إعادة تشغيل متكررة للقناة — حتى إذا كان `imsg rpc` نفسه سليمًا. يُعد `ssh -T host imsg "$@"` (أعلاه) آمنًا لأنه يمرّر وسائط `cliPath` الخاصة بـOpenClaw، مثل `rpc` و`--db`. أما خطوط الأنابيب مثل `ssh host imsg | grep -v '^DEBUG'` فليست آمنة — فقد تستمر الأدوات ذات التخزين المؤقت حسب السطر في احتجاز الإطارات؛ استخدم `stdbuf -oL -eL` في كل مرحلة إذا كان لا بد من التصفية.
</Warning>

  </Tab>
</Tabs>

## المتطلبات والأذونات (macOS)

- يجب تسجيل الدخول إلى Messages على جهاز Mac الذي يشغّل `imsg`.
- يلزم منح الوصول الكامل إلى القرص لسياق العملية الذي يشغّل OpenClaw‏/`imsg` (للوصول إلى قاعدة بيانات Messages).
- يلزم إذن الأتمتة لإرسال الرسائل عبر Messages.app.
- بالنسبة إلى الإجراءات المتقدمة (التفاعل / التعديل / إلغاء الإرسال / الرد المتسلسل / التأثيرات / الاستطلاعات / عمليات المجموعات)، يجب تعطيل حماية تكامل النظام — راجع [تمكين API الخاص لـ imsg](#enabling-the-imsg-private-api). يعمل الإرسال والاستقبال الأساسيان للنصوص والوسائط من دون تعطيلها.

<Tip>
تُمنح الأذونات لكل سياق عملية على حدة. إذا كان Gateway يعمل دون واجهة مستخدم (LaunchAgent/SSH)، فنفّذ أمرًا تفاعليًا لمرة واحدة ضمن السياق نفسه لإظهار مطالبات الأذونات:

```bash
imsg chats --limit 1
# أو
imsg send <handle> "test"
```

</Tip>

<Accordion title="فشل الإرسال عبر مغلّف SSH مع AppleEvents -1743">
  يمكن لإعداد SSH بعيد قراءة المحادثات واجتياز `channels status --probe` ومعالجة الرسائل الواردة، بينما يستمر فشل الإرسال الصادر بسبب خطأ في تفويض AppleEvents:

```text
غير مصرّح بإرسال أحداث Apple إلى Messages. (-1743)
```

تحقق من قاعدة بيانات TCC لمستخدم جهاز Mac المسجّل دخوله أو من System Settings > Privacy & Security > Automation. إذا كان إدخال Automation مسجّلًا للعملية `/usr/libexec/sshd-keygen-wrapper` بدلًا من العملية `imsg` أو عملية الصدفة المحلية، فقد لا يعرض macOS مفتاح تبديل صالحًا لـ Messages لعميل SSH الموجود على جانب الخادم:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

في هذه الحالة، قد يستمر فشل تكرار `tccutil reset AppleEvents` أو إعادة تشغيل `imsg send` عبر مغلّف SSH نفسه، لأن سياق العملية الذي يحتاج إلى أتمتة Messages هو مغلّف SSH، وليس تطبيقًا تستطيع واجهة المستخدم منحه الإذن.

استخدم بدلًا من ذلك أحد سياقات عمليات `imsg` المدعومة:

- شغّل Gateway، أو جسر `imsg` على الأقل، ضمن الجلسة المحلية لمستخدم Messages المسجّل دخوله.
- ابدأ تشغيل Gateway باستخدام LaunchAgent لذلك المستخدم بعد منح الوصول الكامل إلى القرص وإذن الأتمتة من الجلسة نفسها.
- إذا أبقيت على بنية SSH ذات المستخدمين، فتحقق من نجاح إرسال صادر فعلي عبر `imsg send` من خلال المغلّف نفسه قبل تمكين القناة. إذا تعذر منحه إذن الأتمتة، فأعد الإعداد إلى بنية `imsg` ذات مستخدم واحد بدلًا من الاعتماد على مغلّف SSH للإرسال.

</Accordion>

## تمكين API الخاص لـ imsg

يأتي `imsg` بوضعين تشغيليين. بالنسبة إلى OpenClaw، يُعد وضع API الخاص الإعداد الموصى به لأنه يمنح القناة إجراءات iMessage الأصلية التي يتوقعها المستخدمون. ويظل الوضع الأساسي مفيدًا للتثبيتات منخفضة المخاطر أو التحقق الأولي أو المضيفات التي لا يمكن تعطيل SIP عليها.

- **الوضع الأساسي** (الافتراضي، لا يلزم إجراء تغييرات على SIP): إرسال النصوص والوسائط عبر `send`، ومراقبة الرسائل الواردة وسجلها، وقائمة المحادثات. هذا ما تحصل عليه مباشرة من تثبيت `brew install steipete/tap/imsg` جديد مع أذونات macOS القياسية المذكورة أعلاه.
- **وضع API الخاص**: يحقن `imsg` مكتبة dylib مساعدة في `Messages.app` لاستدعاء وظائف `IMCore` الداخلية. يتيح ذلك `react` و`edit` و`unsend` و`reply` (المتسلسل) و`sendWithEffect` و`poll` و`poll-vote` (استطلاعات Messages الأصلية) و`renameGroup` و`setGroupIcon` و`addParticipant` و`removeParticipant` و`leaveGroup`، بالإضافة إلى مؤشرات الكتابة وإيصالات القراءة.

يتطلب نطاق الإجراءات الموصى به في هذه الصفحة وضع API الخاص. ويوضح README الخاص بـ`imsg` هذا المتطلب صراحةً:

> الميزات المتقدمة مثل `read` و`typing` و`launch`، والإرسال الغني المدعوم بالجسر، وتعديل الرسائل، وإدارة المحادثات اختيارية. وتتطلب تعطيل SIP وحقن مكتبة dylib مساعدة في `Messages.app`. يرفض `imsg launch` إجراء الحقن عندما تكون SIP مفعّلة.

تستخدم تقنية حقن المكتبة المساعدة مكتبة dylib الخاصة بـ`imsg` للوصول إلى واجهات API الخاصة بـ Messages. لا يوجد خادم تابع لجهة خارجية أو بيئة تشغيل BlueBubbles ضمن مسار iMessage في OpenClaw.

<Warning>
**ينطوي تعطيل SIP على مقايضة أمنية حقيقية.** تُعد SIP إحدى وسائل الحماية الأساسية في macOS ضد تشغيل شيفرة نظام معدّلة؛ ويؤدي تعطيلها على مستوى النظام إلى فتح سطح هجوم إضافي وآثار جانبية. ومن الجدير بالذكر أن **تعطيل SIP على أجهزة Mac المزودة بـ Apple Silicon يعطّل أيضًا إمكانية تثبيت تطبيقات iOS وتشغيلها على جهاز Mac**.

تعامل مع ذلك بوصفه خيارًا تشغيليًا متعمدًا، ولا سيما على جهاز Mac شخصي أساسي. للحصول على iMessage بجودة إنتاجية في OpenClaw، يُفضّل استخدام جهاز Mac مخصص أو مستخدم macOS مخصص للروبوت حيث يكون تمكين الجسر مقبولًا. إذا كان نموذج التهديد لديك لا يسمح بتعطيل SIP في أي مكان، فسيقتصر iMessage المضمّن على الوضع الأساسي — إرسال النصوص والوسائط واستقبالها فقط، دون ردود فعل / تعديل / إلغاء إرسال / تأثيرات / عمليات مجموعات.
</Warning>

### الإعداد

1. **ثبّت (أو رقِّ) `imsg`** على جهاز Mac الذي يشغّل Messages.app:

   ```bash
   brew install steipete/tap/imsg
   brew update && brew upgrade imsg
   imsg --version
   imsg status --json
   ```

   تعرض مخرجات `imsg status --json` القيم `bridge_version` و`rpc_methods` و`selectors` لكل طريقة، حتى تتمكن من معرفة ما يدعمه الإصدار الحالي قبل البدء.

2. **عطّل حماية تكامل النظام، و(في إصدارات macOS الحديثة) التحقق من صحة المكتبات.** يتطلب حقن مكتبة dylib مساعدة غير تابعة لـ Apple في `Messages.app` الموقّع من Apple تعطيل SIP **وكذلك** تخفيف قيود التحقق من صحة المكتبات. تعتمد خطوة SIP في وضع الاسترداد على إصدار macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** عطّل التحقق من صحة المكتبات عبر Terminal، وأعد التشغيل في وضع الاسترداد، وشغّل `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+ (Big Sur والإصدارات الأحدث)، Intel:** ادخل وضع الاسترداد (أو الاسترداد عبر الإنترنت)، وشغّل `csrutil disable`، ثم أعد التشغيل.
   - **macOS 11+، Apple Silicon:** استخدم تسلسل بدء التشغيل بزر الطاقة للدخول إلى وضع الاسترداد؛ وفي إصدارات macOS الحديثة، اضغط باستمرار على مفتاح **Left Shift** عند النقر على Continue، ثم شغّل `csrutil disable`. تتبع إعدادات الأجهزة الافتراضية مسارًا منفصلًا، لذا التقط لقطة للجهاز الافتراضي أولًا.

   **في macOS 11 والإصدارات الأحدث، لا يكفي `csrutil disable` وحده عادةً.** تواصل Apple فرض التحقق من صحة المكتبات على `Messages.app` بصفته ملفًا ثنائيًا للنظام الأساسي، ولذلك تُرفض الأداة المساعدة الموقّعة بتوقيع مخصص (`Library Validation failed: ... platform binary, but mapped file is not`) حتى مع تعطيل SIP. بعد تعطيل SIP، عطّل أيضًا التحقق من صحة المكتبات وأعد التشغيل:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe)، تم التحقق منه على 26.5.1:** يكفي تعطيل SIP **بالإضافة إلى** أمر `DisableLibraryValidation` أعلاه لحقن الأداة المساعدة في الإصدارات من 26.0 إلى 26.5.x. **لا يلزم استخدام أي boot-args.** ملف plist هو العامل الحاسم والخطوة المفقودة الأكثر شيوعًا عند فشل الحقن على Tahoe:
   - **مع ملف plist:** يحقن `imsg launch` وتُبلغ `imsg status` عن `advanced_features: true`.
   - **من دون ملف plist (حتى مع تعطيل SIP):** يفشل `imsg launch` مع `Failed to launch: Timeout waiting for Messages.app to initialize`. يرفض AMFI الأداة المساعدة الموقّعة بتوقيع مخصص عند التحميل، فلا يصبح الجسر جاهزًا أبدًا وتنتهي مهلة التشغيل. انتهاء المهلة هذا هو العَرَض الذي يواجهه معظم الأشخاص على Tahoe؛ والحل هو ملف plist أعلاه، وليس إجراءً أكثر تشددًا.

   إذا بدأ حقن `imsg launch` أو إجراءات `selectors` معينة بإرجاع false بعد ترقية macOS، فعادةً ما تكون هذه البوابة هي السبب. تحقّق من حالة SIP والتحقق من صحة المكتبات قبل افتراض فشل خطوة SIP نفسها. إذا كانت هذه الإعدادات صحيحة وما زال الجسر غير قادر على الحقن، فاجمع `imsg status --json` مع مخرجات `imsg launch` وأبلغ عنها إلى مشروع `imsg` بدلًا من إضعاف ضوابط أمان إضافية على مستوى النظام بأكمله.

3. **احقن الأداة المساعدة.** مع تعطيل SIP وتسجيل الدخول إلى Messages.app:

   ```bash
   imsg launch
   ```

   يرفض `imsg launch` إجراء الحقن عندما يظل SIP مفعّلًا، لذا يُعد ذلك أيضًا تأكيدًا على تنفيذ الخطوة 2.

4. **تحقّق من الجسر من OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   ينبغي أن يُبلغ إدخال iMessage عن `works`، وينبغي أن يعرض `imsg status --json | jq '{rpc_methods, selectors}'` الإمكانات التي يوفّرها إصدار macOS لديك. يتطلب إنشاء استطلاعات الرأي `selectors.pollPayloadMessage`؛ ويتطلب التصويت كلًا من `selectors.pollVoteMessage` وطريقة RPC المسماة `poll.vote`. لا يعلن Plugin الخاص بـ OpenClaw إلا عن الإجراءات التي يدعمها الفحص المخزّن مؤقتًا، بينما تظل ذاكرة التخزين المؤقت الفارغة متفائلة وتجري الفحص عند أول إرسال.

إذا أبلغ `openclaw channels status --probe` عن القناة باعتبارها `works` لكن إجراءات معينة طرحت الخطأ "iMessage `<action>` requires the imsg private API bridge" وقت الإرسال، فشغّل `imsg launch` مجددًا — قد تنفصل الأداة المساعدة (بسبب إعادة تشغيل Messages.app أو تحديث نظام التشغيل، وما إلى ذلك)، وستواصل حالة `available: true` المخزّنة مؤقتًا الإعلان عن الإجراءات حتى يحدّثها الفحص التالي.

### عند إبقاء SIP مفعّلًا

إذا كان تعطيل SIP غير مقبول وفق نموذج التهديد لديك:

- يرجع `imsg` إلى الوضع الأساسي — النصوص والوسائط والاستقبال فقط.
- يواصل Plugin الخاص بـ OpenClaw الإعلان عن إرسال النصوص/الوسائط ومراقبة الرسائل الواردة؛ ويخفي `react` و`edit` و`unsend` و`reply` و`sendWithEffect` وعمليات المجموعات من سطح الإجراءات (وفق بوابة الإمكانات الخاصة بكل طريقة).
- يمكن تشغيل جهاز Mac منفصل لا يعتمد Apple Silicon (أو جهاز Mac مخصص للبوت) مع تعطيل SIP لأحمال عمل iMessage، مع إبقاء SIP مفعّلًا على أجهزتك الأساسية. راجع [مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)](#deployment-patterns) أدناه.

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.imessage.dmPolicy` في الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب إدخالًا واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    حقل قائمة السماح: `channels.imessage.allowFrom`.

    يجب أن تحدد إدخالات قائمة السماح المرسلين: المعرّفات أو مجموعات الوصول الثابتة للمرسلين (`accessGroup:<name>`). استخدم `channels.imessage.groupAllowFrom` لأهداف المحادثات مثل `chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`؛ واستخدم `channels.imessage.groups` لمفاتيح سجل `chat_id` الرقمية.

  </Tab>

  <Tab title="سياسة المجموعات + الإشارات">
    يتحكم `channels.imessage.groupPolicy` في معالجة المجموعات:

    - `allowlist` (الافتراضي)
    - `open`
    - `disabled`

    قائمة السماح لمرسلي المجموعات: `channels.imessage.groupAllowFrom`.

    يمكن لإدخالات `groupAllowFrom` أيضًا الإشارة إلى مجموعات الوصول الثابتة للمرسلين (`accessGroup:<name>`).

    الإجراء الاحتياطي وقت التشغيل: إذا لم تُعيّن `groupAllowFrom`، تستخدم عمليات التحقق من مرسلي مجموعات iMessage القيمة `allowFrom`؛ عيّن `groupAllowFrom` عندما ينبغي اختلاف قبول الرسائل المباشرة والمجموعات. لا ترجع `groupAllowFrom: []` الفارغة صراحةً إلى قيمة احتياطية — بل تحظر جميع مرسلي المجموعات ضمن `allowlist`.
    ملاحظة وقت التشغيل: إذا كانت `channels.imessage` مفقودة تمامًا، يرجع وقت التشغيل إلى `groupPolicy="allowlist"` ويسجّل تحذيرًا (حتى إذا كانت `channels.defaults.groupPolicy` معيّنة).

    <Warning>
    يُشغّل توجيه المجموعات ضمن `groupPolicy: "allowlist"` بوابتين **متتاليتين**:

    1. **قائمة السماح للمرسلين** (`channels.imessage.groupAllowFrom`) — المعرّف أو `accessGroup:<name>` أو `chat_guid` أو `chat_identifier` أو `chat_id`. تحظر القائمة الفعلية الفارغة (عدم وجود `groupAllowFrom` وعدم وجود الإجراء الاحتياطي `allowFrom`) كل مرسلي المجموعات.
    2. **سجل المجموعات** (`channels.imessage.groups`) — يُفرض بمجرد احتواء الخريطة على إدخالات: يجب أن تتطابق المحادثة مع إدخال صريح لكل `chat_id` أو مع حرف البدل `groups: { "*": { ... } }`. عندما تكون `groups` فارغة أو مفقودة، تحدد قائمة السماح للمرسلين وحدها القبول.

    إذا لم تُضبط قائمة سماح فعلية لمرسلي المجموعات، تُسقط كل رسالة جماعية قبل بوابة السجل. لكل بوابة إشارة خاصة بها بمستوى `warn` عند مستوى السجل الافتراضي، وتشير كل منهما إلى إصلاح مختلف:

    - مرة واحدة لكل حساب عند بدء التشغيل، عندما تكون قائمة السماح الفعلية لمرسلي المجموعات فارغة: `imessage: groupPolicy="allowlist" for account "<id>" but no group sender allowlist is configured ...` — أصلح ذلك بتعيين `channels.imessage.groupAllowFrom` (أو `allowFrom`)؛ فإضافة إدخالات `groups` وحدها تُبقي البوابة 1 حاجبةً لكل مرسل.
    - مرة واحدة لكل `chat_id` وقت التشغيل، عندما يجتاز مرسل البوابة 1 لكن المحادثة تكون مفقودة من سجل `groups` المعبّأ: `imessage: dropping group message from chat_id=<id> ...` — أصلح ذلك بإضافة `chat_id` هذا (أو `"*"`) ضمن `channels.imessage.groups`.

    لا تتأثر الرسائل المباشرة — فهي تتبع مسارًا برمجيًا مختلفًا.

    الإعداد الموصى به لتدفق المجموعات ضمن `groupPolicy: "allowlist"`:

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

    تسمح `groupAllowFrom` وحدها لهؤلاء المرسلين في أي مجموعة؛ أضف كتلة `groups` لتحديد نطاق المحادثات المسموح بها (ولتعيين خيارات خاصة بكل محادثة مثل `requireMention`).
    </Warning>

    بوابة الإشارات للمجموعات:

    - لا يوفّر iMessage بيانات وصفية أصلية للإشارات
    - يستخدم اكتشاف الإشارات أنماط التعبيرات النمطية (`agents.list[].groupChat.mentionPatterns`، مع الإجراء الاحتياطي `messages.groupChat.mentionPatterns`)
    - من دون أنماط مضبوطة، لا يمكن فرض بوابة الإشارات
    - تتجاوز أوامر التحكم الصادرة عن المرسلين المصرّح لهم بوابة الإشارات

    `systemPrompt` لكل مجموعة:

    يقبل كل إدخال ضمن `channels.imessage.groups.*` سلسلة `systemPrompt` اختيارية تُحقن في موجّه النظام الخاص بالوكيل في كل دورة تتعامل مع رسالة في تلك المجموعة. يماثل تحديد القيمة `channels.whatsapp.groups`:

    1. **موجّه النظام الخاص بالمجموعة** (`groups["<chat_id>"].systemPrompt`): يُستخدم عندما يوجد إدخال المجموعة المحددة في الخريطة **ويكون** مفتاح `systemPrompt` الخاص به معرّفًا. إذا كانت `systemPrompt` سلسلة فارغة (`""`)، يُعطّل حرف البدل ولا يُطبّق أي موجّه نظام على تلك المجموعة.
    2. **موجّه نظام حرف البدل للمجموعات** (`groups["*"].systemPrompt`): يُستخدم عندما يكون إدخال المجموعة المحددة غائبًا تمامًا من الخريطة، أو عندما يكون موجودًا لكنه لا يعرّف مفتاح `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "استخدم التهجئة البريطانية." },
            "8421": {
              requireMention: true,
              systemPrompt: "هذه محادثة مناوبة الدعم. اجعل الردود أقل من 3 جمل.",
            },
            "9907": {
              // تعطيل صريح: لا ينطبق حرف البدل "استخدم التهجئة البريطانية." هنا
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    لا تنطبق الموجّهات الخاصة بكل مجموعة إلا على رسائل المجموعات — ولا تتأثر الرسائل المباشرة.

  </Tab>

  <Tab title="الجلسات والردود الحتمية">
    - تستخدم الرسائل المباشرة التوجيه المباشر؛ وتستخدم المجموعات توجيه المجموعات.
    - مع القيمة الافتراضية `session.dmScope=main`، تُدمج رسائل iMessage المباشرة في الجلسة الرئيسية للوكيل.
    - تكون جلسات المجموعات معزولة (`agent:<agentId>:imessage:group:<chat_id>`).
    - تُوجّه الردود مجددًا إلى iMessage باستخدام البيانات الوصفية للقناة/الهدف الأصليين.

    سلوك سلاسل المحادثات الشبيهة بالمجموعات:

    قد تصل بعض سلاسل محادثات iMessage متعددة المشاركين مع `is_group=false`.
    إذا ضُبطت `chat_id` هذه صراحةً ضمن `channels.imessage.groups`، يعاملها OpenClaw كحركة مرور جماعية (بوابة المجموعات + عزل جلسة المجموعة).

  </Tab>
</Tabs>

## ارتباطات محادثات ACP

يمكن ربط محادثات iMessage بجلسات ACP.

تدفق سريع للمشغّل:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو محادثة المجموعة المسموح بها.
- تُوجّه الرسائل المستقبلية في محادثة iMessage نفسها إلى جلسة ACP المنشأة.
- تعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في موضعها.
- تغلق `/acp close` جلسة ACP وتزيل الارتباط.

تستخدم الارتباطات الدائمة المضبوطة إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` و`match.channel: "imessage"`.

يمكن أن تستخدم `match.peer.id`:

- معرّف رسالة مباشرة مطبّعًا مثل `+15555550123` أو `user@example.com`
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
    استخدم Apple ID ومستخدم macOS مخصصين لعزل حركة مرور البوت عن ملفك الشخصي في Messages.

    التدفق المعتاد:

    1. أنشئ مستخدمًا مخصصًا في macOS أو سجّل الدخول إليه.
    2. سجّل الدخول إلى Messages باستخدام Apple ID الخاص بالبوت ضمن ذلك المستخدم.
    3. ثبّت `imsg` ضمن ذلك المستخدم.
    4. أنشئ برنامج تغليف لـ SSH كي يتمكن OpenClaw من تشغيل `imsg` ضمن سياق ذلك المستخدم.
    5. وجّه `channels.imessage.accounts.<id>.cliPath` و`.dbPath` إلى ملف تعريف ذلك المستخدم.

    قد يتطلب التشغيل الأول موافقات عبر واجهة المستخدم الرسومية (Automation + Full Disk Access) في جلسة مستخدم البوت تلك.

  </Accordion>

  <Accordion title="جهاز Mac بعيد عبر Tailscale (مثال)">
    البنية الشائعة:

    - يعمل Gateway على Linux/VM
    - يعمل iMessage و`imsg` على جهاز Mac ضمن شبكتك الطرفية
    - يستخدم برنامج تغليف `cliPath` بروتوكول SSH لتشغيل `imsg`
    - يتيح `remoteHost` جلب المرفقات عبر SCP

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

    استخدم مفاتيح SSH كي يعمل كل من SSH وSCP دون تفاعل.
    تأكد أولًا من الوثوق بمفتاح المضيف (على سبيل المثال `ssh bot@mac-mini.tailnet-1234.ts.net`) كي تتم تعبئة `known_hosts`.

  </Accordion>

  <Accordion title="نمط الحسابات المتعددة">
    يدعم iMessage إعدادات لكل حساب ضمن `channels.imessage.accounts`.

    يمكن لكل حساب تجاوز حقول مثل `cliPath` و`dbPath` و`allowFrom` و`groupPolicy` و`mediaMaxMb` وإعدادات السجل وقوائم السماح لجذور المرفقات.

  </Accordion>

  <Accordion title="سجل الرسائل المباشرة">
    عيّن `channels.imessage.dmHistoryLimit` لتهيئة جلسات الرسائل المباشرة الجديدة بالسجل الحديث المفكوك ترميزه من `imsg` لتلك المحادثة. استخدم `channels.imessage.dms["<sender>"].historyLimit` لإجراء تجاوزات لكل مرسل، بما في ذلك `0` لتعطيل السجل لمرسل معين.

    يُجلب سجل رسائل iMessage المباشرة عند الطلب من `imsg`. يؤدي ترك `dmHistoryLimit` دون تعيين إلى تعطيل التهيئة العامة لسجل الرسائل المباشرة، لكن تظل القيمة الموجبة لـ `channels.imessage.dms["<sender>"].historyLimit` الخاصة بمرسل معين مفعّلة للتهيئة لذلك المرسل.

  </Accordion>
</AccordionGroup>

## الوسائط والتقسيم ووجهات التسليم

<AccordionGroup>
  <Accordion title="المرفقات والوسائط">
    - يكون استيعاب المرفقات الواردة **معطّلًا افتراضيًا** — عيّن `channels.imessage.includeAttachments: true` لإعادة توجيه الصور والمذكرات الصوتية ومقاطع الفيديو والمرفقات الأخرى إلى الوكيل. عند تعطيله، تُسقط رسائل iMessage التي تحتوي على مرفقات فقط قبل وصولها إلى الوكيل، وقد لا تُنتج أي سطر سجل `Inbound message` إطلاقًا.
    - يمكن جلب مسارات المرفقات البعيدة عبر SCP عند تعيين `remoteHost`
    - يجب أن تطابق مسارات المرفقات الجذور المسموح بها:
      - `channels.imessage.attachmentRoots` (محلي)
      - `channels.imessage.remoteAttachmentRoots` (وضع SCP البعيد)
      - توسّع الجذور المضبوطة نمط الجذر الافتراضي `/Users/*/Library/Messages/Attachments` (تُدمج ولا تستبدله)
    - يستخدم SCP تحققًا صارمًا من مفتاح المضيف (`StrictHostKeyChecking=yes`)
    - يستخدم حجم الوسائط الصادرة `channels.imessage.mediaMaxMb` (الافتراضي 16 MB)

  </Accordion>

  <Accordion title="النص الصادر والتقسيم">
    - حد تقسيم النص: `channels.imessage.textChunkLimit` (الافتراضي 4000)
    - وضع التقسيم: `channels.imessage.streaming.chunkMode`
      - `length` (الافتراضي)
      - `newline` (التقسيم بحسب الفقرات أولًا)
    - يُحوّل الخط العريض والمائل والتسطير والشطب في Markdown الصادر إلى نص ذي تنسيق أصلي (يعرض المستلمون على macOS 15+ التنسيق؛ ويرى المستلمون على الإصدارات الأقدم نصًا عاديًا دون العلامات)؛ وتُحوّل جداول Markdown وفق وضع جداول Markdown الخاص بالقناة
    - يحدد `channels.imessage.sendTransport` (الافتراضي `auto`، و`bridge`، و`applescript`) كيفية تسليم `imsg` لعمليات الإرسال

  </Accordion>

  <Accordion title="تنسيقات العنونة">
    الوجهات الصريحة المفضلة:

    - `chat_id:123` (موصى به للتوجيه المستقر)
    - `chat_guid:...`
    - `chat_identifier:...`

    تُدعم أيضًا الوجهات المستندة إلى المعرّفات:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## إجراءات واجهة API الخاصة

عندما يكون `imsg launch` قيد التشغيل ويبلغ `openclaw channels status --probe` عن `privateApi.available: true`، يمكن لأداة الرسائل استخدام إجراءات iMessage الأصلية بالإضافة إلى عمليات إرسال النص العادية.

تكون جميع الإجراءات مفعّلة افتراضيًا؛ استخدم `channels.imessage.actions` لتعطيل إجراءات فردية:

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
    - **التفاعل**: أضف/أزل ردود tapback في iMessage ‏(`messageId` و`emoji` و`remove`). تتطابق ردود tapback المدعومة مع الحب والإعجاب وعدم الإعجاب والضحك والتشديد والسؤال. تؤدي الإزالة دون رمز تعبيري إلى مسح أي رد tapback تم تعيينه.
    - **الرد**: أرسل ردًا مترابطًا على رسالة موجودة (`messageId`، و`text` أو `message`، بالإضافة إلى `chatGuid` أو `chatId` أو `chatIdentifier` أو `to`). يتطلب الرد مع مرفق أيضًا إصدار `imsg` يدعم فيه `send-rich` الخيار `--file`.
    - **الإرسال مع تأثير**: أرسل نصًا مع تأثير iMessage ‏(`text` أو `message`، و`effect` أو `effectId`). الأسماء المختصرة: slam، loud، gentle، invisibleink، confetti، lasers، fireworks، balloon، heart، echo، happybirthday، shootingstar، sparkles، spotlight.
    - **التحرير**: حرّر رسالة مرسلة على إصدارات macOS/واجهة API الخاصة المدعومة (`messageId`، و`text` أو `newText`). لا يمكن تحرير سوى الرسائل التي أرسلها Gateway نفسه.
    - **إلغاء الإرسال**: اسحب رسالة مرسلة على إصدارات macOS/واجهة API الخاصة المدعومة (`messageId`). لا يمكن إلغاء إرسال سوى الرسائل التي أرسلها Gateway نفسه.
    - **رفع ملف**: أرسل الوسائط/الملفات (`buffer` بترميز base64 أو `media`/`path`/`filePath` مُهيّأ، و`filename`، و`asVoice` اختياريًا). الاسم البديل القديم: `sendAttachment`.
    - **إعادة تسمية المجموعة** و**تعيين أيقونة المجموعة** و**إضافة مشارك** و**إزالة مشارك** و**مغادرة المجموعة**: أدِر محادثات المجموعة عندما تكون الوجهة الحالية محادثة جماعية. تعدّل هذه الإجراءات هوية Messages على المضيف، لذا تتطلب مرسلًا مالكًا أو عميل Gateway من `operator.admin`.
    - **استطلاع**: أنشئ استطلاعًا أصليًا في Apple Messages ‏(`pollQuestion`، وتكرار `pollOption` من 2 إلى 12 مرة، بالإضافة إلى `chatGuid` أو `chatId` أو `chatIdentifier` أو `to`). يراه المستلمون على iOS/iPadOS/macOS 26+ ويصوّتون عليه بشكل أصلي؛ وتحصل إصدارات أنظمة التشغيل الأقدم على نص "تم إرسال استطلاع" احتياطي. يتطلب `selectors.pollPayloadMessage`.
    - **التصويت في استطلاع**: صوّت في استطلاع موجود (`pollId` أو `messageId`، بالإضافة إلى واحد بالضبط من `pollOptionIndex` أو `pollOptionId` أو `pollOptionText`). يتطلب `selectors.pollVoteMessage` وطريقة RPC المسماة `poll.vote`.

    تُعرض الاستطلاعات الواردة المقبولة للوكيل متضمنة السؤال وتسميات الخيارات المرقمة وأعداد الأصوات ومعرّف رسالة الاستطلاع الذي يحتاج إليه `poll-vote`.

  </Accordion>

  <Accordion title="معرّفات الرسائل">
    يتضمن سياق iMessage الوارد قيم `MessageSid` القصيرة ومعرّفات GUID الكاملة للرسائل (`MessageSidFull`) عند توفرها. تقتصر المعرّفات القصيرة على ذاكرة التخزين المؤقت الحديثة للردود المدعومة بـ SQLite ويُتحقق منها مقابل المحادثة الحالية قبل الاستخدام. إذا انتهت صلاحية معرّف قصير، فأعد المحاولة باستخدام `MessageSidFull` الخاص به مع استهداف المحادثة التي قدمته. لا تتجاوز المعرّفات الكاملة ربط المحادثة أو الحساب، لذا استبدل المعرّف الوارد من محادثة أخرى بمعرّف من الوجهة الحالية. قد ترفض الاستدعاءات المفوضة عن بُعد المعرّفات الكاملة القديمة عندما لا يتوفر دليل على المحادثة الحالية.

  </Accordion>

  <Accordion title="اكتشاف الإمكانات">
    يخفي OpenClaw إجراءات واجهة API الخاصة فقط عندما تشير حالة الفحص المخزنة مؤقتًا إلى أن الجسر غير متاح. إذا كانت الحالة مجهولة، تظل الإجراءات مرئية وتُشغّل عمليات الفحص عند الطلب كي ينجح الإجراء الأول بعد `imsg launch` دون تحديث يدوي منفصل للحالة.

  </Accordion>

  <Accordion title="إيصالات القراءة والكتابة">
    عندما يكون جسر واجهة API الخاصة قيد التشغيل، تُعلّم المحادثات الواردة المقبولة كمقروءة وتُظهر المحادثات المباشرة فقاعة كتابة بمجرد قبول الدورة، بينما يُعِد الوكيل السياق ويولّد الاستجابة. عطّل تعليم الرسائل كمقروءة باستخدام:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    تعطّل إصدارات `imsg` الأقدم من قائمة الإمكانات لكل طريقة الكتابة/القراءة بصمت؛ ويسجل OpenClaw تحذيرًا لمرة واحدة عند كل إعادة تشغيل كي يمكن عزو الإيصال المفقود إلى سببه.

  </Accordion>

  <Accordion title="ردود tapback الواردة">
    يشترك OpenClaw في ردود tapback في iMessage ويوجّه التفاعلات المقبولة كأحداث نظام بدلًا من نص رسالة عادي، لذا لا يؤدي رد tapback من المستخدم إلى تشغيل حلقة رد عادية.

    يتحكم `channels.imessage.reactionNotifications` في وضع الإشعارات:

    - `"own"` (الافتراضي): أرسل إشعارًا فقط عندما يتفاعل المستخدمون مع رسائل كتبها البوت.
    - `"all"`: أرسل إشعارًا لجميع ردود tapback الواردة من المرسلين المصرح لهم.
    - `"off"`: تجاهل ردود tapback الواردة.

    تستخدم التجاوزات الخاصة بكل حساب `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="تفاعلات الموافقة (👍 / 👎)">
    عندما تكون قيمة `approvals.exec.enabled` أو `approvals.plugin.enabled` صحيحة ويُوجّه الطلب إلى iMessage، يسلّم Gateway مطالبة موافقة بشكل أصلي ويقبل رد tapback لحسمها:

    - `👍` (رد tapback للإعجاب) → `allow-once`
    - `👎` (رد tapback لعدم الإعجاب) → `deny`
    - يظل `allow-always` خيارًا احتياطيًا يدويًا: أرسل `/approve <id> allow-always` كرد عادي.

    تتطلب معالجة التفاعل أن يكون معرّف المستخدم المتفاعل مدرجًا صراحةً ضمن الموافقين. تُقرأ قائمة الموافقين من `channels.imessage.allowFrom` (أو `channels.imessage.accounts.<id>.allowFrom`)؛ أضف رقم هاتف المستخدم بصيغة E.164 أو بريده الإلكتروني في Apple ID (لا تُعد وجهات المحادثة مثل `chat_id:*` إدخالات صالحة للموافقين). يُحترم إدخال حرف البدل `"*"` لكنه يسمح لأي مرسل بالموافقة؛ وتعطّل قائمة الموافقين الفارغة اختصار التفاعل بالكامل. يتجاوز اختصار التفاعل عمدًا `reactionNotifications` و`dmPolicy` و`groupAllowFrom` لأن قائمة السماح الصريحة للموافقين هي البوابة الوحيدة المهمة لحسم الموافقة.

    يتبع تفويض أمر النص `/approve` القائمة نفسها: عندما تكون `channels.imessage.allowFrom` غير فارغة، يُصرّح لـ `/approve <id> <decision>` وفق قائمة الموافقين تلك (وليس قائمة السماح الأوسع للرسائل المباشرة)، ويتلقى المرسلون المسموح لهم في قائمة السماح للرسائل المباشرة لكن غير المدرجين في `allowFrom` رفضًا صريحًا. عندما تكون `allowFrom` فارغة، يظل الخيار الاحتياطي ضمن المحادثة نفسها ساريًا ويمنح `/approve` التفويض لكل من تسمح له قائمة السماح للرسائل المباشرة. أضف كل مشغّل ينبغي أن يوافق — عبر `/approve` أو عبر التفاعلات — إلى `allowFrom`.

    ملاحظات المشغّل:
    - يُخزَّن ربط التفاعل في الذاكرة وفي مخزن Gateway الدائم ذي المفاتيح (مع مطابقة مدة TTL لانتهاء صلاحية الموافقة)، كما يستطلع Gateway المطالبات المعلّقة بحثًا عن ردود tapback، لذلك يظل بإمكان رد tapback يصل بعد وقت قصير من إعادة تشغيل Gateway حسم الموافقة.
    - يحسم رد tapback الخاص بالمشغّل نفسه `is_from_me=true` (على سبيل المثال من جهاز Apple مقترن) الموافقة عندما يكون ذلك المعرّف مُعتمدًا صريحًا.
    - لا تُوجَّه مطالبات الموافقة إلى محادثة جماعية إلا عند تهيئة معتمدين صريحين؛ وإلا فسيتمكن أي عضو في المجموعة من الموافقة.
    - لا يمكن لردود tapback النصية القديمة (`Liked "…"` كنص عادي من عملاء Apple القدامى جدًا) حسم الموافقات لأنها لا تحمل GUID للرسالة؛ إذ يتطلب حسم التفاعل بيانات tapback الوصفية المنظَّمة التي ترسلها عملاء macOS / iOS الحالية.

  </Accordion>
</AccordionGroup>

## عمليات كتابة الإعدادات

تسمح iMessage افتراضيًا بعمليات كتابة الإعدادات التي تبدأها القناة (لأجل `/config set|unset` عندما `commands.config: true`).

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

## دمج الرسائل الخاصة المجزّأة عند الإرسال (أمر + عنوان URL في إنشاء واحد)

عندما يكتب مستخدم أمرًا وعنوان URL معًا — مثل `Dump https://example.com/article` — يقسّم تطبيق Messages من Apple الإرسال إلى **صفَّي `chat.db` منفصلين**:

1. رسالة نصية (`"Dump"`).
2. فقاعة معاينة لعنوان URL‏ (`"https://..."`) تتضمن صور معاينة OG كمرفقات.

يصل الصفّان إلى OpenClaw بفاصل يقارب 0.8-2.0 s في معظم الإعدادات. من دون الدمج، يتلقى الوكيل الأمر وحده في التفاعل 1 (وغالبًا ما يرد «أرسل إليّ عنوان URL») قبل وصول عنوان URL في التفاعل 2. هذا ناتج عن مسار إرسال Apple، وليس شيئًا يضيفه OpenClaw أو `imsg`.

يُدخل `channels.imessage.coalesceSameSenderDms` الرسائل الخاصة في تخزين مؤقت للصفوف المتتالية من المرسل نفسه. عندما يكشف `imsg` علامة معاينة عنوان URL البنيوية `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` في أحد صفوف المصدر، يدمج OpenClaw الإرسال الحقيقي المجزّأ وحده ويُبقي أي صفوف أخرى مخزّنة مؤقتًا كتفاعلات منفصلة. في إصدارات `imsg` الأقدم التي لا ترسل أي بيانات وصفية للفقاعة إطلاقًا، لا يستطيع OpenClaw تمييز الإرسال المجزّأ من عمليات الإرسال المنفصلة، لذا يعود إلى دمج الدفعة. يحافظ ذلك على السلوك السابق للبيانات الوصفية بدلًا من إرجاع عمليات الإرسال المجزّأة في `Dump <url>` إلى تفاعلين. تستمر المحادثات الجماعية في الإرسال لكل رسالة على حدة للحفاظ على بنية التفاعلات متعددة المستخدمين.

<Tabs>
  <Tab title="متى يُفعَّل">
    فعِّله عندما:

    - توفّر skills تتوقع `command + payload` في رسالة واحدة (التفريغ، اللصق، الحفظ، الإدراج في قائمة الانتظار، وما إلى ذلك).
    - يلصق المستخدمون عناوين URL إلى جانب الأوامر.
    - يمكن قبول زمن الاستجابة الإضافي لتفاعل الرسائل الخاصة (انظر أدناه).

    اتركه معطّلًا عندما:

    - تحتاج إلى أدنى زمن استجابة للأوامر في مشغّلات الرسائل الخاصة المكوّنة من كلمة واحدة.
    - تكون جميع التدفقات أوامر تُنفَّذ مرة واحدة من دون حمولات لاحقة.

  </Tab>
  <Tab title="التفعيل">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // تفعيل اختياري (الافتراضي: false)
        },
      },
    }
    ```

    عند تفعيل العلامة وعدم وجود `messages.inbound.byChannel.imessage` صريح أو `messages.inbound.debounceMs` عام، تتسع نافذة إزالة الارتداد إلى **7000 ms** (القيمة الافتراضية القديمة هي 0 ms — من دون إزالة ارتداد). النافذة الأوسع مطلوبة لأن وتيرة الإرسال المجزّأ لمعاينة عنوان URL لدى Apple قد تمتد إلى عدة ثوانٍ أثناء إصدار Messages.app لصف المعاينة.

    لضبط النافذة بنفسك:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // تغطي 7000 ms تأخيرات معاينة عنوان URL الملحوظة في Messages.app.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="المفاضلات">
    - **يتطلب الدمج الدقيق البيانات الوصفية الحالية لحمولة `imsg`.** عند وجود `balloon_bundle_id`، لا يُدمج إلا الإرسال المجزّأ الحقيقي؛ أما الدمج الاحتياطي من دون بيانات وصفية الموصوف أعلاه فهو توافق مؤقت مع الإصدارات السابقة، ويُزال بمجرد أن يدمج `imsg` عمليات الإرسال المجزّأة في المنبع.
    - **زمن استجابة إضافي لرسائل DM.** عند تفعيل العلامة، تنتظر كل رسالة DM (بما في ذلك أوامر التحكم المستقلة والمتابعات النصية المفردة) حتى مدة نافذة إزالة الارتداد قبل الإرسال، تحسبًا لوصول صف معاينة عنوان URL. تحتفظ رسائل المحادثات الجماعية بالإرسال الفوري.
    - **الناتج المدمج محدود.** يُحد النص المدمج عند 4000 محرف مع علامة `…[truncated]` صريحة؛ وتُحد المرفقات عند 20؛ وتُحد إدخالات المصدر عند 10 (مع الاحتفاظ بالأول والأحدث بعد ذلك). ويُتتبَّع كل GUID مصدر في `coalescedMessageGuids` لأغراض القياس عن بُعد في المراحل اللاحقة.
    - **للرسائل الخاصة فقط.** تستخدم المحادثات الجماعية الإرسال لكل رسالة على حدة ليظل الروبوت سريع الاستجابة عند كتابة عدة أشخاص.
    - **تفعيل اختياري لكل قناة.** لا تتأثر القنوات الأخرى (Discord وSlack وTelegram وWhatsApp و…). ينبغي لإعدادات BlueBubbles القديمة التي تضبط `channels.bluebubbles.coalesceSameSenderDms` ترحيل تلك القيمة إلى `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### السيناريوهات وما يراه الوكيل

يعرض عمود «العلامة مفعّلة» السلوك في إصدار `imsg` يرسل `balloon_bundle_id`. في إصدارات `imsg` الأقدم التي لا ترسل أي بيانات وصفية للفقاعة إطلاقًا، تعود الصفوف أدناه المعلَّمة «تفاعلان» / «N من التفاعلات» بدلًا من ذلك إلى الدمج القديم (تفاعل واحد): لا يستطيع OpenClaw بنيويًا تمييز الإرسال المجزّأ من عمليات الإرسال المنفصلة، لذا يحافظ على الدمج السابق للبيانات الوصفية. يبدأ الفصل الدقيق بمجرد أن يرسل الإصدار بيانات وصفية للفقاعة.

| ما ينشئه المستخدم                                                      | ما ينتجه `chat.db`                  | العلامة معطّلة (الافتراضي)                      | العلامة مفعّلة + النافذة (يرسل imsg بيانات وصفية للفقاعة)                                                      |
| ------------------------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (إرسال واحد)                              | صفّان بفاصل ~1 s                   | تفاعلان للوكيل: "Dump" وحده، ثم عنوان URL | تفاعل واحد: النص المدمج `Dump https://example.com`                                                    |
| `Save this 📎image.jpg caption` (مرفق + نص)                | صفّان من دون بيانات وصفية لفقاعة عنوان URL | تفاعلان                               | تفاعلان بعد ملاحظة البيانات الوصفية؛ تفاعل مدمج واحد في الجلسات القديمة/السابقة للرصد والخالية من البيانات الوصفية       |
| `/status` (أمر مستقل)                                     | صف واحد                               | إرسال فوري                        | **الانتظار حتى مدة النافذة، ثم الإرسال**                                                                |
| لصق عنوان URL وحده                                                   | صف واحد                               | إرسال فوري                        | الانتظار حتى مدة النافذة، ثم الإرسال                                                                    |
| إرسال نص + عنوان URL كرسالتين منفصلتين عمدًا، بفاصل دقائق | صفّان خارج النافذة               | تفاعلان                               | تفاعلان (تنتهي النافذة بينهما)                                                             |
| تدفق سريع (>10 رسائل DM صغيرة داخل النافذة)                          | N من الصفوف من دون بيانات وصفية لفقاعة عنوان URL | N من التفاعلات                                 | N من التفاعلات بعد ملاحظة البيانات الوصفية؛ تفاعل مدمج محدود واحد في الجلسات القديمة/السابقة للرصد والخالية من البيانات الوصفية |
| شخصان يكتبان في محادثة جماعية                                  | N من الصفوف من M من المرسلين               | M+ من التفاعلات (واحد لكل دفعة مرسل)        | M+ من التفاعلات — لا تُدمج المحادثات الجماعية                                                            |

## استرداد الرسائل الواردة بعد إعادة تشغيل الجسر أو Gateway

تسترد iMessage الرسائل الفائتة أثناء توقف Gateway، وفي الوقت نفسه تمنع «قنبلة التراكم» القديمة التي قد تفرغها Apple بعد استعادة Push. السلوك الافتراضي مفعّل دائمًا ومبني على إزالة تكرار الوارد.

- **إزالة تكرار إعادة التشغيل.** تُسجَّل كل رسالة واردة تم إرسالها بواسطة GUID الخاص بها لدى Apple في حالة Plugin الدائمة (`imessage.inbound-dedupe`)، وتُحجز عند الإدخال وتُثبَّت بعد المعالجة (ويُحرَّر الحجز عند حدوث فشل عابر لتتمكن من إعادة المحاولة). يُسقط أي شيء سبق التعامل معه بدلًا من إرساله مرتين. وهذا ما يتيح لإعادة الاسترداد أن تعمل بقوة من دون مسك سجلات لكل رسالة.
- **الاسترداد بعد التوقف.** عند بدء التشغيل، تتذكر أداة المراقبة آخر rowid لصف `chat.db` تم إرساله (مؤشر دائم لكل حساب) وتمرره إلى `imsg watch.subscribe` بوصفه `since_rowid`، فيعيد imsg تشغيل الصفوف التي وصلت أثناء توقف Gateway، ثم يتابع الرسائل الحية. تقتصر إعادة التشغيل على أحدث 500 صف وعلى الرسائل التي لا يزيد عمرها على ~2 hours، وتُسقط إزالة التكرار أي شيء سبق التعامل معه.
- **حاجز عمر التراكم القديم.** الصفوف التي تتجاوز حد بدء التشغيل حية فعلًا؛ ويُمنع أي صف يزيد تاريخ إرساله على وقت وصوله بأكثر من ~15 minutes لأنه يمثل التراكم الناتج عن تفريغ Push. أما الصفوف المعاد تشغيلها (عند الحد أو دونه) فتستخدم نافذة الاسترداد الأوسع بدلًا من ذلك، بحيث تُسلَّم الرسالة الفائتة حديثًا بينما لا يُسلَّم السجل القديم.

يعمل الاسترداد عبر إعدادات `cliPath` المحلية والبعيدة على حد سواء، لأن إعادة تشغيل `since_rowid` تعمل عبر اتصال RPC نفسه في `imsg`. يكمن الاختلاف في النافذة: عندما يستطيع Gateway قراءة `chat.db` (محليًا)، فإنه يثبّت حد rowid لبدء التشغيل، ويحد نطاق إعادة التشغيل، ويسلّم الرسائل الفائتة التي يصل عمرها إلى نحو ساعتين. عبر `cliPath` بعيد باستخدام SSH، لا يمكنه قراءة قاعدة البيانات، لذا لا تكون إعادة التشغيل محدودة ويستخدم كل صف حاجز العمر الحي — ويظل يسترد الرسائل الفائتة حديثًا ويمنع التراكم القديم، ولكن ضمن النافذة الحية الأضيق. شغّل Gateway على جهاز Mac الذي يستضيف Messages للحصول على نافذة الاسترداد الأوسع.

### إشارة مرئية للمشغّل

يُسجَّل التراكم الممنوع بالمستوى الافتراضي، ولا يُسقط بصمت أبدًا (توضح علامة `recovery` النافذة المطبقة):

```text
imessage: تم منع تراكم وارد قديم account=<id> sent=<iso> recovery=<bool> (تم منع <N> منذ البدء)
```

### الترحيل

أصبح `channels.imessage.catchup.*` مهمَلًا — فالاسترداد بعد التوقف تلقائي ولا يحتاج إلى إعدادات في عمليات الإعداد الجديدة. تظل الإعدادات الحالية التي تتضمن `catchup.enabled: true` مُحترمة بوصفها ملف توافق لنافذة إعادة تشغيل الاسترداد. أما كتل الاستدراك المعطّلة (`enabled: false` أو عدم وجود `enabled: true`) فقد أُحيلت إلى التقاعد؛ ويزيلها `openclaw doctor --fix`.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="تعذّر العثور على imsg أو RPC غير مدعوم">
    تحقّق من الملف الثنائي ودعم RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    إذا أفاد الفحص بأن RPC غير مدعوم، فحدّث `imsg`. إذا لم تكن إجراءات API الخاصة متاحة، فشغّل `imsg launch` في جلسة مستخدم macOS المسجّل دخوله وأعد الفحص. إذا لم يكن Gateway يعمل على macOS، فاستخدم إعداد جهاز Mac البعيد عبر SSH الوارد أعلاه بدلًا من مسار `imsg` المحلي الافتراضي.

  </Accordion>

  <Accordion title="تُرسل Messages لكن رسائل iMessage الواردة لا تصل">
    أثبت أولًا ما إذا كانت الرسالة قد وصلت إلى جهاز Mac المحلي. إذا لم يتغير `chat.db`، فلن يتمكن OpenClaw من استلام الرسالة حتى عندما يفيد `imsg status --json` بأن الجسر سليم.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    إذا لم تنشئ الرسائل المرسلة من الهاتف صفوفًا جديدة، فأصلح طبقتَي Messages في macOS وApple Push قبل تغيير إعدادات OpenClaw. وغالبًا ما تكفي إعادة تنشيط الخدمات لمرة واحدة:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    أرسل رسالة iMessage جديدة من الهاتف وتأكد من ظهور صف `chat.db` جديد أو حدث `imsg watch` قبل تصحيح أخطاء جلسات OpenClaw. لا تشغّل هذا كحلقة دورية لإعادة تشغيل الجسر؛ فقد تؤدي عمليات `imsg launch` المتكررة إلى جانب إعادة تشغيل Gateway أثناء العمل النشط إلى مقاطعة عمليات التسليم وترك عمليات القناة الجارية عالقة.

  </Accordion>

  <Accordion title="Gateway لا يعمل على macOS">
    يجب تشغيل `cliPath: "imsg"` الافتراضي على جهاز Mac المسجّل الدخول إلى Messages. على Linux أو Windows، اضبط `channels.imessage.cliPath` على برنامج نصي مغلّف يتصل بجهاز Mac هذا عبر SSH ويشغّل `imsg "$@"`.

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
    تحقّق مما يلي:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - موافقات الاقتران (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعة">
    تحقّق مما يلي:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` سلوك قائمة السماح
    - إعداد نمط الإشارة (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="فشل المرفقات البعيدة">
    تحقّق مما يلي:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - مصادقة مفتاح SSH/SCP من مضيف Gateway
    - وجود مفتاح المضيف في `~/.ssh/known_hosts` على مضيف Gateway
    - إمكانية قراءة المسار البعيد على جهاز Mac الذي يشغّل Messages

  </Accordion>

  <Accordion title="تم تفويت مطالبات أذونات macOS">
    أعِد التشغيل في طرفية ذات واجهة رسومية تفاعلية ضمن سياق المستخدم/الجلسة نفسه، ووافق على المطالبات:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    تأكّد من منح صلاحيتَي الوصول الكامل إلى القرص والأتمتة لسياق العملية الذي يشغّل OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## مؤشرات مرجع الإعداد

- [مرجع الإعداد - iMessage](/ar/gateway/config-channels#imessage)
- [إعداد Gateway](/ar/gateway/configuration)
- [الإقران](/ar/channels/pairing)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [إزالة BlueBubbles ومسار iMessage عبر imsg](/ar/announcements/bluebubbles-imessage) — ملخص الإعلان والترحيل
- [الانتقال من BlueBubbles](/ar/channels/imessage-from-bluebubbles) — جدول تحويل الإعداد وخطوات الانتقال التفصيلية
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة ومسار الإقران
- [المجموعات](/ar/channels/groups) — سلوك المحادثات الجماعية وتقييد الاستجابة بالإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتعزيز الأمني
