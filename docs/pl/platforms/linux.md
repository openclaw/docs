---
read_when:
    - Szukasz informacji o statusie aplikacji towarzyszącej dla Linux.
    - Planowanie pokrycia platform albo wkładu.
    - Debugowanie zabicia przez OOM albo kodu wyjścia 137 na VPS lub w kontenerze Linux.
summary: Obsługa Linux + status aplikacji towarzyszącej
title: Aplikacja Linux
x-i18n:
    generated_at: "2026-04-24T09:20:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

Gateway jest w pełni obsługiwany na Linux. **Node to zalecany runtime**.
Bun nie jest zalecany dla Gateway (błędy z WhatsApp/Telegram).

Natywne aplikacje towarzyszące dla Linux są planowane. Wkład jest mile widziany, jeśli chcesz pomóc taką zbudować.

## Szybka ścieżka dla początkujących (VPS)

1. Zainstaluj Node 24 (zalecane; Node 22 LTS, obecnie `22.14+`, nadal działa dla kompatybilności)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Na laptopie: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Otwórz `http://127.0.0.1:18789/` i uwierzytelnij się skonfigurowanym shared secret (domyślnie token; hasło, jeśli ustawisz `gateway.auth.mode: "password"`)

Pełny przewodnik po serwerze Linux: [Linux Server](/pl/vps). Przykład VPS krok po kroku: [exe.dev](/pl/install/exe-dev)

## Instalacja

- [Pierwsze kroki](/pl/start/getting-started)
- [Instalacja i aktualizacje](/pl/install/updating)
- Opcjonalne przepływy: [Bun (eksperymentalnie)](/pl/install/bun), [Nix](/pl/install/nix), [Docker](/pl/install/docker)

## Gateway

- [Runbook Gateway](/pl/gateway)
- [Konfiguracja](/pl/gateway/configuration)

## Instalacja usługi Gateway (CLI)

Użyj jednej z tych metod:

```text
openclaw onboard --install-daemon
```

Albo:

```text
openclaw gateway install
```

Albo:

```text
openclaw configure
```

Po wyświetleniu monitu wybierz **Gateway service**.

Naprawa/migracja:

```text
openclaw doctor
```

## Kontrola systemu (user unit `systemd`)

OpenClaw domyślnie instaluje usługę użytkownika `systemd`. Dla współdzielonych albo zawsze włączonych serwerów użyj
usługi **systemowej**. `openclaw gateway install` i
`openclaw onboard --install-daemon` już renderują dla ciebie bieżącą kanoniczną jednostkę;
pisz ją ręcznie tylko wtedy, gdy potrzebujesz niestandardowej konfiguracji systemu/menedżera usług.
Pełne wskazówki dotyczące usług znajdują się w [runbooku Gateway](/pl/gateway).

Minimalna konfiguracja:

Utwórz `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```text
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

```text
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Presja pamięci i zabicia przez OOM

Na Linux kernel wybiera ofiarę OOM, gdy host, VM albo cgroup kontenera
kończy pamięć. Gateway może być złą ofiarą, ponieważ zarządza długowiecznymi
sesjami i połączeniami kanałów. Dlatego OpenClaw, gdy to możliwe, ustawia przejściowe procesy potomne
tak, aby były zabijane wcześniej niż Gateway.

Dla kwalifikujących się procesów potomnych na Linux OpenClaw uruchamia proces potomny przez krótki
wrapper `/bin/sh`, który podnosi własny `oom_score_adj` potomka do `1000`, a następnie
wykonuje `exec` właściwego polecenia. To operacja nieuprzywilejowana, ponieważ proces potomny
tylko zwiększa własne prawdopodobieństwo zabicia przez OOM.

Obsługiwane powierzchnie procesów potomnych obejmują:

- potomne polecenia zarządzane przez supervisora,
- potomne powłoki PTY,
- potomne serwery MCP stdio,
- procesy przeglądarki/Chrome uruchamiane przez OpenClaw.

Wrapper działa tylko na Linux i jest pomijany, gdy `/bin/sh` jest niedostępne. Jest
także pomijany, jeśli env potomka ustawia `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` albo `off`.

Aby zweryfikować proces potomny:

```bash
cat /proc/<child-pid>/oom_score_adj
```

Oczekiwana wartość dla obsługiwanych procesów potomnych to `1000`. Proces Gateway powinien zachować
swój normalny wynik, zwykle `0`.

To nie zastępuje normalnego strojenia pamięci. Jeśli VPS albo kontener wielokrotnie
zabija procesy potomne, zwiększ limit pamięci, zmniejsz współbieżność albo dodaj silniejsze
mechanizmy kontroli zasobów, takie jak `systemd MemoryMax=` albo limity pamięci na poziomie kontenera.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Serwer Linux](/pl/vps)
- [Raspberry Pi](/pl/install/raspberry-pi)
