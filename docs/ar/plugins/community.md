---
read_when:
    - تريد العثور على Plugins تابعة لجهات خارجية لـ OpenClaw
    - تريد نشر Plugin الخاص بك أو إدراجه
summary: 'plugins الخاصة بـ OpenClaw التي يصونها المجتمع: تصفّحها وثبّتها وقدّم Plugin الخاص بك'
title: Plugins المجتمع
x-i18n:
    generated_at: "2026-04-30T09:34:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9685aaf141b739a2a745a6184201ac86689e4284bec6eb068ffbd0d53fb4ecf1
    source_path: plugins/community.md
    workflow: 16
---

Plugins المجتمع هي حزم تابعة لجهات خارجية توسّع OpenClaw بقنوات أو أدوات أو مزوّدين أو قدرات أخرى جديدة. يبنيها المجتمع ويصونها، وتُنشر عادةً على [ClawHub](/ar/tools/clawhub)، ويمكن تثبيتها بأمر واحد. يظل npm خيارًا احتياطيًا مدعومًا للحزم التي لم تنتقل إلى ClawHub بعد.

ClawHub هو واجهة الاكتشاف الأساسية لـ Plugins المجتمع. لا تفتح طلبات PR للوثائق فقط لإضافة Plugin الخاص بك هنا بغرض قابلية الاكتشاف؛ انشره على ClawHub بدلًا من ذلك.

```bash
openclaw plugins install <package-name>
```

يتحقق OpenClaw من ClawHub أولًا ويعود إلى npm تلقائيًا عند الحاجة.

## Plugins المدرجة

### Apify

اكشط البيانات من أي موقع ويب باستخدام أكثر من 20,000 كاشط جاهز. دع وكيلك يستخرج البيانات من Instagram وFacebook وTikTok وYouTube وGoogle Maps وGoogle Search ومواقع التجارة الإلكترونية وغيرها — بمجرد الطلب.

- **npm:** `@apify/apify-openclaw-plugin`
- **المستودع:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

جسر OpenClaw مستقل لمحادثات Codex App Server. اربط دردشة بسلسلة Codex، وتحدث إليها بنص عادي، وتحكم بها عبر أوامر أصلية للدردشة للاستئناف، والتخطيط، والمراجعة، واختيار النموذج، وCompaction، والمزيد.

- **npm:** `openclaw-codex-app-server`
- **المستودع:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

تكامل روبوت مؤسسي باستخدام وضع Stream. يدعم رسائل النصوص والصور والملفات عبر أي عميل DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **المستودع:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin إدارة السياق بلا فقدان لـ OpenClaw. تلخيص محادثات قائم على DAG مع Compaction تزايدي — يحافظ على أمانة السياق كاملةً مع تقليل استخدام الرموز.

- **npm:** `@martian-engineering/lossless-claw`
- **المستودع:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin رسمي يصدّر تتبعات الوكيل إلى Opik. راقب سلوك الوكيل، والتكلفة، والرموز، والأخطاء، والمزيد.

- **npm:** `@opik/opik-openclaw`
- **المستودع:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

امنح وكيل OpenClaw الخاص بك صورة رمزية Live2D مع مزامنة شفاه آنية، وتعبيرات عاطفية، وتحويل النص إلى كلام. يتضمن أدوات منشئين لتوليد أصول الذكاء الاصطناعي والنشر بنقرة واحدة إلى Prometheus Marketplace. حاليًا في مرحلة ألفا.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **المستودع:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

صل OpenClaw بـ QQ عبر QQ Bot API. يدعم الدردشات الخاصة، وإشارات المجموعات، ورسائل القنوات، والوسائط الغنية بما في ذلك الصوت والصور والفيديوهات والملفات.

تتضمن إصدارات OpenClaw الحالية QQ Bot. استخدم الإعداد المضمّن في [QQ Bot](/ar/channels/qqbot) للتثبيت العادي؛ ثبّت هذا Plugin الخارجي فقط عندما تريد عمدًا الحزمة المستقلة التي تصونها Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **المستودع:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin قناة WeCom لـ OpenClaw من فريق Tencent WeCom. يعمل بواسطة اتصالات WeCom Bot WebSocket المستمرة، ويدعم الرسائل المباشرة ودردشات المجموعات، والردود المتدفقة، والمراسلة الاستباقية، ومعالجة الصور/الملفات، وتنسيق Markdown، والتحكم المدمج في الوصول، وSkills المستندات/الاجتماعات/المراسلة.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **المستودع:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin قناة Yuanbao لـ OpenClaw من فريق Tencent Yuanbao. يعمل بواسطة اتصالات WebSocket المستمرة، ويدعم الرسائل المباشرة ودردشات المجموعات، والردود المتدفقة، والمراسلة الاستباقية، ومعالجة الصور/الملفات/الصوت/الفيديو، وتنسيق Markdown، والتحكم المدمج في الوصول، وقوائم أوامر الشرطة المائلة.

- **npm:** `openclaw-plugin-yuanbao`
- **المستودع:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## إرسال Plugin الخاص بك

نرحب بـ Plugins المجتمع التي تكون مفيدة وموثقة وآمنة للتشغيل.

<Steps>
  <Step title="النشر إلى ClawHub أو npm">
    يجب أن يكون Plugin الخاص بك قابلًا للتثبيت عبر `openclaw plugins install \<package-name\>`.
    انشر إلى [ClawHub](/ar/tools/clawhub) ما لم تكن تحتاج تحديدًا إلى
    توزيع عبر npm فقط.
    راجع [بناء Plugins](/ar/plugins/building-plugins) للاطلاع على الدليل الكامل.

  </Step>

  <Step title="الاستضافة على GitHub">
    يجب أن تكون الشيفرة المصدرية في مستودع عام يحتوي على وثائق إعداد ومتتبع
    مشكلات.

  </Step>

  <Step title="استخدم طلبات PR للوثائق فقط لتغييرات وثائق المصدر">
    لا تحتاج إلى طلب PR للوثائق لمجرد جعل Plugin الخاص بك قابلًا للاكتشاف. انشره
    على ClawHub بدلًا من ذلك.

    افتح طلب PR للوثائق فقط عندما تحتاج وثائق مصدر OpenClaw إلى تغيير محتوى
    فعلي، مثل تصحيح إرشادات التثبيت أو إضافة وثائق عابرة للمستودعات
    تنتمي إلى مجموعة الوثائق الرئيسية.

  </Step>
</Steps>

## معيار الجودة

| المتطلب                    | السبب                                      |
| --------------------------- | --------------------------------------------- |
| منشور على ClawHub أو npm | يحتاج المستخدمون إلى عمل `openclaw plugins install` |
| مستودع GitHub عام          | مراجعة المصدر، وتتبع المشكلات، والشفافية   |
| وثائق الإعداد والاستخدام        | يحتاج المستخدمون إلى معرفة كيفية تهيئته        |
| صيانة نشطة          | تحديثات حديثة أو تعامل متجاوب مع المشكلات   |

قد تُرفض الأغلفة منخفضة الجهد، أو الملكية غير الواضحة، أو الحزم غير المصانة.

## ذو صلة

- [تثبيت Plugins وتهيئتها](/ar/tools/plugin) — كيفية تثبيت أي Plugin
- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ ما يخصك
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان
