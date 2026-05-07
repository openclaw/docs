---
read_when:
    - Oturum yönlendirmesini ve yalıtımını anlamak istiyorsunuz
    - Çok kullanıcılı kurulumlar için DM kapsamını yapılandırmak istiyorsunuz
    - Günlük veya boşta kalmaya bağlı oturum sıfırlamalarında hata ayıklıyorsunuz
summary: OpenClaw konuşma oturumlarını nasıl yönetir
title: Oturum yönetimi
x-i18n:
    generated_at: "2026-05-07T13:15:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e5ec741a33262ce5c42caf021ad81892e89b3315db31ac7b141d5a13e8b22a2
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw konuşmaları **oturumlar** halinde düzenler. Her mesaj, geldiği yere göre bir
oturuma yönlendirilir -- DM'ler, grup sohbetleri, cron işleri vb.

## Mesajlar nasıl yönlendirilir

| Kaynak             | Davranış                         |
| ------------------ | -------------------------------- |
| Doğrudan mesajlar  | Varsayılan olarak paylaşılan oturum |
| Grup sohbetleri    | Grup başına yalıtılmış           |
| Odalar/kanallar    | Oda başına yalıtılmış            |
| Cron işleri        | Her çalıştırmada yeni oturum     |
| Webhook'lar        | Hook başına yalıtılmış           |

## DM yalıtımı

Varsayılan olarak, süreklilik için tüm DM'ler tek bir oturumu paylaşır. Bu,
tek kullanıcılı kurulumlar için uygundur.

<Warning>
Birden fazla kişi ajanınıza mesaj gönderebiliyorsa DM yalıtımını etkinleştirin. Bu olmadan tüm
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
- `per-peer` -- gönderene göre yalıt (kanallar arasında).
- `per-channel-peer` -- kanala + gönderene göre yalıt (önerilir).
- `per-account-channel-peer` -- hesaba + kanala + gönderene göre yalıt.

<Tip>
Aynı kişi sizinle birden fazla kanaldan iletişime geçiyorsa, kimliklerini bağlamak
ve tek bir oturumu paylaşmalarını sağlamak için `session.identityLinks` kullanın.
</Tip>

### Bağlı kanalları yerleştirme

Dock komutları, kullanıcının yeni bir oturum başlatmadan mevcut doğrudan sohbet
oturumunun yanıt rotasını başka bir bağlı kanala taşımasına izin verir. Örnekler,
yapılandırma ve sorun giderme için [Kanal yerleştirme](/tr/concepts/channel-docking)
bölümüne bakın.

Kurulumunuzu `openclaw security audit` ile doğrulayın.

## Oturum yaşam döngüsü

Oturumlar süreleri dolana kadar yeniden kullanılır:

- **Günlük sıfırlama** (varsayılan) -- Gateway ana makinesindeki yerel saatle
  04:00'te yeni oturum. Günlük yenilik, daha sonraki metadata yazımlarına değil,
  mevcut `sessionId` değerinin başladığı zamana dayanır.
- **Boşta sıfırlama** (isteğe bağlı) -- bir hareketsizlik süresinden sonra yeni oturum. 
  `session.reset.idleMinutes` değerini ayarlayın. Boşta yenilik, son gerçek
  kullanıcı/kanal etkileşimine dayanır; bu nedenle heartbeat, cron ve exec sistem olayları
  oturumu canlı tutmaz.
- **Manuel sıfırlama** -- sohbette `/new` veya `/reset` yazın. `/new <model>` ayrıca
  modeli değiştirir.

Hem günlük hem de boşta sıfırlamalar yapılandırıldığında, önce hangisinin süresi dolarsa
o uygulanır. Heartbeat, cron, exec ve diğer sistem olayı turları oturum metadata'sı yazabilir,
ancak bu yazımlar günlük veya boşta sıfırlama yeniliğini uzatmaz. Bir sıfırlama
oturumu değiştirdiğinde, eski oturum için kuyruğa alınmış sistem olayı bildirimleri
atılır; böylece eski arka plan güncellemeleri yeni oturumdaki ilk istemin başına eklenmez.

Etkin, sağlayıcıya ait CLI oturumu olan oturumlar örtük günlük varsayılan tarafından
kesilmez. Bu oturumların bir zamanlayıcıyla süresinin dolması gerektiğinde `/reset` kullanın
veya `session.reset` değerini açıkça yapılandırın.

## Durum nerede tutulur

Tüm oturum durumu **Gateway** tarafından sahiplenilir. UI istemcileri oturum verileri için
Gateway'i sorgular.

- **Depo:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Dökümler:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` ayrı yaşam döngüsü zaman damgaları tutar:

- `sessionStartedAt`: mevcut `sessionId` değerinin başladığı zaman; günlük sıfırlama bunu kullanır.
- `lastInteractionAt`: boşta yaşam süresini uzatan son kullanıcı/kanal etkileşimi.
- `updatedAt`: son depo satırı değişikliği; listeleme ve budama için kullanışlıdır, ancak
  günlük/boşta sıfırlama yeniliği için yetkili değildir.

`sessionStartedAt` içermeyen eski satırlar, varsa transcript JSONL oturum başlığından
çözümlenir. Daha eski bir satırda `lastInteractionAt` da yoksa,
boşta yenilik, daha sonraki kayıt tutma yazımlarına değil, o oturum başlangıç zamanına
geri döner.

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

Üretim boyutundaki `maxEntries` sınırları için Gateway runtime yazımları küçük bir yüksek su işareti tamponu kullanır ve toplu işlemler halinde yapılandırılmış sınıra geri temizler. Oturum deposu okumaları Gateway başlangıcı sırasında girdileri budamaz veya sınırlamaz. Bu, her başlangıçta veya yalıtılmış cron oturumunda tam depo temizliği çalıştırmayı önler. `openclaw sessions cleanup --enforce` sınırı hemen uygular.

Bakım, grup oturumları ve thread kapsamlı sohbet oturumları dahil dayanıklı harici
konuşma işaretçilerini korurken, sentetik cron, hook, heartbeat, ACP ve alt ajan girdilerinin
zamanla eskimesine yine de izin verir.

Daha önce doğrudan mesaj yalıtımı kullandıysanız ve daha sonra `session.dmScope`
değerini `main` değerine döndürdüyseniz, eski peer anahtarlı DM satırlarını
`openclaw sessions cleanup --dry-run --fix-dm-scope` ile önizleyin. Aynı flag uygulandığında
bu eski doğrudan DM satırları emekliye ayrılır ve transcript'leri silinmiş
arşivler olarak tutulur.

`openclaw sessions cleanup --dry-run` ile önizleyin.

## Oturumları inceleme

- `openclaw status` -- oturum deposu yolu ve son etkinlik.
- `openclaw sessions --json` -- tüm oturumlar (`--active <minutes>` ile filtreleyin).
- Sohbette `/status` -- bağlam kullanımı, model ve geçişler.
- `/context list` -- sistem isteminde ne olduğu.

## Daha fazla okuma

- [Oturum Budama](/tr/concepts/session-pruning) -- araç sonuçlarını kırpma
- [Compaction](/tr/concepts/compaction) -- uzun konuşmaları özetleme
- [Oturum Araçları](/tr/concepts/session-tool) -- oturumlar arası çalışma için ajan araçları
- [Oturum Yönetimi Derinlemesine İnceleme](/tr/reference/session-management-compaction) --
  depo şeması, transcript'ler, gönderim ilkesi, kaynak metadata'sı ve gelişmiş yapılandırma
- [Çoklu Ajan](/tr/concepts/multi-agent) — ajanlar arasında yönlendirme ve oturum yalıtımı
- [Arka Plan Görevleri](/tr/automation/tasks) — ayrılmış çalışmanın oturum referanslarıyla görev kayıtlarını nasıl oluşturduğu
- [Kanal Yönlendirme](/tr/channels/channel-routing) — gelen mesajların oturumlara nasıl yönlendirildiği

## İlgili

- [Oturum budama](/tr/concepts/session-pruning)
- [Oturum araçları](/tr/concepts/session-tool)
- [Komut kuyruğu](/tr/concepts/queue)
