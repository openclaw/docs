---
read_when:
    - Bir OpenClaw Plugin'inin bakımını yapıyorsunuz
    - Plugin uyumluluğu uyarısı görüyorsunuz
    - Bir Plugin SDK'sı veya manifest geçişi planlıyorsunuz
summary: Plugin uyumluluk sözleşmeleri, kullanımdan kaldırma meta verileri ve geçiş beklentileri
title: Plugin uyumluluğu
x-i18n:
    generated_at: "2026-07-12T12:32:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw, eski Plugin sözleşmelerini kaldırmadan önce adlandırılmış uyumluluk
adaptörleri üzerinden bağlı tutar. Bu, SDK, manifest, kurulum, yapılandırma ve
ajan çalışma zamanı sözleşmeleri gelişirken mevcut paketlenmiş ve harici
Plugin'leri korur.

## Uyumluluk kayıt defteri

Plugin uyumluluk sözleşmeleri, `src/plugins/compat/registry.ts` konumundaki
çekirdek kayıt defterinde izlenir. Her kayıt şunları içerir:

- kararlı bir uyumluluk kodu
- durum: `active`, `deprecated`, `removal-pending` veya `removed`
- sahip: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`,
  `agent-runtime` veya `core`
- geçerli olduğunda kullanıma sunma ve kullanımdan kaldırma tarihleri
- yerine kullanılacak çözüme ilişkin yönlendirme
- eski ve yeni davranışı kapsayan belgeler, tanılamalar ve testler

Kayıt defteri, bakım sorumlularının planlaması ve gelecekteki Plugin
denetleyicisi kontrolleri için kaynaktır. Plugin'lere yönelik bir davranış
değişirse adaptörü ekleyen değişiklikle birlikte uyumluluk kaydını da ekleyin
veya güncelleyin.

Doctor onarım ve geçiş uyumluluğu,
`src/commands/doctor/shared/deprecation-compat.ts` konumunda ayrı olarak
izlenir. Bu kayıtlar, çalışma zamanı uyumluluk yolu kaldırıldıktan sonra da
kullanılabilir kalması gerekebilecek eski yapılandırma biçimlerini, kurulum
kayıt defteri düzenlerini ve onarım uyumluluk katmanlarını kapsar.

Sürüm taramalarında her iki kayıt defteri de kontrol edilmelidir. Eşleşen
çalışma zamanı veya yapılandırma uyumluluk kaydının süresi doldu diye bir
Doctor geçişini silmeyin; önce onarıma hâlâ ihtiyaç duyan desteklenen bir
yükseltme yolu bulunmadığını doğrulayın. Sağlayıcılar ve kanallar çekirdekten
çıkarıldıkça Plugin sahipliği ile yapılandırma kapsamı değişebileceğinden,
sürüm planlaması sırasında her yerine geçme açıklamasını da yeniden
doğrulayın.

## Kullanımdan kaldırma politikası

OpenClaw, belgelenmiş bir Plugin sözleşmesini yerine geçecek sözleşmenin
sunulduğu sürümde kaldırmamalıdır. Geçiş sırası:

1. Yeni sözleşmeyi ekleyin.
2. Eski davranışı adlandırılmış bir uyumluluk adaptörü üzerinden bağlı tutun.
3. Plugin yazarları işlem yapabildiğinde tanılama iletileri veya uyarılar yayınlayın.
4. Yerine kullanılacak çözümü ve zaman çizelgesini belgeleyin.
5. Hem eski hem de yeni yolları test edin.
6. Duyurulan geçiş süresi boyunca bekleyin.
7. Yalnızca uyumluluğu bozan sürüm için açık onay alındığında kaldırın.

Kullanımdan kaldırılmış kayıtlar bir uyarı başlangıç tarihi, yerine kullanılacak
çözüm, belge bağlantısı ve uyarının başlamasından en fazla üç ay sonrasına
ait nihai kaldırma tarihi içermelidir. Bakım sorumluları bunun kalıcı uyumluluk
olduğuna açıkça karar verip kaydı bunun yerine `active` olarak işaretlemedikçe,
ucu açık bir kaldırma süresine sahip kullanımdan kaldırılmış bir uyumluluk yolu
eklemeyin.

## Güncel uyumluluk alanları

Kayıt defteri şu anda bu alanlarda yaklaşık 70 uyumluluk kodunu izler. Yeni
Plugin kodu, her alanda ve ilgili geçiş kılavuzunda belirtilen yerine geçecek
çözümü kullanmalıdır; mevcut Plugin'ler, belgeler, tanılamalar ve sürüm notları
bir kaldırma süresi duyurana kadar bir uyumluluk yolunu kullanmayı sürdürebilir.

- `openclaw/plugin-sdk/compat` gibi eski kapsamlı SDK içe aktarımları
- eski yalnızca kanca içeren Plugin biçimleri ve `before_agent_start`
- Plugin'ler `gateway_stop` kullanımına geçerken eski
  `api.on("deactivate", ...)` temizleme kancası adları
- Plugin'ler `register(api)` kullanımına geçerken eski `activate(api)` Plugin
  giriş noktaları
- `openclaw/extension-api`, `openclaw/plugin-sdk/channel-runtime`,
  `openclaw/plugin-sdk/command-auth` durum oluşturucuları,
  `openclaw/plugin-sdk/test-utils` (yerini odaklanmış
  `openclaw/plugin-sdk/*` test alt yolları almıştır) ve `ClawdbotConfig` /
  `OpenClawSchemaType` tür takma adları gibi eski SDK takma adları
- paketlenmiş Plugin izin listesi ve etkinleştirme davranışı
- eski sağlayıcı/kanal ortam değişkeni manifest meta verileri
- sağlayıcılar açık katalog, kimlik doğrulama, düşünme, yeniden oynatma ve
  taşıma kancalarına geçerken eski sağlayıcı Plugin kancaları ve tür takma adları
- `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt`
  gibi eski çalışma zamanı takma adları ve kullanımdan kaldırılmış
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- WhatsApp `WebInboundMessage` düz geri çağırma alanları (aşağıya bakın)
- WhatsApp `WebInboundMessage` üst düzey kabul alanları (aşağıya bakın)
- bellek Plugin'leri `registerMemoryCapability` kullanımına geçerken eski
  bölünmüş bellek Plugin'i kaydı
- gömme sağlayıcıları `api.registerEmbeddingProvider(...)` ve
  `contracts.embeddingProviders` kullanımına geçerken eski belleğe özgü
  gömme sağlayıcısı kaydı
- yerel ileti şemaları, bahsetme denetimi, gelen zarf biçimlendirmesi ve onay
  yeteneği iç içe yerleşimi için eski kanal SDK yardımcıları
- Plugin'ler `openclaw/plugin-sdk/channel-route` kullanımına geçerken eski
  kanal rota anahtarı ve karşılaştırılabilir hedef yardımcısı takma adları
- manifest katkısı sahipliğiyle değiştirilen etkinleştirme ipuçları
- kurulum tanımlayıcıları soğuk `setup.requiresRuntime: false` meta verilerine
  geçerken `setup-api` çalışma zamanı geri dönüşü
- sağlayıcı katalog kancaları `catalog.run(...)` kullanımına geçerken sağlayıcı
  `discovery` kancaları
- kanal paketleri `openclaw.channel.exposure` kullanımına geçerken kanal
  `showConfigured` / `showInSetup` meta verileri
- Doctor, operatörleri `agentRuntime` kullanımına geçirirken eski çalışma
  zamanı politikası yapılandırma anahtarları
- kayıt defteri öncelikli `channelConfigs` meta verileri kullanıma sunulurken,
  oluşturulmuş paketlenmiş kanal yapılandırma meta verileri geri dönüşü
- onarım akışları operatörleri `openclaw plugins registry --refresh` ve
  `openclaw doctor --fix` kullanımına geçirirken kalıcı Plugin kayıt defteri
  devre dışı bırakma ve kurulum geçişi ortam bayrakları
- Doctor bunları `plugins.entries.<plugin>.config` konumuna geçirirken eski
  Plugin sahipli web arama, web getirme ve x_search yapılandırma yolları
- kurulum meta verileri durum tarafından yönetilen Plugin kayıt defterine
  taşınırken eski kullanıcı tarafından yazılmış `plugins.installs`
  yapılandırması ve paketlenmiş Plugin yükleme yolu takma adları

### WhatsApp gelen geri çağırma düz takma adları

WhatsApp çalışma zamanı geri çağırmaları `WebInboundMessage` iletir: standart
iç içe `event`, `payload`, `quote`, `group` ve `platform` bağlamlarının yanı sıra
yayınlanmış geri çağırma alanları için kullanımdan kaldırılmış düz takma adlar.
Yeni geri çağırma kodu iç içe bağlamları okumalıdır. Temiz, iç içe geri çağırma
iletileri oluşturan kod `WebInboundCallbackMessage` kullanabilir; hâlâ eski düz
test veya Plugin iletileri ekleyen uyumluluk dinleyicileri
`LegacyFlatWebInboundMessage` ya da `WebInboundMessageInput` kullanmalıdır.

Düz takma adlar **2026-08-30** tarihine kadar kullanılabilir kalacaktır; bu süre,
standart çalışma zamanı sözleşmesi olan iç içe biçime değil, yalnızca düz takma
ad erişimine uygulanır. Her düz takma adın TypeScript `@deprecated` açıklaması,
tam olarak karşılık gelen iç içe alanı belirtir. Yaygın örnekler:

- `id`, `timestamp` ve `isBatched`, `event` altına taşınır.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location`
  ve `untrustedStructuredContext`, `payload` altına taşınır.
- `to`, `chatId`, gönderen/kendi alanları, `sendComposing`, `reply(...)` ve
  `sendMedia(...)`, `platform` altına taşınır.
- `replyTo*` alanları `quote` altına; grup konusu/katılımcı/bahsetme alanları
  ise `group` altına taşınır.

`payload.untrustedStructuredContext`, gelen sağlayıcı yüklerinden ayıklanır.
Plugin'ler bunun `payload` değerini güvenilir kabul etmeden önce `label`,
`source` ve `type` alanlarını incelemelidir.

### WhatsApp gelen ileti kabul alanları

Kabul edilen WhatsApp geri çağırma iletileri, iletiyi kabul eden erişim denetimi
kararının herkese açık olarak paylaşılması güvenli zarfı olan `admission`
alanını taşır. Yeni geri çağırma kodu, kabul bilgilerini eski üst düzey kabul
alanları yerine `msg.admission` üzerinden okumalıdır.

Üst düzey alanlar **2026-08-30** tarihine kadar kullanılabilir kalacaktır. Her
alanın TypeScript `@deprecated` açıklaması, yerine kullanılacak alanı belirtir:

- `from` ve `conversationId`, `admission.conversation.id` alanına taşınır.
- `accountId`, `admission.accountId` alanına taşınır.
- `accessControlPassed`,
  `admission.ingress.decision === "allow"` ifadesinin türetilmiş bir uyumluluk
  görünümüdür; zaten `admission` taşıyan iletilerde eski Boolean değerini yazmak
  giriş grafiğini yeniden yazmaz.
- `chatType`, `admission.conversation.kind` alanına taşınır.

## Plugin denetleyicisi paketi

Plugin denetleyicisi, sürümlenmiş uyumluluk ve manifest sözleşmeleriyle
desteklenen ayrı bir paket/depo olarak çekirdek OpenClaw deposunun dışında
bulunmalıdır. İlk günkü CLI şu olmalıdır:

```sh
openclaw-plugin-inspector ./my-plugin
```

Manifest/şema doğrulaması, denetlenen sözleşme uyumluluk sürümü,
kurulum/kaynak meta verisi kontrolleri, soğuk yol içe aktarma kontrolleri ve
kullanımdan kaldırma/uyumluluk uyarıları üretmelidir. CI açıklamalarında kararlı,
makine tarafından okunabilir çıktı için `--json` kullanın. OpenClaw çekirdeği,
denetleyicinin kullanabileceği sözleşmeleri ve test verilerini sunmalı; ancak
denetleyici ikili dosyasını ana `openclaw` paketinden yayımlamamalıdır.

### Bakım sorumlusu kabul hattı

Harici denetleyiciyi OpenClaw Plugin paketleriyle doğrularken kurulabilir paket
kabul hattı için Crabbox destekli Blacksmith Testbox kullanın. Paket
oluşturulduktan sonra bunu temiz bir OpenClaw çalışma kopyasından çalıştırın:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Bu hat harici bir npm paketi kurduğundan ve depo dışına klonlanmış Plugin
paketlerini inceleyebileceğinden, bakım sorumluları için isteğe bağlı tutun.
Yerel depo korumaları SDK dışa aktarma eşlemesini, uyumluluk kayıt defteri meta
verilerini, kullanımdan kaldırılmış SDK içe aktarımlarının azaltılmasını ve
paketlenmiş eklenti içe aktarma sınırlarını kapsar; Testbox denetleyici kanıtı
ise paketi harici Plugin yazarlarının kullandığı biçimiyle kapsar.

## Sürüm notları

Sürüm notları, bir uyumluluk yolu `removal-pending` veya `removed` durumuna
geçmeden önce hedef tarihleri ve geçiş belgelerinin bağlantılarıyla birlikte
yaklaşan Plugin kullanımdan kaldırmalarını içermelidir.
