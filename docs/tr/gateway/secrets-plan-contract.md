---
read_when:
    - '`openclaw secrets apply` planları oluştururken veya incelerken'
    - '`Invalid plan target path` hatalarında hata ayıklarken'
    - Hedef türü ve yol doğrulama davranışını anlamak istediğinizde
summary: '`secrets apply` planları için sözleşme: hedef doğrulama, yol eşleştirme ve `auth-profiles.json` hedef kapsamı'
title: Secrets Apply Plan Sözleşmesi
x-i18n:
    generated_at: "2026-04-05T13:54:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb89a426ca937cf4d745f641b43b330c7fbb1aa9e4359b106ecd28d7a65ca327
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

# Secrets apply plan sözleşmesi

Bu sayfa, `openclaw secrets apply` tarafından zorunlu kılınan katı sözleşmeyi tanımlar.

Bir hedef bu kurallarla eşleşmezse apply, config'i değiştirmeden önce başarısız olur.

## Plan dosyası biçimi

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

## Desteklenen hedef kapsamı

Plan hedefleri, aşağıdaki bölümdeki desteklenen kimlik bilgisi yolları için kabul edilir:

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

## Hedef türü davranışı

Genel kural:

- `target.type` tanınmalıdır ve normalize edilmiş `target.path` biçimiyle eşleşmelidir.

Uyumluluk takma adları mevcut planlar için kabul edilmeye devam eder:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Yol doğrulama kuralları

Her hedef aşağıdakilerin tümüyle doğrulanır:

- `type` tanınan bir hedef türü olmalıdır.
- `path` boş olmayan bir nokta yolu olmalıdır.
- `pathSegments` atlanabilir. Verilirse `path` ile tam olarak aynı yola normalize olmalıdır.
- Yasak segmentler reddedilir: `__proto__`, `prototype`, `constructor`.
- Normalize edilmiş yol, hedef türü için kaydedilmiş yol biçimiyle eşleşmelidir.
- `providerId` veya `accountId` ayarlıysa yolda kodlanmış kimlikle eşleşmelidir.
- `auth-profiles.json` hedefleri `agentId` gerektirir.
- Yeni bir `auth-profiles.json` eşlemesi oluştururken `authProfileProvider` ekleyin.

## Başarısızlık davranışı

Bir hedef doğrulamayı geçemezse apply şu şekilde bir hatayla çıkar:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Geçersiz bir plan için hiçbir yazma işlemi kaydedilmez.

## Exec sağlayıcı onay davranışı

- `--dry-run`, varsayılan olarak `exec` SecretRef denetimlerini atlar.
- `exec` SecretRef'leri/sağlayıcıları içeren planlar, `--allow-exec` ayarlanmadıkça yazma modunda reddedilir.
- `exec` içeren planları doğrularken/uygularken hem dry-run hem de yazma komutlarında `--allow-exec` geçin.

## Çalışma zamanı ve denetim kapsamı notları

- Yalnızca referans içeren `auth-profiles.json` girdileri (`keyRef`/`tokenRef`) çalışma zamanı çözümleme ve denetim kapsamına dahildir.
- `secrets apply`, desteklenen `openclaw.json` hedeflerini, desteklenen `auth-profiles.json` hedeflerini ve isteğe bağlı temizleme hedeflerini yazar.

## Operatör denetimleri

```bash
# Yazmadan planı doğrula
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Sonra gerçekten uygula
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Exec içeren planlar için her iki modda da açıkça izin ver
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Apply, geçersiz hedef yolu mesajıyla başarısız olursa planı `openclaw secrets configure` ile yeniden oluşturun veya hedef yolunu yukarıdaki desteklenen bir biçime düzeltin.

## İlgili belgeler

- [Secrets Management](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [SecretRef Credential Surface](/reference/secretref-credential-surface)
- [Configuration Reference](/gateway/configuration-reference)
