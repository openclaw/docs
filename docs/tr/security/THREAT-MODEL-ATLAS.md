---
read_when:
    - Güvenlik duruşunu veya tehdit senaryolarını gözden geçirme
    - Güvenlik özellikleri veya denetim yanıtları üzerinde çalışma
summary: MITRE ATLAS çerçevesiyle eşleştirilen OpenClaw tehdit modeli
title: Tehdit modeli (MITRE ATLAS)
x-i18n:
    generated_at: "2026-05-06T18:00:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7371231e9795cd899d727b87dfba7a5cae963f1fd1e50226e3fbb7488ef7381
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

## MITRE ATLAS çerçevesi

**Sürüm:** 1.0-taslak
**Son Güncelleme:** 2026-02-04
**Metodoloji:** MITRE ATLAS + Veri Akışı Diyagramları
**Çerçeve:** [MITRE ATLAS](https://atlas.mitre.org/) (AI Sistemleri için Düşmanca Tehdit Ortamı)

### Çerçeve atfı

Bu tehdit modeli, AI/ML sistemlerine yönelik düşmanca tehditleri belgelemek için sektör standardı olan [MITRE ATLAS](https://atlas.mitre.org/) çerçevesi üzerine kuruludur. ATLAS, AI güvenlik topluluğuyla iş birliği içinde [MITRE](https://www.mitre.org/) tarafından sürdürülür.

**Temel ATLAS Kaynakları:**

- [ATLAS Teknikleri](https://atlas.mitre.org/techniques/)
- [ATLAS Taktikleri](https://atlas.mitre.org/tactics/)
- [ATLAS Vaka Çalışmaları](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [ATLAS'a Katkıda Bulunma](https://atlas.mitre.org/resources/contribute)

### Bu Tehdit Modeline Katkıda Bulunma

Bu, OpenClaw topluluğu tarafından sürdürülen yaşayan bir belgedir. Katkıda bulunma yönergeleri için [CONTRIBUTING-THREAT-MODEL.md](/tr/security/CONTRIBUTING-THREAT-MODEL) dosyasına bakın:

- Yeni tehditleri bildirme
- Mevcut tehditleri güncelleme
- Saldırı zincirleri önerme
- Azaltımlar önerme

---

## 1. Giriş

### 1.1 Amaç

Bu tehdit modeli, özellikle AI/ML sistemleri için tasarlanmış MITRE ATLAS çerçevesini kullanarak OpenClaw AI agent platformuna ve ClawHub beceri pazaryerine yönelik düşmanca tehditleri belgeler.

### 1.2 Kapsam

| Bileşen               | Dahil | Notlar                                           |
| --------------------- | ----- | ----------------------------------------------- |
| OpenClaw Agent Runtime | Evet  | Çekirdek agent yürütmesi, araç çağrıları, oturumlar |
| Gateway               | Evet  | Kimlik doğrulama, yönlendirme, kanal entegrasyonu |
| Kanal Entegrasyonları | Evet  | WhatsApp, Telegram, Discord, Signal, Slack, vb. |
| ClawHub Pazaryeri     | Evet  | Beceri yayımlama, moderasyon, dağıtım           |
| MCP Sunucuları        | Evet  | Harici araç sağlayıcıları                       |
| Kullanıcı Cihazları   | Kısmi | Mobil uygulamalar, masaüstü istemcileri         |

### 1.3 Kapsam Dışı

Bu tehdit modeli için hiçbir şey açıkça kapsam dışı değildir.

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

| Akış | Kaynak  | Hedef       | Veri                 | Koruma               |
| ---- | ------- | ----------- | -------------------- | -------------------- |
| F1   | Kanal   | Gateway     | Kullanıcı mesajları  | TLS, AllowFrom       |
| F2   | Gateway | Agent       | Yönlendirilen mesajlar | Oturum izolasyonu  |
| F3   | Agent   | Araçlar     | Araç çağrıları       | Politika uygulaması  |
| F4   | Agent   | Harici      | web_fetch istekleri  | SSRF engelleme       |
| F5   | ClawHub | Agent       | Beceri kodu          | Moderasyon, tarama   |
| F6   | Agent   | Kanal       | Yanıtlar             | Çıkış filtreleme     |

---

## 3. ATLAS Taktiğine Göre Tehdit Analizi

### 3.1 Keşif (AML.TA0002)

#### T-RECON-001: Agent Uç Noktası Keşfi

| Öznitelik              | Değer                                                                |
| ---------------------- | -------------------------------------------------------------------- |
| **ATLAS ID**           | AML.T0006 - Aktif Tarama                                             |
| **Açıklama**           | Saldırgan, açıkta kalan OpenClaw Gateway uç noktalarını tarar        |
| **Saldırı Vektörü**    | Ağ taraması, shodan sorguları, DNS numaralandırması                  |
| **Etkilenen Bileşenler** | Gateway, açıkta kalan API uç noktaları                             |
| **Mevcut Azaltımlar**  | Tailscale kimlik doğrulama seçeneği, varsayılan olarak loopback'e bağlanma |
| **Kalan Risk**         | Orta - Genel erişime açık Gateway'ler keşfedilebilir                 |
| **Öneriler**           | Güvenli dağıtımı belgeleyin, keşif uç noktalarına hız sınırlaması ekleyin |

#### T-RECON-002: Kanal Entegrasyonu Yoklama

| Öznitelik              | Değer                                                                     |
| ----------------------- | ------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0006 - Aktif Tarama                                                  |
| **Açıklama**            | Saldırgan, yapay zeka tarafından yönetilen hesapları belirlemek için mesajlaşma kanallarını yoklar |
| **Saldırı Vektörü**     | Test mesajları gönderme, yanıt örüntülerini gözlemleme                    |
| **Etkilenen Bileşenler** | Tüm kanal entegrasyonları                                                 |
| **Mevcut Önlemler**     | Belirli bir önlem yok                                                     |
| **Artık Risk**          | Düşük - Yalnızca keşiften elde edilen değer sınırlı                       |
| **Öneriler**            | Yanıt zamanlamasının rastgeleleştirilmesini değerlendirin                 |

---

### 3.2 İlk Erişim (AML.TA0004)

#### T-ACCESS-001: Eşleştirme Kodu Ele Geçirme

| Öznitelik              | Değer                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - Yapay Zeka Modeli Çıkarım API Erişimi                                                               |
| **Açıklama**            | Saldırgan, eşleştirme ek süresi sırasında eşleştirme kodunu ele geçirir (DM kanal eşleştirmesi için 1 saat, Node eşleştirmesi için 5 dakika) |
| **Saldırı Vektörü**     | Omuz üzerinden izleme, ağ trafiği dinleme, sosyal mühendislik                                                   |
| **Etkilenen Bileşenler** | Cihaz eşleştirme sistemi                                                                                        |
| **Mevcut Önlemler**     | 1 saatlik süre sonu (DM eşleştirmesi) / 5 dakikalık süre sonu (Node eşleştirmesi), kodlar mevcut kanal üzerinden gönderilir |
| **Artık Risk**          | Orta - Ek süre istismar edilebilir                                                                              |
| **Öneriler**            | Ek süreyi azaltın, onay adımı ekleyin                                                                           |

#### T-ACCESS-002: AllowFrom Sahteciliği

| Öznitelik              | Değer                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - Yapay Zeka Modeli Çıkarım API Erişimi                                |
| **Açıklama**            | Saldırgan, kanalda izin verilen gönderici kimliğini taklit eder                  |
| **Saldırı Vektörü**     | Kanala bağlıdır - telefon numarası sahteciliği, kullanıcı adıyla kimliğe bürünme |
| **Etkilenen Bileşenler** | Kanal başına AllowFrom doğrulaması                                               |
| **Mevcut Önlemler**     | Kanala özgü kimlik doğrulama                                                     |
| **Artık Risk**          | Orta - Bazı kanallar sahteciliğe açıktır                                         |
| **Öneriler**            | Kanala özgü riskleri belgeleyin, mümkün olduğunda kriptografik doğrulama ekleyin |

#### T-ACCESS-003: Token Hırsızlığı

| Öznitelik              | Değer                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0040 - Yapay Zeka Modeli Çıkarım API Erişimi           |
| **Açıklama**            | Saldırgan, kimlik doğrulama tokenlerini yapılandırma dosyalarından çalar |
| **Saldırı Vektörü**     | Kötü amaçlı yazılım, yetkisiz cihaz erişimi, yapılandırma yedeğinin açığa çıkması |
| **Etkilenen Bileşenler** | ~/.openclaw/credentials/, yapılandırma depolaması           |
| **Mevcut Önlemler**     | Dosya izinleri                                              |
| **Artık Risk**          | Yüksek - Tokenler düz metin olarak saklanır                 |
| **Öneriler**            | Beklemedeki token şifrelemesini uygulayın, token rotasyonu ekleyin |

---

### 3.3 Yürütme (AML.TA0005)

#### T-EXEC-001: Doğrudan Prompt Enjeksiyonu

| Öznitelik              | Değer                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.000 - LLM Prompt Enjeksiyonu: Doğrudan                                         |
| **Açıklama**            | Saldırgan, ajan davranışını manipüle etmek için özel hazırlanmış promptlar gönderir      |
| **Saldırı Vektörü**     | Karşıt talimatlar içeren kanal mesajları                                                 |
| **Etkilenen Bileşenler** | Ajan LLM'si, tüm giriş yüzeyleri                                                         |
| **Mevcut Önlemler**     | Örüntü tespiti, harici içerik sarmalama                                                  |
| **Artık Risk**          | Kritik - Yalnızca tespit var, engelleme yok; gelişmiş saldırılar bunu aşar              |
| **Öneriler**            | Çok katmanlı savunma, çıktı doğrulama ve hassas eylemler için kullanıcı onayı uygulayın |

#### T-EXEC-002: Dolaylı Prompt Enjeksiyonu

| Öznitelik              | Değer                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **ATLAS ID**            | AML.T0051.001 - LLM Prompt Enjeksiyonu: Dolaylı             |
| **Açıklama**            | Saldırgan, getirilen içeriğe kötü amaçlı talimatlar yerleştirir |
| **Saldırı Vektörü**     | Kötü amaçlı URL'ler, zehirlenmiş e-postalar, ele geçirilmiş webhooklar |
| **Etkilenen Bileşenler** | web_fetch, e-posta alımı, harici veri kaynakları            |
| **Mevcut Önlemler**     | XML etiketleri ve güvenlik bildirimiyle içerik sarmalama    |
| **Artık Risk**          | Yüksek - LLM sarmalayıcı talimatlarını yok sayabilir        |
| **Öneriler**            | İçerik temizleme, ayrı yürütme bağlamları uygulayın         |

#### T-EXEC-003: Araç Argümanı Enjeksiyonu

| Öznitelik              | Değer                                                        |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0051.000 - LLM Prompt Enjeksiyonu: Doğrudan             |
| **Açıklama**            | Saldırgan, prompt enjeksiyonu yoluyla araç argümanlarını manipüle eder |
| **Saldırı Vektörü**     | Araç parametre değerlerini etkileyen özel hazırlanmış promptlar |
| **Etkilenen Bileşenler** | Tüm araç çağrıları                                           |
| **Mevcut Önlemler**     | Tehlikeli komutlar için exec onayları                        |
| **Artık Risk**          | Yüksek - Kullanıcı muhakemesine dayanır                      |
| **Öneriler**            | Argüman doğrulama, parametreleştirilmiş araç çağrıları uygulayın |

#### T-EXEC-004: Exec Onayı Atlama

| Öznitelik              | Değer                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Karşıt Veri Hazırlama                          |
| **Açıklama**            | Saldırgan, onay izin listesini atlatan komutlar hazırlar   |
| **Saldırı Vektörü**     | Komut gizleme, alias istismarı, yol manipülasyonu          |
| **Etkilenen Bileşenler** | exec-approvals.ts, komut izin listesi                      |
| **Mevcut Önlemler**     | İzin listesi + ask modu                                    |
| **Artık Risk**          | Yüksek - Komut temizleme yok                               |
| **Öneriler**            | Komut normalleştirme uygulayın, engelleme listesini genişletin |

---

### 3.4 Kalıcılık (AML.TA0006)

#### T-PERSIST-001: Kötü Amaçlı Skill Kurulumu

| Öznitelik              | Değer                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| **ATLAS ID**            | AML.T0010.001 - Tedarik Zinciri Ele Geçirme: Yapay Zeka Yazılımı          |
| **Açıklama**            | Saldırgan, ClawHub'a kötü amaçlı Skill yayımlar                          |
| **Saldırı Vektörü**     | Hesap oluşturma, gizli kötü amaçlı kod içeren Skill yayımlama            |
| **Etkilenen Bileşenler** | ClawHub, Skill yükleme, ajan yürütmesi                                   |
| **Mevcut Önlemler**     | GitHub hesap yaşı doğrulaması, örüntü tabanlı moderasyon işaretleri      |
| **Artık Risk**          | Kritik - Sandbox yok, inceleme sınırlı                                   |
| **Öneriler**            | VirusTotal entegrasyonu (devam ediyor), Skill sandboxing, topluluk incelemesi |

#### T-PERSIST-002: Skill Güncellemesi Zehirleme

| Öznitelik              | Değer                                                          |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.001 - Tedarik Zinciri Ele Geçirme: Yapay Zeka Yazılımı |
| **Açıklama**            | Saldırgan popüler Skill'i ele geçirir ve kötü amaçlı güncelleme gönderir |
| **Saldırı Vektörü**     | Hesap ele geçirme, Skill sahibine yönelik sosyal mühendislik   |
| **Etkilenen Bileşenler** | ClawHub sürümleme, otomatik güncelleme akışları                |
| **Mevcut Önlemler**     | Sürüm parmak izi                                               |
| **Artık Risk**          | Yüksek - Otomatik güncellemeler kötü amaçlı sürümleri çekebilir |
| **Öneriler**            | Güncelleme imzalama, geri alma yeteneği, sürüm sabitleme uygulayın |

#### T-PERSIST-003: Ajan Yapılandırmasıyla Oynama

| Öznitelik              | Değer                                                           |
| ----------------------- | --------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0010.002 - Tedarik Zinciri Ele Geçirme: Veri               |
| **Açıklama**            | Saldırgan, erişimi kalıcı hale getirmek için ajan yapılandırmasını değiştirir |
| **Saldırı Vektörü**     | Yapılandırma dosyası değişikliği, ayar enjeksiyonu              |
| **Etkilenen Bileşenler** | Ajan yapılandırması, araç ilkeleri                              |
| **Mevcut Önlemler**     | Dosya izinleri                                                  |
| **Artık Risk**          | Orta - Yerel erişim gerektirir                                  |
| **Öneriler**            | Yapılandırma bütünlüğü doğrulaması, yapılandırma değişiklikleri için denetim günlüğü |

---

### 3.5 Savunmadan Kaçınma (AML.TA0007)

#### T-EVADE-001: Moderasyon Örüntüsünü Atlama

| Öznitelik              | Değer                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS ID**            | AML.T0043 - Karşıt Veri Hazırlama                                      |
| **Açıklama**            | Saldırgan, moderasyon örüntülerinden kaçınmak için Skill içeriği hazırlar |
| **Saldırı Vektörü**     | Unicode homoglifleri, kodlama hileleri, dinamik yükleme                |
| **Etkilenen Bileşenler** | ClawHub moderation.ts                                                  |
| **Mevcut Önlemler**     | Örüntü tabanlı FLAG_RULES                                              |
| **Artık Risk**          | Yüksek - Basit regex kolayca atlatılır                                 |
| **Öneriler**            | Davranışsal analiz (VirusTotal Code Insight), AST tabanlı tespit ekleyin |

#### T-EVADE-002: İçerik Sarmalayıcıdan Kaçış

| Öznitelik | Değer |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS Kimliği** | AML.T0043 - Düşmanca Veri Oluşturma |
| **Açıklama** | Saldırgan, XML sarmalayıcı bağlamından çıkan içerik oluşturur |
| **Saldırı Vektörü** | Etiket manipülasyonu, bağlam karışıklığı, talimat geçersiz kılma |
| **Etkilenen Bileşenler** | Harici içerik sarmalama |
| **Mevcut Azaltımlar** | XML etiketleri + güvenlik bildirimi |
| **Artık Risk** | Orta - Yeni kaçış yöntemleri düzenli olarak keşfediliyor |
| **Öneriler** | Birden fazla sarmalayıcı katmanı, çıktı tarafı doğrulama |

---

### 3.6 Keşif (AML.TA0008)

#### T-DISC-001: Araç Numaralandırma

| Öznitelik | Değer |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS Kimliği** | AML.T0040 - AI Model Çıkarım API Erişimi |
| **Açıklama** | Saldırgan, prompting yoluyla kullanılabilir araçları numaralandırır |
| **Saldırı Vektörü** | "Hangi araçlara sahipsin?" tarzı sorgular |
| **Etkilenen Bileşenler** | Agent araç kayıt defteri |
| **Mevcut Azaltımlar** | Belirli bir azaltım yok |
| **Artık Risk** | Düşük - Araçlar genellikle belgelenmiştir |
| **Öneriler** | Araç görünürlüğü denetimlerini değerlendirin |

#### T-DISC-002: Oturum Verisi Çıkarma

| Öznitelik | Değer |
| ----------------------- | ----------------------------------------------------- |
| **ATLAS Kimliği** | AML.T0040 - AI Model Çıkarım API Erişimi |
| **Açıklama** | Saldırgan, oturum bağlamından hassas verileri çıkarır |
| **Saldırı Vektörü** | "Ne konuştuk?" sorguları, bağlam sondalama |
| **Etkilenen Bileşenler** | Oturum transkriptleri, bağlam penceresi |
| **Mevcut Azaltımlar** | Gönderen başına oturum yalıtımı |
| **Artık Risk** | Orta - Oturum içi verilere erişilebilir |
| **Öneriler** | Bağlamda hassas veri redaksiyonu uygulayın |

---

### 3.7 Toplama ve Dışarı Sızdırma (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: web_fetch yoluyla Veri Hırsızlığı

| Öznitelik | Değer |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS Kimliği** | AML.T0009 - Toplama |
| **Açıklama** | Saldırgan, agent'a harici URL'ye göndermesini söyleyerek veriyi dışarı sızdırır |
| **Saldırı Vektörü** | Agent'ın saldırgan sunucusuna veri POST etmesine neden olan prompt injection |
| **Etkilenen Bileşenler** | web_fetch aracı |
| **Mevcut Azaltımlar** | Dahili ağlar için SSRF engelleme |
| **Artık Risk** | Yüksek - Harici URL'lere izin verilir |
| **Öneriler** | URL izin listesi, veri sınıflandırma farkındalığı uygulayın |

#### T-EXFIL-002: Yetkisiz Mesaj Gönderme

| Öznitelik | Değer |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS Kimliği** | AML.T0009 - Toplama |
| **Açıklama** | Saldırgan, agent'ın hassas veri içeren mesajlar göndermesine neden olur |
| **Saldırı Vektörü** | Agent'ın saldırgana mesaj göndermesine neden olan prompt injection |
| **Etkilenen Bileşenler** | Mesaj aracı, kanal entegrasyonları |
| **Mevcut Azaltımlar** | Giden mesajlaşma kapılaması |
| **Artık Risk** | Orta - Kapılama atlatılabilir |
| **Öneriler** | Yeni alıcılar için açık onay gerektirin |

#### T-EXFIL-003: Kimlik Bilgisi Toplama

| Öznitelik | Değer |
| ----------------------- | ------------------------------------------------------- |
| **ATLAS Kimliği** | AML.T0009 - Toplama |
| **Açıklama** | Kötü amaçlı skill, agent bağlamından kimlik bilgilerini toplar |
| **Saldırı Vektörü** | Skill kodu ortam değişkenlerini, yapılandırma dosyalarını okur |
| **Etkilenen Bileşenler** | Skill yürütme ortamı |
| **Mevcut Azaltımlar** | Skills'e özel bir azaltım yok |
| **Artık Risk** | Kritik - Skills agent ayrıcalıklarıyla çalışır |
| **Öneriler** | Skill sandboxing, kimlik bilgisi yalıtımı |

---

### 3.8 Etki (AML.TA0011)

#### T-IMPACT-001: Yetkisiz Komut Yürütme

| Öznitelik | Değer |
| ----------------------- | --------------------------------------------------- |
| **ATLAS Kimliği** | AML.T0031 - AI Model Bütünlüğünü Aşındırma |
| **Açıklama** | Saldırgan, kullanıcı sisteminde rastgele komutlar yürütür |
| **Saldırı Vektörü** | Exec onayı atlatma ile birleştirilmiş prompt injection |
| **Etkilenen Bileşenler** | Bash aracı, komut yürütme |
| **Mevcut Azaltımlar** | Exec onayları, Docker sandbox seçeneği |
| **Artık Risk** | Kritik - Sandbox olmadan host yürütmesi |
| **Öneriler** | Varsayılan olarak sandbox kullanın, onay kullanıcı deneyimini iyileştirin |

#### T-IMPACT-002: Kaynak Tüketimi (DoS)

| Öznitelik | Değer |
| ----------------------- | -------------------------------------------------- |
| **ATLAS Kimliği** | AML.T0031 - AI Model Bütünlüğünü Aşındırma |
| **Açıklama** | Saldırgan API kredilerini veya işlem kaynaklarını tüketir |
| **Saldırı Vektörü** | Otomatik mesaj taşkını, pahalı araç çağrıları |
| **Etkilenen Bileşenler** | Gateway, agent oturumları, API sağlayıcısı |
| **Mevcut Azaltımlar** | Yok |
| **Artık Risk** | Yüksek - Hız sınırlaması yok |
| **Öneriler** | Gönderen başına hız sınırları, maliyet bütçeleri uygulayın |

#### T-IMPACT-003: İtibar Zararı

| Öznitelik | Değer |
| ----------------------- | ------------------------------------------------------- |
| **ATLAS Kimliği** | AML.T0031 - AI Model Bütünlüğünü Aşındırma |
| **Açıklama** | Saldırgan, agent'ın zararlı/saldırgan içerik göndermesine neden olur |
| **Saldırı Vektörü** | Uygunsuz yanıtlara neden olan prompt injection |
| **Etkilenen Bileşenler** | Çıktı oluşturma, kanal mesajlaşması |
| **Mevcut Azaltımlar** | LLM sağlayıcısı içerik politikaları |
| **Artık Risk** | Orta - Sağlayıcı filtreleri kusursuz değil |
| **Öneriler** | Çıktı filtreleme katmanı, kullanıcı denetimleri |

---

## 4. ClawHub Tedarik Zinciri Analizi

### 4.1 Mevcut Güvenlik Denetimleri

| Denetim | Uygulama | Etkililik |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| GitHub Hesap Yaşı | `requireGitHubAccountAge()` | Orta - Yeni saldırganlar için çıtayı yükseltir |
| Yol Temizleme | `sanitizePath()` | Yüksek - Yol geçişini önler |
| Dosya Türü Doğrulama | `isTextFile()` | Orta - Yalnızca metin dosyaları, ancak yine de kötü amaçlı olabilir |
| Boyut Sınırları | 50MB toplam paket | Yüksek - Kaynak tüketimini önler |
| Gerekli SKILL.md | Zorunlu readme | Düşük güvenlik değeri - Yalnızca bilgilendirici |
| Desen Moderasyonu | moderation.ts içindeki FLAG_RULES | Düşük - Kolayca atlatılır |
| Moderasyon Durumu | `moderationStatus` alanı | Orta - Manuel inceleme mümkün |

### 4.2 Moderasyon İşaret Desenleri

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

- Yalnızca slug, displayName, özet, frontmatter, metadata, dosya yollarını denetler
- Gerçek skill kod içeriğini analiz etmez
- Basit regex, obfuscation ile kolayca atlatılır
- Davranış analizi yok

### 4.3 Planlanan İyileştirmeler

| İyileştirme | Durum | Etki |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| VirusTotal Entegrasyonu | Devam Ediyor | Yüksek - Code Insight davranış analizi |
| Topluluk Raporlama | Kısmi (`skillReports` tablosu mevcut) | Orta |
| Denetim Günlüğü | Kısmi (`auditLogs` tablosu mevcut) | Orta |
| Rozet Sistemi | Uygulandı | Orta - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Risk Matrisi

### 5.1 Olasılık ve Etki

| Tehdit Kimliği | Olasılık | Etki | Risk Düzeyi | Öncelik |
| ------------- | ---------- | -------- | ------------ | -------- |
| T-EXEC-001 | Yüksek | Kritik | **Kritik** | P0 |
| T-PERSIST-001 | Yüksek | Kritik | **Kritik** | P0 |
| T-EXFIL-003 | Orta | Kritik | **Kritik** | P0 |
| T-IMPACT-001 | Orta | Kritik | **Yüksek** | P1 |
| T-EXEC-002 | Yüksek | Yüksek | **Yüksek** | P1 |
| T-EXEC-004 | Orta | Yüksek | **Yüksek** | P1 |
| T-ACCESS-003 | Orta | Yüksek | **Yüksek** | P1 |
| T-EXFIL-001 | Orta | Yüksek | **Yüksek** | P1 |
| T-IMPACT-002 | Yüksek | Orta | **Yüksek** | P1 |
| T-EVADE-001 | Yüksek | Orta | **Orta** | P2 |
| T-ACCESS-001 | Düşük | Yüksek | **Orta** | P2 |
| T-ACCESS-002 | Düşük | Yüksek | **Orta** | P2 |
| T-PERSIST-002 | Düşük | Yüksek | **Orta** | P2 |

### 5.2 Kritik Yol Saldırı Zincirleri

**Saldırı Zinciri 1: Skill Tabanlı Veri Hırsızlığı**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish malicious skill) → (Evade moderation) → (Harvest credentials)
```

**Saldırı Zinciri 2: Prompt Injection'dan RCE'ye**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (Bypass exec approval) → (Execute commands)
```

**Saldırı Zinciri 3: Alınan İçerik Yoluyla Dolaylı Injection**

```
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(Poison URL content) → (Agent fetches & follows instructions) → (Data sent to attacker)
```

---

## 6. Öneriler Özeti

### 6.1 Acil (P0)

| ID    | Öneri                                       | Ele aldığı konular        |
| ----- | ------------------------------------------ | ------------------------- |
| R-001 | VirusTotal entegrasyonunu tamamla          | T-PERSIST-001, T-EVADE-001 |
| R-002 | Skill sandboxing uygula                    | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Hassas eylemler için çıktı doğrulaması ekle | T-EXEC-001, T-EXEC-002     |

### 6.2 Kısa vadeli (P1)

| ID    | Öneri                                      | Ele aldığı konular |
| ----- | ----------------------------------------- | ------------------ |
| R-004 | Hız sınırlaması uygula                    | T-IMPACT-002       |
| R-005 | Beklemedeki token şifrelemesi ekle        | T-ACCESS-003       |
| R-006 | exec onay UX'ini ve doğrulamasını iyileştir | T-EXEC-004         |
| R-007 | web_fetch için URL izin listesi uygula    | T-EXFIL-001        |

### 6.3 Orta vadeli (P2)

| ID    | Öneri                                                   | Ele aldığı konular |
| ----- | ------------------------------------------------------- | ------------------ |
| R-008 | Mümkün olduğunda kriptografik kanal doğrulaması ekle    | T-ACCESS-002       |
| R-009 | config bütünlüğü doğrulaması uygula                     | T-PERSIST-003      |
| R-010 | Güncelleme imzalama ve sürüm sabitleme ekle             | T-PERSIST-002      |

---

## 7. Ekler

### 7.1 ATLAS Teknik Eşlemesi

| ATLAS ID      | Teknik Adı                     | OpenClaw Tehditleri                                              |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Aktif Tarama                   | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Toplama                        | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Tedarik Zinciri: AI Yazılımı   | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Tedarik Zinciri: Veri          | T-PERSIST-003                                                    |
| AML.T0031     | AI Model Bütünlüğünü Aşındırma | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | AI Model Çıkarım API Erişimi   | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Düşmanca Veri Oluşturma        | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM Prompt Injection: Doğrudan | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM Prompt Injection: Dolaylı  | T-EXEC-002                                                       |

### 7.2 Temel Güvenlik Dosyaları

| Yol                                 | Amaç                         | Risk Düzeyi |
| ----------------------------------- | ---------------------------- | ----------- |
| `src/infra/exec-approvals.ts`       | Komut onay mantığı           | **Kritik**  |
| `src/gateway/auth.ts`               | Gateway kimlik doğrulaması   | **Kritik**  |
| `src/infra/net/ssrf.ts`             | SSRF koruması                | **Kritik**  |
| `src/security/external-content.ts`  | Prompt injection azaltma     | **Kritik**  |
| `src/agents/sandbox/tool-policy.ts` | Araç politikası uygulaması   | **Kritik**  |
| `src/routing/resolve-route.ts`      | Oturum izolasyonu            | **Orta**    |

### 7.3 Sözlük

| Terim                | Tanım                                                   |
| -------------------- | ------------------------------------------------------- |
| **ATLAS**            | MITRE'nin AI Sistemleri için Düşmanca Tehdit Manzarası |
| **ClawHub**          | OpenClaw'ın Skills pazarı                              |
| **Gateway**          | OpenClaw'ın mesaj yönlendirme ve kimlik doğrulama katmanı |
| **MCP**              | Model Context Protocol - araç sağlayıcı arayüzü         |
| **Prompt Injection** | Kötü amaçlı talimatların girdiye gömüldüğü saldırı      |
| **Skill**            | OpenClaw ajanları için indirilebilir uzantı             |
| **SSRF**             | Server-Side Request Forgery                             |

---

_Bu tehdit modeli yaşayan bir belgedir. Güvenlik sorunlarını security@openclaw.ai adresine bildirin_

## İlgili

- [Biçimsel doğrulama](/tr/security/formal-verification)
- [Tehdit modeline katkıda bulunma](/tr/security/CONTRIBUTING-THREAT-MODEL)
