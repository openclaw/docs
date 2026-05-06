---
read_when:
    - OpenClaw OAuth'u uçtan uca anlamak istiyorsunuz
    - Belirteç geçersiz kılma / oturum kapatma sorunlarıyla karşılaştınız
    - Claude CLI veya OAuth kimlik doğrulama akışlarını istiyorsunuz
    - Birden çok hesap veya profil yönlendirmesi istiyorsunuz
summary: 'OpenClaw''da OAuth: belirteç değişimi, depolama ve çoklu hesap kalıpları'
title: OAuth
x-i18n:
    generated_at: "2026-05-06T09:09:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 223480a24bd30f92f5d9fdc35e937e582f9e81f5bee2fb0e5c0ea445ac552a40
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw, bunu sunan sağlayıcılar için OAuth üzerinden "abonelik kimlik doğrulaması" destekler
(özellikle **OpenAI Codex (ChatGPT OAuth)**). Anthropic için pratik ayrım
artık şöyledir:

- **Anthropic API anahtarı**: normal Anthropic API faturalandırması
- **OpenClaw içindeki Anthropic Claude CLI / abonelik kimlik doğrulaması**: Anthropic çalışanları
  bize bu kullanımın tekrar izinli olduğunu söyledi

OpenAI Codex OAuth, OpenClaw gibi harici araçlarda kullanım için açıkça desteklenir. Bu sayfa şunları açıklar:

Üretimde Anthropic için, API anahtarı kimlik doğrulaması önerilen daha güvenli yoldur.

- OAuth **token değişiminin** nasıl çalıştığı (PKCE)
- tokenların nerede **saklandığı** (ve neden)
- **birden çok hesabın** nasıl ele alınacağı (profiller + oturum başına geçersiz kılmalar)

OpenClaw ayrıca kendi OAuth veya API anahtarı
akışlarını sağlayan **sağlayıcı pluginleri** destekler. Bunları şu komutla çalıştırın:

```bash
openclaw models auth login --provider <id>
```

## Token yutağı (neden var)

OAuth sağlayıcıları, oturum açma/yenileme akışları sırasında yaygın olarak **yeni bir refresh token** üretir. Bazı sağlayıcılar (veya OAuth istemcileri), aynı kullanıcı/uygulama için yeni bir refresh token verildiğinde eski refresh tokenları geçersiz kılabilir.

Pratik belirti:

- OpenClaw _ve_ Claude Code / Codex CLI üzerinden oturum açarsınız → daha sonra bunlardan biri rastgele "oturumdan çıkarılmış" olur

Bunu azaltmak için OpenClaw, `auth-profiles.json` dosyasını bir **token yutağı** olarak ele alır:

- çalışma zamanı kimlik bilgilerini **tek bir yerden** okur
- birden çok profili tutabilir ve bunları deterministik şekilde yönlendirebiliriz
- harici CLI yeniden kullanımı sağlayıcıya özeldir: Codex CLI boş bir
  `openai-codex:default` profilini başlatabilir, ancak OpenClaw yerel bir OAuth profiline sahip olduğunda,
  yerel refresh token kanoniktir; diğer entegrasyonlar
  harici olarak yönetilmeye devam edebilir ve CLI kimlik doğrulama depolarını yeniden okuyabilir
- yapılandırılmış sağlayıcı kümesini zaten bilen durum ve başlatma yolları,
  harici CLI keşfini bu kümeyle sınırlar; böylece tek sağlayıcılı bir kurulum için
  ilgisiz bir CLI oturum açma deposu yoklanmaz

## Depolama (tokenlar nerede bulunur)

Gizli bilgiler aracı kimlik doğrulama depolarında saklanır:

- Kimlik doğrulama profilleri (OAuth + API anahtarları + isteğe bağlı değer düzeyi başvurular): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski uyumluluk dosyası: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statik `api_key` girdileri keşfedildiğinde temizlenir)

Yalnızca eski içe aktarma dosyası (hala desteklenir, ancak ana depo değildir):

- `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır)

Yukarıdakilerin tümü `$OPENCLAW_STATE_DIR` değerini de dikkate alır (durum dizini geçersiz kılma). Tam başvuru: [/gateway/configuration](/tr/gateway/configuration-reference#auth-storage)

Statik gizli bilgi başvuruları ve çalışma zamanı anlık görüntü etkinleştirme davranışı için bkz. [Gizli Bilgi Yönetimi](/tr/gateway/secrets).

İkincil bir aracının yerel kimlik doğrulama profili yoksa, OpenClaw varsayılan/ana aracı deposundan
okuma geçişli kalıtım kullanır. Okuma sırasında ana
aracının `auth-profiles.json` dosyasını klonlamaz. OAuth refresh tokenları özellikle
hassastır: normal kopyalama akışları bunları varsayılan olarak atlar, çünkü bazı sağlayıcılar refresh tokenları
kullanımdan sonra döndürür veya geçersiz kılar. Bir aracı
bağımsız bir hesaba ihtiyaç duyduğunda onun için ayrı bir OAuth oturumu yapılandırın.

## Anthropic eski token uyumluluğu

<Warning>
Anthropic'in herkese açık Claude Code belgeleri, doğrudan Claude Code kullanımının
Claude abonelik sınırları içinde kaldığını söyler ve Anthropic çalışanları bize OpenClaw tarzı Claude
CLI kullanımının tekrar izinli olduğunu belirtti. Bu nedenle OpenClaw, Anthropic
yeni bir politika yayımlamadığı sürece bu entegrasyon için Claude CLI yeniden kullanımını ve
`claude -p` kullanımını onaylı kabul eder.

Anthropic'in mevcut doğrudan Claude Code plan belgeleri için bkz. [Claude Code'u Pro veya Max
planınızla kullanma](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
ve [Claude Code'u Team veya Enterprise
planınızla kullanma](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

OpenClaw içinde diğer abonelik tarzı seçenekler istiyorsanız bkz. [OpenAI
Codex](/tr/providers/openai), [Qwen Cloud Coding
Plan](/tr/providers/qwen), [MiniMax Coding Plan](/tr/providers/minimax),
ve [Z.AI / GLM Coding Plan](/tr/providers/glm).
</Warning>

OpenClaw ayrıca Anthropic kurulum tokenını desteklenen bir token kimlik doğrulama yolu olarak sunar, ancak artık kullanılabilir olduğunda Claude CLI yeniden kullanımını ve `claude -p` komutunu tercih eder.

## Anthropic Claude CLI geçişi

OpenClaw, Anthropic Claude CLI yeniden kullanımını tekrar destekler. Ana makinede zaten yerel bir
Claude oturumunuz varsa, onboarding/yapılandırma bunu doğrudan yeniden kullanabilir.

## OAuth değişimi (oturum açma nasıl çalışır)

OpenClaw'ın etkileşimli oturum açma akışları `@mariozechner/pi-ai` içinde uygulanır ve sihirbazlara/komutlara bağlanır.

### Anthropic kurulum tokenı

Akış şekli:

1. OpenClaw'dan Anthropic kurulum tokenını başlatın veya token yapıştırın
2. OpenClaw, ortaya çıkan Anthropic kimlik bilgisini bir kimlik doğrulama profilinde saklar
3. model seçimi `anthropic/...` üzerinde kalır
4. mevcut Anthropic kimlik doğrulama profilleri geri alma/sıralama denetimi için kullanılabilir kalır

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth, OpenClaw iş akışları dahil olmak üzere Codex CLI dışında kullanım için açıkça desteklenir.

Akış şekli (PKCE):

1. PKCE verifier/challenge + rastgele `state` üretin
2. `https://auth.openai.com/oauth/authorize?...` adresini açın
3. callback'i `http://127.0.0.1:1455/auth/callback` üzerinde yakalamayı deneyin
4. callback bağlanamazsa (veya uzak/headless çalışıyorsanız), yönlendirme URL'sini/kodu yapıştırın
5. `https://auth.openai.com/oauth/token` adresinde değişim yapın
6. access tokendan `accountId` değerini çıkarın ve `{ access, refresh, expires, accountId }` saklayın

Sihirbaz yolu `openclaw onboard` → kimlik doğrulama seçimi `openai-codex` şeklindedir.

## Yenileme + sona erme

Profiller bir `expires` zaman damgası saklar.

Çalışma zamanında:

- `expires` gelecekteyse → saklanan access token kullanılır
- süresi dolmuşsa → yenilenir (bir dosya kilidi altında) ve saklanan kimlik bilgileri üzerine yazılır
- ikincil bir aracı, kalıtımla gelen ana aracı OAuth profilini okursa, yenileme
  refresh tokenı ikincil aracı deposuna kopyalamak yerine ana aracı deposuna
  geri yazar
- istisna: bazı harici CLI kimlik bilgileri harici olarak yönetilmeye devam eder; OpenClaw
  kopyalanmış refresh tokenları harcamak yerine bu CLI kimlik doğrulama depolarını yeniden okur.
  Codex CLI başlatması kasıtlı olarak daha dardır: boş bir
  `openai-codex:default` profili tohumlar, ardından OpenClaw tarafından sahiplenilen yenilemeler yerel
  profili kanonik tutar.

Yenileme akışı otomatiktir; genellikle tokenları elle yönetmeniz gerekmez.

## Birden çok hesap (profiller) + yönlendirme

İki desen:

### 1) Tercih edilen: ayrı aracılar

"Kişisel" ve "iş" hesaplarının asla etkileşime girmemesini istiyorsanız, yalıtılmış aracılar kullanın (ayrı oturumlar + kimlik bilgileri + çalışma alanı):

```bash
openclaw agents add work
openclaw agents add personal
```

Ardından aracı başına kimlik doğrulamayı yapılandırın (sihirbaz) ve sohbetleri doğru aracıya yönlendirin.

### 2) Gelişmiş: tek aracıda birden çok profil

`auth-profiles.json`, aynı sağlayıcı için birden çok profil kimliğini destekler.

Hangi profilin kullanılacağını seçin:

- yapılandırma sıralaması (`auth.order`) üzerinden genel olarak
- `/model ...@<profileId>` üzerinden oturum başına

Örnek (oturum geçersiz kılması):

- `/model Opus@anthropic:work`

Hangi profil kimliklerinin mevcut olduğunu görme:

- `openclaw channels list --json` (`auth[]` öğesini gösterir)

İlgili belgeler:

- [Model yük devretme](/tr/concepts/model-failover) (rotasyon + bekleme süresi kuralları)
- [Slash komutları](/tr/tools/slash-commands) (komut yüzeyi)

## İlgili

- [Kimlik Doğrulama](/tr/gateway/authentication) - model sağlayıcı kimlik doğrulamasına genel bakış
- [Gizli Bilgiler](/tr/gateway/secrets) - kimlik bilgisi depolama ve SecretRef
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#auth-storage) - kimlik doğrulama yapılandırma anahtarları
