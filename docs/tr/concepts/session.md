---
read_when:
    - Oturum yönlendirmesini ve yalıtımını anlamak istiyorsunuz
    - Çok kullanıcılı kurulumlar için DM kapsamını yapılandırmak istiyorsunuz
summary: OpenClaw’ın konuşma oturumlarını nasıl yönettiği
title: Oturum Yönetimi
x-i18n:
    generated_at: "2026-04-05T13:51:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab985781e54b22a034489dafa4b52cc204b1a5da22ee9b62edc7f6697512cea1
    source_path: concepts/session.md
    workflow: 15
---

# Oturum Yönetimi

OpenClaw, konuşmaları **oturumlar** hâlinde düzenler. Her mesaj, geldiği yere göre bir
oturuma yönlendirilir -- DM’ler, grup sohbetleri, cron işleri vb.

## Mesajlar nasıl yönlendirilir

| Kaynak          | Davranış                    |
| --------------- | --------------------------- |
| Doğrudan mesajlar | Varsayılan olarak paylaşılan oturum |
| Grup sohbetleri | Grup başına yalıtılmış      |
| Odalar/kanallar | Oda başına yalıtılmış       |
| Cron işleri     | Her çalıştırma için yeni oturum |
| Webhook’lar     | Hook başına yalıtılmış      |

## DM yalıtımı

Varsayılan olarak tüm DM’ler süreklilik için tek bir oturumu paylaşır. Bu,
tek kullanıcılı kurulumlar için uygundur.

<Warning>
Birden fazla kişi agent’ınıza mesaj gönderebiliyorsa DM yalıtımını etkinleştirin. Aksi takdirde tüm
kullanıcılar aynı konuşma bağlamını paylaşır -- Alice’in özel mesajları Bob tarafından
görülebilir.
</Warning>

**Düzeltme:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // kanal + göndericiye göre yalıt
  },
}
```

Diğer seçenekler:

- `main` (varsayılan) -- tüm DM’ler tek bir oturumu paylaşır.
- `per-peer` -- göndericiye göre yalıt (kanallar arasında).
- `per-channel-peer` -- kanal + göndericiye göre yalıt (önerilir).
- `per-account-channel-peer` -- hesap + kanal + göndericiye göre yalıt.

<Tip>
Aynı kişi size birden fazla kanaldan ulaşıyorsa,
kimliklerini bağlayıp tek bir oturumu paylaşmaları için
`session.identityLinks` kullanın.
</Tip>

Kurulumunuzu `openclaw security audit` ile doğrulayın.

## Oturum yaşam döngüsü

Oturumlar, süreleri dolana kadar yeniden kullanılır:

- **Günlük sıfırlama** (varsayılan) -- gateway
  ana bilgisayarında yerel saatle sabah 4:00’te yeni oturum.
- **Boşta kalma sıfırlaması** (isteğe bağlı) -- belirli bir hareketsizlik süresinden sonra yeni oturum. Bunun için
  `session.reset.idleMinutes` ayarlayın.
- **Manuel sıfırlama** -- sohbette `/new` veya `/reset` yazın. `/new <model>` ayrıca
  modeli de değiştirir.

Hem günlük hem de boşta kalma sıfırlaması yapılandırılmışsa, hangisinin süresi önce dolarsa o geçerli olur.

## Durumun bulunduğu yer

Tüm oturum durumu **gateway** tarafından sahiplenilir. UI istemcileri, oturum verileri için gateway’i sorgular.

- **Depo:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transkriptler:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## Oturum bakımı

OpenClaw, zaman içinde oturum depolamasını otomatik olarak sınırlar. Varsayılan olarak
`warn` modunda çalışır (neyin temizleneceğini bildirir). Otomatik temizleme için
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

Önizleme için `openclaw sessions cleanup --dry-run` kullanın.

## Oturumları inceleme

- `openclaw status` -- oturum deposu yolu ve son etkinlik.
- `openclaw sessions --json` -- tüm oturumlar (`--active <minutes>` ile filtreleyin).
- Sohbette `/status` -- bağlam kullanımı, model ve geçişler.
- `/context list` -- sistem isteminde neler olduğu.

## Daha fazla bilgi

- [Session Pruning](/concepts/session-pruning) -- araç sonuçlarını kırpma
- [Compaction](/concepts/compaction) -- uzun konuşmaları özetleme
- [Session Tools](/concepts/session-tool) -- oturumlar arası işler için agent araçları
- [Session Management Deep Dive](/reference/session-management-compaction) --
  depo şeması, transkriptler, gönderim ilkesi, kaynak meta verileri ve gelişmiş yapılandırma
- [Multi-Agent](/concepts/multi-agent) — agent’lar arasında yönlendirme ve oturum yalıtımı
- [Background Tasks](/tr/automation/tasks) — ayrık işlerin oturum başvurularıyla görev kayıtlarını nasıl oluşturduğu
- [Channel Routing](/tr/channels/channel-routing) — gelen mesajların oturumlara nasıl yönlendirildiği
