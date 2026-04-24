---
read_when:
    - إعداد دعم iMessage
    - تصحيح أخطاء الإرسال/الاستقبال في iMessage
summary: دعم iMessage القديم عبر imsg ‏(JSON-RPC عبر stdio). يجب أن تستخدم الإعدادات الجديدة BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-24T07:30:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff2773ebcfced8834bc5d28378d9a6e3c20826cc0e08d6ea5480f8a5975fd8e3
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (قديم: imsg)

<Warning>
بالنسبة لعمليات نشر iMessage الجديدة، استخدم <a href="/ar/channels/bluebubbles">BlueBubbles</a>.

تكامل `imsg` قديم وقد يُزال في إصدار مستقبلي.
</Warning>

الحالة: تكامل CLI خارجي قديم. يقوم Gateway بتشغيل `imsg rpc` والتواصل عبر JSON-RPC على stdio (من دون daemon/منفذ منفصل).

<CardGroup cols={3}>
  <Card title="BlueBubbles (موصى به)" icon="message-circle" href="/ar/channels/bluebubbles">
    مسار iMessage المفضل للإعدادات الجديدة.
  </Card>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل المباشرة في iMessage وضع الاقتران افتراضيًا.
  </Card>
  <Card title="مرجع الإعدادات" icon="settings" href="/ar/gateway/config-channels#imessage">
    المرجع الكامل لحقول iMessage.
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

      <Step title="بدء gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="الموافقة على أول اقتران رسالة مباشرة (سياسة dmPolicy الافتراضية)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac بعيد عبر SSH">
    لا يتطلب OpenClaw سوى `cliPath` متوافق مع stdio، لذلك يمكنك توجيه `cliPath` إلى نص wrapper برمجي يستخدم SSH إلى جهاز Mac بعيد ويشغّل `imsg`.

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
      remoteHost: "user@gateway-host", // يُستخدم لجلب المرفقات عبر SCP
      includeAttachments: true,
      // اختياري: تجاوز الجذور المسموح بها للمرفقات.
      // تتضمن القيم الافتراضية ‎/Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    إذا لم يتم تعيين `remoteHost`، فسيحاول OpenClaw اكتشافه تلقائيًا عبر تحليل نص SSH wrapper البرمجي.
    يجب أن يكون `remoteHost` بصيغة `host` أو `user@host` (من دون مسافات أو خيارات SSH).
    يستخدم OpenClaw تحققًا صارمًا من مفتاح المضيف لـ SCP، لذلك يجب أن يكون مفتاح مضيف relay موجودًا بالفعل في `~/.ssh/known_hosts`.
    يتم التحقق من مسارات المرفقات مقابل الجذور المسموح بها (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## المتطلبات والأذونات (macOS)

- يجب أن يكون Messages مسجّل الدخول على جهاز Mac الذي يشغّل `imsg`.
- يلزم Full Disk Access لسياق العملية الذي يشغّل OpenClaw/`imsg` (للوصول إلى قاعدة بيانات Messages).
- يلزم إذن Automation لإرسال الرسائل عبر Messages.app.

<Tip>
تُمنح الأذونات لكل سياق عملية على حدة. إذا كان gateway يعمل بلا واجهة (LaunchAgent/SSH)، فشغّل أمرًا تفاعليًا لمرة واحدة في هذا السياق نفسه لتفعيل مطالبات الأذونات:

```bash
imsg chats --limit 1
# أو
imsg send <handle> "test"
```

</Tip>

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.imessage.dmPolicy` في الرسائل المباشرة:

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    حقل allowlist: ‏`channels.imessage.allowFrom`.

    يمكن أن تكون إدخالات allowlist مقابض أو أهداف دردشة (`chat_id:*` و`chat_guid:*` و`chat_identifier:*`).

  </Tab>

  <Tab title="سياسة المجموعات + الإشارات">
    يتحكم `channels.imessage.groupPolicy` في التعامل مع المجموعات:

    - `allowlist` (الافتراضي عند الإعداد)
    - `open`
    - `disabled`

    allowlist مرسلي المجموعة: ‏`channels.imessage.groupAllowFrom`.

    الرجوع الاحتياطي في وقت التشغيل: إذا لم يتم تعيين `groupAllowFrom`، فإن عمليات التحقق من مرسلي مجموعات iMessage تعود إلى `allowFrom` عند توفره.
    ملاحظة وقت التشغيل: إذا كان `channels.imessage` مفقودًا بالكامل، فإن وقت التشغيل يعود إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى لو كان `channels.defaults.groupPolicy` معيّنًا).

    تقييد الإشارات للمجموعات:

    - لا يحتوي iMessage على بيانات وصفية أصلية للإشارات
    - يَستخدم اكتشاف الإشارات أنماط regex (`agents.list[].groupChat.mentionPatterns`، مع رجوع احتياطي إلى `messages.groupChat.mentionPatterns`)
    - من دون أنماط مهيأة، لا يمكن فرض تقييد الإشارات

    يمكن لأوامر التحكم من المرسلين المصرح لهم تجاوز تقييد الإشارات في المجموعات.

  </Tab>

  <Tab title="الجلسات والردود الحتمية">
    - تستخدم الرسائل المباشرة التوجيه المباشر؛ وتستخدم المجموعات توجيه المجموعات.
    - مع الإعداد الافتراضي `session.dmScope=main`، تندمج الرسائل المباشرة في iMessage ضمن الجلسة الرئيسية للوكيل.
    - جلسات المجموعات معزولة (`agent:<agentId>:imessage:group:<chat_id>`).
    - تُوجَّه الردود مرة أخرى إلى iMessage باستخدام البيانات الوصفية الخاصة بالقناة/الهدف الأصلي.

    سلوك السلاسل الشبيه بالمجموعات:

    قد تصل بعض سلاسل iMessage متعددة المشاركين بالقيمة `is_group=false`.
    إذا كان `chat_id` هذا مهيأً صراحة ضمن `channels.imessage.groups`، فسيتعامل OpenClaw معه على أنه حركة مرور مجموعة (تقييد مجموعة + عزل جلسة المجموعة).

  </Tab>
</Tabs>

## ارتباطات محادثات ACP

يمكن أيضًا ربط دردشات iMessage القديمة بجلسات ACP.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو دردشة المجموعة المسموح بها.
- تُوجَّه الرسائل المستقبلية في محادثة iMessage نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يُغلق `/acp close` جلسة ACP ويزيل الارتباط.

تُدعَم الارتباطات الدائمة المهيأة من خلال إدخالات `bindings[]` ذات المستوى الأعلى مع `type: "acp"` و`match.channel: "imessage"`.

يمكن أن يستخدم `match.peer.id` ما يلي:

- مقبض رسالة مباشرة مُطبَّع مثل `+15555550123` أو `user@example.com`
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

راجع [وكلاء ACP](/ar/tools/acp-agents) للاطلاع على سلوك ارتباطات ACP المشتركة.

## أنماط النشر

<AccordionGroup>
  <Accordion title="مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)">
    استخدم Apple ID ومستخدم macOS مخصصين بحيث تكون حركة مرور البوت معزولة عن ملف Messages الشخصي لديك.

    التدفق النموذجي:

    1. أنشئ/سجّل الدخول إلى مستخدم macOS مخصص.
    2. سجّل الدخول إلى Messages باستخدام Apple ID الخاص بالبوت في هذا المستخدم.
    3. ثبّت `imsg` لهذا المستخدم.
    4. أنشئ SSH wrapper بحيث يتمكن OpenClaw من تشغيل `imsg` ضمن سياق هذا المستخدم.
    5. وجّه `channels.imessage.accounts.<id>.cliPath` و`.dbPath` إلى ملف تعريف هذا المستخدم.

    قد يتطلب التشغيل الأول موافقات GUI (Automation + Full Disk Access) في جلسة مستخدم البوت.

  </Accordion>

  <Accordion title="Mac بعيد عبر Tailscale (مثال)">
    البنية الشائعة:

    - يعمل gateway على Linux/VM
    - يعمل iMessage و`imsg` على جهاز Mac ضمن tailnet لديك
    - يستخدم wrapper الخاص بـ `cliPath` SSH لتشغيل `imsg`
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

    استخدم مفاتيح SSH بحيث يكون كل من SSH وSCP غير تفاعليين.
    تأكد أولًا من الوثوق بمفتاح المضيف (على سبيل المثال `ssh bot@mac-mini.tailnet-1234.ts.net`) بحيث تتم تعبئة `known_hosts`.

  </Accordion>

  <Accordion title="نمط الحسابات المتعددة">
    يدعم iMessage الإعداد لكل حساب ضمن `channels.imessage.accounts`.

    يمكن لكل حساب تجاوز حقول مثل `cliPath` و`dbPath` و`allowFrom` و`groupPolicy` و`mediaMaxMb` وإعدادات السجل وallowlists جذور المرفقات.

  </Accordion>
</AccordionGroup>

## الوسائط، والتجزئة، وأهداف التسليم

<AccordionGroup>
  <Accordion title="المرفقات والوسائط">
    - يكون استيعاب المرفقات الواردة اختياريًا: `channels.imessage.includeAttachments`
    - يمكن جلب مسارات المرفقات البعيدة عبر SCP عند تعيين `remoteHost`
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
      - `newline` (التقسيم حسب الفقرات أولًا)
  </Accordion>

  <Accordion title="صيغ العنونة">
    الأهداف الصريحة المفضلة:

    - `chat_id:123` (موصى به للتوجيه المستقر)
    - `chat_guid:...`
    - `chat_identifier:...`

    كما أن أهداف المقابض مدعومة أيضًا:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## عمليات كتابة الإعدادات

يسمح iMessage افتراضيًا بعمليات كتابة الإعدادات التي تبدأها القناة (من أجل `/config set|unset` عندما يكون `commands.config: true`).

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

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم يتم العثور على imsg أو أن RPC غير مدعوم">
    تحقّق من الملف التنفيذي ودعم RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    إذا أبلغ الفحص أن RPC غير مدعوم، فحدّث `imsg`.

  </Accordion>

  <Accordion title="يتم تجاهل الرسائل المباشرة">
    تحقّق من:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - موافقات الاقتران (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعات">
    تحقّق من:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - سلوك allowlist في `channels.imessage.groups`
    - إعداد أنماط الإشارات (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="تفشل المرفقات البعيدة">
    تحقّق من:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - مصادقة مفاتيح SSH/SCP من مضيف gateway
    - وجود مفتاح المضيف في `~/.ssh/known_hosts` على مضيف gateway
    - قابلية قراءة المسار البعيد على جهاز Mac الذي يشغّل Messages

  </Accordion>

  <Accordion title="تم تفويت مطالبات أذونات macOS">
    أعد التشغيل في طرفية GUI تفاعلية ضمن سياق المستخدم/الجلسة نفسه ووافق على المطالبات:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    أكّد منح Full Disk Access وAutomation لسياق العملية الذي يشغّل OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## مؤشرات مرجع الإعدادات

- [مرجع الإعدادات - iMessage](/ar/gateway/config-channels#imessage)
- [إعدادات Gateway](/ar/gateway/configuration)
- [الاقتران](/ar/channels/pairing)
- [BlueBubbles](/ar/channels/bluebubbles)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — المصادقة على الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشات المجموعات وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
