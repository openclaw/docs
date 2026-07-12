---
read_when:
    - Birden fazla yalıtılmış agent istiyorsunuz (çalışma alanları + yönlendirme + kimlik doğrulama)
summary: '`openclaw agents` için CLI başvurusu (listeleme/ekleme/silme/bağlantılar/bağlama/bağlantıyı kaldırma/kimlik ayarlama)'
title: Ajanlar
x-i18n:
    generated_at: "2026-07-12T12:07:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Yalıtılmış ajanları (çalışma alanları + kimlik doğrulama + yönlendirme) yönetin. Alt komut olmadan `openclaw agents` çalıştırmak, `openclaw agents list` ile eşdeğerdir.

İlgili:

- [Çoklu ajan yönlendirmesi](/tr/concepts/multi-agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Skills yapılandırması](/tr/tools/skills-config): Skills görünürlüğü yapılandırması.

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

## Komut yüzeyi

### `agents list`

Seçenekler: `--json`, `--bindings` (yalnızca ajan başına sayımları/özetleri değil, tüm yönlendirme kurallarını da dahil eder).

### `agents add [name]`

Seçenekler: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (tekrarlanabilir), `--non-interactive`, `--json`.

- Herhangi bir açık ekleme bayrağının geçirilmesi, komutu etkileşimsiz yola geçirir.
- Etkileşimsiz mod için hem ajan adı hem de `--workspace` gereklidir.
- `main` ayrılmıştır ve yeni ajan kimliği olarak kullanılamaz.
- Etkileşimli mod, bir kimlik bilgisi `copyToAgents: false` ile bunu devre dışı bırakmadığı sürece yalnızca taşınabilir statik kimlik bilgilerini (`api_key` ve statik `token` profilleri) kopyalayarak kimlik doğrulamasını başlangıç durumuna getirir; bir sağlayıcı `copyToAgents: true` ile etkinleştirmediği sürece OAuth yenileme belirteci profilleri kopyalanmaz. Kopyalama yapılmadığında OAuth, yalnızca gerçek `main` ajan deposundan okuma yoluyla devralma üzerinden kullanılabilir kalır. Yapılandırılmış varsayılan ajan `main` değilse yeni ajandaki OAuth profilleri için ayrıca oturum açın.

### `agents bindings`

Seçenekler: `--agent <id>`, `--json`.

### `agents bind`

Seçenekler: `--agent <id>` (varsayılan olarak geçerli varsayılan ajanı kullanır), `--bind <channel[:accountId]>` (tekrarlanabilir), `--json`.

### `agents unbind`

Seçenekler: `--agent <id>` (varsayılan olarak geçerli varsayılan ajanı kullanır), `--bind <channel[:accountId]>` (tekrarlanabilir), `--all`, `--json`. `--all` veya bir ya da daha fazla `--bind` değeri kabul eder; ikisini birlikte kabul etmez.

### `agents set-identity`

Seçenekler: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Aşağıdaki [Kimliği ayarlama](#set-identity) bölümüne bakın.

### `agents delete <id>`

Seçenekler: `--force`, `--json`.

- `main` silinemez.
- `--force` olmadan etkileşimli onay gerekir (TTY olmayan bir oturumda başarısız olur; `--force` ile yeniden çalıştırın).
- Çalışma alanı, ajan durumu ve oturum dökümü dizinleri kalıcı olarak silinmek yerine Çöp Kutusu'na taşınır.
- Gateway erişilebilir olduğunda silme işlemi Gateway üzerinden yönlendirilir; böylece yapılandırma ve oturum deposu temizliği, çalışma zamanı trafiğiyle aynı yazıcıyı paylaşır. Gateway erişilemezse CLI, çevrimdışı yerel yolu kullanır.
- Başka bir ajanın çalışma alanı aynı yolsa, bu çalışma alanının içindeyse veya bu çalışma alanını içeriyorsa çalışma alanı korunur ve `--json`; `workspaceRetained`, `workspaceRetainedReason` ve `workspaceSharedWith` alanlarını bildirir.

## Yönlendirme bağlamaları

Gelen kanal trafiğini belirli bir ajana sabitlemek için yönlendirme bağlamalarını kullanın.

Ayrıca ajan başına farklı görünür Skills istiyorsanız `openclaw.json` içinde `agents.defaults.skills` ve `agents.list[].skills` alanlarını yapılandırın. [Skills yapılandırması](/tr/tools/skills-config) ve [Yapılandırma başvurusu](/tr/gateway/config-agents#agentsdefaultsskills) bölümlerine bakın.

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

Bir ajan oluştururken de bağlamalar ekleyebilirsiniz:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

`accountId` değerini (`--bind <channel>`) belirtmezseniz OpenClaw bunu Plugin kurulum kancalarından, zorunlu hesap bağlamasından veya kanalın yapılandırılmış hesap sayısından çözümler.

`bind` veya `unbind` için `--agent` seçeneğini belirtmezseniz OpenClaw geçerli varsayılan ajanı hedefler.

### `--bind` biçimi

| Biçim                        | Anlamı                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Kanaldaki tüm hesaplarla eşleşir.                                                                                     |
| `--bind <channel>:<account>` | Tek bir hesapla eşleşir.                                                                                              |
| `--bind <channel>`           | CLI, Plugin'e özgü hesap kapsamını güvenle çözümleyemediği sürece yalnızca varsayılan hesapla eşleşir.                 |

### Bağlama kapsamı davranışı

- `accountId` içermeyen kayıtlı bir bağlama yalnızca kanalın varsayılan hesabıyla eşleşir.
- `accountId: "*"` kanal genelindeki geri dönüş seçeneğidir (tüm hesaplar) ve açık bir hesap bağlamasından daha az özeldir.
- Aynı ajanda `accountId` içermeyen eşleşen bir kanal bağlaması zaten varsa ve daha sonra açıkça belirtilmiş veya çözümlenmiş bir `accountId` ile bağlama yaparsanız OpenClaw yinelenen bir bağlama eklemek yerine mevcut bağlamayı yerinde yükseltir.

Örnekler:

```bash
# kanaldaki tüm hesaplarla eşleş
openclaw agents bind --agent work --bind telegram:*

# belirli bir hesapla eşleş
openclaw agents bind --agent work --bind telegram:ops

# başlangıçtaki yalnızca kanal bağlaması
openclaw agents bind --agent work --bind telegram

# daha sonra hesap kapsamlı bağlamaya yükselt
openclaw agents bind --agent work --bind telegram:alerts
```

Yükseltmeden sonra bu bağlamanın yönlendirmesi `telegram:alerts` kapsamındadır. Varsayılan hesap yönlendirmesini de istiyorsanız bunu açıkça ekleyin (örneğin `--bind telegram:default`).

Bağlamaları kaldırın:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Kimlik dosyaları

Her ajan çalışma alanı, çalışma alanı kökünde bir `IDENTITY.md` içerebilir:

- Örnek yol: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity`, çalışma alanı kökünden (veya açıkça belirtilen bir `--identity-file` dosyasından) okur.

Avatar yolları çalışma alanı köküne göre çözümlenir ve sembolik bağlantı üzerinden bile bu kökün dışına çıkamaz.

## Kimliği ayarlama

`set-identity`, alanları `agents.list[].identity` içine yazar: `name`, `theme`, `emoji`, `avatar` (çalışma alanına göreli yol, http(s) URL'si veya veri URI'si).

- `--agent` veya `--workspace`, hedef ajanı seçer. `--workspace` birden fazla ajanla eşleşirse komut başarısız olur ve `--agent` seçeneğini geçirmenizi ister.
- Yerel, çalışma alanına göreli avatar görüntü dosyaları 2 MB ile sınırlıdır. HTTP(S) URL'leri ve `data:` URI'leri yerel dosya boyutu sınırına göre denetlenmez.
- Açık kimlik alanları sağlanmadığında komut, kimlik verilerini `IDENTITY.md` dosyasından okur.

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
- [Çoklu ajan yönlendirmesi](/tr/concepts/multi-agent)
- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
