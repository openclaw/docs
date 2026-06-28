---
read_when:
    - Dosya erişimini, arşiv çıkarmayı, çalışma alanı depolamasını veya Plugin dosya sistemi yardımcılarını değiştirme
summary: OpenClaw yerel dosya erişimini nasıl güvenli şekilde işler ve isteğe bağlı fs-safe Python yardımcısının neden varsayılan olarak kapalı olduğu
title: Güvenli dosya işlemleri
x-i18n:
    generated_at: "2026-05-06T09:15:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw, güvenlik açısından hassas yerel dosya işlemleri için [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) kullanır: kökle sınırlandırılmış okuma/yazma, atomik değiştirme, arşiv çıkarma, geçici çalışma alanları, JSON durumu ve gizli dosya işleme.

Amaç, güvenilmeyen yol adları alan güvenilir OpenClaw kodu için tutarlı bir **kütüphane koruma hattı** sağlamaktır. Bu bir sandbox değildir. Ana makine dosya sistemi izinleri, işletim sistemi kullanıcıları, kapsayıcılar ve ajan/araç ilkesi gerçek etki alanını hâlâ belirler.

## Varsayılan: Python yardımcısı yok

OpenClaw, fs-safe POSIX Python yardımcısını varsayılan olarak **kapalı** tutar.

Neden:

- gateway, bir operatör bunu açıkça seçmedikçe kalıcı bir Python yardımcı süreci başlatmamalıdır;
- birçok kurulum ek üst dizin mutasyon sertleştirmesine ihtiyaç duymaz;
- Python'ı devre dışı bırakmak, paket/çalışma zamanı davranışını masaüstü, Docker, CI ve paketlenmiş uygulama ortamlarında daha öngörülebilir tutar.

OpenClaw yalnızca varsayılanı değiştirir. Bir modu açıkça ayarlarsanız fs-safe buna uyar:

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Genel fs-safe adları da çalışır: `FS_SAFE_PYTHON_MODE` ve `FS_SAFE_PYTHON`.

## Python olmadan korunanlar

Yardımcı kapalıyken OpenClaw, fs-safe'in Node yollarını hâlâ şunlar için kullanır:

- yalnızca adlara izin verilen yerlerde `..` gibi göreli yol kaçışlarını, mutlak yolları ve yol ayırıcılarını reddetme;
- işlemleri geçici `path.resolve(...).startsWith(...)` denetimleri yerine güvenilir bir kök tanıtıcısı üzerinden çözme;
- bu ilkeyi gerektiren API'lerde sembolik bağlantı ve sabit bağlantı kalıplarını reddetme;
- API'nin dosya içerikleri döndürdüğü veya tükettiği yerlerde kimlik denetimleriyle dosya açma;
- durum/yapılandırma dosyaları için atomik kardeş geçici dosya yazımları;
- okuma ve arşiv çıkarma için bayt sınırları;
- API'nin gerektirdiği yerlerde gizli bilgiler ve durum dosyaları için özel kipler.

Bu korumalar normal OpenClaw tehdit modelini kapsar: tek bir güvenilir operatör sınırı içinde güvenilmeyen model/Plugin/kanal yol girdisini işleyen güvenilir gateway kodu.

## Python'ın ekledikleri

POSIX üzerinde fs-safe'in isteğe bağlı yardımcısı, kalıcı bir Python sürecini açık tutar ve yeniden adlandırma, kaldırma, mkdir, stat/list ve bazı yazma yolları gibi üst dizin mutasyonları için fd-göreli dosya sistemi işlemleri kullanır.

Bu, başka bir sürecin doğrulama ile mutasyon arasında bir üst dizini değiştirebildiği aynı UID yarış pencerelerini daraltır. Güvenilmeyen yerel süreçlerin OpenClaw'ın üzerinde çalıştığı aynı dizinleri değiştirebildiği ana makineler için derinlemesine savunmadır.

Dağıtımınızda bu risk varsa ve Python'ın mevcut olması garanti ediliyorsa şunu kullanın:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

Yardımcı güvenlik duruşunuzun bir parçasıysa `auto` yerine `require` kullanın; `auto`, yardımcı kullanılamadığında bilinçli olarak yalnızca Node davranışına geri döner.

## Plugin ve çekirdek rehberi

- Plugin'e dönük dosya erişimi, bir yol mesajdan, model çıktısından, yapılandırmadan veya Plugin girdisinden geldiğinde ham `fs` yerine `openclaw/plugin-sdk/*` yardımcıları üzerinden yapılmalıdır.
- Çekirdek kod, OpenClaw'ın süreç ilkesinin tutarlı şekilde uygulanması için `src/infra/*` altındaki yerel fs-safe sarmalayıcılarını kullanmalıdır.
- Arşiv çıkarma, açık boyut, girdi sayısı, bağlantı ve hedef sınırlarıyla fs-safe arşiv yardımcılarını kullanmalıdır.
- Gizli bilgiler, OpenClaw gizli bilgi yardımcılarını veya fs-safe gizli/özel durum yardımcılarını kullanmalıdır; `fs.writeFile` etrafında kip denetimlerini elle yazmayın.
- Düşmanca yerel kullanıcı yalıtımına ihtiyacınız varsa yalnızca fs-safe'e güvenmeyin. Ayrı işletim sistemi kullanıcıları/ana makineleri altında ayrı gateway'ler çalıştırın veya sandboxing kullanın.

İlgili: [Güvenlik](/tr/gateway/security), [Sandboxing](/tr/gateway/sandboxing), [Exec onayları](/tr/tools/exec-approvals), [Gizli Bilgiler](/tr/gateway/secrets).
