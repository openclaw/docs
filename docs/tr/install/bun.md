---
read_when:
    - En hızlı yerel geliştirme döngüsünü istiyorsunuz (bun + watch)
    - Bun yükleme/yama/yaşam döngüsü betiği sorunlarıyla karşılaştınız
summary: 'Bun iş akışı (deneysel): pnpm ile karşılaştırmalı kurulumlar ve dikkat edilmesi gerekenler'
title: Bun (deneysel)
x-i18n:
    generated_at: "2026-05-07T13:20:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun, **Gateway çalışma zamanı için önerilmez** (WhatsApp ve Telegram ile bilinen sorunlar). Üretim için Node kullanın.
</Warning>

Bun, TypeScript'i doğrudan çalıştırmak (`bun run ...`, `bun --watch ...`) için isteğe bağlı bir yerel çalışma zamanıdır. Varsayılan paket yöneticisi, tamamen desteklenen ve dokümantasyon araçları tarafından kullanılan `pnpm` olarak kalır. Bun, `pnpm-lock.yaml` dosyasını kullanamaz ve onu yok sayar.

## Kurulum

<Steps>
  <Step title="Bağımlılıkları yükleyin">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` gitignore kapsamındadır, bu yüzden repoda değişiklik karmaşası olmaz. Kilit dosyası yazımlarını tamamen atlamak için:

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

Bun, açıkça güvenilir olarak işaretlenmedikçe bağımlılık yaşam döngüsü betiklerini engeller. Bu repo için yaygın olarak engellenen betikler gerekli değildir:

- `@whiskeysockets/baileys` `preinstall` -- Node ana sürümünün >= 20 olduğunu kontrol eder (OpenClaw varsayılan olarak Node 24 kullanır ve şu anda `22.16+` olan Node 22 LTS'yi desteklemeye devam eder)
- `protobufjs` `postinstall` -- uyumsuz sürüm şemaları hakkında uyarılar üretir (derleme çıktısı yoktur)

Bu betikleri gerektiren bir çalışma zamanı sorunuyla karşılaşırsanız, onlara açıkça güvenin:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Dikkat Edilecekler

Bazı betikler hâlâ pnpm'i sabit kodlar (örneğin `docs:build`, `ui:*`, `protocol:check`). Şimdilik bunları pnpm üzerinden çalıştırın.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Node.js](/tr/install/node)
- [Güncelleme](/tr/install/updating)
