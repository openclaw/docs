---
read_when:
    - Akıl yürütme sızıntısı olup olmadığını görmek için ham model çıktısını incelemeniz gerekir
    - Yineleme yaparken Gateway'i izleme modunda çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: izleme modu, ham model akışları ve akıl yürütme sızıntısını izleme'
title: Hata ayıklama
x-i18n:
    generated_at: "2026-05-03T21:34:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7230112013a8db8d6a3853b765f4302a61609051ac4ffaf35a6f09de328deafc
    source_path: help/debugging.md
    workflow: 16
---

Akış çıktısı için hata ayıklama yardımcıları, özellikle bir sağlayıcı akıl yürütmeyi normal metne karıştırdığında.

## Çalışma zamanı hata ayıklama geçersiz kılmaları

**Yalnızca çalışma zamanı** yapılandırma geçersiz kılmalarını (disk değil, bellek) ayarlamak için sohbette `/debug` kullanın.
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

Tam ayrıntılı modu açmadan tek bir oturumda Plugin'e ait izleme/hata ayıklama
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

Plugin yaşam döngüsü komutları yavaş hissettirdiğinde ve Plugin meta verileri,
keşif, kayıt defteri, çalışma zamanı aynası, yapılandırma mutasyonu ve yenileme
işi için yerleşik bir aşama dökümüne ihtiyacınız olduğunda `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` kullanın. İzleme isteğe bağlıdır ve stderr'e yazar,
bu nedenle JSON komut çıktısı ayrıştırılabilir kalır.

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

Bunu, CPU profiler kullanmadan önce Plugin yaşam döngüsü araştırması için kullanın.
Komut bir kaynak checkout'undan çalışıyorsa, `pnpm build` sonrasında yerleşik
çalışma zamanını `node dist/entry.js ...` ile ölçmeyi tercih edin; `pnpm openclaw ...`
kaynak çalıştırıcı ek yükünü de ölçer.

## CLI başlatma ve komut profilleme

Bir komut yavaş hissettirdiğinde depoya dahil edilmiş başlatma benchmark'ını kullanın:

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

Kaynak çalıştırıcı Node CPU profil bayrakları ekler ve komut için bir
`.cpuprofile` yazar. Komut koduna geçici enstrümantasyon eklemeden önce bunu kullanın.

## Gateway izleme modu

Hızlı yineleme için Gateway'i dosya izleyici altında çalıştırın:

```bash
pnpm gateway:watch
```

Varsayılan olarak bu, `openclaw-gateway-watch-main` adlı bir tmux oturumu
(veya `openclaw-gateway-watch-dev-19001` gibi profile/porta özel bir varyant)
başlatır ya da yeniden başlatır ve etkileşimli terminallerden otomatik olarak
bağlanır. Etkileşimsiz kabuklar, CI ve ajan exec çağrıları ayrık kalır ve bunun
yerine bağlanma talimatlarını yazdırır. Gerektiğinde elle bağlanın:

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

Başlatma/çalışma zamanı darboğazlarında hata ayıklarken izlenen Gateway CPU süresini profilleyin:

```bash
pnpm gateway:watch --benchmark
```

İzleme sarmalayıcısı Gateway'i çağırmadan önce `--benchmark` değerini tüketir
ve `.artifacts/gateway-watch-profiles/` altında her Gateway alt süreç çıkışı
için bir V8 `.cpuprofile` yazar. Mevcut profili boşaltmak için izlenen Gateway'i
durdurun veya yeniden başlatın, ardından Chrome DevTools ya da Speedscope ile açın:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Profilleri başka bir yerde istediğinizde `--benchmark-dir <path>` kullanın.
Benchmark alt sürecinin varsayılan `--force` port temizliğini atlamasını ve
Gateway portu zaten kullanımdaysa hızlıca başarısız olmasını istediğinizde
`--benchmark-no-force` kullanın.

tmux sarmalayıcısı `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`,
`OPENCLAW_GATEWAY_PORT` ve `OPENCLAW_SKIP_CHANNELS` gibi yaygın, gizli olmayan
çalışma zamanı seçicilerini bölmeye taşır. Sağlayıcı kimlik bilgilerini normal
profilinize/yapılandırmanıza koyun veya tek seferlik geçici sırlar için ham ön
plan modunu kullanın.
İzlenen Gateway başlatma sırasında çıkarsa, izleyici bir kez
`openclaw doctor --fix --non-interactive` çalıştırır ve Gateway alt sürecini
yeniden başlatır. Geliştirmeye özel onarım geçişi olmadan özgün başlatma
hatasını istediğinizde `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` kullanın.
Yönetilen tmux bölmesi ayrıca okunabilirlik için varsayılan olarak renkli
Gateway günlüklerini kullanır; ANSI çıktısını devre dışı bırakmak için
`pnpm gateway:watch` başlatırken `FORCE_COLOR=0` ayarlayın.

İzleyici `src/` altındaki derlemeyle ilgili dosyalarda, uzantı kaynak
dosyalarında, uzantı `package.json` ve `openclaw.plugin.json` meta verilerinde,
`tsconfig.json`, `package.json` ve `tsdown.config.ts` dosyalarında yeniden başlar. Uzantı
meta verisi değişiklikleri, `tsdown` yeniden derlemesini zorlamadan Gateway'i
yeniden başlatır; kaynak ve yapılandırma değişiklikleri ise önce `dist` derler.

`gateway:watch` sonrasına herhangi bir Gateway CLI bayrağı ekleyin; her yeniden
başlatmada aktarılırlar. Aynı izleme komutunu yeniden çalıştırmak adlandırılmış
tmux bölmesini yeniden oluşturur ve ham izleyici tek izleyici kilidini korumaya
devam eder; böylece yinelenen izleyici ebeveynleri birikmek yerine değiştirilir.

## Geliştirme profili + geliştirme Gateway'i (--dev)

Durumu yalıtmak ve hata ayıklama için güvenli, atılabilir bir kurulum başlatmak
üzere geliştirme profilini kullanın. **İki** `--dev` bayrağı vardır:

- **Global `--dev` (profil):** durumu `~/.openclaw-dev` altında yalıtır ve
  Gateway portunu varsayılan olarak `19001` yapar (türetilmiş portlar da onunla kayar).
- **`gateway --dev`: eksik olduğunda Gateway'e varsayılan bir yapılandırma +
  çalışma alanını otomatik oluşturmasını söyler** (ve BOOTSTRAP.md dosyasını atlar).

Önerilen akış (geliştirme profili + geliştirme bootstrap'i):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Henüz global kurulumunuz yoksa, CLI'yi `pnpm openclaw ...` üzerinden çalıştırın.

Bunun yaptıkları:

1. **Profil yalıtımı** (global `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (tarayıcı/canvas buna göre kayar)

2. **Geliştirme bootstrap'i** (`gateway --dev`)
   - Eksikse minimal bir yapılandırma yazar (`gateway.mode=local`, bind loopback).
   - `agent.workspace` değerini geliştirme çalışma alanına ayarlar.
   - `agent.skipBootstrap=true` ayarlar (BOOTSTRAP.md yok).
   - Eksikse çalışma alanı dosyalarını tohumlar:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Varsayılan kimlik: **C3‑PO** (protokol droid'i).
   - Geliştirme modunda kanal sağlayıcılarını atlar (`OPENCLAW_SKIP_CHANNELS=1`).

Sıfırlama akışı (temiz başlangıç):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` **global** bir profil bayrağıdır ve bazı çalıştırıcılar tarafından tüketilir. Açıkça yazmanız gerekirse env var biçimini kullanın:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` yapılandırmayı, kimlik bilgilerini, oturumları ve geliştirme çalışma
alanını siler (`rm` değil `trash` kullanarak), ardından varsayılan geliştirme
kurulumunu yeniden oluşturur.

<Tip>
Geliştirme dışı bir Gateway zaten çalışıyorsa (launchd veya systemd), önce durdurun:

```bash
openclaw gateway stop
```

</Tip>

## Ham akış günlüğü (OpenClaw)

OpenClaw, herhangi bir filtreleme/biçimlendirmeden önce **ham asistan akışını**
günlüğe yazabilir. Bu, akıl yürütmenin düz metin deltaları olarak mı
(yoksa ayrı düşünme blokları olarak mı) geldiğini görmenin en iyi yoludur.

CLI üzerinden etkinleştirin:

```bash
pnpm gateway:watch --raw-stream
```

İsteğe bağlı yol geçersiz kılma:

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

## Ham parça günlüğü (pi-mono)

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

> Not: bu yalnızca pi-mono'nun `openai-completions` sağlayıcısını kullanan
> süreçler tarafından yayınlanır.

## Güvenlik notları

- Ham akış günlükleri tam istemleri, araç çıktısını ve kullanıcı verilerini içerebilir.
- Günlükleri yerel tutun ve hata ayıklamadan sonra silin.
- Günlükleri paylaşırsanız, önce sırları ve PII verilerini temizleyin.

## İlgili

- [Sorun giderme](/tr/help/troubleshooting)
- [SSS](/tr/help/faq)
