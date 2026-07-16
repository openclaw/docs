---
read_when:
    - Gateway tarafından başlatılan bulut çalışanlarını işletme veya hata ayıklama
    - Çalışan kabulünü, oturum atamasını veya yerel araç yalıtımını doğrulama
summary: Kısıtlı bulut worker çalışma zamanı için dahili operatör başvuru kaynağı
title: Çalışan
x-i18n:
    generated_at: "2026-07-16T17:18:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6591eb66c201a56e60638ce832c569b030d2d4a01b984d577e0ea44c10a0fa5e
    source_path: cli/worker.md
    workflow: 16
---

# `openclaw worker`

`openclaw worker`, bir bulut çalışanı orkestratörünün hazırlanmış bir çalışan ortamında başlatması için kısıtlı çalışma zamanı giriş noktasıdır. Elle çalışan kaydı için genel amaçlı bir komut değildir.

Gateway, eşleşen OpenClaw paketini yükler ve ana makine anahtarı sabitlenmiş ters SSH tünelini açar. Çalışan başlatıcısı bu komutu hazırlanmış bir atamayla başlatır. Komut, tünel üzerinden yönlendirilen yerel soket aracılığıyla bağlanır ve özel `worker` rolüyle kabul edilir.

## Başlatma sözleşmesi

Komut, standart girdiden tam olarak bir adet sınırlandırılmış JSON başlatma zarfı okur. Zarf; yerel soket konumunu, oluşturulan çalışan kimlik bilgisini, paket ve protokol kimliğini, sahip dönemini ve atanmış tek oturum ile turu taşır. Kimlik bilgisi hiçbir zaman komut satırı bağımsız değişkenleri üzerinden kabul edilmez ve bu sayfa kasıtlı olarak herhangi bir kimlik bilgisi veya elle yazılmış zarf örneği sunmaz.

Zarf geçersizse, kimlik bilgisi reddedilirse, paket ya da protokol özellikleri eşleşmezse veya oturum ile sahip dönemi artık güncel değilse kabul güvenli biçimde başarısız olur. Operatörler bu giriş noktasını doğrudan çağırmak yerine çalışanları bulut çalışanı orkestratörü üzerinden başlatmalıdır.

## Çalışma zamanı sınırı

İşlem, kısıtlı bir arka uçla normal gömülü aracı döngüsünü çalıştırır:

- `read`, `write`, `edit`, `apply_patch`, `exec` ve `process` kodlama araçları
  çalışan çalışma alanında yerel olarak çalışır.
- Model çağrıları Gateway çıkarım proxy'sini kullanır. Hiçbir yerel model kimlik doğrulama profili
  yüklenmez.
- Transkript yazımları Gateway transkript kaydetme RPC'sini kullanır.
- Akış ve araç yaşam döngüsü güncellemeleri Gateway canlı olay RPC'sini kullanır.
- Yalnızca atanmış oturum ve tur kabul edilir.

Çalışan modu; atanmış oturum araç kümesinin ötesinde kanalları, Gateway HTTP yüzeylerini veya Plugin otomatik başlatmasını başlatmaz. Tek kullanımlık bir durum dizini kullanır ve kalıcı sağlayıcı veya forge kimlik bilgilerine sahip değildir.

Çalışandan çalışana oturum gönderimi bu modda sunulmaz. Yerleştirme ve gönderim Gateway'in sahipliğinde kalır: Bir operatör mevcut, yerel ve yönetilen çalışma ağacı oturumunu Gateway üzerinden gönderebilir; ancak bir çalışan işlemi kendisini veya başka bir çalışanı gönderemez.

Hazırlanmış atama; transkript bağlamını, kabul edilen temel yaprağı, kaydetme sırasını ve canlı olay imlecini taşır. Tünel yeniden bağlandığında işlem aynı kimlik bilgisi ve sahip dönemiyle yeniden kabul edilir, kabul edilen transkript tabanını korur, onaylanmamış canlı olay kuyruğunun sonunu yeniden oynatır ve devam eden bir çıkarım turuna aynı kimlikle yeniden bağlanır. Akış deltaları kaçırılmışsa son çıkarım iletisi yetkili kaynaktır. Öncekini geçersiz kılan bir sahip dönemi işlemi sınırlar ve düzgün biçimde çıkmasına neden olur.

Bir `stale-base-leaf` transkript reddi, mevcut çalıştırmayı hatada durdurur. Çalışan modu reddedilen sırayı farklı bir yaprağa karşı yeniden denemez; dolayısıyla yinelenen kayıt oluşturulmaz ve bu çalıştırmadan bellekte kalan, henüz kaydedilmemiş son bölüm kaybolur. Yeniden başlatma, Gateway'in yetkili transkriptinden ve kayıt defterinden yeni bir atama oluşturması gereken kilometre taşı 3 yerleştirme sahibine aittir. Benzer şekilde, Gateway işleminin yeniden başlatılması bekleyen bir çıkarım turunu sağlayıcı hatasıyla sonlandırır; etkin ve aynı işleme ait bir çıkarım akışına yalnızca tünel veya çalışan WebSocket yeniden bağlantısı tekrar bağlanabilir.

Kapalı çalışan RPC yüzeyi için [Gateway protokolü](/tr/gateway/protocol#worker-role-and-closed-protocol), mimari ve güvenlik modeli için [Bulut çalışanları planı](/tr/plan/cloud-workers) bölümüne bakın.
