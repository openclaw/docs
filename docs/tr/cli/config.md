---
read_when:
    - Yapılandırmayı etkileşimsiz olarak okumak veya düzenlemek istiyorsunuz
summary: '`openclaw config` için CLI başvurusu (get/set/unset/file/schema/validate)'
title: Yapılandırma
x-i18n:
    generated_at: "2026-04-24T09:01:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e2eb75cc415df52ddcd104d8e5295d8d7b84baca65b4368deb3f06259f6bcd
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

`openclaw.json` içinde etkileşimsiz düzenlemeler için yapılandırma yardımcıları: yola göre
get/set/unset/file/schema/validate değerleri ve etkin yapılandırma dosyasını yazdırma.
Bir alt komut olmadan çalıştırırsanız yapılandırma sihirbazını açar
(`openclaw configure` ile aynıdır).

Kök seçenekler:

- `--section <section>`: `openclaw config` komutunu alt komut olmadan çalıştırdığınızda tekrarlanabilir kılavuzlu kurulum bölüm filtresi

Desteklenen kılavuzlu bölümler:

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
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Oluşturulmuş `openclaw.json` JSON şemasını JSON olarak stdout'a yazdırır.

İçerdikleri:

- Geçerli kök yapılandırma şeması ve ayrıca düzenleyici araçları için kök bir `$schema` string alanı
- Control UI tarafından kullanılan alan `title` ve `description` belge meta verileri
- İç içe nesne, joker (`*`) ve dizi öğesi (`[]`) düğümleri, eşleşen alan belgeleri mevcut olduğunda aynı `title` / `description` meta verilerini devralır
- `anyOf` / `oneOf` / `allOf` dalları da eşleşen alan belgeleri mevcut olduğunda aynı belge meta verilerini devralır
- Çalışma zamanı manifest'leri yüklenebildiğinde best-effort canlı Plugin + kanal şema meta verileri
- Geçerli yapılandırma geçersiz olsa bile temiz bir fallback şema

İlgili çalışma zamanı RPC:

- `config.schema.lookup`, tek bir normalleştirilmiş yapılandırma yolunu sığ bir
  şema düğümü (`title`, `description`, `type`, `enum`, `const`, ortak sınırlar),
  eşleşen UI ipucu meta verisi ve doğrudan alt özetlerle döndürür. Bunu,
  path-scoped ayrıntı incelemesi için Control UI veya özel istemcilerde kullanın.

```bash
openclaw config schema
```

Bunu diğer araçlarla incelemek veya doğrulamak istediğinizde bir dosyaya yönlendirin:

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

Değerler mümkün olduğunda JSON5 olarak ayrıştırılır; aksi halde string olarak ele alınır.
JSON5 ayrıştırmasını zorunlu kılmak için `--strict-json` kullanın. `--json`, eski bir takma ad olarak desteklenmeye devam eder.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`, terminale biçimlenmiş metin yerine ham değeri JSON olarak yazdırır.

Nesne ataması varsayılan olarak hedef yolu değiştirir. Sıklıkla kullanıcı tarafından
eklenen girdileri tutan korumalı map/list yolları, örneğin `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` ve
`auth.profiles`, siz `--replace` geçmedikçe mevcut girdileri kaldıracak
değiştirmeleri reddeder.

Bu map'lere girdiler eklerken `--merge` kullanın:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Yalnızca sağlanan değerin tam hedef değer olmasını kasıtlı olarak istediğinizde `--replace` kullanın.

## `config set` modları

`openclaw config set` dört atama stilini destekler:

1. Değer modu: `openclaw config set <path> <value>`
2. SecretRef oluşturucu modu:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Sağlayıcı oluşturucu modu (yalnızca `secrets.providers.<alias>` yolu):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Toplu mod (`--batch-json` veya `--batch-file`):

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

Politika notu:

- SecretRef atamaları, desteklenmeyen runtime-mutable yüzeylerde reddedilir (örneğin `hooks.token`, `commands.ownerDisplaySecret`, Discord thread-binding Webhook token'ları ve WhatsApp creds JSON). Bkz. [SecretRef Credential Surface](/tr/reference/secretref-credential-surface).

Toplu ayrıştırma her zaman kaynak doğruluk noktası olarak toplu payload'ı (`--batch-json`/`--batch-file`) kullanır.
`--strict-json` / `--json`, toplu ayrıştırma davranışını değiştirmez.

JSON yol/değer modu, hem SecretRef'ler hem de sağlayıcılar için desteklenmeye devam eder:

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

Ortak bayraklar:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env sağlayıcısı (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (tekrarlanabilir)

Dosya sağlayıcısı (`--provider-source file`):

- `--provider-path <path>` (gerekli)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec sağlayıcısı (`--provider-source exec`):

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

Sağlamlaştırılmış exec sağlayıcı örneği:

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

- Oluşturucu modu: değiştirilen ref/sağlayıcılar için SecretRef çözümlenebilirlik kontrollerini çalıştırır.
- JSON modu (`--strict-json`, `--json` veya toplu mod): şema doğrulaması ve SecretRef çözümlenebilirlik kontrollerini çalıştırır.
- Bilinen desteklenmeyen SecretRef hedef yüzeyleri için politika doğrulaması da çalışır.
- Politika kontrolleri değişiklik sonrası tam yapılandırmayı değerlendirir, bu yüzden üst nesne yazımları (örneğin `hooks` değerini nesne olarak ayarlama) desteklenmeyen yüzey doğrulamasını atlatamaz.
- Komut yan etkilerini önlemek için exec SecretRef kontrolleri dry-run sırasında varsayılan olarak atlanır.
- Exec SecretRef kontrollerine dahil olmak için `--dry-run` ile birlikte `--allow-exec` kullanın (bu, sağlayıcı komutlarını çalıştırabilir).
- `--allow-exec` yalnızca dry-run içindir ve `--dry-run` olmadan kullanılırsa hata verir.

`--dry-run --json`, makine tarafından okunabilir bir rapor yazdırır:

- `ok`: dry-run başarılı geçti mi
- `operations`: değerlendirilen atama sayısı
- `checks`: şema/çözümlenebilirlik kontrolleri çalıştı mı
- `checks.resolvabilityComplete`: çözümlenebilirlik kontrolleri tamamen çalıştı mı (exec ref'leri atlandığında false olur)
- `refsChecked`: dry-run sırasında fiilen çözümlenen ref sayısı
- `skippedExecRefs`: `--allow-exec` ayarlı olmadığı için atlanan exec ref sayısı
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

- `config schema validation failed`: değişiklik sonrası yapılandırma şekliniz geçersiz; yol/değer veya sağlayıcı/ref nesne şeklini düzeltin.
- `Config policy validation failed: unsupported SecretRef usage`: bu kimlik bilgisini yeniden düz metin/string girişe taşıyın ve SecretRef'leri yalnızca desteklenen yüzeylerde tutun.
- `SecretRef assignment(s) could not be resolved`: başvurulan sağlayıcı/ref şu anda çözümlenemiyor (eksik env değişkeni, geçersiz dosya işaretçisi, exec sağlayıcı hatası veya sağlayıcı/kaynak uyumsuzluğu).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run exec ref'lerini atladı; exec çözümlenebilirlik doğrulaması gerekiyorsa `--allow-exec` ile yeniden çalıştırın.
- Toplu mod için, başarısız girdileri düzeltin ve yazmadan önce `--dry-run` ile yeniden çalıştırın.

## Yazma güvenliği

`openclaw config set` ve OpenClaw'a ait diğer yapılandırma yazarları, diske kaydetmeden önce değişiklik sonrası tam yapılandırmayı doğrular. Yeni payload şema doğrulamasında başarısız olursa veya yıkıcı bir clobber gibi görünürse, etkin yapılandırma olduğu gibi bırakılır ve reddedilen payload bunun yanında `openclaw.json.rejected.*` olarak kaydedilir.
Etkin yapılandırma yolu normal bir dosya olmalıdır. Symlink'li `openclaw.json`
düzenleri yazmalar için desteklenmez; bunun yerine doğrudan gerçek dosyayı işaret etmek için `OPENCLAW_CONFIG_PATH` kullanın.

Küçük düzenlemeler için CLI yazımlarını tercih edin:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Bir yazma reddedilirse, kaydedilen payload'ı inceleyin ve tam yapılandırma şeklini düzeltin:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Doğrudan düzenleyici yazımları hâlâ izinlidir, ancak çalışan Gateway bunları doğrulanana kadar güvenilmez kabul eder. Geçersiz doğrudan düzenlemeler başlangıçta veya hot reload sırasında son bilinen iyi yedekten geri yüklenebilir. Bkz.
[Gateway sorun giderme](/tr/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Alt komutlar

- `config file`: Etkin yapılandırma dosyası yolunu yazdırır (`OPENCLAW_CONFIG_PATH` veya varsayılan konumdan çözümlenir). Yol bir symlink'i değil, normal bir dosyayı göstermelidir.

Düzenlemelerden sonra gateway'i yeniden başlatın.

## Doğrulama

Geçerli yapılandırmayı gateway'i başlatmadan etkin şemaya göre doğrulayın.

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` başarılı olduktan sonra, yerel TUI'yi kullanarak
gömülü bir ajanın etkin yapılandırmayı belgelerle karşılaştırmasını sağlayabilir ve her değişikliği aynı terminalden doğrulayabilirsiniz:

Doğrulama zaten başarısız oluyorsa, `openclaw configure` veya
`openclaw doctor --fix` ile başlayın. `openclaw chat`, geçersiz yapılandırma
korumasını atlatmaz.

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

- Ajandan geçerli yapılandırmanızı ilgili belge sayfasıyla karşılaştırmasını ve en küçük düzeltmeyi önermesini isteyin.
- Hedefli düzenlemeleri `openclaw config set` veya `openclaw configure` ile uygulayın.
- Her değişiklikten sonra `openclaw config validate` komutunu yeniden çalıştırın.
- Doğrulama geçerse ancak çalışma zamanı hâlâ sağlıksızsa, geçiş ve onarım yardımı için `openclaw doctor` veya `openclaw doctor --fix` çalıştırın.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Yapılandırma](/tr/gateway/configuration)
