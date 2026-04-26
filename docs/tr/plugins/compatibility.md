---
read_when:
    - Bir OpenClaw Plugin'ini sürdürüyorunuz.
    - Bir Plugin uyumluluk uyarısı görüyorsunuz.
    - Bir Plugin SDK veya manifest geçişi planlıyorsunuz.
summary: Plugin uyumluluk sözleşmeleri, kullanımdan kaldırma meta verileri ve geçiş beklentileri
title: Plugin uyumluluğu
x-i18n:
    generated_at: "2026-04-26T11:36:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw, eski Plugin sözleşmelerini kaldırmadan önce bunları adlandırılmış uyumluluk
bağdaştırıcıları üzerinden çalışır durumda tutar. Bu, SDK, manifest, kurulum, yapılandırma ve ajan çalışma zamanı sözleşmeleri gelişirken mevcut paketlenmiş ve harici
Plugin'leri korur.

## Uyumluluk kayıt defteri

Plugin uyumluluk sözleşmeleri çekirdek kayıt defterinde
`src/plugins/compat/registry.ts` içinde izlenir.

Her kayıt şunları içerir:

- kararlı bir uyumluluk kodu
- durum: `active`, `deprecated`, `removal-pending` veya `removed`
- sahip: SDK, yapılandırma, kurulum, kanal, sağlayıcı, Plugin yürütme, ajan çalışma zamanı
  veya çekirdek
- uygulanabildiğinde tanıtım ve kullanımdan kaldırma tarihleri
- değiştirme rehberliği
- eski ve yeni davranışı kapsayan belgeler, tanılamalar ve testler

Kayıt defteri, bakımcı planlaması ve gelecekteki Plugin inspector
denetimleri için kaynaktır. Plugin'e dönük bir davranış değişirse, bağdaştırıcıyı ekleyen değişiklikte uyumluluk kaydını da ekleyin veya güncelleyin.

Doctor onarım ve geçiş uyumluluğu ayrı olarak
`src/commands/doctor/shared/deprecation-compat.ts` içinde izlenir. Bu kayıtlar,
çalışma zamanı uyumluluk yolu kaldırıldıktan sonra da kullanılabilir kalması gerekebilecek eski
yapılandırma biçimlerini, kurulum ledger düzenlerini ve onarım shim'lerini kapsar.

Sürüm taramaları her iki kayıt defterini de denetlemelidir. Eşleşen çalışma zamanı veya yapılandırma uyumluluk kaydı sona erdi diye bir doctor geçişini
silin; önce onarıma hâlâ ihtiyaç duyan desteklenen bir yükseltme yolu olmadığını doğrulayın. Ayrıca her değiştirme açıklamasını sürüm planlaması sırasında yeniden doğrulayın çünkü sağlayıcılar ve kanallar çekirdek dışına taşındıkça Plugin sahipliği ve yapılandırma ayak izi değişebilir.

## Plugin inspector paketi

Plugin inspector, sürümlenmiş uyumluluk ve manifest
sözleşmeleriyle desteklenen ayrı bir paket/depo olarak çekirdek OpenClaw reposunun dışında yaşamalıdır.

İlk gün CLI şu olmalıdır:

```sh
openclaw-plugin-inspector ./my-plugin
```

Şunları üretmelidir:

- manifest/şema doğrulaması
- denetlenen sözleşme uyumluluk sürümü
- kurulum/kaynak meta veri denetimleri
- soğuk yol import denetimleri
- kullanımdan kaldırma ve uyumluluk uyarıları

CI açıklamalarında kararlı makine tarafından okunabilir çıktı için `--json`
kullanın. OpenClaw çekirdeği, inspector'ın tüketebileceği sözleşmeleri ve fixture'ları açığa çıkarmalıdır, ancak inspector ikili dosyasını ana `openclaw` paketinden yayımlamamalıdır.

## Kullanımdan kaldırma ilkesi

OpenClaw, belgelenmiş bir Plugin sözleşmesini, değiştirmesini tanıttığı aynı sürümde
kaldırmamalıdır.

Geçiş sırası şöyledir:

1. Yeni sözleşmeyi ekleyin.
2. Eski davranışı adlandırılmış bir uyumluluk bağdaştırıcısı üzerinden çalışır durumda tutun.
3. Plugin yazarlarının harekete geçebileceği tanılamalar veya uyarılar verin.
4. Değiştirmeyi ve zaman çizelgesini belgelendirin.
5. Hem eski hem yeni yolları test edin.
6. Duyurulan geçiş penceresi boyunca bekleyin.
7. Yalnızca açık kırıcı sürüm onayıyla kaldırın.

Kullanımdan kaldırılmış kayıtlar, uyarı başlangıç tarihi, değiştirme, belge bağlantısı
ve uyarı başladıktan en geç üç ay sonraki son kaldırma tarihini içermelidir. Bakımcılar bunun kalıcı uyumluluk olduğuna açıkça karar verip durumu bunun yerine `active` olarak işaretlemedikçe, ucu açık kaldırma penceresine sahip kullanımdan kaldırılmış bir uyumluluk yolu eklemeyin.

## Geçerli uyumluluk alanları

Geçerli uyumluluk kayıtları şunları içerir:

- `openclaw/plugin-sdk/compat` gibi eski geniş SDK import'ları
- eski yalnızca hook tabanlı Plugin biçimleri ve `before_agent_start`
- Plugin'ler `register(api)` yapısına geçerken eski `activate(api)` Plugin giriş noktaları
- `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  durum oluşturucuları, `openclaw/plugin-sdk/test-utils` ve `ClawdbotConfig` /
  `OpenClawSchemaType` tür takma adları gibi eski SDK takma adları
- paketlenmiş Plugin izin listesi ve etkinleştirme davranışı
- eski sağlayıcı/kanal env-var manifest meta verileri
- sağlayıcılar açık katalog, auth, thinking, replay ve transport hook'larına
  taşınırken eski sağlayıcı Plugin hook'ları ve tür takma adları
- `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession` ve `api.runtime.stt` gibi eski çalışma zamanı takma adları
- bellek Plugin'leri `registerMemoryCapability` yapısına geçerken eski memory-plugin ayrık kayıt yapısı
- yerel mesaj şemaları, mention geçitlemesi,
  gelen envelope biçimlendirmesi ve approval capability yuvalaması için eski kanal SDK yardımcıları
- manifest contribution sahipliği ile değiştirilen activation hint'leri
- kurulum tanımlayıcıları soğuk
  `setup.requiresRuntime: false` meta verisine taşınırken `setup-api` çalışma zamanı geri dönüşü
- sağlayıcı katalog hook'ları `catalog.run(...)` yapısına taşınırken sağlayıcı `discovery` hook'ları
- kanal paketleri
  `openclaw.channel.exposure` yapısına taşınırken kanal `showConfigured` / `showInSetup` meta verileri
- doctor operatörleri
  `agentRuntime` alanına taşırken eski runtime-policy yapılandırma anahtarları
- kayıt-defteri öncelikli
  `channelConfigs` meta verileri gelirken üretilmiş paketlenmiş kanal yapılandırma meta verisi geri dönüşü
- onarım akışları operatörleri `openclaw plugins registry --refresh` ve
  `openclaw doctor --fix` komutlarına taşırken kalıcı Plugin kayıt defteri devre dışı bırakma ve install-migration env bayrakları
- doctor bunları `plugins.entries.<plugin>.config` yapısına taşırken eski Plugin sahipli web search, web fetch ve x_search yapılandırma yolları
- kurulum meta verileri durum tarafından yönetilen Plugin ledger'ına taşınırken
  eski `plugins.installs` yazarlı yapılandırma ve paketlenmiş Plugin yükleme yolu takma adları

Yeni Plugin kodu kayıt defterinde ve ilgili
geçiş kılavuzunda listelenen değiştirmeyi tercih etmelidir. Mevcut Plugin'ler, belgeler, tanılamalar ve sürüm notları bir kaldırma penceresi duyurana kadar bir uyumluluk yolunu kullanmaya devam edebilir.

## Sürüm notları

Sürüm notları, hedef tarihler ve
geçiş belgelerine bağlantılarla yaklaşan Plugin kullanımdan kaldırmalarını içermelidir. Bu uyarı, bir uyumluluk yolunun `removal-pending` veya `removed` durumuna geçmesinden önce yapılmalıdır.
