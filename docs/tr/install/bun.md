---
read_when:
    - En hızlı yerel geliştirme döngüsünü istiyorsunuz (bun + watch)
    - Bun kurulum/yama/lifecycle script sorunlarıyla karşılaştınız
summary: 'Bun iş akışı (deneysel): `pnpm` ile karşılaştırıldığında kurulum ve dikkat edilmesi gerekenler'
title: Bun (deneysel)
x-i18n:
    generated_at: "2026-04-24T09:14:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
Bun, **Gateway çalışma zamanı için önerilmez** (WhatsApp ve Telegram ile bilinen sorunlar vardır). Üretim için Node kullanın.
</Warning>

Bun, TypeScript'i doğrudan çalıştırmak için isteğe bağlı bir yerel çalışma zamanıdır (`bun run ...`, `bun --watch ...`). Varsayılan paket yöneticisi hâlâ `pnpm`'dir; tamamen desteklenir ve belge araçları tarafından kullanılır. Bun, `pnpm-lock.yaml` dosyasını kullanamaz ve onu yok sayar.

## Kurulum

<Steps>
  <Step title="Bağımlılıkları kurun">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` gitignore kapsamında olduğundan depoda gereksiz değişiklik oluşmaz. Lockfile yazımını tamamen atlamak için:

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

## Lifecycle Script'leri

Bun, bağımlılık lifecycle script'lerini açıkça güvenilmedikçe engeller. Bu depo için yaygın olarak engellenen script'ler gerekli değildir:

- `@whiskeysockets/baileys` `preinstall` -- Node major sürümünün >= 20 olduğunu kontrol eder (OpenClaw varsayılan olarak Node 24 kullanır ve şu anda `22.14+` olmak üzere Node 22 LTS'yi de destekler)
- `protobufjs` `postinstall` -- uyumsuz sürüm şemaları hakkında uyarılar üretir (derleme artifaktı yoktur)

Bu script'leri gerektiren bir çalışma zamanı sorunuyla karşılaşırsanız, onlara açıkça güvenin:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Dikkat edilmesi gerekenler

Bazı script'ler hâlâ `pnpm`'yi sabit kodlar (örneğin `docs:build`, `ui:*`, `protocol:check`). Şimdilik bunları `pnpm` üzerinden çalıştırın.

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Node.js](/tr/install/node)
- [Güncelleme](/tr/install/updating)
