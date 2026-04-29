---
read_when:
    - تنظیم جزئی رابط کاربری منوی مک یا منطق وضعیت
summary: منطق وضعیت نوار منو و آنچه به کاربران نمایش داده می‌شود
title: نوار منو
x-i18n:
    generated_at: "2026-04-29T23:11:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89b03f3b0f9e56057d4cbf10bd1252372c65a2b2ae5e0405a844e9a59b51405d
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# منطق وضعیت نوار منو

## چه چیزی نمایش داده می‌شود

- وضعیت کار فعلی agent را در آیکون نوار منو و در نخستین ردیف وضعیت منو نمایش می‌دهیم.
- وضعیت سلامت هنگام فعال بودن کار پنهان می‌شود؛ وقتی همه sessionها idle باشند دوباره برمی‌گردد.
- بلوک «Nodes» در منو فقط **دستگاه‌ها** را فهرست می‌کند (nodeهای pair شده از طریق `node.list`)، نه ورودی‌های client/presence.
- وقتی snapshotهای مصرف provider در دسترس باشند، بخشی با عنوان «مصرف» زیر Context ظاهر می‌شود.

## مدل وضعیت

- Sessionها: رویدادها با `runId` (برای هر run) به‌همراه `sessionKey` در payload می‌رسند. session «اصلی» کلید `main` است؛ اگر وجود نداشته باشد، به آخرین session به‌روزرسانی‌شده fallback می‌کنیم.
- اولویت: main همیشه برنده است. اگر main فعال باشد، وضعیت آن بلافاصله نمایش داده می‌شود. اگر main idle باشد، آخرین session غیر main فعال نمایش داده می‌شود. در میانه فعالیت بالا و پایین نمی‌پریم؛ فقط وقتی session فعلی idle شود یا main فعال شود، جابه‌جا می‌شویم.
- نوع‌های فعالیت:
  - `job`: اجرای دستور سطح بالا (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` با `toolName` و `meta/args`.

## enum ‏IconState ‏(Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (override برای debug)

### ActivityKind → glyph

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- پیش‌فرض → 🛠️

### نگاشت بصری

- `idle`: critter عادی.
- `workingMain`: badge با glyph، tint کامل، انیمیشن «working» پا.
- `workingOther`: badge با glyph، tint کم‌رنگ، بدون scurry.
- `overridden`: بدون توجه به فعالیت، از glyph/tint انتخاب‌شده استفاده می‌کند.

## متن ردیف وضعیت (منو)

- هنگام فعال بودن کار: `<Session role> · <activity label>`
  - نمونه‌ها: `Main · exec: pnpm test`، `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- وقتی idle است: به خلاصه سلامت fallback می‌کند.

## دریافت رویداد

- منبع: رویدادهای `agent` کانال کنترل (`ControlChannel.handleAgentEvent`).
- فیلدهای parse شده:
  - `stream: "job"` با `data.state` برای شروع/توقف.
  - `stream: "tool"` با `data.phase`، `name`، و `meta`/`args` اختیاری.
- برچسب‌ها:
  - `exec`: خط اول `args.command`.
  - `read`/`write`: مسیر کوتاه‌شده.
  - `edit`: مسیر به‌همراه نوع تغییر استنباط‌شده از `meta`/تعداد diff.
  - fallback: نام tool.

## Override برای debug

- Settings ▸ Debug ▸ انتخاب‌گر «Icon override»:
  - `System (auto)` (پیش‌فرض)
  - `Working: main` (برای هر نوع tool)
  - `Working: other` (برای هر نوع tool)
  - `Idle`
- از طریق `@AppStorage("iconOverride")` ذخیره می‌شود؛ به `IconState.overridden` نگاشت می‌شود.

## فهرست بررسی تست

- job مربوط به session اصلی را trigger کنید: بررسی کنید آیکون بلافاصله تغییر کند و ردیف وضعیت برچسب main را نشان دهد.
- job مربوط به session غیر main را وقتی main idle است trigger کنید: آیکون/وضعیت غیر main را نشان می‌دهد؛ تا پایان آن پایدار می‌ماند.
- هنگام فعال بودن other، main را شروع کنید: آیکون بی‌درنگ به main تغییر می‌کند.
- burstهای سریع tool: مطمئن شوید badge چشمک نمی‌زند (مهلت TTL روی نتیجه‌های tool).
- وقتی همه sessionها idle شدند، ردیف سلامت دوباره ظاهر می‌شود.

## مرتبط

- [اپ macOS](/fa/platforms/macos)
- [آیکون نوار منو](/fa/platforms/mac/icon)
