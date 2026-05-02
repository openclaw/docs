---
read_when:
    - Yapılandırma/durum üzerinde hızlı bir güvenlik denetimi çalıştırmak istiyorsunuz
    - Güvenli “düzeltme” önerilerini uygulamak istiyorsunuz (izinler, varsayılanları sıkılaştırma)
summary: '`openclaw security` için CLI başvurusu (yaygın güvenlik tuzaklarını denetleyin ve düzeltin)'
title: Güvenlik
x-i18n:
    generated_at: "2026-05-02T08:50:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
    source_path: cli/security.md
    workflow: 16
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

Düz `security audit`, soğuk yapılandırma/dosya sistemi/salt okunur yolunda kalır. Varsayılan olarak Plugin çalışma zamanı güvenlik toplayıcılarını keşfetmez, bu nedenle rutin denetimler yüklü her Plugin çalışma zamanını yüklemez. En iyi çabayla canlı Gateway yoklamalarını ve Plugin sahibi güvenlik denetimi toplayıcılarını dahil etmek için `--deep` kullanın; açık dahili çağıranlar, uygun bir çalışma zamanı kapsamına zaten sahip olduklarında bu Plugin sahibi toplayıcıları da kullanmayı seçebilir.

Denetim, birden fazla DM göndereni ana oturumu paylaştığında uyarır ve **güvenli DM modu** önerir: paylaşılan gelen kutuları için `session.dmScope="per-channel-peer"` (veya çok hesaplı kanallar için `per-account-channel-peer`).
Bu, iş birliğine dayalı/paylaşılan gelen kutularının sağlamlaştırılması içindir. Birbirine güvenmeyen/hasmane operatörler tarafından paylaşılan tek bir Gateway önerilen bir kurulum değildir; güven sınırlarını ayrı Gateway'lerle (veya ayrı işletim sistemi kullanıcıları/ana makineleriyle) ayırın.
Ayrıca yapılandırma olası paylaşılan kullanıcı girişini düşündürdüğünde (örneğin açık DM/grup ilkesi, yapılandırılmış grup hedefleri veya joker gönderen kuralları) `security.trust_model.multi_user_heuristic` yayar ve OpenClaw'ın varsayılan olarak kişisel asistan güven modeli olduğunu hatırlatır.
Bilinçli paylaşılan kullanıcı kurulumlarında denetim kılavuzu, tüm oturumları sandbox'a almak, dosya sistemi erişimini çalışma alanı kapsamıyla sınırlı tutmak ve kişisel/özel kimlikleri veya kimlik bilgilerini bu çalışma zamanından uzak tutmaktır.
Ayrıca küçük modeller (`<=300B`) sandbox olmadan ve web/tarayıcı araçları etkin halde kullanıldığında uyarır.
Webhook girişi için `hooks.token` Gateway token'ını yeniden kullandığında, `hooks.token` kısa olduğunda, `hooks.path="/"` olduğunda, `hooks.defaultSessionKey` ayarlanmamış olduğunda, `hooks.allowedAgentIds` sınırsız olduğunda, istek `sessionKey` geçersiz kılmaları etkin olduğunda ve geçersiz kılmalar `hooks.allowedSessionKeyPrefixes` olmadan etkinleştirildiğinde uyarır.
Ayrıca sandbox Docker ayarları sandbox modu kapalıyken yapılandırıldığında, `gateway.nodes.denyCommands` etkisiz desen benzeri/bilinmeyen girdiler kullandığında (yalnızca tam node komut adı eşleşmesi, kabuk metni filtrelemesi değil), `gateway.nodes.allowCommands` tehlikeli node komutlarını açıkça etkinleştirdiğinde, genel `tools.profile="minimal"` aracı profilinin ajan araç profilleri tarafından geçersiz kılındığında, açık gruplar sandbox/çalışma alanı korumaları olmadan çalışma zamanı/dosya sistemi araçlarını açığa çıkardığında ve yüklü Plugin araçlarına izin verici araç ilkesi altında erişilebilir olabileceğinde uyarır.
Ayrıca `gateway.allowRealIpFallback=true` değerini (proxy'ler yanlış yapılandırılırsa başlık sahteciliği riski) ve `discovery.mdns.mode="full"` değerini (mDNS TXT kayıtları üzerinden meta veri sızıntısı) işaretler.
Ayrıca sandbox tarayıcı Docker `bridge` ağını `sandbox.browser.cdpSourceRange` olmadan kullandığında uyarır.
Ayrıca tehlikeli sandbox Docker ağ modlarını (`host` ve `container:*` ad alanı katılımları dahil) işaretler.
Ayrıca mevcut sandbox tarayıcı Docker kapsayıcılarında eksik/eski karma etiketleri olduğunda (örneğin `openclaw.browserConfigEpoch` eksik olan geçiş öncesi kapsayıcılar) uyarır ve `openclaw sandbox recreate --browser --all` önerir.
Ayrıca npm tabanlı Plugin/hook kurulum kayıtları sabitlenmemiş, bütünlük meta verisi eksik veya şu anda yüklü paket sürümlerinden sapmış olduğunda uyarır.
Kanal izin listeleri kararlı kimlikler yerine değişebilir adlara/e-postalara/etiketlere dayandığında uyarır (uygulanabildiği yerlerde Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC kapsamları).
`gateway.auth.mode="none"` Gateway HTTP API'lerini paylaşılan bir sır olmadan erişilebilir bıraktığında uyarır (`/tools/invoke` ve etkinleştirilmiş herhangi bir `/v1/*` uç noktası).
`dangerous`/`dangerously` ile başlayan ayarlar açık kır-cam operatör geçersiz kılmalarıdır; birini etkinleştirmek tek başına bir güvenlik açığı raporu değildir.
Eksiksiz tehlikeli parametre envanteri için [Güvenlik](/tr/gateway/security) içindeki "Güvensiz veya tehlikeli bayraklar özeti" bölümüne bakın.

SecretRef davranışı:

- `security audit`, hedeflenen yolları için desteklenen SecretRef'leri salt okunur modda çözer.
- Geçerli komut yolunda bir SecretRef kullanılamıyorsa denetim devam eder ve çökme yerine `secretDiagnostics` raporlar.
- `--token` ve `--password` yalnızca bu komut çağrısı için derin yoklama kimlik doğrulamasını geçersiz kılar; yapılandırmayı veya SecretRef eşlemelerini yeniden yazmazlar.

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

`--fix` güvenli, deterministik iyileştirmeler uygular:

- yaygın `groupPolicy="open"` değerini `groupPolicy="allowlist"` olarak çevirir (desteklenen kanallardaki hesap varyantları dahil)
- WhatsApp grup ilkesi `allowlist` olarak çevrildiğinde, bu liste varsa ve yapılandırma zaten `allowFrom` tanımlamıyorsa, saklanan `allowFrom` dosyasından `groupAllowFrom` değerini başlatır
- `logging.redactSensitive` değerini `"off"` yerine `"tools"` yapar
- durum/yapılandırma ve yaygın hassas dosyalar için izinleri sıkılaştırır
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, oturum
  `*.jsonl`)
- ayrıca `openclaw.json` içinden başvurulan yapılandırma include dosyalarını sıkılaştırır
- POSIX ana makinelerde `chmod`, Windows'ta `icacls` sıfırlamaları kullanır

`--fix` şunları **yapmaz**:

- token'ları/parolaları/API anahtarlarını döndürmez
- araçları devre dışı bırakmaz (`gateway`, `cron`, `exec` vb.)
- Gateway bağlama/kimlik doğrulama/ağ erişimine açma seçimlerini değiştirmez
- Plugin'leri/Skills'leri kaldırmaz veya yeniden yazmaz

## İlgili

- [CLI başvurusu](/tr/cli)
- [Güvenlik denetimi](/tr/gateway/security)
