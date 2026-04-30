---
read_when:
    - OpenClaw OAuth'u uçtan uca anlamak istiyorsunuz
    - Token geçersiz kılma / oturum kapatma sorunlarıyla karşılaşıyorsunuz
    - Claude CLI veya OAuth kimlik doğrulama akışları istiyorsunuz
    - Birden fazla hesap veya profil yönlendirmesi istiyorsunuz
summary: 'OpenClaw''da OAuth: belirteç değişimi, depolama ve çoklu hesap desenleri'
title: OAuth
x-i18n:
    generated_at: "2026-04-30T09:17:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw, bunu sunan sağlayıcılar için OAuth üzerinden “abonelik kimlik doğrulamasını” destekler
(özellikle **OpenAI Codex (ChatGPT OAuth)**). Anthropic için pratik ayrım
şu anda şöyledir:

- **Anthropic API anahtarı**: normal Anthropic API faturalandırması
- **OpenClaw içinde Anthropic Claude CLI / abonelik kimlik doğrulaması**: Anthropic çalışanları
  bize bu kullanımın yeniden izinli olduğunu söyledi

OpenAI Codex OAuth, OpenClaw gibi harici araçlarda kullanım için açıkça desteklenir. Bu sayfa şunları açıklar:

Anthropic için üretimde, API anahtarı kimlik doğrulaması daha güvenli önerilen yoldur.

- OAuth **token exchange** nasıl çalışır (PKCE)
- tokenların nerede **saklandığı** (ve nedeni)
- **birden fazla hesabın** nasıl yönetileceği (profiller + oturum başına geçersiz kılmalar)

OpenClaw ayrıca kendi OAuth veya API anahtarı akışlarını sağlayan **sağlayıcı Plugin’lerini**
destekler. Bunları şu şekilde çalıştırın:

```bash
openclaw models auth login --provider <id>
```

## Token sink (neden var)

OAuth sağlayıcıları, oturum açma/yenileme akışları sırasında yaygın olarak **yeni bir yenileme tokenı** üretir. Bazı sağlayıcılar (veya OAuth istemcileri), aynı kullanıcı/uygulama için yeni bir yenileme tokenı verildiğinde eski yenileme tokenlarını geçersiz kılabilir.

Pratik belirti:

- OpenClaw _ve_ Claude Code / Codex CLI üzerinden oturum açarsınız → bunlardan biri daha sonra rastgele “oturumdan çıkarılmış” olur

Bunu azaltmak için OpenClaw, `auth-profiles.json` dosyasını bir **token sink** olarak ele alır:

- çalışma zamanı kimlik bilgilerini **tek bir yerden** okur
- birden fazla profili tutabilir ve bunları belirleyici şekilde yönlendirebiliriz
- harici CLI yeniden kullanımı sağlayıcıya özgüdür: Codex CLI boş bir
  `openai-codex:default` profilini önyükleyebilir, ancak OpenClaw yerel bir OAuth profiline sahip olduğunda
  yerel yenileme tokenı kanoniktir; diğer entegrasyonlar harici olarak yönetilmeye devam edebilir
  ve CLI kimlik doğrulama depolarını yeniden okuyabilir
- yapılandırılmış sağlayıcı kümesini zaten bilen durum ve başlangıç yolları,
  harici CLI keşfini bu kümeyle sınırlar; böylece tek sağlayıcılı bir kurulum için
  ilgisiz bir CLI oturum açma deposu yoklanmaz

## Depolama (tokenlar nerede bulunur)

Gizli bilgiler ajan kimlik doğrulama depolarında saklanır:

- Kimlik doğrulama profilleri (OAuth + API anahtarları + isteğe bağlı değer düzeyi referansları): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski uyumluluk dosyası: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statik `api_key` girdileri keşfedildiğinde temizlenir)

Yalnızca eski içe aktarma dosyası (hala desteklenir, ancak ana depo değildir):

- `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır)

Yukarıdakilerin tümü `$OPENCLAW_STATE_DIR` değerine de uyar (durum dizini geçersiz kılması). Tam başvuru: [/gateway/configuration](/tr/gateway/configuration-reference#auth-storage)

Statik gizli referansları ve çalışma zamanı anlık görüntü etkinleştirme davranışı için bkz. [Gizli Bilgi Yönetimi](/tr/gateway/secrets).

İkincil bir ajanın yerel kimlik doğrulama profili yoksa, OpenClaw varsayılan/ana ajan deposundan
okuma sırasında devralma kullanır. Okuma sırasında ana ajanın
`auth-profiles.json` dosyasını klonlamaz. OAuth yenileme tokenları özellikle
hassastır: normal kopyalama akışları bunları varsayılan olarak atlar, çünkü bazı sağlayıcılar yenileme tokenlarını
kullanımdan sonra döndürür veya geçersiz kılar. Bağımsız bir hesaba ihtiyaç duyduğunda bir
ajan için ayrı bir OAuth oturumu yapılandırın.

## Anthropic eski token uyumluluğu

<Warning>
Anthropic’in herkese açık Claude Code belgeleri, doğrudan Claude Code kullanımının
Claude abonelik sınırları içinde kaldığını söyler ve Anthropic çalışanları bize OpenClaw tarzı Claude
CLI kullanımına yeniden izin verildiğini söyledi. Bu nedenle OpenClaw, Anthropic
yeni bir politika yayımlamadığı sürece bu entegrasyon için Claude CLI yeniden kullanımını ve
`claude -p` kullanımını onaylanmış kabul eder.

Anthropic’in güncel doğrudan-Claude-Code plan belgeleri için bkz. [Claude Code’u
Pro veya Max
planınızla kullanma](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
ve [Claude Code’u Team veya Enterprise
planınızla kullanma](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

OpenClaw’da başka abonelik tarzı seçenekler istiyorsanız bkz. [OpenAI
Codex](/tr/providers/openai), [Qwen Cloud Coding
Plan](/tr/providers/qwen), [MiniMax Coding Plan](/tr/providers/minimax),
ve [Z.AI / GLM Coding Plan](/tr/providers/glm).
</Warning>

OpenClaw ayrıca desteklenen bir token kimlik doğrulama yolu olarak Anthropic kurulum tokenını sunar, ancak artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

## Anthropic Claude CLI geçişi

OpenClaw, Anthropic Claude CLI yeniden kullanımını yeniden destekler. Ana makinede zaten yerel bir
Claude oturumunuz varsa, onboarding/configure bunu doğrudan yeniden kullanabilir.

## OAuth exchange (oturum açma nasıl çalışır)

OpenClaw’ın etkileşimli oturum açma akışları `@mariozechner/pi-ai` içinde uygulanır ve sihirbazlara/komutlara bağlanır.

### Anthropic kurulum tokenı

Akış şekli:

1. OpenClaw’dan Anthropic kurulum tokenını başlatın veya token yapıştırın
2. OpenClaw, sonuçta oluşan Anthropic kimlik bilgisini bir kimlik doğrulama profiline kaydeder
3. model seçimi `anthropic/...` üzerinde kalır
4. mevcut Anthropic kimlik doğrulama profilleri geri alma/sıra denetimi için kullanılabilir kalır

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth, OpenClaw iş akışları dahil olmak üzere Codex CLI dışında kullanım için açıkça desteklenir.

Akış şekli (PKCE):

1. PKCE doğrulayıcısı/challenge + rastgele `state` oluşturun
2. `https://auth.openai.com/oauth/authorize?...` adresini açın
3. `http://127.0.0.1:1455/auth/callback` üzerinde geri çağrıyı yakalamayı deneyin
4. geri çağrı bağlanamazsa (veya uzakta/headless iseniz), yönlendirme URL’sini/kodu yapıştırın
5. `https://auth.openai.com/oauth/token` üzerinde değişim yapın
6. erişim tokenından `accountId` değerini çıkarın ve `{ access, refresh, expires, accountId }` olarak saklayın

Sihirbaz yolu `openclaw onboard` → kimlik doğrulama seçimi `openai-codex`.

## Yenileme + süre sonu

Profiller bir `expires` zaman damgası saklar.

Çalışma zamanında:

- `expires` gelecekteyse → saklanan erişim tokenını kullan
- süresi dolmuşsa → yenile (dosya kilidi altında) ve saklanan kimlik bilgilerini üzerine yaz
- ikincil bir ajan devralınmış ana-ajan OAuth profilini okursa, yenileme
  yenileme tokenını ikincil ajan deposuna kopyalamak yerine ana ajan deposuna
  geri yazar
- istisna: bazı harici CLI kimlik bilgileri harici olarak yönetilmeye devam eder; OpenClaw
  kopyalanmış yenileme tokenlarını harcamak yerine bu CLI kimlik doğrulama depolarını yeniden okur.
  Codex CLI önyüklemesi bilinçli olarak daha dardır: boş bir
  `openai-codex:default` profili oluşturur, ardından OpenClaw’ın sahip olduğu yenilemeler yerel
  profili kanonik tutar.

Yenileme akışı otomatiktir; genellikle tokenları elle yönetmeniz gerekmez.

## Birden fazla hesap (profiller) + yönlendirme

İki kalıp:

### 1) Tercih edilen: ayrı ajanlar

“kişisel” ve “iş” hesaplarının hiçbir zaman etkileşime girmemesini istiyorsanız, izole ajanlar kullanın (ayrı oturumlar + kimlik bilgileri + çalışma alanı):

```bash
openclaw agents add work
openclaw agents add personal
```

Ardından kimlik doğrulamayı ajan başına yapılandırın (sihirbaz) ve sohbetleri doğru ajana yönlendirin.

### 2) Gelişmiş: tek ajanda birden fazla profil

`auth-profiles.json`, aynı sağlayıcı için birden fazla profil kimliğini destekler.

Hangi profilin kullanılacağını seçin:

- yapılandırma sıralamasıyla genel olarak (`auth.order`)
- `/model ...@<profileId>` ile oturum başına

Örnek (oturum geçersiz kılması):

- `/model Opus@anthropic:work`

Hangi profil kimliklerinin mevcut olduğunu görme:

- `openclaw channels list --json` (`auth[]` değerini gösterir)

İlgili belgeler:

- [Model failover](/tr/concepts/model-failover) (döndürme + bekleme süresi kuralları)
- [Slash komutları](/tr/tools/slash-commands) (komut yüzeyi)

## İlgili

- [Kimlik Doğrulama](/tr/gateway/authentication) — model sağlayıcı kimlik doğrulamasına genel bakış
- [Gizli Bilgiler](/tr/gateway/secrets) — kimlik bilgisi depolama ve SecretRef
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#auth-storage) — kimlik doğrulama yapılandırma anahtarları
