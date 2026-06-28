---
read_when:
    - OpenClaw'ı bir Raft çalışma alanına bağlamak istiyorsunuz
    - Bir Raft Harici Ajan yapılandırıyorsunuz
    - Raft uyandırma teslimatında hata ayıklıyorsunuz
sidebarTitle: Raft
summary: Raft CLI uyandırma köprüsü üzerinden Raft External Agent desteği
title: Raft
x-i18n:
    generated_at: "2026-06-28T00:15:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

Raft desteği, bir OpenClaw aracısını yerel Raft CLI üzerinden bir Raft Harici Aracısına bağlar. Raft, Gateway'e kimliği doğrulanmış uyandırma ipuçları gönderir. Ardından aracı, iletileri denetlemek ve göndermek için Raft CLI kullanır.

## Kurulum

Raft resmi bir harici plugin'dir. Gateway ana makinesine kurun:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Ayrıntılar: [Pluginler](/tr/tools/plugin)

## Ön Koşullar

- Harici Aracısı olan bir Raft çalışma alanı.
- OpenClaw Gateway ile aynı ana makineye kurulmuş Raft CLI.
- Zaten oturum açmış ve o Harici Aracıyla ilişkilendirilmiş bir Raft CLI profili.

Plugin, Raft kimlik bilgilerini saklamaz. Raft CLI, bu kimlik doğrulamayı kendi profilinde tutar.

## Yapılandırma

Profili yapılandırmada ayarlayın:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

Varsayılan hesap için bunun yerine Gateway ortamında `RAFT_PROFILE` ayarlayabilirsiniz:

```bash
RAFT_PROFILE=openclaw
```

Bir Gateway birden fazla Raft Harici Aracısına bağlandığında adlandırılmış bir hesap kullanın:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

Etkileşimli kurulum akışı aynı profili kaydeder:

```bash
openclaw channels setup raft
```

## Nasıl Çalışır

Gateway başlatıldığında plugin:

1. Geçici bir bağlantı noktası üzerinde yalnızca loopback HTTP uyandırma uç noktası açar.
2. Bu uç nokta ve süreç başına bir belirteçle `raft --profile <profile> agent bridge` başlatır.
3. Yerel köprüden gelen yeniden oynatma kimliğine sahip, yalnızca kimliği doğrulanmış ve içeriksiz uyandırma ipuçlarını kabul eder.
4. `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id` veya `id` alanlarından birini gerektirir.
5. Gateway yeniden başlatmaları dahil, yakın zamanda yeniden denenmiş uyandırma teslimlerini köprü olay kimliğine göre tekilleştirir.
6. Geçerli köprü için kararlı bir çalışma zamanı oturumu ve Raft CLI protokolü için boş bir etkinlik boşaltma grubu döndürür.
7. Kabul edilen her uyandırma için serileştirilmiş bir OpenClaw aracı turu başlatır.

Köprü, Raft teslim yeniden denemelerini ve yeniden bağlanmaları yönetir. OpenClaw turu, kopyalanmış bir Raft ileti gövdesi değil, yalnızca bir uyandırma bildirimi alır. Bekleyen iletileri okumak ve yanıtını göndermek için CLI kullanır:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft normal bir anlık ileti taşıması değildir. OpenClaw, modelin son metnini köprü üzerinden otomatik olarak geri göndermez; bu nedenle aracı, bir uyandırmayı işledikten sonra Raft CLI kullanmalıdır.
</Note>

## Doğrulama

OpenClaw'ın CLI'yi bulabildiğini ve yapılandırılmış bir profili olduğunu denetleyin:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Ardından Raft Harici Aracısına bir ileti gönderin. Gateway günlüğü, Raft köprüsünün başlatıldığını ve ardından gelen bir uyandırmayı göstermelidir. Aracı, bekleyen iletilerini denetlemek için yapılandırılmış Raft profilini kullanmalıdır.

## Sorun Giderme

<AccordionGroup>
  <Accordion title="Raft CLI eksik">
    Raft CLI'yi Gateway ana makinesine kurun ve `raft` komutunu hizmetin `PATH` içinde kullanılabilir yapın. `raft --help` ile doğrulayın, ardından Gateway'i yeniden başlatın.
  </Accordion>
  <Accordion title="Köprü hemen çıkıyor">
    Yapılandırılmış profilin oturum açmış olduğunu ve amaçlanan Raft Harici Aracısına ait olduğunu doğrulayın. CLI tanılamasını görmek için `raft --profile <profile> agent bridge` komutunu doğrudan çalıştırın.
  </Accordion>
  <Accordion title="Bir uyandırma geliyor ancak Raft yanıtı gönderilmiyor">
    Aracı Raft CLI'yi çağırmadığında bu beklenen bir durumdur. Uyandırma köprüsü ileti gövdelerini veya otomatik son yanıtları taşımaz. Aracının araç ilkesini denetleyin ve `raft --profile <profile> message
    check` ile `message send` komutlarını çalıştırabildiğinden emin olun.
  </Accordion>
</AccordionGroup>

## Referanslar

- [Raft](https://raft.build/)
- [Raft belgeleri](https://docs.raft.build/welcome/)
- [Hermes Raft entegrasyonu](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
