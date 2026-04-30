---
read_when:
    - Birden fazla yalıtılmış aracı istiyorsunuz (çalışma alanları + yönlendirme + kimlik doğrulama)
summary: '`openclaw agents` için CLI referansı (list/add/delete/bindings/bind/unbind/set identity)'
title: Ajanlar
x-i18n:
    generated_at: "2026-04-30T09:10:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46742a890a57cb1035a053f14fe574044e4a3d7dcc04812cd11c633bd808819b
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Yalıtılmış ajanları (çalışma alanları + kimlik doğrulama + yönlendirme) yönetin.

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

Ajan başına farklı görünür skills de istiyorsanız, `openclaw.json` içinde `agents.defaults.skills` ve `agents.list[].skills` değerlerini yapılandırın. [Skills yapılandırması](/tr/tools/skills-config) ve [Yapılandırma başvurusu](/tr/gateway/config-agents#agents-defaults-skills) bölümlerine bakın.

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

`accountId` değerini atlarsanız (`--bind <channel>`), OpenClaw kullanılabilir olduğunda bunu kanal varsayılanlarından ve plugin kurulum kancalarından çözer.

`bind` veya `unbind` için `--agent` değerini atlarsanız, OpenClaw geçerli varsayılan ajanı hedefler.

### Bağlama kapsamı davranışı

- `accountId` içermeyen bir bağlama yalnızca kanal varsayılan hesabıyla eşleşir.
- `accountId: "*"` kanal genelindeki yedektir (tüm hesaplar) ve açık bir hesap bağlamasından daha az özeldir.
- Aynı ajanın zaten `accountId` olmadan eşleşen bir kanal bağlaması varsa ve daha sonra açık veya çözümlenmiş bir `accountId` ile bağlama yaparsanız, OpenClaw yinelenen bir bağlama eklemek yerine mevcut bağlamayı yerinde yükseltir.

Örnek:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Yükseltmeden sonra bu bağlamanın yönlendirmesi `telegram:ops` kapsamına alınır. Varsayılan hesap yönlendirmesi de istiyorsanız, bunu açıkça ekleyin (örneğin `--bind telegram:default`).

Bağlamaları kaldırın:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind`, `--all` veya bir ya da daha fazla `--bind` değeri kabul eder; ikisi birden kullanılamaz.

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
- Etkileşimsiz mod hem bir ajan adı hem de `--workspace` gerektirir.
- `main` ayrılmıştır ve yeni ajan kimliği olarak kullanılamaz.
- Etkileşimli modda, kimlik doğrulama tohumlaması yalnızca taşınabilir statik profilleri
  (varsayılan olarak `api_key` ve statik `token`) kopyalar. OAuth yenileme belirteci profilleri
  yalnızca gerçek `main` ajan deposundan okuma yoluyla kalıtım ile kullanılabilir kalır.
  Yapılandırılan varsayılan ajan `main` değilse, yeni ajandaki OAuth
  profilleri için ayrıca oturum açın.

### `agents bindings`

Seçenekler:

- `--agent <id>`
- `--json`

### `agents bind`

Seçenekler:

- `--agent <id>` (varsayılan olarak geçerli varsayılan ajan kullanılır)
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--json`

### `agents unbind`

Seçenekler:

- `--agent <id>` (varsayılan olarak geçerli varsayılan ajan kullanılır)
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
- Çalışma alanı, ajan durumu ve oturum dökümü dizinleri kalıcı olarak silinmez, Çöp Kutusu'na taşınır.
- Başka bir ajanın çalışma alanı aynı yolsa, bu çalışma alanının içindeyse veya bu çalışma alanını içeriyorsa,
  çalışma alanı korunur ve `--json`, `workspaceRetained`,
  `workspaceRetainedReason` ve `workspaceSharedWith` bildirir.

## Kimlik dosyaları

Her ajan çalışma alanı, çalışma alanı kökünde bir `IDENTITY.md` içerebilir:

- Örnek yol: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`, çalışma alanı kökünden (veya açık bir `--identity-file` dosyasından) okur

Avatar yolları çalışma alanı köküne göre çözümlenir.

## Kimliği ayarlama

`set-identity`, alanları `agents.list[].identity` içine yazar:

- `name`
- `theme`
- `emoji`
- `avatar` (çalışma alanına göre yol, http(s) URL'si veya data URI)

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
- `--workspace` değerine güveniyorsanız ve birden fazla ajan bu çalışma alanını paylaşıyorsa, komut başarısız olur ve `--agent` geçirmenizi ister.
- Açık kimlik alanları sağlanmadığında, komut kimlik verilerini `IDENTITY.md` dosyasından okur.

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
