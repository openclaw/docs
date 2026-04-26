---
read_when:
    - Sağlayıcı kimlik bilgileri ve `auth-profiles.json` başvuruları için SecretRef’leri yapılandırma
    - Gizli bilgi yeniden yükleme, denetim, yapılandırma ve uygulama işlemlerini üretimde güvenli şekilde yürütme
    - Başlangıç fail-fast davranışını, etkin olmayan yüzey filtrelemesini ve son bilinen iyi davranışı anlama
sidebarTitle: Secrets management
summary: 'Gizli bilgi yönetimi: SecretRef sözleşmesi, çalışma zamanı anlık görüntü davranışı ve güvenli tek yönlü temizleme'
title: Gizli bilgi yönetimi
x-i18n:
    generated_at: "2026-04-26T11:31:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8697a8eb15cf6ef9b105e3f12cfdad6205284d4c45f1314cd7aec2e2c81fed1
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw, desteklenen kimlik bilgilerinin config içinde düz metin olarak saklanması gerekmesin diye eklemeli SecretRef’leri destekler.

<Note>
Düz metin hâlâ çalışır. SecretRef’ler kimlik bilgisi başına isteğe bağlıdır.
</Note>

## Hedefler ve çalışma zamanı modeli

Gizli bilgiler bellek içi bir çalışma zamanı anlık görüntüsüne çözülür.

- Çözümleme istek yollarında tembel değil, etkinleştirme sırasında eager yapılır.
- Etkin olarak aktif bir SecretRef çözülemezse başlangıç fail-fast olur.
- Yeniden yükleme atomic swap kullanır: ya tamamen başarılı olur ya da son bilinen iyi anlık görüntü korunur.
- SecretRef ilke ihlalleri (örneğin OAuth modundaki auth profillerinin SecretRef girdisiyle birleştirilmesi), çalışma zamanı swap’inden önce etkinleştirmeyi başarısız kılar.
- Çalışma zamanı istekleri yalnızca etkin bellek içi anlık görüntüden okur.
- İlk başarılı config etkinleştirmesi/yüklemesinden sonra, çalışma zamanı kod yolları başarılı bir yeniden yükleme onu değiştirene kadar bu etkin bellek içi anlık görüntüden okumaya devam eder.
- Giden teslim yolları da bu etkin anlık görüntüden okur (örneğin Discord yanıt/iş parçacığı teslimi ve Telegram eylem gönderimleri); her gönderimde SecretRef’leri yeniden çözmezler.

Bu, gizli bilgi sağlayıcı kesintilerini sıcak istek yollarından uzak tutar.

## Etkin yüzey filtreleme

SecretRef’ler yalnızca fiilen etkin yüzeylerde doğrulanır.

- Etkin yüzeyler: çözülemeyen başvurular başlangıcı/yeniden yüklemeyi engeller.
- Etkin olmayan yüzeyler: çözülemeyen başvurular başlangıcı/yeniden yüklemeyi engellemez.
- Etkin olmayan başvurular `SECRETS_REF_IGNORED_INACTIVE_SURFACE` koduyla ölümcül olmayan tanılar üretir.

<AccordionGroup>
  <Accordion title="Etkin olmayan yüzey örnekleri">
    - Devre dışı kanal/hesap girdileri.
    - Etkin hiçbir hesabın devralmadığı üst düzey kanal kimlik bilgileri.
    - Devre dışı araç/özellik yüzeyleri.
    - `tools.web.search.provider` tarafından seçilmeyen web arama sağlayıcısına özgü anahtarlar. Otomatik modda (sağlayıcı ayarlı değil), anahtarlar sağlayıcı otomatik algılaması için öncelik sırasına göre birisi çözülene kadar incelenir. Seçimden sonra, seçilmeyen sağlayıcı anahtarları seçilene kadar etkin olmayan kabul edilir.
    - Sandbox SSH auth materyali (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` ve aracı başına geçersiz kılmalar), yalnızca etkin sandbox backend varsayılan aracı veya etkin bir aracı için `ssh` olduğunda etkindir.
    - `gateway.remote.token` / `gateway.remote.password` SecretRef’leri şu durumlardan biri doğruysa etkindir:
      - `gateway.mode=remote`
      - `gateway.remote.url` yapılandırılmış
      - `gateway.tailscale.mode` değeri `serve` veya `funnel`
      - Bu uzak yüzeyler olmadan yerel modda:
        - `gateway.remote.token`, token auth kazanabiliyorsa ve env/auth token yapılandırılmamışsa etkindir.
        - `gateway.remote.password`, yalnızca parola auth kazanabiliyorsa ve env/auth password yapılandırılmamışsa etkindir.
    - `OPENCLAW_GATEWAY_TOKEN` ayarlıysa, `gateway.auth.token` SecretRef’i başlangıç auth çözümlemesi için etkin değildir; çünkü env token girdisi bu çalışma zamanında önceliklidir.
  </Accordion>
</AccordionGroup>

## Gateway auth yüzeyi tanıları

Bir SecretRef, `gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` veya `gateway.remote.password` üzerinde yapılandırıldığında, Gateway başlangıcı/yeniden yüklemesi yüzey durumunu açıkça günlüğe kaydeder:

- `active`: SecretRef etkin auth yüzeyinin parçasıdır ve çözülmelidir.
- `inactive`: SecretRef bu çalışma zamanında yok sayılır; çünkü başka bir auth yüzeyi kazanmıştır veya remote auth devre dışıdır/etkin değildir.

Bu girdiler `SECRETS_GATEWAY_AUTH_SURFACE` ile günlüğe kaydedilir ve etkin-yüzey ilkesinin kullandığı nedeni içerir; böylece bir kimlik bilgisinin neden etkin veya etkin olmayan kabul edildiğini görebilirsiniz.

## Onboarding başvuru ön kontrolü

Onboarding etkileşimli modda çalışırken ve SecretRef depolamayı seçtiğinizde, OpenClaw kaydetmeden önce ön kontrol doğrulaması yapar:

- Env başvuruları: env var adını doğrular ve kurulum sırasında boş olmayan bir değerin görünür olduğunu onaylar.
- Sağlayıcı başvuruları (`file` veya `exec`): sağlayıcı seçimini doğrular, `id` değerini çözer ve çözülen değer türünü kontrol eder.
- Quickstart yeniden kullanım yolu: `gateway.auth.token` zaten bir SecretRef ise, onboarding bunu probe/dashboard bootstrap’inden önce (`env`, `file` ve `exec` başvuruları için) aynı fail-fast kapısıyla çözer.

Doğrulama başarısız olursa onboarding hatayı gösterir ve yeniden denemenize izin verir.

## SecretRef sözleşmesi

Her yerde tek bir nesne biçimi kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Doğrulama:

    - `provider`, `^[a-z][a-z0-9_-]{0,63}$` ile eşleşmelidir
    - `id`, `^[A-Z][A-Z0-9_]{0,127}$` ile eşleşmelidir

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    Doğrulama:

    - `provider`, `^[a-z][a-z0-9_-]{0,63}$` ile eşleşmelidir
    - `id`, mutlak bir JSON pointer (`/...`) olmalıdır
    - Segmentlerde RFC6901 escape: `~` => `~0`, `/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    Doğrulama:

    - `provider`, `^[a-z][a-z0-9_-]{0,63}$` ile eşleşmelidir
    - `id`, `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` ile eşleşmelidir
    - `id`, `/` ile ayrılmış yol segmentleri olarak `.` veya `..` içermemelidir (örneğin `a/../b` reddedilir)

  </Tab>
</Tabs>

## Sağlayıcı config’i

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

<AccordionGroup>
  <Accordion title="Env sağlayıcısı">
    - `allowlist` ile isteğe bağlı izin listesi.
    - Eksik/boş env değerleri çözümlemeyi başarısız kılar.
  </Accordion>
  <Accordion title="File sağlayıcısı">
    - `path` içinden yerel dosya okur.
    - `mode: "json"`, JSON nesnesi yükü bekler ve `id` değerini pointer olarak çözer.
    - `mode: "singleValue"`, ref id olarak `"value"` bekler ve dosya içeriğini döndürür.
    - Yol, sahiplik/izin kontrollerinden geçmelidir.
    - Windows fail-closed notu: bir yol için ACL doğrulaması kullanılamıyorsa çözümleme başarısız olur. Yalnızca güvenilen yollar için bu sağlayıcıda `allowInsecurePath: true` ayarlayarak yol güvenlik kontrollerini atlayın.
  </Accordion>
  <Accordion title="Exec sağlayıcısı">
    - Yapılandırılmış mutlak ikili yolunu çalıştırır, shell kullanmaz.
    - Varsayılan olarak `command`, normal bir dosyayı işaret etmelidir (symlink değil).
    - Symlink komut yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın (örneğin Homebrew shim’leri).
    - OpenClaw çözümlenen hedef yolu doğrular.
    - `allowSymlinkCommand` ayarını paket yöneticisi yolları için `trustedDirs` ile eşleştirin (örneğin `["/opt/homebrew"]`).
    - Timeout, no-output timeout, çıktı bayt sınırları, env izin listesi ve trusted dirs destekler.
    - Windows fail-closed notu: komut yolu için ACL doğrulaması kullanılamıyorsa çözümleme başarısız olur. Yalnızca güvenilen yollar için bu sağlayıcıda `allowInsecurePath: true` ayarlayarak yol güvenlik kontrollerini atlayın.

    İstek yükü (`stdin`):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Yanıt yükü (`stdout`):

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    İsteğe bağlı kimlik bazlı hatalar:

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## Exec entegrasyon örnekleri

<AccordionGroup>
  <Accordion title="1Password CLI">
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
  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
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
  </Accordion>
  <Accordion title="sops">
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
  </Accordion>
</AccordionGroup>

## MCP sunucu ortam değişkenleri

`plugins.entries.acpx.config.mcpServers` üzerinden yapılandırılan MCP sunucu env var’ları SecretInput destekler. Bu, API anahtarlarını ve token’ları düz metin config dışında tutar:

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

Düz metin string değerler hâlâ çalışır. `${MCP_SERVER_API_KEY}` gibi env-template başvuruları ve SecretRef nesneleri, MCP sunucu süreci başlatılmadan önce Gateway etkinleştirmesi sırasında çözülür. Diğer SecretRef yüzeylerinde olduğu gibi, çözülemeyen başvurular yalnızca `acpx` Plugin’i fiilen etkin olduğunda etkinleştirmeyi engeller.

## Sandbox SSH auth materyali

Çekirdek `ssh` sandbox backend’i de SSH auth materyali için SecretRef destekler:

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

- OpenClaw bu başvuruları her SSH çağrısı sırasında tembel olarak değil, sandbox etkinleştirmesi sırasında çözer.
- Çözülen değerler kısıtlayıcı izinlerle geçici dosyalara yazılır ve oluşturulan SSH config’inde kullanılır.
- Etkin sandbox backend’i `ssh` değilse, bu başvurular etkin olmayan durumda kalır ve başlangıcı engellemez.

## Desteklenen kimlik bilgisi yüzeyi

Kanonik desteklenen ve desteklenmeyen kimlik bilgileri burada listelenmiştir:

- [SecretRef Credential Surface](/tr/reference/secretref-credential-surface)

<Note>
Çalışma zamanında üretilen veya dönen kimlik bilgileri ile OAuth yenileme materyali, salt okunur SecretRef çözümlemesine bilinçli olarak dahil edilmez.
</Note>

## Gerekli davranış ve öncelik

- Başvuru içermeyen alan: değişmez.
- Başvuru içeren alan: etkin yüzeylerde etkinleştirme sırasında gereklidir.
- Hem düz metin hem de başvuru varsa, desteklenen öncelik yollarında başvuru önceliklidir.
- `__OPENCLAW_REDACTED__` sansürleme işaretçisi dahili config sansürleme/geri yükleme için ayrılmıştır ve doğrudan gönderilen config verisi olarak reddedilir.

Uyarı ve denetim sinyalleri:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (çalışma zamanı uyarısı)
- `REF_SHADOWED` (`auth-profiles.json` kimlik bilgileri `openclaw.json` başvurularından öncelik aldığında denetim bulgusu)

Google Chat uyumluluk davranışı:

- `serviceAccountRef`, düz metin `serviceAccount` üzerinde önceliklidir.
- Kardeş ref ayarlıysa düz metin değer yok sayılır.

## Etkinleştirme tetikleyicileri

Gizli bilgi etkinleştirmesi şu durumlarda çalışır:

- Başlangıç (ön kontrol artı son etkinleştirme)
- Config yeniden yükleme hot-apply yolu
- Config yeniden yükleme restart-check yolu
- `secrets.reload` ile manuel yeniden yükleme
- Düzenlemeler kalıcı hale getirilmeden önce gönderilen config yükü içinde etkin-yüzey SecretRef çözülebilirliği için Gateway config yazma RPC ön kontrolü (`config.set` / `config.apply` / `config.patch`)

Etkinleştirme sözleşmesi:

- Başarı, anlık görüntüyü atomik olarak değiştirir.
- Başlangıç hatası Gateway başlangıcını durdurur.
- Çalışma zamanı yeniden yükleme hatası son bilinen iyi anlık görüntüyü korur.
- Yazma-RPC ön kontrol hatası gönderilen config’i reddeder ve hem disk config’ini hem de etkin çalışma zamanı anlık görüntüsünü değişmeden bırakır.
- Giden bir yardımcı/araç çağrısına açık kanal token’ı vermek SecretRef etkinleştirmesini tetiklemez; etkinleştirme noktaları başlangıç, yeniden yükleme ve açık `secrets.reload` olarak kalır.

## Bozulmuş ve kurtarılmış sinyaller

Sağlıklı bir durumdan sonra yeniden yükleme sırasında etkinleştirme başarısız olursa, OpenClaw bozulmuş gizli bilgi durumuna girer.

Tek seferlik sistem olayı ve günlük kodları:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Davranış:

- Bozulmuş durumda: çalışma zamanı son bilinen iyi anlık görüntüyü korur.
- Kurtarıldı: bir sonraki başarılı etkinleştirmeden sonra bir kez yayımlanır.
- Zaten bozulmuş durumdayken tekrarlanan hatalar uyarı günlüğe yazar ama olay spam’i üretmez.
- Başlangıç fail-fast, çalışma zamanı hiç etkinleşmediği için bozulmuş olayları yayımlamaz.

## Komut yolu çözümlemesi

Komut yolları, Gateway anlık görüntü RPC’si üzerinden desteklenen SecretRef çözümlemesine katılabilir.

İki geniş davranış vardır:

<Tabs>
  <Tab title="Katı komut yolları">
    Örneğin `openclaw memory` uzak bellek yolları ve uzak paylaşılan gizli bilgi başvurularına ihtiyaç duyduğunda `openclaw qr --remote`. Etkin anlık görüntüden okurlar ve gerekli bir SecretRef kullanılamadığında fail-fast olurlar.
  </Tab>
  <Tab title="Salt okunur komut yolları">
    Örneğin `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` ve salt okunur doctor/config repair akışları. Bunlar da etkin anlık görüntüyü tercih eder, ancak bu komut yolunda hedeflenen bir SecretRef kullanılamadığında durdurmak yerine bozulmuş moda geçer.

    Salt okunur davranış:

    - Gateway çalışıyorsa, bu komutlar önce etkin anlık görüntüden okur.
    - Gateway çözümlemesi eksikse veya Gateway kullanılamıyorsa, ilgili komut yüzeyi için hedeflenmiş yerel geri dönüş denerler.
    - Hedeflenen bir SecretRef hâlâ kullanılamıyorsa, komut bozulmuş salt okunur çıktıyla ve “yapılandırılmış ancak bu komut yolunda kullanılamıyor” gibi açık tanılarla devam eder.
    - Bu bozulmuş davranış yalnızca komut yerelidir. Çalışma zamanı başlangıcını, yeniden yüklemeyi veya gönderim/auth yollarını zayıflatmaz.

  </Tab>
</Tabs>

Diğer notlar:

- Arka uç gizli bilgi döndürmesinden sonra anlık görüntü yenileme `openclaw secrets reload` ile yapılır.
- Bu komut yollarının kullandığı Gateway RPC yöntemi: `secrets.resolve`.

## Denetim ve yapılandırma iş akışı

Varsayılan operatör akışı:

<Steps>
  <Step title="Geçerli durumu denetleyin">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRef’leri yapılandırın">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="Yeniden denetleyin">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    Bulgular şunları içerir:

    - bekleyen düz metin değerler (`openclaw.json`, `auth-profiles.json`, `.env` ve üretilmiş `agents/*/agent/models.json`)
    - üretilmiş `models.json` girdilerindeki düz metin hassas sağlayıcı başlık kalıntıları
    - çözülemeyen başvurular
    - öncelik gölgelemesi (`auth-profiles.json` içindeki değerlerin `openclaw.json` başvurularından öncelikli olması)
    - eski kalıntılar (`auth.json`, OAuth hatırlatmaları)

    Exec notu:

    - Varsayılan olarak denetim, komut yan etkilerinden kaçınmak için exec SecretRef çözülebilirlik kontrollerini atlar.
    - Denetim sırasında exec sağlayıcılarını çalıştırmak için `openclaw secrets audit --allow-exec` kullanın.

    Başlık kalıntısı notu:

    - Hassas sağlayıcı başlığı algılama adı-heuristic tabanlıdır (yaygın auth/credential başlık adları ve `authorization`, `x-api-key`, `token`, `secret`, `password`, `credential` gibi parçalar).

  </Accordion>
  <Accordion title="secrets configure">
    Şunları yapan etkileşimli yardımcı:

    - önce `secrets.providers` yapılandırır (`env`/`file`/`exec`, ekle/düzenle/kaldır)
    - `openclaw.json` içindeki desteklenen gizli bilgi taşıyan alanları ve bir aracı kapsamı için `auth-profiles.json` dosyasını seçmenizi sağlar
    - hedef seçicide doğrudan yeni bir `auth-profiles.json` eşlemesi oluşturabilir
    - SecretRef ayrıntılarını alır (`source`, `provider`, `id`)
    - ön kontrol çözümlemesi çalıştırır
    - hemen uygulayabilir

    Exec notu:

    - `--allow-exec` ayarlı değilse ön kontrol exec SecretRef kontrollerini atlar.
    - `configure --apply` içinden doğrudan uygularsanız ve planda exec başvuruları/sağlayıcıları varsa, uygulama adımı için de `--allow-exec` ayarlı tutun.

    Yararlı modlar:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` apply varsayılanları:

    - hedeflenen sağlayıcılar için `auth-profiles.json` içinden eşleşen statik kimlik bilgilerini temizler
    - `auth.json` içinden eski statik `api_key` girdilerini temizler
    - `<config-dir>/.env` içinden eşleşen bilinen gizli bilgi satırlarını temizler

  </Accordion>
  <Accordion title="secrets apply">
    Kaydedilmiş bir planı uygulayın:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec notu:

    - `--allow-exec` ayarlı değilse dry-run exec kontrollerini atlar.
    - Yazma modu, `--allow-exec` ayarlı değilse exec SecretRef’leri/sağlayıcıları içeren planları reddeder.

    Katı hedef/yol sözleşmesi ayrıntıları ve tam red kuralları için bkz. [Secrets Apply Plan Contract](/tr/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Tek yönlü güvenlik ilkesi

<Warning>
OpenClaw, tarihsel düz metin gizli bilgi değerlerini içeren geri alma yedeklerini bilinçli olarak yazmaz.
</Warning>

Güvenlik modeli:

- yazma modundan önce ön kontrol başarılı olmalıdır
- çalışma zamanı etkinleştirmesi commit’ten önce doğrulanır
- apply, dosyaları atomik dosya değiştirme ve hata durumunda mümkün olan en iyi geri yüklemeyle günceller

## Eski auth uyumluluk notları

Statik kimlik bilgileri için çalışma zamanı artık düz metin eski auth depolamaya bağlı değildir.

- Çalışma zamanı kimlik bilgisi kaynağı çözümlenmiş bellek içi anlık görüntüdür.
- Eski statik `api_key` girdileri bulunduğunda temizlenir.
- OAuth ile ilgili uyumluluk davranışı ayrı kalır.

## Web UI notu

Bazı SecretInput union’larını form modundan çok ham düzenleyici modunda yapılandırmak daha kolaydır.

## İlgili

- [Authentication](/tr/gateway/authentication) — auth kurulumu
- [CLI: secrets](/tr/cli/secrets) — CLI komutları
- [Environment Variables](/tr/help/environment) — ortam önceliği
- [SecretRef Credential Surface](/tr/reference/secretref-credential-surface) — kimlik bilgisi yüzeyi
- [Secrets Apply Plan Contract](/tr/gateway/secrets-plan-contract) — plan sözleşmesi ayrıntıları
- [Security](/tr/gateway/security) — güvenlik duruşu
