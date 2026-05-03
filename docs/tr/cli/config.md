---
read_when:
    - Yapılandırmayı etkileşimsiz olarak okumak veya düzenlemek istiyorsunuz
sidebarTitle: Config
summary: '`openclaw config` için CLI başvurusu (get/set/patch/unset/file/schema/validate)'
title: Yapılandırma
x-i18n:
    generated_at: "2026-05-03T21:28:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7be6a2ff8474fe78deb1d32dd822a4cf8a2b420dfb45306be5d7c5a1d54f0b4d
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` içinde etkileşimsiz düzenlemeler için yapılandırma yardımcıları: değerleri yola göre get/set/patch/unset/file/schema/validate yapar ve etkin yapılandırma dosyasını yazdırır. Yapılandırma sihirbazını açmak için alt komut olmadan çalıştırın (`openclaw configure` ile aynı).

## Kök seçenekler

<ParamField path="--section <section>" type="string">
  `openclaw config` komutunu alt komut olmadan çalıştırdığınızda tekrarlanabilir rehberli kurulum bölüm filtresi.
</ParamField>

Desteklenen rehberli bölümler: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

`openclaw.json` için oluşturulan JSON şemasını JSON olarak stdout'a yazdırır.

<AccordionGroup>
  <Accordion title="Neleri içerir">
    - Geçerli kök yapılandırma şeması ve düzenleyici araçları için kök `$schema` dize alanı.
    - Control UI tarafından kullanılan `title` ve `description` belge meta verileri.
    - İç içe nesne, wildcard (`*`) ve dizi öğesi (`[]`) düğümleri, eşleşen alan dokümantasyonu bulunduğunda aynı `title` / `description` meta verilerini devralır.
    - `anyOf` / `oneOf` / `allOf` dalları da eşleşen alan dokümantasyonu bulunduğunda aynı belge meta verilerini devralır.
    - Çalışma zamanı manifestleri yüklenebildiğinde en iyi çaba kapsamında canlı Plugin + kanal şema meta verileri.
    - Geçerli yapılandırma geçersiz olsa bile temiz bir geri dönüş şeması.

  </Accordion>
  <Accordion title="İlgili çalışma zamanı RPC'si">
    `config.schema.lookup`, sığ bir şema düğümü (`title`, `description`, `type`, `enum`, `const`, yaygın sınırlar), eşleşen UI ipucu meta verileri ve doğrudan alt özetlerle tek bir normalleştirilmiş yapılandırma yolu döndürür. Control UI veya özel istemcilerde yol kapsamlı ayrıntı incelemesi için kullanın.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Başka araçlarla incelemek veya doğrulamak istediğinizde bir dosyaya yönlendirin:

```bash
openclaw config schema > openclaw.schema.json
```

### Yollar

Yollar nokta veya köşeli parantez gösterimi kullanır:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Belirli bir ajanı hedeflemek için ajan listesi dizinini kullanın:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Değerler

Değerler mümkün olduğunda JSON5 olarak ayrıştırılır; aksi takdirde dize olarak ele alınır. JSON5 ayrıştırmasını zorunlu kılmak için `--strict-json` kullanın. `--json`, eski takma ad olarak desteklenmeye devam eder.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`, ham değeri terminal biçimli metin yerine JSON olarak yazdırır.

<Note>
Nesne ataması varsayılan olarak hedef yolu değiştirir. `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` ve `auth.profiles` gibi genellikle kullanıcı tarafından eklenen girdileri tutan korumalı eşleme/liste yolları, `--replace` iletmediğiniz sürece mevcut girdileri kaldıracak değiştirmeleri reddeder.
</Note>

Bu eşlemelere girdi eklerken `--merge` kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

`--replace` seçeneğini yalnızca sağlanan değerin hedef değerin tamamı olmasını özellikle istediğinizde kullanın.

## `config set` modları

`openclaw config set` dört atama stilini destekler:

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
    Sağlayıcı oluşturucu modu yalnızca `secrets.providers.<alias>` yollarını hedefler:

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Toplu mod">
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
SecretRef atamaları desteklenmeyen çalışma zamanında değiştirilebilir yüzeylerde reddedilir (örneğin `hooks.token`, `commands.ownerDisplaySecret`, Discord iş parçacığı bağlama Webhook token'ları ve WhatsApp kimlik bilgileri JSON'u). Bkz. [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface).
</Warning>

Toplu ayrıştırma her zaman doğruluk kaynağı olarak toplu yükü (`--batch-json`/`--batch-file`) kullanır. `--strict-json` / `--json`, toplu ayrıştırma davranışını değiştirmez.

## `config patch`

Birçok yol tabanlı `config set` komutu çalıştırmak yerine yapılandırma biçimli bir yamayı yapıştırmak veya pipe etmek istediğinizde `config patch` kullanın. Girdi bir JSON5 nesnesidir. Nesneler özyinelemeli olarak birleştirilir, diziler ve skaler değerler hedef değerin yerini alır, `null` ise hedef yolu siler.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Bir yamayı stdin üzerinden de pipe edebilirsiniz; bu, uzak kurulum betikleri için kullanışlıdır:

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

Bir nesne veya dizinin özyinelemeli olarak yamalanmak yerine tam olarak sağlanan değer olmasını istediğinizde `--replace-path <path>` kullanın:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run`, yazmadan şema ve SecretRef çözümlenebilirlik kontrollerini çalıştırır. exec destekli SecretRef'ler dry-run sırasında varsayılan olarak atlanır; dry-run'ın sağlayıcı komutlarını çalıştırmasını özellikle istediğinizde `--allow-exec` ekleyin.

JSON yol/değer modu hem SecretRef'ler hem de sağlayıcılar için desteklenmeye devam eder:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Sağlayıcı oluşturucu bayrakları

Sağlayıcı oluşturucu hedefleri yol olarak `secrets.providers.<alias>` kullanmalıdır.

<AccordionGroup>
  <Accordion title="Ortak bayraklar">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env sağlayıcısı (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (tekrarlanabilir)

  </Accordion>
  <Accordion title="Dosya sağlayıcısı (--provider-source file)">
    - `--provider-path <path>` (gerekli)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec sağlayıcısı (--provider-source exec)">
    - `--provider-command <path>` (gerekli)
    - `--provider-arg <arg>` (tekrarlanabilir)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (tekrarlanabilir)
    - `--provider-pass-env <ENV_VAR>` (tekrarlanabilir)
    - `--provider-trusted-dir <path>` (tekrarlanabilir)
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

## Dry-run

`openclaw.json` dosyasına yazmadan değişiklikleri doğrulamak için `--dry-run` kullanın.

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
  <Accordion title="Dry-run davranışı">
    - Oluşturucu modu: değişen ref'ler/sağlayıcılar için SecretRef çözümlenebilirlik kontrollerini çalıştırır.
    - JSON modu (`--strict-json`, `--json` veya toplu mod): şema doğrulamasını ve SecretRef çözümlenebilirlik kontrollerini çalıştırır.
    - Bilinen desteklenmeyen SecretRef hedef yüzeyleri için ilke doğrulaması da çalışır.
    - İlke kontrolleri değişiklik sonrası yapılandırmanın tamamını değerlendirir; bu nedenle üst nesne yazımları (örneğin `hooks` değerini nesne olarak ayarlamak) desteklenmeyen yüzey doğrulamasını aşamaz.
    - Komut yan etkilerinden kaçınmak için exec SecretRef kontrolleri dry-run sırasında varsayılan olarak atlanır.
    - exec SecretRef kontrollerine açıkça katılmak için `--dry-run` ile `--allow-exec` kullanın (bu, sağlayıcı komutlarını çalıştırabilir).
    - `--allow-exec` yalnızca dry-run içindir ve `--dry-run` olmadan kullanılırsa hata verir.

  </Accordion>
  <Accordion title="--dry-run --json alanları">
    `--dry-run --json`, makine tarafından okunabilir bir rapor yazdırır:

    - `ok`: dry-run'ın başarılı olup olmadığı
    - `operations`: değerlendirilen atama sayısı
    - `checks`: şema/çözümlenebilirlik kontrollerinin çalışıp çalışmadığı
    - `checks.resolvabilityComplete`: çözümlenebilirlik kontrollerinin tamamlanana kadar çalışıp çalışmadığı (exec ref'ler atlandığında false)
    - `refsChecked`: dry-run sırasında gerçekten çözümlenen ref sayısı
    - `skippedExecRefs`: `--allow-exec` ayarlanmadığı için atlanan exec ref sayısı
    - `errors`: `ok=false` olduğunda yapılandırılmış şema/çözümlenebilirlik hataları

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
    - `config schema validation failed`: değişiklik sonrası config biçiminiz geçersiz; yolu/değeri veya provider/ref nesnesi biçimini düzeltin.
    - `Config policy validation failed: unsupported SecretRef usage`: bu kimlik bilgisini tekrar düz metin/string girdisine taşıyın ve SecretRef'leri yalnızca desteklenen yüzeylerde tutun.
    - `SecretRef assignment(s) could not be resolved`: başvurulan provider/ref şu anda çözümlenemiyor (eksik env var, geçersiz dosya işaretçisi, exec provider hatası veya provider/kaynak uyuşmazlığı).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run exec ref'lerini atladı; exec çözümlenebilirlik doğrulamasına ihtiyacınız varsa `--allow-exec` ile yeniden çalıştırın.
    - Toplu mod için, başarısız girdileri düzeltin ve yazmadan önce `--dry-run` komutunu yeniden çalıştırın.

  </Accordion>
</AccordionGroup>

## Yazma güvenliği

`openclaw config set` ve OpenClaw'a ait diğer config yazıcıları, diske kaydetmeden önce değişiklik sonrası config'in tamamını doğrular. Yeni yük schema doğrulamasından geçemezse veya yıkıcı bir üzerine yazma gibi görünürse, etkin config'e dokunulmaz ve reddedilen yük yanına `openclaw.json.rejected.*` olarak kaydedilir.

<Warning>
Etkin config yolu normal bir dosya olmalıdır. Symlink kullanılan `openclaw.json` düzenleri yazma için desteklenmez; bunun yerine gerçek dosyayı doğrudan göstermek için `OPENCLAW_CONFIG_PATH` kullanın.
</Warning>

Küçük düzenlemeler için CLI yazmalarını tercih edin:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Bir yazma reddedilirse, kaydedilen yükü inceleyin ve tam config biçimini düzeltin:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Doğrudan editör yazmalarına hâlâ izin verilir, ancak çalışan Gateway bunları doğrulanana kadar güvenilmeyen olarak ele alır. Geçersiz doğrudan düzenlemeler başlatmayı başarısız kılar veya hot reload tarafından atlanır; Gateway `openclaw.json` dosyasını yeniden yazmaz. Önek eklenmiş/üzerine yazılmış config'i onarmak veya bilinen son iyi kopyayı geri yüklemek için `openclaw doctor --fix` komutunu çalıştırın. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config).

Tam dosya kurtarma doctor onarımı için ayrılmıştır. Plugin schema değişiklikleri veya `minHostVersion` uyumsuzluğu, modeller, provider'lar, kimlik doğrulama profilleri, kanallar, gateway erişimi, araçlar, bellek, tarayıcı veya cron config'i gibi ilgisiz kullanıcı ayarlarını geri almak yerine görünür hata olarak kalır.

## Alt komutlar

- `config file`: Etkin config dosyası yolunu yazdırır (`OPENCLAW_CONFIG_PATH` veya varsayılan konumdan çözümlenir). Yol bir symlink değil, normal bir dosya olmalıdır.

Düzenlemelerden sonra gateway'i yeniden başlatın.

## Doğrulama

Gateway'i başlatmadan mevcut config'i etkin schema'ya göre doğrulayın.

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` başarılı olduktan sonra, her değişikliği aynı terminalden doğrularken yerel TUI'ı kullanarak gömülü bir ajanın etkin config'i dokümanlarla karşılaştırmasını sağlayabilirsiniz:

<Note>
Doğrulama zaten başarısız oluyorsa `openclaw configure` veya `openclaw doctor --fix` ile başlayın. `openclaw chat` geçersiz config korumasını atlatmaz.
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
  <Step title="Dokümanlarla karşılaştırın">
    Ajanın mevcut config'inizi ilgili doküman sayfasıyla karşılaştırmasını ve en küçük düzeltmeyi önermesini isteyin.
  </Step>
  <Step title="Hedefli düzenlemeleri uygulayın">
    `openclaw config set` veya `openclaw configure` ile hedefli düzenlemeleri uygulayın.
  </Step>
  <Step title="Yeniden doğrulayın">
    Her değişiklikten sonra `openclaw config validate` komutunu yeniden çalıştırın.
  </Step>
  <Step title="Çalışma zamanı sorunları için Doctor">
    Doğrulama başarılıysa ancak çalışma zamanı hâlâ sağlıklı değilse, migration ve onarım yardımı için `openclaw doctor` veya `openclaw doctor --fix` komutunu çalıştırın.
  </Step>
</Steps>

## İlgili

- [CLI referansı](/tr/cli)
- [Configuration](/tr/gateway/configuration)
