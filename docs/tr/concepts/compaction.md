---
read_when:
    - Otomatik Compaction'ı ve /compact komutunu anlamak istiyorsunuz
    - Bağlam sınırlarına ulaşan uzun oturumlarda hata ayıklıyorsunuz
summary: OpenClaw uzun konuşmaları model sınırları içinde kalmak için nasıl özetler
title: Compaction
x-i18n:
    generated_at: "2026-04-30T09:15:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

Her modelin bir bağlam penceresi vardır: işleyebileceği maksimum token sayısı. Bir konuşma bu sınıra yaklaştığında, OpenClaw sohbetin devam edebilmesi için eski mesajları bir özet halinde **Compaction** ile sıkıştırır.

## Nasıl çalışır?

1. Eski konuşma turları kısa bir kayıt halinde özetlenir.
2. Özet, oturum dökümüne kaydedilir.
3. Son mesajlar olduğu gibi tutulur.

OpenClaw geçmişi Compaction parçalarına böldüğünde, assistant araç çağrılarını eşleşen `toolResult` kayıtlarıyla birlikte tutar. Bölme noktası bir araç bloğunun içine denk gelirse, OpenClaw sınırı taşır; böylece çift birlikte kalır ve mevcut özetlenmemiş kuyruk korunur.

Tam konuşma geçmişi diskte kalır. Compaction yalnızca modelin bir sonraki turda ne gördüğünü değiştirir.

## Otomatik Compaction

Otomatik Compaction varsayılan olarak açıktır. Oturum bağlam sınırına yaklaştığında veya model bir bağlam taşması hatası döndürdüğünde çalışır (bu durumda OpenClaw Compaction uygular ve yeniden dener).

Şunları görürsünüz:

- Ayrıntılı modda `🧹 Auto-compaction complete`.
- `/status` içinde `🧹 Compactions: <count>`.

<Info>
Compaction öncesinde OpenClaw, önemli notları [memory](/tr/concepts/memory) dosyalarına kaydetmesi için agent'a otomatik olarak hatırlatma yapar. Bu, bağlam kaybını önler.
</Info>

<AccordionGroup>
  <Accordion title="Tanınan taşma imzaları">
    OpenClaw, bağlam taşmasını şu sağlayıcı hata kalıplarından algılar:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Manuel Compaction

Compaction'ı zorlamak için herhangi bir sohbette `/compact` yazın. Özeti yönlendirmek için talimat ekleyin:

```
/compact Focus on the API design decisions
```

`agents.defaults.compaction.keepRecentTokens` ayarlandığında, manuel Compaction bu Pi kesme noktasına uyar ve yeniden oluşturulan bağlamda son kuyruğu tutar. Açık bir tutma bütçesi olmadan, manuel Compaction katı bir denetim noktası gibi davranır ve yalnızca yeni özetten devam eder.

## Yapılandırma

`openclaw.json` içinde `agents.defaults.compaction` altında Compaction'ı yapılandırın. En yaygın ayarlar aşağıda listelenmiştir; tam başvuru için [Oturum yönetimi ayrıntılı incelemesi](/tr/reference/session-management-compaction) bölümüne bakın.

### Farklı bir model kullanma

Varsayılan olarak Compaction, agent'ın birincil modelini kullanır. Özetlemeyi daha yetenekli veya uzmanlaşmış bir modele devretmek için `agents.defaults.compaction.model` ayarını yapın. Geçersiz kılma herhangi bir `provider/model-id` dizesini kabul eder:

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

Bu yerel modellerle de çalışır; örneğin özetlemeye ayrılmış ikinci bir Ollama modeli:

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

Ayarlanmadığında Compaction, agent'ın birincil modelini kullanır.

### Tanımlayıcı koruma

Compaction özetlemesi, opak tanımlayıcıları varsayılan olarak korur (`identifierPolicy: "strict"`). Devre dışı bırakmak için `identifierPolicy: "off"` ile, özel yönlendirme için ise `identifierPolicy: "custom"` ve `identifierInstructions` ile geçersiz kılın.

### Etkin döküm bayt koruması

`agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında, etkin JSONL bu boyuta ulaşırsa OpenClaw bir çalıştırmadan önce normal yerel Compaction'ı tetikler. Bu, sağlayıcı tarafı bağlam yönetiminin model bağlamını sağlıklı tutabildiği, ancak yerel dökümün büyümeye devam ettiği uzun süreli oturumlar için yararlıdır. Ham JSONL baytlarını bölmez; normal Compaction hattından anlamsal bir özet oluşturmasını ister.

<Warning>
Bayt koruması `truncateAfterCompaction: true` gerektirir. Döküm rotasyonu olmadan etkin dosya küçülmez ve koruma devre dışı kalır.
</Warning>

### Ardıl dökümler

`agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde, OpenClaw mevcut dökümü yerinde yeniden yazmaz. Compaction özetinden, korunmuş durumdan ve özetlenmemiş kuyruktan yeni bir etkin ardıl döküm oluşturur; ardından önceki JSONL dosyasını arşivlenmiş denetim noktası kaynağı olarak tutar.
Ardıl dökümler, kısa bir yeniden deneme penceresi içinde gelen birebir aynı uzun kullanıcı turlarını da kaldırır; böylece kanal yeniden deneme fırtınaları Compaction sonrasında sonraki etkin döküme taşınmaz.

Compaction öncesi denetim noktaları yalnızca OpenClaw'ın denetim noktası boyut sınırının altında kaldıkları sürece korunur; aşırı büyük etkin dökümler yine de Compaction'dan geçirilir, ancak OpenClaw disk kullanımını ikiye katlamak yerine büyük hata ayıklama anlık görüntüsünü atlar.

### Compaction bildirimleri

Varsayılan olarak Compaction sessiz çalışır. Compaction başladığında ve tamamlandığında kısa durum mesajları göstermek için `notifyUser` ayarını yapın:

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

Compaction öncesinde OpenClaw, kalıcı notları diske depolamak için **sessiz bellek boşaltma** turu çalıştırabilir. Bu bakım turunun etkin konuşma modeli yerine yerel bir model kullanması gerektiğinde `agents.defaults.compaction.memoryFlush.model` ayarını yapın:

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

Bellek boşaltma modeli geçersiz kılması kesindir ve etkin oturumun yedek zincirini miras almaz. Ayrıntılar ve yapılandırma için [Bellek](/tr/concepts/memory) bölümüne bakın.

## Takılabilir Compaction sağlayıcıları

Plugin'ler, Plugin API'sinde `registerCompactionProvider()` ile özel bir Compaction sağlayıcısı kaydedebilir. Bir sağlayıcı kaydedilip yapılandırıldığında OpenClaw, özetlemeyi yerleşik LLM hattı yerine ona devreder.

Kayıtlı bir sağlayıcıyı kullanmak için yapılandırmanızda kimliğini ayarlayın:

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

Bir `provider` ayarlamak otomatik olarak `mode: "safeguard"` zorlar. Sağlayıcılar, yerleşik yol ile aynı Compaction talimatlarını ve tanımlayıcı koruma politikasını alır; OpenClaw sağlayıcı çıktısından sonra son tur ve bölünmüş tur sonek bağlamını yine de korur.

<Note>
Sağlayıcı başarısız olursa veya boş sonuç döndürürse OpenClaw yerleşik LLM özetlemesine geri döner.
</Note>

## Compaction ve budama

|                  | Compaction                    | Budama                           |
| ---------------- | ----------------------------- | -------------------------------- |
| **Ne yapar?**    | Eski konuşmayı özetler        | Eski araç sonuçlarını kırpar     |
| **Kaydedilir mi?** | Evet (oturum dökümünde)     | Hayır (yalnızca bellek içinde, istek başına) |
| **Kapsam**       | Tüm konuşma                   | Yalnızca araç sonuçları          |

[Oturum budama](/tr/concepts/session-pruning), özetleme yapmadan araç çıktısını kırpan daha hafif bir tamamlayıcıdır.

## Sorun giderme

**Çok sık Compaction mı oluyor?** Modelin bağlam penceresi küçük olabilir veya araç çıktıları büyük olabilir. [Oturum budama](/tr/concepts/session-pruning) özelliğini etkinleştirmeyi deneyin.

**Compaction sonrasında bağlam bayat mı hissettiriyor?** Özeti yönlendirmek için `/compact Focus on <topic>` kullanın veya notların korunması için [bellek boşaltma](/tr/concepts/memory) özelliğini etkinleştirin.

**Temiz bir başlangıca mı ihtiyacınız var?** `/new`, Compaction yapmadan yeni bir oturum başlatır.

Gelişmiş yapılandırma (ayrılmış token'lar, tanımlayıcı koruma, özel bağlam motorları, OpenAI sunucu tarafı Compaction) için [Oturum yönetimi ayrıntılı incelemesi](/tr/reference/session-management-compaction) bölümüne bakın.

## İlgili

- [Oturum](/tr/concepts/session): oturum yönetimi ve yaşam döngüsü.
- [Oturum budama](/tr/concepts/session-pruning): araç sonuçlarını kırpma.
- [Bağlam](/tr/concepts/context): agent turları için bağlamın nasıl oluşturulduğu.
- [Kancalar](/tr/automation/hooks): Compaction yaşam döngüsü kancaları (`before_compaction`, `after_compaction`).
