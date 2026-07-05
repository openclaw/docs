---
read_when:
    - Beanspruchen einer Organisation, Marke, eines Paket-Scopes, Inhaber-Handles, Skill-Slugs oder Paket-Namespace
    - Auflösen eines Namespace, der bereits beansprucht oder reserviert ist
    - Entscheiden, ob ein Bericht, Einspruch oder Namespace-Anspruch verwendet werden soll
sidebarTitle: Org and Namespace Claims
summary: So beantragen Sie eine ClawHub-Prüfung bei Streitfällen zur Inhaberschaft von Organisation, Marke, Owner-Handle, Package-Scope, Skill-Slug oder Namespace.
title: Org- und Namespace-Ansprüche
x-i18n:
    generated_at: "2026-07-05T05:40:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77a4d8090b55298c401154d116d93d4f8139d40983a45982288d8e48bcea40fb
    source_path: clawhub/namespace-claims.md
    workflow: 16
---

# Organisations- und Namespace-Ansprüche

ClawHub verwendet Inhaber-Handles, Organisations-Handles, Skill-Slugs, Plugin-Paketnamen und
Paket-Scopes als öffentliche Namespaces. Wenn ein Namespace zu einem
realen Projekt, einer Marke, einem Paket-Ökosystem oder einer Organisation zu gehören scheint,
aber auf ClawHub bereits beansprucht, reserviert, irreführend oder umstritten ist, bitten Sie Mitarbeitende um Prüfung
über das
[Organisations-/Namespace-Anspruchsformular](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml).

Verwenden Sie diesen Weg für öffentliche, nicht sensible Eigentumsprüfungen. Verwenden Sie keine produktinternen
Meldungen oder das Konto-Einspruchsformular für Namespace-Ansprüche.

## Wann Sie einen Anspruch einreichen sollten

Reichen Sie einen Namespace-Anspruch ein, wenn Sie der Meinung sind, dass ClawHub-Mitarbeitende prüfen sollten, ob ein
Namespace aufgrund realer Eigentumsverhältnisse reserviert, übertragen, umbenannt, ausgeblendet, in Quarantäne verschoben, mit Alias versehen
oder anderweitig geändert werden sollte.

Beispiele:

- ein Organisations-Handle, das Ihrer GitHub-Organisation, Ihrem Projekt, Unternehmen oder Ihrer Community entspricht
- ein Paket-Scope wie `@example-org/*`, das nur unter dem
  passenden ClawHub-Inhaber veröffentlichen sollte
- ein Skill-Slug oder Plugin-Paketname, der ein Projekt zu imitieren scheint
- ein Streit über eine Marke, ein Warenzeichen, eine Projektumbenennung oder eine Pakethistorie
- ein gelöschter, inaktiver oder unerreichbarer Inhaber, der den rechtmäßigen Namespace-Inhaber
  blockiert

Wenn der Eintrag über den Eigentumsstreit hinaus unsicher, bösartig oder irreführend ist,
befolgen Sie zusätzlich die relevante Moderations- oder Sicherheitsanleitung. Das Namespace-Anspruchsformular
dient der Eigentumsprüfung, nicht der dringenden Offenlegung von Schwachstellen.

## Vor dem Einreichen

Bestätigen Sie zuerst, dass Sie mit dem Inhaber veröffentlichen, der zum Namespace passt.
Bei Plugin-Paketen müssen scoped Namen wie `@example-org/example-plugin` als
passender Inhaber `example-org` veröffentlicht werden.

Wenn Sie den aktuellen Inhaber verwalten können, korrigieren Sie den Namespace direkt durch Veröffentlichen,
Umbenennen, Übertragen, Ausblenden oder Löschen der betroffenen Ressource. Verwenden Sie einen Anspruch,
wenn Sie den aktuellen Inhaber nicht verwalten können oder wenn Mitarbeitende einen
Streit klären müssen.

## Belege, die Sie angeben sollten

Verwenden Sie öffentliche, nicht sensible Belege. Hilfreiche Nachweise sind:

- GitHub-Organisation, Repository, Release oder Maintainer-Historie
- offizielle Projektdokumentation, die den Namespace nennt
- Nachweis über Domain oder offizielle E-Mail-Domain
- Kontrolle über npm-, PyPI-, crates.io- oder andere Paket-Registry-Scopes
- Nachweise zu Warenzeichen, Marke oder Projekteigentum, die öffentlich besprochen werden können
- Quell-Repository-Historie, Pakethistorie oder öffentliche Umbenennungshinweise
- Links zum umstrittenen ClawHub-Inhaber, Skill, Plugin, Paket oder Issue

Erklären Sie, was jeder Link belegt. Mitarbeitende sollten die
Beziehung verstehen können, ohne private Zugangsdaten oder Secrets zu benötigen.

## Was Sie nicht angeben sollten

Veröffentlichen Sie keine Secrets oder privaten Nachweise in einem öffentlichen GitHub-Issue. Geben Sie Folgendes nicht an:

- API-Tokens, Signaturschlüssel oder Zugangsdaten
- DNS-Challenge-Tokens
- private Rechtsdokumente oder Verträge
- persönliche Identitätsdokumente
- private E-Mails, private Sicherheitsberichte oder vertrauliche Kundendaten

Das Anspruchsformular fragt, ob sensible Belege einen privaten Kanal zu Mitarbeitenden benötigen.
Verwenden Sie diese Option, anstatt sensibles Material öffentlich zu posten.

## Mögliche Ergebnisse

Je nach Belegen und Risiko können ClawHub-Mitarbeitende einen Namespace reservieren,
Eigentum übertragen, eine Ressource umbenennen, einen bestehenden Eintrag ausblenden oder in Quarantäne verschieben,
ein Alias oder eine Weiterleitung hinzufügen, weitere Nachweise anfordern oder die Anfrage ablehnen.

Die Namespace-Prüfung garantiert nicht, dass jeder passende Name übertragen wird.
Mitarbeitende wägen öffentliche Belege, bestehende Nutzung, Sicherheitsrisiko und Auswirkungen auf Nutzer ab.

## Zugehörige Dokumentation

- [Veröffentlichen](/de/clawhub/publishing)
- [Fehlerbehebung](/clawhub/troubleshooting#publish-fails-because-a-namespace-is-claimed-or-reserved)
- [Moderation und Kontosicherheit](/clawhub/moderation)
- [Sicherheit](/clawhub/security)
