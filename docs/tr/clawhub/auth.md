---
read_when:
    - ClawHub'da oturum açma
    - ClawHub CLI'yi Kullanma
    - 401 Hatalarında Hata Ayıklama
summary: ClawHub'da oturum açma, API belirteçleri, CLI oturum açma, belirteç depolama ve iptal.
x-i18n:
    generated_at: "2026-05-13T04:17:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# Kimlik Doğrulama

ClawHub, web oturum açma için GitHub kullanır. CLI, oturum açılmış bu hesap
üzerinden oluşturulan ClawHub API token'larını kullanır.

## Web oturum açma

[clawhub.ai](https://clawhub.ai) adresinde oturum açmak için GitHub kullanın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar normal ClawHub oturum açma
işlemini tamamlayamaz. Oturum açma sizi oturum kapalı durumuna döndürürse, hesabınız
iyi durumda olmayabilir.

## CLI oturum açma

Varsayılan CLI oturum açma akışı tarayıcınızı açar:

```bash
clawhub login
clawhub whoami
```

Olanlar:

1. CLI, `127.0.0.1` üzerinde geçici bir geri çağrı sunucusu başlatır.
2. Tarayıcınız ClawHub oturum açma sayfasını açar.
3. GitHub oturum açma işleminden sonra ClawHub bir API token'ı oluşturur.
4. Tarayıcı yerel geri çağrıya geri yönlendirilir.
5. CLI, token'ı ClawHub yapılandırma dosyanızda saklar.

Tarayıcınız güvenlik duvarı, VPN veya proxy kuralları nedeniyle yerel geri çağrıya
erişemiyorsa, başsız token akışını kullanın.

## Başsız oturum açma

ClawHub web kullanıcı arayüzünde bir token oluşturun, ardından bunu CLI'ye iletin:

```bash
clawhub login --token clh_...
```

Bu akışı sunucular, CI işleri veya yalnızca terminal kullanılan ortamlar için kullanın.

Başka bir yerde tarayıcı açabileceğiniz uzak shell'ler için şunu çalıştırın:

```bash
clawhub login --device
```

CLI tek kullanımlık bir kod yazdırır ve siz bunu
`https://clawhub.ai/cli/device` adresinde yetkilendirirken bekler.

## Token depolama

Varsayılan yapılandırma yolları:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Yolu şununla geçersiz kılın:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## İptal

ClawHub web kullanıcı arayüzünde API token'larını iptal edebilirsiniz.

İptal edilmiş, geçersiz veya eksik token'lar `401 Unauthorized` döndürür. `clawhub login`
ile tekrar oturum açın veya `clawhub login --token` ile yeni bir token sağlayın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar mevcut API token'larını
kullanmaya devam edemez.
