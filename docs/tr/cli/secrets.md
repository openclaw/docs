---
read_when:
    - Çalışma zamanında gizli bilgi referanslarını yeniden çözümleme
    - Düz metin kalıntılarını ve çözümlenmemiş referansları denetleme
    - SecretRef'leri yapılandırma ve tek yönlü temizleme değişikliklerini uygulama
summary: '`openclaw secrets` için CLI başvurusu (yeniden yükleme, denetleme, yapılandırma, uygulama)'
title: Gizli bilgiler
x-i18n:
    generated_at: "2026-07-12T11:36:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

SecretRef'leri yönetin ve etkin çalışma zamanı anlık görüntüsünü sağlıklı tutun.

| Komut       | Rol                                                                                                                                                                                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | Gateway RPC (`secrets.reload`): başvuruları yeniden çözümler ve çalışma zamanı anlık görüntüsünü yalnızca tam başarı durumunda değiştirir (yapılandırmaya yazmaz)                                                                                  |
| `audit`     | Yapılandırma/kimlik doğrulama/oluşturulan model depolarını ve eski kalıntıları düz metin, çözümlenmemiş başvurular ve öncelik sapması açısından salt okunur olarak tarar (`--allow-exec` kullanılmadıkça exec başvuruları atlanır)                     |
| `configure` | Sağlayıcı kurulumu, hedef eşleme ve ön kontrol için etkileşimli planlayıcı (TTY gerektirir)                                                                                                                                                       |
| `apply`     | Kaydedilmiş bir planı yürütür (`--dry-run` yalnızca doğrular ve varsayılan olarak exec denetimlerini atlar; yazma modu, `--allow-exec` kullanılmadıkça exec içeren planları reddeder), ardından hedeflenen düz metin kalıntılarını temizler           |

Önerilen operatör döngüsü:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Planınız `exec` SecretRef'leri/sağlayıcıları içeriyorsa hem deneme çalıştırması hem de yazma amaçlı `apply` komutlarında `--allow-exec` kullanın.

CI/geçitler için çıkış kodları:

- `audit --check`, bulgu olduğunda `1` döndürür.
- Çözümlenmemiş başvurular, `--check` değerinden bağımsız olarak `2` döndürür.

İlgili: [Gizli Bilgi Yönetimi](/tr/gateway/secrets) · [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface) · [Güvenlik](/tr/gateway/security)

## Çalışma zamanı anlık görüntüsünü yeniden yükleme

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

`secrets.reload` Gateway RPC yöntemini kullanır. Çözümleme başarısız olursa Gateway, bilinen son iyi anlık görüntüsünü korur ve bir hata döndürür (kısmi etkinleştirme yapılmaz). JSON yanıtı `warningCount` içerir.

Seçenekler: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Denetim

OpenClaw durumunu şunlar açısından tarar:

- düz metin gizli bilgi depolama
- çözümlenmemiş başvurular
- öncelik sapması (`auth-profiles.json` kimlik bilgilerinin `openclaw.json` başvurularını gölgelemesi)
- oluşturulan `agents/*/agent/models.json` kalıntıları (sağlayıcı `apiKey` değerleri ve hassas sağlayıcı üstbilgileri)
- eski kalıntılar (eski kimlik doğrulama deposu girdileri, OAuth hatırlatıcıları)

Hassas sağlayıcı üstbilgisi algılama, ad sezgisine dayanır: adı yaygın kimlik doğrulama/kimlik bilgisi parçalarıyla (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`) eşleşen üstbilgileri işaretler.

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Rapor yapısı:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- bulgu kodları: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Yapılandırma (etkileşimli yardımcı)

Sağlayıcı ve SecretRef değişikliklerini etkileşimli olarak oluşturun, ön kontrolü çalıştırın ve isteğe bağlı olarak uygulayın:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Akış: önce sağlayıcı kurulumu (`secrets.providers` takma adlarını ekleme/düzenleme/kaldırma), ardından kimlik bilgisi eşleme (alanları seçme, `{source, provider, id}` başvurularını atama), sonrasında ön kontrol ve isteğe bağlı uygulama.

Bayraklar:

- `--providers-only`: yalnızca `secrets.providers` yapılandırmasını yapar, kimlik bilgisi eşlemeyi atlar
- `--skip-provider-setup`: sağlayıcı kurulumunu atlar, kimlik bilgilerini mevcut sağlayıcılarla eşler
- `--agent <id>`: `auth-profiles.json` hedef keşfini ve yazma işlemlerini tek bir aracı deposuyla sınırlar
- `--allow-exec`: ön kontrol/uygulama sırasında exec SecretRef denetimlerine izin verir (sağlayıcı komutlarını yürütebilir)

`--providers-only` ve `--skip-provider-setup` birlikte kullanılamaz.

Notlar:

- Etkileşimli bir TTY gerektirir.
- Seçilen aracı kapsamı için `openclaw.json` içindeki gizli bilgi taşıyan alanları ve `auth-profiles.json` dosyasını hedefler; standart desteklenen yüzey: [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface).
- Seçici akışında doğrudan yeni `auth-profiles.json` eşlemeleri oluşturmayı destekler.
- Uygulamadan önce ön kontrol çözümlemesini çalıştırır.
- Oluşturulan planlarda temizleme seçenekleri varsayılan olarak etkindir (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). Uygulama, temizlenen düz metin değerleri açısından tek yönlüdür.
- `--apply` kullanılmadığında bile CLI, ön kontrolden sonra `Apply this plan now?` istemini gösterir.
- `--apply` kullanıldığında (`--yes` olmadan) CLI, geri alınamaz geçiş için ek bir onay ister.
- `--json`, planı ve ön kontrol raporunu yazdırır ancak yine de etkileşimli bir TTY gerektirir.

### Exec sağlayıcı güvenliği

Homebrew kurulumları genellikle `/opt/homebrew/bin/*` altında sembolik bağlantılı ikili dosyalar sunar. `allowSymlinkCommand: true` ayarını yalnızca güvenilir paket yöneticisi yolları için gerektiğinde, `trustedDirs` ile birlikte (örneğin `["/opt/homebrew"]`) kullanın. Windows'ta bir sağlayıcı yolu için ACL doğrulaması kullanılamıyorsa OpenClaw kapalı güvenlik yaklaşımıyla başarısız olur; yalnızca güvenilir yollarda, yol güvenliği denetimini atlamak için ilgili sağlayıcıda `allowInsecurePath: true` ayarını kullanın.

## Kaydedilmiş bir planı uygulama

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run`, dosyalara yazmadan ön kontrolü doğrular; deneme çalıştırmasında exec SecretRef denetimleri varsayılan olarak atlanır. Yazma modu, `--allow-exec` kullanılmadıkça exec SecretRef'leri/sağlayıcıları içeren planları reddeder. Her iki modda da exec sağlayıcı denetimlerini/yürütmesini etkinleştirmek için `--allow-exec` kullanın.

`apply` şunları güncelleyebilir:

- `openclaw.json` (SecretRef hedefleri + sağlayıcı eklemeleri/güncellemeleri/silmeleri)
- `auth-profiles.json` (sağlayıcı hedefi temizleme)
- eski `auth.json` kalıntıları
- değerleri taşınmış olan `~/.openclaw/.env` dosyasındaki bilinen gizli bilgi anahtarları

Plan sözleşmesi ayrıntıları (izin verilen hedef yolları, doğrulama kuralları, hata semantiği): [Gizli Bilgileri Uygulama Planı Sözleşmesi](/tr/gateway/secrets-plan-contract).

### Neden geri alma yedekleri yok?

`secrets apply`, eski düz metin değerlerini içeren geri alma yedeklerini bilinçli olarak yazmaz. Güvenlik; sıkı ön kontrol, yaklaşık atomik uygulama ve hata durumunda bellekte en iyi çabayla geri yükleme sayesinde sağlanır.

## Örnek

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

`audit --check` hâlâ düz metin bulguları bildiriyorsa kalan bildirilmiş hedef yollarını güncelleyin ve denetimi yeniden çalıştırın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Gizli bilgi yönetimi](/tr/gateway/secrets)
- [Vault SecretRef'leri](/plugins/vault)
