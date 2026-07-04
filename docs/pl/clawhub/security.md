---
read_when:
    - Zgłaszanie problemu bezpieczeństwa ClawHub
    - Zrozumienie ujawniania podatności w ClawHub
    - Odróżnianie problemów platformy ClawHub od problemów z Skills lub Plugin pochodzących od firm trzecich
sidebarTitle: Security
summary: Jak zgłaszać problemy bezpieczeństwa ClawHub i kiedy podatności są publicznie ujawniane.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-04T04:09:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo

Problemy bezpieczeństwa ClawHub można zgłaszać przez GitHub Security Advisories dla
`openclaw/clawhub`.

Używaj GitHub Security Advisories dla luk w zabezpieczeniach samego ClawHub. Dobre
zgłoszenia doradcze ClawHub obejmują błędy w:

- witrynie, API lub CLI ClawHub
- publikowaniu w rejestrze, pobieraniu, instalacjach lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj doradztw ClawHub do zgłaszania luk w zabezpieczeniach we własnym kodzie źródłowym Skills lub
Pluginu firmy zewnętrznej. Zgłaszaj je bezpośrednio wydawcy lub do repozytorium
źródłowego podlinkowanego z wpisu w ClawHub.

## Ujawnianie luk w zabezpieczeniach

Ponieważ ClawHub jest hostowaną aplikacją chmurową, luki w zabezpieczeniach usługi ClawHub
domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć działania.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie luki, ujawnienie danych
użytkowników lub sekretów, dotarcie złośliwych treści do użytkowników wskutek awarii platformy
albo dowolny problem wymagający od użytkowników rotacji poświadczeń, aktualizacji lokalnego oprogramowania lub
podjęcia innych działań ochronnych.

Luki w zabezpieczeniach oprogramowania instalowanego przez użytkownika są ujawniane publicznie, na przykład
pakiety ClawHub CLI, pliki binarne, biblioteki lub inne artefakty wydania, które użytkownicy
muszą zaktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach i interpretacji znajdziesz w
[Audyty bezpieczeństwa](/clawhub/security-audits).

Informacje o zgłoszeniach w marketplace, wstrzymaniach moderacyjnych, ukrytych wpisach, blokadach i statusie
konta znajdziesz w [Moderacja i bezpieczeństwo konta](/clawhub/moderation).
