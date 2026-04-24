---
description: Real-world OpenClaw projects from the community
read_when:
    - Gerçek OpenClaw kullanım örnekleri arıyorsunuz
    - Topluluk proje öne çıkanlarını güncelleme
summary: OpenClaw destekli topluluk yapımı projeler ve entegrasyonlar
title: Vitrin
x-i18n:
    generated_at: "2026-04-24T09:32:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
    source_path: start/showcase.md
    workflow: 15
---

OpenClaw projeleri oyuncak demolar değildir. İnsanlar zaten kullandıkları kanallardan PR inceleme döngüleri, mobil uygulamalar, ev otomasyonu, ses sistemleri, geliştirme araçları ve bellek ağırlıklı iş akışları yayımlıyor — Telegram, WhatsApp, Discord ve terminaller üzerinde sohbet yerelli yapılar; bir API beklemeden rezervasyon, alışveriş ve destek için gerçek otomasyon; ve yazıcılar, robot süpürgeler, kameralar ve ev sistemleriyle fiziksel dünya entegrasyonları.

<Info>
**Öne çıkmak mı istiyorsunuz?** Projenizi [Discord'daki #self-promotion kanalında](https://discord.gg/clawd) paylaşın veya [X'te @openclaw etiketleyin](https://x.com/openclaw).
</Info>

## Videolar

"Bu nedir?" sorusundan "tamam, anladım" noktasına en kısa yolu istiyorsanız buradan başlayın.

<CardGroup cols={3}>

<Card title="Tam kurulum anlatımı" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 dakika. Kurulum, onboarding ve uçtan uca ilk çalışan asistana ulaşma.
</Card>

<Card title="Topluluk vitrin derlemesi" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  OpenClaw etrafında kurulmuş gerçek projeler, yüzeyler ve iş akışları üzerinde daha hızlı bir geçiş.
</Card>

<Card title="Doğadaki projeler" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  Topluluktan örnekler: sohbet yerelli kodlama döngülerinden donanıma ve kişisel otomasyona kadar.
</Card>

</CardGroup>

## Discord'dan taze

Kodlama, geliştirme araçları, mobil ve sohbet yerelli ürün geliştirme alanlarındaki son öne çıkanlar.

<CardGroup cols={2}>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode değişikliği tamamlıyor, bir PR açıyor, OpenClaw diff'i inceliyor ve Telegram'da önerilerle birlikte net bir birleştirme kararıyla yanıt veriyor.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR inceleme geri bildirimi Telegram'da teslim edildi" />
</Card>

<Card title="Dakikalar içinde Wine Cellar Skill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

"Robby"den (@openclaw) yerel bir şarap mahzeni Skill'i istedi. Bir örnek CSV dışa aktarımı ve depolama yolu istiyor, sonra Skill'i oluşturup test ediyor (örnekte 962 şişe).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw'ın CSV'den yerel bir şarap mahzeni Skill'i oluşturması" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Haftalık yemek planı, düzenli ürünler, teslimat aralığını ayırt, siparişi onayla. API yok, sadece tarayıcı denetimi.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Sohbet üzerinden Tesco alışveriş otomasyonu" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Ekranın bir bölgesini kısayolla seç, Gemini vision ile işle, anında panonda Markdown olsun.

  <img src="/assets/showcase/snag.png" alt="SNAG ekran görüntüsünden Markdown aracına" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex ve OpenClaw genelinde Skills ve komutları yönetmek için masaüstü uygulaması.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI uygulaması" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Topluluk** • `voice` `tts` `telegram`

papla.media TTS'yi sarar ve sonuçları Telegram sesli notları olarak gönderir (sinir bozucu otomatik oynatma yok).

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS'den Telegram sesli not çıktısı" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Yerel OpenAI Codex oturumlarını listelemek, incelemek ve izlemek için Homebrew ile kurulan yardımcı araç (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub üzerinde CodexMonitor" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab yazıcılarını denetleyin ve sorun giderin: durum, işler, kamera, AMS, kalibrasyon ve daha fazlası.

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub üzerinde Bambu CLI Skill'i" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Viyana toplu taşıması için gerçek zamanlı kalkışlar, aksaklıklar, asansör durumu ve yönlendirme.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien Skill'i" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay üzerinden Birleşik Krallık okul yemeği rezervasyonunu otomatikleştirdi. Güvenilir tablo hücresi tıklaması için fare koordinatları kullanıyor.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3'e yükleyin ve güvenli presigned indirme bağlantıları üretin. Uzak OpenClaw örnekleri için kullanışlıdır.
</Card>

<Card title="Telegram üzerinden iOS uygulaması" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Haritalar ve ses kaydı içeren tam bir iOS uygulamasını tamamen Telegram sohbeti üzerinden geliştirdi ve TestFlight'a dağıttı.

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight üzerinde iOS uygulaması" />
</Card>

<Card title="Oura Ring sağlık asistanı" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura Ring verilerini takvim, randevular ve spor salonu programıyla bütünleştiren kişisel AI sağlık asistanı.

  <img src="/assets/showcase/oura-health.png" alt="Oura Ring sağlık asistanı" />
</Card>

<Card title="Kev's Dream Team (14+ agent)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Bir Opus 4.5 orkestratörünün Codex worker'lara görev devrettiği tek bir Gateway altında 14+ agent. [Teknik yazıya](https://github.com/adam91holt/orchestrated-ai-articles) ve agent sandboxing için [Clawdspace](https://github.com/adam91holt/clawdspace) deposuna bakın.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

Agentic iş akışlarıyla (Claude Code, OpenClaw) bütünleşen Linear için CLI. Issue'ları, projeleri ve iş akışlarını terminalden yönetin.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop üzerinden mesajları okuyun, gönderin ve arşivleyin. Beeper local MCP API kullanır; böylece agent'ler tüm sohbetlerinizi (iMessage, WhatsApp ve daha fazlası) tek yerden yönetebilir.
</Card>

</CardGroup>

## Otomasyon ve iş akışları

Zamanlama, tarayıcı denetimi, destek döngüleri ve ürünün "görevi benim için yap" tarafı.

<CardGroup cols={2}>

<Card title="Winix hava temizleyici denetimi" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code hava temizleyici denetimlerini keşfedip doğruladı, ardından OpenClaw oda hava kalitesini yönetmek için devralıyor.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw üzerinden Winix hava temizleyici denetimi" />
</Card>

<Card title="Güzel gökyüzü kamera çekimleri" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Çatı kamerası tarafından tetikleniyor: gökyüzü güzel göründüğünde OpenClaw'dan bir gökyüzü fotoğrafı çekmesini istiyor. Bir Skill tasarladı ve çekimi yaptı.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw tarafından çekilen çatı kamerası gökyüzü görüntüsü" />
</Card>

<Card title="Görsel sabah brifingi sahnesi" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Zamanlanmış bir prompt, her sabah bir OpenClaw kişiliği üzerinden tek bir sahne görüntüsü üretir (hava durumu, görevler, tarih, favori gönderi veya alıntı).
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic müsaitlik denetleyicisi ve rezervasyon CLI'si. Bir daha asla boş sahayı kaçırmayın.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli ekran görüntüsü" />
</Card>

<Card title="Muhasebe alımı" icon="file-invoice-dollar">
  **Topluluk** • `automation` `email` `pdf`

E-postadan PDF toplar, belgeleri vergi danışmanı için hazırlar. Aylık muhasebe otomatik pilotta.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Tüm kişisel sitesini Telegram üzerinden, Netflix izlerken yeniden kurdu — Notion'dan Astro'ya, 18 yazı taşındı, DNS Cloudflare'a geçirildi. Hiç dizüstü açmadı.
</Card>

<Card title="İş arama agent'i" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

İş ilanlarını arar, CV anahtar sözcükleriyle eşleştirir ve ilgili fırsatları bağlantılarla döndürür. JSearch API kullanılarak 30 dakikada oluşturuldu.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw Jira'ya bağlandı, ardından yeni bir Skill'i anında üretti (ClawHub'da var olmadan önce).
</Card>

<Card title="Telegram üzerinden Todoist skill" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist görevlerini otomatikleştirdi ve OpenClaw'a Skill'i doğrudan Telegram sohbetinde oluşturttu.
</Card>

<Card title="TradingView analizi" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Tarayıcı otomasyonu üzerinden TradingView'a giriş yapar, grafik ekran görüntüleri alır ve istek üzerine teknik analiz yapar. API gerekmez — sadece tarayıcı denetimi.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Bir şirket Slack kanalını izler, yardımcı şekilde yanıt verir ve bildirimleri Telegram'a iletir. Kendisine sorulmadan dağıtımdaki bir uygulamada üretim hatasını otonom biçimde düzeltti.
</Card>

</CardGroup>

## Bilgi ve bellek

Kişisel veya ekip bilgisini indeksleyen, arayan, hatırlayan ve onun üzerinde akıl yürüten sistemler.

<CardGroup cols={2}>

<Card title="xuezh Çince öğrenme" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw üzerinden telaffuz geri bildirimi ve çalışma akışları sunan Çince öğrenme motoru.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh telaffuz geri bildirimi" />
</Card>

<Card title="WhatsApp bellek kasası" icon="vault">
  **Topluluk** • `memory` `transcription` `indexing`

Tam WhatsApp dışa aktarımlarını alır, 1k+ sesli notu yazıya döker, git günlükleriyle çapraz kontrol eder ve bağlantılı markdown raporları üretir.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant ve OpenAI veya Ollama embedding'lerini kullanarak Karakeep yer imlerine vektör araması ekler.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Topluluk** • `memory` `beliefs` `self-model`

Oturum dosyalarını anılara, sonra inançlara, sonra gelişen bir benlik modeline dönüştüren ayrı bir bellek yöneticisi.
</Card>

</CardGroup>

## Ses ve telefon

Konuşma öncelikli giriş noktaları, telefon köprüleri ve yazıya döküm ağırlıklı iş akışları.

<CardGroup cols={2}>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi sesli asistanından OpenClaw HTTP köprüsüne. Agent'inizle neredeyse gerçek zamanlı telefon görüşmeleri.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Çok dilli ses yazıya dökümü OpenRouter üzerinden (Gemini ve daha fazlası). ClawHub'da mevcut.
</Card>

</CardGroup>

## Altyapı ve dağıtım

OpenClaw'ı çalıştırmayı ve genişletmeyi kolaylaştıran paketleme, dağıtım ve entegrasyonlar.

<CardGroup cols={2}>

<Card title="Home Assistant eklentisi" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSH tüneli desteği ve kalıcı durum ile Home Assistant OS üzerinde çalışan OpenClaw Gateway.
</Card>

<Card title="Home Assistant Skill'i" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

Home Assistant cihazlarını doğal dille denetleyin ve otomatikleştirin.
</Card>

<Card title="Nix paketleme" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Yeniden üretilebilir dağıtımlar için pilleri dahil nix'lenmiş OpenClaw yapılandırması.
</Card>

<Card title="CalDAV takvimi" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

khal ve vdirsyncer kullanan takvim Skill'i. Self-hosted takvim entegrasyonu.
</Card>

</CardGroup>

## Ev ve donanım

OpenClaw'ın fiziksel dünya tarafı: evler, sensörler, kameralar, robot süpürgeler ve diğer cihazlar.

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Arayüz olarak OpenClaw kullanan, Nix tabanlı ev otomasyonu ve ayrıca Grafana panoları.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana panosu" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Roborock robot süpürgenizi doğal konuşma üzerinden denetleyin.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock durumu" />
</Card>

</CardGroup>

## Topluluk projeleri

Tek bir iş akışının ötesine geçip daha geniş ürünlere veya ekosistemlere dönüşen şeyler.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Topluluk** • `marketplace` `astronomy` `webapp`

Tam teşekküllü astronomi ekipmanı pazaryeri. OpenClaw ekosistemiyle ve onun etrafında oluşturuldu.
</Card>

</CardGroup>

## Projenizi gönderin

<Steps>
  <Step title="Paylaşın">
    [Discord'daki #self-promotion kanalında](https://discord.gg/clawd) paylaşın veya [@openclaw etiketleyerek tweet atın](https://x.com/openclaw).
  </Step>
  <Step title="Ayrıntıları ekleyin">
    Ne yaptığını anlatın, repo veya demo bağlantısını ekleyin ve varsa bir ekran görüntüsü paylaşın.
  </Step>
  <Step title="Öne çıkın">
    Öne çıkan projeleri bu sayfaya ekleyeceğiz.
  </Step>
</Steps>

## İlgili

- [Getting started](/tr/start/getting-started)
- [OpenClaw](/tr/start/openclaw)
