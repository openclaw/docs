---
read_when:
    - OpenClaw içinde Anthropic modellerini kullanmak istediğinizde
    - Gateway host üzerinde Claude CLI abonelik kimlik doğrulamasını yeniden kullanmak istediğinizde
summary: OpenClaw içinde Anthropic Claude'u API anahtarları veya Claude CLI ile kullanın
title: Anthropic
x-i18n:
    generated_at: "2026-04-05T14:03:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f2b614eba4563093522e5157848fc54a16770a2fae69f17c54f1b9bfff624f
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic, **Claude** model ailesini geliştirir ve bir API üzerinden erişim sağlar.
OpenClaw içinde yeni Anthropic kurulumu için bir API anahtarı veya yerel Claude CLI
arka ucu kullanılmalıdır. Mevcut eski Anthropic token profilleri, zaten
yapılandırılmışlarsa çalışma zamanında kullanılmaya devam eder.

<Warning>
Anthropic'in herkese açık Claude Code belgeleri, `claude -p` gibi etkileşimsiz CLI
kullanımını açıkça belgelemektedir. Bu belgelere dayanarak, yerel,
kullanıcı tarafından yönetilen Claude Code CLI geri dönüş yolunun büyük olasılıkla
izinli olduğunu düşünüyoruz.

Bunun dışında, Anthropic, OpenClaw kullanıcılarına **4 Nisan 2026, 12:00 PM
PT / 8:00 PM BST** tarihinde **OpenClaw'un üçüncü taraf bir harness olarak
sayıldığını** bildirdi. Belirttikleri politikaya göre, OpenClaw tarafından
yönlendirilen Claude giriş trafiği artık dahil edilen Claude abonelik havuzunu
kullanmıyor ve bunun yerine **Extra Usage**
(abonelikten ayrı faturalanan, kullandıkça öde) gerektiriyor.

Bu politika ayrımı, **OpenClaw tarafından yönlendirilen Claude CLI yeniden kullanımı**
ile ilgilidir; kendi terminalinizde `claude` komutunu doğrudan çalıştırmakla
ilgili değildir. Bununla birlikte, Anthropic'in üçüncü taraf harness politikası
harici ürünlerde abonelik destekli kullanım konusunda hâlâ yeterince belirsizlik
bıraktığı için bu yolu üretim için önermiyoruz.

Anthropic'in mevcut herkese açık belgeleri:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

En net faturalama yolunu istiyorsanız, bunun yerine bir Anthropic API anahtarı kullanın.
OpenClaw ayrıca [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding Plan](/providers/qwen),
[MiniMax Coding Plan](/providers/minimax) ve [Z.AI / GLM Coding
Plan](/providers/glm) dahil olmak üzere diğer abonelik tarzı seçenekleri de destekler.
</Warning>

## Seçenek A: Anthropic API anahtarı

**Şunun için en iyisi:** standart API erişimi ve kullanıma dayalı faturalama.
API anahtarınızı Anthropic Console içinde oluşturun.

### CLI kurulumu

```bash
openclaw onboard
# seçin: Anthropic API key

# veya etkileşimsiz
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Claude CLI yapılandırma parçacığı

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Düşünme varsayılanları (Claude 4.6)

- Anthropic Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmamışsa OpenClaw içinde varsayılan olarak `adaptive` düşünme kullanır.
- Mesaj başına (`/think:<level>`) veya model parametrelerinde geçersiz kılabilirsiniz:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- İlgili Anthropic belgeleri:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Hızlı mod (Anthropic API)

OpenClaw'un paylaşılan `/fast` anahtarı, `api.anthropic.com` adresine gönderilen API anahtarlı ve OAuth kimlik doğrulamalı istekler dahil, doğrudan herkese açık Anthropic trafiğini de destekler.

- `/fast on`, `service_tier: "auto"` değerine eşlenir
- `/fast off`, `service_tier: "standard_only"` değerine eşlenir
- Yapılandırma varsayılanı:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-6": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

Önemli sınırlamalar:

- OpenClaw, Anthropic hizmet katmanlarını yalnızca doğrudan `api.anthropic.com` istekleri için enjekte eder. `anthropic/*` trafiğini bir proxy veya gateway üzerinden yönlendirirseniz `/fast`, `service_tier` değerine dokunmaz.
- Açık Anthropic `serviceTier` veya `service_tier` model parametreleri, ikisi birden ayarlandığında `/fast` varsayılanını geçersiz kılar.
- Anthropic, etkin katmanı yanıtta `usage.service_tier` altında bildirir. Priority Tier kapasitesi olmayan hesaplarda `service_tier: "auto"` yine de `standard` olarak çözümlenebilir.

## Prompt caching (Anthropic API)

OpenClaw, Anthropic'in prompt caching özelliğini destekler. Bu **yalnızca API** içindir; eski Anthropic token kimlik doğrulaması önbellek ayarlarını dikkate almaz.

### Yapılandırma

Model yapılandırmanızda `cacheRetention` parametresini kullanın:

| Değer   | Önbellek Süresi | Açıklama                          |
| ------- | --------------- | --------------------------------- |
| `none`  | Önbellek yok    | Prompt caching'i devre dışı bırak |
| `short` | 5 dakika        | API Key kimlik doğrulaması için varsayılan |
| `long`  | 1 saat          | Genişletilmiş önbellek            |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### Varsayılanlar

Anthropic API Key kimlik doğrulaması kullanılırken OpenClaw, tüm Anthropic modelleri için otomatik olarak `cacheRetention: "short"` (5 dakikalık önbellek) uygular. Bunu, yapılandırmanızda açıkça `cacheRetention` ayarlayarak geçersiz kılabilirsiniz.

### Aracı başına cacheRetention geçersiz kılmaları

Temel olarak model düzeyindeki parametreleri kullanın, ardından belirli aracılar için `agents.list[].params` ile geçersiz kılın.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // çoğu aracı için temel
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // yalnızca bu aracı için geçersiz kıl
    ],
  },
}
```

Önbellekle ilgili parametreler için yapılandırma birleştirme sırası:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (`id` eşleşirse, anahtar bazında geçersiz kılar)

Bu, aynı modeli kullanan bir aracının uzun ömürlü bir önbelleği korurken başka bir aracının yoğun/düşük yeniden kullanım trafiğinde yazma maliyetlerinden kaçınmak için önbelleği devre dışı bırakmasına olanak tanır.

### Bedrock Claude notları

- Bedrock üzerindeki Anthropic Claude modelleri (`amazon-bedrock/*anthropic.claude*`), yapılandırıldığında `cacheRetention` pass-through kabul eder.
- Anthropic dışındaki Bedrock modelleri, çalışma zamanında `cacheRetention: "none"` olmaya zorlanır.
- Anthropic API-key akıllı varsayılanları da, açık bir değer ayarlanmadığında Claude-on-Bedrock model başvuruları için `cacheRetention: "short"` değerini tohumlar.

## 1M bağlam penceresi (Anthropic beta)

Anthropic'in 1M bağlam penceresi beta kısıtlamalıdır. OpenClaw içinde bunu, desteklenen
Opus/Sonnet modelleri için model başına `params.context1m: true` ile etkinleştirin.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

OpenClaw bunu Anthropic isteklerinde
`anthropic-beta: context-1m-2025-08-07` değerine eşler.

Bu yalnızca, o model için `params.context1m` açıkça `true` olarak ayarlandığında etkinleşir.

Gereksinim: Anthropic, o kimlik bilgisi için uzun bağlam kullanımına izin vermelidir
(genellikle API anahtarı faturalaması veya Extra Usage etkinleştirilmiş OpenClaw'un Claude-login yolu / eski token kimlik doğrulaması).
Aksi takdirde Anthropic şu hatayı döndürür:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Not: Anthropic şu anda
eski Anthropic token kimlik doğrulaması (`sk-ant-oat-*`) kullanılırken
`context-1m-*` beta isteklerini reddediyor. Bu eski kimlik doğrulama moduyla
`context1m: true` yapılandırırsanız OpenClaw bir uyarı günlüğe kaydeder ve
gerekli OAuth betalarını korurken context1m beta başlığını atlayarak standart
bağlam penceresine geri döner.

## Seçenek B: mesaj sağlayıcısı olarak Claude CLI

**Şunun için en iyisi:** Claude CLI'nin zaten kurulu ve oturum açılmış olduğu,
önerilen üretim yolu yerine yerel bir geri dönüş olarak çalışan tek kullanıcılı bir gateway host.

Faturalama notu: Anthropic'in herkese açık CLI belgelerine dayanarak, Claude Code CLI geri dönüşünün yerel,
kullanıcı tarafından yönetilen otomasyon için büyük olasılıkla izinli olduğunu düşünüyoruz. Bununla birlikte,
Anthropic'in üçüncü taraf harness politikası, harici ürünlerde
abonelik destekli kullanım konusunda yeterince belirsizlik yarattığı için bunu üretim için önermiyoruz.
Anthropic ayrıca OpenClaw kullanıcılarına, **OpenClaw tarafından yönlendirilen** Claude
CLI kullanımının üçüncü taraf harness trafiği olarak değerlendirildiğini ve **4 Nisan 2026,
12:00 PM PT / 8:00 PM BST** itibarıyla, dahil edilen Claude abonelik
limitleri yerine **Extra Usage** gerektirdiğini söyledi.

Bu yol, Anthropic API'yi doğrudan çağırmak yerine model çıkarımı için yerel `claude`
ikili dosyasını kullanır. OpenClaw bunu aşağıdaki gibi model başvurularına sahip bir **CLI backend provider**
olarak değerlendirir:

- `claude-cli/claude-sonnet-4-6`
- `claude-cli/claude-opus-4-6`

Nasıl çalışır:

1. OpenClaw, **gateway host** üzerinde
   `claude -p --output-format stream-json --include-partial-messages ...`
   komutunu başlatır ve prompt'u stdin üzerinden gönderir.
2. İlk tur `--session-id <uuid>` gönderir.
3. Takip eden turlar, depolanan Claude oturumunu `--resume <sessionId>` ile yeniden kullanır.
4. Sohbet mesajlarınız yine normal OpenClaw mesaj hattından geçer, ancak
   asıl model yanıtı Claude CLI tarafından üretilir.

### Gereksinimler

- Claude CLI, gateway host üzerinde kurulu ve PATH üzerinde erişilebilir olmalı ya da
  mutlak bir komut yoluyla yapılandırılmış olmalıdır.
- Claude CLI, aynı host üzerinde zaten kimlik doğrulaması yapılmış olmalıdır:

```bash
claude auth status
```

- OpenClaw, yapılandırmanız açıkça `claude-cli/...` veya `claude-cli` backend yapılandırmasına başvurduğunda,
  gateway başlangıcında paketlenmiş Anthropic plugin'ini otomatik olarak yükler.

### Yapılandırma parçacığı

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "claude-cli/claude-sonnet-4-6",
      },
      models: {
        "claude-cli/claude-sonnet-4-6": {},
      },
      sandbox: { mode: "off" },
    },
  },
}
```

`claude` ikili dosyası gateway host PATH üzerinde değilse:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

### Elde ettikleriniz

- Yerel CLI'den yeniden kullanılan Claude abonelik kimlik doğrulaması (çalışma zamanında okunur, kalıcı olarak saklanmaz)
- Normal OpenClaw mesaj/oturum yönlendirmesi
- Turlar arasında Claude CLI oturum sürekliliği (kimlik doğrulama değişikliklerinde geçersiz kılınır)
- Loopback MCP bridge aracılığıyla Claude CLI'ye sunulan gateway araçları
- Canlı kısmi mesaj ilerlemesiyle JSONL akışı

### Anthropic kimlik doğrulamasından Claude CLI'ye geçiş

Şu anda eski bir token profili veya API anahtarıyla `anthropic/...` kullanıyorsanız ve aynı
gateway host'u Claude CLI'ye geçirmek istiyorsanız, OpenClaw bunu normal bir
provider-auth geçiş yolu olarak destekler.

Ön koşullar:

- Claude CLI, OpenClaw'u çalıştıran **aynı gateway host** üzerinde kurulu olmalı
- Claude CLI orada zaten oturum açmış olmalı: `claude auth login`

Ardından şunu çalıştırın:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Veya onboarding içinde:

```bash
openclaw onboard --auth-choice anthropic-cli
```

Etkileşimli `openclaw onboard` ve `openclaw configure` artık önce **Anthropic
Claude CLI**'yi, ikinci olarak **Anthropic API key**'i tercih eder.

Bunun yaptığı şeyler:

- Claude CLI'nin gateway host üzerinde zaten oturum açtığını doğrular
- varsayılan modeli `claude-cli/...` olarak değiştirir
- `anthropic/claude-opus-4-6` gibi Anthropic varsayılan model geri dönüşlerini
  `claude-cli/claude-opus-4-6` olarak yeniden yazar
- `agents.defaults.models` içine eşleşen `claude-cli/...` girdileri ekler

Hızlı doğrulama:

```bash
openclaw models status
```

Çözümlenen birincil modeli `claude-cli/...` altında görmelisiniz.

Yapmadıkları:

- mevcut Anthropic kimlik doğrulama profillerinizi silmez
- ana varsayılan model/allowlist yolu dışındaki her eski `anthropic/...` yapılandırma başvurusunu kaldırmaz

Bu, geri almayı kolaylaştırır: gerekirse varsayılan modeli yeniden `anthropic/...` olarak değiştirin.

### Önemli sınırlamalar

- Bu, **Anthropic API sağlayıcısı değildir**. Bu, yerel CLI çalışma zamanıdır.
- OpenClaw, araç çağrılarını doğrudan enjekte etmez. Claude CLI,
  gateway araçlarını bir loopback MCP bridge üzerinden alır (`bundleMcp: true`, varsayılan).
- Claude CLI, JSONL (`stream-json` ile
  `--include-partial-messages`) üzerinden yanıt akışı sağlar. Prompt'lar argv üzerinden değil, stdin üzerinden gönderilir.
- Kimlik doğrulama, canlı Claude CLI kimlik bilgilerinden çalışma zamanında okunur ve
  OpenClaw profillerine kalıcı olarak kaydedilmez. Etkileşimsiz bağlamlarda
  anahtarlık istemleri bastırılır.
- Oturum yeniden kullanımı `cliSessionBinding` meta verisi ile izlenir. Claude CLI
  oturum durumu değiştiğinde (yeniden giriş, token rotasyonu), depolanan oturumlar
  geçersiz kılınır ve yeni bir oturum başlar.
- En iyi kullanım alanı, paylaşımlı çok kullanıcılı faturalama kurulumları değil, kişisel bir gateway host'tur.

Daha fazla ayrıntı: [/gateway/cli-backends](/tr/gateway/cli-backends)

## Notlar

- Anthropic'in herkese açık Claude Code belgeleri hâlâ
  `claude -p` gibi doğrudan CLI kullanımını belgelemektedir. Yerel, kullanıcı tarafından yönetilen geri dönüşün büyük olasılıkla izinli olduğunu düşünüyoruz; ancak
  Anthropic'in OpenClaw kullanıcılarına gönderdiği ayrı bildirim, **OpenClaw**
  Claude-login yolunun üçüncü taraf harness kullanımı olduğunu ve **Extra Usage**
  gerektirdiğini söylüyor
  (abonelikten ayrı olarak kullandıkça öde faturalandırılır). Üretim için bunun yerine
  Anthropic API anahtarlarını öneriyoruz.
- Anthropic setup-token, OpenClaw içinde eski/manuel bir yol olarak yeniden kullanılabilir durumdadır. Anthropic'in OpenClaw'a özgü faturalama bildirimi hâlâ geçerlidir, bu yüzden Anthropic'in bu yol için **Extra Usage** gerektirdiği beklentisiyle kullanın.
- Kimlik doğrulama ayrıntıları ve yeniden kullanım kuralları [/concepts/oauth](/tr/concepts/oauth) içindedir.

## Sorun giderme

**401 hataları / token aniden geçersiz**

- Eski Anthropic token kimlik doğrulaması süresi dolabilir veya iptal edilebilir.
- Yeni kurulum için gateway host üzerindeki yerel Claude CLI yoluna veya bir Anthropic API anahtarına geçin.

**Provider "anthropic" için API anahtarı bulunamadı**

- Kimlik doğrulama **aracı başınadır**. Yeni aracılar ana aracının anahtarlarını devralmaz.
- O aracı için onboarding işlemini yeniden çalıştırın veya gateway
  host üzerinde bir API anahtarı yapılandırın, ardından `openclaw models status` ile doğrulayın.

**`anthropic:default` profili için kimlik bilgisi bulunamadı**

- Hangi kimlik doğrulama profilinin etkin olduğunu görmek için `openclaw models status` çalıştırın.
- Onboarding işlemini yeniden çalıştırın veya o profil yolu için bir API anahtarı ya da Claude CLI yapılandırın.

**Kullanılabilir kimlik doğrulama profili yok (hepsi cooldown/unavailable durumda)**

- `auth.unusableProfiles` için `openclaw models status --json` çıktısını denetleyin.
- Anthropic rate-limit cooldown süreleri model kapsamlı olabilir; bu nedenle
  geçerli model cooldown durumundayken kardeş bir Anthropic modeli yine de kullanılabilir olabilir.
- Başka bir Anthropic profili ekleyin veya cooldown süresinin dolmasını bekleyin.

Daha fazlası: [/gateway/troubleshooting](/tr/gateway/troubleshooting) ve [/help/faq](/help/faq).
