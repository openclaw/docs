---
read_when:
    - Grup sohbetlerini özel ajanlara yönlendirirsiniz
    - Tek bir uzun görevin her sohbeti engellemediği paralel çalışma istiyorsunuz
    - Çok ajanlı bir operasyon kurulumu tasarlıyorsunuz
sidebarTitle: Specialist lanes
status: active
summary: Uzman ajanları, paylaşılan model ve araç kapasitesini tıkamadan paralel çalıştırın
title: Paralel uzman kulvarları
x-i18n:
    generated_at: "2026-05-10T19:33:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8721056fbe08822ac92d4bc14c8c2b0977e93eaa58c2849f83b3c0f310992f93
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Paralel uzman hatları, bir Gateway'in farklı sohbetleri veya odaları
farklı ajanlara yönlendirmesini sağlar ve kullanıcı deneyimini hızlı tutar.
İşin püf noktası, paralelliği yalnızca "daha fazla ajan" olarak değil,
kıt kaynak tasarımı problemi olarak ele almaktır.

## İlk ilkeler

Bir uzman hattı, yalnızca gerçek darboğazlar üzerindeki çekişmeyi azalttığında
iş hacmini iyileştirir:

- **Oturum kilitleri**: belirli bir oturumu aynı anda yalnızca bir çalıştırma değiştirmelidir.
- **Küresel model kapasitesi**: tüm görünür sohbet çalıştırmaları yine de sağlayıcı sınırlarını paylaşır.
- **Araç kapasitesi**: kabuk, tarayıcı, ağ ve depo işleri model turunun kendisinden
  daha yavaş olabilir.
- **Bağlam bütçesi**: uzun konuşma dökümleri gelecekteki her turu daha yavaş ve daha az
  odaklı hale getirir.
- **Sahiplik belirsizliği**: aynı işi yapan yinelenen ajanlar kapasiteyi boşa harcar.

OpenClaw zaten çalıştırmaları oturum başına serileştirir ve küresel paralelliği
[komut kuyruğu](/tr/concepts/queue) üzerinden sınırlar. Uzman hatları bunun üzerine politika ekler:
hangi ajanın hangi işin sahibi olduğu, sohbette neyin kalacağı ve neyin arka plan
işine dönüşeceği.

## Önerilen dağıtım

### Aşama 1: hat sözleşmeleri + arka planda ağır iş

Her hatta, çalışma alanında ve sistem isteminde yazılı bir sözleşme verin:

- **Amaç**: bu hattın sahibi olduğu iş.
- **Hedef dışı olanlar**: denemek yerine devretmesi gereken işler.
- **Sohbet bütçesi**: hızlı yanıtlar sohbette kalır; uzun görevler kısaca onaylanmalı,
  ardından arka planda bir alt ajan veya görev olarak çalıştırılmalıdır.
- **Devir kuralı**: başka bir hat işin sahibiyse, nereye gitmesi gerektiğini söyleyin ve
  kısa bir devir özeti sağlayın.
- **Araç riski kuralı**: işi yapabilecek en küçük araç yüzeyini tercih edin.

Bu en ucuz aşamadır ve çoğu tıkanmayı düzeltir: bir kodlama işi artık araştırma
hattını ağırlaştırmaz ve her sohbet kendi bağlamını temiz tutar.

### Aşama 2: öncelik ve eşzamanlılık kontrolleri

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

Yüksek öncelikli işler için doğrudan/kişisel sohbetleri ve üretim operasyonları ajanlarını kullanın. Sistem
meşgulken araştırma, taslak hazırlama ve toplu kodlamanın arka plan görevlerine taşınmasına izin verin.

### Aşama 3: koordinatör / trafik denetleyicisi

Birden fazla hat etkin olduğunda küçük bir koordinatör deseni ekleyin:

- Etkin hat görevlerini ve sahiplerini izleyin.
- Gruplar arasında yinelenen istekleri tespit edin.
- Hatlar arasında devir özetlerini yönlendirin.
- Yalnızca engelleyicileri, tamamlanan sonuçları ve insanın vermesi gereken kararları yüzeye çıkarın.

Buradan başlamayın. Hat sözleşmeleri olmayan bir koordinatör yalnızca kaosu koordine eder.

## En küçük hat sözleşmesi şablonu

```md
# Hat sözleşmesi

## Sahibi olduğu işler

- <bu hattın sorumlu olduğu iş>

## Sahibi olmadığı işler

- <devredilecek iş>

## Sohbet bütçesi

- Hızlı soruları doğrudan yanıtlayın.
- Çok adımlı, yavaş veya araç ağırlıklı işler için: kısaca onaylayın, işi başlatın/arka plana alın,
  ardından tamamlandığında sonucu döndürün.

## Devir

İsteğin sahibi başka bir hatsa, şunlarla yanıt verin:

- hedef hat
- amaç
- ilgili bağlam
- tam sonraki eylem

## Araç tutumu

Görevi tamamlayabilecek en küçük araç yüzeyini kullanın. Bu hat açıkça sahibi olmadığı sürece geniş kabuk veya
ağ işlerinden kaçının.
```

## İlgili

- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Komut kuyruğu](/tr/concepts/queue)
- [Alt ajanlar](/tr/tools/subagents)
