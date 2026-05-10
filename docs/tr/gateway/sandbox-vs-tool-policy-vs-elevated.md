---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Bir aracın neden engellendiği: sandbox çalışma zamanı, araç izin verme/reddetme politikası ve yükseltilmiş yürütme kapıları'
title: Korumalı alan, araç politikası ve yükseltilmiş yetki
x-i18n:
    generated_at: "2026-05-10T19:38:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw üç ilişkili (ama farklı) denetime sahiptir:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) **araçların nerede çalışacağını** belirler (sandbox arka ucu veya host).
2. **Araç politikası** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) **hangi araçların kullanılabilir/izinli olduğunu** belirler.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`), sandbox içindeyken sandbox dışında çalışmak için **yalnızca exec'e özel bir kaçış yoludur** (varsayılan olarak `gateway`, ya da exec hedefi `node` olarak yapılandırıldığında `node`).

## Hızlı hata ayıklama

OpenClaw'ın _gerçekte_ ne yaptığını görmek için inspector'ı kullanın:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Şunları yazdırır:

- etkin sandbox modu/kapsamı/çalışma alanı erişimi
- oturumun şu anda sandbox içinde olup olmadığı (main ve non-main)
- etkin sandbox araç izin verme/reddetme ayarları (ve bunların agent/global/default kaynağından gelip gelmediği)
- elevated geçitleri ve düzeltme anahtar yolları

## Sandbox: araçların nerede çalıştığı

Sandbox kullanımı `agents.defaults.sandbox.mode` ile denetlenir:

- `"off"`: her şey host üzerinde çalışır.
- `"non-main"`: yalnızca non-main oturumlar sandbox içine alınır (gruplar/kanallar için yaygın bir "sürpriz").
- `"all"`: her şey sandbox içine alınır.

Tam matris (kapsam, çalışma alanı bağlamaları, imajlar) için [Sandboxing](/tr/gateway/sandboxing) bölümüne bakın.

### Bind mount'lar (hızlı güvenlik kontrolü)

- `docker.binds` sandbox dosya sistemini _deler_: bağladığınız her şey, belirlediğiniz modla (`:ro` veya `:rw`) konteyner içinde görünür.
- Modu atlarsanız varsayılan okuma-yazmadır; kaynak/secrets için `:ro` tercih edin.
- `scope: "shared"` agent başına bind'ları yok sayar (yalnızca global bind'lar uygulanır).
- OpenClaw bind kaynaklarını iki kez doğrular: önce normalize edilmiş kaynak yolunda, sonra en derin mevcut üst dizin üzerinden çözümledikten sonra tekrar. Symlink üst dizin kaçışları, engellenen yol veya izin verilen kök kontrollerini atlatmaz.
- Var olmayan yaprak yollar yine de güvenli biçimde kontrol edilir. `/workspace/alias-out/new-file`, symlink'li bir üst dizin üzerinden engellenen bir yola ya da yapılandırılmış izinli köklerin dışına çözülürse bind reddedilir.
- `/var/run/docker.sock` bağlamak, sandbox'a fiilen host denetimi verir; bunu yalnızca bilinçli olarak yapın.
- Çalışma alanı erişimi (`workspaceAccess: "ro"`/`"rw"`) bind modlarından bağımsızdır.

## Araç politikası: hangi araçların var/çağrılabilir olduğu

İki katman önemlidir:

- **Araç profili**: `tools.profile` ve `agents.list[].tools.profile` (temel izin listesi)
- **Sağlayıcı araç profili**: `tools.byProvider[provider].profile` ve `agents.list[].tools.byProvider[provider].profile`
- **Global/agent başına araç politikası**: `tools.allow`/`tools.deny` ve `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Sağlayıcı araç politikası**: `tools.byProvider[provider].allow/deny` ve `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox araç politikası** (yalnızca sandbox içindeyken uygulanır): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` ve `agents.list[].tools.sandbox.tools.*`

Pratik kurallar:

- `deny` her zaman kazanır.
- `allow` boş değilse, geri kalan her şey engellenmiş kabul edilir.
- Araç politikası kesin durdurma noktasıdır: `/exec`, reddedilmiş bir `exec` aracını geçersiz kılamaz.
- Araç politikası araç kullanılabilirliğini ada göre filtreler; `exec` içindeki yan etkileri incelemez. `exec` izinliyse, `write`, `edit` veya `apply_patch` reddedilse bile shell komutları salt okunur hale gelmez.
- `/exec` yalnızca yetkili göndericiler için oturum varsayılanlarını değiştirir; araç erişimi vermez.
  Sağlayıcı araç anahtarları `provider` (örn. `google-antigravity`) veya `provider/model` (örn. `openai/gpt-5.4`) kabul eder.

### Araç grupları (kısaltmalar)

Araç politikaları (global, agent, sandbox), birden çok araca genişleyen `group:*` girdilerini destekler:

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
  takma ad olarak kabul edilir)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  Salt okunur agent'lar için, sandbox dosya sistemi politikası veya ayrı bir host sınırı salt okunurluk kısıtını zorunlu kılmıyorsa değiştiren dosya sistemi araçlarının yanı sıra `group:runtime` öğesini de reddedin.
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

## Elevated: yalnızca exec için "host üzerinde çalıştır"

Elevated ek araçlar vermez; yalnızca `exec` aracını etkiler.

- Sandbox içindeyseniz, `/elevated on` (veya `elevated: true` ile `exec`) sandbox dışında çalışır (onaylar yine de uygulanabilir).
- Oturum için exec onaylarını atlamak üzere `/elevated full` kullanın.
- Zaten doğrudan çalışıyorsanız, elevated fiilen etkisizdir (yine de geçitlerden geçer).
- Elevated **skill kapsamlı değildir** ve araç allow/deny ayarlarını **geçersiz kılmaz**.
- Elevated, `host=auto` üzerinden keyfi cross-host geçersiz kılmaları vermez; normal exec hedef kurallarını izler ve yalnızca yapılandırılmış/oturum hedefi zaten `node` olduğunda `node` değerini korur.
- `/exec`, elevated'dan ayrıdır. Yalnızca yetkili göndericiler için oturum başına exec varsayılanlarını ayarlar.

Geçitler:

- Etkinleştirme: `tools.elevated.enabled` (ve isteğe bağlı olarak `agents.list[].tools.elevated.enabled`)
- Gönderici izin listeleri: `tools.elevated.allowFrom.<provider>` (ve isteğe bağlı olarak `agents.list[].tools.elevated.allowFrom.<provider>`)

Bkz. [Elevated Mode](/tr/tools/elevated).

## Yaygın "sandbox jail" düzeltmeleri

### "Tool X blocked by sandbox tool policy"

Düzeltme anahtarları (birini seçin):

- Sandbox'ı devre dışı bırakın: `agents.defaults.sandbox.mode=off` (veya agent başına `agents.list[].sandbox.mode=off`)
- Araca sandbox içinde izin verin:
  - `tools.sandbox.tools.deny` içinden kaldırın (veya agent başına `agents.list[].tools.sandbox.tools.deny`)
  - ya da `tools.sandbox.tools.allow` içine ekleyin (veya agent başına allow)

### "I thought this was main, why is it sandboxed?"

`"non-main"` modunda, grup/kanal anahtarları _main_ değildir. Main oturum anahtarını kullanın (`sandbox explain` tarafından gösterilir) veya modu `"off"` olarak değiştirin.

## İlgili

- [Sandboxing](/tr/gateway/sandboxing) -- tam sandbox başvurusu (modlar, kapsamlar, arka uçlar, imajlar)
- [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools) -- agent başına geçersiz kılmalar ve öncelik
- [Elevated Mode](/tr/tools/elevated)
