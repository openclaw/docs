---
read_when:
    - العمل على ميزات قناة Google Chat
summary: حالة دعم تطبيق Google Chat وإمكاناته وإعداده
title: Google Chat
x-i18n:
    generated_at: "2026-04-24T07:29:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 15
---

الحالة: جاهز للرسائل المباشرة + المساحات عبر Webhook الخاصة بـ Google Chat API (‏HTTP فقط).

## إعداد سريع (للمبتدئين)

1. أنشئ مشروع Google Cloud وفعّل **Google Chat API**.
   - انتقل إلى: [بيانات اعتماد Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - فعّل API إذا لم تكن مفعّلة بالفعل.
2. أنشئ **Service Account**:
   - اضغط **Create Credentials** > **Service Account**.
   - سمّه بأي اسم تريده (مثلًا: `openclaw-chat`).
   - اترك الأذونات فارغة (اضغط **Continue**).
   - اترك الجهات التي لديها وصول فارغة (اضغط **Done**).
3. أنشئ **مفتاح JSON** ونزّله:
   - في قائمة حسابات الخدمة، انقر على الحساب الذي أنشأته للتو.
   - انتقل إلى تبويب **Keys**.
   - انقر **Add Key** > **Create new key**.
   - اختر **JSON** واضغط **Create**.
4. خزّن ملف JSON الذي تم تنزيله على مضيف البوابة لديك (مثلًا: `~/.openclaw/googlechat-service-account.json`).
5. أنشئ تطبيق Google Chat في [إعدادات Chat في Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - املأ **معلومات التطبيق**:
     - **App name**: (مثلًا `OpenClaw`)
     - **Avatar URL**: (مثلًا `https://openclaw.ai/logo.png`)
     - **Description**: (مثلًا `Personal AI Assistant`)
   - فعّل **Interactive features**.
   - ضمن **Functionality**، حدّد **Join spaces and group conversations**.
   - ضمن **Connection settings**، اختر **HTTP endpoint URL**.
   - ضمن **Triggers**، اختر **Use a common HTTP endpoint URL for all triggers** واضبطه على عنوان URL العام لبوابتك متبوعًا بـ `/googlechat`.
     - _نصيحة: شغّل `openclaw status` للعثور على عنوان URL العام لبوابتك._
   - ضمن **Visibility**، حدّد **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - أدخل عنوان بريدك الإلكتروني (مثلًا `user@example.com`) في مربع النص.
   - انقر **Save** في الأسفل.
6. **فعّل حالة التطبيق**:
   - بعد الحفظ، **حدّث الصفحة**.
   - ابحث عن قسم **App status** (عادةً بالقرب من الأعلى أو الأسفل بعد الحفظ).
   - غيّر الحالة إلى **Live - available to users**.
   - انقر **Save** مرة أخرى.
7. اضبط OpenClaw باستخدام مسار حساب الخدمة + جمهور Webhook:
   - متغير بيئة: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - أو في الإعدادات: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. اضبط نوع جمهور Webhook وقيمته (بحيث يطابق إعداد تطبيق Chat لديك).
9. ابدأ Gateway. سيرسل Google Chat طلبات POST إلى مسار Webhook لديك.

## الإضافة إلى Google Chat

بمجرد تشغيل البوابة وإضافة بريدك الإلكتروني إلى قائمة الظهور:

1. انتقل إلى [Google Chat](https://chat.google.com/).
2. انقر أيقونة **+** (زائد) بجانب **Direct Messages**.
3. في شريط البحث (حيث تضيف الأشخاص عادةً)، اكتب **اسم التطبيق** الذي ضبطته في Google Cloud Console.
   - **ملاحظة**: لن يظهر الروبوت في قائمة تصفح "Marketplace" لأنه تطبيق خاص. يجب البحث عنه بالاسم.
4. اختر الروبوت من النتائج.
5. انقر **Add** أو **Chat** لبدء محادثة فردية.
6. أرسل "Hello" لتشغيل المساعد!

## عنوان URL عام (Webhook فقط)

تتطلب Webhook الخاصة بـ Google Chat نقطة نهاية HTTPS عامة. للأمان، **عرّض فقط المسار `/googlechat`** للإنترنت. أبقِ لوحة تحكم OpenClaw ونقاط النهاية الحساسة الأخرى على شبكتك الخاصة.

### الخيار A: ‏Tailscale Funnel (مستحسن)

استخدم Tailscale Serve للوحة التحكم الخاصة وFunnel لمسار Webhook العام. بهذا يبقى `/` خاصًا مع تعريض `/googlechat` فقط.

1. **تحقق من العنوان الذي ترتبط به البوابة:**

   ```bash
   ss -tlnp | grep 18789
   ```

   دوّن عنوان IP (مثلًا `127.0.0.1` أو `0.0.0.0` أو عنوان Tailscale لديك مثل `100.x.x.x`).

2. **عرّض لوحة التحكم إلى tailnet فقط (المنفذ 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **عرّض فقط مسار Webhook علنًا:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **اسمح للعقدة بالوصول إلى Funnel:**
   إذا طُلب منك ذلك، فزر عنوان URL الخاص بالتفويض الظاهر في الناتج لتمكين Funnel لهذه العقدة ضمن سياسة tailnet لديك.

5. **تحقق من الإعداد:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

سيكون عنوان URL العام لـ Webhook لديك:
`https://<node-name>.<tailnet>.ts.net/googlechat`

وستبقى لوحة التحكم الخاصة بك ضمن tailnet فقط:
`https://<node-name>.<tailnet>.ts.net:8443/`

استخدم عنوان URL العام (من دون `:8443`) في إعداد تطبيق Google Chat.

> ملاحظة: يستمر هذا الإعداد بعد إعادة التشغيل. لإزالته لاحقًا، شغّل `tailscale funnel reset` و`tailscale serve reset`.

### الخيار B: وكيل عكسي (Caddy)

إذا كنت تستخدم وكيلاً عكسيًا مثل Caddy، فقم بتمرير المسار المحدد فقط:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

باستخدام هذا الإعداد، سيتم تجاهل أي طلب إلى `your-domain.com/` أو ستتم إعادته كخطأ 404، بينما سيتم توجيه `your-domain.com/googlechat` بأمان إلى OpenClaw.

### الخيار C: ‏Cloudflare Tunnel

اضبط قواعد ingress الخاصة بالنفق لديك لتوجيه مسار Webhook فقط:

- **المسار**: `/googlechat` -> `http://localhost:18789/googlechat`
- **القاعدة الافتراضية**: HTTP 404 (غير موجود)

## كيف يعمل

1. يرسل Google Chat طلبات POST الخاصة بـ Webhook إلى Gateway. يتضمن كل طلب ترويسة `Authorization: Bearer <token>`.
   - يتحقق OpenClaw من مصادقة bearer قبل قراءة/تحليل أجسام Webhook الكاملة عندما تكون الترويسة موجودة.
   - يتم دعم طلبات Google Workspace Add-on التي تحمل `authorizationEventObject.systemIdToken` في الجسم عبر ميزانية جسم أكثر صرامة قبل المصادقة.
2. يتحقق OpenClaw من الرمز المميز وفق `audienceType` و`audience` المهيأين:
   - `audienceType: "app-url"` ← يكون الجمهور هو عنوان HTTPS الخاص بـ Webhook لديك.
   - `audienceType: "project-number"` ← يكون الجمهور هو رقم مشروع Cloud.
3. يتم توجيه الرسائل حسب المساحة:
   - تستخدم الرسائل المباشرة مفتاح الجلسة `agent:<agentId>:googlechat:direct:<spaceId>`.
   - تستخدم المساحات مفتاح الجلسة `agent:<agentId>:googlechat:group:<spaceId>`.
4. يكون الوصول إلى الرسائل المباشرة بالاقتران افتراضيًا. يتلقى المرسلون غير المعروفين رمز اقتران؛ وافق عليه باستخدام:
   - `openclaw pairing approve googlechat <code>`
5. تتطلب مساحات المجموعات الإشارة بـ @ افتراضيًا. استخدم `botUser` إذا كان اكتشاف الإشارة يحتاج إلى اسم مستخدم التطبيق.

## الأهداف

استخدم هذه المعرّفات للإرسال وقوائم السماح:

- الرسائل المباشرة: `users/<userId>` (مستحسن).
- البريد الإلكتروني الخام `name@example.com` قابل للتغيير ولا يُستخدم إلا لمطابقة قائمة السماح المباشرة عندما تكون `channels.googlechat.dangerouslyAllowNameMatching: true`.
- مهمل: يتم التعامل مع `users/<email>` على أنه معرّف مستخدم، وليس إدخال قائمة سماح للبريد الإلكتروني.
- المساحات: `spaces/<spaceId>`.

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

- يمكن أيضًا تمرير بيانات اعتماد حساب الخدمة مباشرةً باستخدام `serviceAccount` (سلسلة JSON).
- كما أن `serviceAccountRef` مدعوم أيضًا (‏SecretRef من env/file)، بما في ذلك المراجع الخاصة بكل حساب ضمن `channels.googlechat.accounts.<id>.serviceAccountRef`.
- مسار Webhook الافتراضي هو `/googlechat` إذا لم يتم ضبط `webhookPath`.
- يعيد `dangerouslyAllowNameMatching` تفعيل مطابقة عناوين البريد الإلكتروني القابلة للتغيير في قوائم السماح (وضع توافق للطوارئ).
- التفاعلات متاحة عبر أداة `reactions` و`channels action` عند تفعيل `actions.reactions`.
- تعرض إجراءات الرسائل `send` للنصوص و`upload-file` لإرسال المرفقات صراحةً. يقبل `upload-file` القيم `media` / `filePath` / `path` بالإضافة إلى `message` و`filename` واختيار سلسلة الرسائل عند الحاجة.
- يدعم `typingIndicator` القيم `none` و`message` (الافتراضي) و`reaction` (يتطلب reaction استخدام OAuth للمستخدم).
- يتم تنزيل المرفقات عبر Chat API وتخزينها في مسار الوسائط (مع حد للحجم عبر `mediaMaxMb`).

تفاصيل مراجع الأسرار: [إدارة الأسرار](/ar/gateway/secrets).

## استكشاف الأخطاء وإصلاحها

### 405 Method Not Allowed

إذا أظهر Google Cloud Logs Explorer أخطاء مثل:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

فهذا يعني أن معالج Webhook غير مسجّل. الأسباب الشائعة:

1. **القناة غير مهيأة**: قسم `channels.googlechat` مفقود من إعداداتك. تحقق باستخدام:

   ```bash
   openclaw config get channels.googlechat
   ```

   إذا أعاد "Config path not found"، فأضف الإعدادات (راجع [أبرز الإعدادات](#config-highlights)).

2. **Plugin غير مفعّل**: تحقق من حالة Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   إذا أظهر "disabled"، فأضف `plugins.entries.googlechat.enabled: true` إلى إعداداتك.

3. **لم تتم إعادة تشغيل Gateway**: بعد إضافة الإعدادات، أعد تشغيل Gateway:

   ```bash
   openclaw gateway restart
   ```

تحقق من أن القناة تعمل:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### مشكلات أخرى

- تحقّق من `openclaw channels status --probe` لرؤية أخطاء المصادقة أو غياب إعدادات الجمهور.
- إذا لم تصل أي رسائل، فتأكد من عنوان URL الخاص بـ Webhook في تطبيق Chat واشتراكات الأحداث.
- إذا كانت بوابة الإشارات تمنع الردود، فاضبط `botUser` على اسم مورد مستخدم التطبيق وتحقق من `requireMention`.
- استخدم `openclaw logs --follow` أثناء إرسال رسالة اختبار لمعرفة ما إذا كانت الطلبات تصل إلى Gateway.

الوثائق ذات الصلة:

- [إعداد Gateway](/ar/gateway/configuration)
- [الأمان](/ar/gateway/security)
- [التفاعلات](/ar/tools/reactions)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
