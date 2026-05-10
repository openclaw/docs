---
read_when:
    - Yapılandırma/durum üzerinde hızlı bir güvenlik denetimi çalıştırmak istiyorsunuz
    - Güvenli “düzeltme” önerilerini uygulamak istiyorsunuz (izinler, varsayılanları sıkılaştırma)
summary: '`openclaw security` için CLI başvurusu (yaygın güvenlik tuzaklarını denetleme ve düzeltme)'
title: Güvenlik
x-i18n:
    generated_at: "2026-05-10T19:30:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Güvenlik araçları (denetim + isteğe bağlı düzeltmeler).

İlgili:

- Güvenlik kılavuzu: [Güvenlik](/tr/gateway/security)

## Denetim

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

Düz `security audit`, soğuk yapılandırma/dosya sistemi/salt okunur yolunda kalır. Varsayılan olarak Plugin çalışma zamanı güvenlik toplayıcılarını keşfetmez; bu nedenle rutin denetimler kurulu her Plugin çalışma zamanını yüklemez. En iyi çabayla canlı Gateway yoklamalarını ve Plugin sahibine ait güvenlik denetimi toplayıcılarını dahil etmek için `--deep` kullanın; açık iç çağırıcılar, uygun bir çalışma zamanı kapsamına zaten sahip olduklarında bu Plugin sahibine ait toplayıcılara da katılabilir.

Denetim, birden fazla DM göndereni ana oturumu paylaştığında uyarır ve **güvenli DM modu** önerir: paylaşılan gelen kutuları için `session.dmScope="per-channel-peer"` (veya çok hesaplı kanallar için `per-account-channel-peer`).
Bu, işbirliğine dayalı/paylaşılan gelen kutusu sertleştirmesi içindir. Karşılıklı güvenilmeyen/düşmanca operatörler tarafından paylaşılan tek bir Gateway önerilen bir kurulum değildir; güven sınırlarını ayrı gateway'lerle (veya ayrı işletim sistemi kullanıcıları/ana makineleriyle) bölün.
Ayrıca yapılandırma olası paylaşılan kullanıcı girişi önerdiğinde (örneğin açık DM/grup ilkesi, yapılandırılmış grup hedefleri veya joker karakter gönderen kuralları) `security.trust_model.multi_user_heuristic` üretir ve OpenClaw'ın varsayılan olarak kişisel asistan güven modeli olduğunu hatırlatır.
Kasıtlı paylaşılan kullanıcı kurulumları için denetim rehberliği, tüm oturumları sandbox'a almak, dosya sistemi erişimini çalışma alanı kapsamıyla sınırlı tutmak ve kişisel/özel kimlikleri veya kimlik bilgilerini bu çalışma zamanından uzak tutmaktır.
Ayrıca küçük modeller (`<=300B`) sandbox olmadan ve web/tarayıcı araçları etkin olarak kullanıldığında uyarır.
Webhook girişi için `hooks.token` Gateway token'ını yeniden kullandığında, `hooks.token` kısa olduğunda, `hooks.path="/"` olduğunda, `hooks.defaultSessionKey` ayarlanmamış olduğunda, `hooks.allowedAgentIds` sınırsız olduğunda, istek `sessionKey` geçersiz kılmaları etkin olduğunda ve geçersiz kılmalar `hooks.allowedSessionKeyPrefixes` olmadan etkin olduğunda uyarır.
Ayrıca sandbox Docker ayarları yapılandırılmışken sandbox modu kapalı olduğunda, `gateway.nodes.denyCommands` etkisiz desen benzeri/bilinmeyen girdiler kullandığında (yalnızca tam node komut adı eşleştirmesi, shell metni filtreleme değil), `gateway.nodes.allowCommands` tehlikeli node komutlarını açıkça etkinleştirdiğinde, genel `tools.profile="minimal"` agent araç profilleri tarafından geçersiz kılındığında, yazma/düzenleme araçları devre dışı olsa da kısıtlayıcı bir sandbox dosya sistemi sınırı olmadan `exec` hâlâ kullanılabilir olduğunda, açık gruplar sandbox/çalışma alanı korumaları olmadan çalışma zamanı/dosya sistemi araçlarını açığa çıkardığında ve kurulu Plugin araçları izin verici araç ilkesi altında erişilebilir olabildiğinde uyarır.
Ayrıca `gateway.allowRealIpFallback=true` değerini (proxy'ler yanlış yapılandırılmışsa header sahteciliği riski) ve `discovery.mdns.mode="full"` değerini (mDNS TXT kayıtları üzerinden metadata sızıntısı) işaretler.
Ayrıca sandbox tarayıcı Docker `bridge` ağını `sandbox.browser.cdpSourceRange` olmadan kullandığında uyarır.
Ayrıca tehlikeli sandbox Docker ağ modlarını (`host` ve `container:*` namespace katılımları dahil) işaretler.
Ayrıca mevcut sandbox tarayıcı Docker container'larında eksik/eski hash etiketleri olduğunda (örneğin `openclaw.browserConfigEpoch` eksik olan geçiş öncesi container'lar) uyarır ve `openclaw sandbox recreate --browser --all` önerir.
Ayrıca npm tabanlı Plugin/hook kurulum kayıtları sabitlenmemiş olduğunda, bütünlük metadata'sı eksik olduğunda veya şu anda kurulu paket sürümlerinden saptığında uyarır.
Kanal izin listeleri kararlı ID'ler yerine değişebilir adlara/e-postalara/etiketlere dayandığında uyarır (uygulanabildiği yerlerde Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC kapsamları).
`gateway.auth.mode="none"` Gateway HTTP API'lerini paylaşılan bir sır olmadan erişilebilir bıraktığında uyarır (`/tools/invoke` ve etkin herhangi bir `/v1/*` endpoint'i).
`dangerous`/`dangerously` ile öneklenmiş ayarlar açık break-glass operatör geçersiz kılmalarıdır; birini etkinleştirmek tek başına bir güvenlik açığı raporu değildir.
Eksiksiz tehlikeli parametre envanteri için [Güvenlik](/tr/gateway/security) içindeki "Güvensiz veya tehlikeli bayraklar özeti" bölümüne bakın.

SecretRef davranışı:

- `security audit`, hedeflediği yollar için desteklenen SecretRef'leri salt okunur modda çözer.
- Bir SecretRef mevcut komut yolunda kullanılamıyorsa denetim devam eder ve çökmek yerine `secretDiagnostics` bildirir.
- `--token` ve `--password` yalnızca o komut çağrısı için derin yoklama kimlik doğrulamasını geçersiz kılar; yapılandırmayı veya SecretRef eşlemelerini yeniden yazmaz.

## JSON çıktısı

CI/ilke kontrolleri için `--json` kullanın:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix` ve `--json` birleştirilirse çıktı hem düzeltme eylemlerini hem de son raporu içerir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` neleri değiştirir

`--fix` güvenli, deterministik düzeltmeler uygular:

- yaygın `groupPolicy="open"` değerini `groupPolicy="allowlist"` değerine çevirir (desteklenen kanallardaki hesap varyantları dahil)
- WhatsApp grup ilkesi `allowlist` değerine çevrildiğinde, bu liste varsa ve yapılandırma zaten
  `allowFrom` tanımlamıyorsa, saklanan `allowFrom` dosyasından `groupAllowFrom` değerini başlatır
- `logging.redactSensitive` değerini `"off"` değerinden `"tools"` değerine ayarlar
- durum/yapılandırma ve yaygın hassas dosyalar için izinleri sıkılaştırır
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, oturum
  `*.jsonl`)
- ayrıca `openclaw.json` içinden başvurulan yapılandırma include dosyalarını sıkılaştırır
- POSIX ana makinelerinde `chmod`, Windows'ta `icacls` sıfırlamaları kullanır

`--fix` şunları **yapmaz**:

- token'ları/parolaları/API anahtarlarını döndürmez
- araçları (`gateway`, `cron`, `exec` vb.) devre dışı bırakmaz
- gateway bind/auth/ağ erişimi tercihlerini değiştirmez
- Plugin'leri/Skills'i kaldırmaz veya yeniden yazmaz

## İlgili

- [CLI referansı](/tr/cli)
- [Güvenlik denetimi](/tr/gateway/security)
