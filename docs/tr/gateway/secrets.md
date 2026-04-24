---
read_when:
    - Sağlayıcı kimlik bilgileri ve `auth-profiles.json` ref'leri için SecretRef yapılandırma
    - Gizli bilgi yeniden yükleme, denetim, yapılandırma ve uygulamayı üretimde güvenli biçimde işletme
    - Başlangıçta hızlı başarısız olma, etkin olmayan yüzey filtreleme ve son bilinen iyi davranışını anlama
summary: 'Gizli bilgi yönetimi: SecretRef sözleşmesi, çalışma zamanı anlık görüntü davranışı ve güvenli tek yönlü temizleme'
title: Gizli bilgi yönetimi
x-i18n:
    generated_at: "2026-04-24T09:11:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw, desteklenen kimlik bilgilerinin yapılandırmada düz metin olarak saklanmasını gerektirmemek için eklemeli SecretRef desteği sunar.

Düz metin hâlâ çalışır. SecretRef'ler kimlik bilgisi başına isteğe bağlı olarak etkinleştirilir.

## Hedefler ve çalışma zamanı modeli

Gizli bilgiler, bellek içi bir çalışma zamanı anlık görüntüsüne çözümlenir.

- Çözümleme istek yollarında tembel değil, etkinleştirme sırasında eager yapılır.
- Etkin olarak aktif bir SecretRef çözümlenemediğinde başlangıç hızlıca başarısız olur.
- Yeniden yükleme atomik değişim kullanır: ya tam başarı olur ya da son bilinen iyi anlık görüntü korunur.
- SecretRef politika ihlalleri (örneğin SecretRef girdisiyle birleştirilmiş OAuth modu auth profile'ları) çalışma zamanı değişiminden önce etkinleştirmeyi başarısız kılar.
- Çalışma zamanı istekleri yalnızca etkin bellek içi anlık görüntüden okur.
- İlk başarılı yapılandırma etkinleştirme/yüklemeden sonra çalışma zamanı kod yolları, başarılı bir yeniden yükleme değişim yapana kadar bu etkin bellek içi anlık görüntüden okumaya devam eder.
- Giden teslim yolları da bu etkin anlık görüntüden okur (örneğin Discord yanıt/konu teslimi ve Telegram eylem gönderimleri); her gönderimde SecretRef'leri yeniden çözümlemezler.

Bu, gizli bilgi sağlayıcısı kesintilerini sıcak istek yollarının dışında tutar.

## Etkin yüzey filtreleme

SecretRef'ler yalnızca etkin olarak aktif yüzeylerde doğrulanır.

- Etkin yüzeyler: çözümlenmemiş ref'ler başlangıcı/yeniden yüklemeyi engeller.
- Etkin olmayan yüzeyler: çözümlenmemiş ref'ler başlangıcı/yeniden yüklemeyi engellemez.
- Etkin olmayan ref'ler `SECRETS_REF_IGNORED_INACTIVE_SURFACE` kodlu ölümcül olmayan tanılamalar yayar.

Etkin olmayan yüzey örnekleri:

- Devre dışı bırakılmış kanal/hesap girdileri.
- Etkinleştirilmiş hiçbir hesabın devralmadığı üst düzey kanal kimlik bilgileri.
- Devre dışı bırakılmış araç/özellik yüzeyleri.
- `tools.web.search.provider` tarafından seçilmeyen Web araması sağlayıcıya özgü anahtarları.
  Otomatik modda (sağlayıcı ayarlı değilken), anahtarlar biri çözülene kadar sağlayıcı otomatik algılama için öncelik sırasına göre danışılır.
  Seçimden sonra seçilmeyen sağlayıcı anahtarları seçilene kadar etkin olmayan sayılır.
- Sandbox SSH kimlik doğrulama materyali (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData` ve ajan başına geçersiz kılmalar) yalnızca
  etkin sandbox backend'i varsayılan ajan veya etkin bir ajan için `ssh` olduğunda aktiftir.
- `gateway.remote.token` / `gateway.remote.password` SecretRef'leri şu durumlardan biri doğruysa aktiftir:
  - `gateway.mode=remote`
  - `gateway.remote.url` yapılandırılmış
  - `gateway.tailscale.mode`, `serve` veya `funnel`
  - Bu uzak yüzeyler olmadan yerel modda:
    - `gateway.remote.token`, token kimlik doğrulaması kazanabiliyorsa ve hiçbir env/auth token yapılandırılmamışsa aktiftir.
    - `gateway.remote.password`, yalnızca parola kimlik doğrulaması kazanabiliyorsa ve hiçbir env/auth parola yapılandırılmamışsa aktiftir.
- `OPENCLAW_GATEWAY_TOKEN` ayarlıysa `gateway.auth.token` SecretRef'i, başlangıç kimlik doğrulama çözümlemesi için etkin değildir; çünkü bu çalışma zamanı için env token girdisi kazanır.

## Gateway auth yüzey tanılamaları

Bir SecretRef, `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` veya `gateway.remote.password` üzerine yapılandırıldığında, gateway başlangıcı/yeniden yüklemesi
yüzey durumunu açıkça günlüğe yazar:

- `active`: SecretRef etkin auth yüzeyinin parçasıdır ve çözülmelidir.
- `inactive`: SecretRef bu çalışma zamanı için yok sayılır; çünkü başka bir auth yüzeyi kazanır veya
  uzak auth devre dışıdır/aktif değildir.

Bu girdiler `SECRETS_GATEWAY_AUTH_SURFACE` ile günlüğe yazılır ve
etkin yüzey politikası tarafından kullanılan nedeni içerir; böylece bir kimlik bilgisinin neden etkin veya etkin olmayan kabul edildiğini görebilirsiniz.

## Onboarding referans ön kontrolü

Onboarding etkileşimli modda çalıştığında ve SecretRef depolamayı seçtiğinizde, OpenClaw kaydetmeden önce ön kontrol doğrulaması çalıştırır:

- Env ref'leri: env değişken adını doğrular ve kurulum sırasında boş olmayan bir değerin görünür olduğunu onaylar.
- Sağlayıcı ref'leri (`file` veya `exec`): sağlayıcı seçimini doğrular, `id` çözümler ve çözümlenen değer türünü kontrol eder.
- Hızlı başlangıç yeniden kullanım yolu: `gateway.auth.token` zaten bir SecretRef ise onboarding, bunu yoklama/pano önyüklemesinden önce (`env`, `file` ve `exec` ref'leri için) aynı hızlı başarısız olma geçidiyle çözümler.

Doğrulama başarısız olursa onboarding hatayı gösterir ve yeniden denemenize izin verir.

## SecretRef sözleşmesi

Her yerde tek bir nesne biçimi kullanın:

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
- Segmentlerde RFC6901 kaçışı: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Doğrulama:

- `provider`, `^[a-z][a-z0-9_-]{0,63}$` ile eşleşmelidir
- `id`, `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` ile eşleşmelidir
- `id`, `/` ile ayrılmış yol segmentleri olarak `.` veya `..` içermemelidir (örneğin `a/../b` reddedilir)

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

- `allowlist` ile isteğe bağlı izin listesi.
- Eksik/boş env değerleri çözümlemeyi başarısız kılar.

### Dosya sağlayıcısı

- Yerel dosyayı `path` üzerinden okur.
- `mode: "json"`, JSON nesnesi payload'ı bekler ve `id` değerini pointer olarak çözümler.
- `mode: "singleValue"`, ref kimliği olarak `"value"` bekler ve dosya içeriğini döndürür.
- Yol, sahiplik/izin denetimlerinden geçmelidir.
- Windows fail-closed notu: bir yol için ACL doğrulaması kullanılamıyorsa çözümleme başarısız olur. Yalnızca güvenilir yollar için bu sağlayıcıda `allowInsecurePath: true` ayarlayarak yol güvenlik denetimlerini atlayın.

### Exec sağlayıcısı

- Yapılandırılmış mutlak ikili dosya yolunu shell olmadan çalıştırır.
- Varsayılan olarak `command`, normal bir dosyayı işaret etmelidir (symlink değil).
- Symlink komut yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın (örneğin Homebrew shim'leri). OpenClaw çözümlenen hedef yolu doğrular.
- Paket yöneticisi yolları için `allowSymlinkCommand` seçeneğini `trustedDirs` ile eşleştirin (örneğin `["/opt/homebrew"]`).
- Timeout, çıktı yok timeout'u, çıktı bayt sınırları, env allowlist ve güvenilir dizinleri destekler.
- Windows fail-closed notu: komut yolu için ACL doğrulaması kullanılamıyorsa çözümleme başarısız olur. Yalnızca güvenilir yollar için bu sağlayıcıda `allowInsecurePath: true` ayarlayarak yol güvenlik denetimlerini atlayın.

İstek payload'ı (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Yanıt payload'ı (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

İsteğe bağlı kimlik başına hatalar:

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
        allowSymlinkCommand: true, // Homebrew symlink'li ikili dosyaları için gereklidir
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
        allowSymlinkCommand: true, // Homebrew symlink'li ikili dosyaları için gereklidir
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
        allowSymlinkCommand: true, // Homebrew symlink'li ikili dosyaları için gereklidir
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

## MCP sunucu ortam değişkenleri

`plugins.entries.acpx.config.mcpServers` üzerinden yapılandırılan MCP sunucu env değişkenleri SecretInput destekler. Bu, API anahtarlarını ve token'ları düz metin yapılandırmanın dışında tutar:

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

Düz metin string değerler hâlâ çalışır. `${MCP_SERVER_API_KEY}` gibi env-template ref'leri ve SecretRef nesneleri, MCP sunucu süreci oluşturulmadan önce gateway etkinleştirmesi sırasında çözülür. Diğer SecretRef yüzeylerinde olduğu gibi çözümlenmemiş ref'ler yalnızca `acpx` Plugin'i etkin olarak aktifse etkinleştirmeyi engeller.

## Sandbox SSH kimlik doğrulama materyali

Çekirdek `ssh` sandbox backend'i de SSH kimlik doğrulama materyali için SecretRef destekler:

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

- OpenClaw bu ref'leri her SSH çağrısı sırasında tembelce değil, sandbox etkinleştirmesi sırasında çözümler.
- Çözümlenen değerler kısıtlayıcı izinlere sahip geçici dosyalara yazılır ve oluşturulan SSH yapılandırmasında kullanılır.
- Etkin sandbox backend'i `ssh` değilse bu ref'ler etkin olmayan kalır ve başlangıcı engellemez.

## Desteklenen kimlik bilgisi yüzeyi

Kanonik desteklenen ve desteklenmeyen kimlik bilgileri şurada listelenmiştir:

- [SecretRef Credential Surface](/tr/reference/secretref-credential-surface)

Çalışma zamanında basılan veya dönen kimlik bilgileri ve OAuth yenileme materyali, salt okunur SecretRef çözümlemesinin dışında kasıtlı olarak tutulur.

## Gerekli davranış ve öncelik

- Ref içermeyen alan: değişmeden kalır.
- Ref içeren alan: etkin yüzeylerde etkinleştirme sırasında gereklidir.
- Hem düz metin hem ref varsa desteklenen öncelik yollarında ref önceliklidir.
- `__OPENCLAW_REDACTED__` sansür koruyucusu, dahili yapılandırma sansürleme/geri yükleme için ayrılmıştır ve gönderilen yapılandırma verisi olarak reddedilir.

Uyarı ve denetim sinyalleri:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (çalışma zamanı uyarısı)
- `REF_SHADOWED` (`auth-profiles.json` kimlik bilgilerinin `openclaw.json` ref'lerinden öncelikli olduğu durumlarda denetim bulgusu)

Google Chat uyumluluk davranışı:

- `serviceAccountRef`, düz metin `serviceAccount` üzerinde önceliklidir.
- Kardeş ref ayarlı olduğunda düz metin değer yok sayılır.

## Etkinleştirme tetikleyicileri

Gizli bilgi etkinleştirmesi şu durumlarda çalışır:

- Başlangıçta (ön kontrol artı son etkinleştirme)
- Yapılandırma yeniden yükleme hot-apply yolu
- Yapılandırma yeniden yükleme restart-check yolu
- `secrets.reload` ile manuel yeniden yükleme
- Düzenlemeleri diske yazmadan önce gönderilen yapılandırma payload'ı içinde etkin yüzey SecretRef çözümlenebilirliği için Gateway yapılandırma yazma RPC ön kontrolü (`config.set` / `config.apply` / `config.patch`)

Etkinleştirme sözleşmesi:

- Başarı, anlık görüntüyü atomik olarak değiştirir.
- Başlangıç başarısızlığı gateway başlangıcını iptal eder.
- Çalışma zamanı yeniden yükleme başarısızlığı son bilinen iyi anlık görüntüyü korur.
- Write-RPC ön kontrol başarısızlığı gönderilen yapılandırmayı reddeder ve hem disk yapılandırmasını hem de etkin çalışma zamanı anlık görüntüsünü değiştirmeden bırakır.
- Giden bir yardımcı/araç çağrısına açık bir çağrı başına kanal token'ı vermek SecretRef etkinleştirmesini tetiklemez; etkinleştirme noktaları başlangıç, yeniden yükleme ve açık `secrets.reload` olarak kalır.

## Bozulmuş ve kurtarılmış sinyaller

Yeniden yükleme zamanı etkinleştirmesi sağlıklı bir durumdan sonra başarısız olduğunda OpenClaw bozulmuş gizli bilgi durumuna girer.

Tek seferlik sistem olayı ve günlük kodları:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Davranış:

- Bozulmuş: çalışma zamanı son bilinen iyi anlık görüntüyü korur.
- Kurtarıldı: sonraki başarılı etkinleştirmeden sonra bir kez yayılır.
- Zaten bozulmuş durumdayken tekrarlanan başarısızlıklar uyarı günlüğe yazar ama olay spam'i yapmaz.
- Başlangıçta hızlı başarısız olma bozulmuş olayları yaymaz; çünkü çalışma zamanı hiç etkin hâle gelmemiştir.

## Komut yolu çözümlemesi

Komut yolları, gateway anlık görüntü RPC'si aracılığıyla desteklenen SecretRef çözümlemesine dahil olabilir.

İki geniş davranış vardır:

- Sıkı komut yolları (örneğin `openclaw memory` uzak bellek yolları ve uzak paylaşılan gizli bilgi ref'lerine ihtiyaç duyduğunda `openclaw qr --remote`) etkin anlık görüntüden okur ve gerekli bir SecretRef kullanılamıyorsa hızlıca başarısız olur.
- Salt okunur komut yolları (örneğin `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` ve salt okunur doctor/config repair akışları) da etkin anlık görüntüyü tercih eder, ancak hedeflenen bir SecretRef bu komut yolunda kullanılamadığında iptal olmak yerine bozulmuş moda düşer.

Salt okunur davranış:

- Gateway çalışıyorsa bu komutlar önce etkin anlık görüntüden okur.
- Gateway çözümlemesi eksikse veya gateway kullanılamıyorsa, belirli komut yüzeyi için hedefli yerel fallback denerler.
- Hedeflenen bir SecretRef hâlâ kullanılamıyorsa komut, “yapılandırılmış ama bu komut yolunda kullanılamıyor” gibi açık tanılamalarla bozulmuş salt okunur çıktıyla devam eder.
- Bu bozulmuş davranış yalnızca komuta özeldir. Çalışma zamanı başlangıcını, yeniden yüklemeyi veya gönderim/auth yollarını zayıflatmaz.

Diğer notlar:

- Backend gizli bilgi döndürmesinden sonra anlık görüntü yenilemesi `openclaw secrets reload` ile yapılır.
- Bu komut yollarının kullandığı Gateway RPC yöntemi: `secrets.resolve`.

## Denetim ve yapılandırma iş akışı

Varsayılan operatör akışı:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Bulgular şunları içerir:

- beklemede duran düz metin değerler (`openclaw.json`, `auth-profiles.json`, `.env` ve oluşturulmuş `agents/*/agent/models.json`)
- oluşturulmuş `models.json` girdilerindeki düz metin hassas sağlayıcı header kalıntıları
- çözümlenmemiş ref'ler
- öncelik gölgelemesi (`auth-profiles.json` değerinin `openclaw.json` ref'leri üzerinde öncelikli olması)
- eski kalıntılar (`auth.json`, OAuth hatırlatıcıları)

Exec notu:

- Varsayılan olarak denetim, komut yan etkilerini önlemek için exec SecretRef çözümlenebilirlik kontrollerini atlar.
- Denetim sırasında exec sağlayıcılarını çalıştırmak için `openclaw secrets audit --allow-exec` kullanın.

Header kalıntısı notu:

- Hassas sağlayıcı header tespiti ad sezgisine dayanır (yaygın auth/kimlik bilgisi header adları ve `authorization`, `x-api-key`, `token`, `secret`, `password` ve `credential` gibi parçalar).

### `secrets configure`

Şunları yapan etkileşimli yardımcı:

- önce `secrets.providers` yapılandırır (`env`/`file`/`exec`, ekle/düzenle/kaldır)
- `openclaw.json` içindeki desteklenen gizli bilgi taşıyan alanları ve ayrıca bir ajan kapsamı için `auth-profiles.json` alanlarını seçmenizi sağlar
- hedef seçicide doğrudan yeni bir `auth-profiles.json` eşlemesi oluşturabilir
- SecretRef ayrıntılarını yakalar (`source`, `provider`, `id`)
- ön kontrol çözümlemesi çalıştırır
- hemen uygulayabilir

Exec notu:

- `--allow-exec` ayarlanmadıkça ön kontrol exec SecretRef kontrollerini atlar.
- `configure --apply` içinden doğrudan uygularsanız ve plan exec ref'leri/sağlayıcılar içeriyorsa uygulama adımı için de `--allow-exec` ayarını koruyun.

Yararlı modlar:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

`configure` apply varsayılanları:

- hedeflenen sağlayıcılar için `auth-profiles.json` içinden eşleşen statik kimlik bilgilerini temizler
- `auth.json` içinden eski statik `api_key` girdilerini temizler
- `<config-dir>/.env` içinden eşleşen bilinen gizli bilgi satırlarını temizler

### `secrets apply`

Kaydedilmiş bir planı uygulayın:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Exec notu:

- `--allow-exec` ayarlanmadıkça dry-run exec kontrollerini atlar.
- Yazma modu, `--allow-exec` ayarlı değilse exec SecretRef'ler/sağlayıcılar içeren planları reddeder.

Sıkı hedef/yol sözleşmesi ayrıntıları ve tam reddetme kuralları için bkz.:

- [Secrets Apply Plan Contract](/tr/gateway/secrets-plan-contract)

## Tek yönlü güvenlik politikası

OpenClaw, tarihsel düz metin gizli bilgi değerleri içeren geri alma yedekleri yazmayı kasıtlı olarak yapmaz.

Güvenlik modeli:

- yazma modundan önce ön kontrol başarılı olmalıdır
- çalışma zamanı etkinleştirmesi commit öncesinde doğrulanır
- apply, dosyaları atomik dosya değiştirme ve başarısızlık durumunda best-effort geri yükleme ile günceller

## Eski auth uyumluluk notları

Statik kimlik bilgileri için çalışma zamanı artık düz metin eski auth depolamasına bağlı değildir.

- Çalışma zamanı kimlik bilgisi kaynağı çözümlenmiş bellek içi anlık görüntüdür.
- Eski statik `api_key` girdileri bulunduğunda temizlenir.
- OAuth ile ilgili uyumluluk davranışı ayrı kalır.

## Web UI notu

Bazı SecretInput union'larını form modundan ziyade ham düzenleyici modunda yapılandırmak daha kolaydır.

## İlgili belgeler

- CLI komutları: [secrets](/tr/cli/secrets)
- Plan sözleşmesi ayrıntıları: [Secrets Apply Plan Contract](/tr/gateway/secrets-plan-contract)
- Kimlik bilgisi yüzeyi: [SecretRef Credential Surface](/tr/reference/secretref-credential-surface)
- Auth kurulumu: [Authentication](/tr/gateway/authentication)
- Güvenlik duruşu: [Security](/tr/gateway/security)
- Ortam önceliği: [Environment Variables](/tr/help/environment)
