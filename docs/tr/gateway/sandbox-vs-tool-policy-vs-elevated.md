---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Bir aracın neden engellendiği: sandbox çalışma zamanı, araç izin verme/reddetme ilkesi ve yükseltilmiş exec kapıları'
title: Korumalı alan, araç ilkesi ve yükseltilmiş izinler
x-i18n:
    generated_at: "2026-06-28T00:38:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw'ın üç ilişkili (ama farklı) denetimi vardır:

1. **Korumalı alan** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) **araçların nerede çalışacağını** belirler (korumalı alan arka ucu veya ana makine).
2. **Araç ilkesi** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) **hangi araçların kullanılabilir/izinli olduğunu** belirler.
3. **Yükseltilmiş** (`tools.elevated.*`, `agents.list[].tools.elevated.*`), korumalı alandayken korumalı alanın dışında çalışmak için **yalnızca exec'e özgü bir çıkış kapısıdır** (varsayılan olarak `gateway`, veya exec hedefi `node` olarak yapılandırıldığında `node`).

## Hızlı hata ayıklama

OpenClaw'ın _gerçekte_ ne yaptığını görmek için denetleyiciyi kullanın:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Şunları yazdırır:

- etkin korumalı alan modu/kapsamı/çalışma alanı erişimi
- oturumun şu anda korumalı alanda olup olmadığı (main ve non-main)
- etkin korumalı alan aracı izin/verme reddi (ve bunun agent/global/default kaynaklarından hangisinden geldiği)
- yükseltilmiş kapılar ve düzeltme anahtar yolları

## Korumalı alan: araçların nerede çalıştığı

Korumalı alan kullanımı `agents.defaults.sandbox.mode` ile denetlenir:

- `"off"`: her şey ana makinede çalışır.
- `"non-main"`: yalnızca non-main oturumlar korumalı alana alınır (gruplar/kanallar için yaygın bir "sürpriz").
- `"all"`: her şey korumalı alana alınır.

Tam matris (kapsam, çalışma alanı bağlamaları, imajlar) için [Korumalı Alan Kullanımı](/tr/gateway/sandboxing) bölümüne bakın.

### Bağlama bağlamaları (güvenlik hızlı kontrolü)

- `docker.binds`, korumalı alan dosya sistemini _deler_: bağladığınız her şey, ayarladığınız modla (`:ro` veya `:rw`) konteyner içinde görünür.
- Modu atlarsanız varsayılan okuma-yazmadır; kaynak/gizli bilgiler için `:ro` tercih edin.
- `scope: "shared"` agent başına bağlamaları yok sayar (yalnızca global bağlamalar uygulanır).
- OpenClaw bağlama kaynaklarını iki kez doğrular: önce normalleştirilmiş kaynak yolunda, sonra en derindeki mevcut üst dizin üzerinden çözdükten sonra tekrar. Sembolik bağlantı üst dizini kaçışları, engellenen yol veya izinli kök denetimlerini atlatmaz.
- Var olmayan yaprak yollar yine de güvenli şekilde denetlenir. `/workspace/alias-out/new-file`, sembolik bağlantılı bir üst dizin üzerinden engellenen bir yola veya yapılandırılmış izinli köklerin dışına çözülürse bağlama reddedilir.
- `/var/run/docker.sock` bağlamak, korumalı alana fiilen ana makine denetimi verir; bunu yalnızca bilinçli olarak yapın.
- Çalışma alanı erişimi (`workspaceAccess: "ro"`/`"rw"`) bağlama modlarından bağımsızdır.

## Araç ilkesi: hangi araçların var/çağrılabilir olduğu

İki katman önemlidir:

- **Araç profili**: `tools.profile` ve `agents.list[].tools.profile` (temel izin listesi)
- **Sağlayıcı araç profili**: `tools.byProvider[provider].profile` ve `agents.list[].tools.byProvider[provider].profile`
- **Global/agent başına araç ilkesi**: `tools.allow`/`tools.deny` ve `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Sağlayıcı araç ilkesi**: `tools.byProvider[provider].allow/deny` ve `agents.list[].tools.byProvider[provider].allow/deny`
- **Korumalı alan araç ilkesi** (yalnızca korumalı alandayken geçerlidir): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` ve `agents.list[].tools.sandbox.tools.*`

Genel kurallar:

- `deny` her zaman kazanır.
- `allow` boş değilse diğer her şey engellenmiş kabul edilir.
- Araç ilkesi kesin durdurucudur: `/exec`, reddedilmiş bir `exec` aracını geçersiz kılamaz.
- Araç ilkesi araç kullanılabilirliğini ada göre filtreler; `exec` içindeki yan etkileri incelemez. `exec` izinliyse `write`, `edit` veya `apply_patch` reddetmek kabuk komutlarını salt okunur yapmaz.
- `/exec` yalnızca yetkili göndericiler için oturum varsayılanlarını değiştirir; araç erişimi vermez.
  Sağlayıcı araç anahtarları `provider` (örn. `google-antigravity`) veya `provider/model` (örn. `openai/gpt-5.4`) kabul eder.
- Gateway günlükleri, bir araç ilkesi adımı araçları kaldırdığında veya bir korumalı alan araç ilkesi bir çağrıyı engellediğinde `agents/tool-policy` denetim girdileri içerir. Kural etiketini, yapılandırma anahtarını ve etkilenen araç adlarını görmek için `openclaw logs` kullanın.

### Araç grupları (kısaltmalar)

Araç ilkeleri (global, agent, korumalı alan), birden fazla araca genişleyen `group:*` girdilerini destekler:

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash`, `exec` için
  bir takma ad olarak kabul edilir)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  Salt okunur agent'lar için, korumalı alan dosya sistemi ilkesi veya ayrı bir ana makine sınırı salt okunur kısıtını zorunlu kılmıyorsa, dosya sistemini değiştiren araçların yanı sıra `group:runtime` grubunu da reddedin.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: tüm yerleşik OpenClaw araçları (sağlayıcı Plugin'lerini hariç tutar)
- `group:plugins`: `bundle-mcp` üzerinden açığa çıkarılan yapılandırılmış MCP sunucuları dahil, yüklenmiş tüm Plugin sahibi araçlar

Korumalı alandaki MCP sunucuları için korumalı alan araç ilkesi ikinci bir izin kapısıdır. `mcp.servers` yapılandırılmışsa ancak korumalı alandaki turlarda yalnızca yerleşik araçlar görünüyorsa, `tools.sandbox.tools.alsoAllow` içine `bundle-mcp`, `group:plugins` veya `outlook__send_mail` ya da `outlook__*` gibi sunucu önekli bir MCP araç adı/glob ekleyin, ardından gateway'i yeniden başlatın/yeniden yükleyin ve araç listesini yeniden yakalayın. Sunucu glob'ları sağlayıcı açısından güvenli MCP sunucu önekini kullanır: `[A-Za-z0-9_-]` dışındaki karakterler `-` olur, harfle başlamayan adlar `mcp-` öneki alır ve uzun ya da yinelenen önekler kısaltılabilir veya son ek alabilir.

`openclaw doctor` şu anda OpenClaw tarafından yönetilen `mcp.servers` içindeki sunucular için bu şekli denetler. Paketlenmiş Plugin manifestlerinden veya Claude `.mcp.json` dosyasından yüklenen MCP sunucuları aynı korumalı alan kapısını kullanır, ancak bu tanılama bu kaynakları henüz numaralandırmaz; araçları korumalı alandaki turlarda kaybolursa aynı izin listesi girdilerini kullanın.

## Yükseltilmiş: yalnızca exec için "ana makinede çalıştır"

Yükseltilmiş ek araç vermez; yalnızca `exec` aracını etkiler.

- Korumalı alandaysanız, `/elevated on` (veya `elevated: true` ile `exec`) korumalı alanın dışında çalışır (onaylar yine de geçerli olabilir).
- Oturum için exec onaylarını atlamak üzere `/elevated full` kullanın.
- Zaten doğrudan çalışıyorsanız, yükseltilmiş fiilen işlem yapmaz (yine de kapılara tabidir).
- Yükseltilmiş **Skills kapsamlı değildir** ve araç izin/verme reddini **geçersiz kılmaz**.
- Yükseltilmiş, `host=auto` üzerinden rastgele ana makineler arası geçersiz kılmalar vermez; normal exec hedef kurallarını izler ve yalnızca yapılandırılmış/oturum hedefi zaten `node` olduğunda `node` değerini korur.
- `/exec`, yükseltilmişten ayrıdır. Yalnızca yetkili göndericiler için oturum başına exec varsayılanlarını ayarlar.

Kapılar:

- Etkinleştirme: `tools.elevated.enabled` (ve isteğe bağlı olarak `agents.list[].tools.elevated.enabled`)
- Gönderici izin listeleri: `tools.elevated.allowFrom.<provider>` (ve isteğe bağlı olarak `agents.list[].tools.elevated.allowFrom.<provider>`)

Bkz. [Yükseltilmiş Mod](/tr/tools/elevated).

## Yaygın "korumalı alan hapishanesi" düzeltmeleri

### "Araç X korumalı alan araç ilkesi tarafından engellendi"

Düzeltme anahtarları (birini seçin):

- Korumalı alanı devre dışı bırakın: `agents.defaults.sandbox.mode=off` (veya agent başına `agents.list[].sandbox.mode=off`)
- Araca korumalı alan içinde izin verin:
  - onu `tools.sandbox.tools.deny` listesinden kaldırın (veya agent başına `agents.list[].tools.sandbox.tools.deny`)
  - ya da `tools.sandbox.tools.allow` listesine ekleyin (veya agent başına izin)
- `agents/tool-policy` girdisi için `openclaw logs` denetleyin. Bu girdi korumalı alan modunu ve aracın izin kuralı mı yoksa reddetme kuralı mı tarafından engellendiğini kaydeder.

### "Bunun main olduğunu sanıyordum, neden korumalı alanda?"

`"non-main"` modunda grup/kanal anahtarları _main değildir_. Ana oturum anahtarını kullanın (`sandbox explain` tarafından gösterilir) veya modu `"off"` olarak değiştirin.

## İlgili

- [Korumalı Alan Kullanımı](/tr/gateway/sandboxing) -- tam korumalı alan başvurusu (modlar, kapsamlar, arka uçlar, imajlar)
- [Çoklu Agent Korumalı Alanı ve Araçları](/tr/tools/multi-agent-sandbox-tools) -- agent başına geçersiz kılmalar ve öncelik sırası
- [Yükseltilmiş Mod](/tr/tools/elevated)
