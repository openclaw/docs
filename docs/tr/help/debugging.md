---
read_when:
    - Reasoning sızıntısı için ham model çıktısını incelemeniz gerekiyor
    - Yineleme yaparken Gateway'i watch mode'da çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: watch mode, ham model akışları ve reasoning sızıntısını izleme'
title: Hata Ayıklama
x-i18n:
    generated_at: "2026-04-05T13:55:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: f90d944ecc2e846ca0b26a162126ceefb3a3c6cf065c99b731359ec79d4289e3
    source_path: help/debugging.md
    workflow: 15
---

# Hata Ayıklama

Bu sayfa, özellikle bir sağlayıcı reasoning'i normal metinle karıştırdığında, streaming çıktı için hata ayıklama yardımcılarını kapsar.

## Çalışma zamanı hata ayıklama geçersiz kılmaları

Yalnızca çalışma zamanına ait yapılandırma geçersiz kılmalarını ayarlamak için sohbette `/debug` kullanın (diskte değil, bellekte).
`/debug` varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.
Bu, `openclaw.json` dosyasını düzenlemeden belirsiz ayarları açıp kapatmanız gerektiğinde yararlıdır.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`, tüm geçersiz kılmaları temizler ve diskteki yapılandırmaya geri döner.

## Gateway watch mode

Hızlı yineleme için gateway'i dosya izleyici altında çalıştırın:

```bash
pnpm gateway:watch
```

Bu şu anlama gelir:

```bash
node scripts/watch-node.mjs gateway --force
```

İzleyici; `src/` altındaki derleme açısından ilgili dosyalarda, eklenti kaynak dosyalarında,
eklenti `package.json` ve `openclaw.plugin.json` meta verilerinde, `tsconfig.json`,
`package.json` ve `tsdown.config.ts` dosyalarında yeniden başlatır. Eklenti meta veri değişiklikleri,
zorunlu `tsdown` yeniden derlemesi yapmadan gateway'i yeniden başlatır; kaynak ve yapılandırma değişiklikleri ise önce `dist` yeniden derlenir.

`gateway:watch` sonrasına herhangi bir gateway CLI bayrağı ekleyin; bunlar her yeniden başlatmada iletilir.

## Geliştirme profili + geliştirme gateway'i (`--dev`)

Durumu yalıtmak ve hata ayıklama için güvenli, geçici bir kurulum başlatmak üzere geliştirme profilini kullanın. **İki** `--dev` bayrağı vardır:

- **Genel `--dev` (profil):** durumu `~/.openclaw-dev` altında yalıtır ve
  gateway portunu varsayılan olarak `19001` yapar (ondan türetilen portlar da buna göre kayar).
- **`gateway --dev`:** eksikse Gateway'e varsayılan bir config +
  workspace otomatik oluşturmasını söyler (ve `BOOTSTRAP.md` dosyasını atlar).

Önerilen akış (geliştirme profili + geliştirme bootstrap):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Henüz genel kurulumunuz yoksa CLI'yi `pnpm openclaw ...` ile çalıştırın.

Bunun yaptığı şeyler:

1. **Profil yalıtımı** (genel `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas buna göre kayar)

2. **Geliştirme bootstrap'i** (`gateway --dev`)
   - Eksikse minimal bir yapılandırma yazar (`gateway.mode=local`, bind loopback).
   - `agent.workspace` değerini geliştirme workspace'ine ayarlar.
   - `agent.skipBootstrap=true` ayarlar (`BOOTSTRAP.md` yok).
   - Workspace dosyaları eksikse bunları oluşturur:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Varsayılan kimlik: **C3‑PO** (protocol droid).
   - Geliştirme modunda kanal sağlayıcılarını atlar (`OPENCLAW_SKIP_CHANNELS=1`).

Sıfırlama akışı (temiz başlangıç):

```bash
pnpm gateway:dev:reset
```

Not: `--dev`, **genel** bir profil bayrağıdır ve bazı runner'lar tarafından tüketilir.
Bunu açıkça belirtmeniz gerekirse env değişkeni biçimini kullanın:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset`; config, kimlik bilgileri, oturumlar ve geliştirme workspace'ini
(`rm` değil, `trash` kullanarak) siler, sonra varsayılan geliştirme kurulumunu yeniden oluşturur.

İpucu: geliştirme dışı bir gateway zaten çalışıyorsa (launchd/systemd), önce onu durdurun:

```bash
openclaw gateway stop
```

## Ham akış günlüğe kaydı (OpenClaw)

OpenClaw, herhangi bir filtreleme/biçimlendirme uygulanmadan önce **ham asistan akışını** günlüğe kaydedebilir.
Bu, reasoning'in düz metin deltaları olarak mı
(yoksa ayrı thinking blokları olarak mı) geldiğini görmek için en iyi yoldur.

CLI ile etkinleştirin:

```bash
pnpm gateway:watch --raw-stream
```

İsteğe bağlı yol geçersiz kılması:

```bash
pnpm gateway:watch --raw-stream --raw-stream-path ~/.openclaw/logs/raw-stream.jsonl
```

Eşdeğer env değişkenleri:

```bash
OPENCLAW_RAW_STREAM=1
OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl
```

Varsayılan dosya:

`~/.openclaw/logs/raw-stream.jsonl`

## Ham parça günlüğe kaydı (pi-mono)

Bloklara ayrıştırılmadan önce **ham OpenAI-compat parçalarını** yakalamak için,
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

> Not: bu yalnızca pi-mono'nun
> `openai-completions` sağlayıcısını kullanan süreçler tarafından üretilir.

## Güvenlik notları

- Ham akış günlükleri tam istemleri, araç çıktısını ve kullanıcı verilerini içerebilir.
- Günlükleri yerel tutun ve hata ayıklamadan sonra silin.
- Günlükleri paylaşırsanız önce gizli verileri ve kişisel tanımlayıcı bilgileri temizleyin.
