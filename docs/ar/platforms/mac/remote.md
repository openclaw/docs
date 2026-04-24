---
read_when:
    - إعداد التحكم البعيد على mac أو تصحيح أخطائه
summary: تدفق تطبيق macOS للتحكم في OpenClaw gateway بعيدة عبر SSH
title: التحكم عن بُعد
x-i18n:
    generated_at: "2026-04-24T07:52:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw البعيد (macOS ⇄ مضيف بعيد)

يتيح هذا التدفق لتطبيق macOS أن يعمل كوسيلة تحكم عن بُعد كاملة لـ OpenClaw gateway تعمل على مضيف آخر (سطح مكتب/خادم). وهي ميزة التطبيق **Remote over SSH** ‏(التشغيل البعيد). وتعيد جميع الميزات—فحوصات السلامة، وتمرير Voice Wake، وWeb Chat—استخدام تهيئة SSH البعيدة نفسها من _Settings → General_.

## الأوضاع

- **محلي (هذا الـ Mac)**: كل شيء يعمل على الحاسوب المحمول. ولا يوجد SSH.
- **بعيد عبر SSH (الافتراضي)**: تُنفَّذ أوامر OpenClaw على المضيف البعيد. ويفتح تطبيق mac اتصال SSH باستخدام `-o BatchMode` بالإضافة إلى الهوية/المفتاح الذي اخترته وتمرير منفذ محلي.
- **بعيد مباشر (ws/wss)**: لا يوجد نفق SSH. يتصل تطبيق mac بعنوان URL الخاص بـ gateway مباشرةً (مثلًا عبر Tailscale Serve أو reverse proxy عامة عبر HTTPS).

## وسائل النقل البعيدة

يدعم الوضع البعيد وسيلتي نقل:

- **نفق SSH** ‏(الافتراضي): يستخدم `ssh -N -L ...` لتمرير منفذ gateway إلى localhost. وسترى gateway عنوان IP الخاص بـ node على أنه `127.0.0.1` لأن النفق يعتمد على loopback.
- **مباشر (ws/wss)**: يتصل مباشرةً بعنوان URL الخاص بـ gateway. وترى gateway عنوان IP الحقيقي للعميل.

## المتطلبات المسبقة على المضيف البعيد

1. ثبّت Node + pnpm وابنِ/ثبّت OpenClaw CLI ‏(`pnpm install && pnpm build && pnpm link --global`).
2. تأكد من أن `openclaw` موجودة على PATH بالنسبة إلى shells غير التفاعلية (ضع symlink داخل `/usr/local/bin` أو `/opt/homebrew/bin` إذا لزم الأمر).
3. افتح SSH مع مصادقة بالمفتاح. ونحن نوصي باستخدام عناوين IP الخاصة بـ **Tailscale** من أجل وصول مستقر خارج LAN.

## إعداد تطبيق macOS

1. افتح _Settings → General_.
2. تحت **OpenClaw runs**, اختر **Remote over SSH** واضبط:
   - **Transport**: ‏**SSH tunnel** أو **Direct (ws/wss)**.
   - **SSH target**: ‏`user@host` ‏(اختياري `:port`).
     - إذا كانت gateway على LAN نفسها وتعلن Bonjour, فاخترها من القائمة المكتشفة لملء هذا الحقل تلقائيًا.
   - **Gateway URL** ‏(للنمط Direct فقط): ‏`wss://gateway.example.ts.net` ‏(أو `ws://...` للوصول المحلي/LAN).
   - **Identity file** ‏(متقدم): المسار إلى مفتاحك.
   - **Project root** ‏(متقدم): مسار checkout البعيد المستخدم للأوامر.
   - **CLI path** ‏(متقدم): مسار اختياري إلى entrypoint/binary قابلة للتشغيل لـ `openclaw` ‏(يُملأ تلقائيًا عند الإعلان عنه).
3. اضغط **Test remote**. ويعني النجاح أن `openclaw status --json` تعمل بشكل صحيح على المضيف البعيد. وتعني الإخفاقات عادةً وجود مشكلات في PATH/CLI؛ أما الخروج 127 فيعني أن CLI غير موجودة على المضيف البعيد.
4. ستعمل الآن فحوصات السلامة وWeb Chat عبر نفق SSH هذا تلقائيًا.

## Web Chat

- **نفق SSH**: تتصل Web Chat بـ gateway عبر منفذ تحكم WebSocket المُمرَّر (الافتراضي 18789).
- **مباشر (ws/wss)**: تتصل Web Chat مباشرةً بعنوان URL المهيأ للـ gateway.
- لم يعد هناك خادم HTTP منفصل لـ WebChat بعد الآن.

## الأذونات

- يحتاج المضيف البعيد إلى أذونات TCC نفسها مثل الوضع المحلي (Automation, وAccessibility, وScreen Recording, وMicrophone, وSpeech Recognition, وNotifications). شغّل الإعداد الأولي على ذلك الجهاز لمنحها مرة واحدة.
- تعلن Nodes عن حالة الأذونات الخاصة بها عبر `node.list` / `node.describe` حتى تعرف الوكلاء ما هو متاح.

## ملاحظات أمنية

- فضّل loopback binds على المضيف البعيد واتصل عبر SSH أو Tailscale.
- يستخدم تمرير SSH تحققًا صارمًا من مفتاح المضيف؛ فثق أولًا بمفتاح المضيف حتى يوجد في `~/.ssh/known_hosts`.
- إذا قمت بربط Gateway بواجهة غير loopback, فاطلب مصادقة Gateway صالحة: token أو كلمة مرور أو reverse proxy مدرك للهوية مع `gateway.auth.mode: "trusted-proxy"`.
- راجع [الأمان](/ar/gateway/security) و[Tailscale](/ar/gateway/tailscale).

## تدفق تسجيل دخول WhatsApp ‏(بعيد)

- شغّل `openclaw channels login --verbose` **على المضيف البعيد**. ثم امسح رمز QR باستخدام WhatsApp على هاتفك.
- أعد تشغيل تسجيل الدخول على ذلك المضيف إذا انتهت صلاحية المصادقة. وسيُظهر فحص السلامة مشكلات الربط.

## استكشاف الأخطاء وإصلاحها

- **الخروج 127 / غير موجود**: ‏`openclaw` غير موجودة على PATH الخاصة بـ shells غير login. أضفها إلى `/etc/paths`, أو shell rc الخاصة بك، أو ضع symlink داخل `/usr/local/bin`/`/opt/homebrew/bin`.
- **فشل مجس السلامة**: تحقق من إمكانية الوصول عبر SSH, ومن PATH, ومن أن Baileys قد سجل الدخول (`openclaw status --json`).
- **تعليق Web Chat**: تأكد من أن gateway تعمل على المضيف البعيد وأن المنفذ المُمرَّر يطابق منفذ WS الخاص بـ gateway; إذ تتطلب الواجهة اتصال WS سليمًا.
- **يظهر عنوان IP الخاص بـ Node على أنه 127.0.0.1**: هذا متوقع مع نفق SSH. بدّل **Transport** إلى **Direct (ws/wss)** إذا كنت تريد أن ترى gateway عنوان IP الحقيقي للعميل.
- **Voice Wake**: تُمرَّر عبارات التحفيز تلقائيًا في الوضع البعيد؛ ولا حاجة إلى forwarder منفصل.

## أصوات الإشعارات

اختر الأصوات لكل إشعار من البرامج النصية باستخدام `openclaw` و`node.invoke`, مثلًا:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

لم يعد هناك مفتاح “صوت افتراضي” عام في التطبيق؛ إذ يختار المستدعون صوتًا (أو لا شيء) لكل طلب.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [الوصول البعيد](/ar/gateway/remote)
