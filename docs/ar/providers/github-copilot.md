---
read_when:
    - تريد استخدام GitHub Copilot كمزوّد نماذج
    - تحتاج إلى تدفق `openclaw models auth login-github-copilot`
    - أنت تختار بين موفر Copilot المدمج، وبيئة Copilot SDK، وCopilot Proxy
summary: سجّل الدخول إلى GitHub Copilot من OpenClaw باستخدام تدفق الجهاز أو استيراد الرمز غير التفاعلي
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:24:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot هو مساعد البرمجة بالذكاء الاصطناعي من GitHub. يوفّر إمكانية الوصول إلى نماذج Copilot
لحسابك وخطتك في GitHub. يمكن لـ OpenClaw استخدام Copilot كمزوّد نماذج
أو كزمن تشغيل وكيل بثلاث طرق مختلفة.

## ثلاث طرق لاستخدام Copilot في OpenClaw

<Tabs>
  <Tab title="المزوّد المضمّن (github-copilot)">
    استخدم مسار تسجيل الدخول الأصلي للجهاز للحصول على رمز GitHub، ثم استبدله برموز
    Copilot API عند تشغيل OpenClaw. هذا هو المسار **الافتراضي** والأبسط
    لأنه لا يتطلب VS Code.

    <Steps>
      <Step title="تشغيل أمر تسجيل الدخول">
        ```bash
        openclaw models auth login-github-copilot
        ```

        سيُطلب منك زيارة عنوان URL وإدخال رمز لمرة واحدة. أبقِ
        الطرفية مفتوحة حتى يكتمل الأمر.
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

  <Tab title="Plugin حزمة Copilot SDK (copilot)">
    ثبّت Plugin الخارجي `@openclaw/copilot` عندما تريد أن تتولى
    Copilot CLI وSDK من GitHub حلقة الوكيل منخفضة المستوى لنماذج
    `github-copilot/*` محددة.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    ثم اختر إدخال نموذج أو مزوّد في زمن التشغيل:

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

    اختر هذا عندما تريد جلسات Copilot CLI أصلية، وحالة محادثات يديرها SDK،
    وCompaction مملوكة لـ Copilot لتلك دورات الوكيل. راجع
    [حزمة Copilot SDK](/ar/plugins/copilot) للاطلاع على عقد زمن التشغيل الكامل.

  </Tab>

  <Tab title="Plugin وكيل Copilot (copilot-proxy)">
    استخدم إضافة VS Code المسماة **Copilot Proxy** كجسر محلي. يتصل OpenClaw
    بنقطة نهاية `/v1` الخاصة بالوكيل ويستخدم قائمة النماذج التي تضبطها هناك.

    <Note>
    اختر هذا عندما تكون تشغّل Copilot Proxy بالفعل في VS Code أو تحتاج إلى التوجيه
    عبره. يجب تمكين Plugin وإبقاء إضافة VS Code قيد التشغيل.
    </Note>

  </Tab>
</Tabs>

## علامات اختيارية

| العلامة         | الوصف                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | تخطي مطالبة التأكيد                                 |
| `--set-default` | تطبيق النموذج الافتراضي الموصى به للمزوّد أيضًا     |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## التهيئة غير التفاعلية

إذا كان لديك بالفعل رمز وصول GitHub OAuth لـ Copilot، فاستورده أثناء
الإعداد دون واجهة تفاعلية باستخدام `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

يمكنك أيضًا حذف `--auth-choice`؛ فتمرير `--github-copilot-token` يستنتج
اختيار مصادقة مزوّد GitHub Copilot. إذا حُذفت العلامة، تعود التهيئة
إلى `COPILOT_GITHUB_TOKEN`، ثم `GH_TOKEN`، ثم `GITHUB_TOKEN`. استخدم
`--secret-input-mode ref` مع ضبط `COPILOT_GITHUB_TOKEN` لتخزين
`tokenRef` مدعوم بمتغير بيئة بدل النص الصريح في `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="مطلوب TTY تفاعلي">
    يتطلب مسار تسجيل الدخول للجهاز TTY تفاعليًا. شغّله مباشرة في
    طرفية، وليس في برنامج نصي غير تفاعلي أو مسار CI.
  </Accordion>

  <Accordion title="يعتمد توفر النماذج على خطتك">
    يعتمد توفر نماذج Copilot على خطة GitHub لديك. إذا رُفض نموذج،
    جرّب معرفًا آخر (على سبيل المثال `github-copilot/gpt-5.5`). راجع
    [النماذج المدعومة لكل خطة Copilot من GitHub](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    للاطلاع على قائمة النماذج الحالية.
  </Accordion>

  <Accordion title="تحديث الفهرس المباشر من Copilot API">
    بمجرد أن يحل مسار مصادقة تسجيل الدخول للجهاز (أو متغير البيئة) رمز GitHub،
    يحدّث OpenClaw فهرس النماذج عند الطلب من `${baseUrl}/models`
    (نقطة النهاية نفسها التي يستخدمها VS Code Copilot) بحيث يتتبع زمن التشغيل
    الاستحقاقات الخاصة بكل حساب ونوافذ السياق الدقيقة دون اضطراب في البيان.
    تصبح نماذج Copilot المنشورة حديثًا مرئية دون ترقية OpenClaw،
    وتعكس نوافذ السياق الحدود الحقيقية لكل نموذج
    (مثل 400k لسلسلة gpt-5.x، و1M للمتغيرات الداخلية
    `claude-opus-*-1m`).

    يبقى الفهرس الثابت المضمّن كخيار احتياطي ظاهر عند تعطيل الاكتشاف،
    أو عندما لا يملك المستخدم ملف مصادقة GitHub، أو يفشل استبدال الرمز،
    أو يحدث خطأ في استدعاء HTTPS لـ `/models`. لإلغاء ذلك والاعتماد بالكامل
    على فهرس البيان الثابت (سيناريوهات دون اتصال / معزولة الشبكة):

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

  <Accordion title="اختيار النقل">
    تستخدم معرفات نماذج Claude نقل Anthropic Messages تلقائيًا. تحتفظ نماذج GPT
    وسلسلة o ونماذج Gemini بنقل OpenAI Responses. يختار OpenClaw
    النقل الصحيح بناءً على مرجع النموذج.
  </Accordion>

  <Accordion title="توافق الطلبات">
    يرسل OpenClaw ترويسات طلبات بنمط Copilot IDE على عمليات نقل Copilot،
    بما في ذلك دورات Compaction المضمّنة، ونتائج الأدوات، والمتابعة بالصور. ولا
    يفعّل استمرار Responses على مستوى المزوّد لـ Copilot ما لم يتم التحقق من
    ذلك السلوك مقابل API الخاصة بـ Copilot.
  </Accordion>

  <Accordion title="ترتيب حل متغيرات البيئة">
    يحل OpenClaw مصادقة Copilot من متغيرات البيئة بترتيب الأولوية التالي:

    | الأولوية | المتغير               | ملاحظات                         |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | أعلى أولوية، خاص بـ Copilot     |
    | 2        | `GH_TOKEN`            | رمز GitHub CLI (احتياطي)        |
    | 3        | `GITHUB_TOKEN`        | رمز GitHub قياسي (الأدنى)       |

    عند ضبط عدة متغيرات، يستخدم OpenClaw الأعلى أولوية.
    يخزّن مسار تسجيل الدخول للجهاز (`openclaw models auth login-github-copilot`)
    رمزه في مخزن ملفات المصادقة وتكون له أسبقية على جميع متغيرات البيئة.

  </Accordion>

  <Accordion title="تخزين الرمز">
    يخزّن تسجيل الدخول رمز GitHub في مخزن ملفات المصادقة ويستبدله
    برمز Copilot API عند تشغيل OpenClaw. لست بحاجة إلى إدارة
    الرمز يدويًا.
  </Accordion>
</AccordionGroup>

<Warning>
يتطلب أمر تسجيل الدخول للجهاز TTY تفاعليًا. استخدم التهيئة غير التفاعلية
عندما تحتاج إلى إعداد دون واجهة تفاعلية.
</Warning>

## تضمينات بحث الذاكرة

يمكن لـ GitHub Copilot أيضًا أن يعمل كمزوّد تضمينات لـ
[بحث الذاكرة](/ar/concepts/memory-search). إذا كان لديك اشتراك Copilot
وسجلت الدخول، فيمكن لـ OpenClaw استخدامه للتضمينات دون مفتاح API منفصل.

### الإعدادات

اضبط `memorySearch.provider` صراحة لاستخدام تضمينات GitHub Copilot. إذا كان
رمز GitHub متاحًا، يكتشف OpenClaw نماذج التضمين المتاحة من
Copilot API ويختار الأفضل تلقائيًا.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### آلية العمل

1. يحل OpenClaw رمز GitHub الخاص بك (من متغيرات البيئة أو ملف المصادقة).
2. يستبدله برمز Copilot API قصير العمر.
3. يستعلم نقطة نهاية Copilot `/models` لاكتشاف نماذج التضمين المتاحة.
4. يختار أفضل نموذج (يفضّل `text-embedding-3-small`).
5. يرسل طلبات التضمين إلى نقطة نهاية Copilot `/embeddings`.

يعتمد توفر النماذج على خطة GitHub لديك. إذا لم تتوفر أي نماذج تضمين،
يتخطى OpenClaw Copilot ويجرّب المزوّد التالي.

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
