---
read_when:
    - جارٍ العمل على ميزات قناة Google Chat
summary: حالة دعم تطبيق Google Chat وإمكاناته وتكوينه
title: Google Chat
x-i18n:
    generated_at: "2026-06-27T17:09:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

الحالة: Plugin قابل للتنزيل للرسائل المباشرة والمساحات عبر Webhooks الخاصة بـ Google Chat API (HTTP فقط).

## التثبيت

ثبّت Google Chat قبل تهيئة القناة:

```bash
openclaw plugins install @openclaw/googlechat
```

نسخة محلية من المستودع (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## الإعداد السريع (للمبتدئين)

1. أنشئ مشروع Google Cloud وفعّل **Google Chat API**.
   - انتقل إلى: [بيانات اعتماد Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - فعّل API إذا لم يكن مفعّلًا بالفعل.
2. أنشئ **حساب خدمة**:
   - اضغط **Create Credentials** > **Service Account**.
   - سمّه بأي اسم تريده (مثلًا، `openclaw-chat`).
   - اترك الأذونات فارغة (اضغط **Continue**).
   - اترك الجهات الرئيسية ذات الوصول فارغة (اضغط **Done**).
3. أنشئ **مفتاح JSON** ونزّله:
   - في قائمة حسابات الخدمة، انقر الحساب الذي أنشأته للتو.
   - انتقل إلى تبويب **Keys**.
   - انقر **Add Key** > **Create new key**.
   - اختر **JSON** واضغط **Create**.
4. خزّن ملف JSON الذي نزّلته على مضيف Gateway لديك (مثلًا، `~/.openclaw/googlechat-service-account.json`).
5. أنشئ تطبيق Google Chat في [تهيئة Chat في Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - املأ **معلومات التطبيق**:
     - **اسم التطبيق**: (مثلًا `OpenClaw`)
     - **رابط الصورة الرمزية**: (مثلًا `https://openclaw.ai/logo.png`)
     - **الوصف**: (مثلًا `Personal AI Assistant`)
   - فعّل **الميزات التفاعلية**.
   - ضمن **الوظائف**، حدّد **الانضمام إلى المساحات والمحادثات الجماعية**.
   - ضمن **إعدادات الاتصال**، اختر **رابط نقطة نهاية HTTP**.
   - ضمن **المشغّلات**، اختر **استخدام رابط نقطة نهاية HTTP مشتركة لكل المشغّلات** واضبطه على رابط Gateway العام لديك متبوعًا بـ `/googlechat`.
     - _نصيحة: شغّل `openclaw status` للعثور على رابط Gateway العام لديك._
   - ضمن **الرؤية**، حدّد **إتاحة تطبيق Chat هذا لأشخاص ومجموعات محددة في `<Your Domain>`**.
   - أدخل عنوان بريدك الإلكتروني (مثلًا `user@example.com`) في مربع النص.
   - انقر **Save** في الأسفل.
6. **فعّل حالة التطبيق**:
   - بعد الحفظ، **حدّث الصفحة**.
   - ابحث عن قسم **حالة التطبيق** (عادةً قرب الأعلى أو الأسفل بعد الحفظ).
   - غيّر الحالة إلى **Live - available to users**.
   - انقر **Save** مرة أخرى.
7. هيّئ OpenClaw بمسار حساب الخدمة + جمهور Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - أو config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. اضبط نوع جمهور Webhook وقيمته (بما يطابق تهيئة تطبيق Chat لديك).
9. ابدأ Gateway. سيرسل Google Chat طلبات POST إلى مسار Webhook لديك.

## الإضافة إلى Google Chat

بعد تشغيل Gateway وإضافة بريدك الإلكتروني إلى قائمة الرؤية:

1. انتقل إلى [Google Chat](https://chat.google.com/).
2. انقر أيقونة **+** (زائد) بجانب **Direct Messages**.
3. في شريط البحث (حيث تضيف الأشخاص عادةً)، اكتب **اسم التطبيق** الذي هيّأته في Google Cloud Console.
   - **ملاحظة**: لن يظهر البوت في قائمة تصفح "Marketplace" لأنه تطبيق خاص. يجب أن تبحث عنه بالاسم.
4. اختر البوت من النتائج.
5. انقر **Add** أو **Chat** لبدء محادثة فردية.
6. أرسل "مرحبًا" لتشغيل المساعد!

## الرابط العام (Webhook فقط)

تتطلب Webhooks الخاصة بـ Google Chat نقطة نهاية HTTPS عامة. للأمان، **اكشف مسار `/googlechat` فقط** للإنترنت. أبقِ لوحة معلومات OpenClaw ونقاط النهاية الحساسة الأخرى على شبكتك الخاصة.

### الخيار أ: Tailscale Funnel (موصى به)

استخدم Tailscale Serve للوحة المعلومات الخاصة وFunnel لمسار Webhook العام. هذا يُبقي `/` خاصًا مع كشف `/googlechat` فقط.

1. **تحقّق من العنوان الذي يرتبط به Gateway لديك:**

   ```bash
   ss -tlnp | grep 18789
   ```

   لاحظ عنوان IP (مثلًا، `127.0.0.1` أو `0.0.0.0` أو عنوان Tailscale IP لديك مثل `100.x.x.x`).

2. **اكشف لوحة المعلومات للـ tailnet فقط (المنفذ 8443):**

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

4. **صرّح للعقدة بالوصول إلى Funnel:**
   إذا طُلب منك ذلك، افتح رابط التفويض المعروض في المخرجات لتمكين Funnel لهذه العقدة في سياسة tailnet لديك.

5. **تحقّق من التهيئة:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

سيكون رابط Webhook العام لديك:
`https://<node-name>.<tailnet>.ts.net/googlechat`

تبقى لوحة معلوماتك الخاصة محصورة على tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

استخدم الرابط العام (من دون `:8443`) في تهيئة تطبيق Google Chat.

> ملاحظة: تستمر هذه التهيئة بعد إعادة التشغيل. لإزالتها لاحقًا، شغّل `tailscale funnel reset` و`tailscale serve reset`.

### الخيار ب: وكيل عكسي (Caddy)

إذا كنت تستخدم وكيلًا عكسيًا مثل Caddy، فمرّر المسار المحدد فقط عبر الوكيل:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

بهذه التهيئة، سيتم تجاهل أي طلب إلى `your-domain.com/` أو إرجاعه كـ 404، بينما يتم توجيه `your-domain.com/googlechat` بأمان إلى OpenClaw.

### الخيار ج: Cloudflare Tunnel

هيّئ قواعد ingress للنفق لديك بحيث لا توجّه إلا مسار Webhook:

- **المسار**: `/googlechat` -> `http://localhost:18789/googlechat`
- **القاعدة الافتراضية**: HTTP 404 (غير موجود)

## آلية العمل

1. يرسل Google Chat طلبات Webhook POST إلى Gateway. يتضمن كل طلب ترويسة `Authorization: Bearer <token>`.
   - يتحقق OpenClaw من مصادقة bearer قبل قراءة/تحليل أجسام Webhook الكاملة عندما تكون الترويسة موجودة.
   - تُدعَم طلبات Google Workspace Add-on التي تحمل `authorizationEventObject.systemIdToken` في الجسم عبر ميزانية جسم أكثر صرامة قبل المصادقة.
2. يتحقق OpenClaw من الرمز مقابل `audienceType` + `audience` المهيّئين:
   - `audienceType: "app-url"` → الجمهور هو رابط HTTPS الخاص بـ Webhook لديك.
   - `audienceType: "project-number"` → الجمهور هو رقم مشروع Cloud.
3. تُوجَّه الرسائل حسب المساحة:
   - تستخدم الرسائل المباشرة مفتاح الجلسة `agent:<agentId>:googlechat:direct:<spaceId>`.
   - تستخدم المساحات مفتاح الجلسة `agent:<agentId>:googlechat:group:<spaceId>`.
4. يكون وصول الرسائل المباشرة بالاقتران افتراضيًا. يتلقى المرسلون غير المعروفين رمز اقتران؛ وافق عليه باستخدام:
   - `openclaw pairing approve googlechat <code>`
5. تتطلب المساحات الجماعية @-mention افتراضيًا. استخدم `botUser` إذا كان اكتشاف الإشارة يحتاج إلى اسم مستخدم التطبيق.
6. عندما يبدأ طلب موافقة exec أو Plugin من Google Chat ويكون موافِق ثابت من نوع `users/<id>` مهيّأ، ينشر OpenClaw بطاقة موافقة أصلية من Google Chat في المساحة أو السلسلة الأصلية. تستخدم أزرار البطاقة رموز callback مبهمة، ولا تظهر مطالبة `/approve <id> <decision>` اليدوية إلا عندما لا يكون تسليم الموافقة الأصلي متاحًا.

## الأهداف

استخدم هذه المعرّفات للتسليم وقوائم السماح:

- الرسائل المباشرة: `users/<userId>` (موصى به).
- البريد الإلكتروني الخام `name@example.com` قابل للتغيير ولا يُستخدم إلا لمطابقة قائمة السماح المباشرة عندما يكون `channels.googlechat.dangerouslyAllowNameMatching: true`.
- مهمل: يُعامَل `users/<email>` كمعرّف مستخدم، وليس كقائمة سماح للبريد الإلكتروني.
- المساحات: `spaces/<spaceId>`.

## أبرز نقاط التهيئة

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
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

ملاحظات:

- يمكن أيضًا تمرير بيانات اعتماد حساب الخدمة مباشرةً باستخدام `serviceAccount` (سلسلة JSON).
- `serviceAccountRef` مدعوم أيضًا (env/file SecretRef)، بما في ذلك المراجع لكل حساب ضمن `channels.googlechat.accounts.<id>.serviceAccountRef`.
- مسار Webhook الافتراضي هو `/googlechat` إذا لم يُضبط `webhookPath`.
- يعيد `dangerouslyAllowNameMatching` تمكين مطابقة هوية البريد الإلكتروني القابلة للتغيير لقوائم السماح (وضع توافق لكسر الزجاج).
- تتوفر التفاعلات عبر أداة `reactions` و`channels action` عندما يكون `actions.reactions` مفعّلًا.
- تستخدم بطاقات الموافقة الأصلية نقرات أزرار `cardsV2` في Google Chat، وليس أحداث التفاعل. يأتي الموافقون من `dm.allowFrom` أو `defaultTo` ويجب أن يكونوا قيم `users/<id>` رقمية ثابتة.
- تكشف إجراءات الرسائل `send` للنص و`upload-file` لإرسال المرفقات صراحةً. يقبل `upload-file` القيم `media` / `filePath` / `path` بالإضافة إلى `message` و`filename` واستهداف السلسلة اختياريًا.
- يدعم `typingIndicator` القيم `message` (افتراضي)، و`none`، و`reaction` (يتطلب التفاعل OAuth للمستخدم).
- تُنزّل المرفقات عبر Chat API وتُخزّن في خط وسائط المعالجة (مع حد للحجم يحدده `mediaMaxMb`).
- تُتجاهل رسائل Google Chat التي يكتبها البوت افتراضيًا. إذا ضبطت `allowBots: true` عن قصد، فستستخدم رسائل البوت المقبولة [الحماية من حلقة البوت](/ar/channels/bot-loop-protection) المشتركة. هيّئ `channels.defaults.botLoopProtection`، ثم تجاوزها باستخدام `channels.googlechat.botLoopProtection` أو `channels.googlechat.groups.<space>.botLoopProtection` عندما تحتاج مساحة واحدة إلى ميزانية مختلفة.

تفاصيل مراجع الأسرار: [إدارة الأسرار](/ar/gateway/secrets).

## استكشاف الأخطاء وإصلاحها

### 405 Method Not Allowed

إذا عرض Google Cloud Logs Explorer أخطاء مثل:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

فهذا يعني أن معالج Webhook غير مسجّل. الأسباب الشائعة:

1. **القناة غير مهيّأة**: قسم `channels.googlechat` مفقود من التهيئة لديك. تحقّق باستخدام:

   ```bash
   openclaw config get channels.googlechat
   ```

   إذا أعاد "Config path not found"، فأضف التهيئة (راجع [أبرز نقاط التهيئة](#config-highlights)).

2. **Plugin غير مفعّل**: تحقّق من حالة Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   إذا عرض "disabled"، فأضف `plugins.entries.googlechat.enabled: true` إلى التهيئة لديك.

3. **لم يُعد تشغيل Gateway**: بعد إضافة التهيئة، أعد تشغيل Gateway:

   ```bash
   openclaw gateway restart
   ```

تحقّق من أن القناة تعمل:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### مشكلات أخرى

- افحص `openclaw channels status --probe` بحثًا عن أخطاء المصادقة أو تهيئة الجمهور المفقودة.
- إذا لم تصل أي رسائل، فتأكد من رابط Webhook الخاص بتطبيق Chat + اشتراكات الأحداث.
- إذا منعت بوابة الإشارات الردود، فاضبط `botUser` على اسم مورد مستخدم التطبيق وتحقق من `requireMention`.
- استخدم `openclaw logs --follow` أثناء إرسال رسالة اختبار لمعرفة ما إذا كانت الطلبات تصل إلى Gateway.

وثائق ذات صلة:

- [تهيئة Gateway](/ar/gateway/configuration)
- [الأمان](/ar/gateway/security)
- [التفاعلات](/ar/tools/reactions)

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية
