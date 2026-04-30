---
read_when:
    - Eşleştirilmiş Node'ları yönetiyorsunuz (kameralar, ekran, tuval)
    - İstekleri onaylamanız veya Node komutlarını çağırmanız gerekir
summary: '`openclaw nodes` için CLI başvurusu (durum, eşleştirme, çağırma, kamera/canvas/ekran)'
title: Node'lar
x-i18n:
    generated_at: "2026-04-30T09:13:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Eşleştirilmiş Node'ları (cihazları) yönetin ve Node yeteneklerini çağırın.

İlgili:

- Node genel bakışı: [Node'lar](/tr/nodes)
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

`nodes list`, bekleyen/eşleştirilmiş tabloları yazdırır. Eşleştirilmiş satırlar en son bağlantı yaşını (Son Bağlantı) içerir.
Yalnızca şu anda bağlı Node'ları göstermek için `--connected` kullanın. Belirli bir süre içinde (ör. `24h`, `7d`)
bağlanmış Node'lara göre filtrelemek için `--last-connected <duration>` kullanın.
Eski bir Gateway'e ait Node eşleştirme kaydını silmek için `nodes remove --node <id|name|ip>` kullanın.

Onay notu:

- `openclaw nodes pending` yalnızca eşleştirme kapsamı gerektirir.
- `gateway.nodes.pairing.autoApproveCidrs`, bekleyen adımı yalnızca
  açıkça güvenilen, ilk kez yapılan `role: node` cihaz eşleştirmesi için atlayabilir. Varsayılan olarak kapalıdır
  ve yükseltmeleri onaylamaz.
- `openclaw nodes approve <requestId>`, ek kapsam gereksinimlerini bekleyen
  istekten devralır:
  - komutsuz istek: yalnızca eşleştirme
  - exec olmayan Node komutları: eşleştirme + yazma
  - `system.run` / `system.run.prepare` / `system.which`: eşleştirme + yönetici

## Çağırma

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Çağırma bayrakları:

- `--params <json>`: JSON nesnesi dizgesi (varsayılan `{}`).
- `--invoke-timeout <ms>`: Node çağırma zaman aşımı (varsayılan `15000`).
- `--idempotency-key <key>`: isteğe bağlı idempotency anahtarı.
- `system.run` ve `system.run.prepare` burada engellenir; kabuk yürütmesi için `host=node` ile `exec` aracını kullanın.

Bir Node üzerinde kabuk yürütmesi için `openclaw nodes run` yerine `host=node` ile `exec` aracını kullanın.
`nodes` CLI artık yetenek odaklıdır: `nodes invoke` ile doğrudan RPC, ayrıca eşleştirme, kamera,
ekran, konum, tuval ve bildirimler.

## İlgili

- [CLI referansı](/tr/cli)
- [Node'lar](/tr/nodes)
