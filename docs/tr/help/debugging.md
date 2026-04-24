---
read_when:
    - Akıl yürütme sızıntısı için ham model çıktısını incelemeniz gerekiyor
    - Yineleme yaparken Gateway'i izleme modunda çalıştırmak istiyorsunuz
    - Tekrarlanabilir bir hata ayıklama iş akışına ihtiyacınız var
summary: 'Hata ayıklama araçları: izleme modu, ham model akışları ve akıl yürütme sızıntısını izleme'
title: Hata ayıklama
x-i18n:
    generated_at: "2026-04-24T09:12:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d52070204e21cd7e5bff565fadab96fdeee0ad906c4c8601572761a096d9025
    source_path: help/debugging.md
    workflow: 15
---

Bu sayfa, özellikle bir
sağlayıcı akıl yürütmeyi normal metne karıştırdığında, akış çıktısı için hata ayıklama yardımcılarını kapsar.

## Çalışma zamanı hata ayıklama geçersiz kılmaları

Sohbette `/debug` kullanarak **yalnızca çalışma zamanına ait** yapılandırma geçersiz kılmaları ayarlayın (disk değil, bellek).
`/debug` varsayılan olarak devre dışıdır; `commands.debug: true` ile etkinleştirin.
Bu, `openclaw.json` dosyasını düzenlemeden belirsiz ayarları açıp kapatmanız gerektiğinde kullanışlıdır.

Örnekler:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug unset messages.responsePrefix
/debug reset
```

`/debug reset`, tüm geçersiz kılmaları temizler ve disk üzerindeki yapılandırmaya döner.

## Oturum iz çıktısı

Bir oturumda tam ayrıntılı modu açmadan Plugin'e ait iz/hata ayıklama satırlarını görmek istediğinizde `/trace` kullanın.

Örnekler:

```text
/trace
/trace on
/trace off
```

`/trace`, Active Memory hata ayıklama özetleri gibi Plugin tanılamaları için kullanılır.
Normal ayrıntılı durum/araç çıktısı için `/verbose` kullanmaya devam edin ve
yalnızca çalışma zamanına ait yapılandırma geçersiz kılmaları için `/debug` kullanmaya devam edin.

## Geçici CLI hata ayıklama zamanlaması

OpenClaw, yerel inceleme için küçük bir yardımcı olarak `src/cli/debug-timing.ts` dosyasını tutar.
Bu dosya kasıtlı olarak CLI başlangıcına, komut yönlendirmesine veya varsayılan olarak herhangi bir komuta bağlanmamıştır. Bunu yalnızca yavaş bir komutta hata ayıklarken kullanın; sonra davranış değişikliğini yayına almadan önce import'u ve span'leri kaldırın.

Bir komut yavaş olduğunda ve CPU profiler kullanmaya ya da belirli bir alt sistemi düzeltmeye karar vermeden önce hızlı bir faz dökümüne ihtiyaç duyduğunuzda bunu kullanın.

### Geçici span'ler ekleme

Yardımcıyı incelediğiniz kodun yanına ekleyin. Örneğin
`openclaw models list` hata ayıklanırken `src/commands/models/list.list-command.ts`
içindeki geçici bir yama şöyle görünebilir:

```ts
// Yalnızca geçici hata ayıklama için. Yayına almadan önce kaldırın.
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

- Geçici faz adlarını `debug:` ile önekleyin.
- Yalnızca şüphelenilen yavaş bölümlerin etrafına birkaç span ekleyin.
- Yardımcı adları yerine `registry`, `auth_store` veya `rows` gibi geniş fazları tercih edin.
- Eşzamanlı işler için `time()`, promise'ler için `timeAsync()` kullanın.
- stdout'u temiz tutun. Yardımcı stderr'e yazar, böylece komut JSON çıktısı çözümlenebilir kalır.
- Son düzeltme PR'sini açmadan önce geçici import'ları ve span'leri kaldırın.
- Optimizasyonu açıklayan issue veya PR içine zamanlama çıktısını ya da kısa bir özetini ekleyin.

### Okunabilir çıktıyla çalıştırma

Canlı hata ayıklama için okunabilir kip en iyisidir:

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

Bu çıktının bulguları:

| Faz                                      |      Süre | Anlamı                                                                                                   |
| ---------------------------------------- | --------: | -------------------------------------------------------------------------------------------------------- |
| `debug:models:list:auth_store`           |     20.3s | En büyük maliyet auth-profile store yüklemesinde; önce bu incelenmelidir.                               |
| `debug:models:list:ensure_models_json`   |      5.0s | `models.json` eşzamanlaması, önbellekleme veya atlama koşulları açısından incelenecek kadar pahalıdır. |
| `debug:models:list:load_model_registry`  |      5.9s | Kayıt defteri oluşturma ve sağlayıcı kullanılabilirlik işi de anlamlı maliyetlerdir.                    |
| `debug:models:list:read_registry_models` |      2.4s | Tüm kayıt defteri modellerini okumak ücretsiz değildir ve `--all` için önemli olabilir.                 |
| satır ekleme fazları                     | toplam 3.2s | Görüntülenen beş satırı oluşturmak bile birkaç saniye sürüyor; filtreleme yolu daha yakından incelenmeli. |
| `debug:models:list:print_model_table`    |       0ms | Darboğaz render değildir.                                                                                |

Bu bulgular, zamanlama kodunu üretim yollarında tutmadan sonraki yamayı yönlendirmek için yeterlidir.

### JSON çıktısıyla çalıştırma

Zamanlama verisini kaydetmek veya karşılaştırmak istediğinizde JSON kipini kullanın:

```bash
OPENCLAW_DEBUG_TIMING=json pnpm openclaw models list --all --provider moonshot \
  2> .artifacts/models-list-timing.jsonl
```

Her stderr satırı tek bir JSON nesnesidir:

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

### Yayına almadan önce temizleyin

Son PR'yi açmadan önce:

```bash
rg 'createCliDebugTiming|debug:[a-z0-9_-]+:' src/commands src/cli \
  --glob '!src/cli/debug-timing.*' \
  --glob '!*.test.ts'
```

PR açıkça kalıcı bir tanılama yüzeyi eklemiyorsa bu komut
hiçbir geçici araçlandırma çağrı noktasını döndürmemelidir. Normal performans
düzeltmeleri için yalnızca davranış değişikliğini, testleri ve zamanlama
kanıtına dair kısa bir notu bırakın.

Daha derin CPU darboğazları için daha fazla zamanlama sarmalayıcısı eklemek yerine
Node profiling (`--cpu-prof`) veya harici bir profiler kullanın.

## Gateway izleme modu

Hızlı yineleme için Gateway'i dosya izleyici altında çalıştırın:

```bash
pnpm gateway:watch
```

Bu şu komuta eşlenir:

```bash
node scripts/watch-node.mjs gateway --force
```

İzleyici; `src/` altındaki derleme açısından ilgili dosyalarda, extension kaynak dosyalarında,
extension `package.json` ve `openclaw.plugin.json` meta verilerinde, `tsconfig.json`,
`package.json` ve `tsdown.config.ts` dosyalarında yeniden başlatır. Extension meta veri değişiklikleri
Gateway'i `tsdown` yeniden derlemesini zorlamadan yeniden başlatır; kaynak ve yapılandırma değişiklikleri ise önce
`dist` derlemesini yapar.

`gateway:watch` sonrasına istediğiniz Gateway CLI bayraklarını ekleyin; her
yeniden başlatmada bunlar iletilir. Aynı repo/bayrak kümesi için aynı izleme komutunu yeniden çalıştırmak artık
eski izleyiciyi değiştirir; böylece yinelenen izleyici üst süreçleri birikmez.

## Geliştirme profili + geliştirme Gateway'i (`--dev`)

Geliştirme profilini, durumu yalıtmak ve hata ayıklama için güvenli, atılabilir bir kurulum
oluşturmak için kullanın. **İki** `--dev` bayrağı vardır:

- **Genel `--dev` (profil):** durumu `~/.openclaw-dev` altında yalıtır ve
  Gateway portunu varsayılan olarak `19001` yapar (türetilmiş portlar buna göre kayar).
- **`gateway --dev`: Gateway'e eksikse varsayılan yapılandırma +
  çalışma alanını otomatik oluşturmasını söyler** (ve `BOOTSTRAP.md` dosyasını atlar).

Önerilen akış (geliştirme profili + geliştirme başlangıcı):

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

Henüz genel kurulumunuz yoksa CLI'yi `pnpm openclaw ...` üzerinden çalıştırın.

Bu ne yapar:

1. **Profil yalıtımı** (genel `--dev`)
   - `OPENCLAW_PROFILE=dev`
   - `OPENCLAW_STATE_DIR=~/.openclaw-dev`
   - `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
   - `OPENCLAW_GATEWAY_PORT=19001` (browser/canvas buna göre kayar)

2. **Geliştirme başlangıcı** (`gateway --dev`)
   - Eksikse en düşük yapılandırmayı yazar (`gateway.mode=local`, bind loopback).
   - `agent.workspace` değerini geliştirme çalışma alanına ayarlar.
   - `agent.skipBootstrap=true` ayarlar (`BOOTSTRAP.md` yok).
   - Eksikse çalışma alanı dosyalarını tohumlar:
     `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`.
   - Varsayılan kimlik: **C3‑PO** (protocol droid).
   - Geliştirme kipinde kanal sağlayıcılarını atlar (`OPENCLAW_SKIP_CHANNELS=1`).

Sıfırlama akışı (temiz başlangıç):

```bash
pnpm gateway:dev:reset
```

Not: `--dev`, **genel** bir profil bayrağıdır ve bazı çalıştırıcılar tarafından yutulur.
Bunu açıkça yazmanız gerekiyorsa ortam değişkeni biçimini kullanın:

```bash
OPENCLAW_PROFILE=dev openclaw gateway --dev --reset
```

`--reset`; yapılandırmayı, kimlik bilgilerini, oturumları ve geliştirme çalışma alanını
(`rm` değil, `trash` kullanarak) siler, ardından varsayılan geliştirme kurulumunu yeniden oluşturur.

İpucu: geliştirme dışı bir Gateway zaten çalışıyorsa (launchd/systemd), önce onu durdurun:

```bash
openclaw gateway stop
```

## Ham akış günlüğü (OpenClaw)

OpenClaw, **ham asistan akışını** herhangi bir filtreleme/biçimlendirme öncesinde günlüğe kaydedebilir.
Bu, akıl yürütmenin düz metin deltaları olarak mı
(yoksa ayrı thinking blokları olarak mı) geldiğini görmenin en iyi yoludur.

CLI ile etkinleştirin:

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

Ayrıştırılmadan önce **ham OpenAI uyumlu parçaları** yakalamak için
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
> `openai-completions` sağlayıcısını kullanan süreçler tarafından yayılır.

## Güvenlik notları

- Ham akış günlükleri tam istemleri, araç çıktılarını ve kullanıcı verilerini içerebilir.
- Günlükleri yerelde tutun ve hata ayıklamadan sonra silin.
- Günlükleri paylaşırsanız önce gizli bilgileri ve PII'yi temizleyin.

## İlgili

- [Sorun giderme](/tr/help/troubleshooting)
- [SSS](/tr/help/faq)
