---
read_when:
    - Bulut çalışanı sağlama, çalışan modu veya oturum devri tasarlama ya da uygulama
    - environments.* öğelerinin, worker protokolünün, transkript alımının veya çıkarım proxy RPC'lerinin değiştirilmesi
    - Uzak ajan yürütmenin güvenlik duruşunun incelenmesi
summary: Gateway üzerinden proxy'lenen çıkarım ve canlı kenar çubuğu akışıyla geçici, SSH üzerinden erişilebilen makinelerde ajan oturumları çalıştırın.
title: Bulut çalışanları planı
x-i18n:
    generated_at: "2026-07-12T12:27:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Durum

Teklif, revizyon 3. Uygulanmadı. Yön konusunda 2026-07'de anlaşmaya varıldı; revizyon 2, karşıt inceleme bulgularını (özel worker protokolü, yerleşim/ortam durum makineleri, git duyarlı gelen eşitleme, tek yönlü v1 devri, denetimli çıkış güvenliği ifadeleri) içeriyordu. Revizyon 3; eşitleme sahipliği modelini kesinleştirir (commit'leri worker oluşturur, gateway benimser ve yayımlar), git kullanılmayan düz bir eşitleme modu ekler, worker çalıştırmasını kutu içinde tam yetkili olarak düzeltir, internet politikasını sağlama aşamasına taşır ve agent yönlendirmesini 3. kilometre taşına geri getirir.

## Sorun

OpenClaw agent oturumları; döngülerini, araçlarını ve çıkarımlarını tek bir makinedeki gateway işlemi içinde çalıştırır. İşlem gücü bu makineyle sınırlıdır, uzun görevler makineyi meşgul eder ve paralel işler aynı kaynaklar için rekabet eder. Barındırılan ürünler (Cursor bulut agent'ları, web üzerinde Claude Code, Codex cloud) bu sorunu görev başına geçici bulut sandbox'larıyla çözer ancak sağlayıcı altyapısına ve sağlayıcıya güvenmeyi gerektirir.

Halihazırda yedek makinelere sahip olan (veya bunları ucuza kiralayabilen) operatörlerin şunu söylemesinin bir yolu yoktur: Bu oturumu şurada çalıştır, diğer tüm oturumlar gibi kenar çubuğumda göster ve ardından makineyi ortadan kaldır.

## Hedefler

- Tam bir agent oturumunu (döngü + araçlar), oturum Control UI'da yerel bir oturumla tamamen aynı şekilde görünür ve akış sağlarken geçici bir uzak makinede ("bulut worker'ı") çalıştırmak.
- Worker üzerinde kalıcı kimlik bilgileri (sağlayıcı kimlik doğrulaması veya forge token'ları) ve doğrudan ağ çıkışı olmaması; kutunun yalnızca erişilebilir bir sshd'ye ihtiyacı vardır.
- Sağla, eşitle, çalıştır, topla, yok et — tamamen otomatik ve sağlayıcı eklenebilir olmalıdır (ilk sağlayıcı: Crabbox tarzı kiralama CLI'ları).
- Çalışan işi; transkripti, oturum kimliğini veya (istek baytları eşdeğer kaldığında) sağlayıcı önbellek yakınlığını kaybetmeden bir tur sınırında gateway'den bir worker'a yönlendirmek ve sonuçları güvenli biçimde geri almak.
- Hem insanların (UI) hem de agent'ların (araç) işi bir bulut worker'ına yönlendirebilmesi.
- Günlerce süren oturumları desteklemek; kullanım ömrü sabit kodlanmış bir sınır değil, politikadır.

## Hedef dışı konular (v1)

- Worker'larda harici kodlama altyapıları (Claude Code, Codex CLI) yoktur. Worker oturumları yalnızca OpenClaw'ın gömülü çalıştırıcısını kullanır. Bu altyapılar kendi kimlik bilgileriyle kendi çıkarımlarını gerçekleştirdiğinden altyapı desteği v2'de isteğe bağlıdır.
- En iyi N sonucu seçme / paralel deneme dağıtımı yoktur.
- VPN/tailnet bağımlılığı yoktur. Aktarım yalnızca SSH üzerinden yapılır.
- Yeni bir sandbox çalışma zamanı yoktur. Yalıtım sınırı worker makinesidir; kutu içi işletim sistemi sandbox'ı daha sonra katman olarak eklenebilir.
- v1'de simetrik canlı taşıma yoktur: yönlendirme yerelden worker'a doğrudur; worker'dan yerele dönüş, durdurulmuş bir oturum ve tamamlanmış çalışma alanı uzlaştırması gerektirir. Canlı çift yönlü devir daha sonra aynı bariyer mekanizması üzerine kurulacaktır.
- Gateway'de JSON yan durumu yoktur; ortam, yerleşim, imleç ve yetkilendirme durumu SQLite'ta tutulur.

## Önceki çalışmalar (neyi kopyalıyoruz, neyi tersine çeviriyoruz)

- Cursor bulut agent'ları: agent döngüsü kendi bulutlarında çalışır; VM bir araç yürütme hedefidir; yalnızca eklemeli konuşma deposu tüm istemcilere aktarılır; kurulum sonrası anlık görüntüyle hızlı başlatma; kendi barındırılan worker'lar yalnızca dışarıya bağlanan worker işlemleridir. "Konuşmanın doğruluk kaynağı düzenleyicide kalır" yaklaşımını ve akış modelini kopyalıyor, döngü yerleşimini tersine çeviriyoruz (aşağıdaki karara bakın).
- Codex cloud: iki aşamalı çalışma zamanı — ağ bağlantılı kurulum aşaması, ardından gizli bilgilerin kaldırıldığı çevrimdışı agent aşaması; hızlı devam işlemleri için kapsayıcı durumu önbelleği. Çıkış yaklaşımımız için aşama ayrımını, v2 sıcak imajları içinse önbellek fikrini kopyalıyoruz.
- Web üzerinde Claude Code: oturum başına VM; kimlik bilgilerini yalıtan git proxy'si (gerçek token'lar sandbox'a hiçbir zaman girmez, push işlemi oturum dalıyla sınırlandırılır); kurulum sonrasında dosya sistemi anlık görüntüsü; teleport devri = push edilmiş dal + yeniden oynatılmış geçmiş. Kimlik bilgisi yalıtımını ve devir çerçevesini kopyalıyoruz ancak dışarıya eşitleme gateway'den rsync ile yapıldığından değişiklik içeren çalışma ağaçları kullanılabilir ve kutunun yakınında hiçbir forge token'ı bulunmaz.
- Copilot kodlama agent'ı: paket kayıt sistemi izin listesiyle varsayılan olarak reddedilen çıkış. Kararlı durumdaki varsayılanımız daha güçlüdür (hiç doğrudan çıkış yoktur) çünkü çıkarım ve web araması SSH tüneli üzerinden gelir — ancak bunun neden "sıfır çıkış" değil, "denetimli çıkış" olduğu için Güvenlik bölümüne bakın.

## Mimari karar: döngü worker'da, çıkarım gateway üzerinden

Üç yerleşim değerlendirildi:

1. Döngü gateway'de kalır, worker araçları çalıştırır (Cursor modeli). En güvenli hata alanıdır (transkript, çıkarım, onaylar ve yeniden başlatma kurtarması yerelde kalır) ve inceleyicilerin ilk kilometre taşı için tercih ettiği seçenektir. Ürün mimarisi olarak reddedildi: OpenClaw'ın yürütme dışı araçları işlem içi dosya sistemi işlemleridir; dolayısıyla her dosya okuma/düzenleme/grep işlemi bir ağ gidiş dönüşüne veya kaba çalışma alanı RPC'lerine yönelik geniş kapsamlı bir araç yüzeyi yeniden düzenlemesine dönüşür; çalışma zamanı davranışı yoğun iletişimlidir ve gecikmeye bağımlıdır. Zaten oluşturulmuş olduğu yerlerde (çalıştırma işlerinin Node'lara aktarılması) bu yaklaşımın özünü yeniden kullanırız ancak araçların uzaktan çalıştırılması katmanını oluşturmayız.
2. Döngü ve çıkarımın ikisi de worker'da çalışır. En basit hata alanıdır ancak model kimlik bilgilerinin (OAuth profilleri dahil) tek kullanımlık makinelere gönderilmesi gerekir, gateway politika/yönlendirme/denetim kontrolünü kaybeder ve taşıma, sağlayıcı çağrısını yapan kimliği değiştirerek sağlayıcı önbelleklerini geçersiz kılar.
3. Döngü + araçlar worker'da, model çağrıları gateway üzerinden proxy'lenir. Seçilen yaklaşım budur. Araç çağrısı başına değil, model turu başına bir gidiş dönüş yapılır; araçlar kodun yanında çalışır; gateway kimlik doğrulama profillerinin, sağlayıcı yönlendirmesinin ve politikanın tek sahibi olmaya devam eder; worker hiçbir gizli bilgi barındırmaz.

3. seçeneğin maliyeti, her model turu sırasında eşzamanlı bir gateway bağımlılığıdır; bu nedenle dayanıklılık kuralları sonradan düşünülen bir ayrıntı değil, kararın bir parçasıdır:

- Bir turun ortasında gateway kaybı, etkin sağlayıcı çağrısının başarısız olmasına neden olur. Tur başarısız olarak işaretlenir ve yeniden bağlantı kurulduktan sonra yeni bir tur olarak tekrar denenir; devam eden bir sağlayıcı akışı şeffaf biçimde yeniden oynatılmaz (çifte ücretlendirme/çifte araç çağrısı riski).
- Her worker↔gateway işlemi kalıcı kimlik taşır (Worker protokolüne bakın); böylece yeniden bağlantılar askıda kalmak yerine devam eder veya önbelleğe alınmış son sonuçları getirir.
- Gateway kapasitesi yönetilen bir bileşendir: eşzamanlı worker sınırları, akış denetimi ve yük azaltma v1 kapsamındadır (Kapasite bölümüne bakın).

Gateway hem transkripti depoladığı hem de tüm sağlayıcı trafiğini başlattığı için oturum konumdan bağımsızdır: döngüyü gateway ile worker arasında taşımak, sağlayıcı tarafında veya UI veri yolunda hiçbir şeyi değiştirmez. Yönlendirmeyi ve geri almayı düşük maliyetli kılan budur.

## Bileşenler

### 1. Ortam durum makinesi + sağlayıcı sözleşmesi

Gateway protokolündeki `environments.*` şu anda yalnızca durum gösteren bir projeksiyondur. Kalıcı çekirdek, RPC biçimlerinden önce tasarlanan, SQLite tarafından sahiplenilen bir ortam kaydı ve durum makinesidir:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- Sağlama işlemi çökmeye karşı güvenlidir: amaç satırı, sağlayıcı çağrısından önce deterministik bir işlem kimliğiyle kalıcılaştırılır; böylece gateway yeniden başlatıldığında ücretli bir makineyi iki kez sağlamak veya sahipsiz bırakmak yerine devam eden bir kiralamayı benimseyebilir.
- Yeniden başlatma uzlaştırması ve sahipsiz kaynak temizleyicisi (sağlayıcı `inspect` ile yerel kayıtların karşılaştırılması), sağlamlaştırma çalışmaları değil v1 gereksinimleridir.

Sağlayıcı sözleşmesi (Plugin tarafından uygulanır; çekirdekte sağlayıcı adları veya politika bulunmaz):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → ssh host/port/user/key material
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // adopt/health/orphan sweep
  renew?(leaseId: string): Promise<void>; // long-lived sessions vs provider TTLs
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotent, returns only on proof of teardown
};
```

RPC'ler: `environments.create`, `environments.destroy`, genişletilmiş `environments.list/status` (sağlayıcı, kiralama kimliği, durum, yaş, boşta kalma süresi, bağlı oturumlar). İlk sağlayıcılar: Crabbox biçimli bir kiralama CLI sarmalayıcısı (ürün yolu) ve yalnızca geliştirme için işaretlenmiş statik SSH ana makine sağlayıcısıdır — paylaşılan bir ana makinedeki worker, ana makinenin ilgisiz verilerini okuyabilir; bu nedenle statik ana makineler varsayılan yaklaşım için değil, özellik geliştirme içindir.

### 2. Worker önyüklemesi: OpenClaw'ı kutuya yükleme

Özel bir worker yapıtı ve npm kullanılabilirliğine bağımlılık yoktur:

- Tüm modlar için standart kurulum: gateway tarafından üretilen, içerik karması alınmış bir worker paketi (gateway'in kendi derleme çıktısının tarball olarak paketlenmiş hâli), SSH üzerinden gönderilir ve kutuya yüklenir. Bu, geliştirme derlemelerini ve yayımlanmamış commit'leri doğası gereği kapsar.
- Gateway yayımlanmış bir sürüm çalıştırdığında `npm i -g openclaw@<exact gateway version>` bir optimizasyondur; hiçbir zaman `latest` kullanılmaz.
- Önyükleme eşgüçlüdür; paket karması eşleşen sıcak bir kiralamada kurulum atlanır. Ham makineler ağ bağlantılı bir araç zinciri aşamasına (Node çalışma zamanı) ihtiyaç duyabilir — bu, kurulum aşamasının bir parçasıdır ve sonrasında kapatılır.
- El sıkışma; worker derleme karmasını, protokol özellik kümesini ve çalışma zamanı uyumluluğunu doğrular. Mevcut gateway sürüm/protokol denetimleri bunun için yetersizdir (SSH tüneli üzerinden bağlanan Node'lar tam sürüm reddinden muaftır); bu nedenle worker kabulü kendi tam derleme denetimini gerçekleştirir.

Worker modu (`openclaw worker`) bir çatallanma değil, giriş noktasıdır: bağlantı yönetimi ve gömülü agent çalıştırıcısı; oturum kalıcılığı ve model çağrıları gateway RPC'leriyle desteklenir. Gateway yüzeylerini başlatmamalıdır: kanal yoktur, oturum araç kümesi dışında otomatik Plugin başlatma yoktur, tek kullanımlık durum dizini kullanılır ve yerel kimlik doğrulama profilleri bulunmaz.

### 3. Aktarım: her şey SSH üzerinden

Bağlantının sahibi gateway'dir; worker yalnızca sshd gerektirir:

- Gateway, worker'a SSH bağlantısı açar (sağlayıcı kiralamasından alınan kimlik bilgileri; sağlama çıktısından sabitlenen ana makine anahtarı — `StrictHostKeyChecking=no` kullanılmaz) ve worker'a yerel bir soketi gateway'in WS uç noktasına yönlendiren ters tünel kurar.
- Denetim/model trafiği ve çalışma alanı aktarımı, aynı sabitlenmiş güven malzemesiyle ayrı SSH bağlantıları kullanır; böylece rsync, token akışlarını kuyruk başında engelleyemez.
- Tünel yaşam döngüsünün (bağlantıyı canlı tutma, geri çekilmeli yeniden bağlantı) sahibi gateway'deki ortam çalışma zamanıdır. Tüneldeki kısa bir kesinti oturum düzeyinde görünmez: aşağıdaki kalıcı protokol durumu, worker'ın yeniden bağlanıp devam etmesini sağlar.

### 4. Worker protokolü (özel; Node protokolü değildir)

Mevcut Node bağlantı noktalarına yönelik karşıt inceleme, doğrudan yeniden kullanımı eledi: bekleyen Node çağrıları bağlantıyla birlikte sonlanan işlem içi promise'lerdir, Node eşgüçlülük anahtarları ayrıştırılır ancak yinelenen çağrılar ayıklanmaz ve — belirleyici olarak — bağlı bir Node sıradan Node olayları (agent çalıştırma istekleri dahil) yayabilir; dolayısıyla "Node türü + yetenek tavanı" gelen trafik için bir güvenlik sınırı değildir. Bu nedenle worker'lar kapalı ve sürümlenmiş bir RPC/olay izin listesine sahip, kimliği doğrulanmış bir `worker` rolü edinir; worker bağlantıları hiçbir eski Node olay işleyicisine erişemez.

Kimlik ve kimlik bilgileri: sağlama işlemi; ortam kimliğine, worker anahtarına, paket karmasına, izin verilen tek oturuma, izin verilen RPC kümesine ve son kullanma zamanına bağlı kısa ömürlü bir worker kimlik bilgisi üretir. SSH ile doğrulanan eşleştirme hâlâ geçerlidir (kutuyu biz sağladık ve anahtarı elimizde tutuyoruz) ancak yetkilendirme, bildirilen Node yüzeyinden değil üretilen kimlik bilgisinden gelir.

Kalıcı işlem semantiği (biçim, mevcut ACP çalışma zamanından ve onun olay günlüğünden alınmıştır — kararlı tanıtıcılar, oturum başına serileştirme, kalıcı `(session, seq)` yeniden oynatma):

- Her işlem `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)` kapsamında yer alır.
- Sahiplik dönemleri eski worker'ları sınırlar: yeni worker dönemi ilerletir; eski döneme ait gecikmiş sonuçlar deterministik olarak reddedilir.
- SQLite'ta kalıcılaştırılmış ACK imleçleri ve önbelleğe alınmış son sonuçlarla en az bir kez teslim; yinelenen kayıtları ayıklama deterministiktir. Tam olarak bir kez teslim garantisi verilmez.
- İptal, kapatma, devam etme ve son sonuçlar için açık çerçeveler; akışlarda kredi/pencere tabanlı akış denetimi.
- Protokol özelliği uzlaşması, genel Node protokolü sürümünden bağımsızdır.

### 5. Oturum arka ucu RPC'leri

İki ayrı sözleşme — mevcut kod tabanı, kalıcı transkript mutasyonlarını (oturum yöneticisinin sahip olduğu, üst/son durumlu JSONL ağacı) süreç yerelindeki canlı olaylardan (akış deltaları, araç yaşam döngüsü, onaylar) ayırır ve çalışan protokolü bu ayrımı korumalıdır:

- Kalıcı transkript işlemeleri: çalışan, `runEpoch` + temel son öğe karşılaştır-ve-değiştir işlemiyle anlamsal ekleme toplu işlemleri gönderir; Gateway oturum yöneticisi girdi kimliklerini ve üst kimliklerini oluşturur. Çalışan hiçbir zaman güvenilir transkript satırları, girdi kimlikleri, üst kimlikleri veya yabancı oturum kimlikleri sağlayamaz.
- Yeniden oynatılabilir canlı olaylar: çalışan sıra numaraları, Gateway ACK'leri, sınırlı saklama ve geç olay çitlemesi içeren türü belirlenmiş bir olay birleşimi; sohbet görünümünün, araç satırlarının ve okunmamış/durum mantığının yerel oturumlarla aynı şekilde davranması için mevcut ajan olayı dağıtımını besler.

Çıkarım vekili: mevcut çalışma zamanı vekil akış istemcisinin (`src/agents/runtime/proxy.ts`) olay söz varlığını yeniden kullanın, ancak güven sınırını taşıyın. Çalışan yalnızca oturum/çalıştırma kimliğini, onaylanmış bir model referansını, bağlamı ve kısıtlanmış üretim seçeneklerini gönderir; Gateway sağlayıcıyı, uç noktayı, kimlik doğrulamayı, üstbilgileri, yönlendirmeyi ve maliyet politikasını kendi kataloğundan çözümler. Çalışan tarafından sağlanan bir model nesnesi (ör. saldırgan denetimindeki `baseUrl`) reddedilir. İstek boyutu sınırları, iptal, denetim ve terminal sonucu yeniden oynatma uygulanır. Gateway'de yerleşik araçlar (web araması) Gateway'de yürütülür ve sonuçları aynı kanal üzerinden döndürür.

### 6. Çalışma alanı eşitlemesi

Eşitleme çapası, münhasır yerleştirme sahipliğine sahip Gateway yerelindeki bir çalışma alanıdır: git çalışma alanları için ayrılmış, yönetilen bir worktree (mevcut yönetilen worktree meta verileri — dal, temel, anlık görüntü sahipliği — temel oluşturur); git dışı çalışma alanları için Gateway'in sahip olduğu bir hedef dizin. Asla kullanıcının canlı çalışma kopyası değildir. Oturum uzaktan yerleştirilmişken münhasır sahiplik, içeri eşitlemeyi tasarım gereği çakışmasız kılar.

Sahiplik ayrımı — işleme ve yayımlama:

- Çalışan tarafındaki ajan, kendi kopyasında normal şekilde commit oluşturur (`git commit` yerel ve kimlik bilgisi gerektirmeyen bir işlemdir; yazar kimliği Gateway yapılandırmasından yansıtılır). Gateway bunları benimseyene kadar bu commit'ler etkisiz nesnelerdir.
- Güven gerektiren her şeyi Gateway yapar: gelen commit'lerin kaydedilen temel üzerine kurulduğunu doğrulama, yerel worktree'yi hızlı ileri alma, gönderme, PR oluşturma ve isteğe bağlı imzalama/yeniden imzalama — tümü Gateway yerelindeki kimlik bilgileriyle. Çalışan hiçbir zaman git veya forge kimlik bilgilerini tutmaz ve hiçbir zaman uzak depoya dokunmaz.

Çalışma alanının bir git deposu olup olmadığına göre seçilen iki eşitleme modu:

- Git modu. Dışarı: worktree'yi (işlenmemiş ve uygun izlenmeyen dosyalar dâhil; crabbox tarzı dâhil etme/hariç tutma, `.worktreeinclude` dikkate alınır) tünelin SSH kimliği üzerinden rsync ile eşitleyin ve değiştirilemez bir temel bildirim olarak kaydedin (içerik karmaları + temel commit). İçeri: yeni commit'ler, kaydedilen temele karşı bir git bundle veya geçici ref olarak döner; izlenmeyen yapılar, boyut/tür/sembolik bağlantı çevreleme kontrolleri içeren açık bir bildirim aracılığıyla döner. Benimseme, temel soyunu doğrular ve ayrışmada durur — hiçbir şey iki taraftan birinin üzerine sessizce yazmaz. Silmeler, yeniden adlandırmalar, alt modüller ve sembolik bağlantı kaçışları rsync sezgileriyle değil, bildirim kurallarıyla ele alınır.
- Düz mod (git yok — ör. kutuda sıfırdan bir proje oluşturma). Dışarı aktarım aynı rsync + temel bildirimidir. İçeri aktarım, silme yayılımıyla birlikte bildirim farkı alınmış bir yansıyı Gateway'in sahip olduğu hedef dizine geri getirir. Git moduyla aynı nedenle güvenlidir: münhasır sahiplik, çakışacak eşzamanlı yerel düzenlemelerin bulunmadığı anlamına gelir; temel bildirim yine de beklenmeyen yerel sapmayı algılar ve üzerine yazmak yerine durur.

Denetim noktaları, günler süren oturumları kiralama kaybına karşı korur: düzenli gelen denetim noktaları (git modunda oturum dalı commit'leri, düz modda bildirim anlık görüntüleri); sıklık profil politikasıdır (varsayılan olarak tur tabanlı).

### 7. Yerleştirme durum makinesi, oturumlar ve kullanıcı arayüzü

Çalışma zamanı yerleştirmesi, bir çift bağımsız satır alanı değil, oturumla anahtarlanan ve SQLite'ın sahip olduğu bir durum makinesidir:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Ortam kimliğini, geçiş neslini, etkin sahip epoch'unu, çalışma alanı temel bildirimini, çalışan bundle karmasını ve son ACK imleçlerini kalıcılaştırır. Tur kabulü, döngülerden biri bir tur başlatmadan önce yerleştirmeyi atomik olarak talep eder; böylece eski bir anlık görüntüye göre kabul edilen yerel bir ileti hiçbir zaman çalışan turuyla yarışamaz — herhangi bir anda oturumun sahibi tam olarak bir döngüdür.

Kullanıcı arayüzü:

- Çalışan oturumu, yerleştirme meta verilerine sahip sıradan bir oturum satırıdır. Normal depoda bulunur, `sessions.list` aracılığıyla listelenir ve mevcut abonelikler aracılığıyla akış gerçekleştirir — kenar çubuğu ve sohbet için yeni bir veri yolu gerekmez; yalnızca sunum gerekir: çalışan rozeti ve yerleştirme/ortam durumu (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Oluşturma kullanıcı deneyimi: oturum hedef çubuğu (oturumlar kenar çubuğu yeniden tasarımı), Gateway ve Node'un yanında bir bulut çalışanı hedefi kazanır. Yapılandırılmış bir sağlayıcı profili gerektirir; özellik yapılandırılana kadar görünmez.
- Ajan yönlendirmesi: bir oturum aracı, ajanın işi bir insanın yaptığı gibi bulut çalışanına devretmesine olanak tanır (çalışan destekli alt oturum, alt ajan tarzında). İnsan yönlendirmesiyle aynı kilometre taşında sunulur ve aynı isteğe bağlı sağlayıcı yapılandırmasıyla denetlenir. Özyineleme yapısal olarak sınırlandırılır (çalışan oturumları v1'de kendileri çalışan yönlendiremez); harcama denetimi kota mekanizmasıyla değil, ortam başına muhasebe/denetimle sağlanır.

## Yönlendirme ve devir

v1 bilinçli olarak asimetriktir:

- Yerel → çalışan (yönlendirme): aşağıdaki geçiş bariyerini aşın, bir çalışan sağlayın veya yeniden kullanın, eşitleyin, yerleştirmeyi değiştirin; sonraki tur uzaktan yürütülür.
- Çalışan → yerel (geri çekme): oturumu durdurun (çalışanı aynı bariyere göre boşaltın), gelen uzlaştırmayı tamamlayın, yerleştirmeyi yerele çevirin. Bu canlı geçiş değildir.
- Simetrik canlı devir (etkin olarak çalışan bir oturumu durdurmadan iki yönde taşımak), aynı bariyer ve uzlaştırma mekanizmasını yeniden kullanır ve hata enjeksiyonu testleri bariyeri kanıtladıktan sonra sunulur.

Geçiş bariyeri ("tur sınırı" tek başına yetersizdir — onaylar, arka plan süreçleri ve serbest bırakılmış kilit transkript birleştirmeleri bu sınırı aşabilir):

1. Yeni tur kabulünü durdurun (yerleştirme talebi).
2. Etkin çalıştırmaları iptal edin veya boşaltın.
3. Bekleyen yürütme onaylarını ve yürütme izinlerini iptal edin.
4. Transkript yan yazmalarını ve canlı olay ACK'lerini boşaltın.
5. Çalışan alt süreçlerini sonlandırın.
6. Sahip epoch'unu ilerleterek eski sahibi çitleyin.
7. Çalışma alanını uzlaştırın (gelen, çakışma duyarlı).
8. Yeni sahibi etkinleştirin.

Önbellek yakınlığı: sağlayıcı istekleri her iki yerleştirmede de Gateway'den çıktığı için, serileştirilmiş sağlayıcı isteği eşdeğer kaldığında önbellek yakınlığı korunur — aynı araç sırası, sistem talimatları, sağlayıcı sarmalayıcıları ve önbellek meta verileri (Gateway tarafında kalır). Bu bir varsayım değil, test edilebilir bir özelliktir: desteklenen her sağlayıcı aktarımı için yerel/çalışan yerleştirmeleri arasındaki bayt eşdeğerliği testleri, çalışan döngüsünü tanıtan kilometre taşının parçasıdır.

## Güvenlik modeli

Kesin ifade: çalışanın doğrudan ağ çıkışı ve kalıcı sağlayıcı/forge kimlik bilgileri yoktur. Bu, "sıfır çıkış" değildir — çıkarım ve Gateway tarafından yürütülen araçlar denetimli çıkış kanallarıdır (istem enjeksiyonuna uğramış bir çalışan yine de çalışma alanı baytlarını model bağlamına veya web araması sorgularına koyabilir). Buna göre:

- Denetimli çıkış muhasebesi: çıkarım vekili ve Gateway araçlarında ortam başına denetim ve operatör tarafından görülebilen muhasebe. Hız/bayt sınırları, harcama kotası mekanizması olarak değil, protokol akış denetimi (kapasite) olarak bulunur.
- Çalışanın Gateway'e girişi, kapalı çalışan protokolü izin listesidir; transkript yazmaları yapısal olarak kısıtlanır (Gateway tarafından oluşturulan kimlikler, bağlı tek oturum).
- Çalışan yürütmesi kutu içinde tam izinlidir. Kutu tek kullanımlık ve kimlik bilgisi içermez; bu nedenle komut başına onay, hiçbir şeyi korumadan sürtünme ekler; korunan sınır gelen uzlaştırma ve denetimdir. Yürütme hiçbir zaman Gateway Node onay yolundan geçmez.
- İnternet politikası, sağlama zamanında verilen bir sağlayıcı kararıdır: ortam profili kutu oluşturulurken karar verir (güvenlik duvarı/güvenlik grubu/çıkışsız ağ); isteğe bağlı olarak sağlayıcının ajan aşamasından önce kapattığı ağ bağlantılı bir kurulum aşaması bulunabilir. Çekirdek, çalışma zamanında ağ geçiş anahtarı uygulamaz.
- Sağlama zamanında kutu hijyeni: bulut meta veri uç noktası engellenmiş veya bulunmadığı doğrulanmış, örnek profili yok, devralınmış SSH ajanı yok, Docker soketi yok, temiz ortam/ana dizin. SSH ana makine anahtarları sağlama çıktısından sabitlenir.
- Gateway tarafındaki her şeyin (gönderme, PR, sağlayıcı çağrıları) onayları ve politikası Gateway'de çalışmaya devam eder.

Ele geçirilmiş bir çalışan oturumunun etki alanı: eşitlenen çalışma alanı kopyası ve denetlenen vekil kanallarının izin verdikleri — kimlik bilgisi yok, doğrudan ağ yok, izin listesinin ötesinde Gateway yüzeyi yok.

## Kapasite

Gateway, N çalışan için her istemi ve token akışını aktarır; bu nedenle v1, bunu üretimde keşfetmek yerine bir kapasite modeli tanımlar: Gateway başına eşzamanlı çalışan sınırları, akış başına kredi pencereleri (mevcut olay akışı kuyruğu sınırsızdır ve Node soket arabelleği tavanı yavaş tüketicileri zorla kapatır — ikisi de değiştirilmeden kullanıma uygun değildir), ani yükler için sınırlı disk biriktirme ve kullanıcı arayüzünde görünür geri basınç durumlarıyla yük azaltma. Çalışma alanı aktarımı kendi SSH kanalında kalır.

## Yaşam döngüsü

- Boşta otomatik durdurma ve TTL, sabit sabitler değil, sağlayıcı profili politikasıdır. Varsayılanlar, açıkça belirtilen canlı tutma özelliğiyle cömerttir; günler süren çalışma birinci sınıftır (kiralama tabanlı arka uçlar için sağlayıcı `renew` işlevi bulunur); devam eden bir turu veya yakın zamanda etkinliği olan bir oturum hiçbir zaman geri alınmaz.
- Çalışanın ölmesi veya geri alınması durumunda: yerleştirme `reclaimed` durumuna geçer, oturum satırı kalır, sonraki ileti yeni bir çalışan sağlar ve son denetim noktasından yeniden eşitler. Konuşma hiçbir zaman kaybolmaz (Gateway tarafındaki depo); son denetim noktasından sonraki çalışma alanı değişiklikleri kaybolur ve kullanıcı arayüzü bunu belirtir.
- İlk günden itibaren sıcak kiralama yeniden kullanımı (bunu destekleyen sağlayıcılar); önyükleme sonrasında imaj anlık görüntüsü, v2 hızlı başlatma yoludur.

## Yapılandırma yüzeyi

Asgari ve isteğe bağlı: bir sağlayıcı profili bloğu (sağlayıcı kimliği, kimlik bilgileri/CLI referansı, eşitleme kuralları, yaşam süresi politikası, bütçeler, isteğe bağlı kurulum aşaması) ve oturum başına yerleştirme seçimi. Yeni ortam değişkeni yoktur. Yapılandırılmamış kurulumlar hiçbir şey görmez.

## Kilometre taşları

Uygulama, küçük ve bağımsız olarak birleştirilebilir PR'lar hâlinde sunulur; aşağıdaki her kilometre taşı tek bir değişiklik değil, bir PR serisidir.

1. Temeller: ortam durum makinesi + sağlayıcı sözleşmesi + crabbox biçimli sağlayıcı (geliştirme düzeneği olarak statik SSH), çalışan bundle önyüklemesi + kabul el sıkışması, SSH tüneli + ana makine anahtarı sabitleme, yönetilen worktree anlık görüntüsü + dışarı eşitleme (git + düz modlar). Sahipsiz öğe taraması + yeniden başlatma sonrası benimseme.
2. Çalışan protokolü + çalışan döngüsü: kimliği doğrulanmış çalışan rolü, kalıcı işlemler/epoch'lar/ACK imleçleri, transkript işleme + canlı olay sözleşmeleri, Gateway tarafından çözümlenen modellerle çıkarım vekili, akış denetimi. Tek sağlayıcı, yalnızca yeni oturumların insan tarafından yönlendirilmesi, devir yok. Hata enjeksiyonu testleri (tünel bölünmesi, Gateway yeniden başlatması, çalışan ölümü) çıkışı denetler.
3. Yönlendirme + geri çekme + ajan yönlendirmesi: geçiş bariyeri, kullanıcı arayüzü hedef çubuğuna bağlanan yerleştirme durum makinesi, gelen uzlaştırma + denetim noktaları, ortam başına denetim, kapasite sınırları, ajan yönlendirme aracı (çalışan oturumları özyineleme yapamaz). İstem önbelleği bayt eşdeğerliği testleri.
4. Kilometre taşı 3 hata enjeksiyonu kanıtından sonra simetrik canlı devir.

Daha sonra: ortam başına kimlik bilgisi yükleme isteğine bağlı seçeneği olarak çalışanlarda ACP düzenekleri; anlık görüntü/sıcak imaj hızlı başlatma; dağıtma (N kiralama, aynı istem); kutu içinde işletim sistemi korumalı alanı; yapılar şeması aracılığıyla daha zengin yapı yakalama.

## Açık sorular

- Çalışanlardaki Plugin/skill kullanılabilirliği: depoda bulunan skill'ler çalışma alanıyla ücretsiz olarak eşitlenir; Gateway üzerinden yapılandırılan ajan skill'leri/Plugin'leri için açık bir eşitleme veya hariç tutma kararı gerekir (her iki durumda da araç/Plugin manifesti kabul el sıkışmasının bir parçasıdır).
- Denetim noktası sıklığı varsayılanı: çok yoğun sohbet içeren oturumlar için tur tabanlı veya zaman tabanlı.
- Ortam profillerinin çoklu ajan yönlendirmesiyle nasıl etkileşime girdiği (ajan başına varsayılan profiller veya yalnızca oturum başına seçim).
