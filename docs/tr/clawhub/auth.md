---
read_when:
    - ClawHub'da oturum açma
    - ClawHub CLI'ını Kullanma
    - 401 Hatalarını Ayıklama
summary: ClawHub oturum açma, API belirteçleri, CLI oturum açma, belirteç depolama ve iptal.
x-i18n:
    generated_at: "2026-06-28T20:41:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Kimlik Doğrulama

ClawHub, web oturumu açma için GitHub kullanır. CLI, oturum açılmış
hesap üzerinden oluşturulan ClawHub API belirteçlerini kullanır.

## Web oturumu açma

[clawhub.ai](https://clawhub.ai) adresinde oturum açmak için GitHub kullanın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar normal ClawHub oturum açma işlemini
tamamlayamaz. Oturum açma sizi oturumun kapalı olduğu bir duruma geri döndürürse hesabınızın
durumu iyi olmayabilir. Hesabınız yasaklandıysa veya devre dışı bırakıldıysa, bunun bir
hata olduğunu düşünüyorsanız
[ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

## CLI oturumu açma

Varsayılan CLI oturum açma akışı tarayıcınızı açar:

```bash
clawhub login
clawhub whoami
```

Olanlar:

1. CLI, `127.0.0.1` üzerinde geçici bir callback sunucusu başlatır.
2. Tarayıcınız ClawHub oturum açma sayfasını açar.
3. GitHub oturum açma işleminden sonra ClawHub bir API belirteci oluşturur.
4. Tarayıcı yerel callback'e geri yönlendirilir.
5. CLI, belirteci ClawHub yapılandırma dosyanızda saklar.

Tarayıcınız güvenlik duvarı, VPN veya proxy kuralları nedeniyle yerel callback'e
ulaşamıyorsa headless belirteç akışını kullanın.

## Headless oturum açma

ClawHub web kullanıcı arayüzünde bir belirteç oluşturun, ardından bunu CLI'ye aktarın:

```bash
clawhub login --token clh_...
```

Bu akışı sunucular, CI işleri veya yalnızca terminal kullanılan ortamlar için kullanın.

Başka bir yerde tarayıcı açabildiğiniz uzak kabuklar için şunu çalıştırın:

```bash
clawhub login --device
```

CLI tek kullanımlık bir kod yazdırır ve siz
`https://clawhub.ai/cli/device` adresinde yetkilendirirken bekler.

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

## İptal

API belirteçlerini ClawHub web kullanıcı arayüzünde iptal edebilirsiniz.

İptal edilmiş, geçersiz veya eksik belirteçler `401 Unauthorized` döndürür. Tekrar
`clawhub login` ile oturum açın veya `clawhub login --token` ile yeni bir belirteç sağlayın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar mevcut API belirteçlerini kullanmaya
devam edemez. Hesabınız yasaklandıysa veya devre dışı bırakıldıysa, bunun bir
hata olduğunu düşünüyorsanız
[ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.
