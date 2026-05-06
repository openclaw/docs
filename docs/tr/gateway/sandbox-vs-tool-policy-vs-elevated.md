---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Bir aracın neden engellendiği: sandbox çalışma zamanı, araç izin verme/reddetme politikası ve yükseltilmiş exec kapıları'
title: Korumalı alan, araç ilkesi ve yükseltilmiş izinler
x-i18n:
    generated_at: "2026-05-06T09:14:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw'ın ilişkili (ama farklı) üç denetimi vardır:

1. **Korumalı alan** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) **araçların nerede çalışacağını** belirler (korumalı alan arka ucu veya ana makine).
2. **Araç ilkesi** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) **hangi araçların kullanılabilir/izinli olduğunu** belirler.
3. **Yükseltilmiş** (`tools.elevated.*`, `agents.list[].tools.elevated.*`), korumalı alandayken (`gateway` varsayılan olarak ya da exec hedefi `node` olarak yapılandırıldığında `node`) korumalı alan dışında çalıştırmak için **yalnızca exec'e özel bir kaçış kapısıdır**.

## Hızlı hata ayıklama

OpenClaw'ın _gerçekte_ ne yaptığını görmek için inceleyiciyi kullanın:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Şunları yazdırır:

- etkili korumalı alan modu/kapsamı/çalışma alanı erişimi
- oturumun şu anda korumalı alanda olup olmadığı (ana ile ana olmayan)
- etkili korumalı alan araç izin/verme-reddetme ayarı (ve bunun aracıdan/genelden/varsayılandan gelip gelmediği)
- yükseltilmiş kapılar ve düzeltme anahtar yolları

## Korumalı alan: araçların nerede çalıştığı

Korumalı alan kullanımı `agents.defaults.sandbox.mode` ile denetlenir:

- `"off"`: her şey ana makinede çalışır.
- `"non-main"`: yalnızca ana olmayan oturumlar korumalı alana alınır (gruplar/kanallar için yaygın "sürpriz").
- `"all"`: her şey korumalı alana alınır.

Tam matris (kapsam, çalışma alanı bağlamaları, görüntüler) için [Korumalı Alan Kullanımı](/tr/gateway/sandboxing) sayfasına bakın.

### Bağlama noktaları (güvenlik hızlı kontrolü)

- `docker.binds`, korumalı alan dosya sistemini _deler_: bağladığınız her şey, ayarladığınız modla (`:ro` veya `:rw`) konteyner içinde görünür.
- Modu atlarsanız varsayılan okuma-yazmadır; kaynak/gizli bilgiler için `:ro` tercih edin.
- `scope: "shared"` aracı başına bağlamaları yok sayar (yalnızca genel bağlamalar uygulanır).
- OpenClaw bağlama kaynaklarını iki kez doğrular: önce normalleştirilmiş kaynak yolunda, sonra en derindeki mevcut üst öğe üzerinden çözdükten sonra tekrar. Sembolik bağlantılı üst öğe kaçışları engellenmiş yol veya izinli kök denetimlerini atlatamaz.
- Var olmayan yaprak yollar yine de güvenli şekilde denetlenir. `/workspace/alias-out/new-file`, sembolik bağlantılı bir üst öğe üzerinden engellenmiş bir yola veya yapılandırılmış izinli köklerin dışına çözümlenirse bağlama reddedilir.
- `/var/run/docker.sock` bağlamak, ana makine denetimini etkili olarak korumalı alana verir; bunu yalnızca bilinçli şekilde yapın.
- Çalışma alanı erişimi (`workspaceAccess: "ro"`/`"rw"`) bağlama modlarından bağımsızdır.

## Araç ilkesi: hangi araçların var olduğu/çağrılabildiği

İki katman önemlidir:

- **Araç profili**: `tools.profile` ve `agents.list[].tools.profile` (temel izin listesi)
- **Sağlayıcı araç profili**: `tools.byProvider[provider].profile` ve `agents.list[].tools.byProvider[provider].profile`
- **Genel/aracı başına araç ilkesi**: `tools.allow`/`tools.deny` ve `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Sağlayıcı araç ilkesi**: `tools.byProvider[provider].allow/deny` ve `agents.list[].tools.byProvider[provider].allow/deny`
- **Korumalı alan araç ilkesi** (yalnızca korumalı alandayken uygulanır): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` ve `agents.list[].tools.sandbox.tools.*`

Pratik kurallar:

- `deny` her zaman kazanır.
- `allow` boş değilse diğer her şey engellenmiş kabul edilir.
- Araç ilkesi kesin durdurma noktasıdır: `/exec`, reddedilmiş bir `exec` aracını geçersiz kılamaz.
- `/exec` yalnızca yetkili gönderenler için oturum varsayılanlarını değiştirir; araç erişimi vermez.
  Sağlayıcı araç anahtarları `provider` (ör. `google-antigravity`) veya `provider/model` (ör. `openai/gpt-5.4`) kabul eder.

### Araç grupları (kısaltmalar)

Araç ilkeleri (genel, aracı, korumalı alan), birden çok araca genişleyen `group:*` girdilerini destekler:

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
  diğer ad olarak kabul edilir)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: tüm yerleşik OpenClaw araçları (sağlayıcı Plugin'leri hariç tutar)

## Yükseltilmiş: yalnızca exec için "ana makinede çalıştır"

Yükseltilmiş mod ek araç vermez; yalnızca `exec` öğesini etkiler.

- Korumalı alandaysanız `/elevated on` (veya `elevated: true` ile `exec`) korumalı alan dışında çalışır (onaylar yine de geçerli olabilir).
- Oturum için exec onaylarını atlamak üzere `/elevated full` kullanın.
- Zaten doğrudan çalışıyorsanız yükseltilmiş mod etkili olarak işlem yapmaz (yine de kapıya tabidir).
- Yükseltilmiş mod **Skills kapsamlı değildir** ve araç izin/verme-reddetme ayarını **geçersiz kılmaz**.
- Yükseltilmiş mod, `host=auto` üzerinden rastgele çapraz ana makine geçersiz kılmaları vermez; normal exec hedef kurallarını izler ve yalnızca yapılandırılmış/oturum hedefi zaten `node` olduğunda `node` değerini korur.
- `/exec`, yükseltilmiş moddan ayrıdır. Yalnızca yetkili gönderenler için oturum başına exec varsayılanlarını ayarlar.

Kapılar:

- Etkinleştirme: `tools.elevated.enabled` (ve isteğe bağlı olarak `agents.list[].tools.elevated.enabled`)
- Gönderen izin listeleri: `tools.elevated.allowFrom.<provider>` (ve isteğe bağlı olarak `agents.list[].tools.elevated.allowFrom.<provider>`)

[Yükseltilmiş Mod](/tr/tools/elevated) sayfasına bakın.

## Yaygın "korumalı alan hapishanesi" düzeltmeleri

### "Araç X, korumalı alan araç ilkesi tarafından engellendi"

Düzeltme anahtarları (birini seçin):

- Korumalı alanı devre dışı bırakın: `agents.defaults.sandbox.mode=off` (veya aracı başına `agents.list[].sandbox.mode=off`)
- Korumalı alan içinde araca izin verin:
  - `tools.sandbox.tools.deny` içinden kaldırın (veya aracı başına `agents.list[].tools.sandbox.tools.deny`)
  - ya da `tools.sandbox.tools.allow` içine ekleyin (veya aracı başına izin)

### "Bunun ana oturum olduğunu sanıyordum, neden korumalı alanda?"

`"non-main"` modunda grup/kanal anahtarları ana oturum _değildir_. Ana oturum anahtarını kullanın (`sandbox explain` tarafından gösterilir) veya modu `"off"` olarak değiştirin.

## İlgili

- [Korumalı Alan Kullanımı](/tr/gateway/sandboxing) -- tam korumalı alan başvurusu (modlar, kapsamlar, arka uçlar, görüntüler)
- [Çok Aracılı Korumalı Alan ve Araçlar](/tr/tools/multi-agent-sandbox-tools) -- aracı başına geçersiz kılmalar ve öncelik
- [Yükseltilmiş Mod](/tr/tools/elevated)
