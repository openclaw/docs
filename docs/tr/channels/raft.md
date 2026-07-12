---
read_when:
    - OpenClaw'ı bir Raft çalışma alanına bağlamak istiyorsunuz
    - Bir Raft Harici Aracısı yapılandırıyorsunuz
    - Raft uyandırma iletiminde hata ayıklıyorsunuz
sidebarTitle: Raft
summary: Raft CLI uyandırma köprüsü üzerinden Raft Harici Aracı desteği
title: Sal Sal
x-i18n:
    generated_at: "2026-07-12T12:04:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft, yerel Raft CLI aracılığıyla bir OpenClaw ajanını Raft External Agent'a bağlar. Raft, Gateway'e kimliği doğrulanmış uyandırma bildirimleri gönderir; ajan ardından mesajları kontrol etmek ve göndermek için Raft CLI aracını kullanır. Yalnızca doğrudan sohbet desteklenir (gruplar desteklenmez).

## Kurulum

Raft, resmî bir harici Plugin'dir. Gateway ana makinesine kurun:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Ön koşullar

- External Agent içeren bir Raft çalışma alanı.
- Raft CLI'ın OpenClaw Gateway ile aynı ana makineye ve hizmetin `PATH` ortam değişkeninde bulunacak şekilde kurulmuş olması.
- Oturum açılmış ve ilgili External Agent ile ilişkilendirilmiş bir Raft CLI profili.

Plugin, Raft kimlik bilgilerini saklamaz; Raft CLI bu kimlik doğrulama bilgilerini kendi profilinde tutar.

## Yapılandırma

Yapılandırmada profili ayarlayın:

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

Varsayılan hesap için bunun yerine Gateway ortamında `RAFT_PROFILE` değişkenini ayarlayabilirsiniz:

```bash
RAFT_PROFILE=openclaw
```

Tek bir Gateway birden fazla Raft External Agent'a bağlandığında adlandırılmış hesaplar kullanın:

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

Etkileşimli kurulum aynı profili kaydeder:

```bash
openclaw channels add --channel raft
```

## Çalışma şekli

Gateway başlatıldığında Plugin:

1. Geçici bir bağlantı noktasında yalnızca local loopback üzerinden erişilebilen bir HTTP uyandırma uç noktası açar.
2. Bu uç nokta ve işleme özgü bir belirteçle `raft --profile <profile> agent bridge` komutunu başlatır.
3. Yerel köprüden gelen yalnızca kimliği doğrulanmış, içeriksiz ve yeniden oynatma kimliğine sahip uyandırma bildirimlerini kabul eder.
4. Her uyandırma yükünde `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id` veya `id` alanlarından birinin bulunmasını zorunlu kılar.
5. Yeniden denenen uyandırma teslimatlarını, Gateway yeniden başlatmaları da dâhil olmak üzere, köprü olay kimliğine göre 24 saat boyunca tekilleştirir.
6. Geçerli köprü için kararlı bir çalışma zamanı oturumu ve Raft CLI protokolü için boş bir etkinlik boşaltma grubu döndürür.
7. Kabul edilen her uyandırma için seri hâle getirilmiş bir OpenClaw ajan turu başlatır.

Raft teslimat yeniden denemelerinin ve yeniden bağlantıların yönetimi köprüye aittir. OpenClaw turu, kopyalanmış bir Raft mesaj gövdesi değil, yalnızca bir uyandırma bildirimi alır. Bekleyen mesajları okumak ve yanıtını göndermek için CLI'ı kullanır:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft, anlık ileti iletimi değildir. OpenClaw, modelin nihai metnini köprü üzerinden otomatik olarak geri göndermez; bu nedenle ajan, bir uyandırmayı işledikten sonra Raft CLI'ı kullanmalıdır.
</Note>

## Doğrulama

OpenClaw'ın CLI'ı bulabildiğini ve yapılandırılmış bir profile sahip olduğunu doğrulayın:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Ardından Raft External Agent'a bir mesaj gönderin. Gateway günlüğünde önce Raft köprüsünün başlatıldığı, ardından gelen bir uyandırmanın alındığı görülmelidir. Ajan, bekleyen mesajlarını kontrol etmek için yapılandırılmış Raft profilini kullanmalıdır.

## Sorun giderme

<AccordionGroup>
  <Accordion title="Raft CLI eksik">
    Raft CLI'ı Gateway ana makinesine kurun ve `raft` komutunu hizmetin `PATH`
    ortam değişkeninde kullanılabilir hâle getirin. `raft --help` ile doğrulayın,
    ardından Gateway'i yeniden başlatın.
  </Accordion>
  <Accordion title="Köprü hemen kapanıyor">
    Yapılandırılmış profilde oturum açıldığını ve profilin amaçlanan Raft
    External Agent'a ait olduğunu doğrulayın. CLI tanılama çıktısını görmek için
    doğrudan `raft --profile <profile> agent bridge` komutunu çalıştırın.
  </Accordion>
  <Accordion title="Bir uyandırma geliyor ancak Raft yanıtı gönderilmiyor">
    Ajan Raft CLI'ı çağırmadığında bu beklenen bir durumdur. Uyandırma köprüsü,
    mesaj gövdelerini veya otomatik nihai yanıtları taşımaz. Ajanın araç
    politikasını kontrol edin ve `raft --profile <profile> message check` ile
    `message send` komutlarını çalıştırabildiğinden emin olun.
  </Accordion>
</AccordionGroup>

## Kaynaklar

- [Raft](https://raft.build/)
- [Raft belgeleri](https://docs.raft.build/welcome/)
- [Hermes Raft entegrasyonu](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
