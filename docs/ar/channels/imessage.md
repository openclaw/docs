---
read_when:
    - إعداد دعم iMessage
    - استكشاف أخطاء إرسال/استقبال iMessage وإصلاحها
summary: دعم iMessage القديم عبر imsg (JSON-RPC عبر stdio). ينبغي أن تستخدم عمليات الإعداد الجديدة BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-30T07:41:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60eeb3553a6511d56b8177ca4eafbedfed2d0852ac64c230c250911cd18ce17e
    source_path: channels/imessage.md
    workflow: 16
---

<Warning>
لعمليات نشر iMessage الجديدة، استخدم <a href="/ar/channels/bluebubbles">BlueBubbles</a>.

تكامل `imsg` قديم وقد تتم إزالته في إصدار مستقبلي.
</Warning>

الحالة: تكامل CLI خارجي قديم. يشغّل Gateway الأمر `imsg rpc` ويتواصل عبر JSON-RPC على stdio (بدون خادم daemon/منفذ منفصل).

<CardGroup cols={3}>
  <Card title="BlueBubbles (موصى به)" icon="message-circle" href="/ar/channels/bluebubbles">
    مسار iMessage المفضل للإعدادات الجديدة.
  </Card>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    رسائل iMessage المباشرة تستخدم وضع الإقران افتراضياً.
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

      <Step title="وافق على إقران أول رسالة مباشرة (dmPolicy الافتراضي)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        تنتهي صلاحية طلبات الإقران بعد ساعة واحدة.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac بعيد عبر SSH">
    يتطلب OpenClaw فقط `cliPath` متوافقاً مع stdio، لذلك يمكنك توجيه `cliPath` إلى سكربت غلاف يستخدم SSH إلى Mac بعيد ويشغّل `imsg`.

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

    إذا لم يتم ضبط `remoteHost`، يحاول OpenClaw اكتشافه تلقائياً عن طريق تحليل سكربت غلاف SSH.
    يجب أن يكون `remoteHost` بالشكل `host` أو `user@host` (بدون مسافات أو خيارات SSH).
    يستخدم OpenClaw فحصاً صارماً لمفتاح المضيف مع SCP، لذلك يجب أن يكون مفتاح مضيف الترحيل موجوداً مسبقاً في `~/.ssh/known_hosts`.
    يتم التحقق من مسارات المرفقات مقابل الجذور المسموح بها (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## المتطلبات والأذونات (macOS)

- يجب تسجيل الدخول إلى Messages على Mac الذي يشغّل `imsg`.
- يلزم Full Disk Access لسياق العملية الذي يشغّل OpenClaw/`imsg` (للوصول إلى قاعدة بيانات Messages).
- يلزم إذن Automation لإرسال الرسائل عبر Messages.app.

<Tip>
تُمنح الأذونات لكل سياق عملية. إذا كان Gateway يعمل بدون واجهة (LaunchAgent/SSH)، فشغّل أمراً تفاعلياً لمرة واحدة في السياق نفسه لتشغيل المطالبات:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.imessage.dmPolicy` في الرسائل المباشرة:

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `allowFrom` القيمة `"*"`)
    - `disabled`

    حقل قائمة السماح: `channels.imessage.allowFrom`.

    يمكن أن تكون إدخالات قائمة السماح معرّفات أو أهداف دردشة (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`).

  </Tab>

  <Tab title="سياسة المجموعات + الإشارات">
    يتحكم `channels.imessage.groupPolicy` في معالجة المجموعات:

    - `allowlist` (الافتراضي عند ضبطه)
    - `open`
    - `disabled`

    قائمة السماح لمرسلي المجموعات: `channels.imessage.groupAllowFrom`.

    الرجوع أثناء التشغيل: إذا لم يتم ضبط `groupAllowFrom`، ترجع فحوصات مرسل مجموعة iMessage إلى `allowFrom` عند توفره.
    ملاحظة وقت التشغيل: إذا كان `channels.imessage` مفقوداً بالكامل، يرجع وقت التشغيل إلى `groupPolicy="allowlist"` ويسجّل تحذيراً (حتى إذا كان `channels.defaults.groupPolicy` مضبوطاً).

    بوابة الإشارات للمجموعات:

    - لا يحتوي iMessage على بيانات وصفية أصلية للإشارات
    - يستخدم اكتشاف الإشارات أنماط regex (`agents.list[].groupChat.mentionPatterns`، مع الرجوع إلى `messages.groupChat.mentionPatterns`)
    - بدون أنماط مضبوطة، لا يمكن فرض بوابة الإشارات

    يمكن لأوامر التحكم من المرسلين المصرح لهم تجاوز بوابة الإشارات في المجموعات.

  </Tab>

  <Tab title="الجلسات والردود الحتمية">
    - تستخدم الرسائل المباشرة التوجيه المباشر؛ وتستخدم المجموعات توجيه المجموعات.
    - مع `session.dmScope=main` الافتراضي، تندمج رسائل iMessage المباشرة في الجلسة الرئيسية للوكيل.
    - جلسات المجموعات معزولة (`agent:<agentId>:imessage:group:<chat_id>`).
    - يتم توجيه الردود مرة أخرى إلى iMessage باستخدام بيانات القناة/الهدف الأصلية.

    سلوك سلاسل المحادثات الشبيهة بالمجموعات:

    قد تصل بعض سلاسل iMessage متعددة المشاركين مع `is_group=false`.
    إذا كان ذلك `chat_id` مضبوطاً صراحةً ضمن `channels.imessage.groups`، يتعامل معه OpenClaw كحركة مرور جماعية (بوابة المجموعات + عزل جلسات المجموعات).

  </Tab>
</Tabs>

## روابط محادثات ACP

يمكن أيضاً ربط دردشات iMessage القديمة بجلسات ACP.

تدفق سريع للمشغل:

- شغّل `/acp spawn codex --bind here` داخل الرسالة المباشرة أو دردشة المجموعة المسموح بها.
- تُوجَّه الرسائل المستقبلية في محادثة iMessage نفسها إلى جلسة ACP التي تم إنشاؤها.
- يعيد `/new` و`/reset` ضبط جلسة ACP المرتبطة نفسها في مكانها.
- يغلق `/acp close` جلسة ACP ويزيل الربط.

تُدعم الروابط الدائمة المضبوطة من خلال إدخالات `bindings[]` على المستوى الأعلى مع `type: "acp"` و`match.channel: "imessage"`.

يمكن أن يستخدم `match.peer.id`:

- معرّف رسالة مباشرة موحّد مثل `+15555550123` أو `user@example.com`
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

راجع [وكلاء ACP](/ar/tools/acp-agents) لسلوك ربط ACP المشترك.

## أنماط النشر

<AccordionGroup>
  <Accordion title="مستخدم macOS مخصص للبوت (هوية iMessage منفصلة)">
    استخدم Apple ID مخصصاً ومستخدم macOS مخصصاً بحيث تكون حركة مرور البوت معزولة عن ملف Messages الشخصي الخاص بك.

    التدفق المعتاد:

    1. أنشئ/سجّل الدخول إلى مستخدم macOS مخصص.
    2. سجّل الدخول إلى Messages باستخدام Apple ID الخاص بالبوت في ذلك المستخدم.
    3. ثبّت `imsg` في ذلك المستخدم.
    4. أنشئ غلاف SSH حتى يتمكن OpenClaw من تشغيل `imsg` في سياق ذلك المستخدم.
    5. وجّه `channels.imessage.accounts.<id>.cliPath` و`.dbPath` إلى ملف ذلك المستخدم الشخصي.

    قد يتطلب التشغيل الأول موافقات واجهة رسومية (Automation + Full Disk Access) في جلسة مستخدم البوت.

  </Accordion>

  <Accordion title="Mac بعيد عبر Tailscale (مثال)">
    البنية الشائعة:

    - يعمل Gateway على Linux/VM
    - يعمل iMessage + `imsg` على Mac في tailnet الخاص بك
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

    استخدم مفاتيح SSH حتى يكون كل من SSH وSCP غير تفاعليين.
    تأكد أولاً من أن مفتاح المضيف موثوق به (على سبيل المثال `ssh bot@mac-mini.tailnet-1234.ts.net`) حتى تتم تعبئة `known_hosts`.

  </Accordion>

  <Accordion title="نمط الحسابات المتعددة">
    يدعم iMessage إعداداً لكل حساب ضمن `channels.imessage.accounts`.

    يمكن لكل حساب تجاوز حقول مثل `cliPath`، و`dbPath`، و`allowFrom`، و`groupPolicy`، و`mediaMaxMb`، وإعدادات السجل، وقوائم السماح لجذور المرفقات.

  </Accordion>
</AccordionGroup>

## الوسائط، والتقسيم، وأهداف التسليم

<AccordionGroup>
  <Accordion title="المرفقات والوسائط">
    - استيعاب المرفقات الواردة اختياري: `channels.imessage.includeAttachments`
    - يمكن جلب مسارات المرفقات البعيدة عبر SCP عند ضبط `remoteHost`
    - يجب أن تطابق مسارات المرفقات الجذور المسموح بها:
      - `channels.imessage.attachmentRoots` (محلي)
      - `channels.imessage.remoteAttachmentRoots` (وضع SCP البعيد)
      - نمط الجذر الافتراضي: `/Users/*/Library/Messages/Attachments`
    - يستخدم SCP فحصاً صارماً لمفتاح المضيف (`StrictHostKeyChecking=yes`)
    - يستخدم حجم الوسائط الصادرة `channels.imessage.mediaMaxMb` (الافتراضي 16 MB)

  </Accordion>

  <Accordion title="تقسيم الصادر">
    - حد تقسيم النص: `channels.imessage.textChunkLimit` (الافتراضي 4000)
    - وضع التقسيم: `channels.imessage.chunkMode`
      - `length` (افتراضي)
      - `newline` (تقسيم يعطي الأولوية للفقرات)

  </Accordion>

  <Accordion title="تنسيقات العنونة">
    الأهداف الصريحة المفضلة:

    - `chat_id:123` (موصى به للتوجيه المستقر)
    - `chat_guid:...`
    - `chat_identifier:...`

    أهداف المعرّفات مدعومة أيضاً:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## كتابة الإعدادات

يسمح iMessage بكتابة الإعدادات التي تبدأها القناة افتراضياً (لأجل `/config set|unset` عندما تكون `commands.config: true`).

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
  <Accordion title="لم يتم العثور على imsg أو RPC غير مدعوم">
    تحقق من الثنائي ودعم RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    إذا أبلغ الفحص أن RPC غير مدعوم، فحدّث `imsg`.

  </Accordion>

  <Accordion title="يتم تجاهل الرسائل المباشرة">
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
    - إعداد أنماط الإشارة (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="تفشل المرفقات البعيدة">
    تحقق من:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - مصادقة مفتاح SSH/SCP من مضيف Gateway
    - وجود مفتاح المضيف في `~/.ssh/known_hosts` على مضيف Gateway
    - قابلية قراءة المسار البعيد على Mac الذي يشغّل Messages

  </Accordion>

  <Accordion title="تم تفويت مطالبات أذونات macOS">
    أعد التشغيل في طرفية واجهة رسومية تفاعلية في سياق المستخدم/الجلسة نفسه ووافق على المطالبات:

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
- [الإقران](/ar/channels/pairing)
- [BlueBubbles](/ar/channels/bluebubbles)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
