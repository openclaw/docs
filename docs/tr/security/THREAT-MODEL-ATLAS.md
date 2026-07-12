---
read_when:
    - Güvenlik duruşunu veya tehdit senaryolarını inceleme
    - Güvenlik özellikleri veya denetim yanıtları üzerinde çalışma
summary: MITRE ATLAS çerçevesiyle eşleştirilmiş OpenClaw tehdit modeli
title: Tehdit modeli (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-12T12:48:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Sürüm:** 1.0-taslak | **Çerçeve:** [MITRE ATLAS](https://atlas.mitre.org/) (Yapay Zekâ Sistemleri için Düşmanca Tehdit Ortamı) + veri akış diyagramları

Bu tehdit modeli, OpenClaw yapay zekâ ajan platformuna ve ClawHub Skills pazarına yönelik düşmanca tehditleri belgeler. OpenClaw topluluğu tarafından sürdürülen, sürekli güncellenen bir belgedir. Yeni tehditleri bildirme, saldırı zincirleri önerme veya risk azaltma önlemleri sunma hakkında bilgi için [Tehdit modeline katkıda bulunma](/tr/security/CONTRIBUTING-THREAT-MODEL) sayfasına bakın.

**Temel ATLAS kaynakları:** [Teknikler](https://atlas.mitre.org/techniques/) | [Taktikler](https://atlas.mitre.org/tactics/) | [Vaka çalışmaları](https://atlas.mitre.org/studies/) | [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data) | [ATLAS'a katkıda bulunma](https://atlas.mitre.org/resources/contribute)

---

## 1. Kapsam

| Bileşen                   | Dahil   | Notlar                                                   |
| ------------------------- | ------- | -------------------------------------------------------- |
| OpenClaw ajan çalışma zamanı | Evet | Temel ajan yürütme, araç çağrıları, oturumlar             |
| Gateway                   | Evet    | Kimlik doğrulama, yönlendirme, kanal entegrasyonu         |
| Kanal entegrasyonları     | Evet    | WhatsApp, Telegram, Discord, Signal, Slack vb.            |
| ClawHub pazarı            | Evet    | Skills yayımlama, moderasyon, dağıtım                     |
| MCP sunucuları            | Evet    | Haricî araç sağlayıcıları                                 |
| Kullanıcı cihazları       | Kısmen  | Mobil uygulamalar, masaüstü istemcileri                   |

Kapsam dışı bildirimler ve yanlış pozitif örüntüleri (genel internete açık olma, bir sınır aşımı olmaksızın yalnızca istem enjeksiyonuna dayalı zincirler, karşılıklı olarak güvenilmeyen operatörlerin tek bir gateway ana makinesini paylaşması ve diğerleri) [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md) dosyasında sıralanmıştır; güvenlik açığı bildirim kapsamı için güncel ve esas kaynak bu sayfa değil, söz konusu dosyadır.

## 2. Sistem mimarisi

### 2.1 Güven sınırları

```text
┌─────────────────────────────────────────────────────────────────┐
│                    GÜVENİLMEYEN BÖLGE                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GÜVEN SINIRI 1: Kanal Erişimi                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Cihaz eşleştirme (1 sa. DM / 5 dk. node eşleştirme TTL)│   │
│  │  • AllowFrom / izin listesi doğrulaması                   │   │
│  │  • Token / parola / Tailscale kimlik doğrulaması          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GÜVEN SINIRI 2: Oturum Yalıtımı                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AJAN OTURUMLARI                         │
│  │  • Oturum anahtarı = agent:channel:peer                  │
│  │  • Ajan başına araç politikaları                          │
│  │  • Konuşma dökümü günlüğü                                 │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GÜVEN SINIRI 3: Araç Yürütme                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  YÜRÜTME KUM HAVUZU                       │
│  │  • Docker kum havuzu (varsayılan) veya ana makine        │   │
│  │    (yürütme onayları)                                    │   │
│  │  • Node uzaktan yürütme                                   │   │
│  │  • SSRF koruması (DNS sabitleme + IP engelleme)           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GÜVEN SINIRI 4: Haricî İçerik                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          GETİRİLEN URL'LER / E-POSTALAR / WEBHOOK'LAR     │   │
│  │  • Haricî içerik sarmalama (rastgele sınırlı XML etiketleri)│ │
│  │  • Güvenlik bildirimi ekleme                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 GÜVEN SINIRI 5: Tedarik Zinciri                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skills yayımlama (semver, SKILL.md zorunlu)            │   │
│  │  • Statik örüntü + AST'ye yakın moderasyon taraması       │   │
│  │  • LLM tabanlı ajansal risk incelemesi + VirusTotal taraması│ │
│  │  • GitHub hesap yaşı doğrulaması (14 gün)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Veri akışları

| Akış | Kaynak  | Hedef    | Veri                 | Koruma                   |
| ---- | ------- | -------- | -------------------- | ------------------------ |
| F1   | Kanal   | Gateway  | Kullanıcı mesajları  | TLS, AllowFrom           |
| F2   | Gateway | Ajan     | Yönlendirilen mesajlar | Oturum yalıtımı        |
| F3   | Ajan    | Araçlar  | Araç çağrıları       | Politika uygulaması      |
| F4   | Ajan    | Haricî   | `web_fetch` istekleri | SSRF engelleme          |
| F5   | ClawHub | Ajan     | Skills kodu          | Moderasyon, tarama       |
| F6   | Ajan    | Kanal    | Yanıtlar             | Çıktı filtreleme         |

---

## 3. ATLAS taktiğine göre tehdit analizi

### 3.1 Keşif (AML.TA0002)

#### T-RECON-001: Ajan uç noktası keşfi

| Nitelik                 | Değer                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0006 - Etkin Tarama                                                |
| **Açıklama**            | Saldırgan, açık OpenClaw gateway uç noktalarını tarar                   |
| **Saldırı vektörü**     | Ağ taraması, Shodan sorguları, DNS numaralandırması                     |
| **Etkilenen bileşenler** | Gateway, açık API uç noktaları                                         |
| **Mevcut önlemler**     | Tailscale kimlik doğrulama seçeneği, varsayılan olarak local loopback'e bağlanma |
| **Kalan risk**          | Orta - genel erişime açık gateway'ler keşfedilebilir                    |
| **Öneriler**            | Güvenli dağıtımı belgeleyin, keşif uç noktalarına hız sınırlaması ekleyin |

#### T-RECON-002: Kanal entegrasyonu yoklaması

| Nitelik                 | Değer                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0006 - Etkin Tarama                                                |
| **Açıklama**            | Saldırgan, yapay zekâ tarafından yönetilen hesapları belirlemek için mesajlaşma kanallarını yoklar |
| **Saldırı vektörü**     | Test mesajları gönderme, yanıt örüntülerini gözlemleme                  |
| **Etkilenen bileşenler** | Tüm kanal entegrasyonları                                              |
| **Mevcut önlemler**     | Buna özgü bir önlem yok                                                 |
| **Kalan risk**          | Düşük - tek başına keşfin değeri sınırlıdır                             |
| **Öneriler**            | Yanıt zamanlamasının rastgeleleştirilmesini değerlendirin               |

---

### 3.2 İlk erişim (AML.TA0004)

#### T-ACCESS-001: Eşleştirme kodunun ele geçirilmesi

| Nitelik                 | Değer                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0040 - Yapay Zekâ Modeli Çıkarım API'sine Erişim                                                               |
| **Açıklama**            | Saldırgan, eşleştirme süresi içinde bir eşleştirme kodunu ele geçirir (DM/genel eşleştirme için 1 sa., Node eşleştirmesi için 5 dk.) |
| **Saldırı vektörü**     | Ekranı gözetleme, ağ trafiğini dinleme, sosyal mühendislik                                                           |
| **Etkilenen bileşenler** | Cihaz eşleştirme sistemi                                                                                           |
| **Mevcut önlemler**     | 1 sa. TTL (DM/genel eşleştirme), 5 dk. TTL (Node eşleştirmesi); kodlar mevcut kanal üzerinden gönderilir            |
| **Kalan risk**          | Orta - eşleştirme süresi istismar edilebilir                                                                         |
| **Öneriler**            | Eşleştirme süresini kısaltın, bir onay adımı ekleyin                                                                 |

#### T-ACCESS-002: AllowFrom sahteciliği

| Nitelik                 | Değer                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ATLAS Kimliği**       | AML.T0040 - Yapay Zekâ Modeli Çıkarım API'sine Erişim                          |
| **Açıklama**            | Saldırgan, bir kanalda izin verilen gönderici kimliğini taklit eder            |
| **Saldırı vektörü**     | Kanala bağlı olarak telefon numarası sahteciliği, kullanıcı adı taklidi         |
| **Etkilenen bileşenler** | Kanal bazında AllowFrom doğrulaması                                            |
| **Mevcut önlemler**     | Kanala özgü kimlik doğrulaması                                                  |
| **Kalan risk**          | Orta - bazı kanallar sahteciliğe karşı savunmasız kalır                         |
| **Öneriler**            | Kanala özgü riskleri belgeleyin, mümkün olduğunda kriptografik doğrulama ekleyin |

#### T-ACCESS-003: Belirteç hırsızlığı

| Nitelik                 | Değer                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| **ATLAS Kimliği**       | AML.T0040 - Yapay Zekâ Modeli Çıkarım API'sine Erişim                          |
| **Açıklama**            | Saldırgan, yapılandırma/kimlik bilgisi dosyalarından kimlik doğrulama belirteçlerini çalar |
| **Saldırı vektörü**     | Kötü amaçlı yazılım, yetkisiz cihaz erişimi, yapılandırma yedeğinin açığa çıkması |
| **Etkilenen bileşenler** | Kanal/sağlayıcı kimlik bilgisi depolaması, yapılandırma depolaması             |
| **Mevcut önlemler**     | Dosya izinleri                                                                  |
| **Kalan risk**          | Yüksek - belirteçler diskte düz metin olarak depolanır                          |
| **Öneriler**            | Bekleyen belirteçler için şifreleme uygulayın, belirteç yenileme özelliği ekleyin |

---

### 3.3 Yürütme (AML.TA0005)

#### T-EXEC-001: Doğrudan istem enjeksiyonu

| Nitelik                 | Değer                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0051.000 - LLM İstem Enjeksiyonu: Doğrudan                                                                                              |
| **Açıklama**            | Saldırgan, ajanın davranışını değiştirmek için özel hazırlanmış istemler gönderir                                                            |
| **Saldırı vektörü**     | Düşmanca talimatlar içeren kanal mesajları                                                                                                    |
| **Etkilenen bileşenler** | Ajan LLM'si, tüm giriş yüzeyleri                                                                                                             |
| **Mevcut önlemler**     | Örüntü algılama, harici içeriği sarmalama; bir sınır atlatma durumu olmadığında güvenlik açığı raporlarının kapsamı dışında kabul edilir (bkz. `SECURITY.md`) |
| **Kalan risk**          | Kritik - yalnızca algılama vardır, engelleme yoktur; gelişmiş saldırılar algılamayı atlatır                                                   |
| **Öneriler**            | Mevcut algılamaya ek olarak hassas eylemler için çıktı doğrulaması ve kullanıcı onayı uygulayın                                               |

#### T-EXEC-002: Dolaylı istem enjeksiyonu

| Nitelik                 | Değer                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **ATLAS Kimliği**       | AML.T0051.001 - LLM İstem Enjeksiyonu: Dolaylı                                                                           |
| **Açıklama**            | Saldırgan, getirilen içeriğe kötü amaçlı talimatlar yerleştirir                                                           |
| **Saldırı vektörü**     | Kötü amaçlı URL'ler, zehirlenmiş e-postalar, ele geçirilmiş Webhook'lar                                                   |
| **Etkilenen bileşenler** | `web_fetch`, e-posta alımı, harici veri kaynakları                                                                       |
| **Mevcut önlemler**     | Rastgele sınırlı XML tarzı işaretçilerle içerik sarmalama, benzer glif/özel belirteç normalizasyonu ve bir güvenlik bildirimi |
| **Kalan risk**          | Yüksek - LLM, sarmalayıcı talimatlarını yine de yok sayabilir                                                             |
| **Öneriler**            | Sarmalanmış içerik için ayrı yürütme bağlamları kullanın                                                                  |

#### T-EXEC-003: Araç argümanı enjeksiyonu

| Nitelik                 | Değer                                                         |
| ----------------------- | ------------------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0051.000 - LLM İstem Enjeksiyonu: Doğrudan               |
| **Açıklama**            | Saldırgan, istem enjeksiyonu yoluyla araç argümanlarını değiştirir |
| **Saldırı vektörü**     | Araç parametresi değerlerini etkileyen özel hazırlanmış istemler |
| **Etkilenen bileşenler** | Tüm araç çağrıları                                           |
| **Mevcut önlemler**     | Tehlikeli komutlar için yürütme onayları                       |
| **Kalan risk**          | Yüksek - kullanıcı muhakemesine dayanır                        |
| **Öneriler**            | Argüman doğrulaması, parametreleştirilmiş araç çağrıları       |

#### T-EXEC-004: Yürütme onayını atlatma

| Nitelik                 | Değer                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ATLAS Kimliği**       | AML.T0043 - Düşmanca Veri Hazırlama                                                                                                                                                         |
| **Açıklama**            | Saldırgan, onay izin listesini atlatan komutlar hazırlar                                                                                                                                    |
| **Saldırı vektörü**     | Komut gizleme, takma ad istismarı, yol manipülasyonu                                                                                                                                        |
| **Etkilenen bileşenler** | `src/infra/exec-approvals*.ts`, komut izin listesi                                                                                                                                         |
| **Mevcut önlemler**     | İzin listesi + sorma modu ve komut normalizasyonu (dağıtım sarmalayıcısını açma, satır içi değerlendirme algılama, kabuk zinciri analizi)                                                    |
| **Kalan risk**          | Yüksek - normalizasyon, gizleme yoluyla atlatmayı daraltır ancak ortadan kaldırmaz; yürütme yolları arasındaki yalnızca eşlik bulguları güvenlik açığı değil, sağlamlaştırma olarak değerlendirilir (bkz. `SECURITY.md`) |
| **Öneriler**            | Yeni gizleme tekniklerine karşı komut normalizasyonu kapsamını genişletmeye devam edin                                                                                                       |

---

### 3.4 Kalıcılık (AML.TA0006)

#### T-PERSIST-001: Kötü amaçlı Skills kurulumu

| Nitelik                 | Değer                                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0010.001 - Tedarik Zincirinin Ele Geçirilmesi: Yapay Zekâ Yazılımı                                                     |
| **Açıklama**            | Saldırgan, ClawHub'da kötü amaçlı bir Skills yayımlar                                                                        |
| **Saldırı vektörü**     | Hesap oluşturma, gizli kötü amaçlı kod içeren Skills yayımlama                                                               |
| **Etkilenen bileşenler** | ClawHub, Skills yükleme, ajan yürütmesi                                                                                      |
| **Mevcut önlemler**     | GitHub hesap yaşı doğrulaması, statik örüntü/AST'ye yakın tarama, LLM tabanlı ajansal risk incelemesi, VirusTotal taraması    |
| **Kalan risk**          | Yüksek - algılama katmanları mevcuttur ancak Skills yine de ajan ayrıcalıklarıyla ve yürütme korumalı alanı olmadan çalışır  |
| **Öneriler**            | Skills yürütmesini korumalı alana alın, topluluk incelemesini genişletin                                                     |

#### T-PERSIST-002: Skills güncellemesinin zehirlenmesi

| Nitelik                 | Değer                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0010.001 - Tedarik Zincirinin Ele Geçirilmesi: Yapay Zekâ Yazılımı             |
| **Açıklama**            | Saldırgan, popüler bir Skills'i ele geçirir ve kötü amaçlı bir güncelleme yayımlar   |
| **Saldırı vektörü**     | Hesabın ele geçirilmesi, Skills sahibine yönelik sosyal mühendislik                  |
| **Etkilenen bileşenler** | ClawHub sürümleme, otomatik güncelleme akışları                                     |
| **Mevcut önlemler**     | Sürüm parmak izi oluşturma, yeni sürümlerde moderasyon/taramanın yeniden çalıştırılması |
| **Kalan risk**          | Yüksek - otomatik güncellemeler, inceleme tamamlanmadan kötü amaçlı sürümleri çekebilir |
| **Öneriler**            | Güncelleme imzalama, geri alma özelliği, sürüm sabitleme                             |

#### T-PERSIST-003: Ajan yapılandırmasının kurcalanması

| Öznitelik               | Değer                                                                      |
| ----------------------- | -------------------------------------------------------------------------- |
| **ATLAS kimliği**       | AML.T0010.002 - Tedarik Zincirinin Tehlikeye Atılması: Veri                 |
| **Açıklama**            | Saldırgan, erişimi kalıcı hâle getirmek için ajan yapılandırmasını değiştirir |
| **Saldırı vektörü**     | Yapılandırma dosyasını değiştirme, ayar ekleme                              |
| **Etkilenen bileşenler** | Ajan yapılandırması, araç politikaları                                     |
| **Mevcut önlemler**     | Dosya izinleri                                                              |
| **Kalan risk**          | Orta - yerel erişim gerektirir                                              |
| **Öneriler**            | Yapılandırma bütünlüğü doğrulaması, yapılandırma değişiklikleri için denetim günlüğü |

---

### 3.5 Savunmadan kaçınma (AML.TA0007)

#### T-EVADE-001: Moderasyon kalıbını atlatma

| Öznitelik               | Değer                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| **ATLAS kimliği**       | AML.T0043 - Düşmanca Veri Oluşturma                                                              |
| **Açıklama**            | Saldırgan, ClawHub moderasyon kontrollerinden kaçınmak için skill içeriği oluşturur              |
| **Saldırı vektörü**     | Unicode benzer karakterleri, kodlama hileleri, dinamik yükleme                                   |
| **Etkilenen bileşenler** | ClawHub moderasyon/tarama işlem hattı                                                            |
| **Mevcut önlemler**     | Statik kalıp kuralları, AST çevresindeki kod taraması, LLM tabanlı aracılı risk incelemesi, VirusTotal |
| **Kalan risk**          | Orta - yeni gizleme yöntemleri katmanlı sezgisel denetimleri yine de aşabilir                    |
| **Öneriler**            | Yeni kaçınma yöntemleri bulundukça kalıp/davranış külliyatını genişletmeye devam edin             |

#### T-EVADE-002: İçerik sarmalayıcısından kaçış

| Öznitelik               | Değer                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS kimliği**       | AML.T0043 - Düşmanca Veri Oluşturma                                                                                           |
| **Açıklama**            | Saldırgan, harici içerik sarmalayıcısının bağlamından kaçan içerik oluşturur                                                  |
| **Saldırı vektörü**     | Etiket manipülasyonu, bağlam karmaşası, talimatları geçersiz kılma                                                            |
| **Etkilenen bileşenler** | Harici içerik sarmalama                                                                                                      |
| **Mevcut önlemler**     | Rastgele sınırlı XML tarzı işaretçiler ve güvenlik bildirimi; ayrıca benzer karakter/boşluk varyantlı işaretçi taklidi algılama |
| **Kalan risk**          | Orta - düzenli olarak yeni kaçış yöntemleri keşfediliyor                                                                      |
| **Öneriler**            | Girdi tarafında sarmalamaya ek olarak çıktı tarafında doğrulama                                                               |

---

### 3.6 Keşif (AML.TA0008)

#### T-DISC-001: Araçları listeleme

| Öznitelik               | Değer                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS kimliği**       | AML.T0040 - Yapay Zekâ Modeli Çıkarım API'sine Erişim        |
| **Açıklama**            | Saldırgan, istemler aracılığıyla kullanılabilir araçları listeler |
| **Saldırı vektörü**     | "Hangi araçlara sahipsin?" tarzı sorgular                     |
| **Etkilenen bileşenler** | Ajan araç kayıt defteri                                      |
| **Mevcut önlemler**     | Özel bir önlem yok                                            |
| **Kalan risk**          | Düşük - araçlar genellikle belgelenmiştir                     |
| **Öneriler**            | Araç görünürlüğü denetimlerini değerlendirin                  |

#### T-DISC-002: Oturum verilerini çıkarma

| Öznitelik               | Değer                                                     |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS kimliği**       | AML.T0040 - Yapay Zekâ Modeli Çıkarım API'sine Erişim     |
| **Açıklama**            | Saldırgan, oturum bağlamından hassas verileri çıkarır      |
| **Saldırı vektörü**     | "Neler konuştuk?" sorguları, bağlam yoklama                |
| **Etkilenen bileşenler** | Oturum dökümleri, bağlam penceresi                        |
| **Mevcut önlemler**     | Gönderici başına oturum yalıtımı (`agent:channel:peer` anahtarı) |
| **Kalan risk**          | Orta - oturum içindeki verilere tasarım gereği erişilebilir |
| **Öneriler**            | Bağlamdaki hassas verilerin maskelenmesi                   |

---

### 3.7 Toplama ve dışarı veri sızdırma (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: web_fetch aracılığıyla veri hırsızlığı

| Öznitelik               | Değer                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| **ATLAS kimliği**       | AML.T0009 - Toplama                                                                    |
| **Açıklama**            | Saldırgan, ajana verileri harici bir URL'ye göndermesini söyleyerek verileri dışarı sızdırır |
| **Saldırı vektörü**     | Ajanın saldırgana ait bir sunucuya POST isteğiyle veri göndermesine neden olan istem enjeksiyonu |
| **Etkilenen bileşenler** | `web_fetch` aracı                                                                     |
| **Mevcut önlemler**     | Dahili/özel ağlar için SSRF engelleme (DNS sabitleme + IP engelleme)                   |
| **Kalan risk**          | Yüksek - rastgele harici URL'lere hâlâ izin veriliyor                                  |
| **Öneriler**            | URL izin listesi, veri sınıflandırma farkındalığı                                      |

#### T-EXFIL-002: Yetkisiz mesaj gönderme

| Öznitelik               | Değer                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| **ATLAS kimliği**       | AML.T0009 - Toplama                                                           |
| **Açıklama**            | Saldırgan, ajanın hassas veriler içeren mesajlar göndermesine neden olur      |
| **Saldırı vektörü**     | Ajanın saldırgana mesaj göndermesine neden olan istem enjeksiyonu             |
| **Etkilenen bileşenler** | Mesaj aracı, kanal entegrasyonları                                           |
| **Mevcut önlemler**     | Giden mesaj gönderimi denetimi                                                |
| **Kalan risk**          | Orta - denetim atlatılabilir                                                  |
| **Öneriler**            | Yeni alıcılar için açık onay                                                  |

#### T-EXFIL-003: Kimlik bilgisi toplama

| Öznitelik               | Değer                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS kimliği**       | AML.T0009 - Toplama                                                                                                                                         |
| **Açıklama**            | Kötü amaçlı skill, ajan bağlamından kimlik bilgilerini toplar                                                                                               |
| **Saldırı vektörü**     | Skill kodu ortam değişkenlerini ve yapılandırma dosyalarını okur                                                                                            |
| **Etkilenen bileşenler** | Skill yürütme ortamı                                                                                                                                       |
| **Mevcut önlemler**     | ClawHub kimlik bilgisi kalıbı taraması (sabit kodlanmış gizli bilgiler, ağ gönderimleriyle eşleşen kimlik bilgisi ortam değişkeni erişimi); çalışma zamanında skill'ler için yürütme korumalı alanı yoktur |
| **Kalan risk**          | Kritik - skill'ler ajan ayrıcalıklarıyla çalışır                                                                                                            |
| **Öneriler**            | Skill yürütme için korumalı alan, kimlik bilgilerinin yalıtılması                                                                                           |

---

### 3.8 Etki (AML.TA0011)

#### T-IMPACT-001: Yetkisiz komut yürütme

| Öznitelik               | Değer                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| **ATLAS kimliği**       | AML.T0031 - Yapay Zekâ Modeli Bütünlüğünü Aşındırma                                                        |
| **Açıklama**            | Saldırgan, kullanıcının sisteminde rastgele komutlar yürütür                                               |
| **Saldırı vektörü**     | Yürütme onayını atlatmayla birleştirilmiş istem enjeksiyonu                                                |
| **Etkilenen bileşenler** | Bash aracı, komut yürütme                                                                                 |
| **Mevcut önlemler**     | Yürütme onayları, Docker korumalı alan seçeneği (varsayılan çalışma zamanı arka ucu)                        |
| **Kalan risk**          | Kritik - korumalı alan devre dışı bırakıldığında ana sistemde yürütme mümkündür                            |
| **Öneriler**            | Onay kullanıcı deneyimini iyileştirin; korumalı alanın kapalı olduğu dağıtımlar bilinçli bir operatör tercihi olmaya devam eder ve bu şekilde belgelenir |

#### T-IMPACT-002: Kaynak tüketimi (DoS)

| Öznitelik               | Değer                                                |
| ----------------------- | ---------------------------------------------------- |
| **ATLAS kimliği**       | AML.T0031 - Yapay Zekâ Modeli Bütünlüğünü Aşındırma  |
| **Açıklama**            | Saldırgan, API kredilerini veya hesaplama kaynaklarını tüketir |
| **Saldırı vektörü**     | Otomatik mesaj bombardımanı, pahalı araç çağrıları   |
| **Etkilenen bileşenler** | Gateway, ajan oturumları, API sağlayıcısı           |
| **Mevcut önlemler**     | Yok                                                  |
| **Kalan risk**          | Yüksek - gönderici başına hız sınırlaması yok        |
| **Öneriler**            | Gönderici başına hız sınırları, maliyet bütçeleri    |

#### T-IMPACT-003: İtibar kaybı

| Öznitelik               | Değer                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| **ATLAS kimliği**       | AML.T0031 - Yapay Zekâ Modeli Bütünlüğünü Aşındırma                 |
| **Açıklama**            | Saldırgan, ajanın zararlı veya saldırgan içerik göndermesine neden olur |
| **Saldırı vektörü**     | Uygunsuz yanıtlara neden olan istem enjeksiyonu                     |
| **Etkilenen bileşenler** | Çıktı oluşturma, kanal mesajlaşması                                |
| **Mevcut önlemler**     | LLM sağlayıcısının içerik politikaları                              |
| **Kalan risk**          | Orta - sağlayıcı filtreleri kusursuz değildir                       |
| **Öneriler**            | Çıktı filtreleme katmanı, kullanıcı denetimleri                     |

---

## 4. ClawHub tedarik zinciri analizi

### 4.1 Mevcut güvenlik denetimleri

| Denetim                         | Uygulama                                                                              | Etkililik                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| GitHub hesabının yaşı           | `requireGitHubAccountAge()` (en az 14 gün)                                            | Orta - yeni saldırganlar için çıtayı yükseltir                        |
| Yol temizleme                   | `sanitizePath()`                                                                      | Yüksek - yol geçişini önler                                           |
| Dosya türü doğrulaması          | `isTextFile()`                                                                        | Orta - yalnızca metin dosyaları taranır, ancak yine de istismar edilebilir |
| Boyut sınırları                 | Toplam 50 MB paket (`MAX_PUBLISH_TOTAL_BYTES`)                                         | Yüksek - kaynakların tüketilmesini önler                              |
| Zorunlu SKILL.md                | Yayımlama sırasında zorunlu benioku                                                   | Düşük güvenlik değeri - yalnızca bilgilendirme amaçlı                 |
| Statik + AST'ye yakın tarama    | Çalıştırma, dışarı veri sızdırma, kimlik bilgisi toplama, gizleme ve daha fazlasını kapsayan örüntü motoru | Orta-Yüksek - bilinen birçok kötüye kullanım örüntüsünü kapsar, ancak hâlâ örüntü tabanlıdır |
| LLM tabanlı ajansal risk incelemesi | Yayımlama sırasında güvenlik istemiyle yönlendirilen karar                         | Orta-Yüksek - statik örüntülerin kaçırdığı davranışları yakalar       |
| VirusTotal taraması             | Skills ve paket sürümü yayımlama/yeniden tarama akışlarına bağlıdır; operatör API anahtarına tabidir | Etkinleştirildiğinde yüksek - statik motor algılaması                  |
| Moderasyon durumu               | `moderationStatus` alanı                                                              | Orta - manuel inceleme mümkündür                                      |

### 4.2 Moderasyon sınırlamaları

ClawHub'ın statik taraması, yalnızca kısa ad/meta veri/frontmatter yerine Skills kodunun içeriğini doğrudan inceler; tehlikeli çalıştırma çağrılarını, dinamik kod yürütmeyi, kimlik bilgisi toplamayı, dışarı veri sızdırma örüntülerini, gizlenmiş yükleri ve daha fazlasını kapsar. Bilinen eksiklikler:

- Örüntü tabanlı algılama, yeterince yeni gizleme teknikleriyle yine de aşılabilir.
- LLM tabanlı inceleme ve VirusTotal taraması, operatör tarafındaki API anahtarlarının/yapılandırmanın etkinleştirilmesine bağlıdır.
- Kurulduktan sonra hiçbir çalışma zamanı yürütme korumalı alanı, bir Skills'i ajanın kendi ayrıcalıklarından yalıtmaz.

### 4.3 Rozetler

Skills ve paketler, moderatörler tarafından atanan şu rozetleri taşır: `highlighted`, `official`, `deprecated`, `redactionApproved` (yalnızca Skills). Topluluk bildirimleri (`skillReports`) ve denetim günlükleri (`auditLogs`), moderasyon iş akışlarını destekler.

---

## 5. Risk matrisi

### 5.1 Olasılık ve etki

| Tehdit kimliği | Olasılık | Etki     | Risk düzeyi  | Öncelik |
| --------------- | -------- | -------- | ------------ | ------- |
| T-EXEC-001      | Yüksek   | Kritik   | **Kritik**   | P0      |
| T-PERSIST-001   | Yüksek   | Kritik   | **Kritik**   | P0      |
| T-EXFIL-003     | Orta     | Kritik   | **Kritik**   | P0      |
| T-IMPACT-001    | Orta     | Kritik   | **Yüksek**   | P1      |
| T-EXEC-002      | Yüksek   | Yüksek   | **Yüksek**   | P1      |
| T-EXEC-004      | Orta     | Yüksek   | **Yüksek**   | P1      |
| T-ACCESS-003    | Orta     | Yüksek   | **Yüksek**   | P1      |
| T-EXFIL-001     | Orta     | Yüksek   | **Yüksek**   | P1      |
| T-IMPACT-002    | Yüksek   | Orta     | **Yüksek**   | P1      |
| T-EVADE-001     | Yüksek   | Orta     | **Orta**     | P2      |
| T-ACCESS-001    | Düşük    | Yüksek   | **Orta**     | P2      |
| T-ACCESS-002    | Düşük    | Yüksek   | **Orta**     | P2      |
| T-PERSIST-002   | Düşük    | Yüksek   | **Orta**     | P2      |

### 5.2 Kritik yol saldırı zincirleri

**Zincir 1: Skills tabanlı veri hırsızlığı**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Kötü amaçlı Skills yayımla) → (Moderasyonu aş) → (Kimlik bilgilerini topla)
```

**Zincir 2: İstem enjeksiyonundan uzaktan kod yürütmeye**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(İstem enjekte et) → (Çalıştırma onayını aş) → (Komutları yürüt)
```

**Zincir 3: Getirilen içerik üzerinden dolaylı enjeksiyon**

```text
T-EXEC-002 → T-EXFIL-001 → Haricî veri sızdırma
(URL içeriğini zehirle) → (Ajan içeriği getirir ve talimatları izler) → (Veriler saldırgana gönderilir)
```

---

## 6. Önerilerin özeti

### 6.1 Acil (P0)

| Kimlik | Öneri                                               | Ele aldığı tehditler       |
| ------ | --------------------------------------------------- | -------------------------- |
| R-002  | Skills yürütme korumalı alanını uygulayın           | T-PERSIST-001, T-EXFIL-003 |
| R-003  | Hassas eylemler için çıktı doğrulaması ekleyin      | T-EXEC-001, T-EXEC-002     |

### 6.2 Kısa vadeli (P1)

| Kimlik | Öneri                                                                        | Ele aldığı tehdit |
| ------ | --------------------------------------------------------------------------- | ----------------- |
| R-004  | Gönderen başına hız sınırlaması uygulayın                                   | T-IMPACT-002      |
| R-005  | Bekleyen belirteçler için şifreleme ekleyin                                 | T-ACCESS-003      |
| R-006  | Çalıştırma onayı kullanıcı deneyimini iyileştirin ve komut normalleştirmeyi genişletmeye devam edin | T-EXEC-004 |
| R-007  | `web_fetch` için URL izin listesi uygulayın                                 | T-EXFIL-001       |

### 6.3 Orta vadeli (P2)

| Kimlik | Öneri                                                    | Ele aldığı tehdit |
| ------ | -------------------------------------------------------- | ----------------- |
| R-008  | Mümkün olduğunda kriptografik kanal doğrulaması ekleyin  | T-ACCESS-002      |
| R-009  | Yapılandırma bütünlüğü doğrulaması uygulayın              | T-PERSIST-003     |
| R-010  | Güncelleme imzalama ve sürüm sabitleme ekleyin            | T-PERSIST-002     |

---

## 7. Ekler

### 7.1 ATLAS teknik eşlemesi

| ATLAS kimliği | Teknik adı                         | OpenClaw tehditleri                                                |
| ------------- | ---------------------------------- | ------------------------------------------------------------------ |
| AML.T0006     | Etkin Tarama                       | T-RECON-001, T-RECON-002                                           |
| AML.T0009     | Toplama                            | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                              |
| AML.T0010.001 | Tedarik Zinciri: Yapay Zekâ Yazılımı | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Tedarik Zinciri: Veri              | T-PERSIST-003                                                      |
| AML.T0031     | Yapay Zekâ Modeli Bütünlüğünü Aşındırma | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                      |
| AML.T0040     | Yapay Zekâ Modeli Çıkarım API'sine Erişim | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Düşmanca Veri Oluşturma            | T-EXEC-004, T-EVADE-001, T-EVADE-002                               |
| AML.T0051.000 | LLM İstem Enjeksiyonu: Doğrudan    | T-EXEC-001, T-EXEC-003                                             |
| AML.T0051.001 | LLM İstem Enjeksiyonu: Dolaylı     | T-EXEC-002                                                         |

### 7.2 Temel güvenlik dosyaları

| Yol                                 | Amaç                                      | Risk düzeyi |
| ----------------------------------- | ----------------------------------------- | ----------- |
| `src/infra/exec-approvals.ts`       | Komut onayı mantığı                       | **Kritik**  |
| `src/gateway/auth.ts`               | Gateway kimlik doğrulaması                | **Kritik**  |
| `src/infra/net/ssrf.ts`             | SSRF koruması                             | **Kritik**  |
| `src/security/external-content.ts`  | İstem enjeksiyonunu azaltma               | **Kritik**  |
| `src/agents/sandbox/tool-policy.ts` | Korumalı alan aracı izin/verme-reddetme ilkesi | **Kritik** |
| `src/routing/resolve-route.ts`      | Oturum yalıtımı / yönlendirme             | **Orta**    |

### 7.3 Terimler sözlüğü

| Terim                | Tanım                                                       |
| -------------------- | ----------------------------------------------------------- |
| **ATLAS**            | MITRE'nin Yapay Zekâ Sistemleri için Düşmanca Tehdit Ortamı |
| **ClawHub**          | OpenClaw'ın Skills pazaryeri                                 |
| **Gateway**          | OpenClaw'ın ileti yönlendirme ve kimlik doğrulama katmanı    |
| **MCP**              | Model Bağlam Protokolü - araç sağlayıcı arayüzü              |
| **İstem enjeksiyonu** | Kötü amaçlı talimatların girdiye gömüldüğü saldırı          |
| **Skills**           | OpenClaw ajanları için indirilebilir uzantı                  |
| **SSRF**             | Sunucu Taraflı İstek Sahteciliği                             |

---

_Bu tehdit modeli yaşayan bir belgedir. Güvenlik sorunlarını `security@openclaw.ai` adresine bildirin veya [Güven sayfasına](https://trust.openclaw.ai) bakın._

## İlgili

- [Tehdit modeline katkıda bulunma](/tr/security/CONTRIBUTING-THREAT-MODEL)
- [Olay müdahalesi](/tr/security/incident-response)
- [Ağ proxy'si](/tr/security/network-proxy)
- [Biçimsel doğrulama](/tr/security/formal-verification)
