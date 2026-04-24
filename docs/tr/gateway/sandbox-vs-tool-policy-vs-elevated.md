---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Bir aracın neden engellendiği: sandbox çalışma zamanı, araç izin/verme ilkesi ve yükseltilmiş exec geçitleri'
title: Sandbox ve araç ilkesi ile elevated arasındaki farklar
x-i18n:
    generated_at: "2026-04-24T09:11:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw'ın üç ilişkili (ama farklı) denetimi vardır:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) araçların **nerede çalışacağını** belirler (sandbox arka ucu mu, ana bilgisayar mı).
2. **Araç ilkesi** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) **hangi araçların kullanılabilir/izinli olduğunu** belirler.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) sandbox içindeyken sandbox dışına çıkıp çalıştırmak için yalnızca **exec'e özel bir kaçış kapağıdır** (`gateway` varsayılanıdır veya exec hedefi `node` olarak yapılandırılmışsa `node`).

## Hızlı hata ayıklama

OpenClaw'ın gerçekte ne yaptığını görmek için inceleyiciyi kullanın:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Şunları yazdırır:

- etkin sandbox modu/kapsamı/çalışma alanı erişimi
- oturumun şu anda sandbox içinde olup olmadığı (main ve non-main)
- etkin sandbox araç izin/verme ilkesi (ve bunun ajan/genel/varsayılandan gelip gelmediği)
- elevated geçitleri ve düzeltme için anahtar yollar

## Sandbox: araçların nerede çalıştığı

Sandboxing, `agents.defaults.sandbox.mode` ile denetlenir:

- `"off"`: her şey ana bilgisayarda çalışır.
- `"non-main"`: yalnızca ana olmayan oturumlar sandbox içindedir (gruplar/kanallar için yaygın “sürpriz”).
- `"all"`: her şey sandbox içindedir.

Tam matris için [Sandboxing](/tr/gateway/sandboxing) bölümüne bakın (kapsam, çalışma alanı bağlamaları, görseller).

### Bind mount'lar (hızlı güvenlik denetimi)

- `docker.binds`, sandbox dosya sistemini _deler_: bağladığınız her şey, ayarladığınız kipte (`:ro` veya `:rw`) container içinde görünür olur.
- Kip belirtilmezse varsayılan okuma-yazmadır; kaynaklar/gizli bilgiler için `:ro` tercih edin.
- `scope: "shared"`, ajan başına bağlamaları yok sayar (yalnızca genel bağlamalar uygulanır).
- OpenClaw, bağlama kaynaklarını iki kez doğrular: önce normalize edilmiş kaynak yolda, sonra da en derin mevcut üst öğe üzerinden çözümlendikten sonra. Symlink üst öğe kaçışları engellenen yol veya izinli kök denetimlerini aşamaz.
- Var olmayan yaprak yollar bile güvenli biçimde denetlenir. `/workspace/alias-out/new-file`, symlink'li bir üst öğe üzerinden engellenen bir yola veya yapılandırılmış izinli köklerin dışına çözülüyorsa bağlama reddedilir.
- `/var/run/docker.sock` bağlamak fiilen sandbox'a ana bilgisayar denetimi verir; bunu yalnızca bilerek yapın.
- Çalışma alanı erişimi (`workspaceAccess: "ro"`/`"rw"`), bind kiplerinden bağımsızdır.

## Araç ilkesi: hangi araçların var olduğu/çağrılabildiği

İki katman önemlidir:

- **Araç profili**: `tools.profile` ve `agents.list[].tools.profile` (temel izin listesi)
- **Sağlayıcı araç profili**: `tools.byProvider[provider].profile` ve `agents.list[].tools.byProvider[provider].profile`
- **Genel/ajan başına araç ilkesi**: `tools.allow`/`tools.deny` ve `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Sağlayıcı araç ilkesi**: `tools.byProvider[provider].allow/deny` ve `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox araç ilkesi** (yalnızca sandbox içindeyken uygulanır): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` ve `agents.list[].tools.sandbox.tools.*`

Temel kurallar:

- `deny` her zaman kazanır.
- `allow` boş değilse, geri kalan her şey engellenmiş sayılır.
- Araç ilkesi kesin durdurma noktasıdır: `/exec`, reddedilmiş bir `exec` aracını geçersiz kılamaz.
- `/exec`, yalnızca yetkili gönderenler için oturum varsayılanlarını değiştirir; araç erişimi vermez.
  Sağlayıcı araç anahtarları `provider` (ör. `google-antigravity`) veya `provider/model` (ör. `openai/gpt-5.4`) kabul eder.

### Araç grupları (kısayollar)

Araç ilkeleri (genel, ajan, sandbox), birden fazla araca genişleyen `group:*` girdilerini destekler:

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
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: tüm yerleşik OpenClaw araçları (sağlayıcı Plugin'leri hariç)

## Elevated: yalnızca exec için "ana bilgisayarda çalıştır"

Elevated ekstra araç vermez; yalnızca `exec` üzerinde etkilidir.

- Sandbox içindeyseniz `/elevated on` (veya `elevated: true` ile `exec`) sandbox dışında çalıştırır (onaylar yine de uygulanabilir).
- Oturum için exec onaylarını atlamak üzere `/elevated full` kullanın.
- Zaten doğrudan çalışıyorsanız elevated fiilen etkisizdir (yine de geçitlenir).
- Elevated **skill kapsamlı değildir** ve araç izin/verme ilkelerini **geçersiz kılmaz**.
- Elevated, `host=auto` üzerinden keyfi ana bilgisayarlar arası geçersiz kılmalar vermez; normal exec hedef kurallarını izler ve yalnızca yapılandırılmış/oturum hedefi zaten `node` ise `node` değerini korur.
- `/exec`, elevated'dan ayrıdır. Yalnızca yetkili gönderenler için oturum başına exec varsayılanlarını ayarlar.

Geçitler:

- Etkinleştirme: `tools.elevated.enabled` (ve isteğe bağlı olarak `agents.list[].tools.elevated.enabled`)
- Gönderen izin listeleri: `tools.elevated.allowFrom.<provider>` (ve isteğe bağlı olarak `agents.list[].tools.elevated.allowFrom.<provider>`)

Bkz. [Elevated Mode](/tr/tools/elevated).

## Yaygın "sandbox hapsi" düzeltmeleri

### "Araç X, sandbox araç ilkesi tarafından engellendi"

Düzeltme anahtarları (birini seçin):

- Sandbox'ı devre dışı bırakın: `agents.defaults.sandbox.mode=off` (veya ajan başına `agents.list[].sandbox.mode=off`)
- Araca sandbox içinde izin verin:
  - `tools.sandbox.tools.deny` içinden çıkarın (veya ajan başına `agents.list[].tools.sandbox.tools.deny`)
  - ya da `tools.sandbox.tools.allow` içine ekleyin (veya ajan başına allow)

### "Bunun main olduğunu sanıyordum, neden sandbox içinde?"

`"non-main"` modunda grup/kanal anahtarları _main_ değildir. Ana oturum anahtarını kullanın (`sandbox explain` bunu gösterir) veya modu `"off"` yapın.

## İlgili

- [Sandboxing](/tr/gateway/sandboxing) -- tam sandbox başvurusu (kipler, kapsamlar, arka uçlar, görseller)
- [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools) -- ajan başına geçersiz kılmalar ve öncelik
- [Elevated Mode](/tr/tools/elevated)
