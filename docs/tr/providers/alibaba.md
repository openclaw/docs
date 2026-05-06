---
read_when:
    - OpenClaw’da Alibaba Wan video üretimini kullanmak istiyorsunuz
    - Video oluşturma için Model Studio veya DashScope API anahtarı kurulumu gerekir
summary: OpenClaw'da Alibaba Model Studio Wan video oluşturma
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T09:26:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw, Alibaba Model Studio'daki (DashScope'un uluslararası adı) Wan modelleri için bir video oluşturma sağlayıcısı kaydeden, paketle birlikte gelen bir `alibaba` Plugin'iyle gelir. Plugin varsayılan olarak etkindir; yalnızca bir API anahtarı ayarlamanız gerekir.

| Özellik              | Değer                                                                           |
| -------------------- | ------------------------------------------------------------------------------- |
| Sağlayıcı kimliği    | `alibaba`                                                                       |
| Plugin               | paketle birlikte gelen, `enabledByDefault: true`                                |
| Kimlik doğrulama env vars | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (ilk eşleşme kazanır) |
| Onboarding bayrağı   | `--auth-choice alibaba-model-studio-api-key`                                    |
| Doğrudan CLI bayrağı | `--alibaba-model-studio-api-key <key>`                                          |
| Varsayılan model     | `alibaba/wan2.6-t2v`                                                            |
| Varsayılan temel URL | `https://dashscope-intl.aliyuncs.com`                                           |

## Başlarken

<Steps>
  <Step title="Set an API key">
    Anahtarı `alibaba` sağlayıcısına kaydetmek için onboarding'i kullanın:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Ya da anahtarı kurulum/onboarding sırasında doğrudan geçirin:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Ya da Gateway'i başlatmadan önce kabul edilen env vars değerlerinden herhangi birini dışa aktarın:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Set a default video model">
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
  <Step title="Verify the provider is configured">
    ```bash
    openclaw models list --provider alibaba
    ```

    Liste, paketle birlikte gelen beş Wan modelinin tamamını içermelidir. `MODELSTUDIO_API_KEY` çözümlenmemişse, `openclaw models status --json` eksik kimlik bilgisini `auth.unusableProfiles` altında bildirir.

  </Step>
</Steps>

<Note>
  Alibaba Plugin'i ve [Qwen Plugin'i](/tr/providers/qwen) DashScope'a karşı kimlik doğrulaması yapar ve örtüşen env vars değerlerini kabul eder. Özel Wan video yüzeyini çalıştırmak için `alibaba/...` model kimliklerini kullanın; Qwen'in sohbet, gömme veya medya anlama yüzeyini istediğinizde `qwen/...` kimliklerini kullanın.
</Note>

## Yerleşik Wan modelleri

| Model ref                  | Mod                       |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Metinden videoya (varsayılan) |
| `alibaba/wan2.6-i2v`       | Görselden videoya         |
| `alibaba/wan2.6-r2v`       | Referanstan videoya       |
| `alibaba/wan2.6-r2v-flash` | Referanstan videoya (hızlı) |
| `alibaba/wan2.7-r2v`       | Referanstan videoya       |

## Yetenekler ve sınırlar

Paketle birlikte gelen sağlayıcı, DashScope'un Wan video API sınırlarını yansıtır. Üç modun tamamı aynı istek başına video sayısı ve süre sınırını paylaşır; yalnızca giriş biçimi farklıdır.

| Mod                | Maks. çıktı videosu | Maks. giriş görseli | Maks. giriş videosu | Maks. süre | Desteklenen kontroller                                  |
| ------------------ | ------------------- | ------------------- | ------------------- | ---------- | ------------------------------------------------------- |
| Metinden videoya   | 1                   | geçerli değil       | geçerli değil       | 10 sn      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Görselden videoya  | 1                   | 1                   | geçerli değil       | 10 sn      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referanstan videoya | 1                  | geçerli değil       | 4                   | 10 sn      | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Bir istek `durationSeconds` değerini atladığında sağlayıcı, DashScope'un kabul edilen varsayılanı olan **5 saniye** değerini gönderir. Süreyi 10 sn'ye kadar uzatmak için [video oluşturma aracında](/tr/tools/video-generation) `durationSeconds` değerini açıkça ayarlayın.

<Warning>
  Referans görsel ve video girişleri uzak `http(s)` URL'leri olmalıdır. Yerel dosya yolları DashScope'un referans modları tarafından kabul edilmez; önce nesne depolamaya yükleyin veya zaten herkese açık bir URL üreten [medya aracı](/tr/tools/media-overview) akışını kullanın.
</Warning>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Override the DashScope base URL">
    Sağlayıcı varsayılan olarak uluslararası DashScope uç noktasını kullanır. Çin bölgesi uç noktasını hedeflemek için şunu ayarlayın:

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

  <Accordion title="Auth env priority">
    OpenClaw, Alibaba API anahtarını ortam değişkenlerinden bu sırayla çözümler ve ilk boş olmayan değeri alır:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Yapılandırılmış `auth.profiles` girdileri (`openclaw models auth login` ile ayarlanır) env-var çözümlemesini geçersiz kılar. Profil döndürme, cooldown ve geçersiz kılma mekanikleri için [modeller SSS'sindeki kimlik doğrulama profilleri](/tr/help/faq-models#what-is-an-auth-profile) bölümüne bakın.

  </Accordion>

  <Accordion title="Relationship to the Qwen plugin">
    Paketle birlikte gelen iki Plugin de DashScope ile konuşur ve örtüşen API anahtarlarını kabul eder. Şunları kullanın:

    - Bu sayfada belgelenen özel Wan video sağlayıcısını çalıştırmak için `alibaba/wan*.*` kimlikleri.
    - Qwen sohbet, gömme ve medya anlama için `qwen/*` kimlikleri (bkz. [Qwen](/tr/providers/qwen)).

    Kimlik doğrulama env var listesi kasıtlı olarak örtüştüğü için `MODELSTUDIO_API_KEY` değerini bir kez ayarlamak iki Plugin'in de kimliğini doğrular; her Plugin için ayrı onboarding yapmanız gerekmez.

  </Accordion>
</AccordionGroup>

## İlgili

<CardGroup cols={2}>
  <Card title="Video generation" href="/tr/tools/video-generation" icon="video">
    Paylaşılan video aracı parametreleri ve sağlayıcı seçimi.
  </Card>
  <Card title="Qwen" href="/tr/providers/qwen" icon="microchip">
    Aynı DashScope kimlik doğrulaması üzerinde Qwen sohbet, gömme ve medya anlama kurulumu.
  </Card>
  <Card title="Configuration reference" href="/tr/gateway/config-agents#agent-defaults" icon="gear">
    Aracı varsayılanları ve model yapılandırması.
  </Card>
  <Card title="Models FAQ" href="/tr/help/faq-models" icon="circle-question">
    Kimlik doğrulama profilleri, model değiştirme ve "no profile" hatalarını çözme.
  </Card>
</CardGroup>
