---
read_when:
    - Eşleştirilmiş Node'ları yönetiyorsunuz (kameralar, ekran, tuval)
    - İstekleri onaylamanız veya Node komutlarını çağırmanız gerekir
summary: '`openclaw nodes` için CLI başvurusu (durum, eşleştirme, çağırma, kamera/canvas/ekran)'
title: Node'lar
x-i18n:
    generated_at: "2026-05-07T13:14:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Eşleştirilmiş Node'ları (cihazları) yönetin ve Node yeteneklerini çağırın.

İlgili:

- Node'lara genel bakış: [Node'lar](/tr/nodes)
- Kamera: [Kamera Node'ları](/tr/nodes/camera)
- Görseller: [Görsel Node'ları](/tr/nodes/images)

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
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` bekleyen/eşleştirilmiş tabloları yazdırır. Eşleştirilmiş satırlar en son bağlantı yaşını (Son Bağlantı) içerir.
Yalnızca şu anda bağlı Node'ları göstermek için `--connected` kullanın. Bir süre içinde bağlanmış Node'larla
filtrelemek için `--last-connected <duration>` kullanın (örn. `24h`, `7d`).
Eski bir Gateway'e ait Node eşleştirme kaydını silmek için `nodes remove --node <id|name|ip>` kullanın.

Onay notu:

- `openclaw nodes pending` yalnızca eşleştirme kapsamı gerektirir.
- `gateway.nodes.pairing.autoApproveCidrs`, bekleme adımını yalnızca açıkça güvenilen,
  ilk kez yapılan `role: node` cihaz eşleştirmesi için atlayabilir. Varsayılan olarak
  kapalıdır ve yükseltmeleri onaylamaz.
- `openclaw nodes approve <requestId>`, bekleyen istekten ek kapsam gereksinimlerini
  devralır:
  - komutsuz istek: yalnızca eşleştirme
  - yürütme dışı Node komutları: eşleştirme + yazma
  - `system.run` / `system.run.prepare` / `system.which`: eşleştirme + yönetici

## Çağırma

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Çağırma bayrakları:

- `--params <json>`: JSON nesnesi dizesi (varsayılan `{}`).
- `--invoke-timeout <ms>`: Node çağırma zaman aşımı (varsayılan `15000`).
- `--idempotency-key <key>`: isteğe bağlı idempotency anahtarı.
- `system.run` ve `system.run.prepare` burada engellenir; shell yürütmesi için `host=node` ile `exec` aracını kullanın.

Bir Node üzerinde shell yürütmesi için `openclaw nodes run` yerine `host=node` ile `exec` aracını kullanın.
`nodes` CLI artık yetenek odaklıdır: `nodes invoke` üzerinden doğrudan RPC; ayrıca eşleştirme, kamera,
ekran, konum, Canvas ve bildirimler. Canvas komutları birlikte gelen deneysel Canvas Plugin tarafından uygulanır; çekirdek, bunların `openclaw nodes canvas` altında kalması için bir uyumluluk kancası tutar.

## İlgili

- [CLI referansı](/tr/cli)
- [Node'lar](/tr/nodes)
