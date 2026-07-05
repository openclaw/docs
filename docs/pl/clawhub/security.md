---
read_when:
    - Zgłaszanie problemu bezpieczeństwa w ClawHub
    - Zrozumienie ujawniania podatności w ClawHub
    - Odróżnianie problemów platformy ClawHub od problemów zewnętrznych Skills lub Plugin
sidebarTitle: Security
summary: Jak zgłaszać problemy bezpieczeństwa ClawHub i kiedy podatności są publicznie ujawniane.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-07-05T08:47:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64dcc75ad4210082c79326e617bac38908e927fd8d260fd029aa87e0a11cd324
    source_path: clawhub/security.md
    workflow: 16
---

# Bezpieczeństwo

Problemy z bezpieczeństwem ClawHub można zgłaszać za pomocą GitHub Security Advisories dla
`openclaw/clawhub`.

Używaj GitHub Security Advisories do zgłaszania podatności w samym ClawHub. Dobre
zgłoszenia doradcze dotyczące ClawHub obejmują błędy w:

- witrynie, API lub CLI ClawHub
- publikowaniu w rejestrze, pobieraniu, instalacjach lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj zgłoszeń doradczych ClawHub do zgłaszania podatności w kodzie źródłowym zewnętrznego skillu lub
pluginu. Zgłaszaj je bezpośrednio do wydawcy lub repozytorium źródłowego
powiązanego z wpisem w ClawHub.

## Ujawnianie podatności

Ponieważ ClawHub jest hostowaną aplikacją chmurową, podatności usługi ClawHub
domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć działania.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie, ujawnienie danych
użytkowników lub sekretów, złośliwe treści docierające do użytkowników z powodu awarii platformy
albo dowolny problem wymagający od użytkowników rotacji poświadczeń, aktualizacji lokalnego oprogramowania lub
podjęcia innych działań ochronnych.

Podatności w oprogramowaniu instalowanym przez użytkowników są ujawniane publicznie, na przykład
pakiety CLI ClawHub, pliki binarne, biblioteki lub inne artefakty wydania, które użytkownicy
muszą aktualizować lokalnie.

## Powiązane strony

Etykiety audytu podczas instalacji, poziomy ryzyka, ustalenia i ich interpretację opisuje
[Security Audits](/clawhub/security-audits).

Informacje o zgłoszeniach z marketplace, blokadach moderacyjnych, ukrytych wpisach, banach i
statusie konta znajdziesz w [Moderation and Account Safety](/pl/clawhub/moderation).
