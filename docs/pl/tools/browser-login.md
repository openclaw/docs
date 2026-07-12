---
read_when:
    - Musisz zalogować się w witrynach, aby zautomatyzować działania w przeglądarce
    - Chcesz publikować aktualizacje w X/Twitterze
summary: Ręczne logowanie na potrzeby automatyzacji przeglądarki i publikowania w X/Twitterze
title: Logowanie w przeglądarce
x-i18n:
    generated_at: "2026-07-12T15:38:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## Ręczne logowanie (zalecane)

Gdy witryna wymaga logowania, zaloguj się ręcznie w profilu `openclaw`
przeglądarki hosta. Nie przekazuj modelowi swoich danych uwierzytelniających:
automatyczne logowanie często uruchamia zabezpieczenia przed botami i może
spowodować zablokowanie konta.

Używaj przeglądarki hosta (z ręcznym logowaniem) zarówno do odczytu
(wyszukiwania/wątków), jak i publikowania w serwisie X/Twitter oraz innych
witrynach wrażliwych na działania botów. Sesje przeglądarki w piaskownicy
częściej uruchamiają mechanizmy wykrywania botów.

Powrót do głównej dokumentacji przeglądarki: [Przeglądarka](/pl/tools/browser).

## Który profil Chrome jest używany?

OpenClaw kontroluje dedykowany profil Chrome o nazwie `openclaw` (z interfejsem
w pomarańczowej tonacji), oddzielony od profilu używanego na co dzień.

W przypadku wywołań narzędzia przeglądarki przez agenta:

- Domyślny wybór: agent używa swojej izolowanej przeglądarki `openclaw`.
- Używaj `profile="user"` tylko wtedy, gdy potrzebne są istniejące zalogowane
  sesje i jesteś przy komputerze, aby kliknąć lub zatwierdzić monit o dołączenie.
- Jeśli masz wiele profili przeglądarki użytkownika, wskaż profil jawnie
  zamiast zgadywać.

Dwa sposoby uzyskania dostępu do profilu `openclaw`:

1. Poproś agenta o otwarcie przeglądarki, a następnie zaloguj się samodzielnie.
2. Otwórz ją za pomocą CLI:

```bash
openclaw browser start
openclaw browser open https://x.com
```

W przypadku profilu innego niż domyślny umieść `--browser-profile <name>` przed
podpoleceniem (wartością domyślną jest `openclaw`):

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## Piaskownica: zezwalanie na dostęp do przeglądarki hosta

Jeśli agent działa w piaskownicy, jego wywołania narzędzia `browser` domyślnie
korzystają z przeglądarki w piaskownicy, a nie z przeglądarki hosta. Aby
umożliwić agentowi korzystanie z przeglądarki hosta:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

Wywołania CLI zawsze korzystają z przeglądarki hosta, nigdy z piaskownicy,
dlatego niezależnie od tego ustawienia możesz samodzielnie otworzyć
przeglądarkę hosta:

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

Po ustawieniu `sandbox.browser.allowHostControl: true` wywołania narzędzia
`browser` przez agenta również mogą korzystać z hosta. Alternatywnie wyłącz
piaskownicę dla agenta publikującego aktualizacje.

## Powiązane materiały

- [Przeglądarka](/pl/tools/browser)
- [Rozwiązywanie problemów z przeglądarką w systemie Linux](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z przeglądarką w WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
