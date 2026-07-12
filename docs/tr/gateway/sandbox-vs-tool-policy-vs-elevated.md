---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Bir aracın engellenme nedenleri: korumalı alan çalışma zamanı, araç izin/ret ilkesi ve yükseltilmiş yürütme geçitleri'
title: Korumalı alan, araç politikası ve yükseltilmiş yetkiler arasındaki farklar
x-i18n:
    generated_at: "2026-07-12T12:20:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw, birbiriyle ilişkili ancak farklı üç denetime sahiptir:

1. **Korumalı alan** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`), **araçların nerede çalışacağını** (korumalı alan arka ucu veya ana makine) belirler.
2. **Araç politikası** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`), **hangi araçların kullanılabilir/izinli olduğunu** belirler.
3. **Yükseltilmiş** (`tools.elevated.*`, `agents.list[].tools.elevated.*`), korumalı alandayken korumalı alan dışında çalıştırmaya yönelik **yalnızca exec için bir kaçış mekanizmasıdır** (varsayılan olarak `gateway`; exec hedefi `node` olarak yapılandırılmışsa `node`).

## Hızlı hata ayıklama

OpenClaw'ın _gerçekte_ ne yaptığını görmek için inceleyiciyi kullanın:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Şunları gösterir:

- etkin korumalı alan modu/kapsamı/çalışma alanı erişimi
- oturumun şu anda korumalı alanda olup olmadığı (ana veya ana olmayan)
- etkin korumalı alan araç izin/ret kuralları (ve bunların ajan/genel/varsayılan düzeylerinden hangisinden geldiği)
- yükseltilmiş erişim geçitleri ve düzeltme anahtarı yolları

## Korumalı alan: araçların çalıştığı yer

Korumalı alan kullanımı `agents.defaults.sandbox.mode` tarafından denetlenir:

- `"off"`: her şey ana makinede çalışır.
- `"non-main"`: yalnızca ana olmayan oturumlar korumalı alanda çalışır (gruplar/kanallar için yaygın bir “sürpriz”).
- `"all"`: her şey korumalı alanda çalışır.

`agents.defaults.sandbox.workspaceAccess`, korumalı alanın neleri görebileceğini denetler: `"none"`, `"ro"` veya `"rw"`.

Tam matris (kapsam, çalışma alanı bağlamaları, imajlar) için [Korumalı Alan Kullanımı](/tr/gateway/sandboxing) bölümüne bakın.

### Bağlama noktaları (hızlı güvenlik denetimi)

- `docker.binds`, korumalı alan dosya sistemini _deler_: bağladığınız her şey, ayarladığınız modla (`:ro` veya `:rw`) kapsayıcının içinde görünür.
- Modu belirtmezseniz varsayılan olarak okuma-yazma kullanılır; kaynak kod/gizli bilgiler için `:ro` tercih edin.
- `scope: "shared"`, ajan başına bağlamaları yok sayar (yalnızca genel bağlamalar uygulanır).
- OpenClaw, bağlama kaynaklarını iki kez doğrular: önce normalleştirilmiş kaynak yolunda, ardından mevcut en derin üst dizin üzerinden çözümledikten sonra. Sembolik bağlantılı üst dizinlerden yapılan kaçışlar, engellenen yol veya izin verilen kök denetimlerini atlatamaz.
- Mevcut olmayan uç yollar da güvenli biçimde denetlenir. `/workspace/alias-out/new-file`, sembolik bağlantılı bir üst dizin üzerinden engellenmiş bir yola veya yapılandırılmış izinli köklerin dışına çözümleniyorsa bağlama reddedilir.
- `/var/run/docker.sock` yolunu bağlamak, korumalı alana fiilen ana makine denetimi verir; bunu yalnızca bilinçli olarak yapın.
- Çalışma alanı erişimi (`workspaceAccess`), bağlama modlarından bağımsızdır.

## Araç politikası: hangi araçların mevcut/çağrılabilir olduğu

Şu katmanlar önemlidir:

- **Araç profili**: `tools.profile` ve `agents.list[].tools.profile` (temel izin listesi)
- **Sağlayıcı araç profili**: `tools.byProvider[provider].profile` ve `agents.list[].tools.byProvider[provider].profile`
- **Genel/ajan başına araç politikası**: `tools.allow`/`tools.deny` ve `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Sağlayıcı araç politikası**: `tools.byProvider[provider].allow/deny` ve `agents.list[].tools.byProvider[provider].allow/deny`
- **Korumalı alan araç politikası** (yalnızca korumalı alandayken uygulanır): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` ve `agents.list[].tools.sandbox.tools.*`

Pratik kurallar:

- `deny` her zaman önceliklidir.
- `allow` boş değilse diğer her şey engellenmiş kabul edilir.
- Araç politikası kesin engeldir: `/exec`, reddedilmiş bir `exec` aracını geçersiz kılamaz.
- Araç politikası, araç kullanılabilirliğini ada göre filtreler; `exec` içindeki yan etkileri incelemez. `exec` izinliyse `write`, `edit` veya `apply_patch` araçlarını reddetmek kabuk komutlarını salt okunur hâle getirmez.
- `/exec`, yalnızca yetkili göndericiler için oturum varsayılanlarını değiştirir; araç erişimi vermez.
- Sağlayıcı araç anahtarları `provider` (ör. `google-antigravity`) veya `provider/model` (ör. `openai/gpt-5.4`) kabul eder.
- Bir araç politikası adımı araçları kaldırdığında veya bir korumalı alan araç politikası çağrıyı engellediğinde Gateway günlükleri `agents/tool-policy` denetim girdileri içerir. Kural etiketini, yapılandırma anahtarını ve etkilenen araç adlarını görmek için `openclaw logs` kullanın.

### Araç grupları (kısaltmalar)

Araç politikaları (genel, ajan, korumalı alan), birden fazla araca genişletilen `group:*` girdilerini destekler:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Kullanılabilir gruplar:

| Grup               | Araçlar                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash`, `exec` için bir diğer ad olarak kabul edilir)                                                                                                                               |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                   |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                                                                                  |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                            |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                    |
| `group:ui`         | `browser`, `canvas`                                                                                                                                                                                                      |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                   |
| `group:messaging`  | `message`                                                                                                                                                                                                                |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                      |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                                                                                 |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                     |
| `group:openclaw`   | yerleşik OpenClaw araçlarının çoğu (`read`/`write`/`edit`/`apply_patch`/`exec`/`process` dosya sistemi ve çalışma zamanı temel araçları, `canvas` ve sağlayıcı pluginleri hariç)                                           |
| `group:plugins`    | `bundle-mcp` üzerinden sunulan yapılandırılmış MCP sunucuları dâhil, yüklenmiş ve pluginlere ait tüm araçlar                                                                                                             |

Salt okunur ajanlarda, korumalı alan dosya sistemi politikası veya ayrı bir ana makine sınırı salt okunur kısıtlamayı zorunlu kılmıyorsa dosya sistemini değiştiren araçların yanı sıra `group:runtime` grubunu da reddedin.

Korumalı alandaki MCP sunucuları için korumalı alan araç politikası ikinci bir izin geçididir. `mcp.servers` yapılandırılmışsa ancak korumalı alandaki turlarda yalnızca yerleşik araçlar görünüyorsa `tools.sandbox.tools.alsoAllow` listesine `bundle-mcp`, `group:plugins` veya `outlook__send_mail` ya da `outlook__*` gibi sunucu önekli bir MCP araç adı/glob kalıbı ekleyin; ardından gateway'i yeniden başlatın/yeniden yükleyin ve araç listesini yeniden yakalayın. Sunucu glob kalıpları sağlayıcı açısından güvenli MCP sunucu önekini kullanır: `[A-Za-z0-9_-]` dışındaki karakterler `-` olur, harfle başlamayan adlara `mcp-` öneki eklenir ve uzun veya yinelenen önekler kısaltılabilir ya da son ek alabilir.

`openclaw doctor` şu anda `mcp.servers` içindeki OpenClaw tarafından yönetilen sunucular için bu yapıyı denetler. Paketlenmiş plugin bildirimlerinden veya Claude `.mcp.json` dosyasından yüklenen MCP sunucuları aynı korumalı alan geçidini kullanır; ancak bu tanılama henüz bu kaynakları listelemez. Araçları korumalı alan turlarında kaybolursa aynı izin listesi girdilerini kullanın.

## Yükseltilmiş: yalnızca exec için “ana makinede çalıştırma”

Yükseltilmiş erişim ek araçlar **vermez**; yalnızca `exec` aracını etkiler.

- Korumalı alandaysanız `/elevated on` (veya `elevated: true` ile `exec`) korumalı alanın dışında çalışır (onaylar yine de uygulanabilir).
- Oturum için exec onaylarını atlamak üzere `/elevated full` kullanın.
- Zaten doğrudan çalışıyorsanız yükseltilmiş erişim fiilen etkisizdir (geçitler yine uygulanır).
- Yükseltilmiş erişim Skills kapsamlı **değildir** ve araç izin/ret kurallarını geçersiz **kılmaz**.
- Yükseltilmiş erişim, `host=auto` üzerinden rastgele ana makineler arası geçersiz kılma yetkisi vermez; normal exec hedef kurallarını izler ve yalnızca yapılandırılmış/oturum hedefi zaten `node` olduğunda `node` değerini korur.
- `/exec`, yükseltilmiş erişimden ayrıdır. Yalnızca yetkili göndericiler için oturum başına exec varsayılanlarını ayarlar.

Geçitler:

- Etkinleştirme: `tools.elevated.enabled` (ve isteğe bağlı olarak `agents.list[].tools.elevated.enabled`)
- Gönderici izin listeleri: `tools.elevated.allowFrom.<provider>` (ve isteğe bağlı olarak `agents.list[].tools.elevated.allowFrom.<provider>`)

[Yükseltilmiş Mod](/tr/tools/elevated) bölümüne bakın.

## Yaygın “korumalı alan hapishanesi” düzeltmeleri

### “X aracı korumalı alan araç politikası tarafından engellendi”

Düzeltme anahtarları (birini seçin):

- Korumalı alanı devre dışı bırakın: `agents.defaults.sandbox.mode=off` (veya ajan başına `agents.list[].sandbox.mode=off`)
- Araca korumalı alan içinde izin verin:
  - aracı `tools.sandbox.tools.deny` listesinden kaldırın (veya ajan başına `agents.list[].tools.sandbox.tools.deny`)
  - ya da `tools.sandbox.tools.allow` listesine ekleyin (veya ajan başına izin listesine)
- `agents/tool-policy` girdisi için `openclaw logs` çıktısını denetleyin. Bu girdi korumalı alan modunu ve aracı izin kuralının mı yoksa ret kuralının mı engellediğini kaydeder.

### “Bunun ana oturum olduğunu sanıyordum; neden korumalı alanda?”

`"non-main"` modunda grup/kanal anahtarları ana oturum _değildir_. Ana oturum anahtarını (`sandbox explain` tarafından gösterilir) kullanın veya modu `"off"` olarak değiştirin.

## İlgili

- [Korumalı Alan Kullanımı](/tr/gateway/sandboxing) -- tam korumalı alan başvurusu (modlar, kapsamlar, arka uçlar, imajlar)
- [Çok Ajanlı Korumalı Alan ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar ve öncelik
- [Yükseltilmiş Mod](/tr/tools/elevated)
