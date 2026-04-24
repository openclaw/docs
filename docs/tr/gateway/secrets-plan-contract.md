---
read_when:
    - '`openclaw secrets apply` planlarını oluşturma veya gözden geçirme'
    - '`Invalid plan target path` hatalarında hata ayıklama'
    - Hedef türü ve yol doğrulama davranışını anlama
summary: '`secrets apply` planları için sözleşme: hedef doğrulama, yol eşleştirme ve `auth-profiles.json` hedef kapsamı'
title: Secrets apply plan sözleşmesi
x-i18n:
    generated_at: "2026-04-24T09:11:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

Bu sayfa, `openclaw secrets apply` tarafından zorunlu tutulan katı sözleşmeyi tanımlar.

Bir hedef bu kurallarla eşleşmezse, apply yapılandırmayı değiştirmeden önce başarısız olur.

## Plan dosyası şekli

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

Plan hedefleri, şu konumlardaki desteklenen kimlik bilgisi yolları için kabul edilir:

- [SecretRef Credential Surface](/tr/reference/secretref-credential-surface)

## Hedef türü davranışı

Genel kural:

- `target.type` tanınmalıdır ve normalize edilmiş `target.path` şekliyle eşleşmelidir.

Uyumluluk takma adları mevcut planlar için kabul edilmeye devam eder:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Yol doğrulama kuralları

Her hedef aşağıdakilerin tümüyle doğrulanır:

- `type` tanınan bir hedef türü olmalıdır.
- `path` boş olmayan bir noktalı yol olmalıdır.
- `pathSegments` atlanabilir. Verilirse, `path` ile tam olarak aynı yola normalize edilmelidir.
- Yasaklı segmentler reddedilir: `__proto__`, `prototype`, `constructor`.
- Normalize edilmiş yol, hedef türü için kaydedilmiş yol şekliyle eşleşmelidir.
- `providerId` veya `accountId` ayarlıysa, yolda kodlanmış kimlikle eşleşmelidir.
- `auth-profiles.json` hedefleri `agentId` gerektirir.
- Yeni bir `auth-profiles.json` eşlemesi oluştururken `authProfileProvider` ekleyin.

## Başarısızlık davranışı

Bir hedef doğrulamayı geçemezse, apply şu şekilde bir hatayla çıkar:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Geçersiz bir plan için hiçbir yazma işlemi işlenmez.

## Exec sağlayıcı onay davranışı

- `--dry-run`, varsayılan olarak exec SecretRef denetimlerini atlar.
- Exec SecretRef/sağlayıcı içeren planlar, `--allow-exec` ayarlanmadıkça yazma modunda reddedilir.
- Exec içeren planları doğrularken/uygularken hem dry-run hem de yazma komutlarında `--allow-exec` geçin.

## Çalışma zamanı ve denetim kapsamı notları

- Yalnızca ref içeren `auth-profiles.json` girdileri (`keyRef`/`tokenRef`), çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.
- `secrets apply`, desteklenen `openclaw.json` hedeflerini, desteklenen `auth-profiles.json` hedeflerini ve isteğe bağlı scrub hedeflerini yazar.

## Operatör denetimleri

```bash
# Yazma işlemi olmadan planı doğrula
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Sonra gerçekten uygula
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Exec içeren planlar için, her iki modda da açıkça dahil olun
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Apply geçersiz hedef yolu iletisiyle başarısız olursa, planı `openclaw secrets configure` ile yeniden oluşturun veya hedef yolunu yukarıdaki desteklenen bir şekle düzeltin.

## İlgili belgeler

- [Secrets Management](/tr/gateway/secrets)
- [CLI `secrets`](/tr/cli/secrets)
- [SecretRef Credential Surface](/tr/reference/secretref-credential-surface)
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference)
