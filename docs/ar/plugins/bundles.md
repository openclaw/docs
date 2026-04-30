---
read_when:
    - تريد تثبيت حزمة متوافقة مع Codex أو Claude أو Cursor
    - تحتاج إلى فهم كيفية ربط OpenClaw محتوى الحزمة بالميزات الأصلية
    - تعمل على تصحيح أخطاء اكتشاف الحزمة أو الإمكانات المفقودة
summary: ثبّت واستخدم حزم Codex وClaude وCursor كـ Plugins في OpenClaw
title: حزم Plugin
x-i18n:
    generated_at: "2026-04-30T08:12:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

يمكن لـ OpenClaw تثبيت Plugins من ثلاثة أنظمة بيئية خارجية: **Codex** و**Claude**
و**Cursor**. تُسمى هذه **حِزَمًا** — حزم محتوى وبيانات وصفية يربطها
OpenClaw بميزات أصلية مثل Skills والخطافات وأدوات MCP.

<Info>
  الحِزَم **ليست** مثل Plugins الأصلية في OpenClaw. تعمل Plugins الأصلية
  داخل العملية ويمكنها تسجيل أي قدرة. أما الحِزَم فهي حزم محتوى مع
  ربط انتقائي للميزات وحد ثقة أضيق.
</Info>

## لماذا توجد الحِزَم

تُنشر كثير من Plugins المفيدة بصيغة Codex أو Claude أو Cursor. بدلًا
من مطالبة المؤلفين بإعادة كتابتها كـ Plugins أصلية في OpenClaw، يكتشف
OpenClaw هذه الصيغ ويربط محتواها المدعوم بمجموعة الميزات الأصلية. وهذا
يعني أنه يمكنك تثبيت حزمة أوامر Claude أو حزمة Skills من Codex
واستخدامها فورًا.

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

    تظهر الحِزَم كـ `Format: bundle` مع نوع فرعي هو `codex` أو `claude` أو `cursor`.

  </Step>

  <Step title="إعادة التشغيل والاستخدام">
    ```bash
    openclaw gateway restart
    ```

    تصبح الميزات المربوطة (Skills والخطافات وأدوات MCP وافتراضات LSP) متاحة في الجلسة التالية.

  </Step>
</Steps>

## ما الذي يربطه OpenClaw من الحِزَم

ليست كل ميزة في الحِزَم تعمل في OpenClaw اليوم. إليك ما يعمل وما
يُكتشف لكنه لم يُوصل بعد.

### مدعوم الآن

| الميزة        | كيفية الربط                                                                                 | ينطبق على      |
| ------------- | ------------------------------------------------------------------------------------------- | -------------- |
| محتوى Skill | تُحمَّل جذور Skills في الحزمة كـ Skills عادية في OpenClaw                                           | كل الصيغ    |
| الأوامر      | يُعامَل `commands/` و`.cursor/commands/` كجذور Skills                                  | Claude, Cursor |
| حزم الخطافات    | تخطيطات OpenClaw-style `HOOK.md` + `handler.ts`                                             | Codex          |
| أدوات MCP     | تُدمج تهيئة MCP الخاصة بالحزمة في إعدادات Pi المضمنة؛ وتُحمَّل خوادم stdio وHTTP المدعومة | كل الصيغ    |
| خوادم LSP   | تُدمج `.lsp.json` من Claude و`lspServers` المعلنة في البيان ضمن افتراضات LSP الخاصة بـ Pi المضمنة  | Claude         |
| الإعدادات      | يُستورد `settings.json` من Claude كافتراضات Pi مضمنة                                     | Claude         |

#### محتوى Skill

- تُحمَّل جذور Skills في الحزمة كجذور Skills عادية في OpenClaw
- تُعامَل جذور `commands` في Claude كجذور Skills إضافية
- تُعامَل جذور `.cursor/commands` في Cursor كجذور Skills إضافية

هذا يعني أن ملفات أوامر Markdown في Claude تعمل عبر محمّل Skills العادي
في OpenClaw. وتعمل أوامر Markdown في Cursor عبر المسار نفسه.

#### حزم الخطافات

- تعمل جذور الخطافات في الحزمة **فقط** عندما تستخدم تخطيط حزمة الخطافات
  العادي في OpenClaw. اليوم، هذه هي الحالة المتوافقة مع Codex أساسًا:
  - `HOOK.md`
  - `handler.ts` أو `handler.js`

#### MCP لـ Pi

- يمكن للحِزَم المفعّلة أن تساهم بتهيئة خادم MCP
- يدمج OpenClaw تهيئة MCP الخاصة بالحزمة في إعدادات Pi المضمنة الفعالة باسم
  `mcpServers`
- يعرض OpenClaw أدوات MCP المدعومة من الحزمة أثناء أدوار وكيل Pi المضمن من خلال
  تشغيل خوادم stdio أو الاتصال بخوادم HTTP
- تتضمن ملفات تعريف الأدوات `coding` و`messaging` أدوات MCP الخاصة بالحزمة
  افتراضيًا؛ استخدم `tools.deny: ["bundle-mcp"]` لإلغاء الاشتراك لوكيل أو Gateway
- تظل إعدادات Pi المحلية للمشروع مطبقة بعد افتراضات الحزمة، لذلك يمكن لإعدادات
  مساحة العمل تجاوز إدخالات MCP الخاصة بالحزمة عند الحاجة
- تُرتب كتالوجات أدوات MCP الخاصة بالحزمة بشكل حتمي قبل التسجيل، لذلك
  لا تؤدي تغييرات ترتيب `listTools()` من المصدر إلى اضطراب كتل أدوات ذاكرة التخزين المؤقت للمطالبات

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

**HTTP** يتصل بخادم MCP عامل عبر `sse` افتراضيًا، أو `streamable-http` عند الطلب:

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

- يمكن ضبط `transport` إلى `"streamable-http"` أو `"sse"`؛ عند حذفه، يستخدم OpenClaw `sse`
- `type: "http"` هو شكل لاحق أصلي للـ CLI؛ استخدم `transport: "streamable-http"` في تهيئة OpenClaw. يقوم `openclaw mcp set` و`openclaw doctor --fix` بتطبيع الاسم البديل الشائع.
- يُسمح فقط بمخططات URL من نوع `http:` و`https:`
- تدعم قيم `headers` استيفاء `${ENV_VAR}`
- يُرفض إدخال الخادم الذي يحتوي على كل من `command` و`url`
- تُنقح بيانات اعتماد URL (userinfo ومعلمات الاستعلام) من أوصاف الأدوات
  والسجلات
- يتجاوز `connectionTimeoutMs` مهلة الاتصال الافتراضية البالغة 30 ثانية لكل
  من وسائل نقل stdio وHTTP

##### تسمية الأدوات

يسجل OpenClaw أدوات MCP الخاصة بالحزمة بأسماء آمنة للمزود على الشكل
`serverName__toolName`. على سبيل المثال، خادم مفتاحه `"vigil-harbor"` ويعرض
أداة `memory_search` يُسجل باسم `vigil-harbor__memory_search`.

- تُستبدل الأحرف خارج `A-Za-z0-9_-` بـ `-`
- تُحد بادئات الخادم بـ 30 حرفًا
- تُحد أسماء الأدوات الكاملة بـ 64 حرفًا
- تعود أسماء الخوادم الفارغة إلى `mcp`
- تُزال التباسات الأسماء المنقحة المتصادمة بإضافة لواحق رقمية
- يكون ترتيب الأدوات النهائي المعروض حتميًا حسب الاسم الآمن للحفاظ على استقرار ذاكرة التخزين المؤقت
  في أدوار Pi المتكررة
- يعامل ترشيح ملفات التعريف كل الأدوات من خادم MCP واحد في الحزمة كأدوات مملوكة لـ Plugin
  بواسطة `bundle-mcp`، لذلك يمكن لقوائم السماح والحظر في ملفات التعريف تضمين إما
  أسماء أدوات معروضة فردية أو مفتاح Plugin `bundle-mcp`

#### إعدادات Pi المضمنة

- يُستورد `settings.json` من Claude كإعدادات Pi مضمنة افتراضية عندما تكون
  الحزمة مفعّلة
- ينقح OpenClaw مفاتيح تجاوز الصدفة قبل تطبيقها

المفاتيح المنقحة:

- `shellPath`
- `shellCommandPrefix`

#### LSP الخاص بـ Pi المضمن

- يمكن لحِزَم Claude المفعّلة أن تساهم بتهيئة خادم LSP
- يحمّل OpenClaw ملف `.lsp.json` بالإضافة إلى أي مسارات `lspServers` معلنة في البيان
- تُدمج تهيئة LSP الخاصة بالحزمة في افتراضات LSP الفعالة لـ Pi المضمن
- خوادم LSP المدعومة المعتمدة على stdio فقط قابلة للتشغيل اليوم؛ وتظل وسائل النقل
  غير المدعومة ظاهرة في `openclaw plugins inspect <id>`

### مكتشف لكنه لا يُنفذ

هذه العناصر معروفة وتُعرض في التشخيصات، لكن OpenClaw لا يشغّلها:

- Claude `agents`، وأتمتة `hooks.json`، و`outputStyles`
- Cursor `.cursor/agents`، و`.cursor/hooks.json`، و`.cursor/rules`
- بيانات Codex الوصفية المضمنة/الخاصة بالتطبيق خارج تقارير القدرات

## صيغ الحِزَم

<AccordionGroup>
  <Accordion title="حِزَم Codex">
    العلامات: `.codex-plugin/plugin.json`

    محتوى اختياري: `skills/`، و`hooks/`، و`.mcp.json`، و`.app.json`

    تلائم حِزَم Codex OpenClaw بأفضل شكل عندما تستخدم جذور Skills وأدلة حزم الخطافات
    بأسلوب OpenClaw (`HOOK.md` + `handler.ts`).

  </Accordion>

  <Accordion title="حِزَم Claude">
    وضعا اكتشاف:

    - **معتمد على البيان:** `.claude-plugin/plugin.json`
    - **بلا بيان:** تخطيط Claude الافتراضي (`skills/`، و`commands/`، و`agents/`، و`hooks/`، و`.mcp.json`، و`.lsp.json`، و`settings.json`)

    سلوك خاص بـ Claude:

    - يُعامَل `commands/` كمحتوى Skills
    - يُستورد `settings.json` إلى إعدادات Pi المضمنة (تُنقح مفاتيح تجاوز الصدفة)
    - يعرض `.mcp.json` أدوات stdio المدعومة إلى Pi المضمن
    - يُحمَّل `.lsp.json` بالإضافة إلى مسارات `lspServers` المعلنة في البيان إلى افتراضات LSP الخاصة بـ Pi المضمن
    - يُكتشف `hooks/hooks.json` لكنه لا يُنفذ
    - مسارات المكونات المخصصة في البيان إضافية (توسّع الافتراضات ولا تستبدلها)

  </Accordion>

  <Accordion title="حِزَم Cursor">
    العلامات: `.cursor-plugin/plugin.json`

    محتوى اختياري: `skills/`، و`.cursor/commands/`، و`.cursor/agents/`، و`.cursor/rules/`، و`.cursor/hooks.json`، و`.mcp.json`

    - يُعامَل `.cursor/commands/` كمحتوى Skills
    - `.cursor/rules/` و`.cursor/agents/` و`.cursor/hooks.json` للاكتشاف فقط

  </Accordion>
</AccordionGroup>

## أسبقية الاكتشاف

يتحقق OpenClaw من صيغة Plugin الأصلية أولًا:

1. `openclaw.plugin.json` أو `package.json` صالح يحتوي على `openclaw.extensions` — يُعامَل كـ **Plugin أصلي**
2. علامات الحزمة (`.codex-plugin/` أو `.claude-plugin/` أو تخطيط Claude/Cursor الافتراضي) — تُعامَل كـ **حزمة**

إذا احتوى دليل على كليهما، يستخدم OpenClaw المسار الأصلي. هذا يمنع
الحزم ذات الصيغتين من التثبيت جزئيًا كحِزَم.

## تبعيات وقت التشغيل والتنظيف

- لا تحصل الحِزَم المتوافقة التابعة لجهات خارجية على إصلاح `npm install` عند بدء التشغيل. يجب
  تثبيتها عبر `openclaw plugins install` وأن تشحن كل ما
  تحتاجه داخل دليل Plugin المثبت.
- لدى Plugins المحزمة والمملوكة لـ OpenClaw استثناء ضيق: عندما تكون إحداها
  مفعّلة، يمكن لبدء تشغيل Gateway إصلاح تبعيات وقت التشغيل المعلنة المفقودة
  قبل الاستيراد. يمكن للمشغلين فحص تلك المرحلة أو إصلاحها باستخدام
  `openclaw plugins deps`.
- تظل مسارات الإصدار مسؤولة عن شحن حمولة تبعيات محزمة كاملة
  عندما يكون ذلك ممكنًا (راجع قاعدة التحقق بعد النشر في
  [الإصدار](/ar/reference/RELEASING)).

## الأمان

للحِزَم حد ثقة أضيق من Plugins الأصلية:

- لا يحمّل OpenClaw وحدات وقت تشغيل عشوائية من الحزمة داخل العملية
- يجب أن تبقى مسارات Skills وحزم الخطافات داخل جذر Plugin (مع فحص الحدود)
- تُقرأ ملفات الإعدادات بفحوص الحدود نفسها
- يمكن تشغيل خوادم MCP المدعومة عبر stdio كعمليات فرعية

هذا يجعل الحِزَم أكثر أمانًا افتراضيًا، لكن يجب عليك مع ذلك التعامل مع
حِزَم الجهات الخارجية كمحتوى موثوق للميزات التي تعرضها.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="تم اكتشاف الحزمة لكن القدرات لا تعمل">
    شغّل `openclaw plugins inspect <id>`. إذا كانت القدرة مدرجة لكنها مميزة بأنها
    غير موصلة، فهذا حد في المنتج — وليس تثبيتًا معطوبًا.
  </Accordion>

  <Accordion title="ملفات أوامر Claude لا تظهر">
    تأكد من أن الحزمة مفعّلة وأن ملفات Markdown داخل جذر مكتشف من نوع
    `commands/` أو `skills/`.
  </Accordion>

  <Accordion title="إعدادات Claude لا تُطبق">
    لا تُدعم إلا إعدادات Pi المضمنة من `settings.json`. لا يعامل OpenClaw
    إعدادات الحزمة كتصحيحات تهيئة خام.
  </Accordion>

  <Accordion title="خطافات Claude لا تُنفذ">
    `hooks/hooks.json` للاكتشاف فقط. إذا كنت تحتاج إلى خطافات قابلة للتشغيل، فاستخدم
    تخطيط حزمة الخطافات في OpenClaw أو اشحن Plugin أصليًا.
  </Accordion>
</AccordionGroup>

## ذات صلة

- [تثبيت Plugins وتهيئتها](/ar/tools/plugin)
- [بناء Plugins](/ar/plugins/building-plugins) — أنشئ Plugin أصليًا
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان الأصلي
