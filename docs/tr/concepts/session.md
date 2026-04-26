---
read_when:
    - Oturum yönlendirmesini ve yalıtımını anlamak istiyorsunuz
    - Çok kullanıcılı kurulumlar için DM kapsamını yapılandırmak istiyorsunuz
    - Günlük veya boşta oturum sıfırlamalarında hata ayıklıyorsunuz
summary: OpenClaw'ın konuşma oturumlarını nasıl yönettiği
title: Oturum yönetimi
x-i18n:
    generated_at: "2026-04-26T11:27:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36995997dc7eb612333c6bbfe6cd6c08dc22769ad0a7e47d15dbb4208e6113
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw konuşmaları **oturumlar** halinde düzenler. Her mesaj, geldiği yere göre bir oturuma yönlendirilir -- DM'ler, grup sohbetleri, Cron görevleri vb.

## Mesajlar nasıl yönlendirilir

| Kaynak          | Davranış                  |
| --------------- | ------------------------- |
| Doğrudan mesajlar | Varsayılan olarak paylaşılan oturum |
| Grup sohbetleri | Grup başına yalıtılmış    |
| Odalar/kanallar | Oda başına yalıtılmış     |
| Cron görevleri  | Çalıştırma başına yeni oturum |
| Webhook'lar     | Hook başına yalıtılmış    |

## DM yalıtımı

Varsayılan olarak tüm DM'ler süreklilik için tek bir oturumu paylaşır. Bu,
tek kullanıcılı kurulumlar için uygundur.

<Warning>
Birden fazla kişi agent'ınıza mesaj gönderebiliyorsa DM yalıtımını etkinleştirin. Aksi halde tüm
kullanıcılar aynı konuşma bağlamını paylaşır -- Alice'in özel mesajları Bob tarafından görülebilir.
</Warning>

**Çözüm:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // kanal + gönderen bazında yalıt
  },
}
```

Diğer seçenekler:

- `main` (varsayılan) -- tüm DM'ler tek bir oturumu paylaşır.
- `per-peer` -- gönderen bazında yalıtım (kanallar arasında).
- `per-channel-peer` -- kanal + gönderen bazında yalıtım (önerilir).
- `per-account-channel-peer` -- hesap + kanal + gönderen bazında yalıtım.

<Tip>
Aynı kişi size birden çok kanaldan ulaşıyorsa, tek bir oturumu paylaşmaları için
kimliklerini bağlamak amacıyla `session.identityLinks` kullanın.
</Tip>

Kurulumunuzu `openclaw security audit` ile doğrulayın.

## Oturum yaşam döngüsü

Oturumlar, süreleri dolana kadar yeniden kullanılır:

- **Günlük sıfırlama** (varsayılan) -- gateway ana makinesinin yerel saatine göre sabah 4:00'te yeni oturum.
  Günlük tazelik, daha sonraki metadata yazılarına değil, geçerli `sessionId`'nin
  ne zaman başladığına göre belirlenir.
- **Boşta sıfırlama** (isteğe bağlı) -- belirli bir hareketsizlik süresinden sonra yeni oturum. `session.reset.idleMinutes` ayarlayın.
  Boşta tazelik, son gerçek kullanıcı/kanal etkileşimine göre belirlenir; bu yüzden Heartbeat, Cron ve exec sistem olayları
  oturumu canlı tutmaz.
- **Elle sıfırlama** -- sohbette `/new` veya `/reset` yazın. `/new <model>` modeli de değiştirir.

Hem günlük hem boşta sıfırlama yapılandırıldığında, önce hangisinin süresi dolarsa o kazanır.
Heartbeat, Cron, exec ve diğer sistem olayı turları oturum metadata'sı yazabilir,
ancak bu yazılar günlük veya boşta sıfırlama tazeliğini uzatmaz. Sıfırlama
oturumu devirdiğinde, eski oturuma ait kuyruktaki sistem olayı bildirimleri
atılır; böylece bayat arka plan güncellemeleri yeni oturumdaki ilk istemin başına eklenmez.

Etkin bir sağlayıcıya ait CLI oturumuna sahip oturumlar örtük günlük varsayılan tarafından kesilmez.
Bu oturumların bir zamanlayıcıya göre sona ermesi gerekiyorsa `/reset` kullanın veya `session.reset` değerini açıkça yapılandırın.

## Durum nerede yaşar

Tüm oturum durumu **gateway** tarafından sahiplenilir. UI istemcileri, oturum verileri için gateway'i sorgular.

- **Depo:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkriptler:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` ayrı yaşam döngüsü zaman damgaları tutar:

- `sessionStartedAt`: geçerli `sessionId`'nin başladığı an; günlük sıfırlama bunu kullanır.
- `lastInteractionAt`: boşta yaşam süresini uzatan son kullanıcı/kanal etkileşimi.
- `updatedAt`: son depo satırı mutasyonu; listeleme ve budama için yararlıdır, ancak günlük/boşta sıfırlama tazeliği için belirleyici değildir.

`sessionStartedAt` bulunmayan eski satırlar, mümkün olduğunda transcript JSONL
oturum üstbilgisinden çözülür. Daha eski bir satırda `lastInteractionAt` da yoksa,
boşta tazelik daha sonraki muhasebe yazılarına değil, o oturumun başlangıç zamanına fallback yapar.

## Oturum bakımı

OpenClaw zamanla oturum depolamasını otomatik olarak sınırlar. Varsayılan olarak
`warn` modunda çalışır (nelerin temizleneceğini raporlar). Otomatik temizlik için `session.maintenance.mode`
değerini `"enforce"` olarak ayarlayın:

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

`openclaw sessions cleanup --dry-run` ile önizleme yapın.

## Oturumları inceleme

- `openclaw status` -- oturum deposu yolu ve son etkinlik.
- `openclaw sessions --json` -- tüm oturumlar (`--active <minutes>` ile filtreleyin).
- Sohbette `/status` -- bağlam kullanımı, model ve anahtarlar.
- `/context list` -- sistem isteminde neler olduğu.

## Daha fazla okuma

- [Session Pruning](/tr/concepts/session-pruning) -- tool sonuçlarını kırpma
- [Compaction](/tr/concepts/compaction) -- uzun konuşmaları özetleme
- [Session Tools](/tr/concepts/session-tool) -- oturumlar arası çalışma için agent tool'ları
- [Session Management Deep Dive](/tr/reference/session-management-compaction) --
  depo şeması, transkriptler, gönderim ilkesi, origin metadata'sı ve gelişmiş config
- [Multi-Agent](/tr/concepts/multi-agent) — agent'lar arasında yönlendirme ve oturum yalıtımı
- [Background Tasks](/tr/automation/tasks) — ayrık işlerin oturum başvuruları içeren görev kayıtlarını nasıl oluşturduğu
- [Channel Routing](/tr/channels/channel-routing) — gelen mesajların oturumlara nasıl yönlendirildiği

## İlgili

- [Session pruning](/tr/concepts/session-pruning)
- [Session tools](/tr/concepts/session-tool)
- [Command queue](/tr/concepts/queue)
