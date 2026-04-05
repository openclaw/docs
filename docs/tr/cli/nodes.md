---
read_when:
    - Eşleştirilmiş düğümleri yönetiyorsanız (kameralar, ekran, canvas)
    - İstekleri onaylamanız veya düğüm komutlarını çağırmanız gerekiyorsa
summary: '`openclaw nodes` için CLI başvurusu (durum, eşleştirme, çağırma, kamera/canvas/ekran)'
title: nodes
x-i18n:
    generated_at: "2026-04-05T13:48:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ce3095591c4623ad18e3eca8d8083e5c10266fbf94afea2d025f0ba8093a175
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

Eşleştirilmiş düğümleri (cihazları) yönetin ve düğüm yeteneklerini çağırın.

İlgili:

- Düğümlere genel bakış: [Nodes](/nodes)
- Kamera: [Kamera düğümleri](/nodes/camera)
- Görseller: [Görsel düğümleri](/nodes/images)

Yaygın seçenekler:

- `--url`, `--token`, `--timeout`, `--json`

## Yaygın komutlar

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list`, bekleyen/eşleştirilmiş tablolarını yazdırır. Eşleştirilmiş satırlarda en son bağlanma yaşı (Last Connect) yer alır.
Yalnızca şu anda bağlı düğümleri göstermek için `--connected` kullanın. Belirli bir süre içinde bağlanan düğümlere
filtrelemek için `--last-connected <duration>` kullanın (örneğin `24h`, `7d`).

Onay notu:

- `openclaw nodes pending` yalnızca eşleştirme kapsamına ihtiyaç duyar.
- `openclaw nodes approve <requestId>`, bekleyen istekten ek kapsam gereksinimlerini devralır:
  - komutsuz istek: yalnızca eşleştirme
  - exec olmayan düğüm komutları: eşleştirme + yazma
  - `system.run` / `system.run.prepare` / `system.which`: eşleştirme + yönetici

## Çağırma

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Çağırma bayrakları:

- `--params <json>`: JSON nesne dizesi (varsayılan `{}`).
- `--invoke-timeout <ms>`: düğüm çağırma zaman aşımı (varsayılan `15000`).
- `--idempotency-key <key>`: isteğe bağlı idempotency anahtarı.
- `system.run` ve `system.run.prepare` burada engellenir; kabuk yürütmesi için `host=node` ile `exec` aracını kullanın.

Bir düğümde kabuk yürütmesi için `openclaw nodes run` yerine `host=node` ile `exec` aracını kullanın.
`nodes` CLI artık yetenek odaklıdır: `nodes invoke` ile doğrudan RPC, ayrıca eşleştirme, kamera,
ekran, konum, canvas ve bildirimler.
