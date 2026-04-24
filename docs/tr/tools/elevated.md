---
read_when:
    - Yükseltilmiş mod varsayılanlarını, izin listelerini veya slash komut davranışını ayarlama
    - Sandbox içindeki ajanların ana makineye nasıl erişebildiğini anlama
summary: 'Yükseltilmiş `exec` modu: sandbox içindeki bir ajandan komutları sandbox dışında çalıştırma'
title: Yükseltilmiş mod
x-i18n:
    generated_at: "2026-04-24T09:34:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 15
---

Bir ajan sandbox içinde çalıştığında, `exec` komutları
sandbox ortamıyla sınırlanır. **Yükseltilmiş mod**, ajanın bunun dışına çıkıp komutları
bunun yerine sandbox dışında çalıştırmasına olanak tanır; onay geçitleri yapılandırılabilir.

<Info>
  Yükseltilmiş mod yalnızca ajan **sandbox içindeyken** davranışı değiştirir. Sandbox içinde olmayan ajanlar için `exec` zaten ana makinede çalışır.
</Info>

## Direktifler

Yükseltilmiş modu slash komutlarıyla oturum başına denetleyin:

| Direktif        | Yaptığı şey                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | Yapılandırılmış ana makine yolunda sandbox dışında çalıştırır, onayları korur |
| `/elevated ask`  | `on` ile aynı (takma ad)                                                   |
| `/elevated full` | Yapılandırılmış ana makine yolunda sandbox dışında çalıştırır ve onayları atlar |
| `/elevated off`  | Sandbox ile sınırlı çalıştırmaya geri döner                                   |

`/elev on|off|ask|full` olarak da kullanılabilir.

Geçerli düzeyi görmek için bağımsız değişken olmadan `/elevated` gönderin.

## Nasıl çalışır

<Steps>
  <Step title="Kullanılabilirliği denetleyin">
    Yükseltilmiş mod yapılandırmada etkinleştirilmiş olmalı ve gönderen izin listesinde bulunmalıdır:

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

    Ya da satır içinde kullanın (yalnızca o mesaja uygulanır):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Komutlar sandbox dışında çalışır">
    Yükseltilmiş mod etkinken `exec` çağrıları sandbox dışına çıkar. Etkin ana makine
    varsayılan olarak `gateway`’dir veya yapılandırılmış/oturum `exec` hedefi
    `node` olduğunda `node` olur. `full` modunda `exec` onayları atlanır. `on`/`ask` modunda,
    yapılandırılmış onay kuralları uygulanmaya devam eder.
  </Step>
</Steps>

## Çözümleme sırası

1. Mesaj üzerindeki **satır içi direktif** (yalnızca o mesaja uygulanır)
2. **Oturum geçersiz kılması** (yalnızca direktif içeren mesaj gönderilerek ayarlanır)
3. **Genel varsayılan** (yapılandırmada `agents.defaults.elevatedDefault`)

## Kullanılabilirlik ve izin listeleri

- **Genel geçit**: `tools.elevated.enabled` (`true` olmalıdır)
- **Gönderen izin listesi**: kanal başına listeler içeren `tools.elevated.allowFrom`
- **Ajan başına geçit**: `agents.list[].tools.elevated.enabled` (yalnızca daha fazla kısıtlayabilir)
- **Ajan başına izin listesi**: `agents.list[].tools.elevated.allowFrom` (gönderen hem genel hem de ajan başına eşleşmelidir)
- **Discord geri dönüşü**: `tools.elevated.allowFrom.discord` atlanırsa, geri dönüş olarak `channels.discord.allowFrom` kullanılır
- **Tüm geçitler geçmelidir**; aksi hâlde yükseltilmiş mod kullanılamaz kabul edilir

İzin listesi giriş biçimleri:

| Önek                    | Eşleşen                         |
| ----------------------- | ------------------------------- |
| (yok)                   | Gönderen kimliği, E.164 veya From alanı |
| `name:`                 | Gönderen görünen adı             |
| `username:`             | Gönderen kullanıcı adı                 |
| `tag:`                  | Gönderen etiketi                      |
| `id:`, `from:`, `e164:` | Açık kimlik hedefleme     |

## Yükseltilmiş modun denetlemediği şeyler

- **Araç ilkesi**: `exec`, araç ilkesi tarafından reddedilmişse yükseltilmiş mod bunu geçersiz kılamaz
- **Ana makine seçimi ilkesi**: yükseltilmiş mod, `auto` değerini serbest bir çapraz ana makine geçersiz kılmasına dönüştürmez. Yapılandırılmış/oturum `exec` hedef kurallarını kullanır; yalnızca hedef zaten `node` ise `node` seçer.
- **`/exec`’ten ayrıdır**: `/exec` direktifi, yetkili gönderenler için oturum başına `exec` varsayılanlarını ayarlar ve yükseltilmiş modu gerektirmez

## İlgili

- [Exec aracı](/tr/tools/exec) — kabuk komutu yürütme
- [Exec onayları](/tr/tools/exec-approvals) — onay ve izin listesi sistemi
- [Sandboxing](/tr/gateway/sandboxing) — sandbox yapılandırması
- [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
