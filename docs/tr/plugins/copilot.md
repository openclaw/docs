---
read_when:
    - Bir ajan için GitHub Copilot SDK harness'ını kullanmak istiyorsunuz
    - '`copilot` çalışma zamanı için yapılandırma örneklerine ihtiyacınız var'
    - Bir ajanı abonelik Copilot’a (github / openclaw / copilot) bağlıyor ve bunun Copilot CLI üzerinden çalışmasını istiyorsunuz
summary: OpenClaw yerleşik ajan turlarını harici GitHub Copilot SDK test düzeneği üzerinden çalıştırın
title: Copilot SDK donanımı
x-i18n:
    generated_at: "2026-06-28T00:53:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e1a052cc21130b680f6af9ae32bc1dbaeaa15be5092939f0c236515a3233ab9b
    source_path: plugins/copilot.md
    workflow: 16
---

Harici `@openclaw/copilot` Plugin’i, OpenClaw’ın yerleşik PI çalıştırma altyapısı yerine GitHub Copilot CLI (`@github/copilot-sdk`) üzerinden gömülü abonelik Copilot agent turları çalıştırmasını sağlar.

Düşük seviyeli agent döngüsünün Copilot CLI oturumu tarafından sahiplenilmesini istediğinizde Copilot SDK çalıştırma altyapısını kullanın: yerel araç yürütme, yerel Compaction (`infiniteSessions`) ve `copilotHome` altında CLI tarafından yönetilen iş parçacığı durumu. OpenClaw yine de sohbet kanallarına, oturum dosyalarına, model seçimine, OpenClaw dinamik araçlarına (köprülenmiş), onaylara, medya teslimine, görünür transkript aynasına, `/btw` yan sorularına (depo içi PI geri dönüşü tarafından işlenir — bkz. [Yan sorular (`/btw`)](#side-questions-btw)) ve `openclaw doctor`’a sahip olur.

Daha geniş model/sağlayıcı/çalışma zamanı ayrımı için [Agent çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın.

## Gereksinimler

- `@openclaw/copilot` Plugin’i kurulu OpenClaw.
- Yapılandırmanız `plugins.allow` kullanıyorsa `copilot` değerini (Plugin tarafından bildirilen manifest kimliği) ekleyin. npm tarzı `@openclaw/copilot` paket adını kullanan kısıtlayıcı bir izin listesi, `agentRuntime.id: "copilot"` olsa bile Plugin’in engelli kalmasına ve çalışma zamanının yüklenmemesine neden olur.
- Copilot CLI’ı çalıştırabilecek bir GitHub Copilot aboneliği (veya başsız / Cron çalıştırmaları için bir `gitHubToken` env / auth-profile girdisi).
- Yazılabilir bir `copilotHome` dizini. OpenClaw bir agent dizini sağladığında çalıştırma altyapısı varsayılan olarak `<agentDir>/copilot` kullanır; aksi halde agent başına tam yalıtım için `~/.openclaw/agents/<agentId>/copilot` kullanır.

`openclaw doctor`, bildirimsel oturum durumu sahipliği ve gelecekteki uyumluluk geçişleri için Plugin [doctor sözleşmesini](#doctor) çalıştırır. Copilot CLI ortam yoklamalarını çalıştırmaz.

## Plugin kurulumu

Copilot çalışma zamanı harici bir Plugin’dir; bu yüzden çekirdek `openclaw` paketi `@github/copilot-sdk` bağımlılığını veya platforma özgü `@github/copilot-<platform>-<arch>` CLI ikilisini taşımaz. Birlikte yaklaşık 260 MB eklerler; bu nedenle yalnızca bu çalışma zamanını açıkça seçen agent’lar için kurun:

```bash
openclaw plugins install @openclaw/copilot
```

Sihirbaz, ilk kez bir `github-copilot/*` modeli seçtiğinizde **ve** yapılandırmanız modeli (veya sağlayıcısını) `agentRuntime: { id: "copilot" }` aracılığıyla Copilot agent çalışma zamanına dahil ettiğinde Plugin’i kurar (aşağıdaki [Hızlı başlangıç](#quickstart) bölümüne bakın). Bu açık seçim olmadan openclaw, yerleşik GitHub Copilot sağlayıcısını kullanır ve çalışma zamanı Plugin’ini hiçbir zaman kurmaz.

Çalışma zamanı SDK’yı şu sırayla çözer:

1. Kurulu `@openclaw/copilot` paketinden `import("@github/copilot-sdk")`.
2. Bilinen geri dönüş dizini `~/.openclaw/npm-runtime/copilot/` (eski isteğe bağlı kurulum hedefi).

Eksik SDK, `COPILOT_SDK_MISSING` koduyla tek bir hata ve yukarıdaki Plugin yeniden kurulum komutunu gösterir.

## Hızlı başlangıç

Bir modeli (veya bir sağlayıcıyı) çalıştırma altyapısına sabitleyin:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

İki yol da eşdeğerdir. Yalnızca o modelin çalıştırma altyapısı üzerinden yönlendirilmesi gerekiyorsa tek bir model girdisinde `agentRuntime.id` kullanın; o sağlayıcı altındaki her modelin bunu kullanması gerekiyorsa bir sağlayıcıda `agentRuntime.id` ayarlayın.

`github-copilot/auto` taşınabilir başlangıç noktasıdır. Adlandırılmış Copilot modelleri hesap ve kuruluş politikalarına bağlıdır; bu nedenle yalnızca kimliği doğrulanmış Copilot CLI’ın modeli sunduğunu doğruladıktan sonra birini sabitleyin.

## Desteklenen sağlayıcılar

Çalıştırma altyapısı, kanonik `github-copilot` sağlayıcısı için destek duyurur (`extensions/github-copilot` tarafından sahiplenilen aynı kimlik):

- `github-copilot`

Ayrıca, seçilen model boş olmayan bir `baseUrl` değerine ve şu API biçimlerinden birine sahip olduğunda özel `models.providers` girdilerini destekler:

- `openai-responses`
- `openai-completions`
- `ollama` (OpenAI uyumlu completions)
- `azure-openai-responses`
- `anthropic-messages`

`openai`, `anthropic`, `google` ve `ollama` gibi yerel sağlayıcı kimlikleri kendi yerel çalışma zamanlarının sahipliğinde kalır. Bir uç noktayı Copilot BYOK üzerinden yönlendirirken ayrı bir özel sağlayıcı kimliği kullanın.

Copilot BYOK uç noktaları genel ağ HTTPS URL’leri olmalıdır. Çalıştırma altyapısı Copilot SDK’ya her deneme için bir local loopback proxy URL’si verir, ardından sağlayıcı trafiğini OpenClaw’ın korumalı fetch yolu üzerinden iletir; böylece DNS sabitleme ve SSRF politikası OpenClaw’ın sahipliğinde kalır. Yerel Ollama, LM Studio veya LAN model sunucuları için yerel OpenClaw çalışma zamanını kullanın.

## BYOK

Copilot BYOK, SDK'nin oturum düzeyindeki özel sağlayıcı sözleşmesini kullanır. OpenClaw,
sağlayıcı aktarım mantığını çekirdeğe taşımadan çözümlenen model uç noktasını,
API anahtarını, bearer-token modunu, başlıkları, model kimliğini ve
bağlam/çıktı sınırlarını geçirir.

Örneğin:

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

BYOK oturumları, abonelik oturumlarından ve diğer uç noktalardan ya da kimlik
bilgisi parmak izlerinden ayrı anahtarlanır. Anahtarı, başlıkları, modeli veya
uç noktayı döndürmek, uyumsuz durumu sürdürmek yerine yeni bir Copilot SDK
oturumu oluşturur.

## Kimlik Doğrulama

`runCopilotAttempt` sırasında uygulanan ajan başına öncelik sırası:

1. Deneme girdisinde **açık `useLoggedInUser: true`**. Ajanın `copilotHome`
   altında çözümlenen Copilot CLI oturum açmış kullanıcısını kullanır.
2. Deneme girdisinde **açık `gitHubToken`** (`profileId` +
   `profileVersion` ile). Çağıranın auth-profile çözümlemesini atlamak
   istediği doğrudan CLI çağrıları ve testler için kullanışlıdır.
3. `EmbeddedRunAttemptParams` şeklinden **sözleşmeyle çözümlenen
   `resolvedApiKey` + `authProfileId`**. Bu, **üretimdeki ana yoldur**:
   çekirdek, harness'ı çağırmadan önce ajanın yapılandırılmış
   `github-copilot` auth profilini
   (`src/infra/provider-usage.auth.ts:resolveProviderAuths` üzerinden)
   çözümler ve harness iki alanı da doğrudan tüketir. Bu, env var'lar
   olmadan başsız / Cron / çok profilli kurulumlar için
   `github-copilot:<profile>` auth profilinin uçtan uca çalışmasını sağlar.
4. Auth profili yapılandırılmamış doğrudan CLI / dogfood çalıştırmaları için
   **env-var fallback**. Runtime, gönderilmiş `github-copilot` sağlayıcısını
   (`extensions/github-copilot/auth.ts`) ve belgelenmiş Copilot SDK kurulumunu
   yansıtarak aşağıdaki değişkenleri öncelik sırasına göre kontrol eder:
   1. `OPENCLAW_GITHUB_TOKEN` -- harness'a özgü geçersiz kılma; bunu,
      sistem genelindeki `gh` / Copilot CLI yapılandırmasını bozmadan
      OpenClaw harness'ı için bir token sabitlemek üzere ayarlayın.
   2. `COPILOT_GITHUB_TOKEN` -- standart Copilot SDK / CLI env var'ı.
   3. `GH_TOKEN` -- standart `gh` CLI env var'ı (mevcut
      `github-copilot` sağlayıcı önceliğiyle eşleşir).
   4. `GITHUB_TOKEN` -- genel GitHub token fallback'i.

   İlk boş olmayan değer kazanır; boş dizeler yok sayılır. Sentezlenen havuz
   profil kimliği `env:<NAME>` olur ve profileVersion, token'ın geri
   döndürülemez sha256 parmak izidir; bu nedenle env değerini döndürmek
   istemci havuzunu temiz biçimde geçersiz kılar.

5. Kullanılabilir token sinyali yoksa **varsayılan `useLoggedInUser`**.

Her ajan özel bir `copilotHome` alır; böylece Copilot CLI token'ları,
oturumları ve yapılandırması aynı makinedeki ajanlar arasında sızmaz.
Varsayılan değer, host harness'a bir ajan dizini verdiğinde `<agentDir>/copilot`
(aynı dizindeki OpenClaw `models.json` / `auth-profiles.json` dosyalarından
SDK durumunu yalıtır) ya da aksi halde
`~/.openclaw/agents/<agentId>/copilot` olur. Özel bir konuma ihtiyacınız
olduğunda (örneğin, geçiş için paylaşılan bir mount) deneme girdisinde
`copilotHome: <path>` ile geçersiz kılın.

Canlı harness testleri, doğrudan token gerektiğinde
`OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` kullanır. Paylaşılan canlı test kurulumu,
gerçek auth profillerini yalıtılmış test home'a yerleştirdikten sonra
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN` ve `GITHUB_TOKEN` değerlerini bilinçli olarak
temizler; bu nedenle `gh auth token` değerini özel canlı test değişkeni
üzerinden geçirmek, token'ı ilgisiz süitlere açmadan hatalı atlamaları önler.

## Yapılandırma yüzeyi

Harness, yapılandırmasını deneme başına girdiden
(`runCopilotAttempt({...})`) ve `extensions/copilot/src/` içindeki küçük bir
env varsayılanları kümesinden okur:

- `copilotHome` — ajan başına CLI durum dizini (varsayılanlar yukarıda belgelenmiştir).
- `model` — dize veya `{ provider, id, api?, baseUrl?, headers?, authHeader? }`.
  Atlandığında OpenClaw, ajanın normal model seçimini kullanır ve harness
  çözümlenen sağlayıcının desteklendiğini doğrular.
- `reasoningEffort` — `"low" | "medium" | "high" | "xhigh"`. OpenClaw'ın
  `auto-reply/thinking.ts` içindeki `ThinkLevel` / `ReasoningLevel`
  çözümlemesinden eşlenir.
- `infiniteSessionConfig` — `harness.compact` tarafından yönlendirilen SDK
  `infiniteSessions` bloğu için isteğe bağlı geçersiz kılma. Varsayılanları
  olduğu gibi bırakmak güvenlidir.
- `hooksConfig` — tool/MCP, kullanıcı istemi, oturum ve hata callback'leri için
  isteğe bağlı yerel Copilot SDK `SessionHooks` uyumluluk yapılandırması.
  OpenClaw'ın taşınabilir yaşam döngüsü hook'larından ayrıdır.
- `permissionPolicy` — yerleşik SDK tool türleri (`shell`, `write`, `read`,
  `url`, `mcp`, `memory`, `hook`) için kullanılan SDK'nin
  `onPermissionRequest` handler'ı için isteğe bağlı geçersiz kılma.
  Güvenlik ağı olarak varsayılanı `rejectAllPolicy` olur; pratikte SDK bu
  türlerin hiçbirini çağırmaz çünkü köprülenen her OpenClaw tool'u
  `overridesBuiltInTool: true` ve `skipPermission: true` ile kaydedilir;
  böylece tool çağrılarının %100'ü OpenClaw'ın sarmalanmış `execute()` akışı
  üzerinden geçer. Bkz. [İzinler ve ask_user](#permissions-and-ask_user).
- `enableSessionTelemetry` — isteğe bağlı SDK oturum telemetri bayrağı.

OpenClaw Plugin hook'ları Copilot'a özgü deneme yapılandırmasına ihtiyaç
duymaz. Harness, standart harness yardımcıları üzerinden `before_prompt_build`
(ve eski `before_agent_start` uyumluluk hook'u), `llm_input`, `llm_output` ve
`agent_end` çalıştırır. Başarılı SDK compaction işlemleri ayrıca
`before_compaction` ve `after_compaction` çalıştırır. Köprülenen OpenClaw
tool'ları `before_tool_call` çalıştırmaya ve `after_tool_call` bildirmeye
devam eder; `hooksConfig`, taşınabilir eşdeğeri olmayan yerel yalnızca SDK
callback'leri için kalır.

OpenClaw'ın geri kalanındaki hiçbir şeyin bu alanları bilmesi gerekmez. Diğer
Plugin'ler, kanallar ve çekirdek kod yalnızca standart
`AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` şeklini görür.

## Compaction

`harness.compact` çalıştığında Copilot SDK harness'ı:

1. Bekleyen işi sürdürmeden izlenen SDK oturumunu devam ettirir.
2. SDK'nin oturum kapsamlı geçmiş compaction RPC'sini çağırır.
3. Çalışma alanı altında uyumluluk işaretleyici dosyaları yazmadan SDK
   compaction sonucunu döndürür.

OpenClaw tarafındaki transkript yansıtması (aşağıya bakın), compaction sonrası
mesajları almaya devam eder; böylece kullanıcıya görünen sohbet geçmişi
tutarlı kalır.

## Transkript yansıtma

`runCopilotAttempt`, her turun yansıtılabilir mesajlarını
`extensions/copilot/src/dual-write-transcripts.ts` üzerinden OpenClaw denetim
transkriptine çift yazar. Yansıtma oturum başına kapsamdadır
(`copilot:${sessionId}`) ve mesaj başına bir kimlik
(`${role}:${sha256_16(role,content)}`) kullanır; böylece önceki tur
girdilerinin yeniden yayımları diskteki mevcut anahtarlarla çakışır ve
çoğaltılmaz.

Yansıtma, transkript yazma hatasının denemeyi başarısız kılamaması için iki
katmanlı hata sınırlamasıyla sarılır: dahili best-effort sarmalayıcı ve deneme
düzeyinde defense-in-depth `.catch(...)`. Hatalar günlüğe yazılır ancak
yüzeye çıkarılmaz.

## Yan sorular (`/btw`)

`/btw` bu harness üzerinde **yerel** değildir. `createCopilotAgentHarness()`
bilerek `harness.runSideQuestion` değerini tanımsız bırakır, böylece OpenClaw'ın `/btw`
dağıtıcısı (`src/agents/btw.ts`) her Codex dışı runtime için kullandığı aynı ağaç içi PI geri dönüş
yoluna düşer: yapılandırılmış model provider'ı
kısa bir yan soru prompt'u ile doğrudan çağrılır ve
`streamSimple` üzerinden geri stream edilir (CLI oturumu yok, ek pool slot'u yok).

Bu, Copilot CLI oturumlarını ajanın ana tur döngüsü için ayrılmış tutar ve
`/btw` davranışını diğer PI destekli runtime'larla aynı kılar. Contract
[`extensions/copilot/harness.test.ts`](https://github.com/openclaw/openclaw/blob/main/extensions/copilot/harness.test.ts)
içinde `describe("runSideQuestion")` altında doğrulanır.

## Doctor

`extensions/copilot/doctor-contract-api.ts`, `src/plugins/doctor-contract-registry.ts`
tarafından otomatik yüklenir. Şunları katkı olarak ekler:

- Boş bir `legacyConfigRules` (MVP'de kullanımdan kaldırılmış alan yok).
- No-op bir `normalizeCompatibilityConfig` (gelecekteki alan kaldırmalarının
  kararlı bir ağaç içi yuvası olsun diye tutulur).
- provider `github-copilot`; runtime `copilot`; CLI oturum anahtarı `copilot`; auth profile
  prefix'i `github-copilot:` üzerinde hak iddia eden bir `sessionRouteStateOwners` girdisi.

## Sınırlamalar

- Harness, `github-copilot` artı sahipsiz özel BYOK provider kimlikleri üzerinde hak iddia eder.
  Manifest'in sahip olduğu yerel provider kimlikleri, `agentRuntime.id` zorla `copilot` yapılsa bile
  sahibi olan runtime üzerinde kalır.
- Harness TUI sunmaz; PI'nın TUI'si etkilenmez ve
  eş surface'i olmayan runtime'lar için geri dönüş olmaya devam eder.
- Bir ajan `copilot` değerine geçtiğinde PI oturum durumu migrate edilmez.
  Seçim deneme başınadır; mevcut PI oturumları geçerli kalır.
- `ask_user`, Codex harness ile aynı OpenClaw prompt-and-reply yolunu kullanır.
  Copilot SDK kullanıcı girdisi istediğinde, OpenClaw aktif channel/TUI'ya
  engelleyici bir prompt gönderir ve sıradaki kullanıcı
  mesajı SDK isteğini çözer.

## İzinler ve ask_user

Köprülenmiş OpenClaw araçları için izin yaptırımı, SDK'nın `onPermissionRequest` callback'i üzerinden değil,
**araç sarmalayıcısının içinde** gerçekleşir. PI'nın kullandığı aynı
`wrapToolWithBeforeToolCallHook` (`src/agents/pi-tools.before-tool-call.ts`),
`createOpenClawCodingTools` tarafından her coding tool'a uygulanır: döngü algılama,
güvenilir Plugin politikaları, before-tool-call hook'ları ve gateway üzerinden
iki aşamalı Plugin onayları (`plugin.approval.request`) tamamen
yerel PI denemeleriyle aynı code path üzerinden çalışır.

Bu sarmalayıcının kararı sahiplenebilmesi için,
`convertOpenClawToolToSdkTool` tarafından döndürülen SDK Tool şu şekilde işaretlenir:

- `overridesBuiltInTool: true` — Copilot CLI'nın aynı adlı yerleşik
  aracının (edit, read, write, bash, …) yerini alır, böylece her araç
  çağrısı OpenClaw'a geri yönlenir.
- `skipPermission: true` — SDK'ya, aracı çağırmadan önce
  `onPermissionRequest({kind: "custom-tool"})` tetiklememesini söyler.
  Sarmalanmış `execute()`, daha zengin OpenClaw politika denetimini
  içeride gerçekleştirir; SDK düzeyindeki bir prompt ya OpenClaw'ın
  yaptırımını kısa devreye alırdı (allow-all yaparsak) ya da her araç çağrısını
  engellerdi (reject-all yaparsak) — ikisi de PI eşdeğerliğiyle uyuşmaz.

Ağaç içi codex harness aynı ayrımı kullanır: köprülenmiş OpenClaw araçları
sarmalanır (`extensions/codex/src/app-server/dynamic-tools.ts`) ve
codex-app-server'ın _kendi_ yerel onay türleri
(`item/commandExecution/requestApproval`,
`item/fileChange/requestApproval`,
`item/permissions/requestApproval`) `plugin.approval.request`
üzerinden yönlendirilir
(`extensions/codex/src/app-server/approval-bridge.ts`). Copilot SDK'daki
eşdeğeri — `onPermissionRequest`'e ulaşabilecek herhangi bir `custom-tool` dışı
tür için fail-closed `rejectAllPolicy` — aynı güvenlik ağıdır
ve pratikte tetiklenmez, çünkü `overridesBuiltInTool: true`
her yerleşik aracın yerini alır.

Sarmalanmış araç katmanının PI'ya eşdeğer politika kararları verebilmesi için,
harness tam PI attempt-tool context'ini `createOpenClawCodingTools`'a iletir — kimlik
(`senderIsOwner`, `memberRoleIds`, `ownerOnlyToolAllowlist`, …), channel/routing
(`groupId`, `currentChannelId`, `replyToMode`, message-tool toggle'ları),
auth (`authProfileStore`), çalıştırma kimliği
(`sandboxSessionKey`'den türetilen `sessionKey`/`runSessionKey`,
`runId`), model context'i (`modelApi`, `modelContextWindowTokens`,
`modelCompat`, `modelHasVision`) ve çalıştırma hook'ları (`onToolOutcome`,
`onYield`). Bu alanlar olmadan, yalnızca sahibin kullanabileceği allowlist'ler sessizce
deny-by-default gibi davranır, Plugin güven politikaları doğru scope'a çözümlenemez
ve `session_status: "current"` eski bir sandbox anahtarına çözümlenir.
Bridge builder `extensions/copilot/src/tool-bridge.ts` içindedir ve
`src/agents/pi-embedded-runner/run/attempt.ts:1029-1117` konumundaki PI
yetkili çağrısını yansıtır. `runAttempt` zaten paylaşılan
`resolveSandboxContext` seam'i üzerinden sandbox context'ini çözer,
SDK'ya etkin bir çalışma dizini geçirir ve `sandbox` ile subagent-spawn workspace'ini
tool bridge'e iletir. Bridge ayrıca SDK sınırında uygulayabildiği sınırlı araç oluşturma
kontrollerini de iletir: `includeCoreTools`, runtime tool allowlist'i ve
`toolConstructionPlan`.

Bridge, PI eşdeğerliği için
`openclaw/plugin-sdk/agent-harness-tool-runtime` içindeki paylaşılan harness tool-surface helper'ını da kullanır. Tool-search etkin olduğunda,
SDK her OpenClaw araç şeması yerine kompakt kontrol araçlarını ve gizli
bir katalog yürütücüsünü görür. Code mode etkin olduğunda, helper diğer agent harness'lerin
kullandığı aynı code-mode kontrol surface'ini ve katalog lifecycle'ını oluşturur.
Local-model yalın varsayılanları, runtime uyumlu şema filtreleme, dizin hydration'ı ve katalog
temizliği paylaşılan helper'da kalır; böylece Copilot ve Codex'e bitişik
harness'ler birbirinden sapmaz.

### Oturum düzeyinde GitHub token'ı

Copilot SDK contract'i, **client-level** GitHub
token'ını (`CopilotClientOptions.gitHubToken`, CLI sürecinin kendisini doğrulamak için kullanılır)
**session-level** token'dan
(`SessionConfig.gitHubToken`, o oturum için içerik dışlamasını,
model routing'ini ve kotayı belirler ve hem `createSession` hem de `resumeSession` üzerinde dikkate alınır)
ayırt eder. Harness auth'u bir kez `resolveCopilotAuth` üzerinden çözer
ve auth mode `gitHubToken` olduğunda her iki alanı da ayarlar (açık bir `auth.gitHubToken`
veya yapılandırılmış bir `github-copilot` auth profile'ından contract ile çözümlenmiş
`resolvedApiKey`). Çözümlenen mode `useLoggedInUser` olduğunda, session-level alan
atlanır; böylece SDK kimliği oturum açmış
kimlikten türetmeye devam eder.

`ask_user`, `SessionConfig.onUserInputRequest` kullanır. Bridge,
sabit seçenekli istekler için seçim indekslerini veya etiketlerini kabul eder,
SDK isteği izin verdiğinde serbest biçimli yanıtları kabul eder ve OpenClaw denemesi
iptal edildiğinde bekleyen bir isteği iptal eder.

## İlgili

- [Ajan runtime'ları](/tr/concepts/agent-runtimes)
- [Codex harness](/tr/plugins/codex-harness)
- [Agent harness Plugin'leri (SDK reference)](/tr/plugins/sdk-agent-harness)
