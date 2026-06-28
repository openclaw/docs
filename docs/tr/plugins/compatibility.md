---
read_when:
    - Bir OpenClaw Plugin'inin bakımını yapıyorsunuz
    - Bir Plugin uyumluluk uyarısı görüyorsunuz
    - Bir Plugin SDK veya manifest geçişi planlıyorsunuz
summary: Plugin uyumluluk sözleşmeleri, kullanımdan kaldırma meta verileri ve geçiş beklentileri
title: Plugin uyumluluğu
x-i18n:
    generated_at: "2026-06-28T00:53:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw, eski Plugin sözleşmelerini kaldırmadan önce adlandırılmış uyumluluk
adaptörleri üzerinden bağlı tutar. Bu, SDK, manifest, kurulum, yapılandırma ve
ajan çalışma zamanı sözleşmeleri gelişirken mevcut paketlenmiş ve harici
Plugin'leri korur.

## Uyumluluk kayıt defteri

Plugin uyumluluk sözleşmeleri, çekirdek kayıt defterinde
`src/plugins/compat/registry.ts` konumunda izlenir.

Her kayıtta şunlar bulunur:

- kararlı bir uyumluluk kodu
- durum: `active`, `deprecated`, `removal-pending` veya `removed`
- sahip: SDK, yapılandırma, kurulum, kanal, sağlayıcı, Plugin yürütme, ajan çalışma zamanı
  veya çekirdek
- geçerli olduğunda tanıtım ve kullanımdan kaldırma tarihleri
- değiştirme rehberliği
- eski ve yeni davranışı kapsayan dokümanlar, tanılamalar ve testler

Kayıt defteri, bakımcı planlaması ve gelecekteki Plugin denetleyici kontrolleri
için kaynaktır. Plugin'e dönük bir davranış değişirse adaptörü ekleyen aynı
değişiklikte uyumluluk kaydını ekleyin veya güncelleyin.

Doctor onarım ve geçiş uyumluluğu ayrı olarak
`src/commands/doctor/shared/deprecation-compat.ts` konumunda izlenir. Bu
kayıtlar, çalışma zamanı uyumluluk yolu kaldırıldıktan sonra kullanılabilir
kalması gerekebilecek eski yapılandırma şekillerini, kurulum defteri
düzenlerini ve onarım shim'lerini kapsar.

Sürüm taramaları her iki kayıt defterini de kontrol etmelidir. Eşleşen çalışma
zamanı veya yapılandırma uyumluluk kaydı süresi doldu diye bir doctor geçişini
silmeyin; önce onarıma hâlâ ihtiyaç duyan desteklenen bir yükseltme yolu
olmadığını doğrulayın. Ayrıca, sağlayıcılar ve kanallar çekirdekten dışarı
taşındıkça Plugin sahipliği ve yapılandırma ayak izi değişebileceği için sürüm
planlaması sırasında her değiştirme notunu yeniden doğrulayın.

## Plugin denetleyici paketi

Plugin denetleyici, çekirdek OpenClaw deposunun dışında, sürümlenmiş uyumluluk
ve manifest sözleşmeleriyle desteklenen ayrı bir paket/depo olarak yaşamalıdır.

İlk gün CLI şu olmalıdır:

```sh
openclaw-plugin-inspector ./my-plugin
```

Şunları üretmelidir:

- manifest/şema doğrulaması
- denetlenen sözleşme uyumluluk sürümü
- kurulum/kaynak meta veri kontrolleri
- soğuk yol içe aktarma kontrolleri
- kullanımdan kaldırma ve uyumluluk uyarıları

CI açıklamalarında kararlı makine tarafından okunabilir çıktı için `--json`
kullanın. OpenClaw çekirdeği, denetleyicinin tüketebileceği sözleşmeleri ve
fikstürleri sunmalıdır, ancak denetleyici ikilisini ana `openclaw` paketinden
yayımlamamalıdır.

### Bakımcı kabul hattı

Harici denetleyiciyi OpenClaw Plugin paketlerine karşı doğrularken kurulabilir
paket kabul hattı için Crabbox destekli Blacksmith Testbox kullanın. Paket
derlendikten sonra bunu temiz bir OpenClaw checkout'ından çalıştırın:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Bu hattı bakımcılar için isteğe bağlı tutun, çünkü harici bir npm paketi kurar
ve depo dışında klonlanmış Plugin paketlerini inceleyebilir. Yerel depo
korumaları SDK dışa aktarma haritasını, uyumluluk kayıt defteri meta verilerini,
kullanımdan kaldırılmış SDK içe aktarma azaltımını ve paketlenmiş uzantı içe
aktarma sınırlarını kapsar; Testbox denetleyici kanıtı ise paketi harici Plugin
yazarlarının tükettiği biçimde kapsar.

## Kullanımdan kaldırma politikası

OpenClaw, belgelenmiş bir Plugin sözleşmesini, yerine geçen sözleşmeyi tanıttığı
aynı sürümde kaldırmamalıdır.

Geçiş sırası şöyledir:

1. Yeni sözleşmeyi ekleyin.
2. Eski davranışı adlandırılmış bir uyumluluk adaptörü üzerinden bağlı tutun.
3. Plugin yazarları işlem yapabildiğinde tanılama veya uyarı yayınlayın.
4. Yerine geçen sözleşmeyi ve zaman çizelgesini belgeleyin.
5. Eski ve yeni yolların ikisini de test edin.
6. Duyurulan geçiş penceresi boyunca bekleyin.
7. Yalnızca açık kırıcı sürüm onayıyla kaldırın.

Kullanımdan kaldırılmış kayıtlar bir uyarı başlangıç tarihi, yerine geçen
sözleşme, doküman bağlantısı ve uyarı başladıktan en fazla üç ay sonraki nihai
kaldırma tarihini içermelidir. Bakımcılar bunun kalıcı uyumluluk olduğuna açıkça
karar verip bunun yerine `active` olarak işaretlemedikçe, ucu açık kaldırma
penceresi olan kullanımdan kaldırılmış bir uyumluluk yolu eklemeyin.

## Mevcut uyumluluk alanları

Mevcut uyumluluk kayıtları şunları içerir:

- `openclaw/plugin-sdk/compat` gibi eski geniş SDK içe aktarmaları
- eski yalnızca hook tabanlı Plugin şekilleri ve `before_agent_start`
- Plugin'ler `gateway_stop` öğesine geçerken eski `api.on("deactivate", ...)`
  temizleme hook adları
- Plugin'ler `register(api)` öğesine geçerken eski `activate(api)` Plugin giriş noktaları
- `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`
  durum oluşturucuları, `openclaw/plugin-sdk/test-utils` (odaklı
  `openclaw/plugin-sdk/*` test alt yollarıyla değiştirilmiştir) ve
  `ClawdbotConfig` /
  `OpenClawSchemaType` tür takma adları gibi eski SDK takma adları
- paketlenmiş Plugin izin listesi ve etkinleştirme davranışı
- eski sağlayıcı/kanal env-var manifest meta verileri
- sağlayıcılar açık katalog, kimlik doğrulama, düşünme, yeniden oynatma ve
  taşıma hook'larına geçerken eski sağlayıcı Plugin hook'ları ve tür takma adları
- `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` ve kullanımdan kaldırılmış
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  gibi eski çalışma zamanı takma adları
- callback tüketicileri iç içe
  `WebInboundCallbackMessage` `event`, `payload`, `quote`, `group` ve
  `platform` bağlamlarına geçerken WhatsApp `WebInboundMessage` düz callback
  alanları; örneğin `body`, `chatId`,
  `reply(...)` ve `mediaPath`
- callback tüketicileri `admission` zarfına geçerken WhatsApp
  `WebInboundMessage` üst düzey kabul alanları; örneğin `from`,
  `conversationId`, `accountId`, `accessControlPassed` ve `chatType`
- bellek Plugin'leri `registerMemoryCapability` öğesine geçerken eski bellek
  Plugin bölünmüş kaydı
- gömme sağlayıcıları `api.registerEmbeddingProvider(...)` ve
  `contracts.embeddingProviders` öğelerine geçerken eski belleğe özgü gömme
  sağlayıcı kaydı
- yerel ileti şemaları, mention gating, gelen zarf biçimlendirme ve onay
  yeteneği iç içe yerleşimi için eski kanal SDK yardımcıları
- Plugin'ler `openclaw/plugin-sdk/channel-route` öğesine geçerken eski kanal
  rota anahtarı ve karşılaştırılabilir hedef yardımcı takma adları
- manifest katkı sahipliğiyle değiştirilen etkinleştirme ipuçları
- kurulum tanımlayıcıları soğuk `setup.requiresRuntime: false` meta verilerine
  geçerken `setup-api` çalışma zamanı geri dönüşü
- sağlayıcı katalog hook'ları `catalog.run(...)` öğesine geçerken sağlayıcı
  `discovery` hook'ları
- kanal paketleri `openclaw.channel.exposure` öğesine geçerken kanal
  `showConfigured` / `showInSetup` meta verileri
- doctor operatörleri `agentRuntime` öğesine geçirirken eski çalışma zamanı
  politikası yapılandırma anahtarları
- kayıt defteri öncelikli `channelConfigs` meta verileri gelirken üretilmiş
  paketlenmiş kanal yapılandırma meta verisi geri dönüşü
- onarım akışları operatörleri `openclaw plugins registry --refresh` ve
  `openclaw doctor --fix` öğelerine geçirirken kalıcı Plugin kayıt defteri
  devre dışı bırakma ve kurulum geçişi env bayrakları
- doctor bunları `plugins.entries.<plugin>.config` öğesine geçirirken eski
  Plugin sahipli web search, web fetch ve x_search yapılandırma yolları
- kurulum meta verileri durum tarafından yönetilen Plugin defterine taşınırken
  eski `plugins.installs` yazılmış yapılandırması ve paketlenmiş Plugin yükleme
  yolu takma adları

Yeni Plugin kodu, kayıt defterinde ve belirli geçiş kılavuzunda listelenen
yerine geçeni tercih etmelidir. Mevcut Plugin'ler, dokümanlar, tanılamalar ve
sürüm notları bir kaldırma penceresi duyurana kadar uyumluluk yolunu kullanmaya
devam edebilir.

### WhatsApp Gelen Callback Düz Takma Adları

WhatsApp çalışma zamanı callback'leri `WebInboundMessage` teslim eder: kanonik
iç içe `event`, `payload`, `quote`, `group` ve `platform` bağlamları ile
yayınlanmış callback alanları için kullanımdan kaldırılmış düz takma adlar.
Yeni callback kodu iç içe bağlamları okumalıdır. Temiz iç içe callback
iletileri oluşturan kod `WebInboundCallbackMessage` kullanabilir; hâlâ eski düz
test veya Plugin iletileri enjekte eden uyumluluk dinleyicileri
`LegacyFlatWebInboundMessage` veya `WebInboundMessageInput` kullanmalıdır.

Düz takma adlar **2026-08-30** tarihine kadar kullanılabilir kalır. Bu kaldırma
penceresi yalnızca düz takma ad erişimi için geçerlidir; iç içe callback şekli
kanonik çalışma zamanı sözleşmesidir. Her düz takma addaki TypeScript
`@deprecated` notları, onun tam iç içe yerine geçenini adlandırır. Yaygın
örnekler:

- `id`, `timestamp` ve `isBatched`, `event` altına taşınır.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` ve
  `untrustedStructuredContext`, `payload` altına taşınır.
- `to`, `chatId`, gönderen/kendi alanları, `sendComposing`, `reply(...)` ve
  `sendMedia(...)`, `platform` altına taşınır.
- `replyTo*` alanları `quote` altına, grup konu/katılımcı/mention alanları
  `group` altına taşınır.

`payload.untrustedStructuredContext`, gelen sağlayıcı payload'larından çıkarılır.
Plugin'ler, onun `payload` değerini yetkili kabul etmeden önce `label`, `source`
ve `type` değerlerini incelemelidir.

### WhatsApp Gelen Kabul Alanları

Kabul edilen WhatsApp callback iletileri artık iletiyi kabul eden erişim
kontrolü kararı için herkese açık güvenli bir zarf olan `admission` taşır. Yeni
callback kodu, kabul olgularını eski üst düzey kabul alanları yerine
`msg.admission` üzerinden okumalıdır.

Üst düzey alanlar **2026-08-30** tarihine kadar kullanılabilir kalır.
TypeScript `@deprecated` notları her yerine geçeni adlandırır:

- `from` ve `conversationId`, `admission.conversation.id` öğesine taşınır.
- `accountId`, `admission.accountId` öğesine taşınır.
- `accessControlPassed`,
  `admission.ingress.decision === "allow"` değerinin türetilmiş bir uyumluluk
  görünümüdür; zaten `admission` taşıyan iletilerde eski boolean değerini yazmak
  ingress grafiğini yeniden yazmaz.
- `chatType`, `admission.conversation.kind` öğesine taşınır.

## Sürüm notları

Sürüm notları, hedef tarihler ve geçiş dokümanlarına bağlantılarla birlikte
yaklaşan Plugin kullanımdan kaldırmalarını içermelidir. Bu uyarı, bir uyumluluk
yolu `removal-pending` veya `removed` durumuna geçmeden önce yapılmalıdır.
