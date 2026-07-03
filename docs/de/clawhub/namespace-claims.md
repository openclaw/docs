---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Owner-Handles, Skill-Slugs oder Paket-Namespace
    - Auflösen eines bereits beanspruchten oder reservierten Namespace
    - Entscheiden, ob ein Bericht, ein Einspruch oder ein Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So fordern Sie eine ClawHub-Prüfung für Streitigkeiten über die Inhaberschaft von Organisationen, Marken, Owner-Handles, Package-Scopes, Skill-Slugs oder Namespaces an.
title: Organisations- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-03T09:29:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisations- und Namespace-Ansprüche

ClawHub verwendet Owner-Handles, Organisations-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace zu einem
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu gehören scheint, aber auf ClawHub bereits
beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie das Team, ihn mit dem
[Org-/Namespace-Anspruch-Issue-Formular](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml) zu prüfen.

Verwenden Sie diesen Weg für öffentliche, nicht sensible Eigentumsprüfungen. Verwenden Sie für Namespace-Ansprüche keine produktinternen
Meldungen und nicht das Formular für Konto-Einsprüche.

## Wann ein Anspruch geöffnet werden sollte

Öffnen Sie einen Namespace-Anspruch, wenn Sie der Ansicht sind, dass das ClawHub-Team prüfen sollte, ob ein
Namespace aufgrund realer Eigentumsverhältnisse reserviert, übertragen, umbenannt, ausgeblendet, isoliert, aliasiert
oder anderweitig geändert werden sollte.

Beispiele:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Ihrem Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, das nur unter dem
  passenden ClawHub-Owner veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- eine Streitigkeit zu Marke, Warenzeichen, Projektumbenennung oder Pakethistorie
- ein gelöschter, inaktiver oder nicht erreichbarer Owner, der den rechtmäßigen Namespace-Owner blockiert

Wenn der Eintrag über die Eigentumsstreitigkeit hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie zusätzlich die relevante Moderations- oder Sicherheitsanleitung. Das Namespace-Anspruchsformular
dient der Eigentumsprüfung, nicht der Notfallmeldung von Schwachstellen.

## Bevor Sie einreichen

Bestätigen Sie zuerst, dass Sie mit dem Owner veröffentlichen, der zum Namespace passt.
Bei Plugin-Paketen müssen Scoped Names wie `@example-org/example-plugin` als
passender Owner `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Owner verwalten können, beheben Sie den Namespace direkt, indem Sie
die betroffene Ressource veröffentlichen, umbenennen, übertragen, ausblenden oder löschen. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Owner nicht verwalten können oder wenn das Team eine
Streitigkeit klären muss.

## Belege, die Sie angeben sollten

Verwenden Sie öffentliche, nicht sensible Belege. Hilfreiche Nachweise sind unter anderem:

- GitHub-Organisations-, Repository-, Release- oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Domain- oder offizieller E-Mail-Domain-Nachweis
- Kontrolle über Scopes in npm, PyPI, crates.io oder anderen Paket-Registries
- Warenzeichen-, Marken- oder Projekteigentumsnachweise, die öffentlich besprochen werden können
- Quell-Repository-Historie, Pakethistorie oder öffentliche Hinweise auf Umbenennungen
- Links zum umstrittenen ClawHub-Owner, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Das Team sollte die
Beziehung verstehen können, ohne private Zugangsdaten oder Geheimnisse zu benötigen.

## Was Sie nicht angeben sollten

Veröffentlichen Sie keine Geheimnisse oder privaten Nachweise in einem öffentlichen GitHub-Issue. Geben Sie Folgendes nicht an:

- API-Tokens, Signaturschlüssel oder Zugangsdaten
- DNS-Challenge-Tokens
- private Rechtsdokumente oder Verträge
- persönliche Ausweisdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Belege einen privaten Kanal zum Team benötigen.
Verwenden Sie diese Option, statt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Belegen und Risiko kann das ClawHub-Team einen Namespace reservieren,
Eigentum übertragen, eine Ressource umbenennen, einen bestehenden Eintrag ausblenden oder isolieren,
einen Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen wird.
Das Team wägt öffentliche Belege, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Benutzer ab.

## Zugehörige Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
