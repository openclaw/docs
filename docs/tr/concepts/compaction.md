---
read_when:
    - Otomatik sıkıştırmayı ve /compact komutunu anlamak istiyorsunuz
    - Bağlam sınırlarına takılan uzun oturumlarda hata ayıklıyorsunuz
summary: OpenClaw'ın model sınırları içinde kalmak için uzun konuşmaları nasıl özetlediği
title: Sıkıştırma
x-i18n:
    generated_at: "2026-04-05T13:50:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c6dbd6ebdcd5f918805aafdc153925efef3e130faa3fab3c630832e938219fc
    source_path: concepts/compaction.md
    workflow: 15
---

# Sıkıştırma

Her modelin bir bağlam penceresi vardır -- işleyebileceği en yüksek token sayısı.
Bir konuşma bu sınıra yaklaştığında, OpenClaw eski mesajları **sıkıştırarak**
bir özete dönüştürür; böylece sohbet devam edebilir.

## Nasıl çalışır

1. Eski konuşma dönüşleri sıkıştırılmış bir girdide özetlenir.
2. Özet, oturum dökümüne kaydedilir.
3. Son mesajlar olduğu gibi korunur.

OpenClaw geçmişi sıkıştırma parçalarına böldüğünde, asistan araç
çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar. Bir bölme noktası
bir araç bloğunun içine denk gelirse, OpenClaw sınırı bu eşleşme birlikte kalacak
şekilde kaydırır ve mevcut özetlenmemiş son kısmı korur.

Konuşmanın tam geçmişi diskte kalır. Sıkıştırma yalnızca modelin
bir sonraki dönüşte ne gördüğünü değiştirir.

## Otomatik sıkıştırma

Otomatik sıkıştırma varsayılan olarak açıktır. Oturum bağlam
sınırına yaklaştığında veya model bir bağlam taşması hatası döndürdüğünde çalışır (bu durumda
OpenClaw sıkıştırır ve yeniden dener). Tipik taşma imzaları arasında
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` ve `ollama error: context length
exceeded` bulunur.

<Info>
OpenClaw, sıkıştırmadan önce ajana önemli notları [memory](/concepts/memory)
dosyalarına kaydetmesini otomatik olarak hatırlatır. Bu, bağlam kaybını önler.
</Info>

## Manuel sıkıştırma

Sıkıştırmayı zorlamak için herhangi bir sohbette `/compact` yazın. Özeti
yönlendirmek için talimat ekleyin:

```
/compact API tasarım kararlarına odaklan
```

## Farklı bir model kullanma

Varsayılan olarak sıkıştırma, ajanınızın birincil modelini kullanır. Daha iyi özetler için
daha yetenekli bir model kullanabilirsiniz:

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

## Sıkıştırma başlangıç bildirimi

Varsayılan olarak sıkıştırma sessizce çalışır. Sıkıştırma
başladığında kısa bir bildirim göstermek için `notifyUser` seçeneğini etkinleştirin:

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

Etkinleştirildiğinde, kullanıcı her sıkıştırma çalışmasının başında kısa bir mesaj görür
(örneğin, "Bağlam sıkıştırılıyor...").

## Sıkıştırma ve budama

|                  | Sıkıştırma                    | Budama                           |
| ---------------- | ----------------------------- | -------------------------------- |
| **Ne yapar**     | Eski konuşmayı özetler        | Eski araç sonuçlarını kırpar     |
| **Kaydedilir mi?** | Evet (oturum dökümünde)     | Hayır (yalnızca bellekte, istek başına) |
| **Kapsam**       | Tüm konuşma                   | Yalnızca araç sonuçları          |

[Oturum budama](/concepts/session-pruning), özetleme yapmadan
araç çıktısını kırpan daha hafif bir tamamlayıcıdır.

## Sorun giderme

**Çok sık mı sıkıştırılıyor?** Modelin bağlam penceresi küçük olabilir veya araç
çıktıları büyük olabilir. [oturum budama](/concepts/session-pruning)
özelliğini etkinleştirmeyi deneyin.

**Sıkıştırmadan sonra bağlam bayat mı geliyor?** Özeti yönlendirmek için
`/compact <konuya> odaklan` kullanın veya notların kalıcı olması için
[memory flush](/concepts/memory) özelliğini etkinleştirin.

**Temiz bir başlangıca mı ihtiyacınız var?** `/new`, sıkıştırma yapmadan yeni bir oturum başlatır.

Gelişmiş yapılandırma için (ayrılan token'lar, tanımlayıcı koruma, özel
bağlam motorları, OpenAI sunucu tarafı sıkıştırma), şu belgeye bakın:
[Oturum Yönetimi Derinlemesine İnceleme](/reference/session-management-compaction).

## İlgili

- [Oturum](/concepts/session) — oturum yönetimi ve yaşam döngüsü
- [Oturum Budama](/concepts/session-pruning) — araç sonuçlarını kırpma
- [Bağlam](/concepts/context) — ajan dönüşleri için bağlamın nasıl oluşturulduğu
- [Hooks](/tr/automation/hooks) — sıkıştırma yaşam döngüsü kancaları (`before_compaction`, `after_compaction)
