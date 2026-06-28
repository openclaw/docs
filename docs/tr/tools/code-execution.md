---
read_when:
    - code_execution özelliğini etkinleştirmek veya yapılandırmak istiyorsunuz
    - Yerel kabuk erişimi olmadan uzaktan analiz yapmak istiyorsunuz
    - x_search veya web_search ile uzak Python analizini birleştirmek istiyorsunuz
summary: 'code_execution: xAI ile korumalı alanda uzak Python analizi çalıştırın'
title: Kod yürütme
x-i18n:
    generated_at: "2026-06-28T01:21:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution`, xAI'nin Responses API'sinde sandbox'lı uzak Python analizi çalıştırır. Paketle gelen `xai` plugin tarafından (`tools` sözleşmesi altında) kaydedilir ve `x_search` tarafından kullanılan aynı `https://api.x.ai/v1/responses` uç noktasına yönlendirir.

| Özellik           | Değer                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| Araç adı          | `code_execution`                                                                  |
| Sağlayıcı plugin    | `xai` (paketle gelen, `enabledByDefault: true`)                                         |
| Kimlik doğrulama               | xAI auth profili, `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey` |
| Varsayılan model      | `grok-4-1-fast`                                                                   |
| Varsayılan zaman aşımı    | 30 saniye                                                                        |
| Varsayılan `maxTurns` | ayarlanmamış (xAI kendi dahili sınırını uygular)                                        |

Bu, yerel [`exec`](/tr/tools/exec) aracından farklıdır:

- `exec`, makinenizde veya eşleştirilmiş node üzerinde kabuk komutları çalıştırır.
- `code_execution`, xAI'nin uzak sandbox'ında Python çalıştırır.

`code_execution` aracını şunlar için kullanın:

- Hesaplamalar.
- Tablolama.
- Hızlı istatistikler.
- Grafik tarzı analiz.
- `x_search` veya `web_search` tarafından döndürülen verileri analiz etme.

Yerel dosyalara, kabuğunuza, reponuza veya eşleştirilmiş cihazlara ihtiyacınız olduğunda bunu **kullanmayın**. Bunun için [`exec`](/tr/tools/exec) kullanın.

## Kurulum

<Steps>
  <Step title="xAI kimlik bilgilerini sağlayın">
    Uygun bir SuperGrok veya X Premium aboneliği kullanarak Grok OAuth ile oturum açın
    ya da bir API anahtarı saklayın. xAI OAuth, cihaz kodu doğrulaması kullanır, bu nedenle
    localhost geri çağrısı olmadan uzak ana makinelerden çalışır. OAuth,
    `code_execution` ve `x_search` için çalışır; `XAI_API_KEY` veya plugin web-search yapılandırması
    Grok `web_search` için de güç sağlayabilir.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Yeni bir kurulum sırasında aynı kimlik doğrulama seçenekleri onboarding içinde de kullanılabilir:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Veya bir API anahtarı kullanın:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    Ya da config üzerinden:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="code_execution öğesini etkinleştirin ve ayarlayın">
    xAI kimlik bilgileri mevcut olduğunda `code_execution` kullanılabilir. Devre dışı bırakmak için
    `plugins.entries.xai.config.codeExecution.enabled` değerini `false` olarak ayarlayın
    veya modeli ve zaman aşımını ayarlamak için aynı bloğu kullanın.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // varsayılan xAI code-execution modelini geçersiz kıl
                maxTurns: 2,            // dahili araç turları için isteğe bağlı üst sınır
                timeoutSeconds: 30,     // istek zaman aşımı (varsayılan: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Gateway'i yeniden başlatın">
    ```bash
    openclaw gateway restart
    ```

    xAI plugin `enabled: true` ile yeniden kaydolduğunda `code_execution`, agent'ın araç listesinde görünür.

  </Step>
</Steps>

## Nasıl kullanılır

Doğal şekilde sorun ve analiz amacını açıkça belirtin:

```text
Bu sayılar için 7 günlük hareketli ortalamayı hesaplamak üzere code_execution kullan: ...
```

```text
Bu hafta OpenClaw'dan bahseden gönderileri bulmak için x_search kullan, ardından bunları güne göre saymak için code_execution kullan.
```

```text
En son AI benchmark sayılarını toplamak için web_search kullan, ardından yüzde değişimlerini karşılaştırmak için code_execution kullan.
```

Araç dahili olarak tek bir `task` parametresi alır, bu nedenle agent tam analiz isteğini ve varsa satır içi verileri tek bir prompt içinde göndermelidir.

## Hatalar

Araç kimlik doğrulaması olmadan çalıştığında, auth profili, env var ve config seçeneklerine işaret eden yapılandırılmış bir `missing_xai_api_key` hatası döndürür. Hata, fırlatılan bir exception değil JSON'dur; bu nedenle agent kendi kendini düzeltebilir:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution için xAI kimlik bilgileri gerekir. Grok ile oturum açmak için `openclaw onboard --auth-choice xai-oauth` çalıştırın, `openclaw onboard --auth-choice xai-api-key` çalıştırın, Gateway ortamında `XAI_API_KEY` ayarlayın veya `plugins.entries.xai.config.webSearch.apiKey` yapılandırın.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Sınırlar

- Bu, yerel process yürütme değil, uzak xAI yürütmesidir.
- Sonuçları kalıcı bir notebook oturumu olarak değil, geçici analiz olarak değerlendirin.
- Yerel dosyalara veya workspace'inize erişim olduğunu varsaymayın.
- Güncel X verileri için önce [`x_search`](/tr/tools/web#x_search) kullanın ve sonucu `code_execution` içine aktarın.

## İlgili

<CardGroup cols={2}>
  <Card title="Exec aracı" href="/tr/tools/exec" icon="terminal">
    Makinenizde veya eşleştirilmiş node üzerinde yerel shell yürütme.
  </Card>
  <Card title="Exec onayları" href="/tr/tools/exec-approvals" icon="shield">
    Shell yürütmesi için izin ver/reddet politikası.
  </Card>
  <Card title="Web araçları" href="/tr/tools/web" icon="globe">
    `web_search`, `x_search` ve `web_fetch`.
  </Card>
  <Card title="xAI sağlayıcısı" href="/tr/providers/xai" icon="microchip">
    Grok modelleri, web/x search ve code execution config.
  </Card>
</CardGroup>
