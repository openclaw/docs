---
read_when:
    - OpenClaw yapılandırmasını etkileşimsiz olarak okumak veya düzenlemek istiyorsunuz
sidebarTitle: Config
summary: '`openclaw config` için CLI başvurusu (get/set/patch/unset/file/schema/validate)'
title: Yapılandırma
x-i18n:
    generated_at: "2026-06-28T00:20:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d658c0edbf900565c4645c1d24a9f3e092a3d8a4fec85f7fc7e3989550d13197
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` içinde etkileşimsiz düzenlemeler için yapılandırma yardımcıları: değerlere yola göre get/set/patch/unset/file/schema/validate uygular ve etkin yapılandırma dosyasını yazdırır. Yapılandırma sihirbazını açmak için alt komut olmadan çalıştırın (`openclaw configure` ile aynı).

<Note>
`OPENCLAW_NIX_MODE=1` olduğunda OpenClaw, `openclaw.json` dosyasını değiştirilemez kabul eder. `config get`, `config file`, `config schema` ve `config validate` gibi salt okunur komutlar çalışmaya devam eder, ancak yapılandırma yazıcıları reddeder. Agents bunun yerine kurulumun Nix kaynağını düzenlemelidir; birinci taraf nix-openclaw dağıtımı için [nix-openclaw Hızlı Başlangıç](https://github.com/openclaw/nix-openclaw#quick-start) kullanın ve değerleri `programs.openclaw.config` veya `instances.<name>.config` altında ayarlayın.
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

`openclaw.json` için oluşturulan JSON şemasını JSON olarak stdout'a yazdırır.

<AccordionGroup>
  <Accordion title="İçerdikleri">
    - Geçerli kök yapılandırma şeması ve düzenleyici araçları için bir kök `$schema` dize alanı.
    - Control UI tarafından kullanılan alan `title` ve `description` belge meta verileri.
    - İç içe nesne, joker karakter (`*`) ve dizi öğesi (`[]`) düğümleri, eşleşen alan belgelendirmesi bulunduğunda aynı `title` / `description` meta verilerini devralır.
    - `anyOf` / `oneOf` / `allOf` dalları da eşleşen alan belgelendirmesi bulunduğunda aynı belge meta verilerini devralır.
    - Çalışma zamanı manifestleri yüklenebildiğinde en iyi çabayla canlı Plugin + kanal şema meta verileri.
    - Geçerli yapılandırma geçersiz olsa bile temiz bir yedek şema.

  </Accordion>
  <Accordion title="İlgili çalışma zamanı RPC'si">
    `config.schema.lookup`, sığ bir şema düğümü (`title`, `description`, `type`, `enum`, `const`, ortak sınırlar), eşleşen UI ipucu meta verileri ve anlık alt özetleriyle birlikte normalleştirilmiş tek bir yapılandırma yolu döndürür. Bunu Control UI veya özel istemcilerde yol kapsamlı ayrıntıya inme için kullanın.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

Başka araçlarla incelemek veya doğrulamak istediğinizde bir dosyaya aktarın:

```bash
openclaw config schema > openclaw.schema.json
```

### Yollar

Yollar nokta veya köşeli parantez gösterimini kullanır. Kabuk örneklerinde köşeli parantez gösterimli yolları tırnak içine alın; böylece zsh gibi kabuklar OpenClaw yolu almadan önce `[0]` değerini glob olarak genişletmez:

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

Belirli bir Agent hedeflemek için Agent liste dizinini kullanın:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## Değerler

Değerler mümkün olduğunda JSON5 olarak ayrıştırılır; aksi halde dize olarak ele alınır. JSON5 ayrıştırmasını zorunlu kılmak için `--strict-json` kullanın. `--json`, eski uyumluluk takma adı olarak desteklenmeye devam eder.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`, ham değeri terminal biçimli metin yerine JSON olarak yazdırır.

<Note>
Nesne ataması varsayılan olarak hedef yolun yerini alır. Kullanıcı tarafından eklenen girdileri yaygın olarak tutan korumalı harita/liste yolları, örneğin `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries` ve `auth.profiles`, `--replace` geçmediğiniz sürece mevcut girdileri kaldıracak değiştirmeleri reddeder.
</Note>

Bu haritalara girdi eklerken `--merge` kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

`--replace` yalnızca sağlanan değerin tam hedef değer olmasını bilerek istediğinizde kullanın.

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

Toplu ayrıştırma her zaman doğruluk kaynağı olarak toplu yükü (`--batch-json`/`--batch-file`) kullanır. `--strict-json` / `--json`, toplu ayrıştırma davranışını değiştirmez.

## `config patch`

Çok sayıda yol tabanlı `config set` komutu çalıştırmak yerine yapılandırma biçimli bir yamayı yapıştırmak veya pipe ile aktarmak istediğinizde `config patch` kullanın. Girdi bir JSON5 nesnesidir. Nesneler özyinelemeli olarak birleştirilir, diziler ve skaler değerler hedef değerin yerini alır ve `null` hedef yolu siler.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

Bir yamayı stdin üzerinden de aktarabilirsiniz; bu, uzak kurulum betikleri için kullanışlıdır:

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

Bir nesne veya dizinin özyinelemeli olarak yamalanmak yerine tam olarak sağlanan değer olması gerektiğinde `--replace-path <path>` kullanın:

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run`, yazmadan şema ve SecretRef çözülebilirlik kontrollerini çalıştırır. Exec destekli SecretRef'ler dry-run sırasında varsayılan olarak atlanır; dry-run'ın sağlayıcı komutlarını çalıştırmasını bilerek istediğinizde `--allow-exec` ekleyin.

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
  <Accordion title="Dry-run davranışı">
    - Oluşturucu modu: değişen ref'ler/sağlayıcılar için SecretRef çözülebilirlik kontrollerini çalıştırır.
    - JSON modu (`--strict-json`, `--json` veya toplu mod): şema doğrulamasını ve SecretRef çözülebilirlik kontrollerini çalıştırır.
    - İlke doğrulaması, bilinen desteklenmeyen SecretRef hedef yüzeyleri için de çalışır.
    - İlke kontrolleri, değişiklik sonrası yapılandırmanın tamamını değerlendirir; bu nedenle üst nesne yazımları (örneğin `hooks` öğesini nesne olarak ayarlamak) desteklenmeyen yüzey doğrulamasını atlayamaz.
    - Exec SecretRef kontrolleri, komut yan etkilerinden kaçınmak için dry-run sırasında varsayılan olarak atlanır.
    - Exec SecretRef kontrollerine katılmak için `--dry-run` ile `--allow-exec` kullanın (bu, sağlayıcı komutlarını çalıştırabilir).
    - `--allow-exec` yalnızca dry-run içindir ve `--dry-run` olmadan kullanılırsa hata verir.

  </Accordion>
  <Accordion title="--dry-run --json alanları">
    `--dry-run --json`, makine tarafından okunabilir bir rapor yazdırır:

    - `ok`: dry-run'ın geçip geçmediği
    - `operations`: değerlendirilen atama sayısı
    - `checks`: şema/çözülebilirlik denetimlerinin çalışıp çalışmadığı
    - `checks.resolvabilityComplete`: çözülebilirlik denetimlerinin tamamlanıp tamamlanmadığı (exec ref'leri atlandığında false)
    - `refsChecked`: dry-run sırasında gerçekten çözümlenen ref sayısı
    - `skippedExecRefs`: `--allow-exec` ayarlanmadığı için atlanan exec ref sayısı
    - `errors`: `ok=false` olduğunda yapılandırılmış eksik-yol, şema veya çözülebilirlik hataları

  </Accordion>
</AccordionGroup>

### JSON çıktı şekli

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
  <Accordion title="Dry-run başarısız olursa">
    - `config schema validation failed`: değişiklik sonrası config şekliniz geçersizdir; yolu/değeri veya provider/ref nesne şeklini düzeltin.
    - `Config policy validation failed: unsupported SecretRef usage`: bu kimlik bilgisini tekrar düz metin/string girişine taşıyın ve SecretRef'leri yalnızca desteklenen yüzeylerde tutun.
    - `SecretRef assignment(s) could not be resolved`: başvurulan provider/ref şu anda çözümlenemiyor (eksik env var, geçersiz dosya işaretçisi, exec sağlayıcı hatası veya sağlayıcı/kaynak uyumsuzluğu).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run exec ref'lerini atladı; exec çözülebilirlik doğrulamasına ihtiyacınız varsa `--allow-exec` ile yeniden çalıştırın.
    - Toplu mod için, başarısız girdileri düzeltin ve yazmadan önce `--dry-run` seçeneğini yeniden çalıştırın.

  </Accordion>
</AccordionGroup>

## Yazma güvenliği

`openclaw config set` ve OpenClaw'a ait diğer config yazıcıları, diske işlemeden önce değişiklik sonrası config'in tamamını doğrular. Yeni yük şema doğrulamasından geçmezse veya yıkıcı bir üzerine yazma gibi görünürse, etkin config'e dokunulmaz ve reddedilen yük yanına `openclaw.json.rejected.*` olarak kaydedilir.

<Warning>
Etkin config yolu normal bir dosya olmalıdır. Symlink'lenmiş `openclaw.json` düzenleri yazma işlemleri için desteklenmez; bunun yerine `OPENCLAW_CONFIG_PATH` ile doğrudan gerçek dosyayı gösterin.
</Warning>

Küçük düzenlemeler için CLI yazmalarını tercih edin:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Bir yazma reddedilirse, kaydedilen yükü inceleyin ve config şeklinin tamamını düzeltin:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Doğrudan düzenleyici yazmalarına hâlâ izin verilir, ancak çalışan Gateway bunları doğrulanana kadar güvenilmez kabul eder. Geçersiz doğrudan düzenlemeler başlatmayı başarısız kılar veya hot reload tarafından atlanır; Gateway `openclaw.json` dosyasını yeniden yazmaz. Ön eklenmiş/üzerine yazılmış config'i onarmak veya bilinen son iyi kopyayı geri yüklemek için `openclaw doctor --fix` çalıştırın. Bkz. [Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-rejected-invalid-config).

Tam dosya kurtarma doctor onarımına ayrılmıştır. Plugin şema değişiklikleri veya `minHostVersion` kayması, modeller, sağlayıcılar, auth profilleri, kanallar, gateway erişimi, araçlar, bellek, tarayıcı veya cron config'i gibi ilgisiz kullanıcı ayarlarını geri almak yerine görünür şekilde hata verir.

## Alt komutlar

- `config file`: Etkin config dosyası yolunu yazdırır (`OPENCLAW_CONFIG_PATH` veya varsayılan konumdan çözümlenir). Yol bir symlink'i değil, normal bir dosyayı göstermelidir.

Düzenlemelerden sonra gateway'i yeniden başlatın.

## Doğrulama

Gateway'i başlatmadan mevcut config'i etkin şemaya göre doğrulayın.

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` geçtikten sonra, aynı terminalden her değişikliği doğrularken yerleşik bir ajanın etkin config'i dokümanlarla karşılaştırması için yerel TUI'yi kullanabilirsiniz:

<Note>
Doğrulama zaten başarısız oluyorsa, `openclaw configure` veya `openclaw doctor --fix` ile başlayın. `openclaw chat` geçersiz-config korumasını atlatmaz.
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
    Ajanın mevcut config'inizi ilgili doküman sayfasıyla karşılaştırmasını ve en küçük düzeltmeyi önermesini isteyin.
  </Step>
  <Step title="Hedefli düzenlemeleri uygula">
    Hedefli düzenlemeleri `openclaw config set` veya `openclaw configure` ile uygulayın.
  </Step>
  <Step title="Yeniden doğrula">
    Her değişiklikten sonra `openclaw config validate` komutunu yeniden çalıştırın.
  </Step>
  <Step title="Çalışma zamanı sorunları için doctor">
    Doğrulama geçiyor ancak çalışma zamanı hâlâ sağlıklı değilse, migration ve onarım yardımı için `openclaw doctor` veya `openclaw doctor --fix` çalıştırın.
  </Step>
</Steps>

## İlgili

- [CLI başvurusu](/tr/cli)
- [Yapılandırma](/tr/gateway/configuration)
