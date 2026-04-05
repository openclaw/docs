---
read_when:
    - Gerçek OpenClaw kullanım örnekleri arıyorsunuz
    - Topluluk proje öne çıkanlarını güncelliyorsunuz
summary: OpenClaw tarafından desteklenen, topluluk tarafından oluşturulmuş projeler ve entegrasyonlar
title: Vitrin
x-i18n:
    generated_at: "2026-04-05T14:10:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2917e9a476ef527ddb3e51c610bbafbd145e705c9cc29f191639fb63d238ef70
    source_path: start/showcase.md
    workflow: 15
---

# Vitrin

Topluluktan gerçek projeler. İnsanların OpenClaw ile neler yaptığını görün.

<Info>
**Öne çıkarılmak mı istiyorsunuz?** Projenizi [Discord'daki #self-promotion kanalında](https://discord.gg/clawd) paylaşın veya [X'te @openclaw etiketini kullanın](https://x.com/openclaw).
</Info>

## 🎥 OpenClaw İş Başında

VelvetShark tarafından hazırlanan tam kurulum rehberi (28 dk).

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
    title="OpenClaw: Siri'nin olması gereken kendi kendine barındırılan yapay zeka (Tam kurulum)"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[YouTube'da izle](https://www.youtube.com/watch?v=SaWSPZoPX34)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
    title="OpenClaw vitrin videosu"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[YouTube'da izle](https://www.youtube.com/watch?v=mMSKQvlmFuQ)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
    title="OpenClaw topluluk vitrini"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[YouTube'da izle](https://www.youtube.com/watch?v=5kkIJNUGFho)

## 🆕 Discord'dan taze örnekler

<CardGroup cols={2}>

<Card title="PR İncelemesi → Telegram Geri Bildirimi" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode değişikliği tamamlar → bir PR açar → OpenClaw farkı inceler ve Telegram'da “küçük öneriler” ile birlikte net bir birleştirme kararıyla yanıt verir (önce uygulanması gereken kritik düzeltmeler dahil).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegram'da iletilen OpenClaw PR inceleme geri bildirimi" />
</Card>

<Card title="Dakikalar İçinde Şarap Mahzeni Skill'i" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Yerel bir şarap mahzeni skill'i için “Robby”ye (@openclaw) soruldu. Örnek bir CSV dışa aktarımı ve bunun nereye kaydedileceğini istiyor, ardından skill'i hızlıca oluşturup test ediyor (örnekte 962 şişe).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw'ın CSV'den yerel bir şarap mahzeni skill'i oluşturması" />
</Card>

<Card title="Tesco Alışveriş Otopilotu" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Haftalık yemek planı → düzenli ürünler → teslimat zaman aralığı ayırtma → siparişi onaylama. API yok, sadece tarayıcı kontrolü.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Sohbet üzerinden Tesco alışveriş otomasyonu" />
</Card>

<Card title="SNAG Ekran Görüntüsünden Markdown'a" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Bir ekran bölgesine kısayol atayın → Gemini vision → panonuza anında Markdown.

  <img src="/assets/showcase/snag.png" alt="SNAG ekran görüntüsünden markdown'a aracı" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex ve OpenClaw genelinde skills/komutları yönetmek için masaüstü uygulaması.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI uygulaması" />
</Card>

<Card title="Telegram Sesli Notları (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTS'yi sarar ve sonuçları Telegram sesli notları olarak gönderir (can sıkıcı otomatik oynatma yok).

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS'den Telegram sesli not çıktısı" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Yerel OpenAI Codex oturumlarını listelemek/incelemek/izlemek için Homebrew ile kurulan yardımcı araç (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub üzerinde CodexMonitor" />
</Card>

<Card title="Bambu 3D Yazıcı Kontrolü" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab yazıcıları denetleyin ve sorun giderin: durum, işler, kamera, AMS, kalibrasyon ve daha fazlası.

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub üzerinde Bambu CLI skill'i" />
</Card>

<Card title="Viyana Ulaşımı (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Viyana'nın toplu taşıması için gerçek zamanlı kalkışlar, kesintiler, asansör durumu ve yönlendirme.

  <img src="/assets/showcase/wienerlinien.png" alt="ClawHub üzerinde Wiener Linien skill'i" />
</Card>

<Card title="ParentPay Okul Yemekleri" icon="utensils" href="#">
  **@George5562** • `automation` `browser` `parenting`

ParentPay üzerinden Birleşik Krallık okul yemeği rezervasyonunu otomatikleştirir. Güvenilir tablo hücresi tıklaması için fare koordinatlarını kullanır.
</Card>

<Card title="R2 Yükleme (Dosyalarımı Bana Gönder)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3'e yükleyin ve güvenli ön imzalı indirme bağlantıları oluşturun. Uzak OpenClaw örnekleri için mükemmeldir.
</Card>

<Card title="Telegram ile iOS Uygulaması" icon="mobile" href="#">
  **@coard** • `ios` `xcode` `testflight`

Haritalar ve ses kaydı içeren tam bir iOS uygulaması oluşturdu, tamamen Telegram sohbeti üzerinden TestFlight'a dağıttı.

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight üzerindeki iOS uygulaması" />
</Card>

<Card title="Oura Ring Sağlık Asistanı" icon="heart-pulse" href="#">
  **@AS** • `health` `oura` `calendar`

Oura ring verilerini takvim, randevular ve spor salonu programıyla birleştiren kişisel yapay zeka sağlık asistanı.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring sağlık asistanı" />
</Card>
<Card title="Kev'in Dream Team'i (14+ Aracı)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

Tek bir gateway altında 14+ aracı; Opus 4.5 orkestratörü görevleri Codex çalışanlarına devrediyor. Dream Team kadrosunu, model seçimini, korumalı alanı, web kancalarını, heartbeats'i ve devir akışlarını kapsayan kapsamlı [teknik yazı](https://github.com/adam91holt/orchestrated-ai-articles). Aracı korumalı alanı için [Clawdspace](https://github.com/adam91holt/clawdspace). [Blog yazısı](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

Aracılı iş akışlarıyla (Claude Code, OpenClaw) bütünleşen Linear için CLI. Sorunları, projeleri ve iş akışlarını terminalden yönetin. İlk harici PR birleştirildi!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Beeper Desktop üzerinden mesajları okuyun, gönderin ve arşivleyin. Beeper yerel MCP API'sini kullanır; böylece aracılar tüm sohbetlerinizi (iMessage, WhatsApp vb.) tek bir yerden yönetebilir.
</Card>

</CardGroup>

## 🤖 Otomasyon ve İş Akışları

<CardGroup cols={2}>

<Card title="Winix Hava Temizleyici Kontrolü" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code temizleyici denetimlerini keşfedip doğruladı, ardından OpenClaw oda hava kalitesini yönetmek için devralıyor.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw üzerinden Winix hava temizleyici kontrolü" />
</Card>

<Card title="Güzel Gökyüzü Kamera Çekimleri" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Bir çatı kamerası tarafından tetiklenir: gökyüzü güzel göründüğünde OpenClaw'dan bir fotoğraf çekmesini isteyin — bir skill tasarladı ve çekimi yaptı.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw tarafından yakalanan çatı kamerası gökyüzü görüntüsü" />
</Card>

<Card title="Görsel Sabah Brifingi Sahnesi" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Zamanlanmış bir istem, her sabah bir OpenClaw personası aracılığıyla tek bir “sahne” görseli oluşturur (hava durumu, görevler, tarih, favori gönderi/alıntı).
</Card>

<Card title="Padel Kort Rezervasyonu" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Playtomic uygunluk denetleyicisi + rezervasyon CLI'si. Bir daha asla boş bir kortu kaçırmayın.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli ekran görüntüsü" />
</Card>

<Card title="Muhasebe Girdisi" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`
  
  PDF'leri e-postadan toplar, belgeleri vergi danışmanı için hazırlar. Aylık muhasebe otopilotta.
</Card>

<Card title="Kanepeden Geliştirme Modu" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Tüm kişisel sitesini Telegram üzerinden, Netflix izlerken yeniden oluşturdu — Notion → Astro, 18 yazı taşındı, DNS Cloudflare'a geçirildi. Hiç dizüstü bilgisayar açmadı.
</Card>

<Card title="İş Arama Aracısı" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

İş ilanlarını arar, CV anahtar sözcükleriyle eşleştirir ve ilgili fırsatları bağlantılarla birlikte döndürür. JSearch API kullanılarak 30 dakikada oluşturuldu.
</Card>

<Card title="Jira Skill Oluşturucu" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw Jira'ya bağlandı, ardından yeni bir skill'i anında üretti (ClawHub'da bulunmadan önce).
</Card>

<Card title="Telegram ile Todoist Skill'i" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Todoist görevlerini otomatikleştirdi ve OpenClaw'ın skill'i doğrudan Telegram sohbetinde üretmesini sağladı.
</Card>

<Card title="TradingView Analizi" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Tarayıcı otomasyonu ile TradingView'a giriş yapar, grafiklerin ekran görüntülerini alır ve istek üzerine teknik analiz gerçekleştirir. API gerekmez—yalnızca tarayıcı kontrolü yeterlidir.
</Card>

<Card title="Slack Otomatik Destek" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Şirket Slack kanalını izler, faydalı yanıtlar verir ve bildirimleri Telegram'a iletir. İstenmeden dağıtıma alınmış bir uygulamadaki üretim hatasını otonom olarak düzeltti.
</Card>

</CardGroup>

## 🧠 Bilgi ve Bellek

<CardGroup cols={2}>

<Card title="xuezh Çince Öğrenme" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  OpenClaw üzerinden telaffuz geri bildirimi ve çalışma akışları sunan Çince öğrenme altyapısı.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh telaffuz geri bildirimi" />
</Card>

<Card title="WhatsApp Bellek Kasası" icon="vault">
  **Community** • `memory` `transcription` `indexing`
  
  Tam WhatsApp dışa aktarımlarını alır, 1 binden fazla sesli notu yazıya döker, git günlükleriyle çapraz kontrol eder ve bağlantılı markdown raporları üretir.
</Card>

<Card title="Karakeep Anlamsal Arama" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Qdrant + OpenAI/Ollama embedding'lerini kullanarak Karakeep yer imlerine vektör araması ekler.
</Card>

<Card title="Inside-Out-2 Belleği" icon="brain">
  **Community** • `memory` `beliefs` `self-model`
  
  Oturum dosyalarını anılara → inançlara → gelişen benlik modeline dönüştüren ayrı bir bellek yöneticisi.
</Card>

</CardGroup>

## 🎙️ Ses ve Telefon

<CardGroup cols={2}>

<Card title="Clawdia Telefon Köprüsü" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Vapi sesli asistanı ↔ OpenClaw HTTP köprüsü. Aracınızla neredeyse gerçek zamanlı telefon görüşmeleri.
</Card>

<Card title="OpenRouter Transkripsiyonu" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter üzerinden çok dilli ses transkripsiyonu (Gemini vb.). ClawHub'da mevcuttur.
</Card>

</CardGroup>

## 🏗️ Altyapı ve Dağıtım

<CardGroup cols={2}>

<Card title="Home Assistant Eklentisi" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  SSH tüneli desteği ve kalıcı durum ile Home Assistant OS üzerinde çalışan OpenClaw gateway'i.
</Card>

<Card title="Home Assistant Skill'i" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Home Assistant cihazlarını doğal dil ile kontrol edin ve otomatikleştirin.
</Card>

<Card title="Nix Paketleme" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  Yeniden üretilebilir dağıtımlar için her şeyi içeren nix tabanlı OpenClaw yapılandırması.
</Card>

<Card title="CalDAV Takvimi" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  khal/vdirsyncer kullanan takvim skill'i. Kendi kendine barındırılan takvim entegrasyonu.
</Card>

</CardGroup>

## 🏠 Ev ve Donanım

<CardGroup cols={2}>

<Card title="GoHome Otomasyonu" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Arayüz olarak OpenClaw kullanan, ayrıca güzel Grafana panoları sunan Nix tabanlı ev otomasyonu.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana panosu" />
</Card>

<Card title="Roborock Süpürge" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Roborock robot süpürgenizi doğal konuşma yoluyla kontrol edin.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock durumu" />
</Card>

</CardGroup>

## 🌟 Topluluk Projeleri

<CardGroup cols={2}>

<Card title="StarSwap Marketplace" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`
  
  Tam kapsamlı astronomi ekipmanı pazaryeri. OpenClaw ekosistemi ile/çevresinde oluşturuldu.
</Card>

</CardGroup>

---

## Projenizi Gönderin

Paylaşacak bir şeyiniz mi var? Sizi öne çıkarmaktan memnuniyet duyarız!

<Steps>
  <Step title="Paylaşın">
    [Discord'daki #self-promotion kanalında](https://discord.gg/clawd) paylaşın veya [X'te @openclaw'a tweet atın](https://x.com/openclaw)
  </Step>
  <Step title="Ayrıntıları Ekleyin">
    Ne yaptığını anlatın, depo/demo bağlantısını verin, varsa bir ekran görüntüsü paylaşın
  </Step>
  <Step title="Öne Çıkın">
    Dikkat çeken projeleri bu sayfaya ekleyeceğiz
  </Step>
</Steps>
