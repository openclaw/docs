---
read_when:
    - En hızlı yerel geliştirme döngüsünü istiyorsunuz (bun + watch)
    - Bun yükleme/yama/yaşam döngüsü betiği sorunlarıyla karşılaştınız
summary: 'Bun iş akışı (deneysel): kurulumlar ve pnpm''e kıyasla dikkat edilmesi gerekenler'
title: Bun (deneysel)
x-i18n:
    generated_at: "2026-07-12T12:24:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun, Gateway çalışma zamanı için önerilmez (WhatsApp ve Telegram ile ilgili bilinen sorunlar vardır). Üretimde Node kullanın.
</Warning>

Bun, TypeScript'i doğrudan çalıştırmak için isteğe bağlı bir yerel çalışma zamanıdır (`bun run ...`, `bun --watch ...`). Varsayılan paket yöneticisi, tam olarak desteklenen ve dokümantasyon araçları tarafından kullanılan `pnpm` olarak kalır. Bun, `pnpm-lock.yaml` dosyasını kullanamaz ve bu dosyayı yok sayar.

## Kurulum

<Steps>
  <Step title="Bağımlılıkları yükleyin">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` dosyaları git tarafından yok sayılır, dolayısıyla depoda gereksiz değişiklik oluşmaz. Kilit dosyasına yazmayı tamamen atlamak için:

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

Bun, açıkça güvenilir olarak işaretlenmedikçe bağımlılık yaşam döngüsü betiklerini engeller. Bu depo için yaygın olarak engellenen betikler gerekli değildir:

- `baileys` `preinstall`: Node ana sürümünün >= 20 olup olmadığını denetler (OpenClaw, Node 22.19+ veya 23.11+ gerektirir; Node 24 önerilir)
- `protobufjs` `postinstall`: uyumsuz sürüm şemaları hakkında uyarılar verir (derleme çıktısı oluşturmaz)

Bu betikleri gerektiren bir çalışma zamanı sorunuyla karşılaşırsanız bunları açıkça güvenilir olarak işaretleyin:

```sh
bun pm trust baileys protobufjs
```

## Dikkat edilmesi gerekenler

Bazı paket betikleri kendi içinde `pnpm` kullanımını sabit kodlar (örneğin `check:docs`, `ui:*`, `protocol:check`). Bunları `bun run` aracılığıyla çalıştırmak yine de kabuk üzerinden `pnpm` komutunu çağırır; bu nedenle söz konusu betikleri doğrudan `pnpm` ile çalıştırın.

## İlgili konular

- [Kuruluma genel bakış](/tr/install)
- [Node.js](/tr/install/node)
- [Güncelleme](/tr/install/updating)
