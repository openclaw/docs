---
read_when:
    - Wdrażanie OpenClaw w Upstash Box
    - Chcesz zarządzanego środowiska Linux dla OpenClaw z dostępem do pulpitu przez tunel SSH
summary: Hostowanie OpenClaw na Upstash Box z mechanizmem keep-alive i dostępem przez tunel SSH
title: Upstash Box
x-i18n:
    generated_at: "2026-06-27T17:44:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Uruchom trwały OpenClaw Gateway w Upstash Box, zarządzanym środowisku Linux
z obsługą cyklu życia keep-alive.

Użyj tunelu SSH do dostępu do panelu. Nie wystawiaj portu Gateway bezpośrednio
do publicznego internetu.

## Wymagania wstępne

- Konto Upstash
- Upstash Box z keep-alive
- Klient SSH na komputerze lokalnym

## Utwórz Box

Utwórz Box z keep-alive w konsoli Upstash. Zanotuj identyfikator Box, taki jak
`right-flamingo-14486`, oraz klucz API Box.

Upstash utrzymuje aktualny przewodnik OpenClaw Box pod adresem
[Konfiguracja OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Połącz się za pomocą tunelu SSH

Przekieruj port panelu OpenClaw na komputer lokalny. Gdy pojawi się monit,
użyj klucza API Box jako hasła SSH:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Opcje keepalive ograniczają zrywanie bezczynnego tunelu podczas wdrażania.

## Zainstaluj OpenClaw

Wewnątrz Box:

```bash
sudo npm install -g openclaw
```

## Uruchom wdrażanie

```bash
openclaw onboard --install-daemon
```

Postępuj zgodnie z monitami. Skopiuj URL panelu i token po zakończeniu wdrażania.

## Uruchom Gateway

Skonfiguruj Gateway dla sieci Box i uruchom go w tle:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Przy aktywnym tunelu SSH otwórz lokalnie URL panelu:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Automatyczne ponowne uruchamianie

Ustaw to polecenie jako skrypt inicjalizacyjny Box, aby Gateway uruchamiał się
ponownie przy starcie Box:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Rozwiązywanie problemów

Jeśli SSH zawiesza się podczas wdrażania, połącz się ponownie z czystą
konfiguracją SSH i opcjami keepalive:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

To pomija nieaktualne lokalne ustawienia `~/.ssh/config` i utrzymuje tunel
aktywny podczas okresów bezczynności sieci.

## Powiązane

- [Zdalny dostęp](/pl/gateway/remote)
- [Bezpieczeństwo Gateway](/pl/gateway/security)
- [Aktualizowanie OpenClaw](/pl/install/updating)
