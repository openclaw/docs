---
read_when:
    - OpenClaw OAuth'ı uçtan uca anlamak istiyorsunuz
    - Token geçersiz kılma / oturum kapatma sorunları yaşıyorsunuz
    - Claude CLI veya OAuth kimlik doğrulama akışlarını istiyorsunuz
    - Birden fazla hesap veya profil yönlendirmesi istiyorsunuz
summary: 'OpenClaw''da OAuth: token değişimi, depolama ve çoklu hesap kalıpları'
title: OAuth
x-i18n:
    generated_at: "2026-07-16T17:20:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ef94af0601b7d57bb7e2d53c3d8231708b401251eca7dc1bb1e7e4fc09b46da
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw, bunu sunan sağlayıcılar için OAuth'u ("abonelik kimlik doğrulaması") destekler;
özellikle **OpenAI Codex (ChatGPT OAuth)** ve **Anthropic Claude CLI yeniden kullanımı**.
Anthropic için pratik ayrım şöyledir:

- **Anthropic API anahtarı**: normal Anthropic API faturalandırması.
- **OpenClaw içinde Anthropic Claude CLI / abonelik kimlik doğrulaması**: Anthropic personeli
  bu kullanıma yeniden izin verildiğini bize bildirdiğinden, Anthropic yeni bir
  politika yayımlamadığı sürece OpenClaw, bu entegrasyon için Claude CLI yeniden
  kullanımını ve `claude -p` kullanımını onaylanmış kabul eder. Üretimde
  Anthropic için API anahtarıyla kimlik doğrulama hâlâ önerilen daha güvenli yoldur.

OpenClaw, hem OpenAI API anahtarıyla kimlik doğrulamayı hem de ChatGPT/Codex OAuth'u
standart sağlayıcı kimliği `openai` altında depolar. Eski
`openai-codex:*` profil kimlikleri ve `auth.order.openai-codex` girdileri,
`openclaw doctor --fix` tarafından onarılan eski durumdur; yeni yapılandırma için
`openai:*` profil kimliklerini ve `auth.order.openai` kullanın.

Bu sayfa şunları kapsar:

- OAuth **belirteç değişiminin** nasıl çalıştığı (PKCE)
- belirteçlerin nerede **depolandığı** (ve nedeni)
- **birden fazla hesabın** nasıl yönetileceği (profiller + oturum başına geçersiz kılmalar)

Kendi OAuth veya API anahtarı akışını sağlayan sağlayıcı Plugin'leri aynı
giriş noktası üzerinden çalışır:

```bash
openclaw models auth login --provider <id>
```

## Belirteç havuzu (neden var)

OAuth sağlayıcıları genellikle her oturum açma/yenileme işleminde yeni bir yenileme
belirteci oluşturur. Bazı sağlayıcılar, aynı kullanıcı/uygulama için yeni bir
yenileme belirteci oluşturulduğunda önceki yenileme belirtecini geçersiz kılar.
Pratik belirti: OpenClaw _ve_ Claude Code / Codex CLI üzerinden oturum açıldığında
bunlardan birinin daha sonra rastgele oturumunun kapatılmasıdır.

Bunu azaltmak için OpenClaw, kimlik doğrulama profili deposunu bir **belirteç havuzu** olarak ele alır:

- çalışma zamanı, her agent için kimlik bilgilerini tek bir yerden okur
- birden fazla profil birlikte bulunabilir ve yönlendirme belirlenimsel olarak yapılabilir
- harici CLI yeniden kullanımı sağlayıcıya özeldir: OpenClaw bir sağlayıcı
  için yerel OAuth profilinin sahibi olduktan sonra yerel yenileme belirteci
  standart kabul edilir. Bu yerel yenileme belirteci reddedilirse OpenClaw,
  harici CLI belirteç malzemesine geri dönmek yerine profili yeniden kimlik
  doğrulaması için bildirir. Codex CLI önyüklemesi daha da sınırlıdır: yalnızca
  OpenClaw o sağlayıcının OAuth'unun sahibi olmadan önce boş bir
  `openai:default` tarzı profili başlatabilir; bundan sonra OpenClaw'un
  gerçekleştirdiği yenilemeler standart kalır
- durum/başlatma yolları, harici CLI keşfini önceden yapılandırılmış
  sağlayıcı kümesiyle sınırlar; böylece tek sağlayıcılı bir kurulumda ilgisiz
  bir CLI oturum açma deposu yoklanmaz

## Depolama (belirteçlerin bulunduğu yer)

Gizli bilgiler, mantıksal `auth-profiles.json` adıyla anahtarlanarak her agent için
ayrı tutulur (temel depo agent'ın SQLite veritabanıdır; JSON adı uyumluluk ve
araç gösterimi için korunur):

- Kimlik doğrulama profilleri (OAuth + API anahtarları + isteğe bağlı değer düzeyi referansları):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski uyumluluk dosyası: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statik `api_key` girdileri keşfedildiğinde temizlenir)

Yalnızca eski içe aktarma dosyası (hâlâ desteklenir ancak ana depo değildir):

- `~/.openclaw/credentials/oauth.json` (ilk kullanımda kimlik doğrulama profili deposuna aktarılır)

Yukarıdakilerin tümü `$OPENCLAW_STATE_DIR` değerini de dikkate alır (durum dizini geçersiz kılması). Tam başvuru: [/gateway/configuration-reference#auth-storage](/tr/gateway/configuration-reference#auth-storage)

Statik gizli bilgi referansları ve çalışma zamanı anlık görüntüsünü etkinleştirme davranışı için [Gizli Bilgi Yönetimi](/tr/gateway/secrets) bölümüne bakın.

İkincil bir agent'ın yerel kimlik doğrulama profili yoksa OpenClaw,
varsayılan/ana agent deposundan okuma sırasında devralmayı kullanır; okuma
sırasında ana agent'ın deposunu klonlamaz. OAuth yenileme belirteçleri özellikle
hassastır: bazı sağlayıcılar yenileme belirteçlerini kullanımdan sonra
döndürdüğü veya geçersiz kıldığı için normal kopyalama akışları bunları
varsayılan olarak atlar. Bağımsız bir hesaba ihtiyaç duyan agent için ayrı bir
OAuth oturum açma işlemi yapılandırın.

## Anthropic Claude CLI yeniden kullanımı

OpenClaw, onaylanmış bir kimlik doğrulama yolu olarak Anthropic Claude CLI yeniden
kullanımını ve `claude -p` destekler. Ana makinede zaten yerel bir Claude
oturumunuz varsa ilk katılım/yapılandırma işlemi bunu doğrudan yeniden
kullanabilir. Anthropic kurulum belirteci, desteklenen bir belirteçle kimlik
doğrulama yolu olarak kullanılmaya devam eder; ancak OpenClaw, kullanılabilir
olduğunda Claude CLI yeniden kullanımını tercih eder.

<Warning>
Anthropic'in herkese açık Claude Code belgeleri, Claude Code'un doğrudan
kullanımının Claude abonelik sınırları içinde kaldığını belirtir ve Anthropic
personeli, OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini bize
bildirmiştir. Bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadığı
sürece bu entegrasyon için Claude CLI yeniden kullanımını ve
`claude -p` kullanımını onaylanmış kabul eder.

Anthropic'in güncel doğrudan Claude Code planı belgeleri için [Claude Code'u
Pro veya Max planınızla
kullanma](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
ve [Claude Code'u Team veya Enterprise planınızla
kullanma](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)
sayfalarına bakın.

OpenClaw'da abonelik tarzı başka seçenekler istiyorsanız [OpenAI
Codex](/tr/providers/openai), [Qwen Cloud Coding
Plan](/tr/providers/qwen), [MiniMax Coding Plan](/tr/providers/minimax)
ve [Z.AI / GLM Coding Plan](/tr/providers/zai) sayfalarına bakın.
</Warning>

## OAuth değişimi (oturum açmanın çalışma biçimi)

OpenClaw'un etkileşimli oturum açma akışları `openclaw/plugin-sdk/llm.ts` içinde uygulanır ve sihirbazlara/komutlara bağlanır.

### Anthropic kurulum belirteci

Akış biçimi:

1. Claude Code bulunan herhangi bir makinede `claude setup-token` çalıştırarak belirteci oluşturun, ardından OpenClaw'dan Anthropic kurulum belirteci veya belirteç yapıştırma işlemini başlatın
2. OpenClaw, ortaya çıkan Anthropic kimlik bilgisini bir kimlik doğrulama profilinde depolar
3. model seçimi `anthropic/...` üzerinde kalır
4. mevcut Anthropic kimlik doğrulama profilleri geri alma/sıralama denetimi için kullanılabilir durumda kalır

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth'un, OpenClaw iş akışları dâhil olmak üzere Codex CLI dışında kullanımı açıkça desteklenir.

Oturum açma komutu standart OpenAI sağlayıcı kimliğini kullanır:

```bash
openclaw models auth login --provider openai
```

Bir agent içinde birden fazla ChatGPT/Codex OAuth hesabı için
`--profile-id openai:<name>` kullanın. Yeni profiller için `openai-codex:<name>`
kullanmayın. Doctor, bu eski ön eki çakışmasız bir `openai:*` profil
kimliğine taşır; profil kimliklerini `auth.order` veya
`/model ...@<profileId>` içine kopyalamadan önce onarımdan sonra
`openclaw models auth list --provider openai` çalıştırın.

Akış biçimi (PKCE):

1. bir PKCE doğrulayıcısı/sınaması ve rastgele bir `state` oluşturun
2. `https://auth.openai.com/oauth/authorize?...` adresini açın (kapsam:
   `openid profile email offline_access`)
3. `http://localhost:1455/auth/callback` üzerindeki geri çağırmayı yakalamayı deneyin
   (geri çağırma ana makinesi varsayılan olarak `localhost` değerini
   kullanır ve yalnızca geri döngü ana makinelerini kabul eder;
   `OPENCLAW_OAUTH_CALLBACK_HOST` ile geçersiz kılın)
4. geri çağırma ulaşmadan önce kod yapıştırabiliyorsanız (veya
   uzak/ekransız ortamdaysanız ve geri çağırma bağlanamıyorsa) bunun yerine
   yönlendirme URL'sini/kodunu yapıştırın; elle yapıştırma işlemi tarayıcı geri
   çağırmasıyla yarışır ve önce tamamlanan kazanır
5. kodu `https://auth.openai.com/oauth/token` üzerinde değiştirin
6. erişim belirtecinden `accountId` değerini çıkarın ve `{ access, refresh, expires, accountId }` depolayın

Sihirbaz yolu `openclaw onboard` → kimlik doğrulama seçeneği `openai` şeklindedir.

## Yenileme + sona erme

Profiller bir `expires` zaman damgası depolar. Çalışma zamanında:

- `expires` gelecekteyse depolanan erişim belirtecini kullanın
- süresi dolmuşsa yenileyin (bir dosya kilidi altında) ve depolanan kimlik bilgilerinin üzerine yazın
- ikincil bir agent, devralınan bir ana agent OAuth profilini okursa
  yenileme işlemi, yenileme belirtecini ikincil agent deposuna kopyalamak yerine
  ana agent deposuna geri yazar
- harici olarak yönetilen CLI kimlik bilgileri (Claude CLI, sınırlı Codex CLI
  önyüklemesi; bkz. [Belirteç havuzu](#the-token-sink-why-it-exists)), kopyalanmış
  bir yenileme belirtecini harcamak yerine yeniden okunur. Yönetilen yenileme
  başarısız olursa OpenClaw, harici CLI belirteç malzemesini döndürmek yerine
  etkilenen profili yeniden kimlik doğrulaması için bildirir.

Yenileme akışı otomatiktir; genellikle belirteçleri elle yönetmeniz gerekmez.

## Birden fazla hesap (profiller) + yönlendirme

İki yöntem:

### 1) Tercih edilen: ayrı agent'lar

"Kişisel" ve "iş" hesaplarının hiçbir zaman etkileşime girmemesini istiyorsanız
yalıtılmış agent'lar (ayrı oturumlar + kimlik bilgileri + çalışma alanı) kullanın:

```bash
openclaw agents add work
openclaw agents add personal
```

Ardından kimlik doğrulamayı agent başına yapılandırın (sihirbaz) ve sohbetleri doğru agent'a yönlendirin.

### 2) İleri düzey: tek agent içinde birden fazla profil

Kimlik doğrulama profili deposu, aynı sağlayıcı için birden fazla profil
kimliğini destekler. Hangisinin kullanılacağını seçin:

- yapılandırma sıralaması aracılığıyla genel olarak (`auth.order`)
- oturum başına `/model ...@<profileId>` aracılığıyla

Örnek (oturum geçersiz kılması):

- `/model Opus@anthropic:work`

Mevcut profil kimliklerini şununla listeleyin:

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
