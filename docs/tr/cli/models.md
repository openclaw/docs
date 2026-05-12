---
read_when:
    - Varsayılan modelleri değiştirmek veya sağlayıcı kimlik doğrulama durumunu görüntülemek istiyorsunuz
    - Kullanılabilir modelleri/sağlayıcıları taramak ve kimlik doğrulama profillerinde hata ayıklamak istiyorsunuz
summary: '`openclaw models` için CLI başvurusu (status/list/set/scan, takma adlar, geri dönüşler, kimlik doğrulama)'
title: Modeller
x-i18n:
    generated_at: "2026-05-12T00:58:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Model keşfi, tarama ve yapılandırma (varsayılan model, geri dönüşler, kimlik doğrulama profilleri).

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

`openclaw models status` çözümlenen varsayılanı/geri dönüşleri ve bir kimlik doğrulama özetini gösterir.
Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda, OAuth/API-key durumu bölümü
sağlayıcı kullanım pencerelerini ve kota anlık görüntülerini içerir.
Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi ve z.ai. Kullanım kimlik doğrulaması, mevcut olduğunda
sağlayıcıya özgü hook'lardan gelir; aksi halde OpenClaw auth profillerinden, env'den
veya yapılandırmadan eşleşen OAuth/API-key kimlik bilgilerine geri döner.
`--json` çıktısında, `auth.providers` env/config/store farkındalığı olan sağlayıcı
özetidir; `auth.oauth` ise yalnızca auth-store profil sağlığıdır.
Yapılandırılmış her sağlayıcı profiline karşı canlı kimlik doğrulama probları çalıştırmak için `--probe` ekleyin.
Problar gerçek isteklerdir (token tüketebilir ve hız sınırlarını tetikleyebilir).
Yapılandırılmış bir ajanın model/kimlik doğrulama durumunu incelemek için `--agent <id>` kullanın. Atlanırsa
komut, ayarlanmışsa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` kullanır; aksi halde
yapılandırılmış varsayılan ajanı kullanır.
Prob satırları auth profillerinden, env kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
Codex OAuth sorunlarını gidermek için `openclaw models status`,
`openclaw models auth list --provider openai-codex` ve
`openclaw config get agents.defaults.model --json`, bir ajanın yerel Codex çalışma zamanı üzerinden
`openai/*` için kullanılabilir bir `openai-codex` auth profiline sahip olup olmadığını
doğrulamanın en hızlı yoludur. Bkz. [OpenAI sağlayıcı kurulumu](/tr/providers/openai#check-and-recover-codex-oauth-routing).

Notlar:

- `models set <model-or-alias>`, `provider/model` veya bir alias kabul eder.
- `models list` salt okunurdur: config'i, auth profillerini, mevcut katalog
  durumunu ve sağlayıcıya ait katalog satırlarını okur; ancak
  `models.json` dosyasını yeniden yazmaz.
- `Auth` sütunu sağlayıcı düzeyindedir ve salt okunurdur. Yerel auth profil
  meta verilerinden, env işaretçilerinden, yapılandırılmış sağlayıcı anahtarlarından, yerel sağlayıcı
  işaretçilerinden, AWS Bedrock env/profil işaretçilerinden ve Plugin sentetik auth meta verilerinden
  hesaplanır; sağlayıcı çalışma zamanını yüklemez, keychain secret'larını okumaz, sağlayıcı
  API'lerini çağırmaz veya model başına kesin yürütme hazır olduğunu kanıtlamaz.
- `models list --all --provider <id>`, henüz o sağlayıcıyla kimlik doğrulaması yapmamış olsanız bile
  Plugin manifestlerinden veya paketlenmiş sağlayıcı katalog meta verilerinden sağlayıcıya ait statik katalog
  satırlarını içerebilir. Bu satırlar, eşleşen auth yapılandırılana kadar yine de
  kullanılamaz olarak görünür.
- `models list`, sağlayıcı katalog keşfi yavaşken kontrol düzlemini yanıt verebilir tutar.
  Varsayılan ve yapılandırılmış görünümler kısa bir beklemeden sonra yapılandırılmış veya
  sentetik model satırlarına geri döner ve keşfin arka planda bitmesine izin verir.
  Tam keşfedilmiş kataloğa kesin olarak ihtiyacınız olduğunda ve sağlayıcı keşfini
  beklemeye razı olduğunuzda `--all` kullanın.
- Geniş `models list --all`, sağlayıcı çalışma zamanı ek hook'larını yüklemeden
  manifest katalog satırlarını kayıt defteri satırlarının üzerine birleştirir. Sağlayıcıya göre filtrelenmiş manifest
  hızlı yolları yalnızca `static` olarak işaretlenmiş sağlayıcıları kullanır; `refreshable` olarak işaretlenmiş
  sağlayıcılar kayıt defteri/cache destekli kalır ve manifest satırlarını ekler; `runtime` olarak işaretlenmiş
  sağlayıcılar ise kayıt defteri/çalışma zamanı keşfinde kalır.
- `models list`, yerel model meta verilerini ve çalışma zamanı sınırlarını ayrı tutar. Tablo
  çıktısında, etkili bir çalışma zamanı sınırı yerel context window'dan farklı olduğunda `Ctx`,
  `contextTokens/contextWindow` gösterir; JSON satırları, sağlayıcı bu sınırı açığa çıkarıyorsa
  `contextTokens` içerir.
- `models list --provider <id>`, `moonshot` veya `openai-codex` gibi sağlayıcı id'sine göre filtreler.
  `Moonshot AI` gibi etkileşimli sağlayıcı seçicilerinden gelen görüntü etiketlerini kabul etmez.
- Model referansları **ilk** `/` üzerinden bölünerek ayrıştırılır. Model ID'si `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız OpenClaw girdiyi önce bir alias olarak, sonra
  tam model id'si için benzersiz yapılandırılmış sağlayıcı eşleşmesi olarak çözer ve ancak ondan sonra
  bir kullanımdan kaldırma uyarısıyla yapılandırılmış varsayılan sağlayıcıya geri döner.
  Bu sağlayıcı artık yapılandırılmış varsayılan modeli açığa çıkarmıyorsa OpenClaw
  eski, kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/model çiftine geri döner.
- `models status`, auth çıktısında gizli olmayan yer tutucular için (örneğin `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) bunları secret olarak maskelemek yerine `marker(<value>)` gösterebilir.

### Modelleri tarama

`models scan`, OpenRouter'ın herkese açık `:free` kataloğunu okur ve adayları
geri dönüş kullanımı için sıralar. Kataloğun kendisi herkese açıktır, bu nedenle yalnızca meta veri taramaları
OpenRouter anahtarı gerektirmez.

Varsayılan olarak OpenClaw, canlı model çağrılarıyla araç ve görüntü desteğini probe etmeye çalışır.
Yapılandırılmış OpenRouter anahtarı yoksa komut yalnızca meta veri
çıktısına geri döner ve `:free` modellerinin problar ve inference için yine de
`OPENROUTER_API_KEY` gerektirdiğini açıklar.

Seçenekler:

- `--no-probe` (yalnızca meta veri; config/secret araması yok)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (katalog isteği ve prob başına timeout)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` ve `--set-image` canlı problar gerektirir; yalnızca meta veri tarama
sonuçları bilgilendirme amaçlıdır ve config'e uygulanmaz.

### Modellerin durumu

Seçenekler:

- `--json`
- `--plain`
- `--check` (exit 1=süresi dolmuş/eksik, 2=süresi dolmak üzere)
- `--probe` (yapılandırılmış auth profillerinin canlı probu)
- `--probe-provider <name>` (bir sağlayıcıyı probe et)
- `--probe-profile <id>` (tekrar eden veya virgülle ayrılmış profil id'leri)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (yapılandırılmış ajan id'si; `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` değerlerini geçersiz kılar)

`--json`, stdout'u JSON payload'u için ayrılmış tutar. Auth profili, sağlayıcı
ve başlangıç tanıları stderr'e yönlendirilir; böylece script'ler stdout'u doğrudan
`jq` gibi araçlara pipe edebilir.

Prob durum kovaları:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Beklenebilecek prob ayrıntısı/neden kodu durumları:

- `excluded_by_auth_order`: saklanan bir profil vardır, ancak açık
  `auth.order.<provider>` bunu atlamıştır; bu nedenle prob, denemek yerine
  dışlamayı bildirir.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil mevcuttur ancak uygun/çözülebilir değildir.
- `no_model`: sağlayıcı auth'u vardır, ancak OpenClaw bu sağlayıcı için probe edilebilir
  bir model adayı çözememiştir.

## Alias'lar + geri dönüşler

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Auth profilleri

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add`, etkileşimli auth yardımcısıdır. Seçtiğiniz
sağlayıcıya bağlı olarak bir sağlayıcı auth akışı (OAuth/API key) başlatabilir veya sizi
manuel token yapıştırmaya yönlendirebilir.

`models auth list`, seçili ajan için kaydedilmiş auth profillerini token,
API-key veya OAuth secret materyali yazdırmadan listeler. `openai-codex` gibi
tek bir sağlayıcıya filtrelemek için `--provider <id>`; script kullanımı için `--json` kullanın.

`models auth login`, bir sağlayıcı Plugin'inin auth akışını (OAuth/API key) çalıştırır. Hangi sağlayıcıların yüklü olduğunu görmek için
`openclaw plugins list` kullanın.
Auth sonuçlarını belirli bir yapılandırılmış ajan deposuna yazmak için
`openclaw models auth --agent <id> <subcommand>` kullanın. Üst `--agent` bayrağı
`add`, `list`, `login`, `setup-token`, `paste-token` ve
`login-github-copilot` tarafından dikkate alınır.

OpenAI modelleri için `--provider openai` varsayılan olarak ChatGPT/Codex hesap oturum açmaya ayarlanır.
`--method api-key` seçeneğini yalnızca, genellikle Codex abonelik sınırları için yedek olarak
bir OpenAI API-key profili eklemek istediğinizde kullanın. Eski
`--provider openai-codex` yazımı mevcut script'ler için çalışmaya devam eder.

Örnekler:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

Notlar:

- `setup-token` ve `paste-token`, token auth yöntemlerini açığa çıkaran sağlayıcılar için
  genel token komutları olarak kalır.
- `setup-token`, etkileşimli bir TTY gerektirir ve sağlayıcının token-auth
  yöntemini çalıştırır (sağlayıcı bir tane açığa çıkarıyorsa varsayılan olarak o sağlayıcının
  `setup-token` yöntemini kullanır).
- `paste-token`, başka bir yerde veya otomasyondan oluşturulan bir token dizesini kabul eder.
- `paste-token`, `--provider` gerektirir, token değerini ister ve
  `--profile-id` geçmediğiniz sürece bunu varsayılan profil id'si `<provider>:manual` içine yazar.
- `paste-token --expires-in <duration>`, `365d` veya `12h` gibi
  göreli bir süreden mutlak bir token süre sonu kaydeder.
- Anthropic notu: Anthropic personeli bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için onaylı kabul eder.
- Anthropic `setup-token` / `paste-token`, desteklenen bir OpenClaw token yolu olarak kullanılabilir kalır; ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` komutunu tercih eder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Model seçimi](/tr/concepts/model-providers)
- [Model failover](/tr/concepts/model-failover)
