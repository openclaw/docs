---
read_when:
    - OpenClaw OAuth'u uçtan uca anlamak istiyorsunuz
    - Token geçersiz kılma / oturum kapatma sorunları yaşıyorsunuz
    - Claude CLI veya OAuth kimlik doğrulama akışları istiyorsunuz
    - Birden fazla hesap veya profil yönlendirmesi istiyorsunuz
summary: 'OpenClaw''da OAuth: belirteç değişimi, depolama ve çok hesaplı desenler'
title: OAuth
x-i18n:
    generated_at: "2026-06-28T00:29:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw, bunu sunan sağlayıcılar için OAuth üzerinden "abonelik kimlik doğrulamasını" destekler
(özellikle **OpenAI Codex (ChatGPT OAuth)**). Anthropic için pratik ayrım
artık şöyledir:

- **Anthropic API anahtarı**: normal Anthropic API faturalandırması
- **OpenClaw içinde Anthropic Claude CLI / abonelik kimlik doğrulaması**: Anthropic çalışanları
  bize bu kullanımın yeniden izinli olduğunu söyledi

OpenAI Codex OAuth, OpenClaw gibi harici araçlarda kullanım için açıkça desteklenir.

OpenClaw, hem OpenAI API anahtarı kimlik doğrulamasını hem de ChatGPT/Codex OAuth'u
kurallı sağlayıcı kimliği `openai` altında saklar. Eski `openai-codex:*` profil kimlikleri ve
`auth.order.openai-codex` girdileri, `openclaw doctor --fix` tarafından onarılan eski durumdur; yeni yapılandırma için `openai:*` profil kimliklerini ve `auth.order.openai` kullanın.

Anthropic için üretimde, API anahtarı kimlik doğrulaması daha güvenli önerilen yoldur.

Bu sayfa şunları açıklar:

- OAuth **token değişiminin** nasıl çalıştığı (PKCE)
- token'ların nerede **saklandığı** (ve neden)
- **birden fazla hesabın** nasıl ele alınacağı (profiller + oturum başına geçersiz kılmalar)

OpenClaw ayrıca kendi OAuth veya API anahtarı akışlarını getiren **sağlayıcı plugin'leri** destekler.
Bunları şu şekilde çalıştırın:

```bash
openclaw models auth login --provider <id>
```

## Token havuzu (neden var)

OAuth sağlayıcıları, giriş/yenileme akışları sırasında yaygın olarak **yeni bir refresh token** üretir. Bazı sağlayıcılar (veya OAuth istemcileri), aynı kullanıcı/uygulama için yeni bir token verildiğinde eski refresh token'ları geçersiz kılabilir.

Pratik belirti:

- OpenClaw üzerinden _ve_ Claude Code / Codex CLI üzerinden giriş yaparsınız → içlerinden biri daha sonra rastgele "oturumu kapatılmış" hale gelir

Bunu azaltmak için OpenClaw, `auth-profiles.json` dosyasını bir **token havuzu** olarak ele alır:

- runtime, kimlik bilgilerini **tek bir yerden** okur
- birden fazla profili tutabilir ve bunları deterministik şekilde yönlendirebiliriz
- harici CLI yeniden kullanımı sağlayıcıya özeldir: Codex CLI boş bir
  `openai:default` profilini başlatabilir, ancak OpenClaw yerel bir OAuth profiline sahip olduğunda
  yerel refresh token kurallıdır. Bu yerel refresh token reddedilirse,
  OpenClaw kullanılabilir aynı hesap Codex CLI token'ını yalnızca runtime için
  yedek olarak kullanabilir; diğer entegrasyonlar harici olarak yönetilmeye devam edebilir ve
  CLI kimlik doğrulama depolarını yeniden okuyabilir
- yapılandırılmış sağlayıcı kümesini zaten bilen durum ve başlangıç yolları,
  harici CLI keşfini bu kümeyle sınırlar; böylece tek sağlayıcılı bir kurulum için
  alakasız bir CLI giriş deposu yoklanmaz

## Depolama (token'lar nerede tutulur)

Gizli bilgiler ajan kimlik doğrulama depolarında saklanır:

- Kimlik doğrulama profilleri (OAuth + API anahtarları + isteğe bağlı değer düzeyi ref'ler): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski uyumluluk dosyası: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statik `api_key` girdileri keşfedildiğinde temizlenir)

Yalnızca eski içe aktarma dosyası (hâlâ desteklenir, ancak ana depo değildir):

- `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır)

Yukarıdakilerin tümü `$OPENCLAW_STATE_DIR` değerine de uyar (durum dizini geçersiz kılma). Tam referans: [/gateway/configuration](/tr/gateway/configuration-reference#auth-storage)

Statik secret ref'ler ve runtime anlık görüntü etkinleştirme davranışı için [Gizli Bilgi Yönetimi](/tr/gateway/secrets) bölümüne bakın.

İkincil bir ajanın yerel kimlik doğrulama profili yoksa OpenClaw, varsayılan/ana ajan deposundan okuma geçişli
kalıtım kullanır. Okuma sırasında ana ajanın `auth-profiles.json` dosyasını klonlamaz. OAuth refresh token'ları özellikle
hassastır: normal kopyalama akışları bunları varsayılan olarak atlar, çünkü bazı sağlayıcılar refresh token'ları kullanımdan sonra döndürür
veya geçersiz kılar. Bağımsız bir hesaba ihtiyaç duyduğunda ajan için ayrı bir OAuth girişi yapılandırın.

## Anthropic eski token uyumluluğu

<Warning>
Anthropic'in herkese açık Claude Code dokümanları, doğrudan Claude Code kullanımının
Claude abonelik sınırları içinde kaldığını söyler ve Anthropic çalışanları bize OpenClaw tarzı Claude
CLI kullanımının yeniden izinli olduğunu söyledi. Bu nedenle OpenClaw, Anthropic
yeni bir ilke yayımlamadığı sürece bu entegrasyon için Claude CLI yeniden kullanımını ve
`claude -p` kullanımını onaylı kabul eder.

Anthropic'in güncel doğrudan Claude Code plan dokümanları için [Claude Code'u Pro veya Max
planınızla kullanma](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
ve [Claude Code'u Team veya Enterprise
planınızla kullanma](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/) bölümlerine bakın.

OpenClaw içinde diğer abonelik tarzı seçenekleri istiyorsanız [OpenAI
Codex](/tr/providers/openai), [Qwen Cloud Coding
Plan](/tr/providers/qwen), [MiniMax Coding Plan](/tr/providers/minimax)
ve [Z.AI / GLM Coding Plan](/tr/providers/zai) bölümlerine bakın.
</Warning>

OpenClaw ayrıca Anthropic setup-token'ı desteklenen bir token kimlik doğrulama yolu olarak sunar, ancak artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` komutunu tercih eder.

## Anthropic Claude CLI geçişi

OpenClaw, Anthropic Claude CLI yeniden kullanımını tekrar destekler. Ana makinede zaten yerel bir
Claude girişi varsa onboarding/configure bunu doğrudan yeniden kullanabilir.

## OAuth değişimi (giriş nasıl çalışır)

OpenClaw'ın etkileşimli giriş akışları `openclaw/plugin-sdk/llm` içinde uygulanır ve sihirbazlara/komutlara bağlanır.

### Anthropic setup-token

Akış şekli:

1. OpenClaw'dan Anthropic setup-token veya paste-token başlatın
2. OpenClaw, ortaya çıkan Anthropic kimlik bilgisini bir kimlik doğrulama profilinde saklar
3. model seçimi `anthropic/...` üzerinde kalır
4. mevcut Anthropic kimlik doğrulama profilleri geri alma/sıralama denetimi için kullanılabilir kalır

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth, OpenClaw iş akışları dahil Codex CLI dışında kullanım için açıkça desteklenir.

Giriş komutu hâlâ kurallı OpenAI sağlayıcı kimliğini kullanır:

```bash
openclaw models auth login --provider openai
```

Bir ajanda birden fazla ChatGPT/Codex OAuth hesabı için `--profile-id openai:<name>` kullanın.
Yeni profiller için `openai-codex:<name>` kullanmayın. Doctor bu eski ön eki çakışmasız bir
`openai:*` profil kimliğine taşır; profil kimliklerini `auth.order` veya `/model ...@<profileId>` içine kopyalamadan önce onarımdan sonra
`openclaw models auth list --provider openai` çalıştırın.

Akış şekli (PKCE):

1. PKCE doğrulayıcı/challenge + rastgele `state` oluştur
2. `https://auth.openai.com/oauth/authorize?...` adresini aç
3. `http://127.0.0.1:1455/auth/callback` üzerinde callback yakalamayı dene
4. callback bağlanamazsa (veya uzaktan/headless çalışıyorsanız), yönlendirme URL'sini/kodunu yapıştırın
5. `https://auth.openai.com/oauth/token` üzerinde değişim yapın
6. erişim token'ından `accountId` çıkarın ve `{ access, refresh, expires, accountId }` saklayın

Sihirbaz yolu `openclaw onboard` → kimlik doğrulama seçimi `openai`.

## Yenileme + sona erme

Profiller bir `expires` zaman damgası saklar.

Runtime sırasında:

- `expires` gelecekteyse → saklanan erişim token'ını kullan
- süresi dolmuşsa → yenile (dosya kilidi altında) ve saklanan kimlik bilgilerini üzerine yaz
- ikincil bir ajan devralınmış ana ajan OAuth profilini okursa yenileme,
  refresh token'ı ikincil ajan deposuna kopyalamak yerine ana ajan deposuna geri yazar
- istisna: bazı harici CLI kimlik bilgileri harici olarak yönetilmeye devam eder; OpenClaw
  kopyalanmış refresh token'ları harcamak yerine bu CLI kimlik doğrulama depolarını yeniden okur.
  Codex CLI başlangıcı kasıtlı olarak daha dardır: boş bir
  `openai:default` profilini tohumlar, ardından OpenClaw'a ait yenilemeler yerel
  profili kurallı tutar. Yerel Codex yenilemesi başarısız olursa ve Codex CLI aynı hesap için
  kullanılabilir bir token'a sahipse, OpenClaw bu token'ı mevcut
  runtime isteği için `auth-profiles.json` içine geri yazmadan kullanabilir.

Yenileme akışı otomatiktir; genellikle token'ları elle yönetmeniz gerekmez.

## Birden fazla hesap (profiller) + yönlendirme

İki desen:

### 1) Tercih edilen: ayrı ajanlar

"Kişisel" ve "iş" kullanımının asla etkileşime girmemesini istiyorsanız yalıtılmış ajanlar kullanın (ayrı oturumlar + kimlik bilgileri + çalışma alanı):

```bash
openclaw agents add work
openclaw agents add personal
```

Ardından ajan başına kimlik doğrulamayı yapılandırın (sihirbaz) ve sohbetleri doğru ajana yönlendirin.

### 2) Gelişmiş: tek ajanda birden fazla profil

`auth-profiles.json`, aynı sağlayıcı için birden fazla profil kimliğini destekler.

Hangi profilin kullanılacağını seçin:

- yapılandırma sıralaması (`auth.order`) üzerinden genel olarak
- `/model ...@<profileId>` üzerinden oturum başına

Örnek (oturum geçersiz kılması):

- `/model Opus@anthropic:work`

Hangi profil kimliklerinin var olduğunu görme:

- `openclaw channels list --json` (`auth[]` gösterir)

İlgili dokümanlar:

- [Model failover](/tr/concepts/model-failover) (rotasyon + cooldown kuralları)
- [Slash komutları](/tr/tools/slash-commands) (komut yüzeyi)

## İlgili

- [Kimlik Doğrulama](/tr/gateway/authentication) - model sağlayıcı kimlik doğrulama özeti
- [Gizli Bilgiler](/tr/gateway/secrets) - kimlik bilgisi depolama ve SecretRef
- [Yapılandırma Referansı](/tr/gateway/configuration-reference#auth-storage) - kimlik doğrulama yapılandırma anahtarları
