---
read_when:
    - Çalışma alanı dosyasındaki tek bir yaprak düğümünü terminalden incelemek veya düzenlemek istiyorsunuz
    - Çalışma alanı durumuna karşı betik yazıyorsunuz ve kararlı, türden bağımsız bir adresleme şemasına ihtiyacınız var.
    - Kendi barındırdığınız Gateway üzerinde isteğe bağlı `oc-path` Plugin'ini etkinleştirip etkinleştirmemeye karar veriyorsunuz
summary: 'Birlikte gelen `oc-path` Plugin: `oc://` çalışma alanı dosyası adresleme şeması için `openclaw path` CLI’ını gönderir'
title: OC Path plugin
x-i18n:
    generated_at: "2026-06-28T00:56:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

Paketle gelen `oc-path` plugin'i, `oc://` çalışma alanı dosyası adresleme
şeması için [`openclaw path`](/tr/cli/path) CLI'sini ekler. OpenClaw deposunda
`extensions/oc-path/` altında gelir ancak isteğe bağlıdır; kurulum/derleme,
siz etkinleştirene kadar onu pasif bırakır.

`oc://` adresleri, bir çalışma alanı dosyasının içindeki tek bir yaprağa (veya
joker karakterli bir yaprak kümesine) işaret eder. Plugin bugün dört tür dosyayı
anlar:

- **markdown** (`.md`, `.mdx`): frontmatter, bölümler, öğeler, alanlar
- **jsonc** (`.jsonc`, `.json5`, `.json`): yorumlar ve biçimlendirme korunur
- **jsonl** (`.jsonl`, `.ndjson`): satır odaklı kayıtlar
- **yaml** (`.yaml`, `.yml`, `.lobster`): YAML belge API'si üzerinden
  eşleme/dizi/skaler düğümleri

Kendi barındıranlar ve düzenleyici uzantıları, SDK'ye doğrudan betik yazmadan
tek bir yaprağı okumak veya yazmak için CLI'yi kullanır; ajanlar ve kancalar ise
onu deterministik bir zemin olarak ele alır, böylece bayt sadakatli gidiş
dönüşler ve redaksiyon sentinel koruması türler arasında tekdüze uygulanır.

## Neden etkinleştirmeli

Betiklerin, kancaların veya yerel ajan araçlarının her dosya biçimi için bir
ayrıştırıcı icat etmeden çalışma alanı durumunun kesin bir parçasına işaret
etmesini istediğinizde `oc-path`'i etkinleştirin. Tek bir `oc://` adresi bir
markdown frontmatter anahtarını, bir bölüm öğesini, bir JSONC yapılandırma
yaprağını, bir JSONL olay alanını veya bir YAML iş akışı adımını adlandırabilir.

Bu, değişikliğin küçük, denetlenebilir ve tekrarlanabilir olması gereken
bakımcı iş akışları için önemlidir: tek bir değeri inceleyin, eşleşen kayıtları
bulun, bir yazmayı dry-run ile deneyin, ardından yorumları, satır sonlarını ve
yakındaki biçimlendirmeyi olduğu gibi bırakarak yalnızca o yaprağı uygulayın.
Bunu isteğe bağlı bir Plugin olarak tutmak, hiç ihtiyaç duymayan kurulumlarda
ayrıştırıcı bağımlılıklarını veya CLI yüzeyini çekirdeğe koymadan güçlü
kullanıcılara adresleme zeminini sağlar.

Etkinleştirmenin yaygın nedenleri:

- **Yerel otomasyon**: kabuk betikleri, ayrı markdown, JSONC, JSONL ve YAML
  ayrıştırma kodu taşımak yerine `openclaw path … --json` ile tek bir çalışma
  alanı değerini çözümleyebilir veya güncelleyebilir.
- **Ajan tarafından görülebilen düzenlemeler**: bir ajan, yazmadan önce
  adreslenen tek bir yaprak için dry-run farkını gösterebilir; bu, serbest
  biçimli bir dosya yeniden yazımından daha kolay incelenir.
- **Düzenleyici entegrasyonları**: bir düzenleyici, başlık metninden tahmin
  yürütmeden `oc://AGENTS.md/tools/gh` adresini kesin markdown düğümüne ve satır
  numarasına eşleyebilir.
- **Tanılama**: `emit`, bir dosyayı ayrıştırıcı ve yayıcı üzerinden gidiş
  dönüşe sokar; böylece otomatik düzenlemelere güvenmeden önce bir dosya türünün
  bayt düzeyinde kararlı olup olmadığını kontrol edebilirsiniz.

Somut örnekler:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Plugin, bilinçli olarak daha üst düzey semantiklerin sahibi değildir. Bellek
plugin'leri hâlâ bellek yazmalarının sahibidir, yapılandırma komutları hâlâ tam
yapılandırma yönetiminin sahibidir ve LKG mantığı hâlâ geri yükleme/yükseltme
işlemlerinin sahibidir. `oc-path`, bu üst düzey araçların etrafında
kurulabileceği dar adresleme ve bayt koruyan dosya işlemi katmanıdır.

## Nerede çalışır

Plugin, komutu çağırdığınız ana makinede **`openclaw` CLI'sinin içinde süreç içi
olarak** çalışır. Çalışan bir Gateway gerektirmez ve herhangi bir ağ soketi
açmaz; her fiil, işaret ettiğiniz bir dosya üzerinde saf bir dönüşümdür.

Plugin metaverisi `extensions/oc-path/openclaw.plugin.json` içinde bulunur:

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

`onStartup: false`, Plugin'i Gateway sıcak yolunun dışında tutar. `onCommands:
["path"]`, CLI'ye `openclaw path …` komutunu ilk kez çalıştırdığınızda Plugin'i
tembel olarak yüklemesini söyler; böylece fiili hiç kullanmayan kurulumlar
herhangi bir maliyet ödemez.

## Etkinleştir

```bash
openclaw plugins enable oc-path
```

Yeni durumun manifest anlık görüntüsüne yansıması için Gateway'i (çalıştırıyorsanız)
yeniden başlatın. Yalın `openclaw path` çağrıları aynı ana makinede hemen
çalışır; CLI, Plugin'i ihtiyaç üzerine yükler.

Şununla devre dışı bırakın:

```bash
openclaw plugins disable oc-path
```

## Bağımlılıklar

Tüm ayrıştırıcı bağımlılıkları Plugin'e yereldir; `oc-path`'i etkinleştirmek,
çekirdek çalışma zamanına yeni paketler çekmez:

| Bağımlılık     | Amaç                                                                 |
| -------------- | -------------------------------------------------------------------- |
| `commander`    | `resolve`, `find`, `set`, `validate`, `emit` için alt komut bağlama. |
| `jsonc-parser` | Yorumlar ve sondaki virgüller korunarak JSONC ayrıştırma + yaprak düzenlemeleri. |
| `markdown-it`  | Bölüm / öğe / alan modeli için Markdown tokenizasyonu.               |
| `yaml`         | Yorumlar ve akış stili korunarak YAML `Document` ayrıştırma / yayma / düzenleme. |

JSONL elle yazılmış olarak kalır; satır odaklı ayrıştırma herhangi bir
bağımlılıktan daha basittir ve satır başına JSONC ayrıştırması zaten
`jsonc-parser` üzerinden geçer.

## Ne sağlar

| Yüzey                          | Sağlayan                                                |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` ayrıştırıcı / biçimleyici | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Tür başına ayrıştırma / yayma / düzenleme | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| Evrensel resolve / find / set  | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Redaksiyon sentinel koruması   | `extensions/oc-path/src/oc-path/sentinel.ts`            |

CLI bugün tek genel yüzeydir. Zemin fiilleri Plugin'e özeldir; tüketiciler CLI'yi
kullanır (veya SDK'ye karşı kendi Plugin'lerini oluşturur).

## Diğer plugin'lerle ilişki

- **`memory-*`**: bellek yazmaları `oc-path` üzerinden değil, bellek plugin'leri
  üzerinden geçer. `oc-path` genel amaçlı bir dosya zeminidir; bellek
  plugin'leri kendi semantiklerini bunun üzerine katmanlar.
- **LKG**: `path`, Last-Known-Good yapılandırma geri yüklemesi hakkında bilgi
  sahibi değildir. Bir dosya LKG tarafından izleniyorsa, yükseltme mi yoksa
  kurtarma mı yapılacağına bir sonraki `observe` çağrısı karar verir; LKG
  yükseltme/kurtarma yaşam döngüsü üzerinden atomik çoklu set için `set --batch`,
  LKG kurtarma zeminiyle birlikte planlanmaktadır.

## Güvenlik

`set`, ham baytları zeminin yayma yolu üzerinden yazar; bu yol redaksiyon
sentinel korumasını otomatik olarak uygular. `__OPENCLAW_REDACTED__` taşıyan
(verbatim veya alt dize olarak) bir yaprak, yazma zamanında `OC_EMIT_SENTINEL`
ile reddedilir. CLI ayrıca yazdırdığı insan veya JSON çıktılarından gerçek
sentinel değerini temizler ve onu `[REDACTED]` ile değiştirir; böylece terminal
kayıtları ve işlem hatları işaretçiyi asla sızdırmaz.

## İlgili

- [`openclaw path` CLI başvurusu](/tr/cli/path)
- [Plugin'leri yönetme](/tr/plugins/manage-plugins)
- [Plugin oluşturma](/tr/plugins/building-plugins)
