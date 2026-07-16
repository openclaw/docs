---
read_when:
    - macOS uygulamasını yükleme
    - macOS'te yerel ve uzak Gateway modu arasında karar verme
    - macOS uygulaması sürüm indirmeleri aranıyor
summary: OpenClaw macOS menü çubuğu uygulamasını yükleme ve kullanma
title: macOS uygulaması
x-i18n:
    generated_at: "2026-07-16T17:36:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

macOS uygulaması, OpenClaw **menü çubuğu yardımcı uygulamasıdır**: yerel tepsi arayüzü, macOS
izin istemleri, bildirimler, WebChat, sesli giriş, Canvas ve
`system.run` gibi Mac'te barındırılan Node araçları.

Yalnızca CLI ve Gateway mi gerekiyor? [Başlarken](/tr/start/getting-started) ile başlayın.

## İndirme

macOS uygulaması derlemelerini [OpenClaw GitHub sürümlerinden](https://github.com/openclaw/openclaw/releases) edinin.
Bir sürüm macOS uygulaması varlıkları içeriyorsa şunları arayın:

- `OpenClaw-<version>.dmg` (tercih edilen)
- `OpenClaw-<version>.zip`

Bazı sürümler yalnızca CLI, kanıt veya Windows varlıkları içerir. En yeni sürümde
macOS uygulaması varlığı yoksa bunu içeren en yeni sürümü kullanın ya da
[macOS geliştirme kurulumu](/tr/platforms/mac/dev-setup) ile kaynaktan derleyin.

## İlk çalıştırma

1. **OpenClaw.app** uygulamasını yükleyip başlatın.
2. Yerel bir Gateway için **Bu Mac** seçeneğini belirleyin veya uzak bir Gateway'e bağlanın.
3. Uygulama eşleşen CLI çalışma zamanını yüklerken bekleyin. Yerel modda ayrıca
   Gateway'i yükleyip başlatır.
4. Canlı model denetimiyle çıkarım bağlantısını kurun. Denetim geçtikten sonra kalan
   kurulumu OpenClaw gerçekleştirir.
5. macOS izin kontrol listesini tamamlayın ve ilk katılım test iletisini gönderin.

Uygulama, varsayılan aracısında yapılandırılmış bir model bulunan mevcut bir
Gateway'e ulaşırsa bu Gateway'i zaten kurulmuş olarak değerlendirir, sağlayıcı
ilk katılımını ve OpenClaw'ı atlayıp panoyu açar. Gateway'e bağlanılamazsa veya
varsayılan aracısında model yoksa kurtarma amacıyla çıkarım ilk katılımı
kullanılabilir durumda kalır.

CLI/Gateway kurulum yolu için [Başlarken](/tr/start/getting-started) bölümünü kullanın.
İzin kurtarma için [macOS izinleri](/tr/platforms/mac/permissions) bölümünü kullanın.

## Güncellemeler

Panodaki güncelleme kartı, uygulamanın neyi güncelleyeceğini belirtir:

- **Mac uygulamasını + Gateway'i güncelle**, imzalı uygulamanın yerel launchd
  Gateway'ini yönettiği anlamına gelir. Sparkle önce uygulamayı günceller; uygulama
  yeniden başlatıldıktan sonra Gateway'i otomatik olarak eşleşen sürüme güncelleyip
  yeniden başlatır ve ardından bağlantıyı doğrular.
- **Gateway'i güncelle**, uygulamanın uzak bir Gateway'e, elle yönetilen
  yerel bir Gateway'e veya uygulamanın yönetmediği başka bir kuruluma bağlı olduğu
  anlamına gelir. Düğme, Mac uygulamasını değiştirmek yerine söz konusu Gateway'in
  normal güncelleme akışını çalıştırır.

Başarısız bir eşgüdümlü güncelleme; yeniden deneme, [güncelleme kılavuzu](/tr/install/updating)
ve Discord eylemleriyle birlikte kurulum tarzı penceresinde kalır. Otomatik onarım,
daha yeni bir Gateway'in sürümünü asla düşürmez veya bir `extended-stable` kanal
sabitlemesini geçersiz kılmaz.

Başarılı bir güncellemeden sonra uygulama, bir insan tarafından en son kullanılan
üst düzey doğrudan oturumu bulur ve bu aracıya tek seferlik bir güncelleme olayı
iletir. Heartbeat ve Cron etkinliği bu seçimi etkilemez. Ardından aracı, kullanma
olasılığınızın en yüksek olduğu konuşmada sizi yeniden karşılayabilir. Uzak modda
uygulama yalnızca yerel Mac Node çalışma zamanını günceller ve uzak Gateway
uygulamadan eskiyse bildirimi atlar.

Sparkle, Gateway'in `update.channel` ayarını izler. `beta` ve `dev`,
beta uygulama derlemelerini etkinleştirir; `stable`, `extended-stable` ile
eksik veya bilinmeyen değerler kararlı uygulama derlemelerinde kalır.

## Pano bağlantılarını açma

macOS uygulamasının yerleşik panosunda harici bir web bağlantısına tıklandığında, pano gezinmesi görünür tutulurken bağlantı pencere genişliğinin yarısını kaplayan, yeniden boyutlandırılabilir bir tarayıcı kenar çubuğunda açılır. Farklı bir genişlik seçmek için ayırıcıyı sürükleyin; uygulama seçiminizi hatırlar. Her bağlantı kendi sekmesinde açılır, birden fazla sayfa açık olduğunda sekme şeridi görünür ve aynı bağlantıya yeniden tıklanması mevcut sekmesini kullanır. Sekmeleri yeniden sıralamak için sürükleyin, sekme kapatma düğmesiyle veya orta tıklamayla kapatın ve **Varsayılan Tarayıcıda Aç**, **Bağlantıyı Kopyala**, **Yeniden Yükle**, **Sekmeyi Kapat** ve **Diğer Sekmeleri Kapat** seçenekleri için bir sekmeye sağ tıklayın. Pencerenin başlık çubuğundaki geri/ileri denetimleri ve izleme dörtgeni kaydırma hareketleri pano geçmişinde gezinir; kenar çubuğunun kendi geri/ileri denetimleri etkin sekmenin geçmişinde gezinir. Kenar çubuğunda ayrıca yeniden yükleme, varsayılan tarayıcıda açma ve kapatma denetimleri bulunur.

Başlık çubuğu denetimleri uygulama kenar çubuğunu izler: kenar çubuğu genişletilmişken geri/ileri denetimleri, kenar çubuğu geçiş düğmesinin yanında sağ kenarda yer alır; daraltılmışken yerlerini bir arama düğmesine (komut paletini açar) ve yeni oturum düğmesine bırakırlar.

**Kenar Çubuğunda Aç**, **Varsayılan Tarayıcıda Aç** veya **Bağlantıyı Kopyala** seçeneklerinden birini belirlemek için harici bir bağlantıya sağ tıklayın. Panodan yapılan değiştirici tuşlu tıklamalar ve kullanıcı tarafından etkinleştirilen yeni pencere bağlantıları varsayılan tarayıcıda açılmaya devam eder; kenar çubuğundaki yeni pencere bağlantıları yeni kenar çubuğu sekmeleri olarak açılır. Tarayıcıda barındırılan normal Denetim Arayüzü sayfaları, tarayıcının olağan bağlantı ve bağlam menüsü davranışını korur.

## Tarayıcı oturumlarını içe aktarma

Uygulama yerel bir Gateway ile çalışırken tarayıcı kenar çubuğu ilk kez açıldığında, Mac'te çerezleri bulunan Chrome ailesinden bir profil varsa pano kapatılabilir bir başlık görüntüler. Başlık, bu çerezleri aracıların gezinmek için kullandığı yalıtılmış ve yönetilen bir profile kopyalamayı önerir. **İçe Aktar** denetiminden bir profil seçin (Touch ID gerekebilir); ilerleme ve içe aktarılan çerez sayısı satır içinde gösterilir ve yalnızca çerezler kopyalanır — parolalar kaynak tarayıcıdan asla ayrılmaz. Başlığın kapatılması seçimi kaydeder; **Ayarlar → Genel → Tarayıcı oturumu → İçe Aktar…** seçeneği bunu istediğiniz zaman yeniden sunar. Temel içe aktarma akışı ve `browser.allowSystemProfileImport` geçidi için [Tarayıcı](/tr/cli/browser) bölümüne bakın.

## Gateway modu seçme

| Mod    | Kullanım durumu                                                                | Ayrıntı sayfası                                    |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| Yerel  | Bu Mac, Gateway'i çalıştırmalı ve launchd ile etkin tutmalıdır.                | [macOS'te Gateway](/tr/platforms/mac/bundled-gateway) |
| Uzak   | Gateway başka bir ana makinede çalışır; bu Mac onu SSH, LAN veya Tailnet üzerinden denetler. | [Uzaktan denetim](/tr/platforms/mac/remote)            |

Uygulama Node ana makinesi çalışma zamanını yeniden kullandığından her iki modda da
`openclaw` CLI'ın yüklü olması gerekir. Yeni bir Mac'te uygulama eşleşen CLI'ı
otomatik olarak yükler; ardından yerel mod Gateway sihirbazını başlatırken uzak mod,
ikinci bir yerel Gateway başlatmadan seçilen Gateway'e bağlanır.
Elle kurtarma için [macOS'te Gateway](/tr/platforms/mac/bundled-gateway) bölümüne bakın.

## Uygulamanın yönettiği öğeler

- Menü çubuğu durumu, bildirimler, sistem durumu ve WebChat.
- Ekran, mikrofon, konuşma, otomasyon ve erişilebilirlik için macOS izin istemleri.
- Yerel Canvas'ı, kamera/ekran yakalamayı, bildirimleri, konumu ve bilgisayar
  denetimini CLI Node ana makinesinin sistem, tarayıcı, Plugin, Skills ve MCP
  komutlarıyla birleştiren tek bir Mac Node'u.
- Mac'te barındırılan komutlar için yürütme onayı istemleri.
- Onaylanan kabuk komutlarının uygulama bağlamında yürütülmesi; CLI çalışma zamanı
  paylaşılan Node politikasını yönetirken uygulamanın macOS izin ilişkilendirmesini korur.
- Uzak mod SSH tünelleri veya doğrudan Gateway bağlantıları.

Uygulama, Gateway veya genel CLI belgelerinin yerini **almaz**. Gateway
yapılandırması, sağlayıcılar, Plugin'ler, kanallar, araçlar ve güvenlik kendi
belgelerinde açıklanır.

## macOS ayrıntı sayfaları

| Görev                                    | Okunacak bölüm                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gateway hizmetini yükleme veya hata ayıklama | [macOS'te Gateway](/tr/platforms/mac/bundled-gateway)                                    |
| Durumu bulutla eşitlenen klasörlerin dışında tutma | [macOS'te Gateway](/tr/platforms/mac/bundled-gateway#state-directory-on-macos)          |
| Uygulama keşfi ve bağlantı sorunlarını giderme | [macOS'te Gateway](/tr/platforms/mac/bundled-gateway#debug-app-connectivity)                |
| launchd davranışını anlama               | [Gateway yaşam döngüsü](/tr/platforms/mac/child-process)                                      |
| İzinleri veya imzalama/TCC sorunlarını düzeltme | [macOS izinleri](/tr/platforms/mac/permissions)                                          |
| En son kullanılan Mac'i algılama         | [Etkin bilgisayar varlığı](/tr/nodes/presence)                                                 |
| Uzak bir Gateway'e bağlanma              | [Uzaktan denetim](/tr/platforms/mac/remote)                                                    |
| Menü çubuğu durumunu ve sistem durumu denetimlerini okuma | [Menü çubuğu](/tr/platforms/mac/menu-bar), [Sistem durumu denetimleri](/tr/platforms/mac/health) |
| Yerleşik sohbet arayüzünü kullanma       | [WebChat](/tr/platforms/mac/webchat)                                                           |
| Sesle uyandırmayı veya bas-konuş özelliğini kullanma | [Sesle uyandırma](/tr/platforms/mac/voicewake)                                      |
| Canvas'ı ve Canvas derin bağlantılarını kullanma | [Canvas](/tr/platforms/mac/canvas)                                                       |
| Arayüz otomasyonu için PeekabooBridge barındırma | [Peekaboo köprüsü](/tr/platforms/mac/peekaboo)                                          |
| Komut onaylarını yapılandırma            | [Yürütme onayları](/tr/tools/exec-approvals), [gelişmiş ayrıntılar](/tr/tools/exec-approvals-advanced) |
| Mac Node komutlarını ve uygulama IPC'sini inceleme | [macOS IPC](/tr/platforms/mac/xpc)                                                     |
| Günlükleri yakalama                      | [macOS günlük kaydı](/tr/platforms/mac/logging)                                                |
| Kaynaktan derleme                        | [macOS geliştirme kurulumu](/tr/platforms/mac/dev-setup)                                       |

## İlgili

- [Platformlar](/tr/platforms)
- [Başlarken](/tr/start/getting-started)
- [Gateway](/tr/gateway)
- [Yürütme onayları](/tr/tools/exec-approvals)
