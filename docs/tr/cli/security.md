---
read_when:
    - Yapılandırma/durum üzerinde hızlı bir güvenlik denetimi çalıştırmak istiyorsunuz
    - Güvenli “düzelt” önerilerini uygulamak istiyorsunuz (izinler, varsayılanları sıkılaştırma)
summary: '`openclaw security` için CLI başvurusu (yaygın güvenlik açıklarını denetleme ve düzeltme)'
title: Güvenlik
x-i18n:
    generated_at: "2026-04-24T09:03:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Güvenlik araçları (denetim + isteğe bağlı düzeltmeler).

İlgili:

- Güvenlik rehberi: [Güvenlik](/tr/gateway/security)

## Denetim

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Denetim, birden fazla DM göndereninin ana oturumu paylaştığı durumlarda uyarır ve **güvenli DM modu** önerir: paylaşılan gelen kutuları için `session.dmScope="per-channel-peer"` (veya çok hesaplı kanallar için `per-account-channel-peer`).
Bu, iş birlikçi/paylaşılan gelen kutusu sağlamlaştırması içindir. Karşılıklı olarak güvenilmeyen/çekişmeli operatörler arasında paylaşılan tek bir Gateway önerilen bir kurulum değildir; güven sınırlarını ayrı Gateway'lerle (veya ayrı OS kullanıcıları/ana bilgisayarlarla) bölün.
Ayrıca yapılandırma muhtemel paylaşılan kullanıcı girişini gösterdiğinde `security.trust_model.multi_user_heuristic` de üretir (örneğin açık DM/grup ilkesi, yapılandırılmış grup hedefleri veya joker gönderen kuralları) ve OpenClaw'ın varsayılan olarak kişisel asistan güven modeli olduğunu hatırlatır.
Kasıtlı paylaşılan kullanıcı kurulumları için denetim yönlendirmesi, tüm oturumları sandbox içinde çalıştırmak, dosya sistemi erişimini çalışma alanı kapsamıyla sınırlı tutmak ve kişisel/özel kimlikleri veya kimlik bilgilerini bu çalışma zamanından uzak tutmaktır.
Ayrıca web/browser araçları etkin ve sandbox kullanılmadan küçük modeller (`<=300B`) kullanıldığında da uyarır.
Webhook girişi için, `hooks.token` Gateway belirtecini yeniden kullandığında, `hooks.token` kısa olduğunda, `hooks.path="/"` olduğunda, `hooks.defaultSessionKey` ayarlanmamış olduğunda, `hooks.allowedAgentIds` kısıtlanmamış olduğunda, istek `sessionKey` geçersiz kılmaları etkin olduğunda ve geçersiz kılmalar `hooks.allowedSessionKeyPrefixes` olmadan etkin olduğunda uyarır.
Ayrıca sandbox modu kapalıyken sandbox Docker ayarları yapılandırıldığında, `gateway.nodes.denyCommands` etkisiz desen benzeri/bilinmeyen girdiler kullandığında (yalnızca tam Node komut adı eşleştirmesi vardır, shell metni filtreleme yoktur), `gateway.nodes.allowCommands` tehlikeli Node komutlarını açıkça etkinleştirdiğinde, genel `tools.profile="minimal"` ajan araç profilleri tarafından geçersiz kılındığında, açık gruplar sandbox/çalışma alanı korumaları olmadan çalışma zamanı/dosya sistemi araçlarını açığa çıkardığında ve yüklü Plugin araçları gevşek araç ilkesi altında erişilebilir olabileceğinde de uyarır.
Ayrıca `gateway.allowRealIpFallback=true` ayarını işaretler (proxy'ler yanlış yapılandırılmışsa üstbilgi sahteciliği riski) ve `discovery.mdns.mode="full"` ayarını işaretler (mDNS TXT kayıtları üzerinden meta veri sızıntısı).
Ayrıca sandbox browser, Docker `bridge` ağı kullanırken `sandbox.browser.cdpSourceRange` ayarlı değilse uyarır.
Tehlikeli sandbox Docker ağ modlarını da işaretler (`host` ve `container:*` ad alanı birleşimleri dahil).
Ayrıca mevcut sandbox browser Docker container'larında eksik/eski hash etiketleri olduğunda da uyarır (örneğin `openclaw.browserConfigEpoch` eksik, geçiş öncesi container'lar) ve `openclaw sandbox recreate --browser --all` önerir.
Ayrıca npm tabanlı Plugin/hook kurulum kayıtları sabitlenmemiş olduğunda, bütünlük meta verisi eksik olduğunda veya şu anda yüklü paket sürümlerinden saptığında uyarır.
Kanal izin listeleri kararlı kimlikler yerine değişebilir adlara/e-postalara/etiketlere dayandığında uyarır (uygun olduğu yerlerde Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC kapsamları).
`gateway.auth.mode="none"` ayarı, Gateway HTTP API'lerini paylaşılan gizli bilgi olmadan erişilebilir bıraktığında da uyarır (`/tools/invoke` ve etkin olan herhangi bir `/v1/*` uç noktası).
`dangerous`/`dangerously` önekli ayarlar açık acil durum operatör geçersiz kılmalarıdır; bunlardan birini etkinleştirmek tek başına bir güvenlik açığı raporu değildir.
Tehlikeli parametrelerin tam envanteri için [Güvenlik](/tr/gateway/security) içindeki "Insecure or dangerous flags summary" bölümüne bakın.

SecretRef davranışı:

- `security audit`, hedeflediği yollar için desteklenen SecretRef'leri salt okunur modda çözümler.
- Bir SecretRef geçerli komut yolunda kullanılamıyorsa denetim devam eder ve çökme yerine `secretDiagnostics` bildirir.
- `--token` ve `--password` yalnızca o komut çağrısı için derin tarama kimlik doğrulamasını geçersiz kılar; yapılandırmayı veya SecretRef eşlemelerini yeniden yazmaz.

## JSON çıktısı

CI/ilke kontrolleri için `--json` kullanın:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix` ile `--json` birlikte kullanılırsa çıktı hem düzeltme eylemlerini hem de son raporu içerir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` neleri değiştirir

`--fix`, güvenli ve deterministik düzeltmeleri uygular:

- yaygın `groupPolicy="open"` ayarlarını `groupPolicy="allowlist"` olarak değiştirir (desteklenen kanallardaki hesap varyantları dâhil)
- WhatsApp grup ilkesi `allowlist` değerine çevrildiğinde, bu liste mevcutsa ve yapılandırma zaten `allowFrom` tanımlamıyorsa,
  saklanan `allowFrom` dosyasından `groupAllowFrom` değerini tohumlar
- `logging.redactSensitive` değerini `"off"` konumundan `"tools"` konumuna ayarlar
- durum/yapılandırma ve yaygın hassas dosyalar için izinleri sıkılaştırır
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, oturum
  `*.jsonl`)
- ayrıca `openclaw.json` tarafından başvurulan yapılandırma include dosyalarını da sıkılaştırır
- POSIX ana bilgisayarlarda `chmod`, Windows'ta `icacls` sıfırlamaları kullanır

`--fix` şunları **yapmaz**:

- belirteçleri/parolaları/API anahtarlarını döndürmez
- araçları devre dışı bırakmaz (`gateway`, `cron`, `exec` vb.)
- Gateway bağlama/kimlik doğrulama/ağ erişimi seçimlerini değiştirmez
- Plugin/Skills kaldırmaz veya yeniden yazmaz

## İlgili

- [CLI başvurusu](/tr/cli)
- [Güvenlik denetimi](/tr/gateway/security)
