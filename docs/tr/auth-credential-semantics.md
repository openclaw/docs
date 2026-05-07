---
read_when:
    - Kimlik doğrulama profili çözümlemesi veya kimlik bilgisi yönlendirmesi üzerinde çalışma
    - Model kimlik doğrulama hataları veya profil sırası için hata ayıklama
summary: Kimlik doğrulama profilleri için kanonik kimlik bilgisi uygunluğu ve çözümleme semantiği
title: Kimlik doğrulama kimlik bilgisi semantiği
x-i18n:
    generated_at: "2026-05-07T13:13:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d916ff95ca2ac1fe21e66f64b887b1df1e6b97d7dcc681e5bb9a9dee8ce9473
    source_path: auth-credential-semantics.md
    workflow: 16
---

Bu belge, şunlar genelinde kullanılan kanonik kimlik bilgisi uygunluğu ve çözümleme semantiklerini tanımlar:

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

1. Bir token profilinde hem `token` hem de `tokenRef` yoksa profil uygun değildir.
2. `expires` isteğe bağlıdır.
3. `expires` varsa, `0` değerinden büyük sonlu bir sayı olmalıdır.
4. `expires` geçersizse (`NaN`, `0`, negatif, sonlu olmayan veya yanlış tür), profil `invalid_expires` ile uygun değildir.
5. `expires` geçmişteyse, profil `expired` ile uygun değildir.
6. `tokenRef`, `expires` doğrulamasını atlatmaz.

### Çözümleme kuralları

1. Çözümleyici semantikleri, `expires` için uygunluk semantikleriyle eşleşir.
2. Uygun profiller için token materyali satır içi değerden veya `tokenRef` üzerinden çözümlenebilir.
3. Çözümlenemeyen ref'ler `models status --probe` çıktısında `unresolved_ref` üretir.

## Ajan kopyası taşınabilirliği

Ajan kimlik doğrulama devralımı read-through çalışır. Bir ajanın yerel profili olmadığında, çalışma zamanında gizli materyali kendi `auth-profiles.json` dosyasına kopyalamadan varsayılan/ana ajan deposundaki profilleri çözümleyebilir.

`openclaw agents add` gibi açık kopyalama akışları şu taşınabilirlik ilkesini kullanır:

- `api_key` profilleri, `copyToAgents: false` olmadıkça taşınabilirdir.
- `token` profilleri, `copyToAgents: false` olmadıkça taşınabilirdir.
- `oauth` profilleri varsayılan olarak taşınabilir değildir çünkü yenileme token'ları tek kullanımlık veya rotasyona duyarlı olabilir.
- Sağlayıcıya ait OAuth akışları, yalnızca yenileme materyalinin ajanlar arasında kopyalanmasının güvenli olduğu bilindiğinde `copyToAgents: true` ile katılabilir.

Taşınabilir olmayan profiller, hedef ajan ayrı olarak oturum açıp kendi yerel profilini oluşturmadıkça read-through devralım yoluyla kullanılabilir kalır.

## Yalnızca yapılandırmaya dayalı kimlik doğrulama rotaları

`mode: "aws-sdk"` değerine sahip `auth.profiles` girdileri, saklanan kimlik bilgileri değil, yönlendirme meta verileridir. Hedef sağlayıcı `models.providers.<id>.auth: "aws-sdk"` veya yerleşik Amazon Bedrock varsayılan AWS SDK rotasını kullandığında geçerlidirler. Bu profil kimlikleri, `auth-profiles.json` içinde eşleşen bir girdi olmasa bile `auth.order` ve oturum geçersiz kılmalarında görünebilir.

`auth-profiles.json` içine `type: "aws-sdk"` yazmayın. Eski bir kurulumda böyle bir işaret varsa, `openclaw doctor --fix` bunu `auth.profiles` konumuna taşır ve işareti kimlik bilgisi deposundan kaldırır.

## Açık kimlik doğrulama sırası filtreleme

- Bir sağlayıcı için `auth.order.<provider>` veya auth-store sıra geçersiz kılması ayarlandığında, `models status --probe` yalnızca o sağlayıcı için çözümlenen kimlik doğrulama sırasında kalan profil kimliklerini yoklar.
- Açık sıradan çıkarılan, o sağlayıcıya ait saklanan profil daha sonra sessizce denenmez. Yoklama çıktısı bunu `reasonCode: excluded_by_auth_order` ve `Excluded by auth.order for this provider.` ayrıntısıyla bildirir.

## Yoklama hedefi çözümleme

- Yoklama hedefleri kimlik doğrulama profillerinden, ortam kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
- Bir sağlayıcının kimlik bilgileri varsa ancak OpenClaw onun için yoklanabilir bir model adayı çözümleyemiyorsa, `models status --probe` `reasonCode: no_model` ile `status: no_model` bildirir.

## Harici CLI kimlik bilgisi keşfi

- Harici CLI'lara ait yalnızca çalışma zamanı kimlik bilgileri, yalnızca sağlayıcı, çalışma zamanı veya kimlik doğrulama profili geçerli işlem kapsamında olduğunda ya da bu harici kaynak için saklanan yerel profil zaten mevcut olduğunda keşfedilir.
- Auth-store çağıranları açık bir harici CLI keşif modu seçmelidir: yalnızca kalıcı/Plugin kimlik doğrulaması için `none`, zaten saklanan harici CLI profillerini yenilemek için `existing` veya somut bir sağlayıcı/profil kümesi için `scoped`.
- Salt okunur/durum yolları `allowKeychainPrompt: false` geçirir; yalnızca dosya destekli harici CLI kimlik bilgilerini kullanır ve macOS Keychain sonuçlarını okumaz veya yeniden kullanmaz.

## OAuth SecretRef İlke Koruması

- SecretRef girdisi yalnızca statik kimlik bilgileri içindir.
- Bir profil kimlik bilgisi `type: "oauth"` ise, SecretRef nesneleri bu profil kimlik bilgisi materyali için desteklenmez.
- `auth.profiles.<id>.mode` `"oauth"` ise, bu profil için SecretRef destekli `keyRef`/`tokenRef` girdisi reddedilir.
- İhlaller, başlatma/yeniden yükleme kimlik doğrulama çözümleme yollarında kesin hatalardır.

## Eski sistemle uyumlu mesajlaşma

Betik uyumluluğu için yoklama hataları şu ilk satırı değişmeden tutar:

`Auth profile credentials are missing or expired.`

İnsan dostu ayrıntı ve kararlı neden kodları sonraki satırlara eklenebilir.

## İlgili

- [Gizli bilgi yönetimi](/tr/gateway/secrets)
- [Kimlik doğrulama depolaması](/tr/concepts/oauth)
