---
read_when:
    - Kimlik doğrulama profili çözümlemesi veya kimlik bilgisi yönlendirmesi üzerinde çalışırken
    - Model kimlik doğrulama hatalarını veya profil sırasını hata ayıklarken
summary: Kimlik doğrulama profilleri için kanonik kimlik bilgisi uygunluğu ve çözümleme semantiği
title: Kimlik Doğrulama Kimlik Bilgisi Semantiği
x-i18n:
    generated_at: "2026-04-05T13:42:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4cd3e16cd25eb22c5e707311d06a19df1a59747ee3261c2d32c534a245fd7fb
    source_path: auth-credential-semantics.md
    workflow: 15
---

# Kimlik Doğrulama Kimlik Bilgisi Semantiği

Bu belge, aşağıdakilerde kullanılan kanonik kimlik bilgisi uygunluğu ve çözümleme semantiğini tanımlar:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

Amaç, seçim zamanı ve çalışma zamanı davranışını uyumlu tutmaktır.

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

1. Bir token profili, hem `token` hem de `tokenRef` yoksa uygun değildir.
2. `expires` isteğe bağlıdır.
3. `expires` varsa, `0` değerinden büyük sonlu bir sayı olmalıdır.
4. `expires` geçersizse (`NaN`, `0`, negatif, sonlu değilse veya türü yanlışsa), profil `invalid_expires` ile uygun değildir.
5. `expires` geçmişteyse, profil `expired` ile uygun değildir.
6. `tokenRef`, `expires` doğrulamasını atlatmaz.

### Çözümleme kuralları

1. Çözümleyici semantiği, `expires` için uygunluk semantiğiyle eşleşir.
2. Uygun profiller için token materyali satır içi değerden veya `tokenRef` üzerinden çözümlenebilir.
3. Çözümlenemeyen ref'ler, `models status --probe` çıktısında `unresolved_ref` üretir.

## Açık Kimlik Doğrulama Sırası Filtreleme

- Bir sağlayıcı için `auth.order.<provider>` veya auth-store sıra geçersiz kılması ayarlandığında, `models status --probe` yalnızca o sağlayıcı için çözülmüş kimlik doğrulama sırasında kalan profil kimliklerini probe eder.
- O sağlayıcı için depolanmış ancak açık sırada atlanmış bir profil daha sonra sessizce denenmez. Probe çıktısı bunu `reasonCode: excluded_by_auth_order` ve `Excluded by auth.order for this provider.` ayrıntısıyla bildirir.

## Probe Hedefi Çözümleme

- Probe hedefleri kimlik doğrulama profillerinden, ortam kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
- Bir sağlayıcının kimlik bilgileri varsa ancak OpenClaw onun için probe edilebilir bir model adayı çözemiyorsa, `models status --probe` bunu `status: no_model` ve `reasonCode: no_model` ile bildirir.

## OAuth SecretRef İlke Koruması

- SecretRef girdisi yalnızca statik kimlik bilgileri içindir.
- Bir profil kimlik bilgisi `type: "oauth"` ise, SecretRef nesneleri o profil kimlik bilgisi materyali için desteklenmez.
- `auth.profiles.<id>.mode` `"oauth"` ise, o profil için SecretRef destekli `keyRef`/`tokenRef` girdisi reddedilir.
- İhlaller, başlangıç/yeniden yükleme kimlik doğrulama çözümleme yollarında kesin hatalardır.

## Eski Sürümlerle Uyumlu Mesajlaşma

Betik uyumluluğu için, probe hataları şu ilk satırı değiştirmeden korur:

`Auth profile credentials are missing or expired.`

İnsan dostu ayrıntılar ve kararlı neden kodları sonraki satırlara eklenebilir.
