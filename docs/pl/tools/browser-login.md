---
read_when:
    - Musisz zalogować się do witryn na potrzeby automatyzacji przeglądarki
    - Chcesz publikować aktualizacje na X/Twitterze
summary: Ręczne logowania na potrzeby automatyzacji przeglądarki + publikowania na X/Twitterze
title: Logowanie w przeglądarce
x-i18n:
    generated_at: "2026-05-11T20:37:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89501b47611a39df5a658ed7e144b7c16a07188dfa52544b56cbfc6e296e2ecc
    source_path: tools/browser-login.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Logowanie ręczne (zalecane)

Gdy witryna wymaga logowania, **zaloguj się ręcznie** w profilu przeglądarki **hosta** (przeglądarce openclaw).

**Nie** przekazuj modelowi swoich poświadczeń. Automatyczne logowania często uruchamiają zabezpieczenia antybotowe i mogą zablokować konto.

Powrót do głównej dokumentacji przeglądarki: [Przeglądarka](/pl/tools/browser).

## Który profil Chrome jest używany?

OpenClaw kontroluje **dedykowany profil Chrome** (o nazwie `openclaw`, z pomarańczowym odcieniem interfejsu). Jest on oddzielony od Twojego codziennego profilu przeglądarki.

W przypadku wywołań narzędzia przeglądarki przez agenta:

- Domyślny wybór: agent powinien używać swojej odizolowanej przeglądarki `openclaw`.
- Używaj `profile="user"` tylko wtedy, gdy znaczenie mają istniejące zalogowane sesje, a użytkownik jest przy komputerze, aby kliknąć/zatwierdzić ewentualny monit o dołączenie.
- Jeśli masz wiele profili przeglądarki użytkownika, określ profil jawnie zamiast zgadywać.

Dwa proste sposoby dostępu:

1. **Poproś agenta o otwarcie przeglądarki**, a następnie zaloguj się samodzielnie.
2. **Otwórz ją przez CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Jeśli masz wiele profili, przekaż `--browser-profile <name>` (domyślnie jest to `openclaw`).

## X/Twitter: zalecany przepływ

- **Czytanie/wyszukiwanie/wątki:** używaj przeglądarki **hosta** (logowanie ręczne).
- **Publikowanie aktualizacji:** używaj przeglądarki **hosta** (logowanie ręczne).

## Piaskownica + dostęp do przeglądarki hosta

Sesje przeglądarki w piaskownicy **częściej** uruchamiają wykrywanie botów. W przypadku X/Twitter (i innych restrykcyjnych witryn) preferuj przeglądarkę **hosta**.

Jeśli agent działa w piaskownicy, narzędzie przeglądarki domyślnie używa piaskownicy. Aby zezwolić na sterowanie hostem:

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

Następnie samodzielnie otwórz przeglądarkę hosta (wywołania CLI zawsze działają na przeglądarce hosta):

```bash
openclaw browser open https://x.com --browser-profile openclaw
```

Wywołania narzędzia `browser` agenta mogą wtedy wskazywać hosta po ustawieniu `sandbox.browser.allowHostControl: true`. Alternatywnie wyłącz piaskownicę dla agenta, który publikuje aktualizacje.

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Rozwiązywanie problemów z przeglądarką w systemie Linux](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z przeglądarką w WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
