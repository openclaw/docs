---
read_when:
    - Oturum yönlendirmesini ve yalıtımı anlamak istiyorsunuz
    - Çok kullanıcılı kurulumlar için DM kapsamını yapılandırmak istiyorsunuz
    - Günlük veya boşta oturum sıfırlamalarında hata ayıklıyorsunuz
summary: OpenClaw konuşma oturumlarını nasıl yönetir
title: Oturum yönetimi
x-i18n:
    generated_at: "2026-06-28T00:31:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw konuşmaları **oturumlar** halinde düzenler. Her ileti, geldiği yere göre bir
oturuma yönlendirilir -- DM'ler, grup sohbetleri, cron işleri vb.

## İletiler nasıl yönlendirilir

| Kaynak          | Davranış                  |
| --------------- | ------------------------- |
| Doğrudan iletiler | Varsayılan olarak paylaşılan oturum |
| Grup sohbetleri | Grup başına yalıtılmış        |
| Odalar/kanallar  | Oda başına yalıtılmış         |
| Cron işleri       | Her çalıştırmada yeni oturum     |
| Webhook'lar        | Hook başına yalıtılmış         |

## DM yalıtımı

Varsayılan olarak, süreklilik için tüm DM'ler tek bir oturumu paylaşır. Bu,
tek kullanıcılı kurulumlar için uygundur.

<Warning>
Birden fazla kişi agent'ınıza ileti gönderebiliyorsa DM yalıtımını etkinleştirin. Bu olmadan, tüm
kullanıcılar aynı konuşma bağlamını paylaşır -- Alice'in özel iletileri Bob tarafından
görülebilir olur.
</Warning>

**Düzeltme:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // kanala + gönderene göre yalıt
  },
}
```

Diğer seçenekler:

- `main` (varsayılan) -- tüm DM'ler tek bir oturumu paylaşır.
- `per-peer` -- gönderene göre yalıt (kanallar arasında).
- `per-channel-peer` -- kanala + gönderene göre yalıt (önerilir).
- `per-account-channel-peer` -- hesaba + kanala + gönderene göre yalıt.

<Tip>
Aynı kişi size birden fazla kanaldan ulaşıyorsa, kimliklerini bağlamak için
`session.identityLinks` kullanın; böylece tek bir oturumu paylaşırlar.
</Tip>

### Bağlı kanalları dock etme

Dock komutları, kullanıcının geçerli doğrudan sohbet oturumunun yanıt rotasını
yeni bir oturum başlatmadan başka bir bağlı kanala taşımasına olanak tanır. Örnekler, yapılandırma ve
sorun giderme için [Kanal docking](/tr/concepts/channel-docking) bölümüne bakın.

Kurulumunuzu `openclaw security audit` ile doğrulayın.

## Oturum yaşam döngüsü

Oturumlar süresi dolana kadar yeniden kullanılır:

- **Günlük sıfırlama** (varsayılan) -- gateway
  host'unda yerel saatle 04:00'te yeni oturum. Günlük tazelik, sonraki metadata yazmalarına değil,
  geçerli `sessionId` başladığı zamana dayanır.
- **Boşta sıfırlama** (isteğe bağlı) -- belirli bir hareketsizlik süresinden sonra yeni oturum. 
  `session.reset.idleMinutes` değerini ayarlayın. Boşta tazelik, son gerçek
  kullanıcı/kanal etkileşimine dayanır; bu nedenle Heartbeat, cron ve exec sistem olayları
  oturumu canlı tutmaz.
- **Manuel sıfırlama** -- sohbette `/new` veya `/reset` yazın. `/new <model>` ayrıca
  modeli değiştirir.

Hem günlük hem de boşta sıfırlamalar yapılandırıldığında, hangisinin süresi önce dolarsa o geçerli olur.
Heartbeat, cron, exec ve diğer sistem olayı dönüşleri oturum metadata'sı yazabilir,
ancak bu yazmalar günlük veya boşta sıfırlama tazeliğini uzatmaz. Bir sıfırlama
oturumu değiştirdiğinde, eski oturum için kuyruğa alınmış sistem olayı bildirimleri
atılır; böylece bayat arka plan güncellemeleri yeni oturumdaki ilk prompt'un
başına eklenmez.

Etkin, sağlayıcıya ait bir CLI oturumu bulunan oturumlar örtük
günlük varsayılan tarafından kesilmez. Bu oturumların bir zamanlayıcıyla
süresinin dolması gerektiğinde `/reset` kullanın veya `session.reset` değerini açıkça yapılandırın.

## Durumun yaşadığı yer

Tüm oturum durumu **gateway** tarafından sahiplenilir. UI istemcileri oturum verileri için gateway'i
sorgular.

- **Depo:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkriptler:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` ayrı yaşam döngüsü zaman damgaları tutar:

- `sessionStartedAt`: geçerli `sessionId` başladığı zaman; günlük sıfırlama bunu kullanır.
- `lastInteractionAt`: boşta kalma ömrünü uzatan son kullanıcı/kanal etkileşimi.
- `updatedAt`: son depo satırı mutasyonu; listeleme ve budama için yararlıdır, ancak
  günlük/boşta sıfırlama tazeliği için yetkili kaynak değildir.

`sessionStartedAt` içermeyen eski satırlar, mevcut olduğunda transkript JSONL
oturum başlığından çözümlenir. Eski bir satırda `lastInteractionAt` da yoksa,
boşta tazelik sonraki defter tutma yazmalarına değil, o oturum başlangıç zamanına
geri döner.

## Oturum bakımı

OpenClaw zaman içinde oturum depolamasını otomatik olarak sınırlar. Varsayılan olarak
`enforce` modunda çalışır ve bakım sırasında temizleme uygular. Depoyu/dosyaları değiştirmeden neyin temizleneceğini raporlamak için
`session.maintenance.mode` değerini `"warn"` olarak ayarlayın:

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

Üretim boyutundaki `maxEntries` sınırları için Gateway runtime yazmaları küçük bir üst sınır tamponu kullanır ve toplu işlemler halinde yapılandırılmış limite geri temizler. Oturum deposu okumaları Gateway başlangıcı sırasında girişleri budamaz veya sınırlamaz. Bu, her başlangıçta ya da yalıtılmış cron oturumunda tam depo temizliği çalıştırmayı önler. `openclaw sessions cleanup --enforce` sınırı hemen uygular.

Gateway model çalıştırma probe oturumları varsayılan olarak kısa ömürlüdür. 
`agent:*:explicit:model-run-<uuid>` gibi katı açık anahtarlarla eşleşen satırlar sabit `24h`
saklama kullanır, ancak temizleme baskıya bağlıdır: bayat probe satırlarını yalnızca
oturum girişi bakım/sınır baskısına ulaşıldığında kaldırır. Model çalıştırma temizliği çalıştığında,
daha geniş bayat giriş yaş eşiğinden ve giriş sınırından önce çalışır. Normal doğrudan,
grup, iş parçacığı, cron, hook, Heartbeat, ACP ve alt agent oturumları
bu 24h saklamayı devralmaz.

Bakım, grup oturumları ve iş parçacığı kapsamlı sohbet oturumları dahil olmak üzere
dayanıklı dış konuşma işaretçilerini korurken, sentetik cron,
hook, Heartbeat, ACP ve alt agent girişlerinin yaşlanarak silinmesine yine de izin verir.

Daha önce doğrudan ileti yalıtımı kullandıysanız ve sonra
`session.dmScope` değerini `main` olarak geri döndürdüyseniz, bayat peer anahtarlı DM satırlarını
`openclaw sessions cleanup --dry-run --fix-dm-scope` ile önizleyin. Aynı bayrağı uygulamak
bu eski doğrudan DM satırlarını emekliye ayırır ve transkriptlerini silinmiş
arşivler olarak tutar.

`openclaw sessions cleanup --dry-run` ile önizleyin.

## Oturumları inceleme

- `openclaw status` -- oturum deposu yolu ve son etkinlik.
- `openclaw sessions --json` -- tüm oturumlar (`--active <minutes>` ile filtreleyin).
- Sohbette `/status` -- bağlam kullanımı, model ve geçişler.
- `/context list` -- sistem prompt'unda neler var.

## Daha fazla okuma

- [Oturum Budama](/tr/concepts/session-pruning) -- araç sonuçlarını kırpma
- [Compaction](/tr/concepts/compaction) -- uzun konuşmaları özetleme
- [Oturum Araçları](/tr/concepts/session-tool) -- oturumlar arası çalışma için agent araçları
- [Oturum Yönetimi Derinlemesine İnceleme](/tr/reference/session-management-compaction) --
  depo şeması, transkriptler, gönderim politikası, origin metadata'sı ve gelişmiş yapılandırma
- [Çoklu Agent](/tr/concepts/multi-agent) — agent'lar arasında yönlendirme ve oturum yalıtımı
- [Arka Plan Görevleri](/tr/automation/tasks) — ayrılmış çalışmanın oturum referanslarıyla görev kayıtlarını nasıl oluşturduğu
- [Kanal Yönlendirme](/tr/channels/channel-routing) — gelen iletilerin oturumlara nasıl yönlendirildiği

## İlgili

- [Oturum budama](/tr/concepts/session-pruning)
- [Oturum araçları](/tr/concepts/session-tool)
- [Komut kuyruğu](/tr/concepts/queue)
