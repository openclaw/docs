---
read_when:
    - OpenClaw OAuth’u uçtan uca anlamak istiyorsunuz
    - Token geçersiz kılma / oturumdan çıkış sorunlarıyla karşılaştınız
    - Claude CLI veya OAuth kimlik doğrulama akışlarını istiyorsunuz
    - Birden fazla hesap veya profil yönlendirmesi istiyorsunuz
summary: 'OpenClaw’da OAuth: token değişimi, depolama ve çok hesaplı desenler'
title: OAuth
x-i18n:
    generated_at: "2026-04-05T13:51:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b364be2182fcf9082834450f39aecc0913c85fb03237eec1228a589d4851dcd
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw, bunu sunan sağlayıcılar için OAuth üzerinden “subscription auth” destekler
(özellikle **OpenAI Codex (ChatGPT OAuth)**). Anthropic abonelikleri için yeni
kurulum, gateway ana makinesindeki yerel **Claude CLI** oturum açma yolunu
kullanmalıdır, ancak Anthropic doğrudan Claude Code kullanımı ile OpenClaw’ın
yeniden kullanım yolunu birbirinden ayırır. Anthropic’in herkese açık Claude Code
belgeleri, doğrudan Claude Code kullanımının Claude abonelik sınırları içinde
kaldığını söyler. Buna ek olarak Anthropic, **4 Nisan 2026 12:00 PM PT / 8:00 PM BST**
tarihinde OpenClaw kullanıcılarına, OpenClaw’ın üçüncü taraf bir harness olarak
sayıldığını ve artık bu trafik için **Extra Usage** gerektirdiğini bildirdi.
OpenAI Codex OAuth, OpenClaw gibi harici araçlarda kullanım için açıkça
desteklenmektedir. Bu sayfa şunları açıklar:

Anthropic için üretimde API key kimlik doğrulaması daha güvenli önerilen yoldur.

- OAuth **token değişiminin** nasıl çalıştığını (PKCE)
- token’ların **nerede depolandığını** (ve nedenini)
- **birden fazla hesabın** nasıl ele alınacağını (profiller + oturum başına geçersiz kılmalar)

OpenClaw ayrıca kendi OAuth veya API‑key
akışlarını getiren **provider plugin**’lerini de destekler. Bunları şu şekilde çalıştırın:

```bash
openclaw models auth login --provider <id>
```

## Token sink (neden var)

OAuth sağlayıcıları, oturum açma/yenileme akışları sırasında yaygın olarak **yeni bir refresh token**
üretir. Bazı sağlayıcılar (veya OAuth istemcileri), aynı kullanıcı/uygulama için yeni biri üretildiğinde eski refresh token’ları geçersiz kılabilir.

Pratik belirti:

- OpenClaw üzerinden _ve_ Claude Code / Codex CLI üzerinden oturum açarsınız → bunlardan biri daha sonra rastgele “logged out” olur

Bunu azaltmak için OpenClaw, `auth-profiles.json` dosyasını bir **token sink** olarak ele alır:

- çalışma zamanı kimlik bilgilerini **tek bir yerden** okur
- birden fazla profili tutabilir ve bunları deterministik olarak yönlendirebiliriz
- kimlik bilgileri Codex CLI gibi harici bir CLI’dan yeniden kullanıldığında, OpenClaw
  bunları provenance ile yansıtır ve refresh token’ı kendisi döndürmek yerine
  bu harici kaynağı yeniden okur

## Depolama (token’lar nerede bulunur)

Gizli bilgiler **agent başına** depolanır:

- Auth profilleri (OAuth + API key’ler + isteğe bağlı değer düzeyi refs): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Eski uyumluluk dosyası: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (bulunduğunda statik `api_key` girdileri temizlenir)

Yalnızca içe aktarma için eski dosya (hâlâ desteklenir, ancak ana depo değildir):

- `~/.openclaw/credentials/oauth.json` (ilk kullanımda `auth-profiles.json` içine aktarılır)

Yukarıdakilerin tümü ayrıca `$OPENCLAW_STATE_DIR` değerine de uyar (durum dizini geçersiz kılması). Tam başvuru: [/gateway/configuration](/gateway/configuration-reference#auth-storage)

Statik secret refs ve çalışma zamanı snapshot etkinleştirme davranışı için bkz. [Secrets Management](/gateway/secrets).

## Anthropic eski token uyumluluğu

<Warning>
Anthropic’in herkese açık Claude Code belgeleri, doğrudan Claude Code kullanımının
Claude abonelik sınırları içinde kaldığını söyler. Buna ek olarak Anthropic,
**4 Nisan 2026 12:00 PM PT / 8:00 PM BST** tarihinde OpenClaw kullanıcılarına
**OpenClaw’ın üçüncü taraf bir harness olarak sayıldığını** söyledi. Mevcut Anthropic token profilleri teknik olarak OpenClaw’da kullanılabilir olmaya devam eder, ancak Anthropic OpenClaw yolunun artık bu trafik için **Extra
Usage** gerektirdiğini söylüyor (abonelikten ayrı olarak faturalandırılan pay-as-you-go).

Anthropic’in doğrudan Claude Code planlarıyla ilgili güncel belgeleri için bkz. [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
ve [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

OpenClaw’daki diğer abonelik tarzı seçenekleri istiyorsanız bkz. [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding
Plan](/providers/qwen), [MiniMax Coding Plan](/providers/minimax),
ve [Z.AI / GLM Coding Plan](/providers/glm).
</Warning>

OpenClaw artık Anthropic setup-token’ı yeniden eski/el ile kullanılan bir yol olarak sunuyor.
Anthropic’in OpenClaw’a özgü faturalama bildirimi bu yol için hâlâ geçerlidir; bu yüzden
Anthropic’in OpenClaw kaynaklı Claude oturum açma trafiği için **Extra Usage**
gerektirdiği beklentisiyle kullanın.

## Anthropic Claude CLI geçişi

Claude CLI gateway ana makinesinde zaten kuruluysa ve oturum açılmışsa,
Anthropic model seçimini yerel CLI arka ucuna geçirebilirsiniz. Bu,
aynı ana makinede yerel bir Claude CLI oturum açmasını yeniden kullanmak istediğinizde
desteklenen bir OpenClaw yoludur.

Ön koşullar:

- `claude` ikili dosyası gateway ana makinesinde kurulu olmalıdır
- Claude CLI burada zaten `claude auth login` ile kimlik doğrulanmış olmalıdır

Geçiş komutu:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Onboarding kısayolu:

```bash
openclaw onboard --auth-choice anthropic-cli
```

Bu, geri alma için mevcut Anthropic auth profillerini korur, ancak ana
varsayılan model yolunu `anthropic/...` yerine `claude-cli/...` olarak yeniden yazar, eşleşen
Anthropic Claude fallback’lerini yeniden yazar ve `agents.defaults.models` altında eşleşen
`claude-cli/...` allowlist girdileri ekler.

Doğrulayın:

```bash
openclaw models status
```

## OAuth değişimi (oturum açma nasıl çalışır)

OpenClaw’ın etkileşimli oturum açma akışları `@mariozechner/pi-ai` içinde uygulanır ve wizard/komutlara bağlanır.

### Anthropic Claude CLI

Akış şekli:

Claude CLI yolu:

1. gateway ana makinesinde `claude auth login` ile oturum açın
2. `openclaw models auth login --provider anthropic --method cli --set-default` çalıştırın
3. yeni bir auth profili depolamayın; model seçimini `claude-cli/...` olarak değiştirin
4. geri alma için mevcut Anthropic auth profillerini koruyun

Anthropic’in herkese açık Claude Code belgeleri bu doğrudan Claude aboneliği
oturum açma akışını `claude` için açıklar. OpenClaw bu yerel oturum açmayı yeniden kullanabilir, ancak
Anthropic ayrıca OpenClaw tarafından denetlenen yolu faturalama açısından üçüncü taraf
harness kullanımı olarak sınıflandırır.

Etkileşimli yardımcı yolu:

- `openclaw onboard` / `openclaw configure` → auth choice `anthropic-cli`

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth, Codex CLI dışında, OpenClaw iş akışları dahil olmak üzere kullanım için açıkça desteklenmektedir.

Akış şekli (PKCE):

1. PKCE verifier/challenge + rastgele `state` üretin
2. `https://auth.openai.com/oauth/authorize?...` açın
3. callback’i `http://127.0.0.1:1455/auth/callback` üzerinde yakalamayı deneyin
4. callback bağlanamazsa (veya uzak/headless çalışıyorsanız), yönlendirme URL’sini/kodunu yapıştırın
5. `https://auth.openai.com/oauth/token` adresinde değişim yapın
6. access token’dan `accountId` çıkarın ve `{ access, refresh, expires, accountId }` olarak depolayın

Wizard yolu `openclaw onboard` → auth choice `openai-codex` şeklindedir.

## Yenileme + süre sonu

Profiller bir `expires` zaman damgası depolar.

Çalışma zamanında:

- `expires` gelecekteyse → depolanan access token’ı kullanın
- süresi dolmuşsa → yenileyin (dosya kilidi altında) ve depolanan kimlik bilgilerini üzerine yazın
- istisna: yeniden kullanılan harici CLI kimlik bilgileri harici olarak yönetilmeye devam eder; OpenClaw
  CLI auth deposunu yeniden okur ve kopyalanan refresh token’ı asla kendisi harcamaz

Yenileme akışı otomatiktir; genellikle token’ları el ile yönetmeniz gerekmez.

## Birden fazla hesap (profiller) + yönlendirme

İki desen vardır:

### 1) Tercih edilen: ayrı agent’lar

“Personal” ve “work” ortamlarının asla etkileşmemesini istiyorsanız, yalıtılmış agent’lar kullanın (ayrı oturumlar + kimlik bilgileri + çalışma alanı):

```bash
openclaw agents add work
openclaw agents add personal
```

Ardından auth’u agent başına yapılandırın (wizard) ve sohbetleri doğru agent’a yönlendirin.

### 2) Gelişmiş: tek bir agent içinde birden fazla profil

`auth-profiles.json`, aynı provider için birden fazla profil kimliğini destekler.

Hangi profilin kullanılacağını seçin:

- genel olarak config sıralamasıyla (`auth.order`)
- oturum başına `/model ...@<profileId>` ile

Örnek (oturum geçersiz kılması):

- `/model Opus@anthropic:work`

Hangi profil kimliklerinin mevcut olduğunu nasıl görürsünüz:

- `openclaw channels list --json` (`auth[]` gösterir)

İlgili belgeler:

- [/concepts/model-failover](/concepts/model-failover) (rotasyon + cooldown kuralları)
- [/tools/slash-commands](/tools/slash-commands) (komut yüzeyi)

## İlgili

- [Authentication](/gateway/authentication) — model sağlayıcısı kimlik doğrulamasına genel bakış
- [Secrets](/gateway/secrets) — kimlik bilgisi depolama ve SecretRef
- [Configuration Reference](/gateway/configuration-reference#auth-storage) — auth config anahtarları
