---
read_when:
    - می‌خواهید Gateway را از طریق مرورگر اجرا کنید
    - شما دسترسی Tailnet را بدون تونل‌های SSH می‌خواهید
sidebarTitle: Control UI
summary: رابط کاربری کنترل مبتنی بر مرورگر برای Gateway (چت، فعالیت، گره‌ها، پیکربندی)
title: رابط کاربری کنترل
x-i18n:
    generated_at: "2026-07-04T20:40:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI یک اپلیکیشن تک‌صفحه‌ای کوچک **Vite + Lit** است که توسط Gateway ارائه می‌شود:

- پیش‌فرض: `http://<host>:18789/`
- پیشوند اختیاری: `gateway.controlUi.basePath` را تنظیم کنید (مثلاً `/openclaw`)

این رابط **مستقیماً با Gateway WebSocket** روی همان پورت صحبت می‌کند.

## باز کردن سریع (محلی)

اگر Gateway روی همان رایانه در حال اجراست، باز کنید:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (یا [http://localhost:18789/](http://localhost:18789/))

اگر صفحه بارگذاری نشد، ابتدا Gateway را شروع کنید: `openclaw gateway`.

<Note>
در اتصال‌های LAN بومی Windows، Windows Firewall یا Group Policy مدیریت‌شده توسط سازمان همچنان می‌تواند URL اعلام‌شده LAN را مسدود کند، حتی وقتی `127.0.0.1` روی میزبان Gateway کار می‌کند. روی میزبان Windows دستور `openclaw gateway status --deep` را اجرا کنید؛ این دستور پورت‌های احتمالاً مسدود، ناسازگاری‌های پروفایل، و قوانین فایروال محلی را که ممکن است policy نادیده بگیرد گزارش می‌کند.
</Note>

احراز هویت هنگام دست‌دهی WebSocket از این مسیرها فراهم می‌شود:

- `connect.params.auth.token`
- `connect.params.auth.password`
- هدرهای هویت Tailscale Serve وقتی `gateway.auth.allowTailscale: true` باشد
- هدرهای هویت پراکسی مورد اعتماد وقتی `gateway.auth.mode: "trusted-proxy"` باشد

پنل تنظیمات داشبورد یک token را برای نشست تب مرورگر فعلی و URL انتخاب‌شده Gateway نگه می‌دارد؛ گذرواژه‌ها پایدار ذخیره نمی‌شوند. Onboarding معمولاً هنگام اولین اتصال، برای احراز هویت shared-secret یک gateway token ایجاد می‌کند، اما وقتی `gateway.auth.mode` برابر `"password"` باشد، احراز هویت با گذرواژه هم کار می‌کند.

## جفت‌سازی دستگاه (اولین اتصال)

وقتی از یک مرورگر یا دستگاه جدید به Control UI وصل می‌شوید، Gateway معمولاً به یک **تأیید جفت‌سازی یک‌باره** نیاز دارد. این یک اقدام امنیتی برای جلوگیری از دسترسی غیرمجاز است.

**چیزی که خواهید دید:** "disconnected (1008): pairing required"

<Steps>
  <Step title="فهرست کردن درخواست‌های در انتظار">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="تأیید با request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

اگر مرورگر جفت‌سازی را با جزئیات احراز هویت تغییر‌یافته دوباره امتحان کند (role/scopes/public key)، درخواست در انتظار قبلی جایگزین می‌شود و یک `requestId` جدید ساخته می‌شود. پیش از تأیید، دوباره `openclaw devices list` را اجرا کنید.

اگر مرورگر از قبل جفت شده باشد و آن را از دسترسی خواندن به دسترسی نوشتن/admin تغییر دهید، این به‌عنوان ارتقای تأیید در نظر گرفته می‌شود، نه اتصال مجدد بی‌صدا. OpenClaw تأیید قدیمی را فعال نگه می‌دارد، اتصال مجدد گسترده‌تر را مسدود می‌کند، و از شما می‌خواهد مجموعه scope جدید را صریحاً تأیید کنید.

پس از تأیید، دستگاه به خاطر سپرده می‌شود و دیگر به تأیید دوباره نیاز ندارد، مگر اینکه آن را با `openclaw devices revoke --device <id> --role <role>` لغو کنید. برای چرخش token و لغو، [CLI دستگاه‌ها](/fa/cli/devices) را ببینید.

عامل‌های Paperclip که از طریق adapter‏ `openclaw_gateway` وصل می‌شوند از همان جریان تأیید اجرای اول استفاده می‌کنند. پس از تلاش اولیه اتصال، `openclaw devices approve --latest` را اجرا کنید تا درخواست در انتظار را پیش‌نمایش کنید، سپس دستور چاپ‌شده `openclaw devices approve <requestId>` را دوباره اجرا کنید تا آن را تأیید کنید. برای یک gateway راه‌دور، مقادیر صریح `--url` و `--token` را پاس دهید. برای پایدار نگه داشتن تأییدها در طول restartها، به‌جای اینکه Paperclip در هر اجرا یک هویت دستگاه موقت جدید تولید کند، یک `adapterConfig.devicePrivateKeyPem` پایدار در Paperclip پیکربندی کنید.

<Note>
- اتصال‌های مستقیم مرورگر از طریق local loopback (`127.0.0.1` / `localhost`) خودکار تأیید می‌شوند.
- وقتی `gateway.auth.allowTailscale: true` باشد، هویت Tailscale تأیید شود، و مرورگر هویت دستگاه خود را ارائه کند، Tailscale Serve می‌تواند رفت‌وبرگشت جفت‌سازی را برای نشست‌های اپراتور Control UI رد کند.
- اتصال‌های مستقیم Tailnet، اتصال‌های مرورگر از LAN، و پروفایل‌های مرورگر بدون هویت دستگاه همچنان به تأیید صریح نیاز دارند.
- هر پروفایل مرورگر یک ID دستگاه یکتا تولید می‌کند، بنابراین تغییر مرورگر یا پاک کردن داده‌های مرورگر به جفت‌سازی دوباره نیاز خواهد داشت.

</Note>

## جفت‌سازی یک دستگاه موبایل

یک مدیر از قبل جفت‌شده می‌تواند QR اتصال iOS/Android را بدون
باز کردن terminal بسازد:

<Steps>
  <Step title="باز کردن جفت‌سازی موبایل">
    **Nodes** را انتخاب کنید، سپس در کارت **Devices** روی **Pair mobile device** کلیک کنید.
  </Step>
  <Step title="وصل کردن تلفن">
    در اپلیکیشن موبایل OpenClaw، **Settings** → **Gateway** را باز کنید و کد QR
    را اسکن کنید. به‌جای آن می‌توانید کد setup را copy و paste کنید.
  </Step>
  <Step title="تأیید اتصال">
    اپلیکیشن رسمی iOS/Android به‌طور خودکار وصل می‌شود. اگر **Devices** یک
    درخواست در انتظار نشان می‌دهد، پیش از تأیید، role و scopeهای آن را بررسی کنید.
  </Step>
</Steps>

ساختن یک کد setup به `operator.admin` نیاز دارد؛ دکمه برای
نشست‌هایی که آن را ندارند غیرفعال است. یک کد setup شامل یک credential راه‌اندازی کوتاه‌عمر است،
پس تا زمانی که معتبرند، با QR و کد کپی‌شده مانند گذرواژه رفتار کنید. برای
جفت‌سازی راه‌دور، Gateway باید به `wss://` resolve شود (برای مثال، از طریق Tailscale
Serve/Funnel)؛ `ws://` ساده به loopback و نشانی‌های LAN خصوصی محدود است.
برای جزئیات کامل امنیتی و fallback، [جفت‌سازی](/fa/channels/pairing#pair-from-the-control-ui-recommended) را ببینید.

## هویت شخصی (محلی در مرورگر)

Control UI از یک هویت شخصی برای هر مرورگر پشتیبانی می‌کند (نام نمایشی و avatar) که برای انتساب در نشست‌های مشترک به پیام‌های خروجی پیوست می‌شود. این هویت در ذخیره‌سازی مرورگر زندگی می‌کند، به پروفایل مرورگر فعلی محدود است، و با دستگاه‌های دیگر sync نمی‌شود یا در سمت server فراتر از metadata معمول authorship transcript روی پیام‌هایی که واقعاً ارسال می‌کنید پایدار ذخیره نمی‌شود. پاک کردن داده‌های سایت یا تغییر مرورگر آن را به حالت خالی بازنشانی می‌کند.

همین الگوی محلی در مرورگر برای override کردن avatar دستیار هم اعمال می‌شود. avatarهای بارگذاری‌شده دستیار، هویت resolve‌شده توسط gateway را فقط روی مرورگر محلی overlay می‌کنند و هرگز از طریق `config.patch` رفت‌وبرگشت نمی‌کنند. فیلد config مشترک `ui.assistant.avatar` همچنان برای clientهای غیر UI که فیلد را مستقیم می‌نویسند در دسترس است (مانند gatewayهای script‌شده یا داشبوردهای سفارشی).

## endpoint پیکربندی runtime

Control UI تنظیمات runtime خود را از `/control-ui-config.json` دریافت می‌کند، که نسبت به مسیر پایه Control UI در gateway resolve می‌شود (برای مثال `/__openclaw__/control-ui-config.json` وقتی UI زیر `/__openclaw__/` ارائه می‌شود). این endpoint با همان احراز هویت gateway که بقیه سطح HTTP را محافظت می‌کند کنترل می‌شود: مرورگرهای احراز هویت‌نشده نمی‌توانند آن را دریافت کنند، و دریافت موفق به یک gateway token/password از قبل معتبر، هویت Tailscale Serve، یا هویت پراکسی مورد اعتماد نیاز دارد.

## پشتیبانی زبان

Control UI می‌تواند هنگام اولین بارگذاری، خود را بر اساس locale مرورگر شما محلی‌سازی کند. برای تغییر آن در ادامه، **Overview -> Gateway Access -> Language** را باز کنید. انتخاب‌گر locale در کارت Gateway Access قرار دارد، نه زیر Appearance.

- localeهای پشتیبانی‌شده: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- ترجمه‌های غیر انگلیسی در مرورگر lazy-loaded می‌شوند.
- locale انتخاب‌شده در ذخیره‌سازی مرورگر ذخیره می‌شود و در بازدیدهای آینده دوباره استفاده می‌شود.
- کلیدهای ترجمه گمشده به انگلیسی fallback می‌کنند.

ترجمه‌های docs برای همان مجموعه localeهای غیر انگلیسی تولید می‌شوند، اما انتخاب‌گر زبان داخلی سایت docs در Mintlify به کدهای localeای محدود است که Mintlify می‌پذیرد. docs تایلندی (`th`) و فارسی (`fa`) همچنان در repo انتشار تولید می‌شوند؛ ممکن است تا زمانی که Mintlify از آن کدها پشتیبانی کند در آن انتخاب‌گر ظاهر نشوند.

## themeهای ظاهری

پنل Appearance، themeهای داخلی Claw، Knot، و Dash را به‌همراه یک جایگاه import مرورگرمحلی tweakcn نگه می‌دارد. برای import کردن یک theme، [ویرایشگر tweakcn](https://tweakcn.com/editor/theme) را باز کنید، یک theme انتخاب یا ایجاد کنید، روی **Share** کلیک کنید، و لینک theme کپی‌شده را در Appearance paste کنید. importer همچنین URLهای registry به شکل `https://tweakcn.com/r/themes/<id>`، URLهای editor مانند `https://tweakcn.com/editor/theme?theme=amethyst-haze`، مسیرهای نسبی `/themes/<id>`، IDهای خام theme، و نام‌های theme پیش‌فرض مانند `amethyst-haze` را می‌پذیرد.

Appearance همچنین شامل یک تنظیم Text size محلی در مرورگر است. این تنظیم همراه با بقیه ترجیحات Control UI ذخیره می‌شود، روی متن chat، متن composer، کارت‌های tool، و sidebarهای chat اعمال می‌شود، و ورودی‌های متن را حداقل 16px نگه می‌دارد تا Safari موبایل هنگام focus خودکار zoom نکند.

themeهای import‌شده فقط در پروفایل مرورگر فعلی ذخیره می‌شوند. آن‌ها در پیکربندی gateway نوشته نمی‌شوند و بین دستگاه‌ها sync نمی‌شوند. جایگزین کردن theme واردشده همان یک جایگاه محلی را به‌روزرسانی می‌کند؛ پاک کردن آن، اگر theme واردشده انتخاب شده باشد، theme فعال را به Claw برمی‌گرداند.

## کارهایی که می‌تواند انجام دهد (امروز)

<AccordionGroup>
  <Accordion title="Chat و گفت‌وگوی صوتی">
    - Chat با model از طریق Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - refreshهای تاریخچه Chat یک پنجره اخیر محدود با سقف متن برای هر پیام درخواست می‌کنند تا نشست‌های بزرگ مرورگر را مجبور نکنند پیش از قابل استفاده شدن chat، payload کامل transcript را render کند.
    - گفت‌وگوی صوتی از طریق نشست‌های realtime مرورگر. OpenAI از WebRTC مستقیم استفاده می‌کند، Google Live از یک token مرورگر محدود و یک‌بارمصرف روی WebSocket استفاده می‌کند، و Pluginهای صدای realtime فقط backend از transport relay Gateway استفاده می‌کنند. نشست‌های provider که مالک آن‌ها client است با `talk.client.create` شروع می‌شوند؛ نشست‌های relay Gateway با `talk.session.create` شروع می‌شوند. relay، credentialهای provider را روی Gateway نگه می‌دارد، در حالی که مرورگر PCM میکروفون را از طریق `talk.session.appendAudio` stream می‌کند، tool callهای provider‏ `openclaw_agent_consult` را برای policy Gateway و model بزرگ‌تر پیکربندی‌شده OpenClaw از طریق `talk.client.toolCall` forward می‌کند، و هدایت صوتی active-run را از طریق `talk.client.steer` یا `talk.session.steer` route می‌کند.
    - tool callها + کارت‌های خروجی زنده tool را در Chat stream می‌کند (رویدادهای agent).
    - تب Activity با خلاصه‌های browser-local و redaction-first از فعالیت زنده tool از تحویل موجود `session.tool` / رویداد tool.

  </Accordion>
  <Accordion title="کانال‌ها، instanceها، نشست‌ها، رویاها">
    - کانال‌ها: وضعیت کانال‌های داخلی به‌همراه Pluginهای bundled/external، ورود با QR، و پیکربندی برای هر کانال (`channels.status`, `web.login.*`, `config.patch`).
    - refreshهای probe کانال snapshot قبلی را تا پایان بررسی‌های کند provider قابل مشاهده نگه می‌دارند، و وقتی probe یا audit از بودجه UI خود عبور کند، snapshotهای جزئی برچسب‌گذاری می‌شوند.
    - instanceها: فهرست presence + refresh (`system-presence`).
    - نشست‌ها: به‌طور پیش‌فرض نشست‌های agent پیکربندی‌شده را فهرست می‌کند، نشست‌های پرتکرار را pin می‌کند، نامشان را تغییر می‌دهد، نشست‌های غیرفعال را archive یا restore می‌کند، از کلیدهای نشست agent پیکربندی‌نشده stale fallback می‌کند، و overrideهای model/thinking/fast/verbose/trace/reasoning را برای هر نشست اعمال می‌کند (`sessions.list`, `sessions.patch`). نشست‌های pin‌شده بالاتر از نشست‌های اخیر pin‌نشده sort می‌شوند؛ نشست‌های archive‌شده در نمای archived صفحه Sessions زندگی می‌کنند و transcriptهای خود را نگه می‌دارند.
    - رویاها: وضعیت Dreaming، toggle فعال/غیرفعال، و خواننده Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron، Skills، nodeها، تأییدهای exec">
    - jobهای Cron: فهرست/افزودن/ویرایش/اجرا/فعال‌سازی/غیرفعال‌سازی + تاریخچه اجرا (`cron.*`).
    - Skills: وضعیت، فعال‌سازی/غیرفعال‌سازی، نصب، به‌روزرسانی‌های API key (`skills.*`).
    - nodeها: فهرست + caps (`node.list`)، ساخت کدهای setup موبایل، و تأیید جفت‌سازی دستگاه (`device.pair.*`).
    - تأییدهای exec: ویرایش allowlistهای gateway یا node + policy پرسش برای `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="پیکربندی">
    - مشاهده/ویرایش `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP یک صفحه تنظیمات اختصاصی برای سرورهای پیکربندی‌شده، فعال‌سازی، خلاصه‌های OAuth/فیلتر/موازی، فرمان‌های رایج اپراتور، و ویرایشگر پیکربندی محدوده‌دار `mcp` دارد.
    - اعمال + راه‌اندازی مجدد با اعتبارسنجی (`config.apply`) و بیدار کردن آخرین نشست فعال.
    - نوشتن‌ها شامل یک محافظ base-hash هستند تا از بازنویسی و از بین بردن ویرایش‌های هم‌زمان جلوگیری شود.
    - نوشتن‌ها (`config.set`/`config.apply`/`config.patch`) پیش از اجرا، رفع SecretRef فعال را برای refs موجود در payload پیکربندی ارسال‌شده بررسی می‌کنند؛ refs فعال و حل‌نشده ارسال‌شده پیش از نوشتن رد می‌شوند.
    - ذخیره‌های فرم، جایگزین‌های ویرایش‌شده و قدیمی را که از پیکربندی ذخیره‌شده قابل بازیابی نیستند دور می‌ریزند، در حالی که مقادیر ویرایش‌شده‌ای را که همچنان به اسرار ذخیره‌شده نگاشت می‌شوند حفظ می‌کنند.
    - رندر schema + فرم (`config.schema` / `config.schema.lookup`، شامل فیلد `title` / `description`، راهنمایی‌های UI منطبق، خلاصه‌های فرزند مستقیم، فراداده مستندات روی گره‌های تو در توی object/wildcard/array/composition، به‌علاوه schemaهای Plugin + کانال در صورت موجود بودن)؛ ویرایشگر Raw JSON فقط زمانی در دسترس است که snapshot یک رفت‌وبرگشت خام امن داشته باشد.
    - اگر یک snapshot نتواند متن خام را با ایمنی رفت‌وبرگشت کند، رابط کاربری کنترل حالت Form را اجباری می‌کند و حالت Raw را برای آن snapshot غیرفعال می‌کند.
    - گزینه "Reset to saved" در ویرایشگر Raw JSON شکل نوشته‌شده خام را (قالب‌بندی، کامنت‌ها، چیدمان `$include`) به‌جای رندر دوباره یک snapshot تخت‌شده حفظ می‌کند، بنابراین وقتی snapshot بتواند با ایمنی رفت‌وبرگشت کند، ویرایش‌های خارجی پس از reset باقی می‌مانند.
    - مقادیر object ساختاریافته SecretRef در ورودی‌های متنی فرم به‌صورت فقط‌خواندنی رندر می‌شوند تا از خراب شدن تصادفی object به string جلوگیری شود.

  </Accordion>
  <Accordion title="اشکال‌زدایی، لاگ‌ها، به‌روزرسانی">
    - اشکال‌زدایی: snapshotهای status/health/models + لاگ رویداد + فراخوانی‌های RPC دستی (`status`, `health`, `models.list`).
    - لاگ رویداد شامل زمان‌بندی‌های refresh/RPC رابط کاربری کنترل، زمان‌بندی‌های کند رندر chat/config، و ورودی‌های پاسخ‌گویی مرورگر برای فریم‌های انیمیشن طولانی یا taskهای طولانی است، زمانی که مرورگر آن نوع ورودی‌های PerformanceObserver را ارائه کند.
    - لاگ‌ها: tail زنده لاگ‌های فایل gateway با فیلتر/خروجی‌گیری (`logs.tail`).
    - به‌روزرسانی: اجرای به‌روزرسانی package/git + راه‌اندازی مجدد (`update.run`) همراه با گزارش راه‌اندازی مجدد، سپس polling روی `update.status` پس از اتصال مجدد برای تأیید نسخه Gateway در حال اجرا.

  </Accordion>
  <Accordion title="یادداشت‌های پنل کارهای Cron">
    - برای کارهای ایزوله، delivery به‌طور پیش‌فرض روی اعلام خلاصه است. اگر اجراهای فقط داخلی می‌خواهید، می‌توانید آن را به none تغییر دهید.
    - وقتی announce انتخاب شده باشد، فیلدهای channel/target ظاهر می‌شوند.
    - حالت Webhook از `delivery.mode = "webhook"` با `delivery.to` تنظیم‌شده روی یک URL معتبر HTTP(S) webhook استفاده می‌کند.
    - برای کارهای نشست اصلی، حالت‌های delivery با webhook و none در دسترس هستند.
    - کنترل‌های ویرایش پیشرفته شامل delete-after-run، پاک‌سازی agent override، گزینه‌های cron exact/stagger، overrideهای agent model/thinking، و toggleهای delivery با بهترین تلاش هستند.
    - اعتبارسنجی فرم به‌صورت inline با خطاهای سطح فیلد انجام می‌شود؛ مقادیر نامعتبر تا زمان اصلاح، دکمه ذخیره را غیرفعال می‌کنند.
    - `cron.webhookToken` را تنظیم کنید تا یک bearer token اختصاصی ارسال شود؛ اگر حذف شود، webhook بدون header احراز هویت ارسال می‌شود.
    - fallback منسوخ: `openclaw doctor --fix` را اجرا کنید تا کارهای legacy ذخیره‌شده با `notify: true` از `cron.webhook` به webhook صریح برای هر کار یا completion delivery منتقل شوند.

  </Accordion>
</AccordionGroup>

## صفحه MCP

صفحه اختصاصی MCP یک نمای اپراتوری برای سرورهای MCP مدیریت‌شده توسط OpenClaw زیر `mcp.servers` است. این صفحه به‌تنهایی transportهای MCP را شروع نمی‌کند؛ از آن برای بررسی و ویرایش پیکربندی ذخیره‌شده استفاده کنید، سپس وقتی به اثبات زنده سرور نیاز دارید از `openclaw mcp doctor --probe` استفاده کنید.

گردش کار معمول:

1. **MCP** را از نوار کناری باز کنید.
2. کارت‌های خلاصه را برای شمارش کل سرورها، سرورهای فعال، OAuth، و سرورهای فیلترشده بررسی کنید.
3. هر ردیف سرور را از نظر transport، فعال‌سازی، auth، فیلترها، timeoutها، و راهنمایی‌های فرمان بررسی کنید.
4. وقتی یک سرور باید پیکربندی‌شده باقی بماند اما از discovery زمان اجرا بیرون بماند، فعال‌سازی را toggle کنید.
5. بخش پیکربندی محدوده‌دار `mcp` را برای تعریف‌های سرور، headerها، مسیرهای TLS/mTLS، فراداده OAuth، فیلترهای tool، و فراداده projection برای Codex ویرایش کنید.
6. برای نوشتن پیکربندی از **Save** استفاده کنید، یا وقتی Gateway در حال اجرا باید پیکربندی تغییریافته را اعمال کند از **Save & Publish** استفاده کنید.
7. وقتی فرایند ویرایش‌شده به diagnostics ایستا، proof زنده، یا disposal زمان اجرای cache‌شده نیاز دارد، `openclaw mcp status --verbose`، `openclaw mcp doctor --probe`، یا `openclaw mcp reload` را از یک ترمینال اجرا کنید.

این صفحه پیش از رندر، مقادیر شبیه URL دارای credential را redact می‌کند و نام‌های سرور را در snippetهای فرمان quote می‌کند تا فرمان‌های کپی‌شده همچنان با فاصله یا metacharacterهای shell کار کنند. مرجع کامل CLI و پیکربندی در [MCP](/fa/cli/mcp) قرار دارد.

## تب Activity

تب Activity یک ناظر موقتی و محلیِ مرورگر برای فعالیت زنده tool است. این تب از همان stream رویداد Gateway `session.tool` / tool مشتق می‌شود که کارت‌های tool در Chat را تغذیه می‌کند؛ خانواده رویداد Gateway، endpoint، ذخیره فعالیت پایدار، feed متریک، یا stream ناظر خارجی دیگری اضافه نمی‌کند.

ورودی‌های Activity فقط خلاصه‌های پاک‌سازی‌شده و پیش‌نمایش‌های خروجی redact‌شده و کوتاه‌شده را نگه می‌دارند. مقادیر آرگومان tool در state مربوط به Activity ذخیره نمی‌شوند؛ UI نشان می‌دهد که آرگومان‌ها پنهان هستند و فقط شمار فیلدهای آرگومان را ثبت می‌کند. فهرست درون‌حافظه‌ای از تب مرورگر فعلی پیروی می‌کند، در ناوبری داخل رابط کاربری کنترل باقی می‌ماند، و با بارگذاری مجدد صفحه، تغییر نشست، یا **Clear** reset می‌شود.

## رفتار Chat

<AccordionGroup>
  <Accordion title="معناشناسی ارسال و تاریخچه">
    - `chat.send` **غیرمسدودکننده** است: بلافاصله با `{ runId, status: "started" }` ack می‌دهد و پاسخ از طریق رویدادهای `chat` stream می‌شود. کلاینت‌های مورد اعتماد رابط کاربری کنترل همچنین ممکن است فراداده اختیاری زمان‌بندی ACK را برای diagnostics محلی دریافت کنند.
    - آپلودهای Chat تصویرها به‌علاوه فایل‌های غیر ویدیویی را می‌پذیرند. تصویرها مسیر native image را نگه می‌دارند؛ فایل‌های دیگر به‌عنوان managed media ذخیره می‌شوند و در history به‌صورت لینک‌های attachment نشان داده می‌شوند.
    - ارسال دوباره با همان `idempotencyKey` هنگام اجرا `{ status: "in_flight" }` و پس از تکمیل `{ status: "ok" }` برمی‌گرداند.
    - پاسخ‌های `chat.history` برای ایمنی UI از نظر اندازه محدود هستند. وقتی ورودی‌های transcript بیش از حد بزرگ باشند، Gateway ممکن است فیلدهای متنی طولانی را کوتاه کند، بلوک‌های metadata سنگین را حذف کند، و پیام‌های بیش‌ازحد بزرگ را با یک placeholder (`[chat.history omitted: message too large]`) جایگزین کند.
    - وقتی یک پیام قابل مشاهده assistant در `chat.history` کوتاه شده باشد، خواننده کناری می‌تواند ورودی transcript کامل و display-normalized را در صورت نیاز از طریق `chat.message.get` با `sessionKey`، `agentId` فعال در صورت نیاز، و transcript `messageId` دریافت کند. اگر Gateway همچنان نتواند مقدار بیشتری برگرداند، خواننده به‌جای تکرار بی‌صدای پیش‌نمایش کوتاه‌شده، یک وضعیت unavailable صریح نشان می‌دهد.
    - تصاویر assistant/generated به‌عنوان managed media references پایدار می‌شوند و از طریق URLهای رسانه احراز هویت‌شده Gateway برگردانده می‌شوند، بنابراین reloadها به باقی ماندن payloadهای تصویر base64 خام در پاسخ chat history وابسته نیستند.
    - هنگام رندر `chat.history`، رابط کاربری کنترل tagهای directive درون‌خطی فقط نمایشی را از متن قابل مشاهده assistant حذف می‌کند (برای مثال `[[reply_to_*]]` و `[[audio_as_voice]]`)، payloadهای XML فراخوانی tool به‌صورت متن ساده (شامل `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های فراخوانی tool کوتاه‌شده)، و tokenهای کنترلی مدل ASCII/full-width نشت‌کرده را حذف می‌کند، و ورودی‌های assistant را که کل متن قابل مشاهده‌شان فقط token خاموش دقیق `NO_REPLY` / `no_reply` یا token تأیید Heartbeat یعنی `HEARTBEAT_OK` است کنار می‌گذارد.
    - در طول یک ارسال فعال و refresh نهایی history، نمای chat پیام‌های optimistic محلی user/assistant را قابل مشاهده نگه می‌دارد اگر `chat.history` به‌طور کوتاه یک snapshot قدیمی‌تر برگرداند؛ transcript canonical پس از اینکه history در Gateway به‌روز شد، آن پیام‌های محلی را جایگزین می‌کند.
    - رویدادهای زنده `chat` وضعیت delivery هستند، در حالی که `chat.history` از transcript پایدار نشست دوباره ساخته می‌شود. پس از رویدادهای tool-final، رابط کاربری کنترل history را reload می‌کند و فقط یک tail کوچک optimistic را merge می‌کند؛ مرز transcript در [WebChat](/fa/web/webchat) مستند شده است.
    - `chat.inject` یک یادداشت assistant را به transcript نشست append می‌کند و یک رویداد `chat` را برای به‌روزرسانی‌های فقط UI broadcast می‌کند (بدون agent run، بدون channel delivery).
    - نوار کناری نشست‌های اخیر را با یک اقدام New Session، یک لینک All Sessions، و یک دکمه جست‌وجوی نشست فهرست می‌کند که picker کامل نشست را باز می‌کند (محدوده‌دار به agent انتخاب‌شده، با search و pagination). تغییر agentها فقط نشست‌های وابسته به آن agent را نشان می‌دهد و وقتی هنوز dashboard session ذخیره‌شده‌ای ندارد به main session همان agent fallback می‌کند.
    - هر ردیف session-picker می‌تواند نشست را rename، pin، یا archive کند. یک run فعال و main session یک agent نمی‌توانند archive شوند. Archive کردن نشست انتخاب‌شده فعلی، Chat را به main session آن agent برمی‌گرداند.
    - در عرض‌های دسکتاپ، کنترل‌های chat روی یک ردیف فشرده می‌مانند و هنگام scroll به پایین transcript جمع می‌شوند؛ scroll به بالا، بازگشت به top، یا رسیدن به bottom کنترل‌ها را بازمی‌گرداند.
    - پیام‌های متوالی و تکراری فقط متنی به‌صورت یک bubble با نشان شمارش رندر می‌شوند. پیام‌هایی که تصویر، attachment، خروجی tool، یا پیش‌نمایش canvas دارند، جمع نمی‌شوند.
    - pickerهای model و thinking در header چت، نشست فعال را بلافاصله از طریق `sessions.patch` patch می‌کنند؛ آن‌ها overrideهای پایدار نشست هستند، نه گزینه‌های ارسال فقط برای یک نوبت.
    - اگر در حالی پیام بفرستید که تغییر model picker برای همان نشست هنوز در حال ذخیره شدن است، composer پیش از فراخوانی `chat.send` منتظر patch آن نشست می‌ماند تا ارسال از model انتخاب‌شده استفاده کند.
    - تایپ `/new` در رابط کاربری کنترل همان dashboard session تازه New Chat را ایجاد کرده و به آن switch می‌کند، مگر زمانی که `session.dmScope: "main"` پیکربندی شده باشد و parent فعلی main session آن agent باشد؛ در آن حالت main session را در همان‌جا reset می‌کند. تایپ `/reset` reset صریح درجا برای نشست فعلی در Gateway را حفظ می‌کند.
    - model picker چت، نمای model پیکربندی‌شده Gateway را درخواست می‌کند. اگر `agents.defaults.models` وجود داشته باشد، آن allowlist picker را هدایت می‌کند، از جمله ورودی‌های `provider/*` که catalogهای محدوده‌دار به provider را dynamic نگه می‌دارند. در غیر این صورت picker ورودی‌های صریح `models.providers.*.models` به‌علاوه providerهایی با auth قابل استفاده را نشان می‌دهد. catalog کامل از طریق RPC اشکال‌زدایی `models.list` با `view: "all"` در دسترس می‌ماند.
    - وقتی گزارش‌های تازه استفاده از نشست Gateway شامل tokenهای context فعلی باشند، toolbar composer چت یک حلقه کوچک استفاده از context را با درصد استفاده‌شده نشان می‌دهد؛ جزئیات کامل token در tooltip آن قرار دارد. حلقه در فشار بالای context به styling هشدار تغییر می‌کند و، در سطح‌های پیشنهادی Compaction، یک دکمه فشرده نشان می‌دهد که مسیر عادی Compaction نشست را اجرا می‌کند. snapshotهای token قدیمی تا زمانی که Gateway دوباره استفاده تازه را گزارش کند پنهان می‌شوند.

  </Accordion>
  <Accordion title="حالت Talk (realtime مرورگر)">
    حالت Talk از یک ارائه‌دهنده voice realtime ثبت‌شده استفاده می‌کند. OpenAI را با `talk.realtime.provider: "openai"` به‌علاوه یک پروفایل auth با API key برای `openai`، `talk.realtime.providers.openai.apiKey`، یا `OPENAI_API_KEY` پیکربندی کنید؛ پروفایل‌های OAuth مربوط به OpenAI، voice Realtime را پیکربندی نمی‌کنند. Google را با `talk.realtime.provider: "google"` به‌علاوه `talk.realtime.providers.google.apiKey` پیکربندی کنید. مرورگر هرگز یک API key استاندارد provider را دریافت نمی‌کند. OpenAI یک secret موقتی Realtime client برای WebRTC دریافت می‌کند. Google Live یک auth token محدودشده و یک‌بارمصرف Live API برای نشست WebSocket مرورگر دریافت می‌کند، همراه با instructionها و declarationهای tool که توسط Gateway داخل token قفل شده‌اند. Providerهایی که فقط یک backend realtime bridge ارائه می‌کنند از طریق relay transport در Gateway اجرا می‌شوند، بنابراین credentialها و socketهای vendor در سمت سرور می‌مانند در حالی که صدای مرورگر از طریق RPCهای احراز هویت‌شده Gateway جابه‌جا می‌شود. prompt نشست Realtime توسط Gateway مونتاژ می‌شود؛ `talk.client.create` overrideهای instruction ارائه‌شده توسط caller را نمی‌پذیرد.

    سازندهٔ Chat یک دکمهٔ گزینه‌های گفت‌وگو کنار دکمهٔ شروع/توقف گفت‌وگو دارد. این گزینه‌ها روی نشست گفت‌وگوی بعدی اعمال می‌شوند و می‌توانند provider، transport، model، voice، reasoning effort، آستانهٔ VAD، مدت سکوت، و prefix padding را بازنویسی کنند. وقتی گزینه‌ای خالی باشد، Gateway در صورت وجود از پیش‌فرض‌های پیکربندی‌شده یا از پیش‌فرض provider استفاده می‌کند. انتخاب رلهٔ Gateway مسیر رلهٔ backend را اجباری می‌کند؛ انتخاب WebRTC نشست را تحت مالکیت client نگه می‌دارد و اگر provider نتواند یک نشست مرورگر بسازد، به‌جای بازگشت بی‌صدا به رله، شکست می‌خورد.

    در سازندهٔ Chat، کنترل گفت‌وگو همان دکمهٔ موج‌ها کنار دکمهٔ دیکتهٔ میکروفون است. وقتی گفت‌وگو شروع می‌شود، ردیف وضعیت سازنده ابتدا `Connecting Talk...` را نشان می‌دهد، سپس وقتی صدا وصل است `Talk live` را، یا وقتی یک فراخوانی ابزار realtime از طریق `talk.client.toolCall` در حال مشورت با مدل بزرگ‌تر پیکربندی‌شده است، `Asking OpenClaw...` را نشان می‌دهد.

    دودآزمایی زندهٔ maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` پل WebSocket backend OpenAI، تبادل SDP مرورگر WebRTC OpenAI، راه‌اندازی WebSocket مرورگر Google Live با توکن محدود، و آداپتر مرورگر رلهٔ Gateway با رسانهٔ میکروفون ساختگی را تأیید می‌کند. این فرمان فقط وضعیت provider را چاپ می‌کند و secrets را ثبت نمی‌کند.

  </Accordion>
  <Accordion title="Stop and abort">
    - روی **توقف** کلیک کنید (`chat.abort` را فراخوانی می‌کند).
    - وقتی یک run فعال است، follow-upهای عادی در صف قرار می‌گیرند. روی **هدایت** در یک پیام صف‌شده کلیک کنید تا آن follow-up را به نوبت در حال اجرا تزریق کنید.
    - برای لغو خارج از باند، `/stop` را تایپ کنید (یا عبارت‌های مستقل لغو مانند `stop`، `stop action`، `stop run`، `stop openclaw`، `please stop`).
    - `chat.abort` از `{ sessionKey }` (بدون `runId`) برای لغو همهٔ runهای فعال آن نشست پشتیبانی می‌کند.

  </Accordion>
  <Accordion title="Abort partial retention">
    - وقتی یک run لغو می‌شود، متن جزئی assistant همچنان می‌تواند در UI نمایش داده شود.
    - Gateway متن جزئی لغوشدهٔ assistant را وقتی خروجی بافرشده وجود دارد، در تاریخچهٔ transcript پایدار می‌کند.
    - ورودی‌های پایدارشده شامل metadata لغو هستند تا مصرف‌کنندگان transcript بتوانند partialهای لغو را از خروجی تکمیل عادی تشخیص دهند.

  </Accordion>
</AccordionGroup>

## نصب PWA و Web Push

Control UI یک `manifest.webmanifest` و یک service worker ارائه می‌کند، بنابراین مرورگرهای مدرن می‌توانند آن را به‌عنوان یک PWA مستقل نصب کنند. Web Push به Gateway اجازه می‌دهد حتی وقتی تب یا پنجرهٔ مرورگر باز نیست، PWA نصب‌شده را با اعلان‌ها بیدار کند.

اگر صفحه بلافاصله پس از به‌روزرسانی OpenClaw پیام **ناسازگاری پروتکل** را نشان داد، ابتدا داشبورد را با `openclaw dashboard` دوباره باز کنید و صفحه را hard-refresh کنید. اگر همچنان شکست خورد، داده‌های سایت را برای origin داشبورد پاک کنید یا در یک پنجرهٔ مرورگر خصوصی آزمایش کنید؛ یک تب قدیمی یا cache service-worker مرورگر می‌تواند همچنان بستهٔ Control UI پیش از به‌روزرسانی را در برابر Gateway جدیدتر اجرا کند.

| سطح                                                  | کارکرد                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | manifest مربوط به PWA. وقتی در دسترس باشد، مرورگرها «نصب برنامه» را پیشنهاد می‌کنند. |
| `ui/public/sw.js`                                     | service worker که رویدادهای `push` و کلیک‌های اعلان را مدیریت می‌کند. |
| `push/vapid-keys.json` (زیر پوشهٔ state مربوط به OpenClaw) | جفت‌کلید VAPID تولیدشدهٔ خودکار که برای امضای payloadهای Web Push استفاده می‌شود. |
| `push/web-push-subscriptions.json`                    | endpointهای subscription مرورگر که پایدار شده‌اند.                          |

وقتی می‌خواهید کلیدها را ثابت نگه دارید (برای استقرارهای چندمیزبانه، چرخش secrets، یا تست‌ها)، جفت‌کلید VAPID را از طریق env vars روی فرایند Gateway بازنویسی کنید:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (پیش‌فرض `https://openclaw.ai` است)

Control UI از این متدهای Gateway محدود به scope برای ثبت و آزمایش subscriptionهای مرورگر استفاده می‌کند:

- `push.web.vapidPublicKey` — کلید عمومی VAPID فعال را واکشی می‌کند.
- `push.web.subscribe` — یک `endpoint` به‌همراه `keys.p256dh`/`keys.auth` ثبت می‌کند.
- `push.web.unsubscribe` — یک endpoint ثبت‌شده را حذف می‌کند.
- `push.web.test` — یک اعلان آزمایشی به subscription فراخواننده می‌فرستد.

<Note>
Web Push مستقل از مسیر رلهٔ iOS APNS است (برای push مبتنی بر رله، [پیکربندی](/fa/gateway/configuration) را ببینید) و همچنین مستقل از متد موجود `push.test` است که جفت‌سازی native mobile را هدف می‌گیرد.
</Note>

## embedهای میزبانی‌شده

پیام‌های assistant می‌توانند محتوای وب میزبانی‌شده را به‌صورت inline با shortcode `[embed ...]` رندر کنند. سیاست sandbox مربوط به iframe با `gateway.controlUi.embedSandbox` کنترل می‌شود:

<Tabs>
  <Tab title="strict">
    اجرای script را داخل embedهای میزبانی‌شده غیرفعال می‌کند.
  </Tab>
  <Tab title="scripts (default)">
    embedهای تعاملی را مجاز می‌کند و در عین حال جداسازی origin را نگه می‌دارد؛ این حالت پیش‌فرض است و معمولاً برای بازی‌ها/ویجت‌های مرورگری self-contained کافی است.
  </Tab>
  <Tab title="trusted">
    برای سندهای same-site که عمداً به امتیازهای قوی‌تر نیاز دارند، `allow-same-origin` را علاوه بر `allow-scripts` اضافه می‌کند.
  </Tab>
</Tabs>

نمونه:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
از `trusted` فقط وقتی استفاده کنید که سند embedشده واقعاً به رفتار same-origin نیاز دارد. برای بیشتر بازی‌ها و canvasهای تعاملی تولیدشده توسط agent، `scripts` گزینهٔ امن‌تری است.
</Warning>

URLهای embed خارجی مطلق `http(s)` به‌طور پیش‌فرض مسدود می‌مانند. اگر عمداً می‌خواهید `[embed url="https://..."]` صفحه‌های شخص ثالث را بارگذاری کند، `gateway.controlUi.allowExternalEmbedUrls: true` را تنظیم کنید.

## عرض پیام Chat

پیام‌های گروه‌بندی‌شدهٔ Chat از یک max-width پیش‌فرض خوانا استفاده می‌کنند. استقرارهای دارای مانیتور عریض می‌توانند بدون patch کردن CSS بسته‌بندی‌شده، با تنظیم `gateway.controlUi.chatMessageMaxWidth` آن را بازنویسی کنند:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

مقدار پیش از رسیدن به مرورگر اعتبارسنجی می‌شود. مقدارهای پشتیبانی‌شده شامل طول‌ها و درصدهای ساده مانند `960px` یا `82%`، به‌علاوهٔ عبارت‌های محدودشدهٔ عرض `min(...)`، `max(...)`، `clamp(...)`، `calc(...)`، و `fit-content(...)` هستند.

## دسترسی tailnet (توصیه‌شده)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gateway را روی loopback نگه دارید و اجازه دهید Tailscale Serve آن را با HTTPS پروکسی کند:

    ```bash
    openclaw gateway --tailscale serve
    ```

    باز کنید:

    - `https://<magicdns>/` (یا `gateway.controlUi.basePath` پیکربندی‌شدهٔ شما)

    به‌طور پیش‌فرض، درخواست‌های Control UI/WebSocket Serve وقتی `gateway.auth.allowTailscale` برابر `true` باشد، می‌توانند از طریق headerهای هویت Tailscale (`tailscale-user-login`) احراز هویت کنند. OpenClaw هویت را با resolve کردن نشانی `x-forwarded-for` با `tailscale whois` و تطبیق آن با header تأیید می‌کند، و فقط وقتی این موارد را می‌پذیرد که درخواست با headerهای `x-forwarded-*` متعلق به Tailscale به loopback برسد. برای نشست‌های operator در Control UI با هویت دستگاه مرورگر، این مسیر Serve تأییدشده همچنین رفت‌وبرگشت جفت‌سازی دستگاه را رد می‌کند؛ مرورگرهای بدون دستگاه و اتصال‌های node-role همچنان بررسی‌های عادی دستگاه را دنبال می‌کنند. اگر می‌خواهید حتی برای ترافیک Serve نیز credentialهای shared-secret صریح لازم باشد، `gateway.auth.allowTailscale: false` را تنظیم کنید. سپس از `gateway.auth.mode: "token"` یا `"password"` استفاده کنید.

    برای آن مسیر async هویت Serve، تلاش‌های ناموفق auth برای همان IP client و scope احراز هویت، پیش از نوشتن rate-limit سریالی می‌شوند. بنابراین retryهای بد هم‌زمان از همان مرورگر می‌توانند روی درخواست دوم به‌جای دو mismatch ساده که موازی با هم race می‌کنند، `retry later` نشان دهند.

    <Warning>
    احراز هویت Serve بدون token فرض می‌کند میزبان gateway قابل اعتماد است. اگر ممکن است کد محلی غیرقابل اعتماد روی آن میزبان اجرا شود، احراز هویت token/password را الزامی کنید.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    سپس باز کنید:

    - `http://<tailscale-ip>:18789/` (یا `gateway.controlUi.basePath` پیکربندی‌شدهٔ شما)

    shared secret متناظر را در تنظیمات UI paste کنید (به‌صورت `connect.params.auth.token` یا `connect.params.auth.password` ارسال می‌شود).

  </Tab>
</Tabs>

## HTTP ناامن

اگر داشبورد را با HTTP ساده باز کنید (`http://<lan-ip>` یا `http://<tailscale-ip>`)، مرورگر در یک **context غیرامن** اجرا می‌شود و WebCrypto را مسدود می‌کند. به‌طور پیش‌فرض، OpenClaw اتصال‌های Control UI بدون هویت دستگاه را **مسدود** می‌کند.

استثناهای مستندشده:

- سازگاری HTTP ناامن فقط برای localhost با `gateway.controlUi.allowInsecureAuth=true`
- احراز هویت موفق Control UI برای operator از طریق `gateway.auth.mode: "trusted-proxy"`
- حالت اضطراری `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**راه‌حل توصیه‌شده:** از HTTPS (Tailscale Serve) استفاده کنید یا UI را به‌صورت محلی باز کنید:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (روی میزبان gateway)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` فقط یک toggle سازگاری محلی است:

    - به نشست‌های Control UI در localhost اجازه می‌دهد بدون هویت دستگاه در contextهای HTTP غیرامن ادامه پیدا کنند.
    - بررسی‌های جفت‌سازی را bypass نمی‌کند.
    - نیازمندی‌های هویت دستگاه remote (غیر-localhost) را کاهش نمی‌دهد.

  </Accordion>
  <Accordion title="Break-glass only">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` بررسی‌های هویت دستگاه Control UI را غیرفعال می‌کند و یک کاهش امنیتی شدید است. پس از استفادهٔ اضطراری، سریعاً آن را برگردانید.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - احراز هویت موفق trusted-proxy می‌تواند نشست‌های Control UI مربوط به **operator** را بدون هویت دستگاه بپذیرد.
    - این مورد به نشست‌های Control UI با نقش node تعمیم پیدا نمی‌کند.
    - reverse proxyهای loopback روی همان میزبان همچنان احراز هویت trusted-proxy را برآورده نمی‌کنند؛ [احراز هویت trusted proxy](/fa/gateway/trusted-proxy-auth) را ببینید.

  </Accordion>
</AccordionGroup>

برای راهنمایی راه‌اندازی HTTPS، [Tailscale](/fa/gateway/tailscale) را ببینید.

## سیاست امنیت محتوا

Control UI با یک سیاست `img-src` سخت‌گیرانه ارائه می‌شود: فقط assetهای **same-origin**، URLهای `data:`، و URLهای `blob:` تولیدشدهٔ محلی مجاز هستند. URLهای تصویر remote `http(s)` و protocol-relative توسط مرورگر رد می‌شوند و network fetch صادر نمی‌کنند.

معنای عملی این موضوع:

- Avatarها و تصویرهایی که زیر مسیرهای relative ارائه می‌شوند (برای مثال `/avatars/<id>`) همچنان رندر می‌شوند، از جمله routeهای avatar احرازشده که UI آن‌ها را واکشی و به URLهای `blob:` محلی تبدیل می‌کند.
- URLهای inline `data:image/...` همچنان رندر می‌شوند (برای payloadهای in-protocol مفید است).
- URLهای `blob:` محلی که Control UI می‌سازد همچنان رندر می‌شوند.
- URLهای avatar remote که metadata کانال منتشر می‌کند در helperهای avatar مربوط به Control UI حذف می‌شوند و با logo/badge داخلی جایگزین می‌شوند، بنابراین یک کانال compromised یا malicious نمی‌تواند مرورگر operator را مجبور به fetch کردن تصویرهای remote دلخواه کند.

برای دریافت این رفتار نیازی نیست چیزی را تغییر دهید — همیشه فعال است و قابل پیکربندی نیست.

## احراز هویت route مربوط به avatar

وقتی auth gateway پیکربندی شده باشد، endpoint مربوط به avatar در Control UI همان token gateway را مانند بقیهٔ API لازم دارد:

- `GET /avatar/<agentId>` تصویر avatar را فقط به فراخواننده‌های احرازشده برمی‌گرداند. `GET /avatar/<agentId>?meta=1` metadata مربوط به avatar را با همین قاعده برمی‌گرداند.
- درخواست‌های احرازنشده به هرکدام از routeها رد می‌شوند (مطابق route خواهر assistant-media). این کار مانع نشت هویت agent از route avatar روی میزبان‌هایی می‌شود که در غیر این صورت محافظت شده‌اند.
- خود Control UI هنگام واکشی avatarها، token gateway را به‌عنوان bearer header ارسال می‌کند، و از URLهای blob احرازشده استفاده می‌کند تا تصویر همچنان در داشبوردها رندر شود.

اگر احراز هویت Gateway را غیرفعال کنید (روی میزبان‌های مشترک توصیه نمی‌شود)، مسیر آواتار نیز بدون احراز هویت می‌شود، همسو با بقیه Gateway.

## احراز هویت مسیر رسانه دستیار

وقتی احراز هویت Gateway پیکربندی شده باشد، پیش‌نمایش‌های رسانه محلی دستیار از یک مسیر دومرحله‌ای استفاده می‌کنند:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` به احراز هویت عادی اپراتور Control UI نیاز دارد. مرورگر هنگام بررسی در دسترس بودن، توکن Gateway را به‌عنوان سربرگ bearer ارسال می‌کند.
- پاسخ‌های فراداده موفق شامل یک `mediaTicket` کوتاه‌مدت هستند که به همان مسیر منبع دقیق محدود شده است.
- URLهای تصویر، صدا، ویدئو و سند که در مرورگر رندر می‌شوند، به‌جای توکن یا گذرواژه فعال Gateway از `mediaTicket=<ticket>` استفاده می‌کنند. بلیت به‌سرعت منقضی می‌شود و نمی‌تواند منبع دیگری را مجاز کند.

این کار رندر عادی رسانه را با عناصر رسانه بومی مرورگر سازگار نگه می‌دارد، بدون اینکه اعتبارنامه‌های قابل‌استفاده‌مجدد Gateway را در URLهای رسانه قابل مشاهده قرار دهد.

## ساخت رابط کاربری

Gateway فایل‌های ایستا را از `dist/control-ui` ارائه می‌کند. آن‌ها را با این دستور بسازید:

```bash
pnpm ui:build
```

پایه مطلق اختیاری (وقتی URLهای ثابت برای دارایی‌ها می‌خواهید):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

برای توسعه محلی (سرور توسعه جداگانه):

```bash
pnpm ui:dev
```

سپس رابط کاربری را به URL مربوط به Gateway WS خود اشاره دهید (مثلاً `ws://127.0.0.1:18789`).

## صفحه خالی Control UI

اگر مرورگر یک داشبورد خالی بارگذاری کند و DevTools خطای مفیدی نشان ندهد، ممکن است یک افزونه یا اسکریپت محتوای اولیه جلوی ارزیابی اپ ماژول JavaScript را گرفته باشد. صفحه ایستا شامل یک پنل بازیابی HTML ساده است که وقتی `<openclaw-app>` پس از راه‌اندازی ثبت نشده باشد ظاهر می‌شود.

پس از تغییر محیط مرورگر، از اقدام **دوباره تلاش کن** پنل استفاده کنید، یا پس از این بررسی‌ها دستی بارگذاری مجدد کنید:

- افزونه‌هایی را که به همه صفحه‌ها تزریق می‌شوند غیرفعال کنید، به‌ویژه افزونه‌هایی با اسکریپت‌های محتوای `<all_urls>`.
- یک پنجره خصوصی، یک پروفایل مرورگر پاک، یا مرورگر دیگری را امتحان کنید.
- Gateway را در حال اجرا نگه دارید و پس از تغییر مرورگر همان URL داشبورد را بررسی کنید.

## اشکال‌زدایی/آزمایش: سرور توسعه + Gateway راه دور

Control UI از فایل‌های ایستا تشکیل شده است؛ مقصد WebSocket قابل پیکربندی است و می‌تواند با مبدأ HTTP متفاوت باشد. این وقتی مفید است که سرور توسعه Vite را به‌صورت محلی می‌خواهید اما Gateway جای دیگری اجرا می‌شود.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    احراز هویت یک‌باره اختیاری (در صورت نیاز):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` پس از بارگذاری در localStorage ذخیره و از URL حذف می‌شود.
    - اگر یک نقطه پایانی کامل `ws://` یا `wss://` را از طریق `gatewayUrl` می‌فرستید، مقدار `gatewayUrl` را URL-encode کنید تا مرورگر رشته پرس‌وجو را درست تجزیه کند.
    - `token` تا حد امکان باید از طریق قطعه URL (`#token=...`) ارسال شود. قطعه‌ها به سرور ارسال نمی‌شوند، که از نشت در لاگ درخواست و Referer جلوگیری می‌کند. پارامترهای پرس‌وجوی قدیمی `?token=` هنوز برای سازگاری یک بار وارد می‌شوند، اما فقط به‌عنوان مسیر جایگزین، و بلافاصله پس از bootstrap حذف می‌شوند.
    - `password` فقط در حافظه نگه داشته می‌شود.
    - وقتی `gatewayUrl` تنظیم شده باشد، رابط کاربری به اعتبارنامه‌های config یا محیط برنمی‌گردد. `token` (یا `password`) را صریح ارائه کنید. نبود اعتبارنامه‌های صریح خطا است.
    - وقتی Gateway پشت TLS است (Tailscale Serve، پراکسی HTTPS و غیره)، از `wss://` استفاده کنید.
    - `gatewayUrl` فقط در یک پنجره سطح بالا پذیرفته می‌شود (نه جاسازی‌شده) تا از clickjacking جلوگیری شود.
    - استقرارهای عمومی غیر local loopback مربوط به Control UI باید `gateway.controlUi.allowedOrigins` را صریح تنظیم کنند (مبدأهای کامل). بارگذاری‌های خصوصی LAN/Tailnet هم‌مبدأ از local loopback، RFC1918/link-local، `.local`، `.ts.net`، یا میزبان‌های CGNAT متعلق به Tailscale بدون فعال کردن مسیر جایگزین Host-header پذیرفته می‌شوند.
    - راه‌اندازی Gateway ممکن است مبدأهای محلی مانند `http://localhost:<port>` و `http://127.0.0.1:<port>` را از bind و پورت مؤثر زمان اجرا seed کند، اما مبدأهای مرورگر راه دور همچنان به ورودی‌های صریح نیاز دارند.
    - از `gateway.controlUi.allowedOrigins: ["*"]` استفاده نکنید مگر برای آزمایش محلی کاملاً کنترل‌شده. معنای آن اجازه دادن به هر مبدأ مرورگر است، نه «با هر میزبانی که استفاده می‌کنم تطبیق بده».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` حالت مسیر جایگزین مبدأ Host-header را فعال می‌کند، اما این یک حالت امنیتی خطرناک است.

  </Accordion>
</AccordionGroup>

مثال:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

جزئیات راه‌اندازی دسترسی راه دور: [دسترسی راه دور](/fa/gateway/remote).

## مرتبط

- [داشبورد](/fa/web/dashboard) — داشبورد Gateway
- [بررسی‌های سلامت](/fa/gateway/health) — پایش سلامت Gateway
- [TUI](/fa/web/tui) — رابط کاربری ترمینالی
- [وب‌چت](/fa/web/webchat) — رابط چت مبتنی بر مرورگر
