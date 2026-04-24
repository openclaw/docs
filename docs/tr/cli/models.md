---
read_when:
    - Varsayılan modelleri değiştirmek veya sağlayıcı kimlik doğrulama durumunu görüntülemek istiyorsunuz
    - Kullanılabilir modelleri/sağlayıcıları taramak ve kimlik doğrulama profillerinde hata ayıklamak istiyorsunuz
summary: '`openclaw models` için CLI başvurusu (status/list/set/scan, takma adlar, geri dönüşler, kimlik doğrulama)'
title: Modeller
x-i18n:
    generated_at: "2026-04-24T09:02:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 08e04342ef240bf7a1f60c4d4e2667d17c9a97e985c1b170db8538c890dc8119
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Model keşfi, tarama ve yapılandırma (varsayılan model, geri dönüşler, kimlik doğrulama profilleri).

İlgili:

- Sağlayıcılar + modeller: [Modeller](/tr/providers/models)
- Model seçimi kavramları + `/models` slash komutu: [Modeller kavramı](/tr/concepts/models)
- Sağlayıcı kimlik doğrulama kurulumu: [Başlangıç](/tr/start/getting-started)

## Yaygın komutlar

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`, çözümlenen varsayılanı/geri dönüşleri ve bir kimlik doğrulama genel görünümünü gösterir.
Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda, OAuth/API anahtarı durumu bölümü
sağlayıcı kullanım pencerelerini ve kota anlık görüntülerini içerir.
Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi ve z.ai. Kullanım kimlik doğrulaması mümkün olduğunda
sağlayıcıya özgü kancalardan gelir; aksi halde OpenClaw, kimlik doğrulama profilleri,
ortam veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.
`--json` çıktısında `auth.providers`, ortam/yapılandırma/depo farkındalıklı sağlayıcı
genel görünümüdür; `auth.oauth` ise yalnızca kimlik doğrulama deposu profil sağlığıdır.
Yapılandırılmış her sağlayıcı profiline karşı canlı kimlik doğrulama yoklamaları çalıştırmak için `--probe` ekleyin.
Yoklamalar gerçek isteklerdir (belirteç tüketebilir ve oran sınırlarını tetikleyebilir).
Yapılandırılmış bir aracının model/kimlik doğrulama durumunu incelemek için `--agent <id>` kullanın. Atlanırsa,
komut ayarlıysa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` kullanır, aksi halde
yapılandırılmış varsayılan aracıyı kullanır.
Yoklama satırları kimlik doğrulama profillerinden, ortam kimlik bilgilerinden veya `models.json` dosyasından gelebilir.

Notlar:

- `models set <model-or-alias>`, `provider/model` veya bir takma ad kabul eder.
- `models list` salt okunurdur: yapılandırmayı, kimlik doğrulama profillerini, mevcut katalog
  durumunu ve sağlayıcıya ait katalog satırlarını okur, ancak `models.json`
  dosyasını yeniden yazmaz.
- `models list --all`, o sağlayıcıyla henüz kimlik doğrulaması yapmamış olsanız bile paketlenmiş sağlayıcıya ait statik katalog satırlarını içerir. Bu satırlar, eşleşen kimlik doğrulama yapılandırılana kadar yine de kullanılamaz olarak görünür.
- `models list --provider <id>`, `moonshot` veya `openai-codex` gibi sağlayıcı kimliğine göre filtreler. `Moonshot AI` gibi etkileşimli sağlayıcı seçicilerindeki görünen etiketleri kabul etmez.
- Model başvuruları **ilk** `/` karakterine göre bölünerek ayrıştırılır. Model kimliği `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız, OpenClaw girdiyi önce takma ad olarak, sonra bu tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesi olarak çözümler ve ancak ondan sonra kullanımdan kaldırma uyarısıyla yapılandırılmış varsayılan sağlayıcıya geri döner.
  Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw
  eski ve kaldırılmış sağlayıcı varsayılanını göstermeye çalışmak yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models status`, gizli olmayan yer tutucular için (örneğin `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) kimlik doğrulama çıktısında bunları gizli değer gibi maskelemek yerine `marker(<value>)` gösterebilir.

### `models status`

Seçenekler:

- `--json`
- `--plain`
- `--check` (çıkış 1=süresi dolmuş/eksik, 2=süresi dolmak üzere)
- `--probe` (yapılandırılmış kimlik doğrulama profillerinin canlı yoklaması)
- `--probe-provider <name>` (tek sağlayıcıyı yokla)
- `--probe-profile <id>` (tekrarlı veya virgülle ayrılmış profil kimlikleri)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (yapılandırılmış aracı kimliği; `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` değerlerini geçersiz kılar)

Yoklama durumu kümeleri:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Beklenecek yoklama ayrıntısı/neden kodu durumları:

- `excluded_by_auth_order`: saklı bir profil vardır, ancak açık
  `auth.order.<provider>` bunu dışlamıştır; bu nedenle yoklama denemek yerine
  dışlamayı bildirir.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil vardır ancak uygun/çözümlenebilir değildir.
- `no_model`: sağlayıcı kimlik doğrulaması vardır, ancak OpenClaw bu sağlayıcı için yoklanabilir
  bir model adayı çözememiştir.

## Takma adlar + geri dönüşler

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Kimlik doğrulama profilleri

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add`, etkileşimli kimlik doğrulama yardımcısıdır. Seçtiğiniz sağlayıcıya bağlı olarak
bir sağlayıcı kimlik doğrulama akışı (OAuth/API anahtarı) başlatabilir veya sizi
elle belirteç yapıştırmaya yönlendirebilir.

`models auth login`, bir sağlayıcı Plugin'inin kimlik doğrulama akışını çalıştırır (OAuth/API anahtarı). Hangi sağlayıcıların kurulu olduğunu görmek için
`openclaw plugins list` kullanın.

Örnekler:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notlar:

- `setup-token` ve `paste-token`, belirteç kimlik doğrulama yöntemleri sunan sağlayıcılar için genel belirteç komutları olarak kalır.
- `setup-token`, etkileşimli bir TTY gerektirir ve sağlayıcının belirteç kimlik doğrulama
  yöntemini çalıştırır (bu yöntemi sunuyorsa varsayılan olarak o sağlayıcının `setup-token`
  yöntemini kullanır).
- `paste-token`, başka yerde veya otomasyondan üretilen bir belirteç dizesini kabul eder.
- `paste-token`, `--provider` gerektirir, belirteç değerini ister ve siz
  `--profile-id` geçmediğiniz sürece bunu varsayılan profil kimliği `<provider>:manual` içine yazar.
- `paste-token --expires-in <duration>`, `365d` veya `12h` gibi göreli bir süreden mutlak belirteç son kullanma tarihi saklar.
- Anthropic notu: Anthropic personeli bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu nedenle Anthropic yeni bir politika yayınlamadığı sürece OpenClaw bu entegrasyon için Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylanmış kabul eder.
- Anthropic `setup-token` / `paste-token`, desteklenen bir OpenClaw belirteç yolu olarak kullanılabilir olmaya devam eder, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Model seçimi](/tr/concepts/model-providers)
- [Model yük devretme](/tr/concepts/model-failover)
