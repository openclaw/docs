---
read_when:
    - Varsayılan modelleri değiştirmek veya sağlayıcı kimlik doğrulama durumunu görüntülemek istiyorsunuz
    - Kullanılabilir modelleri/sağlayıcıları taramak ve kimlik doğrulama profillerinde hata ayıklamak istiyorsunuz
summary: '`openclaw models` için CLI başvurusu (status/list/set/scan, takma adlar, geri dönüşler, kimlik doğrulama)'
title: Modeller
x-i18n:
    generated_at: "2026-05-07T13:14:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
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

`openclaw models status`, çözümlenen varsayılanı/yedekleri ve bir kimlik doğrulama özetini gösterir.
Sağlayıcı kullanım anlık görüntüleri kullanılabilir olduğunda, OAuth/API anahtarı durumu bölümü sağlayıcı kullanım pencerelerini ve kota anlık görüntülerini içerir.
Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi ve z.ai. Kullanım kimlik doğrulaması, mevcut olduğunda sağlayıcıya özgü hook'lardan gelir; aksi halde OpenClaw, kimlik doğrulama profillerinden, env'den veya yapılandırmadan eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.
`--json` çıktısında `auth.providers`, env/yapılandırma/depo farkında sağlayıcı özetidir; `auth.oauth` ise yalnızca kimlik doğrulama deposu profil sağlığıdır.
Yapılandırılmış her sağlayıcı profiline karşı canlı kimlik doğrulama probları çalıştırmak için `--probe` ekleyin.
Problar gerçek isteklerdir (token tüketebilir ve hız sınırlarını tetikleyebilir).
Yapılandırılmış bir ajanın model/kimlik doğrulama durumunu incelemek için `--agent <id>` kullanın. Atlandığında, komut ayarlanmışsa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` kullanır; aksi halde yapılandırılmış varsayılan ajanı kullanır.
Prob satırları kimlik doğrulama profillerinden, env kimlik bilgilerinden veya `models.json` dosyasından gelebilir.
Codex OAuth sorun giderme için `openclaw models status`, `openclaw models auth list --provider openai-codex` ve `openclaw config get agents.defaults.model --json`, bir ajanın yerel Codex runtime üzerinden `openai/*` için kullanılabilir bir `openai-codex` kimlik doğrulama profiline sahip olup olmadığını doğrulamanın en hızlı yoludur. Bkz. [OpenAI sağlayıcı kurulumu](/tr/providers/openai#check-and-recover-codex-oauth-routing).

Notlar:

- `models set <model-or-alias>`, `provider/model` veya bir takma ad kabul eder.
- `models list` salt okunurdur: yapılandırmayı, kimlik doğrulama profillerini, mevcut katalog durumunu ve sağlayıcıya ait katalog satırlarını okur, ancak `models.json` dosyasını yeniden yazmaz.
- `Auth` sütunu sağlayıcı düzeyindedir ve salt okunurdur. Yerel kimlik doğrulama profili meta verilerinden, env işaretçilerinden, yapılandırılmış sağlayıcı anahtarlarından, yerel sağlayıcı işaretçilerinden, AWS Bedrock env/profil işaretçilerinden ve Plugin sentetik kimlik doğrulama meta verilerinden hesaplanır; sağlayıcı runtime'ını yüklemez, anahtarlık sırlarını okumaz, sağlayıcı API'lerini çağırmaz veya model başına kesin yürütme hazırlığını kanıtlamaz.
- `models list --all --provider <id>`, henüz o sağlayıcıyla kimlik doğrulaması yapmamış olsanız bile Plugin manifestlerinden veya paketlenmiş sağlayıcı katalog meta verilerinden sağlayıcıya ait statik katalog satırlarını içerebilir. Bu satırlar, eşleşen kimlik doğrulaması yapılandırılana kadar yine de kullanılamaz olarak görünür.
- `models list`, sağlayıcı katalog keşfi yavaşken kontrol düzlemini yanıt verebilir tutar. Varsayılan ve yapılandırılmış görünümler kısa bir beklemenin ardından yapılandırılmış veya sentetik model satırlarına geri döner ve keşfin arka planda tamamlanmasına izin verir. Tam keşfedilmiş kataloğa kesin olarak ihtiyaç duyduğunuzda ve sağlayıcı keşfini beklemeyi kabul ettiğinizde `--all` kullanın.
- Geniş `models list --all`, sağlayıcı runtime ek hook'larını yüklemeden manifest katalog satırlarını registry satırlarının üzerine birleştirir. Sağlayıcıyla filtrelenmiş manifest hızlı yolları yalnızca `static` olarak işaretlenen sağlayıcıları kullanır; `refreshable` olarak işaretlenen sağlayıcılar registry/önbellek destekli kalır ve manifest satırlarını ekler olarak eklerken, `runtime` olarak işaretlenen sağlayıcılar registry/runtime keşfinde kalır.
- `models list`, yerel model meta verilerini ve runtime üst sınırlarını ayrı tutar. Tablo çıktısında `Ctx`, etkili bir runtime üst sınırı yerel bağlam penceresinden farklı olduğunda `contextTokens/contextWindow` gösterir; JSON satırları bir sağlayıcı bu üst sınırı açığa çıkardığında `contextTokens` içerir.
- `models list --provider <id>`, `moonshot` veya `openai-codex` gibi sağlayıcı kimliğine göre filtreler. Etkileşimli sağlayıcı seçicilerinden gelen `Moonshot AI` gibi görünen etiketleri kabul etmez.
- Model ref'leri **ilk** `/` karakterinden bölünerek ayrıştırılır. Model kimliği `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız, OpenClaw girdiyi önce bir takma ad olarak, sonra bu tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesi olarak çözer ve ancak bundan sonra bir kullanımdan kaldırma uyarısıyla yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eski kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models status`, kimlik doğrulama çıktısında gizli olmayan yer tutucular için (örneğin `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) bunları sır olarak maskelemek yerine `marker(<value>)` gösterebilir.

### Model tarama

`models scan`, OpenRouter'ın herkese açık `:free` kataloğunu okur ve adayları yedek kullanım için sıralar. Kataloğun kendisi herkese açık olduğundan, yalnızca meta veri taramaları bir OpenRouter anahtarı gerektirmez.

Varsayılan olarak OpenClaw, canlı model çağrılarıyla araç ve görüntü desteğini problamaya çalışır.
OpenRouter anahtarı yapılandırılmamışsa, komut yalnızca meta veri çıktısına geri döner ve `:free` modellerin problar ve çıkarım için yine de `OPENROUTER_API_KEY` gerektirdiğini açıklar.

Seçenekler:

- `--no-probe` (yalnızca meta veri; yapılandırma/sır araması yok)
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

`--set-default` ve `--set-image` canlı problar gerektirir; yalnızca meta veri tarama sonuçları bilgilendiricidir ve yapılandırmaya uygulanmaz.

### Model durumu

Seçenekler:

- `--json`
- `--plain`
- `--check` (çıkış 1=süresi dolmuş/eksik, 2=süresi dolmak üzere)
- `--probe` (yapılandırılmış kimlik doğrulama profillerinin canlı probu)
- `--probe-provider <name>` (tek sağlayıcıyı probla)
- `--probe-profile <id>` (tekrarlı veya virgülle ayrılmış profil kimlikleri)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (yapılandırılmış ajan kimliği; `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` değerlerini geçersiz kılar)

`--json`, stdout'u JSON yükü için ayrılmış tutar. Kimlik doğrulama profili, sağlayıcı ve başlangıç tanılamaları stderr'e yönlendirilir; böylece betikler stdout'u doğrudan `jq` gibi araçlara aktarabilir.

Prob durumu kovaları:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Beklenebilecek prob ayrıntı/neden kodu durumları:

- `excluded_by_auth_order`: depolanmış bir profil vardır, ancak açık `auth.order.<provider>` bunu atlamıştır; bu nedenle prob, denemek yerine dışlamayı bildirir.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: profil mevcuttur ancak uygun/çözülebilir değildir.
- `no_model`: sağlayıcı kimlik doğrulaması vardır, ancak OpenClaw bu sağlayıcı için problanabilir bir model adayı çözümleyememiştir.

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

`models auth add`, etkileşimli kimlik doğrulama yardımcısıdır. Seçtiğiniz sağlayıcıya bağlı olarak bir sağlayıcı kimlik doğrulama akışı (OAuth/API anahtarı) başlatabilir veya sizi elle token yapıştırmaya yönlendirebilir.

`models auth list`, seçili ajan için kaydedilmiş kimlik doğrulama profillerini token, API anahtarı veya OAuth gizli materyali yazdırmadan listeler. `openai-codex` gibi tek bir sağlayıcıya filtrelemek için `--provider <id>`, betikleme için `--json` kullanın.

`models auth login`, bir sağlayıcı Plugin'inin kimlik doğrulama akışını (OAuth/API anahtarı) çalıştırır. Hangi sağlayıcıların yüklü olduğunu görmek için `openclaw plugins list` kullanın.
Kimlik doğrulama sonuçlarını belirli bir yapılandırılmış ajan deposuna yazmak için `openclaw models auth --agent <id> <subcommand>` kullanın. Üst `--agent` bayrağı `add`, `list`, `login`, `setup-token`, `paste-token` ve `login-github-copilot` tarafından dikkate alınır.

Örnekler:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Notlar:

- `setup-token` ve `paste-token`, token kimlik doğrulama yöntemleri sunan sağlayıcılar için genel token komutları olarak kalır.
- `setup-token`, etkileşimli bir TTY gerektirir ve sağlayıcının token kimlik doğrulama yöntemini çalıştırır (sağlayıcı bir tane sunuyorsa varsayılan olarak o sağlayıcının `setup-token` yöntemi).
- `paste-token`, başka bir yerde veya otomasyondan üretilmiş bir token dizesini kabul eder.
- `paste-token`, `--provider` gerektirir, token değerini sorar ve `--profile-id` geçmediğiniz sürece bunu varsayılan profil kimliği `<provider>:manual` içine yazar.
- `paste-token --expires-in <duration>`, `365d` veya `12h` gibi göreli bir süreden mutlak token sona erme zamanını depolar.
- Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu yüzden Anthropic yeni bir politika yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını bu entegrasyon için onaylı kabul eder.
- Anthropic `setup-token` / `paste-token`, desteklenen bir OpenClaw token yolu olarak kullanılabilir kalır; ancak OpenClaw artık mevcut olduğunda Claude CLI yeniden kullanımını ve `claude -p` kullanımını tercih eder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Model seçimi](/tr/concepts/model-providers)
- [Model yük devretme](/tr/concepts/model-failover)
