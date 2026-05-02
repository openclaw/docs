---
read_when:
    - العمل على ميزات قناة Google Chat
summary: حالة دعم تطبيق Google Chat وإمكاناته وتكوينه
title: Google Chat
x-i18n:
    generated_at: "2026-05-02T07:17:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdb8dcf651602e92801d7107646d853871ea6cef188a8733a831695a1243740e
    source_path: channels/googlechat.md
    workflow: 16
---

الحالة: Plugin قابل للتنزيل للرسائل المباشرة + المساحات عبر Webhooks الخاصة بواجهة Google Chat API (HTTP فقط).

## التثبيت

ثبّت Google Chat قبل تكوين القناة:

```bash
openclaw plugins install @openclaw/googlechat
```

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## الإعداد السريع (للمبتدئين)

1. أنشئ مشروع Google Cloud وفعّل **Google Chat API**.
   - انتقل إلى: [بيانات اعتماد Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - فعّل API إذا لم تكن مفعّلة بالفعل.
2. أنشئ **حساب خدمة**:
   - اضغط **إنشاء بيانات اعتماد** > **حساب خدمة**.
   - سمّه بأي اسم تريده (مثل `openclaw-chat`).
   - اترك الأذونات فارغة (اضغط **متابعة**).
   - اترك أصحاب الوصول فارغين (اضغط **تم**).
3. أنشئ **مفتاح JSON** ونزّله:
   - في قائمة حسابات الخدمة، انقر الحساب الذي أنشأته للتو.
   - انتقل إلى تبويب **المفاتيح**.
   - انقر **إضافة مفتاح** > **إنشاء مفتاح جديد**.
   - اختر **JSON** واضغط **إنشاء**.
4. خزّن ملف JSON الذي تم تنزيله على مضيف Gateway لديك (مثل `~/.openclaw/googlechat-service-account.json`).
5. أنشئ تطبيق Google Chat في [تكوين Chat في Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - املأ **معلومات التطبيق**:
     - **اسم التطبيق**: (مثل `OpenClaw`)
     - **رابط الصورة الرمزية**: (مثل `https://openclaw.ai/logo.png`)
     - **الوصف**: (مثل `Personal AI Assistant`)
   - فعّل **الميزات التفاعلية**.
   - ضمن **الوظائف**، حدّد **الانضمام إلى المساحات ومحادثات المجموعات**.
   - ضمن **إعدادات الاتصال**، اختر **رابط نقطة نهاية HTTP**.
   - ضمن **المشغّلات**، اختر **استخدام رابط نقطة نهاية HTTP مشتركة لكل المشغّلات** واضبطه على الرابط العام الخاص بـ Gateway متبوعًا بـ `/googlechat`.
     - _تلميح: شغّل `openclaw status` للعثور على الرابط العام الخاص بـ Gateway لديك._
   - ضمن **الرؤية**، حدّد **إتاحة تطبيق Chat هذا لأشخاص ومجموعات محددين في `<Your Domain>`**.
   - أدخل عنوان بريدك الإلكتروني (مثل `user@example.com`) في مربع النص.
   - انقر **حفظ** في الأسفل.
6. **فعّل حالة التطبيق**:
   - بعد الحفظ، **حدّث الصفحة**.
   - ابحث عن قسم **حالة التطبيق** (عادةً قرب الأعلى أو الأسفل بعد الحفظ).
   - غيّر الحالة إلى **مباشر - متاح للمستخدمين**.
   - انقر **حفظ** مرة أخرى.
7. كوّن OpenClaw باستخدام مسار حساب الخدمة + جمهور Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - أو config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. اضبط نوع جمهور Webhook + قيمته (بما يطابق تكوين تطبيق Chat لديك).
9. ابدأ Gateway. سيرسل Google Chat طلب POST إلى مسار Webhook لديك.

## الإضافة إلى Google Chat

بعد تشغيل Gateway وإضافة بريدك الإلكتروني إلى قائمة الرؤية:

1. انتقل إلى [Google Chat](https://chat.google.com/).
2. انقر أيقونة **+** (زائد) بجانب **الرسائل المباشرة**.
3. في شريط البحث (حيث تضيف الأشخاص عادةً)، اكتب **اسم التطبيق** الذي كوّنته في Google Cloud Console.
   - **ملاحظة**: لن يظهر البوت في قائمة تصفح "Marketplace" لأنه تطبيق خاص. يجب البحث عنه بالاسم.
4. اختر البوت من النتائج.
5. انقر **إضافة** أو **دردشة** لبدء محادثة 1:1.
6. أرسل "Hello" لتشغيل المساعد!

## الرابط العام (Webhook فقط)

تتطلب Webhooks الخاصة بـ Google Chat نقطة نهاية HTTPS عامة. للأمان، **اعرض مسار `/googlechat` فقط** على الإنترنت. أبقِ لوحة معلومات OpenClaw ونقاط النهاية الحساسة الأخرى على شبكتك الخاصة.

### الخيار A: Tailscale Funnel (موصى به)

استخدم Tailscale Serve للوحة المعلومات الخاصة وFunnel لمسار Webhook العام. هذا يبقي `/` خاصًا مع عرض `/googlechat` فقط.

1. **تحقق من العنوان الذي يرتبط به Gateway لديك:**

   ```bash
   ss -tlnp | grep 18789
   ```

   لاحظ عنوان IP (مثل `127.0.0.1` أو `0.0.0.0` أو عنوان Tailscale IP لديك مثل `100.x.x.x`).

2. **اعرض لوحة المعلومات على tailnet فقط (المنفذ 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **اعرض مسار Webhook فقط للعامة:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **خوّل Node للوصول إلى Funnel:**
   إذا طُلب منك ذلك، زر رابط التفويض الظاهر في المخرجات لتمكين Funnel لهذا Node في سياسة tailnet لديك.

5. **تحقق من التكوين:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

سيكون رابط Webhook العام لديك:
`https://<node-name>.<tailnet>.ts.net/googlechat`

تبقى لوحة معلوماتك الخاصة مقتصرة على tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

استخدم الرابط العام (بدون `:8443`) في تكوين تطبيق Google Chat.

> ملاحظة: يستمر هذا التكوين عبر عمليات إعادة التشغيل. لإزالته لاحقًا، شغّل `tailscale funnel reset` و`tailscale serve reset`.

### الخيار B: وكيل عكسي (Caddy)

إذا كنت تستخدم وكيلاً عكسيًا مثل Caddy، فمرّر المسار المحدد فقط عبر الوكيل:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

مع هذا التكوين، سيتم تجاهل أي طلب إلى `your-domain.com/` أو إرجاع 404، بينما يتم توجيه `your-domain.com/googlechat` بأمان إلى OpenClaw.

### الخيار C: Cloudflare Tunnel

كوّن قواعد ingress للنفق لديك لتوجيه مسار Webhook فقط:

- **المسار**: `/googlechat` -> `http://localhost:18789/googlechat`
- **القاعدة الافتراضية**: HTTP 404 (غير موجود)

## كيف يعمل

1. يرسل Google Chat طلبات POST الخاصة بـ Webhook إلى Gateway. يتضمن كل طلب ترويسة `Authorization: Bearer <token>`.
   - يتحقق OpenClaw من مصادقة bearer قبل قراءة/تحليل أجسام Webhook الكاملة عند وجود الترويسة.
   - تُدعم طلبات Google Workspace Add-on التي تحمل `authorizationEventObject.systemIdToken` في الجسم عبر ميزانية جسم أكثر صرامة قبل المصادقة.
2. يتحقق OpenClaw من الرمز مقابل `audienceType` + `audience` المكوّنين:
   - `audienceType: "app-url"` → الجمهور هو رابط Webhook عبر HTTPS لديك.
   - `audienceType: "project-number"` → الجمهور هو رقم مشروع Cloud.
3. تُوجّه الرسائل حسب المساحة:
   - تستخدم الرسائل المباشرة مفتاح الجلسة `agent:<agentId>:googlechat:direct:<spaceId>`.
   - تستخدم المساحات مفتاح الجلسة `agent:<agentId>:googlechat:group:<spaceId>`.
4. يكون الوصول عبر الرسائل المباشرة بالمزاوجة افتراضيًا. يتلقى المرسلون غير المعروفين رمز مزاوجة؛ وافق باستخدام:
   - `openclaw pairing approve googlechat <code>`
5. تتطلب مساحات المجموعات إشارة @ افتراضيًا. استخدم `botUser` إذا احتاج اكتشاف الإشارات إلى اسم مستخدم التطبيق.

## الأهداف

استخدم هذه المعرّفات للتسليم وقوائم السماح:

- الرسائل المباشرة: `users/<userId>` (موصى به).
- البريد الإلكتروني الخام `name@example.com` قابل للتغيير ويُستخدم فقط لمطابقة قائمة السماح المباشرة عندما يكون `channels.googlechat.dangerouslyAllowNameMatching: true`.
- مهمل: يُعامل `users/<email>` كمعرّف مستخدم، وليس كقائمة سماح للبريد الإلكتروني.
- المساحات: `spaces/<spaceId>`.

## أبرز إعدادات التكوين

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

ملاحظات:

- يمكن أيضًا تمرير بيانات اعتماد حساب الخدمة ضمنيًا باستخدام `serviceAccount` (سلسلة JSON).
- `serviceAccountRef` مدعوم أيضًا (env/file SecretRef)، بما في ذلك المراجع لكل حساب ضمن `channels.googlechat.accounts.<id>.serviceAccountRef`.
- مسار Webhook الافتراضي هو `/googlechat` إذا لم يُضبط `webhookPath`.
- يعيد `dangerouslyAllowNameMatching` تمكين مطابقة أصحاب البريد الإلكتروني القابلين للتغيير لقوائم السماح (وضع توافق لكسر القفل).
- تتوفر التفاعلات عبر أداة `reactions` و`channels action` عند تمكين `actions.reactions`.
- تعرض إجراءات الرسائل `send` للنص و`upload-file` لعمليات إرسال المرفقات الصريحة. يقبل `upload-file` القيم `media` / `filePath` / `path` إضافةً إلى `message` و`filename` الاختياريين واستهداف السلسلة.
- يدعم `typingIndicator` القيم `none` و`message` (الافتراضي) و`reaction` (يتطلب reaction OAuth للمستخدم).
- تُنزّل المرفقات عبر Chat API وتُخزّن في مسار الوسائط (مع حد للحجم بواسطة `mediaMaxMb`).

تفاصيل مراجع الأسرار: [إدارة الأسرار](/ar/gateway/secrets).

## استكشاف الأخطاء وإصلاحها

### 405 الطريقة غير مسموح بها

إذا أظهر Google Cloud Logs Explorer أخطاء مثل:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

فهذا يعني أن معالج Webhook غير مسجل. الأسباب الشائعة:

1. **القناة غير مكوّنة**: قسم `channels.googlechat` مفقود من التكوين لديك. تحقق باستخدام:

   ```bash
   openclaw config get channels.googlechat
   ```

   إذا أعاد "Config path not found"، فأضف التكوين (انظر [أبرز إعدادات التكوين](#config-highlights)).

2. **Plugin غير مفعّل**: تحقق من حالة Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   إذا أظهر "disabled"، فأضف `plugins.entries.googlechat.enabled: true` إلى التكوين لديك.

3. **لم تتم إعادة تشغيل Gateway**: بعد إضافة التكوين، أعد تشغيل Gateway:

   ```bash
   openclaw gateway restart
   ```

تحقق من أن القناة قيد التشغيل:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### مشكلات أخرى

- تحقق من `openclaw channels status --probe` لأخطاء المصادقة أو تكوين الجمهور المفقود.
- إذا لم تصل أي رسائل، فتأكد من رابط Webhook الخاص بتطبيق Chat + اشتراكات الأحداث.
- إذا منع شرط الإشارة الردود، فاضبط `botUser` على اسم مورد مستخدم التطبيق وتحقق من `requireMention`.
- استخدم `openclaw logs --follow` أثناء إرسال رسالة اختبار لمعرفة ما إذا كانت الطلبات تصل إلى Gateway.

مستندات ذات صلة:

- [تكوين Gateway](/ar/gateway/configuration)
- [الأمان](/ar/gateway/security)
- [التفاعلات](/ar/tools/reactions)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [المزاوجة](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق المزاوجة
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وشرط الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
