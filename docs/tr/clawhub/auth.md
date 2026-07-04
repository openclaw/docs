---
read_when:
    - ClawHub'da oturum açma
    - ClawHub CLI’yi Kullanma
    - 401 Hatalarında Hata Ayıklama
summary: ClawHub oturum açma, API belirteçleri, CLI oturum açma, belirteç depolama ve iptal.
x-i18n:
    generated_at: "2026-07-04T10:57:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Kimlik Doğrulama

ClawHub, web oturum açma için GitHub kullanır. CLI, oturum açılmış hesap üzerinden oluşturulan ClawHub API belirteçlerini kullanır.

## Web oturum açma

[clawhub.ai](https://clawhub.ai) adresinde oturum açmak için GitHub kullanın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar normal ClawHub oturum açma işlemini tamamlayamaz. Oturum açma sizi oturum kapalı durumuna geri döndürüyorsa hesabınızın durumu iyi olmayabilir. Hesabınız yasaklandıysa veya devre dışı bırakıldıysa bunun bir hata olduğunu düşünüyorsanız [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

## CLI oturum açma

Varsayılan CLI oturum açma akışı tarayıcınızı açar:

```bash
clawhub login
clawhub whoami
```

Olanlar:

1. CLI, `127.0.0.1` üzerinde geçici bir geri çağırma sunucusu başlatır.
2. Tarayıcınız ClawHub oturum açma sayfasını açar.
3. GitHub oturum açma işleminden sonra ClawHub bir API belirteci oluşturur.
4. Tarayıcı yerel geri çağırmaya yeniden yönlendirilir.
5. CLI, belirteci ClawHub yapılandırma dosyanızda saklar.

Tarayıcınız güvenlik duvarı, VPN veya proxy kuralları nedeniyle yerel geri çağırmaya ulaşamıyorsa başsız belirteç akışını kullanın.

## Başsız oturum açma

ClawHub web kullanıcı arayüzünde bir belirteç oluşturun, ardından bunu CLI’ye iletin:

```bash
clawhub login --token clh_...
```

Bu akışı sunucular, CI işleri veya yalnızca terminal kullanılan ortamlar için kullanın.

Başka bir yerde tarayıcı açabileceğiniz uzak kabuklar için şunu çalıştırın:

```bash
clawhub login --device
```

CLI tek kullanımlık bir kod yazdırır ve siz `https://clawhub.ai/cli/device` adresinde yetkilendirirken bekler.

## Belirteç depolama

Varsayılan yapılandırma yolları:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Yolu şununla geçersiz kılın:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

CI kurulumu için saklanan belirteci şununla yazdırın:

```bash
clawhub token
```

## İptal

API belirteçlerini ClawHub web kullanıcı arayüzünde iptal edebilirsiniz.

İptal edilmiş, geçersiz veya eksik belirteçler `401 Unauthorized` döndürür. `clawhub login` ile yeniden oturum açın veya `clawhub login --token` ile yeni bir belirteç sağlayın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar mevcut API belirteçlerini kullanmaya devam edemez. Hesabınız yasaklandıysa veya devre dışı bırakıldıysa bunun bir hata olduğunu düşünüyorsanız [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.
