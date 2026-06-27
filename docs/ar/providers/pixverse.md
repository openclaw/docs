---
read_when:
    - تريد استخدام إنشاء الفيديو باستخدام PixVerse في OpenClaw
    - تحتاج إلى إعداد مفتاح API ومتغيرات البيئة لـ PixVerse
    - تريد جعل PixVerse مزوّد الفيديو الافتراضي
summary: إعداد توليد فيديو PixVerse في OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T18:27:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

يوفّر OpenClaw `pixverse` بصفته Plugin خارجيًا رسميًا لتوليد فيديو PixVerse المستضاف. يسجّل Plugin مزوّد `pixverse` مقابل عقد `videoGenerationProviders`.

| الخاصية           | القيمة                                                                |
| ------------------ | -------------------------------------------------------------------- |
| معرّف المزوّد        | `pixverse`                                                           |
| حزمة Plugin     | `@openclaw/pixverse-provider`                                        |
| متغير بيئة المصادقة       | `PIXVERSE_API_KEY`                                                   |
| علم التهيئة    | `--auth-choice pixverse-api-key`                                     |
| علم CLI المباشر    | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2 (إرسال `video_id` مع استطلاع النتائج) |
| النموذج الافتراضي      | `pixverse/v6`                                                        |
| منطقة API الافتراضية | دولية                                                        |

## البدء

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    يسأل المعالج هل تريد استخدام نقطة النهاية الدولية
    (`https://app-api.pixverse.ai/openapi/v2`) أم نقطة نهاية CN
    (`https://app-api.pixverseai.cn/openapi/v2`) قبل كتابة `region` و
    `baseUrl` في إعدادات المزوّد.

  </Step>
  <Step title="Set PixVerse as the default video provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Generate a video">
    اطلب من الوكيل توليد فيديو. سيُستخدم PixVerse تلقائيًا.
  </Step>
</Steps>

## الأوضاع والنماذج المدعومة

يعرض المزوّد نماذج توليد PixVerse عبر أداة الفيديو المشتركة في OpenClaw.

| الوضع           | النماذج               | إدخال مرجعي         |
| -------------- | -------------------- | ----------------------- |
| تحويل النص إلى فيديو  | `v6` (افتراضي)، `c1` | لا شيء                    |
| تحويل الصورة إلى فيديو | `v6` (افتراضي)، `c1` | صورة محلية أو بعيدة واحدة |

تُرفع مراجع الصور المحلية إلى PixVerse قبل طلب تحويل الصورة إلى فيديو. تُمرّر عناوين URL للصور البعيدة عبر نقطة نهاية رفع الصور في PixVerse باسم `image_url`.

| الخيار          | القيم المدعومة                                                            |
| --------------- | --------------------------------------------------------------------------- |
| المدة        | 1-15 ثانية                                                                |
| الدقة      | `360P`, `540P`, `720P`, `1080P`                                             |
| نسبة العرض إلى الارتفاع    | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` لتحويل النص إلى فيديو |
| الصوت المولّد | `audio: true`                                                               |

<Note>
توليد قوالب الصور في PixVerse غير معروض عبر `image_generate` حتى الآن. يعتمد ذلك API على معرّف القالب، بينما لا يتضمن عقد توليد الصور المشترك في OpenClaw حاليًا حزمة خيارات typed خاصة بـ PixVerse.
</Note>

## خيارات المزوّد

يقبل مزوّد الفيديو هذه المفاتيح الاختيارية الخاصة بالمزوّد:

| الخيار                               | النوع   | التأثير                            |
| ------------------------------------ | ------ | --------------------------------- |
| `seed`                               | number | بذرة حتمية عند دعمها |
| `negativePrompt` / `negative_prompt` | string | موجّه سلبي                   |
| `quality`                            | string | جودة PixVerse مثل `720p`   |
| `motionMode` / `motion_mode`         | string | وضع حركة تحويل الصورة إلى فيديو        |
| `cameraMovement` / `camera_movement` | string | إعداد مسبق لحركة كاميرا PixVerse   |
| `templateId` / `template_id`         | number | معرّف قالب PixVerse مفعّل    |

## الإعدادات

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

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="API region">
    يستخدم OpenClaw افتراضيًا PixVerse API الدولي. عيّن `models.providers.pixverse.region`
    يدويًا عندما ينتمي مفتاحك إلى منطقة منصة PixVerse محددة، أو استخدم
    `openclaw onboard --auth-choice pixverse-api-key` لاختيار منطقة في معالج الإعداد:

    | قيمة المنطقة    | عنوان URL الأساسي لـ PixVerse API                         |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Custom base URL">
    عيّن `models.providers.pixverse.baseUrl` فقط عند التوجيه عبر وكيل موثوق ومتوافق.
    تكون لـ `baseUrl` أسبقية على `region`.

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

  <Accordion title="Task polling">
    يعيد PixVerse قيمة `video_id` من طلب التوليد. يستطلع OpenClaw
    `/openapi/v2/video/result/{video_id}` حتى تنجح المهمة أو تفشل
    أو تنتهي مهلتها.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Video generation" href="/ar/tools/video-generation" icon="video">
    معلمات الأداة المشتركة، واختيار المزوّد، والسلوك غير المتزامن.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    إعدادات الوكيل الافتراضية، بما في ذلك نموذج توليد الفيديو.
  </Card>
</CardGroup>
