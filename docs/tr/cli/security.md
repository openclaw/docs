---
read_when:
    - Yapılandırma/durum üzerinde hızlı bir güvenlik denetimi çalıştırmak istiyorsunuz
    - Güvenli “fix” önerilerini uygulamak istiyorsunuz (izinler, varsayılanları sıkılaştırma)
summary: '`openclaw security` için CLI başvurusu (denetim ve yaygın güvenlik hatalarını düzeltme)'
title: security
x-i18n:
    generated_at: "2026-04-05T13:49:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: e5a3e4ab8e0dfb6c10763097cb4483be2431985f16de877523eb53e2122239ae
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

Güvenlik araçları (denetim + isteğe bağlı düzeltmeler).

İlgili:

- Güvenlik kılavuzu: [Security](/gateway/security)

## Denetim

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Denetim, birden fazla DM gönderenin ana oturumu paylaştığı durumlarda uyarır ve **güvenli DM modu** önerir: paylaşılan gelen kutuları için `session.dmScope="per-channel-peer"` (veya çok hesaplı kanallar için `per-account-channel-peer`).
Bu, işbirlikçi/paylaşılan gelen kutularının güçlendirilmesi içindir. Birbirine karşılıklı olarak güvenmeyen/hasmane operatörler arasında paylaşılan tek bir Gateway önerilen bir kurulum değildir; ayrı gateway’lerle (veya ayrı OS kullanıcıları/ana makinelerle) güven sınırlarını ayırın.
Ayrıca yapılandırma muhtemel paylaşımlı kullanıcı girişini gösterdiğinde `security.trust_model.multi_user_heuristic` üretir (örneğin açık DM/grup ilkesi, yapılandırılmış grup hedefleri veya joker gönderici kuralları) ve OpenClaw’ın varsayılan olarak kişisel yardımcı güven modeli kullandığını hatırlatır.
Kasıtlı paylaşımlı kullanıcı kurulumlarında, denetim rehberliği tüm oturumları sandbox içine almanızı, dosya sistemi erişimini çalışma alanı kapsamıyla sınırlamanızı ve kişisel/özel kimlikleri veya kimlik bilgilerini o çalışma zamanından uzak tutmanızı söyler.
Ayrıca küçük modeller (`<=300B`) sandbox olmadan ve web/tarayıcı araçları etkinken kullanıldığında uyarır.
Webhook girişi için, `hooks.token` Gateway token’ını yeniden kullandığında, `hooks.token` kısa olduğunda, `hooks.path="/"` olduğunda, `hooks.defaultSessionKey` ayarlanmamış olduğunda, `hooks.allowedAgentIds` kısıtlanmamış olduğunda, istek `sessionKey` geçersiz kılmaları etkin olduğunda ve geçersiz kılmalar `hooks.allowedSessionKeyPrefixes` olmadan etkin olduğunda uyarır.
Ayrıca sandbox modu kapalıyken sandbox Docker ayarları yapılandırılmışsa, `gateway.nodes.denyCommands` etkisiz desen benzeri/bilinmeyen girdiler kullanıyorsa (yalnızca tam düğüm komut adı eşleştirmesi yapılır, kabuk metni filtreleme yapılmaz), `gateway.nodes.allowCommands` tehlikeli düğüm komutlarını açıkça etkinleştiriyorsa, genel `tools.profile="minimal"` aracı profil atamalarıyla geçersiz kılınıyorsa, açık gruplar sandbox/çalışma alanı korumaları olmadan çalışma zamanı/dosya sistemi araçlarını açığa çıkarıyorsa ve kurulu eklenti plugin araçlarına gevşek araç ilkesi altında erişilebiliyorsa da uyarır.
Ayrıca `gateway.allowRealIpFallback=true` değerini de işaretler (proxy’ler yanlış yapılandırılmışsa başlık sahteciliği riski) ve `discovery.mdns.mode="full"` için de uyarır (mDNS TXT kayıtları yoluyla meta veri sızıntısı).
Ayrıca sandbox tarayıcı Docker `bridge` ağını `sandbox.browser.cdpSourceRange` olmadan kullandığında uyarır.
Ayrıca tehlikeli sandbox Docker ağ modlarını da işaretler (`host` ve `container:*` ad alanı birleşimleri dahil).
Ayrıca mevcut sandbox tarayıcı Docker kapsayıcılarında eksik/eski hash etiketleri varsa da uyarır (örneğin `openclaw.browserConfigEpoch` eksik olan geçiş öncesi kapsayıcılar) ve `openclaw sandbox recreate --browser --all` komutunu önerir.
Ayrıca npm tabanlı plugin/hook kurulum kayıtları sabitlenmemişse, bütünlük meta verileri eksikse veya şu anda kurulu paket sürümlerinden sapıyorsa da uyarır.
Kanal izin listeleri değişebilir adlara/e-posta adreslerine/etiketlere dayanıyorsa, kararlı kimlikler yerine bunları kullandığında uyarır (uygunsa Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC kapsamları).
Ayrıca `gateway.auth.mode="none"` değeri Gateway HTTP API’lerini paylaşılan bir giz olmadan erişilebilir bıraktığında uyarır (`/tools/invoke` ve etkin olan herhangi bir `/v1/*` uç noktası dahil).
`dangerous`/`dangerously` önekiyle başlayan ayarlar açık cam-kır operatör geçersiz kılmalarıdır; bunlardan birini etkinleştirmek tek başına bir güvenlik açığı raporu değildir.
Tehlikeli parametrelerin tam envanteri için [Security](/gateway/security) içindeki "Insecure or dangerous flags summary" bölümüne bakın.

SecretRef davranışı:

- `security audit`, hedeflenen yolları için desteklenen SecretRef’leri salt okunur modda çözümler.
- Bir SecretRef mevcut komut yolunda kullanılamıyorsa denetim devam eder ve çökmek yerine `secretDiagnostics` bildirir.
- `--token` ve `--password` yalnızca bu komut çağrısı için derin tarama kimlik doğrulamasını geçersiz kılar; yapılandırmayı veya SecretRef eşlemelerini yeniden yazmaz.

## JSON çıktısı

CI/ilke denetimleri için `--json` kullanın:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix` ve `--json` birlikte kullanılırsa çıktı hem düzeltme eylemlerini hem de son raporu içerir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` neleri değiştirir

`--fix`, güvenli ve deterministik iyileştirmeler uygular:

- yaygın `groupPolicy="open"` değerlerini `groupPolicy="allowlist"` olarak değiştirir (desteklenen kanallardaki hesap varyantları dahil)
- WhatsApp grup ilkesi `allowlist` değerine çevrildiğinde, bu liste mevcutsa ve yapılandırma halihazırda `allowFrom` tanımlamıyorsa, kayıtlı `allowFrom` dosyasından `groupAllowFrom` değerini başlatır
- `logging.redactSensitive` değerini `"off"` yerine `"tools"` olarak ayarlar
- durum/yapılandırma ve yaygın hassas dosyalar için izinleri sıkılaştırır
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, oturum
  `*.jsonl`)
- ayrıca `openclaw.json` içinden başvurulan yapılandırma include dosyalarının izinlerini de sıkılaştırır
- POSIX ana makinelerde `chmod`, Windows’ta `icacls` sıfırlamaları kullanır

`--fix` şunları **yapmaz**:

- token/password/API key döndürmez
- araçları devre dışı bırakmaz (`gateway`, `cron`, `exec` vb.)
- gateway bind/auth/ağ maruziyeti seçimlerini değiştirmez
- plugin/Skills kaldırmaz veya yeniden yazmaz
