---
read_when:
    - Komut izinleri için auto, ask, allowlist, full veya deny seçeneklerinden birini belirleme
    - Codex Guardian tarafından incelenen onayları tools.exec.mode üzerinden yapılandırma
    - OpenClaw yürütme onaylarını ACPX harness izinleriyle karşılaştırma
summary: Ana makinede komut yürütme için izin modları, Codex Guardian onayları ve ACPX test düzeneği oturumları
title: İzin modları
x-i18n:
    generated_at: "2026-07-12T12:19:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

İzin modları, bir ajanın ana makine komutlarını çalıştırmadan, dosyalara yazmadan veya ek erişim için bir arka uç yürütme ortamından istekte bulunmadan önce ne kadar yetkiye sahip olduğunu belirler.

<Note>
  İzin modu, `tools.exec.host=auto` ayarından ayrıdır. `tools.exec.host`,
  bir komutun nerede çalıştırılacağını seçer. `tools.exec.mode` ise ana makinede
  çalıştırmanın nasıl onaylanacağını seçer.
</Note>

## Önerilen varsayılan

Her engelde kullanıcıya istem göstermeden kullanışlı ana makine erişimine ihtiyaç duyan kodlama ajanları için `auto` kullanın:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Ardından geçerli ilkeyi doğrulayın:

```bash
openclaw exec-policy show
```

## OpenClaw ana makine çalıştırma modları

`tools.exec.mode`, ana makine `exec` işlemi için normalleştirilmiş ilke yüzeyidir. Her mod, temel bir `security` (izin listesinin katılığı) ve `ask` (eşleşme olmadığında istem gösterme) çiftine karşılık gelir:

| Mod         | security / ask          | Davranış                                                                                                           | Kullanım durumu                                              |
| ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `deny`      | `deny` / `off`          | Ana makinede çalıştırmayı tamamen engeller.                                                                         | Ana makine komutlarına izin verilmediğinde.                  |
| `allowlist` | `allowlist` / `off`     | Yalnızca izin listesindeki komutları çalıştırır; eşleşmeyenleri sessizce reddeder.                                  | Güvenli olduğu bilinen bir komut kümeniz olduğunda.          |
| `ask`       | `allowlist` / `on-miss` | İzin listesiyle eşleşenleri çalıştırır; eşleşmeyenler için bir insana sorar.                                        | Her yeni komutun bir insan tarafından incelenmesi gerektiğinde. |
| `auto`      | `allowlist` / `on-miss` | İzin listesiyle eşleşenleri çalıştırır; eşleşmeyenleri insan onayına başvurmadan önce otomatik incelemeye gönderir. | Kodlama oturumları pratik ve korumalı erişim gerektirdiğinde. |
| `full`      | `full` / `off`          | Ana makinede istem göstermeden çalıştırır.                                                                           | Bu güvenilir ana makine/oturumun onay kapılarını atlaması gerektiğinde. |

`ask` ve `auto` aynı izin listesi/isteme ayarlarını paylaşır; `auto` ayrıca eşleşmeyenlere kendisi karar veren ve yalnızca güvenli biçimde onaylayamadığında yapılandırılmış insan onayı yoluna başvuran yerel otomatik inceleyiciyi etkinleştirir.

Ana makinede çalıştırma ilkesinin tamamı, yerel onaylar dosyası, izin listesi şeması, güvenli ikili dosyalar ve yönlendirme davranışı için [Çalıştırma onayları](/tr/tools/exec-approvals) bölümüne bakın.

## Codex Guardian eşlemesi

Yerel Codex uygulama sunucusu oturumlarında `tools.exec.mode: "auto"`, yerel Codex gereksinimleri izin verdiğinde Codex'i Guardian tarafından incelenen onaylara yönlendirir. Ortaya çıkan tipik değerler:

| Codex alanı         | Tipik değer       |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

`auto` modu, bu ilkeyi yapılandırılmış tüm Codex korumalı alan/onay geçersiz kılmalarının üzerinde zorunlu kılar; dolayısıyla `sandbox: "danger-full-access"` ile birlikte `approvalPolicy: "never"` gibi eski ve güvenli olmayan birleşimleri korumaz. `tools.exec.mode: "deny"` ve `"allowlist"`, Codex uygulama sunucusunun yerel yürütmesini tamamen engeller. `tools.exec.mode: "full"` ayarını yalnızca bilinçli olarak onaysız çalışma biçimini istediğinizde kullanın.

Uygulama sunucusu kurulumu, kimlik doğrulama sırası ve yerel Codex çalışma zamanı ayrıntıları için [Codex yürütme ortamı](/tr/plugins/codex-harness) bölümüne bakın.

## ACPX yürütme ortamı izinleri

ACPX oturumları etkileşimsizdir, bu nedenle bir TTY izin istemine tıklayamazlar. ACPX, `plugins.entries.acpx.config` altındaki ayrı yürütme ortamı düzeyi ayarlarını kullanır:

| Ayar                        | Değerler        | Anlamı                                              |
| --------------------------- | --------------- | --------------------------------------------------- |
| `permissionMode`            | `approve-reads` | Yalnızca okuma işlemlerini otomatik olarak onaylar. |
| `permissionMode`            | `approve-all`   | Yazma işlemlerini ve kabuk komutlarını otomatik olarak onaylar. |
| `permissionMode`            | `deny-all`      | Tüm izin istemlerini reddeder.                      |
| `nonInteractivePermissions` | `fail`          | İstem gerektiğinde işlemi iptal eder.               |
| `nonInteractivePermissions` | `deny`          | İstemi reddeder ve mümkün olduğunda devam eder.     |

ACPX izinlerini OpenClaw çalıştırma onaylarından ayrı olarak ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

`approve-all` ayarını, istem göstermeyen bir yürütme ortamı oturumunun ACPX için acil durum eşdeğeri olarak kullanın. Kurulum ayrıntıları ve hata modları için [ACP ajanları kurulumu](/tr/tools/acp-agents-setup#permission-configuration) bölümüne bakın.

## Mod seçme

| Amaç                                              | Yapılandırma                                               |
| ------------------------------------------------- | ---------------------------------------------------------- |
| Ana makine komutlarını tamamen engellemek         | `tools.exec.mode: "deny"`                                  |
| Yalnızca güvenli olduğu bilinen komutları çalıştırmak | `tools.exec.mode: "allowlist"`                         |
| Her yeni komut biçimi için bir insana sormak      | `tools.exec.mode: "ask"`                                   |
| İnsanlardan önce Codex/OpenClaw otomatik incelemesini kullanmak | `tools.exec.mode: "auto"`                       |
| Ana makinede çalıştırma onaylarını tamamen atlamak | `tools.exec.mode: "full"` ve eşleşen ana makine onayları dosyası |
| Etkileşimsiz ACPX oturumlarının yazmasını/çalıştırmasını sağlamak | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

Modu değiştirdikten sonra bir komut hâlâ istem gösteriyor veya başarısız oluyorsa her iki katmanı da inceleyin:

```bash
openclaw approvals get
openclaw exec-policy show
```

Ana makinede çalıştırma, OpenClaw yapılandırması ile ana makineye yerel onaylar dosyasından daha katı olan sonucu kullanır. ACPX yürütme ortamı izinleri ana makinede çalıştırma onaylarını gevşetmez; ana makinede çalıştırma onayları da ACPX yürütme ortamı istemlerini gevşetmez.

## İlgili konular

- [Çalıştırma onayları](/tr/tools/exec-approvals)
- [Çalıştırma onayları - gelişmiş](/tr/tools/exec-approvals-advanced)
- [Codex yürütme ortamı](/tr/plugins/codex-harness)
- [ACP ajanları kurulumu](/tr/tools/acp-agents-setup#permission-configuration)
