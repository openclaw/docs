---
read_when:
    - Eşleştirilmiş düğümleri yönetiyorsunuz (kameralar, ekran, tuval)
    - İstekleri onaylamanız veya node komutlarını çağırmanız gerekir
summary: '`openclaw nodes` için CLI başvurusu (status, pairing, invoke, camera/canvas/screen)'
title: Node'lar
x-i18n:
    generated_at: "2026-06-28T00:23:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

Eşleştirilmiş düğümleri (cihazları) yönetin ve düğüm yeteneklerini çağırın.

İlgili:

- Düğümler genel bakışı: [Düğümler](/tr/nodes)
- Kamera: [Kamera düğümleri](/tr/nodes/camera)
- Görüntüler: [Görüntü düğümleri](/tr/nodes/images)

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
Yalnızca şu anda bağlı düğümleri göstermek için `--connected` kullanın. Bir süre içinde bağlanan düğümlere
filtrelemek için `--last-connected <duration>` kullanın (ör. `24h`, `7d`).
Bir düğüm eşleştirmesini kaldırmak için `nodes remove --node <id|name|ip>` kullanın. Cihaz destekli
bir düğüm için bu, cihazın `devices/paired.json` içindeki `node` rolünü iptal eder
ve düğüm rolü oturumlarının bağlantısını keser (karma rollü bir cihaz satırını korur ve
yalnızca `node` rolünü kaybeder; yalnızca düğüm olan bir cihaz silinir); ayrıca
eşleşen eski Gateway sahipli düğüm eşleştirme kaydını da temizler. `operator.pairing`, operatör olmayan
düğüm satırlarını kaldırabilir; karma rollü bir cihazda kendi düğüm rolünü iptal eden
cihaz belirteci çağırıcısının ayrıca `operator.admin` yetkisine ihtiyacı vardır.

Onay notu:

- `openclaw nodes pending` yalnızca eşleştirme kapsamına ihtiyaç duyar.
- `gateway.nodes.pairing.autoApproveCidrs`, bekleme adımını yalnızca açıkça güvenilen,
  ilk kez yapılan `role: node` cihaz eşleştirmesi için atlayabilir. Varsayılan olarak kapalıdır
  ve yükseltmeleri onaylamaz.
- `openclaw nodes approve <requestId>`, bekleyen istekten ek kapsam gereksinimlerini devralır:
  - komutsuz istek: yalnızca eşleştirme
  - exec olmayan düğüm komutları: eşleştirme + yazma
  - `system.run` / `system.run.prepare` / `system.which`: eşleştirme + yönetici

## Çağırma

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

Çağırma bayrakları:

- `--params <json>`: JSON nesnesi dizgesi (varsayılan `{}`).
- `--invoke-timeout <ms>`: düğüm çağırma zaman aşımı (varsayılan `15000`).
- `--idempotency-key <key>`: isteğe bağlı idempotency anahtarı.
- `system.run` ve `system.run.prepare` burada engellenir; kabuk yürütme için `host=node` ile `exec` aracını kullanın.

Bir düğümde kabuk yürütme için `openclaw nodes run` yerine `host=node` ile `exec` aracını kullanın.
`nodes` CLI artık yetenek odaklıdır: `nodes invoke` ile doğrudan RPC, ayrıca eşleştirme, kamera,
ekran, konum, Canvas ve bildirimler. Canvas komutları paketle birlikte gelen deneysel Canvas Plugin tarafından uygulanır; çekirdek, bunların `openclaw nodes canvas` altında kalması için bir uyumluluk kancası tutar.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Düğümler](/tr/nodes)
