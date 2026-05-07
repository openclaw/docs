---
read_when:
    - إعداد دعم iMessage
    - تصحيح أخطاء إرسال/استقبال iMessage
summary: دعم iMessage الأصلي عبر imsg (JSON-RPC عبر stdio). يُفضّل لإعدادات OpenClaw iMessage الجديدة عندما تكون متطلبات المضيف مناسبة.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
بالنسبة إلى عمليات نشر OpenClaw iMessage الجديدة، ابدأ من هنا عندما يمكنك تشغيل `imsg` على مضيف macOS Messages مسجّل الدخول. يظل BlueBubbles متاحًا كبديل قديم للإعدادات الحالية التي تعتمد على خادم HTTP أو Webhook أو إجراءات private-API الأكثر ثراءً الخاصة به.
</Note>

الحالة: تكامل CLI خارجي أصلي. يشغّل Gateway الأمر `imsg rpc` ويتواصل عبر JSON-RPC على stdio (من دون خادم daemon/منفذ منفصل).

<CardGroup cols={3}>
  <Card title="BlueBubbles (بديل قديم)" icon="message-circle" href="/ar/channels/bluebubbles">
    واصل استخدامه للتوجيه الحالي المدعوم بـ BlueBubbles؛ وتجنبه في الإعدادات الجديدة عندما يكون imsg مناسبًا.
  </Card>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    تعتمد الرسائل الخاصة في iMessage وضع الإقران افتراضيًا.
  </Card>
  <Card title="مرجع التكوين" icon="settings" href="/ar/gateway/config-channels#imessage">
    مرجع حقول iMessage الكامل.
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
```

      </Step>

      <Step title="كوّن OpenClaw">

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

      <Step title="شغّل gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="اعتمد أول إقران لرسالة خاصة (dmPolicy الافتراضي)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        تنتهي صلاحية طلبات الإقران بعد ساعة واحدة.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac بعيد عبر SSH">
    لا يتطلب OpenClaw إلا `cliPath` متوافقًا مع stdio، لذلك يمكنك توجيه `cliPath` إلى سكربت تغليف يتصل عبر SSH بجهاز Mac بعيد ويشغّل `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    التكوين الموصى به عند تمكين المرفقات:

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

    إذا لم يتم تعيين `remoteHost`، يحاول OpenClaw اكتشافه تلقائيًا عبر تحليل سكربت تغليف SSH.
    يجب أن يكون `remoteHost` على هيئة `host` أو `user@host` (من دون مسافات أو خيارات SSH).
    يستخدم OpenClaw فحص مفاتيح المضيف الصارم لـ SCP، لذلك يجب أن يكون مفتاح مضيف الترحيل موجودًا مسبقًا في `~/.ssh/known_hosts`.
    يتم التحقق من مسارات المرفقات مقابل الجذور المسموح بها (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## المتطلبات والأذونات (macOS)

- يجب تسجيل الدخول إلى Messages على جهاز Mac الذي يشغّل `imsg`.
- يلزم Full Disk Access لسياق العملية الذي يشغّل OpenClaw/`imsg` (للوصول إلى قاعدة بيانات Messages).
- يلزم إذن Automation لإرسال الرسائل عبر Messages.app.

<Tip>
تُمنح الأذونات لكل سياق عملية. إذا كان gateway يعمل بلا واجهة (LaunchAgent/SSH)، فشغّل أمرًا تفاعليًا لمرة واحدة في السياق نفسه لتشغيل المطالبات:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل الخاصة">
    يتحكم `channels.imessage.dmPolicy` في الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    حقل قائمة السماح: `channels.imessage.allowFrom`.

    يمكن أن تكون إدخالات قائمة السماح معرّفات handles أو أهداف دردشة (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`).

  </Tab>

  <Tab title="سياسة المجموعات + الإشارات">
    يتحكم `channels.imessage.groupPolicy` في التعامل مع المجموعات:

    - `allowlist` (افتراضي عند تكوينه)
    - `open`
    - `disabled`

    قائمة سماح مرسلي المجموعات: `channels.imessage.groupAllowFrom`.

    بديل وقت التشغيل: إذا لم يتم تعيين `groupAllowFrom`، تتراجع فحوصات مرسلي مجموعات iMessage إلى `allowFrom` عند توفره.
    ملاحظة وقت التشغيل: إذا كان `channels.imessage` مفقودًا بالكامل، يتراجع وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا تم تعيين `channels.defaults.groupPolicy`).

    ضبط الإشارات في المجموعات:

    - لا يحتوي iMessage على بيانات وصفية أصلية للإشارات
    - يستخدم اكتشاف الإشارات أنماط regex (`agents.list[].groupChat.mentionPatterns`، مع بديل `messages.groupChat.mentionPatterns`)
    - من دون أنماط مكوّنة، لا يمكن فرض ضبط الإشارات

    يمكن لأوامر التحكم من المرسلين المصرح لهم تجاوز ضبط الإشارات في المجموعات.

  </Tab>

  <Tab title="الجلسات والردود الحتمية">
    - تستخدم الرسائل الخاصة التوجيه المباشر؛ وتستخدم المجموعات توجيه المجموعات.
    - مع `session.dmScope=main` الافتراضي، تُدمج رسائل iMessage الخاصة في الجلسة الرئيسية للوكيل.
    - جلسات المجموعات معزولة (`agent:<agentId>:imessage:group:<chat_id>`).
    - تُوجّه الردود مرة أخرى إلى iMessage باستخدام بيانات القناة/الهدف الوصفية الأصلية.

    سلوك السلاسل الشبيهة بالمجموعات:

    يمكن أن تصل بعض سلاسل iMessage متعددة المشاركين مع `is_group=false`.
    إذا تم تكوين `chat_id` ذلك صراحة ضمن `channels.imessage.groups`، يعامله OpenClaw كحركة مرور مجموعة (ضبط المجموعات + عزل جلسات المجموعات).

  </Tab>
</Tabs>

## ربط محادثات ACP

يمكن أيضًا ربط دردشات iMessage القديمة بجلسات ACP.

تدفق المشغّل السريع:

- شغّل `/acp spawn codex --bind here` داخل الرسالة الخاصة أو دردشة المجموعة المسموح بها.
- ستُوجّه الرسائل المستقبلية في محادثة iMessage نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

تُدعم الروابط الدائمة المكوّنة عبر إدخالات `bindings[]` في المستوى الأعلى مع `type: "acp"` و`match.channel: "imessage"`.

يمكن أن يستخدم `match.peer.id`:

- معرّف رسالة خاصة موحّدًا مثل `+15555550123` أو `user@example.com`
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
  <Accordion title="مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)">
    استخدم Apple ID ومستخدم macOS مخصصين بحيث تكون حركة مرور البوت معزولة عن ملف Messages الشخصي لديك.

    التدفق المعتاد:

    1. أنشئ/سجّل الدخول إلى مستخدم macOS مخصص.
    2. سجّل الدخول إلى Messages باستخدام Apple ID الخاص بالبوت في ذلك المستخدم.
    3. ثبّت `imsg` في ذلك المستخدم.
    4. أنشئ سكربت تغليف SSH حتى يتمكن OpenClaw من تشغيل `imsg` في سياق ذلك المستخدم.
    5. وجّه `channels.imessage.accounts.<id>.cliPath` و`.dbPath` إلى ملف ذلك المستخدم الشخصي.

    قد يتطلب التشغيل الأول موافقات GUI (Automation + Full Disk Access) في جلسة مستخدم البوت تلك.

  </Accordion>

  <Accordion title="Mac بعيد عبر Tailscale (مثال)">
    البنية الشائعة:

    - يعمل gateway على Linux/VM
    - يعمل iMessage + `imsg` على Mac داخل tailnet الخاصة بك
    - يستخدم مغلّف `cliPath` SSH لتشغيل `imsg`
    - يمكّن `remoteHost` جلب مرفقات SCP

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
    تأكد أولًا من الوثوق بمفتاح المضيف (على سبيل المثال `ssh bot@mac-mini.tailnet-1234.ts.net`) حتى تتم تعبئة `known_hosts`.

  </Accordion>

  <Accordion title="نمط الحسابات المتعددة">
    يدعم iMessage التكوين لكل حساب ضمن `channels.imessage.accounts`.

    يمكن لكل حساب تجاوز حقول مثل `cliPath` و`dbPath` و`allowFrom` و`groupPolicy` و`mediaMaxMb` وإعدادات السجل وقوائم السماح بجذور المرفقات.

  </Accordion>
</AccordionGroup>

## الوسائط، والتقسيم إلى أجزاء، وأهداف التسليم

<AccordionGroup>
  <Accordion title="المرفقات والوسائط">
    - استيعاب المرفقات الواردة اختياري: `channels.imessage.includeAttachments`
    - يمكن جلب مسارات المرفقات البعيدة عبر SCP عند تعيين `remoteHost`
    - يجب أن تطابق مسارات المرفقات الجذور المسموح بها:
      - `channels.imessage.attachmentRoots` (محلي)
      - `channels.imessage.remoteAttachmentRoots` (وضع SCP البعيد)
      - نمط الجذر الافتراضي: `/Users/*/Library/Messages/Attachments`
    - يستخدم SCP فحص مفاتيح المضيف الصارم (`StrictHostKeyChecking=yes`)
    - يستخدم حجم الوسائط الصادرة `channels.imessage.mediaMaxMb` (افتراضي 16 MB)

  </Accordion>

  <Accordion title="تقسيم الصادر إلى أجزاء">
    - حد أجزاء النص: `channels.imessage.textChunkLimit` (افتراضي 4000)
    - وضع التقسيم إلى أجزاء: `channels.imessage.chunkMode`
      - `length` (افتراضي)
      - `newline` (تقسيم يقدّم الفقرات أولًا)

  </Accordion>

  <Accordion title="تنسيقات العنونة">
    الأهداف الصريحة المفضلة:

    - `chat_id:123` (موصى به للتوجيه المستقر)
    - `chat_guid:...`
    - `chat_identifier:...`

    أهداف handles مدعومة أيضًا:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## عمليات كتابة التكوين

يسمح iMessage افتراضيًا بعمليات كتابة التكوين التي تبدأها القناة (لـ `/config set|unset` عندما تكون `commands.config: true`).

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
    تحقق من الملف الثنائي ودعم RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    إذا أبلغ الفحص أن RPC غير مدعوم، فحدّث `imsg`.

  </Accordion>

  <Accordion title="يتم تجاهل الرسائل الخاصة">
    تحقق من:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - موافقات الإقران (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="يتم تجاهل رسائل المجموعات">
    تحقق من:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - سلوك قائمة السماح في `channels.imessage.groups`
    - تكوين نمط الإشارات (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="تفشل المرفقات البعيدة">
    تحقق من:

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

    أكّد منح Full Disk Access + Automation لسياق العملية الذي يشغّل OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## مؤشرات مرجع التكوين

- [مرجع التكوين - iMessage](/ar/gateway/config-channels#imessage)
- [تكوين Gateway](/ar/gateway/configuration)
- [الإقران](/ar/channels/pairing)
- [BlueBubbles](/ar/channels/bluebubbles)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتحصين
