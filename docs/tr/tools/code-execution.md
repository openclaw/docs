---
read_when:
    - code_execution özelliğini etkinleştirmek veya yapılandırmak istiyorsanız
    - Yerel kabuk erişimi olmadan uzak analiz istiyorsanız
    - x_search veya web_search ile uzak Python analizini birleştirmek istiyorsanız
summary: code_execution -- xAI ile sandbox içinde uzak Python analizi çalıştırın
title: Kod Çalıştırma
x-i18n:
    generated_at: "2026-04-05T14:10:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ca1ddd026cb14837df90ee74859eb98ba6d1a3fbc78da8a72390d0ecee5e40
    source_path: tools/code-execution.md
    workflow: 15
---

# Kod Çalıştırma

`code_execution`, xAI'ın Responses API'sinde sandbox içinde uzak Python analizi çalıştırır.
Bu, yerel [`exec`](/tools/exec) özelliğinden farklıdır:

- `exec`, makinenizde veya düğümünüzde kabuk komutları çalıştırır
- `code_execution`, xAI'ın uzak sandbox ortamında Python çalıştırır

`code_execution` şu durumlar için kullanılır:

- hesaplamalar
- tablo oluşturma
- hızlı istatistikler
- grafik tarzı analiz
- `x_search` veya `web_search` tarafından döndürülen verileri analiz etme

Yerel dosyalara, kabuğunuza, deponuza veya eşlenmiş
cihazlara ihtiyacınız olduğunda bunu kullanmayın. Bunun için [`exec`](/tools/exec) kullanın.

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

## Nasıl Kullanılır

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

Araç dahili olarak tek bir `task` parametresi alır, bu nedenle ajan
tam analiz isteğini ve tüm satır içi verileri tek bir istemde göndermelidir.

## Sınırlar

- Bu, yerel süreç çalıştırma değil, uzak xAI çalıştırmasıdır.
- Bu, kalıcı bir not defteri değil, geçici analiz olarak değerlendirilmelidir.
- Yerel dosyalara veya çalışma alanınıza erişim olduğunu varsaymayın.
- Güncel X verileri için önce [`x_search`](/tools/web#x_search) kullanın.

## Ayrıca Bakın

- [Web araçları](/tools/web)
- [Exec](/tools/exec)
- [xAI](/tr/providers/xai)
