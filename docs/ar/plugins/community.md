---
read_when:
    - أنت تريد العثور على Plugins خارجية لـ OpenClaw
    - أنت تريد نشر Plugin الخاصة بك أو إدراجها
summary: 'Plugins المجتمع لـ OpenClaw التي تتم صيانتها من قبل المجتمع: تصفحها، وثبّتها، وأرسل Plugin الخاصة بك'
title: Plugins المجتمع
x-i18n:
    generated_at: "2026-04-26T11:35:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af2f0be5e5e75fe26a58576e6f44bce52a1ff8d597f86cafd8fb893f6c6b8f4
    source_path: plugins/community.md
    workflow: 15
---

Plugins المجتمع هي حزم خارجية توسّع OpenClaw بإضافة قنوات، أو أدوات، أو موفّرين، أو قدرات أخرى جديدة. يتم بناؤها وصيانتها
من قبل المجتمع، ونشرها على [ClawHub](/ar/tools/clawhub) أو npm، وتكون
قابلة للتثبيت بأمر واحد.

تُعد ClawHub سطح الاكتشاف المرجعي لـ Plugins المجتمع. لا تفتح
طلبات سحب خاصة بالمستندات فقط لمجرد إضافة Plugin الخاصة بك هنا من أجل قابلية الاكتشاف؛ بل انشرها على
ClawHub بدلًا من ذلك.

```bash
openclaw plugins install <package-name>
```

يتحقق OpenClaw من ClawHub أولًا ويعود إلى npm تلقائيًا.

## Plugins المدرجة

### Apify

استخرج البيانات من أي موقع ويب باستخدام أكثر من 20,000 مستخرج جاهز. دع الوكيل
يستخرج البيانات من Instagram، وFacebook، وTikTok، وYouTube، وGoogle Maps، وGoogle
Search، ومواقع التجارة الإلكترونية، وغير ذلك — فقط عبر الطلب.

- **npm:** `@apify/apify-openclaw-plugin`
- **المستودع:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

جسر OpenClaw مستقل لمحادثات Codex App Server. اربط دردشة بخيط
Codex، وتحدث إليه بنص عادي، وتحكم فيه باستخدام أوامر أصلية للدردشة من أجل الاستئناف، والتخطيط، والمراجعة، واختيار النموذج، وCompaction، وغير ذلك.

- **npm:** `openclaw-codex-app-server`
- **المستودع:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

تكامل روبوت المؤسسات باستخدام وضع Stream. يدعم النصوص، والصور،
ورسائل الملفات عبر أي عميل DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **المستودع:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin لإدارة السياق بدون فقدان لـ OpenClaw. تلخيص للمحادثات قائم على
DAG مع Compaction تدريجي — يحافظ على الدقة الكاملة للسياق
مع تقليل استهلاك الرموز.

- **npm:** `@martian-engineering/lossless-claw`
- **المستودع:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin رسمية تصدّر تتبعات الوكيل إلى Opik. راقب سلوك الوكيل،
والتكلفة، والرموز، والأخطاء، وغير ذلك.

- **npm:** `@opik/opik-openclaw`
- **المستودع:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

امنح وكيل OpenClaw الخاص بك صورة رمزية Live2D مع مزامنة شفاه في الزمن الحقيقي،
وتعبيرات عاطفية، وتحويل النص إلى كلام. ويتضمن أدوات للمبدعين من أجل توليد الأصول بالذكاء الاصطناعي
والنشر بنقرة واحدة إلى Prometheus Marketplace. وهو حاليًا في مرحلة alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **المستودع:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

صل OpenClaw بـ QQ عبر QQ Bot API. يدعم المحادثات الخاصة، وذكر
المجموعات، ورسائل القنوات، والوسائط الغنية بما في ذلك الصوت، والصور، والفيديوهات،
والملفات.

تتضمن إصدارات OpenClaw الحالية QQ Bot بشكل مضمّن. استخدم الإعداد المضمّن في
[QQ Bot](/ar/channels/qqbot) لعمليات التثبيت العادية؛ ولا تثبّت هذه Plugin الخارجية إلا
عندما تريد عمدًا الحزمة المستقلة التي تصونها Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **المستودع:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin قناة WeCom لـ OpenClaw من فريق Tencent WeCom. تعمل بواسطة
اتصالات WebSocket المستمرة الخاصة بـ WeCom Bot، وتدعم الرسائل المباشرة ومحادثات
المجموعات، والردود المتدفقة، والمراسلة الاستباقية، ومعالجة الصور/الملفات، وتنسيق Markdown،
وضبط الوصول المدمج، وSkills الخاصة بالمستندات/الاجتماعات/المراسلة.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **المستودع:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## أرسل Plugin الخاصة بك

نرحب بـ Plugins المجتمع المفيدة، والموثقة، والآمنة في التشغيل.

<Steps>
  <Step title="انشر على ClawHub أو npm">
    يجب أن تكون Plugin الخاصة بك قابلة للتثبيت عبر `openclaw plugins install \<package-name\>`.
    انشر على [ClawHub](/ar/tools/clawhub) (مفضل) أو npm.
    راجع [بناء Plugins](/ar/plugins/building-plugins) للحصول على الدليل الكامل.

  </Step>

  <Step title="استضف على GitHub">
    يجب أن تكون الشيفرة المصدرية في مستودع عام مع مستندات إعداد ومتتبع
    للمشكلات.

  </Step>

  <Step title="استخدم طلبات سحب المستندات فقط لتغييرات المستندات المصدرية">
    لا تحتاج إلى طلب سحب للمستندات فقط لجعل Plugin الخاصة بك قابلة للاكتشاف. انشرها
    على ClawHub بدلًا من ذلك.

    افتح طلب سحب للمستندات فقط عندما تحتاج مستندات المصدر الخاصة بـ OpenClaw إلى
    تغيير محتوى فعلي، مثل تصحيح إرشادات التثبيت أو إضافة
    توثيق عابر للمستودعات ينتمي إلى مجموعة المستندات الرئيسية.

  </Step>
</Steps>

## معيار الجودة

| المتطلب                    | السبب                                           |
| -------------------------- | ----------------------------------------------- |
| منشورة على ClawHub أو npm | يحتاج المستخدمون إلى أن يعمل `openclaw plugins install` |
| مستودع GitHub عام          | مراجعة المصدر، وتتبع المشكلات، والشفافية        |
| مستندات إعداد واستخدام     | يحتاج المستخدمون إلى معرفة كيفية ضبطها          |
| صيانة نشطة                 | تحديثات حديثة أو معالجة متجاوبة للمشكلات        |

قد يتم رفض الأغلفة منخفضة الجهد، أو الملكية غير الواضحة، أو الحزم غير المصانة.

## ذو صلة

- [تثبيت Plugins وتهيئتها](/ar/tools/plugin) — كيفية تثبيت أي Plugin
- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin الخاصة بك
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان
