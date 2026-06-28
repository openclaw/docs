---
read_when:
    - Config/state üzerinde hızlı bir güvenlik denetimi çalıştırmak istiyorsunuz
    - Güvenli "düzeltme" önerilerini uygulamak istiyorsunuz (izinler, varsayılanları sıkılaştırma)
summary: '`openclaw security` için CLI başvurusu (yaygın güvenlik açıklarını denetleme ve düzeltme)'
title: Güvenlik
x-i18n:
    generated_at: "2026-06-28T00:24:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
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

Düz `security audit`, soğuk config/dosya sistemi/salt okunur yolunda kalır. Varsayılan olarak Plugin çalışma zamanı güvenlik toplayıcılarını keşfetmez; bu nedenle rutin denetimler kurulu her Plugin çalışma zamanını yüklemez. En iyi çaba temelli canlı Gateway yoklamalarını ve Plugin'e ait güvenlik denetimi toplayıcılarını dahil etmek için `--deep` kullanın; açık iç çağırıcılar, zaten uygun bir çalışma zamanı kapsamına sahip olduklarında bu Plugin'e ait toplayıcıları da seçebilir.

Denetim, birden çok DM göndericisi ana oturumu paylaştığında uyarır ve **güvenli DM modunu** önerir: paylaşılan gelen kutuları için `session.dmScope="per-channel-peer"` (veya çok hesaplı kanallar için `per-account-channel-peer`).
Bu, işbirliğine dayalı/paylaşılan gelen kutusu sağlamlaştırması içindir. Karşılıklı olarak güvenilmeyen/hasmane operatörlerin paylaştığı tek bir Gateway önerilen bir kurulum değildir; güven sınırlarını ayrı gateway'lerle (veya ayrı işletim sistemi kullanıcıları/ana makineleriyle) ayırın.
Config olası paylaşılan kullanıcı girişini düşündürdüğünde de `security.trust_model.multi_user_heuristic` yayar (örneğin açık DM/grup ilkesi, yapılandırılmış grup hedefleri veya joker karakterli gönderici kuralları) ve OpenClaw'ın varsayılan olarak kişisel asistan güven modeli olduğunu hatırlatır.
Kasıtlı paylaşılan kullanıcı kurulumları için denetim kılavuzu, tüm oturumları sandbox'a almak, dosya sistemi erişimini çalışma alanı kapsamıyla sınırlı tutmak ve kişisel/özel kimlikleri veya kimlik bilgilerini bu çalışma zamanından uzak tutmaktır.
Küçük modeller (`<=300B`) sandbox olmadan ve web/tarayıcı araçları etkin şekilde kullanıldığında da uyarır.
Webhook girişi için başlangıç, ölümcül olmayan bir güvenlik uyarısı günlüğe kaydeder ve denetim, `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` ve `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` dahil olmak üzere etkin Gateway paylaşılan gizli anahtar kimlik doğrulama değerlerinin `hooks.token` tarafından yeniden kullanımını işaretler. Ayrıca şu durumlarda uyarır:

- `hooks.token` kısa olduğunda
- `hooks.path="/"`
- `hooks.defaultSessionKey` ayarlanmamış olduğunda
- `hooks.allowedAgentIds` sınırsız olduğunda
- istek `sessionKey` geçersiz kılmaları etkin olduğunda
- geçersiz kılmalar `hooks.allowedSessionKeyPrefixes` olmadan etkin olduğunda

Gateway parola kimlik doğrulaması yalnızca başlangıçta sağlanıyorsa, denetimin bunu `hooks.token` ile karşılaştırabilmesi için aynı değeri `openclaw security audit --auth password --password <password>` komutuna geçirin.
Kalıcı olarak saklanan ve yeniden kullanılan bir `hooks.token` değerini döndürmek için `openclaw doctor --fix` çalıştırın, ardından harici hook göndericilerini yeni hook token'ını kullanacak şekilde güncelleyin.

Sandbox Docker ayarları sandbox modu kapalıyken yapılandırıldığında, `gateway.nodes.denyCommands` etkisiz desen benzeri/bilinmeyen girdiler kullandığında (yalnızca tam node komut adı eşleşmesi, shell metni filtreleme değil), `gateway.nodes.allowCommands` tehlikeli node komutlarını açıkça etkinleştirdiğinde, genel `tools.profile="minimal"` agent araç profilleri tarafından geçersiz kılındığında, yazma/düzenleme araçları devre dışı bırakılmışken `exec` kısıtlayıcı bir sandbox dosya sistemi sınırı olmadan hâlâ kullanılabildiğinde, açık DM'ler veya gruplar çalışma zamanı/dosya sistemi araçlarını sandbox/çalışma alanı korumaları olmadan açığa çıkardığında ve kurulu Plugin araçları izin verici araç ilkesi altında erişilebilir olabildiğinde de uyarır.
Ayrıca `gateway.allowRealIpFallback=true` (proxy'ler yanlış yapılandırılırsa üstbilgi sahteciliği riski) ve `discovery.mdns.mode="full"` (mDNS TXT kayıtları üzerinden meta veri sızıntısı) değerlerini işaretler.
Sandbox tarayıcı, `sandbox.browser.cdpSourceRange` olmadan Docker `bridge` ağını kullandığında da uyarır.
Tehlikeli sandbox Docker ağ modlarını da işaretler (`host` ve `container:*` ad alanı katılımları dahil).
Mevcut sandbox tarayıcı Docker kapsayıcılarında eksik/eski hash etiketleri olduğunda da uyarır (örneğin `openclaw.browserConfigEpoch` eksik geçiş öncesi kapsayıcılar) ve `openclaw sandbox recreate --browser --all` önerir.
npm tabanlı Plugin/hook kurulum kayıtları sabitlenmemişse, bütünlük meta verileri eksikse veya şu anda kurulu paket sürümlerinden sapıyorsa da uyarır.
Kanal izin listeleri kararlı kimlikler yerine değişebilir adlara/e-postalara/etiketlere dayandığında uyarır (geçerli olduğu kapsamda Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC).
`gateway.auth.mode="none"` Gateway HTTP API'lerini paylaşılan gizli anahtar olmadan erişilebilir bıraktığında uyarır (`/tools/invoke` ve etkin herhangi bir `/v1/*` uç noktası).
`dangerous`/`dangerously` ile başlayan ayarlar, açık break-glass operatör geçersiz kılmalarıdır; birini etkinleştirmek tek başına bir güvenlik açığı raporu değildir.
Tam tehlikeli parametre envanteri için [Güvenlik](/tr/gateway/security) içindeki "Güvensiz veya tehlikeli bayraklar özeti" bölümüne bakın.

Kasıtlı kalıcı bulgular `security.audit.suppressions` ile kabul edilebilir.
Her bastırma tam bir `checkId` ile eşleşir ve büyük/küçük harfe duyarsız alt dizeler olan
`titleIncludes` ve/veya `detailIncludes` ile daraltılabilir:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

Bastırılmış bulgular etkin `summary` ve `findings` listesinden kaldırılır.
JSON çıktısı, denetlenebilirlik için bunları `suppressedFindings` altında tutar.
Bastırmalar yapılandırıldığında, etkin çıktı ayrıca bastırılamayan bir
`security.audit.suppressions.active` bilgi bulgusunu tutar; böylece okuyucular denetimin
filtrelendiğini anlayabilir. Tehlikeli config bayrakları, bulgu başına bir bayrak olarak yayılır; bu nedenle
bir tehlikeli bayrağı kabul etmek, aynı `config.insecure_or_dangerous_flags` checkId değerini paylaşan
diğer etkin bayrakları gizlemez.
Bastırmalar kalıcı riski gizleyebildiğinden, bunları agent tarafından çalıştırılan
shell komutlarıyla eklemek veya kaldırmak, exec zaten güvenilir yerel otomasyon için
`security="full"` ve `ask="off"` ile çalışmıyorsa exec onayı gerektirir.

SecretRef davranışı:

- `security audit`, hedeflenen yolları için desteklenen SecretRef'leri salt okunur modda çözer.
- Bir SecretRef geçerli komut yolunda kullanılamıyorsa denetim devam eder ve çökmek yerine `secretDiagnostics` raporlar.
- `--token` ve `--password` yalnızca o komut çağrısı için derin yoklama kimlik doğrulamasını geçersiz kılar; config veya SecretRef eşlemelerini yeniden yazmaz.

## JSON çıktısı

CI/ilke denetimleri için `--json` kullanın:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix` ve `--json` birlikte kullanılırsa çıktı hem düzeltme eylemlerini hem de nihai raporu içerir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` neleri değiştirir

`--fix` güvenli, deterministik iyileştirmeler uygular:

- yaygın `groupPolicy="open"` değerlerini `groupPolicy="allowlist"` değerine çevirir (desteklenen kanallardaki hesap varyantları dahil)
- WhatsApp grup ilkesi `allowlist` değerine çevrildiğinde, bu liste mevcutsa ve config zaten
  `allowFrom` tanımlamıyorsa, saklanan `allowFrom` dosyasından `groupAllowFrom` değerini başlatır
- `logging.redactSensitive` değerini `"off"` yerine `"tools"` olarak ayarlar
- state/config ve yaygın hassas dosyalar için izinleri sıkılaştırır
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, oturum
  `*.jsonl`)
- `openclaw.json` içinden başvurulan config include dosyalarını da sıkılaştırır
- POSIX ana makinelerinde `chmod`, Windows'ta `icacls` sıfırlamaları kullanır

`--fix` şunları **yapmaz**:

- token'ları/parolaları/API anahtarlarını döndürmez
- araçları devre dışı bırakmaz (`gateway`, `cron`, `exec` vb.)
- gateway bağlama/kimlik doğrulama/ağ maruziyeti seçimlerini değiştirmez
- Plugin'leri/Skills'i kaldırmaz veya yeniden yazmaz

## İlgili

- [CLI başvurusu](/tr/cli)
- [Güvenlik denetimi](/tr/gateway/security)
