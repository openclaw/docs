---
read_when:
    - Akıl yürütme sızıntısı olup olmadığını görmek için ham model çıktısını incelemeniz gerekir.
    - Yineleme yaparken Gateway'i watch modunda çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: izleme modu, ham model akışları ve akıl yürütme sızıntısını izleme'
title: Hata Ayıklama
x-i18n:
    generated_at: "2026-05-02T08:56:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7e28dd5f352abd8d751def61bb56acb6f22663600effdada14bf4a40214f62b
    source_path: help/debugging.md
    workflow: 16
---

Akış çıktısı için hata ayıklama yardımcıları, özellikle bir sağlayıcı akıl yürütmeyi normal metne karıştırdığında.

## Çalışma zamanı hata ayıklama geçersiz kılmaları

**Yalnızca çalışma zamanı** yapılandırma geçersiz kılmaları ayarlamak için sohbette `/debug` kullanın (bellek, disk değil).
`/debug` varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.
Bu, `openclaw.json` dosyasını düzenlemeden belirsiz ayarları açıp kapatmanız gerektiğinde kullanışlıdır.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` tüm geçersiz kılmaları temizler ve diskteki yapılandırmaya döner.

## Oturum izleme çıktısı

Tam ayrıntılı modu açmadan, tek bir oturumda Plugin tarafından sahiplenilen izleme/hata ayıklama satırlarını görmek istediğinizde `/trace` kullanın.

Örnekler:

```text
/trace
/trace on
/trace off
```

Active Memory hata ayıklama özetleri gibi Plugin tanıları için `/trace` kullanın.
Normal ayrıntılı durum/araç çıktısı için `/verbose` kullanmaya devam edin ve yalnızca çalışma zamanı yapılandırma geçersiz kılmaları için `/debug` kullanmaya devam edin.

## Plugin yaşam döngüsü izlemesi

Plugin yaşam döngüsü komutları yavaş hissettirdiğinde ve Plugin meta verileri, keşif, kayıt defteri, çalışma zamanı yansısı, yapılandırma mutasyonu ve yenileme işleri için yerleşik bir aşama dökümüne ihtiyaç duyduğunuzda `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` kullanın. İzleme isteğe bağlıdır ve stderr'e yazar; bu nedenle JSON komut çıktısı ayrıştırılabilir kalır.

Örnek:

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

Örnek çıktı:

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

CPU profiler kullanmadan önce bunu Plugin yaşam döngüsü incelemesi için kullanın.
Komut bir kaynak checkout içinden çalışıyorsa, `pnpm build` sonrasında `node dist/entry.js ...` ile derlenmiş çalışma zamanını ölçmeyi tercih edin; `pnpm openclaw ...` kaynak çalıştırıcı ek yükünü de ölçer.

## Geçici CLI hata ayıklama zamanlaması

OpenClaw, yerel inceleme için küçük bir yardımcı olarak `src/cli/debug-timing.ts` dosyasını tutar. Bu dosya kasıtlı olarak varsayılan şekilde CLI başlangıcına, komut yönlendirmeye veya herhangi bir komuta bağlanmamıştır. Yalnızca yavaş bir komutta hata ayıklarken kullanın, ardından davranış değişikliğini land etmeden önce import'u ve span'leri kaldırın.

Bir komut yavaş olduğunda ve CPU profiler kullanıp kullanmamaya ya da belirli bir alt sistemi düzeltip düzeltmemeye karar vermeden önce hızlı bir aşama dökümüne ihtiyaç duyduğunuzda bunu kullanın.

### Geçici span'ler ekleyin

Yardımcıyı incelediğiniz kodun yakınına ekleyin. Örneğin, `openclaw models list` üzerinde hata ayıklarken `src/commands/models/list.list-command.ts` içinde geçici bir patch şöyle görünebilir:

```ts
// Temporary debugging only. Remove before landing.
import { createCliDebugTiming } from "../../cli/debug-timing.js";

const timing = createCliDebugTiming({ command: "models list" });

const authStore = timing.time("debug:models:list:auth_store", () => ensureAuthProfileStore());

const loaded = await timing.timeAsync(
  "debug:models:list:registry",
  () => loadListModelRegistry(cfg, { sourceConfig }),
  (result) => ({
    models: result.models.length,
    discoveredKeys: result.discoveredKeys.size,
  }),
);
```

Yönergeler:

- Geçici aşama adlarını `debug:` ile önekleyin.
- Yalnızca yavaş olduğundan şüphelenilen bölümlerin etrafına birkaç span ekleyin.
- Yardımcı adları yerine `registry`, `auth_store` veya `rows` gibi geniş aşamaları tercih edin.
- Eşzamanlı iş için `time()`, promise'ler için `timeAsync()` kullanın.
- stdout'u temiz tutun. Yardımcı stderr'e yazar; bu nedenle komutun JSON çıktısı ayrıştırılabilir kalır.
- Nihai düzeltme PR'ını açmadan önce geçici import'ları ve span'leri kaldırın.
- Optimizasyonu açıklayan issue veya PR'a zamanlama çıktısını ya da kısa bir özeti ekleyin.

### Okunabilir çıktıyla çalıştırın

Okunabilir mod canlı hata ayıklama için en uygunudur:

```bash
OPENCLAW_DEBUG_TIMING=1 pnpm openclaw models list --all --provider moonshot
```

Geçici bir `models list` incelemesinden örnek çıktı:

```text
OpenClaw CLI debug timing: models list
     0ms     +0ms start all=true json=false local=false plain=false provider="moonshot"
     2ms     +2ms debug:models:list:import_runtime duration=2ms
    17ms    +14ms debug:models:list:load_config duration=14ms sourceConfig=true
  20.3s  +20.3s debug:models:list:auth_store duration=20.3s
  20.3s     +0ms debug:models:list:resolve_agent_dir duration=0ms agentDir=true
  20.3s     +0ms debug:models:list:resolve_provider_filter duration=0ms
  25.3s   +5.0s debug:models:list:ensure_models_json duration=5.0s
  31.2s   +5.9s debug:models:list:load_model_registry duration=5.9s models=869 availableKeys=38 discoveredKeys=868 availabilityError=false
  31.2s     +0ms debug:models:list:resolve_configured_entries duration=0ms entries=1
  31.2s     +0ms debug:models:list:build_configured_lookup duration=0ms entries=1
  33.6s   +2.4s debug:models:list:read_registry_models duration=2.4s models=871
  35.2s   +1.5s debug:models:list:append_discovered_rows duration=1.5s seenKeys=0 rows=0
  36.9s   +1.7s debug:models:list:append_catalog_supplement_rows duration=1.7s seenKeys=5 rows=5

Model                                      Input       Ctx   Local Auth  Tags
moonshot/kimi-k2-thinking                  text        256k  no    no
moonshot/kimi-k2-thinking-turbo            text        256k  no    no
moonshot/kimi-k2-turbo                     text        250k  no    no
moonshot/kimi-k2.5                         text+image  256k  no    no
moonshot/kimi-k2.6                         text+image  256k  no    no

  36.9s     +0ms debug:models:list:print_model_table duration=0ms rows=5
  36.9s     +0ms complete rows=5
```

Bu çıktıdan bulgular:

| Aşama                                    |       Süre | Anlamı                                                                                                  |
| ---------------------------------------- | ---------: | ------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |      20.3s | Auth profili deposu yüklemesi en büyük maliyettir ve önce incelenmelidir.                               |
| `debug:models:list:ensure_models_json`   |       5.0s | `models.json` eşitlemesi, önbellekleme veya atlama koşulları açısından incelenecek kadar maliyetlidir. |
| `debug:models:list:load_model_registry`  |       5.9s | Kayıt defteri oluşturma ve sağlayıcı kullanılabilirliği çalışmaları da anlamlı maliyetlerdir.           |
| `debug:models:list:read_registry_models` |       2.4s | Tüm kayıt defteri modellerini okumak ücretsiz değildir ve `--all` için önemli olabilir.                 |
| satır ekleme aşamaları                   | toplam 3.2s | Görüntülenen beş satırı oluşturmak bile birkaç saniye sürüyor; bu nedenle filtreleme yolu daha yakından incelenmelidir. |
| `debug:models:list:print_model_table`    |        0ms | Darboğaz render değildir.                                                                               |

Bu bulgular, zamanlama kodunu üretim yollarında tutmadan bir sonraki patch'e rehberlik etmek için yeterlidir.

### JSON çıktısıyla çalıştırın

Zamanlama verilerini kaydetmek veya karşılaştırmak istediğinizde JSON modunu kullanın:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Her stderr satırı bir JSON nesnesidir:

```json
{
  "command": "models list",
  "phase": "debug:models:list:registry",
  "elapsedMs": 31200,
  "deltaMs": 5900,
  "durationMs": 5900,
  "models": 869,
  "discoveredKeys": 868
}
```

### Land etmeden önce temizleyin

Nihai PR'ı açmadan önce:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

PR açıkça kalıcı bir tanı yüzeyi eklemiyorsa komut hiçbir geçici enstrümantasyon çağrı yeri döndürmemelidir. Normal performans düzeltmeleri için yalnızca davranış değişikliğini, testleri ve zamanlama kanıtını içeren kısa bir notu tutun.

Daha derin CPU etkin noktaları için daha fazla zamanlama sarmalayıcısı eklemek yerine Node profiling (`--cpu-prof`) veya harici bir profiler kullanın.

## Gateway izleme modu

Hızlı yineleme için gateway'i dosya izleyici altında çalıştırın:

```bash
pnpm gateway:watch
```

Varsayılan olarak bu, `openclaw-gateway-watch-main` adlı bir tmux oturumu (veya `openclaw-gateway-watch-dev-19001` gibi profile/porta özgü bir varyant) başlatır ya da yeniden başlatır ve etkileşimli terminallerden otomatik olarak bağlanır. Etkileşimsiz shell'ler, CI ve agent exec çağrıları ayrık kalır ve bunun yerine bağlanma yönergelerini yazdırır. Gerektiğinde elle bağlanın:

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux bölmesi ham izleyiciyi çalıştırır:

```bash
node scripts/watch-node.mjs gateway --force
```

tmux istenmediğinde ön plan modunu kullanın:

```bash
pnpm gateway:watch:raw
# or
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux yönetimini korurken otomatik bağlanmayı devre dışı bırakın:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

tmux sarmalayıcısı `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` ve `OPENCLAW_SKIP_CHANNELS` gibi yaygın gizli olmayan çalışma zamanı seçicilerini bölmeye taşır. Sağlayıcı kimlik bilgilerini normal profil/yapılandırmanıza koyun veya tek seferlik geçici secret'lar için ham ön plan modunu kullanın.
Yönetilen tmux bölmesi, okunabilirlik için varsayılan olarak renkli Gateway günlükleri kullanır; ANSI çıktısını devre dışı bırakmak için `pnpm gateway:watch` başlatırken `FORCE_COLOR=0` ayarlayın.

İzleyici, `src/` altındaki derlemeyle ilgili dosyalarda, eklenti kaynak dosyalarında, eklenti `package.json` ve `openclaw.plugin.json` meta verilerinde, `tsconfig.json`, `package.json` ve `tsdown.config.ts` dosyalarında değişiklik olduğunda yeniden başlatılır. Eklenti meta veri değişiklikleri gateway'i `tsdown` yeniden derlemesini zorlamadan yeniden başlatır; kaynak ve yapılandırma değişiklikleri yine önce `dist` dizinini yeniden derler.

Gateway CLI bayraklarını `gateway:watch` sonrasına ekleyin; her yeniden başlatmada iletilirler. Aynı izleme komutunu yeniden çalıştırmak, adlandırılmış tmux bölmesini yeniden oluşturur ve ham izleyici yine tek izleyici kilidini korur; böylece yinelenen izleyici üst süreçleri birikmek yerine değiştirilir.

## Dev profili + dev gateway (--dev)

Durumu yalıtmak ve hata ayıklama için güvenli, atılabilir bir kurulum başlatmak üzere dev profilini kullanın. **İki** `--dev` bayrağı vardır:

- **Global `--dev` (profil):** durumu `~/.openclaw-dev` altında yalıtır ve gateway portunu varsayılan olarak `19001` yapar (türetilmiş portlar da bununla kayar).
- **`gateway --dev`: eksik olduğunda Gateway'e varsayılan bir yapılandırma + workspace'i otomatik oluşturmasını söyler** (ve BOOTSTRAP.md dosyasını atlar).

Önerilen akış (dev profili + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Henüz global kurulumunuz yoksa CLI'yi `pnpm openclaw ...` üzerinden çalıştırın.

Bunun yaptığı:

1. **Profil yalıtımı** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (tarayıcı/canvas buna göre kayar)

2. **Dev bootstrap** (`gateway --dev`)
   - Eksikse minimal bir yapılandırma yazar (`gateway.mode=local`, bind loopback).
   - `agent.workspace` değerini dev workspace olarak ayarlar.
   - `agent.skipBootstrap=true` ayarlar (BOOTSTRAP.md yok).
   - Eksikse workspace dosyalarını tohumlar:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Varsayılan kimlik: **C3‑PO** (protokol droidi).
   - Dev modunda kanal sağlayıcılarını atlar (`OPENCLAW_SKIP_CHANNELS=1`).

Sıfırlama akışı (temiz başlangıç):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` **global** bir profil bayrağıdır ve bazı çalıştırıcılar tarafından yutulur. Açıkça yazmanız gerekiyorsa env var biçimini kullanın:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset`, yapılandırmayı, kimlik bilgilerini, oturumları ve dev workspace'i (`rm` değil `trash` kullanarak) siler; ardından varsayılan dev kurulumunu yeniden oluşturur.

<Tip>
Dev olmayan bir gateway zaten çalışıyorsa (launchd veya systemd), önce durdurun:

```bash
openclaw gateway stop
```

</Tip>

## Ham akış günlükleme (OpenClaw)

OpenClaw, herhangi bir filtreleme/biçimlendirmeden önce **ham asistan akışını** günlüğe kaydedebilir.
Bu, muhakemenin düz metin deltaları olarak mı
(yoksa ayrı düşünme blokları olarak mı) geldiğini görmenin en iyi yoludur.

CLI üzerinden etkinleştirin:

```bash
pnpm gateway:watch --raw-stream
```

İsteğe bağlı yol geçersiz kılma:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Eşdeğer ortam değişkenleri:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Varsayılan dosya:

`~/.openclaw/logs/raw-stream.jsonl`

## Ham parça günlüğe kaydetme (pi-mono)

**Ham OpenAI uyumlu parçaları**, bloklara ayrıştırılmadan önce yakalamak için
pi-mono ayrı bir günlük kaydedici sunar:

```bash
PI_RAW_STREAM=1
```

İsteğe bağlı yol:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Varsayılan dosya:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Not: bu yalnızca pi-mono’nun `openai-completions` sağlayıcısını kullanan
> süreçler tarafından yayılır.

## Güvenlik notları

- Ham akış günlükleri tam istemleri, araç çıktısını ve kullanıcı verilerini içerebilir.
- Günlükleri yerel tutun ve hata ayıklamadan sonra silin.
- Günlükleri paylaşırsanız önce gizli bilgileri ve kişisel verileri temizleyin.

## İlgili

- [Sorun giderme](/tr/help/troubleshooting)
- [SSS](/tr/help/faq)
