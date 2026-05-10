---
read_when:
    - Ham model çıktısını akıl yürütme sızıntısı açısından incelemeniz gerekir
    - Yineleme yaparken Gateway'i izleme modunda çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: izleme modu, ham model akışları ve akıl yürütme sızıntısını izleme'
title: Hata ayıklama
x-i18n:
    generated_at: "2026-05-10T19:39:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: adee3f6e81af12c73e7e8126111f5c4bcba1a5014f4d0d0714ae67b45db93cb0
    source_path: help/debugging.md
    workflow: 16
---

Akış çıktısı için hata ayıklama yardımcıları, özellikle bir sağlayıcı akıl yürütmeyi normal metne karıştırdığında.

## Çalışma zamanı hata ayıklama geçersiz kılmaları

**Yalnızca çalışma zamanına ait** yapılandırma geçersiz kılmaları (bellek, disk değil) ayarlamak için sohbette `/debug` kullanın.
`/debug` varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.
Bu, `openclaw.json` dosyasını düzenlemeden belirsiz ayarları değiştirmeniz gerektiğinde kullanışlıdır.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` tüm geçersiz kılmaları temizler ve diskteki yapılandırmaya geri döner.

## Oturum iz çıktısı

Tam ayrıntılı modu açmadan tek bir oturumda Plugin'e ait iz/hata ayıklama
satırlarını görmek istediğinizde `/trace` kullanın.

Örnekler:

```text
/trace
/trace on
/trace off
```

Active Memory hata ayıklama özetleri gibi Plugin tanılamaları için `/trace` kullanın.
Normal ayrıntılı durum/araç çıktısı için `/verbose` kullanmaya devam edin ve yalnızca
çalışma zamanına ait yapılandırma geçersiz kılmaları için `/debug` kullanmaya devam edin.

## Plugin yaşam döngüsü izi

Plugin yaşam döngüsü komutları yavaş hissettirdiğinde ve Plugin meta verileri,
keşif, kayıt defteri, çalışma zamanı aynası, yapılandırma mutasyonu ve yenileme işi için
yerleşik bir aşama dökümüne ihtiyaç duyduğunuzda `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`
kullanın. İz isteğe bağlıdır ve stderr'e yazar; bu nedenle JSON komut çıktısı ayrıştırılabilir kalır.

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

CPU profiler'a başvurmadan önce Plugin yaşam döngüsü incelemesi için bunu kullanın.
Komut bir kaynak checkout'ından çalışıyorsa `pnpm build` sonrasında oluşturulmuş
çalışma zamanını `node dist/entry.js ...` ile ölçmeyi tercih edin; `pnpm openclaw ...`
kaynak çalıştırıcısı ek yükünü de ölçer.

## CLI başlangıcı ve komut profilleme

Bir komut yavaş hissettirdiğinde depoya eklenmiş başlangıç benchmark'ını kullanın:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Normal kaynak çalıştırıcısı üzerinden tek seferlik profilleme için
`OPENCLAW_RUN_NODE_CPU_PROF_DIR` ayarlayın:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Kaynak çalıştırıcısı Node CPU profil bayraklarını ekler ve komut için bir
`.cpuprofile` yazar. Komut koduna geçici enstrümantasyon eklemeden önce bunu kullanın.

Eşzamanlı dosya sistemi veya modül yükleyici işi gibi görünen başlangıç takılmaları için
kaynak çalıştırıcısı üzerinden Node'un sync I/O iz bayrağını ekleyin:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch`, izlenen Gateway child için bu bayrağı varsayılan olarak devre dışı bırakır.
İzleme modunda Node sync I/O iz çıktısını açıkça istediğinizde `OPENCLAW_TRACE_SYNC_IO=1` ayarlayın.

## Gateway izleme modu

Hızlı yineleme için Gateway'i dosya izleyicisi altında çalıştırın:

```bash
pnpm gateway:watch
```

Varsayılan olarak bu, `openclaw-gateway-watch-main` adlı bir tmux oturumu (veya
`openclaw-gateway-watch-dev-19001` gibi profile/porta özel bir varyant) başlatır ya da yeniden başlatır
ve etkileşimli terminallerden otomatik olarak bağlanır. Etkileşimsiz kabuklar, CI
ve agent exec çağrıları ayrık kalır ve bunun yerine bağlanma yönergelerini yazdırır.
Gerektiğinde elle bağlanın:

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

Başlangıç/çalışma zamanı etkin noktalarında hata ayıklarken izlenen Gateway CPU süresini profilleyin:

```bash
pnpm gateway:watch --benchmark
```

İzleme sarmalayıcısı Gateway'i çağırmadan önce `--benchmark` seçeneğini tüketir ve
`.artifacts/gateway-watch-profiles/` altında her Gateway child çıkışı için
bir V8 `.cpuprofile` yazar. Geçerli profili boşaltmak için izlenen gateway'i durdurun
veya yeniden başlatın, ardından Chrome DevTools ya da Speedscope ile açın:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Profilleri başka bir yerde istediğinizde `--benchmark-dir <path>` kullanın.
Benchmark yapılan child'ın varsayılan `--force` port temizliğini atlamasını ve
Gateway portu zaten kullanımdaysa hızlıca başarısız olmasını istediğinizde `--benchmark-no-force` kullanın.
Benchmark modu, varsayılan olarak sync-I/O iz spam'ini bastırır. Hem CPU
profilleri hem de Node sync-I/O yığın izlerini açıkça istediğinizde `--benchmark` ile
`OPENCLAW_TRACE_SYNC_IO=1` ayarlayın. Benchmark modunda bu iz blokları benchmark
dizini altındaki `gateway-watch-output.log` dosyasına yazılır ve terminal bölmesinden
filtrelenir; normal Gateway günlükleri görünür kalır.

tmux sarmalayıcısı `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` ve `OPENCLAW_SKIP_CHANNELS` gibi yaygın gizli olmayan
çalışma zamanı seçicilerini bölmeye taşır. Sağlayıcı kimlik bilgilerini normal
profilinize/yapılandırmanıza koyun veya tek seferlik geçici sırlar için ham ön plan modunu kullanın.
İzlenen Gateway başlangıç sırasında çıkarsa izleyici bir kez
`openclaw doctor --fix --non-interactive` çalıştırır ve Gateway child'ı yeniden başlatır.
Yalnızca geliştirmeye özel onarım geçişi olmadan özgün başlangıç hatasını istediğinizde
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` kullanın.
Yönetilen tmux bölmesi ayrıca okunabilirlik için varsayılan olarak renkli Gateway günlükleri kullanır;
ANSI çıktısını devre dışı bırakmak için `pnpm gateway:watch` başlatırken `FORCE_COLOR=0` ayarlayın.

İzleyici, `src/` altındaki derlemeyle ilgili dosyalarda, uzantı kaynak dosyalarında,
uzantı `package.json` ve `openclaw.plugin.json` meta verilerinde, `tsconfig.json`,
`package.json` ve `tsdown.config.ts` dosyalarında yeniden başlatılır. Uzantı meta verisi değişiklikleri
gateway'i `tsdown` yeniden derlemesini zorlamadan yeniden başlatır; kaynak ve yapılandırma
değişiklikleri yine önce `dist` derler.

`gateway:watch` sonrasına herhangi bir gateway CLI bayrağı ekleyin; her yeniden başlatmada
aktarılırlar. Aynı izleme komutunu yeniden çalıştırmak adlı tmux bölmesini yeniden oluşturur ve
ham izleyici, yinelenen izleyici üst süreçlerinin birikmek yerine değiştirilmesi için
tek izleyici kilidini korumaya devam eder.

## Geliştirme profili + geliştirme gateway'i (--dev)

Durumu izole etmek ve hata ayıklama için güvenli, atılabilir bir kurulum başlatmak üzere
geliştirme profilini kullanın. **İki** `--dev` bayrağı vardır:

- **Global `--dev` (profil):** durumu `~/.openclaw-dev` altında izole eder ve
  varsayılan gateway portunu `19001` olarak ayarlar (türetilmiş portlar onunla birlikte kayar).
- **`gateway --dev`: eksik olduğunda Gateway'e varsayılan bir yapılandırma +
  çalışma alanını otomatik oluşturmasını söyler** (ve BOOTSTRAP.md dosyasını atlar).

Önerilen akış (geliştirme profili + geliştirme bootstrap'i):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Henüz global kurulumunuz yoksa CLI'yi `pnpm openclaw ...` üzerinden çalıştırın.

Bunun yaptıkları:

1. **Profil yalıtımı** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (tarayıcı/canvas buna göre kayar)

2. **Geliştirme bootstrap'i** (`gateway --dev`)
   - Eksikse minimal bir yapılandırma yazar (`gateway.mode=local`, bind loopback).
   - `agent.workspace` değerini geliştirme çalışma alanına ayarlar.
   - `agent.skipBootstrap=true` değerini ayarlar (BOOTSTRAP.md yok).
   - Eksikse çalışma alanı dosyalarını tohumlar:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Varsayılan kimlik: **C3-PO** (protokol droidi).
   - Geliştirme modunda kanal sağlayıcılarını atlar (`OPENCLAW_SKIP_CHANNELS=1`).

Sıfırlama akışı (taze başlangıç):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` bir **global** profil bayrağıdır ve bazı çalıştırıcılar tarafından tüketilir. Açıkça yazmanız gerekiyorsa env var biçimini kullanın:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset`, yapılandırmayı, kimlik bilgilerini, oturumları ve geliştirme çalışma alanını
(`rm` değil, `trash` kullanarak) siler, ardından varsayılan geliştirme kurulumunu yeniden oluşturur.

<Tip>
Geliştirme dışı bir gateway zaten çalışıyorsa (launchd veya systemd), önce durdurun:

```bash
openclaw gateway stop
```

</Tip>

## Ham akış günlükleme (OpenClaw)

OpenClaw, herhangi bir filtreleme/biçimlendirme öncesinde **ham asistan akışını** günlüğe yazabilir.
Bu, akıl yürütmenin düz metin deltaları olarak mı (yoksa ayrı düşünme blokları olarak mı)
geldiğini görmenin en iyi yoludur.

CLI üzerinden etkinleştirin:

```bash
pnpm gateway:watch --raw-stream
```

İsteğe bağlı yol geçersiz kılması:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Eşdeğer env var'lar:

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

> Not: Bu yalnızca pi-mono'nun
> `openai-completions` sağlayıcısını kullanan süreçler tarafından yayılır.

## Güvenlik notları

- Ham akış günlükleri tam istemleri, araç çıktısını ve kullanıcı verilerini içerebilir.
- Günlükleri yerel tutun ve hata ayıklamadan sonra silin.
- Günlükleri paylaşırsanız önce sırları ve PII'yi temizleyin.

## VSCode'da hata ayıklama

Derleme sürecinin bir parçası olarak oluşturulan dosyaların çoğu karma adlarla sonuçlandığı için VSCode tabanlı IDE'lerde hata ayıklamayı etkinleştirmek üzere kaynak haritaları gerekir. Dahil edilen `launch.json` yapılandırmaları Gateway hizmetini hedefler, ancak başka amaçlar için hızla uyarlanabilir:

1. **Gateway'i Yeniden Derle ve Hata Ayıkla** - Yeni bir derleme oluşturduktan sonra Gateway hizmetinde hata ayıklar
2. **Gateway'de Hata Ayıkla** - Önceden var olan bir derlemenin Gateway hizmetinde hata ayıklar

### Kurulum

Varsayılan **Gateway'i Yeniden Derle ve Hata Ayıkla** yapılandırması kullanıma hazırdır; `/dist` klasörünü otomatik olarak siler ve hata ayıklama etkin olarak projeyi yeniden derler:

1. Activity Bar'dan **Çalıştır ve Hata Ayıkla** panelini açın veya `Ctrl`+`Shift`+`D` tuşlarına basın
2. IDE'de yapılandırma açılır menüsünde **Gateway'i Yeniden Derle ve Hata Ayıkla** seçili olduğundan emin olun ve ardından **Hata Ayıklamayı Başlat** düğmesine basın

Alternatif olarak - derleme ve hata ayıklama süreçlerini elle yönetmeyi tercih ediyorsanız:

1. Bir terminal açın ve kaynak haritalarını etkinleştirin:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Aynı terminalde projeyi yeniden derleyin: `pnpm clean:dist && pnpm build`
3. IDE'de **Çalıştır ve Hata Ayıkla** yapılandırma açılır menüsünde **Gateway'de Hata Ayıkla** seçeneğini seçin ve ardından **Hata Ayıklamayı Başlat** düğmesine basın

Artık TypeScript kaynak dosyalarınızda (`src/` dizini) kesme noktaları ayarlayabilirsiniz ve hata ayıklayıcı, kaynak haritaları aracılığıyla kesme noktalarını derlenmiş JavaScript'e doğru şekilde eşleyecektir. Değişkenleri inceleyebilecek, kodda adım adım ilerleyebilecek ve çağrı yığınlarını beklendiği gibi inceleyebileceksiniz.

### Notlar

- **"Gateway'i Yeniden Derle ve Hata Ayıkla"** seçeneğini kullanıyorsanız - hata ayıklayıcı her başlatıldığında `/dist` klasörünü tamamen siler ve Gateway'i başlatmadan önce kaynak haritaları etkinleştirilmiş tam bir `pnpm build` çalıştırır
- **"Gateway'de Hata Ayıkla"** seçeneğini kullanıyorsanız - hata ayıklama oturumları `/dist` klasörünü etkilemeden herhangi bir zamanda başlatılıp durdurulabilir, ancak hem hata ayıklamayı etkinleştirmek hem de derleme döngüsünü yönetmek için ayrı bir terminal süreci kullanmanız gerekir
- Projenin diğer bölümlerinde hata ayıklamak için `args` için `launch.json` ayarlarını değiştirin
- Başka görevler için oluşturulmuş OpenClaw CLI'yi kullanmanız gerekiyorsa (örn. hata ayıklama oturumunuz yeni bir auth token oluşturuyorsa `dashboard --no-open`), başka bir terminalde `node ./openclaw.mjs` olarak çalıştırabilir veya `alias openclaw-build="node $(pwd)/openclaw.mjs"` gibi bir shell alias oluşturabilirsiniz

## İlgili

- [Sorun giderme](/tr/help/troubleshooting)
- [SSS](/tr/help/faq)
