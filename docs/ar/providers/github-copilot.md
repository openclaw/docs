---
read_when:
    - تريد استخدام GitHub Copilot كمزوّد نماذج
    - تحتاج إلى مسار `openclaw models auth login-github-copilot`
summary: سجّل الدخول إلى GitHub Copilot من OpenClaw باستخدام تدفق الجهاز أو استيراد الرمز المميز غير التفاعلي
title: GitHub Copilot
x-i18n:
    generated_at: "2026-05-10T19:57:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32268f86bc3e9d4f4d09d105c78c0fc9527aaebd8251865899711e86b25391e5
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot هو مساعد البرمجة بالذكاء الاصطناعي من GitHub. يوفّر الوصول إلى نماذج Copilot
لحسابك وخطتك في GitHub. يمكن لـ OpenClaw استخدام Copilot كموفّر نماذج
بطريقتين مختلفتين.

## طريقتان لاستخدام Copilot في OpenClaw

<Tabs>
  <Tab title="الموفّر المضمّن (github-copilot)">
    استخدم تدفق تسجيل الدخول الأصلي عبر الجهاز للحصول على رمز GitHub، ثم استبدله برموز
    Copilot API عند تشغيل OpenClaw. هذا هو المسار **الافتراضي** والأبسط
    لأنه لا يتطلب VS Code.

    <Steps>
      <Step title="تشغيل أمر تسجيل الدخول">
        ```bash
        openclaw models auth login-github-copilot
        ```

        سيُطلب منك زيارة عنوان URL وإدخال رمز لمرة واحدة. أبقِ
        الطرفية مفتوحة حتى يكتمل.
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

  <Tab title="Plugin وكيل Copilot (copilot-proxy)">
    استخدم إضافة VS Code **Copilot Proxy** كجسر محلي. يتواصل OpenClaw مع
    نقطة نهاية `/v1` الخاصة بالوكيل ويستخدم قائمة النماذج التي تضبطها هناك.

    <Note>
    اختر هذا عندما تكون تشغّل Copilot Proxy بالفعل في VS Code أو تحتاج إلى التوجيه
    عبره. يجب عليك تمكين Plugin وإبقاء إضافة VS Code قيد التشغيل.
    </Note>

  </Tab>
</Tabs>

## العلامات الاختيارية

| العلامة            | الوصف                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | تخطّي مطالبة التأكيد                        |
| `--set-default` | تطبيق النموذج الافتراضي الموصى به من الموفّر أيضًا |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## الإعداد غير التفاعلي

إذا كان لديك بالفعل رمز وصول GitHub OAuth لـ Copilot، فاستورده أثناء
الإعداد بلا واجهة تفاعلية باستخدام `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

يمكنك أيضًا حذف `--auth-choice`؛ فتمرير `--github-copilot-token` يستنتج
اختيار مصادقة موفّر GitHub Copilot. إذا حُذفت العلامة، يعود الإعداد
إلى `COPILOT_GITHUB_TOKEN`، ثم `GH_TOKEN`، ثم `GITHUB_TOKEN`. استخدم
`--secret-input-mode ref` مع تعيين `COPILOT_GITHUB_TOKEN` لتخزين
`tokenRef` مدعوم بمتغير بيئة بدلاً من نص عادي في `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="مطلوب TTY تفاعلي">
    يتطلب تدفق تسجيل الدخول عبر الجهاز TTY تفاعليًا. شغّله مباشرة في
    طرفية، وليس في سكربت غير تفاعلي أو مسار CI.
  </Accordion>

  <Accordion title="يعتمد توفر النماذج على خطتك">
    يعتمد توفر نماذج Copilot على خطتك في GitHub. إذا رُفض نموذج،
    جرّب معرّفًا آخر (مثل `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="تحديث كتالوج مباشر من Copilot API">
    بمجرد أن يحل مسار المصادقة عبر تسجيل الدخول بالجهاز (أو متغير البيئة) رمز GitHub،
    يحدّث OpenClaw كتالوج النماذج عند الطلب من `${baseUrl}/models`
    (نقطة النهاية نفسها التي يستخدمها VS Code Copilot) بحيث يتتبع وقت التشغيل
    استحقاقات كل حساب ونوافذ السياق الدقيقة دون اضطراب في البيان.
    تصبح نماذج Copilot المنشورة حديثًا مرئية دون ترقية OpenClaw،
    وتعكس نوافذ السياق الحدود الحقيقية لكل نموذج
    (مثل 400k لسلسلة gpt-5.x، و1M للمتغيرات الداخلية
    `claude-opus-*-1m`).

    يبقى الكتالوج الثابت المضمّن كخيار احتياطي مرئي عندما يكون الاكتشاف
    معطلاً، أو لا يملك المستخدم ملف تعريف مصادقة GitHub، أو يفشل تبادل الرمز،
    أو يحدث خطأ في استدعاء HTTPS إلى `/models`. لإلغاء الاشتراك والاعتماد كليًا
    على كتالوج البيان الثابت (سيناريوهات دون اتصال / معزولة عن الشبكة):

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
    تستخدم معرّفات نماذج Claude نقل Anthropic Messages تلقائيًا. تحتفظ نماذج GPT
    وسلسلة o ونماذج Gemini بنقل OpenAI Responses. يختار OpenClaw
    النقل الصحيح بناءً على مرجع النموذج.
  </Accordion>

  <Accordion title="توافق الطلبات">
    يرسل OpenClaw ترويسات طلبات بنمط Copilot IDE على وسائل نقل Copilot،
    بما في ذلك أدوار المتابعة المضمّنة لـ Compaction ونتائج الأدوات والصور. ولا
    يفعّل استمرارية Responses على مستوى الموفّر لـ Copilot إلا إذا
    تم التحقق من ذلك السلوك مقابل Copilot API.
  </Accordion>

  <Accordion title="ترتيب حل متغيرات البيئة">
    يحل OpenClaw مصادقة Copilot من متغيرات البيئة بترتيب
    الأولوية التالي:

    | الأولوية | المتغير              | الملاحظات                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | أعلى أولوية، خاص بـ Copilot |
    | 2        | `GH_TOKEN`            | رمز GitHub CLI (احتياطي)      |
    | 3        | `GITHUB_TOKEN`        | رمز GitHub القياسي (الأدنى)   |

    عند تعيين عدة متغيرات، يستخدم OpenClaw المتغير الأعلى أولوية.
    يخزّن تدفق تسجيل الدخول عبر الجهاز (`openclaw models auth login-github-copilot`)
    رمزه في مخزن ملفات تعريف المصادقة، وتكون له الأولوية على جميع متغيرات البيئة.

  </Accordion>

  <Accordion title="تخزين الرموز">
    يخزّن تسجيل الدخول رمز GitHub في مخزن ملفات تعريف المصادقة ويستبدله
    برمز Copilot API عند تشغيل OpenClaw. لست بحاجة إلى إدارة
    الرمز يدويًا.
  </Accordion>
</AccordionGroup>

<Warning>
يتطلب أمر تسجيل الدخول عبر الجهاز TTY تفاعليًا. استخدم الإعداد غير التفاعلي
عندما تحتاج إلى إعداد بلا واجهة تفاعلية.
</Warning>

## تضمينات بحث الذاكرة

يمكن لـ GitHub Copilot أيضًا أن يعمل كموفّر تضمينات لـ
[بحث الذاكرة](/ar/concepts/memory-search). إذا كان لديك اشتراك Copilot
وسجّلت الدخول، فيمكن لـ OpenClaw استخدامه للتضمينات دون مفتاح API منفصل.

### الاكتشاف التلقائي

عندما يكون `memorySearch.provider` هو `"auto"` (الافتراضي)، تتم تجربة GitHub Copilot
عند الأولوية 15 -- بعد التضمينات المحلية ولكن قبل OpenAI والموفّرين المدفوعين
الآخرين. إذا كان رمز GitHub متاحًا، يكتشف OpenClaw
نماذج التضمين المتاحة من Copilot API ويختار أفضلها تلقائيًا.

### إعداد صريح

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

### كيف يعمل

1. يحل OpenClaw رمز GitHub الخاص بك (من متغيرات البيئة أو ملف تعريف المصادقة).
2. يستبدله برمز Copilot API قصير العمر.
3. يستعلم نقطة نهاية Copilot `/models` لاكتشاف نماذج التضمين المتاحة.
4. يختار أفضل نموذج (يفضّل `text-embedding-3-small`).
5. يرسل طلبات التضمين إلى نقطة نهاية Copilot `/embeddings`.

يعتمد توفر النماذج على خطتك في GitHub. إذا لم تكن هناك نماذج تضمين
متاحة، يتخطى OpenClaw Copilot ويجرّب الموفّر التالي.

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
