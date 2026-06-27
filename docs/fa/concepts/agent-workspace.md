---
read_when:
    - باید فضای کاری عامل یا چیدمان فایل‌های آن را توضیح دهید
    - می‌خواهید از فضای کاری عامل پشتیبان بگیرید یا آن را مهاجرت دهید
sidebarTitle: Agent workspace
summary: 'فضای کاری عامل: مکان، چیدمان، و راهبرد پشتیبان‌گیری'
title: فضای کاری عامل
x-i18n:
    generated_at: "2026-06-27T17:30:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6020aa96b2aa829a9684164994d1fb1fb1b31157c47b60e947ad82f9f5508e1c
    source_path: concepts/agent-workspace.md
    workflow: 16
---

فضای کاری خانهٔ عامل است. این تنها دایرکتوری کاری است که برای ابزارهای فایل و برای زمینهٔ فضای کاری استفاده می‌شود. آن را خصوصی نگه دارید و مانند حافظه با آن رفتار کنید.

این از `~/.openclaw/` جداست؛ مسیری که پیکربندی، اعتبارنامه‌ها و نشست‌ها را ذخیره می‌کند.

<Warning>
فضای کاری **cwd پیش‌فرض** است، نه یک sandbox سخت‌گیرانه. ابزارها مسیرهای نسبی را نسبت به فضای کاری resolve می‌کنند، اما مسیرهای مطلق همچنان می‌توانند به جاهای دیگر روی میزبان دسترسی پیدا کنند، مگر اینکه sandboxing فعال باشد. اگر به جداسازی نیاز دارید، از [`agents.defaults.sandbox`](/fa/gateway/sandboxing) (و/یا پیکربندی sandbox مخصوص هر عامل) استفاده کنید.

وقتی sandboxing فعال باشد و `workspaceAccess` برابر `"rw"` نباشد، ابزارها داخل یک فضای کاری sandbox در `~/.openclaw/sandboxes` کار می‌کنند، نه در فضای کاری میزبان شما.
</Warning>

## مکان پیش‌فرض

- پیش‌فرض: `~/.openclaw/workspace`
- اگر `OPENCLAW_PROFILE` تنظیم شده باشد و برابر `"default"` نباشد، پیش‌فرض به `~/.openclaw/workspace-<profile>` تبدیل می‌شود.
- بازنویسی در `~/.openclaw/openclaw.json`:

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

`openclaw onboard`، `openclaw configure`، یا `openclaw setup` فضای کاری را ایجاد می‌کند و اگر فایل‌های bootstrap موجود نباشند، آن‌ها را seed می‌کند.

<Note>
کپی‌های seed مربوط به sandbox فقط فایل‌های معمولی داخل فضای کاری را می‌پذیرند؛ aliasهای symlink/hardlink که به بیرون از فضای کاری مبدأ resolve می‌شوند نادیده گرفته می‌شوند.
</Note>

اگر از قبل خودتان فایل‌های فضای کاری را مدیریت می‌کنید، می‌توانید ایجاد فایل‌های bootstrap را غیرفعال کنید:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## پوشه‌های اضافی فضای کاری

نصب‌های قدیمی‌تر ممکن است `~/openclaw` را ساخته باشند. نگه داشتن چندین دایرکتوری فضای کاری می‌تواند باعث سردرگمی در auth یا drift وضعیت شود، چون در هر زمان فقط یک فضای کاری فعال است.

<Note>
**توصیه:** فقط یک فضای کاری فعال نگه دارید. اگر دیگر از پوشه‌های اضافی استفاده نمی‌کنید، آن‌ها را archive کنید یا به Trash منتقل کنید (برای مثال `trash ~/openclaw`). اگر عمداً چند فضای کاری نگه می‌دارید، مطمئن شوید `agents.defaults.workspace` به فضای کاری فعال اشاره می‌کند.

`openclaw doctor` وقتی دایرکتوری‌های اضافی فضای کاری را تشخیص دهد هشدار می‌دهد.
</Note>

## نقشهٔ فایل‌های فضای کاری

این‌ها فایل‌های استانداردی هستند که OpenClaw انتظار دارد داخل فضای کاری وجود داشته باشند:

<AccordionGroup>
  <Accordion title="AGENTS.md - دستورالعمل‌های عملیاتی">
    دستورالعمل‌های عملیاتی برای عامل و اینکه چگونه باید از حافظه استفاده کند. در شروع هر نشست بارگذاری می‌شود. جای خوبی برای قوانین، اولویت‌ها، و جزئیات «چگونه رفتار کند» است.
  </Accordion>
  <Accordion title="SOUL.md - شخصیت و لحن">
    شخصیت، لحن، و مرزها. در هر نشست بارگذاری می‌شود. راهنما: [راهنمای شخصیت SOUL.md](/fa/concepts/soul).
  </Accordion>
  <Accordion title="USER.md - کاربر کیست">
    کاربر کیست و چگونه باید او را خطاب کرد. در هر نشست بارگذاری می‌شود.
  </Accordion>
  <Accordion title="IDENTITY.md - نام، حال‌وهوا، emoji">
    نام عامل، حال‌وهوا، و emoji آن. در طول آیین bootstrap ایجاد/به‌روزرسانی می‌شود.
  </Accordion>
  <Accordion title="TOOLS.md - قراردادهای ابزار محلی">
    یادداشت‌هایی دربارهٔ ابزارهای محلی و قراردادهای شما. دسترسی‌پذیری ابزارها را کنترل نمی‌کند؛ فقط راهنماست.
  </Accordion>
  <Accordion title="HEARTBEAT.md - چک‌لیست Heartbeat">
    چک‌لیست کوچک اختیاری برای اجراهای Heartbeat. آن را کوتاه نگه دارید تا از مصرف token جلوگیری شود.
  </Accordion>
  <Accordion title="BOOT.md - چک‌لیست راه‌اندازی">
    چک‌لیست اختیاری راه‌اندازی که به‌صورت خودکار هنگام restart شدن Gateway اجرا می‌شود (وقتی [hookهای داخلی](/fa/automation/hooks) فعال باشند). آن را کوتاه نگه دارید؛ برای ارسال‌های خروجی از ابزار message استفاده کنید.
  </Accordion>
  <Accordion title="BOOTSTRAP.md - آیین اولین اجرا">
    آیین یک‌بارهٔ اولین اجرا. فقط برای یک فضای کاری کاملاً جدید ایجاد می‌شود. پس از کامل شدن آیین، آن را حذف کنید.
  </Accordion>
  <Accordion title="memory/YYYY-MM-DD.md - گزارش روزانهٔ حافظه">
    گزارش روزانهٔ حافظه (یک فایل برای هر روز). توصیه می‌شود هنگام شروع نشست، امروز + دیروز را بخوانید.
  </Accordion>
  <Accordion title="MEMORY.md - حافظهٔ بلندمدت گزینش‌شده (اختیاری)">
    حافظهٔ بلندمدت گزینش‌شده: واقعیت‌های پایدار، ترجیحات، تصمیم‌ها، و خلاصه‌های کوتاه. گزارش‌های مفصل را در `memory/YYYY-MM-DD.md` نگه دارید تا ابزارهای حافظه بتوانند آن‌ها را در صورت نیاز بازیابی کنند، بدون اینکه به هر prompt تزریق شوند. `MEMORY.md` را فقط در نشست اصلی و خصوصی بارگذاری کنید (نه در زمینه‌های اشتراکی/گروهی). برای گردش‌کار و flush خودکار حافظه، [Memory](/fa/concepts/memory) را ببینید.
  </Accordion>
  <Accordion title="skills/ - Skills فضای کاری (اختیاری)">
    Skills مخصوص فضای کاری. محل Skill با بالاترین اولویت برای آن فضای کاری. وقتی نام‌ها تداخل داشته باشند، Skills عامل پروژه، Skills عامل شخصی، Skills مدیریت‌شده، Skills باندل‌شده، و `skills.load.extraDirs` را override می‌کند.
  </Accordion>
  <Accordion title="canvas/ - فایل‌های رابط کاربری Canvas (اختیاری)">
    فایل‌های رابط کاربری Canvas برای نمایش‌های node (برای مثال `canvas/index.html`).
  </Accordion>
</AccordionGroup>

<Note>
اگر هر فایل bootstrapی موجود نباشد، OpenClaw یک نشانگر «فایل گم‌شده» را به نشست تزریق می‌کند و ادامه می‌دهد. فایل‌های بزرگ bootstrap هنگام تزریق truncate می‌شوند؛ محدودیت‌ها را با `agents.defaults.bootstrapMaxChars` (پیش‌فرض: 20000) و `agents.defaults.bootstrapTotalMaxChars` (پیش‌فرض: 60000) تنظیم کنید. `openclaw setup` می‌تواند پیش‌فرض‌های گم‌شده را بدون بازنویسی فایل‌های موجود دوباره ایجاد کند.
</Note>

## چه چیزهایی در فضای کاری نیستند

این‌ها زیر `~/.openclaw/` قرار دارند و نباید به repo فضای کاری commit شوند:

- `~/.openclaw/openclaw.json` (پیکربندی)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (پروفایل‌های auth مدل: OAuth + کلیدهای API)
- `~/.openclaw/agents/<agentId>/agent/codex-home/` (حساب runtime مخصوص هر عامل برای Codex، پیکربندی، skills، plugins، و وضعیت thread بومی)
- `~/.openclaw/credentials/` (وضعیت channel/provider به‌همراه داده‌های import قدیمی OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (رونوشت‌های نشست + metadata)
- `~/.openclaw/skills/` (skills مدیریت‌شده)

اگر باید نشست‌ها یا پیکربندی را migrate کنید، آن‌ها را جداگانه کپی کنید و خارج از version control نگه دارید.

## پشتیبان‌گیری با Git (توصیه‌شده، خصوصی)

با فضای کاری مانند حافظهٔ خصوصی رفتار کنید. آن را در یک repo git **خصوصی** قرار دهید تا پشتیبان‌گیری شود و قابل بازیابی باشد.

این مراحل را روی ماشینی اجرا کنید که Gateway روی آن اجرا می‌شود (همان جایی که فضای کاری قرار دارد).

<Steps>
  <Step title="مقداردهی اولیهٔ repo">
    اگر git نصب باشد، فضای کاری‌های کاملاً جدید به‌صورت خودکار مقداردهی اولیه می‌شوند. اگر این فضای کاری هنوز repo نیست، اجرا کنید:

    ```bash
    cd ~/.openclaw/workspace
    git init
    git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
    git commit -m "Add agent workspace"
    ```

  </Step>
  <Step title="افزودن remote خصوصی">
    <Tabs>
      <Tab title="رابط وب GitHub">
        1. یک repository **خصوصی** جدید در GitHub ایجاد کنید.
        2. با README مقداردهی اولیه نکنید (از merge conflict جلوگیری می‌کند).
        3. URL remote از نوع HTTPS را کپی کنید.
        4. remote را اضافه کنید و push کنید:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
      <Tab title="GitHub CLI (gh)">
        ```bash
        gh auth login
        gh repo create openclaw-workspace --private --source . --remote origin --push
        ```
      </Tab>
      <Tab title="رابط وب GitLab">
        1. یک repository **خصوصی** جدید در GitLab ایجاد کنید.
        2. با README مقداردهی اولیه نکنید (از merge conflict جلوگیری می‌کند).
        3. URL remote از نوع HTTPS را کپی کنید.
        4. remote را اضافه کنید و push کنید:

        ```bash
        git branch -M main
        git remote add origin <https-url>
        git push -u origin main
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="به‌روزرسانی‌های مداوم">
    ```bash
    git status
    git add .
    git commit -m "Update memory"
    git push
    ```
  </Step>
</Steps>

## secrets را commit نکنید

<Warning>
حتی در یک repo خصوصی، از ذخیرهٔ secrets در فضای کاری خودداری کنید:

- کلیدهای API، tokenهای OAuth، گذرواژه‌ها، یا اعتبارنامه‌های خصوصی.
- هر چیزی زیر `~/.openclaw/`.
- dumpهای خام chatها یا پیوست‌های حساس.

اگر باید ارجاع‌های حساس را ذخیره کنید، از placeholderها استفاده کنید و secret واقعی را جای دیگری نگه دارید (password manager، environment variables، یا `~/.openclaw/`).
</Warning>

شروع پیشنهادی برای `.gitignore`:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## انتقال فضای کاری به ماشین جدید

<Steps>
  <Step title="Clone کردن repo">
    repo را در مسیر دلخواه clone کنید (پیش‌فرض `~/.openclaw/workspace`).
  </Step>
  <Step title="به‌روزرسانی پیکربندی">
    مقدار `agents.defaults.workspace` را در `~/.openclaw/openclaw.json` روی آن مسیر تنظیم کنید.
  </Step>
  <Step title="Seed کردن فایل‌های گم‌شده">
    برای seed کردن هر فایل گم‌شده، `openclaw setup --workspace <path>` را اجرا کنید.
  </Step>
  <Step title="کپی نشست‌ها (اختیاری)">
    اگر به نشست‌ها نیاز دارید، `~/.openclaw/agents/<agentId>/sessions/` را از ماشین قدیمی جداگانه کپی کنید.
  </Step>
</Steps>

## نکات پیشرفته

- مسیریابی چندعاملی می‌تواند از فضای کاری متفاوت برای هر عامل استفاده کند. برای پیکربندی مسیریابی، [مسیریابی Channel](/fa/channels/channel-routing) را ببینید.
- اگر `agents.defaults.sandbox` فعال باشد، نشست‌های غیر اصلی می‌توانند از فضای کاری‌های sandbox مخصوص هر نشست زیر `agents.defaults.sandbox.workspaceRoot` استفاده کنند.

## مرتبط

- [Heartbeat](/fa/gateway/heartbeat) - فایل فضای کاری HEARTBEAT.md
- [Sandboxing](/fa/gateway/sandboxing) - دسترسی فضای کاری در محیط‌های sandbox شده
- [نشست](/fa/concepts/session) - مسیرهای ذخیره‌سازی نشست
- [دستورهای پایدار](/fa/automation/standing-orders) - دستورالعمل‌های پایدار در فایل‌های فضای کاری
