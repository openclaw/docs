---
read_when:
    - Musisz logować się do stron na potrzeby automatyzacji przeglądarki
    - Chcesz publikować aktualizacje na X/Twitter
summary: Ręczne logowania do automatyzacji przeglądarki + publikowanie na X/Twitter
title: Logowanie w przeglądarce
x-i18n:
    generated_at: "2026-04-05T14:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: de40685c70f1c141dba98e6dadc2c6f3a2b3b6d98c89ef8404144c9d178bb763
    source_path: tools/browser-login.md
    workflow: 15
---

# Logowanie w przeglądarce + publikowanie na X/Twitter

## Ręczne logowanie (zalecane)

Gdy strona wymaga logowania, **zaloguj się ręcznie** w profilu przeglądarki **hosta** (przeglądarka openclaw).

**Nie** przekazuj modelowi swoich poświadczeń. Zautomatyzowane logowania często uruchamiają mechanizmy antybotowe i mogą zablokować konto.

Powrót do głównej dokumentacji przeglądarki: [Browser](/tools/browser).

## Który profil Chrome jest używany?

OpenClaw steruje **dedykowanym profilem Chrome** (o nazwie `openclaw`, z pomarańczowym interfejsem). Jest on oddzielony od Twojego codziennego profilu przeglądarki.

Dla wywołań narzędzia przeglądarki przez agenta:

- Wybór domyślny: agent powinien używać swojej izolowanej przeglądarki `openclaw`.
- Używaj `profile="user"` tylko wtedy, gdy istniejące zalogowane sesje mają znaczenie i użytkownik jest przy komputerze, aby kliknąć/zatwierdzić ewentualny monit o podłączenie.
- Jeśli masz wiele profili przeglądarki użytkownika, wskaż profil jawnie zamiast zgadywać.

Dwa proste sposoby dostępu do niego:

1. **Poproś agenta o otwarcie przeglądarki**, a następnie zaloguj się samodzielnie.
2. **Otwórz ją przez CLI**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

Jeśli masz wiele profili, przekaż `--browser-profile <name>` (domyślnie jest to `openclaw`).

## X/Twitter: zalecany przepływ

- **Czytanie/wyszukiwanie/wątki:** używaj przeglądarki **hosta** (ręczne logowanie).
- **Publikowanie aktualizacji:** używaj przeglądarki **hosta** (ręczne logowanie).

## Sandboxing + dostęp do przeglądarki hosta

Sesje przeglądarki w sandboxie **częściej** uruchamiają wykrywanie botów. Dla X/Twitter (i innych restrykcyjnych stron) preferuj przeglądarkę **hosta**.

Jeśli agent działa w sandboxie, narzędzie przeglądarki domyślnie kieruje do sandboxa. Aby zezwolić na sterowanie hostem:

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
