---
read_when:
    - Ham model çıktısında akıl yürütme sızıntısı olup olmadığını incelemeniz gerekir
    - Yineleme yaparken Gateway'i izleme modunda çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: izleme modu, ham model akışları ve akıl yürütme sızıntısını izleme'
title: Hata Ayıklama
x-i18n:
    generated_at: "2026-06-28T00:40:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f643862e3d88801acabc98c72ac037dc582c2d44da339715ad70d169ca0819fe
    source_path: help/debugging.md
    workflow: 16
---

Akış çıktısı için hata ayıklama yardımcıları, özellikle bir sağlayıcı reasoning içeriğini normal metne karıştırdığında.

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

`/debug reset` tüm geçersiz kılmaları temizler ve diskteki yapılandırmaya geri döner.

## Oturum izleme çıktısı

Tam ayrıntılı modu açmadan tek bir oturumda Plugin’e ait izleme/hata ayıklama
satırlarını görmek istediğinizde `/trace` kullanın.

Örnekler:

```text
/trace
/trace on
/trace off
```

Active Memory hata ayıklama özetleri gibi Plugin tanılamaları için `/trace` kullanın.
Normal ayrıntılı durum/araç çıktısı için `/verbose` kullanmaya devam edin ve
yalnızca çalışma zamanı yapılandırma geçersiz kılmaları için `/debug` kullanmaya devam edin.

## Plugin yaşam döngüsü izlemesi

Plugin yaşam döngüsü komutları yavaş hissedildiğinde ve Plugin metadata, keşif, kayıt,
çalışma zamanı aynası, yapılandırma mutasyonu ve yenileme işleri için yerleşik bir
aşama dökümüne ihtiyacınız olduğunda `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` kullanın.
İzleme isteğe bağlıdır ve stderr’e yazar; bu nedenle JSON komut çıktısı ayrıştırılabilir kalır.

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

Bunu, bir CPU profilleyiciye başvurmadan önce Plugin yaşam döngüsü incelemesi için kullanın.
Komut bir kaynak checkout’undan çalışıyorsa, `pnpm build` sonrasında yerleşik
çalışma zamanını `node dist/entry.js ...` ile ölçmeyi tercih edin; `pnpm openclaw ...`
kaynak çalıştırıcı ek yükünü de ölçer.

## CLI başlatma ve komut profilleme

Bir komut yavaş hissettirdiğinde depoya eklenmiş başlatma benchmark’ını kullanın:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Normal kaynak çalıştırıcı üzerinden tek seferlik profilleme için
`OPENCLAW_RUN_NODE_CPU_PROF_DIR` ayarlayın:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Kaynak çalıştırıcı Node CPU profil bayrakları ekler ve komut için bir `.cpuprofile`
yazar. Bunu, komut koduna geçici enstrümantasyon eklemeden önce kullanın.

Senkron dosya sistemi veya modül yükleyici işi gibi görünen başlatma takılmaları için
kaynak çalıştırıcı üzerinden Node’un sync I/O izleme bayrağını ekleyin:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch`, izlenen Gateway alt süreci için bu bayrağı varsayılan olarak
devre dışı bırakır. İzleme modunda Node sync I/O izleme çıktısını özellikle
istediğinizde `OPENCLAW_TRACE_SYNC_IO=1` ayarlayın.

## Gateway izleme modu

Hızlı yineleme için gateway’i dosya izleyicisi altında çalıştırın:

```bash
pnpm gateway:watch
```

Varsayılan olarak bu, `openclaw-gateway-watch-main` adlı bir tmux oturumunu
(veya `openclaw-gateway-watch-dev-19001` gibi profil/porta özgü bir varyantı)
başlatır ya da yeniden başlatır ve etkileşimli terminallerden otomatik bağlanır.
Etkileşimsiz shell’ler, CI ve agent exec çağrıları ayrık kalır ve bunun yerine
bağlanma yönergelerini yazdırır. Gerektiğinde manuel bağlanın:

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

Başlatma/çalışma zamanı sıcak noktalarını hata ayıklarken izlenen Gateway CPU süresini profilleyin:

```bash
pnpm gateway:watch --benchmark
```

İzleme sarmalayıcısı Gateway’i çağırmadan önce `--benchmark` seçeneğini tüketir ve
her Gateway alt süreç çıkışı için `.artifacts/gateway-watch-profiles/` altında
bir V8 `.cpuprofile` yazar. Geçerli profili diske boşaltmak için izlenen gateway’i
durdurun veya yeniden başlatın, ardından Chrome DevTools ya da Speedscope ile açın:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Profilleri başka bir yerde istediğinizde `--benchmark-dir <path>` kullanın.
Benchmark yapılan alt sürecin varsayılan `--force` port temizliğini atlayıp
Gateway portu zaten kullanımdaysa hızlıca hata vermesini istediğinizde
`--benchmark-no-force` kullanın.
Benchmark modu varsayılan olarak sync-I/O izleme gürültüsünü bastırır. Hem CPU
profillerini hem de Node sync-I/O stack trace’lerini özellikle istediğinizde
`--benchmark` ile birlikte `OPENCLAW_TRACE_SYNC_IO=1` ayarlayın. Benchmark modunda
bu izleme blokları benchmark dizini altındaki `gateway-watch-output.log` dosyasına
yazılır ve terminal bölmesinden filtrelenir; normal Gateway logları görünür kalır.

tmux sarmalayıcısı `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`,
`OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` ve `OPENCLAW_SKIP_CHANNELS` gibi
yaygın gizli olmayan çalışma zamanı seçicilerini bölmeye taşır. Sağlayıcı kimlik
bilgilerini normal profil/yapılandırmanıza koyun veya tek seferlik geçici sırlar
için ham ön plan modunu kullanın.
İzlenen Gateway başlatma sırasında çıkarsa, izleyici `openclaw doctor --fix --non-interactive`
komutunu bir kez çalıştırır ve Gateway alt sürecini yeniden başlatır. Dev’e özel
onarım geçişi olmadan özgün başlatma hatasını istediğinizde
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` kullanın.
Yönetilen tmux bölmesi okunabilirlik için varsayılan olarak renkli Gateway logları
kullanır; ANSI çıktısını devre dışı bırakmak için `pnpm gateway:watch` başlatırken
`FORCE_COLOR=0` ayarlayın.

İzleyici `src/` altındaki derlemeyle ilgili dosyalarda, uzantı kaynak dosyalarında,
uzantı `package.json` ve `openclaw.plugin.json` metadata dosyalarında,
`tsconfig.json`, `package.json` ve `tsdown.config.ts` dosyalarında yeniden başlatır.
Uzantı metadata değişiklikleri gateway’i `tsdown` yeniden derlemesini zorlamadan
yeniden başlatır; kaynak ve yapılandırma değişiklikleri yine önce `dist` derler.

Herhangi bir gateway CLI bayrağını `gateway:watch` sonrasına ekleyin; her yeniden
başlatmada iletilir. Aynı izleme komutunu yeniden çalıştırmak adlandırılmış tmux
bölmesini yeniden oluşturur ve ham izleyici yine tek izleyici kilidini korur; böylece
yinelenen izleyici üst süreçleri birikmek yerine değiştirilir.

## Dev profili + dev gateway (--dev)

Durumu izole etmek ve hata ayıklama için güvenli, atılabilir bir kurulum başlatmak
üzere dev profilini kullanın. **İki** `--dev` bayrağı vardır:

- **Global `--dev` (profil):** durumu `~/.openclaw-dev` altında izole eder ve
  gateway portunu varsayılan olarak `19001` yapar (türetilmiş portlar onunla birlikte kayar).
- **`gateway --dev`: eksik olduğunda Gateway’e varsayılan yapılandırma +
  çalışma alanını otomatik oluşturmasını söyler** (ve BOOTSTRAP.md dosyasını atlar).

Önerilen akış (dev profili + dev bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Henüz global kurulumunuz yoksa CLI’ı `pnpm openclaw ...` üzerinden çalıştırın.

Bunun yaptığı:

1. **Profil izolasyonu** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas buna göre kayar)

2. **Dev bootstrap** (`gateway --dev`)
   - Eksikse minimal bir yapılandırma yazar (`gateway.mode=local`, bind loopback).
   - `agent.workspace` değerini dev çalışma alanına ayarlar.
   - `agent.skipBootstrap=true` ayarlar (BOOTSTRAP.md yok).
   - Eksikse çalışma alanı dosyalarını oluşturur:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Varsayılan kimlik: **C3-PO** (protokol droid’i).
   - Dev modunda kanal sağlayıcılarını atlar (`OPENCLAW_SKIP_CHANNELS=1`).

Sıfırlama akışı (temiz başlangıç):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` **global** bir profil bayrağıdır ve bazı çalıştırıcılar tarafından tüketilir. Açıkça yazmanız gerekiyorsa env var biçimini kullanın:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset`, yapılandırmayı, kimlik bilgilerini, oturumları ve dev çalışma alanını
(`rm` değil `trash` kullanarak) temizler, ardından varsayılan dev kurulumunu yeniden oluşturur.

<Tip>
Dev olmayan bir gateway zaten çalışıyorsa (launchd veya systemd), önce onu durdurun:

```bash
openclaw gateway stop
```

</Tip>

## Ham akış günlüğe kaydı (OpenClaw)

OpenClaw, herhangi bir filtreleme/biçimlendirme öncesinde **ham asistan akışını**
günlüğe kaydedebilir. Bu, reasoning içeriğinin düz metin deltaları olarak mı
(yoksa ayrı düşünme blokları olarak mı) geldiğini görmenin en iyi yoludur.

CLI üzerinden etkinleştirin:

```bash
pnpm gateway:watch --raw-stream
```

İsteğe bağlı yol geçersiz kılması:

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

## Ham OpenAI uyumlu parça günlüğe kaydı

**Ham OpenAI uyumlu parçaları** bloklara ayrıştırılmadan önce yakalamak için
taşıma günlükleyicisini etkinleştirin:

```bash
OPENCLAW_RAW_STREAM=1
```

İsteğe bağlı yol:

```bash
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-openai-completions.jsonl
```

Varsayılan dosya:

`~/.openclaw/logs/raw-openai-completions.jsonl`

## Güvenlik notları

- Ham akış günlükleri tam istemleri, araç çıktısını ve kullanıcı verilerini içerebilir.
- Günlükleri yerel tutun ve hata ayıklamadan sonra silin.
- Günlükleri paylaşırsanız önce sırları ve PII’yi temizleyin.

## VSCode’da hata ayıklama

VSCode tabanlı IDE’lerde hata ayıklamayı etkinleştirmek için source map’ler gerekir; çünkü üretilen dosyaların çoğu derleme sürecinin bir parçası olarak hash’lenmiş adlarla sonuçlanır. Dahil edilen `launch.json` yapılandırmaları Gateway hizmetini hedefler, ancak başka amaçlar için hızla uyarlanabilir:

1. **Gateway’i Yeniden Derle ve Hata Ayıkla** - Yeni bir derleme oluşturduktan sonra Gateway hizmetinde hata ayıklar
2. **Gateway’de Hata Ayıkla** - Önceden var olan bir derlemenin Gateway hizmetinde hata ayıklar

### Kurulum

Varsayılan **Gateway’i Yeniden Derle ve Hata Ayıkla** yapılandırması kullanıma hazırdır; `/dist` klasörünü otomatik olarak siler ve projeyi hata ayıklama etkin şekilde yeniden derler:

1. Activity Bar’dan **Run and Debug** panelini açın veya `Ctrl`+`Shift`+`D` tuşlarına basın
2. IDE’de yapılandırma açılır menüsünde **Gateway’i Yeniden Derle ve Hata Ayıkla** seçili olduğundan emin olun, ardından **Start Debugging** düğmesine basın

Alternatif olarak, derleme ve hata ayıklama süreçlerini manuel yönetmeyi tercih ediyorsanız:

1. Bir terminal açın ve source map’leri etkinleştirin:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Aynı terminalde projeyi yeniden derleyin: `pnpm clean:dist && pnpm build`
3. IDE’de **Run and Debug** yapılandırma açılır menüsünde **Gateway’de Hata Ayıkla** seçeneğini seçin, ardından **Start Debugging** düğmesine basın

Artık TypeScript kaynak dosyalarınızda (`src/` dizini) breakpoint’ler ayarlayabilirsiniz ve debugger, source map’ler aracılığıyla breakpoint’leri derlenmiş JavaScript’e doğru şekilde eşler. Değişkenleri inceleyebilir, kodda adım adım ilerleyebilir ve çağrı stack’lerini beklendiği gibi inceleyebilirsiniz.

### Notlar

- **"Gateway’i Yeniden Derle ve Hata Ayıkla"** seçeneğini kullanıyorsanız, debugger her başlatıldığında `/dist` klasörünü tamamen siler ve Gateway’i başlatmadan önce source map’ler etkinleştirilmiş tam bir `pnpm build` çalıştırır
- **"Gateway’de Hata Ayıkla"** seçeneğini kullanıyorsanız, hata ayıklama oturumları `/dist` klasörünü etkilemeden herhangi bir zamanda başlatılıp durdurulabilir, ancak hem hata ayıklamayı etkinleştirmek hem de derleme döngüsünü yönetmek için ayrı bir terminal süreci kullanmanız gerekir
- Projenin diğer bölümlerinde hata ayıklamak için `args` için `launch.json` ayarlarını değiştirin
- Yerleşik OpenClaw CLI’ı başka görevler için kullanmanız gerekiyorsa (ör. hata ayıklama oturumunuz yeni bir auth token oluşturursa `dashboard --no-open`), başka bir terminalde `node ./openclaw.mjs` olarak çalıştırabilir veya `alias openclaw-build="node $(pwd)/openclaw.mjs"` gibi bir shell alias’ı oluşturabilirsiniz

## İlgili

- [Sorun Giderme](/tr/help/troubleshooting)
- [SSS](/tr/help/faq)
