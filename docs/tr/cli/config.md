---
read_when:
    - Yapılandırmayı etkileşimsiz olarak okumak veya düzenlemek istiyorsunuz
sidebarTitle: Config
summary: '`openclaw config` için CLI başvurusu (get/set/patch/unset/file/schema/validate)'
title: Yapılandırma
x-i18n:
    generated_at: "2026-07-16T17:14:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63be5cbac6c7db9c6b93ad690e5decab9f4ce7904e8b10f26a3b1e39e4729450
    source_path: cli/config.md
    workflow: 16
---

Etkileşimsiz `openclaw.json` yardımcıları: yol üzerinden bir değeri alın/ayarlayın/yamalayın/kaldırın, şemayı yazdırın, doğrulayın veya etkin dosya yolunu yazdırın. `openclaw config` komutunu alt komut olmadan çalıştırarak `openclaw configure` ile aynı yönlendirmeli sihirbazı açın.

<Note>
`OPENCLAW_NIX_MODE=1` olduğunda OpenClaw, `openclaw.json` öğesini değişmez olarak kabul eder. Salt okunur komutlar (`config get`, `config file`, `config schema`, `config validate`) çalışmaya devam eder; yapılandırma yazıcıları işlemi reddeder. Bunun yerine kurulumun Nix kaynağını düzenleyin; birinci taraf nix-openclaw dağıtımı için [nix-openclaw Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) belgesini kullanın ve değerleri `programs.openclaw.config` veya `instances.<name>.config` altında ayarlayın.
</Note>

## Kök seçenekleri

<ParamField path="--section <section>" type="string">
  `openclaw config` komutunu alt komut olmadan çalıştırdığınızda kullanılabilen, yinelenebilir yönlendirmeli kurulum bölümü filtresi.
</ParamField>

Yönlendirmeli bölümler: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## Örnekler

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### Yollar

Nokta veya köşeli parantez gösterimi. zsh'nin `[0]` öğesini glob ile genişletmemesi için kabuk örneklerinde köşeli parantezli yolları tırnak içine alın:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Gizli bilgileri çıkarılmış yapılandırma anlık görüntüsünden bir değer okur (gizli bilgiler hiçbir zaman yazdırılmaz). `--json` ham değeri JSON olarak yazdırır; aksi takdirde dizeler/sayılar/boole değerleri yalın, nesneler/diziler ise biçimlendirilmiş JSON olarak yazdırılır.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

`OPENCLAW_CONFIG_PATH` veya varsayılan konumdan çözümlenen etkin yapılandırma dosyası yolunu yazdırır. Yol, sembolik bağlantıyı değil normal bir dosyayı belirtir; bkz. [Yazma güvenliği](#write-safety).

### `config schema`

`openclaw.json` için oluşturulan JSON şemasını standart çıktıya yazdırır.

<AccordionGroup>
  <Accordion title="İçerdikleri">
    - Geçerli kök yapılandırma şeması ve düzenleyici araçları için kök düzeyinde bir `$schema` dize alanı.
    - Control UI tarafından kullanılan `title` / `description` alan belge meta verileri.
    - İç içe nesne, joker karakter (`*`) ve dizi öğesi (`[]`) düğümleri, eşleşen alan belgeleri bulunduğunda aynı `title` / `description` meta verilerini devralır.
    - `anyOf` / `oneOf` / `allOf` dalları da aynı belge meta verilerini devralır.
    - Çalışma zamanı manifestleri yüklenebildiğinde en iyi çabayla canlı Plugin + kanal şeması meta verileri.
    - Geçerli yapılandırma geçersiz olsa bile temiz bir geri dönüş şeması.

  </Accordion>
  <Accordion title="İlgili çalışma zamanı RPC'si">
    `config.schema.lookup`, sığ bir şema düğümü (`title`, `description`, `type`, `enum`, `const`, ortak sınırlar), eşleşen UI ipucu meta verileri ve doğrudan alt öğe özetleriyle normalleştirilmiş tek bir yapılandırma yolu döndürür. Bunu Control UI veya özel istemcilerde yol kapsamlı ayrıntıya inme işlemleri için kullanın.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Gateway'i başlatmadan geçerli yapılandırmayı etkin şemaya göre doğrular.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
Doğrulama zaten başarısız oluyorsa `openclaw configure` veya `openclaw doctor --fix` ile başlayın. `openclaw chat`, geçersiz yapılandırma korumasını atlamaz.
</Note>

## Değerler

Değerler mümkün olduğunda JSON5 olarak ayrıştırılır; aksi takdirde ham dizeler olarak değerlendirilir. Dize geri dönüşü olmadan standart JSON gerektirmek için `--strict-json` kullanın (yorumlar, sondaki virgüller veya tırnaksız anahtarlar gibi yalnızca JSON5'e özgü sözdizimleri bu durumda reddedilir). `--json`, `config set` üzerindeki `--strict-json` için eski bir diğer addır.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`, terminal için biçimlendirilmiş metin yerine ham değeri JSON olarak yazdırır.

<Note>
Nesne ataması varsayılan olarak hedef yolun yerini alır. Genellikle kullanıcı tarafından eklenen girdiler içeren korumalı yollar, `--replace` geçirmediğiniz sürece mevcut girdileri kaldıracak değiştirme işlemlerini reddeder: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` ve `auth.profiles`.
</Note>

Bu eşlemelere girdi eklerken `--merge` kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

`--replace` seçeneğini yalnızca sağlanan değerin kasıtlı olarak hedef değerin tamamı olması gerektiğinde kullanın.

## `config set` modları

<Tabs>
  <Tab title="Değer modu">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef oluşturucu modu">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Sağlayıcı oluşturucu modu">
    Yalnızca `secrets.providers.<alias>` yollarını hedefler:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Toplu iş modu">
    ```bash
    openclaw config set --batch-json '[
      {
        "path": "secrets.providers.default",
        "provider": { "source": "env" }
      },
      {
        "path": "channels.discord.token",
        "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
      }
    ]'
    ```

    ```bash
    openclaw config set --batch-file ./config-set.batch.json --dry-run
    ```

  </Tab>
</Tabs>

<Warning>
SecretRef atamaları, desteklenmeyen çalışma zamanında değiştirilebilir yüzeylerde (örneğin `hooks.token`, `commands.ownerDisplaySecret`, Discord iş parçacığı bağlama Webhook belirteçleri ve WhatsApp kimlik bilgileri JSON'u) reddedilir. Bkz. [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface).
</Warning>

Toplu iş ayrıştırması, doğruluk kaynağı olarak her zaman toplu iş yükünü (`--batch-json`/`--batch-file`) kullanır; `--strict-json` / `--json`, toplu iş ayrıştırma davranışını değiştirmez.

JSON yol/değer modu, SecretRef'ler ve sağlayıcılar için de doğrudan çalışır:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Sağlayıcı oluşturucu bayrakları

Sağlayıcı oluşturucu hedefleri yol olarak `secrets.providers.<alias>` kullanmalıdır.

<AccordionGroup>
  <Accordion title="Ortak bayraklar">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env sağlayıcısı (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (yinelenebilir)

  </Accordion>
  <Accordion title="Dosya sağlayıcısı (--provider-source file)">
    - `--provider-path <path>` (gerekli)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec sağlayıcısı (--provider-source exec)">
    - `--provider-command <path>` (gerekli)
    - `--provider-arg <arg>` (yinelenebilir)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (yinelenebilir)
    - `--provider-pass-env <ENV_VAR>` (yinelenebilir)
    - `--provider-trusted-dir <path>` (yinelenebilir)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

Güçlendirilmiş exec sağlayıcısı örneği:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## `config patch`

Yol tabanlı çok sayıda `config set` komutu çalıştırmak yerine yapılandırma biçimli bir JSON5 yamasını yapıştırın veya boru üzerinden aktarın. Nesneler özyinelemeli olarak birleştirilir; diziler ve skaler değerler hedefin yerini alır; `null` hedef yolu siler.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Uzak kurulum betikleri için bir yamayı standart giriş üzerinden aktarın:

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Örnek yama:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

Bir nesnenin veya dizinin özyinelemeli olarak yamalanmak yerine tam olarak sağlanan değer olması gerektiğinde `--replace-path <path>` kullanın:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run`, yazma işlemi yapmadan şema ve SecretRef çözümlenebilirlik denetimlerini çalıştırır. Exec destekli SecretRef'ler deneme sırasında varsayılan olarak atlanır; deneme sırasında sağlayıcı komutlarının kasıtlı olarak çalıştırılmasını istediğinizde `--allow-exec` ekleyin.

## Deneme

`--dry-run`, `openclaw.json` öğesine yazmadan değişiklikleri doğrular. `config set`, `config patch` ve `config unset` üzerinde kullanılabilir.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

<AccordionGroup>
  <Accordion title="Kuru çalıştırma davranışı">
    - Oluşturucu modu: değiştirilen başvurular/sağlayıcılar için SecretRef çözümlenebilirlik denetimlerini çalıştırır.
    - JSON modu (`--strict-json`, `--json` veya toplu iş modu): şema doğrulamasının yanı sıra SecretRef çözümlenebilirlik denetimlerini çalıştırır.
    - İlke doğrulaması, değişiklik sonrası yapılandırmanın tamamına uygulanır; dolayısıyla üst nesne yazımları (örneğin `hooks` değerini nesne olarak ayarlamak) desteklenmeyen yüzey doğrulamasını atlayamaz.
    - Komut yan etkilerini önlemek için Exec SecretRef denetimleri varsayılan olarak atlanır; etkinleştirmek için `--allow-exec` iletin (bu, sağlayıcı komutlarını çalıştırabilir). `--allow-exec` yalnızca kuru çalıştırmada kullanılabilir ve `--dry-run` olmadan hata verir.

  </Accordion>
  <Accordion title="--dry-run --json alanları">
    - `ok`: kuru çalıştırmanın başarılı olup olmadığı
    - `operations`: değerlendirilen atama sayısı
    - `checks`: şema/çözümlenebilirlik denetimlerinin çalışıp çalışmadığı
    - `checks.resolvabilityComplete`: çözümlenebilirlik denetimlerinin tamamlanıp tamamlanmadığı (exec başvuruları atlandığında false)
    - `refsChecked`: kuru çalıştırma sırasında gerçekten çözümlenen başvuru sayısı
    - `skippedExecRefs`: `--allow-exec` ayarlanmadığı için atlanan exec başvurularının sayısı
    - `errors`: `ok=false` olduğunda yapılandırılmış eksik yol, şema veya çözümlenebilirlik hataları

  </Accordion>
</AccordionGroup>

### JSON çıktı biçimi

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // çözümlenebilirlik hataları için bulunur
    },
  ],
}
```

<Tabs>
  <Tab title="Başarı örneği">
    ```json
    {
      "ok": true,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0
    }
    ```
  </Tab>
  <Tab title="Hata örneği">
    ```json
    {
      "ok": false,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0,
      "errors": [
        {
          "kind": "resolvability",
          "message": "Hata: \"MISSING_TEST_SECRET\" ortam değişkeni ayarlanmamış.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Kuru çalıştırma başarısız olursa">
    - `config schema validation failed`: değişiklik sonrası yapılandırma biçiminiz geçersizdır; yolu/değeri veya sağlayıcı/başvuru nesnesi biçimini düzeltin.
    - `Config policy validation failed: unsupported SecretRef usage`: bu kimlik bilgisini yeniden düz metin/dize girdisine taşıyın; SecretRef'leri yalnızca desteklenen yüzeylerde tutun.
    - `SecretRef assignment(s) could not be resolved`: başvurulan sağlayıcı/başvuru şu anda çözümlenemiyor (eksik ortam değişkeni, geçersiz dosya işaretçisi, exec sağlayıcısı hatası veya sağlayıcı/kaynak uyuşmazlığı).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: exec çözümlenebilirlik doğrulamasına ihtiyacınız varsa `--allow-exec` ile yeniden çalıştırın.
    - Toplu iş modunda, başarısız girdileri düzeltin ve yazmadan önce `--dry-run` komutunu yeniden çalıştırın.

  </Accordion>
</AccordionGroup>

## Değişiklikleri uygulama

Her başarılı `config set` / `config patch` / `config unset` işleminden sonra CLI, Gateway'in yeniden başlatılması gerekip gerekmediğini anlayabilmeniz için üç ipucundan birini yazdırır:

| İpucu                                              | Anlamı                                            |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | Değiştirilen yolun tamamen yeniden başlatılması gerekir. |
| `Change will apply without restarting the gateway.` | Çalışırken yeniden yükleme bunu otomatik olarak uygular.  |
| `No gateway restart needed.`                        | Çalışma zamanıyla ilgili hiçbir şey değişmedi.      |

`plugins.entries` yoluna (veya herhangi bir alt yoluna) yapılan yazımlar her zaman yeniden başlatma gerektirir; çünkü CLI, her Plugin'in yeniden yükleme meta verilerinin yüklendiğini doğrulayamaz.

## Yazma güvenliği

`openclaw config set` ve OpenClaw'a ait diğer yapılandırma yazıcıları, yapılandırmayı diske kaydetmeden önce değişiklik sonrası yapılandırmanın tamamını doğrular. Yeni yük şema doğrulamasından geçemez veya yıkıcı bir üzerine yazma gibi görünürse etkin yapılandırmaya dokunulmaz ve reddedilen yük, `openclaw.json.rejected.*` olarak yanına kaydedilir.

OpenClaw'a ait yazma işlemleri JSON5'i standart JSON olarak yeniden serileştirir. Kaynak yorumlar içeriyorsa yazıcı, bunları kaldırmadan hemen önce uyarır; yorumların korunması önemliyse doğrudan bir düzenleyici kullanın.

<Warning>
Etkin yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlantılı `openclaw.json` düzenleri yazma işlemleri için desteklenmez; bunun yerine doğrudan gerçek dosyayı göstermek üzere `OPENCLAW_CONFIG_PATH` kullanın.
</Warning>

Küçük düzenlemeler için CLI yazma işlemlerini tercih edin:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Bir yazma işlemi reddedilirse kaydedilen yükü inceleyin ve yapılandırma biçiminin tamamını düzeltin:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Doğrudan düzenleyiciyle yazmaya yine izin verilir, ancak çalışan Gateway bu yazımları doğrulanana kadar güvenilmeyen olarak değerlendirir. Geçersiz doğrudan düzenlemeler başlatma işleminin başarısız olmasına neden olur veya çalışırken yeniden yükleme sırasında atlanır; Gateway, `openclaw.json` dosyasını yeniden yazmaz. Önek eklenmiş/üzerine yazılmış yapılandırmayı onarmak veya bilinen son iyi kopyayı geri yüklemek için `openclaw doctor --fix` komutunu çalıştırın. Bkz. [Gateway sorunlarını giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config).

Tüm dosyayı kurtarma yalnızca doctor onarımı için ayrılmıştır. Plugin şeması değişiklikleri veya `minHostVersion` sapmaları; modeller, sağlayıcılar, kimlik doğrulama profilleri, kanallar, Gateway erişimi, araçlar, bellek, tarayıcı ya da cron yapılandırması gibi ilgisiz kullanıcı ayarlarını geri almak yerine açıkça hata vermeye devam eder.

## Onarım döngüsü

`openclaw config validate` başarılı olduktan sonra, her değişikliği aynı terminalden doğrularken gömülü bir ajanın etkin yapılandırmayı belgelerle karşılaştırmasını sağlamak için yerel TUI'yi kullanın:

```bash
openclaw chat
```

TUI içinde, baştaki bir `!` işareti değişmez bir yerel kabuk komutu çalıştırır (oturum başına bir kez gösterilen onay isteminden sonra):

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="Belgelerle karşılaştırın">
    Ajandan mevcut yapılandırmanızı ilgili belge sayfasıyla karşılaştırmasını ve en küçük düzeltmeyi önermesini isteyin.
  </Step>
  <Step title="Hedefli düzenlemeleri uygulayın">
    Hedefli düzenlemeleri `openclaw config set` veya `openclaw configure` ile uygulayın.
  </Step>
  <Step title="Yeniden doğrulayın">
    Her değişiklikten sonra `openclaw config validate` komutunu yeniden çalıştırın.
  </Step>
  <Step title="Çalışma zamanı sorunları için Doctor">
    Doğrulama başarılı olduğu hâlde çalışma zamanı hâlâ sağlıksızsa geçiş ve onarım yardımı için `openclaw doctor` veya `openclaw doctor --fix` komutunu çalıştırın.
  </Step>
</Steps>

## İlgili

- [CLI başvurusu](/tr/cli)
- [Yapılandırma](/tr/gateway/configuration)
