---
read_when:
    - Ham model çıktısını akıl yürütme sızıntısı açısından incelemeniz gerekir
    - Yineleme yaparken Gateway'i izleme modunda çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: izleme modu, ham model akışları ve akıl yürütme sızıntısını izleme'
title: Hata ayıklama
x-i18n:
    generated_at: "2026-04-30T09:26:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3c4ba151cf1ef1dd689077cee93467b7bc77b765665231028941a345b5345ea
    source_path: help/debugging.md
    workflow: 16
---

Akış çıktısı için hata ayıklama yardımcıları, özellikle bir sağlayıcı akıl yürütmeyi normal metne karıştırdığında.

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

Tam ayrıntılı modu açmadan tek bir oturumda Plugin'e ait izleme/hata ayıklama satırlarını görmek istediğinizde `/trace` kullanın.

Örnekler:

```text
/trace
/trace on
/trace off
```

Active Memory hata ayıklama özetleri gibi Plugin tanılamaları için `/trace` kullanın.
Normal ayrıntılı durum/araç çıktısı için `/verbose` kullanmaya devam edin ve yalnızca çalışma zamanı yapılandırma geçersiz kılmaları için `/debug` kullanmaya devam edin.

## Plugin yaşam döngüsü izlemesi

Plugin yaşam döngüsü komutları yavaş hissettirdiğinde ve Plugin meta verileri, keşif, kayıt defteri, çalışma zamanı aynası, yapılandırma mutasyonu ve yenileme işi için yerleşik bir aşama dökümüne ihtiyaç duyduğunuzda `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` kullanın. İzleme isteğe bağlıdır ve stderr'e yazar, bu yüzden JSON komut çıktısı ayrıştırılabilir kalır.

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

CPU profil oluşturucuya başvurmadan önce bunu Plugin yaşam döngüsü incelemesi için kullanın.
Komut bir kaynak checkout'undan çalışıyorsa, `pnpm build` sonrasında `node dist/entry.js ...` ile derlenmiş çalışma zamanını ölçmeyi tercih edin; `pnpm openclaw ...` kaynak çalıştırıcı ek yükünü de ölçer.

## Geçici CLI hata ayıklama zamanlaması

OpenClaw yerel inceleme için küçük bir yardımcı olarak `src/cli/debug-timing.ts` dosyasını tutar. Bu yardımcı bilinçli olarak CLI başlatmaya, komut yönlendirmeye veya varsayılan olarak herhangi bir komuta bağlanmamıştır. Yalnızca yavaş bir komutta hata ayıklarken kullanın, ardından davranış değişikliğini indirmeden önce import'u ve aralıkları kaldırın.

Bir komut yavaş olduğunda ve CPU profil oluşturucu kullanmaya mı yoksa belirli bir alt sistemi düzeltmeye mi karar vermeden önce hızlı bir aşama dökümüne ihtiyaç duyduğunuzda bunu kullanın.

### Geçici aralıklar ekleyin

Yardımcıyı incelediğiniz kodun yakınına ekleyin. Örneğin, `openclaw models list` hatası ayıklanırken `src/commands/models/list.list-command.ts` içinde geçici bir yama şöyle görünebilir:

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
- Şüpheli yavaş bölümlerin etrafına yalnızca birkaç aralık ekleyin.
- Yardımcı adları yerine `registry`, `auth_store` veya `rows` gibi geniş aşamaları tercih edin.
- Eşzamanlı iş için `time()`, promise'ler için `timeAsync()` kullanın.
- stdout'u temiz tutun. Yardımcı stderr'e yazar, bu yüzden komut JSON çıktısı ayrıştırılabilir kalır.
- Son düzeltme PR'ını açmadan önce geçici import'ları ve aralıkları kaldırın.
- Optimizasyonu açıklayan issue veya PR'a zamanlama çıktısını ya da kısa bir özeti ekleyin.

### Okunabilir çıktıyla çalıştırın

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

| Aşama                                   |            Süre | Anlamı                                                                                                                    |
| --------------------------------------- | --------------: | ------------------------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |           20.3s | Auth-profile deposu yüklemesi en büyük maliyettir ve önce incelenmelidir.                                                 |
| `debug:models:list:ensure_models_json`   |            5.0s | `models.json` eşitlemesi, önbelleğe alma veya atlama koşulları açısından incelenecek kadar pahalıdır.                     |
| `debug:models:list:load_model_registry`  |            5.9s | Kayıt defteri oluşturma ve sağlayıcı kullanılabilirliği çalışması da anlamlı maliyetlerdir.                               |
| `debug:models:list:read_registry_models` |            2.4s | Tüm kayıt defteri modellerini okumak ücretsiz değildir ve `--all` için önemli olabilir.                                   |
| satır ekleme aşamaları                  | toplam 3.2s     | Gösterilen beş satırı oluşturmak hâlâ birkaç saniye sürüyor, bu yüzden filtreleme yolu daha yakından bakılmayı hak ediyor. |
| `debug:models:list:print_model_table`    |             0ms | İşleme darboğaz değildir.                                                                                                 |

Bu bulgular, zamanlama kodunu üretim yollarında tutmadan bir sonraki yamaya rehberlik etmek için yeterlidir.

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

### İndirmeden önce temizleyin

Son PR'ı açmadan önce:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

PR açıkça kalıcı bir tanılama yüzeyi eklemiyorsa komut hiçbir geçici enstrümantasyon çağrı yeri döndürmemelidir. Normal performans düzeltmeleri için yalnızca davranış değişikliğini, testleri ve zamanlama kanıtını içeren kısa bir notu tutun.

Daha derin CPU etkin noktaları için daha fazla zamanlama sarmalayıcısı eklemek yerine Node profil oluşturmayı (`--cpu-prof`) veya harici bir profil oluşturucuyu kullanın.

## Gateway izleme modu

Hızlı yineleme için Gateway'i dosya izleyicisi altında çalıştırın:

```bash
pnpm gateway:watch
```

Varsayılan olarak bu, `openclaw-gateway-watch-main` adlı bir tmux oturumunu (veya `openclaw-gateway-watch-dev-19001` gibi profil/porta özgü bir varyantı) başlatır ya da yeniden başlatır ve etkileşimli terminallerden otomatik olarak bağlanır.
Etkileşimsiz kabuklar, CI ve ajan exec çağrıları bağlı kalmaz ve bunun yerine bağlanma talimatlarını yazdırır. Gerektiğinde elle bağlanın:

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

tmux sarmalayıcısı `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` ve `OPENCLAW_SKIP_CHANNELS` gibi yaygın gizli olmayan çalışma zamanı seçicilerini bölmeye taşır. Sağlayıcı kimlik bilgilerini normal profil/yapılandırmanıza koyun veya tek seferlik geçici sırlar için ham ön plan modunu kullanın.

İzleyici, `src/` altındaki derlemeyle ilgili dosyalarda, Plugin kaynak dosyalarında, Plugin `package.json` ve `openclaw.plugin.json` meta verilerinde, `tsconfig.json`, `package.json` ve `tsdown.config.ts` dosyalarında yeniden başlatılır. Plugin meta veri değişiklikleri, `tsdown` yeniden derlemesini zorlamadan Gateway'i yeniden başlatır; kaynak ve yapılandırma değişiklikleri yine önce `dist` derler.

Gateway CLI bayraklarını `gateway:watch` sonrasına ekleyin; her yeniden başlatmada aktarılırlar. Aynı izleme komutunu yeniden çalıştırmak adlandırılmış tmux bölmesini yeniden oluşturur ve ham izleyici yine tek izleyici kilidini korur, böylece yinelenen izleyici üst süreçleri birikmek yerine değiştirilir.

## Geliştirme profili + geliştirme Gateway'i (--dev)

Durumu yalıtmak ve hata ayıklama için güvenli, atılabilir bir kurulum başlatmak üzere geliştirme profilini kullanın. **İki** `--dev` bayrağı vardır:

- **Genel `--dev` (profil):** durumu `~/.openclaw-dev` altında yalıtır ve Gateway portunu varsayılan olarak `19001` yapar (türetilmiş portlar onunla birlikte kayar).
- **`gateway --dev`: eksik olduğunda Gateway'e varsayılan bir yapılandırma + çalışma alanını otomatik oluşturmasını söyler** (ve BOOTSTRAP.md dosyasını atlar).

Önerilen akış (geliştirme profili + geliştirme önyüklemesi):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Henüz genel bir kurulumunuz yoksa CLI'yi `pnpm openclaw ...` ile çalıştırın.

Bunun yaptığı:

1. **Profil yalıtımı** (genel `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (tarayıcı/canvas buna göre kayar)

2. **Geliştirme önyüklemesi** (`gateway --dev`)
   - Eksikse minimal bir yapılandırma yazar (`gateway.mode=local`, loopback'e bağlan).
   - `agent.workspace` değerini geliştirme çalışma alanına ayarlar.
   - `agent.skipBootstrap=true` değerini ayarlar (BOOTSTRAP.md yok).
   - Eksikse çalışma alanı dosyalarını tohumlar:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Varsayılan kimlik: **C3‑PO** (protokol droidi).
   - Geliştirme modunda kanal sağlayıcılarını atlar (`OPENCLAW_SKIP_CHANNELS=1`).

Sıfırlama akışı (taze başlangıç):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` **genel** bir profil bayrağıdır ve bazı çalıştırıcılar tarafından tüketilir. Açıkça yazmanız gerekirse env var biçimini kullanın:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset`, yapılandırmayı, kimlik bilgilerini, oturumları ve geliştirme çalışma alanını (`rm` değil `trash` kullanarak) siler, ardından varsayılan geliştirme kurulumunu yeniden oluşturur.

<Tip>
Geliştirme dışı bir Gateway zaten çalışıyorsa (launchd veya systemd), önce onu durdurun:

```bash
openclaw gateway stop
```

</Tip>

## Ham akış günlüğe kaydetme (OpenClaw)

OpenClaw, herhangi bir filtreleme/biçimlendirme yapılmadan önce **ham asistan akışını** günlüğe kaydedebilir.
Bu, akıl yürütmenin düz metin deltaları olarak mı (yoksa ayrı düşünme blokları olarak mı) geldiğini görmenin en iyi yoludur.

Bunu CLI aracılığıyla etkinleştirin:

```bash
pnpm gateway:watch --raw-stream
```

İsteğe bağlı yol geçersiz kılması:

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

## Ham parça günlüğe kaydı (pi-mono)

**ham OpenAI uyumlu parçaları** bloklara ayrıştırılmadan önce yakalamak için
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

> Not: bu yalnızca pi-mono’nun
> `openai-completions` sağlayıcısını kullanan süreçler tarafından yayımlanır.

## Güvenlik notları

- Ham akış günlükleri tam istemleri, araç çıktısını ve kullanıcı verilerini içerebilir.
- Günlükleri yerel tutun ve hata ayıklamadan sonra silin.
- Günlükleri paylaşırsanız, önce gizli bilgileri ve PII’yi temizleyin.

## İlgili

- [Sorun giderme](/tr/help/troubleshooting)
- [SSS](/tr/help/faq)
