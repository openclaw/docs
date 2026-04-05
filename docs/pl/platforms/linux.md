---
read_when:
    - Szukasz informacji o statusie aplikacji towarzyszącej dla Linux
    - Planujesz pokrycie platform lub wkład w projekt
summary: Obsługa Linux + status aplikacji towarzyszącej
title: Aplikacja Linux
x-i18n:
    generated_at: "2026-04-05T13:59:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5dbfc89eb65e04347479fc6c9a025edec902fb0c544fb8d5bd09c24558ea03b1
    source_path: platforms/linux.md
    workflow: 15
---

# Aplikacja Linux

Gateway jest w pełni obsługiwany na Linux. **Node jest zalecanym środowiskiem uruchomieniowym**.
Bun nie jest zalecany dla Gateway (błędy WhatsApp/Telegram).

Natywne aplikacje towarzyszące dla Linux są planowane. Wkład jest mile widziany, jeśli chcesz pomóc taką zbudować.

## Szybka ścieżka dla początkujących (VPS)

1. Zainstaluj Node 24 (zalecane; Node 22 LTS, obecnie `22.14+`, nadal działa dla zgodności)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Na swoim laptopie: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Otwórz `http://127.0.0.1:18789/` i uwierzytelnij się skonfigurowanym współdzielonym sekretem (domyślnie tokenem; hasłem, jeśli ustawisz `gateway.auth.mode: "password"`)

Pełny przewodnik po serwerze Linux: [Linux Server](/vps). Przykład VPS krok po kroku: [exe.dev](/install/exe-dev)

## Instalacja

- [Pierwsze kroki](/start/getting-started)
- [Instalacja i aktualizacje](/install/updating)
- Opcjonalne ścieżki: [Bun (eksperymentalnie)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

## Gateway

- [Instrukcja operacyjna Gateway](/gateway)
- [Configuration](/gateway/configuration)

## Instalacja usługi Gateway (CLI)

Użyj jednego z poniższych:

```
openclaw onboard --install-daemon
```

Lub:

```
openclaw gateway install
```

Lub:

```
openclaw configure
```

Po wyświetleniu promptu wybierz **Gateway service**.

Naprawa/migracja:

```
openclaw doctor
```

## Sterowanie systemem (jednostka użytkownika systemd)

OpenClaw domyślnie instaluje usługę systemd **user**. Dla współdzielonych lub zawsze włączonych serwerów użyj usługi **system**. `openclaw gateway install` i
`openclaw onboard --install-daemon` już generują dla ciebie bieżącą kanoniczną jednostkę;
pisz ją ręcznie tylko wtedy, gdy potrzebujesz niestandardowej konfiguracji systemu/menedżera usług. Pełne wskazówki dotyczące usług znajdują się w [instrukcji operacyjnej Gateway](/gateway).

Minimalna konfiguracja:

Utwórz `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Włącz ją:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
