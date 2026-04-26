---
read_when:
    - إعداد أو تصحيح التحكم البعيد على Mac
summary: تدفق تطبيق macOS للتحكم في OpenClaw gateway بعيد عبر SSH
title: التحكم عن بُعد
x-i18n:
    generated_at: "2026-04-26T11:35:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw البعيد (macOS ⇄ مضيف بعيد)

يتيح هذا التدفق لتطبيق macOS أن يعمل كوحدة تحكم كاملة عن بُعد لـ OpenClaw gateway تعمل على مضيف آخر (سطح مكتب/خادم). وهذه هي ميزة التطبيق **Remote over SSH** ‏(التشغيل البعيد). كل الميزات — فحوصات السلامة، وتمرير Voice Wake، وWeb Chat — تعيد استخدام إعداد SSH البعيد نفسه من _Settings → General_.

## الأوضاع

- **محلي (هذا الـ Mac)**: كل شيء يعمل على الحاسوب المحمول. ولا يوجد SSH.
- **Remote over SSH (افتراضي)**: يتم تنفيذ أوامر OpenClaw على المضيف البعيد. يفتح تطبيق Mac اتصال SSH مع `-o BatchMode` بالإضافة إلى الهوية/المفتاح الذي اخترته وتمرير منفذ محلي.
- **Remote direct (ws/wss)**: بدون نفق SSH. يتصل تطبيق Mac بعنوان URL الخاص بـ gateway مباشرةً (على سبيل المثال، عبر Tailscale Serve أو وكيل عكسي HTTPS عام).

## وسائل النقل البعيدة

يدعم الوضع البعيد وسيلتي نقل:

- **نفق SSH** ‏(افتراضي): يستخدم `ssh -N -L ...` لتمرير منفذ gateway إلى localhost. سترى gateway عنوان IP الخاص بالعقدة على أنه `127.0.0.1` لأن النفق يستخدم loopback.
- **مباشر (ws/wss)**: يتصل مباشرة بعنوان URL الخاص بـ gateway. ترى gateway عنوان IP الحقيقي للعميل.

في وضع نفق SSH، يتم حفظ أسماء المضيفين المكتشفة على LAN/tailnet
كقيمة `gateway.remote.sshTarget`. ويحافظ التطبيق على `gateway.remote.url` عند نقطة نهاية
النفق المحلي، على سبيل المثال `ws://127.0.0.1:18789`، بحيث يستخدم CLI وWeb Chat و
خدمة node-host المحلية النقل الآمن نفسه عبر loopback.

تعود ملكية أتمتة المتصفح في الوضع البعيد إلى مضيف عقدة CLI، وليس إلى عقدة
تطبيق macOS الأصلية. ويبدأ التطبيق خدمة node host المثبتة عند الإمكان؛ وإذا كنت تحتاج إلى التحكم في المتصفح من ذلك الـ Mac، فقم بتثبيتها/بدئها باستخدام `openclaw node install ...` و`openclaw node start` (أو شغّل
`openclaw node run ...` في الواجهة الأمامية)، ثم استهدف تلك العقدة
القادرة على المتصفح.

## المتطلبات المسبقة على المضيف البعيد

1. ثبّت Node + pnpm وابنِ/ثبّت OpenClaw CLI ‏(`pnpm install && pnpm build && pnpm link --global`).
2. تأكد من أن `openclaw` موجود على PATH للصدفات غير التفاعلية (أنشئ symlink إلى `/usr/local/bin` أو `/opt/homebrew/bin` إذا لزم الأمر).
3. افتح SSH باستخدام مصادقة المفتاح. ونوصي باستخدام عناوين IP الخاصة بـ **Tailscale** لتحقيق وصول ثابت خارج LAN.

## إعداد تطبيق macOS

1. افتح _Settings → General_.
2. تحت **OpenClaw runs**، اختر **Remote over SSH** واضبط:
   - **Transport**: ‏**SSH tunnel** أو **Direct (ws/wss)**.
   - **SSH target**: ‏`user@host` ‏(اختياري `:port`).
     - إذا كانت gateway على LAN نفسها وتعلن عبر Bonjour، فاخترها من القائمة المكتشفة لملء هذا الحقل تلقائيًا.
   - **Gateway URL** ‏(للوضع Direct فقط): ‏`wss://gateway.example.ts.net` ‏(أو `ws://...` للاستخدام المحلي/LAN).
   - **Identity file** ‏(متقدم): المسار إلى مفتاحك.
   - **Project root** ‏(متقدم): مسار checkout البعيد المستخدم للأوامر.
   - **CLI path** ‏(متقدم): مسار اختياري إلى نقطة دخول/ثنائي `openclaw` قابل للتشغيل (يُملأ تلقائيًا عند الإعلان عنه).
3. اضغط **Test remote**. ويشير النجاح إلى أن `openclaw status --json` البعيد يعمل بشكل صحيح. وعادةً ما تعني الإخفاقات وجود مشكلات في PATH/CLI؛ ويعني exit 127 أن CLI غير موجود على الجهاز البعيد.
4. ستعمل فحوصات السلامة وWeb Chat الآن عبر نفق SSH هذا تلقائيًا.

## Web Chat

- **نفق SSH**: تتصل Web Chat بـ gateway عبر منفذ التحكم WebSocket المُمرَّر (الافتراضي 18789).
- **مباشر (ws/wss)**: تتصل Web Chat مباشرة بعنوان URL الخاص بـ gateway المهيأ.
- لم يعد هناك خادم HTTP منفصل لـ WebChat بعد الآن.

## الأذونات

- يحتاج المضيف البعيد إلى موافقات TCC نفسها مثل الوضع المحلي (Automation وAccessibility وScreen Recording وMicrophone وSpeech Recognition وNotifications). شغّل التهيئة الأولى على ذلك الجهاز لمنحها مرة واحدة.
- تعلن Nodes عن حالة أذوناتها عبر `node.list` / `node.describe` حتى تعرف الوكلاء ما هو متاح.

## ملاحظات الأمان

- فضّل الربط على loopback في المضيف البعيد والاتصال عبر SSH أو Tailscale.
- يستخدم تمرير SSH تحققًا صارمًا من مفتاح المضيف؛ ثق أولًا بمفتاح المضيف حتى يوجد في `~/.ssh/known_hosts`.
- إذا ربطت Gateway بواجهة غير loopback، فاشترط مصادقة Gateway صالحة: token أو password أو وكيل عكسي مدرك للهوية مع `gateway.auth.mode: "trusted-proxy"`.
- راجع [الأمان](/ar/gateway/security) و[Tailscale](/ar/gateway/tailscale).

## تدفق تسجيل الدخول إلى WhatsApp (بعيد)

- شغّل `openclaw channels login --verbose` **على المضيف البعيد**. وامسح QR باستخدام WhatsApp على هاتفك.
- أعد تشغيل تسجيل الدخول على ذلك المضيف إذا انتهت صلاحية المصادقة. وستُظهر فحوصات السلامة مشكلات الربط.

## استكشاف الأخطاء وإصلاحها

- **exit 127 / not found**: ‏`openclaw` غير موجود على PATH للصدفات غير التفاعلية. أضفه إلى `/etc/paths` أو shell rc لديك، أو أنشئ symlink إلى `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: تحقّق من الوصول عبر SSH، وPATH، وأن Baileys مسجل دخوله (`openclaw status --json`).
- **Web Chat stuck**: أكّد أن gateway تعمل على المضيف البعيد وأن المنفذ المُمرَّر يطابق منفذ WS الخاص بـ gateway؛ إذ تتطلب واجهة المستخدم اتصال WS سليمًا.
- **Node IP shows 127.0.0.1**: هذا متوقع مع نفق SSH. بدّل **Transport** إلى **Direct (ws/wss)** إذا كنت تريد أن ترى gateway عنوان IP الحقيقي للعميل.
- **Voice Wake**: يتم تمرير عبارات التشغيل تلقائيًا في الوضع البعيد؛ ولا حاجة إلى forwarder منفصل.

## أصوات الإشعارات

اختر الأصوات لكل إشعار من النصوص البرمجية باستخدام `openclaw` و`node.invoke`، على سبيل المثال:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

لم يعد هناك مفتاح تبديل عام لـ "الصوت الافتراضي" في التطبيق؛ إذ يختار المستدعون صوتًا (أو لا شيء) لكل طلب.

## ذو صلة

- [تطبيق macOS](/ar/platforms/macos)
- [الوصول عن بُعد](/ar/gateway/remote)
