---
read_when:
    - Yapılandırmayı etkileşimli olmayan şekilde okumak veya düzenlemek istiyorsunuz
sidebarTitle: Config
summary: '`openclaw config` için CLI başvurusu (get/set/patch/unset/file/schema/validate)'
title: Yapılandırma
x-i18n:
    generated_at: "2026-07-12T11:34:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` için etkileşimsiz yardımcılar: yol üzerinden bir değeri getirin/ayarlayın/yamalayın/kaldırın, şemayı doğrulayın veya etkin dosya yolunu yazdırın. Alt komut olmadan `openclaw config` çalıştırıldığında, `openclaw configure` ile aynı yönlendirmeli sihirbaz açılır.

<Note>
`OPENCLAW_NIX_MODE=1` olduğunda OpenClaw, `openclaw.json` dosyasını değiştirilemez olarak değerlendirir. Salt okunur komutlar (`config get`, `config file`, `config schema`, `config validate`) çalışmaya devam eder; yapılandırma yazıcıları işlemi reddeder. Bunun yerine kurulumun Nix kaynağını düzenleyin; birinci taraf nix-openclaw dağıtımı için [nix-openclaw Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kılavuzunu kullanın ve değerleri `programs.openclaw.config` veya `instances.<name>.config` altında ayarlayın.
</Note>

## Kök seçenekleri

<ParamField path="--section <section>" type="string">
  Alt komut olmadan `openclaw config` çalıştırdığınızda kullanılabilen, yinelenebilir yönlendirmeli kurulum bölümü filtresi.
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

Nokta veya köşeli ayraç gösterimi. zsh'nin `[0]` ifadesini glob deseni olarak genişletmemesi için kabuk örneklerindeki köşeli ayraçlı yolları tırnak içine alın:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

Gizli bilgileri çıkarılmış yapılandırma anlık görüntüsünden bir değer okur (gizli bilgiler hiçbir zaman yazdırılmaz). `--json`, ham değeri JSON olarak yazdırır; aksi takdirde dizeler/sayılar/boole değerleri yalın, nesneler/diziler ise biçimlendirilmiş JSON olarak yazdırılır.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

`OPENCLAW_CONFIG_PATH` veya varsayılan konumdan çözümlenen etkin yapılandırma dosyasının yolunu yazdırır. Yol, sembolik bağlantıyı değil normal bir dosyayı belirtir; bkz. [Yazma güvenliği](#write-safety).

### `config schema`

`openclaw.json` için oluşturulan JSON şemasını standart çıktıya yazdırır.

<AccordionGroup>
  <Accordion title="İçerdikleri">
    - Geçerli kök yapılandırma şeması ve düzenleyici araçları için kök düzeyinde bir `$schema` dize alanı.
    - Control UI tarafından kullanılan `title` / `description` alan dokümantasyonu meta verileri.
    - Eşleşen alan dokümantasyonu mevcut olduğunda iç içe nesne, joker karakter (`*`) ve dizi öğesi (`[]`) düğümleri aynı `title` / `description` meta verilerini devralır.
    - `anyOf` / `oneOf` / `allOf` dalları da aynı dokümantasyon meta verilerini devralır.
    - Çalışma zamanı manifestleri yüklenebildiğinde azami çabayla elde edilen canlı Plugin + kanal şeması meta verileri.
    - Geçerli yapılandırma geçersiz olsa bile temiz bir yedek şema.

  </Accordion>
  <Accordion title="İlgili çalışma zamanı RPC'si">
    `config.schema.lookup`, yüzeysel bir şema düğümü (`title`, `description`, `type`, `enum`, `const`, yaygın sınırlar), eşleşen kullanıcı arayüzü ipucu meta verileri ve doğrudan alt öğe özetleriyle birlikte normalleştirilmiş tek bir yapılandırma yolu döndürür. Control UI veya özel istemcilerde yol kapsamlı ayrıntıya inmek için bunu kullanın.
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

Değerler mümkün olduğunda JSON5 olarak ayrıştırılır; aksi takdirde ham dizeler olarak değerlendirilir. Dizeye geri dönüş olmadan standart JSON gerektirmek için `--strict-json` kullanın (yorumlar, sondaki virgüller veya tırnaksız anahtarlar gibi yalnızca JSON5'e özgü sözdizimleri bu durumda reddedilir). `--json`, `config set` üzerinde `--strict-json` için eski bir takma addır.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`, terminal için biçimlendirilmiş metin yerine ham değeri JSON olarak yazdırır.

<Note>
Nesne ataması varsayılan olarak hedef yolu değiştirir. Genellikle kullanıcı tarafından eklenen girdileri barındıran korumalı yollar, `--replace` iletmediğiniz sürece mevcut girdileri kaldıracak değiştirmeleri reddeder: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries` ve `auth.profiles`.
</Note>

Bu eşlemelere girdiler eklerken `--merge` kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

`--replace` seçeneğini yalnızca sağlanan değerin bilinçli olarak hedef değerin tamamı olması gerektiğinde kullanın.

## `config set` kipleri

<Tabs>
  <Tab title="Değer kipi">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef oluşturucu kipi">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Sağlayıcı oluşturucu kipi">
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
  <Tab title="Toplu kip">
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
SecretRef atamaları, desteklenmeyen ve çalışma zamanında değiştirilebilen yüzeylerde reddedilir (örneğin `hooks.token`, `commands.ownerDisplaySecret`, Discord ileti dizisi bağlama Webhook belirteçleri ve WhatsApp kimlik bilgileri JSON'u). Bkz. [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface).
</Warning>

Toplu ayrıştırma, doğruluk kaynağı olarak her zaman toplu yükü (`--batch-json`/`--batch-file`) kullanır; `--strict-json` / `--json`, toplu ayrıştırma davranışını değiştirmez.

JSON yol/değer kipi, SecretRef'ler ve sağlayıcılar için doğrudan da çalışır:

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
  <Accordion title="Ortam sağlayıcısı (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (yinelenebilir)

  </Accordion>
  <Accordion title="Dosya sağlayıcısı (--provider-source file)">
    - `--provider-path <path>` (zorunlu)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Çalıştırma sağlayıcısı (--provider-source exec)">
    - `--provider-command <path>` (zorunlu)
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

Güçlendirilmiş çalıştırma sağlayıcısı örneği:

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

Yol tabanlı çok sayıda `config set` komutu çalıştırmak yerine yapılandırma biçimli bir JSON5 yamasını yapıştırın veya boru hattıyla aktarın. Nesneler özyinelemeli olarak birleştirilir; diziler ve skaler değerler hedefi değiştirir; `null`, hedef yolu siler.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Uzak kurulum betikleri için bir yamayı standart girdi üzerinden aktarın:

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

Bir nesne veya dizinin özyinelemeli olarak yamalanmak yerine tam olarak sağlanan değer olması gerektiğinde `--replace-path <path>` kullanın:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run`, yazmadan şema ve SecretRef çözümlenebilirliği denetimlerini çalıştırır. Çalıştırma tabanlı SecretRef'ler, deneme çalıştırması sırasında varsayılan olarak atlanır; deneme çalıştırmasının sağlayıcı komutlarını çalıştırmasını bilinçli olarak istediğinizde `--allow-exec` ekleyin.

## Deneme çalıştırması

`--dry-run`, değişiklikleri `openclaw.json` dosyasına yazmadan doğrular. `config set`, `config patch` ve `config unset` üzerinde kullanılabilir.

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
  <Accordion title="Deneme çalıştırması davranışı">
    - Oluşturucu modu: değiştirilen referanslar/sağlayıcılar için SecretRef çözümlenebilirlik denetimlerini çalıştırır.
    - JSON modu (`--strict-json`, `--json` veya toplu iş modu): şema doğrulamasını ve SecretRef çözümlenebilirlik denetimlerini çalıştırır.
    - İlke doğrulaması, değişiklik sonrası yapılandırmanın tamamına uygulanır; bu nedenle üst nesne yazımları (örneğin `hooks` değerini bir nesne olarak ayarlamak) desteklenmeyen yüzey doğrulamasını atlayamaz.
    - Komut yan etkilerini önlemek için Exec SecretRef denetimleri varsayılan olarak atlanır; etkinleştirmek için `--allow-exec` seçeneğini iletin (bu, sağlayıcı komutlarını çalıştırabilir). `--allow-exec` yalnızca deneme çalıştırmasında kullanılabilir ve `--dry-run` olmadan hata verir.

  </Accordion>
  <Accordion title="--dry-run --json alanları">
    - `ok`: deneme çalıştırmasının başarılı olup olmadığı
    - `operations`: değerlendirilen atama sayısı
    - `checks`: şema/çözümlenebilirlik denetimlerinin çalışıp çalışmadığı
    - `checks.resolvabilityComplete`: çözümlenebilirlik denetimlerinin tamamlanıp tamamlanmadığı (exec referansları atlandığında false)
    - `refsChecked`: deneme çalıştırması sırasında gerçekten çözümlenen referans sayısı
    - `skippedExecRefs`: `--allow-exec` ayarlanmadığı için atlanan exec referansı sayısı
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
      ref?: string, // çözümlenebilirlik hatalarında bulunur
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
  <Accordion title="Deneme çalıştırması başarısız olursa">
    - `config schema validation failed`: değişiklik sonrası yapılandırmanızın biçimi geçersizdir; yolu/değeri veya sağlayıcı/referans nesnesinin biçimini düzeltin.
    - `Config policy validation failed: unsupported SecretRef usage`: ilgili kimlik bilgisini yeniden düz metin/dize girdisine taşıyın; SecretRef'leri yalnızca desteklenen yüzeylerde tutun.
    - `SecretRef assignment(s) could not be resolved`: başvurulan sağlayıcı/referans şu anda çözümlenemiyor (eksik ortam değişkeni, geçersiz dosya işaretçisi, exec sağlayıcısı hatası veya sağlayıcı/kaynak uyuşmazlığı).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: exec çözümlenebilirlik doğrulamasına ihtiyacınız varsa `--allow-exec` ile yeniden çalıştırın.
    - Toplu iş modunda, başarısız girdileri düzeltin ve yazma işleminden önce `--dry-run` seçeneğini yeniden çalıştırın.

  </Accordion>
</AccordionGroup>

## Değişiklikleri uygulama

Her başarılı `config set` / `config patch` / `config unset` işleminden sonra CLI, Gateway'in yeniden başlatılması gerekip gerekmediğini bilmeniz için üç ipucundan birini yazdırır:

| İpucu                                              | Anlamı                                              |
| -------------------------------------------------- | --------------------------------------------------- |
| `Restart the gateway to apply.`                    | Değiştirilen yol için tam yeniden başlatma gerekir. |
| `Change will apply without restarting the gateway.` | Çalışırken yeniden yükleme bunu otomatik olarak alır. |
| `No gateway restart needed.`                       | Çalışma zamanıyla ilgili hiçbir şey değişmemiştir.  |

CLI, her Plugin'in yeniden yükleme meta verilerinin yüklendiğini doğrulayamadığından, `plugins.entries` alanına (veya herhangi bir alt yoluna) yapılan yazma işlemleri her zaman yeniden başlatma gerektirir.

## Yazma güvenliği

`openclaw config set` ve OpenClaw'a ait diğer yapılandırma yazıcıları, yapılandırmayı diske kaydetmeden önce değişiklik sonrası yapılandırmanın tamamını doğrular. Yeni yük şema doğrulamasını geçemezse veya yıkıcı bir üzerine yazma gibi görünürse etkin yapılandırmaya dokunulmaz ve reddedilen yük yanına `openclaw.json.rejected.*` olarak kaydedilir.

<Warning>
Etkin yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlantı kullanan `openclaw.json` düzenleri yazma işlemleri için desteklenmez; bunun yerine doğrudan gerçek dosyayı göstermek üzere `OPENCLAW_CONFIG_PATH` kullanın.
</Warning>

Küçük düzenlemelerde CLI ile yazmayı tercih edin:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Bir yazma işlemi reddedilirse kaydedilen yükü inceleyin ve yapılandırmanın tamamını düzeltin:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Düzenleyiciyle doğrudan yazmaya hâlâ izin verilir ancak çalışan Gateway, bunlar doğrulanana kadar güvenilmeyen değişiklikler olarak değerlendirir. Geçersiz doğrudan düzenlemeler başlatmanın başarısız olmasına neden olur veya çalışırken yeniden yükleme tarafından atlanır; Gateway, `openclaw.json` dosyasını yeniden yazmaz. Önek eklenmiş/üzerine yazılmış yapılandırmayı onarmak veya bilinen son sağlam kopyayı geri yüklemek için `openclaw doctor --fix` komutunu çalıştırın. Bkz. [Gateway sorunlarını giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config).

Dosyanın tamamını kurtarma yalnızca doctor onarımına ayrılmıştır. Plugin şeması değişiklikleri veya `minHostVersion` uyumsuzluğu; modeller, sağlayıcılar, kimlik doğrulama profilleri, kanallar, Gateway erişimi, araçlar, bellek, tarayıcı veya Cron yapılandırması gibi ilgisiz kullanıcı ayarlarını geri almak yerine açıkça hata vermeye devam eder.

## Onarım döngüsü

`openclaw config validate` başarılı olduktan sonra, her değişikliği aynı terminalden doğrularken gömülü bir ajanın etkin yapılandırmayı belgelerle karşılaştırmasını sağlamak için yerel TUI'yi kullanın:

```bash
openclaw chat
```

TUI içinde, baştaki `!` işareti değişmez bir yerel kabuk komutunu çalıştırır (oturum başına bir kez gösterilen onay isteminden sonra):

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
    `openclaw config set` veya `openclaw configure` ile hedefli düzenlemeler uygulayın.
  </Step>
  <Step title="Yeniden doğrulayın">
    Her değişiklikten sonra `openclaw config validate` komutunu yeniden çalıştırın.
  </Step>
  <Step title="Çalışma zamanı sorunları için doctor kullanın">
    Doğrulama başarılı olduğu hâlde çalışma zamanı hâlâ sağlıksızsa geçiş ve onarım yardımı için `openclaw doctor` veya `openclaw doctor --fix` komutunu çalıştırın.
  </Step>
</Steps>

## İlgili konular

- [CLI başvurusu](/tr/cli)
- [Yapılandırma](/tr/gateway/configuration)
