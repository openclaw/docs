---
read_when:
    - Birden çok yalıtılmış ajan istediğinizde (çalışma alanları + yönlendirme + kimlik doğrulama)
summary: '`openclaw agents` için CLI başvurusu (list/add/delete/bindings/bind/unbind/set identity)'
title: agents
x-i18n:
    generated_at: "2026-04-05T13:47:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90b90c4915993bd8af322c0590d4cb59baabb8940598ce741315f8f95ef43179
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Yalıtılmış ajanları yönetin (çalışma alanları + kimlik doğrulama + yönlendirme).

İlgili:

- Çoklu ajan yönlendirmesi: [Çoklu Ajan Yönlendirmesi](/concepts/multi-agent)
- Ajan çalışma alanı: [Ajan çalışma alanı](/concepts/agent-workspace)
- Skills görünürlüğü yapılandırması: [Skills yapılandırması](/tools/skills-config)

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

Ajan başına farklı görünür Skills da istiyorsanız,
`openclaw.json` içinde `agents.defaults.skills` ve `agents.list[].skills`
yapılandırın. Bkz.
[Skills yapılandırması](/tools/skills-config) ve
[Yapılandırma Başvurusu](/gateway/configuration-reference#agentsdefaultsskills).

Bağlamaları listeleyin:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Bağlama ekleyin:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId` değerini atarsanız (`--bind <channel>`), OpenClaw bunu kanal varsayılanlarından ve mevcut olduğunda plugin kurulum kancalarından çözümler.

`bind` veya `unbind` için `--agent` belirtilmezse OpenClaw geçerli varsayılan ajanı hedefler.

### Bağlama kapsamı davranışı

- `accountId` olmadan bir bağlama yalnızca kanalın varsayılan hesabıyla eşleşir.
- `accountId: "*"` kanal genelindeki yedektir (tüm hesaplar) ve açık hesap bağlamasından daha az özeldir.
- Aynı ajan zaten `accountId` olmadan eşleşen bir kanal bağlamasına sahipse ve daha sonra açık veya çözümlenmiş bir `accountId` ile bağlama yaparsanız OpenClaw yinelenen eklemek yerine mevcut bağlamayı yerinde yükseltir.

Örnek:

```bash
# ilk yalnızca-kanal bağlaması
openclaw agents bind --agent work --bind telegram

# daha sonra hesap kapsamlı bağlamaya yükseltme
openclaw agents bind --agent work --bind telegram:ops
```

Yükseltmeden sonra, bu bağlama için yönlendirme `telegram:ops` kapsamına alınır. Varsayılan hesap yönlendirmesini de istiyorsanız bunu açıkça ekleyin (örneğin `--bind telegram:default`).

Bağlamaları kaldırın:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind`, hem `--all` hem de bir veya daha fazla `--bind` değeri birlikte değil, bunlardan yalnızca birini kabul eder.

## Komut yüzeyi

### `agents`

Alt komut olmadan `openclaw agents` çalıştırmak, `openclaw agents list` ile eşdeğerdir.

### `agents list`

Seçenekler:

- `--json`
- `--bindings`: yalnızca ajan başına sayılar/özetler değil, tam yönlendirme kurallarını içerir

### `agents add [name]`

Seçenekler:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--non-interactive`
- `--json`

Notlar:

- Herhangi bir açık add bayrağı geçirilirse komut etkileşimsiz yola geçer.
- Etkileşimsiz mod hem bir ajan adı hem de `--workspace` gerektirir.
- `main` ayrılmıştır ve yeni ajan kimliği olarak kullanılamaz.

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
- Çalışma alanı, ajan durumu ve oturum transcript dizinleri kalıcı olarak silinmez, Çöp Kutusu'na taşınır.

## Kimlik dosyaları

Her ajan çalışma alanı, çalışma alanı kökünde bir `IDENTITY.md` içerebilir:

- Örnek yol: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`, çalışma alanı kökünden (veya açık bir `--identity-file` değerinden) okur

Avatar yolları çalışma alanı köküne göre çözülür.

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
- `--workspace` kullanıyorsanız ve birden çok ajan aynı çalışma alanını paylaşıyorsa komut başarısız olur ve `--agent` geçirmenizi ister.
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
