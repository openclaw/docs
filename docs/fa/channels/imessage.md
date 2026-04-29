---
read_when:
    - راه‌اندازی پشتیبانی iMessage
    - اشکال‌زدایی ارسال/دریافت iMessage
summary: پشتیبانی قدیمی از iMessage از طریق imsg (JSON-RPC از طریق stdio). راه‌اندازی‌های جدید باید از BlueBubbles استفاده کنند.
title: iMessage
x-i18n:
    generated_at: "2026-04-29T22:26:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 60eeb3553a6511d56b8177ca4eafbedfed2d0852ac64c230c250911cd18ce17e
    source_path: channels/imessage.md
    workflow: 16
---

<Warning>
برای استقرارهای جدید iMessage، از <a href="/fa/channels/bluebubbles">BlueBubbles</a> استفاده کنید.

ادغام `imsg` قدیمی است و ممکن است در یک نسخه آینده حذف شود.
</Warning>

وضعیت: ادغام CLI خارجی قدیمی. Gateway دستور `imsg rpc` را اجرا می‌کند و از طریق JSON-RPC روی stdio ارتباط برقرار می‌کند (بدون daemon/port جداگانه).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/fa/channels/bluebubbles">
    مسیر ترجیحی iMessage برای راه‌اندازی‌های جدید.
  </Card>
  <Card title="Pairing" icon="link" href="/fa/channels/pairing">
    DMهای iMessage به‌طور پیش‌فرض روی حالت pairing هستند.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/fa/gateway/config-channels#imessage">
    مرجع کامل فیلدهای iMessage.
  </Card>
</CardGroup>

## راه‌اندازی سریع

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        درخواست‌های pairing پس از ۱ ساعت منقضی می‌شوند.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
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

    اگر `remoteHost` تنظیم نشده باشد، OpenClaw تلاش می‌کند با تحلیل اسکریپت wrapper مربوط به SSH آن را به‌طور خودکار شناسایی کند.
    `remoteHost` باید `host` یا `user@host` باشد (بدون فاصله یا گزینه‌های SSH).
    OpenClaw برای SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند، بنابراین کلید میزبان relay باید از قبل در `~/.ssh/known_hosts` وجود داشته باشد.
    مسیرهای پیوست در برابر ریشه‌های مجاز (`attachmentRoots` / `remoteAttachmentRoots`) اعتبارسنجی می‌شوند.

  </Tab>
</Tabs>

## نیازمندی‌ها و مجوزها (macOS)

- Messages باید روی همان Mac که `imsg` را اجرا می‌کند وارد حساب شده باشد.
- Full Disk Access برای زمینه فرایندی که OpenClaw/`imsg` را اجرا می‌کند لازم است (دسترسی به پایگاه داده Messages).
- مجوز Automation برای ارسال پیام‌ها از طریق Messages.app لازم است.

<Tip>
مجوزها برای هر زمینه فرایند جداگانه اعطا می‌شوند. اگر gateway بدون رابط کاربری اجرا می‌شود (LaunchAgent/SSH)، یک فرمان تعاملی یک‌باره را در همان زمینه اجرا کنید تا اعلان‌ها فعال شوند:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## کنترل دسترسی و مسیریابی

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` پیام‌های مستقیم را کنترل می‌کند:

    - `pairing` (پیش‌فرض)
    - `allowlist`
    - `open` (لازم است `allowFrom` شامل `"*"` باشد)
    - `disabled`

    فیلد allowlist: `channels.imessage.allowFrom`.

    ورودی‌های allowlist می‌توانند handle یا مقصدهای چت (`chat_id:*`، `chat_guid:*`، `chat_identifier:*`) باشند.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` نحوه مدیریت گروه را کنترل می‌کند:

    - `allowlist` (پیش‌فرض وقتی پیکربندی شده باشد)
    - `open`
    - `disabled`

    allowlist فرستنده گروه: `channels.imessage.groupAllowFrom`.

    fallback زمان اجرا: اگر `groupAllowFrom` تنظیم نشده باشد، بررسی‌های فرستنده گروه iMessage در صورت وجود به `allowFrom` برمی‌گردند.
    نکته زمان اجرا: اگر `channels.imessage` کاملا وجود نداشته باشد، زمان اجرا به `groupPolicy="allowlist"` برمی‌گردد و یک هشدار ثبت می‌کند (حتی اگر `channels.defaults.groupPolicy` تنظیم شده باشد).

    gating mention برای گروه‌ها:

    - iMessage فراداده mention بومی ندارد
    - تشخیص mention از الگوهای regex استفاده می‌کند (`agents.list[].groupChat.mentionPatterns`، fallback برابر `messages.groupChat.mentionPatterns`)
    - بدون الگوهای پیکربندی‌شده، gating mention قابل اعمال نیست

    فرمان‌های کنترلی از فرستندگان مجاز می‌توانند gating mention را در گروه‌ها دور بزنند.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DMها از مسیریابی مستقیم استفاده می‌کنند؛ گروه‌ها از مسیریابی گروهی استفاده می‌کنند.
    - با مقدار پیش‌فرض `session.dmScope=main`، DMهای iMessage در نشست اصلی agent ادغام می‌شوند.
    - نشست‌های گروهی جدا هستند (`agent:<agentId>:imessage:group:<chat_id>`).
    - پاسخ‌ها با استفاده از فراداده channel/target مبدا دوباره به iMessage مسیریابی می‌شوند.

    رفتار threadهای شبیه گروه:

    برخی threadهای iMessage با چند شرکت‌کننده ممکن است با `is_group=false` برسند.
    اگر آن `chat_id` به‌صراحت زیر `channels.imessage.groups` پیکربندی شده باشد، OpenClaw آن را به‌عنوان ترافیک گروهی در نظر می‌گیرد (gating گروه + جداسازی نشست گروه).

  </Tab>
</Tabs>

## اتصال‌های گفت‌وگوی ACP

چت‌های قدیمی iMessage همچنین می‌توانند به نشست‌های ACP متصل شوند.

جریان سریع اپراتور:

- داخل DM یا چت گروهی مجاز، `/acp spawn codex --bind here` را اجرا کنید.
- پیام‌های آینده در همان گفت‌وگوی iMessage به نشست ACP ایجادشده مسیریابی می‌شوند.
- `/new` و `/reset` همان نشست ACP متصل را درجا بازنشانی می‌کنند.
- `/acp close` نشست ACP را می‌بندد و اتصال را حذف می‌کند.

اتصال‌های پایدار پیکربندی‌شده از طریق ورودی‌های سطح بالای `bindings[]` با `type: "acp"` و `match.channel: "imessage"` پشتیبانی می‌شوند.

`match.peer.id` می‌تواند از این‌ها استفاده کند:

- handle نرمال‌شده DM مانند `+15555550123` یا `user@example.com`
- `chat_id:<id>` (پیشنهادی برای اتصال‌های گروهی پایدار)
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

برای رفتار مشترک اتصال ACP، [ACP Agents](/fa/tools/acp-agents) را ببینید.

## الگوهای استقرار

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    از یک Apple ID و کاربر macOS اختصاصی استفاده کنید تا ترافیک bot از پروفایل شخصی Messages شما جدا باشد.

    جریان معمول:

    1. یک کاربر اختصاصی macOS ایجاد کنید/وارد آن شوید.
    2. در آن کاربر با Apple ID مربوط به bot وارد Messages شوید.
    3. `imsg` را در آن کاربر نصب کنید.
    4. یک wrapper مربوط به SSH ایجاد کنید تا OpenClaw بتواند `imsg` را در زمینه آن کاربر اجرا کند.
    5. `channels.imessage.accounts.<id>.cliPath` و `.dbPath` را به پروفایل آن کاربر اشاره دهید.

    اجرای نخست ممکن است به تاییدهای GUI (Automation + Full Disk Access) در نشست آن کاربر bot نیاز داشته باشد.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    توپولوژی رایج:

    - gateway روی Linux/VM اجرا می‌شود
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

    از کلیدهای SSH استفاده کنید تا SSH و SCP هر دو غیرتعاملی باشند.
    ابتدا مطمئن شوید کلید میزبان قابل اعتماد است (برای مثال `ssh bot@mac-mini.tailnet-1234.ts.net`) تا `known_hosts` پر شود.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage از پیکربندی به‌ازای هر حساب زیر `channels.imessage.accounts` پشتیبانی می‌کند.

    هر حساب می‌تواند فیلدهایی مانند `cliPath`، `dbPath`، `allowFrom`، `groupPolicy`، `mediaMaxMb`، تنظیمات history، و allowlistهای ریشه پیوست را override کند.

  </Accordion>
</AccordionGroup>

## رسانه، تکه‌بندی، و مقصدهای تحویل

<AccordionGroup>
  <Accordion title="Attachments and media">
    - دریافت پیوست‌های ورودی اختیاری است: `channels.imessage.includeAttachments`
    - مسیرهای پیوست راه‌دور می‌توانند وقتی `remoteHost` تنظیم شده است از طریق SCP دریافت شوند
    - مسیرهای پیوست باید با ریشه‌های مجاز مطابقت داشته باشند:
      - `channels.imessage.attachmentRoots` (محلی)
      - `channels.imessage.remoteAttachmentRoots` (حالت SCP راه‌دور)
      - الگوی ریشه پیش‌فرض: `/Users/*/Library/Messages/Attachments`
    - SCP از بررسی سخت‌گیرانه کلید میزبان استفاده می‌کند (`StrictHostKeyChecking=yes`)
    - اندازه رسانه خروجی از `channels.imessage.mediaMaxMb` استفاده می‌کند (پیش‌فرض 16 MB)

  </Accordion>

  <Accordion title="Outbound chunking">
    - حد تکه متن: `channels.imessage.textChunkLimit` (پیش‌فرض ۴۰۰۰)
    - حالت تکه‌بندی: `channels.imessage.chunkMode`
      - `length` (پیش‌فرض)
      - `newline` (تقسیم با اولویت پاراگراف)

  </Accordion>

  <Accordion title="Addressing formats">
    مقصدهای صریح ترجیحی:

    - `chat_id:123` (پیشنهادی برای مسیریابی پایدار)
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

iMessage به‌طور پیش‌فرض اجازه نوشتن پیکربندی آغازشده از channel را می‌دهد (برای `/config set|unset` وقتی `commands.config: true` است).

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
  <Accordion title="imsg not found or RPC unsupported">
    فایل باینری و پشتیبانی RPC را اعتبارسنجی کنید:

```bash
imsg rpc --help
openclaw channels status --probe
```

    اگر probe گزارش داد RPC پشتیبانی نمی‌شود، `imsg` را به‌روزرسانی کنید.

  </Accordion>

  <Accordion title="DMs are ignored">
    بررسی کنید:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - تاییدهای pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    بررسی کنید:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - رفتار allowlist مربوط به `channels.imessage.groups`
    - پیکربندی الگوی mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    بررسی کنید:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - احراز هویت کلید SSH/SCP از میزبان gateway
    - کلید میزبان در `~/.ssh/known_hosts` روی میزبان gateway وجود دارد
    - خواندنی بودن مسیر راه‌دور روی Mac اجراکننده Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    در یک ترمینال GUI تعاملی در همان زمینه کاربر/نشست دوباره اجرا کنید و اعلان‌ها را تایید کنید:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    تایید کنید که Full Disk Access + Automation برای زمینه فرایندی که OpenClaw/`imsg` را اجرا می‌کند اعطا شده‌اند.

  </Accordion>
</AccordionGroup>

## اشاره‌گرهای مرجع پیکربندی

- [مرجع پیکربندی - iMessage](/fa/gateway/config-channels#imessage)
- [پیکربندی Gateway](/fa/gateway/configuration)
- [Pairing](/fa/channels/pairing)
- [BlueBubbles](/fa/channels/bluebubbles)

## مرتبط

- [نمای کلی Channels](/fa/channels) — همه channelهای پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [Groups](/fa/channels/groups) — رفتار چت گروهی و gating mention
- [مسیریابی Channel](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
