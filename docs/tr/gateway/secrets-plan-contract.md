---
read_when:
    - '`openclaw secrets apply` planlarını oluşturma veya inceleme'
    - '`Invalid plan target path` hatalarında hata ayıklama'
    - Hedef türü ve yol doğrulama davranışını anlama
summary: '`secrets apply` planları için sözleşme: hedef doğrulaması, yol eşleştirme ve `auth-profiles.json` hedef kapsamı'
title: Gizli bilgiler uygulama planı sözleşmesi
x-i18n:
    generated_at: "2026-06-28T00:38:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Bu sayfa, `openclaw secrets apply` tarafından zorlanan katı sözleşmeyi tanımlar.

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

## Sağlayıcı upsert'leri ve silmeleri

Planlar ayrıca hedef başına yazmalarla birlikte `secrets.providers` eşlemini değiştiren iki isteğe bağlı üst düzey alan içerebilir:

- `providerUpserts` — sağlayıcı takma adına göre anahtarlanmış bir nesne. Her değer bir sağlayıcı tanımıdır (`openclaw.json` içinde `secrets.providers.<alias>` altında kabul edilenle aynı şekil; örneğin bir `exec` veya `file` sağlayıcısı).
- `providerDeletes` — kaldırılacak sağlayıcı takma adlarından oluşan bir dizi.

`providerUpserts`, `targets` öncesinde çalışır; bu nedenle bir `target.ref.provider`, aynı planın `providerUpserts` içinde tanıttığı bir sağlayıcı takma adına başvurabilir. Bu olmadan, `openclaw.json` içinde henüz yapılandırılmamış bir takma ada başvuran planlar `provider "<alias>" is not configured` hatasıyla başarısız olur.

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

`providerUpserts` aracılığıyla tanıtılan exec sağlayıcıları, [Exec sağlayıcısı onay davranışı](#exec-provider-consent-behavior) bölümündeki exec onayı kurallarına yine tabidir: exec sağlayıcıları içeren planlar yazma modunda `--allow-exec` gerektirir.

## Desteklenen hedef kapsamı

Plan hedefleri, şu bölümdeki desteklenen kimlik bilgisi yolları için kabul edilir:

- [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)

## Hedef türü davranışı

Genel kural:

- `target.type` tanınmalı ve normalleştirilmiş `target.path` şekliyle eşleşmelidir.

Mevcut planlar için uyumluluk takma adları kabul edilmeye devam eder:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Yol doğrulama kuralları

Her hedef aşağıdakilerin tümüyle doğrulanır:

- `type`, tanınan bir hedef türü olmalıdır.
- `path`, boş olmayan bir noktalı yol olmalıdır.
- `pathSegments` atlanabilir. Sağlanırsa, tam olarak `path` ile aynı yola normalleşmelidir.
- Yasaklı segmentler reddedilir: `__proto__`, `prototype`, `constructor`.
- Normalleştirilmiş yol, hedef türü için kayıtlı yol şekliyle eşleşmelidir.
- `providerId` veya `accountId` ayarlanmışsa, yolda kodlanmış kimlikle eşleşmelidir.
- `auth-profiles.json` hedefleri `agentId` gerektirir.
- Yeni bir `auth-profiles.json` eşlemesi oluştururken `authProfileProvider` ekleyin.

## Başarısızlık davranışı

Bir hedef doğrulamadan geçemezse, apply şuna benzer bir hatayla çıkar:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Geçersiz bir plan için hiçbir yazma işlemi kaydedilmez.

## Exec sağlayıcısı onay davranışı

- `--dry-run`, varsayılan olarak exec SecretRef denetimlerini atlar.
- Exec SecretRef'leri/sağlayıcıları içeren planlar, `--allow-exec` ayarlanmadığı sürece yazma modunda reddedilir.
- Exec içeren planları doğrularken/uygularken, hem dry-run hem de yazma komutlarında `--allow-exec` geçirin.

## Çalışma zamanı ve denetim kapsamı notları

- Yalnızca ref içeren `auth-profiles.json` girdileri (`keyRef`/`tokenRef`), çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.
- `secrets apply`, desteklenen `openclaw.json` hedeflerini, desteklenen `auth-profiles.json` hedeflerini ve isteğe bağlı temizleme hedeflerini yazar.

## Operatör denetimleri

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Apply geçersiz hedef yolu iletisiyle başarısız olursa, planı `openclaw secrets configure` ile yeniden oluşturun veya hedef yolunu yukarıdaki desteklenen şekillerden birine düzeltin.

## İlgili belgeler

- [Sırlar Yönetimi](/tr/gateway/secrets)
- [CLI `secrets`](/tr/cli/secrets)
- [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)
- [Yapılandırma Başvurusu](/tr/gateway/configuration-reference)
