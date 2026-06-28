---
read_when:
    - Komut izinleri için auto, ask, allowlist, full veya deny seçme
    - Codex Guardian tarafından incelenmiş onayları tools.exec.mode üzerinden yapılandırma
    - OpenClaw exec onaylarını ACPX harness izinleriyle karşılaştırma
summary: Ana makine exec, Codex Guardian onayları ve ACPX harness oturumları için izin modları
title: İzin modları
x-i18n:
    generated_at: "2026-06-28T01:24:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

İzin modları, bir ajanın ana makine komutlarını çalıştırmadan, dosya yazmadan veya ek erişim için bir arka uç çalıştırma katmanına sormadan önce ne kadar yetkiye sahip olacağını belirler. OpenClaw'ın önce izin listelerini, ardından kaçırılanlar için Codex yerel otomatik incelemesini veya insan onayı rotasını kullanmasını istediğinizde `tools.exec.mode: "auto"` ile başlayın.

<Note>
  İzin modu `tools.exec.host=auto` değerinden ayrıdır. `tools.exec.host`
  bir komutun nerede çalışacağını seçer. `tools.exec.mode` ana makine exec işleminin
  nasıl onaylanacağını seçer.
</Note>

## Önerilen varsayılan

Her kaçırılanı insan istemine dönüştürmeden yararlı ana makine erişimine ihtiyaç duyan kodlama ajanları için `auto` kullanın:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Ardından etkin politikayı doğrulayın:

```bash
openclaw exec-policy show
```

`auto` modunda OpenClaw, deterministik izin listesi eşleşmelerini doğrudan çalıştırır. Onay kaçırmaları önce OpenClaw'ın yerel otomatik inceleyicisinden geçer, ardından gerektiğinde yapılandırılmış insan onayı rotasına geri döner.

## OpenClaw ana makine exec modları

`tools.exec.mode`, ana makine `exec` için normalleştirilmiş politika yüzeyidir.

| Mod         | Davranış                                      | Ne zaman kullanılır                                  |
| ----------- | --------------------------------------------- | ---------------------------------------------------- |
| `deny`      | Ana makine exec işlemini engelle.             | Hiçbir ana makine komutuna izin verilmez.            |
| `allowlist` | Yalnızca izin listesindeki komutları çalıştır. | Bilinen güvenli bir komut kümeniz vardır.            |
| `ask`       | İzin listesi eşleşmelerini çalıştır ve kaçırılanlarda sor. | Yeni komutları bir insan incelemelidir.              |
| `auto`      | İzin listesi eşleşmelerini çalıştır, sonra otomatik inceleme kullan. | Kodlama oturumları pratik korumalı erişime ihtiyaç duyar. |
| `full`      | Ana makine exec işlemini istemler olmadan çalıştır. | Bu güvenilen ana makine/oturum onay kapılarını atlamalıdır. |

Tam ana makine exec politikası, yerel onay dosyası, izin listesi şeması, güvenli ikili dosyalar ve yönlendirme davranışı için [Exec onayları](/tr/tools/exec-approvals) bölümüne bakın.

## Codex Guardian eşlemesi

Yerel Codex app-server oturumları için `tools.exec.mode: "auto"`, yerel Codex gereksinimleri izin verdiğinde Codex Guardian tarafından incelenen onaylara eşlenir. OpenClaw genellikle şunları gönderir:

| Codex alanı         | Tipik değer      |
| ------------------- | ---------------- |
| `approvalPolicy`    | `on-request`     |
| `approvalsReviewer` | `auto_review`    |
| `sandbox`           | `workspace-write` |

`auto` modunda OpenClaw, `approvalPolicy: "never"` veya `sandbox: "danger-full-access"` gibi eski güvenli olmayan Codex geçersiz kılmalarını korumaz. Onaysız duruşu bilinçli olarak istediğinizde yalnızca `tools.exec.mode: "full"` kullanın.

App-server kurulumu, kimlik doğrulama sırası ve yerel Codex çalışma zamanı ayrıntıları için [Codex çalıştırma katmanı](/tr/plugins/codex-harness) bölümüne bakın.

## ACPX çalıştırma katmanı izinleri

ACPX oturumları etkileşimsizdir, bu yüzden bir TTY izin istemine tıklayamazlar. ACPX, `plugins.entries.acpx.config` altında ayrı çalıştırma katmanı düzeyi ayarlar kullanır:

| Ayar                        | Yaygın değer    | Anlamı                                      |
| --------------------------- | --------------- | ------------------------------------------- |
| `permissionMode`            | `approve-reads` | Yalnızca okumaları otomatik onayla.         |
| `permissionMode`            | `approve-all`   | Yazmaları ve kabuk komutlarını otomatik onayla. |
| `permissionMode`            | `deny-all`      | Tüm izin istemlerini reddet.                |
| `nonInteractivePermissions` | `fail`          | Bir istem gerektiğinde işlemi durdur.       |
| `nonInteractivePermissions` | `deny`          | İstemi reddet ve mümkün olduğunda devam et. |

ACPX izinlerini OpenClaw exec onaylarından ayrı ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

`approve-all` değerini, istemsiz bir çalıştırma katmanı oturumunun ACPX acil durum eşdeğeri olarak kullanın. Kurulum ayrıntıları ve hata modları için [ACP ajanları kurulumu](/tr/tools/acp-agents-setup#permission-configuration) bölümüne bakın.

## Mod seçme

| Hedef                                         | Yapılandırma                                               |
| --------------------------------------------- | ---------------------------------------------------------- |
| Ana makine komutlarını tamamen engelle        | `tools.exec.mode: "deny"`                                  |
| Yalnızca bilinen güvenli komutların çalışmasına izin ver | `tools.exec.mode: "allowlist"`                             |
| Her yeni komut şekli için bir insana sor      | `tools.exec.mode: "ask"`                                   |
| İnsanlardan önce Codex/OpenClaw otomatik incelemesini kullan | `tools.exec.mode: "auto"`                                  |
| Ana makine exec onaylarını tamamen atla       | `tools.exec.mode: "full"` artı eşleşen ana makine onay dosyası |
| Etkileşimsiz ACPX oturumlarının yazma/exec yapmasını sağla | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Bir komut mod değiştirildikten sonra hâlâ istem gösteriyor veya başarısız oluyorsa iki katmanı da inceleyin:

```bash
openclaw approvals get
openclaw exec-policy show
```

Ana makine exec, OpenClaw yapılandırması ile ana makine yerel onay dosyasının daha sıkı sonucunu kullanır. ACPX çalıştırma katmanı izinleri ana makine exec onaylarını gevşetmez ve ana makine exec onayları ACPX çalıştırma katmanı istemlerini gevşetmez.

## İlgili

- [Exec onayları](/tr/tools/exec-approvals)
- [Exec onayları - gelişmiş](/tr/tools/exec-approvals-advanced)
- [Codex çalıştırma katmanı](/tr/plugins/codex-harness)
- [ACP ajanları kurulumu](/tr/tools/acp-agents-setup#permission-configuration)
