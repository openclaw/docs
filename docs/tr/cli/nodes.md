---
read_when:
    - Eşleştirilmiş Node'ları yönetiyorsunuz (kameralar, ekran, tuval)
    - İstekleri onaylamanız veya node komutlarını çalıştırmanız gerekir
summary: '`openclaw nodes` için CLI referansı (durum, eşleştirme, çağırma, kamera/tuval/ekran)'
title: Node'lar
x-i18n:
    generated_at: "2026-05-06T17:54:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3eb0d23037c939e4022115a2d65e0e9cb25a872daed715b8652979ce6707cf7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Eşleştirilmiş Node'ları (cihazları) yönetin ve Node yeteneklerini çağırın.

İlgili:

- Node'lara genel bakış: [Node'lar](/tr/nodes)
- Kamera: [Kamera Node'ları](/tr/nodes/camera)
- Görüntüler: [Görüntü Node'ları](/tr/nodes/images)

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

`nodes list`, bekleyen/eşleştirilmiş tabloları yazdırır. Eşleştirilmiş satırlar en son bağlantı yaşını (Last Connect) içerir.
Yalnızca şu anda bağlı Node'ları göstermek için `--connected` kullanın. Belirli bir süre içinde (ör. `24h`, `7d`)
bağlanmış Node'lara filtrelemek için `--last-connected <duration>` kullanın.
Eski bir Gateway sahipli Node eşleştirme kaydını silmek için `nodes remove --node <id|name|ip>` kullanın.

Onay notu:

- `openclaw nodes pending` yalnızca eşleştirme kapsamı gerektirir.
- `gateway.nodes.pairing.autoApproveCidrs`, bekleme adımını yalnızca açıkça güvenilen,
  ilk kez yapılan `role: node` cihaz eşleştirmesi için atlayabilir. Varsayılan olarak kapalıdır
  ve yükseltmeleri onaylamaz.
- `openclaw nodes approve <requestId>`, bekleyen isteğin ek kapsam gereksinimlerini devralır:
  - komutsuz istek: yalnızca eşleştirme
  - exec olmayan Node komutları: eşleştirme + yazma
  - `system.run` / `system.run.prepare` / `system.which`: eşleştirme + yönetici

## Çağırma

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Çağırma bayrakları:

- `--params <json>`: JSON nesne dizesi (varsayılan `{}`).
- `--invoke-timeout <ms>`: Node çağırma zaman aşımı (varsayılan `15000`).
- `--idempotency-key <key>`: isteğe bağlı idempotency anahtarı.
- `system.run` ve `system.run.prepare` burada engellenir; kabuk yürütmesi için `host=node` ile `exec` aracını kullanın.

Bir Node üzerinde kabuk yürütmesi için `openclaw nodes run` yerine `host=node` ile `exec` aracını kullanın.
`nodes` CLI artık yetenek odaklıdır: `nodes invoke` üzerinden doğrudan RPC; ayrıca eşleştirme, kamera,
ekran, konum, canvas ve bildirimler.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Node'lar](/tr/nodes)
