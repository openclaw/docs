---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paketbereichs, Inhaber-Handles, Skill-Slugs oder Paket-Namensraums
    - Auflösen eines bereits beanspruchten oder reservierten Namensraums
    - Entscheidung, ob Sie eine Meldung, einen Einspruch oder einen Anspruch auf einen Namensraum einreichen sollten
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine Überprüfung durch ClawHub bei Streitigkeiten über die Inhaberschaft von Organisationen, Marken, Inhaber-Handles, Paket-Scopes, Skill-Slugs oder Namespaces.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-12T01:26:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Ansprüche auf Organisationen und Namespaces

ClawHub verwendet Inhaber-Handles, Organisations-Handles, Skill-Slugs, Plugin-Paketnamen und Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace offenbar zu einem realen Projekt, einer Marke, einem Paketökosystem oder einer Organisation gehört, auf ClawHub jedoch bereits beansprucht oder reserviert ist, irreführend verwendet wird oder strittig ist, bitten Sie das zuständige Team über das
[Formular für Ansprüche auf Organisationen/Namespaces](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
um Prüfung.

Nutzen Sie diesen Weg für öffentliche Eigentumsprüfungen, die keine sensiblen Informationen betreffen. Verwenden Sie für Namespace-Ansprüche weder produktinterne Meldungen noch das Formular für Einsprüche gegen Kontoentscheidungen.

## Wann Sie einen Anspruch einreichen sollten

Reichen Sie einen Namespace-Anspruch ein, wenn das ClawHub-Team Ihrer Ansicht nach prüfen sollte, ob ein Namespace aufgrund realer Eigentumsverhältnisse reserviert, übertragen, umbenannt, ausgeblendet, unter Quarantäne gestellt, mit einem Alias versehen oder anderweitig geändert werden sollte.

Beispiele:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Ihrem Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, unter dem ausschließlich der entsprechende ClawHub-Inhaber veröffentlichen dürfen sollte
- ein Skill-Slug oder Plugin-Paketname, der den Anschein erweckt, ein Projekt nachzuahmen
- eine Streitigkeit bezüglich einer Marke, eines Warenzeichens, einer Projektumbenennung oder des Verlaufs eines Pakets
- ein gelöschter, inaktiver oder nicht erreichbarer Inhaber, der den rechtmäßigen Inhaber des Namespaces blockiert

Wenn der Eintrag über den Eigentumsstreit hinaus unsicher, bösartig oder irreführend ist, befolgen Sie zusätzlich die entsprechenden Moderations- oder Sicherheitshinweise. Das Formular für Namespace-Ansprüche dient der Eigentumsprüfung, nicht der dringenden Offenlegung von Sicherheitslücken.

## Vor dem Einreichen

Stellen Sie zunächst sicher, dass Sie unter dem Inhaber veröffentlichen, der dem Namespace entspricht. Bei Plugin-Paketen müssen Namen mit Scope wie `@example-org/example-plugin` unter dem entsprechenden Inhaber `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Inhaber verwalten können, korrigieren Sie den Namespace direkt, indem Sie die betroffene Ressource veröffentlichen, umbenennen, übertragen, ausblenden oder löschen. Reichen Sie einen Anspruch ein, wenn Sie den aktuellen Inhaber nicht verwalten können oder das zuständige Team eine Streitigkeit klären muss.

## Einzureichende Nachweise

Verwenden Sie öffentliche, nicht sensible Nachweise. Hilfreiche Belege umfassen:

- Verlauf der GitHub-Organisation, des Repositorys, der Releases oder der Maintainer
- offizielle Projektdokumentation, in der der Namespace genannt wird
- Nachweis über eine Domain oder offizielle E-Mail-Domain
- Kontrolle über einen Scope bei npm, PyPI, crates.io oder einer anderen Paketregistrierung
- Nachweise für die Inhaberschaft an Warenzeichen, Marken oder Projekten, die öffentlich erörtert werden können
- Verlauf des Quell-Repositorys oder Pakets oder öffentliche Hinweise zur Umbenennung
- Links zum strittigen ClawHub-Inhaber, Skill, Plugin, Paket oder Issue

Erläutern Sie, was jeder Link belegt. Das zuständige Team sollte die Beziehung nachvollziehen können, ohne private Zugangsdaten oder Geheimnisse zu benötigen.

## Was Sie nicht angeben sollten

Veröffentlichen Sie keine Geheimnisse oder privaten Nachweise in einem öffentlichen GitHub-Issue. Geben Sie Folgendes nicht an:

- API-Token, Signaturschlüssel oder Zugangsdaten
- DNS-Challenge-Token
- private Rechtsdokumente oder Verträge
- persönliche Identitätsdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Im Anspruchsformular werden Sie gefragt, ob sensible Nachweise einen privaten Kanal zum zuständigen Team erfordern. Verwenden Sie diese Option, anstatt sensibles Material öffentlich zu veröffentlichen.

## Mögliche Ergebnisse

Je nach Nachweislage und Risiko kann das ClawHub-Team einen Namespace reservieren, die Inhaberschaft übertragen, eine Ressource umbenennen, einen bestehenden Eintrag ausblenden oder unter Quarantäne stellen, einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder den Antrag ablehnen.

Eine Namespace-Prüfung garantiert nicht, dass jeder übereinstimmende Name übertragen wird. Das zuständige Team wägt öffentliche Nachweise, die bestehende Nutzung, Sicherheitsrisiken und die Auswirkungen auf Benutzer ab.

## Zugehörige Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
