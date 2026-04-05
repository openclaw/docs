---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Bir aracın neden engellendiği: sandbox çalışma zamanı, araç allow/deny ilkesi ve elevated exec geçitleri'
title: Sandbox ve Araç İlkesi ve Elevated
x-i18n:
    generated_at: "2026-04-05T13:54:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d5ddc1dbf02b89f18d46e5473ff0a29b8a984426fe2db7270c170f2de0cdeac
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox ve Araç İlkesi ve Elevated

OpenClaw'da birbiriyle ilişkili (ama farklı) üç denetim vardır:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`), **araçların nerede çalışacağını** belirler (Docker'a karşı ana makine).
2. **Araç ilkesi** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`), **hangi araçların kullanılabilir/izinli olduğunu** belirler.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`), sandbox içinde olduğunuzda sandbox dışında çalıştırmak için **yalnızca exec'e özel bir kaçış kapısıdır** (varsayılan olarak `gateway`, veya exec hedefi `node` olarak yapılandırıldığında `node`).

## Hızlı hata ayıklama

OpenClaw'ın gerçekte ne yaptığını görmek için inspector'ı kullanın:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Şunları yazdırır:

- etkin sandbox mode/scope/workspace access
- oturumun şu anda sandbox içinde olup olmadığı (ana ve ana olmayan)
- etkin sandbox araç allow/deny durumu (ve bunun agent/global/default içinden gelip gelmediği)
- elevated geçitleri ve düzeltme için anahtar yolları

## Sandbox: araçların nerede çalıştığı

Sandboxing, `agents.defaults.sandbox.mode` ile denetlenir:

- `"off"`: her şey ana makinede çalışır.
- `"non-main"`: yalnızca ana olmayan oturumlar sandbox içindedir (gruplar/kanallar için yaygın “şaşkınlık” durumu).
- `"all"`: her şey sandbox içindedir.

Tam matris için (scope, workspace mount'ları, imajlar) bkz. [Sandboxing](/gateway/sandboxing).

### Bind mount'lar (güvenlik hızlı denetimi)

- `docker.binds`, sandbox dosya sistemini _deler_: mount ettiğiniz her şey ayarladığınız modla (`:ro` veya `:rw`) kapsayıcı içinde görünür olur.
- Modu atlarsanız varsayılan okuma-yazmadır; kaynaklar/gizli veriler için `:ro` tercih edin.
- `scope: "shared"`, agent başına bind'ları yok sayar (yalnızca genel bind'lar uygulanır).
- OpenClaw, bind kaynaklarını iki kez doğrular: önce normalize edilmiş kaynak yolda, sonra da var olan en derin üst öğe üzerinden çözümlendikten sonra. Sembolik bağlantı üst öğesi üzerinden kaçışlar, engellenen yol veya izinli kök denetimlerini aşamaz.
- Var olmayan yaprak yollar yine de güvenli şekilde denetlenir. `/workspace/alias-out/new-file`, sembolik bağlantılı bir üst öğe üzerinden engellenen bir yola veya yapılandırılmış izinli köklerin dışına çözümlenirse bind reddedilir.
- `/var/run/docker.sock` bağlamak fiilen ana makine denetimini sandbox'a verir; bunu yalnızca kasıtlı olarak yapın.
- Workspace access (`workspaceAccess: "ro"`/`"rw"`), bind modlarından bağımsızdır.

## Araç ilkesi: hangi araçların var olduğu/çağrılabildiği

İki katman önemlidir:

- **Araç profili**: `tools.profile` ve `agents.list[].tools.profile` (temel allowlist)
- **Sağlayıcı araç profili**: `tools.byProvider[provider].profile` ve `agents.list[].tools.byProvider[provider].profile`
- **Genel/agent başına araç ilkesi**: `tools.allow`/`tools.deny` ve `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Sağlayıcı araç ilkesi**: `tools.byProvider[provider].allow/deny` ve `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox araç ilkesi** (yalnızca sandbox içindeyken uygulanır): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` ve `agents.list[].tools.sandbox.tools.*`

Temel kurallar:

- `deny` her zaman kazanır.
- `allow` boş değilse diğer her şey engellenmiş kabul edilir.
- Araç ilkesi kesin durdurmadır: `/exec`, reddedilmiş bir `exec` aracını geçersiz kılamaz.
- `/exec`, yalnızca yetkili göndericiler için oturum varsayılanlarını değiştirir; araç erişimi vermez.
  Sağlayıcı araç anahtarları ya `provider` (ör. `google-antigravity`) ya da `provider/model` (ör. `openai/gpt-5.4`) kabul eder.

### Araç grupları (kısayollar)

Araç ilkeleri (genel, agent, sandbox), birden çok araca genişleyen `group:*` girdilerini destekler:

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash`,
  `exec` için bir takma ad olarak kabul edilir)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `tts`
- `group:openclaw`: tüm yerleşik OpenClaw araçları (sağlayıcı plugin'leri hariç)

## Elevated: yalnızca exec için "ana makinede çalıştır"

Elevated ek araçlar vermez; yalnızca `exec` aracını etkiler.

- Sandbox içindeyseniz `/elevated on` (veya `elevated: true` ile `exec`), sandbox dışında çalıştırır (onaylar yine de uygulanabilir).
- Oturum için exec onaylarını atlamak üzere `/elevated full` kullanın.
- Zaten doğrudan çalışıyorsanız elevated fiilen etkisizdir (yine de geçitlidir).
- Elevated **skill kapsamlı değildir** ve araç allow/deny ayarlarını geçersiz kılmaz.
- Elevated, `host=auto` üzerinden keyfi çapraz ana makine geçersiz kılmaları vermez; normal exec hedef kurallarını izler ve yalnızca yapılandırılmış/oturum hedefi zaten `node` ise `node` değerini korur.
- `/exec`, elevated'dan ayrıdır. Yalnızca yetkili göndericiler için oturum başına exec varsayılanlarını ayarlar.

Geçitler:

- Etkinleştirme: `tools.elevated.enabled` (ve isteğe bağlı olarak `agents.list[].tools.elevated.enabled`)
- Gönderici allowlist'leri: `tools.elevated.allowFrom.<provider>` (ve isteğe bağlı olarak `agents.list[].tools.elevated.allowFrom.<provider>`)

Bkz. [Elevated Mode](/tools/elevated).

## Yaygın "sandbox hapishanesi" düzeltmeleri

### "Tool X blocked by sandbox tool policy"

Düzeltme anahtarları (birini seçin):

- Sandbox'ı devre dışı bırakın: `agents.defaults.sandbox.mode=off` (veya agent başına `agents.list[].sandbox.mode=off`)
- Araca sandbox içinde izin verin:
  - onu `tools.sandbox.tools.deny` içinden kaldırın (veya agent başına `agents.list[].tools.sandbox.tools.deny`)
  - veya `tools.sandbox.tools.allow` içine ekleyin (veya agent başına allow)

### "Bunun ana olduğunu sanıyordum, neden sandbox içinde?"

`"non-main"` modunda grup/kanal anahtarları _ana değildir_. Ana oturum anahtarını kullanın (`sandbox explain` bunu gösterir) veya modu `"off"` olarak değiştirin.

## Ayrıca bkz.

- [Sandboxing](/gateway/sandboxing) -- tam sandbox başvurusu (modlar, kapsamlar, arka uçlar, imajlar)
- [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) -- agent başına geçersiz kılmalar ve öncelik
- [Elevated Mode](/tools/elevated)
