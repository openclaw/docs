---
read_when:
    - Oturum yönlendirmesini ve yalıtımını anlamak istiyorsunuz
    - Çok kullanıcılı kurulumlar için DM kapsamını yapılandırmak istiyorsunuz
summary: OpenClaw'ın konuşma oturumlarını nasıl yönettiği
title: Oturum yönetimi
x-i18n:
    generated_at: "2026-04-24T09:06:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: cafff1fd480bdd306f87c818e7cb66bda8440d643fbe9ce5e14b773630b35d37
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw, konuşmaları **oturumlar** içinde düzenler. Her mesaj, geldiği yere göre
bir oturuma yönlendirilir -- DM'ler, grup sohbetleri, Cron işleri vb.

## Mesajlar nasıl yönlendirilir

| Kaynak          | Davranış                 |
| --------------- | ------------------------ |
| Doğrudan mesajlar | Varsayılan olarak paylaşılan oturum |
| Grup sohbetleri | Grup başına yalıtılmış   |
| Oda/kanallar    | Oda başına yalıtılmış    |
| Cron işleri     | Çalıştırma başına yeni oturum |
| Webhook'lar     | Hook başına yalıtılmış   |

## DM yalıtımı

Varsayılan olarak tüm DM'ler süreklilik için tek bir oturumu paylaşır. Bu,
tek kullanıcılı kurulumlar için uygundur.

<Warning>
Birden fazla kişi agent'inize mesaj gönderebiliyorsa, DM yalıtımını etkinleştirin. Aksi halde tüm
kullanıcılar aynı konuşma bağlamını paylaşır -- Alice'in özel mesajları Bob tarafından görülebilir.
</Warning>

**Çözüm:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // kanal + gönderene göre yalıt
  },
}
```

Diğer seçenekler:

- `main` (varsayılan) -- tüm DM'ler tek bir oturumu paylaşır.
- `per-peer` -- gönderene göre yalıtım (kanallar arasında).
- `per-channel-peer` -- kanal + gönderene göre yalıtım (önerilir).
- `per-account-channel-peer` -- hesap + kanal + gönderene göre yalıtım.

<Tip>
Aynı kişi size birden fazla kanaldan ulaşıyorsa,
tek bir oturum paylaşmaları için `session.identityLinks` kullanarak kimliklerini bağlayın.
</Tip>

Kurulumunuzu `openclaw security audit` ile doğrulayın.

## Oturum yaşam döngüsü

Oturumlar, süreleri dolana kadar yeniden kullanılır:

- **Günlük sıfırlama** (varsayılan) -- Gateway
  sunucusunda yerel saatle sabah 4:00'te yeni oturum.
- **Boşta sıfırlama** (isteğe bağlı) -- bir süre etkinlik olmadığında yeni oturum. Bunun için
  `session.reset.idleMinutes` ayarlayın.
- **Elle sıfırlama** -- sohbette `/new` veya `/reset` yazın. `/new <model>` ayrıca
  modeli de değiştirir.

Hem günlük hem de boşta sıfırlama yapılandırıldığında, önce süresi dolan kazanır.

Etkin sağlayıcıya ait bir CLI oturumu olan oturumlar, örtük günlük varsayılanla
kesilmez. Bu oturumların zamanlayıcıyla sona ermesi gerekiyorsa `/reset` kullanın veya `session.reset` alanını açıkça yapılandırın.

## Durum nerede tutulur

Tüm oturum durumu **Gateway**'e aittir. Arayüz istemcileri oturum verilerini
Gateway'den sorgular.

- **Depo:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Dökümler:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Oturum bakımı

OpenClaw, zaman içinde oturum depolamasını otomatik olarak sınırlar. Varsayılan olarak
`warn` modunda çalışır (neyin temizleneceğini bildirir). Otomatik temizlik için
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

`openclaw sessions cleanup --dry-run` ile önizleyin.

## Oturumları inceleme

- `openclaw status` -- oturum deposu yolu ve son etkinlik.
- `openclaw sessions --json` -- tüm oturumlar (`--active <minutes>` ile filtreleyin).
- Sohbette `/status` -- bağlam kullanımı, model ve geçişler.
- `/context list` -- sistem isteminde nelerin olduğu.

## Daha fazla okuma

- [Session Pruning](/tr/concepts/session-pruning) -- araç sonuçlarını kırpma
- [Compaction](/tr/concepts/compaction) -- uzun konuşmaları özetleme
- [Session Tools](/tr/concepts/session-tool) -- oturumlar arası iş için agent araçları
- [Session Management Deep Dive](/tr/reference/session-management-compaction) --
  depo şeması, dökümler, gönderim ilkesi, kaynak meta verileri ve gelişmiş yapılandırma
- [Multi-Agent](/tr/concepts/multi-agent) — agent'ler arasında yönlendirme ve oturum yalıtımı
- [Background Tasks](/tr/automation/tasks) — ayrılmış işlerin oturum referanslarıyla görev kayıtları nasıl oluşturduğu
- [Channel Routing](/tr/channels/channel-routing) — gelen mesajların oturumlara nasıl yönlendirildiği

## İlgili

- [Session pruning](/tr/concepts/session-pruning)
- [Session tools](/tr/concepts/session-tool)
- [Command queue](/tr/concepts/queue)
