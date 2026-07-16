---
read_when:
    - Otomatik Compaction'ı ve /compact komutunu anlamak istiyorsunuz
    - Bağlam sınırlarına ulaşan uzun oturumlarda hata ayıklıyorsunuz
summary: OpenClaw uzun konuşmaları model sınırları içinde kalmak için nasıl özetler?
title: Compaction
x-i18n:
    generated_at: "2026-07-16T17:19:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

Her modelin bir bağlam penceresi vardır: işleyebileceği en fazla token sayısı. Bir konuşma bu sınıra yaklaştığında OpenClaw, sohbetin devam edebilmesi için eski mesajları bir özette **sıkıştırır**.

## Nasıl çalışır?

1. Eski konuşma turları, kısa bir giriş halinde özetlenir.
2. Özet, oturum dökümüne kaydedilir.
3. Son mesajlar olduğu gibi korunur.

OpenClaw, bir sıkıştırma bölme noktası seçerken asistan araç çağrılarını bunlarla eşleşen `toolResult` girişleriyle birlikte tutar. Nokta bir araç bloğunun içine denk gelirse OpenClaw, çiftin birlikte kalması ve henüz özetlenmemiş mevcut son kısmın korunması için sınırı taşır.

Konuşma geçmişinin tamamı diskte kalır. Compaction yalnızca modelin sonraki turda gördüklerini değiştirir.

<Note>
Yeni yapılandırmalarda `agents.defaults.compaction.mode` varsayılan olarak `"safeguard"` değerini alır (daha sıkı koruma önlemleri, özet kalitesi denetimleri). Devre dışı bırakmak için `mode: "default"` değerini açıkça ayarlayın.
</Note>

## Otomatik sıkıştırma

Otomatik sıkıştırma varsayılan olarak açıktır. Oturum bağlam sınırına yaklaştığında veya model bir bağlam taşması hatası döndürdüğünde çalışır (bu durumda OpenClaw sıkıştırır ve yeniden dener).

Şunları görürsünüz:

- Normal Gateway günlüklerinde `embedded run auto-compaction start` / `complete`.
- Ayrıntılı modda `🧹 Auto-compaction complete`.
- `🧹 Compactions: <count>` değerini gösteren `/status`.

<Info>
OpenClaw, sıkıştırmadan önce önemli notları [bellek](/tr/concepts/memory) dosyalarına kaydetmesi için aracıyı otomatik olarak uyarır. Bu, bağlam kaybını önler.
</Info>

<AccordionGroup>
  <Accordion title="OpenClaw'ın tanıdığı taşma hatası kalıpları">
    OpenClaw, sağlayıcılara özgü onlarca taşma hatası dizesini eşleştirir (Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter ve daha fazlası). Yaygın örnekler:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Manuel sıkıştırma

Sıkıştırmayı zorlamak için herhangi bir sohbette `/compact` yazın. Özeti yönlendirmek için talimatlar ekleyin:

```text
/compact API tasarımı kararlarına odaklan
```

`agents.defaults.compaction.keepRecentTokens` ayarlandığında (varsayılan: 20,000), manuel sıkıştırma bu kesme noktasına uyar ve yeniden oluşturulan bağlamda son kısmı korur. Açık bir koruma bütçesi olmadığında manuel sıkıştırma kesin bir kontrol noktası gibi davranır ve yalnızca yeni özetten devam eder.

## Yapılandırma

`openclaw.json` dosyanızda `agents.defaults.compaction` altındaki sıkıştırmayı yapılandırın. En yaygın ayarlar aşağıda listelenmiştir; tam başvuru için [Oturum yönetimine ayrıntılı bakış](/tr/reference/session-management-compaction) bölümüne bakın.

### Farklı bir model kullanma

Sıkıştırma varsayılan olarak aracının birincil modelini kullanır. Özetlemeyi daha yetenekli veya özelleşmiş bir modele devretmek için `agents.defaults.compaction.model` ayarını yapın. Geçersiz kılma, bir `provider/model-id` dizesini veya `agents.defaults.models` altında yapılandırılmış yalın bir diğer adı kabul eder:

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

Yapılandırılmış yalın diğer adlar, sıkıştırma başlamadan önce standart sağlayıcılarına ve modellerine çözümlenir. Yalın bir değer hem bir diğer adla hem de yapılandırılmış değişmez bir model kimliğiyle eşleşirse değişmez model kimliği öncelikli olur. Eşleşmeyen yalın bir değer, etkin sağlayıcıda model kimliği olarak kalır.

Bu, yerel modellerle de çalışır; örneğin, özetlemeye ayrılmış ikinci bir Ollama modeli:

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

Ayar yapılmadığında sıkıştırma, etkin oturum modeliyle başlar. Özetleme, model yedeğine uygun bir sağlayıcı hatası nedeniyle başarısız olursa OpenClaw bu sıkıştırma girişimini oturumun mevcut model yedek zinciri üzerinden yeniden dener. Yedek seçimi geçicidir ve oturum durumuna geri yazılmaz. Açık bir `agents.defaults.compaction.model` geçersiz kılma ayarı kesin olarak uygulanır ve oturumun yedek zincirini devralmaz.

### Tanımlayıcıları koruma

Sıkıştırma özetlemesi, opak tanımlayıcıları varsayılan olarak korur (`identifierPolicy: "strict"`). Devre dışı bırakmak için `identifierPolicy: "off"`; özel yönlendirme için `identifierPolicy: "custom"` ile birlikte `identifierInstructions` kullanın.

### Etkin döküm bayt koruması

`agents.defaults.compaction.maxActiveTranscriptBytes` ayarlandığında, döküm geçmişi
bu boyuta ulaşırsa OpenClaw bir çalıştırmadan önce normal yerel sıkıştırmayı
tetikler. Bu, sağlayıcı tarafındaki bağlam yönetiminin model bağlamını sağlıklı
tutarken kalıcı döküm geçmişinin büyümeyi sürdürdüğü uzun süreli oturumlar için
kullanışlıdır. Ham baytları bölmez; normal sıkıştırma işlem hattından anlamsal
bir özet oluşturmasını ister.

<Warning>
Bayt koruması, etkin SQLite döküm geçmişine uygulanır. Eski JSONL
kontrol noktası yapıtları etkin sıkıştırma hedefi değildir.
</Warning>

### Ardıl dökümler

`agents.defaults.compaction.truncateAfterCompaction` etkinleştirildiğinde OpenClaw, mevcut dökümü yerinde yeniden yazmaz. Sıkıştırma özetinden, korunan durumdan ve özetlenmemiş son kısımdan yeni bir etkin ardıl döküm oluşturur; ardından dal/geri yükleme akışlarını bu sıkıştırılmış ardıla yönlendiren kontrol noktası meta verilerini kaydeder.
Ardıl dökümler ayrıca kısa bir yeniden deneme penceresi içinde gelen, birebir
aynı uzun kullanıcı turlarını kaldırır; böylece kanal yeniden deneme fırtınaları
sıkıştırmadan sonra bir sonraki etkin döküme taşınmaz.

OpenClaw artık yeni sıkıştırmalar için ayrı `.checkpoint.*.jsonl`
kopyaları yazmaz. Mevcut eski kontrol noktası dosyaları, kendilerine başvurulduğu
sürece kullanılmaya devam edebilir ve normal oturum temizliğiyle budanır.

### Sıkıştırma bildirimleri

Sıkıştırma varsayılan olarak sessizce çalışır. Sıkıştırma başladığında ve tamamlandığında kısa durum mesajları göstermek ve sıkıştırma öncesi bellek boşaltma hakkı tükendiği hâlde yanıt devam ettiğinde performans düşüşü bildirimi sunmak için `notifyUser` ayarını yapın:

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

### Belleği boşaltma

OpenClaw, kalıcı notları diske kaydetmek için sıkıştırmadan önce **sessiz bir bellek boşaltma** turu çalıştırabilir. Bu bakım turunun etkin konuşma modeli yerine yerel bir model kullanması gerektiğinde `agents.defaults.compaction.memoryFlush.model` ayarını yapın:

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

Bellek boşaltma modeli geçersiz kılma ayarı kesin olarak uygulanır ve etkin oturumun yedek zincirini devralmaz. Ayrıntılar ve yapılandırma için [Bellek](/tr/concepts/memory) bölümüne bakın.

## Takılabilir sıkıştırma sağlayıcıları

Plugin'ler, Plugin API'sindeki `registerCompactionProvider()` üzerinden özel bir sıkıştırma sağlayıcısı kaydedebilir. Bir sağlayıcı kaydedilip yapılandırıldığında OpenClaw, özetlemeyi yerleşik LLM işlem hattı yerine bu sağlayıcıya devreder.

Kayıtlı bir sağlayıcıyı kullanmak için yapılandırmanızda sağlayıcının kimliğini ayarlayın:

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

Bir `provider` ayarlamak, `mode: "safeguard"` değerini otomatik olarak zorunlu kılar. Sağlayıcılar yerleşik yolla aynı sıkıştırma talimatlarını ve tanımlayıcı koruma politikasını alır; OpenClaw ayrıca sağlayıcı çıktısından sonra son tur ve bölünmüş tur son ek bağlamını korumaya devam eder.

<Note>
Sağlayıcı başarısız olursa veya boş bir sonuç döndürürse OpenClaw, yerleşik LLM özetlemesine geri döner.
</Note>

## Compaction ile budama karşılaştırması

|                  | Compaction                              | Budama                                         |
| ---------------- | --------------------------------------- | ---------------------------------------------- |
| **Ne yapar?**    | Eski konuşmaları özetler                | Eski araç sonuçlarını kırpar                    |
| **Kaydedilir mi?** | Evet (oturum dökümünde)               | Hayır (yalnızca bellekte, her istek için)       |
| **Kapsam**       | Konuşmanın tamamı                       | Yalnızca araç sonuçları                         |

[Oturum budama](/tr/concepts/session-pruning), araç çıktısını özetlemeden kırpan daha hafif bir tamamlayıcıdır.

## Sorun giderme

**Çok sık mı sıkıştırılıyor?** Modelin bağlam penceresi küçük veya araç çıktıları büyük olabilir. [Oturum budamayı](/tr/concepts/session-pruning) etkinleştirmeyi deneyin.

**Sıkıştırmadan sonra bağlam güncelliğini yitirmiş gibi mi geliyor?** Özeti yönlendirmek için `/compact Focus on <topic>` kullanın veya notların korunması için [bellek boşaltmayı](/tr/concepts/memory) etkinleştirin.

**Temiz bir başlangıç mı gerekiyor?** `/new`, sıkıştırma yapmadan yeni bir oturum başlatır.

Gelişmiş yapılandırma (ayrılmış token'lar, tanımlayıcı koruma, özel bağlam motorları, OpenAI sunucu tarafı sıkıştırma) için [Oturum yönetimine ayrıntılı bakış](/tr/reference/session-management-compaction) bölümüne bakın.

## İlgili konular

- [Oturum](/tr/concepts/session): oturum yönetimi ve yaşam döngüsü.
- [Oturum budama](/tr/concepts/session-pruning): araç sonuçlarını kırpma.
- [Bağlam](/tr/concepts/context): aracı turları için bağlamın nasıl oluşturulduğu.
- [Kancalar](/tr/automation/hooks): sıkıştırma yaşam döngüsü kancaları (`before_compaction`, `after_compaction`).
