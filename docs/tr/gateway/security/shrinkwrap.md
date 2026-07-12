---
read_when:
    - OpenClaw sürümünde npm shrinkwrap'un ne anlama geldiğini öğrenmek istiyorsunuz
    - Paket kilit dosyalarını, bağımlılık değişikliklerini veya tedarik zinciri riskini inceliyorsunuz
    - Yayımlamadan önce kök veya Plugin npm paketlerini doğruluyorsunuz
summary: OpenClaw sürümlerinde npm shrinkwrap'un sade ve teknik açıklaması
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-07-12T11:48:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1e6c0d4541da9220d50cde0b9db064e5a91b81d6562cb16ac697de7d4017098
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw kaynak çalışma kopyaları `pnpm-lock.yaml` kullanır. Yayımlanan OpenClaw npm paketleri, paket kurulumlarının sürüm sırasında incelenen bağımlılık grafiğini kullanması için npm'in yayımlanabilir bağımlılık kilit dosyası olan `npm-shrinkwrap.json` dosyasını kullanır.

## Neden önemlidir?

Shrinkwrap, bir npm paketiyle gönderilen bağımlılık ağacının kaydıdır: npm'e tam olarak hangi geçişli sürümlerin kurulacağını bildirir.

| Dosya                 | Önemli olduğu yer              | Anlamı                                |
| --------------------- | ------------------------------ | ------------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw kaynak çalışma kopyası | Bakımcı bağımlılık grafiği            |
| `npm-shrinkwrap.json` | Yayımlanmış npm paketi         | Kullanıcılar için npm kurulum grafiği |
| `package-lock.json`   | Yerel npm uygulamaları         | OpenClaw yayımlama sözleşmesi değildir |

OpenClaw sürümleri açısından bunun anlamı şudur:

- yayımlanan paket, npm'den kurulum sırasında yeni bir bağımlılık grafiği oluşturmasını istemez;
- bağımlılık değişiklikleri bir kilit dosyası farkı içinde yer aldığından incelenebilir;
- sürüm doğrulaması, kullanıcıların kuracağı grafiğin aynısını test eder;
- paket boyutuyla veya yerel bağımlılıklarla ilgili beklenmedik durumlar yayımlamadan önce ortaya çıkar.

Shrinkwrap bir korumalı alan değildir. Tek başına bir bağımlılığı güvenli hâle getirmez ve ana makine yalıtımının, `openclaw security audit` komutunun, paket kaynağı doğrulamasının veya kurulum duman testlerinin yerini almaz.

OpenClaw bir Gateway, Plugin barındırıcısı, model yönlendiricisi ve ajan çalışma zamanıdır; bu nedenle varsayılan bir kurulum başlatma süresini, disk kullanımını, yerel paket indirmelerini ve tedarik zinciri risklerini etkiler. Shrinkwrap, sürüm incelemesine istikrarlı bir sınır sağlar: inceleyenler geçişli bağımlılık hareketlerini görür, doğrulayıcılar beklenmeyen kilit dosyası sapmalarını reddeder ve Plugin paketleri kök pakete güvenmek yerine kendi kilitlenmiş bağımlılık grafiklerini taşır.

## Oluşturma ve denetleme

Kök `openclaw` npm paketi, OpenClaw'a ait npm Plugin paketleri (örneğin `@openclaw/discord`) ve [`@openclaw/ai`](/reference/openclaw-ai) gibi yayımlanabilir çalışma alanı paketleri, yayımlanırken `npm-shrinkwrap.json` dosyasını içerir. Çalışma alanı bağımlılıkları, kök paketle birlikte yayımlandıkları için kök shrinkwrap dosyasından çıkarılır; bunun yerine yayımlanabilir her çalışma alanı paketi kendi geçişli ağacını sabitler. Uygun Plugin paketleri ayrıca açık `bundledDependencies` ile yayımlanabilir ve yalnızca kurulum sırasındaki çözümlemeye güvenmek yerine çalışma zamanı bağımlılık dosyalarını Plugin tar arşivinde taşıyabilir.

```bash
# Shrinkwrap ile yönetilen tüm paketler (kök + yayımlanabilir Plugin'ler)
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check

# Yalnızca kök paket
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check

# Yalnızca mevcut değişiklik kümesinden etkilenen paketler
pnpm deps:shrinkwrap:changed:generate
pnpm deps:shrinkwrap:changed:check
```

Oluşturucu, npm'in yayımlanabilir kilit biçimini çözümler ancak `pnpm-lock.yaml` içinde zaten bulunmayan oluşturulmuş paket sürümlerini reddeder. Bu, pnpm bağımlılık yaşı, geçersiz kılma ve yama inceleme sınırını korur.

Bunları güvenlik açısından hassas olarak inceleyin:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- paketlenmiş Plugin bağımlılığı yükleri
- tüm `package-lock.json` farkları

OpenClaw paket doğrulayıcıları, yeni kök paket tar arşivlerinde shrinkwrap bulunmasını zorunlu kılar ve yayımlanmış paketlerde `package-lock.json` dosyasını reddeder. Plugin npm yayımlama yolu, Plugin'e özgü shrinkwrap dosyasını denetler, pakete özgü paketlenmiş bağımlılıkları kurar, ardından paketi arşivler veya yayımlar.

## Yayımlanmış bir paketi inceleme

Kök paket:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

Plugin paketi:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Arka plan bilgisi: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
