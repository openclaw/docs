---
read_when:
    - Birden fazla yalıtılmış ajan istiyorsunuz (çalışma alanları + yönlendirme + kimlik doğrulama)
summary: '`openclaw agents` için CLI referansı (list/add/delete/bindings/bind/unbind/set identity)'
title: Ajanlar
x-i18n:
    generated_at: "2026-05-02T20:41:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3522394dd416a9c8b4bf25767a14073484df0ff3d7c546cf6c730f111c5c51dc
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Yalıtılmış ajanları yönetin (çalışma alanları + kimlik doğrulama + yönlendirme).

İlgili:

- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Skills yapılandırması](/tr/tools/skills-config): skill görünürlüğü yapılandırması.

## Örnekler

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Yönlendirme bağlamaları

Gelen kanal trafiğini belirli bir ajana sabitlemek için yönlendirme bağlamalarını kullanın.

Ayrıca ajan başına farklı görünür skills istiyorsanız, `openclaw.json` içinde `agents.defaults.skills` ve `agents.list[].skills` yapılandırın. [Skills yapılandırması](/tr/tools/skills-config) ve [Yapılandırma başvurusu](/tr/gateway/config-agents#agents-defaults-skills) bölümlerine bakın.

Bağlamaları listeleyin:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Bağlamalar ekleyin:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId` öğesini atlarsanız (`--bind <channel>`), OpenClaw mümkün olduğunda bunu kanal varsayılanlarından ve plugin kurulum kancalarından çözer.

`bind` veya `unbind` için `--agent` öğesini atlarsanız, OpenClaw geçerli varsayılan ajanı hedefler.

### Bağlama kapsamı davranışı

- `accountId` içermeyen bir bağlama yalnızca kanalın varsayılan hesabıyla eşleşir.
- `accountId: "*"` kanal genelinde yedektir (tüm hesaplar) ve açık bir hesap bağlamasından daha az özeldir.
- Aynı ajanın zaten `accountId` olmadan eşleşen bir kanal bağlaması varsa ve daha sonra açık veya çözümlenmiş bir `accountId` ile bağlama yaparsanız, OpenClaw yinelenen eklemek yerine mevcut bağlamayı yerinde yükseltir.

Örnek:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Yükseltmeden sonra, bu bağlama için yönlendirme `telegram:ops` kapsamına alınır. Varsayılan hesap yönlendirmesini de istiyorsanız, bunu açıkça ekleyin (örneğin `--bind telegram:default`).

Bağlamaları kaldırın:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind`, `--all` ya da bir veya daha fazla `--bind` değeri kabul eder; ikisini birlikte kabul etmez.

## Komut yüzeyi

### `agents`

Alt komut olmadan `openclaw agents` çalıştırmak, `openclaw agents list` ile eşdeğerdir.

### `agents list`

Seçenekler:

- `--json`
- `--bindings`: yalnızca ajan başına sayıları/özetleri değil, tam yönlendirme kurallarını dahil et

### `agents add [name]`

Seçenekler:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--non-interactive`
- `--json`

Notlar:

- Herhangi bir açık ekleme bayrağı geçirmek, komutu etkileşimsiz yola geçirir.
- Etkileşimsiz mod hem ajan adı hem de `--workspace` gerektirir.
- `main` ayrılmıştır ve yeni ajan kimliği olarak kullanılamaz.
- Etkileşimli modda kimlik doğrulama tohumlama yalnızca taşınabilir statik profilleri kopyalar
  (varsayılan olarak `api_key` ve statik `token`). OAuth yenileme belirteci profilleri yalnızca gerçek `main` ajan deposundan okuma yoluyla kalıtım üzerinden kullanılabilir kalır.
  Yapılandırılmış varsayılan ajan `main` değilse, yeni ajandaki OAuth profilleri için ayrı oturum açın.

### `agents bindings`

Seçenekler:

- `--agent <id>`
- `--json`

### `agents bind`

Seçenekler:

- `--agent <id>` (varsayılan olarak geçerli varsayılan ajan)
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--json`

### `agents unbind`

Seçenekler:

- `--agent <id>` (varsayılan olarak geçerli varsayılan ajan)
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--all`
- `--json`

### `agents delete <id>`

Seçenekler:

- `--force`
- `--json`

Notlar:

- `main` silinemez.
- `--force` olmadan etkileşimli onay gerekir.
- Çalışma alanı, ajan durumu ve oturum dökümü dizinleri kalıcı olarak silinmez; Çöp Kutusu'na taşınır.
- Gateway erişilebilir olduğunda silme işlemi Gateway üzerinden gönderilir; böylece yapılandırma ve oturum deposu temizliği, çalışma zamanı trafiğiyle aynı yazıcıyı paylaşır. Gateway'e ulaşılamazsa CLI çevrimdışı yerel yola geri döner.
- Başka bir ajanın çalışma alanı aynı yolsa, bu çalışma alanının içindeyse veya bu çalışma alanını içeriyorsa,
  çalışma alanı korunur ve `--json` `workspaceRetained`,
  `workspaceRetainedReason` ve `workspaceSharedWith` bildirir.

## Kimlik dosyaları

Her ajan çalışma alanı, çalışma alanı kökünde bir `IDENTITY.md` içerebilir:

- Örnek yol: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`, çalışma alanı kökünden (veya açık bir `--identity-file` değerinden) okur

Avatar yolları çalışma alanı köküne göre çözümlenir.

## Kimlik ayarla

`set-identity`, alanları `agents.list[].identity` içine yazar:

- `name`
- `theme`
- `emoji`
- `avatar` (çalışma alanına göreli yol, http(s) URL'si veya veri URI'si)

Seçenekler:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Notlar:

- Hedef ajanı seçmek için `--agent` veya `--workspace` kullanılabilir.
- `--workspace` kullanıyorsanız ve birden fazla ajan bu çalışma alanını paylaşıyorsa, komut başarısız olur ve `--agent` geçirmenizi ister.
- Açık kimlik alanları sağlanmadığında komut kimlik verilerini `IDENTITY.md` dosyasından okur.

`IDENTITY.md` dosyasından yükleyin:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Alanları açıkça geçersiz kılın:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Yapılandırma örneği:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## İlgili

- [CLI başvurusu](/tr/cli)
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
