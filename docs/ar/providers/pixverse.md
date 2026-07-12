---
read_when:
    - تريد استخدام إنشاء الفيديو عبر PixVerse في OpenClaw
    - تحتاج إلى إعداد مفتاح PixVerse API ومتغيرات البيئة الخاصة به
    - تريد جعل PixVerse موفّر الفيديو الافتراضي
summary: إعداد إنشاء الفيديو باستخدام PixVerse في OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T06:24:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

يوفّر OpenClaw ‏`pixverse` بوصفه Plugin خارجيًا رسميًا لتوليد فيديوهات PixVerse المستضافة. يسجّل Plugin موفّر `pixverse` وفق عقد `videoGenerationProviders`.

| الخاصية                 | القيمة                                                                |
| ----------------------- | --------------------------------------------------------------------- |
| معرّف الموفّر           | `pixverse`                                                            |
| حزمة Plugin             | `@openclaw/pixverse-provider`                                         |
| متغيّر بيئة المصادقة    | `PIXVERSE_API_KEY`                                                    |
| خيار الإعداد الأولي     | `--auth-choice pixverse-api-key`                                      |
| خيار CLI المباشر        | `--pixverse-api-key <key>`                                            |
| API                     | PixVerse Platform API v2 (إرسال `video_id` ثم استطلاع النتيجة)        |
| النموذج الافتراضي       | `pixverse/v6`                                                         |
| منطقة API الافتراضية    | الدولية                                                               |

## بدء الاستخدام

<Steps>
  <Step title="ثبّت Plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="عيّن مفتاح API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    يطالبك المعالج باختيار نقطة النهاية الدولية أو الصينية (راجع منطقة API
    أدناه) قبل كتابة `region` و`baseUrl` في إعدادات الموفّر.
    تستخدم عمليات التشغيل غير التفاعلية (عند أخذ المفتاح من `--pixverse-api-key` أو `PIXVERSE_API_KEY`)
    المنطقة الدولية افتراضيًا.

    يعيّن الإعداد الأولي أيضًا `agents.defaults.videoGenerationModel.primary` إلى
    `pixverse/v6` إذا لم يكن هناك نموذج فيديو افتراضي مُعدّ بعد.

  </Step>
  <Step title="بدّل موفّر الفيديو الافتراضي الحالي (اختياري)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="أنشئ فيديو">
    اطلب من الوكيل إنشاء فيديو. سيُستخدم PixVerse تلقائيًا.
  </Step>
</Steps>

## الأوضاع والنماذج المدعومة

يتيح الموفّر نماذج توليد PixVerse من خلال أداة الفيديو المشتركة في OpenClaw.

| الوضع             | النماذج              | الإدخال المرجعي             |
| ----------------- | -------------------- | --------------------------- |
| تحويل النص إلى فيديو  | `v6` (افتراضي)، `c1` | لا يوجد                     |
| تحويل الصورة إلى فيديو | `v6` (افتراضي)، `c1` | صورة محلية أو بعيدة واحدة   |

تُرفع مراجع الصور المحلية إلى PixVerse قبل طلب تحويل الصورة إلى فيديو. وتُمرّر عناوين URL للصور البعيدة عبر نقطة نهاية رفع الصور في PixVerse بصيغة `image_url`.

| الخيار            | القيم المدعومة                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| المدة             | من ثانية واحدة إلى 15 ثانية (الافتراضي 5)                                                                                               |
| الدقة             | `360P`، `540P`، `720P`، `1080P` (الافتراضي `540P`؛ تُحوّل طلبات `480P` إلى `540P`)                                                       |
| نسبة العرض إلى الارتفاع | `16:9` (افتراضي)، `4:3`، `1:1`، `3:4`، `9:16`، `2:3`، `3:2`، `21:9`؛ لتحويل النص إلى فيديو فقط، أما تحويل الصورة إلى فيديو فيتبع الصورة المصدر |
| الصوت المُنشأ     | `audio: true`                                                                                                                            |

<Note>
لم يُتح توليد قوالب الصور في PixVerse عبر `image_generate` حتى الآن. تعتمد API هذه على معرّف القالب، بينما لا يتضمن عقد توليد الصور المشترك في OpenClaw حاليًا مجموعة خيارات مكتوبة خاصة بـ PixVerse.
</Note>

## خيارات الموفّر

يقبل موفّر الفيديو المفاتيح الاختيارية التالية الخاصة بالموفّر:

| الخيار                               | النوع   | التأثير                                           |
| ------------------------------------ | ------- | ------------------------------------------------- |
| `seed`                               | رقم     | قيمة أولية حتمية من 0 إلى 2147483647              |
| `negativePrompt` / `negative_prompt` | سلسلة   | موجّه سلبي                                        |
| `quality`                            | سلسلة   | جودة PixVerse مثل `720p`                          |
| `motionMode` / `motion_mode`         | سلسلة   | وضع الحركة لتحويل الصورة إلى فيديو (الافتراضي `normal`) |
| `cameraMovement` / `camera_movement` | سلسلة   | إعداد مسبق لحركة كاميرا PixVerse                  |
| `templateId` / `template_id`         | رقم     | معرّف قالب PixVerse المُفعّل                       |

## الإعداد

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="منطقة API">
    | قيمة المنطقة   | عنوان URL الأساسي لـ PixVerse API            |
    | -------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    عيّن `models.providers.pixverse.region` يدويًا عندما ينتمي مفتاحك إلى
    منطقة محددة في منصة PixVerse، أو شغّل
    `openclaw onboard --auth-choice pixverse-api-key` لاختيار منطقة في
    معالج الإعداد:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" أو "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="عنوان URL أساسي مخصص">
    عيّن `models.providers.pixverse.baseUrl` فقط عند التوجيه عبر وكيل متوافق وموثوق.
    تكون لـ `baseUrl` الأولوية على `region`.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="استطلاع المهمة">
    يعيد PixVerse قيمة `video_id` من طلب التوليد. يستطلع OpenClaw
    المسار `/openapi/v2/video/result/{video_id}` كل 5 ثوانٍ حتى تنجح المهمة
    أو تفشل أو تبلغ المهلة الزمنية (الافتراضي 5 دقائق؛ ويمكن تجاوزها باستخدام
    `agents.defaults.videoGenerationModel.timeoutMs`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات الأداة المشتركة واختيار الموفّر والسلوك غير المتزامن.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    الإعدادات الافتراضية للوكيل، بما في ذلك نموذج توليد الفيديو.
  </Card>
</CardGroup>
