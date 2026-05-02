---
read_when:
    - Oturum yönlendirmeyi ve yalıtımı anlamak istiyorsunuz
    - Çok kullanıcılı kurulumlar için DM kapsamını yapılandırmak istiyorsunuz
    - Günlük veya boşta kalma kaynaklı oturum sıfırlamalarında hata ayıklıyorsunuz
summary: OpenClaw konuşma oturumlarını nasıl yönetir
title: Oturum yönetimi
x-i18n:
    generated_at: "2026-05-02T08:53:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2fd0c9e880242a8d0070c24bd1f7971e4082344240e28632e2e3ca032404807
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw konuşmaları **oturumlar** halinde düzenler. Her mesaj, geldiği yere göre bir
oturuma yönlendirilir -- DM'ler, grup sohbetleri, Cron işleri vb.

## Mesajlar nasıl yönlendirilir

| Kaynak             | Davranış                                |
| ------------------ | --------------------------------------- |
| Doğrudan mesajlar  | Varsayılan olarak paylaşılan oturum     |
| Grup sohbetleri    | Grup başına yalıtılmış                  |
| Odalar/kanallar    | Oda başına yalıtılmış                   |
| Cron işleri        | Her çalıştırmada yeni oturum            |
| Webhook'lar        | Hook başına yalıtılmış                  |

## DM yalıtımı

Varsayılan olarak, süreklilik için tüm DM'ler tek bir oturumu paylaşır. Bu,
tek kullanıcılı kurulumlar için uygundur.

<Warning>
Birden fazla kişi ajanınıza mesaj gönderebiliyorsa DM yalıtımını etkinleştirin. Aksi halde tüm
kullanıcılar aynı konuşma bağlamını paylaşır -- Alice'in özel mesajları
Bob tarafından görülebilir.
</Warning>

**Düzeltme:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Diğer seçenekler:

- `main` (varsayılan) -- tüm DM'ler tek bir oturumu paylaşır.
- `per-peer` -- gönderene göre yalıtır (kanallar arasında).
- `per-channel-peer` -- kanal + gönderene göre yalıtır (önerilir).
- `per-account-channel-peer` -- hesap + kanal + gönderene göre yalıtır.

<Tip>
Aynı kişi sizinle birden çok kanaldan iletişime geçiyorsa, kimliklerini bağlamak için
`session.identityLinks` kullanın; böylece tek bir oturumu paylaşırlar.
</Tip>

### Bağlı kanalları dock etme

Dock komutları, kullanıcının mevcut doğrudan sohbet oturumunun yanıt rotasını
yeni bir oturum başlatmadan başka bir bağlı kanala taşımasına olanak tanır. Örnekler, yapılandırma ve
sorun giderme için [Kanal dock etme](/tr/concepts/channel-docking) bölümüne bakın.

Kurulumunuzu `openclaw security audit` ile doğrulayın.

## Oturum yaşam döngüsü

Oturumlar süresi dolana kadar yeniden kullanılır:

- **Günlük sıfırlama** (varsayılan) -- Gateway
  ana makinesinde yerel saatle 04:00'te yeni oturum. Günlük güncellik, daha sonraki
  meta veri yazımlarına değil, mevcut `sessionId` değerinin ne zaman başladığına dayanır.
- **Boşta sıfırlama** (isteğe bağlı) -- bir süre etkinlik olmadığında yeni oturum. `session.reset.idleMinutes` ayarını belirleyin. Boşta güncellik, son gerçek
  kullanıcı/kanal etkileşimine dayanır; bu nedenle Heartbeat, Cron ve exec sistem olayları
  oturumu canlı tutmaz.
- **Manuel sıfırlama** -- sohbette `/new` veya `/reset` yazın. `/new <model>` ayrıca
  modeli de değiştirir.

Hem günlük hem de boşta sıfırlamalar yapılandırıldığında, hangisinin süresi önce dolarsa o geçerli olur.
Heartbeat, Cron, exec ve diğer sistem olayı dönüşleri oturum meta verisi yazabilir,
ancak bu yazımlar günlük veya boşta sıfırlama güncelliğini uzatmaz. Bir sıfırlama
oturumu devrettiğinde, eski oturum için sıraya alınmış sistem olayı bildirimleri
atılır; böylece eski arka plan güncellemeleri yeni oturumdaki ilk promptun başına
eklenmez.

Etkin ve sağlayıcıya ait bir CLI oturumu olan oturumlar, örtük
günlük varsayılan tarafından kesilmez. Bu oturumların bir zamanlayıcıyla sona ermesi gerektiğinde
`/reset` kullanın veya `session.reset` ayarını açıkça yapılandırın.

## Durumun bulunduğu yer

Tüm oturum durumu **Gateway** tarafından sahiplenilir. UI istemcileri oturum verileri için Gateway'i
sorgular.

- **Depo:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkriptler:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` ayrı yaşam döngüsü zaman damgaları tutar:

- `sessionStartedAt`: mevcut `sessionId` başladığında; günlük sıfırlama bunu kullanır.
- `lastInteractionAt`: boşta kalma ömrünü uzatan son kullanıcı/kanal etkileşimi.
- `updatedAt`: son depo satırı mutasyonu; listeleme ve budama için yararlıdır, ancak
  günlük/boşta sıfırlama güncelliği için yetkili kaynak değildir.

`sessionStartedAt` içermeyen eski satırlar, kullanılabilir olduğunda transkript JSONL
oturum başlığından çözümlenir. Eski bir satırda `lastInteractionAt` da yoksa,
boşta güncellik daha sonraki defter tutma yazımlarına değil, o oturumun başlangıç
zamanına geri döner.

## Oturum bakımı

OpenClaw zaman içinde oturum depolamasını otomatik olarak sınırlar. Varsayılan olarak
`warn` modunda çalışır (neyin temizleneceğini raporlar). Otomatik temizlik için
`session.maintenance.mode` değerini `"enforce"` olarak ayarlayın:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Üretim ölçeğindeki `maxEntries` sınırları için Gateway çalışma zamanı yazımları küçük bir üst sınır tamponu kullanır ve gruplar halinde yapılandırılmış sınıra geri temizler. Oturum deposu okumaları Gateway başlatılması sırasında girdileri budamaz veya sınırlamaz. Bu, her başlatmada ya da yalıtılmış Cron oturumunda tam depo temizliği çalıştırmayı önler. `openclaw sessions cleanup --enforce` sınırı hemen uygular.

Bakım, grup oturumları ve iş parçacığı kapsamlı sohbet oturumları dahil olmak üzere dayanıklı harici konuşma işaretçilerini korurken, sentetik Cron,
hook, Heartbeat, ACP ve alt ajan girdilerinin eskimesine yine de izin verir.

`openclaw sessions cleanup --dry-run` ile önizleyin.

## Oturumları inceleme

- `openclaw status` -- oturum deposu yolu ve son etkinlik.
- `openclaw sessions --json` -- tüm oturumlar (`--active <minutes>` ile filtreleyin).
- Sohbette `/status` -- bağlam kullanımı, model ve geçişler.
- `/context list` -- sistem promptunda ne olduğu.

## Daha fazla okuma

- [Oturum Budama](/tr/concepts/session-pruning) -- araç sonuçlarını kırpma
- [Compaction](/tr/concepts/compaction) -- uzun konuşmaları özetleme
- [Oturum Araçları](/tr/concepts/session-tool) -- oturumlar arası çalışma için ajan araçları
- [Oturum Yönetimi Ayrıntılı İnceleme](/tr/reference/session-management-compaction) --
  depo şeması, transkriptler, gönderme ilkesi, kaynak meta verisi ve gelişmiş yapılandırma
- [Çok Ajanlı](/tr/concepts/multi-agent) — ajanlar arasında yönlendirme ve oturum yalıtımı
- [Arka Plan Görevleri](/tr/automation/tasks) — ayrılmış çalışmanın oturum referanslarıyla görev kayıtlarını nasıl oluşturduğu
- [Kanal Yönlendirme](/tr/channels/channel-routing) — gelen mesajların oturumlara nasıl yönlendirildiği

## İlgili

- [Oturum budama](/tr/concepts/session-pruning)
- [Oturum araçları](/tr/concepts/session-tool)
- [Komut kuyruğu](/tr/concepts/queue)
