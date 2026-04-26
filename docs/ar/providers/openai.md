---
read_when:
    - تريد استخدام نماذج OpenAI في OpenClaw
    - تريد مصادقة اشتراك Codex بدلًا من مفاتيح API
    - تحتاج إلى سلوك تنفيذ أكثر صرامة لوكيل GPT-5
summary: استخدم OpenAI عبر مفاتيح API أو اشتراك Codex في OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-26T11:39:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4c3e734217ca82e1a5965c41686341a8bd87b4d2194c6d9e286e1087fa53320
    source_path: providers/openai.md
    workflow: 15
---

  توفّر OpenAI واجهات API للمطورين لنماذج GPT، كما أن Codex متاح أيضًا بوصفه
  وكيل برمجة ضمن خطط ChatGPT عبر عملاء Codex من OpenAI. ويحافظ OpenClaw على فصل
  هذه الأسطح بحيث تبقى الإعدادات قابلة للتنبؤ.

  يدعم OpenClaw ثلاثة مسارات من عائلة OpenAI. وتحدد بادئة النموذج
  مسار المزوّد/المصادقة؛ بينما يحدد إعداد runtime منفصل من الذي ينفّذ حلقة
  الوكيل المضمّنة:

  - **مفتاح API** — وصول مباشر إلى OpenAI Platform مع فوترة حسب الاستخدام (نماذج `openai/*`)
  - **اشتراك Codex عبر Pi** — تسجيل دخول ChatGPT/Codex مع وصول بالاشتراك (نماذج `openai-codex/*`)
  - **حزمة Codex app-server** — تنفيذ أصلي لـ Codex app-server ‏(نماذج `openai/*` بالإضافة إلى `agents.defaults.agentRuntime.id: "codex"`)

  تدعم OpenAI صراحةً استخدام OAuth القائم على الاشتراك في الأدوات وسير العمل الخارجية مثل OpenClaw.

  المزوّد، والنموذج، وruntime، والقناة طبقات منفصلة. وإذا كانت هذه التسميات
  تختلط عليك، فاقرأ [Agent runtimes](/ar/concepts/agent-runtimes) قبل
  تغيير الإعدادات.

  ## اختيار سريع

  | الهدف                                         | استخدم                                             | ملاحظات                                                                      |
  | --------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
  | فوترة مباشرة بمفتاح API                       | `openai/gpt-5.5`                                   | اضبط `OPENAI_API_KEY` أو شغّل الإعداد الأولي لمفتاح OpenAI API.             |
  | GPT-5.5 مع مصادقة اشتراك ChatGPT/Codex        | `openai-codex/gpt-5.5`                             | مسار Pi الافتراضي لـ Codex OAuth. أفضل خيار أول لإعدادات الاشتراك.         |
  | GPT-5.5 مع سلوك Codex app-server الأصلي       | `openai/gpt-5.5` بالإضافة إلى `agentRuntime.id: "codex"` | يفرض حزمة Codex app-server الأصلية لهذا المرجع من النموذج.                  |
  | توليد الصور أو تعديلها                        | `openai/gpt-image-2`                               | يعمل مع `OPENAI_API_KEY` أو OpenAI Codex OAuth.                             |
  | صور بخلفية شفافة                              | `openai/gpt-image-1.5`                             | استخدم `outputFormat=png` أو `webp` و`openai.background=transparent`.       |

  ## خريطة التسمية

  الأسماء متشابهة لكنها غير قابلة للاستبدال:

  | الاسم الذي تراه                    | الطبقة            | المعنى                                                                                               |
  | ---------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
  | `openai`                           | بادئة المزوّد     | مسار OpenAI Platform API المباشر.                                                                    |
  | `openai-codex`                     | بادئة المزوّد     | مسار OpenAI Codex OAuth/الاشتراك عبر مشغّل Pi العادي في OpenClaw.                                   |
  | Plugin `codex`                     | Plugin            | Plugin OpenClaw مضمّنة توفّر runtime أصلية لـ Codex app-server وعناصر التحكم في المحادثة `/codex`. |
  | `agentRuntime.id: codex`           | Agent runtime     | فرض حزمة Codex app-server الأصلية للدورات المضمّنة.                                                  |
  | `/codex ...`                       | مجموعة أوامر الدردشة | ربط/التحكم في خيوط Codex app-server من محادثة.                                                     |
  | `runtime: "acp", agentId: "codex"` | مسار جلسة ACP     | مسار fallback صريح يشغّل Codex عبر ACP/acpx.                                                        |

  وهذا يعني أن الإعدادات يمكن أن تحتوي عمدًا على كل من `openai-codex/*` وPlugin
  `codex`. وهذا صالح عندما تريد Codex OAuth عبر Pi وتريد أيضًا أن تكون
  عناصر التحكم الأصلية في المحادثة `/codex` متاحة. ويحذّر `openclaw doctor` من
  هذا الجمع حتى تتمكن من التأكد من أنه مقصود؛ لكنه لا يعيد كتابته.

  <Note>
  يتوفر GPT-5.5 عبر كل من الوصول المباشر إلى OpenAI Platform باستخدام مفتاح API
  ومسارات الاشتراك/OAuth. استخدم `openai/gpt-5.5` لحركة
  `OPENAI_API_KEY` المباشرة، و`openai-codex/gpt-5.5` لـ Codex OAuth عبر Pi، أو
  `openai/gpt-5.5` مع `agentRuntime.id: "codex"` لحزمة Codex
  app-server الأصلية.
  </Note>

  <Note>
  إن تمكين Plugin OpenAI، أو اختيار نموذج `openai-codex/*`، لا يؤدي
  إلى تمكين Plugin Codex app-server المضمّنة. لا يفعّل OpenClaw تلك Plugin إلا
  عندما تختار صراحةً حزمة Codex الأصلية باستخدام
  `agentRuntime.id: "codex"` أو تستخدم مرجع نموذج قديمًا من نوع `codex/*`.
  وإذا كانت Plugin `codex` المضمّنة مفعّلة لكن `openai-codex/*` لا تزال تُحل
  عبر Pi، فإن `openclaw doctor` يحذّر ويترك المسار كما هو.
  </Note>

  ## تغطية ميزات OpenClaw

  | قدرة OpenAI              | سطح OpenClaw                                              | الحالة                                                |
  | ------------------------ | --------------------------------------------------------- | ----------------------------------------------------- |
  | Chat / Responses         | مزوّد النموذج `openai/<model>`                            | نعم                                                   |
  | نماذج اشتراك Codex       | `openai-codex/<model>` مع OAuth `openai-codex`            | نعم                                                   |
  | حزمة Codex app-server    | `openai/<model>` مع `agentRuntime.id: codex`              | نعم                                                   |
  | البحث على الويب من جهة الخادم | أداة OpenAI Responses الأصلية                        | نعم، عند تمكين البحث على الويب وعدم تثبيت مزوّد محدد  |
  | الصور                    | `image_generate`                                          | نعم                                                   |
  | الفيديو                  | `video_generate`                                          | نعم                                                   |
  | تحويل النص إلى كلام      | `messages.tts.provider: "openai"` / `tts`                 | نعم                                                   |
  | تحويل الكلام إلى نص على دفعات | `tools.media.audio` / فهم الوسائط                     | نعم                                                   |
  | تحويل الكلام إلى نص بالبث | Voice Call ‏`streaming.provider: "openai"`                | نعم                                                   |
  | الصوت الفوري             | Voice Call ‏`realtime.provider: "openai"` / Control UI Talk | نعم                                                |
  | Embeddings               | مزوّد embeddings للذاكرة                                  | نعم                                                   |

  ## البدء

  اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

  <Tabs>
  <Tab title="مفتاح API ‏(OpenAI Platform)">
    **الأفضل لـ:** الوصول المباشر إلى API والفوترة حسب الاستخدام.

    <Steps>
      <Step title="احصل على مفتاح API الخاص بك">
        أنشئ أو انسخ مفتاح API من [لوحة تحكم OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        أو مرّر المفتاح مباشرةً:

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج            | إعداد runtime                       | المسار                        | المصادقة          |
    | ---------------------- | ----------------------------------- | ----------------------------- | ----------------- |
    | `openai/gpt-5.5`       | محذوف / `agentRuntime.id: "pi"`     | OpenAI Platform API مباشرة    | `OPENAI_API_KEY`  |
    | `openai/gpt-5.4-mini`  | محذوف / `agentRuntime.id: "pi"`     | OpenAI Platform API مباشرة    | `OPENAI_API_KEY`  |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`          | حزمة Codex app-server         | مصادقة Codex app-server |

    <Note>
    يُعد `openai/*` هو مسار OpenAI API المباشر بمفتاح API ما لم تفرض صراحةً
    حزمة Codex app-server. استخدم `openai-codex/*` لـ Codex OAuth عبر
    مشغّل Pi الافتراضي، أو استخدم `openai/gpt-5.5` مع
    `agentRuntime.id: "codex"` لتنفيذ Codex app-server الأصلي.
    </Note>

    ### مثال على الإعدادات

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    لا يعرّض OpenClaw النموذج `openai/gpt-5.3-codex-spark` **مطلقًا**. إذ ترفض طلبات OpenAI API الحية هذا النموذج، كما أن فهرس Codex الحالي لا يعرّضه أيضًا.
    </Warning>

  </Tab>

  <Tab title="اشتراك Codex">
    **الأفضل لـ:** استخدام اشتراك ChatGPT/Codex لديك بدلًا من مفتاح API منفصل. ويتطلب Codex cloud تسجيل دخول ChatGPT.

    <Steps>
      <Step title="شغّل Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        أو شغّل OAuth مباشرةً:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        بالنسبة إلى الإعدادات غير التفاعلية أو التي لا يناسبها callback المحلي، أضف `--device-code` لتسجيل الدخول باستخدام تدفق device-code في ChatGPT بدل callback المتصفح المحلي:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="اضبط النموذج الافتراضي">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### ملخص المسار

    | مرجع النموذج | إعداد runtime | المسار | المصادقة |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | محذوف / `runtime: "pi"` | ChatGPT/Codex OAuth عبر Pi | تسجيل دخول Codex |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | يبقى Pi ما لم تطالب Plugin صراحةً بملكية `openai-codex` | تسجيل دخول Codex |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | حزمة Codex app-server | مصادقة Codex app-server |

    <Note>
    استمر في استخدام معرّف المزوّد `openai-codex` لأوامر auth/profile. كما أن
    بادئة النموذج `openai-codex/*` هي أيضًا مسار Pi الصريح لـ Codex OAuth.
    وهي لا تختار ولا تفعّل تلقائيًا حزمة Codex app-server المضمّنة.
    </Note>

    ### مثال على الإعدادات

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    لم يعد الإعداد الأولي يستورد مادة OAuth من `~/.codex`. سجّل الدخول باستخدام OAuth في المتصفح (الافتراضي) أو باستخدام تدفق device-code أعلاه — يدير OpenClaw بيانات الاعتماد الناتجة داخل مخزن auth الخاص بالوكيل.
    </Note>

    ### مؤشر الحالة

    تعرض الدردشة `/status` أي runtime نموذج نشطة للجلسة الحالية.
    وتظهر حزمة Pi الافتراضية كالتالي: `Runtime: OpenClaw Pi Default`. وعندما
    تُحدَّد حزمة Codex app-server المضمّنة، تعرض `/status`
    القيمة `Runtime: OpenAI Codex`. وتحتفظ الجلسات الحالية بمعرّف الحزمة المسجَّل لديها، لذا استخدم
    `/new` أو `/reset` بعد تغيير `agentRuntime` إذا كنت تريد أن
    تعكس `/status` اختيارًا جديدًا بين Pi/Codex.

    ### تحذير Doctor

    إذا كانت Plugin `codex` المضمّنة مفعّلة بينما
    مسار `openai-codex/*` في علامة التبويب هذه محدد، فإن `openclaw doctor` يحذّر من أن النموذج
    لا يزال يُحل عبر Pi. وأبقِ الإعدادات دون تغيير عندما يكون هذا هو
    مسار مصادقة الاشتراك المقصود. وانتقل إلى `openai/<model>` بالإضافة إلى
    `agentRuntime.id: "codex"` فقط عندما تريد تنفيذ Codex
    app-server الأصلي.

    ### حد نافذة السياق

    يتعامل OpenClaw مع بيانات النموذج الوصفية وحد وقت التشغيل للسياق كقيمتين منفصلتين.

    بالنسبة إلى `openai-codex/gpt-5.5` عبر Codex OAuth:

    - `contextWindow` الأصلية: `1000000`
    - الحد الافتراضي لـ runtime في `contextTokens`: ‏`272000`

    يعطي الحد الافتراضي الأصغر خصائص أفضل من حيث زمن الاستجابة والجودة عمليًا. ويمكنك تجاوزه باستخدام `contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

<Note>
استخدم `contextWindow` لتعريف بيانات النموذج الوصفية الأصلية. واستخدم `contextTokens` لتقييد ميزانية السياق أثناء runtime.
</Note>

### استعادة الفهرس

يستخدم OpenClaw بيانات فهرس Codex الوصفية من المنبع لـ `gpt-5.5` عندما تكون
موجودة. وإذا أغفل الاكتشاف الحي لـ Codex الصف `openai-codex/gpt-5.5` بينما
كان الحساب موثقًا، فإن OpenClaw يصطنع صف نموذج OAuth هذا حتى لا تفشل
تشغيلات Cron والوكيل الفرعي والنموذج الافتراضي المهيأ برسالة
`Unknown model`.

  </Tab>
</Tabs>

## توليد الصور

تسجل Plugin `openai` المضمّنة توليد الصور عبر الأداة `image_generate`.
وتدعم كلًا من توليد الصور بمفتاح OpenAI API وتوليد الصور عبر Codex OAuth
من خلال مرجع النموذج نفسه `openai/gpt-image-2`.

| القدرة                    | مفتاح OpenAI API                    | Codex OAuth                           |
| ------------------------- | ----------------------------------- | ------------------------------------- |
| مرجع النموذج              | `openai/gpt-image-2`                | `openai/gpt-image-2`                  |
| المصادقة                  | `OPENAI_API_KEY`                    | تسجيل دخول OpenAI Codex OAuth         |
| النقل                     | OpenAI Images API                   | الواجهة الخلفية Codex Responses       |
| الحد الأقصى للصور في الطلب | 4                                   | 4                                     |
| وضع التعديل               | مفعّل (حتى 5 صور مرجعية)            | مفعّل (حتى 5 صور مرجعية)              |
| تجاوزات الحجم             | مدعومة، بما في ذلك أحجام 2K/4K      | مدعومة، بما في ذلك أحجام 2K/4K        |
| نسبة الأبعاد / الدقة      | لا تُمرَّر إلى OpenAI Images API    | تُربط بحجم مدعوم عندما يكون ذلك آمنًا |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
راجع [توليد الصور](/ar/tools/image-generation) لمعرفة معاملات الأداة المشتركة، واختيار المزوّد، وسلوك failover.
</Note>

يُعد `gpt-image-2` الافتراضي لكل من توليد الصور من النص في OpenAI
وتحرير الصور. ولا تزال `gpt-image-1.5` و`gpt-image-1` و`gpt-image-1-mini` قابلة للاستخدام
كتجاوزات صريحة للنماذج. استخدم `openai/gpt-image-1.5` لإخراج
PNG/WebP بخلفية شفافة؛ إذ ترفض API الحالية الخاصة بـ `gpt-image-2`
القيمة `background: "transparent"`.

وبالنسبة إلى طلب خلفية شفافة، يجب على الوكلاء استدعاء `image_generate` باستخدام
`model: "openai/gpt-image-1.5"` و`outputFormat: "png"` أو `"webp"` و
`background: "transparent"`؛ ولا يزال الخيار القديم `openai.background` الخاص بالمزوّد
مقبولًا. كما يحمي OpenClaw أيضًا المسارات العامة لـ OpenAI و
OpenAI Codex OAuth عبر إعادة كتابة طلبات الشفافية الافتراضية الخاصة بـ `openai/gpt-image-2`
إلى `gpt-image-1.5`؛ بينما تحتفظ نقاط نهاية Azure ونقاط نهاية OpenAI-compatible المخصصة
بأسماء النشر/النموذج المهيأة لديها.

ويظهر الإعداد نفسه أيضًا في تشغيلات CLI غير التفاعلية:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

استخدم العلامتين `--output-format` و`--background` نفسهما مع
`openclaw infer image edit` عند البدء من ملف إدخال.
ولا يزال `--openai-background` متاحًا كاسم بديل خاص بـ OpenAI.

في التثبيتات التي تستخدم Codex OAuth، احتفظ بمرجع `openai/gpt-image-2` نفسه. وعندما يكون
ملف OAuth تعريفي لـ `openai-codex` مهيأ، يحل OpenClaw access token الخاصة بـ OAuth المخزنة
ويرسل طلبات الصور عبر الواجهة الخلفية Codex Responses. وهو
لا يحاول أولًا استخدام `OPENAI_API_KEY` ولا يعود بصمت إلى مفتاح API لهذا
الطلب. قم بتهيئة `models.providers.openai` صراحةً باستخدام مفتاح API،
أو base URL مخصص، أو نقطة نهاية Azure عندما تريد مسار
OpenAI Images API المباشر بدلًا من ذلك.
وإذا كانت نقطة نهاية الصور المخصصة هذه موجودة على عنوان LAN/خاص موثوق، فاضبط أيضًا
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; إذ يُبقي OpenClaw
نقاط نهاية الصور الخاصة/الداخلية المتوافقة مع OpenAI محظورة ما لم يوجد هذا الاشتراك الصريح.

التوليد:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

توليد PNG بخلفية شفافة:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

التعديل:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## توليد الفيديو

تسجل Plugin `openai` المضمّنة توليد الفيديو عبر الأداة `video_generate`.

| القدرة             | القيمة                                                                             |
| ------------------ | ---------------------------------------------------------------------------------- |
| النموذج الافتراضي  | `openai/sora-2`                                                                    |
| الأوضاع            | نص إلى فيديو، وصورة إلى فيديو، وتحرير فيديو واحد                                  |
| المدخلات المرجعية   | صورة واحدة أو فيديو واحد                                                           |
| تجاوزات الحجم      | مدعومة                                                                             |
| تجاوزات أخرى       | يتم تجاهل `aspectRatio` و`resolution` و`audio` و`watermark` مع تحذير من الأداة     |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
راجع [توليد الفيديو](/ar/tools/video-generation) لمعرفة معاملات الأداة المشتركة، واختيار المزوّد، وسلوك failover.
</Note>

## مساهمة موجه GPT-5

يضيف OpenClaw مساهمة موجه مشتركة لـ GPT-5 في تشغيلات عائلة GPT-5 عبر المزوّدين. وهي تُطبَّق بحسب معرّف النموذج، لذا فإن `openai-codex/gpt-5.5` و`openai/gpt-5.5` و`openrouter/openai/gpt-5.5` و`opencode/gpt-5.5` وغيرها من مراجع GPT-5 المتوافقة تتلقى overlay نفسها. أما النماذج الأقدم من GPT-4.x فلا تتلقاها.

تستخدم حزمة Codex الأصلية المضمّنة سلوك GPT-5 نفسه وoverlay الخاصة بـ Heartbeat عبر تعليمات المطوّر في Codex app-server، لذلك تحافظ جلسات `openai/gpt-5.x` المفروضة عبر `agentRuntime.id: "codex"` على إرشادات المتابعة نفسها وإرشادات Heartbeat الاستباقية نفسها، حتى مع امتلاك Codex لبقية موجه الحزمة.

تضيف مساهمة GPT-5 عقد سلوك موسومًا من أجل استمرارية الشخصية، وأمان التنفيذ، وانضباط الأدوات، وشكل المخرجات، وفحوصات الإكمال، والتحقق. أما سلوك الردود الخاصة بالقنوات وسلوك الرسائل الصامتة فيبقيان داخل موجه النظام المشتركة في OpenClaw وسياسة التسليم الصادر. وتكون إرشادات GPT-5 مفعلة دائمًا للنماذج المطابقة. أما طبقة أسلوب التفاعل الودّي فهي منفصلة وقابلة للتهيئة.

| القيمة                 | التأثير                                      |
| ---------------------- | -------------------------------------------- |
| `"friendly"` (الافتراضي) | تمكين طبقة أسلوب التفاعل الودّي            |
| `"on"`                 | اسم بديل لـ `"friendly"`                     |
| `"off"`                | تعطيل طبقة الأسلوب الودّي فقط               |

<Tabs>
  <Tab title="الإعدادات">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
القيم غير حساسة لحالة الأحرف أثناء runtime، لذا فإن `"Off"` و`"off"` كلتاهما تعطلان طبقة الأسلوب الودّي.
</Tip>

<Note>
لا يزال `plugins.entries.openai.config.personality` القديم مقروءًا كقيمة fallback للتوافق عندما لا يكون الإعداد المشترك `agents.defaults.promptOverlays.gpt5.personality` مضبوطًا.
</Note>

## الصوت والكلام

<AccordionGroup>
  <Accordion title="توليف الكلام (TTS)">
    تسجل Plugin `openai` المضمّنة توليف الكلام لسطح `messages.tts`.

    | الإعداد | مسار الإعدادات | الافتراضي |
    |---------|----------------|-----------|
    | النموذج | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | الصوت | `messages.tts.providers.openai.voice` | `coral` |
    | السرعة | `messages.tts.providers.openai.speed` | (غير مضبوط) |
    | التعليمات | `messages.tts.providers.openai.instructions` | (غير مضبوط، لـ `gpt-4o-mini-tts` فقط) |
    | التنسيق | `messages.tts.providers.openai.responseFormat` | `opus` للملاحظات الصوتية، و`mp3` للملفات |
    | مفتاح API | `messages.tts.providers.openai.apiKey` | يعود إلى `OPENAI_API_KEY` كقيمة fallback |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    النماذج المتاحة: `gpt-4o-mini-tts` و`tts-1` و`tts-1-hd`. والأصوات المتاحة: `alloy` و`ash` و`ballad` و`cedar` و`coral` و`echo` و`fable` و`juniper` و`marin` و`onyx` و`nova` و`sage` و`shimmer` و`verse`.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    اضبط `OPENAI_TTS_BASE_URL` لتجاوز base URL الخاصة بـ TTS من دون التأثير في نقطة نهاية Chat API.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    تسجل Plugin `openai` المضمّنة تحويل الكلام إلى نص على دفعات عبر
    سطح النسخ الخاص بفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `gpt-4o-transcribe`
    - نقطة النهاية: OpenAI REST ‏`/v1/audio/transcriptions`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم في OpenClaw أينما استخدم نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قنوات Discord الصوتية
      ومرفقات الصوت في القنوات

    لفرض OpenAI على نسخ الصوت الوارد:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    يتم تمرير تلميحات اللغة والموجه إلى OpenAI عند تقديمها من
    إعدادات الوسائط الصوتية المشتركة أو من طلب النسخ لكل استدعاء.

  </Accordion>

  <Accordion title="النسخ الفوري">
    تسجل Plugin `openai` المضمّنة النسخ الفوري لPlugin Voice Call.

    | الإعداد | مسار الإعدادات | الافتراضي |
    |---------|----------------|-----------|
    | النموذج | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | اللغة | `...openai.language` | (غير مضبوط) |
    | الموجه | `...openai.prompt` | (غير مضبوط) |
    | مدة الصمت | `...openai.silenceDurationMs` | `800` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مفتاح API | `...openai.apiKey` | يعود إلى `OPENAI_API_KEY` كقيمة fallback |

    <Note>
    يستخدم اتصال WebSocket إلى `wss://api.openai.com/v1/realtime` مع صوت G.711 u-law ‏(`g711_ulaw` / `audio/pcmu`). ومزوّد البث هذا مخصص لمسار النسخ الفوري في Voice Call؛ أما Discord voice فتسجل حاليًا مقاطع قصيرة وتستخدم مسار النسخ على دفعات `tools.media.audio` بدلًا من ذلك.
    </Note>

  </Accordion>

  <Accordion title="الصوت الفوري">
    تسجل Plugin `openai` المضمّنة الصوت الفوري لPlugin Voice Call.

    | الإعداد | مسار الإعدادات | الافتراضي |
    |---------|----------------|-----------|
    | النموذج | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | الصوت | `...openai.voice` | `alloy` |
    | درجة الحرارة | `...openai.temperature` | `0.8` |
    | عتبة VAD | `...openai.vadThreshold` | `0.5` |
    | مدة الصمت | `...openai.silenceDurationMs` | `500` |
    | مفتاح API | `...openai.apiKey` | يعود إلى `OPENAI_API_KEY` كقيمة fallback |

    <Note>
    يدعم Azure OpenAI عبر مفاتيح الإعدادات `azureEndpoint` و`azureDeployment`. ويدعم استدعاء الأدوات ثنائي الاتجاه. ويستخدم تنسيق الصوت G.711 u-law.
    </Note>

  </Accordion>
</AccordionGroup>

## نقاط نهاية Azure OpenAI

يمكن لمزوّد `openai` المضمّن استهداف مورد Azure OpenAI لتوليد الصور
عبر تجاوز base URL. وفي مسار توليد الصور، يكتشف OpenClaw
أسماء مضيفات Azure في `models.providers.openai.baseUrl` وينتقل تلقائيًا إلى
شكل الطلب الخاص بـ Azure.

<Note>
يستخدم الصوت الفوري مسار إعدادات منفصلًا
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
ولا يتأثر بـ `models.providers.openai.baseUrl`. راجع أكورديون **الصوت
الفوري** تحت [الصوت والكلام](#voice-and-speech) لمعرفة إعدادات Azure
الخاصة به.
</Note>

استخدم Azure OpenAI عندما:

- يكون لديك بالفعل اشتراك Azure OpenAI أو حصة أو اتفاقية مؤسسية
- تحتاج إلى إقامة البيانات الإقليمية أو عناصر التحكم في الامتثال التي توفرها Azure
- تريد إبقاء حركة المرور داخل بيئة Azure موجودة

### التهيئة

بالنسبة إلى توليد الصور عبر Azure باستخدام مزوّد `openai` المضمّن، وجّه
`models.providers.openai.baseUrl` إلى مورد Azure الخاص بك واضبط `apiKey` على
مفتاح Azure OpenAI (وليس مفتاح OpenAI Platform):

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

يتعرف OpenClaw على لواحق مضيف Azure هذه لمسار توليد الصور في Azure:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

وبالنسبة إلى طلبات توليد الصور على مضيف Azure معروف، يقوم OpenClaw بما يلي:

- يرسل الترويسة `api-key` بدلًا من `Authorization: Bearer`
- يستخدم مسارات على مستوى النشر (`/openai/deployments/{deployment}/...`)
- يُلحق `?api-version=...` بكل طلب
- يستخدم مهلة طلب افتراضية قدرها 600 ثانية لاستدعاءات توليد الصور في Azure.
  وتظل قيم `timeoutMs` لكل استدعاء تتجاوز هذا الافتراضي.

أما عناوين base URL الأخرى (OpenAI العامة، وواجهات OpenAI-compatible proxy) فتحتفظ
بشكل طلبات الصور القياسي في OpenAI.

<Note>
يتطلب توجيه Azure لمسار توليد الصور في مزوّد `openai`
إصدار OpenClaw ‏2026.4.22 أو أحدث. أما الإصدارات الأقدم فتعامل أي
`openai.baseUrl` مخصص مثل نقطة نهاية OpenAI العامة وستفشل مع
عمليات نشر الصور في Azure.
</Note>

### إصدار API

اضبط `AZURE_OPENAI_API_VERSION` لتثبيت إصدار preview أو GA معين
لمسار توليد الصور في Azure:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

القيمة الافتراضية هي `2024-12-01-preview` عندما يكون المتغير غير مضبوط.

### أسماء النماذج هي أسماء عمليات النشر

تربط Azure OpenAI النماذج بعمليات النشر. وبالنسبة إلى طلبات توليد الصور في Azure
الموجّهة عبر مزوّد `openai` المضمّن، يجب أن يكون الحقل `model` في OpenClaw هو
**اسم النشر في Azure** الذي قمت بتهيئته في بوابة Azure، وليس
معرّف نموذج OpenAI العام.

إذا أنشأت نشرًا باسم `gpt-image-2-prod` يخدّم `gpt-image-2`:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

وتنطبق قاعدة اسم النشر نفسها على استدعاءات توليد الصور الموجّهة عبر
مزوّد `openai` المضمّن.

### التوفر الإقليمي

يتوفر توليد الصور في Azure حاليًا فقط في مجموعة فرعية من المناطق
(مثل `eastus2` و`swedencentral` و`polandcentral` و`westus3` و
`uaenorth`). تحقق من قائمة المناطق الحالية لدى Microsoft قبل إنشاء
نشر، وتأكد من أن النموذج المحدد متاح في منطقتك.

### اختلافات المعاملات

لا تقبل Azure OpenAI وOpenAI العامة دائمًا معاملات الصور نفسها.
وقد ترفض Azure خيارات تسمح بها OpenAI العامة (مثل بعض قيم
`background` على `gpt-image-2`) أو تتيحها فقط في إصدارات نماذج معينة. وتأتي
هذه الاختلافات من Azure والنموذج الأساسي، وليس من
OpenClaw. وإذا فشل طلب Azure بخطأ تحقق، فتحقق من
مجموعة المعاملات التي يدعمها النشر المحدد وإصدار API المحدد في
بوابة Azure.

<Note>
تستخدم Azure OpenAI النقل الأصلي وسلوك compat الأصلي، لكنها لا تتلقى
ترويسات الإسناد المخفية الخاصة بـ OpenClaw — راجع أكورديون **المسارات الأصلية مقابل المسارات
المتوافقة مع OpenAI** تحت [التهيئة المتقدمة](#advanced-configuration).

أما بالنسبة إلى حركة chat أو Responses على Azure (إلى جانب توليد الصور)، فاستخدم
تدفق الإعداد الأولي أو إعدادات مزوّد Azure مخصصة — فـ `openai.baseUrl` وحدها
لا تلتقط شكل API/auth الخاص بـ Azure. ويوجد مزوّد منفصل
`azure-openai-responses/*`؛ راجع
أكورديون Compaction من جهة الخادم أدناه.
</Note>

## تهيئة متقدمة

<AccordionGroup>
  <Accordion title="النقل (WebSocket مقابل SSE)">
    يستخدم OpenClaw نمط WebSocket أولًا مع fallback إلى SSE ‏(`"auto"`) لكل من `openai/*` و`openai-codex/*`.

    في وضع `"auto"`، يقوم OpenClaw بما يلي:
    - يعيد محاولة فشل WebSocket مبكر واحد قبل العودة إلى SSE
    - بعد الفشل، يضع علامة على WebSocket بأنها degraded لمدة تقارب 60 ثانية ويستخدم SSE أثناء فترة التهدئة
    - يرفق ترويسات ثابتة لهوية الجلسة والدورة من أجل إعادة المحاولات وإعادة الاتصال
    - يطبّع عدادات الاستخدام (`input_tokens` / `prompt_tokens`) عبر أنواع النقل المختلفة

    | القيمة | السلوك |
    |-------|--------|
    | `"auto"` (الافتراضي) | WebSocket أولًا، fallback إلى SSE |
    | `"sse"` | فرض SSE فقط |
    | `"websocket"` | فرض WebSocket فقط |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    وثائق OpenAI ذات الصلة:
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="الإحماء في WebSocket">
    يفعّل OpenClaw افتراضيًا الإحماء في WebSocket لـ `openai/*` و`openai-codex/*` لتقليل زمن انتظار الدورة الأولى.

    ```json5
    // تعطيل الإحماء
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="الوضع السريع">
    يعرّض OpenClaw مفتاح تبديل مشترك للوضع السريع لكل من `openai/*` و`openai-codex/*`:

    - **الدردشة/واجهة المستخدم:** ‏`/fast status|on|off`
    - **الإعدادات:** ‏`agents.defaults.models["<provider>/<model>"].params.fastMode`

    عند التمكين، يربط OpenClaw الوضع السريع بمعالجة الأولوية في OpenAI ‏(`service_tier = "priority"`). وتُحفَظ قيم `service_tier` الموجودة، ولا يعيد الوضع السريع كتابة `reasoning` أو `text.verbosity`.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    تتقدم تجاوزات الجلسة على الإعدادات. ويؤدي مسح تجاوز الجلسة في واجهة Sessions UI إلى إعادة الجلسة إلى الافتراضي المهيأ.
    </Note>

  </Accordion>

  <Accordion title="معالجة الأولوية (service_tier)">
    تعرض API الخاصة بـ OpenAI معالجة الأولوية عبر `service_tier`. ويمكنك ضبطها لكل نموذج في OpenClaw:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    القيم المدعومة: `auto` و`default` و`flex` و`priority`.

    <Warning>
    لا يتم تمرير `serviceTier` إلا إلى نقاط نهاية OpenAI الأصلية (`api.openai.com`) ونقاط نهاية Codex الأصلية (`chatgpt.com/backend-api`). وإذا وجهت أيًا من المزوّدين عبر proxy، يترك OpenClaw قيمة `service_tier` دون تغيير.
    </Warning>

  </Accordion>

  <Accordion title="Compaction من جهة الخادم (Responses API)">
    بالنسبة إلى نماذج OpenAI Responses المباشرة (`openai/*` على `api.openai.com`)، يقوم غلاف البث Pi-harness الخاص بـ Plugin OpenAI بتمكين Compaction من جهة الخادم تلقائيًا:

    - يفرض `store: true` (ما لم تضبط compat الخاصة بالنموذج `supportsStore: false`)
    - يحقن `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - `compact_threshold` الافتراضي: 70% من `contextWindow` (أو `80000` عند عدم توفرها)

    ينطبق هذا على مسار Pi harness المضمّن وعلى hooks مزوّد OpenAI المستخدمة في التشغيلات المضمّنة. أما حزمة Codex app-server الأصلية فتدير سياقها بنفسها عبر Codex ويتم تهيئتها بشكل منفصل باستخدام `agents.defaults.agentRuntime.id`.

    <Tabs>
      <Tab title="تمكين صريح">
        مفيد لنقاط النهاية المتوافقة مثل Azure OpenAI Responses:

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="عتبة مخصصة">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="تعطيل">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    يتحكم `responsesServerCompaction` فقط في حقن `context_management`. ولا تزال نماذج OpenAI Responses المباشرة تفرض `store: true` ما لم تضبط compat القيمة `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="وضع GPT الصارم agentic">
    بالنسبة إلى تشغيلات عائلة GPT-5 على `openai/*`، يمكن لـ OpenClaw استخدام عقد تنفيذ مضمّن أكثر صرامة:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    مع `strict-agentic`، يقوم OpenClaw بما يلي:
    - لم يعد يعامل دورة تقتصر على التخطيط على أنها تقدم ناجح عندما يكون إجراء أداة متاحًا
    - يعيد محاولة الدورة مع توجيه نحو التنفيذ الآن
    - يفعّل تلقائيًا `update_plan` للأعمال الجوهرية
    - يعرض حالة blocked صريحة إذا استمر النموذج في التخطيط دون تنفيذ

    <Note>
    هذا محصور بتشغيلات OpenAI وCodex لعائلة GPT-5 فقط. أما المزوّدون الآخرون وعائلات النماذج الأقدم فيحتفظون بالسلوك الافتراضي.
    </Note>

  </Accordion>

  <Accordion title="المسارات الأصلية مقابل المسارات المتوافقة مع OpenAI">
    يعامل OpenClaw نقاط نهاية OpenAI المباشرة وCodex وAzure OpenAI بشكل مختلف عن نقاط proxy العامة المتوافقة مع OpenAI على `/v1`:

    **المسارات الأصلية** (`openai/*` وAzure OpenAI):
    - تحتفظ بـ `reasoning: { effort: "none" }` فقط للنماذج التي تدعم قيمة OpenAI `none` الأصلية
    - تحذف reasoning المعطلة بالنسبة إلى النماذج أو نقاط proxy التي ترفض `reasoning.effort: "none"`
    - تجعل schemas الأدوات في الوضع الصارم افتراضيًا
    - ترفق ترويسات attribution مخفية على المضيفات الأصلية المتحقق منها فقط
    - تحتفظ بشكل الطلب الخاص بـ OpenAI فقط (`service_tier` و`store` وreasoning-compat وتلميحات prompt-cache)

    **المسارات المتوافقة/عبر proxy:**
    - تستخدم سلوك compat أكثر مرونة
    - تزيل `store` الخاصة بـ Completions من حمولات `openai-completions` غير الأصلية
    - تقبل JSON تمرير متقدمة لـ `params.extra_body`/`params.extraBody` من أجل نقاط proxy المتوافقة مع OpenAI Completions
    - تقبل `params.chat_template_kwargs` لنقاط OpenAI-compatible Completions proxy مثل vLLM
    - لا تفرض schemas أدوات صارمة ولا ترويسات أصلية فقط

    تستخدم Azure OpenAI النقل الأصلي وسلوك compat الأصلي لكنها لا تتلقى ترويسات attribution المخفية.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك failover.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="OAuth والمصادقة" href="/ar/gateway/authentication" icon="key">
    تفاصيل المصادقة وقواعد إعادة استخدام بيانات الاعتماد.
  </Card>
</CardGroup>
