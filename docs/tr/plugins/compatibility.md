---
read_when:
    - Bir OpenClaw Plugin'inin bakımını yapıyorsunuz
    - Bir Plugin uyumluluğu uyarısı görüyorsunuz
    - Bir Plugin SDK veya manifest geçişi planlıyorsunuz
summary: Plugin uyumluluk sözleşmeleri, kullanımdan kaldırma meta verileri ve geçiş beklentileri
title: Plugin uyumluluğu
x-i18n:
    generated_at: "2026-04-30T09:34:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw, eski Plugin sözleşmelerini kaldırmadan önce adlandırılmış uyumluluk
adaptörleri üzerinden bağlı tutar. Bu, SDK, manifest, kurulum, yapılandırma ve
aracı çalışma zamanı sözleşmeleri gelişirken mevcut paketli ve harici
plugin'leri korur.

## Uyumluluk kayıt defteri

Plugin uyumluluk sözleşmeleri çekirdek kayıt defterinde
`src/plugins/compat/registry.ts` konumunda izlenir.

Her kayıtta şunlar bulunur:

- kararlı bir uyumluluk kodu
- durum: `active`, `deprecated`, `removal-pending` veya `removed`
- sahip: SDK, yapılandırma, kurulum, kanal, sağlayıcı, Plugin yürütme, aracı çalışma zamanı
  veya çekirdek
- geçerliyse tanıtım ve kullanımdan kaldırma tarihleri
- değiştirme rehberliği
- eski ve yeni davranışı kapsayan dokümanlar, tanılamalar ve testler

Kayıt defteri, bakım sorumlusu planlaması ve gelecekteki Plugin denetleyicisi
kontrolleri için kaynaktır. Plugin'e dönük bir davranış değişirse, adaptörü
ekleyen değişiklikte uyumluluk kaydını da ekleyin veya güncelleyin.

Doctor onarım ve geçiş uyumluluğu ayrı olarak
`src/commands/doctor/shared/deprecation-compat.ts` konumunda izlenir. Bu kayıtlar, çalışma zamanı uyumluluk yolu kaldırıldıktan sonra
kullanılabilir kalması gerekebilecek eski yapılandırma şekillerini,
kurulum-defteri düzenlerini ve onarım shim'lerini kapsar.

Sürüm taramaları her iki kayıt defterini de kontrol etmelidir. Eşleşen çalışma
zamanı veya yapılandırma uyumluluk kaydının süresi doldu diye bir doctor
geçişini silmeyin; önce hâlâ onarıma ihtiyaç duyan desteklenen bir yükseltme
yolu olmadığını doğrulayın. Ayrıca sürüm planlaması sırasında her değiştirme
açıklamasını yeniden doğrulayın; çünkü sağlayıcılar ve kanallar çekirdekten
çıktıkça Plugin sahipliği ve yapılandırma kapsamı değişebilir.

## Plugin denetleyicisi paketi

Plugin denetleyicisi, sürümlenmiş uyumluluk ve manifest sözleşmeleriyle
desteklenen ayrı bir paket/depo olarak çekirdek OpenClaw deposunun dışında
bulunmalıdır.

İlk gün CLI şu olmalıdır:

```sh
openclaw-plugin-inspector ./my-plugin
```

Şunları çıktılamalıdır:

- manifest/şema doğrulaması
- kontrol edilen sözleşme uyumluluk sürümü
- kurulum/kaynak meta veri kontrolleri
- soğuk yol içe aktarma kontrolleri
- kullanımdan kaldırma ve uyumluluk uyarıları

CI açıklamalarında kararlı, makinece okunabilir çıktı için `--json` kullanın.
OpenClaw çekirdeği, denetleyicinin tüketebileceği sözleşmeleri ve fixture'ları
sunmalıdır, ancak denetleyici ikilisini ana `openclaw` paketinden
yayımlamamalıdır.

### Bakım sorumlusu kabul hattı

Harici denetleyiciyi OpenClaw Plugin paketlerine karşı doğrularken kurulabilir
paket kabul hattı için Blacksmith Testbox kullanın. Paket derlendikten sonra
temiz bir OpenClaw checkout'ından çalıştırın:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Bu hattı bakım sorumluları için isteğe bağlı tutun; çünkü harici bir npm paketi
kurar ve depo dışında klonlanmış Plugin paketlerini denetleyebilir. Yerel depo
korumaları SDK dışa aktarma haritasını, uyumluluk kayıt defteri meta verilerini,
kullanımdan kaldırılmış SDK içe aktarma azaltımını ve paketli uzantı içe aktarma
sınırlarını kapsar; Testbox denetleyici kanıtı ise paketi harici Plugin
yazarlarının tükettiği şekilde kapsar.

## Kullanımdan kaldırma politikası

OpenClaw, yerine geçecek sözleşmeyi tanıttığı aynı sürümde belgelenmiş bir
Plugin sözleşmesini kaldırmamalıdır.

Geçiş sırası şöyledir:

1. Yeni sözleşmeyi ekleyin.
2. Eski davranışı adlandırılmış bir uyumluluk adaptörü üzerinden bağlı tutun.
3. Plugin yazarları işlem yapabildiğinde tanılamalar veya uyarılar yayımlayın.
4. Yerine geçeni ve zaman çizelgesini belgeleyin.
5. Hem eski hem de yeni yolları test edin.
6. Duyurulan geçiş penceresi boyunca bekleyin.
7. Yalnızca açık breaking-release onayıyla kaldırın.

Kullanımdan kaldırılmış kayıtlar bir uyarı başlangıç tarihi, yerine geçecek öğe,
doküman bağlantısı ve uyarı başladıktan en fazla üç ay sonrası için nihai
kaldırma tarihi içermelidir. Bakım sorumluları bunun kalıcı uyumluluk olduğuna
açıkça karar verip bunun yerine `active` olarak işaretlemedikçe, ucu açık
kaldırma penceresi olan kullanımdan kaldırılmış bir uyumluluk yolu eklemeyin.

## Geçerli uyumluluk alanları

Geçerli uyumluluk kayıtları şunları içerir:

- `openclaw/plugin-sdk/compat` gibi eski geniş SDK içe aktarmaları
- eski yalnızca hook içeren Plugin şekilleri ve `before_agent_start`
- Plugin'ler `register(api)` biçimine geçerken eski `activate(api)` Plugin giriş noktaları
- `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  durum oluşturucuları, `openclaw/plugin-sdk/test-utils` (odaklı
  `openclaw/plugin-sdk/*` test alt yollarıyla değiştirilmiştir) ve `ClawdbotConfig` /
  `OpenClawSchemaType` tür diğer adları gibi eski SDK diğer adları
- paketli Plugin izin listesi ve etkinleştirme davranışı
- eski sağlayıcı/kanal env-var manifest meta verileri
- sağlayıcılar açık katalog, auth, düşünme, tekrar oynatma ve aktarım hook'larına
  geçerken eski sağlayıcı Plugin hook'ları ve tür diğer adları
- `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` ve kullanımdan kaldırılmış
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  gibi eski çalışma zamanı diğer adları
- bellek plugin'leri `registerMemoryCapability` biçimine geçerken eski bellek-Plugin bölünmüş kaydı
- yerel mesaj şemaları, mention gating,
  gelen envelope biçimlendirmesi ve onay yeteneği iç içe yerleştirmesi için eski kanal SDK yardımcıları
- Plugin'ler `openclaw/plugin-sdk/channel-route` biçimine geçerken eski kanal rota anahtarı ve karşılaştırılabilir-hedef yardımcı diğer adları
- manifest katkı sahipliğiyle değiştirilen etkinleştirme ipuçları
- `activation.onStartup` bildirmemiş Plugin'ler için kullanımdan kaldırılmış örtük başlangıç sidecar yüklemesi; bakım sorumluları gelecekteki daha katı davranışı
  `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` ile test edebilir
- kurulum tanımlayıcıları soğuk `setup.requiresRuntime: false` meta verilerine geçerken
  `setup-api` çalışma zamanı fallback'i
- sağlayıcı katalog hook'ları `catalog.run(...)` biçimine geçerken sağlayıcı `discovery` hook'ları
- kanal paketleri `openclaw.channel.exposure` biçimine geçerken kanal
  `showConfigured` / `showInSetup` meta verileri
- doctor operatörleri `agentRuntime` biçimine geçirirken eski runtime-policy yapılandırma anahtarları
- registry-first `channelConfigs` meta verileri gelirken oluşturulmuş paketli kanal yapılandırma meta verileri fallback'i
- onarım akışları operatörleri `openclaw plugins registry --refresh` ve
  `openclaw doctor --fix` biçimine geçirirken kalıcı Plugin kayıt defteri devre dışı bırakma ve kurulum-geçiş env bayrakları
- doctor bunları `plugins.entries.<plugin>.config` biçimine geçirirken eski Plugin'e ait web araması, web fetch ve x_search yapılandırma yolları
- kurulum meta verileri durum tarafından yönetilen Plugin defterine taşınırken eski `plugins.installs` yazılmış yapılandırması ve paketli Plugin yükleme-yolu diğer adları

Yeni Plugin kodu, kayıt defterinde ve ilgili geçiş kılavuzunda listelenen
yerine geçeni tercih etmelidir. Mevcut Plugin'ler, dokümanlar, tanılamalar ve
sürüm notları bir kaldırma penceresi duyurana kadar uyumluluk yolunu kullanmaya
devam edebilir.

## Sürüm notları

Sürüm notları, hedef tarihleri ve geçiş dokümanlarına bağlantılarıyla yaklaşan
Plugin kullanımdan kaldırmalarını içermelidir. Bu uyarının, bir uyumluluk yolu
`removal-pending` veya `removed` durumuna geçmeden önce yapılması gerekir.
