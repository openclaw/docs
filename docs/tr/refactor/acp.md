---
read_when:
    - ACP oturumu yaşam döngüsünü veya ACPX işlem temizliğini yeniden düzenleme
    - ACPX yetim süreçlerinde, PID yeniden kullanımında veya çoklu Gateway temizleme güvenliğinde hata ayıklama
    - Başlatılan ACP veya alt aracı oturumları için sessions_list görünürlüğünü değiştirme
    - Arka plan görevleri, ACP oturumları veya süreç kiralamaları için sahiplik meta verileri tasarlama
sidebarTitle: ACP lifecycle refactor
summary: ACP oturumu ve ACPX süreç sahipliğini açık hâle getirme geçiş planı
title: ACP yaşam döngüsü yeniden düzenlemesi
x-i18n:
    generated_at: "2026-07-12T12:11:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
---

ACP yaşam döngüsü şu anda çalışıyor, ancak bunun çok büyük bir bölümü olaydan sonra çıkarımla belirleniyor.
İşlem temizliği; sahipliği PID'lerden, komut dizelerinden, sarmalayıcı
yollarından ve canlı işlem tablosundan yeniden oluşturuyor. Oturum görünürlüğü ise sahipliği
oturum anahtarı dizelerinden ve ikincil `sessions.list({ spawnedBy })` aramalarından
yeniden oluşturuyor. Bu, dar kapsamlı düzeltmeleri mümkün kılıyor ancak uç durumların gözden kaçmasını da kolaylaştırıyor:
PID'nin yeniden kullanılması, tırnak içine alınmış komutlar, bağdaştırıcı alt süreçlerinin alt süreçleri, çoklu Gateway durum kökleri,
`cancel` ile `close` arasındaki fark ve `tree` ile `all` görünürlüğü, aynı sahiplik kurallarının
yeniden keşfedildiği ayrı noktalar hâline geliyor.

Bu yeniden düzenleme, sahipliği birinci sınıf bir kavram hâline getiriyor. Amaç yeni bir ACP ürün
yüzeyi oluşturmak değil; mevcut ACP ve ACPX davranışı için daha güvenli bir iç sözleşme sağlamaktır.

## Hedefler

- Temizlik, mevcut canlı kanıt OpenClaw'a ait bir kiralamayla eşleşmedikçe hiçbir işleme sinyal göndermez.
- `cancel`, `close` ve başlangıç temizliği birbirinden farklı yaşam döngüsü amaçlarına sahiptir.
- `sessions_list`, `sessions_history`, `sessions_send` ve durum denetimleri aynı
  istekte bulunanın sahip olduğu oturum modelini kullanır.
- Çoklu Gateway kurulumları birbirlerinin ACPX sarmalayıcılarını temizleyemez.
- Eski ACPX oturum kayıtları geçiş sırasında çalışmayı sürdürür.
- Çalışma zamanı Plugin'e ait kalır; çekirdek ACPX paket ayrıntılarını öğrenmez.

## Hedef dışı konular

- ACPX'i değiştirmek veya genel `/acp` komut yüzeyini değiştirmek.
- Tedarikçiye özgü ACP bağdaştırıcı davranışını çekirdeğe taşımak.
- Kullanıcıların yükseltmeden önce durumu elle temizlemesini zorunlu kılmak.
- `cancel` işleminin yeniden kullanılabilir ACP oturumlarını kapatmasını sağlamak.

## Hedef Model

### Gateway Örneği Kimliği

Her Gateway işlemi kararlı bir çalışma zamanı örnek kimliğine sahip olmalıdır:

```ts
type GatewayInstanceId = string;
```

Bu kimlik Gateway başlatılırken oluşturulabilir ve ilgili kurulumun ömrü boyunca durumda
kalıcı olarak saklanabilir. Bir güvenlik sırrı değildir; bir Gateway'in ACP işlemlerinin
başka bir Gateway'in işlemleriyle karıştırılmasını önlemek için kullanılan bir sahiplik ayırt edicisidir.

### ACP Oturum Sahipliği

Başlatılan her ACP oturumu normalleştirilmiş sahiplik meta verilerine sahip olmalıdır:

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

Gateway, bilindikleri durumlarda bu alanları oturum satırlarında döndürmelidir.
Görünürlük filtreleme, satır meta verileri üzerinde yapılan saf bir denetim olmalıdır:

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

Bu, görünürlük denetimlerindeki gizli ikincil `sessions.list({ spawnedBy })`
çağrılarını ortadan kaldırır. Başlatılmış, aracılar arası bir ACP alt oturumu, ikinci bir sorgu
onu tesadüfen bulduğu için değil, satır böyle belirttiği için istekte bulunana aittir.

### ACPX İşlem Kiralamaları

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

Sarmalayıcı işlemi, kiralama kimliğini ve Gateway örnek kimliğini kendi
ortamında almalıdır:

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

Platform izin verdiğinde doğrulama, komutların tırnaklanmasıyla karıştırılamayacak
canlı işlem meta verilerini tercih etmelidir:

- kök PID hâlâ mevcut
- canlı sarmalayıcı yolu `wrapperRoot` altındadır
- mevcut olduğunda işlem grubu kiralamayla eşleşir
- okunabildiğinde ortam beklenen kiralama kimliğini içerir
- komut karması veya yürütülebilir dosya yolu kiralamayla eşleşir

Canlı işlem doğrulanamıyorsa temizlik güvenli biçimde başarısız olur.

## Yaşam Döngüsü Denetleyicisi

İşlem kiralamalarının ve temizlik politikasının sahibi olan tek bir ACPX yaşam döngüsü
denetleyicisi ekleyin:

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

`cancelTurn` yalnızca turun iptal edilmesini ister. Yeniden kullanılabilir sarmalayıcı
veya bağdaştırıcı işlemlerini temizlememelidir.

`closeSession` temizlik yapabilir, ancak yalnızca oturum kaydını ve kiralamayı
yükledikten ve canlı işlem ağacının hâlâ bu kiralamaya ait olduğunu doğruladıktan sonra.

`reapStartupOrphans`, durumdaki açık kiralamalardan başlar. Alt süreçleri bulmak için işlem
tablosunu kullanabilir, ancak önce ACP'ye benzer rastgele komutları tarayıp ardından
bunların muhtemelen bize ait olduğuna karar vermemelidir.

## Sarmalayıcı Sözleşmesi

Oluşturulan sarmalayıcılar küçük kalmalıdır. Şunları yapmalıdır:

- desteklendiği yerlerde bağdaştırıcıyı bir işlem grubunda başlatmak
- normal sonlandırma sinyallerini işlem grubuna iletmek
- üst sürecin ölümünü algılamak
- üst süreç öldüğünde SIGTERM göndermek, ardından SIGKILL yedek mekanizması
  çalışana kadar sarmalayıcıyı canlı tutmak
- kullanılabildiğinde kök PID'yi ve işlem grubu kimliğini yaşam döngüsü denetleyicisine
  geri bildirmek

Sarmalayıcılar oturum politikasına karar vermemelidir. Yalnızca kendi bağdaştırıcı grupları
için yerel işlem ağacı temizliğini uygularlar.

## Oturum Görünürlüğü Sözleşmesi

Görünürlük, normalleştirilmiş satır sahipliğini kullanmalıdır:

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

- `self`: yalnızca istekte bulunan oturum.
- `tree`: istekte bulunan oturum ile istekte bulunana ait veya ondan başlatılmış satırlar.
- `all`: aynı aracıya ait tüm satırlar, a2a tarafından izin verilen aracılar arası satırlar ve genel a2a devre dışı olsa bile istekte bulunana ait
  başlatılmış aracılar arası satırlar.
- `agent`: açık bir sahiplik ilişkisi satırın istekte bulunana ait olduğunu belirtmediği sürece yalnızca aynı aracı.

Bu, `tree` ve `all` değerlerini monoton hâle getirir: `all`, `tree` tarafından gösterilecek
sahip olunan bir alt oturumu gizlememelidir.

## Geçiş Planı

### Aşama 1: Kimlik ve Kiralamaları Ekleyin

- Gateway durumuna `gatewayInstanceId` ekleyin.
- ACPX durum dizini altına bir ACPX kiralama deposu ekleyin.
- Oluşturulan bir sarmalayıcı başlatılmadan önce kiralamayı yazın.
- Yeni ACPX oturum kayıtlarında `leaseId` saklayın.
- Eski kayıtlar için mevcut PID ve komut alanlarını koruyun.

### Aşama 2: Önce Kiralamaya Dayalı Temizlik

- Kapatma temizliğini önce `leaseId` yükleyecek şekilde değiştirin.
- Sinyal göndermeden önce canlı işlem sahipliğini kiralamaya göre doğrulayın.
- Mevcut kök PID ve sarmalayıcı kökü yedek yolunu yalnızca eski kayıtlar için koruyun.
- Doğrulanmış temizlikten sonra kiralamaları `closed` olarak işaretleyin.
- İşlem temizlikten önce kaybolduğunda kiralamaları `lost` olarak işaretleyin.

### Aşama 3: Önce Kiralamaya Dayalı Başlangıç Temizliği

- Başlangıç temizliği açık kiralamaları tarar.
- Her kiralama için kök işlemi doğrulayın ve alt süreçleri toplayın.
- Doğrulanmış ağaçları alt süreçlerden başlayarak temizleyin.
- Eski `closed` ve `lost` kiralamaları sınırlı bir saklama aralığıyla zaman aşımına uğratın.
- Komut işaretçisi taramasını yalnızca geçici bir eski sistem yedek yolu olarak tutun ve mümkün olduğunda
  sarmalayıcı kökü ile Gateway örneği üzerinden koruyun.

### Aşama 4: Oturum Sahipliği Satırları

- Gateway oturum satırlarına sahiplik meta verileri ekleyin.
- ACPX, alt aracı, arka plan görevi ve oturum deposu yazıcılarının
  `ownerSessionKey` veya `spawnedBy` alanını doldurmasını sağlayın.
- Oturum görünürlüğü denetimlerini satır meta verilerini kullanacak şekilde dönüştürün.
- Görünürlük sırasında yapılan ikincil `sessions.list({ spawnedBy })` aramalarını kaldırın.

### Aşama 5: Eski Sezgisel Yöntemleri Kaldırın

Bir sürüm aralığından sonra:

- eski olmayan ACPX temizliği için saklanan kök komut dizelerine güvenmeyi bırakın
- komut işaretçisi başlangıç taramalarını kaldırın
- görünürlük yedek liste aramalarını kaldırın
- eksik veya doğrulanamayan kiralamalar için koruyucu, güvenli biçimde başarısız olma davranışını sürdürün

## Testler

Tablo güdümlü iki test paketi ekleyin.

İşlem yaşam döngüsü simülatörü:

- PID ilgisiz bir işlem tarafından yeniden kullanılmış
- PID başka bir Gateway'in sarmalayıcı kökü tarafından yeniden kullanılmış
- saklanan sarmalayıcı komutu kabuk tarafından tırnaklanmış, canlı `ps` komutu tırnaklanmamış
- bağdaştırıcı alt süreci çıkmış, onun alt süreci işlem grubunda kalmış
- üst süreç ölümü için SIGTERM yedek mekanizması SIGKILL'e ulaşmış
- işlem listesi kullanılamıyor
- işlemi eksik, güncelliğini yitirmiş kiralama
- sarmalayıcı, bağdaştırıcı alt süreci ve onun alt sürecini içeren başlangıç yetimi

Oturum görünürlüğü matrisi:

- `self`, `tree`, `agent`, `all`
- a2a etkin ve devre dışı
- aynı aracıya ait satır
- aracılar arası satır
- istekte bulunana ait, başlatılmış aracılar arası ACP satırı
- korumalı alandaki istekte bulunanın görünürlüğü `tree` ile sınırlandırılmış
- listeleme, geçmiş, gönderme ve durum eylemleri

Önemli değişmez: istekte bulunana ait başlatılmış bir alt oturum, yapılandırılmış görünürlüğün
istekte bulunanın oturum ağacını kapsadığı her yerde görünürdür ve `all`, `tree` değerinden
daha az yetenekli değildir.

## Uyumluluk Notları

Eski oturum kayıtlarında `leaseId` bulunmayabilir. Bunlar eski, güvenli biçimde başarısız olan
temizlik yolunu kullanmalıdır:

- canlı bir kök işlem gerektir
- oluşturulmuş bir sarmalayıcı beklendiğinde sarmalayıcı kökü sahipliğini gerektir
- sarmalayıcı olmayan kökler için komut uyumunu gerektir
- yalnızca güncelliğini yitirmiş, saklanan PID meta verilerine dayanarak asla sinyal gönderme

Eski bir kayıt doğrulanamıyorsa onu olduğu gibi bırakın. Başlangıç kiralama temizliği ve
sonraki sürüm aralığı, yedek yolu eninde sonunda kullanımdan kaldırmalıdır.

## Başarı Ölçütleri

- Eski veya güncelliğini yitirmiş bir ACPX oturumunun kapatılması başka bir Gateway'in işlemini sonlandıramaz.
- Üst sürecin ölümü, dirençli bağdaştırıcı alt süreçlerinin alt süreçlerini çalışır durumda bırakmaz.
- `cancel`, yeniden kullanılabilir oturumları kapatmadan etkin turu iptal eder.
- `sessions_list`, istekte bulunana ait aracılar arası ACP alt oturumlarını hem
  `tree` hem de `all` altında gösterebilir.
- Başlangıç temizliği geniş kapsamlı komut dizesi taramalarıyla değil, kiralamalarla yönlendirilir.
- Odaklanmış işlem ve görünürlük matrisi testleri, daha önce tek seferlik inceleme
  düzeltmeleri gerektiren tüm uç durumları kapsar.
