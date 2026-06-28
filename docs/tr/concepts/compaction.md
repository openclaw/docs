---
read_when:
    - Otomatik compaction ve /compact işlevini anlamak istiyorsunuz
    - Bağlam sınırlarına takılan uzun oturumlarda hata ayıklıyorsunuz
summary: OpenClaw uzun konuşmaları model sınırları içinde kalmak için nasıl özetler
title: Compaction
x-i18n:
    generated_at: "2026-06-28T00:27:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

Her modelin bir bağlam penceresi vardır: işleyebileceği maksimum token sayısı. Bir konuşma bu sınıra yaklaştığında OpenClaw, sohbetin devam edebilmesi için eski mesajları bir özete **compaction** uygular.

## Nasıl çalışır?

1. Eski konuşma turları kompakt bir girdide özetlenir.
2. Özet, oturum dökümüne kaydedilir.
3. Son mesajlar olduğu gibi korunur.

OpenClaw geçmişi compaction parçalarına böldüğünde, asistan araç çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar. Bir bölme noktası bir araç bloğunun içine denk gelirse OpenClaw, çiftin birlikte kalması ve mevcut özetlenmemiş kuyruğun korunması için sınırı taşır.

Tam konuşma geçmişi diskte kalır. Compaction yalnızca modelin bir sonraki turda gördüklerini değiştirir.

## Otomatik compaction

Otomatik compaction varsayılan olarak açıktır. Oturum bağlam sınırına yaklaştığında veya model bir bağlam taşması hatası döndürdüğünde çalışır; bu durumda OpenClaw compaction uygular ve yeniden dener.

Şunları görürsünüz:

- Normal Gateway günlüklerinde `embedded run auto-compaction start` / `complete`.
- Ayrıntılı modda `🧹 Auto-compaction complete`.
- `/status` çıktısında `🧹 Compactions: <count>`.

<Info>
OpenClaw, compaction öncesinde önemli notları [memory](/tr/concepts/memory) dosyalarına kaydetmesi için aracı otomatik olarak hatırlatır. Bu, bağlam kaybını önler.
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

## Manuel compaction

Compaction zorlamak için herhangi bir sohbette `/compact` yazın. Özeti yönlendirmek için yönergeler ekleyin:

```
/compact Focus on the API design decisions
```

`agents.defaults.compaction.keepRecentTokens` ayarlandığında manuel compaction, bu OpenClaw kesme noktasına uyar ve yeniden oluşturulan bağlamda son kuyruğu korur. Açık bir koruma bütçesi olmadan manuel compaction sert bir kontrol noktası gibi davranır ve yalnızca yeni özetten devam eder.

## Yapılandırma

Compaction ayarlarını `openclaw.json` dosyanızda `agents.defaults.compaction` altında yapılandırın. En yaygın ayarlar aşağıda listelenmiştir; tam başvuru için [Oturum yönetimi ayrıntılı incelemesi](/tr/reference/session-management-compaction) bölümüne bakın.

### Farklı bir model kullanma

Varsayılan olarak compaction, aracın birincil modelini kullanır. Özetlemeyi daha yetenekli veya uzmanlaşmış bir modele devretmek için `agents.defaults.compaction.model` ayarını belirleyin. Geçersiz kılma, bir `provider/model-id` dizesini veya `agents.defaults.models` altında yapılandırılmış yalın bir takma adı kabul eder:

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

Yalın yapılandırılmış takma adlar, compaction başlamadan önce kurallı sağlayıcılarına ve modellerine çözümlenir. Yalın bir değer hem bir takma adla hem de yapılandırılmış değişmez bir model kimliğiyle eşleşirse değişmez model kimliği kazanır. Eşleşmeyen yalın bir değer, etkin sağlayıcıda model kimliği olarak kalır.

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

Ayarlanmadığında compaction, etkin oturum modeliyle başlar. Özetleme, model yedeğine uygun bir sağlayıcı hatasıyla başarısız olursa OpenClaw, bu compaction denemesini oturumun mevcut model yedek zinciri üzerinden yeniden dener. Yedek seçimi geçicidir ve oturum durumuna geri yazılmaz. Açık bir `agents.defaults.compaction.model` geçersiz kılması kesin kalır ve oturum yedek zincirini devralmaz.

### Tanımlayıcı koruması

Compaction özetlemesi, opak tanımlayıcıları varsayılan olarak korur (`identifierPolicy: "strict"`). Devre dışı bırakmak için `identifierPolicy: "off"` ile, özel yönlendirme içinse `identifierPolicy: "custom"` artı `identifierInstructions` ile geçersiz kılın.

### Etkin döküm bayt koruması

`agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında OpenClaw, etkin JSONL bu boyuta ulaşırsa bir çalışmadan önce normal yerel compaction tetikler. Bu, sağlayıcı tarafı bağlam yönetiminin model bağlamını sağlıklı tutabildiği ancak yerel dökümün büyümeye devam ettiği uzun süre çalışan oturumlar için kullanışlıdır. Ham JSONL baytlarını bölmez; normal compaction işlem hattından anlamsal bir özet oluşturmasını ister.

<Warning>
Bayt koruması `truncateAfterCompaction: true` gerektirir. Döküm döndürme olmadan etkin dosya küçülmez ve koruma pasif kalır.
</Warning>

### Ardıl dökümler

`agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde OpenClaw, mevcut dökümü yerinde yeniden yazmaz. Compaction özetinden, korunmuş durumdan ve özetlenmemiş kuyruktan yeni bir etkin ardıl döküm oluşturur, ardından dal/geri yükleme akışlarını bu kompakt ardıla yönelten kontrol noktası üst verilerini kaydeder.
Ardıl dökümler ayrıca kısa bir yeniden deneme penceresi içinde gelen birebir aynı uzun kullanıcı turlarını düşürür; böylece kanal yeniden deneme fırtınaları compaction sonrasında bir sonraki etkin döküme taşınmaz.

OpenClaw artık yeni compaction işlemleri için ayrı `.checkpoint.*.jsonl` kopyaları yazmaz. Mevcut eski kontrol noktası dosyaları, başvuruldukları sürece kullanılabilir ve normal oturum temizliği tarafından budanır.

### Compaction bildirimleri

Varsayılan olarak compaction sessiz çalışır. Compaction başladığında ve tamamlandığında kısa durum mesajları göstermek için `notifyUser` ayarını belirleyin:

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

Compaction öncesinde OpenClaw, kalıcı notları diske depolamak için **sessiz bellek boşaltma** turu çalıştırabilir. Bu bakım turunun etkin konuşma modeli yerine yerel bir model kullanması gerektiğinde `agents.defaults.compaction.memoryFlush.model` ayarını belirleyin:

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

Bellek boşaltma modeli geçersiz kılması kesindir ve etkin oturum yedek zincirini devralmaz. Ayrıntılar ve yapılandırma için [Bellek](/tr/concepts/memory) bölümüne bakın.

## Takılabilir compaction sağlayıcıları

Plugin'ler, plugin API üzerinde `registerCompactionProvider()` aracılığıyla özel bir compaction sağlayıcısı kaydedebilir. Bir sağlayıcı kaydedilip yapılandırıldığında OpenClaw, özetlemeyi yerleşik LLM işlem hattı yerine ona devreder.

Kayıtlı bir sağlayıcı kullanmak için yapılandırmanızda kimliğini ayarlayın:

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

Bir `provider` ayarlamak otomatik olarak `mode: "safeguard"` zorlar. Sağlayıcılar, yerleşik yolla aynı compaction yönergelerini ve tanımlayıcı koruma politikasını alır; OpenClaw sağlayıcı çıktısından sonra da son tur ve bölünmüş tur sonek bağlamını korur.

<Note>
Sağlayıcı başarısız olursa veya boş sonuç döndürürse OpenClaw yerleşik LLM özetlemesine geri döner.
</Note>

## Compaction ve budama

|                  | Compaction                    | Budama                           |
| ---------------- | ----------------------------- | -------------------------------- |
| **Ne yapar?**    | Eski konuşmayı özetler        | Eski araç sonuçlarını kırpar     |
| **Kaydedilir mi?** | Evet (oturum dökümünde)     | Hayır (yalnızca bellek içi, istek başına) |
| **Kapsam**       | Tüm konuşma                   | Yalnızca araç sonuçları          |

[Oturum budama](/tr/concepts/session-pruning), araç çıktısını özetlemeden kırpan daha hafif bir tamamlayıcıdır.

## Sorun giderme

**Çok sık compaction mı uygulanıyor?** Modelin bağlam penceresi küçük olabilir veya araç çıktıları büyük olabilir. [Oturum budamayı](/tr/concepts/session-pruning) etkinleştirmeyi deneyin.

**Compaction sonrasında bağlam eski mi hissettiriyor?** Özeti yönlendirmek için `/compact Focus on <topic>` kullanın veya notların korunması için [bellek boşaltmayı](/tr/concepts/memory) etkinleştirin.

**Temiz bir başlangıç mı gerekiyor?** `/new`, compaction uygulamadan yeni bir oturum başlatır.

Gelişmiş yapılandırma için (ayrılmış token'lar, tanımlayıcı koruması, özel bağlam motorları, OpenAI sunucu tarafı compaction) [Oturum yönetimi ayrıntılı incelemesi](/tr/reference/session-management-compaction) bölümüne bakın.

## İlgili

- [Oturum](/tr/concepts/session): oturum yönetimi ve yaşam döngüsü.
- [Oturum budama](/tr/concepts/session-pruning): araç sonuçlarını kırpma.
- [Bağlam](/tr/concepts/context): aracı turları için bağlamın nasıl oluşturulduğu.
- [Hooks](/tr/automation/hooks): compaction yaşam döngüsü hook'ları (`before_compaction`, `after_compaction`).
