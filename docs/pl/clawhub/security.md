---
read_when:
    - Zgłaszanie problemu bezpieczeństwa ClawHub
    - Zasady ujawniania luk w zabezpieczeniach ClawHub
    - Rozróżnianie problemów z platformą ClawHub od problemów z Skills lub pluginami innych firm
sidebarTitle: Security
summary: Jak zgłaszać problemy z bezpieczeństwem ClawHub i kiedy informacje o lukach w zabezpieczeniach są ujawniane publicznie.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-16T18:06:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo

Problemy z bezpieczeństwem ClawHub można zgłaszać za pośrednictwem porad bezpieczeństwa GitHub dla
`openclaw/clawhub`.

Porad bezpieczeństwa GitHub należy używać w przypadku luk w zabezpieczeniach samego ClawHub. Dobre
zgłoszenia dotyczące bezpieczeństwa ClawHub obejmują błędy w:

- witrynie ClawHub, API lub CLI
- publikowaniu w rejestrze, pobieraniu, instalowaniu lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderowaniu lub obsłudze zgłoszeń

Nie należy używać porad bezpieczeństwa ClawHub do zgłaszania luk we własnym kodzie źródłowym Skills lub
pluginu innej firmy. Należy je zgłaszać bezpośrednio wydawcy lub w repozytorium
źródłowym wskazanym na stronie wpisu w ClawHub.

## Ujawnianie luk w zabezpieczeniach

Ponieważ ClawHub jest hostowaną aplikacją chmurową, luki w zabezpieczeniach usługi ClawHub
nie są domyślnie ujawniane publicznie. Ujawnia się je publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć działania.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie luki, ujawnienie danych
użytkowników lub sekretów, dotarcie złośliwej zawartości do użytkowników w wyniku awarii platformy
albo dowolny problem wymagający od użytkowników zmiany danych uwierzytelniających, aktualizacji lokalnego oprogramowania lub
podjęcia innych działań ochronnych.

Luki w zabezpieczeniach oprogramowania instalowanego przez użytkowników są ujawniane publicznie, na przykład
w pakietach CLI ClawHub, plikach binarnych, bibliotekach lub innych artefaktach wydania, które użytkownicy
muszą zaktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach i ich interpretacji zawiera strona
[Audyty bezpieczeństwa](/clawhub/security-audits).

Informacje o zgłoszeniach z marketplace, wstrzymaniu w ramach moderacji, ukrytych wpisach, blokadach i statusie
konta zawiera strona [Moderacja i bezpieczeństwo konta](/clawhub/moderation).
