---
read_when:
    - تريد تثبيت حزمة متوافقة مع Codex أو Claude أو Cursor
    - تحتاج إلى فهم كيف يربط OpenClaw محتوى الحزمة بالميزات الأصلية
    - أنت تعمل على تصحيح أخطاء اكتشاف الحزمة أو القدرات المفقودة
summary: ثبّت حزم Codex وClaude وCursor واستخدمها كـ Plugins في OpenClaw
title: حزم Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f92bb91369f0f5ddd8d960962e875323bb53173b4faebe4ef453d2f2a08826
    source_path: plugins/bundles.md
    workflow: 16
---

يمكن لـ OpenClaw تثبيت Plugins من ثلاثة أنظمة بيئية خارجية: **Codex** و**Claude**
و**Cursor**. وتُسمى هذه **حِزمًا** — وهي حِزم محتوى وبيانات وصفية
يربطها OpenClaw بميزات أصلية مثل Skills والخطافات وأدوات MCP.

<Info>
  الحِزم **ليست** مثل Plugins OpenClaw الأصلية. تعمل Plugins الأصلية
  داخل العملية ويمكنها تسجيل أي قدرة. أما الحِزم فهي حِزم محتوى مع
  ربط انتقائي للميزات وحد ثقة أضيق.
</Info>

## لماذا توجد الحِزم

تُنشر العديد من Plugins المفيدة بتنسيق Codex أو Claude أو Cursor. وبدلًا
من مطالبة المؤلفين بإعادة كتابتها كـ Plugins OpenClaw أصلية، يكتشف OpenClaw
هذه التنسيقات ويربط محتواها المدعوم بمجموعة الميزات الأصلية. وهذا يعني أنه
يمكنك تثبيت حزمة أوامر Claude أو حزمة Skills من Codex واستخدامها فورًا.

## تثبيت حزمة

<Steps>
  <Step title="التثبيت من دليل أو أرشيف أو سوق">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="التحقق من الاكتشاف">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    تظهر الحِزم كـ `Format: bundle` مع نوع فرعي هو `codex` أو `claude` أو `cursor`.

  </Step>

  <Step title="إعادة التشغيل والاستخدام">
    ```bash
    openclaw gateway restart
    ```

    تتوفر الميزات المرتبطة (Skills والخطافات وأدوات MCP وافتراضيات LSP) في الجلسة التالية.

  </Step>
</Steps>

## ما الذي يربطه OpenClaw من الحِزم

لا تعمل كل ميزة في الحِزم داخل OpenClaw اليوم. إليك ما يعمل وما
يُكتشف لكنه لم يُوصّل بعد.

### مدعوم الآن

| الميزة        | كيفية ربطها                                                                                 | ينطبق على      |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| محتوى Skills  | تُحمّل جذور Skills في الحزمة كـ Skills عادية في OpenClaw                                    | كل التنسيقات   |
| الأوامر       | تُعامل `commands/` و`.cursor/commands/` كجذور Skills                                       | Claude وCursor |
| حِزم الخطافات | تخطيطات OpenClaw-style `HOOK.md` + `handler.ts`                                             | Codex          |
| أدوات MCP     | تُدمج تهيئة MCP في الحزمة داخل إعدادات Pi المضمنة؛ وتُحمّل خوادم stdio وHTTP المدعومة      | كل التنسيقات   |
| خوادم LSP     | تُدمج `.lsp.json` في Claude و`lspServers` المعلنة في البيان داخل افتراضيات LSP لـ Pi المضمن | Claude         |
| الإعدادات     | تُستورد `settings.json` الخاصة بـ Claude كافتراضيات Pi مضمنة                                | Claude         |

#### محتوى Skills

- تُحمّل جذور Skills في الحزمة كجذور Skills عادية في OpenClaw
- تُعامل جذور `commands` في Claude كجذور Skills إضافية
- تُعامل جذور `.cursor/commands` في Cursor كجذور Skills إضافية

وهذا يعني أن ملفات أوامر markdown في Claude تعمل عبر محمّل Skills العادي في
OpenClaw. وتعمل ملفات markdown لأوامر Cursor عبر المسار نفسه.

#### حِزم الخطافات

- تعمل جذور الخطافات في الحزمة **فقط** عندما تستخدم تخطيط حزمة الخطافات
  العادي في OpenClaw. واليوم تكون هذه أساسًا حالة التوافق مع Codex:
  - `HOOK.md`
  - `handler.ts` أو `handler.js`

#### MCP لـ Pi

- يمكن للحِزم المفعّلة المساهمة بتهيئة خادم MCP
- يدمج OpenClaw تهيئة MCP الخاصة بالحزمة داخل إعدادات Pi المضمنة الفعالة باسم
  `mcpServers`
- يعرض OpenClaw أدوات MCP المدعومة من الحِزم أثناء أدوار وكيل Pi المضمن عبر
  تشغيل خوادم stdio أو الاتصال بخوادم HTTP
- يتضمن ملفا تعريف الأدوات `coding` و`messaging` أدوات MCP الخاصة بالحِزم
  افتراضيًا؛ استخدم `tools.deny: ["bundle-mcp"]` لإلغاء الاشتراك لوكيل أو Gateway
- تظل إعدادات Pi المحلية للمشروع مطبقة بعد افتراضيات الحزمة، لذا يمكن لإعدادات
  مساحة العمل تجاوز إدخالات MCP الخاصة بالحزمة عند الحاجة
- تُفرز كتالوجات أدوات MCP الخاصة بالحِزم بشكل حتمي قبل التسجيل، بحيث لا تؤدي
  تغييرات ترتيب `listTools()` من المصدر إلى اضطراب كتل أدوات ذاكرة التخزين المؤقت للمطالبات

##### وسائل النقل

يمكن لخوادم MCP استخدام نقل stdio أو HTTP:

**Stdio** يشغّل عملية فرعية:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP** يتصل بخادم MCP قيد التشغيل عبر `sse` افتراضيًا، أو `streamable-http` عند طلب ذلك:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- يمكن تعيين `transport` إلى `"streamable-http"` أو `"sse"`؛ وعند حذفه يستخدم OpenClaw القيمة `sse`
- يُعد `type: "http"` شكلًا تابعًا أصليًا لـ CLI؛ استخدم `transport: "streamable-http"` في تهيئة OpenClaw. يقوم `openclaw mcp set` و`openclaw doctor --fix` بتطبيع الاسم المستعار الشائع.
- لا يُسمح إلا بمخططات URL `http:` و`https:`
- تدعم قيم `headers` استيفاء `${ENV_VAR}`
- يُرفض إدخال الخادم الذي يحتوي على كل من `command` و`url`
- تُحجب بيانات اعتماد URL (معلومات المستخدم ومعلمات الاستعلام) من أوصاف
  الأدوات والسجلات
- يتجاوز `connectionTimeoutMs` مهلة الاتصال الافتراضية البالغة 30 ثانية لكل
  من نقلي stdio وHTTP

##### تسمية الأدوات

يسجل OpenClaw أدوات MCP الخاصة بالحِزم بأسماء آمنة للمزوّدين بالصيغة
`serverName__toolName`. على سبيل المثال، الخادم ذي المفتاح `"vigil-harbor"` الذي يعرض أداة
`memory_search` يُسجل باسم `vigil-harbor__memory_search`.

- تُستبدل الأحرف خارج `A-Za-z0-9_-` بـ `-`
- تحصل الأجزاء التي قد تبدأ بحرف غير أبجدي على بادئة حرف، بحيث تصبح مفاتيح
  الخوادم الرقمية مثل `12306` بادئات أدوات آمنة للمزوّدين
- تُحد بادئات الخوادم بـ 30 حرفًا
- تُحد أسماء الأدوات الكاملة بـ 64 حرفًا
- تعود أسماء الخوادم الفارغة إلى `mcp`
- تُميّز الأسماء المنقّاة المتصادمة بلاحقات رقمية
- يكون ترتيب الأدوات النهائي المعروض حتميًا حسب الاسم الآمن للحفاظ على ثبات
  ذاكرة التخزين المؤقت عبر أدوار Pi المتكررة
- يعامل ترشيح ملف التعريف كل الأدوات من خادم MCP واحد ضمن الحزمة كأنها مملوكة
  لـ Plugin باسم `bundle-mcp`، لذا يمكن لقوائم السماح وقوائم الرفض في ملفات
  التعريف تضمين أسماء الأدوات المعروضة الفردية أو مفتاح Plugin `bundle-mcp`

#### إعدادات Pi المضمنة

- تُستورد `settings.json` الخاصة بـ Claude كإعدادات Pi مضمنة افتراضية عندما
  تكون الحزمة مفعّلة
- ينقّي OpenClaw مفاتيح تجاوز shell قبل تطبيقها

المفاتيح المنقّاة:

- `shellPath`
- `shellCommandPrefix`

#### LSP لـ Pi المضمن

- يمكن لحِزم Claude المفعّلة المساهمة بتهيئة خادم LSP
- يحمّل OpenClaw ملف `.lsp.json` بالإضافة إلى أي مسارات `lspServers` معلنة في البيان
- تُدمج تهيئة LSP الخاصة بالحزمة داخل افتراضيات LSP الفعالة لـ Pi المضمن
- لا يمكن تشغيل إلا خوادم LSP المدعومة القائمة على stdio اليوم؛ وتظل وسائل
  النقل غير المدعومة ظاهرة في `openclaw plugins inspect <id>`

### مكتشف لكنه غير منفّذ

هذه العناصر معروفة وتظهر في التشخيصات، لكن OpenClaw لا يشغّلها:

- `agents` في Claude، وأتمتة `hooks.json`، و`outputStyles`
- `.cursor/agents` و`.cursor/hooks.json` و`.cursor/rules` في Cursor
- بيانات Codex الوصفية المضمنة/الخاصة بالتطبيق خارج تقارير القدرات

## تنسيقات الحِزم

<AccordionGroup>
  <Accordion title="حِزم Codex">
    العلامات: `.codex-plugin/plugin.json`

    المحتوى الاختياري: `skills/`، و`hooks/`، و`.mcp.json`، و`.app.json`

    تناسب حِزم Codex OpenClaw أفضل عندما تستخدم جذور Skills وأدلة حِزم
    خطافات OpenClaw-style (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="حِزم Claude">
    وضعا اكتشاف:

    - **قائم على البيان:** `.claude-plugin/plugin.json`
    - **بلا بيان:** تخطيط Claude الافتراضي (`skills/`، و`commands/`، و`agents/`، و`hooks/`، و`.mcp.json`، و`.lsp.json`، و`settings.json`)

    سلوك خاص بـ Claude:

    - يُعامل `commands/` كمحتوى Skills
    - تُستورد `settings.json` داخل إعدادات Pi المضمنة (تُنقّى مفاتيح تجاوز shell)
    - تعرض `.mcp.json` أدوات stdio المدعومة لـ Pi المضمن
    - تُحمّل `.lsp.json` بالإضافة إلى مسارات `lspServers` المعلنة في البيان داخل افتراضيات LSP لـ Pi المضمن
    - يُكتشف `hooks/hooks.json` لكنه لا يُنفّذ
    - تكون مسارات المكوّنات المخصصة في البيان إضافية (توسّع الافتراضيات ولا تستبدلها)

  </Accordion>

  <Accordion title="حِزم Cursor">
    العلامات: `.cursor-plugin/plugin.json`

    المحتوى الاختياري: `skills/`، و`.cursor/commands/`، و`.cursor/agents/`، و`.cursor/rules/`، و`.cursor/hooks.json`، و`.mcp.json`

    - يُعامل `.cursor/commands/` كمحتوى Skills
    - تكون `.cursor/rules/` و`.cursor/agents/` و`.cursor/hooks.json` للاكتشاف فقط

  </Accordion>
</AccordionGroup>

## أسبقية الاكتشاف

يتحقق OpenClaw أولًا من تنسيق Plugin الأصلي:

1. `openclaw.plugin.json` أو `package.json` صالح مع `openclaw.extensions` — يُعامل كـ **Plugin أصلي**
2. علامات الحِزم (`.codex-plugin/` أو `.claude-plugin/` أو تخطيط Claude/Cursor الافتراضي) — تُعامل كـ **حزمة**

إذا احتوى دليل على كليهما، يستخدم OpenClaw المسار الأصلي. وهذا يمنع
الحِزم مزدوجة التنسيق من التثبيت جزئيًا كحِزم.

## تبعيات وقت التشغيل والتنظيف

- لا تحصل الحِزم المتوافقة التابعة لجهات خارجية على إصلاح `npm install` عند بدء التشغيل. يجب
  تثبيتها عبر `openclaw plugins install` وشحن كل ما تحتاجه في دليل Plugin
  المثبت.
- تكون Plugins المضمّنة المملوكة لـ OpenClaw إما مشحونة بخفة داخل النواة أو
  قابلة للتنزيل عبر مثبّت Plugin. لا يشغّل بدء تشغيل Gateway مدير حزم لها أبدًا.
- يزيل `openclaw doctor --fix` أدلة التبعيات المرحلية القديمة ويمكنه استرداد
  Plugins القابلة للتنزيل المفقودة من فهرس Plugin المحلي عندما تشير إليها
  التهيئة.

## الأمان

للحِزم حد ثقة أضيق من Plugins الأصلية:

- لا يحمّل OpenClaw وحدات وقت تشغيل عشوائية من الحزمة داخل العملية
- يجب أن تبقى مسارات Skills وحِزم الخطافات داخل جذر Plugin (مع فحص الحدود)
- تُقرأ ملفات الإعدادات بفحوص الحدود نفسها
- قد تُشغّل خوادم MCP المدعومة عبر stdio كعمليات فرعية

وهذا يجعل الحِزم أكثر أمانًا افتراضيًا، لكن ينبغي لك مع ذلك التعامل مع حِزم
الجهات الخارجية كمحتوى موثوق للميزات التي تعرضها.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="اكتُشفت الحزمة لكن القدرات لا تعمل">
    شغّل `openclaw plugins inspect <id>`. إذا كانت القدرة مدرجة لكنها معلّمة
    على أنها غير موصلة، فهذا حد للمنتج — وليس تثبيتًا معطلًا.
  </Accordion>

  <Accordion title="ملفات أوامر Claude لا تظهر">
    تأكد من أن الحزمة مفعّلة وأن ملفات markdown موجودة داخل جذر
    `commands/` أو `skills/` مكتشف.
  </Accordion>

  <Accordion title="إعدادات Claude لا تُطبق">
    لا تُدعم إلا إعدادات Pi المضمنة من `settings.json`. لا يتعامل OpenClaw مع
    إعدادات الحِزم كتصحيحات تهيئة خام.
  </Accordion>

  <Accordion title="خطافات Claude لا تُنفّذ">
    `hooks/hooks.json` للاكتشاف فقط. إذا كنت تحتاج إلى خطافات قابلة للتشغيل،
    فاستخدم تخطيط حزمة الخطافات في OpenClaw أو اشحن Plugin أصليًا.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [تثبيت Plugins وتهيئتها](/ar/tools/plugin)
- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin أصليًا
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان الأصلي
