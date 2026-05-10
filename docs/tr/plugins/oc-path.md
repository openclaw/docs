---
read_when:
    - Terminalden bir çalışma alanı dosyasındaki tek bir uç düğümü incelemek veya düzenlemek istiyorsunuz
    - Çalışma alanı durumuyla etkileşen betikler yazıyorsunuz ve kararlı, türden bağımsız bir adresleme şemasına ihtiyacınız var
    - Kendi barındırdığınız bir Gateway üzerinde isteğe bağlı `oc-path` Plugin öğesini etkinleştirip etkinleştirmemeye karar veriyorsunuz.
summary: 'Birlikte sunulan `oc-path` Plugin: `oc://` çalışma alanı dosyası adresleme şeması için `openclaw path` CLI ile birlikte gelir'
title: OC Path Plugin
x-i18n:
    generated_at: "2026-05-10T19:46:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

Paketle gelen `oc-path` Plugin'i, `oc://` çalışma alanı dosyası adresleme şeması için [`openclaw path`](/tr/cli/path) CLI'sini ekler. OpenClaw deposunda `extensions/oc-path/` altında gelir ancak isteğe bağlıdır; kurulum/derleme, siz etkinleştirene kadar onu pasif bırakır.

`oc://` adresleri, bir çalışma alanı dosyasının içindeki tek bir yaprağı (veya joker karakterli bir yaprak kümesini) gösterir. Plugin bugün üç tür dosyayı anlar:

- **markdown** (`.md`, `.mdx`): frontmatter, bölümler, öğeler, alanlar
- **jsonc** (`.jsonc`, `.json5`, `.json`): yorumlar ve biçimlendirme korunur
- **jsonl** (`.jsonl`, `.ndjson`): satır odaklı kayıtlar

Kendi barındırmasını yapanlar ve editör eklentileri, SDK'ye doğrudan betik yazmadan tek bir yaprağı okumak veya yazmak için CLI'yi kullanır; ajanlar ve kancalar bunu deterministik bir zemin olarak ele alır, böylece bayt sadakatli gidiş-dönüşler ve redaksiyon sentinel koruması türler arasında aynı şekilde uygulanır.

## Neden Etkinleştirmeli

Betiklerin, kancaların veya yerel ajan araçlarının her dosya şekli için bir ayrıştırıcı icat etmeden çalışma alanı durumunun kesin bir parçasını işaret etmesini istediğinizde `oc-path`'i etkinleştirin. Tek bir `oc://` adresi bir markdown frontmatter anahtarını, bir bölüm öğesini, bir JSONC yapılandırma yaprağını veya bir JSONL olay alanını adlandırabilir.

Bu, değişikliğin küçük, denetlenebilir ve tekrarlanabilir olması gereken bakımcı iş akışları için önemlidir: tek bir değeri inceleyin, eşleşen kayıtları bulun, bir yazmayı kuru çalıştırmayla deneyin, ardından yorumları, satır sonlarını ve yakındaki biçimlendirmeyi olduğu gibi bırakarak yalnızca o yaprağı uygulayın. Bunu isteğe bağlı bir Plugin olarak tutmak, güçlü kullanıcılara adresleme zeminini sağlar; buna hiç ihtiyaç duymayan kurulumlarda ayrıştırıcı bağımlılıklarını veya CLI yüzeyini çekirdeğe koymaz.

Etkinleştirmek için yaygın nedenler:

- **Yerel otomasyon**: kabuk betikleri, ayrı markdown, JSONC ve JSONL ayrıştırma kodu taşımak yerine `openclaw path … --json` ile tek bir çalışma alanı değerini çözebilir veya güncelleyebilir.
- **Ajan tarafından görülebilen düzenlemeler**: bir ajan, yazmadan önce adreslenen tek bir yaprak için kuru çalıştırma farkını gösterebilir; bu, serbest biçimli bir dosya yeniden yazımından daha kolay incelenir.
- **Editör entegrasyonları**: bir editör, `oc://AGENTS.md/tools/gh` adresini başlık metninden tahmin etmeden tam markdown düğümüne ve satır numarasına eşleyebilir.
- **Tanılama**: `emit`, bir dosyayı ayrıştırıcı ve yayıcı üzerinden gidiş-dönüş geçirir; böylece otomatik düzenlemelere güvenmeden önce bir dosya türünün bayt açısından kararlı olup olmadığını kontrol edebilirsiniz.

Somut örnekler:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Plugin kasıtlı olarak daha yüksek düzeyli semantiklerin sahibi değildir. Bellek Plugin'leri bellek yazımlarının sahibi olmaya devam eder, yapılandırma komutları tam yapılandırma yönetiminin sahibi olmaya devam eder ve LKG mantığı geri yükleme/yükseltme işlemlerinin sahibi olmaya devam eder. `oc-path`, bu daha yüksek düzeyli araçların etrafında inşa edebileceği dar adresleme ve bayt koruyan dosya işlem katmanıdır.

## Nerede Çalışır

Plugin, komutu çağırdığınız ana makinede **`openclaw` CLI'nin içinde süreç içi** çalışır. Çalışan bir Gateway gerektirmez ve herhangi bir ağ soketi açmaz; her fiil, işaret ettiğiniz bir dosya üzerinde saf bir dönüşümdür.

Plugin meta verileri `extensions/oc-path/openclaw.plugin.json` içinde bulunur:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false`, Plugin'i Gateway sıcak yolunun dışında tutar. `onCommands: ["path"]`, CLI'ye `openclaw path …` komutunu ilk kez çalıştırdığınızda Plugin'i tembel olarak yüklemesini söyler; böylece fiili hiç kullanmayan kurulumlar hiçbir maliyet ödemez.

## Etkinleştir

```bash
openclaw plugins enable oc-path
```

Gateway'i çalıştırıyorsanız, manifest anlık görüntüsünün yeni durumu alması için yeniden başlatın. Çıplak `openclaw path` çağrıları aynı ana makinede hemen çalışır; CLI Plugin'i gerektiğinde yükler.

Şununla devre dışı bırakın:

```bash
openclaw plugins disable oc-path
```

## Bağımlılıklar

Tüm ayrıştırıcı bağımlılıkları Plugin'e yereldir; `oc-path`'i etkinleştirmek çekirdek çalışma zamanına yeni paketler çekmez:

| Bağımlılık     | Amaç                                                                |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | `resolve`, `find`, `set`, `validate`, `emit` için alt komut bağlantısı. |
| `jsonc-parser` | Yorumlar ve sondaki virgüller korunarak JSONC ayrıştırma + yaprak düzenlemeleri. |
| `markdown-it`  | Bölüm / öğe / alan modeli için Markdown tokenleştirme.              |

JSONL elde yazılmış olarak kalır; satır odaklı ayrıştırma herhangi bir bağımlılıktan daha basittir ve satır başına JSONC ayrıştırma zaten `jsonc-parser` üzerinden geçer.

## Ne Sağlar

| Yüzey                          | Sağlayan                                                |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` ayrıştırıcı / biçimlendirici | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Tür başına ayrıştırma / yayma / düzenleme | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| Evrensel resolve / find / set  | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Redaksiyon sentinel koruması   | `extensions/oc-path/src/oc-path/sentinel.ts`            |

CLI bugün tek herkese açık yüzeydir. Zemin fiilleri Plugin'e özeldir; tüketiciler CLI'yi kullanır (veya SDK'ye karşı kendi Plugin'lerini oluşturur).

## Diğer Plugin'lerle İlişki

- **`memory-*`**: bellek yazımları `oc-path` üzerinden değil, bellek Plugin'leri üzerinden geçer. `oc-path` genel bir dosya zeminidir; bellek Plugin'leri bunun üzerine kendi semantiklerini katmanlar.
- **LKG**: `path`, Son Bilinen İyi yapılandırma geri yüklemesi hakkında bilgi sahibi değildir. Bir dosya LKG tarafından izleniyorsa, bir sonraki `observe` çağrısı yükseltme mi kurtarma mı yapılacağına karar verir; LKG yükseltme/kurtarma yaşam döngüsü üzerinden atomik çoklu set için `set --batch`, LKG-kurtarma zeminiyle birlikte planlanmaktadır.

## Güvenlik

`set`, ham baytları zeminin yayma yolu üzerinden yazar; bu yol redaksiyon sentinel korumasını otomatik olarak uygular. `__OPENCLAW_REDACTED__` taşıyan bir yaprak (birebir veya alt dize olarak), yazma zamanında `OC_EMIT_SENTINEL` ile reddedilir. CLI ayrıca bastığı tüm insan veya JSON çıktılarından gerçek sentinel değerini temizler ve onu `[REDACTED]` ile değiştirir; böylece terminal yakalamaları ve işlem hatları işaretçiyi asla sızdırmaz.

## İlgili

- [`openclaw path` CLI başvurusu](/tr/cli/path)
- [Plugin'leri yönetin](/tr/plugins/manage-plugins)
- [Plugin oluşturma](/tr/plugins/building-plugins)
