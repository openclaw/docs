---
read_when:
    - Sağlayıcı kimlik bilgileri ve `auth-profiles.json` başvuruları için SecretRef yapılandırma
    - Üretimde gizli bilgi yeniden yüklemeyi, denetlemeyi, yapılandırmayı ve uygulamayı güvenli şekilde işletme
    - Başlangıçta hızlı başarısız olmayı, etkin olmayan yüzey filtrelemeyi ve son bilinen iyi durum davranışını anlama
summary: 'Gizli bilgiler yönetimi: SecretRef sözleşmesi, çalışma zamanı anlık görüntü davranışı ve güvenli tek yönlü temizleme'
title: Gizli Bilgiler Yönetimi
x-i18n:
    generated_at: "2026-04-05T13:55:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: b91778cb7801fe24f050c15c0a9dd708dda91cb1ce86096e6bae57ebb6e0d41d
    source_path: gateway/secrets.md
    workflow: 15
---

# Gizli bilgiler yönetimi

OpenClaw, desteklenen kimlik bilgilerinin yapılandırmada düz metin olarak saklanmasını gerektirmemesi için eklemeli SecretRef desteği sunar.

Düz metin hâlâ çalışır. SecretRef’ler kimlik bilgisi başına isteğe bağlıdır.

## Hedefler ve çalışma zamanı modeli

Gizli bilgiler, bellek içi bir çalışma zamanı anlık görüntüsüne çözümlenir.

- Çözümleme istek yolunda tembel değil, etkinleştirme sırasında eager olarak yapılır.
- Etkin olarak kullanılan bir SecretRef çözümlenemezse başlangıç hızlı şekilde başarısız olur.
- Yeniden yükleme atomik değişim kullanır: ya tam başarı ya da son bilinen iyi anlık görüntü korunur.
- SecretRef ilke ihlalleri (örneğin SecretRef girdisiyle birleştirilmiş OAuth modlu auth profilleri), çalışma zamanı değişiminden önce etkinleştirmeyi başarısız kılar.
- Çalışma zamanı istekleri yalnızca etkin bellek içi anlık görüntüden okur.
- İlk başarılı yapılandırma etkinleştirmesi/yüklemesinden sonra, başarılı bir yeniden yükleme onu değiştirene kadar çalışma zamanı kod yolları bu etkin bellek içi anlık görüntüden okumaya devam eder.
- Giden teslim yolları da bu etkin anlık görüntüden okur (örneğin Discord yanıt/iş parçacığı teslimi ve Telegram eylem gönderimleri); her gönderimde SecretRef’leri yeniden çözümlemezler.

Bu yaklaşım, gizli bilgi sağlayıcısı kesintilerini sıcak istek yollarından uzak tutar.

## Etkin yüzey filtreleme

SecretRef’ler yalnızca fiilen etkin yüzeylerde doğrulanır.

- Etkin yüzeyler: çözümlenmemiş başvurular başlangıcı/yeniden yüklemeyi engeller.
- Etkin olmayan yüzeyler: çözümlenmemiş başvurular başlangıcı/yeniden yüklemeyi engellemez.
- Etkin olmayan başvurular, `SECRETS_REF_IGNORED_INACTIVE_SURFACE` koduyla ölümcül olmayan tanılamalar üretir.

Etkin olmayan yüzey örnekleri:

- Devre dışı kanal/hesap girdileri.
- Hiçbir etkin hesabın devralmadığı üst düzey kanal kimlik bilgileri.
- Devre dışı araç/özellik yüzeyleri.
- `tools.web.search.provider` tarafından seçilmeyen web arama sağlayıcısına özgü anahtarlar.
  Otomatik modda (sağlayıcı ayarlı değilse), birisi çözümlenene kadar anahtarlar sağlayıcı otomatik algılaması için öncelik sırasına göre değerlendirilir.
  Seçimden sonra, seçilmeyen sağlayıcı anahtarları seçilene kadar etkin olmayan kabul edilir.
- Sandbox SSH kimlik doğrulama malzemesi (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData` ve agent başına geçersiz kılmalar) yalnızca
  varsayılan agent veya etkin bir agent için etkili sandbox backend `ssh` olduğunda etkindir.
- `gateway.remote.token` / `gateway.remote.password` SecretRef’leri şu koşullardan biri doğruysa etkindir:
  - `gateway.mode=remote`
  - `gateway.remote.url` yapılandırılmış
  - `gateway.tailscale.mode` değeri `serve` veya `funnel`
  - Yerel modda, bu uzak yüzeyler olmadan:
    - `gateway.remote.token`, token kimlik doğrulaması baskın olabiliyorsa ve hiçbir env/auth token yapılandırılmamışsa etkindir.
    - `gateway.remote.password`, yalnızca parola kimlik doğrulaması baskın olabiliyorsa ve hiçbir env/auth parola yapılandırılmamışsa etkindir.
- `OPENCLAW_GATEWAY_TOKEN` ayarlıysa, `gateway.auth.token` SecretRef başlangıç kimlik doğrulaması çözümlemesi için etkin değildir; çünkü bu çalışma zamanında env token girdisi önceliklidir.

## Gateway kimlik doğrulama yüzeyi tanılamaları

`gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` veya `gateway.remote.password` üzerinde bir SecretRef yapılandırıldığında, gateway başlangıcı/yeniden yükleme
yüzey durumunu açıkça günlüğe kaydeder:

- `active`: SecretRef etkili kimlik doğrulama yüzeyinin bir parçasıdır ve çözümlenmelidir.
- `inactive`: SecretRef bu çalışma zamanı için yok sayılır; çünkü başka bir kimlik doğrulama yüzeyi baskındır veya
  uzak kimlik doğrulaması devre dışıdır/etkin değildir.

Bu girdiler `SECRETS_GATEWAY_AUTH_SURFACE` ile günlüğe kaydedilir ve
etkin yüzey ilkesinin kullandığı gerekçeyi içerir; böylece bir kimlik bilgisinin neden etkin veya etkin olmayan kabul edildiğini görebilirsiniz.

## Onboarding başvuru ön kontrolü

Onboarding etkileşimli modda çalıştığında ve SecretRef depolamayı seçtiğinizde, OpenClaw kaydetmeden önce ön doğrulama yapar:

- Env başvuruları: env var adını doğrular ve kurulum sırasında boş olmayan bir değerin görünür olduğunu onaylar.
- Sağlayıcı başvuruları (`file` veya `exec`): sağlayıcı seçimini doğrular, `id`’yi çözümler ve çözümlenen değer türünü denetler.
- Hızlı başlangıç yeniden kullanım yolu: `gateway.auth.token` zaten bir SecretRef ise, onboarding bunu prob/dashboard bootstrap öncesinde (`env`, `file` ve `exec` başvuruları için) aynı hızlı başarısızlık kapısı ile çözümler.

Doğrulama başarısız olursa, onboarding hatayı gösterir ve yeniden denemenize izin verir.

## SecretRef sözleşmesi

Her yerde tek bir nesne şekli kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

Doğrulama:

- `provider`, `^[a-z][a-z0-9_-]{0,63}$` ile eşleşmelidir
- `id`, `^[A-Z][A-Z0-9_]{0,127}$` ile eşleşmelidir

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Doğrulama:

- `provider`, `^[a-z][a-z0-9_-]{0,63}$` ile eşleşmelidir
- `id`, mutlak bir JSON pointer olmalıdır (`/...`)
- Bölümlerde RFC6901 escape kullanımı: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Doğrulama:

- `provider`, `^[a-z][a-z0-9_-]{0,63}$` ile eşleşmelidir
- `id`, `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` ile eşleşmelidir
- `id`, eğik çizgiyle ayrılmış yol bölümleri olarak `.` veya `..` içermemelidir (örneğin `a/../b` reddedilir)

## Sağlayıcı yapılandırması

Sağlayıcıları `secrets.providers` altında tanımlayın:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // veya "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Env sağlayıcısı

- `allowlist` üzerinden isteğe bağlı izin listesi.
- Eksik/boş env değerleri çözümlemeyi başarısız kılar.

### File sağlayıcısı

- `path` üzerinden yerel dosyayı okur.
- `mode: "json"`, JSON nesne yükü bekler ve `id`’yi pointer olarak çözümler.
- `mode: "singleValue"`, başvuru kimliği olarak `"value"` bekler ve dosya içeriğini döndürür.
- Yol, sahiplik/izin denetimlerinden geçmelidir.
- Windows fail-closed notu: Bir yol için ACL doğrulaması mevcut değilse çözümleme başarısız olur. Yalnızca güvenilir yollar için, yol güvenlik denetimlerini atlamak amacıyla o sağlayıcıda `allowInsecurePath: true` ayarlayın.

### Exec sağlayıcısı

- Yapılandırılmış mutlak ikili dosya yolunu shell olmadan çalıştırır.
- Varsayılan olarak `command`, normal bir dosyaya işaret etmelidir (symlink değil).
- Symlink komut yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın (örneğin Homebrew shim’leri).
- OpenClaw çözümlenen hedef yolu doğrular.
- Paket yöneticisi yolları için `allowSymlinkCommand` ile birlikte `trustedDirs` kullanın (örneğin `["/opt/homebrew"]`).
- Zaman aşımını, çıktı yok zaman aşımını, çıktı bayt sınırlarını, env izin listesini ve güvenilir dizinleri destekler.
- Windows fail-closed notu: Komut yolu için ACL doğrulaması mevcut değilse çözümleme başarısız olur. Yalnızca güvenilir yollar için, yol güvenlik denetimlerini atlamak amacıyla o sağlayıcıda `allowInsecurePath: true` ayarlayın.

İstek yükü (`stdin`):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Yanıt yükü (`stdout`):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

İsteğe bağlı id başına hatalar:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Exec entegrasyon örnekleri

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // Homebrew symlink'li ikili dosyaları için gerekli
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // Homebrew symlink'li ikili dosyaları için gerekli
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // Homebrew symlink'li ikili dosyaları için gerekli
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## MCP sunucusu ortam değişkenleri

`plugins.entries.acpx.config.mcpServers` üzerinden yapılandırılan MCP sunucusu env değişkenleri SecretInput destekler. Bu, API anahtarlarını ve token’ları düz metin yapılandırma dışında tutar:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Düz metin dize değerleri hâlâ çalışır. `${MCP_SERVER_API_KEY}` gibi env-template başvuruları ve SecretRef nesneleri, MCP sunucu süreci başlatılmadan önce gateway etkinleştirmesi sırasında çözümlenir. Diğer SecretRef yüzeylerinde olduğu gibi, çözümlenmemiş başvurular yalnızca `acpx` plugin’i fiilen etkin olduğunda etkinleştirmeyi engeller.

## Sandbox SSH kimlik doğrulama malzemesi

Çekirdek `ssh` sandbox backend’i, SSH kimlik doğrulama malzemesi için de SecretRef destekler:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Çalışma zamanı davranışı:

- OpenClaw bu başvuruları her SSH çağrısında tembel olarak değil, sandbox etkinleştirmesi sırasında çözümler.
- Çözümlenen değerler kısıtlayıcı izinlerle geçici dosyalara yazılır ve oluşturulan SSH yapılandırmasında kullanılır.
- Etkili sandbox backend `ssh` değilse, bu başvurular etkin olmayan durumda kalır ve başlangıcı engellemez.

## Desteklenen kimlik bilgisi yüzeyi

Kanonik desteklenen ve desteklenmeyen kimlik bilgileri şurada listelenmiştir:

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

Çalışma zamanında üretilen veya dönen kimlik bilgileri ve OAuth yenileme malzemesi, salt okunur SecretRef çözümlemesine bilerek dahil edilmez.

## Gerekli davranış ve öncelik

- Başvuru içermeyen alan: değişmez.
- Başvuru içeren alan: etkin yüzeylerde etkinleştirme sırasında gereklidir.
- Hem düz metin hem başvuru varsa, desteklenen öncelik yollarında başvuru önceliklidir.
- `__OPENCLAW_REDACTED__` redaksiyon işaretçisi, dahili yapılandırma redaksiyonu/geri yükleme için ayrılmıştır ve gönderilen gerçek yapılandırma verisi olarak reddedilir.

Uyarı ve denetim sinyalleri:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (çalışma zamanı uyarısı)
- `REF_SHADOWED` (`auth-profiles.json` kimlik bilgileri `openclaw.json` başvurularına göre öncelik kazandığında denetim bulgusu)

Google Chat uyumluluk davranışı:

- `serviceAccountRef`, düz metin `serviceAccount` değerine göre önceliklidir.
- Kardeş başvuru ayarlanmışsa düz metin değer yok sayılır.

## Etkinleştirme tetikleyicileri

Gizli bilgi etkinleştirmesi şu durumlarda çalışır:

- Başlangıçta (ön kontrol artı son etkinleştirme)
- Yapılandırma yeniden yükleme hot-apply yolunda
- Yapılandırma yeniden yükleme restart-check yolunda
- `secrets.reload` ile manuel yeniden yüklemede
- Diske yazmadan önce gönderilen yapılandırma yükü içindeki etkin yüzey SecretRef çözümlenebilirliği için Gateway yapılandırma yazma RPC ön kontrolünde (`config.set` / `config.apply` / `config.patch`)

Etkinleştirme sözleşmesi:

- Başarı, anlık görüntüyü atomik olarak değiştirir.
- Başlangıç başarısızlığı gateway başlangıcını durdurur.
- Çalışma zamanı yeniden yükleme başarısızlığı son bilinen iyi anlık görüntüyü korur.
- Write-RPC ön kontrol başarısızlığı gönderilen yapılandırmayı reddeder ve hem disk yapılandırmasını hem etkin çalışma zamanı anlık görüntüsünü değiştirmeden bırakır.
- Giden bir yardımcı/araç çağrısına açık bir çağrı başına kanal token’ı sağlamak SecretRef etkinleştirmesini tetiklemez; etkinleştirme noktaları başlangıç, yeniden yükleme ve açık `secrets.reload` olarak kalır.

## Bozulmuş ve toparlanmış sinyalleri

Sağlıklı bir durumdan sonra yeniden yükleme zamanındaki etkinleştirme başarısız olursa, OpenClaw bozulmuş gizli bilgi durumuna geçer.

Tek seferlik sistem olayı ve günlük kodları:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Davranış:

- Bozulmuş: çalışma zamanı son bilinen iyi anlık görüntüyü korur.
- Toparlanmış: sonraki başarılı etkinleştirmeden sonra bir kez yayılır.
- Zaten bozulmuş durumdayken tekrarlanan başarısızlıklar uyarı olarak günlüğe yazılır ancak olay spam’i oluşturmaz.
- Başlangıçtaki hızlı başarısızlık bozulmuş olayları üretmez; çünkü çalışma zamanı hiç etkin olmadı.

## Komut yolu çözümlemesi

Komut yolları, gateway anlık görüntü RPC’si üzerinden desteklenen SecretRef çözümlemesine katılabilir.

İki geniş davranış vardır:

- Katı komut yolları (örneğin `openclaw memory` uzak bellek yolları ve uzak paylaşılan gizli başvurulara ihtiyaç duyduğunda `openclaw qr --remote`) etkin anlık görüntüden okur ve gerekli bir SecretRef kullanılamıyorsa hızlı şekilde başarısız olur.
- Salt okunur komut yolları (örneğin `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` ve salt okunur doctor/config repair akışları) da etkin anlık görüntüyü tercih eder, ancak o komut yolunda hedeflenen bir SecretRef kullanılamıyorsa durdurmak yerine bozulur.

Salt okunur davranış:

- Gateway çalışıyorsa, bu komutlar önce etkin anlık görüntüden okur.
- Gateway çözümlemesi eksikse veya gateway kullanılamıyorsa, belirli komut yüzeyi için hedefli bir yerel geri dönüş denerler.
- Hedeflenen bir SecretRef hâlâ kullanılamıyorsa, komut “configured but unavailable in this command path” gibi açık tanılamalarla bozulmuş salt okunur çıktı üretmeye devam eder.
- Bu bozulmuş davranış yalnızca komuta özeldir. Çalışma zamanı başlangıcını, yeniden yüklemeyi veya gönderim/kimlik doğrulama yollarını zayıflatmaz.

Diğer notlar:

- Arka uç gizli bilgi döndürmesinden sonra anlık görüntü yenileme `openclaw secrets reload` ile yapılır.
- Bu komut yollarının kullandığı Gateway RPC yöntemi: `secrets.resolve`.

## Denetim ve yapılandırma akışı

Varsayılan operatör akışı:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Bulgular şunları içerir:

- bekleyen düz metin değerler (`openclaw.json`, `auth-profiles.json`, `.env` ve oluşturulan `agents/*/agent/models.json`)
- oluşturulan `models.json` girdilerindeki düz metin hassas sağlayıcı başlığı kalıntıları
- çözümlenmemiş başvurular
- öncelik gölgelemesi (`auth-profiles.json` değerinin `openclaw.json` başvurularına göre öncelik alması)
- legacy kalıntılar (`auth.json`, OAuth hatırlatmaları)

Exec notu:

- Varsayılan olarak denetim, komut yan etkilerini önlemek için exec SecretRef çözümlenebilirlik denetimlerini atlar.
- Denetim sırasında exec sağlayıcılarını çalıştırmak için `openclaw secrets audit --allow-exec` kullanın.

Başlık kalıntısı notu:

- Hassas sağlayıcı başlığı algılaması, ad sezgisine dayanır (yaygın kimlik doğrulama/kimlik bilgisi başlık adları ve `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` gibi parçalar).

### `secrets configure`

Şunları yapan etkileşimli yardımcı:

- önce `secrets.providers` yapılandırır (`env`/`file`/`exec`, ekleme/düzenleme/kaldırma)
- tek bir agent kapsamı için `openclaw.json` içindeki desteklenen gizli bilgi taşıyan alanları ve `auth-profiles.json` alanlarını seçmenize izin verir
- hedef seçicide doğrudan yeni bir `auth-profiles.json` eşlemesi oluşturabilir
- SecretRef ayrıntılarını alır (`source`, `provider`, `id`)
- ön çözümleme yapar
- hemen uygulayabilir

Exec notu:

- `--allow-exec` ayarlı değilse ön kontrol exec SecretRef denetimlerini atlar.
- `configure --apply` üzerinden doğrudan uygularsanız ve plan exec başvuruları/sağlayıcıları içeriyorsa, uygulama adımı için de `--allow-exec` ayarlı kalsın.

Yararlı modlar:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

`configure` apply varsayılanları:

- hedef sağlayıcılar için `auth-profiles.json` içindeki eşleşen statik kimlik bilgilerini temizler
- `auth.json` içindeki legacy statik `api_key` girdilerini temizler
- `<config-dir>/.env` içindeki eşleşen bilinen gizli satırları temizler

### `secrets apply`

Kaydedilmiş bir planı uygulayın:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Exec notu:

- `--allow-exec` ayarlı değilse dry-run exec denetimlerini atlar.
- Yazma modu, `--allow-exec` ayarlı değilse exec SecretRef/sağlayıcı içeren planları reddeder.

Katı hedef/yol sözleşmesi ayrıntıları ve tam ret kuralları için bkz.:

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

## Tek yönlü güvenlik ilkesi

OpenClaw, geçmiş düz metin gizli bilgi değerlerini içeren geri alma yedekleri yazmaz.

Güvenlik modeli:

- yazma modundan önce ön kontrol başarılı olmalıdır
- çalışma zamanı etkinleştirmesi commit öncesinde doğrulanır
- apply, dosyaları atomik dosya değiştirme ve başarısızlıkta best-effort geri yükleme ile günceller

## Legacy kimlik doğrulama uyumluluk notları

Statik kimlik bilgileri için çalışma zamanı artık düz metin legacy kimlik doğrulama depolamasına bağlı değildir.

- Çalışma zamanı kimlik bilgisi kaynağı, çözümlenmiş bellek içi anlık görüntüdür.
- Legacy statik `api_key` girdileri keşfedildiğinde temizlenir.
- OAuth ile ilgili uyumluluk davranışı ayrı kalır.

## Web UI notu

Bazı SecretInput union’ları, form moduna göre ham düzenleyici modunda daha kolay yapılandırılır.

## İlgili belgeler

- CLI komutları: [secrets](/cli/secrets)
- Plan sözleşmesi ayrıntıları: [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)
- Kimlik bilgisi yüzeyi: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Kimlik doğrulama kurulumu: [Authentication](/gateway/authentication)
- Güvenlik duruşu: [Security](/gateway/security)
- Ortam önceliği: [Environment Variables](/help/environment)
