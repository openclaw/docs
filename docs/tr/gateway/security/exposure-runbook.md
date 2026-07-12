---
read_when:
    - Gateway'i LAN, tailnet, Tailscale Serve, Funnel veya ters proxy üzerinden erişime açma
    - Gerçek mesajlaşma kullanıcılarına izin vermeden önce bir dağıtımın incelenmesi
    - Riskli bir uzaktan erişim veya doğrudan mesaj yapılandırmasını geri alma
sidebarTitle: Exposure runbook
summary: Bir OpenClaw Gateway'i loopback dışına açmadan önce ön kontrol ve geri alma kontrol listesi
title: Gateway erişime açma operasyon kılavuzu
x-i18n:
    generated_at: "2026-07-12T11:48:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Gateway'i yalnızca ona kimlerin erişebildiğini, bu kişilerin kimliğinin nasıl
doğrulandığını, hangi ajanları tetikleyebildiklerini ve bu ajanların hangi araçları
kullanabildiğini açıklayabildikten sonra dış erişime açın. Şüphe durumunda yalnızca
local loopback erişimine dönün ve denetimi yeniden çalıştırın.
</Warning>

Bu çalışma kılavuzu, daha kapsamlı [Güvenlik](/tr/gateway/security) rehberini uzaktan erişim ve mesajlaşma dışa açıklığı için bir operatör kontrol listesine dönüştürür.

## Dışa açıklık modelini seçin

İş akışını karşılayan en dar kapsamlı modeli tercih edin.

| Model                      | Önerildiği durum                                 | Gerekli denetimler                                                                                                                          |
| -------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Loopback + SSH tüneli      | Kişisel kullanım, yönetici erişimi, hata ayıklama | `gateway.bind: "loopback"` ayarını koruyun ve `127.0.0.1:18789` adresine tünel açın                                                         |
| Loopback + Tailscale Serve | Control UI/WebSocket'a kişisel tailnet erişimi    | Gateway'i yalnızca loopback üzerinde tutun; Tailscale kimlik üstbilgileri diğer kimlik doğrulama yollarını değil, yalnızca Control UI WebSocket yüzeyini doğrular |
| Tailnet/LAN bağlama        | Bilinen cihazların bulunduğu özel ağ              | Gateway kimlik doğrulaması, güvenlik duvarı izin listesi, genel bağlantı noktası yönlendirmesi olmaması                                     |
| Güvenilir ters proxy       | Gateway'in önünde kuruluş SSO/OIDC'si             | `trusted-proxy` kimlik doğrulaması, sıkı `trustedProxies`, üstbilgi üzerine yazma/kaldırma kuralları, açıkça belirtilmiş izinli kullanıcılar |
| Genel internet             | Nadir, yüksek riskli dağıtımlar                   | Kimlik duyarlı proxy, TLS, hız sınırları, sıkı izin listeleri, korumalı alan içindeki ana olmayan oturumlar                                 |

Gateway'e doğrudan genel bağlantı noktası yönlendirmesinden kaçının. Genel erişim
gerekiyorsa önüne kimlik duyarlı bir proxy yerleştirin ve Gateway'e giden tek ağ
yolunun bu proxy olmasını sağlayın.

## Ön kontrol envanteri

Bağlama, proxy, Tailscale veya kanal politikasını değiştirmeden önce şunları kaydedin:

- Gateway ana makinesi, işletim sistemi kullanıcısı ve durum dizini (varsayılan `~/.openclaw`).
- Gateway URL'si ve bağlama modu (`gateway.bind`; varsayılan bağlantı noktası `18789`).
- Kimlik doğrulama modu, belirteç/parola kaynağı veya güvenilir proxy kimlik kaynağı.
- Etkinleştirilmiş her kanal ve doğrudan mesajları, grupları ya da Webhook'ları kabul edip etmediği.
- Yerel olmayan göndericilerin erişebildiği ajanlar.
- Erişilebilir her ajan için araç profili, korumalı alan modu ve yükseltilmiş araç politikası.
- Bu ajanların erişebildiği harici kimlik bilgileri.
- `~/.openclaw/openclaw.json` ve kimlik bilgilerinin yedek konumu.

Bota birden fazla kişi mesaj gönderebiliyorsa bunu kullanıcı başına ana makine
yalıtımı olarak değil, paylaşılan ve devredilmiş araç yetkisi olarak değerlendirin.

## Temel kontroller

Erişimi açmadan önce çalıştırın:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Önce kritik bulguları giderin. Uyarıları yalnızca dağıtım açısından kasıtlı ve
belgelenmiş olduklarında kabul edin. Her `checkId` değerinin anlamı ve düzeltme
anahtarı için [Güvenlik denetimi kontrolleri](/tr/gateway/security/audit-checks) bölümüne bakın.

Uzaktan CLI doğrulaması için kimlik bilgilerini açıkça iletin:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Yerel yapılandırmadaki kimlik bilgilerinin açıkça belirtilmiş bir uzak URL için
geçerli olduğunu varsaymayın.

## Asgari güvenli temel yapılandırma

Dış erişime açık dağıtımlarda başlangıç noktası olarak bu yapıyı kullanın:

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Her seferinde yalnızca bir denetimi genişletin: yazma yeteneğine sahip araçları
etkinleştirmeden önce belirli bir kanal izin listesi ekleyin veya uzaktaki
Control UI trafiğini kabul etmeden önce ters proxy'yi etkinleştirin.

`tools.exec.security: "deny"`, zararsız tanılama işlemleri dâhil olmak üzere tüm
exec çağrılarını engeller. Tanılama veya düşük riskli komutlar gerekiyorsa bu
ayarı yalnızca tehdit modelinize uygun belirli göndericileri, ajanları, komutları
ve onay modunu seçtikten sonra gevşetin.

## Doğrudan mesaj ve grup dışa açıklığı

Mesajlaşma kanalları güvenilmeyen girdi yüzeyleridir. Doğrudan mesajlara veya
gruplara izin vermeden önce:

- `dmPolicy: "open"` yerine `dmPolicy: "pairing"` veya sıkı bir `allowFrom` listesi tercih edin.
- `"*"` izin listelerini geniş araç erişimiyle birleştirmeyin.
- Oda sıkı biçimde denetlenmiyorsa gruplarda bahsetme zorunluluğu getirin.
- Birden fazla kişi bota doğrudan mesaj gönderebiliyorsa doğrudan mesaj
  oturumlarının bağlam paylaşmaması için `session.dmScope: "per-channel-peer"`
  (veya çok hesaplı kanallarda `"per-account-channel-peer"`) ayarını kullanın.
- Paylaşılan kanalları asgari araçlara sahip ve kişisel kimlik bilgileri
  bulunmayan ajanlara yönlendirin.

Eşleştirme, göndericinin botu tetiklemesine onay verir. Göndericiyi ayrı bir ana
makine güvenlik sınırı hâline getirmez.

## Ters proxy kontrolleri

Kimlik duyarlı proxy'ler için:

- Proxy, Gateway'e yönlendirmeden önce kullanıcıların kimliğini doğrulamalıdır.
- Güvenlik duvarı veya ağ politikası, Gateway bağlantı noktasına doğrudan erişimi engellemelidir.
- `gateway.trustedProxies` yalnızca proxy kaynak IP'lerini listelemelidir.
- Proxy, istemci tarafından sağlanan kimlik ve yönlendirme üstbilgilerini kaldırmalı veya bunların üzerine yazmalıdır.
- Proxy birden fazla hedef kitleye hizmet veriyorsa `gateway.auth.trustedProxy.allowUsers` ayarını belirleyin.
- `gateway.auth.trustedProxy.allowLoopback` ayarını yalnızca yerel süreçlere
  güvenilen ve kimlik üstbilgilerinin proxy tarafından yönetildiği aynı ana
  makinedeki proxy için kullanın.

Proxy değişikliklerinden sonra `openclaw security audit --deep` komutunu
çalıştırın. Proxy kimlik doğrulama sınırı hâline geldiği için güvenilir proxy
bulguları güçlü sinyallerdir.

## Araç ve korumalı alan incelemesi

Bir ajanı uzak göndericilere açmadan önce:

- Hangi oturumların ana makinede, hangilerinin korumalı alanda çalıştığını doğrulayın.
- Ana makinede exec kullanımını reddedin veya onaya tabi tutun.
- Belirli ve güvenilir bir gönderici ihtiyaç duymadıkça yükseltilmiş araçları devre dışı tutun.
- Açık veya yarı açık mesajlaşma yüzeylerinde tarayıcı, canvas, Node, Cron, Gateway ve oturum oluşturma araçlarından kaçının.
- Bağlama noktalarını dar kapsamlı tutun; kimlik bilgisi, ev dizini, Docker soketi ve sistem yollarından kaçının.
- Önemli ölçüde farklı güven sınırları için ayrı Gateway'ler, işletim sistemi kullanıcıları veya ana makineler kullanın.

Uzak kullanıcılar tamamen güvenilir değilse yalıtım yalnızca istemlerden veya
oturum etiketlerinden değil, ayrı dağıtımlardan sağlanmalıdır.

## Değişiklik sonrası doğrulama

Her dışa açıklık değişikliğinden sonra:

1. `openclaw security audit --deep` komutunu yeniden çalıştırın.
2. Yetkilendirilmiş bir bağlantının başarıyla kurulduğunu doğrulayın.
3. Yetkisiz bir göndericinin veya tarayıcı oturumunun reddedildiğini doğrulayın.
4. Günlüklerin gizli bilgileri maskelediğini doğrulayın.
5. Doğrudan mesaj/grup yönlendirmesinin yalnızca amaçlanan ajana ulaştığını doğrulayın.
6. Yüksek etkili araçların onay istediğini veya reddedildiğini doğrulayın.
7. Kabul edilen kalan uyarıları belgeleyin.

Mevcut dışa açıklık değişikliği anlaşılmadan bir sonraki değişikliğe geçmeyin.

## Geri alma planı

Gateway gerekenden fazla dışa açılmış olabilecekse:

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Ardından:

1. Genel yönlendirmeyi, Tailscale Funnel'ı veya ters proxy yollarını durdurun.
2. Gateway belirteçlerini/parolalarını ve etkilenen entegrasyon kimlik bilgilerini yenileyin.
3. İzin listelerinden `"*"` değerini ve beklenmeyen göndericileri kaldırın.
4. Son denetim günlüklerini, çalıştırma geçmişini, araç çağrılarını ve yapılandırma değişikliklerini inceleyin.
5. `openclaw security audit --deep` komutunu yeniden çalıştırın.
6. İş akışını karşılayan en dar kapsamlı modelle erişimi yeniden etkinleştirin.

## İnceleme kontrol listesi

- Belgelenmiş bir neden bulunmadıkça Gateway yalnızca loopback üzerinde kalır.
- Loopback dışı erişimde kimlik doğrulama ve güvenlik duvarı vardır; doğrudan genel erişim yolu yoktur.
- Güvenilir proxy dağıtımlarında sıkı proxy IP'leri ve üstbilgi denetimleri vardır.
- Doğrudan mesajlar varsayılan olarak açık erişim yerine eşleştirme veya izin listeleri kullanır.
- Gruplar bahsetme veya açık izin listeleri gerektirir.
- Paylaşılan kanallar kişisel kimlik bilgilerine erişmez.
- Ana olmayan oturumlar korumalı alan modunda çalışır.
- Ana makinede exec kullanımı ve yükseltilmiş araçlar reddedilir veya onaya tabidir.
- Günlükler gizli bilgileri maskeler.
- Kritik denetim bulguları giderilmiştir.
- Geri alma adımları test edilmiş ve belgelenmiştir.
