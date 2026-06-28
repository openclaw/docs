---
read_when:
    - Bir yan etki çalışmadan önce sormak için bir Plugin kancasına veya araca ihtiyacınız var
    - Plugin onay istemlerinin nereye iletileceğini yapılandırmanız gerekir
    - İsteğe bağlı araçlar, exec onayları ve Plugin onayları arasında karar veriyorsunuz
sidebarTitle: Permission requests
summary: Kullanıcılardan Plugin araç çağrılarını ve Plugin'e ait izin istemlerini onaylamalarını isteyin
title: Plugin izin istekleri
x-i18n:
    generated_at: "2026-06-28T00:57:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Plugin izin istekleri, bir kullanıcı onaylayana veya reddedene kadar Plugin kodunun bir araç çağrısını ya da Plugin’e ait bir işlemi duraklatmasını sağlar. Gateway `plugin.approval.*` akışını ve sohbet onay düğmeleri ile `/approve` komutlarını işleyen aynı onay UI yüzeylerini kullanırlar.

Plugin izin isteklerini Plugin/uygulama izinleri için kullanın. Bunlar host exec onaylarının, isteğe bağlı araç izin listelerinin veya Codex’in yerel izin incelemesinin yerine geçmez.

## Doğru geçidi seçin

İhtiyacınız olan karar noktasına uygun geçidi seçin:

| Geçit                             | Ne zaman kullanılır                                                        | Neyi denetler                                                                                                           |
| --------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| İsteğe bağlı araçlar              | Kullanıcı katılmayı seçene kadar bir araç modele görünmemelidir.           | `tools.allow` üzerinden araç görünürlüğü.                                                                               |
| Plugin izin istekleri             | Bir Plugin hook’u veya Plugin’e ait işlem, bir eylem çalışmadan önce sormalıdır. | `plugin.approval.*` üzerinden çalışma zamanı onayı.                                                                     |
| Exec onayları                     | Bir host komutu veya kabuk benzeri aracın operatör onayına ihtiyacı vardır. | Host exec ilkesi ve kalıcı exec izin listeleri.                                                                         |
| Codex yerel izin istekleri        | Codex yerel kabuk, dosya, MCP veya app-server eylemlerinden önce sorar.     | Codex app-server veya yerel hook onay işleme; OpenClaw isteme metninin sahibi olduğunda Plugin onayları üzerinden yönlendirilir. |
| MCP onay istemleri                | Bir Codex MCP sunucusu bir araç çağrısı için onay ister.                   | OpenClaw Plugin onayları üzerinden köprülenen MCP onay yanıtları.                                                       |

İsteğe bağlı araçlar keşif zamanı geçididir. Plugin izin istekleri çağrı başına bir geçittir. Hassas bir aracın model tarafından görülebilmeden önce açık katılım ve eylem çalışmadan önce onay gerektirmesi gerektiğinde ikisini birlikte kullanın.

## Bir araç çağrısından önce onay isteyin

Plugin tarafından yazılan çoğu istem bir `before_tool_call` hook’unda başlamalıdır. Hook, model bir araç seçtikten sonra ve OpenClaw onu çalıştırmadan önce çalışır:

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
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

İstem metnini eylemi onaylayacak kişi için yazın:

- `title` kısa ve eylem odaklı olsun. Gateway en fazla 80 karakter kabul eder.
- `description` belirli ve sınırlı olsun. Gateway en fazla 256 karakter kabul eder.
- Eylemi, hedefi ve riski ekleyin. Sohbet onay yüzeylerinde görünmemesi gereken gizli anahtarları, token’ları veya özel yükleri eklemeyin.
- `severity: "critical"` değerini yalnızca yanlış kararın üretim hasarına veya veri kaybına neden olabileceği eylemler için kullanın.
- Kalıcı güven bu eylem için güvenli değilse `allowedDecisions: ["allow-once", "deny"]` kullanın.

## Karar davranışı

OpenClaw `plugin:` ID’si olan bekleyen bir onay oluşturur, bunu kullanılabilir onay yüzeylerine iletir ve bir karar bekler.

| Karar             | Sonuç                                                                     |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | Geçerli çağrı devam eder.                                                 |
| `allow-always`    | Geçerli çağrı devam eder ve karar Plugin’e geçirilir.                     |
| `deny`            | Çağrı reddedilmiş araç sonucu ile engellenir.                             |
| Zaman aşımı       | `timeoutBehavior` `"allow"` olmadığı sürece çağrı engellenir.             |
| İptal             | Çalıştırma durdurulduğunda çağrı engellenir.                              |
| Onay rotası yok   | Bağlı hiçbir onay yüzeyi bunu çözemediği için çağrı engellenir.           |

`allow-always` yalnızca istekte bulunan Plugin veya çalışma zamanı bu kalıcılığı uyguladığında kalıcıdır. Sıradan `before_tool_call.requireApproval` hook’ları için OpenClaw, `allow-once` ve `allow-always` kararlarını geçerli çağrıya yönelik onay kararları olarak ele alır ve çözümlenen değeri `onResolution`’a geçirir. Plugin’iniz `allow-always` sunuyorsa, gelecekte hangi çağrılara güvendiğini tam olarak belgeleyin ve uygulayın.

Hook ayrıca `params` döndürürse, OpenClaw bu parametre değişikliklerini yalnızca onay başarılı olduktan sonra uygular. Daha düşük öncelikli bir hook, daha yüksek öncelikli bir hook onay istemiş olsa bile yine de engelleyebilir.

`allowedDecisions`, kullanıcıya gösterilen düğmeleri ve komutları sınırlar. Gateway, isteğin sunmadığı herhangi bir karar için çözümleme girişimini reddeder.

## Onay istemlerini yönlendirin

Onay istemleri yerel UI yüzeylerinde veya onay işlemeyi destekleyen sohbet kanallarında çözümlenebilir. Plugin onay istemlerini açık sohbet hedeflerine iletmek için `approvals.plugin` yapılandırın:

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

`approvals.plugin`, `approvals.exec`’ten bağımsızdır. Exec onayı iletmeyi etkinleştirmek Plugin onay istemlerini yönlendirmez; Plugin onayı iletmeyi etkinleştirmek de host exec ilkesini değiştirmez.

Bir istem manuel onay metni içerdiğinde, sunulan kararlardan biriyle çözümleyin:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Tam iletme modeli, aynı sohbet onay davranışı, yerel kanal teslimi ve kanala özgü onaylayan kuralları için [Gelişmiş exec onayları](/tr/tools/exec-approvals-advanced#plugin-approval-forwarding) bölümüne bakın.

## Codex yerel izinleri

Codex yerel izin istemleri de Plugin onayları üzerinden ilerleyebilir, ancak sahiplikleri Plugin tarafından yazılmış hook’lardan farklıdır.

- Codex app-server onay istekleri Codex incelemesinden sonra OpenClaw üzerinden yönlendirilir.
- Yerel hook `permission_request` rölesi, bu röle etkin olduğunda `plugin.approval.request` üzerinden sorabilir.
- MCP araç onay istemleri, Codex `_meta.codex_approval_kind` değerini `"mcp_tool_call"` olarak işaretlediğinde Plugin onayları üzerinden yönlendirilir.

Codex’e özgü davranış ve fallback kuralları için [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations) bölümüne bakın.

## Sorun giderme

**Araç, Plugin onaylarının kullanılamadığını söylüyor.** Hiçbir onay UI’sı veya yapılandırılmış onay rotası isteği kabul etmedi. Onay yetenekli bir istemci bağlayın, aynı sohbet içinde `/approve` destekleyen bir kanal kullanın veya `approvals.plugin` yapılandırın.

**`allow-always` görünüyor ama sonraki çağrı tekrar istem gösteriyor.** Genel Plugin onay akışı rastgele hook’lar için güveni otomatik olarak kalıcı hale getirmez. `onResolution("allow-always")` sonrasında Plugin’e ait güveni Plugin’inizde kalıcı hale getirin veya yalnızca `allow-once` ve `deny` sunun.

**`/approve` kararı reddediyor.** İstek `allowedDecisions` değerini kısıtladı. İstemde yazdırılan kararlardan birini kullanın.

**Bir Slack, Discord, Telegram veya Matrix istemi exec onaylarından farklı yönlendiriliyor.** Plugin onayları ve exec onayları ayrı yapılandırma kullanır ve farklı yetkilendirme kontrolleri kullanabilir. Yalnızca `approvals.exec` denetlemek yerine `approvals.plugin` değerini ve kanalın Plugin onay desteğini doğrulayın.

## İlgili

- [Plugin hook’ları](/tr/plugins/hooks#tool-call-policy)
- [Plugin oluşturma](/tr/plugins/building-plugins#registering-agent-tools)
- [Gelişmiş exec onayları](/tr/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway protokolü](/tr/gateway/protocol)
- [Codex harness çalışma zamanı](/tr/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
