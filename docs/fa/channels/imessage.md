---
read_when:
    - راه‌اندازی پشتیبانی iMessage
    - اشکال‌زدایی ارسال/دریافت iMessage
summary: پشتیبانی بومی از iMessage از طریق imsg (JSON-RPC روی stdio). هنگامی که الزامات میزبان برآورده شوند، گزینهٔ ترجیحی برای راه‌اندازی‌های جدید iMessage در OpenClaw است.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
برای استقرارهای جدید OpenClaw iMessage، وقتی می‌توانید `imsg` را روی میزبان macOS Messages واردشده اجرا کنید، از اینجا شروع کنید. BlueBubbles همچنان به‌عنوان جایگزین قدیمی برای راه‌اندازی‌های موجودی که به سرور HTTP، وب‌هوک‌ها، یا کنش‌های غنی‌تر API خصوصی آن وابسته‌اند در دسترس است.
</Note>

وضعیت: ادغام بومی CLI خارجی. Gateway، `imsg rpc` را اجرا می‌کند و از طریق JSON-RPC روی stdio ارتباط برقرار می‌کند (بدون daemon/port جداگانه).

<CardGroup cols={3}>
  <Card title="BlueBubbles (جایگزین قدیمی)" icon="message-circle" href="/fa/channels/bluebubbles">
    برای مسیریابی موجودِ مبتنی بر BlueBubbles به استفاده از آن ادامه دهید؛ برای راه‌اندازی‌های جدید، وقتی imsg مناسب است از آن پرهیز کنید.
  </Card>
  <Card title="جفت‌سازی" icon="link" href="/fa/channels/pairing">
    پیام‌های مستقیم iMessage به‌طور پیش‌فرض از حالت جفت‌سازی استفاده می‌کنند.
  </Card>
  <Card title="مرجع پیکربندی" icon="settings" href="/fa/gateway/config-channels#imessage">
    مرجع کامل فیلدهای iMessage.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Mac محلی (مسیر سریع)">
    <Steps>
      <Step title="نصب و تأیید imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="پیکربندی OpenClaw">

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

      <Step title="شروع Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="تأیید نخستین جفت‌سازی پیام مستقیم (dmPolicy پیش‌فرض)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        درخواست‌های جفت‌سازی پس از ۱ ساعت منقضی می‌شوند.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac راه‌دور از طریق SSH">
    OpenClaw فقط به یک `cliPath` سازگار با stdio نیاز دارد، بنابراین می‌توانید `cliPath` را به یک اسکریپت wrapper اشاره دهید که با SSH به یک Mac راه‌دور وصل می‌شود و `imsg` را اجرا می‌کند.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    پیکربندی پیشنهادی وقتی پیوست‌ها فعال هستند:

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

    اگر `remoteHost` تنظیم نشده باشد، OpenClaw تلاش می‌کند آن را با تحلیل اسکریپت wrapper مربوط به SSH به‌طور خودکار تشخیص دهد.
    `remoteHost` باید `host` یا `user@host` باشد (بدون فاصله یا گزینه‌های SSH).
    OpenClaw برای SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند، بنابراین کلید میزبان relay باید از قبل در `~/.ssh/known_hosts` وجود داشته باشد.
    مسیرهای پیوست در برابر ریشه‌های مجاز (`attachmentRoots` / `remoteAttachmentRoots`) اعتبارسنجی می‌شوند.

  </Tab>
</Tabs>

## الزامات و مجوزها (macOS)

- Messages باید روی Mac اجراکننده `imsg` وارد شده باشد.
- برای context فرایندی که OpenClaw/`imsg` را اجرا می‌کند، Full Disk Access لازم است (دسترسی به پایگاه داده Messages).
- برای ارسال پیام از طریق Messages.app، مجوز Automation لازم است.

<Tip>
مجوزها به‌ازای هر context فرایند اعطا می‌شوند. اگر Gateway بدون رابط کاربری اجرا می‌شود (LaunchAgent/SSH)، یک فرمان تعاملی یک‌باره را در همان context اجرا کنید تا promptها نمایش داده شوند:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="سیاست پیام مستقیم">
    `channels.imessage.dmPolicy` پیام‌های مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (نیازمند این است که `allowFrom` شامل `"*"` باشد)
    - `disabled`

    فیلد allowlist: `channels.imessage.allowFrom`.

    ورودی‌های allowlist می‌توانند handleها یا مقصدهای chat باشند (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="سیاست گروه + mentionها">
    `channels.imessage.groupPolicy` مدیریت گروه را کنترل می‌کند:

    - `allowlist` (پیش‌فرض هنگام پیکربندی)
    - `open`
    - `disabled`

    allowlist فرستنده گروه: `channels.imessage.groupAllowFrom`.

    fallback زمان اجرا: اگر `groupAllowFrom` تنظیم نشده باشد، بررسی‌های فرستنده گروه iMessage در صورت وجود به `allowFrom` fallback می‌کنند.
    نکته زمان اجرا: اگر `channels.imessage` کاملاً وجود نداشته باشد، runtime به `groupPolicy="allowlist"` fallback می‌کند و یک هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    گیتینگ mention برای گروه‌ها:

    - iMessage هیچ فراداده mention بومی ندارد
    - تشخیص mention از الگوهای regex استفاده می‌کند (`agents.list[].groupChat.mentionPatterns`، fallback به `messages.groupChat.mentionPatterns`)
    - بدون الگوهای پیکربندی‌شده، گیتینگ mention قابل اعمال نیست

    فرمان‌های کنترلی از فرستنده‌های مجاز می‌توانند گیتینگ mention را در گروه‌ها دور بزنند.

  </Tab>

  <Tab title="جلسه‌ها و پاسخ‌های قطعی">
    - پیام‌های مستقیم از مسیریابی مستقیم استفاده می‌کنند؛ گروه‌ها از مسیریابی گروهی استفاده می‌کنند.
    - با `session.dmScope=main` پیش‌فرض، پیام‌های مستقیم iMessage در جلسه اصلی agent ادغام می‌شوند.
    - جلسه‌های گروه ایزوله هستند (`agent:<agentId>:imessage:group:<chat_id>`).
    - پاسخ‌ها با استفاده از فراداده کانال/مقصد مبدأ دوباره به iMessage مسیریابی می‌شوند.

    رفتار رشته‌های شبیه گروه:

    برخی رشته‌های iMessage چندشرکت‌کننده‌ای ممکن است با `is_group=false` برسند.
    اگر آن `chat_id` به‌طور صریح زیر `channels.imessage.groups` پیکربندی شده باشد، OpenClaw آن را به‌عنوان ترافیک گروه در نظر می‌گیرد (گیتینگ گروه + ایزوله‌سازی جلسه گروه).

  </Tab>
</Tabs>

## اتصال‌های مکالمه ACP

چت‌های قدیمی iMessage نیز می‌توانند به جلسه‌های ACP متصل شوند.

جریان سریع اپراتور:

- `/acp spawn codex --bind here` را داخل پیام مستقیم یا چت گروهی مجاز اجرا کنید.
- پیام‌های آینده در همان مکالمه iMessage به جلسه ACP ایجادشده مسیریابی می‌شوند.
- `/new` و `/reset` همان جلسه ACP متصل‌شده را درجا reset می‌کنند.
- `/acp close` جلسه ACP را می‌بندد و binding را حذف می‌کند.

bindingهای پایدار پیکربندی‌شده از طریق ورودی‌های سطح بالای `bindings[]` با `type: "acp"` و `match.channel: "imessage"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از این موارد استفاده کند:

- handle نرمال‌شده پیام مستقیم مانند `+15555550123` یا `user@example.com`
- `chat_id:<id>` (برای bindingهای پایدار گروه توصیه می‌شود)
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

برای رفتار مشترک binding در ACP، [Agentهای ACP](/fa/tools/acp-agents) را ببینید.

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="کاربر اختصاصی bot در macOS (هویت iMessage جداگانه)">
    از یک Apple ID و کاربر macOS اختصاصی استفاده کنید تا ترافیک bot از پروفایل شخصی Messages شما جدا بماند.

    جریان معمول:

    1. یک کاربر اختصاصی macOS ایجاد کنید/وارد آن شوید.
    2. در همان کاربر، با Apple ID مربوط به bot وارد Messages شوید.
    3. `imsg` را در همان کاربر نصب کنید.
    4. اسکریپت wrapper برای SSH بسازید تا OpenClaw بتواند `imsg` را در context همان کاربر اجرا کند.
    5. `channels.imessage.accounts.<id>.cliPath` و `.dbPath` را به پروفایل همان کاربر اشاره دهید.

    اجرای نخست ممکن است در جلسه همان کاربر bot به تأییدهای GUI نیاز داشته باشد (Automation + Full Disk Access).

  </Accordion>

  <Accordion title="Mac راه‌دور از طریق Tailscale (مثال)">
    توپولوژی رایج:

    - Gateway روی Linux/VM اجرا می‌شود
    - iMessage + `imsg` روی یک Mac در tailnet شما اجرا می‌شود
    - wrapper مربوط به `cliPath` از SSH برای اجرای `imsg` استفاده می‌کند
    - `remoteHost` دریافت پیوست‌ها با SCP را فعال می‌کند

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

    از کلیدهای SSH استفاده کنید تا هم SSH و هم SCP غیرتعاملی باشند.
    ابتدا مطمئن شوید کلید میزبان trusted است (برای مثال `ssh bot@mac-mini.tailnet-1234.ts.net`) تا `known_hosts` پر شود.

  </Accordion>

  <Accordion title="الگوی چندحسابی">
    iMessage از پیکربندی به‌ازای هر حساب زیر `channels.imessage.accounts` پشتیبانی می‌کند.

    هر حساب می‌تواند فیلدهایی مانند `cliPath`، `dbPath`، `allowFrom`، `groupPolicy`، `mediaMaxMb`، تنظیمات history، و allowlistهای ریشه پیوست را override کند.

  </Accordion>
</AccordionGroup>

## رسانه، chunking، و مقصدهای تحویل

<AccordionGroup>
  <Accordion title="پیوست‌ها و رسانه">
    - ingest پیوست‌های ورودی اختیاری است: `channels.imessage.includeAttachments`
    - وقتی `remoteHost` تنظیم شده باشد، مسیرهای پیوست راه‌دور می‌توانند از طریق SCP دریافت شوند
    - مسیرهای پیوست باید با ریشه‌های مجاز مطابقت داشته باشند:
      - `channels.imessage.attachmentRoots` (محلی)
      - `channels.imessage.remoteAttachmentRoots` (حالت SCP راه‌دور)
      - الگوی ریشه پیش‌فرض: `/Users/*/Library/Messages/Attachments`
    - SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند (`StrictHostKeyChecking=yes`)
    - اندازه رسانه خروجی از `channels.imessage.mediaMaxMb` استفاده می‌کند (پیش‌فرض 16 MB)

  </Accordion>

  <Accordion title="chunking خروجی">
    - حد chunk متن: `channels.imessage.textChunkLimit` (پیش‌فرض 4000)
    - حالت chunk: `channels.imessage.chunkMode`
      - `length` (پیش‌فرض)
      - `newline` (تقسیم با اولویت پاراگراف)

  </Accordion>

  <Accordion title="فرمت‌های آدرس‌دهی">
    مقصدهای صریح ترجیحی:

    - `chat_id:123` (برای مسیریابی پایدار توصیه می‌شود)
    - `chat_guid:...`
    - `chat_identifier:...`

    مقصدهای handle نیز پشتیبانی می‌شوند:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## نوشتن پیکربندی

iMessage به‌طور پیش‌فرض اجازه نوشتن پیکربندی آغازشده از کانال را می‌دهد (برای `/config set|unset` وقتی `commands.config: true`).

غیرفعال‌سازی:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## عیب‌یابی

<AccordionGroup>
  <Accordion title="imsg پیدا نشد یا RPC پشتیبانی نمی‌شود">
    binary و پشتیبانی RPC را اعتبارسنجی کنید:

```bash
imsg rpc --help
openclaw channels status --probe
```

    اگر probe گزارش دهد RPC پشتیبانی نمی‌شود، `imsg` را به‌روزرسانی کنید.

  </Accordion>

  <Accordion title="پیام‌های مستقیم نادیده گرفته می‌شوند">
    بررسی کنید:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - تأییدهای جفت‌سازی (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="پیام‌های گروهی نادیده گرفته می‌شوند">
    بررسی کنید:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - رفتار allowlist در `channels.imessage.groups`
    - پیکربندی الگوی mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="پیوست‌های راه‌دور ناموفق می‌شوند">
    بررسی کنید:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - احراز هویت کلید SSH/SCP از میزبان Gateway
    - کلید میزبان در `~/.ssh/known_hosts` روی میزبان Gateway وجود دارد
    - خوانایی مسیر راه‌دور روی Mac اجراکننده Messages

  </Accordion>

  <Accordion title="promptهای مجوز macOS از دست رفتند">
    در یک ترمینال GUI تعاملی در همان context کاربر/جلسه دوباره اجرا کنید و promptها را تأیید کنید:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    تأیید کنید Full Disk Access + Automation برای context فرایندی که OpenClaw/`imsg` را اجرا می‌کند اعطا شده‌اند.

  </Accordion>
</AccordionGroup>

## اشاره‌گرهای مرجع پیکربندی

- [مرجع پیکربندی - iMessage](/fa/gateway/config-channels#imessage)
- [پیکربندی Gateway](/fa/gateway/configuration)
- [جفت‌سازی](/fa/channels/pairing)
- [BlueBubbles](/fa/channels/bluebubbles)

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همهٔ کانال‌های پشتیبانی‌شده
- [جفت‌سازی](/fa/channels/pairing) — احراز هویت پیام مستقیم و روند جفت‌سازی
- [گروه‌ها](/fa/channels/groups) — رفتار گفتگوی گروهی و کنترل فعال‌سازی بر اساس ذکر نام
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
