---
read_when:
    - ClawHub-CLI- oder OpenClaw-Registry-Befehle schlagen fehl
    - Ein Paket kann nicht installiert, veröffentlicht oder aktualisiert werden
summary: Fehlerbehebung bei Problemen mit ClawHub-Anmeldung, Installation, Veröffentlichung, Aktualisierung und API.
x-i18n:
    generated_at: "2026-07-12T15:10:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fc789fcc891cf8c44b5d1a10d38a4e6dd4dec9474d8d13f8058ea1c3392a9f91
    source_path: clawhub/troubleshooting.md
    workflow: 16
---

# Fehlerbehebung

## `clawhub login` öffnet einen Browser, wird aber nie abgeschlossen

Die CLI startet während der Browseranmeldung einen kurzlebigen lokalen Callback-Server.

- Stellen Sie sicher, dass Ihr Browser `http://127.0.0.1:<port>/callback` erreichen kann.
- Prüfen Sie die Regeln der lokalen Firewall, des VPN und des Proxys, wenn der Callback nie eintrifft.
- Erstellen Sie in Umgebungen ohne grafische Benutzeroberfläche ein API-Token in der ClawHub-Weboberfläche und führen Sie Folgendes aus:

```bash
clawhub login --token clh_...
```

## `whoami` oder `publish` gibt `Unauthorized` (401) zurück

- Melden Sie sich mit `clawhub login` erneut an.
- Wenn Sie einen benutzerdefinierten Konfigurationspfad verwenden, vergewissern Sie sich, dass `CLAWHUB_CONFIG_PATH` auf die
  Datei verweist, die Ihr aktuelles Token enthält.
- Wenn Sie ein API-Token verwenden, vergewissern Sie sich, dass es nicht in der Weboberfläche widerrufen wurde.

## Suche oder Installation gibt `Rate limit exceeded` (429) zurück

Lesen Sie die Wiederholungsinformationen in der Antwort:

- `Retry-After`: Anzahl der Sekunden, die vor einem erneuten Versuch gewartet werden muss.
- `RateLimit-Limit`: das für diese Anfrage geltende Limit.
- `RateLimit-Remaining`: Ihr exakt verbleibendes Kontingent, wenn der Header vorhanden ist. Bei `429` beträgt es `0`.
- `RateLimit-Reset` oder `X-RateLimit-Reset`: Zeitpunkt der Zurücksetzung.

Wenn viele Benutzer dieselbe ausgehende IP-Adresse verwenden, können anonyme IP-Limits erreicht werden, selbst wenn jede
Person nur wenige Anfragen sendet. Melden Sie sich nach Möglichkeit an und versuchen Sie es nach der
angegebenen Wartezeit erneut.

## Suche oder Installation schlägt hinter einem Proxy fehl

Die CLI berücksichtigt die standardmäßigen Proxy-Variablen:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
clawhub search "my query"
```

Zu den unterstützten Namen gehören `HTTPS_PROXY`, `HTTP_PROXY`, `https_proxy` und
`http_proxy`.

## Ein Skill erscheint nicht in der Suche

- Prüfen Sie den genauen Slug oder die Eigentümerseite, falls er Ihnen bekannt ist.
- Vergewissern Sie sich, dass die Veröffentlichung öffentlich ist und nicht aufgrund einer Prüfung oder Moderation zurückgehalten wird.
- Wenn Ihnen der Skill gehört, melden Sie sich an und überprüfen Sie ihn:

```bash
clawhub inspect @openclaw/demo
```

Für Eigentümer sichtbare Diagnosedaten können den Status der Prüfung, der Upload-Sperre oder der Moderation erläutern.

## Die Veröffentlichung schlägt fehl, weil erforderliche Metadaten fehlen

Prüfen Sie bei Skills das Frontmatter in `SKILL.md`. Erforderliche Umgebungsvariablen und
Tools sollten deklariert werden, damit Benutzer und Scanner das Paket verstehen können.

Prüfen Sie bei Plugins die Kompatibilitätsmetadaten in `package.json`. Veröffentlichungen von Code-Plugins
benötigen OpenClaw-Kompatibilitätsfelder wie `openclaw.compat.pluginApi` und
`openclaw.build.openclawVersion`.

Zeigen Sie zuerst eine Vorschau der Veröffentlichungsnutzlast an:

```bash
clawhub package publish <source> --family code-plugin --dry-run
```

## Die Veröffentlichung schlägt aufgrund eines GitHub-Eigentümer- oder Quellfehlers fehl

ClawHub verwendet die GitHub-Identität und Quellenzuordnung, um Pakete ihren
Herausgebern zuzuordnen.

- Stellen Sie sicher, dass Sie mit dem GitHub-Konto angemeldet sind, dem das Paket gehört oder das es veröffentlichen
  darf.
- Prüfen Sie, ob die Quell-URL öffentlich oder für ClawHub zugänglich ist.
- Verwenden Sie für GitHub-Quellen `owner/repo`, `owner/repo@ref` oder eine vollständige GitHub-URL.

## Die Veröffentlichung schlägt fehl, weil ein Namespace beansprucht oder reserviert ist

Wenn eine Veröffentlichung fehlschlägt, weil das Eigentümerkürzel, der Organisations-Namespace, der Paketbereich, der Skill-
Slug oder der Paketname bereits beansprucht oder reserviert ist, vergewissern Sie sich zunächst, dass Sie
mit dem Eigentümer veröffentlichen, der dem Namespace entspricht. Bei Plugin-Paketen
müssen Bereichsnamen wie `@example-org/example-plugin` unter dem entsprechenden
Eigentümer `example-org` veröffentlicht werden.

Wenn Sie der Ansicht sind, dass Ihre Organisation, Ihr Projekt oder Ihre Marke der rechtmäßige Eigentümer des Namespace ist, Sie
den aktuellen ClawHub-Eigentümer jedoch nicht verwalten können, erstellen Sie ein
[Ticket zur Beanspruchung einer Organisation/eines Namespace](https://github.com/openclaw/clawhub/issues/new?template=org-namespace-claim.yml)
mit öffentlichen, nicht vertraulichen Nachweisen. Unter
[Beanspruchung von Organisationen und Namespaces](/clawhub/namespace-claims) finden Sie Hinweise zu Nachweisen und dazu, welche
Informationen nicht in öffentliche Tickets gehören.

## `sync` meldet, dass keine Skills gefunden wurden

`sync` sucht nach Ordnern, die `SKILL.md` oder `skill.md` enthalten.

Geben Sie die Stammverzeichnisse an, die Sie durchsuchen möchten:

```bash
clawhub sync --root /path/to/skills
```

Zeigen Sie zuerst eine Vorschau an, wenn Sie unsicher sind, was veröffentlicht wird:

```bash
clawhub sync --all --dry-run --no-input
```

## `update` wird aufgrund lokaler Änderungen verweigert

Die lokalen Dateien entsprechen keiner ClawHub bekannten Version. Wählen Sie eine Option:

- Behalten Sie die lokalen Änderungen bei und überspringen Sie die Aktualisierung.
- Überschreiben Sie sie mit der veröffentlichten Version:

```bash
clawhub update @openclaw/demo --force
```

- Veröffentlichen Sie Ihre bearbeitete Kopie unter einem neuen Slug oder als Fork.

## Die Installation eines Plugins in OpenClaw schlägt fehl

- Verwenden Sie eine explizite ClawHub-Quelle:

```bash
openclaw plugins install clawhub:<package>
```

- Prüfen Sie auf der Detailseite des Pakets den Prüfstatus und die Kompatibilitätsmetadaten.
- Vergewissern Sie sich, dass Ihre OpenClaw-Version den angegebenen
  Kompatibilitätsbereich des Pakets erfüllt.
- Wenn das Paket ausgeblendet, zurückgehalten oder gesperrt ist, kann es möglicherweise erst installiert werden,
  nachdem der Eigentümer das Problem behoben hat.

## Anfragen an die öffentliche API schlagen fehl

- Beachten Sie die Wiederholungs-Header bei `429` und speichern Sie Antworten öffentlicher Listen- und Suchanfragen im Cache.
- Verweisen Sie Benutzer auf den kanonischen ClawHub-Eintrag.
- Spiegeln Sie keine ausgeblendeten, privaten, zurückgehaltenen oder durch Moderation gesperrten Inhalte außerhalb der
  öffentlichen API-Oberfläche.

Weitere Informationen zu Endpunkten finden Sie unter [HTTP-API](/clawhub/http-api).
