---
read_when:
    - Grup sohbetlerini özel ajanlara yönlendirirsiniz
    - Tek bir uzun görevin tüm sohbetleri engellemediği paralel çalışma istiyorsunuz
    - Çok ajanlı bir operasyon düzeni tasarlıyorsunuz
sidebarTitle: Specialist lanes
status: active
summary: Paylaşılan model ve araç kapasitesini tıkamadan uzmanlaşmış ajanları paralel olarak çalıştırın
title: Paralel uzmanlık hatları
x-i18n:
    generated_at: "2026-07-12T12:14:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09852b6cf5a790e98fb5e0805b0df57b2f3719b1387ecfacfb4973bb6841abb4
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Paralel uzman hatları, kullanıcı deneyimini hızlı tutarken tek bir Gateway'in farklı sohbetleri veya odaları farklı aracılara yönlendirmesine olanak tanır. Paralelliği yalnızca "daha fazla aracı" olarak değil, kıt kaynaklara yönelik bir tasarım problemi olarak ele alın.

## Temel ilkeler

Bir uzman hattı, yalnızca gerçek darboğazlardaki çekişmeyi azalttığında iş hacmini artırır:

- **Oturum kilitleri**: Belirli bir oturumu aynı anda yalnızca bir çalıştırma değiştirmelidir.
- **Genel model kapasitesi**: Görünür tüm sohbet çalıştırmaları sağlayıcı sınırlarını paylaşmaya devam eder.
- **Araç kapasitesi**: Kabuk, tarayıcı, ağ ve depo çalışmaları model turunun kendisinden daha yavaş olabilir.
- **Bağlam bütçesi**: Uzun dökümler, gelecekteki her turu daha yavaş ve daha az odaklı hâle getirir.
- **Sahiplik belirsizliği**: Aynı işi yapan yinelenen aracılar kapasiteyi boşa harcar.

OpenClaw, çalıştırmaları zaten oturum başına seri hâle getirir ve genel paralelliği [komut kuyruğu](/tr/concepts/queue) üzerinden sınırlar. Uzman hatları bunun üzerine politika ekler: Hangi işin hangi aracıya ait olduğu, nelerin sohbette kaldığı ve nelerin arka plan çalışmasına dönüştüğü.

## Önerilen devreye alma planı

### Aşama 1: Hat sözleşmeleri + ağır işleri arka planda yürütme

Her hatta, çalışma alanında ve sistem isteminde yazılı bir sözleşme verin:

- **Amaç**: Bu hattın sahip olduğu iş.
- **Hedef dışı işler**: Denemek yerine devretmesi gereken işler.
- **Sohbet bütçesi**: Hızlı yanıtlar sohbette kalır; uzun görevler kısaca alındıktan sonra bir arka plan alt aracısında veya görevinde çalıştırılır.
- **Devir kuralı**: İş başka bir hatta ait olduğunda, nereye gitmesi gerektiğini belirtin ve kısa bir devir özeti sağlayın.
- **Araç riski kuralı**: İşi yapabilecek en küçük araç yüzeyini tercih edin.

Bu, en düşük maliyetli aşamadır ve tıkanmaların çoğunu giderir: Tek bir kodlama işi artık araştırma hattını aşırı yavaşlatmaz ve her sohbet kendi bağlamını temiz tutar.

### Aşama 2: Öncelik ve eşzamanlılık denetimleri

Kuyruk ve model kapasitesini her hattın iş değerine göre ayarlayın:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

Yüksek öncelikli işler için doğrudan/kişisel sohbetleri ve üretim operasyonları aracılarını kullanın. Sistem meşgul olduğunda araştırma, taslak hazırlama ve toplu kodlama işlerinin arka plan görevlerine taşınmasına izin verin.

### Aşama 3: Koordinatör / trafik denetleyicisi

Birden fazla hat etkinleştirildikten sonra küçük bir koordinatör düzeni ekleyin:

- Etkin hat görevlerini ve sahiplerini izleyin.
- Gruplar arasındaki yinelenen istekleri tespit edin.
- Devir özetlerini hatlar arasında yönlendirin.
- Yalnızca engelleri, tamamlanan sonuçları ve insanın vermesi gereken kararları gösterin.

Buradan başlamayın. Hat sözleşmeleri olmayan bir koordinatör yalnızca kaosu koordine eder.

## Asgari hat sözleşmesi şablonu

```md
# Hat sözleşmesi

## Sorumlulukları

- <bu hattın sorumlu olduğu iş>

## Sorumlulukları dışında kalanlar

- <devredilecek iş>

## Sohbet bütçesi

- Hızlı soruları doğrudan yanıtlayın.
- Çok adımlı, yavaş veya yoğun araç kullanımı gerektiren işler için: kısaca
  alındığını bildirin, işi başlatın/arka plana alın, ardından tamamlandığında
  sonucu döndürün.

## Devir

İstek başka bir hatta aitse şu bilgilerle yanıt verin:

- hedef hat
- amaç
- ilgili bağlam
- bir sonraki kesin eylem

## Araç yaklaşımı

Görevi tamamlayabilecek en küçük araç yüzeyini kullanın. Bu hat açıkça sorumlu
olmadıkça kapsamlı kabuk veya ağ çalışmalarından kaçının.
```

## İlgili konular

- [Çok aracılı yönlendirme](/tr/concepts/multi-agent)
- [Komut kuyruğu](/tr/concepts/queue)
- [Alt aracılar](/tr/tools/subagents)
