---
read_when:
    - Birden çok yalıtılmış aracı (çalışma alanları + yönlendirme + kimlik doğrulama) istiyorsunuz
summary: '`openclaw agents` için CLI başvurusu (listele/ekle/sil/binding''ler/bind/unbind/kimlik ayarla)'
title: Aracılar
x-i18n:
    generated_at: "2026-04-24T09:01:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d0ce4f3fb3d0c0ba8ffb3676674cda7d9a60441a012bc94ff24a17105632f1
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Yalıtılmış aracıları yönetin (çalışma alanları + kimlik doğrulama + yönlendirme).

İlgili:

- Çoklu aracı yönlendirme: [Multi-Agent Routing](/tr/concepts/multi-agent)
- Aracı çalışma alanı: [Agent workspace](/tr/concepts/agent-workspace)
- Skill görünürlüğü yapılandırması: [Skills config](/tr/tools/skills-config)

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

## Yönlendirme binding'leri

Gelen kanal trafiğini belirli bir aracıya sabitlemek için yönlendirme binding'lerini kullanın.

Aracı başına farklı görünür Skills da istiyorsanız,
`openclaw.json` içinde `agents.defaults.skills` ve `agents.list[].skills`
yapılandırmasını yapın. Bkz.
[Skills config](/tr/tools/skills-config) ve
[Configuration Reference](/tr/gateway/config-agents#agents-defaults-skills).

Binding'leri listeleme:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Binding ekleme:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

`accountId` değerini atarsanız (`--bind <channel>`), OpenClaw bunu mevcut olduğunda kanal varsayılanlarından ve Plugin kurulum kancalarından çözümler.

`bind` veya `unbind` için `--agent` belirtmezseniz, OpenClaw geçerli varsayılan aracıyı hedefler.

### Binding kapsamı davranışı

- `accountId` olmadan bir binding yalnızca kanal varsayılan hesabıyla eşleşir.
- `accountId: "*"` kanal genelindeki fallback'tir (tüm hesaplar) ve açık bir hesap binding'inden daha az özeldir.
- Aynı aracı zaten `accountId` olmadan eşleşen bir kanal binding'ine sahipse ve daha sonra açık veya çözümlenmiş bir `accountId` ile binding yaparsanız, OpenClaw yinelenen bir binding eklemek yerine mevcut binding'i yerinde yükseltir.

Örnek:

```bash
# ilk yalnızca kanal binding'i
openclaw agents bind --agent work --bind telegram

# daha sonra hesap kapsamlı binding'e yükselt
openclaw agents bind --agent work --bind telegram:ops
```

Yükseltmeden sonra bu binding için yönlendirme `telegram:ops` kapsamına alınır. Varsayılan hesap yönlendirmesini de istiyorsanız, bunu açıkça ekleyin (örneğin `--bind telegram:default`).

Binding kaldırma:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind`, ya `--all` ya da bir veya daha fazla `--bind` değeri kabul eder; ikisini birlikte değil.

## Komut yüzeyi

### `agents`

Alt komut olmadan `openclaw agents` çalıştırmak, `openclaw agents list` ile eşdeğerdir.

### `agents list`

Seçenekler:

- `--json`
- `--bindings`: yalnızca aracı başına sayılar/özetler değil, tam yönlendirme kurallarını dahil eder

### `agents add [name]`

Seçenekler:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--non-interactive`
- `--json`

Notlar:

- Herhangi bir açık `add` bayrağı geçirmek komutu etkileşimsiz yola geçirir.
- Etkileşimsiz mod hem bir aracı adı hem de `--workspace` gerektirir.
- `main` ayrılmıştır ve yeni aracı kimliği olarak kullanılamaz.

### `agents bindings`

Seçenekler:

- `--agent <id>`
- `--json`

### `agents bind`

Seçenekler:

- `--agent <id>` (varsayılan olarak geçerli varsayılan aracı)
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--json`

### `agents unbind`

Seçenekler:

- `--agent <id>` (varsayılan olarak geçerli varsayılan aracı)
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
- Çalışma alanı, aracı durumu ve oturum transcript dizinleri kalıcı olarak silinmez, Çöp Kutusu'na taşınır.

## Kimlik dosyaları

Her aracı çalışma alanı, çalışma alanı kökünde bir `IDENTITY.md` içerebilir:

- Örnek yol: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`, çalışma alanı kökünden (veya açık bir `--identity-file` ile) okur

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

- Hedef aracıyı seçmek için `--agent` veya `--workspace` kullanılabilir.
- `--workspace` kullanıyorsanız ve birden çok aracı aynı çalışma alanını paylaşıyorsa, komut başarısız olur ve sizden `--agent` geçirmenizi ister.
- Açık kimlik alanları sağlanmadığında komut kimlik verilerini `IDENTITY.md` dosyasından okur.

`IDENTITY.md` dosyasından yükleme:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Alanları açıkça geçersiz kılma:

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
          theme: "uzay ıstakozu",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## İlgili

- [CLI reference](/tr/cli)
- [Multi-agent routing](/tr/concepts/multi-agent)
- [Agent workspace](/tr/concepts/agent-workspace)
