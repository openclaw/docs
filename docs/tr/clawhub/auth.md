---
read_when:
    - ClawHub’da oturum açma
    - ClawHub CLI'ı Kullanma
    - 401 Hatalarında Hata Ayıklama
summary: ClawHub oturum açma, API tokenleri, CLI ile giriş, token depolama ve iptal etme.
x-i18n:
    generated_at: "2026-07-02T17:44:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Kimlik Doğrulama

ClawHub web oturumu açma için GitHub kullanır. CLI, oturum açmış hesap üzerinden oluşturulan ClawHub API tokenlarını kullanır.

## Web oturumu açma

[clawhub.ai](https://clawhub.ai) adresinde oturum açmak için GitHub kullanın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar normal ClawHub oturumu açma işlemini tamamlayamaz. Oturum açma sizi oturumu kapatılmış duruma geri döndürüyorsa hesabınız iyi durumda olmayabilir. Hesabınız yasaklandıysa veya devre dışı bırakıldıysa bunun bir hata olduğunu düşünüyorsanız [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.

## CLI oturumu açma

Varsayılan CLI oturum açma akışı tarayıcınızı açar:

```bash
clawhub login
clawhub whoami
```

Olanlar:

1. CLI, `127.0.0.1` üzerinde geçici bir geri çağırma sunucusu başlatır.
2. Tarayıcınız ClawHub oturum açma sayfasını açar.
3. GitHub oturumu açıldıktan sonra ClawHub bir API tokenı oluşturur.
4. Tarayıcı yerel geri çağırmaya yeniden yönlendirilir.
5. CLI, tokenı ClawHub yapılandırma dosyanızda saklar.

Tarayıcınız güvenlik duvarı, VPN veya proxy kuralları nedeniyle yerel geri çağırmaya ulaşamıyorsa başsız token akışını kullanın.

## Başsız oturum açma

ClawHub web arayüzünde bir token oluşturun, ardından bunu CLI'ye iletin:

```bash
clawhub login --token clh_...
```

Bu akışı sunucular, CI işleri veya yalnızca terminal kullanılan ortamlar için kullanın.

Başka bir yerde tarayıcı açabildiğiniz uzak kabuklar için şunu çalıştırın:

```bash
clawhub login --device
```

CLI tek kullanımlık bir kod yazdırır ve siz `https://clawhub.ai/cli/device` adresinde yetkilendirirken bekler.

## Token depolama

Varsayılan yapılandırma yolları:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` veya `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Yolu şununla geçersiz kılın:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

CI kurulumu için saklanan tokenı şununla yazdırın:

```bash
clawhub token
```

## İptal Etme

API tokenlarını ClawHub web arayüzünde iptal edebilirsiniz.

İptal edilmiş, geçersiz veya eksik tokenlar `401 Unauthorized` döndürür. `clawhub login` ile tekrar oturum açın veya `clawhub login --token` ile yeni bir token sağlayın.

Silinmiş, yasaklanmış veya devre dışı bırakılmış hesaplar mevcut API tokenlarını kullanmaya devam edemez. Hesabınız yasaklandıysa veya devre dışı bırakıldıysa bunun bir hata olduğunu düşünüyorsanız [ClawHub itiraz formunu](https://appeals.openclaw.ai/) kullanın.
