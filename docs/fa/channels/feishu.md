---
read_when:
    - می‌خواهید یک ربات Feishu/Lark را متصل کنید
    - شما در حال پیکربندی کانال Feishu هستید.
summary: مرور کلی، ویژگی‌ها و پیکربندی ربات Feishu
title: Feishu
x-i18n:
    generated_at: "2026-05-03T21:27:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16d8156d215d47fa6e7d810e3a70eb8e84176a681669c27de8f58320be83a7a0
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark یک پلتفرم همکاری همه‌کاره است که تیم‌ها در آن چت می‌کنند، اسناد را به اشتراک می‌گذارند، تقویم‌ها را مدیریت می‌کنند، و کارها را با هم انجام می‌دهند.

**وضعیت:** آماده برای محیط تولید برای پیام‌های مستقیم ربات + چت‌های گروهی. WebSocket حالت پیش‌فرض است؛ حالت Webhook اختیاری است.

---

## شروع سریع

<Note>
به OpenClaw 2026.4.25 یا بالاتر نیاز دارد. برای بررسی، `openclaw --version` را اجرا کنید. با `openclaw update` ارتقا دهید.
</Note>

<Steps>
  <Step title="اجرای راه‌انداز تعاملی کانال">
  ```bash
  openclaw channels login --channel feishu
  ```
  کد QR را با برنامه موبایل Feishu/Lark خود اسکن کنید تا یک ربات Feishu/Lark به‌صورت خودکار ایجاد شود.
  </Step>
  
  <Step title="پس از تکمیل راه‌اندازی، Gateway را برای اعمال تغییرات راه‌اندازی مجدد کنید">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## کنترل دسترسی

### پیام‌های مستقیم

برای کنترل اینکه چه کسی می‌تواند به ربات پیام مستقیم بدهد، `dmPolicy` را پیکربندی کنید:

- `"pairing"` — کاربران ناشناخته یک کد جفت‌سازی دریافت می‌کنند؛ از طریق CLI تأیید کنید
- `"allowlist"` — فقط کاربران فهرست‌شده در `allowFrom` می‌توانند چت کنند (پیش‌فرض: فقط مالک ربات)
- `"open"` — پیام‌های مستقیم عمومی را فقط وقتی مجاز می‌کند که `allowFrom` شامل `"*"` باشد؛ با ورودی‌های محدودکننده، فقط کاربران منطبق می‌توانند چت کنند
- `"disabled"` — همه پیام‌های مستقیم را غیرفعال می‌کند

**تأیید درخواست جفت‌سازی:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### چت‌های گروهی

**سیاست گروه** (`channels.feishu.groupPolicy`):

| مقدار         | رفتار                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | به همه پیام‌ها در گروه‌ها پاسخ می‌دهد                                                            |
| `"allowlist"` | فقط به گروه‌های موجود در `groupAllowFrom` یا گروه‌هایی که به‌صراحت زیر `groups.<chat_id>` پیکربندی شده‌اند پاسخ می‌دهد |
| `"disabled"`  | همه پیام‌های گروهی را غیرفعال می‌کند؛ ورودی‌های صریح `groups.<chat_id>` این را نادیده نمی‌گیرند         |

پیش‌فرض: `allowlist`

**الزام منشن** (`channels.feishu.requireMention`):

- `true` — نیازمند @mention است (پیش‌فرض)
- `false` — بدون @mention پاسخ می‌دهد
- بازنویسی برای هر گروه: `channels.feishu.groups.<chat_id>.requireMention`
- `@all` و `@_all` که فقط برای اعلان همگانی هستند، به‌عنوان منشن ربات در نظر گرفته نمی‌شوند. پیامی که هم `@all` و هم خود ربات را مستقیماً منشن کند، همچنان به‌عنوان منشن ربات حساب می‌شود.

---

## نمونه‌های پیکربندی گروه

### مجاز کردن همه گروه‌ها، بدون نیاز به @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### مجاز کردن همه گروه‌ها، همچنان نیازمند @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### مجاز کردن فقط گروه‌های مشخص

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

در حالت `allowlist`، همچنین می‌توانید با افزودن یک ورودی صریح `groups.<chat_id>` یک گروه را بپذیرید. ورودی‌های صریح `groupPolicy: "disabled"` را نادیده نمی‌گیرند. پیش‌فرض‌های wildcard زیر `groups.*` گروه‌های منطبق را پیکربندی می‌کنند، اما به‌تنهایی گروه‌ها را نمی‌پذیرند.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### محدود کردن فرستندگان درون یک گروه

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## دریافت شناسه‌های گروه/کاربر

### شناسه‌های گروه (`chat_id`، قالب: `oc_xxx`)

گروه را در Feishu/Lark باز کنید، روی نماد منو در گوشه بالا-راست کلیک کنید، و به **Settings** بروید. شناسه گروه (`chat_id`) در صفحه تنظیمات فهرست شده است.

![دریافت شناسه گروه](/images/feishu-get-group-id.png)

### شناسه‌های کاربر (`open_id`، قالب: `ou_xxx`)

Gateway را شروع کنید، یک پیام مستقیم به ربات بفرستید، سپس گزارش‌ها را بررسی کنید:

```bash
openclaw logs --follow
```

در خروجی گزارش به‌دنبال `open_id` بگردید. همچنین می‌توانید درخواست‌های جفت‌سازی در انتظار را بررسی کنید:

```bash
openclaw pairing list feishu
```

---

## فرمان‌های رایج

| فرمان   | توضیح                 |
| --------- | --------------------------- |
| `/status` | نمایش وضعیت ربات             |
| `/reset`  | بازنشانی نشست فعلی   |
| `/model`  | نمایش یا تغییر مدل هوش مصنوعی |

<Note>
Feishu/Lark از منوهای بومی فرمان اسلش پشتیبانی نمی‌کند، بنابراین این‌ها را به‌عنوان پیام‌های متنی ساده ارسال کنید.
</Note>

---

## عیب‌یابی

### ربات در چت‌های گروهی پاسخ نمی‌دهد

1. مطمئن شوید ربات به گروه اضافه شده است
2. مطمئن شوید ربات را @mention می‌کنید (به‌صورت پیش‌فرض لازم است)
3. بررسی کنید `groupPolicy` برابر `"disabled"` نباشد
4. گزارش‌ها را بررسی کنید: `openclaw logs --follow`

### ربات پیام‌ها را دریافت نمی‌کند

1. مطمئن شوید ربات در Feishu Open Platform / Lark Developer منتشر و تأیید شده است
2. مطمئن شوید اشتراک رویداد شامل `im.message.receive_v1` است
3. مطمئن شوید **اتصال پایدار** (WebSocket) انتخاب شده است
4. مطمئن شوید همه دامنه‌های مجوز لازم اعطا شده‌اند
5. مطمئن شوید Gateway در حال اجرا است: `openclaw gateway status`
6. گزارش‌ها را بررسی کنید: `openclaw logs --follow`

### نشت App Secret

1. App Secret را در Feishu Open Platform / Lark Developer بازنشانی کنید
2. مقدار را در پیکربندی خود به‌روزرسانی کنید
3. Gateway را راه‌اندازی مجدد کنید: `openclaw gateway restart`

---

## پیکربندی پیشرفته

### چند حساب

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` کنترل می‌کند وقتی APIهای خروجی `accountId` مشخص نمی‌کنند از کدام حساب استفاده شود.
`accounts.<id>.tts` از همان شکل `messages.tts` استفاده می‌کند و به‌صورت deep-merge روی پیکربندی سراسری TTS اعمال می‌شود، بنابراین راه‌اندازی‌های چندرباته Feishu می‌توانند اعتبارنامه‌های ارائه‌دهنده مشترک را به‌صورت سراسری نگه دارند و فقط صدا، مدل، شخصیت، یا حالت خودکار را برای هر حساب بازنویسی کنند.

### محدودیت‌های پیام

- `textChunkLimit` — اندازه بخش متن خروجی (پیش‌فرض: `2000` نویسه)
- `mediaMaxMb` — حد بارگذاری/دریافت رسانه (پیش‌فرض: `30` مگابایت)

### جریان‌دهی

Feishu/Lark از پاسخ‌های جریانی از طریق کارت‌های تعاملی پشتیبانی می‌کند. وقتی فعال باشد، ربات هنگام تولید متن، کارت را به‌صورت بلادرنگ به‌روزرسانی می‌کند.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

برای ارسال پاسخ کامل در یک پیام، `streaming: false` را تنظیم کنید. `blockStreaming` به‌صورت پیش‌فرض خاموش است؛ فقط وقتی آن را فعال کنید که می‌خواهید بلوک‌های تکمیل‌شده دستیار پیش از پاسخ نهایی ارسال شوند.

### بهینه‌سازی سهمیه

تعداد فراخوانی‌های API Feishu/Lark را با دو پرچم اختیاری کاهش دهید:

- `typingIndicator` (پیش‌فرض `true`): برای رد کردن فراخوانی‌های واکنش تایپ، روی `false` تنظیم کنید
- `resolveSenderNames` (پیش‌فرض `true`): برای رد کردن جست‌وجوی پروفایل فرستنده، روی `false` تنظیم کنید

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### نشست‌های ACP

Feishu/Lark از ACP برای پیام‌های مستقیم و پیام‌های رشته گروهی پشتیبانی می‌کند. ACP در Feishu/Lark مبتنی بر فرمان متنی است — هیچ منوی بومی فرمان اسلش وجود ندارد، بنابراین از پیام‌های `/acp ...` مستقیماً در مکالمه استفاده کنید.

#### اتصال پایدار ACP

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### ایجاد ACP از چت

در یک پیام مستقیم یا رشته Feishu/Lark:

```text
/acp spawn codex --thread here
```

`--thread here` برای پیام‌های مستقیم و پیام‌های رشته Feishu/Lark کار می‌کند. پیام‌های بعدی در مکالمه متصل، مستقیماً به همان نشست ACP هدایت می‌شوند.

### مسیریابی چندعاملی

از `bindings` برای هدایت پیام‌های مستقیم یا گروه‌های Feishu/Lark به عامل‌های مختلف استفاده کنید.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

فیلدهای مسیریابی:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (پیام مستقیم) یا `"group"` (چت گروهی)
- `match.peer.id`: Open ID کاربر (`ou_xxx`) یا شناسه گروه (`oc_xxx`)

برای نکات جست‌وجو، [دریافت شناسه‌های گروه/کاربر](#get-groupuser-ids) را ببینید.

---

## مرجع پیکربندی

پیکربندی کامل: [پیکربندی Gateway](/fa/gateway/configuration)

| تنظیم                                           | توضیح                                                                      | پیش‌فرض          |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | فعال/غیرفعال کردن کانال                                                       | `true`           |
| `channels.feishu.domain`                          | دامنه API (`feishu` یا `lark`)                                                  | `feishu`         |
| `channels.feishu.connectionMode`                  | انتقال رویداد (`websocket` یا `webhook`)                                       | `websocket`      |
| `channels.feishu.defaultAccount`                  | حساب پیش‌فرض برای مسیریابی خروجی                                             | `default`        |
| `channels.feishu.verificationToken`               | برای حالت Webhook الزامی است                                                        | —                |
| `channels.feishu.encryptKey`                      | برای حالت Webhook الزامی است                                                        | —                |
| `channels.feishu.webhookPath`                     | مسیر route مربوط به Webhook                                                               | `/feishu/events` |
| `channels.feishu.webhookHost`                     | میزبان bind مربوط به Webhook                                                                | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | پورت bind مربوط به Webhook                                                                | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                                                           | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                                                       | —                |
| `channels.feishu.accounts.<id>.domain`            | بازنویسی دامنه برای هر حساب                                                      | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | بازنویسی TTS برای هر حساب                                                         | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | سیاست DM                                                                        | `allowlist`      |
| `channels.feishu.allowFrom`                       | allowlist مربوط به DM (فهرست open_id)                                                      | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | سیاست گروه                                                                     | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | allowlist گروه                                                                  | —                |
| `channels.feishu.requireMention`                  | الزام @mention در گروه‌ها                                                       | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | بازنویسی @mention برای هر گروه؛ شناسه‌های صریح همچنین گروه را در حالت allowlist مجاز می‌کنند | به‌ارث‌رسیده        |
| `channels.feishu.groups.<chat_id>.enabled`        | فعال/غیرفعال کردن یک گروه مشخص                                                  | `true`           |
| `channels.feishu.textChunkLimit`                  | اندازه قطعه پیام                                                               | `2000`           |
| `channels.feishu.mediaMaxMb`                      | محدودیت اندازه رسانه                                                                 | `30`             |
| `channels.feishu.streaming`                       | خروجی کارت جریانی                                                            | `true`           |
| `channels.feishu.blockStreaming`                  | جریانی‌سازی پاسخ بلوک تکمیل‌شده                                                  | `false`          |
| `channels.feishu.typingIndicator`                 | ارسال واکنش‌های در حال تایپ                                                            | `true`           |
| `channels.feishu.resolveSenderNames`              | resolve کردن نام‌های نمایشی فرستنده                                                     | `true`           |

---

## انواع پیام پشتیبانی‌شده

### دریافت

- ✅ متن
- ✅ متن غنی (post)
- ✅ تصاویر
- ✅ فایل‌ها
- ✅ صدا
- ✅ ویدئو/رسانه
- ✅ استیکرها

پیام‌های صوتی ورودی Feishu/Lark به‌جای JSON خام `file_key` به‌صورت placeholderهای رسانه‌ای نرمال‌سازی می‌شوند. وقتی `tools.media.audio` پیکربندی شده باشد، OpenClaw منبع voice-note را دانلود می‌کند و پیش از نوبت agent، رونویسی صوتی مشترک را اجرا می‌کند، بنابراین agent رونویسی گفتار را دریافت می‌کند. اگر Feishu متن رونویسی را مستقیماً در payload صوتی قرار دهد، همان متن بدون فراخوانی ASR دیگر استفاده می‌شود. بدون provider رونویسی صوتی، agent همچنان یک placeholder به‌صورت `<media:audio>` به‌همراه پیوست ذخیره‌شده دریافت می‌کند، نه payload خام منبع Feishu.

### ارسال

- ✅ متن
- ✅ تصاویر
- ✅ فایل‌ها
- ✅ صدا
- ✅ ویدئو/رسانه
- ✅ کارت‌های تعاملی (از جمله به‌روزرسانی‌های جریانی)
- ⚠️ متن غنی (قالب‌بندی سبک post؛ از همه قابلیت‌های تألیف Feishu/Lark پشتیبانی نمی‌کند)

حباب‌های صوتی بومی Feishu/Lark از نوع پیام `audio` در Feishu استفاده می‌کنند و به رسانه بارگذاری‌شده Ogg/Opus (`file_type: "opus"`) نیاز دارند. رسانه‌های موجود با پسوند `.opus` و `.ogg` مستقیماً به‌عنوان صدای بومی ارسال می‌شوند. MP3/WAV/M4A و دیگر قالب‌های محتمل صوتی فقط وقتی پاسخ تحویل صوتی درخواست کند (`audioAsVoice` / ابزار پیام `asVoice`، از جمله پاسخ‌های voice-note مبتنی بر TTS)، با `ffmpeg` به Ogg/Opus با نرخ 48kHz تبدیل می‌شوند. پیوست‌های معمولی MP3 به‌صورت فایل‌های عادی باقی می‌مانند. اگر `ffmpeg` وجود نداشته باشد یا تبدیل ناموفق باشد، OpenClaw به پیوست فایل fallback می‌کند و دلیل را در log ثبت می‌کند.

### Threadها و پاسخ‌ها

- ✅ پاسخ‌های inline
- ✅ پاسخ‌های thread
- ✅ پاسخ‌های رسانه‌ای هنگام پاسخ به یک پیام thread، thread-aware باقی می‌مانند

برای `groupSessionScope: "group_topic"` و `"group_topic_sender"`، گروه‌های topic بومی Feishu/Lark از `thread_id` رویداد (`omt_*`) به‌عنوان کلید canonical نشست topic استفاده می‌کنند. پاسخ‌های گروهی عادی که OpenClaw آن‌ها را به thread تبدیل می‌کند، همچنان از شناسه پیام ریشه پاسخ (`om_*`) استفاده می‌کنند تا نوبت اول و نوبت پیگیری در یک نشست بمانند.

---

## مرتبط

- [نمای کلی کانال‌ها](/fa/channels) — همه کانال‌های پشتیبانی‌شده
- [Pairing](/fa/channels/pairing) — احراز هویت DM و جریان pairing
- [گروه‌ها](/fa/channels/groups) — رفتار چت گروهی و دروازه‌گذاری mention
- [مسیریابی کانال](/fa/channels/channel-routing) — مسیریابی نشست برای پیام‌ها
- [امنیت](/fa/gateway/security) — مدل دسترسی و سخت‌سازی
