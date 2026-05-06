---
read_when:
    - Yapılandırmayı etkileşimsiz olarak okumak veya düzenlemek istiyorsunuz
sidebarTitle: Config
summary: '`openclaw config` için CLI referansı (get/set/patch/unset/file/schema/validate)'
title: Yapılandırma
x-i18n:
    generated_at: "2026-05-06T17:52:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4e0d580347e162278277ddb33eed0e42105c5e85bac4325c07fa2cd700b831d
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` içinde etkileşimsiz düzenlemeler için config yardımcıları: path üzerinden değerleri get/set/patch/unset/file/schema/validate yapar ve etkin config dosyasını yazdırır. Yapılandırma sihirbazını açmak için alt komut olmadan çalıştırın (`openclaw configure` ile aynı).

<Note>
`OPENCLAW_NIX_MODE=1` olduğunda, OpenClaw `openclaw.json` dosyasını değişmez olarak ele alır. `config get`, `config file`, `config schema` ve `config validate` gibi salt okunur komutlar yine çalışır, ancak config yazıcıları reddeder. Agents bunun yerine kurulumun Nix kaynağını düzenlemelidir; birinci taraf nix-openclaw dağıtımı için [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) kullanın ve değerleri `programs.openclaw.config` veya `instances.<name>.config` altında ayarlayın.
</Note>

## Kök seçenekler

<ParamField path="--section <section>" type="string">
  `openclaw config` komutunu alt komut olmadan çalıştırdığınızda yinelenebilir kılavuzlu kurulum bölümü filtresi.
</ParamField>

Desteklenen kılavuzlu bölümler: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

`openclaw.json` için oluşturulan JSON şemasını JSON olarak stdout’a yazdırır.

<AccordionGroup>
  <Accordion title="What it includes">
    - Geçerli kök config şeması ve düzenleyici araçları için kök `$schema` string alanı.
    - Control UI tarafından kullanılan alan `title` ve `description` dokümantasyon metaverisi.
    - İç içe object, wildcard (`*`) ve array-item (`[]`) düğümleri, eşleşen alan dokümantasyonu varsa aynı `title` / `description` metaverisini devralır.
    - `anyOf` / `oneOf` / `allOf` dalları da eşleşen alan dokümantasyonu varsa aynı dokümantasyon metaverisini devralır.
    - Runtime manifestleri yüklenebildiğinde en iyi çaba ile canlı Plugin + kanal şema metaverisi.
    - Geçerli config geçersiz olduğunda bile temiz bir fallback şeması.

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup`, sığ bir şema düğümü (`title`, `description`, `type`, `enum`, `const`, ortak sınırlar), eşleşen UI ipucu metaverisi ve doğrudan alt özetlerle normalleştirilmiş tek bir config path döndürür. Control UI veya özel istemcilerde path kapsamlı ayrıntı incelemesi için kullanın.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Başka araçlarla incelemek veya doğrulamak istediğinizde bir dosyaya pipe edin:

```bash
openclaw config schema > openclaw.schema.json
```

### Path’ler

Path’ler nokta veya köşeli parantez gösterimi kullanır:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Belirli bir agent’ı hedeflemek için agent liste indeksini kullanın:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Değerler

Değerler mümkün olduğunda JSON5 olarak ayrıştırılır; aksi takdirde string olarak ele alınır. JSON5 ayrıştırmasını zorunlu kılmak için `--strict-json` kullanın. `--json`, eski alias olarak desteklenmeye devam eder.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`, ham değeri terminal biçimli metin yerine JSON olarak yazdırır.

<Note>
Object ataması varsayılan olarak hedef path’i değiştirir. `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` ve `auth.profiles` gibi kullanıcı tarafından eklenen girdileri yaygın olarak tutan korumalı map/list path’leri, `--replace` geçmediğiniz sürece mevcut girdileri kaldıracak değiştirmeleri reddeder.
</Note>

Bu map’lere girdi eklerken `--merge` kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

`--replace` yalnızca verilen değerin eksiksiz hedef değer olmasını bilerek istediğinizde kullanın.

## `config set` modları

`openclaw config set` dört atama stilini destekler:

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
    Provider oluşturucu modu yalnızca `secrets.providers.<alias>` path’lerini hedefler:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch mode">
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
SecretRef atamaları desteklenmeyen runtime’da değiştirilebilir yüzeylerde reddedilir (örneğin `hooks.token`, `commands.ownerDisplaySecret`, Discord thread-binding Webhook token’ları ve WhatsApp creds JSON). Bkz. [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface).
</Warning>

Batch ayrıştırma her zaman doğruluk kaynağı olarak batch payload’ını (`--batch-json`/`--batch-file`) kullanır. `--strict-json` / `--json`, batch ayrıştırma davranışını değiştirmez.

## `config patch`

Path tabanlı çok sayıda `config set` komutu çalıştırmak yerine config biçimli bir patch yapıştırmak veya pipe etmek istediğinizde `config patch` kullanın. Girdi bir JSON5 object’tir. Object’ler özyinelemeli olarak merge edilir, array’ler ve skaler değerler hedef değerin yerini alır, `null` hedef path’i siler.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Uzak kurulum script’leri için kullanışlı olan stdin üzerinden de patch pipe edebilirsiniz:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Örnek patch:

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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

Bir object veya array özyinelemeli olarak patch edilmek yerine tam olarak verilen değer olmalıysa `--replace-path <path>` kullanın:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run`, yazmadan şema ve SecretRef çözümlenebilirlik kontrollerini çalıştırır. Exec destekli SecretRef’ler dry-run sırasında varsayılan olarak atlanır; dry-run’ın provider komutlarını yürütmesini bilerek istiyorsanız `--allow-exec` ekleyin.

JSON path/değer modu hem SecretRef’ler hem provider’lar için desteklenmeye devam eder:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider oluşturucu flag’leri

Provider oluşturucu hedefleri path olarak `secrets.providers.<alias>` kullanmalıdır.

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (yinelenebilir)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (zorunlu)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
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

Sertleştirilmiş exec provider örneği:

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

## Dry run

`openclaw.json` yazmadan değişiklikleri doğrulamak için `--dry-run` kullanın.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

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
  <Accordion title="Dry-run behavior">
    - Oluşturucu modu: değişen ref’ler/provider’lar için SecretRef çözümlenebilirlik kontrollerini çalıştırır.
    - JSON modu (`--strict-json`, `--json` veya batch modu): şema doğrulamasını ve SecretRef çözümlenebilirlik kontrollerini çalıştırır.
    - Bilinen desteklenmeyen SecretRef hedef yüzeyleri için ilke doğrulaması da çalışır.
    - İlke kontrolleri değişiklik sonrası config’in tamamını değerlendirir, bu nedenle üst object yazmaları (örneğin `hooks` değerini object olarak ayarlamak) desteklenmeyen yüzey doğrulamasını atlayamaz.
    - Exec SecretRef kontrolleri komut yan etkilerini önlemek için dry-run sırasında varsayılan olarak atlanır.
    - Exec SecretRef kontrollerine dahil olmak için `--dry-run` ile `--allow-exec` kullanın (bu provider komutlarını yürütebilir).
    - `--allow-exec` yalnızca dry-run içindir ve `--dry-run` olmadan kullanılırsa hata verir.

  </Accordion>
  <Accordion title="--dry-run --json fields">
    `--dry-run --json`, makine tarafından okunabilir bir rapor yazdırır:

    - `ok`: dry-run'ın geçip geçmediği
    - `operations`: değerlendirilen atama sayısı
    - `checks`: şema/çözülebilirlik kontrollerinin çalışıp çalışmadığı
    - `checks.resolvabilityComplete`: çözülebilirlik kontrollerinin tamamlanana kadar çalışıp çalışmadığı (exec referansları atlandığında false)
    - `refsChecked`: dry-run sırasında gerçekten çözümlenen referans sayısı
    - `skippedExecRefs`: `--allow-exec` ayarlanmadığı için atlanan exec referans sayısı
    - `errors`: `ok=false` olduğunda yapılandırılmış şema/çözülebilirlik hataları

  </Accordion>
</AccordionGroup>

### JSON çıktı biçimi

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
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
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Dry-run başarısız olursa">
    - `config schema validation failed`: değişiklik sonrası yapılandırma biçiminiz geçersiz; yolu/değeri veya sağlayıcı/ref nesnesi biçimini düzeltin.
    - `Config policy validation failed: unsupported SecretRef usage`: bu kimlik bilgisini yeniden düz metin/dize girdisine taşıyın ve SecretRef'leri yalnızca desteklenen yüzeylerde tutun.
    - `SecretRef assignment(s) could not be resolved`: başvurulan sağlayıcı/ref şu anda çözülemiyor (eksik env değişkeni, geçersiz dosya işaretçisi, exec sağlayıcısı hatası veya sağlayıcı/kaynak uyumsuzluğu).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run exec ref'lerini atladı; exec çözülebilirlik doğrulamasına ihtiyacınız varsa `--allow-exec` ile yeniden çalıştırın.
    - Toplu mod için, başarısız girdileri düzeltin ve yazmadan önce `--dry-run`'ı yeniden çalıştırın.

  </Accordion>
</AccordionGroup>

## Yazma güvenliği

`openclaw config set` ve OpenClaw'a ait diğer yapılandırma yazıcıları, diske kaydetmeden önce değişiklik sonrası tam yapılandırmayı doğrular. Yeni yük şema doğrulamasından geçmezse veya yıkıcı bir üzerine yazma gibi görünürse, aktif yapılandırmaya dokunulmaz ve reddedilen yük yanına `openclaw.json.rejected.*` olarak kaydedilir.

<Warning>
Aktif yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlı `openclaw.json` düzenleri yazma işlemleri için desteklenmez; bunun yerine gerçek dosyayı doğrudan göstermek için `OPENCLAW_CONFIG_PATH` kullanın.
</Warning>

Küçük düzenlemeler için CLI yazmalarını tercih edin:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Bir yazma reddedilirse, kaydedilen yükü inceleyin ve tam yapılandırma biçimini düzeltin:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Doğrudan düzenleyiciyle yazmalara hâlâ izin verilir, ancak çalışan Gateway bunları doğrulanana kadar güvenilmeyen olarak ele alır. Geçersiz doğrudan düzenlemeler başlangıcı başarısız kılar veya hot reload tarafından atlanır; Gateway `openclaw.json` dosyasını yeniden yazmaz. Öneklenmiş/üzerine yazılmış yapılandırmayı onarmak veya bilinen son iyi kopyayı geri yüklemek için `openclaw doctor --fix` çalıştırın. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config).

Tüm dosya kurtarma yalnızca doctor onarımı için ayrılmıştır. Plugin şeması değişiklikleri veya `minHostVersion` uyumsuzluğu, modeller, sağlayıcılar, auth profilleri, kanallar, Gateway açığa çıkarma, araçlar, bellek, tarayıcı veya Cron yapılandırması gibi ilgisiz kullanıcı ayarlarını geri almak yerine görünür kalır.

## Alt komutlar

- `config file`: Aktif yapılandırma dosyası yolunu yazdırır (`OPENCLAW_CONFIG_PATH` veya varsayılan konumdan çözümlenir). Yol bir sembolik bağlantıyı değil, normal bir dosyayı adlandırmalıdır.

Düzenlemelerden sonra Gateway'i yeniden başlatın.

## Doğrulama

Gateway'i başlatmadan mevcut yapılandırmayı aktif şemaya göre doğrulayın.

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` geçtikten sonra, aynı terminalden her değişikliği doğrularken gömülü bir ajanın aktif yapılandırmayı dokümanlarla karşılaştırması için yerel TUI'yi kullanabilirsiniz:

<Note>
Doğrulama zaten başarısız oluyorsa, `openclaw configure` veya `openclaw doctor --fix` ile başlayın. `openclaw chat` geçersiz yapılandırma korumasını atlamaz.
</Note>

```bash
openclaw chat
```

Ardından TUI içinde:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Tipik onarım döngüsü:

<Steps>
  <Step title="Dokümanlarla karşılaştır">
    Ajanın mevcut yapılandırmanızı ilgili doküman sayfasıyla karşılaştırmasını ve en küçük düzeltmeyi önermesini isteyin.
  </Step>
  <Step title="Hedefli düzenlemeleri uygula">
    Hedefli düzenlemeleri `openclaw config set` veya `openclaw configure` ile uygulayın.
  </Step>
  <Step title="Yeniden doğrula">
    Her değişiklikten sonra `openclaw config validate` komutunu yeniden çalıştırın.
  </Step>
  <Step title="Çalışma zamanı sorunları için doctor">
    Doğrulama geçiyor ancak çalışma zamanı hâlâ sağlıksızsa, geçiş ve onarım yardımı için `openclaw doctor` veya `openclaw doctor --fix` çalıştırın.
  </Step>
</Steps>

## İlgili

- [CLI referansı](/tr/cli)
- [Yapılandırma](/tr/gateway/configuration)
