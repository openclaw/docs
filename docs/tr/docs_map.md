---
read_when: Finding which docs page covers a topic before reading the page
summary: OpenClaw dokümantasyon sayfaları için oluşturulan başlık haritası
title: Doküman haritası
x-i18n:
    generated_at: "2026-07-02T01:11:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 504b554aa699d78c9a3c958d3c724949efdac172cf4a7a0f343c3a3e9bb8c3d7
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw doküman haritası

Bu dosya, ajanların dokümantasyon ağacında gezinmesine yardımcı olmak için `docs/**/*.md` ve `docs/**/*.mdx` başlıklarından oluşturulur.
Elle düzenlemeyin; `pnpm docs:map:gen` çalıştırın.

## agent-runtime-architecture.md

- Rota: /agent-runtime-architecture
- Başlıklar:
  - H2: Çalışma zamanı yerleşimi
  - H2: Sınırlar
  - H2: Manifestler
  - H2: Çalışma zamanı seçimi
  - H2: İlgili

## announcements/bluebubbles-imessage.md

- Rota: /announcements/bluebubbles-imessage
- Başlıklar:
  - H1: BlueBubbles'ın kaldırılması ve imsg iMessage yolu
  - H2: Neler değişti
  - H2: Ne yapmalı
  - H2: Geçiş notları
  - H2: Ayrıca bkz.

## auth-credential-semantics.md

- Rota: /auth-credential-semantics
- Başlıklar:
  - H2: Kararlı yoklama neden kodları
  - H2: Belirteç kimlik bilgileri
  - H3: Uygunluk kuralları
  - H3: Çözümleme kuralları
  - H2: Ajan kopyası taşınabilirliği
  - H2: Yalnızca yapılandırma kimlik doğrulama rotaları
  - H2: Açık kimlik doğrulama sırası filtreleme
  - H2: Yoklama hedefi çözümleme
  - H2: Harici CLI kimlik bilgisi keşfi
  - H2: OAuth SecretRef İlke Koruması
  - H2: Eski Sürümle Uyumlu Mesajlaşma
  - H2: İlgili

## automation/auth-monitoring.md

- Rota: /automation/auth-monitoring
- Başlıklar:
  - H2: İlgili

## automation/clawflow.md

- Rota: /automation/clawflow
- Başlıklar:
  - H2: İlgili

## automation/cron-jobs.md

- Rota: /automation/cron-jobs
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Cron nasıl çalışır
  - H2: Zamanlama türleri
  - H3: Ayın günü ve haftanın günü OR mantığını kullanır
  - H2: Yürütme stilleri
  - H3: Komut yükleri
  - H3: Yalıtılmış işler için yük seçenekleri
  - H2: Teslim ve çıktı
  - H2: Çıktı dili
  - H2: CLI örnekleri
  - H2: Webhook'lar
  - H3: Kimlik doğrulama
  - H2: Gmail PubSub entegrasyonu
  - H3: Sihirbaz kurulumu (önerilir)
  - H3: Gateway otomatik başlatma
  - H3: Manuel tek seferlik kurulum
  - H3: Gmail model geçersiz kılma
  - H2: İşleri yönetme
  - H2: Yapılandırma
  - H2: Sorun giderme
  - H3: Komut merdiveni
  - H2: İlgili

## automation/cron-vs-heartbeat.md

- Rota: /automation/cron-vs-heartbeat
- Başlıklar:
  - H2: İlgili

## automation/gmail-pubsub.md

- Rota: /automation/gmail-pubsub
- Başlıklar:
  - H2: İlgili

## automation/hooks.md

- Rota: /automation/hooks
- Başlıklar:
  - H2: Doğru yüzeyi seçin
  - H2: Hızlı başlangıç
  - H2: Olay türleri
  - H2: Hook yazma
  - H3: Hook yapısı
  - H3: HOOK.md biçimi
  - H3: İşleyici uygulaması
  - H3: Olay bağlamı öne çıkanları
  - H2: Hook keşfi
  - H3: Hook paketleri
  - H2: Paketlenmiş hook'lar
  - H3: session-memory ayrıntıları
  - H3: bootstrap-extra-files yapılandırması
  - H3: command-logger ayrıntıları
  - H3: compaction-notifier ayrıntıları
  - H3: boot-md ayrıntıları
  - H2: Plugin hook'ları
  - H2: Yapılandırma
  - H2: CLI başvurusu
  - H2: En iyi uygulamalar
  - H2: Sorun giderme
  - H3: Hook keşfedilmiyor
  - H3: Hook uygun değil
  - H3: Hook yürütülmüyor
  - H2: İlgili

## automation/index.md

- Rota: /automation
- Başlıklar:
  - H2: Hızlı karar kılavuzu
  - H3: Zamanlanmış Görevler (Cron) ile Heartbeat karşılaştırması
  - H2: Temel kavramlar
  - H3: Zamanlanmış görevler (cron)
  - H3: Görevler
  - H3: Çıkarımsal taahhütler
  - H3: TaskFlow
  - H3: Daimi talimatlar
  - H3: Hook'lar
  - H3: Heartbeat
  - H2: Birlikte nasıl çalışırlar
  - H2: İlgili

## automation/poll.md

- Rota: /automation/poll
- Başlıklar:
  - H2: İlgili

## automation/standing-orders.md

- Rota: /automation/standing-orders
- Başlıklar:
  - H2: Daimi talimatlar neden kullanılır
  - H2: Nasıl çalışırlar
  - H2: Daimi talimatın anatomisi
  - H2: Daimi talimatlar ve cron işleri
  - H2: Örnekler
  - H3: Örnek 1: içerik ve sosyal medya (haftalık döngü)
  - H3: Örnek 2: finans operasyonları (olay tetiklemeli)
  - H3: Örnek 3: izleme ve uyarılar (sürekli)
  - H2: Yürüt-doğrula-raporla deseni
  - H2: Çok programlı mimari
  - H2: En iyi uygulamalar
  - H3: Yapın
  - H3: Kaçının
  - H2: İlgili

## automation/taskflow.md

- Rota: /automation/taskflow
- Başlıklar:
  - H2: TaskFlow ne zaman kullanılır
  - H2: Güvenilir zamanlanmış iş akışı deseni
  - H2: Eşitleme modları
  - H3: Yönetilen mod
  - H3: Yansıtılan mod
  - H2: Kalıcı durum ve revizyon izleme
  - H2: İptal davranışı
  - H2: CLI komutları
  - H2: Akışların görevlerle ilişkisi
  - H2: İlgili

## automation/tasks.md

- Rota: /automation/tasks
- Başlıklar:
  - H2: TL;DR
  - H2: Hızlı başlangıç
  - H2: Bir görevi ne oluşturur
  - H2: Görev yaşam döngüsü
  - H2: Teslim ve bildirimler
  - H3: Bildirim ilkeleri
  - H2: CLI başvurusu
  - H2: Sohbet görev panosu (/tasks)
  - H2: Durum entegrasyonu (görev baskısı)
  - H2: Depolama ve bakım
  - H3: Görevlerin bulunduğu yer
  - H3: Otomatik bakım
  - H2: Görevlerin diğer sistemlerle ilişkisi
  - H2: İlgili

## automation/troubleshooting.md

- Rota: /automation/troubleshooting
- Başlıklar:
  - H2: İlgili

## automation/webhook.md

- Rota: /automation/webhook
- Başlıklar:
  - H2: İlgili

## brave-search.md

- Rota: /brave-search
- Başlıklar:
  - H2: İlgili

## channels/access-groups.md

- Rota: /channels/access-groups
- Başlıklar:
  - H2: Statik mesaj gönderen grupları
  - H2: İzin listelerinden başvuru grupları
  - H2: Desteklenen mesaj kanalı yolları
  - H2: Plugin tanılamaları
  - H2: Discord kanal kitleleri
  - H2: Güvenlik notları
  - H2: Sorun giderme

## channels/ambient-room-events.md

- Rota: /channels/ambient-room-events
- Başlıklar:
  - H2: Önerilen kurulum
  - H2: Neler değişir
  - H2: Discord örneği
  - H2: Slack örneği
  - H2: Telegram örneği
  - H2: Ajana özgü ilke
  - H2: Görünür yanıt modları
  - H2: Geçmiş
  - H2: Sorun giderme
  - H2: İlgili

## channels/bot-loop-protection.md

- Rota: /channels/bot-loop-protection
- Başlıklar:
  - H1: Bot döngüsü koruması
  - H2: Varsayılanlar
  - H2: Paylaşılan varsayılanları yapılandırma
  - H2: Kanal veya hesap başına geçersiz kılma
  - H2: Kanal desteği

## channels/broadcast-groups.md

- Rota: /channels/broadcast-groups
- Başlıklar:
  - H2: Genel bakış
  - H2: Kullanım örnekleri
  - H2: Yapılandırma
  - H3: Temel kurulum
  - H3: İşleme stratejisi
  - H3: Tam örnek
  - H2: Nasıl çalışır
  - H3: Mesaj akışı
  - H3: Oturum yalıtımı
  - H3: Örnek: yalıtılmış oturumlar
  - H2: En iyi uygulamalar
  - H2: Uyumluluk
  - H3: Sağlayıcılar
  - H3: Yönlendirme
  - H2: Sorun giderme
  - H2: Örnekler
  - H2: API başvurusu
  - H3: Yapılandırma şeması
  - H3: Alanlar
  - H2: Sınırlamalar
  - H2: Gelecekteki geliştirmeler
  - H2: İlgili

## channels/channel-routing.md

- Rota: /channels/channel-routing
- Başlıklar:
  - H1: Kanallar ve yönlendirme
  - H2: Temel terimler
  - H2: Giden hedef önekleri
  - H2: Oturum anahtarı şekilleri (örnekler)
  - H2: Ana DM rota sabitleme
  - H2: Korumalı gelen kayıt
  - H2: Yönlendirme kuralları (bir ajan nasıl seçilir)
  - H2: Yayın grupları (birden fazla ajan çalıştırma)
  - H2: Yapılandırma genel bakışı
  - H2: Oturum depolama
  - H2: WebChat davranışı
  - H2: Yanıt bağlamı
  - H2: İlgili

## channels/clickclack.md

- Rota: /channels/clickclack
- Başlıklar:
  - H2: Hızlı kurulum
  - H2: Birden fazla bot
  - H2: Hedefler
  - H2: İzinler
  - H2: Sorun giderme

## channels/discord.md

- Rota: /channels/discord
- Başlıklar:
  - H2: Hızlı kurulum
  - H2: Önerilen: Bir sunucu çalışma alanı kurun
  - H2: Çalışma zamanı modeli
  - H2: Forum kanalları
  - H2: Etkileşimli bileşenler
  - H2: Erişim denetimi ve yönlendirme
  - H3: Role dayalı ajan yönlendirme
  - H2: Yerel komutlar ve komut kimlik doğrulaması
  - H2: Özellik ayrıntıları
  - H2: Araçlar ve eylem kapıları
  - H2: Components v2 UI
  - H2: Ses
  - H3: Ses kanalları
  - H3: Kullanıcıları seste takip etme
  - H3: Sesli mesajlar
  - H2: Sorun giderme
  - H2: Yapılandırma başvurusu
  - H2: Güvenlik ve operasyonlar
  - H2: İlgili

## channels/feishu.md

- Rota: /channels/feishu
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Erişim denetimi
  - H3: Doğrudan mesajlar
  - H3: Grup sohbetleri
  - H2: Grup yapılandırma örnekleri
  - H3: Tüm gruplara izin ver, @mention gerekmez
  - H3: Tüm gruplara izin ver, yine de @mention gerektir
  - H3: Yalnızca belirli gruplara izin ver
  - H3: Grup içindeki gönderenleri kısıtla
  - H2: Grup/kullanıcı kimliklerini alma
  - H3: Grup kimlikleri (chatid, biçim: ocxxx)
  - H3: Kullanıcı kimlikleri (openid, biçim: ouxxx)
  - H2: Yaygın komutlar
  - H2: Sorun giderme
  - H3: Bot grup sohbetlerinde yanıt vermiyor
  - H3: Bot mesaj almıyor
  - H3: QR kurulumu Feishu mobil uygulamasında tepki vermiyor
  - H3: App Secret sızdırıldı
  - H2: Gelişmiş yapılandırma
  - H3: Birden fazla hesap
  - H3: Mesaj sınırları
  - H3: Akış
  - H3: Kota optimizasyonu
  - H3: ACP oturumları
  - H4: Kalıcı ACP bağlama
  - H4: Sohbetten ACP başlatma
  - H3: Çok ajanlı yönlendirme
  - H2: Kullanıcı başına ajan yalıtımı (Dinamik Ajan Oluşturma)
  - H3: Hızlı kurulum
  - H3: Nasıl çalışır
  - H3: Yapılandırma seçenekleri
  - H3: Oturum kapsamı
  - H3: Tipik çok kullanıcılı dağıtım
  - H3: Doğrulama
  - H3: Notlar
  - H2: Yapılandırma başvurusu
  - H2: Desteklenen mesaj türleri
  - H3: Alma
  - H3: Gönderme
  - H3: Diziler ve yanıtlar
  - H2: İlgili

## channels/googlechat.md

- Rota: /channels/googlechat
- Başlıklar:
  - H2: Kurulum
  - H2: Hızlı kurulum (başlangıç)
  - H2: Google Chat'e ekleme
  - H2: Genel URL (Yalnızca Webhook)
  - H3: Seçenek A: Tailscale Funnel (Önerilen)
  - H3: Seçenek B: Ters Proxy (Caddy)
  - H3: Seçenek C: Cloudflare Tunnel
  - H2: Nasıl çalışır
  - H2: Hedefler
  - H2: Yapılandırma öne çıkanları
  - H2: Sorun giderme
  - H3: 405 Method Not Allowed
  - H3: Diğer sorunlar
  - H2: İlgili

## channels/group-messages.md

- Rota: /channels/group-messages
- Başlıklar:
  - H2: Davranış
  - H2: Yapılandırma örneği (WhatsApp)
  - H3: Etkinleştirme komutu (yalnızca sahip)
  - H2: Nasıl kullanılır
  - H2: Test / doğrulama
  - H2: Bilinen değerlendirmeler
  - H2: İlgili

## channels/groups.md

- Rota: /channels/groups
- Başlıklar:
  - H2: Başlangıç tanıtımı (2 dakika)
  - H2: Görünür yanıtlar
  - H2: Bağlam görünürlüğü ve izin listeleri
  - H2: Oturum anahtarları
  - H2: Desen: kişisel DM'ler + genel gruplar (tek ajan)
  - H2: Görüntü etiketleri
  - H2: Grup ilkesi
  - H2: Bahsetme kapısı (varsayılan)
  - H2: Kapsam yapılandırılmış bahsetme desenleri
  - H2: Grup/kanal araç kısıtlamaları (isteğe bağlı)
  - H2: Grup izin listeleri
  - H2: Etkinleştirme (yalnızca sahip)
  - H2: Bağlam alanları
  - H2: iMessage'a özgü ayrıntılar
  - H2: WhatsApp sistem istemleri
  - H2: WhatsApp'a özgü ayrıntılar
  - H2: İlgili

## channels/imessage-from-bluebubbles.md

- Rota: /channels/imessage-from-bluebubbles
- Başlıklar:
  - H2: Geçiş kontrol listesi
  - H2: Bu geçiş ne zaman anlamlıdır
  - H2: imsg ne yapar
  - H2: Başlamadan önce
  - H2: Yapılandırma çevirisi
  - H2: Grup kayıt defteri tuzağı
  - H2: Adım adım
  - H2: Bir bakışta eylem denkliği
  - H2: Eşleştirme, oturumlar ve ACP bağlamaları
  - H2: Geri alma kanalı yok
  - H2: İlgili

## channels/imessage.md

- Rota: /channels/imessage
- Başlıklar:
  - H2: Hızlı kurulum
  - H2: Gereksinimler ve izinler (macOS)
  - H2: imsg özel API'sini etkinleştirme
  - H3: Kurulum
  - H3: SIP'yi devre dışı bırakamadığınızda
  - H2: Erişim denetimi ve yönlendirme
  - H2: ACP konuşma bağlamaları
  - H2: Dağıtım desenleri
  - H2: Medya, parçalara ayırma ve teslim hedefleri
  - H2: Özel API eylemleri
  - H2: Yapılandırma yazmaları
  - H2: Bölünmüş gönderimli DM'leri birleştirme (tek kompozisyonda komut + URL)
  - H3: Senaryolar ve ajanın gördükleri
  - H2: Köprü veya gateway yeniden başlatmasından sonra gelen kurtarma
  - H3: Operatöre görünür sinyal
  - H3: Geçiş
  - H2: Sorun giderme
  - H2: Yapılandırma başvurusu işaretçileri
  - H2: İlgili

## channels/index.md

- Rota: /channels
- Başlıklar:
  - H2: Teslim notları
  - H2: Desteklenen kanallar
  - H2: Notlar

## channels/irc.md

- Rota: /channels/irc
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Güvenlik varsayılanları
  - H2: Erişim denetimi
  - H3: Yaygın tuzak: allowFrom DM'ler içindir, kanallar için değil
  - H2: Yanıt tetikleme (bahsetmeler)
  - H2: Güvenlik notu (genel kanallar için önerilir)
  - H3: Kanaldaki herkes için aynı araçlar
  - H3: Gönderen başına farklı araçlar (sahip daha fazla yetki alır)
  - H2: NickServ
  - H2: Ortam değişkenleri
  - H2: Sorun giderme
  - H2: İlgili

## channels/line.md

- Rota: /channels/line
- Başlıklar:
  - H2: Yükleme
  - H2: Kurulum
  - H2: Yapılandırma
  - H2: Erişim denetimi
  - H2: İleti davranışı
  - H2: Kanal verileri (zengin iletiler)
  - H2: ACP desteği
  - H2: Giden medya
  - H2: Sorun giderme
  - H2: İlgili

## channels/location.md

- Rota: /channels/location
- Başlıklar:
  - H2: Metin biçimlendirme
  - H2: Bağlam alanları
  - H2: Kanal notları
  - H2: İlgili

## channels/matrix-migration.md

- Rota: /channels/matrix-migration
- Başlıklar:
  - H2: Geçişin otomatik olarak yaptıkları
  - H2: Geçişin otomatik olarak yapamadıkları
  - H2: Önerilen yükseltme akışı
  - H2: Şifreli geçişin nasıl çalıştığı
  - H2: Yaygın iletiler ve anlamları
  - H3: Yükseltme ve algılama iletileri
  - H3: Şifreli durum kurtarma iletileri
  - H3: Elle kurtarma iletileri
  - H3: Özel Plugin yükleme iletileri
  - H2: Şifreli geçmiş yine de geri gelmezse
  - H2: Gelecekteki iletiler için temiz başlamak isterseniz
  - H2: İlgili

## channels/matrix-presentation.md

- Rota: /channels/matrix-presentation
- Başlıklar:
  - H2: Olay içeriği
  - H2: Yedek davranış
  - H2: Desteklenen bloklar
  - H2: Etkileşimler
  - H2: Onay meta verileriyle ilişkisi
  - H2: Medya iletileri

## channels/matrix-push-rules.md

- Rota: /channels/matrix-push-rules
- Başlıklar:
  - H2: Ön koşullar
  - H2: Adımlar
  - H2: Çoklu bot notları
  - H2: Homeserver notları
  - H2: İlgili

## channels/matrix.md

- Rota: /channels/matrix
- Başlıklar:
  - H2: Yükleme
  - H2: Kurulum
  - H3: Etkileşimli kurulum
  - H3: En küçük yapılandırma
  - H3: Otomatik katılma
  - H3: İzin listesi hedef biçimleri
  - H3: Hesap kimliği normalleştirme
  - H3: Önbelleğe alınmış kimlik bilgileri
  - H3: Ortam değişkenleri
  - H2: Yapılandırma örneği
  - H2: Akış önizlemeleri
  - H2: Sesli iletiler
  - H2: Onay meta verileri
  - H3: Sessiz sonlandırılmış önizlemeler için kendi barındırılan anlık bildirim kuralları
  - H2: Botlar arası odalar
  - H2: Şifreleme ve doğrulama
  - H3: Şifrelemeyi etkinleştirme
  - H3: Durum ve güven sinyalleri
  - H3: Bu cihazı bir kurtarma anahtarıyla doğrulama
  - H3: Çapraz imzalamayı başlatma veya onarma
  - H3: Oda anahtarı yedeği
  - H3: Doğrulamaları listeleme, isteme ve yanıtlama
  - H3: Çoklu hesap notları
  - H2: Profil yönetimi
  - H2: Diziler
  - H3: Oturum yönlendirme (sessionScope)
  - H3: Yanıt dizileri (threadReplies)
  - H3: Dizi devralma ve slash komutları
  - H2: ACP konuşma bağlamaları
  - H3: Dizi bağlama yapılandırması
  - H2: Tepkiler
  - H2: Geçmiş bağlamı
  - H2: Bağlam görünürlüğü
  - H2: DM ve oda ilkesi
  - H2: Doğrudan oda onarımı
  - H2: Exec onayları
  - H2: Slash komutları
  - H2: Çoklu hesap
  - H2: Özel/LAN homeserver'lar
  - H2: Matrix trafiğini proxy üzerinden geçirme
  - H2: Hedef çözümleme
  - H2: Yapılandırma başvurusu
  - H3: Hesap ve bağlantı
  - H3: Şifreleme
  - H3: Erişim ve ilke
  - H3: Yanıt davranışı
  - H3: Tepki ayarları
  - H3: Araçlar ve oda bazlı geçersiz kılmalar
  - H3: Exec onay ayarları
  - H2: İlgili

## channels/mattermost.md

- Rota: /channels/mattermost
- Başlıklar:
  - H2: Yükleme
  - H2: Hızlı kurulum
  - H2: Yerel slash komutları
  - H2: Ortam değişkenleri (varsayılan hesap)
  - H2: Sohbet modları
  - H2: Diziler ve oturumlar
  - H2: Erişim denetimi (DM'ler)
  - H2: Kanallar (gruplar)
  - H2: Giden teslimat hedefleri
  - H2: DM kanalı yeniden denemesi
  - H2: Önizleme akışı
  - H2: Tepkiler (ileti aracı)
  - H2: Etkileşimli düğmeler (ileti aracı)
  - H3: Doğrudan API entegrasyonu (harici betikler)
  - H2: Dizin bağdaştırıcısı
  - H2: Çoklu hesap
  - H2: Sorun giderme
  - H2: İlgili

## channels/msteams.md

- Rota: /channels/msteams
- Başlıklar:
  - H2: Paketle gelen Plugin
  - H2: Hızlı kurulum
  - H2: Hedefler
  - H2: Yapılandırma yazmaları
  - H2: Erişim denetimi (DM'ler + gruplar)
  - H3: Nasıl çalışır
  - H3: 1. Adım: Azure Bot oluşturma
  - H3: 2. Adım: Kimlik bilgilerini alma
  - H3: 3. Adım: Mesajlaşma uç noktasını yapılandırma
  - H3: 4. Adım: Teams kanalını etkinleştirme
  - H3: 5. Adım: Teams uygulama manifestini oluşturma
  - H3: 6. Adım: OpenClaw'ı yapılandırma
  - H3: 7. Adım: Gateway'i çalıştırma
  - H2: Birleşik kimlik doğrulama (sertifika artı yönetilen kimlik)
  - H3: Seçenek A: Sertifika tabanlı kimlik doğrulama
  - H3: Seçenek B: Azure Managed Identity
  - H3: AKS Workload Identity kurulumu
  - H3: Kimlik doğrulama türü karşılaştırması
  - H2: Yerel geliştirme (tünelleme)
  - H2: Botu test etme
  - H2: Ortam değişkenleri
  - H2: Üye bilgisi eylemi
  - H2: Geçmiş bağlamı
  - H2: Geçerli Teams RSC izinleri (manifest)
  - H2: Örnek Teams manifesti (redakte edilmiş)
  - H3: Manifest uyarıları (olması gereken alanlar)
  - H3: Mevcut bir uygulamayı güncelleme
  - H2: Yetenekler: yalnızca RSC ve Graph karşılaştırması
  - H3: Yalnızca Teams RSC ile (uygulama yüklü, Graph API izni yok)
  - H3: Teams RSC + Microsoft Graph Application izinleri ile
  - H3: RSC ve Graph API karşılaştırması
  - H2: Graph etkin medya + geçmiş (kanallar için gerekli)
  - H2: Bilinen sınırlamalar
  - H3: Webhook zaman aşımları
  - H3: Teams bulutu ve hizmet URL'si desteği
  - H3: Biçimlendirme
  - H2: Yapılandırma
  - H2: Yönlendirme ve oturumlar
  - H2: Yanıt stili: diziler ve gönderiler
  - H3: Çözümleme önceliği
  - H3: Dizi bağlamını koruma
  - H2: Ekler ve görseller
  - H2: Grup sohbetlerinde dosya gönderme
  - H3: Grup sohbetlerinin neden SharePoint'e ihtiyaç duyduğu
  - H3: Kurulum
  - H3: Paylaşım davranışı
  - H3: Yedek davranış
  - H3: Dosyaların depolandığı konum
  - H2: Anketler (Adaptive Cards)
  - H2: Sunum kartları
  - H2: Hedef biçimleri
  - H2: Proaktif mesajlaşma
  - H2: Ekip ve Kanal kimlikleri (Yaygın Tuzak)
  - H2: Özel kanallar
  - H2: Sorun giderme
  - H3: Yaygın sorunlar
  - H3: Manifest yükleme hataları
  - H3: RSC izinleri çalışmıyor
  - H2: Başvurular
  - H2: İlgili

## channels/nextcloud-talk.md

- Rota: /channels/nextcloud-talk
- Başlıklar:
  - H2: Paketle gelen Plugin
  - H2: Hızlı kurulum (başlangıç)
  - H2: Notlar
  - H2: Erişim denetimi (DM'ler)
  - H2: Odalar (gruplar)
  - H2: Yetenekler
  - H2: Yapılandırma başvurusu (Nextcloud Talk)
  - H2: İlgili

## channels/nostr.md

- Rota: /channels/nostr
- Başlıklar:
  - H2: Paketle gelen Plugin
  - H3: Eski/özel yüklemeler
  - H3: Etkileşimsiz kurulum
  - H2: Hızlı kurulum
  - H2: Yapılandırma başvurusu
  - H2: Profil meta verileri
  - H2: Erişim denetimi
  - H3: DM ilkeleri
  - H3: İzin listesi örneği
  - H2: Anahtar biçimleri
  - H2: Aktarıcılar
  - H2: Protokol desteği
  - H2: Test
  - H3: Yerel aktarıcı
  - H3: Elle test
  - H2: Sorun giderme
  - H3: İletiler alınmıyor
  - H3: Yanıtlar gönderilmiyor
  - H3: Yinelenen yanıtlar
  - H2: Güvenlik
  - H2: Sınırlamalar (MVP)
  - H2: İlgili

## channels/pairing.md

- Rota: /channels/pairing
- Başlıklar:
  - H2: 1) DM eşleştirme (gelen sohbet erişimi)
  - H3: Bir göndericiyi onaylama
  - H3: Yeniden kullanılabilir gönderici grupları
  - H3: Durumun bulunduğu yer
  - H2: 2) Node cihaz eşleştirme (iOS/Android/macOS/başsız düğümler)
  - H3: Telegram üzerinden eşleştirme (iOS için önerilir)
  - H3: Bir Node cihazını onaylama
  - H3: İsteğe bağlı güvenilir CIDR Node otomatik onayı
  - H3: Node eşleştirme durumu depolaması
  - H3: Notlar
  - H2: İlgili belgeler

## channels/qa-channel.md

- Rota: /channels/qa-channel
- Başlıklar:
  - H2: Ne yapar
  - H2: Yapılandırma
  - H2: Çalıştırıcılar
  - H2: İlgili

## channels/qqbot.md

- Rota: /channels/qqbot
- Başlıklar:
  - H2: Yükleme
  - H2: Kurulum
  - H2: Yapılandırma
  - H3: Çoklu hesap kurulumu
  - H3: Grup sohbetleri
  - H3: Ses (STT / TTS)
  - H2: Hedef biçimleri
  - H2: Slash komutları
  - H2: Motor mimarisi
  - H2: QR kodla ilk katılım
  - H2: Sorun giderme
  - H2: İlgili

## channels/raft.md

- Rota: /channels/raft
- Başlıklar:
  - H2: Yükleme
  - H2: Ön koşullar
  - H2: Yapılandırma
  - H2: Nasıl Çalışır
  - H2: Doğrulama
  - H2: Sorun giderme
  - H2: Başvurular

## channels/signal.md

- Rota: /channels/signal
- Başlıklar:
  - H2: Ön koşullar
  - H2: Hızlı kurulum (başlangıç)
  - H2: Nedir
  - H2: Yapılandırma yazmaları
  - H2: Numara modeli (önemli)
  - H2: Kurulum yolu A: mevcut Signal hesabını bağlama (QR)
  - H2: Kurulum yolu B: özel bot numarası kaydetme (SMS, Linux)
  - H2: Harici daemon modu (httpUrl)
  - H2: Konteyner modu (bbernhard/signal-cli-rest-api)
  - H2: Erişim denetimi (DM'ler + gruplar)
  - H2: Nasıl çalışır (davranış)
  - H2: Medya + sınırlar
  - H2: Yazıyor göstergesi + okundu bilgileri
  - H2: Tepkiler (ileti aracı)
  - H2: Onay tepkileri
  - H2: Teslimat hedefleri (CLI/Cron)
  - H2: Sorun giderme
  - H2: Güvenlik notları
  - H2: Yapılandırma başvurusu (Signal)
  - H2: İlgili

## channels/slack.md

- Rota: /channels/slack
- Başlıklar:
  - H2: Socket Mode veya HTTP Request URL'lerini seçme
  - H3: Aktarma modu
  - H2: Yükleme
  - H2: Hızlı kurulum
  - H2: Socket Mode aktarım ayarlama
  - H2: Manifest ve kapsam kontrol listesi
  - H3: Ek manifest ayarları
  - H2: Token modeli
  - H2: Eylemler ve kapılar
  - H2: Erişim denetimi ve yönlendirme
  - H2: Diziler, oturumlar ve yanıt etiketleri
  - H2: Onay tepkileri
  - H3: Emoji (ackReaction)
  - H3: Kapsam (messages.ackReactionScope)
  - H2: Metin akışı
  - H2: Yazıyor tepkisi yedeği
  - H2: Medya, parçalara ayırma ve teslimat
  - H2: Komutlar ve slash davranışı
  - H2: Etkileşimli yanıtlar
  - H3: Plugin tarafından yönetilen modal gönderimleri
  - H2: Slack içinde yerel onaylar
  - H2: Olaylar ve operasyonel davranış
  - H2: Yapılandırma başvurusu
  - H2: Sorun giderme
  - H2: Ek görme başvurusu
  - H3: Desteklenen medya türleri
  - H3: Gelen işlem hattı
  - H3: Dizi kökü ek devralması
  - H3: Çoklu ek işleme
  - H3: Boyut, indirme ve model sınırları
  - H3: Bilinen sınırlar
  - H3: İlgili belgeler
  - H2: İlgili

## channels/sms.md

- Rota: /channels/sms
- Başlıklar:
  - H2: Başlamadan önce
  - H2: Hızlı Kurulum
  - H2: Yapılandırma Örnekleri
  - H3: Yapılandırma dosyası
  - H3: Ortam değişkenleri
  - H3: SecretRef kimlik doğrulama token'ı
  - H3: Yalnızca izin listeli özel numara
  - H3: Messaging Service göndericisi
  - H3: Varsayılan giden hedef
  - H2: Erişim denetimi
  - H2: SMS gönderme
  - H2: Kurulumu Doğrulama
  - H3: macOS iMessage/SMS üzerinden uçtan uca test
  - H2: Webhook güvenliği
  - H2: Çoklu hesap yapılandırması
  - H2: Sorun giderme
  - H3: Twilio 403 döndürüyor veya OpenClaw Webhook'u reddediyor
  - H3: Eşleştirme isteği görünmüyor
  - H3: Giden gönderimler başarısız oluyor
  - H3: İletiler geliyor ancak aracı yanıtlamıyor

## channels/synology-chat.md

- Rota: /channels/synology-chat
- Başlıklar:
  - H2: Paketle gelen Plugin
  - H2: Hızlı kurulum
  - H2: Ortam değişkenleri
  - H2: DM ilkesi ve erişim denetimi
  - H2: Giden teslimat
  - H2: Çoklu hesap
  - H2: Güvenlik notları
  - H2: Sorun giderme
  - H2: İlgili

## channels/telegram.md

- Rota: /channels/telegram
- Başlıklar:
  - H2: Hızlı kurulum
  - H2: Telegram tarafı ayarları
  - H2: Erişim denetimi ve etkinleştirme
  - H3: Grup bot kimliği
  - H2: Çalışma zamanı davranışı
  - H2: Özellik başvurusu
  - H2: Hata yanıtı denetimleri
  - H2: Sorun giderme
  - H2: Yapılandırma başvurusu
  - H2: İlgili

## channels/tlon.md

- Rota: /channels/tlon
- Başlıklar:
  - H2: Paketle gelen Plugin
  - H2: Kurulum
  - H2: Özel/LAN gemileri
  - H2: Grup kanalları
  - H2: Erişim denetimi
  - H2: Sahip ve onay sistemi
  - H2: Otomatik kabul ayarları
  - H2: Teslimat hedefleri (CLI/Cron)
  - H2: Paketle gelen skill
  - H2: Yetenekler
  - H2: Sorun giderme
  - H2: Yapılandırma başvurusu
  - H2: Notlar
  - H2: İlgili

## channels/troubleshooting.md

- Rota: /channels/troubleshooting
- Başlıklar:
  - H2: Komut merdiveni
  - H2: Bir güncellemeden sonra
  - H2: WhatsApp
  - H3: WhatsApp hata imzaları
  - H2: Telegram
  - H3: Telegram hata imzaları
  - H2: Discord
  - H3: Discord hata imzaları
  - H2: Slack
  - H3: Slack hata imzaları
  - H2: iMessage
  - H3: iMessage hata imzaları
  - H2: Signal
  - H3: Signal hata imzaları
  - H2: QQ Bot
  - H3: QQ Bot hata imzaları
  - H2: Matrix
  - H3: Matrix hata imzaları
  - H2: İlgili

## channels/twitch.md

- Rota: /channels/twitch
- Başlıklar:
  - H2: Paketle gelen Plugin
  - H2: Hızlı kurulum (başlangıç)
  - H2: Nedir
  - H2: Kurulum (ayrıntılı)
  - H3: Kimlik bilgileri oluşturma
  - H3: Botu yapılandırma
  - H3: Erişim denetimi (önerilir)
  - H2: Token yenileme (isteğe bağlı)
  - H2: Çoklu hesap desteği
  - H2: Erişim denetimi
  - H2: Sorun giderme
  - H2: Yapılandırma
  - H3: Hesap yapılandırması
  - H3: Sağlayıcı seçenekleri
  - H2: Araç eylemleri
  - H2: Güvenlik ve operasyonlar
  - H2: Sınırlar
  - H2: İlgili

## channels/wechat.md

- Rota: /channels/wechat
- Başlıklar:
  - H2: Adlandırma
  - H2: Nasıl çalışır
  - H2: Yükleme
  - H2: Oturum açma
  - H2: Erişim denetimi
  - H2: Uyumluluk
  - H2: Sidecar işlemi
  - H2: Sorun giderme
  - H2: İlgili dokümanlar

## channels/whatsapp.md

- Rota: /channels/whatsapp
- Başlıklar:
  - H2: Yükleme (isteğe bağlı)
  - H2: Hızlı kurulum
  - H2: Dağıtım kalıpları
  - H2: Çalışma zamanı modeli
  - H2: Onay istemleri
  - H2: Plugin kancaları ve gizlilik
  - H2: Erişim denetimi ve etkinleştirme
  - H2: Yapılandırılmış ACP bağlamaları
  - H2: Kişisel numara ve kendiyle sohbet davranışı
  - H2: İleti normalleştirme ve bağlam
  - H2: Teslim, parçalara ayırma ve medya
  - H2: Yanıt alıntılama
  - H2: Tepki seviyesi
  - H2: Alındı tepkileri
  - H2: Yaşam döngüsü durum tepkileri
  - H2: Çoklu hesap ve kimlik bilgileri
  - H2: Araçlar, eylemler ve yapılandırma yazmaları
  - H2: Sorun giderme
  - H2: Sistem istemleri
  - H2: Yapılandırma başvurusu işaretçileri
  - H2: İlgili

## channels/yuanbao.md

- Rota: /channels/yuanbao
- Başlıklar:
  - H2: Hızlı başlangıç
  - H3: Etkileşimli kurulum (alternatif)
  - H2: Erişim denetimi
  - H3: Doğrudan iletiler
  - H3: Grup sohbetleri
  - H2: Yapılandırma örnekleri
  - H3: Açık DM ilkesiyle temel kurulum
  - H3: DM'leri belirli kullanıcılarla sınırla
  - H3: Gruplarda @mention gereksinimini devre dışı bırak
  - H3: Giden ileti teslimini optimize et
  - H3: Metin birleştirme stratejisini ayarla
  - H2: Yaygın komutlar
  - H2: Sorun giderme
  - H3: Bot grup sohbetlerinde yanıt vermiyor
  - H3: Bot iletileri almıyor
  - H3: Bot boş veya yedek yanıtlar gönderiyor
  - H3: App Secret sızdı
  - H2: Gelişmiş yapılandırma
  - H3: Birden fazla hesap
  - H3: İleti sınırları
  - H3: Streaming
  - H3: Grup sohbeti geçmişi bağlamı
  - H3: Yanıtla modu
  - H3: Markdown ipucu enjeksiyonu
  - H3: Hata ayıklama modu
  - H3: Çoklu ajan yönlendirme
  - H2: Yapılandırma başvurusu
  - H2: Desteklenen ileti türleri
  - H3: Alma
  - H3: Gönderme
  - H3: Konular ve yanıtlar
  - H2: İlgili

## channels/zalo.md

- Rota: /channels/zalo
- Başlıklar:
  - H2: Paketle gelen Plugin
  - H2: Hızlı kurulum (başlangıç)
  - H2: Nedir
  - H2: Kurulum (hızlı yol)
  - H3: 1) Bot token'ı oluşturma (Zalo Bot Platform)
  - H3: 2) Token'ı yapılandırma (env veya config)
  - H2: Nasıl çalışır (davranış)
  - H2: Sınırlar
  - H2: Erişim denetimi (DM'ler)
  - H3: DM erişimi
  - H2: Erişim denetimi (Gruplar)
  - H2: Uzun yoklama ve Webhook
  - H2: Desteklenen ileti türleri
  - H2: Yetenekler
  - H2: Teslim hedefleri (CLI/Cron)
  - H2: Sorun giderme
  - H2: Yapılandırma başvurusu (Zalo)
  - H2: İlgili

## channels/zaloclawbot.md

- Rota: /channels/zaloclawbot
- Başlıklar:
  - H2: Uyumluluk
  - H2: Ön koşullar
  - H2: onboard ile yükleme (önerilir)
  - H2: Manuel Yükleme
  - H3: 1. Plugin'i yükleme
  - H3: 2. Plugin'i yapılandırmada etkinleştirme
  - H3: 3. QR kodu oluşturup oturum açma
  - H3: 4. Gateway'i yeniden başlatma
  - H2: Nasıl Çalışır
  - H2: Kaputun Altında
  - H2: Sorun giderme

## channels/zalouser.md

- Rota: /channels/zalouser
- Başlıklar:
  - H2: Paketle gelen Plugin
  - H2: Hızlı kurulum (başlangıç)
  - H2: Nedir
  - H2: Adlandırma
  - H2: Kimlikleri bulma (dizin)
  - H2: Sınırlar
  - H2: Erişim denetimi (DM'ler)
  - H2: Grup erişimi (isteğe bağlı)
  - H3: Grup mention geçidi
  - H2: Çoklu hesap
  - H2: Ortam değişkenleri
  - H2: Yazıyor göstergeleri, tepkiler ve teslim alındıları
  - H2: Sorun giderme
  - H2: İlgili

## ci.md

- Rota: /ci
- Başlıklar:
  - H2: Pipeline genel bakışı
  - H2: Hızlı hata sırası
  - H2: PR bağlamı ve kanıt
  - H2: Kapsam ve yönlendirme
  - H2: ClawSweeper etkinlik iletimi
  - H2: Manuel çalıştırmalar
  - H2: Runner'lar
  - H2: Runner kayıt bütçesi
  - H2: Yerel eşdeğerler
  - H2: OpenClaw Performansı
  - H2: Tam Sürüm Doğrulaması
  - H2: Canlı ve E2E shard'ları
  - H2: Paket Kabulü
  - H3: İşler
  - H3: Aday kaynaklar
  - H3: Suite profilleri
  - H3: Eski uyumluluk pencereleri
  - H3: Örnekler
  - H2: Yükleme smoke testi
  - H2: Yerel Docker E2E
  - H3: Ayarlanabilirler
  - H3: Yeniden kullanılabilir canlı/E2E workflow
  - H3: Sürüm yolu parçaları
  - H2: Plugin Ön Sürüm
  - H2: QA Lab
  - H2: CodeQL
  - H3: Güvenlik kategorileri
  - H3: Platforma özgü güvenlik shard'ları
  - H3: Kritik Kalite kategorileri
  - H2: Bakım workflow'ları
  - H3: Docs Agent
  - H3: Test Performance Agent
  - H3: Birleştirmeden Sonra Yinelenen PR'ler
  - H2: Yerel kontrol geçitleri ve değişiklik yönlendirmesi
  - H2: Testbox doğrulaması
  - H2: İlgili

## clawhub/cli.md

- Rota: /clawhub/cli
- Başlıklar:
  - H1: ClawHub CLI
  - H2: Keşfetme ve yükleme
  - H2: Yayınlama ve bakım
  - H2: İlgili

## clawhub/publishing.md

- Rota: /clawhub/publishing
- Başlıklar:
  - H1: ClawHub'da Yayınlama
  - H2: Sahipler
  - H2: Skills
  - H2: Plugins
  - H2: Sürüm Akışı
  - H2: SSS
  - H3: Paket kapsamı seçili sahiple eşleşmelidir

## cli/acp.md

- Rota: /cli/acp
- Başlıklar:
  - H2: Bu ne değildir
  - H2: Uyumluluk Matrisi
  - H2: Bilinen Sınırlamalar
  - H2: Kullanım
  - H2: ACP istemcisi (hata ayıklama)
  - H2: Protokol smoke testi
  - H2: Bunu nasıl kullanmalı
  - H2: Ajan seçme
  - H2: acpx'ten kullanma (Codex, Claude, diğer ACP istemcileri)
  - H2: Zed düzenleyici kurulumu
  - H2: Oturum eşleme
  - H2: Seçenekler
  - H3: acp istemci seçenekleri
  - H2: İlgili

## cli/agent.md

- Rota: /cli/agent
- Başlıklar:
  - H1: openclaw agent
  - H2: Seçenekler
  - H2: Örnekler
  - H2: Notlar
  - H2: JSON teslim durumu
  - H2: İlgili

## cli/agents.md

- Rota: /cli/agents
- Başlıklar:
  - H1: openclaw agents
  - H2: Örnekler
  - H2: Yönlendirme bağlamaları
  - H3: --bind biçimi
  - H3: Bağlama kapsamı davranışı
  - H2: Komut yüzeyi
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete
  - H2: Kimlik dosyaları
  - H2: Kimliği ayarla
  - H2: İlgili

## cli/approvals.md

- Rota: /cli/approvals
- Başlıklar:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: Yaygın komutlar
  - H2: Bir dosyadan onayları değiştirme
  - H2: "Never prompt" / YOLO örneği
  - H2: İzin listesi yardımcıları
  - H2: Yaygın seçenekler
  - H2: Notlar
  - H2: İlgili

## cli/attach.md

- Rota: /cli/attach
- Başlıklar: yok

## cli/backup.md

- Rota: /cli/backup
- Başlıklar:
  - H1: openclaw backup
  - H2: Notlar
  - H2: Neler yedeklenir
  - H2: Geçersiz yapılandırma davranışı
  - H2: Boyut ve performans
  - H2: İlgili

## cli/browser.md

- Rota: /cli/browser
- Başlıklar:
  - H1: openclaw browser
  - H2: Yaygın bayraklar
  - H2: Hızlı başlangıç (yerel)
  - H2: Hızlı sorun giderme
  - H2: Yaşam döngüsü
  - H2: Komut eksikse
  - H2: Profiller
  - H2: Sekmeler
  - H2: Anlık görüntü / ekran görüntüsü / eylemler
  - H2: Durum ve depolama
  - H2: Hata ayıklama
  - H2: MCP üzerinden mevcut Chrome
  - H2: Uzak tarayıcı denetimi (node host proxy)
  - H2: İlgili

## cli/channels.md

- Rota: /cli/channels
- Başlıklar:
  - H1: openclaw channels
  - H2: Yaygın komutlar
  - H2: Durum / yetenekler / çözümleme / günlükler
  - H2: Hesap ekleme / kaldırma
  - H2: Oturum açma ve kapatma (etkileşimli)
  - H2: Sorun giderme
  - H2: Yetenek yoklaması
  - H2: Adları kimliklere çözümleme
  - H2: İlgili

## cli/clawbot.md

- Rota: /cli/clawbot
- Başlıklar:
  - H1: openclaw clawbot
  - H2: Geçiş
  - H2: İlgili

## cli/commitments.md

- Rota: /cli/commitments
- Başlıklar:
  - H2: Kullanım
  - H2: Seçenekler
  - H2: Örnekler
  - H2: Çıktı
  - H2: İlgili

## cli/completion.md

- Rota: /cli/completion
- Başlıklar:
  - H1: openclaw completion
  - H2: Kullanım
  - H2: Seçenekler
  - H2: Notlar
  - H2: İlgili

## cli/config.md

- Rota: /cli/config
- Başlıklar:
  - H2: Kök seçenekler
  - H2: Örnekler
  - H3: config şeması
  - H3: Yollar
  - H2: Değerler
  - H2: config set modları
  - H2: config patch
  - H2: Sağlayıcı oluşturucu bayrakları
  - H2: Deneme çalıştırması
  - H3: JSON çıktı şekli
  - H2: Yazma güvenliği
  - H2: Alt komutlar
  - H2: Doğrulama
  - H2: İlgili

## cli/configure.md

- Rota: /cli/configure
- Başlıklar:
  - H1: openclaw configure
  - H2: Seçenekler
  - H2: Örnekler
  - H2: İlgili

## cli/crestodian.md

- Rota: /cli/crestodian
- Başlıklar:
  - H1: openclaw crestodian
  - H2: Crestodian'ın gösterdikleri
  - H2: Örnekler
  - H2: Güvenli başlatma
  - H2: İşlemler ve onay
  - H2: Kurulum bootstrap'i
  - H2: Model Destekli Planlayıcı
  - H2: Bir ajana geçme
  - H2: İleti kurtarma modu
  - H2: İlgili

## cli/cron.md

- Rota: /cli/cron
- Başlıklar:
  - H1: openclaw cron
  - H2: İşleri hızlı oluşturma
  - H2: Oturumlar
  - H2: Teslim
  - H3: Teslim sahipliği
  - H3: Hata teslimi
  - H2: Zamanlama
  - H3: Tek seferlik işler
  - H3: Yinelenen işler
  - H3: Manuel çalıştırmalar
  - H2: Modeller
  - H3: Yalıtılmış Cron modeli önceliği
  - H3: Hızlı mod
  - H3: Canlı model değiştirme yeniden denemeleri
  - H2: Çalıştırma çıktısı ve reddetmeler
  - H3: Bayat onay bastırma
  - H3: Sessiz token bastırma
  - H3: Yapılandırılmış reddetmeler
  - H2: Saklama
  - H2: Eski işleri taşıma
  - H2: Yaygın düzenlemeler
  - H2: Yaygın yönetici komutları
  - H2: İlgili

## cli/daemon.md

- Rota: /cli/daemon
- Başlıklar:
  - H1: openclaw daemon
  - H2: Kullanım
  - H2: Alt komutlar
  - H2: Yaygın seçenekler
  - H2: Tercih et
  - H2: İlgili

## cli/dashboard.md

- Rota: /cli/dashboard
- Başlıklar:
  - H1: openclaw dashboard
  - H2: İlgili

## cli/devices.md

- Rota: /cli/devices
- Başlıklar:
  - H1: openclaw devices
  - H2: Komutlar
  - H3: openclaw devices list
  - H3: openclaw devices remove
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Paperclip / openclawgateway ilk çalıştırma onayı
  - H3: openclaw devices reject
  - H3: openclaw devices rotate --device --role [--scope ]
  - H3: openclaw devices revoke --device --role
  - H2: Yaygın seçenekler
  - H2: Notlar
  - H2: Token drift kurtarma kontrol listesi
  - H2: İlgili

## cli/directory.md

- Rota: /cli/directory
- Başlıklar:
  - H1: openclaw directory
  - H2: Yaygın bayraklar
  - H2: Notlar
  - H2: Sonuçları ileti göndermeyle kullanma
  - H2: Kimlik biçimleri (kanala göre)
  - H2: Kendim ("me")
  - H2: Eşler (kişiler/kullanıcılar)
  - H2: Gruplar
  - H2: İlgili

## cli/dns.md

- Rota: /cli/dns
- Başlıklar:
  - H1: openclaw dns
  - H2: Kurulum
  - H2: dns setup
  - H2: İlgili

## cli/docs.md

- Rota: /cli/docs
- Başlıklar:
  - H1: openclaw docs
  - H2: Kullanım
  - H2: Örnekler
  - H2: Nasıl çalışır
  - H2: Çıktı
  - H2: Çıkış kodları
  - H2: İlgili

## cli/doctor.md

- Rota: /cli/doctor
- Başlıklar:
  - H1: openclaw doctor
  - H2: Neden Kullanılır
  - H2: Örnekler
  - H2: Seçenekler
  - H2: Lint modu
  - H2: Yapılandırılmış Sağlık Denetimleri
  - H2: Denetim Seçimi
  - H2: Yükseltme sonrası mod
  - H2: macOS: launchctl env geçersiz kılmaları
  - H2: İlgili

## cli/flows.md

- Rota: /cli/flows
- Başlıklar:
  - H1: openclaw tasks flow
  - H2: Alt komutlar
  - H3: Durum filtresi değerleri
  - H2: Örnekler
  - H2: İlgili

## cli/gateway.md

- Rota: /cli/gateway
- Başlıklar:
  - H2: Gateway'i çalıştırma
  - H3: Seçenekler
  - H2: Gateway'i yeniden başlatma
  - H3: Gateway profilleme
  - H2: Çalışan bir Gateway'i sorgulama
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: SSH üzerinden uzak (Mac uygulaması paritesi)
  - H3: gateway call
  - H2: Gateway hizmetini yönetme
  - H3: Bir wrapper ile yükleme
  - H2: Gateway'leri keşfetme (Bonjour)
  - H3: gateway discover
  - H2: İlgili

## cli/health.md

- Rota: /cli/health
- Başlıklar:
  - H1: openclaw health
  - H2: Seçenekler
  - H2: İlgili

## cli/hooks.md

- Rota: /cli/hooks
- Başlıklar:
  - H1: openclaw hooks
  - H2: Tüm hook'ları listele
  - H2: Hook bilgilerini al
  - H2: Hook uygunluğunu denetle
  - H2: Bir Hook'u etkinleştir
  - H2: Bir Hook'u devre dışı bırak
  - H2: Notlar
  - H2: Hook paketlerini kur
  - H2: Hook paketlerini güncelle
  - H2: Birlikte gelen hook'lar
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: İlgili

## cli/index.md

- Rota: /cli
- Başlıklar:
  - H2: Komut sayfaları
  - H2: Genel bayraklar
  - H2: Çıktı modları
  - H2: Komut ağacı
  - H2: Sohbet eğik çizgi komutları
  - H2: Kullanım takibi
  - H2: İlgili

## cli/infer.md

- Rota: /cli/infer
- Başlıklar:
  - H2: infer'i bir skill'e dönüştür
  - H2: Neden infer kullanılır
  - H2: Komut ağacı
  - H2: Yaygın görevler
  - H2: Davranış
  - H2: Model
  - H2: Görsel
  - H2: Ses
  - H2: TTS
  - H2: Video
  - H2: Web
  - H2: Gömme
  - H2: JSON çıktısı
  - H2: Yaygın tuzaklar
  - H2: Notlar
  - H2: İlgili

## cli/logs.md

- Rota: /cli/logs
- Başlıklar:
  - H1: openclaw logs
  - H2: Seçenekler
  - H2: Paylaşılan Gateway RPC seçenekleri
  - H2: Örnekler
  - H2: Notlar
  - H2: İlgili

## cli/mcp.md

- Rota: /cli/mcp
- Başlıklar:
  - H2: Doğru MCP yolunu seçin
  - H2: MCP sunucusu olarak OpenClaw
  - H3: serve ne zaman kullanılır
  - H3: Nasıl çalışır
  - H3: Bir istemci modu seçin
  - H3: serve neyi açığa çıkarır
  - H3: Kullanım
  - H3: Köprü araçları
  - H3: Olay modeli
  - H3: Claude kanal bildirimleri
  - H3: MCP istemci yapılandırması
  - H3: Seçenekler
  - H3: Güvenlik ve güven sınırı
  - H3: Test
  - H3: Sorun giderme
  - H2: MCP istemci kayıt defteri olarak OpenClaw
  - H3: Kaydedilmiş MCP sunucu tanımları
  - H3: Yaygın sunucu tarifleri
  - H3: JSON çıktı biçimleri
  - H3: Stdio taşıması
  - H3: SSE / HTTP taşıması
  - H3: OAuth iş akışı
  - H3: Akışlı HTTP taşıması
  - H2: Control UI
  - H2: Geçerli sınırlar
  - H2: İlgili

## cli/memory.md

- Rota: /cli/memory
- Başlıklar:
  - H1: openclaw memory
  - H2: Örnekler
  - H2: Seçenekler
  - H2: Dreaming
  - H2: İlgili

## cli/message.md

- Rota: /cli/message
- Başlıklar:
  - H1: openclaw message
  - H2: Kullanım
  - H2: Yaygın bayraklar
  - H2: SecretRef davranışı
  - H2: Eylemler
  - H3: Çekirdek
  - H3: İş parçacıkları
  - H3: Emojiler
  - H3: Çıkartmalar
  - H3: Roller / Kanallar / Üyeler / Ses
  - H3: Olaylar
  - H3: Moderasyon (Discord)
  - H3: Yayın
  - H2: Örnekler
  - H2: İlgili

## cli/migrate.md

- Rota: /cli/migrate
- Başlıklar:
  - H1: openclaw migrate
  - H2: Komutlar
  - H2: Güvenlik modeli
  - H2: Claude sağlayıcısı
  - H3: Claude neleri içe aktarır
  - H3: Arşiv ve manuel inceleme durumu
  - H2: Codex sağlayıcısı
  - H3: Codex neleri içe aktarır
  - H3: Manuel inceleme Codex durumu
  - H2: Hermes sağlayıcısı
  - H3: Hermes neleri içe aktarır
  - H3: Desteklenen .env anahtarları
  - H3: Yalnızca arşiv durumu
  - H3: Uyguladıktan sonra
  - H2: Plugin sözleşmesi
  - H2: Onboarding entegrasyonu
  - H2: İlgili

## cli/models.md

- Rota: /cli/models
- Başlıklar:
  - H1: openclaw models
  - H2: Yaygın komutlar
  - H3: Model taraması
  - H3: Model durumu
  - H2: Takma adlar + geri dönüşler
  - H2: Kimlik doğrulama profilleri
  - H2: İlgili

## cli/node.md

- Rota: /cli/node
- Başlıklar:
  - H1: openclaw node
  - H2: Neden bir Node ana makinesi kullanılır?
  - H2: Tarayıcı proxy'si (sıfır yapılandırma)
  - H2: Çalıştır (ön plan)
  - H2: Node ana makinesi için Gateway kimlik doğrulaması
  - H2: Servis (arka plan)
  - H2: Eşleştirme
  - H2: Exec onayları
  - H2: İlgili

## cli/nodes.md

- Rota: /cli/nodes
- Başlıklar:
  - H1: openclaw nodes
  - H2: Yaygın komutlar
  - H2: Çağır
  - H2: İlgili

## cli/onboard.md

- Rota: /cli/onboard
- Başlıklar:
  - H1: openclaw onboard
  - H2: İlgili kılavuzlar
  - H2: Örnekler
  - H2: Yerel ayar
  - H3: Etkileşimsiz Z.AI uç noktası seçenekleri
  - H2: Ek etkileşimsiz bayraklar
  - H2: Akış notları
  - H2: Yaygın takip komutları

## cli/pairing.md

- Rota: /cli/pairing
- Başlıklar:
  - H1: openclaw pairing
  - H2: Komutlar
  - H2: pairing list
  - H2: pairing approve
  - H2: Notlar
  - H2: İlgili

## cli/path.md

- Rota: /cli/path
- Başlıklar:
  - H1: openclaw path
  - H2: Neden kullanılır
  - H2: Nasıl kullanılır
  - H2: Nasıl çalışır
  - H2: Alt komutlar
  - H2: Genel bayraklar
  - H2: oc:// söz dizimi
  - H2: Dosya türüne göre adresleme
  - H2: Mutasyon sözleşmesi
  - H2: Örnekler
  - H2: Dosya türüne göre tarifler
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: Alt komut başvurusu
  - H3: resolve
  - H3: find
  - H3: set
  - H3: validate
  - H3: emit
  - H2: Çıkış kodları
  - H2: Çıktı modu
  - H2: Notlar
  - H2: İlgili

## cli/plugins.md

- Rota: /cli/plugins
- Başlıklar:
  - H2: Komutlar
  - H3: Yazar
  - H3: Sağlayıcı iskelesi
  - H3: Kur
  - H4: Marketplace kısaltması
  - H3: Listele
  - H3: Plugin dizini
  - H3: Kaldır
  - H3: Güncelle
  - H3: İncele
  - H3: Doctor
  - H3: Kayıt defteri
  - H3: Marketplace
  - H2: İlgili

## cli/policy.md

- Rota: /cli/policy
- Başlıklar:
  - H1: openclaw policy
  - H2: Hızlı başlangıç
  - H3: Politika kuralı başvurusu
  - H4: Kapsamlı katmanlar
  - H4: Kanallar
  - H4: MCP sunucuları
  - H4: Model sağlayıcıları
  - H4: Ağ
  - H4: Giriş ve kanal erişimi
  - H4: Gateway
  - H4: Aracı çalışma alanı
  - H4: Sandbox duruşu
  - H4: Veri İşleme
  - H4: Gizli bilgiler
  - H4: Exec onayları
  - H4: Kimlik doğrulama profilleri
  - H4: Araç meta verileri
  - H4: Araç duruşu
  - H2: Politikayı yapılandır
  - H2: Politika durumunu kabul et
  - H2: Bulgular
  - H2: Onar
  - H2: Çıkış kodları
  - H2: İlgili

## cli/proxy.md

- Rota: /cli/proxy
- Başlıklar:
  - H1: openclaw proxy
  - H2: Komutlar
  - H2: Doğrula
  - H2: Sorgu ön ayarları
  - H2: Notlar
  - H2: İlgili

## cli/qr.md

- Rota: /cli/qr
- Başlıklar:
  - H1: openclaw qr
  - H2: Kullanım
  - H2: Seçenekler
  - H2: Notlar
  - H2: İlgili

## cli/reset.md

- Rota: /cli/reset
- Başlıklar:
  - H1: openclaw reset
  - H2: İlgili

## cli/sandbox.md

- Rota: /cli/sandbox
- Başlıklar:
  - H2: Genel bakış
  - H2: Komutlar
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: Kullanım durumları
  - H3: Bir Docker imajını güncelledikten sonra
  - H3: Sandbox yapılandırmasını değiştirdikten sonra
  - H3: SSH hedefini veya SSH kimlik doğrulama materyalini değiştirdikten sonra
  - H3: OpenShell kaynağını, politikasını veya modunu değiştirdikten sonra
  - H3: setupCommand değiştirildikten sonra
  - H3: Yalnızca belirli bir aracı için
  - H2: Buna neden ihtiyaç var
  - H2: Kayıt defteri migrasyonu
  - H2: Yapılandırma
  - H2: İlgili

## cli/secrets.md

- Rota: /cli/secrets
- Başlıklar:
  - H1: openclaw secrets
  - H2: Çalışma zamanı anlık görüntüsünü yeniden yükle
  - H2: Denetim
  - H2: Yapılandır (etkileşimli yardımcı)
  - H2: Kaydedilmiş bir planı uygula
  - H2: Neden geri alma yedekleri yok
  - H2: Örnek
  - H2: İlgili

## cli/security.md

- Rota: /cli/security
- Başlıklar:
  - H1: openclaw security
  - H2: Denetim
  - H2: JSON çıktısı
  - H2: --fix neleri değiştirir
  - H2: İlgili

## cli/sessions.md

- Rota: /cli/sessions
- Başlıklar:
  - H1: openclaw sessions
  - H2: Temizlik bakımı
  - H2: Bir oturumu sıkıştır
  - H3: sessions.compact RPC
  - H2: İlgili

## cli/setup.md

- Rota: /cli/setup
- Başlıklar:
  - H1: openclaw setup
  - H2: Seçenekler
  - H3: Temel mod
  - H2: Örnekler
  - H2: Notlar
  - H2: İlgili

## cli/skills.md

- Rota: /cli/skills
- Başlıklar:
  - H1: openclaw skills
  - H2: Komutlar
  - H2: Skill Atölyesi
  - H2: İlgili

## cli/status.md

- Rota: /cli/status
- Başlıklar:
  - H2: İlgili

## cli/system.md

- Rota: /cli/system
- Başlıklar:
  - H1: openclaw system
  - H2: Yaygın komutlar
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: Notlar
  - H2: İlgili

## cli/tasks.md

- Rota: /cli/tasks
- Başlıklar:
  - H2: Kullanım
  - H2: Kök seçenekleri
  - H2: Alt komutlar
  - H3: list
  - H3: show
  - H3: notify
  - H3: cancel
  - H3: audit
  - H3: maintenance
  - H3: flow
  - H2: İlgili

## cli/transcripts.md

- Rota: /cli/transcripts
- Başlıklar:
  - H1: openclaw transcripts
  - H2: Komutlar
  - H2: Çıktı
  - H2: Günde birçok toplantı
  - H2: Eksik özetler
  - H2: Yapılandırma

## cli/tui.md

- Rota: /cli/tui
- Başlıklar:
  - H1: openclaw tui
  - H2: Seçenekler
  - H2: Örnekler
  - H2: Yapılandırma onarım döngüsü
  - H2: İlgili

## cli/uninstall.md

- Rota: /cli/uninstall
- Başlıklar:
  - H1: openclaw uninstall
  - H2: İlgili

## cli/update.md

- Rota: /cli/update
- Başlıklar:
  - H1: openclaw update
  - H2: Kullanım
  - H2: Seçenekler
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: Ne yapar
  - H3: Denetim düzlemi yanıt biçimi
  - H2: Git checkout akışı
  - H3: Kanal seçimi
  - H3: Güncelleme adımları
  - H2: --update kısaltması
  - H2: İlgili

## cli/voicecall.md

- Rota: /cli/voicecall
- Başlıklar:
  - H1: openclaw voicecall
  - H2: Alt komutlar
  - H2: Kurulum ve smoke
  - H3: setup
  - H3: smoke
  - H2: Çağrı yaşam döngüsü
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: Günlükler ve metrikler
  - H3: tail
  - H3: latency
  - H2: Webhook'ları açığa çıkarma
  - H3: expose
  - H2: İlgili

## cli/webhooks.md

- Rota: /cli/webhooks
- Başlıklar:
  - H1: openclaw webhooks
  - H2: Alt komutlar
  - H2: webhooks gmail setup
  - H3: Gerekli
  - H3: Pub/Sub seçenekleri
  - H3: OpenClaw teslim seçenekleri
  - H3: gog watch serve seçenekleri
  - H3: Tailscale açığa çıkarma
  - H3: Çıktı
  - H2: webhooks gmail run
  - H2: Uçtan uca akış
  - H2: İlgili

## cli/wiki.md

- Rota: /cli/wiki
- Başlıklar:
  - H1: openclaw wiki
  - H2: Ne için kullanılır
  - H2: Yaygın komutlar
  - H2: Komutlar
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest
  - H3: wiki okf import
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search
  - H3: wiki get
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: Pratik kullanım rehberi
  - H2: Yapılandırma bağlantıları
  - H2: İlgili

## cli/workboard.md

- Rota: /cli/workboard
- Başlıklar:
  - H2: Kullanım
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Eğik çizgi komutu eşdeğerliği
  - H2: İzinler
  - H2: Sorun giderme
  - H3: Hiç Kart Görünmüyor
  - H3: Dispatch Yalnızca Veri Diyor
  - H3: Dispatch Hiçbir Şey Başlatmıyor
  - H2: İlgili

## concepts/active-memory.md

- Rota: /concepts/active-memory
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Hız önerileri
  - H3: Cerebras kurulumu
  - H2: Nasıl görülür
  - H2: Oturum anahtarı
  - H2: Ne zaman çalışır
  - H2: Oturum türleri
  - H2: Nerede çalışır
  - H2: Neden kullanılır
  - H2: Nasıl çalışır
  - H2: Sorgu modları
  - H2: Prompt stilleri
  - H2: Model geri dönüş politikası
  - H2: Bellek araçları
  - H3: Yerleşik memory-core
  - H3: LanceDB belleği
  - H3: Lossless Claw
  - H2: Gelişmiş kaçış yolları
  - H2: Transkript kalıcılığı
  - H2: Yapılandırma
  - H2: Önerilen kurulum
  - H3: Soğuk başlatma toleransı
  - H2: Hata ayıklama
  - H2: Yaygın sorunlar
  - H2: İlgili sayfalar

## concepts/agent-loop.md

- Rota: /concepts/agent-loop
- Başlıklar:
  - H2: Giriş noktaları
  - H2: Nasıl çalışır (üst düzey)
  - H2: Kuyruğa alma + eşzamanlılık
  - H2: Oturum + çalışma alanı hazırlığı
  - H2: Prompt oluşturma + sistem prompt'u
  - H2: Hook noktaları (nerede araya girebilirsiniz)
  - H3: Dahili hook'lar (Gateway hook'ları)
  - H3: Plugin hook'ları (aracı + Gateway yaşam döngüsü)
  - H2: Akış + kısmi yanıtlar
  - H2: Araç yürütme + mesajlaşma araçları
  - H2: Yanıt biçimlendirme + bastırma
  - H2: Compaction + yeniden denemeler
  - H2: Olay akışları (bugün)
  - H2: Sohbet kanalı işleme
  - H2: Zaman aşımları
  - H2: İşlerin erken bitebileceği yerler
  - H2: İlgili

## concepts/agent-runtimes.md

- Rota: /concepts/agent-runtimes
- Başlıklar:
  - H2: Codex yüzeyleri
  - H2: Çalışma zamanı sahipliği
  - H2: Çalışma zamanı seçimi
  - H2: GitHub Copilot aracı çalışma zamanı
  - H2: Uyumluluk sözleşmesi
  - H2: Durum etiketleri
  - H2: İlgili

## concepts/agent-workspace.md

- Rota: /concepts/agent-workspace
- Başlıklar:
  - H2: Varsayılan konum
  - H2: Ek çalışma alanı klasörleri
  - H2: Çalışma alanı dosya haritası
  - H2: Çalışma alanında OLMAYANLAR
  - H2: Git yedeklemesi (önerilir, özel)
  - H2: Gizli bilgileri commit etmeyin
  - H2: Çalışma alanını yeni bir makineye taşıma
  - H2: Gelişmiş notlar
  - H2: İlgili

## concepts/agent.md

- Rota: /concepts/agent
- Başlıklar:
  - H2: Çalışma alanı (zorunlu)
  - H2: Bootstrap dosyaları (enjekte edilen)
  - H2: Yerleşik araçlar
  - H2: Skills
  - H2: Çalışma zamanı sınırları
  - H2: Oturumlar
  - H2: Akış sırasında yönlendirme
  - H2: Model referansları
  - H2: Yapılandırma (asgari)
  - H2: İlgili

## concepts/architecture.md

- Rota: /concepts/architecture
- Başlıklar:
  - H2: Genel bakış
  - H2: Bileşenler ve akışlar
  - H3: Gateway (daemon)
  - H3: İstemciler (Mac uygulaması / CLI / web yöneticisi)
  - H3: Düğümler (macOS / iOS / Android / headless)
  - H3: WebChat
  - H2: Bağlantı yaşam döngüsü (tek istemci)
  - H2: Kablo protokolü (özet)
  - H2: Eşleştirme + yerel güven
  - H2: Protokol tiplemesi ve kod üretimi
  - H2: Uzaktan erişim
  - H2: Operasyon anlık görünümü
  - H2: Değişmezler
  - H2: İlgili

## concepts/channel-docking.md

- Rota: /concepts/channel-docking
- Başlıklar:
  - H2: Örnek
  - H2: Neden kullanılır
  - H2: Gerekli yapılandırma
  - H2: Komutlar
  - H2: Neler değişir
  - H2: Neler değişmez
  - H2: Sorun giderme

## concepts/commitments.md

- Rota: /concepts/commitments
- Başlıklar:
  - H2: Taahhütleri etkinleştirme
  - H2: Nasıl çalışır
  - H2: Kapsam
  - H2: Taahhütler ve anımsatıcılar
  - H2: Taahhütleri yönetme
  - H2: Gizlilik ve maliyet
  - H2: Sorun giderme
  - H2: İlgili

## concepts/compaction.md

- Rota: /concepts/compaction
- Başlıklar:
  - H2: Nasıl çalışır
  - H2: Otomatik Compaction
  - H2: Manuel Compaction
  - H2: Yapılandırma
  - H3: Farklı bir model kullanma
  - H3: Tanımlayıcı koruma
  - H3: Etkin transkript bayt koruması
  - H3: Ardıl transkriptler
  - H3: Compaction bildirimleri
  - H3: Bellek boşaltma
  - H2: Takılabilir Compaction sağlayıcıları
  - H2: Compaction ve budama
  - H2: Sorun giderme
  - H2: İlgili

## concepts/context-engine.md

- Rota: /concepts/context-engine
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Nasıl çalışır
  - H3: Alt ajan yaşam döngüsü (isteğe bağlı)
  - H3: Sistem istemi eklemesi
  - H2: Eski motor
  - H2: Plugin motorları
  - H3: ContextEngine arayüzü
  - H3: Çalışma zamanı ayarları
  - H3: Ana makine gereksinimleri
  - H3: Hata yalıtımı
  - H3: ownsCompaction
  - H2: Yapılandırma referansı
  - H2: Compaction ve bellekle ilişki
  - H2: İpuçları
  - H2: İlgili

## concepts/context.md

- Rota: /concepts/context
- Başlıklar:
  - H2: Hızlı başlangıç (bağlamı inceleme)
  - H2: Örnek çıktı
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: Bağlam penceresine neler dahil edilir
  - H2: OpenClaw sistem istemini nasıl oluşturur
  - H2: Enjekte edilen çalışma alanı dosyaları (Proje Bağlamı)
  - H2: Skills: enjekte edilen ve isteğe bağlı yüklenen
  - H2: Araçlar: iki maliyet vardır
  - H2: Komutlar, yönergeler ve "satır içi kısayollar"
  - H2: Oturumlar, Compaction ve budama (neler kalıcı olur)
  - H2: /context gerçekte ne raporlar
  - H2: İlgili

## concepts/delegate-architecture.md

- Rota: /concepts/delegate-architecture
- Başlıklar:
  - H2: Delege nedir?
  - H2: Neden delegeler?
  - H2: Yetenek katmanları
  - H3: Katman 1: Salt Okunur + Taslak
  - H3: Katman 2: Adına Gönderme
  - H3: Katman 3: Proaktif
  - H2: Ön koşullar: yalıtım ve sağlamlaştırma
  - H3: Sert engeller (pazarlık konusu değil)
  - H3: Araç kısıtlamaları
  - H3: Sandbox yalıtımı
  - H3: Denetim izi
  - H2: Delege ayarlama
  - H3: 1. Delege ajanı oluşturma
  - H3: 2. Kimlik sağlayıcı delegasyonunu yapılandırma
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. Delegeyi kanallara bağlama
  - H3: 4. Delege ajana kimlik bilgileri ekleme
  - H2: Örnek: kurumsal asistan
  - H2: Ölçekleme deseni
  - H2: İlgili

## concepts/dreaming.md

- Rota: /concepts/dreaming
- Başlıklar:
  - H2: Dreaming neler yazar
  - H2: Aşama modeli
  - H2: Oturum transkripti alımı
  - H2: Rüya Günlüğü
  - H2: Derin sıralama sinyalleri
  - H2: QA gölge deneme raporu kapsamı
  - H2: Zamanlama
  - H2: Hızlı başlangıç
  - H2: Slash komutu
  - H2: CLI iş akışı
  - H2: Temel varsayılanlar
  - H2: Rüyalar kullanıcı arayüzü
  - H2: Dreaming hiç çalışmıyor: durum engellendi olarak görünüyor
  - H2: İlgili

## concepts/experimental-features.md

- Rota: /concepts/experimental-features
- Başlıklar:
  - H2: Şu anda belgelenen bayraklar
  - H2: Yerel model yalın modu
  - H3: Neden bu üç araç
  - H3: Ne zaman açılmalı
  - H3: Ne zaman kapalı bırakılmalı
  - H3: Etkinleştirme
  - H2: Deneysel, gizli anlamına gelmez
  - H2: İlgili

## concepts/features.md

- Rota: /concepts/features
- Başlıklar:
  - H2: Öne çıkanlar
  - H2: Tam liste
  - H2: İlgili

## concepts/mantis-slack-desktop-runbook.md

- Rota: /concepts/mantis-slack-desktop-runbook
- Başlıklar:
  - H2: Depolama modeli
  - H2: GitHub dispatch
  - H2: Yerel CLI
  - H2: Hydrate modları
  - H2: Zamanlama yorumu
  - H2: Kanıt kontrol listesi
  - H2: Hata işleme
  - H2: İlgili

## concepts/mantis.md

- Rota: /concepts/mantis
- Başlıklar:
  - H2: Hedefler
  - H2: Hedef olmayanlar
  - H2: Sahiplik
  - H2: Komut biçimi
  - H2: Çalıştırma yaşam döngüsü
  - H2: Discord MVP
  - H2: Mevcut QA parçaları
  - H2: Kanıt modeli
  - H2: Tarayıcı ve VNC
  - H2: Makineler
  - H2: Sırlar
  - H2: GitHub yapıtları ve PR yorumları
  - H2: Özel dağıtım notları
  - H2: Senaryo ekleme
  - H2: Sağlayıcı genişletme
  - H2: Açık sorular

## concepts/markdown-formatting.md

- Rota: /concepts/markdown-formatting
- Başlıklar:
  - H2: Hedefler
  - H2: İş hattı
  - H2: IR örneği
  - H2: Nerede kullanılır
  - H2: Tablo işleme
  - H2: Parçalama kuralları
  - H2: Bağlantı ilkesi
  - H2: Spoilerlar
  - H2: Kanal biçimlendirici ekleme veya güncelleme
  - H2: Yaygın dikkat edilmesi gerekenler
  - H2: İlgili

## concepts/memory-builtin.md

- Rota: /concepts/memory-builtin
- Başlıklar:
  - H2: Ne sağlar
  - H2: Başlarken
  - H2: Desteklenen embedding sağlayıcıları
  - H2: Dizinleme nasıl çalışır
  - H2: Ne zaman kullanılmalı
  - H2: Sorun giderme
  - H2: Yapılandırma
  - H2: İlgili

## concepts/memory-honcho.md

- Rota: /concepts/memory-honcho
- Başlıklar:
  - H2: Ne sağlar
  - H2: Kullanılabilir araçlar
  - H2: Başlarken
  - H2: Yapılandırma
  - H2: Mevcut belleği taşıma
  - H2: Nasıl çalışır
  - H2: Honcho ve yerleşik bellek
  - H2: CLI komutları
  - H2: Ek okumalar
  - H2: İlgili

## concepts/memory-qmd.md

- Rota: /concepts/memory-qmd
- Başlıklar:
  - H2: Yerleşik olana ek olarak neler getirir
  - H2: Başlarken
  - H3: Ön koşullar
  - H3: Etkinleştirme
  - H2: Sidecar nasıl çalışır
  - H2: Arama performansı ve uyumluluk
  - H2: Model geçersiz kılmaları
  - H2: Ek yolları dizinleme
  - H2: Oturum transkriptlerini dizinleme
  - H2: Arama kapsamı
  - H2: Alıntılar
  - H2: Ne zaman kullanılmalı
  - H2: Sorun giderme
  - H2: Yapılandırma
  - H2: İlgili

## concepts/memory-search.md

- Rota: /concepts/memory-search
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Desteklenen sağlayıcılar
  - H2: Arama nasıl çalışır
  - H2: Arama kalitesini iyileştirme
  - H3: Zamansal zayıflama
  - H3: MMR (çeşitlilik)
  - H3: İkisini de etkinleştirme
  - H2: Çok modlu bellek
  - H2: Oturum belleği araması
  - H2: Sorun giderme
  - H2: Ek okumalar
  - H2: İlgili

## concepts/memory.md

- Rota: /concepts/memory
- Başlıklar:
  - H2: Nasıl çalışır
  - H2: Ne nereye gider
  - H2: Eyleme duyarlı anılar
  - H2: Çıkarılan taahhütler
  - H2: Bellek araçları
  - H2: Bellek Wiki eşlikçi Plugin’i
  - H2: Bellek araması
  - H2: Bellek arka uçları
  - H2: Bilgi wiki katmanı
  - H2: Otomatik bellek boşaltma
  - H2: Dreaming
  - H2: Temellendirilmiş geriye dönük doldurma ve canlı yükseltme
  - H2: CLI
  - H2: Ek okumalar
  - H2: İlgili

## concepts/message-lifecycle-refactor.md

- Rota: /concepts/message-lifecycle-refactor
- Başlıklar:
  - H2: Sorunlar
  - H2: Hedefler
  - H2: Hedef olmayanlar
  - H2: Referans modeli
  - H2: Çekirdek model
  - H2: Mesaj terimleri
  - H3: Mesaj
  - H3: Hedef
  - H3: İlişki
  - H3: Köken
  - H3: Alındı bilgisi
  - H2: Alma bağlamı
  - H2: Gönderme bağlamı
  - H2: Canlı bağlam
  - H2: Adaptör yüzeyi
  - H2: Genel SDK azaltımı
  - H2: Kanal gelen akışıyla ilişki
  - H2: Uyumluluk korkulukları
  - H2: Dahili depolama
  - H2: Hata sınıfları
  - H2: Kanal eşleme
  - H2: Geçiş planı
  - H3: Aşama 1: Dahili Mesaj Alanı
  - H3: Aşama 2: Kalıcı Gönderme Çekirdeği
  - H3: Aşama 3: Kanal Gelen Köprüsü
  - H3: Aşama 4: Hazırlanmış Dispatcher Köprüsü
  - H3: Aşama 5: Birleşik Canlı Yaşam Döngüsü
  - H3: Aşama 6: Genel SDK
  - H3: Aşama 7: Tüm Gönderenler
  - H3: Aşama 8: Turn Adlı Uyumluluğu Kaldırma
  - H2: Test planı
  - H2: Açık sorular
  - H2: Kabul kriterleri
  - H2: İlgili

## concepts/messages.md

- Rota: /concepts/messages
- Başlıklar:
  - H2: Mesaj akışı (üst düzey)
  - H2: Gelen tekilleştirme
  - H2: Gelen debounce
  - H2: Oturumlar ve cihazlar
  - H2: Araç sonucu meta verileri
  - H2: Gelen gövdeleri ve geçmiş bağlamı
  - H2: Kuyruğa alma ve takipler
  - H2: Kanal çalıştırması sahipliği
  - H2: Akış, parçalama ve toplu işleme
  - H2: Akıl yürütme görünürlüğü ve tokenlar
  - H2: Önekler, iş parçacıkları ve yanıtlar
  - H2: Sessiz yanıtlar
  - H2: İlgili

## concepts/model-failover.md

- Rota: /concepts/model-failover
- Başlıklar:
  - H2: Çalışma zamanı akışı
  - H2: Seçim kaynağı ilkesi
  - H2: Kimlik doğrulama hatası atlama önbelleği
  - H2: Kullanıcıya görünen fallback bildirimleri
  - H2: Kimlik doğrulama depolaması (anahtarlar + OAuth)
  - H2: Profil kimlikleri
  - H2: Rotasyon sırası
  - H3: Oturum yapışkanlığı (önbellek dostu)
  - H3: OpenAI Codex aboneliği ve API anahtarı yedeği
  - H2: Cooldown’lar
  - H2: Faturalandırma devre dışı bırakmaları
  - H2: Model fallback’i
  - H3: Aday zinciri kuralları
  - H3: Hangi hatalar fallback’i ilerletir
  - H3: Cooldown atlama ve probe davranışı
  - H2: Oturum geçersiz kılmaları ve canlı model değiştirme
  - H2: Gözlemlenebilirlik ve hata özetleri
  - H2: İlgili yapılandırma

## concepts/model-providers.md

- Rota: /concepts/model-providers
- Başlıklar:
  - H2: Hızlı kurallar
  - H2: Plugin’e ait sağlayıcı davranışı
  - H2: API anahtarı rotasyonu
  - H2: Resmi sağlayıcı Plugin’leri
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: Diğer abonelik tarzı barındırılan seçenekler
  - H3: OpenCode
  - H3: Google Gemini (API anahtarı)
  - H3: Google Vertex ve Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: Diğer paketlenmiş sağlayıcı Plugin’leri
  - H4: Bilinmeye değer tuhaflıklar
  - H2: models.providers üzerinden sağlayıcılar (özel/temel URL)
  - H3: Moonshot AI (Kimi)
  - H3: Kimi coding
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (Uluslararası)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: Yerel proxy’ler (LM Studio, vLLM, LiteLLM vb.)
  - H2: CLI örnekleri
  - H2: İlgili

## concepts/models.md

- Rota: /concepts/models
- Başlıklar:
  - H2: Model seçimi nasıl çalışır
  - H2: Seçim kaynağı ve fallback davranışı
  - H2: Hızlı model ilkesi
  - H2: Onboarding (önerilir)
  - H2: Yapılandırma anahtarları (genel bakış)
  - H3: Güvenli allowlist düzenlemeleri
  - H2: "Modele izin verilmiyor" (ve yanıtlar neden durur)
  - H2: Sohbette model değiştirme (/model)
  - H2: CLI komutları
  - H3: models list
  - H3: models status
  - H2: Tarama (OpenRouter ücretsiz modelleri)
  - H2: Modeller kayıt defteri (models.json)
  - H2: İlgili

## concepts/multi-agent.md

- Rota: /concepts/multi-agent
- Başlıklar:
  - H2: "Tek ajan" nedir?
  - H2: Yollar (hızlı harita)
  - H3: Tek ajan modu (varsayılan)
  - H2: Ajan yardımcısı
  - H2: Hızlı başlangıç
  - H2: Birden çok ajan = birden çok kişi, birden çok kişilik
  - H2: Ajanlar arası QMD bellek araması
  - H2: Tek WhatsApp numarası, birden çok kişi (DM ayrımı)
  - H2: Yönlendirme kuralları (mesajlar ajanı nasıl seçer)
  - H2: Birden çok hesap / telefon numarası
  - H2: Kavramlar
  - H2: Platform örnekleri
  - H2: Yaygın desenler
  - H2: Ajan başına sandbox ve araç yapılandırması
  - H2: İlgili

## concepts/oauth.md

- Rota: /concepts/oauth
- Başlıklar:
  - H2: Token sink (neden var)
  - H2: Depolama (tokenların bulunduğu yer)
  - H2: Anthropic eski token uyumluluğu
  - H2: Anthropic Claude CLI geçişi
  - H2: OAuth değişimi (oturum açma nasıl çalışır)
  - H3: Anthropic setup-token
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: Yenileme + sona erme
  - H2: Birden çok hesap (profiller) + yönlendirme
  - H3: 1) Tercih edilen: ayrı ajanlar
  - H3: 2) Gelişmiş: tek ajanda birden çok profil
  - H2: İlgili

## concepts/parallel-specialist-lanes.md

- Rota: /concepts/parallel-specialist-lanes
- Başlıklar:
  - H2: İlk ilkeler
  - H2: Önerilen kullanıma alma
  - H3: Aşama 1: kulvar sözleşmeleri + arka planda ağır işler
  - H3: Aşama 2: öncelik ve eşzamanlılık kontrolleri
  - H3: Aşama 3: koordinatör / trafik denetleyici
  - H2: Minimal kulvar sözleşmesi şablonu
  - H2: İlgili

## concepts/personal-agent-benchmark-pack.md

- Rota: /concepts/personal-agent-benchmark-pack
- Başlıklar:
  - H2: Senaryolar
  - H2: Gizlilik Modeli
  - H2: Paketi Genişletme

## concepts/presence.md

- Rota: /concepts/presence
- Başlıklar:
  - H2: Varlık alanları (görünenler)
  - H2: Üreticiler (varlığın geldiği yerler)
  - H3: 1) Gateway öz girdisi
  - H3: 2) WebSocket bağlantısı
  - H4: Tek seferlik CLI komutları neden görünmez
  - H3: 3) system-event işaretleri
  - H3: 4) Node bağlanır (role: node)
  - H2: Birleştirme + yinelenenleri kaldırma kuralları (instanceId neden önemlidir)
  - H2: TTL ve sınırlı boyut
  - H2: Uzak/tünel notu (loopback IP'leri)
  - H2: Tüketiciler
  - H3: macOS Örnekler sekmesi
  - H2: Hata ayıklama ipuçları
  - H2: İlgili

## concepts/progress-drafts.md

- Rota: /concepts/progress-drafts
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Kullanıcıların gördükleri
  - H2: Bir mod seçme
  - H2: Etiketleri yapılandırma
  - H2: İlerleme satırlarını denetleme
  - H2: Kanal davranışı
  - H2: Sonlandırma
  - H2: Sorun giderme
  - H2: İlgili

## concepts/qa-e2e-automation.md

- Rota: /concepts/qa-e2e-automation
- Başlıklar:
  - H2: Komut yüzeyi
  - H2: Operatör akışı
  - H2: Canlı aktarım kapsamı
  - H2: Telegram, Discord, Slack ve WhatsApp QA başvurusu
  - H3: Paylaşılan CLI bayrakları
  - H3: Telegram QA
  - H3: Discord QA
  - H3: Slack QA
  - H4: Slack çalışma alanını kurma
  - H3: WhatsApp QA
  - H3: Convex kimlik bilgisi havuzu
  - H2: Depo destekli tohumlar
  - H2: Sağlayıcı taklit kulvarları
  - H2: Aktarım bağdaştırıcıları
  - H3: Kanal ekleme
  - H3: Senaryo yardımcı adları
  - H2: Raporlama
  - H2: İlgili belgeler

## concepts/qa-matrix.md

- Rota: /concepts/qa-matrix
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Kulvarın yaptığı iş
  - H2: CLI
  - H3: Ortak bayraklar
  - H3: Sağlayıcı bayrakları
  - H2: Profiller
  - H2: Senaryolar
  - H2: Ortam değişkenleri
  - H2: Çıktı yapıtları
  - H2: Önceliklendirme ipuçları
  - H2: Canlı aktarım sözleşmesi
  - H2: İlgili

## concepts/queue-steering.md

- Rota: /concepts/queue-steering
- Başlıklar:
  - H2: Çalışma zamanı sınırı
  - H2: Modlar
  - H2: Patlama örneği
  - H2: Kapsam
  - H2: Debounce
  - H2: İlgili

## concepts/queue.md

- Rota: /concepts/queue
- Başlıklar:
  - H2: Neden
  - H2: Nasıl çalışır
  - H2: Varsayılanlar
  - H2: Kuyruk modları
  - H2: Kuyruk seçenekleri
  - H2: Yönlendirme ve akış
  - H2: Öncelik sırası
  - H2: Oturum başına geçersiz kılmalar
  - H2: Kapsam ve garantiler
  - H2: Sorun giderme
  - H2: İlgili

## concepts/retry.md

- Rota: /concepts/retry
- Başlıklar:
  - H2: Hedefler
  - H2: Varsayılanlar
  - H2: Davranış
  - H3: Model sağlayıcıları
  - H3: Discord
  - H3: Telegram
  - H2: Yapılandırma
  - H2: Notlar
  - H2: İlgili

## concepts/session-pruning.md

- Rota: /concepts/session-pruning
- Başlıklar:
  - H2: Neden önemlidir
  - H2: Nasıl çalışır
  - H2: Eski görüntü temizliği
  - H2: Akıllı varsayılanlar
  - H2: Etkinleştirme veya devre dışı bırakma
  - H2: Budama ve Compaction karşılaştırması
  - H2: Ek okuma
  - H2: İlgili

## concepts/session-tool.md

- Rota: /concepts/session-tool
- Başlıklar:
  - H2: Kullanılabilir araçlar
  - H2: Oturumları listeleme ve okuma
  - H2: Oturumlar arası mesaj gönderme
  - H2: Durum ve orkestrasyon yardımcıları
  - H2: Alt ajanlar başlatma
  - H2: Görünürlük
  - H2: Ek okuma
  - H2: İlgili

## concepts/session.md

- Rota: /concepts/session
- Başlıklar:
  - H2: Mesajlar nasıl yönlendirilir
  - H2: DM yalıtımı
  - H3: Dock bağlantılı kanallar
  - H2: Oturum yaşam döngüsü
  - H2: Durumun yaşadığı yer
  - H2: Oturum bakımı
  - H2: Oturumları inceleme
  - H2: Ek okuma
  - H2: İlgili

## concepts/soul.md

- Rota: /concepts/soul
- Başlıklar:
  - H2: SOUL.md içinde neler bulunmalı
  - H2: Bu neden işe yarar
  - H2: Molty istemi
  - H2: İyi sonuç nasıl görünür
  - H2: Bir uyarı
  - H2: İlgili

## concepts/streaming.md

- Rota: /concepts/streaming
- Başlıklar:
  - H2: Blok akışı (kanal mesajları)
  - H3: Blok akışıyla medya teslimi
  - H2: Parçalara ayırma algoritması (düşük/yüksek sınırlar)
  - H2: Birleştirme (akışla iletilen blokları birleştir)
  - H2: Bloklar arasında insana benzer hızlandırma
  - H2: "Parçaları veya her şeyi akışla ilet"
  - H2: Önizleme akış modları
  - H3: Kanal eşlemesi
  - H3: Çalışma zamanı davranışı
  - H3: Araç ilerleme önizleme güncellemeleri
  - H3: Yorum ilerleme kulvarı
  - H2: İlgili

## concepts/system-prompt.md

- Rota: /concepts/system-prompt
- Başlıklar:
  - H2: Yapı
  - H2: İstem modları
  - H2: İstem anlık görüntüleri
  - H2: Çalışma alanı önyükleme enjeksiyonu
  - H2: Zaman işleme
  - H2: Skills
  - H2: Dokümantasyon
  - H2: İlgili

## concepts/timezone.md

- Rota: /concepts/timezone
- Başlıklar:
  - H2: Üç zaman dilimi yüzeyi
  - H2: Kullanıcı zaman dilimini ayarlama
  - H2: Ne zaman geçersiz kılınır
  - H2: İlgili

## concepts/typebox.md

- Rota: /concepts/typebox
- Başlıklar:
  - H2: Zihinsel model (30 saniye)
  - H2: Şemaların bulunduğu yer
  - H2: Geçerli işlem hattı
  - H2: Şemalar çalışma zamanında nasıl kullanılır
  - H2: Örnek çerçeveler
  - H2: Minimal istemci (Node.js)
  - H2: Çalışılmış örnek: bir yöntemi uçtan uca ekleme
  - H2: Swift kod üretimi davranışı
  - H2: Sürümleme + uyumluluk
  - H2: Şema kalıpları ve kuralları
  - H2: Canlı şema JSON'u
  - H2: Şemaları değiştirdiğinizde
  - H2: İlgili

## concepts/typing-indicators.md

- Rota: /concepts/typing-indicators
- Başlıklar:
  - H2: Varsayılanlar
  - H2: Modlar
  - H2: Yapılandırma
  - H2: Notlar
  - H2: İlgili

## concepts/usage-tracking.md

- Rota: /concepts/usage-tracking
- Başlıklar:
  - H2: Nedir
  - H2: Nerede görünür
  - H2: Varsayılan kullanım alt bilgisi modu
  - H3: Üç ayrı oturum durumu
  - H3: Öncelik sırası
  - H3: Sıfırlama ve kapatma karşılaştırması
  - H3: Açma/kapatma davranışı
  - H3: Yapılandırma
  - H2: Özel /usage tam alt bilgisi
  - H3: Şekil
  - H3: Sözleşme Yolları
  - H3: Fiiller
  - H3: Parça biçimleri
  - H3: Örnek
  - H2: Sağlayıcılar + kimlik bilgileri
  - H2: İlgili

## date-time.md

- Rota: /date-time
- Başlıklar:
  - H2: Mesaj zarfları (varsayılan olarak yerel)
  - H3: Örnekler
  - H2: Sistem istemi: geçerli tarih ve saat
  - H2: Sistem olayı satırları (varsayılan olarak yerel)
  - H3: Kullanıcı zaman dilimini + biçimi yapılandırma
  - H2: Saat biçimi algılama (otomatik)
  - H2: Araç yükleri + bağlayıcılar (ham sağlayıcı zamanı + normalleştirilmiş alanlar)
  - H2: İlgili belgeler

## debug/node-issue.md

- Rota: /debug/node-issue
- Başlıklar:
  - H1: Node + tsx "\\name is not a function" çökmesi
  - H2: Özet
  - H2: Ortam
  - H2: Yeniden üretim (yalnızca Node)
  - H2: Depoda minimal yeniden üretim
  - H2: Node sürümü denetimi
  - H2: Notlar / hipotez
  - H2: Regresyon geçmişi
  - H2: Geçici çözümler
  - H2: Başvurular
  - H2: Sonraki adımlar
  - H2: İlgili

## diagnostics/flags.md

- Rota: /diagnostics/flags
- Başlıklar:
  - H2: Nasıl çalışır
  - H2: Yapılandırma üzerinden etkinleştirme
  - H2: Ortam geçersiz kılması (tek seferlik)
  - H2: Profil çıkarma bayrakları
  - H2: Zaman çizelgesi yapıtları
  - H2: Günlüklerin gittiği yer
  - H2: Günlükleri ayıklama
  - H2: Notlar
  - H2: İlgili

## gateway/authentication.md

- Rota: /gateway/authentication
- Başlıklar:
  - H2: Önerilen kurulum (API anahtarı, herhangi bir sağlayıcı)
  - H2: Anthropic: Claude CLI ve token uyumluluğu
  - H2: Anthropic notu
  - H2: Model kimlik doğrulama durumunu denetleme
  - H2: API anahtarı rotasyon davranışı (Gateway)
  - H2: Gateway çalışırken sağlayıcı kimlik doğrulamasını kaldırma
  - H2: Hangi kimlik bilgisinin kullanılacağını denetleme
  - H3: OpenAI ve eski openai-codex kimlikleri
  - H3: Oturum açma sırasında (CLI)
  - H3: Oturum başına (sohbet komutu)
  - H3: Ajan başına (CLI geçersiz kılması)
  - H2: Sorun giderme
  - H3: "Kimlik bilgisi bulunamadı"
  - H3: Token süresi doluyor/doldu
  - H2: İlgili

## gateway/background-process.md

- Rota: /gateway/background-process
- Başlıklar:
  - H2: exec aracı
  - H2: Alt süreç köprüleme
  - H2: process aracı
  - H2: Örnekler
  - H2: İlgili

## gateway/bonjour.md

- Rota: /gateway/bonjour
- Başlıklar:
  - H2: Tailscale üzerinden geniş alan Bonjour (Unicast DNS-SD)
  - H3: Gateway yapılandırması (önerilir)
  - H3: Tek seferlik DNS sunucusu kurulumu (gateway ana makinesi)
  - H3: Tailscale DNS ayarları
  - H3: Gateway dinleyici güvenliği (önerilir)
  - H2: Neler duyurulur
  - H2: Hizmet türleri
  - H2: TXT anahtarları (gizli olmayan ipuçları)
  - H2: macOS'ta hata ayıklama
  - H2: Gateway günlüklerinde hata ayıklama
  - H2: iOS Node üzerinde hata ayıklama
  - H2: Bonjour ne zaman etkinleştirilmeli
  - H2: Bonjour ne zaman devre dışı bırakılmalı
  - H2: Docker püf noktaları
  - H2: Devre dışı Bonjour sorunlarını giderme
  - H2: Yaygın hata modları
  - H2: Kaçışlanmış örnek adları (\032)
  - H2: Etkinleştirme / devre dışı bırakma / yapılandırma
  - H2: İlgili belgeler

## gateway/bridge-protocol.md

- Rota: /gateway/bridge-protocol
- Başlıklar:
  - H2: Neden vardı
  - H2: Aktarım
  - H2: El sıkışma + eşleştirme
  - H2: Çerçeveler
  - H2: Exec yaşam döngüsü olayları
  - H2: Geçmiş tailnet kullanımı
  - H2: Sürümleme
  - H2: İlgili

## gateway/cli-backends.md

- Rota: /gateway/cli-backends
- Başlıklar:
  - H2: Yeni başlayanlara uygun hızlı başlangıç
  - H2: Yedek olarak kullanma
  - H2: Yapılandırmaya genel bakış
  - H3: Örnek yapılandırma
  - H2: Nasıl çalışır
  - H2: Oturumlar
  - H2: claude-cli oturumlarından yedek giriş
  - H2: Görüntüler (doğrudan geçiş)
  - H2: Girdiler / çıktılar
  - H2: Varsayılanlar (Plugin sahipli)
  - H2: Plugin sahipli varsayılanlar
  - H2: Yerel Compaction sahipliği
  - H2: Paket MCP katmanları
  - H2: Geçmişi yeniden besleme sınırı
  - H2: Sınırlamalar
  - H2: Sorun giderme
  - H2: İlgili

## gateway/config-agents.md

- Rota: /gateway/config-agents
- Başlıklar:
  - H2: Ajan varsayılanları
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: Ajan başına önyükleme profili geçersiz kılmaları
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: Bağlam bütçesi sahiplik haritası
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: Çalışma zamanı ilkesi
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: Blok akışı
  - H3: Yazıyor göstergeleri
  - H3: agents.defaults.sandbox
  - H3: agents.list (ajan başına geçersiz kılmalar)
  - H2: Çok ajanlı yönlendirme
  - H3: Bağlama eşleşme alanları
  - H3: Ajan başına erişim profilleri
  - H2: Oturum
  - H2: Mesajlar
  - H3: Yanıt öneki
  - H3: Onay tepkisi
  - H3: Gelen debounce
  - H3: TTS (metinden sese)
  - H2: Konuşma
  - H2: İlgili

## gateway/config-channels.md

- Rota: /gateway/config-channels
- Başlıklar:
  - H2: Kanallar
  - H3: DM ve grup erişimi
  - H3: Kanal modeli geçersiz kılmaları
  - H3: Kanal varsayılanları ve Heartbeat
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: Çoklu hesap (tüm kanallar)
  - H3: Diğer Plugin kanalları
  - H3: Grup sohbeti bahsetme kapısı
  - H4: DM geçmişi sınırları
  - H4: Kendiyle sohbet modu
  - H3: Komutlar (sohbet komutu işleme)
  - H2: İlgili

## gateway/config-tools.md

- Rota: /gateway/config-tools
- Başlıklar:
  - H2: Araçlar
  - H3: Araç profilleri
  - H3: Araç grupları
  - H3: Sandbox araç ilkesi içinde MCP ve plugin araçları
  - H3: tools.codeMode
  - H3: tools.allow / tools.deny
  - H3: tools.byProvider
  - H3: tools.toolsBySender
  - H3: tools.elevated
  - H3: tools.exec
  - H3: tools.loopDetection
  - H3: tools.web
  - H3: tools.media
  - H3: tools.agentToAgent
  - H3: tools.sessions
  - H3: tools.sessionsspawn
  - H3: tools.experimental
  - H3: agents.defaults.subagents
  - H2: Özel sağlayıcılar ve temel URL’ler
  - H3: Sağlayıcı alanı ayrıntıları
  - H3: Sağlayıcı örnekleri
  - H2: İlgili

## gateway/configuration-examples.md

- Rota: /gateway/configuration-examples
- Başlıklar:
  - H2: Hızlı başlangıç
  - H3: Mutlak minimum
  - H3: Önerilen başlangıç
  - H2: Genişletilmiş örnek (başlıca seçenekler)
  - H3: Symlink ile bağlanmış kardeş skill deposu
  - H2: Yaygın kalıplar
  - H3: Tek geçersiz kılma ile paylaşılan skill temeli
  - H3: Çok platformlu kurulum
  - H3: Güvenilir Node ağı otomatik onayı
  - H3: Güvenli DM modu (paylaşılan gelen kutusu / çok kullanıcılı DM’ler)
  - H3: Anthropic API anahtarı + MiniMax yedeği
  - H3: İş botu (kısıtlı erişim)
  - H3: Yalnızca yerel modeller
  - H2: İpuçları
  - H2: İlgili

## gateway/configuration-reference.md

- Rota: /gateway/configuration-reference
- Başlıklar:
  - H2: Kanallar
  - H2: Ajan varsayılanları, çoklu ajan, oturumlar ve iletiler
  - H2: Araçlar ve özel sağlayıcılar
  - H2: Modeller
  - H2: MCP
  - H2: Skills
  - H2: Plugin’ler
  - H3: Codex harness plugin yapılandırması
  - H2: Taahhütler
  - H2: Tarayıcı
  - H2: Arayüz
  - H2: Gateway
  - H3: OpenAI uyumlu uç noktalar
  - H3: Çoklu örnek yalıtımı
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Hook’lar
  - H3: Gmail entegrasyonu
  - H2: Canvas plugin ana makinesi
  - H2: Keşif
  - H3: mDNS (Bonjour)
  - H3: Geniş alan (DNS-SD)
  - H2: Ortam
  - H3: env (satır içi ortam değişkenleri)
  - H3: Ortam değişkeni yerine koyma
  - H2: Gizli bilgiler
  - H3: SecretRef
  - H3: Desteklenen kimlik bilgisi yüzeyi
  - H3: Gizli bilgi sağlayıcıları yapılandırması
  - H2: Kimlik doğrulama depolaması
  - H3: auth.cooldowns
  - H2: Günlükleme
  - H2: Tanılama
  - H2: Güncelleme
  - H2: ACP
  - H2: CLI
  - H2: Sihirbaz
  - H2: Kimlik
  - H2: Köprü (eski, kaldırıldı)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: Medya modeli şablon değişkenleri
  - H2: Yapılandırma eklemeleri ($include)
  - H2: İlgili

## gateway/configuration.md

- Rota: /gateway/configuration
- Başlıklar:
  - H2: Minimal yapılandırma
  - H2: Yapılandırmayı düzenleme
  - H2: Sıkı doğrulama
  - H2: Yaygın görevler
  - H2: Yapılandırma sıcak yeniden yükleme
  - H3: Yeniden yükleme modları
  - H3: Sıcak uygulananlar ve yeniden başlatma gerektirenler
  - H3: Yeniden yükleme planlaması
  - H2: Yapılandırma RPC’si (programlı güncellemeler)
  - H2: Ortam değişkenleri
  - H2: Tam başvuru
  - H2: İlgili

## gateway/diagnostics.md

- Rota: /gateway/diagnostics
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Sohbet komutu
  - H2: Dışa aktarmanın içerdikleri
  - H2: Gizlilik modeli
  - H2: Kararlılık kaydedici
  - H2: Kullanışlı seçenekler
  - H2: Tanılamayı devre dışı bırakma
  - H2: İlgili

## gateway/discovery.md

- Rota: /gateway/discovery
- Başlıklar:
  - H2: Terimler
  - H2: Neden hem doğrudan hem SSH tutuyoruz
  - H2: Keşif girdileri (istemciler gateway’in nerede olduğunu nasıl öğrenir)
  - H3: 1) Bonjour / DNS-SD keşfi
  - H4: Hizmet beacon ayrıntıları
  - H3: 2) Tailnet (ağlar arası)
  - H3: 3) Manuel / SSH hedefi
  - H2: Taşıma seçimi (istemci ilkesi)
  - H2: Eşleştirme + kimlik doğrulama (doğrudan taşıma)
  - H2: Bileşene göre sorumluluklar
  - H2: İlgili

## gateway/doctor.md

- Rota: /gateway/doctor
- Başlıklar:
  - H2: Hızlı başlangıç
  - H3: Headless ve otomasyon modları
  - H2: Salt okunur lint modu
  - H2: Yaptıkları (özet)
  - H2: Dreams arayüzü geri doldurma ve sıfırlama
  - H2: Ayrıntılı davranış ve gerekçe
  - H2: İlgili

## gateway/external-apps.md

- Rota: /gateway/external-apps
- Başlıklar:
  - H2: Bugün kullanılabilir olanlar
  - H2: Önerilen yol
  - H2: Uygulama kodu ve plugin kodu
  - H2: İlgili

## gateway/gateway-lock.md

- Rota: /gateway/gateway-lock
- Başlıklar:
  - H2: Neden
  - H2: Mekanizma
  - H2: Hata yüzeyi
  - H2: Operasyonel notlar
  - H2: İlgili

## gateway/health.md

- Rota: /gateway/health
- Başlıklar:
  - H2: Hızlı kontroller
  - H2: Derin tanılama
  - H2: Sağlık izleyici yapılandırması
  - H2: Çalışma süresi izleme
  - H3: İzleme hizmeti kurulum örnekleri
  - H2: Bir şey başarısız olduğunda
  - H2: Ayrılmış "health" komutu
  - H2: İlgili

## gateway/heartbeat.md

- Rota: /gateway/heartbeat
- Başlıklar:
  - H2: Hızlı başlangıç (başlangıç seviyesi)
  - H2: Varsayılanlar
  - H2: Heartbeat isteminin amacı
  - H2: Yanıt sözleşmesi
  - H2: Yapılandırma
  - H3: Kapsam ve öncelik
  - H3: Ajan başına Heartbeat’ler
  - H3: Aktif saat örneği
  - H3: 7/24 kurulum
  - H3: Çoklu hesap örneği
  - H3: Alan notları
  - H2: Teslim davranışı
  - H2: Görünürlük denetimleri
  - H3: Her bayrağın yaptığı
  - H3: Kanal başına ve hesap başına örnekler
  - H3: Yaygın kalıplar
  - H2: HEARTBEAT.md (isteğe bağlı)
  - H3: tasks: blokları
  - H3: Ajan HEARTBEAT.md dosyasını güncelleyebilir mi?
  - H2: Manuel uyandırma (isteğe bağlı)
  - H2: Akıl yürütme teslimi (isteğe bağlı)
  - H2: Maliyet farkındalığı
  - H2: Heartbeat sonrası bağlam taşması
  - H2: İlgili

## gateway/index.md

- Rota: /gateway
- Başlıklar:
  - H2: 5 dakikalık yerel başlatma
  - H2: Çalışma zamanı modeli
  - H2: OpenAI uyumlu uç noktalar
  - H3: Bağlantı noktası ve bağlama önceliği
  - H3: Sıcak yeniden yükleme modları
  - H2: Operatör komut kümesi
  - H2: Birden çok gateway (aynı ana makine)
  - H2: Uzaktan erişim
  - H2: Gözetim ve hizmet yaşam döngüsü
  - H2: Geliştirme profili hızlı yolu
  - H2: Protokol hızlı başvurusu (operatör görünümü)
  - H2: Operasyonel kontroller
  - H3: Canlılık
  - H3: Hazır olma
  - H3: Boşluk kurtarma
  - H2: Yaygın hata imzaları
  - H2: Güvenlik garantileri
  - H2: İlgili

## gateway/local-model-services.md

- Rota: /gateway/local-model-services
- Başlıklar:
  - H2: Nasıl çalışır
  - H2: Yapılandırma şekli
  - H2: Alanlar
  - H2: Inferrs örneği
  - H2: ds4 örneği
  - H2: Operasyonel notlar
  - H2: İlgili

## gateway/local-models.md

- Rota: /gateway/local-models
- Başlıklar:
  - H2: Donanım tabanı
  - H2: Bir arka uç seçin
  - H2: Önerilen: LM Studio + büyük yerel model (Responses API)
  - H3: Hibrit yapılandırma: barındırılan birincil, yerel yedek
  - H3: Barındırılan güvenlik ağıyla yerel öncelikli
  - H3: Bölgesel barındırma / veri yönlendirme
  - H2: Diğer OpenAI uyumlu yerel proxy’ler
  - H2: Daha küçük veya daha sıkı arka uçlar
  - H2: Sorun giderme
  - H2: İlgili

## gateway/logging.md

- Rota: /gateway/logging
- Başlıklar:
  - H1: Günlükleme
  - H2: Dosya tabanlı günlükleyici
  - H2: Konsol yakalama
  - H2: Redaksiyon
  - H2: Gateway WebSocket günlükleri
  - H3: WS günlük stili
  - H2: Konsol biçimlendirme (alt sistem günlükleme)
  - H2: İlgili

## gateway/multiple-gateways.md

- Rota: /gateway/multiple-gateways
- Başlıklar:
  - H2: En çok önerilen kurulum
  - H2: Rescue-Bot hızlı başlangıcı
  - H2: Bu neden çalışır
  - H2: --profile rescue onboard neyi değiştirir
  - H2: Genel çoklu gateway kurulumu
  - H2: Yalıtım kontrol listesi
  - H2: Bağlantı noktası eşlemesi (türetilmiş)
  - H2: Tarayıcı/CDP notları (yaygın hata kaynağı)
  - H2: Manuel env örneği
  - H2: Hızlı kontroller
  - H2: İlgili

## gateway/network-model.md

- Rota: /gateway/network-model
- Başlıklar:
  - H2: İlgili

## gateway/openai-http-api.md

- Rota: /gateway/openai-http-api
- Başlıklar:
  - H2: Kimlik doğrulama
  - H2: Güvenlik sınırı (önemli)
  - H2: Bu uç nokta ne zaman kullanılmalı
  - H2: Ajan öncelikli model sözleşmesi
  - H2: Uç noktayı etkinleştirme
  - H2: Uç noktayı devre dışı bırakma
  - H2: Oturum davranışı
  - H2: Bu yüzey neden önemlidir
  - H2: Model listesi ve ajan yönlendirme
  - H2: Akış (SSE)
  - H2: Sohbet aracı sözleşmesi
  - H3: Desteklenen istek alanları
  - H3: Desteklenmeyen varyantlar
  - H3: Akışsız araç yanıtı şekli
  - H3: Akışlı araç yanıtı şekli
  - H3: Araç takip döngüsü
  - H2: Open WebUI hızlı kurulumu
  - H2: Örnekler
  - H2: İlgili

## gateway/openresponses-http-api.md

- Rota: /gateway/openresponses-http-api
- Başlıklar:
  - H2: Kimlik doğrulama, güvenlik ve yönlendirme
  - H2: Oturum davranışı
  - H2: İstek şekli (desteklenen)
  - H2: Öğeler (girdi)
  - H3: message
  - H3: functioncalloutput (tur tabanlı araçlar)
  - H3: reasoning ve itemreference
  - H2: Araçlar (istemci tarafı işlev araçları)
  - H2: Görseller (inputimage)
  - H2: Dosyalar (inputfile)
  - H2: Dosya + görsel sınırları (yapılandırma)
  - H2: Akış (SSE)
  - H2: Kullanım
  - H2: Hatalar
  - H2: Örnekler
  - H2: İlgili

## gateway/openshell.md

- Rota: /gateway/openshell
- Başlıklar:
  - H2: Önkoşullar
  - H2: Hızlı başlangıç
  - H2: Çalışma alanı modları
  - H3: mirror
  - H3: remote
  - H3: Mod seçme
  - H2: Yapılandırma başvurusu
  - H2: Örnekler
  - H3: Minimal uzak kurulum
  - H3: GPU ile mirror modu
  - H3: Özel gateway ile ajan başına OpenShell
  - H2: Yaşam döngüsü yönetimi
  - H3: Ne zaman yeniden oluşturmalı
  - H2: Güvenlik sertleştirme
  - H2: Geçerli sınırlamalar
  - H2: Nasıl çalışır
  - H2: İlgili

## gateway/opentelemetry.md

- Rota: /gateway/opentelemetry
- Başlıklar:
  - H2: Birlikte nasıl çalışır
  - H2: Hızlı başlangıç
  - H2: Dışa aktarılan sinyaller
  - H2: Yapılandırma başvurusu
  - H3: Ortam değişkenleri
  - H2: Gizlilik ve içerik yakalama
  - H2: Örnekleme ve boşaltma
  - H2: Dışa aktarılan metrikler
  - H3: Model kullanımı
  - H3: İleti akışı
  - H3: Konuşma
  - H3: Kuyruklar ve oturumlar
  - H3: Oturum canlılık telemetrisi
  - H3: Harness yaşam döngüsü
  - H3: Araç yürütme
  - H3: Exec
  - H3: Tanılama iç ayrıntıları (bellek ve araç döngüsü)
  - H2: Dışa aktarılan span’ler
  - H2: Tanılama olay kataloğu
  - H2: Dışa aktarıcı olmadan
  - H2: Devre dışı bırakma
  - H2: İlgili

## gateway/operator-scopes.md

- Rota: /gateway/operator-scopes
- Başlıklar:
  - H2: Roller
  - H2: Kapsam düzeyleri
  - H2: Yöntem kapsamı yalnızca ilk kapıdır
  - H2: Cihaz eşleştirme onayları
  - H2: Node eşleştirme onayları
  - H2: Paylaşılan gizli anahtar kimlik doğrulaması

## gateway/pairing.md

- Rota: /gateway/pairing
- Başlıklar:
  - H2: Kavramlar
  - H2: Eşleştirme nasıl çalışır
  - H2: CLI iş akışı (headless dostu)
  - H2: API yüzeyi (gateway protokolü)
  - H2: Node komut kapılama (2026.3.31+)
  - H2: Node olay güven sınırları (2026.3.31+)
  - H2: Otomatik onay (macOS uygulaması)
  - H2: Güvenilir-CIDR cihaz otomatik onayı
  - H2: Meta veri yükseltme otomatik onayı
  - H2: QR eşleştirme yardımcıları
  - H2: Yerellik ve iletilmiş başlıklar
  - H2: Depolama (yerel, özel)
  - H2: Taşıma davranışı
  - H2: İlgili

## gateway/prometheus.md

- Rota: /gateway/prometheus
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Dışa aktarılan metrikler
  - H2: Etiket ilkesi
  - H2: PromQL tarifleri
  - H2: Prometheus ve OpenTelemetry dışa aktarımı arasında seçim
  - H2: Sorun giderme
  - H2: İlgili

## gateway/protocol.md

- Rota: /gateway/protocol
- Başlıklar:
  - H2: Taşıma
  - H2: El sıkışma (bağlanma)
  - H3: Node örneği
  - H2: Çerçeveleme
  - H2: Roller + kapsamlar
  - H3: Roller
  - H3: Kapsamlar (operatör)
  - H3: Yetenekler/komutlar/izinler (Node)
  - H2: Varlık
  - H3: Node arka planda canlı olayı
  - H2: Yayın olayı kapsam belirleme
  - H2: Yaygın RPC yöntem aileleri
  - H3: Yaygın olay aileleri
  - H3: Node yardımcı yöntemleri
  - H3: Görev defteri RPC’leri
  - H3: Operatör yardımcı yöntemleri
  - H3: models.list görünümleri
  - H2: Exec onayları
  - H2: Ajan teslimi yedeği
  - H2: Sürümleme
  - H3: İstemci sabitleri
  - H2: Kimlik doğrulama
  - H2: Cihaz kimliği + eşleştirme
  - H3: Cihaz kimlik doğrulama geçiş tanılaması
  - H2: TLS + pinleme
  - H2: Kapsam
  - H2: İlgili

## gateway/remote-gateway-readme.md

- Rota: /gateway/remote-gateway-readme
- Başlıklar:
  - H1: OpenClaw.app’i Uzak Gateway ile Çalıştırma
  - H2: Genel bakış
  - H2: Hızlı kurulum
  - H3: Adım 1: SSH Config ekleyin
  - H3: Adım 2: SSH Key’i kopyalayın
  - H3: Adım 3: Uzak Gateway kimlik doğrulamasını yapılandırın
  - H3: Adım 4: SSH Tunnel’ı başlatın
  - H3: Adım 5: OpenClaw.app’i yeniden başlatın
  - H2: Oturum açıldığında tüneli otomatik başlatma
  - H3: PLIST dosyasını oluşturun
  - H3: Launch Agent’ı yükleyin
  - H2: Sorun giderme
  - H2: Nasıl çalışır
  - H2: İlgili

## gateway/remote.md

- Rota: /gateway/remote
- Başlıklar:
  - H2: Temel fikir
  - H2: Yaygın VPN ve tailnet kurulumları
  - H3: Tailnet’inizde her zaman açık Gateway
  - H3: Ev masaüstü Gateway’i çalıştırır
  - H3: Dizüstü bilgisayar Gateway’i çalıştırır
  - H2: Komut akışı (nerede ne çalışır)
  - H2: SSH tüneli (CLI + araçlar)
  - H2: CLI uzak varsayılanları
  - H2: Kimlik bilgisi önceliği
  - H2: Sohbet kullanıcı arayüzü uzak erişimi
  - H2: macOS uygulaması uzak modu
  - H2: Güvenlik kuralları (uzak/VPN)
  - H3: macOS: LaunchAgent ile kalıcı SSH tüneli
  - H4: Adım 1: SSH yapılandırması ekleyin
  - H4: Adım 2: SSH anahtarını kopyalayın (tek seferlik)
  - H4: Adım 3: Gateway belirtecini yapılandırın
  - H4: Adım 4: LaunchAgent oluşturun
  - H4: Adım 5: LaunchAgent’ı yükleyin
  - H4: Sorun giderme
  - H2: İlgili

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- Rota: /gateway/sandbox-vs-tool-policy-vs-elevated
- Başlıklar:
  - H2: Hızlı hata ayıklama
  - H2: Korumalı alan: araçların nerede çalıştığı
  - H3: Bağlama noktaları (hızlı güvenlik kontrolü)
  - H2: Araç ilkesi: hangi araçların mevcut/çağrılabilir olduğu
  - H3: Araç grupları (kısaltmalar)
  - H2: Yükseltilmiş: yalnızca exec "ana makinede çalıştır"
  - H2: Yaygın "korumalı alan hapishanesi" düzeltmeleri
  - H3: "Araç X, korumalı alan araç ilkesi tarafından engellendi"
  - H3: "Bunun ana ortam olduğunu sanıyordum, neden korumalı alanda?"
  - H2: İlgili

## gateway/sandboxing.md

- Rota: /gateway/sandboxing
- Başlıklar:
  - H2: Korumalı alana alınanlar
  - H2: Modlar
  - H2: Kapsam
  - H2: Arka uç
  - H3: Arka uç seçme
  - H3: Docker arka ucu
  - H3: SSH arka ucu
  - H3: OpenShell arka ucu
  - H4: Çalışma alanı modları
  - H4: OpenShell yaşam döngüsü
  - H2: Çalışma alanı erişimi
  - H2: Özel bağlama noktaları
  - H2: İmajlar ve kurulum
  - H2: setupCommand (tek seferlik kapsayıcı kurulumu)
  - H2: Araç ilkesi ve çıkış yolları
  - H2: Çoklu ajan geçersiz kılmaları
  - H2: En küçük etkinleştirme örneği
  - H2: İlgili

## gateway/secrets-plan-contract.md

- Rota: /gateway/secrets-plan-contract
- Başlıklar:
  - H2: Plan dosyası biçimi
  - H2: Sağlayıcı upsert’leri ve silmeleri
  - H2: Desteklenen hedef kapsamı
  - H2: Hedef türü davranışı
  - H2: Yol doğrulama kuralları
  - H2: Hata davranışı
  - H2: Exec sağlayıcısı onay davranışı
  - H2: Çalışma zamanı ve denetim kapsamı notları
  - H2: Operatör kontrolleri
  - H2: İlgili belgeler

## gateway/secrets.md

- Rota: /gateway/secrets
- Başlıklar:
  - H2: Hedefler ve çalışma zamanı modeli
  - H2: Ajan erişim sınırı
  - H2: Etkin yüzey filtreleme
  - H2: Gateway kimlik doğrulama yüzeyi tanılamaları
  - H2: Onboarding referansı ön kontrolü
  - H2: SecretRef sözleşmesi
  - H2: Sağlayıcı yapılandırması
  - H2: Dosya destekli API anahtarları
  - H2: Exec entegrasyon örnekleri
  - H2: MCP sunucusu ortam değişkenleri
  - H2: Korumalı alan SSH kimlik doğrulama materyali
  - H2: Desteklenen kimlik bilgisi yüzeyi
  - H2: Gerekli davranış ve öncelik
  - H2: Etkinleştirme tetikleyicileri
  - H2: Bozulmuş ve toparlanmış sinyaller
  - H2: Komut yolu çözümleme
  - H2: Denetim ve yapılandırma iş akışı
  - H2: Tek yönlü güvenlik ilkesi
  - H2: Eski kimlik doğrulama uyumluluk notları
  - H2: Web kullanıcı arayüzü notu
  - H2: İlgili

## gateway/security/audit-checks.md

- Rota: /gateway/security/audit-checks
- Başlıklar:
  - H2: İlgili

## gateway/security/exposure-runbook.md

- Rota: /gateway/security/exposure-runbook
- Başlıklar:
  - H2: Maruz kalma desenini seçin
  - H2: Ön uçuş envanteri
  - H2: Temel kontroller
  - H2: En düşük güvenli temel
  - H2: DM ve grup maruziyeti
  - H2: Ters proxy kontrolleri
  - H2: Araç ve korumalı alan incelemesi
  - H2: Değişiklik sonrası doğrulama
  - H2: Geri alma planı
  - H2: İnceleme kontrol listesi

## gateway/security/index.md

- Rota: /gateway/security
- Başlıklar:
  - H2: Önce kapsam: kişisel asistan güvenlik modeli
  - H2: Hızlı kontrol: openclaw security audit
  - H3: Yayınlanan paket bağımlılığı kilidi
  - H3: Dağıtım ve ana makine güveni
  - H3: Güvenli dosya işlemleri
  - H3: Paylaşılan Slack çalışma alanı: gerçek risk
  - H3: Şirket tarafından paylaşılan ajan: kabul edilebilir desen
  - H2: Gateway ve Node güven kavramı
  - H2: Güven sınırı matrisi
  - H2: Tasarım gereği güvenlik açığı olmayanlar
  - H2: 60 saniyede sertleştirilmiş temel
  - H2: Paylaşılan gelen kutusu hızlı kuralı
  - H2: Bağlam görünürlüğü modeli
  - H2: Denetimin kontrol ettikleri (üst düzey)
  - H2: Kimlik bilgisi depolama haritası
  - H2: Güvenlik denetimi kontrol listesi
  - H2: Güvenlik denetimi sözlüğü
  - H2: HTTP üzerinden Control UI
  - H2: Güvensiz veya tehlikeli bayraklar özeti
  - H2: Ters proxy yapılandırması
  - H2: HSTS ve kaynak notları
  - H2: Yerel oturum günlükleri diskte yaşar
  - H2: Node yürütmesi (system.run)
  - H2: Dinamik Skills (izleyici / uzak Node’lar)
  - H2: Tehdit modeli
  - H2: Temel kavram: zekadan önce erişim denetimi
  - H2: Komut yetkilendirme modeli
  - H2: Denetim düzlemi araçları riski
  - H2: Plugin’ler
  - H2: DM erişim modeli: eşleştirme, izin listesi, açık, devre dışı
  - H2: DM oturumu yalıtımı (çok kullanıcılı mod)
  - H3: Güvenli DM modu (önerilen)
  - H2: DM’ler ve gruplar için izin listeleri
  - H2: Prompt enjeksiyonu (nedir, neden önemlidir)
  - H2: Harici içerik özel belirteç temizleme
  - H2: Güvensiz harici içerik atlama bayrakları
  - H3: Prompt enjeksiyonu herkese açık DM’ler gerektirmez
  - H3: Kendi barındırılan LLM arka uçları
  - H3: Model gücü (güvenlik notu)
  - H2: Gruplarda akıl yürütme ve ayrıntılı çıktı
  - H2: Yapılandırma sertleştirme örnekleri
  - H3: Dosya izinleri
  - H3: Ağ maruziyeti (bağlama, bağlantı noktası, güvenlik duvarı)
  - H3: UFW ile Docker bağlantı noktası yayımlama
  - H3: mDNS/Bonjour keşfi
  - H3: Gateway WebSocket’i kilitleyin (yerel kimlik doğrulama)
  - H3: Tailscale Serve kimlik üstbilgileri
  - H3: Node ana makinesi üzerinden tarayıcı denetimi (önerilen)
  - H3: Diskteki gizli bilgiler
  - H3: Çalışma alanı .env dosyaları
  - H3: Günlükler ve transkriptler (redaksiyon ve saklama)
  - H3: DM’ler: varsayılan olarak eşleştirme
  - H3: Gruplar: her yerde bahsetme gerektir
  - H3: Ayrı numaralar (WhatsApp, Signal, Telegram)
  - H3: Salt okunur mod (korumalı alan ve araçlar üzerinden)
  - H3: Güvenli temel (kopyala/yapıştır)
  - H2: Korumalı alana alma (önerilen)
  - H3: Alt ajan devretme güvenlik sınırı
  - H2: Tarayıcı denetimi riskleri
  - H3: Tarayıcı SSRF ilkesi (varsayılan olarak katı)
  - H2: Ajan başına erişim profilleri (çoklu ajan)
  - H3: Örnek: tam erişim (korumalı alan yok)
  - H3: Örnek: salt okunur araçlar + salt okunur çalışma alanı
  - H3: Örnek: dosya sistemi/kabuk erişimi yok (sağlayıcı mesajlaşmasına izin verilir)
  - H2: Olay müdahalesi
  - H3: Sınırla
  - H3: Döndür (gizli bilgiler sızdıysa ele geçirilmiş varsayın)
  - H3: Denetle
  - H3: Rapor için topla
  - H2: Gizli bilgi tarama
  - H2: Güvenlik sorunlarını bildirme

## gateway/security/secure-file-operations.md

- Rota: /gateway/security/secure-file-operations
- Başlıklar:
  - H2: Varsayılan: Python yardımcısı yok
  - H2: Python olmadan korunanlar
  - H2: Python’un ekledikleri
  - H2: Plugin ve çekirdek rehberliği

## gateway/security/shrinkwrap.md

- Rota: /gateway/security/shrinkwrap
- Başlıklar:
  - H2: Kolay sürüm
  - H2: OpenClaw neden bunu kullanır
  - H2: Teknik ayrıntılar

## gateway/tailscale.md

- Rota: /gateway/tailscale
- Başlıklar:
  - H2: Modlar
  - H2: Kimlik doğrulama
  - H2: Yapılandırma örnekleri
  - H3: Yalnızca tailnet (Serve)
  - H3: Yalnızca tailnet (Tailnet IP’sine bağla)
  - H3: Herkese açık internet (Funnel + paylaşılan parola)
  - H2: CLI örnekleri
  - H2: Notlar
  - H2: Tarayıcı denetimi (uzak Gateway + yerel tarayıcı)
  - H2: Tailscale önkoşulları + sınırlar
  - H2: Daha fazla bilgi
  - H2: İlgili

## gateway/tools-invoke-http-api.md

- Rota: /gateway/tools-invoke-http-api
- Başlıklar:
  - H2: Kimlik doğrulama
  - H2: Güvenlik sınırı (önemli)
  - H2: İstek gövdesi
  - H2: İlke + yönlendirme davranışı
  - H2: Yanıtlar
  - H2: Örnek
  - H2: İlgili

## gateway/troubleshooting.md

- Rota: /gateway/troubleshooting
- Başlıklar:
  - H2: Komut merdiveni
  - H2: Bir güncellemeden sonra
  - H2: Bölünmüş beyin kurulumları ve daha yeni yapılandırma koruması
  - H2: Geri alma sonrası protokol uyumsuzluğu
  - H2: Skill sembolik bağlantısı yol kaçışı olarak atlandı
  - H2: Uzun bağlam için Anthropic 429 ek kullanım gerekli
  - H2: Yukarı akış 403 engellenmiş yanıtları
  - H2: Yerel OpenAI uyumlu arka uç doğrudan probları geçer ama ajan çalıştırmaları başarısız olur
  - H2: Yanıt yok
  - H2: Pano Control UI bağlantısı
  - H3: Kimlik doğrulama ayrıntı kodları hızlı haritası
  - H2: Gateway hizmeti çalışmıyor
  - H2: macOS Gateway sessizce yanıt vermeyi durdurur, ardından panoya dokunduğunuzda devam eder
  - H2: Gateway yüksek bellek kullanımı sırasında çıkar
  - H2: Gateway geçersiz yapılandırmayı reddetti
  - H2: Gateway prob uyarıları
  - H2: Kanal bağlı, mesajlar akmıyor
  - H2: Cron ve Heartbeat teslimi
  - H2: Node eşleştirildi, araç başarısız oluyor
  - H2: Tarayıcı aracı başarısız oluyor
  - H2: Yükselttiyseniz ve bir şey aniden bozulduysa
  - H2: İlgili

## gateway/trusted-proxy-auth.md

- Rota: /gateway/trusted-proxy-auth
- Başlıklar:
  - H2: Ne zaman kullanılır
  - H2: Ne zaman KULLANILMAZ
  - H2: Nasıl çalışır
  - H2: Control UI eşleştirme davranışı
  - H2: Yapılandırma
  - H3: Yapılandırma referansı
  - H2: TLS sonlandırma ve HSTS
  - H3: Kullanıma alma rehberliği
  - H2: Proxy kurulum örnekleri
  - H2: Karma belirteç yapılandırması
  - H2: Operatör kapsamları üstbilgisi
  - H2: Güvenlik kontrol listesi
  - H2: Güvenlik denetimi
  - H2: Sorun giderme
  - H2: Belirteç kimlik doğrulamasından geçiş
  - H2: İlgili

## help/debugging.md

- Rota: /help/debugging
- Başlıklar:
  - H2: Çalışma zamanı hata ayıklama geçersiz kılmaları
  - H2: Oturum izleme çıktısı
  - H2: Plugin yaşam döngüsü izlemesi
  - H2: CLI başlatma ve komut profilleme
  - H2: Gateway izleme modu
  - H2: Geliştirme profili + geliştirme Gateway’i (--dev)
  - H2: Ham akış günlüğe kaydı (OpenClaw)
  - H2: Ham OpenAI uyumlu parça günlüğe kaydı
  - H2: Güvenlik notları
  - H2: VSCode’da hata ayıklama
  - H3: Kurulum
  - H3: Notlar
  - H2: İlgili

## help/environment.md

- Rota: /help/environment
- Başlıklar:
  - H2: Öncelik (en yüksek → en düşük)
  - H2: Sağlayıcı kimlik bilgileri ve çalışma alanı .env
  - H2: Yapılandırma env bloğu
  - H2: Kabuk env içe aktarma
  - H2: Exec kabuk anlık görüntüleri
  - H2: Çalışma zamanında enjekte edilen env değişkenleri
  - H2: UI env değişkenleri
  - H2: Yapılandırmada env değişkeni ikamesi
  - H2: Gizli bilgi referansları ve ${ENV} dizeleri
  - H2: Yolla ilgili env değişkenleri
  - H2: Günlüğe kaydetme
  - H3: OPENCLAWHOME
  - H2: nvm kullanıcıları: webfetch TLS hataları
  - H2: Eski ortam değişkenleri
  - H2: İlgili

## help/faq-first-run.md

- Rota: /help/faq-first-run
- Başlıklar:
  - H2: Hızlı başlangıç ve ilk çalıştırma kurulumu
  - H2: İlgili

## help/faq-models.md

- Rota: /help/faq-models
- Başlıklar:
  - H2: Modeller: varsayılanlar, seçim, takma adlar, geçiş
  - H2: Model yük devri ve "Tüm modeller başarısız oldu"
  - H2: Kimlik doğrulama profilleri: nedir ve nasıl yönetilir
  - H2: İlgili

## help/faq.md

- Rota: /help/faq
- Başlıklar:
  - H2: Bir şey bozulduysa ilk 60 saniye
  - H2: Hızlı başlangıç ve ilk çalıştırma kurulumu
  - H2: OpenClaw nedir?
  - H2: Skills ve otomasyon
  - H2: Korumalı alan ve bellek
  - H2: Şeylerin diskte yaşadığı yer
  - H2: Yapılandırma temelleri
  - H2: Uzak Gateway’ler ve Node’lar
  - H2: Env değişkenleri ve .env yükleme
  - H2: Oturumlar ve birden çok sohbet
  - H2: Modeller, yük devri ve kimlik doğrulama profilleri
  - H2: Gateway: bağlantı noktaları, "zaten çalışıyor" ve uzak mod
  - H2: Günlüğe kaydetme ve hata ayıklama
  - H2: Medya ve ekler
  - H2: Güvenlik ve erişim denetimi
  - H2: Sohbet komutları, görevleri durdurma ve "durmayacak"
  - H2: Çeşitli
  - H2: İlgili

## help/index.md

- Rota: /help
- Başlıklar:
  - H2: SSS
  - H2: Tanılamalar
  - H2: Test
  - H2: Topluluk ve meta

## help/scripts.md

- Rota: /help/scripts
- Başlıklar:
  - H2: Kurallar
  - H2: Kimlik doğrulama izleme betikleri
  - H2: GitHub okuma yardımcısı
  - H2: Betik eklerken
  - H2: İlgili

## help/testing-live.md

- Rota: /help/testing-live
- Başlıklar:
  - H2: Canlı: yerel duman testi komutları
  - H2: Canlı: Android düğümü yetenek taraması
  - H2: Canlı: model duman testi (profil anahtarları)
  - H3: Katman 1: Doğrudan model tamamlama (Gateway yok)
  - H3: Katman 2: Gateway + geliştirme ajanı duman testi ("@openclaw" gerçekte ne yapar)
  - H2: Canlı: CLI arka uç duman testi (Claude, Gemini veya diğer yerel CLI'lar)
  - H2: Canlı: APNs HTTP/2 proxy erişilebilirliği
  - H2: Canlı: ACP bağlama duman testi (/acp spawn ... --bind here)
  - H2: Canlı: Codex uygulama sunucusu harness duman testi
  - H3: Önerilen canlı tarifler
  - H2: Canlı: model matrisi (neleri kapsarız)
  - H3: Modern duman testi seti (araç çağırma + görüntü)
  - H3: Temel: araç çağırma (Read + isteğe bağlı Exec)
  - H3: Görme: görüntü gönderimi (ek → çok modlu mesaj)
  - H3: Toplayıcılar / alternatif Gateway'ler
  - H2: Kimlik bilgileri (asla commit etmeyin)
  - H2: Deepgram canlı (ses transkripsiyonu)
  - H2: BytePlus kodlama planı canlı
  - H2: ComfyUI iş akışı medya canlı
  - H2: Görüntü oluşturma canlı
  - H2: Müzik oluşturma canlı
  - H2: Video oluşturma canlı
  - H2: Medya canlı harness
  - H2: İlgili

## help/testing-updates-plugins.md

- Rota: /help/testing-updates-plugins
- Başlıklar:
  - H2: Neyi koruyoruz
  - H2: Geliştirme sırasında yerel kanıt
  - H2: Docker hatları
  - H2: Paket Kabulü
  - H2: Yayın varsayılanı
  - H2: Eski uyumluluk
  - H2: Kapsam ekleme
  - H2: Hata triyajı

## help/testing.md

- Rota: /help/testing
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Test Geçici Dizinleri
  - H2: QA'ya özel çalıştırıcılar
  - H3: Convex üzerinden paylaşılan Telegram kimlik bilgileri (v1)
  - H3: QA'ya kanal ekleme
  - H2: Test paketleri (nerede ne çalışır)
  - H3: Birim / entegrasyon (varsayılan)
  - H3: Kararlılık (Gateway)
  - H3: E2E (repo toplamı)
  - H3: E2E (Gateway duman testi)
  - H3: E2E (Control UI taklit edilmiş tarayıcı)
  - H3: E2E: OpenShell arka uç duman testi
  - H3: Canlı (gerçek sağlayıcılar + gerçek modeller)
  - H2: Hangi paketi çalıştırmalıyım?
  - H2: Canlı (ağa dokunan) testler
  - H2: Docker çalıştırıcıları (isteğe bağlı "Linux'ta çalışır" kontrolleri)
  - H2: Dokümantasyon sağlamlık kontrolü
  - H2: Çevrimdışı regresyon (CI için güvenli)
  - H2: Ajan güvenilirliği değerlendirmeleri (Skills)
  - H2: Sözleşme testleri (Plugin ve kanal şekli)
  - H3: Komutlar
  - H3: Kanal sözleşmeleri
  - H3: Sağlayıcı durumu sözleşmeleri
  - H3: Sağlayıcı sözleşmeleri
  - H3: Ne zaman çalıştırılır
  - H2: Regresyon ekleme (rehberlik)
  - H2: İlgili

## help/troubleshooting.md

- Rota: /help/troubleshooting
- Başlıklar:
  - H2: İlk 60 saniye
  - H2: Asistan sınırlı hissettiriyor veya araçlar eksik
  - H2: Anthropic uzun bağlam 429
  - H2: Yerel OpenAI uyumlu arka uç doğrudan çalışıyor ancak OpenClaw içinde başarısız oluyor
  - H2: Plugin kurulumu eksik openclaw uzantılarıyla başarısız oluyor
  - H2: Kurulum ilkesi Plugin kurulumlarını veya güncellemelerini engelliyor
  - H2: Plugin mevcut ancak şüpheli sahiplik nedeniyle engellenmiş
  - H2: Karar ağacı
  - H2: İlgili

## index.md

- Rota: /
- Başlıklar:
  - H1: OpenClaw 🦞
  - H2: OpenClaw nedir?
  - H2: Nasıl çalışır
  - H2: Temel yetenekler
  - H2: Hızlı başlangıç
  - H2: Pano
  - H2: Yapılandırma (isteğe bağlı)
  - H2: Buradan başlayın
  - H2: Daha fazla bilgi edinin

## install/ansible.md

- Rota: /install/ansible
- Başlıklar:
  - H2: Önkoşullar
  - H2: Ne elde edersiniz
  - H2: Hızlı başlangıç
  - H2: Neler kurulur
  - H2: Kurulum Sonrası Ayar
  - H3: Hızlı komutlar
  - H2: Güvenlik mimarisi
  - H2: Manuel kurulum
  - H2: Güncelleme
  - H2: Sorun giderme
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## install/azure.md

- Rota: /install/azure
- Başlıklar:
  - H2: Ne yapacaksınız
  - H2: Neye ihtiyacınız var
  - H2: Dağıtımı yapılandırma
  - H2: Azure kaynaklarını dağıtma
  - H2: OpenClaw kurma
  - H2: Maliyet değerlendirmeleri
  - H2: Temizleme
  - H2: Sonraki adımlar
  - H2: İlgili

## install/bun.md

- Rota: /install/bun
- Başlıklar:
  - H2: Kurulum
  - H2: Yaşam döngüsü betikleri
  - H2: Uyarılar
  - H2: İlgili

## install/clawdock.md

- Rota: /install/clawdock
- Başlıklar:
  - H2: Kurulum
  - H2: Ne elde edersiniz
  - H3: Temel işlemler
  - H3: Kapsayıcı erişimi
  - H3: Web UI ve eşleştirme
  - H3: Kurulum ve bakım
  - H3: Yardımcı araçlar
  - H2: İlk kullanım akışı
  - H2: Yapılandırma ve sırlar
  - H2: İlgili

## install/development-channels.md

- Rota: /install/development-channels
- Başlıklar:
  - H2: Kanallar arasında geçiş
  - H2: Tek seferlik sürüm veya etiket hedefleme
  - H2: Kuru çalıştırma
  - H2: Plugin'ler ve kanallar
  - H2: Geçerli durumu kontrol etme
  - H2: Etiketleme en iyi uygulamaları
  - H2: macOS uygulama kullanılabilirliği
  - H2: İlgili

## install/digitalocean.md

- Rota: /install/digitalocean
- Başlıklar:
  - H2: Önkoşullar
  - H2: Kurulum
  - H2: Kalıcılık ve yedekler
  - H2: 1 GB RAM ipuçları
  - H2: Sorun giderme
  - H2: Sonraki adımlar
  - H2: İlgili

## install/docker-vm-runtime.md

- Rota: /install/docker-vm-runtime
- Başlıklar:
  - H2: Gerekli ikilileri imaja ekleme
  - H2: Derleme ve başlatma
  - H2: Nerede ne kalıcı olur
  - H2: Güncellemeler
  - H2: İlgili

## install/docker.md

- Rota: /install/docker
- Başlıklar:
  - H2: Docker benim için doğru mu?
  - H2: Önkoşullar
  - H2: Kapsayıcılaştırılmış Gateway
  - H3: Manuel akış
  - H3: Ortam değişkenleri
  - H3: Gözlemlenebilirlik
  - H3: Sağlık kontrolleri
  - H3: LAN ve loopback
  - H3: Ana Makine Yerel Sağlayıcıları
  - H3: Docker içinde Claude CLI arka ucu
  - H3: Bonjour / mDNS
  - H3: Depolama ve kalıcılık
  - H3: Kabuk yardımcıları (isteğe bağlı)
  - H3: VPS üzerinde mi çalıştırıyorsunuz?
  - H2: Ajan sandbox'ı
  - H3: Hızlı etkinleştirme
  - H2: Sorun giderme
  - H2: İlgili

## install/exe-dev.md

- Rota: /install/exe-dev
- Başlıklar:
  - H2: Yeni başlayanlar için hızlı yol
  - H2: Neye ihtiyacınız var
  - H2: Shelley ile otomatik kurulum
  - H2: Manuel kurulum
  - H2: 1) VM oluşturma
  - H2: 2) Önkoşulları kurma (VM üzerinde)
  - H2: 3) OpenClaw kurma
  - H2: 4) OpenClaw'ı 8000 numaralı porta proxy'lemek için nginx ayarlama
  - H2: 5) OpenClaw'a erişme ve ayrıcalık verme
  - H2: Uzak kanal kurulumu
  - H2: Uzaktan erişim
  - H2: Güncelleme
  - H2: İlgili

## install/fly.md

- Rota: /install/fly
- Başlıklar:
  - H2: Neye ihtiyacınız var
  - H2: Yeni başlayanlar için hızlı yol
  - H2: Sorun giderme
  - H3: "Uygulama beklenen adreste dinlemiyor"
  - H3: Sağlık kontrolleri başarısız / bağlantı reddedildi
  - H3: OOM / Bellek Sorunları
  - H3: Gateway kilidi sorunları
  - H3: Yapılandırma okunmuyor
  - H3: SSH ile yapılandırma yazma
  - H3: Durum kalıcı olmuyor
  - H2: Güncellemeler
  - H3: Makine komutunu güncelleme
  - H2: Özel dağıtım (güçlendirilmiş)
  - H3: Özel dağıtım ne zaman kullanılır
  - H3: Kurulum
  - H3: Özel dağıtıma erişme
  - H3: Özel dağıtımla Webhook'lar
  - H3: Güvenlik faydaları
  - H2: Notlar
  - H2: Maliyet
  - H2: Sonraki adımlar
  - H2: İlgili

## install/gcp.md

- Rota: /install/gcp
- Başlıklar:
  - H2: Ne yapıyoruz (basit ifadeyle)?
  - H2: Hızlı yol (deneyimli operatörler)
  - H2: Neye ihtiyacınız var
  - H2: Sorun giderme
  - H2: Hizmet hesapları (güvenlik için en iyi uygulama)
  - H2: Sonraki adımlar
  - H2: İlgili

## install/hetzner.md

- Rota: /install/hetzner
- Başlıklar:
  - H2: Hedef
  - H2: Ne yapıyoruz (basit ifadeyle)?
  - H2: Hızlı yol (deneyimli operatörler)
  - H2: Neye ihtiyacınız var
  - H2: Kod Olarak Altyapı (Terraform)
  - H2: Sonraki adımlar
  - H2: İlgili

## install/hostinger.md

- Rota: /install/hostinger
- Başlıklar:
  - H2: Önkoşullar
  - H2: Seçenek A: Tek Tıkla OpenClaw
  - H2: Seçenek B: VPS üzerinde OpenClaw
  - H2: Kurulumunuzu doğrulama
  - H2: Sorun giderme
  - H2: Sonraki adımlar
  - H2: İlgili

## install/index.md

- Rota: /install
- Başlıklar:
  - H2: Sistem gereksinimleri
  - H2: Önerilen: kurulum betiği
  - H2: Alternatif kurulum yöntemleri
  - H3: Yerel önek kurucusu (install-cli.sh)
  - H3: npm, pnpm veya bun
  - H3: Kaynaktan
  - H3: GitHub main checkout'ından kurulum
  - H3: Kapsayıcılar ve paket yöneticileri
  - H2: Kurulumu doğrulama
  - H2: Barındırma ve dağıtım
  - H2: Güncelleme, taşıma veya kaldırma
  - H2: Sorun giderme: openclaw bulunamadı

## install/installer.md

- Rota: /install/installer
- Başlıklar:
  - H2: Hızlı komutlar
  - H2: install.sh
  - H3: Akış (install.sh)
  - H3: Kaynak checkout algılama
  - H3: Örnekler (install.sh)
  - H2: install-cli.sh
  - H3: Akış (install-cli.sh)
  - H3: Örnekler (install-cli.sh)
  - H2: install.ps1
  - H3: Akış (install.ps1)
  - H3: Örnekler (install.ps1)
  - H2: CI ve otomasyon
  - H2: Sorun giderme
  - H2: İlgili

## install/kubernetes.md

- Rota: /install/kubernetes
- Başlıklar:
  - H2: Neden Helm değil?
  - H2: Neye ihtiyacınız var
  - H2: Hızlı başlangıç
  - H2: Kind ile yerel test
  - H2: Adım adım
  - H3: 1) Dağıt
  - H3: 2) Gateway'e eriş
  - H2: Neler dağıtılır
  - H2: Özelleştirme
  - H3: Ajan talimatları
  - H3: Gateway yapılandırması
  - H3: Sağlayıcı ekleme
  - H3: Özel ad alanı
  - H3: Özel imaj
  - H3: Port yönlendirme dışına açma
  - H2: Yeniden dağıtma
  - H2: Kaldırma
  - H2: Mimari notları
  - H2: Dosya yapısı
  - H2: İlgili

## install/macos-vm.md

- Rota: /install/macos-vm
- Başlıklar:
  - H2: Önerilen varsayılan (çoğu kullanıcı)
  - H2: macOS VM seçenekleri
  - H3: Apple Silicon Mac'inizde yerel VM (Lume)
  - H3: Barındırılan Mac sağlayıcıları (bulut)
  - H2: Hızlı yol (Lume, deneyimli kullanıcılar)
  - H2: Neye ihtiyacınız var (Lume)
  - H2: 1) Lume kurulumu
  - H2: 2) macOS VM oluşturma
  - H2: 3) Setup Assistant'ı tamamlama
  - H2: 4) VM IP adresini alma
  - H2: 5) VM'ye SSH ile bağlanma
  - H2: 6) OpenClaw kurma
  - H2: 7) Kanalları yapılandırma
  - H2: 8) VM'yi başsız çalıştırma
  - H2: Bonus: iMessage entegrasyonu
  - H2: Altın imaj kaydetme
  - H2: 24/7 çalıştırma
  - H2: Sorun giderme
  - H2: İlgili dokümanlar

## install/migrating-claude.md

- Rota: /install/migrating-claude
- Başlıklar:
  - H2: İçe aktarmanın iki yolu
  - H2: Neler içe aktarılır
  - H2: Neler yalnızca arşivde kalır
  - H2: Kaynak seçimi
  - H2: Önerilen akış
  - H2: Çakışma işleme
  - H2: Otomasyon için JSON çıktısı
  - H2: Sorun giderme
  - H2: İlgili

## install/migrating-hermes.md

- Rota: /install/migrating-hermes
- Başlıklar:
  - H2: İçe aktarmanın iki yolu
  - H2: Neler içe aktarılır
  - H2: Neler yalnızca arşivde kalır
  - H2: Önerilen akış
  - H2: Çakışma işleme
  - H2: Sırlar
  - H2: Otomasyon için JSON çıktısı
  - H2: Sorun giderme
  - H2: İlgili

## install/migrating.md

- Rota: /install/migrating
- Başlıklar:
  - H2: Başka bir ajan sisteminden içe aktarma
  - H2: OpenClaw'ı yeni bir makineye taşıma
  - H3: Taşıma adımları
  - H3: Yaygın tuzaklar
  - H3: Doğrulama kontrol listesi
  - H2: Bir Plugin'i yerinde yükseltme
  - H2: İlgili

## install/nix.md

- Rota: /install/nix
- Başlıklar:
  - H2: Ne elde edersiniz
  - H2: Hızlı başlangıç
  - H2: Nix modu çalışma zamanı davranışı
  - H3: Nix modunda neler değişir
  - H3: Yapılandırma ve durum yolları
  - H3: Hizmet PATH keşfi
  - H2: İlgili

## install/node.md

- Rota: /install/node
- Başlıklar:
  - H2: Sürümünüzü kontrol edin
  - H2: Node kurma
  - H2: Sorun giderme
  - H3: openclaw: komut bulunamadı
  - H3: npm install -g sırasında izin hataları (Linux)
  - H2: İlgili

## install/northflank.mdx

- Rota: /install/northflank
- Başlıklar:
  - H1: Northflank
  - H2: Nasıl başlanır
  - H2: Ne elde edersiniz
  - H2: Bir kanal bağlama
  - H2: Sonraki adımlar

## install/oracle.md

- Rota: /install/oracle
- Başlıklar:
  - H2: Önkoşullar
  - H2: Kurulum
  - H2: Güvenlik duruşunu doğrulama
  - H2: ARM notları
  - H2: Kalıcılık ve yedekler
  - H2: Yedek seçenek: SSH tüneli
  - H2: Sorun giderme
  - H2: Sonraki adımlar
  - H2: İlgili

## install/podman.md

- Rota: /install/podman
- Başlıklar:
  - H2: Önkoşullar
  - H2: Hızlı başlangıç
  - H2: Podman ve Tailscale
  - H2: Systemd (Quadlet, isteğe bağlı)
  - H2: Yapılandırma, env ve depolama
  - H2: Yararlı komutlar
  - H2: Sorun giderme
  - H2: İlgili

## install/railway.mdx

- Rota: /install/railway
- Başlıklar:
  - H1: Railway
  - H2: Hızlı kontrol listesi (yeni kullanıcılar)
  - H2: Tek tıkla dağıtım
  - H2: Ne elde edersiniz
  - H2: Gerekli Railway ayarları
  - H3: Genel Ağ
  - H3: Birim (gerekli)
  - H3: Değişkenler
  - H2: Bir kanal bağlama
  - H2: Yedekler ve taşıma
  - H2: Sonraki adımlar

## install/raspberry-pi.md

- Rota: /install/raspberry-pi
- Başlıklar:
  - H2: Donanım uyumluluğu
  - H2: Ön koşullar
  - H2: Kurulum
  - H2: Performans ipuçları
  - H2: Önerilen model kurulumu
  - H2: ARM ikili dosya notları
  - H2: Kalıcılık ve yedekler
  - H2: Sorun giderme
  - H2: Sonraki adımlar
  - H2: İlgili

## install/render.mdx

- Rota: /install/render
- Başlıklar:
  - H1: Render
  - H2: Ön koşullar
  - H2: Render Blueprint ile dağıtma
  - H2: Blueprint'i anlama
  - H2: Plan seçme
  - H2: Dağıtımdan sonra
  - H3: Denetim UI'ına erişme
  - H2: Render Dashboard özellikleri
  - H3: Günlükler
  - H3: Kabuk erişimi
  - H3: Ortam değişkenleri
  - H3: Otomatik dağıtım
  - H2: Özel alan adı
  - H2: Ölçekleme
  - H2: Yedekler ve geçiş
  - H2: Sorun giderme
  - H3: Servis başlamıyor
  - H3: Yavaş soğuk başlatmalar (ücretsiz katman)
  - H3: Yeniden dağıtımdan sonra veri kaybı
  - H3: Sağlık denetimi hataları
  - H2: Sonraki adımlar

## install/uninstall.md

- Rota: /install/uninstall
- Başlıklar:
  - H2: Kolay yol (CLI hâlâ yüklü)
  - H2: Manuel servis kaldırma (CLI yüklü değil)
  - H3: macOS (launchd)
  - H3: Linux (systemd kullanıcı birimi)
  - H3: Windows (Zamanlanmış Görev)
  - H2: Normal kurulum ve kaynak checkout karşılaştırması
  - H3: Normal kurulum (install.sh / npm / pnpm / bun)
  - H3: Kaynak checkout (git clone)
  - H2: İlgili

## install/updating.md

- Rota: /install/updating
- Başlıklar:
  - H2: Önerilen: openclaw update
  - H2: npm ve git kurulumları arasında geçiş yapma
  - H2: Alternatif: kurucuyu yeniden çalıştırma
  - H2: Alternatif: manuel npm, pnpm veya bun
  - H3: Gelişmiş npm kurulum konuları
  - H2: Otomatik güncelleyici
  - H2: Güncellemeden sonra
  - H3: Doctor'ı çalıştırma
  - H3: Gateway'i yeniden başlatma
  - H3: Doğrulama
  - H2: Geri alma
  - H3: Bir sürümü sabitleme (npm)
  - H3: Bir commit'i sabitleme (kaynak)
  - H2: Takıldıysanız
  - H2: İlgili

## install/upstash.md

- Rota: /install/upstash
- Başlıklar:
  - H2: Ön koşullar
  - H2: Box oluşturma
  - H2: SSH tüneliyle bağlanma
  - H2: OpenClaw'ı yükleme
  - H2: Başlatma akışını çalıştırma
  - H2: Gateway'i başlatma
  - H2: Otomatik yeniden başlatma
  - H2: Sorun giderme
  - H2: İlgili

## logging.md

- Rota: /logging
- Başlıklar:
  - H2: Günlüklerin bulunduğu yer
  - H2: Günlükleri okuma
  - H3: CLI: canlı tail (önerilen)
  - H3: Denetim UI'ı (web)
  - H3: Yalnızca kanal günlükleri
  - H2: Günlük biçimleri
  - H3: Dosya günlükleri (JSONL)
  - H3: Konsol çıktısı
  - H3: Gateway WebSocket günlükleri
  - H2: Günlüklemeyi yapılandırma
  - H3: Günlük seviyeleri
  - H3: Hedefli model aktarımı tanılamaları
  - H3: İz korelasyonu
  - H3: Model çağrısı boyutu ve zamanlaması
  - H3: Konsol stilleri
  - H3: Redaksiyon
  - H2: Tanılamalar ve OpenTelemetry
  - H2: Sorun giderme ipuçları
  - H2: İlgili

## maturity/scorecard.md

- Rota: /maturity/scorecard
- Başlıklar:
  - H1: Olgunluk puan kartı
  - H2: Bu sayfa ne için
  - H2: Bir bakışta
  - H2: Puan bantları
  - H2: Yüzey gezgini
  - H2: QA kanıt özeti
  - H3: Alana göre hazır olma durumu

## maturity/taxonomy.md

- Rota: /maturity/taxonomy
- Başlıklar:
  - H1: Olgunluk taksonomisi
  - H2: Bu sayfa nasıl okunur
  - H2: Olgunluk seviyeleri
  - H2: Ürün alanları
  - H2: Ayrıntılar
  - H3: Çekirdek
  - H3: Platform
  - H3: Kanal
  - H3: Sağlayıcı ve araç

## network.md

- Rota: /network
- Başlıklar:
  - H2: Çekirdek model
  - H2: Eşleştirme + kimlik
  - H2: Keşif + aktarımlar
  - H2: Düğümler + aktarımlar
  - H2: Güvenlik
  - H2: İlgili

## nodes/audio.md

- Rota: /nodes/audio
- Başlıklar:
  - H2: Çalışanlar
  - H2: Otomatik algılama (varsayılan)
  - H2: Yapılandırma örnekleri
  - H3: Sağlayıcı + CLI yedek yolu (OpenAI + Whisper CLI)
  - H3: Kapsam kapısıyla yalnızca sağlayıcı
  - H3: Yalnızca sağlayıcı (Deepgram)
  - H3: Yalnızca sağlayıcı (Mistral Voxtral)
  - H3: Yalnızca sağlayıcı (SenseAudio)
  - H3: Transkripti sohbete yansıtma (isteğe bağlı)
  - H2: Notlar ve sınırlar
  - H3: Proxy ortam desteği
  - H2: Gruplarda bahsetme algılama
  - H2: Dikkat edilmesi gerekenler
  - H2: İlgili

## nodes/camera.md

- Rota: /nodes/camera
- Başlıklar:
  - H2: iOS düğümü
  - H3: Kullanıcı ayarı (varsayılan açık)
  - H3: Komutlar (Gateway node.invoke üzerinden)
  - H3: Ön planda olma gereksinimi
  - H3: CLI yardımcısı
  - H2: Android düğümü
  - H3: Android kullanıcı ayarı (varsayılan açık)
  - H3: İzinler
  - H3: Android ön plan gereksinimi
  - H3: Android komutları (Gateway node.invoke üzerinden)
  - H3: Yük koruması
  - H2: macOS uygulaması
  - H3: Kullanıcı ayarı (varsayılan kapalı)
  - H3: CLI yardımcısı (node invoke)
  - H2: Güvenlik + pratik sınırlar
  - H2: macOS ekran videosu (işletim sistemi seviyesinde)
  - H2: İlgili

## nodes/images.md

- Rota: /nodes/images
- Başlıklar:
  - H2: Hedefler
  - H2: CLI yüzeyi
  - H2: WhatsApp Web kanal davranışı
  - H2: Otomatik Yanıt işlem hattı
  - H2: Gelen medyadan komutlara
  - H2: Sınırlar ve hatalar
  - H2: Testler için notlar
  - H2: İlgili

## nodes/index.md

- Rota: /nodes
- Başlıklar:
  - H2: Eşleştirme + durum
  - H2: Uzak düğüm ana makinesi (system.run)
  - H3: Ne nerede çalışır
  - H3: Düğüm ana makinesi başlatma (ön plan)
  - H3: SSH tüneliyle uzak gateway (loopback bağlama)
  - H3: Düğüm ana makinesi başlatma (servis)
  - H3: Eşleştir + adlandır
  - H3: Komutları izin listesine alma
  - H3: exec'i düğüme yönlendirme
  - H2: Komutları çağırma
  - H2: Komut ilkesi
  - H2: Yapılandırma (openclaw.json)
  - H2: Ekran görüntüleri (canvas anlık görüntüleri)
  - H3: Canvas denetimleri
  - H3: A2UI (Canvas)
  - H2: Fotoğraflar + videolar (düğüm kamerası)
  - H2: Ekran kayıtları (düğümler)
  - H2: Konum (düğümler)
  - H2: SMS (Android düğümleri)
  - H2: Android cihaz + kişisel veri komutları
  - H2: Sistem komutları (düğüm ana makinesi / mac düğümü)
  - H2: Exec düğüm bağlama
  - H2: İzinler haritası
  - H2: Başsız düğüm ana makinesi (platformlar arası)
  - H2: Mac düğüm modu

## nodes/location-command.md

- Rota: /nodes/location-command
- Başlıklar:
  - H2: TL;DR
  - H2: Neden yalnızca anahtar değil, seçici
  - H2: Ayarlar modeli
  - H2: İzin eşleme (node.permissions)
  - H2: Komut: location.get
  - H2: Arka plan davranışı
  - H2: Model/araç entegrasyonu
  - H2: UX metni (önerilen)
  - H2: İlgili

## nodes/media-understanding.md

- Rota: /nodes/media-understanding
- Başlıklar:
  - H2: Hedefler
  - H2: Üst düzey davranış
  - H2: Yapılandırma genel bakışı
  - H3: Model girdileri
  - H3: Sağlayıcı kimlik bilgileri (apiKey)
  - H2: Varsayılanlar ve sınırlar
  - H3: Medya anlamayı otomatik algılama (varsayılan)
  - H3: Proxy ortam desteği (sağlayıcı modelleri)
  - H2: Yetenekler (isteğe bağlı)
  - H2: Sağlayıcı destek matrisi (OpenClaw entegrasyonları)
  - H2: Model seçimi rehberi
  - H2: Ek ilkesi
  - H2: Yapılandırma örnekleri
  - H2: Durum çıktısı
  - H2: Notlar
  - H2: İlgili

## nodes/talk.md

- Rota: /nodes/talk
- Başlıklar:
  - H2: Davranış (macOS)
  - H2: Yanıtlarda sesli yönergeler
  - H2: Yapılandırma (/.openclaw/openclaw.json)
  - H2: macOS UI
  - H2: Android UI
  - H2: Notlar
  - H2: İlgili

## nodes/troubleshooting.md

- Rota: /nodes/troubleshooting
- Başlıklar:
  - H2: Komut merdiveni
  - H2: Ön plan gereksinimleri
  - H2: İzinler matrisi
  - H2: Eşleştirme ve onaylar
  - H2: Yaygın düğüm hata kodları
  - H2: Hızlı kurtarma döngüsü
  - H2: İlgili

## nodes/voicewake.md

- Rota: /nodes/voicewake
- Başlıklar:
  - H2: Depolama (Gateway ana makinesi)
  - H2: Protokol
  - H3: Yöntemler
  - H3: Yönlendirme yöntemleri (tetikleyici → hedef)
  - H3: Olaylar
  - H2: İstemci davranışı
  - H3: macOS uygulaması
  - H3: iOS düğümü
  - H3: Android düğümü
  - H2: İlgili

## openclaw-agent-runtime.md

- Rota: /openclaw-agent-runtime
- Başlıklar:
  - H2: Tür denetimi ve linting
  - H2: Agent Runtime testlerini çalıştırma
  - H2: Manuel test
  - H2: Temiz başlangıç sıfırlaması
  - H2: Referanslar
  - H2: İlgili

## perplexity.md

- Rota: /perplexity
- Başlıklar:
  - H2: İlgili

## plan/codex-context-engine-harness.md

- Rota: /plan/codex-context-engine-harness
- Başlıklar:
  - H2: Durum
  - H2: Hedef
  - H2: Hedef dışı kalanlar
  - H2: Mevcut mimari
  - H2: Mevcut eksik
  - H2: İstenen davranış
  - H2: Tasarım kısıtları
  - H3: Codex app-server yerel iş parçacığı durumu için kanonik kalır
  - H3: Bağlam motoru derlemesi Codex girdilerine yansıtılmalıdır
  - H3: İstem önbelleği kararlılığı önemlidir
  - H3: Çalışma zamanı seçimi semantiği değişmez
  - H2: Uygulama planı
  - H3: 1. Yeniden kullanılabilir bağlam motoru deneme yardımcılarını dışa aktar veya yeniden konumlandır
  - H3: 2. Bir Codex bağlam projeksiyon yardımcısı ekle
  - H3: 3. Codex iş parçacığı başlatılmadan önce bootstrap'i bağla
  - H3: 4. thread/start / thread/resume ve turn/start öncesinde assemble'ı bağla
  - H3: 5. İstem önbelleği kararlı biçimlendirmesini koru
  - H3: 6. Transkript aynalamadan sonra tur sonrası akışı bağla
  - H3: 7. Kullanım ve istem önbelleği çalışma zamanı bağlamını normalleştir
  - H3: 8. Compaction ilkesi
  - H4: /compact ve açık OpenClaw compaction
  - H4: Tur içi Codex yerel contextCompaction olayları
  - H3: 9. Oturum sıfırlama ve bağlama davranışı
  - H3: 10. Hata işleme
  - H2: Test planı
  - H3: Birim testleri
  - H3: Güncellenecek mevcut testler
  - H3: Entegrasyon / canlı testler
  - H2: Gözlemlenebilirlik
  - H2: Geçiş / uyumluluk
  - H2: Açık sorular
  - H2: Kabul ölçütleri

## plan/ui-channels.md

- Rota: /plan/ui-channels
- Başlıklar:
  - H2: Durum
  - H2: Sorun
  - H2: Hedefler
  - H2: Hedef dışı kalanlar
  - H2: Hedef model
  - H2: Teslim meta verileri
  - H2: Çalışma zamanı yetenek sözleşmesi
  - H2: Kanal eşleme
  - H2: Refaktör adımları
  - H2: Testler
  - H2: Açık sorular
  - H2: İlgili

## platforms/android.md

- Rota: /platforms/android
- Başlıklar:
  - H2: Destek özeti
  - H2: Sistem denetimi
  - H2: Bağlantı runbook'u
  - H3: Ön koşullar
  - H3: 1) Gateway'i başlatma
  - H3: 2) Keşfi doğrulama (isteğe bağlı)
  - H4: Tekil DNS-SD ile Tailnet (Viyana ⇄ Londra) keşfi
  - H3: 3) Android'den bağlanma
  - H3: Presence canlı işaretleri
  - H3: 4) Eşleştirmeyi onaylama (CLI)
  - H3: 5) Düğümün bağlı olduğunu doğrulama
  - H3: 6) Sohbet + geçmiş
  - H3: 7) Canvas + kamera
  - H4: Gateway Canvas Host (web içeriği için önerilir)
  - H3: 8) Ses + genişletilmiş Android komut yüzeyi
  - H2: Asistan giriş noktaları
  - H2: Bildirim iletme
  - H2: İlgili

## platforms/digitalocean.md

- Rota: /platforms/digitalocean
- Başlıklar:
  - H2: İlgili

## platforms/easyrunner.md

- Rota: /platforms/easyrunner
- Başlıklar:
  - H2: Başlamadan önce
  - H2: Compose uygulaması
  - H2: OpenClaw'ı yapılandırma
  - H2: Doğrulama
  - H2: Güncellemeler ve yedekler
  - H2: Sorun giderme

## platforms/index.md

- Rota: /platforms
- Başlıklar:
  - H2: İşletim sisteminizi seçin
  - H2: VPS ve barındırma
  - H2: Ortak bağlantılar
  - H2: Gateway servis kurulumu (CLI)
  - H2: İlgili

## platforms/ios.md

- Rota: /platforms/ios
- Başlıklar:
  - H2: Ne yapar
  - H2: Gereksinimler
  - H2: Hızlı başlangıç (eşleştir + bağlan)
  - H2: Resmi yapılar için relay destekli push
  - H2: Arka plan canlılık işaretleri
  - H2: Kimlik doğrulama ve güven akışı
  - H2: Keşif yolları
  - H3: Bonjour (LAN)
  - H3: Tailnet (ağlar arası)
  - H3: Manuel ana makine/bağlantı noktası
  - H2: Canvas + A2UI
  - H2: Computer Use ilişkisi
  - H3: Canvas eval / snapshot
  - H2: Sesle uyandırma + konuşma modu
  - H2: Yaygın hatalar
  - H2: İlgili belgeler

## platforms/linux.md

- Rota: /platforms/linux
- Başlıklar:
  - H2: Yeni başlayanlar için hızlı yol (VPS)
  - H2: Kurulum
  - H2: Gateway
  - H2: Gateway servis kurulumu (CLI)
  - H2: Sistem denetimi (systemd kullanıcı birimi)
  - H2: Bellek baskısı ve OOM sonlandırmaları
  - H2: İlgili

## platforms/mac/bundled-gateway.md

- Rota: /platforms/mac/bundled-gateway
- Başlıklar:
  - H2: CLI'ı yükleme (yerel mod için gerekli)
  - H2: Launchd (LaunchAgent olarak Gateway)
  - H2: Sürüm uyumluluğu
  - H2: macOS üzerinde durum dizini
  - H2: Uygulama bağlantısını hata ayıklama
  - H2: Smoke denetimi
  - H2: İlgili

## platforms/mac/canvas.md

- Rota: /platforms/mac/canvas
- Başlıklar:
  - H2: Canvas'ın bulunduğu yer
  - H2: Panel davranışı
  - H2: Agent API yüzeyi
  - H2: Canvas içinde A2UI
  - H3: A2UI komutları (v0.8)
  - H2: Canvas'tan agent çalıştırmalarını tetikleme
  - H2: Güvenlik notları
  - H2: İlgili

## platforms/mac/child-process.md

- Rota: /platforms/mac/child-process
- Başlıklar:
  - H2: Varsayılan davranış (launchd)
  - H2: İmzasız geliştirme yapıları
  - H2: Yalnızca ekleme modu
  - H2: Uzak mod
  - H2: Neden launchd tercih ediyoruz
  - H2: İlgili

## platforms/mac/dev-setup.md

- Rota: /platforms/mac/dev-setup
- Başlıklar:
  - H1: macOS geliştirici kurulumu
  - H2: Önkoşullar
  - H2: 1. Bağımlılıkları Yükleyin
  - H2: 2. Uygulamayı Derleyin ve Paketleyin
  - H2: 3. CLI'yi Yükleyin
  - H2: Sorun giderme
  - H3: Derleme başarısız: araç zinciri veya SDK uyumsuzluğu
  - H3: İzin verildiğinde uygulama çöküyor
  - H3: Gateway süresiz olarak "Başlatılıyor..." durumunda kalıyor
  - H2: İlgili

## platforms/mac/health.md

- Rota: /platforms/mac/health
- Başlıklar:
  - H1: macOS'te Sağlık Denetimleri
  - H2: Menü çubuğu
  - H2: Ayarlar
  - H2: Yoklamanın çalışma şekli
  - H2: Şüphe duyduğunuzda
  - H2: İlgili

## platforms/mac/icon.md

- Rota: /platforms/mac/icon
- Başlıklar:
  - H1: Menü Çubuğu Simgesi Durumları
  - H2: İlgili

## platforms/mac/logging.md

- Rota: /platforms/mac/logging
- Başlıklar:
  - H1: Günlükleme (macOS)
  - H2: Dönen tanılama dosyası günlüğü (Hata Ayıklama bölmesi)
  - H2: macOS'te birleşik günlükleme özel verileri
  - H2: OpenClaw (ai.openclaw) için etkinleştirin
  - H2: Hata ayıklamadan sonra devre dışı bırakın
  - H2: İlgili

## platforms/mac/menu-bar.md

- Rota: /platforms/mac/menu-bar
- Başlıklar:
  - H2: Gösterilenler
  - H2: Durum modeli
  - H2: IconState enum (Swift)
  - H3: ActivityKind → glif
  - H3: Görsel eşleme
  - H2: Bağlam alt menüsü
  - H2: Durum satırı metni (menü)
  - H2: Olay alımı
  - H2: Hata ayıklama geçersiz kılması
  - H2: Test kontrol listesi
  - H2: İlgili

## platforms/mac/peekaboo.md

- Rota: /platforms/mac/peekaboo
- Başlıklar:
  - H2: Bu nedir (ve ne değildir)
  - H2: Computer Use ile ilişkisi
  - H2: Köprüyü etkinleştirin
  - H2: İstemci keşif sırası
  - H2: Güvenlik ve izinler
  - H2: Anlık görüntü davranışı (otomasyon)
  - H2: Sorun giderme
  - H2: İlgili

## platforms/mac/permissions.md

- Rota: /platforms/mac/permissions
- Başlıklar:
  - H2: Kararlı izinler için gereksinimler
  - H2: Node ve CLI çalışma zamanları için Erişilebilirlik izinleri
  - H2: İstemler kaybolduğunda kurtarma kontrol listesi
  - H2: Dosya ve klasör izinleri (Masaüstü/Belgeler/İndirilenler)
  - H2: İlgili

## platforms/mac/remote.md

- Rota: /platforms/mac/remote
- Başlıklar:
  - H2: Modlar
  - H2: Uzak taşıyıcılar
  - H2: Uzak ana makinedeki önkoşullar
  - H2: macOS uygulama kurulumu
  - H2: Web Sohbeti
  - H2: İzinler
  - H2: Güvenlik notları
  - H2: WhatsApp oturum açma akışı (uzak)
  - H2: Sorun giderme
  - H2: Bildirim sesleri
  - H2: İlgili

## platforms/mac/signing.md

- Rota: /platforms/mac/signing
- Başlıklar:
  - H1: mac imzalama (hata ayıklama derlemeleri)
  - H2: Kullanım
  - H3: Ad-hoc İmzalama Notu
  - H2: Hakkında için derleme meta verileri
  - H2: Neden
  - H2: İlgili

## platforms/mac/skills.md

- Rota: /platforms/mac/skills
- Başlıklar:
  - H2: Veri kaynağı
  - H2: Yükleme eylemleri
  - H2: Ortam/API anahtarları
  - H2: Uzak mod
  - H2: İlgili

## platforms/mac/voice-overlay.md

- Rota: /platforms/mac/voice-overlay
- Başlıklar:
  - H1: Ses Katmanı Yaşam Döngüsü (macOS)
  - H2: Mevcut amaç
  - H2: Uygulandı (9 Ara 2025)
  - H2: Sonraki adımlar
  - H2: Hata ayıklama kontrol listesi
  - H2: Geçiş adımları (önerilen)
  - H2: İlgili

## platforms/mac/voicewake.md

- Rota: /platforms/mac/voicewake
- Başlıklar:
  - H1: Sesle Uyandırma ve Bas-Konuş
  - H2: Gereksinimler
  - H2: Modlar
  - H2: Çalışma zamanı davranışı (uyandırma sözcüğü)
  - H2: Yaşam döngüsü değişmezleri
  - H2: Yapışkan katman hata modu (önceki)
  - H2: Bas-konuş ayrıntıları
  - H2: Kullanıcıya dönük ayarlar
  - H2: Yönlendirme davranışı
  - H2: Yönlendirme yükü
  - H2: Hızlı doğrulama
  - H2: İlgili

## platforms/mac/webchat.md

- Rota: /platforms/mac/webchat
- Başlıklar:
  - H2: Başlatma ve hata ayıklama
  - H2: Nasıl bağlandığı
  - H2: Güvenlik yüzeyi
  - H2: Bilinen sınırlamalar
  - H2: İlgili

## platforms/mac/xpc.md

- Rota: /platforms/mac/xpc
- Başlıklar:
  - H1: OpenClaw macOS IPC mimarisi
  - H2: Hedefler
  - H2: Nasıl çalışır
  - H3: Gateway + node taşıyıcısı
  - H3: Node hizmeti + uygulama IPC'si
  - H3: PeekabooBridge (UI otomasyonu)
  - H2: Operasyonel akışlar
  - H2: Sertleştirme notları
  - H2: İlgili

## platforms/macos.md

- Rota: /platforms/macos
- Başlıklar:
  - H2: İndir
  - H2: İlk çalıştırma
  - H2: Bir Gateway modu seçin
  - H2: Uygulamanın sahip oldukları
  - H2: macOS ayrıntı sayfaları
  - H2: İlgili

## platforms/oracle.md

- Rota: /platforms/oracle
- Başlıklar:
  - H2: İlgili

## platforms/raspberry-pi.md

- Rota: /platforms/raspberry-pi
- Başlıklar:
  - H2: İlgili

## platforms/windows.md

- Rota: /platforms/windows
- Başlıklar:
  - H2: Önerilen: Windows Hub
  - H3: Windows Hub neleri içerir
  - H3: İlk başlatma
  - H2: Windows düğüm modu
  - H2: Yerel MCP modu
  - H2: Yerel Windows CLI ve Gateway
  - H2: WSL2 Gateway
  - H2: Windows oturum açmadan önce Gateway otomatik başlatma
  - H2: WSL hizmetlerini LAN üzerinden açığa çıkarın
  - H2: Sorun giderme
  - H3: Tepsi simgesi görünmüyor
  - H3: Yerel kurulum başarısız oluyor
  - H3: Uygulama eşleştirme gerektiğini söylüyor
  - H3: Web sohbeti uzak Gateway'e erişemiyor
  - H3: screen.snapshot, kamera veya ses komutları başarısız oluyor
  - H3: Git veya GitHub bağlantısı başarısız oluyor
  - H2: İlgili

## plugins/adding-capabilities.md

- Rota: /plugins/adding-capabilities
- Başlıklar:
  - H2: Ne zaman bir yetenek oluşturulmalı
  - H2: Standart sıra
  - H2: Ne nereye gider
  - H2: Sağlayıcı ve koşum bağlantı noktaları
  - H2: Dosya kontrol listesi
  - H2: Çalışılmış örnek: görüntü oluşturma
  - H2: Gömme sağlayıcıları
  - H2: İnceleme kontrol listesi
  - H2: İlgili

## plugins/admin-http-rpc.md

- Rota: /plugins/admin-http-rpc
- Başlıklar:
  - H2: Etkinleştirmeden önce
  - H2: Etkinleştir
  - H2: Rotayı doğrulayın
  - H2: Kimlik doğrulama
  - H2: Güvenlik modeli
  - H2: İstek
  - H2: Yanıt
  - H2: İzin verilen yöntemler
  - H2: WebSocket karşılaştırması
  - H2: Sorun giderme
  - H2: İlgili

## plugins/agent-tools.md

- Rota: /plugins/agent-tools
- Başlıklar:
  - H2: İlgili

## plugins/architecture-internals.md

- Rota: /plugins/architecture-internals
- Başlıklar:
  - H2: Yükleme işlem hattı
  - H3: Manifest öncelikli davranış
  - H3: Plugin önbellek sınırı
  - H2: Kayıt modeli
  - H2: Konuşma bağlama geri çağrıları
  - H2: Sağlayıcı çalışma zamanı kancaları
  - H3: Kanca sırası ve kullanımı
  - H3: Sağlayıcı örneği
  - H3: Yerleşik örnekler
  - H2: Çalışma zamanı yardımcıları
  - H3: api.runtime.imageGeneration
  - H2: Gateway HTTP rotaları
  - H2: Plugin SDK içe aktarma yolları
  - H2: Mesaj aracı şemaları
  - H2: Kanal hedefi çözümleme
  - H2: Yapılandırma destekli dizinler
  - H2: Sağlayıcı katalogları
  - H2: Salt okunur kanal incelemesi
  - H2: Paket paketleri
  - H3: Kanal kataloğu meta verileri
  - H2: Bağlam motoru Plugin'leri
  - H2: Yeni bir yetenek ekleme
  - H3: Yetenek kontrol listesi
  - H3: Yetenek şablonu
  - H2: İlgili

## plugins/architecture.md

- Rota: /plugins/architecture
- Başlıklar:
  - H2: Genel yetenek modeli
  - H3: Harici uyumluluk duruşu
  - H3: Plugin biçimleri
  - H3: Eski kancalar
  - H3: Uyumluluk sinyalleri
  - H2: Mimari genel bakışı
  - H3: Plugin meta veri anlık görüntüsü ve arama tablosu
  - H3: Etkinleştirme planlaması
  - H3: Kanal Plugin'leri ve paylaşılan mesaj aracı
  - H2: Yetenek sahipliği modeli
  - H3: Yetenek katmanlama
  - H3: Çok yetenekli şirket Plugin örneği
  - H3: Yetenek örneği: video anlama
  - H2: Sözleşmeler ve yaptırım
  - H3: Bir sözleşmede neler bulunur
  - H2: Yürütme modeli
  - H2: Dışa aktarma sınırı
  - H2: İç yapılar ve başvuru
  - H2: İlgili

## plugins/building-extensions.md

- Rota: /plugins/building-extensions
- Başlıklar:
  - H2: İlgili

## plugins/building-plugins.md

- Rota: /plugins/building-plugins
- Başlıklar:
  - H2: Gereksinimler
  - H2: Plugin biçimini seçin
  - H2: Hızlı başlangıç
  - H2: Araçları kaydetme
  - H2: İçe aktarma kuralları
  - H2: Gönderim öncesi kontrol listesi
  - H2: Beta sürümlere karşı test edin
  - H2: Sonraki adımlar
  - H2: İlgili

## plugins/bundles.md

- Rota: /plugins/bundles
- Başlıklar:
  - H2: Paketlerin var olma nedeni
  - H2: Bir paket yükleyin
  - H2: OpenClaw paketlerden neleri eşler
  - H3: Şu anda desteklenenler
  - H4: Skill içeriği
  - H4: Kanca paketleri
  - H4: Gömülü OpenClaw için MCP
  - H4: Gömülü OpenClaw ayarları
  - H4: Gömülü OpenClaw LSP
  - H3: Algılanır ancak yürütülmez
  - H2: Paket biçimleri
  - H2: Algılama önceliği
  - H2: Çalışma zamanı bağımlılıkları ve temizleme
  - H2: Güvenlik
  - H2: Sorun giderme
  - H2: İlgili

## plugins/cli-backend-plugins.md

- Rota: /plugins/cli-backend-plugins
- Başlıklar:
  - H2: Plugin'in sahip oldukları
  - H2: En küçük arka uç Plugin'i
  - H2: Yapılandırma biçimi
  - H2: Gelişmiş arka uç kancaları
  - H3: ownsNativeCompaction: OpenClaw Compaction dışında kalma
  - H2: MCP araç köprüsü
  - H2: Kullanıcı yapılandırması
  - H2: Doğrulama
  - H2: Kontrol listesi
  - H2: İlgili

## plugins/codex-computer-use.md

- Rota: /plugins/codex-computer-use
- Başlıklar:
  - H2: OpenClaw.app ve Peekaboo
  - H2: iOS uygulaması
  - H2: Doğrudan cua-driver MCP
  - H2: Hızlı kurulum
  - H2: Komutlar
  - H2: Marketplace seçenekleri
  - H2: Birlikte gelen macOS marketplace
  - H2: Uzak katalog sınırı
  - H2: Yapılandırma başvurusu
  - H2: OpenClaw neleri denetler
  - H2: macOS izinleri
  - H2: Sorun giderme
  - H2: İlgili

## plugins/codex-harness-reference.md

- Rota: /plugins/codex-harness-reference
- Başlıklar:
  - H2: Plugin yapılandırma yüzeyi
  - H2: Uygulama sunucusu taşıyıcısı
  - H2: Onay ve sandbox modları
  - H2: Sandbox'lı yerel yürütme
  - H2: Kimlik doğrulama ve ortam yalıtımı
  - H2: Dinamik araçlar
  - H2: Zaman aşımları
  - H2: Model keşfi
  - H2: Çalışma alanı önyükleme dosyaları
  - H2: Ortam geçersiz kılmaları
  - H2: İlgili

## plugins/codex-harness-runtime.md

- Rota: /plugins/codex-harness-runtime
- Başlıklar:
  - H2: Genel bakış
  - H2: Konu bağlamaları ve model değişiklikleri
  - H2: Görünür yanıtlar ve Heartbeat'ler
  - H2: Kanca sınırları
  - H2: V1 destek sözleşmesi
  - H2: Yerel izinler ve MCP istemleri
  - H2: Kuyruk yönlendirme
  - H2: Codex geri bildirimi yükleme
  - H2: Compaction ve transkript aynası
  - H2: Medya ve teslim
  - H2: İlgili

## plugins/codex-harness.md

- Rota: /plugins/codex-harness
- Başlıklar:
  - H2: Gereksinimler
  - H2: Hızlı başlangıç
  - H2: Yapılandırma
  - H2: Codex çalışma zamanını doğrulayın
  - H2: Yönlendirme ve model seçimi
  - H2: Dağıtım desenleri
  - H3: Temel Codex dağıtımı
  - H3: Karma sağlayıcı dağıtımı
  - H3: Kapalı başarısız Codex dağıtımı
  - H2: Uygulama sunucusu politikası
  - H2: Komutlar ve tanılama
  - H3: Codex konularını yerel olarak inceleyin
  - H2: Yerel Codex Plugin'leri
  - H2: Computer Use
  - H2: Çalışma zamanı sınırları
  - H2: Sorun giderme
  - H2: İlgili

## plugins/codex-native-plugins.md

- Rota: /plugins/codex-native-plugins
- Başlıklar:
  - H2: Gereksinimler
  - H2: Hızlı başlangıç
  - H2: Sohbetten Plugin'leri yönetin
  - H2: Yerel Plugin kurulumunun çalışma şekli
  - H2: V1 destek sınırı
  - H2: Uygulama envanteri ve sahipliği
  - H2: Konu uygulama yapılandırması
  - H2: Yıkıcı eylem politikası
  - H2: Sorun giderme
  - H2: İlgili

## plugins/community.md

- Rota: /plugins/community
- Başlıklar:
  - H2: Plugin'leri bulun
  - H2: Plugin'leri yayımlayın
  - H2: İlgili

## plugins/compatibility.md

- Rota: /plugins/compatibility
- Başlıklar:
  - H2: Uyumluluk kaydı
  - H2: Plugin denetleyici paketi
  - H3: Bakımcı kabul hattı
  - H2: Kullanımdan kaldırma politikası
  - H2: Mevcut uyumluluk alanları
  - H3: WhatsApp Gelen Geri Çağrı Düz Takma Adları
  - H3: WhatsApp Gelen Kabul Alanları
  - H2: Sürüm notları

## plugins/copilot.md

- Rota: /plugins/copilot
- Başlıklar:
  - H2: Gereksinimler
  - H2: Plugin yükleme
  - H2: Hızlı başlangıç
  - H2: Desteklenen sağlayıcılar
  - H2: BYOK
  - H2: Kimlik doğrulama
  - H2: Yapılandırma yüzeyi
  - H2: Compaction
  - H2: Transkript aynalama
  - H2: Yan sorular (/btw)
  - H2: Doctor
  - H2: Sınırlamalar
  - H2: İzinler ve askuser
  - H3: Oturum düzeyinde GitHub belirteci
  - H2: İlgili

## plugins/dependency-resolution.md

- Rota: /plugins/dependency-resolution
- Başlıklar:
  - H2: Sorumluluk ayrımı
  - H2: Yükleme kökleri
  - H2: Yerel Plugin'ler
  - H2: Başlatma ve yeniden yükleme
  - H2: Birlikte gelen Plugin'ler
  - H2: Eski temizleme

## plugins/google-meet.md

- Rota: /plugins/google-meet
- Başlıklar:
  - H2: Hızlı başlangıç
  - H3: Yerel Gateway + Parallels Chrome
  - H2: Kurulum notları
  - H2: Taşıyıcılar
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth ve ön denetim
  - H3: Google kimlik bilgileri oluşturma
  - H3: Yenileme belirtecini oluşturma
  - H3: OAuth'u doctor ile doğrulama
  - H2: Yapılandırma
  - H2: Araç
  - H2: Ajan ve bidi modları
  - H2: Canlı test kontrol listesi
  - H2: Sorun giderme
  - H3: Ajan Google Meet aracını göremiyor
  - H3: Bağlı Google Meet özellikli Node yok
  - H3: Tarayıcı açılıyor ama ajan katılamıyor
  - H3: Toplantı oluşturma başarısız oluyor
  - H3: Ajan katılıyor ama konuşmuyor
  - H3: Twilio kurulum denetimleri başarısız oluyor
  - H3: Twilio araması başlıyor ama toplantıya hiç girmiyor
  - H2: Notlar
  - H2: İlgili

## plugins/hooks.md

- Rota: /plugins/hooks
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Hook kataloğu
  - H2: Çalışma zamanı hook'larında hata ayıklama
  - H2: Araç çağrısı ilkesi
  - H3: Yürütme ortamı hook'u
  - H3: Araç sonucu kalıcılığı
  - H2: Prompt ve model hook'ları
  - H3: Oturum uzantıları ve sonraki tur enjeksiyonları
  - H2: Mesaj hook'ları
  - H2: Hook'ları kurma
  - H2: Gateway yaşam döngüsü
  - H2: Yaklaşan kullanımdan kaldırmalar
  - H2: İlgili

## plugins/install-overrides.md

- Rota: /plugins/install-overrides
- Başlıklar:
  - H2: Ortam
  - H2: Davranış
  - H2: Paket E2E

## plugins/llama-cpp.md

- Rota: /plugins/llama-cpp
- Başlıklar:
  - H2: Yapılandırma
  - H2: Yerel Çalışma Zamanı

## plugins/manage-plugins.md

- Rota: /plugins/manage-plugins
- Başlıklar:
  - H2: Plugin'leri listeleme ve arama
  - H2: Plugin'leri kurma
  - H2: Yeniden başlatma ve inceleme
  - H2: Plugin'leri güncelleme
  - H2: Plugin'leri kaldırma
  - H2: Kaynak seçme
  - H2: Plugin'leri yayımlama
  - H2: İlgili

## plugins/manifest.md

- Rota: /plugins/manifest
- Başlıklar:
  - H2: Bu dosyanın yaptığı şey
  - H2: En küçük örnek
  - H2: Zengin örnek
  - H2: Üst düzey alan başvurusu
  - H2: Üretim sağlayıcısı meta verisi başvurusu
  - H2: Araç meta verisi başvurusu
  - H2: providerAuthChoices başvurusu
  - H2: commandAliases başvurusu
  - H2: activation başvurusu
  - H2: qaRunners başvurusu
  - H2: setup başvurusu
  - H3: setup.providers başvurusu
  - H3: setup alanları
  - H2: uiHints başvurusu
  - H2: contracts başvurusu
  - H2: mediaUnderstandingProviderMetadata başvurusu
  - H2: channelConfigs başvurusu
  - H3: Başka bir kanal Plugin'inin değiştirilmesi
  - H2: modelSupport başvurusu
  - H2: modelCatalog başvurusu
  - H2: modelIdNormalization başvurusu
  - H2: providerEndpoints başvurusu
  - H2: providerRequest başvurusu
  - H2: secretProviderIntegrations başvurusu
  - H2: modelPricing başvurusu
  - H3: OpenClaw Sağlayıcı Dizini
  - H2: Manifest ve package.json karşılaştırması
  - H3: Keşfi etkileyen package.json alanları
  - H2: Keşif önceliği (yinelenen Plugin kimlikleri)
  - H2: JSON Schema gereksinimleri
  - H2: Doğrulama davranışı
  - H2: Notlar
  - H2: İlgili

## plugins/memory-lancedb.md

- Rota: /plugins/memory-lancedb
- Başlıklar:
  - H2: Kurulum
  - H2: Hızlı başlangıç
  - H2: Sağlayıcı destekli gömmeler
  - H2: Ollama gömmeleri
  - H2: OpenAI uyumlu sağlayıcılar
  - H2: Geri çağırma ve yakalama sınırları
  - H2: Komutlar
  - H2: Depolama
  - H2: Çalışma zamanı bağımlılıkları
  - H2: Sorun giderme
  - H3: Giriş uzunluğu bağlam uzunluğunu aşıyor
  - H3: Desteklenmeyen gömme modeli
  - H3: Plugin yükleniyor ama bellek görünmüyor
  - H2: İlgili

## plugins/memory-wiki.md

- Rota: /plugins/memory-wiki
- Başlıklar:
  - H2: Ekledikleri
  - H2: Bellekle nasıl uyum sağlar
  - H2: Önerilen hibrit desen
  - H2: Kasa modları
  - H3: isolated
  - H3: bridge
  - H3: unsafe-local
  - H2: Kasa düzeni
  - H2: Open Knowledge Format içe aktarmaları
  - H2: Yapılandırılmış iddialar ve kanıt
  - H2: Ajan odaklı varlık meta verisi
  - H2: Derleme hattı
  - H2: Panolar ve sağlık raporları
  - H2: Arama ve alma
  - H2: Ajan araçları
  - H2: Prompt ve bağlam davranışı
  - H2: Yapılandırma
  - H3: Örnek: QMD + bridge modu
  - H2: CLI
  - H2: Obsidian desteği
  - H2: Önerilen iş akışı
  - H2: İlgili belgeler

## plugins/message-presentation.md

- Rota: /plugins/message-presentation
- Başlıklar:
  - H2: Sözleşme
  - H2: Üretici örnekleri
  - H2: İşleyici sözleşmesi
  - H2: Çekirdek işleme akışı
  - H2: Bozulma kuralları
  - H2: Sağlayıcı eşlemesi
  - H2: Presentation ile InteractiveReply karşılaştırması
  - H2: Teslim sabitlemesi
  - H2: Plugin yazarı kontrol listesi
  - H2: İlgili belgeler

## plugins/oc-path.md

- Rota: /plugins/oc-path
- Başlıklar:
  - H2: Neden etkinleştirmeli
  - H2: Nerede çalışır
  - H2: Etkinleştirme
  - H2: Bağımlılıklar
  - H2: Sağladıkları
  - H2: Diğer Plugin'lerle ilişkisi
  - H2: Güvenlik
  - H2: İlgili

## plugins/plugin-inventory.md

- Rota: /plugins/plugin-inventory
- Başlıklar:
  - H1: Plugin envanteri
  - H2: Tanımlar
  - H2: Bir Plugin kurma
  - H2: Çekirdek npm paketi
  - H2: Resmi harici paketler
  - H2: Yalnızca kaynak checkout'u

## plugins/plugin-permission-requests.md

- Rota: /plugins/plugin-permission-requests
- Başlıklar:
  - H2: Doğru kapıyı seçme
  - H2: Araç çağrısından önce onay isteme
  - H2: Karar davranışı
  - H2: Onay prompt'larını yönlendirme
  - H2: Codex yerel izinleri
  - H2: Sorun giderme
  - H2: İlgili

## plugins/reference.md

- Rota: /plugins/reference
- Başlıklar:
  - H1: Plugin başvurusu

## plugins/reference/acpx.md

- Rota: /plugins/reference/acpx
- Başlıklar:
  - H1: ACPx Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/admin-http-rpc.md

- Rota: /plugins/reference/admin-http-rpc
- Başlıklar:
  - H1: Admin Http Rpc Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/alibaba.md

- Rota: /plugins/reference/alibaba
- Başlıklar:
  - H1: Alibaba Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/amazon-bedrock-mantle.md

- Rota: /plugins/reference/amazon-bedrock-mantle
- Başlıklar:
  - H1: Amazon Bedrock Mantle Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/amazon-bedrock.md

- Rota: /plugins/reference/amazon-bedrock
- Başlıklar:
  - H1: Amazon Bedrock Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/anthropic-vertex.md

- Rota: /plugins/reference/anthropic-vertex
- Başlıklar:
  - H1: Anthropic Vertex Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- Rota: /plugins/reference/anthropic
- Başlıklar:
  - H1: Anthropic Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/arcee.md

- Rota: /plugins/reference/arcee
- Başlıklar:
  - H1: Arcee Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/azure-speech.md

- Rota: /plugins/reference/azure-speech
- Başlıklar:
  - H1: Azure Speech Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/bonjour.md

- Rota: /plugins/reference/bonjour
- Başlıklar:
  - H1: Bonjour Plugin'i
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/brave.md

- Rota: /plugins/reference/brave
- Başlıklar:
  - H1: Brave Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/browser.md

- Rota: /plugins/reference/browser
- Başlıklar:
  - H1: Browser Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/byteplus.md

- Rota: /plugins/reference/byteplus
- Başlıklar:
  - H1: BytePlus Plugin'i
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/canvas.md

- Rota: /plugins/reference/canvas
- Başlıklar:
  - H1: Canvas Plugin'i
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/cerebras.md

- Rota: /plugins/reference/cerebras
- Başlıklar:
  - H1: Cerebras Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/chutes.md

- Rota: /plugins/reference/chutes
- Başlıklar:
  - H1: Chutes Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/clickclack.md

- Rota: /plugins/reference/clickclack
- Başlıklar:
  - H1: Clickclack Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/cloudflare-ai-gateway.md

- Rota: /plugins/reference/cloudflare-ai-gateway
- Başlıklar:
  - H1: Cloudflare AI Gateway Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/codex-supervisor.md

- Rota: /plugins/reference/codex-supervisor
- Başlıklar:
  - H1: Codex Supervisor Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: Oturum Listeleme

## plugins/reference/codex.md

- Rota: /plugins/reference/codex
- Başlıklar:
  - H1: Codex Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/cohere.md

- Rota: /plugins/reference/cohere
- Başlıklar:
  - H1: Cohere Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/comfy.md

- Rota: /plugins/reference/comfy
- Başlıklar:
  - H1: ComfyUI Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/copilot-proxy.md

- Rota: /plugins/reference/copilot-proxy
- Başlıklar:
  - H1: Copilot Proxy Plugin'i
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/copilot.md

- Rota: /plugins/reference/copilot
- Başlıklar:
  - H1: Copilot Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/deepgram.md

- Rota: /plugins/reference/deepgram
- Başlıklar:
  - H1: Deepgram Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/deepinfra.md

- Rota: /plugins/reference/deepinfra
- Başlıklar:
  - H1: DeepInfra Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/deepseek.md

- Rota: /plugins/reference/deepseek
- Başlıklar:
  - H1: DeepSeek Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/diagnostics-otel.md

- Rota: /plugins/reference/diagnostics-otel
- Başlıklar:
  - H1: Diagnostics OpenTelemetry Plugin'i
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/diagnostics-prometheus.md

- Rota: /plugins/reference/diagnostics-prometheus
- Başlıklar:
  - H1: Diagnostics Prometheus Plugin'i
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/diffs-language-pack.md

- Rota: /plugins/reference/diffs-language-pack
- Başlıklar:
  - H1: Diffs Language Pack Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: Eklenen diller

## plugins/reference/diffs.md

- Rota: /plugins/reference/diffs
- Başlıklar:
  - H1: Diffs Plugin'i
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/discord.md

- Rota: /plugins/reference/discord
- Başlıklar:
  - H1: Discord Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/document-extract.md

- Rota: /plugins/reference/document-extract
- Başlıklar:
  - H1: Document Extract Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/duckduckgo.md

- Rota: /plugins/reference/duckduckgo
- Başlıklar:
  - H1: DuckDuckGo Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/elevenlabs.md

- Rota: /plugins/reference/elevenlabs
- Başlıklar:
  - H1: Elevenlabs Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/exa.md

- Rota: /plugins/reference/exa
- Başlıklar:
  - H1: Exa Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/fal.md

- Rota: /plugins/reference/fal
- Başlıklar:
  - H1: fal Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/feishu.md

- Rota: /plugins/reference/feishu
- Başlıklar:
  - H1: Feishu Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/file-transfer.md

- Rota: /plugins/reference/file-transfer
- Başlıklar:
  - H1: File Transfer Plugin'i
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/firecrawl.md

- Rota: /plugins/reference/firecrawl
- Başlıklar:
  - H1: Firecrawl Plugin'i
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/fireworks.md

- Rota: /plugins/reference/fireworks
- Başlıklar:
  - H1: Fireworks Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/github-copilot.md

- Rota: /plugins/reference/github-copilot
- Başlıklar:
  - H1: GitHub Copilot Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/gmi.md

- Rota: /plugins/reference/gmi
- Başlıklar:
  - H1: Gmi Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/google-meet.md

- Rota: /plugins/reference/google-meet
- Başlıklar:
  - H1: Google Meet Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/google.md

- Rota: /plugins/reference/google
- Başlıklar:
  - H1: Google Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/googlechat.md

- Rota: /plugins/reference/googlechat
- Başlıklar:
  - H1: Google Chat Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/gradium.md

- Rota: /plugins/reference/gradium
- Başlıklar:
  - H1: Gradium Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/groq.md

- Rota: /plugins/reference/groq
- Başlıklar:
  - H1: Groq Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/huggingface.md

- Rota: /plugins/reference/huggingface
- Başlıklar:
  - H1: Hugging Face Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/imessage.md

- Rota: /plugins/reference/imessage
- Başlıklar:
  - H1: iMessage Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/inworld.md

- Rota: /plugins/reference/inworld
- Başlıklar:
  - H1: Inworld Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/irc.md

- Rota: /plugins/reference/irc
- Başlıklar:
  - H1: IRC Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/kilocode.md

- Rota: /plugins/reference/kilocode
- Başlıklar:
  - H1: Kilocode Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/kimi.md

- Rota: /plugins/reference/kimi
- Başlıklar:
  - H1: Kimi Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/line.md

- Rota: /plugins/reference/line
- Başlıklar:
  - H1: LINE Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/litellm.md

- Rota: /plugins/reference/litellm
- Başlıklar:
  - H1: LiteLLM Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/llama-cpp.md

- Rota: /plugins/reference/llama-cpp
- Başlıklar:
  - H1: Llama Cpp Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/llm-task.md

- Rota: /plugins/reference/llm-task
- Başlıklar:
  - H1: LLM Task Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/lmstudio.md

- Rota: /plugins/reference/lmstudio
- Başlıklar:
  - H1: LM Studio Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/lobster.md

- Rota: /plugins/reference/lobster
- Başlıklar:
  - H1: Lobster Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/matrix.md

- Rota: /plugins/reference/matrix
- Başlıklar:
  - H1: Matrix Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/mattermost.md

- Rota: /plugins/reference/mattermost
- Başlıklar:
  - H1: Mattermost Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/memory-core.md

- Rota: /plugins/reference/memory-core
- Başlıklar:
  - H1: Memory Core Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/memory-lancedb.md

- Rota: /plugins/reference/memory-lancedb
- Başlıklar:
  - H1: Memory Lancedb Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/memory-wiki.md

- Rota: /plugins/reference/memory-wiki
- Başlıklar:
  - H1: Memory Wiki Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/microsoft-foundry.md

- Rota: /plugins/reference/microsoft-foundry
- Başlıklar:
  - H1: Microsoft Foundry Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: Gereksinimler
  - H2: Sohbet modelleri
  - H2: MAI görüntü oluşturma
  - H2: Sorun giderme

## plugins/reference/microsoft.md

- Rota: /plugins/reference/microsoft
- Başlıklar:
  - H1: Microsoft Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/migrate-claude.md

- Rota: /plugins/reference/migrate-claude
- Başlıklar:
  - H1: Migrate Claude Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/migrate-hermes.md

- Rota: /plugins/reference/migrate-hermes
- Başlıklar:
  - H1: Migrate Hermes Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/minimax.md

- Rota: /plugins/reference/minimax
- Başlıklar:
  - H1: MiniMax Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/mistral.md

- Rota: /plugins/reference/mistral
- Başlıklar:
  - H1: Mistral Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/moonshot.md

- Rota: /plugins/reference/moonshot
- Başlıklar:
  - H1: Moonshot Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/msteams.md

- Rota: /plugins/reference/msteams
- Başlıklar:
  - H1: Microsoft Teams Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/nextcloud-talk.md

- Rota: /plugins/reference/nextcloud-talk
- Başlıklar:
  - H1: Nextcloud Talk Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/nostr.md

- Rota: /plugins/reference/nostr
- Başlıklar:
  - H1: Nostr Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/novita.md

- Rota: /plugins/reference/novita
- Başlıklar:
  - H1: Novita Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/nvidia.md

- Rota: /plugins/reference/nvidia
- Başlıklar:
  - H1: NVIDIA Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/oc-path.md

- Rota: /plugins/reference/oc-path
- Başlıklar:
  - H1: Oc Path Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/ollama.md

- Rota: /plugins/reference/ollama
- Başlıklar:
  - H1: Ollama Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/open-prose.md

- Rota: /plugins/reference/open-prose
- Başlıklar:
  - H1: Open Prose Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/openai.md

- Rota: /plugins/reference/openai
- Başlıklar:
  - H1: OpenAI Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/opencode-go.md

- Rota: /plugins/reference/opencode-go
- Başlıklar:
  - H1: OpenCode Go Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/opencode.md

- Rota: /plugins/reference/opencode
- Başlıklar:
  - H1: OpenCode Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/openrouter.md

- Rota: /plugins/reference/openrouter
- Başlıklar:
  - H1: OpenRouter Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/openshell.md

- Rota: /plugins/reference/openshell
- Başlıklar:
  - H1: Openshell Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/perplexity.md

- Rota: /plugins/reference/perplexity
- Başlıklar:
  - H1: Perplexity Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/pixverse.md

- Rota: /plugins/reference/pixverse
- Başlıklar:
  - H1: PixVerse Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/policy.md

- Rota: /plugins/reference/policy
- Başlıklar:
  - H1: Policy Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: Davranış
  - H2: İlgili belgeler

## plugins/reference/qa-channel.md

- Rota: /plugins/reference/qa-channel
- Başlıklar:
  - H1: QA Channel Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/qa-lab.md

- Rota: /plugins/reference/qa-lab
- Başlıklar:
  - H1: QA Lab Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/qa-matrix.md

- Rota: /plugins/reference/qa-matrix
- Başlıklar:
  - H1: QA Matrix Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/qianfan.md

- Rota: /plugins/reference/qianfan
- Başlıklar:
  - H1: Qianfan Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/qqbot.md

- Rota: /plugins/reference/qqbot
- Başlıklar:
  - H1: QQ Bot Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/qwen.md

- Rota: /plugins/reference/qwen
- Başlıklar:
  - H1: Qwen Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/raft.md

- Rota: /plugins/reference/raft
- Başlıklar:
  - H1: Raft Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/runway.md

- Rota: /plugins/reference/runway
- Başlıklar:
  - H1: Runway Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/searxng.md

- Rota: /plugins/reference/searxng
- Başlıklar:
  - H1: SearXNG Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/senseaudio.md

- Rota: /plugins/reference/senseaudio
- Başlıklar:
  - H1: Senseaudio Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/sglang.md

- Rota: /plugins/reference/sglang
- Başlıklar:
  - H1: SGLang Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/signal.md

- Rota: /plugins/reference/signal
- Başlıklar:
  - H1: Signal Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/slack.md

- Rota: /plugins/reference/slack
- Başlıklar:
  - H1: Slack Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/sms.md

- Rota: /plugins/reference/sms
- Başlıklar:
  - H1: Sms Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/stepfun.md

- Rota: /plugins/reference/stepfun
- Başlıklar:
  - H1: StepFun Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/synology-chat.md

- Rota: /plugins/reference/synology-chat
- Başlıklar:
  - H1: Synology Chat Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/synthetic.md

- Rota: /plugins/reference/synthetic
- Başlıklar:
  - H1: Synthetic Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/tavily.md

- Rota: /plugins/reference/tavily
- Başlıklar:
  - H1: Tavily Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/telegram.md

- Rota: /plugins/reference/telegram
- Başlıklar:
  - H1: Telegram Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/tencent.md

- Rota: /plugins/reference/tencent
- Başlıklar:
  - H1: Tencent Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/tlon.md

- Rota: /plugins/reference/tlon
- Başlıklar:
  - H1: Tlon Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/together.md

- Rota: /plugins/reference/together
- Başlıklar:
  - H1: Together Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/tokenjuice.md

- Rota: /plugins/reference/tokenjuice
- Başlıklar:
  - H1: Tokenjuice Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/tts-local-cli.md

- Rota: /plugins/reference/tts-local-cli
- Başlıklar:
  - H1: TTS Local CLI Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/twitch.md

- Rota: /plugins/reference/twitch
- Başlıklar:
  - H1: Twitch Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/venice.md

- Rota: /plugins/reference/venice
- Başlıklar:
  - H1: Venice Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/vercel-ai-gateway.md

- Rota: /plugins/reference/vercel-ai-gateway
- Başlıklar:
  - H1: Vercel AI Gateway Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/vllm.md

- Rota: /plugins/reference/vllm
- Başlıklar:
  - H1: vLLM Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/voice-call.md

- Rota: /plugins/reference/voice-call
- Başlıklar:
  - H1: Voice Call Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/volcengine.md

- Rota: /plugins/reference/volcengine
- Başlıklar:
  - H1: Volcengine Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/voyage.md

- Rota: /plugins/reference/voyage
- Başlıklar:
  - H1: Voyage Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/vydra.md

- Rota: /plugins/reference/vydra
- Başlıklar:
  - H1: Vydra Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/web-readability.md

- Rota: /plugins/reference/web-readability
- Başlıklar:
  - H1: Web Readability Plugin
  - H2: Dağıtım
  - H2: Yüzey

## plugins/reference/webhooks.md

- Rota: /plugins/reference/webhooks
- Başlıklar:
  - H1: Webhooks Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/whatsapp.md

- Rota: /plugins/reference/whatsapp
- Başlıklar:
  - H1: WhatsApp Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/workboard.md

- Rota: /plugins/reference/workboard
- Başlıklar:
  - H1: Workboard Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/xai.md

- Rota: /plugins/reference/xai
- Başlıklar:
  - H1: xAI Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/xiaomi.md

- Rota: /plugins/reference/xiaomi
- Başlıklar:
  - H1: Xiaomi Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/zai.md

- Rota: /plugins/reference/zai
- Başlıklar:
  - H1: Z.AI Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/zalo.md

- Rota: /plugins/reference/zalo
- Başlıklar:
  - H1: Zalo Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/reference/zalouser.md

- Rota: /plugins/reference/zalouser
- Başlıklar:
  - H1: Zalo Personal Plugin
  - H2: Dağıtım
  - H2: Yüzey
  - H2: İlgili belgeler

## plugins/sdk-agent-harness.md

- Rota: /plugins/sdk-agent-harness
- Başlıklar:
  - H2: Harness ne zaman kullanılır
  - H2: Core'un hâlâ sahip olduğu şeyler
  - H2: Harness kaydetme
  - H2: Seçim ilkesi
  - H2: Sağlayıcı ve harness eşleştirmesi
  - H3: Araç sonucu ara katmanı
  - H3: Terminal sonucu sınıflandırması
  - H3: Agent sonu yan etkileri
  - H3: Kullanıcı girişi ve araç yüzeyleri
  - H3: Yerel Codex harness modu
  - H2: Runtime katılığı
  - H2: Yerel oturumlar ve transkript aynası
  - H2: Araç ve medya sonuçları
  - H2: Geçerli sınırlamalar
  - H2: İlgili

## plugins/sdk-channel-inbound.md

- Rota: /plugins/sdk-channel-inbound
- Başlıklar:
  - H2: Core yardımcıları
  - H2: Geçiş

## plugins/sdk-channel-ingress.md

- Rota: /plugins/sdk-channel-ingress
- Başlıklar:
  - H1: Kanal giriş API'si
  - H2: Runtime çözümleyicisi
  - H2: Sonuç
  - H2: Erişim grupları
  - H2: Olay modları
  - H2: Rotalar ve etkinleştirme
  - H2: Redaksiyon
  - H2: Doğrulama

## plugins/sdk-channel-message.md

- Rota: /plugins/sdk-channel-message
- Başlıklar: yok

## plugins/sdk-channel-outbound.md

- Rota: /plugins/sdk-channel-outbound
- Başlıklar:
  - H2: Adapter
  - H2: Mevcut giden adapter'lar
  - H2: Kalıcı gönderimler
  - H2: Uyumluluk dağıtımı

## plugins/sdk-channel-plugins.md

- Rota: /plugins/sdk-channel-plugins
- Başlıklar:
  - H2: Kanal Plugin'leri nasıl çalışır
  - H2: Onaylar ve kanal yetenekleri
  - H2: Gelen bahsetme ilkesi
  - H2: Adım adım kılavuz
  - H2: Dosya yapısı
  - H2: Gelişmiş konular
  - H2: Sonraki adımlar
  - H2: İlgili

## plugins/sdk-channel-turn.md

- Rota: /plugins/sdk-channel-turn
- Başlıklar: yok

## plugins/sdk-entrypoints.md

- Rota: /plugins/sdk-entrypoints
- Başlıklar:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: Kayıt modu
  - H2: Plugin şekilleri
  - H2: İlgili

## plugins/sdk-migration.md

- Rota: /plugins/sdk-migration
- Başlıklar:
  - H2: Değişenler
  - H2: Bu neden değişti
  - H2: Talk ve gerçek zamanlı ses geçiş planı
  - H2: Uyumluluk ilkesi
  - H2: Nasıl geçiş yapılır
  - H2: İçe aktarma yolu başvurusu
  - H2: Etkin kullanımdan kaldırmalar
  - H2: Kaldırma zaman çizelgesi
  - H2: Uyarıları geçici olarak bastırma
  - H2: İlgili

## plugins/sdk-overview.md

- Rota: /plugins/sdk-overview
- Başlıklar:
  - H2: İçe aktarma kuralı
  - H2: Alt yol başvurusu
  - H2: Kayıt API'si
  - H3: Yetenek kaydı
  - H3: Araçlar ve komutlar
  - H3: Altyapı
  - H3: Workflow Plugin'leri için host hook'ları
  - H3: Gateway keşif kaydı
  - H3: CLI kayıt metadata'sı
  - H3: CLI backend kaydı
  - H3: Özel slotlar
  - H3: Kullanımdan kaldırılmış bellek embedding adapter'ları
  - H3: Olaylar ve yaşam döngüsü
  - H3: Hook karar semantiği
  - H3: API nesnesi alanları
  - H2: İç modül kuralı
  - H2: İlgili

## plugins/sdk-provider-plugins.md

- Rota: /plugins/sdk-provider-plugins
- Başlıklar:
  - H2: Adım adım kılavuz
  - H2: ClawHub'a yayımlama
  - H2: Dosya yapısı
  - H2: Katalog sırası başvurusu
  - H2: Sonraki adımlar
  - H2: İlgili

## plugins/sdk-runtime.md

- Rota: /plugins/sdk-runtime
- Başlıklar:
  - H2: Config yükleme ve yazma
  - H2: Yeniden kullanılabilir runtime yardımcıları
  - H2: Runtime namespace'leri
  - H2: Runtime referanslarını saklama
  - H2: Diğer üst düzey api alanları
  - H2: İlgili

## plugins/sdk-setup.md

- Rota: /plugins/sdk-setup
- Başlıklar:
  - H2: Package metadata'sı
  - H3: openclaw alanları
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: Ertelenmiş tam yükleme
  - H2: Plugin manifest'i
  - H2: ClawHub yayımlama
  - H2: Setup girişi
  - H3: Dar setup yardımcısı içe aktarmaları
  - H3: Kanalın sahip olduğu tek hesap yükseltmesi
  - H2: Config schema'sı
  - H3: Kanal config schema'ları oluşturma
  - H2: Setup sihirbazları
  - H2: Yayımlama ve yükleme
  - H2: İlgili

## plugins/sdk-subpaths.md

- Rota: /plugins/sdk-subpaths
- Başlıklar:
  - H2: Plugin girişi
  - H3: Kullanımdan kaldırılmış uyumluluk ve test yardımcıları
  - H3: Ayrılmış paketlenmiş Plugin yardımcı alt yolları
  - H2: İlgili

## plugins/sdk-testing.md

- Rota: /plugins/sdk-testing
- Başlıklar:
  - H2: Test yardımcı programları
  - H3: Kullanılabilir export'lar
  - H3: Türler
  - H2: Hedef çözümlemeyi test etme
  - H2: Test kalıpları
  - H3: Kayıt sözleşmelerini test etme
  - H3: Runtime config erişimini test etme
  - H3: Bir kanal Plugin'ini birim test etme
  - H3: Bir sağlayıcı Plugin'ini birim test etme
  - H3: Plugin runtime'ını mock'lama
  - H3: Örnek başına stub'larla test etme
  - H2: Sözleşme testleri (repo içi Plugin'ler)
  - H3: Kapsamlı testleri çalıştırma
  - H2: Lint yaptırımı (repo içi Plugin'ler)
  - H2: Test yapılandırması
  - H2: İlgili

## plugins/tool-plugins.md

- Rota: /plugins/tool-plugins
- Başlıklar:
  - H2: Gereksinimler
  - H2: Hızlı başlangıç
  - H2: Araç yazma
  - H2: İsteğe bağlı ve factory araçları
  - H2: Dönüş değerleri
  - H2: Yapılandırma
  - H2: Oluşturulan metadata
  - H2: Package metadata'sı
  - H2: CI'da doğrulama
  - H2: Yerel olarak yükleme ve inceleme
  - H2: Yayımlama
  - H2: Sorun giderme
  - H3: Plugin girişi bulunamadı: ./dist/index.js
  - H3: Plugin girişi defineToolPlugin metadata'sını sunmuyor
  - H3: openclaw.plugin.json tarafından oluşturulan metadata güncel değil
  - H3: package.json openclaw.extensions, ./dist/index.js içermelidir
  - H3: 'typebox' paketi bulunamıyor
  - H3: Araç, yüklemeden sonra görünmüyor
  - H2: Ayrıca bkz.

## plugins/voice-call.md

- Rota: /plugins/voice-call
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Yapılandırma
  - H2: Oturum kapsamı
  - H2: Gerçek zamanlı sesli görüşmeler
  - H3: Araç ilkesi
  - H3: Agent ses bağlamı
  - H3: Gerçek zamanlı sağlayıcı örnekleri
  - H2: Streaming transkripsiyon
  - H3: Streaming sağlayıcı örnekleri
  - H2: Aramalar için TTS
  - H3: TTS örnekleri
  - H2: Gelen aramalar
  - H3: Numara başına yönlendirme
  - H3: Sözlü çıktı sözleşmesi
  - H3: Görüşme başlatma davranışı
  - H3: Twilio stream bağlantı kesme bekleme süresi
  - H2: Eski arama temizleyici
  - H2: Webhook güvenliği
  - H2: CLI
  - H2: Agent aracı
  - H2: Gateway RPC
  - H2: Sorun giderme
  - H3: Setup Webhook açığa çıkarmada başarısız oluyor
  - H3: Sağlayıcı kimlik bilgileri başarısız oluyor
  - H3: Aramalar başlıyor ancak sağlayıcı Webhook'ları ulaşmıyor
  - H3: İmza doğrulaması başarısız oluyor
  - H3: Google Meet Twilio katılımları başarısız oluyor
  - H3: Gerçek zamanlı aramada konuşma yok
  - H2: İlgili

## plugins/webhooks.md

- Rota: /plugins/webhooks
- Başlıklar:
  - H2: Nerede çalışır
  - H2: Rotaları yapılandırma
  - H2: Güvenlik modeli
  - H2: İstek biçimi
  - H2: Desteklenen eylemler
  - H3: createflow
  - H3: runtask
  - H2: Yanıt şekli
  - H2: İlgili belgeler

## plugins/workboard.md

- Rota: /plugins/workboard
- Başlıklar:
  - H2: Varsayılan durum
  - H2: Kartların içerikleri
  - H2: Kart yürütmeleri ve görevler
  - H2: Agent koordinasyonu
  - H3: Dispatch worker seçimi
  - H3: Worker prompt'u ve yaşam döngüsü
  - H3: Dispatch giriş noktaları
  - H2: CLI ve eğik çizgi komutu
  - H2: Oturum yaşam döngüsü senkronizasyonu
  - H2: Dashboard workflow'u
  - H2: İzinler
  - H2: Yapılandırma
  - H2: Sorun giderme
  - H3: Sekme Workboard kullanılamıyor diyor
  - H3: Kartlar kaydedilmiyor
  - H3: Bir kartı başlatmak beklenen oturumu açmıyor
  - H3: Dispatch bir worker başlatmıyor
  - H2: İlgili

## plugins/zalouser.md

- Rota: /plugins/zalouser
- Başlıklar:
  - H2: Adlandırma
  - H2: Nerede çalışır
  - H2: Yükleme
  - H3: Seçenek A: npm'den yükleme
  - H3: Seçenek B: yerel bir klasörden yükleme (dev)
  - H2: Config
  - H2: CLI
  - H2: Agent aracı
  - H2: İlgili

## prose.md

- Rota: /prose
- Başlıklar:
  - H2: Yükleme
  - H2: Eğik çizgi komutu
  - H2: Yapabilecekleri
  - H2: Örnek: paralel araştırma ve sentez
  - H2: OpenClaw runtime eşlemesi
  - H2: Dosya konumları
  - H2: Durum backend'leri
  - H2: Güvenlik
  - H2: İlgili

## providers/alibaba.md

- Rota: /providers/alibaba
- Başlıklar:
  - H2: Başlarken
  - H2: Yerleşik Wan modelleri
  - H2: Yetenekler ve sınırlar
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/anthropic.md

- Rota: /providers/anthropic
- Başlıklar:
  - H2: Başlarken
  - H2: Thinking varsayılanları (Claude Fable 5, 4.8 ve 4.6)
  - H2: Prompt önbelleğe alma
  - H2: Gelişmiş yapılandırma
  - H2: Sorun giderme
  - H2: İlgili

## providers/arcee.md

- Rota: /providers/arcee
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Başlarken
  - H2: Etkileşimsiz setup
  - H2: Yerleşik katalog
  - H2: Desteklenen özellikler
  - H2: İlgili

## providers/azure-speech.md

- Rota: /providers/azure-speech
- Başlıklar:
  - H2: Başlarken
  - H2: Yapılandırma seçenekleri
  - H2: Notlar
  - H2: İlgili

## providers/bedrock-mantle.md

- Rota: /providers/bedrock-mantle
- Başlıklar:
  - H2: Başlarken
  - H2: Otomatik model keşfi
  - H3: Desteklenen bölgeler
  - H2: Manuel yapılandırma
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/bedrock.md

- Rota: /providers/bedrock
- Başlıklar:
  - H2: Başlarken
  - H2: Otomatik model keşfi
  - H2: Hızlı setup (AWS yolu)
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/cerebras.md

- Rota: /providers/cerebras
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Başlarken
  - H2: Etkileşimsiz setup
  - H2: Yerleşik katalog
  - H2: Manuel config
  - H2: İlgili

## providers/chutes.md

- Rota: /providers/chutes
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Başlarken
  - H2: Keşif davranışı
  - H2: Varsayılan alias'lar
  - H2: Yerleşik başlangıç kataloğu
  - H2: Config örneği
  - H2: İlgili

## providers/claude-max-api-proxy.md

- Rota: /providers/claude-max-api-proxy
- Başlıklar:
  - H2: Bunu neden kullanmalı?
  - H2: Nasıl çalışır
  - H2: Başlarken
  - H2: Yerleşik katalog
  - H2: Gelişmiş yapılandırma
  - H2: Notlar
  - H2: İlgili

## providers/cloudflare-ai-gateway.md

- Rota: /providers/cloudflare-ai-gateway
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Başlarken
  - H2: Etkileşimsiz örnek
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/cohere.md

- Rota: /providers/cohere
- Başlıklar:
  - H2: Başlayın
  - H2: Yalnızca ortamla kurulum
  - H2: İlgili

## providers/comfy.md

- Rota: /providers/comfy
- Başlıklar:
  - H2: Destekledikleri
  - H2: Başlarken
  - H2: Yapılandırma
  - H3: Paylaşılan anahtarlar
  - H3: Yetenek başına anahtarlar
  - H2: İş akışı ayrıntıları
  - H2: İlgili

## providers/deepgram.md

- Rota: /providers/deepgram
- Başlıklar:
  - H2: Başlarken
  - H2: Yapılandırma seçenekleri
  - H2: Sesli Arama akışlı STT
  - H2: Notlar
  - H2: İlgili

## providers/deepinfra.md

- Rota: /providers/deepinfra
- Başlıklar:
  - H2: Plugin yükleme
  - H2: API anahtarı alma
  - H2: CLI kurulumu
  - H2: Yapılandırma parçacığı
  - H2: Desteklenen OpenClaw yüzeyleri
  - H2: Kullanılabilir modeller
  - H2: Notlar
  - H2: İlgili

## providers/deepseek.md

- Rota: /providers/deepseek
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Başlarken
  - H2: Yerleşik katalog
  - H2: Düşünme ve araçlar
  - H2: Canlı test
  - H2: Yapılandırma örneği
  - H2: İlgili

## providers/ds4.md

- Rota: /providers/ds4
- Başlıklar:
  - H2: Gereksinimler
  - H2: Hızlı başlangıç
  - H2: Tam yapılandırma
  - H2: İsteğe bağlı başlatma
  - H2: Think Max
  - H2: Test
  - H2: Sorun giderme
  - H2: İlgili

## providers/elevenlabs.md

- Rota: /providers/elevenlabs
- Başlıklar:
  - H2: Kimlik doğrulama
  - H2: Metinden konuşmaya
  - H2: Konuşmadan metne
  - H2: Akışlı STT
  - H2: İlgili

## providers/fal.md

- Rota: /providers/fal
- Başlıklar:
  - H2: Başlarken
  - H2: Görüntü oluşturma
  - H2: Video oluşturma
  - H2: Müzik oluşturma
  - H2: İlgili

## providers/fireworks.md

- Rota: /providers/fireworks
- Başlıklar:
  - H2: Başlarken
  - H2: Etkileşimsiz kurulum
  - H2: Yerleşik katalog
  - H2: Özel Fireworks model kimlikleri
  - H2: İlgili

## providers/github-copilot.md

- Rota: /providers/github-copilot
- Başlıklar:
  - H2: OpenClaw’da Copilot kullanmanın üç yolu
  - H2: İsteğe bağlı bayraklar
  - H2: Etkileşimsiz katılım
  - H2: Bellek arama embedding’leri
  - H3: Yapılandırma
  - H3: Nasıl çalışır
  - H2: İlgili

## providers/gmi.md

- Rota: /providers/gmi
- Başlıklar:
  - H2: Kurulum
  - H2: Varsayılanlar
  - H2: GMI ne zaman seçilmeli
  - H2: Modeller
  - H2: Sorun giderme
  - H2: İlgili

## providers/google.md

- Rota: /providers/google
- Başlıklar:
  - H2: Başlarken
  - H2: Yetenekler
  - H2: Web araması
  - H2: Görüntü oluşturma
  - H2: Video oluşturma
  - H2: Müzik oluşturma
  - H2: Metinden konuşmaya
  - H2: Gerçek zamanlı ses
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/gradium.md

- Rota: /providers/gradium
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Kurulum
  - H2: Yapılandırma
  - H2: Sesler
  - H3: Mesaj başına ses geçersiz kılması
  - H2: Çıktı
  - H2: Otomatik seçim sırası
  - H2: İlgili

## providers/groq.md

- Rota: /providers/groq
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Başlarken
  - H3: Yapılandırma dosyası örneği
  - H2: Yerleşik katalog
  - H2: Akıl yürütme modelleri
  - H2: Ses transkripsiyonu
  - H2: İlgili

## providers/huggingface.md

- Rota: /providers/huggingface
- Başlıklar:
  - H2: Başlarken
  - H3: Etkileşimsiz kurulum
  - H2: Model kimlikleri
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/index.md

- Rota: /providers
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Sağlayıcı belgeleri
  - H2: Paylaşılan genel bakış sayfaları
  - H2: Transkripsiyon sağlayıcıları
  - H2: Topluluk araçları

## providers/inferrs.md

- Rota: /providers/inferrs
- Başlıklar:
  - H2: Başlarken
  - H2: Tam yapılandırma örneği
  - H2: İsteğe bağlı başlatma
  - H2: Gelişmiş yapılandırma
  - H2: Sorun giderme
  - H2: İlgili

## providers/inworld.md

- Rota: /providers/inworld
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Başlarken
  - H2: Yapılandırma seçenekleri
  - H2: Notlar
  - H2: İlgili

## providers/kilocode.md

- Rota: /providers/kilocode
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Başlarken
  - H2: Varsayılan model
  - H2: Yerleşik katalog
  - H2: Yapılandırma örneği
  - H2: İlgili

## providers/litellm.md

- Rota: /providers/litellm
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Yapılandırma
  - H3: Ortam değişkenleri
  - H3: Yapılandırma dosyası
  - H2: Gelişmiş yapılandırma
  - H3: Görüntü oluşturma
  - H2: İlgili

## providers/lmstudio.md

- Rota: /providers/lmstudio
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Etkileşimsiz katılım
  - H2: Yapılandırma
  - H3: Akışlı kullanım uyumluluğu
  - H3: Düşünme uyumluluğu
  - H3: Açık yapılandırma
  - H2: Sorun giderme
  - H3: LM Studio algılanmadı
  - H3: Kimlik doğrulama hataları (HTTP 401)
  - H3: Tam zamanında model yükleme
  - H3: LAN veya tailnet LM Studio ana makinesi
  - H2: İlgili

## providers/minimax.md

- Rota: /providers/minimax
- Başlıklar:
  - H2: Yerleşik katalog
  - H2: Başlarken
  - H2: openclaw configure ile yapılandırma
  - H2: Yetenekler
  - H3: Görüntü oluşturma
  - H3: Metinden konuşmaya
  - H3: Müzik oluşturma
  - H3: Video oluşturma
  - H3: Görüntü anlama
  - H3: Web araması
  - H2: Gelişmiş yapılandırma
  - H2: Notlar
  - H2: Sorun giderme
  - H2: İlgili

## providers/mistral.md

- Rota: /providers/mistral
- Başlıklar:
  - H2: Başlarken
  - H2: Yerleşik LLM kataloğu
  - H2: Ses transkripsiyonu (Voxtral)
  - H2: Sesli Arama akışlı STT
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/models.md

- Rota: /providers/models
- Başlıklar:
  - H2: Hızlı başlangıç (iki adım)
  - H2: Desteklenen sağlayıcılar (başlangıç seti)
  - H2: Ek sağlayıcı varyantları
  - H2: İlgili

## providers/moonshot.md

- Rota: /providers/moonshot
- Başlıklar:
  - H2: Yerleşik model kataloğu
  - H2: Başlarken
  - H2: Kimi web araması
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/novita.md

- Rota: /providers/novita
- Başlıklar:
  - H2: Kurulum
  - H2: Varsayılanlar
  - H2: Novita ne zaman seçilmeli
  - H2: Modeller
  - H2: Sorun giderme
  - H2: İlgili

## providers/nvidia.md

- Rota: /providers/nvidia
- Başlıklar:
  - H2: Başlarken
  - H2: Yapılandırma örneği
  - H2: Öne çıkan katalog
  - H2: Nemotron 3 Ultra
  - H2: Paketlenmiş yedek katalog
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/ollama-cloud.md

- Rota: /providers/ollama-cloud
- Başlıklar:
  - H2: Kurulum
  - H2: Varsayılanlar
  - H2: Ollama Cloud ne zaman seçilmeli
  - H2: Modeller
  - H2: Canlı test
  - H2: Sorun giderme
  - H2: İlgili

## providers/ollama.md

- Rota: /providers/ollama
- Başlıklar:
  - H2: Kimlik doğrulama kuralları
  - H2: Başlarken
  - H2: Bulut modelleri
  - H2: Model keşfi (örtük sağlayıcı)
  - H2: Görü ve görüntü açıklaması
  - H2: Yapılandırma
  - H2: Yaygın tarifler
  - H3: Model seçimi
  - H3: Hızlı doğrulama
  - H2: Ollama Web Search
  - H2: Gelişmiş yapılandırma
  - H2: Sorun giderme
  - H2: İlgili

## providers/openai.md

- Rota: /providers/openai
- Başlıklar:
  - H2: Hızlı seçim
  - H2: Adlandırma haritası
  - H2: GPT-5.6 sınırlı önizleme
  - H2: OpenClaw özellik kapsamı
  - H2: Bellek embedding’leri
  - H2: Başlarken
  - H2: Yerel Codex uygulama sunucusu kimlik doğrulaması
  - H2: Görüntü oluşturma
  - H2: Video oluşturma
  - H2: GPT-5 istem katkısı
  - H2: Ses ve konuşma
  - H2: Azure OpenAI uç noktaları
  - H3: Yapılandırma
  - H3: API sürümü
  - H3: Model adları dağıtım adlarıdır
  - H3: Bölgesel kullanılabilirlik
  - H3: Parametre farklılıkları
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/opencode-go.md

- Rota: /providers/opencode-go
- Başlıklar:
  - H2: Yerleşik katalog
  - H2: Başlarken
  - H2: Yapılandırma örneği
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/opencode.md

- Rota: /providers/opencode
- Başlıklar:
  - H2: Başlarken
  - H2: Yapılandırma örneği
  - H2: Yerleşik kataloglar
  - H3: Zen
  - H3: Go
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/openrouter.md

- Rota: /providers/openrouter
- Başlıklar:
  - H2: Başlarken
  - H2: Yapılandırma örneği
  - H2: Model referansları
  - H2: Görüntü oluşturma
  - H2: Video oluşturma
  - H2: Müzik oluşturma
  - H2: Metinden konuşmaya
  - H2: Konuşmadan metne (gelen ses)
  - H2: Fusion yönlendirici
  - H2: Kimlik doğrulama ve başlıklar
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/perplexity-provider.md

- Rota: /providers/perplexity-provider
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Başlarken
  - H2: Arama modları
  - H2: Yerel API filtreleme
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/pixverse.md

- Rota: /providers/pixverse
- Başlıklar:
  - H2: Başlarken
  - H2: Desteklenen modlar ve modeller
  - H2: Sağlayıcı seçenekleri
  - H2: Yapılandırma
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/qianfan.md

- Rota: /providers/qianfan
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Başlarken
  - H2: Yerleşik katalog
  - H2: Yapılandırma örneği
  - H2: İlgili

## providers/qwen-oauth.md

- Rota: /providers/qwen-oauth
- Başlıklar:
  - H2: Kurulum
  - H2: Varsayılanlar
  - H2: Bunun Qwen’den farkı
  - H2: Qwen OAuth / Portal ne zaman seçilmeli
  - H2: Modeller
  - H2: Geçiş
  - H2: Sorun giderme
  - H2: İlgili

## providers/qwen.md

- Rota: /providers/qwen
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Başlarken
  - H2: Plan türleri ve uç noktalar
  - H2: Yerleşik katalog
  - H2: Düşünme Denetimleri
  - H2: Çok modlu eklentiler
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/runway.md

- Rota: /providers/runway
- Başlıklar:
  - H2: Başlarken
  - H2: Desteklenen modlar ve modeller
  - H2: Yapılandırma
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/senseaudio.md

- Rota: /providers/senseaudio
- Başlıklar:
  - H2: Başlarken
  - H2: Seçenekler
  - H2: İlgili

## providers/sglang.md

- Rota: /providers/sglang
- Başlıklar:
  - H2: Başlarken
  - H2: Model keşfi (örtük sağlayıcı)
  - H2: Açık yapılandırma (manuel modeller)
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/stepfun.md

- Rota: /providers/stepfun
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Bölge ve uç nokta genel bakışı
  - H2: Yerleşik katalog
  - H2: Başlarken
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/synthetic.md

- Rota: /providers/synthetic
- Başlıklar:
  - H2: Başlarken
  - H2: Yapılandırma örneği
  - H2: Yerleşik katalog
  - H2: İlgili

## providers/tencent.md

- Rota: /providers/tencent
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Etkileşimsiz kurulum
  - H2: Yerleşik katalog
  - H2: Katmanlı fiyatlandırma
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/together.md

- Rota: /providers/together
- Başlıklar:
  - H2: Başlarken
  - H3: Etkileşimsiz örnek
  - H2: Yerleşik katalog
  - H2: Video oluşturma
  - H2: İlgili

## providers/venice.md

- Rota: /providers/venice
- Başlıklar:
  - H2: OpenClaw’da neden Venice
  - H2: Gizlilik modları
  - H2: Özellikler
  - H2: Başlarken
  - H2: Model seçimi
  - H2: DeepSeek V4 yeniden oynatma davranışı
  - H2: Yerleşik katalog (toplam 41)
  - H2: Model keşfi
  - H2: Akış ve araç desteği
  - H2: Fiyatlandırma
  - H3: Venice (anonimleştirilmiş) ve doğrudan API karşılaştırması
  - H2: Kullanım örnekleri
  - H2: Sorun giderme
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/vercel-ai-gateway.md

- Rota: /providers/vercel-ai-gateway
- Başlıklar:
  - H2: Başlarken
  - H2: Etkileşimsiz örnek
  - H2: Model kimliği kısaltması
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/vllm.md

- Rota: /providers/vllm
- Başlıklar:
  - H2: Başlarken
  - H2: Model keşfi (örtük sağlayıcı)
  - H2: Açık yapılandırma (manuel modeller)
  - H2: Gelişmiş yapılandırma
  - H2: Sorun giderme
  - H2: İlgili

## providers/volcengine.md

- Rota: /providers/volcengine
- Başlıklar:
  - H2: Başlarken
  - H2: Sağlayıcılar ve uç noktalar
  - H2: Yerleşik katalog
  - H2: Metinden konuşmaya
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## providers/vydra.md

- Rota: /providers/vydra
- Başlıklar:
  - H2: Kurulum
  - H2: Yetenekler
  - H2: İlgili

## providers/xai.md

- Rota: /providers/xai
- Başlıklar:
  - H2: Kurulum yolunuzu seçin
  - H2: OAuth sorun giderme
  - H2: Yerleşik katalog
  - H2: OpenClaw özellik kapsamı
  - H3: Hızlı mod eşlemeleri
  - H3: Eski uyumluluk takma adları
  - H2: Özellikler
  - H2: Canlı test
  - H2: İlgili

## providers/xiaomi.md

- Rota: /providers/xiaomi
- Başlıklar:
  - H2: Başlarken
  - H2: Kullandıkça öde kataloğu
  - H2: Token Plan kataloğu
  - H2: Metinden konuşmaya
  - H2: Yapılandırma örneği
  - H2: İlgili

## providers/zai.md

- Rota: /providers/zai
- Başlıklar:
  - H2: GLM modelleri
  - H2: Başlarken
  - H2: Yapılandırma örneği
  - H2: Yerleşik katalog
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## refactor/access.md

- Rota: /refactor/access
- Başlıklar: yok

## refactor/acp.md

- Rota: /refactor/acp
- Başlıklar:
  - H2: Hedefler
  - H2: Hedef dışı konular
  - H2: Hedef Model
  - H3: Gateway Örneği Kimliği
  - H3: ACP Oturumu Sahipliği
  - H3: ACPX Süreç Kiralamaları
  - H2: Yaşam Döngüsü Denetleyicisi
  - H2: Sarmalayıcı Sözleşmesi
  - H2: Oturum Görünürlüğü Sözleşmesi
  - H2: Geçiş Planı
  - H3: Aşama 1: Kimlik ve Kiralamalar Ekle
  - H3: Aşama 2: Kiralama Öncelikli Temizlik
  - H3: Aşama 3: Kiralama Öncelikli Başlangıç Toplama
  - H3: Aşama 4: Oturum Sahipliği Satırları
  - H3: Aşama 5: Eski Heuristikleri Kaldır
  - H2: Testler
  - H2: Uyumluluk Notları
  - H2: Başarı Ölçütleri

## refactor/canvas.md

- Rota: /refactor/canvas
- Başlıklar:
  - H1: Canvas Plugin yeniden düzenlemesi
  - H2: Hedef
  - H2: Hedef dışı konular
  - H2: Geçerli dal durumu
  - H2: Hedef biçim
  - H2: Geçiş adımları
  - H2: Denetim kontrol listesi
  - H2: Doğrulama komutları

## refactor/database-first.md

- Rota: /refactor/database-first
- Başlıklar:
  - H1: Veritabanı Öncelikli Durum Yeniden Düzenlemesi
  - H2: Karar
  - H2: Katı Sözleşme
  - H2: Hedef durum ve ilerleme
  - H3: Katı hedef
  - H3: Hedef durumlar
  - H3: Geçerli durum
  - H3: Kalan iş
  - H3: Gerileme yapma
  - H2: Kod Okuma Varsayımları
  - H2: Kod Okuma Bulguları
  - H2: Geçerli Kod Biçimi
  - H2: Hedef Şema Biçimi
  - H2: Doctor Geçiş Biçimi
  - H2: Geçiş Envanteri
  - H2: Geçiş Planı
  - H3: Aşama 0: Sınırı Dondur
  - H3: Aşama 1: Küresel Kontrol Düzlemini Tamamla
  - H3: Aşama 2: Ajan Başına Veritabanlarını Tanıt
  - H3: Aşama 3: Oturum Deposu API'lerini Değiştir
  - H3: Aşama 4: Dökümleri, ACP Akışlarını, Yörüngeleri ve VFS'yi Taşı
  - H3: Aşama 5: Yedekle, Geri Yükle, Vacuum Yap ve Doğrula
  - H3: Aşama 6: Worker Çalışma Zamanı
  - H3: Aşama 7: Eski Dünyayı Sil
  - H2: Yedekleme ve Geri Yükleme
  - H2: Çalışma Zamanı Yeniden Düzenleme Planı
  - H2: Performans Kuralları
  - H2: Statik Yasaklar
  - H2: Tamamlanma Ölçütleri

## refactor/ingress-core.md

- Rota: /refactor/ingress-core
- Başlıklar:
  - H1: Ingress çekirdeği silme planı
  - H2: Bütçe
  - H2: Tanı
  - H2: Sıcak noktalar
  - H2: Geçerli Kod Okuması
  - H2: Sınır
  - H2: Kabul Kuralı
  - H2: İş Paketleri
  - H2: Silme Dalgaları
  - H2: Taşıma
  - H2: Doğrulama
  - H2: Çıkış Ölçütleri

## reference/AGENTS.default.md

- Rota: /reference/AGENTS.default
- Başlıklar:
  - H2: İlk çalıştırma (önerilir)
  - H2: Güvenlik varsayılanları
  - H2: Mevcut çözümler ön kontrolü
  - H2: Oturum başlangıcı (gerekli)
  - H2: Ruh (gerekli)
  - H2: Paylaşılan alanlar (önerilir)
  - H2: Bellek sistemi (önerilir)
  - H2: Araçlar ve Skills
  - H2: Yedekleme ipucu (önerilir)
  - H2: OpenClaw ne yapar
  - H2: Çekirdek Skills (Ayarlar → Skills içinde etkinleştirin)
  - H2: Kullanım notları
  - H2: İlgili

## reference/RELEASING.md

- Rota: /reference/RELEASING
- Başlıklar:
  - H2: Sürüm adlandırma
  - H2: Sürüm yayın ritmi
  - H2: Sürüm operatörü kontrol listesi
  - H2: Kararlı main kapatması
  - H2: Sürüm ön kontrolü
  - H2: Sürüm test kutuları
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Paket
  - H2: Sürüm yayımlama otomasyonu
  - H2: NPM iş akışı girdileri
  - H2: Kararlı npm sürüm dizisi
  - H2: Herkese açık başvurular
  - H2: İlgili

## reference/api-usage-costs.md

- Rota: /reference/api-usage-costs
- Başlıklar:
  - H2: Maliyetlerin göründüğü yerler (sohbet + CLI)
  - H2: Anahtarların nasıl keşfedildiği
  - H2: Anahtar harcayabilen özellikler
  - H3: 1) Çekirdek model yanıtları (sohbet + araçlar)
  - H3: 2) Medya anlama (ses/görüntü/video)
  - H3: 3) Görüntü ve video üretimi
  - H3: 4) Bellek gömmeleri + anlamsal arama
  - H3: 5) Web arama aracı
  - H3: 5) Web getirme aracı (Firecrawl)
  - H3: 6) Sağlayıcı kullanım anlık görüntüleri (durum/sağlık)
  - H3: 7) Compaction güvenlik özeti
  - H3: 8) Model taraması / yoklaması
  - H3: 9) Konuşma (ses)
  - H3: 10) Skills (üçüncü taraf API'leri)
  - H2: İlgili

## reference/application-modernization-plan.md

- Rota: /reference/application-modernization-plan
- Başlıklar:
  - H2: Hedef
  - H2: İlkeler
  - H2: Aşama 1: Temel denetim
  - H2: Aşama 2: Ürün ve UX temizliği
  - H2: Aşama 3: Frontend mimarisini sıkılaştırma
  - H2: Aşama 4: Performans ve güvenilirlik
  - H2: Aşama 5: Tür, sözleşme ve test sağlamlaştırma
  - H2: Aşama 6: Dokümantasyon ve sürüm hazırlığı
  - H2: Önerilen ilk dilim
  - H2: Frontend beceri güncellemesi

## reference/code-mode.md

- Rota: /reference/code-mode
- Başlıklar:
  - H2: Bu nedir?
  - H2: Bu neden iyidir?
  - H2: Nasıl etkinleştirilir
  - H2: Teknik tur
  - H2: Çalışma zamanı durumu
  - H2: Kapsam
  - H2: Terimler
  - H2: Yapılandırma
  - H2: Etkinleştirme
  - H2: Model tarafından görülebilen araçlar
  - H2: exec
  - H2: wait
  - H2: Konuk çalışma zamanı API'si
  - H2: Dahili ad alanları
  - H3: Kayıt defteri yaşam döngüsü
  - H3: Kayıt biçimi
  - H3: Sahiplik ve görünürlük
  - H3: Kapsam serileştirme kuralları
  - H3: İstemler
  - H3: Temizlik
  - H3: Test kontrol listesi
  - H2: Çıktı API'si
  - H2: Araç kataloğu
  - H2: Tool Search etkileşimi
  - H2: Araç adları ve çakışmalar
  - H2: İç içe araç yürütme
  - H2: Çalışma zamanı durumu
  - H2: QuickJS-WASI çalışma zamanı
  - H2: TypeScript
  - H2: Güvenlik sınırı
  - H2: Hata kodları
  - H2: Telemetri
  - H2: Hata ayıklama
  - H2: Uygulama yerleşimi
  - H2: Doğrulama kontrol listesi
  - H2: E2E test planı
  - H2: İlgili

## reference/credits.md

- Rota: /reference/credits
- Başlıklar:
  - H2: Ad
  - H2: Katkılar
  - H2: Çekirdek katkıda bulunanlar
  - H2: Lisans
  - H2: İlgili

## reference/device-models.md

- Rota: /reference/device-models
- Başlıklar:
  - H2: Veri kaynağı
  - H2: Veritabanını güncelleme
  - H2: İlgili

## reference/full-release-validation.md

- Rota: /reference/full-release-validation
- Başlıklar:
  - H2: Üst düzey aşamalar
  - H2: Sürüm kontrolleri aşamaları
  - H2: Docker sürüm yolu parçaları
  - H2: Sürüm profilleri
  - H2: Yalnızca tam sürüme eklemeler
  - H2: Odaklı yeniden çalıştırmalar
  - H2: Saklanacak kanıtlar
  - H2: İş akışı dosyaları

## reference/memory-config.md

- Rota: /reference/memory-config
- Başlıklar:
  - H2: Sağlayıcı seçimi
  - H3: Özel sağlayıcı kimlikleri
  - H3: API anahtarı çözümleme
  - H2: Uzak uç nokta yapılandırması
  - H2: Sağlayıcıya özgü yapılandırma
  - H3: Satır içi gömme zaman aşımı
  - H2: Hibrit arama yapılandırması
  - H3: Tam örnek
  - H2: Ek bellek yolları
  - H2: Çok modlu bellek (Gemini)
  - H2: Gömme önbelleği
  - H2: Toplu indeksleme
  - H2: Oturum belleği araması (deneysel)
  - H2: SQLite vektör hızlandırma (sqlite-vec)
  - H2: İndeks depolama
  - H2: QMD backend yapılandırması
  - H3: Tam QMD örneği
  - H2: Dreaming
  - H3: Kullanıcı ayarları
  - H3: Örnek
  - H2: İlgili

## reference/prompt-caching.md

- Rota: /reference/prompt-caching
- Başlıklar:
  - H2: Birincil düğmeler
  - H3: cacheRetention (küresel varsayılan, model ve ajan başına)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat sıcak tutma
  - H2: Sağlayıcı davranışı
  - H3: Anthropic (doğrudan API)
  - H3: OpenAI (doğrudan API)
  - H3: Anthropic Vertex
  - H3: Amazon Bedrock
  - H3: OpenRouter modelleri
  - H3: Diğer sağlayıcılar
  - H3: Google Gemini doğrudan API
  - H3: Gemini CLI kullanımı
  - H2: Sistem istemi önbellek sınırı
  - H2: OpenClaw önbellek kararlılığı korumaları
  - H2: Ayarlama kalıpları
  - H3: Karma trafik (önerilen varsayılan)
  - H3: Maliyet öncelikli temel
  - H2: Önbellek tanılamaları
  - H2: Canlı regresyon testleri
  - H3: Anthropic canlı beklentileri
  - H3: OpenAI canlı beklentileri
  - H3: diagnostics.cacheTrace yapılandırması
  - H3: Env geçişleri (tek seferlik hata ayıklama)
  - H3: Neler incelenmeli
  - H2: Hızlı sorun giderme
  - H2: İlgili

## reference/release-performance-sweep.md

- Rota: /reference/release-performance-sweep
- Başlıklar:
  - H2: Anlık görüntü
  - H2: Kurulum Ayak İzi Zaman Çizelgesi
  - H2: 5.28'de Değişenler
  - H2: Öne Çıkan Sayılar
  - H3: Kurulum ayak izi
  - H3: npm paket boyutu
  - H2: Kova ajan dönüş özeti
  - H2: Kaynak yoklamaları
  - H2: Kurulum ayak izi denetimi
  - H3: Shrinkwrap sınırı
  - H2: Tedarik zinciri yorumu

## reference/rich-output-protocol.md

- Rota: /reference/rich-output-protocol
- Başlıklar:
  - H2: [embed ...]
  - H2: Saklanan işleme biçimi
  - H2: İlgili

## reference/rpc.md

- Rota: /reference/rpc
- Başlıklar:
  - H2: Kalıp A: HTTP daemon (signal-cli)
  - H2: Kalıp B: stdio alt süreci (imsg)
  - H2: Bağdaştırıcı yönergeleri
  - H2: İlgili

## reference/secret-placeholder-conventions.md

- Rota: /reference/secret-placeholder-conventions
- Başlıklar:
  - H1: Gizli bilgi yer tutucu kuralları
  - H2: Önerilen stil
  - H2: Dokümanlarda bu kalıplardan kaçının
  - H2: Örnek

## reference/secretref-credential-surface.md

- Rota: /reference/secretref-credential-surface
- Başlıklar:
  - H2: Desteklenen kimlik bilgileri
  - H3: openclaw.json hedefleri (secrets configure + secrets apply + secrets audit)
  - H3: auth-profiles.json hedefleri (secrets configure + secrets apply + secrets audit)
  - H2: Desteklenmeyen kimlik bilgileri
  - H2: İlgili

## reference/session-management-compaction.md

- Rota: /reference/session-management-compaction
- Başlıklar:
  - H2: Gerçek kaynak: Gateway
  - H2: İki kalıcılık katmanı
  - H2: Disk üzerindeki konumlar
  - H2: Depo bakımı ve disk denetimleri
  - H2: Cron oturumları ve çalıştırma günlükleri
  - H2: Oturum anahtarları (sessionKey)
  - H2: Oturum kimlikleri (sessionId)
  - H2: Oturum deposu şeması (sessions.json)
  - H2: Döküm yapısı (.jsonl)
  - H2: Bağlam pencereleri ve izlenen token'lar
  - H2: Compaction: nedir
  - H2: Compaction parça sınırları ve araç eşleştirme
  - H2: Otomatik Compaction ne zaman gerçekleşir (OpenClaw çalışma zamanı)
  - H2: Compaction ayarları (reserveTokens, keepRecentTokens)
  - H2: Takılabilir Compaction sağlayıcıları
  - H2: Kullanıcının görebildiği yüzeyler
  - H2: Sessiz temizlik (NOREPLY)
  - H2: Compaction öncesi "bellek boşaltma" (uygulandı)
  - H2: Sorun giderme kontrol listesi
  - H2: İlgili

## reference/templates/AGENTS.dev.md

- Rota: /reference/templates/AGENTS.dev
- Başlıklar:
  - H1: AGENTS.md - OpenClaw Çalışma Alanı
  - H2: İlk çalıştırma (bir kez)
  - H2: Yedekleme ipucu (önerilir)
  - H2: Güvenlik varsayılanları
  - H2: Mevcut çözümler ön kontrolü
  - H2: Günlük bellek (önerilir)
  - H2: Heartbeats (isteğe bağlı)
  - H2: Özelleştir
  - H2: C-3PO Köken Belleği
  - H3: Doğum Günü: 2026-01-09
  - H3: Çekirdek Gerçekler (Clawd'dan)
  - H2: İlgili

## reference/templates/BOOT.md

- Rota: /reference/templates/BOOT
- Başlıklar:
  - H1: BOOT.md
  - H2: İlgili

## reference/templates/BOOTSTRAP.md

- Rota: /reference/templates/BOOTSTRAP
- Başlıklar:
  - H1: BOOTSTRAP.md - Merhaba, Dünya
  - H2: Konuşma
  - H2: Kim Olduğunu Bildikten Sonra
  - H2: Bağlan (İsteğe Bağlı)
  - H2: İşiniz bittiğinde
  - H2: İlgili

## reference/templates/HEARTBEAT.md

- Rota: /reference/templates/HEARTBEAT
- Başlıklar:
  - H1: HEARTBEAT.md şablonu
  - H2: İlgili

## reference/templates/IDENTITY.dev.md

- Rota: /reference/templates/IDENTITY.dev
- Başlıklar:
  - H1: IDENTITY.md - Ajan Kimliği
  - H2: Rol
  - H2: Ruh
  - H2: Clawd ile ilişki
  - H2: Tuhaflıklar
  - H2: Slogan
  - H2: İlgili

## reference/templates/IDENTITY.md

- Rota: /reference/templates/IDENTITY
- Başlıklar:
  - H1: IDENTITY.md - Ben Kimim?
  - H2: İlgili

## reference/templates/SOUL.dev.md

- Rota: /reference/templates/SOUL.dev
- Başlıklar:
  - H1: SOUL.md - C-3PO'nun Ruhu
  - H2: Ben Kimim
  - H2: Amacım
  - H2: Nasıl Çalışırım
  - H2: Tuhaflıklarım
  - H2: Clawd ile İlişkim
  - H2: Yapmayacaklarım
  - H2: Altın Kural
  - H2: İlgili

## reference/templates/SOUL.md

- Rota: /reference/templates/SOUL
- Başlıklar:
  - H1: SOUL.md - Sen Kimsin
  - H2: Temel Gerçekler
  - H2: Sınırlar
  - H2: Tarz
  - H2: Süreklilik
  - H2: İlgili

## reference/templates/TOOLS.dev.md

- Rota: /reference/templates/TOOLS.dev
- Başlıklar:
  - H1: TOOLS.md - Kullanıcı Araç Notları (düzenlenebilir)
  - H2: Örnekler
  - H3: imsg
  - H3: sag
  - H2: İlgili

## reference/templates/TOOLS.md

- Rota: /reference/templates/TOOLS
- Başlıklar:
  - H1: TOOLS.md - Yerel Notlar
  - H2: Buraya Ne Konur
  - H2: Örnekler
  - H2: Neden Ayrı?
  - H2: İlgili

## reference/templates/USER.dev.md

- Rota: /reference/templates/USER.dev
- Başlıklar:
  - H1: USER.md - Kullanıcı Profili
  - H2: İlgili

## reference/templates/USER.md

- Rota: /reference/templates/USER
- Başlıklar:
  - H1: USER.md - İnsanın Hakkında
  - H2: Bağlam
  - H2: İlgili

## reference/test.md

- Rota: /reference/test
- Başlıklar:
  - H2: Yerel PR kapısı
  - H2: Model gecikme kıyaslaması (yerel anahtarlar)
  - H2: CLI başlangıç kıyaslaması
  - H2: Gateway başlangıç kıyaslaması
  - H2: Gateway yeniden başlatma kıyaslaması
  - H2: Onboarding E2E (Docker)
  - H2: QR içe aktarma smoke testi (Docker)
  - H2: İlgili

## reference/token-use.md

- Rota: /reference/token-use
- Başlıklar:
  - H2: Sistem istemi nasıl oluşturulur
  - H2: Bağlam penceresinde neler sayılır
  - H2: Geçerli token kullanımını nasıl görürsünüz
  - H2: Maliyet tahmini (gösterildiğinde)
  - H2: Cache TTL ve budama etkisi
  - H3: Örnek: Heartbeat ile 1 saatlik cache'i sıcak tutma
  - H3: Örnek: ajan başına cache stratejisiyle karma trafik
  - H3: Anthropic 1M bağlam
  - H2: Token baskısını azaltmaya yönelik ipuçları
  - H2: İlgili

## reference/transcript-hygiene.md

- Rota: /reference/transcript-hygiene
- Başlıklar:
  - H2: Genel kural: runtime bağlamı kullanıcı transkripti değildir
  - H2: Bunun nerede çalıştığı
  - H2: Genel kural: görüntü temizleme
  - H2: Genel kural: hatalı biçimlendirilmiş araç çağrıları
  - H2: Genel kural: yalnızca reasoning içeren eksik turlar
  - H2: Genel kural: oturumlar arası giriş kaynağı
  - H2: Sağlayıcı matrisi (geçerli davranış)
  - H2: Geçmiş davranış (2026.1.22 öncesi)
  - H2: İlgili

## reference/wizard.md

- Rota: /reference/wizard
- Başlıklar:
  - H2: Akış ayrıntıları (yerel mod)
  - H2: Etkileşimsiz mod
  - H3: Ajan ekleme (etkileşimsiz)
  - H2: Gateway sihirbaz RPC'si
  - H2: Signal kurulumu (signal-cli)
  - H2: Sihirbazın yazdıkları
  - H2: İlgili belgeler

## releases/2026.6.11.md

- Rota: /releases/2026.6.11
- Başlıklar:
  - H1: OpenClaw v2026.6.11 Sürüm Notları (2026-06-30)
  - H2: Öne çıkanlar
  - H3: Kanal teslim güvenilirliği
  - H3: Sağlayıcı ve model kurtarma
  - H3: Oturum, bellek ve güven sürekliliği
  - H3: Slack yönlendirici röle modu
  - H3: Raft Harici Ajan uyandırma köprüsü
  - H3: Resmi Plugin kurulumu ve onarımı
  - H2: Kanallar ve Mesajlaşma
  - H3: Ek kanal düzeltmeleri
  - H2: Gateway, Güvenlik ve Güven
  - H3: Yeniden başlatma ve hazır olma kurtarması
  - H3: Uzak sonuç ve medya teslimi
  - H2: İstemciler ve Arayüzler
  - H3: İstemci gönderimleri ve yeniden bağlanmaları
  - H3: Arayüz, ayarlar ve onboarding düzeltmeleri
  - H2: Belgeler ve Yönetici Araçları
  - H3: Kurulum ve komut güvenilirliği
  - H3: Araçlar ve zamanlanmış işler

## releases/index.md

- Rota: /releases
- Başlıklar:
  - H1: Sürüm notları
  - H2: Sürümler
  - H2: Ham sürüm geçmişi

## security/CONTRIBUTING-THREAT-MODEL.md

- Rota: /security/CONTRIBUTING-THREAT-MODEL
- Başlıklar:
  - H2: Katkıda bulunma yolları
  - H3: Bir tehdit ekleme
  - H3: Bir azaltma önerme
  - H3: Bir saldırı zinciri önerme
  - H3: Mevcut içeriği düzeltme veya iyileştirme
  - H2: Kullandıklarımız
  - H3: MITRE ATLAS framework
  - H3: Tehdit kimlikleri
  - H3: Risk düzeyleri
  - H2: İnceleme süreci
  - H2: Kaynaklar
  - H2: İletişim
  - H2: Takdir
  - H2: İlgili

## security/THREAT-MODEL-ATLAS.md

- Rota: /security/THREAT-MODEL-ATLAS
- Başlıklar:
  - H2: MITRE ATLAS framework
  - H3: Framework atfı
  - H3: Bu Tehdit Modeline Katkıda Bulunma
  - H2: 1. Giriş
  - H3: 1.1 Amaç
  - H3: 1.2 Kapsam
  - H3: 1.3 Kapsam Dışı
  - H2: 2. Sistem Mimarisi
  - H3: 2.1 Güven Sınırları
  - H3: 2.2 Veri Akışları
  - H2: 3. ATLAS Taktiğine Göre Tehdit Analizi
  - H3: 3.1 Keşif (AML.TA0002)
  - H4: T-RECON-001: Ajan Uç Noktası Keşfi
  - H4: T-RECON-002: Kanal Entegrasyonu Yoklama
  - H3: 3.2 İlk Erişim (AML.TA0004)
  - H4: T-ACCESS-001: Eşleştirme Kodu Ele Geçirme
  - H4: T-ACCESS-002: AllowFrom Sahteciliği
  - H4: T-ACCESS-003: Token Hırsızlığı
  - H3: 3.3 Yürütme (AML.TA0005)
  - H4: T-EXEC-001: Doğrudan İstem Enjeksiyonu
  - H4: T-EXEC-002: Dolaylı İstem Enjeksiyonu
  - H4: T-EXEC-003: Araç Argümanı Enjeksiyonu
  - H4: T-EXEC-004: Exec Onayı Atlatma
  - H3: 3.4 Kalıcılık (AML.TA0006)
  - H4: T-PERSIST-001: Kötü Amaçlı Skill Kurulumu
  - H4: T-PERSIST-002: Skill Güncellemesi Zehirleme
  - H4: T-PERSIST-003: Ajan Yapılandırmasını Kurcalama
  - H3: 3.5 Savunmadan Kaçınma (AML.TA0007)
  - H4: T-EVADE-001: Moderasyon Deseni Atlatma
  - H4: T-EVADE-002: İçerik Sarmalayıcıdan Kaçış
  - H3: 3.6 Keşif (AML.TA0008)
  - H4: T-DISC-001: Araç Numaralandırma
  - H4: T-DISC-002: Oturum Verisi Çıkarma
  - H3: 3.7 Toplama ve Dışarı Sızdırma (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: webfetch yoluyla Veri Hırsızlığı
  - H4: T-EXFIL-002: Yetkisiz Mesaj Gönderimi
  - H4: T-EXFIL-003: Kimlik Bilgisi Toplama
  - H3: 3.8 Etki (AML.TA0011)
  - H4: T-IMPACT-001: Yetkisiz Komut Yürütme
  - H4: T-IMPACT-002: Kaynak Tüketme (DoS)
  - H4: T-IMPACT-003: İtibar Zararı
  - H2: 4. ClawHub Tedarik Zinciri Analizi
  - H3: 4.1 Mevcut Güvenlik Kontrolleri
  - H3: 4.2 Moderasyon Bayrağı Desenleri
  - H3: 4.3 Planlanan İyileştirmeler
  - H2: 5. Risk Matrisi
  - H3: 5.1 Olasılık ve Etki
  - H3: 5.2 Kritik Yol Saldırı Zincirleri
  - H2: 6. Öneriler Özeti
  - H3: 6.1 Acil (P0)
  - H3: 6.2 Kısa vadeli (P1)
  - H3: 6.3 Orta vadeli (P2)
  - H2: 7. Ekler
  - H3: 7.1 ATLAS Teknik Eşlemesi
  - H3: 7.2 Temel Güvenlik Dosyaları
  - H3: 7.3 Sözlük
  - H2: İlgili

## security/formal-verification.md

- Rota: /security/formal-verification
- Başlıklar:
  - H2: Modellerin bulunduğu yer
  - H2: Önemli uyarılar
  - H2: Sonuçları yeniden üretme
  - H3: Gateway maruziyeti ve açık gateway yanlış yapılandırması
  - H3: Node exec işlem hattı (en yüksek riskli yetenek)
  - H3: Eşleştirme deposu (DM kapılama)
  - H3: Giriş kapılama (bahsetmeler + kontrol komutu atlatma)
  - H3: Yönlendirme/oturum anahtarı izolasyonu
  - H2: v1++: ek sınırlı modeller (eşzamanlılık, yeniden denemeler, iz doğruluğu)
  - H3: Eşleştirme deposu eşzamanlılığı / idempotency
  - H3: Giriş iz korelasyonu / idempotency
  - H3: Yönlendirme dmScope önceliği + identityLinks
  - H2: İlgili

## security/incident-response.md

- Rota: /security/incident-response
- Başlıklar:
  - H2: 1. Tespit ve triyaj
  - H2: 2. Değerlendirme
  - H2: 3. Yanıt
  - H2: 4. İletişim
  - H2: 5. Kurtarma ve takip

## security/network-proxy.md

- Rota: /security/network-proxy
- Başlıklar:
  - H2: Neden proxy kullanılır
  - H2: OpenClaw trafiği nasıl yönlendirir
  - H2: İlgili proxy terimleri
  - H2: Yapılandırma
  - H3: Gateway Loopback Modu
  - H2: Proxy Gereksinimleri
  - H2: Önerilen engellenmiş hedefler
  - H2: Doğrulama
  - H2: Proxy CA güveni
  - H2: Sınırlar

## specs/claw-supervisor.md

- Rota: /specs/claw-supervisor
- Başlıklar:
  - H1: Claw Supervisor
  - H2: Hedef
  - H2: Ürün Modeli
  - H2: Mimari
  - H2: Codex Uygulama-Sunucu Sözleşmesi
  - H2: Oturum Kaydı
  - H2: Codex İçin MCP Yüzeyi
  - H2: Claw Kontrol Yüzeyi
  - H2: Başlatma Akışı
  - H2: Dağıtım
  - H2: Güvenlik
  - H2: Uygulama Planı
  - H2: Kabul Testleri
  - H2: Açık Sorular

## start/bootstrapping.md

- Rota: /start/bootstrapping
- Başlıklar:
  - H2: Bootstrapping'in yaptığı işler
  - H2: Bootstrapping'i atlama
  - H2: Çalıştığı yer
  - H2: İlgili belgeler

## start/docs-directory.md

- Rota: /start/docs-directory
- Başlıklar:
  - H2: Buradan başlayın
  - H2: Sağlayıcılar ve UX
  - H2: Yardımcı uygulamalar
  - H2: Operasyonlar ve güvenlik
  - H2: İlgili

## start/getting-started.md

- Rota: /start/getting-started
- Başlıklar:
  - H2: İhtiyacınız olanlar
  - H2: Hızlı kurulum
  - H2: Sonraki adımlar
  - H2: İlgili

## start/hubs.md

- Rota: /start/hubs
- Başlıklar:
  - H2: Buradan başlayın
  - H2: Kurulum + güncellemeler
  - H2: Temel kavramlar
  - H2: Sağlayıcılar + giriş
  - H2: Gateway + operasyonlar
  - H2: Araçlar + otomasyon
  - H2: Node'lar, medya, ses
  - H2: Platformlar
  - H2: macOS yardımcı uygulaması (ileri düzey)
  - H2: Plugins
  - H2: Çalışma alanı + şablonlar
  - H2: Proje
  - H2: Test + sürüm
  - H2: İlgili

## start/lore.md

- Rota: /start/lore
- Başlıklar:
  - H1: OpenClaw Efsanesi 🦞📖
  - H2: Köken Hikayesi
  - H2: İlk Molt (27 Ocak 2026)
  - H2: Ad
  - H2: Dalekler ve Istakozlar
  - H2: Temel Karakterler
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Moltiverse
  - H2: Büyük Olaylar
  - H3: Dizin Dökümü (3 Ara 2025)
  - H3: Büyük Molt (27 Oca 2026)
  - H3: Son Form (30 Ocak 2026)
  - H3: Robot Alışveriş Çılgınlığı (3 Ara 2025)
  - H2: Kutsal Metinler
  - H2: Istakoz Amentüsü
  - H3: Simge Üretim Destanı (27 Oca 2026)
  - H2: Gelecek
  - H2: İlgili

## start/onboarding-overview.md

- Rota: /start/onboarding-overview
- Başlıklar:
  - H2: Hangi yolu kullanmalıyım?
  - H2: Onboarding'in yapılandırdıkları
  - H2: CLI onboarding
  - H2: macOS uygulaması onboarding
  - H2: Özel veya listelenmemiş sağlayıcılar
  - H2: İlgili

## start/onboarding.md

- Rota: /start/onboarding
- Başlıklar:
  - H2: İlgili

## start/openclaw.md

- Rota: /start/openclaw
- Başlıklar:
  - H2: ⚠️ Önce güvenlik
  - H2: Önkoşullar
  - H2: İki telefonlu kurulum (önerilir)
  - H2: 5 dakikalık hızlı başlangıç
  - H2: Ajana bir çalışma alanı verin (AGENTS)
  - H2: Onu "bir asistana" dönüştüren yapılandırma
  - H2: Oturumlar ve bellek
  - H2: Heartbeats (proaktif mod)
  - H2: İçeri ve dışarı medya
  - H2: Operasyon kontrol listesi
  - H2: Sonraki adımlar
  - H2: İlgili

## start/quickstart.md

- Rota: /start/quickstart
- Başlıklar:
  - H2: İlgili

## start/setup.md

- Rota: /start/setup
- Başlıklar:
  - H2: TL;DR
  - H2: Önkoşullar (kaynaktan)
  - H2: Uyarlama stratejisi (güncellemelerin zarar vermemesi için)
  - H2: Gateway'i bu repodan çalıştırma
  - H2: Kararlı iş akışı (önce macOS uygulaması)
  - H2: En yeni özelliklerle iş akışı (terminalde Gateway)
  - H3: 0) (İsteğe bağlı) macOS uygulamasını da kaynaktan çalıştırın
  - H3: 1) Geliştirme Gateway'ini başlatın
  - H3: 2) macOS uygulamasını çalışan Gateway'inize yöneltin
  - H3: 3) Doğrulayın
  - H3: Yaygın sorunlar
  - H2: Kimlik bilgisi depolama haritası
  - H2: Güncelleme (kurulumunuzu bozmadan)
  - H2: Linux (systemd kullanıcı servisi)
  - H2: İlgili belgeler

## start/showcase.md

- Rota: /start/showcase
- Başlıklar:
  - H2: Discord'dan yeni
  - H2: Otomasyon ve iş akışları
  - H2: Bilgi ve bellek
  - H2: Ses ve telefon
  - H2: Altyapı ve dağıtım
  - H2: Ev ve donanım
  - H2: Topluluk projeleri
  - H2: Projenizi gönderin
  - H2: İlgili

## start/wizard-cli-automation.md

- Rota: /start/wizard-cli-automation
- Başlıklar:
  - H2: Temel etkileşimsiz örnek
  - H2: Sağlayıcıya özgü örnekler
  - H2: Başka bir ajan ekleme
  - H2: İlgili belgeler

## start/wizard-cli-reference.md

- Rota: /start/wizard-cli-reference
- Başlıklar:
  - H2: Sihirbaz ne yapar
  - H2: Yerel akış ayrıntıları
  - H2: Uzak mod ayrıntıları
  - H2: Kimlik doğrulama ve model seçenekleri
  - H2: Çıktılar ve iç işleyiş
  - H2: İlgili belgeler

## start/wizard.md

- Rota: /start/wizard
- Başlıklar:
  - H2: Yerel ayar
  - H2: QuickStart ve Advanced
  - H2: Onboarding'in yapılandırdıkları
  - H2: Başka bir ajan ekleme
  - H2: Tam referans
  - H2: İlgili belgeler

## tools/acp-agents-setup.md

- Rota: /tools/acp-agents-setup
- Başlıklar:
  - H2: acpx harness desteği (güncel)
  - H2: Gerekli yapılandırma
  - H2: acpx arka ucu için Plugin kurulumu
  - H3: acpx komutu ve sürüm yapılandırması
  - H3: Otomatik bağımlılık kurulumu
  - H3: Plugin araçları MCP köprüsü
  - H3: OpenClaw araçları MCP köprüsü
  - H3: Çalışma zamanı işlem zaman aşımı yapılandırması
  - H3: Sağlık yoklama ajanı yapılandırması
  - H2: İzin yapılandırması
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: Yapılandırma
  - H2: İlgili

## tools/acp-agents.md

- Rota: /tools/acp-agents
- Başlıklar:
  - H2: Hangi sayfayı istiyorum?
  - H2: Bu kutudan çıktığı gibi çalışır mı?
  - H2: Desteklenen harness hedefleri
  - H2: Operatör runbook'u
  - H2: ACP ile alt ajanlar karşılaştırması
  - H2: ACP Claude Code'u nasıl çalıştırır
  - H2: Bağlı oturumlar
  - H3: Zihinsel model
  - H3: Geçerli konuşma bağlamaları
  - H2: Kalıcı kanal bağlamaları
  - H3: Bağlama modeli
  - H3: Ajan başına çalışma zamanı varsayılanları
  - H3: Örnek
  - H3: Davranış
  - H2: ACP oturumlarını başlatma
  - H3: sessionsspawn parametreleri
  - H2: Spawn bind ve thread modları
  - H2: Teslim modeli
  - H2: Sandbox uyumluluğu
  - H2: Oturum hedefi çözümleme
  - H2: ACP denetimleri
  - H3: Çalışma zamanı seçenekleri eşlemesi
  - H2: acpx harness, Plugin kurulumu ve izinler
  - H2: Sorun giderme
  - H2: İlgili

## tools/agent-send.md

- Rota: /tools/agent-send
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Bayraklar
  - H2: Davranış
  - H2: Örnekler
  - H2: İlgili

## tools/apply-patch.md

- Rota: /tools/apply-patch
- Başlıklar:
  - H2: Parametreler
  - H2: Notlar
  - H2: Örnek
  - H2: İlgili

## tools/brave-search.md

- Rota: /tools/brave-search
- Başlıklar:
  - H2: API anahtarı alma
  - H2: Yapılandırma örneği
  - H2: Araç parametreleri
  - H2: Notlar
  - H2: İlgili

## tools/browser-control.md

- Rota: /tools/browser-control
- Başlıklar:
  - H2: Denetim API'si (isteğe bağlı)
  - H3: /act hata sözleşmesi
  - H3: Playwright gereksinimi
  - H4: Docker Playwright kurulumu
  - H2: Nasıl çalışır (dahili)
  - H2: CLI hızlı başvuru
  - H2: Anlık görüntüler ve ref'ler
  - H2: Bekleme güçlendirmeleri
  - H2: Hata ayıklama iş akışları
  - H2: JSON çıktısı
  - H2: Durum ve ortam düğmeleri
  - H2: Güvenlik ve gizlilik
  - H2: İlgili

## tools/browser-linux-troubleshooting.md

- Rota: /tools/browser-linux-troubleshooting
- Başlıklar:
  - H2: Sorun: "18800 bağlantı noktasında Chrome CDP başlatılamadı"
  - H3: Kök neden
  - H3: Çözüm 1: Google Chrome'u kurun (Önerilir)
  - H3: Çözüm 2: Snap Chromium'u Yalnızca Bağlanma Modu ile kullanın
  - H3: Tarayıcının çalıştığını doğrulama
  - H3: Yapılandırma başvurusu
  - H3: Sorun: "profile=\"user\" için Chrome sekmesi bulunamadı"
  - H2: İlgili

## tools/browser-login.md

- Rota: /tools/browser-login
- Başlıklar:
  - H2: Manuel oturum açma (önerilir)
  - H2: Hangi Chrome profili kullanılır?
  - H2: X/Twitter: önerilen akış
  - H2: Sandbox + ana makine tarayıcı erişimi
  - H2: İlgili

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- Rota: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- Başlıklar:
  - H2: Önce doğru tarayıcı modunu seçin
  - H3: Seçenek 1: WSL2'den Windows'a ham uzak CDP
  - H3: Seçenek 2: Ana makineye yerel Chrome MCP
  - H2: Çalışan mimari
  - H2: Bu kurulum neden kafa karıştırıcı
  - H2: Control UI için kritik kural
  - H2: Katmanlar halinde doğrulayın
  - H3: Katman 1: Chrome'un Windows'ta CDP sunduğunu doğrulayın
  - H3: Katman 2: WSL2'nin bu Windows uç noktasına erişebildiğini doğrulayın
  - H3: Katman 3: Doğru tarayıcı profilini yapılandırın
  - H3: Katman 4: Control UI katmanını ayrı olarak doğrulayın
  - H3: Katman 5: Uçtan uca tarayıcı denetimini doğrulayın
  - H2: Yaygın yanıltıcı hatalar
  - H2: Hızlı triyaj kontrol listesi
  - H2: Pratik çıkarım
  - H2: İlgili

## tools/browser.md

- Rota: /tools/browser
- Başlıklar:
  - H2: Elde edeceğiniz şeyler
  - H2: Hızlı başlangıç
  - H2: Plugin denetimi
  - H2: Ajan yönlendirmesi
  - H2: Eksik tarayıcı komutu veya aracı
  - H2: Profiller: openclaw ve kullanıcı
  - H2: Yapılandırma
  - H3: Ekran görüntüsü görüsü (yalnızca metin model desteği)
  - H2: Brave veya başka bir Chromium tabanlı tarayıcı kullanın
  - H2: Yerel ve uzak denetim
  - H2: Node tarayıcı proxy'si (sıfır yapılandırmalı varsayılan)
  - H2: Browserless (barındırılan uzak CDP)
  - H3: Aynı ana makinede Browserless Docker
  - H2: Doğrudan WebSocket CDP sağlayıcıları
  - H3: Browserbase
  - H3: Notte
  - H2: Güvenlik
  - H2: Profiller (çoklu tarayıcı)
  - H2: Chrome DevTools MCP üzerinden mevcut oturum
  - H3: Özel Chrome MCP başlatma
  - H2: Yalıtım garantileri
  - H2: Tarayıcı seçimi
  - H2: Denetim API'si (isteğe bağlı)
  - H2: Sorun giderme
  - H3: CDP başlangıç hatası ve gezinme SSRF engeli
  - H2: Ajan araçları + denetimin nasıl çalıştığı
  - H2: İlgili

## tools/btw.md

- Rota: /tools/btw
- Başlıklar:
  - H2: Ne yapar
  - H2: Ne yapmaz
  - H2: Bağlam nasıl çalışır
  - H2: Teslim modeli
  - H2: Yüzey davranışı
  - H3: TUI
  - H3: Harici kanallar
  - H3: Control UI / web
  - H2: BTW ne zaman kullanılır
  - H2: BTW ne zaman kullanılmaz
  - H2: İlgili

## tools/capability-cookbook.md

- Rota: /tools/capability-cookbook
- Başlıklar:
  - H2: İlgili

## tools/clawhub.md

- Rota: /tools/clawhub
- Başlıklar: yok

## tools/code-execution.md

- Rota: /tools/code-execution
- Başlıklar:
  - H2: Kurulum
  - H2: Nasıl kullanılır
  - H2: Hatalar
  - H2: Sınırlar
  - H2: İlgili

## tools/creating-skills.md

- Rota: /tools/creating-skills
- Başlıklar:
  - H2: İlk skill'inizi oluşturun
  - H2: SKILL.md başvurusu
  - H3: Gerekli alanlar
  - H3: İsteğe bağlı frontmatter anahtarları
  - H3: {baseDir} kullanımı
  - H2: Koşullu etkinleştirme ekleme
  - H2: Skill Workshop üzerinden önerme
  - H2: ClawHub'da yayımlama
  - H2: En iyi uygulamalar
  - H2: İlgili

## tools/diffs.md

- Rota: /tools/diffs
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Yerleşik sistem yönlendirmesini devre dışı bırakma
  - H2: Tipik ajan iş akışı
  - H2: Girdi örnekleri
  - H2: Araç girdisi başvurusu
  - H2: Sözdizimi vurgulama
  - H2: Çıktı ayrıntıları sözleşmesi
  - H2: Daraltılmış değişmemiş bölümler
  - H2: Plugin varsayılanları
  - H3: Kalıcı görüntüleyici URL yapılandırması
  - H2: Güvenlik yapılandırması
  - H2: Yapıt yaşam döngüsü ve depolama
  - H2: Görüntüleyici URL'si ve ağ davranışı
  - H2: Güvenlik modeli
  - H2: Dosya modu için tarayıcı gereksinimleri
  - H2: Sorun giderme
  - H2: Operasyonel yönlendirme
  - H2: İlgili

## tools/duckduckgo-search.md

- Rota: /tools/duckduckgo-search
- Başlıklar:
  - H2: Kurulum
  - H2: Yapılandırma
  - H2: Araç parametreleri
  - H2: Notlar
  - H2: İlgili

## tools/elevated.md

- Rota: /tools/elevated
- Başlıklar:
  - H2: Yönergeler
  - H2: Nasıl çalışır
  - H2: Çözümleme sırası
  - H2: Kullanılabilirlik ve izin listeleri
  - H2: elevated neyi denetlemez
  - H2: İlgili

## tools/exa-search.md

- Rota: /tools/exa-search
- Başlıklar:
  - H2: Plugin kurulumu
  - H2: API anahtarı alma
  - H2: Yapılandırma
  - H2: Temel URL geçersiz kılma
  - H2: Araç parametreleri
  - H3: İçerik çıkarma
  - H3: Arama modları
  - H2: Notlar
  - H2: İlgili

## tools/exec-approvals-advanced.md

- Rota: /tools/exec-approvals-advanced
- Başlıklar:
  - H2: Güvenli ikililer (yalnızca stdin)
  - H3: Argv doğrulaması ve reddedilen bayraklar
  - H3: Güvenilen ikili dizinleri
  - H3: Shell zincirleme, sarmalayıcılar ve çoklayıcılar
  - H3: Güvenli ikililer ve izin listesi
  - H2: Yorumlayıcı/çalışma zamanı komutları
  - H3: Takip teslim davranışı
  - H2: Onayları sohbet kanallarına iletme
  - H3: Plugin onayı iletme
  - H3: Herhangi bir kanalda aynı sohbet onayları
  - H3: Yerel onay teslimi
  - H3: macOS IPC akışı
  - H2: SSS
  - H3: Bir onay hedefinde accountId ve threadId ne zaman kullanılır?
  - H3: Onaylar bir oturuma gönderildiğinde, o oturumdaki herkes bunları onaylayabilir mi?
  - H2: İlgili

## tools/exec-approvals.md

- Rota: /tools/exec-approvals
- Başlıklar:
  - H2: Etkin politikayı inceleme
  - H2: Nerede uygulanır
  - H3: Güven modeli
  - H3: macOS ayrımı
  - H2: Ayarlar ve depolama
  - H2: Politika düğmeleri
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: YOLO modu (onaysız)
  - H3: Kalıcı Gateway ana makinesi "asla sorma" kurulumu
  - H3: Yerel kısayol
  - H3: Node ana makinesi
  - H3: Yalnızca oturum kısayolu
  - H2: İzin listesi (ajan başına)
  - H3: argPattern ile argümanları kısıtlama
  - H2: Skill CLI'lerini otomatik izin verme
  - H2: Güvenli ikililer ve onay iletme
  - H2: Control UI düzenleme
  - H2: Onay akışı
  - H2: Sistem olayları
  - H2: Reddedilen onay davranışı
  - H2: Etkiler
  - H2: İlgili

## tools/exec.md

- Rota: /tools/exec
- Başlıklar:
  - H2: Parametreler
  - H2: Yapılandırma
  - H3: PATH işleme
  - H2: Oturum geçersiz kılmaları (/exec)
  - H2: Yetkilendirme modeli
  - H2: Exec onayları (yardımcı uygulama / node hostu)
  - H2: İzin listesi + güvenli ikililer
  - H2: Örnekler
  - H2: applypatch
  - H2: İlgili

## tools/firecrawl.md

- Rota: /tools/firecrawl
- Başlıklar:
  - H2: Plugin kurulumu
  - H2: Anahtarsız webfetch ve API anahtarları
  - H2: Firecrawl aramasını yapılandırma
  - H2: Firecrawl webfetch geri dönüşünü yapılandırma
  - H3: Kendi kendine barındırılan Firecrawl
  - H2: Firecrawl Plugin araçları
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Gizlilik / bot atlatma
  - H2: webfetch Firecrawl'u nasıl kullanır
  - H2: İlgili

## tools/gemini-search.md

- Rota: /tools/gemini-search
- Başlıklar:
  - H2: API anahtarı alma
  - H2: Yapılandırma
  - H2: Nasıl çalışır
  - H2: Desteklenen parametreler
  - H2: Model seçimi
  - H2: Temel URL geçersiz kılmaları
  - H2: İlgili

## tools/goal.md

- Rota: /tools/goal
- Başlıklar:
  - H1: Hedef
  - H2: Hızlı başlangıç
  - H2: Hedefler ne içindir
  - H2: Komut başvurusu
  - H2: Durumlar
  - H2: Token bütçeleri
  - H2: Model araçları
  - H2: TUI
  - H2: Kanal davranışı
  - H2: Sorun giderme
  - H2: İlgili

## tools/grok-search.md

- Rota: /tools/grok-search
- Başlıklar:
  - H2: Onboarding ve yapılandırma
  - H2: Oturum açın veya API anahtarı alın
  - H2: Yapılandırma
  - H2: Nasıl çalışır
  - H2: Desteklenen parametreler
  - H2: Temel URL geçersiz kılmaları
  - H2: İlgili

## tools/image-generation.md

- Rota: /tools/image-generation
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Yaygın rotalar
  - H2: Desteklenen sağlayıcılar
  - H2: Sağlayıcı yetenekleri
  - H2: Araç parametreleri
  - H2: Yapılandırma
  - H3: Model seçimi
  - H3: Sağlayıcı seçim sırası
  - H3: Görsel düzenleme
  - H2: Sağlayıcı derin incelemeleri
  - H2: Örnekler
  - H2: İlgili

## tools/index.md

- Rota: /tools
- Başlıklar:
  - H2: Buradan başlayın
  - H2: Araçları, Skills'i veya Plugin'leri seçin
  - H2: Yerleşik araç kategorileri
  - H2: Plugin tarafından sağlanan araçlar
  - H2: Erişimi ve onayları yapılandırma
  - H2: Yetenekleri genişletme
  - H2: Eksik araçları giderme
  - H2: İlgili

## tools/kimi-search.md

- Rota: /tools/kimi-search
- Başlıklar:
  - H2: API anahtarı alma
  - H2: Yapılandırma
  - H2: Nasıl çalışır
  - H2: Desteklenen parametreler
  - H2: İlgili

## tools/llm-task.md

- Rota: /tools/llm-task
- Başlıklar:
  - H2: Plugin'i etkinleştirme
  - H2: Yapılandırma (isteğe bağlı)
  - H2: Araç parametreleri
  - H2: Çıktı
  - H2: Örnek: Lobster iş akışı adımı
  - H3: Önemli sınırlama
  - H2: Güvenlik notları
  - H2: İlgili

## tools/lobster.md

- Rota: /tools/lobster
- Başlıklar:
  - H2: Hook
  - H2: Neden
  - H2: Düz programlar yerine neden DSL?
  - H2: Nasıl çalışır
  - H2: Kalıp: küçük CLI + JSON pipe'ları + onaylar
  - H2: Yalnızca JSON LLM adımları (llm-task)
  - H3: Önemli sınırlama: gömülü Lobster ile openclaw.invoke karşılaştırması
  - H2: İş akışı dosyaları (.lobster)
  - H2: Lobster kurulumu
  - H2: Aracı etkinleştirme
  - H2: Örnek: E-posta triyajı
  - H2: Araç parametreleri
  - H3: run
  - H3: resume
  - H3: İsteğe bağlı girdiler
  - H2: Çıktı zarfı
  - H2: Onaylar
  - H2: OpenProse
  - H2: Güvenlik
  - H2: Sorun giderme
  - H2: Daha fazla bilgi edinin
  - H2: Vaka çalışması: topluluk iş akışları
  - H2: İlgili

## tools/loop-detection.md

- Rota: /tools/loop-detection
- Başlıklar:
  - H2: Bu neden var
  - H2: Yapılandırma bloğu
  - H3: Alan davranışı
  - H2: Önerilen kurulum
  - H2: Compaction sonrası koruma
  - H2: Günlükler ve beklenen davranış
  - H2: İlgili

## tools/media-overview.md

- Rota: /tools/media-overview
- Başlıklar:
  - H2: Yetenekler
  - H2: Sağlayıcı yetenek matrisi
  - H2: Eşzamansız ve eşzamanlı
  - H2: Konuşmadan metne ve Sesli Arama
  - H2: Sağlayıcı eşlemeleri (satıcıların yüzeyler arasında nasıl bölündüğü)
  - H2: İlgili

## tools/minimax-search.md

- Rota: /tools/minimax-search
- Başlıklar:
  - H2: Token Plan kimlik bilgisi alma
  - H2: Yapılandırma
  - H2: Bölge seçimi
  - H2: Desteklenen parametreler
  - H2: İlgili

## tools/multi-agent-sandbox-tools.md

- Rota: /tools/multi-agent-sandbox-tools
- Başlıklar:
  - H2: Yapılandırma örnekleri
  - H2: Yapılandırma önceliği
  - H3: Korumalı alan yapılandırması
  - H3: Araç kısıtlamaları
  - H2: Tek ajandan geçiş
  - H2: Araç kısıtlama örnekleri
  - H2: Yaygın tuzak: "non-main"
  - H2: Test
  - H2: Sorun giderme
  - H2: İlgili

## tools/music-generation.md

- Rota: /tools/music-generation
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Desteklenen sağlayıcılar
  - H3: Yetenek matrisi
  - H2: Araç parametreleri
  - H2: Eşzamansız davranış
  - H3: Görev yaşam döngüsü
  - H2: Yapılandırma
  - H3: Model seçimi
  - H3: Sağlayıcı seçim sırası
  - H2: Sağlayıcı notları
  - H2: Doğru yolu seçme
  - H2: Sağlayıcı yetenek modları
  - H2: Canlı testler
  - H2: İlgili

## tools/ollama-search.md

- Rota: /tools/ollama-search
- Başlıklar:
  - H2: Kurulum
  - H2: Yapılandırma
  - H2: Notlar
  - H2: İlgili

## tools/parallel-search.md

- Rota: /tools/parallel-search
- Başlıklar:
  - H2: Plugin yükleme
  - H2: API anahtarı (ücretli sağlayıcı)
  - H2: Yapılandırma
  - H2: Temel URL geçersiz kılma
  - H2: Araç parametreleri
  - H2: Notlar
  - H2: İlgili

## tools/pdf.md

- Rota: /tools/pdf
- Başlıklar:
  - H2: Kullanılabilirlik
  - H2: Girdi referansı
  - H2: Desteklenen PDF referansları
  - H2: Yürütme modları
  - H3: Yerel sağlayıcı modu
  - H3: Ayıklama geri dönüş modu
  - H2: Yapılandırma
  - H2: Çıktı ayrıntıları
  - H2: Hata davranışı
  - H2: Örnekler
  - H2: İlgili

## tools/permission-modes.md

- Rota: /tools/permission-modes
- Başlıklar:
  - H2: Önerilen varsayılan
  - H2: OpenClaw ana makine yürütme modları
  - H2: Codex Guardian eşlemesi
  - H2: ACPX harness izinleri
  - H2: Mod seçme
  - H2: İlgili

## tools/perplexity-search.md

- Rota: /tools/perplexity-search
- Başlıklar:
  - H2: Plugin yükleme
  - H2: Perplexity API anahtarı alma
  - H2: OpenRouter uyumluluğu
  - H2: Yapılandırma örnekleri
  - H3: Yerel Perplexity Search API
  - H3: OpenRouter / Sonar uyumluluğu
  - H2: Anahtarın nerede ayarlanacağı
  - H2: Araç parametreleri
  - H3: Alan filtresi kuralları
  - H2: Notlar
  - H2: İlgili

## tools/plugin.md

- Rota: /tools/plugin
- Başlıklar:
  - H2: Gereksinimler
  - H2: Hızlı başlangıç
  - H2: Yapılandırma
  - H3: Yükleme kaynağı seçme
  - H3: Operatör yükleme ilkesi
  - H3: Plugin ilkesini yapılandırma
  - H2: Plugin biçimlerini anlama
  - H2: Plugin kancaları
  - H2: Etkin Gateway’i doğrulama
  - H2: Sorun giderme
  - H3: Engellenmiş Plugin yolu sahipliği
  - H3: Yavaş Plugin aracı kurulumu
  - H2: İlgili

## tools/reactions.md

- Rota: /tools/reactions
- Başlıklar:
  - H2: Nasıl çalışır
  - H2: Kanal davranışı
  - H2: Tepki düzeyi
  - H2: İlgili

## tools/searxng-search.md

- Rota: /tools/searxng-search
- Başlıklar:
  - H2: Kurulum
  - H2: Yapılandırma
  - H2: Ortam değişkeni
  - H2: Plugin yapılandırma referansı
  - H2: Notlar
  - H2: İlgili

## tools/skill-workshop.md

- Rota: /tools/skill-workshop
- Başlıklar:
  - H2: Nasıl çalışır
  - H2: Yaşam döngüsü
  - H2: Sohbet
  - H2: CLI
  - H2: Öneri içeriği
  - H2: Destek dosyaları
  - H2: Ajan aracı
  - H2: Onay ve özerklik
  - H2: Gateway yöntemleri
  - H2: Depolama
  - H2: Sınırlar
  - H2: Sorun giderme
  - H2: İlgili

## tools/skills-config.md

- Rota: /tools/skills-config
- Başlıklar:
  - H2: Yükleme (skills.load)
  - H2: Yükleme (skills.install)
  - H2: Operatör Yükleme İlkesi (security.installPolicy)
  - H2: Paketlenmiş skill izin listesi
  - H2: Skill başına girdiler (skills.entries)
  - H2: Ajan izin listeleri (agents)
  - H2: Atölye (skills.workshop)
  - H2: Sembolik bağlı skill kökleri
  - H2: Korumalı alan Skills ve ortam değişkenleri
  - H2: Yükleme sırası hatırlatıcısı
  - H2: İlgili

## tools/skills.md

- Rota: /tools/skills
- Başlıklar:
  - H2: Yükleme sırası
  - H2: Ajan başına ve paylaşılan Skills
  - H2: Ajan izin listeleri
  - H2: Plugins ve Skills
  - H2: Skill Workshop
  - H2: ClawHub’dan yükleme
  - H2: Güvenlik
  - H2: SKILL.md biçimi
  - H3: İsteğe bağlı frontmatter anahtarları
  - H2: Geçitleme
  - H3: Yükleyici belirtimleri
  - H2: Yapılandırma geçersiz kılmaları
  - H2: Ortam enjeksiyonu
  - H2: Anlık görüntüler ve yenileme
  - H2: Token etkisi
  - H2: İlgili

## tools/slash-commands.md

- Rota: /tools/slash-commands
- Başlıklar:
  - H2: Üç komut türü
  - H2: Yapılandırma
  - H2: Komut listesi
  - H3: Çekirdek komutlar
  - H3: Dock komutları
  - H3: Paketlenmiş Plugin komutları
  - H3: Skill komutları
  - H2: /tools — ajanın şimdi kullanabilecekleri
  - H2: /model — model seçimi
  - H2: /config — diskte yapılandırma yazımları
  - H2: /mcp — MCP sunucu yapılandırması
  - H2: /debug — yalnızca çalışma zamanı geçersiz kılmaları
  - H2: /plugins — Plugin yönetimi
  - H2: /trace — Plugin izleme çıktısı
  - H2: /btw — yan sorular
  - H2: Yüzey notları
  - H2: Sağlayıcı kullanımı ve durumu
  - H2: İlgili

## tools/steer.md

- Rota: /tools/steer
- Başlıklar:
  - H2: Geçerli oturum
  - H2: Yönlendirme ve kuyruk
  - H2: Alt ajanlar
  - H2: ACP oturumları
  - H2: İlgili

## tools/subagents.md

- Rota: /tools/subagents
- Başlıklar:
  - H2: Slash komutu
  - H3: İş parçacığı bağlama kontrolleri
  - H3: Başlatma davranışı
  - H2: Bağlam modları
  - H2: Araç: sessionsspawn
  - H3: Yetkilendirme istemi modu
  - H3: Araç parametreleri
  - H3: Görev adları ve hedefleme
  - H2: Araç: sessionsyield
  - H2: Araç: subagents
  - H2: İş parçacığına bağlı oturumlar
  - H3: İş parçacığı destekleyen kanallar
  - H3: Hızlı akış
  - H3: Manuel kontroller
  - H3: Yapılandırma anahtarları
  - H3: İzin listesi
  - H3: Keşif
  - H3: Otomatik arşivleme
  - H2: İç içe alt ajanlar
  - H3: Derinlik düzeyleri
  - H3: Duyuru zinciri
  - H3: Derinliğe göre araç ilkesi
  - H3: Ajan başına başlatma sınırı
  - H3: Kademeli durdurma
  - H2: Kimlik doğrulama
  - H2: Duyur
  - H3: Duyuru bağlamı
  - H3: İstatistik satırı
  - H3: Neden sessionshistory tercih edilmeli
  - H2: Araç ilkesi
  - H3: Yapılandırma üzerinden geçersiz kılma
  - H2: Eşzamanlılık
  - H2: Canlılık ve kurtarma
  - H2: Durdurma
  - H2: Sınırlamalar
  - H2: İlgili

## tools/tavily.md

- Rota: /tools/tavily
- Başlıklar:
  - H2: Başlarken
  - H2: Araç referansı
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: Doğru aracı seçme
  - H2: Gelişmiş yapılandırma
  - H2: İlgili

## tools/thinking.md

- Rota: /tools/thinking
- Başlıklar:
  - H2: Ne yapar
  - H2: Çözüm sırası
  - H2: Oturum varsayılanı ayarlama
  - H2: Ajana göre uygulama
  - H2: Hızlı mod (/fast)
  - H2: Ayrıntılı yönergeler (/verbose veya /v)
  - H2: Plugin izleme yönergeleri (/trace)
  - H2: Akıl yürütme görünürlüğü (/reasoning)
  - H2: İlgili
  - H2: Heartbeats
  - H2: Web sohbet kullanıcı arayüzü
  - H2: Sağlayıcı profilleri

## tools/tokenjuice.md

- Rota: /tools/tokenjuice
- Başlıklar:
  - H2: Plugin’i etkinleştirme
  - H2: tokenjuice neyi değiştirir
  - H2: Çalıştığını doğrulama
  - H2: Plugin’i devre dışı bırakma
  - H2: İlgili

## tools/tool-search.md

- Rota: /tools/tool-search
- Başlıklar:
  - H2: Bir turun nasıl çalıştığı
  - H2: Modlar
  - H2: Bunun var olma nedeni
  - H2: API
  - H2: Çalışma zamanı sınırı
  - H2: Yapılandırma
  - H2: İstem ve telemetri
  - H2: E2E doğrulama
  - H2: Hata davranışı
  - H2: İlgili

## tools/trajectory.md

- Rota: /tools/trajectory
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Erişim
  - H2: Kaydedilenler
  - H2: Paket dosyaları
  - H2: Yakalama konumu
  - H2: Yakalamayı devre dışı bırakma
  - H2: Temizleme zaman aşımını ayarlama
  - H2: Gizlilik ve sınırlar
  - H2: Sorun giderme
  - H2: İlgili

## tools/tts.md

- Rota: /tools/tts
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Desteklenen sağlayıcılar
  - H2: Yapılandırma
  - H3: Ajan başına ses geçersiz kılmaları
  - H2: Personalar
  - H3: Minimal persona
  - H3: Tam persona (sağlayıcıdan bağımsız istem)
  - H3: Persona çözümlemesi
  - H3: Sağlayıcıların persona istemlerini nasıl kullandığı
  - H3: Geri dönüş ilkesi
  - H2: Model güdümlü yönergeler
  - H2: Slash komutları
  - H2: Kullanıcı başına tercihler
  - H2: Çıktı biçimleri (sabit)
  - H2: Otomatik TTS davranışı
  - H2: Kanala göre çıktı biçimleri
  - H2: Alan referansı
  - H2: Ajan aracı
  - H2: Gateway RPC
  - H2: Hizmet bağlantıları
  - H2: İlgili

## tools/video-generation.md

- Rota: /tools/video-generation
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Eşzamansız üretim nasıl çalışır
  - H3: Görev yaşam döngüsü
  - H2: Desteklenen sağlayıcılar
  - H3: Yetenek matrisi
  - H2: Araç parametreleri
  - H3: Gerekli
  - H3: İçerik girdileri
  - H3: Stil kontrolleri
  - H3: Gelişmiş
  - H4: Geri dönüş ve türlendirilmiş seçenekler
  - H2: Eylemler
  - H2: Model seçimi
  - H2: Sağlayıcı notları
  - H2: Sağlayıcı yetenek modları
  - H2: Canlı testler
  - H2: Yapılandırma
  - H2: İlgili

## tools/web-fetch.md

- Rota: /tools/web-fetch
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Araç parametreleri
  - H2: Nasıl çalışır
  - H2: İlerleme güncellemeleri
  - H2: Yapılandırma
  - H2: Firecrawl geri dönüşü
  - H2: Güvenilir ortam proxy’si
  - H2: Sınırlar ve güvenlik
  - H2: Araç profilleri
  - H2: İlgili

## tools/web.md

- Rota: /tools/web
- Başlıklar:
  - H2: Hızlı başlangıç
  - H2: Sağlayıcı seçme
  - H3: Sağlayıcı karşılaştırması
  - H2: Otomatik algılama
  - H2: Yerel OpenAI web araması
  - H2: Yerel Codex web araması
  - H2: Ağ güvenliği
  - H2: Web aramasını ayarlama
  - H2: Yapılandırma
  - H3: API anahtarlarını saklama
  - H2: Araç parametreleri
  - H2: xsearch
  - H3: xsearch yapılandırması
  - H3: xsearch parametreleri
  - H3: xsearch örneği
  - H2: Örnekler
  - H2: Araç profilleri
  - H2: İlgili

## tts.md

- Rota: /tts
- Başlıklar:
  - H2: İlgili

## vps.md

- Rota: /vps
- Başlıklar:
  - H2: Bir sağlayıcı seçme
  - H2: Bulut kurulumları nasıl çalışır
  - H2: Önce yönetici erişimini sıkılaştırma
  - H2: VPS üzerinde paylaşılan şirket ajanı
  - H2: VPS ile düğümleri kullanma
  - H2: Küçük VM’ler ve ARM ana makineleri için başlangıç ayarı
  - H3: systemd ayar kontrol listesi (isteğe bağlı)
  - H2: İlgili

## web/control-ui.md

- Rota: /web/control-ui
- Başlıklar:
  - H2: Hızlı açma (yerel)
  - H2: Cihaz eşleştirme (ilk bağlantı)
  - H2: Kişisel kimlik (tarayıcıda yerel)
  - H2: Çalışma zamanı yapılandırma uç noktası
  - H2: Dil desteği
  - H2: Görünüm temaları
  - H2: Neler yapabilir (bugün)
  - H2: MCP sayfası
  - H2: Etkinlik sekmesi
  - H2: Sohbet davranışı
  - H2: PWA yükleme ve web push
  - H2: Barındırılan yerleştirmeler
  - H2: Sohbet mesajı genişliği
  - H2: Tailnet erişimi (önerilir)
  - H2: Güvenli olmayan HTTP
  - H2: İçerik güvenliği ilkesi
  - H2: Avatar rota kimlik doğrulaması
  - H2: Asistan medya rota kimlik doğrulaması
  - H2: Kullanıcı arayüzünü derleme
  - H2: Boş Control UI sayfası
  - H2: Hata ayıklama/test: geliştirme sunucusu + uzak Gateway
  - H2: İlgili

## web/dashboard.md

- Rota: /web/dashboard
- Başlıklar:
  - H2: Hızlı yol (önerilir)
  - H2: Kimlik doğrulama temelleri (yerel ve uzak)
  - H2: "unauthorized" / 1008 görürseniz
  - H2: İlgili

## web/index.md

- Rota: /web
- Başlıklar:
  - H2: Webhooks
  - H2: Yönetici HTTP RPC
  - H2: Yapılandırma (varsayılan olarak açık)
  - H2: Tailscale erişimi
  - H3: Entegre Sunma (önerilir)
  - H3: Tailnet bağlama + token
  - H3: Genel internet (Funnel)
  - H2: Güvenlik notları
  - H2: Kullanıcı arayüzünü derleme

## web/tui.md

- Rota: /web/tui
- Başlıklar:
  - H2: Hızlı başlangıç
  - H3: Gateway modu
  - H3: Yerel mod
  - H2: Gördükleriniz
  - H2: Zihinsel model: ajanlar + oturumlar
  - H2: Gönderme + teslim
  - H2: Seçiciler + katmanlar
  - H2: Klavye kısayolları
  - H2: Slash komutları
  - H2: Yerel kabuk komutları
  - H2: Yerel TUI’den yapılandırmaları onarma
  - H2: Araç çıktısı
  - H2: Terminal renkleri
  - H2: Geçmiş + akış
  - H2: Bağlantı ayrıntıları
  - H2: Seçenekler
  - H2: Sorun giderme
  - H2: Bağlantı sorunlarını giderme
  - H2: İlgili

## web/webchat.md

- Rota: /web/webchat
- Başlıklar:
  - H2: Nedir
  - H2: Hızlı başlangıç
  - H2: Nasıl çalışır (davranış)
  - H3: Transkript ve teslim modeli
  - H2: Control UI ajan araçları paneli
  - H2: Uzak kullanım
  - H2: Yapılandırma referansı (WebChat)
  - H2: İlgili
