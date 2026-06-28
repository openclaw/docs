---
read_when:
    - Gateway'i LAN, tailnet, Tailscale Serve, Funnel veya ters proxy üzerinden erişime açma
    - Gerçek mesajlaşma kullanıcılarına izin vermeden önce bir dağıtımı gözden geçirme
    - Riskli bir uzaktan erişim veya DM yapılandırmasını geri alma
sidebarTitle: Exposure runbook
summary: OpenClaw Gateway'i loopback'in ötesine açmadan önce ön kontrol ve geri alma kontrol listesi
title: Gateway açığa sunma runbook’u
x-i18n:
    generated_at: "2026-06-28T00:39:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5e94cc03b9d79a03eb16aa04bad0fd311b72f27f14182c036832382dbce3d0f
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Gateway'i yalnızca ona kimlerin erişebileceğini, nasıl kimlik doğruladıklarını,
hangi aracıları tetikleyebileceklerini ve bu aracıların hangi araçları
kullanabileceğini açıklayabildiğinizde açığa çıkarın. Emin değilseniz,
yalnızca loopback erişimine dönün ve denetimi yeniden çalıştırın.
</Warning>

Bu runbook, daha kapsamlı [Güvenlik](/tr/gateway/security) kılavuzunu uzaktan
erişim ve mesajlaşma açığa çıkarımı için bir operatör kontrol listesine dönüştürür.

## Açığa çıkarma desenini seçin

İş akışını karşılayan en dar deseni tercih edin.

| Desen                      | Ne zaman önerilir                              | Gerekli kontroller                                                                                  |
| -------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Loopback + SSH tüneli      | Kişisel kullanım, yönetici erişimi, hata ayıklama | `gateway.bind: "loopback"` ayarını koruyun ve `127.0.0.1:18789` için tünel açın                     |
| Loopback + Tailscale Serve | Control UI/WebSocket için kişisel tailnet erişimi | Gateway'i yalnızca loopback olarak tutun; Tailscale kimlik başlıklarına yalnızca desteklenen yüzeylerde güvenin |
| Tailnet/LAN bind           | Bilinen cihazlara sahip ayrılmış özel ağ       | Gateway kimlik doğrulaması, güvenlik duvarı izin listesi, herkese açık port yönlendirme yok         |
| Güvenilir ters proxy       | Gateway önünde kuruluş SSO/OIDC               | `trusted-proxy` kimlik doğrulaması, katı `trustedProxies`, başlık üzerine yazma/sıyırma kuralları, açıkça izin verilen kullanıcılar |
| Herkese açık internet      | Nadir, yüksek riskli dağıtımlar               | Kimlik farkındalıklı proxy, TLS, hız sınırları, katı izin listeleri, sandbox içindeki non-main oturumlar |

Gateway'e doğrudan herkese açık port yönlendirmesinden kaçının. Herkese açık
erişim gerekiyorsa, önüne kimlik farkındalıklı bir proxy koyun ve proxy'yi
Gateway'e giden tek ağ yolu yapın.

## Ön uçuş envanteri

Bind, proxy, Tailscale veya kanal politikasını değiştirmeden önce bunları kaydedin:

- Gateway ana makinesi, OS kullanıcısı ve durum dizini.
- Gateway URL'si ve bind modu.
- Kimlik doğrulama modu, token/parola kaynağı veya güvenilir proxy kimlik kaynağı.
- Etkin tüm kanallar ve DM'leri, grupları veya Webhook'ları kabul edip etmedikleri.
- Yerel olmayan göndericilerden erişilebilen aracılar.
- Erişilebilen her aracı için araç profili, sandbox modu ve yükseltilmiş araç politikası.
- Bu aracıların erişebildiği harici kimlik bilgileri.
- `~/.openclaw/openclaw.json` ve kimlik bilgileri için yedekleme konumu.

Bot'a birden fazla kişi mesaj gönderebiliyorsa, bunu kullanıcı başına ana makine
izolasyonu olarak değil, paylaşılan devredilmiş araç yetkisi olarak ele alın.

## Temel kontroller

Erişimi açmadan önce bunları çalıştırın:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Önce kritik bulguları çözün. Uyarılar yalnızca dağıtım için kasıtlı ve
belgelenmiş olduklarında kabul edilebilir.

Uzaktan CLI doğrulaması için kimlik bilgilerini açıkça iletin:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Yerel yapılandırma kimlik bilgilerinin açık bir uzak URL için geçerli olduğunu varsaymayın.

## Minimum güvenli temel

Açığa çıkarılmış dağıtımlar için başlangıç noktası olarak bu şekli kullanın:

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

Ardından kontrolleri teker teker genişletin. Örneğin, yazma yetkili araçları
etkinleştirmeden önce belirli bir kanal izin listesi ekleyin veya uzak Control UI
trafiğini kabul etmeden önce bir ters proxy etkinleştirin.

Katı `exec.security: "deny"` temeli, zararsız tanılamalar dahil tüm exec
çağrılarını engeller. Tanılama veya düşük riskli komutlar gerekiyorsa, bunu
yalnızca tehdit modelinizle eşleşen belirli göndericileri, aracıları, komutları
ve onay modunu seçtikten sonra gevşetin.

## DM ve grup açığa çıkarımı

Mesajlaşma kanalları güvenilmeyen giriş yüzeyleridir. DM'lere veya gruplara izin vermeden önce:

- `dmPolicy: "pairing"` veya katı `allowFrom` listelerini tercih edin.
- Her gönderici güvenilir değilse `dmPolicy: "open"` kullanmaktan kaçının.
- `"*"` izin listelerini geniş araç erişimiyle birleştirmeyin.
- Oda sıkı şekilde denetlenmiyorsa gruplarda bahsetme şartı koyun.
- Birden fazla kişi bot'a DM gönderebiliyorsa `session.dmScope: "per-channel-peer"` kullanın.
- Paylaşılan kanalları minimum araçlara ve kişisel kimlik bilgisi olmayan aracılara yönlendirin.

Eşleştirme, göndericinin bot'u tetiklemesini onaylar. Bu, o göndericiyi ayrı
bir ana makine güvenlik sınırı yapmaz.

## Ters proxy kontrolleri

Kimlik farkındalıklı proxy'ler için:

- Proxy, Gateway'e iletmeden önce kullanıcıların kimliğini doğrulamalıdır.
- Gateway portuna doğrudan erişim güvenlik duvarı veya ağ politikasıyla engellenmelidir.
- `gateway.trustedProxies` yalnızca proxy kaynak IP'lerini içermelidir.
- Proxy, istemci tarafından sağlanan kimlik ve yönlendirme başlıklarını sıyırmalı veya üzerine yazmalıdır.
- Proxy birden fazla kitleye hizmet veriyorsa `gateway.auth.trustedProxy.allowUsers` beklenen kullanıcıları listelemelidir.
- Aynı ana makinedeki loopback proxy modu, `allowLoopback` ayarını yalnızca yerel süreçler güvenilir olduğunda ve proxy kimlik başlıklarının sahibi olduğunda kullanmalıdır.

Proxy değişikliklerinden sonra `openclaw security audit --deep` çalıştırın.
Güvenilir proxy bulguları kasıtlı olarak yüksek sinyallidir, çünkü proxy kimlik
doğrulama sınırı haline gelir.

## Araç ve sandbox incelemesi

Bir aracıyı uzak göndericilere açığa çıkarmadan önce:

- Hangi oturumların ana makinede, hangilerinin sandbox içinde çalıştığını doğrulayın.
- Ana makine exec işlemini reddedin veya onay gerektirin.
- Belirli, güvenilir bir göndericinin ihtiyacı olmadıkça yükseltilmiş araçları devre dışı tutun.
- Açık veya yarı açık mesajlaşma yüzeyleri için tarayıcı, canvas, node, cron, gateway ve oturum başlatma araçlarından kaçının.
- Bind mount'ları dar tutun ve kimlik bilgisi, home, Docker socket ve sistem yollarından kaçının.
- Maddi olarak farklı güven sınırları için ayrı Gateway'ler, OS kullanıcıları veya ana makineler kullanın.

Uzak kullanıcılar tamamen güvenilir değilse, izolasyon yalnızca prompt'lardan
veya oturum etiketlerinden değil, ayrı dağıtımlardan gelmelidir.

## Değişiklik sonrası doğrulama

Her açığa çıkarma değişikliğinden sonra:

1. `openclaw security audit --deep` komutunu yeniden çalıştırın.
2. Başarılı bir yetkili bağlantıyı test edin.
3. Yetkisiz bir göndericinin veya tarayıcı oturumunun reddedildiğini test edin.
4. Günlüklerin sırları redakte ettiğini doğrulayın.
5. DM/grup yönlendirmesinin yalnızca amaçlanan aracıya ulaştığını doğrulayın.
6. Yüksek etkili araçların onay istediğini veya reddedildiğini doğrulayın.
7. Kabul edilen kalan uyarıları belgeleyin.

Geçerli değişiklik anlaşılmadan bir sonraki açığa çıkarma değişikliğine geçmeyin.

## Geri alma planı

Gateway fazla açığa çıkarılmış olabilir ise:

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

1. Herkese açık yönlendirmeyi, Tailscale Funnel'ı veya ters proxy rotalarını durdurun.
2. Gateway token'larını/parolalarını ve etkilenen entegrasyon kimlik bilgilerini döndürün.
3. `"*"` ve beklenmeyen göndericileri izin listelerinden kaldırın.
4. Son denetim günlüklerini, çalışma geçmişini, araç çağrılarını ve yapılandırma değişikliklerini inceleyin.
5. `openclaw security audit --deep` komutunu yeniden çalıştırın.
6. İş akışını karşılayan en dar desenle erişimi yeniden etkinleştirin.

## İnceleme kontrol listesi

- Belgelenmiş bir neden olmadıkça Gateway yalnızca loopback olarak kalır.
- Loopback dışı erişimde kimlik doğrulama, güvenlik duvarı ve herkese açık doğrudan rota yoktur.
- Güvenilir proxy dağıtımlarında katı proxy IP'leri ve başlık kontrolleri vardır.
- DM'ler varsayılan olarak açık erişim değil, eşleştirme veya izin listeleri kullanır.
- Gruplar bahsetme veya açık izin listeleri gerektirir.
- Paylaşılan kanallar kişisel kimlik bilgilerine ulaşmaz.
- Non-main oturumlar sandbox modunda çalışır.
- Ana makine exec ve yükseltilmiş araçlar reddedilir veya onaya bağlanır.
- Günlükler sırları redakte eder.
- Kritik denetim bulguları çözülmüştür.
- Geri alma adımları test edilmiş ve belgelenmiştir.
