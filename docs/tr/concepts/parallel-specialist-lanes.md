---
read_when:
    - Grup sohbetlerini özel ajanlara yönlendirirsiniz
    - Tek bir uzun görevin her sohbeti engellemediği paralel çalışma istiyorsunuz
    - Çok ajanlı bir operasyon kurulumu tasarlıyorsunuz
sidebarTitle: Specialist lanes
status: active
summary: Paylaşılan model ve araç kapasitesini tıkamadan paralel uzman aracıları çalıştırın
title: Paralel uzmanlık hatları
x-i18n:
    generated_at: "2026-05-02T20:44:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09f10ce4fbd79954a7196fbedb23f9b3f34b459b98eb7a5480f7eeb0bb6be98
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Paralel uzman kulvarlar, bir Gateway’in farklı sohbetleri veya odaları farklı ajanlara yönlendirmesine olanak tanırken kullanıcı deneyimini hızlı tutar. Buradaki püf nokta, paralelliği sadece "daha fazla ajan" olarak değil, kıt kaynaklara yönelik bir tasarım problemi olarak ele almaktır.

## Temel ilkeler

Bir uzman kulvarı, yalnızca gerçek darboğazlar üzerindeki çekişmeyi azalttığında iş hacmini artırır:

- **Oturum kilitleri**: belirli bir oturumu aynı anda yalnızca bir çalıştırma değiştirmelidir.
- **Küresel model kapasitesi**: görünür tüm sohbet çalıştırmaları hâlâ sağlayıcı limitlerini paylaşır.
- **Araç kapasitesi**: kabuk, tarayıcı, ağ ve depo işleri model turunun kendisinden daha yavaş olabilir.
- **Bağlam bütçesi**: uzun konuşma dökümleri gelecekteki her turu daha yavaş ve daha az odaklı hâle getirir.
- **Sahiplik belirsizliği**: aynı işi yapan yinelenen ajanlar kapasiteyi boşa harcar.

OpenClaw zaten oturum başına çalıştırmaları serileştirir ve küresel paralelliği [komut kuyruğu](/tr/concepts/queue) üzerinden sınırlar. Uzman kulvarlar bunun üzerine politika ekler: hangi ajanın hangi işe sahip olduğu, sohbette neyin kalacağı ve neyin arka plan işi olacağı.

## Önerilen dağıtım

### 1. Aşama: kulvar sözleşmeleri + arka planda ağır işler

Her kulvara çalışma alanında ve sistem isteminde yazılı bir sözleşme verin:

- **Amaç**: bu kulvarın sahip olduğu iş.
- **Hedef dışı konular**: denemek yerine devretmesi gereken işler.
- **Sohbet bütçesi**: hızlı yanıtlar sohbette kalır; uzun görevler kısa bir kabul mesajı vermeli, ardından arka plan alt ajanı veya görevinde çalışmalıdır.
- **Devretme kuralı**: iş başka bir kulvara ait olduğunda nereye gitmesi gerektiğini söyleyin ve kompakt bir devretme özeti sağlayın.
- **Araç riski kuralı**: işi yapabilecek en küçük araç yüzeyini tercih edin.

Bu en düşük maliyetli aşamadır ve tıkanmaların çoğunu giderir: tek bir kodlama işi artık araştırma kulvarını pekmeze çevirmez ve her sohbet kendi bağlamını temiz tutar.

### 2. Aşama: öncelik ve eşzamanlılık denetimleri

Kuyruk ve model kapasitesini her kulvarın iş değeri etrafında ayarlayın:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
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

Yüksek öncelikli işler için doğrudan/kişisel sohbetleri ve üretim operasyonları ajanlarını kullanın. Sistem meşgul olduğunda araştırma, taslak hazırlama ve toplu kodlama arka plan görevlerine taşınsın.

### 3. Aşama: koordinatör / trafik denetleyicisi

Birden çok kulvar aktif olduğunda küçük bir koordinatör deseni ekleyin:

- Etkin kulvar görevlerini ve sahiplerini izleyin.
- Gruplar arasındaki yinelenen istekleri tespit edin.
- Devretme özetlerini kulvarlar arasında yönlendirin.
- Yalnızca engelleyicileri, tamamlanan sonuçları ve insanın vermesi gereken kararları görünür hâle getirin.

Buradan başlamayın. Kulvar sözleşmeleri olmayan bir koordinatör yalnızca kaosu koordine eder.

## En küçük kulvar sözleşmesi şablonu

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## İlgili

- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Komut kuyruğu](/tr/concepts/queue)
- [Alt ajanlar](/tr/tools/subagents)
