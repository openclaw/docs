---
read_when:
    - Kimlik doğrulama profili çözümleme veya kimlik bilgisi yönlendirme üzerinde çalışma
    - Model kimlik doğrulama hatalarında veya profil sıralamasında hata ayıklama
summary: Kimlik doğrulama profilleri için kanonik kimlik bilgisi uygunluğu ve çözümleme semantiği
title: Kimlik doğrulama kimlik bilgileri semantiği
x-i18n:
    generated_at: "2026-07-12T12:01:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Bu semantikler, seçim zamanı ile çalışma zamanı kimlik doğrulama davranışını uyumlu tutar. Şunlar tarafından paylaşılır:

- `resolveAuthProfileOrder` (profil sıralaması)
- `resolveApiKeyForProfile` (çalışma zamanı kimlik bilgisi çözümleme)
- `openclaw models status --probe`
- `openclaw doctor` kimlik doğrulama denetimleri (`doctor-auth`)

## Kararlı yoklama neden kodları

Yoklama sonuçları bir `status` kategorisi (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`) ve yoklama hiçbir zaman bir model çağrısına ulaşmadığında kararlı bir `reasonCode` taşır:

| `reasonCode`             | Anlamı                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `excluded_by_auth_order` | Profil, sağlayıcısının açık kimlik doğrulama sıralamasından çıkarılmıştır.               |
| `missing_credential`     | Satır içi kimlik bilgisi veya SecretRef yapılandırılmamıştır.                            |
| `expired`                | Token `expires` zamanı geçmiştedir.                                                      |
| `invalid_expires`        | `expires`, geçerli bir pozitif Unix ms zaman damgası değildir.                           |
| `unresolved_ref`         | Yapılandırılmış SecretRef çözümlenememiştir.                                             |
| `ineligible_profile`     | Profil, sağlayıcı yapılandırmasıyla uyumsuzdur (hatalı biçimlendirilmiş anahtar girdisi dâhil). |
| `no_model`               | Kimlik bilgileri vardır ancak yoklanabilir bir model adayı çözümlenememiştir.             |

Uygunluk denetimleri, kullanılabilir kimlik bilgileri için neden kodu olarak `ok` bildirir.

## Token kimlik bilgileri

Token kimlik bilgileri (`type: "token"`) satır içi `token` ve/veya `tokenRef` destekler.

### Uygunluk kuralları

1. Hem `token` hem de `tokenRef` yoksa bir token profili uygun değildir (`missing_credential`).
2. `expires` isteğe bağlıdır. Mevcut olduğunda `0` değerinden büyük ve maksimum JavaScript `Date` zaman damgasından (8640000000000000) büyük olmayan, Unix epoch milisaniyesi cinsinden sonlu bir sayı olmalıdır.
3. `expires` geçersizse (yanlış tür, `NaN`, `0`, negatif, sonlu olmayan veya bu maksimumun ötesinde), profil `invalid_expires` nedeniyle uygun değildir.
4. `expires` geçmişteyse profil `expired` nedeniyle uygun değildir.
5. `tokenRef`, `expires` doğrulamasını atlamaz.

### Çözümleme kuralları

1. Çözümleyici semantikleri, `expires` için uygunluk semantikleriyle eşleşir.
2. Uygun profillerde token malzemesi satır içi değerden veya `tokenRef` üzerinden çözümlenebilir.
3. Çözümlenemeyen referanslar, `models status --probe` çıktısında `unresolved_ref` üretir.

## Agent kopyalama taşınabilirliği

Agent kimlik doğrulama kalıtımı geçişli okumayla yapılır. Bir Agent'ın yerel profili olmadığında, gizli malzemeyi kendi kimlik bilgisi deposuna (`agents/<agentId>/agent/openclaw-agent.sqlite`) kopyalamadan, çalışma zamanında varsayılan/ana Agent deposundaki profilleri çözümler.

`openclaw agents add` gibi açık kopyalama akışları şu taşınabilirlik politikasını kullanır:

- `api_key` ve `token` profilleri, `copyToAgents: false` olmadığı sürece taşınabilirdir.
- Yenileme token'ları tek kullanımlık veya rotasyona duyarlı olabileceğinden `oauth` profilleri varsayılan olarak taşınabilir değildir.
- Sağlayıcının sahip olduğu OAuth akışları, yalnızca Agent'lar arasında yenileme malzemesini kopyalamanın güvenli olduğu biliniyorsa `copyToAgents: true` ile etkinleştirebilir; etkinleştirme yalnızca profil satır içi erişim/yenileme malzemesi taşıdığında geçerlidir.

Taşınabilir olmayan profiller, hedef Agent ayrı olarak oturum açıp kendi yerel profilini oluşturmadığı sürece geçişli okuma kalıtımı üzerinden kullanılabilir kalır.

## Yalnızca yapılandırmaya dayalı kimlik doğrulama rotaları

`mode: "aws-sdk"` içeren `auth.profiles` girdileri, depolanan kimlik bilgileri değil, yönlendirme meta verileridir. Hedef sağlayıcı, Plugin'in sahip olduğu Amazon Bedrock kurulumunun yazdığı rota olan `models.providers.<id>.auth: "aws-sdk"` kullandığında geçerlidirler. Bu profil kimlikleri, kimlik bilgisi deposunda eşleşen bir girdi bulunmasa bile `auth.order` ve oturum geçersiz kılmalarında yer alabilir.

Kimlik bilgisi deposuna `type: "aws-sdk"` yazmayın; depolanan kimlik bilgileri yalnızca `api_key`, `token` veya `oauth` olabilir. Eski bir `auth-profiles.json` böyle bir işaretçi içeriyorsa `openclaw doctor --fix`, bunu `auth.profiles` konumuna taşır ve işaretçiyi depodan kaldırır.

## Açık kimlik doğrulama sırası filtreleme

- Bir sağlayıcı için `auth.order.<provider>` veya kimlik doğrulama deposu sıra geçersiz kılması ayarlandığında, `models status --probe` yalnızca o sağlayıcının çözümlenen kimlik doğrulama sırasında kalan profil kimliklerini yoklar. Depolanan geçersiz kılma, `auth.order` yapılandırmasına göre önceliklidir.
- Bu sağlayıcı için depolanmış ancak açık sıradan çıkarılmış bir profil daha sonra sessizce denenmez. Yoklama çıktısı bunu `reasonCode: excluded_by_auth_order` ve `Excluded by auth.order for this provider.` ayrıntısıyla bildirir.

## Yoklama hedefi çözümleme

- Yoklama hedefleri kimlik doğrulama profillerinden, ortam kimlik bilgilerinden veya `models.json` dosyasından gelebilir (sonuç `source`: `profile`, `env`, `models.json`).
- Bir sağlayıcının kimlik bilgileri varsa ancak OpenClaw bunun için yoklanabilir bir model adayı çözümleyemiyorsa `models status --probe`, `reasonCode: no_model` ile `status: no_model` bildirir.

## Harici CLI kimlik bilgisi keşfi

- Harici CLI'ların sahip olduğu yalnızca çalışma zamanına özgü kimlik bilgileri (`claude-cli` için Claude CLI, `openai` için Codex CLI, `minimax-portal` için MiniMax CLI), yalnızca sağlayıcı, çalışma zamanı veya kimlik doğrulama profili geçerli işlem kapsamında olduğunda ya da söz konusu harici kaynak için depolanmış yerel bir profil zaten mevcut olduğunda keşfedilir.
- Kimlik doğrulama deposu çağıranları açık bir harici CLI keşif modu seçer: yalnızca kalıcı/Plugin kimlik doğrulaması için `none`, önceden depolanmış harici CLI profillerini yenilemek için `existing` veya somut bir sağlayıcı/profil kümesi için `scoped`.
- Salt okunur/durum yolları `allowKeychainPrompt: false` geçirir; yalnızca dosya tabanlı harici CLI kimlik bilgilerini kullanır ve macOS Keychain sonuçlarını okumaz veya yeniden kullanmaz.

## OAuth SecretRef Politikası Koruması

SecretRef girdisi yalnızca statik kimlik bilgileri içindir. OAuth kimlik bilgileri çalışma zamanında değiştirilebilir olduğundan (yenileme akışları döndürülen token'ları kalıcılaştırır), SecretRef destekli OAuth malzemesi değiştirilebilir durumu depolar arasında böler.

- Bir profil kimlik bilgisi `type: "oauth"` ise SecretRef nesneleri, o profildeki tüm kimlik bilgisi malzemesi alanları için reddedilir.
- `auth.profiles.<id>.mode`, `"oauth"` ise o profil için SecretRef destekli `keyRef`/`tokenRef` girdisi reddedilir.
- İhlaller, başlangıç/yeniden yükleme gizli bilgi hazırlama ve profil çözümleme yollarında kesin hatalara (fırlatılan hatalara) neden olur.

## Eski sürümlerle uyumlu mesajlaşma

Betik uyumluluğu için yoklama hataları şu ilk satırı değiştirmeden korur:

`Auth profile credentials are missing or expired.`

İnsanların anlayabileceği ayrıntı ve kararlı neden kodu, sonraki satırlarda `↳ Auth reason [code]: ...` biçiminde yer alır.

## İlgili

- [Gizli bilgi yönetimi](/tr/gateway/secrets)
- [Kimlik doğrulama depolaması](/tr/concepts/oauth)
