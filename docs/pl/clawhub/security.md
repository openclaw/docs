---
read_when:
    - Zgłaszanie problemu z bezpieczeństwem ClawHub
    - Zrozumienie procesu zgłaszania luk w zabezpieczeniach ClawHub
    - Rozróżnianie problemów z platformą ClawHub od problemów z Skills lub pluginami innych firm
sidebarTitle: Security
summary: Jak zgłaszać problemy z bezpieczeństwem ClawHub i kiedy luki w zabezpieczeniach są ujawniane publicznie.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-12T14:56:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo

Problemy z bezpieczeństwem ClawHub można zgłaszać za pośrednictwem GitHub Security Advisories dla
`openclaw/clawhub`.

Używaj GitHub Security Advisories do zgłaszania luk w samym ClawHub. Dobre
zgłoszenia doradcze dotyczące ClawHub obejmują błędy w:

- witrynie internetowej, API lub CLI ClawHub
- publikowaniu w rejestrze, pobieraniu, instalowaniu lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj zgłoszeń doradczych ClawHub do zgłaszania luk we własnym kodzie źródłowym
Skills lub pluginu innej firmy. Zgłaszaj je bezpośrednio wydawcy lub w repozytorium
źródłowym wskazanym na stronie wpisu w ClawHub.

## Ujawnianie luk w zabezpieczeniach

Ponieważ ClawHub jest hostowaną aplikacją chmurową, luki w usłudze ClawHub
nie są domyślnie ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć działania.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie luki, ujawnienie danych
lub sekretów użytkowników, dotarcie złośliwych treści do użytkowników wskutek awarii platformy
albo dowolny problem wymagający od użytkowników zmiany danych uwierzytelniających, aktualizacji lokalnego oprogramowania lub
podjęcia innych działań ochronnych.

Luki w oprogramowaniu instalowanym przez użytkowników są ujawniane publicznie, na przykład w
pakietach CLI ClawHub, plikach binarnych, bibliotekach lub innych artefaktach wydania, które użytkownicy
muszą zaktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, wykrytych problemach i ich interpretacji znajdziesz w
[Audytach bezpieczeństwa](/clawhub/security-audits).

Informacje o zgłoszeniach z marketplace'u, wstrzymaniach moderacyjnych, ukrytych wpisach, blokadach i statusie
konta znajdziesz w [Moderacji i bezpieczeństwie konta](/pl/clawhub/moderation).
