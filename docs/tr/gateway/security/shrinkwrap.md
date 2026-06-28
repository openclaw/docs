---
read_when:
    - Bir OpenClaw sürümünde npm shrinkwrap’ın ne anlama geldiğini bilmek istiyorsunuz
    - Paket kilit dosyalarını, bağımlılık değişikliklerini veya tedarik zinciri riskini inceliyorsunuz
    - Yayımlamadan önce kök veya Plugin npm paketlerini doğruluyorsunuz
summary: OpenClaw sürümlerinde npm shrinkwrap’un sade İngilizce ve teknik açıklaması
title: npm shrinkwrap
x-i18n:
    generated_at: "2026-06-28T00:39:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b71f25f5cecde3c954f71534adc011cd163f2e6344ec2f031ebbc858b55a9cd9
    source_path: gateway/security/shrinkwrap.md
    workflow: 16
---

OpenClaw kaynak checkout'ları `pnpm-lock.yaml` kullanır. Yayımlanan OpenClaw npm paketleri, npm'in yayımlanabilir bağımlılık kilit dosyası olan `npm-shrinkwrap.json` kullanır; böylece paket kurulumları, sürüm sırasında incelenen bağımlılık grafiğini kullanır.

## Kolay sürüm

Shrinkwrap, bir npm paketiyle birlikte gönderilen bağımlılık ağacı için bir makbuzdur. npm'e hangi kesin geçişli paket sürümlerini kuracağını söyler.

OpenClaw sürümleri için bunun anlamı şudur:

- yayımlanan paket, kurulum sırasında npm'den yeni bir bağımlılık grafiği icat etmesini istemez;
- bağımlılık değişiklikleri bir kilit dosyasında göründüğü için incelenmesi kolaylaşır;
- sürüm doğrulaması, kullanıcıların kuracağı grafiğin aynısını test edebilir;
- paket boyutu veya yerel bağımlılık sürprizlerini yayımlamadan önce fark etmek kolaylaşır.

Shrinkwrap bir sandbox değildir. Bir bağımlılığı tek başına güvenli hale getirmez ve ana makine izolasyonunun, `openclaw security audit` komutunun, paket kökeninin veya kurulum smoke testlerinin yerini almaz.

Kısa zihinsel model:

| Dosya                 | Önemli olduğu yer        | Anlamı                            |
| --------------------- | ------------------------ | --------------------------------- |
| `pnpm-lock.yaml`      | OpenClaw kaynak checkout | Bakımcı bağımlılık grafiği        |
| `npm-shrinkwrap.json` | Yayımlanan npm paketi    | Kullanıcılar için npm kurulum grafiği |
| `package-lock.json`   | Yerel npm uygulamaları   | OpenClaw yayımlama sözleşmesi değildir |

## OpenClaw bunu neden kullanır?

OpenClaw bir gateway, plugin ana makinesi, model yönlendiricisi ve agent çalışma zamanıdır. Varsayılan kurulum; başlangıç süresini, disk kullanımını, yerel paket indirmelerini ve tedarik zinciri maruziyetini etkileyebilir.

Shrinkwrap, sürüm incelemesine kararlı bir sınır sağlar:

- inceleyenler geçişli bağımlılık hareketini görebilir;
- paket doğrulayıcıları beklenmeyen kilit dosyası kaymalarını reddedebilir;
- paket kabul süreci, gönderilecek grafikle kurulumları test edebilir;
- plugin paketleri, yalnızca plugin'e ait bağımlılıkların sahipliğini kök pakete bırakmak yerine kendi kilitlenmiş bağımlılık grafiklerini taşıyabilir.

Amaç "daha fazla kilit dosyası" değildir. Amaç, net sahiplikle tekrarlanabilir sürüm kurulumlarıdır.

## Teknik ayrıntılar

Kök `openclaw` npm paketi ve OpenClaw'a ait npm plugin paketleri, yayımlandıklarında `npm-shrinkwrap.json` içerir. Uygun OpenClaw'a ait plugin paketleri ayrıca açık `bundledDependencies` ile yayımlanabilir; böylece çalışma zamanı bağımlılık dosyaları, yalnızca kurulum zamanı çözümlemesine bağlı kalmak yerine plugin tarball içinde taşınır.

Sınırı şu şekilde koruyun:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Oluşturucu, npm'in yayımlanabilir kilit biçimini çözümler ancak `pnpm-lock.yaml` içinde zaten bulunmayan oluşturulmuş paket sürümlerini reddeder. Bu, pnpm bağımlılık yaşı, override ve yama inceleme sınırını sağlam tutar.

Yalnızca kök paketi kasıtlı olarak yenilerken ve plugin paketlerine dokunmak istemediğinizde yalnızca kök komutlarını kullanın:

```bash
pnpm deps:shrinkwrap:root:generate
pnpm deps:shrinkwrap:root:check
```

Bu dosyaları güvenlik açısından hassas olarak inceleyin:

- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- paketlenmiş plugin bağımlılık yükleri
- herhangi bir `package-lock.json` farkı

OpenClaw paket doğrulayıcıları, yeni kök paket tarball'larında shrinkwrap gerektirir. Plugin npm yayımlama yolu, plugin'e yerel shrinkwrap'i denetler, pakete yerel paketlenmiş bağımlılıkları kurar ve ardından paketi oluşturur veya yayımlar. Paket doğrulayıcıları, yayımlanan OpenClaw paketleri için `package-lock.json` dosyasını reddeder.

Yayımlanmış bir kök paketi incelemek için:

```bash
npm pack openclaw@<version> --json --pack-destination /tmp/openclaw-pack
tar -tf /tmp/openclaw-pack/openclaw-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
```

OpenClaw'a ait bir plugin paketini incelemek için:

```bash
npm pack @openclaw/discord@<version> --json --pack-destination /tmp/openclaw-plugin-pack
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/npm-shrinkwrap.json$'
tar -tf /tmp/openclaw-plugin-pack/openclaw-discord-<version>.tgz | grep '^package/node_modules/'
```

Arka plan: [npm-shrinkwrap.json](https://docs.npmjs.com/cli/v11/configuring-npm/npm-shrinkwrap-json).
