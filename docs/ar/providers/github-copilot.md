---
read_when:
    - تريد استخدام GitHub Copilot كمزوّد نماذج
    - تحتاج إلى تدفق `openclaw models auth login-github-copilot`
summary: سجّل الدخول إلى GitHub Copilot من OpenClaw باستخدام تدفق الجهاز
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-24T07:58:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b54a063e30e9202c6b9de35a1a3736ef8c36020296215491fb719afe73a0c3e
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot هو مساعد GitHub للبرمجة بالذكاء الاصطناعي. ويوفر الوصول إلى
نماذج Copilot لحساب GitHub والخطة الخاصة بك. ويمكن لـ OpenClaw استخدام Copilot كمزوّد
نماذج بطريقتين مختلفتين.

## طريقتان لاستخدام Copilot في OpenClaw

<Tabs>
  <Tab title="المزوّد المدمج (github-copilot)">
    استخدم تدفق تسجيل الدخول الأصلي الخاص بالجهاز للحصول على رمز GitHub، ثم استبدله
    برموز Copilot API عندما يعمل OpenClaw. وهذا هو المسار **الافتراضي** والأبسط
    لأنه لا يتطلب VS Code.

    <Steps>
      <Step title="شغّل أمر تسجيل الدخول">
        ```bash
        openclaw models auth login-github-copilot
        ```

        سيُطلب منك زيارة عنوان URL وإدخال رمز لمرة واحدة. أبقِ
        الطرفية مفتوحة حتى يكتمل الأمر.
      </Step>
      <Step title="اضبط نموذجًا افتراضيًا">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        أو في الإعداد:

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

  <Tab title="Plugin ‏Copilot Proxy ‏(copilot-proxy)">
    استخدم امتداد VS Code **Copilot Proxy** كجسر محلي. يتحدث OpenClaw إلى
    نقطة النهاية `/v1` الخاصة بالوكيل ويستخدم قائمة النماذج التي تضبطها هناك.

    <Note>
    اختر هذا عندما تكون بالفعل تشغّل Copilot Proxy في VS Code أو تحتاج إلى التوجيه
    من خلاله. يجب عليك تفعيل Plugin والحفاظ على امتداد VS Code قيد التشغيل.
    </Note>

  </Tab>
</Tabs>

## علامات اختيارية

| العلامة | الوصف |
| --------------- | --------------------------------------------------- |
| `--yes` | تخطّي مطالبة التأكيد |
| `--set-default` | تطبيق النموذج الافتراضي الموصى به من المزوّد أيضًا |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="مطلوب TTY تفاعلي">
    يتطلب تدفق تسجيل الدخول عبر الجهاز TTY تفاعليًا. شغّله مباشرةً في
    طرفية، وليس ضمن نص برمجي غير تفاعلي أو ضمن CI pipeline.
  </Accordion>

  <Accordion title="يعتمد توفر النموذج على خطتك">
    يعتمد توفر نماذج Copilot على خطة GitHub الخاصة بك. إذا تم
    رفض نموذج ما، فجرّب معرّفًا آخر (مثل `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="اختيار النقل">
    تستخدم معرّفات نماذج Claude نقل Anthropic Messages تلقائيًا. أما نماذج GPT
    وسلسلة o ونماذج Gemini فتحتفظ بنقل OpenAI Responses. ويقوم OpenClaw
    باختيار وسيلة النقل الصحيحة بناءً على مرجع النموذج.
  </Accordion>

  <Accordion title="ترتيب حل متغيرات البيئة">
    يحل OpenClaw مصادقة Copilot من متغيرات البيئة حسب
    ترتيب الأولوية التالي:

    | الأولوية | المتغير | ملاحظات |
    | -------- | --------------------- | -------------------------------- |
    | 1 | `COPILOT_GITHUB_TOKEN` | أعلى أولوية، ومخصص لـ Copilot |
    | 2 | `GH_TOKEN` | رمز GitHub CLI (احتياطي) |
    | 3 | `GITHUB_TOKEN` | رمز GitHub القياسي (أدنى أولوية) |

    عندما تكون عدة متغيرات مضبوطة، يستخدم OpenClaw الأعلى أولوية منها.
    يقوم تدفق تسجيل الدخول عبر الجهاز (`openclaw models auth login-github-copilot`) بتخزين
    رمزه في مخزن ملفات تعريف المصادقة ويأخذ الأولوية على جميع
    متغيرات البيئة.

  </Accordion>

  <Accordion title="تخزين الرمز المميز">
    يقوم تسجيل الدخول بتخزين رمز GitHub في مخزن ملف تعريف المصادقة ثم يستبدله
    برمز Copilot API عندما يعمل OpenClaw. ولا تحتاج إلى إدارة
    الرمز يدويًا.
  </Accordion>
</AccordionGroup>

<Warning>
يتطلب TTY تفاعليًا. شغّل أمر تسجيل الدخول مباشرةً في طرفية، وليس
داخل نص برمجي بلا واجهة أو مهمة CI.
</Warning>

## تضمينات البحث في الذاكرة

يمكن لـ GitHub Copilot أيضًا أن يعمل كمزوّد تضمين لـ
[البحث في الذاكرة](/ar/concepts/memory-search). إذا كان لديك اشتراك Copilot و
قمت بتسجيل الدخول، فيمكن لـ OpenClaw استخدامه للتضمينات من دون مفتاح API منفصل.

### الاكتشاف التلقائي

عندما تكون `memorySearch.provider` هي `"auto"` (الافتراضي)، تتم تجربة GitHub Copilot
عند أولوية 15 -- بعد التضمينات المحلية وقبل OpenAI وغيرها من
المزوّدين المدفوعين. إذا كان رمز GitHub متاحًا، يكتشف OpenClaw نماذج
التضمين المتاحة من Copilot API ويختار أفضلها تلقائيًا.

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

1. يحل OpenClaw رمز GitHub الخاص بك (من متغيرات env أو من ملف تعريف المصادقة).
2. يستبدله برمز Copilot API قصير العمر.
3. يستعلم عن نقطة النهاية `/models` الخاصة بـ Copilot لاكتشاف نماذج التضمين المتاحة.
4. يختار أفضل نموذج (ويفضّل `text-embedding-3-small`).
5. يرسل طلبات التضمين إلى نقطة النهاية `/embeddings` الخاصة بـ Copilot.

يعتمد توفر النموذج على خطة GitHub الخاصة بك. وإذا لم تكن هناك نماذج تضمين
متاحة، فسيتخطى OpenClaw مزوّد Copilot ويجرّب المزوّد التالي.

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع الاحتياطي.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
