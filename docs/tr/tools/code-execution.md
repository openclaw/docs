---
read_when:
    - code_execution özelliğini etkinleştirmek veya yapılandırmak istiyorsunuz
    - Yerel kabuk erişimi olmadan uzaktan analiz istiyorsunuz
    - x_search veya web_search ile uzak Python analizini birleştirmek istiyorsunuz
summary: 'code_execution: xAI ile korumalı alanda uzaktan Python analizi çalıştır'
title: Kod yürütme
x-i18n:
    generated_at: "2026-05-10T19:56:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76be496e459fac9c7f6b0324cceb884d3a693fd72d7541094d1bb64a4f1b7b8b
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution`, xAI'ın Responses API'sinde korumalı alana alınmış uzak Python analizi çalıştırır. Paketle birlikte gelen `xai` Plugin'i tarafından (`tools` sözleşmesi kapsamında) kaydedilir ve `x_search` tarafından kullanılan aynı `https://api.x.ai/v1/responses` uç noktasına gönderilir.

| Özellik             | Değer                                                                             |
| ------------------- | --------------------------------------------------------------------------------- |
| Araç adı            | `code_execution`                                                                  |
| Sağlayıcı Plugin'i  | `xai` (paketle birlikte gelir, `enabledByDefault: true`)                          |
| Kimlik doğrulama    | xAI auth profili, `XAI_API_KEY` veya `plugins.entries.xai.config.webSearch.apiKey` |
| Varsayılan model    | `grok-4-1-fast`                                                                   |
| Varsayılan zaman aşımı | 30 saniye                                                                     |
| Varsayılan `maxTurns` | ayarlanmamış (xAI kendi iç sınırını uygular)                                    |

Bu, yerel [`exec`](/tr/tools/exec) aracından farklıdır:

- `exec`, makinenizde veya eşleştirilmiş node üzerinde shell komutları çalıştırır.
- `code_execution`, Python'ı xAI'ın uzak korumalı alanında çalıştırır.

`code_execution` şunlar için kullanılır:

- Hesaplamalar.
- Tablo oluşturma.
- Hızlı istatistikler.
- Grafik tarzı analiz.
- `x_search` veya `web_search` tarafından döndürülen verileri analiz etme.

Yerel dosyalara, shell'inize, reponuza veya eşleştirilmiş cihazlara ihtiyacınız olduğunda bunu **kullanmayın**. Bunun için [`exec`](/tr/tools/exec) kullanın.

## Kurulum

<Steps>
  <Step title="Bir xAI API anahtarı sağlayın">
    `code_execution` ve `x_search` için `openclaw onboard --auth-choice xai-api-key`
    çalıştırın veya Grok web aramasının aynı kimlik bilgisini kullanmasını da
    istiyorsanız `XAI_API_KEY` ayarlayın / anahtarı xAI Plugin'i altında yapılandırın:

    ```bash
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

  <Step title="code_execution aracını etkinleştirin ve ayarlayın">
    Araç, `plugins.entries.xai.config.codeExecution.enabled` ile denetlenir. Varsayılan olarak kapalıdır.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // varsayılan xAI kod yürütme modelini geçersiz kılar
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

    xAI Plugin'i `enabled: true` ile yeniden kaydolduktan sonra `code_execution`, ajanın araç listesinde görünür.

  </Step>
</Steps>

## Nasıl kullanılır

Doğal şekilde sorun ve analiz amacını açık belirtin:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Araç dahili olarak tek bir `task` parametresi alır, bu nedenle ajan tam analiz isteğini ve varsa satır içi verileri tek bir prompt içinde göndermelidir.

## Hatalar

Araç kimlik doğrulama olmadan çalıştığında, auth profili, env var ve config seçeneklerini işaret eden yapılandırılmış bir `missing_xai_api_key` hatası döndürür. Hata, fırlatılan bir exception değil JSON'dır; bu nedenle ajan kendi kendini düzeltebilir:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Run openclaw onboard --auth-choice xai-api-key, set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Sınırlar

- Bu, yerel süreç yürütmesi değil, uzak xAI yürütmesidir.
- Sonuçları kalıcı bir notebook oturumu değil, geçici analiz olarak ele alın.
- Yerel dosyalara veya çalışma alanınıza erişim olduğunu varsaymayın.
- Güncel X verileri için önce [`x_search`](/tr/tools/web#x_search) kullanın ve sonucu `code_execution` içine aktarın.

## İlgili

<CardGroup cols={2}>
  <Card title="Exec aracı" href="/tr/tools/exec" icon="terminal">
    Makinenizde veya eşleştirilmiş node üzerinde yerel shell yürütmesi.
  </Card>
  <Card title="Exec onayları" href="/tr/tools/exec-approvals" icon="shield">
    Shell yürütmesi için izin verme/reddetme ilkesi.
  </Card>
  <Card title="Web araçları" href="/tr/tools/web" icon="globe">
    `web_search`, `x_search` ve `web_fetch`.
  </Card>
  <Card title="xAI sağlayıcısı" href="/tr/providers/xai" icon="microchip">
    Grok modelleri, web/x araması ve kod yürütme config'i.
  </Card>
</CardGroup>
