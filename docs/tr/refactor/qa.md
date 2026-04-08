---
x-i18n:
    generated_at: "2026-04-08T06:01:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a9066b2a939c5a9ba69141d75405f0e8097997b523164340e2f0e9a0d5060dd
    source_path: refactor/qa.md
    workflow: 15
---

# QA Yeniden Düzenlemesi

Durum: temel geçiş tamamlandı.

## Hedef

OpenClaw QA'yı bölünmüş tanım modelinden tek bir doğruluk kaynağına taşımak:

- senaryo meta verileri
- modele gönderilen istemler
- kurulum ve temizleme
- harness mantığı
- doğrulamalar ve başarı ölçütleri
- artefaktlar ve rapor ipuçları

İstenen son durum, davranışın büyük bölümünü TypeScript içinde sabit kodlamak yerine güçlü senaryo tanım dosyalarını yükleyen genel bir QA harness'idir.

## Mevcut Durum

Birincil doğruluk kaynağı artık `qa/scenarios/index.md` ile `qa/scenarios/*.md`
altındaki her senaryo için bir dosyada bulunuyor.

Uygulananlar:

- `qa/scenarios/index.md`
  - kanonik QA paketi meta verileri
  - operatör kimliği
  - başlangıç görevi
- `qa/scenarios/*.md`
  - senaryo başına bir markdown dosyası
  - senaryo meta verileri
  - handler bağlamaları
  - senaryoya özgü yürütme yapılandırması
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown paketi ayrıştırıcısı + zod doğrulaması
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - markdown paketinden plan oluşturma
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - oluşturulan uyumluluk dosyaları ile `QA_SCENARIOS.md` üretimi
- `extensions/qa-lab/src/suite.ts`
  - çalıştırılabilir senaryoları markdown ile tanımlanmış handler bağlamaları üzerinden seçer
- QA bus protokolü + UI
  - görüntü/video/ses/dosya işleme için genel satır içi ekler

Kalan bölünmüş yüzeyler:

- `extensions/qa-lab/src/suite.ts`
  - hâlâ çalıştırılabilir özel handler mantığının çoğunu barındırıyor
- `extensions/qa-lab/src/report.ts`
  - hâlâ rapor yapısını çalışma zamanı çıktılarından türetiyor

Yani doğruluk kaynağı bölünmesi düzeltildi, ancak yürütme hâlâ çoğunlukla tam bildirimsel olmaktan ziyade handler destekli.

## Gerçek Senaryo Yüzeyi Nasıl Görünüyor

Mevcut suite okunduğunda birkaç farklı senaryo sınıfı görülüyor.

### Basit etkileşim

- kanal taban çizgisi
- DM taban çizgisi
- ileti dizili takip
- model değiştirme
- onay takibi
- tepki/düzenleme/silme

### Yapılandırma ve çalışma zamanı mutasyonu

- config patch skill devre dışı bırakma
- config apply yeniden başlatma uyandırması
- config yeniden başlatma yetenek çevirme
- çalışma zamanı envanter sapması denetimi

### Dosya sistemi ve repo doğrulamaları

- source/docs keşif raporu
- Lobster Invaders derleme
- oluşturulmuş görüntü artefaktı araması

### Bellek orkestrasyonu

- bellek geri çağırma
- kanal bağlamında bellek araçları
- bellek hata geri dönüşü
- oturum belleği sıralaması
- ileti dizisi belleği yalıtımı
- bellek dreaming sweep

### Araç ve plugin entegrasyonu

- MCP plugin-tools çağrısı
- skill görünürlüğü
- skill canlı kurulum
- yerel görüntü üretimi
- görüntü gidiş-dönüşü
- ekten görüntü anlama

### Çok turlu ve çok aktörlü

- subagent devri
- subagent fanout sentezi
- yeniden başlatma kurtarma tarzı akışlar

Bu kategoriler önemlidir çünkü DSL gereksinimlerini yönlendirirler. Düz bir istem + beklenen metin listesi yeterli değildir.

## Yön

### Tek doğruluk kaynağı

Yazılmış doğruluk kaynağı olarak `qa/scenarios/index.md` ile `qa/scenarios/*.md`
kullanılsın.

Paket şu özellikleri korumalı:

- incelemede insan tarafından okunabilir
- makine tarafından ayrıştırılabilir
- şunları yönlendirecek kadar zengin:
  - suite yürütmesi
  - QA workspace bootstrap
  - QA Lab UI meta verileri
  - docs/discovery istemleri
  - rapor üretimi

### Tercih edilen yazım biçimi

Üst düzey biçim olarak markdown kullanın, içinde yapılandırılmış YAML olsun.

Önerilen şekil:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider overrides
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
- yalnızca YAML'dan daha zengin bağlam
- sıkı ayrıştırma ve zod doğrulaması

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

Üretilen medyanın takip turunda yeniden eklenerek gönderildiğini doğrulayın.

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
    Görüntü üretimi denetimi: bir QA deniz feneri görüntüsü üret ve bunu tek kısa cümlede özetle.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Gidiş-dönüş görüntü inceleme denetimi: üretilen deniz feneri ekini tek kısa cümlede açıkla.
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

## DSL'nin Kapsaması Gereken Runner Yetenekleri

Mevcut suite'e göre, genel runner yalnızca istem yürütmeden fazlasına ihtiyaç duyuyor.

### Ortam ve kurulum eylemleri

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Agent turu eylemleri

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

### Dosya ve artefakt eylemleri

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

## Değişkenler ve Artefakt Başvuruları

DSL, kaydedilmiş çıktıları ve daha sonra yapılacak başvuruları desteklemelidir.

Mevcut suite'ten örnekler:

- bir ileti dizisi oluşturup sonra `threadId` yeniden kullanmak
- bir oturum oluşturup sonra `sessionKey` yeniden kullanmak
- bir görüntü üretip sonraki turda dosyayı eklemek
- bir uyandırma işaretçisi dizesi üretip bunun daha sonra göründüğünü doğrulamak

Gerekli yetenekler:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- yollar, oturum anahtarları, ileti dizisi kimlikleri, işaretçiler, araç çıktıları için türlenmiş başvurular

Değişken desteği olmadan harness, senaryo mantığını tekrar TypeScript'e sızdırmaya devam edecektir.

## Kaçış Kapıları Olarak Neler Kalmalı

Tamamen saf bildirimsel bir runner 1. aşamada gerçekçi değil.

Bazı senaryolar doğası gereği ağır orkestrasyon gerektirir:

- bellek dreaming sweep
- config apply yeniden başlatma uyandırması
- config yeniden başlatma yetenek çevirme
- zaman damgası/yol ile oluşturulmuş görüntü artefaktı çözümlemesi
- discovery-report değerlendirmesi

Bunlar şimdilik açık özel handler'lar kullanmalıdır.

Önerilen kural:

- %85-90 bildirimsel
- zor kalan bölüm için açık `customHandler` adımları
- yalnızca adlandırılmış ve belgelenmiş özel handler'lar
- senaryo dosyasında anonim satır içi kod yok

Bu, yine de ilerlemeye izin verirken genel motoru temiz tutar.

## Mimari Değişiklik

### Mevcut Durum

Senaryo markdown'u zaten şu alanlar için doğruluk kaynağıdır:

- suite yürütmesi
- workspace bootstrap dosyaları
- QA Lab UI senaryo kataloğu
- rapor meta verileri
- discovery istemleri

Üretilmiş uyumluluk:

- seed edilmiş workspace hâlâ `QA_KICKOFF_TASK.md` içeriyor
- seed edilmiş workspace hâlâ `QA_SCENARIO_PLAN.md` içeriyor
- seed edilmiş workspace artık ayrıca `QA_SCENARIOS.md` de içeriyor

## Yeniden Düzenleme Planı

### Aşama 1: yükleyici ve şema

Tamamlandı.

- `qa/scenarios/index.md` eklendi
- senaryolar `qa/scenarios/*.md` içine bölündü
- adlandırılmış markdown YAML paket içeriği için ayrıştırıcı eklendi
- zod ile doğrulandı
- tüketiciler ayrıştırılmış pakete geçirildi
- repo düzeyindeki `qa/seed-scenarios.json` ve `qa/QA_KICKOFF_TASK.md` kaldırıldı

### Aşama 2: genel motor

- `extensions/qa-lab/src/suite.ts` şu parçalara bölünecek:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- mevcut yardımcı işlevler motor işlemleri olarak korunacak

Teslimat:

- motor basit bildirimsel senaryoları yürütür

Çoğunlukla istem + bekleme + doğrulamadan oluşan senaryolarla başlayın:

- ileti dizili takip
- ekten görüntü anlama
- skill görünürlüğü ve çağrımı
- kanal taban çizgisi

Teslimat:

- ilk gerçek markdown tanımlı senaryoların genel motor üzerinden gönderimi

### Aşama 4: orta zorluktaki senaryoları taşıma

- görüntü üretimi gidiş-dönüşü
- kanal bağlamında bellek araçları
- oturum belleği sıralaması
- subagent devri
- subagent fanout sentezi

Teslimat:

- değişkenler, artefaktlar, araç doğrulamaları, request-log doğrulamalarının kanıtlanması

### Aşama 5: zor senaryoları özel handler'larda tutma

- bellek dreaming sweep
- config apply yeniden başlatma uyandırması
- config yeniden başlatma yetenek çevirme
- çalışma zamanı envanter sapması

Teslimat:

- aynı yazım biçimi, ancak gerektiğinde açık custom-step bloklarıyla

### Aşama 6: sabit kodlu senaryo eşlemesini silme

Paket kapsamı yeterince iyi olduğunda:

- `extensions/qa-lab/src/suite.ts` içindeki senaryoya özgü TypeScript dallanmasının büyük bölümünü kaldırın

## Sahte Slack / Zengin Medya Desteği

Mevcut QA bus öncelikle metin odaklıdır.

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

Genel bir QA bus eki modeli ekleyin:

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

Ardından `attachments?: QaBusAttachment[]` ekleyin:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Neden önce genel model

Yalnızca Slack'e özel bir medya modeli oluşturmayın.

Bunun yerine:

- tek bir genel QA taşıma modeli
- bunun üzerinde birden çok renderer
  - mevcut QA Lab sohbeti
  - gelecekteki sahte Slack web arayüzü
  - diğer sahte taşıma görünümleri

Bu, yinelenen mantığı önler ve medya senaryolarının taşımadan bağımsız kalmasını sağlar.

### Gerekli UI çalışması

QA UI'yi şu öğeleri işleyecek şekilde güncelleyin:

- satır içi görüntü önizlemesi
- satır içi ses oynatıcı
- satır içi video oynatıcı
- dosya eki chip'i

Mevcut UI zaten ileti dizilerini ve tepkileri işleyebiliyor, bu yüzden ek işleme aynı mesaj kartı modeli üzerine katmanlanabilmelidir.

### Medya taşımasıyla etkinleşen senaryo çalışması

Ekler QA bus üzerinden akmaya başladığında, daha zengin sahte sohbet senaryoları ekleyebiliriz:

- sahte Slack'te satır içi görüntü yanıtı
- ses eki anlama
- video eki anlama
- karışık ek sıralaması
- medyası korunmuş ileti dizisi yanıtı

## Öneri

Bir sonraki uygulama parçası şu olmalı:

1. markdown senaryo yükleyicisi + zod şeması ekle
2. mevcut kataloğu markdown'dan üret
3. önce birkaç basit senaryoyu taşı
4. genel QA bus ek desteği ekle
5. QA UI içinde satır içi görüntüyü işle
6. ardından ses ve videoya genişlet

Bu, her iki hedefi de kanıtlayan en küçük yoldur:

- genel markdown ile tanımlanmış QA
- daha zengin sahte mesajlaşma yüzeyleri

## Açık Sorular

- senaryo dosyalarının değişken interpolasyonlu gömülü markdown istem şablonlarına izin verip vermemesi
- setup/cleanup'ın adlandırılmış bölümler mi yoksa yalnızca sıralı eylem listeleri mi olması gerektiği
- artefakt başvurularının şemada güçlü türlenmiş mi yoksa dize tabanlı mı olması gerektiği
- özel handler'ların tek bir registry içinde mi yoksa surface başına registry'lerde mi yaşaması gerektiği
- oluşturulmuş JSON uyumluluk dosyasının geçiş sırasında checked in kalıp kalmaması gerektiği
