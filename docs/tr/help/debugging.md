---
read_when:
    - Akıl yürütme sızıntısını incelemek için ham model çıktısını denetlemeniz gerekiyor
    - Yineleme yaparken Gateway’i izleme modunda çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: izleme modu, ham model akışları ve akıl yürütme sızıntısının izlenmesi'
title: Hata Ayıklama
x-i18n:
    generated_at: "2026-04-12T23:28:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc31ce9b41e92a14c4309f32df569b7050b18024f83280930e53714d3bfcd5cc
    source_path: help/debugging.md
    workflow: 15
---

# Hata Ayıklama

Bu sayfa, özellikle bir sağlayıcı akıl yürütmeyi normal metne karıştırdığında, akış çıktısı için hata ayıklama yardımcılarını kapsar.

## Çalışma zamanı hata ayıklama geçersiz kılmaları

Diskte değil, yalnızca **çalışma zamanı** yapılandırma geçersiz kılmalarını (bellek) ayarlamak için sohbette `/debug` kullanın.
`/debug` varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.
Bu, `openclaw.json` dosyasını düzenlemeden nadir kullanılan ayarları değiştirmeniz gerektiğinde kullanışlıdır.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`, tüm geçersiz kılmaları temizler ve diskteki yapılandırmaya geri döner.

## Oturum iz çıktısı

Tam ayrıntılı modu açmadan tek bir oturumda Plugin sahipliğindeki iz/hata ayıklama satırlarını görmek istediğinizde `/trace` kullanın.

Örnekler:

```text
/trace
/trace on
/trace off
```

Active Memory hata ayıklama özetleri gibi Plugin tanılamaları için `/trace` kullanın.
Normal ayrıntılı durum/araç çıktısı için `/verbose` kullanmaya devam edin ve yalnızca çalışma zamanı yapılandırma geçersiz kılmaları için `/debug` kullanmaya devam edin.

## Gateway izleme modu

Hızlı yineleme için gateway’i dosya izleyici altında çalıştırın:

```bash
pnpm gateway:watch
```

Bu şu komuta karşılık gelir:

```bash
node scripts/watch-node.mjs gateway --force
```

İzleyici; `src/` altındaki derleme açısından ilgili dosyalarda, eklenti kaynak dosyalarında,
eklenti `package.json` ve `openclaw.plugin.json` meta verilerinde, `tsconfig.json`,
`package.json` ve `tsdown.config.ts` dosyalarında yeniden başlatır. Eklenti meta veri değişiklikleri
`tsdown` yeniden derlemesini zorlamadan gateway’i yeniden başlatır; kaynak ve yapılandırma değişiklikleri ise önce yine de
`dist` dizinini yeniden derler.

`gateway:watch` sonrasına herhangi bir gateway CLI bayrağı ekleyin; bunlar her
yeniden başlatmada aktarılır. Aynı depo/bayrak kümesi için aynı izleme komutunu yeniden çalıştırmak artık
arkada yinelenen izleyici üst süreçleri bırakmak yerine eski izleyiciyi değiştirir.

## Geliştirme profili + geliştirme gateway’i (`--dev`)

Durumu yalıtmak ve hata ayıklama için güvenli, geçici bir kurulum başlatmak üzere geliştirme profilini kullanın. **İki** adet `--dev` bayrağı vardır:

- **Genel `--dev` (profil):** durumu `~/.openclaw-dev` altında yalıtır ve
  gateway bağlantı noktasını varsayılan olarak `19001` yapar (türetilen bağlantı noktaları da buna göre kayar).
- **`gateway --dev`:** Gateway’e, eksik olduğunda varsayılan bir yapılandırma +
  çalışma alanını otomatik oluşturmasını söyler (ve `BOOTSTRAP.md` dosyasını atlar).

Önerilen akış (geliştirme profili + geliştirme önyüklemesi):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Henüz genel bir kurulumunuz yoksa CLI’ı `pnpm openclaw ...` ile çalıştırın.

Bunun yaptığı şeyler:

1. **Profil yalıtımı** (genel `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (tarayıcı/canvas buna göre kayar)

2. **Geliştirme önyüklemesi** (`gateway --dev`)
   - Eksikse minimal bir yapılandırma yazar (`gateway.mode=local`, bind loopback).
   - `agent.workspace` değerini geliştirme çalışma alanına ayarlar.
   - `agent.skipBootstrap=true` ayarlar (`BOOTSTRAP.md` yok).
   - Eksikse şu çalışma alanı dosyalarını oluşturur:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Varsayılan kimlik: **C3‑PO** (protokol droidi).
   - Geliştirme modunda kanal sağlayıcılarını atlar (`OPENCLAW_SKIP_CHANNELS=1`).

Sıfırlama akışı (temiz başlangıç):

```bash
pnpm gateway:dev:reset
```

Not: `--dev`, **genel** bir profil bayrağıdır ve bazı çalıştırıcılar tarafından tüketilir.
Açıkça belirtmeniz gerekirse ortam değişkeni biçimini kullanın:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset`; yapılandırmayı, kimlik bilgilerini, oturumları ve geliştirme çalışma alanını (`rm` değil,
`trash` kullanarak) siler, ardından varsayılan geliştirme kurulumunu yeniden oluşturur.

İpucu: Geliştirme dışı bir gateway zaten çalışıyorsa (`launchd/systemd`), önce onu durdurun:

```bash
openclaw gateway stop
```

## Ham akış günlüğü (OpenClaw)

OpenClaw, herhangi bir filtreleme/biçimlendirme uygulanmadan önce **ham asistan akışını** günlüğe kaydedebilir.
Akıl yürütmenin düz metin delta’ları olarak mı
(yoksa ayrı düşünme blokları olarak mı) geldiğini görmek için en iyi yol budur.

Bunu CLI üzerinden etkinleştirin:

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

## Ham parça günlüğü (pi-mono)

Bloklara ayrıştırılmadan önce **ham OpenAI-uyumlu parçaları** yakalamak için,
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
> `openai-completions` sağlayıcısını kullanan süreçler tarafından üretilir.

## Güvenlik notları

- Ham akış günlükleri tam istemleri, araç çıktısını ve kullanıcı verilerini içerebilir.
- Günlükleri yerelde tutun ve hata ayıklamadan sonra silin.
- Günlükleri paylaşırsanız önce gizli bilgileri ve PII’yi temizleyin.
