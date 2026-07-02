---
description: Real-world OpenClaw projects from the community
read_when:
    - Gerçek OpenClaw kullanım örnekleri aranıyor
    - Topluluk projesi öne çıkanlarını güncelleme
summary: OpenClaw tarafından desteklenen topluluk yapımı projeler ve entegrasyonlar
title: Vitrin
x-i18n:
    generated_at: "2026-07-02T08:45:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw projeleri oyuncak demolar değildir. İnsanlar zaten kullandıkları kanallardan PR inceleme döngüleri, mobil uygulamalar, ev otomasyonu, ses sistemleri, geliştirici araçları ve yoğun bellek kullanan iş akışları yayınlıyor: Telegram, WhatsApp, Discord ve terminaller üzerinde sohbet odaklı derlemeler; API beklemeden rezervasyon, alışveriş ve destek için gerçek otomasyon; yazıcılar, süpürgeler, kameralar ve ev sistemleriyle fiziksel dünya entegrasyonları.

<Info>
**Öne çıkarılmak ister misiniz?** Projenizi [Discord’daki #self-promotion kanalında](https://discord.gg/clawd) paylaşın veya [X’te @openclaw etiketleyin](https://x.com/openclaw).
</Info>

## Discord’dan Yeniler

Kodlama, geliştirici araçları, mobil ve sohbet odaklı ürün geliştirme genelinde son öne çıkanlar.

<CardGroup cols={2}>

<Card title="PR İncelemesinden Telegram Geri Bildirimine" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode değişikliği tamamlar, bir PR açar, OpenClaw farkı inceler ve önerilerle birlikte net bir birleştirme kararıyla Telegram’da yanıt verir.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Dakikalar İçinde Şarap Mahzeni Skill’i" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Yerel bir şarap mahzeni skill’i için "Robby"ye (@openclaw) soruldu. Örnek bir CSV dışa aktarımı ve depolama yolu ister, ardından skill’i oluşturup test eder (örnekte 962 şişe).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Alışveriş Otomatik Pilotu" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Haftalık yemek planı, düzenli alınanlar, teslimat aralığı rezervasyonu, sipariş onayı. API yok, sadece tarayıcı kontrolü.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG ekran görüntüsünden Markdown’a" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Bir ekran bölgesine kısayol atayın, Gemini vision çalışsın, panonuza anında Markdown gelsin.

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex ve OpenClaw genelinde skills ve komutları yönetmek için masaüstü uygulaması.

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram sesli notları (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTS’i sarmalar ve sonuçları Telegram sesli notları olarak gönderir (rahatsız edici otomatik oynatma yok).

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Yerel OpenAI Codex oturumlarını listelemek, incelemek ve izlemek için Homebrew ile kurulan yardımcı araç (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Yazıcı Kontrolü" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab yazıcılarını kontrol edin ve sorun giderin: durum, işler, kamera, AMS, kalibrasyon ve daha fazlası.

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Viyana ulaşımı (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Viyana toplu taşıması için gerçek zamanlı kalkışlar, aksaklıklar, asansör durumu ve rota planlama.

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay okul yemekleri" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay üzerinden otomatik Birleşik Krallık okul yemeği rezervasyonu. Güvenilir tablo hücresi tıklaması için fare koordinatlarını kullanır.
</Card>

<Card title="R2 yükleme (Dosyalarımı Bana Gönder)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3’e yükleyin ve güvenli önceden imzalanmış indirme bağlantıları oluşturun. Uzak OpenClaw örnekleri için kullanışlıdır.

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="Telegram üzerinden iOS uygulaması" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Haritalar ve ses kaydı içeren eksiksiz bir iOS uygulaması oluşturuldu, tamamen Telegram sohbeti üzerinden App Store dağıtımı için hazırlandı.
</Card>

<Card title="Oura Ring sağlık asistanı" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ring verilerini takvim, randevular ve spor salonu programıyla entegre eden kişisel yapay zeka sağlık asistanı.

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev’in Dream Team’i (14+ aracı)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Codex çalışanlarına görev devreden bir Opus 4.5 orkestratörüyle tek Gateway altında 14+ aracı. Aracı yalıtımı için [teknik yazıya](https://github.com/adam91holt/orchestrated-ai-articles) ve [Clawdspace’e](https://github.com/adam91holt/clawdspace) bakın.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

Aracılı iş akışlarıyla (Claude Code, OpenClaw) entegre olan Linear için CLI. Sorunları, projeleri ve iş akışlarını terminalden yönetin.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop üzerinden mesajları okuyun, gönderin ve arşivleyin. Beeper local MCP API kullandığı için aracılar tüm sohbetlerinizi (iMessage, WhatsApp ve daha fazlası) tek yerden yönetebilir.
</Card>

</CardGroup>

## Otomasyon ve iş akışları

Zamanlama, tarayıcı kontrolü, destek döngüleri ve ürünün "görevi benim için yapıver" tarafı.

<CardGroup cols={2}>

<Card title="Winix hava temizleyici kontrolü" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code hava temizleyici kontrollerini keşfedip doğruladı, ardından OpenClaw oda hava kalitesini yönetmeyi devralır.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Güzel gökyüzü kamera kareleri" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Bir çatı kamerasıyla tetiklenir: güzel göründüğünde OpenClaw’dan gökyüzü fotoğrafı çekmesini isteyin. Bir skill tasarladı ve kareyi çekti.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Görsel sabah bilgilendirme sahnesi" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Zamanlanmış bir prompt, her sabah bir OpenClaw personası aracılığıyla bir sahne görseli üretir (hava durumu, görevler, tarih, favori gönderi veya alıntı).
</Card>

<Card title="Padel kortu rezervasyonu" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic uygunluk denetleyicisi ve rezervasyon CLI’si. Bir daha asla boş kort kaçırmayın.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Muhasebe alımı" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

E-postadan PDF’leri toplar, belgeleri vergi danışmanı için hazırlar. Aylık muhasebe otomatik pilotta.
</Card>

<Card title="Koltuk geliştiricisi modu" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Netflix izlerken tüm kişisel siteyi Telegram üzerinden yeniden oluşturdu: Notion’dan Astro’ya, 18 gönderi taşındı, DNS Cloudflare’a alındı. Dizüstü bilgisayarını hiç açmadı.
</Card>

<Card title="İş arama aracısı" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

İş ilanlarını arar, CV anahtar kelimeleriyle eşleştirir ve bağlantılarla birlikte ilgili fırsatları döndürür. JSearch API kullanılarak 30 dakikada oluşturuldu.
</Card>

<Card title="Jira skill oluşturucu" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw Jira’ya bağlandı, ardından anında yeni bir skill üretti (ClawHub’da var olmadan önce).
</Card>

<Card title="Telegram üzerinden Todoist skill’i" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist görevlerini otomatikleştirdi ve OpenClaw’ın skill’i doğrudan Telegram sohbetinde üretmesini sağladı.
</Card>

<Card title="TradingView analizi" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Tarayıcı otomasyonu üzerinden TradingView’e giriş yapar, grafik ekran görüntüleri alır ve istek üzerine teknik analiz gerçekleştirir. API gerekmez; sadece tarayıcı kontrolü.
</Card>

<Card title="Slack otomatik destek" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Bir şirket Slack kanalını izler, yardımcı şekilde yanıt verir ve bildirimleri Telegram’a iletir. İstenmeden, dağıtımdaki bir uygulamada üretim hatasını otonom olarak düzeltti.
</Card>

</CardGroup>

## Bilgi ve bellek

Kişisel veya ekip bilgisini dizinleyen, arayan, hatırlayan ve üzerinde akıl yürüten sistemler.

<CardGroup cols={2}>

<Card title="xuezh Çince öğrenme" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw üzerinden telaffuz geri bildirimi ve çalışma akışlarıyla Çince öğrenme motoru.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp bellek kasası" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Tam WhatsApp dışa aktarımlarını alır, 1 binden fazla sesli notu yazıya döker, git günlükleriyle çapraz kontrol eder ve bağlantılı markdown raporları üretir.
</Card>

<Card title="Karakeep anlamsal arama" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant ile OpenAI veya Ollama embedding’leri kullanarak Karakeep yer imlerine vektör araması ekler.
</Card>

<Card title="Inside-Out-2 belleği" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Oturum dosyalarını önce anılara, sonra inançlara, ardından gelişen bir öz modele dönüştüren ayrı bellek yöneticisi.
</Card>

</CardGroup>

## Ses ve telefon

Önceliği konuşma olan giriş noktaları, telefon köprüleri ve yoğun yazıya döküm kullanan iş akışları.

<CardGroup cols={2}>

<Card title="Clawdia telefon köprüsü" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

OpenClaw HTTP köprüsü için Vapi sesli asistanı. Aracınızla neredeyse gerçek zamanlı telefon görüşmeleri.
</Card>

<Card title="OpenRouter yazıya döküm" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter üzerinden çok dilli ses yazıya dökümü (Gemini ve daha fazlası). ClawHub’da mevcut.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## Altyapı ve dağıtım

OpenClaw’ı çalıştırmayı ve genişletmeyi kolaylaştıran paketleme, dağıtım ve entegrasyonlar.

<CardGroup cols={2}>

<Card title="Home Assistant eklentisi" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSH tünel desteği ve kalıcı durumla Home Assistant OS üzerinde çalışan OpenClaw gateway.
</Card>

<Card title="Home Assistant becerisi" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Home Assistant cihazlarını doğal dil aracılığıyla kontrol edin ve otomatikleştirin.

  <img src="/assets/showcase/homeassistant.png" alt="ClawHub üzerinde Home Assistant becerisi" />
</Card>

<Card title="Nix paketleme" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Yeniden üretilebilir dağıtımlar için hazır özelliklerle gelen nixleştirilmiş OpenClaw yapılandırması.
</Card>

<Card title="CalDAV takvimi" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

khal ve vdirsyncer kullanan takvim becerisi. Kendi kendine barındırılan takvim entegrasyonu.

  <img src="/assets/showcase/caldav-calendar.png" alt="ClawHub üzerinde CalDAV takvim becerisi" />
</Card>

</CardGroup>

## Ev ve donanım

OpenClaw’ın fiziksel dünya tarafı: evler, sensörler, kameralar, süpürgeler ve diğer cihazlar.

<CardGroup cols={2}>

<Card title="GoHome otomasyonu" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Arayüz olarak OpenClaw kullanan Nix’e yerel ev otomasyonu ve Grafana panoları.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana panosu" />
</Card>

<Card title="Roborock süpürgesi" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Roborock robot süpürgenizi doğal konuşma yoluyla kontrol edin.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock durumu" />
</Card>

</CardGroup>

## Topluluk projeleri

Tek bir iş akışının ötesine geçip daha geniş ürünlere veya ekosistemlere dönüşen şeyler.

<CardGroup cols={2}>

<Card title="StarSwap pazaryeri" icon="star" href="https://star-swap.com/">
  **Topluluk** • `marketplace` `astronomy` `webapp`

Tam kapsamlı astronomi ekipmanı pazaryeri. OpenClaw ekosistemiyle ve onun etrafında oluşturuldu.
</Card>

</CardGroup>

## Projenizi gönderin

<Steps>
  <Step title="Paylaşın">
    [Discord’da #self-promotion](https://discord.gg/clawd) kanalında paylaşım yapın veya [@openclaw’a tweet atın](https://x.com/openclaw).
  </Step>
  <Step title="Ayrıntıları ekleyin">
    Ne yaptığını anlatın, depoya veya demoya bağlantı verin ve varsa bir ekran görüntüsü paylaşın.
  </Step>
  <Step title="Öne çıkarılın">
    Öne çıkan projeleri bu sayfaya ekleyeceğiz.
  </Step>
</Steps>

## İlgili

- [Başlarken](/tr/start/getting-started)
- [OpenClaw](/tr/start/openclaw)
