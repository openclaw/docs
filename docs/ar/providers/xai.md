---
read_when:
    - تريد استخدام نماذج Grok في OpenClaw
    - أنت تُهيّئ مصادقة xAI أو معرّفات النماذج
summary: استخدام نماذج xAI Grok في OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-02T07:41:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw يوفّر Plugin مدمجًا لمزوّد `xai` لنماذج Grok.

## البدء

<Steps>
  <Step title="إنشاء مفتاح API">
    أنشئ مفتاح API في [وحدة تحكم xAI](https://console.x.ai/).
  </Step>
  <Step title="تعيين مفتاح API الخاص بك">
    عيّن `XAI_API_KEY`، أو شغّل:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="اختيار نموذج">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
يستخدم OpenClaw واجهة xAI Responses API باعتبارها وسيلة نقل xAI المدمجة. يمكن لمفتاح
`XAI_API_KEY` نفسه أيضًا تشغيل `web_search` المدعوم من Grok، و`x_search`
من الدرجة الأولى، و`code_execution` البعيد.
إذا خزّنت مفتاح xAI ضمن `plugins.entries.xai.config.webSearch.apiKey`،
فإن مزوّد نموذج xAI المدمج يعيد استخدام ذلك المفتاح كخيار احتياطي أيضًا.
عيّن `plugins.entries.xai.config.webSearch.baseUrl` لتوجيه `web_search` الخاص بـ Grok
و`x_search` افتراضيًا عبر وكيل xAI Responses خاص بالمشغّل.
توجد إعدادات ضبط `code_execution` ضمن `plugins.entries.xai.config.codeExecution`.
</Note>

## الفهرس المدمج

يتضمن OpenClaw عائلات نماذج xAI التالية بشكل جاهز:

| العائلة        | معرّفات النماذج                                                          |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

يحلّ Plugin أيضًا معرّفات `grok-4*` و`grok-code-fast*` الأحدث مسبقًا عندما
تتبع شكل API نفسه.

<Tip>
`grok-4.3` و`grok-4-fast` و`grok-4-1-fast` ومتغيرات `grok-4.20-beta-*`
هي مراجع Grok الحالية القادرة على التعامل مع الصور في الفهرس المدمج.
</Tip>

## تغطية ميزات OpenClaw

يربط Plugin المدمج سطح API العام الحالي لدى xAI بعقود المزوّد والأدوات
المشتركة في OpenClaw. لا تُعرض الإمكانات التي لا تلائم العقد المشترك
(مثل TTS المتدفق والصوت الفوري) — راجع الجدول أدناه.

| إمكانية xAI                 | سطح OpenClaw                             | الحالة                                                             |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| الدردشة / Responses        | مزوّد نموذج `xai/<model>`                 | نعم                                                                 |
| بحث الويب من جهة الخادم    | مزوّد `web_search` وهو `grok`             | نعم                                                                 |
| بحث X من جهة الخادم        | أداة `x_search`                           | نعم                                                                 |
| تنفيذ الشيفرة من جهة الخادم | أداة `code_execution`                     | نعم                                                                 |
| الصور                      | `image_generate`                          | نعم                                                                 |
| الفيديوهات                 | `video_generate`                          | نعم                                                                 |
| تحويل النص إلى كلام دفعي   | `messages.tts.provider: "xai"` / `tts`    | نعم                                                                 |
| TTS متدفق                  | —                                         | غير معروض؛ يعيد عقد TTS في OpenClaw مخازن صوتية كاملة              |
| تحويل الكلام إلى نص دفعي   | `tools.media.audio` / فهم الوسائط         | نعم                                                                 |
| تحويل الكلام إلى نص متدفق  | Voice Call `streaming.provider: "xai"`    | نعم                                                                 |
| الصوت الفوري               | —                                         | غير معروض بعد؛ له عقد جلسة/WebSocket مختلف                         |
| الملفات / الدُفعات         | توافق API النموذج العامة فقط             | ليست أداة OpenClaw من الدرجة الأولى                                |

<Note>
يستخدم OpenClaw واجهات xAI REST API للصور/الفيديو/TTS/STT لإنشاء الوسائط،
والكلام، والنسخ الدفعي، وWebSocket STT المتدفق من xAI لنسخ
مكالمات الصوت الحية، وResponses API لأدوات النموذج والبحث
وتنفيذ الشيفرة. الميزات التي تحتاج إلى عقود OpenClaw مختلفة، مثل
جلسات الصوت الفورية، موثقة هنا كإمكانات من المصدر الأعلى
وليست كسلوك مخفي في Plugin.
</Note>

### تعيينات الوضع السريع

يعيد `/fast on` أو `agents.defaults.models["xai/<model>"].params.fastMode: true`
كتابة طلبات xAI الأصلية كما يلي:

| نموذج المصدر | هدف الوضع السريع |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### أسماء التوافق القديمة

لا تزال الأسماء القديمة تُطبّع إلى المعرّفات المدمجة القياسية:

| الاسم القديم              | المعرّف القياسي                       |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## الميزات

<AccordionGroup>
  <Accordion title="بحث الويب">
    يستخدم مزوّد بحث الويب `grok` المدمج `XAI_API_KEY` أيضًا:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="إنشاء الفيديو">
    يسجّل Plugin `xai` المدمج إنشاء الفيديو عبر أداة
    `video_generate` المشتركة.

    - نموذج الفيديو الافتراضي: `xai/grok-imagine-video`
    - الأوضاع: نص إلى فيديو، صورة إلى فيديو، إنشاء صورة مرجعية، تحرير فيديو
      بعيد، وتمديد فيديو بعيد
    - نسب العرض إلى الارتفاع: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - الدقات: `480P`, `720P`
    - المدة: 1-15 ثانية للإنشاء/الصورة إلى الفيديو، و1-10 ثوانٍ عند
      استخدام أدوار `reference_image`، و2-10 ثوانٍ للتمديد
    - إنشاء الصورة المرجعية: عيّن `imageRoles` إلى `reference_image` لكل
      صورة مقدمة؛ تقبل xAI ما يصل إلى 7 صور من هذا النوع

    <Warning>
    لا تُقبل مخازن الفيديو المحلية. استخدم عناوين URL بعيدة `http(s)` لمدخلات
    تحرير/تمديد الفيديو. تقبل الصورة إلى الفيديو مخازن الصور المحلية لأن
    OpenClaw يستطيع ترميزها كعناوين URL بيانات لـ xAI.
    </Warning>

    لاستخدام xAI كمزوّد الفيديو الافتراضي:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة،
    واختيار المزوّد، وسلوك تجاوز الفشل.
    </Note>

  </Accordion>

  <Accordion title="إنشاء الصور">
    يسجّل Plugin `xai` المدمج إنشاء الصور عبر أداة
    `image_generate` المشتركة.

    - نموذج الصور الافتراضي: `xai/grok-imagine-image`
    - نموذج إضافي: `xai/grok-imagine-image-pro`
    - الأوضاع: نص إلى صورة وتحرير صورة مرجعية
    - المدخلات المرجعية: `image` واحدة أو ما يصل إلى خمس `images`
    - نسب العرض إلى الارتفاع: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - الدقات: `1K`, `2K`
    - العدد: ما يصل إلى 4 صور

    يطلب OpenClaw من xAI استجابات صور `b64_json` حتى يمكن تخزين الوسائط
    المنشأة وتسليمها عبر مسار مرفقات القناة العادي. تُحوّل الصور المرجعية
    المحلية إلى عناوين URL بيانات؛ أما مراجع `http(s)` البعيدة فتمر كما هي.

    لاستخدام xAI كمزوّد الصور الافتراضي:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    توثّق xAI أيضًا `quality` و`mask` و`user` ونسبًا أصلية إضافية
    مثل `1:2` و`2:1` و`9:20` و`20:9`. يمرّر OpenClaw اليوم عناصر التحكم
    المشتركة للصور عبر المزوّدين فقط؛ أما المقابض الأصلية غير المدعومة
    والمخصصة لمزوّد واحد فلا تُعرض عمدًا عبر `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="تحويل النص إلى كلام">
    يسجّل Plugin `xai` المدمج تحويل النص إلى كلام عبر سطح مزوّد `tts`
    المشترك.

    - الأصوات: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - الصوت الافتراضي: `eve`
    - التنسيقات: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - اللغة: رمز BCP-47 أو `auto`
    - السرعة: تجاوز السرعة الأصلي للمزوّد
    - تنسيق الملاحظة الصوتية Opus الأصلي غير مدعوم

    لاستخدام xAI كمزوّد TTS الافتراضي:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    يستخدم OpenClaw نقطة نهاية xAI الدفعية `/v1/tts`. توفر xAI أيضًا TTS متدفقًا
    عبر WebSocket، لكن عقد مزوّد الكلام في OpenClaw يتوقع حاليًا
    مخزنًا صوتيًا كاملًا قبل تسليم الرد.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجّل Plugin `xai` المدمج تحويل الكلام إلى نص دفعيًا عبر سطح نسخ
    فهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `grok-stt`
    - نقطة النهاية: xAI REST `/v1/stt`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم من OpenClaw في كل موضع يستخدم نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قناة الصوت في Discord
      ومرفقات الصوت في القنوات

    لفرض xAI لنسخ الصوت الوارد:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    يمكن توفير اللغة عبر إعدادات الوسائط الصوتية المشتركة أو عبر طلب النسخ
    لكل استدعاء. تقبل واجهة OpenClaw المشتركة تلميحات الموجه، لكن تكامل
    xAI REST STT لا يمرّر إلا الملف والنموذج واللغة لأن هذه العناصر تتطابق
    بوضوح مع نقطة نهاية xAI العامة الحالية.

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص متدفق">
    يسجّل Plugin `xai` المدمج أيضًا مزوّد نسخ فوريًا
    لصوت مكالمات الصوت الحية.

    - نقطة النهاية: xAI WebSocket `wss://api.x.ai/v1/stt`
    - الترميز الافتراضي: `mulaw`
    - معدل العينة الافتراضي: `8000`
    - تحديد نهاية الكلام الافتراضي: `800ms`
    - النسخ المؤقتة: مفعّلة افتراضيًا

    يرسل تدفق وسائط Twilio في Voice Call إطارات صوت G.711 µ-law، لذلك يستطيع
    مزوّد xAI تمرير تلك الإطارات مباشرة دون تحويل ترميز:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Provider-owned config lives under
    `plugins.entries.voice-call.config.streaming.providers.xai`. Supported
    keys are `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`, or
    `alaw`), `interimResults`, `endpointingMs`, and `language`.

    <Note>
    This streaming provider is for Voice Call's realtime transcription path.
    Discord voice currently records short segments and uses the batch
    `tools.media.audio` transcription path instead.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    The bundled xAI plugin exposes `x_search` as an OpenClaw tool for searching
    X (formerly Twitter) content via Grok.

    Config path: `plugins.entries.xai.config.xSearch`

    | Key                | Type    | Default            | Description                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | Enable or disable x_search           |
    | `model`            | string  | `grok-4-1-fast`    | Model used for x_search requests     |
    | `baseUrl`          | string  | —                  | xAI Responses base URL override      |
    | `inlineCitations`  | boolean | —                  | Include inline citations in results  |
    | `maxTurns`         | number  | —                  | Maximum conversation turns           |
    | `timeoutSeconds`   | number  | —                  | Request timeout in seconds           |
    | `cacheTtlMinutes`  | number  | —                  | Cache time-to-live in minutes        |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Code execution configuration">
    The bundled xAI plugin exposes `code_execution` as an OpenClaw tool for
    remote code execution in xAI's sandbox environment.

    Config path: `plugins.entries.xai.config.codeExecution`

    | Key               | Type    | Default            | Description                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true` (if key available) | Enable or disable code execution  |
    | `model`           | string  | `grok-4-1-fast`    | Model used for code execution requests   |
    | `maxTurns`        | number  | —                  | Maximum conversation turns               |
    | `timeoutSeconds`  | number  | —                  | Request timeout in seconds               |

    <Note>
    This is remote xAI sandbox execution, not local [`exec`](/ar/tools/exec).
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Known limits">
    - Auth is API-key only today. There is no xAI OAuth or device-code flow in
      OpenClaw yet.
    - `grok-4.20-multi-agent-experimental-beta-0304` is not supported on the
      normal xAI provider path because it requires a different upstream API
      surface than the standard OpenClaw xAI transport.
    - xAI Realtime voice is not registered as an OpenClaw provider yet. It
      needs a different bidirectional voice session contract than batch STT or
      streaming transcription.
    - xAI image `quality`, image `mask`, and extra native-only aspect ratios are
      not exposed until the shared `image_generate` tool has corresponding
      cross-provider controls.
  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw applies xAI-specific tool-schema and tool-call compatibility fixes
      automatically on the shared runner path.
    - Native xAI requests default `tool_stream: true`. Set
      `agents.defaults.models["xai/<model>"].params.tool_stream` to `false` to
      disable it.
    - The bundled xAI wrapper strips unsupported strict tool-schema flags and
      reasoning payload keys before sending native xAI requests.
    - `web_search`, `x_search`, and `code_execution` are exposed as OpenClaw
      tools. OpenClaw enables the specific xAI built-in it needs inside each tool
      request instead of attaching all native tools to every chat turn.
    - Grok `web_search` reads `plugins.entries.xai.config.webSearch.baseUrl`.
      `x_search` reads `plugins.entries.xai.config.xSearch.baseUrl`, then
      falls back to the Grok web-search base URL.
    - `x_search` and `code_execution` are owned by the bundled xAI plugin rather
      than hardcoded into the core model runtime.
    - `code_execution` is remote xAI sandbox execution, not local
      [`exec`](/ar/tools/exec).
  </Accordion>
</AccordionGroup>

## Live testing

The xAI media paths are covered by unit tests and opt-in live suites. The live
commands load secrets from your login shell, including `~/.profile`, before
probing `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

The provider-specific live file synthesizes normal TTS, telephony-friendly PCM
TTS, transcribes audio through xAI batch STT, streams the same PCM through xAI
realtime STT, generates text-to-image output, and edits a reference image. The
shared image live file verifies the same xAI provider through OpenClaw's
runtime selection, fallback, normalization, and media attachment path.

## Related

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    Choosing providers, model refs, and failover behavior.
  </Card>
  <Card title="Video generation" href="/ar/tools/video-generation" icon="video">
    Shared video tool parameters and provider selection.
  </Card>
  <Card title="All providers" href="/ar/providers/index" icon="grid-2">
    The broader provider overview.
  </Card>
  <Card title="Troubleshooting" href="/ar/help/troubleshooting" icon="wrench">
    Common issues and fixes.
  </Card>
</CardGroup>
