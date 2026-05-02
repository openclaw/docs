---
read_when:
    - تريد العثور على Plugins تابعة لجهات خارجية لـ OpenClaw
    - تريد نشر Plugin الخاص بك أو إدراجه
summary: 'إضافات OpenClaw التي يصونها المجتمع: تصفّحها وثبّتها وقدّم إضافتك الخاصة'
title: Plugins المجتمع
x-i18n:
    generated_at: "2026-05-02T20:50:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a58fbc153c837f5ac79ee70406a5611e8a9a273c18c0c5642763531fbe10dca
    source_path: plugins/community.md
    workflow: 16
---

المكونات Plugin المجتمعية هي حزم خارجية توسّع OpenClaw بقنوات أو أدوات أو موفّرين أو قدرات أخرى جديدة. يبنيها المجتمع ويصونها، وتُنشر عادةً على [ClawHub](/ar/tools/clawhub)، ويمكن تثبيتها بأمر واحد. يظل npm هو خيار التشغيل الافتراضي لمواصفات الحزم المجرّدة بينما يجري طرح تثبيت حزم ClawHub.

ClawHub هو سطح الاكتشاف المعتمد للمكونات Plugin المجتمعية. لا تفتح PRs خاصة بالوثائق فقط لإضافة المكوّن Plugin الخاص بك هنا بغرض قابلية الاكتشاف؛ انشره على ClawHub بدلاً من ذلك.

```bash
openclaw plugins install clawhub:<package-name>
```

استخدم `openclaw plugins install <package-name>` للحزم المستضافة على npm.

## المكونات Plugin المدرجة

### Apify

اكشط البيانات من أي موقع ويب باستخدام أكثر من 20,000 كاشط جاهز. دع وكيلك يستخرج البيانات من Instagram وFacebook وTikTok وYouTube وGoogle Maps وGoogle Search ومواقع التجارة الإلكترونية والمزيد — بمجرد الطلب.

- **npm:** `@apify/apify-openclaw-plugin`
- **المستودع:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

جسر OpenClaw مستقل لمحادثات Codex App Server. اربط محادثة بسلسلة Codex، وتحدث إليها بنص عادي، وتحكّم بها باستخدام أوامر أصلية للمحادثة للاستئناف، والتخطيط، والمراجعة، واختيار النموذج، وCompaction، والمزيد.

- **npm:** `openclaw-codex-app-server`
- **المستودع:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

تكامل روبوت مؤسسي باستخدام وضع Stream. يدعم الرسائل النصية والصور ورسائل الملفات عبر أي عميل DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **المستودع:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

مكوّن Plugin لإدارة السياق بلا فقدان لـ OpenClaw. تلخيص محادثات قائم على DAG مع Compaction تزايدي — يحافظ على أمانة السياق الكاملة مع تقليل استخدام الرموز.

- **npm:** `@martian-engineering/lossless-claw`
- **المستودع:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

مكوّن Plugin رسمي يصدّر آثار الوكيل إلى Opik. راقب سلوك الوكيل، والتكلفة، والرموز، والأخطاء، والمزيد.

- **npm:** `@opik/opik-openclaw`
- **المستودع:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

امنح وكيل OpenClaw الخاص بك صورة رمزية Live2D مع مزامنة شفاه في الوقت الحقيقي، وتعبيرات عاطفية، وتحويل النص إلى كلام. يتضمن أدوات منشئين لتوليد أصول الذكاء الاصطناعي والنشر بنقرة واحدة إلى Prometheus Marketplace. حاليًا في مرحلة ألفا.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **المستودع:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

اربط OpenClaw بـ QQ عبر QQ Bot API. يدعم المحادثات الخاصة، وإشارات المجموعات، ورسائل القنوات، والوسائط الغنية بما في ذلك الصوت والصور ومقاطع الفيديو والملفات.

تضمّن إصدارات OpenClaw الحالية QQ Bot. استخدم الإعداد المضمّن في [QQ Bot](/ar/channels/qqbot) للتثبيتات العادية؛ ثبّت هذا المكوّن Plugin الخارجي فقط عندما تريد عمدًا الحزمة المستقلة التي تصونها Tencent.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **المستودع:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

مكوّن Plugin قناة WeCom لـ OpenClaw من فريق Tencent WeCom. يعتمد على اتصالات WeCom Bot WebSocket الدائمة، ويدعم الرسائل المباشرة ومحادثات المجموعات، والردود المتدفقة، والمراسلة الاستباقية، ومعالجة الصور/الملفات، وتنسيق Markdown، والتحكم المدمج في الوصول، وSkills المستندات/الاجتماعات/المراسلة.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **المستودع:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

### Yuanbao

مكوّن Plugin قناة Yuanbao لـ OpenClaw من فريق Tencent Yuanbao. يعتمد على اتصالات WebSocket الدائمة، ويدعم الرسائل المباشرة ومحادثات المجموعات، والردود المتدفقة، والمراسلة الاستباقية، ومعالجة الصور/الملفات/الصوت/الفيديو، وتنسيق Markdown، والتحكم المدمج في الوصول، وقوائم أوامر الشرطة المائلة.

- **npm:** `openclaw-plugin-yuanbao`
- **المستودع:** [github.com/YuanbaoTeam/yuanbao-openclaw-plugin](https://github.com/YuanbaoTeam/yuanbao-openclaw-plugin)

```bash
openclaw plugins install openclaw-plugin-yuanbao
```

## أرسل المكوّن Plugin الخاص بك

نرحّب بالمكونات Plugin المجتمعية المفيدة، والموثقة، والآمنة للتشغيل.

<Steps>
  <Step title="انشر على ClawHub أو npm">
    يجب أن يكون المكوّن Plugin الخاص بك قابلاً للتثبيت عبر `openclaw plugins install \<package-name\>`.
    انشر على [ClawHub](/ar/tools/clawhub) ما لم تكن تحتاج تحديدًا إلى توزيع
    عبر npm فقط.
    راجع [بناء المكونات Plugin](/ar/plugins/building-plugins) للحصول على الدليل الكامل.

  </Step>

  <Step title="استضف على GitHub">
    يجب أن تكون الشيفرة المصدرية في مستودع عام يتضمن وثائق إعداد ومتتبع
    مشكلات.

  </Step>

  <Step title="استخدم PRs الوثائق فقط لتغييرات وثائق المصدر">
    لا تحتاج إلى PR وثائق لمجرد جعل المكوّن Plugin الخاص بك قابلاً للاكتشاف. انشره
    على ClawHub بدلاً من ذلك.

    افتح PR وثائق فقط عندما تحتاج وثائق مصدر OpenClaw إلى تغيير محتوى
    فعلي، مثل تصحيح إرشادات التثبيت أو إضافة توثيق عابر للمستودعات
    مكانه ضمن مجموعة الوثائق الرئيسية.

  </Step>
</Steps>

## معيار الجودة

| المتطلب                 | السبب                                           |
| --------------------------- | --------------------------------------------- |
| منشور على ClawHub أو npm | يحتاج المستخدمون إلى عمل `openclaw plugins install` |
| مستودع GitHub عام          | مراجعة المصدر، وتتبع المشكلات، والشفافية   |
| وثائق الإعداد والاستخدام        | يحتاج المستخدمون إلى معرفة كيفية تكوينه        |
| صيانة نشطة          | تحديثات حديثة أو تعامل متجاوب مع المشكلات   |

قد تُرفض الأغلفة منخفضة الجهد، أو الملكية غير الواضحة، أو الحزم غير المصانة.

## ذو صلة

- [تثبيت المكونات Plugin وتكوينها](/ar/tools/plugin) — كيفية تثبيت أي مكوّن Plugin
- [بناء المكونات Plugin](/ar/plugins/building-plugins) — أنشئ مكوّنك الخاص
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان
