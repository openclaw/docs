---
read_when:
    - OpenClaw'da Alibaba Wan video oluşturmayı kullanmak istiyorsunuz
    - Video oluşturmak için Model Studio veya DashScope API anahtarını ayarlamanız gerekir
summary: OpenClaw'da Alibaba Model Studio Wan ile video oluşturma
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T12:38:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

Paketle birlikte gelen `alibaba` Plugin'i, Alibaba Model Studio'daki (DashScope'un uluslararası adı) Wan modelleri için bir video oluşturma sağlayıcısı kaydeder. Varsayılan olarak etkindir; yalnızca bir API anahtarı gerekir.

| Özellik               | Değer                                                                           |
| --------------------- | ------------------------------------------------------------------------------- |
| Sağlayıcı kimliği     | `alibaba`                                                                       |
| Plugin                | paketle birlikte gelir, `enabledByDefault: true`                                |
| Kimlik doğrulama ortam değişkenleri | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (ilk eşleşme kullanılır) |
| İlk kurulum bayrağı   | `--auth-choice alibaba-model-studio-api-key`                                    |
| Doğrudan CLI bayrağı  | `--alibaba-model-studio-api-key <key>`                                          |
| Varsayılan model      | `alibaba/wan2.6-t2v`                                                            |
| Varsayılan temel URL  | `https://dashscope-intl.aliyuncs.com`                                           |

## Başlarken

<Steps>
  <Step title="Bir API anahtarı ayarlayın">
    İlk kurulum aracılığıyla anahtarı `alibaba` sağlayıcısı için saklayın:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Alternatif olarak anahtarı doğrudan iletin:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Ya da Gateway'i başlatmadan önce kabul edilen ortam değişkenlerinden birini dışa aktarın:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # veya DASHSCOPE_API_KEY=...
    # veya QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Varsayılan bir video modeli ayarlayın">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Sağlayıcının yapılandırıldığını doğrulayın">
    ```bash
    openclaw models list --provider alibaba
    ```

    Liste, paketle birlikte gelen beş Wan modelinin tümünü içerir. `MODELSTUDIO_API_KEY` çözümlenemezse `openclaw models status --json`, eksik kimlik bilgisini `auth.unusableProfiles` altında bildirir.

  </Step>
</Steps>

<Note>
  Alibaba Plugin'i ve [Qwen Plugin'i](/tr/providers/qwen), DashScope üzerinde kimlik doğrulaması yapar ve örtüşen ortam değişkenlerini kabul eder. Wan'a özel video yüzeyi için `alibaba/...` model kimliklerini; Qwen sohbeti, gömme veya medya anlama işlevleri için `qwen/...` kimliklerini kullanın.
</Note>

## Yerleşik Wan modelleri

| Model başvurusu             | Mod                              |
| --------------------------- | -------------------------------- |
| `alibaba/wan2.6-t2v`        | Metinden videoya (varsayılan)    |
| `alibaba/wan2.6-i2v`        | Görüntüden videoya               |
| `alibaba/wan2.6-r2v`        | Referanstan videoya              |
| `alibaba/wan2.6-r2v-flash`  | Referanstan videoya (hızlı)      |
| `alibaba/wan2.7-r2v`        | Referanstan videoya              |

## Yetenekler ve sınırlar

Üç modun tümü, istek başına aynı video sayısı ve süre sınırını paylaşır; yalnızca girdi biçimi farklıdır.

| Mod                    | En fazla çıktı videosu | En fazla girdi görüntüsü | En fazla girdi videosu | En fazla süre | Desteklenen denetimler                                   |
| ---------------------- | ---------------------- | ------------------------ | ---------------------- | ------------- | -------------------------------------------------------- |
| Metinden videoya       | 1                      | geçerli değil            | geçerli değil          | 10 sn         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Görüntüden videoya     | 1                      | 1                        | geçerli değil          | 10 sn         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referanstan videoya    | 1                      | geçerli değil            | 4                      | 10 sn         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

`durationSeconds` belirtilmeyen bir istek, DashScope'un kabul ettiği varsayılan değer olan **5 saniyeyi** kullanır. Süreyi 10 saniyeye kadar uzatmak için [video oluşturma aracında](/tr/tools/video-generation) `durationSeconds` değerini açıkça ayarlayın.

<Warning>
  Referans görüntü ve video girdileri uzak `http(s)` URL'leri olmalıdır; DashScope'un referans modları yerel dosya yollarını reddeder. Önce nesne depolama alanına yükleyin veya zaten herkese açık bir URL üreten [medya aracı](/tr/tools/media-overview) akışını kullanın.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="DashScope temel URL'sini geçersiz kılın">
    Sağlayıcı varsayılan olarak uluslararası DashScope uç noktasını kullanır. Çin bölgesi uç noktasını hedeflemek için:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    Sağlayıcı, AIGC görev URL'lerini oluşturmadan önce sondaki eğik çizgileri kaldırır.

  </Accordion>

  <Accordion title="Kimlik doğrulama ortam değişkeni önceliği">
    OpenClaw, Alibaba API anahtarını ortam değişkenlerinden aşağıdaki sırayla çözümler ve boş olmayan ilk değeri kullanır:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Yapılandırılmış `auth.profiles` girdileri (`openclaw models auth login` ile ayarlanır), ortam değişkeni çözümlemesini geçersiz kılar. Profil döndürme, bekleme süresi ve geçersiz kılma mekanizmaları için [modeller SSS'sindeki kimlik doğrulama profillerine](/tr/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) bakın.

  </Accordion>

  <Accordion title="Qwen Plugin'iyle ilişkisi">
    Paketle birlikte gelen her iki Plugin de DashScope ile iletişim kurar ve örtüşen API anahtarlarını kabul eder. Şunları kullanın:

    - Bu sayfada belgelenen Wan'a özel video sağlayıcısı için `alibaba/wan*.*` kimlikleri.
    - Qwen sohbeti, gömme ve medya anlama işlevleri için `qwen/*` kimlikleri (bkz. [Qwen](/tr/providers/qwen)).

    Kimlik doğrulama ortam değişkeni listeleri kasıtlı olarak örtüştüğü için `MODELSTUDIO_API_KEY` değerini bir kez ayarlamak her iki Plugin'in de kimliğini doğrular; her Plugin için ayrı ayrı ilk kurulum yapılması gerekmez.

  </Accordion>
</AccordionGroup>

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Video oluşturma" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Qwen" href="/tr/providers/qwen" icon="microchip">
    Aynı DashScope kimlik doğrulamasıyla Qwen sohbeti, gömme ve medya anlama kurulumu.
  </Card>
  <Card title="Yapılandırma başvurusu" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Aracı varsayılanları ve model yapılandırması.
  </Card>
  <Card title="Modeller SSS" href="/tr/help/faq-models" icon="circle-question">
    Kimlik doğrulama profilleri, model değiştirme ve "profil yok" hatalarını çözme.
  </Card>
</CardGroup>
