---
description: Real-world OpenClaw projects from the community
read_when:
    - Gerçek OpenClaw kullanım örnekleri arama
    - Topluluk projesi öne çıkanlarını güncelleme
summary: OpenClaw tarafından desteklenen topluluk yapımı projeler ve entegrasyonlar
title: Vitrin
x-i18n:
    generated_at: "2026-06-28T01:19:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw projeleri oyuncak demolar değildir. İnsanlar, hâlihazırda kullandıkları kanallardan PR inceleme döngüleri, mobil uygulamalar, ev otomasyonu, ses sistemleri, devtools ve yoğun bellek kullanan iş akışları yayımlıyor: Telegram, WhatsApp, Discord ve terminaller üzerinde sohbet-yerel derlemeler; API beklemeden rezervasyon, alışveriş ve destek için gerçek otomasyon; yazıcılar, süpürgeler, kameralar ve ev sistemleriyle fiziksel dünya entegrasyonları.

<Info>
**Öne çıkarılmak mı istiyorsunuz?** Projenizi [Discord'da #self-promotion](https://discord.gg/clawd) kanalında paylaşın veya [X'te @openclaw etiketleyin](https://x.com/openclaw).
</Info>

## Discord'dan taze

Kodlama, devtools, mobil ve sohbet-yerel ürün geliştirme genelinde son dönemin öne çıkanları.

<CardGroup cols={2}>

<Card title="PR İncelemesinden Telegram Geri Bildirimine" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode değişikliği bitirir, bir PR açar, OpenClaw diff'i inceler ve Telegram'da önerilerle birlikte net bir merge kararıyla yanıt verir.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegram'da iletilen OpenClaw PR inceleme geri bildirimi" />
</Card>

<Card title="Dakikalar İçinde Şarap Mahzeni Skill'i" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

"Robby"den (@openclaw) yerel bir şarap mahzeni skill'i istedi. Örnek bir CSV dışa aktarımı ve bir depolama yolu ister, ardından skill'i oluşturup test eder (örnekte 962 şişe).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw'ın CSV'den yerel bir şarap mahzeni skill'i oluşturması" />
</Card>

<Card title="Tesco Alışveriş Otopilotu" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Haftalık yemek planı, düzenli alınanlar, teslimat aralığı ayırma, siparişi onaylama. API yok, yalnızca tarayıcı kontrolü.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Sohbet üzerinden Tesco alışveriş otomasyonu" />
</Card>

<Card title="SNAG ekran görüntüsünden Markdown'a" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Bir ekran bölgesine kısayol tuşu, Gemini görüntü işleme, panonuzda anında Markdown.

  <img src="/assets/showcase/snag.png" alt="SNAG ekran görüntüsünden markdown'a aracı" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex ve OpenClaw genelinde Skills ve komutları yönetmek için masaüstü uygulaması.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI uygulaması" />
</Card>

<Card title="Telegram sesli notları (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTS'yi sarmalar ve sonuçları Telegram sesli notları olarak gönderir (rahatsız edici otomatik oynatma yok).

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS'den Telegram sesli not çıktısı" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Yerel OpenAI Codex oturumlarını listelemek, incelemek ve izlemek için Homebrew ile kurulan yardımcı (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub'da CodexMonitor" />
</Card>

<Card title="Bambu 3D Yazıcı Kontrolü" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab yazıcılarını kontrol edin ve sorun giderin: durum, işler, kamera, AMS, kalibrasyon ve daha fazlası.

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub'da Bambu CLI skill'i" />
</Card>

<Card title="Viyana ulaşımı (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Viyana toplu ulaşımı için gerçek zamanlı kalkışlar, aksaklıklar, asansör durumu ve rota planlama.

  <img src="/assets/showcase/wienerlinien.png" alt="ClawHub'da Wiener Linien skill'i" />
</Card>

<Card title="ParentPay okul yemekleri" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay üzerinden otomatik Birleşik Krallık okul yemeği rezervasyonu. Güvenilir tablo hücresi tıklaması için fare koordinatlarını kullanır.
</Card>

<Card title="R2 yükleme (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3'e yükleyin ve güvenli önceden imzalanmış indirme bağlantıları oluşturun. Uzak OpenClaw örnekleri için kullanışlıdır.

  <img src="/assets/showcase/r2-upload.png" alt="ClawHub'da R2 yükleme skill'i" />
</Card>

<Card title="Telegram üzerinden iOS uygulaması" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Haritalar ve ses kaydı içeren eksiksiz bir iOS uygulaması oluşturuldu, tamamen Telegram sohbeti üzerinden TestFlight'a dağıtıldı.

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight'ta iOS uygulaması" />
</Card>

<Card title="Oura Ring sağlık asistanı" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ring verilerini takvim, randevular ve spor salonu programıyla entegre eden kişisel AI sağlık asistanı.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring sağlık asistanı" />
</Card>

<Card title="Kev'in Dream Team'i (14+ aracı)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Codex workers'a görev dağıtan bir Opus 4.5 orchestrator ile tek Gateway altında 14+ aracı. Aracı sandbox'lama için [teknik yazıya](https://github.com/adam91holt/orchestrated-ai-articles) ve [Clawdspace'e](https://github.com/adam91holt/clawdspace) bakın.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

Aracı iş akışlarıyla (Claude Code, OpenClaw) entegre olan Linear için CLI. Terminalden issue'ları, projeleri ve iş akışlarını yönetin.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop üzerinden mesajları okuyun, gönderin ve arşivleyin. Aracıların tüm sohbetlerinizi (iMessage, WhatsApp ve daha fazlası) tek yerden yönetebilmesi için Beeper local MCP API'sini kullanır.
</Card>

</CardGroup>

## Otomasyon ve iş akışları

Zamanlama, tarayıcı kontrolü, destek döngüleri ve ürünün "görevi benim için yap" tarafı.

<CardGroup cols={2}>

<Card title="Winix hava temizleyici kontrolü" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code temizleyici kontrollerini keşfedip doğruladı, ardından odanın hava kalitesini yönetmek için OpenClaw devralıyor.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw üzerinden Winix hava temizleyici kontrolü" />
</Card>

<Card title="Güzel gökyüzü kamera kareleri" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Bir çatı kamerası tarafından tetiklenir: güzel göründüğünde OpenClaw'dan gökyüzü fotoğrafı çekmesini isteyin. Bir skill tasarladı ve kareyi çekti.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw tarafından yakalanan çatı kamerası gökyüzü anlık görüntüsü" />
</Card>

<Card title="Görsel sabah brifingi sahnesi" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Zamanlanmış bir prompt, bir OpenClaw personası üzerinden her sabah bir sahne görseli (hava durumu, görevler, tarih, favori gönderi veya alıntı) üretir.
</Card>

<Card title="Padel kortu rezervasyonu" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic uygunluk denetleyicisi ve rezervasyon CLI'si. Bir daha asla boş kort kaçırmayın.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli ekran görüntüsü" />
</Card>

<Card title="Muhasebe belge alımı" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

E-postadan PDF'leri toplar, bir vergi danışmanı için belgeleri hazırlar. Aylık muhasebe otopilotta.
</Card>

<Card title="Koltuktan geliştirici modu" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Netflix izlerken Telegram üzerinden tüm kişisel siteyi yeniden oluşturdu: Notion'dan Astro'ya, 18 gönderi taşındı, DNS Cloudflare'a alındı. Dizüstü bilgisayar hiç açılmadı.
</Card>

<Card title="İş arama aracısı" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

İş ilanlarını arar, CV anahtar kelimeleriyle eşleştirir ve ilgili fırsatları bağlantılarla döndürür. JSearch API kullanılarak 30 dakikada oluşturuldu.
</Card>

<Card title="Jira skill oluşturucu" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw Jira'ya bağlandı, ardından anında yeni bir skill üretti (ClawHub'da var olmadan önce).
</Card>

<Card title="Telegram üzerinden Todoist skill'i" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist görevlerini otomatikleştirdi ve OpenClaw'a skill'i doğrudan Telegram sohbetinde ürettirdi.
</Card>

<Card title="TradingView analizi" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Tarayıcı otomasyonuyla TradingView'e giriş yapar, grafik ekran görüntüleri alır ve istek üzerine teknik analiz gerçekleştirir. API gerekmez; yalnızca tarayıcı kontrolü.
</Card>

<Card title="Slack otomatik destek" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Bir şirket Slack kanalını izler, yardımcı yanıtlar verir ve bildirimleri Telegram'a iletir. İstenmeden dağıtımdaki bir uygulamada üretim hatasını otonom olarak düzeltti.
</Card>

</CardGroup>

## Bilgi ve bellek

Kişisel veya ekip bilgisini indeksleyen, arayan, hatırlayan ve üzerinde akıl yürüten sistemler.

<CardGroup cols={2}>

<Card title="xuezh Çince öğrenimi" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw üzerinden telaffuz geri bildirimi ve çalışma akışlarıyla Çince öğrenme motoru.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh telaffuz geri bildirimi" />
</Card>

<Card title="WhatsApp bellek kasası" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Tam WhatsApp dışa aktarımlarını içe alır, 1k+ sesli notu transkribe eder, git loglarıyla çapraz kontrol yapar, bağlantılı markdown raporları çıkarır.
</Card>

<Card title="Karakeep anlamsal arama" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant ve OpenAI ya da Ollama embedding'leri kullanarak Karakeep yer imlerine vektör araması ekler.
</Card>

<Card title="Inside-Out-2 belleği" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Oturum dosyalarını anılara, sonra inançlara, sonra da evrilen bir benlik modeline dönüştüren ayrı bellek yöneticisi.
</Card>

</CardGroup>

## Ses ve telefon

Önceliği konuşma olan giriş noktaları, telefon köprüleri ve transkripsiyon ağırlıklı iş akışları.

<CardGroup cols={2}>

<Card title="Clawdia telefon köprüsü" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi ses asistanından OpenClaw HTTP köprüsüne. Aracınızla neredeyse gerçek zamanlı telefon görüşmeleri.
</Card>

<Card title="OpenRouter transkripsiyonu" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter üzerinden çok dilli ses transkripsiyonu (Gemini ve daha fazlası). ClawHub'da mevcut.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="ClawHub'da OpenRouter transkripsiyon skill'i" />
</Card>

</CardGroup>

## Altyapı ve dağıtım

OpenClaw'ı çalıştırmayı ve genişletmeyi kolaylaştıran paketleme, dağıtım ve entegrasyonlar.

<CardGroup cols={2}>

<Card title="Home Assistant eklentisi" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw Gateway, Home Assistant OS üzerinde SSH tüneli desteği ve kalıcı durum ile çalışıyor.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Home Assistant cihazlarını doğal dil aracılığıyla kontrol edin ve otomatikleştirin.

  <img src="/assets/showcase/homeassistant.png" alt="ClawHub'da Home Assistant skill" />
</Card>

<Card title="Nix paketleme" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Yeniden üretilebilir dağıtımlar için eksiksiz nix'lenmiş OpenClaw yapılandırması.
</Card>

<Card title="CalDAV takvimi" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

khal ve vdirsyncer kullanan takvim skill'i. Kendi barındırdığınız takvim entegrasyonu.

  <img src="/assets/showcase/caldav-calendar.png" alt="ClawHub'da CalDAV takvim skill'i" />
</Card>

</CardGroup>

## Ev ve donanım

OpenClaw'ın fiziksel dünya tarafı: evler, sensörler, kameralar, elektrikli süpürgeler ve diğer cihazlar.

<CardGroup cols={2}>

<Card title="GoHome otomasyonu" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Arayüz olarak OpenClaw ile Nix'e özgü ev otomasyonu ve Grafana panoları.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana panosu" />
</Card>

<Card title="Roborock elektrikli süpürge" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Roborock robot süpürgenizi doğal konuşma yoluyla kontrol edin.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock durumu" />
</Card>

</CardGroup>

## Topluluk projeleri

Tek bir iş akışının ötesine geçerek daha geniş ürünlere veya ekosistemlere dönüşen şeyler.

<CardGroup cols={2}>

<Card title="StarSwap pazaryeri" icon="star" href="https://star-swap.com/">
  **Topluluk** • `marketplace` `astronomy` `webapp`

Tam kapsamlı astronomi ekipmanı pazaryeri. OpenClaw ekosistemiyle ve onun etrafında geliştirildi.
</Card>

</CardGroup>

## Projenizi gönderin

<Steps>
  <Step title="Paylaşın">
    [Discord'da #self-promotion](https://discord.gg/clawd) kanalında paylaşın veya [@openclaw'a tweet atın](https://x.com/openclaw).
  </Step>
  <Step title="Ayrıntıları ekleyin">
    Bize ne yaptığını anlatın, depoya veya demoya bağlantı verin ve varsa bir ekran görüntüsü paylaşın.
  </Step>
  <Step title="Öne çıkarılın">
    Öne çıkan projeleri bu sayfaya ekleyeceğiz.
  </Step>
</Steps>

## İlgili

- [Başlarken](/tr/start/getting-started)
- [OpenClaw](/tr/start/openclaw)
