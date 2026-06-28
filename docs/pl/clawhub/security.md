---
read_when:
    - Zgłaszanie problemu bezpieczeństwa w ClawHub
    - Zrozumienie ujawniania podatności ClawHub
    - Odróżnianie problemów platformy ClawHub od problemów zewnętrznych skillów lub pluginów
sidebarTitle: Security
summary: Jak zgłaszać problemy z bezpieczeństwem ClawHub i kiedy podatności są publicznie ujawniane.
title: Bezpieczeństwo
x-i18n:
    generated_at: "2026-06-28T05:07:44Z"
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

Używaj GitHub Security Advisories do zgłaszania luk w zabezpieczeniach samego ClawHub. Dobre
zgłoszenia doradcze ClawHub obejmują błędy w:

- witrynie ClawHub, API lub CLI
- publikowaniu w rejestrze, pobieraniu, instalacjach lub integralności artefaktów
- uwierzytelnianiu, autoryzacji lub tokenach API
- skanowaniu, moderacji lub obsłudze zgłoszeń

Nie używaj doradztw ClawHub do zgłaszania luk w zabezpieczeniach własnego kodu źródłowego zewnętrznej umiejętności lub
Plugin. Zgłaszaj je bezpośrednio wydawcy lub do repozytorium źródłowego
podlinkowanego w wpisie ClawHub.

## Ujawnianie luk w zabezpieczeniach

Ponieważ ClawHub jest hostowaną aplikacją chmurową, luki w zabezpieczeniach usługi ClawHub
domyślnie nie są ujawniane publicznie. Są ujawniane publicznie, gdy istnieją
dowody rzeczywistego wpływu na użytkowników lub gdy użytkownicy muszą podjąć działania.

Przykłady rzeczywistego wpływu na użytkowników obejmują potwierdzone wykorzystanie luki, ujawnienie danych
użytkowników lub sekretów, dotarcie złośliwych treści do użytkowników z powodu awarii platformy
lub każdy problem wymagający od użytkowników rotacji poświadczeń, aktualizacji lokalnego oprogramowania albo
podjęcia innych działań ochronnych.

Luki w zabezpieczeniach oprogramowania instalowanego przez użytkowników są ujawniane publicznie, na przykład
pakietów CLI ClawHub, plików binarnych, bibliotek lub innych artefaktów wydania, które użytkownicy
muszą zaktualizować lokalnie.

## Powiązane strony

Informacje o etykietach audytu podczas instalacji, poziomach ryzyka, ustaleniach i interpretacji znajdziesz w
[Audytach bezpieczeństwa](/pl/clawhub/security-audits).

Informacje o zgłoszeniach marketplace, wstrzymaniach moderacyjnych, ukrytych wpisach, blokadach i statusie
konta znajdziesz w [Moderacji i bezpieczeństwie konta](/pl/clawhub/moderation).
