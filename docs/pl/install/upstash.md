---
read_when:
    - Wdrażanie OpenClaw w Upstash Box
    - Potrzebujesz zarządzanego środowiska Linux dla OpenClaw z dostępem do panelu przez tunel SSH
summary: Hostuj OpenClaw na Upstash Box z mechanizmem keep-alive i dostępem przez tunel SSH
title: Upstash Box
x-i18n:
    generated_at: "2026-07-12T15:15:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Uruchom trwały Gateway OpenClaw na Upstash Box — zarządzanym środowisku Linux
z obsługą cyklu życia typu keep-alive.

Do dostępu do panelu użyj tunelu SSH. Nie udostępniaj portu Gateway bezpośrednio
w publicznym internecie.

## Wymagania wstępne

- Konto Upstash
- Upstash Box z funkcją keep-alive
- Klient SSH na komputerze lokalnym

## Tworzenie Box

Utwórz Box z funkcją keep-alive w konsoli Upstash. Zanotuj identyfikator Box (na przykład
`right-flamingo-14486`) oraz klucz API Box.

Upstash udostępnia aktualną instrukcję konfiguracji OpenClaw Box na stronie
[Konfiguracja OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup).

## Łączenie przez tunel SSH

Przekieruj port panelu OpenClaw na komputer lokalny. Gdy pojawi się monit,
użyj klucza API Box jako hasła SSH:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Opcje keep-alive ograniczają zrywanie nieaktywnego tunelu podczas konfiguracji początkowej.

## Instalowanie OpenClaw

Wewnątrz Box:

```bash
sudo npm install -g openclaw
```

## Uruchamianie konfiguracji początkowej

```bash
openclaw onboard --install-daemon
```

Postępuj zgodnie z instrukcjami. Po zakończeniu konfiguracji początkowej skopiuj adres URL panelu i token.

## Uruchamianie Gateway

Skonfiguruj Gateway dla sieci Box i uruchom go w tle:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

Gdy tunel SSH jest aktywny, otwórz lokalnie adres URL panelu:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## Automatyczne ponowne uruchamianie

Ustaw to polecenie jako skrypt inicjalizacyjny Box, aby Gateway uruchamiał się ponownie wraz
z uruchomieniem Box:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## Rozwiązywanie problemów

Jeśli połączenie SSH zawiesza się podczas konfiguracji początkowej, połącz się ponownie, używając czystej konfiguracji SSH i
opcji keep-alive:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

Pozwala to pominąć nieaktualne ustawienia lokalnego pliku `~/.ssh/config` i utrzymuje aktywność tunelu
w okresach bezczynności sieci.

## Powiązane

- [Dostęp zdalny](/pl/gateway/remote)
- [Bezpieczeństwo Gateway](/pl/gateway/security)
- [Aktualizowanie OpenClaw](/pl/install/updating)
