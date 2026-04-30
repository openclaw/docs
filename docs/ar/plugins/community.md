---
read_when:
    - تريد العثور على Plugins من جهات خارجية لـ OpenClaw
    - تريد نشر Plugin الخاص بك أو إدراجه
summary: 'Plugins OpenClaw التي يتولى المجتمع صيانتها: تصفّحها وثبّتها وقدّم Plugin الخاص بك'
title: Plugins المجتمع
x-i18n:
    generated_at: "2026-04-30T08:13:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a54130fefc55042d53270e5f7f4b49a4aad715570743013fbfe06b0e2fa067d0
    source_path: plugins/community.md
    workflow: 16
---

Plugins المجتمع هي حزم تابعة لجهات خارجية توسّع OpenClaw بقنوات أو أدوات أو مزوّدين أو قدرات أخرى جديدة. يبنيها المجتمع ويتولّى صيانتها، وتُنشر عادةً على [ClawHub](/ar/tools/clawhub)، ويمكن تثبيتها بأمر واحد. يبقى npm خيارًا احتياطيًا مدعومًا للحزم التي لم تنتقل إلى ClawHub بعد.

ClawHub هو سطح الاكتشاف المعتمد لـ Plugins المجتمع. لا تفتح طلبات PR خاصة بالتوثيق فقط لإضافة Plugin الخاص بك هنا بهدف قابلية الاكتشاف؛ انشره على ClawHub بدلًا من ذلك.

```bash
openclaw plugins install <package-name>
```

يتحقق OpenClaw من ClawHub أولًا ثم يعود إلى npm تلقائيًا.

## Plugins المدرجة

### Apify

اكشط البيانات من أي موقع ويب باستخدام أكثر من 20,000 كاشط جاهز. دع وكيلك يستخرج البيانات من Instagram وFacebook وTikTok وYouTube وGoogle Maps وGoogle Search ومواقع التجارة الإلكترونية والمزيد، بمجرد الطلب.

- **npm:** `@apify/apify-openclaw-plugin`
- **المستودع:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

جسر OpenClaw مستقل لمحادثات Codex App Server. اربط محادثة بسلسلة Codex، وتحدث إليها بنص عادي، وتحكم بها باستخدام أوامر أصلية للمحادثة للاستئناف، والتخطيط، والمراجعة، واختيار النموذج، وCompaction، والمزيد.

- **npm:** `openclaw-codex-app-server`
- **المستودع:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

تكامل روبوت للمؤسسات باستخدام وضع Stream. يدعم الرسائل النصية والصور ورسائل الملفات عبر أي عميل DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **المستودع:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin إدارة السياق بلا فقد لـ OpenClaw. تلخيص محادثات قائم على DAG مع Compaction تزايدي، يحافظ على أمانة السياق كاملةً مع تقليل استخدام الرموز.

- **npm:** `@martian-engineering/lossless-claw`
- **المستودع:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin رسمي يصدّر تتبعات الوكلاء إلى Opik. راقب سلوك الوكيل، والتكلفة، والرموز، والأخطاء، والمزيد.

- **npm:** `@opik/opik-openclaw`
- **المستودع:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

امنح وكيل OpenClaw الخاص بك صورة رمزية Live2D مع مزامنة شفاه في الوقت الحقيقي، وتعبيرات عاطفية، وتحويل النص إلى كلام. يتضمن أدوات للمبدعين لتوليد أصول الذكاء الاصطناعي والنشر بنقرة واحدة إلى Prometheus Marketplace. حاليًا في مرحلة ألفا.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **المستودع:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

صِل OpenClaw بـ QQ عبر QQ Bot API. يدعم المحادثات الخاصة، وإشارات المجموعات، ورسائل القنوات، والوسائط الغنية بما في ذلك الصوت، والصور، ومقاطع الفيديو، والملفات.

تتضمن إصدارات OpenClaw الحالية QQ Bot. استخدم الإعداد المضمّن في [QQ Bot](/ar/channels/qqbot) للتثبيتات العادية؛ ثبّت هذا Plugin الخارجي فقط عندما تريد عمدًا الحزمة المستقلة التي تصونها Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **المستودع:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin قناة WeCom لـ OpenClaw من فريق Tencent WeCom. يعمل عبر اتصالات WeCom Bot WebSocket المستمرة، ويدعم الرسائل المباشرة ومحادثات المجموعات، والردود المتدفقة، والمراسلة الاستباقية، ومعالجة الصور/الملفات، وتنسيق Markdown، والتحكم المضمّن في الوصول، وSkills المستندات/الاجتماعات/المراسلة.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **المستودع:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

Plugin قناة Yuanbao لـ OpenClaw من فريق Tencent Yuanbao. يعمل عبر اتصالات WebSocket المستمرة، ويدعم الرسائل المباشرة ومحادثات المجموعات، والردود المتدفقة، والمراسلة الاستباقية، ومعالجة الصور/الملفات/الصوت/الفيديو، وتنسيق Markdown، والتحكم المضمّن في الوصول، وقوائم أوامر الشرطة المائلة.

- **npm:** `openclaw-plugin-yuanbao`
- **المستودع:** [github.com/yb-claw/openclaw-plugin-yuanbao](https://github.com/yb-claw/openclaw-plugin-yuanbao)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## أرسل Plugin الخاص بك

نرحب بـ Plugins المجتمع التي تكون مفيدة وموثقة وآمنة التشغيل.

<Steps>
  <Step title="انشر على ClawHub أو npm">
    يجب أن يكون Plugin الخاص بك قابلًا للتثبيت عبر `openclaw plugins install \<package-name\>`.
    انشر على [ClawHub](/ar/tools/clawhub) ما لم تكن تحتاج تحديدًا إلى توزيع npm فقط.
    راجع [بناء Plugins](/ar/plugins/building-plugins) للاطلاع على الدليل الكامل.

  </Step>

  <Step title="استضفه على GitHub">
    يجب أن تكون الشيفرة المصدرية في مستودع عام يتضمن وثائق إعداد ومتتبع مشكلات.

  </Step>

  <Step title="استخدم طلبات PR الخاصة بالتوثيق لتغييرات توثيق المصدر فقط">
    لا تحتاج إلى طلب PR للتوثيق فقط لجعل Plugin الخاص بك قابلًا للاكتشاف. انشره على ClawHub بدلًا من ذلك.

    افتح طلب PR للتوثيق فقط عندما تحتاج وثائق مصدر OpenClaw إلى تغيير محتوى فعلي، مثل تصحيح إرشادات التثبيت أو إضافة توثيق عابر للمستودعات ينتمي إلى مجموعة الوثائق الرئيسية.

  </Step>
</Steps>

## معيار الجودة

| المتطلب                    | السبب                                           |
| --------------------------- | --------------------------------------------- |
| منشور على ClawHub أو npm | يحتاج المستخدمون إلى عمل `openclaw plugins install` |
| مستودع GitHub عام          | مراجعة المصدر، وتتبع المشكلات، والشفافية   |
| وثائق الإعداد والاستخدام        | يحتاج المستخدمون إلى معرفة كيفية تكوينه        |
| صيانة نشطة          | تحديثات حديثة أو تعامل مستجيب مع المشكلات   |

قد تُرفض الأغلفة منخفضة الجهد أو الحزم ذات الملكية غير الواضحة أو غير المصانة.

## ذو صلة

- [تثبيت Plugins وتكوينها](/ar/tools/plugin) — كيفية تثبيت أي Plugin
- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin الخاص بك
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان
