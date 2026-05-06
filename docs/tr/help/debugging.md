---
read_when:
    - Ham model çıktısını akıl yürütme sızıntısı açısından incelemeniz gerekir
    - Gateway’i yineleme yaparken izleme modunda çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: izleme modu, ham model akışları ve akıl yürütme sızıntısını izleme'
title: Hata ayıklama
x-i18n:
    generated_at: "2026-05-06T09:16:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b59845244a1e2920ca15b9b85ce5b29424e3a1528eece8c18ddeab69feaf86f
    source_path: help/debugging.md
    workflow: 16
---

Hata ayıklama yardımcıları, özellikle bir sağlayıcı akıl yürütmeyi normal metne karıştırdığında akış çıktısı için.

## Runtime hata ayıklama geçersiz kılmaları

**Yalnızca runtime** yapılandırma geçersiz kılmalarını (disk değil, bellek) ayarlamak için sohbette `/debug` kullanın.
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

Tam ayrıntılı modu açmadan tek bir oturumda Plugin sahibi izleme/hata ayıklama satırlarını görmek istediğinizde `/trace` kullanın.

Örnekler:

```text
/trace
/trace on
/trace off
```

Active Memory hata ayıklama özetleri gibi Plugin tanılamaları için `/trace` kullanın.
Normal ayrıntılı durum/araç çıktısı için `/verbose` kullanmaya devam edin ve yalnızca runtime yapılandırma geçersiz kılmaları için `/debug` kullanmaya devam edin.

## Plugin yaşam döngüsü izlemesi

Plugin yaşam döngüsü komutları yavaş hissettirdiğinde ve Plugin meta verisi, keşif, kayıt, runtime yansısı, yapılandırma mutasyonu ve yenileme işi için yerleşik bir aşama dökümüne ihtiyacınız olduğunda `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` kullanın. İzleme isteğe bağlıdır ve stderr'e yazar, bu nedenle JSON komut çıktısı ayrıştırılabilir kalır.

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

CPU profil aracına başvurmadan önce bunu Plugin yaşam döngüsü araştırması için kullanın.
Komut bir kaynak checkout'ından çalışıyorsa, `pnpm build` sonrasında `node dist/entry.js ...` ile derlenmiş runtime'ı ölçmeyi tercih edin; `pnpm openclaw ...` kaynak çalıştırıcı ek yükünü de ölçer.

## CLI başlatma ve komut profilleme

Bir komut yavaş hissettirdiğinde depoya eklenmiş başlatma karşılaştırmasını kullanın:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Normal kaynak çalıştırıcı üzerinden tek seferlik profilleme için `OPENCLAW_RUN_NODE_CPU_PROF_DIR` ayarlayın:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Kaynak çalıştırıcı Node CPU profil bayraklarını ekler ve komut için bir `.cpuprofile` yazar. Komut koduna geçici enstrümantasyon eklemeden önce bunu kullanın.

Eşzamanlı dosya sistemi veya modül yükleyici işi gibi görünen başlatma takılmaları için, kaynak çalıştırıcı üzerinden Node'un senkron G/Ç izleme bayrağını ekleyin:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch`, izlenen Gateway alt süreci için bu bayrağı varsayılan olarak etkinleştirir.
İzleme modunda Node senkron G/Ç izleme çıktısını bastırmak için `OPENCLAW_TRACE_SYNC_IO=0` ayarlayın.

## Gateway izleme modu

Hızlı yineleme için gateway'i dosya izleyicisi altında çalıştırın:

```bash
pnpm gateway:watch
```

Varsayılan olarak bu, `openclaw-gateway-watch-main` adlı bir tmux oturumu (veya `openclaw-gateway-watch-dev-19001` gibi profile/porta özgü bir varyant) başlatır veya yeniden başlatır ve etkileşimli terminallerden otomatik olarak bağlanır. Etkileşimsiz kabuklar, CI ve agent exec çağrıları bağlı kalmaz ve bunun yerine bağlanma talimatlarını yazdırır. Gerektiğinde elle bağlanın:

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

Başlatma/runtime darboğazlarını hata ayıklarken izlenen Gateway CPU süresini profilleyin:

```bash
pnpm gateway:watch --benchmark
```

İzleme sarmalayıcısı Gateway'i çağırmadan önce `--benchmark` tüketir ve `.artifacts/gateway-watch-profiles/` altında her Gateway alt süreç çıkışı için bir V8 `.cpuprofile` yazar. Mevcut profili diske yazmak için izlenen gateway'i durdurun veya yeniden başlatın, ardından Chrome DevTools ya da Speedscope ile açın:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Profilleri başka bir yerde istediğinizde `--benchmark-dir <path>` kullanın.
Karşılaştırılan alt sürecin varsayılan `--force` port temizliğini atlamasını ve Gateway portu zaten kullanımdaysa hızlıca başarısız olmasını istediğinizde `--benchmark-no-force` kullanın.
Karşılaştırma modu varsayılan olarak senkron G/Ç izleme gürültüsünü bastırır. Açıkça hem CPU profillerini hem de Node senkron G/Ç yığın izlerini istediğinizde `--benchmark` ile `OPENCLAW_TRACE_SYNC_IO=1` ayarlayın. Karşılaştırma modunda bu izleme blokları karşılaştırma dizini altında `gateway-watch-output.log` dosyasına yazılır ve terminal bölmesinden filtrelenir; normal Gateway günlükleri görünür kalır.

tmux sarmalayıcısı `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` ve `OPENCLAW_SKIP_CHANNELS` gibi yaygın gizli olmayan runtime seçicilerini bölmeye taşır. Sağlayıcı kimlik bilgilerini normal profil/yapılandırmanıza koyun veya tek seferlik geçici sırlar için ham ön plan modunu kullanın.
İzlenen Gateway başlatma sırasında çıkarsa, izleyici bir kez `openclaw doctor --fix --non-interactive` çalıştırır ve Gateway alt sürecini yeniden başlatır. Geliştirmeye özel onarım geçişi olmadan özgün başlatma hatasını istediğinizde `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` kullanın.
Yönetilen tmux bölmesi ayrıca okunabilirlik için varsayılan olarak renkli Gateway günlükleri kullanır; ANSI çıktısını devre dışı bırakmak için `pnpm gateway:watch` başlatırken `FORCE_COLOR=0` ayarlayın.

İzleyici, `src/` altındaki derlemeyle ilgili dosyalar, Plugin kaynak dosyaları, Plugin `package.json` ve `openclaw.plugin.json` meta verileri, `tsconfig.json`, `package.json` ve `tsdown.config.ts` üzerinde yeniden başlatır. Plugin meta verisi değişiklikleri gateway'i `tsdown` yeniden derlemesini zorlamadan yeniden başlatır; kaynak ve yapılandırma değişiklikleri hâlâ önce `dist` derler.

Her yeniden başlatmada geçirilmeleri için gateway CLI bayraklarını `gateway:watch` sonrasına ekleyin. Aynı izleme komutunu yeniden çalıştırmak adlandırılmış tmux bölmesini yeniden oluşturur ve ham izleyici yine tek izleyici kilidini korur, böylece yinelenen izleyici üst süreçleri birikmek yerine değiştirilir.

## Dev profili + dev gateway (--dev)

Durumu yalıtmak ve hata ayıklama için güvenli, atılabilir bir kurulum başlatmak üzere dev profilini kullanın. **İki** `--dev` bayrağı vardır:

- **Global `--dev` (profil):** durumu `~/.openclaw-dev` altında yalıtır ve gateway portunu varsayılan olarak `19001` yapar (türetilmiş portlar bununla birlikte kayar).
- **`gateway --dev`: eksik olduğunda Gateway'e varsayılan bir yapılandırma + çalışma alanını otomatik oluşturmasını söyler** (ve BOOTSTRAP.md dosyasını atlar).

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
   - `agent.workspace` değerini dev çalışma alanına ayarlar.
   - `agent.skipBootstrap=true` ayarlar (BOOTSTRAP.md yok).
   - Eksikse çalışma alanı dosyalarını tohumlar:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Varsayılan kimlik: **C3-PO** (protokol droidi).
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

`--reset` yapılandırmayı, kimlik bilgilerini, oturumları ve dev çalışma alanını (`rm` değil `trash` kullanarak) siler, ardından varsayılan dev kurulumunu yeniden oluşturur.

<Tip>
Dev olmayan bir gateway zaten çalışıyorsa (launchd veya systemd), önce onu durdurun:

```bash
openclaw gateway stop
```

</Tip>

## Ham akış günlüğü (OpenClaw)

OpenClaw, herhangi bir filtreleme/biçimlendirme öncesinde **ham asistan akışını** günlüğe kaydedebilir.
Bu, akıl yürütmenin düz metin deltaları olarak mı (yoksa ayrı düşünme blokları olarak mı) geldiğini görmenin en iyi yoludur.

CLI üzerinden etkinleştirin:

```bash
pnpm gateway:watch --raw-stream
```

İsteğe bağlı yol geçersiz kılma:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Eşdeğer env var değerleri:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Varsayılan dosya:

`~/.openclaw/logs/raw-stream.jsonl`

## Ham parça günlüğü (pi-mono)

**Ham OpenAI uyumlu parçaları** bloklara ayrıştırılmadan önce yakalamak için pi-mono ayrı bir günlükleyici sunar:

```bash
PI_RAW_STREAM=1
```

İsteğe bağlı yol:

```bash
PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl
```

Varsayılan dosya:

`~/.pi-mono/logs/raw-openai-completions.jsonl`

> Not: bu yalnızca pi-mono'nun
> `openai-completions` sağlayıcısını kullanan süreçler tarafından üretilir.

## Güvenlik notları

- Ham akış günlükleri tam promptları, araç çıktısını ve kullanıcı verilerini içerebilir.
- Günlükleri yerel tutun ve hata ayıklamadan sonra silin.
- Günlükleri paylaşırsanız önce sırları ve kişisel verileri temizleyin.

## VSCode'da hata ayıklama

VSCode tabanlı IDE'lerde hata ayıklamayı etkinleştirmek için kaynak haritaları gerekir, çünkü üretilen dosyaların çoğu derleme sürecinin bir parçası olarak hash'li adlarla sonuçlanır. Dahil edilen `launch.json` yapılandırmaları Gateway servisini hedefler, ancak başka amaçlar için hızlıca uyarlanabilir:

1. **Gateway'i Yeniden Derle ve Hata Ayıkla** - Yeni bir derleme oluşturduktan sonra Gateway servisinde hata ayıklar
2. **Gateway'de Hata Ayıkla** - Önceden var olan bir derlemenin Gateway servisinde hata ayıklar

### Kurulum

Varsayılan **Gateway'i Yeniden Derle ve Hata Ayıkla** yapılandırması hazır gelir; `/dist` klasörünü otomatik olarak siler ve projeyi hata ayıklama etkin şekilde yeniden derler:

1. Activity Bar'dan **Çalıştır ve Hata Ayıkla** panelini açın veya `Ctrl`+`Shift`+`D` tuşlarına basın
2. IDE'de yapılandırma açılır menüsünde **Gateway'i Yeniden Derle ve Hata Ayıkla** seçili olduğundan emin olun, ardından **Hata Ayıklamayı Başlat** düğmesine basın

Alternatif olarak - derleme ve hata ayıklama süreçlerini elle yönetmeyi tercih ediyorsanız:

1. Bir terminal açın ve kaynak haritalarını etkinleştirin:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Aynı terminalde projeyi yeniden derleyin: `pnpm clean:dist && pnpm build`
3. IDE'de **Çalıştır ve Hata Ayıkla** yapılandırma açılır menüsünde **Gateway'de Hata Ayıkla** seçeneğini seçin, ardından **Hata Ayıklamayı Başlat** düğmesine basın

Artık TypeScript kaynak dosyalarınızda (`src/` dizini) kesme noktaları ayarlayabilirsiniz ve hata ayıklayıcı, kaynak haritaları aracılığıyla kesme noktalarını derlenmiş JavaScript'e doğru şekilde eşler. Değişkenleri inceleyebilir, kodda adım adım ilerleyebilir ve çağrı yığınlarını beklendiği gibi inceleyebilirsiniz.

### Notlar

- **"Gateway'i Yeniden Derle ve Hata Ayıkla"** seçeneğini kullanıyorsanız - hata ayıklayıcı her başlatıldığında `/dist` klasörünü tamamen siler ve Gateway'i başlatmadan önce kaynak haritaları etkin şekilde tam bir `pnpm build` çalıştırır
- **"Gateway'de Hata Ayıkla"** seçeneğini kullanıyorsanız - hata ayıklama oturumları `/dist` klasörünü etkilemeden herhangi bir zamanda başlatılıp durdurulabilir, ancak hem hata ayıklamayı etkinleştirmek hem de derleme döngüsünü yönetmek için ayrı bir terminal süreci kullanmanız gerekir
- Projenin diğer bölümlerinde hata ayıklamak için `launch.json` ayarlarında `args` değerini değiştirin
- Diğer görevler için derlenmiş OpenClaw CLI'yi kullanmanız gerekiyorsa (yani hata ayıklama oturumunuz yeni bir auth token oluşturursa `dashboard --no-open`), başka bir terminalde `node ./openclaw.mjs` olarak çalıştırabilir veya `alias openclaw-build="node $(pwd)/openclaw.mjs"` gibi bir kabuk alias'ı oluşturabilirsiniz

## İlgili

- [Sorun Giderme](/tr/help/troubleshooting)
- [SSS](/tr/help/faq)
