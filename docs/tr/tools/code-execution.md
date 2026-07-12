---
read_when:
    - code_execution özelliğini etkinleştirmek veya yapılandırmak istiyorsunuz
    - Yerel kabuk erişimi olmadan uzaktan analiz istiyorsunuz
    - x_search veya web_search'ü uzaktan Python analiziyle birleştirmek istiyorsunuz
summary: 'code_execution: xAI ile korumalı alanda uzaktan Python analizi çalıştırın'
title: Kod yürütme
x-i18n:
    generated_at: "2026-07-12T12:52:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution`, xAI'ın Responses API'sinde (`https://api.x.ai/v1/responses`,
`x_search` tarafından kullanılanla aynı uç nokta) korumalı alanda uzaktan Python
analizi çalıştırır. Birlikte gelen `xai` Plugin'i tarafından `tools` sözleşmesi
kapsamında kaydedilir.

<Warning>
  `code_execution`, xAI'ın sunucularında çalışır. xAI, modelin giriş ve çıkış
  tokenlerine ek olarak her 1.000 araç çağrısı için 5 ABD doları ücret alır.
</Warning>

| Özellik              | Değer                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------- |
| Araç adı             | `code_execution`                                                                      |
| Sağlayıcı Plugin'i   | `xai` (birlikte gelir, `enabledByDefault: true`)                                       |
| Kimlik doğrulama     | xAI kimlik doğrulama profili, `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey` |
| Varsayılan model     | `grok-4.3`                                                                            |
| Varsayılan zaman aşımı | 30 saniye                                                                           |
| Varsayılan `maxTurns` | ayarlanmamış (xAI kendi dahili sınırını uygular)                                     |

Hesaplamalar, tablolaştırma, hızlı istatistikler ve grafik tarzı analizler için;
`x_search` veya `web_search` tarafından döndürülen veriler de dahil olmak üzere
kullanın. Yerel dosyalara, kabuğunuza, deponuza veya eşleştirilmiş cihazlara
erişimi yoktur ve çağrılar arasında durumu kalıcı olarak saklamaz; bu nedenle
her çağrıyı bir not defteri oturumu değil, geçici bir analiz olarak değerlendirin.
Güncel X verileri için önce [`x_search`](/tr/tools/web#x_search) çalıştırın ve sonucu
aktararak kullanın.

Yerel yürütme için bunun yerine [`exec`](/tr/tools/exec) kullanın.

## Kurulum

<Steps>
  <Step title="Provide xAI credentials">
    OAuth, uygun bir SuperGrok veya X Premium aboneliği gerektirir
    (cihaz koduyla doğrulama kullandığından localhost geri çağrısı olmadan uzak
    ana makinelerden çalışır):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Yeni bir kurulum sırasında aynı seçenek ilk katılım sürecinde kullanılabilir:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Veya bir API anahtarıyla:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    Ya da yapılandırma aracılığıyla:

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

    Bu üç yöntemin tümü `x_search` ve Grok `web_search` için de kimlik bilgisi
    sağlar.

  </Step>

  <Step title="Enable and tune code_execution">
    `enabled` belirtilmediğinde `code_execution`, yalnızca etkin modelin
    sağlayıcısı `xai` olduğunda ve xAI kimlik bilgileri çözümlenebildiğinde
    sunulur. Sağlayıcısı bilinen ve xAI olmayan etkin bir modelde sağlayıcılar
    arası kullanımı etkinleştirmek için
    `plugins.entries.xai.config.codeExecution.enabled` değerini `true` olarak
    ayarlayın. Etkin modelin sağlayıcısı eksikse veya çözümlenemiyorsa araç gizli
    kalır. Aracı tüm sağlayıcılarda devre dışı bırakmak için `enabled` değerini
    `false` olarak ayarlayın. xAI kimlik bilgileri her zaman gereklidir.

    Modeli, tur sınırını veya zaman aşımını geçersiz kılmak için aynı bloğu
    kullanın:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // required for a known non-xAI model provider
                model: "grok-4.3", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    xAI Plugin'i yeniden kaydolduğunda ve yukarıdaki sağlayıcı, etkinleştirme ve
    kimlik doğrulama denetimleri başarılı olduğunda `code_execution`, ajanın araç
    listesinde görünür.

  </Step>
</Steps>

## Nasıl kullanılır?

Analiz amacını açıkça belirtin; araç tek bir `task` parametresi alır, bu nedenle
isteğin tamamını ve satır içi verileri tek bir istemde gönderin:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

## Hatalar

Kimlik doğrulama olmadan araç, fırlatılan bir istisna yerine yapılandırılmış bir
JSON hatası döndürür; böylece ajan kendi kendine düzeltme yapabilir:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Exec tool" href="/tr/tools/exec" icon="terminal">
    Makinenizde veya eşleştirilmiş Node üzerinde yerel kabuk yürütmesi.
  </Card>
  <Card title="Exec approvals" href="/tr/tools/exec-approvals" icon="shield">
    Kabuk yürütmesi için izin verme/reddetme politikası.
  </Card>
  <Card title="Web tools" href="/tr/tools/web" icon="globe">
    `web_search`, `x_search` ve `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/tr/providers/xai" icon="microchip">
    Grok modelleri, web/X araması ve kod yürütme yapılandırması.
  </Card>
</CardGroup>
