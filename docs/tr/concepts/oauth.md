---
read_when:
    - OpenClaw OAuth'u uçtan uca anlamak istiyorsunuz
    - Token geçersiz kılma / oturum kapatma sorunlarıyla karşılaşıyorsunuz
    - Claude CLI veya OAuth kimlik doğrulama akışlarını istiyorsunuz
    - Birden fazla hesap veya profil yönlendirmesi istiyorsunuz
summary: 'OpenClaw''da OAuth: token değişimi, depolama ve çoklu hesap kalıpları'
title: OAuth
x-i18n:
    generated_at: "2026-07-12T12:15:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw, OAuth sunan sağlayıcılar için OAuth'u ("abonelik kimlik doğrulaması"),
özellikle **OpenAI Codex (ChatGPT OAuth)** ve **Anthropic Claude CLI yeniden kullanımını**
destekler. Anthropic için pratik ayrım şöyledir:

- **Anthropic API anahtarı**: normal Anthropic API faturalandırması.
- **OpenClaw içinde Anthropic Claude CLI / abonelik kimlik doğrulaması**: Anthropic
  çalışanları bu kullanıma yeniden izin verildiğini bize bildirdiğinden, Anthropic
  yeni bir politika yayımlamadığı sürece OpenClaw bu entegrasyon için Claude CLI
  yeniden kullanımını ve `claude -p` kullanımını onaylanmış olarak kabul eder.
  Üretimde Anthropic için API anahtarıyla kimlik doğrulama hâlâ önerilen daha güvenli
  yoldur.

OpenClaw, hem OpenAI API anahtarıyla kimlik doğrulamayı hem de ChatGPT/Codex OAuth'u
standart sağlayıcı kimliği `openai` altında saklar. Eski `openai-codex:*` profil
kimlikleri ve `auth.order.openai-codex` girdileri, `openclaw doctor --fix` tarafından
düzeltilen eski durum verileridir; yeni yapılandırmalarda `openai:*` profil kimliklerini
ve `auth.order.openai` kullanın.

Bu sayfada şunlar ele alınır:

- OAuth **belirteç değişiminin** nasıl çalıştığı (PKCE)
- belirteçlerin nerede **saklandığı** (ve nedeni)
- **birden çok hesabın** nasıl yönetileceği (profiller + oturum başına geçersiz kılmalar)

Kendi OAuth veya API anahtarı akışını sağlayan sağlayıcı Plugin'leri aynı giriş
noktası üzerinden çalışır:

```bash
openclaw models auth login --provider <id>
```

## Belirteç havuzu (neden var)

OAuth sağlayıcıları genellikle her oturum açma/yenileme işleminde yeni bir yenileme
belirteci oluşturur. Bazı sağlayıcılar, aynı kullanıcı/uygulama için yeni bir
yenileme belirteci verildiğinde önceki yenileme belirtecini geçersiz kılar. Pratik
belirti: OpenClaw _ve_ Claude Code / Codex CLI üzerinden oturum açarsınız ve daha
sonra bunlardan birinin oturumu rastgele kapatılır.

Bunu azaltmak için OpenClaw, kimlik doğrulama profili deposunu bir **belirteç havuzu**
olarak ele alır:

- çalışma zamanı, her agent için kimlik bilgilerini tek bir yerden okur
- birden çok profil birlikte bulunabilir ve yönlendirme belirli bir şekilde yapılır
- harici CLI yeniden kullanımı sağlayıcıya özeldir: OpenClaw bir sağlayıcı için yerel
  bir OAuth profilinin sahibi olduktan sonra yerel yenileme belirteci standart kabul
  edilir. Bu yerel yenileme belirteci reddedilirse OpenClaw, harici CLI belirteç
  malzemesine geri dönmek yerine profilin yeniden kimlik doğrulaması gerektirdiğini
  bildirir. Codex CLI başlangıç hazırlığı daha da sınırlıdır: yalnızca OpenClaw söz
  konusu sağlayıcının OAuth'unun sahibi olmadan önce boş bir `openai:default` tarzı
  profili başlangıç verileriyle doldurabilir; bundan sonra OpenClaw'un yönettiği
  yenilemeler standart olarak kalır
- durum/başlatma yolları, harici CLI keşfini önceden yapılandırılmış sağlayıcı kümesiyle
  sınırlar; böylece tek sağlayıcılı bir kurulum için ilgisiz bir CLI oturum açma
  deposu sorgulanmaz

## Depolama (belirteçlerin bulunduğu yer)

Gizli bilgiler, `auth-profiles.json` mantıksal adıyla anahtarlanarak agent başına
saklanır (temel depo agent'ın SQLite veritabanıdır; JSON adı uyumluluk ve araçlarda
görüntüleme amacıyla korunur):

- Kimlik doğrulama profilleri (OAuth + API anahtarları + isteğe bağlı değer düzeyinde
  başvurular):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski uyumluluk dosyası: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statik `api_key` girdileri keşfedildiğinde temizlenir)

Yalnızca eski verileri içe aktarmaya yönelik dosya (hâlâ desteklenir, ancak ana depo
değildir):

- `~/.openclaw/credentials/oauth.json` (ilk kullanımda kimlik doğrulama profili deposuna içe aktarılır)

Yukarıdakilerin tümü `$OPENCLAW_STATE_DIR` değerini de dikkate alır (durum dizini geçersiz kılması). Tam başvuru: [/gateway/configuration-reference#auth-storage](/tr/gateway/configuration-reference#auth-storage)

Statik gizli bilgi başvuruları ve çalışma zamanı anlık görüntüsü etkinleştirme davranışı
için [Gizli Bilgi Yönetimi](/tr/gateway/secrets) bölümüne bakın.

İkincil bir agent'ın yerel kimlik doğrulama profili yoksa OpenClaw, varsayılan/ana
agent deposundan okuma sırasında devralmayı kullanır; okuma sırasında ana agent'ın
deposunu kopyalamaz. OAuth yenileme belirteçleri özellikle hassastır: bazı sağlayıcılar
yenileme belirteçlerini kullanımdan sonra döndürdüğü veya geçersiz kıldığı için normal
kopyalama akışları varsayılan olarak bunları atlar. Bağımsız bir hesaba ihtiyaç duyan
agent için ayrı bir OAuth oturumu açın.

## Anthropic Claude CLI yeniden kullanımı

OpenClaw, Anthropic Claude CLI yeniden kullanımını ve `claude -p` kullanımını
onaylanmış bir kimlik doğrulama yolu olarak destekler. Ana makinede zaten yerel bir
Claude oturumunuz varsa başlangıç/yapılandırma işlemi bunu doğrudan yeniden
kullanabilir. Anthropic kurulum belirteci, desteklenen bir belirteç tabanlı kimlik
doğrulama yolu olarak kullanılmaya devam eder; ancak OpenClaw, kullanılabildiğinde
Claude CLI yeniden kullanımını tercih eder.

<Warning>
Anthropic'in herkese açık Claude Code belgeleri, doğrudan Claude Code kullanımının
Claude abonelik sınırları içinde kaldığını belirtir ve Anthropic çalışanları,
OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini bize bildirmiştir.
Bu nedenle Anthropic yeni bir politika yayımlamadığı sürece OpenClaw, bu entegrasyon
için Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylanmış olarak
kabul eder.

Anthropic'in doğrudan Claude Code kullanımına yönelik güncel plan belgeleri için
[Claude Code'u Pro veya Max planınızla
kullanma](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
ve [Claude Code'u Team veya Enterprise planınızla
kullanma](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)
bölümlerine bakın.

OpenClaw'da abonelik tarzı diğer seçenekleri kullanmak istiyorsanız [OpenAI
Codex](/tr/providers/openai), [Qwen Cloud Coding
Planı](/tr/providers/qwen), [MiniMax Coding Planı](/tr/providers/minimax)
ve [Z.AI / GLM Coding Planı](/tr/providers/zai) bölümlerine bakın.
</Warning>

## OAuth değişimi (oturum açma nasıl çalışır)

OpenClaw'un etkileşimli oturum açma akışları `openclaw/plugin-sdk/llm.ts` içinde
uygulanır ve sihirbazlara/komutlara bağlanır.

### Anthropic kurulum belirteci

Akışın yapısı:

1. OpenClaw'dan Anthropic kurulum belirteci veya belirteç yapıştırma işlemini başlatın
2. OpenClaw, elde edilen Anthropic kimlik bilgisini bir kimlik doğrulama profilinde saklar
3. model seçimi `anthropic/...` üzerinde kalır
4. mevcut Anthropic kimlik doğrulama profilleri geri alma/sıralama denetimi için kullanılabilir kalır

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth, OpenClaw iş akışları dâhil olmak üzere Codex CLI dışında kullanım
için açıkça desteklenir.

Oturum açma komutu standart OpenAI sağlayıcı kimliğini kullanır:

```bash
openclaw models auth login --provider openai
```

Tek bir agent içinde birden çok ChatGPT/Codex OAuth hesabı için
`--profile-id openai:<name>` kullanın. Yeni profiller için `openai-codex:<name>`
kullanmayın. Doctor, bu eski öneki çakışmasız bir `openai:*` profil kimliğine taşır;
profil kimliklerini `auth.order` veya `/model ...@<profileId>` içine kopyalamadan önce
onarım sonrasında `openclaw models auth list --provider openai` komutunu çalıştırın.

Akışın yapısı (PKCE):

1. bir PKCE doğrulayıcı/sınama değeri ve rastgele bir `state` oluşturun
2. `https://auth.openai.com/oauth/authorize?...` adresini açın (kapsam:
   `openid profile email offline_access`)
3. geri çağırmayı `http://localhost:1455/auth/callback` adresinde yakalamayı deneyin
   (geri çağırma ana makinesi varsayılan olarak `localhost` değerini kullanır ve
   yalnızca local loopback ana makinelerini kabul eder; `OPENCLAW_OAUTH_CALLBACK_HOST`
   ile geçersiz kılın)
4. geri çağırma ulaşmadan önce bir kod yapıştırabiliyorsanız (veya uzak/başsız
   ortamdaysanız ve geri çağırma bağlanamıyorsa) bunun yerine yönlendirme URL'sini/kodu
   yapıştırın; elle yapıştırma, tarayıcı geri çağırmasıyla yarışır ve önce tamamlanan
   kazanır
5. kodu `https://auth.openai.com/oauth/token` adresinde değiştirin
6. erişim belirtecinden `accountId` değerini çıkarın ve `{ access, refresh, expires, accountId }` değerini saklayın

Sihirbaz yolu `openclaw onboard` → kimlik doğrulama seçimi `openai` şeklindedir.

## Yenileme + süre sonu

Profiller bir `expires` zaman damgası saklar. Çalışma zamanında:

- `expires` gelecekteyse saklanan erişim belirtecini kullanın
- süresi dolmuşsa yenileyin (dosya kilidi altında) ve saklanan kimlik bilgilerinin üzerine yazın
- ikincil bir agent, ana agent'tan devralınmış bir OAuth profilini okursa yenileme
  belirtecini ikincil agent deposuna kopyalamak yerine yenileme işlemi ana agent
  deposuna geri yazılır
- harici olarak yönetilen CLI kimlik bilgileri (Claude CLI, sınırlı Codex CLI başlangıç
  hazırlığı; bkz. [Belirteç havuzu](#the-token-sink-why-it-exists)), kopyalanmış bir
  yenileme belirtecini harcamak yerine yeniden okunur. Yönetilen bir yenileme başarısız
  olursa OpenClaw, harici CLI belirteç malzemesini döndürmek yerine etkilenen profilin
  yeniden kimlik doğrulaması gerektirdiğini bildirir.

Yenileme akışı otomatiktir; genellikle belirteçleri elle yönetmeniz gerekmez.

## Birden çok hesap (profiller) + yönlendirme

İki yöntem vardır:

### 1) Tercih edilen: ayrı agent'lar

"Kişisel" ve "iş" hesaplarının hiçbir zaman etkileşim kurmamasını istiyorsanız yalıtılmış
agent'lar kullanın (ayrı oturumlar + kimlik bilgileri + çalışma alanı):

```bash
openclaw agents add work
openclaw agents add personal
```

Ardından kimlik doğrulamayı agent başına yapılandırın (sihirbaz) ve sohbetleri doğru
agent'a yönlendirin.

### 2) Gelişmiş: tek bir agent içinde birden çok profil

Kimlik doğrulama profili deposu, aynı sağlayıcı için birden çok profil kimliğini
destekler. Hangisinin kullanılacağını seçin:

- yapılandırma sıralaması (`auth.order`) aracılığıyla genel olarak
- `/model ...@<profileId>` aracılığıyla oturum başına

Örnek (oturum geçersiz kılması):

- `/model Opus@anthropic:work`

Mevcut profil kimliklerini şu komutla listeleyin:

```bash
openclaw models auth list --provider <id>
```

İlgili belgeler:

- [Model yük devri](/tr/concepts/model-failover) (döndürme + bekleme süresi kuralları)
- [Eğik çizgi komutları](/tr/tools/slash-commands) (komut yüzeyi)

## İlgili

- [Kimlik doğrulama](/tr/gateway/authentication) - model sağlayıcısı kimlik doğrulamasına genel bakış
- [Gizli bilgiler](/tr/gateway/secrets) - kimlik bilgisi depolama ve SecretRef
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#auth-storage) - kimlik doğrulama yapılandırma anahtarları
