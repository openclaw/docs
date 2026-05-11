---
read_when:
    - Otomatik Compaction’ı ve /compact komutunu anlamak istiyorsunuz
    - Bağlam sınırlarına ulaşan uzun oturumlarda hata ayıklıyorsunuz
summary: OpenClaw'ın model sınırları içinde kalmak için uzun konuşmaları nasıl özetlediği
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:27:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

Her modelin bir context penceresi vardır: işleyebileceği maksimum token sayısı. Bir konuşma bu sınıra yaklaştığında OpenClaw, sohbetin devam edebilmesi için eski iletileri bir özete **compacts** eder.

## Nasıl çalışır

1. Daha eski konuşma turları kompakt bir girdiye özetlenir.
2. Özet, oturum transcript'ine kaydedilir.
3. Son iletiler olduğu gibi tutulur.

OpenClaw geçmişi compaction parçalarına böldüğünde, assistant tool çağrılarını eşleşen `toolResult` girdileriyle birlikte tutar. Bir bölme noktası bir tool bloğunun içine denk gelirse OpenClaw sınırı kaydırır; böylece eş birlikte kalır ve mevcut özetlenmemiş kuyruk korunur.

Tam konuşma geçmişi diskte kalır. Compaction yalnızca modelin bir sonraki turda ne gördüğünü değiştirir.

## Otomatik compaction

Otomatik compaction varsayılan olarak açıktır. Oturum context sınırına yaklaştığında veya model bir context-overflow hatası döndürdüğünde çalışır (bu durumda OpenClaw compact eder ve yeniden dener).

Şunları görürsünüz:

- Normal Gateway günlüklerinde `embedded run auto-compaction start` / `complete`.
- Ayrıntılı modda `🧹 Auto-compaction complete`.
- `/status` çıktısında `🧹 Compactions: <count>`.

<Info>
OpenClaw, compact etmeden önce agent'a önemli notları [memory](/tr/concepts/memory) dosyalarına kaydetmesini otomatik olarak hatırlatır. Bu, context kaybını önler.
</Info>

<AccordionGroup>
  <Accordion title="Tanınan overflow imzaları">
    OpenClaw, şu provider hata kalıplarından context overflow durumunu algılar:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Manuel compaction

Bir compaction'ı zorlamak için herhangi bir sohbette `/compact` yazın. Özete yol göstermek için talimat ekleyin:

```
/compact Focus on the API design decisions
```

`agents.defaults.compaction.keepRecentTokens` ayarlandığında, manuel compaction bu Pi kesme noktasına uyar ve yeniden oluşturulan context içinde son kuyruğu tutar. Açık bir tutma bütçesi olmadan, manuel compaction sert bir checkpoint gibi davranır ve yalnızca yeni özetten devam eder.

## Yapılandırma

Compaction'ı `openclaw.json` dosyanızda `agents.defaults.compaction` altında yapılandırın. En yaygın düğmeler aşağıda listelenmiştir; tam başvuru için bkz. [Oturum yönetimi derinlemesine inceleme](/tr/reference/session-management-compaction).

### Farklı bir model kullanma

Varsayılan olarak compaction, agent'ın birincil modelini kullanır. Özetlemeyi daha yetenekli veya özelleşmiş bir modele devretmek için `agents.defaults.compaction.model` ayarını belirleyin. Override herhangi bir `provider/model-id` dizesini kabul eder:

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

Ayarlanmadığında compaction etkin oturum modeliyle başlar. Özetleme model-fallback'e uygun bir provider hatasıyla başarısız olursa OpenClaw, o compaction denemesini oturumun mevcut model fallback zinciri üzerinden yeniden dener. Fallback seçimi geçicidir ve oturum durumuna geri yazılmaz. Açık bir `agents.defaults.compaction.model` override'ı kesin kalır ve oturum fallback zincirini devralmaz.

### Tanımlayıcı koruma

Compaction özetlemesi, opaque tanımlayıcıları varsayılan olarak korur (`identifierPolicy: "strict"`). Devre dışı bırakmak için `identifierPolicy: "off"` ile veya özel yönlendirme için `identifierPolicy: "custom"` artı `identifierInstructions` ile override edin.

### Etkin transcript bayt koruması

`agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında, etkin JSONL bu boyuta ulaşırsa OpenClaw bir çalıştırmadan önce normal yerel compaction'ı tetikler. Bu, provider tarafı context yönetiminin model context'ini sağlıklı tutabildiği, ancak yerel transcript'in büyümeye devam ettiği uzun süreli oturumlar için kullanışlıdır. Ham JSONL baytlarını bölmez; normal compaction pipeline'ından anlamsal bir özet oluşturmasını ister.

<Warning>
Bayt koruması `truncateAfterCompaction: true` gerektirir. Transcript rotasyonu olmadan etkin dosya küçülmez ve koruma pasif kalır.
</Warning>

### Successor transcript'ler

`agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde OpenClaw mevcut transcript'i yerinde yeniden yazmaz. Compaction özetinden, korunmuş durumdan ve özetlenmemiş kuyruktan yeni bir etkin successor transcript oluşturur; ardından önceki JSONL dosyasını arşivlenmiş checkpoint kaynağı olarak tutar.
Successor transcript'ler ayrıca kısa bir yeniden deneme penceresi içinde gelen tam yinelenen uzun kullanıcı turlarını da düşürür; böylece channel yeniden deneme fırtınaları compaction sonrasında bir sonraki etkin transcript'e taşınmaz.

Compaction öncesi checkpoint'ler yalnızca OpenClaw'ın checkpoint boyutu sınırının altında kaldıkları sürece saklanır; fazla büyük etkin transcript'ler yine compact edilir, ancak OpenClaw disk kullanımını ikiye katlamak yerine büyük debug snapshot'ını atlar.

### Compaction bildirimleri

Varsayılan olarak compaction sessiz çalışır. Compaction başladığında ve tamamlandığında kısa durum iletileri göstermek için `notifyUser` ayarını belirleyin:

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

### Memory flush

Compaction öncesinde OpenClaw, dayanıklı notları diske depolamak için **sessiz memory flush** turu çalıştırabilir. Bu bakım turunun etkin konuşma modeli yerine yerel bir model kullanması gerektiğinde `agents.defaults.compaction.memoryFlush.model` ayarını belirleyin:

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

Memory-flush model override'ı kesindir ve etkin oturum fallback zincirini devralmaz. Ayrıntılar ve yapılandırma için bkz. [Memory](/tr/concepts/memory).

## Takılabilir compaction provider'ları

Plugins, Plugin API'sindeki `registerCompactionProvider()` aracılığıyla özel bir compaction provider'ı kaydedebilir. Bir provider kaydedilip yapılandırıldığında OpenClaw, özetlemeyi yerleşik LLM pipeline'ı yerine ona devreder.

Kayıtlı bir provider kullanmak için yapılandırmanızda id'sini ayarlayın:

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

Bir `provider` ayarlamak otomatik olarak `mode: "safeguard"` değerini zorunlu kılar. Provider'lar, yerleşik yol ile aynı compaction talimatlarını ve tanımlayıcı koruma politikasını alır; OpenClaw provider çıktısından sonra son-tur ve bölünmüş-tur suffix context'ini yine korur.

<Note>
Provider başarısız olursa veya boş bir sonuç döndürürse OpenClaw yerleşik LLM özetlemesine geri döner.
</Note>

## Compaction ve budama

|                  | Compaction                    | Budama                           |
| ---------------- | ----------------------------- | -------------------------------- |
| **Ne yapar** | Daha eski konuşmayı özetler | Eski tool sonuçlarını kırpar     |
| **Kaydedilir mi?**       | Evet (oturum transcript'inde) | Hayır (yalnızca bellekte, istek başına) |
| **Kapsam**        | Tüm konuşma                  | Yalnızca tool sonuçları          |

[Oturum budama](/tr/concepts/session-pruning), özetleme yapmadan tool çıktısını kırpan daha hafif bir tamamlayıcıdır.

## Sorun giderme

**Çok sık compact ediyor mu?** Modelin context penceresi küçük olabilir veya tool çıktıları büyük olabilir. [Oturum budama](/tr/concepts/session-pruning) özelliğini etkinleştirmeyi deneyin.

**Compaction sonrasında context bayat mı geliyor?** Özeti yönlendirmek için `/compact Focus on <topic>` kullanın veya notların kalması için [memory flush](/tr/concepts/memory) özelliğini etkinleştirin.

**Temiz bir başlangıca mı ihtiyacınız var?** `/new`, compact etmeden yeni bir oturum başlatır.

Gelişmiş yapılandırma (reserve token'lar, tanımlayıcı koruma, özel context engine'leri, OpenAI sunucu tarafı compaction) için bkz. [Oturum yönetimi derinlemesine inceleme](/tr/reference/session-management-compaction).

## İlgili

- [Oturum](/tr/concepts/session): oturum yönetimi ve yaşam döngüsü.
- [Oturum budama](/tr/concepts/session-pruning): tool sonuçlarını kırpma.
- [Context](/tr/concepts/context): agent turları için context'in nasıl oluşturulduğu.
- [Hooks](/tr/automation/hooks): compaction yaşam döngüsü hooks'ları (`before_compaction`, `after_compaction`).
