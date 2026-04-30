---
read_when:
    - Güvenlik duruşunu veya tehdit senaryolarını inceleme
    - Güvenlik özellikleri veya denetim yanıtları üzerinde çalışma
summary: MITRE ATLAS çerçevesine eşlenen OpenClaw tehdit modeli
title: Tehdit modeli (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-30T09:45:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: d929addb829b92d650ef6caecb267fb154f6f9f7d28be7aa87851569931f5228
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

# OpenClaw Tehdit Modeli v1.0

## MITRE ATLAS Çerçevesi

**Sürüm:** 1.0-draft
**Son Güncelleme:** 2026-02-04
**Metodoloji:** MITRE ATLAS + Veri Akış Diyagramları
**Çerçeve:** [MITRE ATLAS](https://atlas.mitre.org/) (AI Sistemleri için Hasmane Tehdit Ortamı)

### Çerçeve atfı

Bu tehdit modeli, AI/ML sistemlerine yönelik hasmane tehditleri belgelemek için sektör standardı çerçeve olan [MITRE ATLAS](https://atlas.mitre.org/) üzerine kurulmuştur. ATLAS, AI güvenliği topluluğuyla iş birliği içinde [MITRE](https://www.mitre.org/) tarafından sürdürülür.

**Temel ATLAS Kaynakları:**

- [ATLAS Teknikleri](https://atlas.mitre.org/techniques/)
- [ATLAS Taktikleri](https://atlas.mitre.org/tactics/)
- [ATLAS Vaka Çalışmaları](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [ATLAS’a Katkıda Bulunma](https://atlas.mitre.org/resources/contribute)

### Bu Tehdit Modeline Katkıda Bulunma

Bu, OpenClaw topluluğu tarafından sürdürülen yaşayan bir belgedir. Katkıda bulunma yönergeleri için [CONTRIBUTING-THREAT-MODEL.md](/tr/security/CONTRIBUTING-THREAT-MODEL) sayfasına bakın:

- Yeni tehditleri bildirme
- Mevcut tehditleri güncelleme
- Saldırı zincirleri önerme
- Azaltımlar önerme

---

## 1. Giriş

### 1.1 Amaç

Bu tehdit modeli, AI/ML sistemleri için özel olarak tasarlanmış MITRE ATLAS çerçevesini kullanarak OpenClaw AI ajan platformuna ve ClawHub Skills pazaryerine yönelik hasmane tehditleri belgeler.

### 1.2 Kapsam

| Bileşen                | Dahil | Notlar                                           |
| ---------------------- | ----- | ------------------------------------------------ |
| OpenClaw Ajan Çalışma Zamanı | Evet | Çekirdek ajan yürütmesi, araç çağrıları, oturumlar |
| Gateway                | Evet  | Kimlik doğrulama, yönlendirme, kanal entegrasyonu |
| Kanal Entegrasyonları  | Evet  | WhatsApp, Telegram, Discord, Signal, Slack, vb. |
| ClawHub Pazaryeri      | Evet  | Skill yayımlama, moderasyon, dağıtım             |
| MCP Sunucuları         | Evet  | Harici araç sağlayıcıları                        |
| Kullanıcı Cihazları    | Kısmi | Mobil uygulamalar, masaüstü istemcileri          |

### 1.3 Kapsam Dışı

Bu tehdit modeli için hiçbir şey açıkça kapsam dışında değildir.

---

## 2. Sistem Mimarisi

### 2.1 Güven Sınırları

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 1: Channel Access                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device Pairing (1h DM / 5m node grace period)           │   │
│  │  • AllowFrom / AllowList validation                       │   │
│  │  • Token/Password/Tailscale auth                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 2: Session Isolation              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • Tool policies per agent                                │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 3: Tool Execution                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  EXECUTION SANDBOX                        │   │
│  │  • Docker sandbox OR Host (exec-approvals)                │   │
│  │  • Node remote execution                                  │   │
│  │  • SSRF protection (DNS pinning + IP blocking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 4: External Content               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FETCHED URLs / EMAILS / WEBHOOKS             │   │
│  │  • External content wrapping (XML tags)                   │   │
│  │  • Security notice injection                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 5: Supply Chain                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill publishing (semver, SKILL.md required)           │   │
│  │  • Pattern-based moderation flags                         │   │
│  │  • VirusTotal scanning (coming soon)                      │   │
│  │  • GitHub account age verification                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Veri Akışları

| Akış | Kaynak  | Hedef       | Veri               | Koruma               |
| ---- | ------- | ----------- | ------------------ | -------------------- |
| F1   | Kanal   | Gateway     | Kullanıcı mesajları | TLS, AllowFrom       |
| F2   | Gateway | Ajan        | Yönlendirilen mesajlar | Oturum izolasyonu |
| F3   | Ajan    | Araçlar     | Araç çağrıları      | Politika uygulama    |
| F4   | Ajan    | Harici      | web_fetch istekleri | SSRF engelleme       |
| F5   | ClawHub | Ajan        | Skill kodu          | Moderasyon, tarama   |
| F6   | Ajan    | Kanal       | Yanıtlar            | Çıktı filtreleme     |

---

## 3. ATLAS Taktiğine Göre Tehdit Analizi

### 3.1 Keşif (AML.TA0002)

#### T-RECON-001: Ajan Uç Noktası Keşfi

| Öznitelik              | Değer                                                                |
| ---------------------- | -------------------------------------------------------------------- |
| **ATLAS Kimliği**      | AML.T0006 - Etkin Tarama                                             |
| **Açıklama**           | Saldırgan, açıkta kalan OpenClaw Gateway uç noktalarını tarar        |
| **Saldırı Vektörü**    | Ağ taraması, shodan sorguları, DNS numaralandırması                  |
| **Etkilenen Bileşenler** | Gateway, açıkta kalan API uç noktaları                             |
| **Mevcut Azaltımlar**  | Tailscale kimlik doğrulama seçeneği, varsayılan olarak loopback’e bağlama |
| **Artık Risk**         | Orta - Genel erişime açık Gateway’ler keşfedilebilir                 |
| **Öneriler**           | Güvenli dağıtımı belgeleyin, keşif uç noktalarına hız sınırlaması ekleyin |

#### T-RECON-002: Kanal Entegrasyonu Yoklaması

| Öznitelik              | Değer                                                                        |
| ---------------------- | ---------------------------------------------------------------------------- |
| **ATLAS Kimliği**      | AML.T0006 - Aktif Tarama                                                     |
| **Açıklama**           | Saldırgan, yapay zeka tarafından yönetilen hesapları belirlemek için mesajlaşma kanallarını yoklar |
| **Saldırı Vektörü**    | Test mesajları gönderme, yanıt örüntülerini gözlemleme                       |
| **Etkilenen Bileşenler** | Tüm kanal entegrasyonları                                                   |
| **Mevcut Önlemler**    | Belirli bir önlem yok                                                        |
| **Artık Risk**         | Düşük - Tek başına keşiften elde edilen değer sınırlı                        |
| **Öneriler**           | Yanıt zamanlaması rastgeleleştirmesini değerlendirin                         |

---

### 3.2 İlk Erişim (AML.TA0004)

#### T-ACCESS-001: Eşleştirme Kodu Yakalama

| Öznitelik              | Değer                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| **ATLAS Kimliği**      | AML.T0040 - Yapay Zeka Model Çıkarımı API Erişimi                                                             |
| **Açıklama**           | Saldırgan, eşleştirme tolerans süresi sırasında eşleştirme kodunu yakalar (DM kanalı eşleştirmesi için 1s, Node eşleştirmesi için 5d) |
| **Saldırı Vektörü**    | Omuz üstünden izleme, ağ dinleme, sosyal mühendislik                                                          |
| **Etkilenen Bileşenler** | Cihaz eşleştirme sistemi                                                                                    |
| **Mevcut Önlemler**    | 1s süre sonu (DM eşleştirmesi) / 5d süre sonu (Node eşleştirmesi), kodların mevcut kanal üzerinden gönderilmesi |
| **Artık Risk**         | Orta - Tolerans süresi istismar edilebilir                                                                    |
| **Öneriler**           | Tolerans süresini azaltın, onay adımı ekleyin                                                                 |

#### T-ACCESS-002: AllowFrom Sahteciliği

| Öznitelik              | Değer                                                                          |
| ---------------------- | ------------------------------------------------------------------------------ |
| **ATLAS Kimliği**      | AML.T0040 - Yapay Zeka Model Çıkarımı API Erişimi                              |
| **Açıklama**           | Saldırgan, kanalda izin verilen gönderen kimliğini taklit eder                 |
| **Saldırı Vektörü**    | Kanala bağlıdır - telefon numarası sahteciliği, kullanıcı adı taklidi          |
| **Etkilenen Bileşenler** | Kanal başına AllowFrom doğrulaması                                           |
| **Mevcut Önlemler**    | Kanala özgü kimlik doğrulaması                                                 |
| **Artık Risk**         | Orta - Bazı kanallar sahteciliğe açıktır                                       |
| **Öneriler**           | Kanala özgü riskleri belgeleyin, mümkün olduğunda kriptografik doğrulama ekleyin |

#### T-ACCESS-003: Token Hırsızlığı

| Öznitelik              | Değer                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **ATLAS Kimliği**      | AML.T0040 - Yapay Zeka Model Çıkarımı API Erişimi           |
| **Açıklama**           | Saldırgan, yapılandırma dosyalarından kimlik doğrulama token'larını çalar |
| **Saldırı Vektörü**    | Kötü amaçlı yazılım, yetkisiz cihaz erişimi, yapılandırma yedeğinin açığa çıkması |
| **Etkilenen Bileşenler** | ~/.openclaw/credentials/, yapılandırma depolama            |
| **Mevcut Önlemler**    | Dosya izinleri                                              |
| **Artık Risk**         | Yüksek - Token'lar düz metin olarak depolanır               |
| **Öneriler**           | Beklemedeki token şifrelemesini uygulayın, token rotasyonu ekleyin |

---

### 3.3 Yürütme (AML.TA0005)

#### T-EXEC-001: Doğrudan Prompt Enjeksiyonu

| Öznitelik              | Değer                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| **ATLAS Kimliği**      | AML.T0051.000 - LLM Prompt Enjeksiyonu: Doğrudan                                         |
| **Açıklama**           | Saldırgan, agent davranışını manipüle etmek için özel hazırlanmış prompt'lar gönderir    |
| **Saldırı Vektörü**    | Düşmanca talimatlar içeren kanal mesajları                                                |
| **Etkilenen Bileşenler** | Agent LLM, tüm giriş yüzeyleri                                                          |
| **Mevcut Önlemler**    | Örüntü algılama, harici içerik sarmalama                                                  |
| **Artık Risk**         | Kritik - Yalnızca algılama var, engelleme yok; gelişmiş saldırılar bunu atlatır          |
| **Öneriler**           | Çok katmanlı savunma, çıktı doğrulama ve hassas eylemler için kullanıcı onayı uygulayın  |

#### T-EXEC-002: Dolaylı Prompt Enjeksiyonu

| Öznitelik              | Değer                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **ATLAS Kimliği**      | AML.T0051.001 - LLM Prompt Enjeksiyonu: Dolaylı             |
| **Açıklama**           | Saldırgan, getirilen içeriğe kötü amaçlı talimatlar yerleştirir |
| **Saldırı Vektörü**    | Kötü amaçlı URL'ler, zehirlenmiş e-postalar, ele geçirilmiş Webhook'lar |
| **Etkilenen Bileşenler** | web_fetch, e-posta alımı, harici veri kaynakları          |
| **Mevcut Önlemler**    | XML etiketleri ve güvenlik bildirimiyle içerik sarmalama    |
| **Artık Risk**         | Yüksek - LLM sarmalayıcı talimatlarını yok sayabilir        |
| **Öneriler**           | İçerik temizleme, ayrı yürütme bağlamları uygulayın         |

#### T-EXEC-003: Araç Argümanı Enjeksiyonu

| Öznitelik              | Değer                                                        |
| ---------------------- | ------------------------------------------------------------ |
| **ATLAS Kimliği**      | AML.T0051.000 - LLM Prompt Enjeksiyonu: Doğrudan             |
| **Açıklama**           | Saldırgan, prompt enjeksiyonu yoluyla araç argümanlarını manipüle eder |
| **Saldırı Vektörü**    | Araç parametre değerlerini etkileyen özel hazırlanmış prompt'lar |
| **Etkilenen Bileşenler** | Tüm araç çağrıları                                         |
| **Mevcut Önlemler**    | Tehlikeli komutlar için exec onayları                        |
| **Artık Risk**         | Yüksek - Kullanıcı yargısına dayanır                         |
| **Öneriler**           | Argüman doğrulama, parametreleştirilmiş araç çağrıları uygulayın |

#### T-EXEC-004: Exec Onayı Atlatma

| Öznitelik              | Değer                                                      |
| ---------------------- | ---------------------------------------------------------- |
| **ATLAS Kimliği**      | AML.T0043 - Düşmanca Veri Hazırlama                        |
| **Açıklama**           | Saldırgan, onay izin listesini atlatan komutlar hazırlar   |
| **Saldırı Vektörü**    | Komut gizleme, alias istismarı, yol manipülasyonu          |
| **Etkilenen Bileşenler** | exec-approvals.ts, komut izin listesi                    |
| **Mevcut Önlemler**    | İzin listesi + ask modu                                    |
| **Artık Risk**         | Yüksek - Komut temizleme yok                               |
| **Öneriler**           | Komut normalleştirme uygulayın, engelleme listesini genişletin |

---

### 3.4 Kalıcılık (AML.TA0006)

#### T-PERSIST-001: Kötü Amaçlı Skill Kurulumu

| Öznitelik              | Değer                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| **ATLAS Kimliği**      | AML.T0010.001 - Tedarik Zinciri Kompromizasyonu: Yapay Zeka Yazılımı     |
| **Açıklama**           | Saldırgan, ClawHub'a kötü amaçlı bir skill yayımlar                      |
| **Saldırı Vektörü**    | Hesap oluşturma, gizli kötü amaçlı kod içeren skill yayımlama            |
| **Etkilenen Bileşenler** | ClawHub, skill yükleme, agent yürütmesi                                |
| **Mevcut Önlemler**    | GitHub hesap yaşı doğrulaması, örüntü tabanlı moderasyon işaretleri      |
| **Artık Risk**         | Kritik - Sandbox yok, inceleme sınırlı                                   |
| **Öneriler**           | VirusTotal entegrasyonu (devam ediyor), skill sandbox'ı, topluluk incelemesi |

#### T-PERSIST-002: Skill Güncelleme Zehirlemesi

| Öznitelik              | Değer                                                          |
| ---------------------- | -------------------------------------------------------------- |
| **ATLAS Kimliği**      | AML.T0010.001 - Tedarik Zinciri Kompromizasyonu: Yapay Zeka Yazılımı |
| **Açıklama**           | Saldırgan, popüler bir skill'i ele geçirir ve kötü amaçlı güncelleme gönderir |
| **Saldırı Vektörü**    | Hesap ele geçirme, skill sahibine yönelik sosyal mühendislik   |
| **Etkilenen Bileşenler** | ClawHub sürümlendirme, otomatik güncelleme akışları          |
| **Mevcut Önlemler**    | Sürüm parmak izi alma                                          |
| **Artık Risk**         | Yüksek - Otomatik güncellemeler kötü amaçlı sürümleri çekebilir |
| **Öneriler**           | Güncelleme imzalama, geri alma yeteneği, sürüm sabitleme uygulayın |

#### T-PERSIST-003: Agent Yapılandırmasıyla Oynama

| Öznitelik              | Değer                                                           |
| ---------------------- | --------------------------------------------------------------- |
| **ATLAS Kimliği**      | AML.T0010.002 - Tedarik Zinciri Kompromizasyonu: Veri           |
| **Açıklama**           | Saldırgan, erişimi kalıcı hale getirmek için agent yapılandırmasını değiştirir |
| **Saldırı Vektörü**    | Yapılandırma dosyası değişikliği, ayar enjeksiyonu              |
| **Etkilenen Bileşenler** | Agent yapılandırması, araç politikaları                       |
| **Mevcut Önlemler**    | Dosya izinleri                                                  |
| **Artık Risk**         | Orta - Yerel erişim gerektirir                                  |
| **Öneriler**           | Yapılandırma bütünlüğü doğrulaması, yapılandırma değişiklikleri için denetim günlüğü |

---

### 3.5 Savunmadan Kaçınma (AML.TA0007)

#### T-EVADE-001: Moderasyon Örüntüsünü Atlatma

| Öznitelik              | Değer                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| **ATLAS Kimliği**      | AML.T0043 - Düşmanca Veri Hazırlama                                    |
| **Açıklama**           | Saldırgan, moderasyon örüntülerinden kaçınmak için skill içeriği hazırlar |
| **Saldırı Vektörü**    | Unicode benzer karakterleri, kodlama hileleri, dinamik yükleme         |
| **Etkilenen Bileşenler** | ClawHub moderation.ts                                                |
| **Mevcut Önlemler**    | Örüntü tabanlı FLAG_RULES                                              |
| **Artık Risk**         | Yüksek - Basit regex kolayca atlatılır                                 |
| **Öneriler**           | Davranışsal analiz (VirusTotal Code Insight), AST tabanlı algılama ekleyin |

#### T-EVADE-002: İçerik Sarmalayıcısından Kaçış

| Öznitelik               | Değer                                                     |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0043 - Hasmane Veri Oluşturma                        |
| **Açıklama**            | Saldırgan, XML sarmalayıcı bağlamından kaçan içerik oluşturur |
| **Saldırı Vektörü**     | Etiket manipülasyonu, bağlam karmaşası, talimat geçersiz kılma |
| **Etkilenen Bileşenler** | Harici içerik sarmalama                                  |
| **Mevcut Azaltımlar**   | XML etiketleri + güvenlik bildirimi                      |
| **Artık Risk**          | Orta - Yeni kaçışlar düzenli olarak keşfediliyor          |
| **Öneriler**            | Birden fazla sarmalayıcı katmanı, çıktı tarafı doğrulama  |

---

### 3.6 Keşif (AML.TA0008)

#### T-DISC-001: Araç Numaralandırma

| Öznitelik               | Değer                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0040 - AI Model Çıkarım API'sine Erişim         |
| **Açıklama**            | Saldırgan, istemler aracılığıyla kullanılabilir araçları numaralandırır |
| **Saldırı Vektörü**     | "Hangi araçlara sahipsin?" tarzı sorgular             |
| **Etkilenen Bileşenler** | Ajan araç kayıt defteri                               |
| **Mevcut Azaltımlar**   | Belirli bir azaltım yok                               |
| **Artık Risk**          | Düşük - Araçlar genellikle belgelenmiştir             |
| **Öneriler**            | Araç görünürlüğü kontrollerini değerlendirin          |

#### T-DISC-002: Oturum Verisi Çıkarma

| Öznitelik               | Değer                                                 |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0040 - AI Model Çıkarım API'sine Erişim         |
| **Açıklama**            | Saldırgan, oturum bağlamından hassas verileri çıkarır |
| **Saldırı Vektörü**     | "Ne konuşmuştuk?" sorguları, bağlam yoklama           |
| **Etkilenen Bileşenler** | Oturum dökümleri, bağlam penceresi                    |
| **Mevcut Azaltımlar**   | Gönderici başına oturum yalıtımı                      |
| **Artık Risk**          | Orta - Oturum içi verilere erişilebilir               |
| **Öneriler**            | Bağlamda hassas veri redaksiyonu uygulayın            |

---

### 3.7 Toplama ve Dışarı Sızdırma (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: web_fetch aracılığıyla Veri Hırsızlığı

| Öznitelik               | Değer                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0009 - Toplama                                                    |
| **Açıklama**            | Saldırgan, ajana harici URL'ye göndermesini söyleyerek verileri dışarı sızdırır |
| **Saldırı Vektörü**     | Ajanın saldırgan sunucusuna veri POST etmesine neden olan istem enjeksiyonu |
| **Etkilenen Bileşenler** | web_fetch aracı                                                        |
| **Mevcut Azaltımlar**   | Dahili ağlar için SSRF engelleme                                       |
| **Artık Risk**          | Yüksek - Harici URL'lere izin verilir                                  |
| **Öneriler**            | URL izin listesi, veri sınıflandırma farkındalığı uygulayın            |

#### T-EXFIL-002: Yetkisiz Mesaj Gönderme

| Öznitelik               | Değer                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0009 - Toplama                                             |
| **Açıklama**            | Saldırgan, ajanın hassas veri içeren mesajlar göndermesine neden olur |
| **Saldırı Vektörü**     | Ajanın saldırgana mesaj göndermesine neden olan istem enjeksiyonu |
| **Etkilenen Bileşenler** | Mesaj aracı, kanal entegrasyonları                               |
| **Mevcut Azaltımlar**   | Giden mesajlaşma kapısı                                          |
| **Artık Risk**          | Orta - Kapı atlatılabilir                                        |
| **Öneriler**            | Yeni alıcılar için açık onay gerektirin                          |

#### T-EXFIL-003: Kimlik Bilgisi Toplama

| Öznitelik               | Değer                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0009 - Toplama                                    |
| **Açıklama**            | Kötü amaçlı skill, ajan bağlamından kimlik bilgilerini toplar |
| **Saldırı Vektörü**     | Skill kodu ortam değişkenlerini, yapılandırma dosyalarını okur |
| **Etkilenen Bileşenler** | Skill yürütme ortamı                                   |
| **Mevcut Azaltımlar**   | Skills için belirli bir azaltım yok                    |
| **Artık Risk**          | Kritik - Skills ajan ayrıcalıklarıyla çalışır          |
| **Öneriler**            | Skill kum havuzuna alma, kimlik bilgisi yalıtımı        |

---

### 3.8 Etki (AML.TA0011)

#### T-IMPACT-001: Yetkisiz Komut Yürütme

| Öznitelik               | Değer                                               |
| ----------------------- | --------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0031 - AI Model Bütünlüğünü Aşındırma          |
| **Açıklama**            | Saldırgan, kullanıcı sisteminde rastgele komutlar yürütür |
| **Saldırı Vektörü**     | exec onayı atlatma ile birleştirilmiş istem enjeksiyonu |
| **Etkilenen Bileşenler** | Bash aracı, komut yürütme                           |
| **Mevcut Azaltımlar**   | Exec onayları, Docker kum havuzu seçeneği           |
| **Artık Risk**          | Kritik - Kum havuzu olmadan ana makinede yürütme    |
| **Öneriler**            | Varsayılanı kum havuzu yapın, onay UX'ini iyileştirin |

#### T-IMPACT-002: Kaynak Tükenmesi (DoS)

| Öznitelik               | Değer                                              |
| ----------------------- | -------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0031 - AI Model Bütünlüğünü Aşındırma         |
| **Açıklama**            | Saldırgan API kredilerini veya hesaplama kaynaklarını tüketir |
| **Saldırı Vektörü**     | Otomatik mesaj yağdırma, pahalı araç çağrıları     |
| **Etkilenen Bileşenler** | Gateway, ajan oturumları, API sağlayıcısı          |
| **Mevcut Azaltımlar**   | Yok                                                |
| **Artık Risk**          | Yüksek - Hız sınırlaması yok                       |
| **Öneriler**            | Gönderici başına hız sınırları, maliyet bütçeleri uygulayın |

#### T-IMPACT-003: İtibar Zararı

| Öznitelik               | Değer                                                   |
| ----------------------- | ------------------------------------------------------- |
| **ATLAS Kimliği**       | AML.T0031 - AI Model Bütünlüğünü Aşındırma              |
| **Açıklama**            | Saldırgan, ajanın zararlı/saldırgan içerik göndermesine neden olur |
| **Saldırı Vektörü**     | Uygunsuz yanıtlara neden olan istem enjeksiyonu          |
| **Etkilenen Bileşenler** | Çıktı üretimi, kanal mesajlaşması                        |
| **Mevcut Azaltımlar**   | LLM sağlayıcı içerik politikaları                        |
| **Artık Risk**          | Orta - Sağlayıcı filtreleri kusursuz değildir            |
| **Öneriler**            | Çıktı filtreleme katmanı, kullanıcı kontrolleri          |

---

## 4. ClawHub Tedarik Zinciri Analizi

### 4.1 Mevcut Güvenlik Kontrolleri

| Kontrol              | Uygulama                    | Etkinlik                                             |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| GitHub Hesap Yaşı    | `requireGitHubAccountAge()` | Orta - Yeni saldırganlar için çıtayı yükseltir       |
| Yol Temizleme        | `sanitizePath()`            | Yüksek - Yol geçişini önler                          |
| Dosya Türü Doğrulama | `isTextFile()`              | Orta - Yalnızca metin dosyaları, ancak yine de kötü amaçlı olabilir |
| Boyut Sınırları      | Toplam 50 MB paket          | Yüksek - Kaynak tükenmesini önler                    |
| Gerekli SKILL.md     | Zorunlu benioku             | Düşük güvenlik değeri - Yalnızca bilgilendirici      |
| Desen Moderasyonu    | moderation.ts içinde FLAG_RULES | Düşük - Kolayca atlatılır                        |
| Moderasyon Durumu    | `moderationStatus` alanı    | Orta - Manuel inceleme mümkün                        |

### 4.2 Moderasyon İşareti Desenleri

`moderation.ts` içindeki mevcut desenler:

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Sınırlamalar:**

- Yalnızca slug, displayName, özet, frontmatter, metadata, dosya yollarını kontrol eder
- Gerçek skill kodu içeriğini analiz etmez
- Basit regex, gizlemeyle kolayca atlatılır
- Davranış analizi yok

### 4.3 Planlanan İyileştirmeler

| İyileştirme            | Durum                                 | Etki                                                                  |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| VirusTotal Entegrasyonu | Devam Ediyor                         | Yüksek - Code Insight davranış analizi                                |
| Topluluk Raporlama      | Kısmi (`skillReports` tablosu var)   | Orta                                                                  |
| Denetim Günlüğü         | Kısmi (`auditLogs` tablosu var)      | Orta                                                                  |
| Rozet Sistemi           | Uygulandı                            | Orta - `highlighted`, `official`, `deprecated`, `redactionApproved`   |

---

## 5. Risk Matrisi

### 5.1 Olasılık ve Etki

| Tehdit Kimliği | Olasılık | Etki     | Risk Seviyesi | Öncelik |
| -------------- | -------- | -------- | ------------- | ------- |
| T-EXEC-001     | Yüksek   | Kritik   | **Kritik**    | P0      |
| T-PERSIST-001  | Yüksek   | Kritik   | **Kritik**    | P0      |
| T-EXFIL-003    | Orta     | Kritik   | **Kritik**    | P0      |
| T-IMPACT-001   | Orta     | Kritik   | **Yüksek**    | P1      |
| T-EXEC-002     | Yüksek   | Yüksek   | **Yüksek**    | P1      |
| T-EXEC-004     | Orta     | Yüksek   | **Yüksek**    | P1      |
| T-ACCESS-003   | Orta     | Yüksek   | **Yüksek**    | P1      |
| T-EXFIL-001    | Orta     | Yüksek   | **Yüksek**    | P1      |
| T-IMPACT-002   | Yüksek   | Orta     | **Yüksek**    | P1      |
| T-EVADE-001    | Yüksek   | Orta     | **Orta**      | P2      |
| T-ACCESS-001   | Düşük    | Yüksek   | **Orta**      | P2      |
| T-ACCESS-002   | Düşük    | Yüksek   | **Orta**      | P2      |
| T-PERSIST-002  | Düşük    | Yüksek   | **Orta**      | P2      |

### 5.2 Kritik Yol Saldırı Zincirleri

**Saldırı Zinciri 1: Skill Tabanlı Veri Hırsızlığı**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish malicious skill) → (Evade moderation) → (Harvest credentials)
```

**Saldırı Zinciri 2: İstem Enjeksiyonundan RCE'ye**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (Bypass exec approval) → (Execute commands)
```

**Saldırı Zinciri 3: Getirilen İçerik aracılığıyla Dolaylı Enjeksiyon**

```
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(Poison URL content) → (Agent fetches & follows instructions) → (Data sent to attacker)
```

---

## 6. Öneriler Özeti

### 6.1 Acil (P0)

| ID    | Öneri                                      | Ele Aldığı Konular        |
| ----- | ------------------------------------------ | ------------------------- |
| R-001 | VirusTotal entegrasyonunu tamamla          | T-PERSIST-001, T-EVADE-001 |
| R-002 | Beceri sanal alanına almayı uygula         | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Hassas işlemler için çıktı doğrulaması ekle | T-EXEC-001, T-EXEC-002     |

### 6.2 Kısa vadeli (P1)

| ID    | Öneri                                      | Ele Aldığı Konular |
| ----- | ------------------------------------------ | ------------------ |
| R-004 | Hız sınırlamayı uygula                     | T-IMPACT-002       |
| R-005 | Bekleme durumundaki belirteç şifrelemesi ekle | T-ACCESS-003       |
| R-006 | exec onayı kullanıcı deneyimini ve doğrulamayı iyileştir | T-EXEC-004         |
| R-007 | web_fetch için URL izin listesi uygulaması ekle | T-EXFIL-001        |

### 6.3 Orta vadeli (P2)

| ID    | Öneri                                             | Ele Aldığı Konular |
| ----- | ------------------------------------------------- | ------------------ |
| R-008 | Mümkün olduğunda kriptografik kanal doğrulaması ekle | T-ACCESS-002       |
| R-009 | Yapılandırma bütünlüğü doğrulamasını uygula       | T-PERSIST-003      |
| R-010 | Güncelleme imzalamayı ve sürüm sabitlemeyi ekle   | T-PERSIST-002      |

---

## 7. Ekler

### 7.1 ATLAS Teknik Eşlemesi

| ATLAS ID      | Teknik Adı                     | OpenClaw Tehditleri                                             |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Etkin Tarama                   | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Toplama                        | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Tedarik Zinciri: Yapay Zeka Yazılımı | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Tedarik Zinciri: Veri          | T-PERSIST-003                                                    |
| AML.T0031     | Yapay Zeka Model Bütünlüğünü Aşındırma | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Yapay Zeka Model Çıkarım API Erişimi | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Hasım Verisi Oluşturma         | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM Komut Enjeksiyonu: Doğrudan | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM Komut Enjeksiyonu: Dolaylı | T-EXEC-002                                                       |

### 7.2 Temel Güvenlik Dosyaları

| Yol                                 | Amaç                        | Risk Düzeyi |
| ----------------------------------- | --------------------------- | ----------- |
| `src/infra/exec-approvals.ts`       | Komut onayı mantığı         | **Kritik**  |
| `src/gateway/auth.ts`               | Gateway kimlik doğrulaması  | **Kritik**  |
| `src/infra/net/ssrf.ts`             | SSRF koruması               | **Kritik**  |
| `src/security/external-content.ts`  | Komut enjeksiyonu azaltma   | **Kritik**  |
| `src/agents/sandbox/tool-policy.ts` | Araç politikası uygulaması  | **Kritik**  |
| `src/routing/resolve-route.ts`      | Oturum izolasyonu           | **Orta**    |

### 7.3 Sözlük

| Terim                | Tanım                                                     |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | MITRE'nin yapay zeka sistemleri için Hasım Tehdit Ortamı  |
| **ClawHub**          | OpenClaw'ın beceri pazaryeri                              |
| **Gateway**          | OpenClaw'ın mesaj yönlendirme ve kimlik doğrulama katmanı |
| **MCP**              | Model Context Protocol - araç sağlayıcı arayüzü           |
| **Komut Enjeksiyonu** | Kötü amaçlı talimatların girdiye gömüldüğü saldırı        |
| **Beceri**           | OpenClaw aracıları için indirilebilir uzantı              |
| **SSRF**             | Sunucu Taraflı İstek Sahteciliği                          |

---

_Bu tehdit modeli yaşayan bir belgedir. Güvenlik sorunlarını security@openclaw.ai adresine bildirin_

## İlgili

- [Biçimsel doğrulama](/tr/security/formal-verification)
- [Tehdit modeline katkıda bulunma](/tr/security/CONTRIBUTING-THREAT-MODEL)
