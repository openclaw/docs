---
read_when:
    - ClawHub-CLI- oder OpenClaw-Registry-Befehle schlagen fehl
    - Ein Paket kann nicht installiert, veröffentlicht oder aktualisiert werden
summary: Fehlerbehebung bei ClawHub-Anmeldung, Installation, Veröffentlichung, Aktualisierung und API-Problemen.
x-i18n:
    generated_at: "2026-06-30T13:53:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Fehlerbehebung

## `clawhub login` öffnet einen Browser, wird aber nie abgeschlossen

Die CLI startet während der Browser-Anmeldung einen kurzlebigen lokalen Callback-Server.

- Stellen Sie sicher, dass Ihr Browser `http://127.0.0.1:<port>/callback` erreichen kann.
- Prüfen Sie lokale Firewall-, VPN- und Proxy-Regeln, wenn der Callback nie ankommt.
- Erstellen Sie in Headless-Umgebungen ein API-Token in der ClawHub-Weboberfläche und führen Sie aus:

```bash
clawhub login --token clh_...
```

## `whoami` oder `publish` gibt `Unauthorized` (401) zurück

- Melden Sie sich mit `clawhub login` erneut an.
- Wenn Sie einen benutzerdefinierten Konfigurationspfad verwenden, bestätigen Sie, dass `CLAWHUB_CONFIG_PATH` auf die
  Datei verweist, die Ihr aktuelles Token enthält.
- Wenn Sie ein API-Token verwenden, bestätigen Sie, dass es in der Weboberfläche nicht widerrufen wurde.

## Suche oder Installation gibt `Rate limit exceeded` (429) zurück

Lesen Sie die Wiederholungsinformationen in der Antwort:

- `Retry-After`: Sekunden, die vor einem erneuten Versuch gewartet werden sollen.
- `RateLimit-Limit`: das auf diese Anfrage angewendete Limit.
- `RateLimit-Remaining`: Ihr genau verbleibendes Kontingent, wenn der Header vorhanden ist. Bei `429` ist es `0`.
- `RateLimit-Reset` oder `X-RateLimit-Reset`: Zeitpunkt der Zurücksetzung.

Wenn viele Benutzer eine Egress-IP gemeinsam nutzen, können anonyme IP-Limits erreicht werden, selbst wenn jede
Person nur wenige Anfragen sendet. Melden Sie sich nach Möglichkeit an und versuchen Sie es nach der
gemeldeten Verzögerung erneut.

## Suche oder Installation schlägt hinter einem Proxy fehl

Die CLI berücksichtigt Standard-Proxy-Variablen:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Unterstützte Namen sind unter anderem `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` und
`http_proxy`.

## Ein Skill erscheint nicht in der Suche

- Prüfen Sie den exakten Slug oder die Owner-Seite, falls Sie sie kennen.
- Bestätigen Sie, dass das Release öffentlich ist und nicht durch Scan oder Moderation zurückgehalten wird.
- Wenn Ihnen der Skill gehört, melden Sie sich an und prüfen Sie ihn:

```bash
clawhub inspect @openclaw/demo
```

Für Owner sichtbare Diagnosen können Scan-, Upload-Gate- oder Moderationsstatus erklären.

## Veröffentlichen schlägt fehl, weil erforderliche Metadaten fehlen

Prüfen Sie bei Skills das Frontmatter von `SKILL.md`. Erforderliche Umgebungsvariablen und
Tools sollten deklariert sein, damit Benutzer und Scanner das Paket verstehen können.

Prüfen Sie bei Plugins die Kompatibilitätsmetadaten in `package.json`. Veröffentlichungen von Code-Plugins
benötigen OpenClaw-Kompatibilitätsfelder wie `openclaw.compat.pluginApi` und
`openclaw.build.openclawVersion`.

Zeigen Sie zuerst eine Vorschau des Veröffentlichungs-Payloads an:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Veröffentlichen schlägt mit einem GitHub-Owner- oder Quellfehler fehl

ClawHub verwendet GitHub-Identität und Quellenzuordnung, um Pakete mit ihren
Publishern zu verbinden.

- Stellen Sie sicher, dass Sie mit dem GitHub-Konto angemeldet sind, dem das Paket gehört oder das es veröffentlichen darf.
- Prüfen Sie, ob die Quell-URL öffentlich oder für ClawHub zugänglich ist.
- Verwenden Sie für GitHub-Quellen `owner/repo`, `owner/repo@ref` oder eine vollständige GitHub-URL.

## Veröffentlichen schlägt fehl, weil ein Namespace beansprucht oder reserviert ist

Wenn eine Veröffentlichung fehlschlägt, weil das Owner-Handle, der Organisations-Namespace, der Paket-Scope, der Skill-
Slug oder der Paketname bereits beansprucht oder reserviert ist, bestätigen Sie zuerst, dass Sie
mit dem Owner veröffentlichen, der zum Namespace passt. Für Plugin-Pakete müssen
Scoped Names wie `@example-org/example-plugin` als passender Owner `example-org`
veröffentlicht werden.

Wenn Sie glauben, dass Ihre Organisation, Ihr Projekt oder Ihre Marke der rechtmäßige Namespace-Owner ist, Sie aber
den aktuellen ClawHub-Owner nicht verwalten können, öffnen Sie ein
[Org-/Namespace-Claim-Issue](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
mit öffentlichem, nicht sensiblem Nachweis. Siehe
[Org- und Namespace-Claims](/clawhub/namespace-claims) für Hinweise zu Nachweisen und dazu, was
nicht in öffentliche Issues gehört.

## `sync` meldet, dass keine Skills gefunden wurden

`sync` sucht nach Ordnern, die `SKILL.md` oder `skill.md` enthalten.

Verweisen Sie auf die Wurzeln, die Sie scannen möchten:

```bash
clawhub sync --root /path/to/skills
```

Zeigen Sie zuerst eine Vorschau an, wenn Sie unsicher sind, was veröffentlicht wird:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` verweigert wegen lokaler Änderungen

Die lokalen Dateien stimmen mit keiner Version überein, die ClawHub kennt. Wählen Sie eine Option:

- Lokale Änderungen beibehalten und das Update überspringen.
- Mit der veröffentlichten Version überschreiben:

```bash
clawhub update @openclaw/demo --force
```

- Ihre bearbeitete Kopie als neuen Slug oder Fork veröffentlichen.

## Eine Plugin-Installation schlägt in OpenClaw fehl

- Verwenden Sie eine explizite ClawHub-Quelle:

```bash
openclaw plugins install clawhub:<package>
```

- Prüfen Sie die Paketdetailseite auf Scan-Status und Kompatibilitätsmetadaten.
- Bestätigen Sie, dass Ihre OpenClaw-Version den beworbenen
  Kompatibilitätsbereich des Pakets erfüllt.
- Wenn das Paket verborgen, zurückgehalten oder blockiert ist, ist es möglicherweise nicht installierbar, bis
  der Owner das Problem behebt.

## Öffentliche API-Anfragen schlagen fehl

- Beachten Sie die Wiederholungs-Header für `429` und cachen Sie öffentliche Listen-/Suchantworten.
- Verlinken Sie Benutzer zurück auf den kanonischen ClawHub-Eintrag.
- Spiegeln Sie keine verborgenen, privaten, zurückgehaltenen oder moderationsblockierten Inhalte außerhalb der
  öffentlichen API-Oberfläche.

Siehe [HTTP-API](/clawhub/http-api) für Endpoint-Details.
