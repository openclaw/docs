---
read_when:
    - Bir OpenClaw Plugin'inin bakımını yapıyorsunuz
    - Bir Plugin uyumluluk uyarısı görüyorsunuz
    - Bir Plugin SDK'sı veya manifest geçişi planlıyorsunuz
summary: Plugin uyumluluk sözleşmeleri, kullanımdan kaldırma meta verileri ve geçiş beklentileri
title: Plugin uyumluluğu
x-i18n:
    generated_at: "2026-05-02T09:00:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw, SDK, manifest, kurulum, yapılandırma ve ajan çalışma zamanı sözleşmeleri gelişirken mevcut paketlenmiş ve harici Plugin'leri korumak için eski Plugin sözleşmelerini kaldırmadan önce adlandırılmış uyumluluk bağdaştırıcıları üzerinden bağlı tutar.

## Uyumluluk kayıt defteri

Plugin uyumluluk sözleşmeleri çekirdek kayıt defterinde izlenir:
`src/plugins/compat/registry.ts`.

Her kayıtta şunlar bulunur:

- kararlı bir uyumluluk kodu
- durum: `active`, `deprecated`, `removal-pending` veya `removed`
- sahip: SDK, yapılandırma, kurulum, kanal, sağlayıcı, Plugin yürütme, ajan çalışma zamanı
  veya çekirdek
- geçerliyse tanıtım ve kullanımdan kaldırma tarihleri
- değiştirme rehberliği
- eski ve yeni davranışı kapsayan belgeler, tanılamalar ve testler

Kayıt defteri, bakımcı planlaması ve gelecekteki Plugin denetleyici kontrolleri için kaynaktır. Plugin'e dönük bir davranış değişirse, bağdaştırıcıyı ekleyen değişiklikle aynı değişiklikte uyumluluk kaydını ekleyin veya güncelleyin.

Doctor onarımı ve taşıma uyumluluğu ayrı olarak
`src/commands/doctor/shared/deprecation-compat.ts` içinde izlenir. Bu kayıtlar, çalışma zamanı uyumluluk yolu kaldırıldıktan sonra da kullanılabilir kalması gerekebilecek eski yapılandırma şekillerini, kurulum defteri düzenlerini ve onarım shim'lerini kapsar.

Sürüm taramaları her iki kayıt defterini de kontrol etmelidir. Eşleşen çalışma zamanı veya yapılandırma uyumluluk kaydının süresi doldu diye bir doctor taşımasını silmeyin; önce onarıma hâlâ ihtiyaç duyan desteklenen bir yükseltme yolu olmadığını doğrulayın. Ayrıca sağlayıcılar ve kanallar çekirdekten çıktıkça Plugin sahipliği ve yapılandırma kapsamı değişebileceği için sürüm planlaması sırasında her değiştirme açıklamasını yeniden doğrulayın.

## Plugin denetleyici paketi

Plugin denetleyicisi, sürümlenmiş uyumluluk ve manifest sözleşmeleriyle desteklenen ayrı bir paket/depo olarak çekirdek OpenClaw deposunun dışında yaşamalıdır.

İlk gün CLI şu olmalıdır:

```sh
openclaw-plugin-inspector ./my-plugin
```

Şunları üretmelidir:

- manifest/şema doğrulaması
- kontrol edilen sözleşme uyumluluk sürümü
- kurulum/kaynak meta veri kontrolleri
- soğuk yol içe aktarma kontrolleri
- kullanımdan kaldırma ve uyumluluk uyarıları

CI açıklamalarında kararlı, makine tarafından okunabilir çıktı için `--json` kullanın. OpenClaw çekirdeği, denetleyicinin tüketebileceği sözleşmeleri ve fixture'ları sunmalıdır, ancak denetleyici ikilisini ana `openclaw` paketinden yayımlamamalıdır.

### Bakımcı kabul hattı

Harici denetleyiciyi OpenClaw Plugin paketlerine karşı doğrularken kurulabilir paket kabul hattı için Blacksmith Testbox kullanın. Paket oluşturulduktan sonra bunu temiz bir OpenClaw checkout'ından çalıştırın:

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

Bu hattı bakımcılar için isteğe bağlı tutun; çünkü harici bir npm paketi kurar ve deponun dışında klonlanan Plugin paketlerini denetleyebilir. Yerel depo korumaları SDK dışa aktarma haritasını, uyumluluk kayıt defteri meta verilerini, kullanımdan kaldırılmış SDK içe aktarma azaltımını ve paketlenmiş extension içe aktarma sınırlarını kapsar; Testbox denetleyici kanıtı ise paketi harici Plugin yazarlarının tükettiği şekilde kapsar.

## Kullanımdan kaldırma politikası

OpenClaw, belgelenmiş bir Plugin sözleşmesini, onun yerine geçen sözleşmeyi tanıttığı aynı sürümde kaldırmamalıdır.

Taşıma sırası şöyledir:

1. Yeni sözleşmeyi ekleyin.
2. Eski davranışı adlandırılmış bir uyumluluk bağdaştırıcısı üzerinden bağlı tutun.
3. Plugin yazarları eyleme geçebildiğinde tanılama veya uyarı üretin.
4. Yerine geçen çözümü ve zaman çizelgesini belgeleyin.
5. Eski ve yeni yolların ikisini de test edin.
6. Duyurulan taşıma penceresi boyunca bekleyin.
7. Yalnızca açıkça kırıcı sürüm onayıyla kaldırın.

Kullanımdan kaldırılmış kayıtlar bir uyarı başlangıç tarihi, yerine geçen çözüm, belge bağlantısı ve uyarı başladıktan en fazla üç ay sonrasına denk gelen nihai kaldırma tarihi içermelidir. Bakımcılar bunun kalıcı uyumluluk olduğuna açıkça karar verip bunun yerine `active` olarak işaretlemedikçe, açık uçlu kaldırma penceresine sahip kullanımdan kaldırılmış bir uyumluluk yolu eklemeyin.

## Geçerli uyumluluk alanları

Geçerli uyumluluk kayıtları şunları içerir:

- `openclaw/plugin-sdk/compat` gibi eski geniş SDK içe aktarmaları
- eski yalnızca hook içeren Plugin şekilleri ve `before_agent_start`
- Plugin'ler `register(api)` öğesine taşınırken eski `activate(api)` Plugin giriş noktaları
- `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  durum oluşturucuları, `openclaw/plugin-sdk/test-utils` (odaklı
  `openclaw/plugin-sdk/*` test alt yollarıyla değiştirildi) gibi eski SDK takma adları ve `ClawdbotConfig` /
  `OpenClawSchemaType` tür takma adları
- paketlenmiş Plugin izin listesi ve etkinleştirme davranışı
- eski sağlayıcı/kanal env-var manifest meta verileri
- sağlayıcılar açık katalog, kimlik doğrulama, düşünme, yeniden oynatma ve taşıma hook'larına taşınırken eski sağlayıcı Plugin hook'ları ve tür takma adları
- `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` ve kullanımdan kaldırılmış
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` gibi eski çalışma zamanı takma adları
- bellek Plugin'leri `registerMemoryCapability` öğesine taşınırken eski bellek Plugin'i bölünmüş kaydı
- yerel ileti şemaları, bahsetme geçidi, gelen zarf biçimlendirmesi ve onay yeteneği iç içe yerleşimi için eski kanal SDK yardımcıları
- Plugin'ler `openclaw/plugin-sdk/channel-route` öğesine taşınırken eski kanal rota anahtarı ve karşılaştırılabilir hedef yardımcı takma adları
- manifest katkı sahipliğiyle değiştirilen etkinleştirme ipuçları
- kurulum tanımlayıcıları soğuk
  `setup.requiresRuntime: false` meta verilerine taşınırken `setup-api` çalışma zamanı fallback'i
- sağlayıcı katalog hook'ları `catalog.run(...)` öğesine taşınırken sağlayıcı `discovery` hook'ları
- kanal paketleri `openclaw.channel.exposure` öğesine taşınırken kanal `showConfigured` / `showInSetup` meta verileri
- doctor operatörleri `agentRuntime` öğesine taşırken eski runtime-policy yapılandırma anahtarları
- registry-first
  `channelConfigs` meta verileri gelene kadar üretilmiş paketlenmiş kanal yapılandırma meta verileri fallback'i
- onarım akışları operatörleri `openclaw plugins registry --refresh` ve
  `openclaw doctor --fix` öğelerine taşırken kalıcı Plugin kayıt defteri devre dışı bırakma ve kurulum taşıma env bayrakları
- doctor bunları `plugins.entries.<plugin>.config` öğesine taşırken eski Plugin sahipli web arama, web getirme ve x_search yapılandırma yolları
- kurulum meta verileri durum tarafından yönetilen Plugin defterine taşınırken eski `plugins.installs` yazılmış yapılandırması ve paketlenmiş Plugin yükleme yolu takma adları

Yeni Plugin kodu, kayıt defterinde ve ilgili taşıma kılavuzunda listelenen yerine geçen çözümü tercih etmelidir. Mevcut Plugin'ler, belgeler, tanılamalar ve sürüm notları bir kaldırma penceresi duyurana kadar uyumluluk yolunu kullanmaya devam edebilir.

## Sürüm notları

Sürüm notları, hedef tarihleri ve taşıma belgelerine bağlantılarıyla birlikte yaklaşan Plugin kullanımdan kaldırmalarını içermelidir. Bu uyarı, bir uyumluluk yolu `removal-pending` veya `removed` durumuna geçmeden önce yapılmalıdır.
