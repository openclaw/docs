---
read_when:
    - Varsayılan modelleri değiştirmek veya sağlayıcı kimlik doğrulama durumunu görüntülemek istiyorsunuz
    - Kullanılabilir modelleri/sağlayıcıları taramak ve kimlik doğrulama profillerinde hata ayıklamak istiyorsunuz
summary: '`openclaw models` için CLI başvurusu (status/list/set/scan, takma adlar, geri dönüşler, kimlik doğrulama)'
title: Modeller
x-i18n:
    generated_at: "2026-04-26T11:26:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5acf5972251ee7aa22d1f9222f1a497822fb1f25f29f827702f8b37dda8dadf
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

`openclaw models status`, çözümlenmiş varsayılanı/geri dönüşleri ve bir kimlik doğrulama genel görünümünü gösterir.
Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda, OAuth/API anahtarı durumu bölümü
sağlayıcı kullanım pencerelerini ve kota anlık görüntülerini içerir.
Mevcut kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi ve z.ai. Kullanım kimlik doğrulaması, mümkün olduğunda
sağlayıcıya özgü kancalardan gelir; aksi halde OpenClaw, auth profilleri, env veya yapılandırmadaki
eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.
`--json` çıktısında `auth.providers`, env/yapılandırma/depo farkında sağlayıcı
genel görünümüdür; `auth.oauth` ise yalnızca auth deposu profil sağlığıdır.
Yapılandırılmış her sağlayıcı profiline karşı canlı kimlik doğrulama probları çalıştırmak için `--probe` ekleyin.
Problar gerçek isteklerdir (token tüketebilir ve oran sınırlarını tetikleyebilir).
Yapılandırılmış bir aracının model/kimlik doğrulama durumunu incelemek için `--agent <id>` kullanın. Belirtilmezse
komut, ayarlıysa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` kullanır; aksi halde
yapılandırılmış varsayılan aracıyı kullanır.
Prob satırları auth profillerinden, env kimlik bilgilerinden veya `models.json` dosyasından gelebilir.

Notlar:

- `models set <model-or-alias>`, `provider/model` veya bir takma adı kabul eder.
- `models list` salt okunurdur: yapılandırmayı, auth profillerini, mevcut katalog
  durumunu ve sağlayıcıya ait katalog satırlarını okur, ancak
  `models.json` dosyasını yeniden yazmaz.
- `models list --all --provider <id>`, henüz o sağlayıcıyla
  kimlik doğrulaması yapmamış olsanız bile Plugin manifestlerinden veya paketlenmiş sağlayıcı katalog meta verilerinden
  sağlayıcıya ait statik katalog satırlarını içerebilir. Eşleşen kimlik doğrulama yapılandırılana kadar
  bu satırlar yine de kullanılamaz olarak gösterilir.
- `models list`, yerel model meta verilerini ve çalışma zamanı sınırlarını ayrı tutar. Tablo
  çıktısında `Ctx`, etkili bir çalışma zamanı sınırı yerel bağlam penceresinden farklıysa `contextTokens/contextWindow` gösterir;
  JSON satırları ise bir sağlayıcı bu sınırı açığa çıkarıyorsa `contextTokens` içerir.
- `models list --provider <id>`, `moonshot` veya
  `openai-codex` gibi sağlayıcı kimliğine göre filtreler. `Moonshot AI` gibi
  etkileşimli sağlayıcı seçicilerindeki görünen etiketleri kabul etmez.
- Model başvuruları **ilk** `/` üzerinden bölünerek ayrıştırılır. Model kimliği `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı belirtmezseniz, OpenClaw girdiyi önce bir takma ad olarak, sonra
  tam o model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi olarak çözümler ve ancak ondan sonra
  kullanım dışı bırakma uyarısıyla yapılandırılmış varsayılan sağlayıcıya geri döner.
  Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw
  eski kaldırılmış sağlayıcı varsayılanını göstermemek için ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models status`, kimlik doğrulama çıktısında sır gibi maskelemek yerine
  gizli olmayan yer tutucular için `marker(<value>)` gösterebilir (örneğin `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`).

### `models scan`

`models scan`, OpenRouter'ın genel `:free` kataloğunu okur ve geri dönüş kullanımı için
adayları sıralar. Katalogun kendisi herkese açıktır, bu nedenle yalnızca meta veri taramaları
OpenRouter anahtarı gerektirmez.

Varsayılan olarak OpenClaw, canlı model çağrılarıyla araç ve görsel desteğini prob etmeye çalışır.
Yapılandırılmış bir OpenRouter anahtarı yoksa komut yalnızca meta veri çıktısına geri döner
ve `:free` modellerin prob ve çıkarım için yine de `OPENROUTER_API_KEY` gerektirdiğini açıklar.

Seçenekler:

- `--no-probe` (yalnızca meta veri; yapılandırma/sırlar araması yok)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (katalog isteği ve prob başına zaman aşımı)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` ve `--set-image` canlı problar gerektirir; yalnızca meta veri tarama
sonuçları bilgilendiricidir ve yapılandırmaya uygulanmaz.

### `models status`

Seçenekler:

- `--json`
- `--plain`
- `--check` (çıkış 1=süresi dolmuş/eksik, 2=süresi dolmak üzere)
- `--probe` (yapılandırılmış auth profillerinin canlı probu)
- `--probe-provider <name>` (tek sağlayıcıyı prob et)
- `--probe-profile <id>` (tekrarlı veya virgülle ayrılmış profil kimlikleri)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (yapılandırılmış aracı kimliği; `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` değerlerini geçersiz kılar)

Prob durum kovaları:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Beklenmesi gereken prob ayrıntı/neden kodu durumları:

- `excluded_by_auth_order`: depolanmış bir profil vardır, ancak açık
  `auth.order.<provider>` bunu atlamıştır; bu nedenle prob, denemek yerine
  bu dışlamayı bildirir.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil mevcut ama uygun/çözümlenebilir değil.
- `no_model`: sağlayıcı kimlik doğrulaması vardır, ancak OpenClaw o sağlayıcı için
  prob edilebilir bir model adayı çözememiştir.

## Takma adlar + geri dönüşler

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Auth profilleri

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add`, etkileşimli kimlik doğrulama yardımcısıdır. Seçtiğiniz sağlayıcıya bağlı olarak
bir sağlayıcı kimlik doğrulama akışı (OAuth/API anahtarı) başlatabilir veya sizi
manuel token yapıştırmaya yönlendirebilir.

`models auth login`, bir sağlayıcı Plugin'inin kimlik doğrulama akışını (OAuth/API anahtarı) çalıştırır.
Hangi sağlayıcıların kurulu olduğunu görmek için `openclaw plugins list` kullanın.
Kimlik doğrulama sonuçlarını belirli bir yapılandırılmış aracı deposuna yazmak için
`openclaw models auth --agent <id> <subcommand>` kullanın. Üst `--agent` bayrağı
`add`, `login`, `setup-token`, `paste-token` ve `login-github-copilot` tarafından dikkate alınır.

Örnekler:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notlar:

- `setup-token` ve `paste-token`, token kimlik doğrulama yöntemleri sunan sağlayıcılar için
  genel token komutları olarak kalır.
- `setup-token`, etkileşimli bir TTY gerektirir ve sağlayıcının token kimlik doğrulama
  yöntemini çalıştırır (sağlayıcı bunu sunuyorsa varsayılan olarak o sağlayıcının `setup-token`
  yöntemini kullanır).
- `paste-token`, başka bir yerde veya otomasyondan üretilmiş bir token dizesini kabul eder.
- `paste-token`, `--provider` gerektirir, token değeri için istemde bulunur ve
  `--profile-id` geçmezseniz bunu varsayılan profil kimliği `<provider>:manual` içine
  yazar.
- `paste-token --expires-in <duration>`, `365d` veya `12h` gibi göreli bir süreden
  mutlak bir token sona erme zamanı depolar.
- Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu nedenle Anthropic yeni bir politika yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için onaylı kabul eder.
- Anthropic `setup-token` / `paste-token`, desteklenen bir OpenClaw token yolu olarak kullanılmaya devam eder, ancak OpenClaw artık mümkün olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Model seçimi](/tr/concepts/model-providers)
- [Model failover](/tr/concepts/model-failover)
