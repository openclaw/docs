---
read_when:
    - code_execution özelliğini etkinleştirmek veya yapılandırmak istiyorsunuz
    - Yerel kabuk erişimi olmadan uzaktan analiz istiyorsunuz
    - x_search veya web_search ile uzak Python analizini birleştirmek istiyorsunuz
summary: code_execution -- xAI ile korumalı alanda uzaktan Python analizi çalıştır
title: Kod yürütme
x-i18n:
    generated_at: "2026-04-30T09:47:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution`, xAI'nin Responses API'sinde korumalı uzak Python analizi çalıştırır.
Bu, yerel [`exec`](/tr/tools/exec) aracından farklıdır:

- `exec`, makinenizde veya node üzerinde kabuk komutları çalıştırır
- `code_execution`, xAI'nin uzak korumalı alanında Python çalıştırır

`code_execution` aracını şunlar için kullanın:

- hesaplamalar
- tablo oluşturma
- hızlı istatistikler
- grafik tarzı analiz
- `x_search` veya `web_search` tarafından döndürülen verileri analiz etme

Yerel dosyalara, kabuğunuza, reponuza veya eşleştirilmiş cihazlara ihtiyacınız olduğunda bunu **kullanmayın**. Bunun için [`exec`](/tr/tools/exec) kullanın.

## Kurulum

Bir xAI API anahtarına ihtiyacınız vardır. Şunlardan herhangi biri çalışır:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

Örnek:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## Nasıl kullanılır

Doğal şekilde sorun ve analiz amacını açıkça belirtin:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

Araç dahili olarak tek bir `task` parametresi alır, bu nedenle agent tam analiz isteğini ve satır içi verileri tek bir prompt içinde göndermelidir.

## Sınırlar

- Bu, yerel süreç yürütme değil, uzak xAI yürütmesidir.
- Kalıcı bir notebook değil, geçici analiz olarak ele alınmalıdır.
- Yerel dosyalara veya çalışma alanınıza erişimi olduğunu varsaymayın.
- Güncel X verileri için önce [`x_search`](/tr/tools/web#x_search) kullanın.

## İlgili

- [Exec aracı](/tr/tools/exec)
- [Exec onayları](/tr/tools/exec-approvals)
- [apply_patch aracı](/tr/tools/apply-patch)
- [Web araçları](/tr/tools/web)
- [xAI](/tr/providers/xai)
