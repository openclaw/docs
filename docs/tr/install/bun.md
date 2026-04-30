---
read_when:
    - En hızlı yerel geliştirme döngüsünü istiyorsunuz (bun + watch)
    - Bun kurulum/yama/yaşam döngüsü betiği sorunlarıyla karşılaştınız
summary: 'Bun iş akışı (deneysel): pnpm’e göre kurulumlar ve dikkat edilmesi gerekenler'
title: Bun (deneysel)
x-i18n:
    generated_at: "2026-04-30T09:27:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun, **Gateway çalışma zamanı için önerilmez** (WhatsApp ve Telegram ile bilinen sorunlar). Üretim için Node kullanın.
</Warning>

Bun, TypeScript'i doğrudan çalıştırmak için isteğe bağlı bir yerel çalışma zamanıdır (`bun run ...`, `bun --watch ...`). Varsayılan paket yöneticisi, tam olarak desteklenen ve dokümantasyon araçları tarafından kullanılan `pnpm` olarak kalır. Bun, `pnpm-lock.yaml` dosyasını kullanamaz ve onu yok sayar.

## Kurulum

<Steps>
  <Step title="Bağımlılıkları yükle">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` gitignore kapsamındadır, bu nedenle repoda değişiklik gürültüsü oluşmaz. Lockfile yazımlarını tamamen atlamak için:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Derle ve test et">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Yaşam döngüsü betikleri

Bun, açıkça güvenilir olarak işaretlenmedikçe bağımlılık yaşam döngüsü betiklerini engeller. Bu repo için yaygın olarak engellenen betikler gerekli değildir:

- `@whiskeysockets/baileys` `preinstall` -- Node ana sürümünün >= 20 olduğunu denetler (OpenClaw varsayılan olarak Node 24 kullanır ve şu anda `22.14+` olan Node 22 LTS desteğini hâlâ sürdürür)
- `protobufjs` `postinstall` -- uyumsuz sürüm şemaları hakkında uyarılar üretir (derleme çıktısı yok)

Bu betikleri gerektiren bir çalışma zamanı sorunuyla karşılaşırsanız, onlara açıkça güven verin:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Dikkat edilmesi gerekenler

Bazı betikler hâlâ pnpm'i sabit kodlar (örneğin `docs:build`, `ui:*`, `protocol:check`). Şimdilik bunları pnpm üzerinden çalıştırın.

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Node.js](/tr/install/node)
- [Güncelleme](/tr/install/updating)
