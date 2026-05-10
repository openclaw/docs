---
read_when:
    - تريد العثور على Plugins من جهات خارجية لـ OpenClaw
    - تريد نشر Plugin الخاص بك أو إدراجه
summary: 'إضافات OpenClaw التي يصونها المجتمع: تصفّح وثبّت وقدّم إضافتك الخاصة'
title: Plugin المجتمع
x-i18n:
    generated_at: "2026-05-10T19:49:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee23598011f79f46b9171296501605cf0a5ef5aa7b67040135ea47cac21ca6a4
    source_path: plugins/community.md
    workflow: 16
---

الإضافات المجتمعية هي حزم تابعة لجهات خارجية توسّع OpenClaw بقنوات أو أدوات أو موفّرين أو قدرات أخرى جديدة. يبنيها المجتمع ويصونها، وتُنشر عادةً على [ClawHub](/ar/clawhub)، ويمكن تثبيتها بأمر واحد. يبقى npm خيار التشغيل الافتراضي لمواصفات الحزم المجردة ريثما يتم طرح تثبيت حزم ClawHub.

ClawHub هو سطح الاكتشاف المعتمد للإضافات المجتمعية. لا تفتح PRs مخصصة للوثائق فقط لمجرد إضافة إضافتك هنا من أجل قابلية الاكتشاف؛ انشرها على ClawHub بدلاً من ذلك.

```bash
openclaw plugins install clawhub:<package-name>
```

استخدم `openclaw plugins install <package-name>` للحزم المستضافة على npm.

## الإضافات المدرجة

### Apify

اكشط البيانات من أي موقع ويب باستخدام أكثر من 20,000 كاشط جاهز. دع وكيلك يستخرج البيانات من Instagram وFacebook وTikTok وYouTube وGoogle Maps وGoogle Search ومواقع التجارة الإلكترونية والمزيد، بمجرد الطلب.

- **npm:** `@apify/apify-openclaw-plugin`
- **المستودع:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

جسر OpenClaw مستقل لمحادثات Codex App Server. اربط محادثة بسلسلة Codex، وتحدث إليها بنص عادي، وتحكم بها عبر أوامر أصلية للمحادثة من أجل الاستئناف، والتخطيط، والمراجعة، واختيار النموذج، وCompaction، والمزيد.

- **npm:** `openclaw-codex-app-server`
- **المستودع:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

تكامل روبوت مؤسسي باستخدام وضع Stream. يدعم الرسائل النصية والصور والملفات عبر أي عميل DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **المستودع:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

إضافة إدارة سياق بلا فقدان لـ OpenClaw. تلخيص محادثات قائم على DAG مع Compaction تزايدي، يحافظ على أمانة السياق كاملة مع تقليل استخدام الرموز.

- **npm:** `@martian-engineering/lossless-claw`
- **المستودع:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

إضافة رسمية تصدّر تتبعات الوكلاء إلى Opik. راقب سلوك الوكيل، والتكلفة، والرموز، والأخطاء، والمزيد.

- **npm:** `@opik/opik-openclaw`
- **المستودع:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

امنح وكيل OpenClaw الخاص بك صورة رمزية Live2D مع مزامنة شفاه فورية، وتعبيرات عاطفية، وتحويل النص إلى كلام. يتضمن أدوات منشئين لتوليد أصول بالذكاء الاصطناعي ونشراً بنقرة واحدة إلى Prometheus Marketplace. حالياً في مرحلة ألفا.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **المستودع:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

صِل OpenClaw بـ QQ عبر QQ Bot API. يدعم المحادثات الخاصة، وإشارات المجموعات، ورسائل القنوات، والوسائط الغنية بما يشمل الصوت، والصور، والفيديوهات، والملفات.

تضمّن إصدارات OpenClaw الحالية QQ Bot. استخدم الإعداد المضمّن في [QQ Bot](/ar/channels/qqbot) للتثبيتات العادية؛ ثبّت هذه الإضافة الخارجية فقط عندما تريد عمداً الحزمة المستقلة التي تصونها Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **المستودع:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

إضافة قناة WeCom لـ OpenClaw من فريق Tencent WeCom. تعمل بواسطة اتصالات WeCom Bot WebSocket المستمرة، وتدعم الرسائل المباشرة ومحادثات المجموعات، والردود المتدفقة، والمراسلة الاستباقية، ومعالجة الصور/الملفات، وتنسيق Markdown، والتحكم المدمج في الوصول، ومهارات المستندات/الاجتماعات/المراسلة.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **المستودع:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

إضافة قناة Yuanbao لـ OpenClaw من فريق Tencent Yuanbao. تعمل بواسطة اتصالات WebSocket مستمرة، وتدعم الرسائل المباشرة ومحادثات المجموعات، والردود المتدفقة، والمراسلة الاستباقية، ومعالجة الصور/الملفات/الصوت/الفيديو، وتنسيق Markdown، والتحكم المدمج في الوصول، وقوائم أوامر الشرطة المائلة.

- **npm:** `openclaw-plugin-yuanbao`
- **المستودع:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## أرسل إضافتك

نرحب بالإضافات المجتمعية المفيدة، والموثقة، والآمنة للتشغيل.

<Steps>
  <Step title="انشر إلى ClawHub أو npm">
    يجب أن تكون إضافتك قابلة للتثبيت عبر `openclaw plugins install \<package-name\>`.
    انشر إلى [ClawHub](/ar/clawhub) ما لم تكن تحتاج تحديداً إلى توزيع
    مقتصر على npm.
    راجع [بناء الإضافات](/ar/plugins/building-plugins) للاطلاع على الدليل الكامل.

  </Step>

  <Step title="استضف على GitHub">
    يجب أن تكون الشيفرة المصدرية في مستودع عام مع وثائق إعداد ومتتبع
    للمشكلات.

  </Step>

  <Step title="استخدم PRs الخاصة بالوثائق فقط لتغييرات وثائق المصدر">
    لا تحتاج إلى PR للوثائق لمجرد جعل إضافتك قابلة للاكتشاف. انشرها
    على ClawHub بدلاً من ذلك.

    افتح PR للوثائق فقط عندما تحتاج وثائق مصدر OpenClaw إلى تغيير محتوى
    فعلي، مثل تصحيح إرشادات التثبيت أو إضافة توثيق عابر للمستودعات
    ينتمي إلى مجموعة الوثائق الرئيسية.

  </Step>
</Steps>

## معيار الجودة

| المتطلب                    | السبب                                      |
| --------------------------- | --------------------------------------------- |
| منشورة على ClawHub أو npm | يحتاج المستخدمون إلى عمل `openclaw plugins install` |
| مستودع GitHub عام          | مراجعة المصدر، وتتبع المشكلات، والشفافية   |
| وثائق الإعداد والاستخدام   | يحتاج المستخدمون إلى معرفة كيفية تكوينها   |
| صيانة نشطة                 | تحديثات حديثة أو تعامل متجاوب مع المشكلات |

قد تُرفض الأغلفة منخفضة الجهد، أو الملكية غير الواضحة، أو الحزم غير المصانة.

## ذو صلة

- [تثبيت الإضافات وتكوينها](/ar/tools/plugin) — كيفية تثبيت أي إضافة
- [بناء الإضافات](/ar/plugins/building-plugins) — أنشئ إضافتك الخاصة
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان
