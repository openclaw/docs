---
read_when:
    - Dosya erişimini, arşiv ayıklamayı, çalışma alanı depolamasını veya Plugin dosya sistemi yardımcılarını değiştirme
summary: OpenClaw yerel dosya erişimini nasıl güvenli bir şekilde yönetir ve isteğe bağlı fs-safe Python yardımcısı neden varsayılan olarak kapalıdır
title: Güvenli dosya işlemleri
x-i18n:
    generated_at: "2026-07-12T12:19:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw, güvenlik açısından hassas yerel dosya işlemleri için [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) kullanır: kök dizinle sınırlandırılmış okuma/yazma, atomik değiştirme, arşiv çıkarma, geçici çalışma alanları, JSON durumu ve gizli dosyaların işlenmesi.

Bu, güvenilmeyen yol adlarını alan güvenilir OpenClaw kodu için bir **kütüphane korumasıdır**; sandbox değildir. Gerçek etki alanını yine ana makinenin dosya sistemi izinleri, işletim sistemi kullanıcıları, konteynerler ve ajan/araç politikası belirler.

## Varsayılan: Python yardımcısı yok

OpenClaw, fs-safe POSIX Python yardımcısını varsayılan olarak **kapalı** ayarlar:

- bir operatör etkinleştirmediği sürece Gateway kalıcı bir Python yardımcı işlemi başlatmamalıdır;
- çoğu kurulum, üst dizin değişikliklerine yönelik ek sağlamlaştırmaya ihtiyaç duymaz;
- Python'ın devre dışı bırakılması; masaüstü, Docker, CI ve paketlenmiş uygulama ortamlarında çalışma zamanı davranışını öngörülebilir tutar.

OpenClaw yalnızca _varsayılanı_ değiştirir. Açıkça belirtilen bir ayar her zaman önceliklidir:

```bash
# Varsayılan OpenClaw davranışı: Yalnızca Node kullanan fs-safe geri dönüşleri.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Kullanılabiliyorsa yardımcıyı etkinleştir, kullanılamıyorsa geri dönüşü kullan.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Yardımcı başlatılamazsa güvenli biçimde başarısız ol.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# İsteğe bağlı açık yorumlayıcı yolu.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Genel fs-safe ortam değişkeni adları da kullanılabilir: `FS_SAFE_PYTHON_MODE` ve `FS_SAFE_PYTHON`.

Yardımcı güvenlik yaklaşımınızın bir parçasıysa `auto` yerine `require` kullanın; yardımcı başlatılamazsa `auto`, sessizce yalnızca Node kullanan davranışa geri döner.

## Python olmadan korunanlar

Yardımcı kapalıyken OpenClaw, fs-safe'in yalnızca Node kullanan korumalarından yararlanmaya devam eder:

- yalnızca yalın adlara izin verilen yerlerde göreli yol kaçışlarını (`..`), mutlak yolları ve yol ayırıcılarını reddeder;
- işlemleri geçici `path.resolve(...).startsWith(...)` denetimleri yerine güvenilir bir kök tanıtıcısı üzerinden çözümler;
- ilgili politikayı gerektiren API'lerde sembolik bağlantı ve sabit bağlantı kalıplarını reddeder;
- API'nin dosya içeriği döndürdüğü veya tükettiği durumlarda dosyaları kimlik denetimleriyle açar;
- durum/yapılandırma dosyalarını aynı dizinde geçici dosya oluşturup atomik olarak yeniden adlandırarak yazar;
- okuma ve arşiv çıkarma işlemlerinde bayt sınırlarını uygular;
- API gerektirdiğinde gizli bilgiler ve durum dosyaları için özel dosya kiplerini uygular.

Bu, OpenClaw'ın normal tehdit modelini kapsar: tek bir güvenilir operatör sınırı içinde güvenilmeyen model/Plugin/kanal yol girdilerini işleyen güvenilir Gateway kodu.

## Python ne ekler?

POSIX'te isteğe bağlı yardımcı, tek bir kalıcı Python işlemini çalışır durumda tutar ve üst dizin değişiklikleri için dosya tanıtıcısına göreli dosya sistemi işlemleri kullanır: yeniden adlandırma, kaldırma, dizin oluşturma, durum bilgisi alma/listeleme ve bazı yazma yolları.

Bu, başka bir işlemin doğrulama ile değişiklik arasında bir üst dizini değiştirebildiği aynı UID'li yarış koşulu aralıklarını daraltır. Güvenilmeyen yerel işlemlerin OpenClaw'ın üzerinde çalıştığı dizinleri değiştirebildiği ana makinelerde derinlemesine savunma sağlar.

Dağıtımınızda bu risk varsa ve Python'ın mevcut olacağı garanti ediliyorsa şunu ayarlayın:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Plugin ve çekirdek yönergeleri

- Bir yol mesajdan, model çıktısından, yapılandırmadan veya Plugin girdisinden geliyorsa Plugin'e yönelik dosya erişimi ham `fs` yerine `openclaw/plugin-sdk/*` yardımcıları üzerinden yapılmalıdır.
- OpenClaw'ın işlem politikasının tutarlı biçimde uygulanması için çekirdek kod, `src/infra/*` altındaki fs-safe sarmalayıcılarını kullanmalıdır.
- Arşiv çıkarma işlemleri; açık boyut, girdi sayısı, bağlantı ve hedef sınırlarıyla fs-safe arşiv yardımcılarını kullanmalıdır.
- Gizli bilgiler için OpenClaw gizli bilgi yardımcılarını veya fs-safe gizli/özel durum yardımcılarını kullanın; `fs.writeFile` çevresinde kendi kip denetimlerinizi oluşturmayın.
- Güvenilmeyen yerel kullanıcılara karşı yalıtım için yalnızca fs-safe'e güvenmeyin. Ayrı Gateway'leri farklı işletim sistemi kullanıcılarıyla veya ana makinelerde çalıştırın ya da sandbox kullanın.

İlgili: [Güvenlik](/tr/gateway/security), [Sandbox Kullanımı](/tr/gateway/sandboxing), [Çalıştırma onayları](/tr/tools/exec-approvals), [Gizli bilgiler](/tr/gateway/secrets).
