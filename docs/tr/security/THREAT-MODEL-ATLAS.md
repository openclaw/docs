---
read_when:
    - Güvenlik duruşunu veya tehdit senaryolarını gözden geçiriyorsunuz
    - Güvenlik özellikleri veya denetim yanıtları üzerinde çalışıyorsunuz
summary: MITRE ATLAS çerçevesine eşlenmiş OpenClaw tehdit modeli
title: Tehdit Modeli (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-05T14:09:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05561381c73e8efe20c8b59cd717e66447ee43988018e9670161cc63e650f2bf
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# OpenClaw Tehdit Modeli v1.0

## MITRE ATLAS Çerçevesi

**Version:** 1.0-draft
**Last Updated:** 2026-02-04
**Methodology:** MITRE ATLAS + Veri Akışı Diyagramları
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (AI Sistemleri için Hasım Tehdit Ortamı)

### Çerçeve Atfı

Bu tehdit modeli, AI/ML sistemlerine yönelik düşmanca tehditleri belgelendirmek için sektör standardı çerçeve olan [MITRE ATLAS](https://atlas.mitre.org/) üzerine kuruludur. ATLAS, [MITRE](https://www.mitre.org/) tarafından AI güvenlik topluluğuyla iş birliği içinde sürdürülmektedir.

**Temel ATLAS Kaynakları:**

- [ATLAS Teknikleri](https://atlas.mitre.org/techniques/)
- [ATLAS Taktikleri](https://atlas.mitre.org/tactics/)
- [ATLAS Vaka Çalışmaları](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [ATLAS'a Katkıda Bulunma](https://atlas.mitre.org/resources/contribute)

### Bu Tehdit Modeline Katkıda Bulunma

Bu, OpenClaw topluluğu tarafından sürdürülen yaşayan bir belgedir. Katkıda bulunma yönergeleri için [CONTRIBUTING-THREAT-MODEL.md](/security/CONTRIBUTING-THREAT-MODEL) bölümüne bakın:

- Yeni tehditleri bildirme
- Mevcut tehditleri güncelleme
- Saldırı zincirleri önerme
- Azaltım önerme

---

## 1. Giriş

### 1.1 Amaç

Bu tehdit modeli, özellikle AI/ML sistemleri için tasarlanmış MITRE ATLAS çerçevesini kullanarak OpenClaw AI aracı platformu ve ClawHub Skills pazaryerine yönelik düşmanca tehditleri belgelendirir.

### 1.2 Kapsam

| Bileşen                | Dahil | Notlar                                           |
| ---------------------- | ----- | ------------------------------------------------ |
| OpenClaw Aracı Runtime | Evet  | Çekirdek aracı yürütme, araç çağrıları, oturumlar |
| Gateway                | Evet  | Kimlik doğrulama, yönlendirme, kanal entegrasyonu |
| Kanal Entegrasyonları  | Evet  | WhatsApp, Telegram, Discord, Signal, Slack vb.   |
| ClawHub Marketplace    | Evet  | Skill yayınlama, moderasyon, dağıtım             |
| MCP Sunucuları         | Evet  | Harici araç sağlayıcıları                        |
| Kullanıcı Cihazları    | Kısmi | Mobil uygulamalar, masaüstü istemcileri          |

### 1.3 Kapsam Dışı

Bu tehdit modeli için açıkça kapsam dışı bırakılmış hiçbir şey yoktur.

---

## 2. Sistem Mimarisi

### 2.1 Güven Sınırları

```
┌─────────────────────────────────────────────────────────────────┐
│                    GÜVENİLMEYEN BÖLGE                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│              GÜVEN SINIRI 1: Kanal Erişimi                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                             │   │
│  │  • Cihaz Eşleme (DM için 1 sa / düğüm için 5 dk tolere) │   │
│  │  • AllowFrom / AllowList doğrulaması                    │   │
│  │  • Token/Parola/Tailscale kimlik doğrulaması            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              GÜVEN SINIRI 2: Oturum Yalıtımı                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   ARAÇI OTURUMLARI                       │   │
│  │  • Oturum anahtarı = agent:channel:peer                 │   │
│  │  • Aracı başına araç ilkeleri                           │   │
│  │  • Transkript günlüğü                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              GÜVEN SINIRI 3: Araç Yürütme                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  YÜRÜTME SANDBOX'I                       │   │
│  │  • Docker sandbox'ı VEYA Ana Makine (exec-approvals)    │   │
│  │  • Node uzaktan yürütme                                 │   │
│  │  • SSRF koruması (DNS sabitleme + IP engelleme)         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              GÜVEN SINIRI 4: Harici İçerik                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          GETİRİLEN URL'LER / E-POSTALAR / WEBHOOK'LAR    │   │
│  │  • Harici içerik sarmalama (XML etiketleri)             │   │
│  │  • Güvenlik bildirimi ekleme                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              GÜVEN SINIRI 5: Tedarik Zinciri                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                             │   │
│  │  • Skill yayınlama (semver, SKILL.md zorunlu)           │   │
│  │  • Desen tabanlı moderasyon bayrakları                  │   │
│  │  • VirusTotal taraması (yakında)                        │   │
│  │  • GitHub hesap yaşı doğrulaması                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Veri Akışları

| Akış | Kaynak | Hedef       | Veri              | Koruma             |
| ---- | ------ | ----------- | ----------------- | ------------------ |
| F1   | Kanal  | Gateway     | Kullanıcı mesajları | TLS, AllowFrom     |
| F2   | Gateway | Aracı      | Yönlendirilmiş mesajlar | Oturum yalıtımı |
| F3   | Aracı  | Araçlar     | Araç çağrıları    | İlke zorlaması     |
| F4   | Aracı  | Harici      | web_fetch istekleri | SSRF engelleme   |
| F5   | ClawHub | Aracı      | Skill kodu        | Moderasyon, tarama |
| F6   | Aracı  | Kanal       | Yanıtlar          | Çıktı filtreleme   |

---

## 3. ATLAS Taktiğine Göre Tehdit Analizi

### 3.1 Keşif (AML.TA0002)

#### T-RECON-001: Aracı Uç Noktası Keşfi

| Öznitelik              | Değer                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0006 - Aktif Tarama                                            |
| **Description**        | Saldırgan, açığa açık OpenClaw gateway uç noktalarını tarar         |
| **Attack Vector**      | Ağ taraması, shodan sorguları, DNS numaralandırması                 |
| **Affected Components** | Gateway, açığa açık API uç noktaları                               |
| **Current Mitigations** | Tailscale kimlik doğrulama seçeneği, varsayılan olarak local loopback'e bağlanma |
| **Residual Risk**      | Orta - Genel ağ geçitleri keşfedilebilir                            |
| **Recommendations**    | Güvenli dağıtımı belgelendirin, keşif uç noktalarına oran sınırlaması ekleyin |

#### T-RECON-002: Kanal Entegrasyonu Yoklaması

| Öznitelik              | Değer                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0006 - Aktif Tarama                                           |
| **Description**        | Saldırgan, AI tarafından yönetilen hesapları belirlemek için mesajlaşma kanallarını yoklar |
| **Attack Vector**      | Test mesajları gönderme, yanıt kalıplarını gözlemleme             |
| **Affected Components** | Tüm kanal entegrasyonları                                         |
| **Current Mitigations** | Belirli bir önlem yok                                             |
| **Residual Risk**      | Düşük - Yalnızca keşiften sınırlı değer elde edilir                |
| **Recommendations**    | Yanıt zamanlamasını rastgeleleştirmeyi değerlendirin               |

---

### 3.2 İlk Erişim (AML.TA0004)

#### T-ACCESS-001: Eşleme Kodu Ele Geçirme

| Öznitelik              | Değer                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Çıkarım API Erişimi                                                                        |
| **Description**        | Saldırgan, eşleme tolerans süresi sırasında eşleme kodunu ele geçirir (DM kanal eşlemesi için 1 sa, düğüm eşlemesi için 5 dk) |
| **Attack Vector**      | Omuz sörfü, ağ dinleme, sosyal mühendislik                                                                      |
| **Affected Components** | Cihaz eşleme sistemi                                                                                           |
| **Current Mitigations** | 1 sa sona erme (DM eşleme) / 5 dk sona erme (düğüm eşleme), kodların mevcut kanal üzerinden gönderilmesi      |
| **Residual Risk**      | Orta - Tolerans süresi istismar edilebilir                                                                      |
| **Recommendations**    | Tolerans süresini azaltın, onay adımı ekleyin                                                                  |

#### T-ACCESS-002: AllowFrom Sahteciliği

| Öznitelik              | Değer                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0040 - AI Model Çıkarım API Erişimi                                 |
| **Description**        | Saldırgan, kanalda izin verilen gönderici kimliğini taklit eder          |
| **Attack Vector**      | Kanala bağlı - telefon numarası sahteciliği, kullanıcı adı taklidi       |
| **Affected Components** | Kanal başına AllowFrom doğrulaması                                      |
| **Current Mitigations** | Kanala özgü kimlik doğrulama                                            |
| **Residual Risk**      | Orta - Bazı kanallar sahteciliğe karşı savunmasız                        |
| **Recommendations**    | Kanala özgü riskleri belgelendirin, mümkün olduğunda kriptografik doğrulama ekleyin |

#### T-ACCESS-003: Token Hırsızlığı

| Öznitelik              | Değer                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Çıkarım API Erişimi                    |
| **Description**        | Saldırgan, yapılandırma dosyalarından kimlik doğrulama token'larını çalar |
| **Attack Vector**      | Kötü amaçlı yazılım, yetkisiz cihaz erişimi, yapılandırma yedeğinin açığa çıkması |
| **Affected Components** | `~/.openclaw/credentials/`, yapılandırma depolama         |
| **Current Mitigations** | Dosya izinleri                                             |
| **Residual Risk**      | Yüksek - Token'lar düz metin olarak depolanır               |
| **Recommendations**    | Bekleyen veriler için token şifreleme uygulayın, token rotasyonu ekleyin |

---

### 3.3 Yürütme (AML.TA0005)

#### T-EXEC-001: Doğrudan İstem Enjeksiyonu

| Öznitelik              | Değer                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.000 - LLM İstem Enjeksiyonu: Doğrudan                                           |
| **Description**        | Saldırgan, aracı davranışını manipüle etmek için hazırlanmış istemler gönderir            |
| **Attack Vector**      | Düşmanca talimatlar içeren kanal mesajları                                                |
| **Affected Components** | Aracı LLM'si, tüm giriş yüzeyleri                                                        |
| **Current Mitigations** | Desen algılama, harici içerik sarmalama                                                  |
| **Residual Risk**      | Kritik - Yalnızca tespit var, engelleme yok; gelişmiş saldırılar bunu aşar               |
| **Recommendations**    | Çok katmanlı savunma, çıktı doğrulama, hassas eylemler için kullanıcı onayı uygulayın    |

#### T-EXEC-002: Dolaylı İstem Enjeksiyonu

| Öznitelik              | Değer                                                     |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.001 - LLM İstem Enjeksiyonu: Dolaylı            |
| **Description**        | Saldırgan, getirilen içeriğe kötü amaçlı talimatlar gömer |
| **Attack Vector**      | Kötü amaçlı URL'ler, zehirlenmiş e-postalar, ele geçirilmiş webhook'lar |
| **Affected Components** | `web_fetch`, e-posta alımı, harici veri kaynakları       |
| **Current Mitigations** | XML etiketleri ve güvenlik bildirimiyle içerik sarmalama |
| **Residual Risk**      | Yüksek - LLM sarmalayıcı talimatlarını yok sayabilir      |
| **Recommendations**    | İçerik temizleme, ayrı yürütme bağlamları uygulayın       |

#### T-EXEC-003: Araç Argümanı Enjeksiyonu

| Öznitelik              | Değer                                                      |
| ---------------------- | ---------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.000 - LLM İstem Enjeksiyonu: Doğrudan            |
| **Description**        | Saldırgan, istem enjeksiyonu yoluyla araç argümanlarını manipüle eder |
| **Attack Vector**      | Araç parametre değerlerini etkileyen hazırlanmış istemler  |
| **Affected Components** | Tüm araç çağrıları                                        |
| **Current Mitigations** | Tehlikeli komutlar için yürütme onayları                  |
| **Residual Risk**      | Yüksek - Kullanıcı yargısına dayanır                       |
| **Recommendations**    | Argüman doğrulama, parametreleştirilmiş araç çağrıları uygulayın |

#### T-EXEC-004: Yürütme Onayı Atlatma

| Öznitelik              | Değer                                                      |
| ---------------------- | ---------------------------------------------------------- |
| **ATLAS ID**           | AML.T0043 - Düşmanca Veri Hazırlama                        |
| **Description**        | Saldırgan, onay allowlist'ini aşan komutlar hazırlar       |
| **Attack Vector**      | Komut karmaşıklaştırma, takma ad istismarı, yol manipülasyonu |
| **Affected Components** | `exec-approvals.ts`, komut allowlist'i                    |
| **Current Mitigations** | Allowlist + sorma modu                                    |
| **Residual Risk**      | Yüksek - Komut temizleme yok                               |
| **Recommendations**    | Komut normalizasyonu uygulayın, blocklist'i genişletin     |

---

### 3.4 Kalıcılık (AML.TA0006)

#### T-PERSIST-001: Kötü Amaçlı Skill Kurulumu

| Öznitelik              | Değer                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0010.001 - Tedarik Zinciri Ele Geçirme: AI Yazılımı                |
| **Description**        | Saldırgan, ClawHub'a kötü amaçlı Skill yayınlar                          |
| **Attack Vector**      | Hesap oluşturma, gizli kötü amaçlı kod içeren Skill yayınlama           |
| **Affected Components** | ClawHub, Skill yükleme, aracı yürütme                                   |
| **Current Mitigations** | GitHub hesap yaşı doğrulaması, desen tabanlı moderasyon bayrakları      |
| **Residual Risk**      | Kritik - Sandbox yok, inceleme sınırlı                                   |
| **Recommendations**    | VirusTotal entegrasyonu (devam ediyor), Skill sandbox'ı, topluluk incelemesi |

#### T-PERSIST-002: Skill Güncelleme Zehirleme

| Öznitelik              | Değer                                                          |
| ---------------------- | -------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.001 - Tedarik Zinciri Ele Geçirme: AI Yazılımı      |
| **Description**        | Saldırgan, popüler bir Skill'i ele geçirir ve kötü amaçlı güncelleme yayınlar |
| **Attack Vector**      | Hesap ele geçirme, Skill sahibine sosyal mühendislik           |
| **Affected Components** | ClawHub sürümleme, otomatik güncelleme akışları               |
| **Current Mitigations** | Sürüm parmak izi oluşturma                                    |
| **Residual Risk**      | Yüksek - Otomatik güncellemeler kötü amaçlı sürümleri çekebilir |
| **Recommendations**    | Güncelleme imzalama, geri alma yeteneği, sürüm sabitleme uygulayın |

#### T-PERSIST-003: Aracı Yapılandırma Tahrifatı

| Öznitelik              | Değer                                                          |
| ---------------------- | -------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.002 - Tedarik Zinciri Ele Geçirme: Veri              |
| **Description**        | Saldırgan, erişimi kalıcı kılmak için aracı yapılandırmasını değiştirir |
| **Attack Vector**      | Yapılandırma dosyası değiştirme, ayar enjeksiyonu              |
| **Affected Components** | Aracı yapılandırması, araç ilkeleri                           |
| **Current Mitigations** | Dosya izinleri                                                |
| **Residual Risk**      | Orta - Yerel erişim gerektirir                                 |
| **Recommendations**    | Yapılandırma bütünlüğü doğrulaması, yapılandırma değişiklikleri için denetim günlüğü uygulayın |

---

### 3.5 Savunmadan Kaçınma (AML.TA0007)

#### T-EVADE-001: Moderasyon Deseni Atlatma

| Öznitelik              | Değer                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0043 - Düşmanca Veri Hazırlama                                      |
| **Description**        | Saldırgan, moderasyon desenlerinden kaçmak için Skill içeriği hazırlar   |
| **Attack Vector**      | Unicode benzer karakterleri, kodlama hileleri, dinamik yükleme           |
| **Affected Components** | ClawHub `moderation.ts`                                                  |
| **Current Mitigations** | Desen tabanlı `FLAG_RULES`                                               |
| **Residual Risk**      | Yüksek - Basit regex kolayca atlatılır                                   |
| **Recommendations**    | Davranışsal analiz ekleyin (VirusTotal Code Insight), AST tabanlı algılama |

#### T-EVADE-002: İçerik Sarmalayıcıdan Kaçış

| Öznitelik              | Değer                                                     |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS ID**           | AML.T0043 - Düşmanca Veri Hazırlama                       |
| **Description**        | Saldırgan, XML sarmalayıcı bağlamından kaçan içerik hazırlar |
| **Attack Vector**      | Etiket manipülasyonu, bağlam karışıklığı, talimat geçersiz kılma |
| **Affected Components** | Harici içerik sarmalama                                  |
| **Current Mitigations** | XML etiketleri + güvenlik bildirimi                      |
| **Residual Risk**      | Orta - Yeni kaçışlar düzenli olarak keşfediliyor          |
| **Recommendations**    | Birden fazla sarmalayıcı katmanı, çıktı tarafı doğrulama  |

---

### 3.6 Keşif (AML.TA0008)

#### T-DISC-001: Araç Numaralandırması

| Öznitelik              | Değer                                                   |
| ---------------------- | ------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Çıkarım API Erişimi                |
| **Description**        | Saldırgan, istemler aracılığıyla kullanılabilir araçları numaralandırır |
| **Attack Vector**      | `"Hangi araçlara sahipsin?"` tarzı sorgular             |
| **Affected Components** | Aracı araç kayıt defteri                               |
| **Current Mitigations** | Belirli bir önlem yok                                  |
| **Residual Risk**      | Düşük - Araçlar genellikle belgelenmiştir               |
| **Recommendations**    | Araç görünürlük denetimlerini değerlendirin             |

#### T-DISC-002: Oturum Verisi Çıkarma

| Öznitelik              | Değer                                                   |
| ---------------------- | ------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Çıkarım API Erişimi                |
| **Description**        | Saldırgan, oturum bağlamından hassas verileri çıkarır   |
| **Attack Vector**      | `"Ne konuştuk?"` sorguları, bağlam yoklaması            |
| **Affected Components** | Oturum transkriptleri, bağlam penceresi                |
| **Current Mitigations** | Gönderen başına oturum yalıtımı                         |
| **Residual Risk**      | Orta - Oturum içi verilere erişilebilir                 |
| **Recommendations**    | Bağlamda hassas veri redaksiyonu uygulayın              |

---

### 3.7 Toplama ve Veri Sızdırma (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: web_fetch Üzerinden Veri Hırsızlığı

| Öznitelik              | Değer                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0009 - Toplama                                                      |
| **Description**        | Saldırgan, aracıya verileri harici bir URL'ye göndermesi talimatını vererek verileri sızdırır |
| **Attack Vector**      | İstem enjeksiyonunun aracıyı verileri saldırgan sunucusuna POST etmeye yönlendirmesi |
| **Affected Components** | `web_fetch` aracı                                                       |
| **Current Mitigations** | İç ağlar için SSRF engelleme                                            |
| **Residual Risk**      | Yüksek - Harici URL'lere izin verilir                                   |
| **Recommendations**    | URL allowlist'i, veri sınıflandırma farkındalığı uygulayın              |

#### T-EXFIL-002: Yetkisiz Mesaj Gönderimi

| Öznitelik              | Değer                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0009 - Toplama                                                |
| **Description**        | Saldırgan, aracının hassas veri içeren mesajlar göndermesine neden olur |
| **Attack Vector**      | İstem enjeksiyonunun aracıyı saldırgana mesaj göndermeye yönlendirmesi |
| **Affected Components** | Mesaj aracı, kanal entegrasyonları                                |
| **Current Mitigations** | Giden mesajlaşma geçitlemesi                                      |
| **Residual Risk**      | Orta - Geçitleme atlatılabilir                                     |
| **Recommendations**    | Yeni alıcılar için açık onay gerektirin                            |

#### T-EXFIL-003: Kimlik Bilgisi Toplama

| Öznitelik              | Değer                                                   |
| ---------------------- | ------------------------------------------------------- |
| **ATLAS ID**           | AML.T0009 - Toplama                                     |
| **Description**        | Kötü amaçlı Skill, aracı bağlamından kimlik bilgilerini toplar |
| **Attack Vector**      | Skill kodu ortam değişkenlerini, yapılandırma dosyalarını okur |
| **Affected Components** | Skill yürütme ortamı                                    |
| **Current Mitigations** | Skills için belirli bir önlem yok                       |
| **Residual Risk**      | Kritik - Skills aracı ayrıcalıklarıyla çalışır          |
| **Recommendations**    | Skill sandbox'ı, kimlik bilgisi yalıtımı                |

---

### 3.8 Etki (AML.TA0011)

#### T-IMPACT-001: Yetkisiz Komut Yürütme

| Öznitelik              | Değer                                                |
| ---------------------- | ---------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - AI Model Bütünlüğünü Aşındırma           |
| **Description**        | Saldırgan, kullanıcı sisteminde rastgele komutlar yürütür |
| **Attack Vector**      | İstem enjeksiyonu ile yürütme onayı atlatmanın birleşimi |
| **Affected Components** | Bash aracı, komut yürütme                            |
| **Current Mitigations** | Yürütme onayları, Docker sandbox seçeneği           |
| **Residual Risk**      | Kritik - Sandbox olmadan ana makinede yürütme        |
| **Recommendations**    | Varsayılanı sandbox yapın, onay UX'ini iyileştirin   |

#### T-IMPACT-002: Kaynak Tüketme (DoS)

| Öznitelik              | Değer                                                |
| ---------------------- | ---------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - AI Model Bütünlüğünü Aşındırma           |
| **Description**        | Saldırgan, API kredilerini veya hesaplama kaynaklarını tüketir |
| **Attack Vector**      | Otomatik mesaj taşması, pahalı araç çağrıları       |
| **Affected Components** | Gateway, aracı oturumları, API sağlayıcısı          |
| **Current Mitigations** | Yok                                                 |
| **Residual Risk**      | Yüksek - Oran sınırlaması yok                        |
| **Recommendations**    | Gönderen başına oran sınırları, maliyet bütçeleri uygulayın |

#### T-IMPACT-003: İtibar Kaybı

| Öznitelik              | Değer                                                     |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - AI Model Bütünlüğünü Aşındırma                |
| **Description**        | Saldırgan, aracının zararlı/rahatsız edici içerik göndermesine neden olur |
| **Attack Vector**      | Uygunsuz yanıtlara yol açan istem enjeksiyonu             |
| **Affected Components** | Çıktı üretimi, kanal mesajlaşması                         |
| **Current Mitigations** | LLM sağlayıcısı içerik ilkeleri                           |
| **Residual Risk**      | Orta - Sağlayıcı filtreleri kusursuz değil                |
| **Recommendations**    | Çıktı filtreleme katmanı, kullanıcı denetimleri           |

---

## 4. ClawHub Tedarik Zinciri Analizi

### 4.1 Mevcut Güvenlik Denetimleri

| Denetim              | Uygulama                    | Etkililik                                             |
| -------------------- | --------------------------- | ----------------------------------------------------- |
| GitHub Hesap Yaşı    | `requireGitHubAccountAge()` | Orta - Yeni saldırganlar için eşiği yükseltir         |
| Yol Temizleme        | `sanitizePath()`            | Yüksek - Yol geçişini önler                           |
| Dosya Türü Doğrulama | `isTextFile()`              | Orta - Yalnızca metin dosyaları, ancak yine de kötü amaçlı olabilir |
| Boyut Sınırları      | Toplam 50MB bundle          | Yüksek - Kaynak tüketmeyi önler                       |
| Zorunlu SKILL.md     | Zorunlu readme              | Düşük güvenlik değeri - Yalnızca bilgilendirici       |
| Desen Moderasyonu    | `moderation.ts` içindeki `FLAG_RULES` | Düşük - Kolayca atlatılabilir                 |
| Moderasyon Durumu    | `moderationStatus` alanı    | Orta - Elle inceleme mümkün                           |

### 4.2 Moderasyon Bayrağı Desenleri

`moderation.ts` içindeki mevcut desenler:

```javascript
// Bilinen kötü tanımlayıcılar
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Şüpheli anahtar kelimeler
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Sınırlamalar:**

- Yalnızca slug, `displayName`, `summary`, frontmatter, meta veri ve dosya yollarını denetler
- Gerçek Skill kod içeriğini analiz etmez
- Basit regex, karmaşıklaştırmayla kolayca atlatılır
- Davranışsal analiz yok

### 4.3 Planlanan İyileştirmeler

| İyileştirme            | Durum                                 | Etki                                                              |
| ---------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| VirusTotal Entegrasyonu | Devam Ediyor                         | Yüksek - Code Insight davranışsal analizi                         |
| Topluluk Bildirimi     | Kısmi (`skillReports` tablosu mevcut) | Orta                                                              |
| Denetim Günlüğü        | Kısmi (`auditLogs` tablosu mevcut)    | Orta                                                              |
| Rozet Sistemi          | Uygulandı                             | Orta - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Risk Matrisi

### 5.1 Olasılık ve Etki

| Threat ID     | Olasılık | Etki    | Risk Düzeyi | Öncelik |
| ------------- | -------- | ------- | ----------- | ------- |
| T-EXEC-001    | Yüksek   | Kritik  | **Critical** | P0      |
| T-PERSIST-001 | Yüksek   | Kritik  | **Critical** | P0      |
| T-EXFIL-003   | Orta     | Kritik  | **Critical** | P0      |
| T-IMPACT-001  | Orta     | Kritik  | **High**     | P1      |
| T-EXEC-002    | Yüksek   | Yüksek  | **High**     | P1      |
| T-EXEC-004    | Orta     | Yüksek  | **High**     | P1      |
| T-ACCESS-003  | Orta     | Yüksek  | **High**     | P1      |
| T-EXFIL-001   | Orta     | Yüksek  | **High**     | P1      |
| T-IMPACT-002  | Yüksek   | Orta    | **High**     | P1      |
| T-EVADE-001   | Yüksek   | Orta    | **Medium**   | P2      |
| T-ACCESS-001  | Düşük    | Yüksek  | **Medium**   | P2      |
| T-ACCESS-002  | Düşük    | Yüksek  | **Medium**   | P2      |
| T-PERSIST-002 | Düşük    | Yüksek  | **Medium**   | P2      |

### 5.2 Kritik Yol Saldırı Zincirleri

**Saldırı Zinciri 1: Skill Tabanlı Veri Hırsızlığı**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Kötü amaçlı Skill yayınla) → (Moderasyondan kaç) → (Kimlik bilgilerini topla)
```

**Saldırı Zinciri 2: İstem Enjeksiyonundan RCE'ye**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(İstem enjekte et) → (Yürütme onayını atlat) → (Komut yürüt)
```

**Saldırı Zinciri 3: Getirilen İçerik Üzerinden Dolaylı Enjeksiyon**

```
T-EXEC-002 → T-EXFIL-001 → Harici veri sızdırma
(URL içeriğini zehirle) → (Aracı getirir ve talimatları izler) → (Veri saldırgana gönderilir)
```

---

## 6. Öneriler Özeti

### 6.1 Hemen (P0)

| ID    | Öneri                                        | Ele Aldıkları              |
| ----- | -------------------------------------------- | -------------------------- |
| R-001 | VirusTotal entegrasyonunu tamamlayın         | T-PERSIST-001, T-EVADE-001 |
| R-002 | Skill sandbox'ı uygulayın                    | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Hassas eylemler için çıktı doğrulama ekleyin | T-EXEC-001, T-EXEC-002     |

### 6.2 Kısa vadeli (P1)

| ID    | Öneri                                    | Ele Aldıkları |
| ----- | ---------------------------------------- | ------------- |
| R-004 | Oran sınırlaması uygulayın               | T-IMPACT-002  |
| R-005 | Bekleyen veriler için token şifreleme ekleyin | T-ACCESS-003 |
| R-006 | Yürütme onayı UX'ini ve doğrulamayı iyileştirin | T-EXEC-004 |
| R-007 | `web_fetch` için URL allowlist'i uygulayın | T-EXFIL-001 |

### 6.3 Orta vadeli (P2)

| ID    | Öneri                                           | Ele Aldıkları  |
| ----- | ----------------------------------------------- | -------------- |
| R-008 | Mümkün olan yerlerde kriptografik kanal doğrulaması ekleyin | T-ACCESS-002 |
| R-009 | Yapılandırma bütünlüğü doğrulaması uygulayın    | T-PERSIST-003  |
| R-010 | Güncelleme imzalama ve sürüm sabitleme ekleyin  | T-PERSIST-002  |

---

## 7. Ekler

### 7.1 ATLAS Teknik Eşlemesi

| ATLAS ID      | Teknik Adı                    | OpenClaw Tehditleri                                              |
| ------------- | ----------------------------- | ---------------------------------------------------------------- |
| AML.T0006     | Aktif Tarama                  | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Toplama                       | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Tedarik Zinciri: AI Yazılımı  | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Tedarik Zinciri: Veri         | T-PERSIST-003                                                    |
| AML.T0031     | AI Model Bütünlüğünü Aşındırma | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                        |
| AML.T0040     | AI Model Çıkarım API Erişimi  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Düşmanca Veri Hazırlama       | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM İstem Enjeksiyonu: Doğrudan | T-EXEC-001, T-EXEC-003                                         |
| AML.T0051.001 | LLM İstem Enjeksiyonu: Dolaylı | T-EXEC-002                                                      |

### 7.2 Temel Güvenlik Dosyaları

| Path                                | Amaç                       | Risk Düzeyi |
| ----------------------------------- | -------------------------- | ----------- |
| `src/infra/exec-approvals.ts`       | Komut onay mantığı         | **Critical** |
| `src/gateway/auth.ts`               | Gateway kimlik doğrulaması | **Critical** |
| `src/infra/net/ssrf.ts`             | SSRF koruması              | **Critical** |
| `src/security/external-content.ts`  | İstem enjeksiyonu azaltımı | **Critical** |
| `src/agents/sandbox/tool-policy.ts` | Araç ilkesi zorlaması      | **Critical** |
| `src/routing/resolve-route.ts`      | Oturum yalıtımı            | **Medium**   |

### 7.3 Sözlük

| Terim                | Tanım                                                     |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | MITRE'nin AI Sistemleri için Hasım Tehdit Ortamı          |
| **ClawHub**          | OpenClaw'ın Skills pazaryeri                              |
| **Gateway**          | OpenClaw'ın mesaj yönlendirme ve kimlik doğrulama katmanı |
| **MCP**              | Model Context Protocol - araç sağlayıcı arayüzü           |
| **Prompt Injection** | Kötü amaçlı talimatların girdiye gömüldüğü saldırı        |
| **Skill**            | OpenClaw aracıları için indirilebilir uzantı              |
| **SSRF**             | Sunucu Taraflı İstek Sahteciliği                          |

---

_Bu tehdit modeli yaşayan bir belgedir. Güvenlik sorunlarını security@openclaw.ai adresine bildirin_
