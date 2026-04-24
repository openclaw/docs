---
read_when:
    - QA senaryo tanımlarını veya qa-lab harness kodunu yeniden düzenleme
    - QA davranışını Markdown senaryoları ile TypeScript harness mantığı arasında taşıma
summary: Senaryo kataloğu ve harness birleştirmesi için QA yeniden düzenleme planı
title: QA yeniden düzenleme
x-i18n:
    generated_at: "2026-04-24T09:29:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

Durum: temel taşıma tamamlandı.

## Amaç

OpenClaw QA'yı bölünmüş tanım modelinden tek bir doğruluk kaynağına taşımak:

- senaryo üst verileri
- modele gönderilen istemler
- kurulum ve temizlik
- harness mantığı
- doğrulamalar ve başarı ölçütleri
- yapıtlar ve rapor ipuçları

Hedeflenen son durum, davranışın çoğunu TypeScript içinde sabit kodlamak yerine güçlü senaryo tanım dosyalarını yükleyen genel bir QA harness'ıdır.

## Geçerli Durum

Birincil doğruluk kaynağı artık `qa/scenarios/index.md` içinde ve her
senaryo için `qa/scenarios/<theme>/*.md` altında bir dosyada yaşıyor.

Uygulananlar:

- `qa/scenarios/index.md`
  - kanonik QA paketi üst verileri
  - operatör kimliği
  - başlangıç görevi
- `qa/scenarios/<theme>/*.md`
  - senaryo başına bir Markdown dosyası
  - senaryo üst verileri
  - işleyici bağlamaları
  - senaryoya özgü yürütme yapılandırması
- `extensions/qa-lab/src/scenario-catalog.ts`
  - Markdown paket ayrıştırıcısı + zod doğrulaması
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - Markdown paketinden plan oluşturma
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - oluşturulmuş uyumluluk dosyalarını ve `QA_SCENARIOS.md` dosyasını tohumlar
- `extensions/qa-lab/src/suite.ts`
  - Markdown ile tanımlanan işleyici bağlamaları üzerinden yürütülebilir senaryoları seçer
- QA bus protokolü + kullanıcı arayüzü
  - görüntü/video/ses/dosya işleme için genel satır içi ek dosyalar

Kalan bölünmüş yüzeyler:

- `extensions/qa-lab/src/suite.ts`
  - yürütülebilir özel işleyici mantığının çoğunun sahibi hâlâ bu dosya
- `extensions/qa-lab/src/report.ts`
  - rapor yapısını hâlâ çalışma zamanı çıktılarından türetiyor

Yani doğruluk kaynağı ayrımı düzeltildi, ancak yürütme hâlâ tam bildirime dayalı olmaktan çok işleyici destekli.

## Gerçek Senaryo Yüzeyi Nasıl Görünüyor

Geçerli paketi okumak birkaç farklı senaryo sınıfı gösteriyor.

### Basit etkileşim

- kanal temel çizgisi
- DM temel çizgisi
- ileti dizili takip
- model değiştirme
- onay tamamlama
- tepki/düzenleme/silme

### Yapılandırma ve çalışma zamanı değişimi

- config patch skill devre dışı bırakma
- config apply yeniden başlatma uyandırması
- config yeniden başlatma yetenek değiştirme
- çalışma zamanı envanter sapması denetimi

### Dosya sistemi ve depo doğrulamaları

- kaynak/belge keşif raporu
- Lobster Invaders derleme
- oluşturulmuş görüntü yapıtı araması

### Bellek orkestrasyonu

- bellek geri çağırma
- kanal bağlamında bellek araçları
- bellek hata geri dönüşü
- oturum belleği sıralaması
- ileti dizisi bellek yalıtımı
- bellek Dreaming taraması

### Araç ve Plugin entegrasyonu

- MCP Plugin-tools çağrısı
- skill görünürlüğü
- skill sıcak kurulum
- yerel görüntü üretimi
- görüntü gidiş-dönüş
- ek dosyadan görüntü anlama

### Çok turlu ve çok aktörlü

- alt aracı devri
- alt aracı fanout sentezi
- yeniden başlatma kurtarma tarzı akışlar

Bu kategoriler önemlidir çünkü DSL gereksinimlerini yönlendirir. Düz bir istem + beklenen metin listesi yeterli değildir.

## Yön

### Tek doğruluk kaynağı

Yazılan doğruluk kaynağı olarak `qa/scenarios/index.md` ile `qa/scenarios/<theme>/*.md` kullanın.

Paket şunları korumalı:

- incelemede insan tarafından okunabilir
- makine tarafından ayrıştırılabilir
- şunları yönlendirecek kadar zengin:
  - paket yürütmesi
  - QA çalışma alanı önyüklemesi
  - QA Lab UI üst verileri
  - belge/keşif istemleri
  - rapor üretimi

### Tercih edilen yazım biçimi

Üst düzey biçim olarak Markdown kullanın; içinde yapılandırılmış YAML olsun.

Önerilen şekil:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/sağlayıcı geçersiz kılmaları
  - prerequisites
- düz yazı bölümleri
  - objective
  - notes
  - debugging hints
- çitlenmiş YAML blokları
  - setup
  - steps
  - assertions
  - cleanup

Bu şunları sağlar:

- dev JSON'a göre daha iyi PR okunabilirliği
- saf YAML'dan daha zengin bağlam
- katı ayrıştırma ve zod doğrulaması

Ham JSON yalnızca ara oluşturulmuş biçim olarak kabul edilebilir.

## Önerilen Senaryo Dosyası Şekli

Örnek:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Amaç

Oluşturulan medyanın takip turunda yeniden eklendiğini doğrulayın.

# Kurulum

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Adımlar

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Beklenen

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## DSL'nin Kapsaması Gereken Çalıştırıcı Yetenekleri

Geçerli pakete dayanarak, genel çalıştırıcı yalnızca istem yürütmeden fazlasına ihtiyaç duyar.

### Ortam ve kurulum eylemleri

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Aracı turu eylemleri

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Yapılandırma ve çalışma zamanı eylemleri

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Dosya ve yapıt eylemleri

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Bellek ve cron eylemleri

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### MCP eylemleri

- `mcp.callTool`

### Doğrulamalar

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Değişkenler ve Yapıt Başvuruları

DSL, kaydedilmiş çıktıları ve sonradan başvuruları desteklemelidir.

Geçerli paketten örnekler:

- bir ileti dizisi oluştur, sonra `threadId` yeniden kullan
- bir oturum oluştur, sonra `sessionKey` yeniden kullan
- bir görüntü üret, sonra bunu sonraki turda dosya eki olarak ekle
- bir uyandırma işaretçisi dizesi üret, sonra bunun daha sonra göründüğünü doğrula

Gerekli yetenekler:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- yollar, oturum anahtarları, ileti dizisi kimlikleri, işaretçiler, araç çıktıları için tipli başvurular

Değişken desteği olmadan, harness senaryo mantığını TypeScript'e geri sızdırmaya devam edecektir.

## Kaçış Kapısı Olarak Ne Kalmalı

Tamamen saf bildirime dayalı bir çalıştırıcı 1. fazda gerçekçi değildir.

Bazı senaryolar doğası gereği yoğun orkestrasyon gerektirir:

- bellek Dreaming taraması
- config apply yeniden başlatma uyandırması
- config yeniden başlatma yetenek değiştirme
- zaman damgası/yol üzerinden oluşturulmuş görüntü yapıtı çözümleme
- keşif raporu değerlendirmesi

Bunlar şimdilik açık özel işleyiciler kullanmalıdır.

Önerilen kural:

- %85-90 bildirime dayalı
- zor kalan bölüm için açık `customHandler` adımları
- yalnızca adlandırılmış ve belgelenmiş özel işleyiciler
- senaryo dosyasında anonim satır içi kod yok

Bu, yine de ilerlemeye izin verirken genel motoru temiz tutar.

## Mimari Değişikliği

### Geçerli

Senaryo Markdown'u zaten şu konular için doğruluk kaynağıdır:

- paket yürütmesi
- çalışma alanı önyükleme dosyaları
- QA Lab UI senaryo kataloğu
- rapor üst verileri
- keşif istemleri

Oluşturulmuş uyumluluk:

- tohumlanmış çalışma alanı hâlâ `QA_KICKOFF_TASK.md` içeriyor
- tohumlanmış çalışma alanı hâlâ `QA_SCENARIO_PLAN.md` içeriyor
- tohumlanmış çalışma alanı artık ayrıca `QA_SCENARIOS.md` içeriyor

## Yeniden Düzenleme Planı

### Faz 1: yükleyici ve şema

Tamamlandı.

- `qa/scenarios/index.md` eklendi
- senaryolar `qa/scenarios/<theme>/*.md` içine bölündü
- adlandırılmış Markdown YAML paket içeriği için ayrıştırıcı eklendi
- zod ile doğrulandı
- tüketiciler ayrıştırılmış pakete geçirildi
- depo düzeyindeki `qa/seed-scenarios.json` ve `qa/QA_KICKOFF_TASK.md` kaldırıldı

### Faz 2: genel motor

- `extensions/qa-lab/src/suite.ts` dosyasını şunlara böl:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- mevcut yardımcı fonksiyonları motor işlemleri olarak koru

Teslimat:

- motor basit bildirime dayalı senaryoları yürütür

Çoğunlukla istem + bekle + doğrula olan senaryolarla başlayın:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

Teslimat:

- ilk gerçek Markdown tanımlı senaryolar genel motor üzerinden yayımlanıyor

### Faz 4: orta zorluktaki senaryoları taşı

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

Teslimat:

- değişkenler, yapıtlar, araç doğrulamaları, request-log doğrulamaları kanıtlandı

### Faz 5: zor senaryoları özel işleyicilerde tut

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

Teslimat:

- aynı yazım biçimi, ancak gerektiğinde açık custom-step bloklarıyla

### Faz 6: sabit kodlanmış senaryo eşlemesini sil

Paket kapsamı yeterince iyi olduğunda:

- `extensions/qa-lab/src/suite.ts` içindeki senaryoya özgü TypeScript dallanmasının çoğunu kaldır

## Sahte Slack / Zengin Medya Desteği

Geçerli QA bus metin önceliklidir.

İlgili dosyalar:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Bugün QA bus şunları destekler:

- metin
- tepkiler
- ileti dizileri

Henüz satır içi medya eklerini modellemiyor.

### Gerekli taşıma sözleşmesi

Genel bir QA bus ek dosya modeli ekleyin:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Sonra `attachments?: QaBusAttachment[]` ekleyin:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Neden önce genel

Yalnızca Slack'e özgü bir medya modeli kurmayın.

Bunun yerine:

- tek bir genel QA taşıma modeli
- bunun üzerinde birden çok oluşturucu
  - geçerli QA Lab sohbeti
  - gelecekte sahte Slack web
  - diğer sahte taşıma görünümleri

Bu, yinelenen mantığı önler ve medya senaryolarının taşıma bağımsız kalmasını sağlar.

### Gerekli UI işi

QA UI'yi şunları oluşturacak şekilde güncelleyin:

- satır içi görüntü önizlemesi
- satır içi ses oynatıcı
- satır içi video oynatıcı
- dosya eki çipi

Geçerli UI zaten ileti dizilerini ve tepkileri oluşturabiliyor, bu yüzden ek dosya oluşturma aynı mesaj kartı modeli üzerine katmanlanmalıdır.

### Medya taşımasının etkinleştirdiği senaryo işi

Ek dosyalar QA bus üzerinden akmaya başladığında, daha zengin sahte sohbet senaryoları ekleyebiliriz:

- sahte Slack içinde satır içi görüntü yanıtı
- ses eki anlama
- video eki anlama
- karışık ek sıralaması
- medyayı koruyan ileti dizisi yanıtı

## Öneri

Bir sonraki uygulama parçası şu olmalı:

1. Markdown senaryo yükleyicisi + zod şeması ekle
2. Geçerli kataloğu Markdown'dan üret
3. Önce birkaç basit senaryoyu taşı
4. Genel QA bus ek dosya desteği ekle
5. QA UI'de satır içi görüntü oluştur
6. sonra ses ve videoya genişlet

Bu, her iki hedefi de kanıtlayan en küçük yoldur:

- genel Markdown tanımlı QA
- daha zengin sahte mesajlaşma yüzeyleri

## Açık Sorular

- senaryo dosyalarının değişken enterpolasyonlu gömülü Markdown istem şablonlarına izin verip vermemesi
- setup/cleanup'ın adlandırılmış bölümler mi yoksa yalnızca sıralı eylem listeleri mi olması gerektiği
- yapıt başvurularının şemada güçlü biçimde tiplenmiş mi yoksa dize tabanlı mı olması gerektiği
- özel işleyicilerin tek bir kayıt defterinde mi yoksa yüzey başına kayıt defterlerinde mi yaşaması gerektiği
- oluşturulan JSON uyumluluk dosyasının taşıma sırasında commit edilmiş olarak kalıp kalmaması gerektiği

## İlgili

- [QA E2E otomasyonu](/tr/concepts/qa-e2e-automation)
