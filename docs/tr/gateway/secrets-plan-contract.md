---
read_when:
    - '`openclaw secrets apply` planları oluşturma veya inceleme'
    - '`Invalid plan target path` hatalarında hata ayıklama'
    - Hedef türünü ve yol doğrulama davranışını anlama
summary: '`secrets apply` planları için sözleşme: hedef doğrulama, yol eşleştirme ve `auth-profiles.json` hedef kapsamı'
title: Gizli bilgileri uygulama planı sözleşmesi
x-i18n:
    generated_at: "2026-07-12T11:47:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Bu sayfa, `openclaw secrets apply` tarafından uygulanan katı sözleşmeyi tanımlar. Bir hedef bu kurallara uymuyorsa apply, herhangi bir dosyada değişiklik yapmadan önce başarısız olur.

## Plan dosyasının yapısı

`openclaw secrets apply --from <plan.json>`, plan hedeflerinden oluşan bir `targets` dizisi bekler:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

`openclaw secrets configure` bu yapıda planlar oluşturur. Ayrıca bir planı elle yazabilir veya düzenleyebilirsiniz.

## Sağlayıcı ekleme/güncelleme ve silme işlemleri

Planlar, hedef başına yazma işlemleriyle birlikte `secrets.providers` eşlemesini değiştiren iki isteğe bağlı üst düzey alan da içerebilir:

- `providerUpserts` -- anahtarları sağlayıcı takma adları olan bir nesne. Her değer bir sağlayıcı tanımıdır (`openclaw.json` içinde `secrets.providers.<alias>` altında kabul edilen yapıyla aynıdır; örneğin bir `exec` veya `file` sağlayıcısı).
- `providerDeletes` -- kaldırılacak sağlayıcı takma adlarından oluşan bir dizi.

`providerUpserts`, `targets` öğesinden önce çalışır; dolayısıyla bir `target.ref.provider`, aynı planın `providerUpserts` içinde eklediği bir sağlayıcı takma adına başvurabilir. Bu sıralama olmadan, `openclaw.json` içinde henüz yapılandırılmamış bir takma ada başvuran planlar `provider "<alias>" is not configured` hatasıyla başarısız olur.

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

`providerUpserts` aracılığıyla eklenen exec sağlayıcıları yine de [Exec sağlayıcısı onay davranışı](#exec-provider-consent-behavior) bölümündeki exec onayı kurallarına tabidir: exec sağlayıcıları içeren planlar, yazma modunda `--allow-exec` gerektirir.

## Desteklenen hedef kapsamı

Plan hedefleri, [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface) bölümündeki desteklenen kimlik bilgisi yolları için kabul edilir.

## Hedef türü davranışı

`target.type`, tanınan bir hedef türü olmalı ve normalleştirilmiş `target.path`, bu türün kayıtlı yol yapısıyla eşleşmelidir.

Bazı hedef türleri, standart tür adlarına ek olarak mevcut planlar için uyumluluk takma adını `target.type` olarak kabul eder:

| Standart tür                          | Kabul edilen takma ad                           |
| ------------------------------------- | ----------------------------------------------- |
| `models.providers.apiKey`             | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`               | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount`  | `channels.googlechat.accounts.*.serviceAccount` |

## Yol doğrulama kuralları

Her hedef aşağıdaki kuralların tümüyle doğrulanır:

- `type`, tanınan bir hedef türü olmalıdır.
- `path`, boş olmayan, noktalarla ayrılmış bir yol olmalıdır.
- `pathSegments` atlanabilir. Sağlanırsa tam olarak `path` ile aynı yola normalleştirilmelidir.
- Yasaklı segmentler reddedilir: `__proto__`, `prototype`, `constructor`.
- Normalleştirilmiş yol, hedef türü için kayıtlı yol yapısıyla eşleşmelidir.
- `providerId` veya `accountId` ayarlanmışsa yolda kodlanmış kimlikle eşleşmelidir.
- `auth-profiles.json` hedefleri `agentId` gerektirir.
- Yeni bir `auth-profiles.json` eşlemesi oluştururken `authProfileProvider` ekleyin.

## Hata davranışı

Bir hedef doğrulamadan geçemezse apply aşağıdakine benzer bir hatayla çıkar:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Geçersiz bir plan için hiçbir yazma işlemi kalıcı hâle getirilmez: hedef çözümleme ve yol doğrulama, herhangi bir dosyaya dokunulmadan önce çalışır. Ayrıca geçerli bir plan yazmaya başladığında apply, önce dokunulan her dosyanın anlık görüntüsünü alır ve aynı çalıştırmadaki sonraki bir yazma işlemi başarısız olursa bu anlık görüntüleri geri yükler. Böylece kısmi bir yazma işlemi yapılandırma, kimlik doğrulama profili veya ortam durumunun hiçbir zaman birbiriyle uyumsuz kalmasına neden olmaz.

## Exec sağlayıcısı onay davranışı

- `--dry-run`, varsayılan olarak exec SecretRef denetimlerini atlar.
- Exec SecretRef'leri/sağlayıcıları içeren planlar, `--allow-exec` ayarlanmadığı sürece yazma modunda reddedilir.
- Exec içeren planları doğrularken/uygularken hem deneme çalıştırması hem de yazma komutlarında `--allow-exec` kullanın.

## Çalışma zamanı ve denetim kapsamına ilişkin notlar

- Yalnızca başvuru içeren `auth-profiles.json` girdileri (`keyRef`/`tokenRef`), çalışma zamanındaki kimlik bilgisi çözümlemesine ve denetim kapsamına dahildir.
- `secrets apply`, desteklenen `openclaw.json` hedeflerini, desteklenen `auth-profiles.json` hedeflerini ve her biri varsayılan olarak etkin olan üç isteğe bağlı temizleme geçişini yazar: `scrubEnv` (`.env` içindeki taşınmış düz metin değerlerini kaldırır), `scrubAuthProfilesForProviderTargets` (bir planın yeni taşıdığı sağlayıcılar için `auth-profiles.json` içindeki düz metin/kullanılmayan başvuru kalıntılarını temizler) ve `scrubLegacyAuthJson` (eski `auth.json` depolarındaki taşınmış `api_key` girdilerini kaldırır). Bir geçişi atlamak için plandaki `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets` veya `options.scrubLegacyAuthJson` seçeneklerinden ilgili olanı `false` olarak ayarlayın.

## Operatör denetimleri

```bash
# Yazma işlemi yapmadan planı doğrulayın
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Ardından gerçekten uygulayın
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Exec içeren planlarda her iki mod için de açıkça onay verin
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Apply, geçersiz hedef yolu mesajıyla başarısız olursa planı `openclaw secrets configure` ile yeniden oluşturun veya hedef yolunu yukarıda belirtilen desteklenen yapılardan birine uyacak şekilde düzeltin.

## İlgili belgeler

- [Gizli Bilgi Yönetimi](/tr/gateway/secrets)
- [CLI `secrets`](/tr/cli/secrets)
- [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference)
