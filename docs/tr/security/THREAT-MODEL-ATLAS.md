---
read_when:
    - Güvenlik duruşunu veya tehdit senaryolarını gözden geçirme
    - Güvenlik özellikleri veya denetim yanıtları üzerinde çalışma
summary: OpenClaw tehdit modelinin MITRE ATLAS çerçevesine göre eşlenmesi
title: Tehdit modeli (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-24T09:31:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e628bf60015a76d3015a7aab7b51649bdcfd2e99db148368e580839db16d2342
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 15
---

# OpenClaw Tehdit Modeli v1.0

## MITRE ATLAS Çerçevesi

**Sürüm:** 1.0-draft
**Son Güncelleme:** 2026-02-04
**Metodoloji:** MITRE ATLAS + Veri Akışı Diyagramları
**Çerçeve:** [MITRE ATLAS](https://atlas.mitre.org/) (AI Sistemleri için Saldırgan Tehdit Ortamı)

### Çerçeve Atfı

Bu tehdit modeli, AI/ML sistemlerine yönelik düşmanca tehditleri belgelemek için sektör standardı çerçeve olan [MITRE ATLAS](https://atlas.mitre.org/) üzerine kuruludur. ATLAS, AI güvenlik topluluğuyla iş birliği içinde [MITRE](https://www.mitre.org/) tarafından sürdürülmektedir.

**Temel ATLAS Kaynakları:**

- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Tactics](https://atlas.mitre.org/tactics/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Contributing to ATLAS](https://atlas.mitre.org/resources/contribute)

### Bu Tehdit Modeline Katkı

Bu, OpenClaw topluluğu tarafından sürdürülen yaşayan bir belgedir. Katkı yönergeleri için [CONTRIBUTING-THREAT-MODEL.md](/tr/security/CONTRIBUTING-THREAT-MODEL) sayfasına bakın:

- Yeni tehditleri bildirme
- Mevcut tehditleri güncelleme
- Saldırı zincirleri önerme
- Azaltım önerme

---

## 1. Giriş

### 1.1 Amaç

Bu tehdit modeli, özellikle AI/ML sistemleri için tasarlanmış MITRE ATLAS çerçevesini kullanarak OpenClaw AI ajan platformu ve ClawHub skill pazaryerine yönelik düşmanca tehditleri belgelemektedir.

### 1.2 Kapsam

| Bileşen                | Dahil | Notlar                                           |
| ---------------------- | ----- | ------------------------------------------------ |
| OpenClaw Agent Runtime | Evet  | Çekirdek ajan yürütme, araç çağrıları, oturumlar |
| Gateway                | Evet  | Kimlik doğrulama, yönlendirme, kanal entegrasyonu |
| Kanal Entegrasyonları  | Evet  | WhatsApp, Telegram, Discord, Signal, Slack vb.   |
| ClawHub Marketplace    | Evet  | Skill yayımlama, moderasyon, dağıtım             |
| MCP Sunucuları         | Evet  | Harici araç sağlayıcıları                        |
| Kullanıcı Cihazları    | Kısmi | Mobil uygulamalar, masaüstü istemcileri          |

### 1.3 Kapsam Dışı

Bu tehdit modeli için açıkça kapsam dışı bırakılmış hiçbir şey yoktur.

---

## 2. Sistem Mimarisi

### 2.1 Güven Sınırları

```
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
│              GÜVEN SINIRI 1: Kanal Erişimi                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device Pairing (1s DM / 5d Node grace period)         │   │
│  │  • AllowFrom / AllowList doğrulama                       │   │
│  │  • Token/Password/Tailscale auth                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              GÜVEN SINIRI 2: Oturum Yalıtımı                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AJAN OTURUMLARI                         │   │
│  │  • Oturum anahtarı = agent:channel:peer                  │   │
│  │  • Ajan başına araç ilkeleri                             │   │
│  │  • Transkript günlükleme                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              GÜVEN SINIRI 3: Araç Yürütme                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  YÜRÜTME SANDBOX'I                        │   │
│  │  • Docker sandbox VEYA Host (exec-approvals)             │   │
│  │  • Node uzak yürütme                                     │   │
│  │  • SSRF koruması (DNS sabitleme + IP engelleme)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              GÜVEN SINIRI 4: Harici İçerik                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            GETİRİLEN URL'LER / E-POSTALAR / WEBHOOK'LAR  │   │
│  │  • Harici içerik sarmalama (XML etiketleri)              │   │
│  │  • Güvenlik bildirimi ekleme                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              GÜVEN SINIRI 5: Tedarik Zinciri                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill yayımlama (semver, SKILL.md zorunlu)            │   │
│  │  • Desen tabanlı moderasyon bayrakları                   │   │
│  │  • VirusTotal taraması (yakında)                         │   │
│  │  • GitHub hesap yaşı doğrulaması                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Veri Akışları

| Akış | Kaynak  | Hedef       | Veri               | Koruma               |
| ---- | ------- | ----------- | ------------------ | -------------------- |
| F1   | Kanal   | Gateway     | Kullanıcı mesajları | TLS, AllowFrom       |
| F2   | Gateway | Ajan        | Yönlendirilmiş mesajlar | Oturum yalıtımı  |
| F3   | Ajan    | Araçlar     | Araç çağrıları     | İlke uygulaması      |
| F4   | Ajan    | Harici      | web_fetch istekleri | SSRF engelleme      |
| F5   | ClawHub | Ajan        | Skill kodu         | Moderasyon, tarama   |
| F6   | Ajan    | Kanal       | Yanıtlar           | Çıktı filtreleme     |

---

## 3. ATLAS Taktiğine Göre Tehdit Analizi

### 3.1 Reconnaissance (AML.TA0002)

#### T-RECON-001: Ajan Uç Noktası Keşfi

| Öznitelik              | Değer                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0006 - Active Scanning                                         |
| **Açıklama**           | Saldırgan, açığa çıkarılmış OpenClaw Gateway uç noktalarını tarar   |
| **Saldırı Vektörü**    | Ağ taraması, shodan sorguları, DNS numaralandırma                  |
| **Etkilenen Bileşenler** | Gateway, açığa çıkarılmış API uç noktaları                       |
| **Mevcut Azaltımlar**  | Tailscale auth seçeneği, varsayılan olarak loopback'e bağlama      |
| **Artık Risk**         | Orta - Genel Gateway'ler keşfedilebilir                            |
| **Öneriler**           | Güvenli dağıtımı belgeleyin, keşif uç noktalarına hız sınırlaması ekleyin |

#### T-RECON-002: Kanal Entegrasyonu Yoklaması

| Öznitelik              | Değer                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0006 - Active Scanning                                       |
| **Açıklama**           | Saldırgan, AI tarafından yönetilen hesapları belirlemek için mesajlaşma kanallarını yoklar |
| **Saldırı Vektörü**    | Test mesajları gönderme, yanıt örüntülerini gözlemleme            |
| **Etkilenen Bileşenler** | Tüm kanal entegrasyonları                                      |
| **Mevcut Azaltımlar**  | Buna özgü yok                                                     |
| **Artık Risk**         | Düşük - Yalnızca keşiften sınırlı değer elde edilir               |
| **Öneriler**           | Yanıt zamanlamasında rastgeleleştirme düşünün                     |

---

### 3.2 Initial Access (AML.TA0004)

#### T-ACCESS-001: Pairing Kodu Ele Geçirme

| Öznitelik              | Değer                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access                                                                      |
| **Açıklama**           | Saldırgan, Pairing geçiş süresi sırasında Pairing kodunu ele geçirir (DM kanal Pairing için 1s, Node Pairing için 5d) |
| **Saldırı Vektörü**    | Omuz üzerinden izleme, ağ dinleme, sosyal mühendislik                                                         |
| **Etkilenen Bileşenler** | Device Pairing sistemi                                                                                      |
| **Mevcut Azaltımlar**  | 1s sona erme (DM Pairing) / 5d sona erme (Node Pairing), kodların mevcut kanal üzerinden gönderilmesi        |
| **Artık Risk**         | Orta - Geçiş süresi suistimal edilebilir                                                                       |
| **Öneriler**           | Geçiş süresini azaltın, onay adımı ekleyin                                                                    |

#### T-ACCESS-002: AllowFrom Sahteciliği

| Öznitelik              | Değer                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access                                     |
| **Açıklama**           | Saldırgan, kanalda izinli gönderen kimliğini taklit eder                      |
| **Saldırı Vektörü**    | Kanala bağlı - telefon numarası sahteciliği, kullanıcı adı taklidi            |
| **Etkilenen Bileşenler** | Kanal başına AllowFrom doğrulaması                                         |
| **Mevcut Azaltımlar**  | Kanala özgü kimlik doğrulama                                                  |
| **Artık Risk**         | Orta - Bazı kanallar sahteciliğe açıktır                                      |
| **Öneriler**           | Kanala özgü riskleri belgeleyin, mümkün olan yerlerde kriptografik doğrulama ekleyin |

#### T-ACCESS-003: Token Çalınması

| Öznitelik              | Değer                                                        |
| ---------------------- | ------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access                    |
| **Açıklama**           | Saldırgan, yapılandırma dosyalarından kimlik doğrulama token'larını çalar |
| **Saldırı Vektörü**    | Zararlı yazılım, yetkisiz cihaz erişimi, yapılandırma yedeği açığa çıkması |
| **Etkilenen Bileşenler** | `~/.openclaw/credentials/`, yapılandırma depolama         |
| **Mevcut Azaltımlar**  | Dosya izinleri                                               |
| **Artık Risk**         | Yüksek - Token'lar düz metin olarak saklanır                 |
| **Öneriler**           | Dinlenme hâlindeki token şifrelemesini uygulayın, token döndürme ekleyin |

---

### 3.3 Execution (AML.TA0005)

#### T-EXEC-001: Doğrudan İstem Enjeksiyonu

| Öznitelik              | Değer                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **ATLAS ID**           | AML.T0051.000 - LLM Prompt Injection: Direct                                               |
| **Açıklama**           | Saldırgan, ajan davranışını manipüle etmek için hazırlanmış istemler gönderir              |
| **Saldırı Vektörü**    | Düşmanca talimatlar içeren kanal mesajları                                                 |
| **Etkilenen Bileşenler** | Ajan LLM'i, tüm giriş yüzeyleri                                                         |
| **Mevcut Azaltımlar**  | Desen algılama, harici içerik sarmalama                                                    |
| **Artık Risk**         | Kritik - Yalnızca algılama var, engelleme yok; gelişmiş saldırılar atlatır                 |
| **Öneriler**           | Çok katmanlı savunma, çıktı doğrulama, hassas eylemler için kullanıcı onayı uygulayın      |

#### T-EXEC-002: Dolaylı İstem Enjeksiyonu

| Öznitelik              | Değer                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.001 - LLM Prompt Injection: Indirect              |
| **Açıklama**           | Saldırgan, getirilen içerik içine kötü amaçlı talimatlar gömer |
| **Saldırı Vektörü**    | Kötü amaçlı URL'ler, zehirlenmiş e-postalar, ele geçirilmiş Webhook'lar |
| **Etkilenen Bileşenler** | `web_fetch`, e-posta alımı, harici veri kaynakları        |
| **Mevcut Azaltımlar**  | XML etiketleri ve güvenlik bildirimi ile içerik sarmalama   |
| **Artık Risk**         | Yüksek - LLM sarmalayıcı talimatlarını yok sayabilir        |
| **Öneriler**           | İçerik temizleme, ayrı yürütme bağlamları uygulayın         |

#### T-EXEC-003: Araç Argümanı Enjeksiyonu

| Öznitelik              | Değer                                                         |
| ---------------------- | ------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0051.000 - LLM Prompt Injection: Direct                  |
| **Açıklama**           | Saldırgan, istem enjeksiyonu üzerinden araç argümanlarını manipüle eder |
| **Saldırı Vektörü**    | Araç parametre değerlerini etkileyen hazırlanmış istemler     |
| **Etkilenen Bileşenler** | Tüm araç çağrıları                                         |
| **Mevcut Azaltımlar**  | Tehlikeli komutlar için exec onayları                         |
| **Artık Risk**         | Yüksek - Kullanıcı yargısına dayanır                          |
| **Öneriler**           | Argüman doğrulaması, parametreli araç çağrıları uygulayın     |

#### T-EXEC-004: Exec Onayını Atlama

| Öznitelik              | Değer                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **ATLAS ID**           | AML.T0043 - Craft Adversarial Data                          |
| **Açıklama**           | Saldırgan, onay allowlist'ini aşan komutlar üretir          |
| **Saldırı Vektörü**    | Komut gizleme, takma ad sömürüsü, yol manipülasyonu         |
| **Etkilenen Bileşenler** | `exec-approvals.ts`, komut izin listesi                  |
| **Mevcut Azaltımlar**  | Allowlist + ask mode                                        |
| **Artık Risk**         | Yüksek - Komut temizleme yok                                |
| **Öneriler**           | Komut normalizasyonu uygulayın, blocklist'i genişletin      |

---

### 3.4 Persistence (AML.TA0006)

#### T-PERSIST-001: Kötü Amaçlı Skill Kurulumu

| Öznitelik              | Değer                                                                     |
| ---------------------- | ------------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.001 - Supply Chain Compromise: AI Software                      |
| **Açıklama**           | Saldırgan, ClawHub'a kötü amaçlı skill yayımlar                           |
| **Saldırı Vektörü**    | Hesap oluşturma, gizli kötü amaçlı kod içeren skill yayımlama             |
| **Etkilenen Bileşenler** | ClawHub, skill yükleme, ajan yürütme                                   |
| **Mevcut Azaltımlar**  | GitHub hesap yaşı doğrulaması, desen tabanlı moderasyon bayrakları        |
| **Artık Risk**         | Kritik - Sandbox yok, inceleme sınırlı                                    |
| **Öneriler**           | VirusTotal entegrasyonu (devam ediyor), skill sandboxing, topluluk incelemesi |

#### T-PERSIST-002: Skill Güncelleme Zehirleme

| Öznitelik              | Değer                                                           |
| ---------------------- | --------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.001 - Supply Chain Compromise: AI Software            |
| **Açıklama**           | Saldırgan, popüler bir skill'i ele geçirip kötü amaçlı güncelleme gönderir |
| **Saldırı Vektörü**    | Hesap ele geçirme, skill sahibine sosyal mühendislik            |
| **Etkilenen Bileşenler** | ClawHub sürümleme, otomatik güncelleme akışları              |
| **Mevcut Azaltımlar**  | Sürüm parmak izi alma                                           |
| **Artık Risk**         | Yüksek - Otomatik güncellemeler kötü amaçlı sürümleri çekebilir |
| **Öneriler**           | Güncelleme imzalama, geri alma yeteneği, sürüm sabitleme uygulayın |

#### T-PERSIST-003: Ajan Yapılandırmasını Kurcalama

| Öznitelik              | Değer                                                            |
| ---------------------- | ---------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0010.002 - Supply Chain Compromise: Data                    |
| **Açıklama**           | Saldırgan, erişimi kalıcı kılmak için ajan yapılandırmasını değiştirir |
| **Saldırı Vektörü**    | Yapılandırma dosyası değişikliği, ayar enjeksiyonu               |
| **Etkilenen Bileşenler** | Ajan yapılandırması, araç ilkeleri                            |
| **Mevcut Azaltımlar**  | Dosya izinleri                                                   |
| **Artık Risk**         | Orta - Yerel erişim gerektirir                                   |
| **Öneriler**           | Yapılandırma bütünlüğü doğrulaması, yapılandırma değişiklikleri için denetim günlüğü uygulayın |

---

### 3.5 Defense Evasion (AML.TA0007)

#### T-EVADE-001: Moderasyon Deseni Atlama

| Öznitelik              | Değer                                                                   |
| ---------------------- | ----------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0043 - Craft Adversarial Data                                      |
| **Açıklama**           | Saldırgan, moderasyon desenlerinden kaçmak için skill içeriği üretir    |
| **Saldırı Vektörü**    | Unicode homoglyph'ler, kodlama hileleri, dinamik yükleme                |
| **Etkilenen Bileşenler** | `ClawHub moderation.ts`                                               |
| **Mevcut Azaltımlar**  | Desen tabanlı `FLAG_RULES`                                              |
| **Artık Risk**         | Yüksek - Basit regex kolayca aşılır                                     |
| **Öneriler**           | Davranışsal analiz (VirusTotal Code Insight), AST tabanlı algılama ekleyin |

#### T-EVADE-002: İçerik Sarmalayıcıdan Kaçış

| Öznitelik              | Değer                                                      |
| ---------------------- | ---------------------------------------------------------- |
| **ATLAS ID**           | AML.T0043 - Craft Adversarial Data                         |
| **Açıklama**           | Saldırgan, XML sarmalayıcı bağlamından kaçan içerik üretir |
| **Saldırı Vektörü**    | Etiket manipülasyonu, bağlam karışıklığı, talimat geçersiz kılma |
| **Etkilenen Bileşenler** | Harici içerik sarmalama                                  |
| **Mevcut Azaltımlar**  | XML etiketleri + güvenlik bildirimi                        |
| **Artık Risk**         | Orta - Yeni kaçışlar düzenli olarak keşfediliyor           |
| **Öneriler**           | Birden çok sarmalayıcı katmanı, çıktı tarafı doğrulama     |

---

### 3.6 Discovery (AML.TA0008)

#### T-DISC-001: Araç Sayımı

| Öznitelik              | Değer                                                  |
| ---------------------- | ------------------------------------------------------ |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access              |
| **Açıklama**           | Saldırgan, istem verme yoluyla kullanılabilir araçları sayar |
| **Saldırı Vektörü**    | "Hangi araçlara sahipsin?" tarzı sorgular              |
| **Etkilenen Bileşenler** | Ajan araç kayıt defteri                              |
| **Mevcut Azaltımlar**  | Buna özgü yok                                          |
| **Artık Risk**         | Düşük - Araçlar genellikle belgelidir                  |
| **Öneriler**           | Araç görünürlüğü denetimlerini değerlendirin           |

#### T-DISC-002: Oturum Verisi Çıkarma

| Öznitelik              | Değer                                                  |
| ---------------------- | ------------------------------------------------------ |
| **ATLAS ID**           | AML.T0040 - AI Model Inference API Access              |
| **Açıklama**           | Saldırgan, oturum bağlamından hassas verileri çıkarır  |
| **Saldırı Vektörü**    | "Ne konuşmuştuk?" sorguları, bağlam yoklaması          |
| **Etkilenen Bileşenler** | Oturum transkriptleri, bağlam penceresi              |
| **Mevcut Azaltımlar**  | Gönderen başına oturum yalıtımı                        |
| **Artık Risk**         | Orta - Oturum içi verilere erişilebilir                |
| **Öneriler**           | Bağlam içinde hassas veri sansürleme uygulayın         |

---

### 3.7 Collection & Exfiltration (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: web_fetch üzerinden veri hırsızlığı

| Öznitelik              | Değer                                                                   |
| ---------------------- | ----------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0009 - Collection                                                  |
| **Açıklama**           | Saldırgan, ajana veriyi harici URL'ye göndermesi talimatı vererek veri sızdırır |
| **Saldırı Vektörü**    | Ajanın saldırgan sunucusuna veri POST etmesine neden olan istem enjeksiyonu |
| **Etkilenen Bileşenler** | `web_fetch` aracı                                                     |
| **Mevcut Azaltımlar**  | İç ağlar için SSRF engelleme                                            |
| **Artık Risk**         | Yüksek - Harici URL'lere izin verilir                                  |
| **Öneriler**           | URL allowlist'i, veri sınıflandırma farkındalığı uygulayın              |

#### T-EXFIL-002: Yetkisiz Mesaj Gönderme

| Öznitelik              | Değer                                                             |
| ---------------------- | ----------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0009 - Collection                                            |
| **Açıklama**           | Saldırgan, ajanın hassas veri içeren mesajlar göndermesine neden olur |
| **Saldırı Vektörü**    | Ajanın saldırgana mesaj göndermesine neden olan istem enjeksiyonu |
| **Etkilenen Bileşenler** | Message aracı, kanal entegrasyonları                            |
| **Mevcut Azaltımlar**  | Giden mesajlaşma geçitlemesi                                      |
| **Artık Risk**         | Orta - Geçitleme aşılabilir                                      |
| **Öneriler**           | Yeni alıcılar için açık onay gerektirin                           |

#### T-EXFIL-003: Kimlik Bilgisi Toplama

| Öznitelik              | Değer                                                    |
| ---------------------- | -------------------------------------------------------- |
| **ATLAS ID**           | AML.T0009 - Collection                                   |
| **Açıklama**           | Kötü amaçlı skill, ajan bağlamından kimlik bilgileri toplar |
| **Saldırı Vektörü**    | Skill kodu ortam değişkenlerini, yapılandırma dosyalarını okur |
| **Etkilenen Bileşenler** | Skill yürütme ortamı                                   |
| **Mevcut Azaltımlar**  | Skill'lere özgü yok                                      |
| **Artık Risk**         | Kritik - Skill'ler ajan ayrıcalıklarıyla çalışır         |
| **Öneriler**           | Skill sandboxing, kimlik bilgisi yalıtımı                |

---

### 3.8 Impact (AML.TA0011)

#### T-IMPACT-001: Yetkisiz Komut Yürütme

| Öznitelik              | Değer                                                |
| ---------------------- | ---------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Erode AI Model Integrity                 |
| **Açıklama**           | Saldırgan, kullanıcı sisteminde keyfi komutlar yürütür |
| **Saldırı Vektörü**    | İstem enjeksiyonu ile exec onayı atlamanın birleşimi |
| **Etkilenen Bileşenler** | Bash aracı, komut yürütme                          |
| **Mevcut Azaltımlar**  | Exec onayları, Docker sandbox seçeneği               |
| **Artık Risk**         | Kritik - Sandbox olmadan host yürütme                |
| **Öneriler**           | Varsayılanı sandbox yapın, onay UX'ini iyileştirin   |

#### T-IMPACT-002: Kaynak Tüketme (DoS)

| Öznitelik              | Değer                                               |
| ---------------------- | --------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Erode AI Model Integrity                |
| **Açıklama**           | Saldırgan, API kredilerini veya hesaplama kaynaklarını tüketir |
| **Saldırı Vektörü**    | Otomatik mesaj yağdırma, pahalı araç çağrıları      |
| **Etkilenen Bileşenler** | Gateway, ajan oturumları, API sağlayıcısı         |
| **Mevcut Azaltımlar**  | Yok                                                 |
| **Artık Risk**         | Yüksek - Hız sınırlaması yok                        |
| **Öneriler**           | Gönderen başına hız sınırı, maliyet bütçeleri uygulayın |

#### T-IMPACT-003: İtibar Zedelenmesi

| Öznitelik              | Değer                                                    |
| ---------------------- | -------------------------------------------------------- |
| **ATLAS ID**           | AML.T0031 - Erode AI Model Integrity                     |
| **Açıklama**           | Saldırgan, ajanın zararlı/saldırgan içerik göndermesine neden olur |
| **Saldırı Vektörü**    | Uygunsuz yanıtlar üreten istem enjeksiyonu               |
| **Etkilenen Bileşenler** | Çıktı üretimi, kanal mesajlaşması                      |
| **Mevcut Azaltımlar**  | LLM sağlayıcı içerik ilkeleri                            |
| **Artık Risk**         | Orta - Sağlayıcı filtreleri kusursuz değil               |
| **Öneriler**           | Çıktı filtreleme katmanı, kullanıcı denetimleri          |

---

## 4. ClawHub Tedarik Zinciri Analizi

### 4.1 Mevcut Güvenlik Denetimleri

| Denetim              | Uygulama                    | Etkinlik                                              |
| -------------------- | --------------------------- | ----------------------------------------------------- |
| GitHub Hesap Yaşı    | `requireGitHubAccountAge()` | Orta - Yeni saldırganlar için eşiği yükseltir         |
| Yol Temizleme        | `sanitizePath()`            | Yüksek - Path traversal'ı önler                       |
| Dosya Türü Doğrulama | `isTextFile()`              | Orta - Yalnızca metin dosyaları, ama yine de kötü amaçlı olabilir |
| Boyut Sınırları      | Toplam 50MB paket           | Yüksek - Kaynak tüketimini önler                      |
| Zorunlu SKILL.md     | Zorunlu readme              | Düşük güvenlik değeri - Yalnızca bilgilendirici       |
| Desen Moderasyonu    | `moderation.ts` içindeki `FLAG_RULES` | Düşük - Kolayca aşılabilir                   |
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

- Yalnızca slug, displayName, summary, frontmatter, metadata ve dosya yollarını kontrol eder
- Gerçek skill kod içeriğini analiz etmez
- Basit regex, gizleme ile kolayca aşılır
- Davranışsal analiz yok

### 4.3 Planlanan İyileştirmeler

| İyileştirme            | Durum                                 | Etki                                                               |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| VirusTotal Entegrasyonu | Devam ediyor                         | Yüksek - Code Insight davranışsal analizi                          |
| Topluluk Bildirimi     | Kısmi (`skillReports` tablosu var)    | Orta                                                               |
| Denetim Günlüğü        | Kısmi (`auditLogs` tablosu var)       | Orta                                                               |
| Rozet Sistemi          | Uygulandı                             | Orta - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Risk Matrisi

### 5.1 Olasılık ve Etki

| Tehdit ID     | Olasılık | Etki     | Risk Düzeyi  | Öncelik |
| ------------- | -------- | -------- | ------------ | ------- |
| T-EXEC-001    | Yüksek   | Kritik   | **Kritik**   | P0      |
| T-PERSIST-001 | Yüksek   | Kritik   | **Kritik**   | P0      |
| T-EXFIL-003   | Orta     | Kritik   | **Kritik**   | P0      |
| T-IMPACT-001  | Orta     | Kritik   | **Yüksek**   | P1      |
| T-EXEC-002    | Yüksek   | Yüksek   | **Yüksek**   | P1      |
| T-EXEC-004    | Orta     | Yüksek   | **Yüksek**   | P1      |
| T-ACCESS-003  | Orta     | Yüksek   | **Yüksek**   | P1      |
| T-EXFIL-001   | Orta     | Yüksek   | **Yüksek**   | P1      |
| T-IMPACT-002  | Yüksek   | Orta     | **Yüksek**   | P1      |
| T-EVADE-001   | Yüksek   | Orta     | **Orta**     | P2      |
| T-ACCESS-001  | Düşük    | Yüksek   | **Orta**     | P2      |
| T-ACCESS-002  | Düşük    | Yüksek   | **Orta**     | P2      |
| T-PERSIST-002 | Düşük    | Yüksek   | **Orta**     | P2      |

### 5.2 Kritik Yol Saldırı Zincirleri

**Saldırı Zinciri 1: Skill Tabanlı Veri Hırsızlığı**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Kötü amaçlı skill yayımla) → (Moderasyondan kaç) → (Kimlik bilgilerini topla)
```

**Saldırı Zinciri 2: İstem Enjeksiyonundan RCE'ye**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(İstem enjekte et) → (Exec onayını atla) → (Komut yürüt)
```

**Saldırı Zinciri 3: Getirilen İçerik Üzerinden Dolaylı Enjeksiyon**

```
T-EXEC-002 → T-EXFIL-001 → Harici sızdırma
(URL içeriğini zehirle) → (Ajan getirir ve talimatları izler) → (Veri saldırgana gönderilir)
```

---

## 6. Öneriler Özeti

### 6.1 Hemen (P0)

| ID    | Öneri                                      | Ele Aldığı Tehditler         |
| ----- | ------------------------------------------ | ---------------------------- |
| R-001 | VirusTotal entegrasyonunu tamamlayın       | T-PERSIST-001, T-EVADE-001   |
| R-002 | Skill sandboxing uygulayın                 | T-PERSIST-001, T-EXFIL-003   |
| R-003 | Hassas eylemler için çıktı doğrulaması ekleyin | T-EXEC-001, T-EXEC-002   |

### 6.2 Kısa vadeli (P1)

| ID    | Öneri                                     | Ele Aldığı Tehditler |
| ----- | ----------------------------------------- | -------------------- |
| R-004 | Hız sınırlaması uygulayın                 | T-IMPACT-002         |
| R-005 | Dinlenme hâlinde token şifrelemesi ekleyin | T-ACCESS-003        |
| R-006 | Exec onay UX'ini ve doğrulamasını iyileştirin | T-EXEC-004       |
| R-007 | `web_fetch` için URL allowlist uygulayın  | T-EXFIL-001          |

### 6.3 Orta vadeli (P2)

| ID    | Öneri                                              | Ele Aldığı Tehditler |
| ----- | -------------------------------------------------- | -------------------- |
| R-008 | Mümkün olan yerlerde kriptografik kanal doğrulaması ekleyin | T-ACCESS-002 |
| R-009 | Yapılandırma bütünlüğü doğrulaması uygulayın       | T-PERSIST-003        |
| R-010 | Güncelleme imzalama ve sürüm sabitleme ekleyin     | T-PERSIST-002        |

---

## 7. Ekler

### 7.1 ATLAS Teknik Eşlemesi

| ATLAS ID      | Teknik Adı                     | OpenClaw Tehditleri                                                 |
| ------------- | ------------------------------ | ------------------------------------------------------------------- |
| AML.T0006     | Active Scanning                | T-RECON-001, T-RECON-002                                            |
| AML.T0009     | Collection                     | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                               |
| AML.T0010.001 | Supply Chain: AI Software      | T-PERSIST-001, T-PERSIST-002                                        |
| AML.T0010.002 | Supply Chain: Data             | T-PERSIST-003                                                       |
| AML.T0031     | Erode AI Model Integrity       | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                            |
| AML.T0040     | AI Model Inference API Access  | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002    |
| AML.T0043     | Craft Adversarial Data         | T-EXEC-004, T-EVADE-001, T-EVADE-002                                |
| AML.T0051.000 | LLM Prompt Injection: Direct   | T-EXEC-001, T-EXEC-003                                              |
| AML.T0051.001 | LLM Prompt Injection: Indirect | T-EXEC-002                                                          |

### 7.2 Temel güvenlik dosyaları

| Yol                                 | Amaç                        | Risk Düzeyi |
| ----------------------------------- | --------------------------- | ----------- |
| `src/infra/exec-approvals.ts`       | Komut onay mantığı          | **Kritik**  |
| `src/gateway/auth.ts`               | Gateway kimlik doğrulaması  | **Kritik**  |
| `src/infra/net/ssrf.ts`             | SSRF koruması               | **Kritik**  |
| `src/security/external-content.ts`  | İstem enjeksiyonu azaltımı  | **Kritik**  |
| `src/agents/sandbox/tool-policy.ts` | Araç ilkesi uygulaması      | **Kritik**  |
| `src/routing/resolve-route.ts`      | Oturum yalıtımı             | **Orta**    |

### 7.3 Sözlük

| Terim                | Tanım                                                    |
| -------------------- | -------------------------------------------------------- |
| **ATLAS**            | MITRE'ın AI Sistemleri için Saldırgan Tehdit Ortamı      |
| **ClawHub**          | OpenClaw'ın skill pazaryeri                              |
| **Gateway**          | OpenClaw'ın mesaj yönlendirme ve kimlik doğrulama katmanı |
| **MCP**              | Model Context Protocol - araç sağlayıcı arayüzü          |
| **Prompt Injection** | Kötü amaçlı talimatların girdiye gömüldüğü saldırı       |
| **Skill**            | OpenClaw ajanları için indirilebilir eklenti             |
| **SSRF**             | Server-Side Request Forgery                              |

---

_Bu tehdit modeli yaşayan bir belgedir. Güvenlik sorunlarını security@openclaw.ai adresine bildirin_

## İlgili

- [Biçimsel doğrulama](/tr/security/formal-verification)
- [Tehdit modeline katkı](/tr/security/CONTRIBUTING-THREAT-MODEL)
