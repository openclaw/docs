---
read_when:
    - Auth profili çözümleme veya kimlik bilgisi yönlendirmesi üzerinde çalışılıyor
    - Model kimlik doğrulama hataları veya profil sırası hata ayıklanıyor
summary: Auth profilleri için kanonik kimlik bilgisi uygunluğu ve çözümleme semantiği
title: Kimlik bilgisi semantiği
x-i18n:
    generated_at: "2026-04-24T08:57:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: b45da872b9ab177acbac08ce353b6ee31b6a068477ace52e5e5eda32a848d8bb
    source_path: auth-credential-semantics.md
    workflow: 15
---

Bu belge, aşağıdaki yüzeylerde kullanılan kanonik kimlik bilgisi uygunluğu ve çözümleme semantiğini tanımlar:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Amaç, seçim zamanındaki ve çalışma zamanındaki davranışın uyumlu kalmasını sağlamaktır.

## Kararlı Probe Neden Kodları

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Token Kimlik Bilgileri

Token kimlik bilgileri (`type: "token"`), satır içi `token` ve/veya `tokenRef` destekler.

### Uygunluk kuralları

1. Hem `token` hem de `tokenRef` yoksa bir token profili uygun değildir.
2. `expires` isteğe bağlıdır.
3. `expires` varsa, `0`'dan büyük sonlu bir sayı olmalıdır.
4. `expires` geçersizse (`NaN`, `0`, negatif, sonlu değilse veya türü yanlışsa), profil `invalid_expires` ile uygun değildir.
5. `expires` geçmişteyse, profil `expired` ile uygun değildir.
6. `tokenRef`, `expires` doğrulamasını atlamaz.

### Çözümleme kuralları

1. Çözücü semantiği, `expires` için uygunluk semantiğiyle eşleşir.
2. Uygun profiller için token materyali satır içi değerden veya `tokenRef` üzerinden çözümlenebilir.
3. Çözümlenemeyen referanslar, `models status --probe` çıktısında `unresolved_ref` üretir.

## Açık Auth Sırası Filtreleme

- Bir sağlayıcı için `auth.order.<provider>` veya auth-store sıra geçersiz kılması ayarlandığında, `models status --probe` yalnızca o sağlayıcı için çözülmüş auth sıralamasında kalan profil kimliklerini probe eder.
- Bu sağlayıcı için saklanan ancak açık sırada yer almayan bir profil daha sonra sessizce denenmez. Probe çıktısı bunu `reasonCode: excluded_by_auth_order` ve şu ayrıntıyla bildirir:
  `Excluded by auth.order for this provider.`

## Probe Hedefi Çözümleme

- Probe hedefleri auth profillerinden, ortam kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
- Bir sağlayıcının kimlik bilgileri varsa ancak OpenClaw onun için probe edilebilir bir model adayı çözemiyorsa, `models status --probe` `reasonCode: no_model` ile `status: no_model` bildirir.

## OAuth SecretRef İlke Koruması

- SecretRef girdisi yalnızca statik kimlik bilgileri içindir.
- Bir profil kimlik bilgisi `type: "oauth"` ise, SecretRef nesneleri bu profilin kimlik bilgisi materyali için desteklenmez.
- `auth.profiles.<id>.mode` `"oauth"` ise, bu profil için SecretRef destekli `keyRef`/`tokenRef` girdisi reddedilir.
- İhlaller, başlangıç/yeniden yükleme auth çözümleme yollarında kesin hatalardır.

## Eski Sistemlerle Uyumlu Mesajlaşma

Betik uyumluluğu için, probe hataları şu ilk satırı değiştirmeden korur:

`Auth profile credentials are missing or expired.`

İnsan dostu ayrıntılar ve kararlı neden kodları sonraki satırlarda eklenebilir.

## İlgili

- [Secrets management](/tr/gateway/secrets)
- [Auth storage](/tr/concepts/oauth)
