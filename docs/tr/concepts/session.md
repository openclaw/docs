---
read_when:
    - Oturum yönlendirmesini ve yalıtımını anlamak istiyorsunuz
    - Çok kullanıcılı kurulumlar için DM kapsamını yapılandırmak istiyorsunuz
    - Günlük veya boşta kalma kaynaklı oturum sıfırlamalarında hata ayıklıyorsunuz
summary: OpenClaw konuşma oturumlarını nasıl yönetir
title: Oturum yönetimi
x-i18n:
    generated_at: "2026-04-30T09:18:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bbb8f8fddf8ac942bc24b8b94a6464ec31d0aee035bf367726d2112269095f4
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw konuşmaları **oturumlar** halinde düzenler. Her mesaj, nereden geldiğine göre bir
oturuma yönlendirilir: DM'ler, grup sohbetleri, cron işleri vb.

## Mesajlar nasıl yönlendirilir

| Kaynak          | Davranış                  |
| --------------- | ------------------------- |
| Doğrudan mesajlar | Varsayılan olarak paylaşılan oturum |
| Grup sohbetleri | Grup başına izole edilir |
| Odalar/kanallar | Oda başına izole edilir |
| Cron işleri     | Her çalıştırmada yeni oturum |
| Webhook'lar     | Hook başına izole edilir |

## DM izolasyonu

Varsayılan olarak, süreklilik için tüm DM'ler tek bir oturumu paylaşır. Bu,
tek kullanıcılı kurulumlar için uygundur.

<Warning>
Birden fazla kişi aracınıza mesaj gönderebiliyorsa DM izolasyonunu etkinleştirin. Aksi halde tüm
kullanıcılar aynı konuşma bağlamını paylaşır; Alice'in özel mesajları Bob tarafından
görülebilir.
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
- `per-peer` -- gönderene göre izole eder (kanallar arasında).
- `per-channel-peer` -- kanal + gönderene göre izole eder (önerilir).
- `per-account-channel-peer` -- hesap + kanal + gönderene göre izole eder.

<Tip>
Aynı kişi size birden fazla kanaldan ulaşıyorsa, kimliklerini bağlamak için
`session.identityLinks` kullanın; böylece tek bir oturumu paylaşırlar.
</Tip>

### Bağlı kanalları kenetleme

Dock komutları, kullanıcının mevcut doğrudan sohbet oturumunun yanıt rotasını,
yeni bir oturum başlatmadan başka bir bağlı kanala taşımasını sağlar. Örnekler, yapılandırma ve
sorun giderme için [Kanal kenetleme](/tr/concepts/channel-docking) bölümüne bakın.

Kurulumunuzu `openclaw security audit` ile doğrulayın.

## Oturum yaşam döngüsü

Oturumlar süresi dolana kadar yeniden kullanılır:

- **Günlük sıfırlama** (varsayılan) -- Gateway ana makinesinde yerel saatle 04:00'te yeni oturum.
  Günlük yenilik, daha sonraki meta veri yazımlarına değil, mevcut `sessionId` değerinin
  ne zaman başladığına dayanır.
- **Boşta sıfırlama** (isteğe bağlı) -- bir hareketsizlik süresinden sonra yeni oturum. 
  `session.reset.idleMinutes` ayarlayın. Boşta kalma yeniliği son gerçek
  kullanıcı/kanal etkileşimine dayanır; bu nedenle heartbeat, cron ve exec sistem olayları
  oturumu canlı tutmaz.
- **Manuel sıfırlama** -- sohbette `/new` veya `/reset` yazın. `/new <model>` ayrıca
  modeli değiştirir.

Hem günlük hem de boşta sıfırlamalar yapılandırıldığında, hangisinin süresi önce dolarsa o geçerli olur.
Heartbeat, cron, exec ve diğer sistem olayı dönüşleri oturum meta verisi yazabilir,
ancak bu yazımlar günlük veya boşta sıfırlama yeniliğini uzatmaz. Bir sıfırlama
oturumu devrettiğinde, eski oturum için sıraya alınmış sistem olayı bildirimleri
atılır; böylece eski arka plan güncellemeleri yeni oturumdaki ilk istemin başına eklenmez.

Etkin, sağlayıcıya ait bir CLI oturumu olan oturumlar örtük
günlük varsayılan tarafından kesilmez. Bu oturumların bir zamanlayıcıyla süresi dolmalıysa
`/reset` kullanın veya `session.reset` değerini açıkça yapılandırın.

## Durum nerede tutulur

Tüm oturum durumu **Gateway** tarafından sahiplenilir. UI istemcileri oturum verileri için Gateway'i
sorgular.

- **Depo:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Dökümler:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` ayrı yaşam döngüsü zaman damgaları tutar:

- `sessionStartedAt`: mevcut `sessionId` başladığı zaman; günlük sıfırlama bunu kullanır.
- `lastInteractionAt`: boşta kalma ömrünü uzatan son kullanıcı/kanal etkileşimi.
- `updatedAt`: son depo satırı mutasyonu; listeleme ve budama için yararlıdır, ancak
  günlük/boşta sıfırlama yeniliği için yetkili kaynak değildir.

`sessionStartedAt` içermeyen eski satırlar, mevcut olduğunda döküm JSONL
oturum başlığından çözümlenir. Eski bir satırda `lastInteractionAt` da yoksa,
boşta kalma yeniliği daha sonraki kayıt tutma yazımlarına değil, ilgili oturumun başlangıç
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

Üretim boyutundaki `maxEntries` sınırları için Gateway çalışma zamanı yazımları küçük bir üst eşik tamponu kullanır ve toplu işlemlerle yapılandırılmış sınıra geri temizler. Bu, her izole cron oturumunda tam depo temizliği çalıştırmayı önler. `openclaw sessions cleanup --enforce` sınırı hemen uygular.

`openclaw sessions cleanup --dry-run` ile önizleyin.

## Oturumları inceleme

- `openclaw status` -- oturum deposu yolu ve son etkinlik.
- `openclaw sessions --json` -- tüm oturumlar (`--active <minutes>` ile filtreleyin).
- Sohbette `/status` -- bağlam kullanımı, model ve geçişler.
- `/context list` -- sistem isteminde nelerin olduğu.

## Daha fazla okuma

- [Oturum budama](/tr/concepts/session-pruning) -- araç sonuçlarını kırpma
- [Compaction](/tr/concepts/compaction) -- uzun konuşmaları özetleme
- [Oturum araçları](/tr/concepts/session-tool) -- oturumlar arası çalışma için aracı araçları
- [Oturum Yönetimi Derinlemesine İnceleme](/tr/reference/session-management-compaction) --
  depo şeması, dökümler, gönderme ilkesi, kaynak meta verileri ve gelişmiş yapılandırma
- [Çoklu aracı](/tr/concepts/multi-agent) — aracılar arasında yönlendirme ve oturum izolasyonu
- [Arka Plan Görevleri](/tr/automation/tasks) — ayrılmış çalışmanın oturum referanslarıyla görev kayıtları oluşturma şekli
- [Kanal Yönlendirme](/tr/channels/channel-routing) — gelen mesajların oturumlara nasıl yönlendirildiği

## İlgili

- [Oturum budama](/tr/concepts/session-pruning)
- [Oturum araçları](/tr/concepts/session-tool)
- [Komut kuyruğu](/tr/concepts/queue)
