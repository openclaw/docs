---
read_when:
    - Config'i etkileşimli olmayan şekilde okumak veya düzenlemek istiyorsanız
summary: '`openclaw config` için CLI başvurusu (`get`/`set`/`unset`/`file`/`schema`/`validate`)'
title: config
x-i18n:
    generated_at: "2026-04-05T13:48:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4de30f41e15297019151ad1a5b306cb331fd5c2beefd5ce5b98fcc51e95f0de
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

`openclaw.json` içinde etkileşimli olmayan düzenlemeler için config yardımcıları: yol bazında
`get`/`set`/`unset`/`file`/`schema`/`validate` değerleri ve etkin config dosyasını yazdırma. Alt komut olmadan çalıştırıldığında
yapılandırma sihirbazını açar (`openclaw configure` ile aynıdır).

Kök seçenekler:

- `--section <section>`: `openclaw config` komutunu alt komut olmadan çalıştırdığınızda tekrarlanabilir rehberli kurulum bölüm filtresi

Desteklenen rehberli bölümler:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Örnekler

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Oluşturulmuş `openclaw.json` JSON şemasını stdout'a JSON olarak yazdırır.

İçerdikleri:

- Geçerli kök config şeması ve editör araçları için kök `$schema` dize alanı
- Control UI tarafından kullanılan alan `title` ve `description` belge meta verisi
- Eşleşen alan belgeleri mevcut olduğunda iç içe nesne, joker (`*`) ve dizi öğesi (`[]`) düğümleri aynı `title` / `description` meta verisini devralır
- Eşleşen alan belgeleri mevcut olduğunda `anyOf` / `oneOf` / `allOf` dalları da aynı belge meta verisini devralır
- Çalışma zamanı manifestleri yüklenebildiğinde en iyi çabayla canlı plugin + kanal şema meta verisi
- Geçerli config geçersiz olduğunda bile temiz bir geri dönüş şeması

İlgili çalışma zamanı RPC:

- `config.schema.lookup`, tek bir normalize edilmiş config yolu ile sığ bir
  şema düğümü (`title`, `description`, `type`, `enum`, `const`, yaygın sınırlar),
  eşleşen UI ipucu meta verisi ve doğrudan alt öğe özetlerini döndürür. Bunu
  path kapsamlı derinlemesine inceleme için Control UI veya özel istemcilerde kullanın.

```bash
openclaw config schema
```

Bunu başka araçlarla incelemek veya doğrulamak istediğinizde bir dosyaya yönlendirin:

```bash
openclaw config schema > openclaw.schema.json
```

### Yollar

Yollar nokta veya köşeli ayraç gösterimi kullanır:

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

Değerler mümkün olduğunda JSON5 olarak ayrıştırılır; aksi halde dize olarak ele alınır.
JSON5 ayrıştırmasını zorunlu kılmak için `--strict-json` kullanın. `--json`, eski bir takma ad olarak desteklenmeye devam eder.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`, terminal biçimlendirmeli metin yerine ham değeri JSON olarak yazdırır.

## `config set` kipleri

`openclaw config set`, dört atama stilini destekler:

1. Değer kipi: `openclaw config set <path> <value>`
2. SecretRef oluşturucu kipi:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Sağlayıcı oluşturucu kipi (yalnızca `secrets.providers.<alias>` yolu):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Toplu kip (`--batch-json` veya `--batch-file`):

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

İlke notu:

- Desteklenmeyen çalışma zamanı değiştirilebilir yüzeylerde SecretRef atamaları reddedilir (örneğin `hooks.token`, `commands.ownerDisplaySecret`, Discord iş parçacığı bağlama webhook token'ları ve WhatsApp creds JSON). Bkz. [SecretRef Kimlik Bilgisi Yüzeyi](/reference/secretref-credential-surface).

Toplu ayrıştırma her zaman doğruluk kaynağı olarak toplu yükü (`--batch-json`/`--batch-file`) kullanır.
`--strict-json` / `--json`, toplu ayrıştırma davranışını değiştirmez.

JSON yol/değer kipi, hem SecretRef'ler hem de sağlayıcılar için desteklenmeye devam eder:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Sağlayıcı Oluşturucu Bayrakları

Sağlayıcı oluşturucu hedefleri yol olarak `secrets.providers.<alias>` kullanmalıdır.

Yaygın bayraklar:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env sağlayıcısı (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (tekrarlanabilir)

Dosya sağlayıcısı (`--provider-source file`):

- `--provider-path <path>` (zorunlu)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Exec sağlayıcısı (`--provider-source exec`):

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

Dry-run davranışı:

- Oluşturucu kipi: değişen ref/sağlayıcılar için SecretRef çözümlenebilirlik denetimlerini çalıştırır.
- JSON kipi (`--strict-json`, `--json` veya toplu kip): şema doğrulamasını ve SecretRef çözümlenebilirlik denetimlerini çalıştırır.
- Bilinen desteklenmeyen SecretRef hedef yüzeyleri için ilke doğrulaması da çalışır.
- İlke denetimleri tam değişiklik sonrası config'i değerlendirir; bu nedenle üst nesne yazımları (örneğin `hooks`'u nesne olarak ayarlama) desteklenmeyen yüzey doğrulamasını atlatamaz.
- Exec SecretRef denetimleri, komut yan etkilerinden kaçınmak için dry-run sırasında varsayılan olarak atlanır.
- Exec SecretRef denetimlerine isteğe bağlı katılmak için `--dry-run` ile birlikte `--allow-exec` kullanın (bu, sağlayıcı komutlarını çalıştırabilir).
- `--allow-exec` yalnızca dry-run içindir ve `--dry-run` olmadan kullanılırsa hata verir.

`--dry-run --json`, makine tarafından okunabilir bir rapor yazdırır:

- `ok`: dry-run başarılı mı
- `operations`: değerlendirilen atama sayısı
- `checks`: şema/çözümlenebilirlik denetimlerinin çalışıp çalışmadığı
- `checks.resolvabilityComplete`: çözümlenebilirlik denetimlerinin tamamlanıp tamamlanmadığı (`exec` ref'leri atlandığında false olur)
- `refsChecked`: dry-run sırasında gerçekten çözümlenen ref sayısı
- `skippedExecRefs`: `--allow-exec` ayarlanmadığı için atlanan `exec` ref sayısı
- `errors`: `ok=false` olduğunda yapılandırılmış şema/çözümlenebilirlik hataları

### JSON Çıktı Şekli

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
      ref?: string, // çözümlenebilirlik hataları için bulunur
    },
  ],
}
```

Başarı örneği:

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

Başarısızlık örneği:

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

Dry-run başarısız olursa:

- `config schema validation failed`: değişiklik sonrası config şekliniz geçersiz; yol/değer veya sağlayıcı/ref nesne şeklini düzeltin.
- `Config policy validation failed: unsupported SecretRef usage`: bu kimlik bilgisini tekrar düz metin/dize girdisine taşıyın ve SecretRef'leri yalnızca desteklenen yüzeylerde tutun.
- `SecretRef assignment(s) could not be resolved`: başvurulan sağlayıcı/ref şu anda çözümlenemiyor (eksik ortam değişkeni, geçersiz dosya işaretçisi, exec sağlayıcısı hatası veya sağlayıcı/kaynak uyumsuzluğu).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run exec ref'lerini atladı; exec çözümlenebilirlik doğrulamasına ihtiyacınız varsa `--allow-exec` ile yeniden çalıştırın.
- Toplu kipte, başarısız girdileri düzeltin ve yazmadan önce `--dry-run` komutunu yeniden çalıştırın.

## Alt komutlar

- `config file`: Etkin config dosyası yolunu yazdırır (`OPENCLAW_CONFIG_PATH` veya varsayılan konumdan çözümlenir).

Düzenlemelerden sonra gateway'i yeniden başlatın.

## Doğrulama

Geçerli config'i gateway'i başlatmadan etkin şemaya karşı doğrulayın.

```bash
openclaw config validate
openclaw config validate --json
```
