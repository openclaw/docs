---
x-i18n:
    generated_at: "2026-04-18T08:33:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbb2c70c82da7f6f12d90e25666635ff4147c52e8a94135e902d1de4f5cbccca
    source_path: refactor/qa.md
    workflow: 15
---

# QA Yeniden Düzenlemesi

Durum: temel geçiş tamamlandı.

## Hedef

OpenClaw QA'yı bölünmüş tanım modelinden tek bir doğruluk kaynağına taşımak:

- senaryo metadata'sı
- modele gönderilen istemler
- kurulum ve temizleme
- harness mantığı
- doğrulamalar ve başarı ölçütleri
- artifact'ler ve rapor ipuçları

Hedeflenen son durum, davranışın çoğunu TypeScript içinde sabit kodlamak yerine güçlü senaryo tanım dosyaları yükleyen genel bir QA harness'idir.

## Mevcut Durum

Birincil doğruluk kaynağı artık `qa/scenarios/index.md` ve her senaryo için
`qa/scenarios/<theme>/*.md` altındaki bir dosyadır.

Uygulananlar:

- `qa/scenarios/index.md`
  - kanonik QA paketi metadata'sı
  - operatör kimliği
  - başlangıç görevi
- `qa/scenarios/<theme>/*.md`
  - senaryo başına bir markdown dosyası
  - senaryo metadata'sı
  - handler bağlamaları
  - senaryoya özgü yürütme yapılandırması
- `extensions/qa-lab/src/scenario-catalog.ts`
  - markdown paket ayrıştırıcısı + zod doğrulaması
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - markdown paketinden plan oluşturma
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - oluşturulmuş uyumluluk dosyaları ile birlikte `QA_SCENARIOS.md` yerleştirir
- `extensions/qa-lab/src/suite.ts`
  - markdown ile tanımlanmış handler bağlamaları üzerinden yürütülebilir senaryoları seçer
- QA bus protokolü + UI
  - image/video/audio/file render etme için genel satır içi ekler

Kalan bölünmüş yüzeyler:

- `extensions/qa-lab/src/suite.ts`
  - hâlâ yürütülebilir özel handler mantığının çoğuna sahip
- `extensions/qa-lab/src/report.ts`
  - hâlâ rapor yapısını çalışma zamanı çıktılarından türetiyor

Yani doğruluk kaynağındaki ayrım düzeltildi, ancak yürütme hâlâ tamamen bildirimsel olmaktan çok çoğunlukla handler destekli.

## Gerçek Senaryo Yüzeyi Nasıl Görünüyor

Mevcut suite okunduğunda birkaç farklı senaryo sınıfı görülüyor.

### Basit etkileşim

- kanal temel çizgisi
- DM temel çizgisi
- iş parçacıklı takip
- model değiştirme
- onay tamamlama
- tepki/düzenleme/silme

### Yapılandırma ve çalışma zamanı değişikliği

- config patch skill devre dışı bırakma
- config apply restart wake-up
- config restart capability flip
- çalışma zamanı envanter sapma denetimi

### Dosya sistemi ve repo doğrulamaları

- source/docs discovery report
- build Lobster Invaders
- oluşturulmuş image artifact araması

### Bellek orkestrasyonu

- bellek geri çağırma
- kanal bağlamında bellek araçları
- bellek başarısızlık fallback'i
- oturum belleği sıralaması
- iş parçacığı belleği izolasyonu
- memory dreaming sweep

### Araç ve Plugin entegrasyonu

- MCP plugin-tools çağrısı
- skill görünürlüğü
- skill hot install
- yerel image oluşturma
- image roundtrip
- ekten image anlama

### Çok turlu ve çok aktörlü

- subagent handoff
- subagent fanout synthesis
- restart recovery tarzı akışlar

Bu kategoriler önemlidir çünkü DSL gereksinimlerini belirlerler. İstem + beklenen metinden oluşan düz bir liste yeterli değildir.

## Yön

### Tek doğruluk kaynağı

Yazılmış doğruluk kaynağı olarak `qa/scenarios/index.md` ile `qa/scenarios/<theme>/*.md` kullanılmalı.

Paket şu özellikleri korumalıdır:

- incelemede insan tarafından okunabilir olmalı
- makine tarafından ayrıştırılabilir olmalı
- şunları yönlendirecek kadar zengin olmalı:
  - suite yürütmesi
  - QA çalışma alanı önyüklemesi
  - QA Lab UI metadata'sı
  - docs/discovery istemleri
  - rapor oluşturma

### Tercih edilen yazım biçimi

Üst düzey biçim olarak markdown kullanın; içinde yapılandırılmış YAML olsun.

Önerilen şekil:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider geçersiz kılmaları
  - prerequisites
- düzyazı bölümleri
  - objective
  - notes
  - debugging hints
- fenced YAML blokları
  - setup
  - steps
  - assertions
  - cleanup

Bu şunları sağlar:

- devasa JSON'a göre daha iyi PR okunabilirliği
- saf YAML'dan daha zengin bağlam
- katı ayrıştırma ve zod doğrulaması

Ham JSON yalnızca ara, oluşturulmuş bir biçim olarak kabul edilebilir.

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

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

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

# Steps

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

# Expect

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

## Runner Yetenekleri DSL'in Kapsaması Gerekiyor

Mevcut suite'e göre genel runner, istem yürütmeden fazlasını gerektiriyor.

### Ortam ve kurulum eylemleri

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Ajan turu eylemleri

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

### Dosya ve artifact eylemleri

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Bellek ve Cron eylemleri

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

## Değişkenler ve Artifact Referansları

DSL, kaydedilen çıktıları ve daha sonra yapılan referansları desteklemelidir.

Mevcut suite'ten örnekler:

- bir iş parçacığı oluşturup sonra `threadId`'yi yeniden kullanmak
- bir oturum oluşturup sonra `sessionKey`'i yeniden kullanmak
- bir image oluşturup sonraki turda dosyayı eklemek
- bir wake marker dizesi oluşturup sonra bunun daha sonra göründüğünü doğrulamak

Gerekli yetenekler:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- yollar, oturum anahtarları, iş parçacığı kimlikleri, işaretleyiciler, araç çıktıları için türlendirilmiş referanslar

Değişken desteği olmadan harness, senaryo mantığını TypeScript'e geri sızdırmaya devam edecektir.

## Kaçış Kapıları Olarak Kalması Gerekenler

Tamamen saf bildirimsel bir runner 1. aşamada gerçekçi değildir.

Bazı senaryolar doğası gereği yoğun orkestrasyon gerektirir:

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- zaman damgası/yol ile oluşturulmuş image artifact çözümlemesi
- discovery-report değerlendirmesi

Bunlar şimdilik açık özel handler'lar kullanmalıdır.

Önerilen kural:

- %85-90 bildirimsel
- zor kalan kısım için açık `customHandler` adımları
- yalnızca adlandırılmış ve belgelenmiş özel handler'lar
- senaryo dosyasında adsız satır içi kod yok

Bu, ilerlemeye izin verirken genel motoru temiz tutar.

## Mimari Değişiklik

### Mevcut

Senaryo markdown'u zaten şu alanlar için doğruluk kaynağıdır:

- suite yürütmesi
- çalışma alanı önyükleme dosyaları
- QA Lab UI senaryo kataloğu
- rapor metadata'sı
- discovery istemleri

Oluşturulmuş uyumluluk:

- yerleştirilen çalışma alanı hâlâ `QA_KICKOFF_TASK.md` içeriyor
- yerleştirilen çalışma alanı hâlâ `QA_SCENARIO_PLAN.md` içeriyor
- yerleştirilen çalışma alanı artık ayrıca `QA_SCENARIOS.md` içeriyor

## Yeniden Düzenleme Planı

### Aşama 1: yükleyici ve şema

Tamamlandı.

- `qa/scenarios/index.md` eklendi
- senaryolar `qa/scenarios/<theme>/*.md` içine bölündü
- adlandırılmış markdown YAML paket içeriği için parser eklendi
- zod ile doğrulandı
- tüketiciler ayrıştırılmış pakete geçirildi
- repo düzeyindeki `qa/seed-scenarios.json` ve `qa/QA_KICKOFF_TASK.md` kaldırıldı

### Aşama 2: genel motor

- `extensions/qa-lab/src/suite.ts` şu parçalara bölünsün:
  - loader
  - engine
  - action registry
  - assertion registry
  - custom handlers
- mevcut yardımcı işlevler engine işlemleri olarak korunsun

Teslimat:

- motor, basit bildirimsel senaryoları yürütür

Çoğunlukla istem + bekle + doğrula olan senaryolarla başlayın:

- iş parçacıklı takip
- ekten image anlama
- skill görünürlüğü ve çağrısı
- kanal temel çizgisi

Teslimat:

- ilk gerçek markdown tanımlı senaryolar genel motor üzerinden gönderiliyor

### Aşama 4: orta zorluktaki senaryoları taşıma

- image generation roundtrip
- kanal bağlamında bellek araçları
- oturum belleği sıralaması
- subagent handoff
- subagent fanout synthesis

Teslimat:

- değişkenler, artifact'ler, araç doğrulamaları, request-log doğrulamaları kanıtlandı

### Aşama 5: zor senaryoları özel handler'larda tutma

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- çalışma zamanı envanter sapması

Teslimat:

- aynı yazım biçimi, ancak gerektiğinde açık custom-step bloklarıyla

### Aşama 6: sabit kodlanmış senaryo haritasını silme

Paket kapsamı yeterince iyi olduğunda:

- `extensions/qa-lab/src/suite.ts` içindeki senaryoya özgü TypeScript dallanmasının çoğunu kaldırın

## Sahte Slack / Zengin Medya Desteği

Mevcut QA bus öncelikle metin odaklıdır.

İlgili dosyalar:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Bugün QA bus şunları destekliyor:

- metin
- tepkiler
- iş parçacıkları

Henüz satır içi medya eklerini modellemiyor.

### Gerekli taşıma sözleşmesi

Genel bir QA bus ek modeli ekleyin:

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

Ardından şuralara `attachments?: QaBusAttachment[]` ekleyin:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Önce neden genel

Yalnızca Slack'e özel bir medya modeli oluşturmayın.

Bunun yerine:

- tek bir genel QA taşıma modeli
- bunun üstünde birden fazla renderer
  - mevcut QA Lab sohbeti
  - gelecekteki sahte Slack web'i
  - diğer sahte taşıma görünümleri

Bu, yinelenen mantığı önler ve medya senaryolarının taşımadan bağımsız kalmasını sağlar.

### Gerekli UI çalışması

QA UI'yi şu öğeleri render edecek şekilde güncelleyin:

- satır içi image önizlemesi
- satır içi audio oynatıcı
- satır içi video oynatıcı
- dosya eki chip'i

Mevcut UI zaten iş parçacıklarını ve tepkileri render edebiliyor, bu nedenle ek render etme aynı mesaj kartı modelinin üstüne katmanlanmalıdır.

### Medya taşımasıyla etkinleşen senaryo çalışması

Ekler QA bus üzerinden akmaya başladığında daha zengin sahte sohbet senaryoları ekleyebiliriz:

- sahte Slack'te satır içi image yanıtı
- audio eki anlama
- video eki anlama
- karışık ek sıralaması
- medya korunmuş şekilde iş parçacığı yanıtı

## Öneri

Bir sonraki uygulama parçası şu olmalıdır:

1. markdown senaryo yükleyicisi + zod şeması ekleyin
2. mevcut kataloğu markdown'dan oluşturun
3. önce birkaç basit senaryoyu taşıyın
4. genel QA bus ek desteği ekleyin
5. QA UI'de satır içi image render edin
6. ardından audio ve video'ya genişletin

Bu, her iki hedefi de kanıtlayan en küçük yoldur:

- markdown ile tanımlanmış genel QA
- daha zengin sahte mesajlaşma yüzeyleri

## Açık Sorular

- senaryo dosyalarının değişken enterpolasyonu içeren gömülü markdown istem şablonlarına izin verip vermemesi gerektiği
- kurulum/temizleme bölümlerinin adlandırılmış bölümler mi yoksa yalnızca sıralı eylem listeleri mi olması gerektiği
- artifact referanslarının şemada güçlü türlendirilmiş mi yoksa dize tabanlı mı olması gerektiği
- özel handler'ların tek bir registry içinde mi yoksa surface başına registry'lerde mi bulunması gerektiği
- oluşturulan JSON uyumluluk dosyasının geçiş sırasında commit edilmiş olarak kalıp kalmaması gerektiği
