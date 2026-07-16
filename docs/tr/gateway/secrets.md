---
read_when:
    - Sağlayıcı kimlik bilgileri ve `auth-profiles.json` referansları için SecretRef'leri yapılandırma
    - Üretimde gizli bilgileri güvenli bir şekilde yeniden yükleme, denetleme, yapılandırma ve uygulama
    - Başlatma sırasında hızlı hata verme, etkin olmayan yüzeylerin filtrelenmesi ve bilinen son iyi durum davranışını anlama
sidebarTitle: Secrets management
summary: 'Gizli bilgi yönetimi: SecretRef sözleşmesi, çalışma zamanı anlık görüntü davranışı ve güvenli tek yönlü temizleme'
title: Gizli bilgilerin yönetimi
x-i18n:
    generated_at: "2026-07-16T17:08:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw, desteklenen kimlik bilgilerinin yapılandırmada düz metin olarak bulunmasını gerektirmemek için eklemeli SecretRef'leri destekler.

<Note>
Düz metin hâlâ çalışır. SecretRef'ler her kimlik bilgisi için isteğe bağlıdır.
</Note>

<Warning>
Düz metin kimlik bilgileri, aracının inceleyebildiği dosyalarda bulunuyorsa aracı tarafından okunabilir olmaya devam eder; buna `openclaw.json`, `auth-profiles.json`, `.env` veya oluşturulan `agents/*/agent/models.json` dosyaları dahildir. SecretRef'ler bu yerel etki alanını yalnızca desteklenen tüm kimlik bilgileri taşındıktan ve `openclaw secrets audit --check` hiçbir düz metin kalıntısı bildirmedikten sonra daraltır.
</Warning>

## Çalışma zamanı modeli

- Gizli bilgiler, istek yollarında tembel biçimde değil, etkinleştirme sırasında istekli biçimde bellek içi bir çalışma zamanı anlık görüntüsüne çözümlenir.
- Etkin durumda olan bir SecretRef çözümlenemediğinde başlangıç hızla başarısız olur.
- Yeniden yükleme atomik bir takastır: ya tamamen başarılı olur ya da bilinen son sağlam anlık görüntü korunur.
- Politika ihlalleri (örneğin SecretRef girdisiyle birleştirilmiş OAuth modundaki bir kimlik doğrulama profili), çalışma zamanı takasından önce etkinleştirmenin başarısız olmasına yol açar.
- Çalışma zamanı istekleri yalnızca etkin bellek içi anlık görüntüyü okur. Model sağlayıcısı SecretRef kimlik bilgileri, çıkışa kadar işlem içi belirteçler olarak kimlik doğrulama depolamasından ve akış seçeneklerinden geçer. Giden teslim yolları da (Discord yanıt/ileti dizisi teslimi, Telegram eylem gönderimleri) bu anlık görüntüyü okur ve her gönderimde referansları yeniden çözümlemez.

Bu, gizli bilgi sağlayıcısı kesintilerini yoğun istek yollarından uzak tutar.

## Çıkış zamanında ekleme (belirteçler)

SecretRef'lerle desteklenen model sağlayıcısı kimlik bilgileri için OpenClaw, model kimlik doğrulaması çözümlenirken opak, işlem içi bir belirteç oluşturur. Bu nedenle kimlik doğrulama depolaması, akış seçenekleri, SDK yapılandırması, günlükler, hata nesneleri ve çoğu çalışma zamanı iç gözlemi sağlayıcı kimlik bilgisi yerine `oc-sent-v1-...` gibi bir değer görür. Korumalı model fetch işlemi ve yönetilen yerel sağlayıcı durum sondaları, bilinen belirteçleri her istek işlemden ayrılmadan hemen önce URL ve üstbilgi değerlerinde değiştirir.

Bilinmeyen belirteç biçimli değerler, ağ etkinliğinden önce güvenli biçimde başarısız olur. OpenClaw, çözümlenmemiş bir belirteci sağlayıcıya iletmek yerine isteği göndermeyi reddeder. Çözümlenen gizli bilgi değerleri, derinlemesine savunma önlemi olarak tam değerli günlük sansürü için de kaydedilir.

Sağlayıcı bağdaştırıcıları, SDK'larının desteklediği en geç ekleme noktasını kullanır:

- Özel fetch seçeneğine sahip SDK'lar OpenClaw'ın korumalı fetch işlevini alır; böylece SDK belirteci korur.
- Özel fetch seçeneği bulunmayan SDK'lar, istemci oluşturulmadan hemen önce belirteci açar. Plugin'e ait sağlayıcı akışları ve aracı çalıştırma ortamları, bu aktarımlar OpenClaw'ın korumalı fetch işlevini paylaşmadığından, çekirdeğe ait son aktarım noktasında belirteci açar.

Belirteçler, model çağrısı zinciri genelinde düz metin açığa çıkmasını azaltır ancak işlem yalıtımı sağlamaz. Gerçek değer aynı işlemin belleğinde bulunmaya ve son bağdaştırıcı sınırında görünmeye devam eder. SecretRef'ler üzerinden yapılandırılmayan düz metin ortam kimlik bilgileri, düz metin olarak kalır ve bu mekanizmanın dışındadır.

Olay müdahalesi veya uyumluluk sorunlarını giderme sırasında belirteç oluşturmayı devre dışı bırakmak için `OPENCLAW_SECRET_SENTINELS=off` değerini ayarlayın (`0` veya `false` değerlerini de büyük/küçük harfe duyarsız biçimde kabul eder). Acil durdurma anahtarı, tam değerli sansür kaydını devre dışı bırakmaz.

## Aracı erişim sınırı

SecretRef'ler kimlik bilgilerinin yapılandırmada ve oluşturulan model dosyalarında kalıcı hâle getirilmesini engeller ancak işlem yalıtımı sınırı değildir. Aracının okuyabildiği bir yolda diskte bırakılan düz metin kimlik bilgisi, API düzeyindeki sansürü atlayarak dosya veya kabuk araçları aracılığıyla yine okunabilir.

Aracının erişebildiği dosyaların kapsamda olduğu üretim dağıtımlarında, taşıma işlemini yalnızca aşağıdakilerin tümü sağlandığında tamamlanmış kabul edin:

- Desteklenen kimlik bilgileri, düz metin değerleri yerine SecretRef'leri kullanır.
- Eski düz metin kalıntıları `openclaw.json`, `auth-profiles.json`, `.env` ve oluşturulan `models.json` dosyalarından temizlenmiştir.
- Taşımadan sonra `openclaw secrets audit --check` temizdir.
- Desteklenmeyen veya dönüşümlü olarak yenilenen diğer tüm kimlik bilgileri işletim sistemi yalıtımı, kapsayıcı yalıtımı veya haricî bir kimlik bilgisi vekil sunucusuyla korunur.

Bu nedenle denetleme/yapılandırma/uygulama iş akışı yalnızca bir kolaylık yardımcısı değil, güvenlik taşıması kapısıdır.

<Warning>
SecretRef'ler okunabilen rastgele dosyaları güvenli hâle getirmez. Yedekler, kopyalanmış yapılandırmalar, eski oluşturulmuş model katalogları ve desteklenmeyen kimlik bilgisi sınıfları; silinene, aracı güven sınırının dışına taşınana veya ayrı olarak yalıtılana kadar üretim gizli bilgileri olarak kalır.
</Warning>

## Etkin yüzey filtreleme

SecretRef'ler yalnızca fiilen etkin yüzeylerde doğrulanır:

- **Etkin yüzeyler**: çözümlenmemiş referanslar başlangıcı/yeniden yüklemeyi engeller.
- **Etkin olmayan yüzeyler**: çözümlenmemiş referanslar başlangıcı/yeniden yüklemeyi engellemez; ölümcül olmayan bir `SECRETS_REF_IGNORED_INACTIVE_SURFACE` tanılaması yayınlar.

<Accordion title="Etkin olmayan yüzey örnekleri">
- Devre dışı bırakılmış kanal/hesap girdileri.
- Etkinleştirilmiş hiçbir hesabın devralmadığı üst düzey kanal kimlik bilgileri.
- Devre dışı bırakılmış araç/özellik yüzeyleri.
- `tools.web.search.provider` tarafından seçilmeyen web araması sağlayıcısına özgü anahtarlar. Otomatik modda (sağlayıcı ayarlanmamışken), bir anahtar çözümlenene kadar otomatik algılama için öncelik sırasına göre anahtarlara başvurulur; seçimden sonra seçilmeyen sağlayıcı anahtarları etkin değildir.
- Korumalı alan SSH kimlik doğrulama malzemesi (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` ve aracı başına geçersiz kılmalar), varsayılan aracı veya etkin bir aracı için yalnızca geçerli korumalı alan arka ucu `ssh` olduğunda ve korumalı alan modu `off` olmadığında etkindir.
- `gateway.remote.token` / `gateway.remote.password` SecretRef'leri aşağıdakilerden herhangi biri geçerliyse etkindir:
  - `gateway.mode=remote`
  - `gateway.remote.url` yapılandırılmıştır
  - `gateway.tailscale.mode`, `serve` veya `funnel` değerindedir
  - Bu uzak yüzeylerin bulunmadığı yerel modda: belirteç kimlik doğrulaması kazanabiliyorsa ve hiçbir ortam/kimlik doğrulama belirteci yapılandırılmamışsa `gateway.remote.token` etkindir; `gateway.remote.password` yalnızca parola kimlik doğrulaması kazanabiliyorsa ve hiçbir ortam/kimlik doğrulama parolası yapılandırılmamışsa etkindir.
- `OPENCLAW_GATEWAY_TOKEN` ayarlandığında `gateway.auth.token` SecretRef'i başlangıç kimlik doğrulaması çözümlemesi için etkin değildir, çünkü ilgili çalışma zamanında ortam belirteci girdisi önceliklidir.

</Accordion>

## Gateway kimlik doğrulama yüzeyi tanılamaları

`gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` veya `gateway.remote.password` üzerinde bir SecretRef ayarlandığında, Gateway başlangıcı/yeniden yüklemesi yüzey durumunu `SECRETS_GATEWAY_AUTH_SURFACE` koduyla günlüğe kaydeder:

- `active`: SecretRef, geçerli kimlik doğrulama yüzeyinin bir parçasıdır ve çözümlenmelidir.
- `inactive`: başka bir kimlik doğrulama yüzeyi önceliklidir veya uzak kimlik doğrulama devre dışıdır/etkin değildir.

Günlük girdisi, etkin yüzey politikasının kullandığı nedeni içerir.

## İlk katılım referans ön denetimi

Etkileşimli ilk katılımda SecretRef depolamasının seçilmesi, kaydetmeden önce ön denetim doğrulamasını çalıştırır:

- Ortam referansları: ortam değişkeni adını doğrular ve kurulum sırasında boş olmayan bir değerin görünür olduğunu onaylar.
- Sağlayıcı referansları (`file` veya `exec`): sağlayıcı seçimini doğrular, `id` değerini çözümler ve çözümlenen değer türünü denetler.
- Hızlı başlangıç akışı: `gateway.auth.token` zaten bir SecretRef olduğunda ilk katılım, aynı hızlı başarısız olma kapısını kullanarak sonda/pano önyüklemesinden önce bunu (`env`, `file` ve `exec` referansları için) çözümler.

Doğrulama hatası, hatayı gösterir ve yeniden denemenize olanak tanır.

## SecretRef sözleşmesi

Her yerde tek nesne biçimi:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    SecretInput alanlarında kısaltılmış dizeler de kabul edilir:

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
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
    - `id`, mutlak bir JSON işaretçisi (`/...`) veya `singleValue` sağlayıcıları için değişmez `value` değeri olmalıdır
    - Segmentlerde RFC 6901 kaçışları: `~`, `~0` olur; `/`, `~1` olur

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    Doğrulama:

    - `provider`, `^[a-z][a-z0-9_-]{0,63}$` ile eşleşmelidir
    - `id`, `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` ile eşleşmelidir (`secret#json_key` gibi seçicileri destekler)
    - `id`, eğik çizgiyle ayrılmış yol segmentleri olarak `.` veya `..` içermemelidir (örneğin `a/../b` reddedilir)

  </Tab>
</Tabs>

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
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
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

<Accordion title="Ortam sağlayıcısı">
- `allowlist` aracılığıyla isteğe bağlı tam ad izin listesi.
- Eksik veya boş ortam değerleri çözümlemenin başarısız olmasına yol açar.

</Accordion>

<Accordion title="Dosya sağlayıcısı">
- `path` konumundaki yerel dosyayı okur.
- `mode: "json"` (varsayılan), bir JSON nesnesi yükü bekler ve `id` değerini JSON işaretçisi olarak çözümler.
- `mode: "singleValue"`, `"value"` referans kimliğini bekler ve ham dosya içeriğini döndürür (sondaki yeni satır kaldırılır).
- Yol, sahiplik/izin denetimlerinden geçmelidir; `timeoutMs` (varsayılan 5000) ve `maxBytes` (varsayılan 1 MiB) okuma işlemini sınırlar.
- Windows'ta güvenli başarısızlık: yol için ACL doğrulaması kullanılamıyorsa çözümleme başarısız olur. Yalnızca güvenilen yollar için, denetimi atlamak üzere ilgili sağlayıcıda `allowInsecurePath: true` değerini ayarlayın.

</Accordion>

<Accordion title="Exec sağlayıcısı">
- Yapılandırılmış mutlak ikili dosya yolunu kabuk kullanmadan doğrudan çalıştırır.
- Varsayılan olarak `command` normal bir dosya olmalı, sembolik bağlantı olmamalıdır. Sembolik bağlantı komut yollarına (örneğin Homebrew yönlendirmelerine) izin vermek için `allowSymlinkCommand: true` ayarını etkinleştirin ve yalnızca paket yöneticisi yollarının uygun sayılması için bunu `trustedDirs` (örneğin `["/opt/homebrew"]`) ile eşleştirin.
- `timeoutMs` (varsayılan 5000), `noOutputTimeoutMs` (varsayılanı `timeoutMs` değerine eşittir), `maxOutputBytes` (varsayılan 1 MiB), `env`/`passEnv` izin listesi ve `trustedDirs` desteklenir.
- `jsonOnly` varsayılan olarak `true` değerindedir. `jsonOnly: false` ve istenen tek bir kimlik olduğunda, JSON olmayan düz stdout bu kimliğin değeri olarak kabul edilir.
- Windows'ta hata durumunda kapalı kalır: komut yolu için ACL doğrulaması kullanılamıyorsa çözümleme başarısız olur. Yalnızca güvenilir yollar için denetimi atlamak üzere ilgili sağlayıcıda `allowInsecurePath: true` ayarını etkinleştirin.
- Plugin tarafından yönetilen exec sağlayıcıları, kopyalanmış bir `command`/`args` yerine `pluginIntegration` kullanabilir. OpenClaw, başlatma/yeniden yükleme sırasında geçerli komut ayrıntılarını yüklü Plugin manifestinden çözümler; Plugin devre dışı bırakılmışsa, kaldırılmışsa, güvenilir değilse veya artık entegrasyonu bildirmiyorsa ilgili sağlayıcıdaki etkin SecretRef'ler hata durumunda kapalı kalır.

İstek yükü (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Yanıt yükü (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: izin listesi sırrı
```

Kimlik başına isteğe bağlı hatalar:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` isteğe bağlı, makine tarafından okunabilir bir tanı bilgisidir. OpenClaw, tanınan
`NOT_FOUND` ve `AMBIGUOUS_DUPLICATE_KEY` kodlarını sağlayıcı ve referans kimliğiyle birlikte görüntüler. Diğer
kodlar ve `message` gibi serbest biçimli alanlar, protokol-v1 uyumluluğu için kabul edilir
ancak çözümleyici çıktısı kimlik bilgisi materyali içerebildiğinden görüntülenmez.

</Accordion>

## Dosya tabanlı API anahtarları

Yapılandırmadaki `env` bloğuna `file:...` dizeleri koymayın. Bu blok sabittir ve geçersiz kılınamaz; bu nedenle `file:...` burada hiçbir zaman çözümlenmez.

Bunun yerine, desteklenen bir kimlik bilgisi alanında dosya SecretRef'i kullanın:

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

`mode: "singleValue"` için SecretRef `id`, `"value"` şeklindedir. `mode: "json"` için `"/providers/xai/apiKey"` gibi mutlak bir JSON işaretçisi kullanın.

SecretRef kabul eden alanlar için [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface) bölümüne bakın.

## Exec entegrasyonu örnekleri

Hizmet hesaplarını, paketle gelen aracı becerisini ve sorun gidermeyi kapsayan özel 1Password kılavuzu için [1Password](/gateway/1password) bölümüne bakın.

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // Homebrew sembolik bağlantılı ikili dosyaları için gereklidir
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
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    SecretRef kimliklerini Bitwarden Secrets Manager öğe anahtarlarıyla eşlemek için bir çözümleyici sarmalayıcısı kullanın. Depo `scripts/secrets/openclaw-bws-resolver.mjs` dosyasını içerir; bunu Gateway'i çalıştıran ana makinedeki mutlak ve güvenilir bir yola yükleyin veya kopyalayın.

    Gereksinimler:

    - Bitwarden Secrets Manager CLI (`bws`) Gateway ana makinesinde yüklü olmalıdır.
    - `BWS_ACCESS_TOKEN` Gateway hizmetinin kullanımına sunulmalıdır.
    - `PATH` çözümleyiciye aktarılmalı veya `BWS_BIN`, mutlak `bws` ikili dosya yoluna ayarlanmalıdır.
    - Kendi barındırdığınız bir Bitwarden örneğini kullanırken ortamda `BWS_SERVER_URL` ayarlanmalıdır.

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Çözümleyici, istenen kimlikleri toplu olarak işler, `bws secret list` komutunu çalıştırır ve eşleşen gizli `key` alanlarının değerlerini döndürür. `openclaw/providers/openai/apiKey` gibi exec SecretRef kimlik sözleşmesini karşılayan anahtarlar kullanın; alt çizgi içeren ortam değişkeni biçimindeki anahtarlar, çözümleyici çalıştırılmadan önce reddedilir. Birden fazla görünür Bitwarden sırrı istenen anahtarı paylaşıyorsa çözümleyici tahminde bulunmak yerine ilgili kimliği belirsiz olarak başarısız kılar. Yapılandırmayı güncelledikten sonra çözümleyici yolunu doğrulayın:

    ```bash
    openclaw secrets audit --allow-exec
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
            allowSymlinkCommand: true, // Homebrew sembolik bağlantılı ikili dosyaları için gereklidir
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
  <Accordion title="password-store (`pass`)">
    SecretRef kimliklerini doğrudan `pass` girdileriyle eşlemek için küçük bir çözümleyici sarmalayıcısı kullanın. Bunu, exec sağlayıcınızın yol denetimlerinden geçen mutlak bir yolda yürütülebilir dosya olarak, örneğin `/usr/local/bin/openclaw-pass-resolver` konumuna kaydedin. `#!/usr/bin/env node` shebang'i, çözümleyici işleminin `PATH` değerinden `node` öğesini çözümler; bu nedenle `passEnv` içine `PATH` ekleyin. `pass` bu `PATH` üzerinde değilse üst ortamda `PASS_BIN` ayarını yapın ve bunu `passEnv` içine de ekleyin:

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`İstek ayrıştırılamadı: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass ${result.status} durumuyla çıktı`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Ardından exec sağlayıcısını yapılandırın ve `apiKey` değerini `pass` girdi yoluna yönlendirin:

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    Sırrı `pass` girdisinin ilk satırında tutun veya bunun yerine tam `pass show` çıktısını döndürmek üzere sarmalayıcıyı özelleştirin. Yapılandırmayı güncelledikten sonra hem statik denetimi hem de exec çözümleyici yolunu doğrulayın:

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
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
            allowSymlinkCommand: true, // Homebrew sembolik bağlantılı ikili dosyaları için gereklidir
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

## MCP sunucusu ortam değişkenleri

`plugins.entries.acpx.config.mcpServers` aracılığıyla yapılandırılan MCP sunucusu ortam değişkenleri SecretInput kabul ederek API anahtarlarını ve belirteçleri düz metin yapılandırmanın dışında tutar:

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

Düz metin dize değerleri çalışmaya devam eder. `${MCP_SERVER_API_KEY}` gibi ortam şablonu referansları ve SecretRef nesneleri, MCP sunucusu işlemi oluşturulmadan önce Gateway etkinleştirmesi sırasında çözümlenir. Diğer SecretRef yüzeylerinde olduğu gibi çözümlenemeyen referanslar, yalnızca `acpx` Plugin'i etkin bir şekilde etkinken etkinleştirmeyi engeller.

## Sandbox SSH kimlik doğrulama materyali

Temel `ssh` sandbox arka ucu, SSH kimlik doğrulama materyali için de SecretRef'leri destekler:

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

- OpenClaw bu referansları her SSH çağrısında tembel olarak değil, sandbox etkinleştirilirken çözümler.
- Çözümlenen değerler, kısıtlayıcı dosya izinleriyle (`0o600`) geçici bir dizine yazılır ve oluşturulan SSH yapılandırmasında kullanılır.
- Etkin sandbox arka ucu `ssh` değilse (veya sandbox modu `off` ise) bu referanslar devre dışı kalır ve başlatmayı engellemez.

## Desteklenen kimlik bilgisi yüzeyi

Standart olarak desteklenen ve desteklenmeyen kimlik bilgileri [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface) bölümünde listelenmiştir.

<Note>
Çalışma zamanında oluşturulan veya dönüşümlü kimlik bilgileri ile OAuth yenileme malzemeleri, salt okunur SecretRef çözümlemesinin kasıtlı olarak dışındadır.
</Note>

## Gerekli davranış ve öncelik

- Referansı olmayan alan: değişmez.
- Referansı olan alan: etkinleştirme sırasında aktif yüzeylerde gereklidir.
- Hem düz metin hem de referans mevcutsa desteklenen öncelik yollarında referans önceliklidir.
- Karartma gözcü değeri `__OPENCLAW_REDACTED__`, dahili yapılandırma karartma/geri yükleme işlemleri için ayrılmıştır ve gönderilen yapılandırmada sabit veri olarak kullanılması reddedilir.

Uyarı ve denetim sinyalleri:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (çalışma zamanı uyarısı)
- `REF_SHADOWED` (`auth-profiles.json` kimlik bilgilerinin `openclaw.json` referanslarından öncelikli olması durumunda denetim bulgusu)

Google Chat uyumluluğu: `serviceAccountRef`, düz metin `serviceAccount` değerinden önceliklidir; eşdüzey referans ayarlandıktan sonra düz metin değeri yok sayılır.

## Etkinleştirme tetikleyicileri

Gizli bilgi etkinleştirmesi şu durumlarda çalışır:

- Başlatma (ön kontrol ve nihai etkinleştirme)
- Yapılandırmayı yeniden yükleme anında uygulama yolu
- Yapılandırmayı yeniden yükleme yeniden başlatma denetimi yolu
- `secrets.reload` aracılığıyla manuel yeniden yükleme
- Gateway yapılandırma yazma RPC ön kontrolü (`config.set` / `config.apply` / `config.patch`); düzenlemeleri kalıcılaştırmadan önce gönderilen yapılandırma yükündeki aktif yüzey SecretRef değerlerinin çözümlenebilirliğini denetler

Etkinleştirme sözleşmesi:

- Başarılı olduğunda anlık görüntü atomik olarak değiştirilir.
- Başlatma hatası Gateway'in başlatılmasını iptal eder.
- Çalışma zamanında yeniden yükleme hatası, bilinen son sağlam anlık görüntüyü korur.
- Yazma RPC'si ön kontrol hatası gönderilen yapılandırmayı reddeder; hem diskteki yapılandırma hem de aktif çalışma zamanı anlık görüntüsü değişmeden kalır.
- Giden bir yardımcı/araç çağrısına çağrı başına açık bir kanal belirteci sağlamak SecretRef etkinleştirmesini tetiklemez; etkinleştirme noktaları başlatma, yeniden yükleme ve açık `secrets.reload` olarak kalır.

## Bozulma ve kurtarma sinyalleri

Sağlıklı bir durumdan sonra yeniden yükleme sırasındaki etkinleştirme başarısız olduğunda OpenClaw, bozulmuş gizli bilgiler durumuna girer ve tek seferlik sistem olayları ile günlük kodları yayınlar:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Davranış:

- Bozulmuş: çalışma zamanı, bilinen son sağlam anlık görüntüyü korur.
- Kurtarıldı: bir sonraki başarılı etkinleştirmeden sonra bir kez yayınlanır.
- Zaten bozulmuş durumdayken tekrarlanan hatalar uyarı olarak günlüğe kaydedilir ancak olay yeniden yayınlanmaz.
- Başlangıçta hızlı başarısızlık hiçbir zaman bozulma olayı yayınlamaz; çünkü çalışma zamanı hiçbir zaman aktif hâle gelmemiştir.

## Komut yolu çözümlemesi

Komut yolları, Gateway anlık görüntü RPC'si aracılığıyla desteklenen SecretRef çözümlemesini kullanmayı seçebilir. İki genel davranış geçerlidir:

<Tabs>
  <Tab title="Katı komut yolları">
    Örneğin `openclaw memory` uzak bellek yolları ve uzak paylaşılan gizli bilgi referanslarına ihtiyaç duyduğunda `openclaw qr --remote`. Aktif anlık görüntüden okurlar ve gerekli bir SecretRef kullanılamadığında hızlıca başarısız olurlar.
  </Tab>
  <Tab title="Salt okunur komut yolları">
    Örneğin `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` ve salt okunur doctor/yapılandırma onarım akışları. Bunlar da aktif anlık görüntüyü tercih eder ancak hedeflenen bir SecretRef kullanılamadığında iptal olmak yerine bozulmuş moda geçer.

    Salt okunur davranış:

    - Gateway çalışırken bu komutlar önce aktif anlık görüntüden okur.
    - Gateway çözümlemesi eksikse veya Gateway kullanılamıyorsa ilgili komut yüzeyi için hedefli bir yerel geri dönüş denerler.
    - Hedeflenen SecretRef hâlâ kullanılamıyorsa komut, bozulmuş salt okunur çıktıyla ve referansın yapılandırılmış ancak bu komut yolunda kullanılamaz olduğunu belirten açık bir tanılamayla devam eder.
    - Bu bozulmuş davranış yalnızca komuta özgüdür; çalışma zamanı başlatma, yeniden yükleme veya gönderme/kimlik doğrulama yollarını zayıflatmaz.

  </Tab>
</Tabs>

Diğer notlar:

- Arka uç gizli bilgisi döndürüldükten sonra anlık görüntünün yenilenmesi `openclaw secrets reload` tarafından gerçekleştirilir.
- Bu komut yollarının kullandığı Gateway RPC yöntemi: `secrets.resolve`.

## Denetim ve yapılandırma iş akışı

Varsayılan operatör akışı:

<Steps>
  <Step title="Geçerli durumu denetleyin">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRef değerlerini yapılandırın ve uygulayın">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Yeniden denetleyin">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Yeniden denetim temiz sonuçlanana kadar geçişi tamamlanmış kabul etmeyin. Denetim, kalıcı depolamada hâlâ düz metin değerleri bildiriyorsa çalışma zamanı API'leri karartılmış değerler döndürse bile ajan erişimi riski devam eder.

`configure` sırasında uygulamak yerine bir plan kaydederseniz yeniden denetimden önce bu kayıtlı planı `openclaw secrets apply --from <plan-path>` ile uygulayın.

<AccordionGroup>
  <Accordion title="secrets audit">
    Bulgular şunları içerir:

    - Kalıcı depolamadaki düz metin değerleri (`openclaw.json`, `auth-profiles.json`, `.env` ve oluşturulan `agents/*/agent/models.json`).
    - Oluşturulan `models.json` girdilerindeki düz metin hassas sağlayıcı üst bilgisi kalıntıları.
    - Çözümlenmemiş referanslar.
    - Öncelik gölgelemesi (`auth-profiles.json` değerinin `openclaw.json` referanslarından öncelikli olması).
    - Eski kalıntılar (`auth.json`, OAuth hatırlatıcıları).

    Exec notu: denetim, komut yan etkilerini önlemek için varsayılan olarak exec SecretRef çözümlenebilirlik kontrollerini atlar. Denetim sırasında exec sağlayıcılarını yürütmek için `openclaw secrets audit --allow-exec` kullanın.

    Üst bilgi kalıntısı notu: hassas sağlayıcı üst bilgisi algılaması, ada dayalı sezgisel kuralları kullanır (yaygın kimlik doğrulama/kimlik bilgisi üst bilgisi adları ve `authorization`, `x-api-key`, `token`, `secret`, `password` ve `credential` gibi parçalar).

  </Accordion>
  <Accordion title="secrets configure">
    Şunları yapan etkileşimli yardımcı:

    - Önce `secrets.providers` yapılandırır (`env`/`file`/`exec`, ekleme/düzenleme/kaldırma).
    - Tek bir ajan kapsamı için `openclaw.json` içindeki ve `auth-profiles.json` kapsamındaki desteklenen gizli bilgi içeren alanları seçmenizi sağlar.
    - Hedef seçicide doğrudan yeni bir `auth-profiles.json` eşlemesi oluşturabilir.
    - SecretRef ayrıntılarını (`source`, `provider`, `id`) alır.
    - Ön kontrol çözümlemesini çalıştırır ve hemen uygulayabilir.

    Exec notu: `--allow-exec` ayarlanmadığı sürece ön kontrol, exec SecretRef kontrollerini atlar. Doğrudan `configure --apply` üzerinden uygularsanız ve plan exec referansları/sağlayıcıları içeriyorsa uygulama adımında da `--allow-exec` ayarını koruyun.

    Yararlı modlar:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` uygulama varsayılanları:

    - Hedeflenen sağlayıcılar için `auth-profiles.json` içindeki eşleşen statik kimlik bilgilerini temizler.
    - `auth.json` içindeki eski statik `api_key` girdilerini temizler.
    - `<config-dir>/.env` içindeki eşleşen, bilinen gizli bilgi satırlarını temizler.

  </Accordion>
  <Accordion title="secrets apply">
    Kayıtlı bir planı uygulayın:

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec notu: `--allow-exec` ayarlanmadığı sürece deneme çalıştırması exec kontrollerini atlar; `--allow-exec` ayarlanmadığı sürece yazma modu, exec SecretRef değerleri/sağlayıcıları içeren planları reddeder.

    Katı hedef/yol sözleşmesi ayrıntıları ve kesin reddetme kuralları için [Gizli Bilgileri Uygulama Planı Sözleşmesi](/tr/gateway/secrets-plan-contract) bölümüne bakın.

  </Accordion>
</AccordionGroup>

## Tek yönlü güvenlik politikası

<Warning>
OpenClaw, geçmiş düz metin gizli bilgi değerlerini içeren geri alma yedeklerini kasıtlı olarak yazmaz.
</Warning>

Güvenlik modeli:

- Yazma modundan önce ön kontrol başarılı olmalıdır.
- Kaydetmeden önce çalışma zamanı etkinleştirmesi doğrulanır.
- Uygulama, dosyaları atomik dosya değiştirme yöntemiyle günceller ve hata durumunda mümkün olan en iyi şekilde geri yükler.

## Eski kimlik doğrulama uyumluluk notları

Statik kimlik bilgileri için çalışma zamanı artık eski düz metin kimlik doğrulama depolamasına bağımlı değildir.

- Çalışma zamanı kimlik bilgisi kaynağı, çözümlenmiş bellek içi anlık görüntüdür.
- Eski statik `api_key` girdileri algılandığında temizlenir.
- OAuth ile ilgili uyumluluk davranışı ayrı kalır.

## Web kullanıcı arayüzü notu

Bazı SecretInput birleşimlerini ham düzenleyici modunda yapılandırmak, form moduna göre daha kolaydır.

## İlgili

- [Kimlik Doğrulama](/tr/gateway/authentication) - kimlik doğrulama kurulumu
- [CLI: gizli bilgiler](/tr/cli/secrets) - CLI komutları
- [Vault SecretRef Değerleri](/tr/plugins/vault) - HashiCorp Vault sağlayıcısı kurulumu
- [Ortam Değişkenleri](/tr/help/environment) - ortam önceliği
- [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface) - kimlik bilgisi yüzeyi
- [Gizli Bilgileri Uygulama Planı Sözleşmesi](/tr/gateway/secrets-plan-contract) - plan sözleşmesi ayrıntıları
- [Güvenlik](/tr/gateway/security) - güvenlik duruşu
