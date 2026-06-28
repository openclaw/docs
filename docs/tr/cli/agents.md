---
read_when:
    - Birden fazla yalıtılmış ajan istiyorsunuz (çalışma alanları + yönlendirme + kimlik doğrulama)
summary: '`openclaw agents` için CLI başvurusu (listele/ekle/sil/bağlamalar/bağla/bağı kaldır/kimliği ayarla)'
title: Ajanlar
x-i18n:
    generated_at: "2026-06-28T00:20:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Yalıtılmış aracıları yönetin (çalışma alanları + kimlik doğrulama + yönlendirme).

İlgili:

- [Çok aracılı yönlendirme](/tr/concepts/multi-agent)
- [Aracı çalışma alanı](/tr/concepts/agent-workspace)
- [Skills yapılandırması](/tr/tools/skills-config): skill görünürlüğü yapılandırması.

## Örnekler

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Yönlendirme bağları

Gelen kanal trafiğini belirli bir aracıya sabitlemek için yönlendirme bağlarını kullanın.

Aracı başına farklı görünür Skills de istiyorsanız, `openclaw.json` içinde `agents.defaults.skills` ve `agents.list[].skills` yapılandırın. Bkz. [Skills yapılandırması](/tr/tools/skills-config) ve [Yapılandırma başvurusu](/tr/gateway/config-agents#agents-defaults-skills).

Bağları listeleyin:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Bağ ekleyin:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Aracı oluştururken de bağ ekleyebilirsiniz:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

`accountId` değerini atlarsanız (`--bind <channel>`), OpenClaw bunu plugin kurulum hook'larından, zorunlu hesap bağından veya kanalın yapılandırılmış hesap sayısından çözer.

`bind` veya `unbind` için `--agent` değerini atlarsanız, OpenClaw geçerli varsayılan aracıyı hedefler.

### `--bind` biçimi

| Biçim                       | Anlam                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Kanaldaki tüm hesapları eşleştirir.                                                                |
| `--bind <channel>:<account>` | Tek bir hesabı eşleştirir.                                                                                |
| `--bind <channel>`           | CLI plugin'e özgü bir hesap kapsamını güvenle çözemezse yalnızca varsayılan hesabı eşleştirir. |

### Bağ kapsamı davranışı

- `accountId` olmadan saklanan bir bağ yalnızca kanalın varsayılan hesabıyla eşleşir.
- `accountId: "*"` kanal genelinde geri dönüş değeridir (tüm hesaplar) ve açık bir hesap bağından daha az özeldir.
- Aynı aracının zaten `accountId` olmadan eşleşen bir kanal bağı varsa ve daha sonra açık veya çözülmüş bir `accountId` ile bağlarsanız, OpenClaw yinelenen bir bağ eklemek yerine mevcut bağı yerinde yükseltir.

Örnekler:

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

Yükseltmeden sonra, bu bağ için yönlendirme `telegram:alerts` kapsamına alınır. Varsayılan hesap yönlendirmesini de istiyorsanız, bunu açıkça ekleyin (örneğin `--bind telegram:default`).

Bağları kaldırın:

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
- `--bindings`: yalnızca aracı başına sayımları/özetleri değil, tam yönlendirme kurallarını dahil et

### `agents add [name]`

Seçenekler:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--non-interactive`
- `--json`

Notlar:

- Açık herhangi bir ekleme bayrağı geçirmek, komutu etkileşimsiz yola geçirir.
- Etkileşimsiz mod hem bir aracı adı hem de `--workspace` gerektirir.
- `main` ayrılmıştır ve yeni aracı kimliği olarak kullanılamaz.
- Etkileşimli modda kimlik doğrulama tohumlama yalnızca taşınabilir statik profilleri
  (varsayılan olarak `api_key` ve statik `token`) kopyalar. OAuth yenileme belirteci profilleri
  yalnızca gerçek `main` aracı deposundan okuma yoluyla devralma ile kullanılabilir kalır.
  Yapılandırılmış varsayılan aracı `main` değilse, yeni aracıdaki OAuth
  profilleri için ayrıca oturum açın.

### `agents bindings`

Seçenekler:

- `--agent <id>`
- `--json`

### `agents bind`

Seçenekler:

- `--agent <id>` (geçerli varsayılan aracıya varsayılanlanır)
- `--bind <channel[:accountId]>` (tekrarlanabilir)
- `--json`

### `agents unbind`

Seçenekler:

- `--agent <id>` (geçerli varsayılan aracıya varsayılanlanır)
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
- Çalışma alanı, aracı durumu ve oturum dökümü dizinleri kalıcı olarak silinmez; Çöp Kutusu'na taşınır.
- Gateway erişilebilir olduğunda, silme işlemi Gateway üzerinden gönderilir; böylece yapılandırma ve oturum deposu temizliği çalışma zamanı trafiğiyle aynı yazıcıyı paylaşır. Gateway'e ulaşılamazsa CLI çevrimdışı yerel yola geri döner.
- Başka bir aracının çalışma alanı aynı yolsa, bu çalışma alanının içindeyse veya bu çalışma alanını içeriyorsa,
  çalışma alanı korunur ve `--json` `workspaceRetained`,
  `workspaceRetainedReason` ve `workspaceSharedWith` bildirir.

## Kimlik dosyaları

Her aracı çalışma alanı, çalışma alanı kökünde bir `IDENTITY.md` içerebilir:

- Örnek yol: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`, çalışma alanı kökünden (veya açık bir `--identity-file` değerinden) okur

Avatar yolları çalışma alanı köküne göre çözülür.

## Kimliği ayarla

`set-identity`, alanları `agents.list[].identity` içine yazar:

- `name`
- `theme`
- `emoji`
- `avatar` (çalışma alanına göre yol, http(s) URL'si veya veri URI'si)

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
- `--workspace` kullanıyorsanız ve birden fazla aracı bu çalışma alanını paylaşıyorsa, komut başarısız olur ve `--agent` geçirmenizi ister.
- Yerel çalışma alanına göre avatar görüntü dosyaları 2 MB ile sınırlıdır. HTTP(S) URL'leri ve `data:` URI'leri yerel dosya boyutu sınırıyla denetlenmez.
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
- [Çok aracılı yönlendirme](/tr/concepts/multi-agent)
- [Aracı çalışma alanı](/tr/concepts/agent-workspace)
