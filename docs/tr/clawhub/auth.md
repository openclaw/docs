---
read_when:
    - ClawHub'da oturum açma
    - ClawHub CLI'yi kullanma
    - 401 Hatalarında Hata Ayıklama
summary: ClawHub oturum açma, API belirteçleri, CLI girişi, belirteç depolama ve iptal etme.
x-i18n:
    generated_at: "2026-07-12T12:06:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Kimlik Doğrulama

ClawHub, web üzerinden oturum açmak için GitHub'ı kullanır. CLI, oturum açılmış bu hesap üzerinden oluşturulan ClawHub API belirteçlerini kullanır.

## Web üzerinden oturum açma

[clawhub.ai](https://clawhub.ai) adresinde GitHub ile oturum açın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar normal ClawHub oturum açma işlemini tamamlayamaz. Oturum açma işlemi sizi tekrar oturumun kapalı olduğu duruma döndürürse hesabınızın durumu uygun olmayabilir. Hesabınız yasaklandıysa veya devre dışı bırakıldıysa ve bunun bir hata olduğunu düşünüyorsanız [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

## CLI ile oturum açma

Varsayılan CLI oturum açma akışı tarayıcınızı açar:

```bash
clawhub login
clawhub whoami
```

Gerçekleşen işlemler:

1. CLI, `127.0.0.1` üzerinde geçici bir geri çağırma sunucusu başlatır.
2. Tarayıcınız ClawHub oturum açma sayfasını açar.
3. GitHub ile oturum açıldıktan sonra ClawHub bir API belirteci oluşturur.
4. Tarayıcı, yerel geri çağırma adresine yönlendirilir.
5. CLI, belirteci ClawHub yapılandırma dosyanızda saklar.

Tarayıcınız güvenlik duvarı, VPN veya proxy kuralları nedeniyle yerel geri çağırma adresine erişemiyorsa başsız belirteç akışını kullanın.

## Başsız oturum açma

ClawHub web arayüzünde bir belirteç oluşturun, ardından bunu CLI'ya iletin:

```bash
clawhub login --token clh_...
```

Bu akışı sunucular, CI işleri veya yalnızca terminal kullanılan ortamlar için kullanın.

Tarayıcıyı başka bir yerde açabildiğiniz uzak kabuklarda şunu çalıştırın:

```bash
clawhub login --device
```

CLI tek kullanımlık bir kod yazdırır ve `https://clawhub.ai/cli/device` adresinde yetkilendirme işlemini tamamlamanızı bekler.

## Belirteç depolama

Varsayılan yapılandırma yolları:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Yolu şu şekilde geçersiz kılın:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

CI kurulumu için saklanan belirteci şu komutla yazdırın:

```bash
clawhub token
```

## İptal etme

API belirteçlerini ClawHub web arayüzünden iptal edebilirsiniz.

İptal edilmiş, geçersiz veya eksik belirteçler `401 Unauthorized` yanıtı döndürür. `clawhub login` ile yeniden oturum açın veya `clawhub login --token` ile yeni bir belirteç sağlayın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar mevcut API belirteçlerini kullanmaya devam edemez. Hesabınız yasaklandıysa veya devre dışı bırakıldıysa ve bunun bir hata olduğunu düşünüyorsanız [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.
