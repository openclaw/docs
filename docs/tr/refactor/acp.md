---
read_when:
    - ACP oturum yaşam döngüsünü veya ACPX işlem temizliğini yeniden düzenleme
    - ACPX yetim süreçleri, PID yeniden kullanımı veya çoklu Gateway temizleme güvenliği için hata ayıklama
    - Oluşturulan ACP veya alt aracı oturumları için sessions_list görünürlüğünü değiştirme
    - Arka plan görevleri, ACP oturumları veya süreç kiraları için sahiplik meta verileri tasarlama
sidebarTitle: ACP lifecycle refactor
summary: ACP oturumu ve ACPX süreç sahipliğini açık hale getirmeye yönelik geçiş planı
title: ACP yaşam döngüsü yeniden düzenlemesi
x-i18n:
    generated_at: "2026-05-07T13:26:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ACP yaşam döngüsü şu anda çalışıyor, ancak büyük kısmı olaydan sonra çıkarımla belirleniyor.
Süreç temizliği sahipliği PID'lerden, komut dizelerinden, sarmalayıcı
yollarından ve canlı süreç tablosundan yeniden oluşturuyor. Oturum görünürlüğü sahipliği
oturum anahtarı dizelerinden ve ikincil `sessions.list({ spawnedBy })` aramalarından yeniden oluşturuyor.
Bu, dar kapsamlı düzeltmeleri mümkün kılıyor, ancak uç durumların gözden kaçmasını da kolaylaştırıyor:
PID'nin yeniden kullanılması, tırnak içine alınmış komutlar, adaptör torun süreçleri, çoklu Gateway durum kökleri,
`cancel` ile `close` arasındaki fark ve `tree` ile `all` görünürlüğü, aynı sahiplik kurallarını
yeniden keşfetmek için ayrı ayrı yerlere dönüşüyor.

Bu yeniden düzenleme sahipliği birinci sınıf hale getirir. Amaç yeni bir ACP ürün
yüzeyi değildir; mevcut ACP ve ACPX davranışı için daha güvenli bir iç sözleşmedir.

## Hedefler

- Temizlik, geçerli canlı kanıt bir OpenClaw sahipli kiralama ile eşleşmedikçe hiçbir sürece sinyal göndermez.
- `cancel`, `close` ve başlangıçta toplama işlemlerinin ayrı yaşam döngüsü amaçları vardır.
- `sessions_list`, `sessions_history`, `sessions_send` ve durum kontrolleri aynı istek sahibi oturum modelini kullanır.
- Çoklu Gateway kurulumları birbirlerinin ACPX sarmalayıcılarını toplayamaz.
- Eski ACPX oturum kayıtları geçiş sırasında çalışmaya devam eder.
- Çalışma zamanı Plugin sahipliğinde kalır; çekirdek ACPX paket ayrıntılarını öğrenmez.

## Kapsam Dışı Hedefler

- ACPX'i değiştirmek veya herkese açık `/acp` komut yüzeyini değiştirmek.
- Tedarikçiye özgü ACP adaptör davranışını çekirdeğe taşımak.
- Kullanıcıların yükseltmeden önce durumu elle temizlemesini gerektirmek.
- `cancel` komutunun yeniden kullanılabilir ACP oturumlarını kapatmasını sağlamak.

## Hedef Model

### Gateway Örnek Kimliği

Her Gateway sürecinin kararlı bir çalışma zamanı örnek kimliği olmalıdır:

```ts
type GatewayInstanceId = string;
```

Bu, Gateway başlangıcında oluşturulabilir ve ilgili kurulumun ömrü boyunca durumda
kalıcı hale getirilebilir. Bu bir güvenlik sırrı değildir; bir Gateway'in ACP süreçlerini
başka bir Gateway'in süreçleriyle karıştırmayı önlemek için kullanılan bir sahiplik ayırıcısıdır.

### ACP Oturum Sahipliği

Oluşturulan her ACP oturumunda normalleştirilmiş sahiplik meta verileri olmalıdır:

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

Gateway, bilinen yerlerde bu alanları oturum satırlarında döndürmelidir.
Görünürlük filtreleme, satır meta verileri üzerinde saf bir kontrol olmalıdır:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Bu, gizli ikincil `sessions.list({ spawnedBy })` çağrılarını görünürlük
kontrollerinden kaldırır. Oluşturulmuş çapraz aracı ACP alt oturumu, ikinci bir sorgu
onu tesadüfen bulduğu için değil, satır bunu söylediği için istek sahibi tarafından sahiplenilir.

### ACPX Süreç Kiralamaları

Oluşturulan her sarmalayıcı başlatması bir kiralama kaydı oluşturmalıdır:

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

Sarmalayıcı süreç, kiralama kimliğini ve Gateway örnek kimliğini ortamında almalıdır:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Platform izin verdiğinde, doğrulama komut tırnaklamasıyla karışmayacak canlı süreç meta verilerini tercih etmelidir:

- kök PID hâlâ mevcut
- canlı sarmalayıcı yolu `wrapperRoot` altında
- süreç grubu, kullanılabilir olduğunda kiralamayla eşleşir
- okunabildiğinde ortam beklenen kiralama kimliğini içerir
- komut karması veya çalıştırılabilir yolu kiralamayla eşleşir

Canlı süreç doğrulanamazsa temizlik kapalı biçimde başarısız olur.

## Yaşam Döngüsü Denetleyicisi

Süreç kiralamalarının ve temizlik politikasının sahibi olan tek bir ACPX yaşam döngüsü denetleyicisi tanıtın:

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` yalnızca tur iptali ister. Yeniden kullanılabilir sarmalayıcı veya adaptör süreçlerini toplamamalıdır.

`closeSession` toplama yapabilir, ancak yalnızca oturum kaydını yükledikten,
kiralamayı yükledikten ve canlı süreç ağacının hâlâ o kiralamaya ait olduğunu doğruladıktan sonra.

`reapStartupOrphans` durumdaki açık kiralamalardan başlar. Alt süreçleri bulmak için süreç
tablosunu kullanabilir, ancak önce rastgele ACP gibi görünen komutları tarayıp ardından
bunların muhtemelen bize ait olduğuna karar vermemelidir.

## Sarmalayıcı Sözleşmesi

Oluşturulan sarmalayıcılar küçük kalmalıdır. Şunları yapmalıdır:

- desteklenen yerlerde adaptörü bir süreç grubunda başlatmak
- normal sonlandırma sinyallerini süreç grubuna iletmek
- üst sürecin öldüğünü algılamak
- üst süreç öldüğünde SIGTERM göndermek, ardından SIGKILL yedeği çalışana kadar sarmalayıcıyı canlı tutmak
- kullanılabilir olduğunda kök PID'yi ve süreç grubu kimliğini yaşam döngüsü denetleyicisine bildirmek

Sarmalayıcılar oturum politikasına karar vermemelidir. Yalnızca kendi adaptör grupları için
yerel süreç ağacı temizliğini uygularlar.

## Oturum Görünürlüğü Sözleşmesi

Görünürlük normalleştirilmiş satır sahipliğini kullanmalıdır:

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

Kurallar:

- `self`: yalnızca istek sahibi oturumu.
- `tree`: istek sahibi oturumu ve istek sahibi tarafından sahiplenilen veya ondan oluşturulan satırlar.
- `all`: tüm aynı aracı satırları, a2a izinli çapraz aracı satırlar ve genel a2a devre dışı olsa bile istek sahibi tarafından sahiplenilen oluşturulmuş çapraz aracı satırlar.
- `agent`: yalnızca aynı aracı, satırın istek sahibine ait olduğunu belirten açık bir sahip ilişkisi olmadığı sürece.

Bu, `tree` ve `all` görünürlüğünü monoton yapar: `all`, `tree` tarafından gösterilecek sahipli bir alt oturumu gizlememelidir.

## Geçiş Planı

### Aşama 1: Kimlik Ve Kiralamalar Ekle

- Gateway durumuna `gatewayInstanceId` ekle.
- ACPX durum dizini altında bir ACPX kiralama deposu ekle.
- Oluşturulan bir sarmalayıcı başlatmadan önce kiralama yaz.
- Yeni ACPX oturum kayıtlarında `leaseId` sakla.
- Eski kayıtlar için mevcut PID ve komut alanlarını koru.

### Aşama 2: Kiralama Öncelikli Temizlik

- Kapatma temizliğini önce `leaseId` yükleyecek şekilde değiştir.
- Sinyal göndermeden önce canlı süreç sahipliğini kiralamaya göre doğrula.
- Mevcut kök PID ve sarmalayıcı kökü yedeğini yalnızca eski kayıtlar için koru.
- Doğrulanmış temizlikten sonra kiralamaları `closed` olarak işaretle.
- Süreç temizlikten önce kaybolmuşsa kiralamaları `lost` olarak işaretle.

### Aşama 3: Kiralama Öncelikli Başlangıç Toplama

- Başlangıç toplaması açık kiralamaları tarar.
- Her kiralama için kök süreci doğrula ve alt süreçleri topla.
- Doğrulanmış ağaçları çocuklardan başlayarak topla.
- Eski `closed` ve `lost` kiralamalarını sınırlı bir saklama penceresiyle sona erdir.
- Komut işaretleyici taramasını yalnızca geçici bir eski yedek olarak koru; mümkün olduğunda sarmalayıcı kökü ve Gateway örneğiyle sınırla.

### Aşama 4: Oturum Sahipliği Satırları

- Gateway oturum satırlarına sahiplik meta verileri ekle.
- ACPX, alt aracı, arka plan görevi ve oturum deposu yazıcılarına `ownerSessionKey` veya `spawnedBy` alanını doldurmayı öğret.
- Oturum görünürlüğü kontrollerini satır meta verilerini kullanacak şekilde dönüştür.
- Görünürlük zamanındaki ikincil `sessions.list({ spawnedBy })` aramalarını kaldır.

### Aşama 5: Eski Sezgiselleri Kaldır

Bir yayın penceresinden sonra:

- eski olmayan ACPX temizliği için saklanan kök komut dizelerine güvenmeyi bırak
- komut işaretleyici başlangıç taramalarını kaldır
- görünürlük yedek liste aramalarını kaldır
- eksik veya doğrulanamayan kiralamalar için savunmacı kapalı başarısız davranışı koru

## Testler

İki tablo güdümlü takım ekle.

Süreç yaşam döngüsü simülatörü:

- PID ilgisiz süreç tarafından yeniden kullanılır
- PID başka bir Gateway'in sarmalayıcı kökü tarafından yeniden kullanılır
- saklanan sarmalayıcı komutu kabuk tırnaklıdır, canlı `ps` komutu değildir
- adaptör alt süreci çıkar, torun süreç süreç grubunda kalır
- üst süreç ölümü SIGTERM yedeği SIGKILL'e ulaşır
- süreç listeleme kullanılamaz
- eksik süreç içeren bayat kiralama
- sarmalayıcı, adaptör alt süreci ve torun süreç içeren başlangıç yetimi

Oturum görünürlüğü matrisi:

- `self`, `tree`, `agent`, `all`
- a2a etkin ve devre dışı
- aynı aracı satırı
- çapraz aracı satırı
- istek sahibi tarafından sahiplenilen oluşturulmuş çapraz aracı ACP satırı
- korumalı alandaki istek sahibi `tree` ile sınırlandırılır
- liste, geçmiş, gönderme ve durum eylemleri

Önemli değişmez: istek sahibi tarafından sahiplenilen oluşturulmuş bir alt oturum,
yapılandırılmış görünürlüğün istek sahibi oturum ağacını içerdiği her yerde görünürdür
ve `all`, `tree` görünürlüğünden daha az yetenekli değildir.

## Uyumluluk Notları

Eski oturum kayıtlarında `leaseId` olmayabilir. Eski kapalı başarısız temizlik yolunu kullanmalıdırlar:

- canlı bir kök süreç gerektir
- oluşturulan bir sarmalayıcı bekleniyorsa sarmalayıcı kökü sahipliği gerektir
- sarmalayıcı olmayan kökler için komut uyuşması gerektir
- asla yalnızca bayat saklanan PID meta verilerine dayanarak sinyal gönderme

Eski bir kayıt doğrulanamazsa ona dokunma. Başlangıç kiralama temizliği ve
sonraki yayın penceresi yedeği zamanla kullanımdan kaldırmalıdır.

## Başarı Ölçütleri

- Eski veya bayat bir ACPX oturumunu kapatmak başka bir Gateway'in sürecini öldüremez.
- Üst süreç ölümü inatçı adaptör torun süreçlerini çalışır halde bırakmaz.
- `cancel`, yeniden kullanılabilir oturumları kapatmadan etkin turu iptal eder.
- `sessions_list`, istek sahibi tarafından sahiplenilen çapraz aracı ACP alt oturumlarını hem `tree` hem de `all` altında gösterebilir.
- Başlangıç temizliği geniş komut dizesi taramalarıyla değil, kiralamalarla yürütülür.
- Odaklanmış süreç ve görünürlük matrisi testleri, daha önce tek seferlik inceleme düzeltmeleri gerektiren her uç durumu kapsar.
