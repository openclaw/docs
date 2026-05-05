---
read_when:
    - Akıl yürütme sızıntısı olup olmadığını görmek için ham model çıktısını incelemeniz gerekir
    - Yineleme yaparken Gateway'i izleme modunda çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: izleme modu, ham model akışları ve akıl yürütme sızıntısını izleme'
title: Hata Ayıklama
x-i18n:
    generated_at: "2026-05-05T01:47:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d86bd9b5dd08615d3c283f3fcb2a885f5134fa7e1cdece86b6a796d08a659ec
    source_path: help/debugging.md
    workflow: 16
---

Özellikle bir sağlayıcı akıl yürütmeyi normal metne karıştırdığında, akış çıktısı için hata ayıklama yardımcıları.

## Çalışma zamanı hata ayıklama geçersiz kılmaları

**Yalnızca çalışma zamanı** config geçersiz kılmalarını ayarlamak için sohbette `/debug` kullanın (bellek, disk değil).
`/debug` varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.
Bu, `openclaw.json` dosyasını düzenlemeden belirsiz ayarları değiştirmeniz gerektiğinde kullanışlıdır.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset` tüm geçersiz kılmaları temizler ve disk üzerindeki config’e döner.

## Oturum iz çıktısı

Tam ayrıntılı modu açmadan tek bir oturumda Plugin’e ait iz/hata ayıklama
satırlarını görmek istediğinizde `/trace` kullanın.

Örnekler:

```text
/trace
/trace on
/trace off
```

Active Memory hata ayıklama özetleri gibi Plugin tanılamaları için `/trace` kullanın.
Normal ayrıntılı durum/araç çıktısı için `/verbose` kullanmaya devam edin ve
yalnızca çalışma zamanı config geçersiz kılmaları için `/debug` kullanmaya devam edin.

## Plugin yaşam döngüsü izi

Plugin yaşam döngüsü komutları yavaş hissettirdiğinde ve Plugin metadata,
keşif, kayıt defteri, runtime yansısı, config mutasyonu ve yenileme işi için
yerleşik bir aşama dökümüne ihtiyacınız olduğunda `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`
kullanın. İz isteğe bağlıdır ve stderr’e yazar; böylece JSON komut çıktısı
ayrıştırılabilir kalır.

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

Bir CPU profiler’a başvurmadan önce bunu Plugin yaşam döngüsü araştırması için kullanın.
Komut bir kaynak checkout’tan çalışıyorsa, `pnpm build` sonrasında oluşturulmuş
runtime’ı `node dist/entry.js ...` ile ölçmeyi tercih edin; `pnpm openclaw ...`
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

Kaynak çalıştırıcı Node CPU profil bayraklarını ekler ve komut için bir
`.cpuprofile` yazar. Komut koduna geçici enstrümantasyon eklemeden önce bunu kullanın.

Senkron dosya sistemi veya modül yükleyici işi gibi görünen başlatma takılmaları için,
kaynak çalıştırıcı üzerinden Node’un senkron I/O iz bayrağını ekleyin:

```bash
OPENCLAW_TRACE_SYNC_IO=1 pnpm openclaw gateway --force
```

`pnpm gateway:watch`, izlenen Gateway alt süreci için bu bayrağı varsayılan olarak etkinleştirir.
İzleme modunda Node senkron I/O iz çıktısını bastırmak için `OPENCLAW_TRACE_SYNC_IO=0`
ayarlayın.

## Gateway izleme modu

Hızlı yineleme için gateway’i dosya izleyici altında çalıştırın:

```bash
pnpm gateway:watch
```

Varsayılan olarak bu, `openclaw-gateway-watch-main` adlı bir tmux oturumu
(veya `openclaw-gateway-watch-dev-19001` gibi profile/porta özgü bir varyant)
başlatır ya da yeniden başlatır ve etkileşimli terminallerden otomatik bağlanır.
Etkileşimli olmayan shell’ler, CI ve ajan exec çağrıları ayrı kalır ve bunun
yerine bağlanma yönergelerini yazdırır. Gerektiğinde elle bağlanın:

```bash
tmux attach -t openclaw-gateway-watch-main
```

tmux paneli ham izleyiciyi çalıştırır:

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

Başlatma/runtime darboğazlarında hata ayıklarken izlenen Gateway CPU süresini profilleyin:

```bash
pnpm gateway:watch --benchmark
```

İzleme sarmalayıcısı Gateway’i çağırmadan önce `--benchmark` seçeneğini tüketir ve
Gateway alt sürecinin her çıkışı için `.artifacts/gateway-watch-profiles/` altında
bir V8 `.cpuprofile` yazar. Geçerli profili boşaltmak için izlenen gateway’i
durdurun veya yeniden başlatın, ardından Chrome DevTools ya da Speedscope ile açın:

```bash
npx speedscope .artifacts/gateway-watch-profiles/*.cpuprofile
```

Profilleri başka bir yerde istediğinizde `--benchmark-dir <path>` kullanın.
Benchmark uygulanan alt sürecin varsayılan `--force` port temizliğini atlamasını
ve Gateway portu zaten kullanımdaysa hızlıca hata vermesini istediğinizde
`--benchmark-no-force` kullanın.
Benchmark modu varsayılan olarak sync-I/O iz gürültüsünü bastırır.
Açıkça hem CPU profillerini hem de Node sync-I/O stack trace’lerini istediğinizde
`--benchmark` ile `OPENCLAW_TRACE_SYNC_IO=1` ayarlayın. Benchmark modunda bu iz
blokları benchmark dizini altında `gateway-watch-output.log` dosyasına yazılır
ve terminal panelinden filtrelenir; normal Gateway logları görünür kalır.

tmux sarmalayıcısı `OPENCLAW_PROFILE`, `OPENCLAW_CONFIG_PATH`,
`OPENCLAW_STATE_DIR`, `OPENCLAW_GATEWAY_PORT` ve `OPENCLAW_SKIP_CHANNELS` gibi
yaygın gizli olmayan runtime seçicilerini panele taşır. Sağlayıcı kimlik
bilgilerini normal profil/config’inize koyun ya da tek seferlik geçici secrets
için ham ön plan modunu kullanın.
İzlenen Gateway başlatma sırasında çıkarsa, izleyici bir kez
`openclaw doctor --fix --non-interactive` çalıştırır ve Gateway alt sürecini
yeniden başlatır. Dev’e özel onarım geçişi olmadan özgün başlatma hatasını
istediğinizde `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` kullanın.
Yönetilen tmux paneli okunabilirlik için varsayılan olarak renkli Gateway logları
kullanır; ANSI çıktısını devre dışı bırakmak için `pnpm gateway:watch`
başlatırken `FORCE_COLOR=0` ayarlayın.

İzleyici, `src/` altındaki derleme açısından ilgili dosyalarda, extension kaynak
dosyalarında, extension `package.json` ve `openclaw.plugin.json` metadata’sında,
`tsconfig.json`, `package.json` ve `tsdown.config.ts` üzerinde yeniden başlatır.
Extension metadata değişiklikleri gateway’i `tsdown` rebuild zorlamadan yeniden
başlatır; kaynak ve config değişiklikleri önce yine `dist` rebuild yapar.

Gateway CLI bayraklarını `gateway:watch` sonrasına ekleyin; her yeniden
başlatmada iletilirler. Aynı izleme komutunu yeniden çalıştırmak adlandırılmış
tmux panelini yeniden oluşturur ve ham izleyici yine tek izleyici kilidini korur;
bu nedenle yinelenen izleyici üst süreçleri birikmek yerine değiştirilir.

## Dev profili + dev Gateway (--dev)

Durumu izole etmek ve hata ayıklama için güvenli, atılabilir bir kurulum başlatmak
üzere dev profilini kullanın. **İki** `--dev` bayrağı vardır:

- **Global `--dev` (profil):** durumu `~/.openclaw-dev` altında izole eder ve
  gateway portunu varsayılan olarak `19001` yapar (türetilmiş portlar onunla birlikte kayar).
- **`gateway --dev`: Gateway’e eksik olduğunda varsayılan config +
  workspace’i otomatik oluşturmasını söyler** (ve BOOTSTRAP.md dosyasını atlar).

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
   - `OPENCLAW_GATEWAY_PORT=19001` (tarayıcı/canvas buna göre kayar)

2. **Dev bootstrap** (`gateway --dev`)
   - Eksikse minimal bir config yazar (`gateway.mode=local`, bind loopback).
   - `agent.workspace` değerini dev workspace’e ayarlar.
   - `agent.skipBootstrap=true` ayarlar (BOOTSTRAP.md yok).
   - Eksikse workspace dosyalarını tohumlar:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Varsayılan kimlik: **C3‑PO** (protokol droidi).
   - Dev modunda kanal sağlayıcılarını atlar (`OPENCLAW_SKIP_CHANNELS=1`).

Sıfırlama akışı (taze başlangıç):

```bash
pnpm gateway:dev:reset
```

<Note>
`--dev` **global** bir profil bayrağıdır ve bazı çalıştırıcılar tarafından tüketilir. Açıkça yazmanız gerekiyorsa env var biçimini kullanın:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

</Note>

`--reset` config’i, kimlik bilgilerini, oturumları ve dev workspace’i siler
(`rm` değil, `trash` kullanarak), ardından varsayılan dev kurulumunu yeniden oluşturur.

<Tip>
Dev olmayan bir gateway zaten çalışıyorsa (launchd veya systemd), önce durdurun:

```bash
openclaw gateway stop
```

</Tip>

## Ham stream günlükleme (OpenClaw)

OpenClaw, herhangi bir filtreleme/biçimlendirme öncesinde **ham asistan stream’ini**
günlüğe yazabilir. Akıl yürütmenin düz metin delta’ları olarak mı (yoksa ayrı
thinking blokları olarak mı) geldiğini görmenin en iyi yolu budur.

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

## Ham chunk günlükleme (pi-mono)

**Ham OpenAI uyumlu chunk’ları** bloklara ayrıştırılmadan önce yakalamak için
pi-mono ayrı bir logger sunar:

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

- Ham stream günlükleri tam prompt’ları, araç çıktısını ve kullanıcı verilerini içerebilir.
- Günlükleri yerel tutun ve hata ayıklamadan sonra silin.
- Günlükleri paylaşırsanız önce secrets ve PII verilerini temizleyin.

## İlgili

- [Sorun giderme](/tr/help/troubleshooting)
- [SSS](/tr/help/faq)
