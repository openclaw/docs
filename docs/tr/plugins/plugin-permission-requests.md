---
read_when:
    - Bir yan etki çalıştırılmadan önce sormak için bir plugin kancasına veya aracına ihtiyacınız vardır
    - Plugin onay istemlerinin nereye gönderileceğini yapılandırmanız gerekir
    - İsteğe bağlı araçlar, exec onayları ve plugin onayları arasında seçim yapıyorsunuz
sidebarTitle: Permission requests
summary: Kullanıcılardan plugin araç çağrılarını ve plugin’e ait izin istemlerini onaylamalarını isteyin
title: Plugin izin istekleri
x-i18n:
    generated_at: "2026-07-16T17:28:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Plugin izin istekleri, bir kullanıcı onaylayana veya reddedene kadar Plugin kodunun bir araç çağrısını ya da Plugin'e ait bir işlemi duraklatmasını sağlar. Bunlar Gateway `plugin.approval.*` akışını ve sohbet onay düğmeleriyle `/approve` komutlarını işleyen aynı onay kullanıcı arayüzü yüzeylerini kullanır.

Plugin/uygulama izinleri için Plugin izin isteklerini kullanın. Bunlar ana makine yürütme onaylarının, isteğe bağlı araç izin listelerinin veya Codex'in yerel izin incelemesinin yerini almaz.

## Doğru geçidi seçme

İhtiyaç duyduğunuz karar noktasına uygun geçidi seçin:

| Geçit                            | Kullanılacağı durum                                                       | Denetlediği unsur                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| İsteğe bağlı araçlar             | Kullanıcı etkinleştirene kadar bir araç modele görünmemelidir.            | `tools.allow` üzerinden araçların erişime sunulması.                                                                      |
| Plugin izin istekleri            | Bir Plugin kancası veya Plugin'e ait işlem, bir eylem çalışmadan önce sormalıdır. | `plugin.approval.*` üzerinden çalışma zamanı onayı.                                                                        |
| Yürütme onayları                 | Bir ana makine komutu veya kabuk benzeri araç, operatör onayı gerektirir. | Ana makine yürütme politikası ve kalıcı yürütme izin listeleri.                                                                |
| Codex yerel izin istekleri       | Codex, yerel kabuk, dosya, MCP veya uygulama sunucusu eylemlerinden önce sorar. | Codex uygulama sunucusu veya yerel kanca onaylarının işlenmesi; istem OpenClaw'a ait olduğunda Plugin onayları üzerinden yönlendirilir. |
| MCP onay talepleri               | Bir Codex MCP sunucusu, araç çağrısı için onay ister.                     | OpenClaw Plugin onayları üzerinden köprülenen MCP onay yanıtları.                                                              |

İsteğe bağlı araçlar, keşif zamanında uygulanan bir geçittir. Plugin izin istekleri ise her çağrı için uygulanan bir geçittir. Hassas bir aracın model tarafından görülebilmesi için açıkça etkinleştirilmesi ve eylem çalışmadan önce onaylanması gerekiyorsa ikisini birlikte kullanın.

## Araç çağrısından önce onay isteme

Plugin tarafından oluşturulan istemlerin çoğu bir `before_tool_call` kancasında başlamalıdır. Kanca, model bir araç seçtikten sonra ve OpenClaw aracı çalıştırmadan önce çalışır:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

İstem metnini, eylemi onaylayacak kişi için yazın:

- `title` metnini kısa ve eylem odaklı tutun; Gateway bunu 80 karakterle sınırlar.
- `description` metnini belirli ve sınırlı tutun; Gateway bunu 512 karakterle sınırlar.
- Eylemi, hedefi ve riski belirtin. Sohbet onay yüzeylerinde görünmemesi gereken gizli bilgileri, belirteçleri veya özel yükleri eklemeyin.
- `severity` belirtilmediğinde varsayılan olarak `"warning"` değerini alır. `"critical"` değerini yalnızca yanlış kararın üretim ortamında hasara veya veri kaybına neden olabileceği eylemler için kullanın.
- `allowedDecisions` belirtilmediğinde varsayılan olarak `["allow-once", "allow-always", "deny"]` değerini alır. Söz konusu eylem için kalıcı güvenli yetkilendirme güvenli değilse `["allow-once", "deny"]` değerini iletin.
- `timeoutMs` varsayılan olarak 120000 (2 dakika) değerini alır ve istenen değerden bağımsız olarak en fazla 600000 (10 dakika) olabilir.

## Karar davranışı

OpenClaw, `plugin:` kimliğine sahip bekleyen bir onay oluşturur, bunu kullanılabilir onay yüzeylerine iletir ve bir karar bekler.

| Karar             | Sonuç                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | Geçerli çağrı devam eder.                                                 |
| `allow-always`    | Geçerli çağrı devam eder ve karar Plugin'e iletilir.                      |
| `deny`            | Çağrı, reddedilmiş bir araç sonucuyla engellenir.                         |
| Zaman aşımı       | Çağrı engellenir.                                                         |
| İptal             | Çalıştırma iptal edildiğinde çağrı engellenir.                            |
| Onay rotası yok   | Bağlı onay yüzeylerinden hiçbiri isteği çözümleyemediği için çağrı engellenir. |

Yalnızca isteğin izin verdiği tam `allow-once` ve `allow-always` kararları yürütmeye izin verir. Bilinmeyen, hatalı biçimlendirilmiş, eşleşmeyen, eksik ve zaman aşımına uğramış kararlar güvenli biçimde reddedilir. Eski `timeoutBehavior` alanı Plugin uyumluluğu için kabul edilmeye devam eder ancak kullanımdan kaldırılmıştır ve yok sayılır; yeni kancalarda bu alanı ayarlamayın.

`allow-always`, yalnızca isteği yapan Plugin veya çalışma zamanı bu kalıcılığı uyguladığında kalıcıdır. Sıradan `before_tool_call.requireApproval` kancalarında OpenClaw, `allow-once` ve `allow-always` değerlerini geçerli çağrının onay kararları olarak değerlendirir ve çözümlenen değeri `onResolution` öğesine iletir. Plugin'iniz `allow-always` sunuyorsa gelecekte hangi çağrılara güvenildiğini tam olarak belgeleyin ve uygulayın.

Kanca ayrıca `params` döndürürse OpenClaw bu parametre değişikliklerini yalnızca onay başarılı olduktan sonra uygular. Daha düşük öncelikli bir kanca, daha yüksek öncelikli bir kanca onay istemiş olsa bile çağrıyı engelleyebilir.

`allowedDecisions`, kullanıcıya gösterilen düğmeleri ve komutları sınırlar. Gateway, isteğin sunmadığı herhangi bir karar için yapılan çözümleme girişimini reddeder.

## Onay istemlerini yönlendirme

Onay istemleri yerel kullanıcı arayüzü yüzeylerinde veya onay işlemeyi destekleyen sohbet kanallarında çözümlenebilir. Plugin onay istemlerini açık sohbet hedeflerine iletmek için `approvals.plugin` öğesini yapılandırın:

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin`, `approvals.exec` öğesinden bağımsızdır. Yürütme onayı yönlendirmesini etkinleştirmek Plugin onay istemlerini yönlendirmez; Plugin onayı yönlendirmesini etkinleştirmek de ana makine yürütme politikasını değiştirmez.

Bir istem manuel onay metni içerdiğinde, sunulan kararlardan biriyle çözümleyin:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Tam yönlendirme modeli, aynı sohbette onay davranışı, yerel kanal teslimi ve kanala özgü onaylayan kuralları için [Gelişmiş yürütme onayları](/tr/tools/exec-approvals-advanced#plugin-approval-forwarding) bölümüne bakın.

## Codex yerel izinleri

Codex yerel izin istemleri de Plugin onayları üzerinden iletilebilir ancak bunların sahipliği, Plugin tarafından oluşturulan kancalardan farklıdır.

- Codex uygulama sunucusu onay istekleri, Codex incelemesinden sonra OpenClaw üzerinden yönlendirilir.
- Yerel `permission_request` kanca aktarıcısı, etkinleştirildiğinde `plugin.approval.request` üzerinden istekte bulunabilir.
- Codex, `_meta.codex_approval_kind` öğesini `"mcp_tool_call"` olarak işaretlediğinde MCP araç onayı talepleri Plugin onayları üzerinden yönlendirilir.

Codex'e özgü davranış ve geri dönüş kuralları için [Codex çalıştırma ortamı](/tr/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations) bölümüne bakın.

## Sorun giderme

**Araç, Plugin onaylarının kullanılamadığını belirtiyor.** Hiçbir onay kullanıcı arayüzü veya yapılandırılmış onay rotası isteği kabul etmedi. Onay özelliğine sahip bir istemci bağlayın, aynı sohbette `/approve` desteği sunan bir kanal kullanın veya `approvals.plugin` öğesini yapılandırın.

**`allow-always` görünüyor ancak sonraki çağrı yeniden istem gösteriyor.** Genel Plugin onayı akışı, rastgele kancalar için güveni otomatik olarak kalıcı hâle getirmez. `onResolution("allow-always")` sonrasında Plugin'e ait güveni Plugin'inizde kalıcı hâle getirin veya yalnızca `allow-once` ve `deny` seçeneklerini sunun.

**`/approve` kararı reddediyor.** İstek, `allowedDecisions` değerini sınırlandırdı. İstemde yazdırılan kararlardan birini kullanın.

**Bir Discord, Matrix, Slack veya Telegram istemi, yürütme onaylarından farklı yönlendiriliyor.** Plugin onayları ve yürütme onayları ayrı yapılandırmalar kullanır ve farklı yetkilendirme denetimleri uygulayabilir. Yalnızca `approvals.exec` öğesini denetlemek yerine `approvals.plugin` öğesini ve kanalın Plugin onayı desteğini doğrulayın.

## İlgili içerikler

- [Plugin kancaları](/tr/plugins/hooks#tool-call-policy)
- [Plugin oluşturma](/tr/plugins/building-plugins#registering-tools)
- [Gelişmiş yürütme onayları](/tr/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway protokolü](/tr/gateway/protocol)
- [Codex çalıştırma ortamı](/tr/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
