---
read_when:
    - Bir OpenClaw Plugin'in bakımını yapıyorsunuz
    - Bir Plugin uyumluluk uyarısı görüyorsunuz
    - Bir Plugin SDK veya manifest geçişi planlıyorsunuz
summary: Plugin uyumluluk sözleşmeleri, kullanımdan kaldırma meta verileri ve geçiş beklentileri
title: Plugin uyumluluğu
x-i18n:
    generated_at: "2026-05-11T20:33:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw, SDK, manifest, setup, config ve agent runtime sözleşmeleri
evrilirken mevcut bundled ve external Plugin'leri korumak için, eski Plugin
sözleşmelerini kaldırmadan önce adlandırılmış uyumluluk adaptörleri üzerinden
bağlı tutar.

## Uyumluluk kayıt defteri

Plugin uyumluluk sözleşmeleri, çekirdek kayıt defterinde
`src/plugins/compat/registry.ts` dosyasında izlenir.

Her kayıtta şunlar bulunur:

- kararlı bir uyumluluk kodu
- durum: `active`, `deprecated`, `removal-pending` veya `removed`
- sahip: SDK, config, setup, channel, provider, Plugin yürütme, agent runtime
  veya core
- uygulanabildiğinde tanıtım ve kullanımdan kaldırma tarihleri
- değiştirme rehberi
- eski ve yeni davranışı kapsayan dokümanlar, tanılamalar ve testler

Kayıt defteri, bakımcı planlaması ve gelecekteki Plugin denetleyicisi
kontrolleri için kaynaktır. Plugin'e dönük bir davranış değişirse, adaptörü
ekleyen aynı değişiklikte uyumluluk kaydını ekleyin veya güncelleyin.

Doctor onarım ve migration uyumluluğu ayrı olarak
`src/commands/doctor/shared/deprecation-compat.ts` içinde izlenir. Bu kayıtlar,
runtime uyumluluk yolu kaldırıldıktan sonra da kullanılabilir kalması
gerekebilecek eski config şekillerini, install-ledger düzenlerini ve onarım
shim'lerini kapsar.

Release taramaları her iki kayıt defterini de kontrol etmelidir. Eşleşen
runtime veya config uyumluluk kaydı süresi doldu diye bir doctor migration'ını
silmeyin; önce onarıma hâlâ ihtiyaç duyan desteklenen bir yükseltme yolu
olmadığını doğrulayın. Ayrıca release planlaması sırasında her değiştirme
notunu yeniden doğrulayın, çünkü provider'lar ve channel'lar core dışına
taşındıkça Plugin sahipliği ve config ayak izi değişebilir.

## Plugin denetleyicisi paketi

Plugin denetleyicisi, sürümlenmiş uyumluluk ve manifest sözleşmeleriyle
desteklenen ayrı bir paket/depo olarak core OpenClaw deposunun dışında
yaşamalıdır.

İlk gün CLI şu olmalıdır:

```sh
openclaw-plugin-inspector ./my-plugin
```

Şunları üretmelidir:

- manifest/schema doğrulaması
- kontrol edilen sözleşme uyumluluk sürümü
- install/source metadata kontrolleri
- cold-path import kontrolleri
- kullanımdan kaldırma ve uyumluluk uyarıları

CI notlarında kararlı, makine tarafından okunabilir çıktı için `--json`
kullanın. OpenClaw core, denetleyicinin tüketebileceği sözleşmeleri ve
fixture'ları sunmalıdır, ancak denetleyici binary'sini ana `openclaw`
paketinden yayımlamamalıdır.

### Bakımcı kabul hattı

External denetleyiciyi OpenClaw Plugin paketlerine karşı doğrularken
kurulabilir-paket kabul hattı için Crabbox destekli Blacksmith Testbox kullanın.
Paket oluşturulduktan sonra bunu temiz bir OpenClaw checkout'ından çalıştırın:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Bu hattı bakımcılar için opt-in tutun, çünkü external bir npm paketi kurar ve
deponun dışında klonlanmış Plugin paketlerini inceleyebilir. Yerel depo
korumaları SDK export map'ini, uyumluluk kayıt defteri metadata'sını, deprecated
SDK-import burn-down'ını ve bundled extension import sınırlarını kapsar; Testbox
denetleyici kanıtı, paketi external Plugin yazarlarının tükettiği biçimde
kapsar.

## Kullanımdan kaldırma ilkesi

OpenClaw, bir documented Plugin sözleşmesini, onun yerine geçecek sözleşmeyi
tanıtan aynı release içinde kaldırmamalıdır.

Migration sırası şöyledir:

1. Yeni sözleşmeyi ekleyin.
2. Eski davranışı adlandırılmış bir uyumluluk adaptörü üzerinden bağlı tutun.
3. Plugin yazarlarının işlem yapabileceği durumlarda tanılamalar veya uyarılar yayın.
4. Değiştirmeyi ve zaman çizelgesini dokümante edin.
5. Hem eski hem de yeni yolları test edin.
6. Duyurulan migration penceresi boyunca bekleyin.
7. Yalnızca açık breaking-release onayıyla kaldırın.

Deprecated kayıtlar bir uyarı başlangıç tarihi, değiştirme, doküman bağlantısı
ve uyarı başladıktan en fazla üç ay sonrasına denk gelen son kaldırma tarihi
içermelidir. Bakımcılar bunun kalıcı uyumluluk olduğuna açıkça karar verip
bunun yerine `active` olarak işaretlemedikçe, açık uçlu kaldırma penceresine
sahip deprecated uyumluluk yolu eklemeyin.

## Mevcut uyumluluk alanları

Mevcut uyumluluk kayıtları şunları içerir:

- `openclaw/plugin-sdk/compat` gibi eski broad SDK import'ları
- eski yalnızca hook tabanlı Plugin şekilleri ve `before_agent_start`
- Plugin'ler `register(api)` kullanımına geçerken eski `activate(api)` Plugin entrypoint'leri
- `openclaw/extension-api`, `openclaw/plugin-sdk/channel-runtime`,
  `openclaw/plugin-sdk/command-auth` status builder'ları,
  `openclaw/plugin-sdk/test-utils` (odaklanmış `openclaw/plugin-sdk/*` test
  subpath'leriyle değiştirildi) ve `ClawdbotConfig` /
  `OpenClawSchemaType` type alias'ları gibi eski SDK alias'ları
- bundled Plugin allowlist ve enablement davranışı
- eski provider/channel env-var manifest metadata'sı
- provider'lar açık catalog, auth, thinking, replay ve transport hook'larına
  geçerken eski provider Plugin hook'ları ve type alias'ları
- `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt`
  ve deprecated `api.runtime.config.loadConfig()` /
  `api.runtime.config.writeConfigFile(...)` gibi eski runtime alias'ları
- memory Plugin'leri `registerMemoryCapability` kullanımına geçerken eski
  memory-plugin split registration
- native message schema'ları, mention gating, inbound envelope formatting ve
  approval capability nesting için eski channel SDK helper'ları
- Plugin'ler `openclaw/plugin-sdk/channel-route` kullanımına geçerken eski
  channel route key ve comparable-target helper alias'ları
- manifest contribution ownership ile değiştirilen activation hint'leri
- setup descriptor'ları cold `setup.requiresRuntime: false` metadata'sına
  geçerken `setup-api` runtime fallback'i
- provider catalog hook'ları `catalog.run(...)` kullanımına geçerken provider
  `discovery` hook'ları
- channel paketleri `openclaw.channel.exposure` kullanımına geçerken channel
  `showConfigured` / `showInSetup` metadata'sı
- doctor operatörleri `agentRuntime` kullanımına geçirirken eski runtime-policy
  config anahtarları
- registry-first `channelConfigs` metadata'sı gelirken generated bundled
  channel config metadata fallback'i
- onarım akışları operatörleri `openclaw plugins registry --refresh` ve
  `openclaw doctor --fix` kullanımına geçirirken kalıcı Plugin kayıt defteri
  disable ve install-migration env flag'leri
- doctor bunları `plugins.entries.<plugin>.config` konumuna taşırken eski
  Plugin'e ait web search, web fetch ve x_search config yolları
- install metadata state-managed Plugin ledger'a taşınırken eski
  `plugins.installs` authored config ve bundled Plugin load-path alias'ları

Yeni Plugin kodu, kayıt defterinde ve ilgili migration rehberinde listelenen
değiştirmeyi tercih etmelidir. Mevcut Plugin'ler, dokümanlar, tanılamalar ve
release notları bir kaldırma penceresi duyurana kadar uyumluluk yolunu
kullanmaya devam edebilir.

## Release notları

Release notları, yaklaşan Plugin kullanımdan kaldırmalarını hedef tarihlerle
ve migration dokümanlarına bağlantılarla içermelidir. Bu uyarının, bir
uyumluluk yolu `removal-pending` veya `removed` durumuna geçmeden önce yapılması
gerekir.
