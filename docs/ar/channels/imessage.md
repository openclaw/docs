---
read_when:
    - إعداد دعم iMessage
    - تصحيح أخطاء الإرسال/الاستقبال في iMessage
summary: دعم iMessage القديم عبر imsg ‏(JSON-RPC عبر stdio). يجب أن تستخدم الإعدادات الجديدة BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-25T13:41:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b693b222ab60fe9fee8be47ec4b347ba126f11558888d336220e39425023dcd
    source_path: channels/imessage.md
    workflow: 15
---

<Warning>
بالنسبة إلى عمليات نشر iMessage الجديدة، استخدم <a href="/ar/channels/bluebubbles">BlueBubbles</a>.

تكامل `imsg` قديم وقد تتم إزالته في إصدار مستقبلي.
</Warning>

الحالة: تكامل CLI خارجي قديم. تقوم Gateway بتشغيل `imsg rpc` وتتواصل عبر JSON-RPC على stdio (من دون daemon/منفذ منفصل).

<CardGroup cols={3}>
  <Card title="BlueBubbles (موصى به)" icon="message-circle" href="/ar/channels/bluebubbles">
    المسار المفضل لـ iMessage في الإعدادات الجديدة.
  </Card>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل المباشرة في iMessage وضع الاقتران افتراضيًا.
  </Card>
  <Card title="مرجع الإعداد" icon="settings" href="/ar/gateway/config-channels#imessage">
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

      <Step title="تكوين OpenClaw">

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

      <Step title="بدء تشغيل Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="الموافقة على أول اقتران للرسائل المباشرة (سياسة dmPolicy الافتراضية)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        تنتهي صلاحية طلبات الاقتران بعد ساعة واحدة.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac بعيد عبر SSH">
    يتطلب OpenClaw فقط `cliPath` متوافقًا مع stdio، لذلك يمكنك توجيه `cliPath` إلى نص wrapper برمجي يستخدم SSH إلى Mac بعيد ويشغّل `imsg`.

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
      // اختياري: تجاوز جذور المرفقات المسموح بها.
      // تتضمن القيم الافتراضية /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    إذا لم يتم تعيين `remoteHost`، يحاول OpenClaw اكتشافه تلقائيًا عبر تحليل نص wrapper الخاص بـ SSH.
    يجب أن تكون قيمة `remoteHost` بالشكل `host` أو `user@host` (من دون مسافات أو خيارات SSH).
    يستخدم OpenClaw التحقق الصارم من مفتاح المضيف في SCP، لذا يجب أن يكون مفتاح مضيف relay موجودًا مسبقًا في `~/.ssh/known_hosts`.
    يتم التحقق من مسارات المرفقات مقابل الجذور المسموح بها (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## المتطلبات والأذونات (macOS)

- يجب أن يكون تطبيق Messages قد سُجّل الدخول إليه على جهاز Mac الذي يشغّل `imsg`.
- يلزم منح Full Disk Access لسياق العملية الذي يشغّل OpenClaw/`imsg` (للوصول إلى قاعدة بيانات Messages).
- يلزم منح إذن Automation لإرسال الرسائل عبر Messages.app.

<Tip>
تُمنح الأذونات لكل سياق عملية على حدة. إذا كانت Gateway تعمل من دون واجهة (LaunchAgent/SSH)، فشغّل أمرًا تفاعليًا لمرة واحدة ضمن السياق نفسه لتفعيل المطالبات:

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

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    حقل قائمة السماح: `channels.imessage.allowFrom`.

    يمكن أن تكون إدخالات قائمة السماح معرّفات handles أو أهداف دردشة (`chat_id:*` أو `chat_guid:*` أو `chat_identifier:*`).

  </Tab>

  <Tab title="سياسة المجموعات + الإشارات">
    يتحكم `channels.imessage.groupPolicy` في التعامل مع المجموعات:

    - `allowlist` (افتراضي عند التكوين)
    - `open`
    - `disabled`

    قائمة السماح لمرسلي المجموعات: `channels.imessage.groupAllowFrom`.

    الاحتياط في وقت التشغيل: إذا لم يتم تعيين `groupAllowFrom`، تعود عمليات التحقق من مرسلي مجموعات iMessage إلى `allowFrom` عند توفرها.
    ملاحظة وقت التشغيل: إذا كان `channels.imessage` مفقودًا بالكامل، يعود وقت التشغيل إلى `groupPolicy="allowlist"` ويسجل تحذيرًا (حتى إذا تم تعيين `channels.defaults.groupPolicy`).

    تقييد الإشارات في المجموعات:

    - لا يحتوي iMessage على بيانات تعريف أصلية للإشارات
    - يستخدم اكتشاف الإشارات أنماط regex ‏(`agents.list[].groupChat.mentionPatterns`، والاحتياط هو `messages.groupChat.mentionPatterns`)
    - من دون أنماط مكوّنة، لا يمكن فرض تقييد الإشارات

    يمكن لأوامر التحكم من المرسلين المصرح لهم تجاوز تقييد الإشارات في المجموعات.

  </Tab>

  <Tab title="الجلسات والردود الحتمية">
    - تستخدم الرسائل المباشرة توجيهًا مباشرًا؛ وتستخدم المجموعات توجيه المجموعات.
    - مع الإعداد الافتراضي `session.dmScope=main`، تندمج الرسائل المباشرة في iMessage ضمن الجلسة الرئيسية للوكيل.
    - تكون جلسات المجموعات معزولة (`agent:<agentId>:imessage:group:<chat_id>`).
    - تُوجَّه الردود مرة أخرى إلى iMessage باستخدام بيانات التعريف الخاصة بالقناة/الهدف الأصلي.

    سلوك سلاسل المحادثات الشبيهة بالمجموعات:

    قد تصل بعض سلاسل iMessage متعددة المشاركين بالقيمة `is_group=false`.
    إذا تم تكوين ذلك `chat_id` صراحةً ضمن `channels.imessage.groups`، يتعامل OpenClaw معه كحركة مرور مجموعة (تقييد مجموعات + عزل جلسة المجموعة).

  </Tab>
</Tabs>

## ارتباطات محادثات ACP

يمكن أيضًا ربط محادثات iMessage القديمة بجلسات ACP.

تدفق تشغيل سريع:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو دردشة المجموعة المسموح بها.
- تُوجَّه الرسائل المستقبلية في محادثة iMessage نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد `/new` و`/reset` تعيين جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الارتباط.

يتم دعم الارتباطات الدائمة المكوّنة عبر إدخالات `bindings[]` من المستوى الأعلى مع `type: "acp"` و`match.channel: "imessage"`.

يمكن أن يستخدم `match.peer.id` ما يلي:

- معرّف رسالة مباشرة مُطبَّع مثل `+15555550123` أو `user@example.com`
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

راجع [وكلاء ACP](/ar/tools/acp-agents) للاطلاع على سلوك ارتباط ACP المشترك.

## أنماط النشر

<AccordionGroup>
  <Accordion title="مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)">
    استخدم Apple ID ومستخدم macOS مخصصين بحيث تكون حركة مرور البوت معزولة عن ملف Messages الشخصي الخاص بك.

    التدفق المعتاد:

    1. أنشئ مستخدم macOS مخصصًا وسجّل الدخول إليه.
    2. سجّل الدخول إلى Messages باستخدام Apple ID الخاص بالبوت ضمن ذلك المستخدم.
    3. ثبّت `imsg` ضمن ذلك المستخدم.
    4. أنشئ wrapper عبر SSH حتى يتمكن OpenClaw من تشغيل `imsg` ضمن سياق ذلك المستخدم.
    5. وجّه `channels.imessage.accounts.<id>.cliPath` و`.dbPath` إلى ملف ذلك المستخدم الشخصي.

    قد يتطلب التشغيل الأول موافقات من واجهة المستخدم الرسومية (Automation + Full Disk Access) ضمن جلسة مستخدم البوت.

  </Accordion>

  <Accordion title="Mac بعيد عبر Tailscale (مثال)">
    البنية الشائعة:

    - تعمل Gateway على Linux/VM
    - يعمل iMessage و`imsg` على Mac داخل tailnet الخاص بك
    - يستخدم wrapper الخاص بـ `cliPath` بروتوكول SSH لتشغيل `imsg`
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

    استخدم مفاتيح SSH حتى يكون كل من SSH وSCP غير تفاعليين.
    تأكد من الوثوق بمفتاح المضيف أولاً (على سبيل المثال `ssh bot@mac-mini.tailnet-1234.ts.net`) بحيث يتم ملء `known_hosts`.

  </Accordion>

  <Accordion title="نمط الحسابات المتعددة">
    يدعم iMessage الإعداد لكل حساب ضمن `channels.imessage.accounts`.

    يمكن لكل حساب تجاوز حقول مثل `cliPath` و`dbPath` و`allowFrom` و`groupPolicy` و`mediaMaxMb` وإعدادات السجل وقوائم السماح بجذور المرفقات.

  </Accordion>
</AccordionGroup>

## الوسائط والتجزئة وأهداف التسليم

<AccordionGroup>
  <Accordion title="المرفقات والوسائط">
    - استيعاب المرفقات الواردة اختياري: `channels.imessage.includeAttachments`
    - يمكن جلب مسارات المرفقات البعيدة عبر SCP عند تعيين `remoteHost`
    - يجب أن تطابق مسارات المرفقات الجذور المسموح بها:
      - `channels.imessage.attachmentRoots` (محلي)
      - `channels.imessage.remoteAttachmentRoots` (وضع SCP البعيد)
      - نمط الجذر الافتراضي: `/Users/*/Library/Messages/Attachments`
    - يستخدم SCP التحقق الصارم من مفتاح المضيف (`StrictHostKeyChecking=yes`)
    - يستخدم حجم الوسائط الصادرة `channels.imessage.mediaMaxMb` (الافتراضي 16 MB)

  </Accordion>

  <Accordion title="تجزئة الرسائل الصادرة">
    - حد تجزئة النص: `channels.imessage.textChunkLimit` (الافتراضي 4000)
    - وضع التجزئة: `channels.imessage.chunkMode`
      - `length` (افتراضي)
      - `newline` (تقسيم يبدأ بالفقرات)

  </Accordion>

  <Accordion title="تنسيقات العنونة">
    الأهداف الصريحة المفضلة:

    - `chat_id:123` (موصى به لتوجيه مستقر)
    - `chat_guid:...`
    - `chat_identifier:...`

    كما يتم دعم أهداف handles:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## كتابات الإعداد

يسمح iMessage افتراضيًا بكتابات الإعداد التي تبدأ من القناة (بالنسبة إلى `/config set|unset` عندما تكون `commands.config: true`).

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
    - سلوك قائمة السماح في `channels.imessage.groups`
    - إعداد أنماط الإشارات (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="فشل المرفقات البعيدة">
    تحقّق من:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - مصادقة المفتاح لـ SSH/SCP من مضيف Gateway
    - وجود مفتاح المضيف في `~/.ssh/known_hosts` على مضيف Gateway
    - إمكانية قراءة المسار البعيد على جهاز Mac الذي يشغّل Messages

  </Accordion>

  <Accordion title="تم تفويت مطالبات أذونات macOS">
    أعد التشغيل في طرفية GUI تفاعلية ضمن سياق المستخدم/الجلسة نفسها، ثم وافق على المطالبات:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    أكّد منح Full Disk Access وAutomation لسياق العملية الذي يشغّل OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## مؤشرات مرجع الإعداد

- [مرجع الإعداد - iMessage](/ar/gateway/config-channels#imessage)
- [إعداد Gateway](/ar/gateway/configuration)
- [الاقتران](/ar/channels/pairing)
- [BlueBubbles](/ar/channels/bluebubbles)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
