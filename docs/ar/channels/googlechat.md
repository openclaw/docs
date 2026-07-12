---
read_when:
    - العمل على ميزات قناة Google Chat
summary: حالة دعم تطبيق Google Chat وإمكاناته وإعداده
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T05:32:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

يعمل Google Chat بوصفه Plugin الرسمي `@openclaw/googlechat`: الرسائل المباشرة والمساحات عبر Webhook ‏Google Chat API (نقطة نهاية HTTP فقط، دون Pub/Sub).

## التثبيت

```bash
openclaw plugins install @openclaw/googlechat
```

نسخة العمل المحلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## الإعداد السريع (للمبتدئين)

1. أنشئ مشروع Google Cloud وفعّل **Google Chat API**.
   - انتقل إلى: [بيانات اعتماد Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - فعّل API إذا لم يكن مفعّلًا بالفعل.
2. أنشئ **Service Account**:
   - اضغط **Create Credentials** > **Service Account**.
   - سمّه بأي اسم تريده (مثلًا، `openclaw-chat`).
   - اترك الأذونات والكيانات الرئيسية فارغة (**Continue**، ثم **Done**).
3. أنشئ **مفتاح JSON** ونزّله:
   - انقر على حساب الخدمة الجديد > علامة تبويب **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. خزّن ملف JSON المنزّل على مضيف Gateway لديك (مثلًا، `~/.openclaw/googlechat-service-account.json`).
5. أنشئ تطبيق Google Chat في [إعدادات Chat ضمن Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - املأ **Application info** (اسم التطبيق، وعنوان URL للصورة الرمزية، والوصف).
   - فعّل **Interactive features**.
   - ضمن **Functionality**، حدّد **Join spaces and group conversations**.
   - ضمن **Connection settings**، اختر **HTTP endpoint URL**.
   - ضمن **Triggers**، اختر **Use a common HTTP endpoint URL for all triggers** واضبطه على عنوان URL العام لـ Gateway متبوعًا بـ `/googlechat` (راجع [عنوان URL العام](#public-url-webhook-only)).
   - ضمن **Visibility**، حدّد **Make this Chat app available to specific people and groups in `<Your Domain>`** وأدخل عنوان بريدك الإلكتروني.
   - انقر على **Save**.
6. فعّل حالة التطبيق: حدّث الصفحة، وابحث عن **App status**، واضبطها على **Live - available to users**، ثم انقر على **Save** مجددًا.
7. اضبط OpenClaw باستخدام حساب الخدمة وجمهور Webhook (يجب أن يتطابق مع إعداد تطبيق Chat):
   - متغير البيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (للحساب الافتراضي فقط)، أو
   - الإعداد: راجع [أبرز الإعدادات](#config-highlights). يقبل `openclaw channels add --channel googlechat` أيضًا الخيارات `--audience-type` و`--audience` و`--webhook-path` و`--webhook-url`.
8. شغّل Gateway. سيرسل Google Chat طلبات POST إلى مسار Webhook لديك (الافتراضي `/googlechat`).

## الإضافة إلى Google Chat

بمجرد تشغيل Gateway وإدراج بريدك الإلكتروني في قائمة الظهور:

1. انتقل إلى [Google Chat](https://chat.google.com/).
2. انقر على أيقونة **+** (علامة الجمع) بجوار **Direct Messages**.
3. ابحث عن **App name** الذي ضبطته في Google Cloud Console.
   - لا يظهر البوت في قائمة تصفح Marketplace لأنه تطبيق خاص؛ ابحث عنه بالاسم.
4. اختر البوت، وانقر على **Add** أو **Chat**، ثم أرسل رسالة.

## عنوان URL العام (Webhook فقط)

تتطلب Webhook الخاصة بـ Google Chat نقطة نهاية HTTPS عامة. وللحفاظ على الأمان، اكشف **مسار `/googlechat` فقط** للإنترنت، وأبقِ لوحة معلومات OpenClaw ونقاط النهاية الأخرى خاصة.

### الخيار أ: ‏Tailscale Funnel (موصى به)

استخدم Tailscale Serve للوحة المعلومات الخاصة وFunnel لمسار Webhook العام.

1. تحقّق من العنوان الذي يرتبط به Gateway:

   ```bash
   ss -tlnp | grep 18789
   ```

   دوّن عنوان IP (مثلًا، `127.0.0.1` أو `0.0.0.0` أو عنوان Tailscale بصيغة `100.x.x.x`).

2. اكشف لوحة المعلومات لشبكة tailnet فقط (المنفذ 8443):

   ```bash
   # إذا كان مرتبطًا بالمضيف المحلي (127.0.0.1 أو 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # إذا كان مرتبطًا بعنوان IP لـ Tailscale فقط:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. اكشف مسار Webhook فقط للعامة:

   ```bash
   # إذا كان مرتبطًا بالمضيف المحلي (127.0.0.1 أو 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # إذا كان مرتبطًا بعنوان IP لـ Tailscale فقط:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. إذا طُلب منك ذلك، فانتقل إلى عنوان URL الخاص بالتخويل الظاهر في المخرجات لتمكين Funnel لهذه العقدة.

5. تحقّق:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

عنوان Webhook العام لديك هو `https://<node-name>.<tailnet>.ts.net/googlechat`؛ وتظل لوحة المعلومات مقتصرة على tailnet على العنوان `https://<node-name>.<tailnet>.ts.net:8443/`. استخدم عنوان URL العام (من دون `:8443`) في إعداد تطبيق Google Chat.

> ملاحظة: يستمر هذا الإعداد بعد إعادة التشغيل. أزله لاحقًا باستخدام `tailscale funnel reset` و`tailscale serve reset`.

### الخيار ب: الوكيل العكسي (Caddy)

مرّر مسار Webhook فقط عبر الوكيل:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

تُتجاهل الطلبات إلى `your-domain.com/` أو تعيد 404، بينما تُوجّه الطلبات إلى `your-domain.com/googlechat` نحو OpenClaw.

### الخيار ج: ‏Cloudflare Tunnel

اضبط قواعد إدخال النفق لتوجيه مسار Webhook فقط:

- **المسار**: `/googlechat` -> `http://localhost:18789/googlechat`
- **القاعدة الافتراضية**: HTTP 404 (غير موجود)

## آلية العمل

1. يرسل Google Chat بيانات JSON عبر POST إلى مسار Webhook الخاص بـ Gateway (طلبات POST فقط، ونوع محتوى JSON مطلوب، مع تقييد المعدل لكل عنوان IP).
2. يصادق OpenClaw على كل طلب قبل تمريره:
   - تحمل أحداث تطبيق Chat الترويسة `Authorization: Bearer <token>`؛ ويجري التحقق من الرمز المميز قبل تحليل النص الكامل للطلب.
   - تحمل أحداث إضافات Google Workspace الرمز المميز داخل النص (`authorizationEventObject.systemIdToken`) وتُقرأ ضمن ميزانية أشد صرامة قبل المصادقة (16 كيلوبايت، و3 ثوانٍ) قبل التحقق.
3. يُفحص الرمز المميز مقابل `audienceType` + `audience`:
   - `audienceType: "app-url"` ← الجمهور هو عنوان HTTPS الخاص بـ Webhook.
   - `audienceType: "project-number"` ← الجمهور هو رقم مشروع Cloud.
   - تتطلب رموز الإضافات ضمن `app-url` أيضًا ضبط `appPrincipal` على معرّف عميل OAuth 2.0 الرقمي للتطبيق (21 رقمًا، وليس عنوان بريد إلكتروني)؛ وإلا يفشل التحقق مع تسجيل تحذير.
4. تُوجّه الرسائل حسب المساحة:
   - تحصل المساحات على جلسات مستقلة لكل مساحة `agent:<agentId>:googlechat:group:<spaceId>`؛ وتُرسل الردود إلى سلسلة الرسالة.
   - تُدمج الرسائل المباشرة افتراضيًا في الجلسة الرئيسية للوكيل؛ اضبط `session.dmScope` للحصول على جلسات رسائل مباشرة مستقلة لكل نظير (راجع [الجلسة](/ar/concepts/session)).
5. يعتمد الوصول عبر الرسائل المباشرة على الاقتران افتراضيًا. يتلقى المرسلون غير المعروفين رمز اقتران؛ وافق عليه باستخدام:
   - `openclaw pairing approve googlechat <code>`
6. تتطلب المساحات الجماعية إشارة @ افتراضيًا. تُكتشف الإشارات من تعليقات Chat التوضيحية من نوع `USER_MENTION` التي تستهدف التطبيق؛ اضبط `botUser` (مثلًا، `users/1234567890`) إذا احتاج الاكتشاف إلى اسم مورد المستخدم الخاص بالتطبيق.
7. عند بدء موافقة على تنفيذ أمر أو Plugin من Google Chat مع ضبط مُعتمِد ثابت بصيغة `users/<id>`، ينشر OpenClaw بطاقة موافقة أصلية (`cardsV2`) في المساحة أو السلسلة الأصلية. تحمل أزرار البطاقة رموز استدعاء مبهمة؛ ولا تظهر مطالبة `/approve <id> <decision>` اليدوية إلا عندما يتعذر التسليم الأصلي.

## الوجهات

استخدم هذه المعرّفات للتسليم وقوائم السماح:

- الرسائل المباشرة: `users/<userId>` (موصى به).
- المساحات: `spaces/<spaceId>`.
- عنوان البريد الإلكتروني الخام `name@example.com` قابل للتغيير، ولا يُستخدم لمطابقة قائمة السماح إلا عندما تكون `channels.googlechat.dangerouslyAllowNameMatching: true`.
- مهمل: تُعامل `users/<email>` بوصفها معرّف مستخدم، لا إدخال بريد إلكتروني في قائمة السماح.
- تُقبل البادئات `googlechat:` و`google-chat:` و`gchat:` وتُزال.

## أبرز الإعدادات

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // add-on verification only; numeric OAuth client ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

ملاحظات:

- بيانات اعتماد حساب الخدمة: `serviceAccountFile` (مسار)، أو `serviceAccount` (سلسلة JSON مضمنة أو كائن)، أو `serviceAccountRef` ‏(SecretRef لمتغير بيئة/ملف). ينطبق متغيرا البيئة `GOOGLE_CHAT_SERVICE_ACCOUNT` ‏(JSON مضمن) و`GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (مسار) على الحساب الافتراضي فقط. تستخدم إعدادات الحسابات المتعددة `channels.googlechat.accounts.<id>` مع المفاتيح نفسها، بما فيها `serviceAccountRef` لكل حساب.
- مسار Webhook الافتراضي هو `/googlechat` عند عدم ضبط `webhookPath`؛ ويمكن لـ`webhookUrl` توفير المسار بدلًا منه.
- يجب أن تكون مفاتيح المجموعات معرّفات مساحات ثابتة (`spaces/<spaceId>`). مفاتيح أسماء العرض مهملة ويجري تسجيلها على هذا الأساس.
- يعيد `dangerouslyAllowNameMatching` تمكين مطابقة كيان البريد الإلكتروني القابل للتغيير لقوائم السماح (وضع توافق للطوارئ)؛ ويحذّر الطبيب من إدخالات البريد الإلكتروني.
- إجراءات تفاعلات Google Chat غير مكشوفة. يستخدم Plugin مصادقة حساب الخدمة، بينما تتطلب نقاط نهاية تفاعلات Google Chat مصادقة المستخدم. يُقبل إعداد `actions.reactions` الحالي للتوافق، لكنه بلا تأثير.
- تستخدم بطاقات الموافقة الأصلية نقرات أزرار Google Chat ‏`cardsV2`، لا أحداث التفاعل. يأتي المعتمدون من `dm.allowFrom` أو `defaultTo`، ويجب أن تكون قيمهم رقمية ثابتة بصيغة `users/<id>`.
- لا تكشف إجراءات الرسائل سوى الإجراء النصي `send`. يتطلب رفع مرفقات Google Chat مصادقة المستخدم، بينما يستخدم هذا Plugin مصادقة حساب الخدمة، لذلك لا يُكشف رفع الملفات الصادرة.
- `typingIndicator`: تنشر القيمة `message` (الافتراضية) عنصرًا نائبًا `_<Bot> is typing..._` وتعدّله ليصبح الرد الأول؛ وتعطّله القيمة `none`؛ أما `reaction` فتتطلب OAuth للمستخدم وترجع حاليًا إلى `message` مع تسجيل خطأ عند استخدام مصادقة حساب الخدمة.
- تُنزّل المرفقات الواردة (أول مرفق في كل رسالة) عبر Chat API إلى مسار معالجة الوسائط، مع حد أقصى تحدده `mediaMaxMb` (الافتراضي 20).
- تُتجاهل الرسائل التي ينشئها البوت افتراضيًا. مع `allowBots: true`، تستخدم رسائل البوت المقبولة [الحماية المشتركة من حلقات البوت](/ar/channels/bot-loop-protection): اضبط `channels.defaults.botLoopProtection`، ثم تجاوزها باستخدام `channels.googlechat.botLoopProtection` أو `channels.googlechat.groups.<space>.botLoopProtection`.

تفاصيل مراجع الأسرار: [إدارة الأسرار](/ar/gateway/secrets).

## استكشاف الأخطاء وإصلاحها

### 405 الطريقة غير مسموح بها

إذا عرض Google Cloud Logs Explorer أخطاء مثل:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

فإن معالج Webhook غير مسجّل. الأسباب الشائعة:

1. **القناة غير مضبوطة**: قسم `channels.googlechat` مفقود. تحقّق باستخدام:

   ```bash
   openclaw config get channels.googlechat
   ```

   إذا أعاد "Config path not found"، فأضف الإعداد (راجع [أبرز الإعدادات](#config-highlights)).

2. **Plugin غير مفعّل**: تحقّق من حالة Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   إذا ظهر "disabled"، فأضف `plugins.entries.googlechat.enabled: true` إلى إعدادك.

3. **لم يُعَد تشغيل Gateway** بعد تغييرات الإعداد:

   ```bash
   openclaw gateway restart
   ```

تحقّق من أن القناة تعمل:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### مشكلات أخرى

- يعرض `openclaw channels status --probe` أخطاء المصادقة وإعداد الجمهور المفقود (كل من `audience` و`audienceType` مطلوب).
- إذا لم تصل أي رسائل، فتحقّق من عنوان Webhook وإعداد المشغّل في تطبيق Chat.
- إذا منع اشتراط الإشارة الردود، فاضبط `botUser` على اسم مورد المستخدم الخاص بالتطبيق وتحقّق من `requireMention`.
- يُظهر `openclaw logs --follow` أثناء إرسال رسالة اختبار ما إذا كانت الطلبات تصل إلى Gateway.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [إعداد Gateway](/ar/gateway/configuration)
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية والتحكم في الإشارات
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة ومسار الاقتران
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
