---
read_when:
    - تريد استخدام GitHub Copilot كمزوّد للنماذج
    - أنت بحاجة إلى تدفق `openclaw models auth login-github-copilot`
    - أنت تختار بين موفّر Copilot المضمّن، وحاضنة Copilot SDK، ووكيل Copilot.
summary: سجّل الدخول إلى GitHub Copilot من OpenClaw باستخدام تدفق الجهاز أو استيراد الرمز المميز غير التفاعلي
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T06:22:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot هو مساعد البرمجة بالذكاء الاصطناعي من GitHub. وهو يتيح الوصول إلى نماذج Copilot
لحسابك وخطتك على GitHub. يمكن لـ OpenClaw استخدام Copilot بوصفه موفّر نماذج
أو بيئة تشغيل للوكيل بثلاث طرق مختلفة.

## ثلاث طرق لاستخدام Copilot في OpenClaw

<Tabs>
  <Tab title="الموفّر المضمّن (github-copilot)">
    استخدم تدفق تسجيل الدخول الأصلي عبر الجهاز للحصول على رمز GitHub، ثم استبدله
    برموز Copilot API عند تشغيل OpenClaw. هذا هو المسار **الافتراضي** والأبسط
    لأنه لا يتطلب VS Code.

    <Steps>
      <Step title="تشغيل أمر تسجيل الدخول">
        ```bash
        openclaw models auth login-github-copilot
        ```

        سيُطلب منك زيارة عنوان URL وإدخال رمز يُستخدم مرة واحدة. أبقِ
        الطرفية مفتوحة حتى يكتمل الإجراء.
      </Step>
      <Step title="تعيين نموذج افتراضي">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        أو في الإعدادات:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin لحاضنة Copilot SDK (copilot)">
    ثبّت Plugin الخارجي `@openclaw/copilot` عندما تريد أن تتولى
    Copilot CLI وSDK من GitHub حلقة الوكيل منخفضة المستوى لنماذج
    `github-copilot/*` المحددة.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    ثم فعّل بيئة التشغيل لنموذج أو موفّر:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    اختر هذا عندما تريد جلسات Copilot CLI الأصلية، وحالة سلاسل المحادثات
    التي تديرها SDK، وCompaction الذي يديره Copilot لتلك الأدوار التي ينفذها الوكيل. من دون
    التفعيل الصريح عبر `agentRuntime`، تستمر نماذج `github-copilot/*` في استخدام
    الموفّر المضمّن. راجع [حاضنة Copilot SDK](/ar/plugins/copilot) للاطلاع على عقد
    بيئة التشغيل الكامل.

  </Tab>

  <Tab title="Plugin وكيل Copilot (copilot-proxy)">
    استخدم إضافة VS Code المسماة **Copilot Proxy** بوصفها جسرًا محليًا. يتصل OpenClaw
    بنقطة النهاية `/v1` للوكيل (الافتراضية `http://localhost:3000/v1`) ويستخدم
    قائمة النماذج التي تضبطها.

    يأتي Plugin المسمى `copilot-proxy` مع OpenClaw ويكون مفعّلًا افتراضيًا.
    اضبط عنوان URL الأساسي ومعرّفات النماذج باستخدام:

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    اختر هذا عندما تكون قد شغّلت Copilot Proxy بالفعل في VS Code أو تحتاج إلى التوجيه
    من خلاله. يجب أن تظل إضافة VS Code قيد التشغيل.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (إقامة البيانات)

إذا كانت مؤسستك تستخدم مستأجر GitHub Enterprise لإقامة البيانات (مضيفًا
من نوع `*.ghe.com` مثل `your-org.ghe.com`)، فإن Copilot يعمل على نقاط نهاية
محلية للمستأجر بدلًا من `github.com` العام. يوفّر OpenClaw هذا بوصفه
خيار مصادقة أصيلًا، فلا تحتاج إلى تعديل عناوين URL يدويًا.

<Steps>
  <Step title="اختيار خيار مصادقة Enterprise">
    في الإعداد الأولي أو `openclaw models auth`، اختر
    **GitHub Copilot (Enterprise / data residency)**. سيُطلب منك إدخال
    نطاق Enterprise الخاص بك (مثل `your-org.ghe.com`)، ثم يُنفَّذ تسجيل الدخول
    عبر الجهاز على ذلك المستأجر.

    أدخل جذر المستأجر فقط (`your-org.ghe.com`). لا تُقبل مضيفات الخدمات المشتقة
    مثل `api.your-org.ghe.com` أو `copilot-api.your-org.ghe.com`؛
    يشتق OpenClaw نقاط النهاية هذه تلقائيًا من جذر المستأجر.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="حفظ النطاق في الإعدادات">
    يُخزَّن المضيف المختار ضمن معاملات الموفّر، بحيث تستهدف عمليات تحديث الرمز
    والإكمال اللاحقة المستأجر تلقائيًا:

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

يتم توجيه تدفق الجهاز، واستبدال الرمز، وعمليات الإكمال على الترتيب إلى
`https://your-org.ghe.com/login/device/code`،
و`https://api.your-org.ghe.com/copilot_internal/v2/token`،
و`https://copilot-api.your-org.ghe.com`. تحمل رموز إقامة البيانات
وسمًا للمستأجر ولا تتضمن تلميحًا للوكيل، لذا يعود عنوان URL الأساسي للإكمال إلى
مضيف Copilot الخاص بالمستأجر بدلًا من نقطة النهاية العامة.

<Note>
يؤدي تبديل النطاقات دائمًا إلى إعادة تشغيل تسجيل الدخول عبر الجهاز. إذا كان لديك بالفعل رمز
Copilot مخزّن واخترت نطاقًا مختلفًا (`github.com` العام ↔ مستأجر
`*.ghe.com`، أو من مستأجر إلى آخر)، فلن يعيد OpenClaw استخدام الرمز الحالي —
بل يفرض تسجيل دخول جديدًا كي يقتصر نطاق الرمز على النطاق المكتوب في
الإعدادات. ومع ذلك، تتيح إعادة تسجيل الدخول إلى النطاق *نفسه* إعادة استخدام
الرمز الحالي. يؤدي الرجوع إلى `github.com` العام إلى مسح
`githubDomain` المحفوظ، لتعود الإعدادات إلى الوضع الافتراضي.
</Note>

<Note>
يتجاوز متغير البيئة `COPILOT_GITHUB_DOMAIN` النطاق المحسوم
لكل مسارات Copilot التي تحسمه — تسجيل دخول Enterprise عبر الجهاز
(`--method device-enterprise`)، والاختصار المستقل
`openclaw models auth login-github-copilot`، وتحديث الرمز، والتضمينات،
وعمليات الإكمال. عيّنه إلى مضيف `*.ghe.com` الخاص بك للإعدادات المؤتمتة بالكامل أو إعدادات CI.
اتركه دون تعيين (مع غياب معامل الإعدادات) لاستخدام `github.com` العام.
تحفظ عمليات تسجيل الدخول النطاق الذي أُصدر الرمز له (وتمسحه عند تسجيل الدخول
إلى `github.com` العام)، لذا يظل التوجيه صحيحًا حتى بعد إلغاء تعيين
متغير البيئة.
</Note>

## العلامات الاختيارية

| الأمر                                                                    | العلامة         | الوصف                                                  |
| ------------------------------------------------------------------------ | --------------- | ------------------------------------------------------ |
| `openclaw models auth login-github-copilot`                              | `--yes`         | استبدال ملف تعريف مصادقة موجود من دون مطالبة           |
| `openclaw models auth login --provider github-copilot --method device`   | `--set-default` | تطبيق النموذج الافتراضي الموصى به من الموفّر أيضًا     |

```bash
# تخطي تأكيد إعادة تسجيل الدخول
openclaw models auth login-github-copilot --yes

# تسجيل الدخول وتعيين النموذج الافتراضي في خطوة واحدة
openclaw models auth login --provider github-copilot --method device --set-default
```

## الإعداد الأولي غير التفاعلي

يتطلب تدفق تسجيل الدخول عبر الجهاز TTY تفاعليًا. للإعداد دون واجهة تفاعلية، استورد
رمز وصول GitHub OAuth موجودًا باستخدام `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

يمكنك أيضًا حذف `--auth-choice`؛ إذ يؤدي تمرير `--github-copilot-token` إلى استنتاج
خيار مصادقة موفّر GitHub Copilot. إذا حُذفت العلامة، يعود الإعداد الأولي
إلى `COPILOT_GITHUB_TOKEN`، ثم `GH_TOKEN`، ثم `GITHUB_TOKEN`. استخدم
`--secret-input-mode ref` مع تعيين `COPILOT_GITHUB_TOKEN` لتخزين
`tokenRef` مستند إلى متغير بيئة بدلًا من نص صريح في `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="مطلوب TTY تفاعلي">
    يتطلب تدفق تسجيل الدخول عبر الجهاز TTY تفاعليًا. شغّله مباشرة في
    طرفية، وليس في برنامج نصي غير تفاعلي أو مسار CI.
  </Accordion>

  <Accordion title="توفر النماذج يعتمد على خطتك">
    يعتمد توفر نماذج Copilot على خطة GitHub الخاصة بك. إذا رُفض نموذج،
    فجرّب معرّفًا آخر (مثل `github-copilot/gpt-5.5`). راجع
    [النماذج المدعومة لكل خطة Copilot من GitHub](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    للاطلاع على قائمة النماذج الحالية.
  </Accordion>

  <Accordion title="تحديث الكتالوج المباشر من Copilot API">
    بعد أن يحسم مسار المصادقة عبر تسجيل الدخول بالجهاز (أو متغير البيئة) رمز GitHub،
    يحدّث OpenClaw كتالوج النماذج عند الطلب من `${baseUrl}/models`
    (نقطة النهاية نفسها التي يستخدمها VS Code Copilot)، بحيث تتتبّع بيئة التشغيل
    استحقاقات كل حساب ونوافذ السياق الدقيقة دون تغييرات متكررة في البيان.
    تصبح نماذج Copilot المنشورة حديثًا مرئية من دون ترقية OpenClaw،
    وتعكس نوافذ السياق الحدود الفعلية لكل نموذج
    (مثل 400 ألف لسلسلة gpt-5.x، ومليون للمتغيرات الداخلية
    `claude-opus-*-1m`).

    يظل الكتالوج الثابت المضمّن خيار الرجوع المرئي عند تعطيل الاكتشاف،
    أو عدم امتلاك المستخدم ملف تعريف مصادقة GitHub، أو فشل استبدال الرمز،
    أو حدوث خطأ في استدعاء HTTPS إلى `/models`. لإلغاء الاشتراك والاعتماد كليًا
    على كتالوج البيان الثابت (في سيناريوهات العمل دون اتصال أو الشبكات المعزولة):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="اختيار وسيلة النقل">
    تستخدم معرّفات نماذج Claude وسيلة نقل Anthropic Messages تلقائيًا.
    تستخدم نماذج Gemini وسيلة نقل OpenAI Chat Completions؛ بينما تحتفظ نماذج GPT
    وسلسلة o بوسيلة نقل OpenAI Responses. يختار OpenClaw وسيلة
    النقل الصحيحة استنادًا إلى مرجع النموذج.
  </Accordion>

  <Accordion title="توافق الطلبات">
    يرسل OpenClaw ترويسات طلبات على نمط Copilot IDE عبر وسائل نقل Copilot
    (إصدارات محرر/Plugin في VS Code ومعرّف تكامل `vscode-chat`)،
    ويضع علامة على أدوار المتابعة لنتائج الأدوات بوصفها منشأة من الوكيل، ويعيّن ترويسة
    الرؤية الخاصة بـ Copilot عندما يتضمن الدور إدخال صورة.
  </Accordion>

  <Accordion title="ترتيب حسم متغيرات البيئة">
    يحسم OpenClaw مصادقة Copilot من متغيرات البيئة وفق ترتيب
    الأولوية التالي:

    | الأولوية | المتغير                | الملاحظات                              |
    | -------- | ----------------------- | -------------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN`  | الأولوية الأعلى، خاص بـ Copilot       |
    | 2        | `GH_TOKEN`              | رمز GitHub CLI (خيار رجوع)             |
    | 3        | `GITHUB_TOKEN`          | رمز GitHub القياسي (الأولوية الأدنى)   |

    عند تعيين عدة متغيرات، يستخدم OpenClaw المتغير الأعلى أولوية.
    يخزّن تدفق تسجيل الدخول عبر الجهاز (`openclaw models auth login-github-copilot`)
    رمزه في مخزن ملفات تعريف المصادقة، وتكون له الأولوية على جميع متغيرات
    البيئة.

  </Accordion>

  <Accordion title="تخزين الرمز">
    يخزّن تسجيل الدخول رمز GitHub في مخزن ملفات تعريف المصادقة (معرّف ملف التعريف
    `github-copilot:github`) ويستبدله برمز Copilot API قصير الأجل
    عند تشغيل OpenClaw. لا تحتاج إلى إدارة الرمز يدويًا.
  </Accordion>
</AccordionGroup>

## تضمينات البحث في الذاكرة

يمكن أن يعمل GitHub Copilot أيضًا بوصفه موفّر تضمينات من أجل
[البحث في الذاكرة](/ar/concepts/memory-search). إذا كان لديك اشتراك Copilot
وسجّلت الدخول، فيمكن لـ OpenClaw استخدامه للتضمينات دون مفتاح API منفصل.

### الإعدادات

عيّن `memorySearch.provider` صراحةً لاستخدام تضمينات GitHub Copilot. إذا كان
رمز GitHub متاحًا، يكتشف OpenClaw نماذج التضمين المتاحة من
Copilot API ويختار أفضلها تلقائيًا.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // اختياري: تجاوز النموذج المكتشف تلقائيًا
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### آلية العمل

1. يحسم OpenClaw رمز GitHub الخاص بك (من متغيرات البيئة أو ملف تعريف المصادقة).
2. يستبدله برمز Copilot API قصير الأجل.
3. يستعلم من نقطة نهاية Copilot المسماة `/models` لاكتشاف نماذج التضمين المتاحة.
4. يختار أفضل نموذج (ترتيب التفضيل: `text-embedding-3-small`،
   و`text-embedding-3-large`، و`text-embedding-ada-002`).
5. يرسل طلبات التضمين إلى نقطة نهاية Copilot المسماة `/embeddings`.

يعتمد توفر النماذج على خطة GitHub الخاصة بك. إذا لم تتوفر نماذج تضمين،
يتخطى OpenClaw موفّر Copilot ويجرّب الموفّر التالي.

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك التحويل عند الفشل.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
