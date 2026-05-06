---
read_when:
    - Config/durum üzerinde hızlı bir güvenlik denetimi çalıştırmak istiyorsunuz
    - Güvenli "düzeltme" önerilerini uygulamak istiyorsunuz (izinler, varsayılanları sıkılaştırma)
summary: '`openclaw security` için CLI referansı (yaygın güvenlik tuzaklarını denetleyin ve düzeltin)'
title: Güvenlik
x-i18n:
    generated_at: "2026-05-06T17:54:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e70c9ea085bc9c0edebe801e4feb876d1cb776848d693e9699f4d238fc9b60f
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

Sade `security audit`, soğuk yapılandırma/dosya sistemi/salt okunur yolunda kalır. Varsayılan olarak Plugin çalışma zamanı güvenlik toplayıcılarını keşfetmez, bu nedenle rutin denetimler kurulu her Plugin çalışma zamanını yüklemez. En iyi çaba canlı Gateway yoklamalarını ve Plugin'e ait güvenlik denetimi toplayıcılarını dahil etmek için `--deep` kullanın; açık dahili çağırıcılar, zaten uygun bir çalışma zamanı kapsamına sahip olduklarında bu Plugin'e ait toplayıcılara da dahil olmayı seçebilir.

Denetim, birden fazla DM göndericisi ana oturumu paylaştığında uyarır ve **güvenli DM modunu** önerir: paylaşılan gelen kutuları için `session.dmScope="per-channel-peer"` (veya çok hesaplı kanallar için `per-account-channel-peer`).
Bu, iş birliğine dayalı/paylaşılan gelen kutusu sertleştirmesi içindir. Birbirine güvenmeyen/hasım operatörler tarafından paylaşılan tek bir Gateway önerilen bir kurulum değildir; güven sınırlarını ayrı gateway'ler (veya ayrı işletim sistemi kullanıcıları/ana makineleri) ile ayırın.
Yapılandırma olası paylaşılan kullanıcı girişini düşündürdüğünde de `security.trust_model.multi_user_heuristic` üretir (örneğin açık DM/grup ilkesi, yapılandırılmış grup hedefleri veya joker karakterli gönderici kuralları) ve OpenClaw'ın varsayılan olarak kişisel asistan güven modeli olduğunu hatırlatır.
Bilinçli paylaşılan kullanıcı kurulumları için denetim rehberliği, tüm oturumları sandbox'a almak, dosya sistemi erişimini çalışma alanı kapsamıyla sınırlamak ve kişisel/özel kimlikleri ya da kimlik bilgilerini bu çalışma zamanının dışında tutmaktır.
Küçük modeller (`<=300B`) sandbox kullanılmadan ve web/tarayıcı araçları etkinleştirilmiş şekilde kullanıldığında da uyarır.
Webhook girişi için, `hooks.token` Gateway token'ını yeniden kullandığında, `hooks.token` kısa olduğunda, `hooks.path="/"` olduğunda, `hooks.defaultSessionKey` ayarlanmadığında, `hooks.allowedAgentIds` sınırsız olduğunda, istek `sessionKey` geçersiz kılmaları etkinleştirildiğinde ve geçersiz kılmalar `hooks.allowedSessionKeyPrefixes` olmadan etkinleştirildiğinde uyarır.
Sandbox modu kapalıyken sandbox Docker ayarları yapılandırıldığında, `gateway.nodes.denyCommands` etkisiz desen benzeri/bilinmeyen girdiler kullandığında (yalnızca tam node komut adı eşleşmesi, shell metni filtreleme değil), `gateway.nodes.allowCommands` tehlikeli node komutlarını açıkça etkinleştirdiğinde, genel `tools.profile="minimal"` aracı aracı profilleri tarafından geçersiz kılındığında, açık gruplar sandbox/çalışma alanı korumaları olmadan çalışma zamanı/dosya sistemi araçlarını açığa çıkardığında ve kurulu Plugin araçlarına izin verici araç ilkesi altında erişilebilir olabileceğinde de uyarır.
`gateway.allowRealIpFallback=true` değerini (proxy'ler yanlış yapılandırılmışsa başlık sahteciliği riski) ve `discovery.mdns.mode="full"` değerini (mDNS TXT kayıtları üzerinden metadata sızıntısı) de işaretler.
Sandbox tarayıcısı Docker `bridge` ağını `sandbox.browser.cdpSourceRange` olmadan kullandığında da uyarır.
Tehlikeli sandbox Docker ağ modlarını da işaretler (`host` ve `container:*` ad alanı birleşimleri dahil).
Mevcut sandbox tarayıcısı Docker container'larında eksik/eski hash etiketleri olduğunda da uyarır (örneğin `openclaw.browserConfigEpoch` eksik olan geçiş öncesi container'lar) ve `openclaw sandbox recreate --browser --all` önerir.
npm tabanlı Plugin/hook kurulum kayıtları sabitlenmemiş, bütünlük metadata'sı eksik veya şu anda kurulu paket sürümlerinden sapmış olduğunda da uyarır.
Kanal allowlist'leri kararlı ID'ler yerine değişebilir adlara/e-postalara/etiketlere dayandığında uyarır (geçerli olduğu yerlerde Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC kapsamları).
`gateway.auth.mode="none"` Gateway HTTP API'lerini paylaşılan bir secret olmadan erişilebilir bıraktığında uyarır (`/tools/invoke` ve etkinleştirilmiş herhangi bir `/v1/*` uç noktası).
`dangerous`/`dangerously` ile başlayan ayarlar açık acil durum operatör geçersiz kılmalarıdır; birini etkinleştirmek tek başına bir güvenlik açığı raporu değildir.
Eksiksiz tehlikeli parametre envanteri için [Güvenlik](/tr/gateway/security) içindeki "Güvensiz veya tehlikeli bayraklar özeti" bölümüne bakın.

SecretRef davranışı:

- `security audit`, hedeflenen yolları için desteklenen SecretRef'leri salt okunur modda çözer.
- Bir SecretRef mevcut komut yolunda kullanılamıyorsa, denetim devam eder ve çökmek yerine `secretDiagnostics` raporlar.
- `--token` ve `--password` yalnızca bu komut çağrısı için derin yoklama kimlik doğrulamasını geçersiz kılar; yapılandırmayı veya SecretRef eşlemelerini yeniden yazmaz.

## JSON çıktısı

CI/ilke kontrolleri için `--json` kullanın:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix` ve `--json` birlikte kullanılırsa çıktı hem düzeltme eylemlerini hem de nihai raporu içerir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` neyi değiştirir

`--fix` güvenli, deterministik iyileştirmeler uygular:

- yaygın `groupPolicy="open"` değerlerini `groupPolicy="allowlist"` olarak çevirir (desteklenen kanallardaki hesap varyantları dahil)
- WhatsApp grup ilkesi `allowlist` değerine çevrildiğinde, bu liste mevcutsa ve yapılandırma zaten
  `allowFrom` tanımlamıyorsa depolanan `allowFrom` dosyasından `groupAllowFrom` değerini besler
- `logging.redactSensitive` değerini `"off"` değerinden `"tools"` değerine ayarlar
- durum/yapılandırma ve yaygın hassas dosyalar için izinleri sıkılaştırır
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, oturum
  `*.jsonl`)
- `openclaw.json` içinden başvurulan yapılandırma include dosyalarını da sıkılaştırır
- POSIX ana makinelerinde `chmod`, Windows'ta ise `icacls` sıfırlamaları kullanır

`--fix` şunları **yapmaz**:

- token'ları/parolaları/API anahtarlarını döndürmez
- araçları devre dışı bırakmaz (`gateway`, `cron`, `exec` vb.)
- gateway bağlama/kimlik doğrulama/ağ açığa çıkarma seçimlerini değiştirmez
- plugin'leri/Skills'i kaldırmaz veya yeniden yazmaz

## İlgili

- [CLI başvurusu](/tr/cli)
- [Güvenlik denetimi](/tr/gateway/security)
