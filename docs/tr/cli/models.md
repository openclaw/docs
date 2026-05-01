---
read_when:
    - Varsayılan modelleri değiştirmek veya sağlayıcı kimlik doğrulama durumunu görüntülemek istiyorsunuz
    - Kullanılabilir modelleri/sağlayıcıları taramak ve kimlik doğrulama profillerinde hata ayıklamak istiyorsunuz
summary: '`openclaw models` için CLI başvurusu (status/list/set/scan, takma adlar, geri dönüşler, kimlik doğrulama)'
title: Modeller
x-i18n:
    generated_at: "2026-05-01T08:59:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 538d3e4808329737fdc044dc6e14e5c7c78052e75d8a8b3b257b1ebd821c84d1
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
Sağlayıcı kullanım anlık görüntüleri kullanılabilir olduğunda, OAuth/API anahtarı durum bölümü
sağlayıcı kullanım pencerelerini ve kota anlık görüntülerini içerir.
Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi ve z.ai. Kullanım kimlik doğrulaması, mevcut olduğunda
sağlayıcıya özgü hook'lardan gelir; aksi takdirde OpenClaw, kimlik doğrulama
profillerinden, env'den veya yapılandırmadan eşleşen OAuth/API anahtarı
kimlik bilgilerine geri döner.
`--json` çıktısında `auth.providers`, env/config/store farkındalıklı sağlayıcı
genel görünümüdür; `auth.oauth` ise yalnızca auth-store profil sağlığıdır.
Yapılandırılmış her sağlayıcı profiline karşı canlı kimlik doğrulama yoklamaları çalıştırmak için `--probe` ekleyin.
Yoklamalar gerçek isteklerdir (token tüketebilir ve hız sınırlarını tetikleyebilir).
Yapılandırılmış bir ajanın model/kimlik doğrulama durumunu incelemek için `--agent <id>` kullanın. Atlanırsa,
komut ayarlanmışsa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` değerini, aksi takdirde
yapılandırılmış varsayılan ajanı kullanır.
Yoklama satırları kimlik doğrulama profillerinden, env kimlik bilgilerinden veya `models.json` içinden gelebilir.

Notlar:

- `models set <model-or-alias>`, `provider/model` veya bir takma adı kabul eder.
- `models list` salt okunurdur: yapılandırmayı, kimlik doğrulama profillerini, mevcut katalog
  durumunu ve sağlayıcıya ait katalog satırlarını okur, ancak
  `models.json` dosyasını yeniden yazmaz.
- `Auth` sütunu sağlayıcı düzeyindedir ve salt okunurdur. Yerel
  kimlik doğrulama profili meta verilerinden, env işaretçilerinden, yapılandırılmış sağlayıcı anahtarlarından, yerel sağlayıcı
  işaretçilerinden, AWS Bedrock env/profil işaretçilerinden ve Plugin sentetik kimlik doğrulama meta verilerinden hesaplanır;
  sağlayıcı runtime'ını yüklemez, keychain gizlerini okumaz, sağlayıcı
  API'lerini çağırmaz veya model başına kesin yürütme hazırlığını kanıtlamaz.
- `models list --all --provider <id>`, henüz o sağlayıcıyla kimlik doğrulaması
  yapmamış olsanız bile Plugin manifestlerinden veya paketlenmiş sağlayıcı katalog meta verilerinden sağlayıcıya ait statik katalog
  satırlarını içerebilir. Bu satırlar, eşleşen kimlik doğrulaması yapılandırılana kadar yine de
  kullanılamaz olarak görünür.
- `models list`, sağlayıcı katalog keşfi yavaşken control plane'i duyarlı tutar.
  Varsayılan ve yapılandırılmış görünümler, kısa bir beklemeden sonra yapılandırılmış veya
  sentetik model satırlarına geri döner ve keşfin arka planda bitmesine izin verir.
  Kesin tam keşfedilmiş kataloğa ihtiyaç duyduğunuzda ve sağlayıcı keşfini
  beklemeye razı olduğunuzda `--all` kullanın.
- Geniş `models list --all`, sağlayıcı runtime destek hook'larını yüklemeden
  manifest katalog satırlarını registry satırlarının üzerine birleştirir. Sağlayıcı filtreli manifest
  hızlı yolları yalnızca `static` olarak işaretlenmiş sağlayıcıları kullanır; `refreshable` olarak işaretlenmiş sağlayıcılar
  registry/cache destekli kalır ve manifest satırlarını destek olarak eklerken,
  `runtime` olarak işaretlenmiş sağlayıcılar registry/runtime keşfinde kalır.
- `models list`, yerel model meta verilerini ve runtime sınırlarını ayrı tutar. Tablo
  çıktısında, etkili bir runtime sınırı yerel context penceresinden farklı olduğunda `Ctx`
  `contextTokens/contextWindow` gösterir; JSON satırları, bir sağlayıcı bu sınırı sunduğunda
  `contextTokens` içerir.
- `models list --provider <id>`, `moonshot` veya
  `openai-codex` gibi sağlayıcı kimliğine göre filtreler. Etkileşimli sağlayıcı
  seçicilerinden gelen `Moonshot AI` gibi görüntü etiketlerini kabul etmez.
- Model referansları **ilk** `/` karakterine göre bölünerek ayrıştırılır. Model ID'si `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız OpenClaw girdiyi önce takma ad olarak, sonra
  tam model id'si için benzersiz yapılandırılmış sağlayıcı eşleşmesi olarak çözer ve ancak ondan sonra
  kullanımdan kaldırma uyarısıyla yapılandırılmış varsayılan sağlayıcıya geri döner.
  Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw,
  eski kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış
  sağlayıcı/modele geri döner.
- `models status`, gizli olmayan yer tutucular için kimlik doğrulama çıktısında bunları gizli olarak maskelemek yerine `marker(<value>)` gösterebilir (örneğin `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`).

### Modelleri tarama

`models scan`, OpenRouter'ın herkese açık `:free` kataloğunu okur ve adayları
yedek kullanım için sıralar. Kataloğun kendisi herkese açıktır; bu nedenle yalnızca meta veri taramaları
OpenRouter anahtarı gerektirmez.

Varsayılan olarak OpenClaw, canlı model çağrılarıyla araç ve görüntü desteğini yoklamayı dener.
OpenRouter anahtarı yapılandırılmamışsa komut yalnızca meta veri
çıktısına geri döner ve `:free` modellerin yoklamalar ve çıkarım için yine de
`OPENROUTER_API_KEY` gerektirdiğini açıklar.

Seçenekler:

- `--no-probe` (yalnızca meta veri; config/gizli araması yok)
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

`--set-default` ve `--set-image` canlı yoklama gerektirir; yalnızca meta veri tarama
sonuçları bilgilendirme amaçlıdır ve yapılandırmaya uygulanmaz.

### Modellerin durumu

Seçenekler:

- `--json`
- `--plain`
- `--check` (çıkış 1=süresi dolmuş/eksik, 2=süresi dolmak üzere)
- `--probe` (yapılandırılmış kimlik doğrulama profillerinin canlı yoklaması)
- `--probe-provider <name>` (tek sağlayıcıyı yokla)
- `--probe-profile <id>` (profil kimliklerini tekrarla veya virgülle ayır)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (yapılandırılmış ajan kimliği; `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` değerlerini geçersiz kılar)

`--json`, stdout'u JSON yükü için ayrılmış tutar. Kimlik doğrulama profili, sağlayıcı
ve başlangıç tanılamaları stderr'ye yönlendirilir; böylece betikler stdout'u doğrudan
`jq` gibi araçlara pipe edebilir.

Yoklama durumu kovaları:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Beklenebilecek yoklama ayrıntısı/neden kodu durumları:

- `excluded_by_auth_order`: saklanan bir profil vardır, ancak açık
  `auth.order.<provider>` bunu atlamıştır; bu yüzden yoklama denemek yerine
  dışlamayı bildirir.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil mevcuttur ancak uygun/çözümlenebilir değildir.
- `no_model`: sağlayıcı kimlik doğrulaması vardır, ancak OpenClaw o sağlayıcı için yoklanabilir
  bir model adayını çözememiştir.

## Takma adlar + yedekler

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

`models auth add`, etkileşimli kimlik doğrulama yardımcısıdır. Seçtiğiniz
sağlayıcıya bağlı olarak bir sağlayıcı kimlik doğrulama akışı (OAuth/API anahtarı)
başlatabilir veya sizi manuel token yapıştırmaya yönlendirebilir.

`models auth login`, bir sağlayıcı Plugin'inin kimlik doğrulama akışını (OAuth/API anahtarı) çalıştırır. Hangi sağlayıcıların kurulu olduğunu görmek için
`openclaw plugins list` kullanın.
Kimlik doğrulama sonuçlarını belirli bir yapılandırılmış ajan deposuna yazmak için
`openclaw models auth --agent <id> <subcommand>` kullanın. Üst `--agent` bayrağı
`add`, `login`, `setup-token`, `paste-token` ve `login-github-copilot` tarafından dikkate alınır.

Örnekler:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Notlar:

- `setup-token` ve `paste-token`, token kimlik doğrulama yöntemleri sunan sağlayıcılar için
  genel token komutları olarak kalır.
- `setup-token` etkileşimli bir TTY gerektirir ve sağlayıcının token-auth
  yöntemini çalıştırır (sağlayıcı bir tane sunuyorsa varsayılan olarak o sağlayıcının
  `setup-token` yöntemini kullanır).
- `paste-token`, başka yerde veya otomasyondan üretilmiş bir token dizesini kabul eder.
- `paste-token`, `--provider` gerektirir, token değerini ister ve
  `--profile-id` geçmediğiniz sürece bunu varsayılan profil kimliği
  `<provider>:manual` içine yazar.
- `paste-token --expires-in <duration>`, `365d` veya `12h` gibi göreli bir süreden
  mutlak token sona erme zamanını depolar.
- Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına tekrar izin verildiğini söyledi; bu nedenle OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece bu entegrasyon için Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylı kabul eder.
- Anthropic `setup-token` / `paste-token`, desteklenen bir OpenClaw token yolu olarak kullanılabilir kalır; ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` komutunu tercih eder.

## İlgili

- [CLI referansı](/tr/cli)
- [Model seçimi](/tr/concepts/model-providers)
- [Model yedeklemeye geçişi](/tr/concepts/model-failover)
