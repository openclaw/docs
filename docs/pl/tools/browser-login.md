---
read_when:
    - Musisz zalogować się do witryn na potrzeby automatyzacji przeglądarki
    - Chcesz publikować aktualizacje na X/Twitterze
summary: Ręczne logowanie do automatyzacji przeglądarki + publikowanie na X/Twitterze
title: Logowanie w przeglądarce
x-i18n:
    generated_at: "2026-04-24T09:35:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e70ae373fed861ffde0e03dfe6252b0589f7cc1946585e9b055cbed70de14b1
    source_path: tools/browser-login.md
    workflow: 15
---

# Logowanie w przeglądarce + publikowanie na X/Twitterze

## Ręczne logowanie (zalecane)

Gdy witryna wymaga logowania, **zaloguj się ręcznie** w profilu przeglądarki **hosta** (przeglądarka openclaw).

**Nie** przekazuj modelowi swoich danych logowania. Zautomatyzowane logowania często uruchamiają zabezpieczenia antybotowe i mogą zablokować konto.

Powrót do głównej dokumentacji przeglądarki: [Przeglądarka](/pl/tools/browser).

## Który profil Chrome jest używany?

OpenClaw steruje **dedykowanym profilem Chrome** (o nazwie `openclaw`, z interfejsem w odcieniach pomarańczu). Jest on oddzielony od Twojego codziennego profilu przeglądarki.

Dla wywołań narzędzia przeglądarki przez agenta:

- Domyślny wybór: agent powinien używać swojej izolowanej przeglądarki `openclaw`.
- Użyj `profile="user"` tylko wtedy, gdy znaczenie mają istniejące zalogowane sesje i użytkownik jest przy komputerze, aby kliknąć lub zatwierdzić ewentualny monit o dołączenie.
- Jeśli masz wiele profili przeglądarki użytkownika, wskaż profil jawnie zamiast zgadywać.

Dwa proste sposoby uzyskania do niego dostępu:

1. **Poproś agenta o otwarcie przeglądarki**, a następnie zaloguj się samodzielnie.
2. **Otwórz ją przez CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Jeśli masz wiele profili, przekaż `--browser-profile <name>` (domyślnie jest to `openclaw`).

## X/Twitter: zalecany przebieg

- **Odczyt/wyszukiwanie/wątki:** używaj przeglądarki **hosta** (ręczne logowanie).
- **Publikowanie aktualizacji:** używaj przeglądarki **hosta** (ręczne logowanie).

## Sandboxing + dostęp do przeglądarki hosta

Sesje przeglądarki w sandboxie **częściej** uruchamiają wykrywanie botów. W przypadku X/Twittera (i innych restrykcyjnych witryn) preferuj przeglądarkę **hosta**.

Jeśli agent działa w sandboxie, narzędzie przeglądarki domyślnie używa sandboxa. Aby zezwolić na sterowanie hostem:

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

Następnie kieruj na przeglądarkę hosta:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Albo wyłącz sandboxing dla agenta, który publikuje aktualizacje.

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Rozwiązywanie problemów z przeglądarką w Linuxie](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z przeglądarką w WSL2](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
