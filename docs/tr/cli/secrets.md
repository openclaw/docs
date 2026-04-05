---
read_when:
    - Çalışma zamanında gizli veri referanslarını yeniden çözümleme
    - Düz metin kalıntılarını ve çözümlenmemiş referansları denetleme
    - SecretRef'leri yapılandırma ve tek yönlü temizleme değişikliklerini uygulama
summary: '`openclaw secrets` için CLI başvurusu (yeniden yükleme, denetim, yapılandırma, uygulama)'
title: gizli veriler
x-i18n:
    generated_at: "2026-04-05T13:49:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: f436ba089d752edb766c0a3ce746ee6bca1097b22c9b30e3d9715cb0bb50bf47
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

SecretRef'leri yönetmek ve etkin çalışma zamanı anlık görüntüsünü sağlıklı tutmak için `openclaw secrets` kullanın.

Komut rolleri:

- `reload`: referansları yeniden çözen ve çalışma zamanı anlık görüntüsünü yalnızca tam başarı durumunda değiştiren gateway RPC'si (`secrets.reload`) (yapılandırma yazımı yok).
- `audit`: düz metin, çözümlenmemiş referanslar ve öncelik kayması açısından yapılandırma/auth/oluşturulan model depolarını ve eski kalıntıları salt okunur olarak tarar (`--allow-exec` ayarlanmadığı sürece exec referansları atlanır).
- `configure`: sağlayıcı kurulumu, hedef eşleme ve ön kontrol için etkileşimli planlayıcı (TTY gerekir).
- `apply`: kaydedilmiş bir planı yürütür (yalnızca doğrulama için `--dry-run`; dry-run varsayılan olarak exec denetimlerini atlar ve yazma modu `--allow-exec` ayarlanmadığı sürece exec içeren planları reddeder), ardından hedeflenen düz metin kalıntılarını temizler.

Önerilen operatör döngüsü:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Planınız `exec` SecretRef'leri/sağlayıcıları içeriyorsa, hem dry-run hem de yazma apply komutlarında `--allow-exec` geçirin.

CI/gate'ler için çıkış kodu notu:

- `audit --check`, bulgu varsa `1` döndürür.
- çözümlenmemiş referanslar `2` döndürür.

İlgili:

- Gizli veriler kılavuzu: [Secrets Management](/gateway/secrets)
- Kimlik bilgisi yüzeyi: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Güvenlik kılavuzu: [Security](/gateway/security)

## Çalışma zamanı anlık görüntüsünü yeniden yükle

Gizli veri referanslarını yeniden çözümleyin ve çalışma zamanı anlık görüntüsünü atomik olarak değiştirin.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Notlar:

- Gateway RPC yöntemi `secrets.reload` kullanılır.
- Çözümleme başarısız olursa gateway son bilinen iyi anlık görüntüyü korur ve hata döndürür (kısmi etkinleştirme yok).
- JSON yanıtı `warningCount` içerir.

Seçenekler:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Denetim

Şunlar için OpenClaw durumunu tarayın:

- düz metin gizli veri depolama
- çözümlenmemiş referanslar
- öncelik kayması (`auth-profiles.json` kimlik bilgilerinin `openclaw.json` referanslarını gölgelemesi)
- oluşturulan `agents/*/agent/models.json` kalıntıları (sağlayıcı `apiKey` değerleri ve hassas sağlayıcı üstbilgileri)
- eski kalıntılar (eski auth deposu girdileri, OAuth hatırlatıcıları)

Üstbilgi kalıntısı notu:

- Hassas sağlayıcı üstbilgisi algılama, ad buluşsal yöntemine dayanır (yaygın auth/kimlik bilgisi üstbilgisi adları ve `authorization`, `x-api-key`, `token`, `secret`, `password` ve `credential` gibi parçalar).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Çıkış davranışı:

- `--check`, bulgu varsa sıfır olmayan kodla çıkar.
- çözümlenmemiş referanslar daha yüksek öncelikli sıfır olmayan bir kodla çıkar.

Rapor biçimi öne çıkanları:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- bulgu kodları:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Yapılandırma (etkileşimli yardımcı)

Sağlayıcı ve SecretRef değişikliklerini etkileşimli olarak oluşturun, ön kontrol çalıştırın ve isteğe bağlı olarak uygulayın:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Akış:

- Önce sağlayıcı kurulumu (`secrets.providers` takma adları için `add/edit/remove`).
- Sonra kimlik bilgisi eşleme (alanları seçin ve `{source, provider, id}` referanslarını atayın).
- En sonda ön kontrol ve isteğe bağlı uygulama.

Bayraklar:

- `--providers-only`: yalnızca `secrets.providers` yapılandırın, kimlik bilgisi eşlemeyi atlayın.
- `--skip-provider-setup`: sağlayıcı kurulumunu atlayın ve kimlik bilgilerini mevcut sağlayıcılara eşleyin.
- `--agent <id>`: `auth-profiles.json` hedef keşfini ve yazımlarını tek bir aracı deposuyla sınırlar.
- `--allow-exec`: ön kontrol/uygulama sırasında exec SecretRef denetimlerine izin verir (sağlayıcı komutlarını çalıştırabilir).

Notlar:

- Etkileşimli bir TTY gerektirir.
- `--providers-only` ile `--skip-provider-setup` birlikte kullanılamaz.
- `configure`, seçilen aracı kapsamı için `openclaw.json` içindeki gizli veri taşıyan alanları ve `auth-profiles.json` dosyasını hedefler.
- `configure`, seçici akışı içinde doğrudan yeni `auth-profiles.json` eşlemeleri oluşturmayı destekler.
- Kanonik desteklenen yüzey: [SecretRef Credential Surface](/reference/secretref-credential-surface).
- Uygulamadan önce ön kontrol çözümlemesi yapar.
- Ön kontrol/uygulama exec referansları içeriyorsa, her iki adımda da `--allow-exec` ayarlı kalmalıdır.
- Oluşturulan planlar varsayılan olarak temizleme seçenekleriyle gelir (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` hepsi etkin).
- Apply yolu, temizlenen düz metin değerler için tek yönlüdür.
- `--apply` olmadan bile CLI ön kontrolden sonra `Apply this plan now?` istemini gösterir.
- `--apply` ile (`--yes` olmadan), CLI geri alınamaz ek bir onay ister.
- `--json`, planı + ön kontrol raporunu yazdırır, ancak komut yine de etkileşimli bir TTY gerektirir.

Exec sağlayıcı güvenliği notu:

- Homebrew kurulumları genellikle `/opt/homebrew/bin/*` altında sembolik bağlantılı ikili dosyalar sunar.
- `allowSymlinkCommand: true` seçeneğini yalnızca güvenilen paket yöneticisi yolları için gerektiğinde ayarlayın ve bunu `trustedDirs` ile birlikte kullanın (örneğin `["/opt/homebrew"]`).
- Windows'ta, bir sağlayıcı yolu için ACL doğrulaması kullanılamıyorsa OpenClaw kapalı başarısız olur. Yalnızca güvenilen yollar için, yol güvenlik denetimlerini atlamak üzere o sağlayıcıda `allowInsecurePath: true` ayarlayın.

## Kaydedilmiş bir planı uygula

Daha önce oluşturulmuş bir planı uygulayın veya ön kontrolünü yapın:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Exec davranışı:

- `--dry-run`, dosya yazmadan ön kontrolü doğrular.
- exec SecretRef denetimleri dry-run sırasında varsayılan olarak atlanır.
- yazma modu, `--allow-exec` ayarlanmadığı sürece exec SecretRef'leri/sağlayıcıları içeren planları reddeder.
- Her iki modda da exec sağlayıcı denetimlerine/yürütmesine açıkça katılmak için `--allow-exec` kullanın.

Plan sözleşmesi ayrıntıları (izin verilen hedef yolları, doğrulama kuralları ve başarısızlık anlamları):

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

`apply` şunları güncelleyebilir:

- `openclaw.json` (SecretRef hedefleri + sağlayıcı upsert/silme)
- `auth-profiles.json` (sağlayıcı hedefi temizleme)
- eski `auth.json` kalıntıları
- değerleri taşınmış olan, `~/.openclaw/.env` içindeki bilinen gizli anahtarlar

## Neden geri alma yedekleri yok

`secrets apply`, eski düz metin değerleri içeren geri alma yedeklerini kasıtlı olarak yazmaz.

Güvenlik, katı ön kontrol + başarısızlık durumunda en iyi çabayla bellek içi geri yükleme ile atomik benzeri uygulamadan gelir.

## Örnek

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

`audit --check` hâlâ düz metin bulguları bildiriyorsa, kalan raporlanan hedef yollarını güncelleyin ve denetimi yeniden çalıştırın.
