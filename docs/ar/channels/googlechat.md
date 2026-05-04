---
read_when:
    - العمل على ميزات قناة Google Chat
summary: حالة دعم تطبيق Google Chat وإمكاناته وتكوينه
title: Google Chat
x-i18n:
    generated_at: "2026-05-04T02:21:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: afa2ca4d9673396aa24a55ca5855a34ad26a4640c3a1f6928dbf7246e403cb04
    source_path: channels/googlechat.md
    workflow: 16
---

الحالة: Plugin قابل للتنزيل للرسائل المباشرة والمساحات عبر webhooks الخاصة بواجهة Google Chat API (HTTP فقط).

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
   - فعّل واجهة API إذا لم تكن مفعّلة بالفعل.
2. أنشئ **حساب خدمة**:
   - اضغط **Create Credentials** > **Service Account**.
   - سمّه كما تريد (مثلًا: `openclaw-chat`).
   - اترك الأذونات فارغة (اضغط **Continue**).
   - اترك الأطراف الرئيسية التي لديها وصول فارغة (اضغط **Done**).
3. أنشئ **مفتاح JSON** ونزّله:
   - في قائمة حسابات الخدمة، انقر الحساب الذي أنشأته للتو.
   - انتقل إلى تبويب **Keys**.
   - انقر **Add Key** > **Create new key**.
   - اختر **JSON** واضغط **Create**.
4. خزّن ملف JSON الذي تم تنزيله على مضيف Gateway لديك (مثلًا: `~/.openclaw/googlechat-service-account.json`).
5. أنشئ تطبيق Google Chat في [تكوين Chat في Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - املأ **معلومات التطبيق**:
     - **اسم التطبيق**: (مثلًا `OpenClaw`)
     - **رابط الصورة الرمزية**: (مثلًا `https://openclaw.ai/logo.png`)
     - **الوصف**: (مثلًا `Personal AI Assistant`)
   - فعّل **الميزات التفاعلية**.
   - ضمن **الوظائف**، حدّد **الانضمام إلى المساحات والمحادثات الجماعية**.
   - ضمن **إعدادات الاتصال**، اختر **رابط نقطة نهاية HTTP**.
   - ضمن **المشغّلات**، اختر **استخدام رابط نقطة نهاية HTTP مشتركة لجميع المشغّلات** واضبطه على الرابط العام لـ Gateway لديك متبوعًا بـ `/googlechat`.
     - _نصيحة: شغّل `openclaw status` للعثور على الرابط العام لـ Gateway لديك._
   - ضمن **الرؤية**، حدّد **إتاحة تطبيق Chat هذا لأشخاص ومجموعات محددين في `<Your Domain>`**.
   - أدخل عنوان بريدك الإلكتروني (مثلًا `user@example.com`) في مربع النص.
   - انقر **Save** في الأسفل.
6. **فعّل حالة التطبيق**:
   - بعد الحفظ، **حدّث الصفحة**.
   - ابحث عن قسم **حالة التطبيق** (عادةً يكون قرب الأعلى أو الأسفل بعد الحفظ).
   - غيّر الحالة إلى **Live - available to users**.
   - انقر **Save** مرة أخرى.
7. كوّن OpenClaw بمسار حساب الخدمة + جمهور Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - أو التكوين: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. اضبط نوع جمهور Webhook وقيمته (بما يطابق تكوين تطبيق Chat لديك).
9. ابدأ Gateway. سيرسل Google Chat طلبات POST إلى مسار Webhook لديك.

## الإضافة إلى Google Chat

بعد تشغيل Gateway وإضافة بريدك الإلكتروني إلى قائمة الرؤية:

1. انتقل إلى [Google Chat](https://chat.google.com/).
2. انقر أيقونة **+** (زائد) بجانب **Direct Messages**.
3. في شريط البحث (حيث تضيف الأشخاص عادةً)، اكتب **اسم التطبيق** الذي كوّنته في Google Cloud Console.
   - **ملاحظة**: لن يظهر البوت في قائمة تصفح "Marketplace" لأنه تطبيق خاص. يجب أن تبحث عنه بالاسم.
4. اختر البوت من النتائج.
5. انقر **Add** أو **Chat** لبدء محادثة فردية.
6. أرسل "Hello" لتشغيل المساعد!

## الرابط العام (Webhook فقط)

تتطلب webhooks الخاصة بـ Google Chat نقطة نهاية HTTPS عامة. للأمان، **اكشف مسار `/googlechat` فقط** للإنترنت. أبقِ لوحة تحكم OpenClaw ونقاط النهاية الحساسة الأخرى على شبكتك الخاصة.

### الخيار أ: Tailscale Funnel (موصى به)

استخدم Tailscale Serve للوحة التحكم الخاصة وFunnel لمسار Webhook العام. هذا يُبقي `/` خاصًا مع كشف `/googlechat` فقط.

1. **تحقق من العنوان الذي يرتبط به Gateway لديك:**

   ```bash
   ss -tlnp | grep 18789
   ```

   لاحظ عنوان IP (مثلًا `127.0.0.1` أو `0.0.0.0` أو عنوان Tailscale IP الخاص بك مثل `100.x.x.x`).

2. **اكشف لوحة التحكم للـ tailnet فقط (المنفذ 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **اكشف مسار Webhook فقط للعامة:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **فوّض العقدة للوصول إلى Funnel:**
   إذا طُلب منك ذلك، فزر رابط التفويض الظاهر في المخرجات لتمكين Funnel لهذه العقدة في سياسة tailnet لديك.

5. **تحقق من التكوين:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

سيكون رابط Webhook العام لديك:
`https://<node-name>.<tailnet>.ts.net/googlechat`

تبقى لوحة التحكم الخاصة بك مقصورة على tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

استخدم الرابط العام (بدون `:8443`) في تكوين تطبيق Google Chat.

> ملاحظة: يستمر هذا التكوين بعد إعادة التشغيل. لإزالته لاحقًا، شغّل `tailscale funnel reset` و `tailscale serve reset`.

### الخيار ب: وكيل عكسي (Caddy)

إذا كنت تستخدم وكيلًا عكسيًا مثل Caddy، فمرّر المسار المحدد فقط:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

بهذا التكوين، سيتم تجاهل أي طلب إلى `your-domain.com/` أو إرجاع 404، بينما يتم توجيه `your-domain.com/googlechat` بأمان إلى OpenClaw.

### الخيار ج: Cloudflare Tunnel

كوّن قواعد الدخول للنفق لديك لتوجيه مسار Webhook فقط:

- **المسار**: `/googlechat` -> `http://localhost:18789/googlechat`
- **القاعدة الافتراضية**: HTTP 404 (Not Found)

## آلية العمل

1. يرسل Google Chat طلبات POST الخاصة بـ Webhook إلى Gateway. يتضمن كل طلب ترويسة `Authorization: Bearer <token>`.
   - يتحقق OpenClaw من مصادقة bearer قبل قراءة/تحليل أجسام Webhook الكاملة عند وجود الترويسة.
   - يتم دعم طلبات Google Workspace Add-on التي تحمل `authorizationEventObject.systemIdToken` في الجسم عبر ميزانية جسم أكثر صرامة قبل المصادقة.
2. يتحقق OpenClaw من الرمز مقابل `audienceType` + `audience` المكوّنين:
   - `audienceType: "app-url"` → الجمهور هو رابط HTTPS الخاص بـ Webhook لديك.
   - `audienceType: "project-number"` → الجمهور هو رقم مشروع Cloud.
3. يتم توجيه الرسائل حسب المساحة:
   - تستخدم الرسائل المباشرة مفتاح الجلسة `agent:<agentId>:googlechat:direct:<spaceId>`.
   - تستخدم المساحات مفتاح الجلسة `agent:<agentId>:googlechat:group:<spaceId>`.
4. يكون الوصول إلى الرسائل المباشرة عبر الاقتران افتراضيًا. يتلقى المرسلون غير المعروفين رمز اقتران؛ وافق عليه باستخدام:
   - `openclaw pairing approve googlechat <code>`
5. تتطلب المساحات الجماعية إشارة @ افتراضيًا. استخدم `botUser` إذا كان اكتشاف الإشارة يحتاج اسم مستخدم التطبيق.

## الأهداف

استخدم هذه المعرّفات للتسليم وقوائم السماح:

- الرسائل المباشرة: `users/<userId>` (موصى به).
- البريد الإلكتروني الخام `name@example.com` قابل للتغيير ويُستخدم فقط لمطابقة قائمة السماح المباشرة عندما تكون `channels.googlechat.dangerouslyAllowNameMatching: true`.
- مهمل: يتم التعامل مع `users/<email>` كمعرّف مستخدم، وليس قائمة سماح بريد إلكتروني.
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
          enabled: true,
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

- يمكن أيضًا تمرير بيانات اعتماد حساب الخدمة مضمّنة باستخدام `serviceAccount` (سلسلة JSON).
- يتم دعم `serviceAccountRef` أيضًا (env/file SecretRef)، بما في ذلك المراجع لكل حساب ضمن `channels.googlechat.accounts.<id>.serviceAccountRef`.
- مسار Webhook الافتراضي هو `/googlechat` إذا لم يتم ضبط `webhookPath`.
- يعيد `dangerouslyAllowNameMatching` تمكين مطابقة أطراف البريد الإلكتروني القابلة للتغيير لقوائم السماح (وضع توافق للطوارئ).
- تتوفر التفاعلات عبر أداة `reactions` و`channels action` عند تمكين `actions.reactions`.
- تكشف إجراءات الرسائل `send` للنص و`upload-file` لإرسال المرفقات الصريح. يقبل `upload-file` قيمة `media` / `filePath` / `path` بالإضافة إلى `message` و`filename` اختياريين واستهداف سلسلة النقاش.
- يدعم `typingIndicator` القيم `none` و`message` (الافتراضية) و`reaction` (يتطلب التفاعل OAuth للمستخدم).
- يتم تنزيل المرفقات عبر Chat API وتخزينها في مسار الوسائط (مع حد حجم يحدده `mediaMaxMb`).

تفاصيل مرجع الأسرار: [إدارة الأسرار](/ar/gateway/secrets).

## استكشاف الأخطاء وإصلاحها

### 405 الطريقة غير مسموح بها

إذا أظهر Google Cloud Logs Explorer أخطاء مثل:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

فهذا يعني أن معالج Webhook غير مسجّل. الأسباب الشائعة:

1. **القناة غير مكوّنة**: قسم `channels.googlechat` مفقود من تكوينك. تحقق باستخدام:

   ```bash
   openclaw config get channels.googlechat
   ```

   إذا أعاد "Config path not found"، فأضف التكوين (راجع [أبرز إعدادات التكوين](#config-highlights)).

2. **Plugin غير مفعّل**: تحقق من حالة Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   إذا أظهر "disabled"، فأضف `plugins.entries.googlechat.enabled: true` إلى تكوينك.

3. **لم تتم إعادة تشغيل Gateway**: بعد إضافة التكوين، أعد تشغيل Gateway:

   ```bash
   openclaw gateway restart
   ```

تحقق من أن القناة تعمل:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### مشكلات أخرى

- تحقق من `openclaw channels status --probe` لاكتشاف أخطاء المصادقة أو تكوين الجمهور المفقود.
- إذا لم تصل أي رسائل، فتأكد من رابط Webhook الخاص بتطبيق Chat + اشتراكات الأحداث.
- إذا منع تقييد الإشارة الردود، فاضبط `botUser` على اسم مورد مستخدم التطبيق وتحقق من `requireMention`.
- استخدم `openclaw logs --follow` أثناء إرسال رسالة اختبار لمعرفة ما إذا كانت الطلبات تصل إلى Gateway.

مستندات ذات صلة:

- [تكوين Gateway](/ar/gateway/configuration)
- [الأمان](/ar/gateway/security)
- [التفاعلات](/ar/tools/reactions)

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
