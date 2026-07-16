---
read_when:
    - Oturum yönlendirmesini ve yalıtımını anlamak istiyorsunuz
    - Çok kullanıcılı kurulumlar için DM kapsamını yapılandırmak istiyorsunuz
    - Günlük veya boşta kalma durumundaki oturum sıfırlamalarında hata ayıklıyorsunuz
summary: OpenClaw konuşma oturumlarını nasıl yönetir
title: Oturum yönetimi
x-i18n:
    generated_at: "2026-07-16T16:56:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw, gelen her mesajı geldiği yere göre bir **oturuma** yönlendirir:
DM'ler, grup sohbetleri, Cron işleri vb. Tüm oturum durumu
**Gateway** tarafından yönetilir; kullanıcı arayüzü istemcileri oturum verilerini Gateway'den sorgular.

## Mesajlar nasıl yönlendirilir

| Kaynak          | Davranış                  |
| --------------- | ------------------------- |
| Doğrudan mesajlar | Varsayılan olarak paylaşılan oturum |
| Grup sohbetleri     | Grup başına yalıtılmış        |
| Odalar/kanallar  | Oda başına yalıtılmış         |
| Cron işleri       | Her çalıştırmada yeni oturum     |
| Webhook'lar        | Webhook başına yalıtılmış         |

## DM yalıtımı

Varsayılan olarak, süreklilik için tüm DM'ler tek bir oturumu paylaşır; bu,
tek kullanıcılı kurulumlar için uygundur.

<Warning>
Birden fazla kişi agent'ınıza mesaj gönderebiliyorsa DM yalıtımını etkinleştirin. Aksi hâlde tüm
kullanıcılar aynı konuşma bağlamını paylaşır; dolayısıyla Alice'in özel mesajları
Bob tarafından görülebilir.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // kanal + gönderene göre yalıt
  },
}
```

`session.dmScope` seçenekleri:

| Değer                      | Davranış                                  |
| -------------------------- | ----------------------------------------- |
| `main` (varsayılan)           | Tüm DM'ler tek bir oturumu paylaşır                 |
| `per-peer`                 | Kanallar genelinde gönderene göre yalıt        |
| `per-channel-peer`         | Kanal + gönderene göre yalıt (önerilen) |
| `per-account-channel-peer` | Hesap + kanal + gönderene göre yalıt     |

<Tip>
Aynı kişi sizinle birden fazla kanaldan iletişim kuruyorsa kimliklerini tek bir
standart eş kimliğine eşlemek için `session.identityLinks` kullanın; böylece
aynı oturumu paylaşırlar.
</Tip>

### Bağlı kanalları bağlama

Bağlama komutları, yeni bir oturum başlatmadan mevcut doğrudan sohbet
oturumunun yanıt rotasını başka bir bağlı kanala taşır. Örnekler, yapılandırma ve
sorun giderme için [Kanal bağlama](/tr/concepts/channel-docking) bölümüne bakın.

Kurulumunuzu `openclaw security audit` ile doğrulayın.

## Oturum yaşam döngüsü

Oturumlar, `session.reset` kapsamında süreleri dolana kadar yeniden kullanılır:

- **Günlük sıfırlama** (varsayılan `mode: "daily"`) - Gateway ana makinesinde yapılandırılmış bir yerel
  saatte (`session.reset.atHour`, varsayılan `4`, 0-23) yeni oturum. Günlük
  güncellik, daha sonraki meta veri yazımlarına değil, mevcut `sessionId` öğesinin
  ne zaman başladığına dayanır.
- **Boşta kalma sıfırlaması** (`mode: "idle"`) - `session.reset.idleMinutes`
  süre boyunca etkinlik olmadığında yeni oturum. Boşta kalma güncelliği son gerçek kullanıcı/kanal
  etkileşimine dayanır; dolayısıyla Heartbeat, Cron ve exec sistem olayları
  oturumu etkin tutmaz.
- **Manuel sıfırlama** - sohbette `/new` veya `/reset` yazın. `/new <model>` ayrıca
  modeli değiştirir.

Hem günlük hem de boşta kalma sıfırlaması yapılandırıldığında, önce süresi dolan
uygulanır. Heartbeat, Cron, exec ve diğer sistem olayı turları oturum meta verilerini
yazabilir ancak bu yazımlar günlük veya boşta kalma sıfırlamasının güncelliğini uzatmaz.
Bir sıfırlama oturumu yenilediğinde eski oturum için sıraya alınmış sistem olayı bildirimleri
atılır; böylece eski arka plan güncellemeleri yeni oturumdaki ilk istemin
başına eklenmez.

Sağlayıcının yönettiği etkin bir CLI oturumuna sahip oturumlar, örtük günlük
varsayılan tarafından sonlandırılmaz. Bu oturumların zamanlayıcıyla sürelerinin dolması
gerekiyorsa `/reset` kullanın veya `session.reset` öğesini açıkça yapılandırın.

Varsayılanı sohbet türüne veya kanala göre geçersiz kılın:

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType`; `direct` (eski takma ad `dm`), `group` ve `thread` değerlerini destekler.
Eski üst düzey `session.idleMinutes`, hiçbir `session.reset`/`resetByType` bloğu ayarlanmadığında
boşta kalma modu varsayılanı için uyumluluk takma adı olarak çalışmaya devam eder.

## Durumun bulunduğu yer

- **Çalışma zamanı oturum satırları:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Arşivlenmiş transkript dosyaları:** `~/.openclaw/agents/<agentId>/sessions/`
- **Eski satır geçiş kaynağı:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Agent başına SQLite veritabanındaki oturum satırları ayrı yaşam döngüsü
zaman damgalarını tutar:

- `sessionStartedAt`: mevcut `sessionId` öğesinin başladığı zaman; günlük sıfırlama bunu kullanır.
- `lastInteractionAt`: boşta kalma ömrünü uzatan son kullanıcı/kanal etkileşimi.
- `updatedAt`: son depo satırı değişikliği; listeleme ve budama için kullanışlıdır ancak
  günlük/boşta kalma sıfırlaması güncelliği için belirleyici değildir.

Eski kurulumlardan geçiş sırasında Gateway başlangıcı ve `openclaw doctor
--fix`, eski `sessions.json` satırlarını ve etkin transkript JSONL geçmişini
otomatik olarak SQLite'a aktarır. `sessionStartedAt` içermeyen satırlar, mevcut olduğunda
eski transkript JSONL oturum başlığından çözümlenir. Eski bir satırda
`lastInteractionAt` de yoksa boşta kalma güncelliği, daha sonraki kayıt tutma
yazımlarına değil, ilgili oturumun başlangıç zamanına geri döner. Açık inceleme
veya doğrulama kanıtı istediğinizde `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` ve [Doctor geçiş
sırasını](/tr/cli/doctor#session-sqlite-migration) kullanın.

## Oturum bakımı

OpenClaw, varsayılanları aşağıda gösterilen `session.maintenance` aracılığıyla oturum
depolamasını zaman içinde sınırlar:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" temizliği uygular; "warn" yalnızca bildirir
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Üretim ölçeğindeki `maxEntries` sınırları için Gateway çalışma zamanı yazımları küçük bir
üst sınır tamponu kullanır ve gruplar hâlinde yapılandırılmış sınıra geri temizler.
Oturum deposu okumaları, Gateway başlangıcı sırasında girdileri budamaz veya sınırlamaz;
böylece başlangıç ve yalıtılmış Cron oturumları tam depo temizliğinin maliyetini üstlenmez.
`openclaw sessions cleanup --enforce` sınırı hemen uygular.

Gateway model çalıştırma yoklama oturumları varsayılan olarak kısa ömürlüdür.
`agent:*:explicit:model-run-<uuid>` ile eşleşen satırlar sabit `24h` saklama süresini
kullanır ancak temizlik baskı koşulludur: eski yoklama satırlarını yalnızca oturum girdisi
bakım/sınır baskısına ulaşıldığında kaldırır ve daha genel eski girdi yaş
eşiğinden ve girdi sınırından önce çalışır. Normal doğrudan, grup, ileti dizisi, Cron,
Webhook, Heartbeat, ACP ve alt agent oturumları bu 24h saklama süresini devralmaz.

Bakım; grup oturumları ve ileti dizisi kapsamlı sohbet oturumları dâhil kalıcı
harici konuşma işaretçilerini korurken yapay Cron, Webhook, Heartbeat, ACP ve
alt agent girdilerinin zamanla eskimesine izin verir.

Daha önce DM yalıtımı kullandıysanız ve daha sonra `session.dmScope` öğesini
`main` değerine döndürdüyseniz eski eş anahtarlı DM satırlarını
`openclaw sessions cleanup --dry-run --fix-dm-scope` ile önizleyin. Aynı bayrağın uygulanması
bu eski doğrudan DM satırlarını kullanımdan kaldırır ve transkriptlerini silinmiş
arşivler olarak saklar.

Herhangi bir bakım çalıştırmasını `openclaw sessions cleanup --dry-run` ile önizleyin.

## Oturumları inceleme

| Komut                    | Gösterdikleri                                           |
| -------------------------- | ----------------------------------------------- |
| `openclaw status`          | Oturum deposu yolu ve son etkinlik          |
| `openclaw sessions --json` | Tüm oturumlar (`--active <minutes>` ile filtreleyin) |
| Sohbette `/status`          | Bağlam kullanımı, model ve geçişler               |
| `/context list`            | Sistem isteminin içeriği                    |

## Ek okumalar

- [Oturum arama](/tr/concepts/session-search) - geçmiş transkriptler arasında tam metinli geri çağırma
- [Oturum Budama](/tr/concepts/session-pruning) - araç sonuçlarını kırpma
- [Compaction](/tr/concepts/compaction) - uzun konuşmaları özetleme
- [Oturum Araçları](/tr/concepts/session-tool) - oturumlar arası çalışma için agent araçları
- [Oturum Yönetimine Derinlemesine Bakış](/tr/reference/session-management-compaction) -
  depo şeması, transkriptler, gönderme politikası, kaynak meta verileri ve gelişmiş yapılandırma
- [Çoklu Agent](/tr/concepts/multi-agent) - agent'lar arasında yönlendirme ve oturum yalıtımı
- [Arka Plan Görevleri](/tr/automation/tasks) - ayrılmış çalışmaların oturum referanslarıyla nasıl görev kayıtları oluşturduğu
- [Kanal Yönlendirme](/tr/channels/channel-routing) - gelen mesajların oturumlara nasıl yönlendirildiği

## İlgili

- [Oturum budama](/tr/concepts/session-pruning)
- [Oturum araçları](/tr/concepts/session-tool)
- [Komut kuyruğu](/tr/concepts/queue)
