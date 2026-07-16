---
read_when:
    - Yapılandırma/durum üzerinde hızlı bir güvenlik denetimi çalıştırmak istiyorsunuz
    - Güvenli "düzeltme" önerilerini uygulamak istiyorsunuz (izinler, varsayılanları sıkılaştırma)
summary: '`openclaw security` için CLI başvurusu (yaygın güvenlik tuzaklarını denetleme ve düzeltme)'
title: Güvenlik
x-i18n:
    generated_at: "2026-07-16T16:51:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Güvenlik araçları: denetim ve isteğe bağlı güvenli düzeltmeler. İlgili: [Güvenlik](/tr/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## Denetim modları

Normal `security audit`, soğuk yapılandırma/dosya sistemi/salt okunur yolunda kalır: Plugin çalışma zamanı güvenlik toplayıcılarını keşfetmez; böylece rutin denetimler, kurulu her Plugin çalışma zamanını yüklemez. `--deep`, elden gelen en iyi şekilde canlı Gateway yoklamaları ve Plugin'e ait güvenlik denetimi toplayıcıları ekler (açıkça belirtilen dahili çağıranlar da uygun bir çalışma zamanı kapsamına zaten sahip olduklarında bu toplayıcıları kullanmayı seçebilir).

Gateway parola kimlik doğrulaması yalnızca başlangıçta sağlanıyorsa denetimin bunu `hooks.token` ile karşılaştırabilmesi için aynı değeri `--auth password --password <password>` ile iletin.

## Neleri denetler?

**DM/güven modeli**

- Birden fazla DM göndericisi ana oturumu paylaştığında uyarır ve paylaşılan gelen kutuları için güvenli DM modunu önerir: `session.dmScope="per-channel-peer"` (veya çok hesaplı kanallar için `per-account-channel-peer`). Bu, birbirine güvenmeyen operatörler için yalıtım değil, iş birliğine dayalı/paylaşılan gelen kutusu sağlamlaştırmasıdır; bunun için güven sınırlarını ayrı Gateway'lerle (veya ayrı işletim sistemi kullanıcıları/ana makineleriyle) ayırın.
- Yapılandırma, muhtemel paylaşılan kullanıcı girişine işaret ettiğinde (örneğin açık DM/grup politikası, yapılandırılmış grup hedefleri veya joker karakterli gönderici kuralları) `security.trust_model.multi_user_heuristic` üretir. OpenClaw'ın varsayılan güven modeli kişisel asistandır (tek operatör); saldırgan çok kiracılı yalıtım değildir. Kasıtlı paylaşılan kullanıcı kurulumlarında: tüm oturumları korumalı alanda çalıştırın, dosya sistemi erişimini çalışma alanıyla sınırlı tutun ve kişisel/özel kimlikleri ya da kimlik bilgilerini bu çalışma zamanından uzak tutun.
- Küçük modeller (`<=300B` parametre) korumalı alan olmadan ve web/tarayıcı araçları etkin şekilde kullanıldığında uyarır.

**Webhook/kancalar**

Başlangıçta önemli olmayan bir güvenlik uyarısı günlüğe kaydedilir ve denetim, etkin Gateway paylaşılan gizli anahtar kimlik doğrulama değerlerinin (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`) `hooks.token` yeniden kullanımını işaretler. Ayrıca şu durumlarda uyarır:

- `hooks.token` kısa
- `hooks.path="/"`
- `hooks.defaultSessionKey` ayarlanmamış
- `hooks.allowedAgentIds` sınırsız
- istek `sessionKey` geçersiz kılmaları etkin
- geçersiz kılmalar `hooks.allowedSessionKeyPrefixes` olmadan etkin

Kalıcı olarak kaydedilmiş ve yeniden kullanılan bir `hooks.token` değerini yenilemek için `openclaw doctor --fix` komutunu çalıştırın, ardından harici kanca göndericilerini yeni belirteci kullanacak şekilde güncelleyin.

**Korumalı alan/araçlar**

- Korumalı alan modu kapalıyken korumalı alan Docker ayarları yapılandırılmışsa uyarır.
- `gateway.nodes.denyCommands` etkisiz, kalıp benzeri/bilinmeyen girdiler kullandığında uyarır (eşleştirme yalnızca tam Node komut adıyla yapılır, kabuk metni filtrelenmez).
- `gateway.nodes.allowCommands` tehlikeli Node komutlarını açıkça etkinleştirdiğinde uyarır.
- Genel `tools.profile="minimal"` değeri aracı profilleri tarafından geçersiz kılındığında uyarır.
- Yazma/düzenleme araçları devre dışı bırakılmışken `exec` kısıtlayıcı bir korumalı alan dosya sistemi sınırı olmadan hâlâ kullanılabiliyorsa uyarır.
- Açık DM'ler veya gruplar, çalışma zamanı/dosya sistemi araçlarını korumalı alan/çalışma alanı korumaları olmadan erişime açtığında uyarır.
- Kurulu Plugin araçlarına izin verici araç politikası kapsamında erişilebiliyorsa uyarır.

**Korumalı alan tarayıcısı**

- Korumalı alan tarayıcısı, `sandbox.browser.cdpSourceRange` olmadan Docker `bridge` ağını kullandığında uyarır.
- `host` ve `container:*` ad alanı birleştirmeleri dâhil olmak üzere tehlikeli korumalı alan Docker ağ modlarını işaretler.
- Mevcut korumalı alan tarayıcısı Docker kapsayıcılarında eksik/eski karma etiketleri bulunduğunda (örneğin `openclaw.browserConfigEpoch` bulunmayan geçiş öncesi kapsayıcılar) uyarır ve `openclaw sandbox recreate --browser --all` komutunu önerir.

**Ağ/keşif**

- `gateway.allowRealIpFallback=true` seçeneğini işaretler (proxy'ler yanlış yapılandırılmışsa üstbilgi sahteciliği riski).
- `discovery.mdns.mode="full"` seçeneğini işaretler (mDNS TXT kayıtları üzerinden meta veri sızıntısı).
- `gateway.auth.mode="none"`, Gateway HTTP API'lerini paylaşılan bir gizli anahtar olmadan erişilebilir bıraktığında (`/tools/invoke` ve etkinleştirilmiş herhangi bir `/v1/*` uç noktası) uyarır.

**Plugin'ler/kanallar**

- npm tabanlı Plugin/kanca kurulum kayıtları belirli bir sürüme sabitlenmemişse, bütünlük meta verileri eksikse veya o anda kurulu paket sürümlerinden sapmışsa uyarır.
- Kanal izin listeleri kararlı kimlikler yerine değiştirilebilir adlara/e-postalara/etiketlere dayandığında (uygun olduğu durumlarda Discord, Slack, Google Chat, Microsoft Teams, Mattermost ve IRC kapsamları) uyarır.

`dangerous`/`dangerously` önekiyle başlayan ayarlar, acil durumda kullanılmak üzere açık operatör geçersiz kılmalarıdır; bunlardan birini etkinleştirmek tek başına bir güvenlik açığı raporu değildir. Tehlikeli parametrelerin eksiksiz listesi için [Güvenlik](/tr/gateway/security) bölümündeki "Güvensiz veya tehlikeli bayrakların özeti" başlığına bakın.

## SecretRef davranışı

`security audit`, hedeflediği yollar için desteklenen SecretRef'leri salt okunur modda çözümler. Bir SecretRef mevcut komut yolunda kullanılamıyorsa denetim çökmek yerine devam eder ve `secretDiagnostics` bildirir. `--token` ve `--password`, yalnızca o komut çağrısının derin yoklama kimlik doğrulamasını geçersiz kılar; yapılandırmayı veya SecretRef eşlemelerini yeniden yazmaz.

## Engellemeler

Kasıtlı kalıcı bulguları `security.audit.suppressions` ile kabul edin. Her engelleme tam bir `checkId` ile eşleşir ve büyük/küçük harfe duyarsız `titleIncludes` ve/veya `detailIncludes` alt dizeleriyle daraltılabilir:

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

Engellenen bulgular etkin `summary` ve `findings` listesinden kaldırılır. JSON çıktısı, denetlenebilirlik için bunları `suppressedFindings` altında tutar. Engellemeler yapılandırıldığında etkin çıktı, okuyucuların denetimin filtrelendiğini anlayabilmesi için engellenemeyen bir `security.audit.suppressions.active` bilgi bulgusunu da korur. Tehlikeli yapılandırma bayrakları, bulgu başına bir bayrak olacak şekilde üretilir; dolayısıyla bir tehlikeli bayrağı kabul etmek, aynı `config.insecure_or_dangerous_flags` checkId değerini paylaşan diğer etkin bayrakları gizlemez.

Engellemeler kalıcı riskleri gizleyebileceğinden, bunların aracı tarafından çalıştırılan kabuk komutlarıyla eklenmesi veya kaldırılması, exec zaten güvenilen yerel otomasyon için `security="full"` ve `ask="off"` ile çalışmıyorsa exec onayı gerektirir.

## JSON çıktısı

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix --json` kullanıldığında çıktı hem düzeltme eylemlerini hem de nihai raporu içerir:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` neleri değiştirir?

Güvenli ve belirlenimci düzeltmeleri uygular:

- yaygın `groupPolicy="open"` değerini `groupPolicy="allowlist"` olarak değiştirir (desteklenen kanallardaki hesap değişkenleri dâhil)
- WhatsApp grup politikası `allowlist` olarak değiştiğinde, bu liste varsa ve yapılandırma henüz `allowFrom` tanımlamıyorsa `groupAllowFrom` değerini depolanan `allowFrom` dosyasından doldurur
- `logging.redactSensitive` değerini `"off"` yerine `"tools"` olarak ayarlar
- durum/yapılandırma ve yaygın hassas dosyaların (`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite` ve eski oturum yapıtları) izinlerini sıkılaştırır
- ayrıca `openclaw.json` üzerinden başvurulan yapılandırma ekleme dosyalarının izinlerini sıkılaştırır
- POSIX ana makinelerinde `chmod`, Windows'ta ise `icacls` sıfırlamalarını kullanır

`--fix` şunları **yapmaz**:

- belirteçleri/parolaları/API anahtarlarını yenilemez
- araçları (`gateway`, `cron`, `exec` vb.) devre dışı bırakmaz
- Gateway bağlama/kimlik doğrulama/ağ erişimi tercihlerini değiştirmez
- Plugin'leri/Skills'i kaldırmaz veya yeniden yazmaz

## İlgili

- [CLI başvurusu](/tr/cli)
- [Güvenlik denetimi](/tr/gateway/security)
