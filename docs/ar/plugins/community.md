---
read_when:
    - تريد العثور على Plugins خارجية لـ OpenClaw
    - تريد نشر Plugin الخاص بك أو إدراجه
summary: 'Plugins ‏OpenClaw التي يصونها المجتمع: التصفّح، والتثبيت، وإرسال Plugin الخاص بك'
title: Plugins المجتمعാപാത്രanalysis to=commentary.multi_tool_use.parallel ＿一本道_json {"tool_uses":[{"recipient_name":"functions.bash","parameters":{"command":"rg -n \"Community-maintained OpenClaw plugins|Community plugins|browse, install, and submit your own|ClawHub\" -S .. -g '!node_modules'","timeout":10}},{"recipient_name":"functions.read","parameters":{"path":"docs/AGENTS.md","offset":1,"limit":120}}]}
x-i18n:
    generated_at: "2026-04-24T07:54:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: acce221249df8ceea65436902a33f4906503a1c6f57db3b0ad2058d64c1fb0f7
    source_path: plugins/community.md
    workflow: 15
---

Plugins المجتمع هي حزم خارجية توسّع OpenClaw بقنوات جديدة،
أو أدوات، أو مزوّدين، أو إمكانات أخرى. وهي تُبنى وتُصان
من قِبل المجتمع، وتُنشر على [ClawHub](/ar/tools/clawhub) أو npm،
ويمكن تثبيتها بأمر واحد.

يمثل ClawHub السطح الأساسي لاكتشاف Plugins المجتمع. لا تفتح
طلبات سحب خاصة بالوثائق فقط لمجرد إضافة Plugin الخاص بك هنا من أجل سهولة الاكتشاف؛ انشره على
ClawHub بدلًا من ذلك.

```bash
openclaw plugins install <package-name>
```

يفحص OpenClaw أولًا ClawHub ثم يعود تلقائيًا إلى npm عند الحاجة.

## Plugins المدرجة

### Apify

اجمع البيانات من أي موقع ويب باستخدام أكثر من 20,000 أداة استخراج جاهزة. دع الوكيل
يستخرج البيانات من Instagram وFacebook وTikTok وYouTube وGoogle Maps وGoogle
Search ومواقع التجارة الإلكترونية وغير ذلك — فقط عبر الطلب.

- **npm:** `@apify/apify-openclaw-plugin`
- **المستودع:** [github.com/apify/apify-openclaw-plugin](https://github.com/apify/apify-openclaw-plugin)

```bash
openclaw plugins install @apify/apify-openclaw-plugin
```

### Codex App Server Bridge

جسر OpenClaw مستقل لمحادثات Codex App Server. اربط دردشةً
بخيط Codex، وتحدث إليه بنص عادي، وتحكم به بأوامر أصلية للدردشة من أجل
الاستئناف، والتخطيط، والمراجعة، واختيار النموذج، وCompaction، وغير ذلك.

- **npm:** `openclaw-codex-app-server`
- **المستودع:** [github.com/pwrdrvr/openclaw-codex-app-server](https://github.com/pwrdrvr/openclaw-codex-app-server)

```bash
openclaw plugins install openclaw-codex-app-server
```

### DingTalk

تكامل روبوت مؤسسي باستخدام وضع Stream. يدعم النصوص والصور و
رسائل الملفات عبر أي عميل DingTalk.

- **npm:** `@largezhou/ddingtalk`
- **المستودع:** [github.com/largezhou/openclaw-dingtalk](https://github.com/largezhou/openclaw-dingtalk)

```bash
openclaw plugins install @largezhou/ddingtalk
```

### Lossless Claw (LCM)

Plugin لإدارة السياق من دون فقدان لـ OpenClaw. تلخيص محادثات
قائم على DAG مع Compaction تزايدي — يحافظ على دقة السياق الكاملة
مع تقليل استخدام الرموز المميزة.

- **npm:** `@martian-engineering/lossless-claw`
- **المستودع:** [github.com/Martian-Engineering/lossless-claw](https://github.com/Martian-Engineering/lossless-claw)

```bash
openclaw plugins install @martian-engineering/lossless-claw
```

### Opik

Plugin رسمي يصدّر تتبعات الوكيل إلى Opik. راقب سلوك الوكيل،
والتكلفة، والرموز المميزة، والأخطاء، وغير ذلك.

- **npm:** `@opik/opik-openclaw`
- **المستودع:** [github.com/comet-ml/opik-openclaw](https://github.com/comet-ml/opik-openclaw)

```bash
openclaw plugins install @opik/opik-openclaw
```

### Prometheus Avatar

امنح وكيل OpenClaw الخاص بك صورة رمزية Live2D مع مزامنة شفاه فورية، وتعبيرات
عاطفية، وتحويل النص إلى كلام. يتضمن أدوات للمبدعين لتوليد الأصول بالذكاء الاصطناعي
ونشرًا بنقرة واحدة إلى Prometheus Marketplace. وهو حاليًا في مرحلة alpha.

- **npm:** `@prometheusavatar/openclaw-plugin`
- **المستودع:** [github.com/myths-labs/prometheus-avatar](https://github.com/myths-labs/prometheus-avatar)

```bash
openclaw plugins install @prometheusavatar/openclaw-plugin
```

### QQbot

صِل OpenClaw بـ QQ عبر QQ Bot API. يدعم المحادثات الخاصة،
والإشارات داخل المجموعات، ورسائل القنوات، والوسائط الغنية بما في ذلك الصوت،
والصور، والفيديوهات، والملفات.

- **npm:** `@tencent-connect/openclaw-qqbot`
- **المستودع:** [github.com/tencent-connect/openclaw-qqbot](https://github.com/tencent-connect/openclaw-qqbot)

```bash
openclaw plugins install @tencent-connect/openclaw-qqbot
```

### wecom

Plugin قناة WeCom لـ OpenClaw من فريق Tencent WeCom. وهو مدعوم عبر
اتصالات WeCom Bot WebSocket الدائمة، ويدعم
الرسائل المباشرة والدردشات الجماعية، والردود المتدفقة، والمراسلة الاستباقية، ومعالجة الصور/الملفات، وتنسيق Markdown،
والتحكم المدمج في الوصول، وSkills المستندات/الاجتماعات/المراسلة.

- **npm:** `@wecom/wecom-openclaw-plugin`
- **المستودع:** [github.com/WecomTeam/wecom-openclaw-plugin](https://github.com/WecomTeam/wecom-openclaw-plugin)

```bash
openclaw plugins install @wecom/wecom-openclaw-plugin
```

## أرسل Plugin الخاص بك

نرحب بـ Plugins المجتمع المفيدة، والموثقة، والآمنة في التشغيل.

<Steps>
  <Step title="انشر على ClawHub أو npm">
    يجب أن يكون Plugin الخاص بك قابلًا للتثبيت عبر `openclaw plugins install \<package-name\>`.
    انشره على [ClawHub](/ar/tools/clawhub) (مفضّل) أو npm.
    راجع [بناء Plugins](/ar/plugins/building-plugins) للحصول على الدليل الكامل.

  </Step>

  <Step title="استضفه على GitHub">
    يجب أن تكون الشيفرة المصدرية في مستودع عام مع وثائق إعداد ومتعقب
    للمشكلات.

  </Step>

  <Step title="استخدم طلبات سحب الوثائق فقط لتغييرات وثائق المصدر">
    لا تحتاج إلى طلب سحب للوثائق فقط لجعل Plugin الخاص بك قابلًا للاكتشاف. انشره
    على ClawHub بدلًا من ذلك.

    افتح طلب سحب للوثائق فقط عندما تحتاج وثائق OpenClaw المصدرية إلى
    تغيير فعلي في المحتوى، مثل تصحيح إرشادات التثبيت أو إضافة
    توثيق عابر للمستودعات ينتمي إلى مجموعة الوثائق الرئيسية.

  </Step>
</Steps>

## معيار الجودة

| المتطلب                    | السبب                                           |
| -------------------------- | ----------------------------------------------- |
| منشور على ClawHub أو npm   | يحتاج المستخدمون إلى أن يعمل `openclaw plugins install` |
| مستودع GitHub عام          | مراجعة المصدر، وتتبع المشكلات، والشفافية       |
| وثائق إعداد واستخدام       | يحتاج المستخدمون إلى معرفة كيفية تكوينه         |
| صيانة نشطة                 | تحديثات حديثة أو تعامل سريع مع المشكلات         |

قد يتم رفض المغلفات منخفضة الجهد، أو الملكية غير الواضحة، أو الحزم غير المصانة.

## ذو صلة

- [تثبيت Plugins وتكوينها](/ar/tools/plugin) — كيفية تثبيت أي Plugin
- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin الخاص بك
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان
