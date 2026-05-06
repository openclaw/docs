---
read_when:
    - code_execution'ı etkinleştirmek veya yapılandırmak istiyorsunuz
    - Yerel kabuk erişimi olmadan uzaktan analiz istiyorsunuz
    - x_search veya web_search ile uzaktan Python analizini birleştirmek istiyorsunuz
summary: 'code_execution: xAI ile yalıtılmış uzak Python analizi çalıştırın'
title: Kod yürütme
x-i18n:
    generated_at: "2026-05-06T09:33:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution`, xAI'nin Responses API'sinde sandbox içinde uzak Python analizi çalıştırır. Paketle gelen `xai` Plugin'i tarafından (`tools` sözleşmesi altında) kaydedilir ve `x_search` tarafından kullanılan aynı `https://api.x.ai/v1/responses` uç noktasına gönderilir.

| Özellik             | Değer                                                          |
| ------------------- | -------------------------------------------------------------- |
| Araç adı            | `code_execution`                                               |
| Sağlayıcı Plugin    | `xai` (paketle gelen, `enabledByDefault: true`)                |
| Kimlik doğrulama    | `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey` |
| Varsayılan model    | `grok-4-1-fast`                                                |
| Varsayılan zaman aşımı | 30 saniye                                                   |
| Varsayılan `maxTurns` | ayarlanmamış (xAI kendi dahili sınırını uygular)             |

Bu, yerel [`exec`](/tr/tools/exec) aracından farklıdır:

- `exec`, makinenizde veya eşleştirilmiş Node üzerinde kabuk komutları çalıştırır.
- `code_execution`, Python'u xAI'nin uzak sandbox'ında çalıştırır.

`code_execution` aracını şunlar için kullanın:

- Hesaplamalar.
- Tablo oluşturma.
- Hızlı istatistikler.
- Grafik tarzı analiz.
- `x_search` veya `web_search` tarafından döndürülen verileri analiz etme.

Yerel dosyalara, kabuğunuza, reponuza veya eşleştirilmiş cihazlara ihtiyacınız olduğunda bunu kullanmayın. Bunun için [`exec`](/tr/tools/exec) kullanın.

## Kurulum

<Steps>
  <Step title="Bir xAI API anahtarı sağlayın">
    Gateway ortamında `XAI_API_KEY` ayarlayın veya anahtarı xAI Plugin'i altında yapılandırın; böylece aynı kimlik bilgisi `code_execution`, `x_search`, web araması ve diğer xAI araçlarını kapsar:

    ```bash
    export XAI_API_KEY=xai-...
    ```

    Ya da yapılandırma üzerinden:

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

  <Step title="code_execution aracını etkinleştirin ve ayarlayın">
    Araç, `plugins.entries.xai.config.codeExecution.enabled` ile kontrol edilir. Varsayılan olarak kapalıdır.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
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

  <Step title="Gateway'i yeniden başlatın">
    ```bash
    openclaw gateway restart
    ```

    xAI Plugin'i `enabled: true` ile yeniden kaydolduktan sonra `code_execution`, aracın araç listesinde görünür.

  </Step>
</Steps>

## Nasıl kullanılır

Doğal şekilde isteyin ve analiz amacını açık belirtin:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Araç dahili olarak tek bir `task` parametresi alır; bu nedenle aracın tam analiz isteğini ve satır içi verileri tek bir istemde göndermesi gerekir.

## Hatalar

Araç kimlik doğrulama olmadan çalıştığında, ortam değişkenini ve yapılandırma yolunu gösteren yapılandırılmış bir `missing_xai_api_key` hatası döndürür. Hata JSON'dur, fırlatılan bir istisna değildir; bu nedenle araç kendini düzeltebilir:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Sınırlar

- Bu, yerel süreç yürütmesi değil, uzak xAI yürütmesidir.
- Sonuçları kalıcı bir not defteri oturumu değil, geçici analiz olarak ele alın.
- Yerel dosyalara veya çalışma alanınıza erişim olduğunu varsaymayın.
- Güncel X verileri için önce [`x_search`](/tr/tools/web#x_search) kullanın ve sonucu `code_execution` içine aktarın.

## İlgili

<CardGroup cols={2}>
  <Card title="Exec aracı" href="/tr/tools/exec" icon="terminal">
    Makinenizde veya eşleştirilmiş Node üzerinde yerel kabuk yürütmesi.
  </Card>
  <Card title="Exec onayları" href="/tr/tools/exec-approvals" icon="shield">
    Kabuk yürütmesi için izin verme/reddetme politikası.
  </Card>
  <Card title="Web araçları" href="/tr/tools/web" icon="globe">
    `web_search`, `x_search` ve `web_fetch`.
  </Card>
  <Card title="xAI sağlayıcısı" href="/tr/providers/xai" icon="microchip">
    Grok modelleri, web/X araması ve kod yürütme yapılandırması.
  </Card>
</CardGroup>
