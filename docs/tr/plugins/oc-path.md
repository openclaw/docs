---
read_when:
    - Terminalden bir çalışma alanı dosyasındaki tek bir uç öğeyi incelemek veya düzenlemek istiyorsunuz
    - Çalışma alanı durumuna yönelik betik yazıyorsunuz ve türden bağımsız, kararlı bir adresleme düzenine ihtiyacınız var
    - Kendi barındırdığınız bir Gateway üzerinde isteğe bağlı `oc-path` Plugin'ini etkinleştirip etkinleştirmemeye karar veriyorsunuz
summary: 'Paketlenmiş `oc-path` Plugin''i: `oc://` çalışma alanı dosyası adresleme şeması için `openclaw path` CLI''sini içerir'
title: OC Path Plugin'i
x-i18n:
    generated_at: "2026-07-12T12:31:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

Paketle birlikte gelen `oc-path` Plugin’i, `oc://` çalışma alanı dosyası adresleme şeması için [`openclaw path`](/tr/cli/path) CLI’sini ekler. OpenClaw deposunda `extensions/oc-path/` altında sunulur ancak isteğe bağlıdır: kurulum/derleme sonrasında siz etkinleştirene kadar devre dışı kalır.

`oc://` adresleri, bir çalışma alanı dosyasındaki tek bir yaprak öğeyi (veya joker karakterle belirtilen bir yaprak kümesini) gösterir. Plugin dört dosya türünü destekler:

- **markdown** (`.md`): ön bilgiler, bölümler, öğeler, alanlar
- **jsonc** (`.jsonc`, `.json`): yorumlar ve biçimlendirme korunur
- **jsonl** (`.jsonl`, `.ndjson`): satır odaklı kayıtlar
- **yaml** (`.yaml`, `.yml`, `.lobster`): `yaml` paketinin `Document` API’si üzerinden eşleme/dizi/skaler düğümleri

Kendi sisteminde barındıranlar ve düzenleyici uzantıları, doğrudan SDK’ye yönelik betik yazmadan tek bir yaprak öğeyi okumak veya yazmak için CLI’yi kullanır; ajanlar ve kancalar ise bayt düzeyinde aslına uygun gidiş-dönüş işlemlerinin ve redaksiyon belirteci korumasının tüm türlerde tutarlı şekilde uygulanması için bunu belirlenimci bir altyapı olarak kullanır. Tam dil bilgisi, her komuta özgü bayrak listesi ve dosya türü başına uygulamalı örnekler için [CLI başvurusuna](/tr/cli/path) bakın; bu sayfa Plugin’in neden ve nasıl etkinleştirileceğini açıklar.

## Neden etkinleştirmelisiniz?

Betiklerin, kancaların veya yerel ajan araçlarının her dosya biçimi için özel bir ayrıştırıcı kullanmadan çalışma alanı durumunun belirli bir parçasını göstermesi gerektiğinde `oc-path`’i etkinleştirin. Tek bir `oc://` adresi; bir markdown ön bilgi anahtarını, bölüm öğesini, JSONC yapılandırma yaprağını, JSONL olay alanını veya YAML iş akışı adımını adlandırabilir.

Bu, değişikliğin küçük, denetlenebilir ve tekrarlanabilir kalması gereken bakımcı iş akışları için önemlidir: tek bir değeri inceleyin, eşleşen kayıtları bulun, bir yazma işlemini deneme modunda çalıştırın ve ardından yorumlara, satır sonlarına ve yakındaki biçimlendirmeye dokunmadan yalnızca o yaprak öğeyi uygulayın.

Etkinleştirmenin yaygın nedenleri:

- **Yerel otomasyon**: kabuk betikleri, ayrı markdown, JSONC, JSONL ve YAML ayrıştırma kodları taşımak yerine `openclaw path … --json` ile tek bir çalışma alanı değerini çözümler veya günceller.
- **Ajan tarafından görülebilen düzenlemeler**: bir ajan, yazmadan önce adreslenmiş tek bir yaprak öğe için deneme modu farkını gösterir; bunu incelemek serbest biçimli bir dosya yeniden yazımını incelemekten daha kolaydır.
- **Düzenleyici entegrasyonları**: bir düzenleyici, başlık metninden tahminde bulunmadan `oc://AGENTS.md/tools/gh` adresini tam markdown düğümü ve satır numarasıyla eşler.
- **Tanılama**: `emit`, bir dosyayı ayrıştırıcı ve çıktı üretici üzerinden gidiş-dönüş işlemine tabi tutar; böylece otomatik düzenlemelere güvenmeden önce dosya türünün bayt düzeyinde kararlı olup olmadığını denetleyebilirsiniz.

```bash
# GitHub Plugin’i bu yapılandırmada etkin mi?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Bu oturum günlüğünde hangi araç çağrısı adları görünüyor?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Bu küçük yapılandırma düzenlemesi hangi baytları yazar?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path`, kasıtlı olarak daha üst düzey anlamların sahibi değildir. Bellek Plugin’leri bellek yazma işlemlerinin, yapılandırma komutları tam yapılandırma yönetiminin ve bilinen son iyi (LKG) yapılandırma kurtarma mekanizması da geri yükleme/yükseltme işlemlerinin sahibi olmaya devam eder. `oc-path`, bu üst düzey araçların çevresinde oluşturulabileceği dar kapsamlı adresleme ve bayt korumalı dosya işlemi katmanıdır.

## Nerede çalışır?

Plugin, komutu çağırdığınız ana makinedeki `openclaw` CLI’sinin **işlem içi ortamında** çalışır. Çalışan bir Gateway gerektirmez ve herhangi bir ağ soketi açmaz; her komut, gösterdiğiniz dosya üzerinde gerçekleştirilen saf bir dönüşümdür.

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

`onStartup: false`, Plugin’i Gateway başlatma yolunun dışında tutar. `commandAliases` ve `activation.onCommands`, `openclaw path …` komutunu ilk kez çalıştırdığınızda CLI’ye Plugin’i gecikmeli olarak yüklemesini bildirir; böylece komutu hiç kullanmayan kurulumlarda herhangi bir maliyet oluşmaz.

## Etkinleştirme

```bash
openclaw plugins enable oc-path
```

Bildirim anlık görüntüsünün yeni durumu algılaması için Gateway’i (çalıştırıyorsanız) yeniden başlatın. Aynı ana makinedeki yalın `openclaw path` çağrıları hemen çalışır; CLI, Plugin’i talep üzerine yükler.

Şununla devre dışı bırakın:

```bash
openclaw plugins disable oc-path
```

## Bağımlılıklar

Tüm ayrıştırıcı bağımlılıkları Plugin’e özeldir; `oc-path`’i etkinleştirmek çekirdek çalışma zamanına yeni paketler eklemez:

| Bağımlılık     | Amaç                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------- |
| `commander`    | `resolve`, `find`, `set`, `validate`, `emit` alt komutlarının bağlanması.                  |
| `jsonc-parser` | Yorumları ve sondaki virgülleri koruyarak JSONC ayrıştırma ve yaprak düzenlemeleri.        |
| `markdown-it`  | Bölüm / öğe / alan modeli için Markdown belirteçlerine ayırma.                             |
| `yaml`         | Yorumları ve akış stilini koruyarak YAML `Document` ayrıştırma / üretme / düzenleme.       |

JSONL elle gerçekleştirilmiş olarak kalır: satır odaklı ayrıştırma herhangi bir bağımlılığı kullanmaktan daha basittir ve satır başına ayrıştırma zaten `jsonc-parser` üzerinden geçer.

## Sağladıkları

| Yüzey                          | Sağlayan                                                |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` ayrıştırıcı / biçimleyici | `extensions/oc-path/src/oc-path/oc-path.ts`          |
| Türe göre ayrıştırma / üretme / düzenleme | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Evrensel çözümleme / bulma / ayarlama | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Redaksiyon belirteci koruması  | `extensions/oc-path/src/oc-path/sentinel.ts`            |

Günümüzde tek genel kullanıma açık yüzey CLI’dir. Altyapı komutları Plugin’e özeldir; tüketiciler CLI’yi kullanır (veya SDK’ye karşı kendi Plugin’lerini oluşturur).

## Diğer Plugin’lerle ilişkisi

- **`memory-*`**: bellek yazma işlemleri `oc-path` üzerinden değil, bellek Plugin’leri üzerinden gerçekleştirilir. `oc-path` genel amaçlı bir dosya altyapısıdır; bellek Plugin’leri kendi anlamlarını bunun üzerine katmanlar.
- **LKG**: `path`, bilinen son iyi yapılandırmanın geri yüklenmesi hakkında bilgi sahibi değildir. `path` üzerinden düzenlediğiniz bir dosya LKG tarafından da izleniyorsa bir sonraki yapılandırma gözlem döngüsü dosyanın yükseltilmesine veya kurtarılmasına karar verir; bir `path` düzenlemesini o dosyaya yapılan diğer tüm doğrudan yazma işlemleriyle aynı şekilde değerlendirin.

## Güvenlik

`set`, redaksiyon belirteci korumasını otomatik olarak uygulayan altyapının çıktı üretme yolu üzerinden ham baytlar yazar. `__OPENCLAW_REDACTED__` değerini (aynen veya bir alt dize olarak) taşıyan bir yaprak öğenin yazılması, yazma sırasında `OC_EMIT_SENTINEL` hatasıyla reddedilir. CLI ayrıca yazdırdığı insan tarafından okunabilir veya JSON biçimindeki tüm çıktılardan değişmez belirteci temizleyerek `[REDACTED]` ile değiştirir; böylece terminal kayıtları ve işlem hatları belirteci hiçbir zaman sızdırmaz.

## İlgili içerikler

- [`openclaw path` CLI başvurusu](/tr/cli/path)
- [Plugin’leri yönetme](/tr/plugins/manage-plugins)
- [Plugin oluşturma](/tr/plugins/building-plugins)
