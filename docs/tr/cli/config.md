---
read_when:
    - Yapılandırmayı etkileşimsiz olarak okumak veya düzenlemek istiyorsunuz
sidebarTitle: Config
summary: '`openclaw config` için CLI başvurusu (get/set/unset/file/schema/validate)'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-26T11:25:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7871ee03a1da6ab5d0881ace7579ce101a89e9f9d05d1a720ff34fd31fa12a9d
    source_path: cli/config.md
    workflow: 15
---

`openclaw.json` içinde etkileşimsiz düzenlemeler için yapılandırma yardımcıları: yol bazında değerleri get/set/unset/file/schema/validate yapın ve etkin yapılandırma dosyasını yazdırın. Bir alt komut olmadan çalıştırıldığında yapılandırma sihirbazını açar (`openclaw configure` ile aynıdır).

## Kök seçenekleri

<ParamField path="--section <section>" type="string">
  `openclaw config` komutunu alt komut olmadan çalıştırdığınızda, tekrarlanabilir yönlendirmeli kurulum bölüm filtresi.
</ParamField>

Desteklenen yönlendirmeli bölümler: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

`openclaw.json` için oluşturulmuş JSON şemasını stdout'a JSON olarak yazdırır.

<AccordionGroup>
  <Accordion title="Neleri içerir">
    - Geçerli kök yapılandırma şeması ve ayrıca düzenleyici araçları için kök düzeyde bir `$schema` string alanı.
    - Control UI tarafından kullanılan alan `title` ve `description` belge meta verileri.
    - İç içe nesne, joker (`*`) ve dizi öğesi (`[]`) düğümleri; eşleşen alan belgeleri mevcut olduğunda aynı `title` / `description` meta verilerini devralır.
    - `anyOf` / `oneOf` / `allOf` dalları da, eşleşen alan belgeleri mevcut olduğunda aynı belge meta verilerini devralır.
    - Çalışma zamanı manifestleri yüklenebildiğinde, en iyi çaba esaslı canlı Plugin + kanal şema meta verileri.
    - Geçerli yapılandırma geçersiz olsa bile temiz bir yedek şema.

  </Accordion>
  <Accordion title="İlgili çalışma zamanı RPC">
    `config.schema.lookup`, tek bir normalize edilmiş yapılandırma yolunu; sığ bir şema düğümü (`title`, `description`, `type`, `enum`, `const`, yaygın sınırlar), eşleşen UI ipucu meta verileri ve doğrudan alt özetlerle birlikte döndürür. Bunu, Control UI veya özel istemcilerde yol kapsamlı ayrıntılı inceleme için kullanın.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Bunu başka araçlarla incelemek veya doğrulamak istediğinizde bir dosyaya yönlendirin:

```bash
openclaw config schema > openclaw.schema.json
```

### Yollar

Yollar nokta veya köşeli parantez gösterimini kullanır:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Belirli bir ajanı hedeflemek için ajan liste dizinini kullanın:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Değerler

Değerler mümkün olduğunda JSON5 olarak ayrıştırılır; aksi takdirde string olarak ele alınır. JSON5 ayrıştırmasını zorunlu kılmak için `--strict-json` kullanın. `--json`, eski bir takma ad olarak desteklenmeye devam eder.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`, terminale biçimlendirilmiş metin yerine ham değeri JSON olarak yazdırır.

<Note>
Nesne ataması varsayılan olarak hedef yolu değiştirir. `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` ve `auth.profiles` gibi kullanıcı tarafından eklenen girdileri sıkça tutan korumalı map/list yolları; mevcut girdileri kaldıracak değişimleri, siz `--replace` geçmediğiniz sürece reddeder.
</Note>

Bu map'lere girdi eklerken `--merge` kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Sağlanan değerin hedefin tamamı olmasını bilinçli olarak istediğinizde yalnızca `--replace` kullanın.

## `config set` kipleri

`openclaw config set`, dört atama stilini destekler:

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
    Sağlayıcı oluşturucu kipi yalnızca `secrets.providers.<alias>` yollarını hedefler:

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
SecretRef atamaları, desteklenmeyen çalışma zamanı değiştirilebilir yüzeylerde reddedilir (örneğin `hooks.token`, `commands.ownerDisplaySecret`, Discord konu-binding Webhook token'ları ve WhatsApp creds JSON). Bkz. [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface).
</Warning>

Toplu ayrıştırma her zaman doğruluk kaynağı olarak toplu yükü (`--batch-json`/`--batch-file`) kullanır. `--strict-json` / `--json`, toplu ayrıştırma davranışını değiştirmez.

JSON yol/değer kipi, hem SecretRef'ler hem de sağlayıcılar için desteklenmeye devam eder:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Sağlayıcı oluşturucu bayrakları

Sağlayıcı oluşturucu hedefleri, yol olarak `secrets.providers.<alias>` kullanmalıdır.

<AccordionGroup>
  <Accordion title="Yaygın bayraklar">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env sağlayıcısı (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (tekrarlanabilir)

  </Accordion>
  <Accordion title="Dosya sağlayıcısı (--provider-source file)">
    - `--provider-path <path>` (zorunlu)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec sağlayıcısı (--provider-source exec)">
    - `--provider-command <path>` (zorunlu)
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

Sıkılaştırılmış exec sağlayıcısı örneği:

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
    - Oluşturucu kipi: değiştirilen ref/sağlayıcılar için SecretRef çözümlenebilirlik kontrollerini çalıştırır.
    - JSON kipi (`--strict-json`, `--json` veya toplu kip): şema doğrulaması ve SecretRef çözümlenebilirlik kontrollerini çalıştırır.
    - Politika doğrulaması da, desteklenmediği bilinen SecretRef hedef yüzeyleri için çalışır.
    - Politika kontrolleri değişiklik sonrası yapılandırmanın tamamını değerlendirir; bu nedenle üst nesne yazımları (örneğin `hooks` değerini nesne olarak ayarlamak) desteklenmeyen yüzey doğrulamasını atlatamaz.
    - Exec SecretRef kontrolleri, komut yan etkilerinden kaçınmak için dry-run sırasında varsayılan olarak atlanır.
    - Exec SecretRef kontrollerine açıkça izin vermek için `--dry-run` ile birlikte `--allow-exec` kullanın (bu, sağlayıcı komutlarını çalıştırabilir).
    - `--allow-exec` yalnızca dry-run içindir ve `--dry-run` olmadan kullanılırsa hata verir.

  </Accordion>
  <Accordion title="--dry-run --json alanları">
    `--dry-run --json`, makine tarafından okunabilir bir rapor yazdırır:

    - `ok`: dry-run başarılı mı
    - `operations`: değerlendirilen atama sayısı
    - `checks`: şema/çözümlenebilirlik kontrolleri çalıştı mı
    - `checks.resolvabilityComplete`: çözümlenebilirlik kontrolleri tamamlandı mı (exec ref'ler atlandığında `false`)
    - `refsChecked`: dry-run sırasında gerçekten çözümlenen ref sayısı
    - `skippedExecRefs`: `--allow-exec` ayarlanmadığı için atlanan exec ref sayısı
    - `errors`: `ok=false` olduğunda yapılandırılmış şema/çözümlenebilirlik hataları

  </Accordion>
</AccordionGroup>

### JSON çıktı şekli

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
    - `config schema validation failed`: değişiklik sonrası yapılandırma şekliniz geçersiz; yol/değer veya sağlayıcı/ref nesne şeklini düzeltin.
    - `Config policy validation failed: unsupported SecretRef usage`: bu kimlik bilgisini tekrar düz metin/string girdiye taşıyın ve SecretRef'leri yalnızca desteklenen yüzeylerde kullanın.
    - `SecretRef assignment(s) could not be resolved`: başvurulan sağlayıcı/ref şu anda çözümlenemiyor (eksik ortam değişkeni, geçersiz dosya işaretçisi, exec sağlayıcı hatası veya sağlayıcı/kaynak uyumsuzluğu).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run, exec ref'leri atladı; exec çözümlenebilirlik doğrulamasına ihtiyacınız varsa `--allow-exec` ile yeniden çalıştırın.
    - Toplu kip için, başarısız girdileri düzeltin ve yazmadan önce `--dry-run` ile yeniden çalıştırın.

  </Accordion>
</AccordionGroup>

## Yazma güvenliği

`openclaw config set` ve OpenClaw'a ait diğer yapılandırma yazıcıları, diske kaydetmeden önce değişiklik sonrası yapılandırmanın tamamını doğrular. Yeni yük şema doğrulamasını geçmezse veya yıkıcı bir ezme gibi görünürse, etkin yapılandırma olduğu gibi bırakılır ve reddedilen yük yanına `openclaw.json.rejected.*` olarak kaydedilir.

<Warning>
Etkin yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlantılı `openclaw.json` düzenleri yazma için desteklenmez; bunun yerine doğrudan gerçek dosyayı işaret etmek için `OPENCLAW_CONFIG_PATH` kullanın.
</Warning>

Küçük düzenlemeler için CLI yazımlarını tercih edin:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Bir yazım reddedilirse, kaydedilen yükü inceleyin ve yapılandırmanın tam şeklini düzeltin:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Doğrudan düzenleyici yazımlarına hâlâ izin verilir, ancak çalışan Gateway bunları doğrulanana kadar güvenilmeyen olarak değerlendirir. Geçersiz doğrudan düzenlemeler, başlangıç veya sıcak yeniden yükleme sırasında son bilinen iyi yedekten geri yüklenebilir. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config).

Tüm dosya kurtarma, ayrıştırma hataları, kök düzey şema hataları, eski geçiş hataları veya karışık Plugin ve kök hataları gibi genel olarak bozuk yapılandırmalar için ayrılmıştır. Doğrulama yalnızca `plugins.entries.<id>...` altında başarısız olursa, OpenClaw etkin `openclaw.json` dosyasını yerinde tutar ve `.last-good` dosyasını geri yüklemek yerine Plugin'e yerel sorunu bildirir. Bu, Plugin şema değişikliklerinin veya `minHostVersion` uyumsuzluğunun; modeller, sağlayıcılar, kimlik doğrulama profilleri, kanallar, Gateway görünürlüğü, araçlar, bellek, tarayıcı veya cron yapılandırması gibi ilgisiz kullanıcı ayarlarını geri almasını önler.

## Alt komutlar

- `config file`: Etkin yapılandırma dosyası yolunu yazdırır (`OPENCLAW_CONFIG_PATH` veya varsayılan konumdan çözülür). Yol, bir sembolik bağlantıyı değil, normal bir dosyayı adlandırmalıdır.

Düzenlemelerden sonra gateway'i yeniden başlatın.

## Validate

Gateway'i başlatmadan mevcut yapılandırmayı etkin şemaya karşı doğrulayın.

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` başarılı olduktan sonra, her değişikliği aynı terminalden doğrularken gömülü bir ajanın etkin yapılandırmayı belgelerle karşılaştırmasını sağlamak için yerel TUI'yi kullanabilirsiniz:

<Note>
Doğrulama zaten başarısız oluyorsa, `openclaw configure` veya `openclaw doctor --fix` ile başlayın. `openclaw chat`, geçersiz yapılandırma korumasını aşmaz.
</Note>

```bash
openclaw chat
```

Sonra TUI içinde:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Tipik onarım döngüsü:

<Steps>
  <Step title="Belgelerle karşılaştır">
    Ajandan mevcut yapılandırmanızı ilgili belge sayfasıyla karşılaştırmasını ve en küçük düzeltmeyi önermesini isteyin.
  </Step>
  <Step title="Hedefli düzenlemeleri uygula">
    `openclaw config set` veya `openclaw configure` ile hedefli düzenlemeleri uygulayın.
  </Step>
  <Step title="Yeniden doğrula">
    Her değişiklikten sonra `openclaw config validate` komutunu yeniden çalıştırın.
  </Step>
  <Step title="Çalışma zamanı sorunları için doctor">
    Doğrulama geçiyorsa ancak çalışma zamanı hâlâ sağlıksızsa, geçiş ve onarım yardımı için `openclaw doctor` veya `openclaw doctor --fix` çalıştırın.
  </Step>
</Steps>

## İlgili

- [CLI başvurusu](/tr/cli)
- [Yapılandırma](/tr/gateway/configuration)
