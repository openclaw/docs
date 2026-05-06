---
read_when:
    - Varsayılan modelleri değiştirmek veya sağlayıcı kimlik doğrulama durumunu görüntülemek istiyorsunuz
    - Kullanılabilir modelleri/sağlayıcıları taramak ve kimlik doğrulama profillerinde hata ayıklamak istiyorsunuz
summary: '`openclaw models` için CLI başvurusu (status/list/set/scan, takma adlar, geri dönüşler, kimlik doğrulama)'
title: Modeller
x-i18n:
    generated_at: "2026-05-06T19:35:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7749d97382529587d54ea96466edc880a731f2c2d39eed1677e4fbf129f11435
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Model keşfi, tarama ve yapılandırma (varsayılan model, yedekler, kimlik doğrulama profilleri).

İlgili:

- Sağlayıcılar + modeller: [Modeller](/tr/providers/models)
- Model seçimi kavramları + `/models` slash komutu: [Modeller kavramı](/tr/concepts/models)
- Sağlayıcı kimlik doğrulama kurulumu: [Başlarken](/tr/start/getting-started)

## Yaygın komutlar

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status`, çözümlenen varsayılanı/yedekleri ve bir kimlik doğrulama genel görünümünü gösterir.
Sağlayıcı kullanım anlık görüntüleri kullanılabilir olduğunda, OAuth/API anahtarı durumu bölümü
sağlayıcı kullanım pencerelerini ve kota anlık görüntülerini içerir.
Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi ve z.ai. Kullanım kimlik doğrulaması, kullanılabilir olduğunda
sağlayıcıya özel kancalardan gelir; aksi halde OpenClaw, kimlik doğrulama profillerinden,
env veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.
`--json` çıktısında, `auth.providers` env/yapılandırma/depo farkındalığı olan
sağlayıcı genel görünümüdür; `auth.oauth` ise yalnızca kimlik doğrulama deposu
profil sağlığıdır.
Yapılandırılmış her sağlayıcı profiline karşı canlı kimlik doğrulama yoklamaları çalıştırmak için `--probe` ekleyin.
Yoklamalar gerçek isteklerdir (token tüketebilir ve hız limitlerini tetikleyebilir).
Yapılandırılmış bir ajanın model/kimlik doğrulama durumunu incelemek için `--agent <id>` kullanın. Atlandığında,
komut ayarlanmışsa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` kullanır; aksi halde
yapılandırılmış varsayılan ajanı kullanır.
Yoklama satırları kimlik doğrulama profillerinden, env kimlik bilgilerinden veya `models.json` içinden gelebilir.
Codex OAuth sorun giderme için `openclaw models status`,
`openclaw models auth list --provider openai-codex` ve
`openclaw config get agents.defaults.model --json`, bir ajanın `openai-codex/*`
öğesini PI üzerinden mi yoksa `openai/*` öğesini yerel Codex çalışma zamanı
üzerinden mi kullandığını doğrulamanın en hızlı yoludur. Bkz. [OpenAI sağlayıcı kurulumu](/tr/providers/openai#check-and-recover-codex-oauth-routing).

Notlar:

- `models set <model-or-alias>`, `provider/model` veya bir takma adı kabul eder.
- `models list` salt okunurdur: yapılandırmayı, kimlik doğrulama profillerini, mevcut katalog
  durumunu ve sağlayıcının sahip olduğu katalog satırlarını okur, ancak
  `models.json` öğesini yeniden yazmaz.
- `Auth` sütunu sağlayıcı düzeyindedir ve salt okunurdur. Yerel kimlik doğrulama
  profili meta verilerinden, env işaretçilerinden, yapılandırılmış sağlayıcı anahtarlarından,
  yerel sağlayıcı işaretçilerinden, AWS Bedrock env/profil işaretçilerinden ve Plugin sentetik kimlik doğrulama meta verilerinden hesaplanır;
  sağlayıcı çalışma zamanını yüklemez, keychain sırlarını okumaz, sağlayıcı
  API'lerini çağırmaz veya model başına kesin yürütme hazır oluşunu kanıtlamaz.
- `models list --all --provider <id>`, o sağlayıcıyla henüz kimlik doğrulaması
  yapmamış olsanız bile Plugin manifestlerinden veya paketli sağlayıcı katalog
  meta verilerinden sağlayıcının sahip olduğu statik katalog satırlarını içerebilir.
  Bu satırlar, eşleşen kimlik doğrulama yapılandırılana kadar yine de
  kullanılamaz olarak görünür.
- `models list`, sağlayıcı katalog keşfi yavaşken kontrol düzlemini yanıt verebilir
  tutar. Varsayılan ve yapılandırılmış görünümler kısa bir beklemeden sonra
  yapılandırılmış veya sentetik model satırlarına geri döner ve keşfin arka planda
  tamamlanmasına izin verir. Tam keşfedilmiş kataloğa kesin olarak ihtiyaç duyduğunuzda
  ve sağlayıcı keşfini beklemeye hazırsanız `--all` kullanın.
- Geniş `models list --all`, sağlayıcı çalışma zamanı ek kancalarını yüklemeden
  manifest katalog satırlarını kayıt satırlarının üzerine birleştirir. Sağlayıcıya
  göre filtrelenmiş manifest hızlı yolları yalnızca `static` olarak işaretli
  sağlayıcıları kullanır; `refreshable` olarak işaretli sağlayıcılar kayıt/önbellek
  destekli kalır ve manifest satırlarını ek olarak eklerken, `runtime` olarak
  işaretli sağlayıcılar kayıt/çalışma zamanı keşfinde kalır.
- `models list`, yerel model meta verilerini ve çalışma zamanı sınırlarını ayrı tutar. Tablo
  çıktısında, etkili bir çalışma zamanı sınırı yerel bağlam penceresinden farklıysa
  `Ctx`, `contextTokens/contextWindow` gösterir; JSON satırları, sağlayıcı bu sınırı
  açığa çıkarıyorsa `contextTokens` içerir.
- `models list --provider <id>`, `moonshot` veya `openai-codex` gibi sağlayıcı kimliğine göre filtreler. Etkileşimli sağlayıcı seçicilerinden gelen
  `Moonshot AI` gibi görüntü etiketlerini kabul etmez.
- Model referansları **ilk** `/` üzerinden bölünerek ayrıştırılır. Model kimliği `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız OpenClaw girdiyi önce bir takma ad olarak, sonra
  bu tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesi
  olarak çözer ve ancak bundan sonra kullanımdan kaldırma uyarısıyla yapılandırılmış
  varsayılan sağlayıcıya geri döner.
  Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw,
  eski ve kaldırılmış sağlayıcı varsayılanını yüzeye çıkarmak yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models status`, kimlik doğrulama çıktısında gizli olmayan yer tutucular için (örneğin `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) bunları sır gibi maskelemek yerine `marker(<value>)` gösterebilir.

### Model taraması

`models scan`, OpenRouter'ın herkese açık `:free` kataloğunu okur ve adayları
yedek kullanım için sıralar. Kataloğun kendisi herkese açık olduğundan yalnızca meta veri taramaları
OpenRouter anahtarı gerektirmez.

OpenClaw varsayılan olarak canlı model çağrılarıyla araç ve görüntü desteğini yoklamaya çalışır.
Yapılandırılmış OpenRouter anahtarı yoksa komut yalnızca meta veri
çıktısına geri döner ve `:free` modellerinin yoklamalar ve çıkarım için yine de
`OPENROUTER_API_KEY` gerektirdiğini açıklar.

Seçenekler:

- `--no-probe` (yalnızca meta veri; yapılandırma/sırlar araması yok)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (katalog isteği ve yoklama başına zaman aşımı)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` ve `--set-image` canlı yoklamalar gerektirir; yalnızca meta veri
tarama sonuçları bilgilendiricidir ve yapılandırmaya uygulanmaz.

### Model durumu

Seçenekler:

- `--json`
- `--plain`
- `--check` (çıkış 1=süresi dolmuş/eksik, 2=süresi dolmak üzere)
- `--probe` (yapılandırılmış kimlik doğrulama profillerinin canlı yoklaması)
- `--probe-provider <name>` (bir sağlayıcıyı yokla)
- `--probe-profile <id>` (tekrarlanan veya virgülle ayrılmış profil kimlikleri)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (yapılandırılmış ajan kimliği; `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` öğesini geçersiz kılar)

`--json`, stdout'u JSON yükü için ayrılmış tutar. Kimlik doğrulama profili, sağlayıcı
ve başlangıç tanılamaları stderr'e yönlendirilir; böylece betikler stdout'u doğrudan
`jq` gibi araçlara aktarabilir.

Yoklama durumu kümeleri:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Beklenmesi gereken yoklama ayrıntısı/neden kodu durumları:

- `excluded_by_auth_order`: depolanmış bir profil vardır, ancak açık
  `auth.order.<provider>` onu atlamıştır; bu nedenle yoklama denemek yerine
  dışlamayı bildirir.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil mevcuttur ancak uygun/çözümlenebilir değildir.
- `no_model`: sağlayıcı kimlik doğrulaması vardır, ancak OpenClaw bu sağlayıcı için yoklanabilir
  bir model adayı çözememiştir.

## Takma adlar + yedekler

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Kimlik doğrulama profilleri

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` etkileşimli kimlik doğrulama yardımcısıdır. Seçtiğiniz sağlayıcıya
bağlı olarak bir sağlayıcı kimlik doğrulama akışı (OAuth/API anahtarı) başlatabilir
veya sizi manuel token yapıştırmaya yönlendirebilir.

`models auth list`, seçilen ajan için kaydedilmiş kimlik doğrulama profillerini
token, API anahtarı veya OAuth sırrı malzemesi yazdırmadan listeler. `openai-codex`
gibi tek bir sağlayıcıya filtrelemek için `--provider <id>` ve betikleme için
`--json` kullanın.

`models auth login`, bir sağlayıcı Plugin'inin kimlik doğrulama akışını (OAuth/API anahtarı) çalıştırır. Hangi sağlayıcıların kurulu olduğunu görmek için
`openclaw plugins list` kullanın.
Kimlik doğrulama sonuçlarını belirli bir yapılandırılmış ajan deposuna yazmak için
`openclaw models auth --agent <id> <subcommand>` kullanın. Üst `--agent` bayrağı
`add`, `list`, `login`, `setup-token`, `paste-token` ve
`login-github-copilot` tarafından dikkate alınır.

Örnekler:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Notlar:

- `setup-token` ve `paste-token`, token kimlik doğrulama yöntemleri açığa çıkaran sağlayıcılar için
  genel token komutları olarak kalır.
- `setup-token` etkileşimli bir TTY gerektirir ve sağlayıcının token kimlik doğrulama
  yöntemini çalıştırır (sağlayıcı bir tane açığa çıkarıyorsa varsayılan olarak
  o sağlayıcının `setup-token` yöntemini kullanır).
- `paste-token`, başka yerde veya otomasyondan oluşturulmuş bir token dizesini kabul eder.
- `paste-token`, `--provider` gerektirir, token değerini ister ve siz
  `--profile-id` geçmediğiniz sürece varsayılan profil kimliği `<provider>:manual` içine yazar.
- `paste-token --expires-in <duration>`, `365d` veya `12h` gibi göreli bir süreden
  mutlak bir token sona erme zamanı depolar.
- Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece bu entegrasyon için Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylı kabul eder.
- Anthropic `setup-token` / `paste-token`, desteklenen bir OpenClaw token yolu olarak kullanılabilir kalır; ancak OpenClaw artık kullanılabilir olduğunda Claude CLI yeniden kullanımını ve `claude -p` öğesini tercih eder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Model seçimi](/tr/concepts/model-providers)
- [Model devretme](/tr/concepts/model-failover)
