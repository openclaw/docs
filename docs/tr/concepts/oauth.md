---
read_when:
    - OpenClaw OAuth’u uçtan uca anlamak istiyorsunuz
    - Belirteç geçersizleşmesi / oturum kapatma sorunlarıyla karşılaştınız
    - Claude CLI veya OAuth kimlik doğrulama akışlarını istiyorsunuz
    - Birden fazla hesap veya profil yönlendirmesi istiyorsunuz
summary: 'OpenClaw’da OAuth: belirteç değişimi, depolama ve çok hesaplı desenler'
title: OAuth
x-i18n:
    generated_at: "2026-04-24T09:06:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw, bunu sunan sağlayıcılar için OAuth üzerinden “abonelik kimlik doğrulamasını” destekler
(özellikle **OpenAI Codex (ChatGPT OAuth)**). Anthropic için pratik ayrım artık şöyledir:

- **Anthropic API anahtarı**: normal Anthropic API faturalandırması
- **OpenClaw içinde Anthropic Claude CLI / abonelik kimlik doğrulaması**: Anthropic personeli
  bize bu kullanımın yeniden izinli olduğunu söyledi

OpenAI Codex OAuth, OpenClaw gibi harici araçlarda kullanım için açıkça desteklenir. Bu sayfa şunları açıklar:

Anthropic için üretimde API anahtarıyla kimlik doğrulama, önerilen daha güvenli yoldur.

- OAuth **belirteç değişiminin** nasıl çalıştığı (PKCE)
- belirteçlerin **nerede saklandığı** (ve neden)
- **birden fazla hesabın** nasıl ele alınacağı (profiller + oturum başına geçersiz kılmalar)

OpenClaw ayrıca kendi OAuth veya API anahtarı akışlarını sunan **sağlayıcı Plugin**'lerini de destekler. Bunları şu komutla çalıştırın:

```bash
openclaw models auth login --provider <id>
```

## Belirteç havuzu (neden var)

OAuth sağlayıcıları yaygın olarak giriş/yenileme akışları sırasında **yeni bir yenileme belirteci** üretir. Bazı sağlayıcılar (veya OAuth istemcileri), aynı kullanıcı/uygulama için yeni bir belirteç verildiğinde eski yenileme belirteçlerini geçersiz kılabilir.

Pratik belirti:

- OpenClaw üzerinden _ve_ Claude Code / Codex CLI üzerinden giriş yaparsınız → bunlardan biri daha sonra rastgele “oturumu kapatılmış” olur

Bunu azaltmak için OpenClaw, `auth-profiles.json` dosyasını bir **belirteç havuzu** olarak ele alır:

- çalışma zamanı kimlik bilgilerini **tek bir yerden** okur
- birden fazla profili tutabilir ve bunları deterministik olarak yönlendirebiliriz
- kimlik bilgileri Codex CLI gibi harici bir CLI'den yeniden kullanıldığında OpenClaw,
  bunları köken bilgisiyle yansıtır ve yenileme belirtecini kendisi döndürmek yerine
  bu harici kaynağı yeniden okur

## Depolama (belirteçler nerede yaşar)

Gizli bilgiler **aracı başına** saklanır:

- Kimlik doğrulama profilleri (OAuth + API anahtarları + isteğe bağlı değer düzeyinde ref'ler): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski uyumluluk dosyası: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (`api_key` statik girdileri keşfedildiğinde temizlenir)

Yalnızca eski içe aktarma dosyası (hâlâ desteklenir, ancak ana depo değildir):

- `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine içe aktarılır)

Yukarıdakilerin tümü ayrıca `$OPENCLAW_STATE_DIR` değerine de uyar (durum dizini geçersiz kılma). Tam başvuru: [/gateway/configuration](/tr/gateway/configuration-reference#auth-storage)

Statik gizli bilgi ref'leri ve çalışma zamanı anlık görüntüsü etkinleştirme davranışı için [Gizli Bilgi Yönetimi](/tr/gateway/secrets) sayfasına bakın.

## Anthropic eski belirteç uyumluluğu

<Warning>
Anthropic’in herkese açık Claude Code belgeleri, doğrudan Claude Code kullanımının
Claude abonelik sınırları içinde kaldığını söyler ve Anthropic personeli bize OpenClaw tarzı Claude
CLI kullanımına yeniden izin verildiğini söyledi. Bu nedenle OpenClaw, Anthropic
yeni bir ilke yayımlamadıkça Claude CLI yeniden kullanımını ve `claude -p` kullanımını
bu entegrasyon için izinli kabul eder.

Anthropic’in güncel doğrudan-Claude-Code plan belgeleri için [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
ve [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/) sayfalarına bakın.

OpenClaw’da başka abonelik tarzı seçenekler istiyorsanız [OpenAI
Codex](/tr/providers/openai), [Qwen Cloud Coding
Plan](/tr/providers/qwen), [MiniMax Coding Plan](/tr/providers/minimax),
ve [Z.AI / GLM Coding Plan](/tr/providers/glm) sayfalarına bakın.
</Warning>

OpenClaw ayrıca Anthropic setup-token'ı desteklenen bir belirteç kimlik doğrulama yolu olarak sunar, ancak artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` komutunu tercih eder.

## Anthropic Claude CLI geçişi

OpenClaw, Anthropic Claude CLI yeniden kullanımını tekrar destekler. Ana makinede zaten yerel bir Claude girişiniz varsa onboarding/configure bunu doğrudan yeniden kullanabilir.

## OAuth değişimi (giriş nasıl çalışır)

OpenClaw’ın etkileşimli giriş akışları `@mariozechner/pi-ai` içinde uygulanır ve sihirbazlara/komutlara bağlanır.

### Anthropic setup-token

Akış şekli:

1. OpenClaw’dan Anthropic setup-token başlatın veya belirteç yapıştırın
2. OpenClaw ortaya çıkan Anthropic kimlik bilgisini bir kimlik doğrulama profilinde saklar
3. model seçimi `anthropic/...` üzerinde kalır
4. mevcut Anthropic kimlik doğrulama profilleri geri alma/sıra denetimi için kullanılabilir kalır

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth, OpenClaw iş akışları dahil olmak üzere Codex CLI dışında kullanım için açıkça desteklenir.

Akış şekli (PKCE):

1. PKCE doğrulayıcı/sorgulama + rastgele `state` üretin
2. `https://auth.openai.com/oauth/authorize?...` adresini açın
3. geri çağırmayı `http://127.0.0.1:1455/auth/callback` üzerinde yakalamayı deneyin
4. geri çağırma bağlanamazsa (veya uzak/başsız çalışıyorsanız), yönlendirme URL’sini/kodunu yapıştırın
5. `https://auth.openai.com/oauth/token` adresinde değişim yapın
6. erişim belirtecinden `accountId` çıkarın ve `{ access, refresh, expires, accountId }` olarak saklayın

Sihirbaz yolu `openclaw onboard` → kimlik doğrulama seçimi `openai-codex` şeklindedir.

## Yenileme + sona erme

Profiller bir `expires` zaman damgası saklar.

Çalışma zamanında:

- `expires` gelecekteyse → saklanan erişim belirtecini kullan
- süresi dolmuşsa → yenile (bir dosya kilidi altında) ve saklanan kimlik bilgilerini üzerine yaz
- istisna: yeniden kullanılan harici CLI kimlik bilgileri harici olarak yönetilmeye devam eder; OpenClaw
  CLI kimlik doğrulama deposunu yeniden okur ve kopyalanan yenileme belirtecini asla kendisi harcamaz

Yenileme akışı otomatiktir; genel olarak belirteçleri elle yönetmeniz gerekmez.

## Birden fazla hesap (profiller) + yönlendirme

İki desen:

### 1) Tercih edilen: ayrı aracılar

“kişisel” ve “iş” ortamlarınızın asla etkileşmemesini istiyorsanız yalıtılmış aracılar kullanın (ayrı oturumlar + kimlik bilgileri + çalışma alanı):

```bash
openclaw agents add work
openclaw agents add personal
```

Ardından kimlik doğrulamayı aracı başına yapılandırın (sihirbaz) ve sohbetleri doğru aracıya yönlendirin.

### 2) Gelişmiş: tek aracı içinde birden fazla profil

`auth-profiles.json`, aynı sağlayıcı için birden fazla profil kimliğini destekler.

Hangi profilin kullanılacağını seçin:

- genel olarak yapılandırma sıralamasıyla (`auth.order`)
- oturum başına `/model ...@<profileId>` ile

Örnek (oturum geçersiz kılması):

- `/model Opus@anthropic:work`

Hangi profil kimliklerinin var olduğunu görmek için:

- `openclaw channels list --json` (`auth[]` gösterir)

İlgili belgeler:

- [/concepts/model-failover](/tr/concepts/model-failover) (döndürme + bekleme süresi kuralları)
- [/tools/slash-commands](/tr/tools/slash-commands) (komut yüzeyi)

## İlgili

- [Kimlik Doğrulama](/tr/gateway/authentication) — model sağlayıcı kimlik doğrulamasına genel bakış
- [Gizli Bilgiler](/tr/gateway/secrets) — kimlik bilgisi depolama ve SecretRef
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#auth-storage) — kimlik doğrulama yapılandırma anahtarları
