---
read_when:
    - En hızlı yerel geliştirme döngüsünü istiyorsunuz (bun + watch)
    - Bun yükleme/yama/yaşam döngüsü betiği sorunlarıyla karşılaştınız
summary: 'Bun iş akışı (deneysel): pnpm’e kıyasla kurulumlar ve dikkat edilmesi gerekenler'
title: Bun (deneysel)
x-i18n:
    generated_at: "2026-06-28T00:43:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun, **Gateway çalışma zamanı için önerilmez** (WhatsApp ve Telegram ile bilinen sorunlar). Üretim için Node kullanın.
</Warning>

Bun, TypeScript'i doğrudan çalıştırmak için isteğe bağlı bir yerel çalışma zamanıdır (`bun run ...`, `bun --watch ...`). Varsayılan paket yöneticisi, tamamen desteklenen ve dokümantasyon araçları tarafından kullanılan `pnpm` olarak kalır. Bun, `pnpm-lock.yaml` kullanamaz ve bunu yok sayar.

## Kurulum

<Steps>
  <Step title="Bağımlılıkları yükleyin">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` git tarafından yok sayılır, bu nedenle depoda gereksiz değişiklik oluşmaz. Kilit dosyası yazımlarını tamamen atlamak için:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Derleyin ve test edin">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Yaşam döngüsü betikleri

Bun, açıkça güvenilmediği sürece bağımlılık yaşam döngüsü betiklerini engeller. Bu depo için yaygın olarak engellenen betikler gerekli değildir:

- `baileys` `preinstall` -- Node ana sürümünün >= 20 olduğunu denetler (OpenClaw varsayılan olarak Node 24 kullanır ve hâlâ Node 22 LTS'yi destekler, şu anda `22.19+`)
- `protobufjs` `postinstall` -- uyumsuz sürüm şemaları hakkında uyarılar üretir (derleme çıktısı yoktur)

Bu betikleri gerektiren bir çalışma zamanı sorunuyla karşılaşırsanız, bunlara açıkça güvenin:

```sh
bun pm trust baileys protobufjs
```

## Uyarılar

Bazı betikler hâlâ pnpm'i sabit kodlar (örneğin `check:docs`, `ui:*`, `protocol:check`). Şimdilik bunları pnpm üzerinden çalıştırın.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Node.js](/tr/install/node)
- [Güncelleme](/tr/install/updating)
