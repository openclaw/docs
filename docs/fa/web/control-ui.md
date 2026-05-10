---
read_when:
    - می‌خواهید Gateway را از طریق مرورگر مدیریت کنید
    - دسترسی Tailnet را بدون تونل‌های SSH می‌خواهید
sidebarTitle: Control UI
summary: رابط کاربری کنترل مبتنی بر مرورگر برای Gateway (گفت‌وگو، گره‌ها، پیکربندی)
title: رابط کاربری کنترل
x-i18n:
    generated_at: "2026-05-10T20:14:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb158d1b6b92b7097fe7ba8d61aee5d6c6e67a8d45fc2cb2514c555ef3e52d81
    source_path: web/control-ui.md
    workflow: 16
---

Control UI یک اپلیکیشن تک‌صفحه‌ای کوچک با **Vite + Lit** است که توسط Gateway سرو می‌شود:

- پیش‌فرض: `http://<host>:18789/`
- پیشوند اختیاری: `gateway.controlUi.basePath` را تنظیم کنید (مثلاً `/openclaw`)

این اپلیکیشن **مستقیماً با Gateway WebSocket** روی همان پورت صحبت می‌کند.

## باز کردن سریع (محلی)

اگر Gateway روی همان رایانه در حال اجرا است، باز کنید:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (یا [http://localhost:18789/](http://localhost:18789/))

اگر صفحه بارگذاری نشد، ابتدا Gateway را شروع کنید: `openclaw gateway`.

احراز هویت هنگام WebSocket handshake از طریق این موارد ارائه می‌شود:

- `connect.params.auth.token`
- `connect.params.auth.password`
- هدرهای هویت Tailscale Serve وقتی `gateway.auth.allowTailscale: true` باشد
- هدرهای هویت trusted-proxy وقتی `gateway.auth.mode: "trusted-proxy"` باشد

پنل تنظیمات داشبورد یک توکن را برای نشست تب فعلی مرورگر و URL انتخاب‌شده gateway نگه می‌دارد؛ گذرواژه‌ها ماندگار نمی‌شوند. معمولاً onboarding در اولین اتصال، برای احراز هویت shared-secret یک gateway token تولید می‌کند، اما وقتی `gateway.auth.mode` برابر `"password"` باشد احراز هویت با گذرواژه هم کار می‌کند.

## جفت‌سازی دستگاه (اولین اتصال)

وقتی از یک مرورگر یا دستگاه جدید به Control UI وصل می‌شوید، Gateway معمولاً به **تأیید یک‌باره جفت‌سازی** نیاز دارد. این یک اقدام امنیتی برای جلوگیری از دسترسی غیرمجاز است.

**آنچه می‌بینید:** "disconnected (1008): pairing required"

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

اگر مرورگر با جزئیات احراز هویت تغییرکرده (نقش/دامنه‌ها/کلید عمومی) دوباره جفت‌سازی را امتحان کند، درخواست در انتظار قبلی جایگزین می‌شود و یک `requestId` جدید ساخته می‌شود. پیش از تأیید، دوباره `openclaw devices list` را اجرا کنید.

اگر مرورگر از قبل جفت شده باشد و آن را از دسترسی خواندن به دسترسی نوشتن/admin تغییر دهید، این مورد به‌عنوان ارتقای تأیید در نظر گرفته می‌شود، نه اتصال مجدد بی‌صدا. OpenClaw تأیید قبلی را فعال نگه می‌دارد، اتصال مجدد گسترده‌تر را مسدود می‌کند، و از شما می‌خواهد مجموعه scope جدید را صریحاً تأیید کنید.

پس از تأیید، دستگاه به خاطر سپرده می‌شود و دیگر به تأیید دوباره نیاز ندارد، مگر اینکه آن را با `openclaw devices revoke --device <id> --role <role>` لغو کنید. برای چرخش توکن و لغو، [CLI دستگاه‌ها](/fa/cli/devices) را ببینید.

<Note>
- اتصال‌های مستقیم مرورگر از طریق local loopback (`127.0.0.1` / `localhost`) به‌صورت خودکار تأیید می‌شوند.
- Tailscale Serve می‌تواند برای نشست‌های اپراتور Control UI، وقتی `gateway.auth.allowTailscale: true` باشد، هویت Tailscale تأیید شود، و مرورگر هویت دستگاه خود را ارائه کند، رفت‌وبرگشت جفت‌سازی را رد کند.
- اتصال‌های مستقیم Tailnet، اتصال‌های مرورگر LAN، و پروفایل‌های مرورگر بدون هویت دستگاه همچنان به تأیید صریح نیاز دارند.
- هر پروفایل مرورگر یک شناسه دستگاه یکتا تولید می‌کند، بنابراین تغییر مرورگر یا پاک کردن داده‌های مرورگر به جفت‌سازی دوباره نیاز خواهد داشت.

</Note>

## هویت شخصی (محلیِ مرورگر)

Control UI از یک هویت شخصی برای هر مرورگر پشتیبانی می‌کند (نام نمایشی و آواتار) که برای انتساب در نشست‌های مشترک به پیام‌های خروجی پیوست می‌شود. این هویت در فضای ذخیره‌سازی مرورگر قرار دارد، به پروفایل مرورگر فعلی محدود است، و با دستگاه‌های دیگر همگام‌سازی نمی‌شود یا در سمت سرور ماندگار نمی‌ماند، جز فراداده معمول authorship رونوشت روی پیام‌هایی که واقعاً ارسال می‌کنید. پاک کردن داده‌های سایت یا تغییر مرورگر آن را به حالت خالی بازنشانی می‌کند.

همین الگوی محلیِ مرورگر برای override آواتار دستیار هم اعمال می‌شود. آواتارهای بارگذاری‌شده دستیار، هویت resolve‌شده توسط gateway را فقط روی مرورگر محلی overlay می‌کنند و هرگز از مسیر `config.patch` رفت‌وبرگشت نمی‌کنند. فیلد پیکربندی مشترک `ui.assistant.avatar` همچنان برای کلاینت‌های غیر UI که مستقیماً در فیلد می‌نویسند در دسترس است (مانند gatewayهای اسکریپتی یا داشبوردهای سفارشی).

## endpoint پیکربندی زمان اجرا

Control UI تنظیمات زمان اجرای خود را از `/__openclaw/control-ui-config.json` دریافت می‌کند. این endpoint با همان احراز هویت gateway که برای بقیه سطح HTTP استفاده می‌شود محافظت می‌شود: مرورگرهای احراز هویت‌نشده نمی‌توانند آن را دریافت کنند، و دریافت موفق به یک gateway token/password از قبل معتبر، هویت Tailscale Serve، یا هویت trusted-proxy نیاز دارد.

## پشتیبانی زبان

Control UI می‌تواند در اولین بارگذاری، خود را بر اساس زبان مرورگر شما بومی‌سازی کند. برای override کردن آن بعداً، **Overview -> Gateway Access -> Language** را باز کنید. انتخاب‌گر locale در کارت Gateway Access قرار دارد، نه زیر Appearance.

- localeهای پشتیبانی‌شده: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- ترجمه‌های غیرانگلیسی در مرورگر به‌صورت lazy-loaded بارگذاری می‌شوند.
- locale انتخاب‌شده در فضای ذخیره‌سازی مرورگر ذخیره می‌شود و در بازدیدهای بعدی دوباره استفاده می‌شود.
- کلیدهای ترجمه جاافتاده به انگلیسی fallback می‌شوند.

ترجمه‌های docs برای همان مجموعه locale غیرانگلیسی تولید می‌شوند، اما انتخاب‌گر زبان داخلی سایت docs در Mintlify به کدهای localeای محدود است که Mintlify می‌پذیرد. docs تایلندی (`th`) و فارسی (`fa`) همچنان در publish repo تولید می‌شوند؛ ممکن است تا زمانی که Mintlify از آن کدها پشتیبانی کند در آن انتخاب‌گر ظاهر نشوند.

## تم‌های ظاهری

پنل Appearance تم‌های داخلی Claw، Knot، و Dash را، به‌علاوه یک جایگاه import محلی مرورگر برای tweakcn، نگه می‌دارد. برای وارد کردن یک تم، [tweakcn editor](https://tweakcn.com/editor/theme) را باز کنید، یک تم را انتخاب یا ایجاد کنید، روی **Share** کلیک کنید، و لینک تم کپی‌شده را در Appearance جای‌گذاری کنید. واردکننده همچنین URLهای رجیستری `https://tweakcn.com/r/themes/<id>`، URLهای editor مانند `https://tweakcn.com/editor/theme?theme=amethyst-haze`، مسیرهای نسبی `/themes/<id>`، شناسه‌های خام تم، و نام‌های تم پیش‌فرض مانند `amethyst-haze` را می‌پذیرد.

تم‌های واردشده فقط در پروفایل مرورگر فعلی ذخیره می‌شوند. آن‌ها در پیکربندی gateway نوشته نمی‌شوند و بین دستگاه‌ها همگام‌سازی نمی‌شوند. جایگزین کردن تم واردشده همان یک جایگاه محلی را به‌روزرسانی می‌کند؛ پاک کردن آن، اگر تم واردشده انتخاب شده باشد، تم فعال را به Claw برمی‌گرداند.

## کارهایی که می‌تواند انجام دهد (امروز)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - از طریق Gateway WS با مدل گفت‌وگو کنید (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - تازه‌سازی‌های تاریخچه گفت‌وگو یک پنجره اخیر محدود با سقف‌های متن برای هر پیام درخواست می‌کنند تا نشست‌های بزرگ مرورگر را مجبور نکنند پیش از قابل‌استفاده شدن گفت‌وگو، یک payload کامل رونوشت را render کند.
    - از طریق نشست‌های realtime مرورگر صحبت کنید. OpenAI از WebRTC مستقیم استفاده می‌کند، Google Live از یک توکن مرورگر یک‌بارمصرف محدود روی WebSocket استفاده می‌کند، و Pluginهای voice realtime فقط backend از transport رله Gateway استفاده می‌کنند. نشست‌های provider متعلق به کلاینت با `talk.client.create` شروع می‌شوند؛ نشست‌های رله Gateway با `talk.session.create` شروع می‌شوند. رله credentialهای provider را روی Gateway نگه می‌دارد، در حالی که مرورگر microphone PCM را از طریق `talk.session.appendAudio` استریم می‌کند و provider tool callهای `openclaw_agent_consult` را از طریق `talk.client.toolCall` برای policy Gateway و مدل OpenClaw پیکربندی‌شده بزرگ‌تر forward می‌کند.
    - tool callها + کارت‌های خروجی زنده ابزار را در Chat استریم کنید (رویدادهای agent).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - کانال‌ها: وضعیت کانال‌های داخلی به‌علاوه کانال‌های Plugin بسته‌بندی‌شده/خارجی، ورود QR، و پیکربندی هر کانال (`channels.status`, `web.login.*`, `config.patch`).
    - تازه‌سازی‌های probe کانال snapshot قبلی را در حالی که بررسی‌های کند provider تمام می‌شوند قابل مشاهده نگه می‌دارند، و وقتی یک probe یا audit از بودجه UI خود فراتر می‌رود snapshotهای جزئی برچسب‌گذاری می‌شوند.
    - instanceها: فهرست presence + تازه‌سازی (`system-presence`).
    - نشست‌ها: به‌طور پیش‌فرض نشست‌های agent پیکربندی‌شده را فهرست می‌کند، از کلیدهای stale نشست agent پیکربندی‌نشده fallback می‌کند، و overrideهای model/thinking/fast/verbose/trace/reasoning را برای هر نشست اعمال می‌کند (`sessions.list`, `sessions.patch`).
    - Dreams: وضعیت dreaming، toggle فعال/غیرفعال، و خواننده Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - jobهای Cron: فهرست/افزودن/ویرایش/اجرا/فعال/غیرفعال + تاریخچه اجرا (`cron.*`).
    - Skills: وضعیت، فعال/غیرفعال، نصب، به‌روزرسانی‌های کلید API (`skills.*`).
    - Nodeها: فهرست + caps (`node.list`).
    - تأییدهای exec: ویرایش allowlistهای gateway یا node + policy پرسش برای `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - مشاهده/ویرایش `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - اعمال + راه‌اندازی مجدد با اعتبارسنجی (`config.apply`) و wake کردن آخرین نشست فعال.
    - نوشتن‌ها شامل یک محافظ base-hash هستند تا از clobber شدن ویرایش‌های همزمان جلوگیری کنند.
    - نوشتن‌ها (`config.set`/`config.apply`/`config.patch`) پیش از اجرا، resolution فعال SecretRef را برای refهای موجود در payload پیکربندی ارسال‌شده بررسی می‌کنند؛ refهای ارسال‌شده فعال و resolveنشده پیش از نوشتن رد می‌شوند.
    - schema + render فرم (`config.schema` / `config.schema.lookup`، شامل `title` / `description` فیلد، hintهای UI تطبیق‌داده‌شده، خلاصه‌های فرزند بلافاصله، فراداده docs روی nodeهای nested object/wildcard/array/composition، به‌علاوه schemaهای Plugin + کانال وقتی در دسترس باشند)؛ ویرایشگر Raw JSON فقط وقتی در دسترس است که snapshot یک round-trip خام امن داشته باشد.
    - اگر یک snapshot نتواند متن خام را به‌صورت امن round-trip کند، Control UI حالت Form را اجباری می‌کند و حالت Raw را برای آن snapshot غیرفعال می‌کند.
    - گزینه "Reset to saved" در ویرایشگر Raw JSON شکل raw-authored را حفظ می‌کند (قالب‌بندی، comments، چیدمان `$include`) به‌جای اینکه یک snapshot flattenشده را دوباره render کند، بنابراین ویرایش‌های خارجی وقتی snapshot بتواند به‌صورت امن round-trip کند از reset جان سالم به در می‌برند.
    - مقادیر object ساختاریافته SecretRef در inputهای متنی فرم به‌صورت read-only render می‌شوند تا از خراب شدن تصادفی object-to-string جلوگیری شود.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: snapshotهای وضعیت/سلامت/مدل‌ها + log رویداد + فراخوانی‌های RPC دستی (`status`, `health`, `models.list`).
    - log رویداد شامل زمان‌بندی‌های تازه‌سازی/RPC در Control UI، زمان‌بندی‌های کند render گفت‌وگو/پیکربندی، و entryهای responsiveness مرورگر برای frameهای طولانی animation یا taskهای طولانی است، وقتی مرورگر آن نوع entryهای PerformanceObserver را expose کند.
    - Logs: tail زنده logهای فایل gateway با فیلتر/export (`logs.tail`).
    - Update: اجرای update بسته/git + راه‌اندازی مجدد (`update.run`) با گزارش restart، سپس poll کردن `update.status` پس از reconnect برای تأیید نسخه gateway در حال اجرا.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - برای jobهای isolated، delivery به‌طور پیش‌فرض announce summary است. اگر اجراهای فقط داخلی می‌خواهید می‌توانید به none تغییر دهید.
    - وقتی announce انتخاب شده باشد، فیلدهای channel/target ظاهر می‌شوند.
    - حالت Webhook از `delivery.mode = "webhook"` استفاده می‌کند و `delivery.to` روی یک URL معتبر HTTP(S) webhook تنظیم می‌شود.
    - برای jobهای main-session، حالت‌های delivery webhook و none در دسترس هستند.
    - کنترل‌های ویرایش پیشرفته شامل delete-after-run، پاک کردن override agent، گزینه‌های cron exact/stagger، overrideهای model/thinking برای agent، و toggleهای best-effort delivery هستند.
    - اعتبارسنجی فرم inline و با خطاهای سطح فیلد است؛ مقادیر نامعتبر تا زمان اصلاح، دکمه ذخیره را غیرفعال می‌کنند.
    - برای ارسال یک bearer token اختصاصی، `cron.webhookToken` را تنظیم کنید؛ اگر حذف شود webhook بدون هدر احراز هویت ارسال می‌شود.
    - fallback منسوخ: jobهای legacy ذخیره‌شده با `notify: true` تا زمان migration همچنان می‌توانند از `cron.webhook` استفاده کنند.

  </Accordion>
</AccordionGroup>

## رفتار گفت‌وگو

<AccordionGroup>
  <Accordion title="معناشناسی ارسال و تاریخچه">
    - `chat.send` **غیرمسدودکننده** است: بلافاصله با `{ runId, status: "started" }` تأیید می‌کند و پاسخ از طریق رویدادهای `chat` استریم می‌شود.
    - بارگذاری‌های چت تصویرها و فایل‌های غیر ویدیویی را می‌پذیرند. تصویرها مسیر تصویر بومی را حفظ می‌کنند؛ فایل‌های دیگر به‌عنوان رسانه مدیریت‌شده ذخیره می‌شوند و در تاریخچه به‌صورت پیوندهای پیوست نمایش داده می‌شوند.
    - ارسال دوباره با همان `idempotencyKey` هنگام اجرا `{ status: "in_flight" }` و پس از تکمیل `{ status: "ok" }` برمی‌گرداند.
    - پاسخ‌های `chat.history` برای ایمنی UI از نظر اندازه محدود هستند. وقتی ورودی‌های رونوشت بیش از حد بزرگ باشند، Gateway ممکن است فیلدهای متنی طولانی را کوتاه کند، بلوک‌های فراداده سنگین را حذف کند، و پیام‌های بیش‌ازحد بزرگ را با یک جای‌نگهدار (`[chat.history omitted: message too large]`) جایگزین کند.
    - تصویرهای assistant/تولیدشده به‌عنوان ارجاع‌های رسانه مدیریت‌شده ماندگار می‌شوند و از طریق URLهای رسانه احراز هویت‌شده Gateway دوباره ارائه می‌شوند، بنابراین بارگذاری مجدد به باقی ماندن payloadهای تصویر base64 خام در پاسخ تاریخچه چت وابسته نیست.
    - هنگام رندر کردن `chat.history`، UI کنترل برچسب‌های directive درون‌خطی صرفاً نمایشی را از متن قابل مشاهده assistant حذف می‌کند (برای مثال `[[reply_to_*]]` و `[[audio_as_voice]]`)، payloadهای XML فراخوانی ابزار در متن ساده (از جمله `<tool_call>...</tool_call>`، `<function_call>...</function_call>`، `<tool_calls>...</tool_calls>`، `<function_calls>...</function_calls>`، و بلوک‌های فراخوانی ابزار کوتاه‌شده)، و tokenهای کنترلی مدل ASCII/تمام‌عرض نشت‌کرده را حذف می‌کند، و ورودی‌های assistant را که کل متن قابل مشاهده آن‌ها فقط token ساکت دقیق `NO_REPLY` / `no_reply` یا token تأیید Heartbeat یعنی `HEARTBEAT_OK` است، نادیده می‌گیرد.
    - در طول یک ارسال فعال و تازه‌سازی نهایی تاریخچه، اگر `chat.history` برای مدت کوتاهی snapshot قدیمی‌تری برگرداند، نمای چت پیام‌های خوش‌بینانه محلی کاربر/assistant را قابل مشاهده نگه می‌دارد؛ وقتی تاریخچه Gateway به‌روز شد، رونوشت canonical جایگزین آن پیام‌های محلی می‌شود.
    - رویدادهای زنده `chat` وضعیت تحویل هستند، در حالی که `chat.history` از رونوشت بادوام نشست بازسازی می‌شود. پس از رویدادهای نهایی ابزار، UI کنترل تاریخچه را دوباره بارگذاری می‌کند و فقط یک دنباله خوش‌بینانه کوچک را ادغام می‌کند؛ مرز رونوشت در [WebChat](/fa/web/webchat) مستند شده است.
    - `chat.inject` یک یادداشت assistant را به رونوشت نشست اضافه می‌کند و یک رویداد `chat` را برای به‌روزرسانی‌های صرفاً UI پخش می‌کند (بدون اجرای agent، بدون تحویل کانال).
    - سربرگ چت فیلتر agent را پیش از انتخاب‌گر نشست نشان می‌دهد، و انتخاب‌گر نشست به agent انتخاب‌شده محدود می‌شود. تغییر agent فقط نشست‌های مرتبط با آن agent را نشان می‌دهد و وقتی هنوز نشست‌های dashboard ذخیره‌شده‌ای ندارد، به نشست اصلی همان agent برمی‌گردد.
    - در عرض‌های دسکتاپ، کنترل‌های چت در یک ردیف فشرده می‌مانند و هنگام پیمایش به پایین رونوشت جمع می‌شوند؛ پیمایش به بالا، بازگشت به ابتدای صفحه، یا رسیدن به انتها کنترل‌ها را بازمی‌گرداند.
    - پیام‌های تکراری متوالی که فقط متن دارند به‌صورت یک حباب با نشان شمارش رندر می‌شوند. پیام‌هایی که تصویر، پیوست، خروجی ابزار، یا پیش‌نمایش canvas دارند جمع نمی‌شوند.
    - انتخاب‌گرهای مدل و thinking در سربرگ چت، نشست فعال را بلافاصله از طریق `sessions.patch` patch می‌کنند؛ آن‌ها overrideهای ماندگار نشست هستند، نه گزینه‌های ارسال فقط برای یک نوبت.
    - اگر در حالی پیامی ارسال کنید که تغییر انتخاب‌گر مدل برای همان نشست هنوز در حال ذخیره شدن است، composer پیش از فراخوانی `chat.send` منتظر آن patch نشست می‌ماند تا ارسال از مدل انتخاب‌شده استفاده کند.
    - تایپ `/new` در UI کنترل، همان نشست تازه dashboard را مانند New Chat ایجاد کرده و به آن تغییر می‌دهد، مگر وقتی `session.dmScope: "main"` پیکربندی شده باشد و والد فعلی نشست اصلی agent باشد؛ در آن حالت نشست اصلی را درجا reset می‌کند. تایپ `/reset` reset صریح درجا Gateway را برای نشست فعلی حفظ می‌کند.
    - انتخاب‌گر مدل چت نمای مدل پیکربندی‌شده Gateway را درخواست می‌کند. اگر `agents.defaults.models` حاضر باشد، آن allowlist انتخاب‌گر را هدایت می‌کند، از جمله ورودی‌های `provider/*` که catalogهای محدود به provider را پویا نگه می‌دارند. در غیر این صورت، انتخاب‌گر ورودی‌های صریح `models.providers.*.models` به‌علاوه providerهایی با احراز هویت قابل استفاده را نشان می‌دهد. catalog کامل از طریق RPC اشکال‌زدایی `models.list` با `view: "all"` در دسترس می‌ماند.
    - وقتی گزارش‌های تازه مصرف نشست Gateway شامل tokenهای context فعلی باشند، ناحیه composer چت یک نشانگر فشرده مصرف context نشان می‌دهد. در فشار بالای context به استایل هشدار تغییر می‌کند و، در سطح‌های توصیه‌شده Compaction، یک دکمه فشرده نشان می‌دهد که مسیر معمول Compaction نشست را اجرا می‌کند. snapshotهای token کهنه تا زمانی که Gateway دوباره مصرف تازه را گزارش کند پنهان می‌شوند.

  </Accordion>
  <Accordion title="حالت گفت‌وگو (realtime مرورگر)">
    حالت گفت‌وگو از یک provider صدای realtime ثبت‌شده استفاده می‌کند. OpenAI را با `talk.realtime.provider: "openai"` به‌علاوه یکی از `talk.realtime.providers.openai.apiKey`، `OPENAI_API_KEY`، یا پروفایل OAuth مربوط به `openai-codex` پیکربندی کنید؛ Google را با `talk.realtime.provider: "google"` به‌علاوه `talk.realtime.providers.google.apiKey` پیکربندی کنید. مرورگر هرگز یک کلید API استاندارد provider را دریافت نمی‌کند. OpenAI یک secret موقت Realtime client برای WebRTC دریافت می‌کند. Google Live یک token احراز هویت Live API محدود و یک‌بارمصرف برای نشست WebSocket مرورگر دریافت می‌کند، در حالی که دستورالعمل‌ها و تعریف‌های ابزار توسط Gateway در token قفل شده‌اند. providerهایی که فقط یک پل realtime بک‌اند ارائه می‌کنند از طریق ترابری relay Gateway اجرا می‌شوند، بنابراین credentialها و socketهای vendor در سمت سرور می‌مانند و صدای مرورگر از طریق RPCهای احراز هویت‌شده Gateway جابه‌جا می‌شود. prompt نشست Realtime توسط Gateway مونتاژ می‌شود؛ `talk.client.create` overrideهای instruction ارائه‌شده توسط فراخواننده را نمی‌پذیرد.

    composer چت یک دکمه گزینه‌های گفت‌وگو کنار دکمه شروع/توقف گفت‌وگو دارد. گزینه‌ها روی نشست گفت‌وگوی بعدی اعمال می‌شوند و می‌توانند provider، transport، model، voice، reasoning effort، آستانه VAD، مدت سکوت، و padding پیشوند را override کنند. وقتی یک گزینه خالی باشد، Gateway در صورت وجود از پیش‌فرض‌های پیکربندی‌شده یا از پیش‌فرض provider استفاده می‌کند. انتخاب Gateway relay مسیر relay بک‌اند را اجبار می‌کند؛ انتخاب WebRTC نشست را تحت مالکیت client نگه می‌دارد و اگر provider نتواند نشست مرورگر ایجاد کند، به‌جای fallback بی‌صدا به relay، شکست می‌خورد.

    در composer چت، کنترل گفت‌وگو دکمه موج‌ها کنار دکمه دیکته میکروفون است. وقتی گفت‌وگو شروع می‌شود، ردیف وضعیت composer ابتدا `Connecting Talk...`، سپس هنگام اتصال صدا `Talk live`، یا هنگام مشورت یک فراخوانی ابزار realtime با مدل بزرگ‌تر پیکربندی‌شده از طریق `talk.client.toolCall` مقدار `Asking OpenClaw...` را نشان می‌دهد.

    smoke زنده نگه‌دارنده: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` پل WebSocket بک‌اند OpenAI، تبادل SDP مرورگر WebRTC OpenAI، راه‌اندازی WebSocket مرورگر با token محدود Google Live، و adapter مرورگر relay Gateway با رسانه میکروفون ساختگی را بررسی می‌کند. این فرمان فقط وضعیت provider را چاپ می‌کند و secretها را log نمی‌کند.

  </Accordion>
  <Accordion title="توقف و لغو">
    - روی **Stop** کلیک کنید (`chat.abort` را فراخوانی می‌کند).
    - وقتی یک اجرا فعال است، follow-upهای معمولی صف می‌شوند. روی **Steer** در یک پیام صف‌شده کلیک کنید تا آن follow-up به نوبت در حال اجرا تزریق شود.
    - برای لغو خارج از باند، `/stop` را تایپ کنید (یا عبارت‌های مستقل لغو مانند `stop`، `stop action`، `stop run`، `stop openclaw`، `please stop`).
    - `chat.abort` از `{ sessionKey }` (بدون `runId`) برای لغو همه اجراهای فعال آن نشست پشتیبانی می‌کند.

  </Accordion>
  <Accordion title="نگهداری بخش جزئی پس از لغو">
    - وقتی یک اجرا لغو می‌شود، متن جزئی assistant همچنان می‌تواند در UI نشان داده شود.
    - Gateway وقتی خروجی bufferشده وجود داشته باشد، متن جزئی assistant لغوشده را در تاریخچه رونوشت ماندگار می‌کند.
    - ورودی‌های ماندگارشده شامل فراداده لغو هستند تا مصرف‌کنندگان رونوشت بتوانند بخش‌های جزئی لغوشده را از خروجی تکمیل عادی تشخیص دهند.

  </Accordion>
</AccordionGroup>

## نصب PWA و web push

UI کنترل همراه با یک `manifest.webmanifest` و یک service worker ارائه می‌شود، بنابراین مرورگرهای مدرن می‌توانند آن را به‌عنوان یک PWA مستقل نصب کنند. Web Push به Gateway امکان می‌دهد حتی وقتی tab یا پنجره مرورگر باز نیست، PWA نصب‌شده را با اعلان‌ها بیدار کند.

| سطح                                                  | کاری که انجام می‌دهد                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | manifest مربوط به PWA. مرورگرها وقتی در دسترس باشد گزینه "Install app" را ارائه می‌کنند. |
| `ui/public/sw.js`                                     | service worker که رویدادهای `push` و کلیک‌های اعلان را مدیریت می‌کند. |
| `push/vapid-keys.json` (زیر دایرکتوری state مربوط به OpenClaw) | keypair خودکار تولیدشده VAPID که برای امضای payloadهای Web Push استفاده می‌شود. |
| `push/web-push-subscriptions.json`                    | endpointهای subscription مرورگر که ماندگار شده‌اند.                |

وقتی می‌خواهید کلیدها را ثابت نگه دارید (برای استقرارهای چند host، چرخش secretها، یا تست‌ها)، keypair مربوط به VAPID را از طریق متغیرهای محیطی روی فرایند Gateway override کنید:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (پیش‌فرض `mailto:openclaw@localhost` است)

UI کنترل از این متدهای Gateway محدودشده با scope برای ثبت و تست subscriptionهای مرورگر استفاده می‌کند:

- `push.web.vapidPublicKey` — کلید عمومی فعال VAPID را دریافت می‌کند.
- `push.web.subscribe` — یک `endpoint` به‌علاوه `keys.p256dh`/`keys.auth` را ثبت می‌کند.
- `push.web.unsubscribe` — یک endpoint ثبت‌شده را حذف می‌کند.
- `push.web.test` — یک اعلان تست به subscription فراخواننده ارسال می‌کند.

<Note>
Web Push مستقل از مسیر relay مربوط به iOS APNS است (برای push مبتنی بر relay به [پیکربندی](/fa/gateway/configuration) مراجعه کنید) و همچنین مستقل از متد موجود `push.test` است که pairing موبایل native را هدف می‌گیرند.
</Note>

## embedهای میزبانی‌شده

پیام‌های assistant می‌توانند محتوای وب میزبانی‌شده را به‌صورت درون‌خطی با shortcode `[embed ...]` رندر کنند. سیاست sandbox مربوط به iframe توسط `gateway.controlUi.embedSandbox` کنترل می‌شود:

<Tabs>
  <Tab title="strict">
    اجرای script را داخل embedهای میزبانی‌شده غیرفعال می‌کند.
  </Tab>
  <Tab title="scripts (default)">
    embedهای تعاملی را مجاز می‌کند و در عین حال جداسازی origin را حفظ می‌کند؛ این پیش‌فرض است و معمولاً برای بازی‌ها/ویجت‌های مرورگری خودبسنده کافی است.
  </Tab>
  <Tab title="trusted">
    برای سندهای same-site که عمداً به امتیازهای قوی‌تری نیاز دارند، `allow-same-origin` را روی `allow-scripts` اضافه می‌کند.
  </Tab>
</Tabs>

مثال:

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
از `trusted` فقط وقتی استفاده کنید که سند embedشده واقعاً به رفتار same-origin نیاز دارد. برای بیشتر بازی‌های تولیدشده توسط agent و canvasهای تعاملی، `scripts` انتخاب امن‌تری است.
</Warning>

URLهای embed خارجی مطلق `http(s)` به‌طور پیش‌فرض مسدود می‌مانند. اگر عمداً می‌خواهید `[embed url="https://..."]` صفحه‌های third-party را بارگذاری کند، `gateway.controlUi.allowExternalEmbedUrls: true` را تنظیم کنید.

## عرض پیام چت

پیام‌های چت گروه‌بندی‌شده از یک max-width پیش‌فرض خوانا استفاده می‌کنند. استقرارهای دارای مانیتور عریض می‌توانند بدون patch کردن CSS بسته‌بندی‌شده، با تنظیم `gateway.controlUi.chatMessageMaxWidth` آن را override کنند:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

مقدار پیش از رسیدن به مرورگر اعتبارسنجی می‌شود. مقدارهای پشتیبانی‌شده شامل طول‌ها و درصدهای ساده مانند `960px` یا `82%`، به‌علاوه عبارت‌های عرض محدودشده `min(...)`، `max(...)`، `clamp(...)`، `calc(...)`، و `fit-content(...)` هستند.

## دسترسی tailnet (توصیه‌شده)

<Tabs>
  <Tab title="Tailscale Serve یکپارچه (ترجیحی)">
    Gateway را روی loopback نگه دارید و بگذارید Tailscale Serve آن را با HTTPS proxy کند:

    ```bash
    openclaw gateway --tailscale serve
    ```

    باز کنید:

    - `https://<magicdns>/` (یا `gateway.controlUi.basePath` پیکربندی‌شده شما)

    به‌طور پیش‌فرض، درخواست‌های سرویس‌دهی Control UI/WebSocket می‌توانند از طریق سرآیندهای هویت Tailscale (`tailscale-user-login`) احراز هویت شوند، زمانی که `gateway.auth.allowTailscale` برابر `true` باشد. OpenClaw هویت را با حل کردن نشانی `x-forwarded-for` از طریق `tailscale whois` و تطبیق آن با سرآیند بررسی می‌کند، و فقط زمانی این موارد را می‌پذیرد که درخواست از مسیر برگشتی محلی همراه با سرآیندهای `x-forwarded-*` مربوط به Tailscale وارد شود. برای نشست‌های اپراتور Control UI با هویت دستگاه مرورگر، این مسیر تأییدشده Serve همچنین رفت‌وبرگشت جفت‌سازی دستگاه را رد می‌کند؛ مرورگرهای بدون دستگاه و اتصال‌های دارای نقش گره همچنان بررسی‌های عادی دستگاه را دنبال می‌کنند. اگر می‌خواهید حتی برای ترافیک Serve هم اعتبارنامه‌های صریح راز مشترک لازم باشد، `gateway.auth.allowTailscale: false` را تنظیم کنید. سپس از `gateway.auth.mode: "token"` یا `"password"` استفاده کنید.

    برای آن مسیر ناهمگام هویت Serve، تلاش‌های ناموفق احراز هویت برای همان IP کلاینت و دامنه احراز هویت، پیش از نوشتن محدودیت نرخ، به‌صورت ترتیبی انجام می‌شوند. بنابراین تلاش‌های مجدد بد هم‌زمان از همان مرورگر می‌توانند در درخواست دوم به‌جای دو عدم‌تطابق ساده که به‌صورت موازی با هم رقابت می‌کنند، `retry later` نشان دهند.

    <Warning>
    احراز هویت Serve بدون توکن فرض می‌کند میزبان gateway قابل اعتماد است. اگر ممکن است کد محلی غیرقابل اعتماد روی آن میزبان اجرا شود، احراز هویت با توکن/رمز عبور را الزامی کنید.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    سپس باز کنید:

    - `http://<tailscale-ip>:18789/` (یا `gateway.controlUi.basePath` پیکربندی‌شده شما)

    راز مشترک منطبق را در تنظیمات رابط کاربری جای‌گذاری کنید (به‌صورت `connect.params.auth.token` یا `connect.params.auth.password` ارسال می‌شود).

  </Tab>
</Tabs>

## HTTP ناامن

اگر داشبورد را از طریق HTTP ساده (`http://<lan-ip>` یا `http://<tailscale-ip>`) باز کنید، مرورگر در یک **زمینه غیرامن** اجرا می‌شود و WebCrypto را مسدود می‌کند. به‌طور پیش‌فرض، OpenClaw اتصال‌های Control UI بدون هویت دستگاه را **مسدود** می‌کند.

استثناهای مستندشده:

- سازگاری HTTP ناامن فقط برای localhost با `gateway.controlUi.allowInsecureAuth=true`
- احراز هویت موفق اپراتور Control UI از طریق `gateway.auth.mode: "trusted-proxy"`
- گزینه اضطراری `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**راهکار پیشنهادی:** از HTTPS (Tailscale Serve) استفاده کنید یا رابط کاربری را به‌صورت محلی باز کنید:

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

    `allowInsecureAuth` فقط یک کلید سازگاری محلی است:

    - به نشست‌های localhost Control UI اجازه می‌دهد در زمینه‌های HTTP غیرامن بدون هویت دستگاه ادامه پیدا کنند.
    - بررسی‌های جفت‌سازی را دور نمی‌زند.
    - الزامات هویت دستگاه راه‌دور (غیر از localhost) را سست نمی‌کند.

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
    `dangerouslyDisableDeviceAuth` بررسی‌های هویت دستگاه Control UI را غیرفعال می‌کند و یک کاهش امنیتی شدید است. پس از استفاده اضطراری، سریعاً آن را برگردانید.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - احراز هویت موفق trusted-proxy می‌تواند نشست‌های Control UI مربوط به **اپراتور** را بدون هویت دستگاه بپذیرد.
    - این مورد به نشست‌های Control UI با نقش گره گسترش پیدا نمی‌کند.
    - پروکسی‌های معکوس loopback روی همان میزبان همچنان احراز هویت trusted-proxy را برآورده نمی‌کنند؛ [Trusted proxy auth](/fa/gateway/trusted-proxy-auth) را ببینید.

  </Accordion>
</AccordionGroup>

برای راهنمایی تنظیم HTTPS، [Tailscale](/fa/gateway/tailscale) را ببینید.

## سیاست امنیت محتوا

Control UI با یک سیاست سخت‌گیرانه `img-src` ارائه می‌شود: فقط دارایی‌های **هم‌مبدا**، نشانی‌های `data:` و نشانی‌های `blob:` تولیدشده به‌صورت محلی مجاز هستند. نشانی‌های تصویر راه‌دور `http(s)` و وابسته به پروتکل توسط مرورگر رد می‌شوند و هیچ دریافت شبکه‌ای انجام نمی‌دهند.

معنای عملی این موضوع:

- آواتارها و تصویرهایی که زیر مسیرهای نسبی ارائه می‌شوند (برای مثال `/avatars/<id>`) همچنان نمایش داده می‌شوند، از جمله مسیرهای آواتار احراز هویت‌شده که رابط کاربری آن‌ها را دریافت و به نشانی‌های محلی `blob:` تبدیل می‌کند.
- نشانی‌های درون‌خطی `data:image/...` همچنان نمایش داده می‌شوند (برای بارهای درون پروتکل مفید است).
- نشانی‌های محلی `blob:` که توسط Control UI ساخته می‌شوند همچنان نمایش داده می‌شوند.
- نشانی‌های آواتار راه‌دور که توسط فراداده کانال منتشر می‌شوند در کمک‌کننده‌های آواتار Control UI حذف و با لوگو/نشان داخلی جایگزین می‌شوند، بنابراین یک کانال نفوذی یا مخرب نمی‌تواند دریافت دلخواه تصویر راه‌دور را از مرورگر اپراتور تحمیل کند.

برای دریافت این رفتار لازم نیست چیزی را تغییر دهید — همیشه فعال است و قابل پیکربندی نیست.

## احراز هویت مسیر آواتار

وقتی احراز هویت gateway پیکربندی شده باشد، نقطه پایانی آواتار Control UI همان توکن gateway را مانند بقیه API لازم دارد:

- `GET /avatar/<agentId>` تصویر آواتار را فقط به فراخوان‌های احراز هویت‌شده برمی‌گرداند. `GET /avatar/<agentId>?meta=1` فراداده آواتار را تحت همان قاعده برمی‌گرداند.
- درخواست‌های احراز هویت‌نشده به هر یک از مسیرها رد می‌شوند (همانند مسیر هم‌خانواده assistant-media). این کار از نشت هویت عامل توسط مسیر آواتار روی میزبان‌هایی که در غیر این صورت محافظت شده‌اند جلوگیری می‌کند.
- خود Control UI هنگام دریافت آواتارها، توکن gateway را به‌صورت سرآیند bearer ارسال می‌کند و از نشانی‌های blob احراز هویت‌شده استفاده می‌کند تا تصویر همچنان در داشبوردها نمایش داده شود.

اگر احراز هویت gateway را غیرفعال کنید (روی میزبان‌های مشترک توصیه نمی‌شود)، مسیر آواتار نیز مطابق با بقیه gateway بدون احراز هویت می‌شود.

## احراز هویت مسیر رسانه دستیار

وقتی احراز هویت gateway پیکربندی شده باشد، پیش‌نمایش‌های رسانه محلی دستیار از یک مسیر دو مرحله‌ای استفاده می‌کنند:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` احراز هویت عادی اپراتور Control UI را لازم دارد. مرورگر هنگام بررسی دسترس‌پذیری، توکن gateway را به‌صورت سرآیند bearer ارسال می‌کند.
- پاسخ‌های فراداده موفق شامل یک `mediaTicket` کوتاه‌عمر هستند که فقط به همان مسیر منبع دقیق محدود شده است.
- نشانی‌های تصویر، صدا، ویدئو و سند که در مرورگر نمایش داده می‌شوند، به‌جای توکن یا رمز عبور فعال gateway، از `mediaTicket=<ticket>` استفاده می‌کنند. این بلیت سریع منقضی می‌شود و نمی‌تواند منبع متفاوتی را مجاز کند.

این کار نمایش عادی رسانه را با عناصر رسانه‌ای بومی مرورگر سازگار نگه می‌دارد، بدون اینکه اعتبارنامه‌های قابل استفاده مجدد gateway در نشانی‌های رسانه قابل مشاهده قرار بگیرند.

## ساخت رابط کاربری

Gateway فایل‌های ایستا را از `dist/control-ui` ارائه می‌کند. آن‌ها را با این دستور بسازید:

```bash
pnpm ui:build
```

مبنای مطلق اختیاری (وقتی نشانی‌های ثابت دارایی‌ها را می‌خواهید):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

برای توسعه محلی (سرور توسعه جداگانه):

```bash
pnpm ui:dev
```

سپس رابط کاربری را به نشانی WS مربوط به Gateway خود متصل کنید (مثلاً `ws://127.0.0.1:18789`).

## اشکال‌زدایی/آزمایش: سرور توسعه + Gateway راه‌دور

Control UI از فایل‌های ایستا تشکیل شده است؛ مقصد WebSocket قابل پیکربندی است و می‌تواند با مبدا HTTP متفاوت باشد. این زمانی مفید است که می‌خواهید سرور توسعه Vite محلی باشد اما Gateway جای دیگری اجرا شود.

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
    - اگر یک نقطه پایانی کامل `ws://` یا `wss://` را از طریق `gatewayUrl` ارسال می‌کنید، مقدار `gatewayUrl` را URL-encode کنید تا مرورگر رشته پرس‌وجو را درست تجزیه کند.
    - هر زمان ممکن است، `token` باید از طریق قطعه URL (`#token=...`) ارسال شود. قطعه‌ها به سرور فرستاده نمی‌شوند، که از نشت در گزارش درخواست و Referer جلوگیری می‌کند. پارامترهای پرس‌وجوی قدیمی `?token=` همچنان برای سازگاری یک‌بار وارد می‌شوند، اما فقط به‌عنوان جایگزین، و بلافاصله پس از راه‌اندازی اولیه حذف می‌شوند.
    - `password` فقط در حافظه نگه داشته می‌شود.
    - وقتی `gatewayUrl` تنظیم شده باشد، رابط کاربری به اعتبارنامه‌های پیکربندی یا محیط برنمی‌گردد. `token` (یا `password`) را صراحتاً ارائه کنید. نبود اعتبارنامه‌های صریح یک خطاست.
    - وقتی Gateway پشت TLS است (Tailscale Serve، پروکسی HTTPS و غیره)، از `wss://` استفاده کنید.
    - `gatewayUrl` فقط در پنجره سطح بالا پذیرفته می‌شود (نه به‌صورت جاسازی‌شده) تا از clickjacking جلوگیری شود.
    - استقرارهای Control UI غیر loopback باید `gateway.controlUi.allowedOrigins` را صراحتاً تنظیم کنند (مبداهای کامل). این شامل تنظیمات توسعه راه‌دور نیز می‌شود.
    - راه‌اندازی Gateway ممکن است مبداهای محلی مانند `http://localhost:<port>` و `http://127.0.0.1:<port>` را از bind و پورت مؤثر زمان اجرا مقداردهی اولیه کند، اما مبداهای مرورگر راه‌دور همچنان به ورودی‌های صریح نیاز دارند.
    - از `gateway.controlUi.allowedOrigins: ["*"]` استفاده نکنید، مگر برای آزمایش محلی کاملاً کنترل‌شده. معنای آن اجازه دادن به هر مبدا مرورگر است، نه «مطابقت با هر میزبانی که استفاده می‌کنم».
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` حالت fallback مبدا بر اساس سرآیند Host را فعال می‌کند، اما این یک حالت امنیتی خطرناک است.

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

جزئیات تنظیم دسترسی راه‌دور: [دسترسی راه‌دور](/fa/gateway/remote).

## مرتبط

- [داشبورد](/fa/web/dashboard) — داشبورد gateway
- [بررسی‌های سلامت](/fa/gateway/health) — پایش سلامت gateway
- [TUI](/fa/web/tui) — رابط کاربری ترمینال
- [WebChat](/fa/web/webchat) — رابط چت مبتنی بر مرورگر
