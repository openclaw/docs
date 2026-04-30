---
read_when:
    - Kimlik doğrulama profili çözümlemesi veya kimlik bilgisi yönlendirmesi üzerinde çalışma
    - Model kimlik doğrulama hatalarında veya profil sıralamasında hata ayıklama
summary: Kimlik doğrulama profilleri için kanonik kimlik bilgisi uygunluğu ve çözümleme semantiği
title: Kimlik doğrulama bilgisi semantiği
x-i18n:
    generated_at: "2026-04-30T09:04:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

Bu belge, şu alanlarda kullanılan kanonik kimlik bilgisi uygunluğu ve çözümleme semantiğini tanımlar:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Amaç, seçim zamanı ve çalışma zamanı davranışını uyumlu tutmaktır.

## Kararlı yoklama neden kodları

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Token kimlik bilgileri

Token kimlik bilgileri (`type: "token"`) satır içi `token` ve/veya `tokenRef` destekler.

### Uygunluk kuralları

1. Bir token profili, hem `token` hem de `tokenRef` yoksa uygun değildir.
2. `expires` isteğe bağlıdır.
3. `expires` varsa, `0` değerinden büyük sonlu bir sayı olmalıdır.
4. `expires` geçersizse (`NaN`, `0`, negatif, sonlu olmayan veya yanlış tür), profil `invalid_expires` ile uygun değildir.
5. `expires` geçmişteyse, profil `expired` ile uygun değildir.
6. `tokenRef`, `expires` doğrulamasını atlatmaz.

### Çözümleme kuralları

1. Çözümleyici semantiği, `expires` için uygunluk semantiğiyle eşleşir.
2. Uygun profiller için token materyali satır içi değerden veya `tokenRef` üzerinden çözümlenebilir.
3. Çözümlenemeyen ref'ler, `models status --probe` çıktısında `unresolved_ref` üretir.

## Agent kopyalama taşınabilirliği

Agent kimlik doğrulama devralımı read-through çalışır. Bir agent'ın yerel profili yoksa, çalışma zamanında kendi `auth-profiles.json` dosyasına gizli materyal kopyalamadan varsayılan/ana agent deposundan profilleri çözümleyebilir.

`openclaw agents add` gibi açık kopyalama akışları şu taşınabilirlik ilkesini kullanır:

- `api_key` profilleri, `copyToAgents: false` olmadığı sürece taşınabilirdir.
- `token` profilleri, `copyToAgents: false` olmadığı sürece taşınabilirdir.
- `oauth` profilleri varsayılan olarak taşınabilir değildir çünkü refresh token'ları tek kullanımlık veya rotasyona duyarlı olabilir.
- Sağlayıcıya ait OAuth akışları, yalnızca refresh materyalini agent'lar arasında kopyalamanın güvenli olduğu bilindiğinde `copyToAgents: true` ile katılabilir.

Taşınabilir olmayan profiller, hedef agent ayrı olarak oturum açıp kendi yerel profilini oluşturmadığı sürece read-through devralım yoluyla kullanılabilir kalır.

## Açık kimlik doğrulama sırası filtreleme

- Bir sağlayıcı için `auth.order.<provider>` veya auth-store sıra geçersiz kılması ayarlandığında, `models status --probe` yalnızca o sağlayıcı için çözümlenen kimlik doğrulama sırasında kalan profil kimliklerini yoklar.
- Açık sıradan çıkarılan, o sağlayıcıya ait depolanmış bir profil daha sonra sessizce denenmez. Yoklama çıktısı bunu `reasonCode: excluded_by_auth_order` ve `Excluded by auth.order for this provider.` ayrıntısıyla bildirir.

## Yoklama hedefi çözümleme

- Yoklama hedefleri kimlik doğrulama profillerinden, ortam kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
- Bir sağlayıcının kimlik bilgileri varsa ancak OpenClaw onun için yoklanabilir bir model adayı çözümleyemiyorsa, `models status --probe` `reasonCode: no_model` ile `status: no_model` bildirir.

## Harici CLI kimlik bilgisi keşfi

- Harici CLI'lara ait yalnızca çalışma zamanı kimlik bilgileri, yalnızca sağlayıcı, çalışma zamanı veya kimlik doğrulama profili mevcut işlem kapsamındaysa ya da bu harici kaynak için depolanmış yerel bir profil zaten varsa keşfedilir.
- Salt okunur/durum yolları `allowKeychainPrompt: false` geçirir; yalnızca dosya destekli harici CLI kimlik bilgilerini kullanır ve macOS Keychain sonuçlarını okumaz veya yeniden kullanmaz.

## OAuth SecretRef İlke Koruması

- SecretRef girdisi yalnızca statik kimlik bilgileri içindir.
- Bir profil kimlik bilgisi `type: "oauth"` ise, SecretRef nesneleri bu profil kimlik bilgisi materyali için desteklenmez.
- `auth.profiles.<id>.mode` `"oauth"` ise, bu profil için SecretRef destekli `keyRef`/`tokenRef` girdisi reddedilir.
- İhlaller, başlatma/yeniden yükleme kimlik doğrulama çözümleme yollarında kesin hatadır.

## Eski Sürümle Uyumlu Mesajlaşma

Betik uyumluluğu için yoklama hataları şu ilk satırı değişmeden korur:

`Auth profile credentials are missing or expired.`

İnsan dostu ayrıntı ve kararlı neden kodları sonraki satırlara eklenebilir.

## İlgili

- [Gizli bilgiler yönetimi](/tr/gateway/secrets)
- [Kimlik doğrulama depolaması](/tr/concepts/oauth)
