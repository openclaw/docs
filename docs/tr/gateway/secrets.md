---
read_when:
    - Sağlayıcı kimlik bilgileri ve `auth-profiles.json` refs için SecretRefs’i yapılandırma
    - Üretimde sırları güvenli şekilde yeniden yükleme, denetleme, yapılandırma ve uygulama
    - Başlatmada hızlı başarısız olmayı, etkin olmayan yüzey filtrelemeyi ve bilinen son iyi davranışı anlama
sidebarTitle: Secrets management
summary: 'Gizli bilgi yönetimi: SecretRef sözleşmesi, çalışma zamanı anlık görüntü davranışı ve güvenli tek yönlü temizleme'
title: Gizli bilgilerin yönetimi
x-i18n:
    generated_at: "2026-06-28T00:38:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw, desteklenen kimlik bilgilerinin yapılandırmada düz metin olarak saklanmasına gerek kalmaması için eklemeli SecretRefs'i destekler.

<Note>
Düz metin hâlâ çalışır. SecretRefs, her kimlik bilgisi için isteğe bağlıdır.
</Note>

<Warning>
Düz metin kimlik bilgileri, agent'ın inceleyebildiği dosyalarda saklanıyorsa
agent tarafından okunabilir kalır; buna `openclaw.json`, `auth-profiles.json`, `.env` veya
oluşturulmuş `agents/*/agent/models.json` dosyaları dahildir. SecretRefs, bu yerel etki
alanını yalnızca desteklenen her kimlik bilgisi taşındıktan ve
`openclaw secrets audit --check` düz metin secret kalıntısı olmadığını raporladıktan sonra azaltır.
</Warning>

## Hedefler ve çalışma zamanı modeli

Secret'lar, bellek içi bir çalışma zamanı anlık görüntüsüne çözümlenir.

- Çözümleme, istek yollarında tembel değil, etkinleştirme sırasında isteklidir.
- Etkin olarak aktif bir SecretRef çözümlenemediğinde başlatma hızlı başarısız olur.
- Yeniden yükleme atomik takas kullanır: tam başarı ya da bilinen son iyi anlık görüntüyü koru.
- SecretRef ilke ihlalleri (örneğin SecretRef girdisiyle birleştirilmiş OAuth modunda auth profilleri) çalışma zamanı takasından önce etkinleştirmeyi başarısız kılar.
- Çalışma zamanı istekleri yalnızca aktif bellek içi anlık görüntüden okur.
- İlk başarılı yapılandırma etkinleştirmesi/yüklemesinden sonra, çalışma zamanı kod yolları başarılı bir yeniden yükleme onu değiştirene kadar bu aktif bellek içi anlık görüntüyü okumayı sürdürür.
- Giden teslim yolları da bu aktif anlık görüntüden okur (örneğin Discord yanıt/iş parçacığı teslimi ve Telegram eylem gönderimleri); her gönderimde SecretRefs'i yeniden çözümlemezler.

Bu, secret sağlayıcı kesintilerini sıcak istek yollarının dışında tutar.

## Agent erişim sınırı

SecretRefs, kimlik bilgilerini desteklenen yapılandırma ve oluşturulmuş model yüzeylerinde kalıcı hale getirilmekten korur, ancak bir süreç yalıtımı sınırı değildir. Bir düz metin kimlik bilgisi, agent'ın okuyabildiği bir yolda diskte kalırsa agent, dosya veya kabuk araçlarını kullanarak o dosyayı inceleyip API düzeyi redaksiyonu atlayabilir.

Agent tarafından erişilebilir dosyaların kapsamda olduğu üretim dağıtımları için, SecretRef geçişini yalnızca şunların tümü doğru olduğunda tamamlanmış kabul edin:

- desteklenen kimlik bilgileri düz metin değerler yerine SecretRefs kullanır
- eski düz metin kalıntıları `openclaw.json`,
  `auth-profiles.json`, `.env` ve oluşturulmuş `models.json` dosyalarından temizlenmiştir
- geçişten sonra `openclaw secrets audit --check` temizdir
- kalan desteklenmeyen veya dönen kimlik bilgileri işletim sistemi yalıtımı, container yalıtımı veya harici bir kimlik bilgisi proxy'si tarafından korunur

Bu nedenle audit/configure/apply iş akışı yalnızca kolaylık sağlayan bir yardımcı değil, bir güvenlik geçiş kapısıdır.

<Warning>
SecretRefs, keyfi okunabilir dosyaları güvenli hale getirmez. Yedekler, kopyalanmış yapılandırmalar,
eski oluşturulmuş model katalogları ve desteklenmeyen kimlik bilgisi sınıfları; silinene, agent güven
sınırının dışına taşınana veya ayrı bir yalıtım katmanı tarafından korunana kadar üretim secret'ları
olarak ele alınmalıdır.
</Warning>

## Aktif yüzey filtreleme

SecretRefs yalnızca etkin olarak aktif yüzeylerde doğrulanır.

- Etkin yüzeyler: çözümlenmemiş refs başlatmayı/yeniden yüklemeyi engeller.
- Aktif olmayan yüzeyler: çözümlenmemiş refs başlatmayı/yeniden yüklemeyi engellemez.
- Aktif olmayan refs, `SECRETS_REF_IGNORED_INACTIVE_SURFACE` koduyla ölümcül olmayan tanılamalar üretir.

<AccordionGroup>
  <Accordion title="Examples of inactive surfaces">
    - Devre dışı bırakılmış kanal/hesap girdileri.
    - Etkin hiçbir hesabın devralmadığı üst düzey kanal kimlik bilgileri.
    - Devre dışı bırakılmış araç/özellik yüzeyleri.
    - `tools.web.search.provider` tarafından seçilmeyen web arama sağlayıcısına özgü anahtarlar. Otomatik modda (sağlayıcı ayarlanmamışken), anahtarlar biri çözümlenene kadar sağlayıcı otomatik algılaması için önceliğe göre danışılır. Seçimden sonra, seçilmeyen sağlayıcı anahtarları seçilene kadar aktif olmayan olarak ele alınır.
    - Sandbox SSH auth materyali (`agents.defaults.sandbox.ssh.identityData`, `certificateData`, `knownHostsData` ve agent başına geçersiz kılmalar), yalnızca etkin sandbox backend'i varsayılan agent veya etkin bir agent için `ssh` olduğunda aktiftir.
    - `gateway.remote.token` / `gateway.remote.password` SecretRefs, şunlardan biri doğruysa aktiftir:
      - `gateway.mode=remote`
      - `gateway.remote.url` yapılandırılmıştır
      - `gateway.tailscale.mode`, `serve` veya `funnel` değeridir
      - Bu uzak yüzeyler olmadan yerel modda:
        - `gateway.remote.token`, token auth kazanabiliyorsa ve hiçbir env/auth token yapılandırılmamışsa aktiftir.
        - `gateway.remote.password`, yalnızca parola auth kazanabiliyorsa ve hiçbir env/auth parolası yapılandırılmamışsa aktiftir.
    - `gateway.auth.token` SecretRef, `OPENCLAW_GATEWAY_TOKEN` ayarlandığında başlatma auth çözümlemesi için aktif değildir, çünkü env token girdisi o çalışma zamanı için kazanır.

  </Accordion>
</AccordionGroup>

## Gateway auth yüzeyi tanılamaları

`gateway.auth.token`, `gateway.auth.password`, `gateway.remote.token` veya `gateway.remote.password` üzerinde bir SecretRef yapılandırıldığında, Gateway başlatma/yeniden yükleme yüzey durumunu açıkça günlüğe yazar:

- `active`: SecretRef, etkin auth yüzeyinin parçasıdır ve çözümlenmelidir.
- `inactive`: Başka bir auth yüzeyi kazandığı için veya uzak auth devre dışı/aktif olmadığı için SecretRef bu çalışma zamanı için yok sayılır.

Bu girdiler `SECRETS_GATEWAY_AUTH_SURFACE` ile günlüğe yazılır ve aktif yüzey ilkesi tarafından kullanılan nedeni içerir; böylece bir kimlik bilgisinin neden aktif veya aktif olmayan olarak ele alındığını görebilirsiniz.

## İlk kurulum referans ön kontrolü

İlk kurulum etkileşimli modda çalıştığında ve SecretRef depolamasını seçtiğinizde OpenClaw, kaydetmeden önce ön kontrol doğrulaması çalıştırır:

- Env refs: env var adını doğrular ve kurulum sırasında boş olmayan bir değerin görünür olduğunu onaylar.
- Sağlayıcı refs (`file` veya `exec`): sağlayıcı seçimini doğrular, `id` değerini çözümler ve çözümlenen değer türünü denetler.
- Quickstart yeniden kullanım yolu: `gateway.auth.token` zaten bir SecretRef olduğunda, ilk kurulum probe/dashboard bootstrap öncesinde (`env`, `file` ve `exec` refs için) aynı hızlı başarısız kapıyı kullanarak onu çözümler.

Doğrulama başarısız olursa ilk kurulum hatayı gösterir ve yeniden denemenize izin verir.

## SecretRef sözleşmesi

Her yerde tek bir nesne şekli kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    Desteklenen SecretInput alanları tam string kısayollarını da kabul eder:

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
    - `id` mutlak bir JSON pointer (`/...`) olmalıdır
    - Segmentlerde RFC6901 kaçışları: `~` => `~0`, `/` => `~1`

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

<AccordionGroup>
  <Accordion title="Env provider">
    - `allowlist` aracılığıyla isteğe bağlı izin verilenler listesi.
    - Eksik/boş env değerleri çözümlemeyi başarısız kılar.

  </Accordion>
  <Accordion title="File provider">
    - Yerel dosyayı `path` konumundan okur.
    - `mode: "json"` JSON nesnesi payload'u bekler ve `id` değerini pointer olarak çözümler.
    - `mode: "singleValue"` ref id `"value"` bekler ve dosya içeriğini döndürür.
    - Yol sahiplik/izin denetimlerinden geçmelidir.
    - Windows güvenli başarısız notu: Bir yol için ACL doğrulaması kullanılamıyorsa çözümleme başarısız olur. Yalnızca güvenilir yollar için, yol güvenlik denetimlerini atlamak üzere o sağlayıcıda `allowInsecurePath: true` ayarlayın.

  </Accordion>
  <Accordion title="Exec provider">
    - Yapılandırılmış mutlak ikili yolunu kabuk olmadan çalıştırır.
    - Varsayılan olarak `command`, normal bir dosyaya işaret etmelidir (symlink değil).
    - Symlink komut yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın (örneğin Homebrew shim'leri). OpenClaw çözümlenen hedef yolu doğrular.
    - Paket yöneticisi yolları için `allowSymlinkCommand` değerini `trustedDirs` ile eşleştirin (örneğin `["/opt/homebrew"]`).
    - Zaman aşımı, çıktısız zaman aşımı, çıktı bayt sınırları, env izin verilenler listesi ve güvenilir dizinleri destekler.
    - Windows güvenli başarısız notu: Komut yolu için ACL doğrulaması kullanılamıyorsa çözümleme başarısız olur. Yalnızca güvenilir yollar için, yol güvenlik denetimlerini atlamak üzere o sağlayıcıda `allowInsecurePath: true` ayarlayın.
    - Plugin tarafından yönetilen exec sağlayıcıları, kopyalanmış `command`/`args` yerine
      `pluginIntegration` kullanabilir. OpenClaw, başlatma/yeniden yükleme sırasında
      yüklü Plugin manifest'inden geçerli komut ayrıntılarını çözümler. Plugin
      devre dışı bırakılmış, kaldırılmış, güvenilmeyen veya artık entegrasyonu bildirmiyor ise,
      o sağlayıcıyı kullanan aktif SecretRefs güvenli biçimde başarısız olur.

    İstek payload'u (stdin):

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    Yanıt payload'u (stdout):

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

  </Accordion>
</AccordionGroup>

## Dosya destekli API anahtarları

Yapılandırma `env` bloğuna `file:...` string'leri koymayın. `env` bloğu
literal ve geçersiz kılmayan yapıdadır, bu nedenle `file:...` çözümlenmez.

Bunun yerine desteklenen bir kimlik bilgisi alanında dosya SecretRef kullanın:

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

`mode: "singleValue"` için SecretRef `id`, `"value"` değeridir. 
`mode: "json"` için `"/providers/xai/apiKey"` gibi mutlak bir JSON pointer kullanın.

SecretRefs kabul eden yapılandırma alanları için [SecretRef kimlik bilgisi yüzeyi](/tr/reference/secretref-credential-surface) bölümüne bakın.

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
    SecretRef id'lerinin Bitwarden Secrets Manager öğe anahtarlarıyla eşleşmesini
    istediğinizde bir çözümleyici sarmalayıcı kullanın. Depo
    `scripts/secrets/openclaw-bws-resolver.mjs` dosyasını içerir; bunu Gateway'i
    çalıştıran ana makinede mutlak ve güvenilir bir yola kurun veya kopyalayın.

    Gereksinimler:

    - Gateway ana makinesinde Bitwarden Secrets Manager CLI (`bws`) kurulu olmalıdır.
    - `BWS_ACCESS_TOKEN` Gateway hizmeti tarafından erişilebilir olmalıdır.
    - `PATH` çözümleyiciye geçirilmelidir veya `BWS_BIN`, mutlak `bws`
      ikili dosya yoluna ayarlanmalıdır.
    - Kendi barındırdığınız bir Bitwarden örneği kullanırken ortamda
      `BWS_SERVER_URL` ayarlanmış olmalıdır.

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

    Çözümleyici istenen id'leri toplu işler, `bws secret list` komutunu çalıştırır
    ve eşleşen secret `key` alanlarının değerlerini döndürür. Exec SecretRef id
    sözleşmesini karşılayan anahtarlar kullanın; örneğin
    `openclaw/providers/openai/apiKey`; alt çizgili env-var biçimli anahtarlar,
    çözümleyici çalışmadan önce reddedilir. Birden fazla görünür Bitwarden secret'ı
    aynı istenen anahtara sahipse çözümleyici, birini seçmek yerine bu id'yi
    belirsiz olarak başarısız kılar. Yapılandırmayı güncelledikten sonra
    çözümleyici yolunu doğrulayın:

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
    SecretRef id'lerinin doğrudan `pass` girdileriyle eşleşmesini istediğinizde
    küçük bir çözümleyici sarmalayıcı kullanın. Bunu exec-provider yol
    denetimlerinizden geçen mutlak bir yolda çalıştırılabilir dosya olarak
    kaydedin; örneğin `/usr/local/bin/openclaw-pass-resolver`.
    `#!/usr/bin/env node` shebang'i `node` değerini çözümleyici işleminin
    `PATH` değerinden çözer, bu yüzden `passEnv` içine `PATH` ekleyin. `pass`
    bu `PATH` üzerinde değilse üst ortamda `PASS_BIN` ayarlayın ve onu da
    `passEnv` içine ekleyin:

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
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    Ardından exec provider'ı yapılandırın ve `apiKey` değerini `pass` girdi
    yoluna yönlendirin:

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

    Secret'ı `pass` girdisinin ilk satırında tutun veya bunun yerine tam
    `pass show` çıktısını döndürmek istiyorsanız sarmalayıcıyı özelleştirin.
    Yapılandırmayı güncelledikten sonra hem statik denetimi hem de exec
    çözümleyici yolunu doğrulayın:

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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

`plugins.entries.acpx.config.mcpServers` üzerinden yapılandırılan MCP sunucusu env var'ları SecretInput destekler. Bu, API anahtarlarını ve token'ları düz metin yapılandırmasının dışında tutar:

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

Düz metin string değerler çalışmaya devam eder. `${MCP_SERVER_API_KEY}` gibi env-template refs ve SecretRef nesneleri, MCP sunucusu işlemi başlatılmadan önce Gateway etkinleştirmesi sırasında çözümlenir. Diğer SecretRef yüzeylerinde olduğu gibi, çözümlenemeyen refs yalnızca `acpx` Plugin'i fiilen etkin olduğunda etkinleştirmeyi engeller.

## Sandbox SSH kimlik doğrulama materyali

Çekirdek `ssh` sandbox backend'i, SSH kimlik doğrulama materyali için SecretRefs desteği de sunar:

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

- OpenClaw bu refs değerlerini her SSH çağrısında tembel olarak değil, sandbox etkinleştirmesi sırasında çözer.
- Çözümlenen değerler kısıtlayıcı izinlerle geçici dosyalara yazılır ve oluşturulan SSH yapılandırmasında kullanılır.
- Etkin sandbox backend'i `ssh` değilse bu refs etkin olmayan durumda kalır ve başlangıcı engellemez.

## Desteklenen kimlik bilgisi yüzeyi

Standart desteklenen ve desteklenmeyen kimlik bilgileri şurada listelenir:

- [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface)

<Note>
Çalışma zamanında üretilen veya dönen kimlik bilgileri ve OAuth yenileme materyali, salt okunur SecretRef çözümlemesinin kasıtlı olarak dışında bırakılmıştır.
</Note>

## Gerekli davranış ve öncelik

- Ref olmayan alan: değişmez.
- Ref olan alan: etkin yüzeylerde etkinleştirme sırasında zorunludur.
- Hem düz metin hem de ref varsa, desteklenen öncelik yollarında ref önceliklidir.
- Redaction sentinel `__OPENCLAW_REDACTED__`, dahili yapılandırma redaction/restore için ayrılmıştır ve literal olarak gönderilen yapılandırma verisi olarak reddedilir.

Uyarı ve denetim sinyalleri:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (çalışma zamanı uyarısı)
- `REF_SHADOWED` (`auth-profiles.json` kimlik bilgilerinin `openclaw.json` refs değerlerine göre öncelik aldığı denetim bulgusu)

Google Chat uyumluluk davranışı:

- `serviceAccountRef`, düz metin `serviceAccount` değerine göre önceliklidir.
- Kardeş ref ayarlandığında düz metin değer yok sayılır.

## Etkinleştirme tetikleyicileri

Secret etkinleştirmesi şu durumlarda çalışır:

- Başlangıç (preflight artı son etkinleştirme)
- Yapılandırma yeniden yükleme hot-apply yolu
- Yapılandırma yeniden yükleme restart-check yolu
- `secrets.reload` üzerinden manuel yeniden yükleme
- Düzenlemeleri kalıcılaştırmadan önce gönderilen yapılandırma payload'u içinde etkin yüzey SecretRef çözümlenebilirliği için Gateway yapılandırma yazma RPC preflight'ı (`config.set` / `config.apply` / `config.patch`)

Etkinleştirme sözleşmesi:

- Başarı snapshot'ı atomik olarak değiştirir.
- Başlangıç hatası Gateway başlangıcını iptal eder.
- Çalışma zamanı yeniden yükleme hatası bilinen son iyi snapshot'ı korur.
- Yazma RPC preflight hatası gönderilen yapılandırmayı reddeder ve hem disk yapılandırmasını hem de etkin çalışma zamanı snapshot'ını değiştirmeden korur.
- Bir outbound helper/tool çağrısına açık bir çağrı başına kanal token'ı sağlamak SecretRef etkinleştirmesini tetiklemez; etkinleştirme noktaları başlangıç, yeniden yükleme ve açık `secrets.reload` olarak kalır.

## Bozulmuş ve kurtarılmış sinyaller

Sağlıklı bir durumdan sonra yeniden yükleme zamanı etkinleştirmesi başarısız olduğunda OpenClaw bozulmuş secrets durumuna girer.

Tek seferlik sistem olayı ve günlük kodları:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Davranış:

- Bozulmuş: çalışma zamanı bilinen son iyi snapshot'ı korur.
- Kurtarılmış: bir sonraki başarılı etkinleştirmeden sonra bir kez yayınlanır.
- Zaten bozulmuş durumdayken tekrarlanan hatalar uyarıları günlüğe yazar ancak olayları tekrarlamaz.
- Başlangıç fail-fast, çalışma zamanı hiç etkinleşmediği için bozulmuş olayları yayınlamaz.

## Komut yolu çözümlemesi

Komut yolları, Gateway snapshot RPC üzerinden desteklenen SecretRef çözümlemesine katılmayı seçebilir.

İki genel davranış vardır:

<Tabs>
  <Tab title="Katı komut yolları">
    Örneğin `openclaw memory` uzak bellek yolları ve uzak paylaşılan gizli referanslara ihtiyaç duyduğunda `openclaw qr --remote`. Bunlar etkin anlık görüntüden okur ve gerekli bir SecretRef kullanılamıyorsa hızlı şekilde başarısız olur.
  </Tab>
  <Tab title="Salt okunur komut yolları">
    Örneğin `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` ve salt okunur doctor/config onarım akışları. Bunlar da etkin anlık görüntüyü tercih eder, ancak hedeflenen bir SecretRef bu komut yolunda kullanılamadığında işlemi durdurmak yerine sınırlı işlevle devam eder.

    Salt okunur davranış:

    - Gateway çalışırken, bu komutlar önce etkin anlık görüntüden okur.
    - Gateway çözümlemesi eksikse veya Gateway kullanılamıyorsa, ilgili komut yüzeyi için hedefli yerel geri dönüşü denerler.
    - Hedeflenen bir SecretRef hâlâ kullanılamıyorsa, komut sınırlı salt okunur çıktıyla ve "configured but unavailable in this command path" gibi açık tanılamalarla devam eder.
    - Bu sınırlı davranış yalnızca komuta özeldir. Çalışma zamanı başlatmasını, yeniden yüklemeyi veya gönderme/auth yollarını zayıflatmaz.

  </Tab>
</Tabs>

Diğer notlar:

- Arka uç gizli bilgi döndürmesinden sonra anlık görüntü yenilemesi `openclaw secrets reload` tarafından işlenir.
- Bu komut yolları tarafından kullanılan Gateway RPC yöntemi: `secrets.resolve`.

## Denetim ve yapılandırma iş akışı

Varsayılan operatör akışı:

<Steps>
  <Step title="Geçerli durumu denetle">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="SecretRef’leri yapılandır ve uygula">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="Yeniden denetle">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

Yeniden denetim temiz çıkana kadar geçişi tamamlanmış saymayın. Denetim
durağan halde hâlâ düz metin değerler bildiriyorsa, çalışma zamanı API’leri
redakte edilmiş değerler döndürse bile ajan erişimi riski hâlâ mevcuttur.

`configure` sırasında uygulamak yerine bir plan kaydederseniz, yeniden denetimden önce
bu kaydedilmiş planı `openclaw secrets apply --from <plan-path>` ile uygulayın.

<AccordionGroup>
  <Accordion title="secrets audit">
    Bulgular şunları içerir:

    - durağan halde düz metin değerler (`openclaw.json`, `auth-profiles.json`, `.env` ve oluşturulan `agents/*/agent/models.json`)
    - oluşturulan `models.json` girdilerinde düz metin hassas sağlayıcı başlığı kalıntıları
    - çözümlenmemiş ref’ler
    - öncelik gölgelemesi (`auth-profiles.json` öğesinin `openclaw.json` ref’lerine göre öncelik alması)
    - eski kalıntılar (`auth.json`, OAuth hatırlatmaları)

    Exec notu:

    - Varsayılan olarak denetim, komut yan etkilerinden kaçınmak için exec SecretRef çözülebilirlik denetimlerini atlar.
    - Denetim sırasında exec sağlayıcılarını çalıştırmak için `openclaw secrets audit --allow-exec` kullanın.

    Başlık kalıntısı notu:

    - Hassas sağlayıcı başlığı algılaması ad sezgilerine dayanır (yaygın auth/kimlik bilgisi başlık adları ve `authorization`, `x-api-key`, `token`, `secret`, `password` ve `credential` gibi parçalar).

  </Accordion>
  <Accordion title="secrets configure">
    Şunları yapan etkileşimli yardımcı:

    - önce `secrets.providers` yapılandırır (`env`/`file`/`exec`, ekle/düzenle/kaldır)
    - bir ajan kapsamı için `openclaw.json` içindeki desteklenen gizli bilgi taşıyan alanları ve ayrıca `auth-profiles.json` içeriğini seçmenizi sağlar
    - hedef seçicide doğrudan yeni bir `auth-profiles.json` eşlemesi oluşturabilir
    - SecretRef ayrıntılarını yakalar (`source`, `provider`, `id`)
    - ön kontrol çözümlemesi çalıştırır
    - hemen uygulayabilir

    Exec notu:

    - `--allow-exec` ayarlanmadıkça ön kontrol exec SecretRef denetimlerini atlar.
    - Doğrudan `configure --apply` içinden uygularsanız ve plan exec ref’leri/sağlayıcıları içeriyorsa, uygulama adımı için de `--allow-exec` ayarlı kalsın.

    Yararlı modlar:

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` uygulama varsayılanları:

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

    - dry-run, `--allow-exec` ayarlanmadıkça exec denetimlerini atlar.
    - yazma modu, `--allow-exec` ayarlanmadıkça exec SecretRef’leri/sağlayıcıları içeren planları reddeder.

    Katı hedef/yol sözleşmesi ayrıntıları ve tam reddetme kuralları için bkz. [Gizli Bilgileri Uygulama Planı Sözleşmesi](/tr/gateway/secrets-plan-contract).

  </Accordion>
</AccordionGroup>

## Tek yönlü güvenlik ilkesi

<Warning>
OpenClaw, geçmiş düz metin gizli bilgi değerlerini içeren geri alma yedeklerini bilerek yazmaz.
</Warning>

Güvenlik modeli:

- yazma modundan önce ön kontrol başarılı olmalıdır
- çalışma zamanı etkinleştirmesi commit öncesinde doğrulanır
- uygulama, dosyaları atomik dosya değiştirme ve hata durumunda en iyi çabayla geri yükleme kullanarak günceller

## Eski auth uyumluluk notları

Statik kimlik bilgileri için çalışma zamanı artık düz metin eski auth depolamasına bağlı değildir.

- Çalışma zamanı kimlik bilgisi kaynağı, çözümlenmiş bellek içi anlık görüntüdür.
- Eski statik `api_key` girdileri keşfedildiğinde temizlenir.
- OAuth ile ilgili uyumluluk davranışı ayrı kalır.

## Web UI notu

Bazı SecretInput union’larını ham düzenleyici modunda yapılandırmak, form moduna göre daha kolaydır.

## İlgili

- [Kimlik Doğrulama](/tr/gateway/authentication) — auth kurulumu
- [CLI: secrets](/tr/cli/secrets) — CLI komutları
- [Ortam Değişkenleri](/tr/help/environment) — ortam önceliği
- [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface) — kimlik bilgisi yüzeyi
- [Gizli Bilgileri Uygulama Planı Sözleşmesi](/tr/gateway/secrets-plan-contract) — plan sözleşmesi ayrıntıları
- [Güvenlik](/tr/gateway/security) — güvenlik duruşu
