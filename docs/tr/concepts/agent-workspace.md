---
read_when:
    - Ajan çalışma alanını veya dosya düzenini açıklamanız gerekiyor
    - Bir ajan çalışma alanını yedeklemek veya taşımak istiyorsunuz
summary: 'Ajan çalışma alanı: konum, düzen ve yedekleme stratejisi'
title: Ajan çalışma alanı
x-i18n:
    generated_at: "2026-04-24T09:04:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: d6441991b5f9f71b13b2423d3c36b688a2d7d96386381e610a525aaccd55c9bf
    source_path: concepts/agent-workspace.md
    workflow: 15
---

Çalışma alanı ajanın evidir. Dosya araçları ve çalışma alanı bağlamı için kullanılan tek çalışma dizinidir.
Bunu gizli tutun ve bellek gibi değerlendirin.

Bu, yapılandırma, kimlik bilgileri ve
oturumları depolayan `~/.openclaw/` konumundan ayrıdır.

**Önemli:** çalışma alanı varsayılan **cwd**'dir, katı bir sandbox değildir. Araçlar
göreli yolları çalışma alanına göre çözer, ancak sandbox etkin değilse mutlak yollar
yine de ana bilgisayarda başka yerlere erişebilir. Yalıtım gerekiyorsa
[`agents.defaults.sandbox`](/tr/gateway/sandboxing) (ve/veya ajan başına sandbox yapılandırması)
kullanın.
Sandbox etkinse ve `workspaceAccess` `"rw"` değilse araçlar,
ana bilgisayar çalışma alanınız yerine `~/.openclaw/sandboxes` altındaki bir sandbox çalışma alanı
içinde çalışır.

## Varsayılan konum

- Varsayılan: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE` ayarlıysa ve `"default"` değilse, varsayılan
  `~/.openclaw/workspace-<profile>` olur.
- `~/.openclaw/openclaw.json` içinde geçersiz kılın:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` veya `openclaw setup`
çalışma alanını oluşturur ve eksikse başlangıç dosyalarını tohumlar.
Sandbox tohum kopyaları yalnızca çalışma alanı içindeki normal dosyaları kabul eder;
kaynak çalışma alanı dışına çözümlenen symlink/hardlink
takma adları yok sayılır.

Çalışma alanı dosyalarını zaten kendiniz yönetiyorsanız başlangıç
dosyası oluşturmayı devre dışı bırakabilirsiniz:

```json5
{ agent: { skipBootstrap: true } }
```

## Ek çalışma alanı klasörleri

Eski kurulumlar `~/openclaw` oluşturmuş olabilir. Birden fazla çalışma alanı
dizinini ortalıkta tutmak kafa karıştırıcı kimlik doğrulama veya durum kaymasına yol açabilir,
çünkü aynı anda yalnızca bir çalışma alanı etkindir.

**Öneri:** tek bir etkin çalışma alanı tutun. Ek klasörleri artık
kullanmıyorsanız arşivleyin veya Çöp Kutusu'na taşıyın (örneğin `trash ~/openclaw`).
Bilerek birden fazla çalışma alanı tutuyorsanız
`agents.defaults.workspace` değerinin etkin olanı işaret ettiğinden emin olun.

`openclaw doctor`, ek çalışma alanı dizinleri algıladığında uyarır.

## Çalışma alanı dosya haritası (her dosyanın anlamı)

Bunlar OpenClaw'ın çalışma alanı içinde beklediği standart dosyalardır:

- `AGENTS.md`
  - Ajan için işletim talimatları ve belleği nasıl kullanması gerektiği.
  - Her oturumun başında yüklenir.
  - Kurallar, öncelikler ve "nasıl davranmalı" ayrıntıları için iyi bir yerdir.

- `SOUL.md`
  - Persona, ton ve sınırlar.
  - Her oturumda yüklenir.
  - Rehber: [SOUL.md Kişilik Rehberi](/tr/concepts/soul)

- `USER.md`
  - Kullanıcının kim olduğu ve ona nasıl hitap edileceği.
  - Her oturumda yüklenir.

- `IDENTITY.md`
  - Ajanın adı, havası ve emojisi.
  - Başlangıç ritüeli sırasında oluşturulur/güncellenir.

- `TOOLS.md`
  - Yerel araçlarınız ve kurallarınız hakkında notlar.
  - Araç kullanılabilirliğini kontrol etmez; yalnızca yönlendirme sağlar.

- `HEARTBEAT.md`
  - Heartbeat çalıştırmaları için isteğe bağlı küçük kontrol listesi.
  - Belirteç tüketimini önlemek için kısa tutun.

- `BOOT.md`
  - Gateway yeniden başlatmasında otomatik çalıştırılan isteğe bağlı başlangıç kontrol listesi ([internal hooks](/tr/automation/hooks) etkin olduğunda).
  - Kısa tutun; giden gönderimler için message aracını kullanın.

- `BOOTSTRAP.md`
  - Tek seferlik ilk çalıştırma ritüeli.
  - Yalnızca yepyeni bir çalışma alanı için oluşturulur.
  - Ritüel tamamlandıktan sonra silin.

- `memory/YYYY-MM-DD.md`
  - Günlük bellek günlüğü (günde bir dosya).
  - Oturum başlangıcında bugün + dünü okumanız önerilir.

- `MEMORY.md` (isteğe bağlı)
  - Küratörlü uzun vadeli bellek.
  - Yalnızca ana, özel oturumda yükleyin (paylaşılan/grup bağlamlarında değil).

İş akışı ve otomatik bellek boşaltma için bkz. [Memory](/tr/concepts/memory).

- `skills/` (isteğe bağlı)
  - Çalışma alanına özgü Skills.
  - O çalışma alanı için en yüksek öncelikli skill konumu.
  - Ad çakıştığında proje ajan skills, kişisel ajan skills, yönetilen skills, paketlenmiş skills ve `skills.load.extraDirs` konumlarını geçersiz kılar.

- `canvas/` (isteğe bağlı)
  - Node ekranları için Canvas UI dosyaları (örneğin `canvas/index.html`).

Herhangi bir başlangıç dosyası eksikse OpenClaw, oturuma bir "eksik dosya"
işaretçisi ekler ve devam eder. Büyük başlangıç dosyaları eklenirken kırpılır;
sınırları `agents.defaults.bootstrapMaxChars` (varsayılan: 12000) ve
`agents.defaults.bootstrapTotalMaxChars` (varsayılan: 60000) ile ayarlayın.
`openclaw setup`, mevcut dosyaların üzerine yazmadan eksik varsayılanları yeniden oluşturabilir.

## Çalışma alanında OLMAYANLAR

Bunlar `~/.openclaw/` altında bulunur ve çalışma alanı deposuna commit edilmemelidir:

- `~/.openclaw/openclaw.json` (yapılandırma)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (model kimlik doğrulama profilleri: OAuth + API anahtarları)
- `~/.openclaw/credentials/` (kanal/sağlayıcı durumu ve eski OAuth içe aktarma verileri)
- `~/.openclaw/agents/<agentId>/sessions/` (oturum transkriptleri + meta veriler)
- `~/.openclaw/skills/` (yönetilen skills)

Oturumları veya yapılandırmayı taşımanız gerekiyorsa, bunları ayrı kopyalayın ve
sürüm kontrolü dışında tutun.

## Git yedekleme (önerilen, özel)

Çalışma alanını özel bellek gibi değerlendirin. Yedeklenebilir ve geri alınabilir olması için
onu **özel** bir git deposuna koyun.

Bu adımları Gateway'in çalıştığı makinede uygulayın (çalışma alanı orada bulunur).

### 1) Depoyu başlatın

Git yüklüyse yepyeni çalışma alanları otomatik olarak başlatılır. Bu
çalışma alanı zaten bir depo değilse şunu çalıştırın:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Özel bir uzak depo ekleyin (başlangıç dostu seçenekler)

Seçenek A: GitHub web UI

1. GitHub üzerinde yeni bir **özel** depo oluşturun.
2. README ile başlatmayın (birleştirme çakışmalarını önler).
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

Seçenek C: GitLab web UI

1. GitLab üzerinde yeni bir **özel** depo oluşturun.
2. README ile başlatmayın (birleştirme çakışmalarını önler).
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

Özel bir depoda bile gizli bilgileri çalışma alanında saklamaktan kaçının:

- API anahtarları, OAuth belirteçleri, parolalar veya özel kimlik bilgileri.
- `~/.openclaw/` altındaki hiçbir şey.
- Sohbetlerin ham dökümleri veya hassas ekler.

Hassas başvurular saklamanız gerekiyorsa yer tutucular kullanın ve gerçek
gizli bilgiyi başka yerde tutun (parola yöneticisi, ortam değişkenleri veya `~/.openclaw/`).

Önerilen başlangıç `.gitignore`:

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
3. Eksik dosyaları tohumlamak için `openclaw setup --workspace <path>` çalıştırın.
4. Oturumlara ihtiyacınız varsa eski makineden `~/.openclaw/agents/<agentId>/sessions/`
   dizinini ayrı olarak kopyalayın.

## Gelişmiş notlar

- Çok ajanlı yönlendirme ajan başına farklı çalışma alanları kullanabilir. Yönlendirme yapılandırması için
  [Kanal yönlendirme](/tr/channels/channel-routing) sayfasına bakın.
- `agents.defaults.sandbox` etkinse, ana olmayan oturumlar
  `agents.defaults.sandbox.workspaceRoot` altında oturum başına sandbox çalışma
  alanları kullanabilir.

## İlgili

- [Sürekli Talimatlar](/tr/automation/standing-orders) — çalışma alanı dosyalarındaki kalıcı talimatlar
- [Heartbeat](/tr/gateway/heartbeat) — HEARTBEAT.md çalışma alanı dosyası
- [Oturum](/tr/concepts/session) — oturum depolama yolları
- [Sandboxing](/tr/gateway/sandboxing) — sandbox ortamlarında çalışma alanı erişimi
