---
read_when:
    - OpenClaw OAuth'u uçtan uca anlamak istiyorsunuz
    - Belirteç geçersiz kılma / oturum kapatma sorunlarıyla karşılaşıyorsunuz
    - Claude CLI veya OAuth kimlik doğrulama akışlarını istiyorsunuz
    - Birden fazla hesap veya profil yönlendirmesi istiyorsunuz
summary: 'OpenClaw’da OAuth: token değişimi, depolama ve çoklu hesap kalıpları'
title: OAuth
x-i18n:
    generated_at: "2026-05-11T20:28:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a7382fbcbe7e6034057da66a2dd8685df6d9345c36eeb8261eb12440d00a402
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw, bunu sunan sağlayıcılar için OAuth üzerinden "abonelik kimlik doğrulaması"nı destekler
(özellikle **OpenAI Codex (ChatGPT OAuth)**). Anthropic için pratik ayrım
artık şöyledir:

- **Anthropic API anahtarı**: normal Anthropic API faturalandırması
- **OpenClaw içinde Anthropic Claude CLI / abonelik kimlik doğrulaması**: Anthropic personeli
  bize bu kullanımın yeniden izinli olduğunu söyledi

OpenAI Codex OAuth, OpenClaw gibi harici araçlarda kullanım için açıkça desteklenir. Bu sayfa şunları açıklar:

Anthropic'i üretimde kullanırken API anahtarı kimlik doğrulaması daha güvenli önerilen yoldur.

- OAuth **token exchange** işleminin nasıl çalıştığı (PKCE)
- tokenların nerede **saklandığı** (ve nedeni)
- **birden fazla hesabın** nasıl ele alınacağı (profiller + oturum başına geçersiz kılmalar)

OpenClaw ayrıca kendi OAuth veya API anahtarı
akışlarını sağlayan **sağlayıcı Plugin'lerini** de destekler. Bunları şöyle çalıştırın:

```bash
openclaw models auth login --provider <id>
```

## Token alıcısı (neden var)

OAuth sağlayıcıları, oturum açma/yenileme akışları sırasında yaygın olarak **yeni bir yenileme tokenı** üretir. Bazı sağlayıcılar (veya OAuth istemcileri), aynı kullanıcı/uygulama için yeni bir yenileme tokenı verildiğinde eski yenileme tokenlarını geçersiz kılabilir.

Pratik belirti:

- OpenClaw _ve_ Claude Code / Codex CLI üzerinden oturum açarsınız → bunlardan biri daha sonra rastgele "oturumu kapatılmış" hale gelir

Bunu azaltmak için OpenClaw, `auth-profiles.json` dosyasını bir **token alıcısı** olarak ele alır:

- çalışma zamanı kimlik bilgilerini **tek bir yerden** okur
- birden fazla profili tutabilir ve bunları deterministik olarak yönlendirebiliriz
- harici CLI yeniden kullanımı sağlayıcıya özeldir: Codex CLI boş bir
  `openai-codex:default` profilini başlatabilir, ancak OpenClaw yerel bir OAuth profiline sahip olduğunda
  yerel yenileme tokenı kanonik olur; diğer entegrasyonlar harici olarak
  yönetilmeye devam edebilir ve CLI kimlik doğrulama depolarını yeniden okuyabilir
- yapılandırılmış sağlayıcı kümesini zaten bilen durum ve başlangıç yolları,
  harici CLI keşfini bu kümeyle sınırlar; böylece tek sağlayıcılı bir kurulum için
  ilgisiz bir CLI oturum açma deposu yoklanmaz

## Depolama (tokenlar nerede bulunur)

Gizli bilgiler ajan kimlik doğrulama depolarında saklanır:

- Kimlik doğrulama profilleri (OAuth + API anahtarları + isteğe bağlı değer düzeyi refs): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski uyumluluk dosyası: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (statik `api_key` girdileri keşfedildiklerinde temizlenir)

Yalnızca eski içe aktarma dosyası (hala desteklenir, ancak ana depo değildir):

- `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır)

Yukarıdakilerin tümü ayrıca `$OPENCLAW_STATE_DIR` değerine (durum dizini geçersiz kılması) uyar. Tam başvuru: [/gateway/configuration](/tr/gateway/configuration-reference#auth-storage)

Statik gizli bilgi refs ve çalışma zamanı anlık görüntü etkinleştirme davranışı için bkz. [Gizli Bilgi Yönetimi](/tr/gateway/secrets).

İkincil bir ajanın yerel kimlik doğrulama profili olmadığında OpenClaw, varsayılan/ana ajan deposundan okuma geçişli
kalıtım kullanır. Okuma sırasında ana ajanın
`auth-profiles.json` dosyasını klonlamaz. OAuth yenileme tokenları özellikle
hassastır: normal kopyalama akışları bunları varsayılan olarak atlar çünkü bazı sağlayıcılar
yenileme tokenlarını kullanımdan sonra döndürür veya geçersiz kılar. Bağımsız bir hesaba ihtiyaç duyduğunda
bir ajan için ayrı bir OAuth oturumu yapılandırın.

## Anthropic eski token uyumluluğu

<Warning>
Anthropic'in herkese açık Claude Code belgeleri, doğrudan Claude Code kullanımının
Claude abonelik sınırları içinde kaldığını söyler ve Anthropic personeli bize OpenClaw tarzı Claude
CLI kullanımının yeniden izinli olduğunu söyledi. Bu nedenle OpenClaw, Anthropic
yeni bir politika yayımlamadığı sürece bu entegrasyon için Claude CLI yeniden kullanımını ve
`claude -p` kullanımını onaylanmış olarak ele alır.

Anthropic'in güncel doğrudan Claude Code planı belgeleri için bkz. [Pro veya Max
planınızla Claude Code kullanma](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
ve [Team veya Enterprise
planınızla Claude Code kullanma](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

OpenClaw içinde başka abonelik tarzı seçenekler istiyorsanız bkz. [OpenAI
Codex](/tr/providers/openai), [Qwen Cloud Coding
Plan](/tr/providers/qwen), [MiniMax Coding Plan](/tr/providers/minimax),
ve [Z.AI / GLM Coding Plan](/tr/providers/glm).
</Warning>

OpenClaw ayrıca Anthropic setup-token'ı desteklenen bir token kimlik doğrulama yolu olarak sunar, ancak artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

## Anthropic Claude CLI geçişi

OpenClaw, Anthropic Claude CLI yeniden kullanımını tekrar destekler. Ana makinede zaten yerel bir
Claude oturumunuz varsa, onboarding/configure bunu doğrudan yeniden kullanabilir.

## OAuth değişimi (oturum açma nasıl çalışır)

OpenClaw'ın etkileşimli oturum açma akışları `@earendil-works/pi-ai` içinde uygulanır ve sihirbazlara/komutlara bağlanır.

### Anthropic setup-token

Akış şekli:

1. OpenClaw'dan Anthropic setup-token veya paste-token başlatın
2. OpenClaw ortaya çıkan Anthropic kimlik bilgisini bir kimlik doğrulama profilinde saklar
3. model seçimi `anthropic/...` üzerinde kalır
4. mevcut Anthropic kimlik doğrulama profilleri geri alma/sıra denetimi için kullanılabilir kalır

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth, OpenClaw iş akışları dahil Codex CLI dışında kullanım için açıkça desteklenir.

Akış şekli (PKCE):

1. PKCE doğrulayıcı/challenge + rastgele `state` üretin
2. `https://auth.openai.com/oauth/authorize?...` adresini açın
3. geri çağırmayı `http://127.0.0.1:1455/auth/callback` üzerinde yakalamayı deneyin
4. geri çağırma bağlanamazsa (veya uzaktan/headless çalışıyorsanız), yönlendirme URL'sini/kodunu yapıştırın
5. `https://auth.openai.com/oauth/token` üzerinde değişim yapın
6. erişim tokenından `accountId` değerini çıkarın ve `{ access, refresh, expires, accountId }` olarak saklayın

Sihirbaz yolu `openclaw onboard` → kimlik doğrulama seçimi `openai-codex` şeklindedir.

## Yenileme + süre dolumu

Profiller bir `expires` zaman damgası saklar.

Çalışma zamanında:

- `expires` gelecekteyse → saklanan erişim tokenını kullanır
- süresi dolmuşsa → yeniler (bir dosya kilidi altında) ve saklanan kimlik bilgilerini üzerine yazar
- ikincil bir ajan kalıtılmış ana ajan OAuth profilini okursa, yenileme
  yenileme tokenını ikincil ajan deposuna kopyalamak yerine
  ana ajan deposuna geri yazar
- istisna: bazı harici CLI kimlik bilgileri harici olarak yönetilmeye devam eder; OpenClaw
  kopyalanmış yenileme tokenlarını harcamak yerine bu CLI kimlik doğrulama depolarını yeniden okur.
  Codex CLI başlatması kasıtlı olarak daha dardır: boş bir
  `openai-codex:default` profili tohumlar, ardından OpenClaw tarafından sahiplenilen yenilemeler yerel
  profili kanonik tutar.

Yenileme akışı otomatiktir; genellikle tokenları elle yönetmeniz gerekmez.

## Birden fazla hesap (profiller) + yönlendirme

İki desen:

### 1) Tercih edilen: ayrı ajanlar

"kişisel" ve "iş" hesaplarının asla etkileşime girmemesini istiyorsanız, yalıtılmış ajanlar kullanın (ayrı oturumlar + kimlik bilgileri + çalışma alanı):

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

Hangi profil kimliklerinin bulunduğunu görme:

- `openclaw channels list --json` (`auth[]` değerini gösterir)

İlgili belgeler:

- [Model yük devri](/tr/concepts/model-failover) (döndürme + soğuma kuralları)
- [Eğik çizgi komutları](/tr/tools/slash-commands) (komut yüzeyi)

## İlgili

- [Kimlik Doğrulama](/tr/gateway/authentication) - model sağlayıcı kimlik doğrulaması genel bakışı
- [Gizli Bilgiler](/tr/gateway/secrets) - kimlik bilgisi depolama ve SecretRef
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference#auth-storage) - kimlik doğrulama yapılandırma anahtarları
