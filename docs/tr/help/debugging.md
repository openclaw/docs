---
read_when:
    - Ham model çıktısını akıl yürütme sızıntısı açısından incelemeniz gerekir
    - Yinelemeler yaparken Gateway'i izleme modunda çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: izleme modu, ham model akışları ve akıl yürütme sızıntısını izleme'
title: Hata Ayıklama
x-i18n:
    generated_at: "2026-07-12T12:20:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7723dfffdcd74e8e6b7bdec2507f9b008f5e0e8f82295a4e687f3b84f142df9
    source_path: help/debugging.md
    workflow: 16
---

Akış çıktısı, Gateway yinelemesi ve başlangıç profillemesi için hata ayıklama yardımcıları.

## Çalışma zamanı hata ayıklama geçersiz kılmaları

`/debug`, **yalnızca çalışma zamanına özgü** yapılandırma geçersiz kılmaları ayarlar (bellekte, diskte değil). Varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`, tüm geçersiz kılmaları temizler ve diskteki yapılandırmaya geri döner.

## Oturum izleme çıktısı

`/trace`, tam ayrıntılı modu etkinleştirmeden tek bir oturum için Plugin tarafından yönetilen izleme/hata ayıklama satırlarını gösterir. Active Memory hata ayıklama özetleri gibi Plugin tanılamaları için bunu; normal durum/araç çıktısı için `/verbose` kullanın.

```text
/trace
/trace on
/trace off
```

## Plugin yaşam döngüsü izlemesi

Plugin meta verileri, keşif, kayıt defteri, çalışma zamanı yansısı, yapılandırma değişikliği ve yenileme işlemlerinin aşama aşama dökümü için `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` ayarlayın. stderr'e yazar; böylece JSON komut çıktısı ayrıştırılabilir kalır.

```bash
OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1 openclaw plugins install tokenjuice --force
```

```text
[plugins:lifecycle] phase="config read" ms=6.83 status=ok command="install"
[plugins:lifecycle] phase="slot selection" ms=94.31 status=ok command="install" pluginId="tokenjuice"
[plugins:lifecycle] phase="registry refresh" ms=51.56 status=ok command="install" reason="source-changed"
```

CPU profilleyicisine başvurmadan önce bunu kullanın. Kaynak kod deposundan çalışırken `pnpm build` sonrasında derlenmiş çalışma zamanını `node dist/entry.js ...` ile ölçün; `pnpm openclaw ...` ayrıca kaynak çalıştırıcısının ek yükünü de ölçer.

## CLI başlangıç ve komut profillemesi

Depoya kaydedilmiş başlangıç karşılaştırmaları:

```bash
pnpm test:startup:bench:smoke
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --runs 3
pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu
```

Normal kaynak çalıştırıcısı üzerinden tek seferlik profilleme için `OPENCLAW_RUN_NODE_CPU_PROF_DIR` ayarlayın:

```bash
OPENCLAW_RUN_NODE_CPU_PROF_DIR=.artifacts/cli-cpu pnpm openclaw status
```

Kaynak çalıştırıcısı Node CPU profil bayraklarını ekler ve komut için bir `.cpuprofile` dosyası yazar. Komut koduna geçici ölçüm eklemeden önce bunu kullanın.

Eşzamanlı dosya sistemi veya modül yükleyici çalışmasına benzeyen başlangıç takılmalarında, kaynak çalıştırıcısı üzerinden Node'un eşzamanlı G/Ç izleme bayrağını ekleyin:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch`, izlenen Gateway alt süreci için bu bayrağı varsayılan olarak devre dışı bırakır; izleme modunda da eşzamanlı G/Ç izleme çıktısı istediğinizde `OPENCLAW_TRACE_SYNC_IO=1` ayarlayın.

## Gateway izleme modu

```bash
pnpm gateway:watch
```

Bu komut varsayılan olarak `openclaw-gateway-watch-<profile>` adlı bir tmux oturumunu başlatır veya yeniden başlatır (örneğin `openclaw-gateway-watch-main`); `openclaw-gateway-watch-dev-19001` gibi bir bağlantı noktası son eki yalnızca `OPENCLAW_GATEWAY_PORT`, varsayılan `18789` bağlantı noktasından farklı olduğunda eklenir. Etkileşimli terminallerden otomatik olarak bağlanır; etkileşimsiz kabuklar, CI ve ajan yürütme çağrıları bağlı olmadan kalır ve bunun yerine bağlanma talimatlarını yazdırır:

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux bölmesi ham izleyiciyi çalıştırır:

```bash
node scripts/watch-node.mjs gateway --force
```

Aynı bağlantı noktasını izlemeden önce kurulu bir Gateway hizmetini durdurun:

```bash
pnpm openclaw gateway stop
```

İzleyicinin `--force` seçeneği mevcut dinleyiciyi temizler, ancak denetlenen bir hizmeti devre dışı bırakmaz. Aksi takdirde launchd, systemd veya Scheduled Task hizmeti yeniden başlatılıp izlenen Gateway'in yerini alabilir.

tmux olmadan ön plan modu:

```bash
pnpm gateway:watch:raw
# veya
OPENCLAW_GATEWAY_WATCH_TMUX=0 pnpm gateway:watch
```

tmux yönetimini koruyup otomatik bağlanmayı devre dışı bırakın:

```bash
OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch
```

Başlangıç/çalışma zamanı yoğun noktalarında hata ayıklarken izlenen Gateway CPU süresini profilleyin:

```bash
pnpm gateway:watch --benchmark
```

İzleme sarmalayıcısı, Gateway'i çağırmadan önce `--benchmark` seçeneğini işler ve her Gateway alt süreci çıkışında `.artifacts/gateway-watch-profiles/` altında bir V8 `.cpuprofile` dosyası yazar. Geçerli profili diske yazmak için izlenen Gateway'i durdurun veya yeniden başlatın, ardından profili Chrome DevTools ya da Speedscope ile açın:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

- `--benchmark-dir <path>`: profilleri başka bir yere yazın.
- `--benchmark-no-force`: varsayılan `--force` bağlantı noktası temizliğini atlayın ve Gateway bağlantı noktası zaten kullanımdaysa hemen başarısız olun.

Karşılaştırma modu, eşzamanlı G/Ç izleme kalabalığını varsayılan olarak bastırır. Hem CPU profillerini hem de eşzamanlı G/Ç yığın izlerini almak için `--benchmark` ile birlikte `OPENCLAW_TRACE_SYNC_IO=1` ayarlayın; karşılaştırma modunda bu izleme blokları karşılaştırma dizini altındaki `gateway-watch-output.log` dosyasına gider (terminal bölmesinden filtrelenir), normal Gateway günlükleri ise görünür kalır.

tmux sarmalayıcısı `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` ve `OPENCLAW_SKIP_CHANNELS` dahil olmak üzere yaygın ve gizli olmayan çalışma zamanı seçicilerini bölmeye aktarır. Sağlayıcı kimlik bilgilerini normal profilinize/yapılandırmanıza koyun veya tek seferlik geçici gizli bilgiler için ham ön plan modunu kullanın.

İzlenen Gateway başlangıç sırasında çıkarsa izleyici bir kez `openclaw doctor --fix --non-interactive` çalıştırır ve Gateway alt sürecini yeniden başlatır. Özgün başlangıç hatasını yalnızca geliştirmeye özgü onarım geçişi olmadan görmek için `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` ayarlayın.

Yönetilen tmux bölmesi varsayılan olarak renkli Gateway günlükleri kullanır; ANSI çıktısını devre dışı bırakmak için `pnpm gateway:watch` komutunu başlatırken `FORCE_COLOR=0` ayarlayın.

İzleyici; `src/` altındaki derlemeyle ilgili dosyalarda, uzantı kaynak dosyalarında, uzantı `package.json` ve `openclaw.plugin.json` meta verilerinde, `tsconfig.json`, `package.json` ve `tsdown.config.ts` dosyalarında değişiklik olduğunda yeniden başlatılır. Uzantı meta verisi değişiklikleri, yeniden derlemeyi zorlamadan Gateway'i yeniden başlatır; kaynak ve yapılandırma değişiklikleri ise önce `dist` dizinini yeniden derlemeye devam eder.

Gateway CLI bayraklarını `gateway:watch` sonrasına eklediğinizde her yeniden başlatmada aktarılırlar. Aynı izleme komutunu yeniden çalıştırmak adlandırılmış tmux bölmesini yeniden oluşturur; ham izleyici tek izleyici kilidi kullandığından yinelenen izleyici üst süreçleri birikmek yerine değiştirilir.

## Geliştirme profili + geliştirme Gateway'i (--dev)

İki **ayrı** `--dev` bayrağı:

- **Genel `--dev` (profil):** durumu `~/.openclaw-dev` altında yalıtır ve Gateway bağlantı noktasını varsayılan olarak `19001` yapar (türetilmiş bağlantı noktaları da buna göre kayar).
- **`gateway --dev`:** Gateway'e, eksik olduğunda varsayılan bir yapılandırma ve çalışma alanı otomatik olarak oluşturmasını (ve önyüklemeyi atlamasını) söyler.

Önerilen akış (geliştirme profili + geliştirme önyüklemesi):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Genel kurulum yoksa CLI'yi `pnpm openclaw ...` üzerinden çalıştırın.

Bunun yaptıkları:

1. **Profil yalıtımı** (genel `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (tarayıcı/canvas bağlantı noktaları buna göre kayar)

2. **Geliştirme önyüklemesi** (`gateway --dev`)
   - Eksikse asgari bir yapılandırma yazar (`gateway.mode=local`, local loopback'e bağlanır).
   - `agents.defaults.workspace` değerini geliştirme çalışma alanına, `agents.defaults.skipBootstrap=true` olarak ayarlar.
   - Eksikse çalışma alanı dosyalarını oluşturur: `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`.
   - Varsayılan kimlik: **C3-PO** (protokol droidi).
   - `pnpm gateway:dev`, kanal sağlayıcılarını atlamak için ayrıca `OPENCLAW_SKIP_CHANNELS=1` ayarlar.

Sıfırlama akışı (temiz başlangıç):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev`, **genel** bir profil bayrağıdır ve bazı çalıştırıcılar tarafından işlenip kaldırılır. Açıkça belirtmeniz gerekiyorsa ortam değişkeni biçimini kullanın:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset`, yapılandırmayı, kimlik bilgilerini, oturumları ve geliştirme çalışma alanını temizler (silmez, çöp kutusuna taşır), ardından varsayılan geliştirme kurulumunu yeniden oluşturur.

<Tip>
Geliştirme dışı bir Gateway zaten çalışıyorsa (launchd veya systemd), önce onu durdurun:

```bash
openclaw gateway stop
```

</Tip>

## Ham akış günlükleme

OpenClaw, herhangi bir filtreleme/biçimlendirme öncesinde **ham asistan akışını** günlüğe kaydedebilir. Bu, muhakemenin düz metin farkları olarak mı (yoksa ayrı düşünme blokları olarak mı) geldiğini görmenin en iyi yoludur.

CLI üzerinden etkinleştirin:

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

Varsayılan dosya: `~/.openclaw/logs/raw-stream.jsonl`

## Güvenlik notları

- Ham akış günlükleri tüm istemleri, araç çıktılarını ve kullanıcı verilerini içerebilir.
- Günlükleri yerel tutun ve hata ayıklama sonrasında silin.
- Günlükleri paylaşırsanız önce gizli bilgileri ve kişisel olarak tanımlanabilir bilgileri temizleyin.

## VSCode'da hata ayıklama

Derleme, oluşturulan dosya adlarını karmaladığı için kaynak haritaları gereklidir. Dahil edilen `launch.json`, Gateway hizmetini hedefler:

1. **Rebuild and Debug Gateway** - Gateway'i başlatmadan önce `/dist` dizinini siler ve hata ayıklama etkin olarak yeniden derler.
2. **Debug Gateway** - `/dist` dizinine dokunmadan mevcut bir derlemede hata ayıklar.

### Kurulum

1. **Run and Debug** bölümünü açın (Activity Bar veya `Ctrl`+`Shift`+`D`).
2. **Rebuild and Debug Gateway** seçeneğini belirleyip **Start Debugging** düğmesine basın.

Bunun yerine derleme/hata ayıklama döngüsünü elle yönetmek için:

1. Bir terminalde kaynak haritalarını etkinleştirin:
   - **Linux/macOS**: `export OUTPUT_SOURCE_MAPS=1`
   - **Windows (PowerShell)**: `$env:OUTPUT_SOURCE_MAPS="1"`
   - **Windows (CMD)**: `set OUTPUT_SOURCE_MAPS=1`
2. Yeniden derleyin: `pnpm clean:dist && pnpm build`
3. **Debug Gateway** seçeneğini belirleyip **Start Debugging** düğmesine basın.

`src/` altındaki TypeScript dosyalarına kesme noktaları koyun; hata ayıklayıcı bunları kaynak haritaları aracılığıyla derlenmiş JavaScript'e eşler.

### Notlar

- **Rebuild and Debug Gateway**, `/dist` dizinini siler ve her başlatmada kaynak haritalarıyla tam bir `pnpm build` çalıştırır.
- **Debug Gateway**, `/dist` dizinini etkilemeden başlatılıp durdurulabilir; ancak derleme döngüsünü ayrı bir terminalde yönetirsiniz.
- Diğer CLI alt komutlarında hata ayıklamak için `launch.json` içindeki `args` değerini düzenleyin.
- Derlenmiş CLI'yi başka görevler için kullanmak üzere (örneğin hata ayıklama oturumunuz yeni bir kimlik doğrulama belirteci oluşturuyorsa `dashboard --no-open`), başka bir terminalden çalıştırın: `node ./openclaw.mjs` veya `alias openclaw-build="node $(pwd)/openclaw.mjs"` gibi bir takma ad.

## İlgili

- [Sorun giderme](/tr/help/troubleshooting)
- [SSS](/tr/help/faq)
