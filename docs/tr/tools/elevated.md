---
read_when:
    - Yükseltilmiş mod varsayılanlarını, allowlist'leri veya slash komutu davranışını ayarlıyorsunuz
    - Sandbox içindeki aracıların ana makineye nasıl erişebildiğini anlamak istiyorsunuz
summary: 'Yükseltilmiş exec modu: sandbox içindeki bir aracıdan sandbox dışında komut çalıştırın'
title: Yükseltilmiş Mod
x-i18n:
    generated_at: "2026-04-05T14:10:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: f6f0ca0a7c03c94554a70fee775aa92085f15015850c3abaa2c1c46ced9d3c2e
    source_path: tools/elevated.md
    workflow: 15
---

# Yükseltilmiş Mod

Bir aracı sandbox içinde çalıştığında, `exec` komutları sandbox
ortamıyla sınırlıdır. **Yükseltilmiş mod**, aracıya bunun dışına çıkıp komutları
bunun yerine sandbox dışında çalıştırma olanağı verir; yapılandırılabilir onay geçitleriyle birlikte.

<Info>
  Yükseltilmiş mod yalnızca aracı **sandbox içinde** olduğunda davranışı değiştirir. Sandbox
  içinde olmayan aracılarda `exec` zaten ana makinede çalışır.
</Info>

## Direktifler

Yükseltilmiş modu slash komutlarıyla oturum başına denetleyin:

| Directive        | What it does                                                          |
| ---------------- | --------------------------------------------------------------------- |
| `/elevated on`   | Sandbox dışında yapılandırılmış ana makine yolunda çalıştırır, onayları korur |
| `/elevated ask`  | `on` ile aynıdır (takma ad)                                           |
| `/elevated full` | Sandbox dışında yapılandırılmış ana makine yolunda çalıştırır ve onayları atlar |
| `/elevated off`  | Sandbox ile sınırlı yürütmeye geri döner                              |

`/elev on|off|ask|full` olarak da kullanılabilir.

Geçerli düzeyi görmek için bağımsız değişken olmadan `/elevated` gönderin.

## Nasıl çalışır

<Steps>
  <Step title="Kullanılabilirliği denetleyin">
    Yükseltilmiş mod yapılandırmada etkinleştirilmiş olmalıdır ve gönderen allowlist'te bulunmalıdır:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Düzeyi ayarlayın">
    Oturum varsayılanını ayarlamak için yalnızca direktif içeren bir mesaj gönderin:

    ```
    /elevated full
    ```

    Veya satır içinde kullanın (yalnızca o mesaja uygulanır):

    ```
    /elevated on dağıtım betiğini çalıştır
    ```

  </Step>

  <Step title="Komutlar sandbox dışında çalışır">
    Yükseltilmiş mod etkin olduğunda `exec` çağrıları sandbox dışına çıkar. Etkin ana makine
    varsayılan olarak `gateway` olur veya yapılandırılmış/oturum `exec` hedefi
    `node` olduğunda `node` olur. `full` modunda exec onayları atlanır. `on`/`ask` modunda,
    yapılandırılmış onay kuralları geçerliliğini korur.
  </Step>
</Steps>

## Çözümleme sırası

1. Mesaj üzerindeki **satır içi direktif** (yalnızca o mesaja uygulanır)
2. **Oturum geçersiz kılması** (yalnızca direktif içeren bir mesaj gönderilerek ayarlanır)
3. **Genel varsayılan** (yapılandırmada `agents.defaults.elevatedDefault`)

## Kullanılabilirlik ve allowlist'ler

- **Genel geçit**: `tools.elevated.enabled` (`true` olmalıdır)
- **Gönderen allowlist'i**: kanal başına listelerle `tools.elevated.allowFrom`
- **Aracı başına geçit**: `agents.list[].tools.elevated.enabled` (yalnızca daha da kısıtlayabilir)
- **Aracı başına allowlist**: `agents.list[].tools.elevated.allowFrom` (gönderen hem genel hem aracı başına listeyle eşleşmelidir)
- **Discord geri dönüşü**: `tools.elevated.allowFrom.discord` atlanırsa, geri dönüş olarak `channels.discord.allowFrom` kullanılır
- **Tüm geçitler geçmelidir**; aksi takdirde yükseltilmiş mod kullanılamaz kabul edilir

Allowlist girdi biçimleri:

| Prefix                  | Matches                            |
| ----------------------- | ---------------------------------- |
| (yok)                   | Gönderen kimliği, E.164 veya From alanı |
| `name:`                 | Gönderen görünen adı               |
| `username:`             | Gönderen kullanıcı adı             |
| `tag:`                  | Gönderen etiketi                   |
| `id:`, `from:`, `e164:` | Açık kimlik hedefleme              |

## Yükseltilmiş modun denetlemediği şeyler

- **Araç ilkesi**: `exec`, araç ilkesi tarafından reddedilmişse yükseltilmiş mod bunu geçersiz kılamaz
- **Ana makine seçim ilkesi**: yükseltilmiş mod, `auto` değerini serbest bir ana makineler arası geçersiz kılmaya dönüştürmez. Yapılandırılmış/oturum `exec` hedefi kurallarını kullanır; yalnızca hedef zaten `node` ise `node` seçer.
- **`/exec` komutundan ayrıdır**: `/exec` direktifi, yetkili gönderenler için oturum başına `exec` varsayılanlarını ayarlar ve yükseltilmiş mod gerektirmez

## İlgili

- [Exec aracı](/tools/exec) — shell komutu yürütme
- [Exec onayları](/tools/exec-approvals) — onay ve allowlist sistemi
- [Sandboxing](/tr/gateway/sandboxing) — sandbox yapılandırması
- [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
