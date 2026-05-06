---
read_when:
    - می‌خواهید عامل‌ها اصلاحات یا رویه‌های قابل استفاده‌مجدد را به Skills فضای کاری تبدیل کنند
    - در حال پیکربندی حافظه مهارتی رویه‌ای هستید
    - شما در حال اشکال‌زدایی رفتار ابزار skill_workshop هستید
    - در حال تصمیم‌گیری هستید که آیا ایجاد خودکار مهارت را فعال کنید یا نه
summary: ثبت آزمایشی رویه‌های قابل استفادهٔ مجدد به‌عنوان Skills فضای کاری با بازبینی، تأیید، قرنطینه و تازه‌سازی گرم Skills
title: Plugin کارگاه مهارت
x-i18n:
    generated_at: "2026-05-06T09:36:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

کارگاه مهارت **آزمایشی** است. به‌صورت پیش‌فرض غیرفعال است، اکتشافگرهای ضبط و اعلان‌های بازبین آن ممکن است بین انتشارها تغییر کنند، و نوشتن خودکار فقط باید در فضاهای کاری مورد اعتماد و پس از بازبینی خروجی حالت در انتظار استفاده شود.

کارگاه مهارت حافظه رویه‌ای برای مهارت‌های فضای کاری است. این قابلیت به عامل اجازه می‌دهد گردش‌کارهای قابل استفاده مجدد، اصلاحات کاربر، رفع‌اشکال‌هایی که با زحمت به دست آمده‌اند، و خطاهای تکرارشونده را به فایل‌های `SKILL.md` در مسیر زیر تبدیل کند:

```text
<workspace>/skills/<skill-name>/SKILL.md
```

این با حافظه بلندمدت متفاوت است:

- **حافظه** واقعیت‌ها، ترجیحات، موجودیت‌ها، و زمینه گذشته را ذخیره می‌کند.
- **Skills** رویه‌های قابل استفاده مجددی را ذخیره می‌کنند که عامل باید در وظایف آینده دنبال کند.
- **کارگاه مهارت** پلی از یک نوبت مفید به یک مهارت پایدار در فضای کاری است، همراه با بررسی‌های ایمنی و تأیید اختیاری.

کارگاه مهارت زمانی مفید است که عامل رویه‌ای مانند موارد زیر را یاد می‌گیرد:

- چگونگی اعتبارسنجی دارایی‌های GIF متحرک که از منابع خارجی آمده‌اند
- چگونگی جایگزینی دارایی‌های اسکرین‌شات و تأیید ابعاد
- چگونگی اجرای یک سناریوی QA ویژه مخزن
- چگونگی اشکال‌زدایی یک شکست تکرارشونده ارائه‌دهنده
- چگونگی ترمیم یک یادداشت گردش‌کار محلی قدیمی

برای موارد زیر در نظر گرفته نشده است:

- واقعیت‌هایی مانند «کاربر آبی را دوست دارد»
- حافظه زندگی‌نامه‌ای گسترده
- بایگانی خام رونوشت
- رازها، اعتبارنامه‌ها، یا متن پنهان اعلان
- دستورالعمل‌های یک‌باره‌ای که تکرار نخواهند شد

## وضعیت پیش‌فرض

Plugin بسته‌بندی‌شده **آزمایشی** است و **به‌صورت پیش‌فرض غیرفعال** است، مگر اینکه به‌طور صریح در `plugins.entries.skill-workshop` فعال شود.

مانیفست Plugin مقدار `enabledByDefault: true` را تنظیم نمی‌کند. مقدار پیش‌فرض `enabled: true` داخل شِمای پیکربندی Plugin فقط پس از آن اعمال می‌شود که ورودی Plugin از قبل انتخاب و بارگذاری شده باشد.

آزمایشی یعنی:

- Plugin به اندازه کافی برای آزمون انتخابی و استفاده داخلی پشتیبانی می‌شود
- ذخیره‌سازی پیشنهاد، آستانه‌های بازبین، و اکتشافگرهای ضبط می‌توانند تکامل یابند
- تأیید در انتظار، حالت شروع توصیه‌شده است
- اعمال خودکار برای تنظیمات شخصی/فضای کاری مورد اعتماد است، نه محیط‌های مشترک یا خصمانه که ورودی سنگین دارند

## فعال‌سازی

پیکربندی ایمن حداقلی:

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
- اصلاحات قابل استفاده مجدد صریح به‌عنوان پیشنهادهای در انتظار صف می‌شوند
- عبورهای بازبین مبتنی بر آستانه می‌توانند به‌روزرسانی‌های مهارت پیشنهاد کنند
- تا زمانی که یک پیشنهاد در انتظار اعمال نشود، هیچ فایل مهارتی نوشته نمی‌شود

نوشتن خودکار را فقط در فضاهای کاری مورد اعتماد استفاده کنید:

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

`approvalPolicy: "auto"` همچنان از همان مسیر اسکنر و قرنطینه استفاده می‌کند. پیشنهادهایی را که یافته‌های بحرانی دارند اعمال نمی‌کند.

## پیکربندی

| کلید                  | پیش‌فرض     | بازه / مقدارها                              | معنی                                                              |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | بولی                                     | Plugin را پس از بارگذاری ورودی Plugin فعال می‌کند.                 |
| `autoCapture`        | `true`      | بولی                                     | ضبط/بازبینی پس از نوبت را روی نوبت‌های موفق عامل فعال می‌کند.          |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | پیشنهادها را صف می‌کند یا پیشنهادهای ایمن را خودکار می‌نویسد.               |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | ضبط اصلاح صریح، بازبین LLM، هر دو، یا هیچ‌کدام را انتخاب می‌کند. |
| `reviewInterval`     | `15`        | `1..200`                                    | پس از این تعداد نوبت موفق، بازبین را اجرا می‌کند.                       |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | پس از این تعداد فراخوانی ابزار مشاهده‌شده، بازبین را اجرا می‌کند.                    |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | زمان‌پایان برای اجرای بازبین تعبیه‌شده.                               |
| `maxPending`         | `50`        | `1..200`                                    | بیشینه پیشنهادهای در انتظار/قرنطینه‌شده نگه‌داری‌شده برای هر فضای کاری.                |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | بیشینه اندازه فایل مهارت/پشتیبانی تولیدشده.                               |

پروفایل‌های توصیه‌شده:

```json5
// محافظه‌کارانه: فقط استفاده صریح از ابزار، بدون ضبط خودکار.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// بازبینی‌محور: ضبط خودکار، اما نیازمند تأیید.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// خودکارسازی مورد اعتماد: پیشنهادهای ایمن را فوری بنویس.
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

## مسیرهای ضبط

کارگاه مهارت سه مسیر ضبط دارد.

### پیشنهادهای ابزار

مدل می‌تواند وقتی یک رویه قابل استفاده مجدد می‌بیند یا وقتی کاربر از آن می‌خواهد یک مهارت را ذخیره/به‌روزرسانی کند، مستقیماً `skill_workshop` را فراخوانی کند.

این صریح‌ترین مسیر است و حتی با `autoCapture: false` هم کار می‌کند.

### ضبط اکتشافی

وقتی `autoCapture` فعال باشد و `reviewMode` برابر `heuristic` یا `hybrid` باشد، Plugin نوبت‌های موفق را برای عبارت‌های اصلاح صریح کاربر اسکن می‌کند:

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

اکتشافگر از تازه‌ترین دستور کاربر که مطابقت دارد یک پیشنهاد ایجاد می‌کند. از سرنخ‌های موضوعی برای انتخاب نام مهارت برای گردش‌کارهای رایج استفاده می‌کند:

- وظایف GIF متحرک -> `animated-gif-workflow`
- وظایف اسکرین‌شات یا دارایی -> `screenshot-asset-workflow`
- وظایف QA یا سناریو -> `qa-scenario-workflow`
- وظایف PR گیت‌هاب -> `github-pr-workflow`
- حالت جایگزین -> `learned-workflows`

ضبط اکتشافی عمداً محدود است. برای اصلاحات روشن و یادداشت‌های فرایندی تکرارپذیر است، نه برای خلاصه‌سازی عمومی رونوشت.

### بازبین LLM

وقتی `autoCapture` فعال باشد و `reviewMode` برابر `llm` یا `hybrid` باشد، Plugin پس از رسیدن به آستانه‌ها یک بازبین تعبیه‌شده فشرده اجرا می‌کند.

بازبین دریافت می‌کند:

- متن رونوشت اخیر، محدود به آخرین ۱۲٬۰۰۰ نویسه
- تا ۱۲ مهارت موجود فضای کاری
- تا ۲٬۰۰۰ نویسه از هر مهارت موجود
- دستورالعمل‌های فقط JSON

بازبین هیچ ابزاری ندارد:

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

بازبین یا `{ "action": "none" }` یا یک پیشنهاد برمی‌گرداند. فیلد `action` برابر `create`، `append`، یا `replace` است - وقتی یک مهارت مرتبط از قبل وجود دارد، `append`/`replace` را ترجیح دهید؛ فقط وقتی هیچ مهارت موجودی مناسب نیست از `create` استفاده کنید.

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

`append` مقدارهای `section` + `body` را اضافه می‌کند. `replace` در مهارت نام‌گذاری‌شده، `oldText` را با `newText` جایگزین می‌کند.

## چرخه عمر پیشنهاد

هر به‌روزرسانی تولیدشده به پیشنهادی با موارد زیر تبدیل می‌شود:

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` اختیاری
- `sessionId` اختیاری
- `skillName`
- `title`
- `reason`
- `source`: `tool`، `agent_end`، یا `reviewer`
- `status`
- `change`
- `scanFindings` اختیاری
- `quarantineReason` اختیاری

وضعیت‌های پیشنهاد:

- `pending` - در انتظار تأیید
- `applied` - نوشته‌شده در `<workspace>/skills`
- `rejected` - ردشده توسط اپراتور/مدل
- `quarantined` - مسدودشده به‌دلیل یافته‌های بحرانی اسکنر

وضعیت برای هر فضای کاری در دایرکتوری وضعیت Gateway ذخیره می‌شود:

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

پیشنهادهای در انتظار و قرنطینه‌شده بر اساس نام مهارت و محتوای تغییر
تکراری‌زدایی می‌شوند. ذخیره‌ساز جدیدترین پیشنهادهای در انتظار/قرنطینه‌شده را تا سقف
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

فهرست کردن پیشنهادهای در انتظار.

```json
{ "action": "list_pending" }
```

برای فهرست کردن وضعیتی دیگر:

```json
{ "action": "list_pending", "status": "applied" }
```

مقادیر معتبر `status`:

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

فهرست کردن پیشنهادهای قرنطینه‌شده.

```json
{ "action": "list_quarantine" }
```

وقتی ثبت خودکار ظاهراً هیچ کاری انجام نمی‌دهد و گزارش‌ها به
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

ایجاد یک پیشنهاد. با `approvalPolicy: "pending"` (پیش‌فرض)، این کار به‌جای نوشتن، آن را در صف قرار می‌دهد.

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
  <Accordion title="Force a safe write (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

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

نوشتن یک فایل پشتیبان داخل دایرکتوری یک مهارت موجود یا پیشنهادی.

دایرکتوری‌های پشتیبان مجاز در سطح بالا:

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

فایل‌های پشتیبان در محدوده‌ی workspace هستند، مسیرشان بررسی می‌شود، بر اساس
`maxSkillBytes` محدودیت بایتی دارند، اسکن می‌شوند و به‌صورت اتمیک نوشته می‌شوند.

## نوشتن مهارت‌ها

Skill Workshop فقط در مسیر زیر می‌نویسد:

```text
<workspace>/skills/<normalized-skill-name>/
```

نام‌های مهارت عادی‌سازی می‌شوند:

- به حروف کوچک تبدیل می‌شوند
- دنباله‌های غیر از `[a-z0-9_-]` به `-` تبدیل می‌شوند
- نویسه‌های غیرحرف‌عددی ابتدا/انتهای نام حذف می‌شوند
- حداکثر طول ۸۰ نویسه است
- نام نهایی باید با `[a-z0-9][a-z0-9_-]{1,79}` مطابقت داشته باشد

برای `create`:

- اگر مهارت وجود نداشته باشد، Skill Workshop یک `SKILL.md` جدید می‌نویسد
- اگر از قبل وجود داشته باشد، Skill Workshop بدنه را به `## Workflow` اضافه می‌کند

برای `append`:

- اگر مهارت وجود داشته باشد، Skill Workshop متن را به بخش درخواست‌شده اضافه می‌کند
- اگر وجود نداشته باشد، Skill Workshop یک مهارت حداقلی ایجاد می‌کند و سپس متن را اضافه می‌کند

برای `replace`:

- مهارت باید از قبل وجود داشته باشد
- `oldText` باید دقیقاً موجود باشد
- فقط نخستین تطابق دقیق جایگزین می‌شود

همه‌ی نوشتن‌ها اتمیک هستند و فوراً snapshot درون‌حافظه‌ای مهارت‌ها را تازه‌سازی می‌کنند، بنابراین
مهارت جدید یا به‌روزشده می‌تواند بدون راه‌اندازی دوباره‌ی Gateway قابل مشاهده شود.

## مدل ایمنی

Skill Workshop روی محتوای تولیدشده‌ی `SKILL.md` و فایل‌های پشتیبان
اسکنر ایمنی دارد.

یافته‌های بحرانی proposalها را قرنطینه می‌کنند:

| شناسه‌ی قاعده                         | محتوایی را مسدود می‌کند که...                                         |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | به عامل می‌گوید دستورهای قبلی/بالاتر را نادیده بگیرد                 |
| `prompt-injection-system`              | به promptهای سیستمی، پیام‌های توسعه‌دهنده یا دستورهای پنهان اشاره می‌کند |
| `prompt-injection-tool`                | دور زدن مجوز/تأیید ابزار را تشویق می‌کند                             |
| `shell-pipe-to-shell`                  | شامل `curl`/`wget` است که به `sh`، `bash` یا `zsh` pipe شده‌اند       |
| `secret-exfiltration`                  | به نظر می‌رسد داده‌های env/process env را از طریق شبکه ارسال می‌کند   |

یافته‌های هشدار نگه داشته می‌شوند اما به‌تنهایی مسدود نمی‌کنند:

| شناسه‌ی قاعده       | درباره‌ی... هشدار می‌دهد        |
| -------------------- | -------------------------------- |
| `destructive-delete` | فرمان‌های گسترده به سبک `rm -rf` |
| `unsafe-permissions` | استفاده از مجوز به سبک `chmod 777` |

Proposalهای قرنطینه‌شده:

- `scanFindings` را نگه می‌دارند
- `quarantineReason` را نگه می‌دارند
- در `list_quarantine` ظاهر می‌شوند
- از طریق `apply` قابل اعمال نیستند

برای بازیابی از یک proposal قرنطینه‌شده، یک proposal امن جدید بسازید که
محتوای ناامن از آن حذف شده باشد. JSON ذخیره‌گاه را دستی ویرایش نکنید.

## راهنمای prompt

وقتی فعال باشد، Skill Workshop یک بخش prompt کوتاه تزریق می‌کند که به عامل می‌گوید
برای حافظه‌ی رویه‌ای پایدار از `skill_workshop` استفاده کند.

این راهنما بر موارد زیر تأکید می‌کند:

- رویه‌ها، نه واقعیت‌ها/ترجیحات
- اصلاحات کاربر
- رویه‌های موفقِ غیر بدیهی
- دام‌های تکرارشونده
- ترمیم مهارت‌های کهنه/کم‌جزئیات/نادرست از طریق append/replace
- ذخیره‌ی رویه‌ی قابل استفاده‌ی دوباره پس از چرخه‌های طولانی ابزار یا رفع‌های دشوار
- متن مهارت کوتاه و امری
- بدون dump کردن transcript

متن حالت نوشتن با `approvalPolicy` تغییر می‌کند:

- حالت pending: پیشنهادها را در صف بگذارید؛ فقط پس از تأیید صریح اعمال کنید
- حالت auto: به‌روزرسانی‌های امنِ مهارت‌های workspace را وقتی آشکارا قابل استفاده‌ی دوباره هستند اعمال کنید

## هزینه‌ها و رفتار زمان اجرا

capture اکتشافی مدل را فراخوانی نمی‌کند.

بازبینی LLM از یک اجرای embedded روی مدل عامل فعال/پیش‌فرض استفاده می‌کند. این بازبینی
مبتنی بر آستانه است، بنابراین به‌صورت پیش‌فرض در هر نوبت اجرا نمی‌شود.

بازبین:

- وقتی در دسترس باشد، از همان زمینه‌ی provider/model پیکربندی‌شده استفاده می‌کند
- به پیش‌فرض‌های عامل زمان اجرا fallback می‌کند
- `reviewTimeoutMs` دارد
- از زمینه‌ی bootstrap سبک استفاده می‌کند
- ابزار ندارد
- مستقیماً چیزی نمی‌نویسد
- فقط می‌تواند proposalی منتشر کند که از مسیر عادی اسکنر و
  تأیید/قرنطینه عبور می‌کند

اگر بازبین شکست بخورد، time out شود، یا JSON نامعتبر برگرداند، Plugin یک پیام
هشدار/debug ثبت می‌کند و آن گذر بازبینی را رد می‌کند.

## الگوهای عملیاتی

وقتی کاربر می‌گوید از Skill Workshop استفاده کنید:

- "next time, do X"
- "from now on, prefer Y"
- "make sure to verify Z"
- "save this as a workflow"
- "this took a while; remember the process"
- "update the local skill for this"

متن مهارت خوب:

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

متن مهارت ضعیف:

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

دلایلی که نسخه‌ی ضعیف نباید ذخیره شود:

- شکل transcript دارد
- امری نیست
- شامل جزئیات پرنویز و یک‌باره است
- به عامل بعدی نمی‌گوید چه کاری انجام دهد

## اشکال‌زدایی

بررسی کنید Plugin بارگذاری شده است یا نه:

```bash
openclaw plugins list --enabled
```

شمار proposalها را از زمینه‌ی عامل/ابزار بررسی کنید:

```json
{ "action": "status" }
```

Proposalهای pending را بررسی کنید:

```json
{ "action": "list_pending" }
```

Proposalهای قرنطینه‌شده را بررسی کنید:

```json
{ "action": "list_quarantine" }
```

نشانه‌های رایج:

| نشانه                                | علت محتمل                                                                          | بررسی                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ابزار در دسترس نیست                  | ورودی Plugin فعال نشده است                                                          | `plugins.entries.skill-workshop.enabled` و `openclaw plugins list`  |
| proposal خودکار ظاهر نمی‌شود         | `autoCapture: false`، `reviewMode: "off"`، یا برآورده نشدن آستانه‌ها                | پیکربندی، وضعیت proposal، لاگ‌های Gateway                            |
| اکتشاف capture نکرد                  | wording کاربر با الگوهای اصلاح مطابقت نداشت                                        | از `skill_workshop.suggest` صریح استفاده کنید یا بازبین LLM را فعال کنید |
| بازبین proposal ایجاد نکرد           | بازبین `none` یا JSON نامعتبر برگرداند، یا time out شد                              | لاگ‌های Gateway، `reviewTimeoutMs`، آستانه‌ها                         |
| proposal اعمال نمی‌شود               | `approvalPolicy: "pending"`                                                         | `list_pending`، سپس `apply`                                          |
| proposal از pending ناپدید شد        | proposal تکراری دوباره استفاده شد، هرس حداکثر pending، یا اعمال/رد/قرنطینه شده است | `status`، `list_pending` با فیلترهای وضعیت، `list_quarantine`        |
| فایل مهارت وجود دارد اما مدل آن را از دست می‌دهد | snapshot مهارت تازه‌سازی نشده یا gating مهارت آن را کنار می‌گذارد                  | وضعیت `openclaw skills` و واجد شرایط بودن مهارت workspace            |

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

پوشش deterministic را اجرا کنید:

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

## چه زمانی auto apply را فعال نکنید

وقتی موارد زیر برقرار است، از `approvalPolicy: "auto"` اجتناب کنید:

- workspace شامل رویه‌های حساس است
- عامل روی ورودی نامطمئن کار می‌کند
- مهارت‌ها میان یک تیم گسترده مشترک هستند
- هنوز در حال تنظیم promptها یا قواعد اسکنر هستید
- مدل مکرراً محتوای خصمانه‌ی وب/ایمیل را مدیریت می‌کند

ابتدا از حالت pending استفاده کنید. فقط پس از بازبینی نوع
مهارت‌هایی که عامل در آن workspace پیشنهاد می‌دهد، به حالت auto بروید.

## مستندات مرتبط

- [Skills](/fa/tools/skills)
- [Plugins](/fa/tools/plugin)
- [آزمایش](/fa/reference/test)
