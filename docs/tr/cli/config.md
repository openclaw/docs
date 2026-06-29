---
read_when:
    - Yapılandırmayı etkileşimli olmayan şekilde okumak veya düzenlemek istiyorsunuz
sidebarTitle: Config
summary: '`openclaw config` için CLI referansı (get/set/patch/unset/file/schema/validate)'
title: Yapılandırma
x-i18n:
    generated_at: "2026-06-28T22:33:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` içinde etkileşimsiz düzenlemeler için yapılandırma yardımcıları: yola göre değerleri get/set/patch/unset/file/schema/validate edin ve etkin yapılandırma dosyasını yazdırın. Yapılandırma sihirbazını açmak için alt komut olmadan çalıştırın (`openclaw configure` ile aynı).

<Note>
`OPENCLAW_NIX_MODE=1` olduğunda OpenClaw, `openclaw.json` dosyasını değişmez kabul eder. `config get`, `config file`, `config schema` ve `config validate` gibi salt okunur komutlar çalışmaya devam eder, ancak yapılandırma yazıcıları reddeder. Agents bunun yerine kurulumun Nix kaynağını düzenlemelidir; birinci taraf nix-openclaw dağıtımı için [nix-openclaw Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kullanın ve değerleri `programs.openclaw.config` veya `instances.<name>.config` altında ayarlayın.
</Note>

## Kök seçenekler

<ParamField path="--section <section>" type="string">
  `openclaw config` komutunu alt komut olmadan çalıştırdığınızda tekrarlanabilir kılavuzlu kurulum bölüm filtresi.
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

### `config schema`

`openclaw.json` için oluşturulan JSON şemasını JSON olarak stdout'a yazdırın.

<AccordionGroup>
  <Accordion title="Neleri içerir">
    - Geçerli kök yapılandırma şeması ve editör araçları için kök `$schema` dize alanı.
    - Control UI tarafından kullanılan alan `title` ve `description` dokümantasyon meta verileri.
    - İç içe nesne, joker (`*`) ve dizi öğesi (`[]`) düğümleri, eşleşen alan dokümantasyonu varsa aynı `title` / `description` meta verilerini devralır.
    - `anyOf` / `oneOf` / `allOf` dalları da eşleşen alan dokümantasyonu varsa aynı dokümantasyon meta verilerini devralır.
    - Çalışma zamanı manifestleri yüklenebildiğinde en iyi çabayla canlı Plugin + kanal şema meta verileri.
    - Geçerli yapılandırma geçersiz olduğunda bile temiz bir yedek şema.

  </Accordion>
  <Accordion title="İlgili çalışma zamanı RPC'si">
    `config.schema.lookup`, sığ bir şema düğümü (`title`, `description`, `type`, `enum`, `const`, yaygın sınırlar), eşleşen UI ipucu meta verileri ve doğrudan alt özetleriyle tek bir normalize edilmiş yapılandırma yolu döndürür. Control UI veya özel istemcilerde yol kapsamlı ayrıntılı inceleme için kullanın.
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

Yollar nokta veya köşeli parantez gösterimini kullanır. Kabuk örneklerinde köşeli parantez gösterimli yolları tırnak içine alın; böylece zsh gibi kabuklar, OpenClaw yolu almadan önce `[0]` ifadesini glob olarak genişletmez:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

Belirli bir agent'ı hedeflemek için agent listesi indeksini kullanın:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Değerler

Değerler mümkün olduğunda JSON5 olarak ayrıştırılır; aksi halde dize olarak işlenir. Dize yedeği olmadan standart JSON ayrıştırmasını zorunlu kılmak için `--strict-json` kullanın. `--json`, `--strict-json` için eski bir alias olarak desteklenmeye devam eder.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`--strict-json` etkinleştirildiğinde, yorumlar, sonda virgüller veya tırnaksız nesne anahtarları gibi yalnızca JSON5 söz dizimleri reddedilir. Ham dize yedeğiyle JSON5 değer ayrıştırması için `--strict-json` kullanmayın.

`config get <path> --json`, ham değeri terminal biçimli metin yerine JSON olarak yazdırır.

<Note>
Nesne ataması varsayılan olarak hedef yolu değiştirir. `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` ve `auth.profiles` gibi sıkça kullanıcı ekli girdiler tutan korumalı map/liste yolları, `--replace` geçmediğiniz sürece mevcut girdileri kaldıracak değiştirmeleri reddeder.
</Note>

Bu map'lere girdi eklerken `--merge` kullanın:

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
SecretRef atamaları, desteklenmeyen çalışma zamanında değiştirilebilir yüzeylerde reddedilir (örneğin `hooks.token`, `commands.ownerDisplaySecret`, Discord iş parçacığı bağlama Webhook token'ları ve WhatsApp kimlik bilgileri JSON'u). Bkz. [SecretRef Kimlik Bilgisi Yüzeyi](/tr/reference/secretref-credential-surface).
</Warning>

Toplu ayrıştırma her zaman doğruluk kaynağı olarak toplu payload'u (`--batch-json`/`--batch-file`) kullanır. `--strict-json` / `--json`, toplu ayrıştırma davranışını değiştirmez.

## `config patch`

Çok sayıda yol tabanlı `config set` komutu çalıştırmak yerine yapılandırma biçimli bir patch yapıştırmak veya pipe etmek istediğinizde `config patch` kullanın. Girdi bir JSON5 nesnesidir. Nesneler özyinelemeli olarak birleştirilir, diziler ve skaler değerler hedef değeri değiştirir ve `null` hedef yolu siler.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Uzak kurulum betikleri için yararlı olan bir patch'i stdin üzerinden de pipe edebilirsiniz:

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

Bir nesne veya dizinin özyinelemeli olarak patch'lenmek yerine tam olarak sağlanan değer haline gelmesi gerektiğinde `--replace-path <path>` kullanın:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run`, yazmadan şema ve SecretRef çözülebilirlik kontrollerini çalıştırır. Exec destekli SecretRef'ler dry-run sırasında varsayılan olarak atlanır; dry-run'ın sağlayıcı komutlarını çalıştırmasını özellikle istediğinizde `--allow-exec` ekleyin.

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

Sertleştirilmiş exec sağlayıcısı örneği:

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
  <Accordion title="Kuru çalıştırma davranışı">
    - Builder modu: değiştirilen başvurular/sağlayıcılar için SecretRef çözülebilirlik denetimlerini çalıştırır.
    - JSON modu (`--strict-json`, `--json` veya toplu mod): şema doğrulamasıyla birlikte SecretRef çözülebilirlik denetimlerini çalıştırır.
    - İlke doğrulaması, desteklenmediği bilinen SecretRef hedef yüzeyleri için de çalışır.
    - İlke denetimleri değişiklik sonrası yapılandırmanın tamamını değerlendirir; bu nedenle üst nesne yazımları (örneğin `hooks` değerini nesne olarak ayarlamak) desteklenmeyen yüzey doğrulamasını atlayamaz.
    - Komut yan etkilerinden kaçınmak için kuru çalıştırma sırasında exec SecretRef denetimleri varsayılan olarak atlanır.
    - Exec SecretRef denetimlerini etkinleştirmek için `--dry-run` ile `--allow-exec` kullanın (bu, sağlayıcı komutlarını çalıştırabilir).
    - `--allow-exec` yalnızca kuru çalıştırma içindir ve `--dry-run` olmadan kullanılırsa hata verir.

  </Accordion>
  <Accordion title="--dry-run --json alanları">
    `--dry-run --json`, makine tarafından okunabilir bir rapor yazdırır:

    - `ok`: kuru çalıştırmanın geçip geçmediği
    - `operations`: değerlendirilen atama sayısı
    - `checks`: şema/çözülebilirlik denetimlerinin çalışıp çalışmadığı
    - `checks.resolvabilityComplete`: çözülebilirlik denetimlerinin tamamlanana kadar çalışıp çalışmadığı (exec başvuruları atlandığında false)
    - `refsChecked`: kuru çalıştırma sırasında gerçekten çözümlenen başvuru sayısı
    - `skippedExecRefs`: `--allow-exec` ayarlanmadığı için atlanan exec başvuru sayısı
    - `errors`: `ok=false` olduğunda yapılandırılmış eksik yol, şema veya çözülebilirlik hataları

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
  <Accordion title="Kuru çalıştırma başarısız olursa">
    - `config schema validation failed`: değişiklik sonrası yapılandırma biçiminiz geçersiz; yolu/değeri veya sağlayıcı/başvuru nesnesi biçimini düzeltin.
    - `Config policy validation failed: unsupported SecretRef usage`: bu kimlik bilgisini tekrar düz metin/dize girdisine taşıyın ve SecretRef'leri yalnızca desteklenen yüzeylerde tutun.
    - `SecretRef assignment(s) could not be resolved`: başvurulan sağlayıcı/başvuru şu anda çözümlenemiyor (eksik ortam değişkeni, geçersiz dosya işaretçisi, exec sağlayıcı hatası veya sağlayıcı/kaynak uyumsuzluğu).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: kuru çalıştırma exec başvurularını atladı; exec çözülebilirlik doğrulamasına ihtiyacınız varsa `--allow-exec` ile yeniden çalıştırın.
    - Toplu mod için, başarısız girdileri düzeltin ve yazmadan önce `--dry-run` komutunu yeniden çalıştırın.

  </Accordion>
</AccordionGroup>

## Yazma güvenliği

`openclaw config set` ve OpenClaw'a ait diğer yapılandırma yazıcıları, diske kaydetmeden önce değişiklik sonrası yapılandırmanın tamamını doğrular. Yeni yük şema doğrulamasından geçemezse veya yıkıcı bir üzerine yazma gibi görünürse, etkin yapılandırmaya dokunulmaz ve reddedilen yük yanında `openclaw.json.rejected.*` olarak kaydedilir.

<Warning>
Etkin yapılandırma yolu normal bir dosya olmalıdır. Sembolik bağlantılı `openclaw.json` düzenleri yazma işlemleri için desteklenmez; bunun yerine doğrudan gerçek dosyayı göstermek için `OPENCLAW_CONFIG_PATH` kullanın.
</Warning>

Küçük düzenlemeler için CLI yazımlarını tercih edin:

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

Doğrudan düzenleyici yazımlarına hâlâ izin verilir, ancak çalışan Gateway bunlar doğrulanana kadar güvenilmeyen olarak ele alır. Geçersiz doğrudan düzenlemeler başlatmayı başarısız kılar veya sıcak yeniden yükleme tarafından atlanır; Gateway `openclaw.json` dosyasını yeniden yazmaz. Önek eklenmiş/ezilmiş yapılandırmayı onarmak veya bilinen son iyi kopyayı geri yüklemek için `openclaw doctor --fix` çalıştırın. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config).

Tüm dosya kurtarma yalnızca doctor onarımı için ayrılmıştır. Plugin şema değişiklikleri veya `minHostVersion` uyumsuzluğu; modeller, sağlayıcılar, kimlik doğrulama profilleri, kanallar, gateway erişimi, araçlar, bellek, tarayıcı veya cron yapılandırması gibi ilgisiz kullanıcı ayarlarını geri almak yerine görünür hata olarak kalır.

## Alt komutlar

- `config file`: Etkin yapılandırma dosyası yolunu yazdırır (`OPENCLAW_CONFIG_PATH` veya varsayılan konumdan çözümlenir). Yol, sembolik bağlantı değil normal bir dosyayı adlandırmalıdır.

Düzenlemelerden sonra gateway'i yeniden başlatın.

## Doğrulama

Gateway'i başlatmadan mevcut yapılandırmayı etkin şemaya göre doğrulayın.

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` geçtikten sonra, her değişikliği aynı terminalden doğrularken yerel TUI'yi kullanarak gömülü bir ajanın etkin yapılandırmayı belgelerle karşılaştırmasını sağlayabilirsiniz:

<Note>
Doğrulama zaten başarısız oluyorsa `openclaw configure` veya `openclaw doctor --fix` ile başlayın. `openclaw chat`, geçersiz yapılandırma korumasını atlamaz.
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
  <Step title="Belgelerle karşılaştır">
    Ajanın mevcut yapılandırmanızı ilgili belge sayfasıyla karşılaştırmasını ve en küçük düzeltmeyi önermesini isteyin.
  </Step>
  <Step title="Hedefli düzenlemeleri uygula">
    `openclaw config set` veya `openclaw configure` ile hedefli düzenlemeler uygulayın.
  </Step>
  <Step title="Yeniden doğrula">
    Her değişiklikten sonra `openclaw config validate` komutunu yeniden çalıştırın.
  </Step>
  <Step title="Çalışma zamanı sorunları için Doctor">
    Doğrulama geçerse ancak çalışma zamanı hâlâ sağlıklı değilse, geçiş ve onarım yardımı için `openclaw doctor` veya `openclaw doctor --fix` çalıştırın.
  </Step>
</Steps>

## İlgili

- [CLI referansı](/tr/cli)
- [Yapılandırma](/tr/gateway/configuration)
