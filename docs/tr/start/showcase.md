---
description: Real-world OpenClaw projects from the community
read_when:
    - Gerçek OpenClaw kullanım örnekleri aranıyor
    - Topluluk projelerinin öne çıkanlarını güncelleme
summary: OpenClaw destekli, topluluk tarafından geliştirilen projeler ve entegrasyonlar
title: Vitrin
x-i18n:
    generated_at: "2026-07-12T12:50:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

Topluluk tarafından geliştirilen OpenClaw projeleri: PR inceleme döngüleri, mobil uygulamalar, ev otomasyonu, ses sistemleri, geliştirici araçları ve bellek iş akışları; Telegram, WhatsApp, Discord ve terminallerde sohbet odaklı olarak geliştirildi.

<Info>
**Burada yer almak ister misiniz?** Projenizi [Discord'daki #self-promotion kanalında](https://discord.gg/clawd) paylaşın veya [X'te @openclaw hesabını etiketleyin](https://x.com/openclaw).
</Info>

## Discord'dan yeniler

Kodlama, geliştirici araçları, mobil ve sohbet odaklı ürün geliştirme alanlarındaki son öne çıkanlar.

<CardGroup cols={2}>

<Card title="Dropage ile anında HTML dağıtımı" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

Aracınıza "bu HTML'yi dağıt" deyin ve yaklaşık bir saniye içinde herkese açık bir URL alın. Sayfalar bir saat sonra kendiliğinden sona erer — sunucu, yapılandırma veya kayıt gerekmez.
</Card>

<Card title="Dolandırıcılık karşıtı URL denetleyicisi" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

Herhangi bir URL'yi yapıştırın ve değerlendirmeyi alın. 38 kaynaktan (PhishTank, OpenPhish, CERT.PL ve diğerleri) 2,5 milyondan fazla dolandırıcılık alan adı yerel olarak eşleştirildiğinden tarama geçmişi makineden asla ayrılmaz.
</Card>

<Card title="Ürün tasarımı akıl yürütme Skills'leri" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

Ürün çalışmaları için üçlü bir paket: [Sokratik Diyalog](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) yanıtlamadan önce soruyu çapraz sorgular, [Kano Modeli Stratejisti](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) özellikleri yerini hak edenlere göre sınıflandırır ve [Okunaklı Aracı Çıktısı](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) aracı çıktısını sade bir dille yeniden yazar.
</Card>

<Card title="Alt aracılar için posta kutusu aracısı" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

Alt aracılar çalışırken orkestratörlerin boşta beklemesini önler: sonuçların üst aracıyı engellemek yerine bir posta kutusuna ulaştığı eşzamansız bir geri çağırma mekanizmasıdır.
</Card>

<Card title="Düşük RAM'li makineler için lite-mode" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

OpenClaw'ın 2-4 GB belleğe sahip makinelerde kullanılabilir kalmasını sağlar: boş belleği denetler ve makine takas alanını kullanmaya başlamadan önce ağır özellikleri kısıtlar. [GitHub'daki kaynak](https://github.com/mirajmahmudul/openclaw-lite-mode).
</Card>

<Card title="tokenomics maliyet izleyicisi" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

Bir NVIDIA mühendisi tarafından geliştirilen, birinci sınıf OpenClaw desteğine sahip token maliyeti izleyicisi: aracı harcamalarınızın model ve oturum bazında tam olarak nereye gittiğini görün.
</Card>

<Card title="Excalidraw diyagram oluşturucu" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

Sohbette bir diyagramı tarif edin ve programlı olarak oluşturulmuş bir Excalidraw taslağı alın.
</Card>

<Card title="GA4 analiz Skill'i" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

OpenClaw'a kendi Google Analytics sorgu aracını geliştirdi, ardından bunu paketleyip ClawHub'da yayımladı.
</Card>

<Card title="ClawEval model sıralamaları" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

"GPU'm için hangi LLM?" sorusunu yanıtlamak üzere modelleri 59 aracı rolünde karşılaştırır. Yerel model seçiminde topluluğun gözdesidir.
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

Sağlayıcıdan bağımsız şarkı oluşturma: tek seferlik istem vermek yerine parçayı planlayın, şarkı sözlerini yapılandırın ve yetersiz sonuçları gözden geçirin. BPM, tonalite, yapı ve mashup denetimi sunan bir [MiniMax çeşidi](https://clawhub.ai/luischarro/music-craft-minimax) içerir.
</Card>

<Card title="PR İncelemesinden Telegram Geri Bildirimine" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode değişikliği tamamlar ve bir PR açar; OpenClaw farkı inceler, önerilerle ve net bir birleştirme kararıyla Telegram üzerinden yanıt verir.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegram üzerinden iletilen OpenClaw PR inceleme geri bildirimi" />
</Card>

<Card title="Dakikalar İçinde Şarap Mahzeni Skill'i" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

"Robby"den (@openclaw) yerel bir şarap mahzeni Skill'i istendi. Örnek bir CSV dışa aktarımı ve depolama yolu ister, ardından Skill'i geliştirip test eder (örnekte 962 şişe).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw'ın CSV'den yerel bir şarap mahzeni Skill'i geliştirmesi" />
</Card>

<Card title="Tesco Alışveriş Otopilotu" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Haftalık yemek planını ve düzenli alınan ürünleri hazırlar, teslimat aralığını ayırtır ve siparişi onaylar. API yoktur; yalnızca tarayıcı denetimi kullanılır.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Sohbet üzerinden Tesco alışveriş otomasyonu" />
</Card>

<Card title="SNAG ekran görüntüsünden Markdown'a" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Bir ekran bölgesini kısayol tuşuyla seçin; Gemini görüntü analiziyle anında panonuza Markdown alın.

  <img src="/assets/showcase/snag.png" alt="SNAG ekran görüntüsünden Markdown'a dönüştürme aracı" />
</Card>

<Card title="Aracılar Kullanıcı Arayüzü" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents, Claude, Codex ve OpenClaw genelinde Skills'leri ve komutları yönetmek için masaüstü uygulaması.

  <img src="/assets/showcase/agents-ui.jpg" alt="Aracılar Kullanıcı Arayüzü uygulaması" />
</Card>

<Card title="Telegram sesli notları (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Topluluk** • `voice` `tts` `telegram`

papla.media TTS'yi sarmalar ve sonuçları Telegram sesli notları olarak gönderir (rahatsız edici otomatik oynatma olmadan).

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS'den Telegram sesli not çıktısı" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Yerel OpenAI Codex oturumlarını listelemek, incelemek ve izlemek için Homebrew ile kurulan yardımcı araç (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub'da CodexMonitor" />
</Card>

<Card title="Bambu 3D Yazıcı Denetimi" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab yazıcılarını denetleyin ve sorunlarını giderin: durum, işler, kamera, AMS, kalibrasyon ve daha fazlası.

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub'da Bambu CLI Skill'i" />
</Card>

<Card title="Viyana ulaşımı (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Viyana toplu taşıması için gerçek zamanlı kalkışlar, aksamalar, asansör durumu ve rota planlama.

  <img src="/assets/showcase/wienerlinien.png" alt="ClawHub'da Wiener Linien Skill'i" />
</Card>

<Card title="ParentPay okul yemekleri" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay üzerinden Birleşik Krallık okul yemeklerinin otomatik rezervasyonu. Tablo hücrelerine güvenilir biçimde tıklamak için fare koordinatlarını kullanır.
</Card>

<Card title="R2 yükleme (Dosyalarımı Bana Gönder)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3'e yükleyin ve güvenli, önceden imzalanmış indirme bağlantıları oluşturun. Uzak OpenClaw örnekleri için kullanışlıdır.

  <img src="/assets/showcase/r2-upload.png" alt="ClawHub'da R2 yükleme Skill'i" />
</Card>

<Card title="Telegram üzerinden iOS uygulaması" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

Haritalar ve ses kaydı içeren eksiksiz bir iOS uygulaması tamamen Telegram sohbeti üzerinden geliştirildi ve App Store dağıtımına hazırlandı.
</Card>

<Card title="Oura Ring sağlık asistanı" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura Ring verilerini takvim, randevular ve spor salonu programıyla bütünleştiren kişisel yapay zekâ sağlık asistanı.

  <img src="/assets/showcase/oura-health.png" alt="Oura Ring sağlık asistanı" />
</Card>

<Card title="Kev'in Rüya Takımı (14'ten fazla aracı)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Codex çalışanlarına görev dağıtan bir Opus 4.5 orkestratörüyle tek bir Gateway altında 14'ten fazla aracı. Teknik ayrıntılar için [teknik yazıya](https://github.com/adam91holt/orchestrated-ai-articles), aracıların korumalı alanlarda çalıştırılması için [Clawdspace'e](https://github.com/adam91holt/clawdspace) bakın.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

Aracı tabanlı iş akışlarıyla (Claude Code, OpenClaw) bütünleşen Linear CLI'si. Sorunları, projeleri ve iş akışlarını terminalden yönetin.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop üzerinden mesajları okuyun, gönderin ve arşivleyin. Aracıların tüm sohbetlerinizi (iMessage, WhatsApp ve diğerleri) tek bir yerde yönetebilmesi için Beeper yerel MCP API'sini kullanır.
</Card>

</CardGroup>

## Otomasyon ve iş akışları

Zamanlama, tarayıcı denetimi, destek döngüleri ve ürünün "görevi benim için yapıver" yönü.

<CardGroup cols={2}>

<Card title="Winix hava temizleyici denetimi" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code hava temizleyicinin denetimlerini keşfedip doğruladıktan sonra odanın hava kalitesini yönetme görevini OpenClaw devralır.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw üzerinden Winix hava temizleyici denetimi" />
</Card>

<Card title="Güzel gökyüzü kamera görüntüleri" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Bir çatı kamerası tarafından tetiklenir: OpenClaw'dan gökyüzü güzel göründüğünde fotoğrafını çekmesini isteyin. Bir Skill tasarlayıp fotoğrafı çekti.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw tarafından çekilen çatı kamerası gökyüzü görüntüsü" />
</Card>

<Card title="Görsel sabah bilgilendirme sahnesi" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Zamanlanmış bir istem, bir OpenClaw kişiliği aracılığıyla her sabah tek bir sahne görseli (hava durumu, görevler, tarih, favori gönderi veya alıntı) oluşturur.
</Card>

<Card title="Padel kortu rezervasyonu" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic uygunluk denetleyicisi ve rezervasyon CLI'si. Boş bir kortu bir daha asla kaçırmayın.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli ekran görüntüsü" />
</Card>

<Card title="Muhasebe belge alımı" icon="file-invoice-dollar">
  **Topluluk** • `automation` `email` `pdf`

PDF'leri e-postadan toplar ve belgeleri vergi danışmanı için hazırlar. Aylık muhasebe otomatik pilota alınır.
</Card>

<Card title="Koltuktan geliştirme modu" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Netflix izlerken kişisel sitesinin tamamını Telegram üzerinden yeniden geliştirdi — Notion'dan Astro'ya geçti, 18 gönderiyi taşıdı ve DNS'i Cloudflare'e aktardı. Dizüstü bilgisayarını hiç açmadı.
</Card>

<Card title="İş arama aracısı" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

İş ilanlarını arar, bunları özgeçmişteki anahtar kelimelerle eşleştirir ve ilgili fırsatları bağlantılarıyla birlikte döndürür. JSearch API kullanılarak 30 dakikada geliştirildi.
</Card>

<Card title="Jira Skill oluşturucu" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw Jira'ya bağlandı, ardından anında yeni bir beceri oluşturdu (ClawHub'da henüz mevcut değilken).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist görevlerini otomatikleştirdi ve OpenClaw'ın beceriyi doğrudan Telegram sohbetinde oluşturmasını sağladı.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Tarayıcı otomasyonu aracılığıyla TradingView'a giriş yapar, grafiklerin ekran görüntülerini alır ve talep üzerine teknik analiz gerçekleştirir. API gerekmez — yalnızca tarayıcı kontrolü yeterlidir.
</Card>

<Card title="Car negotiation ($4,200 saved)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

OpenClaw'ı otomobil bayileriyle pazarlık yapmak üzere serbest bıraktı: karşılıklı görüşmeleri yürüttü ve fiyatı 4.200 $ düşürdü.
</Card>

<Card title="Flight check-in autopilot" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

E-postadaki bir sonraki uçuşu bulur, çevrimiçi check-in işlemini tamamlar ve pencere kenarında bir koltuk seçer — havayolu uygulaması gerekmez.
</Card>

<Card title="Insurance claim filing" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

Bir sigorta talebinde bulundu ve takip randevusunu bağımsız olarak planladı.
</Card>

<Card title="Idealista real estate skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

Emlak sorguları ve değerlemeleri için Idealista API CLI'si, aracının sohbet üzerinden ev arayabilmesi amacıyla bir beceri olarak paketlendi.
</Card>

<Card title="Gardening business back office" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

İş emirleri için Gmail'i izler, Telegram üzerinden gönderilen mülk fotoğraflarını analiz eder, çok sayfalı LaTeX teklif PDF'leri hazırlar ve Xero üzerinden fatura düzenler.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Bir şirketin Slack kanalını izler, yararlı yanıtlar verir ve bildirimleri Telegram'a iletir. İstenmeden, dağıtılmış bir uygulamadaki üretim hatasını bağımsız olarak düzeltti.
</Card>

</CardGroup>

## Bilgi ve bellek

Kişisel veya ekip bilgisini dizine ekleyen, arayan, hatırlayan ve bu bilgi üzerinde akıl yürüten sistemler.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw aracılığıyla telaffuz geri bildirimi ve çalışma akışları sunan Çince öğrenme motoru.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="X post analysis pipeline" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

En popüler 100 X hesabındaki 4 milyon gönderiyi çekerek bunları sorgulanabilir bir analiz işlem hattına dönüştürdü.
</Card>

<Card title="Lab results to Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

Yıllara yayılan kan tahlili sonuçlarını yapılandırılmış bir Notion veritabanında düzenledi.
</Card>

<Card title="Obsidian second brain" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

Tüm belleği sürüm kontrollü bir Obsidian kasasında Markdown olarak saklanan, WhatsApp üzerindeki günlük kullanım asistanı: kalori ve egzersiz takibi, yapılacaklar listeleri ve günlük yaşam yönetimi.
</Card>

<Card title="Family history bot" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

Bir aile Telegram grup sohbetinde yer alır, 50'den fazla akrabanın hikâyelerini belgeler ve bilgiye dayalı takip soruları sorar — ana dili Nepalce olanlara Nepalce yanıt verir.
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Topluluk** • `memory` `transcription` `indexing`

WhatsApp dışa aktarımlarının tamamını içe alır, 1.000'den fazla sesli notu yazıya döker, bunları git günlükleriyle çapraz denetler ve bağlantılı Markdown raporları üretir.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant ile OpenAI veya Ollama gömmelerini kullanarak Karakeep yer imlerine vektör araması ekler.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Topluluk** • `memory` `beliefs` `self-model`

Oturum dosyalarını önce anılara, ardından inançlara ve son olarak gelişen bir öz modele dönüştüren ayrı bir bellek yöneticisi.
</Card>

</CardGroup>

## Ses ve telefon

Öncelikle konuşmaya dayalı giriş noktaları, telefon köprüleri ve yoğun yazıya döküm iş akışları.

<CardGroup cols={2}>

<Card title="Pebble Ring one-tap voice" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Pebble Ring'e tek dokunuş, OpenClaw ile sesli bir görüşme başlatır — giyilebilir bir cihazdan aracı erişimi sağlar.
</Card>

<Card title="Creator media studio" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

Sohbet içinde eksiksiz bir medya stüdyosu: Codex 5.2 ve MiniMax'e bağlanmış TTS, yazıya döküm ve tarayıcı otomasyonu.
</Card>

<Card title="Action Button walkie-talkie" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

iPhone Action Button, OpenClaw'a bağlandı: düğmeye basın, konuşun ve aracı size telsiz gibi sesli yanıt versin.
</Card>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi sesli asistanından OpenClaw HTTP köprüsüne bağlantı. Aracınızla neredeyse gerçek zamanlı telefon görüşmeleri.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter (Gemini ve diğerleri) aracılığıyla çok dilli ses yazıya dökümü. ClawHub'da kullanılabilir.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## Altyapı ve dağıtım

OpenClaw'ın çalıştırılmasını ve genişletilmesini kolaylaştıran paketleme, dağıtım ve entegrasyonlar.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSH tüneli desteği ve kalıcı durumla Home Assistant OS üzerinde çalışan OpenClaw Gateway.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Home Assistant cihazlarını doğal dil aracılığıyla kontrol edin ve otomatikleştirin.

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="macOS menu bar manager" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

Hızlı kontrollerle aracı durumunu gösteren yerel Swift menü çubuğu uygulaması.
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Tekrarlanabilir dağıtımlar için gerekli her şeyi içeren, Nix uyumlu OpenClaw yapılandırması.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

khal ve vdirsyncer kullanan takvim becerisi. Kendi sunucunuzda barındırılan takvim entegrasyonu.

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## Ev ve donanım

OpenClaw'ın fiziksel dünyaya dönük tarafı: evler, sensörler, kameralar, elektrikli süpürgeler ve diğer cihazlar.

<CardGroup cols={2}>

<Card title="Self-built HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw, yerel ağdaki HomePod'ları buldu ve bunları kontrol etmek için kendine bir beceri yazdı.
</Card>

<Card title="$35 holo cube interface" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

Masa üzerinde aracının fiziksel yüzü olarak kullanılan uygun fiyatlı bir holografik küp.
</Card>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Arayüz olarak OpenClaw'ı kullanan Nix tabanlı yerel ev otomasyonu ve Grafana panoları.

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Roborock robot süpürgenizi doğal konuşma yoluyla kontrol edin.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## Topluluk projeleri

Tek bir iş akışının ötesine geçerek daha geniş ürünlere veya ekosistemlere dönüşen çalışmalar.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Topluluk** • `marketplace` `astronomy` `webapp`

Eksiksiz bir astronomi ekipmanı pazaryeri. OpenClaw ekosistemiyle ve bu ekosistemin çevresinde geliştirildi.
</Card>

<Card title="Clinch agent negotiation protocol" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

Açık aracıdan aracıya müzakere: aracınız diğer Node'larla anlaşmalar, programlar ve hizmet sözleşmeleri üzerinde pazarlık yapar ve sonucu kriptografik olarak imzalar — siz yalnızca onaylar veya reddedersiniz.
</Card>

</CardGroup>

## Projenizi gönderin

<Steps>
  <Step title="Share it">
    [Discord'daki #self-promotion kanalında](https://discord.gg/clawd) paylaşın veya [@openclaw hesabına tweet gönderin](https://x.com/openclaw).
  </Step>
  <Step title="Include details">
    Ne yaptığını açıklayın, depo veya demo bağlantısını ekleyin ve varsa bir ekran görüntüsü paylaşın.
  </Step>
  <Step title="Get featured">
    Öne çıkan projeleri bu sayfaya ekleyeceğiz.
  </Step>
</Steps>

## İlgili içerikler

- [Başlarken](/tr/start/getting-started)
- [OpenClaw](/tr/start/openclaw)
- [openclaw.ai üzerindeki eksiksiz X vitrini](https://openclaw.ai/showcase/)
