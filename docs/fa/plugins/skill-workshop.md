---
read_when:
    - می‌خواهید عامل‌ها اصلاحات یا رویه‌های قابل استفادهٔ مجدد را به Skills فضای کاری تبدیل کنند
    - شما در حال پیکربندی حافظهٔ مهارت رویه‌ای هستید
    - در حال اشکال‌زدایی رفتار ابزار skill_workshop هستید
    - در حال تصمیم‌گیری هستید که آیا ایجاد خودکار Skills را فعال کنید
summary: ثبت آزمایشی رویه‌های قابل‌استفادهٔ مجدد به‌عنوان Skills فضای کاری، همراه با بازبینی، تأیید، قرنطینه و بازآوری داغ Skills
title: Plugin کارگاه مهارت
x-i18n:
    generated_at: "2026-05-07T13:28:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

کارگاه Skills **آزمایشی** است. به‌صورت پیش‌فرض غیرفعال است، اکتشافگرهای ثبت و پرامپت‌های بازبین آن ممکن است بین انتشارها تغییر کنند، و نوشتن خودکار فقط باید در workspaceهای مورد اعتماد و پس از بازبینی خروجی حالت pending استفاده شود.

کارگاه Skills حافظه رویه‌ای برای Skills مربوط به workspace است. این امکان را به عامل می‌دهد تا گردش‌کارهای قابل استفاده مجدد، اصلاحات کاربر، رفع‌اشکال‌های دشوار به‌دست‌آمده، و دام‌های تکرارشونده را به فایل‌های `SKILL.md` در مسیر زیر تبدیل کند:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

این با حافظه بلندمدت متفاوت است:

- **حافظه** واقعیت‌ها، ترجیحات، موجودیت‌ها، و زمینه گذشته را ذخیره می‌کند.
- **Skills** رویه‌های قابل استفاده مجددی را ذخیره می‌کند که عامل باید در کارهای آینده دنبال کند.
- **کارگاه Skills** پلی از یک نوبت مفید به یک Skill پایدار در workspace است، همراه با بررسی‌های ایمنی و تأیید اختیاری.

کارگاه Skills زمانی مفید است که عامل رویه‌ای مانند موارد زیر را یاد می‌گیرد:

- نحوه اعتبارسنجی دارایی‌های GIF متحرک با منشأ خارجی
- نحوه جایگزینی دارایی‌های اسکرین‌شات و بررسی ابعاد
- نحوه اجرای یک سناریوی QA ویژه repo
- نحوه اشکال‌زدایی یک خطای تکرارشونده provider
- نحوه تعمیر یک یادداشت گردش‌کار محلی کهنه

برای موارد زیر در نظر گرفته نشده است:

- واقعیت‌هایی مانند «کاربر رنگ آبی را دوست دارد»
- حافظه زندگی‌نامه‌ای گسترده
- بایگانی خام transcript
- secrets، credentials، یا متن پنهان prompt
- دستورالعمل‌های یک‌باره که تکرار نخواهند شد

## وضعیت پیش‌فرض

Plugin همراه **آزمایشی** است و **به‌صورت پیش‌فرض غیرفعال** است، مگر اینکه به‌صراحت در `plugins.entries.skill-workshop` فعال شود.

manifest مربوط به Plugin مقدار `enabledByDefault: true` را تنظیم نمی‌کند. مقدار پیش‌فرض `enabled: true` داخل schema پیکربندی Plugin فقط پس از آن اعمال می‌شود که ورودی Plugin از قبل انتخاب و بارگذاری شده باشد.

آزمایشی یعنی:

- Plugin به‌اندازه کافی برای آزمون opt-in و dogfooding پشتیبانی می‌شود
- ذخیره‌سازی proposal، آستانه‌های بازبین، و اکتشافگرهای ثبت می‌توانند تکامل پیدا کنند
- تأیید pending حالت شروع توصیه‌شده است
- auto apply برای تنظیمات شخصی/workspace مورد اعتماد است، نه محیط‌های مشترک یا خصمانه با ورودی زیاد

## فعال‌سازی

پیکربندی حداقلی ایمن:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

با این پیکربندی:

- ابزار `skill_workshop` در دسترس است
- اصلاحات قابل استفاده مجدد صریح به‌عنوان proposalهای pending در صف قرار می‌گیرند
- گذرهای بازبین مبتنی بر آستانه می‌توانند به‌روزرسانی Skill پیشنهاد کنند
- هیچ فایل Skill تا زمانی که یک proposal در حالت pending اعمال نشود نوشته نمی‌شود

نوشتن خودکار را فقط در workspaceهای مورد اعتماد استفاده کنید:

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` همچنان از همان scanner و مسیر quarantine استفاده می‌کند. proposalهایی را که یافته‌های critical دارند اعمال نمی‌کند.

## پیکربندی

| کلید                 | پیش‌فرض    | بازه / مقادیر                                | معنی                                                                 |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Plugin را پس از بارگذاری ورودی Plugin فعال می‌کند.                  |
| `autoCapture`        | `true`      | boolean                                     | ثبت/بازبینی پس از نوبت را در نوبت‌های موفق عامل فعال می‌کند.        |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | proposalها را در صف قرار می‌دهد یا proposalهای ایمن را خودکار می‌نویسد. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | ثبت اصلاح صریح، بازبین LLM، هر دو، یا هیچ‌کدام را انتخاب می‌کند.     |
| `reviewInterval`     | `15`        | `1..200`                                    | پس از این تعداد نوبت موفق، بازبین را اجرا می‌کند.                   |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | پس از این تعداد tool call مشاهده‌شده، بازبین را اجرا می‌کند.         |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | timeout برای اجرای بازبین تعبیه‌شده.                                |
| `maxPending`         | `50`        | `1..200`                                    | حداکثر proposalهای pending/quarantined نگه‌داری‌شده برای هر workspace. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | حداکثر اندازه فایل Skill/support تولیدشده.                          |

پروفایل‌های توصیه‌شده:

```json5
// محافظه‌کارانه: فقط استفاده صریح از ابزار، بدون ثبت خودکار.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// بازبینی‌محور: ثبت خودکار، اما با نیاز به تأیید.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// خودکارسازی مورد اعتماد: proposalهای ایمن را فوراً بنویس.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// کم‌هزینه: بدون فراخوانی LLM بازبین، فقط عبارت‌های اصلاح صریح.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## مسیرهای ثبت

کارگاه Skills سه مسیر ثبت دارد.

### پیشنهادهای ابزار

مدل می‌تواند وقتی یک رویه قابل استفاده مجدد می‌بیند یا وقتی کاربر از آن می‌خواهد یک Skill را ذخیره/به‌روزرسانی کند، مستقیماً `skill_workshop` را فراخوانی کند.

این صریح‌ترین مسیر است و حتی با `autoCapture: false` نیز کار می‌کند.

### ثبت heuristic

وقتی `autoCapture` فعال باشد و `reviewMode` مقدار `heuristic` یا `hybrid` داشته باشد، Plugin نوبت‌های موفق را برای عبارت‌های اصلاح صریح کاربر اسکن می‌کند:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

heuristic از آخرین دستور کاربر که تطابق دارد یک proposal می‌سازد. برای انتخاب نام Skill برای گردش‌کارهای رایج از راهنماهای موضوعی استفاده می‌کند:

- وظایف GIF متحرک -> `animated-gif-workflow`
- وظایف اسکرین‌شات یا دارایی -> `screenshot-asset-workflow`
- وظایف QA یا سناریو -> `qa-scenario-workflow`
- وظایف PR در GitHub -> `github-pr-workflow`
- fallback -> `learned-workflows`

ثبت heuristic عمداً محدود است. برای اصلاحات روشن و یادداشت‌های فرایندی تکرارپذیر است، نه برای خلاصه‌سازی عمومی transcript.

### بازبین LLM

وقتی `autoCapture` فعال باشد و `reviewMode` مقدار `llm` یا `hybrid` داشته باشد، Plugin پس از رسیدن به آستانه‌ها یک بازبین تعبیه‌شده فشرده اجرا می‌کند.

بازبین موارد زیر را دریافت می‌کند:

- متن transcript اخیر، محدود به ۱۲٬۰۰۰ کاراکتر آخر
- حداکثر ۱۲ Skill موجود در workspace
- حداکثر ۲٬۰۰۰ کاراکتر از هر Skill موجود
- دستورالعمل‌های فقط JSON

بازبین هیچ ابزاری ندارد:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

بازبین یا `{ "action": "none" }` یا یک proposal برمی‌گرداند. فیلد `action` مقدار `create`، `append`، یا `replace` است - وقتی Skill مرتبطی از قبل وجود دارد `append`/`replace` را ترجیح دهید؛ فقط وقتی هیچ Skill موجودی مناسب نیست از `create` استفاده کنید.

نمونه `create`:

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

`append` مقدار `section` + `body` را اضافه می‌کند. `replace` مقدار `oldText` را در Skill نام‌گذاری‌شده با `newText` جایگزین می‌کند.

## چرخه عمر proposal

هر به‌روزرسانی تولیدشده به یک proposal با موارد زیر تبدیل می‌شود:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- اختیاری `agentId`
- اختیاری `sessionId`
- `skillName`
- `title`
- `reason`
- `source`: `tool`، `agent_end`، یا `reviewer`
- `status`
- `change`
- اختیاری `scanFindings`
- اختیاری `quarantineReason`

وضعیت‌های proposal:

- `pending` - در انتظار تأیید
- `applied` - در `<workspace>/skills` نوشته شده
- `rejected` - توسط operator/model رد شده
- `quarantined` - توسط یافته‌های critical scanner مسدود شده

وضعیت برای هر فضای کاری در دایرکتوری وضعیت Gateway ذخیره می‌شود:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

پیشنهادهای در انتظار و قرنطینه‌شده بر اساس نام مهارت و بار دادهٔ تغییر
تکرارزدایی می‌شوند. ذخیره‌ساز جدیدترین پیشنهادهای در انتظار/قرنطینه‌شده را تا سقف
`maxPending` نگه می‌دارد.

## مرجع ابزار

Plugin یک ابزار عامل ثبت می‌کند:

```text
skill_workshop
```

### `status`

شمارش پیشنهادها بر اساس وضعیت برای فضای کاری فعال.

```json
{ "action": "status" }
```

شکل نتیجه:

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

فهرست پیشنهادهای در انتظار.

```json
{ "action": "list_pending" }
```

برای فهرست کردن وضعیت دیگر:

```json
{ "action": "list_pending", "status": "applied" }
```

مقادیر معتبر `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

فهرست پیشنهادهای قرنطینه‌شده.

```json
{ "action": "list_quarantine" }
```

وقتی ثبت خودکار ظاهراً هیچ کاری انجام نمی‌دهد و لاگ‌ها به
`skill-workshop: quarantined <skill>` اشاره می‌کنند، از این استفاده کنید.

### `inspect`

دریافت یک پیشنهاد بر اساس شناسه.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

ایجاد یک پیشنهاد. با `approvalPolicy: "pending"` (پیش‌فرض)، این مورد به‌جای نوشتن در صف قرار می‌گیرد.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

<AccordionGroup>
  <Accordion title="Request immediate write in auto mode (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

با `approvalPolicy: "pending"`، حتی `apply: true` نیز پیشنهاد را در صف قرار می‌دهد. آن را بازبینی کنید، سپس پس از تأیید از کنش
`apply` استفاده کنید.

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Append to a named section">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Replace exact text">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

اعمال یک پیشنهاد در انتظار.

با `approvalPolicy: "pending"`، این کنش پیش از نوشتن مهارت فضای کاری، تأیید اپراتور را درخواست می‌کند.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` پیشنهادهای قرنطینه‌شده را نمی‌پذیرد:

```text
quarantined proposal cannot be applied
```

### `reject`

علامت‌گذاری یک پیشنهاد به‌عنوان ردشده.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

نوشتن یک فایل پشتیبان داخل یک دایرکتوری مهارت موجود یا پیشنهادی.

دایرکتوری‌های پشتیبان سطح بالای مجاز:

- `references/`
- `templates/`
- `scripts/`
- `assets/`

مثال:

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

فایل‌های پشتیبان محدود به workspace هستند، مسیرشان بررسی می‌شود، اندازه‌شان با
`maxSkillBytes` محدود می‌شود، اسکن می‌شوند و به‌صورت اتمیک نوشته می‌شوند.

## نوشتن مهارت‌ها

Skill Workshop فقط زیر این مسیر می‌نویسد:

```text
<workspace>/skills/<normalized-skill-name>/
```

نام مهارت‌ها نرمال‌سازی می‌شود:

- به حروف کوچک تبدیل می‌شود
- دنباله‌های غیر از `[a-z0-9_-]` به `-` تبدیل می‌شوند
- نویسه‌های غیرحرفی‌عددی ابتدایی/انتهایی حذف می‌شوند
- حداکثر طول ۸۰ نویسه است
- نام نهایی باید با `[a-z0-9][a-z0-9_-]{1,79}` مطابقت داشته باشد

برای `create`:

- اگر مهارت وجود نداشته باشد، Skill Workshop یک `SKILL.md` جدید می‌نویسد
- اگر از قبل وجود داشته باشد، Skill Workshop بدنه را به `## Workflow` اضافه می‌کند

برای `append`:

- اگر مهارت وجود داشته باشد، Skill Workshop به بخش درخواست‌شده اضافه می‌کند
- اگر وجود نداشته باشد، Skill Workshop یک مهارت حداقلی ایجاد می‌کند و سپس اضافه می‌کند

برای `replace`:

- مهارت باید از قبل وجود داشته باشد
- `oldText` باید دقیقاً وجود داشته باشد
- فقط اولین تطابق دقیق جایگزین می‌شود

همهٔ نوشتن‌ها اتمیک هستند و snapshot درون‌حافظه‌ای مهارت‌ها را بلافاصله تازه‌سازی می‌کنند، بنابراین
مهارت جدید یا به‌روزشده می‌تواند بدون راه‌اندازی دوبارهٔ Gateway قابل مشاهده شود.

## مدل ایمنی

Skill Workshop روی محتوای تولیدشدهٔ `SKILL.md` و فایل‌های پشتیبان، اسکنر ایمنی دارد.

یافته‌های بحرانی پیشنهادها را قرنطینه می‌کنند:

| شناسهٔ قاعده                          | محتوایی را مسدود می‌کند که...                                      |
| -------------------------------------- | ------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | به عامل می‌گوید دستورالعمل‌های قبلی/بالاتر را نادیده بگیرد         |
| `prompt-injection-system`              | به پرامپت‌های سیستم، پیام‌های توسعه‌دهنده، یا دستورالعمل‌های پنهان ارجاع می‌دهد |
| `prompt-injection-tool`                | دور زدن مجوز/تأیید ابزار را تشویق می‌کند                           |
| `shell-pipe-to-shell`                  | شامل `curl`/`wget` لوله‌شده به `sh`، `bash`، یا `zsh` است           |
| `secret-exfiltration`                  | به نظر می‌رسد داده‌های env/process env را از طریق شبکه ارسال می‌کند |

یافته‌های هشدار نگه داشته می‌شوند اما به‌تنهایی مسدود نمی‌کنند:

| شناسهٔ قاعده       | دربارهٔ... هشدار می‌دهد           |
| ------------------ | --------------------------------- |
| `destructive-delete` | فرمان‌های گسترده به سبک `rm -rf` |
| `unsafe-permissions` | استفاده از مجوز به سبک `chmod 777` |

پیشنهادهای قرنطینه‌شده:

- `scanFindings` را نگه می‌دارند
- `quarantineReason` را نگه می‌دارند
- در `list_quarantine` ظاهر می‌شوند
- از طریق `apply` قابل اعمال نیستند

برای بازیابی از یک پیشنهاد قرنطینه‌شده، یک پیشنهاد امن جدید ایجاد کنید که
محتوای ناامن از آن حذف شده باشد. JSON ذخیره‌گاه را دستی ویرایش نکنید.

## راهنمایی پرامپت

وقتی فعال باشد، Skill Workshop یک بخش کوتاه پرامپت تزریق می‌کند که به عامل می‌گوید
برای حافظهٔ رویه‌ای پایدار از `skill_workshop` استفاده کند.

این راهنمایی بر این موارد تأکید می‌کند:

- رویه‌ها، نه واقعیت‌ها/ترجیحات
- اصلاحات کاربر
- رویه‌های موفق غیرآشکار
- دام‌های تکرارشونده
- تعمیر مهارت کهنه/کم‌محتوا/نادرست از طریق append/replace
- ذخیرهٔ رویهٔ قابل استفادهٔ دوباره پس از حلقه‌های طولانی ابزار یا رفع‌های دشوار
- متن مهارت کوتاه و امری
- بدون رونوشت‌های transcript

متن حالت نوشتن با `approvalPolicy` تغییر می‌کند:

- حالت pending: پیشنهادها را در صف بگذارید؛ پس از تأیید صریح از `apply` استفاده کنید
- حالت auto: به‌روزرسانی‌های امن مهارت workspace را اعمال کنید، مگر اینکه `apply: false` در عوض آن‌ها را در صف بگذارد

## هزینه‌ها و رفتار زمان اجرا

ثبت اکتشافی مدلی را فراخوانی نمی‌کند.

بازبینی LLM از یک اجرای embedded روی مدل فعال/پیش‌فرض عامل استفاده می‌کند. این بازبینی
آستانه‌محور است، بنابراین به‌طور پیش‌فرض در هر نوبت اجرا نمی‌شود.

بازبین:

- در صورت موجود بودن، از همان زمینهٔ provider/model پیکربندی‌شده استفاده می‌کند
- به پیش‌فرض‌های عامل زمان اجرا fallback می‌کند
- `reviewTimeoutMs` دارد
- از زمینهٔ bootstrap سبک استفاده می‌کند
- هیچ ابزاری ندارد
- مستقیماً چیزی نمی‌نویسد
- فقط می‌تواند پیشنهادی emit کند که از مسیر معمول اسکنر و
  تأیید/قرنطینه عبور می‌کند

اگر بازبین شکست بخورد، timeout شود، یا JSON نامعتبر برگرداند، Plugin یک پیام
هشدار/debug ثبت می‌کند و آن گذر بازبینی را رد می‌کند.

## الگوهای عملیاتی

وقتی کاربر می‌گوید از Skill Workshop استفاده کنید:

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

متن خوب مهارت:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

متن ضعیف مهارت:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

دلایلی که نسخهٔ ضعیف نباید ذخیره شود:

- شکل transcript دارد
- امری نیست
- شامل جزئیات پرنویز و یک‌باره است
- به عامل بعدی نمی‌گوید چه کار کند

## اشکال‌زدایی

بررسی کنید Plugin بارگذاری شده است یا نه:

```bash
openclaw plugins list --enabled
```

شمار پیشنهادها را از زمینهٔ عامل/ابزار بررسی کنید:

```json
{ "action": "status" }
```

پیشنهادهای pending را بررسی کنید:

```json
{ "action": "list_pending" }
```

پیشنهادهای قرنطینه‌شده را بررسی کنید:

```json
{ "action": "list_quarantine" }
```

نشانه‌های رایج:

| نشانه                                | علت محتمل                                                                          | بررسی                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ابزار در دسترس نیست                 | ورودی Plugin فعال نیست                                                             | `plugins.entries.skill-workshop.enabled` و `openclaw plugins list` |
| پیشنهاد خودکاری ظاهر نمی‌شود        | `autoCapture: false`، `reviewMode: "off"`، یا آستانه‌ها برآورده نشده‌اند           | پیکربندی، وضعیت پیشنهاد، لاگ‌های Gateway                           |
| ثبت اکتشافی انجام نشد               | عبارت‌پردازی کاربر با الگوهای اصلاح مطابقت نداشت                                  | از `skill_workshop.suggest` صریح استفاده کنید یا بازبین LLM را فعال کنید |
| بازبین پیشنهادی ایجاد نکرد          | بازبین `none`، JSON نامعتبر، یا timeout برگرداند                                   | لاگ‌های Gateway، `reviewTimeoutMs`، آستانه‌ها                       |
| پیشنهاد اعمال نمی‌شود               | `approvalPolicy: "pending"`                                                        | `list_pending`، سپس `apply`                                         |
| پیشنهاد از pending ناپدید شد        | پیشنهاد تکراری دوباره استفاده شد، هرس حداکثر pending، یا اعمال/رد/قرنطینه شده بود | `status`، `list_pending` با فیلترهای وضعیت، `list_quarantine`       |
| فایل مهارت وجود دارد اما مدل آن را از دست می‌دهد | snapshot مهارت تازه‌سازی نشده یا gating مهارت آن را مستثنا می‌کند                 | وضعیت `openclaw skills` و واجد شرایط بودن مهارت workspace           |

لاگ‌های مرتبط:

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## سناریوهای QA

سناریوهای QA مبتنی بر repo:

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

پوشش قطعی را اجرا کنید:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

پوشش بازبین را اجرا کنید:

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

سناریوی بازبین عمداً جداست، چون
`reviewMode: "llm"` را فعال می‌کند و گذر بازبین embedded را تمرین می‌دهد.

## چه زمانی auto apply را فعال نکنیم

وقتی موارد زیر برقرار است از `approvalPolicy: "auto"` پرهیز کنید:

- workspace شامل رویه‌های حساس است
- عامل روی ورودی نامطمئن کار می‌کند
- مهارت‌ها در یک تیم گسترده به اشتراک گذاشته می‌شوند
- هنوز در حال تنظیم پرامپت‌ها یا قواعد اسکنر هستید
- مدل اغلب محتوای خصمانهٔ وب/ایمیل را پردازش می‌کند

ابتدا از حالت pending استفاده کنید. فقط پس از بازبینی نوع
مهارت‌هایی که عامل در آن workspace پیشنهاد می‌دهد، به حالت auto بروید.

## مستندات مرتبط

- [Skills](/fa/tools/skills)
- [Plugins](/fa/tools/plugin)
- [آزمایش](/fa/reference/test)
