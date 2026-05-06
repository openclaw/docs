---
read_when:
    - Musisz logować się do witryn na potrzeby automatyzacji przeglądarki
    - Chcesz publikować aktualizacje na X/Twitterze
summary: Ręczne logowania na potrzeby automatyzacji przeglądarki + publikowania na X/Twitter
title: Logowanie w przeglądarce
x-i18n:
    generated_at: "2026-05-06T09:31:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## Ręczne logowanie (zalecane)

Gdy witryna wymaga logowania, **zaloguj się ręcznie** w profilu przeglądarki **hosta** (przeglądarka openclaw).

**Nie** podawaj modelowi swoich danych logowania. Zautomatyzowane logowania często uruchamiają zabezpieczenia antybotowe i mogą zablokować konto.

Powrót do głównej dokumentacji przeglądarki: [Przeglądarka](/pl/tools/browser).

## Który profil Chrome jest używany?

OpenClaw kontroluje **dedykowany profil Chrome** (o nazwie `openclaw`, z pomarańczowo zabarwionym interfejsem). Jest on oddzielny od Twojego codziennego profilu przeglądarki.

Dla wywołań narzędzia przeglądarki przez agenta:

- Domyślny wybór: agent powinien używać swojej izolowanej przeglądarki `openclaw`.
- Używaj `profile="user"` tylko wtedy, gdy istniejące zalogowane sesje mają znaczenie, a użytkownik jest przy komputerze, aby kliknąć/zatwierdzić ewentualny monit o dołączenie.
- Jeśli masz wiele profili przeglądarki użytkownika, wskaż profil jawnie zamiast zgadywać.

Dwa proste sposoby uzyskania dostępu:

1. **Poproś agenta o otwarcie przeglądarki**, a następnie zaloguj się samodzielnie.
2. **Otwórz ją przez CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Jeśli masz wiele profili, przekaż `--browser-profile <name>` (wartość domyślna to `openclaw`).

## X/Twitter: zalecany przepływ

- **Czytanie/wyszukiwanie/wątki:** używaj przeglądarki **hosta** (ręczne logowanie).
- **Publikowanie aktualizacji:** używaj przeglądarki **hosta** (ręczne logowanie).

## Sandboxing + dostęp do przeglądarki hosta

Sesje przeglądarki w sandboxie **częściej** uruchamiają wykrywanie botów. W przypadku X/Twitter (i innych restrykcyjnych witryn) preferuj przeglądarkę **hosta**.

Jeśli agent działa w sandboxie, narzędzie przeglądarki domyślnie używa sandboxa. Aby zezwolić na kontrolę hosta:

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

Następnie skieruj polecenie do przeglądarki hosta:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

Albo wyłącz sandboxing dla agenta, który publikuje aktualizacje.

## Powiązane

- [Przeglądarka](/pl/tools/browser)
- [Rozwiązywanie problemów z przeglądarką w systemie Linux](/pl/tools/browser-linux-troubleshooting)
- [Rozwiązywanie problemów z przeglądarką WSL2 przez zdalne CDP systemu Windows](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
