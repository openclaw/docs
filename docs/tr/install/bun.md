---
read_when:
    - En hızlı yerel geliştirme döngüsünü istiyorsunuz (bun + watch)
    - Bun yükleme/yama/yaşam döngüsü betiği sorunlarıyla karşılaştınız
summary: 'Bun iş akışı (deneysel): pnpm’e kıyasla kurulumlar ve dikkat edilmesi gerekenler'
title: Bun (deneysel)
x-i18n:
    generated_at: "2026-05-10T19:41:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun, **Gateway çalışma zamanı için önerilmez** (WhatsApp ve Telegram ile bilinen sorunlar). Üretim için Node kullanın.
</Warning>

Bun, TypeScript'i doğrudan çalıştırmak için isteğe bağlı bir yerel çalışma zamanıdır (`bun run ...`, `bun --watch ...`). Varsayılan paket yöneticisi, tamamen desteklenen ve belge araçları tarafından kullanılan `pnpm` olarak kalır. Bun, `pnpm-lock.yaml` dosyasını kullanamaz ve onu yok sayar.

## Kurulum

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` git tarafından yok sayılır, bu yüzden depoda değişiklik gürültüsü oluşmaz. Kilit dosyası yazımlarını tamamen atlamak için:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build and test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Yaşam döngüsü betikleri

Bun, açıkça güvenilmediği sürece bağımlılık yaşam döngüsü betiklerini engeller. Bu depo için yaygın olarak engellenen betikler gerekli değildir:

- `baileys` `preinstall` -- Node ana sürümünün >= 20 olduğunu denetler (OpenClaw varsayılan olarak Node 24 kullanır ve şu anda `22.16+` olan Node 22 LTS'yi hâlâ destekler)
- `protobufjs` `postinstall` -- uyumsuz sürüm şemaları hakkında uyarılar üretir (derleme yapıtı yok)

Bu betikleri gerektiren bir çalışma zamanı sorunuyla karşılaşırsanız, onlara açıkça güvenin:

```sh
bun pm trust baileys protobufjs
```

## Uyarılar

Bazı betikler hâlâ pnpm'i sabit olarak kullanır (örneğin `docs:build`, `ui:*`, `protocol:check`). Şimdilik bunları pnpm üzerinden çalıştırın.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Node.js](/tr/install/node)
- [Güncelleme](/tr/install/updating)
