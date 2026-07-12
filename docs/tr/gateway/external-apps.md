---
read_when:
    - OpenClaw ile iletişim kuran harici bir uygulama, betik, gösterge paneli, CI işi veya IDE uzantısı geliştiriyorsunuz
    - Gateway RPC ile Plugin SDK arasında seçim yapıyorsunuz
    - Gateway temsilci çalıştırmaları, oturumları, olayları, onayları, modelleri veya araçlarıyla entegrasyon yapıyorsunuz
    - Bir barındırma denetleyicisini harici bir uyandırma zamanlayıcısıyla eşleştiriyorsunuz
sidebarTitle: External apps
summary: Harici uygulamalar, betikler, panolar, CI işleri ve IDE uzantıları için mevcut entegrasyon yolu
title: Harici uygulamalar için Gateway entegrasyonları
x-i18n:
    generated_at: "2026-07-12T11:44:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

Harici uygulamalar OpenClaw ile Gateway protokolü üzerinden iletişim kurar: WebSocket
aktarımı ve RPC yöntemleri. Bir betik, pano, CI işi, IDE
uzantısı veya başka bir süreç agent çalıştırmalarını başlatmak, olay akışını izlemek, sonuçları
beklemek, çalışmayı iptal etmek ya da Gateway kaynaklarını incelemek istediğinde bunu kullanın.

<Warning>
  Henüz genel kullanıma açık bir npm istemci paketi yoktur. Sürüm notlarında yayımlanmış
  bir paket duyurulana ve bu sayfada kurulum talimatları yer alana kadar OpenClaw istemci
  paketi adlarını uygulama bağımlılıklarına eklemeyin.
</Warning>

<Note>
  Bu sayfa, OpenClaw sürecinin dışındaki kodlara yöneliktir. OpenClaw içinde çalışan
  Plugin kodu bunun yerine belgelenmiş `openclaw/plugin-sdk/*` alt yollarını kullanmalıdır.
</Note>

## Bugün kullanılabilenler

| Yüzey                                   | Durum | Kullanım amacı                                                                                         |
| --------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------ |
| [Gateway protokolü](/tr/gateway/protocol)  | Hazır | WebSocket aktarımı, bağlantı el sıkışması, kimlik doğrulama kapsamları, protokol sürümleme ve olaylar. |
| [Gateway RPC referansı](/tr/reference/rpc) | Hazır | Agent'lar, oturumlar, görevler, modeller, araçlar, yapıtlar ve onaylar için güncel Gateway yöntemleri. |
| [`openclaw agent`](/tr/cli/agent)          | Hazır | CLI'ı kabuk üzerinden çağırmanın yeterli olduğu tek seferlik betik entegrasyonu.                       |
| [`openclaw message`](/tr/cli/message)      | Hazır | Betiklerden mesaj veya kanal eylemleri gönderme.                                                       |

Gelecekte sunulacak bir istemci kitaplığı paketi üzerinde kurum içinde çalışılmaktadır ancak bu paket
henüz genel kullanıma açık bir kurulum yüzeyi değildir. Bir sürümde yayımlanmış, sürümlendirilmiş
bir paket duyurulana kadar bunu önizleme uygulama ayrıntısı olarak değerlendirin.

## Önerilen yol

1. Bir Gateway çalıştırın veya keşfedin.
2. [Gateway protokolü](/tr/gateway/protocol) üzerinden bağlanın.
3. [Gateway RPC referansındaki](/tr/reference/rpc) belgelenmiş RPC yöntemlerini çağırın.
4. Test ettiğiniz OpenClaw sürümünü sabitleyin.
5. OpenClaw sürümünü yükseltirken RPC referansını yeniden kontrol edin.

Agent çalıştırmaları için `agent` RPC'siyle başlayın ve nihai sonucu almak üzere bunu
`agent.wait` ile eşleştirin. Kalıcı konuşma durumu için `sessions.*` yöntemlerini kullanın.
Kullanıcı arayüzü entegrasyonları için Gateway olaylarına abone olun ve yalnızca uygulamanızın
anladığı olay ailelerini işleyip görüntüleyin.

## İş birliğine dayalı ana makine askıya alma

Çalışan bir süreci donduran veya anlık görüntüsünü alan barındırma denetleyicileri,
ana makineden bağımsız askıya alma el sıkışmasını kullanabilir:

1. Ana makinenin denetlediği harici girişleri kabul etmeyi durdurun.
2. Kararlı ve benzersiz bir `requestId` ile `gateway.suspend.prepare` çağrısı yapın.
3. Yanıt `busy` ise süreci çalışır durumda tutun ve daha sonra yeniden deneyin.
4. Yanıt `ready` ise döndürülen `suspensionId` değerini kaydedin, ardından süreci
   `expiresAtMs` zamanından önce dondurun veya anlık görüntüsünü alın.
5. Çözme işleminden sonra veya askıya almaktan vazgeçilirse mevcut WebSocket ya da
   Admin HTTP denetim yolu üzerinden bu `suspensionId` ile `gateway.suspend.resume`
   çağrısı yapın.

Hazırlanmış bir Gateway, yeni WebSocket el sıkışmalarını reddeder. Bir WebSocket denetleyicisi,
ana makine işlemi boyunca kimliği doğrulanmış bağlantısını açık tutmalıdır. Bu
garanti edilemiyorsa hazırlıktan önce
[Admin HTTP RPC Plugin'ini](/tr/plugins/admin-http-rpc) etkinleştirip kullanın. Denetim
yolu kaybolursa yeniden bağlanmadan önce iki dakikalık kira süresinin dolmasını
bekleyin; süre dolduğunda kabul otomatik olarak yeniden açılır.

RPC sözleşmesi şöyledir:

- `gateway.suspend.prepare` — `operator.admin`; parametreler
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; parametreler
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; parametreler
  `{ "suspensionId": "id-from-prepare" }`

Kimliklerin başındaki ve sonundaki boşluklar kırpılır, en az bir boşluk olmayan karakter
içermeleri gerekir ve uzunlukları 128 karakterle sınırlıdır. Meşgul hazırlık sonucu
`status: "busy"`, `reason`, `retryAfterMs`, `activeCount` ve `blockers` alanlarını içerir.
Hazır sonucu şu biçimdedir:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

Durum çağrısı `{"status":"running"}` veya `expiresAtMs` içeren bir hazır sonucu döndürür.
Sürdürme çağrısı `{"ok":true,"status":"running","resumed":true}` döndürür; başarılı bir
sürdürme işleminden sonra çağrının yinelenmesi `resumed: false` döndürür.

Çakışan bir istek kimliği veya geçici zamanlayıcı sürdürme hatası, `retryAfterMs`
ile yeniden denenebilir `UNAVAILABLE` hatası döndürür. Zamanlayıcı kurtarılırken hazırlık,
durum ve sürdürme çağrılarının tümü bu hatayı döndürür; Gateway hazır olmayan ve
kapalı hata verme durumunda kalır ve ana makine onu dondurmamalı veya anlık görüntüsünü
almamalıdır. OpenClaw zamanlayıcıyı otomatik olarak yeniden dener ve kabulü yalnızca
kurtarma başarılı olduktan sonra yeniden açar. Eşleşmeyen bir sürdürme kimliği
`INVALID_REQUEST` döndürür. Hazırlık, Gateway'in dakikada üç denemelik denetim düzlemi
yazma bütçesini paylaşır; döndürülen yeniden deneme gecikmesine uyun. WebSocket istemcileri
cihaz ve IP'ye göre gruplandırılır. Admin HTTP denetleyicileri çözümlenen istemci IP'sine
göre gruplandırılır; dolayısıyla tek bir proxy arkasındaki denetleyiciler aynı bütçeyi
paylaşabilir.

Hazırlık yalnızca reddetmeye yöneliktir: OpenClaw yeni kök/oturum/komut kabulünü kapatır,
otomatik cron vuruşlarını duraklatır ve çalışmaları eşzamanlı olarak inceler. Etkin bir
şey varsa `busy` döndürmeden önce zamanlayıcıyı sürdürür ve kabulü yeniden açar;
bu çalışmayı kesintiye uğratmaz veya boşaltmaz. Hazır kirası iki dakika sürer. Aynı
`requestId` ile `prepare` çağrısını yinelemek kirayı yeniler; süre dolduğunda kabul
yeniden açılmadan önce zamanlayıcı sürdürülür.
Hazır kira sırasında zamanı gelen yeniden başlatma yayımı, kira sürdürülene kadar bekler;
devam eden bir yeniden başlatma, hazırlığın `busy` döndürmesine neden olur.

Hazır durumdayken `/healthz` çalışır durumda kalır ve `/readyz`, `503` döndürür. Yerel veya
kimliği doğrulanmış hazır olma yanıtları `gateway-draining` içerir; kimliği doğrulanmamış
uzak yoklamalar yalnızca `{ "ready": false }` alır. HTTP sağlık yoklaması, mevcut WebSocket
bağlantılarındaki askıya alma yöntemleri ve önceden etkinleştirilmiş bir Admin HTTP RPC
rotası kullanılabilir durumda kalır. Diğer RPC'ler yeniden denenebilir `UNAVAILABLE`
döndürür. OpenAI uyumlu API'ler, araç/oturum işlemleri, node izlemeleri ve yapılandırılmış
hook'lar dâhil yerleşik HTTP kullanıcı işi rotaları ve sıradan Plugin HTTP rotaları,
`error.code: "gateway_unavailable"` ile `503` döndürür. Plugin'e ait yeni WebSocket
yükseltmeleri de `503` döndürür; bu, kurulmuş bir Plugin soketi üzerinden daha sonra
gerçekleştirilen çalışmayı değil, yükseltme sahipliğini kapsar.

Bu el sıkışma, gelen mesajları kalıcılaştırmaz, üçüncü taraf kanal aktarımlarını durdurmaz
veya barındırma platformunu denetlemez. Ana makine hazırlıktan önce girişini sınırlandırmalı;
uyandırma, anlık görüntü alma/dondurma ve durdurma işlemlerinden sorumlu olmaya devam
etmelidir. `activeCount`, izlenen toplam çalışma sayısıdır; `blockers` ise sıfır olmayan
kategori sayılarını ve sınırlandırılmış görev ayrıntılarını içerir. Bu, genel bir süreç
durağanlığı bariyeri değildir. Bir `background-exec` engelleyicisi yalnızca toplu bilgi
içerir: komut metni, süreç kimlikleri, çıktı ve oturum veya kapsam tanımlayıcıları hiçbir
zaman protokol üzerinden aktarılmaz. Kanal sağlığı, bakım, önbellek yenileme, kurulmuş
Plugin WebSocket oturumları ve kaydedilmemiş Plugin'e ait arka plan çalışmaları etkin
kalmaya devam edebilir.
Barındırma platformu, süreç ağacının tamamını ve dosya sistemini tutarlı biçimde dondurmalı
veya anlık görüntüsünü almalıdır; bu ilk sözleşmeyle kaydedilmemiş çalışmaların boşta olduğu
kanıtlanamaz.

<Tip>
  Ana makine uyandırma zamanlaması için OpenClaw'a dönük kısmı süreç içi bir
  Plugin'de tutun ve idempotent tam anlık görüntüleri harici ana makine bağdaştırıcısına
  yansıtın. Barındırma denetleyicisi Plugin SDK'yı içe aktarmamalı veya cron
  durumunu olay değişimlerinden yeniden oluşturmamalıdır. Bkz. [Güvenli harici cron
  yansıtma](/tr/plugins/hooks#safe-external-cron-projection).
</Tip>

## Uygulama kodu ve Plugin kodu

Kod OpenClaw dışında bulunuyorsa Gateway RPC kullanın:

- Agent çalıştırmalarını başlatan veya gözlemleyen Node betikleri
- Bir Gateway'i çağıran CI işleri
- panolar ve yönetici panelleri
- IDE uzantıları
- kanal Plugin'lerine dönüşmesi gerekmeyen harici köprüler
- sahte veya gerçek Gateway aktarımlarıyla entegrasyon testleri

Kod OpenClaw içinde çalışıyorsa Plugin SDK'yı kullanın:

- sağlayıcı Plugin'leri
- kanal Plugin'leri
- araç veya yaşam döngüsü hook'ları
- agent çalıştırma altyapısı Plugin'leri
- güvenilir çalışma zamanı yardımcıları

Harici uygulamalar `openclaw/plugin-sdk/*` içe aktarmamalıdır; bu alt yollar
OpenClaw tarafından yüklenen Plugin'lere yöneliktir.

## İlgili konular

- [Gateway protokolü](/tr/gateway/protocol)
- [Gateway RPC referansı](/tr/reference/rpc)
- [CLI agent komutu](/tr/cli/agent)
- [CLI mesaj komutu](/tr/cli/message)
- [Agent döngüsü](/tr/concepts/agent-loop)
- [Agent çalışma zamanları](/tr/concepts/agent-runtimes)
- [Oturumlar](/tr/concepts/session)
- [Arka plan görevleri](/tr/automation/tasks)
- [ACP agent'ları](/tr/tools/acp-agents)
- [Plugin SDK'ya genel bakış](/tr/plugins/sdk-overview)
