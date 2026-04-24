---
read_when:
    - تريد تثبيت حزمة متوافقة مع Codex أو Claude أو Cursor
    - تحتاج إلى فهم كيفية تعيين OpenClaw لمحتوى الحزمة إلى الميزات الأصلية فيه
    - أنت تصحّح اكتشاف الحِزم أو القدرات المفقودة
summary: تثبيت واستخدام حِزم Codex وClaude وCursor كـ Plugins في OpenClaw
title: حِزم Plugins
x-i18n:
    generated_at: "2026-04-24T07:53:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a455eaa64b227204ca4e2a6283644edb72d7a4cfad0f2fcf4439d061dcb374bc
    source_path: plugins/bundles.md
    workflow: 15
---

يمكن لـ OpenClaw تثبيت Plugins من ثلاثة أنظمة بيئية خارجية: **Codex** و**Claude**،
و**Cursor**. وتُسمى هذه **حِزمًا** — وهي حزم محتوى وبيانات تعريف
يقوم OpenClaw بتعيينها إلى ميزات أصلية مثل Skills، وhooks، وأدوات MCP.

<Info>
  لا تُعد الحِزم **مطابقة** لـ Plugins الأصلية في OpenClaw. تعمل Plugins الأصلية
  داخل العملية ويمكنها تسجيل أي قدرة. أما الحِزم فهي حزم محتوى مع
  تعيين انتقائي للميزات وحد ثقة أضيق.
</Info>

## لماذا توجد الحِزم

يتم نشر كثير من Plugins المفيدة بصيغة Codex أو Claude أو Cursor. وبدلًا
من مطالبة المؤلفين بإعادة كتابتها كـ Plugins أصلية في OpenClaw، يقوم OpenClaw
باكتشاف هذه الصيغ وتعيين محتواها المدعوم إلى مجموعة الميزات الأصلية. وهذا يعني أنه يمكنك تثبيت حزمة أوامر Claude أو حزمة Skills من Codex
واستخدامها فورًا.

## تثبيت حزمة

<Steps>
  <Step title="ثبّت من دليل أو أرشيف أو marketplace">
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

  <Step title="تحقق من الاكتشاف">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    تظهر الحِزم بصيغة `Format: bundle` مع نوع فرعي `codex` أو `claude` أو `cursor`.

  </Step>

  <Step title="أعد التشغيل واستخدمها">
    ```bash
    openclaw gateway restart
    ```

    تصبح الميزات المعينة (Skills، وhooks، وأدوات MCP، وافتراضيات LSP) متاحة في الجلسة التالية.

  </Step>
</Steps>

## ما الذي يعينه OpenClaw من الحِزم

ليست كل ميزات الحزمة تعمل داخل OpenClaw اليوم. إليك ما يعمل وما
يتم اكتشافه لكنه غير موصول بعد.

### المدعوم الآن

| الميزة | كيف يتم تعيينها | ينطبق على |
| ------ | --------------- | --------- |
| محتوى Skills | يتم تحميل جذور Skills الخاصة بالحزمة كـ Skills عادية في OpenClaw | جميع الصيغ |
| الأوامر | تتم معاملة `commands/` و`.cursor/commands/` كجذور Skills | Claude، Cursor |
| حزم Hook | تخطيطات `HOOK.md` + `handler.ts` على نمط OpenClaw | Codex |
| أدوات MCP | يتم دمج إعدادات MCP الخاصة بالحزمة في إعدادات Pi المضمنة؛ ويتم تحميل خوادم stdio وHTTP المدعومة | جميع الصيغ |
| خوادم LSP | يتم دمج `Claude .lsp.json` و`lspServers` المعلنة في manifest في افتراضيات LSP المضمنة في Pi | Claude |
| الإعدادات | يتم استيراد `Claude settings.json` كافتراضيات Pi مضمنة | Claude |

#### محتوى Skills

- يتم تحميل جذور Skills الخاصة بالحزمة كجذور Skills عادية في OpenClaw
- تُعامل جذور `commands` الخاصة بـ Claude كجذور Skills إضافية
- تُعامل جذور `.cursor/commands` الخاصة بـ Cursor كجذور Skills إضافية

وهذا يعني أن ملفات أوامر Claude المكتوبة بـ markdown تعمل عبر محمّل Skills العادي
في OpenClaw. كما تعمل أوامر Cursor المكتوبة بـ markdown عبر المسار نفسه.

#### حزم Hook

- تعمل جذور hooks الخاصة بالحزمة **فقط** عندما تستخدم تخطيط
  حزم hooks العادي في OpenClaw. واليوم هذه هي أساسًا الحالة المتوافقة مع Codex:
  - `HOOK.md`
  - `handler.ts` أو `handler.js`

#### MCP لـ Pi

- يمكن للحِزم المفعّلة أن تساهم في إعدادات خادم MCP
- يدمج OpenClaw إعدادات MCP الخاصة بالحزمة في إعدادات Pi المضمنة الفعالة على شكل
  `mcpServers`
- يكشف OpenClaw أدوات MCP المدعومة القادمة من الحزمة أثناء أدوار الوكيل Pi المضمنة
  من خلال تشغيل خوادم stdio أو الاتصال بخوادم HTTP
- تتضمن ملفات الأدوات `coding` و`messaging` أدوات MCP الخاصة بالحزمة
  افتراضيًا؛ استخدم `tools.deny: ["bundle-mcp"]` لإلغاء الاشتراك لوكيل أو gateway
- تظل إعدادات Pi المحلية الخاصة بالمشروع مُطبّقة بعد افتراضيات الحزمة، بحيث
  يمكن لإعدادات مساحة العمل تجاوز إدخالات MCP الخاصة بالحزمة عند الحاجة
- يتم فرز فهارس أدوات MCP الخاصة بالحزمة بشكل حتمي قبل التسجيل، بحيث
  لا تؤدي تغييرات ترتيب `listTools()` في upstream إلى اضطراب كتل أدوات prompt-cache

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

**HTTP** يتصل بخادم MCP يعمل مسبقًا عبر `sse` افتراضيًا، أو `streamable-http` عند الطلب:

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

- يمكن ضبط `transport` إلى `"streamable-http"` أو `"sse"`؛ وعند حذفه يستخدم OpenClaw القيمة `sse`
- يُسمح فقط بمخططي URL ‏`http:` و`https:`
- تدعم قيم `headers` الاستبدال `${ENV_VAR}`
- يتم رفض إدخال الخادم الذي يحتوي على كل من `command` و`url`
- يتم تنقيح بيانات اعتماد URL ‏(userinfo ومعلمات الاستعلام) من أوصاف
  الأدوات والسجلات
- تتجاوز `connectionTimeoutMs` مهلة الاتصال الافتراضية البالغة 30 ثانية لكلا
  النقلين، stdio وHTTP

##### تسمية الأدوات

يسجّل OpenClaw أدوات MCP الخاصة بالحزمة بأسماء آمنة للـ provider بالشكل
`serverName__toolName`. فعلى سبيل المثال، فإن الخادم ذي المفتاح `"vigil-harbor"` الذي يكشف
أداة `memory_search` يُسجَّل على أنه `vigil-harbor__memory_search`.

- يتم استبدال الأحرف خارج `A-Za-z0-9_-` بـ `-`
- تُحدَّد بادئات الخوادم بحد أقصى 30 حرفًا
- تُحدَّد الأسماء الكاملة للأدوات بحد أقصى 64 حرفًا
- تعود أسماء الخوادم الفارغة إلى `mcp`
- يتم فض الاشتباك بين الأسماء المطهرة المتصادمة عبر لواحق رقمية
- يكون ترتيب الأدوات النهائي المكشوف حتميًا حسب الاسم الآمن للحفاظ على
  ثبات cache في أدوار Pi المتكررة
- تتعامل تصفية الملفات الشخصية مع جميع الأدوات القادمة من خادم MCP واحد في الحزمة على أنها مملوكة للـ Plugin
  بواسطة `bundle-mcp`، بحيث يمكن لقوائم السماح والمنع الخاصة بالملفات أن تتضمن
  إما أسماء الأدوات المكشوفة الفردية أو مفتاح Plugin ‏`bundle-mcp`

#### إعدادات Pi المضمنة

- يتم استيراد `Claude settings.json` كإعدادات Pi مضمنة افتراضية عندما
  تكون الحزمة مفعلة
- يقوم OpenClaw بتنقية مفاتيح تجاوز shell قبل تطبيقها

المفاتيح المنقاة:

- `shellPath`
- `shellCommandPrefix`

#### LSP المضمن في Pi

- يمكن لحِزم Claude المفعلة أن تساهم في إعدادات خادم LSP
- يحمّل OpenClaw ‏`.lsp.json` بالإضافة إلى أي مسارات `lspServers` معلنة في manifest
- يتم دمج إعدادات LSP الخاصة بالحزمة في افتراضيات LSP الفعالة المضمنة في Pi
- لا يمكن تشغيل خوادم LSP المدعومة القائمة على stdio إلا اليوم؛ أما النقلات غير المدعومة
  فلا تزال تظهر في `openclaw plugins inspect <id>`

### يتم اكتشافها لكن لا تُنفَّذ

يتم التعرف على هذه الأشياء وإظهارها في التشخيصات، لكن OpenClaw لا يشغلها:

- `agents` الخاصة بـ Claude، وأتمتة `hooks.json`، و`outputStyles`
- `.cursor/agents` و`.cursor/hooks.json` و`.cursor/rules` الخاصة بـ Cursor
- بيانات تعريف Codex الداخلية/الخاصة بالتطبيق خارج نطاق الإبلاغ عن القدرات

## صيغ الحِزم

<AccordionGroup>
  <Accordion title="حِزم Codex">
    العلامات: `.codex-plugin/plugin.json`

    المحتوى الاختياري: `skills/` و`hooks/` و`.mcp.json` و`.app.json`

    تتناسب حِزم Codex مع OpenClaw بشكل أفضل عندما تستخدم جذور Skills وأدلة
    حزم hooks على نمط OpenClaw ‏(`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="حِزم Claude">
    وضعا اكتشاف:

    - **قائم على manifest:** ‏`.claude-plugin/plugin.json`
    - **من دون manifest:** تخطيط Claude الافتراضي (`skills/` و`commands/` و`agents/` و`hooks/` و`.mcp.json` و`.lsp.json` و`settings.json`)

    السلوك الخاص بـ Claude:

    - تُعامل `commands/` على أنها محتوى Skills
    - يتم استيراد `settings.json` إلى إعدادات Pi المضمنة (وتُنقّى مفاتيح تجاوز shell)
    - يكشف `.mcp.json` أدوات stdio المدعومة إلى Pi المضمنة
    - يُحمّل `.lsp.json` بالإضافة إلى مسارات `lspServers` المعلنة في manifest في افتراضيات LSP المضمنة في Pi
    - يتم اكتشاف `hooks/hooks.json` لكنه لا يُنفّذ
    - تكون مسارات المكونات المخصصة في manifest إضافية (فهي توسّع الافتراضيات ولا تستبدلها)

  </Accordion>

  <Accordion title="حِزم Cursor">
    العلامات: `.cursor-plugin/plugin.json`

    المحتوى الاختياري: `skills/` و`.cursor/commands/` و`.cursor/agents/` و`.cursor/rules/` و`.cursor/hooks.json` و`.mcp.json`

    - تُعامل `.cursor/commands/` على أنها محتوى Skills
    - تكون `.cursor/rules/` و`.cursor/agents/` و`.cursor/hooks.json` للاكتشاف فقط

  </Accordion>
</AccordionGroup>

## أولوية الاكتشاف

يفحص OpenClaw أولًا صيغة Plugin الأصلية:

1. `openclaw.plugin.json` أو `package.json` صالح مع `openclaw.extensions` — تُعامل على أنها **Plugin أصلية**
2. علامات الحِزم (`.codex-plugin/` أو `.claude-plugin/` أو التخطيط الافتراضي لـ Claude/Cursor) — تُعامل على أنها **حزمة**

إذا احتوى دليل ما على الاثنين، يستخدم OpenClaw المسار الأصلي. وهذا يمنع
الحزم ثنائية الصيغة من التثبيت جزئيًا كحِزم.

## تبعيات وقت التشغيل والتنظيف

- تُشحن تبعيات وقت تشغيل Plugins المجمّعة داخل حزمة OpenClaw تحت
  `dist/*`. ولا يقوم OpenClaw **بتشغيل** `npm install` عند بدء التشغيل لـ Plugins
  المجمّعة؛ إذ تقع على عاتق مسار الإصدار مسؤولية شحن حمولة تبعيات
  مجمّعة كاملة (راجع قاعدة التحقق بعد النشر في
  [الإصدار](/ar/reference/RELEASING)).

## الأمان

تملك الحِزم حد ثقة أضيق من Plugins الأصلية:

- لا يقوم OpenClaw **بتحميل** وحدات وقت تشغيل عشوائية للحِزم داخل العملية
- يجب أن تبقى مسارات Skills وحزم hooks داخل جذر Plugin ‏(ويتم التحقق من الحدود)
- تُقرأ ملفات الإعدادات باستخدام فحوصات الحدود نفسها
- قد يتم تشغيل خوادم MCP المدعومة عبر stdio كعمليات فرعية

وهذا يجعل الحِزم أكثر أمانًا افتراضيًا، لكن ينبغي لك مع ذلك أن تتعامل مع الحِزم الخارجية باعتبارها محتوى موثوقًا بالنسبة إلى الميزات التي تكشفها.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="يتم اكتشاف الحزمة لكن القدرات لا تعمل">
    شغّل `openclaw plugins inspect <id>`. إذا كانت القدرة مدرجة ولكنها معلَّمة
    بأنها غير موصولة، فهذه حدود في المنتج — وليست تثبيتًا معطّلًا.
  </Accordion>

  <Accordion title="لا تظهر ملفات أوامر Claude">
    تأكد من أن الحزمة مفعلة وأن ملفات markdown موجودة داخل جذر
    `commands/` أو `skills/` تم اكتشافه.
  </Accordion>

  <Accordion title="لا يتم تطبيق إعدادات Claude">
    لا يتم دعم إلا إعدادات Pi المضمنة القادمة من `settings.json`. ولا يتعامل OpenClaw
    مع إعدادات الحزمة على أنها تصحيحات إعداد خامة.
  </Accordion>

  <Accordion title="لا يتم تنفيذ hooks الخاصة بـ Claude">
    يكون `hooks/hooks.json` للاكتشاف فقط. وإذا كنت تحتاج إلى hooks قابلة للتشغيل، فاستخدم
    تخطيط حزم hooks في OpenClaw أو اشحن Plugin أصلية.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [تثبيت وتهيئة Plugins](/ar/tools/plugin)
- [Building Plugins](/ar/plugins/building-plugins) — إنشاء Plugin أصلية
- [Plugin Manifest](/ar/plugins/manifest) — مخطط manifest الأصلي
