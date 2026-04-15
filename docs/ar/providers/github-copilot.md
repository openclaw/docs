---
read_when:
    - تريد استخدام GitHub Copilot كمزوّد نماذج
    - تحتاج إلى تدفق `openclaw models auth login-github-copilot`
summary: سجّل الدخول إلى GitHub Copilot من OpenClaw باستخدام تدفق الجهاز
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-15T14:40:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8258fecff22fb73b057de878462941f6eb86d0c5f775c5eac4840e95ba5eccf
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot هو مساعد GitHub للبرمجة بالذكاء الاصطناعي. يوفّر الوصول إلى
نماذج Copilot لحساب GitHub والخطة الخاصة بك. يمكن لـ OpenClaw استخدام Copilot
كمزوّد نماذج بطريقتين مختلفتين.

## طريقتان لاستخدام Copilot في OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    استخدم تدفق تسجيل الدخول الأصلي عبر الجهاز للحصول على رمز GitHub مميّز، ثم بدّله
    برموز Copilot API المميّزة عند تشغيل OpenClaw. هذا هو المسار **الافتراضي** والأبسط
    لأنه لا يتطلب VS Code.

    <Steps>
      <Step title="تشغيل أمر تسجيل الدخول">
        ```bash
        openclaw models auth login-github-copilot
        ```

        سيُطلب منك زيارة عنوان URL وإدخال رمز لمرة واحدة. أبقِ
        الطرفية مفتوحة حتى تكتمل العملية.
      </Step>
      <Step title="تعيين نموذج افتراضي">
        ```bash
        openclaw models set github-copilot/gpt-4o
        ```

        أو في الإعدادات:

        ```json5
        {
          agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    استخدم إضافة VS Code **Copilot Proxy** كجسر محلي. يتواصل OpenClaw مع
    نقطة النهاية `/v1` الخاصة بالوكيل ويستخدم قائمة النماذج التي تضبطها هناك.

    <Note>
    اختر هذا إذا كنت تشغّل Copilot Proxy بالفعل في VS Code أو تحتاج إلى التوجيه
    من خلاله. يجب عليك تمكين الـ Plugin والإبقاء على إضافة VS Code قيد التشغيل.
    </Note>

  </Tab>
</Tabs>

## العلامات الاختيارية

| Flag            | الوصف                                              |
| --------------- | --------------------------------------------------- |
| `--yes`         | تخطّي مطالبة التأكيد                               |
| `--set-default` | تطبيق النموذج الافتراضي الموصى به من المزوّد أيضًا |

```bash
# تخطّي التأكيد
openclaw models auth login-github-copilot --yes

# تسجيل الدخول وتعيين النموذج الافتراضي في خطوة واحدة
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="مطلوب TTY تفاعلي">
    يتطلب تدفق تسجيل الدخول عبر الجهاز TTY تفاعليًا. شغّله مباشرةً في
    طرفية، وليس ضمن سكربت غير تفاعلي أو ضمن مسار CI.
  </Accordion>

  <Accordion title="يعتمد توفّر النموذج على خطتك">
    يعتمد توفّر نماذج Copilot على خطة GitHub الخاصة بك. إذا تم
    رفض نموذج، فجرّب معرّفًا آخر (على سبيل المثال `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="اختيار النقل">
    تستخدم معرّفات نماذج Claude نقل Anthropic Messages تلقائيًا. أما نماذج GPT
    وo-series وGemini فتبقي على نقل OpenAI Responses. يختار OpenClaw
    النقل الصحيح استنادًا إلى مرجع النموذج.
  </Accordion>

  <Accordion title="ترتيب أولوية تحليل متغيرات البيئة">
    يحلّل OpenClaw مصادقة Copilot من متغيرات البيئة وفق
    ترتيب الأولوية التالي:

    | Priority | Variable              | Notes                                 |
    | -------- | --------------------- | ------------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | أعلى أولوية، ومخصص لـ Copilot         |
    | 2        | `GH_TOKEN`            | رمز GitHub CLI المميّز (احتياطي)      |
    | 3        | `GITHUB_TOKEN`        | رمز GitHub المميّز القياسي (الأدنى)   |

    عند ضبط عدة متغيرات، يستخدم OpenClaw الأعلى أولوية.
    يخزّن تدفق تسجيل الدخول عبر الجهاز (`openclaw models auth login-github-copilot`)
    رمزه المميّز في مخزن ملف تعريف المصادقة، وتكون له أولوية أعلى من جميع متغيرات
    البيئة.

  </Accordion>

  <Accordion title="تخزين الرمز المميّز">
    يخزّن تسجيل الدخول رمز GitHub مميّزًا في مخزن ملف تعريف المصادقة ويبدّله
    برمز Copilot API مميّز عند تشغيل OpenClaw. لست بحاجة إلى إدارة
    الرمز المميّز يدويًا.
  </Accordion>
</AccordionGroup>

<Warning>
يتطلب TTY تفاعليًا. شغّل أمر تسجيل الدخول مباشرةً في طرفية، وليس
داخل سكربت دون واجهة أو مهمة CI.
</Warning>

## تضمينات البحث في الذاكرة

يمكن أيضًا لـ GitHub Copilot أن يعمل كمزوّد تضمينات لـ
[البحث في الذاكرة](/ar/concepts/memory-search). إذا كان لديك اشتراك في Copilot وكنت
قد سجّلت الدخول، فيمكن لـ OpenClaw استخدامه للتضمينات دون الحاجة إلى مفتاح API منفصل.

### الاكتشاف التلقائي

عندما تكون `memorySearch.provider` هي `"auto"` (الافتراضي)، تتم تجربة GitHub Copilot
بأولوية 15 -- بعد التضمينات المحلية ولكن قبل OpenAI ومزوّدي
الخدمات المدفوعين الآخرين. إذا كان رمز GitHub مميّزًا متاحًا، يكتشف OpenClaw
نماذج التضمين المتاحة من Copilot API ويختار الأفضل تلقائيًا.

### إعدادات صريحة

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // اختياري: تجاوز النموذج المكتشَف تلقائيًا
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### كيف يعمل

1. يحلّل OpenClaw رمز GitHub المميّز الخاص بك (من متغيرات البيئة أو ملف تعريف المصادقة).
2. يبدّله برمز Copilot API مميّز قصير العمر.
3. يستعلم نقطة النهاية `/models` الخاصة بـ Copilot لاكتشاف نماذج التضمين المتاحة.
4. يختار أفضل نموذج (ويفضّل `text-embedding-3-small`).
5. يرسل طلبات التضمين إلى نقطة النهاية `/embeddings` الخاصة بـ Copilot.

يعتمد توفّر النموذج على خطة GitHub الخاصة بك. إذا لم تكن هناك نماذج تضمين
متاحة، فسيتخطّى OpenClaw Copilot ويجرّب المزوّد التالي.

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
