---
read_when:
    - Kimlik doğrulama profili çözümleme veya kimlik bilgisi yönlendirmesi üzerinde çalışma
    - Model kimlik doğrulama hatalarında veya profil sıralamasında hata ayıklama
summary: Kimlik doğrulama profilleri için kanonik kimlik bilgisi uygunluğu ve çözümleme semantiği
title: Kimlik doğrulama kimlik bilgisi semantiği
x-i18n:
    generated_at: "2026-06-28T00:10:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
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

Token kimlik bilgileri (`type: "token"`) satır içi `token` ve/veya `tokenRef` desteği sunar.

### Uygunluk kuralları

1. Hem `token` hem de `tokenRef` yoksa bir token profili uygun değildir.
2. `expires` isteğe bağlıdır.
3. `expires` mevcutsa, `0` değerinden büyük sonlu bir sayı olmalıdır.
4. `expires` geçersizse (`NaN`, `0`, negatif, sonlu olmayan veya yanlış tür), profil `invalid_expires` ile uygun değildir.
5. `expires` geçmişteyse, profil `expired` ile uygun değildir.
6. `tokenRef`, `expires` doğrulamasını atlatmaz.

### Çözümleme kuralları

1. Çözümleyici semantikleri, `expires` için uygunluk semantikleriyle eşleşir.
2. Uygun profiller için token materyali satır içi değerden veya `tokenRef` üzerinden çözümlenebilir.
3. Çözümlenemeyen referanslar, `models status --probe` çıktısında `unresolved_ref` üretir.

## Agent kopya taşınabilirliği

Agent kimlik doğrulama kalıtımı geçişli okuma şeklindedir. Bir agent yerel profile sahip olmadığında, çalışma zamanında gizli materyali kendi `auth-profiles.json` dosyasına kopyalamadan varsayılan/ana agent deposundan profilleri çözümleyebilir.

`openclaw agents add` gibi açık kopyalama akışları şu taşınabilirlik politikasını kullanır:

- `api_key` profilleri, `copyToAgents: false` olmadığı sürece taşınabilirdir.
- `token` profilleri, `copyToAgents: false` olmadığı sürece taşınabilirdir.
- `oauth` profilleri varsayılan olarak taşınabilir değildir, çünkü yenileme tokenları tek kullanımlık veya rotasyona duyarlı olabilir.
- Sağlayıcıya ait OAuth akışları, yenileme materyalinin agentlar arasında kopyalanmasının güvenli olduğu bilindiğinde yalnızca `copyToAgents: true` ile dahil olmayı seçebilir.

Taşınabilir olmayan profiller, hedef agent ayrı oturum açıp kendi yerel profilini oluşturmadığı sürece geçişli okuma kalıtımı üzerinden kullanılabilir kalır.

## Yalnızca yapılandırma kimlik doğrulama rotaları

`mode: "aws-sdk"` içeren `auth.profiles` girdileri, saklanan kimlik bilgileri değil, yönlendirme meta verileridir. Hedef sağlayıcı `models.providers.<id>.auth: "aws-sdk"` kullandığında veya Plugin'e ait Amazon Bedrock kurulumu AWS SDK rotasını kullandığında geçerlidirler. Bu profil kimlikleri, `auth-profiles.json` içinde eşleşen bir girdi olmasa bile `auth.order` içinde ve oturum geçersiz kılmalarında görünebilir.

`auth-profiles.json` içine `type: "aws-sdk"` yazmayın. Eski bir kurulumda böyle bir işaretleyici varsa, `openclaw doctor --fix` bunu `auth.profiles` içine taşır ve işaretleyiciyi kimlik bilgisi deposundan kaldırır.

## Açık kimlik doğrulama sırası filtreleme

- Bir sağlayıcı için `auth.order.<provider>` veya auth-store sıra geçersiz kılması ayarlandığında, `models status --probe` yalnızca o sağlayıcı için çözümlenen kimlik doğrulama sırasında kalan profil kimliklerini yoklar.
- Açık sıradan çıkarılmış olan, o sağlayıcıya ait saklanan bir profil daha sonra sessizce denenmez. Yoklama çıktısı bunu `reasonCode: excluded_by_auth_order` ve `Excluded by auth.order for this provider.` ayrıntısıyla bildirir.

## Yoklama hedefi çözümlemesi

- Yoklama hedefleri kimlik doğrulama profillerinden, ortam kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
- Bir sağlayıcının kimlik bilgileri varsa ancak OpenClaw onun için yoklanabilir bir model adayı çözümleyemiyorsa, `models status --probe` `reasonCode: no_model` ile `status: no_model` bildirir.

## Harici CLI kimlik bilgisi keşfi

- Harici CLI'lara ait yalnızca çalışma zamanı kimlik bilgileri, yalnızca sağlayıcı, çalışma zamanı veya kimlik doğrulama profili mevcut işlem kapsamında olduğunda ya da bu harici kaynak için saklanan yerel bir profil zaten mevcut olduğunda keşfedilir.
- Auth-store çağıranları açık bir harici CLI keşif modu seçmelidir: yalnızca kalıcı/Plugin kimlik doğrulaması için `none`, zaten saklanan harici CLI profillerini yenilemek için `existing` veya somut bir sağlayıcı/profil kümesi için `scoped`.
- Salt okunur/durum yolları `allowKeychainPrompt: false` iletir; yalnızca dosya destekli harici CLI kimlik bilgilerini kullanırlar ve macOS Keychain sonuçlarını okumaz veya yeniden kullanmazlar.

## OAuth SecretRef Politika Koruması

- SecretRef girdisi yalnızca statik kimlik bilgileri içindir.
- Bir profil kimlik bilgisi `type: "oauth"` ise, SecretRef nesneleri bu profil kimlik bilgisi materyali için desteklenmez.
- `auth.profiles.<id>.mode` `"oauth"` ise, bu profil için SecretRef destekli `keyRef`/`tokenRef` girdisi reddedilir.
- İhlaller, başlatma/yeniden yükleme kimlik doğrulama çözümleme yollarında kesin hatalardır.

## Eski Sürümlerle Uyumlu Mesajlaşma

Betik uyumluluğu için, yoklama hataları bu ilk satırı değiştirmeden korur:

`Auth profile credentials are missing or expired.`

İnsan dostu ayrıntılar ve kararlı neden kodları sonraki satırlara eklenebilir.

## İlgili

- [Gizli anahtar yönetimi](/tr/gateway/secrets)
- [Kimlik doğrulama depolaması](/tr/concepts/oauth)
