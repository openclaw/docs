---
read_when:
    - Varsayılan modelleri değiştirmek veya sağlayıcı kimlik doğrulama durumunu görüntülemek istiyorsunuz
    - Kullanılabilir modelleri/sağlayıcıları taramak ve kimlik doğrulama profillerindeki sorunları ayıklamak istiyorsunuz
summary: '`openclaw models` için CLI başvurusu (durum/listeleme/ayarlama/tarama, diğer adlar, geri dönüşler, kimlik doğrulama)'
title: Modeller
x-i18n:
    generated_at: "2026-07-16T17:00:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Model keşfi, tarama ve yapılandırma (varsayılan model, geri dönüşler, kimlik doğrulama profilleri).

İlgili:

- Sağlayıcılar + modeller: [Modeller](/tr/providers/models)
- Model seçimi kavramları + `/models` eğik çizgi komutu: [Model kavramı](/tr/concepts/models)
- Sağlayıcı kimlik doğrulama kurulumu: [Başlarken](/tr/start/getting-started)

## Yaygın komutlar

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

`status` ve `auth` alt komutları, yapılandırılmış bir agent'ı hedeflemek için `--agent <id>` kabul eder; `list`, `scan`, `aliases` ve `fallbacks`/`image-fallbacks` her zaman yapılandırılmış varsayılan agent'ı kullanır, `set`/`set-image` ise `--agent` seçeneğini doğrudan reddeder. Belirtilmediğinde, `--agent` destekli komutlar ayarlanmışsa `OPENCLAW_AGENT_DIR` değerini, aksi takdirde yapılandırılmış varsayılan agent'ı kullanır.

### Durum

`openclaw models status`, çözümlenmiş varsayılanı/geri dönüşleri ve kimlik doğrulamaya genel bakışı gösterir. Sağlayıcı kullanım anlık görüntüleri mevcut olduğunda OAuth/API anahtarı durumu bölümü, sağlayıcı kullanım aralıklarını ve kota anlık görüntülerini içerir. Güncel kullanım aralığı sağlayıcıları: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi ve z.ai. Kullanım kimlik doğrulaması, mevcut olduğunda sağlayıcıya özgü kancalardan alınır; aksi takdirde OpenClaw, kimlik doğrulama profilleri, ortam veya yapılandırmadaki eşleşen OAuth/API anahtarı kimlik bilgilerine geri döner.

`--json` çıktısında `auth.providers`, ortam/yapılandırma/depo bilgilerini dikkate alan sağlayıcı genel görünümüdür; `auth.oauth` ise yalnızca kimlik doğrulama deposu profil durumudur.

Seçenekler:

| Bayrak                      | Etki                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--json`                  | JSON çıktısı; stdout'un `jq` içine aktarılabilir kalması için kimlik doğrulama profili, sağlayıcı ve başlatma tanılamaları stderr'e gider. |
| `--plain`                 | Düz metin çıktısı.                                                                                            |
| `--check`                 | Kimlik doğrulamanın süresi dolmak üzereyse/dolmuşsa sıfırdan farklı bir kodla çıkar: `1` = süresi dolmuş/eksik, `2` = süresi dolmak üzere.                             |
| `--probe`                 | Yapılandırılmış kimlik doğrulama profillerinin canlı yoklaması. Gerçek istekler gönderir; token tüketebilir ve hız sınırlarını tetikleyebilir.            |
| `--probe-provider <name>` | Yalnızca bir sağlayıcıyı yoklar.                                                                                      |
| `--probe-profile <id>`    | Belirli kimlik doğrulama profili kimliklerini yoklar (yinelenebilir veya virgülle ayrılmış).                                                  |
| `--probe-timeout <ms>`    | Yoklama başına zaman aşımı.                                                                                            |
| `--probe-concurrency <n>` | Eş zamanlı yoklamalar.                                                                                            |
| `--probe-max-tokens <n>`  | Yoklama için azami token sayısı (mümkün olan en iyi şekilde).                                                                               |
| `--agent <id>`            | Yapılandırılmış agent kimliği; `OPENCLAW_AGENT_DIR` değerini geçersiz kılar.                                                          |

Yoklama satırları kimlik doğrulama profillerinden, ortam kimlik bilgilerinden veya `models.json` kaynağından gelebilir. Yoklama durumu kategorileri: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Bir yoklama model çağrısına hiç ulaşmadığında beklenebilecek yoklama ayrıntı/neden kodları:

- `excluded_by_auth_order`: depolanmış bir profil vardır ancak açık `auth.order.<provider>` bunu atlamıştır; bu nedenle yoklama, denemek yerine hariç tutulduğunu bildirir.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: profil mevcuttur ancak uygun veya çözümlenebilir değildir.
- `ineligible_profile`: profil, başka bir nedenle sağlayıcı yapılandırmasıyla uyumsuzdur.
- `no_model`: sağlayıcı kimlik doğrulaması vardır ancak OpenClaw, bu sağlayıcı için yoklanabilir bir model adayı çözümleyememiştir.

OpenAI ChatGPT/Codex OAuth sorunlarını giderirken `openclaw models status`, `openclaw models auth list --provider openai` ve `openclaw config get agents.defaults.model --json`, bir agent'ın yerel Codex çalışma zamanı üzerinden `openai/*` için kullanılabilir bir `openai` OAuth profiline sahip olup olmadığını doğrulamanın en hızlı yoludur. Bkz. [OpenAI sağlayıcı kurulumu](/tr/providers/openai#check-and-recover-codex-oauth-routing).

### Liste

`openclaw models list` salt okunurdur: yapılandırmayı, kimlik doğrulama profillerini, mevcut katalog durumunu ve sağlayıcının sahip olduğu katalog satırlarını okur ancak `models.json` öğesini hiçbir zaman yeniden yazmaz.

Seçenekler: `--all` (tam katalog), `--local` (yerel modellerle sınırla), `--provider <id>`, `--json`, `--plain`.

Notlar:

- `Auth` sütunu salt okunurdur. OpenAI gibi sağlayıcının sahip olduğu model rotalarında, her satırın API/temel URL rotasını etkin `auth.order` içindeki uygun profillerle, ortam/yapılandırma kimlik bilgileriyle ve çözümlenmiş komut kapsamlı SecretRef'lerle eşleştirir. Somut bir OpenAI satırı, rota politikası kullanılamadığında sağlayıcı düzeyindeki kimlik doğrulamayı ödünç almak yerine bilinmeyen olarak kalır; yalnızca sağlayıcıya yönelik eski denetimler ve diğer sağlayıcılar, sağlayıcı düzeyindeki davranışı korur. Plugin sentetik kimlik doğrulama meta verileri yalnızca çalışma zamanı yeteneğine yönelik bir ipucudur, yerel hesap kimlik doğrulamasının kanıtı değildir; bu nedenle hesaba bağlı rotalar, olumlu kayıt defteri kanıtı olmadan bilinmeyen kalır. Komut; sağlayıcı çalışma zamanını yüklemez, anahtarlık sırlarını okumaz, sağlayıcı API'lerini çağırmaz veya kesin yürütme hazırlığını kanıtlamaz.
- `models list --all --provider <id>`, henüz ilgili sağlayıcıyla kimlik doğrulaması yapmamış olsanız bile Plugin manifestlerinden veya paketlenmiş sağlayıcı katalog meta verilerinden gelen, sağlayıcının sahip olduğu statik katalog satırlarını içerebilir. Eşleşen kimlik doğrulama yapılandırılana kadar bu satırlar kullanılamaz olarak gösterilmeye devam eder.
- `models list`, sağlayıcı katalog keşfi yavaşken denetim düzleminin yanıt vermeye devam etmesini sağlar. Varsayılan ve yapılandırılmış görünümler, kısa bir bekleyişin ardından yapılandırılmış veya sentetik model satırlarına geri döner ve keşfin arka planda tamamlanmasına izin verir. Kesin ve tam keşfedilmiş kataloğa ihtiyacınız olduğunda ve sağlayıcı keşfini beklemeye hazırsanız `--all` kullanın.
- Geniş `models list --all`, sağlayıcı çalışma zamanı ek kancalarını yüklemeden manifest katalog satırlarını kayıt defteri satırlarının üzerine birleştirir. Sağlayıcıya göre filtrelenmiş manifest hızlı yolları yalnızca `static` olarak işaretlenmiş sağlayıcıları kullanır; `refreshable` olarak işaretlenmiş sağlayıcılar kayıt defteri/önbellek destekli kalır ve manifest satırlarını ek olarak iliştirir, `runtime` olarak işaretlenenler ise kayıt defteri/çalışma zamanı keşfinde kalır.
- `models list`, yerel model meta verilerini ve çalışma zamanı sınırlarını ayrı tutar. Tablo çıktısında `Ctx`, etkin çalışma zamanı sınırı yerel bağlam penceresinden farklı olduğunda `contextTokens/contextWindow` gösterir; bir sağlayıcı bu sınırı sunduğunda JSON satırları `contextTokens` içerir.
- Sağlayıcının sahip olduğu rotalarda `models list`, bir mantıksal sağlayıcı/model satırını seçili rotaya yansıtır. `Input` ve `Ctx` yalnızca tam eşleşen fiziksel rota katalog satırından gelir ve açıkça yapılandırılmış mantıksal geçersiz kılmalar en son uygulanır; çözümlenmemiş rota seçimi, kardeş rota meta verilerini ödünç almak yerine bilinmeyen yetenek alanlarını gösterir.
- `models list --provider <id>`, `moonshot` veya `openai` gibi sağlayıcı kimliğine göre filtreler. Etkileşimli sağlayıcı seçicilerindeki `Moonshot AI` gibi görünen etiketleri kabul etmez.
- Model başvuruları **ilk** `/` üzerinden bölünerek ayrıştırılır. Model kimliği `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı belirtmezseniz OpenClaw, girdiyi önce bir diğer ad olarak, ardından tam model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesi olarak çözümler ve ancak bundan sonra kullanımdan kaldırma uyarısıyla yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, kaldırılmış sağlayıcıya ait geçerliliğini yitirmiş bir varsayılanı göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner.
- `models status`, kimlik doğrulama çıktısında sır olmayan yer tutucuları (örneğin `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) sır olarak maskelemek yerine `marker(<value>)` gösterebilir.

### Varsayılanı / görüntü modelini ayarlama

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set`, `agents.defaults.model.primary` değerini yazar; `set-image` ise `agents.defaults.imageModel.primary` değerini yazar. Her ikisi de `provider/model` veya yapılandırılmış bir diğer adı kabul eder. `set` ayrıca, yeni seçilen model gerektiriyorsa Codex/Copilot çalışma zamanı Plugin kurulumlarını onarır; `set-image` bunu yapmaz. İki komut da `--agent` kabul etmez; her zaman agent varsayılanlarını yazarlar.

### Tarama

`models scan`, OpenRouter'ın herkese açık `:free` kataloğunu okur ve geri dönüş kullanımı için adayları sıralar. Kataloğun kendisi herkese açık olduğundan yalnızca meta veri taramaları OpenRouter anahtarı gerektirmez.

OpenClaw varsayılan olarak araç ve görüntü desteğini canlı model çağrılarıyla yoklamayı dener. Yapılandırılmış bir OpenRouter anahtarı yoksa komut yalnızca meta veri çıktısına geri döner ve `:free` modellerinin yoklama ve çıkarım için yine de `OPENROUTER_API_KEY` gerektirdiğini açıklar.

Seçenekler:

- `--no-probe` (yalnızca meta veri; yapılandırma/sır araması yapılmaz)
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

`--set-default` ve `--set-image` canlı yoklamalar gerektirir; yalnızca meta veriye dayalı tarama sonuçları bilgilendirme amaçlıdır ve yapılandırmaya uygulanmaz.

## Diğer adlar

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Diğer adlar, model girdisi başına `agents.defaults.models.<key>.alias` olarak saklanır. `add`, `<model-or-alias>` değerini önce kurallı bir sağlayıcı/model anahtarına çözümler; bu nedenle bir diğer ada başka bir diğer ad vermek zincir oluşturmak yerine onu yeniden yönlendirir.

## Geri dönüşler

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

`agents.defaults.model.fallbacks` öğesini yönetir. `openclaw models image-fallbacks list|add|remove|clear`, paralel `agents.defaults.imageModel.fallbacks` listesini aynı alt komut yapısıyla yönetir.

## Kimlik doğrulama profilleri

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add`, etkileşimli kimlik doğrulama yardımcısıdır. Seçtiğiniz sağlayıcıya bağlı olarak bir sağlayıcı kimlik doğrulama akışı (OAuth/API anahtarı) başlatabilir veya manuel token yapıştırma işleminde size rehberlik edebilir.

`models auth list`, token, API anahtarı veya OAuth gizli verilerini yazdırmadan seçilen agent için kaydedilmiş kimlik doğrulama profillerini listeler. Tek bir sağlayıcıya, örneğin `openai` sağlayıcısına göre filtrelemek için `--provider <id>`, betiklerde kullanmak için ise `--json` kullanın.

`models auth login`, bir sağlayıcı plugin'inin kimlik doğrulama akışını (OAuth/API anahtarı) çalıştırır. Hangi sağlayıcıların yüklü olduğunu görmek için `openclaw plugins list` kullanın. `login`; oturum açma sırasında adlandırılmış profilleri destekleyen sağlayıcılar için `--profile-id <id>` seçeneğini (aynı sağlayıcıya ait birden fazla oturumu ayrı tutmak için kullanın), belirli bir kimlik doğrulama yöntemi seçmek için `--method <id>` seçeneğini, `--method device-code` kısayolu olarak `--device-code` seçeneğini, sağlayıcının önerdiği varsayılan modeli uygulamak için `--set-default` seçeneğini ve önce o sağlayıcıya ait mevcut profilleri kaldırmak için `--force` seçeneğini kabul eder (önbelleğe alınmış bir OAuth profili takılı kaldığında veya hesap değiştirmek istediğinizde kullanın).

`models auth login-github-copilot`, `models auth login --provider github-copilot --method device` (GitHub cihaz akışı) için bir kısayoldur; mevcut bir profilin üzerine istem göstermeden yazmak için `--yes` seçeneğini kabul eder.

Kimlik doğrulama sonuçlarını yapılandırılmış belirli bir agent deposuna yazmak için `openclaw models auth --agent <id> <subcommand>` kullanın. Üst `--agent` bayrağı; `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` ve `order get`/`set`/`clear` tarafından dikkate alınır.

OpenAI modellerinde `--provider openai`, varsayılan olarak ChatGPT/Codex hesabıyla oturum açar. Yalnızca, genellikle Codex abonelik sınırları için yedek olarak bir OpenAI API anahtarı profili eklemek istediğinizde `--method api-key` kullanın. Eski OpenAI Codex ön ekli kimlik doğrulama/profil durumunu `openai` biçimine taşımak için `openclaw doctor --fix` komutunu çalıştırın.

Örnekler:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Notlar:

- `paste-api-key`, başka bir yerde oluşturulmuş API anahtarlarını kabul eder, anahtar değerini ister ve `--profile-id` seçeneğini iletmediğiniz sürece bunu `<provider>:manual` varsayılan profil kimliğine yazar. Otomasyonda anahtarı standart girdiden aktarın; örneğin `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` ve `paste-token`, token kimlik doğrulama yöntemleri sunan sağlayıcılar için genel token komutları olarak kalır.
- `setup-token`, etkileşimli bir TTY gerektirir ve sağlayıcının token kimlik doğrulama yöntemini çalıştırır (sağlayıcı böyle bir yöntem sunuyorsa varsayılan olarak `setup-token` yöntemini kullanır).
- `paste-token`, `--provider` gerektirir, varsayılan olarak token değerini ister ve `--profile-id` seçeneğini iletmediğiniz sürece bunu `<provider>:manual` varsayılan profil kimliğine yazar. Otomasyonda, sağlayıcı kimlik bilgileri kabuk geçmişinde veya işlem listelerinde görünmesin diye token'ı bağımsız değişken olarak iletmek yerine standart girdiden aktarın.
- `paste-token --expires-in <duration>`, `365d` veya `12h` gibi göreli bir süreden mutlak token sona erme zamanını kaydeder.
- `openai` için OpenAI API anahtarları ile ChatGPT/OAuth token verileri farklı kimlik doğrulama biçimleridir. `sk-...` OpenAI API anahtarları için `paste-api-key`, yalnızca token kimlik doğrulama verileri için ise `paste-token` kullanın.
- Anthropic: `setup-token`/`paste-token`, `anthropic` için desteklenen OpenClaw kimlik doğrulama yollarıdır; ancak OpenClaw, kullanılabilir olduğunda ana makinedeki Claude CLI'ı (`claude -p`) yeniden kullanmayı tercih eder.
- `auth order get/set/clear`, tek bir sağlayıcı için agent başına kimlik doğrulama profili sırası geçersiz kılmasını yönetir; bu değer `auth-state.json` içinde saklanır (`auth.order.<provider>` yapılandırma anahtarından ayrıdır). `set`, öncelik sırasına göre bir veya daha fazla profil kimliği alır; `clear`, yapılandırma/döngüsel sıralamaya geri döner.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Model seçimi](/tr/concepts/model-providers)
- [Model yük devretmesi](/tr/concepts/model-failover)
