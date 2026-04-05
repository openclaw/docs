---
read_when:
    - Ajan çalışma alanını veya dosya düzenini açıklamanız gerektiğinde
    - Bir ajan çalışma alanını yedeklemek veya taşımak istediğinizde
summary: 'Ajan çalışma alanı: konum, düzen ve yedekleme stratejisi'
title: Agent Workspace
x-i18n:
    generated_at: "2026-04-05T13:50:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3735633f1098c733415369f9836fdbbc0bf869636a24ed42e95e6784610d964a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Agent Workspace

Çalışma alanı, ajanın evidir. Dosya araçları ve çalışma alanı bağlamı için kullanılan tek çalışma dizinidir. Bunu gizli tutun ve bellek olarak değerlendirin.

Bu, yapılandırma, kimlik bilgileri ve oturumları saklayan `~/.openclaw/` dizininden ayrıdır.

**Önemli:** çalışma alanı **varsayılan cwd**'dir, katı bir sandbox değildir. Araçlar göreli yolları çalışma alanına göre çözümler, ancak sandbox etkin değilse mutlak yollar hâlâ ana makinedeki başka yerlere erişebilir. Yalıtım gerekiyorsa [`agents.defaults.sandbox`](/gateway/sandboxing) kullanın (ve/veya ajan başına sandbox yapılandırması kullanın).
Sandbox etkin olduğunda ve `workspaceAccess` `"rw"` olmadığında, araçlar ana makine çalışma alanınızda değil, `~/.openclaw/sandboxes` altındaki bir sandbox çalışma alanında çalışır.

## Varsayılan konum

- Varsayılan: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` ayarlanmışsa ve `"default"` değilse, varsayılan
  `~/.openclaw/workspace-<profile>` olur.
- `~/.openclaw/openclaw.json` içinde geçersiz kılın:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` veya `openclaw setup`, çalışma alanı yoksa onu oluşturur ve bootstrap dosyalarını başlatır.
Sandbox tohum kopyaları yalnızca çalışma alanı içindeki normal dosyaları kabul eder; kaynak çalışma alanının dışına çözümlenen symlink/hardlink takma adları yok sayılır.

Çalışma alanı dosyalarını zaten kendiniz yönetiyorsanız, bootstrap dosyası oluşturmayı devre dışı bırakabilirsiniz:

```json5
{ agent: { skipBootstrap: true } }
```

## Ek çalışma alanı klasörleri

Eski kurulumlar `~/openclaw` oluşturmuş olabilir. Birden fazla çalışma alanı dizinini etrafta tutmak, aynı anda yalnızca bir çalışma alanı etkin olduğu için kafa karıştırıcı kimlik doğrulama veya durum kaymalarına neden olabilir.

**Öneri:** tek bir etkin çalışma alanı kullanın. Ek klasörleri artık kullanmıyorsanız, arşivleyin veya Çöp'e taşıyın (örneğin `trash ~/openclaw`).
Birden fazla çalışma alanını bilinçli olarak tutuyorsanız,
`agents.defaults.workspace` ayarının etkin olanı işaret ettiğinden emin olun.

`openclaw doctor`, ek çalışma alanı dizinleri algıladığında uyarır.

## Çalışma alanı dosya haritası (her dosyanın anlamı)

Bunlar, OpenClaw'ın çalışma alanında beklediği standart dosyalardır:

- `AGENTS.md`
  - Ajan için çalışma talimatları ve belleği nasıl kullanması gerektiği.
  - Her oturumun başında yüklenir.
  - Kurallar, öncelikler ve "nasıl davranmalı" ayrıntıları için iyi bir yerdir.

- `SOUL.md`
  - Persona, ton ve sınırlar.
  - Her oturumda yüklenir.
  - Kılavuz: [SOUL.md Personality Guide](/concepts/soul)

- `USER.md`
  - Kullanıcının kim olduğu ve ona nasıl hitap edilmesi gerektiği.
  - Her oturumda yüklenir.

- `IDENTITY.md`
  - Ajanın adı, havası ve emojisi.
  - Bootstrap ritüeli sırasında oluşturulur/güncellenir.

- `TOOLS.md`
  - Yerel araçlarınız ve kurallarınız hakkında notlar.
  - Araç kullanılabilirliğini denetlemez; yalnızca rehberlik sağlar.

- `HEARTBEAT.md`
  - Heartbeat çalıştırmaları için isteğe bağlı küçük kontrol listesi.
  - Token tüketimini önlemek için kısa tutun.

- `BOOT.md`
  - İç hook'lar etkin olduğunda gateway yeniden başlatıldığında yürütülen isteğe bağlı başlangıç kontrol listesi.
  - Kısa tutun; giden gönderimler için message aracını kullanın.

- `BOOTSTRAP.md`
  - Tek seferlik ilk çalıştırma ritüeli.
  - Yalnızca yepyeni bir çalışma alanı için oluşturulur.
  - Ritüel tamamlandıktan sonra silin.

- `memory/YYYY-MM-DD.md`
  - Günlük bellek günlüğü (günde bir dosya).
  - Oturum başlangıcında bugünü + dünü okumanız önerilir.

- `MEMORY.md` (isteğe bağlı)
  - Düzenlenmiş uzun vadeli bellek.
  - Yalnızca ana, özel oturumda yüklenir (paylaşılan/grup bağlamlarında değil).

İş akışı ve otomatik bellek boşaltma için bkz. [Memory](/concepts/memory).

- `skills/` (isteğe bağlı)
  - Çalışma alanına özgü Skills.
  - Bu çalışma alanı için en yüksek öncelikli skill konumu.
  - Adlar çakıştığında proje ajan skills, kişisel ajan skills, yönetilen skills, paketlenmiş skills ve `skills.load.extraDirs` öğelerini geçersiz kılar.

- `canvas/` (isteğe bağlı)
  - Düğüm görünümleri için Canvas UI dosyaları (örneğin `canvas/index.html`).

Herhangi bir bootstrap dosyası eksikse, OpenClaw oturuma bir "eksik dosya" işaretçisi ekler ve devam eder. Büyük bootstrap dosyaları eklenirken kesilir; sınırları `agents.defaults.bootstrapMaxChars` (varsayılan: 20000) ve `agents.defaults.bootstrapTotalMaxChars` (varsayılan: 150000) ile ayarlayın.
`openclaw setup`, mevcut dosyaların üzerine yazmadan eksik varsayılanları yeniden oluşturabilir.

## Çalışma alanında OLMAYANLAR

Bunlar `~/.openclaw/` altında bulunur ve çalışma alanı deposuna commit edilmemelidir:

- `~/.openclaw/openclaw.json` (yapılandırma)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (model kimlik doğrulama profilleri: OAuth + API anahtarları)
- `~/.openclaw/credentials/` (kanal/sağlayıcı durumu ve eski OAuth içe aktarma verileri)
- `~/.openclaw/agents/<agentId>/sessions/` (oturum dökümleri + meta veriler)
- `~/.openclaw/skills/` (yönetilen Skills)

Oturumları veya yapılandırmayı taşımanız gerekiyorsa, bunları ayrı kopyalayın ve sürüm denetiminin dışında tutun.

## Git yedeği (önerilen, özel)

Çalışma alanını özel bellek olarak değerlendirin. Yedeklenebilir ve geri yüklenebilir olması için bunu **özel** bir git deposuna koyun.

Bu adımları Gateway'in çalıştığı makinede uygulayın (çalışma alanı orada bulunur).

### 1) Depoyu başlatın

Git yüklüyse, yepyeni çalışma alanları otomatik olarak başlatılır. Bu
çalışma alanı zaten bir depo değilse, şunu çalıştırın:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Özel bir uzak depo ekleyin (başlangıç dostu seçenekler)

Seçenek A: GitHub web arayüzü

1. GitHub'da yeni bir **özel** depo oluşturun.
2. README ile başlatmayın (merge çakışmalarını önler).
3. HTTPS uzak depo URL'sini kopyalayın.
4. Uzak depoyu ekleyin ve gönderin:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Seçenek B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Seçenek C: GitLab web arayüzü

1. GitLab'da yeni bir **özel** depo oluşturun.
2. README ile başlatmayın (merge çakışmalarını önler).
3. HTTPS uzak depo URL'sini kopyalayın.
4. Uzak depoyu ekleyin ve gönderin:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Sürekli güncellemeler

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Gizli bilgileri commit etmeyin

Özel bir depoda bile, gizli bilgileri çalışma alanında saklamaktan kaçının:

- API anahtarları, OAuth belirteçleri, parolalar veya özel kimlik bilgileri.
- `~/.openclaw/` altındaki herhangi bir şey.
- Sohbetlerin ham dökümleri veya hassas ekler.

Hassas referansları saklamanız gerekiyorsa, yer tutucular kullanın ve gerçek gizli bilgiyi başka yerde tutun (parola yöneticisi, ortam değişkenleri veya `~/.openclaw/`).

Önerilen başlangıç `.gitignore` dosyası:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Çalışma alanını yeni bir makineye taşıma

1. Depoyu istenen yola klonlayın (varsayılan `~/.openclaw/workspace`).
2. `~/.openclaw/openclaw.json` içinde `agents.defaults.workspace` değerini bu yola ayarlayın.
3. Eksik dosyaları başlatmak için `openclaw setup --workspace <path>` çalıştırın.
4. Oturumlara ihtiyacınız varsa, `~/.openclaw/agents/<agentId>/sessions/` dizinini eski makineden ayrıca kopyalayın.

## Gelişmiş notlar

- Çoklu ajan yönlendirmesi, ajan başına farklı çalışma alanları kullanabilir. Yönlendirme yapılandırması için bkz.
  [Channel routing](/tr/channels/channel-routing).
- `agents.defaults.sandbox` etkinse, ana olmayan oturumlar `agents.defaults.sandbox.workspaceRoot` altındaki oturum başına sandbox çalışma alanlarını kullanabilir.

## İlgili

- [Standing Orders](/tr/automation/standing-orders) — çalışma alanı dosyalarındaki kalıcı talimatlar
- [Heartbeat](/gateway/heartbeat) — HEARTBEAT.md çalışma alanı dosyası
- [Session](/concepts/session) — oturum depolama yolları
- [Sandboxing](/gateway/sandboxing) — sandbox ortamlarında çalışma alanı erişimi
