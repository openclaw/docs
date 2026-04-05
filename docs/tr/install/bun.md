---
read_when:
    - En hızlı yerel geliştirme döngüsünü istiyorsanız (bun + watch)
    - Bun kurulum/patch/lifecycle script sorunlarıyla karşılaştıysanız
summary: 'Bun iş akışı (deneysel): kurulumlar ve pnpm''e karşı dikkat edilmesi gerekenler'
title: Bun (Deneysel)
x-i18n:
    generated_at: "2026-04-05T13:55:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0845567834124bb9206db64df013dc29f3b61a04da4f7e7f0c2823a9ecd67a6
    source_path: install/bun.md
    workflow: 15
---

# Bun (Deneysel)

<Warning>
Bun, **ağ geçidi çalışma zamanı için önerilmez** (WhatsApp ve Telegram ile bilinen sorunlar vardır). Üretimde Node kullanın.
</Warning>

Bun, TypeScript'i doğrudan çalıştırmak için isteğe bağlı bir yerel çalışma zamanıdır (`bun run ...`, `bun --watch ...`). Varsayılan paket yöneticisi, tam olarak desteklenen ve dokümantasyon araçları tarafından kullanılan `pnpm` olmaya devam eder. Bun, `pnpm-lock.yaml` dosyasını kullanamaz ve yok sayar.

## Kurulum

<Steps>
  <Step title="Bağımlılıkları yükleyin">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` gitignore içindedir, bu nedenle depoda gereksiz değişiklik oluşmaz. Lockfile yazımını tamamen atlamak için:

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

- `@whiskeysockets/baileys` `preinstall` -- Node major sürümünün >= 20 olduğunu denetler (OpenClaw varsayılan olarak Node 24 kullanır ve hâlâ Node 22 LTS'yi destekler, şu an `22.14+`)
- `protobufjs` `postinstall` -- uyumsuz sürüm şemaları hakkında uyarılar üretir (derleme çıktısı yoktur)

Bu script'leri gerektiren bir çalışma zamanı sorunu yaşarsanız, açıkça güvenin:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Dikkat edilmesi gerekenler

Bazı script'ler hâlâ pnpm'i sabit kodlar (örneğin `docs:build`, `ui:*`, `protocol:check`). Şimdilik bunları pnpm üzerinden çalıştırın.
