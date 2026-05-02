---
read_when:
    - Otomatik Compaction ve /compact komutunu anlamak istiyorsunuz
    - Bağlam sınırlarına ulaşan uzun oturumlarda hata ayıklıyorsunuz
summary: OpenClaw model sınırları içinde kalmak için uzun konuşmaları nasıl özetler
title: Compaction
x-i18n:
    generated_at: "2026-05-02T08:51:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f8e6f372508a0f5421654d3e2a694695eb8a7fda4e3928159bf8f08b2a2156b
    source_path: concepts/compaction.md
    workflow: 16
---

Her modelin bir bağlam penceresi vardır: işleyebileceği maksimum token sayısı. Bir konuşma bu sınıra yaklaştığında, OpenClaw sohbetin devam edebilmesi için eski mesajları bir özete **Compaction** uygular.

## Nasıl çalışır?

1. Eski konuşma turları kompakt bir girdide özetlenir.
2. Özet oturum dökümüne kaydedilir.
3. Son mesajlar olduğu gibi korunur.

OpenClaw geçmişi Compaction parçalarına böldüğünde, asistan araç çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar. Bölme noktası bir araç bloğunun içine denk gelirse, OpenClaw sınırı taşır; böylece çift birlikte kalır ve geçerli özetlenmemiş kuyruk korunur.

Tam konuşma geçmişi diskte kalır. Compaction yalnızca modelin bir sonraki turda ne gördüğünü değiştirir.

## Otomatik Compaction

Otomatik Compaction varsayılan olarak açıktır. Oturum bağlam sınırına yaklaştığında veya model bir bağlam taşması hatası döndürdüğünde çalışır; bu durumda OpenClaw Compaction uygular ve yeniden dener.

Şunları görürsünüz:

- Ayrıntılı modda `🧹 Auto-compaction complete`.
- `/status` içinde `🧹 Compactions: <count>`.

<Info>
OpenClaw, Compaction uygulamadan önce ajana önemli notları [bellek](/tr/concepts/memory) dosyalarına kaydetmesini otomatik olarak hatırlatır. Bu, bağlam kaybını önler.
</Info>

<AccordionGroup>
  <Accordion title="Tanınan taşma imzaları">
    OpenClaw, şu sağlayıcı hata kalıplarından bağlam taşmasını algılar:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Manuel Compaction

Compaction’ı zorlamak için herhangi bir sohbette `/compact` yazın. Özete yön vermek için talimat ekleyin:

```
/compact Focus on the API design decisions
```

`agents.defaults.compaction.keepRecentTokens` ayarlandığında, manuel Compaction bu Pi kesme noktasına uyar ve yeniden oluşturulan bağlamda son kuyruğu tutar. Açık bir tutma bütçesi olmadan, manuel Compaction sert bir kontrol noktası gibi davranır ve yalnızca yeni özetten devam eder.

## Yapılandırma

Compaction’ı `openclaw.json` dosyanızda `agents.defaults.compaction` altında yapılandırın. En yaygın düğmeler aşağıda listelenmiştir; tam başvuru için [Oturum yönetimi derin incelemesi](/tr/reference/session-management-compaction) bölümüne bakın.

### Farklı bir model kullanma

Varsayılan olarak Compaction, ajanın birincil modelini kullanır. Özetlemeyi daha yetenekli veya özelleşmiş bir modele devretmek için `agents.defaults.compaction.model` değerini ayarlayın. Geçersiz kılma, herhangi bir `provider/model-id` dizesini kabul eder:

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

Bu, yerel modellerle de çalışır; örneğin özetlemeye ayrılmış ikinci bir Ollama modeli:

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

Ayarlanmadığında Compaction, etkin oturum modeliyle başlar. Özetleme, model geri dönüşüne uygun bir sağlayıcı hatasıyla başarısız olursa OpenClaw bu Compaction denemesini oturumun mevcut model geri dönüş zinciri üzerinden yeniden dener. Geri dönüş seçimi geçicidir ve oturum durumuna geri yazılmaz. Açık bir `agents.defaults.compaction.model` geçersiz kılması kesin kalır ve oturum geri dönüş zincirini devralmaz.

### Tanımlayıcı koruması

Compaction özetlemesi, opak tanımlayıcıları varsayılan olarak korur (`identifierPolicy: "strict"`). Devre dışı bırakmak için `identifierPolicy: "off"` ile veya özel rehberlik için `identifierPolicy: "custom"` ile birlikte `identifierInstructions` kullanarak geçersiz kılın.

### Etkin döküm bayt koruması

`agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında OpenClaw, etkin JSONL bu boyuta ulaşırsa bir çalıştırmadan önce normal yerel Compaction’ı tetikler. Bu, sağlayıcı tarafı bağlam yönetiminin model bağlamını sağlıklı tutabildiği, ancak yerel dökümün büyümeye devam ettiği uzun süre çalışan oturumlar için kullanışlıdır. Ham JSONL baytlarını bölmez; normal Compaction işlem hattından anlamsal bir özet oluşturmasını ister.

<Warning>
Bayt koruması `truncateAfterCompaction: true` gerektirir. Döküm döndürme olmadan etkin dosya küçülmez ve koruma pasif kalır.
</Warning>

### Ardıl dökümler

`agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde OpenClaw mevcut dökümü yerinde yeniden yazmaz. Compaction özetinden, korunmuş durumdan ve özetlenmemiş kuyruktan yeni bir etkin ardıl döküm oluşturur; ardından önceki JSONL dosyasını arşivlenmiş kontrol noktası kaynağı olarak tutar.
Ardıl dökümler, kısa bir yeniden deneme penceresi içinde gelen tam yinelenen uzun kullanıcı turlarını da düşürür; böylece kanal yeniden deneme fırtınaları, Compaction sonrasında bir sonraki etkin döküme taşınmaz.

Compaction öncesi kontrol noktaları yalnızca OpenClaw’ın kontrol noktası boyut sınırının altında kaldıkları sürece saklanır; aşırı büyük etkin dökümler yine de Compaction’dan geçer, ancak OpenClaw disk kullanımını ikiye katlamak yerine büyük hata ayıklama anlık görüntüsünü atlar.

### Compaction bildirimleri

Varsayılan olarak Compaction sessizce çalışır. Compaction başladığında ve tamamlandığında kısa durum mesajları göstermek için `notifyUser` ayarını yapın:

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

### Bellek boşaltma

Compaction öncesinde OpenClaw, kalıcı notları diske kaydetmek için **sessiz bellek boşaltma** turu çalıştırabilir. Bu bakım turunun etkin konuşma modeli yerine yerel bir model kullanması gerektiğinde `agents.defaults.compaction.memoryFlush.model` değerini ayarlayın:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

Bellek boşaltma modeli geçersiz kılması kesindir ve etkin oturum geri dönüş zincirini devralmaz. Ayrıntılar ve yapılandırma için [Bellek](/tr/concepts/memory) bölümüne bakın.

## Takılabilir Compaction sağlayıcıları

Plugin’ler, Plugin API’sindeki `registerCompactionProvider()` üzerinden özel bir Compaction sağlayıcısı kaydedebilir. Bir sağlayıcı kaydedilip yapılandırıldığında, OpenClaw özetlemeyi yerleşik LLM işlem hattı yerine ona devreder.

Kayıtlı bir sağlayıcıyı kullanmak için yapılandırmanızda onun kimliğini ayarlayın:

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

Bir `provider` ayarlamak otomatik olarak `mode: "safeguard"` değerini zorunlu kılar. Sağlayıcılar, yerleşik yol ile aynı Compaction talimatlarını ve tanımlayıcı koruma ilkesini alır; OpenClaw ayrıca sağlayıcı çıktısından sonra son tur ve bölünmüş tur sonek bağlamını korumaya devam eder.

<Note>
Sağlayıcı başarısız olursa veya boş bir sonuç döndürürse OpenClaw yerleşik LLM özetlemesine geri döner.
</Note>

## Compaction ve budama

|                  | Compaction                    | Budama                           |
| ---------------- | ----------------------------- | -------------------------------- |
| **Ne yapar?**    | Eski konuşmayı özetler        | Eski araç sonuçlarını kırpar     |
| **Kaydedilir mi?** | Evet (oturum dökümünde)     | Hayır (yalnızca bellek içi, istek başına) |
| **Kapsam**       | Tüm konuşma                   | Yalnızca araç sonuçları          |

[Oturum budama](/tr/concepts/session-pruning), araç çıktısını özetlemeden kırpan daha hafif bir tamamlayıcıdır.

## Sorun giderme

**Çok sık Compaction mı uygulanıyor?** Modelin bağlam penceresi küçük olabilir veya araç çıktıları büyük olabilir. [Oturum budamayı](/tr/concepts/session-pruning) etkinleştirmeyi deneyin.

**Compaction sonrasında bağlam bayat mı hissettiriyor?** Özeti yönlendirmek için `/compact Focus on <topic>` kullanın veya notların korunması için [bellek boşaltmayı](/tr/concepts/memory) etkinleştirin.

**Temiz bir başlangıç mı gerekiyor?** `/new`, Compaction uygulamadan yeni bir oturum başlatır.

Gelişmiş yapılandırma için (ayrılmış token’lar, tanımlayıcı koruması, özel bağlam motorları, OpenAI sunucu tarafı Compaction), [Oturum yönetimi derin incelemesi](/tr/reference/session-management-compaction) bölümüne bakın.

## İlgili

- [Oturum](/tr/concepts/session): oturum yönetimi ve yaşam döngüsü.
- [Oturum budama](/tr/concepts/session-pruning): araç sonuçlarını kırpma.
- [Bağlam](/tr/concepts/context): ajan turları için bağlamın nasıl oluşturulduğu.
- [Hooks](/tr/automation/hooks): Compaction yaşam döngüsü Hooks’ları (`before_compaction`, `after_compaction`).
