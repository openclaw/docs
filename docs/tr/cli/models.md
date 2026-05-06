---
read_when:
    - Varsayılan modelleri değiştirmek veya sağlayıcı kimlik doğrulama durumunu görüntülemek istiyorsunuz
    - Kullanılabilir modelleri/sağlayıcıları taramak ve kimlik doğrulama profillerinde hata ayıklamak istiyorsunuz
summary: '`openclaw models` için CLI başvurusu (status/list/set/scan, takma adlar, yedekler, kimlik doğrulama)'
title: Modeller
x-i18n:
    generated_at: "2026-05-06T09:05:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7a1cce7b1b21411540238b1858580a56b2271d54d0898e261b69bd21f88c0f5
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
Sağlayıcı kullanım anlık görüntüleri kullanılabilir olduğunda, OAuth/API anahtarı durum bölümü
sağlayıcı kullanım pencerelerini ve kota anlık görüntülerini içerir.
Geçerli kullanım penceresi sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi ve z.ai. Kullanım kimlik doğrulaması, kullanılabildiğinde sağlayıcıya özgü kancalardan gelir; aksi halde OpenClaw, kimlik doğrulama profilleri, env veya yapılandırmadan eşleşen OAuth/API anahtarı
kimlik bilgilerine geri döner.
`--json` çıktısında `auth.providers`, env/yapılandırma/depo farkındalığı olan sağlayıcı
genel görünümüdür; `auth.oauth` ise yalnızca kimlik doğrulama deposu profil sağlığıdır.
Yapılandırılmış her sağlayıcı profiline karşı canlı kimlik doğrulama yoklamaları çalıştırmak için `--probe` ekleyin.
Yoklamalar gerçek isteklerdir (token tüketebilir ve hız sınırlarını tetikleyebilir).
Yapılandırılmış bir ajanın model/kimlik doğrulama durumunu incelemek için `--agent <id>` kullanın. Atlandığında,
komut ayarlanmışsa `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` kullanır; aksi halde
yapılandırılmış varsayılan ajanı kullanır.
Yoklama satırları kimlik doğrulama profillerinden, env kimlik bilgilerinden veya `models.json` dosyasından gelebilir.

Notlar:

- `models set <model-or-alias>`, `provider/model` veya bir takma ad kabul eder.
- `models list` salt okunurdur: yapılandırmayı, kimlik doğrulama profillerini, mevcut katalog
  durumunu ve sağlayıcıya ait katalog satırlarını okur, ancak
  `models.json` dosyasını yeniden yazmaz.
- `Auth` sütunu sağlayıcı düzeyindedir ve salt okunurdur. Yerel
  kimlik doğrulama profili meta verilerinden, env işaretçilerinden, yapılandırılmış sağlayıcı anahtarlarından, yerel sağlayıcı
  işaretçilerinden, AWS Bedrock env/profil işaretçilerinden ve Plugin sentetik kimlik doğrulama meta verilerinden hesaplanır;
  sağlayıcı çalışma zamanını yüklemez, anahtarlık sırlarını okumaz, sağlayıcı
  API'lerini çağırmaz veya model başına kesin yürütme hazırlığını kanıtlamaz.
- `models list --all --provider <id>`, henüz o sağlayıcıyla kimlik doğrulaması yapmamış olsanız bile Plugin manifestlerinden veya paketlenmiş sağlayıcı katalog meta verilerinden sağlayıcıya ait statik katalog
  satırlarını içerebilir. Bu satırlar, eşleşen kimlik doğrulama yapılandırılana kadar yine de
  kullanılamaz olarak görünür.
- `models list`, sağlayıcı katalog keşfi yavaşken kontrol düzlemini yanıt verebilir tutar.
  Varsayılan ve yapılandırılmış görünümler, kısa bir beklemeden sonra yapılandırılmış veya
  sentetik model satırlarına geri döner ve keşfin arka planda bitmesine izin verir.
  Kesin tam keşfedilmiş kataloğa ihtiyacınız olduğunda ve sağlayıcı keşfini beklemeye
  razı olduğunuzda `--all` kullanın.
- Geniş `models list --all`, sağlayıcı çalışma zamanı tamamlayıcı kancalarını yüklemeden manifest katalog satırlarını kayıt satırlarının üzerine birleştirir.
  Sağlayıcıya göre filtrelenmiş manifest hızlı yolları yalnızca `static` olarak işaretlenmiş sağlayıcıları kullanır; `refreshable` olarak işaretlenmiş sağlayıcılar kayıt/önbellek destekli kalır ve manifest satırlarını tamamlayıcı olarak eklerken
  `runtime` olarak işaretlenmiş sağlayıcılar kayıt/çalışma zamanı keşfinde kalır.
- `models list`, yerel model meta verilerini ve çalışma zamanı sınırlarını ayrı tutar. Tablo
  çıktısında, etkili bir çalışma zamanı sınırı yerel bağlam penceresinden farklı olduğunda `Ctx`, `contextTokens/contextWindow` gösterir; JSON satırları bir sağlayıcı bu sınırı sunduğunda `contextTokens`
  içerir.
- `models list --provider <id>`, `moonshot` veya
  `openai-codex` gibi sağlayıcı kimliğine göre filtreler. Etkileşimli sağlayıcı
  seçicilerinden gelen `Moonshot AI` gibi görüntü etiketlerini kabul etmez.
- Model referansları **ilk** `/` üzerinden bölünerek ayrıştırılır. Model kimliği `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız OpenClaw girdiyi önce bir takma ad olarak, ardından
  o tam model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi olarak çözer ve ancak bundan sonra
  kullanımdan kaldırma uyarısıyla yapılandırılmış varsayılan sağlayıcıya geri döner.
  Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw,
  eski kaldırılmış sağlayıcı varsayılanını göstermenin yerine ilk yapılandırılmış sağlayıcıya/modele
  geri döner.
- `models status`, gizli olmayan yer tutucular için kimlik doğrulama çıktısında bunları sır olarak maskelemek yerine `marker(<value>)` gösterebilir (örneğin `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`).

### Model taraması

`models scan`, OpenRouter'ın herkese açık `:free` kataloğunu okur ve adayları
geri dönüş kullanımı için sıralar. Kataloğun kendisi herkese açıktır, bu nedenle yalnızca meta veri taramaları
OpenRouter anahtarı gerektirmez.

Varsayılan olarak OpenClaw, canlı model çağrılarıyla araç ve görüntü desteğini yoklamayı dener.
Hiçbir OpenRouter anahtarı yapılandırılmamışsa, komut yalnızca meta veri
çıktısına geri döner ve `:free` modellerin yoklamalar ve çıkarım için yine de `OPENROUTER_API_KEY`
gerektirdiğini açıklar.

Seçenekler:

- `--no-probe` (yalnızca meta veri; yapılandırma/sır araması yok)
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

`--set-default` ve `--set-image` canlı yoklamalar gerektirir; yalnızca meta veri taraması
sonuçları bilgilendiricidir ve yapılandırmaya uygulanmaz.

### Model durumu

Seçenekler:

- `--json`
- `--plain`
- `--check` (çıkış 1=süresi dolmuş/eksik, 2=süresi dolmak üzere)
- `--probe` (yapılandırılmış kimlik doğrulama profillerinin canlı yoklaması)
- `--probe-provider <name>` (tek sağlayıcıyı yokla)
- `--probe-profile <id>` (tekrarlanan veya virgülle ayrılmış profil kimlikleri)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (yapılandırılmış ajan kimliği; `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` değerlerini geçersiz kılar)

`--json`, stdout'u JSON yükü için ayrılmış tutar. Kimlik doğrulama profili, sağlayıcı
ve başlangıç tanılamaları stderr'e yönlendirilir; böylece betikler stdout'u doğrudan
`jq` gibi araçlara pipe edebilir.

Yoklama durum grupları:

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
  hariç tutmayı bildirir.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  profil vardır ancak uygun/çözümlenebilir değildir.
- `no_model`: sağlayıcı kimlik doğrulaması vardır, ancak OpenClaw o sağlayıcı için yoklanabilir
  bir model adayı çözememiştir.

## Takma adlar + geri dönüşler

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

`models auth add`, etkileşimli kimlik doğrulama yardımcısıdır. Seçtiğiniz
sağlayıcıya bağlı olarak bir sağlayıcı kimlik doğrulama akışı (OAuth/API anahtarı) başlatabilir
veya sizi elle token yapıştırmaya yönlendirebilir.

`models auth list`, seçili ajan için kaydedilmiş kimlik doğrulama profillerini
token, API anahtarı veya OAuth sır malzemesi yazdırmadan listeler. Tek sağlayıcıya filtrelemek için `--provider <id>` kullanın;
örneğin `openai-codex`, betikleme için de `--json` kullanın.

`models auth login`, bir sağlayıcı Plugin'inin kimlik doğrulama akışını (OAuth/API anahtarı) çalıştırır.
Hangi sağlayıcıların kurulu olduğunu görmek için `openclaw plugins list` kullanın.
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

- `setup-token` ve `paste-token`, token kimlik doğrulama yöntemleri sunan sağlayıcılar için
  genel token komutları olarak kalır.
- `setup-token` etkileşimli bir TTY gerektirir ve sağlayıcının token kimlik doğrulama
  yöntemini çalıştırır (sağlayıcı bir tane sunduğunda varsayılan olarak o sağlayıcının `setup-token` yöntemini kullanır).
- `paste-token`, başka bir yerde veya otomasyondan üretilmiş bir token dizesini kabul eder.
- `paste-token`, `--provider` gerektirir, token değerini ister ve
  `--profile-id` iletmediğiniz sürece onu varsayılan profil kimliği `<provider>:manual` içine yazar.
- `paste-token --expires-in <duration>`, `365d` veya `12h` gibi
  göreli bir süreden mutlak token sona erme zamanını depolar.
- Anthropic notu: Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle OpenClaw, Anthropic yeni bir ilke yayımlamadığı sürece bu entegrasyon için Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylı kabul eder.
- Anthropic `setup-token` / `paste-token`, desteklenen bir OpenClaw token yolu olarak kullanılabilir kalır, ancak OpenClaw artık kullanılabildiğinde Claude CLI yeniden kullanımını ve `claude -p` komutunu tercih eder.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Model seçimi](/tr/concepts/model-providers)
- [Model yük devretme](/tr/concepts/model-failover)
