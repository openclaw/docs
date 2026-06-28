---
read_when:
    - Yükseltilmiş mod varsayılanlarını, izin listelerini veya slash komutu davranışını ayarlama
    - Korumalı alana alınmış ajanların ana makineye nasıl erişebileceğini anlama
summary: 'Yükseltilmiş yürütme modu: komutları korumalı alanda çalışan bir ajandan korumalı alan dışında çalıştırın'
title: Yükseltilmiş mod
x-i18n:
    generated_at: "2026-05-06T09:33:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Bir ajan sandbox içinde çalıştığında, `exec` komutları sandbox ortamıyla
sınırlanır. **Yükseltilmiş mod**, ajanın bunun yerine sandbox dışına çıkıp
komutları sandbox dışında çalıştırmasına olanak tanır; yapılandırılabilir onay
kapılarıyla birlikte.

<Info>
  Yükseltilmiş mod yalnızca ajan **sandbox içinde** olduğunda davranışı değiştirir.
  Sandbox dışında çalışan ajanlarda, exec zaten ana makinede çalışır.
</Info>

## Yönergeler

Yükseltilmiş modu oturum başına eğik çizgi komutlarıyla denetleyin:

| Yönerge         | Ne yapar                                                               |
| --------------- | ---------------------------------------------------------------------- |
| `/elevated on`  | Yapılandırılmış ana makine yolunda sandbox dışında çalıştırır, onayları korur |
| `/elevated ask` | `on` ile aynı (takma ad)                                                |
| `/elevated full` | Yapılandırılmış ana makine yolunda sandbox dışında çalıştırır ve onayları atlar |
| `/elevated off` | Sandbox ile sınırlı yürütmeye geri döner                               |

Ayrıca `/elev on|off|ask|full` olarak da kullanılabilir.

Geçerli düzeyi görmek için argümansız `/elevated` gönderin.

## Nasıl çalışır?

<Steps>
  <Step title="Kullanılabilirliği denetle">
    Elevated yapılandırmada etkinleştirilmiş olmalı ve gönderen izin listesinde olmalıdır:

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

  <Step title="Düzeyi ayarla">
    Oturum varsayılanını ayarlamak için yalnızca yönerge içeren bir mesaj gönderin:

    ```
    /elevated full
    ```

    Veya satır içinde kullanın (yalnızca o mesaja uygulanır):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Komutlar sandbox dışında çalışır">
    Elevated etkinken, `exec` çağrıları sandbox dışına çıkar. Etkin ana makine
    varsayılan olarak `gateway` olur; yapılandırılmış/oturum exec hedefi
    `node` olduğunda ise `node` olur. `full` modunda exec onayları atlanır.
    `on`/`ask` modunda yapılandırılmış onay kuralları uygulanmaya devam eder.
  </Step>
</Steps>

## Çözümleme sırası

1. Mesajdaki **satır içi yönerge** (yalnızca o mesaja uygulanır)
2. **Oturum geçersiz kılması** (yalnızca yönerge içeren bir mesaj gönderilerek ayarlanır)
3. **Genel varsayılan** (yapılandırmada `agents.defaults.elevatedDefault`)

## Kullanılabilirlik ve izin listeleri

- **Genel kapı**: `tools.elevated.enabled` (`true` olmalıdır)
- **Gönderen izin listesi**: kanal başına listelerle `tools.elevated.allowFrom`
- **Ajan başına kapı**: `agents.list[].tools.elevated.enabled` (yalnızca daha fazla kısıtlayabilir)
- **Ajan başına izin listesi**: `agents.list[].tools.elevated.allowFrom` (gönderen hem genel hem ajan başına kuralla eşleşmelidir)
- **Discord geri dönüşü**: `tools.elevated.allowFrom.discord` atlanırsa, geri dönüş olarak `channels.discord.allowFrom` kullanılır
- **Tüm kapılar geçmelidir**; aksi takdirde elevated kullanılamaz kabul edilir

İzin listesi girdi biçimleri:

| Önek                    | Eşleştiği değer                 |
| ----------------------- | ------------------------------- |
| (yok)                   | Gönderen kimliği, E.164 veya From alanı |
| `name:`                 | Gönderen görünen adı            |
| `username:`             | Gönderen kullanıcı adı          |
| `tag:`                  | Gönderen etiketi                |
| `id:`, `from:`, `e164:` | Açık kimlik hedefleme           |

## Elevated neyi denetlemez?

- **Araç ilkesi**: `exec` araç ilkesi tarafından reddedilirse, elevated bunu geçersiz kılamaz.
- **Ana makine seçimi ilkesi**: elevated, `auto` değerini serbest bir ana makineler arası geçersiz kılmaya dönüştürmez. Yapılandırılmış/oturum exec hedef kurallarını kullanır ve yalnızca hedef zaten `node` olduğunda `node` seçer.
- **`/exec` öğesinden ayrıdır**: `/exec` yönergesi, yetkili gönderenler için oturum başına exec varsayılanlarını ayarlar ve yükseltilmiş mod gerektirmez.

<Note>
  Bash sohbet komutu (`!` öneki; `/bash` takma adı), kendi `tools.bash.enabled` bayrağına ek olarak `tools.elevated` etkin olmasını gerektiren ayrı bir kapıdır. Elevated devre dışı bırakıldığında `!` kabuk komutları da kilitlenir.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Exec aracı" href="/tr/tools/exec" icon="terminal">
    Ajandan kabuk komutu yürütme.
  </Card>
  <Card title="Exec onayları" href="/tr/tools/exec-approvals" icon="shield">
    `exec` için onay ve izin listesi sistemi.
  </Card>
  <Card title="Sandboxing" href="/tr/gateway/sandboxing" icon="box">
    Gateway düzeyinde sandbox yapılandırması.
  </Card>
  <Card title="Sandbox ve Araç İlkesi ve Elevated" href="/tr/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Bir araç çağrısı sırasında üç kapının nasıl birleştiği.
  </Card>
</CardGroup>
