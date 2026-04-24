---
read_when:
    - Otomatik Compaction ve /compact komutunu anlamak istiyorsunuz
    - Bağlam sınırlarına ulaşan uzun oturumlarda hata ayıklıyorsunuz
summary: OpenClaw’ın model sınırları içinde kalmak için uzun konuşmaları nasıl özetlediği
title: Compaction
x-i18n:
    generated_at: "2026-04-24T09:04:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: b88a757b19a7c040599a0a7901d8596001ffff148f7f6e861a3cc783100393f7
    source_path: concepts/compaction.md
    workflow: 15
---

Her modelin bir bağlam penceresi vardır -- bu, işleyebileceği en yüksek token sayısıdır.
Bir konuşma bu sınıra yaklaştığında OpenClaw, sohbetin devam edebilmesi için eski mesajları bir özet içinde **Compaction** yapar.

## Nasıl çalışır

1. Eski konuşma dönüşleri kompakt bir girdide özetlenir.
2. Özet, oturum transkriptine kaydedilir.
3. Son mesajlar bozulmadan korunur.

OpenClaw geçmişi Compaction parçalarına böldüğünde, yardımcı aracının tool çağrılarını eşleşen `toolResult` girdileriyle eşleştirilmiş halde tutar. Bir bölme noktası bir tool bloğunun içine düşerse OpenClaw sınırı kaydırır, böylece eşleşen çift birlikte kalır ve özetlenmemiş geçerli kuyruk korunur.

Tam konuşma geçmişi diskte kalır. Compaction yalnızca modelin bir sonraki dönüşte ne gördüğünü değiştirir.

## Otomatik Compaction

Otomatik Compaction varsayılan olarak açıktır. Oturum bağlam sınırına yaklaştığında veya model bir bağlam taşması hatası döndürdüğünde çalışır (bu durumda OpenClaw Compaction yapar ve yeniden dener). Tipik taşma imzaları arasında `request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model` ve `ollama error: context length exceeded` bulunur.

<Info>
Compaction öncesinde OpenClaw, aracıya önemli notları [memory](/tr/concepts/memory) dosyalarına kaydetmesini otomatik olarak hatırlatır. Bu, bağlam kaybını önler.
</Info>

Compaction davranışını (mod, hedef token sayısı vb.) yapılandırmak için `openclaw.json` içindeki `agents.defaults.compaction` ayarını kullanın.
Compaction özetleme, opak tanımlayıcıları varsayılan olarak korur (`identifierPolicy: "strict"`). Bunu `identifierPolicy: "off"` ile geçersiz kılabilir veya `identifierPolicy: "custom"` ve `identifierInstructions` ile özel metin sağlayabilirsiniz.

İsteğe bağlı olarak, `agents.defaults.compaction.model` aracılığıyla Compaction özetleme için farklı bir model belirtebilirsiniz. Bu, birincil modeliniz yerel veya küçük bir model olduğunda ve Compaction özetlerinin daha yetenekli bir model tarafından üretilmesini istediğinizde yararlıdır. Geçersiz kılma, herhangi bir `provider/model-id` dizgesini kabul eder:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Bu, örneğin özetlemeye ayrılmış ikinci bir Ollama modeli veya ince ayarlı bir Compaction uzmanı gibi yerel modellerle de çalışır:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Ayarlanmadığında Compaction, aracının birincil modelini kullanır.

## Takılabilir Compaction sağlayıcıları

Plugin'ler, Plugin API üzerindeki `registerCompactionProvider()` aracılığıyla özel bir Compaction sağlayıcısı kaydedebilir. Bir sağlayıcı kaydedilip yapılandırıldığında OpenClaw, yerleşik LLM işlem hattı yerine özetlemeyi ona devreder.

Kayıtlı bir sağlayıcıyı kullanmak için sağlayıcı kimliğini yapılandırmanızda ayarlayın:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Bir `provider` ayarlamak otomatik olarak `mode: "safeguard"` kullanımını zorunlu kılar. Sağlayıcılar yerleşik yol ile aynı Compaction yönergelerini ve tanımlayıcı koruma ilkesini alır ve OpenClaw, sağlayıcı çıktısından sonra da son dönüş ve bölünmüş dönüş son ek bağlamını korumaya devam eder. Sağlayıcı başarısız olursa veya boş sonuç döndürürse OpenClaw yerleşik LLM özetlemeye geri döner.

## Otomatik Compaction (varsayılan açık)

Bir oturum modelin bağlam penceresine yaklaştığında veya onu aştığında OpenClaw otomatik Compaction tetikler ve özgün isteği sıkıştırılmış bağlamı kullanarak yeniden deneyebilir.

Şunları görürsünüz:

- ayrıntılı modda `🧹 Auto-compaction complete`
- `/status` içinde `🧹 Compactions: <count>`

Compaction öncesinde OpenClaw, kalıcı notları diske yazmak için sessiz bir **memory flush** dönüşü çalıştırabilir. Ayrıntılar ve yapılandırma için [Memory](/tr/concepts/memory) sayfasına bakın.

## Elle Compaction

Compaction'ı zorlamak için herhangi bir sohbette `/compact` yazın. Özeti yönlendirmek için yönergeler ekleyin:

```
/compact API tasarım kararlarına odaklan
```

## Farklı bir model kullanma

Varsayılan olarak Compaction, aracınızın birincil modelini kullanır. Daha iyi özetler için daha yetenekli bir model kullanabilirsiniz:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Compaction bildirimleri

Varsayılan olarak Compaction sessizce çalışır. Compaction başladığında ve tamamlandığında kısa bildirimler göstermek için `notifyUser` özelliğini etkinleştirin:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

Etkinleştirildiğinde kullanıcı her Compaction çalıştırması etrafında kısa durum mesajları görür
(örneğin, "Bağlam sıkıştırılıyor..." ve "Compaction tamamlandı").

## Compaction ve budama

|                  | Compaction                    | Budama                           |
| ---------------- | ----------------------------- | -------------------------------- |
| **Ne yapar**     | Eski konuşmayı özetler        | Eski tool sonuçlarını kırpar     |
| **Kaydedilir mi?** | Evet (oturum transkriptinde) | Hayır (yalnızca bellekte, istek başına) |
| **Kapsam**       | Tüm konuşma                   | Yalnızca tool sonuçları          |

[Oturum budama](/tr/concepts/session-pruning), tool çıktısını özetlemeden kırpan daha hafif bir tamamlayıcıdır.

## Sorun giderme

**Çok sık mı Compaction yapılıyor?** Modelin bağlam penceresi küçük olabilir veya tool çıktıları büyük olabilir. [oturum budama](/tr/concepts/session-pruning) özelliğini etkinleştirmeyi deneyin.

**Compaction sonrası bağlam eski mi görünüyor?** Özeti yönlendirmek için `/compact Focus on <topic>` kullanın veya notların kalmasını sağlamak için [memory flush](/tr/concepts/memory) özelliğini etkinleştirin.

**Temiz bir başlangıç mı gerekiyor?** `/new`, Compaction yapmadan yeni bir oturum başlatır.

Gelişmiş yapılandırma için (rezerv token sayısı, tanımlayıcı koruma, özel bağlam motorları, OpenAI sunucu tarafı Compaction), [Oturum Yönetimi Derinlemesine İnceleme](/tr/reference/session-management-compaction) sayfasına bakın.

## İlgili

- [Oturum](/tr/concepts/session) — oturum yönetimi ve yaşam döngüsü
- [Oturum Budama](/tr/concepts/session-pruning) — tool sonuçlarını kırpma
- [Bağlam](/tr/concepts/context) — aracı dönüşleri için bağlamın nasıl oluşturulduğu
- [Hooks](/tr/automation/hooks) — Compaction yaşam döngüsü hook'ları (`before_compaction`, `after_compaction`)
