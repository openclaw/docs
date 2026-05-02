---
read_when:
    - Akıl yürütme sızıntısı olup olmadığını görmek için ham model çıktısını incelemeniz gerekir
    - Gateway'i yineleme yaparken izleme modunda çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: izleme modu, ham model akışları ve akıl yürütme sızıntısını izleme'
title: Hata ayıklama
x-i18n:
    generated_at: "2026-05-02T20:46:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: de4bd994079f5463f4734404d1ba0768cb003609e16113f5f8f14179a190e917
    source_path: help/debugging.md
    workflow: 16
---

Akış çıktısı için hata ayıklama yardımcıları; özellikle bir sağlayıcı akıl yürütmeyi normal metne karıştırdığında kullanışlıdır.

## Çalışma zamanı hata ayıklama geçersiz kılmaları

**Yalnızca çalışma zamanı** yapılandırma geçersiz kılmalarını (bellek, disk değil) ayarlamak için sohbette `/debug` kullanın.
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

Tam ayrıntılı modu açmadan, tek bir oturumda Plugin'e ait izleme/hata ayıklama
satırlarını görmek istediğinizde `/trace` kullanın.

Örnekler:

```text
/trace
/trace on
/trace off
```

Active Memory hata ayıklama özetleri gibi Plugin tanılamaları için `/trace`
kullanın. Normal ayrıntılı durum/araç çıktısı için `/verbose` kullanmaya devam
edin ve yalnızca çalışma zamanı yapılandırma geçersiz kılmaları için `/debug`
kullanmaya devam edin.

## Plugin yaşam döngüsü izlemesi

Plugin yaşam döngüsü komutları yavaş hissettirdiğinde ve Plugin meta verileri,
keşif, kayıt defteri, çalışma zamanı aynası, yapılandırma mutasyonu ve yenileme
işi için yerleşik bir aşama dökümüne ihtiyaç duyduğunuzda
`OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` kullanın. İzleme isteğe bağlıdır ve stderr'e
yazar; böylece JSON komut çıktısı ayrıştırılabilir kalır.

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

CPU profil oluşturucusuna başvurmadan önce bunu Plugin yaşam döngüsü incelemesi
için kullanın. Komut bir kaynak checkout'tan çalışıyorsa, `pnpm build`
sonrasında derlenmiş çalışma zamanını `node dist/entry.js ...` ile ölçmeyi tercih
edin; `pnpm openclaw ...` kaynak çalıştırıcı ek yükünü de ölçer.

## Geçici CLI hata ayıklama zamanlaması

OpenClaw, yerel inceleme için küçük bir yardımcı olarak `src/cli/debug-timing.ts`
dosyasını tutar. Bu yardımcı kasıtlı olarak CLI başlangıcına, komut yönlendirmeye
veya herhangi bir komuta varsayılan olarak bağlanmamıştır. Yalnızca yavaş bir
komutta hata ayıklarken kullanın, ardından davranış değişikliğini indirmeden önce
import'u ve aralıkları kaldırın.

Bir komut yavaş olduğunda ve CPU profil oluşturucusu kullanmaya veya belirli bir
alt sistemi düzeltmeye karar vermeden önce hızlı bir aşama dökümüne ihtiyaç
duyduğunuzda bunu kullanın.

### Geçici aralıklar ekleme

Yardımcıyı incelediğiniz kodun yakınına ekleyin. Örneğin, `openclaw models list`
hata ayıklanırken `src/commands/models/list.list-command.ts` içinde geçici bir
yama şöyle görünebilir:

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
- Şüphelenilen yavaş bölümlerin etrafına yalnızca birkaç aralık ekleyin.
- Yardımcı adları yerine `registry`, `auth_store` veya `rows` gibi geniş
  aşamaları tercih edin.
- Eşzamanlı işler için `time()`, promise'ler için `timeAsync()` kullanın.
- stdout'u temiz tutun. Yardımcı stderr'e yazar; böylece komut JSON çıktısı
  ayrıştırılabilir kalır.
- Son düzeltme PR'ını açmadan önce geçici import'ları ve aralıkları kaldırın.
- Optimizasyonu açıklayan issue veya PR'a zamanlama çıktısını ya da kısa bir
  özeti ekleyin.

### Okunabilir çıktıyla çalıştırma

Okunabilir mod canlı hata ayıklama için en iyisidir:

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

| Aşama                                    |            Süre | Ne anlama gelir                                                                                          |
| ---------------------------------------- | --------------: | -------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |           20.3s | Auth-profile deposu yükü en büyük maliyettir ve önce incelenmelidir.                                     |
| `debug:models:list:ensure_models_json`   |            5.0s | `models.json` eşitlemesi, önbelleğe alma veya atlama koşulları açısından incelenecek kadar pahalıdır.    |
| `debug:models:list:load_model_registry`  |            5.9s | Kayıt defteri oluşturma ve sağlayıcı kullanılabilirliği işleri de anlamlı maliyetlerdir.                 |
| `debug:models:list:read_registry_models` |            2.4s | Tüm kayıt defteri modellerini okumak ücretsiz değildir ve `--all` için önemli olabilir.                  |
| satır ekleme aşamaları                   | toplam 3.2s     | Görüntülenen beş satırı oluşturmak yine de birkaç saniye sürüyor; bu yüzden filtreleme yolu daha yakından incelenmelidir. |
| `debug:models:list:print_model_table`    |             0ms | İşleme darboğaz değildir.                                                                                |

Bu bulgular, zamanlama kodunu üretim yollarında tutmadan bir sonraki yamaya yön
vermek için yeterlidir.

### JSON çıktısıyla çalıştırma

Zamanlama verilerini kaydetmek veya karşılaştırmak istediğinizde JSON modunu
kullanın:

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

### İndirmeden önce temizleme

Son PR'ı açmadan önce:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

PR açıkça kalıcı bir tanılama yüzeyi eklemiyorsa, komut hiçbir geçici
enstrümantasyon çağrı yeri döndürmemelidir. Normal performans düzeltmeleri için
yalnızca davranış değişikliğini, testleri ve zamanlama kanıtıyla birlikte kısa
bir notu tutun.

Daha derin CPU sıcak noktaları için daha fazla zamanlama sarmalayıcısı eklemek
yerine Node profil oluşturmayı (`--cpu-prof`) veya harici bir profil
oluşturucuyu kullanın.

## Gateway izleme modu

Hızlı yineleme için gateway'i dosya izleyicisi altında çalıştırın:

```bash
pnpm gateway:watch
```

Varsayılan olarak bu, `openclaw-gateway-watch-main` adlı bir tmux oturumu (veya
`openclaw-gateway-watch-dev-19001` gibi profile/porta özgü bir varyant) başlatır
ya da yeniden başlatır ve etkileşimli terminallerden otomatik olarak bağlanır.
Etkileşimsiz kabuklar, CI ve agent exec çağrıları ayrık kalır ve bunun yerine
bağlanma talimatlarını yazdırır. Gerektiğinde elle bağlanın:

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

Başlangıç/çalışma zamanı sıcak noktalarında hata ayıklarken izlenen Gateway CPU
süresini profilleyin:

```bash
pnpm gateway:watch --benchmark
```

İzleme sarmalayıcısı, Gateway'i çağırmadan önce `--benchmark` değerini tüketir
ve her Gateway alt süreç çıkışı için `.artifacts/gateway-watch-profiles/`
altına bir V8 `.cpuprofile` yazar. Geçerli profili boşaltmak için izlenen
gateway'i durdurun veya yeniden başlatın, ardından Chrome DevTools ya da
Speedscope ile açın:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Profilleri başka bir yerde istediğinizde `--benchmark-dir <path>` kullanın.

tmux sarmalayıcısı `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`,
`OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` ve `OPENCLAW_SKIP_CHANNELS` gibi
yaygın, gizli olmayan çalışma zamanı seçicilerini bölmeye taşır. Sağlayıcı kimlik
bilgilerini normal profilinizde/yapılandırmanızda tutun veya tek seferlik geçici
gizli değerler için ham ön plan modunu kullanın.
Yönetilen tmux bölmesi okunabilirlik için varsayılan olarak renkli Gateway
günlükleri de kullanır; ANSI çıktısını devre dışı bırakmak için
`pnpm gateway:watch` başlatırken `FORCE_COLOR=0` ayarlayın.

İzleyici `src/` altındaki derleme açısından ilgili dosyalarda, Plugin kaynak
dosyalarında, Plugin `package.json` ve `openclaw.plugin.json` meta verilerinde,
`tsconfig.json`, `package.json` ve `tsdown.config.ts` dosyalarında yeniden
başlatılır. Plugin meta veri değişiklikleri, `tsdown` yeniden derlemesini
zorlamadan gateway'i yeniden başlatır; kaynak ve yapılandırma değişiklikleri
yine de önce `dist` derler.

Her yeniden başlatmada iletilmeleri için `gateway:watch` sonrasına herhangi bir
gateway CLI bayrağı ekleyin. Aynı izleme komutunu yeniden çalıştırmak, adlandırılmış
tmux bölmesini yeniden oluşturur ve ham izleyici yine tek izleyici kilidini
korur; böylece yinelenen izleyici üst süreçleri yığılmak yerine değiştirilir.

## Dev profili + dev gateway (--dev)

Durumu yalıtmak ve hata ayıklama için güvenli, atılabilir bir kurulum başlatmak
amacıyla dev profilini kullanın. **İki** `--dev` bayrağı vardır:

- **Global `--dev` (profil):** durumu `~/.openclaw-dev` altında yalıtır ve
  gateway portunu varsayılan olarak `19001` yapar (türetilmiş portlar onunla
  birlikte kayar).
- **`gateway --dev`: eksik olduğunda Gateway'e varsayılan bir yapılandırma +
  çalışma alanı otomatik oluşturmasını söyler** (ve BOOTSTRAP.md dosyasını atlar).

Önerilen akış (dev profili + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Henüz global kurulumunuz yoksa CLI'yi `pnpm openclaw ...` ile çalıştırın.

Bunun yaptığı şey:

1. **Profil yalıtımı** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (tarayıcı/canvas buna göre kayar)

2. **Dev bootstrap** (`gateway --dev`)
   - Eksikse minimal bir yapılandırma yazar (`gateway.mode=local`, bind loopback).
   - `agent.workspace` değerini dev çalışma alanına ayarlar.
   - `agent.skipBootstrap=true` ayarlar (BOOTSTRAP.md yok).
   - Eksikse çalışma alanı dosyalarını tohumlar:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Varsayılan kimlik: **C3‑PO** (protokol droidi).
   - Dev modunda kanal sağlayıcılarını atlar (`OPENCLAW_SKIP_CHANNELS=1`).

Sıfırlama akışı (taze başlangıç):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` **global** bir profil bayrağıdır ve bazı çalıştırıcılar tarafından işlenip kaldırılır. Açıkça belirtmeniz gerekirse env var biçimini kullanın:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` yapılandırmayı, kimlik bilgilerini, oturumları ve dev çalışma alanını siler
(`rm` değil, `trash` kullanarak), ardından varsayılan dev kurulumunu yeniden oluşturur.

<Tip>
Dev olmayan bir Gateway zaten çalışıyorsa (launchd veya systemd), önce onu durdurun:

```bash
openclaw gateway stop
```

</Tip>

## Ham akış günlükleme (OpenClaw)

OpenClaw, herhangi bir filtreleme/biçimlendirmeden önce **ham asistan akışını**
günlüğe kaydedebilir. Bu, reasoning’in düz metin deltaları olarak mı
(yoksa ayrı düşünme blokları olarak mı) geldiğini görmenin en iyi yoludur.

CLI üzerinden etkinleştirin:

```bash
pnpm gateway:watch --raw-stream
```

İsteğe bağlı yol geçersiz kılma:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Eşdeğer env var’lar:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Varsayılan dosya:

`~/.openclaw/logs/raw-stream.jsonl`

## Ham parça günlükleme (pi-mono)

**Ham OpenAI uyumlu parçaları** bloklara ayrıştırılmadan önce yakalamak için
pi-mono ayrı bir günlükleyici sunar:

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
> süreçler tarafından yayınlanır.

## Güvenlik notları

- Ham akış günlükleri tam istemleri, araç çıktısını ve kullanıcı verilerini içerebilir.
- Günlükleri yerel tutun ve hata ayıklamadan sonra silin.
- Günlükleri paylaşırsanız önce gizli bilgileri ve PII’yi temizleyin.

## İlgili

- [Sorun Giderme](/tr/help/troubleshooting)
- [SSS](/tr/help/faq)
