---
read_when:
    - OpenClaw OAuth'u uçtan uca anlamak istiyorsunuz
    - Token geçersiz kılma / oturum kapatma sorunları yaşıyorsunuz
    - Claude CLI veya OAuth kimlik doğrulama akışlarını istiyorsunuz
    - Birden fazla hesap veya profil yönlendirmesi istiyorsanız
summary: 'OpenClaw’da OAuth: belirteç değişimi, depolama ve çok hesaplı kalıplar'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:45:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw, bunu sunan sağlayıcılar için OAuth üzerinden "abonelik kimlik doğrulaması" destekler
(özellikle **OpenAI Codex (ChatGPT OAuth)**). Anthropic için pratik ayrım
artık şöyledir:

- **Anthropic API anahtarı**: normal Anthropic API faturalandırması
- **OpenClaw içinde Anthropic Claude CLI / abonelik kimlik doğrulaması**: Anthropic çalışanları
  bize bu kullanımın yeniden izinli olduğunu söyledi

OpenAI Codex OAuth, OpenClaw gibi harici araçlarda kullanım için açıkça desteklenir.

OpenClaw, hem OpenAI API anahtarı kimlik doğrulamasını hem de ChatGPT/Codex OAuth'u
kanonik sağlayıcı kimliği `openai` altında saklar. Eski `openai-codex:*` profil kimlikleri ve
`auth.order.openai-codex` girdileri, `openclaw doctor --fix` tarafından onarılan
eski durumdur; yeni yapılandırma için `openai:*` profil kimliklerini ve `auth.order.openai` kullanın.

Üretimde Anthropic için API anahtarı kimlik doğrulaması daha güvenli önerilen yoldur.

Bu sayfa şunları açıklar:

- OAuth **belirteç değişiminin** nasıl çalıştığı (PKCE)
- belirteçlerin nerede **saklandığı** (ve neden)
- **birden fazla hesabın** nasıl ele alınacağı (profiller + oturum başına geçersiz kılmalar)

OpenClaw, kendi OAuth veya API anahtarı akışlarını birlikte getiren **sağlayıcı Plugin'lerini** de destekler.
Bunları şöyle çalıştırın:

```bash
openclaw models auth login --provider <id>
```

## Belirteç havuzu (neden var)

OAuth sağlayıcıları, oturum açma/yenileme akışları sırasında yaygın olarak **yeni bir yenileme belirteci** üretir. Bazı sağlayıcılar (veya OAuth istemcileri), aynı kullanıcı/uygulama için yeni bir belirteç verildiğinde eski yenileme belirteçlerini geçersiz kılabilir.

Pratik belirti:

- OpenClaw _ve_ Claude Code / Codex CLI üzerinden oturum açarsınız → bunlardan biri daha sonra rastgele "oturumdan çıkarılmış" hale gelir

Bunu azaltmak için OpenClaw, `auth-profiles.json` dosyasını bir **belirteç havuzu** olarak ele alır:

- çalışma zamanı kimlik bilgilerini **tek bir yerden** okur
- birden fazla profili tutabilir ve bunları deterministik olarak yönlendirebiliriz
- harici CLI yeniden kullanımı sağlayıcıya özeldir: Codex CLI boş bir
  `openai:default` profilini başlatabilir, ancak OpenClaw'ın yerel bir OAuth profili olduğunda,
  yerel yenileme belirteci kanoniktir. Bu yerel yenileme belirteci reddedilirse,
  OpenClaw, Codex CLI belirteç materyalini kardeş çalışma zamanı yedeği olarak kullanmak yerine
  yeniden kimlik doğrulaması için yönetilen profili bildirir. Diğer entegrasyonlar
  haricen yönetilmeye ve CLI kimlik doğrulama depolarını yeniden okumaya devam edebilir
- yapılandırılmış sağlayıcı kümesini zaten bilen durum ve başlangıç yolları,
  harici CLI keşfini bu kümeyle sınırlar; böylece tek sağlayıcılı bir kurulum için
  ilgisiz bir CLI oturum açma deposu yoklanmaz

## Depolama (belirteçlerin bulunduğu yer)

Gizli değerler ajan kimlik doğrulama depolarında saklanır:

- Kimlik doğrulama profilleri (OAuth + API anahtarları + isteğe bağlı değer düzeyi ref'leri): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski uyumluluk dosyası: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statik `api_key` girdileri keşfedildiklerinde temizlenir)

Yalnızca içe aktarma amaçlı eski dosya (hala desteklenir, ancak ana depo değildir):

- `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır)

Yukarıdakilerin tümü `$OPENCLAW_STATE_DIR` değerine de uyar (durum dizini geçersiz kılma). Tam başvuru: [/gateway/configuration](/tr/gateway/configuration-reference#auth-storage)

Statik gizli değer ref'leri ve çalışma zamanı anlık görüntüsü etkinleştirme davranışı için bkz. [Gizli Değer Yönetimi](/tr/gateway/secrets).

İkincil bir ajanın yerel kimlik doğrulama profili olmadığında, OpenClaw varsayılan/ana ajan deposundan
okuma geçişli kalıtım kullanır. Okuma sırasında ana ajanın `auth-profiles.json` dosyasını
klonlamaz. OAuth yenileme belirteçleri özellikle hassastır: normal kopyalama akışları
bunları varsayılan olarak atlar, çünkü bazı sağlayıcılar yenileme belirteçlerini kullanım sonrasında döndürür
veya geçersiz kılar. Bir ajanın bağımsız bir hesaba ihtiyacı olduğunda o ajan için
ayrı bir OAuth oturumu yapılandırın.

## Anthropic eski belirteç uyumluluğu

<Warning>
Anthropic'in herkese açık Claude Code belgeleri, doğrudan Claude Code kullanımının
Claude abonelik limitleri içinde kaldığını söyler ve Anthropic çalışanları bize OpenClaw tarzı Claude
CLI kullanımının yeniden izinli olduğunu söyledi. Bu nedenle OpenClaw, Anthropic
yeni bir politika yayımlamadığı sürece, bu entegrasyon için Claude CLI yeniden kullanımını ve
`claude -p` kullanımını onaylı kabul eder.

Anthropic'in güncel doğrudan Claude Code plan belgeleri için bkz. [Claude Code'u
Pro veya Max planınızla kullanma](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
ve [Claude Code'u Team veya Enterprise
planınızla kullanma](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

OpenClaw içinde başka abonelik tarzı seçenekler istiyorsanız bkz. [OpenAI
Codex](/tr/providers/openai), [Qwen Cloud Coding
Plan](/tr/providers/qwen), [MiniMax Coding Plan](/tr/providers/minimax)
ve [Z.AI / GLM Coding Plan](/tr/providers/zai).
</Warning>

OpenClaw ayrıca Anthropic setup-token'ı desteklenen bir belirteç kimlik doğrulama yolu olarak sunar, ancak artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

## Anthropic Claude CLI geçişi

OpenClaw, Anthropic Claude CLI yeniden kullanımını tekrar destekler. Ana makinede zaten yerel bir
Claude oturumunuz varsa, onboarding/configure bunu doğrudan yeniden kullanabilir.

## OAuth değişimi (oturum açma nasıl çalışır)

OpenClaw'ın etkileşimli oturum açma akışları `openclaw/plugin-sdk/llm` içinde uygulanır ve sihirbazlara/komutlara bağlanır.

### Anthropic setup-token

Akış şekli:

1. OpenClaw'dan Anthropic setup-token başlatın veya paste-token yapın
2. OpenClaw, ortaya çıkan Anthropic kimlik bilgisini bir kimlik doğrulama profilinde saklar
3. model seçimi `anthropic/...` üzerinde kalır
4. mevcut Anthropic kimlik doğrulama profilleri geri alma/sıralama kontrolü için kullanılabilir kalır

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth, OpenClaw iş akışları dahil olmak üzere Codex CLI dışında kullanım için açıkça desteklenir.

Oturum açma komutu yine kanonik OpenAI sağlayıcı kimliğini kullanır:

```bash
openclaw models auth login --provider openai
```

Bir ajanda birden fazla ChatGPT/Codex OAuth hesabı için `--profile-id openai:<name>` kullanın.
Yeni profiller için `openai-codex:<name>` kullanmayın. Doctor bu eski ön eki
çakışmasız bir `openai:*` profil kimliğine taşır; profil kimliklerini
`auth.order` veya `/model ...@<profileId>` içine kopyalamadan önce onarımdan sonra
`openclaw models auth list --provider openai` çalıştırın.

Akış şekli (PKCE):

1. PKCE verifier/challenge + rastgele `state` üretin
2. `https://auth.openai.com/oauth/authorize?...` adresini açın
3. geri çağırmayı `http://127.0.0.1:1455/auth/callback` üzerinde yakalamayı deneyin
4. geri çağırma bağlanamazsa (veya uzak/headless durumdaysanız), yönlendirme URL'sini/kodu yapıştırın
5. `https://auth.openai.com/oauth/token` adresinde değişim yapın
6. erişim belirtecinden `accountId` çıkarın ve `{ access, refresh, expires, accountId }` saklayın

Sihirbaz yolu `openclaw onboard` → kimlik doğrulama seçimi `openai` şeklindedir.

## Yenileme + süre dolumu

Profiller bir `expires` zaman damgası saklar.

Çalışma zamanında:

- `expires` gelecekteyse → saklanan erişim belirtecini kullan
- süresi dolmuşsa → yenile (dosya kilidi altında) ve saklanan kimlik bilgilerini üzerine yaz
- ikincil bir ajan kalıtılmış bir ana ajan OAuth profilini okursa, yenileme
  yenileme belirtecini ikincil ajan deposuna kopyalamak yerine ana ajan deposuna geri yazar
- istisna: bazı harici CLI kimlik bilgileri haricen yönetilmeye devam eder; OpenClaw
  kopyalanmış yenileme belirteçlerini harcamak yerine bu CLI kimlik doğrulama depolarını yeniden okur.
  Codex CLI başlatması bilerek daha dardır: OpenClaw sağlayıcı için OAuth'u
  sahiplenmeden önce yalnızca boş bir `openai:default` veya açıkça istenen OpenAI profilini
  tohumlayabilir. Bundan sonra OpenClaw'a ait yenilemeler yerel profilleri
  kanonik tutar ve keşif, Codex CLI kimlik doğrulamasını herhangi bir kardeş
  yuvaya eklemez. Yönetilen bir yenileme başarısız olursa OpenClaw, harici CLI belirteç
  materyalini döndürmek yerine yeniden kimlik doğrulaması için etkilenen profili bildirir.

Yenileme akışı otomatiktir; genellikle belirteçleri elle yönetmeniz gerekmez.

## Birden fazla hesap (profiller) + yönlendirme

İki desen:

### 1) Tercih edilen: ayrı ajanlar

"Kişisel" ve "iş" hesaplarının asla etkileşmemesini istiyorsanız, yalıtılmış ajanlar kullanın (ayrı oturumlar + kimlik bilgileri + çalışma alanı):

```bash
openclaw agents add work
openclaw agents add personal
```

Ardından ajan başına kimlik doğrulamasını yapılandırın (sihirbaz) ve sohbetleri doğru ajana yönlendirin.

### 2) Gelişmiş: tek ajanda birden fazla profil

`auth-profiles.json`, aynı sağlayıcı için birden fazla profil kimliğini destekler.

Hangi profilin kullanılacağını seçin:

- yapılandırma sıralaması (`auth.order`) üzerinden genel olarak
- `/model ...@<profileId>` üzerinden oturum başına

Örnek (oturum geçersiz kılma):

- `/model Opus@anthropic:work`

Hangi profil kimliklerinin var olduğunu görme:

- `openclaw channels list --json` (`auth[]` gösterir)

İlgili belgeler:

- [Model yük devretme](/tr/concepts/model-failover) (rotasyon + cooldown kuralları)
- [Slash komutları](/tr/tools/slash-commands) (komut yüzeyi)

## İlgili

- [Kimlik Doğrulama](/tr/gateway/authentication) - model sağlayıcı kimlik doğrulama özeti
- [Gizli Değerler](/tr/gateway/secrets) - kimlik bilgisi depolama ve SecretRef
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#auth-storage) - kimlik doğrulama yapılandırma anahtarları
